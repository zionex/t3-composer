package com.zionex.t3composer.domain.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermission;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3composer.domain.entity.TargetSnapshot;
import com.zionex.t3composer.domain.entity.TargetSnapshotFile;
import com.zionex.t3composer.domain.repository.TargetSnapshotFileRepository;
import com.zionex.t3composer.domain.repository.TargetSnapshotRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Target 스냅샷 복원 — DB → 디스크 동기화.
 *
 * 복원 = 단순 덮어쓰기가 아닌 <b>동기화</b>:
 *  · 스냅샷 파일 → 디스크 생성/덮어쓰기 (해시 동일하면 skip)
 *  · 디스크엔 있고 스냅샷엔 없는 파일 → 삭제 (스냅샷 tracked_roots 범위 내 · exclude 보존)
 *  · 빈 디렉토리 정리
 *  · TB_CMP_TARGET_SYSTEM 행 복원 + 해당 스냅샷을 is_current 로
 *
 * 복원 직전 현재 디스크 상태를 AUTO_BACKUP 스냅샷으로 capture (별도 트랜잭션 — 커밋 후 디스크 작업).
 * 자동 백업 실패 시 복원 전체를 중단한다 (안전망 없는 파괴 금지).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TargetConfigRestoreService {

    private final TargetConfigSnapshotService  snapshotService;
    private final TargetSnapshotRepository     snapshotRepo;
    private final TargetSnapshotFileRepository snapshotFileRepo;
    private final ObjectMapper                 objectMapper;

    /**
     * 스냅샷을 디스크로 복원.
     *
     * @param dryRun true 면 디스크/DB 변경 없이 created/overwritten/deleted 목록만 산출.
     */
    public Map<String, Object> restore(String targetCd, String snapshotId, boolean dryRun) {
        TargetSnapshot snap = snapshotRepo.findById(snapshotId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown snapshot: " + snapshotId));
        if (!snap.getTargetCd().equals(targetCd)) {
            throw new IllegalArgumentException(
                "스냅샷 " + snapshotId + " 은 Target " + snap.getTargetCd()
                + " 소속 — 요청 Target(" + targetCd + ")과 불일치");
        }

        List<TargetSnapshotFile> files = snapshotFileRepo.findBySnapshotId(snapshotId);
        Set<String> trackedRoots = new HashSet<>(parseTrackedRoots(snap.getTrackedRootsJson()));
        Path root = snapshotService.repoRoot();
        if (!Files.isDirectory(root)) {
            throw new IllegalStateException(
                "거버넌스 루트가 디렉토리가 아닙니다: " + root
                + " — docker-compose 의 ./:/workspace/repo:rw 마운트를 확인하세요.");
        }

        // ── 1. 복원 직전 자동 백업 (별도 트랜잭션 커밋 → 디스크 작업 전 안전망) ──
        String autoBackupId = null;
        if (!dryRun) {
            try {
                TargetSnapshot bak = snapshotService.captureSnapshot(targetCd,
                        "복원 직전 자동 백업 (#" + snap.getSnapshotNo() + " 복원 전)",
                        TargetSnapshot.KIND_AUTO_BACKUP);
                autoBackupId = bak.getId();
            } catch (Exception e) {
                throw new IllegalStateException(
                    "복원 직전 자동 백업에 실패하여 복원을 중단합니다 (안전망 미확보): " + e.getMessage(), e);
            }
        }

        Set<String> snapPaths = new HashSet<>();
        for (TargetSnapshotFile f : files) snapPaths.add(f.getRelPath());
        Map<String, Path> disk = snapshotService.collectDiskFiles();

        List<String> created     = new ArrayList<>();
        List<String> overwritten = new ArrayList<>();
        List<String> deleted     = new ArrayList<>();
        List<String> errors      = new ArrayList<>();
        int skipped = 0;

        // ── 2. UPSERT — 스냅샷 파일을 디스크로 ──
        for (TargetSnapshotFile f : files) {
            String rel = f.getRelPath();
            Path target = root.resolve(rel).normalize();
            if (!target.startsWith(root)) {
                errors.add("경로 탈출 차단: " + rel);
                continue;
            }
            try {
                boolean exists = Files.isRegularFile(target);
                String diskHash = exists ? snapshotService.diskContentHash(rel, target) : null;
                if (f.getContentHash().equals(diskHash)) {
                    skipped++;
                    continue;
                }
                if (!dryRun) writeFile(f, target);
                if (exists) overwritten.add(rel); else created.add(rel);
            } catch (Exception e) {
                errors.add(rel + ": " + e.getMessage());
            }
        }

        // ── 3. DELETE — 스냅샷에 없는 디스크 파일 (tracked_roots 범위 · exclude 보존) ──
        for (Map.Entry<String, Path> e : disk.entrySet()) {
            String rel = e.getKey();
            if (snapPaths.contains(rel)) continue;
            if (!trackedRoots.contains(snapshotService.trackedRootOf(rel))) continue; // 범위 밖 보존
            if (snapshotService.isExcluded(rel)) continue;                            // 제외 패턴 보존
            deleted.add(rel);
            if (!dryRun) {
                try {
                    Files.deleteIfExists(e.getValue());
                } catch (IOException ex) {
                    errors.add("삭제 실패 " + rel + ": " + ex.getMessage());
                }
            }
        }

        // ── 4. 빈 디렉토리 정리 (tracked root 디렉토리 하위, root 자체는 유지) ──
        boolean targetRowRestored = false;
        if (!dryRun) {
            for (String tr : trackedRoots) {
                Path base = root.resolve(tr);
                if (Files.isDirectory(base)) removeEmptyDirs(base, base);
            }
            // ── 5. TB_CMP_TARGET_SYSTEM 행 복원 + is_current 지정 (별도 트랜잭션) ──
            snapshotService.applyTargetRowAndMarkCurrent(targetCd, snapshotId);
            targetRowRestored = true;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("ok", errors.isEmpty());
        result.put("dryRun", dryRun);
        result.put("targetCd", targetCd);
        result.put("snapshotId", snapshotId);
        result.put("snapshotNo", snap.getSnapshotNo());
        result.put("autoBackupSnapshotId", autoBackupId);
        result.put("created", created);
        result.put("overwritten", overwritten);
        result.put("deleted", deleted);
        result.put("skipped", skipped);
        result.put("errors", errors);
        result.put("targetRowRestored", targetRowRestored);
        result.put("summary", String.format("생성 %d · 덮어쓰기 %d · 삭제 %d · 변경없음 %d · 오류 %d",
                created.size(), overwritten.size(), deleted.size(), skipped, errors.size()));
        log.info("Target 스냅샷 복원 {}: target={} snapshotNo={} {}",
                dryRun ? "(dryRun)" : "완료", targetCd, snap.getSnapshotNo(), result.get("summary"));
        return result;
    }

    private void writeFile(TargetSnapshotFile f, Path target) throws IOException {
        Path parent = target.getParent();
        if (parent != null) Files.createDirectories(parent);

        if (TargetSnapshotFile.KIND_BINARY.equals(f.getFileKind())) {
            Files.write(target, f.getContentBin() == null ? new byte[0] : f.getContentBin());
        } else if (TargetSnapshotFile.KIND_SECRET.equals(f.getFileKind())) {
            String plain = snapshotService.decryptEnvForRestore(
                    f.getContent() == null ? "" : f.getContent());
            Files.writeString(target, plain, StandardCharsets.UTF_8);
        } else {
            Files.writeString(target, f.getContent() == null ? "" : f.getContent(),
                    StandardCharsets.UTF_8);
        }

        if ("Y".equals(f.getExecutable())) {
            try {
                Set<PosixFilePermission> perms =
                        new HashSet<>(Files.getPosixFilePermissions(target));
                perms.add(PosixFilePermission.OWNER_EXECUTE);
                perms.add(PosixFilePermission.GROUP_EXECUTE);
                perms.add(PosixFilePermission.OTHERS_EXECUTE);
                Files.setPosixFilePermissions(target, perms);
            } catch (Exception ignore) {
                // Windows 또는 POSIX 미지원 마운트 — best-effort
            }
        }
    }

    /** dir 하위의 빈 디렉토리를 bottom-up 으로 제거. keepRoot 자체는 비어도 유지. */
    private void removeEmptyDirs(Path dir, Path keepRoot) {
        List<Path> subDirs = new ArrayList<>();
        try (Stream<Path> s = Files.list(dir)) {
            s.filter(Files::isDirectory).forEach(subDirs::add);
        } catch (IOException e) {
            return;
        }
        for (Path sub : subDirs) removeEmptyDirs(sub, keepRoot);
        if (!dir.equals(keepRoot)) {
            try (Stream<Path> s = Files.list(dir)) {
                if (s.findAny().isEmpty()) Files.delete(dir);
            } catch (IOException ignore) {
                // 비어있지 않거나 삭제 실패 — 무시
            }
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> parseTrackedRoots(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, List.class);
        } catch (Exception e) {
            log.warn("tracked_roots 파싱 실패: {}", e.getMessage());
            return List.of();
        }
    }
}

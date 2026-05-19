package com.zionex.t3composer.domain.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.PathMatcher;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3composer.config.GovernanceSnapshotProperties;
import com.zionex.t3composer.config.TargetDataSourceRegistry;
import com.zionex.t3composer.domain.entity.TargetSnapshot;
import com.zionex.t3composer.domain.entity.TargetSnapshotFile;
import com.zionex.t3composer.domain.entity.TargetSystem;
import com.zionex.t3composer.domain.repository.TargetSnapshotFileRepository;
import com.zionex.t3composer.domain.repository.TargetSnapshotRepository;
import com.zionex.t3composer.domain.repository.TargetSystemRepository;
import com.zionex.t3composer.domain.schema.SchemaMetaCache;
import com.zionex.t3composer.shared.util.SecretCipher;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Target 거버넌스 설정 파일 스냅샷 — capture(파일→DB) · diff(디스크 vs 스냅샷) ·
 * 목록/조회/삭제 + Target 행/현재플래그 복원.
 *
 * 복원(restore)의 디스크 동기화 자체는 {@link TargetConfigRestoreService} 가 담당하되,
 * 복원 직전 자동 백업과 복원 후 정합화는 이 서비스의 메서드를 (별도 빈 프록시 경유로)
 * 호출하여 트랜잭션 경계를 확보한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TargetConfigSnapshotService {

    /** .env 의 마스터키 라인 — 스냅샷에 저장하지 않음 (복원 시 백엔드 메모리 키로 재기록) */
    static final String MASTER_KEY_ENV = "COMPOSER_SNAPSHOT_SECRET_KEY";

    private static final Pattern ENV_LINE =
            Pattern.compile("^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=(.*)$");
    private static final Pattern SECRET_KEY =
            Pattern.compile("(?i).*(KEY|PASSWORD|SECRET|TOKEN|CREDENTIAL).*");

    /** 텍스트로 간주할 확장자 (그 외엔 null-byte 스니프) */
    private static final Set<String> TEXT_EXT = Set.of(
            ".md", ".json", ".txt", ".sh", ".yaml", ".yml", ".sql", ".js", ".jsx",
            ".ts", ".tsx", ".css", ".html", ".xml", ".properties", ".cjs", ".mjs",
            ".csv", ".gitignore", ".awk", ".disabled");

    private final TargetSystemRepository       targetRepo;
    private final TargetSnapshotRepository     snapshotRepo;
    private final TargetSnapshotFileRepository snapshotFileRepo;
    private final GovernanceSnapshotProperties props;
    private final SecretCipher                 cipher;
    private final TargetDataSourceRegistry     dsRegistry;
    private final SchemaMetaCache              schemaMetaCache;
    private final ObjectMapper                 objectMapper;

    /** Primary (composer-db PG) — 직접 SQL (jsonb / is_current 토글) */
    @Qualifier("composerJdbcTemplate")
    private final JdbcTemplate composerDbJdbc;

    // =====================================================================
    // capture — 디스크 → DB 스냅샷
    // =====================================================================

    /**
     * 현재 디스크의 거버넌스 파일 일체를 Target 의 새 스냅샷으로 저장.
     *
     * @param kind MANUAL / SEED → is_current='Y' 로 지정 (기존 current 해제).
     *             AUTO_BACKUP → is_current='N' (백업본).
     */
    @Transactional
    public TargetSnapshot captureSnapshot(String targetCd, String label, String kind) {
        TargetSystem target = targetRepo.findById(targetCd)
                .orElseThrow(() -> new IllegalArgumentException("Unknown target: " + targetCd));

        Path repoRoot = repoRoot();
        if (!Files.isDirectory(repoRoot)) {
            throw new IllegalStateException(
                "거버넌스 루트가 디렉토리가 아닙니다: " + repoRoot
                + " — docker-compose 의 ./:/workspace/repo:rw 마운트를 확인하세요.");
        }

        Map<String, Path> disk = collectDiskFiles();

        int nextNo = snapshotRepo.findFirstByTargetCdOrderBySnapshotNoDesc(targetCd)
                .map(s -> s.getSnapshotNo() + 1).orElse(1);

        TargetSnapshot header = TargetSnapshot.builder()
                .targetCd(targetCd)
                .snapshotNo(nextNo)
                .label(label != null && !label.isBlank() ? label.trim()
                        : (kind + " #" + nextNo))
                .snapshotKind(kind)
                .isCurrent("N")
                .trackedRootsJson(writeJson(effectiveTrackedRoots()))
                .targetRowJson(serializeTargetRow(target))
                .createBy("composer")
                .createDttm(LocalDateTime.now())
                .build();

        List<TargetSnapshotFile> fileRows = new ArrayList<>();
        long totalBytes = 0L;
        for (Map.Entry<String, Path> e : disk.entrySet()) {
            TargetSnapshotFile row = buildFileRow(e.getKey(), e.getValue());
            if (row == null) continue;
            row.setSnapshotId(header.getId());     // null — id 는 save 시 generator 가 채움; 아래서 재설정
            fileRows.add(row);
            if (row.getSizeBytes() != null) totalBytes += row.getSizeBytes();
        }
        header.setFileCount(fileRows.size());
        header.setTotalBytes(totalBytes);

        boolean makeCurrent = TargetSnapshot.KIND_MANUAL.equals(kind)
                           || TargetSnapshot.KIND_SEED.equals(kind);
        if (makeCurrent) {
            // 부분 유니크 인덱스 충돌 방지 — 기존 current 먼저 해제
            composerDbJdbc.update(
                "UPDATE dbo.tb_cmp_target_snapshot SET is_current='N' "
                + "WHERE target_cd=? AND is_current='Y'", targetCd);
            header.setIsCurrent("Y");
        }

        snapshotRepo.save(header);
        for (TargetSnapshotFile row : fileRows) {
            row.setSnapshotId(header.getId());
        }
        snapshotFileRepo.saveAll(fileRows);

        log.info("Target 스냅샷 capture 완료: target={} no={} kind={} files={} bytes={}",
                targetCd, nextNo, kind, fileRows.size(), totalBytes);
        return header;
    }

    /** 한 파일 → 스냅샷 파일 행. 읽기 실패/심볼릭링크는 null. */
    private TargetSnapshotFile buildFileRow(String relPath, Path abs) {
        try {
            if (Files.isSymbolicLink(abs)) {
                log.warn("심볼릭 링크 skip: {}", relPath);
                return null;
            }
            byte[] raw = Files.readAllBytes(abs);
            String trackedRoot = trackedRootOf(relPath);
            boolean executable = isExecutable(relPath, abs);
            boolean secret = isSecretFile(relPath);
            boolean binary = !secret && !isTextContent(abs, raw);

            TargetSnapshotFile.TargetSnapshotFileBuilder b = TargetSnapshotFile.builder()
                    .relPath(relPath)
                    .trackedRoot(trackedRoot)
                    .executable(executable ? "Y" : "N")
                    .sizeBytes((long) raw.length)
                    .createDttm(LocalDateTime.now());

            if (secret) {
                String plain = new String(raw, StandardCharsets.UTF_8);
                b.fileKind(TargetSnapshotFile.KIND_SECRET)
                 .isBinary("N").isEncrypted("Y")
                 .content(encryptEnvSecrets(plain))
                 .contentHash(sha256Hex(normalizeEnvForHash(plain).getBytes(StandardCharsets.UTF_8)));
            } else if (binary) {
                b.fileKind(TargetSnapshotFile.KIND_BINARY)
                 .isBinary("Y").isEncrypted("N")
                 .contentBin(raw)
                 .contentHash(sha256Hex(raw));
            } else {
                b.fileKind(TargetSnapshotFile.KIND_TEXT)
                 .isBinary("N").isEncrypted("N")
                 .content(new String(raw, StandardCharsets.UTF_8))
                 .contentHash(sha256Hex(raw));
            }
            return b.build();
        } catch (IOException ex) {
            log.warn("파일 읽기 실패 — skip ({}): {}", relPath, ex.getMessage());
            return null;
        }
    }

    // =====================================================================
    // diff — 디스크 vs 현재(is_current) 스냅샷
    // =====================================================================

    /** 현재 디스크와 is_current 스냅샷의 차이. {hasSnapshot,inSync,missing,modified,extra,...} */
    public Map<String, Object> computeDiff(String targetCd) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("targetCd", targetCd);

        Optional<TargetSnapshot> cur = snapshotRepo.findByTargetCdAndIsCurrent(targetCd, "Y");
        if (cur.isEmpty()) {
            out.put("hasSnapshot", false);
            out.put("inSync", false);
            out.put("missing", List.of());
            out.put("modified", List.of());
            out.put("extra", List.of());
            return out;
        }
        TargetSnapshot snap = cur.get();
        out.put("hasSnapshot", true);
        out.put("currentSnapshotId", snap.getId());
        out.put("currentSnapshotNo", snap.getSnapshotNo());
        out.put("currentSnapshotLabel", snap.getLabel());

        List<TargetSnapshotFile> snapFiles = snapshotFileRepo.findBySnapshotId(snap.getId());
        Map<String, String> snapHash = new LinkedHashMap<>();
        for (TargetSnapshotFile f : snapFiles) snapHash.put(f.getRelPath(), f.getContentHash());

        Map<String, Path> disk = collectDiskFiles();

        List<String> missing  = new ArrayList<>();   // 스냅샷엔 있고 디스크엔 없음
        List<String> modified = new ArrayList<>();   // 양쪽 있으나 내용 다름
        List<String> extra    = new ArrayList<>();   // 디스크엔 있고 스냅샷엔 없음

        for (Map.Entry<String, String> e : snapHash.entrySet()) {
            Path d = disk.get(e.getKey());
            if (d == null) {
                missing.add(e.getKey());
            } else {
                try {
                    if (!e.getValue().equals(diskContentHash(e.getKey(), d))) {
                        modified.add(e.getKey());
                    }
                } catch (IOException ex) {
                    modified.add(e.getKey());
                }
            }
        }
        for (String rel : disk.keySet()) {
            if (!snapHash.containsKey(rel)) extra.add(rel);
        }

        boolean targetRowChanged = isTargetRowChanged(targetCd, snap);
        boolean inSync = missing.isEmpty() && modified.isEmpty() && extra.isEmpty() && !targetRowChanged;

        out.put("inSync", inSync);
        out.put("missing", missing);
        out.put("modified", modified);
        out.put("extra", extra);
        out.put("targetRowChanged", targetRowChanged);
        out.put("changeCount", missing.size() + modified.size() + extra.size()
                + (targetRowChanged ? 1 : 0));
        return out;
    }

    private boolean isTargetRowChanged(String targetCd, TargetSnapshot snap) {
        try {
            TargetSystem live = targetRepo.findById(targetCd).orElse(null);
            if (live == null || snap.getTargetRowJson() == null) return false;
            String liveJson = serializeTargetRowForCompare(live);
            Map<?, ?> snapMap = objectMapper.readValue(snap.getTargetRowJson(), Map.class);
            // db_password 는 암호문이라 복호화 후 비교
            String snapPw = decryptMaybe((String) snapMap.get("dbPassword"));
            @SuppressWarnings("unchecked")
            Map<String, Object> snapCmp = new LinkedHashMap<>((Map<String, Object>) snapMap);
            snapCmp.put("dbPassword", snapPw);
            return !liveJson.equals(writeJson(new TreeMap<>(snapCmp)));
        } catch (Exception e) {
            log.debug("targetRow 비교 실패 (무시): {}", e.getMessage());
            return false;
        }
    }

    // =====================================================================
    // 목록 / 조회 / 삭제
    // =====================================================================

    public List<Map<String, Object>> listSnapshots(String targetCd) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (TargetSnapshot s : snapshotRepo.findByTargetCdOrderBySnapshotNoDesc(targetCd)) {
            list.add(headerMap(s));
        }
        return list;
    }

    public Map<String, Object> getSnapshotDetail(String snapshotId) {
        TargetSnapshot s = snapshotRepo.findById(snapshotId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown snapshot: " + snapshotId));
        Map<String, Object> out = headerMap(s);
        List<Map<String, Object>> files = new ArrayList<>();
        for (TargetSnapshotFile f : snapshotFileRepo.findBySnapshotId(snapshotId)) {
            Map<String, Object> fm = new LinkedHashMap<>();
            fm.put("relPath",     f.getRelPath());
            fm.put("trackedRoot", f.getTrackedRoot());
            fm.put("fileKind",    f.getFileKind());
            fm.put("isBinary",    "Y".equals(f.getIsBinary()));
            fm.put("isEncrypted", "Y".equals(f.getIsEncrypted()));
            fm.put("executable",  "Y".equals(f.getExecutable()));
            fm.put("contentHash", f.getContentHash());
            fm.put("sizeBytes",   f.getSizeBytes());
            files.add(fm);
        }
        files.sort((a, b) -> String.valueOf(a.get("relPath")).compareTo(String.valueOf(b.get("relPath"))));
        out.put("files", files);
        return out;
    }

    @Transactional
    public void deleteSnapshot(String snapshotId) {
        TargetSnapshot s = snapshotRepo.findById(snapshotId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown snapshot: " + snapshotId));
        if ("Y".equals(s.getIsCurrent())) {
            throw new IllegalStateException("현재(is_current) 스냅샷은 삭제할 수 없습니다. 먼저 다른 스냅샷을 복원하세요.");
        }
        snapshotFileRepo.deleteBySnapshotId(snapshotId);
        snapshotRepo.deleteById(snapshotId);
        log.info("Target 스냅샷 삭제: id={} target={} no={}", snapshotId, s.getTargetCd(), s.getSnapshotNo());
    }

    private Map<String, Object> headerMap(TargetSnapshot s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",           s.getId());
        m.put("targetCd",     s.getTargetCd());
        m.put("snapshotNo",   s.getSnapshotNo());
        m.put("label",        s.getLabel());
        m.put("snapshotKind", s.getSnapshotKind());
        m.put("isCurrent",    "Y".equals(s.getIsCurrent()));
        m.put("fileCount",    s.getFileCount());
        m.put("totalBytes",   s.getTotalBytes());
        m.put("comment",      s.getComment());
        m.put("createBy",     s.getCreateBy());
        m.put("createDttm",   s.getCreateDttm());
        return m;
    }

    // =====================================================================
    // 복원 정합화 — TargetConfigRestoreService 가 프록시 경유로 호출 (트랜잭션 확보)
    // =====================================================================

    /** 복원 후 TB_CMP_TARGET_SYSTEM 행 복원 + 해당 스냅샷을 is_current='Y'. */
    @Transactional
    public void applyTargetRowAndMarkCurrent(String targetCd, String snapshotId) {
        TargetSnapshot snap = snapshotRepo.findById(snapshotId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown snapshot: " + snapshotId));
        restoreTargetRow(targetCd, snap.getTargetRowJson());
        composerDbJdbc.update(
            "UPDATE dbo.tb_cmp_target_snapshot SET is_current='N' "
            + "WHERE target_cd=? AND is_current='Y'", targetCd);
        composerDbJdbc.update(
            "UPDATE dbo.tb_cmp_target_snapshot SET is_current='Y' WHERE id=?", snapshotId);
        dsRegistry.invalidate(targetCd);
        schemaMetaCache.evict(targetCd);
    }

    @SuppressWarnings("unchecked")
    private void restoreTargetRow(String targetCd, String targetRowJson) {
        if (targetRowJson == null || targetRowJson.isBlank()) return;
        Map<String, Object> row;
        try {
            row = objectMapper.readValue(targetRowJson, Map.class);
        } catch (Exception e) {
            log.warn("targetRowJson 파싱 실패 — TB_CMP_TARGET_SYSTEM 행 복원 skip: {}", e.getMessage());
            return;
        }
        List<String> sets = new ArrayList<>();
        List<Object> args = new ArrayList<>();
        putSet(sets, args, "target_name",      row.get("targetName"));
        putSet(sets, args, "description",      row.get("description"));
        putSet(sets, args, "db_type",          row.get("dbType"));
        putSet(sets, args, "db_dialect_class", row.get("dbDialectClass"));
        putSet(sets, args, "frontend_stack",   row.get("frontendStack"));
        putSet(sets, args, "grid_library",     row.get("gridLibrary"));
        putSet(sets, args, "css_framework",    row.get("cssFramework"));
        putJsonbSet(sets, args, "module_codes",    row.get("moduleCodesJson"));
        putJsonbSet(sets, args, "ref_paths",       row.get("refPathsJson"));
        putJsonbSet(sets, args, "artifact_naming", row.get("artifactNamingJson"));
        putSet(sets, args, "is_active",        row.get("isActive"));
        putSet(sets, args, "sort_order",       row.get("sortOrder"));
        putSet(sets, args, "db_url",           row.get("dbUrl"));
        putSet(sets, args, "db_username",      row.get("dbUsername"));
        putSet(sets, args, "db_password",      decryptMaybe((String) row.get("dbPassword")));
        putSet(sets, args, "db_driver_class",  row.get("dbDriverClass"));
        putSet(sets, args, "source_ref_path",  row.get("sourceRefPath"));
        putSet(sets, args, "database_ref_path", row.get("databaseRefPath"));
        putSet(sets, args, "menu_source",      row.get("menuSource"));
        sets.add("modify_by='composer'");
        sets.add("modify_dttm=now()");
        args.add(targetCd);
        composerDbJdbc.update(
            "UPDATE dbo.tb_cmp_target_system SET " + String.join(", ", sets) + " WHERE target_cd=?",
            args.toArray());
        log.info("TB_CMP_TARGET_SYSTEM 행 복원: target={}", targetCd);
    }

    private static void putSet(List<String> sets, List<Object> args, String col, Object val) {
        sets.add(col + "=?");
        args.add(val);
    }

    /** jsonb 컬럼 — null 은 SQL 리터럴 NULL (파라미터 타입 추론 실패 회피), 값은 ?::jsonb */
    private static void putJsonbSet(List<String> sets, List<Object> args, String col, Object val) {
        if (val == null) {
            sets.add(col + "=NULL");
        } else {
            sets.add(col + "=?::jsonb");
            args.add(val.toString());
        }
    }

    // =====================================================================
    // 파일 수집 — capture / diff / restore 공용
    // =====================================================================

    public Path repoRoot() {
        return Paths.get(props.getRepoRoot()).toAbsolutePath().normalize();
    }

    /** 거버넌스 루트 하위의 추적 대상 파일 전체. relPath('/') → 절대 Path. 정렬됨. */
    public Map<String, Path> collectDiskFiles() {
        Path root = repoRoot();
        TreeMap<String, Path> out = new TreeMap<>();

        for (String dir : props.getTrackedRoots()) {
            Path base = root.resolve(dir);
            if (!Files.isDirectory(base)) continue;
            try (Stream<Path> walk = Files.walk(base)) {
                walk.filter(Files::isRegularFile)
                    .filter(p -> !isSymlink(p))
                    .forEach(p -> {
                        String rel = toRel(root, p);
                        if (rel != null && !isExcluded(rel)) out.put(rel, p);
                    });
            } catch (IOException e) {
                log.warn("디렉토리 walk 실패 ({}): {}", base, e.getMessage());
            }
        }
        for (String f : props.getTrackedFiles()) {
            Path p = root.resolve(f);
            if (Files.isRegularFile(p) && !isSymlink(p)) {
                String rel = toRel(root, p);
                if (rel != null && !isExcluded(rel)) out.put(rel, p);
            }
        }
        return out;
    }

    private static boolean isSymlink(Path p) {
        return Files.isSymbolicLink(p);
    }

    /** root 하위면 '/' 상대경로, 아니면 null (탈출 방어). */
    private static String toRel(Path root, Path p) {
        Path abs = p.toAbsolutePath().normalize();
        if (!abs.startsWith(root)) return null;
        return root.relativize(abs).toString().replace('\\', '/');
    }

    public boolean isExcluded(String relPath) {
        for (String glob : props.getExcludeGlobs()) {
            PathMatcher m = FileSystems.getDefault().getPathMatcher("glob:" + glob);
            if (m.matches(Paths.get(relPath))) return true;
        }
        return false;
    }

    public boolean isSecretFile(String relPath) {
        return props.getSecretFiles().contains(relPath);
    }

    /** relPath 의 소속 tracked root (디렉토리 root 또는 개별 파일 자신). */
    public String trackedRootOf(String relPath) {
        for (String r : props.getTrackedRoots()) {
            if (relPath.equals(r) || relPath.startsWith(r + "/")) return r;
        }
        for (String f : props.getTrackedFiles()) {
            if (relPath.equals(f)) return f;
        }
        return relPath;
    }

    /** capture 한 스냅샷의 tracked_roots = 설정된 디렉토리 root + 개별 파일. */
    public List<String> effectiveTrackedRoots() {
        Set<String> s = new LinkedHashSet<>();
        s.addAll(props.getTrackedRoots());
        s.addAll(props.getTrackedFiles());
        return new ArrayList<>(s);
    }

    private boolean isExecutable(String relPath, Path abs) {
        String name = abs.getFileName().toString().toLowerCase();
        for (String ext : props.getExecutableExtensions()) {
            if (name.endsWith(ext.toLowerCase())) return true;
        }
        try {
            return Files.isExecutable(abs);
        } catch (Exception e) {
            return false;
        }
    }

    /** 확장자 화이트리스트 우선, 미지정이면 앞 8KB null-byte 스니프. */
    private static boolean isTextContent(Path abs, byte[] raw) {
        String name = abs.getFileName().toString().toLowerCase();
        for (String ext : TEXT_EXT) {
            if (name.endsWith(ext)) return true;
        }
        if (name.equals(".env") || name.startsWith(".env.")) return true;
        int limit = Math.min(raw.length, 8192);
        for (int i = 0; i < limit; i++) {
            if (raw[i] == 0) return false;
        }
        return true;
    }

    /** capture/diff/restore 공용 — 디스크 파일의 content_hash (스냅샷 저장값과 동일 규칙). */
    public String diskContentHash(String relPath, Path abs) throws IOException {
        if (isSecretFile(relPath)) {
            String plain = Files.readString(abs, StandardCharsets.UTF_8);
            return sha256Hex(normalizeEnvForHash(plain).getBytes(StandardCharsets.UTF_8));
        }
        return sha256Hex(Files.readAllBytes(abs));
    }

    // =====================================================================
    // .env 시크릿 처리
    // =====================================================================

    private boolean isSecretKey(String key) {
        if (MASTER_KEY_ENV.equals(key)) return false;   // 마스터키는 별도 처리(라인 제거)
        return SECRET_KEY.matcher(key).matches();
    }

    /** .env 평문 → 시크릿 값 ENC(...) 암호화 + 마스터키 라인 제거한 저장용 content. */
    String encryptEnvSecrets(String plaintext) {
        StringBuilder sb = new StringBuilder();
        String[] lines = plaintext.replace("\r\n", "\n").replace("\r", "\n").split("\n", -1);
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            Matcher m = ENV_LINE.matcher(line);
            if (m.matches() && !line.trim().startsWith("#")) {
                String key = m.group(1);
                String val = m.group(2);
                if (MASTER_KEY_ENV.equals(key)) {
                    continue;   // 마스터키 라인은 스냅샷에 저장하지 않음
                }
                if (isSecretKey(key) && val != null && !val.isBlank()) {
                    appendLine(sb, key + "=" + cipher.wrapEncrypt(val));
                    continue;
                }
            }
            appendLine(sb, line);
        }
        return sb.toString();
    }

    /** 저장된 .env content(시크릿 암호화) → 평문 복원 + 마스터키 라인 재기록. */
    public String decryptEnvForRestore(String storedContent) {
        StringBuilder sb = new StringBuilder();
        boolean hasMasterKey = false;
        String[] lines = storedContent.replace("\r\n", "\n").replace("\r", "\n").split("\n", -1);
        for (String line : lines) {
            Matcher m = ENV_LINE.matcher(line);
            if (m.matches() && !line.trim().startsWith("#")) {
                String key = m.group(1);
                String val = m.group(2);
                if (MASTER_KEY_ENV.equals(key)) {
                    hasMasterKey = true;
                }
                if (cipher.isWrapped(val)) {
                    appendLine(sb, key + "=" + cipher.unwrapDecrypt(val));
                    continue;
                }
            }
            appendLine(sb, line);
        }
        // 마스터키 라인 재기록 — 백엔드 메모리 키 (스냅샷엔 저장 안 됨)
        if (!hasMasterKey && cipher.isConfigured()) {
            if (sb.length() > 0 && sb.charAt(sb.length() - 1) != '\n') sb.append('\n');
            sb.append(MASTER_KEY_ENV).append('=').append(cipher.getMasterKey()).append('\n');
        }
        return sb.toString();
    }

    /** content_hash 기준 — 마스터키 라인 제거, 시크릿은 평문 (diff 안정). */
    String normalizeEnvForHash(String plaintext) {
        StringBuilder sb = new StringBuilder();
        String[] lines = plaintext.replace("\r\n", "\n").replace("\r", "\n").split("\n", -1);
        for (String line : lines) {
            Matcher m = ENV_LINE.matcher(line);
            if (m.matches() && !line.trim().startsWith("#")
                    && MASTER_KEY_ENV.equals(m.group(1))) {
                continue;
            }
            appendLine(sb, line);
        }
        return sb.toString();
    }

    private static void appendLine(StringBuilder sb, String line) {
        if (sb.length() > 0) sb.append('\n');
        sb.append(line);
    }

    // =====================================================================
    // TB_CMP_TARGET_SYSTEM 행 직렬화
    // =====================================================================

    private String serializeTargetRow(TargetSystem t) {
        Map<String, Object> m = targetRowMap(t);
        String pw = t.getDbPassword();
        m.put("dbPassword", (pw == null || pw.isBlank()) ? pw : cipher.wrapEncrypt(pw));
        return writeJson(m);
    }

    /** diff 비교용 — db_password 평문, 키 정렬. */
    private String serializeTargetRowForCompare(TargetSystem t) {
        Map<String, Object> m = targetRowMap(t);
        m.put("dbPassword", t.getDbPassword());
        return writeJson(new TreeMap<>(m));
    }

    private static Map<String, Object> targetRowMap(TargetSystem t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("targetName",         t.getTargetName());
        m.put("description",        t.getDescription());
        m.put("dbType",             t.getDbType());
        m.put("dbDialectClass",     t.getDbDialectClass());
        m.put("frontendStack",      t.getFrontendStack());
        m.put("gridLibrary",        t.getGridLibrary());
        m.put("cssFramework",       t.getCssFramework());
        m.put("moduleCodesJson",    t.getModuleCodesJson());
        m.put("refPathsJson",       t.getRefPathsJson());
        m.put("artifactNamingJson", t.getArtifactNamingJson());
        m.put("isActive",           t.getIsActive());
        m.put("sortOrder",          t.getSortOrder());
        m.put("dbUrl",              t.getDbUrl());
        m.put("dbUsername",         t.getDbUsername());
        m.put("dbDriverClass",      t.getDbDriverClass());
        m.put("sourceRefPath",      t.getSourceRefPath());
        m.put("databaseRefPath",    t.getDatabaseRefPath());
        m.put("menuSource",         t.getMenuSource());
        return m;
    }

    private String decryptMaybe(String value) {
        return cipher.isWrapped(value) ? cipher.unwrapDecrypt(value) : value;
    }

    // =====================================================================
    // util
    // =====================================================================

    private String writeJson(Object o) {
        try {
            return objectMapper.writeValueAsString(o);
        } catch (Exception e) {
            throw new IllegalStateException("JSON 직렬화 실패: " + e.getMessage(), e);
        }
    }

    public static String sha256Hex(byte[] data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] h = md.digest(data);
            StringBuilder sb = new StringBuilder(h.length * 2);
            for (byte b : h) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 실패", e);
        }
    }
}

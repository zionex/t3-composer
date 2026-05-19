package com.zionex.t3composer.domain.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.zionex.t3composer.domain.entity.TargetSnapshot;
import com.zionex.t3composer.domain.repository.TargetSnapshotRepository;
import com.zionex.t3composer.domain.service.TargetConfigRestoreService;
import com.zionex.t3composer.domain.service.TargetConfigSnapshotService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Target 거버넌스 설정 스냅샷 — capture / list / status(diff) / restore.
 *
 *  · POST   /composer/targets/{cd}/snapshots                  — 현재 디스크를 새 스냅샷으로 저장
 *  · GET    /composer/targets/{cd}/snapshots                  — 스냅샷 목록 (헤더만)
 *  · GET    /composer/targets/{cd}/snapshots/{id}             — 스냅샷 상세 (파일 메타)
 *  · GET    /composer/targets/{cd}/snapshot-status            — 디스크 vs 현재 스냅샷 diff
 *  · POST   /composer/targets/{cd}/snapshots/{id}/restore     — 스냅샷 복원 (body {dryRun?})
 *  · POST   /composer/targets/{cd}/snapshots/restore-current  — is_current 스냅샷 복원 (전환 자동복원)
 *  · DELETE /composer/targets/{cd}/snapshots/{id}             — 스냅샷 삭제
 */
@Slf4j
@RestController
@RequestMapping("/composer/targets")
@RequiredArgsConstructor
public class TargetSnapshotController {

    private final TargetConfigSnapshotService snapshotService;
    private final TargetConfigRestoreService  restoreService;
    private final TargetSnapshotRepository    snapshotRepo;

    /** 현재 디스크의 거버넌스 파일 일체를 새 스냅샷으로 저장. */
    @PostMapping("/{targetCd}/snapshots")
    public Map<String, Object> capture(@PathVariable String targetCd,
                                       @RequestBody(required = false) Map<String, String> body) {
        String label = body != null ? body.get("label") : null;
        String kindIn = body != null ? body.get("kind") : null;
        // 최초 1회는 SEED, 이후는 MANUAL — 둘 다 is_current 로 지정됨
        String kind = TargetSnapshot.KIND_SEED.equalsIgnoreCase(kindIn)
                ? TargetSnapshot.KIND_SEED : TargetSnapshot.KIND_MANUAL;
        try {
            TargetSnapshot snap = snapshotService.captureSnapshot(targetCd, label, kind);
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("ok", true);
            out.put("snapshot", snapshotService.getSnapshotDetail(snap.getId()));
            return out;
        } catch (Exception e) {
            log.warn("스냅샷 capture 실패: target={} — {}", targetCd, e.getMessage());
            return error(e);
        }
    }

    /** 스냅샷 목록 (헤더만 — content 미포함). */
    @GetMapping("/{targetCd}/snapshots")
    public List<Map<String, Object>> list(@PathVariable String targetCd) {
        return snapshotService.listSnapshots(targetCd);
    }

    /** 스냅샷 상세 — 헤더 + 파일 메타 (content 미포함). */
    @GetMapping("/{targetCd}/snapshots/{snapshotId}")
    public Map<String, Object> get(@PathVariable String targetCd,
                                   @PathVariable String snapshotId) {
        return snapshotService.getSnapshotDetail(snapshotId);
    }

    /** 현재 디스크 vs is_current 스냅샷 차이. Target 전환 시 복원 여부 판단에 사용. */
    @GetMapping("/{targetCd}/snapshot-status")
    public Map<String, Object> status(@PathVariable String targetCd) {
        return snapshotService.computeDiff(targetCd);
    }

    /** 특정 스냅샷 복원. body {dryRun?:boolean} */
    @PostMapping("/{targetCd}/snapshots/{snapshotId}/restore")
    public Map<String, Object> restore(@PathVariable String targetCd,
                                       @PathVariable String snapshotId,
                                       @RequestBody(required = false) Map<String, Object> body) {
        boolean dryRun = body != null && Boolean.TRUE.equals(body.get("dryRun"));
        try {
            return restoreService.restore(targetCd, snapshotId, dryRun);
        } catch (Exception e) {
            log.warn("스냅샷 복원 실패: target={} snapshot={} — {}", targetCd, snapshotId, e.getMessage());
            return error(e);
        }
    }

    /** is_current 스냅샷 복원 — Target 전환 자동복원 단축 경로. body {dryRun?:boolean} */
    @PostMapping("/{targetCd}/snapshots/restore-current")
    public Map<String, Object> restoreCurrent(@PathVariable String targetCd,
                                              @RequestBody(required = false) Map<String, Object> body) {
        boolean dryRun = body != null && Boolean.TRUE.equals(body.get("dryRun"));
        TargetSnapshot cur = snapshotRepo.findByTargetCdAndIsCurrent(targetCd, "Y").orElse(null);
        if (cur == null) {
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("ok", false);
            out.put("error", "Target " + targetCd + " 의 현재(is_current) 스냅샷이 없습니다. 먼저 스냅샷을 저장하세요.");
            out.put("noSnapshot", true);
            return out;
        }
        try {
            return restoreService.restore(targetCd, cur.getId(), dryRun);
        } catch (Exception e) {
            log.warn("스냅샷(current) 복원 실패: target={} — {}", targetCd, e.getMessage());
            return error(e);
        }
    }

    /** 스냅샷 삭제 (is_current 는 거부). */
    @DeleteMapping("/{targetCd}/snapshots/{snapshotId}")
    public Map<String, Object> delete(@PathVariable String targetCd,
                                      @PathVariable String snapshotId) {
        try {
            snapshotService.deleteSnapshot(snapshotId);
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("ok", true);
            return out;
        } catch (Exception e) {
            return error(e);
        }
    }

    private static Map<String, Object> error(Exception e) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("ok", false);
        out.put("error", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
        return out;
    }
}

package com.zionex.t3composer.config;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.zionex.t3composer.domain.repository.TargetRuleRepository;
import com.zionex.t3composer.domain.repository.TargetSystemRepository;
import com.zionex.t3composer.domain.service.ClaudeAssetImportService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Composer backend startup 시, 각 Target 의 활성 rule 카운트가 0 이면
 * .claude/rules + .claude/hooks 를 자동으로 import.
 *
 * 동기: 신규 install 또는 tb_cmp_target_rule 이 빈 상태(예: composer-db 볼륨
 * 초기화 직후) 에서 자연어 화면 생성을 시도하면 SystemPromptComposer 가
 * "rule 0건" IllegalStateException 으로 실패. 사용자는 별도로 import-claude
 * endpoint 를 수동 호출해야 했음.
 *
 * 이 hook 이 매 startup 마다 활성 Target 을 순회하며:
 *  · countByTargetCdAndUseYn(target,'Y') == 0 인 경우에만 import 실행 (멱등)
 *  · TargetSystemController.import-claude 와 동일한 [공용 + overlay] 2단 경로 사용
 *
 * 이미 rule 이 있는 Target 은 skip — 사용자가 import-claude 로 명시 갱신/배포 컨테이너
 * 재기동 시 rule_version 폭증을 막기 위함. 명시 갱신은 endpoint 로 수동.
 *
 * Phase 1 (composer-db-init) 의 always/ 폴더가 컬럼/시드를 자동 흡수하는 것과
 * 동일한 철학: "사용자가 수동 명령으로 채워야 했던 상태"를 startup hook 으로 자동화.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ClaudeAssetAutoImporter {

    /** 공용 Claude assets — TargetSystemController.COMMON_CLAUDE_ROOT 와 동기. */
    private static final String COMMON_CLAUDE_ROOT = "/workspace/common-claude";

    /** Target 별 overlay 경로 — TargetSystemController.TARGET_CLAUDE_ROOTS 와 동기. */
    private static final Map<String, String> TARGET_OVERLAY_ROOTS = Map.of(
            "T3SERIES",     "/workspace/t3series-claude",
            "PLANNEL",      "/workspace/plannel-claude",
            "LGES_NEXTSCM", "/workspace/lges_nextscm-claude"
    );

    private final TargetSystemRepository    targetRepo;
    private final TargetRuleRepository      ruleRepo;
    private final ClaudeAssetImportService  importService;

    @EventListener(ApplicationReadyEvent.class)
    public void autoImport() {
        // 공용 폴더 존재 확인 — 마운트 자체가 깨졌으면 import 자체 불가
        if (!Files.isDirectory(Paths.get(COMMON_CLAUDE_ROOT))) {
            log.warn("Claude assets 자동 import skip — {} 디렉토리 없음 (bind-mount 확인)",
                    COMMON_CLAUDE_ROOT);
            return;
        }

        targetRepo.findByIsActiveOrderBySortOrderAsc("Y").forEach(target -> {
            String cd = target.getTargetCd();
            long active = ruleRepo.countByTargetCdAndUseYn(cd, "Y");
            if (active > 0) {
                log.info("Claude assets 자동 import skip — target={} 이미 active rule {} 건",
                        cd, active);
                return;
            }

            String overlay = TARGET_OVERLAY_ROOTS.get(cd);
            List<String> roots = (overlay != null && Files.isDirectory(Paths.get(overlay)))
                    ? List.of(COMMON_CLAUDE_ROOT, overlay)
                    : List.of(COMMON_CLAUDE_ROOT);
            try {
                Map<String, Object> result = importService.importFromClaudeFolders(cd, roots);
                log.info("Claude assets 자동 import 완료: target={} roots={} result={}",
                        cd, roots, result);
            } catch (RuntimeException e) {
                // 실패해도 backend startup 자체를 막지 않음 — 사용자가 endpoint 로 재시도 가능
                log.error("Claude assets 자동 import 실패: target={} — {}",
                        cd, e.getMessage(), e);
            }
        });
    }
}

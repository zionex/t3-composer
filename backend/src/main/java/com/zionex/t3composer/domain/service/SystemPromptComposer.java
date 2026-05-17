package com.zionex.t3composer.domain.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.zionex.t3composer.domain.entity.TargetHook;
import com.zionex.t3composer.domain.entity.TargetRule;
import com.zionex.t3composer.domain.repository.TargetHookRepository;
import com.zionex.t3composer.domain.repository.TargetRuleRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * targetCd 의 모든 active rule + hook 을 priority / sort_order 순으로 합쳐
 * Anthropic system prompt 의 정적 블록 텍스트를 만든다.
 *
 * 호출 시점: ComposerPromptBuilder.buildStaticSystemPrompt(targetCd) 위임.
 *
 * - rule  = TB_CMP_TARGET_RULE (use_yn='Y', priority ASC, rule_code ASC)
 * - hook  = TB_CMP_TARGET_HOOK (enabled='Y', hook_event ASC, sort_order ASC)
 * - rule 0건이면 IllegalStateException — ClaudeAssetImportService 로 import 강제
 * - hook 0건은 OK — hooks 섹션 자체 생략
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SystemPromptComposer {

    private final TargetRuleRepository ruleRepo;
    private final TargetHookRepository hookRepo;

    /**
     * @throws IllegalStateException targetCd 가 NULL/blank 이거나 rule 이 0건일 때
     */
    public String compose(String targetCd) {
        if (targetCd == null || targetCd.isBlank()) {
            throw new IllegalStateException(
                    "session.targetCd 가 NULL — Composer 세션 생성 시 target 을 명시해야 합니다.");
        }

        List<TargetRule> rules = ruleRepo
                .findByTargetCdAndUseYnOrderByPriorityAscRuleCodeAsc(targetCd, "Y");
        if (rules.isEmpty()) {
            throw new IllegalStateException(
                    "tb_cmp_target_rule 에 target_cd='" + targetCd + "' AND use_yn='Y' 인 rule 이 0건. "
                            + "ClaudeAssetImportService 로 .claude/rules/ 를 먼저 import 하세요.");
        }

        List<TargetHook> hooks = hookRepo
                .findByTargetCdAndEnabledOrderByHookEventAscSortOrderAsc(targetCd, "Y");

        StringBuilder sb = new StringBuilder();

        // ── Rules ──────────────────────────────────────────────────
        sb.append("# ").append(targetCd).append(" — 규약 (Rules)\n\n");
        sb.append("아래는 ").append(targetCd)
                .append(" target 의 모든 활성 규약입니다. 산출물 생성 시 모두 준수하세요.\n\n");

        for (TargetRule r : rules) {
            sb.append("---\n\n");
            sb.append("## [Rule ").append(r.getRuleCode()).append("] ")
                    .append(r.getTitle() != null ? r.getTitle() : r.getRuleCode())
                    .append("\n\n");
            sb.append(r.getContent()).append("\n\n");
        }

        // ── Hooks (자동 검증 패턴) ─────────────────────────────────
        if (!hooks.isEmpty()) {
            sb.append("\n---\n\n");
            sb.append("# ").append(targetCd).append(" — 자동 검증 규칙 (Hooks)\n\n");
            sb.append("아래는 산출물 저장 시 실제로 차단되는 검증 스크립트입니다. ");
            sb.append("LLM 출력 직전 self-check 로 동일 패턴 적용하여 차단 회피하세요.\n\n");

            for (TargetHook h : hooks) {
                sb.append("---\n\n");
                sb.append("## [Hook ").append(h.getHookEvent()).append("/")
                        .append(h.getScriptName()).append("]");
                if (h.getMatcher() != null && !h.getMatcher().isBlank()) {
                    sb.append(" (matcher: ").append(h.getMatcher()).append(")");
                }
                sb.append("\n\n");
                sb.append("```").append(h.getLanguage() != null ? h.getLanguage() : "bash").append("\n");
                sb.append(h.getScriptContent()).append("\n");
                sb.append("```\n\n");
            }
        }

        String result = sb.toString();
        log.info("[SystemPromptComposer] target={}, rules={}, hooks={}, totalChars={}",
                targetCd, rules.size(), hooks.size(), result.length());
        return result;
    }
}

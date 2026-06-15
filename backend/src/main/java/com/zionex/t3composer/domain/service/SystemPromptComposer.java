package com.zionex.t3composer.domain.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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

    // ── 화면 생성용 rule include-set (rule_code 기준) ──────────────
    //   토큰 절감: 화면 생성에 필요한 rule 만 system prompt 에 주입.
    //   설계: docs/superpowers/specs/2026-05-28-composer-final-step-autogen-token-design.md §3.2
    private static final Set<String> CORE_RULES = Set.of(
            "41-composer-generation", "41a-composer-jsx", "20-screen-development",
            "99a-composer-anti-patterns", "32-sql-schema-verification",
            // 검색조건/콤보는 거의 모든 화면에 존재 → core. Target overlay 의 45 가 있으면 자동 포함.
            "45-search-condition-and-combos");
    private static final Set<String> BACKEND_RULES = Set.of(
            "41b-composer-java", "30-database-schema", "31-stored-procedures");
    private static final Set<String> FILTER_RULES = Set.of(
            "41c-composer-widgets", "22-filter-bar");

    /**
     * ruleScope 문자열(예: "backend,filter") 로 포함할 rule_code 집합 계산.
     * core 는 항상 포함, backend/filter 토큰이 있으면 해당 set 추가.
     */
    static Set<String> screenGenRuleCodes(String ruleScope) {
        Set<String> codes = new HashSet<>(CORE_RULES);
        if (ruleScope != null) {
            if (ruleScope.contains("backend")) codes.addAll(BACKEND_RULES);
            if (ruleScope.contains("filter"))  codes.addAll(FILTER_RULES);
        }
        return codes;
    }

    /** 기존 시그니처 — ruleScope 없이 전체 rule (back-compat / 비 화면생성 경로). */
    public String compose(String targetCd) {
        return compose(targetCd, null);
    }

    /**
     * @param ruleScope null/blank 이면 전체 rule(폴백), 아니면 screenGenRuleCodes 로 선별.
     * @throws IllegalStateException targetCd 가 NULL/blank 이거나 rule 이 0건일 때
     */
    public String compose(String targetCd, String ruleScope) {
        if (targetCd == null || targetCd.isBlank()) {
            throw new IllegalStateException(
                    "session.targetCd 가 NULL — Composer 세션 생성 시 target 을 명시해야 합니다.");
        }

        List<TargetRule> allRules = ruleRepo
                .findByTargetCdAndUseYnOrderByPriorityAscRuleCodeAsc(targetCd, "Y");
        if (allRules.isEmpty()) {
            throw new IllegalStateException(
                    "tb_cmp_target_rule 에 target_cd='" + targetCd + "' AND use_yn='Y' 인 rule 이 0건. "
                            + "ClaudeAssetImportService 로 .claude/rules/ 를 먼저 import 하세요.");
        }

        // ruleScope 가 있으면 include-set 으로 선별. 선별 결과가 비면(코드 불일치) 안전하게 전체로 폴백.
        List<TargetRule> rules = allRules;
        if (ruleScope != null && !ruleScope.isBlank()) {
            Set<String> include = screenGenRuleCodes(ruleScope);
            List<TargetRule> filtered = allRules.stream()
                    .filter(r -> include.contains(r.getRuleCode()))
                    .collect(Collectors.toList());
            if (!filtered.isEmpty()) rules = filtered;
        }

        List<TargetHook> hooks = hookRepo
                .findByTargetCdAndEnabledOrderByHookEventAscSortOrderAsc(targetCd, "Y");

        StringBuilder sb = new StringBuilder();

        // ── Rules ──────────────────────────────────────────────────
        sb.append("# ").append(targetCd).append(" — 규약 (Rules)\n\n");
        sb.append("아래는 ").append(targetCd)
                .append(" target 의 활성 규약입니다. 산출물 생성 시 모두 준수하세요.\n\n");

        for (TargetRule r : rules) {
            sb.append("---\n\n");
            sb.append("## [Rule ").append(r.getRuleCode()).append("] ")
                    .append(r.getTitle() != null ? r.getTitle() : r.getRuleCode())
                    .append("\n\n");
            sb.append(r.getContent()).append("\n\n");
        }

        // ── Hooks (자동 검증 — 요약만, bash 본문 제외) ──────────────
        //   hook 은 서버 PreToolUse 로 실제 차단 실행되므로 LLM 엔 "어떤 검증이 차단되는지"
        //   신호만 충분. 전체 스크립트(~45K 토큰) 는 프롬프트에서 제거.
        if (!hooks.isEmpty()) {
            sb.append("\n---\n\n");
            sb.append("# ").append(targetCd).append(" — 자동 검증 규칙 (Hooks · 저장 시 차단)\n\n");
            sb.append("아래 검증이 산출물 저장 시 실제 차단됩니다. 출력 직전 self-check 로 회피하세요.\n\n");
            for (TargetHook h : hooks) {
                sb.append("- [").append(h.getHookEvent()).append("/").append(h.getScriptName()).append("]");
                if (h.getMatcher() != null && !h.getMatcher().isBlank()) {
                    sb.append(" (matcher: ").append(h.getMatcher()).append(")");
                }
                sb.append("\n");
            }
        }

        String result = sb.toString();
        String selectedCodes = rules.stream().map(TargetRule::getRuleCode).collect(Collectors.joining(","));
        log.info("[SystemPromptComposer] target={}, ruleScope={}, rules={}/{}, hooks={}, totalChars={}, rules=[{}]",
                targetCd, ruleScope, rules.size(), allRules.size(), hooks.size(), result.length(), selectedCodes);
        return result;
    }
}

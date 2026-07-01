package com.zionex.t3composer.domain.service;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

/**
 * Phase 6 i18n — ComposerPromptBuilder.buildLanguageInstruction 단위 테스트.
 *
 * Note: 원 plan 은 buildStaticSystemPrompt(String uiLanguage) 시그니처를 요구했으나
 * 기존 buildStaticSystemPrompt(String targetCd) 와 시그니처 충돌. 언어 지침 자체는
 * buildLanguageInstruction(String) 에 격리되어 있으므로 그 메서드를 직접 검증.
 * 외부에서는 buildStaticSystemPrompt(targetCd, ruleScope, uiLanguage) 3-arg 오버로드가
 * 내부적으로 buildLanguageInstruction 을 호출해 합본 prompt 끝에 부착한다.
 */
class ComposerPromptBuilderTest {

    /** SystemPromptComposer 는 언어 지침 메서드에서 사용되지 않으므로 null 로 instantiate. */
    private final ComposerPromptBuilder builder = new ComposerPromptBuilder(null);

    @Test
    void englishLanguageInjectsEnglishInstruction() {
        String prompt = builder.buildLanguageInstruction("en");
        assertTrue(prompt.contains("Respond to user messages in English"));
        assertTrue(prompt.contains("keep Korean labels"));
    }

    @Test
    void koreanLanguageInjectsKoreanInstruction() {
        String prompt = builder.buildLanguageInstruction("ko");
        assertTrue(prompt.contains("한국어로 응답"));
    }

    @Test
    void nullLanguageDefaultsToKorean() {
        String prompt = builder.buildLanguageInstruction(null);
        assertTrue(prompt.contains("한국어로 응답"));
    }
}

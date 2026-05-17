package com.zionex.t3composer.domain.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.zionex.t3composer.domain.entity.ComposerSession;

/**
 * Claude 호출 시 사용할 system prompt 를 조립한다.
 *
 * 정적 블록 (Anthropic Prompt Caching 대상) — TB_CMP_TARGET_RULE / TB_CMP_TARGET_HOOK
 *   에서 동적 로드. SystemPromptComposer 에 위임.
 *
 * 동적 블록 — SP SCREEN_NO 자동 할당 hint + 현재 세션 컨텍스트 (mode/targetMenuCd/...).
 *
 * 변경 이력:
 *   2026-05-15: INVARIANTS / BASE_SYSTEM / 모드별 가이드 / 재확인 후미를 모두
 *               TB_CMP_TARGET_RULE 의 content 로 이전. ClaudeAssetImportService 로
 *               .claude/rules/*.md 를 import 한 뒤 SystemPromptComposer 가 재조립.
 */
@Component
public class ComposerPromptBuilder {

    private final SystemPromptComposer composer;

    /**
     * SP SCREEN_NO 자동 할당기 — DB 의 INFORMATION_SCHEMA.ROUTINES 를 조회해
     * 도메인별 max(NN)+1 을 반환. setter injection 으로 받아 (a) mock 용이성,
     * (b) 빈 미존재 환경 (예: 단순 prompt 빌드 호출) 에서도 동작.
     */
    private SpScreenNoAllocator screenNoAllocator;

    public ComposerPromptBuilder(SystemPromptComposer composer) {
        this.composer = composer;
    }

    @Autowired(required = false)
    public void setScreenNoAllocator(SpScreenNoAllocator allocator) {
        this.screenNoAllocator = allocator;
    }

    public String buildSystemPrompt(ComposerSession session) {
        return buildStaticSystemPrompt(session.getTargetCd()) + buildSessionSystemPrompt(session);
    }

    /**
     * targetCd 기반 정적 블록 — Anthropic Prompt Caching 키 단위로 사용.
     * 같은 target 의 모든 세션·모드는 동일 텍스트 → 5분 TTL 안에서 input token 90% 절감.
     *
     * @throws IllegalStateException targetCd 가 NULL 이거나 DB rule 이 0건일 때
     */
    public String buildStaticSystemPrompt(String targetCd) {
        return composer.compose(targetCd);
    }

    /**
     * 세션별로 달라지는 가변 부분 — SP SCREEN_NO 힌트 + 현재 세션 컨텍스트.
     * 캐시 대상에서 제외 (매 호출마다 다른 텍스트가 될 수 있음).
     */
    public String buildSessionSystemPrompt(ComposerSession session) {
        StringBuilder sb = new StringBuilder();

        // SP SCREEN_NO 자동 할당 — DB 의 현재 사용 중인 SP 를 조회해 도메인별 권장 NN 주입.
        // 신규 모드일 때만 의미 있으므로 EXISTING_MODIFY 는 생략.
        if (screenNoAllocator != null
                && session.getMode() != null
                && !ComposerSession.MODE_EXISTING_MODIFY.equals(session.getMode())) {
            try {
                String hint = screenNoAllocator.buildPromptHint();
                if (hint != null && !hint.isBlank()) {
                    sb.append("\n\n").append(hint);
                }
            } catch (Exception e) {
                // prompt 빌드 자체가 실패하면 안 됨 — hint 없이 진행
            }
        }

        sb.append("\n\n=== 현재 세션 컨텍스트 ===\n");
        sb.append("- 모드: ").append(session.getMode()).append("\n");
        if (session.getTargetMenuCd() != null && !session.getTargetMenuCd().isBlank()) {
            sb.append("- 대상 메뉴 코드(수정): ").append(session.getTargetMenuCd()).append("\n");
        }
        if (session.getDesignDocName() != null && !session.getDesignDocName().isBlank()) {
            sb.append("- 업로드 설계서: ").append(session.getDesignDocName()).append("\n");
        }

        return sb.toString();
    }
}

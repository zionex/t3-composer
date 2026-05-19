package com.zionex.t3composer.domain.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.zionex.t3composer.domain.entity.ComposerSession;
import com.zionex.t3composer.domain.entity.TargetSystem;
import com.zionex.t3composer.domain.repository.TargetSystemRepository;

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

    /**
     * Target 메타 lookup — session.targetCd 의 menu_source 등을 prompt 에 반영하기 위해 필요.
     * setter injection — bean 미존재 환경에서도 동작 (기본 동작은 DB 기반 MENU_SQL).
     */
    private TargetSystemRepository targetRepo;

    public ComposerPromptBuilder(SystemPromptComposer composer) {
        this.composer = composer;
    }

    @Autowired(required = false)
    public void setScreenNoAllocator(SpScreenNoAllocator allocator) {
        this.screenNoAllocator = allocator;
    }

    @Autowired(required = false)
    public void setTargetRepository(TargetSystemRepository targetRepo) {
        this.targetRepo = targetRepo;
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

        // Target 의 menu_source 가 JS_FILE 이면 메뉴 등록 산출물 형식 자체가 다르다.
        //   T3SERIES 등 (menu_source=DB) → MENU_SQL (TB_AD_MENU INSERT)
        //   PLANEL    등 (menu_source=JS_FILE) → MENU_JS (TabMenuList.js entry JSON)
        // ※ TB_CMP_TARGET_RULE 의 정적 prompt 는 target 별로 다르게 로드되므로 본질적
        //   가이드는 거기에 있고, 여기는 LLM 이 산출물을 만들 때의 *형식 차이* 만 명시.
        String menuSource = resolveMenuSource(session.getTargetCd());
        if ("JS_FILE".equalsIgnoreCase(menuSource)) {
            sb.append("- 메뉴 소스 형식: JS_FILE — 메뉴 등록 산출물은 SQL 이 아니라 JSON\n\n");
            sb.append("=== 메뉴 등록 산출물 (PLANEL 등 menu_source=JS_FILE Target) ===\n");
            sb.append("기존 화면 수정이 아닌 신규 화면 생성이면 다음 형식의 MENU_JS 아티팩트 1건 출력:\n\n");
            sb.append("===FILE: src/pages/TabMenuList.entries.json===\n");
            sb.append("```json\n");
            sb.append("{\n");
            sb.append("  \"entries\": [\n");
            sb.append("    {\n");
            sb.append("      \"groupKey\": \"<lv3MenuList 의 기존 그룹 키 — 예: DATA_MGMT · DASHBOARD · DP · RP · IP · MP — 또는 적절한 신규 키>\",\n");
            sb.append("      \"reduxKey\": \"<UPPER_SNAKE 식별자 — 예: INPUT_MY_NEW_SCREEN>\",\n");
            sb.append("      \"title\": \"<i18n key — 예: menuMyNewScreen>\",\n");
            sb.append("      \"componentName\": \"<PascalCase React 컴포넌트명 — 예: MyNewScreen>\",\n");
            sb.append("      \"componentPath\": \"<src/pages/ 하위 상대경로 (확장자 없이) — 예: data-management/MyNewScreen>\"\n");
            sb.append("    }\n");
            sb.append("  ]\n");
            sb.append("}\n");
            sb.append("```\n\n");
            sb.append("⛔ 금지:\n");
            sb.append("  - TB_AD_MENU / TB_AD_LANG_PACK / TB_AD_PERMISSION 등 DB 메뉴 SQL 생성\n");
            sb.append("  - TabMenuList.js 파일 자체를 통째로 덮어쓰기 (entries JSON 만 출력)\n");
            sb.append("  - 동일 reduxKey 가 이미 존재하는 entry 재생성 (backend 가 자동 skip 하지만 의도하지 말 것)\n");
            sb.append("\n메뉴 표시명(다국어)은 별도 i18n 리소스 파일 갱신이 필요할 수 있으나 본 산출물에는 포함하지 않음 — title 의 i18n key 만 명시.\n");
        }

        return sb.toString();
    }

    /** session.targetCd 의 menu_source 컬럼값 반환. NULL 안전. */
    private String resolveMenuSource(String targetCd) {
        if (targetCd == null || targetCd.isBlank() || targetRepo == null) return null;
        try {
            return targetRepo.findById(targetCd)
                    .map(TargetSystem::getMenuSource)
                    .orElse(null);
        } catch (Exception e) {
            // prompt 빌드 자체가 실패하면 안 됨 — null 로 fallback (기본 MENU_SQL 경로)
            return null;
        }
    }
}

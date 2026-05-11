package com.zionex.t3composer.domain.service;

import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3composer.domain.client.AnthropicClient;
import com.zionex.t3composer.domain.client.AnthropicModels.CacheControl;
import com.zionex.t3composer.domain.client.AnthropicModels.Message;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesRequest;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;
import com.zionex.t3composer.domain.client.AnthropicModels.SystemBlock;
import com.zionex.t3composer.domain.client.AnthropicModels.TextBlock;
import com.zionex.t3composer.domain.dto.PrefillFromSourceRequest;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * NEW_FROM_COPY 모드 — sourceBundle 을 분석해 9단계 spec JSON 을 한 번에 prefill.
 *
 * 정규식 기반 frontend prefill 의 fragility 를 우회하기 위해 LLM 한 번 호출.
 * 응답은 wizardState.createInitialSpec() 와 동일 구조의 JSON. frontend 는
 * 받은 spec 을 그대로 StepByStepWizard 에 전달 (또는 부분 병합).
 *
 * 참조: DesignDocAnalyzeService — 동일한 LLM 호출 패턴.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PrefillFromSourceService {

    private static final String MODEL_NAME = "claude-sonnet-4-5";
    private static final int    MAX_TOKENS = 8192;
    // sourceBundle 직렬화 시 토큰 폭주 방지 — 가장 큰 backend 소스는 잘라서 전달
    private static final int    MAX_FIELD_CHARS = 12000;
    // backend Java/SP 본문 — 한 파일당 자르는 한계
    private static final int    MAX_BACKEND_BODY_CHARS = 2500;
    // backend 분류별 최대 파일 수 (LLM 토큰 폭주 방지 — 핵심 파일 우선)
    private static final int    MAX_BACKEND_FILES_PER_KIND = 3;
    // user 프롬프트 전체 하드 캡 — Anthropic 요청 안전 마진 (~80K chars ≈ 25K tokens)
    private static final int    USER_PROMPT_HARD_CAP_CHARS = 80000;

    private final AnthropicClient anthropicClient;
    private final AnthropicApiKeyService apiKeyService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Object> prefill(String userId, PrefillFromSourceRequest req) {
        String apiKey = apiKeyService.getApiKey(userId)
                .orElseThrow(() -> new IllegalStateException(
                        "Anthropic API 키가 등록되지 않았습니다. 먼저 /composer/apikey 에 저장하세요."));

        String systemPrompt = buildSystemPrompt();
        String userPrompt   = buildUserPrompt(req);

        // 하드 캡 — Anthropic 요청 페이로드 폭주 방지 (truncate 표시 포함)
        if (userPrompt.length() > USER_PROMPT_HARD_CAP_CHARS) {
            log.warn("prefill-from-source userPrompt 가 캡({})을 초과 — {} chars 잘라서 전송 (sourceMenuCd={})",
                    USER_PROMPT_HARD_CAP_CHARS, userPrompt.length() - USER_PROMPT_HARD_CAP_CHARS,
                    req.getSourceMenuCd());
            userPrompt = userPrompt.substring(0, USER_PROMPT_HARD_CAP_CHARS)
                    + "\n\n...[전체 페이로드 캡 초과 — 이후 내용 잘림. 발견된 모든 SP/URL/Entity 는 위 내용에서 추출]";
        }

        log.info("prefill-from-source 호출: sourceMenuCd={} → newMenuCd={} userPromptLen={} systemPromptLen={}",
                req.getSourceMenuCd(), req.getNewMenuCd(), userPrompt.length(), systemPrompt.length());

        // 정적 system prompt 에 cache_control 부착 — 같은 prefill 을 5분 안에 재호출하면 input 비용 90% 절감
        MessagesRequest mreq = MessagesRequest.builder()
                .model(MODEL_NAME)
                .max_tokens(MAX_TOKENS)
                .temperature(0.0)
                .system(List.of(SystemBlock.builder()
                        .type("text")
                        .text(systemPrompt)
                        .cacheControl(CacheControl.builder().type("ephemeral").build())
                        .build()))
                .messages(List.of(Message.builder().role("user").content(userPrompt).build()))
                .build();

        MessagesResponse resp;
        try {
            resp = anthropicClient.sendMessages(apiKey, mreq).block();
        } catch (Exception e) {
            // Anthropic 호출 자체가 실패 — 원인을 명확히 로그에 남기고 호출자(컨트롤러)가 500 으로 답하게 한다.
            log.error("prefill-from-source Anthropic 호출 실패: type={} message={} (sourceMenuCd={}, userPromptLen={})",
                    e.getClass().getSimpleName(), e.getMessage(),
                    req.getSourceMenuCd(), userPrompt.length(), e);
            throw new IllegalStateException(
                    "Claude API 호출 실패: " + e.getClass().getSimpleName()
                    + " - " + (e.getMessage() != null ? e.getMessage() : "unknown"), e);
        }

        String text = extractText(resp);
        log.debug("Claude raw response (prefill-from-source): {} chars", text == null ? 0 : text.length());

        Map<String, Object> spec = parseJsonObject(text);
        Map<String, Object> out = new HashMap<>();
        out.put("spec", spec);
        out.put("modelName", resp != null ? resp.getModel() : MODEL_NAME);
        return out;
    }

    private String buildSystemPrompt() {
        return String.join("\n",
            "당신은 T3Series Composer 의 화면 분석 전문가입니다.",
            "원본 화면(JSX) + 백엔드(Controller/Service/Repository/Entity) + Procedures 를 분석해",
            "9단계 wizard spec JSON 을 정확히 prefill 합니다.",
            "",
            "★ 절대 규칙",
            "1. 출력은 순수 JSON 만. 마크다운/설명/코드 펜스 금지.",
            "2. 추측 금지 — sourceBundle 에서 확인되지 않는 값은 빈 문자열 또는 빈 배열.",
            "3. 각 layer/grid 마다 별도 entry. layer 가 여러 개면 각각의 SP/URL 을 정확히 분리.",
            "4. SP 가 사용된 화면 (callService 또는 procedures 발견) → source='SP'.",
            "   각 layer 의 read/create/update/delete SP 를 별도로 식별해 spName + crudSp 에 모두 채움.",
            "5. zAxios.get/post 만 사용 → source='JPA_ENTITY' + baseUrl + entity (sourceBundle.backend.entities[0].className).",
            "6. SearchArea 의 InputField 들은 모두 step7_filter.fields 에 매핑. 빠짐없이.",
            "7. 그리드 컬럼 (gridItems / let xxxItems = [...]) 은 step5_columns 에 모두 매핑.",
            "8. MENU_CD 형식: UI_<DOMAIN>_<NAME> · MENU_FILE_PATH: /<module>[/<category>]/<PascalComponentName>",
            "",
            "★ 출력 JSON 구조 (정확히 이 키 사용)",
            "{",
            "  \"step1_layout\": {",
            "    \"patternCode\": \"P02\",",
            "    \"areas\": [{ \"id\": \"...\", \"kind\": \"search|grid|tree|...\", \"parent\": null, \"title\": \"...\" }],",
            "    \"layoutConfig\": {",
            "      \"cols\": 12, \"rowHeight\": 30,",
            "      \"layers\": [{ \"key\": \"<BaseGrid id>\", \"x\":0, \"y\":0, \"w\":12, \"h\":12, \"title\":\"...\", \"componentType\":\"GRID_BASE\" }],",
            "      \"filterBar\": { \"h\": 2, \"items\": [{ \"key\": \"<varName>\", \"label\": \"...\" }] }",
            "    }",
            "  },",
            "  \"step2_overview\": { \"screenId\":\"\", \"screenName\":\"\", \"menuCd\":\"\", \"parentMenuCd\":\"\", \"menuFilePath\":\"\", \"langKey\":\"\", \"description\":\"\" },",
            "  \"step3_components\": { \"<areaId>\": { \"components\": [{ \"kind\":\"BaseGrid|SearchArea|TreeGrid\", \"id\":\"\", \"title\":\"\" }], \"buttons\": [{ \"kind\":\"GridSaveButton|GridDeleteRowButton|GridAddRowButton|GridExcelExportButton\", \"grid\":\"\" }] } },",
            "  \"step4_dataBinding\": { \"<gridAreaId>\": { \"source\":\"SP|JPA_ENTITY\", \"spName\":\"<read SP_UI_*>\", \"target\":\"mp|dp|bf|fp\", \"crudSp\":{ \"read\":\"SP_UI_*\", \"create\":\"SP_UI_*\", \"update\":\"SP_UI_*\", \"delete\":\"SP_UI_*\" }, \"allSpNames\":[\"SP_UI_*\"], \"serviceIds\":[\"SRV_*\"], \"serviceIdToSp\":{\"SRV_*\":\"SP_UI_*\"}, \"baseUrl\":\"\", \"entity\":\"\", \"methods\":{\"search\":\"\",\"save\":\"\",\"delete\":\"\"} } },",
            "  \"step5_columns\": { \"<gridAreaId>\": { \"columns\": [{ \"name\":\"\", \"fieldName\":\"\", \"dataType\":\"text|number|datetime|boolean\", \"headerText\":\"\", \"width\":120, \"editable\":false, \"visible\":true, \"textAlignment\":\"left|center|far\" }] } },",
            "  \"step6_cascade\": {},",
            "  \"step7_filter\": { \"blockId\":\"filter_main\", \"fields\": [{ \"fieldId\":\"UPPER_SNAKE\", \"varName\":\"camelCase\", \"type\":\"TEXT|NUMBER|DATE|DATE_RANGE|DROPDOWN|CHECKBOX|RADIO|POPUP|AUTOCOMPLETE|DOMAIN_PLAN_SCOPE|DOMAIN_USER\", \"label\":\"\", \"dataType\":\"string|number|boolean|array\", \"nullWhenEmpty\":true, \"required\":false }] },",
            "  \"step8_filterCascade\": { \"dependencies\": [], \"crossFieldRules\": [] }",
            "}",
            "",
            "★ Step4 의 crudSp 가 핵심 (절대 빠뜨리지 말 것):",
            "   원본 JSX/백엔드에서 한 화면이 여러 SP 를 사용하는 경우",
            "   (예: 조회 = SP_UI_DP_07_Q1, 저장 = SP_UI_DP_07_S1, 삭제 = SP_UI_DP_07_D1)",
            "   각 action 별 SP 를 정확히 분리해 crudSp.{read|create|update|delete} 에 매핑.",
            "   spName 은 read SP 와 동일하게 두기 (호환).",
            "   target 은 SP 이름 prefix 로 추정 (BF→bf, DP→dp, FP→fp, 그 외→mp).",
            "   ★ allSpNames 에는 발견된 모든 SP 를 빠짐없이 (중복 제거하여) 채움 — 사용자가 칩 클릭으로 보정 가능.",
            "   ★ 한 영역에서 SP 가 발견되었는데 crudSp 가 빈 문자열만 있으면 안 됨. 최소한 read 는 채워야 함.",
            "   ★ 화면이 zAxios + callService 를 모두 쓰는 일은 없음. 하나만 선택.",
            "",
            "★ ★ ★ SERVICE_ID 와 SP 이름 구분 (절대 혼동 금지) ★ ★ ★",
            "   · callService(\"<SERVICE_ID>\", paramMap, \"target\") 의 첫 인자는 SERVICE_ID 이지 SP 이름이 아님",
            "   · SERVICE_ID 는 engine service.xml (config/<DOMAIN>/UI_*_service.xml) 의 <service id> 값",
            "   · 실제 SP 이름은 service.xml 안의 <procedure id='SP_UI_*'> 에 있음",
            "   · 변환 규칙:",
            "       SRV_GET_SP_UI_DP_00_CONF_Q1  → SP_UI_DP_00_CONF_Q1   (dpserver SELECT 관례)",
            "       SRV_SET_SP_UI_DP_00_CONF_S1  → SP_UI_DP_00_CONF_S1   (dpserver INSERT 관례)",
            "       SRV_UI_<DOMAIN>_<NO>_<ACTION> → mpserver native — service.xml 의 <procedure id> 참고",
            "       GetEntryNotifyChart 등 임의 ID → service.xml 의 <procedure id> 참고",
            "   · sourceBundle.backend.procedures[].procedure 는 백엔드가 service.xml trace 한 권위있는 SP 이름",
            "   · sourceBundle.backend.procedures[].serviceId 는 그 SP 가 매핑된 SERVICE_ID",
            "   · spName · crudSp.* 에는 반드시 **SP 이름** (SP_UI_*) 을 채울 것. SERVICE_ID 직접 사용 금지.",
            "   · SERVICE_ID 는 step4_dataBinding[area].serviceIds 배열에 별도 보존 (사용자 검증용).",
            "   · serviceIdToSp 는 {SERVICE_ID: SP 이름} dict — backend.procedures 에서 추출해 채움.",
            "",
            "★ ★ ★ Step4 source 결정 규칙 (절대 위반 금지) ★ ★ ★",
            "   ★ SP 발견 우선 grep — sourceBundle 의 어떤 텍스트(JSX · frontendSources · controllers · services",
            "     · repositories · entities · procedures · service XML) 에서든 다음 패턴이 등장하면 SP 사용 화면:",
            "       \\b(SP_UI_[A-Z][A-Z0-9_]+|SRV_(?:GET|SET)_SP_UI_[A-Z][A-Z0-9_]+)\\b",
            "     callService 가 변수 경유로 호출되거나, store/hook 의 const SP_NAME 정의,",
            "     service XML <service id=...> 매핑, JdbcTemplate.execute · @Procedure 어노테이션 등",
            "     모두 위 패턴으로 잡힘. 발견된 모든 SP 를 allSpNames 에 채울 것.",
            "",
            "   ★ SP suffix 로 CRUD 분류 (정확히 적용):",
            "     - _Q\\d* / _SEARCH / _LIST / _GET / _FIND   → crudSp.read",
            "     - _S\\d* / _SAVE / _INSERT / _CREATE         → crudSp.create",
            "     - _U\\d* / _UPDATE / _MODIFY                  → crudSp.update",
            "     - _D\\d* / _DELETE / _REMOVE                  → crudSp.delete",
            "     - SRV_GET_SP_UI_*                            → read",
            "     - SRV_SET_SP_UI_*                            → create (또는 update — 컨텍스트로 판단)",
            "",
            "   1. SP 가 위 grep 에서 1개라도 발견됨",
            "      → source='SP' · spName=read SP · crudSp 에 정확히 분류 · allSpNames 에 모든 SP",
            "   2. SP 전혀 없음 + JSX 에 zAxios.get/post/put/delete 만 있음",
            "      → source='JPA_ENTITY' · baseUrl 에 zAxios URL · entity 에 backend.entities[0].className",
            "   3. 어느 쪽도 확인 안 됨 → source='JPA_ENTITY' · baseUrl·entity 비워둠",
            "",
            "   ❌ 절대 source='SP' 라 하면서 spName/crudSp/allSpNames 모두 빈 string/배열로 두지 말 것",
            "      (그럴 거면 source='JPA_ENTITY' 로 답해야 사용자에게 baseUrl 입력칸이 보임)",
            "   ❌ 한 화면이 SP 와 zAxios 를 섞어 쓸 일은 없음 — 둘 중 하나로 일관되게 매핑",
            "",
            "★ areaId 일관성:",
            "   step1.areas[].id == step1.layoutConfig.layers[].key == step3/4/5/6 의 키.",
            "   원본 JSX 의 BaseGrid id (예: 'userInfoGrid') 를 그대로 layer.key 로 사용.",
            "   SearchArea 가 있으면 첫 area = { id: 'mainSearch', kind: 'search' }.",
            "",
            "★ ★ ★ 금지 값 / 필수 형식 (절대 위반 금지) ★ ★ ★",
            "   step5_columns[*].columns[].textAlignment 는 다음 4개 값만 허용:",
            "     · '' (빈 문자열, 기본 dataType 추론) | 'left' | 'center' | 'far'",
            "     ❌ 'near' 사용 금지 — 'left' 로 답할 것 (RealGrid2 'near' 와 동등)",
            "     ❌ 'right' 사용 금지 — 'far' 로 답할 것",
            "   step5_columns[*].columns[].dataType 는 다음 4개 값만 허용:",
            "     · 'text' | 'number' | 'datetime' | 'boolean'",
            "     ❌ 'string' / 'date' / 'bool' 사용 금지",
            "   step2_overview.menuCd 형식: ^UI_(AD|BF|CM|DP|FO|FP|IM|MP|RP|SA|SO|UT)_[A-Z][A-Z0-9_]*$",
            "     ❌ 'UT_USER_INFO' (UI_ prefix 누락) / 'MENU_UT_*' (그룹 prefix) 금지",
            "   step2_overview.menuFilePath: '/<module>[/<category>]/<PascalCase>' — 마지막 직전 == lower(마지막) 금지",
            "     ❌ '/util/userinfomgmt/UserInfoMgmt' (이중) → '/util/UserInfoMgmt'",
            "   step2_overview.parentMenuCd 는 MENU_AD/MENU_DP/MENU_MP/MENU_FP/MENU_BF/MENU_IM/MENU_RP/MENU_SA/MENU_UTIL 중 하나",
            "     ❌ 'MENU_UT' (util 의 parent 는 'MENU_UTIL')",
            "   step7_filter.fields[].dataType 는 'string'/'number'/'boolean'/'array' 만 허용"
        );
    }

    private String buildUserPrompt(PrefillFromSourceRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("[신규 화면 메타]\n");
        sb.append("- newMenuCd     : ").append(nullSafe(req.getNewMenuCd())).append("\n");
        sb.append("- newTitle      : ").append(nullSafe(req.getNewTitle())).append("\n");
        sb.append("- moduleCode    : ").append(nullSafe(req.getModuleCode())).append("\n");
        sb.append("- sourceMenuCd  : ").append(nullSafe(req.getSourceMenuCd())).append("\n\n");

        Map<String, Object> bundle = req.getSourceBundle();
        if (bundle == null || bundle.isEmpty()) {
            sb.append("[경고] sourceBundle 이 비어있습니다. 추측하지 말고 빈 spec 을 반환하세요.\n");
            return sb.toString();
        }

        // ── screen JSX (legacy fallback 포함) ─────────────────────────
        String screenSrc = extractScreenSource(bundle);
        sb.append("=== [화면 JSX 본문] (").append(screenSrc.length()).append(" chars)\n");
        sb.append(truncate(screenSrc, MAX_FIELD_CHARS));
        sb.append("\n\n");

        // ── frontendSources (store/hook/utils 등 — SP 상수 정의가 있을 수 있음) ──
        List<Map<String, Object>> frontendSources = pickFrontendSources(bundle);
        if (!frontendSources.isEmpty()) {
            sb.append("=== [frontend sources — store/hook/utils] ===\n");
            int cnt = 0;
            for (Map<String, Object> s : frontendSources) {
                if (cnt++ >= MAX_BACKEND_FILES_PER_KIND) break;
                Object pathObj = s.get("path");
                Object srcObj  = s.get("source");
                if (srcObj == null) srcObj = s.get("content");
                String path = pathObj == null ? "" : pathObj.toString();
                String src  = srcObj  == null ? "" : srcObj.toString();
                sb.append("--- ").append(path).append(" ---\n");
                sb.append(truncate(src, MAX_BACKEND_BODY_CHARS)).append("\n");
            }
            sb.append("\n");
        }

        // ── frontendProcedures (JSX 등에서 발견된 SP 목록) ───────────
        Object fp = bundle.get("frontendProcedures");
        if (fp instanceof List<?> && !((List<?>) fp).isEmpty()) {
            sb.append("=== [frontend procedures — JSX/hook 에서 추출된 SP 목록] ===\n");
            for (Object o : (List<?>) fp) {
                if (o instanceof Map<?, ?>) {
                    Map<?, ?> m = (Map<?, ?>) o;
                    sb.append("- ").append(m.get("procedure"))
                      .append(" @ ").append(m.get("path")).append("\n");
                }
            }
            sb.append("\n");
        }

        // ── backend (controllers/services/repositories/entities/procedures) ──
        // ★ 본문(source) 까지 truncate 해서 전달 — AI 가 SP 호출 위치를 정확히 파악
        Object backendObj = bundle.get("backend");
        if (backendObj instanceof Map<?, ?>) {
            Map<?, ?> backend = (Map<?, ?>) backendObj;
            appendListSectionWithSource(sb, "[backend.controllers]", backend.get("controllers"),
                                        List.of("className", "path", "apiUrl"));
            appendListSectionWithSource(sb, "[backend.services]",    backend.get("services"),
                                        List.of("className", "path"));
            appendListSectionWithSource(sb, "[backend.repositories]", backend.get("repositories"),
                                        List.of("className", "path"));
            appendListSection(sb, "[backend.entities]", backend.get("entities"),
                              List.of("className", "path"));
            appendListSectionWithSource(sb, "[backend.procedures — SP DDL 본문]",
                                        backend.get("procedures"),
                                        List.of("procedure", "name", "serviceId", "apiMethod"));
        }

        // ── apiCalls ────────────────────────────────────────────────
        Object apiCalls = bundle.get("apiCalls");
        if (apiCalls instanceof List<?> && !((List<?>) apiCalls).isEmpty()) {
            sb.append("=== [apiCalls] ===\n");
            for (Object o : (List<?>) apiCalls) {
                if (o instanceof Map<?, ?>) {
                    Map<?, ?> m = (Map<?, ?>) o;
                    sb.append("- ").append(m.get("method"))
                      .append(" ").append(m.get("urlPattern"))
                      .append(" (raw: ").append(m.get("rawUrl")).append(")\n");
                }
            }
            sb.append("\n");
        }

        sb.append("\n위 sourceBundle 을 분석해 9단계 spec JSON 을 반환하세요.\n");
        sb.append("★ Step4 의 crudSp/allSpNames 는 sourceBundle 의 모든 텍스트(JSX·frontend sources·backend Java·SP DDL)에서\n");
        sb.append("  SP_UI_*/SRV_(GET|SET)_SP_UI_* 패턴을 빠짐없이 추출하고 suffix(_Q*/_S*/_U*/_D*)로 정확히 분류하세요.\n");
        sb.append("출력은 시스템 프롬프트의 JSON 구조를 정확히 따라야 하며, JSON 외 다른 텍스트는 절대 포함하지 마세요.");
        return sb.toString();
    }

    /**
     * sourceBundle.frontendSources 가 누락된 응답(legacy)에서도 sources[].type='COMPONENT' 를 활용.
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> pickFrontendSources(Map<String, Object> bundle) {
        Object fs = bundle.get("frontendSources");
        if (fs instanceof List<?> && !((List<?>) fs).isEmpty()) {
            return (List<Map<String, Object>>) fs;
        }
        Object sources = bundle.get("sources");
        if (sources instanceof List<?>) {
            List<Map<String, Object>> out = new java.util.ArrayList<>();
            for (Object o : (List<?>) sources) {
                if (!(o instanceof Map<?, ?>)) continue;
                Map<?, ?> m = (Map<?, ?>) o;
                if ("COMPONENT".equals(m.get("type"))) {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("path", m.get("path"));
                    entry.put("source", m.get("content") != null ? m.get("content") : m.get("source"));
                    out.add(entry);
                }
            }
            return out;
        }
        return Collections.emptyList();
    }

    /**
     * appendListSection 의 source 본문 포함 버전 — 각 파일의 source 를 truncate 해서 함께 출력.
     * 토큰 폭주 방지: 카테고리별 최대 MAX_BACKEND_FILES_PER_KIND 개 + 본문 MAX_BACKEND_BODY_CHARS chars.
     */
    @SuppressWarnings("unchecked")
    private void appendListSectionWithSource(StringBuilder sb, String header, Object list, List<String> keys) {
        if (!(list instanceof List<?>)) return;
        List<Object> arr = (List<Object>) list;
        if (arr.isEmpty()) return;
        sb.append("=== ").append(header).append(" (총 ").append(arr.size()).append(" 파일) ===\n");
        int cnt = 0;
        for (Object o : arr) {
            if (!(o instanceof Map<?, ?>)) continue;
            Map<?, ?> m = (Map<?, ?>) o;
            // 메타라인
            sb.append("- ");
            boolean first = true;
            for (String k : keys) {
                Object v = m.get(k);
                if (v == null) continue;
                if (!first) sb.append(" | ");
                sb.append(k).append("=").append(v);
                first = false;
            }
            sb.append("\n");
            // 본문 (앞쪽 N 파일만)
            if (cnt++ < MAX_BACKEND_FILES_PER_KIND) {
                Object src = m.get("source");
                if (src == null) src = m.get("content");
                if (src == null) src = m.get("body");
                if (src != null) {
                    sb.append("```\n").append(truncate(src.toString(), MAX_BACKEND_BODY_CHARS))
                      .append("\n```\n");
                }
            }
        }
        sb.append("\n");
    }

    private String extractScreenSource(Map<String, Object> bundle) {
        // 1차: raw bundle 의 screen 키
        Object screen = bundle.get("screen");
        if (screen instanceof String) return (String) screen;
        if (screen instanceof Map<?, ?>) {
            Map<?, ?> m = (Map<?, ?>) screen;
            Object s = m.get("source");
            if (s == null) s = m.get("content");
            if (s == null) s = m.get("body");
            if (s != null) return s.toString();
        }
        // 2차: legacy 응답 형식 (sources[].type='SCREEN')
        Object sources = bundle.get("sources");
        if (sources instanceof List<?>) {
            for (Object o : (List<?>) sources) {
                if (!(o instanceof Map<?, ?>)) continue;
                Map<?, ?> m = (Map<?, ?>) o;
                if ("SCREEN".equals(m.get("type"))) {
                    Object c = m.get("content");
                    if (c == null) c = m.get("source");
                    if (c != null) return c.toString();
                }
            }
        }
        return "";
    }

    @SuppressWarnings("unchecked")
    private void appendListSection(StringBuilder sb, String header, Object list, List<String> keys) {
        if (!(list instanceof List<?>)) return;
        List<Object> arr = (List<Object>) list;
        if (arr.isEmpty()) return;
        sb.append("=== ").append(header).append(" ===\n");
        for (Object o : arr) {
            if (o instanceof Map<?, ?>) {
                Map<?, ?> m = (Map<?, ?>) o;
                sb.append("- ");
                boolean first = true;
                for (String k : keys) {
                    Object v = m.get(k);
                    if (v == null) continue;
                    if (!first) sb.append(" | ");
                    sb.append(k).append("=").append(v);
                    first = false;
                }
                sb.append("\n");
            }
        }
        sb.append("\n");
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        if (s.length() <= max) return s;
        return s.substring(0, max) + "\n...[truncated " + (s.length() - max) + " chars]";
    }

    private String nullSafe(String s) {
        return s == null ? "" : s;
    }

    private String extractText(MessagesResponse resp) {
        if (resp == null || resp.getContent() == null) return "";
        StringBuilder sb = new StringBuilder();
        for (Object block : resp.getContent()) {
            if (block instanceof Map) {
                Object t = ((Map<?, ?>) block).get("type");
                if ("text".equals(t)) {
                    Object tx = ((Map<?, ?>) block).get("text");
                    if (tx != null) sb.append(tx);
                }
            } else if (block instanceof TextBlock) {
                sb.append(((TextBlock) block).getText());
            }
        }
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJsonObject(String raw) {
        if (raw == null || raw.isBlank()) return Collections.emptyMap();
        String text = raw.trim();
        Pattern fenced = Pattern.compile("```(?:json)?\\s*([\\s\\S]*?)```", Pattern.MULTILINE);
        Matcher fm = fenced.matcher(text);
        if (fm.find()) text = fm.group(1).trim();
        int start = text.indexOf('{');
        int end   = text.lastIndexOf('}');
        if (start >= 0 && end > start) text = text.substring(start, end + 1);
        try {
            return (Map<String, Object>) objectMapper.readValue(text, Map.class);
        } catch (Exception e) {
            log.warn("Claude prefill 응답 JSON 파싱 실패: {} (raw 일부: {})",
                    e.getMessage(), raw.length() > 200 ? raw.substring(0, 200) : raw);
            return Collections.emptyMap();
        }
    }
}

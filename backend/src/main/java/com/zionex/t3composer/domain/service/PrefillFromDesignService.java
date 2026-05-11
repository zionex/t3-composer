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
import com.zionex.t3composer.domain.dto.PrefillFromDesignRequest;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * NEW_FROM_DESIGN 모드 — Excel 설계서를 분석해 9단계 spec JSON 을 한 번에 prefill.
 *
 * `PrefillFromSourceService` 와 동일한 패턴 — sourceBundle 대신 parsedDesign(Excel sheets) 입력.
 * 정규식 baseline (`createInitialSpecFromDesign`) 만으로는 Step4(데이터 호출 SP)/Step6/Step7/Step8
 * 이 채워지지 않아 사용자가 모두 수동 입력해야 하는 문제를 LLM 한 번 호출로 해결.
 *
 * 응답: wizardState.createInitialSpec() 와 동일 구조의 JSON. frontend 는 정규식 baseline 과
 * `mergeAiSpecIntoBaseSpec` 로 깊게 병합 후 StepByStepWizard 에 전달.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PrefillFromDesignService {

    private static final String MODEL_NAME = "claude-sonnet-4-5";
    private static final int    MAX_TOKENS = 8192;
    // 시트당 최대 직렬화 길이 — Excel 의 grid-N 시트가 컬럼 100개 가까이 되면 토큰 폭주 가능
    private static final int    MAX_SHEET_CHARS = 8000;
    // 사용자 프롬프트 전체 하드 캡 — Anthropic 요청 안전 마진 (~80K chars ≈ 25K tokens)
    private static final int    USER_PROMPT_HARD_CAP_CHARS = 80000;

    private final AnthropicClient anthropicClient;
    private final AnthropicApiKeyService apiKeyService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Object> prefill(String userId, PrefillFromDesignRequest req) {
        String apiKey = apiKeyService.getApiKey(userId)
                .orElseThrow(() -> new IllegalStateException(
                        "Anthropic API 키가 등록되지 않았습니다. 먼저 /composer/apikey 에 저장하세요."));

        String systemPrompt = buildSystemPrompt();
        String userPrompt   = buildUserPrompt(req);

        if (userPrompt.length() > USER_PROMPT_HARD_CAP_CHARS) {
            log.warn("prefill-from-design userPrompt 가 캡({})을 초과 — {} chars 잘라서 전송 (fileName={})",
                    USER_PROMPT_HARD_CAP_CHARS, userPrompt.length() - USER_PROMPT_HARD_CAP_CHARS,
                    req.getFileName());
            userPrompt = userPrompt.substring(0, USER_PROMPT_HARD_CAP_CHARS)
                    + "\n\n...[전체 페이로드 캡 초과 — 이후 시트 잘림]";
        }

        log.info("prefill-from-design 호출: fileName={} → newMenuCd={} userPromptLen={} systemPromptLen={}",
                req.getFileName(), req.getNewMenuCd(), userPrompt.length(), systemPrompt.length());

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
            log.error("prefill-from-design Anthropic 호출 실패: type={} message={} (fileName={}, userPromptLen={})",
                    e.getClass().getSimpleName(), e.getMessage(),
                    req.getFileName(), userPrompt.length(), e);
            throw new IllegalStateException(
                    "Claude API 호출 실패: " + e.getClass().getSimpleName()
                    + " - " + (e.getMessage() != null ? e.getMessage() : "unknown"), e);
        }

        String text = extractText(resp);
        log.debug("Claude raw response (prefill-from-design): {} chars", text == null ? 0 : text.length());

        Map<String, Object> spec = parseJsonObject(text);
        Map<String, Object> out = new HashMap<>();
        out.put("spec", spec);
        out.put("modelName", resp != null ? resp.getModel() : MODEL_NAME);
        return out;
    }

    private String buildSystemPrompt() {
        return String.join("\n",
            "당신은 T3Series Composer 의 화면 설계서 분석 전문가입니다.",
            "Excel 화면설계서(8 시트: 개정이력 / 개요 / 레이아웃 / 조회조건 / 그리드 목록 / grid-N(여러개) / table / query) 를",
            "분석해 9단계 wizard spec JSON 을 정확히 prefill 합니다.",
            "",
            "★ 절대 규칙",
            "1. 출력은 순수 JSON 만. 마크다운/설명/코드 펜스 금지.",
            "2. 추측 금지 — 설계서에서 확인되지 않는 값은 빈 문자열 또는 빈 배열.",
            "3. 모든 step 을 빠짐없이 채울 것. 특히 Step4(dataBinding) / Step7(filter) / Step8(filterCascade) 는",
            "   설계서의 query 시트 / 조회조건 시트 / 의존성 정보 기반으로 정확히 매핑.",
            "4. layer/grid 가 여러 개면 각각 별도 entry. 각 grid 마다 dataBinding/columns 를 분리.",
            "5. SP 가 query 시트에 명시 → source='SP'. 각 SP 의 suffix 로 read/create/update/delete 분류.",
            "   _Q\\d* / _SEARCH / _LIST → crudSp.read",
            "   _S\\d* / _SAVE / _INSERT → crudSp.create",
            "   _U\\d* / _UPDATE → crudSp.update",
            "   _D\\d* / _DELETE → crudSp.delete",
            "6. SP 가 없고 zAxios URL 만 있으면 → source='JPA_ENTITY' + baseUrl + entity",
            "7. 조회조건 시트의 모든 행은 step7_filter.fields 에 매핑. SCM 도메인 필드는 DOMAIN_* 타입 선호.",
            "8. 그리드 시트(grid-N) 의 컬럼 명세는 step5_columns 에 모두 매핑 (name/fieldName/header/type/width/editable/textAlignment 등).",
            "9. MENU_CD 형식: UI_<DOMAIN>_<NAME> · MENU_FILE_PATH: /<module>[/<category>]/<PascalComponentName>",
            "10. areaId 일관성: step1.areas[].id == step1.layoutConfig.layers[].key == step3/4/5/6 의 키.",
            "    BaseGrid id (예: 'userInfoGrid') 가 있으면 그대로 사용. SearchArea 가 있으면 첫 area = 'mainSearch'.",
            "",
            "★ 출력 JSON 구조 (정확히 이 키 사용)",
            "{",
            "  \"step1_layout\": {",
            "    \"patternCode\": \"P02\",",
            "    \"areas\": [{ \"id\": \"...\", \"kind\": \"search|grid|tree\", \"parent\": null, \"title\": \"...\" }],",
            "    \"layoutConfig\": {",
            "      \"cols\": 12, \"rowHeight\": 30,",
            "      \"layers\": [{ \"key\": \"<gridId>\", \"x\":0, \"y\":0, \"w\":12, \"h\":12, \"title\":\"...\", \"componentType\":\"GRID_BASE\" }],",
            "      \"filterBar\": { \"h\": 2, \"items\": [{ \"key\": \"<varName>\", \"label\": \"...\" }] }",
            "    }",
            "  },",
            "  \"step2_overview\": { \"screenId\":\"\", \"screenName\":\"\", \"menuCd\":\"\", \"parentMenuCd\":\"\", \"menuFilePath\":\"\", \"langKey\":\"\", \"description\":\"\" },",
            "  \"step3_components\": { \"<areaId>\": { \"components\": [{ \"kind\":\"BaseGrid|SearchArea|TreeGrid\", \"id\":\"\", \"title\":\"\" }], \"buttons\": [{ \"kind\":\"GridSaveButton|GridDeleteRowButton|GridAddRowButton|GridExcelExportButton\", \"grid\":\"\" }] } },",
            "  \"step4_dataBinding\": { \"<gridAreaId>\": { \"source\":\"SP|JPA_ENTITY\", \"spName\":\"<read SP>\", \"target\":\"mp|dp|bf|fp\", \"crudSp\":{ \"read\":\"\", \"create\":\"\", \"update\":\"\", \"delete\":\"\" }, \"allSpNames\":[\"\"], \"baseUrl\":\"\", \"entity\":\"\", \"methods\":{\"search\":\"\",\"save\":\"\",\"delete\":\"\"} } },",
            "  \"step5_columns\": { \"<gridAreaId>\": { \"columns\": [{ \"name\":\"\", \"fieldName\":\"\", \"dataType\":\"text|number|datetime|boolean\", \"headerText\":\"\", \"width\":120, \"editable\":false, \"visible\":true, \"textAlignment\":\"left|center|far\" }] } },",
            "  \"step6_cascade\": {},",
            "  \"step7_filter\": { \"blockId\":\"filter_main\", \"fields\": [{ \"fieldId\":\"UPPER_SNAKE\", \"varName\":\"camelCase\", \"type\":\"TEXT|NUMBER|DATE|DATE_RANGE|DROPDOWN|CHECKBOX|RADIO|POPUP|AUTOCOMPLETE|DOMAIN_PLAN_SCOPE\", \"label\":\"\", \"dataType\":\"string|number|boolean|array\", \"nullWhenEmpty\":true, \"required\":false }] },",
            "  \"step8_filterCascade\": { \"dependencies\": [], \"crossFieldRules\": [] }",
            "}",
            "",
            "★ Step4 의 crudSp 가 핵심:",
            "   설계서 query 시트의 행을 모두 스캔해 SP_UI_*/FN_*/SP_COMM_* 패턴을 grep.",
            "   각 SP 의 suffix 로 정확히 read/create/update/delete 매핑.",
            "   spName 은 read SP 와 동일하게 두기 (호환).",
            "   target 은 SP 이름 prefix 로 추정 (BF→bf, DP→dp, FP→fp, 그 외→mp).",
            "   ★ allSpNames 에는 발견된 모든 SP 를 빠짐없이 (중복 제거하여) 채움.",
            "   ★ 한 영역에서 SP 가 발견되었는데 crudSp 가 빈 문자열만 있으면 안 됨. 최소한 read 는 채워야 함.",
            "",
            "★ Step7 의 filter.fields 매핑 (조회조건 시트 → wizard step7):",
            "   조회조건 시트의 각 행 = 한 검색 필드.",
            "   - name 컬럼 → varName (camelCase)",
            "   - label 컬럼 → label",
            "   - 다국어 컬럼 → labelI18nKey",
            "   - type 컬럼 → type (위젯 종류) — TEXT/DROPDOWN/DATE/POPUP 등으로 정규화",
            "   - 필수 → required",
            "   - default → defaultValue",
            "   - 옵션/그룹코드 → optionsSource (common_code/sp/inline)",
            "   - SCM 도메인 필드명(품목/거래처/거점/PlanScope/Version 등)이면 DOMAIN_* 타입 우선 선택",
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

    private String buildUserPrompt(PrefillFromDesignRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("[신규 화면 메타]\n");
        sb.append("- newMenuCd  : ").append(nullSafe(req.getNewMenuCd())).append("\n");
        sb.append("- newTitle   : ").append(nullSafe(req.getNewTitle())).append("\n");
        sb.append("- moduleCode : ").append(nullSafe(req.getModuleCode())).append("\n");
        sb.append("- fileName   : ").append(nullSafe(req.getFileName())).append("\n\n");

        Map<String, Object> design = req.getParsedDesign();
        if (design == null || design.isEmpty()) {
            sb.append("[경고] parsedDesign 이 비어있습니다. 추측하지 말고 빈 spec 을 반환하세요.\n");
            return sb.toString();
        }

        // ── overview / layout 메타 (frontend 가 미리 분석한 결과) ─────────
        Object overview = design.get("overview");
        if (overview != null) {
            sb.append("=== [overview — frontend 1차 분석 결과] ===\n");
            sb.append(safeJson(overview)).append("\n\n");
        }
        Object layout = design.get("layout");
        if (layout != null) {
            sb.append("=== [layout — frontend 1차 레이아웃 추정] ===\n");
            sb.append(safeJson(layout)).append("\n\n");
        }

        // ── 시트 본문 직렬화 (rawRows) ─────────────────────────
        Object sheetsObj = design.get("sheets");
        if (sheetsObj instanceof List<?>) {
            List<?> sheets = (List<?>) sheetsObj;
            sb.append("=== [Excel 시트 목록] (총 ").append(sheets.size()).append(" 시트) ===\n");
            for (Object o : sheets) {
                if (!(o instanceof Map<?, ?>)) continue;
                Map<?, ?> sheet = (Map<?, ?>) o;
                String name = String.valueOf(sheet.get("name"));
                Object rowsObj = sheet.get("rawRows");
                if (rowsObj == null) rowsObj = sheet.get("preview");
                String body = serializeRows(rowsObj);
                sb.append("\n--- 시트: ").append(name).append(" (").append(body.length()).append(" chars) ---\n");
                sb.append(truncate(body, MAX_SHEET_CHARS));
                sb.append("\n");
            }
        }

        sb.append("\n위 설계서를 분석해 9단계 spec JSON 을 반환하세요.\n");
        sb.append("★ Step4 는 query 시트의 SP 이름을 모두 추출하고 suffix 로 CRUD 분류 — read 가 비면 안 됨.\n");
        sb.append("★ Step5 는 grid-N 시트의 컬럼 명세를 빠짐없이 매핑.\n");
        sb.append("★ Step7 은 조회조건 시트의 모든 행을 검색 필드로 매핑.\n");
        sb.append("출력은 시스템 프롬프트의 JSON 구조를 정확히 따라야 하며, JSON 외 다른 텍스트는 절대 포함하지 마세요.");
        return sb.toString();
    }

    /** rawRows ([][]) 를 사람이 읽기 좋은 표 형식으로 직렬화. */
    private String serializeRows(Object rowsObj) {
        if (!(rowsObj instanceof List<?>)) return "";
        List<?> rows = (List<?>) rowsObj;
        StringBuilder sb = new StringBuilder();
        for (Object r : rows) {
            if (r instanceof List<?>) {
                List<?> cells = (List<?>) r;
                boolean first = true;
                for (Object c : cells) {
                    if (!first) sb.append(" | ");
                    String s = c == null ? "" : c.toString().replace("\n", " ").trim();
                    sb.append(s);
                    first = false;
                }
                sb.append("\n");
            }
        }
        return sb.toString();
    }

    private String safeJson(Object obj) {
        try { return objectMapper.writeValueAsString(obj); }
        catch (Exception e) { return String.valueOf(obj); }
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
            log.warn("Claude prefill-from-design 응답 JSON 파싱 실패: {} (raw 일부: {})",
                    e.getMessage(), raw.length() > 200 ? raw.substring(0, 200) : raw);
            return new LinkedHashMap<>();
        }
    }
}

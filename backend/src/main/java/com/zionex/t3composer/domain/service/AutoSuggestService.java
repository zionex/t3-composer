package com.zionex.t3composer.domain.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3composer.domain.client.AnthropicClient;
import com.zionex.t3composer.domain.client.AnthropicModels.Message;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesRequest;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;
import com.zionex.t3composer.domain.client.AnthropicModels.SystemBlock;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Phase 2D-3 — AI 추천 (FilterBar fields + Layer relations).
 *
 * 사용자의 현재 4-step ComposerSpec (meta + layers + dataSource) 을 Claude 에 전송 →
 * "이 화면에 자주 필요할 검색조건 + layer 관계" JSON 응답 → frontend 가 미리보기 후 적용.
 *
 * Spec: docs/superpowers/specs/2026-05-25-composer-canvas-phase2d3-ai-suggest-design.md
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AutoSuggestService {

    private final AnthropicClient anthropicClient;
    private final AnthropicApiKeyService apiKeyService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // 짧은 응답 — claude-sonnet 모델 + 4000 max_tokens 면 충분 (보통 1k 이하).
    private static final String MODEL = "claude-sonnet-4-5";
    private static final int MAX_TOKENS = 4000;

    private static final String SYSTEM_PROMPT =
            "당신은 신규 화면 생성 도구 (T3Composer) 의 보조자입니다. 사용자가 만들고 있는 화면의 "
          + "layers / dataSource / meta 를 분석해 자주 필요할 검색조건(FilterBar)과 layer 간 "
          + "관계(master-detail 등)를 추천하세요.\n\n"
          + "응답은 반드시 다음 JSON 형식만 반환하세요 (설명·markdown·코드펜스 금지):\n"
          + "{\n"
          + "  \"filterFields\": [\n"
          + "    {\"label\": \"<한국어 라벨>\", \"type\": \"<enum>\"}\n"
          + "  ],\n"
          + "  \"relations\": [\n"
          + "    {\n"
          + "      \"sourceLayerKey\": \"<spec.layers[i].key>\",\n"
          + "      \"sourceEvent\":    \"<enum>\",\n"
          + "      \"targetLayerKey\": \"<spec.layers[i].key>\",\n"
          + "      \"targetAction\":   \"<enum>\",\n"
          + "      \"mapping\": {\"<sourceField>\": \"<targetParam>\"}\n"
          + "    }\n"
          + "  ]\n"
          + "}\n\n"
          + "[filterFields.type enum]\n"
          + "TEXT, NUMBER, SELECT, DATE_RANGE,\n"
          + "DOMAIN_PLAN_SCOPE, DOMAIN_ITEM_MULTI, DOMAIN_ACCOUNT_MULTI,\n"
          + "DOMAIN_LOCATION_MULTI, DOMAIN_VERSION\n\n"
          + "[relations.sourceEvent enum]\n"
          + "cellClick, cellDblClick, selectionChange, valueChange, manual\n\n"
          + "[relations.targetAction enum]\n"
          + "refetch, filter, setValue\n\n"
          + "[지침]\n"
          + "- 추천 개수는 각 3~7개 수준. 화면 의도에 명확히 도움될 것만.\n"
          + "- relations.sourceLayerKey/targetLayerKey 는 반드시 입력 layers 의 key 값.\n"
          + "- mapping 키/값은 추측 가능한 컬럼명 (camelCase 권장).\n"
          + "- layer 1개면 relations 빈 배열 []. layer 2개 이상이면 master-detail 패턴 우선 추천.\n"
          + "- 화면 의도가 모호하면 적게 추천. 응답은 반드시 valid JSON.";

    /**
     * spec → 추천 결과 (filterFields, relations).
     *
     * @param userId  현재 사용자 — Claude API key 조회용
     * @param spec    4-step ComposerSpec (meta + layers + ...)
     * @return        { filterFields: [...], relations: [...] }
     */
    public Map<String, Object> suggest(String userId, Map<String, Object> spec) {
        if (spec == null) {
            return defaultEmptyResult();
        }
        String apiKey = apiKeyService.getApiKey(userId)
                .orElseThrow(() -> new IllegalStateException(
                    "Anthropic API key 가 등록되어 있지 않습니다. 우상단 [API 키] 에서 등록하세요."));

        String userPrompt = buildUserPrompt(spec);
        log.info("AutoSuggest: userId={} prompt_chars={}", userId, userPrompt.length());

        MessagesRequest req = MessagesRequest.builder()
                .model(MODEL)
                .max_tokens(MAX_TOKENS)
                .system(List.of(SystemBlock.builder().type("text").text(SYSTEM_PROMPT).build()))
                .messages(List.of(Message.builder().role("user").content(userPrompt).build()))
                .build();

        MessagesResponse resp = anthropicClient.sendMessages(apiKey, req).block();
        if (resp == null) {
            log.warn("AutoSuggest: empty response");
            return defaultEmptyResult();
        }

        String text = extractText(resp);
        log.info("AutoSuggest: response_chars={}", text.length());

        // JSON 파싱 — Claude 가 markdown 코드펜스로 감쌌어도 추출 시도
        Map<String, Object> parsed = parseSuggestJson(text);
        return normalize(parsed, spec);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 헬퍼
    // ──────────────────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private String buildUserPrompt(Map<String, Object> spec) {
        StringBuilder sb = new StringBuilder();

        // meta
        Map<String, Object> meta = (Map<String, Object>) spec.get("meta");
        if (meta != null) {
            sb.append("[화면 메타]\n");
            if (meta.get("title") != null)       sb.append("- title: ").append(meta.get("title")).append("\n");
            if (meta.get("menuCd") != null)      sb.append("- menuCd: ").append(meta.get("menuCd")).append("\n");
            if (meta.get("pattern") != null)     sb.append("- pattern: ").append(meta.get("pattern")).append("\n");
            sb.append("\n");
        }

        // layers
        List<Map<String, Object>> layers = (List<Map<String, Object>>) spec.get("layers");
        if (layers != null && !layers.isEmpty()) {
            sb.append("[Layers (").append(layers.size()).append(")]\n");
            for (int i = 0; i < layers.size(); i++) {
                Map<String, Object> l = layers.get(i);
                sb.append(i + 1).append(". ").append(l.get("key"))
                  .append(" · ").append(l.get("type"))
                  .append(" · ").append(l.get("title")).append("\n");

                Map<String, Object> ds = (Map<String, Object>) l.get("dataSource");
                if (ds != null) {
                    List<Map<String, Object>> refs = (List<Map<String, Object>>) ds.get("references");
                    if (refs != null && !refs.isEmpty()) {
                        List<String> refStrs = new ArrayList<>();
                        for (Map<String, Object> r : refs) {
                            refStrs.add(r.get("kind") + ":" + r.get("name"));
                        }
                        sb.append("   참조: ").append(String.join(", ", refStrs)).append("\n");
                    }
                    String nl = (String) ds.get("naturalText");
                    if (nl != null && !nl.isBlank()) {
                        sb.append("   자연어: ").append(nl.trim().replaceAll("\\s+", " ")).append("\n");
                    }
                }

                List<Map<String, Object>> cols = (List<Map<String, Object>>) l.get("columns");
                if (cols != null && !cols.isEmpty()) {
                    List<String> colStrs = new ArrayList<>();
                    for (Map<String, Object> c : cols) {
                        Object name = c.get("name") != null ? c.get("name") : c.get("fieldName");
                        if (name != null) colStrs.add(name.toString());
                    }
                    sb.append("   컬럼: ").append(String.join(", ", colStrs)).append("\n");
                }
            }
            sb.append("\n");
        }

        // 기존 FilterBar/relations (참고 — 중복 제안 회피용)
        Map<String, Object> fb = (Map<String, Object>) spec.get("filterBar");
        if (fb != null) {
            List<Map<String, Object>> items = (List<Map<String, Object>>) fb.get("items");
            if (items != null && !items.isEmpty()) {
                sb.append("[이미 추가된 FilterBar (중복 추천 회피)]\n");
                for (Map<String, Object> it : items) {
                    sb.append("- ").append(it.get("label")).append(" (").append(it.get("type")).append(")\n");
                }
                sb.append("\n");
            }
        }
        List<Map<String, Object>> rels = (List<Map<String, Object>>) spec.get("relations");
        if (rels != null && !rels.isEmpty()) {
            sb.append("[이미 추가된 관계 (중복 추천 회피)]\n");
            for (Map<String, Object> r : rels) {
                Map<String, Object> src = (Map<String, Object>) r.get("source");
                Map<String, Object> tgt = (Map<String, Object>) r.get("target");
                if (src != null && tgt != null) {
                    sb.append("- ").append(src.get("layerKey")).append(" → ").append(tgt.get("layerKey")).append("\n");
                }
            }
        }

        return sb.toString();
    }

    private String extractText(MessagesResponse resp) {
        if (resp == null || resp.getContent() == null) return "";
        StringBuilder sb = new StringBuilder();
        for (Map<String, Object> block : resp.getContent()) {
            if ("text".equals(block.get("type"))) {
                Object t = block.get("text");
                if (t != null) sb.append(t);
            }
        }
        return sb.toString();
    }

    // markdown 코드펜스 ```json ... ``` 도 감지해 JSON 본문만 추출.
    private static final Pattern JSON_FENCE = Pattern.compile(
            "```(?:json)?\\s*\\n?(\\{.*?\\})\\s*\\n?```", Pattern.DOTALL);

    private Map<String, Object> parseSuggestJson(String text) {
        if (text == null || text.isBlank()) return defaultEmptyResult();
        String json = text.trim();
        // 코드펜스 안의 JSON 우선 추출
        Matcher m = JSON_FENCE.matcher(json);
        if (m.find()) {
            json = m.group(1);
        }
        // 그 외에도 첫 { 부터 마지막 } 까지 추출 (전후 텍스트 무시)
        int first = json.indexOf('{');
        int last  = json.lastIndexOf('}');
        if (first >= 0 && last > first) {
            json = json.substring(first, last + 1);
        }
        try {
            JsonNode root = objectMapper.readTree(json);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("filterFields", objectMapper.convertValue(root.get("filterFields"), List.class));
            result.put("relations",    objectMapper.convertValue(root.get("relations"),    List.class));
            return result;
        } catch (Exception e) {
            log.warn("AutoSuggest: JSON 파싱 실패. text head={}", text.substring(0, Math.min(200, text.length())));
            return defaultEmptyResult();
        }
    }

    // 응답 정규화 — enum 외 값, 존재하지 않는 layerKey 등 제거.
    @SuppressWarnings("unchecked")
    private Map<String, Object> normalize(Map<String, Object> result, Map<String, Object> spec) {
        if (result == null) return defaultEmptyResult();

        List<String> validTypes = Arrays.asList(
            "TEXT", "NUMBER", "SELECT", "DATE_RANGE",
            "DOMAIN_PLAN_SCOPE", "DOMAIN_ITEM_MULTI", "DOMAIN_ACCOUNT_MULTI",
            "DOMAIN_LOCATION_MULTI", "DOMAIN_VERSION");
        List<String> validEvents = Arrays.asList(
            "cellClick", "cellDblClick", "selectionChange", "valueChange", "manual");
        List<String> validActions = Arrays.asList("refetch", "filter", "setValue");

        // 유효한 layer key 셋
        java.util.Set<String> layerKeys = new java.util.HashSet<>();
        List<Map<String, Object>> layers = (List<Map<String, Object>>) spec.get("layers");
        if (layers != null) {
            for (Map<String, Object> l : layers) {
                if (l.get("key") != null) layerKeys.add(l.get("key").toString());
            }
        }

        // filterFields 정규화
        List<Map<String, Object>> fields = (List<Map<String, Object>>) result.get("filterFields");
        List<Map<String, Object>> okFields = new ArrayList<>();
        if (fields != null) {
            for (Map<String, Object> f : fields) {
                String label = (String) f.get("label");
                String type  = (String) f.get("type");
                if (label == null || label.isBlank()) continue;
                if (type == null || !validTypes.contains(type)) type = "TEXT";
                Map<String, Object> ok = new LinkedHashMap<>();
                ok.put("label", label.trim());
                ok.put("type",  type);
                okFields.add(ok);
            }
        }

        // relations 정규화
        List<Map<String, Object>> rels = (List<Map<String, Object>>) result.get("relations");
        List<Map<String, Object>> okRels = new ArrayList<>();
        if (rels != null) {
            for (Map<String, Object> r : rels) {
                String src = (String) r.get("sourceLayerKey");
                String tgt = (String) r.get("targetLayerKey");
                if (src == null || tgt == null) continue;
                if (!layerKeys.contains(src) || !layerKeys.contains(tgt)) continue;
                String ev = (String) r.get("sourceEvent");
                if (ev == null || !validEvents.contains(ev)) ev = "cellClick";
                String ac = (String) r.get("targetAction");
                if (ac == null || !validActions.contains(ac)) ac = "refetch";
                Map<String, Object> mapping = (Map<String, Object>) r.get("mapping");
                if (mapping == null) mapping = Collections.emptyMap();
                Map<String, Object> ok = new LinkedHashMap<>();
                ok.put("sourceLayerKey", src);
                ok.put("sourceEvent",    ev);
                ok.put("targetLayerKey", tgt);
                ok.put("targetAction",   ac);
                ok.put("mapping",        mapping);
                okRels.add(ok);
            }
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("filterFields", okFields);
        out.put("relations",    okRels);
        return out;
    }

    private Map<String, Object> defaultEmptyResult() {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("filterFields", Collections.emptyList());
        r.put("relations",    Collections.emptyList());
        return r;
    }
}

package com.zionex.t3composer.domain.service;

import com.zionex.t3composer.domain.dto.RecommendMockupRequest;
import com.zionex.t3composer.domain.client.AnthropicClient;
import com.zionex.t3composer.domain.client.AnthropicModels.CacheControl;
import com.zionex.t3composer.domain.client.AnthropicModels.Message;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesRequest;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;
import com.zionex.t3composer.domain.client.AnthropicModels.SystemBlock;
import com.zionex.t3composer.domain.client.AnthropicModels.TextBlock;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendMockupService {

    private static final String MODEL_NAME = "claude-sonnet-4-5";
    private static final int MAX_TOKENS = 1024;
    private static final int TOP_EXISTING = 4;
    private static final int TOP_SYNTHESIZED = 2; // used by parseSynthesized in next task

    private final AnthropicClient anthropicClient;
    private final AnthropicApiKeyService apiKeyService;
    private final ObjectMapper objectMapper;

    public Map<String, Object> recommend(String userId, RecommendMockupRequest req) {
        Optional<String> apiKeyOpt = apiKeyService.getApiKey(userId);
        if (apiKeyOpt.isEmpty()) {
            log.warn("[RecommendMockupService] API key not found for user {}, returning fallback", userId);
            return fallback();
        }

        List<Map<String, Object>> candidates = req.getCandidates();
        if (candidates == null || candidates.isEmpty()) {
            return fallback();
        }

        boolean synthesizeFlag = req.getSynthesize() == null || Boolean.TRUE.equals(req.getSynthesize());

        try {
            String apiKey = apiKeyOpt.get();
            String systemPrompt = buildSystemPrompt();
            String userPrompt = buildUserPrompt(req.getNl(), candidates);

            MessagesRequest mreq = MessagesRequest.builder()
                    .model(MODEL_NAME)
                    .max_tokens(MAX_TOKENS)
                    .temperature(0.0)
                    .system(List.of(
                            SystemBlock.builder()
                                    .type("text")
                                    .text(systemPrompt)
                                    .cacheControl(CacheControl.builder().type("ephemeral").build())
                                    .build()
                    ))
                    .messages(List.of(
                            Message.builder().role("user").content(userPrompt).build()
                    ))
                    .build();

            MessagesResponse resp = anthropicClient.sendMessages(apiKey, mreq).block();
            String rawText = extractText(resp);
            List<Map<String, Object>> items = parseItems(rawText, candidates);

            Set<String> validCodes = candidates.stream()
                    .map(c -> c.get("patternCode") instanceof String s ? s : null)
                    .filter(s -> s != null)
                    .collect(Collectors.toSet());
            List<Map<String, Object>> synthesized = synthesizeFlag
                    ? parseSynthesized(rawText, validCodes)
                    : new ArrayList<>();

            Map<String, Object> result = new HashMap<>();
            result.put("items", items);
            result.put("synthesized", synthesized);
            result.put("mode", "ai");
            result.put("model", resp != null ? resp.getModel() : MODEL_NAME);
            return result;

        } catch (Exception e) {
            log.warn("[RecommendMockupService] Anthropic call failed, returning fallback: {}", e.getMessage());
            return fallback();
        }
    }

    private String buildSystemPrompt() {
        return "You are a UI mockup recommendation assistant for T3SmartSCM, an enterprise SCM system.\n" +
               "Your task is to rank the provided mockup candidates by relevance to the user's natural language request,\n" +
               "and OPTIONALLY propose up to 2 synthesized mockups that combine layers from multiple candidates when\n" +
               "no single candidate covers the user's request well.\n\n" +
               "Rules:\n" +
               "1. Return ONLY a JSON object with keys \"items\" (array) and \"synthesized\" (array).\n" +
               "2. \"items\": rank candidates by relevance. Each item: { patternCode (string), relevance (integer 0-100), reason (string, Korean, max 30 chars) }.\n" +
               "   - Include only candidates from the provided list — do NOT invent new patternCode values.\n" +
               "   - Sort by relevance descending.\n" +
               "   - Return at most 4 items.\n" +
               "3. \"synthesized\": propose UP TO 2 synthesized mockups when combining layers from multiple candidates\n" +
               "   would serve the user's request better than any single candidate. Return [] if none beneficial.\n" +
               "   - Skip synthesis entirely if fewer than 3 candidates are provided.\n" +
               "   - The 2 synthesized must offer meaningfully different combinations (no near-duplicates).\n" +
               "   - Each synthesized item: { label (string, Korean), description (string, Korean), reason (string, Korean, max 60 chars), layers (array) }.\n" +
               "   - synthesized[].layers[]: { key (string, camelCase), title (string, Korean), type (string — copy from candidate layer type, e.g. 'GRID', 'CHART_LINE', 'KPI_CARD'), subtype (string or null), position ({x,y,w,h} integers), sourceMockupCode (string) }.\n" +
               "   - sourceMockupCode MUST reference a patternCode from the candidates list.\n" +
               "   - position uses a 12-column grid: x in [0,11], w in [1,12], x+w <= 12. y >= 0, h in [1,12].\n" +
               "   - Layers should not overlap and should fill the grid coherently.\n" +
               "4. If no candidates are relevant at all, return { \"items\": [], \"synthesized\": [] }.\n\n" +
               "Output format (JSON object only, no markdown fences, no extra text):\n" +
               "{\n" +
               "  \"items\": [ { \"patternCode\": \"...\", \"relevance\": 94, \"reason\": \"이유\" } ],\n" +
               "  \"synthesized\": [\n" +
               "    {\n" +
               "      \"label\": \"수요계획 입력 + 실적비교 대시보드\",\n" +
               "      \"description\": \"월별 입력 그리드 위에 전년 대비 KPI 와 실적 추이 차트\",\n" +
               "      \"reason\": \"단일 mockup 으로 입력+분석을 동시에 충족하는 것이 없음\",\n" +
               "      \"layers\": [\n" +
               "        { \"key\": \"kpiRow\",     \"title\": \"전년 대비 KPI\", \"type\": \"KPI_CARD\",   \"subtype\": null, \"position\": {\"x\":0,\"y\":0,\"w\":12,\"h\":2}, \"sourceMockupCode\": \"widget_dashboard\" },\n" +
               "        { \"key\": \"inputGrid\",  \"title\": \"월별 계획 입력\", \"type\": \"GRID\",       \"subtype\": null, \"position\": {\"x\":0,\"y\":2,\"w\":8,\"h\":6},  \"sourceMockupCode\": \"search_grid\" },\n" +
               "        { \"key\": \"trendChart\", \"title\": \"실적 추이\",      \"type\": \"CHART_LINE\", \"subtype\": null, \"position\": {\"x\":8,\"y\":2,\"w\":4,\"h\":6},  \"sourceMockupCode\": \"P09_chart_view\" }\n" +
               "      ]\n" +
               "    }\n" +
               "  ]\n" +
               "}";
    }

    private String buildUserPrompt(String nl, List<Map<String, Object>> candidates) {
        StringBuilder sb = new StringBuilder();
        sb.append("User request: ").append(nl != null ? nl : "(no description)").append("\n\n");
        sb.append("Mockup candidates (JSON array):\n");
        try {
            sb.append(objectMapper.writeValueAsString(candidates));
        } catch (Exception e) {
            sb.append(candidates.toString());
        }
        return sb.toString();
    }

    private String extractText(MessagesResponse resp) {
        if (resp == null || resp.getContent() == null) return "";
        StringBuilder sb = new StringBuilder();
        for (Object block : resp.getContent()) {
            if (block instanceof TextBlock tb) {
                sb.append(tb.getText());
            } else if (block instanceof Map<?, ?> m) {
                Object type = m.get("type");
                Object text = m.get("text");
                if ("text".equals(type) && text instanceof String s) {
                    sb.append(s);
                }
            }
        }
        return sb.toString().trim();
    }

    /**
     * Strip optional ```json fences, locate the outer { ... } object, and deserialize
     * it into a Map. Shared by parseItems and parseSynthesized — both methods read
     * different top-level keys from the same wrapper.
     */
    private Optional<Map<String, Object>> extractJsonWrapper(String rawText) {
        String json = rawText;
        java.util.regex.Matcher fence = java.util.regex.Pattern
                .compile("```(?:json)?\\s*([\\s\\S]*?)```")
                .matcher(rawText);
        if (fence.find()) {
            json = fence.group(1).trim();
        }
        int start = json.indexOf('{');
        int end = json.lastIndexOf('}');
        if (start < 0 || end < 0 || end <= start) {
            log.warn("[RecommendMockupService] No JSON object found in response");
            return Optional.empty();
        }
        try {
            Map<String, Object> wrapper = objectMapper.readValue(
                    json.substring(start, end + 1), new TypeReference<>() {});
            return Optional.of(wrapper);
        } catch (Exception e) {
            log.warn("[RecommendMockupService] Failed to parse AI response JSON: {}", e.getMessage());
            return Optional.empty();
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseItems(String rawText, List<Map<String, Object>> candidates) {
        // Build valid patternCode set for hallucination guard
        Set<String> validCodes = candidates.stream()
                .map(c -> {
                    Object pc = c.get("patternCode");
                    return pc instanceof String s ? s : null;
                })
                .filter(s -> s != null)
                .collect(Collectors.toSet());

        Optional<Map<String, Object>> wrapperOpt = extractJsonWrapper(rawText);
        if (wrapperOpt.isEmpty()) return new ArrayList<>();
        Map<String, Object> wrapper = wrapperOpt.get();
        Object itemsObj = wrapper.get("items");
        if (!(itemsObj instanceof List)) {
            log.warn("[RecommendMockupService] 'items' key missing or not a list in response");
            return new ArrayList<>();
        }
        List<Map<String, Object>> parsed = (List<Map<String, Object>>) itemsObj;
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> m : parsed) {
            Object pc = m.get("patternCode");
            if (!(pc instanceof String) || !validCodes.contains((String) pc)) {
                log.warn("[RecommendMockupService] Dropping hallucinated patternCode: {}", pc);
                continue;
            }
            Map<String, Object> item = new HashMap<>();
            item.put("patternCode", pc.toString());
            item.put("relevance", m.get("relevance"));
            item.put("reason", m.get("reason"));
            out.add(item);
            if (out.size() >= TOP_EXISTING) break;
        }
        return out;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseSynthesized(String rawText, Set<String> validCodes) {
        Optional<Map<String, Object>> wrapperOpt = extractJsonWrapper(rawText);
        if (wrapperOpt.isEmpty()) return new ArrayList<>();
        Map<String, Object> wrapper = wrapperOpt.get();
        Object synthObj = wrapper.get("synthesized");
        if (synthObj == null) {
            return new ArrayList<>();
        }
        if (!(synthObj instanceof List)) {
            log.warn("[RecommendMockupService] 'synthesized' is not a list (got {}). Treating as empty.",
                     synthObj.getClass().getSimpleName());
            return new ArrayList<>();
        }
        List<Map<String, Object>> rawItems = (List<Map<String, Object>>) synthObj;
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> item : rawItems) {
            Map<String, Object> validated = validateSynthesizedItem(item, validCodes);
            if (validated == null) continue;
            out.add(validated);
            if (out.size() >= TOP_SYNTHESIZED) break;
        }
        return out;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> validateSynthesizedItem(Map<String, Object> item, Set<String> validCodes) {
        if (item == null) return null;
        Object label = item.get("label");
        Object layersObj = item.get("layers");
        if (!(label instanceof String) || ((String) label).isBlank()) {
            log.warn("[RecommendMockupService] synthesized item missing label, dropped");
            return null;
        }
        if (!(layersObj instanceof List) || ((List<?>) layersObj).isEmpty()) {
            log.warn("[RecommendMockupService] synthesized item '{}' has no layers, dropped", label);
            return null;
        }
        List<Map<String, Object>> layers = (List<Map<String, Object>>) layersObj;
        List<Map<String, Object>> validatedLayers = new ArrayList<>();
        for (Map<String, Object> layer : layers) {
            if (!isValidLayer(layer, validCodes)) {
                log.warn("[RecommendMockupService] synthesized item '{}' dropped — invalid layer: {}", label, layer);
                return null;   // item-level conservatism: any invalid layer fails the whole item
            }
            // Normalize the layer to only the keys we promise downstream
            Map<String, Object> norm = new HashMap<>();
            norm.put("key",              layer.get("key"));
            norm.put("title",            layer.get("title"));
            norm.put("type",             layer.get("type"));
            norm.put("subtype",          layer.get("subtype"));
            norm.put("position",         layer.get("position"));
            norm.put("sourceMockupCode", layer.get("sourceMockupCode"));
            validatedLayers.add(norm);
        }
        Map<String, Object> out = new HashMap<>();
        out.put("label",       label);
        out.put("description", item.getOrDefault("description", ""));
        out.put("reason",      item.getOrDefault("reason", ""));
        out.put("layers",      validatedLayers);
        return out;
    }

    private boolean isValidLayer(Map<String, Object> layer, Set<String> validCodes) {
        if (layer == null) return false;
        Object key = layer.get("key");
        Object title = layer.get("title");
        Object type = layer.get("type");
        Object src = layer.get("sourceMockupCode");
        Object posObj = layer.get("position");

        if (!(key instanceof String) || ((String) key).isBlank()) return false;
        if (!(title instanceof String) || ((String) title).isBlank()) return false;
        if (!(type instanceof String) || ((String) type).isBlank()) return false;
        if (!(src instanceof String) || !validCodes.contains((String) src)) return false;
        if (!(posObj instanceof Map<?, ?> pos)) return false;

        Integer x = asInt(pos.get("x"));
        Integer y = asInt(pos.get("y"));
        Integer w = asInt(pos.get("w"));
        Integer h = asInt(pos.get("h"));
        if (x == null || y == null || w == null || h == null) return false;
        if (x < 0 || y < 0) return false;
        if (w < 1 || h < 1) return false;
        return x + w <= 12;
    }

    private static Integer asInt(Object v) {
        if (v instanceof Integer i) return i;
        if (v instanceof Number n) return n.intValue();
        if (v instanceof String s) {
            try { return Integer.parseInt(s.trim()); } catch (Exception e) { return null; }
        }
        return null;
    }

    private Map<String, Object> fallback() {
        Map<String, Object> result = new HashMap<>();
        result.put("items", List.of());
        result.put("synthesized", List.of());
        result.put("mode", "fallback");
        return result;
    }
}

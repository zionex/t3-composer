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

            Map<String, Object> result = new HashMap<>();
            result.put("items", items);
            result.put("synthesized", List.of());
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
               "Your task is to rank the provided mockup candidates by relevance to the user's natural language request.\n\n" +
               "Rules:\n" +
               "1. Return ONLY a JSON object with an \"items\" array. Each item must have keys: patternCode (string), relevance (integer 0-100), reason (string, Korean, max 30 chars).\n" +
               "2. Include only candidates from the provided list — do NOT invent new patternCode values.\n" +
               "3. Sort by relevance descending.\n" +
               "4. Return at most 3 items.\n" +
               "5. If no candidates are relevant, return { \"items\": [] }.\n\n" +
               "Output format (JSON object only, no markdown fences, no extra text):\n" +
               "{ \"items\": [ { \"patternCode\": \"...\", \"relevance\": 94, \"reason\": \"이유\" } ] }";
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

        // Strip fenced code blocks if present
        String json = rawText;
        java.util.regex.Matcher fence = java.util.regex.Pattern
                .compile("```(?:json)?\\s*([\\s\\S]*?)```")
                .matcher(rawText);
        if (fence.find()) {
            json = fence.group(1).trim();
        }

        // Extract JSON object wrapper { "items": [...] }
        int start = json.indexOf('{');
        int end = json.lastIndexOf('}');
        if (start < 0 || end < 0 || end <= start) {
            log.warn("[RecommendMockupService] No JSON object found in response, raw: {}", rawText);
            return new ArrayList<>();
        }
        json = json.substring(start, end + 1);

        try {
            Map<String, Object> wrapper = objectMapper.readValue(json, new TypeReference<>() {});
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
        } catch (Exception e) {
            log.warn("[RecommendMockupService] Failed to parse AI response JSON: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    private Map<String, Object> fallback() {
        Map<String, Object> result = new HashMap<>();
        result.put("items", List.of());
        result.put("synthesized", List.of());
        result.put("mode", "fallback");
        return result;
    }
}

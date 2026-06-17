package com.zionex.t3composer.domain.service;

import com.zionex.t3composer.domain.dto.Attachment;
import com.zionex.t3composer.domain.dto.PrefillFromSynthesizedRequest;
import com.zionex.t3composer.domain.client.LlmClient;
import com.zionex.t3composer.domain.client.AnthropicModels.CacheControl;
import com.zionex.t3composer.domain.client.AnthropicModels.Message;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesRequest;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;
import com.zionex.t3composer.domain.client.AnthropicModels.SystemBlock;
import com.zionex.t3composer.domain.client.AnthropicModels.TextBlock;
import com.zionex.t3composer.domain.util.MultimodalContentBuilder;
import com.zionex.t3composer.domain.util.PromptAttachmentInliner;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PrefillFromSynthesizedService {

    private static final String MODEL_NAME = "claude-sonnet-4-5";
    private static final int MAX_TOKENS = 2048;
    private static final int MAX_META_CHARS = 8000;

    private final LlmClient llmClient;
    private final AnthropicApiKeyService apiKeyService;
    private final ObjectMapper objectMapper;

    public Map<String, Object> prefill(String userId, PrefillFromSynthesizedRequest req) {
        Optional<String> apiKeyOpt = apiKeyService.getApiKey(userId);
        if (apiKeyOpt.isEmpty()) {
            log.warn("[PrefillFromSynthesizedService] API key not found for user {}, returning fallback", userId);
            return fallback();
        }

        try {
            String apiKey = apiKeyOpt.get();
            String systemPrompt = buildSystemPrompt();
            // AiRecommendPanel D&D 첨부 — 텍스트는 prompt 본문 끝에 inline, 바이너리는 multimodal blocks.
            String userPrompt = PromptAttachmentInliner.inline(buildUserPrompt(req), req.getTextAttachments());
            List<Attachment> bin = req.getBinaryAttachments();
            Object userContent = (bin != null && !bin.isEmpty())
                    ? MultimodalContentBuilder.build(userPrompt, bin)
                    : userPrompt;

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
                            Message.builder().role("user").content(userContent).build()
                    ))
                    .build();

            MessagesResponse resp = llmClient.sendMessages(apiKey, mreq).block();
            String rawText = extractText(resp);
            Map<String, Object> spec = parseSpec(rawText);

            Map<String, Object> out = new HashMap<>();
            out.put("spec", spec);
            out.put("mode", spec.isEmpty() ? "fallback" : "ai");
            out.put("model", resp != null ? resp.getModel() : MODEL_NAME);
            return out;

        } catch (Exception e) {
            log.warn("[PrefillFromSynthesizedService] Anthropic call failed, returning fallback: {}", e.getMessage());
            return fallback();
        }
    }

    private String buildSystemPrompt() {
        return String.join("\n",
            "당신은 T3Series Composer 의 화면 설계 도우미입니다.",
            "이 화면은 여러 mockup 의 layer 를 조합한 가상(synthesized) 레이아웃입니다 —",
            "synthesized.layers[].sourceMockupCode 가 각 layer 의 원본 mockup 을 가리킵니다.",
            "사용자 자연어 의도 + 합성 mockup 메타를 보고 4단계 Wizard 의",
            "검색조건(filterBar)과 화면 메타(meta) 만 prefill 합니다.",
            "",
            "★ 절대 규칙",
            "1. 출력은 순수 JSON 만. 마크다운/설명/코드 펜스 금지.",
            "2. ★ 데이터바인딩(실제 테이블/SP/컬럼/dataBinding/columns/layout) 은 절대 생성하지 마세요. filterBar 와 meta 만.",
            "3. ★ 출력 키 이름을 정확히 지킬 것:",
            "   - meta 의 키는 title, menuCd, parentMenuCd 만 (screenName/module/domain/description 금지).",
            "   - filterBar 의 키는 items (fields 금지). items 의 각 원소는 key, label, type 3개 키만",
            "     (field_id/output_variable/varName/dataType 금지).",
            "4. filterBar.items[].type 은 다음 값만 허용:",
            "   TEXT, NUMBER, DATE, DATETIME, DATE_RANGE, DROPDOWN, MULTISELECT, SELECT, RADIO,",
            "   CHECKBOX, POPUP, AUTOCOMPLETE, DOMAIN_PLAN_SCOPE, DOMAIN_ITEM_SINGLE,",
            "   DOMAIN_ITEM_MULTI, DOMAIN_ACCOUNT_SINGLE, DOMAIN_ACCOUNT_MULTI,",
            "   DOMAIN_LOCATION_MULTI, DOMAIN_RESOURCE_MULTI, DOMAIN_USER, DOMAIN_VERSION",
            "   (기간은 DATE_RANGE, 플랜스코프는 DOMAIN_PLAN_SCOPE 우선)",
            "5. filterBar.items[].key 는 camelCase, label 은 한글 표시명.",
            "6. meta.menuCd 형식 ^UI_(AD|BF|CM|DP|FO|FP|IM|MP|RP|SA|SO|UT)_[A-Z][A-Z0-9_]*$ (제안값).",
            "   meta.parentMenuCd 는 MENU_AD/MENU_DP/MENU_MP/MENU_FP/MENU_BF/MENU_IM/MENU_RP/MENU_SA/MENU_UTIL 중 하나.",
            "   확신 없으면 빈 문자열(사용자가 메타 단계에서 확정).",
            "7. 재조합 의도를 살펴 — 가장 자주 등장하는 sourceMockupCode 의 도메인 / layer 들의 type 분포 / synthesized.reason 을 종합해 filterBar 를 구성.",
            "",
            "★ 출력 JSON 구조 (정확히 이 키 — 이 외 키 금지)",
            "{",
            "  \"meta\": { \"title\": \"\", \"menuCd\": \"\", \"parentMenuCd\": \"\" },",
            "  \"filterBar\": { \"items\": [ { \"key\": \"camelCase\", \"label\": \"한글\", \"type\": \"DATE_RANGE\" } ] }",
            "}");
    }

    private String buildUserPrompt(PrefillFromSynthesizedRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("Synthesized mockup (AI-recombined layout):\n");
        if (req.getSynthesized() != null && !req.getSynthesized().isEmpty()) {
            try {
                String json = objectMapper.writeValueAsString(req.getSynthesized());
                if (json.length() > MAX_META_CHARS) {
                    json = json.substring(0, MAX_META_CHARS) + "...(truncated)";
                }
                sb.append(json);
            } catch (Exception e) {
                sb.append(req.getSynthesized().toString());
            }
            sb.append("\n\n");
        } else {
            sb.append("(none)\n\n");
        }

        if (req.getModuleCode() != null && !req.getModuleCode().isBlank()) {
            sb.append("Module: ").append(req.getModuleCode()).append("\n\n");
        }

        sb.append("User's natural language description:\n");
        sb.append(req.getNl() != null ? req.getNl() : "(no description)");
        sb.append("\n\n위 정보를 바탕으로 filterBar.items 와 meta 만 JSON 으로 출력하세요.");
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

    private Map<String, Object> parseSpec(String rawText) {
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
            log.warn("[PrefillFromSynthesizedService] No JSON object found in response");
            return new HashMap<>();
        }
        json = json.substring(start, end + 1);
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("[PrefillFromSynthesizedService] Failed to parse AI response JSON: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    private Map<String, Object> fallback() {
        Map<String, Object> result = new HashMap<>();
        result.put("spec", new HashMap<>());
        result.put("mode", "fallback");
        return result;
    }
}

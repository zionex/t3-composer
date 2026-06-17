package com.zionex.t3composer.domain.service;

import com.zionex.t3composer.domain.dto.Attachment;
import com.zionex.t3composer.domain.dto.SpecFromImageRequest;
import com.zionex.t3composer.domain.client.LlmClient;
import com.zionex.t3composer.domain.client.AnthropicModels.CacheControl;
import com.zionex.t3composer.domain.client.AnthropicModels.Message;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesRequest;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;
import com.zionex.t3composer.domain.client.AnthropicModels.SystemBlock;
import com.zionex.t3composer.domain.client.AnthropicModels.TextBlock;
import com.zionex.t3composer.domain.util.MultimodalContentBuilder;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * AI 추천 흐름의 "내 설계 그대로 만들기" 카드 — Claude vision 으로 첨부 설계 이미지를
 * 분석해 ComposerSpec.layers 를 추론한다. 기존 prefillFromMockup 과 응답 shape 호환
 * (spec / mode / model 키) — frontend 가 같은 mergeAiPrefillIntoSpec 으로 처리.
 *
 * Lazy 호출 — AiRecommendPanel 카드 클릭 시에만 발화 (token 보호).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SpecFromImageService {

    private static final String MODEL_NAME = "claude-sonnet-4-5";
    private static final int MAX_TOKENS = 4096;

    private final LlmClient llmClient;
    private final AnthropicApiKeyService apiKeyService;
    private final ObjectMapper objectMapper;

    public Map<String, Object> infer(String userId, SpecFromImageRequest req) {
        Optional<String> apiKeyOpt = apiKeyService.getApiKey(userId);
        if (apiKeyOpt.isEmpty()) {
            log.warn("[SpecFromImageService] API key not found for user {}, returning fallback", userId);
            return fallback();
        }

        List<Attachment> images = req.getBinaryAttachments();
        if (images == null || images.isEmpty()) {
            log.warn("[SpecFromImageService] No binary attachments provided");
            return fallback();
        }

        try {
            String apiKey = apiKeyOpt.get();
            String systemPrompt = buildSystemPrompt();
            String userPrompt = buildUserPrompt(req);
            // 이미지는 multimodal content blocks 로 전송 — 텍스트 prompt + N개 image block.
            Object userContent = MultimodalContentBuilder.build(userPrompt, images);

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
            log.warn("[SpecFromImageService] Anthropic call failed, returning fallback: {}", e.getMessage());
            return fallback();
        }
    }

    private String buildSystemPrompt() {
        return String.join("\n",
            "당신은 T3Series Composer 의 화면 설계 도우미입니다.",
            "사용자가 첨부한 설계 이미지(스크린샷·와이어프레임·디자인 시안 등) 를 보고",
            "ComposerSpec 의 layers 와 (있다면) filterBar.items 를 직접 추론합니다.",
            "",
            "★ 절대 규칙",
            "1. 출력은 순수 JSON 한 개만. 마크다운/설명/코드 펜스 금지.",
            "2. 데이터바인딩(실제 테이블/SP/컬럼/dataBinding/columns) 은 절대 생성하지 마세요 — layout + meta + filterBar 만.",
            "3. layers 의 각 원소는 정확히 이 키만:",
            "   - key      : kebab-case 고유 식별자 (예: 'kpi-users', 'donut-storage-seoul')",
            "   - title    : 한국어 라벨 (이미지에서 OCR — '사용자', '문서함 사용현황' 등)",
            "   - type     : 'KPI' | 'CHART' | 'GRID' | 'CONTAINER' | 'FORM' 중 하나",
            "   - subtype  : type 에 따라 다름:",
            "                  KPI    → 'numeric' | 'ratio' | 'list'",
            "                  CHART  → 'donut' | 'pie' | 'bar' | 'line' | 'area' | 'stacked-bar'",
            "                  GRID   → 'master' | 'detail' | 'tree' | 'pivot'",
            "                  CONTAINER → 'tabs' | 'split' | 'card'",
            "                  FORM   → 'edit' | 'view'",
            "   - position : { x, y, w, h } — 12-col grid 좌표",
            "                  x: 0..11, y: 0+, w: 1..12, h: 1+. row 별로 w 합 = 12 권장.",
            "4. position 정확도가 핵심 — 이미지의 시각적 비율을 RGL 12-col grid 로 변환:",
            "   - 가로로 4등분 = 각 w:3",
            "   - 가로로 2등분 = 각 w:6",
            "   - 큰 KPI 영역 1줄 + 그 아래 차트 2개 = 첫 줄 y:0/h:2, 둘째 줄 y:2",
            "5. filterBar 가 이미지에 보이면 (검색조건 / 날짜선택 / 드롭다운 영역 등) items 로 추가:",
            "   각 item 은 { key:camelCase, label:한글, type:'DATE_RANGE'|'TEXT'|'DROPDOWN' 등 }",
            "   타입 enum 은 [TEXT, NUMBER, DATE, DATETIME, DATE_RANGE, DROPDOWN, MULTISELECT, SELECT,",
            "   RADIO, CHECKBOX, POPUP, AUTOCOMPLETE, DOMAIN_PLAN_SCOPE, DOMAIN_ITEM_SINGLE,",
            "   DOMAIN_ITEM_MULTI, DOMAIN_ACCOUNT_SINGLE, DOMAIN_ACCOUNT_MULTI,",
            "   DOMAIN_LOCATION_MULTI, DOMAIN_RESOURCE_MULTI, DOMAIN_USER, DOMAIN_VERSION] 만.",
            "6. meta 는 title (이미지 상단 헤더/대시보드 명칭 OCR) 만 채움. menuCd/parentMenuCd 는 빈 문자열.",
            "",
            "★ 출력 JSON 구조 (정확히 이 키만 — 이 외 키 금지)",
            "{",
            "  \"meta\": { \"title\": \"\", \"menuCd\": \"\", \"parentMenuCd\": \"\" },",
            "  \"filterBar\": { \"items\": [] },",
            "  \"layers\": [",
            "    { \"key\": \"kpi-users\", \"title\": \"사용자\", \"type\": \"KPI\",",
            "      \"subtype\": \"ratio\", \"position\": { \"x\": 0, \"y\": 0, \"w\": 3, \"h\": 2 } }",
            "  ]",
            "}",
            "",
            "★ 추론 우선순위:",
            "- 이미지의 실제 시각적 layout 이 최우선. 12-col grid 에 매핑해서 position 정확히.",
            "- 비슷한 위젯이 가로로 N개 정렬되어 있으면 w 를 동일하게.",
            "- KPI 영역은 보통 h:2, 차트는 h:4~6, 그리드는 h:6+ 권장.",
            "- 이미지가 모호하면 빈 layers 보다는 합리적 추측이 낫지만, 절대 데이터(실제 컬럼/SP) 만들지 말 것.");
    }

    private String buildUserPrompt(SpecFromImageRequest req) {
        StringBuilder sb = new StringBuilder();

        if (req.getNl() != null && !req.getNl().isBlank()) {
            sb.append("사용자의 자연어 설명 (보조 단서):\n").append(req.getNl()).append("\n\n");
        }
        if (req.getModuleCode() != null && !req.getModuleCode().isBlank()) {
            sb.append("Module: ").append(req.getModuleCode()).append("\n\n");
        }
        sb.append("위 첨부 이미지를 분석해 ComposerSpec JSON 을 출력하세요. ");
        sb.append("layers 의 position 은 이미지의 시각적 layout 을 12-col grid 로 정확히 매핑.");
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
            log.warn("[SpecFromImageService] No JSON object found in response");
            return new HashMap<>();
        }
        json = json.substring(start, end + 1);
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("[SpecFromImageService] Failed to parse AI response JSON: {}", e.getMessage());
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

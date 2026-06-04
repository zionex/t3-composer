package com.zionex.t3composer.domain.ontology.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3composer.domain.client.AnthropicClient;
import com.zionex.t3composer.domain.client.AnthropicModels.Message;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesRequest;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;
import com.zionex.t3composer.domain.client.AnthropicModels.SystemBlock;
import com.zionex.t3composer.domain.ontology.dto.SuggestRequest;
import com.zionex.t3composer.domain.ontology.dto.SuggestResponse;
import com.zionex.t3composer.domain.service.AnthropicApiKeyService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Q&A · Entity 의 필드별 ✨ 제안 — Claude 1회 호출 = 1 필드 = 1 제안.
 * AutoSuggestService 와 같은 모델·클라이언트.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OntologySuggestService {

    private final AnthropicClient anthropicClient;
    private final AnthropicApiKeyService apiKeyService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String MODEL = "claude-sonnet-4-5";
    private static final int MAX_TOKENS = 2000;

    public SuggestResponse suggest(String userId, SuggestRequest req) {
        if (req == null || req.getField() == null) {
            return SuggestResponse.builder().ok(false).message("field 누락").build();
        }
        String apiKey = apiKeyService.getApiKey(userId)
                .orElseThrow(() -> new IllegalStateException(
                    "Anthropic API key 가 등록되어 있지 않습니다. 우상단 [API 키] 에서 등록하세요."));

        String system = buildSystemPrompt(req);
        String user = buildUserPrompt(req);

        MessagesRequest mr = MessagesRequest.builder()
                .model(MODEL).max_tokens(MAX_TOKENS)
                .system(List.of(SystemBlock.builder().type("text").text(system).build()))
                .messages(List.of(Message.builder().role("user").content(user).build()))
                .build();

        try {
            MessagesResponse resp = anthropicClient.sendMessages(apiKey, mr).block();
            String text = extractText(resp).trim();
            log.info("OntologySuggest: field={} chars={}", req.getField(), text.length());
            Object value = postProcess(req.getField(), text);
            return SuggestResponse.builder()
                .ok(true).value(value).modelName(MODEL).build();
        } catch (Exception ex) {
            log.warn("OntologySuggest 실패: {}", ex.getMessage());
            return SuggestResponse.builder()
                .ok(false).message(ex.getMessage()).build();
        }
    }

    private String buildSystemPrompt(SuggestRequest req) {
        String base = "당신은 T3SmartSCM 도메인 온톨로지 편집을 돕는 보조자입니다. "
                    + "현재 작성 중인 Q&A 또는 Entity row 의 한 필드 값을 1개만 제안하세요. "
                    + "절대 markdown 코드펜스/설명 없이 *값 자체* 만 응답하세요.\n\n";
        return base + switch (req.getField()) {
            case "question" -> "현재 row 의 answer 본문에서 사용자 의도를 1줄 한국어 자연어 질문으로 추출하세요.";
            case "answer"   -> "현재 row 의 question + domain + 연관 Entity 설명을 보고, "
                             + "Target DB (MSSQL) 에서 동작할 SELECT SQL 또는 가이드 텍스트 1개를 제안하세요. "
                             + "SQL 이라면 ```sql 펜스 없이 SELECT … 본문만.";
            case "paraphrases" -> "현재 row 의 question 을 의미 동일·표현 다른 변형 3개로 만드세요. "
                                + "응답은 JSON 배열 한 줄: [\"변형1\",\"변형2\",\"변형3\"]";
            case "relatedEntityIds" -> "현재 row 의 question/answer 키워드를 기존 ontology entity 들과 매칭해 "
                                     + "관련 entity id 5개를 JSON 배열로 응답하세요: [\"id1\",\"id2\",...]";
            case "domain"   -> "현재 row 의 question/answer 키워드를 보고 다음 중 1개 분류만 단어로 응답: "
                             + "BF / DP / MP / FP / IM / RP / SA / CM";
            default -> "값 1개만 응답하세요.";
        };
    }

    private String buildUserPrompt(SuggestRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("[현재 row]\n");
        Map<String, Object> row = req.getRow() == null ? Map.of() : req.getRow();
        for (var e : row.entrySet()) {
            if (e.getValue() == null) continue;
            sb.append("- ").append(e.getKey()).append(": ").append(e.getValue()).append("\n");
        }
        sb.append("\n[targetCd] ").append(req.getTargetCd() == null ? "(none)" : req.getTargetCd()).append("\n");
        sb.append("[field 요청] ").append(req.getField()).append("\n");
        return sb.toString();
    }

    private String extractText(MessagesResponse resp) {
        if (resp == null || resp.getContent() == null || resp.getContent().isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        for (Map<String, Object> block : resp.getContent()) {
            if ("text".equals(block.get("type"))) {
                Object t = block.get("text");
                if (t != null) sb.append(t);
            }
        }
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private Object postProcess(String field, String text) {
        if ("paraphrases".equals(field) || "relatedEntityIds".equals(field)) {
            try {
                String t = text.trim();
                if (t.startsWith("```")) {
                    int nl = t.indexOf('\n');
                    if (nl > 0) t = t.substring(nl + 1);
                    if (t.endsWith("```")) t = t.substring(0, t.length() - 3);
                }
                return objectMapper.readValue(t, List.class);
            } catch (Exception ignore) {
                return java.util.Arrays.stream(text.split("[,\\n]"))
                    .map(String::trim).filter(s -> !s.isEmpty()).toList();
            }
        }
        return text;
    }
}

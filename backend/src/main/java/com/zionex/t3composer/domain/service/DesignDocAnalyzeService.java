package com.zionex.t3composer.domain.service;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3composer.domain.client.LlmClient;
import com.zionex.t3composer.domain.client.AnthropicModels.CacheControl;
import com.zionex.t3composer.domain.client.AnthropicModels.Message;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesRequest;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;
import com.zionex.t3composer.domain.client.AnthropicModels.SystemBlock;
import com.zionex.t3composer.domain.client.AnthropicModels.TextBlock;
import com.zionex.t3composer.domain.dto.AnalyzeQueryRequest;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * 설계서 Excel 의 Query TAB 텍스트를 Claude 에 보내 grid 별 CRUD SP 매핑을 추출한다.
 *
 *   Input:
 *     - queryText : Query 시트의 모든 셀(줄바꿈/탭 구분) 텍스트
 *     - grids     : [{ n, id, position, sheetName }, ...]
 *     - orientation : 'H' | 'V' | 'G'
 *
 *   Output (controller 가 그대로 JSON 으로 직렬화):
 *     { mapping: { "1": { read, create, update, delete }, "2": {...} } }
 *
 * 핵심 instruction:
 *   · Q1/Q2 접미어 숫자로 grid 번호 유추 금지
 *   · 공통코드/코드마스터 reference 성 SP 는 제외
 *   · 섹션 제목·위치 라벨·설명 텍스트의 문맥으로만 판단
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DesignDocAnalyzeService {

    private static final String MODEL_NAME = "claude-sonnet-4-5";
    private static final int    MAX_TOKENS = 4096;

    private final LlmClient llmClient;
    private final AnthropicApiKeyService apiKeyService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Object> analyzeQuerySheet(String userId, AnalyzeQueryRequest req) {
        String apiKey = apiKeyService.getApiKey(userId)
                .orElseThrow(() -> new IllegalStateException(
                        "Anthropic API 키가 등록되지 않았습니다. 먼저 /composer/apikey 에 저장하세요."));

        String systemPrompt = buildSystemPrompt();
        String userPrompt   = buildUserPrompt(req);

        // 정적 system prompt 에 cache_control 부착 — 같은 분석을 5분 안에 재호출하면 input 비용 90% 절감
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

        MessagesResponse resp = llmClient.sendMessages(apiKey, mreq).block();
        String text = extractText(resp);
        log.debug("Claude raw response (analyze-query): {}", text);

        Map<String, Object> mapping = parseJsonMapping(text);

        Map<String, Object> out = new HashMap<>();
        out.put("mapping", mapping);
        out.put("modelName", resp != null ? resp.getModel() : MODEL_NAME);
        return out;
    }

    private String buildSystemPrompt() {
        return String.join("\n",
            "당신은 T3Series 설계서 Excel 분석 전문가입니다.",
            "주어진 Query 시트 텍스트를 읽어 각 grid 의 Read/Create/Update/Delete SP 이름을 추출합니다.",
            "",
            "규칙:",
            "1. SP 이름 접미어(예: Q1/Q2/S1/D1)의 숫자로 grid 번호를 유추하지 마세요.",
            "2. '공통코드', '코드마스터', 'Common Code', 'Reference' 같은 섹션의 SP 는 grid CRUD 가 아니므로 제외.",
            "3. 섹션 제목/위치 라벨(좌/우/상/하/좌상/우상 등) · 설명 문맥으로만 grid 를 매핑.",
            "4. 매칭이 불확실한 항목은 null 로 남기고, 추측하지 마세요.",
            "5. 출력은 순수 JSON 만. 다른 설명/마크다운 금지."
        );
    }

    private String buildUserPrompt(AnalyzeQueryRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("[화면 Layout 정보]\n");
        sb.append("- orientation: ").append(req.getOrientation()).append("\n");
        sb.append("- grids:\n");
        if (req.getGrids() != null) {
            for (Map<String, Object> g : req.getGrids()) {
                sb.append("    · n=").append(g.get("n"))
                  .append(", id=").append(g.get("id"))
                  .append(", position=").append(g.get("position"))
                  .append(", sheetName=").append(g.get("sheetName"))
                  .append("\n");
            }
        }
        if (req.getInstruction() != null && !req.getInstruction().isBlank()) {
            sb.append("\n[사용자 지시]\n").append(req.getInstruction()).append("\n");
        }
        sb.append("\n[Query 시트 원본 텍스트]\n");
        sb.append(req.getQueryText() != null ? req.getQueryText() : "");
        sb.append("\n\n위 정보를 바탕으로, 각 grid (n=1, 2, ...) 에 대한 CRUD SP 이름을 다음 JSON 형식으로만 반환하세요:\n");
        sb.append("{\n");
        sb.append("  \"1\": { \"read\": \"SP_...\", \"create\": \"SP_...\", \"update\": \"SP_...\", \"delete\": \"SP_...\" },\n");
        sb.append("  \"2\": { \"read\": \"SP_...\", \"create\": \"...\", \"update\": \"...\", \"delete\": \"...\" }\n");
        sb.append("}\n");
        sb.append("매칭되지 않는 action 은 null 로 두세요. JSON 외 다른 텍스트는 절대 포함하지 마세요.");
        return sb.toString();
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

    /**
     * Claude 가 반환한 텍스트에서 JSON 블록을 추출해 파싱.
     * 코드 펜스(```json ... ```) 나 앞뒤 설명이 섞여 있어도 최대한 복원.
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJsonMapping(String raw) {
        if (raw == null || raw.isBlank()) return Collections.emptyMap();
        String text = raw.trim();

        // 1) 코드 펜스 제거
        Pattern fenced = Pattern.compile("```(?:json)?\\s*([\\s\\S]*?)```", Pattern.MULTILINE);
        Matcher fm = fenced.matcher(text);
        if (fm.find()) text = fm.group(1).trim();

        // 2) 첫 '{' ~ 마지막 '}' 사이만 취함
        int start = text.indexOf('{');
        int end   = text.lastIndexOf('}');
        if (start >= 0 && end > start) text = text.substring(start, end + 1);

        try {
            return (Map<String, Object>) objectMapper.readValue(text, Map.class);
        } catch (Exception e) {
            log.warn("Claude 응답 JSON 파싱 실패: {} (raw={})", e.getMessage(), raw);
            return Collections.emptyMap();
        }
    }

    /** Mono 버전 — streaming/reactive 경로용 (현재 미사용). */
    public Mono<Map<String, Object>> analyzeQuerySheetAsync(String userId, AnalyzeQueryRequest req) {
        return Mono.fromCallable(() -> analyzeQuerySheet(userId, req));
    }
}

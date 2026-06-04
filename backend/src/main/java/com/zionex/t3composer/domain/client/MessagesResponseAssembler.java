package com.zionex.t3composer.domain.client;

import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;
import com.zionex.t3composer.domain.client.AnthropicModels.Usage;

/**
 * Streaming SSE 이벤트들을 단일 {@link MessagesResponse} 로 누적.
 * non-streaming 호출 ({@link CliLlmClient#sendMessages}) 경로에서 사용.
 */
class MessagesResponseAssembler {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final StringBuilder text = new StringBuilder();
    private String id;
    private String model;
    private int    inputTokens;
    private int    outputTokens;

    MessagesResponseAssembler feed(String event, String data) {
        if (data == null) return this;
        JsonNode node;
        try {
            node = MAPPER.readTree(data);
        } catch (Exception e) {
            return this;
        }
        switch (event == null ? "" : event) {
            case "message_start": {
                JsonNode msg = node.path("message");
                if (id == null)    id    = msg.path("id").asText(null);
                if (model == null) model = msg.path("model").asText(null);
                break;
            }
            case "content_block_delta": {
                String chunk = node.path("delta").path("text").asText("");
                if (!chunk.isEmpty()) text.append(chunk);
                break;
            }
            case "message_delta": {
                JsonNode usage = node.path("usage");
                if (usage.has("input_tokens"))  inputTokens  = usage.get("input_tokens").asInt();
                if (usage.has("output_tokens")) outputTokens = usage.get("output_tokens").asInt();
                break;
            }
            default:
                break;
        }
        return this;
    }

    MessagesResponse build() {
        MessagesResponse r = new MessagesResponse();
        r.setId(id);
        r.setModel(model);
        r.setStopReason("end_turn");
        Usage u = new Usage();
        u.setInputTokens(inputTokens);
        u.setOutputTokens(outputTokens);
        r.setUsage(u);
        // MessagesResponse.content is List<Map<String, Object>> — assemble one text block
        r.setContent(java.util.List.of(Map.of(
                "type", "text",
                "text", text.toString()
        )));
        return r;
    }
}

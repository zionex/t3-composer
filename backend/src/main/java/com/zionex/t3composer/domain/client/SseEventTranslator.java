package com.zionex.t3composer.domain.client;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.http.codec.ServerSentEvent;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

/**
 * 한 스트림에 하나의 인스턴스. CLI {@code --output-format stream-json} 의
 * line-delimited JSON 이벤트를 Anthropic SSE 이벤트 시퀀스로 변환.
 *
 * <p>상태:
 * <ul>
 *   <li>{@code messageId} — {@code system.init} 시 생성, 모든 후속 이벤트에 동일</li>
 *   <li>{@code model} — {@code system.init.model} 추출</li>
 *   <li>{@code blockStarted} — 첫 assistant 청크에서 {@code content_block_start} 발화 여부</li>
 *   <li>{@code blockClosed} — {@code result} 처리 시 한 번만 {@code content_block_stop} 발화</li>
 * </ul>
 */
@Slf4j
public class SseEventTranslator {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private String  messageId;
    private String  model;
    private boolean blockStarted;
    private boolean blockClosed;

    public List<ServerSentEvent<String>> translate(String line) {
        if (line == null || line.isBlank()) return List.of();

        JsonNode node;
        try {
            node = MAPPER.readTree(line);
        } catch (Exception e) {
            log.warn("CLI stream-json parse failed: {}", line, e);
            return List.of();
        }

        String type    = textOrEmpty(node, "type");
        String subtype = textOrEmpty(node, "subtype");

        switch (type) {
            case "system":
                if ("init".equals(subtype)) return handleSystemInit(node);
                return List.of();
            case "assistant":
                return handleAssistant(node);
            case "result":
                return handleResult(node, subtype);
            default:
                return List.of();
        }
    }

    private List<ServerSentEvent<String>> handleSystemInit(JsonNode node) {
        this.messageId = "msg_" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        this.model     = textOrEmpty(node, "model");

        String data = String.format(
                "{\"type\":\"message_start\",\"message\":{"
                + "\"id\":\"%s\",\"type\":\"message\",\"role\":\"assistant\","
                + "\"model\":\"%s\",\"content\":[],\"stop_reason\":null,"
                + "\"stop_sequence\":null,\"usage\":{\"input_tokens\":0,\"output_tokens\":0}}}",
                messageId, model);
        return List.of(sse("message_start", data));
    }

    private List<ServerSentEvent<String>> handleAssistant(JsonNode node) {
        JsonNode content = node.path("message").path("content");
        if (!content.isArray() || content.size() == 0) return List.of();
        JsonNode first = content.get(0);
        if (!"text".equals(textOrEmpty(first, "type"))) return List.of();

        String text = textOrEmpty(first, "text");
        if (text.isEmpty()) return List.of();

        List<ServerSentEvent<String>> out = new ArrayList<>(2);
        if (!blockStarted) {
            blockStarted = true;
            out.add(sse("content_block_start",
                    "{\"type\":\"content_block_start\",\"index\":0,"
                    + "\"content_block\":{\"type\":\"text\",\"text\":\"\"}}"));
        }
        out.add(sse("content_block_delta",
                String.format(
                    "{\"type\":\"content_block_delta\",\"index\":0,"
                    + "\"delta\":{\"type\":\"text_delta\",\"text\":%s}}",
                    MAPPER.valueToTree(text))));
        return out;
    }

    private List<ServerSentEvent<String>> handleResult(JsonNode node, String subtype) {
        if (subtype != null && subtype.startsWith("error")) {
            String msg = node.has("error")
                    ? node.get("error").asText()
                    : ("CLI result subtype=" + subtype);
            throw new LlmCliException(503, "CLI stream error: " + msg);
        }

        List<ServerSentEvent<String>> out = new ArrayList<>(3);
        if (blockStarted && !blockClosed) {
            blockClosed = true;
            out.add(sse("content_block_stop",
                    "{\"type\":\"content_block_stop\",\"index\":0}"));
        }
        JsonNode usage = node.path("usage");
        int in  = usage.path("input_tokens").asInt(0);
        int outTok = usage.path("output_tokens").asInt(0);
        out.add(sse("message_delta", String.format(
                "{\"type\":\"message_delta\","
                + "\"delta\":{\"stop_reason\":\"end_turn\",\"stop_sequence\":null},"
                + "\"usage\":{\"input_tokens\":%d,\"output_tokens\":%d}}",
                in, outTok)));
        out.add(sse("message_stop", "{\"type\":\"message_stop\"}"));
        return out;
    }

    private static String textOrEmpty(JsonNode n, String field) {
        JsonNode v = n.path(field);
        return v.isMissingNode() || v.isNull() ? "" : v.asText("");
    }

    private static ServerSentEvent<String> sse(String event, String data) {
        return ServerSentEvent.<String>builder()
                .event(event)
                .data(data)
                .build();
    }
}

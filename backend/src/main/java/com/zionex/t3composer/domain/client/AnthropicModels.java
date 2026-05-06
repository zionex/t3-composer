package com.zionex.t3composer.domain.client;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Anthropic Messages API 요청·응답·SSE 이벤트 모델.
 * Ref: https://docs.anthropic.com/en/api/messages
 */
public class AnthropicModels {

    private AnthropicModels() {}

    // ---- Request ----

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class MessagesRequest {
        private String model;
        private Integer max_tokens;
        private String system;
        private List<Message> messages;
        private Double temperature;
        private Boolean stream;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Message {
        /** "user" | "assistant" */
        private String role;

        /** 텍스트 또는 ContentBlock 배열 */
        private Object content;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TextBlock {
        /** 항상 "text" */
        private String type;
        private String text;
    }

    // ---- Non-streaming response ----

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class MessagesResponse {
        private String id;
        private String type;
        private String role;
        private String model;
        private List<Map<String, Object>> content;

        @JsonProperty("stop_reason")
        private String stopReason;

        @JsonProperty("stop_sequence")
        private String stopSequence;

        private Usage usage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Usage {
        @JsonProperty("input_tokens")
        private Integer inputTokens;

        @JsonProperty("output_tokens")
        private Integer outputTokens;
    }

    // ---- SSE streaming events ----

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class StreamEvent {
        /**
         * message_start | content_block_start | content_block_delta |
         * content_block_stop | message_delta | message_stop | ping | error
         */
        private String type;

        private Integer index;

        private Map<String, Object> delta;

        private Map<String, Object> message;

        @JsonProperty("content_block")
        private Map<String, Object> contentBlock;

        private Usage usage;
    }
}

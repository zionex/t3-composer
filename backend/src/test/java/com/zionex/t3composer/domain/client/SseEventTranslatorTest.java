package com.zionex.t3composer.domain.client;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.http.codec.ServerSentEvent;

class SseEventTranslatorTest {

    private final SseEventTranslator t = new SseEventTranslator();

    @Test
    void systemInitProducesMessageStart() {
        List<ServerSentEvent<String>> events = t.translate(
                "{\"type\":\"system\",\"subtype\":\"init\",\"session_id\":\"s1\",\"model\":\"claude-sonnet-4-6\"}");
        assertThat(events).hasSize(1);
        assertThat(events.get(0).event()).isEqualTo("message_start");
        assertThat(events.get(0).data()).contains("\"type\":\"message_start\"");
        assertThat(events.get(0).data()).contains("\"model\":\"claude-sonnet-4-6\"");
    }

    @Test
    void firstAssistantChunkProducesBlockStartAndDelta() {
        t.translate("{\"type\":\"system\",\"subtype\":\"init\",\"model\":\"x\"}");
        List<ServerSentEvent<String>> events = t.translate(
                "{\"type\":\"assistant\",\"message\":{\"content\":[{\"type\":\"text\",\"text\":\"hello\"}]}}");

        assertThat(events).hasSize(2);
        assertThat(events.get(0).event()).isEqualTo("content_block_start");
        assertThat(events.get(0).data()).contains("\"index\":0");
        assertThat(events.get(1).event()).isEqualTo("content_block_delta");
        assertThat(events.get(1).data()).contains("\"text\":\"hello\"");
    }

    @Test
    void subsequentAssistantChunkProducesOnlyDelta() {
        t.translate("{\"type\":\"system\",\"subtype\":\"init\",\"model\":\"x\"}");
        t.translate("{\"type\":\"assistant\",\"message\":{\"content\":[{\"type\":\"text\",\"text\":\"hello\"}]}}");

        List<ServerSentEvent<String>> events = t.translate(
                "{\"type\":\"assistant\",\"message\":{\"content\":[{\"type\":\"text\",\"text\":\" world\"}]}}");

        assertThat(events).hasSize(1);
        assertThat(events.get(0).event()).isEqualTo("content_block_delta");
        assertThat(events.get(0).data()).contains("\"text\":\" world\"");
    }

    @Test
    void resultSuccessProducesBlockStopMessageDeltaAndMessageStop() {
        t.translate("{\"type\":\"system\",\"subtype\":\"init\",\"model\":\"x\"}");
        t.translate("{\"type\":\"assistant\",\"message\":{\"content\":[{\"type\":\"text\",\"text\":\"hi\"}]}}");

        List<ServerSentEvent<String>> events = t.translate(
                "{\"type\":\"result\",\"subtype\":\"success\","
                + "\"usage\":{\"input_tokens\":10,\"output_tokens\":3}}");

        assertThat(events).hasSize(3);
        assertThat(events.get(0).event()).isEqualTo("content_block_stop");
        assertThat(events.get(1).event()).isEqualTo("message_delta");
        assertThat(events.get(1).data()).contains("\"output_tokens\":3");
        assertThat(events.get(2).event()).isEqualTo("message_stop");
    }

    @Test
    void resultErrorThrowsLlmCliException() {
        t.translate("{\"type\":\"system\",\"subtype\":\"init\",\"model\":\"x\"}");

        org.junit.jupiter.api.Assertions.assertThrows(LlmCliException.class, () ->
                t.translate(
                    "{\"type\":\"result\",\"subtype\":\"error_during_execution\",\"error\":\"boom\"}"));
    }

    @Test
    void unknownLineProducesNoEvents() {
        List<ServerSentEvent<String>> events = t.translate(
                "{\"type\":\"something_unexpected\"}");
        assertThat(events).isEmpty();
    }

    @Test
    void blankLineProducesNoEvents() {
        assertThat(t.translate("")).isEmpty();
        assertThat(t.translate("   ")).isEmpty();
    }
}

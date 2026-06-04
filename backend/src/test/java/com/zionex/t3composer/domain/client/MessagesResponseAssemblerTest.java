package com.zionex.t3composer.domain.client;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;

class MessagesResponseAssemblerTest {

    @Test
    void accumulatesMultipleDeltasIntoFullText() {
        MessagesResponseAssembler a = new MessagesResponseAssembler();
        a.feed("message_start",
                "{\"type\":\"message_start\",\"message\":{\"id\":\"msg_abc\",\"model\":\"x\"}}");
        a.feed("content_block_delta",
                "{\"delta\":{\"type\":\"text_delta\",\"text\":\"hello \"}}");
        a.feed("content_block_delta",
                "{\"delta\":{\"type\":\"text_delta\",\"text\":\"world\"}}");
        a.feed("message_delta",
                "{\"usage\":{\"input_tokens\":7,\"output_tokens\":2}}");

        MessagesResponse r = a.build();

        assertThat(r.getId()).isEqualTo("msg_abc");
        assertThat(r.getModel()).isEqualTo("x");
        assertThat(r.getUsage().getInputTokens()).isEqualTo(7);
        assertThat(r.getUsage().getOutputTokens()).isEqualTo(2);
        assertThat(r.getStopReason()).isEqualTo("end_turn");
        @SuppressWarnings("unchecked")
        Map<String, Object> block = (Map<String, Object>) r.getContent().get(0);
        assertThat(block).containsEntry("type", "text");
        assertThat(block).containsEntry("text", "hello world");
    }

    @Test
    void preservesEmbeddedQuotesAndNewlines() {
        MessagesResponseAssembler a = new MessagesResponseAssembler();
        a.feed("content_block_delta",
                "{\"delta\":{\"type\":\"text_delta\",\"text\":\"He said \\\"hi\\\"\\nbye\"}}");
        MessagesResponse r = a.build();
        @SuppressWarnings("unchecked")
        Map<String, Object> block = (Map<String, Object>) r.getContent().get(0);
        assertThat(block).containsEntry("text", "He said \"hi\"\nbye");
    }

    @Test
    void unknownEventLeavesTextUnchanged() {
        MessagesResponseAssembler a = new MessagesResponseAssembler();
        a.feed("ping", "{}");
        MessagesResponse r = a.build();
        @SuppressWarnings("unchecked")
        Map<String, Object> block = (Map<String, Object>) r.getContent().get(0);
        assertThat(block).containsEntry("text", "");
    }

    @Test
    void malformedJsonIsIgnored() {
        MessagesResponseAssembler a = new MessagesResponseAssembler();
        a.feed("content_block_delta", "not-json-at-all");
        MessagesResponse r = a.build();
        @SuppressWarnings("unchecked")
        Map<String, Object> block = (Map<String, Object>) r.getContent().get(0);
        assertThat(block).containsEntry("text", "");
    }

    @Test
    void messageStartDoesNotOverwriteId() {
        MessagesResponseAssembler a = new MessagesResponseAssembler();
        a.feed("message_start",
                "{\"type\":\"message_start\",\"message\":{\"id\":\"msg_first\",\"model\":\"x\"}}");
        a.feed("message_start",
                "{\"type\":\"message_start\",\"message\":{\"id\":\"msg_second\",\"model\":\"y\"}}");
        MessagesResponse r = a.build();
        assertThat(r.getId()).isEqualTo("msg_first");
        assertThat(r.getModel()).isEqualTo("x");
    }
}

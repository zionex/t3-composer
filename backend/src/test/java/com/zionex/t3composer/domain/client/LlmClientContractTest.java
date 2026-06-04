package com.zionex.t3composer.domain.client;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;

import org.junit.jupiter.api.Test;
import org.springframework.http.codec.ServerSentEvent;

import com.zionex.t3composer.domain.client.AnthropicModels.MessagesRequest;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

class LlmClientContractTest {

    @Test
    void interfaceDeclaresSendMessagesReturningMono() throws Exception {
        Method m = LlmClient.class.getMethod("sendMessages", String.class, MessagesRequest.class);
        assertThat(m.getReturnType()).isEqualTo(Mono.class);
        assertThat(m.getGenericReturnType().getTypeName())
                .contains(MessagesResponse.class.getName());
    }

    @Test
    void interfaceDeclaresStreamMessagesReturningFluxOfSse() throws Exception {
        Method m = LlmClient.class.getMethod("streamMessages", String.class, MessagesRequest.class);
        assertThat(m.getReturnType()).isEqualTo(Flux.class);
        assertThat(m.getGenericReturnType().getTypeName())
                .contains(ServerSentEvent.class.getName());
    }
}

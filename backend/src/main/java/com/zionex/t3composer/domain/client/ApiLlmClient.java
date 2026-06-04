package com.zionex.t3composer.domain.client;

import java.time.Duration;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import com.zionex.t3composer.domain.client.AnthropicModels.MessagesRequest;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;

import io.netty.channel.ChannelOption;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;

/**
 * Anthropic Claude HTTP API 백엔드 — {@code LLM_BACKEND=api} (기본) 일 때 활성.
 * 기존 {@code AnthropicClient} 와 동일 로직. {@link LlmClient} contract 구현.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "llm.backend", havingValue = "api", matchIfMissing = true)
public class ApiLlmClient implements LlmClient {

    private static final String BASE_URL     = "https://api.anthropic.com";
    private static final String API_VERSION  = "2023-06-01";
    private static final String MESSAGES_URL = "/v1/messages";

    private final WebClient webClient;

    public ApiLlmClient(WebClient.Builder builder) {
        ConnectionProvider provider = ConnectionProvider.builder("anthropic")
                .maxConnections(50)
                .pendingAcquireTimeout(Duration.ofSeconds(30))
                .build();

        HttpClient httpClient = HttpClient.create(provider)
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 30_000)
                .responseTimeout(Duration.ofMinutes(40));

        this.webClient = builder
                .baseUrl(BASE_URL)
                .codecs(cfg -> cfg.defaultCodecs().maxInMemorySize(32 * 1024 * 1024))
                .clientConnector(new org.springframework.http.client.reactive.ReactorClientHttpConnector(httpClient))
                .build();

        log.info("ApiLlmClient initialized (baseUrl={}, apiVersion={})", BASE_URL, API_VERSION);
    }

    @Override
    public Mono<MessagesResponse> sendMessages(String apiKey, MessagesRequest request) {
        request.setStream(Boolean.FALSE);
        return webClient.post()
                .uri(MESSAGES_URL)
                .header("x-api-key", apiKey)
                .header("anthropic-version", API_VERSION)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchangeToMono(resp -> {
                    if (resp.statusCode().isError()) {
                        return resp.bodyToMono(String.class)
                                .defaultIfEmpty("")
                                .flatMap(body -> {
                                    log.error("Anthropic API error status={} body={}",
                                            resp.statusCode(), body);
                                    return Mono.error(new AnthropicApiException(resp.statusCode(), body));
                                });
                    }
                    return resp.bodyToMono(MessagesResponse.class);
                })
                .doOnSubscribe(s -> log.info("Anthropic sendMessages model={} max_tokens={}",
                        request.getModel(), request.getMax_tokens()))
                .doOnNext(r -> log.info("Anthropic response id={} stop_reason={} in={} out={}",
                        r.getId(), r.getStopReason(),
                        r.getUsage() != null ? r.getUsage().getInputTokens() : null,
                        r.getUsage() != null ? r.getUsage().getOutputTokens() : null));
    }

    @Override
    public Flux<ServerSentEvent<String>> streamMessages(String apiKey, MessagesRequest request) {
        request.setStream(Boolean.TRUE);
        return webClient.post()
                .uri(MESSAGES_URL)
                .header("x-api-key", apiKey)
                .header("anthropic-version", API_VERSION)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .bodyValue(request)
                .retrieve()
                .onStatus(s -> s.isError(), resp ->
                        resp.bodyToMono(String.class)
                                .defaultIfEmpty("")
                                .flatMap(body -> Mono.error(new AnthropicApiException(resp.statusCode(), body))))
                .bodyToFlux(new ParameterizedTypeReference<ServerSentEvent<String>>() {})
                .doOnSubscribe(s -> log.info("Anthropic streamMessages start model={}", request.getModel()))
                .doOnComplete(() -> log.info("Anthropic streamMessages completed"))
                .doOnError(e -> log.error("Anthropic streamMessages error: {}", e.getMessage()));
    }
}

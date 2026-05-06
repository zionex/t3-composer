package com.zionex.t3composer.domain.client;

import java.time.Duration;

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
 * Anthropic Claude API WebClient 기반 호출 클라이언트.
 *
 * - Non-streaming: {@link #sendMessages(String, MessagesRequest)}
 * - Streaming SSE: {@link #streamMessages(String, MessagesRequest)}
 *
 * API 키는 호출 시점에 동적으로 전달 (Authorization 헤더가 아닌 'x-api-key').
 */
@Slf4j
@Component
public class AnthropicClient {

    private static final String BASE_URL     = "https://api.anthropic.com";
    private static final String API_VERSION  = "2023-06-01";
    private static final String MESSAGES_URL = "/v1/messages";

    private final WebClient webClient;

    public AnthropicClient(org.springframework.web.reactive.function.client.WebClient.Builder builder) {
        ConnectionProvider provider = ConnectionProvider.builder("anthropic")
                .maxConnections(50)
                .pendingAcquireTimeout(Duration.ofSeconds(30))
                .build();

        // max_tokens=100_000 기준 Sonnet 생성이 최대 ~33분 걸릴 수 있으므로 40분.
        // 프런트 axios timeout 은 반드시 이보다 짧거나 같게 (여기는 서버 기준선) 두면
        // 서버가 먼저 끊어 proper 502 를 돌려주고 axios 는 정상 흐름만 처리.
        // axios 같이 조정 시 api.js sendChat timeout 도 40분(2_400_000) 으로.
        HttpClient httpClient = HttpClient.create(provider)
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 30_000)
                .responseTimeout(Duration.ofMinutes(40));

        this.webClient = builder
                .baseUrl(BASE_URL)
                .codecs(cfg -> cfg.defaultCodecs().maxInMemorySize(32 * 1024 * 1024))
                .clientConnector(new org.springframework.http.client.reactive.ReactorClientHttpConnector(httpClient))
                .build();

        log.info("AnthropicClient initialized (baseUrl={}, apiVersion={})", BASE_URL, API_VERSION);
    }

    /**
     * Non-streaming 호출 — 완성된 응답을 한 번에 반환.
     * Anthropic 이 4xx/5xx 를 반환하면 AnthropicApiException 으로 변환 (원본 status 보존 안 함).
     */
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

    /**
     * Streaming 호출 — SSE 이벤트를 그대로 중계.
     * 호출 측에서 각 이벤트를 받아 파싱/브라우저로 재전송.
     */
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

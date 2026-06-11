package com.zionex.t3composer.config.insight;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class InsightWebClientService {

    private final WebClient restClient;
    private final WebClient sseClient;
    private final InsightProperties props;
    private final DataBufferFactory bufferFactory = new DefaultDataBufferFactory();

    public InsightWebClientService(
            @Qualifier("insightWebClient") WebClient restClient,
            @Qualifier("sseWebClient") WebClient sseClient,
            InsightProperties props) {
        this.restClient = restClient;
        this.sseClient  = sseClient;
        this.props      = props;
    }

    /**
     * SSE 스트림을 그대로 파이핑.
     * 앞에 :\n\n 를 붙여 브라우저 EventSource가 open() 이벤트를 즉시 발생하도록 함.
     */
    public Flux<DataBuffer> proxySseRaw(
            String path, MultiValueMap<String, String> params) {
        return Flux.just(bufferFactory.wrap(":\n\n".getBytes()))
            .concatWith(
                sseClient.get()
                    .uri(path, uriBuilder -> uriBuilder.queryParams(params).build())
                    .accept(MediaType.TEXT_EVENT_STREAM)
                    .retrieve()
                    .bodyToFlux(DataBuffer.class)
            )
            .onErrorResume(e -> Flux.just(
                bufferFactory.wrap(("data: {\"error\":\"upstream error\"}\n\n").getBytes())));
    }

    /** 원시 바이트 POST 포워딩 (multipart 포함) */
    public Mono<String> proxyRawPost(String path, byte[] rawBody, String contentType) {
        return restClient.post()
            .uri(path)
            .header("Content-Type", contentType)
            .bodyValue(rawBody)
            .retrieve()
            .bodyToMono(String.class);
    }

    public Mono<String> proxyPost(String path, Object body) {
        return restClient.post()
            .uri(path)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(body)
            .retrieve()
            .bodyToMono(String.class);
    }

    public Mono<String> proxyGet(String path, MultiValueMap<String, String> params) {
        return restClient.get()
            .uri(path, uriBuilder -> uriBuilder.queryParams(params).build())
            .retrieve()
            .bodyToMono(String.class);
    }
}

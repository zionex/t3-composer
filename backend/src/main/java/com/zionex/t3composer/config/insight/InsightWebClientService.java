package com.zionex.t3composer.config.insight;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
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

    /**
     * Multipart form POST 포워딩 — Tomcat 이 이미 파싱한 form 필드를 받아
     * WebClient 가 새 boundary 로 multipart 본문을 재조립해 upstream 으로 보낸다.
     *
     * 이전 {@code proxyRawPost} 는 {@code HttpServletRequest.getInputStream()}
     * 의 raw 바이트를 그대로 전달했으나, Tomcat 의 multipart resolver 가 컨트롤러
     * 진입 전에 본문을 소비해 {@code bodyLen=0} 으로 흘러가 upstream 이 401 을
     * 반환하던 문제를 회피한다.
     */
    public Mono<String> proxyMultipart(String path, MultiValueMap<String, String> formFields) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        formFields.forEach((name, values) -> {
            if (values == null) return;
            for (String v : values) {
                if (v != null) builder.part(name, v);
            }
        });
        return restClient.post()
            .uri(path)
            .contentType(MediaType.MULTIPART_FORM_DATA)
            .body(BodyInserters.fromMultipartData(builder.build()))
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

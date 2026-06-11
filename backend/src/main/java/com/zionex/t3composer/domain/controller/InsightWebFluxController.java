package com.zionex.t3composer.domain.controller;

import com.zionex.t3composer.config.insight.InsightWebClientService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Enumeration;

@RestController
public class InsightWebFluxController {

    private final InsightWebClientService insightService;

    public InsightWebFluxController(InsightWebClientService insightService) {
        this.insightService = insightService;
    }

    /**
     * SSE connect — insight-llm /sse/connect 로 투명 프록시.
     * JWT 없음: composer-dev 고정 사용자 주입.
     */
    @GetMapping(value = "/insight/sse/connect", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<DataBuffer> sseConnect(HttpServletRequest request) {
        MultiValueMap<String, String> params = extractQueryParams(request);
        params.set("user_id", "composer-dev");
        if (!params.containsKey("lang_cd")) {
            params.set("lang_cd", "ko");
        }
        return insightService.proxySseRaw("/sse/connect", params);
    }

    /**
     * SSE invoke-service — FormData 원시 바이트 포워딩.
     * Content-Type 헤더(boundary 포함)를 그대로 전달해 multipart 재조립 오류 방지.
     */
    @PostMapping("/insight/sse/invoke-service")
    public Mono<ResponseEntity<String>> invokeService(HttpServletRequest request) {
        try {
            byte[] body = request.getInputStream().readAllBytes();
            String contentType = request.getContentType();
            return insightService.proxyRawPost("/sse/invoke-service", body, contentType)
                .map(ResponseEntity::ok)
                .onErrorResume(e -> Mono.just(
                    ResponseEntity.status(502).body("{\"error\":\"upstream error\"}")));
        } catch (java.io.IOException e) {
            return Mono.just(ResponseEntity.status(500).body("{\"error\":\"request read failed\"}"));
        }
    }

    /**
     * 그 외 /insight/** — GET/POST 투명 프록시.
     * /sse/cancel, /sse/close, /composer-llm/health, /composer-llm/chat 등.
     */
    @RequestMapping("/insight/**")
    public Mono<ResponseEntity<String>> proxyAll(
            HttpServletRequest request,
            @RequestBody(required = false) String body) {
        String path = request.getRequestURI().replaceFirst("/insight", "");
        MultiValueMap<String, String> params = extractQueryParams(request);

        if ("GET".equalsIgnoreCase(request.getMethod())) {
            return insightService.proxyGet(path, params)
                .map(ResponseEntity::ok)
                .onErrorResume(e -> Mono.just(
                    ResponseEntity.status(502).body("{\"error\":\"upstream error\"}")));
        }
        return insightService.proxyPost(path, body != null ? body : "{}")
            .map(ResponseEntity::ok)
            .onErrorResume(e -> Mono.just(
                ResponseEntity.status(502).body("{\"error\":\"upstream error\"}")));
    }

    private MultiValueMap<String, String> extractQueryParams(HttpServletRequest request) {
        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        Enumeration<String> names = request.getParameterNames();
        while (names.hasMoreElements()) {
            String name = names.nextElement();
            for (String val : request.getParameterValues(name)) {
                map.add(name, val);
            }
        }
        return map;
    }
}

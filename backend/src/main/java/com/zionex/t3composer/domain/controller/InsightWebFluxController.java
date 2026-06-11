package com.zionex.t3composer.domain.controller;

import com.zionex.t3composer.config.insight.InsightWebClientService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Enumeration;

@RestController
public class InsightWebFluxController {

    private final InsightWebClientService insightService;

    public InsightWebFluxController(InsightWebClientService insightService) {
        this.insightService = insightService;
    }

    /**
     * SSE connect — insight-llm /sse/connect 의 raw 바이트를 그대로 흘려보내는 투명 프록시.
     *
     * 이 컨트롤러는 (이름과 달리) Spring MVC 서블릿 기반이라 {@code Flux<DataBuffer>} 를
     * 직접 반환하면 reactive type handler 가 {@code DataBuffer} 객체를 Jackson 으로
     * 직렬화해 {@code data:{"nativeBuffer":"..."}} 같은 깨진 SSE 를 만든다.
     * {@code StreamingResponseBody} 로 {@code OutputStream} 에 raw 바이트를 직접 써서
     * upstream 의 SSE 청크 ({@code data: {...}\n\n}) 가 그대로 클라이언트에 도착하게 한다.
     *
     * JWT 없음: composer-dev 고정 사용자 주입.
     */
    @GetMapping(value = "/insight/sse/connect", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<StreamingResponseBody> sseConnect(HttpServletRequest request) {
        MultiValueMap<String, String> params = extractQueryParams(request);
        params.set("user_id", "composer-dev");
        if (!params.containsKey("lang_cd")) {
            params.set("lang_cd", "ko");
        }

        StreamingResponseBody stream = outputStream ->
            insightService.proxySseRaw("/sse/connect", params)
                .doOnNext(buffer -> {
                    try {
                        byte[] bytes = new byte[buffer.readableByteCount()];
                        buffer.read(bytes);
                        outputStream.write(bytes);
                        outputStream.flush();
                    } catch (IOException ex) {
                        // 클라이언트 disconnect — upstream 구독 종료를 위해 reactive error 로 전파.
                        throw new UncheckedIOException(ex);
                    } finally {
                        DataBufferUtils.release(buffer);
                    }
                })
                .then()
                .onErrorResume(e -> Mono.empty())
                .block();

        return ResponseEntity.ok()
            .contentType(MediaType.TEXT_EVENT_STREAM)
            .header("Cache-Control", "no-cache")
            .header("Connection", "keep-alive")
            .header("X-Accel-Buffering", "no")
            .body(stream);
    }

    /**
     * SSE invoke-service — multipart form 필드를 재조립해 upstream 으로 포워딩.
     *
     * Tomcat 의 multipart resolver 가 컨트롤러 진입 전에 본문을 파싱하므로
     * {@code HttpServletRequest.getInputStream()} 의 raw 바이트는 비어 있다.
     * Spring 이 파싱한 form 필드를 {@code @RequestParam} 으로 받아 WebClient 에서
     * 새 boundary 로 multipart 를 재구성해 upstream 에 전달한다.
     *
     * JWT 없음: composer-dev 고정 사용자 주입.
     */
    @PostMapping("/insight/sse/invoke-service")
    public Mono<ResponseEntity<String>> invokeService(
            @RequestParam("req_data") String reqData,
            @RequestParam(value = "user_id", required = false) String userId,
            @RequestParam(value = "lang_cd", required = false) String langCd) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("req_data", reqData);
        form.add("user_id", (userId != null && !userId.isBlank()) ? userId : "composer-dev");
        form.add("lang_cd", (langCd != null && !langCd.isBlank()) ? langCd : "ko");
        return insightService.proxyMultipart("/sse/invoke-service", form)
            .map(ResponseEntity::ok)
            .onErrorResume(e -> Mono.just(
                ResponseEntity.status(502).body("{\"error\":\"upstream error\"}")));
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

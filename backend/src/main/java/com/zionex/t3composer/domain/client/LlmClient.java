package com.zionex.t3composer.domain.client;

import org.springframework.http.codec.ServerSentEvent;

import com.zionex.t3composer.domain.client.AnthropicModels.MessagesRequest;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * LLM 백엔드 추상화. .env 의 {@code LLM_BACKEND} 값에 따라
 * {@link ApiLlmClient} (HTTP API) 또는 {@link CliLlmClient} (claude CLI 서브프로세스)
 * 가 활성화된다.
 *
 * <p><b>apiKey 파라미터</b>: API 모드에서는 Anthropic 인증에 사용. CLI 모드에서는
 * 무시 (CLI 가 마운트된 {@code ~/.claude} 의 OAuth 세션을 사용). 호환성을 위해
 * 시그니처 유지.
 */
public interface LlmClient {

    /**
     * Non-streaming 호출 — 완성된 응답을 한 번에 반환.
     */
    Mono<MessagesResponse> sendMessages(String apiKey, MessagesRequest request);

    /**
     * Streaming 호출 — Anthropic SSE 포맷으로 이벤트를 emit.
     * CLI 모드에서는 stream-json 출력을 동등한 SSE 이벤트로 변환해 emit.
     */
    Flux<ServerSentEvent<String>> streamMessages(String apiKey, MessagesRequest request);
}

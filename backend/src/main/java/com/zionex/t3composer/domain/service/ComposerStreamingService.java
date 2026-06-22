package com.zionex.t3composer.domain.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesRequest;
import com.zionex.t3composer.domain.client.LlmClient;
import com.zionex.t3composer.domain.dto.Attachment;
import com.zionex.t3composer.domain.dto.ChatStreamEvent;
import com.zionex.t3composer.domain.entity.ComposerArtifact;
import com.zionex.t3composer.domain.entity.ComposerMessage;
import com.zionex.t3composer.domain.entity.ComposerSession;
import com.zionex.t3composer.domain.repository.ComposerArtifactRepository;
import com.zionex.t3composer.domain.repository.ComposerMessageRepository;
import com.zionex.t3composer.domain.repository.ComposerSessionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

/**
 * T3Composer chat streaming — Anthropic SSE 를 받아 단계별 진행 이벤트로 변환해 프런트에 push.
 *
 * 흐름:
 *  1. PROMPT phase event 발화 → {@link ComposerService#buildRequest} 로 MessagesRequest 구성
 *  2. STREAM_START phase event 발화 → {@link LlmClient#streamMessages} subscribe
 *  3. 각 SSE event → {@link StreamPhaseEmitter} 가 누적 + ===FILE: 마커 감지 → file event 발화
 *  4. STREAM_END phase event 발화 (tokens, stopReason 포함)
 *  5. (필요시) CONTINUATION → recursive 재호출 (auto-continuation 흐름)
 *  6. EXTRACT phase event 발화 → 누적 텍스트로 {@link ComposerMessage} + {@link ComposerArtifact} 저장
 *  7. SAVE phase event 발화 (saved/superseded 카운트)
 *  8. done event (messageId + artifacts 목록)
 *
 * 모든 phase event 는 즉시(non-blocking) 발화 — 프런트는 sub-second 단위로 진행 상태 갱신.
 *
 * @see <a href="docs/superpowers/specs/2026-06-22-chat-streaming-progress-design.md">디자인 문서</a>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ComposerStreamingService {

    private final ComposerService composerService;
    private final ComposerSessionRepository sessionRepo;
    private final ComposerMessageRepository messageRepo;
    private final ComposerArtifactRepository artifactRepo;
    private final ArtifactExtractor artifactExtractor;
    private final ArtifactPersistService artifactPersistService;
    private final AnthropicApiKeyService apiKeyService;
    private final LlmClient llmClient;
    private final TransactionTemplate transactionTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 채팅 stream — Flux of ServerSentEvent<String> (data 는 ChatStreamEvent 의 JSON 직렬화).
     *
     * Anthropic SSE 의 raw event 는 프런트에 직접 노출하지 않음 — 백엔드에서 가공된
     * {@link ChatStreamEvent} 만 발화 (phase / file / done / error).
     */
    public Flux<ServerSentEvent<String>> chatStream(String userId, String sessionId, List<Attachment> attachments) {
        ComposerSession session = composerService.getSession(sessionId);
        String apiKey = apiKeyService.getApiKey(userId)
                .orElseThrow(() -> new IllegalStateException(
                        "Anthropic API 키가 등록되지 않았습니다. 먼저 /composer/apikey 에 저장하세요."));

        return Flux.<ChatStreamEvent>create(sink -> {
            try {
                sink.next(ChatStreamEvent.phase("PROMPT"));
                runRound(session, userId, apiKey, attachments,
                        ComposerService.MAX_AUTO_CONTINUATIONS, sink, /*previousFileCount*/ 0,
                        /*accumulatedInputTokens*/ 0, /*accumulatedOutputTokens*/ 0);
            } catch (Exception e) {
                log.error("ComposerStreamingService — chatStream 진입 단계 오류 session={}", sessionId, e);
                sink.next(ChatStreamEvent.error("PROMPT", e.getMessage(), false));
                sink.complete();
            }
        })
        // Reactor 의 SSE 직렬화 — ChatStreamEvent → ServerSentEvent<String>.
        // ⚠️ 별도 keep-alive interval 을 mergeWith 로 붙이지 않는다 — Anthropic delta 자체가
        //    1초 미만 간격으로 emit 되어 idle 없음. 잘못된 takeUntilOther(Flux.never()) 가
        //    sink.complete() 후에도 interval 을 계속 살려 HTTP 응답이 닫히지 않는 버그가
        //    있었음 (2026-06-22 — 사용자가 'SAVE 중...' 7분+ stuck 증상으로 발견).
        .map(this::toSse);
    }

    /**
     * 한 round 의 LLM 호출 — auto-continuation 시 재귀.
     *
     * @param remaining     남은 continuation 횟수 (max_tokens hit 시에만 소진)
     * @param previousFileCount  이전 round 의 fileCount — file event idx 가 단조 증가하도록
     * @param accumulatedInputTokens / accumulatedOutputTokens — 직전 round 누적
     */
    private void runRound(ComposerSession session, String userId, String apiKey,
                          List<Attachment> attachments, int remaining,
                          reactor.core.publisher.FluxSink<ChatStreamEvent> sink,
                          int previousFileCount, int accumulatedInputTokens, int accumulatedOutputTokens) {
        MessagesRequest req;
        try {
            req = composerService.buildRequest(session, attachments);
        } catch (Exception e) {
            sink.next(ChatStreamEvent.error("PROMPT", "프롬프트 구성 실패: " + e.getMessage(), false));
            sink.complete();
            return;
        }

        // STREAM_START 이벤트 — 모델/max_tokens 노출
        Map<String, Object> startMeta = new HashMap<>();
        startMeta.put("model", req.getModel());
        startMeta.put("maxTokens", req.getMax_tokens());
        if (previousFileCount > 0) startMeta.put("continuation", true);
        sink.next(ChatStreamEvent.phase("STREAM_START", startMeta));

        StreamPhaseEmitter emitter = new StreamPhaseEmitter(sink, artifactExtractor);
        emitter.seedFromPrevious(accumulatedInputTokens, accumulatedOutputTokens);
        emitter.seedFileCount(previousFileCount);

        llmClient.streamMessages(apiKey, req)
                .doOnNext(sse -> emitter.onAnthropicEvent(sse.event(), sse.data()))
                .doOnError(err -> {
                    log.error("ComposerStreamingService — streamMessages 오류 session={}", session.getId(), err);
                    sink.next(ChatStreamEvent.error("STREAM",
                            err.getMessage() == null ? err.getClass().getSimpleName() : err.getMessage(),
                            isRecoverable(err)));
                    sink.complete();
                })
                .doOnComplete(() -> finishRound(session, userId, apiKey, attachments, remaining, sink, emitter))
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe();
    }

    /**
     * 한 round 의 stream complete 시점 처리 — STREAM_END 발화 + (필요시) continuation 진입 또는 종료.
     *
     * NOTE: 이 메서드는 reactor worker thread 에서 호출됨 — DB 저장은 별도 TX 로 격리해 호출 thread 영향 없음.
     */
    private void finishRound(ComposerSession session, String userId, String apiKey,
                             List<Attachment> attachments, int remaining,
                             reactor.core.publisher.FluxSink<ChatStreamEvent> sink,
                             StreamPhaseEmitter emitter) {
        // STREAM_END — 누적 token / stopReason
        Map<String, Object> endMeta = new HashMap<>();
        endMeta.put("tokens", emitter.outputTokens());
        endMeta.put("inputTokens", emitter.inputTokens());
        endMeta.put("stopReason", emitter.stopReason());
        sink.next(ChatStreamEvent.phase("STREAM_END", endMeta));

        // max_tokens hit + 남은 continuation 있음 → CONTINUE_PROMPT 추가 후 재귀
        if (emitter.isTruncated() && remaining > 0) {
            // 이전 round 의 본문은 누적 텍스트로 살려둠 — 단 별도 message 로 저장하지 않고 buffer 만 이어감
            //   (non-streaming chatWithAutoContinuation 은 매 round 마다 메시지를 저장하지만,
            //    streaming 은 마지막 한 번만 저장하는 게 일관성 — buffer 누적분이 최종 응답).
            //   다만 LLM 입장에서는 "이전 응답이 끊겼다 → CONTINUE_PROMPT" 가 필요하므로
            //   non-streaming 과 동일한 패턴 (이전 round 결과를 DB 에 일단 저장 + CONTINUE_PROMPT 추가)
            //   을 따른다. 그렇게 해야 buildRequest 가 다음 round 에 정확한 history 를 만든다.
            Map<String, Object> contMeta = new HashMap<>();
            contMeta.put("round", ComposerService.MAX_AUTO_CONTINUATIONS - remaining + 2);
            contMeta.put("remaining", remaining);
            sink.next(ChatStreamEvent.phase("CONTINUATION", contMeta));

            try {
                // 이전 round 결과 임시 저장 (continuation 흐름에 필요한 assistant message)
                persistInTx(() -> savePartialAssistantMessage(session, emitter));
                // CONTINUE_PROMPT 추가 (별도 user message)
                persistInTx(() -> composerService.appendUserMessage(session.getId(),
                        ComposerService.CONTINUE_PROMPT_PUBLIC));
            } catch (Exception e) {
                log.error("ComposerStreamingService — continuation 준비 실패 session={}", session.getId(), e);
                sink.next(ChatStreamEvent.error("CONTINUATION", e.getMessage(), false));
                sink.complete();
                return;
            }

            // 재귀 — 다음 round. attachments 는 첫 round 만 적용.
            runRound(session, userId, apiKey, /*attachments*/ null, remaining - 1, sink,
                    emitter.fileCount(), emitter.inputTokens(), emitter.outputTokens());
            return;
        }

        // 종료 — EXTRACT → SAVE → done
        sink.next(ChatStreamEvent.phase("EXTRACT"));
        try {
            PersistResult pr = persistInTx(() -> persistFinalResponse(session, userId, emitter));
            Map<String, Object> saveMeta = new HashMap<>();
            saveMeta.put("saved", pr.artifactCount);
            sink.next(ChatStreamEvent.phase("SAVE", saveMeta));

            sink.next(ChatStreamEvent.done(pr.messageId, pr.artifactSummaries));
            sink.complete();
        } catch (Exception e) {
            log.error("ComposerStreamingService — persist 단계 실패 session={}", session.getId(), e);
            sink.next(ChatStreamEvent.error("SAVE", e.getMessage(), false));
            sink.complete();
        }
    }

    // ---- 최종 응답 저장 (메시지 + 아티팩트) ----

    private static class PersistResult {
        String messageId;
        int    artifactCount;
        List<Map<String, Object>> artifactSummaries;
    }

    private PersistResult persistFinalResponse(ComposerSession session, String userId, StreamPhaseEmitter emitter) {
        String text = emitter.fullText();
        int inTok  = emitter.inputTokens();
        int outTok = emitter.outputTokens();

        int nextSeq = composerService.nextTurnSeqPublic(session.getId());
        ComposerMessage saved = messageRepo.save(ComposerMessage.builder()
                .sessionId(session.getId())
                .turnSeq(nextSeq)
                .role(ComposerMessage.ROLE_ASSISTANT)
                .content(text)
                .stopReason(emitter.stopReason())
                .inputTokens(inTok)
                .outputTokens(outTok)
                .modelName(emitter.streamModel())
                .metadata(safeJson(emitter.summary()))
                .createDttm(LocalDateTime.now())
                .build());

        List<ComposerArtifact> artifacts = artifactExtractor.extract(session.getId(), saved.getId(), userId, text);
        if (!artifacts.isEmpty()) {
            artifactPersistService.saveWithSupersede(artifacts);
            log.info("ComposerStreamingService 아티팩트 저장: session={} new={}", session.getId(), artifacts.size());
        }

        // 세션 토큰 누적
        session.setTotalInTokens((session.getTotalInTokens() == null ? 0 : session.getTotalInTokens()) + inTok);
        session.setTotalOutTokens((session.getTotalOutTokens() == null ? 0 : session.getTotalOutTokens()) + outTok);
        if (session.getModelName() == null && emitter.streamModel() != null) {
            session.setModelName(emitter.streamModel());
        }
        sessionRepo.save(session);

        PersistResult r = new PersistResult();
        r.messageId = saved.getId();
        r.artifactCount = artifacts.size();
        r.artifactSummaries = artifacts.stream()
                .map(a -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id",   a.getId());
                    m.put("type", a.getArtifactType());
                    m.put("name", a.getFileName());
                    m.put("path", a.getFilePath());
                    return m;
                })
                .collect(Collectors.toList());
        return r;
    }

    /**
     * Continuation 중간 round 의 partial assistant message 저장 — buildRequest 가 다음 round 에서
     * 정확한 history 를 구성할 수 있도록.
     */
    private Void savePartialAssistantMessage(ComposerSession session, StreamPhaseEmitter emitter) {
        int nextSeq = composerService.nextTurnSeqPublic(session.getId());
        messageRepo.save(ComposerMessage.builder()
                .sessionId(session.getId())
                .turnSeq(nextSeq)
                .role(ComposerMessage.ROLE_ASSISTANT)
                .content(emitter.fullText())
                .stopReason(emitter.stopReason())
                .inputTokens(emitter.inputTokens())
                .outputTokens(emitter.outputTokens())
                .modelName(emitter.streamModel())
                .createDttm(LocalDateTime.now())
                .build());
        return null;
    }

    // ---- 헬퍼 ----

    private interface PersistOp<T> { T run(); }

    private <T> T persistInTx(PersistOp<T> op) {
        return transactionTemplate.execute(status -> op.run());
    }

    private boolean isRecoverable(Throwable err) {
        // Anthropic 5xx · 429 (rate limit) · network blip → recoverable hint
        String msg = err.getMessage() == null ? "" : err.getMessage().toLowerCase();
        return msg.contains("529") || msg.contains("503") || msg.contains("502") || msg.contains("504")
                || msg.contains("rate") || msg.contains("overload") || msg.contains("timeout");
    }

    private ServerSentEvent<String> toSse(ChatStreamEvent ev) {
        String data;
        try {
            data = objectMapper.writeValueAsString(ev.getData() == null ? new HashMap<>() : ev.getData());
        } catch (JsonProcessingException e) {
            data = "{}";
        }
        return ServerSentEvent.<String>builder()
                .event(ev.getEvent())
                .data(data)
                .build();
    }

    private String safeJson(Object o) {
        try { return objectMapper.writeValueAsString(o); }
        catch (JsonProcessingException e) { return null; }
    }

    /** 외부 헬퍼 메서드 노출 위한 contract 검증용 사용 안 함 (compile-time check) */
    @SuppressWarnings("unused")
    private static final MediaType SSE_MIME = MediaType.TEXT_EVENT_STREAM;
}

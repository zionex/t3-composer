package com.zionex.t3composer.domain.client;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

import jakarta.annotation.PostConstruct;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesRequest;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/**
 * CLI 백엔드 — {@code claude} 바이너리 subprocess 를 통해 LLM 호출.
 * {@code LLM_BACKEND=cli} 일 때 활성.
 *
 * <p>stdin: {@link MessagesRequest} 를 stream-json 라인 형식으로 직렬화.
 * stdout: stream-json 이벤트를 {@link SseEventTranslator} 가 Anthropic SSE 로 변환.
 *
 * <p>{@code apiKey} 파라미터는 무시 — CLI 가 마운트된 {@code ~/.claude}
 * OAuth 세션을 사용. 시그니처는 {@link LlmClient} 호환을 위해 유지.
 */
@Slf4j
@Component
@EnableConfigurationProperties(LlmCliProperties.class)
@ConditionalOnProperty(name = "llm.backend", havingValue = "cli")
public class CliLlmClient implements LlmClient {

    private final LlmCliInvoker    invoker;
    private final ObjectMapper     mapper;
    private final LlmCliProperties props;
    private       Semaphore        concurrencyGate;

    public CliLlmClient(LlmCliInvoker invoker,
                        ObjectMapper mapper,
                        LlmCliProperties props,
                        Semaphore concurrencyGate) {
        this.invoker         = invoker;
        this.mapper          = mapper;
        this.props           = props;
        this.concurrencyGate = concurrencyGate;
    }

    @PostConstruct
    void initSemaphore() {
        if (concurrencyGate == null) {
            concurrencyGate = new Semaphore(props.getMaxConcurrent());
        }
    }

    @Override
    public Flux<ServerSentEvent<String>> streamMessages(String apiKey, MessagesRequest request) {
        return Flux.<ServerSentEvent<String>>create(sink -> {
            Semaphore gate = effectiveGate();
            try {
                if (!gate.tryAcquire(1, TimeUnit.SECONDS)) {
                    sink.error(new LlmCliException(429,
                            "CLI 동시 요청 한도 초과 (LLM_CLI_MAX_CONCURRENT=" + props.getMaxConcurrent() + ")"));
                    return;
                }
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                sink.error(new LlmCliException(503, "interrupted while waiting for CLI slot"));
                return;
            }

            List<String> cmd = List.of(
                    props.getBinary(),
                    "-p",
                    "--input-format",  "stream-json",
                    "--output-format", "stream-json",
                    "--model",         request.getModel() == null ? "" : request.getModel()
            );

            final LlmCliProcess proc;
            try {
                proc = invoker.start(cmd);
            } catch (Exception startErr) {
                gate.release();
                sink.error(new LlmCliException(503, "CLI 시작 실패: " + startErr.getMessage()));
                return;
            }

            // stdin: request 직렬화 (별도 스레드)
            CompletableFuture.runAsync(() -> writeRequest(proc.stdin(), request),
                    Schedulers.boundedElastic()::schedule);

            // stdout: 라인 단위 변환 + emit
            CompletableFuture.runAsync(() -> {
                SseEventTranslator translator = new SseEventTranslator();
                try (BufferedReader br = new BufferedReader(
                        new InputStreamReader(proc.stdout(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = br.readLine()) != null) {
                        for (ServerSentEvent<String> e : translator.translate(line)) {
                            sink.next(e);
                        }
                    }
                    boolean finished = proc.waitFor(props.getTimeoutMinutes(), TimeUnit.MINUTES);
                    if (!finished) {
                        proc.destroyForcibly();
                        sink.error(new LlmCliException(504,
                                "CLI 응답 지연 (" + props.getTimeoutMinutes() + "분 초과)"));
                        return;
                    }
                    int exit = proc.exitValue();
                    if (exit != 0) {
                        String stderr = readAll(proc.stderr());
                        sink.error(LlmCliException.fromStderr(exit, stderr));
                    } else {
                        sink.complete();
                    }
                } catch (LlmCliException e) {
                    sink.error(e);
                } catch (Exception e) {
                    sink.error(new LlmCliException(503, "CLI stream read failed: " + e.getMessage()));
                } finally {
                    gate.release();
                }
            }, Schedulers.boundedElastic()::schedule);

            sink.onDispose(() -> {
                if (proc.isAlive()) proc.destroyForcibly();
            });
        });
    }

    @Override
    public Mono<MessagesResponse> sendMessages(String apiKey, MessagesRequest request) {
        return streamMessages(apiKey, request)
                .reduce(new MessagesResponseAssembler(),
                        (acc, sse) -> acc.feed(sse.event(), sse.data()))
                .map(MessagesResponseAssembler::build);
    }

    private Semaphore effectiveGate() {
        if (concurrencyGate == null) initSemaphore();
        return concurrencyGate;
    }

    private void writeRequest(OutputStream stdin, MessagesRequest request) {
        try (OutputStream os = stdin) {
            if (request.getSystem() != null) {
                os.write(mapper.writeValueAsBytes(java.util.Map.of(
                        "type", "system",
                        "content", request.getSystem()
                )));
                os.write('\n');
            }
            if (request.getMessages() != null) {
                for (Object m : request.getMessages()) {
                    os.write(mapper.writeValueAsBytes(java.util.Map.of(
                            "type", "user",
                            "message", m
                    )));
                    os.write('\n');
                }
            }
            os.flush();
        } catch (Exception e) {
            log.warn("CLI stdin write failed: {}", e.getMessage(), e);
        }
    }

    private String readAll(java.io.InputStream is) {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) sb.append(line).append('\n');
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }
}

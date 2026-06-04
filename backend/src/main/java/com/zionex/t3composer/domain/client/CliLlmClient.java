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
                        LlmCliProperties props) {
        this.invoker = invoker;
        this.mapper  = mapper;
        this.props   = props;
    }

    @PostConstruct
    void initSemaphore() {
        this.concurrencyGate = new Semaphore(props.getMaxConcurrent());
    }

    /** Package-private hook for tests to inject a deterministic semaphore. */
    void setConcurrencyGateForTest(Semaphore s) {
        this.concurrencyGate = s;
    }

    @Override
    public Flux<ServerSentEvent<String>> streamMessages(String apiKey, MessagesRequest request) {
        return Flux.<ServerSentEvent<String>>create(sink -> {
            Semaphore gate = concurrencyGate;
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

            // claude CLI 호출 명령 구성.
            //  - -p / --verbose: print 모드 + verbose (stream-json 출력에 필수)
            //  - --input-format=stream-json: stdin 으로 대화 메시지 라인 단위 전달
            //  - --output-format=stream-json: stdout 으로 SSE-호환 이벤트 받기
            //  - --include-partial-messages: 글자 단위 증분 streaming (ChatPanel 타이핑 UX)
            //  - --system-prompt-file: ★ 시스템 프롬프트는 CLI 플래그로만 인식됨.
            //      --system-prompt <inline> 은 argv 단일 인자 128KB 한도(E2BIG) 때문에 사용 불가
            //      → 임시 파일에 써서 path 만 전달. subprocess 종료 후 정리.
            //  - --model: API 모드와 동일한 model id 그대로 전달
            String sysText = extractSystemText(request.getSystem());
            final java.nio.file.Path sysPromptFile;
            try {
                sysPromptFile = (sysText != null && !sysText.isEmpty())
                        ? writeSystemPromptToTempFile(sysText)
                        : null;
            } catch (Exception fileErr) {
                gate.release();
                sink.error(new LlmCliException(503,
                        "system prompt 임시 파일 쓰기 실패: " + fileErr.getMessage()));
                return;
            }

            java.util.ArrayList<String> cmd = new java.util.ArrayList<>();
            cmd.add(props.getBinary());
            cmd.add("-p");
            cmd.add("--verbose");
            cmd.add("--input-format");  cmd.add("stream-json");
            cmd.add("--output-format"); cmd.add("stream-json");
            cmd.add("--include-partial-messages");
            if (sysPromptFile != null) {
                cmd.add("--system-prompt-file");
                cmd.add(sysPromptFile.toString());
            }
            cmd.add("--model");
            cmd.add(request.getModel() == null ? "" : request.getModel());

            final LlmCliProcess proc;
            try {
                proc = invoker.start(cmd);
            } catch (Exception startErr) {
                if (sysPromptFile != null) deleteQuietly(sysPromptFile);
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
                    if (sysPromptFile != null) deleteQuietly(sysPromptFile);
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

    /**
     * 시스템 프롬프트 텍스트를 임시 파일에 UTF-8 로 쓰고 path 를 돌려준다.
     * subprocess 종료 후 호출자가 {@link #deleteQuietly(java.nio.file.Path)} 로 정리.
     */
    static java.nio.file.Path writeSystemPromptToTempFile(String text) throws java.io.IOException {
        java.nio.file.Path tmp = java.nio.file.Files.createTempFile("t3composer-sysprompt-", ".txt");
        java.nio.file.Files.writeString(tmp, text, java.nio.charset.StandardCharsets.UTF_8);
        return tmp;
    }

    /** 임시 파일 best-effort 삭제 (실패해도 throw 안 함). */
    static void deleteQuietly(java.nio.file.Path path) {
        try {
            java.nio.file.Files.deleteIfExists(path);
        } catch (Exception e) {
            // intentionally ignored — temp 디렉토리 cleanup 은 OS 가 보장
        }
    }

    /**
     * 시스템 프롬프트 블록 리스트에서 텍스트만 추출해 단일 문자열로 합친다.
     * cache_control 등 메타는 CLI 가 무시하므로 버린다 (CLI 가 자체 캐싱 관리).
     */
    static String extractSystemText(java.util.List<AnthropicModels.SystemBlock> system) {
        if (system == null || system.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        for (AnthropicModels.SystemBlock b : system) {
            if (b == null) continue;
            String t = b.getText();
            if (t != null && !t.isEmpty()) {
                if (sb.length() > 0) sb.append("\n\n");
                sb.append(t);
            }
        }
        return sb.toString();
    }

    private void writeRequest(OutputStream stdin, MessagesRequest request) {
        // ★ system prompt 는 stdin 으로 전달하지 않는다 — CLI 의 --system-prompt 플래그로만
        //   인식됨. 여기서는 대화 메시지 (user / assistant) 만 stream-json 라인으로 emit.
        try (OutputStream os = stdin) {
            if (request.getMessages() != null) {
                for (AnthropicModels.Message m : request.getMessages()) {
                    if (m == null) continue;
                    String role = m.getRole() == null ? "user" : m.getRole();
                    os.write(mapper.writeValueAsBytes(java.util.Map.of(
                            "type",    role,    // "user" 또는 "assistant" — 이력 재현용
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

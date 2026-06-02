package com.zionex.t3composer.domain.client;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.springframework.http.codec.ServerSentEvent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesRequest;

import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

class CliLlmClientTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void streamingEmitsTranslatedSseEvents() {
        String cliOutput = String.join("\n",
                "{\"type\":\"system\",\"subtype\":\"init\",\"model\":\"x\"}",
                "{\"type\":\"assistant\",\"message\":{\"content\":[{\"type\":\"text\",\"text\":\"hi\"}]}}",
                "{\"type\":\"result\",\"subtype\":\"success\",\"usage\":{\"input_tokens\":5,\"output_tokens\":1}}"
        );
        FakeInvoker invoker = new FakeInvoker(cliOutput, "", 0);
        CliLlmClient client = new CliLlmClient(invoker, mapper, props(), null);

        MessagesRequest req = new MessagesRequest();
        req.setModel("x");

        Flux<ServerSentEvent<String>> events = client.streamMessages("ignored-api-key", req);

        StepVerifier.create(events.map(ServerSentEvent::event))
                .expectNext("message_start")
                .expectNext("content_block_start")
                .expectNext("content_block_delta")
                .expectNext("content_block_stop")
                .expectNext("message_delta")
                .expectNext("message_stop")
                .verifyComplete();
    }

    @Test
    void nonZeroExitProducesLlmCliException() {
        FakeInvoker invoker = new FakeInvoker("", "Error: Please run claude /login", 1);
        CliLlmClient client = new CliLlmClient(invoker, mapper, props(), null);

        MessagesRequest req = new MessagesRequest();
        req.setModel("x");

        StepVerifier.create(client.streamMessages("k", req))
                .expectErrorSatisfies(err -> {
                    assertThat(err).isInstanceOf(LlmCliException.class);
                    assertThat(((LlmCliException) err).getStatusCode()).isEqualTo(401);
                })
                .verify();
    }

    @Test
    void apiKeyIsIgnored() {
        FakeInvoker invoker = new FakeInvoker(
                "{\"type\":\"result\",\"subtype\":\"success\",\"usage\":{\"input_tokens\":0,\"output_tokens\":0}}",
                "", 0);
        CliLlmClient client = new CliLlmClient(invoker, mapper, props(), null);

        MessagesRequest req = new MessagesRequest();
        req.setModel("x");

        client.streamMessages("sk-ant-SECRET-DO-NOT-LEAK", req)
                .blockLast(java.time.Duration.ofSeconds(5));

        assertThat(invoker.lastCommand).doesNotContain("sk-ant-SECRET-DO-NOT-LEAK");
    }

    private LlmCliProperties props() {
        LlmCliProperties p = new LlmCliProperties();
        p.setBinary("/usr/local/bin/claude");
        p.setTimeoutMinutes(1);
        p.setMaxConcurrent(2);
        return p;
    }

    // --- Fake LlmCliInvoker ---

    static class FakeInvoker implements LlmCliInvoker {
        private final String stdoutPayload;
        private final String stderrPayload;
        private final int    exitCode;
        List<String> lastCommand;

        FakeInvoker(String stdout, String stderr, int exit) {
            this.stdoutPayload = stdout;
            this.stderrPayload = stderr;
            this.exitCode      = exit;
        }

        @Override
        public LlmCliProcess start(List<String> command) {
            this.lastCommand = command;
            return new FakeProcess(stdoutPayload, stderrPayload, exitCode);
        }
    }

    static class FakeProcess implements LlmCliProcess {
        private final InputStream  stdout;
        private final InputStream  stderr;
        private final OutputStream stdin = new ByteArrayOutputStream();
        private final int          exit;
        private boolean alive = true;

        FakeProcess(String stdoutPayload, String stderrPayload, int exit) {
            this.stdout = new ByteArrayInputStream(stdoutPayload.getBytes());
            this.stderr = new ByteArrayInputStream(stderrPayload.getBytes());
            this.exit   = exit;
        }

        @Override public OutputStream stdin()  { return stdin;  }
        @Override public InputStream  stdout() { return stdout; }
        @Override public InputStream  stderr() { return stderr; }

        @Override
        public boolean waitFor(long timeout, TimeUnit unit) {
            alive = false;
            return true;
        }

        @Override public int     exitValue()       { return exit; }
        @Override public boolean isAlive()         { return alive; }
        @Override public void    destroyForcibly() { alive = false; }
    }
}

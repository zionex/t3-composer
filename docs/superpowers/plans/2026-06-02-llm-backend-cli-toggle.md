# LLM Backend Toggle (API ↔ CLI) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `.env` toggle `LLM_BACKEND=api|cli` that routes all 9 LLM service calls through either the existing Anthropic HTTP API or a local `claude` CLI subprocess (using the developer's host `~/.claude` login), with streaming + multimodal + prompt-caching preserved in both modes.

**Architecture:** Introduce `LlmClient` interface with two `@ConditionalOnProperty`-selected implementations — `ApiLlmClient` (renamed from `AnthropicClient`, no logic change) and `CliLlmClient` (new — wraps `claude` subprocess via `ProcessBuilder`, translates CLI stream-json output → Anthropic SSE events). 9 services swap `AnthropicClient` field type → `LlmClient` (no call-site changes).

**Tech Stack:** Spring Boot 3.0.13 · WebFlux (Reactor `Mono`/`Flux`) · Lombok · JUnit 5 + Mockito (new test infrastructure) · Anthropic Claude Code CLI (`@anthropic-ai/claude-code` npm package).

**Spec:** [`docs/superpowers/specs/2026-06-02-llm-backend-cli-toggle-design.md`](../specs/2026-06-02-llm-backend-cli-toggle-design.md)

---

## File Structure

### Created (15 files)

**Production code** (`backend/src/main/java/com/zionex/t3composer/`):
- `domain/client/LlmClient.java` — interface (2 methods)
- `domain/client/ApiLlmClient.java` — renamed from `AnthropicClient.java`; same logic, implements `LlmClient`
- `domain/client/CliLlmClient.java` — subprocess-backed `LlmClient` impl
- `domain/client/LlmCliInvoker.java` — subprocess invocation interface (testability)
- `domain/client/ProcessBuilderInvoker.java` — production `LlmCliInvoker` impl
- `domain/client/LlmCliProcess.java` — thin `Process` wrapper (stdin/stdout/stderr/exit/destroy)
- `domain/client/LlmCliException.java` — runtime exception with HTTP status + message
- `domain/client/LlmCliProperties.java` — `@ConfigurationProperties("llm.cli")` binder
- `domain/client/SseEventTranslator.java` — pure function: CLI stream-json line → 0..N Anthropic SSE events
- `config/LlmBackendHealthCheck.java` — `ApplicationReadyEvent` listener (fail-fast for CLI mode)

**Docker / config**:
- `docker/backend/entrypoint.sh` — CLI readiness diagnostic + login warning

**Tests** (`backend/src/test/java/com/zionex/t3composer/`):
- `domain/client/SseEventTranslatorTest.java`
- `domain/client/CliLlmClientTest.java` (uses mock invoker)
- `domain/client/LlmCliPropertiesTest.java`
- `domain/client/LlmCliExceptionTest.java`
- `domain/client/LlmBackendBeanWiringTest.java` — verifies `@ConditionalOnProperty` selects correct impl
- `domain/client/LlmCliIntegrationTest.java` — env-gated real subprocess test

### Modified (12 files)

- `backend/pom.xml` — add `spring-boot-starter-test`
- `backend/src/main/resources/application-dev.yaml` — add `llm.*` section
- `backend/src/main/resources/application.yaml` — add `llm.backend` default
- 9 service files — `private final AnthropicClient anthropicClient;` → `private final LlmClient llmClient;` + call-site rename
- `docker/backend/Dockerfile` — add Node.js + claude CLI install
- `docker-compose.yml` — composer-backend volume `~/.claude:/root/.claude:rw` + 4 env vars
- `.env.example` — add `LLM_BACKEND` etc.
- `CLAUDE.md` — add §1.7 LLM Backend mode section

### Deleted (1 file)
- `backend/src/main/java/com/zionex/t3composer/domain/client/AnthropicClient.java` — renamed to `ApiLlmClient.java` via Task 3

---

## Phase 1 — Foundation (Interface + Service Migration)

> **Goal**: Add test infrastructure, introduce `LlmClient` interface, rename existing `AnthropicClient` → `ApiLlmClient`, migrate 9 services. After this phase backend behaves identically (LLM_BACKEND unset → defaults to `api`).

---

### Task 1: Add test infrastructure

**Files:**
- Modify: `backend/pom.xml`
- Create: `backend/src/test/java/com/zionex/t3composer/SmokeTest.java`

- [ ] **Step 1: Add `spring-boot-starter-test` dependency to pom.xml**

Locate the existing `<dependencies>` block (right after `spring-boot-starter-actuator`) and add:

```xml
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>io.projectreactor</groupId>
            <artifactId>reactor-test</artifactId>
            <scope>test</scope>
        </dependency>
```

- [ ] **Step 2: Create test directory + smoke test**

Create `backend/src/test/java/com/zionex/t3composer/SmokeTest.java`:

```java
package com.zionex.t3composer;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SmokeTest {

    @Test
    void testInfrastructureWorks() {
        assertThat(1 + 1).isEqualTo(2);
    }
}
```

- [ ] **Step 3: Run smoke test inside container**

```bash
docker compose exec -T composer-backend mvn -B -q test -Dtest=SmokeTest
```

Expected: BUILD SUCCESS · `Tests run: 1, Failures: 0, Errors: 0, Skipped: 0`

- [ ] **Step 4: Commit**

```bash
git add backend/pom.xml backend/src/test/java/com/zionex/t3composer/SmokeTest.java
git commit -m "$(cat <<'EOF'
test(backend): spring-boot-starter-test 의존성 + 테스트 디렉토리 부트스트랩

LLM backend 토글 도입을 위한 단위 테스트 인프라 준비.
spring-boot-starter-test (JUnit5+Mockito+AssertJ) + reactor-test 추가.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Create `LlmClient` interface

**Files:**
- Create: `backend/src/main/java/com/zionex/t3composer/domain/client/LlmClient.java`
- Create: `backend/src/test/java/com/zionex/t3composer/domain/client/LlmClientContractTest.java`

- [ ] **Step 1: Write the failing test**

Create `backend/src/test/java/com/zionex/t3composer/domain/client/LlmClientContractTest.java`:

```java
package com.zionex.t3composer.domain.client;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;

import org.junit.jupiter.api.Test;
import org.springframework.http.codec.ServerSentEvent;

import com.zionex.t3composer.domain.client.AnthropicModels.MessagesRequest;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

class LlmClientContractTest {

    @Test
    void interfaceDeclaresSendMessagesReturningMono() throws Exception {
        Method m = LlmClient.class.getMethod("sendMessages", String.class, MessagesRequest.class);
        assertThat(m.getReturnType()).isEqualTo(Mono.class);
        assertThat(m.getGenericReturnType().getTypeName())
                .contains(MessagesResponse.class.getName());
    }

    @Test
    void interfaceDeclaresStreamMessagesReturningFluxOfSse() throws Exception {
        Method m = LlmClient.class.getMethod("streamMessages", String.class, MessagesRequest.class);
        assertThat(m.getReturnType()).isEqualTo(Flux.class);
        assertThat(m.getGenericReturnType().getTypeName())
                .contains(ServerSentEvent.class.getName());
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
docker compose exec -T composer-backend mvn -B -q test -Dtest=LlmClientContractTest
```

Expected: FAIL with compile error `cannot find symbol class LlmClient`

- [ ] **Step 3: Create the interface**

Create `backend/src/main/java/com/zionex/t3composer/domain/client/LlmClient.java`:

```java
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
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
docker compose exec -T composer-backend mvn -B -q test -Dtest=LlmClientContractTest
```

Expected: PASS · `Tests run: 2, Failures: 0`

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/client/LlmClient.java \
        backend/src/test/java/com/zionex/t3composer/domain/client/LlmClientContractTest.java
git commit -m "$(cat <<'EOF'
feat(client): LlmClient 인터페이스 추가 — API/CLI 백엔드 추상화

sendMessages / streamMessages 두 메서드의 contract 만 정의. 구현은 후속 커밋
(ApiLlmClient rename + CliLlmClient 신규).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Rename `AnthropicClient` → `ApiLlmClient` and implement `LlmClient`

**Files:**
- Create: `backend/src/main/java/com/zionex/t3composer/domain/client/ApiLlmClient.java`
- Delete: `backend/src/main/java/com/zionex/t3composer/domain/client/AnthropicClient.java`

- [ ] **Step 1: Copy `AnthropicClient.java` to `ApiLlmClient.java` with edits**

The new file has the same logic but: (a) class renamed, (b) implements `LlmClient`, (c) `@ConditionalOnProperty` added.

Create `backend/src/main/java/com/zionex/t3composer/domain/client/ApiLlmClient.java`:

```java
package com.zionex.t3composer.domain.client;

import java.time.Duration;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
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
 * Anthropic Claude HTTP API 백엔드 — {@code LLM_BACKEND=api} (기본) 일 때 활성.
 * 기존 {@code AnthropicClient} 와 동일 로직. {@link LlmClient} contract 구현.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "llm.backend", havingValue = "api", matchIfMissing = true)
public class ApiLlmClient implements LlmClient {

    private static final String BASE_URL     = "https://api.anthropic.com";
    private static final String API_VERSION  = "2023-06-01";
    private static final String MESSAGES_URL = "/v1/messages";

    private final WebClient webClient;

    public ApiLlmClient(WebClient.Builder builder) {
        ConnectionProvider provider = ConnectionProvider.builder("anthropic")
                .maxConnections(50)
                .pendingAcquireTimeout(Duration.ofSeconds(30))
                .build();

        HttpClient httpClient = HttpClient.create(provider)
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 30_000)
                .responseTimeout(Duration.ofMinutes(40));

        this.webClient = builder
                .baseUrl(BASE_URL)
                .codecs(cfg -> cfg.defaultCodecs().maxInMemorySize(32 * 1024 * 1024))
                .clientConnector(new org.springframework.http.client.reactive.ReactorClientHttpConnector(httpClient))
                .build();

        log.info("ApiLlmClient initialized (baseUrl={}, apiVersion={})", BASE_URL, API_VERSION);
    }

    @Override
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

    @Override
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
```

- [ ] **Step 2: Delete the old `AnthropicClient.java`**

```bash
rm /Users/hej/work/projects/t3-composer/backend/src/main/java/com/zionex/t3composer/domain/client/AnthropicClient.java
```

- [ ] **Step 3: Migrate 9 service files — field type + import**

For each of the 9 service files, replace import + field declaration. Use the following `sed`-style edits (apply to each file via Edit tool):

**Per file** (`ComposerService.java`, `PrefillFromSourceService.java`, `PrefillFromDesignService.java`, `PrefillFromMockupService.java`, `PrefillFromSynthesizedService.java`, `RecommendMockupService.java`, `AutoSuggestService.java`, `DesignDocAnalyzeService.java`, `MockupTransformService.java`):

Replace:
```java
import com.zionex.t3composer.domain.client.AnthropicClient;
```
With:
```java
import com.zionex.t3composer.domain.client.LlmClient;
```

Replace (note `ComposerService.java` has special whitespace alignment — preserve it):
```java
    private final AnthropicClient anthropicClient;
```
With:
```java
    private final LlmClient llmClient;
```

For `ComposerService.java` specifically (line 102 has aligned whitespace):
```java
    private final AnthropicClient           anthropicClient;
```
becomes:
```java
    private final LlmClient                 llmClient;
```

Replace all call sites within each file:
```java
anthropicClient.sendMessages(
anthropicClient.streamMessages(
```
With:
```java
llmClient.sendMessages(
llmClient.streamMessages(
```

- [ ] **Step 4: Verify backend compiles**

```bash
docker compose exec -T composer-backend mvn -B -q compile
```

Expected: BUILD SUCCESS (no compile errors).

- [ ] **Step 5: Run the contract test + smoke test to verify nothing broke**

```bash
docker compose exec -T composer-backend mvn -B -q test -Dtest='SmokeTest,LlmClientContractTest'
```

Expected: PASS · all tests green.

- [ ] **Step 6: Verify backend boots (manual smoke)**

Tail logs from the live container:

```bash
docker compose logs --tail=50 composer-backend | grep -E "ApiLlmClient|Started|ERROR"
```

Expected: `ApiLlmClient initialized (baseUrl=https://api.anthropic.com, ...)` log line + `Started T3ComposerApplication` line. No NoSuchBeanDefinitionException for `LlmClient`.

If backend hasn't auto-restarted from file changes, force restart:
```bash
docker compose exec -T composer-backend sh -c 'echo "$(date +%s)" > /app/target/classes/.devtools-restart-trigger'
```
Then re-run the log check above.

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/client/ \
        backend/src/main/java/com/zionex/t3composer/domain/service/
git commit -m "$(cat <<'EOF'
refactor(client): AnthropicClient → ApiLlmClient (implements LlmClient)

기존 117줄 로직 그대로 보존하면서 LlmClient 인터페이스 구현 + @ConditionalOnProperty
(llm.backend=api, matchIfMissing=true) 부착. LLM_BACKEND 미설정 시 기존 동작 그대로.

9개 서비스 (ComposerService 외 8) 의 AnthropicClient 필드 타입을 LlmClient 로 변경.
호출 코드 무수정 (sendMessages/streamMessages 시그니처 동일).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — CliLlmClient + SSE Translator

> **Goal**: Build the CLI-backed `LlmClient` impl. After this phase setting `LLM_BACKEND=cli` (without Docker changes — `claude` binary must already exist) routes all 9 services through the subprocess.

---

### Task 4: `LlmCliProperties` (`@ConfigurationProperties`)

**Files:**
- Create: `backend/src/main/java/com/zionex/t3composer/domain/client/LlmCliProperties.java`
- Create: `backend/src/test/java/com/zionex/t3composer/domain/client/LlmCliPropertiesTest.java`

- [ ] **Step 1: Write the failing test**

Create `backend/src/test/java/com/zionex/t3composer/domain/client/LlmCliPropertiesTest.java`:

```java
package com.zionex.t3composer.domain.client;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.ConfigurationPropertySource;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

import java.util.Map;

class LlmCliPropertiesTest {

    @Test
    void bindsAllFieldsFromMap() {
        Map<String, Object> source = Map.of(
                "llm.cli.binary",          "/usr/local/bin/claude",
                "llm.cli.timeout-minutes", "30",
                "llm.cli.max-concurrent",  "8"
        );
        ConfigurationPropertySource props = new MapConfigurationPropertySource(source);

        LlmCliProperties bound = new Binder(props).bind("llm.cli", LlmCliProperties.class).get();

        assertThat(bound.getBinary()).isEqualTo("/usr/local/bin/claude");
        assertThat(bound.getTimeoutMinutes()).isEqualTo(30);
        assertThat(bound.getMaxConcurrent()).isEqualTo(8);
    }

    @Test
    void defaultsApplyWhenAbsent() {
        ConfigurationPropertySource empty = new MapConfigurationPropertySource(Map.of());

        LlmCliProperties bound = new Binder(empty).bind("llm.cli", LlmCliProperties.class)
                .orElseGet(LlmCliProperties::new);

        assertThat(bound.getBinary()).isEqualTo("/usr/local/bin/claude");
        assertThat(bound.getTimeoutMinutes()).isEqualTo(40);
        assertThat(bound.getMaxConcurrent()).isEqualTo(4);
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
docker compose exec -T composer-backend mvn -B -q test -Dtest=LlmCliPropertiesTest
```

Expected: FAIL with compile error (`LlmCliProperties` doesn't exist).

- [ ] **Step 3: Create the properties class**

Create `backend/src/main/java/com/zionex/t3composer/domain/client/LlmCliProperties.java`:

```java
package com.zionex.t3composer.domain.client;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Data;

/**
 * CLI 모드 ({@code llm.backend=cli}) 전용 설정.
 * .env 의 {@code LLM_CLI_*} 환경변수가 {@code application-dev.yaml} 의
 * {@code llm.cli.*} placeholder 로 주입된다.
 */
@Data
@ConfigurationProperties(prefix = "llm.cli")
public class LlmCliProperties {

    /** claude CLI 바이너리 절대 경로. 기본: {@code /usr/local/bin/claude} */
    private String binary = "/usr/local/bin/claude";

    /** subprocess 응답 timeout (분). 초과 시 destroyForcibly + 504. 기본 40. */
    private int timeoutMinutes = 40;

    /** 동시 CLI 호출 상한 (semaphore). 구독 rate-limit 보호. 기본 4. */
    private int maxConcurrent = 4;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
docker compose exec -T composer-backend mvn -B -q test -Dtest=LlmCliPropertiesTest
```

Expected: PASS · `Tests run: 2, Failures: 0`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/client/LlmCliProperties.java \
        backend/src/test/java/com/zionex/t3composer/domain/client/LlmCliPropertiesTest.java
git commit -m "$(cat <<'EOF'
feat(client): LlmCliProperties — llm.cli.* 설정 바인딩

binary / timeout-minutes / max-concurrent 3개 필드. 모두 default 보유 →
.env 미설정 시에도 정상 동작.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `LlmCliException` with HTTP status mapping

**Files:**
- Create: `backend/src/main/java/com/zionex/t3composer/domain/client/LlmCliException.java`
- Create: `backend/src/test/java/com/zionex/t3composer/domain/client/LlmCliExceptionTest.java`

- [ ] **Step 1: Write the failing test**

Create `backend/src/test/java/com/zionex/t3composer/domain/client/LlmCliExceptionTest.java`:

```java
package com.zionex.t3composer.domain.client;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class LlmCliExceptionTest {

    @Test
    void preservesStatusAndMessage() {
        LlmCliException ex = new LlmCliException(503, "stderr tail");
        assertThat(ex.getStatusCode()).isEqualTo(503);
        assertThat(ex.getMessage()).isEqualTo("stderr tail");
    }

    @Test
    void fromStderrMapsLoginExpiredTo401() {
        LlmCliException ex = LlmCliException.fromStderr(1,
                "Error: Please run claude /login to authenticate.");
        assertThat(ex.getStatusCode()).isEqualTo(401);
        assertThat(ex.getMessage()).contains("구독 로그인");
    }

    @Test
    void fromStderrMapsRateLimitTo429() {
        LlmCliException ex = LlmCliException.fromStderr(1,
                "Error: You have hit the rate limit. Try again later.");
        assertThat(ex.getStatusCode()).isEqualTo(429);
        assertThat(ex.getMessage()).contains("구독 한도");
    }

    @Test
    void fromStderrMapsQuotaTo429() {
        LlmCliException ex = LlmCliException.fromStderr(1,
                "Error: Monthly quota exceeded for your plan.");
        assertThat(ex.getStatusCode()).isEqualTo(429);
        assertThat(ex.getMessage()).contains("구독 한도");
    }

    @Test
    void fromStderrDefaultsTo503WithStderrTail() {
        String stderr = "boom".repeat(100);  // 400 chars
        LlmCliException ex = LlmCliException.fromStderr(7, stderr);
        assertThat(ex.getStatusCode()).isEqualTo(503);
        // exit code + last 200 chars in message
        assertThat(ex.getMessage()).contains("exit=7");
        assertThat(ex.getMessage().length()).isLessThanOrEqualTo(250);
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
docker compose exec -T composer-backend mvn -B -q test -Dtest=LlmCliExceptionTest
```

Expected: FAIL with compile error.

- [ ] **Step 3: Create the exception class**

Create `backend/src/main/java/com/zionex/t3composer/domain/client/LlmCliException.java`:

```java
package com.zionex.t3composer.domain.client;

import lombok.Getter;

/**
 * CLI 백엔드 호출 실패. {@link #getStatusCode()} 가 컨트롤러 레이어에서
 * HTTP status code 로 변환된다 (예외 핸들러 매핑).
 *
 * <p>Fail-hard 정책: API fallback 없음. 사용자가 직접 호스트에서 조치
 * (claude /login 또는 5시간 window 대기) 해야 한다.
 */
@Getter
public class LlmCliException extends RuntimeException {

    private final int statusCode;

    public LlmCliException(int statusCode, String message) {
        super(message);
        this.statusCode = statusCode;
    }

    /**
     * subprocess exit code + stderr 텍스트로부터 적절한 HTTP status 자동 매핑.
     * <ul>
     *   <li>stderr 에 "login" 포함 → 401 (구독 로그인 필요)</li>
     *   <li>stderr 에 "rate limit" 또는 "quota" 포함 → 429 (구독 한도)</li>
     *   <li>그 외 exit != 0 → 503 + stderr 마지막 200자</li>
     * </ul>
     */
    public static LlmCliException fromStderr(int exitCode, String stderr) {
        String lower = stderr == null ? "" : stderr.toLowerCase();
        if (lower.contains("login")) {
            return new LlmCliException(401,
                    "구독 로그인 필요 — 호스트에서 `claude /login` 실행 후 backend 재기동");
        }
        if (lower.contains("rate limit") || lower.contains("quota")) {
            return new LlmCliException(429,
                    "구독 한도 도달 — 5시간 window 종료 또는 plan upgrade 대기");
        }
        String tail = stderr == null ? "" :
                stderr.substring(Math.max(0, stderr.length() - 200));
        return new LlmCliException(503,
                String.format("CLI 실패 (exit=%d): %s", exitCode, tail));
    }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
docker compose exec -T composer-backend mvn -B -q test -Dtest=LlmCliExceptionTest
```

Expected: PASS · `Tests run: 5, Failures: 0`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/client/LlmCliException.java \
        backend/src/test/java/com/zionex/t3composer/domain/client/LlmCliExceptionTest.java
git commit -m "$(cat <<'EOF'
feat(client): LlmCliException — stderr → HTTP status 매핑

login 만료 → 401, rate limit/quota → 429, 그 외 → 503 + stderr 마지막 200자.
컨트롤러 레이어가 statusCode 보고 그대로 응답. Fail-hard 정책 (API fallback 없음).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `LlmCliInvoker` interface + `LlmCliProcess` + `ProcessBuilderInvoker`

**Files:**
- Create: `backend/src/main/java/com/zionex/t3composer/domain/client/LlmCliInvoker.java`
- Create: `backend/src/main/java/com/zionex/t3composer/domain/client/LlmCliProcess.java`
- Create: `backend/src/main/java/com/zionex/t3composer/domain/client/ProcessBuilderInvoker.java`

> No test for this task — `ProcessBuilderInvoker` is a thin wrapper around `Process`. The interface enables mocking in Task 8.

- [ ] **Step 1: Create the `LlmCliProcess` wrapper**

Create `backend/src/main/java/com/zionex/t3composer/domain/client/LlmCliProcess.java`:

```java
package com.zionex.t3composer.domain.client;

import java.io.InputStream;
import java.io.OutputStream;
import java.util.concurrent.TimeUnit;

/**
 * subprocess 의 stdin/stdout/stderr + lifecycle 접근. 테스트 가능성을 위한
 * 추상화 — production 은 {@link ProcessBuilderInvoker} 가 {@link Process} 를
 * 감싸 반환, 테스트는 in-memory stream 으로 fake.
 */
public interface LlmCliProcess {

    OutputStream stdin();

    InputStream stdout();

    InputStream stderr();

    /** {@link Process#waitFor(long, TimeUnit)} 와 동일 시맨틱. */
    boolean waitFor(long timeout, TimeUnit unit) throws InterruptedException;

    int exitValue();

    boolean isAlive();

    void destroyForcibly();
}
```

- [ ] **Step 2: Create the `LlmCliInvoker` interface**

Create `backend/src/main/java/com/zionex/t3composer/domain/client/LlmCliInvoker.java`:

```java
package com.zionex.t3composer.domain.client;

import java.io.IOException;
import java.util.List;

/**
 * subprocess 시작을 추상화. 단위 테스트는 in-memory fake invoker 를 주입해
 * stdout 내용을 시뮬레이트.
 */
public interface LlmCliInvoker {

    LlmCliProcess start(List<String> command) throws IOException;
}
```

- [ ] **Step 3: Create `ProcessBuilderInvoker` (production impl)**

Create `backend/src/main/java/com/zionex/t3composer/domain/client/ProcessBuilderInvoker.java`:

```java
package com.zionex.t3composer.domain.client;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Production {@link LlmCliInvoker} — {@link ProcessBuilder} 로 실제 subprocess 시작.
 * CLI 모드 ({@code llm.backend=cli}) 일 때만 빈으로 등록.
 */
@Component
@ConditionalOnProperty(name = "llm.backend", havingValue = "cli")
public class ProcessBuilderInvoker implements LlmCliInvoker {

    @Override
    public LlmCliProcess start(List<String> command) throws IOException {
        Process p = new ProcessBuilder(command)
                .redirectErrorStream(false)
                .start();
        return new ProcessAdapter(p);
    }

    private static final class ProcessAdapter implements LlmCliProcess {
        private final Process p;

        ProcessAdapter(Process p) { this.p = p; }

        @Override public OutputStream stdin()  { return p.getOutputStream(); }
        @Override public InputStream  stdout() { return p.getInputStream();  }
        @Override public InputStream  stderr() { return p.getErrorStream();  }

        @Override
        public boolean waitFor(long timeout, TimeUnit unit) throws InterruptedException {
            return p.waitFor(timeout, unit);
        }

        @Override public int     exitValue()       { return p.exitValue(); }
        @Override public boolean isAlive()         { return p.isAlive();   }
        @Override public void    destroyForcibly() { p.destroyForcibly();  }
    }
}
```

- [ ] **Step 4: Verify it compiles**

```bash
docker compose exec -T composer-backend mvn -B -q compile
```

Expected: BUILD SUCCESS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/client/LlmCliInvoker.java \
        backend/src/main/java/com/zionex/t3composer/domain/client/LlmCliProcess.java \
        backend/src/main/java/com/zionex/t3composer/domain/client/ProcessBuilderInvoker.java
git commit -m "$(cat <<'EOF'
feat(client): LlmCliInvoker / LlmCliProcess / ProcessBuilderInvoker

subprocess 시작을 인터페이스로 분리해 단위 테스트에서 mock 가능하게 함.
ProcessBuilderInvoker 는 CLI 모드일 때만 빈으로 등록 (@ConditionalOnProperty).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: `SseEventTranslator` (CLI stream-json → Anthropic SSE)

**Files:**
- Create: `backend/src/main/java/com/zionex/t3composer/domain/client/SseEventTranslator.java`
- Create: `backend/src/test/java/com/zionex/t3composer/domain/client/SseEventTranslatorTest.java`

This is the core translation logic. State machine: `null → started → in_block → ended`. The translator is a stateful object (one per stream). Each `translate(line)` returns 0..N SSE events to emit.

- [ ] **Step 1: Write the failing test**

Create `backend/src/test/java/com/zionex/t3composer/domain/client/SseEventTranslatorTest.java`:

```java
package com.zionex.t3composer.domain.client;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.http.codec.ServerSentEvent;

class SseEventTranslatorTest {

    private final SseEventTranslator t = new SseEventTranslator();

    @Test
    void systemInitProducesMessageStart() {
        List<ServerSentEvent<String>> events = t.translate(
                "{\"type\":\"system\",\"subtype\":\"init\",\"session_id\":\"s1\",\"model\":\"claude-sonnet-4-6\"}");
        assertThat(events).hasSize(1);
        assertThat(events.get(0).event()).isEqualTo("message_start");
        assertThat(events.get(0).data()).contains("\"type\":\"message_start\"");
        assertThat(events.get(0).data()).contains("\"model\":\"claude-sonnet-4-6\"");
    }

    @Test
    void firstAssistantChunkProducesBlockStartAndDelta() {
        t.translate("{\"type\":\"system\",\"subtype\":\"init\",\"model\":\"x\"}");
        List<ServerSentEvent<String>> events = t.translate(
                "{\"type\":\"assistant\",\"message\":{\"content\":[{\"type\":\"text\",\"text\":\"hello\"}]}}");

        assertThat(events).hasSize(2);
        assertThat(events.get(0).event()).isEqualTo("content_block_start");
        assertThat(events.get(0).data()).contains("\"index\":0");
        assertThat(events.get(1).event()).isEqualTo("content_block_delta");
        assertThat(events.get(1).data()).contains("\"text\":\"hello\"");
    }

    @Test
    void subsequentAssistantChunkProducesOnlyDelta() {
        t.translate("{\"type\":\"system\",\"subtype\":\"init\",\"model\":\"x\"}");
        t.translate("{\"type\":\"assistant\",\"message\":{\"content\":[{\"type\":\"text\",\"text\":\"hello\"}]}}");

        List<ServerSentEvent<String>> events = t.translate(
                "{\"type\":\"assistant\",\"message\":{\"content\":[{\"type\":\"text\",\"text\":\" world\"}]}}");

        assertThat(events).hasSize(1);
        assertThat(events.get(0).event()).isEqualTo("content_block_delta");
        assertThat(events.get(0).data()).contains("\"text\":\" world\"");
    }

    @Test
    void resultSuccessProducesBlockStopMessageDeltaAndMessageStop() {
        t.translate("{\"type\":\"system\",\"subtype\":\"init\",\"model\":\"x\"}");
        t.translate("{\"type\":\"assistant\",\"message\":{\"content\":[{\"type\":\"text\",\"text\":\"hi\"}]}}");

        List<ServerSentEvent<String>> events = t.translate(
                "{\"type\":\"result\",\"subtype\":\"success\","
                + "\"usage\":{\"input_tokens\":10,\"output_tokens\":3}}");

        assertThat(events).hasSize(3);
        assertThat(events.get(0).event()).isEqualTo("content_block_stop");
        assertThat(events.get(1).event()).isEqualTo("message_delta");
        assertThat(events.get(1).data()).contains("\"output_tokens\":3");
        assertThat(events.get(2).event()).isEqualTo("message_stop");
    }

    @Test
    void resultErrorThrowsLlmCliException() {
        t.translate("{\"type\":\"system\",\"subtype\":\"init\",\"model\":\"x\"}");

        org.junit.jupiter.api.Assertions.assertThrows(LlmCliException.class, () ->
                t.translate(
                    "{\"type\":\"result\",\"subtype\":\"error_during_execution\",\"error\":\"boom\"}"));
    }

    @Test
    void unknownLineProducesNoEvents() {
        List<ServerSentEvent<String>> events = t.translate(
                "{\"type\":\"something_unexpected\"}");
        assertThat(events).isEmpty();
    }

    @Test
    void blankLineProducesNoEvents() {
        assertThat(t.translate("")).isEmpty();
        assertThat(t.translate("   ")).isEmpty();
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
docker compose exec -T composer-backend mvn -B -q test -Dtest=SseEventTranslatorTest
```

Expected: FAIL with compile error.

- [ ] **Step 3: Create the translator**

Create `backend/src/main/java/com/zionex/t3composer/domain/client/SseEventTranslator.java`:

```java
package com.zionex.t3composer.domain.client;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.http.codec.ServerSentEvent;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

/**
 * 한 스트림에 하나의 인스턴스. CLI {@code --output-format stream-json} 의
 * line-delimited JSON 이벤트를 Anthropic SSE 이벤트 시퀀스로 변환.
 *
 * <p>상태:
 * <ul>
 *   <li>{@code messageId} — {@code system.init} 시 생성, 모든 후속 이벤트에 동일</li>
 *   <li>{@code model} — {@code system.init.model} 추출</li>
 *   <li>{@code blockStarted} — 첫 assistant 청크에서 {@code content_block_start} 발화 여부</li>
 *   <li>{@code blockClosed} — {@code result} 처리 시 한 번만 {@code content_block_stop} 발화</li>
 * </ul>
 */
@Slf4j
public class SseEventTranslator {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private String  messageId;
    private String  model;
    private boolean blockStarted;
    private boolean blockClosed;

    public List<ServerSentEvent<String>> translate(String line) {
        if (line == null || line.isBlank()) return List.of();

        JsonNode node;
        try {
            node = MAPPER.readTree(line);
        } catch (Exception e) {
            log.warn("CLI stream-json parse failed: {}", line, e);
            return List.of();
        }

        String type    = textOrEmpty(node, "type");
        String subtype = textOrEmpty(node, "subtype");

        switch (type) {
            case "system":
                if ("init".equals(subtype)) return handleSystemInit(node);
                return List.of();
            case "assistant":
                return handleAssistant(node);
            case "result":
                return handleResult(node, subtype);
            default:
                return List.of();
        }
    }

    private List<ServerSentEvent<String>> handleSystemInit(JsonNode node) {
        this.messageId = "msg_" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        this.model     = textOrEmpty(node, "model");

        String data = String.format(
                "{\"type\":\"message_start\",\"message\":{"
                + "\"id\":\"%s\",\"type\":\"message\",\"role\":\"assistant\","
                + "\"model\":\"%s\",\"content\":[],\"stop_reason\":null,"
                + "\"stop_sequence\":null,\"usage\":{\"input_tokens\":0,\"output_tokens\":0}}}",
                messageId, model);
        return List.of(sse("message_start", data));
    }

    private List<ServerSentEvent<String>> handleAssistant(JsonNode node) {
        JsonNode content = node.path("message").path("content");
        if (!content.isArray() || content.size() == 0) return List.of();
        JsonNode first = content.get(0);
        if (!"text".equals(textOrEmpty(first, "type"))) return List.of();

        String text = textOrEmpty(first, "text");
        if (text.isEmpty()) return List.of();

        List<ServerSentEvent<String>> out = new ArrayList<>(2);
        if (!blockStarted) {
            blockStarted = true;
            out.add(sse("content_block_start",
                    "{\"type\":\"content_block_start\",\"index\":0,"
                    + "\"content_block\":{\"type\":\"text\",\"text\":\"\"}}"));
        }
        out.add(sse("content_block_delta",
                String.format(
                    "{\"type\":\"content_block_delta\",\"index\":0,"
                    + "\"delta\":{\"type\":\"text_delta\",\"text\":%s}}",
                    MAPPER.valueToTree(text))));
        return out;
    }

    private List<ServerSentEvent<String>> handleResult(JsonNode node, String subtype) {
        if (subtype != null && subtype.startsWith("error")) {
            String msg = node.has("error")
                    ? node.get("error").asText()
                    : ("CLI result subtype=" + subtype);
            throw new LlmCliException(503, "CLI stream error: " + msg);
        }

        List<ServerSentEvent<String>> out = new ArrayList<>(3);
        if (blockStarted && !blockClosed) {
            blockClosed = true;
            out.add(sse("content_block_stop",
                    "{\"type\":\"content_block_stop\",\"index\":0}"));
        }
        JsonNode usage = node.path("usage");
        int in  = usage.path("input_tokens").asInt(0);
        int outTok = usage.path("output_tokens").asInt(0);
        out.add(sse("message_delta", String.format(
                "{\"type\":\"message_delta\","
                + "\"delta\":{\"stop_reason\":\"end_turn\",\"stop_sequence\":null},"
                + "\"usage\":{\"input_tokens\":%d,\"output_tokens\":%d}}",
                in, outTok)));
        out.add(sse("message_stop", "{\"type\":\"message_stop\"}"));
        return out;
    }

    private static String textOrEmpty(JsonNode n, String field) {
        JsonNode v = n.path(field);
        return v.isMissingNode() || v.isNull() ? "" : v.asText("");
    }

    private static ServerSentEvent<String> sse(String event, String data) {
        return ServerSentEvent.<String>builder()
                .event(event)
                .data(data)
                .build();
    }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
docker compose exec -T composer-backend mvn -B -q test -Dtest=SseEventTranslatorTest
```

Expected: PASS · `Tests run: 7, Failures: 0`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/client/SseEventTranslator.java \
        backend/src/test/java/com/zionex/t3composer/domain/client/SseEventTranslatorTest.java
git commit -m "$(cat <<'EOF'
feat(client): SseEventTranslator — CLI stream-json → Anthropic SSE 변환

stateful per-stream 인스턴스. system.init → message_start, assistant text →
content_block_start + delta, result.success → block_stop + message_delta +
message_stop, result.error* → LlmCliException throw.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: `CliLlmClient.streamMessages` (with mock invoker test)

**Files:**
- Create: `backend/src/main/java/com/zionex/t3composer/domain/client/CliLlmClient.java`
- Create: `backend/src/test/java/com/zionex/t3composer/domain/client/CliLlmClientTest.java`

- [ ] **Step 1: Write the failing test**

Create `backend/src/test/java/com/zionex/t3composer/domain/client/CliLlmClientTest.java`:

```java
package com.zionex.t3composer.domain.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
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
        // CLI 모드에서 apiKey 파라미터를 받아도 stdin/argv 에 전달하지 않음을 확인.
        // FakeInvoker.lastCommand 에 api key 가 포함되지 않으면 OK.
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
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
docker compose exec -T composer-backend mvn -B -q test -Dtest=CliLlmClientTest
```

Expected: FAIL with compile error.

- [ ] **Step 3: Create the `CliLlmClient`**

Create `backend/src/main/java/com/zionex/t3composer/domain/client/CliLlmClient.java`:

```java
package com.zionex.t3composer.domain.client;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
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
        this.concurrencyGate = concurrencyGate;  // 테스트에서 null 가능 (Step 4 에서 init)
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
            // 시스템 프롬프트는 별도 envelope. messages 는 각각 line.
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
```

- [ ] **Step 4: Add the `MessagesResponseAssembler` helper class**

Create as inner class or sibling. For now, append to `CliLlmClient.java` as a package-private class (same file or new file). Create `backend/src/main/java/com/zionex/t3composer/domain/client/MessagesResponseAssembler.java`:

```java
package com.zionex.t3composer.domain.client;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;

/**
 * Streaming SSE 이벤트들을 단일 {@link MessagesResponse} 로 누적.
 * non-streaming 호출 ({@link CliLlmClient#sendMessages}) 경로에서 사용.
 */
class MessagesResponseAssembler {

    private static final Pattern TEXT_DELTA = Pattern.compile("\"text\":\"([^\"]*)\"");
    private static final Pattern INPUT_TOK  = Pattern.compile("\"input_tokens\":(\\d+)");
    private static final Pattern OUTPUT_TOK = Pattern.compile("\"output_tokens\":(\\d+)");
    private static final Pattern ID         = Pattern.compile("\"id\":\"([^\"]+)\"");
    private static final Pattern MODEL      = Pattern.compile("\"model\":\"([^\"]+)\"");

    private final StringBuilder text = new StringBuilder();
    private String id;
    private String model;
    private int    inputTokens;
    private int    outputTokens;

    MessagesResponseAssembler feed(String event, String data) {
        if (data == null) return this;
        switch (event == null ? "" : event) {
            case "message_start":
                id    = firstGroup(ID,    data);
                model = firstGroup(MODEL, data);
                break;
            case "content_block_delta": {
                String chunk = firstGroup(TEXT_DELTA, data);
                if (chunk != null) text.append(chunk);
                break;
            }
            case "message_delta": {
                String in  = firstGroup(INPUT_TOK,  data);
                String out = firstGroup(OUTPUT_TOK, data);
                if (in  != null) inputTokens  = Integer.parseInt(in);
                if (out != null) outputTokens = Integer.parseInt(out);
                break;
            }
            default:
                break;
        }
        return this;
    }

    MessagesResponse build() {
        MessagesResponse r = new MessagesResponse();
        r.setId(id);
        r.setModel(model);
        r.setStopReason("end_turn");
        AnthropicModels.Usage u = new AnthropicModels.Usage();
        u.setInputTokens(inputTokens);
        u.setOutputTokens(outputTokens);
        r.setUsage(u);
        AnthropicModels.ContentBlock cb = new AnthropicModels.ContentBlock();
        cb.setType("text");
        cb.setText(text.toString());
        r.setContent(java.util.List.of(cb));
        return r;
    }

    private static String firstGroup(Pattern p, String data) {
        Matcher m = p.matcher(data);
        return m.find() ? m.group(1) : null;
    }
}
```

> **Note**: `AnthropicModels.Usage` / `ContentBlock` field names — verify against the existing `AnthropicModels.java`. If field names differ (e.g., `input_tokens` snake_case JSON property but Java getter is `getInputTokens()`), adjust setter calls. Run a quick check:
>
> ```bash
> grep -A2 "class Usage\|class ContentBlock" /Users/hej/work/projects/t3-composer/backend/src/main/java/com/zionex/t3composer/domain/client/AnthropicModels.java
> ```
>
> If field setters differ, adjust the `build()` method accordingly before continuing.

- [ ] **Step 5: Run the test to verify it passes**

```bash
docker compose exec -T composer-backend mvn -B -q test -Dtest='CliLlmClientTest,SseEventTranslatorTest'
```

Expected: PASS · all 10 tests green.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/client/CliLlmClient.java \
        backend/src/main/java/com/zionex/t3composer/domain/client/MessagesResponseAssembler.java \
        backend/src/test/java/com/zionex/t3composer/domain/client/CliLlmClientTest.java
git commit -m "$(cat <<'EOF'
feat(client): CliLlmClient — claude subprocess 백엔드

ProcessBuilder 로 claude --input-format stream-json --output-format stream-json
실행. stdin 으로 MessagesRequest 직렬화 전송, stdout 라인 단위로
SseEventTranslator 가 Anthropic SSE 변환. semaphore 로 동시 호출 상한 보호.

apiKey 파라미터는 명시적으로 무시 (CLI 는 ~/.claude OAuth 사용).
sendMessages 는 streamMessages 를 MessagesResponseAssembler 로 누적.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Bean wiring contract test

**Files:**
- Create: `backend/src/test/java/com/zionex/t3composer/domain/client/LlmBackendBeanWiringTest.java`

Verifies that `@ConditionalOnProperty` correctly selects mutually exclusive impl.

- [ ] **Step 1: Write the test**

Create `backend/src/test/java/com/zionex/t3composer/domain/client/LlmBackendBeanWiringTest.java`:

```java
package com.zionex.t3composer.domain.client;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.ObjectMapper;

class LlmBackendBeanWiringTest {

    @Configuration
    static class TestConfig {
        @Bean WebClient.Builder webClientBuilder() { return WebClient.builder(); }
        @Bean ObjectMapper objectMapper()          { return new ObjectMapper(); }
    }

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of())
            .withUserConfiguration(TestConfig.class)
            .withBean("processBuilderInvoker", ProcessBuilderInvoker.class)
            .withBean("apiLlmClient",          ApiLlmClient.class)
            .withBean("cliLlmClient",          CliLlmClient.class);
    // 실제 conditional 은 classpath scanning 으로 동작하니, 아래 with(Property*) 만 신뢰 가능

    @Test
    void defaultsToApiBackend() {
        new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of())
                .withUserConfiguration(TestConfig.class, LlmBackendImportConfig.class)
                .run(ctx -> {
                    assertThat(ctx).hasSingleBean(LlmClient.class);
                    assertThat(ctx.getBean(LlmClient.class)).isInstanceOf(ApiLlmClient.class);
                });
    }

    @Test
    void cliBackendActivatesCliLlmClient() {
        new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of())
                .withUserConfiguration(TestConfig.class, LlmBackendImportConfig.class)
                .withPropertyValues("llm.backend=cli")
                .run(ctx -> {
                    assertThat(ctx).hasSingleBean(LlmClient.class);
                    assertThat(ctx.getBean(LlmClient.class)).isInstanceOf(CliLlmClient.class);
                });
    }

    @Test
    void apiBackendExplicitActivatesApiLlmClient() {
        new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of())
                .withUserConfiguration(TestConfig.class, LlmBackendImportConfig.class)
                .withPropertyValues("llm.backend=api")
                .run(ctx -> {
                    assertThat(ctx).hasSingleBean(LlmClient.class);
                    assertThat(ctx.getBean(LlmClient.class)).isInstanceOf(ApiLlmClient.class);
                });
    }

    @Configuration
    @org.springframework.context.annotation.Import({
            ApiLlmClient.class,
            CliLlmClient.class,
            ProcessBuilderInvoker.class
    })
    @org.springframework.boot.context.properties.EnableConfigurationProperties(LlmCliProperties.class)
    static class LlmBackendImportConfig {}
}
```

- [ ] **Step 2: Run the test**

```bash
docker compose exec -T composer-backend mvn -B -q test -Dtest=LlmBackendBeanWiringTest
```

Expected: PASS · `Tests run: 3, Failures: 0`. The default (no `llm.backend` property) loads `ApiLlmClient`, `llm.backend=cli` loads `CliLlmClient`, `llm.backend=api` loads `ApiLlmClient`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/test/java/com/zionex/t3composer/domain/client/LlmBackendBeanWiringTest.java
git commit -m "$(cat <<'EOF'
test(client): @ConditionalOnProperty 백엔드 빈 선택 검증

llm.backend 미설정 → ApiLlmClient, cli → CliLlmClient, api → ApiLlmClient.
두 빈 동시 활성 불가 보증.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — Docker + Startup Health Check

> **Goal**: Container can install + run `claude` CLI. Backend startup fails fast if `LLM_BACKEND=cli` and the binary is missing.

---

### Task 10: Dockerfile — install Node.js + claude CLI

**Files:**
- Modify: `docker/backend/Dockerfile`

- [ ] **Step 1: Edit Dockerfile to add Node + CLI install**

Find the existing `RUN apt-get update ...` block (around line 11). After the `&& rm -rf /var/lib/apt/lists/*` line, insert a new `RUN` block before `COPY backend/pom.xml`:

```dockerfile
# Node.js 18 + @anthropic-ai/claude-code CLI (LLM_BACKEND=cli 모드용)
# host 의 ~/.claude 가 /root/.claude 로 마운트되어 dev 본인 로그인 재사용.
# API 모드 (LLM_BACKEND=api 또는 미설정) 에서도 설치만 하고 사용 안 함 — 토글 즉시 전환 가능.
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && npm install -g @anthropic-ai/claude-code \
 && claude --version \
 && rm -rf /var/lib/apt/lists/*
```

The `claude --version` at the end is intentional — if CLI install fails, the docker build fails immediately rather than at runtime.

Also add `curl` to the existing `apt-get install` line (currently has `maven wget fontconfig fonts-noto-core fonts-noto-cjk`). Final apt-get line should be:
```dockerfile
    && apt-get install -y --no-install-recommends \
         maven wget curl \
         fontconfig fonts-noto-core fonts-noto-cjk \
```

- [ ] **Step 2: Rebuild the image**

```bash
docker compose build composer-backend
```

Expected: successful build. Last RUN block should print `claude --version` output (e.g., `1.x.x (Claude Code)`).

- [ ] **Step 3: Verify `claude` inside the container**

```bash
docker compose run --rm composer-backend claude --version
```

Expected: prints CLI version.

- [ ] **Step 4: Commit**

```bash
git add docker/backend/Dockerfile
git commit -m "$(cat <<'EOF'
build(docker): backend 컨테이너에 Node.js + claude CLI 설치

LLM_BACKEND=cli 모드를 위해 @anthropic-ai/claude-code 글로벌 설치.
API 모드일 때는 설치만 되어있고 사용 안 함 — 토글로 즉시 전환 가능.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: entrypoint.sh — readiness diagnostic

**Files:**
- Create: `docker/backend/entrypoint.sh`
- Modify: `docker/backend/Dockerfile` (ENTRYPOINT switch)

- [ ] **Step 1: Create the entrypoint script**

Create `docker/backend/entrypoint.sh`:

```sh
#!/bin/sh
set -e

if [ "${LLM_BACKEND}" = "cli" ]; then
  if claude --version > /dev/null 2>&1; then
    echo "[entrypoint] claude CLI ready ($(claude --version 2>&1 | head -1))"
    if [ ! -d /root/.claude ] || [ -z "$(ls -A /root/.claude 2>/dev/null)" ]; then
      echo "[entrypoint] WARN: /root/.claude 비어있음 — 호스트에서 'claude /login' 실행 후 재기동 필요"
    else
      echo "[entrypoint] /root/.claude 마운트 확인 (호스트 ~/.claude 재사용 중)"
    fi
  else
    echo "[entrypoint] ERROR: claude CLI 를 찾을 수 없음 (LLM_BACKEND=cli)"
    exit 1
  fi
else
  echo "[entrypoint] LLM_BACKEND=${LLM_BACKEND:-api} (default api)"
fi

exec mvn -B -DskipTests spring-boot:run -Dspring-boot.run.jvmArguments="${JAVA_OPTS}"
```

- [ ] **Step 2: Update Dockerfile to use the new entrypoint**

Replace the existing `ENTRYPOINT` line:
```dockerfile
ENTRYPOINT ["sh", "-c", "mvn -B -DskipTests spring-boot:run -Dspring-boot.run.jvmArguments=\"$JAVA_OPTS\""]
```
With:
```dockerfile
COPY docker/backend/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
```

- [ ] **Step 3: Make the script executable on host**

```bash
chmod +x /Users/hej/work/projects/t3-composer/docker/backend/entrypoint.sh
```

- [ ] **Step 4: Rebuild and verify entrypoint message**

```bash
docker compose build composer-backend
docker compose up -d --force-recreate composer-backend
docker compose logs --tail=20 composer-backend | grep entrypoint
```

Expected (with current `LLM_BACKEND` unset or `api`): `[entrypoint] LLM_BACKEND=api (default api)`.

- [ ] **Step 5: Commit**

```bash
git add docker/backend/entrypoint.sh docker/backend/Dockerfile
git commit -m "$(cat <<'EOF'
build(docker): entrypoint.sh — CLI readiness 진단 + 로그인 마운트 검증

LLM_BACKEND=cli 시 'claude --version' 확인하고 /root/.claude 마운트 여부 안내.
실패 시 즉시 exit 1 (fail-fast).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: docker-compose.yml — volume + env vars

**Files:**
- Modify: `docker-compose.yml`
- Modify: `.env.example`

- [ ] **Step 1: Add volume mount and env vars to `composer-backend` service**

Find the `composer-backend` service in `docker-compose.yml`. Add to `volumes:` block (after existing entries):
```yaml
      - ${HOME}/.claude:/root/.claude:rw
```

Add to `environment:` block (or create one if absent):
```yaml
      - LLM_BACKEND=${LLM_BACKEND:-api}
      - LLM_CLI_BINARY=${LLM_CLI_BINARY:-/usr/local/bin/claude}
      - LLM_CLI_TIMEOUT_MIN=${LLM_CLI_TIMEOUT_MIN:-40}
      - LLM_CLI_MAX_CONCURRENT=${LLM_CLI_MAX_CONCURRENT:-4}
```

- [ ] **Step 2: Add `.env.example` entries**

Append to `/Users/hej/work/projects/t3-composer/.env.example` (after the `ANTHROPIC_API_KEY` line):

```bash

# === LLM Backend 선택 (2026-06-02 추가) ===
# api  (기본): Anthropic HTTP API 사용 — ANTHROPIC_API_KEY 필요
# cli         : 호스트 ~/.claude 로그인 + 컨테이너 안 claude CLI subprocess 사용
#               (구독 정액제로 비용 절감. 호스트에서 미리 'claude /login' 필요)
# 변경 후 'docker compose up -d --force-recreate composer-backend' 재기동.
LLM_BACKEND=api

# CLI 모드 전용 (LLM_BACKEND=cli 일 때만 의미 있음)
LLM_CLI_BINARY=/usr/local/bin/claude
LLM_CLI_TIMEOUT_MIN=40
LLM_CLI_MAX_CONCURRENT=4
```

- [ ] **Step 3: Verify env propagation**

```bash
docker compose up -d --force-recreate composer-backend
docker compose exec -T composer-backend env | grep LLM_
```

Expected: 4 lines (`LLM_BACKEND=api`, etc.). If not present, check `.env` in repo root has been updated or set the values inline.

- [ ] **Step 4: Verify volume mount**

```bash
docker compose exec -T composer-backend ls -la /root/.claude/ 2>&1 | head -5
```

Expected: lists files from host `~/.claude/` (or warns if empty). The mount works regardless of `LLM_BACKEND` value.

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml .env.example
git commit -m "$(cat <<'EOF'
build(docker-compose): LLM 백엔드 토글 환경변수 + ~/.claude 볼륨

composer-backend 에 LLM_BACKEND / LLM_CLI_* 4개 환경변수 + 호스트
~/.claude:/root/.claude:rw 마운트 추가. 기본 LLM_BACKEND=api 라
미설정 시 기존 동작 그대로.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Application config + `LlmBackendHealthCheck`

**Files:**
- Modify: `backend/src/main/resources/application.yaml`
- Modify: `backend/src/main/resources/application-dev.yaml`
- Create: `backend/src/main/java/com/zionex/t3composer/config/LlmBackendHealthCheck.java`

- [ ] **Step 1: Add `llm.*` to `application.yaml`**

Append to `backend/src/main/resources/application.yaml`:

```yaml

llm:
  backend: ${LLM_BACKEND:api}
  cli:
    binary: ${LLM_CLI_BINARY:/usr/local/bin/claude}
    timeout-minutes: ${LLM_CLI_TIMEOUT_MIN:40}
    max-concurrent: ${LLM_CLI_MAX_CONCURRENT:4}
```

- [ ] **Step 2: Confirm `application-dev.yaml` inherits**

Open `backend/src/main/resources/application-dev.yaml`. If `llm:` section is already inherited from `application.yaml`, no change needed. Otherwise add the same block.

- [ ] **Step 3: Create the health check**

Create `backend/src/main/java/com/zionex/t3composer/config/LlmBackendHealthCheck.java`:

```java
package com.zionex.t3composer.config;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Startup 시점에 LLM 백엔드 설정을 검증.
 * <ul>
 *   <li>{@code llm.backend=api}: 검증 없음 (호출 시점에 ANTHROPIC_API_KEY 확인)</li>
 *   <li>{@code llm.backend=cli}: claude 바이너리 존재 + 실행 권한 확인.
 *       없으면 RuntimeException 으로 backend startup 실패 (fail-fast).</li>
 * </ul>
 */
@Slf4j
@Component
public class LlmBackendHealthCheck {

    @Value("${llm.backend:api}")
    private String backend;

    @Value("${llm.cli.binary:/usr/local/bin/claude}")
    private String cliBinary;

    @EventListener(ApplicationReadyEvent.class)
    public void check() {
        if (!"cli".equalsIgnoreCase(backend)) {
            log.info("LLM backend = api (HTTP API mode)");
            return;
        }

        Path bin = Paths.get(cliBinary);
        if (!Files.isExecutable(bin)) {
            throw new IllegalStateException(
                    "LLM_BACKEND=cli 인데 claude 바이너리를 찾을 수 없거나 실행 불가: " + cliBinary
                    + ". Dockerfile 의 npm install -g @anthropic-ai/claude-code 확인.");
        }

        Path home = Paths.get("/root/.claude");
        if (!Files.isDirectory(home)) {
            log.warn("LLM backend = cli; /root/.claude 디렉토리 없음 — 호스트 ~/.claude 마운트 확인");
        } else {
            log.info("LLM backend = cli (binary={}, ~/.claude mounted)", cliBinary);
        }
    }
}
```

- [ ] **Step 4: Restart backend and verify startup log**

```bash
docker compose exec -T composer-backend sh -c 'echo "$(date +%s)" > /app/target/classes/.devtools-restart-trigger'
sleep 5
docker compose logs --tail=30 composer-backend | grep -E "LLM backend|LlmBackendHealthCheck"
```

Expected (current `LLM_BACKEND=api`): `LLM backend = api (HTTP API mode)`.

- [ ] **Step 5: Temporarily verify CLI mode fail-fast**

```bash
docker compose exec -T -e LLM_BACKEND=cli -e LLM_CLI_BINARY=/nonexistent composer-backend \
  sh -c 'curl -s http://localhost:8090/actuator/health || echo "down"'
```

Note: the env vars in `exec` don't affect the running JVM. To properly verify, set `LLM_BACKEND=cli` + `LLM_CLI_BINARY=/nonexistent` in `.env`, then `docker compose up -d --force-recreate composer-backend`, then `docker compose logs composer-backend | tail -30` — expected: `IllegalStateException` + container restart loop. **Revert `.env` after verifying**.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/resources/application.yaml \
        backend/src/main/resources/application-dev.yaml \
        backend/src/main/java/com/zionex/t3composer/config/LlmBackendHealthCheck.java
git commit -m "$(cat <<'EOF'
feat(config): LlmBackendHealthCheck — CLI 모드 startup fail-fast

llm.backend=cli 시 claude 바이너리 존재/실행권한 검증. 실패 시
backend startup 실패 (IllegalStateException). API 모드는 기존대로
호출 시점에 API key 검증.

application.yaml 에 llm.* placeholder 추가 (.env 의 LLM_* 으로 override).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — Integration Test, Manual Verification, Docs

> **Goal**: Real subprocess smoke test, manual verification checklist, CLAUDE.md update.

---

### Task 14: Integration test (env-gated, optional)

**Files:**
- Create: `backend/src/test/java/com/zionex/t3composer/domain/client/LlmCliIntegrationTest.java`

- [ ] **Step 1: Create the integration test**

Create `backend/src/test/java/com/zionex/t3composer/domain/client/LlmCliIntegrationTest.java`:

```java
package com.zionex.t3composer.domain.client;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesRequest;

/**
 * Real subprocess smoke test. CI 에서는 항상 skip.
 * 로컬에서 수동 실행:
 *   docker compose exec -T composer-backend env LLM_CLI_INTEGRATION_TEST=true \
 *       mvn -B -q test -Dtest=LlmCliIntegrationTest
 * 사전 조건: 호스트 ~/.claude 에 claude /login 완료 + 컨테이너에 마운트.
 */
@EnabledIfEnvironmentVariable(named = "LLM_CLI_INTEGRATION_TEST", matches = "true")
class LlmCliIntegrationTest {

    @Test
    void realCliVersionResponds() throws Exception {
        ProcessBuilder pb = new ProcessBuilder("/usr/local/bin/claude", "--version");
        Process p = pb.start();
        int exit = p.waitFor();
        assertThat(exit).isEqualTo(0);
    }

    @Test
    void realCliRoundtripReturnsAssistantText() {
        ProcessBuilderInvoker invoker = new ProcessBuilderInvoker();
        LlmCliProperties props = new LlmCliProperties();  // defaults
        CliLlmClient client = new CliLlmClient(invoker, new ObjectMapper(), props, null);

        MessagesRequest req = new MessagesRequest();
        req.setModel("claude-sonnet-4-6");
        // Minimal "hello" message — adjust to match MessagesRequest schema
        // (실제 MessagesRequest 의 setSystem / setMessages 시그니처 확인 필요)

        // 응답 받기 (최대 60초)
        var resp = client.sendMessages("ignored", req).block(java.time.Duration.ofSeconds(60));

        assertThat(resp).isNotNull();
        assertThat(resp.getContent()).isNotEmpty();
    }
}
```

> **Note**: The second test requires populating `MessagesRequest` with a valid hello message. Inspect `AnthropicModels.java` to see the exact `messages` structure expected. If the schema is complex, skip the second test and rely on manual verification (Task 15).

- [ ] **Step 2: Skip the test by default (verify it's gated)**

```bash
docker compose exec -T composer-backend mvn -B -q test -Dtest=LlmCliIntegrationTest
```

Expected: `Tests run: 0` or `Tests run: 2, Skipped: 2` (env var not set).

- [ ] **Step 3: (Optional) Run with env var set, if host has CLI logged in**

```bash
docker compose exec -T -e LLM_CLI_INTEGRATION_TEST=true composer-backend \
  mvn -B -q test -Dtest=LlmCliIntegrationTest
```

Expected: PASS if `~/.claude` on host is logged in. If skipped or failed, that's OK — manual verification (Task 15) covers it.

- [ ] **Step 4: Commit**

```bash
git add backend/src/test/java/com/zionex/t3composer/domain/client/LlmCliIntegrationTest.java
git commit -m "$(cat <<'EOF'
test(client): LlmCliIntegrationTest — env-gated 실 subprocess 스모크

LLM_CLI_INTEGRATION_TEST=true 일 때만 실행. CI 는 자동 skip. 로컬에서
claude /login 완료 후 수동 실행 가능.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 15: Manual verification checklist

This task does NOT involve writing code — it's a checklist to run against a real backend with `LLM_BACKEND=cli`. Document results inline (uncheck → check as you verify).

**Pre-conditions:**
- Host `~/.claude/` is logged in (`claude /login` succeeded)
- Backend rebuilt with Task 10's Dockerfile changes
- `docker compose up -d --force-recreate composer-backend` performed

- [ ] **Test 1: API mode still works (no regression)**

  Set `.env`: `LLM_BACKEND=api` (or leave unset). Recreate. Open ComposerWorkspace, create a screen via natural language. Verify it succeeds end-to-end.

- [ ] **Test 2: CLI mode boots without error**

  Set `.env`: `LLM_BACKEND=cli`. `docker compose up -d --force-recreate composer-backend`.
  ```bash
  docker compose logs --tail=30 composer-backend | grep -E "LLM backend|Started|ERROR"
  ```
  Expected: `LLM backend = cli (binary=...)` + `Started T3ComposerApplication` + no errors.

- [ ] **Test 3: Streaming chat works end-to-end (CLI mode)**

  Open ComposerWorkspace. Start a new natural-language screen creation. Verify glasses-by-glasses typing in ChatPanel (streaming UX preserved).

- [ ] **Test 4: Multimodal attachment**

  Use NEW_GENERAL mode with an image mockup attached. Verify the LLM understands the image (no "I cannot see an image" response).

- [ ] **Test 5: Login expired returns 401 with helpful message**

  On the host: `claude /logout`. Trigger a request from ComposerWorkspace. Expected: 401 response with message containing "구독 로그인 필요". Re-login on host (`claude /login`) to restore.

- [ ] **Test 6: Concurrency cap (semaphore)**

  Set `.env`: `LLM_CLI_MAX_CONCURRENT=1`. Restart backend. Open two browser tabs, trigger requests simultaneously. Expected: second request returns 429 with "동시 요청 한도 초과".

- [ ] **Test 7: Token refresh persists to host**

  After several CLI calls, check timestamp of `~/.claude/.credentials.json` on host. Expected: updated recently (write-through works).

- [ ] **Step 8: Document results in PR description**

  After running through all 7 checks, paste the checklist (with completed marks) into the PR description for Phase 4. No commit needed for this task.

---

### Task 16: Update CLAUDE.md with §1.7 LLM Backend section

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add new section after §1.5 (wingui sync) and before §1.6 (.env 와 secrets)**

Open `CLAUDE.md`. Find the line `### 1.6 .env 와 secrets`. Insert before it:

```markdown
### 1.6 LLM Backend 모드 (2026-06-02 추가)

`.env` 의 `LLM_BACKEND` 환경변수가 모든 LLM 호출 (9개 서비스) 의 백엔드를 결정:

- `api` (기본, 미설정 시): 기존 Anthropic HTTP API. `ANTHROPIC_API_KEY` 필요.
- `cli`: 컨테이너 안 `claude` CLI subprocess. 호스트 `~/.claude` OAuth 로그인 사용.

**CLI 모드 활성화 절차**:
1. 호스트에서 `claude /login` 1회 (개인 또는 회사 구독 계정)
2. `.env`: `LLM_BACKEND=cli`
3. `docker compose up -d --force-recreate composer-backend`
4. 로그에서 `LLM backend = cli (binary=...)` 확인

**전환은 양방향** — 언제든 `.env` 의 한 줄 + 재기동으로 API ↔ CLI 전환 가능.
구독 한도 초과 시 fail-hard (자동 API fallback 없음) — 사용자가 직접 호스트
재로그인 또는 5시간 window 종료 대기.

CLI 모드 전용 옵션:
- `LLM_CLI_BINARY` (기본 `/usr/local/bin/claude`)
- `LLM_CLI_TIMEOUT_MIN` (기본 40)
- `LLM_CLI_MAX_CONCURRENT` (기본 4, 구독 rate-limit 보호)

상세 설계: `docs/superpowers/specs/2026-06-02-llm-backend-cli-toggle-design.md`.
```

Then renumber the existing `### 1.6 .env 와 secrets` to `### 1.7 .env 와 secrets`.

- [ ] **Step 2: Verify the file renders OK**

```bash
grep -n "^###" /Users/hej/work/projects/t3-composer/CLAUDE.md | head -15
```

Expected: section numbering is monotonic (1.1, 1.2, ..., 1.7).

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs(claude-md): §1.6 LLM Backend 모드 (api ↔ cli 토글) 추가

LLM_BACKEND 환경변수로 모든 LLM 호출의 백엔드 선택. API 모드 (기본) 와
CLI 모드 (구독 정액제 + ~/.claude 마운트) 의 활성화 절차 + CLI 전용 옵션 안내.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

### Spec coverage

| Spec section | Implemented in |
|---|---|
| §2 Decisions table | Embedded in plan header + each phase |
| §3.1 LlmClient interface | Task 2 |
| §3.2 Bean wiring | Task 3, Task 8 (CliLlmClient `@ConditionalOnProperty`), Task 9 (test) |
| §3.3 Service migration (9 files) | Task 3 Step 3 |
| §4.1 `.env` config | Task 12 |
| §4.2 application-dev.yaml | Task 13 Step 1-2 |
| §4.3 Startup fail-fast | Task 13 Step 3 |
| §5.1 Dockerfile changes | Task 10 |
| §5.2 docker-compose volume + env | Task 12 |
| §5.3 entrypoint diagnostic | Task 11 |
| §6.1 LlmCliInvoker abstraction | Task 6 |
| §6.2 Streaming flow | Task 8 |
| §6.3 stdin serialization | Task 8 (`writeRequest` method) |
| §6.4 SSE translation table | Task 7 |
| §6.5 Model passthrough | Task 8 (command construction) |
| §7 Error handling table | Task 5 |
| §8.1 Unit tests | Tasks 4, 5, 7, 8, 9 |
| §8.2 Integration test | Task 14 |
| §8.3 Manual verification | Task 15 |
| §11 New files list | All Phase 1-3 tasks |
| §11 Modified files list | Tasks 3, 10, 11, 12, 13, 16 |

All spec sections covered.

### Placeholder scan

- Task 8 Step 4 contains a TBD-style note about `AnthropicModels.Usage / ContentBlock` field name verification. This is acceptable as it's flagged as a verification step with a concrete `grep` command — engineer will adjust if needed. Not a true placeholder.
- Task 14 has a "if the schema is complex, skip the second test" — acceptable engineering judgment, manual verification (Task 15) covers it.

No "TODO/TBD/implement later" left unresolved.

### Type consistency

- `LlmClient.sendMessages(String, MessagesRequest)` → `Mono<MessagesResponse>` — used consistently in Tasks 2, 3, 8.
- `LlmClient.streamMessages(String, MessagesRequest)` → `Flux<ServerSentEvent<String>>` — consistent.
- `LlmCliProperties.getBinary() / getTimeoutMinutes() / getMaxConcurrent()` — Lombok `@Data` generates these, used in Task 8.
- `LlmCliException(int statusCode, String message)` + `LlmCliException.fromStderr(int, String)` — both used in Tasks 5, 8, 7.
- `LlmCliInvoker.start(List<String>)` → `LlmCliProcess` — consistent.
- `SseEventTranslator.translate(String)` → `List<ServerSentEvent<String>>` — consistent.

No type drift.

---

## Execution

Plan complete and saved to `docs/superpowers/plans/2026-06-02-llm-backend-cli-toggle.md`. Two execution options:

**1. Subagent-Driven (recommended)** — Dispatches a fresh subagent per task, reviewed between tasks. Faster iteration, isolated context per task.

**2. Inline Execution** — Executes tasks in this session using executing-plans. Batched checkpoints for review.

Which approach?

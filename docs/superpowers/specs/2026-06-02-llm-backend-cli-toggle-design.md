# LLM Backend Toggle — Anthropic API ↔ Claude Code CLI

**Date**: 2026-06-02
**Status**: Draft (awaiting review)
**Scope**: t3-composer backend — replace direct Anthropic API calls with a switchable backend that can route to either the HTTP API or a local `claude` CLI subprocess.

---

## 1. Motivation

Backend currently uses `ANTHROPIC_API_KEY` and pay-per-token API for all 9 LLM services
(`ComposerService`, 7 prefill/recommend services, `MockupTransformService`). Cost grows with
usage. Each developer already has a Claude Code subscription (Max/Pro) authenticated on their
host, which would be free to use up to the subscription quota.

**Goal**: a `.env` toggle (`LLM_BACKEND=api|cli`) that selects the backend without touching the
9 services. CLI mode routes through the local `claude` binary inside the container, using the
developer's host login (mounted volume).

**Non-goal**: production deployment, shared service account, automatic API fallback when CLI
fails (fail-hard is explicit user decision).

---

## 2. Decisions (from brainstorming)

| Topic | Decision |
|---|---|
| Primary motivation | API 비용 절감 — 구독으로 대체 |
| Scope | 전체 9개 서비스 (스트리밍 1 + non-streaming 8) |
| Streaming | 유지 필수 — CLI stream-json → Anthropic SSE 변환 |
| Auth | 호스트 `~/.claude/` 컨테이너 read-write 마운트 (각 개발자의 본인 로그인) |
| Failure | Fail-hard — 자동 API fallback 없음 |
| Multimodal + caching | 둘 다 유지 — CLI `--input-format stream-json` 으로 기존 MessagesRequest 그대로 전달 |
| Approach | Pure Java (ProcessBuilder + in-Java SSE 변환). Node sidecar 채택 안 함 |

---

## 3. Architecture

### 3.1 Abstraction

New interface in `com.zionex.t3composer.domain.client`:

```java
public interface LlmClient {
    Mono<MessagesResponse> sendMessages(String apiKey, MessagesRequest request);
    Flux<ServerSentEvent<String>> streamMessages(String apiKey, MessagesRequest request);
}
```

- 기존 `AnthropicClient` (117줄) → `ApiLlmClient implements LlmClient` 로 rename. 내부 로직 무수정.
- 신규 `CliLlmClient implements LlmClient` — `claude` 바이너리 subprocess 관리.
- `apiKey` 파라미터는 CLI 모드에서 무시 (호환성 유지를 위해 시그니처 동일). javadoc 에 명시.

### 3.2 Bean wiring

`@ConditionalOnProperty` 로 활성 빈 결정:

```java
@Component
@ConditionalOnProperty(name = "llm.backend", havingValue = "api", matchIfMissing = true)
public class ApiLlmClient implements LlmClient { ... }

@Component
@ConditionalOnProperty(name = "llm.backend", havingValue = "cli")
public class CliLlmClient implements LlmClient { ... }
```

Spring DI 가 활성화된 1개 빈만 주입. 두 모드 동시 활성 불가 (`.env` 단일 값).

### 3.3 Service migration

9개 서비스에서 한 줄씩만 변경:

```java
// Before
private final AnthropicClient anthropicClient;
// After
private final LlmClient llmClient;
```

호출 코드 (`anthropicClient.sendMessages(...)` / `anthropicClient.streamMessages(...)`) 는
이름만 바꾼다 (`llmClient.sendMessages(...)`).

**대상 파일** (9개):
- `domain/service/ComposerService.java` (스트리밍)
- `domain/service/PrefillFromSourceService.java`
- `domain/service/PrefillFromDesignService.java`
- `domain/service/PrefillFromMockupService.java`
- `domain/service/PrefillFromSynthesizedService.java`
- `domain/service/RecommendMockupService.java`
- `domain/service/AutoSuggestService.java`
- `domain/service/DesignDocAnalyzeService.java`
- `domain/service/MockupTransformService.java`

---

## 4. Configuration

### 4.1 `.env`

```bash
# Backend selection (기본 api — 기존 동작 유지)
LLM_BACKEND=cli                          # api | cli

# CLI 모드 전용
LLM_CLI_BINARY=/usr/local/bin/claude
LLM_CLI_TIMEOUT_MIN=40
LLM_CLI_MAX_CONCURRENT=4                 # 구독 rate-limit 보호

# API 모드 전용 (기존)
ANTHROPIC_API_KEY=sk-ant-...
```

### 4.2 `application-dev.yaml`

```yaml
llm:
  backend: ${LLM_BACKEND:api}
  cli:
    binary: ${LLM_CLI_BINARY:/usr/local/bin/claude}
    timeout-minutes: ${LLM_CLI_TIMEOUT_MIN:40}
    max-concurrent: ${LLM_CLI_MAX_CONCURRENT:4}
```

### 4.3 Startup validation (fail-fast)

`LlmBackendHealthCheck` (`@PostConstruct` 또는 `ApplicationReadyEvent` 핸들러):

- **API 모드**: 기존 동작 그대로 (변경 없음). `ANTHROPIC_API_KEY` 검증은 호출 시점에 수행.
- **CLI 모드**:
  1. `claude --version` 실행 — exit code 0 아니면 backend startup 실패 (명확한 에러 메시지)
  2. `/root/.claude/` 존재 확인 — 없으면 WARN 로그 (로그인 안 된 상태일 수 있음, 첫 호출 시 401 반환)

> ★ `LLM_BACKEND` 기본값 `api` + `matchIfMissing=true` 로 **기존 환경 변수 미설정 시 기존 동작 그대로**. 변경 없이 git pull 한 개발자의 backend 가 깨지지 않는 것이 보증.

---

## 5. Docker / Runtime

### 5.1 Dockerfile (`docker/backend/Dockerfile`)

기존 base image (eclipse-temurin:17-jdk + maven) 위에 추가:

```dockerfile
# Node.js 18+ for claude CLI
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
 && apt-get install -y nodejs \
 && npm install -g @anthropic-ai/claude-code \
 && claude --version
```

`claude --version` 을 빌드 시점에 실행해 설치 검증 — 실패 시 docker build 가 실패해 즉시 인지.

### 5.2 `docker-compose.yml` — composer-backend

```yaml
composer-backend:
  volumes:
    - ./backend:/app
    - composer-maven-repo:/root/.m2
    - ./staging:/workspace/staging
    - ./frontend/src/view/_preview:/workspace/preview/frontend
    - ${TARGET_T3SERIES_PATH}:/workspace/wingui:ro
    - ~/.claude:/root/.claude:rw                                # ★ NEW
  environment:
    - LLM_BACKEND=${LLM_BACKEND:-api}                            # ★ NEW
    - LLM_CLI_BINARY=${LLM_CLI_BINARY:-/usr/local/bin/claude}    # ★ NEW
    - LLM_CLI_TIMEOUT_MIN=${LLM_CLI_TIMEOUT_MIN:-40}             # ★ NEW
    - LLM_CLI_MAX_CONCURRENT=${LLM_CLI_MAX_CONCURRENT:-4}        # ★ NEW
```

- Volume 은 **rw** — `claude` CLI 가 OAuth 토큰 refresh 를 호스트 `~/.claude/.credentials.json`
  에 직접 기록. 호스트와 컨테이너가 같은 파일을 본다.
- 호스트별로 마운트 경로 다를 수 있음 (`~` 는 docker-compose 가 호스트 user home 으로 해석).
- Windows/WSL: 별도 검증 필요 — 우선 macOS/Linux dev 만 보증, Windows 는 `LLM_CLI_HOST_HOME` 같은
  override 변수 추가는 v2 로 미룸.

### 5.3 entrypoint 추가 진단 (`docker/backend/entrypoint.sh` 신규 또는 기존 확장)

```sh
#!/bin/sh
if [ "${LLM_BACKEND}" = "cli" ]; then
  if claude --version > /dev/null 2>&1; then
    echo "[entrypoint] claude CLI ready"
    if [ ! -d /root/.claude ] || [ -z "$(ls -A /root/.claude 2>/dev/null)" ]; then
      echo "[entrypoint] WARN: /root/.claude is empty — run 'claude /login' on host first"
    fi
  else
    echo "[entrypoint] ERROR: claude CLI not found at ${LLM_CLI_BINARY:-/usr/local/bin/claude}"
    exit 1
  fi
fi
exec "$@"
```

---

## 6. CliLlmClient 구현

### 6.1 의존성 분리 — `LlmCliInvoker`

테스트 가능성을 위해 subprocess 호출을 인터페이스로 추출:

```java
public interface LlmCliInvoker {
    LlmCliProcess start(List<String> command);
}

public class ProcessBuilderInvoker implements LlmCliInvoker {
    @Override
    public LlmCliProcess start(List<String> command) {
        Process p = new ProcessBuilder(command).redirectErrorStream(false).start();
        return new LlmCliProcess(p);
    }
}
```

`LlmCliProcess` 는 `Process` 의 thin wrapper — stdin OutputStream, stdout/stderr InputStream,
exit code, destroy() 노출. 단위 테스트에서는 mock invoker 사용.

### 6.2 스트리밍 호출 흐름

```java
@Component
@ConditionalOnProperty(name = "llm.backend", havingValue = "cli")
@RequiredArgsConstructor
@Slf4j
public class CliLlmClient implements LlmClient {

    private final LlmCliInvoker invoker;
    private final ObjectMapper mapper;
    private final LlmCliProperties props;       // @ConfigurationProperties
    private final Semaphore concurrencyGate;    // PostConstruct 에서 max-concurrent 로 init

    @Override
    public Flux<ServerSentEvent<String>> streamMessages(String apiKey, MessagesRequest req) {
        return Flux.create(sink -> {
            if (!concurrencyGate.tryAcquire(1, TimeUnit.SECONDS)) {
                sink.error(new LlmCliException(429, "CLI 동시 요청 한도 초과"));
                return;
            }
            List<String> cmd = List.of(
                props.getBinary(),
                "-p",
                "--input-format", "stream-json",
                "--output-format", "stream-json",
                "--model", mapModelName(req.getModel())
            );
            LlmCliProcess proc = invoker.start(cmd);

            // 비동기 stdin write (request JSON)
            CompletableFuture.runAsync(() -> writeRequest(proc.stdin(), req));

            // 비동기 stdout read + 변환
            CompletableFuture.runAsync(() -> {
                try (BufferedReader br = new BufferedReader(
                        new InputStreamReader(proc.stdout(), StandardCharsets.UTF_8))) {
                    String line;
                    SseConversionState state = new SseConversionState();
                    while ((line = br.readLine()) != null) {
                        for (ServerSentEvent<String> sse : translateCliLine(line, state)) {
                            sink.next(sse);
                        }
                    }
                    boolean ok = proc.waitFor(props.getTimeoutMinutes(), TimeUnit.MINUTES);
                    if (!ok) {
                        proc.destroyForcibly();
                        sink.error(new LlmCliException(504, "CLI timeout"));
                    } else if (proc.exitValue() != 0) {
                        String stderr = readAll(proc.stderr());
                        sink.error(toLlmException(proc.exitValue(), stderr));
                    } else {
                        sink.complete();
                    }
                } catch (Exception e) {
                    sink.error(e);
                } finally {
                    concurrencyGate.release();
                }
            });

            sink.onDispose(() -> {
                if (proc.isAlive()) proc.destroyForcibly();
                concurrencyGate.release();
            });
        });
    }

    @Override
    public Mono<MessagesResponse> sendMessages(String apiKey, MessagesRequest req) {
        // 내부적으로 streamMessages 를 reduce 해서 단일 MessagesResponse 로 모은다
        // (또는 별도 non-streaming 경로 — 시간 절약 위해 streamMessages 재사용 권장)
        return streamMessages(apiKey, req)
                .map(ServerSentEvent::data)
                .filter(Objects::nonNull)
                .reduce(new MessagesResponseAssembler(), MessagesResponseAssembler::feed)
                .map(MessagesResponseAssembler::build);
    }
}
```

### 6.3 stdin 직렬화 (MessagesRequest → stream-json)

CLI `--input-format stream-json` 은 line-delimited JSON 을 받는다. 형식은
Claude Agent SDK 의 `user` 메시지 형식:

```json
{"type":"user","message":{"role":"user","content":[...]}}
```

`MessagesRequest` 의 `messages[]` 각각을 한 줄씩 직렬화하고, system 프롬프트는
별도로 `--system-prompt` 플래그 또는 첫 줄에 system 메시지로 전달한다. **★ 실제 CLI 의
stream-json 입력 스키마는 구현 시 `claude --help` 와 SDK 문서로 1차 검증 필요 — 아래는
설계 의도이며 구현 시 정합화한다.**

이미지 첨부 (`content` 의 `{type:"image", source:{type:"base64", ...}}`) 는 그대로 통과.
`cache_control` ephemeral breakpoint 도 CLI 가 내부적으로 Anthropic API 호출 시 그대로 사용.

### 6.4 stdout 파싱 (stream-json → Anthropic SSE)

CLI stream-json 출력 이벤트 유형:

| CLI 이벤트 (line) | Anthropic SSE 변환 |
|---|---|
| `{"type":"system","subtype":"init","model":"...","session_id":"..."}` | `event: message_start\ndata: {"type":"message_start","message":{"id":...,"model":...,"role":"assistant",...}}` |
| `{"type":"assistant","message":{"content":[{"type":"text","text":"chunk"}]}}` (점진 호출) | 첫 호출: `content_block_start` + `content_block_delta` (text_delta). 이후: `content_block_delta` 만 |
| `{"type":"result","subtype":"success","usage":{...},"duration_ms":...}` | `content_block_stop` + `message_delta` (final usage + stop_reason) + `message_stop` |
| `{"type":"result","subtype":"error_max_turns"}` | Flux error → `LlmCliException(503, ...)` |
| `{"type":"result","subtype":"error_during_execution"}` | Flux error → `LlmCliException(503, ...)` |

`SseConversionState` 가 누적 텍스트 길이, content_block 카운터, message_id 보존.

### 6.5 모델 매핑

CLI `--model` 은 정확한 모델 ID 또는 alias 둘 다 받는다. 본 설계는 **정확한 ID 그대로 전달**
(매핑 변환 없음) — backend 의 `MessagesRequest.model` 이 항상 정확한 ID 이므로 변환 불필요.

```java
private String mapModelName(String modelId) {
    return modelId;   // pass-through. CLI 가 미지원 ID 시 stderr 로 명시 에러
}
```

미지원 모델 (구독 tier 제한) 은 startup 시점에 검증 어렵고, 호출 실패 시 stderr 메시지로 인지
→ §7 의 stderr 매핑 규칙으로 사용자에게 표시.

---

## 7. Error handling (Fail-hard 의미)

| 상황 | HTTP 응답 | 메시지 |
|---|---|---|
| CLI 바이너리 없음 (startup) | backend 기동 실패 | "claude CLI not found at ${path}" |
| `/root/.claude` 비어있음 (호출 시) | 401 | "구독 로그인 필요 — 호스트에서 `claude /login` 실행" |
| subprocess exit ≠ 0 | 503 | stderr 마지막 200자 |
| timeout (`LLM_CLI_TIMEOUT_MIN`) | 504 | "CLI 응답 지연 (${n}분)" |
| stderr 에 "rate limit" / "quota" 포함 | 429 | "구독 한도 도달 — 5시간 window 종료 대기" |
| semaphore acquire 실패 (1초) | 429 | "동시 요청 한도 초과 (LLM_CLI_MAX_CONCURRENT=${n})" |
| stderr 에 "Please run claude /login" 포함 | 401 | "구독 로그인 만료 — 호스트에서 재로그인" |

`LlmCliException extends RuntimeException` 에 httpStatus + message 보존. 컨트롤러 레이어의
공통 예외 핸들러가 이를 그대로 HTTP 응답으로 변환. 자동 API fallback 없음.

---

## 8. Testing

### 8.1 단위 테스트
- `MockLlmCliInvoker` — 가짜 subprocess (`InputStream`/`OutputStream` 메모리 stream) 제공
- `CliLlmClientTest`:
  - stream-json input 직렬화가 multimodal content + cache_control 포함하는가
  - stream-json output 변환이 Anthropic SSE event 시퀀스 정확히 생성하는가
  - exit ≠ 0 시 LlmCliException 매핑 정확한가
  - semaphore 동시성 상한 보호되는가
- `LlmBackendConfigTest` — `@ConditionalOnProperty` 가 두 모드에서 올바른 빈 선택하는가

### 8.2 통합 테스트
- `LlmCliIntegrationTest` — 실제 `claude --version` + 짧은 non-streaming roundtrip
- `@EnabledIfEnvironmentVariable(named="LLM_CLI_INTEGRATION_TEST",matches="true")` 로 gate
- CI 에서는 skip, 로컬 dev 가 수동 실행

### 8.3 수동 검증 체크리스트
- [ ] `LLM_BACKEND=api` 로 기동 → 기존 동작 그대로 (회귀 없음)
- [ ] `LLM_BACKEND=cli` 로 기동 → ComposerWorkspace 화면 생성 1회 성공
- [ ] 화면 생성 중 ChatPanel 에 글자가 실시간 타이핑 (스트리밍 OK)
- [ ] 이미지 mockup 첨부한 NEW_GENERAL 호출 → 화면 생성 성공 (멀티모달 OK)
- [ ] 호스트 `claude /logout` 후 호출 → 401 + "구독 로그인 필요" 안내
- [ ] `LLM_CLI_MAX_CONCURRENT=1` 로 2개 동시 호출 → 두 번째 429
- [ ] backend 재기동 후 토큰 refresh 가 호스트 `~/.claude/.credentials.json` 에 영속

---

## 9. 작업 범위

| Phase | 내용 | 추정 |
|---|---|---|
| Phase 1 | `LlmClient` 인터페이스 + `ApiLlmClient` rename + 9 서비스 필드 타입 변경 + 단위 테스트 (회귀 확인) | 0.5일 |
| Phase 2 | `CliLlmClient` + `LlmCliInvoker` + `SseEventTranslator` + semaphore + `LlmCliProperties` + 단위 테스트 | 1.5일 |
| Phase 3 | Dockerfile + docker-compose 볼륨/환경변수 + entrypoint 진단 + `LlmBackendHealthCheck` (startup fail-fast) | 0.5일 |
| Phase 4 | 통합 테스트 (LLM_CLI_INTEGRATION_TEST 게이트) + 수동 검증 체크리스트 + 문서 업데이트 (CLAUDE.md §1.7, .env.example) | 0.5일 |
| **합계** | | **3일** |

각 Phase 는 독립 PR 가능. Phase 1 만 merge 해도 기존 동작은 그대로 (회귀 zero) — 안전한 점진 도입.

---

## 10. 알려진 제약 / Out of scope

- **Windows 호스트** — `~/.claude` 마운트 경로가 macOS/Linux 기준. WSL 사용자는 별도 검증 필요 (v2 로 미룸).
- **공유 dev 환경** — 현재 설계는 개발자 1명 = 호스트 1대 가정. 여러 dev 가 같은 컨테이너 인스턴스를 공유하는 시나리오는 미고려.
- **자동 API fallback** — 명시적 거부 (Fail-hard). 추후 필요 시 `LlmClient` 위에 `FallbackLlmClient` 데코레이터 추가 가능.
- **production 배포** — 본 설계는 local dev container 전용. production 에서는 별도 검토 필요 (서비스 계정 / 자격증명 관리).
- **claude CLI stream-json 입력 스키마** — §6.3 의 stream-json 입력 형식은 설계 의도. 구현 1일차에 `claude --help` + Agent SDK 문서로 실제 스키마 정합화 필요. 차이가 크면 §6.3 만 조정 (전체 구조는 영향 없음).
- **prompt caching 검증** — CLI 가 내부적으로 `cache_control` ephemeral breakpoint 를 그대로 전달하는지는 첫 통합 테스트 시 stderr/로그로 확인. 무시되면 후속 호출에서 토큰 절감 효과만 사라지고 동작은 정상.

---

## 11. 관련 파일

### 변경
- `backend/src/main/java/com/zionex/t3composer/domain/client/AnthropicClient.java` → `ApiLlmClient.java` (rename + interface impl)
- 9 서비스 파일 (필드 타입 변경)
- `backend/src/main/resources/application-dev.yaml` (llm.* 섹션 추가)
- `docker/backend/Dockerfile` (Node + claude CLI 설치)
- `docker-compose.yml` (composer-backend 볼륨 + 환경변수)
- `.env.example` (LLM_BACKEND 등 추가)
- `CLAUDE.md` (§1.3 ArtifactApply 모드 옆에 §1.7 LLM Backend 모드 추가)

### 신규
- `backend/src/main/java/com/zionex/t3composer/domain/client/LlmClient.java`
- `backend/src/main/java/com/zionex/t3composer/domain/client/CliLlmClient.java`
- `backend/src/main/java/com/zionex/t3composer/domain/client/LlmCliInvoker.java`
- `backend/src/main/java/com/zionex/t3composer/domain/client/LlmCliProcess.java`
- `backend/src/main/java/com/zionex/t3composer/domain/client/LlmCliException.java`
- `backend/src/main/java/com/zionex/t3composer/domain/client/LlmCliProperties.java`
- `backend/src/main/java/com/zionex/t3composer/domain/client/SseEventTranslator.java`
- `backend/src/main/java/com/zionex/t3composer/config/LlmBackendHealthCheck.java`
- `docker/backend/entrypoint.sh` (없으면 신규)
- `backend/src/test/java/com/zionex/t3composer/domain/client/CliLlmClientTest.java`
- `backend/src/test/java/com/zionex/t3composer/domain/client/LlmCliIntegrationTest.java`

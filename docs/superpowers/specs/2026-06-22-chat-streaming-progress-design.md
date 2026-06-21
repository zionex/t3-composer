# Chat Streaming Progress — 자연어 화면 생성 단계별 진행 표시

**작성일**: 2026-06-22
**작성자**: youngeun_park@zionex.com (with Claude Opus 4.7)
**상태**: Draft → User Review

---

## 1. 배경 (Why)

T3Composer 의 자연어 화면 생성은 LLM 한 번 호출에 수십초~분 단위가 걸린다. 현재 사용자가 보는 것은:

| 모드 | 표시 위치 | 표시 내용 |
|---|---|---|
| NEW_NL 단일 모드 | 채팅 영역 (`ChatPanel.jsx:226`) | "응답 중..." + 스피너 |
| NEW_STEP Step 4 | 헤더 토스트 (`ComposerWorkspace.jsx:740`) + 채팅 영역 | "🪄 화면 생성 중…" + "응답 중..." (이중 노출) |

둘 다 **boolean `sending` 만 보고 스피너 표시 — 어떤 작업을 하는지 0 정보**. 사용자는 "멈췄나? 진행 중인가?" 를 알 수 없다.

조사 결과:

1. 백엔드는 single-shot POST (`/composer/sessions/{id}/chat`, 40분 timeout) — 응답이 한 번에 옴.
2. 시간의 대부분(80%+)은 Anthropic LLM 호출. prompt build / artifact extract / save 는 ms 단위.
3. `LlmClient.streamMessages()` (Flux 반환) + `SseEventTranslator` — streaming 인프라가 이미 코드에 있으나 controller 에서 안 씀.
4. 백엔드 내부에는 `log.info` 로 phase 가 찍히지만 프런트로 전달 안 됨.
5. `previewStage` (`compiling/restarting/autofixing/ready/failed`) 같은 잘 작동하는 phase UI 패턴이 이미 존재 — chat 에도 같은 패턴을 적용하면 됨.

---

## 2. 목표 (Goals)

- 채팅으로 화면 생성 요청 시 LLM 이 **어떤 파일을 어디까지 만들고 있는지 실시간으로** 보여 사용자가 "멈춘 건가" 의심하지 않도록 한다.
- 진행 표시가 **거짓말이 아닐 것** — 실제 LLM 출력 순서와 1:1 매칭. 시간 기반 가짜 phase 순환 금지.
- 기존 non-streaming 흐름과 자동 보완(autofix) 흐름은 **같은 UI** 로 자연 합성.

## 3. 범위

**포함 (in scope):**
- NEW_NL 단일 모드 (`ModeNewGeneral`)
- NEW_STEP Step 4 (`GenerateStep` → `ComposerWorkspace`)
- NEW_FROM_COPY / EXISTING_MODIFY 의 자유 채팅 후속 메시지
- 자동 보완(autofix) 가 트리거한 채팅도 동일 UX (별도 처리 없이 자연 합성)

**제외 (out of scope):**
- [화면 실행] 의 `previewStage` 흐름 — 이미 잘 작동 중, 손대지 않음
- 메뉴 등록 / 아티팩트 실행 / wingui sync — 별개 흐름
- LLM 응답 본문(코드)을 채팅에 토큰 단위로 흘려보내기 — 가치 낮음 (코드는 산출물 트리에서 봄). progress 표시만.

---

## 4. 아키텍처

```
[ChatPanel.jsx]                                [ComposerController]              [ComposerStreamingService]
        │                                              │                                │
        │  POST /sessions/{id}/chat-stream             │                                │
        │     ─────────────────────────────────────►   │                                │
        │                                              │  chatStream(...)               │
        │                                              │ ─────────────────────────────► │
        │                                              │                                │ buildPrompt()
        │  ◄─── event: phase  {phase:'PROMPT'}         │ ◄──────────────────────────── │
        │                                              │                                │
        │                                              │                                │ llmClient.streamMessages()
        │                                              │                                │   (Anthropic SSE Flux)
        │                                              │                                │ + StreamPhaseEmitter
        │  ◄─── event: phase  {phase:'STREAM_START'}   │                                │   (===FILE: 마커 감지)
        │  ◄─── event: file   {idx:1, name:'UserInfo.jsx', type:'SCREEN_JSX'}            │
        │  ◄─── event: file   {idx:2, name:'...Controller.java', type:'JAVA_CONTROLLER'}│
        │  ◄─── event: file   {idx:3, name:'SP_UI_UT_01_Q1.sql', type:'SQL_SP'}         │
        │  ◄─── event: file   {idx:4, name:'menu.sql', type:'MENU_SQL'}                 │
        │  ◄─── event: phase  {phase:'STREAM_END', tokens:8240}                          │
        │  ◄─── event: phase  {phase:'EXTRACT', files:4}                                 │
        │  ◄─── event: phase  {phase:'SAVE', saved:4, superseded:0}                     │
        │  ◄─── event: done   {messageId, artifacts:[...]}                              │
```

**신설 컴포넌트:**

| 위치 | 컴포넌트 | 역할 |
|---|---|---|
| backend | `ComposerStreamingService` | 기존 `ComposerService.chat` 을 SSE 로 감싸는 thin wrapper |
| backend | `StreamPhaseEmitter` | Anthropic delta 텍스트 누적 + `===FILE:` 정규식 매칭 시 phase event 발화 |
| backend | `ChatStreamEvent` DTO | SSE event payload |
| frontend | `useChatStream` hook | `fetch + ReadableStream` 으로 SSE 소비 (POST body 지원 위해 EventSource 미사용) |
| frontend | `<ChatProgress>` 컴포넌트 | 채팅 영역의 "응답 중..." 교체 |
| frontend | `<HeaderProgressBar>` 컴포넌트 | 헤더 토스트의 "🪄 화면 생성 중…" 교체 |

**원칙:** 백엔드가 phase 를 이미 파싱해서 보내준다 — 파싱 로직 1곳. 프런트는 단순 displayer. 기존 `ArtifactExtractor.FILE_BLOCK` 정규식 (rules/50 §13.5 의 3가지 변형) 을 streaming 컨텍스트로 재사용.

---

## 5. 백엔드 변경

### 5.1 신규 endpoint

`ComposerController.java`:

```java
@PostMapping(value = "/sessions/{sessionId}/chat-stream",
             produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<ServerSentEvent<Object>> chatStream(
    @PathVariable String sessionId, @RequestBody ChatRequest req) {
    if (req == null || req.getMessage() == null || req.getMessage().isBlank()) {
        return Flux.error(new IllegalArgumentException("message 가 비어 있습니다"));
    }
    composerService.appendUserMessage(sessionId, req.getMessage());
    return composerStreamingService.chatStream(
        currentUserId(), sessionId, req.getAttachments());
}
```

기존 `POST /chat` 는 그대로 유지 — SSE fallback + 내부 호출 보존.

### 5.2 `ComposerStreamingService` — Flux 조립

```java
public Flux<ServerSentEvent<Object>> chatStream(
        String userId, String sessionId, List<AttachmentDto> attachments) {
    return Flux.create(sink -> {
        try {
            sink.next(phaseEvent("PROMPT"));
            MessagesRequest req = composerService.buildRequest(sessionId, attachments);
            String apiKey = composerService.resolveApiKey(userId);

            sink.next(phaseEvent("STREAM_START",
                Map.of("model", req.getModel(), "maxTokens", req.getMax_tokens())));
            StreamPhaseEmitter emitter = new StreamPhaseEmitter(sink);

            llmClient.streamMessages(apiKey, req)
                .doOnNext(emitter::onAnthropicEvent)
                .doOnComplete(() -> {
                    sink.next(phaseEvent("STREAM_END",
                        Map.of("tokens", emitter.totalTokens(),
                               "stopReason", emitter.stopReason())));
                    // continuation 체크
                    if (emitter.needsContinuation()) {
                        sink.next(phaseEvent("CONTINUATION",
                            Map.of("round", emitter.round() + 1,
                                   "remaining", emitter.continuationRemaining())));
                        // 재귀 호출 — emitter 상태 이어받음 (별도 메서드로 분리)
                    }
                    sink.next(phaseEvent("EXTRACT"));
                    List<ComposerArtifact> arts =
                        composerService.persistAssistantResponse(sessionId, emitter.fullText());
                    sink.next(phaseEvent("SAVE",
                        Map.of("saved", arts.size(),
                               "superseded", emitter.supersededCount())));
                    sink.next(doneEvent(emitter.messageDto(), arts));
                    sink.complete();
                })
                .doOnError(err -> {
                    sink.next(errorEvent(emitter.currentPhase(), err.getMessage(),
                        isRecoverable(err)));
                    sink.complete();
                })
                .subscribe();
        } catch (Exception e) {
            sink.next(errorEvent("PROMPT", e.getMessage(), false));
            sink.complete();
        }
    });
}
```

기존 `ComposerService.chat` / `persistAssistantResponse` / `buildRequest` 는 **재사용** — wrapper 만 추가.

### 5.3 `StreamPhaseEmitter` — 핵심 파싱

```java
public class StreamPhaseEmitter {
    private final FluxSink<ServerSentEvent<Object>> sink;
    private final StringBuilder buf = new StringBuilder();
    private int fileCount = 0;
    private int tokenCount = 0;
    private String stopReason;
    private int round = 1;
    private int scanFrom = 0;

    private static final Pattern FILE_MARKER =
        Pattern.compile("^===FILE:\\s*([^=]+?)\\s*===\\s*$", Pattern.MULTILINE);

    public void onAnthropicEvent(AnthropicStreamEvent ev) {
        switch (ev.getType()) {
            case CONTENT_BLOCK_DELTA -> {
                String delta = ev.getDelta().getText();
                if (delta == null) return;
                buf.append(delta);
                Matcher m = FILE_MARKER.matcher(buf);
                while (m.find(scanFrom)) {
                    String path = m.group(1).trim();
                    fileCount++;
                    String type = ArtifactExtractor.classifyArtifact(path);
                    sink.next(fileEvent(fileCount, basename(path), type));
                    scanFrom = m.end();
                }
                tokenCount += estimateTokens(delta);
            }
            case MESSAGE_DELTA -> {
                if (ev.getDelta() != null && ev.getDelta().getStopReason() != null) {
                    stopReason = ev.getDelta().getStopReason();
                }
            }
            // ... message_stop, ping 등
        }
    }

    public boolean needsContinuation() {
        return "max_tokens".equals(stopReason) && round < MAX_CONTINUATION;
    }
    public String fullText() { return buf.toString(); }
    public int totalTokens() { return tokenCount; }
    // ...
}
```

`classifyType` 은 기존 `ArtifactExtractor.classifyArtifact()` 그대로 호출 — 새 분류기 만들지 않음.

### 5.4 LLM_BACKEND=cli 호환

CLI 모드 (`CliLlmClient`) 는 subprocess stdin/stdout — 토큰 streaming 불가. `ComposerStreamingService` 가 `LLM_BACKEND` env 체크 후 분기:

- `api` 모드: 위 schema 그대로 (file 이벤트 실시간)
- `cli` 모드: `PROMPT → STREAM_START` (즉시) → 〔CLI subprocess 대기〕 → 응답 받은 후 `===FILE:` 마커 전체 한 번에 파싱 → file 이벤트 일괄 emit → `STREAM_END → EXTRACT → SAVE → done`

CLI 모드 사용자 시각: `✨ Claude (CLI) 응답 수신 중… 45s` — file 이벤트 일괄 → 후순으로 ✓ 채워짐. 거짓말 없음 (단계는 진짜, 다만 file 별 시간 분해는 없음).

### 5.5 영향 받는 파일

| 파일 | 변경 |
|---|---|
| `ComposerController.java` | + endpoint 1개 |
| `ComposerService.java` | 변경 없음 (`buildRequest` / `persistAssistantResponse` / `resolveApiKey` public 노출만) |
| `ApiLlmClient.java` | 이미 있는 `streamMessages()` 활성화 — Anthropic SSE wiring 확인 |
| `ArtifactExtractor.java` | 변경 없음 (`classifyArtifact` 재사용) |
| (신규) `ComposerStreamingService.java` | thin wrapper |
| (신규) `StreamPhaseEmitter.java` | 마커 감지 |
| (신규) `ChatStreamEvent.java` DTO | event payload |

---

## 6. 프런트엔드 변경

### 6.1 신규 hook — `useChatStream`

```js
// frontend/src/view/util/t3composer/useChatStream.js
export function useChatStream() {
  const [progress, setProgress] = useState(null);
  // progress = { phase, files:[{idx,name,type}], elapsedMs, tokens, error, startedAt }
  const [sending, setSending] = useState(false);
  const ctrlRef = useRef(null);

  const send = useCallback(async (sessionId, message, attachmentArtifactIds, attachments) => {
    setSending(true);
    setProgress({ phase: 'PROMPT', files: [], elapsedMs: 0,
                  startedAt: Date.now(), tokens: 0 });
    ctrlRef.current = new AbortController();

    try {
      const resp = await fetch(`composer/sessions/${sessionId}/chat-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
                   'Accept': 'text/event-stream' },
        body: JSON.stringify({ message, attachmentArtifactIds, attachments }),
        signal: ctrlRef.current.signal,
      });

      if (!resp.ok || !resp.body) {
        return await fallbackToPost(sessionId, message,
                                     attachmentArtifactIds, attachments);
      }

      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const { events, remainder } = parseSseFrames(buf);
        buf = remainder;
        for (const evt of events) handleEvent(evt, setProgress);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      return await fallbackToPost(...);
    } finally {
      setSending(false);
    }
  }, []);

  const cancel = () => ctrlRef.current?.abort();
  return { send, cancel, sending, progress };
}
```

`fetch + ReadableStream` 선택 이유 — `EventSource` 는 POST body 미지원 (attachments 포함 페이로드 클 수 있음).

### 6.2 `<ChatProgress>` 컴포넌트

`ChatPanel.jsx:226` 의 "응답 중..." Stack 을 교체:

```jsx
function ChatProgress({ progress }) {
  if (!progress) return null;
  const { phase, files, elapsedMs, tokens, error } = progress;
  const sec = Math.floor(elapsedMs / 1000);

  if (error) return <ErrorBubble msg={error.message}
                                  recoverable={error.recoverable} />;

  const phaseText = {
    PROMPT:       '🪄 요구사항 분석 중…',
    STREAM_START: '✨ Claude 응답 수신 중…',
    // STREAM_DELTA 가상 phase — 토큰 delta 받는 중
    STREAM_END:   '📋 산출물 추출 준비 중…',
    CONTINUATION: '↻ 이어서 받는 중…',
    EXTRACT:      '📋 산출물 추출 중…',
    SAVE:         '💾 저장 중…',
  }[phase];

  // file 이벤트가 한 건이라도 있으면 현재 작성 중인 파일명 노출
  const headerText = (phase === 'STREAM_START' && files.length > 0)
    ? `📄 ${files[files.length - 1].name} 작성 중…`
    : phaseText;

  return (
    <Stack direction="row" spacing={1.5} sx={{ my: 1.5 }}>
      <Avatar sx={{ bgcolor: 'primary.main' }}><SmartToyIcon /></Avatar>
      <Paper variant="outlined" sx={{ p: 1.5, minWidth: 280 }}>
        <Stack spacing={0.75}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CircularProgress size={14} />
            <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }}>
              {headerText}
            </Typography>
            <Typography variant="caption" color="text.secondary">{sec}s</Typography>
          </Stack>
          {files.length > 0 && (
            <Box sx={{ pl: 3, borderLeft: '2px solid', borderColor: 'primary.light' }}>
              {files.map((f, i) => (
                <Typography key={i} variant="caption"
                            sx={{ display:'block', color:'text.secondary' }}>
                  {i === files.length - 1 && phase === 'STREAM_START' ? '✏️' : '✓'} {f.name}
                  <Box component="span" sx={{ ml: 1, opacity: 0.6 }}>
                    · {TYPE_LABEL[f.type] || f.type}
                  </Box>
                </Typography>
              ))}
            </Box>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
```

렌더 결과 예시:
```
🤖 ┌─────────────────────────────────────────┐
   │ ⏳ 📄 SP_UI_UT_01_Q1.sql 작성 중…   18s │
   │   ┊                                     │
   │   ┊ ✓ UserInfoMgmt.jsx        · JSX     │
   │   ┊ ✓ UserInfoMgmtCtrl.java   · Controller │
   │   ┊ ✏️ SP_UI_UT_01_Q1.sql      · SP DDL   │
   └─────────────────────────────────────────┘
```

### 6.3 `<HeaderProgressBar>` (캡처 2 자리)

`ComposerWorkspace.jsx:740` 의 `chatCollapsed && genStatus && ...` 조건 자리에:

```jsx
{chatCollapsed && progress && (
  <HeaderProgressBar
    phaseText={getCompactPhaseText(progress)}
    elapsedMs={progress.elapsedMs}
    fileCount={progress.files.length}
    onClick={() => setChatCollapsed(false)}
  />
)}
```

`getCompactPhaseText`:
- `PROMPT/EXTRACT/SAVE` → "🪄 화면 생성 중… (요구사항 분석)" / "(산출물 추출)" / "(저장 중)"
- `STREAM_START` + files.length === 0 → "✨ Claude 응답 수신 중… (1,240 토큰)"
- `STREAM_START` + files.length > 0 → "📄 3개 파일 / SP_UI_UT_01_Q1.sql 작성 중…"

### 6.4 `ChatPanel.jsx` 의 sendMessage 교체

기존 `zAxios.post('chat')` → `useChatStream().send()` 로 교체. `forwardRef` + `useImperativeHandle({ sendMessage })` API 시그니처는 유지 — 자동 보완(ComposerWorkspace) 이 그대로 호출.

### 6.5 헤더 토스트 vs 채팅 버블 중복 방지

캡처 2 처럼 두 자리 모두 동일 정보 중복은 시각 노이즈. 규칙:

- `chatCollapsed === true` → 헤더 토스트만 (채팅 안 보이니 진척이 헤더에 와야)
- `chatCollapsed === false` → 채팅 버블만 (헤더는 깔끔하게)

**`genStatus` state 의 운명** — 기존 `ComposerWorkspace.jsx:188` 의 `genStatus` (`{phase:'sending'|'done'|'error', message}`) state 는 **제거**. 새 데이터 소스는 `useChatStream().progress`. `chatCollapsed` 분기 조건만 유지 (`progress && progress.phase !== 'done'`).

**`previewStage` state 와의 구분** — `previewStage` (autofix/preview 헤더 토스트, rules/50 §14.3) 는 **별개로 유지**. 자동 보완 시 두 토스트가 위아래로 동시 노출 (§8.6) — 서로 다른 정보 (autofix 단계 vs 채팅 생성 단계).

---

## 7. SSE 이벤트 스키마 (계약)

모든 이벤트 공통: `id` (시퀀스 번호) · `event` (타입) · `data` (JSON).

| event | data 필드 | 발화 시점 | 누락 가능? |
|---|---|---|---|
| `phase` | `{phase: "PROMPT"}` | `buildRequest()` 시작 직전 | 필수 |
| `phase` | `{phase: "STREAM_START", model, maxTokens}` | `llmClient.streamMessages` subscribe 직후 | 필수 |
| `file` | `{idx, name, type, parent?}` | `===FILE:` 마커 누적 감지 시 | 0~N개 |
| `phase` | `{phase: "STREAM_END", tokens, stopReason}` | Anthropic stream 완료 | 필수 |
| `phase` | `{phase: "CONTINUATION", round, remaining}` | max_tokens hit → 재호출 직전 | 0~N개 |
| `phase` | `{phase: "EXTRACT", files}` | `ArtifactExtractor` 시작 | 필수 |
| `phase` | `{phase: "SAVE", saved, superseded}` | DB 저장 직후 | 필수 |
| `done` | `{messageId, artifacts:[{id,type,name}]}` | 모든 작업 완료 | 필수 — stream 마지막 |
| `error` | `{phase, message, recoverable}` | 어느 단계든 실패 | 0~1개 |

`file.type` 값 — `ArtifactExtractor.classifyArtifact()` 의 enum 그대로:
`SCREEN_JSX` · `JAVA_ENTITY` · `JAVA_CONTROLLER` · `JAVA_SERVICE` · `JAVA_REPOSITORY` · `SQL_DDL` · `SQL_SP` · `MENU_SQL` · `OTHER`.

`file.parent` — 산출물이 sub-file 일 때만 (드물게). 일반 케이스 생략.

**프런트 displayer 매핑:**
```js
const TYPE_LABEL = {
  SCREEN_JSX:      'JSX',
  JAVA_ENTITY:     'Entity',
  JAVA_CONTROLLER: 'Controller',
  JAVA_SERVICE:    'Service',
  JAVA_REPOSITORY: 'Repository',
  SQL_DDL:         '테이블 DDL',
  SQL_SP:          'SP DDL',
  MENU_SQL:        '메뉴 SQL',
  OTHER:           '기타',
};
```

**예시 stream (실제 한 세션):**
```
id:1  event:phase  data:{"phase":"PROMPT"}
id:2  event:phase  data:{"phase":"STREAM_START","model":"claude-sonnet-4-5","maxTokens":16000}
id:3  event:file   data:{"idx":1,"name":"UserInfoMgmt.jsx","type":"SCREEN_JSX"}
id:4  event:file   data:{"idx":2,"name":"UserInfoMgmt.java","type":"JAVA_ENTITY"}
id:5  event:file   data:{"idx":3,"name":"UserInfoMgmtController.java","type":"JAVA_CONTROLLER"}
id:6  event:file   data:{"idx":4,"name":"UserInfoMgmtService.java","type":"JAVA_SERVICE"}
id:7  event:file   data:{"idx":5,"name":"SP_UI_UT_01_Q1.sql","type":"SQL_SP"}
id:8  event:file   data:{"idx":6,"name":"SP_UI_UT_01_S1.sql","type":"SQL_SP"}
id:9  event:file   data:{"idx":7,"name":"SP_UI_UT_01_D1.sql","type":"SQL_SP"}
id:10 event:file   data:{"idx":8,"name":"menu_UI_UT_USER_INFO_MGMT.sql","type":"MENU_SQL"}
id:11 event:phase  data:{"phase":"STREAM_END","tokens":12480,"stopReason":"end_turn"}
id:12 event:phase  data:{"phase":"EXTRACT","files":8}
id:13 event:phase  data:{"phase":"SAVE","saved":8,"superseded":0}
id:14 event:done   data:{"messageId":"msg_xxx","artifacts":[...8개...]}
```

---

## 8. 엣지 케이스 & 에러 처리

### 8.1 max_tokens hit → continuation

`ComposerService.chatWithAutoContinuation` 가 stop_reason=`max_tokens` 시 `CONTINUE_PROMPT` 를 붙여 재호출. SSE 에서는:

```
event:phase data:{"phase":"STREAM_END","tokens":16000,"stopReason":"max_tokens"}
event:phase data:{"phase":"CONTINUATION","round":2,"remaining":1}
event:phase data:{"phase":"STREAM_START","model":"...","maxTokens":16000}
event:file  data:{"idx":9,"name":"SP_UI_UT_01_S1.sql","type":"SQL_SP"}
...
```

프런트 표시: `↻ 이어서 받는 중 (2/3차)…` + 누적 파일 리스트 유지 (clear 안 함).

### 8.2 LLM_BACKEND=cli

§5.4 참조. CLI 모드는 phase 만 진짜 streaming, file 이벤트는 응답 받은 후 일괄.

### 8.3 SSE 연결 끊김 / 네트워크 에러

| 시점 | 처리 |
|---|---|
| `fetch()` 자체 실패 (HTTP 5xx · CORS) | 즉시 fallback: 기존 `POST /chat` 호출 + 토스트 "스트리밍 불가, 직접 응답 받는 중…" |
| stream 도중 `reader.read()` 에러 | fallback `GET /sessions/{id}/messages/latest` 폴링 (3초 간격, 최대 5분) — 백엔드는 이미 LLM 호출 진행 중일 수 있어 메시지 재전송 X (중복 호출 회피) |
| 사용자 abort (cancel 버튼) | `AbortController.abort()` → 백엔드 `Flux` sink dispose → LLM 호출 중단 신호 (best-effort — Anthropic 호출 진행 중이면 중단 못 함, 토큰 비용 발생) |

### 8.4 SSE 도중 오류 (LLM 4xx/5xx · Java exception)

```
event:phase data:{"phase":"STREAM_START",...}
event:error data:{"phase":"STREAM","message":"529 overloaded_error","recoverable":true}
```

프런트:
- `recoverable:true` → "Claude 가 일시 과부하 — 재시도 중…" + 자동 1회 재시도 (백엔드 `ApiLlmClient` 의 기존 retry 로직 활용)
- `recoverable:false` → 빨간 에러 버블 + "다시 시도" 버튼

### 8.5 사용자가 도중 새 메시지 전송

현재 `ChatPanel` 은 `sending === true` 일 때 입력창 disabled. 본 디자인도 동일 — 한 번에 한 stream 만. 동시 stream 금지 (`useChatStream.send` 이 in-flight 면 reject).

### 8.6 자동 보완 흐름의 진행 표시

`ComposerWorkspace.handlePreviewError` → `ChatPanel.sendMessage` 가 프로그램적으로 호출. 같은 `useChatStream` 경유 → 자동 보완도 동일 streaming UI. 헤더 토스트가 `🤖 AI 자동보완 중 (1/1)` 으로 우선 표시되고 (이미 있는 `previewStage='autofixing'` 토스트) 그 아래로 동일 `ChatProgress` 노출 — "자동보완이 어떤 파일을 새로 만들고 있는지" 까지 보임. 추가 코드 거의 필요 없음 (자연 합성).

### 8.7 기존 non-streaming endpoint 의 운명

`POST /sessions/{id}/chat` **유지**. 용도:
- SSE fallback (§8.3)
- 외부 자동화/스크립트 호출 (있다면)
- 디버그 — backend 로그로 phase 추적

새 endpoint 가 검증되면 fallback 제거 검토 (다음 PR).

### 8.8 헤더 토스트 vs 채팅 버블 동시 표시 (캡처 2 문제)

§6.5 의 `chatCollapsed` 기반 분기 — 한 자리만 표시.

---

## 9. 영향 받는 파일 (요약)

### 신규
- `backend/src/main/java/com/zionex/t3composer/domain/service/ComposerStreamingService.java`
- `backend/src/main/java/com/zionex/t3composer/domain/service/StreamPhaseEmitter.java`
- `backend/src/main/java/com/zionex/t3composer/domain/dto/ChatStreamEvent.java`
- `frontend/src/view/util/t3composer/useChatStream.js`
- `frontend/src/view/util/t3composer/ChatProgress.jsx`
- `frontend/src/view/util/t3composer/HeaderProgressBar.jsx`

### 수정
- `backend/.../ComposerController.java` — endpoint 추가
- `backend/.../ComposerService.java` — `buildRequest` / `persistAssistantResponse` / `resolveApiKey` 가시성 public 노출
- `backend/.../ApiLlmClient.java` — `streamMessages()` 활성화 확인
- `frontend/src/view/util/t3composer/ChatPanel.jsx` — `useChatStream` 으로 교체, 226라인 `<ChatProgress>` 삽입
- `frontend/src/view/util/t3composer/ComposerWorkspace.jsx` — 740라인 헤더 토스트 `<HeaderProgressBar>` 로 교체, `chatCollapsed` 분기 강화
- `frontend/src/view/util/t3composer/api.js` — fallback POST polling helper

### 무변경 (재사용)
- `backend/.../ArtifactExtractor.java` — `classifyArtifact()` 그대로 호출
- `backend/.../LlmClient.java` / `CliLlmClient.java` — 인터페이스 그대로
- `backend/.../SseEventTranslator.java` — Anthropic SSE 변환 그대로

---

## 10. 검증 계획

1. **API 모드 — 정상 흐름**: NEW_NL 로 간단한 화면 생성 → 채팅 버블에 PROMPT → STREAM_START → file 1~N → EXTRACT → SAVE 순서대로 ✓ / ✏️ 표시 확인. 산출물 트리의 파일 개수와 progress 의 file 개수 일치.
2. **API 모드 — continuation**: 산출물이 많은 화면 (Java 4종 + SP 3개 + MENU + JSX) → max_tokens hit 발생하면 `↻ 이어서 받는 중 (2/3차)` 표시 + 누적 리스트 유지 확인.
3. **CLI 모드**: `LLM_BACKEND=cli` 로 백엔드 재기동 → 동일 시나리오 → phase 4개는 실시간, file 이벤트는 STREAM_END 직전 일괄 emit. "Claude (CLI) 응답 수신 중… 45s" 라벨 확인.
4. **SSE 끊김 fallback**: 네트워크 끊고 재시도 → "스트리밍 불가, 직접 응답 받는 중…" 후 결과 정상 표시.
5. **자동 보완**: 의도적으로 잘못된 SP 컬럼명을 추가한 NL 입력 → 자동 보완 트리거 시 헤더에 `🤖 AI 자동보완 중` + 그 아래 채팅에 `<ChatProgress>` 동시 노출 확인.
6. **chatCollapsed 분기**: 채팅 접고 → 헤더 토스트만 보이고 채팅 버블 X. 다시 펼치고 → 채팅 버블만 보이고 헤더 토스트 X.
7. **NEW_STEP Step 4**: 캡처 2 의 이중 노출이 사라지고 한 자리만 보이는지 확인.

---

## 11. 미해결 / 후속 고려

- **Anthropic prompt cache 검증**: stream + cache_control 조합이 `cache_read` 통계에 정상 잡히는지 (rules/50 §16.1) — 백엔드 로그로 확인 필요.
- **`POST /chat` 제거 시점**: 새 endpoint 가 1~2주 안정 동작하면 fallback 제거 PR 검토.
- **continuation 진행률 표시**: 현재는 "round/remaining" 만 표시 — 토큰 비율 (예: "현재 round 의 60%") 까지 표시할지 후속 검토.
- **WebSocket 으로 전환**: 다중 사용자 / 다중 세션 동시 진행 시 SSE 한계가 보이면 WebSocket 검토 (현재는 SSE 로 충분).

---

## 12. 참조

- `rules/50-composer-standalone-runtime.md §13.5` — `ArtifactExtractor.FILE_BLOCK` 정규식 3가지 변형
- `rules/50-composer-standalone-runtime.md §14.3` — `previewStage` 헤더 토스트 UX 패턴 (참고 모델)
- `rules/50-composer-standalone-runtime.md §16.1` — Anthropic prompt cache 검증
- `docs/superpowers/specs/2026-06-02-llm-backend-cli-toggle-design.md` — LLM_BACKEND env 분기

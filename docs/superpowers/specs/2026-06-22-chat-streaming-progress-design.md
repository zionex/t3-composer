# Chat Streaming Progress — 자연어 화면 생성 단계별 진행 표시

**작성일**: 2026-06-22
**작성자**: youngeun_park@zionex.com (with Claude Opus 4.7)
**상태**: Implemented (2026-06-22) — 본 문서는 실제 구현 결과를 반영해 갱신됨

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

> ⚠️ **별도 keep-alive interval 을 mergeWith 로 붙이지 말 것.**
> 시도해 보고 발견된 사고 (2026-06-22): `.mergeWith(Flux.interval(15s).takeUntilOther(Flux.never()))` 로
> nginx idle timeout 방지하려 했으나, `Flux.never()` 는 영원히 emit 안 함 → keep-alive interval 이
> `sink.complete()` 후에도 계속 발화 → HTTP 응답 채널 안 닫힘 → 프런트 `reader.read()` 가
> `:keep-alive` comment 만 받으며 무한 대기 → 마지막 phase(SAVE) 에 stuck.
>
> Anthropic delta 자체가 1초 미만 간격으로 emit 되어 idle 없음 — 별도 keep-alive 불필요.
> 실제 구현은 `.map(this::toSse)` 단독.

### 5.3 `StreamPhaseEmitter` — 핵심 파싱

핵심 책임:
- Anthropic SSE event 의 `content_block_delta` 의 `delta.text` 를 누적 buffer 에 append
- `===FILE: <path>===` 마커 검출 시 즉시 `file` event sink emit
- `message_delta` 의 `stop_reason` · `usage` 캡처 (continuation 판단 / 통계용)

`FILE_MARKER` 정규식:
```java
private static final Pattern FILE_MARKER = Pattern.compile(
        "^[ \\t]*===\\s*FILE:\\s*([^\\n=]+?)(?:\\s*===)?[ \\t]*$",
        Pattern.MULTILINE);
```
trailing `===` 는 optional (rules/50 §13.5 의 3가지 변형 호환).

#### ⚠️ 완성 줄만 스캔 (필수 가드)

```java
private void scanForFileMarkers() {
    int safeEnd = buf.lastIndexOf("\n");
    if (safeEnd < 0 || safeEnd < scanFrom) return;   // 새 완성 줄 없음
    String safe = buf.substring(0, safeEnd + 1);
    Matcher m = FILE_MARKER.matcher(safe);
    if (!m.find(scanFrom)) { scanFrom = safeEnd + 1; return; }
    do {
        String path = m.group(1) == null ? "" : m.group(1).trim();
        if (path.isEmpty() || seenPaths.contains(path)) continue;
        seenPaths.add(path);
        fileCount++;
        sink.next(ChatStreamEvent.file(
                fileCount,
                artifactExtractor.fileNameOf(path),
                artifactExtractor.classifyByPath(path),
                path));
    } while (m.find());
    scanFrom = safeEnd + 1;
}
```

**왜 마지막 `\n` 까지만 스캔?** `Pattern.MULTILINE` 의 `$` 가 end-of-line 뿐 아니라 **end-of-input** 도 line-end 로 인정함. Anthropic delta 가 마커 라인을 도중에 끊으면 (예: `===FILE: /backend/src/main/java/` 까지만 도착) 정규식이 false positive 매칭 → `accountmonthlydemand` 같은 fragment 가 path 로 잡혀 중복 file event 발화. 다음 delta 에서 진짜 path 가 다시 매칭 → 같은 파일이 두 번. 마지막 `\n` 직전까지의 substring 만 정규식에 넘기면 미완성 라인은 자연 대기 (2026-06-22 발견 · 수정).

`seenPaths` set 은 같은 path 의 중복 emit 추가 방지 (delta 가 mid-token 으로 끊겨도 안전).

`classifyByPath` / `fileNameOf` 는 `ArtifactExtractor` 에 새로 추가한 public 래퍼 — 기존 private `classifyArtifact(path, language)` / `extractFileName(path)` 위임. 새 분류기 만들지 않음.

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

`ChatPanel.jsx:226` 의 "응답 중..." Stack 을 교체. **헤더 한 줄만 표시** (사용자 요청 — 2026-06-22 · 누적 파일 리스트는 시각 노이즈로 판단). 작성 중인 파일명이 헤더 본문에 노출되므로 별도 리스트 불필요.

```jsx
const PHASE_TEXT = {
  PROMPT:       '🪄 요구사항 분석 중…',
  STREAM_START: '✨ Claude 응답 수신 중…',
  STREAM_END:   '📋 산출물 추출 준비 중…',
  CONTINUATION: '↻ 이어서 받는 중…',
  EXTRACT:      '📋 산출물 추출 중…',
  SAVE:         '💾 저장 중…',
};

function ChatProgress({ progress }) {
  if (!progress) return null;
  const { phase, files = [], elapsedMs = 0, tokens, error, continuationRound } = progress;
  const sec = Math.max(0, Math.floor(elapsedMs / 1000));

  if (error) return <ErrorBubble {...error} />;

  // 작성 중인 파일이 있으면 그 파일명을 헤더에 노출, 없으면 phase 라벨
  let headerText = PHASE_TEXT[phase] || `진행 중… (${phase || ''})`;
  if ((phase === 'STREAM_START' || phase === 'CONTINUATION') && files.length > 0) {
    headerText = `📄 ${files[files.length - 1].name} 작성 중…`;
  } else if (phase === 'STREAM_START' && tokens && tokens > 0) {
    headerText = `✨ Claude 응답 수신 중… (${tokens.toLocaleString()} 토큰)`;
  }

  return (
    <Stack direction="row" spacing={1.5} sx={{ my: 1.5 }}>
      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
        <SmartToyIcon fontSize="small" />
      </Avatar>
      <Paper variant="outlined" sx={{ p: 1.5, minWidth: 280, flex: 1, maxWidth: 560 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CircularProgress size={14} />
          <Typography variant="body2" sx={{ flex: 1, fontWeight: 600, color: '#1e40af' }}>
            {headerText}
          </Typography>
          {continuationRound > 1 && (
            <Typography variant="caption" sx={{ color: '#7c3aed', fontWeight: 700 }}>
              {continuationRound}차
            </Typography>
          )}
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
            {sec}s
          </Typography>
        </Stack>
      </Paper>
    </Stack>
  );
}
```

렌더 결과 예시 (헤더 한 줄):
```
🤖 ┌────────────────────────────────────────────────────────┐
   │ ⏳ 📄 SP_UI_UT_01_Q1.sql 작성 중…              18s    │
   └────────────────────────────────────────────────────────┘
```

### 6.3 헤더 토스트 — `genStatus` 데이터 흐름 enrich (별도 컴포넌트 X)

`ComposerWorkspace.jsx:740` 의 기존 `genStatus` 헤더 토스트를 **그대로 재사용** — 별도 `<HeaderProgressBar>` 컴포넌트 만들지 않음. ChatPanel 이 `onGenStatus` 콜백으로 stream progress 의 풍부한 필드 (`streamPhase` · `files` · `tokens` · `continuationRound`) 를 전달하고, ComposerWorkspace 의 `formatGenStatusText(gs)` 헬퍼가 한 줄 한글 문구로 변환:

```jsx
// ComposerWorkspace.jsx — 파일 상단 헬퍼
function formatGenStatusText(gs) {
  if (!gs || !gs.streamPhase) return '🪄 화면 생성 중…';
  const { streamPhase: sp, files = [], tokens, continuationRound } = gs;
  const round = (continuationRound > 1) ? ` (${continuationRound}차)` : '';
  switch (sp) {
    case 'PROMPT':       return '🪄 요구사항 분석 중…';
    case 'STREAM_START':
    case 'CONTINUATION':
      if (files.length > 0) return `📄 ${files.length}개 작성 중 / ${files[files.length - 1].name}${round}`;
      if (tokens > 0)       return `✨ Claude 응답 수신 중… (${tokens.toLocaleString()} 토큰)${round}`;
      return `✨ Claude 응답 수신 중…${round}`;
    case 'STREAM_END':   return `📋 산출물 추출 준비 중… (${files.length}개)`;
    case 'EXTRACT':      return `📋 산출물 추출 중… (${files.length}개)`;
    case 'SAVE':         return `💾 저장 중… (${files.length}개)`;
    default:             return '🪄 화면 생성 중…';
  }
}
```

ChatPanel 의 `useEffect([stream.progress, sending])` 가 `setProgress` 마다 부모로 풍부한 payload 발송:
```jsx
onGenStatus({
  phase: 'sending',
  streamPhase: p.phase,
  files: p.files,
  elapsedMs: p.elapsedMs,
  tokens: p.tokens,
  continuationRound: p.continuationRound,
  error: p.error,
});
```

기존 `genStatus.phase` (`'sending'|'done'|'error'`) 분기 + `genStatus.message` 는 유지 — 에러/재시도 UI 그대로.

### 6.4 `ChatPanel.jsx` 의 sendMessage 교체

기존 `zAxios.post('chat')` → `useChatStream().send()` 로 교체. `forwardRef` + `useImperativeHandle({ sendMessage })` API 시그니처는 유지 — 자동 보완(ComposerWorkspace) 이 그대로 호출.

### 6.5 헤더 토스트 vs 채팅 버블 중복 방지

캡처 2 처럼 두 자리 모두 동일 정보 중복은 시각 노이즈. **chatCollapsed prop 기반 분기**로 한 자리만 노출:

- `chatCollapsed === true` (NEW_STEP Step 4) → 헤더 토스트만. 채팅 영역의 `<ChatProgress>` 는 ChatPanel 내부에서 자체 억제 (`{sending && !chatCollapsed && ...}`).
- `chatCollapsed === false` (NEW_NL · 자유 채팅) → 채팅 버블 `<ChatProgress>` 만. 헤더 토스트는 그 조건절 `{chatCollapsed && ...}` 로 자연 생략.

**`chatCollapsed` 전달 흐름** — ComposerWorkspace 가 ChatPanel 두 곳 (chatCollapsed=true 분기 / false 분기 동일) 에 prop 전달:
```jsx
<ChatPanel
  ref={chatRef}
  sessionId={session.id}
  onNewAssistantMsg={triggerRefresh}
  onGenStatus={setGenStatus}
  initialPrompt={initialPrompt}
  initialAttachments={initialAttachments}
  chatCollapsed={chatCollapsed}    // ← 신규
/>
```

ChatPanel:
```jsx
{sending && !chatCollapsed && (stream.progress
  ? <ChatProgress progress={stream.progress} />
  : <PlainSpinner text="요청 전송 중..." />)}
```

**`genStatus` state — 제거 안 함 · enrich** (spec 초안에서 "제거" 라고 적었으나 실제로는 유지):
- `genStatus.phase` (`'sending'|'done'|'error'`) 와 `genStatus.message` 의 에러/재시도 흐름은 그대로 보존
- `streamPhase` · `files` · `tokens` · `continuationRound` · `elapsedMs` 필드만 추가로 실어 보냄
- 기존 `formatGenStatusText(gs)` 헬퍼가 streamPhase 유무로 분기

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

## 9. 영향 받는 파일 (실제)

### 신규
- `backend/src/main/java/com/zionex/t3composer/domain/dto/ChatStreamEvent.java` — SSE event payload + factory helpers (`phase` · `file` · `done` · `error`)
- `backend/src/main/java/com/zionex/t3composer/domain/service/StreamPhaseEmitter.java` — Anthropic SSE 누적 + `===FILE:` 마커 감지 (완성 줄만 스캔 가드)
- `backend/src/main/java/com/zionex/t3composer/domain/service/ComposerStreamingService.java` — Flux 조립 + continuation 재귀 + persist
- `frontend/src/view/util/t3composer/useChatStream.js` — fetch + ReadableStream 으로 SSE 소비
- `frontend/src/view/util/t3composer/ChatProgress.jsx` — 헤더 한 줄 진행 표시 (파일 리스트 X)

### 수정
- `backend/.../ComposerController.java` — `POST /sessions/{id}/chat-stream` endpoint 추가 + `ComposerStreamingService` 주입
- `backend/.../ComposerService.java` — `buildRequest(...)` package-private → **public** · `nextTurnSeqPublic(...)` · `CONTINUE_PROMPT_PUBLIC` 노출
- `backend/.../ArtifactExtractor.java` — public `classifyByPath(path)` · `fileNameOf(path)` 래퍼 추가 (기존 `classifyArtifact` private 유지)
- `frontend/.../ChatPanel.jsx` — `useChatStream` 통합 · `send()` SSE 우선 + 실패 시 `sendChat` fallback · `chatCollapsed` prop 받아 내부 ChatProgress 억제 · `onGenStatus` 에 streamPhase/files/tokens enrich
- `frontend/.../ComposerWorkspace.jsx` — `formatGenStatusText(gs)` 헬퍼 추가 · 헤더 토스트 본문 enrichment · ChatPanel 호출에 `chatCollapsed` prop 전달

### 무변경 (재사용)
- `backend/.../ApiLlmClient.java` — 이미 구현된 `streamMessages()` 활성화만 (HTTP API)
- `backend/.../CliLlmClient.java` · `SseEventTranslator.java` — CLI 모드 streaming 변환 그대로
- `backend/.../ArtifactPersistService.java` — `saveWithSupersede` 그대로
- 기존 `POST /sessions/{id}/chat` endpoint — fallback 용 유지

---

## 10. 검증 계획

**실제 검증 (2026-06-22)**:

1. ✅ **API 모드 — 정상 흐름**: NEW_STEP Step 4 로 `MOCKUP_dash_inventory_state` 화면 생성. 채팅에 `🪄 요구사항 분석 중…` → `✨ Claude 응답 수신 중…` → `📄 InventoryState.jsx 작성 중…` → 다음 파일들 순차 → `📋 산출물 추출 중…` → `💾 저장 중…` → done. 산출물 트리에 파일 정상 노출.
2. ✅ **NEW_STEP Step 4 — 한 자리만 노출**: 캡처 2 의 이중 노출 (헤더 + 채팅 버블) 사라짐. chatCollapsed=true → 헤더 토스트만 표시. chatCollapsed=false (자유 채팅) → 채팅 버블만 표시.
3. ✅ **continuation 흐름** (간접): max_tokens hit 시 partial assistant message 저장 후 `CONTINUE_PROMPT` 추가 + 재귀 호출 코드 경로 점검.

**미수행** (회귀 시 확인):
- CLI 모드 (`LLM_BACKEND=cli`) full 시나리오
- SSE 끊김 fallback (`fetch()` 실패 → `sendChat` 재호출)
- 자동 보완 (autofix) 시 동시 노출

---

## 11. 미해결 / 후속 고려 + 회고

### 후속 작업
- **Anthropic prompt cache 검증**: stream + cache_control 조합이 `cache_read` 통계에 정상 잡히는지 (rules/50 §16.1) — 백엔드 로그로 확인 필요.
- **`POST /chat` 제거 시점**: 새 endpoint 가 1~2주 안정 동작하면 fallback 제거 PR 검토.
- **continuation 진행률 표시**: 현재는 "round/remaining" 만 표시 — 토큰 비율 (예: "현재 round 의 60%") 까지 표시할지 후속 검토.
- **WebSocket 으로 전환**: 다중 사용자 / 다중 세션 동시 진행 시 SSE 한계가 보이면 WebSocket 검토 (현재는 SSE 로 충분).

### 회고 — 구현 중 발견된 사고 (rules/50 의 anti-pattern 카탈로그 후보)

| # | 사고 | 근본 원인 | 해결 |
|---|---|---|---|
| 1 | `StreamPhaseEmitter` 가 garbage path emit (예: `accountmonthlydemand`, ` `, `t3series` 같은 fragment) | `Pattern.MULTILINE` 의 `$` 가 end-of-input 도 line-end 로 인정 → Anthropic delta 가 마커 라인을 중간에서 끊으면 partial path 매칭 후 진짜 path 매칭으로 중복 emit | `scanForFileMarkers` 가 buffer 의 마지막 `\n` 까지의 substring 만 정규식에 넘기도록 변경 (§5.3) |
| 2 | "💾 저장 중…" 에서 7분+ stuck. 실제 백엔드는 정상 저장 완료 | `Flux.create(...).map(toSse).mergeWith(Flux.interval(15s).takeUntilOther(Flux.never()))` — `Flux.never()` 는 영원히 emit 안 함 → keep-alive interval 이 `sink.complete()` 후에도 계속 발화 → HTTP 응답 채널 안 닫힘 → 프런트 `reader.read()` 가 `:keep-alive` comment 만 받으며 무한 대기 | `mergeWith(keep-alive)` 통째 제거. Anthropic delta 자체가 1초 미만 간격으로 emit 되어 idle 없으므로 별도 keep-alive 불필요 (§5.2) |
| 3 | `buf.lastIndexOf('\n')` 컴파일 실패 — `The method lastIndexOf(String) ... is not applicable for the arguments (char)` | `StringBuilder.lastIndexOf` 는 `String` 시그니처만 — `String.lastIndexOf` 와 다름 (String 은 char 도 받음). 첫 구현은 `"\n"` 으로 정상 작성했으나 두 번째 수정에서 char literal 로 잘못 변경 | `"\n"` 으로 복원. Spring DevTools 가 hot-recompile 시점에 오류 검출해 SSE error event 로 전파 — 정확히 본 흐름대로 사용자에게 노출됨 (의도된 graceful degradation) |
| 4 | NEW_STEP Step 4 에서 진행 표시가 두 자리(헤더 + 채팅 버블) 동시 노출 — 시각 노이즈 | spec §6.5 의 분기 의도 ("chatCollapsed → 헤더만") 가 ChatPanel 내부에서 강제되지 않음. ChatPanel 이 `chatCollapsed` prop 모름 | ChatPanel 에 `chatCollapsed` prop 추가 + `{sending && !chatCollapsed && ...}` 가드로 내부 ChatProgress 자체 억제. 사용자 의사결정으로 "헤더만 유지" 선택 (§6.5) |
| 5 | 누적 파일 리스트 (✓/✏️ + type 라벨) 가 visual noise | spec §6.2 가 디테일한 리스트를 제안했으나 실제 사용자 경험에서는 헤더 한 줄로 충분 (현재 작성 중 파일명이 헤더에 노출되므로) | 파일 리스트 통째 제거 — `<ChatProgress>` 가 헤더 한 줄만 표시 (§6.2) |

---

## 12. 참조

- `rules/50-composer-standalone-runtime.md §13.5` — `ArtifactExtractor.FILE_BLOCK` 정규식 3가지 변형
- `rules/50-composer-standalone-runtime.md §14.3` — `previewStage` 헤더 토스트 UX 패턴 (참고 모델)
- `rules/50-composer-standalone-runtime.md §16.1` — Anthropic prompt cache 검증
- `docs/superpowers/specs/2026-06-02-llm-backend-cli-toggle-design.md` — LLM_BACKEND env 분기

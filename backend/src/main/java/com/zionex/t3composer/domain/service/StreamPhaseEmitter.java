package com.zionex.t3composer.domain.service;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3composer.domain.dto.ChatStreamEvent;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.FluxSink;

/**
 * 한 streaming 호출당 1 인스턴스 — Anthropic SSE event 의 raw JSON 데이터를 받아
 *
 *  1. 누적 텍스트 buffer 에 delta 추가
 *  2. 새 ===FILE: 마커가 발견되면 즉시 {@link ChatStreamEvent#file} 발화
 *  3. stop_reason / usage 추적
 *
 * 출력: {@link FluxSink} 로 ChatStreamEvent 를 push.
 *
 * NOTE — Anthropic SSE 의 data 필드는 JSON 문자열. 본 emitter 는 그 문자열을 직접
 *   파싱한다 ({@link com.zionex.t3composer.domain.client.AnthropicModels.StreamEvent}
 *   객체로 매핑하지 않음 — content_block_delta 안의 delta.text 만 필요).
 */
@Slf4j
public class StreamPhaseEmitter {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /**
     * ===FILE: <path>=== (또는 끝의 === 없는 변형) 줄 단위 매칭.
     * 산출물 추출의 권위 정규식은 {@link ArtifactExtractor#FILE_BLOCK} (다행 펜스 포함).
     * 본 emitter 는 streaming 도중 진척률만 띄우기 위한 마커 헤더만 감지 — content 캡처 X.
     *   - lookahead/lookbehind 없이 단순 line-anchored match (Pattern.MULTILINE)
     *   - 줄바꿈 직후의 ===FILE: 만 매칭 (실제 LLM 출력의 모든 변형 A/B/C 가 줄 시작에 등장)
     */
    private static final Pattern FILE_MARKER = Pattern.compile(
            "^[ \\t]*===\\s*FILE:\\s*([^\\n=]+?)(?:\\s*===)?[ \\t]*$",
            Pattern.MULTILINE);

    private final FluxSink<ChatStreamEvent> sink;
    private final ArtifactExtractor artifactExtractor;

    private final StringBuilder buf = new StringBuilder();
    private int fileCount = 0;
    private int scanFrom = 0;
    /** 같은 파일 경로의 중복 emit 방지 — Anthropic delta 가 마커 라인을 두 토막에 걸쳐 보낼 수 있어 */
    private final Set<String> seenPaths = new HashSet<>();

    private int outputTokens = 0;
    private int inputTokens = 0;
    private String stopReason;
    private String messageIdFromStream;
    private String modelFromStream;

    public StreamPhaseEmitter(FluxSink<ChatStreamEvent> sink, ArtifactExtractor artifactExtractor) {
        this.sink = sink;
        this.artifactExtractor = artifactExtractor;
    }

    /**
     * Anthropic SSE event 1개 처리. event name 별 분기:
     *   - message_start         : id/model 추출
     *   - content_block_delta   : delta.text 누적 + 마커 스캔 → file event 발화
     *   - message_delta         : stop_reason 추출
     *   - message_stop / ping   : no-op (호출자가 stream end 처리)
     */
    public void onAnthropicEvent(String eventName, String jsonData) {
        if (jsonData == null || jsonData.isBlank()) return;
        JsonNode node;
        try {
            node = MAPPER.readTree(jsonData);
        } catch (Exception e) {
            log.warn("StreamPhaseEmitter — Anthropic SSE JSON parse 실패 event={} data={}", eventName, jsonData);
            return;
        }
        String type = textOf(node.path("type"));
        // event header 우선, 없으면 JSON 의 type 필드
        String t = (eventName != null && !eventName.isBlank()) ? eventName : type;
        switch (t) {
            case "message_start":
                handleMessageStart(node);
                break;
            case "content_block_delta":
                handleContentBlockDelta(node);
                break;
            case "message_delta":
                handleMessageDelta(node);
                break;
            case "content_block_start":
            case "content_block_stop":
            case "message_stop":
            case "ping":
            default:
                // no-op — phase 전환은 호출자(ComposerStreamingService) 가 발화
                break;
        }
    }

    private void handleMessageStart(JsonNode node) {
        JsonNode msg = node.path("message");
        messageIdFromStream = textOf(msg.path("id"));
        modelFromStream     = textOf(msg.path("model"));
        JsonNode usage = msg.path("usage");
        Integer inTok  = usage.path("input_tokens").isMissingNode()  ? null : usage.path("input_tokens").asInt();
        if (inTok != null) inputTokens = inTok;
    }

    private void handleContentBlockDelta(JsonNode node) {
        JsonNode delta = node.path("delta");
        String text = textOf(delta.path("text"));
        if (text == null || text.isEmpty()) return;
        buf.append(text);
        // 토큰 카운트 추정 — 정확도보다는 "응답이 살아있다" 신호 (1 token ≈ 3 chars 보수적)
        outputTokens += Math.max(1, text.length() / 3);
        scanForFileMarkers();
    }

    private void handleMessageDelta(JsonNode node) {
        JsonNode delta = node.path("delta");
        String stop = textOf(delta.path("stop_reason"));
        if (stop != null && !stop.isEmpty()) stopReason = stop;
        // 누적 usage — message_delta 가 output_tokens 정확값을 줌
        JsonNode usage = node.path("usage");
        if (!usage.path("output_tokens").isMissingNode()) {
            outputTokens = usage.path("output_tokens").asInt(outputTokens);
        }
        if (!usage.path("input_tokens").isMissingNode()) {
            inputTokens = usage.path("input_tokens").asInt(inputTokens);
        }
    }

    /**
     * buffer 의 scanFrom 위치부터 ===FILE: 마커 검색. 발견되면 file event 발화 + scanFrom 갱신.
     *
     * ⚠️ 완성 줄만 스캔 (마지막 '\n' 까지) — 스트리밍 chunk 가 마커 라인을 중간에서 끊을 경우
     *   Pattern.MULTILINE 의 `$` 가 end-of-buffer 도 line-end 로 인정해 부분 매칭이 일어남
     *   (예: `===FILE: /backend/src/main/java/` 까지만 도착하면 path=`/backend/src/main/java/`
     *    로 false positive — 다음 chunk 에서 진짜 path 가 다시 매칭되어 중복 file event).
     *   이를 막기 위해 buffer 의 마지막 `\n` 까지의 substring 만 정규식에 넘긴다 — 미완성 라인은
     *   다음 delta 누적 후 자연 처리.
     */
    private void scanForFileMarkers() {
        int safeEnd = buf.lastIndexOf("\n");
        if (safeEnd < 0 || safeEnd < scanFrom) return;   // 새 완성 줄 없음
        String safe = buf.substring(0, safeEnd + 1);
        Matcher m = FILE_MARKER.matcher(safe);
        if (!m.find(scanFrom)) {
            scanFrom = safeEnd + 1;
            return;
        }
        do {
            String path = m.group(1) == null ? "" : m.group(1).trim();
            if (path.isEmpty() || seenPaths.contains(path)) continue;
            seenPaths.add(path);
            fileCount++;
            String type = artifactExtractor.classifyByPath(path);
            String name = artifactExtractor.fileNameOf(path);
            sink.next(ChatStreamEvent.file(fileCount, name, type, path));
        } while (m.find());
        scanFrom = safeEnd + 1;
    }

    private static String textOf(JsonNode n) {
        if (n == null || n.isMissingNode() || n.isNull()) return "";
        return n.asText("");
    }

    // ---- getters (ComposerStreamingService 가 stream 종료 후 사용) ----

    public String fullText()       { return buf.toString(); }
    public int    outputTokens()   { return outputTokens; }
    public int    inputTokens()    { return inputTokens; }
    public String stopReason()     { return stopReason; }
    public int    fileCount()      { return fileCount; }
    public String streamMessageId(){ return messageIdFromStream; }
    public String streamModel()    { return modelFromStream; }
    public boolean isTruncated()   { return "max_tokens".equals(stopReason); }

    /** continuation round 간 누적 토큰 유지용 — 새 round 의 emitter 에 전달 */
    public void seedFromPrevious(int prevInputTokens, int prevOutputTokens) {
        this.inputTokens  += prevInputTokens;
        this.outputTokens += prevOutputTokens;
    }

    /** continuation round 시작 시 직전 round 의 fileCount 를 이어받아 idx 가 단조 증가하도록 */
    public void seedFileCount(int previousFileCount) {
        this.fileCount = previousFileCount;
    }

    /** done event 의 metadata 용 — 누적 tokens · stopReason · fileCount 요약 */
    public Map<String, Object> summary() {
        Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("inputTokens",  inputTokens);
        m.put("outputTokens", outputTokens);
        m.put("stopReason",   stopReason);
        m.put("fileCount",    fileCount);
        return m;
    }
}

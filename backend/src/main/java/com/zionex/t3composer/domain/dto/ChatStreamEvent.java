package com.zionex.t3composer.domain.dto;

import java.util.LinkedHashMap;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Composer chat streaming 의 SSE event payload — `/composer/sessions/{id}/chat-stream` 에서 emit.
 *
 * 이벤트 종류 (rules: docs/superpowers/specs/2026-06-22-chat-streaming-progress-design.md §7):
 *  - phase  : {phase, ...} — 흐름 단계 전환 (PROMPT / STREAM_START / STREAM_END / EXTRACT / SAVE / CONTINUATION)
 *  - file   : {idx, name, type, path} — ===FILE: 마커 누적 감지 시
 *  - done   : {messageId, artifacts:[{id,type,name}]} — stream 마지막
 *  - error  : {phase, message, recoverable} — 단계 실패
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChatStreamEvent {

    /** "phase" | "file" | "done" | "error" — SSE event 이름과 동일 */
    private String event;

    /** event-specific payload — 프런트에서 그대로 파싱 */
    private Map<String, Object> data;

    // ---- Factory helpers — 백엔드 코드 가독성 ----

    public static ChatStreamEvent phase(String phase) {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("phase", phase);
        return new ChatStreamEvent("phase", d);
    }

    public static ChatStreamEvent phase(String phase, Map<String, Object> extra) {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("phase", phase);
        if (extra != null) d.putAll(extra);
        return new ChatStreamEvent("phase", d);
    }

    public static ChatStreamEvent file(int idx, String name, String type, String path) {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("idx", idx);
        d.put("name", name);
        d.put("type", type);
        if (path != null) d.put("path", path);
        return new ChatStreamEvent("file", d);
    }

    public static ChatStreamEvent done(String messageId, Object artifacts) {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("messageId", messageId);
        d.put("artifacts", artifacts);
        return new ChatStreamEvent("done", d);
    }

    public static ChatStreamEvent error(String phase, String message, boolean recoverable) {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("phase", phase);
        d.put("message", message == null ? "" : message);
        d.put("recoverable", recoverable);
        return new ChatStreamEvent("error", d);
    }
}

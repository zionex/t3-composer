import { useCallback, useRef, useState } from 'react';

/**
 * Composer chat streaming hook — `POST /composer/sessions/{id}/chat-stream` 의 SSE 응답 소비.
 *
 * 디자인 문서: docs/superpowers/specs/2026-06-22-chat-streaming-progress-design.md
 *
 * 반환:
 *   send(sessionId, message, attachments, attachmentArtifactIds)
 *     → Promise<{ ok, messageId, artifacts, error }>
 *   cancel() : 진행 중 stream abort (AbortController)
 *   sending  : boolean
 *   progress : null | {
 *     phase: 'PROMPT'|'STREAM_START'|'STREAM_END'|'EXTRACT'|'SAVE'|'CONTINUATION',
 *     files: [{ idx, name, type, path }],
 *     elapsedMs: number,
 *     tokens: number,                  // 누적 output tokens (추정)
 *     error: { message, recoverable } | null,
 *     startedAt: number,               // Date.now()
 *   }
 *   reset()   : progress 만 초기화 (sending 영향 없음)
 *
 * 구현 노트:
 *  - EventSource 미사용 (POST body 미지원). fetch + ReadableStream 으로 직접 SSE 파싱.
 *  - elapsedMs 는 매 100ms tick — UI 의 경과 시간 표시 동기화. stream 끝나면 timer 자동 정리.
 *  - cancel() 은 AbortController.abort() — 백엔드 Flux sink dispose 신호 (best-effort).
 */
export function useChatStream() {
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(null);
  const ctrlRef = useRef(null);
  const tickerRef = useRef(null);

  const reset = useCallback(() => {
    setProgress(null);
    if (tickerRef.current) {
      window.clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  }, []);

  const startTicker = useCallback(() => {
    if (tickerRef.current) window.clearInterval(tickerRef.current);
    tickerRef.current = window.setInterval(() => {
      setProgress((p) => {
        if (!p || !p.startedAt) return p;
        return { ...p, elapsedMs: Date.now() - p.startedAt };
      });
    }, 200);
  }, []);

  const stopTicker = useCallback(() => {
    if (tickerRef.current) {
      window.clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    if (ctrlRef.current) ctrlRef.current.abort();
  }, []);

  const send = useCallback(async (sessionId, message, attachments, attachmentArtifactIds) => {
    if (!sessionId || !message) return { ok: false, error: 'sessionId/message 누락' };

    setSending(true);
    const startedAt = Date.now();
    setProgress({
      phase: 'PROMPT',
      files: [],
      elapsedMs: 0,
      tokens: 0,
      error: null,
      startedAt,
    });
    startTicker();
    ctrlRef.current = new AbortController();

    let result = { ok: false, messageId: null, artifacts: [], error: null };

    try {
      const url = `${composerUrlBase()}/composer/sessions/${encodeURIComponent(sessionId)}/chat-stream`;
      const resp = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ message, attachments, attachmentArtifactIds }),
        signal: ctrlRef.current.signal,
      });

      if (!resp.ok || !resp.body) {
        const text = await resp.text().catch(() => '');
        throw new Error(`HTTP ${resp.status} — ${text || 'stream 응답 없음'}`);
      }

      const reader = resp.body.getReader();
      const dec = new TextDecoder('utf-8');
      let buf = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const { events, remainder } = parseSseFrames(buf);
        buf = remainder;
        for (const evt of events) {
          if (evt.event === 'done') {
            const data = safeJson(evt.data);
            result = { ok: true, messageId: data?.messageId, artifacts: data?.artifacts || [], error: null };
          } else if (evt.event === 'error') {
            const data = safeJson(evt.data) || {};
            const err = { message: data.message || '오류', recoverable: !!data.recoverable, phase: data.phase };
            setProgress((p) => p ? { ...p, error: err } : p);
            result = { ok: false, messageId: null, artifacts: [], error: err };
          } else {
            // phase / file
            applyEvent(evt, setProgress);
          }
        }
      }
    } catch (e) {
      if (e?.name === 'AbortError') {
        result = { ok: false, error: { message: '사용자 취소', recoverable: false } };
      } else {
        const msg = e?.message || '스트리밍 실패';
        setProgress((p) => p ? { ...p, error: { message: msg, recoverable: false } } : p);
        result = { ok: false, error: { message: msg, recoverable: false } };
      }
    } finally {
      stopTicker();
      // 진행 표시 자체는 잠시 더 유지 (사용자가 마지막 단계 확인) — 부모가 reset() 호출하면 정리
      setSending(false);
      ctrlRef.current = null;
    }

    return result;
  }, [startTicker, stopTicker]);

  return { send, cancel, reset, sending, progress };
}

// ──────────────────────────────────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────────────────────────────────

/**
 * 누적 SSE 텍스트 버퍼에서 완성된 event 프레임을 추출. 부분 프레임은 remainder 로 반환.
 *
 * SSE wire format:
 *   event: phase
 *   data: {"phase":"PROMPT"}
 *
 *   event: file
 *   data: {"idx":1,...}
 *
 * 프레임 구분: 빈 줄 ("\n\n"). data 가 여러 줄로 split 된 경우 (rare — Spring 은 보통 1줄)
 *   '\n' 으로 join 해 단일 data 로 합침.
 */
function parseSseFrames(buf) {
  const events = [];
  let remainder = buf;
  // 모든 프레임 분리자 — '\n\n' (Spring SSE 표준) 또는 '\r\n\r\n' (CRLF 환경)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const idx = findFrameBoundary(remainder);
    if (idx < 0) break;
    const frame = remainder.slice(0, idx);
    remainder = remainder.slice(idx).replace(/^(\r?\n){1,2}/, '');
    const parsed = parseSingleFrame(frame);
    if (parsed) events.push(parsed);
  }
  return { events, remainder };
}

function findFrameBoundary(s) {
  // \n\n 우선, \r\n\r\n 차선
  const a = s.indexOf('\n\n');
  const b = s.indexOf('\r\n\r\n');
  if (a < 0) return b;
  if (b < 0) return a;
  return Math.min(a, b);
}

function parseSingleFrame(frame) {
  if (!frame || !frame.trim()) return null;
  let event = 'message';
  const dataLines = [];
  for (const raw of frame.split(/\r?\n/)) {
    if (!raw) continue;
    if (raw.startsWith(':')) continue;  // SSE comment (예: keep-alive)
    const colon = raw.indexOf(':');
    const field = colon < 0 ? raw : raw.slice(0, colon);
    const value = colon < 0 ? '' : raw.slice(colon + 1).replace(/^ /, '');
    if (field === 'event') event = value;
    else if (field === 'data') dataLines.push(value);
    // id / retry 무시
  }
  if (event === 'message' && dataLines.length === 0) return null;
  return { event, data: dataLines.join('\n') };
}

function safeJson(s) {
  if (!s) return null;
  try { return JSON.parse(s); } catch (_e) { return null; }
}

function applyEvent(evt, setProgress) {
  const data = safeJson(evt.data);
  if (!data) return;
  if (evt.event === 'phase') {
    setProgress((p) => p ? {
      ...p,
      phase: data.phase || p.phase,
      tokens: data.tokens != null ? data.tokens : p.tokens,
      stopReason: data.stopReason || p.stopReason,
      saved: data.saved != null ? data.saved : p.saved,
      continuationRound: data.round != null ? data.round : p.continuationRound,
    } : p);
  } else if (evt.event === 'file') {
    setProgress((p) => p ? {
      ...p,
      files: [...p.files, { idx: data.idx, name: data.name, type: data.type, path: data.path }],
    } : p);
  }
}

/**
 * Composer 백엔드 URL base — zAxios 와 동일한 base 를 사용해야 함.
 * webpack proxy 가 모든 path 를 backend 로 forward 하므로 '' (현재 origin) 사용.
 */
function composerUrlBase() {
  return '';
}

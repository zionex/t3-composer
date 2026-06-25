import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

import {
  Box,
  Paper,
  TextField,
  IconButton,
  CircularProgress,
  Typography,
  Avatar,
  Chip,
  Stack,
  Tooltip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

import { zAxios } from '@wingui/common/imports';

import LlmMarkdown from '../../common/LlmMarkdown';
import { listMessages, sendChat } from './api';
import { useChatStream } from './useChatStream';
import ChatProgress from './ChatProgress';

/**
 * Composer 채팅 패널 — 3개 모드에서 공용 사용.
 *
 * props:
 *   sessionId         : 필수. 부모가 세션 생성 후 전달.
 *   onNewAssistantMsg : Claude 응답 도착 후 호출 (산출물 리스트 새로고침용)
 *   placeholder       : 입력창 placeholder
 *   initialPrompt     : 세션 최초 진입 시 자동 전송할 사용자 메시지 (선택)
 */
const ChatPanel = forwardRef(function ChatPanel(
  { sessionId, onNewAssistantMsg, placeholder, initialPrompt, initialAttachments,
    onGenStatus, chatCollapsed = false }, ref) {
  const { t } = useTranslation('wizard');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const initialSentRef = useRef(false);

  // 자유 채팅 D&D 첨부 — 텍스트는 message 본문에 inline, binary 는 attachments 로 전송.
  // ModeNewGeneral 의 동일 패턴을 그대로 옮겨옴 (text → fenced inline, binary → base64).
  const [attachments, setAttachments] = useState([]);   // [{kind:'text'|'binary', name, mediaType, base64?, text?, sizeKb, lang?}]
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const MAX_ATTACH = 5;
  const ATTACH_INLINE_CAP = 12000;
  const TEXT_EXTS = new Set([
    'txt','md','json','xml','sql','jsx','js','ts','tsx','java','yaml','yml','csv','html','css',
  ]);
  const isTextFile = (file) => {
    const mt = (file?.type || '').toLowerCase();
    if (mt.startsWith('text/') || mt.includes('json') || mt.includes('xml') || mt.includes('yaml')) return true;
    const ext = (file?.name?.split('.').pop() || '').toLowerCase();
    return TEXT_EXTS.has(ext);
  };
  const readAsText = (file) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
  const readAsBase64 = (file) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const url = String(r.result || '');
      const m = /^data:([^;]+);base64,(.+)$/.exec(url);
      if (m) resolve({ mediaType: m[1], base64: m[2] });
      else reject(new Error('invalid data url'));
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
  const handleFilesPicked = async (files) => {
    const arr = Array.from(files || []);
    if (arr.length === 0) return;
    const room = MAX_ATTACH - attachments.length;
    if (room <= 0) {
      setError(t('chat.attach.tooMany', { max: MAX_ATTACH }));
      return;
    }
    const take = arr.slice(0, room);
    if (arr.length > room) {
      setError(t('chat.attach.tooManyAdded', { max: MAX_ATTACH, n: take.length }));
    }
    for (const file of take) {
      try {
        const sizeKb = Math.round(file.size / 1024);
        if (file.size > 5 * 1024 * 1024) {
          setError(t('chat.attach.tooBig', { sizeKb, name: file.name }));
          continue;
        }
        if (isTextFile(file)) {
          const text = await readAsText(file);
          const lang = (file.name.split('.').pop() || '').toLowerCase();
          setAttachments((prev) => [...prev, {
            kind: 'text', name: file.name, mediaType: file.type || 'text/plain',
            sizeKb, lang, text,
          }]);
        } else {
          const { mediaType, base64 } = await readAsBase64(file);
          setAttachments((prev) => [...prev, {
            kind: 'binary', name: file.name, mediaType, base64, sizeKb,
          }]);
        }
      } catch (err) {
        setError(t('chat.attach.readFail', { name: file?.name || '', msg: err?.message || String(err) }));
      }
    }
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragOver(false);
    if (sending) return;
    handleFilesPicked(e.dataTransfer?.files);
  };
  const handleDragOver  = (e) => { e.preventDefault(); e.stopPropagation(); if (!sending) setDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); };
  const removeAttachment = (idx) => setAttachments((prev) => prev.filter((_, i) => i !== idx));

  // 클립보드 paste — 스크린샷 등 이미지 데이터가 있으면 file 로 변환해 첨부.
  // 텍스트 paste 는 default 동작(TextField 에 텍스트 삽입) 유지.
  const handlePaste = (e) => {
    if (sending) return;
    const items = e.clipboardData?.items;
    if (!items || items.length === 0) return;
    const files = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === 'file') {
        const f = it.getAsFile();
        if (f) {
          // 스크린샷은 보통 'image.png' 같은 generic 이름 — 시간 prefix 로 구분
          if (!f.name || /^image\.\w+$/i.test(f.name)) {
            const ext = (f.type.split('/')[1] || 'png').toLowerCase();
            const stamped = new File([f], `screenshot-${Date.now()}.${ext}`, { type: f.type });
            files.push(stamped);
          } else {
            files.push(f);
          }
        }
      }
    }
    if (files.length > 0) {
      e.preventDefault();   // 이미지가 있으면 텍스트 paste 동작 차단 (binary 데이터가 TextField 에 들어가지 않게)
      handleFilesPicked(files);
    }
  };

  // SSE 스트리밍 — 진행 단계별 표시. send() 와 병행 사용 (실패 시 non-streaming fallback).
  // 디자인 문서: docs/superpowers/specs/2026-06-22-chat-streaming-progress-design.md
  const stream = useChatStream();

  // stream.progress 변경 시 부모(ComposerWorkspace) 에 풍부한 progress 정보 전달.
  // 부모는 chatCollapsed 일 때 헤더 토스트에 같은 정보 노출.
  useEffect(() => {
    if (!onGenStatus) return;
    if (!sending) return;
    if (!stream.progress) {
      onGenStatus({ phase: 'sending' });
      return;
    }
    const p = stream.progress;
    onGenStatus({
      phase: 'sending',
      streamPhase: p.phase,
      files: p.files,
      elapsedMs: p.elapsedMs,
      tokens: p.tokens,
      continuationRound: p.continuationRound,
      error: p.error,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream.progress, sending]);

  const reload = async () => {
    if (!sessionId) return;
    try {
      const res = await listMessages(sessionId);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(t('chat.errorHistoryFail') + (e?.message || ''));
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    // 스크롤 하단 유지
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  useEffect(() => {
    // 초기 자동 메시지 1회 전송.
    // sendChat 직전 /auth/validate 로 세션 프리체크 — createSession 과 chat 사이
    // 짧은 공백에서 종종 401 이 발생하는 증상을 예방. 실패 시 명확한 안내 노출.
    if (initialPrompt && sessionId && !initialSentRef.current && !sending) {
      initialSentRef.current = true;
      (async () => {
        try {
          const res = await zAxios.get('auth/validate', {
            waitOn: false, errorMessage: false,
          });
          if (res?.data !== true) {
            setError(t('chat.errorSessionExpired'));
            return;
          }
        } catch (e) {
          // 401 은 전역 interceptor 가 처리, 그 외 네트워크 에러는 여기서 중단
          if (e?.response?.status === 401) return;
          setError(t('chat.errorSessionCheckFail') + (e?.message || ''));
          return;
        }
        // 첫 메시지에 D&D 첨부된 binary (이미지/PDF) 도 함께 전송
        send(initialPrompt, initialAttachments);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, initialPrompt]);

  // send — 사용자/프로그램(자동보완) 공용. 성공 시 true, 실패 시 false 반환.
  // SSE 스트리밍 (/composer/sessions/{id}/chat-stream) 으로 진행 단계별 표시.
  // 실패(연결 불가/4xx)면 기존 POST /chat 으로 fallback — 사용자에겐 결과는 동일.
  // attachOverride: 자동보완(프로그램 호출) 시 빈 배열로 두기 위한 명시 인자.
  //   미지정 시 state 의 attachments 사용 — text 파일은 message 본문에 inline,
  //   binary 파일만 attachments 배열로 백엔드 전달 (ModeNewGeneral 과 동일).
  const send = async (text, attachOverride) => {
    const baseMessage = (text ?? input).trim();
    const attachList = attachOverride !== undefined ? attachOverride : attachments;
    const textAttachs   = (attachList || []).filter((a) => a && a.kind === 'text');
    const binaryAttachs = (attachList || []).filter((a) => a && a.kind === 'binary');
    if (!baseMessage && textAttachs.length === 0 && binaryAttachs.length === 0) return false;
    let textInline = '';
    for (const a of textAttachs) {
      const full = a.text || '';
      const body = full.length > ATTACH_INLINE_CAP
        ? full.slice(0, ATTACH_INLINE_CAP) + `\n... (이하 생략 — 전체 ${full.length}자)`
        : full;
      textInline += `\n\n=== 첨부 파일: ${a.name} ===\n\`\`\`${a.lang || ''}\n${body}\n\`\`\`\n`;
    }
    const message = (baseMessage + textInline).trim();
    if (!message && binaryAttachs.length === 0) return false;
    setInput('');
    // 입력 영역 첨부 칩 클리어 — state attachments 를 send 인자로 캡쳐했으므로
    // 호출 전에 비워도 본 send 사이클은 영향 없음.
    if (attachOverride === undefined) setAttachments([]);
    setSending(true);
    if (onGenStatus) onGenStatus({ phase: 'sending' });
    setError(null);
    let ok = false;
    try {
      // 사용자 메시지를 먼저 화면에 낙관적으로 추가
      setMessages((prev) => [
        ...prev,
        {
          id: 'temp-' + Date.now(),
          role: 'user',
          content: message,
          turnSeq: (prev[prev.length - 1]?.turnSeq ?? 0) + 1,
          createDttm: new Date().toISOString(),
        },
      ]);

      // 1) Streaming 시도 — 진행 단계 실시간 표시
      const streamRes = await stream.send(sessionId, message, binaryAttachs);
      if (streamRes.ok) {
        await reload();
        if (onNewAssistantMsg) onNewAssistantMsg();
        ok = true;
        if (onGenStatus) onGenStatus({ phase: 'done' });
        stream.reset();
        return true;
      }

      // 2) Streaming 실패 시 fallback — non-streaming POST /chat
      //    (사용자 취소면 fallback 없이 종료)
      if (streamRes.error && /취소/.test(streamRes.error.message || '')) {
        ok = false;
        if (onGenStatus) onGenStatus({ phase: 'error', message: '사용자 취소' });
        return false;
      }
      console.warn('[ChatPanel] streaming 실패 — non-streaming POST /chat 으로 fallback:', streamRes.error);
      stream.reset();
      await sendChat(sessionId, message, undefined, binaryAttachs);
      await reload();
      if (onNewAssistantMsg) onNewAssistantMsg();
      ok = true;
      if (onGenStatus) onGenStatus({ phase: 'done' });
    } catch (e) {
      // 백엔드가 502 (Anthropic 오류) · 400 · 500 등을 반환하는 경우
      // data.message 에 사용자 친화적 메시지가 있음
      const data = e?.response?.data || {};
      let msg = data.message || data.error || e?.message || t('chat.errorSendFail');
      if (data.upstreamStatus) {
        msg = `${msg} (Anthropic ${data.upstreamStatus})`;
      }
      // 401 — JWT 검증 실패. 다만 서버 측 chat 은 이미 끝났을 수 있으므로
      // 먼저 listMessages 로 assistant 메시지가 새로 저장되었는지 확인.
      // 저장되어 있으면 "실제로는 성공" → artifact 재조회 후 정상 종료.
      if (e?.response?.status === 401) {
        try {
          const checkRes = await listMessages(sessionId);
          const msgs = Array.isArray(checkRes?.data) ? checkRes.data : [];
          const lastTurn = msgs[msgs.length - 1];
          if (lastTurn?.role === 'assistant') {
            // 서버 측은 성공했고 부수 요청만 401 → temp 롤백 후 UI 정상화
            setMessages(msgs);
            if (onNewAssistantMsg) onNewAssistantMsg();
            setError(null);
            ok = true;   // 실제로는 성공
          }
        } catch (_e) { /* no-op — 계속 에러 처리 */ }
        if (!ok) {
          msg = t('chat.errorAuthExpired');
        }
      }
      if (!ok) {
        // axios timeout (ECONNABORTED) — 세션 만료 아님을 명시.
        // 서버 측 continuation 루프는 클라이언트 단절 후에도 계속 진행되므로
        // 리로드만 하면 최종 결과를 볼 수 있음을 안내.
        if (e?.code === 'ECONNABORTED' || /timeout/i.test(e?.message || '')) {
          msg = t('chat.errorTimeout');
          // 자동 폴링 — 30초마다 listMessages reload 시도 (5분 최대)
          let attempts = 0;
          const pollId = setInterval(async () => {
            attempts += 1;
            try { await reload(); } catch (_e) { /* no-op */ }
            if (onNewAssistantMsg) onNewAssistantMsg();
            if (attempts >= 10) clearInterval(pollId);
          }, 30_000);
        }
        setError(msg);
        if (onGenStatus) onGenStatus({ phase: 'error', message: msg });
        // 낙관적으로 추가한 temp 메시지 롤백
        setMessages((prev) => prev.filter((m) => !String(m.id || '').startsWith('temp-')));
      }
      if (ok && onGenStatus) onGenStatus({ phase: 'done' });
    } finally {
      setSending(false);
    }
    return ok;
  };

  // 부모(ComposerWorkspace) 가 자동보완 시 프로그램적으로 채팅 전송할 수 있도록 노출.
  // sendRef 로 항상 최신 send 클로저를 참조 → stale state 회피.
  const sendRef = useRef(send);
  sendRef.current = send;
  useImperativeHandle(ref, () => ({
    // 자동보완(프로그램 호출)은 사용자가 채팅 입력창에 임시로 추가해 둔 첨부를 가져가지 않는다 — 빈 배열 명시.
    sendMessage: (text) => sendRef.current(text, []),
  }), []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      send();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* 메시지 스크롤 영역 */}
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          py: 1.5,
          bgcolor: 'rgba(0,0,0,0.01)',
          minHeight: 0,
        }}
      >
        {messages.length === 0 && !sending && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
            {placeholder || t('chat.emptyHint')}
          </Typography>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}

        {/* 진행 표시 — chatCollapsed=true (NEW_STEP) 일 때는 부모(ComposerWorkspace) 가
            상단 헤더 토스트에 같은 정보를 표시하므로 중복 회피 위해 내부 ChatProgress 생략.
            chatCollapsed=false (NEW_NL · 자유 채팅) 면 채팅 영역이 메인이므로 여기서 표시. */}
        {sending && !chatCollapsed && (stream.progress ? (
          <ChatProgress progress={stream.progress} />
        ) : (
          /* 스트리밍 시작 전 (사용자 메시지 보낸 직후 ~ PROMPT 이벤트 도착 전) — 단순 스피너 */
          <Stack direction="row" spacing={1.5} sx={{ my: 1.5 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              <SmartToyIcon fontSize="small" />
            </Avatar>
            <Paper variant="outlined" sx={{ p: 1.5, minWidth: 120 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CircularProgress size={14} />
                <Typography variant="body2" color="text.secondary">
                  {t('chat.generating')}
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        ))}

        {error && (
          <Paper variant="outlined" sx={{ p: 1.5, mt: 1, borderColor: 'error.light', bgcolor: 'error.lighter' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ErrorOutlineIcon color="error" fontSize="small" />
              <Typography variant="body2" color="error">{error}</Typography>
            </Stack>
          </Paper>
        )}
      </Box>

      {/* 입력 영역 — D&D 활성 (전체 박스에 dragover/drop 핸들러) */}
      <Box
        sx={{
          borderTop: '1px solid rgba(0,0,0,0.08)',
          p: 1.5,
          bgcolor: 'white',
          position: 'relative',
          ...(dragOver && {
            outline: '2px dashed #2887d7',
            outlineOffset: -4,
            bgcolor: 'rgba(40,135,215,0.06)',
          }),
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* hidden file input — IconButton 으로 trigger */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            handleFilesPicked(e.target.files);
            // 동일 파일 재선택 가능하도록 value 리셋
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
        />

        {/* 첨부 chip 목록 — 입력창 위 */}
        {attachments.length > 0 && (
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {attachments.map((a, i) => {
              const isImage = (a.mediaType || '').startsWith('image/');
              const Icon = isImage ? ImageIcon : InsertDriveFileIcon;
              return (
                <Chip
                  key={`${a.name}-${i}`}
                  size="small"
                  icon={<Icon sx={{ fontSize: 14 }} />}
                  label={`${a.name} · ${a.sizeKb}KB`}
                  onDelete={() => removeAttachment(i)}
                  deleteIcon={<CloseIcon sx={{ fontSize: 14 }} />}
                  disabled={sending}
                  sx={{ fontSize: 11, height: 22 }}
                />
              );
            })}
          </Stack>
        )}

        {/* drop overlay hint */}
        {dragOver && (
          <Box sx={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
            color: '#2887d7', fontSize: 13, fontWeight: 600,
            bgcolor: 'rgba(255,255,255,0.5)',
          }}>
            {t('chat.attach.dropHint')}
          </Box>
        )}

        <Stack direction="row" spacing={1} alignItems="flex-end">
          <Tooltip title={t('chat.attach.tooltip')}>
            <span>
              <IconButton
                size="small"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || attachments.length >= MAX_ATTACH}
                sx={{ mb: 0.5 }}
              >
                <AttachFileIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={8}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder || t('chat.placeholderDefault')}
            disabled={sending}
            size="small"
          />
          <Tooltip title={t('chat.sendTooltip')}>
            <span>
              <IconButton
                color="primary"
                onClick={() => send()}
                disabled={sending || (!input.trim() && attachments.length === 0)}
                sx={{ mb: 0.5 }}
              >
                <SendIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  );
});

function MessageBubble({ msg }) {
  const { t } = useTranslation('wizard');
  const isUser = msg.role === 'user';
  const isAssistant = msg.role === 'assistant';
  const [expanded, setExpanded] = React.useState(false);

  // 한 줄 요약 (collapsed) — content 의 첫 줄/80자
  const oneLine = (() => {
    const c = (msg.content || '').replace(/\s+/g, ' ').trim();
    return c.length > 80 ? c.substring(0, 80) + '…' : c;
  })();

  return (
    <Box
      onClick={() => setExpanded((e) => !e)}
      sx={{
        my: 0.6, mx: 0.5,
        px: 1.2, py: 0.9,
        borderRadius: 1.2,
        cursor: 'pointer',
        bgcolor: isUser ? 'rgba(40,135,215,0.05)' : '#fff',
        border: '1px solid',
        borderColor: isUser ? 'rgba(40,135,215,0.18)' : 'rgba(0,0,0,0.06)',
        '&:hover': { borderColor: isUser ? 'rgba(40,135,215,0.4)' : 'rgba(0,0,0,0.18)' },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Avatar sx={{
          width: 22, height: 22, fontSize: 13,
          bgcolor: isUser ? 'grey.400' : 'primary.main',
        }}>
          {isUser ? <PersonIcon sx={{ fontSize: 14 }} /> : <SmartToyIcon sx={{ fontSize: 14 }} />}
        </Avatar>
        <Typography variant="caption" sx={{ fontWeight: 700, color: isUser ? '#0369a1' : '#0f172a' }}>
          {isUser ? t('chat.userLabel') : t('chat.assistantLabel')}
        </Typography>
        {!expanded && (
          <Typography variant="caption" sx={{
            color: '#64748b', flex: 1, minWidth: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {oneLine || t('chat.emptyMessage')}
          </Typography>
        )}
        {(msg.outputTokens != null) && !expanded && (
          <Chip label={`${msg.outputTokens}t`} size="small" variant="outlined"
                sx={{ height: 16, fontSize: 9, fontFamily: 'monospace', flexShrink: 0 }} />
        )}
      </Stack>
      {expanded && (
        <Box sx={{ mt: 1, pl: 3.6 }}>
          {isAssistant ? (
            <LlmMarkdown content={msg.content || ''} />
          ) : (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {msg.content}
            </Typography>
          )}
          {(msg.inputTokens != null || msg.outputTokens != null) && (
            <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
              {msg.inputTokens != null && (
                <Chip label={`in ${msg.inputTokens}`} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
              )}
              {msg.outputTokens != null && (
                <Chip label={`out ${msg.outputTokens}`} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
              )}
              {msg.stopReason && (
                <Chip label={msg.stopReason} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
              )}
            </Stack>
          )}
        </Box>
      )}
    </Box>
  );
}

export default ChatPanel;

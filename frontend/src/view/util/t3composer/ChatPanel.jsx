import React, { useEffect, useRef, useState } from 'react';

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

import { zAxios } from '@wingui/common/imports';

import LlmMarkdown from '../../common/LlmMarkdown';
import { listMessages, sendChat } from './api';

/**
 * Composer 채팅 패널 — 3개 모드에서 공용 사용.
 *
 * props:
 *   sessionId         : 필수. 부모가 세션 생성 후 전달.
 *   onNewAssistantMsg : Claude 응답 도착 후 호출 (아티팩트 리스트 새로고침용)
 *   placeholder       : 입력창 placeholder
 *   initialPrompt     : 세션 최초 진입 시 자동 전송할 사용자 메시지 (선택)
 */
function ChatPanel({ sessionId, onNewAssistantMsg, placeholder, initialPrompt }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const initialSentRef = useRef(false);

  const reload = async () => {
    if (!sessionId) return;
    try {
      const res = await listMessages(sessionId);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError('메시지 이력 조회 실패: ' + (e?.message || ''));
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
            setError('로그인 세션이 만료되었습니다. 재로그인 후 다시 시도해주세요.');
            return;
          }
        } catch (e) {
          // 401 은 전역 interceptor 가 처리, 그 외 네트워크 에러는 여기서 중단
          if (e?.response?.status === 401) return;
          setError('세션 확인 실패: ' + (e?.message || ''));
          return;
        }
        send(initialPrompt);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, initialPrompt]);

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message) return;
    setInput('');
    setSending(true);
    setError(null);
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

      await sendChat(sessionId, message);
      await reload();
      if (onNewAssistantMsg) onNewAssistantMsg();
    } catch (e) {
      // 백엔드가 502 (Anthropic 오류) · 400 · 500 등을 반환하는 경우
      // data.message 에 사용자 친화적 메시지가 있음
      const data = e?.response?.data || {};
      let msg = data.message || data.error || e?.message || '전송 실패';
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
            return;
          }
        } catch (_e) { /* no-op — 계속 에러 처리 */ }
        msg = '인증 세션이 만료되었거나 다른 탭/브라우저에서 재로그인이 발생했습니다. '
            + '로그아웃 후 다시 로그인 해주세요. (서버 로그: JwtTokenProvider.validateToken 참조)';
      }
      // axios timeout (ECONNABORTED) — 세션 만료 아님을 명시.
      // 서버 측 continuation 루프는 클라이언트 단절 후에도 계속 진행되므로
      // 리로드만 하면 최종 결과를 볼 수 있음을 안내.
      if (e?.code === 'ECONNABORTED' || /timeout/i.test(e?.message || '')) {
        msg = 'Claude 응답 대기 시간 초과 (30분).\n'
            + '서버에서는 자동 continuation 이 계속 진행 중일 수 있습니다.\n'
            + '잠시 후 아래 "대화 새로고침" 을 눌러 최종 결과를 확인하세요.';
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
      // 낙관적으로 추가한 temp 메시지 롤백
      setMessages((prev) => prev.filter((m) => !String(m.id || '').startsWith('temp-')));
    } finally {
      setSending(false);
    }
  };

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
            {placeholder || '요구사항을 자연어로 입력하세요. (Ctrl+Enter 전송)'}
          </Typography>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}

        {sending && (
          <Stack direction="row" spacing={1.5} sx={{ my: 1.5 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              <SmartToyIcon fontSize="small" />
            </Avatar>
            <Paper variant="outlined" sx={{ p: 1.5, minWidth: 120 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CircularProgress size={14} />
                <Typography variant="body2" color="text.secondary">
                  Claude 가 응답 중...
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        )}

        {error && (
          <Paper variant="outlined" sx={{ p: 1.5, mt: 1, borderColor: 'error.light', bgcolor: 'error.lighter' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ErrorOutlineIcon color="error" fontSize="small" />
              <Typography variant="body2" color="error">{error}</Typography>
            </Stack>
          </Paper>
        )}
      </Box>

      {/* 입력 영역 */}
      <Box sx={{ borderTop: '1px solid rgba(0,0,0,0.08)', p: 1.5, bgcolor: 'white' }}>
        <Stack direction="row" spacing={1} alignItems="flex-end">
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={8}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || '메시지를 입력하세요 (Ctrl+Enter 로 전송)'}
            disabled={sending}
            size="small"
          />
          <Tooltip title="전송 (Ctrl+Enter)">
            <span>
              <IconButton
                color="primary"
                onClick={() => send()}
                disabled={sending || !input.trim()}
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
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const isAssistant = msg.role === 'assistant';

  return (
    <Stack direction={isUser ? 'row-reverse' : 'row'} spacing={1.5} sx={{ my: 1.5 }}>
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: isUser ? 'grey.400' : 'primary.main',
        }}
      >
        {isUser ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
      </Avatar>
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          maxWidth: '85%',
          bgcolor: isUser ? 'rgba(40,135,215,0.06)' : 'white',
          borderColor: isUser ? 'rgba(40,135,215,0.3)' : 'rgba(0,0,0,0.1)',
        }}
      >
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
      </Paper>
    </Stack>
  );
}

export default ChatPanel;

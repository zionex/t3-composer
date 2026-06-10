import React, { useState, useRef, useEffect } from 'react';
import {
  Box, TextField, IconButton, Typography, CircularProgress,
  Paper, Stack, Chip, Tooltip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useInsightComposerChat } from './useInsightComposerChat';

/**
 * InsightChatPanel — insight-llm SSE 기반 AI 채팅 패널.
 *
 * props:
 *   menuCd   - 현재 선택된 메뉴 코드 (화면 소스 자동 주입용)
 *   targetCd - 타겟 시스템 코드 (예: T3SERIES, PLANNEL)
 */
export default function InsightChatPanel({ menuCd, targetCd }) {
  const { messages, sendMessage, clearMessages, isLoading, isReady, error } =
    useInsightComposerChat();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading || !isReady) return;
    setInput('');
    await sendMessage(text, menuCd, targetCd);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 1, gap: 1 }}>
      {/* 상태 표시 */}
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip
          size="small"
          label={isReady ? 'Insight AI 연결됨' : '연결 중...'}
          color={isReady ? 'success' : 'default'}
          icon={<SmartToyIcon />}
        />
        {menuCd && (
          <Chip size="small" label={menuCd} variant="outlined" />
        )}
        {messages.length > 0 && (
          <Tooltip title="대화 초기화">
            <IconButton size="small" onClick={clearMessages}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {error && (
        <Chip size="small" label={`오류: ${error}`} color="error" />
      )}

      {/* 메시지 목록 */}
      <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {messages.length === 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ p: 1 }}>
            {menuCd
              ? `"${menuCd}" 화면에 대해 질문하세요. 소스 코드를 자동으로 분석합니다.`
              : 'Insight AI에게 질문하세요.'}
          </Typography>
        )}
        {messages.map((msg, idx) => (
          <Box
            key={idx}
            sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 1, maxWidth: '85%',
                background: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}
            >
              <Typography variant="body2">
                {msg.content || (msg.role === 'assistant' ? '...' : '')}
              </Typography>
            </Paper>
          </Box>
        ))}
        <div ref={bottomRef} />
      </Box>

      {/* 입력창 */}
      <Stack direction="row" spacing={1}>
        <TextField
          size="small" fullWidth multiline maxRows={4}
          placeholder={isReady ? 'Insight AI에게 질문...' : '연결 대기 중...'}
          value={input}
          disabled={!isReady || isLoading}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
          }}
        />
        <IconButton onClick={handleSend} disabled={!isReady || isLoading || !input.trim()}>
          {isLoading ? <CircularProgress size={20} /> : <SendIcon />}
        </IconButton>
      </Stack>
    </Box>
  );
}

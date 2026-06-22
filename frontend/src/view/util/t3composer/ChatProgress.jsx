import React from 'react';

import { Avatar, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

/**
 * 자연어 화면 생성 streaming 진행 표시 — ChatPanel 의 "응답 중..." 자리 대체.
 *
 * 디자인 문서: docs/superpowers/specs/2026-06-22-chat-streaming-progress-design.md §6.2
 *
 * props:
 *   progress: useChatStream().progress — { phase, files, elapsedMs, tokens, error, ... }
 *
 * 표시: 현재 단계 한 줄 + 경과 시간 (작성 중 파일명 또는 phase 라벨)
 *   - 누적 파일 리스트는 사용자 요청으로 생략 (2026-06-22) — 헤더 한 줄로 충분.
 */
const PHASE_TEXT = {
  PROMPT:       '🪄 요구사항 분석 중…',
  STREAM_START: '✨ Claude 응답 수신 중…',
  STREAM_END:   '📋 산출물 추출 준비 중…',
  CONTINUATION: '↻ 이어서 받는 중…',
  EXTRACT:      '📋 산출물 추출 중…',
  SAVE:         '💾 저장 중…',
};

export default function ChatProgress({ progress }) {
  if (!progress) return null;
  const { phase, files = [], elapsedMs = 0, tokens, error, continuationRound } = progress;
  const sec = Math.max(0, Math.floor(elapsedMs / 1000));

  if (error) {
    return (
      <Stack direction="row" spacing={1.5} sx={{ my: 1.5 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'error.main' }}>
          <ErrorOutlineIcon fontSize="small" />
        </Avatar>
        <Paper variant="outlined" sx={{ p: 1.5, minWidth: 240, borderColor: 'error.light', bgcolor: '#fef2f2' }}>
          <Stack spacing={0.5}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#b91c1c' }}>
              ⚠ 생성 오류 {error.phase ? `(${error.phase})` : ''}
            </Typography>
            <Typography variant="caption" sx={{ color: '#7f1d1d', whiteSpace: 'pre-wrap' }}>
              {error.message}
            </Typography>
            {error.recoverable && (
              <Typography variant="caption" sx={{ color: '#a16207', fontStyle: 'italic' }}>
                일시적 오류일 수 있음 — 잠시 후 다시 시도해 보세요.
              </Typography>
            )}
          </Stack>
        </Paper>
      </Stack>
    );
  }

  // 헤더 텍스트 결정 — 마지막으로 stream 받기 시작한 파일이 있으면 그 파일명 표시
  let headerText = PHASE_TEXT[phase] || `진행 중… (${phase || ''})`;
  if ((phase === 'STREAM_START' || phase === 'CONTINUATION') && files.length > 0) {
    const last = files[files.length - 1];
    headerText = `📄 ${last.name} 작성 중…`;
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
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#7c3aed', fontWeight: 700 }}>
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

import React from 'react';
import { useTranslation } from 'react-i18next';

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
 *   - 모든 phase 라벨 · 오류 메시지 · 카운터는 wizard.chatProgress.* i18n 키로 처리.
 */
const PHASE_KEYS = ['PROMPT', 'STREAM_START', 'STREAM_END', 'CONTINUATION', 'EXTRACT', 'SAVE'];

export default function ChatProgress({ progress }) {
  const { t } = useTranslation('wizard');
  if (!progress) return null;
  const { phase, files = [], elapsedMs = 0, tokens, error, continuationRound } = progress;
  const sec = Math.max(0, Math.floor(elapsedMs / 1000));

  if (error) {
    const errorTitle = t('chatProgress.error.title')
      + (error.phase ? t('chatProgress.error.phaseSuffix', { phase: error.phase }) : '');
    return (
      <Stack direction="row" spacing={1.5} sx={{ my: 1.5 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'error.main' }}>
          <ErrorOutlineIcon fontSize="small" />
        </Avatar>
        <Paper variant="outlined" sx={{ p: 1.5, minWidth: 240, borderColor: 'error.light', bgcolor: '#fef2f2' }}>
          <Stack spacing={0.5}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#b91c1c' }}>
              {errorTitle}
            </Typography>
            <Typography variant="caption" sx={{ color: '#7f1d1d', whiteSpace: 'pre-wrap' }}>
              {error.message}
            </Typography>
            {error.recoverable && (
              <Typography variant="caption" sx={{ color: '#a16207', fontStyle: 'italic' }}>
                {t('chatProgress.error.recoverable')}
              </Typography>
            )}
          </Stack>
        </Paper>
      </Stack>
    );
  }

  // 헤더 텍스트 결정 — phase 라벨을 i18n 키에서 해석.
  //   STREAM_START / CONTINUATION 일 때 작성 중인 파일이 있으면 그 파일명을 우선 노출.
  //   파일이 없고 STREAM_START + 누적 토큰 표시가 있으면 토큰 수까지 함께.
  let headerText;
  if ((phase === 'STREAM_START' || phase === 'CONTINUATION') && files.length > 0) {
    headerText = t('chatProgress.writingFile', { name: files[files.length - 1].name });
  } else if (phase === 'STREAM_START' && tokens && tokens > 0) {
    headerText = t('chatProgress.receivingTokens', { tokens: tokens.toLocaleString() });
  } else if (PHASE_KEYS.includes(phase)) {
    headerText = t(`chatProgress.phase.${phase}`);
  } else {
    headerText = t('chatProgress.phaseUnknown', { phase: phase || '' });
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
              {t('chatProgress.continuationRound', { n: continuationRound })}
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

import React from 'react';
import { Box, Stack, Button, Typography, Paper } from '@mui/material';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MockShell from '../../_shared/MockShell';

// PLANNEL System Error — NotFound 1개
// LAYOUT_SINGLE — 404 페이지

export default function SystemErrorMockup() {
  return (
    <MockShell
      patternCode="plannel_system_error"
      patternLabel="PlaNEL — 시스템 오류 페이지 (Not Found 404)"
      layoutCategory="LAYOUT_SINGLE"
      description="404 / 권한 오류 / 시스템 오류 등 정적 에러 페이지. 친화적 메시지 + 복귀 버튼."
    >
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, backgroundColor: 'grey.50' }}>
        <Paper elevation={4} sx={{ p: 6, maxWidth: 500, textAlign: 'center' }}>
          <Box sx={{ width: 96, height: 96, borderRadius: '50%', backgroundColor: 'warning.50',
            display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <SentimentDissatisfiedIcon sx={{ fontSize: 48, color: 'warning.main' }} />
          </Box>

          <Typography variant="h1" sx={{ fontWeight: 900, color: 'primary.main', fontSize: 96, lineHeight: 1 }}>
            404
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 1, mb: 1 }}>
            페이지를 찾을 수 없습니다
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            요청하신 페이지가 존재하지 않거나, 일시적으로 사용할 수 없는 상태입니다.<br />
            URL 을 다시 확인해주세요.
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="outlined" startIcon={<ArrowBackIcon />}>이전 페이지</Button>
            <Button variant="contained" startIcon={<HomeIcon />}>대시보드로 이동</Button>
          </Stack>

          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
              Request ID: f8a3c2b1-4e5d-6f7a-8b9c-0d1e2f3a4b5c
            </Typography>
            <br />
            <Typography variant="caption" color="text.secondary">
              문제가 지속되면 시스템 관리자에게 문의하세요.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </MockShell>
  );
}

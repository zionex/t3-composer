import React from 'react';
import { Box, Stack, Chip, Typography, Card, CardContent, Grid } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import CircleIcon from '@mui/icons-material/Circle';

import MockShell from '../_shared/MockShell';
import { LOCATIONS } from '../_data/mockData';

const STATUS_LIST = LOCATIONS.map((l, i) => ({
  ...l,
  health: i % 5 === 0 ? 'DOWN' : (i % 4 === 0 ? 'WARN' : 'UP'),
  uptime: i % 5 === 0 ? '0%' : (i % 4 === 0 ? '94.2%' : '99.8%'),
  latency: i % 5 === 0 ? '-' : (i % 4 === 0 ? '120ms' : '32ms'),
}));

function statusChip(h) {
  if (h === 'UP')   return { color: '#2a9d8f', icon: <CheckCircleIcon /> };
  if (h === 'WARN') return { color: '#ffb100', icon: <WarningIcon /> };
  return { color: '#fa7d5b', icon: <ErrorIcon /> };
}

export default function MnSimpleMockup() {
  return (
    <MockShell
      patternCode="mn_simple"
      patternLabel="MN — 간단 상태 표시 (Service / Site 모니터)"
      layoutCategory="LAYOUT_MONITORING"
      description="거점/서비스의 핵심 상태만 카드로. 큰 신호등 + uptime/latency. 인포 패널 형식."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="subtitle1">거점 헬스 상태</Typography>
          <Chip size="small" label={`UP ${STATUS_LIST.filter((s) => s.health === 'UP').length}`} color="success" icon={<CircleIcon />} />
          <Chip size="small" label={`WARN ${STATUS_LIST.filter((s) => s.health === 'WARN').length}`} color="warning" icon={<CircleIcon />} />
          <Chip size="small" label={`DOWN ${STATUS_LIST.filter((s) => s.health === 'DOWN').length}`} color="error" icon={<CircleIcon />} />
        </Stack>
      </Box>
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        <Grid container spacing={2}>
          {STATUS_LIST.map((s) => {
            const sc = statusChip(s.health);
            return (
              <Grid item xs={6} md={3} key={s.locatCd}>
                <Card variant="outlined" sx={{ borderTop: '4px solid', borderTopColor: sc.color }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle2">{s.locatNm}</Typography>
                      <Box sx={{ color: sc.color, display: 'flex' }}>{sc.icon}</Box>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {s.locatCd} · {s.locatTp}
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">UPTIME</Typography>
                        <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, color: sc.color }}>{s.uptime}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">LATENCY</Typography>
                        <Typography sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{s.latency}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </MockShell>
  );
}

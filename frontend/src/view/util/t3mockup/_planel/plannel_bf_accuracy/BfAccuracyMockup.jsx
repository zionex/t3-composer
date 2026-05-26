import React from 'react';
import { Box, Stack, Chip, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  LinearProgress } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MockShell from '../../_shared/MockShell';

// PLANNEL BF 정확도 — BfAccuracyReport / BfLeaderboard / NpiHistory 3개
// LAYOUT_DASHBOARD — 전체 정확도 KPI + 알고리즘 leaderboard + NPI 이력

const ACCURACY_HISTORY = [
  { m: '2026-01', val: 84.2 }, { m: '2026-02', val: 85.8 }, { m: '2026-03', val: 83.5 },
  { m: '2026-04', val: 86.7 }, { m: '2026-05', val: 87.3 },
];

const LEADERBOARD = [
  { rank: 1, algo: 'LSTM',           mape: 4.2, accuracy: 92.1, color: 'gold' },
  { rank: 2, algo: 'Prophet',        mape: 5.8, accuracy: 89.3, color: 'silver' },
  { rank: 3, algo: 'ARIMA',          mape: 7.1, accuracy: 86.5, color: '#cd7f32' },
  { rank: 4, algo: 'Exp. Smoothing', mape: 8.4, accuracy: 84.2 },
  { rank: 5, algo: 'XGBoost',        mape: 9.7, accuracy: 81.5 },
];

const NPI_HISTORY = [
  { date: '2026-05-22', item: 'LED Module 80W Pro', action: 'NPI 등록' },
  { date: '2026-05-15', item: 'PCB Board Rev.4',    action: 'PLC 단계 변경 (Growth)' },
  { date: '2026-05-08', item: 'Aluminum Heatsink V2',action: 'EOP 예정 (Q4 2026)' },
];

export default function BfAccuracyMockup() {
  return (
    <MockShell
      patternCode="plannel_bf_accuracy"
      patternLabel="PlaNEL — BF 정확도 & 리더보드 (Accuracy Report / Leaderboard / NPI History)"
      layoutCategory="LAYOUT_DASHBOARD"
      description="전체 정확도 트렌드 + 알고리즘 leaderboard + NPI 이력. BF 성과 모니터링 통합."
    >
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Paper sx={{ p: 2, flex: 1, borderTop: '3px solid', borderTopColor: 'success.main' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <TrendingUpIcon color="success" />
              <Typography variant="caption" color="text.secondary">전체 정확도 (M-1)</Typography>
            </Stack>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>87.3%</Typography>
            <Typography variant="caption" color="success.main">+0.5%p vs 전월</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, borderTop: '3px solid', borderTopColor: 'primary.main' }}>
            <Typography variant="caption" color="text.secondary">MAPE (가중평균)</Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>5.4%</Typography>
            <Typography variant="caption" color="text.secondary">target: ≤ 7%</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, borderTop: '3px solid', borderTopColor: 'info.main' }}>
            <Typography variant="caption" color="text.secondary">5개월 평균</Typography>
            <Stack direction="row" spacing={0.5} alignItems="flex-end" sx={{ height: 50, mt: 1 }}>
              {ACCURACY_HISTORY.map((h) => (
                <Box key={h.m} sx={{
                  flex: 1, backgroundColor: 'info.main',
                  height: `${(h.val - 80) * 8}%`, minHeight: 4,
                  opacity: 0.6 + (h.val - 80) * 0.05,
                  borderRadius: '2px 2px 0 0',
                }} title={`${h.m}: ${h.val}%`} />
              ))}
            </Stack>
            <Typography variant="caption" color="text.secondary">Jan ─ May 2026</Typography>
          </Paper>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Paper sx={{ p: 2, flex: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <EmojiEventsIcon color="warning" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>알고리즘 Leaderboard</Typography>
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 700 }}>순위</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>알고리즘</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>MAPE</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>정확도</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {LEADERBOARD.map((l) => (
                  <TableRow key={l.algo} hover>
                    <TableCell>
                      <Chip label={`#${l.rank}`} size="small"
                        sx={{ fontFamily: 'monospace', fontWeight: 700,
                          backgroundColor: l.rank <= 3 ? l.color : undefined,
                          color: l.rank <= 3 ? 'white' : undefined }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{l.algo}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{l.mape}%</TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LinearProgress variant="determinate" value={l.accuracy}
                          sx={{ width: 100, height: 8, borderRadius: 1 }} />
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{l.accuracy}%</Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>NPI 이력</Typography>
            <Stack spacing={1.5}>
              {NPI_HISTORY.map((n, idx) => (
                <Box key={idx} sx={{ pl: 1.5, borderLeft: '2px solid', borderLeftColor: 'primary.main' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{n.date}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{n.item}</Typography>
                  <Chip label={n.action} size="small" variant="outlined" sx={{ mt: 0.5, fontSize: 10 }} />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </MockShell>
  );
}

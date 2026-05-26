import React from 'react';
import { Box, Stack, Button, Chip, Typography, Paper,
  Table, TableHead, TableBody, TableRow, TableCell, LinearProgress } from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import MockShell from '../../_shared/MockShell';

// PLANNEL RP Fill Rate — FillRateDashboard / RpScenarioCompDashboard 2개
// LAYOUT_DASHBOARD — Fill Rate KPI + 시나리오 비교 (A/B/C)

const FILL_RATE_BY_WH = [
  { wh: 'WH-K01 (Korea Central)', rate: 96.2, target: 95 },
  { wh: 'WH-K02 (Seoul)',         rate: 91.5, target: 95 },
  { wh: 'WH-K03 (Busan)',         rate: 87.3, target: 95 },
  { wh: 'WH-U01 (US Central)',    rate: 93.8, target: 90 },
  { wh: 'WH-J01 (Japan)',         rate: 95.6, target: 90 },
];

const SCENARIOS = [
  { name: 'Scenario A — 현재 (Baseline)', fillRate: 94.2, cost: 4.8, inv: 12.4, color: 'primary' },
  { name: 'Scenario B — 안전재고 +20%',   fillRate: 97.1, cost: 5.6, inv: 14.9, color: 'success' },
  { name: 'Scenario C — Lead time 단축', fillRate: 95.8, cost: 5.1, inv: 11.8, color: 'info' },
];

export default function RpFillRateMockup() {
  return (
    <MockShell
      patternCode="plannel_rp_fill_rate"
      patternLabel="PlaNEL — RP Fill Rate & 시나리오 (Fill Rate Dashboard / Scenario Comparison)"
      layoutCategory="LAYOUT_DASHBOARD"
      description="Fill Rate by 창고 + 시나리오 (A/B/C) 비교 대시보드. 보충 성과 분석."
    >
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Paper sx={{ p: 2, flex: 1, borderTop: '3px solid', borderTopColor: 'success.main' }}>
            <Typography variant="caption" color="text.secondary">Overall Fill Rate</Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>94.2%</Typography>
            <Typography variant="caption" color="success.main">+0.8%p vs target (95%)</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, borderTop: '3px solid', borderTopColor: 'warning.main' }}>
            <Typography variant="caption" color="text.secondary">Under-target 창고</Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'warning.main' }}>2 / 5</Typography>
            <Typography variant="caption" color="text.secondary">Seoul / Busan</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, borderTop: '3px solid', borderTopColor: 'info.main' }}>
            <Typography variant="caption" color="text.secondary">개선 가능성 (Sim B)</Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'info.main' }}>+2.9%p</Typography>
            <Typography variant="caption" color="text.secondary">94.2% → 97.1%</Typography>
          </Paper>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>창고별 Fill Rate</Typography>
            <Stack spacing={1.5}>
              {FILL_RATE_BY_WH.map((w) => (
                <Box key={w.wh}>
                  <Stack direction="row" alignItems="center" sx={{ mb: 0.3 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{w.wh}</Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700,
                      color: w.rate >= w.target ? 'success.main' : 'warning.main' }}>{w.rate}%</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>/ {w.target}%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={w.rate}
                    color={w.rate >= w.target ? 'success' : 'warning'} sx={{ height: 8, borderRadius: 1 }} />
                </Box>
              ))}
            </Stack>
          </Paper>

          <Paper sx={{ p: 2, flex: 1 }}>
            <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
              <CompareArrowsIcon color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, ml: 1 }}>시나리오 비교</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button size="small">상세 보기</Button>
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 700 }}>시나리오</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Fill</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>비용 (B)</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>재고일</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {SCENARIOS.map((s) => (
                  <TableRow key={s.name} hover>
                    <TableCell><Chip label={s.name} size="small" color={s.color} variant="outlined" sx={{ fontSize: 10 }} /></TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{s.fillRate}%</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{s.cost}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{s.inv}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Stack>
      </Box>
    </MockShell>
  );
}

import React from 'react';
import { Box, Stack, Button, Chip, Typography, Paper,
  Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MockShell from '../../_shared/MockShell';

// PLANNEL MP 시나리오 비교 — MpScenarioComDashboard 1개
// LAYOUT_H2 — 좌측 시나리오 list + 우측 KPI 비교 매트릭스

const SCENARIOS = [
  { id: 'A', name: 'Baseline (현재)',              ok: true,  fillRate: 92.4, cost: 18.2, util: 84.5, late: 12 },
  { id: 'B', name: 'WC-K01 잔업 +10시간',         ok: true,  fillRate: 96.1, cost: 19.8, util: 92.3, late: 4  },
  { id: 'C', name: 'PCB Board v3 외주 + 잔업',    ok: false, fillRate: 97.8, cost: 22.5, util: 88.1, late: 1  },
  { id: 'D', name: 'Apple 우선 + 다른 거래처 지연', ok: false, fillRate: 89.7, cost: 17.6, util: 82.4, late: 18 },
];

const COMPARE_METRICS = [
  { metric: 'Fill Rate', a: '92.4%', b: '96.1%', c: '97.8%', d: '89.7%' },
  { metric: 'Cost (B KRW)', a: '18.2', b: '19.8', c: '22.5', d: '17.6' },
  { metric: '평균 가동률', a: '84.5%', b: '92.3%', c: '88.1%', d: '82.4%' },
  { metric: '납기 지연 건수', a: '12', b: '4',   c: '1',   d: '18' },
  { metric: '추천도 (Score)', a: '78', b: '92', c: '83', d: '62' },
];

export default function MpScenarioMockup() {
  return (
    <MockShell
      patternCode="plannel_mp_scenario"
      patternLabel="PlaNEL — MP 시나리오 비교 (MP Scenario Comparison Dashboard)"
      layoutCategory="LAYOUT_H2"
      description="좌측 4개 시나리오 list + 우측 KPI 비교 매트릭스. MP 의사결정 지원."
    >
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Box sx={{ width: '40%', borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" sx={{ p: 1.5, backgroundColor: 'primary.50', borderBottom: '1px solid', borderColor: 'divider' }}>
            <CompareArrowsIcon color="primary" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, ml: 1 }}>시나리오</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" variant="contained">선택 확정</Button>
          </Stack>
          <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
            <Stack spacing={1}>
              {SCENARIOS.map((s) => (
                <Paper key={s.id} elevation={s.id === 'B' ? 4 : 1} sx={{
                  p: 1.5,
                  border: s.id === 'B' ? '2px solid' : '1px solid',
                  borderColor: s.id === 'B' ? 'success.main' : 'divider',
                  backgroundColor: s.id === 'B' ? 'success.50' : undefined,
                }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Chip label={`SIM-${s.id}`} size="small" sx={{ fontFamily: 'monospace', fontWeight: 700 }}
                      color={s.id === 'B' ? 'success' : 'default'} />
                    <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>{s.name}</Typography>
                    {s.id === 'B' && <CheckCircleIcon color="success" sx={{ fontSize: 18 }} />}
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip label={`Fill ${s.fillRate}%`} size="small" variant="outlined"
                      color={s.fillRate >= 95 ? 'success' : s.fillRate >= 90 ? 'warning' : 'error'}
                      sx={{ fontSize: 10 }} />
                    <Chip label={`Cost ${s.cost}B`} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                    <Chip label={`Late ${s.late}`} size="small" variant="outlined"
                      color={s.late <= 5 ? 'success' : s.late <= 10 ? 'warning' : 'error'}
                      sx={{ fontSize: 10 }} />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>
        </Box>

        <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>KPI 비교 매트릭스</Typography>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>Metric</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>SIM-A</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right', backgroundColor: 'success.50' }}>SIM-B ✓</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>SIM-C</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>SIM-D</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {COMPARE_METRICS.map((m) => (
                <TableRow key={m.metric} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{m.metric}</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{m.a}</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, backgroundColor: 'success.50' }}>{m.b}</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{m.c}</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{m.d}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </MockShell>
  );
}

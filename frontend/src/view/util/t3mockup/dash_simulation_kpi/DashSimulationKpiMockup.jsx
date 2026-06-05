import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Chip, Grid, Divider, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import MockShell from '../_shared/MockShell';

const SIM_KPI = [
  { name: '수요 충족율',  base: 92.5, sim: 96.4, unit: '%', goodHigh: true },
  { name: '납기 준수율',  base: 88.2, sim: 94.7, unit: '%', goodHigh: true },
  { name: '배송 LT',       base: 14.5, sim: 12.8, unit: 'days', goodHigh: false },
  { name: '리드타임',      base: 21.2, sim: 18.4, unit: 'days', goodHigh: false },
];

// 시뮬 버전 비교
const VERSIONS = [
  { v: 'SIM_V20260410_A', desc: 'Baseline (기준)',          rtf: 92.5, otd: 88.2, lt: 14.5 },
  { v: 'SIM_V20260411_B', desc: 'Capa +15% scenario',       rtf: 95.1, otd: 92.4, lt: 13.2 },
  { v: 'SIM_V20260412_C', desc: 'CN-Suzhou 우선 routing',   rtf: 94.8, otd: 91.7, lt: 13.8 },
  { v: 'SIM_V20260413_D', desc: 'Final (선택)',              rtf: 96.4, otd: 94.7, lt: 12.8 },
];

function CompareBar({ base, sim, unit, goodHigh }) {
  const max = Math.max(base, sim) * 1.15;
  const better = goodHigh ? sim > base : sim < base;
  const deltaColor = better ? 'success.main' : 'error.main';
  const delta = (sim - base).toFixed(1);
  const Icon = sim > base ? TrendingUpIcon : TrendingDownIcon;
  return (
    <Box>
      <Stack spacing={0.5}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">Baseline</Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{base}{unit}</Typography>
        </Stack>
        <Box sx={{ position: 'relative', height: 14, bgcolor: 'grey.100', borderRadius: 0.5 }}>
          <Box sx={{ position: 'absolute', inset: 0, width: `${(base / max) * 100}%`, bgcolor: '#94a3b8', borderRadius: 0.5 }} />
        </Box>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>Simulation</Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{sim}{unit}</Typography>
        </Stack>
        <Box sx={{ position: 'relative', height: 14, bgcolor: 'grey.100', borderRadius: 0.5 }}>
          <Box sx={{ position: 'absolute', inset: 0, width: `${(sim / max) * 100}%`, bgcolor: '#5281b3', borderRadius: 0.5 }} />
        </Box>
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
          <Icon fontSize="small" sx={{ color: deltaColor, fontSize: 14 }} />
          <Typography variant="caption" sx={{ color: deltaColor, fontWeight: 600 }}>
            {sim > base ? '+' : ''}{delta}{unit}
          </Typography>
          <Typography variant="caption" color="text.secondary">vs Baseline</Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

export default function DashSimulationKpiMockup() {
  return (
    <MockShell
      patternCode="dash_simulation_kpi"
      patternLabel="Simulation KPI — 시뮬 결과"
      layoutCategory="LAYOUT_DASHBOARD"
      description="충족율/납기율/배송/리드타임 + 비교 차트"
    >
      <Box sx={{ p: 2 }}>
        {/* 헤더 — 선택된 버전 */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
              <CheckCircleOutlineIcon color="success" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>SIM_V20260413_D (Final)</Typography>
              <Chip size="small" label="CONFIRMED" color="success" />
              <Chip size="small" label="Plan: M+3" variant="outlined" />
              <Chip size="small" label="Sites: 6" variant="outlined" />
              <Chip size="small" label="Items: 187 SKU" variant="outlined" />
              <Box sx={{ flex: 1 }} />
              <Typography variant="caption" color="text.secondary">
                생성: 2026-04-13 14:22:18 by kim.smk
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* KPI 4종 비교 */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {SIM_KPI.map((k) => (
            <Grid item xs={12} sm={6} md={3} key={k.name}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>{k.name}</Typography>
                  <CompareBar base={k.base} sim={k.sim} unit={k.unit} goodHigh={k.goodHigh} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* 시뮬 버전 비교 표 */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>시뮬레이션 버전 비교</Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Version</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>설명</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>충족율 %</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>납기율 %</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>LT (days)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {VERSIONS.map((v) => {
                  const isFinal = v.v.endsWith('_D');
                  return (
                    <TableRow key={v.v} sx={{ bgcolor: isFinal ? 'success.light' : 'transparent', '& td': { fontFamily: isFinal ? undefined : 'monospace' } }}>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: isFinal ? 700 : 400 }}>
                        {v.v}
                        {isFinal && <Chip size="small" label="Final" color="success" sx={{ ml: 1, height: 18, fontSize: 10 }} />}
                      </TableCell>
                      <TableCell>{v.desc}</TableCell>
                      <TableCell align="right">{v.rtf.toFixed(1)}</TableCell>
                      <TableCell align="right">{v.otd.toFixed(1)}</TableCell>
                      <TableCell align="right">{v.lt.toFixed(1)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" color="text.secondary">
              총 4개 시나리오 비교 후 D 버전 선택. Baseline 대비 RTF +3.9pt, OTD +6.5pt, LT −1.7일 개선.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}

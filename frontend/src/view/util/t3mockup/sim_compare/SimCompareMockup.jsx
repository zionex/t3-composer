import React from 'react';
import {
  Box, Card, CardContent, Stack, Typography, Chip, Grid, Divider, FormControl, InputLabel, Select, MenuItem,
  Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

import MockShell from '../_shared/MockShell';

const COMPARE = [
  { itemNm: 'LED Module 60W',    aQty: 12500, bQty: 13800, aOh: 4200, bOh: 3800 },
  { itemNm: 'LED Module 80W',    aQty: 8200,  bQty: 8600,  aOh: 2900, bOh: 2700 },
  { itemNm: 'Camera IMX-700',    aQty: 5600,  bQty: 6100,  aOh: 1800, bOh: 1500 },
  { itemNm: 'Battery 18650',     aQty: 18400, bQty: 17500, aOh: 6100, bOh: 6400 },
  { itemNm: 'Display Panel 32"', aQty: 4200,  bQty: 4500,  aOh: 1200, bOh: 1080 },
  { itemNm: 'Display Panel 55"', aQty: 2100,  bQty: 2400,  aOh: 580,  bOh: 510 },
];

const KPI = [
  { name: '총 계획량',    a: 50000, b: 52900, unit: 'EA',     better: 'higher' },
  { name: '평균 재고',    a: 16780, b: 15990, unit: 'EA',     better: 'lower' },
  { name: '회전일수',     a: 28.4,  b: 26.2,  unit: 'days',   better: 'lower' },
  { name: '결품률',       a: 1.2,   b: 0.9,   unit: '%',      better: 'lower' },
];

function CompareBar({ a, b, max }) {
  return (
    <Stack spacing={0.5}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ width: 30, fontSize: 11, color: 'text.secondary', textAlign: 'right' }}>A</Box>
        <Box sx={{ flex: 1, position: 'relative', height: 14, bgcolor: 'grey.100', borderRadius: 0.5 }}>
          <Box sx={{ position: 'absolute', inset: 0, width: `${(a / max) * 100}%`, bgcolor: '#94a3b8', borderRadius: 0.5 }} />
        </Box>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', width: 70, textAlign: 'right' }}>
          {typeof a === 'number' && a > 100 ? a.toLocaleString() : a.toFixed(1)}
        </Typography>
      </Stack>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ width: 30, fontSize: 11, color: 'primary.main', textAlign: 'right', fontWeight: 700 }}>B</Box>
        <Box sx={{ flex: 1, position: 'relative', height: 14, bgcolor: 'grey.100', borderRadius: 0.5 }}>
          <Box sx={{ position: 'absolute', inset: 0, width: `${(b / max) * 100}%`, bgcolor: '#5281b3', borderRadius: 0.5 }} />
        </Box>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, width: 70, textAlign: 'right' }}>
          {typeof b === 'number' && b > 100 ? b.toLocaleString() : b.toFixed(1)}
        </Typography>
      </Stack>
    </Stack>
  );
}

export default function SimCompareMockup() {
  return (
    <MockShell
      patternCode="sim_compare"
      patternLabel="Simulation Compare — 시뮬 결과 비교"
      layoutCategory="LAYOUT_SINGLE"
      description="두 시뮬레이션 버전을 좌·우로 비교 + delta 표시. ImSimulationCompare · TargetInventoryResultPeriod 류"
    >
      <Box sx={{ p: 2 }}>
        {/* 버전 선택 */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
              <CompareArrowsIcon color="primary" />
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>비교 A (기준)</InputLabel>
                <Select label="비교 A (기준)" value="A" onChange={() => {}}>
                  <MenuItem value="A">IM_V20260410_A · Baseline</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="h6" sx={{ color: 'text.secondary' }}>vs</Typography>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>비교 B (대안)</InputLabel>
                <Select label="비교 B (대안)" value="B" onChange={() => {}}>
                  <MenuItem value="B">IM_V20260413_B · Capa+15%</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ flex: 1 }} />
              <Chip size="small" label="기준 4/10" variant="outlined" />
              <Chip size="small" color="primary" label="대안 4/13" />
            </Stack>
          </CardContent>
        </Card>

        {/* KPI 비교 */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {KPI.map((k) => {
            const max = Math.max(k.a, k.b) * 1.15;
            const isImprove = k.better === 'higher' ? k.b > k.a : k.b < k.a;
            const deltaColor = isImprove ? 'success.main' : 'error.main';
            const delta = (k.b - k.a).toFixed(typeof k.a === 'number' && k.a < 100 ? 1 : 0);
            const Icon = k.b > k.a ? TrendingUpIcon : TrendingDownIcon;
            return (
              <Grid item xs={12} sm={6} md={3} key={k.name}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>{k.name}</Typography>
                    <CompareBar a={k.a} b={k.b} max={max} />
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.75 }}>
                      <Icon fontSize="small" sx={{ color: deltaColor, fontSize: 14 }} />
                      <Typography variant="caption" sx={{ color: deltaColor, fontWeight: 600 }}>
                        {k.b > k.a ? '+' : ''}{delta}{k.unit}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">vs A · {k.better === 'higher' ? '↑ 좋음' : '↓ 좋음'}</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* 품목별 비교 */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>품목별 상세 비교</Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: 'grey.50', fontWeight: 700 } }}>
                  <TableCell rowSpan={2}>품목</TableCell>
                  <TableCell align="center" colSpan={3} sx={{ borderLeft: '1px solid', borderColor: 'divider' }}>계획 수량 (EA)</TableCell>
                  <TableCell align="center" colSpan={3} sx={{ borderLeft: '1px solid', borderColor: 'divider' }}>월말 재고 (EA)</TableCell>
                </TableRow>
                <TableRow sx={{ '& th': { bgcolor: 'grey.50', fontWeight: 600 } }}>
                  <TableCell align="right" sx={{ borderLeft: '1px solid', borderColor: 'divider' }}>A</TableCell>
                  <TableCell align="right">B</TableCell>
                  <TableCell align="right">Δ</TableCell>
                  <TableCell align="right" sx={{ borderLeft: '1px solid', borderColor: 'divider' }}>A</TableCell>
                  <TableCell align="right">B</TableCell>
                  <TableCell align="right">Δ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {COMPARE.map((r, i) => {
                  const qDelta = r.bQty - r.aQty;
                  const oDelta = r.bOh - r.aOh;
                  return (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontSize: 12 }}>{r.itemNm}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'text.secondary', borderLeft: '1px solid', borderColor: 'divider' }}>{r.aQty.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.bQty.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', color: qDelta > 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
                        {qDelta > 0 ? '+' : ''}{qDelta.toLocaleString()}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'text.secondary', borderLeft: '1px solid', borderColor: 'divider' }}>{r.aOh.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.bOh.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', color: oDelta < 0 ? 'success.main' : 'warning.main', fontWeight: 600 }}>
                        {oDelta > 0 ? '+' : ''}{oDelta.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" color="text.secondary">
              B (대안) 가 A (기준) 대비 계획량 +5.8%, 평균 재고 −4.7% 개선. 채택 권고.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}

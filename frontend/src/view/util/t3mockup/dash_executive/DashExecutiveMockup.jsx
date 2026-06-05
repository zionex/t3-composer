import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Chip, Grid, Divider } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

import MockShell from '../_shared/MockShell';
import { WEEK_BUCKETS } from '../_data/mockData';

// 매출목표 vs 실적 — 12 weeks 라인 (두 시리즈)
const REVENUE_TARGET = [820, 840, 850, 870, 880, 900, 910, 920, 935, 945, 960, 980];
const REVENUE_ACTUAL = [805, 855, 832, 891, 902, 875, 928, 905, 940, 957, 951, 990];

// AOP vs DP — 4분기 바 (두 시리즈)
const AOP_VS_DP = [
  { label: 'Q1', aop: 2480, dp: 2520 },
  { label: 'Q2', aop: 2650, dp: 2710 },
  { label: 'Q3', aop: 2820, dp: 2780 },
  { label: 'Q4', aop: 3010, dp: 3120 },
];

// 제품군 수익 — 4분류
const PRODUCT_GP = [
  { grp: 'LED',     gp: 32.4, color: '#5281b3' },
  { grp: 'CAMERA',  gp: 41.2, color: '#2a9d8f' },
  { grp: 'BATTERY', gp: 28.7, color: '#fa7d5b' },
  { grp: 'DISPLAY', gp: 36.5, color: '#8b5cf6' },
];

// Executive KPI 4종 (경영 관점)
const EXEC_KPI = [
  { name: '월 매출',         value: '₩9,807M', target: '₩9,500M', up: true,  delta: '+3.2%' },
  { name: 'GP 마진',         value: '34.2%',   target: '32.0%',   up: true,  delta: '+2.2pt' },
  { name: '정시 출하율',     value: '96.4%',   target: '95.0%',   up: true,  delta: '+1.4pt' },
  { name: '재고 회전율',     value: '11.3x',   target: '12.0x',   up: false, delta: '−0.7x' },
];

function DualLineChart({ a, b, labels, width = 600, height = 180 }) {
  const all = [...a, ...b];
  const max = Math.max(...all);
  const min = Math.min(...all);
  const range = max - min || 1;
  const dx = width / (a.length - 1 || 1);
  const toPts = (data) => data.map((v, i) =>
    `${(i * dx).toFixed(1)},${(height - ((v - min) / range) * (height - 30) - 15).toFixed(1)}`
  ).join(' ');
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline points={toPts(a)} fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6,4" />
      <polyline points={toPts(b)} fill="none" stroke="#5281b3" strokeWidth={2.5} />
      {b.map((v, i) => {
        const cx = i * dx;
        const cy = height - ((v - min) / range) * (height - 30) - 15;
        return <circle key={i} cx={cx} cy={cy} r={3} fill="#5281b3" />;
      })}
    </svg>
  );
}

function DualBarChart({ data, height = 180 }) {
  const max = Math.max(...data.flatMap((d) => [d.aop, d.dp]));
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', height, gap: 1.5, mt: 1 }}>
      {data.map((d, i) => (
        <Stack key={i} flex={1} alignItems="center" justifyContent="flex-end" spacing={0.5}>
          <Stack direction="row" alignItems="flex-end" sx={{ height: '85%', gap: 0.5, width: '90%' }}>
            <Box sx={{ flex: 1, height: `${(d.aop / max) * 100}%`, bgcolor: '#94a3b8', borderRadius: 0.5 }} />
            <Box sx={{ flex: 1, height: `${(d.dp  / max) * 100}%`, bgcolor: '#2a9d8f', borderRadius: 0.5 }} />
          </Stack>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{d.label}</Typography>
        </Stack>
      ))}
    </Box>
  );
}

function HorizontalBar({ data, max }) {
  return (
    <Stack spacing={0.75} sx={{ mt: 1 }}>
      {data.map((d, i) => (
        <Box key={i}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{d.grp}</Typography>
            <Typography sx={{ fontSize: 12, fontFamily: 'monospace' }}>{d.gp.toFixed(1)}%</Typography>
          </Stack>
          <Box sx={{ position: 'relative', height: 16, bgcolor: 'grey.100', borderRadius: 0.5 }}>
            <Box sx={{ position: 'absolute', inset: 0, width: `${(d.gp / max) * 100}%`, bgcolor: d.color, borderRadius: 0.5 }} />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

export default function DashExecutiveMockup() {
  const gpMax = Math.max(...PRODUCT_GP.map((p) => p.gp));

  return (
    <MockShell
      patternCode="dash_executive"
      patternLabel="Executive — 경영 종합 대시보드"
      layoutCategory="LAYOUT_DASHBOARD"
      description="매출목표/AOP-DP/제품군 수익 + KPI 종합. 경영진용 한눈에 보는 전사 스냅샷."
    >
      <Box sx={{ p: 2 }}>
        {/* Executive KPI 4종 */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {EXEC_KPI.map((k) => {
            const color = k.up ? 'success.main' : 'error.main';
            const Icon = k.up ? TrendingUpIcon : TrendingDownIcon;
            return (
              <Grid item xs={6} md={3} key={k.name}>
                <Card variant="outlined">
                  <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="caption" color="text.secondary">{k.name}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.25 }}>{k.value}</Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                      <Icon fontSize="small" sx={{ color, fontSize: 16 }} />
                      <Typography variant="caption" sx={{ color }}>{k.delta}</Typography>
                      <Typography variant="caption" color="text.secondary">vs 목표 {k.target}</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* 위젯 3종 — 매출 라인 / AOP-DP 바 / 제품군 수익 */}
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>월 매출 — 목표 vs 실적</Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip size="small" label="Target" sx={{ bgcolor: '#94a3b8', color: 'white', fontSize: 10 }} />
                    <Chip size="small" label="Actual" sx={{ bgcolor: '#5281b3', color: 'white', fontSize: 10 }} />
                  </Stack>
                </Stack>
                <DualLineChart a={REVENUE_TARGET} b={REVENUE_ACTUAL} labels={WEEK_BUCKETS} />
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  {WEEK_BUCKETS.filter((_, i) => i % 2 === 0).map((w) => (
                    <Typography key={w} sx={{ fontSize: 10, color: 'text.secondary' }}>{w}</Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>AOP vs DP (분기)</Typography>
                <DualBarChart data={AOP_VS_DP} />
                <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Box sx={{ width: 8, height: 8, bgcolor: '#94a3b8', borderRadius: 0.5 }} />
                    <Typography variant="caption">AOP</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Box sx={{ width: 8, height: 8, bgcolor: '#2a9d8f', borderRadius: 0.5 }} />
                    <Typography variant="caption">DP</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>제품군 수익 (GP %)</Typography>
                <HorizontalBar data={PRODUCT_GP} max={gpMax * 1.1} />
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" color="text.secondary">
                  CAMERA 41.2% · 전사 평균 34.2%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MockShell>
  );
}

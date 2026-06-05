import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Chip, Grid, Divider } from '@mui/material';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';

import MockShell from '../_shared/MockShell';

const DAYS = ['4/06','4/07','4/08','4/09','4/10','4/11','4/12','4/13'];
const DAILY_PRODUCTION = [1180, 1220, 1245, 1198, 1280, 1305, 1267, 1310];
const DAILY_PLAN       = [1200, 1200, 1200, 1200, 1300, 1300, 1300, 1300];

const ITEM_PRODUCTION = [
  { itemNm: 'LED Module 60W',     produced: 3850, planned: 4000, color: '#5281b3' },
  { itemNm: 'Camera Sensor IMX-700', produced: 2640, planned: 2500, color: '#2a9d8f' },
  { itemNm: 'Battery Cell 18650', produced: 4120, planned: 4200, color: '#fa7d5b' },
  { itemNm: 'Display Panel 32"',  produced: 1820, planned: 1800, color: '#8b5cf6' },
];

const PLANT_STOCK = [
  { plant: 'KR-Suwon',   stock: 18540, capacity: 25000 },
  { plant: 'VN-HCMC',    stock: 12300, capacity: 15000 },
  { plant: 'CN-Suzhou',  stock: 21200, capacity: 22000 },
  { plant: 'MX-Tijuana', stock:  8950, capacity: 10000 },
];

const STOCK_STATE = [
  { grade: '안전 재고 이상',  count: 142, color: '#10b981' },
  { grade: '안전~결품 사이',   count: 38,  color: '#f59e0b' },
  { grade: '결품 위험',         count: 7,   color: '#ef4444' },
];

function DualLine({ a, b, width = 600, height = 180 }) {
  const all = [...a, ...b];
  const max = Math.max(...all) * 1.05;
  const min = Math.min(...all) * 0.95;
  const range = max - min || 1;
  const dx = width / (a.length - 1 || 1);
  const toPts = (data) =>
    data.map((v, i) => `${(i * dx).toFixed(1)},${(height - ((v - min) / range) * (height - 30) - 15).toFixed(1)}`).join(' ');
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline points={toPts(b)} fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6,4" />
      <polyline points={toPts(a)} fill="none" stroke="#5281b3" strokeWidth={2.5} />
      {a.map((v, i) => {
        const cx = i * dx;
        const cy = height - ((v - min) / range) * (height - 30) - 15;
        return <circle key={i} cx={cx} cy={cy} r={3} fill="#5281b3" />;
      })}
    </svg>
  );
}

export default function DashProductionPerfMockup() {
  return (
    <MockShell
      patternCode="dash_production_perf"
      patternLabel="Production Perf — 생산 실적 분석"
      layoutCategory="LAYOUT_DASHBOARD"
      description="일생산실적/제품별/공장재고/재고상태 차트 4개"
    >
      <Box sx={{ p: 2 }}>
        {/* Scope */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <FilterAltOutlinedIcon fontSize="small" color="action" />
          <Chip size="small" label="Period: 2026-04-06 ~ 04-13" color="primary" />
          <Chip size="small" label="Plant: ALL" variant="outlined" />
          <Chip size="small" label="ItemGrp: ALL" variant="outlined" />
        </Stack>

        <Grid container spacing={1.5}>
          {/* 1. 일생산 실적 */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>일별 생산 실적 vs 계획</Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip size="small" label="Plan" sx={{ bgcolor: '#94a3b8', color: 'white', fontSize: 10 }} />
                    <Chip size="small" label="Actual" sx={{ bgcolor: '#5281b3', color: 'white', fontSize: 10 }} />
                  </Stack>
                </Stack>
                <DualLine a={DAILY_PRODUCTION} b={DAILY_PLAN} />
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  {DAYS.map((d) => (
                    <Typography key={d} sx={{ fontSize: 10, color: 'text.secondary' }}>{d}</Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* 2. 제품별 생산 */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>제품별 생산 실적 (주간 누적)</Typography>
                <Stack spacing={1.25}>
                  {ITEM_PRODUCTION.map((it) => {
                    const ratio = (it.produced / it.planned) * 100;
                    return (
                      <Box key={it.itemNm}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
                          <Typography variant="body2" noWrap sx={{ flex: 1 }}>{it.itemNm}</Typography>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                            {it.produced.toLocaleString()} / {it.planned.toLocaleString()} ({ratio.toFixed(0)}%)
                          </Typography>
                        </Stack>
                        <Box sx={{ position: 'relative', height: 12, bgcolor: 'grey.100', borderRadius: 0.5 }}>
                          <Box sx={{ position: 'absolute', inset: 0, width: `${Math.min(ratio, 110)}%`, bgcolor: it.color, borderRadius: 0.5, opacity: ratio >= 100 ? 1 : 0.85 }} />
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* 3. 공장 재고 */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>공장별 재고 가동률</Typography>
                <Stack spacing={1.5}>
                  {PLANT_STOCK.map((p) => {
                    const ratio = (p.stock / p.capacity) * 100;
                    const color = ratio > 90 ? '#ef4444' : ratio > 75 ? '#f59e0b' : '#10b981';
                    return (
                      <Box key={p.plant}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{p.plant}</Typography>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                            {p.stock.toLocaleString()} / {p.capacity.toLocaleString()} ({ratio.toFixed(0)}%)
                          </Typography>
                        </Stack>
                        <Box sx={{ position: 'relative', height: 10, bgcolor: 'grey.100', borderRadius: 0.5 }}>
                          <Box sx={{ position: 'absolute', inset: 0, width: `${ratio}%`, bgcolor: color, borderRadius: 0.5 }} />
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* 4. 재고 상태 분포 */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>재고 상태 분포 (전 SKU)</Typography>
                <Stack spacing={1.5}>
                  {STOCK_STATE.map((s) => {
                    const total = STOCK_STATE.reduce((sum, x) => sum + x.count, 0);
                    const ratio = (s.count / total) * 100;
                    return (
                      <Stack key={s.grade} direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 12, height: 12, bgcolor: s.color, borderRadius: 0.25 }} />
                        <Typography variant="body2" sx={{ flex: 1 }}>{s.grade}</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', minWidth: 80, textAlign: 'right', fontWeight: 600 }}>
                          {s.count} SKU
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 50, textAlign: 'right' }}>
                          {ratio.toFixed(1)}%
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" color="text.secondary">
                  총 187 SKU · 결품 위험 7개 (3.7%) — 즉시 조치 필요
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MockShell>
  );
}

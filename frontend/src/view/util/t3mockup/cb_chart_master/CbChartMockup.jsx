import React from 'react';
import { Box, Stack, Chip, Typography, Card, CardContent, Grid, LinearProgress } from '@mui/material';
import MockShell from '../_shared/MockShell';
import { FORECAST_TS, ACTUAL_TS, WEEK_BUCKETS, KPI_CARDS } from '../_data/mockData';

function SparkLine({ data, color = '#5281b3' }) {
  const max = Math.max(...data.filter((v) => v != null)), min = 0;
  const range = max - min || 1;
  const dx = 100 / (data.length - 1 || 1);
  const points = data.filter((v) => v != null).map((v, i) => `${(i * dx).toFixed(1)},${(40 - ((v - min) / range) * 35 - 2).toFixed(1)}`).join(' ');
  return (
    <svg width="100%" height={40} viewBox="0 0 100 40" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

export default function CbChartMockup() {
  return (
    <MockShell
      patternCode="cb_chart_master"
      patternLabel="CB — 차트형 컨트롤보드"
      layoutCategory="LAYOUT_CONTROLBOARD"
      description="버전 상태 + 단계 + KPI 카드 + 다중 sparkline 차트. 빠른 시각 점검."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Chip size="small" color="info" label="V_2026_04_W15" sx={{ fontFamily: 'monospace' }} />
          <Chip size="small" color="success" label="CONFIRMED" />
          <Typography variant="body2">2026-04-13 14:30:42 · 5분 47초 실행</Typography>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        {/* KPI Cards + sparkline */}
        <Grid container spacing={1.5}>
          {KPI_CARDS.map((kpi, i) => (
            <Grid item xs={12} md={4} key={kpi.kpiCd}>
              <Card variant="outlined">
                <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                    <Typography variant="body2" color="text.secondary">{kpi.kpiNm}</Typography>
                    <Chip size="small" variant="outlined" label={`목표 ${kpi.target}${kpi.unit}`} sx={{ fontSize: 10, height: 18 }} />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {kpi.value.toLocaleString()}<Typography component="span" variant="caption">{kpi.unit}</Typography>
                    </Typography>
                    <Box sx={{ width: 100 }}>
                      <SparkLine data={[60, 58, 62, 64, 70, 68, 72, kpi.value]} color={['#5281b3', '#2a9d8f', '#fa7d5b', '#8b5cf6', '#ffb100', '#06b6d4'][i % 6]} />
                    </Box>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, (kpi.value / (kpi.target * 1.2)) * 100)}
                    sx={{ mt: 1.5, height: 6, borderRadius: 3 }}
                    color={(kpi.value >= kpi.target) === (kpi.trend === 'up') ? 'success' : 'warning'}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Multi-line summary */}
        <Card variant="outlined" sx={{ mt: 1.5 }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>품목별 주차 추이 (Forecast)</Typography>
            <Stack spacing={0.5}>
              {FORECAST_TS.map((row, i) => (
                <Stack key={row.itemCd} direction="row" alignItems="center" spacing={2}>
                  <Typography sx={{ width: 200, fontSize: 12 }}>{row.itemNm}</Typography>
                  <Box sx={{ flex: 1 }}>
                    <SparkLine data={WEEK_BUCKETS.map((w) => row[w])} color={['#5281b3', '#fa7d5b', '#2a9d8f', '#8b5cf6', '#ffb100'][i % 5]} />
                  </Box>
                  <Typography sx={{ width: 80, fontSize: 12, fontFamily: 'monospace', textAlign: 'right' }}>
                    {WEEK_BUCKETS.reduce((s, w) => s + row[w], 0).toLocaleString()}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}

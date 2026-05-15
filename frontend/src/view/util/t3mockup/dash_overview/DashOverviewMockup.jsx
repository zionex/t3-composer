import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Chip, Grid, LinearProgress } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

import MockShell from '../_shared/MockShell';
import { KPI_CARDS, WEEK_BUCKETS, FORECAST_TS, ACTUAL_TS } from '../_data/mockData';

function LineChart({ a, b, width = 800, height = 200 }) {
  const all = [...a, ...b];
  const max = Math.max(...all);
  const min = Math.min(...all);
  const range = max - min || 1;
  const dx = width / (a.length - 1 || 1);
  const toPts = (data) =>
    data.map((v, i) => `${(i * dx).toFixed(1)},${(height - ((v - min) / range) * (height - 30) - 15).toFixed(1)}`).join(' ');
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline points={toPts(a)} fill="none" stroke="#5281b3" strokeWidth={2} />
      <polyline points={toPts(b)} fill="none" stroke="#2a9d8f" strokeWidth={2.5} />
    </svg>
  );
}

export default function DashOverviewMockup() {
  // KPI 6종 활용
  const forecastData = WEEK_BUCKETS.map((w) => FORECAST_TS[0][w]);
  const actualData   = WEEK_BUCKETS.map((w) => ACTUAL_TS[0][w]);

  return (
    <MockShell
      patternCode="dash_overview"
      patternLabel="Overview — 전사 개요"
      layoutCategory="LAYOUT_DASHBOARD"
      description="전사 KPI 6종 + 트렌드 라인차트. 가장 단순한 종합 요약 (UI_DASH_OVERVIEW)"
    >
      <Box sx={{ p: 2 }}>
        {/* KPI 6종 */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {KPI_CARDS.map((k) => {
            const isReverseGood = k.kpiCd === 'K03' || k.kpiCd === 'K04' || k.kpiCd === 'K06';
            const isGood = isReverseGood ? k.trend === 'down' : k.trend === 'up';
            const color = isGood ? 'success.main' : 'error.main';
            const Icon = k.trend === 'up' ? TrendingUpIcon : TrendingDownIcon;
            const ratio = (k.value / k.target) * 100;
            return (
              <Grid item xs={6} md={2} key={k.kpiCd}>
                <Card variant="outlined">
                  <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="caption" color="text.secondary">{k.kpiNm}</Typography>
                    <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mt: 0.5 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {typeof k.value === 'number' && k.value > 1000 ? k.value.toLocaleString() : k.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{k.unit}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                      <Icon fontSize="small" sx={{ color, fontSize: 14 }} />
                      <Typography variant="caption" color="text.secondary">목표 {k.target}{k.unit}</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(ratio, 100)}
                      sx={{ mt: 0.5, height: 4, borderRadius: 0.5 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* 트렌드 라인차트 */}
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                주간 수요 트렌드 — LED Module 60W (Forecast vs Actual)
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip size="small" label="Forecast" sx={{ bgcolor: '#5281b3', color: 'white', fontSize: 10 }} />
                <Chip size="small" label="Actual"   sx={{ bgcolor: '#2a9d8f', color: 'white', fontSize: 10 }} />
              </Stack>
            </Stack>
            <LineChart a={forecastData} b={actualData} />
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
              {WEEK_BUCKETS.map((w) => (
                <Typography key={w} sx={{ fontSize: 10, color: 'text.secondary' }}>{w}</Typography>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}

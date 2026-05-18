import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Chip, LinearProgress, Grid } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

import MockShell from '../_shared/MockShell';
import { KPI_CARDS, FORECAST_TS, WEEK_BUCKETS, ALERTS } from '../_data/mockData';

// 간단한 SVG line chart
function LineChart({ data, width = 600, height = 180, color = '#5281b3' }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const dx = width / (data.length - 1 || 1);
  const points = data.map((v, i) => `${(i * dx).toFixed(1)},${(height - ((v - min) / range) * (height - 20) - 10).toFixed(1)}`).join(' ');
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} />
      {data.map((v, i) => {
        const cx = i * dx;
        const cy = height - ((v - min) / range) * (height - 20) - 10;
        return <circle key={i} cx={cx} cy={cy} r={3} fill={color} />;
      })}
    </svg>
  );
}

function BarChart({ values, labels, color = '#2a9d8f', height = 160 }) {
  const max = Math.max(...values) || 1;
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', height, gap: 0.5, mt: 1 }}>
      {values.map((v, i) => (
        <Stack key={i} flex={1} alignItems="center" justifyContent="flex-end" spacing={0.25}>
          <Box sx={{ width: '70%', height: `${(v / max) * 80}%`, backgroundColor: color, borderRadius: 0.5 }} />
          <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{labels[i]}</Typography>
        </Stack>
      ))}
    </Box>
  );
}

export default function WidgetDashboardMockup() {
  const forecastSeries = FORECAST_TS[0]; // LED Module 60W
  const forecastData = WEEK_BUCKETS.map((w) => forecastSeries[w]);

  return (
    <MockShell
      patternCode="widget_dashboard"
      patternLabel="P01 — 위젯 대시보드"
      layoutCategory="LAYOUT_SINGLE"
      description="DashboardPanel 기반 위젯 그리드. KPI 카드 + 차트 + 그리드 위젯을 자유 배치."
    >
      <Box sx={{ p: 2 }}>
        {/* KPI Cards */}
        <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
          {KPI_CARDS.map((kpi) => {
            const isGoodTrend = (kpi.kpiCd === 'K03' || kpi.kpiCd === 'K04' || kpi.kpiCd === 'K06') ? kpi.trend === 'down' : kpi.trend === 'up';
            const trendColor = isGoodTrend ? 'success.main' : 'error.main';
            const Icon = kpi.trend === 'up' ? TrendingUpIcon : TrendingDownIcon;
            return (
              <Grid item xs={6} md={2} key={kpi.kpiCd}>
                <Card variant="outlined">
                  <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="caption" color="text.secondary">{kpi.kpiNm}</Typography>
                    <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mt: 0.5 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>{kpi.value.toLocaleString()}</Typography>
                      <Typography variant="caption" color="text.secondary">{kpi.unit}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                      <Icon fontSize="small" sx={{ color: trendColor, fontSize: 16 }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        목표 {kpi.target}{kpi.unit}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Charts */}
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={8}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2">주차별 수요 예측 — LED Module 60W</Typography>
                  <Chip size="small" label="12 weeks" />
                </Stack>
                <LineChart data={forecastData} />
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  {WEEK_BUCKETS.map((w) => (
                    <Typography key={w} sx={{ fontSize: 10, color: 'text.secondary' }}>{w}</Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2">품목군별 비중</Typography>
                <BarChart values={[42, 28, 18, 12]} labels={['LED', 'CAM', 'BATT', 'DISP']} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Alerts */}
        <Card variant="outlined" sx={{ mt: 1.5 }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>최근 알람 ({ALERTS.length})</Typography>
            <Stack spacing={0.5}>
              {ALERTS.map((al) => (
                <Stack key={al.id} direction="row" spacing={1} alignItems="center" sx={{ fontSize: 13 }}>
                  <Chip
                    size="small"
                    label={al.severity}
                    color={al.severity === 'CRITICAL' ? 'error' : (al.severity === 'WARNING' ? 'warning' : 'info')}
                    sx={{ width: 80 }}
                  />
                  <Typography sx={{ fontSize: 13, flex: 1 }}>{al.message}</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', fontFamily: 'monospace' }}>{al.dttm}</Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}

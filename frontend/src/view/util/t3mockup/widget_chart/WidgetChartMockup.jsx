import React from 'react';
import { Box, Card, CardContent, Typography, Chip, Stack } from '@mui/material';
import MockShell from '../_shared/MockShell';
import { FORECAST_TS, WEEK_BUCKETS } from '../_data/mockData';

function LineSpark({ data, color }) {
  const max = Math.max(...data); const min = 0;
  const range = max - min || 1;
  const dx = 400 / (data.length - 1);
  const points = data.map((v, i) => `${(i * dx).toFixed(1)},${(180 - ((v - min) / range) * 160 - 10).toFixed(1)}`).join(' ');
  return (
    <svg width="100%" height={180} viewBox="0 0 400 180" preserveAspectRatio="none">
      <polyline points={`0,180 ${points} 400,180`} fill={color} fillOpacity={0.15} stroke="none" />
      <polyline points={points} fill="none" stroke={color} strokeWidth={2.5} />
      {data.map((v, i) => <circle key={i} cx={i * dx} cy={180 - ((v - min) / range) * 160 - 10} r={3} fill={color} />)}
    </svg>
  );
}

export default function WidgetChartMockup() {
  const row = FORECAST_TS[0];
  const data = WEEK_BUCKETS.map((w) => row[w]);
  const total = data.reduce((s, v) => s + v, 0);
  const avg = Math.round(total / data.length);

  return (
    <MockShell
      patternCode="widget_chart"
      patternLabel="위젯 — 차트형 (DashboardPanel 안에 배치)"
      layoutCategory="WIDGET"
      description="DashboardPanel grid 의 한 셀에 들어가는 차트 위젯. 단일 시리즈 + 요약 수치."
    >
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'grey.50', height: '100%' }}>
        <Card variant="outlined" sx={{ width: 480 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">주차별 수요 예측</Typography>
                <Typography variant="subtitle1">{row.itemNm}</Typography>
              </Box>
              <Chip size="small" label="W14 ~ W25" />
            </Stack>
            <LineSpark data={data} color="#5281b3" />
            <Stack direction="row" justifyContent="space-around" sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
              <Stack alignItems="center">
                <Typography variant="caption" color="text.secondary">합계</Typography>
                <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>{total.toLocaleString()}</Typography>
              </Stack>
              <Stack alignItems="center">
                <Typography variant="caption" color="text.secondary">평균/주</Typography>
                <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>{avg.toLocaleString()}</Typography>
              </Stack>
              <Stack alignItems="center">
                <Typography variant="caption" color="text.secondary">최대</Typography>
                <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>{Math.max(...data).toLocaleString()}</Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}

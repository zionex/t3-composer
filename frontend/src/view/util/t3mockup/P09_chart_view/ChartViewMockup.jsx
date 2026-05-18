import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Card, CardContent, Typography, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import MockShell from '../_shared/MockShell';
import { FORECAST_TS, WEEK_BUCKETS } from '../_data/mockData';

function MultiAreaChart({ series, width = 1000, height = 380 }) {
  const allValues = series.flatMap((s) => s.data);
  const max = Math.max(...allValues);
  const range = max || 1;
  const colors = ['#5281b3', '#fa7d5b', '#2a9d8f', '#8b5cf6', '#ffb100'];
  const yAxisCount = 5;
  const padding = { top: 30, right: 30, bottom: 40, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* y-axis labels */}
      {Array.from({ length: yAxisCount }).map((_, i) => {
        const p = i / (yAxisCount - 1);
        const yy = padding.top + chartH - p * chartH;
        const v = Math.round(p * max);
        return (
          <g key={i}>
            <line x1={padding.left} y1={yy} x2={padding.left + chartW} y2={yy} stroke="#e0e0e0" strokeDasharray="3 3" />
            <text x={padding.left - 8} y={yy + 4} textAnchor="end" style={{ fontSize: 11, fill: '#888' }}>{v.toLocaleString()}</text>
          </g>
        );
      })}
      {/* x-axis labels */}
      {WEEK_BUCKETS.map((w, i) => {
        const x = padding.left + (chartW / (WEEK_BUCKETS.length - 1)) * i;
        return <text key={w} x={x} y={height - 15} textAnchor="middle" style={{ fontSize: 11, fill: '#888' }}>{w}</text>;
      })}
      {/* series */}
      {series.map((s, si) => {
        const data = s.data;
        const dx = chartW / (data.length - 1 || 1);
        const points = data.map((v, i) => `${(padding.left + i * dx).toFixed(1)},${(padding.top + chartH - (v / range) * chartH).toFixed(1)}`).join(' ');
        return (
          <g key={si}>
            <polyline points={points} fill="none" stroke={colors[si % colors.length]} strokeWidth={2.5} />
            {data.map((v, i) => (
              <circle key={i} cx={padding.left + i * dx} cy={padding.top + chartH - (v / range) * chartH} r={4} fill={colors[si % colors.length]} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export default function ChartViewMockup() {
  return (
    <MockShell
      patternCode="P09_chart_view"
      patternLabel="P09 — 차트 단독"
      layoutCategory="LAYOUT_SINGLE"
      description="검색 + 큰 차트 1개. 그리드 없이 시각화에만 집중. 트렌드 분석·이상 탐지에 사용."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="기간" size="small" value="2026-W14 ~ W25" sx={{ width: 180 }} />
          <TextField label="비교 모드" size="small" select value="OVERLAY" sx={{ width: 150 }}>
            <MenuItem value="OVERLAY">중첩</MenuItem>
            <MenuItem value="STACK">스택</MenuItem>
          </TextField>
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>
      <Box sx={{ p: 2, flex: 1 }}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6">품목별 주차별 수요 예측 (Top 5)</Typography>
              <Stack direction="row" spacing={1}>
                {FORECAST_TS.slice(0, 5).map((s, i) => (
                  <Chip key={s.itemCd} size="small" label={s.itemNm} sx={{ backgroundColor: ['#5281b3', '#fa7d5b', '#2a9d8f', '#8b5cf6', '#ffb100'][i], color: 'white' }} />
                ))}
              </Stack>
            </Stack>
            <Box sx={{ flex: 1 }}>
              <MultiAreaChart series={FORECAST_TS.slice(0, 5).map((s) => ({ name: s.itemNm, data: WEEK_BUCKETS.map((w) => s[w]) }))} />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}

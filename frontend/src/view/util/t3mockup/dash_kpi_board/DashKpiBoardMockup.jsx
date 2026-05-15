import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Chip, Grid } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

import MockShell from '../_shared/MockShell';

// KPI Board — 9개 큰 폰트 KPI 카드 + sparkline + 상태칩
const KPI_9 = [
  { name: '월 매출',           value: '9,807',  unit: '백만원',  target: 9500,  trend: 'up',   delta: '+3.2%', spark: [820,840,855,870,910,945,980],  status: 'GOOD' },
  { name: 'GP 마진',           value: '34.2',   unit: '%',        target: 32.0,  trend: 'up',   delta: '+2.2pt', spark: [31.5,32.0,32.4,32.8,33.5,34.0,34.2], status: 'GOOD' },
  { name: '주문 충족률',       value: '96.4',   unit: '%',        target: 95.0,  trend: 'up',   delta: '+1.4pt', spark: [94.2,94.8,95.1,95.6,95.9,96.2,96.4], status: 'GOOD' },
  { name: '재고 회전율',       value: '11.3',   unit: 'x',        target: 12.0,  trend: 'down', delta: '−0.7x',  spark: [12.2,12.0,11.8,11.6,11.5,11.4,11.3], status: 'WARN' },
  { name: '결품률',            value: '1.2',    unit: '%',        target: 2.0,   trend: 'down', delta: '−0.4pt', spark: [1.8,1.7,1.5,1.4,1.3,1.2,1.2],         status: 'GOOD' },
  { name: 'MAPE',              value: '8.7',    unit: '%',        target: 10.0,  trend: 'down', delta: '−1.3pt', spark: [10.5,10.2,9.8,9.4,9.1,8.9,8.7],       status: 'GOOD' },
  { name: '리드타임',          value: '14.2',   unit: 'days',     target: 14.0,  trend: 'up',   delta: '+0.2',   spark: [13.8,13.9,14.0,14.0,14.1,14.2,14.2], status: 'WARN' },
  { name: '재고 정확도',       value: '98.7',   unit: '%',        target: 98.0,  trend: 'up',   delta: '+0.7pt', spark: [98.0,98.2,98.3,98.5,98.6,98.7,98.7], status: 'GOOD' },
  { name: '계획 변경율',       value: '4.8',    unit: '%',        target: 5.0,   trend: 'down', delta: '−0.5pt', spark: [5.5,5.3,5.2,5.0,4.9,4.8,4.8],         status: 'GOOD' },
];

function Sparkline({ data, color = '#5281b3', width = 120, height = 36 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const dx = width / (data.length - 1 || 1);
  const points = data.map((v, i) =>
    `${(i * dx).toFixed(1)},${(height - ((v - min) / range) * (height - 8) - 4).toFixed(1)}`
  ).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
}

const STATUS_COLOR = { GOOD: 'success', WARN: 'warning', BAD: 'error' };

export default function DashKpiBoardMockup() {
  return (
    <MockShell
      patternCode="dash_kpi_board"
      patternLabel="KPI Board — 통합 KPI"
      layoutCategory="LAYOUT_DASHBOARD"
      description="KPI 카드 9개 + sparkline + 상태칩. 큰 폰트로 한눈에 (UI_DASH_KPI_BOARD)"
    >
      <Box sx={{ p: 2 }}>
        <Grid container spacing={1.5}>
          {KPI_9.map((k) => {
            const isReverseGood = ['재고 회전율', '결품률', 'MAPE', '리드타임', '계획 변경율'].includes(k.name);
            const isGood = isReverseGood ? k.trend === 'down' : k.trend === 'up';
            const deltaColor = isGood ? 'success.main' : 'error.main';
            const Icon = k.trend === 'up' ? TrendingUpIcon : TrendingDownIcon;
            const sparkColor = isGood ? '#2a9d8f' : '#e76f51';
            return (
              <Grid item xs={12} sm={6} md={4} key={k.name}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{k.name}</Typography>
                      <Chip size="small" label={k.status} color={STATUS_COLOR[k.status]} sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
                    </Stack>
                    <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mb: 1 }}>
                      <Typography sx={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{k.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{k.unit}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Icon fontSize="small" sx={{ color: deltaColor, fontSize: 16 }} />
                      <Typography variant="caption" sx={{ color: deltaColor, fontWeight: 600 }}>{k.delta}</Typography>
                      <Typography variant="caption" color="text.secondary">vs 목표 {k.target}{k.unit}</Typography>
                      <Box sx={{ flex: 1 }} />
                      <Sparkline data={k.spark} color={sparkColor} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </MockShell>
  );
}

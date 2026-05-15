import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Chip, Grid } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import MockShell from '../_shared/MockShell';

// 12주 정시 출하율 trend
const WEEKS = ['W14','W15','W16','W17','W18','W19','W20','W21','W22','W23','W24','W25'];
const ONTIME_PCT = [92.4, 93.8, 91.2, 94.5, 95.7, 93.1, 96.0, 95.8, 96.4, 97.2, 96.8, 96.4];

// 지연 사유 도넛
const DELAY_REASONS = [
  { reason: '자재 미입고',      value: 38, color: '#5281b3' },
  { reason: '생산 지연',         value: 24, color: '#fa7d5b' },
  { reason: '운송 지연',         value: 18, color: '#f59e0b' },
  { reason: '품질 불량',         value: 12, color: '#ef4444' },
  { reason: '기타',              value: 8,  color: '#94a3b8' },
];

function LineChart({ data, width = 800, height = 200, color = '#5281b3', target }) {
  const max = Math.max(...data) + 2;
  const min = Math.min(...data) - 2;
  const range = max - min || 1;
  const dx = width / (data.length - 1 || 1);
  const points = data.map((v, i) =>
    `${(i * dx).toFixed(1)},${(height - ((v - min) / range) * (height - 30) - 15).toFixed(1)}`
  ).join(' ');
  const targetY = target != null ? height - ((target - min) / range) * (height - 30) - 15 : null;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {targetY != null && (
        <line x1={0} y1={targetY} x2={width} y2={targetY} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4,4" />
      )}
      <polyline points={points} fill="none" stroke={color} strokeWidth={2.5} />
      {data.map((v, i) => {
        const cx = i * dx;
        const cy = height - ((v - min) / range) * (height - 30) - 15;
        return <circle key={i} cx={cx} cy={cy} r={3} fill={color} />;
      })}
    </svg>
  );
}

function DonutChart({ data, size = 180 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = size / 2 - 18;
  const cx = size / 2;
  const cy = size / 2;
  let startAngle = -Math.PI / 2;
  const arcs = data.map((d) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const x1 = cx + Math.cos(startAngle) * radius;
    const y1 = cy + Math.sin(startAngle) * radius;
    const x2 = cx + Math.cos(startAngle + angle) * radius;
    const y2 = cy + Math.sin(startAngle + angle) * radius;
    const large = angle > Math.PI ? 1 : 0;
    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
    startAngle += angle;
    return { path, color: d.color };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((a, i) => (
        <path key={i} d={a.path} stroke={a.color} strokeWidth={20} fill="none" />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" sx={{ fontSize: 14 }} fontSize={14} fontWeight={600}>총 지연</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize={18} fontWeight={700}>{total}건</text>
    </svg>
  );
}

export default function DashOntimeSalesMockup() {
  return (
    <MockShell
      patternCode="dash_ontime_sales"
      patternLabel="On-Time Sales — 정시 출하"
      layoutCategory="LAYOUT_DASHBOARD"
      description="정시 출하율 trend + 지연 사유 도넛 (UI_SA_ONTIME_SALES)"
    >
      <Box sx={{ p: 2 }}>
        <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
          <Grid item xs={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">금주 정시 출하율</Typography>
                <Typography sx={{ fontSize: 32, fontWeight: 700 }}>96.4%</Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <TrendingUpIcon fontSize="small" sx={{ color: 'success.main', fontSize: 16 }} />
                  <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>+1.4pt</Typography>
                  <Typography variant="caption" color="text.secondary">vs 목표 95%</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">월 평균</Typography>
                <Typography sx={{ fontSize: 32, fontWeight: 700 }}>95.8%</Typography>
                <Typography variant="caption" color="text.secondary">전월 94.2% → +1.6pt</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">총 지연 건수</Typography>
                <Typography sx={{ fontSize: 32, fontWeight: 700 }}>100</Typography>
                <Typography variant="caption" color="text.secondary">전주 145 → −31%</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">가장 큰 지연 사유</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>자재 미입고</Typography>
                <Typography variant="caption" color="text.secondary">38건 (38%)</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={1.5}>
          <Grid item xs={12} md={8}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>주간 정시 출하율 추이</Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip size="small" label="Actual" sx={{ bgcolor: '#5281b3', color: 'white', fontSize: 10 }} />
                    <Chip size="small" label="Target 95%" variant="outlined" sx={{ fontSize: 10 }} />
                  </Stack>
                </Stack>
                <LineChart data={ONTIME_PCT} target={95.0} />
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  {WEEKS.map((w) => (
                    <Typography key={w} sx={{ fontSize: 10, color: 'text.secondary' }}>{w}</Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>지연 사유 분포</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                  <DonutChart data={DELAY_REASONS} />
                </Box>
                <Stack spacing={0.5}>
                  {DELAY_REASONS.map((r) => (
                    <Stack key={r.reason} direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 10, height: 10, bgcolor: r.color, borderRadius: 0.25 }} />
                      <Typography variant="caption" sx={{ flex: 1 }}>{r.reason}</Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.value}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MockShell>
  );
}

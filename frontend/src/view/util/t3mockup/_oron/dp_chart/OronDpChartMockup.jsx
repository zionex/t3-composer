import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import MockShell from '../../_shared/MockShell';

// OronDp02 — 판매계획 입력/보고서 (Chart)
// UI_DP_95_CHART, UI_DP_96_CHART, UI_DP_96

const MONTHS = ['2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'];
const SERIES = [
  { name: '판매계획 (V2026-05)',  color: '#3b82f6', data: [12000, 13500, 14000, 13500, 13000, 13500, 14500] },
  { name: '판매계획 (V2026-04)',  color: '#94a3b8', data: [11500, 13000, 13800, 13200, 12800, 13000, 14000] },
  { name: '판매실적',              color: '#10b981', data: [11500, 12800, 13200, null,  null,  null,  null ] },
  { name: 'BF 베이스라인',         color: '#f59e0b', data: [12200, 13300, 13900, 13400, 13100, 13400, 14200] },
];
const STACK_SERIES = [
  { name: '온라인', color: '#3b82f6', data: [7500, 8200, 8500, 8000, 7800, 8000, 8500] },
  { name: '오프라인', color: '#10b981', data: [3000, 3300, 3500, 3500, 3200, 3500, 4000] },
  { name: 'OEM',    color: '#f59e0b', data: [1500, 2000, 2000, 2000, 2000, 2000, 2000] },
];

function LineChart() {
  const W = 700, H = 280, P = 35;
  const xStep = (W - P * 2) / (MONTHS.length - 1);
  const yScale = (v) => H - P - ((v - 10000) / (16000 - 10000)) * (H - P * 2);

  return (
    <Paper variant="outlined" sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <ShowChartIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>판매계획 추이 — 4개 시리즈 비교</Typography>
        <Box sx={{ flexGrow: 1 }} />
        {SERIES.map((s) => (
          <Stack key={s.name} direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ width: 12, height: 3, backgroundColor: s.color, borderRadius: 1 }} />
            <Typography variant="caption">{s.name}</Typography>
          </Stack>
        ))}
      </Stack>
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
          {[10000, 12000, 14000, 16000].map((y) => (
            <g key={y}>
              <line x1={P} y1={yScale(y)} x2={W - P} y2={yScale(y)} stroke="#e5e7eb" strokeWidth="0.5" />
              <text x={P - 5} y={yScale(y)} fill="#9ca3af" fontSize="10" textAnchor="end" dy="3">{(y / 1000).toFixed(0)}k</text>
            </g>
          ))}
          {MONTHS.map((m, i) => (
            <text key={m} x={P + xStep * i} y={H - 8} fill="#6b7280" fontSize="10" textAnchor="middle">{m.slice(5)}</text>
          ))}
          {SERIES.map((s) => {
            const pts = s.data.map((v, i) => ({ v, x: P + xStep * i, hasValue: v != null })).filter((p) => p.hasValue);
            const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${yScale(p.v)}`).join(' ');
            return (
              <g key={s.name}>
                <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeDasharray={s.name.includes('실적') ? undefined : s.name.includes('V2026-04') ? '5 3' : undefined} />
                {pts.map((p, i) => (
                  <circle key={i} cx={p.x} cy={yScale(p.v)} r="3.5" fill={s.color} />
                ))}
              </g>
            );
          })}
        </svg>
      </Box>
    </Paper>
  );
}

function StackBarChart() {
  const W = 700, H = 220, P = 35;
  const xStep = (W - P * 2) / MONTHS.length;
  const yMax = 16000;
  const yScale = (v) => H - P - (v / yMax) * (H - P * 2);

  return (
    <Paper variant="outlined" sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <BarChartIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>채널별 판매계획 (Stacked)</Typography>
        <Box sx={{ flexGrow: 1 }} />
        {STACK_SERIES.map((s) => (
          <Stack key={s.name} direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ width: 12, height: 10, backgroundColor: s.color, borderRadius: 0.5 }} />
            <Typography variant="caption">{s.name}</Typography>
          </Stack>
        ))}
      </Stack>
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
          {[0, 5000, 10000, 15000].map((y) => (
            <g key={y}>
              <line x1={P} y1={yScale(y)} x2={W - P} y2={yScale(y)} stroke="#e5e7eb" strokeWidth="0.5" />
              <text x={P - 5} y={yScale(y)} fill="#9ca3af" fontSize="10" textAnchor="end" dy="3">{(y / 1000).toFixed(0)}k</text>
            </g>
          ))}
          {MONTHS.map((m, i) => {
            const x = P + xStep * i + xStep / 2 - 12;
            let yBase = yScale(0);
            return (
              <g key={m}>
                {STACK_SERIES.map((s) => {
                  const v = s.data[i];
                  const top = yScale(v);
                  const height = yBase - top;
                  const rect = <rect key={s.name} x={x} width={24} y={top - (yBase - yScale(0)) + (H - P - yBase + yScale(0))} height={height} fill={s.color} />;
                  yBase = top;
                  return rect;
                })}
                <text x={P + xStep * i + xStep / 2} y={H - 8} fill="#6b7280" fontSize="10" textAnchor="middle">{m.slice(5)}</text>
              </g>
            );
          })}
        </svg>
      </Box>
    </Paper>
  );
}

export default function OronDpChartMockup() {
  return (
    <MockShell
      patternCode="oron_dp_chart"
      patternLabel="ORON — 판매계획 입력/보고서 (Chart)"
      layoutCategory="LAYOUT_V2"
      description="라인 차트 (V2026-05 vs V2026-04 vs 실적 vs BF) + 채널별 Stacked Bar."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="브랜드" size="small" select value="ORON" sx={{ width: 130 }}>
            <MenuItem value="ORON">ORON</MenuItem>
          </TextField>
          <TextField label="Lvl3" size="small" select value="MASK" sx={{ width: 130 }}>
            <MenuItem value="MASK">MASK</MenuItem>
          </TextField>
          <TextField label="품목" size="small" value="F01001 / 오론 비건마스크 5매" sx={{ width: 300 }} />
          <TextField label="기간" size="small" value="2026-06 ~ 12" sx={{ width: 150 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
        <Box sx={{ flex: 1.3 }}><LineChart /></Box>
        <Box sx={{ flex: 1 }}><StackBarChart /></Box>
      </Box>
    </MockShell>
  );
}

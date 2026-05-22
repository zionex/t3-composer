import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MockShell from '../../_shared/MockShell';

// BfKtng03 — 수요예측 정확도 (추이). 시계열 라인 차트 + 비교 그리드 패턴.

// 월별 정확도 추이 (12개월)
const MONTHS = ['2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05'];
const SERIES = [
  { name: 'M-1 정확도',  color: '#3b82f6', data: [78.2, 80.1, 79.5, 81.3, 82.0, 83.1, 84.2, 83.8, 82.5, 84.0, 85.2, 86.1] },
  { name: 'M-2 정확도',  color: '#10b981', data: [72.5, 74.0, 73.8, 75.5, 76.2, 77.5, 78.5, 78.2, 77.1, 78.5, 79.8, 80.5] },
  { name: 'M-3 정확도',  color: '#f59e0b', data: [68.0, 69.5, 69.0, 70.8, 71.5, 72.8, 73.5, 73.0, 72.2, 73.8, 75.0, 75.8] },
];
const TARGET_LINE = 85.0;

const TABLE_COLS = [
  { name: 'period', label: '월',     width: 90,  align: 'center' },
  { name: 'fcst1',  label: 'M-1',    width: 80,  align: 'right' },
  { name: 'fcst2',  label: 'M-2',    width: 80,  align: 'right' },
  { name: 'fcst3',  label: 'M-3',    width: 80,  align: 'right' },
  { name: 'actual', label: '실적',    width: 90,  align: 'right' },
  { name: 'mape1',  label: 'MAPE M-1',width: 90,  align: 'right' },
  { name: 'mape3',  label: 'MAPE M-3',width: 90,  align: 'right' },
];

const TABLE_ROWS = MONTHS.slice(-6).map((m, i) => ({
  period: m,
  fcst1: 86.1, fcst2: 80.5, fcst3: 75.8,
  actual: [82, 84, 88, 91, 87, 89][i],
  mape1: [86.1, 84.0, 85.2, 86.5, 85.0, 86.8][i],
  mape3: [75.8, 73.0, 74.5, 75.2, 73.5, 75.0][i],
}));

// SVG 차트 — 단순화
function LineChart() {
  const W = 600, H = 220, P = 30;
  const xStep = (W - P * 2) / (MONTHS.length - 1);
  const yScale = (v) => H - P - ((v - 50) / (100 - 50)) * (H - P * 2);
  const targetY = yScale(TARGET_LINE);

  return (
    <Paper variant="outlined" sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>월별 정확도 추이 (12개월)</Typography>
        {SERIES.map((s) => (
          <Stack key={s.name} direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ width: 12, height: 3, backgroundColor: s.color, borderRadius: 1 }} />
            <Typography variant="caption">{s.name}</Typography>
          </Stack>
        ))}
        <Chip size="small" label={`목표 ${TARGET_LINE}%`} color="error" variant="outlined" />
      </Stack>
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
          {/* Y axis grid lines */}
          {[60, 70, 80, 90, 100].map((y) => (
            <g key={y}>
              <line x1={P} y1={yScale(y)} x2={W - P} y2={yScale(y)} stroke="#e5e7eb" strokeWidth="0.5" />
              <text x={P - 5} y={yScale(y)} fill="#9ca3af" fontSize="9" textAnchor="end" dy="3">{y}%</text>
            </g>
          ))}
          {/* Target line */}
          <line x1={P} y1={targetY} x2={W - P} y2={targetY} stroke="#ef4444" strokeWidth="1" strokeDasharray="4 3" />
          {/* X axis labels */}
          {MONTHS.map((m, i) => (
            <text key={m} x={P + xStep * i} y={H - 8} fill="#6b7280" fontSize="9" textAnchor="middle">{m.slice(5)}</text>
          ))}
          {/* Lines */}
          {SERIES.map((s) => {
            const d = s.data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${P + xStep * i} ${yScale(v)}`).join(' ');
            return (
              <g key={s.name}>
                <path d={d} fill="none" stroke={s.color} strokeWidth="2" />
                {s.data.map((v, i) => (
                  <circle key={i} cx={P + xStep * i} cy={yScale(v)} r="3" fill={s.color} />
                ))}
              </g>
            );
          })}
        </svg>
      </Box>
    </Paper>
  );
}

export default function BfAccuracyTrendMockup() {
  return (
    <MockShell
      patternCode="ktng_bf_accuracy_trend"
      patternLabel="KTNG — BF 수요예측 정확도 추이 (BfKtng03)"
      layoutCategory="LAYOUT_SINGLE"
      description="M-1/M-2/M-3 예측 정확도 시계열 추이 라인 차트 + 월별 실적 vs 예측 비교 그리드 + 목표선 (85%)."
    >
      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="SALES_ORG" size="small" select value="ALL" sx={{ width: 140 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="KT&G">국내</MenuItem>
          </TextField>
          <TextField label="ITEM_LV1" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="TC">담배</MenuItem>
            <MenuItem value="NGP">NGP</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2025-06 ~ 2026-05" sx={{ width: 180 }} />
          <TextField label="목표 정확도" size="small" value="85.0%" sx={{ width: 130 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>Excel</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%', overflow: 'auto' }}>
        {/* KPI summary */}
        <Stack direction="row" spacing={1.5}>
          {[
            { label: 'M-1 평균 정확도', value: '83.2%', color: 'primary',  delta: '+1.4pp' },
            { label: 'M-2 평균 정확도', value: '77.0%', color: 'success',  delta: '+1.1pp' },
            { label: 'M-3 평균 정확도', value: '72.1%', color: 'warning',  delta: '+0.9pp' },
            { label: '목표 달성 월',    value: '4/12',  color: 'info',     delta: '+1' },
          ].map((k) => (
            <Paper key={k.label} variant="outlined" sx={{ p: 1.5, flex: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{k.label}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: `${k.color}.main`, mt: 0.5 }}>{k.value}</Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <TrendingUpIcon fontSize="small" color="success" />
                <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>{k.delta}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>vs 작년</Typography>
              </Stack>
            </Paper>
          ))}
        </Stack>

        {/* Trend chart */}
        <Box sx={{ height: 260 }}>
          <LineChart />
        </Box>

        {/* Bottom table */}
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 160, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>월별 예측 vs 실적 (최근 6개월)</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {TABLE_COLS.map((c) => (
                    <TableCell key={c.name} sx={{ backgroundColor: 'grey.100', width: c.width, fontWeight: 700, textAlign: c.align }}>
                      {c.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {TABLE_ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    {TABLE_COLS.map((c) => {
                      const v = r[c.name];
                      const isPct = c.name !== 'period';
                      const color = c.name === 'mape1' || c.name === 'mape3'
                        ? (v >= 85 ? 'success.main' : v >= 75 ? 'warning.main' : 'error.main')
                        : 'inherit';
                      return (
                        <TableCell key={c.name} sx={{ textAlign: c.align, fontFamily: c.name === 'period' ? 'monospace' : 'monospace', color, fontWeight: (c.name === 'mape1' || c.name === 'mape3') ? 600 : 400 }}>
                          {isPct ? `${v.toFixed(1)}%` : v}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}

import React from 'react';
import {
  Box, Card, CardContent, Stack, Typography, Chip, Grid, Divider, FormControl, InputLabel, Select, MenuItem,
  Table, TableHead, TableBody, TableRow, TableCell, Button, IconButton,
} from '@mui/material';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import DownloadIcon from '@mui/icons-material/Download';

import MockShell from '../_shared/MockShell';

const KPI = [
  { name: '총 매출',          value: '₩9,807M',  delta: '+3.2%',  color: '#5281b3' },
  { name: '평균 OTD',         value: '96.4%',    delta: '+1.4pt', color: '#10b981' },
  { name: '결품률',           value: '1.2%',     delta: '−0.4pt', color: '#fa7d5b' },
  { name: 'GP 마진',          value: '34.2%',    delta: '+2.2pt', color: '#8b5cf6' },
];

// Bar chart 데이터 (모듈/거점별)
const PLANT_DATA = [
  { plant: 'KR-Suwon',  sales: 3200, color: '#5281b3' },
  { plant: 'CN-Suzhou', sales: 2480, color: '#2a9d8f' },
  { plant: 'VN-HCMC',   sales: 1850, color: '#fa7d5b' },
  { plant: 'KR-Asan',   sales: 1420, color: '#f59e0b' },
  { plant: 'CN-Wuxi',   sales: 857,  color: '#8b5cf6' },
];

// Trend (월별)
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const TREND = [780, 800, 825, 870, 905, 920, 950, 985, 1010, 1040, 1075, 1100];

// 상세 표 (분석 결과)
const ROWS = [
  { rank: 1, itemGrp: 'CAMERA',  sales: 412, growth: 28.8, share: 22.1, top1: 'IMX-700' },
  { rank: 2, itemGrp: 'BATTERY', sales: 385, growth: 13.2, share: 18.7, top1: '18650' },
  { rank: 3, itemGrp: 'LED',     sales: 295, growth: 1.7,  share: 15.4, top1: '60W' },
  { rank: 4, itemGrp: 'DISPLAY', sales: 268, growth: 9.4,  share: 12.8, top1: 'Panel 55"' },
];

function BarChartH({ data, max }) {
  return (
    <Stack spacing={1}>
      {data.map((d) => (
        <Box key={d.plant}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
            <Typography variant="caption" sx={{ fontWeight: 500 }}>{d.plant}</Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>₩{d.sales.toLocaleString()}M</Typography>
          </Stack>
          <Box sx={{ position: 'relative', height: 12, bgcolor: 'grey.100', borderRadius: 0.5 }}>
            <Box sx={{ position: 'absolute', inset: 0, width: `${(d.sales / max) * 100}%`, bgcolor: d.color, borderRadius: 0.5 }} />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

function LineChart({ data, width = 600, height = 180, color = '#5281b3' }) {
  const max = Math.max(...data);
  const min = Math.min(...data) * 0.95;
  const range = max - min || 1;
  const dx = width / (data.length - 1 || 1);
  const points = data.map((v, i) =>
    `${(i * dx).toFixed(1)},${(height - ((v - min) / range) * (height - 30) - 15).toFixed(1)}`
  ).join(' ');
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth={2.5} />
      {data.map((v, i) => {
        const cx = i * dx;
        const cy = height - ((v - min) / range) * (height - 30) - 15;
        return <circle key={i} cx={cx} cy={cy} r={3} fill={color} />;
      })}
    </svg>
  );
}

export default function AnalysisReportMockup() {
  const maxPlant = Math.max(...PLANT_DATA.map((p) => p.sales));

  return (
    <MockShell
      patternCode="analysis_report"
      patternLabel="Analysis Report — 분석 리포트"
      layoutCategory="LAYOUT_SINGLE"
      description="KPI + 차트 + 분석 표 통합. analysis · analysisreport · report 폴더의 ~18개 운영 화면"
    >
      <Box sx={{ p: 2 }}>
        {/* Scope */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
              <FilterAltOutlinedIcon fontSize="small" color="action" />
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Period</InputLabel>
                <Select label="Period" value="2026Q1" onChange={() => {}}>
                  <MenuItem value="2026Q1">2026 Q1 (1~3월)</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>거점</InputLabel>
                <Select label="거점" value="ALL" onChange={() => {}}>
                  <MenuItem value="ALL">전체</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>제품군</InputLabel>
                <Select label="제품군" value="ALL" onChange={() => {}}>
                  <MenuItem value="ALL">전체</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ flex: 1 }} />
              <Button size="small" variant="outlined" startIcon={<DownloadIcon fontSize="small" />}>Excel</Button>
            </Stack>
          </CardContent>
        </Card>

        {/* KPI 4종 */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {KPI.map((k) => (
            <Grid item xs={6} md={3} key={k.name}>
              <Card variant="outlined" sx={{ borderLeft: '4px solid', borderLeftColor: k.color }}>
                <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary">{k.name}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.25 }}>{k.value}</Typography>
                  <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>{k.delta}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* 차트 2개 */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={12} md={5}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>거점별 매출</Typography>
                <BarChartH data={PLANT_DATA} max={maxPlant * 1.1} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={7}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>월별 매출 추이</Typography>
                  <Chip size="small" label={`12M ₩${TREND.reduce((s, v) => s + v, 0).toLocaleString()}M`} variant="outlined" />
                </Stack>
                <LineChart data={TREND} />
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  {MONTHS.filter((_, i) => i % 2 === 0).map((m) => (
                    <Typography key={m} sx={{ fontSize: 10, color: 'text.secondary' }}>{m}</Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 분석 표 */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>제품군 별 분석 (Top 4)</Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: 'grey.50', fontWeight: 700 } }}>
                  <TableCell align="center" sx={{ width: 50 }}>순위</TableCell>
                  <TableCell>제품군</TableCell>
                  <TableCell align="right">매출 (₩M)</TableCell>
                  <TableCell align="right">YoY %</TableCell>
                  <TableCell align="right">점유율 %</TableCell>
                  <TableCell>Top 1 아이템</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r) => (
                  <TableRow key={r.rank} hover>
                    <TableCell align="center" sx={{ fontWeight: 700, color: r.rank === 1 ? 'primary.main' : 'text.primary' }}>{r.rank}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{r.itemGrp}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{r.sales.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', color: r.growth > 10 ? 'success.main' : 'text.primary', fontWeight: 600 }}>
                      +{r.growth.toFixed(1)}%
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{r.share.toFixed(1)}%</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{r.top1}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" color="text.secondary">
              CAMERA 가 매출 1위 + YoY 성장 28.8% — 분기 우선 투자 권고
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}

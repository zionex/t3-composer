import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Card, CardContent, Typography, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';

import MockShell from '../_shared/MockShell';
import { FORECAST_TS, ACTUAL_TS, WEEK_BUCKETS } from '../_data/mockData';

// 다중 시리즈 line chart
function MultiLineChart({ series, width = 800, height = 220 }) {
  const allValues = series.flatMap((s) => s.data.filter((v) => v != null));
  const max = Math.max(...allValues);
  const min = 0;
  const range = max - min || 1;
  const colors = ['#5281b3', '#fa7d5b', '#2a9d8f', '#8b5cf6'];
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {/* y-axis grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
        <line key={i} x1={0} y1={height - p * (height - 30) - 15} x2={width} y2={height - p * (height - 30) - 15} stroke="#e0e0e0" strokeDasharray="3 3" />
      ))}
      {series.map((s, si) => {
        const data = s.data;
        const dx = width / (data.length - 1 || 1);
        let path = '';
        let pendingMove = true;
        data.forEach((v, i) => {
          if (v == null) { pendingMove = true; return; }
          const x = i * dx;
          const y = height - ((v - min) / range) * (height - 30) - 15;
          const cmd = pendingMove ? 'M' : 'L';
          path += `${path ? ' ' : ''}${cmd} ${x.toFixed(1)},${y.toFixed(1)}`;
          pendingMove = false;
        });
        return <path key={si} d={path} fill="none" stroke={colors[si % colors.length]} strokeWidth={2.5} strokeDasharray={s.dashed ? '6 4' : 'none'} />;
      })}
      {series.map((s, si) => s.data.map((v, i) => {
        if (v == null) return null;
        const dx = width / (s.data.length - 1 || 1);
        const x = i * dx;
        const y = height - ((v - min) / range) * (height - 30) - 15;
        return <circle key={`${si}-${i}`} cx={x} cy={y} r={3} fill={colors[si % colors.length]} />;
      }))}
    </svg>
  );
}

export default function GridChartStackedMockup() {
  const item = FORECAST_TS[0];
  const actual = ACTUAL_TS.find((a) => a.itemCd === item.itemCd);
  const forecastData = WEEK_BUCKETS.map((w) => item[w]);
  const actualData = WEEK_BUCKETS.map((w) => actual ? actual[w] : null);

  return (
    <MockShell
      patternCode="grid_chart_stacked"
      patternLabel="v2 — 차트 + 그리드 (수직 스택)"
      layoutCategory="LAYOUT_V2"
      description="상단 차트 + 하단 그리드. 동일 데이터를 시각화·정량 양면 제공. BF/DP 리포트 화면에서 자주 사용."
    >
      {/* Search */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="PlanScope" size="small" select value="PS01" sx={{ width: 150 }}>
            <MenuItem value="PS01">PS01 — Global</MenuItem>
            <MenuItem value="PS02">PS02 — APAC</MenuItem>
          </TextField>
          <TextField label="품목 그룹" size="small" select value="LED" sx={{ width: 130 }}>
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="LED">LED</MenuItem>
            <MenuItem value="CAMERA">CAMERA</MenuItem>
            <MenuItem value="BATTERY">BATTERY</MenuItem>
          </TextField>
          <TextField label="버전" size="small" value="V_2026_04_W15" sx={{ width: 180 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>엑셀</Button>
        </Stack>
      </Box>

      {/* Chart (상단 50%) */}
      <Box sx={{ flex: '0 0 50%', p: 2, overflow: 'auto' }}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">수요 예측 vs 실적 — {item.itemNm}</Typography>
              <Stack direction="row" spacing={1}>
                <Chip size="small" label="예측" sx={{ backgroundColor: '#5281b3', color: 'white' }} />
                <Chip size="small" label="실적" sx={{ backgroundColor: '#fa7d5b', color: 'white' }} />
              </Stack>
            </Stack>
            <MultiLineChart series={[
              { name: '예측', data: forecastData },
              { name: '실적', data: actualData, dashed: true },
            ]} />
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
              {WEEK_BUCKETS.map((w) => (
                <Typography key={w} sx={{ fontSize: 11, color: 'text.secondary' }}>{w}</Typography>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Grid (하단 50%) */}
      <Box sx={{ flex: '1 1 auto', p: 2, pt: 0, overflow: 'auto' }}>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: 'grey.100' } }}>
                <TableCell>품목코드</TableCell>
                <TableCell>품목명</TableCell>
                <TableCell align="center">구분</TableCell>
                {WEEK_BUCKETS.map((w) => <TableCell key={w} align="right">{w}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {FORECAST_TS.map((row) => (
                <React.Fragment key={row.itemCd}>
                  <TableRow hover>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{row.itemCd}</TableCell>
                    <TableCell>{row.itemNm}</TableCell>
                    <TableCell align="center"><Chip size="small" label="예측" sx={{ backgroundColor: '#5281b3', color: 'white' }} /></TableCell>
                    {WEEK_BUCKETS.map((w) => (
                      <TableCell key={w} align="right" sx={{ fontFamily: 'monospace' }}>{row[w].toLocaleString()}</TableCell>
                    ))}
                  </TableRow>
                  {ACTUAL_TS.find((a) => a.itemCd === row.itemCd) && (
                    <TableRow hover sx={{ backgroundColor: '#fff5f0' }}>
                      <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{row.itemCd}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{row.itemNm}</TableCell>
                      <TableCell align="center"><Chip size="small" label="실적" sx={{ backgroundColor: '#fa7d5b', color: 'white' }} /></TableCell>
                      {WEEK_BUCKETS.map((w) => {
                        const v = ACTUAL_TS.find((a) => a.itemCd === row.itemCd)?.[w];
                        return (
                          <TableCell key={w} align="right" sx={{ fontFamily: 'monospace', color: v == null ? 'text.disabled' : 'inherit' }}>
                            {v == null ? '-' : v.toLocaleString()}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </MockShell>
  );
}

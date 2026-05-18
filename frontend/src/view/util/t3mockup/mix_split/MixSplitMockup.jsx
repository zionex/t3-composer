import React from 'react';
import {
  Box, Stack, Typography, Chip, Card, CardContent, TextField, MenuItem, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import MockShell from '../_shared/MockShell';
import { LOCATIONS, ITEMS, FORECAST_TS, WEEK_BUCKETS } from '../_data/mockData';

function MiniBarChart({ values, labels, color = '#5281b3' }) {
  const max = Math.max(...values);
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', height: 100, gap: 0.5 }}>
      {values.map((v, i) => (
        <Stack key={i} flex={1} alignItems="center" justifyContent="flex-end">
          <Box sx={{ width: '70%', height: `${(v / max) * 90}%`, backgroundColor: color, borderRadius: 0.5 }} />
          <Typography sx={{ fontSize: 9, color: 'text.secondary', mt: 0.25 }}>{labels[i]}</Typography>
        </Stack>
      ))}
    </Box>
  );
}

export default function MixSplitMockup() {
  return (
    <MockShell
      patternCode="mix_split"
      patternLabel="혼합 분할 — H+V 복합 레이아웃"
      layoutCategory="LAYOUT_MIXED"
      description="좌측 트리 + 우측 상하 차트·그리드. 복잡한 분석 화면에서 자주 사용."
    >
      <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5}>
          <TextField label="PlanScope" size="small" select value="PS01" sx={{ width: 150 }}>
            <MenuItem value="PS01">PS01 — Global</MenuItem>
          </TextField>
          <Button size="small" variant="contained" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Left tree */}
        <Box sx={{ width: 220, borderRight: '1px solid', borderColor: 'divider', overflow: 'auto', backgroundColor: 'background.paper' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">거점</Typography>
          </Box>
          {LOCATIONS.map((l, i) => (
            <Box key={l.locatCd} sx={{
              p: 1, fontSize: 13, cursor: 'pointer',
              borderBottom: '1px solid', borderColor: 'grey.100',
              backgroundColor: i === 0 ? 'primary.light' : 'transparent',
              color: i === 0 ? 'primary.contrastText' : 'inherit',
              '&:hover': { backgroundColor: i === 0 ? 'primary.light' : 'action.hover' },
            }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontSize: 13, fontWeight: i === 0 ? 600 : 400 }}>{l.locatNm}</Typography>
                <Chip size="small" label={l.locatTp} variant="outlined" sx={{ height: 18, fontSize: 9 }} />
              </Stack>
            </Box>
          ))}
        </Box>

        {/* Right: top chart + bottom grid */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {/* Top chart */}
          <Box sx={{ flex: '0 0 45%', p: 1.5, borderBottom: '2px solid', borderColor: 'divider', overflow: 'auto' }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2">KR-Suwon Plant — 주차별 예측 합계</Typography>
                  <Chip size="small" label="12 weeks" />
                </Stack>
                <MiniBarChart
                  values={WEEK_BUCKETS.map((w) => FORECAST_TS.reduce((s, row) => s + row[w], 0))}
                  labels={WEEK_BUCKETS}
                />
              </CardContent>
            </Card>
          </Box>
          {/* Bottom grid */}
          <Box sx={{ flex: 1, p: 1.5, pt: 0, overflow: 'auto' }}>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: 'grey.100' } }}>
                    <TableCell>품목</TableCell>
                    <TableCell align="center">그룹</TableCell>
                    <TableCell align="right">평균 주간</TableCell>
                    <TableCell align="right">합계</TableCell>
                    <TableCell align="right">최대</TableCell>
                    <TableCell align="right">최소</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {FORECAST_TS.map((row) => {
                    const values = WEEK_BUCKETS.map((w) => row[w]);
                    const sum = values.reduce((s, v) => s + v, 0);
                    const avg = Math.round(sum / values.length);
                    const item = ITEMS.find((i) => i.itemCd === row.itemCd);
                    return (
                      <TableRow key={row.itemCd} hover>
                        <TableCell>{row.itemNm}</TableCell>
                        <TableCell align="center"><Chip size="small" label={item?.itemGrp || '-'} /></TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{avg.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{sum.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{Math.max(...values).toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{Math.min(...values).toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </Box>
    </MockShell>
  );
}

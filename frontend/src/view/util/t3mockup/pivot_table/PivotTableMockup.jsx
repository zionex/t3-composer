import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';

import MockShell from '../_shared/MockShell';
import { FORECAST_TS, WEEK_BUCKETS, ACTUAL_TS } from '../_data/mockData';

const measures = [
  { code: 'FCST', label: '예측', bg: '#e8f4ff' },
  { code: 'ACT',  label: '실적', bg: '#fff5f0' },
  { code: 'GAP',  label: '오차', bg: '#fffdf0' },
];

export default function PivotTableMockup() {
  // 행: 품목 × 지표 / 열: 시간 버킷
  const rows = [];
  for (const item of FORECAST_TS) {
    const actual = ACTUAL_TS.find((a) => a.itemCd === item.itemCd);
    for (const m of measures) {
      const data = WEEK_BUCKETS.map((w) => {
        if (m.code === 'FCST') return item[w];
        if (m.code === 'ACT')  return actual ? actual[w] : null;
        if (m.code === 'GAP') {
          if (!actual) return null;
          const a = actual[w], f = item[w];
          if (a == null || f == null) return null;
          return a - f;
        }
        return null;
      });
      rows.push({ itemCd: item.itemCd, itemNm: item.itemNm, measure: m, data });
    }
  }

  return (
    <MockShell
      patternCode="pivot_table"
      patternLabel="P06 — 크로스탭 피벗 (행 × 시간)"
      layoutCategory="LAYOUT_SINGLE"
      description="행은 품목·지표, 열은 시간 버킷. 시계열 데이터의 크로스탭 입력/조회."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="PlanScope" size="small" select value="PS01" sx={{ width: 150 }}>
            <MenuItem value="PS01">PS01 — Global</MenuItem>
          </TextField>
          <TextField label="Bucket" size="small" select value="W" sx={{ width: 110 }}>
            <MenuItem value="D">일</MenuItem>
            <MenuItem value="W">주</MenuItem>
            <MenuItem value="M">월</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="W14 ~ W25" sx={{ width: 150 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<SaveIcon />}>저장</Button>
        </Stack>
      </Box>

      <TableContainer component={Paper} variant="outlined" square sx={{ flex: 1, m: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: 'grey.100' } }}>
              <TableCell sx={{ width: 110, position: 'sticky', left: 0, zIndex: 3, backgroundColor: 'grey.100' }}>품목</TableCell>
              <TableCell sx={{ width: 180, position: 'sticky', left: 110, zIndex: 3, backgroundColor: 'grey.100' }}>품목명</TableCell>
              <TableCell sx={{ width: 70, position: 'sticky', left: 290, zIndex: 3, backgroundColor: 'grey.100' }} align="center">지표</TableCell>
              {WEEK_BUCKETS.map((w) => (
                <TableCell key={w} align="right" sx={{ minWidth: 80 }}>{w}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i} sx={{ backgroundColor: r.measure.bg, '&:hover': { backgroundColor: 'action.hover' } }}>
                <TableCell sx={{ fontFamily: 'monospace', position: 'sticky', left: 0, backgroundColor: r.measure.bg }}>{r.itemCd}</TableCell>
                <TableCell sx={{ position: 'sticky', left: 110, backgroundColor: r.measure.bg }}>{r.itemNm}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, position: 'sticky', left: 290, backgroundColor: r.measure.bg }}>{r.measure.label}</TableCell>
                {r.data.map((v, j) => (
                  <TableCell key={j} align="right" sx={{
                    fontFamily: 'monospace',
                    color: v == null ? 'text.disabled' : (r.measure.code === 'GAP' && v < 0 ? 'error.main' : 'inherit'),
                    fontWeight: r.measure.code === 'GAP' && v != null ? 600 : 400,
                  }}>
                    {v == null ? '-' : (r.measure.code === 'GAP' ? (v > 0 ? `+${v}` : v) : v.toLocaleString())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </MockShell>
  );
}

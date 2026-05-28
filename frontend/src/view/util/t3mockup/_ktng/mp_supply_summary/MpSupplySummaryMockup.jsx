import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Paper,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// MpKtng02 — 공급 계획 결과 요약 (제품 형태). 제품 형태별 PSI 집계 + 주차별 추이.

const KPI = [
  { label: '총 생산계획',  value: '108.4M',  delta: '+2.5%', color: 'primary' },
  { label: '총 출하계획',  value: '101.7M',  delta: '+1.8%', color: 'success' },
  { label: '예상 재고',    value:  '32.6M',  delta: '-3.2%', color: 'info' },
  { label: '계획 일치율',  value:  '94.2%',  delta: '+1.4pp',color: 'warning' },
];

const PRODUCT_FORM_ROWS = [
  { FORM: 'KING-SIZE',  ITEM_CNT: 18, P_QTY: 38500, S_QTY: 36200, I_QTY: 12500, FILL_RATE: 95.2 },
  { FORM: '100mm',      ITEM_CNT: 12, P_QTY: 24800, S_QTY: 23500, I_QTY:  8800, FILL_RATE: 94.5 },
  { FORM: 'SLIM',       ITEM_CNT: 14, P_QTY: 18400, S_QTY: 17200, I_QTY:  6200, FILL_RATE: 93.5 },
  { FORM: 'SUPER SLIM', ITEM_CNT:  8, P_QTY:  8800, S_QTY:  8200, I_QTY:  3100, FILL_RATE: 93.2 },
  { FORM: 'NGP STICK',  ITEM_CNT:  6, P_QTY: 12500, S_QTY: 11800, I_QTY:  1900, FILL_RATE: 94.4 },
  { FORM: 'NGP DEVICE', ITEM_CNT:  4, P_QTY:  5400, S_QTY:  4800, I_QTY:   100, FILL_RATE: 88.8 },
];

const TOTAL = PRODUCT_FORM_ROWS.reduce((acc, r) => ({
  ITEM_CNT: acc.ITEM_CNT + r.ITEM_CNT,
  P_QTY: acc.P_QTY + r.P_QTY, S_QTY: acc.S_QTY + r.S_QTY, I_QTY: acc.I_QTY + r.I_QTY,
}), { ITEM_CNT: 0, P_QTY: 0, S_QTY: 0, I_QTY: 0 });

// 주차별 추이 (8주)
const WEEKS = ['W18','W19','W20','W21','W22','W23','W24','W25'];
const TREND = [
  { name: 'P',  color: '#3b82f6', data: [25, 26, 27, 27, 28, 28, 29, 30] },
  { name: 'S',  color: '#10b981', data: [24, 25, 26, 26, 27, 27, 28, 29] },
  { name: 'I',  color: '#f59e0b', data: [ 8,  8.2, 8.5, 8.6, 8.8, 9.0, 9.2, 9.5] },
];

export default function MpSupplySummaryMockup() {
  return (
    <MockShell patternCode="ktng_mp_supply_summary" patternLabel="KTNG — 공급계획 결과 요약 (MpKtng02)"
      layoutCategory="LAYOUT_SINGLE" description="제품 형태(KING/SLIM/NGP 등)별 P·S·I 집계 + 주차별 트렌드 차트.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="버전" size="small" select value="V2026-05" sx={{ width: 140 }}>
            <MenuItem value="V2026-05">V2026-05</MenuItem>
          </TextField>
          <TextField label="플랜 범위" size="small" select value="MP_MASTER" sx={{ width: 140 }}>
            <MenuItem value="MP_MASTER">MP_MASTER</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-W18 ~ W25" sx={{ width: 170 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>Excel</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        <Stack direction="row" spacing={1.5}>
          {KPI.map((k) => (
            <Paper key={k.label} variant="outlined" sx={{ p: 1.5, flex: 1 }}>
              <Typography variant="caption" color="text.secondary">{k.label}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: `${k.color}.main`, mt: 0.5 }}>{k.value}</Typography>
              <Typography variant="caption" sx={{ color: k.delta.startsWith('-') ? 'error.main' : 'success.main', fontWeight: 600 }}>{k.delta}</Typography>
            </Paper>
          ))}
        </Stack>

        {/* Trend chart */}
        <Paper variant="outlined" sx={{ p: 1.5, height: 200 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>주차별 PSI 추이 (M본)</Typography>
            {TREND.map((s) => (
              <Stack key={s.name} direction="row" alignItems="center" spacing={0.5}>
                <Box sx={{ width: 12, height: 3, backgroundColor: s.color }} />
                <Typography variant="caption">{s.name}</Typography>
              </Stack>
            ))}
          </Stack>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end', height: 120 }}>
            {WEEKS.map((w, i) => (
              <Stack key={w} sx={{ flex: 1, alignItems: 'center', gap: 0.3 }}>
                <Stack direction="row" alignItems="flex-end" sx={{ height: 90, gap: 0.3 }}>
                  {TREND.map((s) => (
                    <Box key={s.name} sx={{ width: 8, height: `${(s.data[i] / 32) * 90}px`, backgroundColor: s.color, borderRadius: '2px 2px 0 0' }} />
                  ))}
                </Stack>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 10 }}>{w}</Typography>
              </Stack>
            ))}
          </Box>
        </Paper>

        {/* Product form summary */}
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>제품 형태별 PSI 집계</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['제품 형태','품목 수','P (생산)','S (출하)','I (재고)','Fill Rate'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, textAlign: c === '제품 형태' ? 'left' : 'right' }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {PRODUCT_FORM_ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.FORM}</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>{r.ITEM_CNT}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.P_QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.S_QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.I_QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.FILL_RATE.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: 'primary.light' }}>
                  <TableCell sx={{ fontWeight: 700, color: 'primary.contrastText' }}>Σ 합계</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontWeight: 700, color: 'primary.contrastText' }}>{TOTAL.ITEM_CNT}</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: 'primary.contrastText' }}>{TOTAL.P_QTY.toLocaleString()}</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: 'primary.contrastText' }}>{TOTAL.S_QTY.toLocaleString()}</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: 'primary.contrastText' }}>{TOTAL.I_QTY.toLocaleString()}</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: 'primary.contrastText' }}>{(TOTAL.S_QTY / TOTAL.P_QTY * 100).toFixed(1)}%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}

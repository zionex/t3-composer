import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// KTNG — MP 공급 계획 결과 요약 (제품 형태)
// UI_MP_KTNG_02 → MpKtng02.jsx

const DATE_COLS = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];

const ROWS = [
  { ITEM_LV1: '담배', ITEM_SHAPE: 'KS',      DEMAND: [125000, 128000, 132000, 130000, 128000, 130000], SUPPLY: [122000, 128000, 132000, 130000, 128000, 130000], GAP: [-3000, 0, 0, 0, 0, 0] },
  { ITEM_LV1: '담배', ITEM_SHAPE: 'PREMIUM', DEMAND: [85000,  88000,  90000,  91000,  92000,  93000],  SUPPLY: [82000,  85000,  90000,  91000,  92000,  93000],  GAP: [-3000, -3000, 0, 0, 0, 0] },
  { ITEM_LV1: '담배', ITEM_SHAPE: 'EXPORT',  DEMAND: [42000,  45000,  48000,  50000,  52000,  55000],  SUPPLY: [42000,  44000,  48000,  50000,  52000,  55000],  GAP: [0, -1000, 0, 0, 0, 0] },
  { ITEM_LV1: '담배', ITEM_SHAPE: 'NGP',     DEMAND: [85000,  90000,  95000,  100000, 105000, 110000], SUPPLY: [85000,  90000,  95000,  98000,  102000, 108000], GAP: [0, 0, 0, -2000, -3000, -2000] },
  { ITEM_LV1: '인삼', ITEM_SHAPE: 'POWDER',  DEMAND: [12000,  13000,  14000,  15000,  16000,  17000],  SUPPLY: [12000,  13000,  14000,  15000,  16000,  17000],  GAP: [0, 0, 0, 0, 0, 0] },
];

const dataset = ['DEMAND', 'SUPPLY', 'GAP'];

export default function KtngMpSupplySummaryMockup() {
  return (
    <MockShell
      patternCode="ktng_mp_supply_summary"
      patternLabel="KTNG — MP 공급 계획 결과 요약"
      layoutCategory="LAYOUT_SINGLE"
      description="UI_MP_KTNG_02 → MpKtng02.jsx. 제품 형태(KS/PREMIUM/EXPORT/NGP/POWDER) × 월별 × MEASURE(DEMAND/SUPPLY/GAP) 크로스탭. GAP &lt; 0 = 공급 부족 (빨강 표시)."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="MAIN_VER" size="small" select value="V2026-06" sx={{ width: 140 }}><MenuItem value="V2026-06">V2026-06</MenuItem></TextField>
          <TextField label="ITEM_LV1" size="small" select value="ALL" sx={{ width: 130 }}><MenuItem value="ALL">전체</MenuItem></TextField>
          <TextField label="ITEM_SHAPE" size="small" select value="ALL" sx={{ width: 130 }}><MenuItem value="ALL">전체</MenuItem></TextField>
          <TextField label="기간" size="small" value="2026-06 ~ 11" sx={{ width: 160 }} />
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
      </Box>

      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead><TableRow>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>ITEM_LV1</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>ITEM_SHAPE</TableCell>
                <TableCell sx={{ bgcolor: '#fffbe6', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>MEASURE</TableCell>
                {DATE_COLS.map((d) => (
                  <TableCell key={d} sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace', textAlign: 'right' }}>{d.slice(2)}</TableCell>
                ))}
              </TableRow></TableHead>
              <TableBody>
                {ROWS.flatMap((r, ri) => dataset.map((ms, mi) => (
                  <TableRow key={`${ri}-${mi}`} hover sx={{ borderTop: mi === 0 ? '2px solid #e5e7eb' : undefined }}>
                    <TableCell sx={{ fontSize: 11 }}>{mi === 0 ? r.ITEM_LV1 : ''}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{mi === 0 ? r.ITEM_SHAPE : ''}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, textAlign: 'center', color: ms === 'DEMAND' ? '#1565c0' : ms === 'SUPPLY' ? '#10b981' : '#ef4444' }}>{ms}</TableCell>
                    {(ms === 'DEMAND' ? r.DEMAND : ms === 'SUPPLY' ? r.SUPPLY : r.GAP).map((v, j) => (
                      <TableCell key={j} sx={{
                        fontSize: 11, fontFamily: 'monospace', textAlign: 'right',
                        fontWeight: ms === 'GAP' && v !== 0 ? 700 : 400,
                        color: ms === 'GAP' && v < 0 ? '#ef4444' : ms === 'GAP' && v > 0 ? '#3b82f6' : '#374151',
                        bgcolor: ms === 'GAP' && v < 0 ? '#fef2f2' : 'transparent',
                      }}>{v === 0 && ms === 'GAP' ? '0' : v > 0 && ms === 'GAP' ? `+${v.toLocaleString()}` : v.toLocaleString()}</TableCell>
                    ))}
                  </TableRow>
                )))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}

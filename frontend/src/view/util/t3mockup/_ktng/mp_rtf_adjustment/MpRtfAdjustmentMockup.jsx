import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Button, ButtonGroup, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// KTNG — MP RTF (Ready To Fulfill) 조정
// UI_MP_KTNG_04 → MpKtng04.jsx
//   수요-공급 차이 조정 — 어떤 거래처/제품의 RTF 를 얼마나 조정할지

const ROWS = [
  { SALES_ORG: '국내영업본부', ACCOUNT: 'CU',         ITEM: '에쎄 스페셜 골드', WK: '2026-W24', DEMAND: 32500, SUPPLY: 30000, RTF_PCT: 92.3, ADJ_QTY: -2500, AFTER_RTF: 92.3 },
  { SALES_ORG: '국내영업본부', ACCOUNT: 'GS25',       ITEM: '에쎄 스페셜 골드', WK: '2026-W24', DEMAND: 24000, SUPPLY: 24000, RTF_PCT: 100.0, ADJ_QTY: 0,     AFTER_RTF: 100.0 },
  { SALES_ORG: '국내영업본부', ACCOUNT: '이마트',     ITEM: '디스 플러스',       WK: '2026-W24', DEMAND: 8200,  SUPPLY: 7500,  RTF_PCT: 91.5,  ADJ_QTY: -700,  AFTER_RTF: 91.5 },
  { SALES_ORG: '수출본부',     ACCOUNT: 'TKK Global', ITEM: 'ESSE Asian',       WK: '2026-W24', DEMAND: 5500,  SUPPLY: 4800,  RTF_PCT: 87.3,  ADJ_QTY: -700,  AFTER_RTF: 87.3 },
  { SALES_ORG: '수출본부',     ACCOUNT: 'Heinemann',  ITEM: 'THE ONE',          WK: '2026-W24', DEMAND: 2100,  SUPPLY: 1800,  RTF_PCT: 85.7,  ADJ_QTY: -300,  AFTER_RTF: 85.7 },
  { SALES_ORG: '국내영업본부', ACCOUNT: 'CU',         ITEM: '릴 에이스 NGP',    WK: '2026-W24', DEMAND: 12500, SUPPLY: 10000, RTF_PCT: 80.0,  ADJ_QTY: -2500, AFTER_RTF: 80.0 },
];

export default function KtngMpRtfAdjustmentMockup() {
  return (
    <MockShell
      patternCode="ktng_mp_rtf_adjustment"
      patternLabel="KTNG — MP RTF 조정"
      layoutCategory="LAYOUT_SINGLE"
      description="UI_MP_KTNG_04 → MpKtng04.jsx. 주차별 거래처-품목 RTF (Ready To Fulfill) — 수요 대비 공급 가용 비율. ADJ_QTY 로 분배 조정 가능. RTF &lt; 85% = 경고."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="WK" size="small" select value="2026-W24" sx={{ width: 130 }}><MenuItem value="2026-W24">2026-W24</MenuItem></TextField>
          <TextField label="SALES_ORG" size="small" select value="ALL" sx={{ width: 160 }}><MenuItem value="ALL">전체</MenuItem></TextField>
          <TextField label="ACCOUNT" size="small" select value="ALL" sx={{ width: 160 }}><MenuItem value="ALL">전체</MenuItem></TextField>
          <TextField label="RTF 임계치" size="small" select value="85" sx={{ width: 130 }}><MenuItem value="85">≥ 85%</MenuItem></TextField>
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
        <ButtonGroup variant="outlined" size="small"><IconButton size="small" color="primary"><SaveIcon fontSize="small" /></IconButton></ButtonGroup>
      </Box>

      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead><TableRow>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>SALES_ORG</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>ACCOUNT</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>ITEM</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>WEEK</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>DEMAND</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>SUPPLY</TableCell>
                <TableCell sx={{ bgcolor: '#fef3c7', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>RTF_%</TableCell>
                <TableCell sx={{ bgcolor: '#fee2e2', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>ADJ_QTY</TableCell>
                <TableCell sx={{ bgcolor: '#dcfce7', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>AFTER_RTF%</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover sx={{ bgcolor: r.RTF_PCT < 85 ? '#fef2f2' : 'transparent' }}>
                    <TableCell sx={{ fontSize: 11 }}>{r.SALES_ORG}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.ACCOUNT}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.ITEM}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>{r.WK}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.DEMAND.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.SUPPLY.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 700, color: r.RTF_PCT >= 95 ? '#10b981' : r.RTF_PCT >= 85 ? '#f59e0b' : '#ef4444' }}>{r.RTF_PCT.toFixed(1)}%</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', color: r.ADJ_QTY < 0 ? '#ef4444' : r.ADJ_QTY > 0 ? '#3b82f6' : '#9ca3af' }}>{r.ADJ_QTY > 0 ? '+' : ''}{r.ADJ_QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 700, bgcolor: '#f0fdf4', color: r.AFTER_RTF >= 95 ? '#10b981' : '#f59e0b' }}>{r.AFTER_RTF.toFixed(1)}%</TableCell>
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

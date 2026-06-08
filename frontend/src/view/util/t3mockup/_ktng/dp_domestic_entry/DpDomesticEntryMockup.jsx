import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Button, ButtonGroup, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import PersonIcon from '@mui/icons-material/Person';
import MockShell from '../../_shared/MockShell';

// KTNG — DP 내수 수요 입력
// UI_DP_KTNG_18 → DpKtng18.jsx
//   PSI 크로스탭 (CC/NGP 내수 전용) — CHANNEL × BUYER × ITEM × MEASURE × 월별

const DATE_COLS = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];

const ROWS = [
  { CHANNEL: '편의점', BUYER: 'BGF리테일 (CU)', ITEM_NM: '에쎄 스페셜 골드 1mg', cat: 'SI_QTY', vals: [125000, 128000, 132000, 130000, 128000, 130000, 135000] },
  { CHANNEL: '편의점', BUYER: 'BGF리테일 (CU)', ITEM_NM: '에쎄 스페셜 골드 1mg', cat: 'SO_QTY', vals: [118200, 121000, 125500, null,   null,   null,   null], locked: true },
  { CHANNEL: '편의점', BUYER: 'BGF리테일 (CU)', ITEM_NM: '에쎄 스페셜 골드 1mg', cat: 'STOCK',  vals: [8500,   10200,  11500,  11200,  10800,  10500,  10800] },
  { CHANNEL: '편의점', BUYER: 'GS리테일 (GS25)', ITEM_NM: '에쎄 스페셜 골드 1mg', cat: 'SI_QTY', vals: [96800,  98000,  100000, 99000,  98000,  100000, 102000] },
  { CHANNEL: '편의점', BUYER: '코리아세븐',     ITEM_NM: '에쎄 스페셜 골드 1mg', cat: 'SI_QTY', vals: [62000,  63000,  64500,  64000,  63500,  64000,  65000] },
  { CHANNEL: '슈퍼',   BUYER: '이마트',         ITEM_NM: '디스 플러스',          cat: 'SI_QTY', vals: [32500,  33000,  34000,  33500,  33000,  34000,  35000] },
  { CHANNEL: '슈퍼',   BUYER: '롯데마트',       ITEM_NM: '더원 오렌지 1mg',      cat: 'SI_QTY', vals: [28000,  28500,  29000,  29500,  30000,  30500,  31000] },
];

const fmtN = (n) => (n == null ? '-' : n.toLocaleString());

export default function KtngDpDomesticEntryMockup() {
  return (
    <MockShell
      patternCode="ktng_dp_domestic_entry"
      patternLabel="KTNG — DP 내수 수요 입력"
      layoutCategory="LAYOUT_SINGLE"
      description="UI_DP_KTNG_18 → DpKtng18.jsx. 내수 채널별 PSI 크로스탭 — CHANNEL × BUYER × ITEM × MEASURE(SI/SO/STOCK) × 월별 7개. 셀 데이터는 KTNG 도메인 (CU/GS25/세븐일레븐 + 이마트/롯데마트 × 에쎄/디스/더원)."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="USER_ID" size="small" value="kim.youngsu" sx={{ width: 160 }}
            InputProps={{ startAdornment: <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
          <TextField label="VERSION_ID" size="small" select value="V2026-06_SIM" sx={{ width: 170 }}>
            <MenuItem value="V2026-06_SIM">V2026-06_SIM</MenuItem>
          </TextField>
          <TextField label="CHANNEL" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="CVS">편의점</MenuItem>
            <MenuItem value="SUP">슈퍼/대형마트</MenuItem>
          </TextField>
          <TextField label="ITEM" size="small" value="" placeholder="품목 검색"
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }}
            sx={{ width: 200 }} />
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
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, width: 100 }}>CHANNEL</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, width: 180 }}>BUYER</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, width: 220 }}>ITEM_NM</TableCell>
                <TableCell sx={{ bgcolor: '#fffbe6', fontWeight: 700, fontSize: 11, width: 100, textAlign: 'center' }}>MEASURE</TableCell>
                {DATE_COLS.map((d) => (
                  <TableCell key={d} sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, width: 85, textAlign: 'right', fontFamily: 'monospace' }}>{d.slice(2)}</TableCell>
                ))}
              </TableRow></TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover sx={{ bgcolor: r.locked ? '#fafafa' : 'transparent' }}>
                    <TableCell sx={{ fontSize: 11 }}>{r.CHANNEL}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.BUYER}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.ITEM_NM}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, textAlign: 'center', color: r.cat === 'SI_QTY' ? '#1565c0' : r.cat === 'SO_QTY' ? '#6b7280' : '#10b981' }}>{r.cat}</TableCell>
                    {r.vals.map((v, j) => (
                      <TableCell key={j} sx={{
                        fontSize: 11, fontFamily: 'monospace', textAlign: 'right',
                        color: v == null ? '#d1d5db' : r.locked ? '#6b7280' : '#374151',
                        fontWeight: r.cat === 'SI_QTY' ? 600 : 400,
                        bgcolor: r.locked ? '#f3f4f6' : 'transparent',
                      }}>{fmtN(v)}</TableCell>
                    ))}
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

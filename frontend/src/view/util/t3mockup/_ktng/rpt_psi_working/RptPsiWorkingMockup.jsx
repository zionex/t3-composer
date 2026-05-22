import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Paper, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// RptKtng16 (생산 PSI), 17 (생산계획 대비 실적), 18~20 (Global PSI 판매법인/직수출O/X),
// 21 (판매계획 대비 실적), 22 (Global PSI CC/NGP 내수)
// Working Report — 6 채널별 PSI + 계획 vs 실적 비교 통합

const CHANNELS = [
  { key: 'PROD',   label: '생산 PSI (16)', active: true },
  { key: 'P_VS_A', label: '생산 vs 실적 (17)', active: false },
  { key: 'GLOB_L', label: 'Global PSI 판매법인 (18)', active: false },
  { key: 'GLOB_O', label: 'Global PSI 직수출 O (19)', active: false },
  { key: 'GLOB_X', label: 'Global PSI 직수출 X (20)', active: false },
  { key: 'S_VS_A', label: '판매 vs 실적 (21)', active: false },
  { key: 'GLOB_C', label: 'Global PSI CC/NGP (22)', active: false },
];

const FIXED = [
  { name: 'PLANT',   label: '거점',     width: 100 },
  { name: 'ITEM_LV2',label: '품목군',   width: 110 },
  { name: 'MEASURE', label: 'MEASURE',  width: 100, sticky: true },
];

const WEEKS = ['W18','W19','W20','W21','W22','W23','W24','W25'];

const ROWS = [
  { PLANT: '신탄진',  ITEM_LV2: '레드',   MEASURE: 'PLAN',   vals: [28000, 28500, 29000, 28800, 29200, 29500, 30000, 30500] },
  { PLANT: '신탄진',  ITEM_LV2: '레드',   MEASURE: 'ACTUAL', vals: [27200, 28100, 28800, 28500, 29000,  null,  null,  null] },
  { PLANT: '신탄진',  ITEM_LV2: '레드',   MEASURE: 'INV',    vals: [ 8200,  8400,  8500,  8400,  8500,  8600,  8700,  8800] },
  { PLANT: '대전',    ITEM_LV2: '블루',   MEASURE: 'PLAN',   vals: [18500, 19000, 19500, 19200, 19500, 19800, 20000, 20500] },
  { PLANT: '대전',    ITEM_LV2: '블루',   MEASURE: 'ACTUAL', vals: [18200, 18800, 19000, 19000, 19200,  null,  null,  null] },
  { PLANT: '대전',    ITEM_LV2: '블루',   MEASURE: 'INV',    vals: [ 5500,  5600,  5700,  5700,  5800,  5900,  6000,  6100] },
  { PLANT: '광주',    ITEM_LV2: 'NGP',    MEASURE: 'PLAN',   vals: [ 5500,  5800,  6000,  5800,  5900,  6100,  6300,  6500] },
  { PLANT: '광주',    ITEM_LV2: 'NGP',    MEASURE: 'ACTUAL', vals: [ 4800,  5200,  5600,  5500,  5700,  null,  null,  null] },
  { PLANT: '인도네시아',ITEM_LV2: '수출',  MEASURE: 'PLAN',   vals: [42000, 42500, 43000, 42800, 43500, 44000, 44500, 45000] },
  { PLANT: '인도네시아',ITEM_LV2: '수출',  MEASURE: 'ACTUAL', vals: [41500, 42000, 42500, 42500, 43000,  null,  null,  null] },
];

const MEASURE_COLOR = { PLAN: 'primary', ACTUAL: 'success', INV: 'warning' };
const fmtN = (n) => n == null ? '-' : n.toLocaleString();

export default function RptPsiWorkingMockup() {
  return (
    <MockShell patternCode="ktng_rpt_psi_working" patternLabel="KTNG — Working Report PSI (RptKtng16~22)"
      layoutCategory="LAYOUT_SINGLE" description="7개 채널 PSI / 계획 vs 실적 — 거점 × 품목군 × 주차별 PLAN/ACTUAL/INV. 미래 주차는 ACTUAL 비어있음.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="버전" size="small" select value="V2026-05" sx={{ width: 140 }}>
            <MenuItem value="V2026-05">V2026-05</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-W18 ~ W25" sx={{ width: 170 }} />
          <TextField label="거점" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>Excel</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs value={0} variant="scrollable" scrollButtons="auto">
          {CHANNELS.map((c, i) => <Tab key={c.key} label={c.label} />)}
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1, overflow: 'auto' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip size="small" label="PLAN" color="primary" variant="outlined" />
          <Chip size="small" label="ACTUAL" color="success" variant="outlined" />
          <Chip size="small" label="INV" color="warning" variant="outlined" />
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="caption" color="text.secondary">현재 주차: W21 (실적 미래 주차는 미입력)</Typography>
        </Stack>

        <Paper variant="outlined" sx={{ flex: 1, overflow: 'auto' }}>
          <TableContainer>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {FIXED.map((c) => (
                    <TableCell key={c.name} sx={{ backgroundColor: 'grey.200', width: c.width, fontWeight: 700, position: c.sticky ? 'sticky' : undefined, left: c.sticky ? 0 : undefined, zIndex: c.sticky ? 3 : 2 }}>
                      {c.label}
                    </TableCell>
                  ))}
                  {WEEKS.map((w, j) => (
                    <TableCell key={w} sx={{ backgroundColor: j < 4 ? 'grey.100' : '#e3f2fd', fontWeight: 700, textAlign: 'right', fontFamily: 'monospace', minWidth: 80 }}>
                      {w}{j < 4 ? '' : ' *'}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover sx={{ backgroundColor: i % 3 === 2 ? 'grey.50' : 'transparent' }}>
                    {FIXED.map((c) => (
                      <TableCell key={c.name} sx={{
                        position: c.sticky ? 'sticky' : undefined,
                        left: c.sticky ? 0 : undefined,
                        backgroundColor: c.sticky ? (i % 3 === 2 ? '#fafafa' : '#fff') : undefined,
                        zIndex: c.sticky ? 1 : undefined,
                        fontWeight: c.name === 'MEASURE' ? 700 : 400,
                        color: c.name === 'MEASURE' ? `${MEASURE_COLOR[r.MEASURE]}.main` : 'inherit',
                      }}>{r[c.name]}</TableCell>
                    ))}
                    {r.vals.map((v, j) => (
                      <TableCell key={j} sx={{ textAlign: 'right', fontFamily: 'monospace', color: v == null ? 'text.disabled' : 'inherit' }}>
                        {fmtN(v)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        <Typography variant="caption" color="text.secondary">* 미래 주차 (현재 W21 기준)</Typography>
      </Box>
    </MockShell>
  );
}

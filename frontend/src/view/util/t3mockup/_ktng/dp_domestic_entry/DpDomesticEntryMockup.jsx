import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Paper,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MockShell from '../../_shared/MockShell';

// DpKtng18 — 내수 수요 입력. 거래처-품목 × 월별 수량 직접 입력 (편집 가능 셀).

const FIXED = [
  { name: 'ACCOUNT_CD', label: 'ACCOUNT_CD', width: 110 },
  { name: 'ACCOUNT_NM', label: '거래처',     width: 130 },
  { name: 'ITEM_LV3',   label: 'ITEM_LV3',   width: 110 },
  { name: 'ITEM_NM',    label: '품목명',     width: 150 },
];

const MONTHS = ['2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'];

// 더미 데이터 (마지막 셀은 편집 표시)
const ROWS = [
  { ACCOUNT_CD: 'CU',      ACCOUNT_NM: 'CU',         ITEM_LV3: 'KING-RED', ITEM_NM: '레드 시리즈', vals: [12500, 12800, 13000, 12500, 12200, 12500, 13800] },
  { ACCOUNT_CD: 'CU',      ACCOUNT_NM: 'CU',         ITEM_LV3: 'KING-BLU', ITEM_NM: '블루 시리즈', vals: [ 8200,  8500,  8800,  8500,  8200,  8500,  9000] },
  { ACCOUNT_CD: 'GS25',    ACCOUNT_NM: 'GS25',       ITEM_LV3: 'KING-RED', ITEM_NM: '레드 시리즈', vals: [11800, 12000, 12500, 12000, 11500, 11800, 13000] },
  { ACCOUNT_CD: 'GS25',    ACCOUNT_NM: 'GS25',       ITEM_LV3: 'NGP-DEV',  ITEM_NM: 'illuvia DEV', vals: [ 4500,  4800,  5200,  5500,  5800,  6100,  6500] },
  { ACCOUNT_CD: 'SEVEN',   ACCOUNT_NM: '세븐일레븐', ITEM_LV3: 'KING-BLU', ITEM_NM: '블루 시리즈', vals: [ 6200,  6500,  6800,  6500,  6200,  6500,  7000] },
  { ACCOUNT_CD: 'EMART',   ACCOUNT_NM: '이마트',     ITEM_LV3: 'KING-RED', ITEM_NM: '레드 시리즈', vals: [ 3500,  3800,  4000,  3800,  3500,  3800,  4200] },
  { ACCOUNT_CD: 'COUPANG', ACCOUNT_NM: '쿠팡',       ITEM_LV3: 'NGP-STICK',ITEM_NM: 'illuvia 스틱', vals: [ 1800,  2000,  2200,  2400,  2600,  2800,  3000] },
];

const totals = MONTHS.map((_, j) => ROWS.reduce((s, r) => s + r.vals[j], 0));

export default function DpDomesticEntryMockup() {
  return (
    <MockShell patternCode="ktng_dp_domestic_entry" patternLabel="KTNG — 내수 수요 입력 (DpKtng18)"
      layoutCategory="LAYOUT_SINGLE" description="거래처-품목 × 월별 셀 직접 입력. 노란 셀은 편집 가능, 하단에 월별 합계 footer.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="버전" size="small" select value="V2026-05" sx={{ width: 140 }}>
            <MenuItem value="V2026-05">V2026-05 (작업중)</MenuItem>
          </TextField>
          <TextField label="ACCOUNT" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="CU">CU</MenuItem><MenuItem value="GS25">GS25</MenuItem>
          </TextField>
          <TextField label="ITEM_LV2" size="small" select value="ALL" sx={{ width: 140 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="RED">레드</MenuItem><MenuItem value="BLU">블루</MenuItem><MenuItem value="NGP">NGP</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-06 ~ 2026-12" sx={{ width: 180 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<SaveIcon />} color="primary">저장</Button>
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 16, height: 16, backgroundColor: '#fff9c4', border: '1px solid #fbc02d', borderRadius: 0.5 }} />
          <Typography variant="caption">편집 가능 셀</Typography>
          <Box sx={{ width: 16, height: 16, backgroundColor: '#e3f2fd', borderRadius: 0.5, ml: 1.5 }} />
          <Typography variant="caption">변경된 셀</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <HelpOutlineIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">셀 클릭 후 직접 수정 — 미저장 변경분 자동 강조</Typography>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {FIXED.map((c) => (
                  <TableCell key={c.name} sx={{ backgroundColor: 'grey.200', fontWeight: 700, width: c.width, position: c.name === 'ITEM_NM' ? 'sticky' : undefined, left: c.name === 'ITEM_NM' ? 0 : undefined, zIndex: c.name === 'ITEM_NM' ? 2 : undefined }}>
                    {c.label}
                  </TableCell>
                ))}
                {MONTHS.map((m) => (
                  <TableCell key={m} sx={{ backgroundColor: 'grey.100', fontWeight: 700, textAlign: 'right', minWidth: 90, fontFamily: 'monospace' }}>{m}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {ROWS.map((r, i) => (
                <TableRow key={i} hover>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{r.ACCOUNT_CD}</TableCell>
                  <TableCell>{r.ACCOUNT_NM}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{r.ITEM_LV3}</TableCell>
                  <TableCell>{r.ITEM_NM}</TableCell>
                  {r.vals.map((v, j) => (
                    <TableCell key={j} sx={{ textAlign: 'right', fontFamily: 'monospace' }}>
                      {v.toLocaleString()}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              <TableRow sx={{ backgroundColor: 'primary.light' }}>
                <TableCell colSpan={4} sx={{ fontWeight: 700, color: 'primary.contrastText' }}>Σ 합계</TableCell>
                {totals.map((t, j) => (
                  <TableCell key={j} sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: 'primary.contrastText' }}>{t.toLocaleString()}</TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </MockShell>
  );
}

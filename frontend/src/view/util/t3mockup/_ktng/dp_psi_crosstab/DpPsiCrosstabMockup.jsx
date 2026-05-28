import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// KTNG PSI 크로스탭 — 판매계획 PSI / 공급계획 PSI / 보충계획 PSI 공통 패턴
// 좌측 고정 컬럼 (거점·품목·MEASURE) + 우측 시간 버킷 (월/주 단위)
// 운영 원본 styleCallback: ITEM_LV3_CD (DpKtng05/06), CURRENCY (DpKtng07/09) — 식별자 셀만 info 톤.

const FIXED_COLS = [
  { name: 'SALES_ORG',   label: '판매조직',    width: 110 },
  { name: 'ACCOUNT',     label: '거래처',       width: 130 },
  { name: 'ITEM_LV3_CD', label: 'ITEM_LV3',    width: 100 },
  { name: 'ITEM_NM',     label: '품목명',       width: 170 },
  { name: 'MEASURE',     label: 'MEASURE',     width: 130, sticky: true },
];

const MONTHS = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];

const ROWS = [
  // 거점 1
  { SALES_ORG: 'KT&G',  ACCOUNT: 'CU',          ITEM_LV3_CD: 'KING-RED', ITEM_NM: '레드 클래식',  MEASURE: 'P(생산)', vals: [12000, 11800, 12500, 13000, 12800, 13200, 13500, 13700, 14000] },
  { SALES_ORG: 'KT&G',  ACCOUNT: 'CU',          ITEM_LV3_CD: 'KING-RED', ITEM_NM: '레드 클래식',  MEASURE: 'S(판매)', vals: [11500, 11900, 12200, 12800, 12700, 13000, 13300, 13500, 13800] },
  { SALES_ORG: 'KT&G',  ACCOUNT: 'CU',          ITEM_LV3_CD: 'KING-RED', ITEM_NM: '레드 클래식',  MEASURE: 'I(재고)', vals: [ 2500,  2400,  2700,  2900,  3000,  3200,  3400,  3600,  3800] },
  { SALES_ORG: 'KT&G',  ACCOUNT: 'GS25',        ITEM_LV3_CD: 'KING-BLU', ITEM_NM: '블루 멘솔',     MEASURE: 'P(생산)', vals: [ 8000,  8200,  8400,  8500,  8700,  8900,  9000,  9100,  9200] },
  { SALES_ORG: 'KT&G',  ACCOUNT: 'GS25',        ITEM_LV3_CD: 'KING-BLU', ITEM_NM: '블루 멘솔',     MEASURE: 'S(판매)', vals: [ 7800,  8100,  8300,  8500,  8700,  8800,  8900,  9000,  9100] },
  { SALES_ORG: 'KT&G',  ACCOUNT: 'GS25',        ITEM_LV3_CD: 'KING-BLU', ITEM_NM: '블루 멘솔',     MEASURE: 'I(재고)', vals: [ 1800,  1900,  2000,  2000,  2000,  2100,  2200,  2300,  2400] },
  // illuvia
  { SALES_ORG: 'KT&G',  ACCOUNT: '편의점 전체', ITEM_LV3_CD: 'NGP-DEV',  ITEM_NM: 'illuvia DEV',   MEASURE: 'P(생산)', vals: [ 5000,  5300,  5500,  5800,  6100,  6300,  6500,  6700,  7000] },
  { SALES_ORG: 'KT&G',  ACCOUNT: '편의점 전체', ITEM_LV3_CD: 'NGP-DEV',  ITEM_NM: 'illuvia DEV',   MEASURE: 'S(판매)', vals: [ 4800,  5200,  5600,  5800,  6000,  6200,  6400,  6600,  6800] },
  { SALES_ORG: 'KT&G',  ACCOUNT: '편의점 전체', ITEM_LV3_CD: 'NGP-DEV',  ITEM_NM: 'illuvia DEV',   MEASURE: 'I(재고)', vals: [ 1200,  1300,  1200,  1200,  1300,  1400,  1500,  1600,  1800] },
  // 해외
  { SALES_ORG: 'KT&G GLOBAL', ACCOUNT: '인도',  ITEM_LV3_CD: 'EXPORT-K', ITEM_NM: '수출 KING',     MEASURE: 'P(생산)', vals: [15000, 15500, 16000, 16300, 16500, 17000, 17200, 17500, 18000] },
  { SALES_ORG: 'KT&G GLOBAL', ACCOUNT: '인도',  ITEM_LV3_CD: 'EXPORT-K', ITEM_NM: '수출 KING',     MEASURE: 'S(판매)', vals: [14500, 15300, 15800, 16100, 16400, 16700, 17000, 17300, 17800] },
  { SALES_ORG: 'KT&G GLOBAL', ACCOUNT: '인도',  ITEM_LV3_CD: 'EXPORT-K', ITEM_NM: '수출 KING',     MEASURE: 'I(재고)', vals: [ 3500,  3700,  3900,  4100,  4200,  4500,  4700,  4900,  5100] },
];

const fmtN = (n) => n.toLocaleString();

export default function PsiCrosstabMockup() {
  return (
    <MockShell
      patternCode="ktng_psi_crosstab"
      patternLabel="KTNG — PSI 크로스탭 피벗"
      layoutCategory="LAYOUT_SINGLE"
      description="판매계획 PSI / 공급계획 PSI / 보충계획 PSI. 좌측 고정 컬럼(조직·거래처·품목·MEASURE) + 우측 동적 시간 버킷 (월/주). DpKtng05~09 / MpResult / RpResult 등 11+개 화면 공유."
    >
      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="PLAN_SCOPE" size="small" select value="DP_MASTER" sx={{ width: 160 }}>
            <MenuItem value="DP_MASTER">DP_MASTER</MenuItem>
            <MenuItem value="MP_MASTER">MP_MASTER</MenuItem>
          </TextField>
          <TextField label="MAIN_VER"   size="small" select value="V2026-05" sx={{ width: 150 }}>
            <MenuItem value="V2026-05">V2026-05</MenuItem>
            <MenuItem value="V2026-04">V2026-04</MenuItem>
          </TextField>
          <TextField label="SIMUL_VER"  size="small" select value="MAIN" sx={{ width: 140 }}>
            <MenuItem value="MAIN">MAIN</MenuItem>
            <MenuItem value="SIM_001">SIM_001</MenuItem>
          </TextField>
          <TextField label="SALES_ORG"  size="small" select value="ALL" sx={{ width: 150 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="KT&G">KT&G 국내</MenuItem>
            <MenuItem value="GLOBAL">KT&G GLOBAL</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-04 ~ 2026-12" sx={{ width: 170 }} />
          <TextField label="BUCKET" size="small" select value="MONTH" sx={{ width: 110 }}>
            <MenuItem value="WEEK">WEEK</MenuItem>
            <MenuItem value="MONTH">MONTH</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      {/* ButtonArea */}
      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>{ROWS.length} cases</Typography>
          <Chip size="small" label="P = 생산" color="primary" variant="outlined" />
          <Chip size="small" label="S = 판매" color="success" variant="outlined" />
          <Chip size="small" label="I = 재고 (편집 가능)" color="warning" variant="outlined" />
        </Stack>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={0.75}>
          <Button variant="outlined" size="small" startIcon={<SaveIcon />}>저장</Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>Excel 다운로드</Button>
        </Stack>
      </Box>

      {/* Cross-tab Grid */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: '100%' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {FIXED_COLS.map((c) => (
                  <TableCell key={c.name}
                    sx={{ backgroundColor: 'grey.200', width: c.width, fontWeight: 700, textAlign: 'center',
                          position: c.sticky ? 'sticky' : undefined,
                          left: c.sticky ? 0 : undefined, zIndex: c.sticky ? 3 : 2 }}>
                    {c.label}
                  </TableCell>
                ))}
                {MONTHS.map((m) => (
                  <TableCell key={m} sx={{ backgroundColor: 'grey.100', minWidth: 90, fontWeight: 700, textAlign: 'right', fontFamily: 'monospace' }}>
                    {m}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {ROWS.map((r, i) => {
                const measureColor =
                  r.MEASURE.startsWith('P') ? 'primary.main' :
                  r.MEASURE.startsWith('S') ? 'success.main' :
                  'warning.main';
                // zebra striping 만 유지 (운영 styleCallback 은 식별자 컬럼만 강조)
                const zebraBg = (i % 6 >= 3) ? 'grey.50' : undefined;
                return (
                  <TableRow key={i} hover sx={zebraBg ? { backgroundColor: zebraBg } : undefined}>
                    {FIXED_COLS.map((c) => {
                      // 운영 원본 styleCallback 대상: ITEM_LV3_CD 셀만 info 톤
                      const isStyleCol = c.name === 'ITEM_LV3_CD';
                      const baseSx = {
                        textAlign: 'left',
                        fontFamily: c.name.endsWith('_CD') ? 'monospace' : 'inherit',
                        fontWeight: c.name === 'MEASURE' ? 700 : 400,
                        color: c.name === 'MEASURE' ? measureColor : 'inherit',
                        position: c.sticky ? 'sticky' : undefined,
                        left: c.sticky ? 0 : undefined,
                        backgroundColor: c.sticky ? '#fff' : undefined,
                        zIndex: c.sticky ? 1 : undefined,
                      };
                      return (
                        <TableCell key={c.name}
                          sx={isStyleCol ? { ...baseSx, ...cellSx('info', { mono: true }) } : baseSx}>
                          {r[c.name]}
                        </TableCell>
                      );
                    })}
                    {r.vals.map((v, j) => (
                      <TableCell key={j} sx={{ textAlign: 'right', fontFamily: 'monospace' }}>
                        {fmtN(v)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </MockShell>
  );
}

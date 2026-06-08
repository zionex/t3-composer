import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Button, Checkbox, FormControlLabel,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CalculateIcon from '@mui/icons-material/Calculate';
import MockShell from '../../_shared/MockShell';

// KTNG — CM 공헌이익 Summary
// UI_CM_KTNG_01 → CmKtng01.jsx
//   SearchArea: FROM/TO MONTH, PROD_CNTRY(multi), SALES_CNTRY(multi), ITEM, 5 체크박스
//   ButtonArea Right: UNIT_PAC_KRW 라벨 + [CALC_CM] 버튼
//   Grid: 27 컬럼 (BASE_YM/품목/생산국/판매국/단가/원가/마진/하이퍼인플레/물류비(SEA/TRUCK)/관세(AMT/PCT)/CM_AMT/CM_RATE + 점검대상)

const ROWS = [
  { BASE_YM: '2026-06', ITEM_CD: 'ITM-ESSE-INTL',  ITEM_NM: 'ESSE Asian',     ITEM_SHAPE: 'KS',     PROD_CNTRY: '한국',      SALES_CNTRY: '대만',    RTS_ACT: '2026-06-15', INCOTERMS: 'FOB', NET_UTPIC: 2850, MAT_COST: 850,  MARKUP: 15.0, HYPER: 0,    FINAL_MAT_COST: 977.5,  SEA: 12, TRUCK: 8,  TARIFF_AMT: 285,  TARIFF_PCT: 10.0, CM_AMT: 1567.5, CM_RATE: 55.0, CHECK: true,  DP_YN: true,  EOD: false },
  { BASE_YM: '2026-06', ITEM_CD: 'ITM-ESSE-INTL',  ITEM_NM: 'ESSE Asian',     ITEM_SHAPE: 'KS',     PROD_CNTRY: '한국',      SALES_CNTRY: '미국',    RTS_ACT: '2026-06-20', INCOTERMS: 'CIF', NET_UTPIC: 3200, MAT_COST: 850,  MARKUP: 12.0, HYPER: 0,    FINAL_MAT_COST: 952.0,  SEA: 45, TRUCK: 15, TARIFF_AMT: 0,    TARIFF_PCT: 0,    CM_AMT: 2188.0, CM_RATE: 68.4, CHECK: true,  DP_YN: true,  EOD: false },
  { BASE_YM: '2026-06', ITEM_CD: 'ITM-1MG-INTL',   ITEM_NM: 'THE ONE',        ITEM_SHAPE: 'PREMIUM', PROD_CNTRY: '한국',      SALES_CNTRY: '유럽',    RTS_ACT: '2026-07-01', INCOTERMS: 'CIF', NET_UTPIC: 3850, MAT_COST: 1020, MARKUP: 14.0, HYPER: 0,    FINAL_MAT_COST: 1162.8, SEA: 58, TRUCK: 22, TARIFF_AMT: 770,  TARIFF_PCT: 20.0, CM_AMT: 1837.2, CM_RATE: 47.7, CHECK: true,  DP_YN: true,  EOD: false },
  { BASE_YM: '2026-06', ITEM_CD: 'ITM-DIS-INTL',   ITEM_NM: 'THIS',           ITEM_SHAPE: 'KS',     PROD_CNTRY: '한국',      SALES_CNTRY: '일본',    RTS_ACT: '2026-06-25', INCOTERMS: 'FOB', NET_UTPIC: 2950, MAT_COST: 880,  MARKUP: 15.0, HYPER: 0,    FINAL_MAT_COST: 1012.0, SEA: 8,  TRUCK: 5,  TARIFF_AMT: 0,    TARIFF_PCT: 0,    CM_AMT: 1925.0, CM_RATE: 65.3, CHECK: true,  DP_YN: true,  EOD: false },
  { BASE_YM: '2026-06', ITEM_CD: 'ITM-TIME-INTL', ITEM_NM: 'TIME',           ITEM_SHAPE: 'KS',     PROD_CNTRY: '카자흐스탄', SALES_CNTRY: '러시아',  RTS_ACT: '2026-06-18', INCOTERMS: 'DAP', NET_UTPIC: 1850, MAT_COST: 620,  MARKUP: 18.0, HYPER: 25.0, FINAL_MAT_COST: 914.5,  SEA: 0,  TRUCK: 35, TARIFF_AMT: 92.5, TARIFF_PCT: 5.0,  CM_AMT: 808.0,  CM_RATE: 43.7, CHECK: true,  DP_YN: true,  EOD: false },
  { BASE_YM: '2026-06', ITEM_CD: 'ITM-LSN-INTL',  ITEM_NM: 'LAISON',         ITEM_SHAPE: 'PREMIUM', PROD_CNTRY: '인도네시아', SALES_CNTRY: '베트남',  RTS_ACT: '2026-07-05', INCOTERMS: 'FOB', NET_UTPIC: 2100, MAT_COST: 720,  MARKUP: 14.0, HYPER: 0,    FINAL_MAT_COST: 820.8,  SEA: 18, TRUCK: 10, TARIFF_AMT: 210,  TARIFF_PCT: 10.0, CM_AMT: 1041.2, CM_RATE: 49.6, CHECK: false, DP_YN: true,  EOD: true  },
];

export default function KtngCmSummaryMockup() {
  return (
    <MockShell
      patternCode="ktng_cm_summary"
      patternLabel="KTNG — CM 공헌이익 Summary"
      layoutCategory="LAYOUT_SINGLE"
      description="UI_CM_KTNG_01 → CmKtng01.jsx. SearchArea (FROM/TO MONTH · PROD_CNTRY multi · SALES_CNTRY multi · ITEM · 5 체크박스) + 우측 [CALC_CM] 버튼. Grid 27 컬럼 (BASE_YM/품목/생산국/판매국/INCOTERMS/단가/원가/마진/하이퍼인플레/물류비(SEA/TRUCK)/관세(AMT/PCT)/CM_AMT/CM_RATE + 점검대상 체크박스). 셀 데이터는 KTNG 도메인 (에쎄/디스/타임/레종 × 한국/카자흐/인니 생산 × 대만/미국/유럽/일본/러시아 판매)."
    >
      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="FROM_MONTH" size="small" select value="2026-04" sx={{ width: 130 }}>
            <MenuItem value="2026-04">2026-04</MenuItem>
          </TextField>
          <TextField label="TO_MONTH" size="small" select value="2026-06" sx={{ width: 130 }}>
            <MenuItem value="2026-06">2026-06</MenuItem>
          </TextField>
          <TextField label="PROD_CNTRY" size="small" value="한국, 카자흐스탄, 인도네시아" sx={{ width: 220 }} />
          <TextField label="SALES_CNTRY" size="small" value="ALL" sx={{ width: 160 }} />
          <TextField label="ITEM" size="small" value="" placeholder="브랜드 검색"
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }}
            sx={{ width: 200 }} />
          <FormControlLabel control={<Checkbox size="small" />} label={<Typography sx={{ fontSize: 11 }}>EXCEPT_EOD</Typography>} />
          <FormControlLabel control={<Checkbox size="small" defaultChecked />} label={<Typography sx={{ fontSize: 11 }}>DATA_CHECK</Typography>} />
          <FormControlLabel control={<Checkbox size="small" defaultChecked />} label={<Typography sx={{ fontSize: 11 }}>CM_CHECK</Typography>} />
          <FormControlLabel control={<Checkbox size="small" />} label={<Typography sx={{ fontSize: 11 }}>DP_CHECK</Typography>} />
          <FormControlLabel control={<Checkbox size="small" />} label={<Typography sx={{ fontSize: 11 }}>NEW_ITEM</Typography>} />
        </Stack>
      </Box>

      {/* ButtonArea */}
      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ flexGrow: 1 }} />
        <Typography sx={{ fontSize: 11, color: 'text.secondary', fontFamily: 'monospace' }}>단위: KRW (PAC)</Typography>
        <Button size="small" variant="contained" color="primary" startIcon={<CalculateIcon />}>CALC_CM</Button>
      </Box>

      {/* Grid */}
      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                {/* 그룹 헤더 */}
                <TableRow>
                  <TableCell colSpan={6} sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>기준 정보</TableCell>
                  <TableCell colSpan={2} sx={{ bgcolor: '#dbeafe', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>출하 / INCOTERMS</TableCell>
                  <TableCell colSpan={3} sx={{ bgcolor: '#fef3c7', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>단가 / 원가</TableCell>
                  <TableCell colSpan={1} sx={{ bgcolor: '#fef3c7', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>HYPER</TableCell>
                  <TableCell colSpan={1} sx={{ bgcolor: '#fef3c7', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>최종</TableCell>
                  <TableCell colSpan={2} sx={{ bgcolor: '#fce7f3', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>LOGI_COST</TableCell>
                  <TableCell colSpan={2} sx={{ bgcolor: '#fce7f3', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>TARIFF</TableCell>
                  <TableCell colSpan={2} sx={{ bgcolor: '#dcfce7', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>CM</TableCell>
                  <TableCell colSpan={3} sx={{ bgcolor: '#f3e8ff', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>CHECK_TARGET</TableCell>
                </TableRow>
                <TableRow>
                  {['BASE_YM', 'ITEM_CD', 'ITEM_NM', 'SHAPE', 'PROD_CNTRY', 'SALES_CNTRY'].map((h) => (
                    <TableCell key={h} sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10, textAlign: 'center' }}>{h}</TableCell>
                  ))}
                  {['RTS_ACT_DD', 'INCOTERMS'].map((h) => (
                    <TableCell key={h} sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10, textAlign: 'center' }}>{h}</TableCell>
                  ))}
                  {['NET_UTPIC', 'MAT_COST', 'MARKUP%'].map((h) => (
                    <TableCell key={h} sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10, textAlign: 'right', fontFamily: 'monospace' }}>{h}</TableCell>
                  ))}
                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10, textAlign: 'right', fontFamily: 'monospace' }}>HYPER%</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10, textAlign: 'right', fontFamily: 'monospace' }}>FINAL_MAT</TableCell>
                  {['SEA', 'TRUCK', 'TRF_AMT', 'TRF_PCT'].map((h) => (
                    <TableCell key={h} sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10, textAlign: 'right', fontFamily: 'monospace' }}>{h}</TableCell>
                  ))}
                  <TableCell sx={{ bgcolor: '#dcfce7', fontWeight: 700, fontSize: 10, textAlign: 'right', fontFamily: 'monospace' }}>CM_AMT</TableCell>
                  <TableCell sx={{ bgcolor: '#dcfce7', fontWeight: 700, fontSize: 10, textAlign: 'right', fontFamily: 'monospace' }}>CM_RATE</TableCell>
                  {['CM_CHK', 'DP_YN', 'EOD_YN'].map((h) => (
                    <TableCell key={h} sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10, textAlign: 'center' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontSize: 11, textAlign: 'center', fontFamily: 'monospace' }}>{r.BASE_YM}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', color: '#1565c0', textDecoration: 'underline' }}>{r.ITEM_CD}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.ITEM_NM}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.ITEM_SHAPE}</TableCell>
                    <TableCell sx={{ fontSize: 11, textAlign: 'center' }}>{r.PROD_CNTRY}</TableCell>
                    <TableCell sx={{ fontSize: 11, textAlign: 'center' }}>{r.SALES_CNTRY}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>{r.RTS_ACT}</TableCell>
                    <TableCell sx={{ fontSize: 11, textAlign: 'center' }}>{r.INCOTERMS}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.NET_UTPIC.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.MAT_COST.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.MARKUP.toFixed(1)}%</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', color: r.HYPER > 0 ? '#ef4444' : '#d1d5db' }}>{r.HYPER > 0 ? `${r.HYPER.toFixed(1)}%` : '-'}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.FINAL_MAT_COST.toFixed(1)}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.SEA}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.TRUCK}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.TARIFF_AMT > 0 ? r.TARIFF_AMT.toLocaleString() : '-'}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.TARIFF_PCT > 0 ? `${r.TARIFF_PCT.toFixed(1)}%` : '-'}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 700, bgcolor: '#f0fdf4' }}>{r.CM_AMT.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 700, bgcolor: '#f0fdf4', color: r.CM_RATE >= 50 ? '#10b981' : '#f59e0b' }}>{r.CM_RATE.toFixed(1)}%</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Checkbox size="small" checked={r.CHECK} disabled sx={{ p: 0.25 }} /></TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Checkbox size="small" checked={r.DP_YN} disabled sx={{ p: 0.25 }} /></TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Checkbox size="small" checked={r.EOD} disabled sx={{ p: 0.25 }} /></TableCell>
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

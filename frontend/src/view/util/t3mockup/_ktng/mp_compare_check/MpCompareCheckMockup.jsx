import React, { useState } from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Paper, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// MpKtng06 (BF & 회귀분석 예측 비교), MpKtng08 (설비별 정수 부정수 점검)
// 두 비교/점검 화면을 같은 패턴 — 좌측 차트(비교) + 우측 위반 리스트
// 운영 원본 styleCallback: MpKtng08 의 PLANT_CD (mockup 의 RES_CD = 설비/공장 식별자) 만 info 톤.

const ACCURACY_ROWS = [
  { ITEM_LV3: 'KING-RED', PERIOD: '2026-06', BF: 12500, REG: 11800, ACTUAL: 12300, BF_MAPE: 1.6, REG_MAPE: 4.1, WINNER: 'BF' },
  { ITEM_LV3: 'KING-BLU', PERIOD: '2026-06', BF:  8800, REG:  9200, ACTUAL:  8900, BF_MAPE: 1.1, REG_MAPE: 3.4, WINNER: 'BF' },
  { ITEM_LV3: 'SLIM',     PERIOD: '2026-06', BF:  5500, REG:  6100, ACTUAL:  5950, BF_MAPE: 7.6, REG_MAPE: 2.5, WINNER: 'REG' },
  { ITEM_LV3: 'NGP-DEV',  PERIOD: '2026-06', BF:  4200, REG:  5500, ACTUAL:  5200, BF_MAPE: 19.2, REG_MAPE: 5.8, WINNER: 'REG' },
  { ITEM_LV3: 'NGP-STICK',PERIOD: '2026-06', BF:  3800, REG:  4400, ACTUAL:  4100, BF_MAPE: 7.3, REG_MAPE: 7.3, WINNER: 'TIE' },
  { ITEM_LV3: 'EXPORT-K', PERIOD: '2026-06', BF: 16000, REG: 15500, ACTUAL: 15800, BF_MAPE: 1.3, REG_MAPE: 1.9, WINNER: 'BF' },
];

// 설비별 정수/부정수 점검 (MpKtng08) — 작업단위 정수 검증
const INT_ROWS_FIXED = [
  { RES_CD: 'L01-MK', ITEM_LV3: 'KING-RED', PLAN_QTY: 35000, MOQ: 50000, ALT: 'OVER',   GAP: -15000 },
  { RES_CD: 'L02-MK', ITEM_LV3: 'KING-BLU', PLAN_QTY: 40500, MOQ: 50000, ALT: 'OVER',   GAP:  -9500 },
  { RES_CD: 'L03-PK', ITEM_LV3: 'SLIM',     PLAN_QTY: 28000, MOQ: 30000, ALT: 'OVER',   GAP:  -2000 },
  { RES_CD: 'L11-MK', ITEM_LV3: 'KING-RED', PLAN_QTY: 75000, MOQ: 50000, ALT: 'OK',     GAP:      0 },
  { RES_CD: 'L21-MK', ITEM_LV3: 'SLIM',     PLAN_QTY: 18000, MOQ: 30000, ALT: 'OVER',   GAP: -12000 },
  { RES_CD: 'L22-NGP',ITEM_LV3: 'NGP-DEV',  PLAN_QTY: 12500, MOQ: 10000, ALT: 'OK',     GAP:      0 },
];

export default function MpCompareCheckMockup() {
  const [tab, setTab] = useState(0);
  return (
    <MockShell patternCode="ktng_mp_compare_check" patternLabel="KTNG — 예측 비교 / 정수 점검 (MpKtng06/08)"
      layoutCategory="LAYOUT_SINGLE" description="BF vs 회귀분석 예측 정확도 비교 (MpKtng06) + 설비별 정수/부정수 점검 (MpKtng08) — 통합 진단 화면.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="버전" size="small" select value="V2026-05" sx={{ width: 140 }}>
            <MenuItem value="V2026-05">V2026-05</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-06" sx={{ width: 140 }} />
          <TextField label="ITEM_LV3" size="small" value="" placeholder="품목" sx={{ width: 150 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="BF vs 회귀 예측 비교 (MpKtng06)" />
          <Tab label="설비별 정수 점검 (MpKtng08)" />
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        {/* BF vs REG */}
        {tab === 0 && (
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>BF 예측 vs 회귀분석 예측 — 정확도 비교</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Chip size="small" label={`BF 우세 ${ACCURACY_ROWS.filter(r=>r.WINNER==='BF').length}건`} color="primary" />
            <Chip size="small" label={`REG 우세 ${ACCURACY_ROWS.filter(r=>r.WINNER==='REG').length}건`} color="success" sx={{ ml: 0.5 }} />
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['ITEM_LV3','PERIOD','BF 예측','REG 예측','실적','BF MAPE','REG MAPE','승자'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                      textAlign: ['BF 예측','REG 예측','실적','BF MAPE','REG MAPE'].includes(c) ? 'right' : (c === '승자' ? 'center' : 'left') }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ACCURACY_ROWS.map((r, i) => (
                  // MpKtng06 운영 jsx 에는 styleCallback 없음 — 정량 강조 제거, plain 행만 유지
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.ITEM_LV3}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.PERIOD}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.BF.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.REG.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{r.ACTUAL.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.BF_MAPE.toFixed(1)}%</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.REG_MAPE.toFixed(1)}%</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip size="small" label={r.WINNER} color={r.WINNER === 'BF' ? 'primary' : r.WINNER === 'REG' ? 'success' : 'default'} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        )}

        {/* MOQ 점검 */}
        {tab === 1 && (
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>설비별 정수 / 부정수 점검</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['RES_CD','ITEM_LV3','PLAN 수량','MOQ (정수 단위)','GAP','권고'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                      textAlign: ['PLAN 수량','MOQ (정수 단위)','GAP'].includes(c) ? 'right' : (c === '권고' ? 'center' : 'left') }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {INT_ROWS_FIXED.map((r, i) => (
                  // 운영 MpKtng08 styleCallback: PLANT_CD (mockup 의 RES_CD = 설비/공장 식별자) 만 info 톤
                  <TableRow key={i} hover>
                    <TableCell sx={cellSx('info', { mono: true })}>{r.RES_CD}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.ITEM_LV3}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.PLAN_QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.MOQ.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.GAP.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Chip size="small" label={r.ALT} color={r.ALT === 'OK' ? 'success' : 'warning'} variant="outlined" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        )}
      </Box>
    </MockShell>
  );
}

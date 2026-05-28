import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Paper,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// MpKtng04 — RTF 조정. 공급 부족 발생 시 우선순위/할당량 수동 조정.
// 운영 원본 styleCallback: LOCAT_CD, PROD_TYPE, PROD_SKU_NM, REQUEST_BY, PLAN_QTY,
//                          RTF_QTY_FOOTER, PROD_INV_QTY_FOOTER, SAFE_INV_QTY (입력 가능 셀).
//                          mockup 매칭 셀: ITEM_LV3 / ACCOUNT / REQUEST_QTY / ALLOC_QTY / NEW_ALLOC — info 톤.

const ROWS = [
  { ITEM_LV3: 'KING-RED', ACCOUNT: 'CU',          REQUEST_QTY: 12500, ALLOC_QTY: 10500, GAP: -2000, NEW_ALLOC: 11000, PRIORITY: 'A' },
  { ITEM_LV3: 'KING-RED', ACCOUNT: 'GS25',        REQUEST_QTY: 11800, ALLOC_QTY: 10000, GAP: -1800, NEW_ALLOC: 10500, PRIORITY: 'A' },
  { ITEM_LV3: 'KING-RED', ACCOUNT: 'SEVEN',       REQUEST_QTY:  8200, ALLOC_QTY:  6500, GAP: -1700, NEW_ALLOC:  7000, PRIORITY: 'B' },
  { ITEM_LV3: 'KING-BLU', ACCOUNT: 'CU',          REQUEST_QTY:  8800, ALLOC_QTY:  8800, GAP:     0, NEW_ALLOC:  8800, PRIORITY: 'A' },
  { ITEM_LV3: 'NGP-DEV',  ACCOUNT: 'COUPANG',     REQUEST_QTY:  5500, ALLOC_QTY:  3200, GAP: -2300, NEW_ALLOC:  4500, PRIORITY: 'A' },
  { ITEM_LV3: 'NGP-DEV',  ACCOUNT: 'SEVEN',       REQUEST_QTY:  4200, ALLOC_QTY:  2800, GAP: -1400, NEW_ALLOC:  3500, PRIORITY: 'A' },
  { ITEM_LV3: 'EXPORT-K', ACCOUNT: '인도',        REQUEST_QTY: 16000, ALLOC_QTY: 16000, GAP:     0, NEW_ALLOC: 16000, PRIORITY: 'A' },
  { ITEM_LV3: 'EXPORT-K', ACCOUNT: '인도네시아',   REQUEST_QTY: 12500, ALLOC_QTY: 11200, GAP: -1300, NEW_ALLOC: 11800, PRIORITY: 'B' },
];

const SHORTAGE_COUNT = ROWS.filter((r) => r.GAP < 0).length;
const TOTAL_GAP = ROWS.reduce((s, r) => s + r.GAP, 0);

export default function MpRtfAdjustmentMockup() {
  return (
    <MockShell patternCode="ktng_mp_rtf_adjustment" patternLabel="KTNG — RTF 조정 (MpKtng04)"
      layoutCategory="LAYOUT_SINGLE" description="RTF 부족 발생 시 거래처 우선순위 기반 할당량 수동 조정. 입력 가능 셀에 info 톤.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="버전" size="small" select value="V2026-05" sx={{ width: 140 }}>
            <MenuItem value="V2026-05">V2026-05</MenuItem>
          </TextField>
          <TextField label="ITEM_LV3" size="small" value="" placeholder="품목 검색" sx={{ width: 160 }} />
          <TextField label="부족 필터" size="small" select value="short" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="short">부족만</MenuItem>
            <MenuItem value="normal">정상만</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<AutoFixHighIcon />} color="warning">우선순위 자동 재할당</Button>
          <Button variant="contained" size="small" startIcon={<SaveIcon />} color="primary">조정 저장</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        <Stack direction="row" spacing={1.5}>
          <Paper variant="outlined" sx={{ p: 1.5, flex: 1, backgroundColor: 'error.50' }}>
            <Typography variant="caption">부족 항목</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>{SHORTAGE_COUNT} 건</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 1.5, flex: 1, backgroundColor: 'warning.50' }}>
            <Typography variant="caption">총 부족량</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>{TOTAL_GAP.toLocaleString()}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 1.5, flex: 1, backgroundColor: 'info.50' }}>
            <Typography variant="caption">조정 후 충족율</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>91.2%</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 1.5, flex: 1 }}>
            <Typography variant="caption">미저장 변경</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>6 셀</Typography>
          </Paper>
        </Stack>

        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 240 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>RTF 조정 상세</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['ITEM_LV3','ACCOUNT','요청량','현 할당','GAP','조정 할당 (편집)','우선순위'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                      textAlign: ['요청량','현 할당','GAP','조정 할당 (편집)'].includes(c) ? 'right' : (c === '우선순위' ? 'center' : 'left') }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  // 운영 MpKtng04 styleCallback: 입력 가능 셀 (LOCAT_CD/PROD_SKU_NM/REQUEST_BY/PLAN_QTY/RTF_QTY 등)
                  //   → mockup 매칭: ITEM_LV3 / ACCOUNT / REQUEST_QTY / ALLOC_QTY / NEW_ALLOC
                  <TableRow key={i} hover>
                    <TableCell sx={cellSx('info', { mono: true })}>{r.ITEM_LV3}</TableCell>
                    <TableCell sx={cellSx('info')}>{r.ACCOUNT}</TableCell>
                    <TableCell sx={cellSx('info', { mono: true, align: 'right' })}>{r.REQUEST_QTY.toLocaleString()}</TableCell>
                    <TableCell sx={cellSx('info', { mono: true, align: 'right' })}>{r.ALLOC_QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>
                      {r.GAP > 0 ? '+' : ''}{r.GAP.toLocaleString()}
                    </TableCell>
                    <TableCell sx={cellSx('info', { mono: true, align: 'right' })}>
                      {r.NEW_ALLOC.toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Chip size="small" label={r.PRIORITY} color={r.PRIORITY === 'A' ? 'error' : r.PRIORITY === 'B' ? 'warning' : 'default'} variant="outlined" /></TableCell>
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

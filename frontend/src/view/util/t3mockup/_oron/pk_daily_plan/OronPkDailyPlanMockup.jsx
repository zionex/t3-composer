import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// OronPk04 — 일일/주간 생산계획 + 배송계획
// UI_PK_ORN_PACK_DAILY_PLAN, PACK_WKLY_PRT, PACK_DELIVY_PLAN, PACK_OTHER_PLAN, PACK_DAILY_REQ_DTL

const DAYS = ['06-03(화)','06-04(수)','06-05(목)','06-06(금)','06-07(토)','06-09(월)','06-10(화)'];

const DAILY_ROWS = [
  { LINE_CD: 'L-PRINT-01', ITEM_CD: 'PK10001', ITEM_NM: '오론 마스크 단상자',     vals: [25000,18000, 0,   22000, 0,    24000, 26000] },
  { LINE_CD: 'L-PRINT-02', ITEM_CD: 'PK20001', ITEM_NM: '알루미늄 파우치 5매용',  vals: [50000, 0,    48000, 0,    0,    52000, 0    ] },
  { LINE_CD: 'L-PROC-01',  ITEM_CD: 'PK20001', ITEM_NM: '파우치 가공',            vals: [0,    48000, 0,    50000, 25000,0,    52000] },
  { LINE_CD: 'L-PROC-02',  ITEM_CD: 'PK30001', ITEM_NM: '튜브 50ml 압출',         vals: [12000,12500, 13000,12800, 0,    13500, 14000] },
  { LINE_CD: 'L-CUT-01',   ITEM_CD: 'PK10001', ITEM_NM: '단상자 분단',            vals: [0,    24500, 17800,21500, 0,    23000, 25500] },
  { LINE_CD: 'L-CUT-02',   ITEM_CD: 'PK40001', ITEM_NM: 'BOX 분단',               vals: [4500, 4200,  4800, 5000,  0,    5200,  5500 ] },
];

const DELIVERY_ROWS = [
  { DELIVY_NO: 'DL-2026-0521', FROM: '제천공장', TO: '익산공장',  ITEM_CD: 'PK10001', QTY: 24500, UOM: 'PCS', DT: '2026-06-05', VEHICLE: '11톤 #21', STATUS: 'PLANNED' },
  { DELIVY_NO: 'DL-2026-0522', FROM: '익산공장', TO: '제천공장',  ITEM_CD: 'PK20001', QTY: 48000, UOM: 'PCS', DT: '2026-06-04', VEHICLE: '5톤 #08',  STATUS: 'IN_TRANSIT' },
  { DELIVY_NO: 'DL-2026-0523', FROM: '제천공장', TO: '대전물류',  ITEM_CD: 'PK30001', QTY: 12000, UOM: 'PCS', DT: '2026-06-06', VEHICLE: '5톤 #12',  STATUS: 'PLANNED' },
  { DELIVY_NO: 'DL-2026-0524', FROM: 'OEM-A',    TO: '익산공장',  ITEM_CD: 'PK10002', QTY: 18000, UOM: 'PCS', DT: '2026-06-05', VEHICLE: '11톤 #34', STATUS: 'CONFIRMED' },
  { DELIVY_NO: 'DL-2026-0525', FROM: '익산공장', TO: '경기 물류', ITEM_CD: 'PK40001', QTY: 5000,  UOM: 'PCS', DT: '2026-06-04', VEHICLE: '5톤 #18',  STATUS: 'COMPLETED' },
];

const STATUS_COLOR = { PLANNED: 'default', CONFIRMED: 'primary', IN_TRANSIT: 'info', COMPLETED: 'success' };

export default function OronPkDailyPlanMockup() {
  return (
    <MockShell
      patternCode="oron_pk_daily_plan"
      patternLabel="ORON — 일일/주간 생산계획 + 배송계획"
      layoutCategory="LAYOUT_SINGLE"
      description="일별 라인×품목 생산 크로스탭 + 공장간/외부 배송계획. 주간 의뢰서 인쇄 + 일별 원/부재료 소요량 명세. UI_PK_ORN_PACK_DAILY_PLAN, WKLY_PRT, DELIVY_PLAN, OTHER_PLAN, DAILY_REQ_DTL."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="공장" size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="JC">제천</MenuItem>
            <MenuItem value="IS">익산</MenuItem>
          </TextField>
          <TextField label="시나리오" size="small" value="SCN_0023" sx={{ width: 150 }} />
          <TextField label="시작일" size="small" value="2026-06-03" sx={{ width: 140 }} />
          <TextField label="조회 일수" size="small" select value="7" sx={{ width: 100 }}>
            <MenuItem value="7">7일</MenuItem>
            <MenuItem value="14">14일</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<PrintIcon />}>주간 의뢰서 인쇄</Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>Excel</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
        {/* 일별 생산 계획 (크로스탭) */}
        <Paper variant="outlined" sx={{ flex: 1.4, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>일별 생산계획 (라인×품목 × 7일)</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 120, textAlign: 'center' }}>라인</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>품목</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 200 }}>품목명</TableCell>
                  {DAYS.map((d) => (
                    <TableCell key={d} sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 95, textAlign: 'right' }}>{d}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {DAILY_ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 600 }}>{r.LINE_CD}</TableCell>
                    <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.ITEM_CD}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{r.ITEM_NM}</TableCell>
                    {r.vals.map((v, j) => (
                      <TableCell key={j} sx={{
                        textAlign: 'right', fontFamily: 'monospace',
                        color: v === 0 ? '#d1d5db' : '#374151', fontWeight: v > 0 ? 600 : 400,
                        bgcolor: v === 0 ? '#fafafa' : 'transparent',
                      }}>
                        {v === 0 ? '-' : v.toLocaleString()}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* 배송 계획 */}
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <LocalShippingIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>배송계획 (공장간 + 외부)</Typography>
              <Chip label="5건" size="small" variant="outlined" />
            </Stack>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 130, textAlign: 'center' }}>배송번호</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>FROM</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>TO</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>품목</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'right' }}>수량</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>배송일</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>차량</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {DELIVERY_ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.DELIVY_NO}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontSize: 12 }}>{r.FROM}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontSize: 12 }}>{r.TO}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.ITEM_CD}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{r.QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.DT}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.VEHICLE}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Chip label={r.STATUS} size="small" color={STATUS_COLOR[r.STATUS]} /></TableCell>
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

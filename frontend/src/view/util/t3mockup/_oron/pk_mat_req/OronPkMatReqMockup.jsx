import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// OronPk05 — 자재/잉크/원단/지관 소요량 생성 + 발주분배 + 임가공
// UI_PK_ORN_PACK_MAT_REQ_CRT, INK_REQ_CRT, INK_ORD_DIST, FILM_ORD_DIST, TUBE_ORD_DIST, TUBE_MGMT, PACK_OEM_ORD, MAT_PURC

const TABS = [
  { key: 'mat',  label: '자재 소요량 생성' },
  { key: 'ink',  label: '잉크 발주 분배' },
  { key: 'film', label: '원단 발주 분배' },
  { key: 'tube', label: '지관 발주 분배' },
  { key: 'oem',  label: '임가공 발주서' },
  { key: 'purc', label: '자재 발주내역' },
];

const REQ_ROWS = [
  { ITEM_CD: 'M-INK-BK',  ITEM_NM: '인쇄잉크 (블랙)',     REQ_QTY: 152.5, UOM: 'kg',  ON_HAND: 88,   SHORT: 64.5, VENDOR: 'INK Global',  LEAD: 45, REQ_DT: '2026-06-20' },
  { ITEM_CD: 'M-INK-CY',  ITEM_NM: '인쇄잉크 (시안)',     REQ_QTY:  98.2, UOM: 'kg',  ON_HAND: 75,   SHORT: 23.2, VENDOR: 'INK Global',  LEAD: 45, REQ_DT: '2026-06-20' },
  { ITEM_CD: 'M-INK-MG',  ITEM_NM: '인쇄잉크 (마젠타)',   REQ_QTY:  88.5, UOM: 'kg',  ON_HAND: 60,   SHORT: 28.5, VENDOR: 'INK Global',  LEAD: 45, REQ_DT: '2026-06-20' },
  { ITEM_CD: 'M-INK-YL',  ITEM_NM: '인쇄잉크 (옐로)',     REQ_QTY:  72.0, UOM: 'kg',  ON_HAND: 90,   SHORT:  0,   VENDOR: 'INK Global',  LEAD: 45, REQ_DT: '2026-06-20' },
  { ITEM_CD: 'M-FILM-AL', ITEM_NM: 'AL/PE 복합 원단',     REQ_QTY: 1200,  UOM: 'm',   ON_HAND: 350,  SHORT: 850,  VENDOR: '대성포장',    LEAD: 14, REQ_DT: '2026-06-05' },
  { ITEM_CD: 'M-TUBE-30', ITEM_NM: '지관 Φ30mm',          REQ_QTY: 14500, UOM: 'PCS', ON_HAND: 8000, SHORT: 6500, VENDOR: 'KS튜브',      LEAD:  5, REQ_DT: '2026-05-31' },
  { ITEM_CD: 'M-TUBE-35', ITEM_NM: '지관 Φ35mm',          REQ_QTY:  9800, UOM: 'PCS', ON_HAND: 12000,SHORT:  0,   VENDOR: 'KS튜브',      LEAD:  5, REQ_DT: '2026-05-31' },
];

const DIST_ROWS = [
  { ITEM_CD: 'M-INK-BK', PLANT_JC: 80,  PLANT_IS: 50,   TOTAL: 130, REQ_PCT_JC: 61.5, REQ_PCT_IS: 38.5 },
  { ITEM_CD: 'M-INK-CY', PLANT_JC: 60,  PLANT_IS: 38,   TOTAL: 98,  REQ_PCT_JC: 61.2, REQ_PCT_IS: 38.8 },
  { ITEM_CD: 'M-INK-MG', PLANT_JC: 55,  PLANT_IS: 33,   TOTAL: 88,  REQ_PCT_JC: 62.5, REQ_PCT_IS: 37.5 },
  { ITEM_CD: 'M-INK-YL', PLANT_JC: 45,  PLANT_IS: 27,   TOTAL: 72,  REQ_PCT_JC: 62.5, REQ_PCT_IS: 37.5 },
];

export default function OronPkMatReqMockup() {
  const [tab, setTab] = React.useState(0);
  return (
    <MockShell
      patternCode="oron_pk_mat_req"
      patternLabel="ORON — 자재/잉크/원단/지관 소요량 + 발주 분배"
      layoutCategory="LAYOUT_SINGLE"
      description="자재별 소요량 자동 생성 + 보유 재고 차감 + 부족분 발주. 6개 탭 (자재 생성·잉크/원단/지관 발주 분배·임가공 발주서·자재 발주내역). UI_PK_ORN_PACK_MAT_REQ_CRT, INK_REQ_CRT, INK/FILM/TUBE_ORD_DIST, PACK_OEM_ORD, MAT_PURC."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="시나리오" size="small" value="SCN_0023" sx={{ width: 150 }} />
          <TextField label="공장" size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="JC">제천</MenuItem>
            <MenuItem value="IS">익산</MenuItem>
          </TextField>
          <TextField label="자재유형" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="INK">잉크</MenuItem>
            <MenuItem value="FILM">원단</MenuItem>
            <MenuItem value="TUBE">지관</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-06" sx={{ width: 130 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" color="primary" startIcon={<CalculateIcon />}>소요량 자동 생성</Button>
          <Button variant="contained" size="small" color="success" startIcon={<SendIcon />}>일괄 발주</Button>
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable">
          {TABS.map((t) => <Tab key={t.key} label={t.label} />)}
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
        {/* 메인 소요량 */}
        <Paper variant="outlined" sx={{ flex: 1.4, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>소요량 — 보유 재고 차감 후 발주 대상 ({TABS[tab].label})</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>자재코드</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 220 }}>자재명</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'right' }}>소요량</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 60, textAlign: 'center' }}>UOM</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'right' }}>보유재고</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'right' }}>부족 (발주)</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 140 }}>거래처</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 70, textAlign: 'right' }}>L/T</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>발주요청일</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {REQ_ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.ITEM_CD}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{r.ITEM_NM}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.REQ_QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{r.UOM}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: '#6b7280' }}>{r.ON_HAND.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: r.SHORT > 0 ? '#c62828' : '#10b981', bgcolor: r.SHORT > 0 ? '#ffebee' : '#e8f5e9' }}>
                      {r.SHORT > 0 ? `▲ ${r.SHORT.toLocaleString()}` : '✓ 충족'}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{r.VENDOR}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.LEAD}d</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.REQ_DT}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* 발주량 일일 분배 (잉크 예) */}
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>발주량 공장별 분배 (잉크 — 일일 분배 예시)</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 130, textAlign: 'center' }}>자재코드</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 130, textAlign: 'right' }}>제천 (kg)</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 130, textAlign: 'right' }}>익산 (kg)</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 130, textAlign: 'right' }}>합계 (kg)</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 130, textAlign: 'right' }}>제천 %</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 130, textAlign: 'right' }}>익산 %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {DIST_ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.ITEM_CD}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.PLANT_JC}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.PLANT_IS}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{r.TOTAL}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: '#1565c0' }}>{r.REQ_PCT_JC.toFixed(1)}%</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: '#1565c0' }}>{r.REQ_PCT_IS.toFixed(1)}%</TableCell>
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

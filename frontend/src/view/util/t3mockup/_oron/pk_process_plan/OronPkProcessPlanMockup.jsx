import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Tabs, Tab, ButtonGroup, IconButton, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import MockShell from '../../_shared/MockShell';

// ORON — PK 공정별 생산계획 (인쇄/가공/분단)
// 대표 화면: UI_PK_ORN_PACK_PRINT_MGMT "인쇄 생산계획 관리" (OrnPrintMgmt)
//   동일 패턴: PROC_MGMT, CUT_MGMT, CUT_MGMT_NEW, PRINT_NOTIFY, PROC_NOTIFY, CUT_NOTIFY
//   3개 공정을 탭으로 (인쇄/가공/분단) — 같은 base 의 variant 라 다탭

const TABS = [
  { code: 'PRINT', label: '인쇄', menu: 'UI_PK_ORN_PACK_PRINT_MGMT' },
  { code: 'PROC',  label: '가공', menu: 'UI_PK_ORN_PACK_PROC_MGMT' },
  { code: 'CUT',   label: '분단', menu: 'UI_PK_ORN_PACK_CUT_MGMT' },
];

const ROWS_BY_PROC = {
  PRINT: [
    { LINE: 'LN-PRT-01', PACK_CD: 'PK-MK-001-T', PACK_NM: '오론 비건마스크 5매 - TUBE',  START: '2026-06-08 08:00', END: '2026-06-08 16:00', PLAN_QTY: 8000, ACT_QTY: 8120, STATUS: 'DONE',     LOT: 'LOT-PRT-2026060801' },
    { LINE: 'LN-PRT-01', PACK_CD: 'PK-MK-010-T', PACK_NM: '오론 비건마스크 10매 - TUBE', START: '2026-06-08 16:00', END: '2026-06-09 00:00', PLAN_QTY: 3500, ACT_QTY: 3500, STATUS: 'DONE',     LOT: 'LOT-PRT-2026060802' },
    { LINE: 'LN-PRT-02', PACK_CD: 'PK-SR-30',    PACK_NM: '오론 세럼 30ml',              START: '2026-06-08 08:00', END: '2026-06-09 02:00', PLAN_QTY: 4500, ACT_QTY: 4480, STATUS: 'RUNNING',  LOT: 'LOT-PRT-2026060803' },
    { LINE: 'LN-PRT-02', PACK_CD: 'PK-SR-50',    PACK_NM: '오론 세럼 50ml',              START: '2026-06-09 02:00', END: '2026-06-09 14:00', PLAN_QTY: 2200, ACT_QTY: 0,    STATUS: 'PLANNED',  LOT: '-' },
    { LINE: 'LN-OEM-01', PACK_CD: 'PK-OEM-SUN',  PACK_NM: 'OEM 선크림 SPF50+ - PUMP',    START: '2026-06-08 09:00', END: '2026-06-09 09:00', PLAN_QTY: 8500, ACT_QTY: 5400, STATUS: 'RUNNING',  LOT: 'LOT-PRT-2026060804' },
  ],
  PROC: [
    { LINE: 'LN-PRC-01', PACK_CD: 'PK-MK-001-T', PACK_NM: '오론 비건마스크 5매 - TUBE',  START: '2026-06-09 08:00', END: '2026-06-09 18:00', PLAN_QTY: 8120, ACT_QTY: 0,    STATUS: 'PLANNED',  LOT: 'LOT-PRC-2026060901' },
    { LINE: 'LN-PRC-01', PACK_CD: 'PK-MK-010-T', PACK_NM: '오론 비건마스크 10매 - TUBE', START: '2026-06-09 18:00', END: '2026-06-10 04:00', PLAN_QTY: 3500, ACT_QTY: 0,    STATUS: 'PLANNED',  LOT: 'LOT-PRC-2026060902' },
    { LINE: 'LN-PRC-02', PACK_CD: 'PK-SR-30',    PACK_NM: '오론 세럼 30ml',              START: '2026-06-10 08:00', END: '2026-06-10 20:00', PLAN_QTY: 4500, ACT_QTY: 0,    STATUS: 'PLANNED',  LOT: '-' },
  ],
  CUT: [
    { LINE: 'LN-CUT-01', PACK_CD: 'PK-MK-001-T', PACK_NM: '오론 비건마스크 5매 - TUBE',  START: '2026-06-10 08:00', END: '2026-06-10 14:00', PLAN_QTY: 8120, ACT_QTY: 0,    STATUS: 'PLANNED',  LOT: 'LOT-CUT-2026061001' },
    { LINE: 'LN-CUT-02', PACK_CD: 'PK-OEM-SUN',  PACK_NM: 'OEM 선크림 SPF50+ - PUMP',    START: '2026-06-09 09:00', END: '2026-06-10 09:00', PLAN_QTY: 8500, ACT_QTY: 0,    STATUS: 'PLANNED',  LOT: '-' },
  ],
};

const STATUS_COLOR = { DONE: '#10b981', RUNNING: '#3b82f6', PLANNED: '#9ca3af', DELAYED: '#ef4444' };

export default function OronPkProcessPlanMockup() {
  const [tab, setTab] = React.useState(0);
  const proc = TABS[tab].code;
  const rows = ROWS_BY_PROC[proc] || [];
  const totalPlan = rows.reduce((s, r) => s + r.PLAN_QTY, 0);
  const totalAct = rows.reduce((s, r) => s + r.ACT_QTY, 0);

  return (
    <MockShell
      patternCode="oron_pk_process_plan"
      patternLabel="ORON — PK 공정별 생산계획 (인쇄/가공/분단)"
      layoutCategory="LAYOUT_SINGLE"
      description="3개 공정 (인쇄/가공/분단) 의 생산계획 관리 — 같은 base 의 variant 라 다탭. 각 탭: SearchArea (라인/포장재/기간) + 우측 ButtonArea + 단일 그리드 (라인/포장재/계획시간/계획수량/실적수량/상태/LOT). 같이 묶인 메뉴: 각 공정의 NOTIFY (점검) 화면도 동일 패턴."
    >
      {/* 공정 Tab */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          {TABS.map((t) => (
            <Tab key={t.code} label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>{t.label} 생산계획</span>
                <Chip label={t.menu} size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} />
              </Stack>
            } />
          ))}
        </Tabs>
      </Box>

      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="MAIN_VER" size="small" select value="V2026-06" sx={{ width: 140 }}>
            <MenuItem value="V2026-06">V2026-06</MenuItem>
          </TextField>
          <TextField label="LINE" size="small" select value="ALL" sx={{ width: 150 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <TextField label="PACK_CD" size="small" value="" sx={{ width: 180 }}
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
          <TextField label="STATUS" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="DONE">완료</MenuItem>
            <MenuItem value="RUNNING">진행중</MenuItem>
            <MenuItem value="PLANNED">계획됨</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-06-08 ~ 06-14" sx={{ width: 200 }} />
        </Stack>
      </Box>

      {/* Summary + Buttons */}
      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label={`PLAN ${totalPlan.toLocaleString()}`} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
        <Chip label={`ACT ${totalAct.toLocaleString()}`}   size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
        <Chip label={`${rows.length} 건`} size="small" color="primary" variant="outlined" />
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" variant="outlined" startIcon={<RefreshIcon />}>재계획</Button>
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
        <ButtonGroup variant="outlined" size="small">
          <IconButton size="small" title="GridSaveButton" color="primary"><SaveIcon fontSize="small" /></IconButton>
        </ButtonGroup>
      </Box>

      {/* Grid */}
      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center', fontSize: 12, fontFamily: 'monospace' }}>LINE</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 130, textAlign: 'center', fontSize: 12, fontFamily: 'monospace' }}>PACK_CD</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 220, textAlign: 'left', fontSize: 12 }}>PACK_NM</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 150, textAlign: 'center', fontSize: 12, fontFamily: 'monospace' }}>START</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 150, textAlign: 'center', fontSize: 12, fontFamily: 'monospace' }}>END</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'right', fontSize: 12, fontFamily: 'monospace' }}>PLAN_QTY</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'right', fontSize: 12, fontFamily: 'monospace' }}>ACT_QTY</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center', fontSize: 12 }}>STATUS</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 180, textAlign: 'center', fontSize: 12, fontFamily: 'monospace' }}>LOT_NO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>{r.LINE}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>{r.PACK_CD}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{r.PACK_NM}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>{r.START}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>{r.END}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'right' }}>{r.PLAN_QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'right', color: r.ACT_QTY === 0 ? '#d1d5db' : '#374151' }}>{r.ACT_QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 12, textAlign: 'center', fontWeight: 600, color: STATUS_COLOR[r.STATUS] }}>{r.STATUS}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'center', color: r.LOT === '-' ? 'text.disabled' : 'text.primary' }}>{r.LOT}</TableCell>
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

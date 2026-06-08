import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Tabs, Tab, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// KTNG — RPT PSI 작업 리포트 (7 메뉴)
//  16 생산 PSI / 17 생산계획 대비 실적 / 18~20 Global PSI (판매법인/직수출 O/X) / 21 판매계획 대비 실적 / 22 Global PSI CC/NGP

const TABS = [
  { code: '16', label: '생산 PSI',                   menu: 'UI_RPT_KTNG_16' },
  { code: '17', label: '생산계획 대비 실적',          menu: 'UI_RPT_KTNG_17' },
  { code: '18', label: 'Global PSI (판매법인)',       menu: 'UI_RPT_KTNG_18' },
  { code: '19', label: 'Global PSI (직수출 유통 O)',  menu: 'UI_RPT_KTNG_19' },
  { code: '20', label: 'Global PSI (직수출 유통 X)',  menu: 'UI_RPT_KTNG_20' },
  { code: '21', label: '판매계획 대비 실적',          menu: 'UI_RPT_KTNG_21' },
  { code: '22', label: 'Global PSI (CC/NGP 내수)',    menu: 'UI_RPT_KTNG_22' },
];

const DATE_COLS = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];

const ROWS = [
  { CATEGORY: '신탄진공장', ITEM_NM: '에쎄 스페셜 골드',  cat: 'P (생산)',     vals: [380000, 390000, 400000, 395000, 390000, 395000, 405000] },
  { CATEGORY: '신탄진공장', ITEM_NM: '에쎄 스페셜 골드',  cat: 'S (출하)',     vals: [375000, 388000, 398000, 392000, 388000, 392000, 402000] },
  { CATEGORY: '신탄진공장', ITEM_NM: '에쎄 스페셜 골드',  cat: 'I (재고)',     vals: [320000, 322000, 324000, 327000, 329000, 332000, 335000] },
  { CATEGORY: '신탄진공장', ITEM_NM: '디스 플러스',       cat: 'P (생산)',     vals: [125000, 130000, 132000, 130000, 128000, 130000, 135000] },
  { CATEGORY: '신탄진공장', ITEM_NM: '디스 플러스',       cat: 'S (출하)',     vals: [122000, 128500, 130500, 128500, 126500, 128500, 133500] },
  { CATEGORY: '신탄진공장', ITEM_NM: '디스 플러스',       cat: 'I (재고)',     vals: [185000, 186500, 188000, 189500, 191000, 192500, 194000] },
  { CATEGORY: 'Almaty공장', ITEM_NM: 'TIME',              cat: 'P (생산)',     vals: [42000,  45000,  48000,  50000,  52000,  55000,  58000] },
  { CATEGORY: 'Almaty공장', ITEM_NM: 'TIME',              cat: 'S (출하)',     vals: [38000,  43000,  47000,  49500,  51500,  54500,  57500] },
  { CATEGORY: 'Almaty공장', ITEM_NM: 'TIME',              cat: 'I (재고)',     vals: [75000,  77000,  78000,  78500,  79000,  79500,  80000] },
];

const CAT_COLOR = { 'P (생산)': '#1565c0', 'S (출하)': '#10b981', 'I (재고)': '#f59e0b' };

export default function KtngRptPsiWorkingMockup() {
  const [tab, setTab] = React.useState(0);
  return (
    <MockShell
      patternCode="ktng_rpt_psi_working"
      patternLabel="KTNG — RPT PSI 작업 리포트 (7 메뉴)"
      layoutCategory="LAYOUT_SINGLE"
      description="7개 PSI 작업 리포트 묶음 (생산 PSI / 생산-실적 / Global PSI 4종 / 판매-실적). CATEGORY × ITEM × MEASURE(P=생산/S=출하/I=재고) × 월별 7개."
    >
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          {TABS.map((t) => (
            <Tab key={t.code} label={<Stack direction="row" spacing={1} alignItems="center"><span>{t.label}</span><Chip label={t.menu} size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} /></Stack>} />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="VERSION_ID" size="small" select value="V2026-06" sx={{ width: 170 }}><MenuItem value="V2026-06">V2026-06</MenuItem></TextField>
          <TextField label="CATEGORY" size="small" select value="ALL" sx={{ width: 160 }}><MenuItem value="ALL">전체</MenuItem></TextField>
          <TextField label="ITEM" size="small" select value="ALL" sx={{ width: 160 }}><MenuItem value="ALL">전체</MenuItem></TextField>
          <TextField label="기간" size="small" value="2026-06 ~ 12" sx={{ width: 160 }} />
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
      </Box>

      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead><TableRow>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>CATEGORY</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>ITEM_NM</TableCell>
                <TableCell sx={{ bgcolor: '#fffbe6', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>MEASURE</TableCell>
                {DATE_COLS.map((d) => (
                  <TableCell key={d} sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace', textAlign: 'right' }}>{d.slice(2)}</TableCell>
                ))}
              </TableRow></TableHead>
              <TableBody>
                {ROWS.map((r, i) => {
                  const isFirstOfBlock = i % 3 === 0;
                  return (
                    <TableRow key={i} hover sx={{ borderTop: isFirstOfBlock ? '2px solid #e5e7eb' : undefined }}>
                      <TableCell sx={{ fontSize: 11 }}>{isFirstOfBlock ? r.CATEGORY : ''}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{isFirstOfBlock ? r.ITEM_NM : ''}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, textAlign: 'center', color: CAT_COLOR[r.cat] }}>{r.cat}</TableCell>
                      {r.vals.map((v, j) => (
                        <TableCell key={j} sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{v.toLocaleString()}</TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}

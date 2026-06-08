import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Tabs, Tab, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MockShell from '../../_shared/MockShell';

// KTNG — RPT 재고일수 (5 메뉴)
//  12 완제품 재고일수 (생산소)
//  13 완제품 재고일수 (판매법인)
//  14 완제품 재고일수 (공장)
//  15 장기재고 (완제품)
//  26 제조일자별 재고 현황 (WMS)

const TABS = [
  { code: '12', label: '완제품 재고일수 (생산소)', menu: 'UI_RPT_KTNG_12' },
  { code: '13', label: '완제품 재고일수 (판매법인)', menu: 'UI_RPT_KTNG_13' },
  { code: '14', label: '완제품 재고일수 (공장)',    menu: 'UI_RPT_KTNG_14' },
  { code: '15', label: '장기재고',                   menu: 'UI_RPT_KTNG_15' },
  { code: '26', label: '제조일자별 재고 (WMS)',     menu: 'UI_RPT_KTNG_26' },
];

const ROWS = [
  { LOCAT: '신탄진공장 창고', ITEM_NM: '에쎄 스페셜 골드',  STOCK_QTY: 320000, AVG_DAILY: 12500, INV_DAYS: 25.6, ZONE: 'NORMAL', AGEING: '< 30일' },
  { LOCAT: '신탄진공장 창고', ITEM_NM: '디스 플러스',       STOCK_QTY: 185000, AVG_DAILY: 8200,  INV_DAYS: 22.6, ZONE: 'NORMAL', AGEING: '< 30일' },
  { LOCAT: '청주공장 창고',   ITEM_NM: '더원 오렌지',       STOCK_QTY: 145000, AVG_DAILY: 4500,  INV_DAYS: 32.2, ZONE: 'WARN',   AGEING: '30-60일' },
  { LOCAT: '광주공장 창고',   ITEM_NM: '레종 (단종)',       STOCK_QTY: 28000,  AVG_DAILY: 0,     INV_DAYS: 999,  ZONE: 'EOL',    AGEING: '> 180일' },
  { LOCAT: 'Almaty공장 창고', ITEM_NM: 'TIME',              STOCK_QTY: 75000,  AVG_DAILY: 1850,  INV_DAYS: 40.5, ZONE: 'WARN',   AGEING: '30-60일' },
  { LOCAT: '국내 DC (서울)',  ITEM_NM: '에쎄 스페셜 골드',  STOCK_QTY: 280000, AVG_DAILY: 12500, INV_DAYS: 22.4, ZONE: 'NORMAL', AGEING: '< 30일' },
  { LOCAT: 'USA 창고',        ITEM_NM: 'ESSE Asian',        STOCK_QTY: 65000,  AVG_DAILY: 1400,  INV_DAYS: 46.4, ZONE: 'WARN',   AGEING: '30-60일' },
  { LOCAT: 'EU 창고',         ITEM_NM: 'THE ONE',           STOCK_QTY: 12000,  AVG_DAILY: 65,    INV_DAYS: 184.6, ZONE: 'LONG_TERM', AGEING: '> 90일' },
];

const ZONE_COLOR = { NORMAL: '#10b981', WARN: '#f59e0b', LONG_TERM: '#ef4444', EOL: '#6b7280' };

export default function KtngRptInventoryDaysMockup() {
  const [tab, setTab] = React.useState(0);
  const longTerm = ROWS.filter((r) => r.ZONE === 'LONG_TERM' || r.ZONE === 'EOL').length;
  return (
    <MockShell
      patternCode="ktng_rpt_inventory_days"
      patternLabel="KTNG — RPT 재고일수"
      layoutCategory="LAYOUT_SINGLE"
      description="5개 재고일수 리포트 묶음 (생산소/판매법인/공장 재고일수 + 장기재고 + WMS 제조일자별). 거점 × 품목 × INV_DAYS (재고/일평균출고) × AGEING ZONE."
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
          <TextField label="BASE_DT" size="small" value="2026-06-08" sx={{ width: 140 }} />
          <TextField label="LOCAT" size="small" select value="ALL" sx={{ width: 160 }}><MenuItem value="ALL">전체</MenuItem></TextField>
          <TextField label="ITEM" size="small" select value="ALL" sx={{ width: 160 }}><MenuItem value="ALL">전체</MenuItem></TextField>
          <TextField label="ZONE" size="small" select value="ALL" sx={{ width: 140 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="LONG_TERM">장기재고</MenuItem>
          </TextField>
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip icon={<WarningAmberIcon sx={{ fontSize: 14 }} />} label={`장기재고 ${longTerm}건`} size="small" color="error" variant="outlined" />
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
      </Box>

      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead><TableRow>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>LOCAT</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>ITEM_NM</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>STOCK_QTY</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>일평균 출고</TableCell>
                <TableCell sx={{ bgcolor: '#fef3c7', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>INV_DAYS</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>AGEING</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>ZONE</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover sx={{ bgcolor: r.ZONE === 'LONG_TERM' || r.ZONE === 'EOL' ? '#fef2f2' : 'transparent' }}>
                    <TableCell sx={{ fontSize: 11 }}>{r.LOCAT}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.ITEM_NM}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.STOCK_QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.AVG_DAILY === 0 ? '-' : r.AVG_DAILY.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 700, color: r.INV_DAYS > 60 ? '#ef4444' : r.INV_DAYS > 30 ? '#f59e0b' : '#10b981' }}>{r.INV_DAYS === 999 ? '∞' : r.INV_DAYS.toFixed(1)}일</TableCell>
                    <TableCell sx={{ fontSize: 11, textAlign: 'center' }}>{r.AGEING}</TableCell>
                    <TableCell sx={{ fontSize: 11, textAlign: 'center', fontWeight: 600, color: ZONE_COLOR[r.ZONE] }}>{r.ZONE}</TableCell>
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

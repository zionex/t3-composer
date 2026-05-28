import React, { useState } from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Tabs, Tab,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// CmKtng02~08 공통 패턴 — 비용 항목 1개를 상세 분석
//   02 재료비 / 03 마킹비 / 04 하이퍼인플레이션 / 05 물류비 / 06 관세 / 07 정상자재 / 08 원화가
// 비용 항목별 단가·수량·금액 + 월별 추이 + 품목별 breakdown

const COST_ITEMS = [
  { key: '재료비',  active: true,  color: '#f59e0b' },
  { key: '마킹비',  active: false, color: '#8b5cf6' },
  { key: '물류비',  active: false, color: '#ef4444' },
  { key: '관세',    active: false, color: '#06b6d4' },
  { key: '정상자재',active: false, color: '#10b981' },
  { key: '원화가',  active: false, color: '#3b82f6' },
  { key: '하이퍼',  active: false, color: '#ec4899' },
];

const COLUMNS = [
  { name: 'PROD_SITE', label: '생산지',   width: 140, align: 'left' },
  { name: 'ITEM_LV3',  label: 'ITEM_LV3', width: 130, align: 'left' },
  { name: 'PROD_QTY',  label: '생산수량', width: 100, align: 'right' },
  { name: 'UNIT_COST', label: '단가',     width: 90,  align: 'right' },
  { name: 'TOTAL_AMT', label: '금액',     width: 110, align: 'right' },
  { name: 'PER_PROD',  label: '본당',     width: 90,  align: 'right' },
  { name: 'YOY',       label: 'YoY',      width: 80,  align: 'right' },
];

const ROWS = [
  { PROD_SITE: '신탄진 공장',  ITEM_LV3: 'KING-RED', PROD_QTY: 18500000, UNIT_COST: 3.21, TOTAL_AMT: 59385.0, PER_PROD: 3.21, YOY: +2.5 },
  { PROD_SITE: '신탄진 공장',  ITEM_LV3: 'KING-BLU', PROD_QTY: 14200000, UNIT_COST: 3.42, TOTAL_AMT: 48564.0, PER_PROD: 3.42, YOY: +1.8 },
  { PROD_SITE: '대전 공장',    ITEM_LV3: 'KING-RED', PROD_QTY: 12800000, UNIT_COST: 3.18, TOTAL_AMT: 40704.0, PER_PROD: 3.18, YOY: +1.2 },
  { PROD_SITE: '대전 공장',    ITEM_LV3: 'KING-BLU', PROD_QTY:  9500000, UNIT_COST: 3.45, TOTAL_AMT: 32775.0, PER_PROD: 3.45, YOY: +2.1 },
  { PROD_SITE: '광주 공장',    ITEM_LV3: 'SLIM',     PROD_QTY:  8800000, UNIT_COST: 3.65, TOTAL_AMT: 32120.0, PER_PROD: 3.65, YOY: +3.4 },
  { PROD_SITE: '광주 공장',    ITEM_LV3: 'NGP-STICK',PROD_QTY:  6200000, UNIT_COST: 4.85, TOTAL_AMT: 30070.0, PER_PROD: 4.85, YOY: +5.2 },
  { PROD_SITE: '인도네시아',    ITEM_LV3: 'EXPORT-K', PROD_QTY: 15800000, UNIT_COST: 2.95, TOTAL_AMT: 46610.0, PER_PROD: 2.95, YOY: -0.5 },
];

const TOTAL = ROWS.reduce((acc, r) => ({
  PROD_QTY: acc.PROD_QTY + r.PROD_QTY,
  TOTAL_AMT: acc.TOTAL_AMT + r.TOTAL_AMT,
}), { PROD_QTY: 0, TOTAL_AMT: 0 });

// 월별 추이 (12개월)
const TREND = [
  { m: '06', v: 285 }, { m: '07', v: 295 }, { m: '08', v: 290 },
  { m: '09', v: 302 }, { m: '10', v: 315 }, { m: '11', v: 320 },
  { m: '12', v: 312 }, { m: '01', v: 308 }, { m: '02', v: 295 },
  { m: '03', v: 305 }, { m: '04', v: 318 }, { m: '05', v: 326 },
];

const fmtN = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 1 });
const fmtPct = (n) => (n >= 0 ? '+' : '') + n.toFixed(1) + '%';

const COST_TAB_LABELS = ['재료비 (CmKtng02)', '마킹비 (CmKtng03)', '하이퍼인플레이션 (CmKtng04)', '물류비 (CmKtng05)', '관세 (CmKtng06)', '정상자재 (CmKtng07)', '원화가 (CmKtng08)'];

export default function CmCostBreakdownMockup() {
  const [tab, setTab] = useState(0);
  return (
    <MockShell
      patternCode="ktng_cm_cost_breakdown"
      patternLabel="KTNG — 공헌이익 비용 항목 분석 (CmKtng02~08)"
      layoutCategory="LAYOUT_SINGLE"
      description="재료비 / 마킹비 / 물류비 / 관세 / 정상자재 / 원화가 / 하이퍼 인플레이션 — 단일 비용 항목의 월별 추이 + 생산지·품목별 단가/금액 breakdown 공통 패턴."
    >
      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="회계 연월" size="small" value="2026-05" sx={{ width: 130 }} />
          <TextField label="생산지 (Lvl 4)" size="small" select value="ALL" sx={{ width: 160 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="SH">신탄진</MenuItem>
            <MenuItem value="DJ">대전</MenuItem>
            <MenuItem value="GJ">광주</MenuItem>
            <MenuItem value="ID">인도네시아</MenuItem>
          </TextField>
          <TextField label="ITEM_LV3" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="RED">RED</MenuItem>
            <MenuItem value="BLU">BLU</MenuItem>
            <MenuItem value="NGP">NGP</MenuItem>
          </TextField>
          <TextField label="통화" size="small" select value="KRW" sx={{ width: 100 }}>
            <MenuItem value="KRW">KRW</MenuItem>
            <MenuItem value="USD">USD</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      {/* 비용 항목 탭 */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', px: 1.5 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="standard" scrollButtons="auto">
          {COST_ITEMS.map((c, i) => (
            <Tab key={c.key} label={c.key} sx={{ color: i === tab ? c.color : undefined, fontWeight: i === tab ? 700 : 400 }} />
          ))}
        </Tabs>
        <Box sx={{ flexGrow: 1 }} />
        <Chip size="small" label={`현재: ${COST_TAB_LABELS[tab]}`} color="warning" />
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%', overflow: 'auto' }}>
        {/* KPI */}
        <Stack direction="row" spacing={1.5}>
          {[
            { label: '총 재료비 (당월)', value: '206.2M', color: 'warning', delta: '+5.2%' },
            { label: '본당 평균 단가',   value: '3.28원', color: 'primary', delta: '+1.4%' },
            { label: '재료비율 (매출 대비)', value: '41.2%', color: 'info', delta: '+1.2pp' },
            { label: 'YoY 증감',         value: '+12.4M', color: 'error', delta: '+6.4%' },
          ].map((k) => (
            <Paper key={k.label} variant="outlined" sx={{ p: 1.5, flex: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{k.label}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: `${k.color}.main`, mt: 0.5 }}>{k.value}</Typography>
              <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>{k.delta} vs 전월</Typography>
            </Paper>
          ))}
        </Stack>

        {/* 월별 추이 mini chart */}
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>월별 {COST_ITEMS[tab].key} 추이 (단위: M원)</Typography>
            <Chip size="small" label="평균 306M / 월" color="warning" variant="outlined" />
          </Stack>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 90, mt: 1 }}>
            {TREND.map((d) => (
              <Stack key={d.m} sx={{ flex: 1, alignItems: 'center', gap: 0.3 }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 10 }}>{d.v}</Typography>
                <Box sx={{ width: '70%', backgroundColor: 'warning.light', height: `${(d.v / 350) * 70}px`, borderRadius: '2px 2px 0 0' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: 10 }}>{d.m}</Typography>
              </Stack>
            ))}
          </Box>
        </Paper>

        {/* Detail grid */}
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 200, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>생산지·품목별 {COST_ITEMS[tab].key} 상세</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Chip size="small" label={`${ROWS.length} rows`} />
            <Button size="small" startIcon={<DownloadIcon />} sx={{ ml: 1 }}>Excel</Button>
          </Box>
          <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {COLUMNS.map((c) => (
                    <TableCell key={c.name} sx={{ backgroundColor: 'grey.100', width: c.width, fontWeight: 700, textAlign: c.align }}>
                      {c.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    {COLUMNS.map((c) => {
                      const v = r[c.name];
                      const isNum = ['PROD_QTY', 'UNIT_COST', 'TOTAL_AMT', 'PER_PROD'].includes(c.name);
                      const isPct = c.name === 'YOY';
                      let display = v;
                      if (c.name === 'PROD_QTY') display = fmtN(v) + ' 본';
                      else if (c.name === 'UNIT_COST' || c.name === 'PER_PROD') display = v.toFixed(2) + '원';
                      else if (c.name === 'TOTAL_AMT') display = fmtN(v) + 'K원';
                      else if (c.name === 'YOY') display = fmtPct(v);
                      const color = isPct ? (v > 0 ? 'error.main' : 'success.main') : 'inherit';
                      return (
                        <TableCell key={c.name}
                          sx={{ textAlign: c.align,
                                fontFamily: (isNum || isPct) ? 'monospace' : 'inherit',
                                fontWeight: isPct ? 600 : 400, color }}>
                          {display}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: 'warning.light' }}>
                  <TableCell colSpan={2} sx={{ fontWeight: 700, color: 'warning.contrastText' }}>합계</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: 'warning.contrastText' }}>{fmtN(TOTAL.PROD_QTY)} 본</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: 'warning.contrastText' }}>-</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: 'warning.contrastText' }}>{fmtN(TOTAL.TOTAL_AMT)}K원</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: 'warning.contrastText' }}>{(TOTAL.TOTAL_AMT / TOTAL.PROD_QTY * 1000).toFixed(2)}원</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: 'warning.contrastText' }}>+2.4%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}

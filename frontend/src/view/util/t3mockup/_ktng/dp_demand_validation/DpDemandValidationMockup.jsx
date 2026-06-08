import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Tabs, Tab, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MockShell from '../../_shared/MockShell';

// KTNG — DP 수요 적정성 점검
//  Tab 1: UI_DP_KTNG_15 수출 수요 적정성 점검 → DpKtng15.jsx
//  Tab 2: UI_DP_KTNG_17 내수 수요 적정성 점검 → DpKtng17.jsx

const EXP_ROWS = [
  { SALES_CNTRY: '대만',     ITEM_NM: 'ESSE Asian',  HIST_AVG_3M: 14800, PLAN_QTY: 16500, DIFF_PCT: 11.5,  ZONE: 'WARN',   REMARK: '계획 +11.5% (HIST 대비)' },
  { SALES_CNTRY: '미국',     ITEM_NM: 'ESSE Asian',  HIST_AVG_3M: 41500, PLAN_QTY: 42500, DIFF_PCT: 2.4,   ZONE: 'NORMAL', REMARK: '' },
  { SALES_CNTRY: '러시아',   ITEM_NM: 'TIME',        HIST_AVG_3M: 28000, PLAN_QTY: 38500, DIFF_PCT: 37.5,  ZONE: 'ALERT',  REMARK: '계획 급증 — 검토 필요' },
  { SALES_CNTRY: '인도네시아', ITEM_NM: 'LAISON',    HIST_AVG_3M: 18500, PLAN_QTY: 17800, DIFF_PCT: -3.8,  ZONE: 'NORMAL', REMARK: '' },
  { SALES_CNTRY: '독일',     ITEM_NM: 'THE ONE',     HIST_AVG_3M: 8200,  PLAN_QTY: 5500,  DIFF_PCT: -32.9, ZONE: 'ALERT',  REMARK: '계획 급감 — 마케팅 사유 확인' },
  { SALES_CNTRY: '베트남',   ITEM_NM: 'ESSE',        HIST_AVG_3M: 22000, PLAN_QTY: 22500, DIFF_PCT: 2.3,   ZONE: 'NORMAL', REMARK: '' },
];

const DOM_ROWS = [
  { CHANNEL: '편의점', BUYER: 'BGF리테일', ITEM_NM: '에쎄 스페셜 골드',  HIST_AVG_3M: 122000, PLAN_QTY: 125000, DIFF_PCT: 2.5,   ZONE: 'NORMAL', REMARK: '' },
  { CHANNEL: '편의점', BUYER: 'GS리테일',  ITEM_NM: '에쎄 스페셜 골드',  HIST_AVG_3M: 95000,  PLAN_QTY: 96800,  DIFF_PCT: 1.9,   ZONE: 'NORMAL', REMARK: '' },
  { CHANNEL: '슈퍼',   BUYER: '이마트',    ITEM_NM: '디스 플러스',       HIST_AVG_3M: 30200,  PLAN_QTY: 32500,  DIFF_PCT: 7.6,   ZONE: 'WARN',   REMARK: '여름 캠페인 반영' },
  { CHANNEL: '편의점', BUYER: 'BGF리테일', ITEM_NM: '릴 에이스 NGP',    HIST_AVG_3M: 65000,  PLAN_QTY: 85000,  DIFF_PCT: 30.8,  ZONE: 'ALERT',  REMARK: 'NGP 신제품 런칭' },
  { CHANNEL: '슈퍼',   BUYER: '롯데마트',  ITEM_NM: '더원 오렌지',       HIST_AVG_3M: 27500,  PLAN_QTY: 28000,  DIFF_PCT: 1.8,   ZONE: 'NORMAL', REMARK: '' },
  { CHANNEL: '편의점', BUYER: '코리아세븐', ITEM_NM: '레종 (구형)',      HIST_AVG_3M: 18000,  PLAN_QTY: 0,      DIFF_PCT: -100,  ZONE: 'EOL',    REMARK: '단종 — 2026-03-31 EOP' },
];

const ZONE_COLOR = { NORMAL: '#10b981', WARN: '#f59e0b', ALERT: '#ef4444', EOL: '#6b7280' };

export default function KtngDpDemandValidationMockup() {
  const [tab, setTab] = React.useState(0);
  const rows = tab === 0 ? EXP_ROWS : DOM_ROWS;
  const alerts = rows.filter((r) => r.ZONE === 'ALERT' || r.ZONE === 'WARN').length;
  return (
    <MockShell
      patternCode="ktng_dp_demand_validation"
      patternLabel="KTNG — DP 수요 적정성 점검 (수출/내수)"
      layoutCategory="LAYOUT_SINGLE"
      description="UI_DP_KTNG_15 수출 + UI_DP_KTNG_17 내수 수요 적정성 점검. HIST 평균(3M) vs PLAN_QTY 차이율(DIFF_PCT) + ZONE 분류 (NORMAL / WARN / ALERT / EOL). 셀 데이터는 KTNG 도메인 (수출: 대만/미국/러시아/독일/베트남, 내수: 편의점/슈퍼 × 에쎄/디스/더원/NGP/단종)."
    >
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>수출 수요 적정성</span><Chip label="UI_DP_KTNG_15" size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} /></Stack>} />
          <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>내수 수요 적정성</span><Chip label="UI_DP_KTNG_17" size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} /></Stack>} />
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="BASE_YM" size="small" select value="2026-06" sx={{ width: 130 }}><MenuItem value="2026-06">2026-06</MenuItem></TextField>
          <TextField label="VERSION_ID" size="small" select value="V2026-06_SIM" sx={{ width: 170 }}><MenuItem value="V2026-06_SIM">V2026-06_SIM</MenuItem></TextField>
          {tab === 0 ? <TextField label="SALES_CNTRY" size="small" select value="ALL" sx={{ width: 160 }}><MenuItem value="ALL">전체</MenuItem></TextField>
                     : <TextField label="CHANNEL" size="small" select value="ALL" sx={{ width: 140 }}><MenuItem value="ALL">전체</MenuItem></TextField>}
          <TextField label="ZONE" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="ALERT">ALERT</MenuItem>
            <MenuItem value="WARN">WARN</MenuItem>
          </TextField>
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip icon={<WarningAmberIcon sx={{ fontSize: 14 }} />} label={`Alert ${alerts}건`} size="small" color="warning" variant="outlined" />
        <Chip label={`Total ${rows.length}건`} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
      </Box>

      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead><TableRow>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>{tab === 0 ? 'SALES_CNTRY' : 'CHANNEL'}</TableCell>
                {tab === 1 && <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>BUYER</TableCell>}
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>ITEM_NM</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>HIST_AVG_3M</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>PLAN_QTY</TableCell>
                <TableCell sx={{ bgcolor: '#fef3c7', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>DIFF_PCT</TableCell>
                <TableCell sx={{ bgcolor: '#fef3c7', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>ZONE</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>REMARK</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i} hover sx={{ bgcolor: r.ZONE === 'ALERT' ? '#fef2f2' : r.ZONE === 'WARN' ? '#fffbeb' : 'transparent' }}>
                    <TableCell sx={{ fontSize: 11 }}>{tab === 0 ? r.SALES_CNTRY : r.CHANNEL}</TableCell>
                    {tab === 1 && <TableCell sx={{ fontSize: 11 }}>{r.BUYER}</TableCell>}
                    <TableCell sx={{ fontSize: 11 }}>{r.ITEM_NM}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.HIST_AVG_3M.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 600 }}>{r.PLAN_QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 700, color: r.DIFF_PCT > 10 || r.DIFF_PCT < -10 ? '#ef4444' : r.DIFF_PCT > 5 ? '#f59e0b' : '#10b981' }}>
                      {r.DIFF_PCT > 0 ? '+' : ''}{r.DIFF_PCT.toFixed(1)}%
                    </TableCell>
                    <TableCell sx={{ fontSize: 11, textAlign: 'center', fontWeight: 600, color: ZONE_COLOR[r.ZONE] }}>{r.ZONE}</TableCell>
                    <TableCell sx={{ fontSize: 11, color: 'text.secondary' }}>{r.REMARK}</TableCell>
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

import React, { useState } from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Paper, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// RptKtng12 (재고일수-생산소), 13 (재고일수-판매법인), 14 (재고일수-공장),
// 15 (장기재고-완제품), 26 (제조일자별 재고 WMS) — 재고 관련 5개 리포트

const KPI = [
  { label: '평균 재고일수',  value: '32.6', unit: '일', delta: '+1.2일', color: 'warning' },
  { label: '장기재고 (>90일)', value: '8.4%', unit: '비중', delta: '-1.5pp', color: 'success' },
  { label: '총 재고금액',     value: '₩42.5B', unit: '',    delta: '+3.2%', color: 'primary' },
  { label: '재고 회전율',     value: '11.2',  unit: '회/년', delta: '+0.8', color: 'info' },
];

const ROWS = [
  { LOCATION: '신탄진 공장',    ITEM_LV2: '레드 시리즈', QTY: 12500000, DAYS:  18, AMT: 5625, AGE_30: 8500000, AGE_60: 3200000, AGE_90: 800000, AGE_180: 0, STATUS: 'normal' },
  { LOCATION: '신탄진 공장',    ITEM_LV2: '블루 시리즈', QTY:  8800000, DAYS:  22, AMT: 3960, AGE_30: 5200000, AGE_60: 2800000, AGE_90: 800000, AGE_180: 0, STATUS: 'normal' },
  { LOCATION: '대전 공장',      ITEM_LV2: '슬림 시리즈', QTY:  4500000, DAYS:  45, AMT: 2025, AGE_30: 1800000, AGE_60: 1500000, AGE_90: 800000, AGE_180: 400000, STATUS: 'warn' },
  { LOCATION: '광주 공장',      ITEM_LV2: 'NGP-STICK',  QTY:  2200000, DAYS:  68, AMT:  990, AGE_30:  500000, AGE_60:  600000, AGE_90: 800000, AGE_180: 300000, STATUS: 'warn' },
  { LOCATION: '서울 DC',        ITEM_LV2: '레드 시리즈', QTY:  3200000, DAYS:  12, AMT: 1440, AGE_30: 2800000, AGE_60:  400000, AGE_90:      0, AGE_180: 0, STATUS: 'good' },
  { LOCATION: '부산 DC',        ITEM_LV2: '블루 시리즈', QTY:  2400000, DAYS:  15, AMT: 1080, AGE_30: 2100000, AGE_60:  300000, AGE_90:      0, AGE_180: 0, STATUS: 'good' },
  { LOCATION: '판매법인 (인도)', ITEM_LV2: '수출 KING',  QTY:  8500000, DAYS:  62, AMT: 2295, AGE_30: 3500000, AGE_60: 2800000, AGE_90: 1800000,AGE_180: 400000, STATUS: 'warn' },
  { LOCATION: '판매법인 (몽골)', ITEM_LV2: '수출 KING',  QTY:  1200000, DAYS: 125, AMT:  324, AGE_30:  200000, AGE_60:  300000, AGE_90:  400000,AGE_180: 300000, STATUS: 'bad' },
];

const STATUS_COLOR = { good: 'success', normal: 'info', warn: 'warning', bad: 'error' };
const TOTAL = ROWS.reduce((s, r) => s + r.AGE_180, 0);

const TAB_LABELS = ['생산소 (12)', '판매법인 (13)', '공장 (14)', '장기재고 (15)', 'WMS (26)'];

export default function RptInventoryDaysMockup() {
  const [tab, setTab] = useState(0);
  return (
    <MockShell patternCode="ktng_rpt_inventory_days" patternLabel="KTNG — 재고일수 / 장기재고 리포트 (RptKtng12~15, 26)"
      layoutCategory="LAYOUT_SINGLE" description="완제품 재고일수 (생산소·판매법인·공장) + 장기재고 + 제조일자별 WMS — 거점·품목군 × 30/60/90/180일 구간.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="기준일" size="small" type="date" value="2026-05-22" InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
          <TextField label="거점 유형" size="small" select value="ALL" sx={{ width: 140 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="plant">생산소</MenuItem><MenuItem value="dc">DC</MenuItem><MenuItem value="lc">판매법인</MenuItem>
          </TextField>
          <TextField label="품목 그룹" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="TC">담배</MenuItem><MenuItem value="NGP">NGP</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>Excel</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
          {TAB_LABELS.map((l) => <Tab key={l} label={l} />)}
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        <Stack direction="row" spacing={1.5}>
          {KPI.map((k) => (
            <Paper key={k.label} variant="outlined" sx={{ p: 1.5, flex: 1 }}>
              <Typography variant="caption" color="text.secondary">{k.label}</Typography>
              <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mt: 0.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: `${k.color}.main` }}>{k.value}</Typography>
                <Typography variant="caption" color="text.secondary">{k.unit}</Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: k.delta.startsWith('-') ? 'success.main' : 'error.main', fontWeight: 600 }}>{k.delta}</Typography>
            </Paper>
          ))}
        </Stack>

        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>거점·품목군별 재고일수 + Aging — {TAB_LABELS[tab]}</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" spacing={0.5}>
              <Chip size="small" label="30일 이내" color="success" variant="outlined" />
              <Chip size="small" label="60일" color="info" variant="outlined" />
              <Chip size="small" label="90일" color="warning" variant="outlined" />
              <Chip size="small" label="180일+ (장기)" color="error" variant="outlined" />
            </Stack>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['거점','품목군','수량','재고일수','금액 (₩M)','≤30일','≤60일','≤90일','180일+','상태'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                      textAlign: ['거점','품목군'].includes(c) ? 'left' : (c === '상태' ? 'center' : 'right') }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover sx={{ backgroundColor: r.STATUS === 'bad' ? 'error.light' : 'transparent' }}>
                    <TableCell>{r.LOCATION}</TableCell>
                    <TableCell>{r.ITEM_LV2}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: r.DAYS > 90 ? 'error.main' : r.DAYS > 30 ? 'warning.main' : 'success.main' }}>
                      {r.DAYS} 일
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.AMT.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: 'success.dark' }}>{(r.AGE_30 / 1000).toFixed(1)}K</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: 'info.dark' }}>{(r.AGE_60 / 1000).toFixed(1)}K</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: 'warning.dark' }}>{(r.AGE_90 / 1000).toFixed(1)}K</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: r.AGE_180 > 0 ? 'error.dark' : 'text.disabled', fontWeight: r.AGE_180 > 0 ? 700 : 400 }}>
                      {(r.AGE_180 / 1000).toFixed(1)}K
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Chip size="small" label={r.STATUS.toUpperCase()} color={STATUS_COLOR[r.STATUS]} /></TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: 'error.light' }}>
                  <TableCell colSpan={8} sx={{ fontWeight: 700, color: 'error.contrastText' }}>장기재고 (180일+) 합계</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: 'error.contrastText' }}>{(TOTAL / 1000).toFixed(1)}K</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}

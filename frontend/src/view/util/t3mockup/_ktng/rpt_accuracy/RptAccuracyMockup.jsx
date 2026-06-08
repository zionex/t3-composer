import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Tabs, Tab, Button, LinearProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// KTNG — RPT 정확도 리포트 (6 메뉴)
//  UI_RPT_KTNG_01 Sell Out 예측 정확도
//  UI_RPT_KTNG_02 유통재고 정확도 (판매)
//  UI_RPT_KTNG_03 유통재고 정확도 (재고)
//  UI_RPT_KTNG_04 수요입력 현황
//  UI_RPT_KTNG_05 수요예측 정확도 (전사)
//  UI_RPT_KTNG_06 수요예측 정확도 (6개월)
// 대표 화면 = Sell Out 정확도 (Tab 1) — 나머지는 같은 측정 패턴

const TABS = [
  { code: '01', label: 'Sell-Out 정확도',         menu: 'UI_RPT_KTNG_01' },
  { code: '02', label: '유통재고 정확도 (판매)',  menu: 'UI_RPT_KTNG_02' },
  { code: '03', label: '유통재고 정확도 (재고)',  menu: 'UI_RPT_KTNG_03' },
  { code: '04', label: '수요입력 현황',           menu: 'UI_RPT_KTNG_04' },
  { code: '05', label: '예측 정확도 (전사)',      menu: 'UI_RPT_KTNG_05' },
  { code: '06', label: '예측 정확도 (6M)',        menu: 'UI_RPT_KTNG_06' },
];

const ROWS = [
  { SALES_ORG: '국내영업본부 (편의점)', ITEM_LV3: '에쎄', PLAN: 380000, ACTUAL: 372000, ERR_PCT: -2.1, ACC_PCT: 97.9, ZONE: 'NORMAL' },
  { SALES_ORG: '국내영업본부 (편의점)', ITEM_LV3: '디스', PLAN: 125000, ACTUAL: 132500, ERR_PCT: 6.0,  ACC_PCT: 94.0, ZONE: 'WARN' },
  { SALES_ORG: '국내영업본부 (편의점)', ITEM_LV3: '더원', PLAN: 88000,  ACTUAL: 86500,  ERR_PCT: -1.7, ACC_PCT: 98.3, ZONE: 'NORMAL' },
  { SALES_ORG: '국내영업본부 (편의점)', ITEM_LV3: '릴NGP', PLAN: 95000, ACTUAL: 78500,  ERR_PCT: -17.4, ACC_PCT: 82.6, ZONE: 'ALERT' },
  { SALES_ORG: '국내영업본부 (슈퍼)',   ITEM_LV3: '에쎄', PLAN: 142000, ACTUAL: 138500, ERR_PCT: -2.5, ACC_PCT: 97.5, ZONE: 'NORMAL' },
  { SALES_ORG: '수출본부 (아시아)',     ITEM_LV3: 'ESSE Asian', PLAN: 85000, ACTUAL: 82200, ERR_PCT: -3.3, ACC_PCT: 96.7, ZONE: 'NORMAL' },
  { SALES_ORG: '수출본부 (CIS)',        ITEM_LV3: 'TIME', PLAN: 42000, ACTUAL: 38800, ERR_PCT: -7.6, ACC_PCT: 92.4, ZONE: 'WARN' },
];

const ZONE_COLOR = { NORMAL: '#10b981', WARN: '#f59e0b', ALERT: '#ef4444' };
const overallAcc = (ROWS.reduce((s, r) => s + r.ACC_PCT, 0) / ROWS.length).toFixed(1);

export default function KtngRptAccuracyMockup() {
  const [tab, setTab] = React.useState(0);
  return (
    <MockShell
      patternCode="ktng_rpt_accuracy"
      patternLabel="KTNG — RPT 정확도 리포트 (6 메뉴)"
      layoutCategory="LAYOUT_SINGLE"
      description="6개 정확도 리포트 묶음 (Sell-Out / 유통재고 판매 / 유통재고 재고 / 수요입력 현황 / 전사 예측 / 6M 예측). 동일 측정 패턴 — PLAN vs ACTUAL × 오차율 × 정확도 × ZONE."
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
          <TextField label="BASE_YM" size="small" select value="2026-06" sx={{ width: 130 }}><MenuItem value="2026-06">2026-06</MenuItem></TextField>
          <TextField label="SALES_ORG" size="small" select value="ALL" sx={{ width: 180 }}><MenuItem value="ALL">전체</MenuItem></TextField>
          <TextField label="ITEM_LV3" size="small" select value="ALL" sx={{ width: 160 }}><MenuItem value="ALL">전체</MenuItem></TextField>
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>전체 평균 정확도</Typography>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: parseFloat(overallAcc) >= 95 ? '#10b981' : '#f59e0b', fontFamily: 'monospace' }}>{overallAcc}%</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
      </Box>

      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead><TableRow>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>SALES_ORG</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>ITEM_LV3</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>PLAN</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>ACTUAL</TableCell>
                <TableCell sx={{ bgcolor: '#fef3c7', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>ERR%</TableCell>
                <TableCell sx={{ bgcolor: '#dcfce7', fontWeight: 700, fontSize: 12, width: 200 }}>ACCURACY</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>ZONE</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontSize: 11 }}>{r.SALES_ORG}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.ITEM_LV3}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.PLAN.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 600 }}>{r.ACTUAL.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', color: Math.abs(r.ERR_PCT) > 10 ? '#ef4444' : Math.abs(r.ERR_PCT) > 5 ? '#f59e0b' : '#10b981' }}>{r.ERR_PCT > 0 ? '+' : ''}{r.ERR_PCT.toFixed(1)}%</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <LinearProgress variant="determinate" value={Math.min(r.ACC_PCT, 100)} sx={{ flex: 1, height: 8, borderRadius: 1, bgcolor: '#e5e7eb', '& .MuiLinearProgress-bar': { bgcolor: r.ACC_PCT >= 95 ? '#10b981' : r.ACC_PCT >= 85 ? '#f59e0b' : '#ef4444' } }} />
                        <Typography sx={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, width: 50, textAlign: 'right', color: r.ACC_PCT >= 95 ? '#10b981' : r.ACC_PCT >= 85 ? '#f59e0b' : '#ef4444' }}>{r.ACC_PCT.toFixed(1)}%</Typography>
                      </Stack>
                    </TableCell>
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

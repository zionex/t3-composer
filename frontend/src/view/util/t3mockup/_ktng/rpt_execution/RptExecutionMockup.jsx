import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Tabs, Tab, Button, LinearProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// KTNG — RPT 실행률 (KPI) — 5 메뉴
//  07 MP 실행률 (생산), 08 RTF 실행률 (공급), 09 RTF 실행률 (Sell-In),
//  10 연간계획 진척율 (생산), 11 연간계획 진척율 (판매)

const TABS = [
  { code: '07', label: 'MP 실행률 (생산)',         menu: 'UI_RPT_KTNG_07' },
  { code: '08', label: 'RTF 실행률 (공급)',        menu: 'UI_RPT_KTNG_08' },
  { code: '09', label: 'RTF 실행률 (Sell-In)',     menu: 'UI_RPT_KTNG_09' },
  { code: '10', label: '연간계획 진척율 (생산)',   menu: 'UI_RPT_KTNG_10' },
  { code: '11', label: '연간계획 진척율 (판매)',   menu: 'UI_RPT_KTNG_11' },
];

const ROWS = [
  { CATEGORY: '신탄진공장 - 제조',  PLAN: 950000, ACTUAL: 925000, EXEC_PCT: 97.4, TREND: '+0.5' },
  { CATEGORY: '청주공장 - 제조',    PLAN: 580000, ACTUAL: 575000, EXEC_PCT: 99.1, TREND: '+0.8' },
  { CATEGORY: '광주공장 - 제조',    PLAN: 420000, ACTUAL: 405000, EXEC_PCT: 96.4, TREND: '-0.3' },
  { CATEGORY: 'Almaty공장 - 제조',  PLAN: 285000, ACTUAL: 280000, EXEC_PCT: 98.2, TREND: '+1.2' },
  { CATEGORY: 'Jakarta공장 - 제조', PLAN: 245000, ACTUAL: 215000, EXEC_PCT: 87.8, TREND: '-2.5' },
];

export default function KtngRptExecutionMockup() {
  const [tab, setTab] = React.useState(0);
  const overall = (ROWS.reduce((s, r) => s + r.EXEC_PCT, 0) / ROWS.length).toFixed(1);
  return (
    <MockShell
      patternCode="ktng_rpt_execution"
      patternLabel="KTNG — RPT 실행률 (KPI) (5 메뉴)"
      layoutCategory="LAYOUT_SINGLE"
      description="5개 실행률 KPI 묶음 (MP 생산 / RTF 공급 / RTF Sell-In / 연간계획 생산 / 연간계획 판매). PLAN vs ACTUAL × EXEC_PCT × 전월 대비 TREND."
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
          <TextField label="CATEGORY" size="small" select value="ALL" sx={{ width: 180 }}><MenuItem value="ALL">전체</MenuItem></TextField>
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{TABS[tab].label} 전체 평균</Typography>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: parseFloat(overall) >= 95 ? '#10b981' : '#f59e0b', fontFamily: 'monospace' }}>{overall}%</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
      </Box>

      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead><TableRow>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>CATEGORY</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>PLAN</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>ACTUAL</TableCell>
                <TableCell sx={{ bgcolor: '#dcfce7', fontWeight: 700, fontSize: 12, width: 240 }}>EXEC_PCT</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>전월 대비</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontSize: 11 }}>{r.CATEGORY}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.PLAN.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 600 }}>{r.ACTUAL.toLocaleString()}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <LinearProgress variant="determinate" value={Math.min(r.EXEC_PCT, 100)} sx={{ flex: 1, height: 8, borderRadius: 1, bgcolor: '#e5e7eb', '& .MuiLinearProgress-bar': { bgcolor: r.EXEC_PCT >= 95 ? '#10b981' : r.EXEC_PCT >= 90 ? '#f59e0b' : '#ef4444' } }} />
                        <Typography sx={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, width: 55, textAlign: 'right' }}>{r.EXEC_PCT.toFixed(1)}%</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', color: r.TREND.startsWith('+') ? '#10b981' : '#ef4444', fontWeight: 600 }}>{r.TREND}%p</TableCell>
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

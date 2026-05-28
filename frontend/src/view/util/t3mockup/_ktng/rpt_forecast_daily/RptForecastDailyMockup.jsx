import React, { useState } from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Paper, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// RptKtng23 (연간 생산전망), 24 (연간 판매전망), 25 (Daily 실적)
// 연간 전망 (월별) + Daily 실적 (일별)

const MONTHLY = [
  { m: '01', plan_prod: 95, actual_prod: 92, plan_sale: 92, actual_sale: 89 },
  { m: '02', plan_prod: 98, actual_prod: 96, plan_sale: 95, actual_sale: 93 },
  { m: '03', plan_prod:102, actual_prod: 99, plan_sale: 98, actual_sale: 96 },
  { m: '04', plan_prod:105, actual_prod:103, plan_sale:101, actual_sale:100 },
  { m: '05', plan_prod:108, actual_prod:102, plan_sale:103, actual_sale: 98 },
  { m: '06', plan_prod:110, actual_prod: null, plan_sale:106, actual_sale: null },
  { m: '07', plan_prod:112, actual_prod: null, plan_sale:108, actual_sale: null },
  { m: '08', plan_prod:115, actual_prod: null, plan_sale:110, actual_sale: null },
  { m: '09', plan_prod:118, actual_prod: null, plan_sale:112, actual_sale: null },
  { m: '10', plan_prod:120, actual_prod: null, plan_sale:115, actual_sale: null },
  { m: '11', plan_prod:118, actual_prod: null, plan_sale:113, actual_sale: null },
  { m: '12', plan_prod:115, actual_prod: null, plan_sale:110, actual_sale: null },
];

const DAILY = [
  { date: '2026-05-22', plan: 3650, actual: 3580, prog: 'IN_PROGRESS' },
  { date: '2026-05-21', plan: 3620, actual: 3680, prog: 'DONE' },
  { date: '2026-05-20', plan: 3600, actual: 3550, prog: 'DONE' },
  { date: '2026-05-19', plan: 3580, actual: 3620, prog: 'DONE' },
  { date: '2026-05-18', plan:    0, actual:    0, prog: 'WEEKEND' },
  { date: '2026-05-17', plan:    0, actual:    0, prog: 'WEEKEND' },
  { date: '2026-05-16', plan: 3550, actual: 3520, prog: 'DONE' },
  { date: '2026-05-15', plan: 3520, actual: 3500, prog: 'DONE' },
];

const TOTAL_PLAN_PROD = MONTHLY.reduce((s, m) => s + m.plan_prod, 0);
const TOTAL_PLAN_SALE = MONTHLY.reduce((s, m) => s + m.plan_sale, 0);
const PROG_COLOR = { DONE: 'success', IN_PROGRESS: 'info', WEEKEND: 'default' };

export default function RptForecastDailyMockup() {
  const [tab, setTab] = useState(0);
  return (
    <MockShell patternCode="ktng_rpt_forecast_daily" patternLabel="KTNG — 연간 전망 / Daily 실적 (RptKtng23~25)"
      layoutCategory="LAYOUT_V2" description="연간 생산/판매 전망 (월별 12개월) + Daily 실적 (일별) — 상하 2분할.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="회계연도" size="small" value="2026" sx={{ width: 110 }} />
          <TextField label="범위" size="small" select value="TOTAL" sx={{ width: 130 }}>
            <MenuItem value="TOTAL">전사</MenuItem><MenuItem value="DOMESTIC">국내</MenuItem><MenuItem value="GLOBAL">GLOBAL</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>Excel</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
          <Tab label="연간 생산전망 (23)" />
          <Tab label="연간 판매전망 (24)" />
          <Tab label="Daily 실적 (25)" />
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        {/* 연간 전망 (탭 0,1 공용 — 생산/판매 모두 차트로) */}
        {(tab === 0 || tab === 1) && (
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{tab === 0 ? '연간 생산전망' : '연간 판매전망'} (월별 12개월)</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Chip size="small" label={`Σ 생산 ${TOTAL_PLAN_PROD}M`} color="primary" />
            <Chip size="small" label={`Σ 판매 ${TOTAL_PLAN_SALE}M`} color="success" sx={{ ml: 0.5 }} />
          </Box>
          <Box sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 130 }}>
              {MONTHLY.map((d) => (
                <Stack key={d.m} sx={{ flex: 1, alignItems: 'center', gap: 0.3 }}>
                  <Stack direction="row" alignItems="flex-end" sx={{ gap: 0.3, height: 90 }}>
                    <Box sx={{ width: 8, height: `${(d.plan_prod / 120) * 80}px`, backgroundColor: '#3b82f6', borderRadius: '2px 2px 0 0', opacity: d.actual_prod != null ? 0.4 : 1 }} />
                    {d.actual_prod != null && <Box sx={{ width: 8, height: `${(d.actual_prod / 120) * 80}px`, backgroundColor: '#10b981', borderRadius: '2px 2px 0 0' }} />}
                    <Box sx={{ width: 8, height: `${(d.plan_sale / 120) * 80}px`, backgroundColor: '#f59e0b', borderRadius: '2px 2px 0 0', opacity: d.actual_sale != null ? 0.4 : 1 }} />
                    {d.actual_sale != null && <Box sx={{ width: 8, height: `${(d.actual_sale / 120) * 80}px`, backgroundColor: '#ef4444', borderRadius: '2px 2px 0 0' }} />}
                  </Stack>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 10 }}>{d.m}월</Typography>
                </Stack>
              ))}
            </Box>
            <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
              <Stack direction="row" alignItems="center" spacing={0.3}><Box sx={{ width: 12, height: 8, backgroundColor: '#3b82f6' }} /><Typography variant="caption">계획 생산</Typography></Stack>
              <Stack direction="row" alignItems="center" spacing={0.3}><Box sx={{ width: 12, height: 8, backgroundColor: '#10b981' }} /><Typography variant="caption">실적 생산</Typography></Stack>
              <Stack direction="row" alignItems="center" spacing={0.3}><Box sx={{ width: 12, height: 8, backgroundColor: '#f59e0b' }} /><Typography variant="caption">계획 판매</Typography></Stack>
              <Stack direction="row" alignItems="center" spacing={0.3}><Box sx={{ width: 12, height: 8, backgroundColor: '#ef4444' }} /><Typography variant="caption">실적 판매</Typography></Stack>
            </Stack>
          </Box>
        </Paper>

        )}

        {/* Daily */}
        {tab === 2 && (
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 220 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Daily 실적 (최근 8일)</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['일자','계획','실적','달성율','GAP','상태'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, textAlign: c === '일자' ? 'left' : 'right' }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {DAILY.map((d, i) => {
                  const rate = d.plan > 0 ? (d.actual / d.plan) * 100 : null;
                  const gap = d.actual - d.plan;
                  return (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{d.date}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{d.plan.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{d.actual.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>
                        {rate == null ? '-' : rate.toFixed(1) + '%'}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>
                        {d.prog === 'WEEKEND' ? '-' : (gap > 0 ? '+' : '') + gap.toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}><Chip size="small" label={d.prog} color={PROG_COLOR[d.prog]} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        )}
      </Box>
    </MockShell>
  );
}

import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Paper, Tabs, Tab, LinearProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MockShell from '../../_shared/MockShell';

// RptKtng07 (MP 실행율 생산), 08 (RTF 실행율 공급), 09 (RTF 실행율 Sell-In),
// 10 (연간계획 진척율 생산), 11 (연간계획 진척율 판매)
// 5개 KPI 실행율 리포트 공통 — 진척 게이지 + 월별 추이 + 그리드

const KPI = [
  { label: 'MP 실행율 (생산)',    value: '93.5', target: 95, color: 'warning' },
  { label: 'RTF 실행율 (공급)',   value: '96.2', target: 95, color: 'success' },
  { label: 'RTF 실행율 (Sell-In)',value: '94.8', target: 95, color: 'warning' },
  { label: '연간계획 진척율 (생산)', value: '42.1', target: 41.6, color: 'success' }, // 5월말 진척율
  { label: '연간계획 진척율 (판매)', value: '40.8', target: 41.6, color: 'warning' },
];

// 월별 5개 지표 추이
const MONTHS = ['01','02','03','04','05'];
const SERIES_BY_MONTH = [
  { month: '01', mp:91.2, rtf_supply:94.5, rtf_sellin:93.0, annual_prod: 8.2, annual_sale: 8.0 },
  { month: '02', mp:92.0, rtf_supply:95.0, rtf_sellin:93.5, annual_prod:16.5, annual_sale:16.2 },
  { month: '03', mp:92.8, rtf_supply:95.5, rtf_sellin:94.1, annual_prod:25.0, annual_sale:24.5 },
  { month: '04', mp:93.0, rtf_supply:96.0, rtf_sellin:94.5, annual_prod:33.5, annual_sale:32.6 },
  { month: '05', mp:93.5, rtf_supply:96.2, rtf_sellin:94.8, annual_prod:42.1, annual_sale:40.8 },
];

const ORG_ROWS = [
  { ORG: '신탄진 공장', MP_EXEC: 95.2, RTF_SUPPLY: 97.1, ANNUAL: 43.5, STATUS: 'good' },
  { ORG: '대전 공장',   MP_EXEC: 92.0, RTF_SUPPLY: 95.5, ANNUAL: 41.2, STATUS: 'normal' },
  { ORG: '광주 공장',   MP_EXEC: 88.5, RTF_SUPPLY: 92.0, ANNUAL: 38.0, STATUS: 'warn' },
  { ORG: '인도네시아',  MP_EXEC: 97.0, RTF_SUPPLY: 98.5, ANNUAL: 44.1, STATUS: 'good' },
  { ORG: '국내영업1팀', MP_EXEC:  '-', RTF_SUPPLY: 96.2, ANNUAL: 41.5, STATUS: 'normal' },
  { ORG: 'NGP팀',       MP_EXEC:  '-', RTF_SUPPLY: 91.5, ANNUAL: 36.8, STATUS: 'warn' },
];

const STATUS_COLOR = { good: 'success', normal: 'info', warn: 'warning', bad: 'error' };

export default function RptExecutionMockup() {
  return (
    <MockShell patternCode="ktng_rpt_execution" patternLabel="KTNG — 실행율 / 진척율 리포트 (RptKtng07~11)"
      layoutCategory="LAYOUT_SINGLE" description="MP 실행율 / RTF 실행율 (공급·Sell-In) / 연간계획 진척율 (생산·판매) 5개 KPI 리포트 — 게이지 + 월별 추이 + 조직별 그리드.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="기간" size="small" value="2026-05" sx={{ width: 130 }} />
          <TextField label="조직" size="small" select value="ALL" sx={{ width: 150 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs value={0} variant="scrollable">
          <Tab label="MP 실행율 (07)" />
          <Tab label="RTF 공급 (08)" />
          <Tab label="RTF Sell-In (09)" />
          <Tab label="연간 진척율 생산 (10)" />
          <Tab label="연간 진척율 판매 (11)" />
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        {/* 5개 KPI 게이지 */}
        <Stack direction="row" spacing={1.5}>
          {KPI.map((k) => {
            const v = parseFloat(k.value);
            const reached = v >= k.target;
            return (
              <Paper key={k.label} variant="outlined" sx={{ p: 1.5, flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{k.label}</Typography>
                <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mt: 0.3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: `${k.color}.main` }}>{k.value}</Typography>
                  <Typography variant="caption" color="text.secondary">%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={Math.min(v, 100)} color={k.color} sx={{ height: 6, borderRadius: 1, mt: 0.5 }} />
                <Typography variant="caption" sx={{ color: reached ? 'success.main' : 'warning.main', fontWeight: 600 }}>
                  목표 {k.target}% · {reached ? '달성' : `${(k.target - v).toFixed(1)}pp 미달`}
                </Typography>
              </Paper>
            );
          })}
        </Stack>

        {/* Trend chart */}
        <Paper variant="outlined" sx={{ p: 1.5, height: 200 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>월별 실행율 추이</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 130 }}>
            {SERIES_BY_MONTH.map((d, i) => (
              <Stack key={d.month} sx={{ flex: 1, alignItems: 'center', gap: 0.3 }}>
                <Stack direction="row" alignItems="flex-end" sx={{ gap: 0.3, height: 100 }}>
                  <Box sx={{ width: 10, height: `${d.mp}%`, backgroundColor: '#3b82f6', borderRadius: '2px 2px 0 0' }} title="MP" />
                  <Box sx={{ width: 10, height: `${d.rtf_supply}%`, backgroundColor: '#10b981', borderRadius: '2px 2px 0 0' }} title="RTF 공급" />
                  <Box sx={{ width: 10, height: `${d.rtf_sellin}%`, backgroundColor: '#06b6d4', borderRadius: '2px 2px 0 0' }} title="RTF Sell-In" />
                </Stack>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 10 }}>{d.month}월</Typography>
              </Stack>
            ))}
          </Box>
        </Paper>

        {/* Org grid */}
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>조직별 실행/진척율 상세</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['조직','MP 실행 (%)','RTF 공급 (%)','연간 진척 (%)','상태'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                      textAlign: c.includes('%') ? 'right' : (c === '상태' ? 'center' : 'left') }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ORG_ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{r.ORG}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{typeof r.MP_EXEC === 'number' ? r.MP_EXEC.toFixed(1) + '%' : r.MP_EXEC}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.RTF_SUPPLY.toFixed(1)}%</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.ANNUAL.toFixed(1)}%</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Chip size="small" label={r.STATUS.toUpperCase()} color={STATUS_COLOR[r.STATUS]} /></TableCell>
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

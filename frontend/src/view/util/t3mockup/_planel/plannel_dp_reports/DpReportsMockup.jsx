import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Paper,
  Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MockShell from '../../_shared/MockShell';

// PLANNEL DP 리포트 — DpPlanVsActual / DpTrackingReport / ItemCustomerSummary / BfFeatureAnalysis 4개
// LAYOUT_V2 — 상단 KPI summary + 하단 디테일 그리드

const SUMMARY_KPIS = [
  { label: '평균 정확도',      value: '87.3%', delta: '+0.5%p', color: 'success' },
  { label: 'Bias',             value: '-1.2%', delta: 'within range', color: 'info' },
  { label: 'Worst Item MAPE',  value: '23.4%', delta: 'PCB Board v4', color: 'error' },
  { label: 'Best Item MAPE',   value: '1.8%',  delta: 'LED Module 60W', color: 'success' },
];

const ROWS = [
  { ITEM: 'LED Module 60W', CUST: 'Samsung Display', PLAN: 5000, ACTUAL: 5120, GAP: '+2.4%',  ACC: '97.6%', STATUS: 'normal' },
  { ITEM: 'LED Module 80W', CUST: 'Samsung Display', PLAN: 3000, ACTUAL: 2850, GAP: '-5.0%',  ACC: '95.0%', STATUS: 'normal' },
  { ITEM: 'LED Module 80W', CUST: 'Apple Inc.',      PLAN: 8000, ACTUAL: 6500, GAP: '-18.8%', ACC: '81.3%', STATUS: 'warn' },
  { ITEM: 'PCB Board v3',   CUST: 'LG Innotek',      PLAN: 1200, ACTUAL: 1280, GAP: '+6.7%',  ACC: '93.3%', STATUS: 'normal' },
  { ITEM: 'PCB Board v4',   CUST: 'LG Innotek',      PLAN: 800,  ACTUAL: 612,  GAP: '-23.5%', ACC: '76.5%', STATUS: 'error' },
  { ITEM: 'Aluminum HS',    CUST: 'Tesla Motors',    PLAN: 4500, ACTUAL: 4680, GAP: '+4.0%',  ACC: '96.0%', STATUS: 'normal' },
];

const statusColor = (s) => s === 'normal' ? 'success' : s === 'warn' ? 'warning' : 'error';

export default function DpReportsMockup() {
  return (
    <MockShell
      patternCode="plannel_dp_reports"
      patternLabel="PlaNEL — DP 리포트 (Plan vs Actual / Tracking / Item-Customer Summary / Feature Analysis)"
      layoutCategory="LAYOUT_V2"
      description="상단 KPI summary + 하단 Plan/Actual 디테일 그리드. 4개 DP 분석 리포트 통합."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="리포트" select size="small" value="PLAN_VS_ACTUAL" sx={{ width: 180 }}>
            <MenuItem value="PLAN_VS_ACTUAL">Plan vs Actual</MenuItem>
            <MenuItem value="TRACKING">Tracking Report</MenuItem>
            <MenuItem value="ITEM_CUSTOMER">Item-Customer Summary</MenuItem>
            <MenuItem value="FEATURE">Feature Analysis</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-04-01 ~ 2026-04-30" sx={{ width: 220 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" startIcon={<FileDownloadIcon />}>Excel</Button>
          <Button size="small" startIcon={<SearchIcon />} variant="contained">조회</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={1.5}>
          {SUMMARY_KPIS.map((k) => (
            <Paper key={k.label} elevation={0} sx={{ flex: 1, p: 1.5, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">{k.label}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: `${k.color}.main`, my: 0.3 }}>{k.value}</Typography>
              <Typography variant="caption" color="text.secondary">{k.delta}</Typography>
            </Paper>
          ))}
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Plan</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Actual</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Gap</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Accuracy</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ROWS.map((r, i) => (
              <TableRow key={i} hover>
                <TableCell>{r.ITEM}</TableCell>
                <TableCell>{r.CUST}</TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.PLAN.toLocaleString()}</TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.ACTUAL.toLocaleString()}</TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700,
                  color: r.STATUS === 'error' ? 'error.main' : r.STATUS === 'warn' ? 'warning.main' : 'success.main' }}>
                  {r.GAP}
                </TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.ACC}</TableCell>
                <TableCell><Chip label={r.STATUS.toUpperCase()} size="small" color={statusColor(r.STATUS)} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </MockShell>
  );
}

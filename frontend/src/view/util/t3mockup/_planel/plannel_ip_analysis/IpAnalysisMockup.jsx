import React from 'react';
import { Box, Stack, Chip, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, LinearProgress } from '@mui/material';
import MockShell from '../../_shared/MockShell';

// PLANNEL IP 분석 — InventoryOverview / InventoryManagementOverview / MonthlyByTrend / MonthlyByTrendDetail
//   SalesComparison / SlowMovingInventory / SupplyInventory 7개
// LAYOUT_DASHBOARD — 재고 KPI + 월간 트렌드 + Slow Moving + 공급 매칭

const KPIS = [
  { label: '총 재고 가치',  value: '24.8B', sub: 'KRW · +3.2%',     color: 'primary' },
  { label: '평균 회전율',   value: '8.4',   sub: '회/년 · target 10', color: 'warning' },
  { label: 'Slow Moving',  value: '142',   sub: '품목 · 5.8%',      color: 'warning' },
  { label: 'Obsolete',     value: '18',    sub: '품목 · 만료 예정',  color: 'error' },
  { label: 'Stockout Risk', value: '23',    sub: '품목 · 14일 내',   color: 'error' },
];

const MONTHLY_TREND = [
  { m: '2026-01', val: 23.4, turnover: 7.8 }, { m: '2026-02', val: 23.9, turnover: 8.1 },
  { m: '2026-03', val: 24.2, turnover: 8.3 }, { m: '2026-04', val: 24.5, turnover: 8.2 },
  { m: '2026-05', val: 24.8, turnover: 8.4 },
];

const SLOW_MOVING = [
  { item: 'PCB Board v4 (legacy)', stock: 8500, days: 245, lastShipped: '2025-09-12' },
  { item: 'Glass Cover (old)',     stock: 4200, days: 198, lastShipped: '2025-10-08' },
  { item: 'Plastic Housing v1',    stock: 3100, days: 187, lastShipped: '2025-11-22' },
  { item: 'Resistor 470Ω',         stock: 12000,days: 156, lastShipped: '2025-12-15' },
];

export default function IpAnalysisMockup() {
  return (
    <MockShell
      patternCode="plannel_ip_analysis"
      patternLabel="PlaNEL — IP 분석 (Inventory Overview / Trend / Slow Moving / Supply Inventory 등 7종)"
      layoutCategory="LAYOUT_DASHBOARD"
      description="재고 KPI + 월간 트렌드 + Slow Moving 디테일. IP 분석 7개 화면 통합."
    >
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
          {KPIS.map((k) => (
            <Paper key={k.label} elevation={1} sx={{ flex: 1, p: 1.5, borderLeft: '4px solid', borderLeftColor: `${k.color}.main` }}>
              <Typography variant="caption" color="text.secondary">{k.label}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: `${k.color}.main`, my: 0.3 }}>{k.value}</Typography>
              <Typography variant="caption" color="text.secondary">{k.sub}</Typography>
            </Paper>
          ))}
        </Stack>

        <Stack direction="row" spacing={2}>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>월간 재고 트렌드</Typography>
            <Stack spacing={1.5}>
              {MONTHLY_TREND.map((m) => (
                <Box key={m.m}>
                  <Stack direction="row" alignItems="center" sx={{ mb: 0.3 }}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', minWidth: 60 }}>{m.m}</Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>가치 {m.val}B · 회전 {m.turnover}</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={(m.val - 20) * 25}
                    sx={{ height: 8, borderRadius: 1 }} />
                </Box>
              ))}
            </Stack>
          </Paper>

          <Paper sx={{ p: 0, flex: 2 }}>
            <Stack direction="row" alignItems="center" sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Slow Moving / Obsolete (상위 4개)</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Chip label="142 품목 · 5.8% of total" size="small" color="warning" />
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>재고</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>경과일</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>최종 출하</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {SLOW_MOVING.map((r) => (
                  <TableRow key={r.item} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{r.item}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.stock.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700,
                      color: r.days > 200 ? 'error.main' : 'warning.main' }}>{r.days}일</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.lastShipped}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Stack>
      </Box>
    </MockShell>
  );
}

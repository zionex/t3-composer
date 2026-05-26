import React from 'react';
import { Box, Stack, Chip, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import MockShell from '../../_shared/MockShell';

// PLANNEL RP 리포트 — RpOrderList / RpPlanVsActual / RpMonthlyTrend / ProcurementStatusReport / ExpiredInventory 5개
// LAYOUT_DASHBOARD — KPI cards + 발주 현황 + 월간 트렌드 + 만료 재고

const KPIS = [
  { label: '월간 발주 건수', value: '342',    sub: '+18 vs 전월', color: 'primary' },
  { label: '발주 금액',     value: '4.8B',    sub: 'KRW · +12%',   color: 'success' },
  { label: '조달 진행',     value: '78%',     sub: '264/342',     color: 'info' },
  { label: '만료 예정',     value: '14',      sub: '30일 이내',    color: 'warning' },
  { label: 'Fill Rate',    value: '94.2%',   sub: '+0.8%p',      color: 'success' },
];

const ORDER_ROWS = [
  { po: 'PO-2026-04829', supplier: 'Supplier-K012', item: 'PCB Board Rev.3',    qty: 12000, amt: 360000000, status: 'IN_TRANSIT' },
  { po: 'PO-2026-04830', supplier: 'Supplier-J005', item: 'Aluminum Heatsink',  qty:  8000, amt: 120000000, status: 'IN_TRANSIT' },
  { po: 'PO-2026-04831', supplier: 'Supplier-J005', item: 'Plastic Housing',    qty: 15000, amt: 225000000, status: 'OPEN' },
  { po: 'PO-2026-04832', supplier: 'Supplier-U003', item: 'Glass Cover',        qty:  4500, amt:  90000000, status: 'CONFIRMED' },
];

const MONTHLY_TREND = [
  { m: '2026-01', orders: 285, fillRate: 92.1 }, { m: '2026-02', orders: 312, fillRate: 93.4 },
  { m: '2026-03', orders: 298, fillRate: 91.8 }, { m: '2026-04', orders: 324, fillRate: 93.8 },
  { m: '2026-05', orders: 342, fillRate: 94.2 },
];

const statusColor = (s) => s === 'CONFIRMED' || s === 'IN_TRANSIT' ? 'success' : 'warning';

export default function RpReportsMockup() {
  return (
    <MockShell
      patternCode="plannel_rp_reports"
      patternLabel="PlaNEL — RP 리포트 (Order List / Plan vs Actual / Monthly Trend / Procurement / Expired Inventory)"
      layoutCategory="LAYOUT_DASHBOARD"
      description="KPI cards + 발주 현황 + 월간 트렌드 + 조달 / 만료 통합 대시보드."
    >
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
          {KPIS.map((k) => (
            <Paper key={k.label} elevation={1} sx={{ flex: 1, p: 1.5, borderTop: '3px solid', borderTopColor: `${k.color}.main` }}>
              <Typography variant="caption" color="text.secondary">{k.label}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: `${k.color}.main`, my: 0.3 }}>{k.value}</Typography>
              <Typography variant="caption" color="text.secondary">{k.sub}</Typography>
            </Paper>
          ))}
        </Stack>

        <Stack direction="row" spacing={2}>
          <Paper sx={{ p: 0, flex: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              최근 발주 현황
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 700 }}>PO</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>공급사</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>수량</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>금액 (KRW)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ORDER_ROWS.map((r) => (
                  <TableRow key={r.po} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.po}</TableCell>
                    <TableCell>{r.supplier}</TableCell>
                    <TableCell>{r.item}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.qty.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{(r.amt / 1e6).toFixed(0)}M</TableCell>
                    <TableCell><Chip label={r.status} size="small" color={statusColor(r.status)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>5개월 트렌드</Typography>
            <Stack spacing={1.5}>
              {MONTHLY_TREND.map((m) => (
                <Box key={m.m}>
                  <Stack direction="row" alignItems="center" sx={{ mb: 0.3 }}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', minWidth: 60 }}>{m.m}</Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{m.orders} / {m.fillRate}%</Typography>
                  </Stack>
                  <Box sx={{ height: 6, backgroundColor: 'grey.200', borderRadius: 1 }}>
                    <Box sx={{ width: `${m.fillRate}%`, height: '100%', backgroundColor: 'success.main', borderRadius: 1 }} />
                  </Box>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </MockShell>
  );
}

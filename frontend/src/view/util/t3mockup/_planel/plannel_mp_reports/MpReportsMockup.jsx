import React from 'react';
import { Box, Stack, Chip, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, LinearProgress } from '@mui/material';
import MockShell from '../../_shared/MockShell';

// PLANNEL MP 리포트 — MrpOrderList / MrpReport / OrderTracking / ResourceProductionPlan 4개
// LAYOUT_DASHBOARD — MRP KPI + 발주 현황 + 자원 가동률

const KPIS = [
  { label: 'MRP 발주',     value: '482',   sub: '주간',         color: 'primary' },
  { label: '추적 진행',     value: '76%',   sub: '367/482',     color: 'info' },
  { label: '평균 가동률',   value: '84.5%', sub: '+2.1%p',       color: 'success' },
  { label: '병목 설비',     value: '3',     sub: 'WC-K01/03/05', color: 'warning' },
];

const MRP_ROWS = [
  { wo: 'WO-2026-051001', item: 'LED Module 60W', wc: 'WC-K01', qty: 5000,  start: '5/27', end: '5/30', status: 'IN_PROGRESS' },
  { wo: 'WO-2026-051002', item: 'LED Module 80W', wc: 'WC-K01', qty: 3000,  start: '5/30', end: '6/02', status: 'SCHEDULED' },
  { wo: 'WO-2026-051003', item: 'PCB Board v3',   wc: 'WC-K03', qty: 12000, start: '5/28', end: '6/05', status: 'IN_PROGRESS' },
  { wo: 'WO-2026-051004', item: 'Aluminum HS',    wc: 'WC-K02', qty: 8000,  start: '5/26', end: '5/29', status: 'COMPLETED' },
];

const RESOURCE_UTIL = [
  { wc: 'WC-K01 (Assembly)',    util: 108, status: 'over' },
  { wc: 'WC-K02 (Heatsink)',    util:  82, status: 'normal' },
  { wc: 'WC-K03 (PCB Mount)',   util: 104, status: 'over' },
  { wc: 'WC-K04 (Testing)',     util:  76, status: 'normal' },
  { wc: 'WC-K05 (Packaging)',   util: 101, status: 'over' },
];

const statusColor = (s) => s === 'COMPLETED' ? 'success' : s === 'IN_PROGRESS' ? 'primary' : 'default';

export default function MpReportsMockup() {
  return (
    <MockShell
      patternCode="plannel_mp_reports"
      patternLabel="PlaNEL — MP 리포트 (MRP Order List / MRP Report / Order Tracking / Resource Production Plan)"
      layoutCategory="LAYOUT_DASHBOARD"
      description="MRP KPI + 발주 현황 + 자원 가동률. 생산 계획 운영 대시보드."
    >
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
          {KPIS.map((k) => (
            <Paper key={k.label} elevation={1} sx={{ flex: 1, p: 2, borderTop: '3px solid', borderTopColor: `${k.color}.main` }}>
              <Typography variant="caption" color="text.secondary">{k.label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: `${k.color}.main`, my: 0.5 }}>{k.value}</Typography>
              <Typography variant="caption" color="text.secondary">{k.sub}</Typography>
            </Paper>
          ))}
        </Stack>

        <Stack direction="row" spacing={2}>
          <Paper sx={{ p: 0, flex: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              MRP Work Order 현황
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 700 }}>WO</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>WC</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>수량</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>기간</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {MRP_ROWS.map((r) => (
                  <TableRow key={r.wo} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.wo}</TableCell>
                    <TableCell>{r.item}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.wc}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.qty.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.start} ~ {r.end}</TableCell>
                    <TableCell><Chip label={r.status} size="small" color={statusColor(r.status)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>자원 가동률</Typography>
            <Stack spacing={1.5}>
              {RESOURCE_UTIL.map((r) => (
                <Box key={r.wc}>
                  <Stack direction="row" alignItems="center" sx={{ mb: 0.3 }}>
                    <Typography variant="body2" sx={{ fontSize: 12 }}>{r.wc}</Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700,
                      color: r.status === 'over' ? 'error.main' : 'success.main' }}>{r.util}%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={Math.min(r.util, 100)}
                    color={r.status === 'over' ? 'error' : 'success'} sx={{ height: 6, borderRadius: 1 }} />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </MockShell>
  );
}

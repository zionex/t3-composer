import React from 'react';
import { Box, Stack, Chip, Typography, Paper,
  Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import MockShell from '../../_shared/MockShell';

// PLANNEL RP 워크벤치 — RpWorkbench 1개
// LAYOUT_DASHBOARD — KPI cards + 발주 추천 그리드 + 분배 차트

const KPIS = [
  { label: '발주 추천',   value: '142',     unit: '건', color: 'primary' },
  { label: '재고 부족',   value: '8',       unit: '품목', color: 'error' },
  { label: '과잉 재고',   value: '23',      unit: '품목', color: 'warning' },
  { label: 'Fill Rate',  value: '94.2',    unit: '%', color: 'success' },
  { label: '평균 회전율', value: '8.4',     unit: '회/년', color: 'info' },
];

const RECOMMENDATIONS = [
  { from: 'WH-K01 (Central)', to: 'WH-K02 (Seoul)', item: 'LED Module 60W',    qty: 5000,  priority: 'urgent', eta: '5/28' },
  { from: 'WH-K01 (Central)', to: 'WH-K03 (Busan)', item: 'LED Module 80W',    qty: 3500,  priority: 'urgent', eta: '5/29' },
  { from: 'Supplier (S-J005)','to': 'WH-K01',        item: 'PCB Board Rev.3',   qty: 12000, priority: 'normal', eta: '6/05' },
  { from: 'WH-K01 (Central)', to: 'WH-K02 (Seoul)', item: 'Aluminum Heatsink', qty: 8000,  priority: 'normal', eta: '6/01' },
  { from: 'Supplier (S-J005)','to': 'WH-K01',        item: 'Plastic Housing',   qty: 15000, priority: 'low',    eta: '6/12' },
];

const priColor = (p) => p === 'urgent' ? 'error' : p === 'normal' ? 'primary' : 'default';

export default function RpWorkbenchMockup() {
  return (
    <MockShell
      patternCode="plannel_rp_workbench"
      patternLabel="PlaNEL — RP 워크벤치 (RP Workbench)"
      layoutCategory="LAYOUT_DASHBOARD"
      description="KPI cards + 발주 추천 그리드. 보충 의사결정 통합 워크벤치."
    >
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
          {KPIS.map((k) => (
            <Paper key={k.label} elevation={1} sx={{ flex: 1, p: 1.5, borderTop: '3px solid', borderTopColor: `${k.color}.main` }}>
              <Typography variant="caption" color="text.secondary">{k.label}</Typography>
              <Stack direction="row" alignItems="baseline" spacing={0.5}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: `${k.color}.main` }}>{k.value}</Typography>
                <Typography variant="caption" color="text.secondary">{k.unit}</Typography>
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Paper sx={{ p: 0 }}>
          <Stack direction="row" alignItems="center" sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>발주 / 이동 추천 (상위 우선순위)</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Chip label="2건 긴급 · 2건 일반 · 1건 저순위" size="small" />
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>From</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>To</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>수량</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>우선순위</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ETA</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {RECOMMENDATIONS.map((r, i) => (
                <TableRow key={i} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.from}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.to}</TableCell>
                  <TableCell>{r.item}</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{r.qty.toLocaleString()}</TableCell>
                  <TableCell><Chip label={r.priority.toUpperCase()} size="small" color={priColor(r.priority)} /></TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{r.eta}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </MockShell>
  );
}

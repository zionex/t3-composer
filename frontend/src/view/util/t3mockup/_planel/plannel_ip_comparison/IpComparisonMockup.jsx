import React from 'react';
import { Box, Stack, Chip, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import MockShell from '../../_shared/MockShell';

// PLANNEL IP 비교 — IPComparisonDashboard 1개
// LAYOUT_DASHBOARD — 시나리오 비교 대시보드 (Baseline vs Sim-A vs Sim-B)

const COMPARE_KPIS = [
  { label: '재고 가치 (B)',     base: 24.8, simA: 21.2, simB: 23.1, color: 'success' },
  { label: 'Fill Rate (%)',    base: 92.4, simA: 96.1, simB: 96.8, color: 'success' },
  { label: '회전율 (회/년)',    base: 8.4,  simA: 9.8,  simB: 9.6,  color: 'success' },
  { label: '결품 일수/년',     base: 18,   simA: 6,    simB: 4,    color: 'success' },
  { label: '안전재고 일수',    base: 14,   simA: 12,   simB: 16,   color: 'info' },
  { label: 'Slow Moving (%)', base: 5.8,  simA: 4.2,  simB: 3.8,  color: 'success' },
];

const DETAIL_ITEMS = [
  { item: 'LED Module 60W',  base: 5000, simA: 4200, simB: 4500, recommend: 'A' },
  { item: 'LED Module 80W',  base: 3000, simA: 2400, simB: 2700, recommend: 'B' },
  { item: 'PCB Board v3',    base: 8000, simA: 6500, simB: 7000, recommend: 'A' },
  { item: 'Aluminum HS',     base: 6500, simA: 5800, simB: 6100, recommend: 'B' },
];

export default function IpComparisonMockup() {
  return (
    <MockShell
      patternCode="plannel_ip_comparison"
      patternLabel="PlaNEL — IP 시나리오 비교 (IP Comparison Dashboard)"
      layoutCategory="LAYOUT_DASHBOARD"
      description="Baseline vs Sim-A vs Sim-B 비교 대시보드. KPI 매트릭스 + 품목별 추천."
    >
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <CompareArrowsIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>3-Scenario Comparison Dashboard</Typography>
          <Chip label="Baseline" sx={{ ml: 1 }} />
          <Chip label="Sim-A (재고 절감)" color="info" />
          <Chip label="Sim-B (Fill Rate Up)" color="success" />
        </Stack>

        <Paper sx={{ p: 0, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            KPI 비교 매트릭스
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>Metric</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Baseline</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right', backgroundColor: 'info.50' }}>Sim-A</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right', backgroundColor: 'success.50' }}>Sim-B</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Winner</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {COMPARE_KPIS.map((k) => {
                const aBetter = Math.abs(k.simA - k.base) > Math.abs(k.simB - k.base) ? true : false;
                return (
                  <TableRow key={k.label} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{k.label}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{k.base}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', backgroundColor: 'info.50', fontWeight: aBetter ? 700 : 400 }}>{k.simA}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', backgroundColor: 'success.50', fontWeight: !aBetter ? 700 : 400 }}>{k.simB}</TableCell>
                    <TableCell><Chip label={aBetter ? 'Sim-A' : 'Sim-B'} size="small"
                      color={aBetter ? 'info' : 'success'} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>

        <Paper sx={{ p: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            품목별 안전재고 — 추천 시나리오
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Baseline</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Sim-A</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Sim-B</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>추천</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {DETAIL_ITEMS.map((r) => (
                <TableRow key={r.item} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{r.item}</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.base.toLocaleString()}</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: r.recommend === 'A' ? 700 : 400 }}>{r.simA.toLocaleString()}</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: r.recommend === 'B' ? 700 : 400 }}>{r.simB.toLocaleString()}</TableCell>
                  <TableCell><Chip label={`Sim-${r.recommend}`} size="small" color={r.recommend === 'A' ? 'info' : 'success'} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </MockShell>
  );
}

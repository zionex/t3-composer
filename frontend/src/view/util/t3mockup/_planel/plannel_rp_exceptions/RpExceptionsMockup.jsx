import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Paper,
  Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import MockShell from '../../_shared/MockShell';

// PLANNEL RP 예외 — InventoryExceptions / InventoryExceptionsDetail / PsiSimulation 3개
// LAYOUT_V2 — 상단 예외 요약 KPI + 하단 예외 상세 그리드

const EXCEPTION_SUMMARY = [
  { type: 'STOCKOUT',     count: 8,  color: 'error',   label: '결품' },
  { type: 'OVERSTOCK',    count: 23, color: 'warning', label: '과잉' },
  { type: 'LATE_DELIVERY',count: 5,  color: 'error',   label: '납기 지연' },
  { type: 'PSI_VIOLATION',count: 12, color: 'warning', label: 'PSI 위반' },
];

const EXC_ROWS = [
  { item: 'PCB Board v3',   wh: 'WH-K02 (Seoul)', type: 'STOCKOUT',      cur: 0,    safety: 5000,  expected: 'W34', sim: 'A' },
  { item: 'LED Module 80W', wh: 'WH-K03 (Busan)', type: 'STOCKOUT',      cur: 120,  safety: 3000,  expected: 'W35', sim: 'A' },
  { item: 'Aluminum HS',    wh: 'WH-K01',         type: 'OVERSTOCK',     cur: 12000,safety: 4500,  expected: '-',   sim: 'B' },
  { item: 'Plastic Housing','wh': 'WH-K02',       type: 'OVERSTOCK',     cur:  8500,safety: 3000,  expected: '-',   sim: 'B' },
  { item: 'Glass Cover',    wh: 'WH-J01',         type: 'LATE_DELIVERY', cur: 1200, safety: 2500,  expected: 'W36', sim: 'C' },
  { item: 'LED Module 60W', wh: 'WH-U01',         type: 'PSI_VIOLATION', cur: 2800, safety: 5000,  expected: '-',   sim: 'C' },
];

const typeColor = (t) => t === 'STOCKOUT' || t === 'LATE_DELIVERY' ? 'error' : 'warning';

export default function RpExceptionsMockup() {
  return (
    <MockShell
      patternCode="plannel_rp_exceptions"
      patternLabel="PlaNEL — RP 예외 (Inventory Exceptions / Detail / PSI Simulation)"
      layoutCategory="LAYOUT_V2"
      description="상단 예외 KPI summary + 하단 디테일 그리드. 결품/과잉/납기지연/PSI 위반 통합."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField label="예외 유형" select size="small" value="ALL" sx={{ width: 150 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="STOCKOUT">결품</MenuItem>
            <MenuItem value="OVERSTOCK">과잉</MenuItem>
            <MenuItem value="LATE_DELIVERY">납기 지연</MenuItem>
            <MenuItem value="PSI_VIOLATION">PSI 위반</MenuItem>
          </TextField>
          <TextField label="창고" select size="small" value="ALL" sx={{ width: 150 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="WH_K">KR 창고</MenuItem>
            <MenuItem value="WH_U">US 창고</MenuItem>
            <MenuItem value="WH_J">JP 창고</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" startIcon={<PlayCircleIcon />} variant="contained">PSI 시뮬 실행</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={1.5}>
          {EXCEPTION_SUMMARY.map((s) => (
            <Paper key={s.type} elevation={1} sx={{ flex: 1, p: 2, borderLeft: '4px solid', borderLeftColor: `${s.color}.main` }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <WarningIcon color={s.color} sx={{ fontSize: 18 }} />
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              </Stack>
              <Typography variant="h4" sx={{ fontWeight: 700, color: `${s.color}.main`, mt: 0.5 }}>{s.count}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{s.type}</Typography>
            </Paper>
          ))}
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Warehouse</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>유형</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>현재 재고</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>안전재고</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>예상 주차</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>시뮬 시나리오</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {EXC_ROWS.map((r, i) => (
              <TableRow key={i} hover>
                <TableCell sx={{ fontWeight: 600 }}>{r.item}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.wh}</TableCell>
                <TableCell><Chip label={r.type} size="small" color={typeColor(r.type)} /></TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace',
                  color: r.cur < r.safety ? 'error.main' : 'warning.main', fontWeight: 700 }}>
                  {r.cur.toLocaleString()}
                </TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.safety.toLocaleString()}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{r.expected}</TableCell>
                <TableCell><Chip label={`SIM-${r.sim}`} size="small" variant="outlined" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </MockShell>
  );
}

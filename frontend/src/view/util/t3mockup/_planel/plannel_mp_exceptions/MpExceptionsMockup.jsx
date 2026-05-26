import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Paper,
  Table, TableHead, TableBody, TableRow, TableCell, LinearProgress } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import MockShell from '../../_shared/MockShell';

// PLANNEL MP 예외 — ProductionExceptions / ProductionExceptionsDetail / MpPsiSimulation 3개
// LAYOUT_V2 — 상단 예외 KPI + 하단 생산 위반 디테일

const EXC_KPIS = [
  { type: 'CAPACITY_OVER',  count: 4, label: '설비 과부하', color: 'error' },
  { type: 'MATERIAL_SHORT', count: 6, label: '자재 부족',   color: 'error' },
  { type: 'LATE_BATCH',     count: 3, label: '납기 지연',   color: 'warning' },
  { type: 'PEGGING_VIOL',   count: 2, label: 'Pegging 위반', color: 'warning' },
];

const EXC_ROWS = [
  { wc: 'Workcenter-K01', item: 'LED Module 60W',    week: 'W34', planned: 8500, capacity: 7800, util: 108, type: 'CAPACITY_OVER' },
  { wc: 'Workcenter-K03', item: 'PCB Board v3',      week: 'W34', planned: 5200, capacity: 5000, util: 104, type: 'CAPACITY_OVER' },
  { wc: 'Workcenter-K01', item: 'LED Module 80W',    week: 'W35', planned: 6800, capacity: 7800, util: 87,  type: 'MATERIAL_SHORT' },
  { wc: 'Workcenter-K02', item: 'Aluminum Heatsink', week: 'W36', planned: 4500, capacity: 5500, util: 82,  type: 'LATE_BATCH' },
  { wc: 'Workcenter-K03', item: 'PCB Board v4',      week: 'W37', planned: 2100, capacity: 5000, util: 42,  type: 'PEGGING_VIOL' },
];

const typeColor = (t) => t.includes('OVER') || t.includes('SHORT') ? 'error' : 'warning';

export default function MpExceptionsMockup() {
  return (
    <MockShell
      patternCode="plannel_mp_exceptions"
      patternLabel="PlaNEL — MP 예외 (Production Exceptions / Detail / PSI Simulation)"
      layoutCategory="LAYOUT_V2"
      description="상단 생산 예외 KPI + 하단 워크센터 위반 디테일. 설비 과부하/자재 부족/납기 지연/Pegging."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField label="예외 유형" select size="small" value="ALL" sx={{ width: 170 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="CAPACITY">설비 과부하</MenuItem>
            <MenuItem value="MATERIAL">자재 부족</MenuItem>
            <MenuItem value="LATE">납기 지연</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="W34 ~ W37" sx={{ width: 140 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" startIcon={<PlayCircleIcon />} variant="contained">MP-PSI 시뮬</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={1.5}>
          {EXC_KPIS.map((s) => (
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
              <TableCell sx={{ fontWeight: 700 }}>Workcenter</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>주차</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>계획 (EA)</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Capacity</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>부하율</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>유형</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {EXC_ROWS.map((r, i) => (
              <TableRow key={i} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.wc}</TableCell>
                <TableCell>{r.item}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{r.week}</TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.planned.toLocaleString()}</TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.capacity.toLocaleString()}</TableCell>
                <TableCell sx={{ minWidth: 140 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <LinearProgress variant="determinate" value={Math.min(r.util, 100)}
                      color={r.util > 100 ? 'error' : r.util > 90 ? 'warning' : 'success'}
                      sx={{ flex: 1, height: 8, borderRadius: 1 }} />
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700,
                      color: r.util > 100 ? 'error.main' : 'inherit' }}>{r.util}%</Typography>
                  </Stack>
                </TableCell>
                <TableCell><Chip label={r.type} size="small" color={typeColor(r.type)} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </MockShell>
  );
}

import React from 'react';
import {
  Box, Card, CardContent, Stack, Typography, Chip, Grid, Button, Divider,
  Table, TableHead, TableBody, TableRow, TableCell, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';

import MockShell from '../_shared/MockShell';

// 간트 작업 (10일치, 라인별)
const LINES = ['LINE-A1', 'LINE-A2', 'LINE-B1', 'LINE-C1'];
const TASKS = [
  { line: 'LINE-A1', start: 0, end: 3, label: 'LED 60W (WO-7771)', color: '#5281b3', conflict: false },
  { line: 'LINE-A1', start: 3, end: 5, label: 'LED 80W (WO-7772)', color: '#5281b3', conflict: false },
  { line: 'LINE-A1', start: 5, end: 8, label: 'LED 100W (WO-7773)', color: '#fa7d5b', conflict: true },
  { line: 'LINE-A2', start: 1, end: 4, label: 'LED 80W (WO-7774)', color: '#2a9d8f', conflict: false },
  { line: 'LINE-A2', start: 4, end: 7, label: 'LED 100W (WO-7775)', color: '#2a9d8f', conflict: false },
  { line: 'LINE-B1', start: 0, end: 4, label: 'Camera IMX-700', color: '#8b5cf6', conflict: false },
  { line: 'LINE-B1', start: 4, end: 9, label: 'Camera IMX-800', color: '#8b5cf6', conflict: false },
  { line: 'LINE-C1', start: 2, end: 6, label: 'Battery 18650', color: '#f59e0b', conflict: false },
  { line: 'LINE-C1', start: 6, end: 10, label: 'Battery 21700', color: '#f59e0b', conflict: false },
];

const EDIT_ROWS = [
  { wo: 'WO-2026-7771', item: 'LED 60W',  line: 'LINE-A1', startDt: '04/14', endDt: '04/16', qty: 1200, status: 'PLANNED' },
  { wo: 'WO-2026-7772', item: 'LED 80W',  line: 'LINE-A1', startDt: '04/17', endDt: '04/18', qty: 800,  status: 'PLANNED' },
  { wo: 'WO-2026-7773', item: 'LED 100W', line: 'LINE-A1', startDt: '04/19', endDt: '04/21', qty: 600,  status: 'CONFLICT' },
  { wo: 'WO-2026-7774', item: 'LED 80W',  line: 'LINE-A2', startDt: '04/15', endDt: '04/17', qty: 800,  status: 'PLANNED' },
  { wo: 'WO-2026-7775', item: 'LED 100W', line: 'LINE-A2', startDt: '04/18', endDt: '04/20', qty: 600,  status: 'PLANNED' },
];

const STATUS_COLOR = { PLANNED: 'default', CONFLICT: 'error', ADJUSTED: 'warning' };

function GanttRow({ line, tasks, totalDays = 10 }) {
  const cellW = 100 / totalDays;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: 28, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" sx={{ width: 80, fontFamily: 'monospace', fontWeight: 600 }}>{line}</Typography>
      <Box sx={{ flex: 1, position: 'relative', height: 24, bgcolor: 'grey.50', borderRadius: 0.5 }}>
        {/* day grid lines */}
        {Array.from({ length: totalDays }).map((_, i) => (
          <Box key={i} sx={{ position: 'absolute', top: 0, bottom: 0, left: `${i * cellW}%`, width: 1, bgcolor: 'grey.200' }} />
        ))}
        {/* tasks */}
        {tasks.filter((t) => t.line === line).map((t, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute', top: 2, bottom: 2,
              left: `${t.start * cellW}%`, width: `${(t.end - t.start) * cellW}%`,
              bgcolor: t.color, opacity: t.conflict ? 0.7 : 0.95,
              borderRadius: 0.5,
              border: t.conflict ? '2px solid #ef4444' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'grab',
              fontSize: 10, color: 'white', fontWeight: 600,
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            }}
          >
            {t.label}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function FpSimulationEditMockup() {
  return (
    <MockShell
      patternCode="fp_simulation_edit"
      patternLabel="FP Simulation Edit — 생산계획 보정"
      layoutCategory="LAYOUT_PLANEDIT"
      description="간트 + 편집 가능 그리드 + 시뮬·적용. AdjustmentGantt · AdjustmentGrid · SimulationAdjustment"
    >
      <Box sx={{ p: 2 }}>
        {/* 헤더 */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>시뮬 버전</InputLabel>
                <Select label="시뮬 버전" value="FP_V20260413_D" onChange={() => {}}>
                  <MenuItem value="FP_V20260413_D">FP_V20260413_D (Adjustment)</MenuItem>
                </Select>
              </FormControl>
              <Chip size="small" label="DRAFT (보정 중)" color="warning" />
              <Chip size="small" label="충돌 1건" color="error" variant="outlined" />
              <Box sx={{ flex: 1 }} />
              <Button size="small" variant="outlined" startIcon={<RestoreIcon />}>초기화</Button>
              <Button size="small" variant="outlined" startIcon={<PlayArrowIcon />}>재시뮬</Button>
              <Button size="small" variant="contained" startIcon={<SaveIcon />}>저장 후 확정</Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Gantt */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>라인별 생산 일정 (10일) — 막대 드래그로 보정</Typography>
              <Stack direction="row" spacing={1}>
                <Chip size="small" label="정상" sx={{ bgcolor: '#5281b3', color: 'white', fontSize: 10, height: 18 }} />
                <Chip size="small" label="충돌" sx={{ bgcolor: '#fa7d5b', color: 'white', fontSize: 10, height: 18 }} />
              </Stack>
            </Stack>

            {/* day header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: 24, borderBottom: '2px solid', borderColor: 'divider' }}>
              <Box sx={{ width: 80 }} />
              <Box sx={{ flex: 1, display: 'flex' }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <Box key={i} sx={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>
                    4/{(14 + i).toString()}
                  </Box>
                ))}
              </Box>
            </Box>
            {LINES.map((line) => <GanttRow key={line} line={line} tasks={TASKS} />)}
          </CardContent>
        </Card>

        {/* 편집 그리드 */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>WO 편집 (수량/일정 조정)</Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: 'grey.50', fontWeight: 700 } }}>
                  <TableCell>WO</TableCell>
                  <TableCell>품목</TableCell>
                  <TableCell>라인</TableCell>
                  <TableCell>시작</TableCell>
                  <TableCell>종료</TableCell>
                  <TableCell align="right">수량</TableCell>
                  <TableCell>상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {EDIT_ROWS.map((r, i) => (
                  <TableRow key={i} hover sx={{ bgcolor: r.status === 'CONFLICT' ? 'error.lighter' : 'transparent' }}>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.wo}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{r.item}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>{r.line}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      <input type="text" defaultValue={r.startDt} style={{ width: 60, border: '1px solid #d1d5db', borderRadius: 4, padding: '2px 4px', fontFamily: 'monospace' }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      <input type="text" defaultValue={r.endDt} style={{ width: 60, border: '1px solid #d1d5db', borderRadius: 4, padding: '2px 4px', fontFamily: 'monospace' }} />
                    </TableCell>
                    <TableCell align="right">
                      <input type="text" defaultValue={r.qty} style={{ width: 60, border: '1px solid #d1d5db', borderRadius: 4, padding: '2px 4px', fontFamily: 'monospace', textAlign: 'right' }} />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={r.status} color={STATUS_COLOR[r.status]} sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" color="text.secondary">
              간트 막대 드래그 또는 그리드 셀 편집 → 재시뮬 → 충돌 0 확인 후 저장 확정
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}

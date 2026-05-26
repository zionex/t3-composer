import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Switch,
  Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import MockShell from '../../_shared/MockShell';

// PLANNEL Schedule — ScheduleSettings / ScheduleHistory 2개
// LAYOUT_SINGLE — 스케줄러 설정 + 실행 이력

const SCHEDULES = [
  { name: 'BF 재학습',         cron: '0 2 * * 1',   next: '2026-06-01 02:00', last: 'OK',   on: true },
  { name: 'DP 자동 집계',       cron: '0 6 * * *',   next: '2026-05-27 06:00', last: 'OK',   on: true },
  { name: 'RP 엔진 실행',       cron: '0 4 * * 1-5', next: '2026-05-27 04:00', last: 'OK',   on: true },
  { name: 'MP 엔진 실행',       cron: '0 5 * * 1-5', next: '2026-05-27 05:00', last: 'FAIL', on: true },
  { name: 'IP 일일 집계',       cron: '30 7 * * *',  next: '2026-05-27 07:30', last: 'OK',   on: true },
  { name: '주간 리포트 발송',    cron: '0 9 * * 1',   next: '2026-06-01 09:00', last: 'OK',   on: true },
  { name: 'Slow Moving 알림',  cron: '0 10 1 * *',  next: '2026-06-01 10:00', last: 'OK',   on: false },
];

const HISTORY = [
  { time: '2026-05-26 04:00', job: 'RP 엔진 실행', duration: '8m 12s', status: 'SUCCESS' },
  { time: '2026-05-26 05:00', job: 'MP 엔진 실행', duration: '12m 8s', status: 'FAILED' },
  { time: '2026-05-26 06:00', job: 'DP 자동 집계',  duration: '3m 45s', status: 'SUCCESS' },
  { time: '2026-05-26 07:30', job: 'IP 일일 집계',  duration: '1m 22s', status: 'SUCCESS' },
];

export default function ScheduleMockup() {
  return (
    <MockShell
      patternCode="plannel_schedule"
      patternLabel="PlaNEL — 스케줄러 (Schedule Settings / Schedule History)"
      layoutCategory="LAYOUT_SINGLE"
      description="스케줄러 설정 + 실행 이력. Quartz cron 기반 자동 작업 관리."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <ScheduleIcon color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>스케줄러 관리</Typography>
          <Chip label="7 작업 · 6 활성 / 1 비활성" size="small" />
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" startIcon={<AddIcon />} variant="contained">스케줄 추가</Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, borderRight: '1px solid', borderColor: 'divider', overflow: 'auto' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, p: 1.5, color: 'primary.main' }}>등록된 작업</Typography>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>작업명</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Cron</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>다음 실행</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>최근</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>활성</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {SCHEDULES.map((s) => (
                <TableRow key={s.name} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{s.cron}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{s.next}</TableCell>
                  <TableCell>
                    {s.last === 'OK' ?
                      <CheckCircleIcon color="success" sx={{ fontSize: 18 }} /> :
                      <ErrorIcon color="error" sx={{ fontSize: 18 }} />}
                  </TableCell>
                  <TableCell><Switch size="small" checked={s.on} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        <Box sx={{ width: 360, overflow: 'auto' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, p: 1.5, color: 'primary.main' }}>오늘 실행 이력</Typography>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>시각</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>작업</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>결과</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {HISTORY.map((h, i) => (
                <TableRow key={i} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{h.time}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{h.job}<br /><Typography variant="caption" color="text.secondary">{h.duration}</Typography></TableCell>
                  <TableCell><Chip label={h.status} size="small" color={h.status === 'SUCCESS' ? 'success' : 'error'} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </MockShell>
  );
}

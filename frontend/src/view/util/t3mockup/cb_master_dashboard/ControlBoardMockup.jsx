import React from 'react';
import {
  Box, Stack, Chip, Typography, Button, Card, CardContent, LinearProgress, Divider, Grid,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import HistoryIcon from '@mui/icons-material/History';

import MockShell from '../_shared/MockShell';
import { KPI_CARDS, ALERTS } from '../_data/mockData';

const STEPS = [
  { name: 'Validation',    status: 'DONE',    duration: '0:08' },
  { name: 'Forecasting',   status: 'DONE',    duration: '2:14' },
  { name: 'Master Plan',   status: 'RUNNING', duration: '1:42' },
  { name: 'Replenishment', status: 'WAIT',    duration: '-' },
  { name: 'Confirmation',  status: 'WAIT',    duration: '-' },
];

const LOG_LINES = [
  { time: '14:22:01', level: 'INFO',  text: 'Engine started — version V_2026_04_W15' },
  { time: '14:22:08', level: 'INFO',  text: 'Validation completed — 0 errors, 3 warnings' },
  { time: '14:22:09', level: 'INFO',  text: 'Forecasting started — 5,400 items × 12 weeks' },
  { time: '14:24:23', level: 'INFO',  text: 'Forecasting completed — MAPE 8.7%' },
  { time: '14:24:24', level: 'INFO',  text: 'Master Plan started' },
  { time: '14:25:55', level: 'WARN',  text: 'Resource constraint — Line A capacity 92%' },
  { time: '14:26:06', level: 'INFO',  text: 'Master Plan — 38% complete' },
];

export default function ControlBoardMockup() {
  return (
    <MockShell
      patternCode="cb_master_dashboard"
      patternLabel="CB — 마스터 컨트롤보드 (엔진 관제)"
      layoutCategory="LAYOUT_CONTROLBOARD"
      description="버전 상태 + 단계 진행 + KPI + 라이브 로그를 한 화면에 통합한 엔진 관제 보드."
    >
      {/* Header */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip size="small" color="info" label="V_2026_04_W15" sx={{ fontFamily: 'monospace' }} />
            <Chip size="small" color="warning" label="RUNNING" />
            <Typography variant="body2">시작: 2026-04-13 14:22:01 · 진행 시간: 4분 23초</Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" startIcon={<HistoryIcon />}>이력</Button>
            <Button size="small" variant="contained" color="error" startIcon={<StopIcon />}>중단</Button>
            <Button size="small" variant="contained" startIcon={<PlayArrowIcon />} disabled>재실행</Button>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        <Grid container spacing={1.5}>
          {/* Steps */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>실행 단계</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  {STEPS.map((s, i) => (
                    <React.Fragment key={s.name}>
                      <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Box sx={{
                          width: 32, height: 32, borderRadius: '50%', mx: 'auto', mb: 0.5,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: s.status === 'DONE' ? 'success.main' : (s.status === 'RUNNING' ? 'warning.main' : 'grey.300'),
                          color: 'white', fontWeight: 700,
                        }}>{i + 1}</Box>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>{s.name}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>{s.duration}</Typography>
                      </Box>
                      {i < STEPS.length - 1 && <Divider orientation="horizontal" flexItem sx={{ borderTopWidth: 2, alignSelf: 'flex-start', mt: 2, flex: 0, width: 24 }} />}
                    </React.Fragment>
                  ))}
                </Stack>
                <LinearProgress variant="determinate" value={60} sx={{ mt: 2, height: 8, borderRadius: 4 }} />
              </CardContent>
            </Card>
          </Grid>

          {/* KPI Cards */}
          {KPI_CARDS.slice(0, 4).map((kpi) => (
            <Grid item xs={6} md={3} key={kpi.kpiCd}>
              <Card variant="outlined">
                <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary">{kpi.kpiNm}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {kpi.value.toLocaleString()}<Typography component="span" variant="caption">{kpi.unit}</Typography>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Live log */}
          <Grid item xs={12} md={8}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>실행 로그 (live)</Typography>
                <Box sx={{ fontFamily: 'monospace', fontSize: 12, backgroundColor: '#0d1117', color: '#c9d1d9', p: 1.5, borderRadius: 1, maxHeight: 220, overflow: 'auto' }}>
                  {LOG_LINES.map((l, i) => (
                    <Box key={i} sx={{ whiteSpace: 'pre' }}>
                      <span style={{ color: '#7d8590' }}>{l.time}</span>{' '}
                      <span style={{ color: l.level === 'WARN' ? '#f7b955' : (l.level === 'ERROR' ? '#ff7b72' : '#56d364'), fontWeight: 700 }}>[{l.level}]</span>{' '}
                      {l.text}
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Alerts */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>알람</Typography>
                <Stack spacing={0.75}>
                  {ALERTS.map((a) => (
                    <Stack key={a.id} direction="row" alignItems="center" spacing={1}>
                      <Chip size="small" label={a.severity[0]} color={a.severity === 'CRITICAL' ? 'error' : (a.severity === 'WARNING' ? 'warning' : 'info')} sx={{ width: 24, height: 20, fontSize: 10 }} />
                      <Typography sx={{ fontSize: 12, flex: 1 }} noWrap title={a.message}>{a.message}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MockShell>
  );
}

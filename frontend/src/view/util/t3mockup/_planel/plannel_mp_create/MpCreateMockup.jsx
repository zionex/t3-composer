import React, { useState } from 'react';
import { Box, Stack, Button, Chip, Typography, Paper, LinearProgress,
  Stepper, Step, StepButton, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import MockShell from '../../_shared/MockShell';

// PLANNEL MP 계획 생성 — MpDemand / RunMP / MpReview 3개
// LAYOUT_H2 — 좌측 step list + 우측 엔진 실행 결과

const MP_STEPS = [
  { label: 'Demand 통합 (DP)', status: 'done',    progress: 100 },
  { label: 'Material Plan',    status: 'done',    progress: 100 },
  { label: 'Capacity Check',   status: 'running', progress: 78 },
  { label: 'Pegging',          status: 'pending', progress: 0 },
  { label: 'RTF 검토',         status: 'pending', progress: 0 },
];

const LOG_LINES = [
  { time: '14:31:02', msg: 'Demand 1,247 items × 12 weeks 통합', sev: 'success' },
  { time: '14:32:18', msg: 'BOM 다단계 전개 (LV0~3) 완료', sev: 'success' },
  { time: '14:33:42', msg: 'Material Plan 계산 — 평균 fill 96.2%', sev: 'success' },
  { time: '14:34:55', msg: 'Capacity Check 진행 중... 78%', sev: 'info' },
  { time: '14:35:21', msg: '⚠ Workcenter-K01 — 부하율 108% (over capacity)', sev: 'warning' },
  { time: '14:35:38', msg: '⚠ Workcenter-K03 — 부하율 103% (over capacity)', sev: 'warning' },
];

export default function MpCreateMockup() {
  const [activeStep, setActiveStep] = useState(2);
  const current = MP_STEPS[activeStep] || MP_STEPS[0];
  return (
    <MockShell
      patternCode="plannel_mp_create"
      patternLabel="PlaNEL — MP 계획 생성 (MP Demand / Run MP / MP Review)"
      layoutCategory="LAYOUT_H2"
      description="좌측 MP 엔진 step + 우측 실행 로그/결과. Material Plan + Capacity Check 통합."
    >
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Box sx={{ width: '34%', borderRight: '1px solid', borderColor: 'divider', p: 2, overflow: 'auto' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>MP 엔진 단계</Typography>
          <Stepper activeStep={activeStep} orientation="vertical" nonLinear>
            {MP_STEPS.map((s, i) => (
              <Step key={s.label} completed={s.status === 'done'}>
                <StepButton onClick={() => setActiveStep(i)} sx={{ textAlign: 'left' }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.label}</Typography>
                    {s.status === 'running' && <Chip label="RUNNING" size="small" color="warning" sx={{ height: 18 }} />}
                  </Stack>
                  {s.status === 'running' && (
                    <LinearProgress variant="determinate" value={s.progress} sx={{ mt: 0.5, height: 4 }} />
                  )}
                </StepButton>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
            <Chip
              label={`MP Engine — Step ${activeStep + 1}/${MP_STEPS.length} · ${current.label}`}
              color={current.status === 'done' ? 'success' : current.status === 'running' ? 'warning' : 'default'}
            />
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" disabled={activeStep >= MP_STEPS.length - 1} onClick={() => setActiveStep((s) => Math.min(s + 1, MP_STEPS.length - 1))}>다음</Button>
            <Button size="small" startIcon={<PlayArrowIcon />} variant="contained">재실행</Button>
          </Stack>

          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>중간 결과</Typography>
              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">평균 Fill Rate</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>96.2%</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">자재 충족도</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>98.5%</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">설비 부하 (peak)</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>108%</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">납기 충족</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>92.4%</Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: 0, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>실행 로그</Typography>
              <List dense disablePadding>
                {LOG_LINES.map((l, i) => (
                  <ListItem key={i} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      {l.sev === 'success' ? <CheckCircleIcon color="success" sx={{ fontSize: 16 }} /> :
                        <RadioButtonUncheckedIcon sx={{ fontSize: 16 }}
                          color={l.sev === 'warning' ? 'warning' : 'action'} />}
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="body2" sx={{ fontSize: 13 }}>{l.msg}</Typography>}
                      secondary={l.time}
                      secondaryTypographyProps={{ fontSize: 11, fontFamily: 'monospace' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        </Box>
      </Box>
    </MockShell>
  );
}

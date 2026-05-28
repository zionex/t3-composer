import React, { useState } from 'react';
import { Box, Stack, Button, Chip, Typography, Paper, LinearProgress,
  Stepper, Step, StepButton, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import MockShell from '../../_shared/MockShell';

// PLANNEL RP 계획 생성 — RpDemand / RunRp / RpReview 3개
// LAYOUT_H2 — 좌측 step list (실행/검토 단계) + 우측 현재 step 결과 패널

const RP_STEPS = [
  { label: 'Demand 수집',  status: 'done',     progress: 100 },
  { label: 'RP 엔진 실행', status: 'running',  progress: 67 },
  { label: 'PSI 시뮬',     status: 'pending',  progress: 0 },
  { label: '검토 / 조정',   status: 'pending',  progress: 0 },
  { label: '확정',         status: 'pending',  progress: 0 },
];

const LOG_LINES = [
  { time: '14:23:42', msg: 'Demand 입력 완료 (1,247 items × 7 weeks)', sev: 'info' },
  { time: '14:24:15', msg: 'BOM 전개 시작...', sev: 'info' },
  { time: '14:25:33', msg: 'BOM 전개 완료 (Level 0~3, 8,452 nodes)', sev: 'success' },
  { time: '14:26:01', msg: '재고 차감 계산 중... 65%', sev: 'info' },
  { time: '14:26:42', msg: '⚠ PCB Board v3 — 안전재고 미달 예상 (W34)', sev: 'warning' },
];

export default function RpCreateMockup() {
  const [activeStep, setActiveStep] = useState(1);
  const current = RP_STEPS[activeStep] || RP_STEPS[0];
  return (
    <MockShell
      patternCode="plannel_rp_create"
      patternLabel="PlaNEL — RP 계획 생성 (RP Demand / Run RP / RP Review)"
      layoutCategory="LAYOUT_H2"
      description="좌측 RP 실행 단계 stepper + 우측 현재 단계 로그/결과. RP 엔진 실행 워크플로우."
    >
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Box sx={{ width: '34%', borderRight: '1px solid', borderColor: 'divider', p: 2, overflow: 'auto' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>실행 단계</Typography>
          <Stepper activeStep={activeStep} orientation="vertical" nonLinear>
            {RP_STEPS.map((s, i) => (
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
              label={`RP Engine — Step ${activeStep + 1}/${RP_STEPS.length} · ${current.label}`}
              color={current.status === 'done' ? 'success' : current.status === 'running' ? 'warning' : 'default'}
            />
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" disabled={activeStep >= RP_STEPS.length - 1} onClick={() => setActiveStep((s) => Math.min(s + 1, RP_STEPS.length - 1))}>다음</Button>
            <Button size="small" startIcon={<PlayArrowIcon />} variant="contained">재실행</Button>
          </Stack>

          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>실행 진척</Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <Typography variant="caption">{current.label}</Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{current.progress}%</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={current.progress} sx={{ height: 8, borderRadius: 1 }} />
            </Paper>

            <Paper elevation={0} sx={{ p: 0, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                실행 로그 (실시간)
              </Typography>
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

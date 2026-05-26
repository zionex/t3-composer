import React from 'react';
import { Box, Stack, Button, Chip, Typography, Paper, LinearProgress,
  Stepper, Step, StepLabel } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import MockShell from '../../_shared/MockShell';

// PLANNEL DP 검토 — BfReview / DpProcessMgmt / LifecycleMgmt 3개
// LAYOUT_DASHBOARD — KPI cards + step indicator + 검토 진척 패널

const STEPS = ['데이터 수집', 'BF 예측', '수요 검토', '시나리오 시뮬', '승인'];
const ACTIVE_STEP = 2;

const KPIS = [
  { label: '계획 대상 Item', value: '1,247',  unit: '개', sub: '+12 신규' , color: 'primary' },
  { label: '예측 정확도',     value: '87.3',   unit: '%',  sub: 'M-1 기준',  color: 'success' },
  { label: '검토 대기',       value: '34',     unit: '건', sub: '+8 today',  color: 'warning' },
  { label: '결재 대기',       value: '12',     unit: '건', sub: '2일 이내',   color: 'error' },
];

const REVIEW_ITEMS = [
  { item: 'LED Module 60W', status: '검토중',      progress: 65, owner: '김수요' },
  { item: 'LED Module 80W', status: '결재대기',    progress: 100, owner: '이수요' },
  { item: 'PCB Board v3',   status: 'BF 재계산',   progress: 30, owner: 'BF Engine' },
  { item: 'Aluminum HS',    status: '검토 완료',   progress: 100, owner: '박수요' },
];

export default function DpReviewMockup() {
  return (
    <MockShell
      patternCode="plannel_dp_review"
      patternLabel="PlaNEL — DP 검토 (BF Review / DP Process Management / Lifecycle Management)"
      layoutCategory="LAYOUT_DASHBOARD"
      description="KPI cards + step indicator + 검토 진척 패널. 수요 검토 워크플로우 대시보드."
    >
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          {KPIS.map((k) => (
            <Paper key={k.label} elevation={1} sx={{ flex: 1, p: 2, borderLeft: '4px solid', borderLeftColor: `${k.color}.main` }}>
              <Typography variant="caption" color="text.secondary">{k.label}</Typography>
              <Stack direction="row" alignItems="baseline" spacing={0.5}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: `${k.color}.main` }}>{k.value}</Typography>
                <Typography variant="body2" color="text.secondary">{k.unit}</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">{k.sub}</Typography>
            </Paper>
          ))}
        </Stack>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>이번 사이클 진행 상황 — 2026-05 Cycle</Typography>
          <Stepper activeStep={ACTIVE_STEP} alternativeLabel>
            {STEPS.map((s, i) => (
              <Step key={s} completed={i < ACTIVE_STEP}>
                <StepLabel>{s}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>검토 대기 Item</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small">전체 보기</Button>
          </Stack>
          <Stack spacing={1.5}>
            {REVIEW_ITEMS.map((r) => (
              <Box key={r.item}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 180 }}>{r.item}</Typography>
                  <Chip label={r.status} size="small"
                    color={r.progress === 100 ? 'success' : r.status === 'BF 재계산' ? 'info' : 'warning'}
                    icon={r.progress === 100 ? <CheckCircleIcon sx={{ fontSize: 12 }} /> : <HourglassEmptyIcon sx={{ fontSize: 12 }} />} />
                  <Typography variant="caption" color="text.secondary">{r.owner}</Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.progress}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={r.progress}
                  color={r.progress === 100 ? 'success' : 'primary'} sx={{ height: 6, borderRadius: 1 }} />
              </Box>
            ))}
          </Stack>
        </Paper>
      </Box>
    </MockShell>
  );
}

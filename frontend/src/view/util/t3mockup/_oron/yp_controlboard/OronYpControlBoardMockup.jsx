import React from 'react';
import {
  Box, Stack, Typography, Paper, Chip, Card, CardHeader, CardContent, Button, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepButton from '@mui/material/StepButton';
import StepContent from '@mui/material/StepContent';
import AddIcon from '@mui/icons-material/Add';
import PlayCircleOutline from '@mui/icons-material/PlayCircleOutline';
import StopCircle from '@mui/icons-material/StopCircle';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import MockShell from '../../_shared/MockShell';

// ORON — YP 연간계획 (생성/관리)
// 대표 화면: UI_YP_ORN_CONTROL_BOARD "연간계획 생성"
//   → BaseControlBoard 와 동일 구조 (planTypeCode='DP_PLAN_YEARLY')
//   좌측 Card: PLAN_TP 칩 + [+ NEW_VERSION] + Vertical Stepper(versionHistory)
//   우측 Card: Approval Steps Table (STEP_NM / LV_NM / STATUS / DESCRIP)
// 같이 묶인 메뉴: UI_BP_93 연간계획 관리, UI_BP_94 연간계획 입력현황

const VERSIONS = [
  { label: 'Y2026_DRAFT',   descrip: '2026 연간계획 초안',     created: '2026-05-15', status: 'OPEN', active: true },
  { label: 'Y2026_BASELINE', descrip: '2026 연간계획 베이스라인', created: '2026-04-10', status: 'OPEN' },
  { label: 'Y2025',         descrip: '2025 연간계획 (마감)',   created: '2025-04-01', status: 'CLOSE' },
];

const APPROVAL = [
  { step: 'MKT_INPUT',    lv: '마케팅',  status: { done: 12, total: 12 }, descrip: '마케팅 연간계획 입력 (브랜드/카테고리)' },
  { step: 'SALES_INPUT',  lv: '영업본부', status: { done: 8, total: 10 },  descrip: '영업팀 연간계획 입력 (지역/채널)' },
  { step: 'PTT_REQ',      lv: 'SCM본부', status: { done: 1, total: 5 },   descrip: '원료/감자 연간 소요 계획' },
  { step: 'SOP_REVIEW',   lv: 'S&OP',    status: { done: 0, total: 1 },   descrip: 'S&OP 통합 검토' },
  { step: 'EXEC_APPROVAL', lv: '경영진', status: { done: 0, total: 1 },   descrip: '연간계획 최종 승인' },
];

function StatusIcon({ done, total }) {
  if (total === 0) return <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: '#d1d5db' }} />;
  if (done === total) return <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />;
  if (done === 0) return <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: '#d1d5db' }} />;
  return <HourglassEmptyIcon sx={{ fontSize: 16, color: '#f59e0b' }} />;
}

export default function OronYpControlBoardMockup() {
  return (
    <MockShell
      patternCode="oron_yp_controlboard"
      patternLabel="ORON — YP 연간계획 관리 (ControlBoard)"
      layoutCategory="LAYOUT_SINGLE"
      description="대표 화면 = 연간계획 생성 (UI_YP_ORN_CONTROL_BOARD). BaseControlBoard (planTypeCode='DP_PLAN_YEARLY') — 좌측 버전 Stepper(연간 베이스라인/초안/이전 연도) + 우측 5단계 승인(MKT_INPUT → SALES_INPUT → PTT_REQ → SOP_REVIEW → EXEC_APPROVAL). 같이 묶인 메뉴: UI_BP_93 연간계획 관리, UI_BP_94 입력현황."
    >
      <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'row', gap: 1.5, minHeight: 0, overflow: 'hidden' }}>
        {/* 좌측 — Version History */}
        <Card variant="outlined" sx={{ width: '36%', display: 'flex', flexDirection: 'column' }}>
          <CardHeader
            sx={{ pb: 0.5 }}
            avatar={<Chip label="DP_PLAN_YEARLY" size="small" variant="outlined" />}
            action={<Button size="small" variant="outlined" startIcon={<AddIcon />}>NEW_VERSION</Button>}
          />
          <CardContent sx={{ flex: 1, overflow: 'auto', pt: 1 }}>
            <Stepper nonLinear activeStep={0} orientation="vertical">
              {VERSIONS.map((v, i) => (
                <Step key={v.label} active={v.active}>
                  <StepButton icon={v.status === 'CLOSE' ? <StopCircle color="action" /> : <PlayCircleOutline sx={{ color: v.active ? '#1565c0' : '#9ca3af' }} />}>
                    <Typography variant="body1" sx={{ fontSize: 12, fontWeight: v.active ? 700 : 400 }}>{v.label}</Typography>
                  </StepButton>
                  <StepContent>
                    <Typography variant="caption" sx={{ display: 'block', fontSize: 10, color: 'text.secondary' }}>{v.descrip}</Typography>
                    <Typography variant="caption" sx={{ display: 'block', fontSize: 10, color: 'text.disabled' }}>CREATED : {v.created}</Typography>
                    {v.status === 'CLOSE' && <Chip label="CLOSE" size="small" sx={{ mt: 0.5, height: 16, fontSize: 9 }} />}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* 우측 — Approval Steps */}
        <Card variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1, overflow: 'auto', p: 0 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>#</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>STEP_NM</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>LV_NM</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>
                    STATUS
                    <IconButton size="small" sx={{ ml: 0.5, p: 0.25 }} title="Go to Process Status">
                      <LinkIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>DESCRIP</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {APPROVAL.map((row, i) => (
                  <TableRow key={row.step} hover selected={i === 2}>
                    <TableCell sx={{ fontSize: 12 }}>#{i + 1}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>{row.step}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{row.lv}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <StatusIcon done={row.status.done} total={row.status.total} />
                        <Typography sx={{ fontSize: 11, fontFamily: 'monospace' }}>{row.status.done}/{row.status.total}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{row.descrip}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}

import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Avatar,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MockShell from '../../_shared/MockShell';
import CbStepper from '../../_shared/CbStepper';
import { cellSx, deltaStatus, percentStatus } from '../../_shared/styleCallback';

// CJBO — BP (Business Plan / 경영계획) 워크플로 통합
// UI_BP_93 Control Board · UI_BP_94 진행 상태 · UI_BP_95 경영계획 입력

const STEPS = [
  { label: 'BP 시즌 오픈',  status: 'done',    detail: '2026-04' },
  { label: '전년 결산 기준', status: 'done',    detail: '2026-04' },
  { label: '시장 가이드라인', status: 'done',    detail: '2026-04' },
  { label: '본부 입력',     status: 'done',    detail: '2026-05' },
  { label: '경영진 검토',   status: 'running', detail: '진행 중' },
  { label: '이사회 확정',   status: 'pending', detail: '-' },
];

const KPIS = [
  { label: '2027 BP 매출 목표', value: '2,850억', delta: '+8.5% YoY',  color: 'success' },
  { label: 'BP 영업이익',        value: '425억',   delta: '+12.3% YoY', color: 'info'    },
  { label: '시장 점유율 목표',   value: '18.5%',   delta: '+1.2%p',     color: 'highlight' },
  { label: '버전 / 단계',        value: 'V2027-BP', delta: '본부 입력',  color: 'primary' },
];

const SEGMENTS = [
  { SEG: '국내 - illuvia',     PY:  680, PY_PRF: 102.3, BP:  750, GROWTH: +10.3, MARGIN: 15.2 },
  { SEG: '국내 - CJ Brand',    PY:  580, PY_PRF:  98.5, BP:  620, GROWTH:  +6.9, MARGIN: 18.5 },
  { SEG: '국내 - NGP',         PY:  280, PY_PRF:  88.2, BP:  350, GROWTH: +25.0, MARGIN: 22.0 },
  { SEG: '해외 - 동남아',       PY:  420, PY_PRF:  92.5, BP:  480, GROWTH: +14.3, MARGIN: 12.8 },
  { SEG: '해외 - 일본/중국',   PY:  380, PY_PRF: 105.2, BP:  420, GROWTH: +10.5, MARGIN: 14.5 },
  { SEG: '해외 - 미주/유럽',   PY:  220, PY_PRF:  72.8, BP:  280, GROWTH: +27.3, MARGIN:  9.5 },
  { SEG: 'OEM/기타',           PY:   90, PY_PRF:  88.0, BP:   50, GROWTH: -44.4, MARGIN:  5.0 },
  { TOTAL: true, SEG: '합계',  PY: 2650, PY_PRF:  97.5, BP: 2950, GROWTH: +11.3, MARGIN: 15.3 },
];

export default function CjboBpWorkflowMockup() {
  return (
    <MockShell patternCode="cjbo_bp_workflow" patternLabel="CJBO — 경영계획 (BP) 워크플로 (Controlboard·Status·Entry)"
      layoutCategory="LAYOUT_CONTROLBOARD"
      description="BP (Business Plan / 경영계획) — 6단계 + 본부별 매출/이익 계획 + 전년대비 성장률. UI_BP_93/94/95.">
      <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField label="계획 연도" size="small" value="2027" sx={{ width: 130 }} />
          <TextField label="버전" size="small" value="V2027-BP" sx={{ width: 130 }} />
          <TextField label="단계" size="small" select value="REVIEW" sx={{ width: 160 }}>
            <MenuItem value="ENTRY">본부 입력</MenuItem>
            <MenuItem value="REVIEW">경영진 검토</MenuItem>
            <MenuItem value="CONFIRM">이사회 확정</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" color="success" startIcon={<PlayArrowIcon />}>실행</Button>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>새로고침</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>BP 6단계 워크플로 (연간 사이클)</Typography>
          <CbStepper steps={STEPS} />
        </Paper>

        <Stack direction="row" spacing={1.5}>
          {KPIS.map((k, i) => (
            <Paper key={k.label} variant="outlined" sx={{ p: 1.5, flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar sx={{ backgroundColor: `${k.color}.light`, color: `${k.color}.dark`, width: 40, height: 40 }}>
                  {i < 2 ? <BusinessCenterIcon /> : <TrendingUpIcon />}
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">{k.label}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: `${k.color}.main` }}>{k.value}</Typography>
                  <Typography variant="caption" sx={{ color: k.delta.includes('+') ? 'success.main' : 'text.secondary', fontWeight: 600 }}>
                    {k.delta}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>본부/사업부별 BP 계획 — 2027년</Typography>
            <Chip size="small" label="단위: 억 KRW" color="info" variant="outlined" />
            <Box sx={{ flexGrow: 1 }} />
            <Chip size="small" label="시장 가이드라인 +10% 적용됨" color="success" variant="outlined" />
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['사업부','전년 실적','전년 달성률','2027 BP','전년대비 성장률','마진율'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                      textAlign: c === '사업부' ? 'left' : 'right' }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {SEGMENTS.map((s, i) => {
                  const tone = deltaStatus(s.GROWTH, { warningDown: -10, dangerDown: -30 });
                  const prfTone = percentStatus(s.PY_PRF);
                  return (
                    <TableRow key={i} hover sx={{ backgroundColor: s.TOTAL ? '#e1bee7' : undefined }}>
                      <TableCell sx={{ fontWeight: s.TOTAL ? 700 : 500 }}>{s.SEG}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: s.TOTAL ? 700 : undefined }}>{s.PY.toLocaleString()}</TableCell>
                      <TableCell sx={cellSx(prfTone, { align: 'right', mono: true })}>{s.PY_PRF.toFixed(1)}%</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: s.TOTAL ? 700 : 600, backgroundColor: '#fffde7' }}>{s.BP.toLocaleString()}</TableCell>
                      <TableCell sx={cellSx(tone, { align: 'right', mono: true })}>{s.GROWTH > 0 ? `+${s.GROWTH.toFixed(1)}` : s.GROWTH.toFixed(1)}%</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{s.MARGIN.toFixed(1)}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}

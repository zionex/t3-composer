import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Button, LinearProgress,
  Card, CardContent, CardHeader,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import MockShell from '../../_shared/MockShell';

// ORON — PK 생산계획 시뮬레이션
// 대표 화면: UI_PK_ORN_PACK_SIMUL "생산계획 생성" (PKSimulation)
//   상단: 시뮬레이션 파라미터 (Version / Scenario / 기간 / 우선순위)
//   중단: 실행 버튼 + 진행률 + 상태 단계
//   하단: 시나리오 목록 (이전 실행 history)
// 같이 묶인 메뉴: UI_PK_ORN_PACK_SNRIO 계획 시나리오 관리 (PlanScenario)

const RUN_STEPS = [
  { name: '데이터 수집', status: 'done',     elapsed: '00:12' },
  { name: '기준정보 검증', status: 'done',     elapsed: '00:08' },
  { name: '제약조건 로드', status: 'done',     elapsed: '00:05' },
  { name: '엔진 실행',    status: 'running', elapsed: '01:23' },
  { name: '결과 저장',    status: 'pending',  elapsed: '-' },
];

const HISTORY = [
  { snrio: 'SC-2026-0612-A', desc: '익산공장 정상 가동',         start: '2026-06-12 09:15', elapsed: '02:18', status: 'SUCCESS', plans: 1245 },
  { snrio: 'SC-2026-0611-B', desc: 'OEM 라인 추가 시뮬',          start: '2026-06-11 14:30', elapsed: '02:42', status: 'SUCCESS', plans: 1356 },
  { snrio: 'SC-2026-0611-A', desc: '6월 베이스라인',               start: '2026-06-11 09:10', elapsed: '02:15', status: 'SUCCESS', plans: 1180 },
  { snrio: 'SC-2026-0610-C', desc: '인쇄1 라인 정비 반영',         start: '2026-06-10 16:45', elapsed: '01:45', status: 'FAILED',  plans: 0 },
  { snrio: 'SC-2026-0610-A', desc: '5월 마감 기준 1차',            start: '2026-06-10 08:00', elapsed: '02:33', status: 'SUCCESS', plans: 1120 },
];

const STATUS_COLOR = { SUCCESS: '#10b981', FAILED: '#ef4444', RUNNING: '#3b82f6' };

function StepStatus({ status }) {
  if (status === 'done')    return <CheckCircleIcon sx={{ fontSize: 18, color: '#10b981' }} />;
  if (status === 'running') return <HourglassEmptyIcon sx={{ fontSize: 18, color: '#3b82f6' }} />;
  return <Box sx={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #d1d5db', display: 'inline-block' }} />;
}

export default function OronPkSimulationMockup() {
  return (
    <MockShell
      patternCode="oron_pk_simulation"
      patternLabel="ORON — PK 생산계획 시뮬레이션 + 시나리오 관리"
      layoutCategory="LAYOUT_SINGLE"
      description="대표 화면 = 생산계획 생성 (UI_PK_ORN_PACK_SIMUL). 시뮬레이션 파라미터 + 엔진 실행 + 진행 단계 표시 + 이전 실행 history. 같이 묶인 메뉴 = UI_PK_ORN_PACK_SNRIO 계획 시나리오 관리 (PlanScenario)."
    >
      <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 0, overflow: 'auto' }}>
        {/* 상단: 파라미터 카드 */}
        <Card variant="outlined">
          <CardHeader sx={{ pb: 0.5 }} title={<Typography sx={{ fontSize: 13, fontWeight: 700 }}>시뮬레이션 파라미터</Typography>} />
          <CardContent sx={{ pt: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1.5 }}>
              <TextField label="MAIN_VER" size="small" select value="V2026-06" sx={{ width: 150 }}>
                <MenuItem value="V2026-06">V2026-06</MenuItem>
              </TextField>
              <TextField label="시나리오명" size="small" value="SC-2026-0612-B" sx={{ width: 200 }} />
              <TextField label="시나리오 설명" size="small" value="6월 OEM 라인 100% 가동" sx={{ width: 280 }} />
              <TextField label="기간" size="small" value="2026-06-08 ~ 06-30" sx={{ width: 200 }} />
              <TextField label="우선순위" size="small" select value="DUE_DATE" sx={{ width: 150 }}>
                <MenuItem value="DUE_DATE">납기일</MenuItem>
                <MenuItem value="PRIORITY">우선순위</MenuItem>
                <MenuItem value="MIN_CHANGE">생산변경 최소화</MenuItem>
              </TextField>
            </Stack>
          </CardContent>
        </Card>

        {/* 중단: 실행 컨트롤 + 진행 단계 */}
        <Card variant="outlined">
          <CardHeader
            sx={{ pb: 0.5 }}
            title={<Typography sx={{ fontSize: 13, fontWeight: 700 }}>실행 상태</Typography>}
            action={
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="contained" color="success" startIcon={<PlayArrowIcon />}>실행</Button>
                <Button size="small" variant="outlined" color="error" startIcon={<StopIcon />} disabled>중지</Button>
              </Stack>
            }
          />
          <CardContent sx={{ pt: 1 }}>
            <Box sx={{ mb: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>진행률 (4/5 단계 완료)</Typography>
                <Typography sx={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#3b82f6' }}>72%</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={72} sx={{ height: 8, borderRadius: 1 }} />
            </Box>
            <Table size="small">
              <TableBody>
                {RUN_STEPS.map((s, i) => (
                  <TableRow key={s.name}>
                    <TableCell sx={{ width: 30 }}><StepStatus status={s.status} /></TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{i + 1}. {s.name}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'right', color: 'text.secondary' }}>{s.elapsed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 하단: 시나리오 history */}
        <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column' }}>
          <CardHeader
            sx={{ pb: 0.5 }}
            title={<Typography sx={{ fontSize: 13, fontWeight: 700 }}>이전 시나리오 실행 이력</Typography>}
            action={<Chip icon={<HistoryIcon sx={{ fontSize: 12 }} />} label={`${HISTORY.length}건`} size="small" variant="outlined" />}
          />
          <CardContent sx={{ pt: 0 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>SNRIO_CD</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>DESCRIP</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>START_DTTM</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace', textAlign: 'right' }}>ELAPSED</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>STATUS</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>계획 건수</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {HISTORY.map((h, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>{h.snrio}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{h.desc}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>{h.start}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'right' }}>{h.elapsed}</TableCell>
                      <TableCell sx={{ fontSize: 12, textAlign: 'center', fontWeight: 600, color: STATUS_COLOR[h.status] }}>
                        {h.status === 'FAILED' && <ErrorIcon sx={{ fontSize: 12, mr: 0.3, verticalAlign: 'middle' }} />}
                        {h.status === 'SUCCESS' && <CheckCircleIcon sx={{ fontSize: 12, mr: 0.3, verticalAlign: 'middle' }} />}
                        {h.status}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'right' }}>{h.plans.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}

import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, LinearProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SearchIcon from '@mui/icons-material/Search';
import GroupsIcon from '@mui/icons-material/Groups';
import MockShell from '../../_shared/MockShell';
import CbStepper from '../../_shared/CbStepper';
import { cellSx } from '../../_shared/styleCallback';

// OronYp01 — 연간계획 생성/관리 컨트롤보드
// UI_YP_ORN_CONTROL_BOARD, UI_BP_93, UI_BP_94

const STEPS = [
  { label: '연간 목표 설정', status: 'done',    detail: '확정' },
  { label: '마케팅 입력',    status: 'done',    detail: '12/12 완료' },
  { label: '영업팀 입력',    status: 'running', detail: '8/12 진행' },
  { label: '원료감자 계획',  status: 'pending', detail: '대기' },
  { label: '통합 조정',      status: 'pending', detail: '대기' },
  { label: '연간계획 확정',  status: 'pending', detail: '대기' },
];

const TEAM_STATUS = [
  { TEAM: '마케팅팀',    OWNER: '김지영', PROGRESS: 100, PLAN: '전체', UPDATE_DT: '2026-05-25', STATUS: 'DONE' },
  { TEAM: '영업1팀(수도권)', OWNER: '박철수', PROGRESS: 85,  PLAN: '온/오프', UPDATE_DT: '2026-05-27', STATUS: 'PROGRESS' },
  { TEAM: '영업2팀(영남)',   OWNER: '최경호', PROGRESS: 70,  PLAN: '오프라인', UPDATE_DT: '2026-05-26', STATUS: 'PROGRESS' },
  { TEAM: '영업3팀(호남)',   OWNER: '신해리', PROGRESS: 60,  PLAN: '오프라인', UPDATE_DT: '2026-05-26', STATUS: 'PROGRESS' },
  { TEAM: 'OEM영업팀',   OWNER: '이수민', PROGRESS: 40,  PLAN: 'OEM',     UPDATE_DT: '2026-05-24', STATUS: 'DELAY' },
  { TEAM: '원료구매팀',  OWNER: '백성호', PROGRESS: 0,   PLAN: '원료감자', UPDATE_DT: '-',          STATUS: 'PENDING' },
];

const STATUS_COLOR = { DONE: 'success', PROGRESS: 'primary', DELAY: 'warning', PENDING: 'default' };

export default function OronYpControlBoardMockup() {
  return (
    <MockShell
      patternCode="oron_yp_controlboard"
      patternLabel="ORON — 연간계획 생성·관리 컨트롤보드"
      layoutCategory="LAYOUT_CONTROLBOARD"
      description="연간계획 6단계 (목표→마케팅→영업팀→원료감자→통합조정→확정) + 팀별 입력 진척 현황. UI_YP_ORN_CONTROL_BOARD, UI_BP_93, UI_BP_94."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="계획연도" size="small" select value="2027" sx={{ width: 120 }}>
            <MenuItem value="2027">2027년</MenuItem>
            <MenuItem value="2026">2026년</MenuItem>
          </TextField>
          <TextField label="버전" size="small" value="YP_2027_DRAFT_03" sx={{ width: 180 }} />
          <TextField label="계획 사이클" size="small" select value="ANNUAL" sx={{ width: 130 }}>
            <MenuItem value="ANNUAL">연간 (12M)</MenuItem>
            <MenuItem value="HALF">반기</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Chip icon={<PlayArrowIcon />} label="영업팀 입력 단계" color="primary" />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>현황 갱신</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <CbStepper steps={STEPS} />
          <Box sx={{ mt: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption" sx={{ minWidth: 90 }}>영업팀 입력</Typography>
              <Box sx={{ flexGrow: 1 }}>
                <LinearProgress variant="determinate" value={67} sx={{ height: 8, borderRadius: 1 }} />
              </Box>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, minWidth: 50 }}>67%</Typography>
              <Typography variant="caption" color="text.secondary">8/12 팀 완료</Typography>
            </Stack>
          </Box>
        </Paper>

        <Stack direction="row" spacing={1.5}>
          {[
            { label: '연간 목표 (수량)', value: '2.45M', detail: 'EA · 전년比 +8.2%', color: 'primary' },
            { label: '연간 목표 (매출)', value: '485억', detail: '전년比 +12.5%', color: 'success' },
            { label: '입력 완료 팀',    value: '8/12',  detail: '67%',          color: 'info' },
            { label: '지연 팀',         value: '2',     detail: 'OEM·원료구매',  color: 'warning' },
          ].map((k) => (
            <Paper key={k.label} variant="outlined" sx={{ p: 1.5, flex: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{k.label}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: `${k.color}.main`, mt: 0.5 }}>{k.value}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{k.detail}</Typography>
            </Paper>
          ))}
        </Stack>

        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <GroupsIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>팀별 연간계획 입력 진척 현황</Typography>
            </Stack>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 180 }}>팀</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>담당자</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 240 }}>진척률</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 120, textAlign: 'center' }}>담당 계획</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 120, textAlign: 'center' }}>최종 수정</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {TEAM_STATUS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{r.TEAM}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{r.OWNER}</TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ flexGrow: 1 }}>
                          <LinearProgress variant="determinate" value={r.PROGRESS} sx={{ height: 7, borderRadius: 1 }}
                            color={r.PROGRESS === 100 ? 'success' : r.PROGRESS >= 60 ? 'primary' : 'warning'} />
                        </Box>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, minWidth: 36 }}>{r.PROGRESS}%</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontSize: 12 }}>{r.PLAN}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.UPDATE_DT}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Chip label={r.STATUS} size="small" color={STATUS_COLOR[r.STATUS] || 'default'} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}

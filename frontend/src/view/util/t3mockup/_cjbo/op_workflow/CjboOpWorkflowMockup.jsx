import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Avatar, LinearProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import MockShell from '../../_shared/MockShell';
import CbStepper from '../../_shared/CbStepper';
import CbLogPane from '../../_shared/CbLogPane';

// CJBO — OP (Operation Plan) 워크플로 통합
// UI_DP_93 OP Control Board · UI_DP_94 OP 진행상태 · UI_DP_95 OP 계획입력

const STEPS = [
  { label: '버전 생성',     status: 'done',    detail: '12:30' },
  { label: '기준정보 로드', status: 'done',    detail: '12:35' },
  { label: 'BF 결과 연계',  status: 'done',    detail: '12:42' },
  { label: '담당자 입력',   status: 'running', detail: '진행 중' },
  { label: '관리자 검토',   status: 'pending', detail: '-' },
  { label: '최종 승인',     status: 'pending', detail: '-' },
];

const KPIS = [
  { label: '입력 완료 (담당)', value: '78%',    sub: '142 / 182명', color: 'info' },
  { label: '버전',              value: 'V2026-06', sub: 'OP 계획',  color: 'primary' },
  { label: '마감',              value: 'D-3',    sub: '06-07 23:59', color: 'warning' },
  { label: '미입력',            value: '40',     sub: '담당자 수',   color: 'error' },
];

const LOG_LINES = [
  { time: '12:30:15', level: 'INFO',  message: 'V2026-06 OP 계획 버전 생성 완료' },
  { time: '12:30:42', level: 'INFO',  message: '기준정보 동기화 시작 (거래처/품목/조직)' },
  { time: '12:35:08', level: 'INFO',  message: '기준정보 동기화 완료 — 거래처 3,250건 · 품목 1,820건' },
  { time: '12:35:20', level: 'INFO',  message: 'BF 베이스라인 V2026-06 연계 시작' },
  { time: '12:42:53', level: 'INFO',  message: 'BF 연계 완료 — 일별 예측 12,820 row 생성' },
  { time: '13:00:00', level: 'INFO',  message: '담당자 입력 알림 발송 — 182명' },
  { time: '14:25:18', level: 'DEBUG', message: '김민수 (영업1팀) 입력 저장 — 12 cell 변경' },
  { time: '14:30:42', level: 'DEBUG', message: '정재현 (NGP팀) 입력 저장 — 28 cell 변경' },
  { time: '14:45:11', level: 'DEBUG', message: '박서연 (영업1팀) 입력 저장 — 18 cell 변경' },
  { time: '15:10:35', level: 'WARN',  message: '박글로벌 (수출팀) 입력 시간 초과 — 알림 재발송' },
];

const TASKS = [
  { EMP: '김민수',     TEAM: '영업1팀', STATUS: 'completed', PROGRESS: 100, ITEMS: 32, LAST: '14:25:18' },
  { EMP: '정재현',     TEAM: 'NGP팀',   STATUS: 'completed', PROGRESS: 100, ITEMS: 28, LAST: '14:30:42' },
  { EMP: '박서연',     TEAM: '영업1팀', STATUS: 'completed', PROGRESS: 100, ITEMS: 18, LAST: '14:45:11' },
  { EMP: '이정훈',     TEAM: '영업1팀', STATUS: 'in_progress', PROGRESS: 68, ITEMS: 14, LAST: '15:18:02' },
  { EMP: '송하늘',     TEAM: 'NGP팀',   STATUS: 'in_progress', PROGRESS: 42, ITEMS:  8, LAST: '15:20:11' },
  { EMP: '박글로벌',   TEAM: '수출팀',  STATUS: 'pending',   PROGRESS:  0, ITEMS:  0, LAST: '-' },
  { EMP: '최가람',     TEAM: '영업3팀', STATUS: 'pending',   PROGRESS:  0, ITEMS:  0, LAST: '-' },
];

const STATUS_INFO = {
  completed:   { label: '완료',   color: 'success' },
  in_progress: { label: '진행중', color: 'info' },
  pending:     { label: '미입력', color: 'warning' },
};

export default function CjboOpWorkflowMockup() {
  return (
    <MockShell patternCode="cjbo_op_workflow" patternLabel="CJBO — OP 계획 워크플로 (Controlboard·Status·Entry)"
      layoutCategory="LAYOUT_CONTROLBOARD"
      description="OP (Operation Plan) — 컨트롤보드 6단계 + 담당자 진행상태 + 입력 마감 KPI. UI_DP_93/94/95.">
      <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField label="버전" size="small" value="V2026-06" sx={{ width: 130 }} />
          <TextField label="단계" size="small" select value="ENTRY" sx={{ width: 160 }}>
            <MenuItem value="ENTRY">담당자 입력</MenuItem>
            <MenuItem value="REVIEW">관리자 검토</MenuItem>
            <MenuItem value="APPROVE">최종 승인</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" color="success" startIcon={<PlayArrowIcon />}>실행</Button>
          <Button variant="outlined" size="small" color="error" startIcon={<StopIcon />}>정지</Button>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>새로고침</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>워크플로 진행</Typography>
          <CbStepper steps={STEPS} />
        </Paper>

        <Stack direction="row" spacing={1.5}>
          {KPIS.map((k) => (
            <Paper key={k.label} variant="outlined" sx={{ p: 1.5, flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar sx={{ backgroundColor: `${k.color}.light`, color: `${k.color}.dark`, width: 40, height: 40 }}>
                  <SendIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">{k.label}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: `${k.color}.main` }}>{k.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{k.sub}</Typography>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Box sx={{ display: 'flex', gap: 1.5, flex: 1, minHeight: 240 }}>
          <Paper variant="outlined" sx={{ flex: 1.6, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>담당자별 입력 진행</Typography>
              <Chip size="small" label={`${TASKS.length}명`} variant="outlined" />
              <Box sx={{ flexGrow: 1 }} />
              <Button size="small" startIcon={<SaveIcon />} variant="outlined">알림 재발송</Button>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {['담당자','팀','상태','진척율','입력 셀','최종 저장'].map((c) => (
                      <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                        textAlign: ['상태','진척율','입력 셀','최종 저장'].includes(c) ? 'center' : 'left' }}>{c}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {TASKS.map((t, i) => {
                    const s = STATUS_INFO[t.STATUS];
                    return (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{t.EMP}</TableCell>
                        <TableCell>{t.TEAM}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip size="small" label={s.label} color={s.color} />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', minWidth: 120 }}>
                          <Stack direction="row" alignItems="center" spacing={0.75}>
                            <LinearProgress variant="determinate" value={t.PROGRESS} color={s.color}
                              sx={{ flex: 1, height: 8, borderRadius: 1 }} />
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', minWidth: 32 }}>{t.PROGRESS}%</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{t.ITEMS}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 12 }}>{t.LAST}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Box sx={{ flex: 1, minWidth: 0, display: 'flex' }}>
            <Box sx={{ flex: 1 }}>
              <CbLogPane lines={LOG_LINES} title="OP 워크플로 로그" height="100%" />
            </Box>
          </Box>
        </Box>
      </Box>
    </MockShell>
  );
}

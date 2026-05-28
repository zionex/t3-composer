import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, LinearProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import MockShell from '../../_shared/MockShell';
import CbStepper from '../../_shared/CbStepper';
import CbLogPane from '../../_shared/CbLogPane';

// OronPk02 — 포장재 생산계획 생성 + 시나리오 관리
// UI_PK_ORN_PACK_SIMUL, PACK_SNRIO

const STEPS = [
  { label: '시나리오 입력',  status: 'done',    detail: 'SCN_0023' },
  { label: '수요 로드',      status: 'done',    detail: '2,485 건' },
  { label: '재고 검사',      status: 'done',    detail: '완료' },
  { label: '인쇄 계획',      status: 'running', detail: '78%' },
  { label: '가공/분단',      status: 'pending', detail: '대기' },
  { label: '결과 확정',      status: 'pending', detail: '대기' },
];

const SCENARIOS = [
  { CD: 'SCN_0023', NM: '5월 5주차 정기',    BASE_VER: 'MAIN_V2026_05', CREATE_DT: '2026-05-26', BY: '김지영', STATUS: 'RUNNING' },
  { CD: 'SCN_0022', NM: '5월 4주차 정기',    BASE_VER: 'MAIN_V2026_05', CREATE_DT: '2026-05-19', BY: '김지영', STATUS: 'CONFIRMED' },
  { CD: 'SCN_0021', NM: 'BD-0037 OEM긴급반영', BASE_VER: 'MAIN_V2026_05', CREATE_DT: '2026-05-15', BY: '박철수', STATUS: 'CONFIRMED' },
  { CD: 'SCN_0020', NM: '5월 3주차 정기',    BASE_VER: 'MAIN_V2026_05', CREATE_DT: '2026-05-12', BY: '김지영', STATUS: 'ARCHIVED' },
  { CD: 'SCN_0019', NM: '신제품 마스크 시뮬', BASE_VER: 'MAIN_V2026_04', CREATE_DT: '2026-05-08', BY: '이수민', STATUS: 'DROPPED' },
];

const LOG_LINES = [
  { time: '11:02:14', level: 'INFO', message: 'Pre-Setting: TB_RT_PK_PLAN initialized' },
  { time: '11:02:20', level: 'INFO', message: 'Demand: 2,485 packaging demands from MP plan' },
  { time: '11:02:34', level: 'INFO', message: 'Inventory check: 312 demands fulfilled by stock' },
  { time: '11:02:48', level: 'INFO', message: 'Print plan engine: started — t3pk-print.exe' },
  { time: '11:03:12', level: 'INFO', message: 'Print progress 30% — 750/2,485 demands sequenced' },
  { time: '11:03:48', level: 'WARN', message: 'Resource L-PRINT-02 overload @ W24 — overtime applied' },
  { time: '11:04:25', level: 'INFO', message: 'Print progress 78% — 1,935/2,485 demands sequenced' },
];

const STATUS_COLOR = { RUNNING: 'primary', CONFIRMED: 'success', ARCHIVED: 'default', DROPPED: 'error' };

export default function OronPkSimulationMockup() {
  return (
    <MockShell
      patternCode="oron_pk_simulation"
      patternLabel="ORON — 포장재 계획 생성 + 시나리오 관리"
      layoutCategory="LAYOUT_CONTROLBOARD"
      description="포장재 6단계 엔진 (수요→재고→인쇄→가공→분단→확정) 진행 + 시나리오 카탈로그 + 라이브 로그. UI_PK_ORN_PACK_SIMUL, PACK_SNRIO."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="시나리오" size="small" value="SCN_0023 — 5월 5주차 정기" sx={{ width: 280 }} />
          <TextField label="기반 버전" size="small" value="MAIN_V2026_05" sx={{ width: 150 }} />
          <TextField label="포장 공장" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="JC">제천</MenuItem>
            <MenuItem value="IS">익산</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Chip icon={<PlayArrowIcon />} label="RUNNING" color="primary" />
          <Button variant="outlined" size="small" startIcon={<AddIcon />}>새 시나리오</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <CbStepper steps={STEPS} />
          <Box sx={{ mt: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption" sx={{ minWidth: 80 }}>인쇄 계획</Typography>
              <Box sx={{ flexGrow: 1 }}>
                <LinearProgress variant="determinate" value={78} sx={{ height: 8, borderRadius: 1 }} color="primary" />
              </Box>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, minWidth: 50 }}>78%</Typography>
              <Typography variant="caption" color="text.secondary">잔여 5분</Typography>
            </Stack>
          </Box>
        </Paper>

        <Stack direction="row" spacing={1.5} sx={{ flex: 1, minHeight: 0 }}>
          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <HistoryIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>시나리오 카탈로그</Typography>
                <Chip label="총 19건" size="small" variant="outlined" />
              </Stack>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>코드</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>시나리오</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>생성일</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'center' }}>담당</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>상태</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {SCENARIOS.map((r, i) => (
                    <TableRow key={i} hover selected={r.STATUS === 'RUNNING'}>
                      <TableCell sx={{ fontFamily: 'monospace', textAlign: 'center', fontWeight: r.STATUS === 'RUNNING' ? 700 : 400 }}>{r.CD}</TableCell>
                      <TableCell>{r.NM}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.CREATE_DT}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontSize: 12 }}>{r.BY}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}><Chip label={r.STATUS} size="small" color={STATUS_COLOR[r.STATUS] || 'default'} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          <Box sx={{ flex: 1.2 }}>
            <CbLogPane lines={LOG_LINES} title="포장재 엔진 실행 로그" height="100%" />
          </Box>
        </Stack>
      </Box>
    </MockShell>
  );
}

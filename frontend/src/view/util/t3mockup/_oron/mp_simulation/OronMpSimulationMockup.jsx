import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, LinearProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MockShell from '../../_shared/MockShell';
import CbStepper from '../../_shared/CbStepper';
import CbLogPane from '../../_shared/CbLogPane';
import { cellSx } from '../../_shared/styleCallback';

// OronMp04 — 공급계획 시뮬레이션 + 컨트롤보드 + 기준정보 점검
// UI_MP_ORN_PLAN_DMND, UI_MP_ORN_DATA_VALID, UI_MP_ORN_DATA_VALID_INQ

const STEPS = [
  { label: '입력 수요', status: 'done',    detail: '12,484 건' },
  { label: '기준정보 점검', status: 'done', detail: 'PASS' },
  { label: '재고 Netting', status: 'done', detail: '완료' },
  { label: '엔진 실행', status: 'running', detail: '54% (12분)' },
  { label: '결과 후처리', status: 'pending', detail: '대기' },
  { label: '확정', status: 'pending', detail: '대기' },
];

const LOG_LINES = [
  { time: '10:34:21', level: 'INFO', message: 'Pre-Setting: TB_RT_MP_PLAN initialized' },
  { time: '10:34:25', level: 'INFO', message: 'Demand input: 12,484 rows loaded from DP_MASTER V2026-05' },
  { time: '10:34:32', level: 'INFO', message: 'Validation: 0 errors / 3 warnings' },
  { time: '10:34:34', level: 'WARN', message: 'BOR missing for ITEM F03005 — fallback to default capa' },
  { time: '10:34:48', level: 'INFO', message: 'Inventory Netting: 2,128 demands fulfilled by stock' },
  { time: '10:35:02', level: 'INFO', message: 'Engine started — t3fp.exe pid=12848' },
  { time: '10:35:15', level: 'INFO', message: 'Engine progress 24% — orders sequenced 2,150 / 8,750' },
  { time: '10:38:42', level: 'INFO', message: 'Engine progress 54% — orders sequenced 4,725 / 8,750' },
];

const VALIDATION_ROWS = [
  { CATEGORY: 'BOR',    ITEM: 'F03005', LINE: 'L-005', LEVEL: 'WARN',  MSG: 'BOR 미정의 — 기본 CAPA 적용' },
  { CATEGORY: 'BOM',    ITEM: 'F01002', LINE: '-',     LEVEL: 'WARN',  MSG: 'PACK BOM 누락' },
  { CATEGORY: 'CAL',    ITEM: '-',      LINE: 'L-006', LEVEL: 'INFO',  MSG: '신규 라인 캘린더 자동 생성' },
  { CATEGORY: 'STOCK',  ITEM: 'M20011', LINE: '-',     LEVEL: 'PASS',  MSG: '안전재고 충족' },
];

const LVL_COLOR = { WARN: 'warning', INFO: 'info', PASS: 'success', FAIL: 'error' };

export default function OronMpSimulationMockup() {
  return (
    <MockShell
      patternCode="oron_mp_simulation"
      patternLabel="ORON — 공급계획 시뮬레이션 컨트롤보드"
      layoutCategory="LAYOUT_CONTROLBOARD"
      description="공급계획 엔진 6단계 진행 + 실시간 로그 + 기준정보 점검 결과."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="PLAN_SCOPE" size="small" select value="ORN_MP" sx={{ width: 140 }}>
            <MenuItem value="ORN_MP">ORN_MP</MenuItem>
          </TextField>
          <TextField label="MAIN_VER" size="small" select value="V2026-05" sx={{ width: 140 }}>
            <MenuItem value="V2026-05">V2026-05</MenuItem>
          </TextField>
          <TextField label="SIMUL_VER" size="small" value="SIM_2026_05_28_001" sx={{ width: 200 }} />
          <TextField label="시뮬레이션 사유" size="small" value="신제품 출시 반영 (F04001)" sx={{ width: 220 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Chip icon={<PlayArrowIcon />} label="RUNNING" color="primary" />
          <Button variant="outlined" size="small" color="warning">중단</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
        {/* Stepper */}
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <CbStepper steps={STEPS} />
          <Box sx={{ mt: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption" sx={{ minWidth: 80 }}>엔진 진행률</Typography>
              <Box sx={{ flexGrow: 1 }}>
                <LinearProgress variant="determinate" value={54} sx={{ height: 8, borderRadius: 1 }} />
              </Box>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, minWidth: 60 }}>54%</Typography>
              <Typography variant="caption" color="text.secondary">예상 잔여 12분</Typography>
            </Stack>
          </Box>
        </Paper>

        {/* KPI cards */}
        <Stack direction="row" spacing={1.5}>
          {[
            { label: '입력 수요', value: '12,484', detail: '주문 4,521건', color: 'primary' },
            { label: '재고 충당', value: '2,128',  detail: '17.1%',         color: 'info' },
            { label: '생산 오더', value: '8,750',  detail: '계획 발행',     color: 'success' },
            { label: '미충족 수요', value: '156',  detail: '결품 위험',     color: 'warning' },
          ].map((k) => (
            <Paper key={k.label} variant="outlined" sx={{ p: 1.5, flex: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{k.label}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: `${k.color}.main`, mt: 0.5 }}>{k.value}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{k.detail}</Typography>
            </Paper>
          ))}
        </Stack>

        {/* Log + Validation */}
        <Stack direction="row" spacing={1.5} sx={{ flex: 1, minHeight: 0 }}>
          <Box sx={{ flex: 1.4, minWidth: 0 }}>
            <CbLogPane lines={LOG_LINES} title="시뮬레이션 로그" />
          </Box>
          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <WarningAmberIcon fontSize="small" color="warning" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>기준정보 점검 결과</Typography>
                <Chip label="2 WARN" size="small" color="warning" variant="outlined" />
                <Chip label="1 INFO" size="small" color="info" variant="outlined" />
                <Box sx={{ flexGrow: 1 }} />
                <Button size="small" startIcon={<SearchIcon />}>상세</Button>
              </Stack>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'center' }}>구분</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'center' }}>품목</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 70, textAlign: 'center' }}>라인</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 70, textAlign: 'center' }}>레벨</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>메시지</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {VALIDATION_ROWS.map((r, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.CATEGORY}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.ITEM}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.LINE}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip label={r.LEVEL} size="small" color={LVL_COLOR[r.LEVEL] || 'default'} variant="outlined" />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{r.MSG}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Stack>
      </Box>
    </MockShell>
  );
}

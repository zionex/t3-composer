import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// KTNG — DP 결재 요청 현황
// UI_DP_KTNG_APV → DpKtngApv.jsx
//   결재 진행 / 완료 / 반려 리스트

const ROWS = [
  { APV_NO: 'APV-2026-0612-001', REQ_DT: '2026-06-12 09:15', REQUESTER: '김영수 (영업1팀)', TYPE: '판매계획 V2026-06_SIM', AMOUNT: 1850000, STATUS: 'APPROVED',  CURRENT_STEP: '완료',         APPROVER: '박부장',  ELAPSED: '1d 4h' },
  { APV_NO: 'APV-2026-0612-002', REQ_DT: '2026-06-12 14:30', REQUESTER: '이지훈 (영업2팀)', TYPE: '판매계획 조정 +5%',    AMOUNT: 985000,  STATUS: 'IN_PROGRESS', CURRENT_STEP: 'PM 검토',      APPROVER: '최팀장',  ELAPSED: '0d 18h' },
  { APV_NO: 'APV-2026-0613-001', REQ_DT: '2026-06-13 10:05', REQUESTER: '박수민 (슈퍼팀)',  TYPE: '판매계획 V2026-06_SIM', AMOUNT: 720000,  STATUS: 'IN_PROGRESS', CURRENT_STEP: 'S&OP 확정',    APPROVER: '정이사',  ELAPSED: '0d 6h'  },
  { APV_NO: 'APV-2026-0613-002', REQ_DT: '2026-06-13 11:22', REQUESTER: '최민지 (수출본부)', TYPE: '수출 프로모션 신규',    AMOUNT: 320000,  STATUS: 'REJECTED',    CURRENT_STEP: '반려',         APPROVER: '윤본부장', ELAPSED: '0d 2h'  },
  { APV_NO: 'APV-2026-0614-001', REQ_DT: '2026-06-14 09:00', REQUESTER: '장민호 (CIS팀)',   TYPE: '러시아 시장 추가 발주',  AMOUNT: 1250000, STATUS: 'PENDING',     CURRENT_STEP: '담당자 검토',  APPROVER: '-',       ELAPSED: '0d 0h'  },
  { APV_NO: 'APV-2026-0614-002', REQ_DT: '2026-06-14 14:11', REQUESTER: '김다혜 (PM)',     TYPE: '신제품 출시 계획',      AMOUNT: 580000,  STATUS: 'PENDING',     CURRENT_STEP: '담당자 검토',  APPROVER: '-',       ELAPSED: '0d 0h'  },
];

const STATUS_META = {
  APPROVED:    { icon: CheckCircleIcon,    color: '#10b981', label: '승인' },
  IN_PROGRESS: { icon: HourglassEmptyIcon, color: '#3b82f6', label: '진행중' },
  PENDING:     { icon: HourglassEmptyIcon, color: '#9ca3af', label: '대기' },
  REJECTED:    { icon: CancelIcon,         color: '#ef4444', label: '반려' },
};

const counts = ROWS.reduce((acc, r) => { acc[r.STATUS] = (acc[r.STATUS] || 0) + 1; return acc; }, {});

export default function KtngDpApprovalMockup() {
  return (
    <MockShell
      patternCode="ktng_dp_approval"
      patternLabel="KTNG — DP 결재 요청 현황"
      layoutCategory="LAYOUT_SINGLE"
      description="UI_DP_KTNG_APV → DpKtngApv.jsx. 판매계획 / 프로모션 / 발주 결재 요청 진행 현황. 상단 STATUS 칩 카운트 + 그리드 (APV_NO/요청일시/요청자/유형/금액/STATUS/현재단계/결재자/경과시간). 셀 데이터는 KTNG 도메인 (영업1팀/2팀/슈퍼팀/수출본부/CIS팀/PM)."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="REQ_DT" size="small" value="2026-06-01 ~ 06-30" sx={{ width: 200 }} />
          <TextField label="STATUS" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="APPROVED">승인</MenuItem>
            <MenuItem value="IN_PROGRESS">진행중</MenuItem>
            <MenuItem value="PENDING">대기</MenuItem>
            <MenuItem value="REJECTED">반려</MenuItem>
          </TextField>
          <TextField label="REQUESTER" size="small" select value="ALL" sx={{ width: 160 }}><MenuItem value="ALL">전체</MenuItem></TextField>
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        {Object.keys(STATUS_META).map((s) => (
          <Chip key={s} label={`${STATUS_META[s].label} ${counts[s] || 0}건`} size="small" variant="outlined" sx={{ color: STATUS_META[s].color, fontWeight: 600 }} />
        ))}
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
      </Box>

      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead><TableRow>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, fontFamily: 'monospace' }}>APV_NO</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>요청일시</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11 }}>요청자</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11 }}>유형</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'right' }}>AMOUNT (천원)</TableCell>
                <TableCell sx={{ bgcolor: '#fef3c7', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>STATUS</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11 }}>현재 단계</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11 }}>결재자</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'right' }}>경과</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {ROWS.map((r, i) => {
                  const Icon = STATUS_META[r.STATUS].icon;
                  return (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{r.APV_NO}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>{r.REQ_DT}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.REQUESTER}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.TYPE}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 600 }}>{r.AMOUNT.toLocaleString()}</TableCell>
                      <TableCell sx={{ fontSize: 11, textAlign: 'center' }}>
                        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                          <Icon sx={{ fontSize: 14, color: STATUS_META[r.STATUS].color }} />
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: STATUS_META[r.STATUS].color }}>{STATUS_META[r.STATUS].label}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.CURRENT_STEP}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.APPROVER}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', color: 'text.secondary' }}>{r.ELAPSED}</TableCell>
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

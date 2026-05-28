import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Paper, Avatar,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// DpKtngApv — 결재 요청 현황 (수요계획 결재 워크플로)
// 운영 styleCallback 컬럼: [ID, TITLE, APV_TYPE, APV_REQUEST, APV_ADMIN_STATUS]

const SUMMARY = [
  { label: '결재 대기',  count: 8,  color: 'warning', icon: HourglassEmptyIcon },
  { label: '진행 중',    count: 5,  color: 'info',    icon: HourglassEmptyIcon },
  { label: '승인',       count: 32, color: 'success', icon: CheckCircleIcon },
  { label: '반려',       count: 3,  color: 'error',   icon: CancelIcon },
];

const ROWS = [
  { APRV_NO: 'APV-2026052201', TITLE: 'V2026-06 판매계획 결재 요청 (국내)',  REQUESTER: '김민수', DEPT: '영업1팀', REQUEST_DT: '2026-05-22 08:30', STATUS: 'pending',   STEP: '1/3', AMOUNT: '482.5M' },
  { APRV_NO: 'APV-2026052102', TITLE: 'V2026-06 NGP 신제품 수요계획',         REQUESTER: '정재현', DEPT: 'NGP팀',   REQUEST_DT: '2026-05-21 14:22', STATUS: 'in_review', STEP: '2/3', AMOUNT: '142.0M' },
  { APRV_NO: 'APV-2026052101', TITLE: 'V2026-06 수출 수요계획 (인도네시아)', REQUESTER: '박글로벌',DEPT: '수출팀', REQUEST_DT: '2026-05-21 10:15', STATUS: 'in_review', STEP: '2/3', AMOUNT: '215.8M' },
  { APRV_NO: 'APV-2026052003', TITLE: 'V2026-05 보정 — KING-RED 6월',         REQUESTER: '이정훈', DEPT: '영업1팀', REQUEST_DT: '2026-05-20 16:45', STATUS: 'approved',  STEP: '3/3', AMOUNT:  '38.5M' },
  { APRV_NO: 'APV-2026052002', TITLE: 'V2026-05 PSI 결재 (수출)',              REQUESTER: '박글로벌',DEPT: '수출팀', REQUEST_DT: '2026-05-20 11:08', STATUS: 'approved',  STEP: '3/3', AMOUNT: '125.4M' },
  { APRV_NO: 'APV-2026051905', TITLE: 'V2026-05 illuvia 디바이스 무료 증정',  REQUESTER: '송하늘', DEPT: 'NGP팀',   REQUEST_DT: '2026-05-19 09:32', STATUS: 'rejected',  STEP: '-',   AMOUNT:  '45.0M' },
  { APRV_NO: 'APV-2026051904', TITLE: 'V2026-05 SLIM 수출 추가요청',           REQUESTER: '김민수', DEPT: '영업1팀', REQUEST_DT: '2026-05-19 13:10', STATUS: 'approved',  STEP: '3/3', AMOUNT:  '62.8M' },
];

const STATUS_INFO = {
  pending:   { label: '결재대기', color: 'warning', tone: 'pending'  },
  in_review: { label: '진행중',   color: 'info',    tone: 'info'     },
  approved:  { label: '승인',     color: 'success', tone: 'success'  },
  rejected:  { label: '반려',     color: 'error',   tone: 'danger'   },
};

export default function DpApprovalMockup() {
  return (
    <MockShell patternCode="ktng_dp_approval" patternLabel="KTNG — 결재 요청 현황 (DpKtngApv)"
      layoutCategory="LAYOUT_SINGLE" description="수요계획 결재 워크플로 — 단계별 결재 상태 + 요청 상세.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="상태" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="pending">결재대기</MenuItem><MenuItem value="approved">승인</MenuItem>
          </TextField>
          <TextField label="요청자" size="small" value="" placeholder="요청자명" sx={{ width: 150 }} />
          <TextField label="부서" size="small" select value="ALL" sx={{ width: 140 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="영업1팀">영업1팀</MenuItem>
            <MenuItem value="NGP팀">NGP팀</MenuItem><MenuItem value="수출팀">수출팀</MenuItem>
          </TextField>
          <TextField label="요청일" size="small" value="2026-05-15 ~ 2026-05-22" sx={{ width: 200 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        <Stack direction="row" spacing={1.5}>
          {SUMMARY.map((s) => {
            const Icon = s.icon;
            return (
              <Paper key={s.label} variant="outlined" sx={{ p: 1.5, flex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar sx={{ backgroundColor: `${s.color}.light`, color: `${s.color}.dark`, width: 40, height: 40 }}>
                    <Icon />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: `${s.color}.main` }}>{s.count}</Typography>
                  </Box>
                </Stack>
              </Paper>
            );
          })}
        </Stack>

        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 260 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>결재 요청 리스트</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['결재번호','제목','요청자','부서','요청일시','단계','금액 (예상)','상태','액션'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                      textAlign: c === '금액 (예상)' ? 'right' : (['단계','상태','액션'].includes(c) ? 'center' : 'left') }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => {
                  const info = STATUS_INFO[r.STATUS];
                  const tone = info.tone;
                  return (
                    <TableRow key={i} hover>
                      <TableCell sx={cellSx(tone, { mono: true })}>{r.APRV_NO}</TableCell>
                      <TableCell sx={cellSx(tone)}>{r.TITLE}</TableCell>
                      <TableCell sx={cellSx(tone)}>{r.REQUESTER}</TableCell>
                      <TableCell>{r.DEPT}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.REQUEST_DT}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>
                        <Chip size="small" label={r.STEP} variant="outlined" color={r.STATUS === 'pending' ? 'warning' : r.STATUS === 'approved' ? 'success' : 'info'} />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.AMOUNT}</TableCell>
                      <TableCell sx={cellSx(tone, { align: 'center' })}><Chip size="small" label={info.label} color={info.color} /></TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        {r.STATUS === 'pending' || r.STATUS === 'in_review' ?
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Button size="small" variant="contained" color="success">승인</Button>
                            <Button size="small" variant="outlined" color="error">반려</Button>
                          </Stack> :
                          <Button size="small" variant="text">상세</Button>}
                      </TableCell>
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

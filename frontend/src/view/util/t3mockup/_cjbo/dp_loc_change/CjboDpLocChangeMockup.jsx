import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// CJBO — 창고 변경 관리 (DpLocChange)
// UI_DP_LOC_CHANGE — 출고 창고 변경 (현재 → 신규) + 적용 기간 + 사유

const ROWS = [
  { ITEM: 'illuvia 비건마스크 5매',     CUST: '쿠팡',          OLD_LOC: '경기 광주 1물류센터', NEW_LOC: '경기 이천 2물류센터', FROM_DT: '2026-07-01', TO_DT: '9999-12-31', REASON: '용량 부족',     STATUS: 'approved' },
  { ITEM: 'illuvia 토너 200ml',          CUST: '올리브영',     OLD_LOC: '경기 광주 1물류센터', NEW_LOC: '인천 GLC',             FROM_DT: '2026-07-01', TO_DT: '9999-12-31', REASON: '거리 단축',     STATUS: 'approved' },
  { ITEM: 'CJ Brand KING-RED',           CUST: '베트남 KGS',   OLD_LOC: '부산항 BPA',           NEW_LOC: '인천항 ICT',           FROM_DT: '2026-08-01', TO_DT: '2026-12-31', REASON: '선박 스케줄',   STATUS: 'pending' },
  { ITEM: 'illuvia MASK',                CUST: '인니 INDOMA',  OLD_LOC: '부산항 BPA',           NEW_LOC: '광양항 GPA',           FROM_DT: '2026-09-01', TO_DT: '9999-12-31', REASON: '운임 절감',     STATUS: 'pending' },
  { ITEM: 'illuvia 크림 50g',            CUST: 'GS25',          OLD_LOC: '경기 이천 2물류센터', NEW_LOC: '경기 광주 1물류센터', FROM_DT: '2026-06-15', TO_DT: '2026-12-31', REASON: '재고 운영',     STATUS: 'rejected' },
];

const STATUS_INFO = {
  approved: { label: '승인', color: 'success', tone: 'success' },
  pending:  { label: '대기', color: 'warning', tone: 'warning' },
  rejected: { label: '반려', color: 'error',   tone: 'danger'  },
};

export default function CjboDpLocChangeMockup() {
  return (
    <MockShell patternCode="cjbo_dp_loc_change" patternLabel="CJBO — 창고 변경 관리 (DpLocChange)"
      layoutCategory="LAYOUT_SINGLE"
      description="품목-거래처별 출고 창고 변경 (현재→신규) + 적용 기간 + 사유 + 승인 단계. UI_DP_LOC_CHANGE.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="품목" size="small" value="" placeholder="[🔍]" sx={{ width: 200 }} />
          <TextField label="거래처" size="small" value="" placeholder="[🔍]" sx={{ width: 200 }} />
          <TextField label="창고 (현재)" size="small" select value="ALL" sx={{ width: 180 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="GJ1">경기 광주 1물류센터</MenuItem>
            <MenuItem value="IC2">경기 이천 2물류센터</MenuItem>
          </TextField>
          <TextField label="적용일" size="small" value="2026-06-04" sx={{ width: 140 }} />
          <TextField label="상태" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="A">승인</MenuItem><MenuItem value="P">대기</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1, overflow: 'auto' }}>
        <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">변경 요청 <b>{ROWS.length}</b>건</Typography>
          <Chip size="small" label={`승인 ${ROWS.filter(r => r.STATUS === 'approved').length}`} color="success" variant="outlined" />
          <Chip size="small" label={`대기 ${ROWS.filter(r => r.STATUS === 'pending').length}`} color="warning" variant="outlined" />
          <Chip size="small" label={`반려 ${ROWS.filter(r => r.STATUS === 'rejected').length}`} color="error" variant="outlined" />
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" startIcon={<AddIcon />} variant="outlined">변경 요청 추가</Button>
          <Button size="small" startIcon={<SaveIcon />} variant="contained" color="success">일괄 승인</Button>
        </Paper>

        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['품목','거래처','현재 창고','→','신규 창고','시작일','종료일','사유','상태','액션'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                      textAlign: c === '→' || ['시작일','종료일','상태','액션'].includes(c) ? 'center' : 'left' }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => {
                  const info = STATUS_INFO[r.STATUS];
                  return (
                    <TableRow key={i} hover>
                      <TableCell>{r.ITEM}</TableCell>
                      <TableCell>{r.CUST}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="body2" sx={{ fontSize: 13 }}>{r.OLD_LOC}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}><ArrowForwardIcon sx={{ fontSize: 16, color: 'primary.main' }} /></TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <LocationOnIcon sx={{ fontSize: 14, color: 'success.main' }} />
                          <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600, color: 'success.main' }}>{r.NEW_LOC}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 12 }}>{r.FROM_DT}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 12 }}>{r.TO_DT}</TableCell>
                      <TableCell sx={cellSx(info.tone)}>{r.REASON}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip size="small" label={info.label} color={info.color} />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        {r.STATUS === 'pending' ? (
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Button size="small" variant="contained" color="success">승인</Button>
                            <Button size="small" variant="outlined" color="error">반려</Button>
                          </Stack>
                        ) : <Button size="small" variant="text">상세</Button>}
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

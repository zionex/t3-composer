import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// OronMp07 — 공장이동 요청/확정 (반제품/원부자재/외자)
// UI_MP_ORN_HALB_MOVE, UI_MP_ORN_MAT_MOVE, UI_MP_ORN_MAT_MOVE_VN, UI_MP_ORN_MAT_MOVE_HQ

const MOVE_ROWS = [
  { REQ_NO: 'MV-2026-0421', FROM: '제천공장', TO: '익산공장', ITEM_CD: 'H10001', ITEM_NM: '시트마스크 베이스',     QTY: 5000,   UOM: 'PCS', REQ_DT: '2026-05-30', ETA: '2026-06-02', TYPE: 'HALB',    STATUS: 'REQUESTED' },
  { REQ_NO: 'MV-2026-0422', FROM: '익산공장', TO: '제천공장', ITEM_CD: 'M20011', ITEM_NM: '세럼 베이스액',         QTY: 1200,   UOM: 'kg',  REQ_DT: '2026-05-29', ETA: '2026-05-31', TYPE: 'MAT',     STATUS: 'CONFIRMED' },
  { REQ_NO: 'MV-2026-0423', FROM: 'VN-HCMC',   TO: '제천공장', ITEM_CD: 'M20003', ITEM_NM: '하이알루론산 원료',     QTY: 200,    UOM: 'kg',  REQ_DT: '2026-06-15', ETA: '2026-07-12', TYPE: 'IMPORT',  STATUS: 'IN_TRANSIT' },
  { REQ_NO: 'MV-2026-0424', FROM: 'CN-WUXI',  TO: '익산공장', ITEM_CD: 'M20021', ITEM_NM: '토너 원료액',           QTY: 500,    UOM: 'kg',  REQ_DT: '2026-06-20', ETA: '2026-07-25', TYPE: 'IMPORT',  STATUS: 'HQ_PENDING' },
  { REQ_NO: 'MV-2026-0425', FROM: '제천공장', TO: '익산공장', ITEM_CD: 'H10011', ITEM_NM: '세럼 베이스 반제품',     QTY: 3500,   UOM: 'PCS', REQ_DT: '2026-05-28', ETA: '2026-05-30', TYPE: 'HALB',    STATUS: 'CONFIRMED' },
  { REQ_NO: 'MV-2026-0426', FROM: '익산공장', TO: 'CN-WUXI',  ITEM_CD: 'P30001', ITEM_NM: '알루미늄 파우치',       QTY: 12000,  UOM: 'PCS', REQ_DT: '2026-06-05', ETA: '2026-06-25', TYPE: 'IMPORT',  STATUS: 'REQUESTED' },
];

const TYPE_COLOR  = { HALB: 'info', MAT: 'success', IMPORT: 'warning' };
const STATUS_INFO = {
  REQUESTED:  { color: 'default', label: '요청'        },
  HQ_PENDING: { color: 'warning', label: '본사 대기'   },
  CONFIRMED:  { color: 'primary', label: '확정'        },
  IN_TRANSIT: { color: 'info',    label: '운송중'      },
  DELIVERED:  { color: 'success', label: '완료'        },
};

export default function OronMpMaterialMoveMockup() {
  return (
    <MockShell
      patternCode="oron_mp_material_move"
      patternLabel="ORON — 공장이동 요청·확정 (반제품/자재/외자)"
      layoutCategory="LAYOUT_SINGLE"
      description="공장간 자재 이동 요청 → 본사 확정 → 운송 → 도착 워크플로우. 외자(VN/CN) 통관 포함. UI_MP_ORN_HALB_MOVE, MAT_MOVE, MAT_MOVE_VN, MAT_MOVE_HQ."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="요청공장" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="JC">제천공장</MenuItem>
            <MenuItem value="IS">익산공장</MenuItem>
          </TextField>
          <TextField label="유형" size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="HALB">반제품</MenuItem>
            <MenuItem value="MAT">원부자재</MenuItem>
            <MenuItem value="IMPORT">외자</MenuItem>
          </TextField>
          <TextField label="상태" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="REQUESTED">요청</MenuItem>
            <MenuItem value="CONFIRMED">확정</MenuItem>
            <MenuItem value="IN_TRANSIT">운송중</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-05-28 ~ 2026-07-30" sx={{ width: 200 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="contained" size="small" color="success" startIcon={<CheckCircleIcon />}>본사 일괄 확정</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, height: '100%' }}>
        <Paper variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <LocalShippingIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>공장 이동 요청 현황 — 6건</Typography>
              <Chip label="HALB 2" size="small" color="info" variant="outlined" />
              <Chip label="MAT 1" size="small" color="success" variant="outlined" />
              <Chip label="IMPORT 3" size="small" color="warning" variant="outlined" />
            </Stack>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 140, textAlign: 'center' }}>요청번호</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>FROM</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>TO</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>품목코드</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 200 }}>품목명</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'right' }}>수량</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 60, textAlign: 'center' }}>UOM</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>요청일</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>도착예정</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'center' }}>유형</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {MOVE_ROWS.map((r, i) => {
                  const st = STATUS_INFO[r.STATUS] || STATUS_INFO.REQUESTED;
                  return (
                    <TableRow key={i} hover>
                      <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.REQ_NO}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontSize: 12 }}>{r.FROM}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontSize: 12 }}>{r.TO}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.ITEM_CD}</TableCell>
                      <TableCell>{r.ITEM_NM}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{r.QTY.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>{r.UOM}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.REQ_DT}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.ETA}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}><Chip label={r.TYPE} size="small" color={TYPE_COLOR[r.TYPE]} variant="outlined" /></TableCell>
                      <TableCell sx={{ textAlign: 'center' }}><Chip label={st.label} size="small" color={st.color} /></TableCell>
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

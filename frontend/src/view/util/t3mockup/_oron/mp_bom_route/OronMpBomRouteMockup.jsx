import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// OronMp02 — BOM 관리 + 생산순서 정의 (좌우 분할 — H2)
// UI_MP_ORN_BOM, UI_MP_ORN_PROD_SEQ

const BOM_TREE = [
  { lv: 0, code: 'F01001', name: '오론 비건마스크 시그니처 5매', qty: 1,    uom: 'EA',  type: 'FERT' },
  { lv: 1, code: 'H10001', name: '시트마스크 베이스 (5매)',       qty: 1,    uom: 'PCS', type: 'HALB' },
  { lv: 2, code: 'M20001', name: '에센스 베이스액',                 qty: 25,   uom: 'g',   type: 'ROH' },
  { lv: 2, code: 'M20002', name: '시트 부직포 100*120',            qty: 5,    uom: 'PCS', type: 'ROH' },
  { lv: 2, code: 'M20003', name: '하이알루론산 원료',                qty: 0.5,  uom: 'g',   type: 'ROH' },
  { lv: 1, code: 'H10002', name: '5매 파우치 포장',                 qty: 1,    uom: 'PCS', type: 'HALB' },
  { lv: 2, code: 'P30001', name: '알루미늄 파우치 (5매)',           qty: 1,    uom: 'PCS', type: 'PACK' },
  { lv: 2, code: 'P30002', name: '인쇄잉크 (블랙)',                  qty: 0.3,  uom: 'g',   type: 'PACK' },
  { lv: 1, code: 'P30003', name: '단상자 (BOX)',                     qty: 0.025,uom: 'PCS', type: 'PACK' },
];

const SEQ_ROWS = [
  { LINE_CD: 'L-001', LINE_NM: '에센스 충전 #1',  PROC_SEQ: 10, FROM_ITEM: 'M20001', TO_ITEM: 'H10001', SETUP_HR: 0.5, RUN_RATE: 1200, UOM: 'EA/H' },
  { LINE_CD: 'L-001', LINE_NM: '에센스 충전 #1',  PROC_SEQ: 20, FROM_ITEM: 'H10001', TO_ITEM: 'H10002', SETUP_HR: 0.3, RUN_RATE: 900,  UOM: 'EA/H' },
  { LINE_CD: 'L-002', LINE_NM: '포장 라인 A',     PROC_SEQ: 30, FROM_ITEM: 'H10002', TO_ITEM: 'F01001', SETUP_HR: 0.5, RUN_RATE: 600,  UOM: 'EA/H' },
  { LINE_CD: 'L-003', LINE_NM: '세럼 충전 #2',    PROC_SEQ: 10, FROM_ITEM: 'M20011', TO_ITEM: 'H10011', SETUP_HR: 0.8, RUN_RATE: 800,  UOM: 'EA/H' },
  { LINE_CD: 'L-003', LINE_NM: '세럼 충전 #2',    PROC_SEQ: 20, FROM_ITEM: 'H10011', TO_ITEM: 'F01002', SETUP_HR: 0.3, RUN_RATE: 600,  UOM: 'EA/H' },
  { LINE_CD: 'L-004', LINE_NM: '튜브 충전 #3',    PROC_SEQ: 10, FROM_ITEM: 'M20021', TO_ITEM: 'F01003', SETUP_HR: 1.0, RUN_RATE: 1500, UOM: 'EA/H' },
];

const TYPE_COLOR = { FERT: 'primary', HALB: 'info', ROH: 'success', PACK: 'warning' };

function BomTree() {
  return (
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <AccountTreeIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>BOM 구조 (오론 비건마스크)</Typography>
          <Chip label="Lv3 전개" size="small" variant="outlined" />
        </Stack>
      </Box>
      <TableContainer sx={{ flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 200 }}>품목</TableCell>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, textAlign: 'center', width: 70 }}>유형</TableCell>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, textAlign: 'right',  width: 70 }}>소요량</TableCell>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, textAlign: 'center', width: 60 }}>UOM</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {BOM_TREE.map((r, i) => (
              <TableRow key={i} hover>
                <TableCell>
                  <span style={{ paddingLeft: r.lv * 16, fontFamily: 'monospace' }}>
                    {r.lv > 0 ? '└─ ' : ''}{r.code}
                  </span>
                  <span style={{ marginLeft: 8, color: '#374151' }}>{r.name}</span>
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Chip label={r.type} size="small" color={TYPE_COLOR[r.type] || 'default'} variant="outlined" />
                </TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.qty}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{r.uom}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function SeqGrid() {
  return (
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>생산순서 정의 (라인×공정)</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SaveIcon />}>저장</Button>
        </Stack>
      </Box>
      <TableContainer sx={{ flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'center' }}>LINE_CD</TableCell>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 140 }}>라인명</TableCell>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 70,  textAlign: 'center' }}>SEQ</TableCell>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>FROM</TableCell>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>TO</TableCell>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80,  textAlign: 'right' }}>SETUP(H)</TableCell>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 90,  textAlign: 'right' }}>RUN_RATE</TableCell>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 70,  textAlign: 'center' }}>UOM</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {SEQ_ROWS.map((r, i) => (
              <TableRow key={i} hover>
                <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.LINE_CD}</TableCell>
                <TableCell>{r.LINE_NM}</TableCell>
                <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.PROC_SEQ}</TableCell>
                <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.FROM_ITEM}</TableCell>
                <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.TO_ITEM}</TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.SETUP_HR.toFixed(1)}</TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.RUN_RATE.toLocaleString()}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{r.UOM}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default function OronMpBomRouteMockup() {
  return (
    <MockShell
      patternCode="oron_mp_bom_route"
      patternLabel="ORON — BOM + 생산순서 정의"
      layoutCategory="LAYOUT_H2"
      description="좌측 BOM 트리 (FERT → HALB → ROH/PACK 다단 전개) + 우측 생산순서 정의 (라인별 공정 SEQ + SETUP_HR + RUN_RATE). UI_MP_ORN_BOM, UI_MP_ORN_PROD_SEQ."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="PLAN_SCOPE" size="small" select value="ORN_MP" sx={{ width: 140 }}>
            <MenuItem value="ORN_MP">ORN_MP</MenuItem>
          </TextField>
          <TextField label="VER_CD" size="small" select value="V2026-05" sx={{ width: 140 }}>
            <MenuItem value="V2026-05">V2026-05</MenuItem>
            <MenuItem value="V2026-04">V2026-04</MenuItem>
          </TextField>
          <TextField label="기준 품목" size="small" value="F01001 / 오론 비건마스크 시그니처 5매" sx={{ width: 320 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>BOM 전개</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', gap: 1.5, height: '100%' }}>
        <Box sx={{ flex: '0 0 42%', minWidth: 0 }}>
          <BomTree />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <SeqGrid />
        </Box>
      </Box>
    </MockShell>
  );
}

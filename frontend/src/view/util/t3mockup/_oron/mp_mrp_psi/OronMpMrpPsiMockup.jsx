import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// OronMp06 — 원부자재 발주요청 + PSI 조회 + 자재별 재고
// UI_MP_ORN_MRP_TOT, MRP_LOC, MRP_TOT_VN, MAT_PSI, FERT_PSI, STOCK_MGMT

const PSI_FIXED = [
  { name: 'PLANT',   label: '공장',    width: 90 },
  { name: 'ITEM_CD', label: '품목',    width: 110 },
  { name: 'ITEM_NM', label: '품목명',  width: 200 },
  { name: 'MEASURE', label: 'MEASURE', width: 120 },
];
const PSI_WEEKS = ['W22','W23','W24','W25','W26','W27','W28','W29'];

const PSI_ROWS = [
  { PLANT: '제천', ITEM_CD: 'M20001', ITEM_NM: '에센스 베이스액',         MEASURE: '수요(P+S)', vals: [3200, 3400, 3500, 3600, 3700, 3800, 3900, 4000] },
  { PLANT: '제천', ITEM_CD: 'M20001', ITEM_NM: '에센스 베이스액',         MEASURE: '입고(O)',   vals: [3000, 3500, 3500, 3700, 3700, 3800, 4000, 4000] },
  { PLANT: '제천', ITEM_CD: 'M20001', ITEM_NM: '에센스 베이스액',         MEASURE: '기말재고',  vals: [1800, 1900, 1900, 2000, 2000, 2000, 2100, 2100] },
  { PLANT: '제천', ITEM_CD: 'M20002', ITEM_NM: '시트 부직포 100*120',     MEASURE: '수요(P+S)', vals: [22500,23800,24600,25200,26000,26700,27300,28000] },
  { PLANT: '제천', ITEM_CD: 'M20002', ITEM_NM: '시트 부직포 100*120',     MEASURE: '입고(O)',   vals: [25000,25000,25000,25000,25000,28000,28000,28000] },
  { PLANT: '제천', ITEM_CD: 'M20002', ITEM_NM: '시트 부직포 100*120',     MEASURE: '기말재고',  vals: [4500, 5700, 6100, 5900, 4900, 6200, 6900, 6900] },
  { PLANT: '익산', ITEM_CD: 'M20003', ITEM_NM: '하이알루론산 원료',        MEASURE: '수요(P+S)', vals: [55,   58,   60,   62,   64,   66,   68,   70  ] },
  { PLANT: '익산', ITEM_CD: 'M20003', ITEM_NM: '하이알루론산 원료',        MEASURE: '입고(O)',   vals: [50,   60,   60,   70,   60,   70,   70,   70  ] },
  { PLANT: '익산', ITEM_CD: 'M20003', ITEM_NM: '하이알루론산 원료',        MEASURE: '기말재고',  vals: [15,   17,   17,   25,   21,   25,   27,   27  ] },
];

const PO_ROWS = [
  { PLANT: '제천', ITEM_CD: 'M20001', VENDOR: '대원케미컬',  REQ_DT: '2026-05-30', QTY: 3500,  UOM: 'kg', LEAD_TM: 7,  TYPE: 'LOCAL', STATUS: 'DRAFT' },
  { PLANT: '제천', ITEM_CD: 'M20002', VENDOR: '한솔부직포',  REQ_DT: '2026-05-29', QTY: 25000, UOM: 'PCS',LEAD_TM: 14, TYPE: 'LOCAL', STATUS: 'SENT' },
  { PLANT: '제천', ITEM_CD: 'M20003', VENDOR: 'Hyaluron Co', REQ_DT: '2026-06-15', QTY: 100,   UOM: 'kg', LEAD_TM: 30, TYPE: 'IMPORT',STATUS: 'DRAFT' },
  { PLANT: '익산', ITEM_CD: 'P30001', VENDOR: '동양인쇄',    REQ_DT: '2026-05-28', QTY: 8000,  UOM: 'PCS',LEAD_TM: 5,  TYPE: 'LOCAL', STATUS: 'SENT' },
  { PLANT: '익산', ITEM_CD: 'P30002', VENDOR: 'INK Global',  REQ_DT: '2026-06-20', QTY: 50,   UOM: 'kg', LEAD_TM: 45, TYPE: 'IMPORT',STATUS: 'PLAN' },
];

const STATUS_COLOR = { DRAFT: 'default', SENT: 'primary', CONFIRMED: 'success', PLAN: 'info' };
const TYPE_COLOR = { LOCAL: 'success', IMPORT: 'warning' };

function PsiCrosstab() {
  return (
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>원부자재 PSI (주별)</Typography>
          <Chip label="공장×품목×Measure" size="small" variant="outlined" />
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" startIcon={<DownloadIcon />}>Excel</Button>
        </Stack>
      </Box>
      <TableContainer sx={{ flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {PSI_FIXED.map((c) => (
                <TableCell key={c.name} sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: c.width, textAlign: c.name === 'ITEM_NM' ? 'left' : 'center' }}>{c.label}</TableCell>
              ))}
              {PSI_WEEKS.map((w) => (
                <TableCell key={w} sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 75, textAlign: 'right' }}>{w}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {PSI_ROWS.map((r, i) => (
              <TableRow key={i} hover sx={{ bgcolor: r.MEASURE === '기말재고' ? '#f9fafb' : 'transparent' }}>
                <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.PLANT}</TableCell>
                <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.ITEM_CD}</TableCell>
                <TableCell>{r.ITEM_NM}</TableCell>
                <TableCell sx={{ textAlign: 'center', fontWeight: 600, color: r.MEASURE === '기말재고' ? '#1565c0' : '#374151' }}>{r.MEASURE}</TableCell>
                {r.vals.map((v, j) => (
                  <TableCell key={j} sx={{ textAlign: 'right', fontFamily: 'monospace', color: r.MEASURE === '기말재고' && v < 1000 && r.ITEM_CD === 'M20003' ? '#c62828' : '#374151', fontWeight: r.MEASURE === '기말재고' ? 700 : 400 }}>
                    {v.toLocaleString()}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function PoGrid() {
  return (
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>원부자재 발주요청 (통합/내자/외자)</Typography>
          <Chip label="DRAFT 3 / SENT 2 / PLAN 1" size="small" variant="outlined" />
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" variant="contained" color="primary" startIcon={<SendIcon />}>발주 송신</Button>
        </Stack>
      </Box>
      <TableContainer sx={{ flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'center' }}>공장</TableCell>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>품목</TableCell>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 140 }}>거래처</TableCell>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>요청일</TableCell>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'right' }}>수량</TableCell>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 70, textAlign: 'center' }}>UOM</TableCell>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 70, textAlign: 'right' }}>L/T</TableCell>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'center' }}>구분</TableCell>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'center' }}>상태</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {PO_ROWS.map((r, i) => (
              <TableRow key={i} hover>
                <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.PLANT}</TableCell>
                <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.ITEM_CD}</TableCell>
                <TableCell>{r.VENDOR}</TableCell>
                <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.REQ_DT}</TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{r.QTY.toLocaleString()}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{r.UOM}</TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.LEAD_TM}d</TableCell>
                <TableCell sx={{ textAlign: 'center' }}><Chip label={r.TYPE} size="small" color={TYPE_COLOR[r.TYPE]} variant="outlined" /></TableCell>
                <TableCell sx={{ textAlign: 'center' }}><Chip label={r.STATUS} size="small" color={STATUS_COLOR[r.STATUS] || 'default'} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default function OronMpMrpPsiMockup() {
  const [tab, setTab] = React.useState(0);
  return (
    <MockShell
      patternCode="oron_mp_mrp_psi"
      patternLabel="ORON — 원부자재 발주요청 + PSI"
      layoutCategory="LAYOUT_SINGLE"
      description="원부자재 PSI 크로스탭(주별) + 발주요청 (내자/외자/통합) + 자재별 재고. UI_MP_ORN_MRP_TOT/MRP_LOC/MRP_TOT_VN/MAT_PSI/FERT_PSI/STOCK_MGMT."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="공장" size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="JC">제천</MenuItem>
            <MenuItem value="IS">익산</MenuItem>
          </TextField>
          <TextField label="자재유형" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="ROH">ROH</MenuItem>
            <MenuItem value="PACK">PACK</MenuItem>
          </TextField>
          <TextField label="발주구분" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="LOCAL">내자</MenuItem>
            <MenuItem value="IMPORT">외자</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-W22 ~ W29" sx={{ width: 170 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label="자재 PSI" />
          <Tab label="발주요청 (통합)" />
          <Tab label="자재별 재고" />
        </Tabs>
      </Box>
      <Box sx={{ p: 1.5, height: '100%' }}>
        {tab === 0 ? <PsiCrosstab /> : <PoGrid />}
      </Box>
    </MockShell>
  );
}

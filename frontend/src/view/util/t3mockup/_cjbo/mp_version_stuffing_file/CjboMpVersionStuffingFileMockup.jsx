import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Checkbox,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import MockShell from '../../_shared/MockShell';

const VERSTUF_ROWS = [
  { CHK_STUFFING: true,  SIMUL_VER_ID: 'SIMUL_V2026-06-A', STUFFING_ID: 'STF-2026062501', PROD_LOCAT_CD: 'KR-PLT1', PROD_LOCAT_NM: '한국 사업장1', SALES_LOCAT_CD: 'VN-HCM', SALES_LOCAT_NM: '베트남 호치민',   ODR_INVOICE_NO: 'INV-2026-VN-0042', ODR_INVOICE_SEQ: 1, ODR_ORDER_TYPE: 'STD',   ODR_PH1_CD: 'AN', ODR_PH1_NM: 'Animal Nutrition', ODR_ITEM_MATERIAL_CD: 'L-LYS-78L', ODR_ITEM_PACK_UNIT: 'DRUM-1000L', ODR_QTY: 120000, ODR_PROD_QTY: 120000, ODR_PROD_QTY_PD: 110000, PROD_INBN_PNDG_QTY_MT: 110.0, ODR_STUFFING_DATE: '06-15-2026' },
  { CHK_STUFFING: false, SIMUL_VER_ID: 'SIMUL_V2026-06-A', STUFFING_ID: 'STF-2026062501', PROD_LOCAT_CD: 'KR-PLT1', PROD_LOCAT_NM: '한국 사업장1', SALES_LOCAT_CD: 'VN-HCM', SALES_LOCAT_NM: '베트남 호치민',   ODR_INVOICE_NO: 'INV-2026-VN-0043', ODR_INVOICE_SEQ: 2, ODR_ORDER_TYPE: 'PROMO', ODR_PH1_CD: 'AN', ODR_PH1_NM: 'Animal Nutrition', ODR_ITEM_MATERIAL_CD: 'L-LYS-78L', ODR_ITEM_PACK_UNIT: 'DRUM-1000L', ODR_QTY:  45000, ODR_PROD_QTY:  45000, ODR_PROD_QTY_PD:      0, PROD_INBN_PNDG_QTY_MT:   0.0, ODR_STUFFING_DATE: '06-22-2026' },
  { CHK_STUFFING: true,  SIMUL_VER_ID: 'SIMUL_V2026-06-A', STUFFING_ID: 'STF-2026062502', PROD_LOCAT_CD: 'KR-PLT1', PROD_LOCAT_NM: '한국 사업장1', SALES_LOCAT_CD: 'ID-JKT', SALES_LOCAT_NM: '인니 자카르타', ODR_INVOICE_NO: 'INV-2026-ID-0028', ODR_INVOICE_SEQ: 1, ODR_ORDER_TYPE: 'STD',   ODR_PH1_CD: 'AN', ODR_PH1_NM: 'Animal Nutrition', ODR_ITEM_MATERIAL_CD: 'L-MET-99',  ODR_ITEM_PACK_UNIT: 'BAG-25KG',   ODR_QTY:  85000, ODR_PROD_QTY:  85000, ODR_PROD_QTY_PD:  85000, PROD_INBN_PNDG_QTY_MT:  85.0, ODR_STUFFING_DATE: '06-18-2026' },
];

export default function CjboMpVersionStuffingFileMockup() {
  return (
    <MockShell patternCode="cjbo_mp_version_stuffing_file"
      patternLabel="CJBO — 버전별 Stuffing File 현황"
      layoutCategory="LAYOUT_SINGLE"
      description="시뮬레이션 버전 스냅샷 + Sales Order 연동. 생산지점 × 판매지점 × 인보이스 × 품목 × 수량/생산수량/지연수량.">

      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="시뮬레이션 버전" size="small" value="SIMUL_V2026-06-A" sx={{ width: 240 }}
            InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
          <TextField label="인보이스 번호" size="small" sx={{ width: 180 }} />
          <TextField label="주문 유형" size="small" select value="ALL" sx={{ width: 160 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="STD">STD</MenuItem><MenuItem value="PROMO">PROMO</MenuItem>
          </TextField>
          <TextField label="PH1" size="small" select value="ALL" sx={{ width: 130 }}><MenuItem value="ALL">전체</MenuItem></TextField>
          <Checkbox size="small" /><Typography variant="caption">예상 입고일</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>새로고침</Button>
        </Stack>
      </Box>
      <Box sx={{ p: 1.5, flex: 1, overflow: 'hidden' }}>
        <Paper variant="outlined" sx={{ height: '100%' }}>
          <TableContainer sx={{ height: '100%' }}>
            <Table size="small" stickyHeader sx={{ '& th, & td': { fontSize: 10, py: 0.5, whiteSpace: 'nowrap' } }}>
              <TableHead>
                <TableRow>
                  <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', textAlign: 'center', fontWeight: 700 }}>확인</TableCell>
                  <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>시뮬 버전</TableCell>
                  <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>Stuffing ID</TableCell>
                  <TableCell colSpan={2} sx={{ backgroundColor: '#e3f2fd', textAlign: 'center', fontWeight: 700 }}>생산 지점</TableCell>
                  <TableCell colSpan={2} sx={{ backgroundColor: '#e8f5e9', textAlign: 'center', fontWeight: 700 }}>판매 지점</TableCell>
                  <TableCell colSpan={3} sx={{ backgroundColor: '#fce4ec', textAlign: 'center', fontWeight: 700 }}>판매 주문</TableCell>
                  <TableCell colSpan={4} sx={{ backgroundColor: '#fff9c4', textAlign: 'center', fontWeight: 700 }}>품목군</TableCell>
                  <TableCell colSpan={3} sx={{ backgroundColor: '#ffe0b2', textAlign: 'center', fontWeight: 700 }}>공장 주문 수량</TableCell>
                  <TableCell colSpan={1} sx={{ backgroundColor: '#dcedc8', textAlign: 'center', fontWeight: 700 }}>입고 지연</TableCell>
                  <TableCell rowSpan={2} sx={{ backgroundColor: '#dcedc8', fontWeight: 700 }}>Stuffing 일</TableCell>
                </TableRow>
                <TableRow>
                  {['지점 코드','지점 명','지점 코드','지점 명','인보이스 번호','순번','주문 유형','PH1','PH1 명','품목 코드','포장 단위','주문 수량','생산 수량','확정 수량','지연 수량(MT)'].map((c, i) => (
                    <TableCell key={`${c}-${i}`} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 9 }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {VERSTUF_ROWS.map((r, i) => (
                  <TableRow key={i} hover sx={{ backgroundColor: r.CHK_STUFFING ? undefined : 'rgba(244,67,54,0.04)' }}>
                    <TableCell sx={{ textAlign: 'center' }}><Checkbox size="small" checked={r.CHK_STUFFING} disabled sx={{ p: 0 }} /></TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.SIMUL_VER_ID}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.STUFFING_ID}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.PROD_LOCAT_CD}</TableCell>
                    <TableCell>{r.PROD_LOCAT_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.SALES_LOCAT_CD}</TableCell>
                    <TableCell>{r.SALES_LOCAT_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.ODR_INVOICE_NO}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.ODR_INVOICE_SEQ}</TableCell>
                    <TableCell><Chip size="small" label={r.ODR_ORDER_TYPE} variant="outlined" sx={{ height: 16, fontSize: 9 }} /></TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.ODR_PH1_CD}</TableCell>
                    <TableCell>{r.ODR_PH1_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.ODR_ITEM_MATERIAL_CD}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 10 }}>{r.ODR_ITEM_PACK_UNIT}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.ODR_QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.ODR_PROD_QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{r.ODR_PROD_QTY_PD.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', backgroundColor: '#dcedc8' }}>{r.PROD_INBN_PNDG_QTY_MT.toFixed(1)} MT</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 10 }}>{r.ODR_STUFFING_DATE}</TableCell>
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

import React, { useState } from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Tabs, Tab, Checkbox,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import RefreshIcon from '@mui/icons-material/Refresh';
import MockShell from '../../_shared/MockShell';

// CJBO — MP SCM Demand 5종
// 소스 기반 재작성.
// path: view/masterplan/master/{reworkmtom,inventorymovement,stuffingfile,stuffingfileview,versionstuffingfile}/*.jsx
//
//  ① UI_MP_PN_01 ReworkMtom         — Rework/MtoM 계획 (CJBO 전용 URL prefix cjbo/mp/master/reworkmtom)
//  ② UI_MP_PN_03 InventoryMovement  — 거점간 재고이동
//  ③ UI_MP_PN_04 StuffingFile       — Stuffing 마스터 (2780줄, PROD_CORP + GENERAL_INFO 15개 CHK_* 세로헤더)
//  ④ UI_MP_PN_04_VIEW StuffingFileView — StuffingFile read-only
//  ⑤ UI_MP_PN_05 VersionStuffingFile — 시뮬레이션 버전 스냅샷 (CHK_STUFFING + SIMUL_VER_ID + ORDER linkage)

// ────────── ReworkMtom ──────────
const REWORK_ROWS = [
  { LOCAT_TP_NM: '제조', LOCAT_CD: 'KR-PLT1', LOCAT_NM: '한국 사업장1',  MP_DMND_TYPE: 'REWORK', MP_DMND_TYPE_DTL: 'REPACK', RES_CD: 'P-DRUM-01', RES_DESCRIP: 'Drum 1000L',     REMARK: '용기 변경', FROM_PH3: '78L', FROM_ITEM_CD: 'L-LYS-78L',   FROM_ITEM_NM: 'L-Lysine 78% (액상)',  TO_PH3: '78D',  TO_ITEM_CD: 'L-LYS-78D',  TO_ITEM_NM: 'L-Lysine 78% (Drum)',     QTY: 5.400, TOT_QTY: 162.0, STRT_DATE: '2026-07-01', END_DATE: '2026-07-31', ACTV_YN: true  },
  { LOCAT_TP_NM: '제조', LOCAT_CD: 'KR-PLT1', LOCAT_NM: '한국 사업장1',  MP_DMND_TYPE: 'MTOM',   MP_DMND_TYPE_DTL: 'MIX',    RES_CD: 'R-CRY-01',  RES_DESCRIP: 'Crystallizer #1',REMARK: '결정화 처리', FROM_PH3: '99P', FROM_ITEM_CD: 'L-MET-99B',   FROM_ITEM_NM: 'L-Methionine 99% (벌크)',TO_PH3: '99R',  TO_ITEM_CD: 'L-MET-99R',  TO_ITEM_NM: 'L-Methionine 99% (Retail)',QTY: 2.800, TOT_QTY:  84.0, STRT_DATE: '2026-07-15', END_DATE: '2026-08-31', ACTV_YN: true  },
  { LOCAT_TP_NM: '제조', LOCAT_CD: 'VN-PLT1', LOCAT_NM: 'Bio-VN',         MP_DMND_TYPE: 'REWORK', MP_DMND_TYPE_DTL: 'QC',     RES_CD: 'R-CRY-02',  RES_DESCRIP: 'Crystallizer #2',REMARK: '품질 재처리',FROM_PH3: '98P', FROM_ITEM_CD: 'L-TRP-98',    FROM_ITEM_NM: 'L-Tryptophan 98% (분말)',TO_PH3: '99P',  TO_ITEM_CD: 'L-TRP-99',   TO_ITEM_NM: 'L-Tryptophan 99% (분말)',  QTY: 1.500, TOT_QTY:  30.0, STRT_DATE: '2026-08-01', END_DATE: '2026-09-30', ACTV_YN: true  },
];

// ────────── InventoryMovement ──────────
const MOVE_ROWS = [
  { PH1_CD: 'AN', PH1_NM: 'Animal Nutrition',  PH2_CD: 'LYS', PH2_NM: 'Lysine',     PH3_CD: '78L', PH3_NM: '78% 액상',  ITEM_CD: 'L-LYS-78L',   ITEM_NM: 'L-Lysine 78% (액상)',     LOCAT_DIV_CD: 'P',  FROM_LOCAT_CD: 'KR-PLT1', FROM_LOCAT_NM: '한국 사업장1', TO_LOCAT_CD: 'KR-DC1',  TO_LOCAT_NM: '한국 DC1',     QTY:  45.0, STRT_DATE: '2026-06-10', END_DATE: '2026-06-11', ACTV_YN: true,  REMARK: '내수 이송' },
  { PH1_CD: 'AN', PH1_NM: 'Animal Nutrition',  PH2_CD: 'LYS', PH2_NM: 'Lysine',     PH3_CD: '78L', PH3_NM: '78% 액상',  ITEM_CD: 'L-LYS-78L',   ITEM_NM: 'L-Lysine 78% (액상)',     LOCAT_DIV_CD: 'S',  FROM_LOCAT_CD: 'KR-PLT1', FROM_LOCAT_NM: '한국 사업장1', TO_LOCAT_CD: 'VN-HCM',  TO_LOCAT_NM: '베트남 호치민',QTY: 120.0, STRT_DATE: '2026-06-15', END_DATE: '2026-06-22', ACTV_YN: true,  REMARK: '베트남 수출' },
  { PH1_CD: 'AN', PH1_NM: 'Animal Nutrition',  PH2_CD: 'MET', PH2_NM: 'Methionine', PH3_CD: '99P', PH3_NM: '99% 분말',  ITEM_CD: 'L-MET-99',    ITEM_NM: 'L-Methionine 99% (분말)',  LOCAT_DIV_CD: 'S',  FROM_LOCAT_CD: 'KR-PLT1', FROM_LOCAT_NM: '한국 사업장1', TO_LOCAT_CD: 'US-LAX',  TO_LOCAT_NM: '미국 LA',      QTY:  85.0, STRT_DATE: '2026-06-18', END_DATE: '2026-06-28', ACTV_YN: true,  REMARK: '미국 수출' },
];

// ────────── StuffingFile ──────────
const CHK_COLS = ['CHK_STATUS','CHK_BOOKING','CHK_BOOKING_CONFI','CHK_INSPECTION','CHK_CNTR','CHK_STUFFING','CHK_DO','CHK_SHIPMENT','CHK_BILLING','CHK_CONDITION','CHK_HOLD','CHK_NF_ISSUE','CHK_REV','CHK_COMBINED','CHK_PRIORTY','CHK_NOTE'];
const STUFFING_ROWS = [
  { STATUS_FLAG: 'OPEN',     STUFFING_ID: 'STF-2026062501', STUFFING_ITEM: 1, STUFFING_SEQ: 1, PROD_PLANT_CD: 'KR-PLT1', PROD_PLANT_NM: '한국 사업장1', PROD_LOCAT_CD: 'KR-BSN', PROD_LOCAT_NM: '부산항',   SALES_CORP_CD: 'CJBO-VN', SALES_PLANT_CD: 'VN-HCM',   ODR_SALES_MONTH: '2026-06', ODR_STUFFING_DATE: '06-15-2026', ODR_ORDER_TYPE: 'STD',     ODR_BILLING_DOC: 'B-2026-0042',
    chk: { CHK_STATUS: true,  CHK_BOOKING: true,  CHK_BOOKING_CONFI: true,  CHK_INSPECTION: true,  CHK_CNTR: true,  CHK_STUFFING: true,  CHK_DO: false, CHK_SHIPMENT: false, CHK_BILLING: false, CHK_CONDITION: false, CHK_HOLD: false, CHK_NF_ISSUE: false, CHK_REV: false, CHK_COMBINED: false, CHK_PRIORTY: false, CHK_NOTE: false } },
  { STATUS_FLAG: 'PENDING',  STUFFING_ID: 'STF-2026062502', STUFFING_ITEM: 1, STUFFING_SEQ: 1, PROD_PLANT_CD: 'KR-PLT1', PROD_PLANT_NM: '한국 사업장1', PROD_LOCAT_CD: 'KR-GY',  PROD_LOCAT_NM: '광양항',   SALES_CORP_CD: 'CJBO-ID', SALES_PLANT_CD: 'ID-JKT',   ODR_SALES_MONTH: '2026-06', ODR_STUFFING_DATE: '06-18-2026', ODR_ORDER_TYPE: 'PROMO',   ODR_BILLING_DOC: 'B-2026-0028',
    chk: { CHK_STATUS: true,  CHK_BOOKING: true,  CHK_BOOKING_CONFI: false, CHK_INSPECTION: false, CHK_CNTR: false, CHK_STUFFING: false, CHK_DO: false, CHK_SHIPMENT: false, CHK_BILLING: false, CHK_CONDITION: false, CHK_HOLD: false, CHK_NF_ISSUE: false, CHK_REV: false, CHK_COMBINED: false, CHK_PRIORTY: true,  CHK_NOTE: false } },
  { STATUS_FLAG: 'COMPLETE', STUFFING_ID: 'STF-2026060103', STUFFING_ITEM: 2, STUFFING_SEQ: 1, PROD_PLANT_CD: 'VN-PLT1', PROD_PLANT_NM: 'Bio-VN',       PROD_LOCAT_CD: 'VN-HPH', PROD_LOCAT_NM: '하이퐁항', SALES_CORP_CD: 'CJBO-US', SALES_PLANT_CD: 'US-LAX',   ODR_SALES_MONTH: '2026-06', ODR_STUFFING_DATE: '06-01-2026', ODR_ORDER_TYPE: 'STD',     ODR_BILLING_DOC: 'B-2026-0015',
    chk: { CHK_STATUS: true,  CHK_BOOKING: true,  CHK_BOOKING_CONFI: true,  CHK_INSPECTION: true,  CHK_CNTR: true,  CHK_STUFFING: true,  CHK_DO: true,  CHK_SHIPMENT: true,  CHK_BILLING: true,  CHK_CONDITION: false, CHK_HOLD: false, CHK_NF_ISSUE: false, CHK_REV: false, CHK_COMBINED: false, CHK_PRIORTY: false, CHK_NOTE: false } },
];

// ────────── VersionStuffingFile ──────────
const VERSTUF_ROWS = [
  { CHK_STUFFING: true,  SIMUL_VER_ID: 'SIMUL_V2026-06-A', STUFFING_ID: 'STF-2026062501', PROD_LOCAT_CD: 'KR-PLT1', PROD_LOCAT_NM: '한국 사업장1', SALES_LOCAT_CD: 'VN-HCM', SALES_LOCAT_NM: '베트남 호치민',   ODR_INVOICE_NO: 'INV-2026-VN-0042', ODR_INVOICE_SEQ: 1, ODR_ORDER_TYPE: 'STD',   ODR_PH1_CD: 'AN', ODR_PH1_NM: 'Animal Nutrition', ODR_ITEM_MATERIAL_CD: 'L-LYS-78L', ODR_ITEM_PACK_UNIT: 'DRUM-1000L', ODR_QTY: 120000, ODR_PROD_QTY: 120000, ODR_PROD_QTY_PD: 110000, PROD_INBN_PNDG_QTY_MT: 110.0, ODR_STUFFING_DATE: '06-15-2026' },
  { CHK_STUFFING: false, SIMUL_VER_ID: 'SIMUL_V2026-06-A', STUFFING_ID: 'STF-2026062501', PROD_LOCAT_CD: 'KR-PLT1', PROD_LOCAT_NM: '한국 사업장1', SALES_LOCAT_CD: 'VN-HCM', SALES_LOCAT_NM: '베트남 호치민',   ODR_INVOICE_NO: 'INV-2026-VN-0043', ODR_INVOICE_SEQ: 2, ODR_ORDER_TYPE: 'PROMO', ODR_PH1_CD: 'AN', ODR_PH1_NM: 'Animal Nutrition', ODR_ITEM_MATERIAL_CD: 'L-LYS-78L', ODR_ITEM_PACK_UNIT: 'DRUM-1000L', ODR_QTY:  45000, ODR_PROD_QTY:  45000, ODR_PROD_QTY_PD:      0, PROD_INBN_PNDG_QTY_MT:   0.0, ODR_STUFFING_DATE: '06-22-2026' },
  { CHK_STUFFING: true,  SIMUL_VER_ID: 'SIMUL_V2026-06-A', STUFFING_ID: 'STF-2026062502', PROD_LOCAT_CD: 'KR-PLT1', PROD_LOCAT_NM: '한국 사업장1', SALES_LOCAT_CD: 'ID-JKT', SALES_LOCAT_NM: '인니 자카르타', ODR_INVOICE_NO: 'INV-2026-ID-0028', ODR_INVOICE_SEQ: 1, ODR_ORDER_TYPE: 'STD',   ODR_PH1_CD: 'AN', ODR_PH1_NM: 'Animal Nutrition', ODR_ITEM_MATERIAL_CD: 'L-MET-99',  ODR_ITEM_PACK_UNIT: 'BAG-25KG',   ODR_QTY:  85000, ODR_PROD_QTY:  85000, ODR_PROD_QTY_PD:  85000, PROD_INBN_PNDG_QTY_MT:  85.0, ODR_STUFFING_DATE: '06-18-2026' },
];

const STATUS_INFO = { OPEN: { color: 'info' }, PENDING: { color: 'warning' }, COMPLETE: { color: 'success' } };

export default function CjboMpScmDemandMockup() {
  const [tab, setTab] = useState(0);

  return (
    <MockShell patternCode="cjbo_mp_scm_demand"
      patternLabel="CJBO — MP SCM Demand 5종 (PN_01/03/04/04_VIEW/05)"
      layoutCategory="LAYOUT_SINGLE"
      description="ReworkMtom (cjbo/mp/master/reworkmtom — CJBO 전용) · InventoryMovement · StuffingFile (2780줄, 15 CHK_* boolean) · StuffingFileView (read-only) · VersionStuffingFile (시뮬-스냅샷 + ORDER linkage).">

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ minHeight: 38 }}>
          <Tab label="① UI_MP_PN_01 ReworkMtom" sx={{ minHeight: 38 }} />
          <Tab label="② UI_MP_PN_03 InventoryMovement" sx={{ minHeight: 38 }} />
          <Tab label="③ UI_MP_PN_04 StuffingFile" sx={{ minHeight: 38 }} />
          <Tab label="④ UI_MP_PN_04_VIEW StuffingFileView (read-only)" sx={{ minHeight: 38 }} />
          <Tab label="⑤ UI_MP_PN_05 VersionStuffingFile" sx={{ minHeight: 38 }} />
        </Tabs>
      </Box>

      {/* ───── ① ReworkMtom ───── */}
      {tab === 0 && (
        <>
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <TextField label="verCd" size="small" select value="V2026-06" sx={{ width: 130 }}>
                <MenuItem value="V2026-06">V2026-06</MenuItem>
              </TextField>
              <TextField label="searchDt (FROM ~ END)" size="small" value="2026-06-01 ~ 2026-09-30" sx={{ width: 230 }} />
              <TextField label="resCd (multi)" size="small" select value="ALL" sx={{ width: 130 }}><MenuItem value="ALL">전체</MenuItem></TextField>
              <TextField label="PH1 (multi)" size="small" select value="ALL" sx={{ width: 130 }}><MenuItem value="ALL">전체</MenuItem></TextField>
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
            </Stack>
          </Box>
          <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>REST: cjbo/mp/master/reworkmtom/&#123;q1,s1,d1,pop1&#125; (CJBO 전용 prefix)</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" startIcon={<AddIcon />} variant="outlined">행 추가</Button>
            <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
          </Box>
          <Box sx={{ p: 1.5, flex: 1, overflow: 'hidden' }}>
            <Paper variant="outlined" sx={{ height: '100%' }}>
              <TableContainer sx={{ height: '100%' }}>
                <Table size="small" stickyHeader sx={{ '& th, & td': { fontSize: 11, py: 0.5 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell colSpan={4} sx={{ backgroundColor: '#e3f2fd', textAlign: 'center', fontWeight: 700 }}>LOCATION</TableCell>
                      <TableCell colSpan={2} sx={{ backgroundColor: '#fff9c4', textAlign: 'center', fontWeight: 700 }}>MP_DMND_TYPE (cascade)</TableCell>
                      <TableCell colSpan={3} sx={{ backgroundColor: '#dcedc8', textAlign: 'center', fontWeight: 700 }}>RES</TableCell>
                      <TableCell colSpan={3} sx={{ backgroundColor: '#ffe0b2', textAlign: 'center', fontWeight: 700 }}>TARGET_ITEM (FROM)</TableCell>
                      <TableCell colSpan={3} sx={{ backgroundColor: '#fce4ec', textAlign: 'center', fontWeight: 700 }}>CHANGE_ITEM (TO)</TableCell>
                      <TableCell colSpan={5} sx={{ backgroundColor: 'grey.200', textAlign: 'center', fontWeight: 700 }}>QTY / 일정 / CONFIRM</TableCell>
                    </TableRow>
                    <TableRow>
                      {['LOCAT_TP_NM (DIVISION)','LOCAT_CD (button)','LOCAT_NM','-','MP_DMND_TYPE','MP_DMND_TYPE_DTL','RES_CD','RES_DESCRIP','REMARK','FROM_PH3','FROM_ITEM_CD','FROM_ITEM_NM','TO_PH3','TO_ITEM_CD','TO_ITEM_NM','QTY (QTY_TON_DAY)','TOT_QTY (QTY_TON)','STRT_DATE','END_DATE','ACTV_YN (CONFIRM)'].map((c, i) => (
                        <TableCell key={`${c}-${i}`} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 10, py: 0.5,
                          textAlign: ['QTY (QTY_TON_DAY)','TOT_QTY (QTY_TON)','STRT_DATE','END_DATE','ACTV_YN (CONFIRM)'].includes(c) ? 'center' : 'left' }}>{c}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {REWORK_ROWS.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell>{r.LOCAT_TP_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.LOCAT_CD}</TableCell>
                        <TableCell>{r.LOCAT_NM}</TableCell>
                        <TableCell sx={{ color: 'text.disabled' }}>-</TableCell>
                        <TableCell><Chip size="small" label={r.MP_DMND_TYPE} variant="outlined" color={r.MP_DMND_TYPE === 'REWORK' ? 'warning' : 'info'} /></TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 10 }}>{r.MP_DMND_TYPE_DTL}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.RES_CD}</TableCell>
                        <TableCell>{r.RES_DESCRIP}</TableCell>
                        <TableCell>{r.REMARK}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.FROM_PH3}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.FROM_ITEM_CD}</TableCell>
                        <TableCell>{r.FROM_ITEM_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.TO_PH3}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', color: 'success.main', fontWeight: 600 }}>{r.TO_ITEM_CD}</TableCell>
                        <TableCell sx={{ color: 'success.main' }}>{r.TO_ITEM_NM}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.QTY.toFixed(3)}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{r.TOT_QTY.toFixed(1)}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.STRT_DATE}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.END_DATE}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}><Checkbox size="small" checked={r.ACTV_YN} disabled sx={{ p: 0 }} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </>
      )}

      {/* ───── ② InventoryMovement ───── */}
      {tab === 1 && (
        <>
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <TextField label="verCd" size="small" select value="V2026-06" sx={{ width: 130 }}><MenuItem value="V2026-06">V2026-06</MenuItem></TextField>
              <TextField label="locatDivCd (P_S_DIV)" size="small" select value="ALL" sx={{ width: 160 }}>
                <MenuItem value="ALL">전체</MenuItem><MenuItem value="P">P 내수</MenuItem><MenuItem value="S">S 수출</MenuItem>
              </TextField>
              <TextField label="fromLocatCd (action+popup)" size="small" value="전체" sx={{ width: 180 }}
                InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
              <TextField label="toLocatCd (action+popup)" size="small" value="전체" sx={{ width: 180 }}
                InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
              <TextField label="PH1/2/3 (multi)" size="small" select value="ALL" sx={{ width: 130 }}><MenuItem value="ALL">전체</MenuItem></TextField>
              <Checkbox size="small" /><Typography variant="caption">actvChk</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
            </Stack>
          </Box>
          <Box sx={{ p: 1.5, flex: 1, overflow: 'hidden' }}>
            <Paper variant="outlined" sx={{ height: '100%' }}>
              <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>REST: mp/master/inventorymovement/&#123;q1,s1,d1,user1&#125;</Typography>
              </Box>
              <TableContainer sx={{ height: 'calc(100% - 36px)' }}>
                <Table size="small" stickyHeader sx={{ '& th, & td': { fontSize: 11, py: 0.5 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell colSpan={8} sx={{ backgroundColor: '#fce4ec', textAlign: 'center', fontWeight: 700 }}>ITEM_GRP</TableCell>
                      <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>LOCAT_DIV_CD (P_S_DIV)</TableCell>
                      <TableCell colSpan={2} sx={{ backgroundColor: '#e3f2fd', textAlign: 'center', fontWeight: 700 }}>FROM_LOCAT</TableCell>
                      <TableCell colSpan={2} sx={{ backgroundColor: '#e8f5e9', textAlign: 'center', fontWeight: 700 }}>TO_LOCAT</TableCell>
                      <TableCell colSpan={5} sx={{ backgroundColor: 'grey.200', textAlign: 'center', fontWeight: 700 }}>QTY · DATE · ACTV · REMARK</TableCell>
                    </TableRow>
                    <TableRow>
                      {['PH1_CD','PH1_NM','PH2_CD','PH2_NM','PH3_CD','PH3_NM','ITEM_CD (button)','ITEM_NM','FROM_LOCAT_CD','FROM_LOCAT_NM','TO_LOCAT_CD','TO_LOCAT_NM','QTY (QTY_TON)','STRT_DATE (DEPARTURE)','END_DATE (ARRIVAL)','ACTV_YN','REMARKS'].map((c, i) => (
                        <TableCell key={`${c}-${i}`} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 10, py: 0.5 }}>{c}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {MOVE_ROWS.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.PH1_CD}</TableCell>
                        <TableCell>{r.PH1_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.PH2_CD}</TableCell>
                        <TableCell>{r.PH2_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.PH3_CD}</TableCell>
                        <TableCell>{r.PH3_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.ITEM_CD}</TableCell>
                        <TableCell>{r.ITEM_NM}</TableCell>
                        <TableCell><Chip size="small" label={r.LOCAT_DIV_CD} variant="outlined" color={r.LOCAT_DIV_CD === 'S' ? 'warning' : 'info'} /></TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.FROM_LOCAT_CD}</TableCell>
                        <TableCell>{r.FROM_LOCAT_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', color: 'success.main' }}>{r.TO_LOCAT_CD}</TableCell>
                        <TableCell sx={{ color: 'success.main' }}>{r.TO_LOCAT_NM}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{r.QTY.toFixed(1)}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.STRT_DATE}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.END_DATE}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}><Checkbox size="small" checked={r.ACTV_YN} disabled sx={{ p: 0 }} /></TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{r.REMARK}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </>
      )}

      {/* ───── ③④ StuffingFile (편집/읽기 공통 구조) ───── */}
      {(tab === 2 || tab === 3) && (
        <>
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
              <TextField label="interface (text disabled)" size="small" disabled value="STF-2026-06" sx={{ width: 160 }} />
              <TextField label="corporCd (CORP/PROD_CORP)" size="small" select value="CJBO" sx={{ width: 150 }}>
                <MenuItem value="CJBO">CJBO</MenuItem>
              </TextField>
              <TextField label="dstbCh (DSTB_CH)" size="small" select value="EXP" sx={{ width: 120 }}>
                <MenuItem value="EXP">수출</MenuItem><MenuItem value="DOM">내수</MenuItem>
              </TextField>
              <TextField label="invoiceNo" size="small" sx={{ width: 150 }} />
              <TextField label="stuffingSalesMonth (multi)" size="small" select value="2026-06" sx={{ width: 150 }}>
                <MenuItem value="2026-06">2026-06</MenuItem>
              </TextField>
              <TextField label="dateDiv (DMND_DATE_DIV)" size="small" select value="STUFFING" sx={{ width: 140 }}>
                <MenuItem value="STUFFING">STUFFING_DT</MenuItem>
              </TextField>
              <TextField label="stuffDt (MM-dd-yyyy)" size="small" value="06-01-2026 ~ 06-30-2026" sx={{ width: 230 }} />
              <TextField label="region (multi SHIP_TO_REGION)" size="small" select value="ALL" sx={{ width: 160 }}>
                <MenuItem value="ALL">전체</MenuItem>
              </TextField>
              <TextField label="countryVal (multi SHIP_TO_COUNTRY)" size="small" select value="ALL" sx={{ width: 170 }}>
                <MenuItem value="ALL">전체</MenuItem>
              </TextField>
              <TextField label="ph1Cd (multi)" size="small" select value="ALL" sx={{ width: 110 }}><MenuItem value="ALL">전체</MenuItem></TextField>
              <TextField label="orderingStatus (multi)" size="small" select value="ALL" sx={{ width: 150 }}><MenuItem value="ALL">전체</MenuItem></TextField>
              <Checkbox size="small" /><Typography variant="caption">Dummy</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
            </Stack>
          </Box>
          <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button size="small" startIcon={<FileDownloadIcon />} variant="outlined">엑셀 다운로드</Button>
            {tab === 2 && <Button size="small" startIcon={<FileUploadIcon />} variant="outlined">엑셀 업로드</Button>}
            <Button size="small" variant="outlined">전체 펼침/접기</Button>
            <Button size="small" variant="outlined">VESSEL_POP</Button>
            <Button size="small" variant="outlined">PERSON_IN_CHARGE_POP</Button>
            <Button size="small" variant="outlined">UI_MP_PN_04_POP</Button>
            <Button size="small" variant="outlined">DATA_VALIDATION</Button>
            <Box sx={{ flexGrow: 1 }} />
            {tab === 2 && (
              <>
                <Button size="small" startIcon={<AddIcon />} variant="outlined">DUMMY_ADD</Button>
                <Button size="small" startIcon={<AddIcon />} variant="outlined">PROD_ADD</Button>
                <Button size="small" startIcon={<DeleteIcon />} variant="outlined" color="error">삭제</Button>
                <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
              </>
            )}
            {tab === 3 && <Chip size="small" label="StuffingFileView — READ-ONLY (s1/d1 commented out)" color="info" />}
          </Box>
          <Box sx={{ p: 1.5, flex: 1, overflow: 'hidden' }}>
            <Paper variant="outlined" sx={{ height: '100%' }}>
              <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                  BaseGrid — PROD_CORP grp + GENERAL_INFO grp ({CHK_COLS.length} CHK_* boolean, vertical-rotated headers) + DATE_INFO + ORDER_INFO + PO_SALES_GRP
                </Typography>
              </Box>
              <TableContainer sx={{ height: 'calc(100% - 36px)' }}>
                <Table size="small" stickyHeader sx={{ '& th, & td': { fontSize: 10, py: 0.5, whiteSpace: 'nowrap' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>STATUS_FLAG</TableCell>
                      <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>STUFFING_ID / ITEM / SEQ</TableCell>
                      <TableCell colSpan={5} sx={{ backgroundColor: '#e3f2fd', textAlign: 'center', fontWeight: 700 }}>PROD_CORP (생산법인)</TableCell>
                      <TableCell colSpan={CHK_COLS.length} sx={{ backgroundColor: '#fff9c4', textAlign: 'center', fontWeight: 700 }}>GENERAL_INFO (vertical-rotated headers)</TableCell>
                      <TableCell colSpan={2} sx={{ backgroundColor: '#dcedc8', textAlign: 'center', fontWeight: 700 }}>DATE_INFO</TableCell>
                      <TableCell colSpan={2} sx={{ backgroundColor: '#ffe0b2', textAlign: 'center', fontWeight: 700 }}>ORDER_INFO</TableCell>
                    </TableRow>
                    <TableRow>
                      {['PROD_PLANT_CD','PROD_PLANT_NM','PROD_LOCAT_CD','PROD_LOCAT_NM','SALES_CORP_CD'].map((c) => (
                        <TableCell key={c} sx={{ backgroundColor: '#e3f2fd', fontWeight: 700, fontSize: 9 }}>{c}</TableCell>
                      ))}
                      {CHK_COLS.map((c) => (
                        <TableCell key={c} sx={{ backgroundColor: '#fff9c4', fontWeight: 700, fontSize: 8,
                          writingMode: 'vertical-rl', textOrientation: 'mixed', minWidth: 24, maxWidth: 26, p: 0.5, textAlign: 'center' }}>{c.replace('CHK_', '')}</TableCell>
                      ))}
                      <TableCell sx={{ backgroundColor: '#dcedc8', fontWeight: 700, fontSize: 9 }}>SALES_MONTH</TableCell>
                      <TableCell sx={{ backgroundColor: '#dcedc8', fontWeight: 700, fontSize: 9 }}>STUFFING_DATE (MM-dd-yyyy)</TableCell>
                      <TableCell sx={{ backgroundColor: '#ffe0b2', fontWeight: 700, fontSize: 9 }}>ORDER_TYPE</TableCell>
                      <TableCell sx={{ backgroundColor: '#ffe0b2', fontWeight: 700, fontSize: 9 }}>BILLING_DOC</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {STUFFING_ROWS.map((r, i) => {
                      const sInfo = STATUS_INFO[r.STATUS_FLAG] || { color: 'default' };
                      return (
                        <TableRow key={i} hover>
                          <TableCell><Chip size="small" label={r.STATUS_FLAG} color={sInfo.color} sx={{ height: 18, fontSize: 9 }} /></TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{r.STUFFING_ID} / {r.STUFFING_ITEM} / {r.STUFFING_SEQ}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{r.PROD_PLANT_CD}</TableCell>
                          <TableCell>{r.PROD_PLANT_NM}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{r.PROD_LOCAT_CD}</TableCell>
                          <TableCell>{r.PROD_LOCAT_NM}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{r.SALES_CORP_CD}</TableCell>
                          {CHK_COLS.map((c) => (
                            <TableCell key={c} sx={{ textAlign: 'center', p: 0.25 }}>
                              <Checkbox size="small" checked={r.chk[c]} disabled={tab === 3} sx={{ p: 0 }} />
                            </TableCell>
                          ))}
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: 10 }}>{r.ODR_SALES_MONTH}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: 10 }}>{r.ODR_STUFFING_DATE}</TableCell>
                          <TableCell><Chip size="small" label={r.ODR_ORDER_TYPE} variant="outlined" sx={{ height: 16, fontSize: 9 }} /></TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{r.ODR_BILLING_DOC}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </>
      )}

      {/* ───── ⑤ VersionStuffingFile ───── */}
      {tab === 4 && (
        <>
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <TextField label="simulationVersion (action+popup, required)" size="small" value="SIMUL_V2026-06-A" sx={{ width: 240 }}
                InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
              <TextField label="invoiceNo" size="small" sx={{ width: 180 }} />
              <TextField label="orderTp (multi ORDER_TYPE)" size="small" select value="ALL" sx={{ width: 160 }}>
                <MenuItem value="ALL">전체</MenuItem><MenuItem value="STD">STD</MenuItem><MenuItem value="PROMO">PROMO</MenuItem>
              </TextField>
              <TextField label="ph1Cd (multi PH1)" size="small" select value="ALL" sx={{ width: 130 }}><MenuItem value="ALL">전체</MenuItem></TextField>
              <Checkbox size="small" /><Typography variant="caption">EXPECTED_RECEIPT_DATE</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
              <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>새로고침</Button>
            </Stack>
          </Box>
          <Box sx={{ p: 1.5, flex: 1, overflow: 'hidden' }}>
            <Paper variant="outlined" sx={{ height: '100%' }}>
              <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>REST: mp/master/versionstuffingfile/q1 (READ-ONLY, 시뮬-스냅샷)</Typography>
              </Box>
              <TableContainer sx={{ height: 'calc(100% - 36px)' }}>
                <Table size="small" stickyHeader sx={{ '& th, & td': { fontSize: 10, py: 0.5, whiteSpace: 'nowrap' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', textAlign: 'center', fontWeight: 700 }}>CHK_STUFFING</TableCell>
                      <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>SIMUL_VER_ID</TableCell>
                      <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>STUFFING_ID</TableCell>
                      <TableCell colSpan={2} sx={{ backgroundColor: '#e3f2fd', textAlign: 'center', fontWeight: 700 }}>PROD_LOCAT_GRP</TableCell>
                      <TableCell colSpan={2} sx={{ backgroundColor: '#e8f5e9', textAlign: 'center', fontWeight: 700 }}>SALES_LOCAT_GRP</TableCell>
                      <TableCell colSpan={3} sx={{ backgroundColor: '#fce4ec', textAlign: 'center', fontWeight: 700 }}>SALES_ORD_GRP (Sales Order)</TableCell>
                      <TableCell colSpan={4} sx={{ backgroundColor: '#fff9c4', textAlign: 'center', fontWeight: 700 }}>ITEM_GRP</TableCell>
                      <TableCell colSpan={3} sx={{ backgroundColor: '#ffe0b2', textAlign: 'center', fontWeight: 700 }}>FACTORY_SO_GRP (#,###)</TableCell>
                      <TableCell colSpan={1} sx={{ backgroundColor: '#dcedc8', textAlign: 'center', fontWeight: 700 }}>FACTORY_GR (IV-GR)</TableCell>
                      <TableCell rowSpan={2} sx={{ backgroundColor: '#dcedc8', fontWeight: 700 }}>STUFFING_DATE</TableCell>
                    </TableRow>
                    <TableRow>
                      {['PROD_LOCAT_CD','PROD_LOCAT_NM','SALES_LOCAT_CD','SALES_LOCAT_NM','ODR_INVOICE_NO','SEQ','ORDER_TYPE','PH1_CD','PH1_NM','ITEM_MATERIAL_CD','ITEM_PACK_UNIT','ODR_QTY','ODR_PROD_QTY','ODR_PROD_QTY_PD','PROD_INBN_PNDG_QTY_MT'].map((c, i) => (
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
        </>
      )}
    </MockShell>
  );
}

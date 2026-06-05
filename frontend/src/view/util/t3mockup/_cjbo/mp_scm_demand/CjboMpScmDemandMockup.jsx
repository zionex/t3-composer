import React, { useState } from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MockShell from '../../_shared/MockShell';
import { cellSx, percentStatus } from '../../_shared/styleCallback';

// CJBO — MP SCM Demand
// UI_MP_PN_01 ReworkMtom         — LOCATION 그룹 + MP_DMND_TYPE/_DTL (드롭다운) + RES_CD + REMARK
// UI_MP_PN_03 InventoryMovement  — ITEM 그룹 + LOCAT_DIV_CD (P_S_DIV) + FROM_LOCAT/TO_LOCAT 그룹
// UI_MP_PN_04 StuffingFile        — STATUS_FLAG/STUFFING_ID/ITEM/SEQ + PROD_CORP/PLANT/LOCAT × SALES_CORP/PLANT
// UI_MP_PN_04_VIEW                — StuffingFile read-only
// UI_MP_PN_05 VersionStuffingFile — CHK_STUFFING + SIMUL_VER_ID + SALES_ORD_GRP (ODR_INVOICE_NO 시뮬-버전 스냅샷)

const REWORK = [
  { LOCAT_TP: '제조', LOCAT_CD: 'L01-A', LOCAT_NM: '경기 광주 1라인', MP_DMND_TYPE: 'REWORK',   MP_DMND_TYPE_DTL: 'RWK-PKG',  RES_CD: 'L01-A',  FROM_ITEM: 'illuvia 토너 200ml (구)',  TO_ITEM: 'illuvia 토너 200ml (신)',  QTY: 5400, REMARK: '용량 200ml → 250ml 변경', STATUS: 'planned' },
  { LOCAT_TP: '제조', LOCAT_CD: 'L02-A', LOCAT_NM: '경기 광주 2라인', MP_DMND_TYPE: 'MTOM',     MP_DMND_TYPE_DTL: 'MTM-MIX',  RES_CD: 'L02-A',  FROM_ITEM: 'illuvia 크림 50g (구)',     TO_ITEM: 'illuvia 크림 50g (신)',     QTY: 2800, REMARK: '향료 라인 교체',         STATUS: 'in_progress' },
  { LOCAT_TP: '제조', LOCAT_CD: 'L99-A', LOCAT_NM: '대전 NGP 라인',   MP_DMND_TYPE: 'REWORK',   MP_DMND_TYPE_DTL: 'RWK-VER',  RES_CD: 'L99-A',  FROM_ITEM: 'illuvia 클렌저 150ml',    TO_ITEM: 'illuvia 클렌저 200ml',     QTY: 1500, REMARK: '리뉴얼 패키지',         STATUS: 'planned' },
];

const MOVE = [
  { PH1: 'illuvia',  PH2: 'MASK',     PH3: '5매',     ITEM_CD: 'F01001', ITEM_NM: 'illuvia 비건마스크 5매', LOCAT_DIV: 'INTERNAL', FROM_LOCAT_TP: '제조', FROM_LOCAT: '경기 광주 1물류', TO_LOCAT_TP: '물류', TO_LOCAT: '경기 이천 2물류',  QTY: 4500, ETD: '2026-06-10', ETA: '2026-06-11', STATUS: 'in_transit' },
  { PH1: 'illuvia',  PH2: 'TONER',    PH3: '200ml',   ITEM_CD: 'F01002', ITEM_NM: 'illuvia 토너 200ml',      LOCAT_DIV: 'INTERNAL', FROM_LOCAT_TP: '물류', FROM_LOCAT: '경기 이천 2물류', TO_LOCAT_TP: '물류', TO_LOCAT: '인천 GLC',          QTY: 2800, ETD: '2026-06-12', ETA: '2026-06-13', STATUS: 'planned' },
  { PH1: 'CJ Brand', PH2: 'KING-RED', PH3: '60s',     ITEM_CD: 'F02001', ITEM_NM: 'CJ Brand Korea KING-RED', LOCAT_DIV: 'EXTERNAL', FROM_LOCAT_TP: '항만', FROM_LOCAT: '부산항 BPA',       TO_LOCAT_TP: '해외', TO_LOCAT: '베트남 호치민',     QTY:12000, ETD: '2026-06-15', ETA: '2026-06-22', STATUS: 'planned' },
  { PH1: 'illuvia',  PH2: 'MASK',     PH3: 'EXPORT',  ITEM_CD: 'F01003', ITEM_NM: 'illuvia MASK',            LOCAT_DIV: 'EXTERNAL', FROM_LOCAT_TP: '항만', FROM_LOCAT: '광양항 GPA',        TO_LOCAT_TP: '해외', TO_LOCAT: '인니 자카르타',     QTY: 8500, ETD: '2026-06-18', ETA: '2026-06-28', STATUS: 'planned' },
];

const STUFFING = [
  { STATUS_FLAG: 'N', STUFFING_ID: 'STF-2026062501', SEQ: 1, PROD_CORP: 'CJBO',  PROD_PLANT_CD: 'P01', PROD_PLANT_NM: '경기 광주 공장',   PROD_LOCAT: '부산항 BPA',  SALES_CORP: 'CJBO-VN', SALES_PLANT: '호치민', DEST: '베트남 호치민',  ETD: '2026-06-15', CNTR: 8,  CTN: 1840, CBM: 142.5, FILL: 89.2 },
  { STATUS_FLAG: 'Y', STUFFING_ID: 'STF-2026062502', SEQ: 2, PROD_CORP: 'CJBO',  PROD_PLANT_CD: 'P02', PROD_PLANT_NM: '경기 이천 공장',   PROD_LOCAT: '광양항 GPA',  SALES_CORP: 'CJBO-ID', SALES_PLANT: '자카르타', DEST: '인니 자카르타',  ETD: '2026-06-18', CNTR: 5,  CTN: 1150, CBM:  88.4, FILL: 94.8 },
  { STATUS_FLAG: 'Y', STUFFING_ID: 'STF-2026062603', SEQ: 1, PROD_CORP: 'CJBO',  PROD_PLANT_CD: 'P01', PROD_PLANT_NM: '경기 광주 공장',   PROD_LOCAT: '부산항 BPA',  SALES_CORP: 'CJBO-MY', SALES_PLANT: 'KL',       DEST: '말레이 KL',      ETD: '2026-06-22', CNTR: 3,  CTN:  680, CBM:  52.1, FILL: 78.5 },
  { STATUS_FLAG: 'N', STUFFING_ID: 'STF-2026062604', SEQ: 1, PROD_CORP: 'CJBO',  PROD_PLANT_CD: 'P03', PROD_PLANT_NM: '대전 NGP 공장',    PROD_LOCAT: '인천항 ICT',  SALES_CORP: 'CJBO-PH', SALES_PLANT: '마닐라',   DEST: '필리핀 마닐라',  ETD: '2026-06-25', CNTR: 2,  CTN:  450, CBM:  34.8, FILL: 86.3 },
  { STATUS_FLAG: 'Y', STUFFING_ID: 'STF-2026070205', SEQ: 1, PROD_CORP: 'CJBO',  PROD_PLANT_CD: 'P01', PROD_PLANT_NM: '경기 광주 공장',   PROD_LOCAT: '부산항 BPA',  SALES_CORP: 'CJBO-JP', SALES_PLANT: '도쿄',     DEST: '일본 도쿄',      ETD: '2026-07-02', CNTR: 4,  CTN:  920, CBM:  71.5, FILL: 92.1 },
];

// PN_05 — VersionStuffingFile (Sales Order 연계)
const VER_STUFFING = [
  { CHK_STUFFING: true,  SIMUL_VER_ID: 'SIMUL_V2026-06-A', STUFFING_ID: 'STF-2026062501', PROD_LOCAT: '경기 광주 공장', SALES_LOCAT: '베트남 호치민', ODR_INVOICE_NO: 'INV-2026-VN-0042', ORDER_TYPE: 'STD', QTY: 1840, FILL: 89.2 },
  { CHK_STUFFING: false, SIMUL_VER_ID: 'SIMUL_V2026-06-A', STUFFING_ID: 'STF-2026062501', PROD_LOCAT: '경기 광주 공장', SALES_LOCAT: '베트남 호치민', ODR_INVOICE_NO: 'INV-2026-VN-0043', ORDER_TYPE: 'PROMO', QTY:  450, FILL: 0 },
  { CHK_STUFFING: true,  SIMUL_VER_ID: 'SIMUL_V2026-06-A', STUFFING_ID: 'STF-2026062502', PROD_LOCAT: '경기 이천 공장', SALES_LOCAT: '인니 자카르타', ODR_INVOICE_NO: 'INV-2026-ID-0028', ORDER_TYPE: 'STD', QTY: 1150, FILL: 94.8 },
  { CHK_STUFFING: true,  SIMUL_VER_ID: 'SIMUL_V2026-06-B', STUFFING_ID: 'STF-2026062603', PROD_LOCAT: '경기 광주 공장', SALES_LOCAT: '말레이 KL',     ODR_INVOICE_NO: 'INV-2026-MY-0015', ORDER_TYPE: 'STD', QTY:  680, FILL: 78.5 },
];

const STATUS_INFO = {
  planned:     { label: '계획',   color: 'info' },
  in_progress: { label: '진행중', color: 'warning' },
  in_transit:  { label: '운송중', color: 'info' },
};

export default function CjboMpScmDemandMockup() {
  const [tab, setTab] = useState(0);
  const [subTab, setSubTab] = useState(0); // Stuffing: master(PN_04) / version(PN_05)

  return (
    <MockShell patternCode="cjbo_mp_scm_demand" patternLabel="CJBO — MP SCM Demand (재처리/거점이동/Stuffing)"
      layoutCategory="LAYOUT_SINGLE"
      description="PN_01 재처리·MtoM (MP_DMND_TYPE) · PN_03 거점이동 (LOCAT_DIV) · PN_04/05 Stuffing 마스터+버전. UI_MP_PN_01/03/04/04_VIEW/05.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="버전" size="small" value="V2026-06" sx={{ width: 130 }} />
          <TextField label="범위" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="DOM">국내</MenuItem><MenuItem value="EXP">해외</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-06 ~ 09" sx={{ width: 180 }} />
          {tab === 0 && (
            <TextField label="MP_DMND_TYPE" size="small" select value="ALL" sx={{ width: 150 }}>
              <MenuItem value="ALL">전체</MenuItem>
              <MenuItem value="REWORK">REWORK</MenuItem>
              <MenuItem value="MTOM">MTOM</MenuItem>
            </TextField>
          )}
          {tab === 1 && (
            <TextField label="LOCAT_DIV" size="small" select value="ALL" sx={{ width: 140 }}>
              <MenuItem value="ALL">전체</MenuItem>
              <MenuItem value="INTERNAL">INTERNAL (내부)</MenuItem>
              <MenuItem value="EXTERNAL">EXTERNAL (외부)</MenuItem>
            </TextField>
          )}
          {tab === 2 && subTab === 1 && (
            <TextField label="SIMUL_VER_ID" size="small" value="SIMUL_V2026-06-A" sx={{ width: 200 }} />
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ minHeight: 38 }}>
          <Tab label="재처리·MtoM (PN_01 ReworkMtom)" icon={<AssignmentIcon sx={{ fontSize: 16 }} />} iconPosition="start" sx={{ minHeight: 38 }} />
          <Tab label="거점간 재고이동 (PN_03 InventoryMovement)" icon={<SwapHorizIcon sx={{ fontSize: 16 }} />} iconPosition="start" sx={{ minHeight: 38 }} />
          <Tab label="Stuffing (PN_04/05)" icon={<LocalShippingIcon sx={{ fontSize: 16 }} />} iconPosition="start" sx={{ minHeight: 38 }} />
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        {tab === 0 && (
          <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', minHeight: 280 }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssignmentIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>재처리·MtoM 계획 — MP_DMND_TYPE + MP_DMND_TYPE_DTL (드롭다운: MP_DMND_TP_GRP)</Typography>
              <Chip size="small" label={`${REWORK.length}건`} variant="outlined" />
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {['LOCAT_TP','LOCAT_CD','LOCAT_NM','MP_DMND_TYPE','TYPE_DTL','RES_CD','원 품목 → 신 품목','수량','REMARK','상태'].map((c) => (
                      <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11,
                        textAlign: ['수량','상태'].includes(c) ? (c === '수량' ? 'right' : 'center') : 'left' }}>{c}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {REWORK.map((r, i) => {
                    const s = STATUS_INFO[r.STATUS];
                    return (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontSize: 12 }}>{r.LOCAT_TP}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.LOCAT_CD}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{r.LOCAT_NM}</TableCell>
                        <TableCell>
                          <Chip size="small" label={r.MP_DMND_TYPE} color={r.MP_DMND_TYPE === 'REWORK' ? 'warning' : 'info'} variant="outlined" />
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>{r.MP_DMND_TYPE_DTL}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{r.RES_CD}</TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography variant="caption">{r.FROM_ITEM}</Typography>
                            <Inventory2Icon sx={{ fontSize: 14, color: 'primary.main' }} />
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main' }}>{r.TO_ITEM}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.QTY.toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: 11, color: 'text.secondary' }}>{r.REMARK}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip size="small" label={s.label} color={s.color} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {tab === 1 && (
          <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', minHeight: 280 }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <SwapHorizIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>거점간 재고이동 — ITEM 그룹 (PH1/2/3) + LOCAT_DIV (P_S_DIV) + FROM/TO LOCAT 그룹</Typography>
              <Chip size="small" label={`${MOVE.length}건`} variant="outlined" />
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell colSpan={5} sx={{ backgroundColor: '#fce4ec', fontWeight: 700, textAlign: 'center' }}>ITEM 그룹</TableCell>
                    <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>LOCAT_DIV</TableCell>
                    <TableCell colSpan={2} sx={{ backgroundColor: '#e3f2fd', fontWeight: 700, textAlign: 'center' }}>FROM LOCAT</TableCell>
                    <TableCell colSpan={2} sx={{ backgroundColor: '#e8f5e9', fontWeight: 700, textAlign: 'center' }}>TO LOCAT</TableCell>
                    <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700, textAlign: 'right' }}>수량</TableCell>
                    <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700, textAlign: 'center' }}>ETD/ETA</TableCell>
                    <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700, textAlign: 'center' }}>상태</TableCell>
                  </TableRow>
                  <TableRow>
                    {['PH1','PH2','PH3','ITEM_CD','품목명'].map((c) => (
                      <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11 }}>{c}</TableCell>
                    ))}
                    {['LOCAT_TP','거점','LOCAT_TP ','거점 '].map((c, i) => (
                      <TableCell key={i} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11 }}>{c.trim()}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {MOVE.map((r, i) => {
                    const s = STATUS_INFO[r.STATUS];
                    return (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontSize: 12 }}>{r.PH1}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{r.PH2}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{r.PH3}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.ITEM_CD}</TableCell>
                        <TableCell>{r.ITEM_NM}</TableCell>
                        <TableCell>
                          <Chip size="small" label={r.LOCAT_DIV} color={r.LOCAT_DIV === 'EXTERNAL' ? 'warning' : 'info'} variant="outlined" />
                        </TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{r.FROM_LOCAT_TP}</TableCell>
                        <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{r.FROM_LOCAT}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{r.TO_LOCAT_TP}</TableCell>
                        <TableCell sx={{ fontSize: 12, fontWeight: 600, color: 'success.main' }}>{r.TO_LOCAT}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.QTY.toLocaleString()}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>
                          {r.ETD}<br />{r.ETA}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip size="small" label={s.label} color={s.color} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {tab === 2 && (
          <>
            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
              <Tabs value={subTab} onChange={(_, v) => setSubTab(v)} variant="scrollable" sx={{ minHeight: 32 }}>
                <Tab label="Stuffing 마스터 (PN_04)" sx={{ minHeight: 32, fontSize: 12 }} />
                <Tab label="버전별 Stuffing (PN_05) — Sales Order 연계" sx={{ minHeight: 32, fontSize: 12 }} />
              </Tabs>
            </Box>
            {subTab === 0 && (
              <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', minHeight: 280 }}>
                <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalShippingIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Stuffing 컨테이너 마스터 — STATUS_FLAG/STUFFING_ID/PROD_CORP × SALES_CORP</Typography>
                  <Chip size="small" label={`평균 Fill ${(STUFFING.reduce((a,b)=>a+b.FILL,0)/STUFFING.length).toFixed(1)}%`} color="info" variant="outlined" />
                </Box>
                <TableContainer sx={{ flex: 1 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {['STATUS_FLAG','STUFFING_ID','SEQ','PROD_CORP','PROD_PLANT','PROD_LOCAT','SALES_CORP','SALES_PLANT','DEST','ETD','CNTR','CTN','CBM','Fill (%)'].map((c) => (
                          <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11,
                            textAlign: ['STATUS_FLAG','SEQ','ETD','CNTR','CTN','CBM','Fill (%)'].includes(c) ? (['CNTR','CTN','CBM','Fill (%)'].includes(c) ? 'right' : 'center') : 'left' }}>{c}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {STUFFING.map((r, i) => {
                        const tone = percentStatus(r.FILL, { danger: 70, warning: 80, success: 90 });
                        return (
                          <TableRow key={i} hover>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Chip size="small" label={r.STATUS_FLAG} color={r.STATUS_FLAG === 'Y' ? 'success' : 'default'}
                                variant={r.STATUS_FLAG === 'Y' ? 'filled' : 'outlined'} sx={{ height: 18, fontWeight: 700 }} />
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 11 }}>{r.STUFFING_ID}</TableCell>
                            <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.SEQ}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace' }}>{r.PROD_CORP}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{r.PROD_PLANT_CD} {r.PROD_PLANT_NM}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{r.PROD_LOCAT}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace' }}>{r.SALES_CORP}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{r.SALES_PLANT}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{r.DEST}</TableCell>
                            <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 12 }}>{r.ETD}</TableCell>
                            <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.CNTR}</TableCell>
                            <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.CTN.toLocaleString()}</TableCell>
                            <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.CBM.toFixed(1)}</TableCell>
                            <TableCell sx={cellSx(tone, { align: 'right', mono: true })}>{r.FILL.toFixed(1)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
            {subTab === 1 && (
              <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', minHeight: 280 }}>
                <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalShippingIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>버전별 Stuffing 현황 — CHK_STUFFING + SIMUL_VER_ID + Sales Order (ODR_INVOICE_NO)</Typography>
                  <Chip size="small" label="시뮬레이션-버전 스냅샷" color="highlight" variant="outlined" sx={{ backgroundColor: '#f3e5f5', color: '#6a1b9a', fontWeight: 700 }} />
                </Box>
                <TableContainer sx={{ flex: 1 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {['CHK','SIMUL_VER_ID','STUFFING_ID','PROD_LOCAT','SALES_LOCAT','ODR_INVOICE_NO','ORDER_TYPE','수량','Fill (%)'].map((c) => (
                          <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11,
                            textAlign: ['CHK','ORDER_TYPE','수량','Fill (%)'].includes(c) ? (['수량','Fill (%)'].includes(c) ? 'right' : 'center') : 'left' }}>{c}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {VER_STUFFING.map((r, i) => {
                        const tone = r.FILL > 0 ? percentStatus(r.FILL, { danger: 70, warning: 80, success: 90 }) : 'normal';
                        return (
                          <TableRow key={i} hover sx={{ backgroundColor: r.CHK_STUFFING ? undefined : 'rgba(244,67,54,0.04)' }}>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Chip size="small" label={r.CHK_STUFFING ? '✓' : '✗'} color={r.CHK_STUFFING ? 'success' : 'error'}
                                sx={{ height: 18, fontWeight: 700, minWidth: 28 }} />
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{r.SIMUL_VER_ID}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 11 }}>{r.STUFFING_ID}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{r.PROD_LOCAT}</TableCell>
                            <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{r.SALES_LOCAT}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.ODR_INVOICE_NO}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Chip size="small" label={r.ORDER_TYPE} color={r.ORDER_TYPE === 'STD' ? 'default' : 'warning'} variant="outlined" />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.QTY.toLocaleString()}</TableCell>
                            <TableCell sx={r.FILL > 0 ? cellSx(tone, { align: 'right', mono: true }) : { textAlign: 'right', fontFamily: 'monospace', color: 'text.disabled' }}>
                              {r.FILL > 0 ? r.FILL.toFixed(1) : '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </>
        )}
      </Box>
    </MockShell>
  );
}

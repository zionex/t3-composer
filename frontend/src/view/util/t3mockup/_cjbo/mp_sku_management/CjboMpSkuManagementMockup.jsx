import React, { useState } from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// CJBO — MP SKU 우선순위/비율/Capa
// UI_MP_ST_01 SubSkuPriority      — 대체 SKU 우선순위 (LOCAT + ITEM PH1/2/3 + ALT_ITEM_CD, 버전관리)
// UI_MP_ST_02 ItemRes/Capacity    — 품목 ↔ 자원 capacity 매핑 (LOCATION + ITEM + RES 그룹)
// UI_MP_ST_03 PeriodCap            — 기간별 Capa (lineItemCapa/lineCapa 서브탭, searchDt 일자, PH1/2/3 cascade)
// UI_MP_ST_04 SubSkuProportion    — 대체 SKU 판매 비율 (ALT_ITEM + ESNT_SALE_RATE % editable + PERIOD)

// ST_01 + ST_04 통합 — 우선순위 + 비율
const PRIORITY = [
  { LOCAT: '경기 광주 1물류', ITEM_CD: 'F01001', ITEM: 'illuvia 비건마스크 5매',     ALT_ITEM: 'F01001-B',  ALT_NM: 'illuvia 비건마스크 5매 (Rev.2)',  PRIORITY: 1, RATE: 60.0, PERIOD: '2026-06 ~ 2026-12', VER: 'V2026-06' },
  { LOCAT: '경기 광주 1물류', ITEM_CD: 'F01001', ITEM: 'illuvia 비건마스크 5매',     ALT_ITEM: 'F01001-C',  ALT_NM: 'illuvia 비건마스크 5매 (해외용)', PRIORITY: 2, RATE: 40.0, PERIOD: '2026-06 ~ 2026-12', VER: 'V2026-06' },
  { LOCAT: '경기 광주 1물류', ITEM_CD: 'F01002', ITEM: 'illuvia 토너 200ml',          ALT_ITEM: 'F01002-A',  ALT_NM: 'illuvia 토너 200ml (Rev.1)',     PRIORITY: 1, RATE: 80.0, PERIOD: '2026-06 ~ 2026-12', VER: 'V2026-06' },
  { LOCAT: '경기 광주 1물류', ITEM_CD: 'F01002', ITEM: 'illuvia 토너 200ml',          ALT_ITEM: 'F01002-B',  ALT_NM: 'illuvia 토너 150ml (대체)',       PRIORITY: 2, RATE: 20.0, PERIOD: '2026-06 ~ 2026-12', VER: 'V2026-06' },
  { LOCAT: '경기 이천 2물류', ITEM_CD: 'F02001', ITEM: 'CJ Brand Korea KING-RED',     ALT_ITEM: 'F02001-A',  ALT_NM: 'CJ Brand Korea KING-RED (Rev.3)', PRIORITY: 1, RATE: 70.0, PERIOD: '2026-06 ~ 2026-12', VER: 'V2026-06' },
  { LOCAT: '경기 이천 2물류', ITEM_CD: 'F02001', ITEM: 'CJ Brand Korea KING-RED',     ALT_ITEM: 'F02001-B',  ALT_NM: 'CJ Brand Korea KING-PINK',        PRIORITY: 2, RATE: 30.0, PERIOD: '2026-06 ~ 2026-12', VER: 'V2026-06' },
  { LOCAT: 'NGP 전용라인',    ITEM_CD: 'F03001', ITEM: 'NGP Device #01',               ALT_ITEM: 'F03001-A',  ALT_NM: 'NGP Device #01 (글로벌)',         PRIORITY: 1, RATE:100.0, PERIOD: '2026-06 ~ 2026-12', VER: 'V2026-06' },
];

// ST_02 — 품목 ↔ 자원 (라인) capacity 매핑
const ITEM_RES = [
  { LOCAT_TP: '제조',  LOCAT_LV: 'PLANT',    LOCAT: '경기 광주',     PLAN_RES_TP: '주요 라인', RES_CD: 'L01-A', ITEM_CD: 'F01001', ITEM_NM: 'illuvia 비건마스크 5매',   ITEM_TP: '완제품', UOM: 'EA',  PREF: 'Y', MIN_LOT: 1000, MAX_LOT: 5000, RUN_RATE: '450 EA/h' },
  { LOCAT_TP: '제조',  LOCAT_LV: 'PLANT',    LOCAT: '경기 광주',     PLAN_RES_TP: '대체 라인', RES_CD: 'L01-B', ITEM_CD: 'F01001', ITEM_NM: 'illuvia 비건마스크 5매',   ITEM_TP: '완제품', UOM: 'EA',  PREF: 'N', MIN_LOT:  500, MAX_LOT: 3000, RUN_RATE: '320 EA/h' },
  { LOCAT_TP: '제조',  LOCAT_LV: 'PLANT',    LOCAT: '경기 광주',     PLAN_RES_TP: '주요 라인', RES_CD: 'L02-A', ITEM_CD: 'F01002', ITEM_NM: 'illuvia 토너 200ml',        ITEM_TP: '완제품', UOM: 'EA',  PREF: 'Y', MIN_LOT:  500, MAX_LOT: 3500, RUN_RATE: '280 EA/h' },
  { LOCAT_TP: '제조',  LOCAT_LV: 'PLANT',    LOCAT: '경기 이천',     PLAN_RES_TP: '주요 라인', RES_CD: 'L03-A', ITEM_CD: 'F02001', ITEM_NM: 'CJ Brand Korea KING-RED',  ITEM_TP: '완제품', UOM: 'EA',  PREF: 'Y', MIN_LOT:  800, MAX_LOT: 6500, RUN_RATE: '180 EA/h' },
  { LOCAT_TP: '제조',  LOCAT_LV: 'PLANT',    LOCAT: '대전 (NGP)',    PLAN_RES_TP: '주요 라인', RES_CD: 'L99-A', ITEM_CD: 'F03001', ITEM_NM: 'NGP Device #01',            ITEM_TP: '완제품', UOM: 'EA',  PREF: 'Y', MIN_LOT:  500, MAX_LOT: 2500, RUN_RATE: ' 95 EA/h' },
];

// ST_03 — 기간별 Capa
const PERIOD = ['2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'];
const CAPA = [
  { RES_GRP: '경기 광주 1물류 (L01-A)',  cap: [12000, 12500, 13000, 12500, 12000, 12500, 12500], use: [9500, 10800, 11900, 11200, 10500, 11000, 11800], status: ['normal','normal','warning','normal','normal','normal','warning'] },
  { RES_GRP: '경기 광주 1물류 (L01-B)',  cap: [ 8500,  8800,  9000,  8800,  8500,  8800,  8800], use: [7200,  7900,  8500,  7800,  7200,  7500,  8200], status: ['normal','warning','warning','normal','normal','normal','warning'] },
  { RES_GRP: '경기 이천 2물류 (L03-A)',  cap: [ 4500,  4800,  5000,  4800,  4500,  4800,  4800], use: [3800,  4200,  4500,  4100,  3800,  4000,  4400], status: ['normal','normal','normal','normal','normal','normal','normal'] },
  { RES_GRP: '대전 NGP (L99-A)',          cap: [ 3200,  3200,  3200,  3200,  3200,  3200,  3200], use: [2500,  2700,  2700,  2600,  2500,  2550,  2550], status: ['normal','normal','normal','normal','normal','normal','normal'] },
];

export default function CjboMpSkuManagementMockup() {
  const [tab, setTab] = useState(0);
  const [subTab, setSubTab] = useState(0); // PeriodCap 안의 lineCapa / lineItemCapa

  return (
    <MockShell patternCode="cjbo_mp_sku_management" patternLabel="CJBO — MP SKU 우선순위/비율/Capa 관리"
      layoutCategory="LAYOUT_SINGLE"
      description="ST_01 우선순위·비율 + ST_02 품목-자원 capacity + ST_03 기간 Capa (서브탭). UI_MP_ST_01/02/03/04.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="버전" size="small" value="V2026-06" sx={{ width: 130 }} />
          <TextField label="브랜드" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="illuvia">illuvia</MenuItem>
          </TextField>
          <TextField label="라인" size="small" value="" placeholder="[🔍]" sx={{ width: 180 }} />
          {tab === 2 && (
            <TextField label="조회 일자" size="small" value="2099-12-31" sx={{ width: 150 }} />
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="contained" size="small" color="success" startIcon={<SaveIcon />}>저장</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ minHeight: 38 }}>
          <Tab label="우선순위 / 비율 (SubSkuPriority + SubSkuProportion)" sx={{ minHeight: 38 }} />
          <Tab label="품목-자원 매핑 (ItemRes/ItemResCapacity)" sx={{ minHeight: 38 }} />
          <Tab label="기간별 Capa (PeriodCap)" sx={{ minHeight: 38 }} />
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        {tab === 0 && (
          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>대체 SKU 우선순위 + 판매 비율 (ALT_ITEM_CD + ESNT_SALE_RATE)</Typography>
              <Chip size="small" label="버전 V2026-06" variant="outlined" color="primary" />
              <Box sx={{ flexGrow: 1 }} />
              <Button size="small" startIcon={<AddIcon />} variant="outlined">행 추가</Button>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {['거점','품목 코드','품목명','대체 ITEM_CD','대체 품목명','우선순위','ESNT 비율 (%)','PERIOD','버전'].map((c) => (
                      <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                        textAlign: ['우선순위','ESNT 비율 (%)'].includes(c) ? (c === '우선순위' ? 'center' : 'right') : 'left' }}>{c}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {PRIORITY.map((r, i) => (
                    <TableRow key={i} hover>
                      <TableCell>{r.LOCAT}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{r.ITEM_CD}</TableCell>
                      <TableCell>{r.ITEM}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600 }}>{r.ALT_ITEM}</TableCell>
                      <TableCell sx={{ color: 'primary.main' }}>{r.ALT_NM}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip size="small" label={`P${r.PRIORITY}`} color={r.PRIORITY === 1 ? 'primary' : r.PRIORITY === 2 ? 'info' : 'default'} />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, backgroundColor: '#fffde7' }}>{r.RATE.toFixed(1)}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.PERIOD}</TableCell>
                      <TableCell><Chip size="small" label={r.VER} variant="outlined" sx={{ height: 18, fontSize: 10 }} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {tab === 1 && (
          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>품목 ↔ 자원(라인) Capacity 매핑 — LOCATION × ITEM × RES 그룹</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button size="small" startIcon={<AddIcon />} variant="outlined">일괄 등록</Button>
              <Button size="small" startIcon={<AddIcon />} variant="outlined">번들 생성</Button>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell colSpan={4} sx={{ backgroundColor: '#e3f2fd', fontWeight: 700, textAlign: 'center' }}>LOCATION 그룹</TableCell>
                    <TableCell colSpan={5} sx={{ backgroundColor: '#fce4ec', fontWeight: 700, textAlign: 'center' }}>ITEM 그룹</TableCell>
                    <TableCell colSpan={3} sx={{ backgroundColor: '#e8f5e9', fontWeight: 700, textAlign: 'center' }}>RES 그룹</TableCell>
                  </TableRow>
                  <TableRow>
                    {['LOCAT_TP','LV','거점','PLAN_RES_TP'].map((c) => (
                      <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11 }}>{c}</TableCell>
                    ))}
                    {['ITEM_CD','품목명','TYPE','UOM','PREF'].map((c) => (
                      <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: c === 'PREF' ? 'center' : 'left' }}>{c}</TableCell>
                    ))}
                    {['RES_CD','MIN/MAX LOT','RUN RATE'].map((c) => (
                      <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11 }}>{c}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ITEM_RES.map((r, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontSize: 12 }}>{r.LOCAT_TP}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{r.LOCAT_LV}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{r.LOCAT}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{r.PLAN_RES_TP}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.ITEM_CD}</TableCell>
                      <TableCell>{r.ITEM_NM}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{r.ITEM_TP}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, textAlign: 'center' }}>{r.UOM}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip size="small" label={r.PREF} color={r.PREF === 'Y' ? 'success' : 'default'} sx={{ height: 18, fontWeight: 700 }} />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.RES_CD}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.MIN_LOT.toLocaleString()} / {r.MAX_LOT.toLocaleString()}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.RUN_RATE}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {tab === 2 && (
          <>
            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
              <Tabs value={subTab} onChange={(_, v) => setSubTab(v)} variant="scrollable" sx={{ minHeight: 32 }}>
                <Tab label="lineCapa (라인 단위 Capa)" sx={{ minHeight: 32, fontSize: 12 }} />
                <Tab label="lineItemCapa (라인-품목 단위)" sx={{ minHeight: 32, fontSize: 12 }} />
              </Tabs>
            </Box>
            <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 240 }}>
              <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {subTab === 0 ? '라인 단위 Capa vs 사용량 (단위: PCS / 일)' : '라인-품목 단위 Capa 할당 (PH1/PH2/PH3 cascade)'}
                </Typography>
                <Chip size="small" label="searchDt 2099-12-31" variant="outlined" />
              </Box>
              <TableContainer sx={{ flex: 1 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700, position: 'sticky', left: 0, zIndex: 3 }}>라인</TableCell>
                      <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>구분</TableCell>
                      {PERIOD.map((m) => (
                        <TableCell key={m} sx={{ backgroundColor: '#e3f2fd', fontWeight: 700, textAlign: 'right', fontSize: 11 }}>{m.slice(5)}월</TableCell>
                      ))}
                    </TableRow>
                    <TableRow></TableRow>
                  </TableHead>
                  <TableBody>
                    {CAPA.map((r, gi) => [
                      <TableRow key={`${gi}-cap`} hover>
                        <TableCell rowSpan={2} sx={{ position: 'sticky', left: 0, backgroundColor: 'background.paper', fontWeight: 600, borderRight: '1px solid', borderColor: 'divider', verticalAlign: 'middle' }}>{r.RES_GRP}</TableCell>
                        <TableCell><Chip size="small" label="Capa" variant="outlined" color="info" /></TableCell>
                        {r.cap.map((v, j) => (
                          <TableCell key={j} sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12 }}>{v.toLocaleString()}</TableCell>
                        ))}
                      </TableRow>,
                      <TableRow key={`${gi}-use`} hover sx={{ backgroundColor: 'rgba(33,150,243,0.04)' }}>
                        <TableCell><Chip size="small" label="사용" variant="outlined" color="warning" /></TableCell>
                        {r.use.map((v, j) => (
                          <TableCell key={j} sx={cellSx(r.status[j], { align: 'right', mono: true })}>{v.toLocaleString()}</TableCell>
                        ))}
                      </TableRow>,
                    ])}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}
      </Box>
    </MockShell>
  );
}

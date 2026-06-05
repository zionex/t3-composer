import React, { useState } from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Tabs, Tab, Checkbox,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import MockShell from '../../_shared/MockShell';

// CJBO — MP SKU/Capa 관리 4종
// 소스 기반 재작성.
// path:
//   ① UI_MP_ST_01 SubSkuPriority    — masterplan/master/subskupriority/SubSkuPriority.jsx
//   ② UI_MP_ST_02 ItemRes (CJBO)     — view/cjbo/masterplan/master/itemres/ItemRes.jsx — CJBO_RES_* 헤더 + RES_GRP_CD='PACK' 조건 편집
//   ③ UI_MP_ST_03 PeriodCap          — masterplan/master/periodcap/PeriodCap.jsx + LineItemCapa/LineCapa sub-tabs
//   ④ UI_MP_ST_04 SubSkuProportion  — masterplan/master/subskuproportion/SubSkuProportion.jsx — ESNT_SALE_RATE suffix '%'

// ────────── SubSkuPriority (ST_01) ──────────
const PRIORITY_ROWS = [
  { LOCAT_CD: 'KR-PLT1', LOCAT_NM: '한국 사업장1',     PH1_CD: 'AN', PH1_NM: 'Animal Nutrition', PH2_CD: 'LYS', PH2_NM: 'Lysine',     PH3_CD: '78L',  PH3_NM: '78% 액상', ITEM_CD: 'L-LYS-78L',  ITEM_NM: 'L-Lysine 78% (액상)',     ALT_ITEM_CD: 'L-LYS-HCL98', ALT_ITEM_NM: 'L-Lysine HCl 98% (분말)', PRIORITY: 1, ADJ_PRIORITY: 1, ACTV_YN: true },
  { LOCAT_CD: 'KR-PLT1', LOCAT_NM: '한국 사업장1',     PH1_CD: 'AN', PH1_NM: 'Animal Nutrition', PH2_CD: 'LYS', PH2_NM: 'Lysine',     PH3_CD: '78L',  PH3_NM: '78% 액상', ITEM_CD: 'L-LYS-HCL98',ITEM_NM: 'L-Lysine HCl 98% (분말)',  ALT_ITEM_CD: 'L-LYS-78L',  ALT_ITEM_NM: 'L-Lysine 78% (액상)',     PRIORITY: 2, ADJ_PRIORITY: 2, ACTV_YN: true },
  { LOCAT_CD: 'KR-PLT1', LOCAT_NM: '한국 사업장1',     PH1_CD: 'AN', PH1_NM: 'Animal Nutrition', PH2_CD: 'MET', PH2_NM: 'Methionine', PH3_CD: '99P',  PH3_NM: '99% 분말', ITEM_CD: 'L-MET-99',   ITEM_NM: 'L-Methionine 99% (분말)',  ALT_ITEM_CD: 'L-MET-99B',  ALT_ITEM_NM: 'L-Methionine 99% (벌크)', PRIORITY: 1, ADJ_PRIORITY: 1, ACTV_YN: true },
  { LOCAT_CD: 'VN-PLT1', LOCAT_NM: 'Bio-VN 사업장',   PH1_CD: 'AN', PH1_NM: 'Animal Nutrition', PH2_CD: 'TRP', PH2_NM: 'Tryptophan', PH3_CD: '98P',  PH3_NM: '98% 분말', ITEM_CD: 'L-TRP-98',   ITEM_NM: 'L-Tryptophan 98% (분말)',  ALT_ITEM_CD: 'L-TRP-99',   ALT_ITEM_NM: 'L-Tryptophan 99% (분말)', PRIORITY: 1, ADJ_PRIORITY: 1, ACTV_YN: true },
  { LOCAT_CD: 'ID-PLT1', LOCAT_NM: 'Bio-ID 사업장',   PH1_CD: 'BMS',PH1_NM: 'Bio Material',     PH2_CD: 'THR', PH2_NM: 'Threonine',  PH3_CD: '985P', PH3_NM: '98.5% 분말',ITEM_CD: 'L-THR-985',  ITEM_NM: 'L-Threonine 98.5% (분말)', ALT_ITEM_CD: 'L-THR-98',   ALT_ITEM_NM: 'L-Threonine 98% (분말)',  PRIORITY: 1, ADJ_PRIORITY: 2, ACTV_YN: false },
];

// ────────── ItemRes (ST_02 CJBO) ──────────
const ITEMRES_ROWS = [
  { VERSION_CD: 'V2026-06', RES_GRP_CD: 'PROD', RES_GRP_NM: '생산라인',  LOCAT_CD: 'KR-PLT1', LOCAT_NM: '한국 사업장1', PH3_ITEM_CD: 'L-LYS-78L',  PH3_ITEM_NM: 'L-Lysine 78% (액상)',     RES_CD: 'R-FERM-01', RES_NM: 'Fermenter #1',     RES_PRIORITY: 1, DAY_CAPA_VAL: 1500.0, MOQ:  500, ADV_PROD_PERIOD: 7, PERIOD_UOM_CD: 'D', ACTV_YN: true },
  { VERSION_CD: 'V2026-06', RES_GRP_CD: 'PROD', RES_GRP_NM: '생산라인',  LOCAT_CD: 'KR-PLT1', LOCAT_NM: '한국 사업장1', PH3_ITEM_CD: 'L-LYS-HCL98',PH3_ITEM_NM: 'L-Lysine HCl 98% (분말)',  RES_CD: 'R-DRY-01',  RES_NM: 'Dryer #1',         RES_PRIORITY: 1, DAY_CAPA_VAL:  920.0, MOQ:  300, ADV_PROD_PERIOD: 5, PERIOD_UOM_CD: 'D', ACTV_YN: true },
  { VERSION_CD: 'V2026-06', RES_GRP_CD: 'PROD', RES_GRP_NM: '생산라인',  LOCAT_CD: 'KR-PLT1', LOCAT_NM: '한국 사업장1', PH3_ITEM_CD: 'L-MET-99',   PH3_ITEM_NM: 'L-Methionine 99% (분말)',  RES_CD: 'R-CRY-01',  RES_NM: 'Crystallizer #1',  RES_PRIORITY: 1, DAY_CAPA_VAL: 2200.0, MOQ:  800, ADV_PROD_PERIOD: 7, PERIOD_UOM_CD: 'D', ACTV_YN: true },
  { VERSION_CD: 'V2026-06', RES_GRP_CD: 'PACK', RES_GRP_NM: '포장라인',  LOCAT_CD: 'KR-PLT1', LOCAT_NM: '한국 사업장1', PH3_ITEM_CD: 'L-LYS-78L',  PH3_ITEM_NM: 'L-Lysine 78% (액상)',     RES_CD: 'P-DRUM-01', RES_NM: 'Drum 1000L #1',    RES_PRIORITY: 1, DAY_CAPA_VAL:  150.0, MOQ:    0, ADV_PROD_PERIOD: 0, PERIOD_UOM_CD: '-', ACTV_YN: true },
  { VERSION_CD: 'V2026-06', RES_GRP_CD: 'PACK', RES_GRP_NM: '포장라인',  LOCAT_CD: 'KR-PLT1', LOCAT_NM: '한국 사업장1', PH3_ITEM_CD: 'L-MET-99',   PH3_ITEM_NM: 'L-Methionine 99% (분말)',  RES_CD: 'P-BAG-01',  RES_NM: 'Bag 25kg #1',      RES_PRIORITY: 1, DAY_CAPA_VAL:  220.0, MOQ:    0, ADV_PROD_PERIOD: 0, PERIOD_UOM_CD: '-', ACTV_YN: true },
];

// ────────── PeriodCap (ST_03) sub-tabs ──────────
const PERIODCAP_PERIODS = ['2026-06','2026-07','2026-08','2026-09'];
const LINE_ITEM_CAPA = [
  { LOCAT_CD: 'KR-PLT1', RES_CD: 'R-FERM-01', RES_NM: 'Fermenter #1',     PH3_ITEM_CD: 'L-LYS-78L',  cap: [42000, 43500, 45000, 45000] },
  { LOCAT_CD: 'KR-PLT1', RES_CD: 'R-DRY-01',  RES_NM: 'Dryer #1',         PH3_ITEM_CD: 'L-LYS-HCL98',cap: [27600, 28500, 29400, 29400] },
  { LOCAT_CD: 'KR-PLT1', RES_CD: 'R-CRY-01',  RES_NM: 'Crystallizer #1',  PH3_ITEM_CD: 'L-MET-99',   cap: [66000, 68200, 70400, 70400] },
];
const LINE_CAPA = [
  { LOCAT_CD: 'KR-PLT1', RES_CD: 'R-FERM-01', RES_NM: 'Fermenter #1',     cap: [42000, 43500, 45000, 45000] },
  { LOCAT_CD: 'KR-PLT1', RES_CD: 'R-DRY-01',  RES_NM: 'Dryer #1',         cap: [27600, 28500, 29400, 29400] },
  { LOCAT_CD: 'KR-PLT1', RES_CD: 'R-CRY-01',  RES_NM: 'Crystallizer #1',  cap: [66000, 68200, 70400, 70400] },
];

// ────────── SubSkuProportion (ST_04) ──────────
const PROPORTION_ROWS = [
  { LOCAT_CD: 'KR-PLT1', LOCAT_NM: '한국 사업장1', ITEM_CD: 'L-LYS-78L',  ITEM_NM: 'L-Lysine 78% (액상)',     ALT_ITEM_CD: 'L-LYS-HCL98',ALT_ITEM_NM: 'L-Lysine HCl 98%', ESNT_SALE_RATE: 60.0, PERIOD: 1 },
  { LOCAT_CD: 'KR-PLT1', LOCAT_NM: '한국 사업장1', ITEM_CD: 'L-LYS-78L',  ITEM_NM: 'L-Lysine 78% (액상)',     ALT_ITEM_CD: 'L-LYS-98S',  ALT_ITEM_NM: 'L-Lysine 98% Sulfate', ESNT_SALE_RATE: 40.0, PERIOD: 2 },
  { LOCAT_CD: 'KR-PLT1', LOCAT_NM: '한국 사업장1', ITEM_CD: 'L-MET-99',   ITEM_NM: 'L-Methionine 99% (분말)',  ALT_ITEM_CD: 'L-MET-99B',  ALT_ITEM_NM: 'L-Methionine 99% (벌크)', ESNT_SALE_RATE: 100.0, PERIOD: 1 },
  { LOCAT_CD: 'VN-PLT1', LOCAT_NM: 'Bio-VN',       ITEM_CD: 'L-TRP-98',   ITEM_NM: 'L-Tryptophan 98% (분말)',  ALT_ITEM_CD: 'L-TRP-99',   ALT_ITEM_NM: 'L-Tryptophan 99% (분말)', ESNT_SALE_RATE: 100.0, PERIOD: 1 },
];

export default function CjboMpSkuManagementMockup() {
  const [tab, setTab] = useState(0);
  const [periodSub, setPeriodSub] = useState(0);

  return (
    <MockShell patternCode="cjbo_mp_sku_management"
      patternLabel="CJBO — MP SKU/Capa 관리 4종 (ST_01~04)"
      layoutCategory="LAYOUT_SINGLE"
      description="UI_MP_ST_01 SubSkuPriority · UI_MP_ST_02 ItemRes (CJBO 커스텀) · UI_MP_ST_03 PeriodCap (LineItemCapa/LineCapa sub-tabs) · UI_MP_ST_04 SubSkuProportion (ESNT_SALE_RATE %). 모두 SP_CUSTOM_SRH_COMBO_LIST_Q + REST mp/master/...">

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ minHeight: 38 }}>
          <Tab label="① UI_MP_ST_01 SubSkuPriority" sx={{ minHeight: 38 }} />
          <Tab label="② UI_MP_ST_02 ItemRes (CJBO 커스텀)" sx={{ minHeight: 38 }} />
          <Tab label="③ UI_MP_ST_03 PeriodCap" sx={{ minHeight: 38 }} />
          <Tab label="④ UI_MP_ST_04 SubSkuProportion" sx={{ minHeight: 38 }} />
        </Tabs>
      </Box>

      {/* ───── ① SubSkuPriority ───── */}
      {tab === 0 && (
        <>
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <TextField label="verCd (BASE_STD_VERSION)" size="small" select value="V2026-06" sx={{ width: 170 }}>
                <MenuItem value="V2026-06">V2026-06</MenuItem>
              </TextField>
              <TextField label="PH1 (multi)" size="small" select value="ALL" sx={{ width: 130 }}>
                <MenuItem value="ALL">전체</MenuItem><MenuItem value="AN">AN</MenuItem>
              </TextField>
              <TextField label="PH2 (multi)" size="small" select value="ALL" sx={{ width: 130 }}>
                <MenuItem value="ALL">전체</MenuItem>
              </TextField>
              <TextField label="PH3 (multi, paperWidth=300px)" size="small" select value="ALL" sx={{ width: 180 }}>
                <MenuItem value="ALL">전체</MenuItem>
              </TextField>
              <Checkbox size="small" defaultChecked /><Typography variant="caption">actvChk (ACTV_YN)</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
              <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>새로고침</Button>
            </Stack>
          </Box>
          <Box sx={{ p: 1.5, flex: 1, overflow: 'hidden' }}>
            <Paper variant="outlined" sx={{ height: '100%' }}>
              <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>BaseGrid id=&quot;subskupriorityGrid&quot;</Typography>
              </Box>
              <TableContainer sx={{ height: 'calc(100% - 36px)' }}>
                <Table size="small" stickyHeader sx={{ '& th, & td': { fontSize: 11, py: 0.5 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell colSpan={2} sx={{ backgroundColor: '#e3f2fd', textAlign: 'center', fontWeight: 700 }}>LOCAT</TableCell>
                      <TableCell colSpan={8} sx={{ backgroundColor: '#fce4ec', textAlign: 'center', fontWeight: 700 }}>ITEM (PH1/PH2/PH3 + ITEM_CD/NM)</TableCell>
                      <TableCell colSpan={2} sx={{ backgroundColor: '#fff9c4', textAlign: 'center', fontWeight: 700 }}>대체 SKU</TableCell>
                      <TableCell colSpan={3} sx={{ backgroundColor: '#dcedc8', textAlign: 'center', fontWeight: 700 }}>우선순위</TableCell>
                    </TableRow>
                    <TableRow>
                      {['LOCAT_CD','LOCAT_NM','PH1_CD','PH1_NM','PH2_CD','PH2_NM','PH3_CD','PH3_NM','ITEM_CD','ITEM_NM','ALT_ITEM_CD','ALT_ITEM_NM','PRIORITY (hidden)','ADJ_PRIORITY (editable)','ACTV_YN'].map((c) => (
                        <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 10, py: 0.5,
                          textAlign: ['PRIORITY (hidden)','ADJ_PRIORITY (editable)','ACTV_YN'].includes(c) ? 'center' : 'left' }}>{c}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {PRIORITY_ROWS.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.LOCAT_CD}</TableCell>
                        <TableCell>{r.LOCAT_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.PH1_CD}</TableCell>
                        <TableCell>{r.PH1_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.PH2_CD}</TableCell>
                        <TableCell>{r.PH2_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.PH3_CD}</TableCell>
                        <TableCell>{r.PH3_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.ITEM_CD}</TableCell>
                        <TableCell>{r.ITEM_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600 }}>{r.ALT_ITEM_CD}</TableCell>
                        <TableCell sx={{ color: 'primary.main' }}>{r.ALT_ITEM_NM}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', color: 'text.secondary' }}>{r.PRIORITY}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', backgroundColor: '#fffde7', fontWeight: 700 }}>{r.ADJ_PRIORITY}</TableCell>
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

      {/* ───── ② ItemRes (CJBO 커스텀) ───── */}
      {tab === 1 && (
        <>
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <TextField label="verCd" size="small" select value="V2026-06" sx={{ width: 170 }}>
                <MenuItem value="V2026-06">V2026-06</MenuItem>
              </TextField>
              <TextField label="resGrp (RES_GRP)" size="small" select value="ALL" sx={{ width: 150 }}>
                <MenuItem value="ALL">전체</MenuItem>
                <MenuItem value="PROD">PROD 생산</MenuItem>
                <MenuItem value="PACK">PACK 포장</MenuItem>
              </TextField>
              <TextField label="resCd (multi RES_CD)" size="small" select value="ALL" sx={{ width: 150 }}>
                <MenuItem value="ALL">전체</MenuItem>
              </TextField>
              <TextField label="LocationSearchBox" size="small" value="전체" sx={{ width: 200 }}
                InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
              <TextField label="MultiItemSearchInput" size="small" value="전체" sx={{ width: 200 }}
                InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
            </Stack>
          </Box>
          <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined">PopItemByRes</Button>
            <Button size="small" variant="outlined">PopVersionCopy</Button>
            <Button size="small" variant="outlined">PopCapaManagement</Button>
            <Button size="small" variant="outlined">PopCommResource</Button>
            <Button size="small" variant="outlined">PopItemResCapaNew</Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
          </Box>
          <Box sx={{ p: 1.5, flex: 1, overflow: 'hidden' }}>
            <Paper variant="outlined" sx={{ height: '100%' }}>
              <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>BaseGrid grid1Columns — CJBO_RES_* 헤더 + RES_GRP_CD='PACK' 조건부 편집</Typography>
                <Chip size="small" label="REST: mp/master/itemres/q1,s1,s3" variant="outlined" sx={{ height: 16, fontSize: 9 }} />
              </Box>
              <TableContainer sx={{ height: 'calc(100% - 36px)' }}>
                <Table size="small" stickyHeader sx={{ '& th, & td': { fontSize: 11, py: 0.5 } }}>
                  <TableHead>
                    <TableRow>
                      {['CJBO_RES_GRP (RES_GRP_CD)','CJBO_RES_GRP (NM)','LOCAT_CD','LOCAT_NM','PH3_ITEM_CD','PH3_ITEM_NM','CJBO_RES_CD','CJBO_RES_NM','RES_PRIORITY','DAY_CAPA_VAL (#,###.0)','MOQ','PST (ADV_PROD_PERIOD)','FRZ_PERIOD_UOM','ACTV_YN'].map((c) => (
                        <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 10, py: 0.5,
                          textAlign: ['RES_PRIORITY','DAY_CAPA_VAL (#,###.0)','MOQ','PST (ADV_PROD_PERIOD)','FRZ_PERIOD_UOM','ACTV_YN'].includes(c) ? 'center' : 'left' }}>{c}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ITEMRES_ROWS.map((r, i) => {
                      const packDisabled = r.RES_GRP_CD === 'PACK';
                      return (
                        <TableRow key={i} hover>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{r.RES_GRP_CD}</TableCell>
                          <TableCell>{r.RES_GRP_NM}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{r.LOCAT_CD}</TableCell>
                          <TableCell>{r.LOCAT_NM}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{r.PH3_ITEM_CD}</TableCell>
                          <TableCell>{r.PH3_ITEM_NM}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.RES_CD}</TableCell>
                          <TableCell>{r.RES_NM}</TableCell>
                          <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.RES_PRIORITY}</TableCell>
                          <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', backgroundColor: '#fffde7' }}>{r.DAY_CAPA_VAL.toFixed(1)}</TableCell>
                          <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', backgroundColor: packDisabled ? '#f5f5f5' : '#fffde7', color: packDisabled ? '#999' : 'inherit' }}>{r.MOQ || '-'}</TableCell>
                          <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', backgroundColor: packDisabled ? '#f5f5f5' : '#fffde7', color: packDisabled ? '#999' : 'inherit' }}>{r.ADV_PROD_PERIOD || '-'}</TableCell>
                          <TableCell sx={{ textAlign: 'center', backgroundColor: packDisabled ? '#f5f5f5' : '#fffde7', color: packDisabled ? '#999' : 'inherit' }}>{r.PERIOD_UOM_CD}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}><Checkbox size="small" checked={r.ACTV_YN} disabled sx={{ p: 0 }} /></TableCell>
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

      {/* ───── ③ PeriodCap ───── */}
      {tab === 2 && (
        <>
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <TextField label="verCd" size="small" select value="V2026-06" sx={{ width: 170 }}>
                <MenuItem value="V2026-06">V2026-06</MenuItem>
              </TextField>
              <TextField label="searchDt (FROM_DATE ~ END_DATE)" size="small" value="2026-06-01 ~ 2026-09-30" sx={{ width: 230 }} />
              <TextField label="LocationSearchBox" size="small" value="전체" sx={{ width: 180 }}
                InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
              <TextField label="resCd (multi)" size="small" select value="ALL" sx={{ width: 130 }}>
                <MenuItem value="ALL">전체</MenuItem>
              </TextField>
              {periodSub === 0 && (
                <>
                  <TextField label="PH1 (multi, lineItemCapa 전용)" size="small" select value="ALL" sx={{ width: 200 }}>
                    <MenuItem value="ALL">전체</MenuItem>
                  </TextField>
                  <TextField label="MultiItemSearchInput" size="small" value="전체" sx={{ width: 180 }}
                    InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
                </>
              )}
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
            </Stack>
          </Box>
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
            <Tabs value={periodSub} onChange={(_, v) => setPeriodSub(v)} sx={{ minHeight: 32 }}>
              <Tab label="lineItemCapa" sx={{ minHeight: 32, fontSize: 11 }} />
              <Tab label="lineCapa" sx={{ minHeight: 32, fontSize: 11 }} />
            </Tabs>
          </Box>
          <Box sx={{ p: 1.5, flex: 1, overflow: 'hidden' }}>
            <Paper variant="outlined" sx={{ height: '100%' }}>
              <TableContainer sx={{ height: '100%' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11 }}>LOCAT_CD</TableCell>
                      <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11 }}>RES_CD / NM</TableCell>
                      {periodSub === 0 && <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11 }}>PH3_ITEM_CD</TableCell>}
                      {PERIODCAP_PERIODS.map((p) => (
                        <TableCell key={p} sx={{ backgroundColor: '#e3f2fd', fontWeight: 700, textAlign: 'right', fontSize: 11 }}>{p}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(periodSub === 0 ? LINE_ITEM_CAPA : LINE_CAPA).map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.LOCAT_CD}</TableCell>
                        <TableCell><Typography variant="body2">{r.RES_CD}</Typography><Typography variant="caption" color="text.secondary">{r.RES_NM}</Typography></TableCell>
                        {periodSub === 0 && <TableCell sx={{ fontFamily: 'monospace' }}>{r.PH3_ITEM_CD}</TableCell>}
                        {r.cap.map((v, j) => (
                          <TableCell key={j} sx={{ textAlign: 'right', fontFamily: 'monospace', backgroundColor: '#fffde7' }}>{v.toLocaleString()}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </>
      )}

      {/* ───── ④ SubSkuProportion ───── */}
      {tab === 3 && (
        <>
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <TextField label="LocationSearchBox (LOCAT plantTp='S')" size="small" value="전체" sx={{ width: 240 }}
                InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
            </Stack>
          </Box>
          <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
            <Button size="small" startIcon={<FileDownloadIcon />} variant="outlined">엑셀 다운로드</Button>
            <Button size="small" startIcon={<FileUploadIcon />} variant="outlined">엑셀 업로드</Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" startIcon={<AddIcon />} variant="outlined">행 추가</Button>
            <Button size="small" startIcon={<SaveIcon />} variant="contained">저장 (REST: mp/master/subskuproportion/q1,s1,d1)</Button>
          </Box>
          <Box sx={{ p: 1.5, flex: 1, overflow: 'hidden' }}>
            <Paper variant="outlined" sx={{ height: '100%' }}>
              <TableContainer sx={{ height: '100%' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {['LOCAT_CD (merged)','LOCAT_NM','ITEM_CD (merged)','ITEM_NM','ALT_ITEM_CD','ALT_ITEM_NM','ESNT_SALE_RATE (% editable, mergeEdit)','PERIOD (header PRIORITY)'].map((c) => (
                        <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11, py: 0.5,
                          textAlign: ['ESNT_SALE_RATE (% editable, mergeEdit)','PERIOD (header PRIORITY)'].includes(c) ? 'center' : 'left' }}>{c}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {PROPORTION_ROWS.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.LOCAT_CD}</TableCell>
                        <TableCell>{r.LOCAT_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.ITEM_CD}</TableCell>
                        <TableCell>{r.ITEM_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.ALT_ITEM_CD}</TableCell>
                        <TableCell>{r.ALT_ITEM_NM}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', backgroundColor: '#fffde7', fontWeight: 700 }}>{r.ESNT_SALE_RATE.toFixed(1)}%</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.PERIOD}</TableCell>
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

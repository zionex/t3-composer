import React, { useState } from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Tabs, Tab, Chip, ToggleButton, ToggleButtonGroup,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import UpdateIcon from '@mui/icons-material/Update';
import MockShell from '../../_shared/MockShell';

// CJBO — SKU 비율 관리 (DpItemRatio / DpItemRatioOP)
// 소스 기반 재작성. *Mon 변형은 소스에 존재하지 않음 → 제외.
// path: view/demandplan/service/dpitemratio/DpItemRatio.jsx       (TP, gplanCd='T')
//       view/demandplan/service/dpitemratioop/DpItemRatioOP.jsx   (OP, gplanCd='O')
// TP: 2 tabs (TAB_ITEM_RATIO, TAB_ITEM_RATIO_DET)
// OP: 3 tabs (+ TAB_ITEM_RATIO_DET_CUST) + 4 actual-update 버튼 (1M/3M/6M/12M)
// 데이터 SP: POST demandplan/dpitemratio/{q1,s1,d1,actualAllUpdate,actualUpdate,measureUpdate}
//           또는 demandplan/dpitemratioop/...

const L = {
  VERSION_ID:    { ko: '버전',         key: 'VERSION_ID' },
  SALES_AREA_CD: { ko: '판매지역',     key: 'SALES_AREA_CD' },
  SALES_GRP_CD:  { ko: '사업담당',     key: 'SALES_GRP_CD' },
  BASE_YYYYMM:   { ko: '기준 YYYYMM',  key: 'BASE_YYYYMM' },
  PROCESS_STATUS:{ ko: '처리 상태',    key: 'PROCESS_STATUS' },
  TAB_RATIO:     { ko: 'SKU 비율',     key: 'TAB_ITEM_RATIO' },
  TAB_RATIO_DET: { ko: '상세',         key: 'TAB_ITEM_RATIO_DET' },
  TAB_RATIO_CUST:{ ko: '상세 (거래처)',key: 'TAB_ITEM_RATIO_DET_CUST' },
};

// Tab1: DpItemRatioGrid1Items / DpItemRatioOPGrid1Items
// 컬럼은 소스 그대로. OP 는 CUST_NM 추가 (TRADE_TYPE_NM 뒤).
const ratioRows = (isOP) => ([
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '베트남',     TRADE_TYPE_NM: '수출', CUST_NM: 'Jakarta Corp.',   SML_GRP_CD: 'PH3-LYS', SML_GRP_NM: '라이신 78% 액상',  ITEM_CD: 'L-LYS-78L',  ITEM_NM: 'L-Lysine 78% (액상)',     PER_QTY:  1.0, PER_UOM: 'MT', APPLY_NM: '평균', START_YM: '2026-01', END_YM: '2026-12', AVG_QTY: 1500, QTY_RTO: 32.5, APPLY_YN: 'Y', APPLY_QTY_RTO: 32.5, ACT_APPLY_DT: '2026-05-31' },
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '베트남',     TRADE_TYPE_NM: '수출', CUST_NM: 'Jakarta Corp.',   SML_GRP_CD: 'PH3-LYS', SML_GRP_NM: '라이신 78% 액상',  ITEM_CD: 'L-LYS-HCL98',ITEM_NM: 'L-Lysine HCl 98% (분말)',  PER_QTY:  1.0, PER_UOM: 'MT', APPLY_NM: '평균', START_YM: '2026-01', END_YM: '2026-12', AVG_QTY:  920, QTY_RTO: 19.5, APPLY_YN: 'Y', APPLY_QTY_RTO: 19.5, ACT_APPLY_DT: '2026-05-31' },
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '인도네시아', TRADE_TYPE_NM: '수출', CUST_NM: 'Sao Paulo Corp.', SML_GRP_CD: 'PH3-TRP', SML_GRP_NM: '트립토판',          ITEM_CD: 'L-TRP-98',   ITEM_NM: 'L-Tryptophan 98% (분말)',  PER_QTY:  1.0, PER_UOM: 'MT', APPLY_NM: '평균', START_YM: '2026-01', END_YM: '2026-12', AVG_QTY:  820, QTY_RTO: 17.0, APPLY_YN: 'Y', APPLY_QTY_RTO: 17.0, ACT_APPLY_DT: '2026-05-31' },
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '미국',       TRADE_TYPE_NM: '수출', CUST_NM: 'New York Corp.',  SML_GRP_CD: 'PH3-MET', SML_GRP_NM: '메티오닌',          ITEM_CD: 'L-MET-99',   ITEM_NM: 'L-Methionine 99% (분말)',  PER_QTY:  1.0, PER_UOM: 'MT', APPLY_NM: '평균', START_YM: '2026-01', END_YM: '2026-12', AVG_QTY: 2200, QTY_RTO: 18.0, APPLY_YN: 'Y', APPLY_QTY_RTO: 18.0, ACT_APPLY_DT: '2026-05-31' },
  { BIG_AREA_NM: 'BMS',              SALES_AREA_NM: '브라질',     TRADE_TYPE_NM: '수출', CUST_NM: 'Vancouver Corp.', SML_GRP_CD: 'PH3-THR', SML_GRP_NM: '트레오닌',          ITEM_CD: 'L-THR-985',  ITEM_NM: 'L-Threonine 98.5% (분말)', PER_QTY:  1.0, PER_UOM: 'MT', APPLY_NM: '평균', START_YM: '2026-01', END_YM: '2026-12', AVG_QTY:  480, QTY_RTO:  8.0, APPLY_YN: 'N', APPLY_QTY_RTO:  0.0, ACT_APPLY_DT: '-' },
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '중국',       TRADE_TYPE_NM: '수출', CUST_NM: 'Mexico City Corp.',SML_GRP_CD: 'PH3-VAL',SML_GRP_NM: '발린',              ITEM_CD: 'L-VAL-96',   ITEM_NM: 'L-Valine 96.5% (분말)',     PER_QTY:  1.0, PER_UOM: 'MT', APPLY_NM: '평균', START_YM: '2026-01', END_YM: '2026-12', AVG_QTY:  250, QTY_RTO:  5.0, APPLY_YN: 'Y', APPLY_QTY_RTO:  5.0, ACT_APPLY_DT: '2026-05-31' },
].map(r => isOP ? r : (() => { const { CUST_NM, ...rest } = r; return rest; })()));

// Tab2: Det — LOCAT_CD + CUST_NM + SALES_ACT_QTY 포함 read-only
const detRows = [
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '베트남', TRADE_TYPE_NM: '수출', SML_GRP_CD: 'PH3-LYS', SML_GRP_NM: '라이신 78% 액상', ITEM_CD: 'L-LYS-78L',   ITEM_NM: 'L-Lysine 78% (액상)',     LOCAT_CD: 'VN-HCM', CUST_NM: 'Jakarta Corp.',     START_YM: '2026-01', END_YM: '2026-12', APPLY_YN: 'Y', APPLY_QTY_RTO: 32.5, ACT_APPLY_DT: '2026-05-31', QTY_RTO: 32.5, SALES_ACT_QTY: 1450 },
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '베트남', TRADE_TYPE_NM: '수출', SML_GRP_CD: 'PH3-LYS', SML_GRP_NM: '라이신 78% 액상', ITEM_CD: 'L-LYS-HCL98', ITEM_NM: 'L-Lysine HCl 98% (분말)',  LOCAT_CD: 'VN-HCM', CUST_NM: 'Jakarta Corp.',     START_YM: '2026-01', END_YM: '2026-12', APPLY_YN: 'Y', APPLY_QTY_RTO: 19.5, ACT_APPLY_DT: '2026-05-31', QTY_RTO: 19.5, SALES_ACT_QTY:  900 },
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '인도네시아',TRADE_TYPE_NM: '수출', SML_GRP_CD: 'PH3-TRP', SML_GRP_NM: '트립토판',         ITEM_CD: 'L-TRP-98',   ITEM_NM: 'L-Tryptophan 98% (분말)', LOCAT_CD: 'ID-JKT', CUST_NM: 'Sao Paulo Corp.',   START_YM: '2026-01', END_YM: '2026-12', APPLY_YN: 'Y', APPLY_QTY_RTO: 17.0, ACT_APPLY_DT: '2026-05-31', QTY_RTO: 17.0, SALES_ACT_QTY:  780 },
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '미국',     TRADE_TYPE_NM: '수출', SML_GRP_CD: 'PH3-MET', SML_GRP_NM: '메티오닌',         ITEM_CD: 'L-MET-99',   ITEM_NM: 'L-Methionine 99% (분말)', LOCAT_CD: 'US-LAX', CUST_NM: 'New York Corp.',    START_YM: '2026-01', END_YM: '2026-12', APPLY_YN: 'Y', APPLY_QTY_RTO: 18.0, ACT_APPLY_DT: '2026-05-31', QTY_RTO: 18.0, SALES_ACT_QTY: 2100 },
];

export default function CjboDpSkuRatioMockup() {
  const [mode, setMode] = useState('TP'); // 'TP'=DpItemRatio · 'OP'=DpItemRatioOP
  const [tab, setTab] = useState(0);
  const isOP = mode === 'OP';

  // TP: 2 tabs, OP: 3 tabs
  const tabCount = isOP ? 3 : 2;
  React.useEffect(() => { if (tab >= tabCount) setTab(0); }, [mode, tabCount, tab]);

  const rows = ratioRows(isOP);

  return (
    <MockShell patternCode="cjbo_dp_sku_ratio"
      patternLabel={`CJBO — SKU 비율 관리 (${isOP ? 'DpItemRatioOP / gplanCd=O' : 'DpItemRatio / gplanCd=T'})`}
      layoutCategory="LAYOUT_SINGLE"
      description="UI_DP_ITEM_RATIO (TP, 2-tab) · UI_DP_ITEM_RATIO_OP (OP, 3-tab, +1M/3M/6M/12M 실적반영). *_MON 변형은 소스에 없음. POST demandplan/dpitemratio[op]/{q1,s1,d1,actualAllUpdate,actualUpdate,measureUpdate}.">
      {/* Mode toggle */}
      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: '#fffde7', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>화면 변형 선택:</Typography>
        <ToggleButtonGroup value={mode} exclusive onChange={(_, v) => v && setMode(v)} size="small">
          <ToggleButton value="TP">TP (DpItemRatio · gplanCd=T)</ToggleButton>
          <ToggleButton value="OP">OP (DpItemRatioOP · gplanCd=O)</ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="caption" sx={{ color: 'text.secondary', ml: 2 }}>
          소스 차이: OP 는 CUST_NM 컬럼 추가 + 1M/3M/6M/12M 실적반영 버튼 + 3번째 탭 (거래처별 상세)
        </Typography>
      </Box>

      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label={L.VERSION_ID.ko} size="small" select value="V2026-06" sx={{ width: 130 }}>
            <MenuItem value="V2026-06">V2026-06</MenuItem>
          </TextField>
          <TextField label={`${L.SALES_AREA_CD.ko} (multi)`} size="small" select value="ALL" sx={{ width: 150 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <TextField label={`${L.SALES_GRP_CD.ko} (multi)`} size="small" select value="ALL" sx={{ width: 150 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="AN">AN</MenuItem><MenuItem value="TN">TN</MenuItem><MenuItem value="BMS">BMS</MenuItem>
          </TextField>
          <TextField label="ItemSearchInput forEntry" size="small" value="전체" sx={{ width: 200 }}
            InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
          <TextField label={L.BASE_YYYYMM.ko} size="small" select value="2026-05" sx={{ width: 130 }}>
            <MenuItem value="2026-05">2026-05</MenuItem>
            <MenuItem value="2026-04">2026-04</MenuItem>
          </TextField>
          <TextField label={L.PROCESS_STATUS.ko} size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="OPEN">진행중</MenuItem>
            <MenuItem value="CLOSED">마감</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>새로고침</Button>
        </Stack>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ minHeight: 38 }}>
          <Tab label={`${L.TAB_RATIO.ko} (${L.TAB_RATIO.key})`} sx={{ minHeight: 38 }} />
          <Tab label={`${L.TAB_RATIO_DET.ko} (${L.TAB_RATIO_DET.key})`} sx={{ minHeight: 38 }} />
          {isOP && <Tab label={`${L.TAB_RATIO_CUST.ko} (${L.TAB_RATIO_CUST.key})`} sx={{ minHeight: 38 }} />}
        </Tabs>
      </Box>

      {/* Tab1: ButtonArea + Grid */}
      {tab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
          <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Button size="small" startIcon={<FileDownloadIcon />} variant="outlined">엑셀 다운로드</Button>
            <Box sx={{ flexGrow: 1 }} />
            {/* verStatusFlag 조건 버튼 */}
            <Button size="small" variant="outlined" startIcon={<UpdateIcon />}>DP_BTN_ACT_UPDATE_ALL</Button>
            {!isOP && <Button size="small" variant="outlined" startIcon={<UpdateIcon />}>DP_BTN_ACT_UPDATE_OP</Button>}
            {isOP && (
              <>
                <Button size="small" variant="outlined" color="info">1M</Button>
                <Button size="small" variant="outlined" color="info">3M</Button>
                <Button size="small" variant="outlined" color="info">6M</Button>
                <Button size="small" variant="outlined" color="info">12M</Button>
              </>
            )}
            <Button size="small" startIcon={<AddIcon />} variant="outlined">행 추가</Button>
            <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
            <Button size="small" variant="outlined">DP_BTN_MEASURE_UPDATE</Button>
          </Box>
          <Box sx={{ p: 1.5, flex: 1, overflow: 'hidden' }}>
            <Paper variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                  BaseGrid id=&quot;grid1&quot; / {isOP ? 'DpItemRatioOPGrid1Items' : 'DpItemRatioGrid1Items'}
                </Typography>
                <Chip size="small" label={`PopupItemRatio${isOP ? '' : ''}`} variant="outlined" sx={{ height: 16, fontSize: 9 }} />
              </Box>
              <TableContainer sx={{ flex: 1 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {[
                        'BIG_AREA_NM','SALES_AREA_NM','TRADE_TYPE_NM',
                        ...(isOP ? ['CUST_NM'] : []),
                        'SML_GRP_CD','SML_GRP_NM','ITEM_CD','ITEM_NM','PER_QTY','PER_UOM','APPLY_NM',
                        'START_YM','END_YM','AVG_QTY','QTY_RTO (%)','APPLY_YN','APPLY_QTY_RTO (%)','ACT_APPLY_DT',
                      ].map((c) => (
                        <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 10, py: 0.5,
                          textAlign: ['PER_QTY','AVG_QTY','QTY_RTO (%)','APPLY_QTY_RTO (%)'].includes(c) ? 'right' : (['APPLY_YN','START_YM','END_YM','ACT_APPLY_DT'].includes(c) ? 'center' : 'left') }}>{c}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell>{r.BIG_AREA_NM}</TableCell>
                        <TableCell>{r.SALES_AREA_NM}</TableCell>
                        <TableCell>{r.TRADE_TYPE_NM}</TableCell>
                        {isOP && <TableCell>{r.CUST_NM}</TableCell>}
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.SML_GRP_CD}</TableCell>
                        <TableCell>{r.SML_GRP_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.ITEM_CD}</TableCell>
                        <TableCell>{r.ITEM_NM}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.PER_QTY.toFixed(1)}</TableCell>
                        <TableCell>{r.PER_UOM}</TableCell>
                        <TableCell>{r.APPLY_NM}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.START_YM}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.END_YM}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.AVG_QTY.toLocaleString()}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.QTY_RTO.toFixed(1)}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip size="small" label={r.APPLY_YN} color={r.APPLY_YN === 'Y' ? 'success' : 'default'}
                            sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', backgroundColor: '#fffde7', fontWeight: 700 }}>{r.APPLY_QTY_RTO.toFixed(1)}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>{r.ACT_APPLY_DT}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Tab2: Det (read-only) */}
      {tab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
          <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button size="small" startIcon={<FileDownloadIcon />} variant="outlined">엑셀 다운로드</Button>
            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>BaseGrid id=&quot;gridDet&quot; / DpItemRatioDetGridItems (read-only)</Typography>
          </Box>
          <Box sx={{ p: 1.5, flex: 1, overflow: 'hidden' }}>
            <Paper variant="outlined" sx={{ height: '100%' }}>
              <TableContainer sx={{ height: '100%' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {['BIG_AREA_NM','SALES_AREA_NM','TRADE_TYPE_NM','SML_GRP_CD','SML_GRP_NM','ITEM_CD','ITEM_NM','LOCAT_CD','CUST_NM','START_YM','END_YM','APPLY_YN','APPLY_QTY_RTO','ACT_APPLY_DT','QTY_RTO','SALES_ACT_QTY'].map((c) => (
                        <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 10, py: 0.5 }}>{c}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detRows.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell>{r.BIG_AREA_NM}</TableCell>
                        <TableCell>{r.SALES_AREA_NM}</TableCell>
                        <TableCell>{r.TRADE_TYPE_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.SML_GRP_CD}</TableCell>
                        <TableCell>{r.SML_GRP_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.ITEM_CD}</TableCell>
                        <TableCell>{r.ITEM_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.LOCAT_CD}</TableCell>
                        <TableCell>{r.CUST_NM}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.START_YM}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.END_YM}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>{r.APPLY_YN}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.APPLY_QTY_RTO.toFixed(1)}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.ACT_APPLY_DT}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.QTY_RTO.toFixed(1)}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{r.SALES_ACT_QTY.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Tab3: DetCust (OP only) */}
      {isOP && tab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
          <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button size="small" startIcon={<FileDownloadIcon />} variant="outlined">엑셀 다운로드</Button>
            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>BaseGrid / DpItemRatioDetCustGridItems (read-only, OP 전용)</Typography>
          </Box>
          <Box sx={{ p: 1.5, flex: 1, overflow: 'hidden' }}>
            <Paper variant="outlined" sx={{ height: '100%' }}>
              <TableContainer sx={{ height: '100%' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {['BIG_AREA_NM','SALES_AREA_NM','TRADE_TYPE_NM','SML_GRP_CD','SML_GRP_NM','ITEM_CD','ITEM_NM','LOCAT_CD','CUST_CD','CUST_NM','START_YM','END_YM','APPLY_YN','APPLY_QTY_RTO','ACT_APPLY_DT','QTY_RTO','SALES_ACT_QTY'].map((c) => (
                        <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 10, py: 0.5 }}>{c}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detRows.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell>{r.BIG_AREA_NM}</TableCell>
                        <TableCell>{r.SALES_AREA_NM}</TableCell>
                        <TableCell>{r.TRADE_TYPE_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.SML_GRP_CD}</TableCell>
                        <TableCell>{r.SML_GRP_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.ITEM_CD}</TableCell>
                        <TableCell>{r.ITEM_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.LOCAT_CD}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>C-{(i + 101).toString().padStart(4, '0')}</TableCell>
                        <TableCell>{r.CUST_NM}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.START_YM}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.END_YM}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>{r.APPLY_YN}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.APPLY_QTY_RTO.toFixed(1)}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.ACT_APPLY_DT}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.QTY_RTO.toFixed(1)}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{r.SALES_ACT_QTY.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </Box>
      )}
    </MockShell>
  );
}

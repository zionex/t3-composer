import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import MockShell from '../../_shared/MockShell';

// CJBO — 수요계획 정확도 (DpPlanAccuracy.jsx)
// 소스 기반 재작성.
// path: view/demandplan/service/dpplanaccuracy/DpPlanAccuracy.jsx
// POST demandplan/dpplanaccuracy/q1 — body{ACCURACY_CD:'M', PLAN_CD, TERM, SALES_GRP_CD, ITEM_FILTER, ...}
// 차트 / 탭 없음. 단일 BaseGrid id="grid1DpPlanAccuracy".
//
// 그룹 헤더 STATIC (4개):
//   M_1_ACT (UI_DP_REPORT_M_1) → M_1_ACT_QTY (UI_DP_PLAN_ACCURACY_ACT_QTY, #,##0.###)
//   M_3 (UI_DP_REPORT_M_3) → M_3_PLAN_QTY (UI_DP_PLAN_ACCURACY_PLAN_QTY) + M_3_ACCURACY (UI_DP_PLAN_ACCURACY_ACCURACY, #,##0.#)
//   M_2 (UI_DP_REPORT_M_2) → M_2_PLAN_QTY + M_2_ACCURACY
//   M_1 (UI_DP_REPORT_M_1) → M_1_PLAN_QTY + M_1_ACCURACY
//
// setPref (line 423-434): 런타임에 group header text 를 YYYY.MM (term 기준 -0/-1/-2) 으로 교체.
// styleCallback (setRowStyleCallback): BG_COLOR/FG_COLOR 데이터-기반 → Back_<color>/Font_<color>.

const ROWS = [
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '베트남',    TRADE_TYPE_NM: '수출', LOCATION_CD: 'VN-HCM', CUST_NM: 'Jakarta Corp.',   SALES_GRP_CD: 'AN',  BIG_GRP_NM: 'Lysine',     MID_GRP_NM: '78% 액상',  SML_GRP_NM: 'L-Lysine 78%',     bgColor: '',                          fgColor: '',
    M_1_ACT_QTY: 1450,  M_3_PLAN_QTY: 1500, M_3_ACCURACY: 96.7, M_2_PLAN_QTY: 1520, M_2_ACCURACY: 95.4, M_1_PLAN_QTY: 1480, M_1_ACCURACY: 98.0 },
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '인도네시아',TRADE_TYPE_NM: '수출', LOCATION_CD: 'ID-JKT', CUST_NM: 'Sao Paulo Corp.', SALES_GRP_CD: 'AN',  BIG_GRP_NM: 'Tryptophan', MID_GRP_NM: '98% 분말',  SML_GRP_NM: 'L-Tryptophan 98%',  bgColor: '',                          fgColor: '',
    M_1_ACT_QTY:  820,  M_3_PLAN_QTY:  800, M_3_ACCURACY:102.5, M_2_PLAN_QTY:  850, M_2_ACCURACY: 96.5, M_1_PLAN_QTY:  830, M_1_ACCURACY: 98.8 },
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '미국',      TRADE_TYPE_NM: '수출', LOCATION_CD: 'US-LAX', CUST_NM: 'New York Corp.',  SALES_GRP_CD: 'AN',  BIG_GRP_NM: 'Methionine', MID_GRP_NM: '99% 분말',  SML_GRP_NM: 'L-Methionine 99%',  bgColor: 'rgba(244,67,54,0.08)',      fgColor: 'red',
    M_1_ACT_QTY: 1800,  M_3_PLAN_QTY: 2200, M_3_ACCURACY: 81.8, M_2_PLAN_QTY: 2100, M_2_ACCURACY: 85.7, M_1_PLAN_QTY: 2150, M_1_ACCURACY: 83.7 },
  { BIG_AREA_NM: 'BMS',              SALES_AREA_NM: '브라질',    TRADE_TYPE_NM: '수출', LOCATION_CD: 'BR-SSA', CUST_NM: 'Vancouver Corp.', SALES_GRP_CD: 'BMS', BIG_GRP_NM: 'Threonine',  MID_GRP_NM: '98.5% 분말',SML_GRP_NM: 'L-Threonine 98.5%', bgColor: '',                          fgColor: '',
    M_1_ACT_QTY:  520,  M_3_PLAN_QTY:  480, M_3_ACCURACY:108.3, M_2_PLAN_QTY:  500, M_2_ACCURACY:104.0, M_1_PLAN_QTY:  510, M_1_ACCURACY:102.0 },
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '중국',      TRADE_TYPE_NM: '수출', LOCATION_CD: 'CN-SH',  CUST_NM: 'Mexico City Corp.',SALES_GRP_CD: 'AN', BIG_GRP_NM: 'Valine',     MID_GRP_NM: '96.5% 분말',SML_GRP_NM: 'L-Valine 96.5%',     bgColor: 'rgba(76,175,80,0.08)',      fgColor: '',
    M_1_ACT_QTY:  340,  M_3_PLAN_QTY:  250, M_3_ACCURACY:136.0, M_2_PLAN_QTY:  280, M_2_ACCURACY:121.4, M_1_PLAN_QTY:  290, M_1_ACCURACY:117.2 },
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '필리핀',    TRADE_TYPE_NM: '수출', LOCATION_CD: 'PH-MNL', CUST_NM: 'Roma Corp.',      SALES_GRP_CD: 'AN',  BIG_GRP_NM: 'Lysine',     MID_GRP_NM: '78% 액상',  SML_GRP_NM: 'L-Lysine 78%',     bgColor: '',                          fgColor: '',
    M_1_ACT_QTY:  690,  M_3_PLAN_QTY:  700, M_3_ACCURACY: 98.6, M_2_PLAN_QTY:  720, M_2_ACCURACY: 95.8, M_1_PLAN_QTY:  710, M_1_ACCURACY: 97.2 },
];

// runtime group header text (setPref) — term=2026-05 일 때 M_1=2026.05, M_2=2026.04, M_3=2026.03
const H = { M_1_ACT: '2026.05 (M-1)', M_3: '2026.03 (M-3)', M_2: '2026.04 (M-2)', M_1: '2026.05 (M-1)' };

export default function CjboDpPlanAccuracyMockup() {
  return (
    <MockShell patternCode="cjbo_dp_plan_accuracy"
      patternLabel="CJBO — 수요계획 정확도 (DpPlanAccuracy)"
      layoutCategory="LAYOUT_SINGLE"
      description="수요계획 정확도 — 4 그룹 헤더 (실적/M-3/M-2/M-1). 런타임에 그룹 헤더가 YYYY.MM 으로 교체.">


      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="DP_PLAN_GBN (CB_DP_PLAN_GBN)" size="small" select value="M" sx={{ width: 180 }}>
            <MenuItem value="M">월간(DP_PLAN_MONTHLY)</MenuItem>
            <MenuItem value="T">목표(DP_PLAN_TARGET)</MenuItem>
          </TextField>
          <TextField label="MONTH (DP_ACCURACY_M)" size="small" select value="2026-05" sx={{ width: 160 }}>
            <MenuItem value="2026-05">2026-05</MenuItem>
            <MenuItem value="2026-04">2026-04</MenuItem>
          </TextField>
          <TextField label="SALES_GRP_CD (multi)" size="small" select value="ALL" sx={{ width: 150 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="AN">AN</MenuItem><MenuItem value="TN">TN</MenuItem><MenuItem value="BMS">BMS</MenuItem>
          </TextField>
          <TextField label="ItemSearchInput (PH1)" size="small" value="전체" sx={{ width: 180 }}
            InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
          <TextField label="AccountSearchInput" size="small" value="전체" sx={{ width: 160 }}
            InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
          <TextField label="SOLID_GBN_CD" size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="L">L 액상</MenuItem><MenuItem value="S">S 분말</MenuItem>
          </TextField>
          <TextField label="DP_SUM_YN" size="small" select value="Y" sx={{ width: 90 }}>
            <MenuItem value="Y">Y</MenuItem><MenuItem value="N">N</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>새로고침</Button>
        </Stack>
      </Box>

      {/* ButtonArea */}
      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button size="small" startIcon={<FileDownloadIcon />} variant="outlined">엑셀 다운로드</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>SELECT_QTY_SUM: <b>0</b></Typography>
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>MT</Typography>
        <Button size="small" startIcon={<SettingsIcon />} variant="outlined">개인화 (PopPersonalize)</Button>
      </Box>

      {/* ResultArea */}
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader sx={{ '& th, & td': { whiteSpace: 'nowrap', fontSize: 11, py: 0.5 } }}>
              <TableHead>
                <TableRow>
                  {['대지역','판매지역','거래유형','거점','거래처','사업담당','대분류','중분류','소분류'].map((c) => (
                    <TableCell key={c} rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>{c}</TableCell>
                  ))}
                  <TableCell colSpan={1} sx={{ backgroundColor: '#fff9c4', textAlign: 'center', fontWeight: 700 }}>{H.M_1_ACT}<br /><Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 9 }}>M_1_ACT</Typography></TableCell>
                  <TableCell colSpan={2} sx={{ backgroundColor: '#e3f2fd', textAlign: 'center', fontWeight: 700 }}>{H.M_3}<br /><Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 9 }}>M_3</Typography></TableCell>
                  <TableCell colSpan={2} sx={{ backgroundColor: '#c8e6c9', textAlign: 'center', fontWeight: 700 }}>{H.M_2}<br /><Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 9 }}>M_2</Typography></TableCell>
                  <TableCell colSpan={2} sx={{ backgroundColor: '#ffe0b2', textAlign: 'center', fontWeight: 700 }}>{H.M_1}<br /><Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 9 }}>M_1</Typography></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ backgroundColor: '#fff9c4', textAlign: 'right', fontWeight: 600, fontSize: 10 }}>ACT_QTY</TableCell>
                  <TableCell sx={{ backgroundColor: '#e3f2fd', textAlign: 'right', fontWeight: 600, fontSize: 10 }}>PLAN_QTY</TableCell>
                  <TableCell sx={{ backgroundColor: '#e3f2fd', textAlign: 'right', fontWeight: 600, fontSize: 10 }}>ACCURACY</TableCell>
                  <TableCell sx={{ backgroundColor: '#c8e6c9', textAlign: 'right', fontWeight: 600, fontSize: 10 }}>PLAN_QTY</TableCell>
                  <TableCell sx={{ backgroundColor: '#c8e6c9', textAlign: 'right', fontWeight: 600, fontSize: 10 }}>ACCURACY</TableCell>
                  <TableCell sx={{ backgroundColor: '#ffe0b2', textAlign: 'right', fontWeight: 600, fontSize: 10 }}>PLAN_QTY</TableCell>
                  <TableCell sx={{ backgroundColor: '#ffe0b2', textAlign: 'right', fontWeight: 600, fontSize: 10 }}>ACCURACY</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover sx={{ backgroundColor: r.bgColor || undefined }}>
                    <TableCell sx={{ color: r.fgColor === 'red' ? 'error.main' : undefined }}>{r.BIG_AREA_NM}</TableCell>
                    <TableCell sx={{ color: r.fgColor === 'red' ? 'error.main' : undefined }}>{r.SALES_AREA_NM}</TableCell>
                    <TableCell>{r.TRADE_TYPE_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.LOCATION_CD}</TableCell>
                    <TableCell>{r.CUST_NM}</TableCell>
                    <TableCell><Chip size="small" label={r.SALES_GRP_CD} variant="outlined" sx={{ height: 16, fontSize: 9 }} /></TableCell>
                    <TableCell>{r.BIG_GRP_NM}</TableCell>
                    <TableCell>{r.MID_GRP_NM}</TableCell>
                    <TableCell>{r.SML_GRP_NM}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', backgroundColor: '#fffde7', fontWeight: 700 }}>{r.M_1_ACT_QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.M_3_PLAN_QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{r.M_3_ACCURACY.toFixed(1)}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.M_2_PLAN_QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{r.M_2_ACCURACY.toFixed(1)}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.M_1_PLAN_QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{r.M_1_ACCURACY.toFixed(1)}</TableCell>
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

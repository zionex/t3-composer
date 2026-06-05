import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Switch,
  FormControlLabel,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import MockShell from '../../_shared/MockShell';

// CJBO — 버전 비교 (DpVerDiff.jsx)
// 소스 기반 재작성.
// path: view/demandplan/service/dpverdiff/DpVerDiff.jsx
// 데이터: POST demandplan/dpverdiff/q2 (컬럼 메타 — VER_CD_1) → /q1 (양 버전 데이터)
// 동적 크로스탭: 기간별 [VER_1, VER_2, DIFF_2, CONT_2] × [QTY/PRC/AMT or 부분]
// PopPersonalize 컬럼 개인화

const L = {
  PLAN_TP:        { ko: '계획구분',       key: 'PLAN_TP' },
  VERSION_ID:     { ko: '버전',           key: 'VERSION_ID' },
  CMPR_VER:       { ko: '비교 버전',      key: 'CMPR_VER' },
  SALES_GRP_CD:   { ko: '사업담당',       key: 'SALES_GRP_CD' },
  DAY_TYPE_CD:    { ko: '날짜 유형',      key: 'DAY_TYPE_CD' },
  QTY_AMT_TYPE:   { ko: '수량/금액',      key: 'QTY_AMT_TYPE' },
  AMT_UNIT:       { ko: '금액 단위',      key: 'AMT_UNIT' },
  SOLID_GBN_CD:   { ko: '액상/분말',      key: 'SOLID_GBN_CD' },
  DP_SUM_YN:      { ko: '합계 표시',      key: 'DP_SUM_YN' },
  FROM_DATE:      { ko: 'FROM',           key: 'FROM_DATE' },
  TO_DATE:        { ko: 'TO',             key: 'TO_DATE' },
  DIFF_GBN:       { ko: '차이 구분',      key: 'DIFF_GBN' },
  NUM_FORMAT:     { ko: '소수점 표시',    key: 'IM_SWITCH_NUM_FORMAT' },
};

// 기간별 동적 컬럼 — 소스 makeCrossTabFieldsAndColumns
const PERIODS = ['2026-06', '2026-07', '2026-08'];

// 기본 차원 컬럼 (BIG_AREA/SALES_AREA/TRADE_TYPE/LOCATION/CUST/SALES_GRP/BIG/MID/SML_GRP/ITEM CD+NM pairs) 중 visible 만
const ROWS = [
  { BIG_AREA_NM: 'Animal Nutrition',  SALES_AREA_NM: '베트남',     TRADE_TYPE_NM: '수출', LOCATION_CD: 'VN-HCM', CUST_NM: 'Jakarta Corp.',     SALES_GRP_CD: 'AN',  BIG_GRP_NM: 'Lysine',      MID_GRP_NM: '78% 액상',  SML_GRP_NM: 'L-Lysine 78%',           ITEM_NM: 'L-LYS-78L · 1MT',     bgColor: '',           fgColor: '',
    P1: { v1_qty: 1500, v1_amt: 1875,  v2_qty: 1480, v2_amt: 1850,  diff_qty:  -20, diff_amt:   -25, cont_qty: -1.3, cont_amt: -1.3 },
    P2: { v1_qty: 1620, v1_amt: 2025,  v2_qty: 1700, v2_amt: 2125,  diff_qty:   80, diff_amt:  100, cont_qty:  4.9, cont_amt:  4.9 },
    P3: { v1_qty: 1550, v1_amt: 1937,  v2_qty: 1620, v2_amt: 2025,  diff_qty:   70, diff_amt:   88, cont_qty:  4.5, cont_amt:  4.5 },
  },
  { BIG_AREA_NM: 'Animal Nutrition',  SALES_AREA_NM: '인도네시아', TRADE_TYPE_NM: '수출', LOCATION_CD: 'ID-JKT', CUST_NM: 'Sao Paulo Corp.',   SALES_GRP_CD: 'AN',  BIG_GRP_NM: 'Tryptophan',  MID_GRP_NM: '98% 분말',  SML_GRP_NM: 'L-Tryptophan 98%',       ITEM_NM: 'L-TRP-98 · 1MT',      bgColor: '',           fgColor: '',
    P1: { v1_qty:  820, v1_amt: 1640,  v2_qty:  900, v2_amt: 1800,  diff_qty:   80, diff_amt:  160, cont_qty:  9.8, cont_amt:  9.8 },
    P2: { v1_qty:  850, v1_amt: 1700,  v2_qty:  870, v2_amt: 1740,  diff_qty:   20, diff_amt:   40, cont_qty:  2.4, cont_amt:  2.4 },
    P3: { v1_qty:  900, v1_amt: 1800,  v2_qty:  920, v2_amt: 1840,  diff_qty:   20, diff_amt:   40, cont_qty:  2.2, cont_amt:  2.2 },
  },
  { BIG_AREA_NM: 'Animal Nutrition',  SALES_AREA_NM: '미국',       TRADE_TYPE_NM: '수출', LOCATION_CD: 'US-LAX', CUST_NM: 'New York Corp.',    SALES_GRP_CD: 'AN',  BIG_GRP_NM: 'Methionine',  MID_GRP_NM: '99% 분말',  SML_GRP_NM: 'L-Methionine 99%',       ITEM_NM: 'L-MET-99 · 1MT',      bgColor: 'rgba(244,67,54,0.06)', fgColor: 'red',
    P1: { v1_qty: 2200, v1_amt: 4400,  v2_qty: 1800, v2_amt: 3600,  diff_qty: -400, diff_amt: -800, cont_qty:-18.2, cont_amt:-18.2 },
    P2: { v1_qty: 2150, v1_amt: 4300,  v2_qty: 1750, v2_amt: 3500,  diff_qty: -400, diff_amt: -800, cont_qty:-18.6, cont_amt:-18.6 },
    P3: { v1_qty: 2180, v1_amt: 4360,  v2_qty: 1820, v2_amt: 3640,  diff_qty: -360, diff_amt: -720, cont_qty:-16.5, cont_amt:-16.5 },
  },
  { BIG_AREA_NM: 'BMS',               SALES_AREA_NM: '브라질',     TRADE_TYPE_NM: '수출', LOCATION_CD: 'BR-SSA', CUST_NM: 'Vancouver Corp.',   SALES_GRP_CD: 'BMS', BIG_GRP_NM: 'Threonine',   MID_GRP_NM: '98.5% 분말',SML_GRP_NM: 'L-Threonine 98.5%',      ITEM_NM: 'L-THR-985 · 1MT',     bgColor: '',           fgColor: '',
    P1: { v1_qty:  480, v1_amt:  768,  v2_qty:  520, v2_amt:  832,  diff_qty:   40, diff_amt:   64, cont_qty:  8.3, cont_amt:  8.3 },
    P2: { v1_qty:  500, v1_amt:  800,  v2_qty:  540, v2_amt:  864,  diff_qty:   40, diff_amt:   64, cont_qty:  8.0, cont_amt:  8.0 },
    P3: { v1_qty:  510, v1_amt:  816,  v2_qty:  530, v2_amt:  848,  diff_qty:   20, diff_amt:   32, cont_qty:  3.9, cont_amt:  3.9 },
  },
  { BIG_AREA_NM: 'Animal Nutrition',  SALES_AREA_NM: '중국',       TRADE_TYPE_NM: '수출', LOCATION_CD: 'CN-SH',  CUST_NM: 'Mexico City Corp.', SALES_GRP_CD: 'AN',  BIG_GRP_NM: 'Valine',      MID_GRP_NM: '96.5% 분말',SML_GRP_NM: 'L-Valine 96.5%',         ITEM_NM: 'L-VAL-96 · 1MT',      bgColor: 'rgba(76,175,80,0.06)',fgColor: '',
    P1: { v1_qty:  250, v1_amt:  500,  v2_qty:  310, v2_amt:  620,  diff_qty:   60, diff_amt:  120, cont_qty: 24.0, cont_amt: 24.0 },
    P2: { v1_qty:  280, v1_amt:  560,  v2_qty:  340, v2_amt:  680,  diff_qty:   60, diff_amt:  120, cont_qty: 21.4, cont_amt: 21.4 },
    P3: { v1_qty:  290, v1_amt:  580,  v2_qty:  360, v2_amt:  720,  diff_qty:   70, diff_amt:  140, cont_qty: 24.1, cont_amt: 24.1 },
  },
];

function fmt(n) { return n == null ? '-' : n.toLocaleString(); }
function fmtPct(n) { return n == null ? '-' : (n > 0 ? '+' : '') + n.toFixed(1); }
function diffColor(d) { return d > 0 ? 'success.main' : d < 0 ? 'error.main' : 'text.secondary'; }

export default function CjboDpVerDiffMockup() {
  return (
    <MockShell patternCode="cjbo_dp_ver_diff"
      patternLabel="CJBO — 버전 비교 (DpVerDiff)"
      layoutCategory="LAYOUT_SINGLE"
      description="UI_DP_VER_DIFF — 두 DP 버전의 동적 크로스탭 비교. 기간별 [VER_1 · VER_2 · DIFF · CONT(%)] × [QTY/AMT]. setRowStyleCallback (BG/FG_COLOR). PopPersonalize 컬럼 개인화. POST demandplan/dpverdiff/q2 → /q1.">
      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label={L.VERSION_ID.ko} size="small" select value="V2026-06" sx={{ width: 130 }}>
            <MenuItem value="V2026-06">V2026-06</MenuItem>
            <MenuItem value="V2026-05">V2026-05</MenuItem>
          </TextField>
          <TextField label={L.CMPR_VER.ko} size="small" select value="V2026-05" sx={{ width: 130 }}>
            <MenuItem value="V2026-05">V2026-05</MenuItem>
            <MenuItem value="V2026-04">V2026-04</MenuItem>
          </TextField>
          <TextField label={`${L.SALES_GRP_CD.ko} (multi)`} size="small" select value="ALL" sx={{ width: 150 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="AN">AN</MenuItem><MenuItem value="TN">TN</MenuItem><MenuItem value="BMS">BMS</MenuItem>
          </TextField>
          <TextField label="ItemSearchInput (PH1)" size="small" value="전체" sx={{ width: 170 }}
            InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
          <TextField label="AccountSearchInput" size="small" value="전체" sx={{ width: 150 }}
            InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
          <TextField label={L.DAY_TYPE_CD.ko} size="small" select value="M" sx={{ width: 110 }}>
            <MenuItem value="M">월</MenuItem><MenuItem value="W">주</MenuItem>
          </TextField>
          <TextField label={L.QTY_AMT_TYPE.ko} size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">ALL</MenuItem><MenuItem value="QTY">QTY</MenuItem><MenuItem value="AMT">AMT</MenuItem>
          </TextField>
          <TextField label={L.AMT_UNIT.ko} size="small" select value="USD" sx={{ width: 100 }}>
            <MenuItem value="USD">USD</MenuItem><MenuItem value="KRW">KRW</MenuItem>
          </TextField>
          <TextField label={L.SOLID_GBN_CD.ko} size="small" select value="ALL" sx={{ width: 120 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="L">L 액상</MenuItem><MenuItem value="S">S 분말</MenuItem>
          </TextField>
          <TextField label={L.DP_SUM_YN.ko} size="small" select value="Y" sx={{ width: 110 }}>
            <MenuItem value="Y">Y</MenuItem><MenuItem value="N">N</MenuItem>
          </TextField>
          <TextField label={L.FROM_DATE.ko} size="small" type="month" value="2026-06" sx={{ width: 130 }} InputLabelProps={{ shrink: true }} />
          <TextField label={L.TO_DATE.ko} size="small" type="month" value="2026-08" sx={{ width: 130 }} InputLabelProps={{ shrink: true }} />
          <TextField label={L.DIFF_GBN.ko} size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="DIFF">차이만</MenuItem>
          </TextField>
          <FormControlLabel control={<Switch size="small" />} label={<Typography variant="caption">{L.NUM_FORMAT.ko}</Typography>} sx={{ ml: 0 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>새로고침</Button>
        </Stack>
      </Box>

      {/* ButtonArea */}
      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button size="small" startIcon={<FileDownloadIcon />} variant="outlined">엑셀 다운로드 (headerDepth=3)</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>SELECT_QTY_SUM: <b>0</b></Typography>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', ml: 1 }}>단위: USD · 천</Typography>
        <Button size="small" startIcon={<SettingsIcon />} variant="outlined">컬럼 개인화 (PopPersonalize)</Button>
      </Box>

      {/* ResultArea */}
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader sx={{ '& th, & td': { whiteSpace: 'nowrap', fontSize: 11, py: 0.5 } }}>
              <TableHead>
                {/* 3단 헤더 — 동적 크로스탭 */}
                <TableRow>
                  {['대지역','판매지역','거래유형','거점코드','거래처','사업담당','대분류','중분류','소분류','품목명'].map((c) => (
                    <TableCell key={c} rowSpan={3} sx={{ backgroundColor: 'grey.100', fontWeight: 700, position: 'sticky', left: 0, zIndex: 4 }}>{c}</TableCell>
                  ))}
                  {PERIODS.map((p) => (
                    <TableCell key={p} colSpan={8} sx={{ backgroundColor: '#e3f2fd', textAlign: 'center', fontWeight: 700, fontSize: 12 }}>{p}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  {PERIODS.flatMap((p) => [
                    <TableCell key={`${p}-v1`}   colSpan={2} sx={{ backgroundColor: '#bbdefb', textAlign: 'center', fontWeight: 700 }}>VER_1</TableCell>,
                    <TableCell key={`${p}-v2`}   colSpan={2} sx={{ backgroundColor: '#c5cae9', textAlign: 'center', fontWeight: 700 }}>VER_2</TableCell>,
                    <TableCell key={`${p}-diff`} colSpan={2} sx={{ backgroundColor: '#ffe0b2', textAlign: 'center', fontWeight: 700 }}>DIFF</TableCell>,
                    <TableCell key={`${p}-cont`} colSpan={2} sx={{ backgroundColor: '#dcedc8', textAlign: 'center', fontWeight: 700 }}>CONT(%)</TableCell>,
                  ])}
                </TableRow>
                <TableRow>
                  {PERIODS.flatMap((p, idx) => (
                    ['QTY','AMT','QTY','AMT','QTY','AMT','QTY','AMT'].map((c, i) => (
                      <TableCell key={`${p}-${i}`} sx={{ backgroundColor:
                        i < 2 ? '#bbdefb' : i < 4 ? '#c5cae9' : i < 6 ? '#ffe0b2' : '#dcedc8',
                        textAlign: 'right', fontWeight: 600, fontSize: 10 }}>{c}</TableCell>
                    ))
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover sx={{ backgroundColor: r.bgColor || undefined }}>
                    <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: r.bgColor || 'background.paper' }}>{r.BIG_AREA_NM}</TableCell>
                    <TableCell sx={{ position: 'sticky', backgroundColor: r.bgColor || 'background.paper' }}>{r.SALES_AREA_NM}</TableCell>
                    <TableCell>{r.TRADE_TYPE_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.LOCATION_CD}</TableCell>
                    <TableCell sx={{ color: r.fgColor === 'red' ? 'error.main' : undefined, fontWeight: r.fgColor === 'red' ? 700 : undefined }}>{r.CUST_NM}</TableCell>
                    <TableCell><Chip size="small" label={r.SALES_GRP_CD} variant="outlined" sx={{ height: 16, fontSize: 9 }} /></TableCell>
                    <TableCell>{r.BIG_GRP_NM}</TableCell>
                    <TableCell>{r.MID_GRP_NM}</TableCell>
                    <TableCell>{r.SML_GRP_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.ITEM_NM}</TableCell>
                    {['P1','P2','P3'].map((pk) => {
                      const p = r[pk];
                      return [
                        <TableCell key={`${pk}-v1q`} sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(p.v1_qty)}</TableCell>,
                        <TableCell key={`${pk}-v1a`} sx={{ textAlign: 'right', fontFamily: 'monospace', color: 'text.secondary' }}>{fmt(p.v1_amt)}</TableCell>,
                        <TableCell key={`${pk}-v2q`} sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(p.v2_qty)}</TableCell>,
                        <TableCell key={`${pk}-v2a`} sx={{ textAlign: 'right', fontFamily: 'monospace', color: 'text.secondary' }}>{fmt(p.v2_amt)}</TableCell>,
                        <TableCell key={`${pk}-dq`}  sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: diffColor(p.diff_qty) }}>{fmtPct(p.diff_qty)}</TableCell>,
                        <TableCell key={`${pk}-da`}  sx={{ textAlign: 'right', fontFamily: 'monospace', color: diffColor(p.diff_amt) }}>{fmtPct(p.diff_amt)}</TableCell>,
                        <TableCell key={`${pk}-cq`}  sx={{ textAlign: 'right', fontFamily: 'monospace', color: diffColor(p.cont_qty) }}>{fmtPct(p.cont_qty)}%</TableCell>,
                        <TableCell key={`${pk}-ca`}  sx={{ textAlign: 'right', fontFamily: 'monospace', color: diffColor(p.cont_amt) }}>{fmtPct(p.cont_amt)}%</TableCell>,
                      ];
                    })}
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

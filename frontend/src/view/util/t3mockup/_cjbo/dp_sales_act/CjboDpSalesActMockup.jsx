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

// CJBO — 판매 실적 (DpSalesAct.jsx)
// 소스 기반 재작성.
// path: view/demandplan/service/dpsalesact/DpSalesAct.jsx
// 데이터: POST demandplan/dpsalesact/q2 (컬럼 메타) → /q1 (데이터)
// 동적 크로스탭: 기간별 [ACT (실적) · OSO (오픈SO) · TOT (전체)] × [QTY/PRC/AMT]
//   - totalOnlyYn 필터: BILL=ACT만 · OPEN=OSO만 · 그 외 ACT+OSO+TOT
//   - qtyamtCd 필터: ALL=QTY+PRC+AMT · QTY=QTY만 · AMT=PRC+AMT

const L = {
  FROM_DATE:    { ko: 'FROM',          key: 'FROM_DATE' },
  TO_DATE:      { ko: 'TO',            key: 'TO_DATE' },
  SALES_GRP_CD: { ko: '사업담당',      key: 'SALES_GRP_CD' },
  QTY_AMT:      { ko: '수량/금액',     key: 'QTY_AMT_TYPE' },
  TOTAL_ONLY:   { ko: '실적/SO',       key: 'COMN_GRP_DESCRIP_CB_DP_SALES_ACT' },
  SOLID_GBN:    { ko: '액상/분말',     key: 'SOLID_GBN_CD' },
  AMT_UNIT:     { ko: '금액 단위',     key: 'AMT_UNIT' },
  DAY_TYPE:     { ko: '날짜 유형',     key: 'DAY_TYPE_CD' },
  SUM_YN:       { ko: '합계',          key: 'DP_SUM_YN' },
  PLAN_YN:      { ko: '계획 포함',     key: 'DP_PLAN_YN' },
  NUM_FORMAT:   { ko: '소수점 표시',   key: 'IM_SWITCH_NUM_FORMAT' },
};

const PERIODS = ['2026-05', '2026-04'];

// 동일 기본 차원 컬럼 (BIG_AREA/SALES_AREA/.../ITEM CD+NM)
const ROWS = [
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '베트남',     TRADE_TYPE_NM: '수출', LOCATION_CD: 'VN-HCM', CUST_NM: 'Jakarta Corp.',     SALES_GRP_CD: 'AN',  BIG_GRP_NM: 'Lysine',      MID_GRP_NM: '78% 액상',  SML_GRP_NM: 'L-Lysine 78%',           ITEM_NM: 'L-LYS-78L · 1MT',
    P1: { act_qty: 1450, act_amt: 1812, oso_qty: 60,  oso_amt:  75, tot_qty: 1510, tot_amt: 1887 },
    P2: { act_qty: 1500, act_amt: 1875, oso_qty: 80,  oso_amt: 100, tot_qty: 1580, tot_amt: 1975 } },
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '인도네시아', TRADE_TYPE_NM: '수출', LOCATION_CD: 'ID-JKT', CUST_NM: 'Sao Paulo Corp.',   SALES_GRP_CD: 'AN',  BIG_GRP_NM: 'Tryptophan',  MID_GRP_NM: '98% 분말',  SML_GRP_NM: 'L-Tryptophan 98%',       ITEM_NM: 'L-TRP-98 · 1MT',
    P1: { act_qty:  780, act_amt: 1560, oso_qty: 50,  oso_amt: 100, tot_qty:  830, tot_amt: 1660 },
    P2: { act_qty:  820, act_amt: 1640, oso_qty: 70,  oso_amt: 140, tot_qty:  890, tot_amt: 1780 } },
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '미국',       TRADE_TYPE_NM: '수출', LOCATION_CD: 'US-LAX', CUST_NM: 'New York Corp.',    SALES_GRP_CD: 'AN',  BIG_GRP_NM: 'Methionine',  MID_GRP_NM: '99% 분말',  SML_GRP_NM: 'L-Methionine 99%',       ITEM_NM: 'L-MET-99 · 1MT',
    P1: { act_qty: 2100, act_amt: 4200, oso_qty:120,  oso_amt: 240, tot_qty: 2220, tot_amt: 4440 },
    P2: { act_qty: 2200, act_amt: 4400, oso_qty:150,  oso_amt: 300, tot_qty: 2350, tot_amt: 4700 } },
  { BIG_AREA_NM: 'BMS',              SALES_AREA_NM: '브라질',     TRADE_TYPE_NM: '수출', LOCATION_CD: 'BR-SSA', CUST_NM: 'Vancouver Corp.',   SALES_GRP_CD: 'BMS', BIG_GRP_NM: 'Threonine',   MID_GRP_NM: '98.5% 분말',SML_GRP_NM: 'L-Threonine 98.5%',      ITEM_NM: 'L-THR-985 · 1MT',
    P1: { act_qty:  460, act_amt:  736, oso_qty: 30,  oso_amt:  48, tot_qty:  490, tot_amt:  784 },
    P2: { act_qty:  480, act_amt:  768, oso_qty: 40,  oso_amt:  64, tot_qty:  520, tot_amt:  832 } },
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '중국',       TRADE_TYPE_NM: '수출', LOCATION_CD: 'CN-SH',  CUST_NM: 'Mexico City Corp.', SALES_GRP_CD: 'AN',  BIG_GRP_NM: 'Valine',      MID_GRP_NM: '96.5% 분말',SML_GRP_NM: 'L-Valine 96.5%',         ITEM_NM: 'L-VAL-96 · 1MT',
    P1: { act_qty:  220, act_amt:  440, oso_qty: 20,  oso_amt:  40, tot_qty:  240, tot_amt:  480 },
    P2: { act_qty:  250, act_amt:  500, oso_qty: 30,  oso_amt:  60, tot_qty:  280, tot_amt:  560 } },
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '필리핀',     TRADE_TYPE_NM: '수출', LOCATION_CD: 'PH-MNL', CUST_NM: 'Roma Corp.',        SALES_GRP_CD: 'AN',  BIG_GRP_NM: 'Lysine',      MID_GRP_NM: '78% 액상',  SML_GRP_NM: 'L-Lysine 78%',           ITEM_NM: 'L-LYS-78L · 1MT',
    P1: { act_qty:  650, act_amt:  812, oso_qty: 40,  oso_amt:  50, tot_qty:  690, tot_amt:  862 },
    P2: { act_qty:  700, act_amt:  875, oso_qty: 50,  oso_amt:  62, tot_qty:  750, tot_amt:  937 } },
];

const fmt = (n) => n == null ? '-' : n.toLocaleString();

export default function CjboDpSalesActMockup() {
  return (
    <MockShell patternCode="cjbo_dp_sales_act"
      patternLabel="CJBO — 판매 실적 (DpSalesAct)"
      layoutCategory="LAYOUT_SINGLE"
      description="판매 실적 — 일자 범위 × 거래처 × 품목 동적 크로스탭. 기간별 [실적 · 미출 · 합계] × [수량/금액].">

      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label={L.FROM_DATE.ko} size="small" type="date" value="2026-04-01" sx={{ width: 150 }} InputLabelProps={{ shrink: true }} />
          <TextField label={L.TO_DATE.ko} size="small" type="date" value="2026-05-31" sx={{ width: 150 }} InputLabelProps={{ shrink: true }} />
          <TextField label={`${L.SALES_GRP_CD.ko} (multi)`} size="small" select value="ALL" sx={{ width: 150 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="AN">AN</MenuItem><MenuItem value="TN">TN</MenuItem><MenuItem value="BMS">BMS</MenuItem>
          </TextField>
          <TextField label="ItemSearchInput" size="small" value="전체" sx={{ width: 170 }}
            InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
          <TextField label="AccountSearchInput" size="small" value="전체" sx={{ width: 150 }}
            InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
          <TextField label={L.QTY_AMT.ko} size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">ALL</MenuItem><MenuItem value="QTY">QTY</MenuItem><MenuItem value="AMT">AMT</MenuItem>
          </TextField>
          <TextField label={L.TOTAL_ONLY.ko} size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">ALL</MenuItem>
            <MenuItem value="BILL">실적만 (ACT)</MenuItem>
            <MenuItem value="OPEN">SO만 (OSO)</MenuItem>
          </TextField>
          <TextField label={L.SOLID_GBN.ko} size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="L">L 액상</MenuItem><MenuItem value="S">S 분말</MenuItem>
          </TextField>
          <TextField label={L.AMT_UNIT.ko} size="small" select value="USD" sx={{ width: 100 }}>
            <MenuItem value="USD">USD</MenuItem><MenuItem value="KRW">KRW</MenuItem>
          </TextField>
          <TextField label={L.DAY_TYPE.ko} size="small" select value="M" sx={{ width: 90 }}>
            <MenuItem value="M">월</MenuItem><MenuItem value="W">주</MenuItem>
          </TextField>
          <TextField label={L.SUM_YN.ko} size="small" select value="Y" sx={{ width: 90 }}>
            <MenuItem value="Y">Y</MenuItem><MenuItem value="N">N</MenuItem>
          </TextField>
          <TextField label={L.PLAN_YN.ko} size="small" select value="Y" sx={{ width: 110 }}>
            <MenuItem value="ALL">ALL</MenuItem><MenuItem value="Y">Y</MenuItem><MenuItem value="N">N</MenuItem>
          </TextField>
          <FormControlLabel control={<Switch size="small" />} label={<Typography variant="caption">{L.NUM_FORMAT.ko}</Typography>} sx={{ ml: 0 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>새로고침</Button>
        </Stack>
      </Box>

      {/* ButtonArea */}
      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button size="small" startIcon={<FileDownloadIcon />} variant="outlined">엑셀 다운로드</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>단위: USD · 천</Typography>
        <Button size="small" startIcon={<SettingsIcon />} variant="outlined">컬럼 개인화</Button>
      </Box>

      {/* ResultArea */}
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader sx={{ '& th, & td': { whiteSpace: 'nowrap', fontSize: 11, py: 0.5 } }}>
              <TableHead>
                <TableRow>
                  {['대지역','판매지역','거래유형','거점','거래처','사업담당','대분류','중분류','소분류','품목명'].map((c) => (
                    <TableCell key={c} rowSpan={3} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>{c}</TableCell>
                  ))}
                  {PERIODS.map((p) => (
                    <TableCell key={p} colSpan={6} sx={{ backgroundColor: '#e3f2fd', textAlign: 'center', fontWeight: 700, fontSize: 12 }}>{p}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  {PERIODS.flatMap((p) => [
                    <TableCell key={`${p}-act`}  colSpan={2} sx={{ backgroundColor: '#c8e6c9', textAlign: 'center', fontWeight: 700 }}>ACT (실적)</TableCell>,
                    <TableCell key={`${p}-oso`}  colSpan={2} sx={{ backgroundColor: '#fff9c4', textAlign: 'center', fontWeight: 700 }}>OSO (오픈 SO)</TableCell>,
                    <TableCell key={`${p}-tot`}  colSpan={2} sx={{ backgroundColor: '#ffe0b2', textAlign: 'center', fontWeight: 700 }}>TOT (전체)</TableCell>,
                  ])}
                </TableRow>
                <TableRow>
                  {PERIODS.flatMap((p, idx) => (
                    ['QTY','AMT','QTY','AMT','QTY','AMT'].map((c, i) => (
                      <TableCell key={`${p}-${i}`} sx={{ backgroundColor:
                        i < 2 ? '#c8e6c9' : i < 4 ? '#fff9c4' : '#ffe0b2',
                        textAlign: 'right', fontWeight: 600, fontSize: 10 }}>{c}</TableCell>
                    ))
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{r.BIG_AREA_NM}</TableCell>
                    <TableCell>{r.SALES_AREA_NM}</TableCell>
                    <TableCell>{r.TRADE_TYPE_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.LOCATION_CD}</TableCell>
                    <TableCell>{r.CUST_NM}</TableCell>
                    <TableCell><Chip size="small" label={r.SALES_GRP_CD} variant="outlined" sx={{ height: 16, fontSize: 9 }} /></TableCell>
                    <TableCell>{r.BIG_GRP_NM}</TableCell>
                    <TableCell>{r.MID_GRP_NM}</TableCell>
                    <TableCell>{r.SML_GRP_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.ITEM_NM}</TableCell>
                    {['P1','P2'].map((pk) => {
                      const p = r[pk];
                      return [
                        <TableCell key={`${pk}-aq`} sx={{ textAlign: 'right', fontFamily: 'monospace', backgroundColor: '#e8f5e9' }}>{fmt(p.act_qty)}</TableCell>,
                        <TableCell key={`${pk}-aa`} sx={{ textAlign: 'right', fontFamily: 'monospace', color: 'text.secondary', backgroundColor: '#e8f5e9' }}>{fmt(p.act_amt)}</TableCell>,
                        <TableCell key={`${pk}-oq`} sx={{ textAlign: 'right', fontFamily: 'monospace', backgroundColor: '#fffde7' }}>{fmt(p.oso_qty)}</TableCell>,
                        <TableCell key={`${pk}-oa`} sx={{ textAlign: 'right', fontFamily: 'monospace', color: 'text.secondary', backgroundColor: '#fffde7' }}>{fmt(p.oso_amt)}</TableCell>,
                        <TableCell key={`${pk}-tq`} sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, backgroundColor: '#fff3e0' }}>{fmt(p.tot_qty)}</TableCell>,
                        <TableCell key={`${pk}-ta`} sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, backgroundColor: '#fff3e0' }}>{fmt(p.tot_amt)}</TableCell>,
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

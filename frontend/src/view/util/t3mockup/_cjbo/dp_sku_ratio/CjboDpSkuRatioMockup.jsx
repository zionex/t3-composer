import React, { useState } from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Tabs, Tab, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// CJBO — TP/OP SKU 비율 관리 (DpItemRatio / DpItemRatioOP)
// UI_DP_ITEM_RATIO (gplanCd='T') · UI_DP_ITEM_RATIO_OP (gplanCd='O')
// UI_DP_ITEM_RATIO_MON / UI_DP_ITEM_RATIO_OP_MON — 같은 화면을 월별 비율만 표시하는 변형

const MONTHS = ['2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'];

// TP (Target Plan / 연간) — 안정적인 비율 (변동 ±2%p 이내)
const ROWS_TP = [
  { ITEM: 'illuvia 비건마스크 5매',  AVG: 35.0, m: [35.0, 35.5, 34.5, 35.0, 35.0, 35.0, 35.0], status: 'normal' },
  { ITEM: 'illuvia 토너 200ml',     AVG: 22.0, m: [22.0, 21.5, 22.5, 22.0, 22.0, 22.0, 22.0], status: 'normal' },
  { ITEM: 'illuvia 크림 50g',       AVG: 18.0, m: [18.0, 18.5, 18.0, 17.5, 18.0, 18.0, 18.0], status: 'normal' },
  { ITEM: 'illuvia 에센스 30ml',    AVG: 12.0, m: [12.0, 11.5, 12.5, 12.0, 12.0, 12.0, 12.0], status: 'normal' },
  { ITEM: 'illuvia 클렌저 150ml',   AVG:  8.0, m: [ 8.0,  8.0,  7.5,  8.5,  8.0,  8.0,  8.0], status: 'normal' },
  { ITEM: 'illuvia 선크림 50ml',    AVG:  5.0, m: [ 5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0], status: 'normal' },
  { TOTAL: true, ITEM: '합계',      AVG:100.0, m: [100,100,100,100,100,100,100],               status: 'highlight' },
];

// OP (Operation Plan / 월간) — 월별 운영상 변동 (변동 ±5%p)
const ROWS_OP = [
  { ITEM: 'illuvia 비건마스크 5매',  AVG: 35.0, m: [38.0, 36.0, 33.0, 35.0, 35.0, 34.5, 33.5], status: 'warning' },
  { ITEM: 'illuvia 토너 200ml',     AVG: 22.0, m: [20.0, 21.0, 23.5, 22.0, 22.5, 22.5, 23.0], status: 'normal' },
  { ITEM: 'illuvia 크림 50g',       AVG: 18.0, m: [16.0, 18.0, 19.5, 18.0, 17.0, 18.0, 19.0], status: 'normal' },
  { ITEM: 'illuvia 에센스 30ml',    AVG: 12.0, m: [13.0, 12.5, 11.0, 12.0, 12.0, 12.5, 12.5], status: 'normal' },
  { ITEM: 'illuvia 클렌저 150ml',   AVG:  8.0, m: [ 9.0,  7.5,  8.0,  8.5,  8.5,  7.5,  7.0], status: 'normal' },
  { ITEM: 'illuvia 선크림 50ml',    AVG:  5.0, m: [ 4.0,  5.0,  5.0,  4.5,  5.0,  5.0,  5.0], status: 'warning' },
  { TOTAL: true, ITEM: '합계',      AVG:100.0, m: [100,100,100,100,100,100,100],               status: 'highlight' },
];

function RatioGrid({ rows, mode }) {
  // mode: 'AVG' (평균만 강조) · 'MON' (월별 컬럼 강조)
  const isMon = mode === 'MON';
  return (
    <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
      <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          SKU 비율 입력 — {isMon ? '월별 직접 입력' : '평균 입력 (월별 자동 분배)'}
        </Typography>
        <Chip size="small" label="합계 100% 검증" color="info" variant="outlined" />
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="caption" color="text.secondary">단위: %</Typography>
      </Box>
      <TableContainer sx={{ flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, position: 'sticky', left: 0, zIndex: 3 }}>품목명</TableCell>
              <TableCell sx={{ backgroundColor: isMon ? 'grey.100' : '#fffde7', fontWeight: 700, textAlign: 'right',
                border: isMon ? undefined : '2px solid #f59e0b' }}>평균(%)</TableCell>
              {MONTHS.map((m) => (
                <TableCell key={m} sx={{ backgroundColor: isMon ? '#fffde7' : 'grey.100', fontWeight: 700, textAlign: 'right',
                  border: isMon ? '2px solid #f59e0b' : undefined }}>{m.slice(5)}월</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i} hover sx={{ backgroundColor: r.TOTAL ? '#e1bee7' : undefined }}>
                <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: r.TOTAL ? '#e1bee7' : 'background.paper', fontWeight: r.TOTAL ? 700 : 500 }}>{r.ITEM}</TableCell>
                <TableCell sx={cellSx(r.status, { align: 'right', mono: true })}>{r.AVG.toFixed(1)}</TableCell>
                {r.m.map((v, j) => {
                  const isDiff = !r.TOTAL && Math.abs(v - r.AVG) > 0.001;
                  return (
                    <TableCell key={j} sx={{ textAlign: 'right', fontFamily: 'monospace',
                      backgroundColor: r.TOTAL ? '#e1bee7' : (isMon ? (isDiff ? '#fff8e1' : undefined) : undefined),
                      fontWeight: isMon && isDiff ? 700 : undefined,
                      color: isMon && isDiff ? (v > r.AVG ? '#1565c0' : '#c62828') : undefined }}>
                      {v.toFixed(1)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default function CjboDpSkuRatioMockup() {
  const [tab, setTab] = useState(0);
  // tab: 0=TP 평균 · 1=TP 월별 · 2=OP 평균 · 3=OP 월별
  const isTP = tab < 2;
  const isMon = tab === 1 || tab === 3;
  const rows = isTP ? ROWS_TP : ROWS_OP;
  const planLabel = isTP ? 'TP (Target / 연간)' : 'OP (Operation / 월간)';

  return (
    <MockShell patternCode="cjbo_dp_sku_ratio" patternLabel="CJBO — TP/OP SKU 비율 관리 (DpItemRatio*)"
      layoutCategory="LAYOUT_SINGLE"
      description="브랜드 × 품목 × 월별 판매비율(%). gplanCd: 'T'=TP / 'O'=OP. UI_DP_ITEM_RATIO/_OP/_MON/_OP_MON 4종 통합.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="계획구분" size="small" value={isTP ? 'TP' : 'OP'} sx={{ width: 130 }} />
          <TextField label="비율구분" size="small" value={isMon ? '월별' : '평균(전체)'} sx={{ width: 130 }} />
          <TextField label="버전" size="small" value="V2026-06" sx={{ width: 140 }} />
          <TextField label="판매조직" size="small" value="국내 / 영업1팀" sx={{ width: 200 }} />
          <TextField label="대분류" size="small" select value="illuvia" sx={{ width: 150 }}>
            <MenuItem value="illuvia">illuvia</MenuItem>
            <MenuItem value="NGP">NGP</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="contained" size="small" color="success" startIcon={<SaveIcon />}>저장</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ minHeight: 38 }}>
          <Tab label="TP 평균 비율 (UI_DP_ITEM_RATIO)" sx={{ minHeight: 38 }} />
          <Tab label="TP 월별 비율 (UI_DP_ITEM_RATIO_MON)" sx={{ minHeight: 38 }} />
          <Tab label="OP 평균 비율 (UI_DP_ITEM_RATIO_OP)" sx={{ minHeight: 38 }} />
          <Tab label="OP 월별 비율 (UI_DP_ITEM_RATIO_OP_MON)" sx={{ minHeight: 38 }} />
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1, overflow: 'auto' }}>
        <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip size="small" label={planLabel} color={isTP ? 'primary' : 'success'} sx={{ fontWeight: 700 }} />
          <Chip size="small" label={isMon ? '월별 직접 입력' : '평균값 입력 → 월별 자동 분배'} variant="outlined" />
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="caption" color="text.secondary">
            {isMon ? '월별 셀이 평균과 다르면 강조 표시' : '평균 컬럼만 편집 가능 · 월별은 동일 비율 자동 채움'}
          </Typography>
        </Paper>
        <RatioGrid rows={rows} mode={isMon ? 'MON' : 'AVG'} />
      </Box>
    </MockShell>
  );
}

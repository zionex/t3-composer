import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Button, IconButton, ButtonGroup,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// ORON — YP 연간계획 입력
// 대표 화면: UI_YP_ORN_MKT_YP_PLAN "마케팅 연간계획 입력" (OrnYpMktPlan)
//   SearchArea: PLAN_SCOPE, Version, 브랜드, 카테고리
//   Grid: 브랜드 × 카테고리 × 품목 × MEASURE × 12개월 동적 컬럼
//
// 같이 묶인 메뉴 (모두 같은 연간 입력 패턴):
//   - UI_YP_ORN_SALES_MAN_PLAN  영업팀 연간계획 입력 (SalesManPlan)
//   - UI_YP_ORN_PTT_REQ_PLAN    연간 원료감자 계획 (PttReqPlan)
//   - UI_BP_95                  연간계획 입력 (Entry)
//   - UI_BP_95_CHART            연간계획 입력 (Chart)
//   - UI_BP_96                  연간계획 주문 정보

const MONTH_COLS = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];

const ROWS = [
  { BRAND: 'ORON', CATEGORY: 'MASK',  ITEM_NM: '오론 비건마스크 5매',  cat: 'MKT_PLAN_QTY', vals: [10000, 11000, 12000, 13000, 12500, 12000, 13500, 14000, 13500, 13000, 12500, 12500] },
  { BRAND: 'ORON', CATEGORY: 'MASK',  ITEM_NM: '오론 비건마스크 10매', cat: 'MKT_PLAN_QTY', vals: [3000,  3500,  4000,  4500,  4500,  4000,  4500,  5000,  4500,  4000,  3500,  3500] },
  { BRAND: 'ORON', CATEGORY: 'SERUM', ITEM_NM: '오론 세럼 30ml',        cat: 'MKT_PLAN_QTY', vals: [3500,  4000,  4500,  4800,  5000,  4500,  5000,  5500,  6000,  6500,  7000,  7000] },
  { BRAND: 'ORON', CATEGORY: 'SERUM', ITEM_NM: '오론 세럼 50ml',        cat: 'MKT_PLAN_QTY', vals: [2000,  2200,  2500,  2800,  3000,  2800,  3200,  3500,  3800,  4000,  4200,  4200] },
  { BRAND: 'OEM',  CATEGORY: 'SUN',   ITEM_NM: 'OEM 선크림 SPF50+',    cat: 'MKT_PLAN_QTY', vals: [6000,  6500,  7500,  8500,  9000,  8500,  9000,  9500,  9000,  8000,  7000,  7000] },
];

const totals = MONTH_COLS.map((_m, i) => ROWS.reduce((s, r) => s + r.vals[i], 0));
const grandTotal = totals.reduce((s, v) => s + v, 0);

export default function OronYpEntryMockup() {
  return (
    <MockShell
      patternCode="oron_yp_entry"
      patternLabel="ORON — YP 연간계획 입력 (마케팅/영업/원료)"
      layoutCategory="LAYOUT_SINGLE"
      description="대표 화면 = 마케팅 연간계획 입력 (UI_YP_ORN_MKT_YP_PLAN). 브랜드 × 카테고리 × 품목 × MEASURE × 12개월 크로스탭. 같이 묶인 메뉴 5개 (영업팀 연간/원료감자 연간/일반 연간 Entry/Chart/주문정보) 도 같은 크로스탭 패턴 — measure 만 다름 (MKT_PLAN_QTY → SALES_PLAN_QTY / PTT_REQ_QTY 등)."
    >
      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="PLAN_SCOPE" size="small" select value="ORN_YP" sx={{ width: 130 }}>
            <MenuItem value="ORN_YP">ORN_YP</MenuItem>
          </TextField>
          <TextField label="VERSION_ID" size="small" select value="Y2026_DRAFT" sx={{ width: 170 }}>
            <MenuItem value="Y2026_DRAFT">Y2026_DRAFT</MenuItem>
            <MenuItem value="Y2026_BASELINE">Y2026_BASELINE</MenuItem>
          </TextField>
          <TextField label="BRAND" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="ORON">ORON</MenuItem>
            <MenuItem value="OEM">OEM</MenuItem>
          </TextField>
          <TextField label="CATEGORY" size="small" value="" sx={{ width: 160 }}
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
          <TextField label="기간" size="small" value="2026 (연간)" sx={{ width: 150 }} />
        </Stack>
      </Box>

      {/* ButtonArea */}
      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
        <ButtonGroup variant="outlined" size="small">
          <IconButton size="small" title="GridSaveButton" color="primary"><SaveIcon fontSize="small" /></IconButton>
        </ButtonGroup>
      </Box>

      {/* Grid */}
      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'center', fontSize: 12 }}>BRAND</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center', fontSize: 12 }}>CATEGORY</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 200, textAlign: 'left', fontSize: 12 }}>ITEM_NM</TableCell>
                  <TableCell sx={{ bgcolor: '#fffbe6', fontWeight: 700, width: 130, textAlign: 'center', fontSize: 12 }}>Measure</TableCell>
                  {MONTH_COLS.map((m) => (
                    <TableCell key={m} sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'right', fontSize: 11, fontFamily: 'monospace' }}>{m.slice(2)}</TableCell>
                  ))}
                  <TableCell sx={{ bgcolor: '#e0f2fe', fontWeight: 700, width: 100, textAlign: 'right', fontSize: 12, fontFamily: 'monospace' }}>TOTAL</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => {
                  const rowTotal = r.vals.reduce((s, v) => s + v, 0);
                  return (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontSize: 12, textAlign: 'center' }}>{r.BRAND}</TableCell>
                      <TableCell sx={{ fontSize: 12, textAlign: 'center', fontFamily: 'monospace' }}>{r.CATEGORY}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{r.ITEM_NM}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 600, fontFamily: 'monospace', fontSize: 12, color: '#1565c0' }}>{r.cat}</TableCell>
                      {r.vals.map((v, j) => (
                        <TableCell key={j} sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: '#374151' }}>{v.toLocaleString()}</TableCell>
                      ))}
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, bgcolor: '#e0f2fe' }}>{rowTotal.toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow sx={{ bgcolor: '#f3f4f6' }}>
                  <TableCell sx={{ fontSize: 12, fontWeight: 700, textAlign: 'right' }} colSpan={4}>TOTAL</TableCell>
                  {totals.map((v, i) => (
                    <TableCell key={i} sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, bgcolor: '#f3f4f6' }}>{v.toLocaleString()}</TableCell>
                  ))}
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, bgcolor: '#bae6fd' }}>{grandTotal.toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', px: 1.5, py: 0.5, bgcolor: 'grey.50' }}>
            <Typography sx={{ fontSize: 11, fontFamily: 'monospace', color: 'text.secondary' }}>
              GridCnt grid="grid1" — {ROWS.length} CASES MSG_0010
            </Typography>
          </Box>
        </Paper>
      </Box>
    </MockShell>
  );
}

import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// KTNG — BF 수요 예측 정확도 (추이)
// UI_BF_KTNG_03 → BfKtng03.jsx (563 lines)
//   SearchArea: START_MM, END_MM (yearMonth)
//   Layout: 상하 2분할 — 상단 좌 grid1 + 우 차트(Sell In/Out 토글), 하단 grid2 (상세)
//   grid1: SALES_ORG + ITEM_LVL1 + SALES_TYPE + (YYYYMM × ACC_RATE 동적 피벗)
//   grid2: SALES_LV_NM + BP_CD/NM + ITEM_CD/NM + SALES_TYPE + ACC_MEASURE (PLAN/ACT/ACCURACY)

const MONTH_COLS = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];

const GRID1_ROWS = [
  { SALES_ORG: '국내영업본부', ITEM_LVL1: '담배',   SALES_TYPE: 'Sell-In',  rates: [96.5, 97.2, 95.8, 96.0, 97.5, 96.8] },
  { SALES_ORG: '국내영업본부', ITEM_LVL1: '담배',   SALES_TYPE: 'Sell-Out', rates: [94.2, 93.8, 94.5, 95.1, 94.8, 95.3] },
  { SALES_ORG: '국내영업본부', ITEM_LVL1: '인삼',   SALES_TYPE: 'Sell-In',  rates: [88.5, 90.2, 91.5, 89.8, 92.0, 91.2] },
  { SALES_ORG: '국내영업본부', ITEM_LVL1: '인삼',   SALES_TYPE: 'Sell-Out', rates: [85.3, 86.8, 87.5, 86.2, 88.0, 87.5] },
  { SALES_ORG: '수출본부',     ITEM_LVL1: '담배',   SALES_TYPE: 'Sell-In',  rates: [92.8, 93.5, 91.2, 93.8, 92.5, 94.0] },
  { SALES_ORG: '수출본부',     ITEM_LVL1: '담배',   SALES_TYPE: 'Sell-Out', rates: [89.5, 90.2, 88.5, 91.0, 89.8, 90.5] },
];

const GRID2_ROWS = [
  { SALES_LV_NM: '국내영업본부', BP_CD: 'BGF-001',  BP_NM: 'CU (BGF리테일)',  ITEM_CD: 'ITM-ESSE',  ITEM_NM: '에쎄',     SALES_TYPE: 'Sell-In',  measures: { PLAN: 125000, ACT: 122500, ACC: 98.0 } },
  { SALES_LV_NM: '국내영업본부', BP_CD: 'BGF-001',  BP_NM: 'CU (BGF리테일)',  ITEM_CD: 'ITM-ESSE',  ITEM_NM: '에쎄',     SALES_TYPE: 'Sell-Out', measures: { PLAN: 118000, ACT: 112000, ACC: 94.9 } },
  { SALES_LV_NM: '국내영업본부', BP_CD: 'GS25-001', BP_NM: 'GS25',            ITEM_CD: 'ITM-ESSE',  ITEM_NM: '에쎄',     SALES_TYPE: 'Sell-In',  measures: { PLAN: 95000,  ACT: 96800,  ACC: 98.1 } },
  { SALES_LV_NM: '국내영업본부', BP_CD: 'EMT-001',  BP_NM: '이마트',          ITEM_CD: 'ITM-DIS',   ITEM_NM: '디스',     SALES_TYPE: 'Sell-In',  measures: { PLAN: 32000,  ACT: 30200,  ACC: 94.4 } },
  { SALES_LV_NM: '국내영업본부', BP_CD: 'LMT-001',  BP_NM: '롯데마트',        ITEM_CD: 'ITM-1MG',   ITEM_NM: '더원',     SALES_TYPE: 'Sell-In',  measures: { PLAN: 28000,  ACT: 27500,  ACC: 98.2 } },
  { SALES_LV_NM: '수출본부',     BP_CD: 'US-001',   BP_NM: 'USA Duty Free',  ITEM_CD: 'ITM-ESSE',  ITEM_NM: 'ESSE Asian', SALES_TYPE: 'Sell-In',  measures: { PLAN: 45000,  ACT: 42500,  ACC: 94.4 } },
];

const expanded = GRID2_ROWS.flatMap((r) => ['PLAN', 'ACT', 'ACC'].map((m) => ({ ...r, measure: m, value: r.measures[m] })));

function MockLineChart({ active }) {
  const w = 700, h = 220, pad = { l: 40, r: 20, t: 20, b: 30 };
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;
  const series = [
    { name: '국내 - 담배',  color: '#1976d2', vals: active === 'Sell-In' ? GRID1_ROWS[0].rates : GRID1_ROWS[1].rates },
    { name: '국내 - 인삼',  color: '#10b981', vals: active === 'Sell-In' ? GRID1_ROWS[2].rates : GRID1_ROWS[3].rates },
    { name: '수출 - 담배',  color: '#ff7043', vals: active === 'Sell-In' ? GRID1_ROWS[4].rates : GRID1_ROWS[5].rates },
  ];
  const minV = 80, maxV = 100;
  const x = (i) => pad.l + (plotW * i) / (MONTH_COLS.length - 1);
  const y = (v) => pad.t + plotH - (plotH * (v - minV)) / (maxV - minV);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '100%' }}>
      {[80, 85, 90, 95, 100].map((v) => (
        <React.Fragment key={v}>
          <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} stroke="#e5e7eb" strokeWidth="1" />
          <text x={pad.l - 6} y={y(v) + 4} fontSize="10" fill="#9ca3af" textAnchor="end">{v}%</text>
        </React.Fragment>
      ))}
      {MONTH_COLS.map((m, i) => (
        <text key={m} x={x(i)} y={h - 8} fontSize="10" fill="#6b7280" textAnchor="middle">{m.slice(2)}</text>
      ))}
      {series.map((s) => {
        const pts = s.vals.map((v, i) => `${x(i)},${y(v)}`).join(' ');
        return <polyline key={s.name} fill="none" stroke={s.color} strokeWidth="2" points={pts} />;
      })}
      {series.flatMap((s) => s.vals.map((v, i) => (
        <circle key={`${s.name}-${i}`} cx={x(i)} cy={y(v)} r="3" fill={s.color} />
      )))}
    </svg>
  );
}

export default function KtngBfAccuracyTrendMockup() {
  const [chartType, setChartType] = React.useState('Sell-In');
  return (
    <MockShell
      patternCode="ktng_bf_accuracy_trend"
      patternLabel="KTNG — BF 수요 예측 정확도 (추이)"
      layoutCategory="LAYOUT_SINGLE"
      description="UI_BF_KTNG_03 → BfKtng03.jsx. SearchArea (START_MM/END_MM, yearMonth) + 상하 2분할 layout. 상단: 좌 정확도 피벗 grid1(SALES_ORG × ITEM_LVL1 × SALES_TYPE × 월별 ACC_RATE) + 우 추이 라인 차트 (Sell-In/Out 토글). 하단: grid2 상세 (영업조직/거래처/품목/SALES_TYPE × PLAN/ACT/ACCURACY 측정). 셀 데이터는 KTNG 도메인 (담배·인삼 × 국내/수출 × CU/GS25/이마트/USA Duty Free)."
    >
      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="START_MM" size="small" select value="2026-01" sx={{ width: 130 }}>
            <MenuItem value="2026-01">2026-01</MenuItem>
          </TextField>
          <TextField label="END_MM" size="small" select value="2026-06" sx={{ width: 130 }}>
            <MenuItem value="2026-06">2026-06</MenuItem>
          </TextField>
        </Stack>
      </Box>

      {/* 본문 상하 2분할 */}
      <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 0, overflow: 'auto' }}>
        {/* 상단: grid1 + chart */}
        <Box sx={{ display: 'flex', gap: 1.5, height: 280, flexShrink: 0 }}>
          {/* 좌: 정확도 피벗 그리드 */}
          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700 }}>월별 정확도 (%)</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button size="small" variant="outlined" startIcon={<DownloadIcon sx={{ fontSize: 14 }} />} sx={{ minHeight: 24, py: 0 }}>Excel</Button>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: '#E2EFDA', fontWeight: 700, fontSize: 11, width: 110 }}>SALES_ORG</TableCell>
                    <TableCell sx={{ bgcolor: '#E2EFDA', fontWeight: 700, fontSize: 11, width: 80 }}>ITEM_LVL1</TableCell>
                    <TableCell sx={{ bgcolor: '#E2EFDA', fontWeight: 700, fontSize: 11, width: 90 }}>SALES_TYPE</TableCell>
                    {MONTH_COLS.map((m) => (
                      <TableCell key={m} sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, fontFamily: 'monospace', textAlign: 'right', width: 70 }}>{m.slice(2)}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {GRID1_ROWS.map((r, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontSize: 11, bgcolor: i > 0 && r.SALES_ORG === GRID1_ROWS[i - 1].SALES_ORG ? 'transparent' : '#f0fdf4' }}>{i > 0 && r.SALES_ORG === GRID1_ROWS[i - 1].SALES_ORG ? '' : r.SALES_ORG}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.ITEM_LVL1}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{r.SALES_TYPE}</TableCell>
                      {r.rates.map((v, j) => (
                        <TableCell key={j} sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', color: v >= 95 ? '#10b981' : v >= 90 ? '#374151' : '#f59e0b', fontWeight: v >= 95 ? 700 : 400 }}>
                          {v.toFixed(1)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* 우: 차트 */}
          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700 }}>정확도 추이</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button size="small" variant={chartType === 'Sell-In' ? 'contained' : 'outlined'} sx={{ minHeight: 22, py: 0, fontSize: 10 }} onClick={() => setChartType('Sell-In')}>Sell-In</Button>
              <Button size="small" variant={chartType === 'Sell-Out' ? 'contained' : 'outlined'} sx={{ minHeight: 22, py: 0, fontSize: 10 }} onClick={() => setChartType('Sell-Out')}>Sell-Out</Button>
            </Box>
            <Box sx={{ flex: 1, p: 1, display: 'flex', flexDirection: 'column' }}>
              <MockLineChart active={chartType} />
              <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', mt: 0.5 }}>
                {[
                  { name: '국내 - 담배', color: '#1976d2' },
                  { name: '국내 - 인삼', color: '#10b981' },
                  { name: '수출 - 담배', color: '#ff7043' },
                ].map((s) => (
                  <Stack key={s.name} direction="row" spacing={0.5} alignItems="center">
                    <Box sx={{ width: 12, height: 2, bgcolor: s.color }} />
                    <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{s.name}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Paper>
        </Box>

        {/* 하단: grid2 상세 */}
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>거래처 × 품목 상세 (PLAN / ACT / ACCURACY)</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" variant="outlined" startIcon={<DownloadIcon sx={{ fontSize: 14 }} />} sx={{ minHeight: 24, py: 0 }}>Excel</Button>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, width: 120 }}>SALES_ORG</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, width: 100, fontFamily: 'monospace' }}>BP_CD</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, width: 180 }}>BP_NM</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, width: 120, fontFamily: 'monospace' }}>ITEM_CD</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, width: 130 }}>ITEM_NM</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, width: 100 }}>SALES_TYPE</TableCell>
                  <TableCell sx={{ bgcolor: '#fffbe6', fontWeight: 700, fontSize: 11, width: 110 }}>ACC_MEASURE</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, width: 100, fontFamily: 'monospace', textAlign: 'right' }}>VALUE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expanded.map((r, i) => {
                  const isFirstOfBlock = i % 3 === 0;
                  return (
                    <TableRow key={i} hover sx={{ borderTop: isFirstOfBlock ? '1px solid #d1d5db' : undefined }}>
                      <TableCell sx={{ fontSize: 11 }}>{isFirstOfBlock ? r.SALES_LV_NM : ''}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{isFirstOfBlock ? r.BP_CD : ''}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{isFirstOfBlock ? r.BP_NM : ''}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{isFirstOfBlock ? r.ITEM_CD : ''}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{isFirstOfBlock ? r.ITEM_NM : ''}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{isFirstOfBlock ? r.SALES_TYPE : ''}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontWeight: 600, fontFamily: 'monospace', color: r.measure === 'PLAN' ? '#1565c0' : r.measure === 'ACT' ? '#6b7280' : '#10b981' }}>{r.measure}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: r.measure === 'ACC' ? 700 : 400 }}>
                        {r.measure === 'ACC' ? `${r.value.toFixed(1)}%` : r.value.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}

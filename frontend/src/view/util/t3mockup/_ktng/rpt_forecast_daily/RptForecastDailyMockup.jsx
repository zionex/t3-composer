import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Tabs, Tab, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// KTNG — RPT 전망 / Daily (3 메뉴)
//  23 연간 생산전망 / 24 연간 판매전망 / 25 Daily 실적

const TABS = [
  { code: '23', label: '연간 생산전망', menu: 'UI_RPT_KTNG_23' },
  { code: '24', label: '연간 판매전망', menu: 'UI_RPT_KTNG_24' },
  { code: '25', label: 'Daily 실적',    menu: 'UI_RPT_KTNG_25' },
];

const ANNUAL_ROWS = [
  { CATEGORY: '신탄진공장', ITEM_LV3: '에쎄', YTD_ACT: 2280000, ANNUAL_TARGET: 4800000, FORECAST: 4750000, PROGRESS: 47.5, GAP: -50000 },
  { CATEGORY: '신탄진공장', ITEM_LV3: '디스', YTD_ACT: 760000,  ANNUAL_TARGET: 1620000, FORECAST: 1605000, PROGRESS: 46.9, GAP: -15000 },
  { CATEGORY: '신탄진공장', ITEM_LV3: '더원', YTD_ACT: 168000,  ANNUAL_TARGET: 380000,  FORECAST: 385000,  PROGRESS: 44.2, GAP: 5000 },
  { CATEGORY: 'Almaty공장', ITEM_LV3: 'TIME', YTD_ACT: 215000,  ANNUAL_TARGET: 580000,  FORECAST: 600000,  PROGRESS: 37.1, GAP: 20000 },
  { CATEGORY: '신탄진공장', ITEM_LV3: '릴 NGP', YTD_ACT: 520000, ANNUAL_TARGET: 1380000, FORECAST: 1450000, PROGRESS: 37.7, GAP: 70000 },
];

const DAILY_ROWS = [
  { DT: '2026-06-07', PLANT: '신탄진공장', PROD_QTY: 38500, SHIP_QTY: 38200, STOCK_QTY: 320500, DEFECT_PCT: 0.82 },
  { DT: '2026-06-06', PLANT: '신탄진공장', PROD_QTY: 37800, SHIP_QTY: 37500, STOCK_QTY: 320200, DEFECT_PCT: 0.95 },
  { DT: '2026-06-05', PLANT: '신탄진공장', PROD_QTY: 39200, SHIP_QTY: 38800, STOCK_QTY: 319900, DEFECT_PCT: 0.78 },
  { DT: '2026-06-07', PLANT: '청주공장',   PROD_QTY: 22000, SHIP_QTY: 21800, STOCK_QTY: 145500, DEFECT_PCT: 1.12 },
  { DT: '2026-06-06', PLANT: '청주공장',   PROD_QTY: 21500, SHIP_QTY: 21300, STOCK_QTY: 145300, DEFECT_PCT: 0.88 },
  { DT: '2026-06-07', PLANT: 'Almaty공장', PROD_QTY: 9800,  SHIP_QTY: 9500,  STOCK_QTY: 75300,  DEFECT_PCT: 1.45 },
];

export default function KtngRptForecastDailyMockup() {
  const [tab, setTab] = React.useState(0);
  return (
    <MockShell
      patternCode="ktng_rpt_forecast_daily"
      patternLabel="KTNG — RPT 전망 / Daily 실적"
      layoutCategory="LAYOUT_SINGLE"
      description="3개 리포트 묶음 (연간 생산전망 / 연간 판매전망 / Daily 실적). Tab 1-2: YTD 실적 + 연간 목표 vs FORECAST + 진척률. Tab 3: 일자별 공장별 생산/출하/재고/불량률."
    >
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          {TABS.map((t) => (
            <Tab key={t.code} label={<Stack direction="row" spacing={1} alignItems="center"><span>{t.label}</span><Chip label={t.menu} size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} /></Stack>} />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          {tab < 2 ? (
            <>
              <TextField label="YEAR" size="small" select value="2026" sx={{ width: 110 }}><MenuItem value="2026">2026</MenuItem></TextField>
              <TextField label="CATEGORY" size="small" select value="ALL" sx={{ width: 160 }}><MenuItem value="ALL">전체</MenuItem></TextField>
            </>
          ) : (
            <>
              <TextField label="기간" size="small" value="2026-06-05 ~ 06-07" sx={{ width: 200 }} />
              <TextField label="PLANT" size="small" select value="ALL" sx={{ width: 160 }}><MenuItem value="ALL">전체</MenuItem></TextField>
            </>
          )}
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
      </Box>

      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              {tab < 2 ? (
                <>
                  <TableHead><TableRow>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>CATEGORY</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>ITEM_LV3</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>YTD_ACT</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>ANNUAL_TARGET</TableCell>
                    <TableCell sx={{ bgcolor: '#dcfce7', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>FORECAST</TableCell>
                    <TableCell sx={{ bgcolor: '#fef3c7', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>PROGRESS%</TableCell>
                    <TableCell sx={{ bgcolor: '#fee2e2', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>GAP</TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {ANNUAL_ROWS.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontSize: 11 }}>{r.CATEGORY}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{r.ITEM_LV3}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.YTD_ACT.toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.ANNUAL_TARGET.toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 600 }}>{r.FORECAST.toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 700, color: r.PROGRESS >= 45 ? '#10b981' : '#f59e0b' }}>{r.PROGRESS.toFixed(1)}%</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', color: r.GAP < 0 ? '#ef4444' : r.GAP > 0 ? '#3b82f6' : '#9ca3af', fontWeight: 600 }}>{r.GAP > 0 ? '+' : ''}{r.GAP.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              ) : (
                <>
                  <TableHead><TableRow>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>DATE</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>PLANT</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>생산 QTY</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>출하 QTY</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>재고 QTY</TableCell>
                    <TableCell sx={{ bgcolor: '#fef3c7', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>불량률</TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {DAILY_ROWS.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>{r.DT}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{r.PLANT}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.PROD_QTY.toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.SHIP_QTY.toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.STOCK_QTY.toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 700, color: r.DEFECT_PCT > 1.0 ? '#f59e0b' : '#10b981' }}>{r.DEFECT_PCT.toFixed(2)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              )}
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}

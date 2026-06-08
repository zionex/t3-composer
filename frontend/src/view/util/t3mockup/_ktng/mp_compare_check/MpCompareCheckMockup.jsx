import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Tabs, Tab, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// KTNG — MP 비교/점검
//  Tab 1: UI_MP_KTNG_06 BF & 회귀분석 예측 비교  → MpKtng06.jsx
//  Tab 2: UI_MP_KTNG_08 설비별 정수 부정수 점검   → MpKtng08.jsx

const BF_COMPARE_ROWS = [
  { ITEM_NM: '에쎄 스페셜 골드', BF_FCST: 132500, REGR_FCST: 128300, ACTUAL: 130200, BF_ERR_PCT: -1.8, REGR_ERR_PCT: 1.5, WINNER: 'REGR' },
  { ITEM_NM: '에쎄 라이트',     BF_FCST: 85000,  REGR_FCST: 88500,  ACTUAL: 87200,  BF_ERR_PCT: 2.5,  REGR_ERR_PCT: -1.5, WINNER: 'REGR' },
  { ITEM_NM: '디스 플러스',     BF_FCST: 33500,  REGR_FCST: 32800,  ACTUAL: 33000,  BF_ERR_PCT: -1.5, REGR_ERR_PCT: 0.6, WINNER: 'REGR' },
  { ITEM_NM: '더원 오렌지',     BF_FCST: 28500,  REGR_FCST: 29200,  ACTUAL: 28800,  BF_ERR_PCT: 1.0,  REGR_ERR_PCT: -1.4, WINNER: 'BF'   },
  { ITEM_NM: 'TIME',           BF_FCST: 38800,  REGR_FCST: 35500,  ACTUAL: 36500,  BF_ERR_PCT: -6.3, REGR_ERR_PCT: 2.7, WINNER: 'REGR' },
  { ITEM_NM: '릴 NGP',         BF_FCST: 92000,  REGR_FCST: 98500,  ACTUAL: 95000,  BF_ERR_PCT: 3.2,  REGR_ERR_PCT: -3.7, WINNER: 'BF'   },
];

const ODD_EVEN_ROWS = [
  { RESOURCE: 'MAKER-01 (신탄진)',  WK: '2026-W24', PLAN_QTY: 235000, MIN_LOT: 1000, ODD_QTY: 500,   STATUS: 'WARN',   REMARK: '500개 부정수 — Lot 미만' },
  { RESOURCE: 'MAKER-02 (신탄진)',  WK: '2026-W24', PLAN_QTY: 240000, MIN_LOT: 1000, ODD_QTY: 0,     STATUS: 'OK',     REMARK: '' },
  { RESOURCE: 'PACKER-01 (신탄진)', WK: '2026-W24', PLAN_QTY: 275000, MIN_LOT: 500,  ODD_QTY: 250,   STATUS: 'WARN',   REMARK: '250개 부정수' },
  { RESOURCE: 'PACKER-02 (신탄진)', WK: '2026-W24', PLAN_QTY: 290000, MIN_LOT: 500,  ODD_QTY: 0,     STATUS: 'OK',     REMARK: '' },
  { RESOURCE: 'OVEN-01 (청주)',     WK: '2026-W24', PLAN_QTY: 165500, MIN_LOT: 1000, ODD_QTY: 500,   STATUS: 'WARN',   REMARK: '잔량 발생' },
  { RESOURCE: 'MAKER-03 (청주)',    WK: '2026-W24', PLAN_QTY: 198000, MIN_LOT: 1000, ODD_QTY: 0,     STATUS: 'OK',     REMARK: '' },
];

export default function KtngMpCompareCheckMockup() {
  const [tab, setTab] = React.useState(0);
  return (
    <MockShell
      patternCode="ktng_mp_compare_check"
      patternLabel="KTNG — MP 비교/점검 (BF 회귀 / 정수 부정수)"
      layoutCategory="LAYOUT_SINGLE"
      description="UI_MP_KTNG_06 BF & 회귀분석 예측 비교 + UI_MP_KTNG_08 설비별 정수 부정수 점검. 2개 점검 화면 묶음."
    >
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>BF & 회귀분석 비교</span><Chip label="UI_MP_KTNG_06" size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} /></Stack>} />
          <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>정수/부정수 점검</span><Chip label="UI_MP_KTNG_08" size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} /></Stack>} />
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="BASE_YM" size="small" select value="2026-06" sx={{ width: 130 }}><MenuItem value="2026-06">2026-06</MenuItem></TextField>
          <TextField label={tab === 0 ? 'ITEM' : 'RESOURCE'} size="small" select value="ALL" sx={{ width: 160 }}><MenuItem value="ALL">전체</MenuItem></TextField>
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
      </Box>

      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              {tab === 0 ? (
                <>
                  <TableHead><TableRow>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>ITEM_NM</TableCell>
                    <TableCell sx={{ bgcolor: '#dbeafe', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>BF_FCST</TableCell>
                    <TableCell sx={{ bgcolor: '#dcfce7', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>REGR_FCST</TableCell>
                    <TableCell sx={{ bgcolor: '#fef3c7', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>ACTUAL</TableCell>
                    <TableCell sx={{ bgcolor: '#dbeafe', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>BF_ERR%</TableCell>
                    <TableCell sx={{ bgcolor: '#dcfce7', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>REGR_ERR%</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>WINNER</TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {BF_COMPARE_ROWS.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontSize: 11 }}>{r.ITEM_NM}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.BF_FCST.toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.REGR_FCST.toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 600 }}>{r.ACTUAL.toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', color: Math.abs(r.BF_ERR_PCT) > 5 ? '#ef4444' : Math.abs(r.BF_ERR_PCT) > 2 ? '#f59e0b' : '#10b981' }}>{r.BF_ERR_PCT > 0 ? '+' : ''}{r.BF_ERR_PCT.toFixed(1)}%</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', color: Math.abs(r.REGR_ERR_PCT) > 5 ? '#ef4444' : Math.abs(r.REGR_ERR_PCT) > 2 ? '#f59e0b' : '#10b981' }}>{r.REGR_ERR_PCT > 0 ? '+' : ''}{r.REGR_ERR_PCT.toFixed(1)}%</TableCell>
                        <TableCell sx={{ fontSize: 11, textAlign: 'center' }}><Chip label={r.WINNER} size="small" sx={{ height: 18, fontSize: 10, bgcolor: r.WINNER === 'BF' ? '#3b82f6' : '#10b981', color: 'white', fontWeight: 700 }} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              ) : (
                <>
                  <TableHead><TableRow>
                    {['RESOURCE', 'WEEK', 'PLAN_QTY', 'MIN_LOT', 'ODD_QTY', 'STATUS', 'REMARK'].map((h) => (
                      <TableCell key={h} sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: ['PLAN_QTY', 'MIN_LOT', 'ODD_QTY'].includes(h) ? 'right' : ['WEEK', 'STATUS'].includes(h) ? 'center' : 'inherit' }}>{h}</TableCell>
                    ))}
                  </TableRow></TableHead>
                  <TableBody>
                    {ODD_EVEN_ROWS.map((r, i) => (
                      <TableRow key={i} hover sx={{ bgcolor: r.STATUS === 'WARN' ? '#fffbeb' : 'transparent' }}>
                        <TableCell sx={{ fontSize: 11 }}>{r.RESOURCE}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>{r.WK}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.PLAN_QTY.toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.MIN_LOT.toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', color: r.ODD_QTY > 0 ? '#f59e0b' : '#10b981', fontWeight: r.ODD_QTY > 0 ? 700 : 400 }}>{r.ODD_QTY.toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: 11, textAlign: 'center', fontWeight: 700, color: r.STATUS === 'OK' ? '#10b981' : '#f59e0b' }}>{r.STATUS}</TableCell>
                        <TableCell sx={{ fontSize: 11, color: 'text.secondary' }}>{r.REMARK}</TableCell>
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

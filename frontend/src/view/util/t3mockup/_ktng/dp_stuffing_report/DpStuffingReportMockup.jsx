import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Paper,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MockShell from '../../_shared/MockShell';

// DpKtng20 — Stuffing 리포트 (수출 컨테이너 적재 계획)
// 거점-도착지-품목 × 출하주차별 컨테이너 / 카톤 / CBM 요약

const KPI = [
  { label: '예정 컨테이너', value: '142', unit: 'CNTR', color: 'primary' },
  { label: '총 카톤',       value: '8,420', unit: 'CTN', color: 'info' },
  { label: '총 CBM',        value: '4,856', unit: 'm³',  color: 'success' },
  { label: 'Fill Rate 평균', value: '87.2',  unit: '%',   color: 'warning' },
];

const ROWS = [
  { LOC_FROM: '인천', LOC_TO: '인도네시아 자카르타', ITEM_LV3: 'EXPORT-K', ITEM_NM: '수출 KING',  WEEK: 'W22', CNTR: 6, CTN: 480, CBM: 215, FILL: 92.5, SAIL_DT: '2026-05-28', STATUS: 'planned' },
  { LOC_FROM: '인천', LOC_TO: '인도 뭄바이',         ITEM_LV3: 'EXPORT-K', ITEM_NM: '수출 KING',  WEEK: 'W22', CNTR: 8, CTN: 640, CBM: 296, FILL: 95.0, SAIL_DT: '2026-05-29', STATUS: 'planned' },
  { LOC_FROM: '부산', LOC_TO: '몽골 울란바토르',     ITEM_LV3: 'EXPORT-K', ITEM_NM: '수출 KING',  WEEK: 'W23', CNTR: 3, CTN: 240, CBM: 102, FILL: 78.5, SAIL_DT: '2026-06-02', STATUS: 'planned' },
  { LOC_FROM: '인천', LOC_TO: '인도네시아 자카르타', ITEM_LV3: 'EXPORT-B', ITEM_NM: '수출 BLU',   WEEK: 'W23', CNTR: 4, CTN: 320, CBM: 138, FILL: 85.2, SAIL_DT: '2026-06-04', STATUS: 'confirmed' },
  { LOC_FROM: '광양', LOC_TO: '인도 첸나이',         ITEM_LV3: 'EXPORT-K', ITEM_NM: '수출 KING',  WEEK: 'W24', CNTR: 10,CTN: 800, CBM: 372, FILL: 96.0, SAIL_DT: '2026-06-10', STATUS: 'planned' },
  { LOC_FROM: '부산', LOC_TO: '베트남 호치민',       ITEM_LV3: 'NGP-STICK',ITEM_NM: 'illuvia 스틱', WEEK: 'W24', CNTR: 2, CTN: 160, CBM:  68, FILL: 65.0, SAIL_DT: '2026-06-12', STATUS: 'short' },
  { LOC_FROM: '인천', LOC_TO: '인도 뭄바이',         ITEM_LV3: 'EXPORT-K', ITEM_NM: '수출 KING',  WEEK: 'W25', CNTR: 7, CTN: 560, CBM: 258, FILL: 89.5, SAIL_DT: '2026-06-18', STATUS: 'planned' },
];

const STATUS_COLOR = { confirmed: 'success', planned: 'info', short: 'warning' };

export default function DpStuffingReportMockup() {
  return (
    <MockShell patternCode="ktng_dp_stuffing_report" patternLabel="KTNG — Stuffing 리포트 (DpKtng20)"
      layoutCategory="LAYOUT_SINGLE" description="수출 컨테이너 적재 계획 — 거점·도착지·품목 × 주차별 컨테이너/카톤/CBM/Fill Rate.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="출발 거점" size="small" select value="ALL" sx={{ width: 140 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="인천">인천</MenuItem><MenuItem value="부산">부산</MenuItem><MenuItem value="광양">광양</MenuItem>
          </TextField>
          <TextField label="도착 국가" size="small" select value="ALL" sx={{ width: 140 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="ID">인도네시아</MenuItem><MenuItem value="IN">인도</MenuItem><MenuItem value="MN">몽골</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-W22 ~ W26" sx={{ width: 160 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>Excel</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        <Stack direction="row" spacing={1.5}>
          {KPI.map((k) => (
            <Paper key={k.label} variant="outlined" sx={{ p: 1.5, flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <LocalShippingIcon color={k.color} fontSize="small" />
                <Typography variant="caption" color="text.secondary">{k.label}</Typography>
              </Stack>
              <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mt: 0.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: `${k.color}.main` }}>{k.value}</Typography>
                <Typography variant="body2" color="text.secondary">{k.unit}</Typography>
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>주차별 Stuffing 상세</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['출발','도착','품목','LV3','주차','CNTR','CTN','CBM','Fill (%)','출항일','상태'].map((c, i) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                      textAlign: ['CNTR','CTN','CBM','Fill (%)'].includes(c) ? 'right' : (c === '주차' || c === '상태' ? 'center' : 'left') }}>
                      {c}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{r.LOC_FROM}</TableCell>
                    <TableCell>{r.LOC_TO}</TableCell>
                    <TableCell>{r.ITEM_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.ITEM_LV3}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}><Chip size="small" label={r.WEEK} variant="outlined" /></TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{r.CNTR}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.CTN}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.CBM}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: r.FILL >= 90 ? 'success.main' : r.FILL >= 80 ? 'warning.main' : 'error.main', fontWeight: 600 }}>{r.FILL.toFixed(1)}%</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.SAIL_DT}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Chip size="small" label={r.STATUS.toUpperCase()} color={STATUS_COLOR[r.STATUS]} /></TableCell>
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

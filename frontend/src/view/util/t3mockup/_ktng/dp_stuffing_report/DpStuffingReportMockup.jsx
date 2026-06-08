import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, LinearProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// KTNG — DP Stuffing 리포트
// UI_DP_KTNG_20 → DpKtng20.jsx
//   컨테이너 적재 (Stuffing) 리포트 — Booking 단위로 컨테이너 적재율

const ROWS = [
  { BOOKING_NO: 'BKG-2026-0612-001', SHIP_DT: '2026-06-12', POL: '부산항',  POD: 'LA항',         CNTR_TYPE: '40HC', SALES_CNTRY: '미국',    ITEMS: 8,  TOTAL_QTY: 240000, CNTR_CAPACITY: 250000, FILL_RATE: 96.0 },
  { BOOKING_NO: 'BKG-2026-0613-002', SHIP_DT: '2026-06-13', POL: '부산항',  POD: 'Kaohsiung',    CNTR_TYPE: '20',   SALES_CNTRY: '대만',    ITEMS: 5,  TOTAL_QTY: 92000,  CNTR_CAPACITY: 120000, FILL_RATE: 76.7 },
  { BOOKING_NO: 'BKG-2026-0614-003', SHIP_DT: '2026-06-14', POL: '부산항',  POD: 'Hamburg',      CNTR_TYPE: '40HC', SALES_CNTRY: '독일',    ITEMS: 12, TOTAL_QTY: 235000, CNTR_CAPACITY: 250000, FILL_RATE: 94.0 },
  { BOOKING_NO: 'BKG-2026-0615-004', SHIP_DT: '2026-06-15', POL: '인천항',  POD: 'Vostochny',    CNTR_TYPE: '40',   SALES_CNTRY: '러시아',  ITEMS: 6,  TOTAL_QTY: 198000, CNTR_CAPACITY: 220000, FILL_RATE: 90.0 },
  { BOOKING_NO: 'BKG-2026-0616-005', SHIP_DT: '2026-06-16', POL: '부산항',  POD: 'Tanjung Pelepas', CNTR_TYPE: '40HC', SALES_CNTRY: '인도네시아', ITEMS: 9, TOTAL_QTY: 145000, CNTR_CAPACITY: 250000, FILL_RATE: 58.0 },
  { BOOKING_NO: 'BKG-2026-0617-006', SHIP_DT: '2026-06-17', POL: '부산항',  POD: 'Yokohama',     CNTR_TYPE: '20',   SALES_CNTRY: '일본',    ITEMS: 4,  TOTAL_QTY: 115000, CNTR_CAPACITY: 120000, FILL_RATE: 95.8 },
];

const totalCntr = ROWS.length;
const avgFill = (ROWS.reduce((s, r) => s + r.FILL_RATE, 0) / ROWS.length).toFixed(1);
const lowFill = ROWS.filter((r) => r.FILL_RATE < 80).length;

export default function KtngDpStuffingReportMockup() {
  return (
    <MockShell
      patternCode="ktng_dp_stuffing_report"
      patternLabel="KTNG — DP Stuffing 리포트"
      layoutCategory="LAYOUT_SINGLE"
      description="UI_DP_KTNG_20 → DpKtng20.jsx. 컨테이너 적재 (Stuffing) 리포트 — Booking 단위로 적재율 + 운송 정보 (POL/POD/CNTR 타입). 셀 데이터는 KTNG 도메인 (부산항/인천항 출발 → 미국/대만/독일/러시아/인도네시아/일본 도착)."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="SHIP_DT" size="small" value="2026-06-01 ~ 06-30" sx={{ width: 200 }} />
          <TextField label="POL" size="small" select value="ALL" sx={{ width: 130 }}><MenuItem value="ALL">전체</MenuItem></TextField>
          <TextField label="POD" size="small" select value="ALL" sx={{ width: 160 }}><MenuItem value="ALL">전체</MenuItem></TextField>
          <TextField label="SALES_CNTRY" size="small" select value="ALL" sx={{ width: 150 }}><MenuItem value="ALL">전체</MenuItem></TextField>
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label={`Bookings ${totalCntr}건`} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
        <Chip label={`평균 적재율 ${avgFill}%`} size="small" color="success" variant="outlined" sx={{ fontFamily: 'monospace' }} />
        <Chip label={`저적재 ${lowFill}건 (<80%)`} size="small" color="warning" variant="outlined" sx={{ fontFamily: 'monospace' }} />
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
      </Box>

      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead><TableRow>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, fontFamily: 'monospace' }}>BOOKING_NO</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>SHIP_DT</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11 }}>POL</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11 }}>POD</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>CNTR_TYPE</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11 }}>SALES_CNTRY</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'right' }}>ITEMS</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'right' }}>TOTAL_QTY</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'right' }}>CAPACITY</TableCell>
                <TableCell sx={{ bgcolor: '#fef3c7', fontWeight: 700, fontSize: 11, width: 200 }}>FILL_RATE</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{r.BOOKING_NO}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>{r.SHIP_DT}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.POL}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.POD}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center', fontWeight: 600 }}>{r.CNTR_TYPE}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.SALES_CNTRY}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.ITEMS}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.TOTAL_QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.CNTR_CAPACITY.toLocaleString()}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <LinearProgress variant="determinate" value={r.FILL_RATE} sx={{ flex: 1, height: 8, borderRadius: 1, bgcolor: '#e5e7eb', '& .MuiLinearProgress-bar': { bgcolor: r.FILL_RATE >= 90 ? '#10b981' : r.FILL_RATE >= 80 ? '#3b82f6' : '#f59e0b' } }} />
                        <Typography sx={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, width: 50, textAlign: 'right' }}>{r.FILL_RATE.toFixed(1)}%</Typography>
                      </Stack>
                    </TableCell>
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

import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography,
  Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MockShell from '../../_shared/MockShell';

// PLANNEL Sales Analysis — TopLevelItem 1개
// LAYOUT_SINGLE — 상위 수준 Item 판매 분석 (계층 LV1~LV3 집계)

const ROWS = [
  { LV1: '완제품',  LV2: 'LED Lighting',  LV3: 'Indoor',  qty: 12400, amt: 372000000, share: 32.5, yoy: '+8.2%' },
  { LV1: '완제품',  LV2: 'LED Lighting',  LV3: 'Outdoor', qty:  8200, amt: 246000000, share: 21.4, yoy: '+5.1%' },
  { LV1: '완제품',  LV2: 'IoT Device',    LV3: 'Smart',   qty:  5800, amt: 174000000, share: 15.2, yoy: '+18.4%' },
  { LV1: '반제품',  LV2: 'PCB Board',     LV3: 'Rev.3',   qty:  3200, amt:  96000000, share:  8.4, yoy: '-2.3%' },
  { LV1: '반제품',  LV2: 'PCB Board',     LV3: 'Rev.4',   qty:  1800, amt:  54000000, share:  4.7, yoy: '+45.2%' },
  { LV1: '원자재',  LV2: 'Heatsink',      LV3: 'Aluminum',qty:  6100, amt:  91500000, share:  8.0, yoy: '+3.5%' },
  { LV1: '원자재',  LV2: 'Housing',       LV3: 'Plastic', qty:  4500, amt:  67500000, share:  5.9, yoy: '-1.8%' },
  { LV1: '원자재',  LV2: 'Cover',         LV3: 'Glass',   qty:  2800, amt:  42000000, share:  3.7, yoy: '+12.0%' },
];

const TOTAL = ROWS.reduce((a, b) => ({ qty: a.qty + b.qty, amt: a.amt + b.amt }), { qty: 0, amt: 0 });

export default function SalesAnalysisMockup() {
  return (
    <MockShell
      patternCode="plannel_sales_analysis"
      patternLabel="PlaNEL — Sales 상위 분석 (Top Level Item Analysis)"
      layoutCategory="LAYOUT_SINGLE"
      description="LV1~LV3 계층 집계 — 수량/금액/점유율/YoY. 상위 수준 품목 매출 분석."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="분석 레벨" select size="small" value="LV3" sx={{ width: 150 }}>
            <MenuItem value="LV1">LV1 (대분류)</MenuItem>
            <MenuItem value="LV2">LV2 (중분류)</MenuItem>
            <MenuItem value="LV3">LV3 (소분류)</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-05" sx={{ width: 130 }} />
          <TextField label="정렬" select size="small" value="AMT_DESC" sx={{ width: 150 }}>
            <MenuItem value="AMT_DESC">금액 ↓</MenuItem>
            <MenuItem value="QTY_DESC">수량 ↓</MenuItem>
            <MenuItem value="YOY_DESC">YoY ↓</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Chip label={`합계 ${TOTAL.qty.toLocaleString()}개 / ${(TOTAL.amt / 1e6).toFixed(0)}M KRW`}
            color="primary" sx={{ fontFamily: 'monospace' }} />
          <Button size="small" startIcon={<SearchIcon />} variant="contained">조회</Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 700 }}>LV1</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>LV2</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>LV3</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>수량 (EA)</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>금액 (KRW)</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>점유율</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>YoY</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ROWS.map((r, i) => (
              <TableRow key={i} hover>
                <TableCell><Chip label={r.LV1} size="small" variant="outlined" /></TableCell>
                <TableCell>{r.LV2}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{r.LV3}</TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.qty.toLocaleString()}</TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>
                  {(r.amt / 1e6).toFixed(1)}M
                </TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 60, height: 8, backgroundColor: 'grey.200', borderRadius: 1 }}>
                      <Box sx={{ width: `${r.share * 2}%`, height: '100%', backgroundColor: 'primary.main', borderRadius: 1 }} />
                    </Box>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', minWidth: 40 }}>{r.share}%</Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700,
                  color: r.yoy.startsWith('+') ? 'success.main' : 'error.main' }}>{r.yoy}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </MockShell>
  );
}

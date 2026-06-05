import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import MockShell from '../../_shared/MockShell';
import { cellSx, deltaStatus } from '../../_shared/styleCallback';

// CJBO — DP 버전 비교 (DpVerDiff)
// UI_DP_VER_DIFF — V2026-04 vs V2026-05 vs V2026-06 등 다중 버전 비교

const MONTHS = ['2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'];

const ROWS = [
  { ITEM: 'illuvia 비건마스크 5매',
    v04: [4500, 4800, 5000, 4900, 4700, 4800, 4800],
    v05: [4800, 5100, 5300, 5000, 4900, 5050, 5050],
    v06: [4900, 5150, 5350, 5050, 4950, 5100, 5100],
    delta: 2.0 },
  { ITEM: 'illuvia 토너 200ml',
    v04: [2600, 2700, 2750, 2700, 2650, 2650, 2650],
    v05: [2500, 2700, 2800, 2700, 2600, 2600, 2600],
    v06: [2400, 2650, 2780, 2680, 2580, 2580, 2580],
    delta: -4.0 },
  { ITEM: 'CJ Brand Korea KING-RED',
    v04: [6000, 6300, 6400, 6100, 6000, 6050, 6050],
    v05: [5800, 6100, 6300, 6000, 5900, 5950, 5950],
    v06: [5500, 5900, 6200, 5950, 5850, 5900, 5900],
    delta: -5.2 },
  { ITEM: 'illuvia MASK (수출)',
    v04: [4800, 5100, 5300, 5000, 4900, 5000, 5000],
    v05: [4900, 5200, 5400, 5100, 5000, 5100, 5100],
    v06: [5100, 5350, 5550, 5200, 5100, 5200, 5200],
    delta: 4.1 },
  { ITEM: 'NGP Device #01',
    v04: [2200, 2400, 2400, 2300, 2200, 2250, 2250],
    v05: [1700, 1900, 1900, 1800, 1700, 1750, 1750],
    v06: [1500, 1700, 1700, 1600, 1500, 1550, 1550],
    delta:-11.2 },
];

function sum(arr) { return arr.reduce((a, b) => a + b, 0); }

export default function CjboDpVerDiffMockup() {
  return (
    <MockShell patternCode="cjbo_dp_ver_diff" patternLabel="CJBO — DP 버전 비교 (DpVerDiff)"
      layoutCategory="LAYOUT_SINGLE"
      description="V2026-04 / V2026-05 / V2026-06 다중 버전 × 월별 비교 + 증감률. UI_DP_VER_DIFF.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="기준 버전" size="small" select value="V2026-04" sx={{ width: 140 }}>
            <MenuItem value="V2026-04">V2026-04</MenuItem>
          </TextField>
          <CompareArrowsIcon color="action" />
          <TextField label="비교 버전 1" size="small" select value="V2026-05" sx={{ width: 140 }}>
            <MenuItem value="V2026-05">V2026-05</MenuItem>
          </TextField>
          <TextField label="비교 버전 2" size="small" select value="V2026-06" sx={{ width: 140 }}>
            <MenuItem value="V2026-06">V2026-06</MenuItem>
          </TextField>
          <TextField label="계획구분" size="small" select value="OP" sx={{ width: 130 }}>
            <MenuItem value="OP">OP</MenuItem><MenuItem value="TP">TP</MenuItem>
          </TextField>
          <TextField label="대분류" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1, overflow: 'auto' }}>
        <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip size="small" label="V2026-04" sx={{ backgroundColor: '#90caf9', color: '#0d47a1', fontWeight: 700 }} />
          <CompareArrowsIcon fontSize="small" color="action" />
          <Chip size="small" label="V2026-05" sx={{ backgroundColor: '#a5d6a7', color: '#1b5e20', fontWeight: 700 }} />
          <CompareArrowsIcon fontSize="small" color="action" />
          <Chip size="small" label="V2026-06" sx={{ backgroundColor: '#ce93d8', color: '#4a148c', fontWeight: 700 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="caption" color="text.secondary">증감률: V2026-04 → V2026-06</Typography>
        </Paper>

        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 320 }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700, position: 'sticky', left: 0, zIndex: 4 }}>품목</TableCell>
                  <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>버전</TableCell>
                  <TableCell colSpan={MONTHS.length} sx={{ backgroundColor: '#e3f2fd', fontWeight: 700, textAlign: 'center' }}>월별 (2026)</TableCell>
                  <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700, textAlign: 'right' }}>합계</TableCell>
                  <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700, textAlign: 'center' }}>증감률</TableCell>
                </TableRow>
                <TableRow>
                  {MONTHS.map((m) => (
                    <TableCell key={m} sx={{ backgroundColor: '#e3f2fd', fontWeight: 700, textAlign: 'right', fontSize: 11 }}>{m.slice(5)}월</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, gi) => {
                  const tone = deltaStatus(r.delta);
                  return [
                    <TableRow key={`${gi}-v04`} hover sx={{ backgroundColor: '#e3f2fd33' }}>
                      <TableCell rowSpan={3} sx={{ position: 'sticky', left: 0, backgroundColor: 'background.paper', fontWeight: 600, borderRight: '1px solid', borderColor: 'divider', verticalAlign: 'middle' }}>{r.ITEM}</TableCell>
                      <TableCell><Chip size="small" label="V2026-04" sx={{ backgroundColor: '#90caf9', color: '#0d47a1', fontWeight: 700, fontSize: 10 }} /></TableCell>
                      {r.v04.map((v, j) => (
                        <TableCell key={j} sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12 }}>{v.toLocaleString()}</TableCell>
                      ))}
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{sum(r.v04).toLocaleString()}</TableCell>
                      <TableCell rowSpan={3} sx={{ ...cellSx(tone, { align: 'center', mono: true }), verticalAlign: 'middle' }}>
                        {r.delta > 0 ? '+' : ''}{r.delta.toFixed(1)}%
                      </TableCell>
                    </TableRow>,
                    <TableRow key={`${gi}-v05`} hover sx={{ backgroundColor: '#c8e6c933' }}>
                      <TableCell><Chip size="small" label="V2026-05" sx={{ backgroundColor: '#a5d6a7', color: '#1b5e20', fontWeight: 700, fontSize: 10 }} /></TableCell>
                      {r.v05.map((v, j) => (
                        <TableCell key={j} sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12 }}>{v.toLocaleString()}</TableCell>
                      ))}
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{sum(r.v05).toLocaleString()}</TableCell>
                    </TableRow>,
                    <TableRow key={`${gi}-v06`} hover sx={{ backgroundColor: '#e1bee733' }}>
                      <TableCell><Chip size="small" label="V2026-06" sx={{ backgroundColor: '#ce93d8', color: '#4a148c', fontWeight: 700, fontSize: 10 }} /></TableCell>
                      {r.v06.map((v, j) => (
                        <TableCell key={j} sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12 }}>{v.toLocaleString()}</TableCell>
                      ))}
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{sum(r.v06).toLocaleString()}</TableCell>
                    </TableRow>,
                  ];
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}

import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import EventIcon from '@mui/icons-material/Event';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// OronMp03 — 생산능력 + 캘린더 + 작업교체시간 + 동시생산제약 + 공용설비제약
// UI_MP_ORN_BOR, UI_MP_ORN_BOR_SET, UI_MP_ORN_CALENDAR, UI_MP_JC_TIME, UI_MP_ORN_BY_PRODUCT

const BOR_COLS = [
  { name: 'LINE_CD',  label: '라인',     width: 90,  align: 'center' },
  { name: 'ITEM_CD',  label: '품목',     width: 100, align: 'center' },
  { name: 'CAPA_HR',  label: '시간생산능력', width: 110, align: 'right' },
  { name: 'MIN_LOT',  label: '최소LOT', width: 80,  align: 'right' },
  { name: 'MAX_LOT',  label: '최대LOT', width: 80,  align: 'right' },
  { name: 'PREFER',   label: '우선순위', width: 80,  align: 'center' },
  { name: 'YIELD',    label: '수율(%)', width: 80,  align: 'right' },
];

const BOR = [
  { LINE_CD: 'L-001', ITEM_CD: 'F01001', CAPA_HR: 600, MIN_LOT: 500,  MAX_LOT: 5000,  PREFER: 1, YIELD: 98.5 },
  { LINE_CD: 'L-001', ITEM_CD: 'F01002', CAPA_HR: 600, MIN_LOT: 500,  MAX_LOT: 4000,  PREFER: 2, YIELD: 97.8 },
  { LINE_CD: 'L-002', ITEM_CD: 'F02001', CAPA_HR: 800, MIN_LOT: 800,  MAX_LOT: 8000,  PREFER: 1, YIELD: 99.0 },
  { LINE_CD: 'L-003', ITEM_CD: 'F01002', CAPA_HR: 500, MIN_LOT: 500,  MAX_LOT: 3000,  PREFER: 1, YIELD: 98.2 },
  { LINE_CD: 'L-004', ITEM_CD: 'F01003', CAPA_HR: 1500,MIN_LOT: 1000, MAX_LOT: 12000, PREFER: 1, YIELD: 99.5 },
  { LINE_CD: 'L-005', ITEM_CD: 'F03001', CAPA_HR: 400, MIN_LOT: 200,  MAX_LOT: 3000,  PREFER: 1, YIELD: 96.5 },
];

// 작업 교체 시간 (FROM_ITEM × TO_ITEM)
const JC_ITEMS = ['F01001', 'F01002', 'F01003', 'F02001'];
const JC_MATRIX = [
  [0,   1.5, 2.0, 3.0],
  [1.5, 0,   1.0, 2.5],
  [2.0, 1.0, 0,   2.0],
  [3.0, 2.5, 2.0, 0  ],
];

// 캘린더 — 라인별 휴무/근무
const CAL_ROWS = [
  { LINE_CD: 'L-001', DATE: '2026-05-05', TYPE: 'HOLIDAY', NM: '어린이날', HR: 0 },
  { LINE_CD: 'L-001', DATE: '2026-05-10', TYPE: 'WORK',    NM: '특근',     HR: 12 },
  { LINE_CD: 'L-002', DATE: '2026-05-05', TYPE: 'HOLIDAY', NM: '어린이날', HR: 0 },
  { LINE_CD: 'L-002', DATE: '2026-05-15', TYPE: 'STOP',    NM: '정기점검', HR: 0 },
  { LINE_CD: 'L-003', DATE: '2026-05-05', TYPE: 'HOLIDAY', NM: '어린이날', HR: 0 },
];

const CAL_TYPE_COLOR = { HOLIDAY: 'error', WORK: 'success', STOP: 'warning' };

export default function OronMpCapacityMockup() {
  return (
    <MockShell
      patternCode="oron_mp_capacity"
      patternLabel="ORON — 생산능력 + 캘린더 + 작업교체시간"
      layoutCategory="LAYOUT_SINGLE"
      description="생산능력(BOR) + 라인별 캘린더 + JC_TIME 매트릭스 + 동시생산제약."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="PLAN_SCOPE" size="small" select value="ORN_MP" sx={{ width: 140 }}>
            <MenuItem value="ORN_MP">ORN_MP</MenuItem>
          </TextField>
          <TextField label="라인" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="L-001">L-001</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-05 ~ 2026-12" sx={{ width: 170 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="contained" size="small" startIcon={<SaveIcon />}>저장</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
        {/* Top row — BOR + JC_TIME */}
        <Stack direction="row" spacing={1.5} sx={{ height: 250 }}>
          <Paper variant="outlined" sx={{ flex: 1.4, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>BOR — 라인×품목 생산능력</Typography>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {BOR_COLS.map((c) => (
                      <TableCell key={c.name} sx={{ backgroundColor: 'grey.100', width: c.width, fontWeight: 700, textAlign: c.align }}>
                        {c.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {BOR.map((r, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.LINE_CD}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.ITEM_CD}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.CAPA_HR.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.MIN_LOT.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.MAX_LOT.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}><Chip size="small" label={`P${r.PREFER}`} color={r.PREFER === 1 ? 'success' : 'default'} variant="outlined" /></TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.YIELD.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>작업교체시간 (Hr)</Typography>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'center' }}>FROM \ TO</TableCell>
                    {JC_ITEMS.map((it) => (
                      <TableCell key={it} sx={{ backgroundColor: 'grey.100', fontWeight: 700, textAlign: 'center', fontFamily: 'monospace' }}>{it}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {JC_ITEMS.map((from, i) => (
                    <TableRow key={from} hover>
                      <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{from}</TableCell>
                      {JC_MATRIX[i].map((v, j) => (
                        <TableCell key={j} sx={{
                          textAlign: 'center', fontFamily: 'monospace',
                          color: v === 0 ? '#9ca3af' : v >= 2.5 ? '#c62828' : v >= 1.5 ? '#e65100' : '#374151',
                          fontWeight: v >= 2.5 ? 700 : 400,
                        }}>
                          {v === 0 ? '-' : v.toFixed(1)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Stack>

        {/* Bottom — Calendar */}
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <EventIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>생산라인 캘린더 (휴무 / 특근 / 정기점검)</Typography>
              <Chip label="2026-05" size="small" variant="outlined" />
            </Stack>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'center' }}>LINE</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>일자</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>TYPE</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 200 }}>비고</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'right' }}>가동시간</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {CAL_ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.LINE_CD}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.DATE}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip label={r.TYPE} size="small" color={CAL_TYPE_COLOR[r.TYPE] || 'default'} variant="outlined" />
                    </TableCell>
                    <TableCell>{r.NM}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.HR}h</TableCell>
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

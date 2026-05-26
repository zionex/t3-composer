import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import MockShell from '../../_shared/MockShell';

const HEADER_INFO = {
  group: 'KR_STANDARD',
  desc: '대한민국 표준 캘린더',
  fromTo: '2025-01-01 ~ 2026-12-31',
};

const MONTHS = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];

const RATE_ROWS = [
  { CCY: 'USD', NM: '미국 달러',     vals: [1330, 1325, 1340, 1355, 1360, 1345, 1338, 1342, 1350, 1365, 1370, 1355] },
  { CCY: 'EUR', NM: '유로',          vals: [1450, 1448, 1455, 1462, 1470, 1465, 1460, 1458, 1465, 1472, 1478, 1470] },
  { CCY: 'JPY', NM: '일본 엔 (100)', vals: [905, 902, 908, 912, 918, 915, 910, 907, 912, 920, 925, 918] },
  { CCY: 'CNY', NM: '중국 위안',     vals: [184, 183, 185, 187, 189, 188, 186, 185, 187, 190, 192, 189] },
];

export default function DmCalendarRateMockup() {
  return (
    <MockShell
      patternCode="plannel_dm_calendar_rate"
      patternLabel="PlaNEL — DM 시계열 마스터 (Calendar / Calendar Group / Exchange Rate / Unit Price)"
      layoutCategory="LAYOUT_V2"
      description="상단 마스터 헤더 + 하단 기간별 매트릭스. 일자/주차/월 column iteration."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="마스터" size="small" select value="EXCHANGE_RATE" sx={{ width: 180 }}>
            <MenuItem value="CALENDAR">Cycle Calendar</MenuItem>
            <MenuItem value="CALENDAR_GROUP">Calendar Group</MenuItem>
            <MenuItem value="EXCHANGE_RATE">Exchange Rate</MenuItem>
            <MenuItem value="UNIT_PRICE">Unit Price</MenuItem>
          </TextField>
          <TextField label="조회 연도" size="small" select value="2026" sx={{ width: 120 }}>
            <MenuItem value="2024">2024</MenuItem>
            <MenuItem value="2025">2025</MenuItem>
            <MenuItem value="2026">2026</MenuItem>
          </TextField>
          <TextField label="단위" size="small" select value="MONTH" sx={{ width: 110 }}>
            <MenuItem value="DAY">일</MenuItem>
            <MenuItem value="WEEK">주</MenuItem>
            <MenuItem value="MONTH">월</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      {/* 상단 V2 첫번째 — Header Form */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={3} alignItems="center">
          <Stack>
            <Typography variant="caption" color="text.secondary">캘린더 그룹</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{HEADER_INFO.group}</Typography>
          </Stack>
          <Stack>
            <Typography variant="caption" color="text.secondary">설명</Typography>
            <Typography variant="body2">{HEADER_INFO.desc}</Typography>
          </Stack>
          <Stack>
            <Typography variant="caption" color="text.secondary">유효 기간</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{HEADER_INFO.fromTo}</Typography>
          </Stack>
          <Box sx={{ flexGrow: 1 }} />
          <Chip label="ACTIVE" color="success" size="small" />
          <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
        </Stack>
      </Box>

      {/* 하단 V2 두번째 — 매트릭스 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 0, backgroundColor: 'grey.100', minWidth: 100 }}>통화</TableCell>
              <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 100, backgroundColor: 'grey.100', minWidth: 140 }}>명칭</TableCell>
              {MONTHS.map((m) => (
                <TableCell key={m} sx={{ fontWeight: 700, textAlign: 'right', minWidth: 90, fontFamily: 'monospace' }}>{m}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {RATE_ROWS.map((r) => (
              <TableRow key={r.CCY} hover>
                <TableCell sx={{ fontFamily: 'monospace', position: 'sticky', left: 0, backgroundColor: 'background.paper' }}>{r.CCY}</TableCell>
                <TableCell sx={{ position: 'sticky', left: 100, backgroundColor: 'background.paper' }}>{r.NM}</TableCell>
                {r.vals.map((v, i) => (
                  <TableCell key={i} sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{v.toLocaleString()}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </MockShell>
  );
}

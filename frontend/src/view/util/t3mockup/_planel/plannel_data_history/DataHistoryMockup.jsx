import React, { useState } from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Paper, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MockShell from '../../_shared/MockShell';

// PLANNEL Data History — DataHistory / TransformHistory 2개
// LAYOUT_V2 — 상단 검색 / 통계 + 하단 이력 그리드 (load / transform 탭)

const HISTORY_STATS = [
  { label: '오늘 로드 건수',  value: '23',    color: 'primary' },
  { label: '주간 누적',     value: '142',   color: 'info' },
  { label: '평균 소요시간',   value: '3.4분', color: 'success' },
  { label: '실패율',       value: '2.1%',  color: 'warning' },
];

const HISTORY_ROWS = [
  { time: '2026-05-26 14:23', file: 'sales_2026Q2.csv',     type: 'LOAD',      rows: 8420, dur: '2m 14s', status: 'SUCCESS', user: '김계획' },
  { time: '2026-05-26 13:55', file: 'inventory_05.xlsx',    type: 'LOAD',      rows: 5230, dur: '1m 48s', status: 'SUCCESS', user: '박재고' },
  { time: '2026-05-26 12:40', file: 'customer_master.csv',  type: 'LOAD',      rows: 1247, dur: '0m 38s', status: 'WARNING', user: '이수요' },
  { time: '2026-05-26 11:15', file: 'rule_R001_R002',       type: 'TRANSFORM', rows: 14897, dur: '0m 22s', status: 'SUCCESS', user: 'AUTO' },
  { time: '2026-05-26 10:08', file: 'shipment_log.json',    type: 'LOAD',      rows: 6850, dur: '2m 51s', status: 'SUCCESS', user: '관리자' },
  { time: '2026-05-26 09:42', file: 'rule_R003',            type: 'TRANSFORM', rows: 1247, dur: '0m 12s', status: 'SUCCESS', user: 'AUTO' },
  { time: '2026-05-26 08:30', file: 'bom_v2026.xlsx',       type: 'LOAD',      rows: 3100, dur: '1m 18s', status: 'FAILED',  user: '관리자' },
  { time: '2026-05-25 23:00', file: 'nightly_sync',         type: 'TRANSFORM', rows: 38420, dur: '12m 5s', status: 'SUCCESS', user: 'AUTO' },
];

const statusColor = (s) => s === 'SUCCESS' ? 'success' : s === 'WARNING' ? 'warning' : 'error';

const DH_TAB_LABELS = ['전체', 'Load 이력', 'Transform 이력'];

export default function DataHistoryMockup() {
  const [tab, setTab] = useState(0);
  const filteredRows = HISTORY_ROWS.filter((r) => tab === 0 || (tab === 1 && r.type === 'LOAD') || (tab === 2 && r.type === 'TRANSFORM'));
  return (
    <MockShell
      patternCode="plannel_data_history"
      patternLabel="PlaNEL — 데이터 이력 (Data History / Transform History)"
      layoutCategory="LAYOUT_V2"
      description="상단 통계 + 하단 LOAD / TRANSFORM 이력 통합 그리드. 데이터 처리 추적."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            {DH_TAB_LABELS.map((l) => <Tab key={l} label={l} />)}
          </Tabs>
          <Box sx={{ flexGrow: 1 }} />
          <TextField label="기간" size="small" value="2026-05-19 ~ 2026-05-26" sx={{ width: 220 }} />
          <TextField label="상태" select size="small" value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="SUCCESS">성공</MenuItem>
            <MenuItem value="FAILED">실패</MenuItem>
            <MenuItem value="WARNING">경고</MenuItem>
          </TextField>
          <Button size="small" startIcon={<FileDownloadIcon />}>Excel</Button>
          <Button size="small" startIcon={<SearchIcon />} variant="contained">조회</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={1.5}>
          {HISTORY_STATS.map((s) => (
            <Paper key={s.label} elevation={0} sx={{ flex: 1, p: 1.5, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: `${s.color}.main`, my: 0.3 }}>{s.value}</Typography>
            </Paper>
          ))}
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 700 }}>시각</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>파일 / 룰</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>유형</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>레코드</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>소요</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>상태</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>실행자</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map((r, i) => (
              <TableRow key={i} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{r.time}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.file}</TableCell>
                <TableCell><Chip label={r.type} size="small" variant="outlined"
                  color={r.type === 'LOAD' ? 'primary' : 'info'} /></TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.rows.toLocaleString()}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.dur}</TableCell>
                <TableCell><Chip label={r.status} size="small" color={statusColor(r.status)} /></TableCell>
                <TableCell sx={{ fontSize: 12 }}>{r.user}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </MockShell>
  );
}

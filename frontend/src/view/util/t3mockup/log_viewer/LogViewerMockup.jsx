import React from 'react';
import {
  Box, Card, CardContent, Stack, Typography, Chip, TextField, MenuItem, FormControl, InputLabel, Select,
  Table, TableHead, TableBody, TableRow, TableCell, IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';

import MockShell from '../_shared/MockShell';

const LEVEL_COLOR = { INFO: 'success', WARN: 'warning', ERROR: 'error', DEBUG: 'default' };

const LOGS = [
  { time: '2026-04-13 17:42:18.314', level: 'INFO',  user: 'kim.smk', target: 'DP_Engine',  message: 'DP 엔진 실행 완료 — version=DP_V20260413_C, RTF 96.4%' },
  { time: '2026-04-13 17:38:02.118', level: 'WARN',  user: 'lee.jih', target: 'PO-2026-0045', message: '입고 지연 감지 — 예정 4/12 → 실제 4/15' },
  { time: '2026-04-13 17:14:55.802', level: 'INFO',  user: 'kim.smk', target: 'DP_Engine',  message: 'DP 엔진 시작 — scope=KR+VN+CN, items=187' },
  { time: '2026-04-13 16:58:21.045', level: 'ERROR', user: 'system',  target: 'BF_Engine',  message: 'BF V20260413_A 실패 — DB connection timeout (retry 3/3)' },
  { time: '2026-04-13 16:55:12.331', level: 'WARN',  user: 'system',  target: 'BF_Engine',  message: 'BF V20260413_A retry 2/3 — slow query on TB_BF_RESULT' },
  { time: '2026-04-13 16:42:18.520', level: 'INFO',  user: 'kim.smk', target: 'BF_Engine',  message: 'BF 엔진 시작 — version=BF_V20260413_A' },
  { time: '2026-04-13 16:30:08.117', level: 'DEBUG', user: 'system',  target: 'Cache',       message: 'TB_AD_COMN_CODE 캐시 invalidated (group_cd=USE_YN)' },
  { time: '2026-04-13 15:48:32.910', level: 'INFO',  user: 'park.jh', target: 'TB_UT_USER_INFO', message: '사용자 정보 저장 — userId=choi.ms' },
  { time: '2026-04-13 15:22:01.025', level: 'INFO',  user: 'kim.smk', target: 'MP_Engine',  message: 'MP 엔진 결과 keep — version=MP_V20260413_E' },
  { time: '2026-04-13 14:18:45.638', level: 'WARN',  user: 'system',  target: 'IT-D002',     message: '안전재고 30% 미달 — 결품 위험 SKU 자동 감지' },
];

export default function LogViewerMockup() {
  return (
    <MockShell
      patternCode="log_viewer"
      patternLabel="Log Viewer — 로그/이력 뷰어"
      layoutCategory="LAYOUT_SINGLE"
      description="시간 필터 + 검색 + 시간순 그리드 — EngineHistory · EntryLog · TimeHistory 류 운영 화면"
    >
      <Box sx={{ p: 2 }}>
        {/* 필터 */}
        <Card variant="outlined" sx={{ mb: 1.5 }}>
          <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
              <FilterAltOutlinedIcon fontSize="small" color="action" />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>레벨</InputLabel>
                <Select label="레벨" value="ALL" onChange={() => {}} multiple={false} renderValue={() => 'ALL'}>
                  <MenuItem value="ALL">전체</MenuItem>
                </Select>
              </FormControl>
              <TextField size="small" type="datetime-local" label="From" defaultValue="2026-04-13T00:00" sx={{ width: 200 }} InputLabelProps={{ shrink: true }} />
              <TextField size="small" type="datetime-local" label="To"   defaultValue="2026-04-13T23:59" sx={{ width: 200 }} InputLabelProps={{ shrink: true }} />
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>사용자</InputLabel>
                <Select label="사용자" value="ALL" onChange={() => {}}>
                  <MenuItem value="ALL">전체</MenuItem>
                </Select>
              </FormControl>
              <TextField size="small" placeholder="메시지 검색 (LIKE)"
                         InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5 }} /> }}
                         sx={{ width: 240 }} />
              <Box sx={{ flex: 1 }} />
              <IconButton size="small"><RefreshIcon fontSize="small" /></IconButton>
              <IconButton size="small"><DownloadIcon fontSize="small" /></IconButton>
            </Stack>
          </CardContent>
        </Card>

        {/* KPI mini */}
        <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }} flexWrap="wrap">
          <Chip size="small" label="총 1,847 건" />
          <Chip size="small" color="success" label={`INFO ${LOGS.filter((l) => l.level === 'INFO').length}`} />
          <Chip size="small" color="warning" label={`WARN ${LOGS.filter((l) => l.level === 'WARN').length}`} />
          <Chip size="small" color="error"   label={`ERROR ${LOGS.filter((l) => l.level === 'ERROR').length}`} />
          <Chip size="small" variant="outlined" label={`DEBUG ${LOGS.filter((l) => l.level === 'DEBUG').length}`} />
        </Stack>

        {/* Log table */}
        <Card variant="outlined">
          <Box sx={{ maxHeight: 480, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: 'grey.100' } }}>
                  <TableCell sx={{ fontWeight: 700, width: 200 }}>시간</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 80 }}>레벨</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 120 }}>사용자</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 180 }}>대상</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>메시지</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {LOGS.map((l, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 11.5, color: 'text.secondary' }}>{l.time}</TableCell>
                    <TableCell>
                      <Chip size="small" label={l.level} color={LEVEL_COLOR[l.level]} sx={{ height: 18, fontSize: 10, fontWeight: 700, minWidth: 56 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{l.user}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>{l.target}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{l.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
          <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              최근 {LOGS.length}건 표시 · 자동 새로고침 30초
            </Typography>
          </Box>
        </Card>
      </Box>
    </MockShell>
  );
}

import React from 'react';
import {
  Box, Stack, Button, Typography, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';

import MockShell from '../_shared/MockShell';
import { ALERTS, LOCATIONS } from '../_data/mockData';

export default function GridOnlyMockup() {
  const enrichedAlerts = ALERTS.map((a) => ({
    ...a,
    locatNm: LOCATIONS.find((l) => l.locatCd === a.locatCd)?.locatNm || a.locatCd,
  }));

  return (
    <MockShell
      patternCode="P02b_grid_only"
      patternLabel="P02b — 그리드 전용 (검색 없음)"
      layoutCategory="LAYOUT_SINGLE"
      description="SearchArea 없이 단일 그리드만. 로그/알람/실시간 모니터링 화면에서 자주 사용. 자동 갱신 + 상단 카운트만 표시."
    >
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2">전체 {enrichedAlerts.length} 건</Typography>
          <Chip size="small" label={`Critical ${enrichedAlerts.filter((a) => a.severity === 'CRITICAL').length}`} color="error" />
          <Chip size="small" label={`Warning ${enrichedAlerts.filter((a) => a.severity === 'WARNING').length}`} color="warning" />
          <Chip size="small" label={`Info ${enrichedAlerts.filter((a) => a.severity === 'INFO').length}`} color="info" />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" startIcon={<RefreshIcon />}>새로고침</Button>
          <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>엑셀</Button>
        </Stack>
      </Box>
      <TableContainer component={Paper} variant="outlined" square sx={{ flex: 1, m: 1, mt: 0 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: 'grey.100' } }}>
              <TableCell align="center" sx={{ width: 80 }}>심각도</TableCell>
              <TableCell align="center" sx={{ width: 120 }}>알람ID</TableCell>
              <TableCell>메시지</TableCell>
              <TableCell align="center" sx={{ width: 160 }}>거점</TableCell>
              <TableCell align="center" sx={{ width: 170 }}>발생시각</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {enrichedAlerts.map((a) => (
              <TableRow key={a.id} hover>
                <TableCell align="center">
                  <Chip size="small" label={a.severity} color={a.severity === 'CRITICAL' ? 'error' : (a.severity === 'WARNING' ? 'warning' : 'info')} />
                </TableCell>
                <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{a.id}</TableCell>
                <TableCell>{a.message}</TableCell>
                <TableCell align="center">{a.locatNm}</TableCell>
                <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{a.dttm}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </MockShell>
  );
}

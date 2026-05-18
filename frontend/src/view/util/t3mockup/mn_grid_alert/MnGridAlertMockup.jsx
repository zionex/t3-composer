import React from 'react';
import {
  Box, Stack, Chip, Typography, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
  ToggleButton, ToggleButtonGroup,
} from '@mui/material';

import MockShell from '../_shared/MockShell';
import { ALERTS, LOCATIONS } from '../_data/mockData';

const EXTRA_ALERTS = [
  { id: 'AL-005', severity: 'CRITICAL', message: '라인 A 가동 정지 — Motor temp 92°C',         dttm: '2026-04-13 14:28:10', locatCd: 'LC-KR-01' },
  { id: 'AL-006', severity: 'WARNING',  message: 'Battery Pack 48V 수요 급증 (전주 대비 +22%)', dttm: '2026-04-13 13:55:42', locatCd: 'LC-CN-02' },
  { id: 'AL-007', severity: 'CRITICAL', message: 'PCB Substrate FR4 잔량 2일분',                  dttm: '2026-04-13 11:18:33', locatCd: 'LC-VN-02' },
  { id: 'AL-008', severity: 'INFO',     message: 'WO-2026-7773 단계 2 완료',                       dttm: '2026-04-13 10:42:01', locatCd: 'LC-VN-02' },
  { id: 'AL-009', severity: 'WARNING',  message: '품질 검사 불량률 3.2% (임계치 3%)',                dttm: '2026-04-13 09:15:55', locatCd: 'LC-KR-02' },
];

export default function MnGridAlertMockup() {
  const allAlerts = [...EXTRA_ALERTS, ...ALERTS].map((a) => ({
    ...a,
    locatNm: LOCATIONS.find((l) => l.locatCd === a.locatCd)?.locatNm || a.locatCd,
  }));

  return (
    <MockShell
      patternCode="mn_grid_alert"
      patternLabel="MN — 그리드 알람 (운영 모니터)"
      layoutCategory="LAYOUT_MONITORING"
      description="알람 큐 그리드. 심각도별 컬러 코딩 + 조치/확인 버튼. 운영 NOC 화면."
    >
      <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="subtitle2">알람 큐 ({allAlerts.length})</Typography>
          <ToggleButtonGroup size="small" exclusive value="ALL">
            <ToggleButton value="ALL">전체</ToggleButton>
            <ToggleButton value="CRITICAL" sx={{ color: 'error.main' }}>Critical {allAlerts.filter((a) => a.severity === 'CRITICAL').length}</ToggleButton>
            <ToggleButton value="WARNING"  sx={{ color: 'warning.main' }}>Warning {allAlerts.filter((a) => a.severity === 'WARNING').length}</ToggleButton>
            <ToggleButton value="INFO"     sx={{ color: 'info.main' }}>Info {allAlerts.filter((a) => a.severity === 'INFO').length}</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined">확인</Button>
          <Button size="small" variant="contained" color="error">조치 시작</Button>
        </Stack>
      </Box>

      <TableContainer component={Paper} variant="outlined" square sx={{ flex: 1, m: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: 'grey.100' } }}>
              <TableCell sx={{ width: 8 }} />
              <TableCell sx={{ width: 90 }}>심각도</TableCell>
              <TableCell sx={{ width: 100 }} align="center">알람ID</TableCell>
              <TableCell>메시지</TableCell>
              <TableCell sx={{ width: 160 }}>거점</TableCell>
              <TableCell sx={{ width: 170 }} align="center">발생시각</TableCell>
              <TableCell sx={{ width: 100 }} align="center">상태</TableCell>
              <TableCell sx={{ width: 110 }} align="center">조치</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allAlerts.map((a) => {
              const sevColor = a.severity === 'CRITICAL' ? '#da3633' : (a.severity === 'WARNING' ? '#9e6a03' : '#1f6feb');
              return (
                <TableRow key={a.id} hover>
                  <TableCell sx={{ p: 0, backgroundColor: sevColor, width: 8 }} />
                  <TableCell><Chip size="small" label={a.severity} sx={{ backgroundColor: sevColor, color: 'white', fontWeight: 700 }} /></TableCell>
                  <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{a.id}</TableCell>
                  <TableCell>{a.message}</TableCell>
                  <TableCell>{a.locatNm}</TableCell>
                  <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{a.dttm}</TableCell>
                  <TableCell align="center"><Chip size="small" label={a.id.endsWith('5') || a.id.endsWith('7') ? '처리중' : '신규'} variant="outlined" /></TableCell>
                  <TableCell align="center"><Button size="small" variant="outlined">상세</Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </MockShell>
  );
}

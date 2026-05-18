import React from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Stack,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import MockShell from '../_shared/MockShell';
import { ALERTS, LOCATIONS } from '../_data/mockData';

export default function WidgetGridMockup() {
  const rows = ALERTS.map((a) => ({ ...a, locatNm: LOCATIONS.find((l) => l.locatCd === a.locatCd)?.locatNm || a.locatCd }));
  return (
    <MockShell
      patternCode="widget_grid"
      patternLabel="위젯 — 그리드형 (DashboardPanel 안에 배치)"
      layoutCategory="WIDGET"
      description="DashboardPanel grid 의 한 셀에 들어가는 작은 그리드 위젯. 행 5개 이하."
    >
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'grey.50', height: '100%' }}>
        <Card variant="outlined" sx={{ width: 520 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle1">최근 알람</Typography>
              <Chip size="small" label={`${rows.length}건`} />
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 11, backgroundColor: 'grey.100', py: 0.5 } }}>
                    <TableCell sx={{ width: 80, py: 0.5 }}>심각도</TableCell>
                    <TableCell sx={{ py: 0.5 }}>메시지</TableCell>
                    <TableCell sx={{ width: 120, py: 0.5 }} align="center">거점</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell sx={{ py: 0.5 }}>
                        <Chip size="small" label={a.severity} color={a.severity === 'CRITICAL' ? 'error' : (a.severity === 'WARNING' ? 'warning' : 'info')} sx={{ fontSize: 10, height: 18 }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, py: 0.5 }}>{a.message}</TableCell>
                      <TableCell sx={{ fontSize: 11, py: 0.5 }} align="center">{a.locatNm}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}

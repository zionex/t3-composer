import React from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Stack,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import MockShell from '../_shared/MockShell';
import { FORECAST_TS, WEEK_BUCKETS } from '../_data/mockData';

export default function WidgetPivotMockup() {
  return (
    <MockShell
      patternCode="widget_pivot"
      patternLabel="위젯 — 피벗형 (행 × 시간)"
      layoutCategory="WIDGET"
      description="DashboardPanel grid 의 한 셀에 들어가는 작은 피벗 표 위젯. heatmap 컬러링 가능."
    >
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'grey.50', height: '100%' }}>
        <Card variant="outlined" sx={{ width: 720 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle1">품목 × 주차 — 수요 예측</Typography>
              <Chip size="small" label="Top 5 × 12W" />
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 11, backgroundColor: 'grey.100', py: 0.5 } }}>
                    <TableCell sx={{ py: 0.5 }}>품목</TableCell>
                    {WEEK_BUCKETS.slice(0, 8).map((w) => <TableCell key={w} sx={{ py: 0.5 }} align="right">{w}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {FORECAST_TS.map((row) => {
                    const values = WEEK_BUCKETS.slice(0, 8).map((w) => row[w]);
                    const max = Math.max(...values);
                    const min = Math.min(...values);
                    return (
                      <TableRow key={row.itemCd}>
                        <TableCell sx={{ fontSize: 12, py: 0.5 }}>{row.itemNm}</TableCell>
                        {values.map((v, i) => {
                          const intensity = (v - min) / (max - min || 1);
                          return (
                            <TableCell
                              key={i}
                              align="right"
                              sx={{
                                fontFamily: 'monospace', fontSize: 11, py: 0.5,
                                backgroundColor: `rgba(82, 129, 179, ${intensity * 0.7})`,
                                color: intensity > 0.6 ? 'white' : 'inherit',
                                fontWeight: intensity > 0.6 ? 700 : 400,
                              }}
                            >
                              {v.toLocaleString()}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}

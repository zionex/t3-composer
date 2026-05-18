import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Chip, LinearProgress } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MockShell from '../_shared/MockShell';
import { KPI_CARDS } from '../_data/mockData';

export default function WidgetPanelMockup() {
  return (
    <MockShell
      patternCode="widget_panel"
      patternLabel="위젯 — 패널 (KPI 카드 일체)"
      layoutCategory="WIDGET"
      description="단일 KPI 수치 + sparkline + 진척률. DashboardPanel 의 가장 흔한 셀 형식."
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'grey.50', height: '100%' }}>
        <Card variant="outlined" sx={{ width: 360 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" color="text.secondary">{KPI_CARDS[0].kpiNm}</Typography>
                <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mt: 0.5 }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>{KPI_CARDS[0].value}</Typography>
                  <Typography variant="h6" color="text.secondary">{KPI_CARDS[0].unit}</Typography>
                </Stack>
              </Box>
              <Chip size="small" icon={<TrendingUpIcon />} label="+2.4%" color="success" />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              목표 {KPI_CARDS[0].target}{KPI_CARDS[0].unit} (전월 대비)
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="caption">진척률</Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{Math.round((KPI_CARDS[0].value / (KPI_CARDS[0].target * 1.1)) * 100)}%</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={Math.round((KPI_CARDS[0].value / (KPI_CARDS[0].target * 1.1)) * 100)} sx={{ height: 8, borderRadius: 4 }} color="success" />
            </Box>
            <Stack direction="row" justifyContent="space-around" sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Stack alignItems="center">
                <Typography variant="caption" color="text.secondary">전주</Typography>
                <Typography sx={{ fontFamily: 'monospace', fontWeight: 600 }}>94.0%</Typography>
              </Stack>
              <Stack alignItems="center">
                <Typography variant="caption" color="text.secondary">평균</Typography>
                <Typography sx={{ fontFamily: 'monospace', fontWeight: 600 }}>95.1%</Typography>
              </Stack>
              <Stack alignItems="center">
                <Typography variant="caption" color="text.secondary">최대</Typography>
                <Typography sx={{ fontFamily: 'monospace', fontWeight: 600 }}>97.2%</Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}

import React from 'react';
import { Box, Stack, Chip, Typography, Card, CardContent, Grid, Avatar } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import MockShell from '../_shared/MockShell';
import { KPI_CARDS, ALERTS, WEEK_BUCKETS, FORECAST_TS } from '../_data/mockData';

function Sparkline({ data, color }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const dx = 100 / (data.length - 1 || 1);
  const points = data.map((v, i) => `${(i * dx).toFixed(1)},${(40 - ((v - min) / range) * 35 - 2).toFixed(1)}`).join(' ');
  return (
    <svg width="100%" height={40} viewBox="0 0 100 40" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} />
      <polyline points={`0,40 ${points} 100,40`} fill={color} fillOpacity={0.1} stroke="none" />
    </svg>
  );
}

export default function MnKpiMockup() {
  return (
    <MockShell
      patternCode="mn_kpi_dashboard"
      patternLabel="MN — KPI 모니터링 보드 (실시간)"
      layoutCategory="LAYOUT_MONITORING"
      description="라이브 KPI + 알람 + 미니 차트. 큰 글자 + 짙은 배경으로 PVT(공유 모니터) 친화."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: '#0d1117', color: '#c9d1d9' }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AccessTimeIcon sx={{ color: '#56d364' }} />
            <Typography sx={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700 }}>2026-04-13 14:35:42</Typography>
            <Chip size="small" label="LIVE" sx={{ backgroundColor: '#da3633', color: 'white', fontWeight: 700 }} />
          </Stack>
          <Stack direction="row" spacing={1}>
            <Chip size="small" icon={<CheckCircleOutlineIcon />} label={`OK ${KPI_CARDS.filter((k) => k.value >= k.target * 0.95).length}`} sx={{ backgroundColor: '#238636', color: 'white' }} />
            <Chip size="small" icon={<WarningAmberIcon />} label={`Warn ${ALERTS.filter((a) => a.severity === 'WARNING').length}`} sx={{ backgroundColor: '#9e6a03', color: 'white' }} />
            <Chip size="small" icon={<WarningAmberIcon />} label={`Critical ${ALERTS.filter((a) => a.severity === 'CRITICAL').length}`} sx={{ backgroundColor: '#da3633', color: 'white' }} />
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, p: 2, overflow: 'auto', backgroundColor: '#0d1117' }}>
        <Grid container spacing={1.5}>
          {KPI_CARDS.map((kpi, i) => {
            const isOk = (kpi.kpiCd === 'K03' || kpi.kpiCd === 'K04' || kpi.kpiCd === 'K06') ? (kpi.value <= kpi.target) : (kpi.value >= kpi.target);
            const trendColor = isOk ? '#56d364' : '#f7b955';
            const trendBg = isOk ? '#0d2818' : '#2d2008';
            return (
              <Grid item xs={6} md={4} key={kpi.kpiCd}>
                <Card sx={{ backgroundColor: '#161b22', color: '#c9d1d9', border: '1px solid', borderColor: '#30363d' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" sx={{ color: '#7d8590' }}>{kpi.kpiNm}</Typography>
                      <Chip size="small" label={isOk ? 'OK' : 'WARN'} sx={{ backgroundColor: trendBg, color: trendColor, fontWeight: 700 }} />
                    </Stack>
                    <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mt: 1 }}>
                      <Typography variant="h2" sx={{ fontWeight: 700, color: trendColor, fontFamily: 'monospace' }}>
                        {kpi.value.toLocaleString()}
                      </Typography>
                      <Typography sx={{ color: '#7d8590', fontSize: 18 }}>{kpi.unit}</Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: '#7d8590' }}>목표 {kpi.target}{kpi.unit}</Typography>
                    <Box sx={{ mt: 1 }}>
                      <Sparkline data={WEEK_BUCKETS.map((w, j) => FORECAST_TS[i % FORECAST_TS.length][w])} color={trendColor} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Card sx={{ mt: 1.5, backgroundColor: '#161b22', color: '#c9d1d9', border: '1px solid', borderColor: '#30363d' }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ color: '#c9d1d9', mb: 1 }}>실시간 알람</Typography>
            <Stack spacing={1}>
              {ALERTS.map((a) => (
                <Stack key={a.id} direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{
                    width: 28, height: 28, fontSize: 12, fontWeight: 700,
                    backgroundColor: a.severity === 'CRITICAL' ? '#da3633' : (a.severity === 'WARNING' ? '#9e6a03' : '#1f6feb'),
                  }}>{a.severity[0]}</Avatar>
                  <Typography sx={{ flex: 1, color: '#c9d1d9' }}>{a.message}</Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: 12, color: '#7d8590' }}>{a.dttm}</Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}

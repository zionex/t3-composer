import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Chip, Grid } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

import MockShell from '../_shared/MockShell';

// 12개월 매출 (백만원)
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const CY_SALES = [820, 855, 890, 920, 955, 980, 1010, 1040, 1075, 1100, 1130, 1170];
const PY_SALES = [780, 800, 825, 860, 905, 920, 950, 975, 990, 1020, 1050, 1075];

// 제품군 별 성장률
const GROUP_GROWTH = [
  { grp: 'CAMERA',  cy: 412, py: 320, color: '#2a9d8f' },
  { grp: 'BATTERY', cy: 385, py: 340, color: '#fa7d5b' },
  { grp: 'LED',     cy: 295, py: 290, color: '#5281b3' },
  { grp: 'DISPLAY', cy: 268, py: 245, color: '#8b5cf6' },
];

function DualBarChart({ months, cy, py, height = 220 }) {
  const max = Math.max(...cy, ...py) * 1.1;
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', height, gap: 0.5, mt: 1 }}>
      {months.map((m, i) => (
        <Stack key={m} flex={1} alignItems="center" justifyContent="flex-end" spacing={0.5}>
          <Stack direction="row" alignItems="flex-end" sx={{ height: '88%', width: '90%', gap: 0.25 }}>
            <Box sx={{ flex: 1, height: `${(py[i] / max) * 100}%`, bgcolor: '#94a3b8', borderRadius: 0.5 }} />
            <Box sx={{ flex: 1, height: `${(cy[i] / max) * 100}%`, bgcolor: '#5281b3', borderRadius: 0.5 }} />
          </Stack>
          <Typography sx={{ fontSize: 9, color: 'text.secondary' }}>{m}</Typography>
        </Stack>
      ))}
    </Box>
  );
}

export default function DashSalesGrowthMockup() {
  const totalCY = CY_SALES.reduce((s, v) => s + v, 0);
  const totalPY = PY_SALES.reduce((s, v) => s + v, 0);
  const yoyPct = ((totalCY - totalPY) / totalPY * 100).toFixed(1);

  return (
    <MockShell
      patternCode="dash_sales_growth"
      patternLabel="Sales Growth — 매출 성장률"
      layoutCategory="LAYOUT_DASHBOARD"
      description="전년 대비 매출 성장률 + 바 차트"
    >
      <Box sx={{ p: 2 }}>
        <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
          <Grid item xs={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">CY 매출 (YTD)</Typography>
                <Typography sx={{ fontSize: 30, fontWeight: 700 }}>₩{(totalCY).toLocaleString()}M</Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <TrendingUpIcon fontSize="small" sx={{ color: 'success.main', fontSize: 16 }} />
                  <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>+{yoyPct}% YoY</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">PY 매출 (YTD)</Typography>
                <Typography sx={{ fontSize: 30, fontWeight: 700 }}>₩{(totalPY).toLocaleString()}M</Typography>
                <Typography variant="caption" color="text.secondary">동기 대비 기준선</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">최고 성장 제품군</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>CAMERA</Typography>
                <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>+28.8% YoY</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">최저 성장 제품군</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>LED</Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <TrendingUpIcon fontSize="small" sx={{ color: 'warning.main', fontSize: 16 }} />
                  <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 600 }}>+1.7% YoY</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={1.5}>
          <Grid item xs={12} md={8}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>월별 매출 — CY vs PY</Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip size="small" label="PY" sx={{ bgcolor: '#94a3b8', color: 'white', fontSize: 10 }} />
                    <Chip size="small" label="CY" sx={{ bgcolor: '#5281b3', color: 'white', fontSize: 10 }} />
                  </Stack>
                </Stack>
                <DualBarChart months={MONTHS} cy={CY_SALES} py={PY_SALES} />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>제품군 별 YoY</Typography>
                <Stack spacing={1.5}>
                  {GROUP_GROWTH.map((g) => {
                    const pct = ((g.cy - g.py) / g.py * 100).toFixed(1);
                    const up = g.cy > g.py;
                    return (
                      <Box key={g.grp}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{g.grp}</Typography>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            {up ? (
                              <TrendingUpIcon fontSize="small" sx={{ color: 'success.main', fontSize: 14 }} />
                            ) : (
                              <TrendingDownIcon fontSize="small" sx={{ color: 'error.main', fontSize: 14 }} />
                            )}
                            <Typography variant="caption" sx={{ color: up ? 'success.main' : 'error.main', fontWeight: 600 }}>
                              {up ? '+' : ''}{pct}%
                            </Typography>
                          </Stack>
                        </Stack>
                        <Box sx={{ position: 'relative', height: 8, bgcolor: 'grey.100', borderRadius: 0.5 }}>
                          <Box sx={{ position: 'absolute', inset: 0, width: `${Math.min(parseFloat(pct) * 3, 100)}%`, bgcolor: g.color, borderRadius: 0.5 }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          ₩{g.cy}M / ₩{g.py}M
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MockShell>
  );
}

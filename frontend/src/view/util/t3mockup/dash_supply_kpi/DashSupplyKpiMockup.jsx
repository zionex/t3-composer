import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Chip, Grid, LinearProgress } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';

import MockShell from '../_shared/MockShell';

const SUPPLY_KPI = [
  { name: 'MP 비변경율',      value: 92.4, unit: '%', target: 90.0, trend: 'up',   delta: '+2.4pt',  desc: '확정 이후 MP 변경 발생 비율의 보수' },
  { name: 'MP-FP 일치율',     value: 88.7, unit: '%', target: 90.0, trend: 'down', delta: '−1.3pt',  desc: 'MP 계획 ↔ FP 결과 매칭율' },
  { name: 'PO 변경율',         value: 4.8,  unit: '%', target: 5.0,  trend: 'down', delta: '−0.5pt',  desc: '발주 PO 의 수량/일정 변경 비율',     reverseGood: true },
  { name: '계획 수행률',       value: 96.2, unit: '%', target: 95.0, trend: 'up',   delta: '+1.2pt',  desc: '계획 대비 실적 달성' },
  { name: '제품 부족 거점',    value: 3,    unit: '개', target: 5,    trend: 'down', delta: '−2',      desc: '안전재고 30% 이하 거점',              reverseGood: true },
  { name: '평균 리드타임',     value: 14.2, unit: 'days', target: 14.0, trend: 'up', delta: '+0.2',   desc: 'PO 발행 → 입고 평균',                  reverseGood: true },
];

const SCOPE_CHIPS = [
  { label: 'Plan: M+3', color: 'primary' },
  { label: 'Version: MP_V20260415', color: 'default' },
  { label: 'Site: ALL', color: 'default' },
];

export default function DashSupplyKpiMockup() {
  return (
    <MockShell
      patternCode="dash_supply_kpi"
      patternLabel="Supply Plan KPI — 공급계획"
      layoutCategory="LAYOUT_DASHBOARD"
      description="MP 변경율 · MP/FP 일치율 등 KPI 카드 6개 (UI_SA_SUPPLY_PLAN_KPI)"
    >
      <Box sx={{ p: 2 }}>
        {/* Scope 표시 */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <FilterAltOutlinedIcon fontSize="small" color="action" />
          {SCOPE_CHIPS.map((s) => (
            <Chip key={s.label} size="small" label={s.label} color={s.color} variant={s.color === 'default' ? 'outlined' : 'filled'} />
          ))}
        </Stack>

        <Grid container spacing={1.5}>
          {SUPPLY_KPI.map((k) => {
            const isGood = k.reverseGood ? k.trend === 'down' : k.trend === 'up';
            const deltaColor = isGood ? 'success.main' : 'error.main';
            const Icon = k.trend === 'up' ? TrendingUpIcon : TrendingDownIcon;
            const ratio = Math.min((k.value / k.target) * 100, 100);
            return (
              <Grid item xs={12} sm={6} md={4} key={k.name}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>{k.name}</Typography>
                    <Stack direction="row" alignItems="baseline" spacing={0.5}>
                      <Typography sx={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
                        {typeof k.value === 'number' && Number.isInteger(k.value) ? k.value : k.value.toFixed(1)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{k.unit}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.75 }}>
                      <Icon fontSize="small" sx={{ color: deltaColor, fontSize: 16 }} />
                      <Typography variant="caption" sx={{ color: deltaColor, fontWeight: 600 }}>{k.delta}</Typography>
                      <Typography variant="caption" color="text.secondary">vs 목표 {k.target}{k.unit}</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={ratio}
                      color={isGood ? 'success' : 'warning'}
                      sx={{ mt: 1, height: 5, borderRadius: 0.5 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {k.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </MockShell>
  );
}

import React, { useState } from 'react';
import { Box, Stack, Chip, Typography, Paper, Tabs, Tab, Avatar } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import MockShell from '../../_shared/MockShell';

// PLANNEL Dashboards — Dashboard / DpDashboard / RpDashboard / IPDashboard 4개
// LAYOUT_DASHBOARD — Tab 형식 통합 대시보드 (전체/DP/RP/IP)

const INTEGRATED_KPIS = [
  { icon: TrendingUpIcon,   label: '월간 매출',   value: '14.2B', sub: 'KRW · +8.4%',     color: 'success' },
  { icon: TrendingUpIcon,   label: '예측 정확도', value: '87.3%', sub: '+0.5%p',          color: 'success' },
  { icon: TrendingDownIcon, label: '재고 가치',   value: '24.8B', sub: '-6.8% (best)',    color: 'success' },
  { icon: TrendingUpIcon,   label: 'Fill Rate',  value: '94.2%', sub: '+0.8%p',          color: 'success' },
  { icon: TrendingDownIcon, label: 'Stockout',   value: '23',    sub: '품목 · -12 vs PM', color: 'success' },
];

const MODULE_OVERVIEW = [
  { module: 'DP (Demand Plan)',         status: 'on-track', metric: '87.3%', label: 'Accuracy' },
  { module: 'RP (Replenishment)',       status: 'on-track', metric: '94.2%', label: 'Fill Rate' },
  { module: 'MP (Master Plan)',         status: 'attention',metric: '108%',  label: 'Capacity (WC-K01)' },
  { module: 'IP (Inventory)',           status: 'on-track', metric: '24.8B', label: 'Total Value' },
];

const statusColor = (s) => s === 'on-track' ? 'success' : 'warning';

const DASH_TAB_LABELS = ['Integrated', 'DP', 'RP', 'IP'];

export default function DashboardsMockup() {
  const [tab, setTab] = useState(0);
  return (
    <MockShell
      patternCode="plannel_dashboards"
      patternLabel="PlaNEL — 통합 대시보드 (Integrated / DP / RP / IP Dashboards)"
      layoutCategory="LAYOUT_DASHBOARD"
      description="Tab 전환 통합 대시보드. 전체 KPI + 모듈별 (DP/RP/IP) 상태."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" alignItems="center">
          <DashboardIcon color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, ml: 1 }}>PlaNEL Executive Dashboard — {DASH_TAB_LABELS[tab]}</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            {DASH_TAB_LABELS.map((l) => <Tab key={l} label={l} />)}
          </Tabs>
        </Stack>
      </Box>

      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
          {INTEGRATED_KPIS.map((k) => {
            const Icon = k.icon;
            return (
              <Paper key={k.label} elevation={1} sx={{ flex: 1, p: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Icon color={k.color} sx={{ fontSize: 16 }} />
                  <Typography variant="caption" color="text.secondary">{k.label}</Typography>
                </Stack>
                <Typography variant="h5" sx={{ fontWeight: 700, color: `${k.color}.main`, my: 0.3 }}>{k.value}</Typography>
                <Typography variant="caption" color="text.secondary">{k.sub}</Typography>
              </Paper>
            );
          })}
        </Stack>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>SCM 모듈 상태</Typography>
          <Stack direction="row" spacing={2}>
            {MODULE_OVERVIEW.map((m) => (
              <Paper key={m.module} elevation={0} sx={{ flex: 1, p: 2, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: `${statusColor(m.status)}.main`, fontSize: 11, fontWeight: 700 }}>
                    {m.module.charAt(0)}
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12 }}>{m.module}</Typography>
                </Stack>
                <Chip label={m.status.toUpperCase()} size="small" color={statusColor(m.status)} sx={{ mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{m.metric}</Typography>
                <Typography variant="caption" color="text.secondary">{m.label}</Typography>
              </Paper>
            ))}
          </Stack>
        </Paper>

        <Stack direction="row" spacing={2}>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>주요 알림</Typography>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1}><Chip label="ERROR" size="small" color="error" />
                <Typography variant="body2" sx={{ fontSize: 12 }}>WC-K01 부하율 108% (W34)</Typography></Stack>
              <Stack direction="row" spacing={1}><Chip label="WARN" size="small" color="warning" />
                <Typography variant="body2" sx={{ fontSize: 12 }}>PCB Board v3 안전재고 미달 (W34)</Typography></Stack>
              <Stack direction="row" spacing={1}><Chip label="WARN" size="small" color="warning" />
                <Typography variant="body2" sx={{ fontSize: 12 }}>MP 엔진 실행 실패 (05-26 05:00)</Typography></Stack>
            </Stack>
          </Paper>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>주요 진행</Typography>
            <Stack spacing={1}>
              <Typography variant="body2" sx={{ fontSize: 12 }}>✓ 2026 Q2 DP cycle Step 3/5 (62%)</Typography>
              <Typography variant="body2" sx={{ fontSize: 12 }}>✓ RP 결재 24건 / 12건 대기</Typography>
              <Typography variant="body2" sx={{ fontSize: 12 }}>✓ IP S1+S2 시뮬 추천 — Fill 96.8% 달성 가능</Typography>
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </MockShell>
  );
}

import React from 'react';
import { Box, Stack, Chip, Typography, Paper, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import MockShell from '../../_shared/MockShell';

// PLANNEL DP 상태 모니터링 — DpStatusDashboard 1개
// LAYOUT_H2 — 좌측 status list (alert) + 우측 KPI grid

const STATUS_ITEMS = [
  { sev: 'error',   icon: ErrorIcon,       msg: 'PCB Board v3 — 예측 변동률 +35% (임계 초과)', time: '5분 전' },
  { sev: 'warning', icon: WarningIcon,     msg: 'LED Module 80W — 결재 SLA 2시간 남음',          time: '23분 전' },
  { sev: 'warning', icon: WarningIcon,     msg: 'Aluminum HS — 학습 데이터 누락 (12개 기간)',     time: '1시간 전' },
  { sev: 'info',    icon: InfoIcon,        msg: 'BF Engine — 정기 재학습 완료',                  time: '2시간 전' },
  { sev: 'success', icon: CheckCircleIcon, msg: 'V2026.05.01 Baseline — 결재 완료',              time: '3시간 전' },
];

const KPIS = [
  { label: '대상 Item',         value: '1,247', sub: '활성' },
  { label: '예측 정확도 (M-1)', value: '87.3%', sub: '+0.5%p' },
  { label: '결재 대기',         value: '12',    sub: '+3' },
  { label: '오늘 Alert',        value: '8',     sub: '오류 1' },
  { label: '검토 완료',         value: '128',   sub: '주간' },
  { label: 'Cycle 진척률',      value: '62%',   sub: 'Step 3/5' },
];

export default function DpMonitoringMockup() {
  return (
    <MockShell
      patternCode="plannel_dp_monitoring"
      patternLabel="PlaNEL — DP 상태 모니터링 (DP Status Dashboard)"
      layoutCategory="LAYOUT_H2"
      description="좌측 실시간 alert/status list + 우측 KPI grid. DP 운영 현황 한눈에."
    >
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Box sx={{ width: '42%', borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" sx={{ p: 1.5, backgroundColor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>실시간 Alert</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Chip label="1 오류 · 2 경고 · 2 정보" size="small" color="warning" />
          </Stack>
          <List dense sx={{ flex: 1, overflow: 'auto' }}>
            {STATUS_ITEMS.map((s, idx) => {
              const Icon = s.icon;
              return (
                <React.Fragment key={idx}>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Icon color={s.sev} fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="body2">{s.msg}</Typography>}
                      secondary={s.time}
                      secondaryTypographyProps={{ fontSize: 11 }}
                    />
                  </ListItem>
                  {idx < STATUS_ITEMS.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        </Box>

        <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>DP 운영 KPI</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            {KPIS.map((k) => (
              <Paper key={k.label} elevation={0} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">{k.label}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, my: 0.3 }}>{k.value}</Typography>
                <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>{k.sub}</Typography>
              </Paper>
            ))}
          </Box>
        </Box>
      </Box>
    </MockShell>
  );
}

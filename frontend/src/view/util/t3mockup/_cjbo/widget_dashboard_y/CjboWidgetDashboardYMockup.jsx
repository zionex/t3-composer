import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Avatar, LinearProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GroupsIcon from '@mui/icons-material/Groups';
import MockShell from '../../_shared/MockShell';

// CJBO — 연간 계획/실적 위젯 대시보드
// DpPlanStatusY, DpYearActualSales, DpYearTargetSales, ForecastPlan, PlanProgress,
// PlanStatus, SalesAlerts, SalesPlanDistribution, SalesProgress, SupplySufRate, TeamSalesPlan

const KPIS = [
  { label: '연 계획',     value: '2,650억', sub: '2026 OP V06',     color: 'primary',   Icon: AssessmentIcon },
  { label: '연 누계 실적', value: '821.3억',  sub: '6월말 / 31.0%',  color: 'info',      Icon: TrendingUpIcon },
  { label: '연 진척률',   value: '94.2%',   sub: '월할 대비',       color: 'success',   Icon: AssessmentIcon },
  { label: '팀 알림',     value: '12',      sub: '오늘',            color: 'warning',   Icon: NotificationsActiveIcon },
];

const TEAM = [
  { team: '영업1팀',  plan: 320, actual: 312, progress: 97.5 },
  { team: '영업2팀',  plan: 285, actual: 268, progress: 94.0 },
  { team: '영업3팀',  plan: 215, actual: 198, progress: 92.1 },
  { team: 'NGP팀',    plan: 180, actual: 168, progress: 93.3 },
  { team: '동남아',   plan: 425, actual: 360, progress: 84.7 },
  { team: '동북아',   plan: 285, actual: 282, progress: 99.0 },
  { team: '미주',     plan: 195, actual: 138, progress: 70.8 },
];

const ALERTS = [
  { level: 'error',   team: '미주',    msg: '진척률 70.8% (목표 95% 미달)' },
  { level: 'error',   team: '동남아',  msg: 'NGP Device 30% 감소 트렌드' },
  { level: 'warning', team: '영업3팀', msg: 'illuvia 토너 2개월 연속 감소' },
  { level: 'warning', team: '동북아',  msg: '환율 변동 (-3.2%) 영향 모니터' },
  { level: 'info',    team: 'NGP팀',   msg: '신제품 illuvia 토너 200ml 런칭' },
];

function DonutChart({ percent, color, size = 84 }) {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - percent / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={8} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 4} fill="#1e293b" fontSize={16} fontWeight={700} textAnchor="middle">
        {percent.toFixed(0)}%
      </text>
    </svg>
  );
}

function MiniLine({ data, color }) {
  const W = 200, H = 60;
  const max = Math.max(...data), min = Math.min(...data);
  const xStep = W / (data.length - 1);
  const yScale = (v) => H - 4 - ((v - min) / (max - min)) * (H - 8);
  const d = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * xStep} ${yScale(v)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 60 }}>
      <path d={d} fill="none" stroke={color} strokeWidth={2} />
      {data.map((v, i) => (
        <circle key={i} cx={i * xStep} cy={yScale(v)} r={2} fill={color} />
      ))}
    </svg>
  );
}

const ALERT_COLOR = { error: 'error', warning: 'warning', info: 'info' };

export default function CjboWidgetDashboardYMockup() {
  return (
    <MockShell patternCode="cjbo_widget_dashboard_y" patternLabel="CJBO — 연간 계획·실적 위젯 대시보드 (DpPlanStatusY 등 14종)"
      layoutCategory="LAYOUT_SINGLE"
      description="연간 계획 대비 실적 + 팀별 진척 + 알림 + 시계열 위젯 통합. DpPlanStatusY / DpYearActualSales / DpYearTargetSales / 진척 위젯 14종.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField label="연도" size="small" value="2026" sx={{ width: 100 }} />
          <TextField label="범위" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전사</MenuItem><MenuItem value="DOM">국내</MenuItem><MenuItem value="EXP">해외</MenuItem>
          </TextField>
          <TextField label="조회월" size="small" value="2026-06" sx={{ width: 130 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        <Stack direction="row" spacing={1.5}>
          {KPIS.map((k) => {
            const Icon = k.Icon;
            return (
              <Paper key={k.label} variant="outlined" sx={{ p: 1.5, flex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar sx={{ backgroundColor: `${k.color}.light`, color: `${k.color}.dark`, width: 44, height: 44 }}>
                    <Icon />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">{k.label}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: `${k.color}.main` }}>{k.value}</Typography>
                    <Typography variant="caption" color="text.secondary">{k.sub}</Typography>
                  </Box>
                </Stack>
              </Paper>
            );
          })}
        </Stack>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Paper variant="outlined" sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>연 진척률 (DpPlanStatusY)</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Chip size="small" label="목표 95%" variant="outlined" />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={3} sx={{ flex: 1 }}>
              <DonutChart percent={94.2} color="#10b981" size={130} />
              <Box>
                <Typography variant="caption" color="text.secondary">월할 계획 대비 진척</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>94.2%</Typography>
                <Typography variant="caption">실적 821.3억 / 월할 871.3억</Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>월별 실적 추이 (DpYearActualSales)</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Chip size="small" label="VS 전년" variant="outlined" />
            </Stack>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <MiniLine data={[125, 132, 138, 142, 145, 148, 152, 158, 162, 168, 172, 175]} color="#1976d2" />
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">1월</Typography>
                <Typography variant="caption" color="text.secondary">12월</Typography>
              </Stack>
            </Box>
            <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
              <Box><Typography variant="caption" color="text.secondary">1월</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>125억</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">6월</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>148억</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">12월 예상</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>175억</Typography></Box>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <NotificationsActiveIcon fontSize="small" color="warning" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>알림 (SalesAlerts)</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Chip size="small" label={`${ALERTS.length}건`} color="warning" />
            </Stack>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {ALERTS.map((a, i) => (
                <Box key={i} sx={{ py: 0.5, borderBottom: '1px dashed', borderColor: 'divider' }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Chip size="small" label={a.team} color={ALERT_COLOR[a.level]} variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                    <Typography variant="caption" sx={{ flex: 1, fontSize: 12 }}>{a.msg}</Typography>
                  </Stack>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <GroupsIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>팀별 계획-실적 진척 (TeamSalesPlan / SalesProgress)</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="caption" color="text.secondary">단위: 억 KRW</Typography>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 1 }}>
            {TEAM.map((t) => {
              const color = t.progress >= 95 ? 'success' : t.progress >= 85 ? 'info' : t.progress >= 75 ? 'warning' : 'error';
              return (
                <Box key={t.team} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, flex: 1 }}>{t.team}</Typography>
                    <Chip size="small" label={`${t.progress.toFixed(1)}%`} color={color} sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
                  </Stack>
                  <LinearProgress variant="determinate" value={t.progress} color={color} sx={{ height: 6, borderRadius: 1, mb: 0.5 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{t.actual}억</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>/ {t.plan}억</Typography>
                  </Stack>
                </Box>
              );
            })}
          </Box>
        </Paper>
      </Box>
    </MockShell>
  );
}

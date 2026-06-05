import React from 'react';
import {
  Box, Stack, Typography, Paper, Chip, LinearProgress, Slider, Stepper, Step, StepLabel, Avatar,
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import ReportIcon from '@mui/icons-material/Report';
import CheckIcon from '@mui/icons-material/Check';
import MockShell from '../../_shared/MockShell';

// CJBO — DP 연간/계획 위젯 12종 (대시보드 합본)
// 소스 기반 재작성.
// path: view/demandplan/widgets/{dpplanstatusy,dpyearactualsales,dpyeartargetsales,forecastplan,planprogress,planstatus,salesalerts,salesplandistribution,salesprogress,supplysufrate,teamsalesplan,accuracy}/*.jsx
// 모두 common/data POST { PROCEDURE_NAME:'SP_UI_SA_SALES_DP', P_VIEW1:'WI_DP_*' } (PlanProgress 만 engine/dp/GetApprovalSteps)
//
// 각 widget 의 정확한 render 타입 (Agent 5 분석):
//   - DpPlanStatusY:     ChartComponent mixed bar+line — 5 datasets (MENU_05_03 line, SALES_PLAN line, ACTUAL_SALES bar, YOY bar, GROWTH_RATE % line on y2)
//   - DpYearActualSales: KPI tile ($ + 24px bold + colored % chip vs last year + WI_DP_OVER_LAST_YEAR)
//   - DpYearTargetSales: KPI tile + thumbless MUI Slider as progress bar
//   - ForecastPlan:      ChartComponent line — BF_MEAS_QTY + DEMAND_PLAN
//   - PlanProgress:      MUI Stepper alternativeLabel + SelfMadeStepIcon (engine/dp/GetApprovalSteps)
//   - PlanStatus:        ChartComponent mixed bar+line — SALES_PLAN line + ACTUAL_SALES bar
//   - SalesAlerts:       Vertical list (ErrorSharp red / ReportProblem warning / Report normal) + count
//   - SalesPlanDistribution: TWO side-by-side doughnut charts (WI_DIST_ITEM_GRP + WI_DIST_SALES_GRP)
//   - SalesProgress:     ChartComponent mixed — TOT_PREDICT_REVENUE bar + SUM_REVENUE bar + PROGRESS_RATE line
//   - SupplySufRate:     ChartComponent mixed — Request line + On Time/Late/Short bars
//   - TeamSalesPlan:     Scrolling list — thumbless MUI Slider (VALUE1 vs UPLEVEL_VALUE) per team
//   - Accuracy:          TWO horizontal Sliders (bfAccuracy MENU_07 + dpAccuracy MENU_05)

// ───── 더미 차트 SVG helpers ─────
function MiniMixedBarLine({ months, bars, lines, height = 100 }) {
  const W = 240, H = height, P = 12;
  const xStep = (W - P * 2) / months.length;
  const allMax = Math.max(...bars.flatMap((b) => b.data), ...lines.flatMap((l) => l.data));
  const yMax = Math.ceil(allMax / 100) * 100;
  const yScale = (v) => H - P - (v / yMax) * (H - P * 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
      {bars.map((b, bi) => (
        b.data.map((v, i) => (
          <rect key={`${b.name}-${i}`} x={P + xStep * i + xStep / 2 - 6} y={yScale(v)} width={10}
            height={Math.max(0, yScale(0) - yScale(v))} fill={b.color} fillOpacity={0.8} />
        ))
      ))}
      {lines.map((l) => {
        const pts = l.data.map((v, i) => `${P + xStep * i + xStep / 2} ${yScale(v)}`).join(' L ');
        return <path key={l.name} d={`M ${pts}`} fill="none" stroke={l.color} strokeWidth={2}
          strokeDasharray={l.dash ? '4 2' : undefined} />;
      })}
    </svg>
  );
}

function MiniLine({ data, color, height = 80 }) {
  const W = 240, H = height, P = 8;
  const xStep = (W - P * 2) / (data.length - 1);
  const yMax = Math.max(...data) * 1.1;
  const yScale = (v) => H - P - (v / yMax) * (H - P * 2);
  const pts = data.map((v, i) => `${P + xStep * i} ${yScale(v)}`).join(' L ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
      <path d={`M ${pts}`} fill="none" stroke={color} strokeWidth={2} />
      {data.map((v, i) => (
        <circle key={i} cx={P + xStep * i} cy={yScale(v)} r={2.5} fill={color} />
      ))}
    </svg>
  );
}

function Donut({ segments, size = 100 }) {
  const r = (size - 12) / 2;
  const total = segments.reduce((s, x) => s + x.v, 0);
  let cum = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      {segments.map((seg) => {
        const startA = (cum / total) * 2 * Math.PI - Math.PI / 2;
        const endA = ((cum + seg.v) / total) * 2 * Math.PI - Math.PI / 2;
        cum += seg.v;
        const x1 = size / 2 + r * Math.cos(startA), y1 = size / 2 + r * Math.sin(startA);
        const x2 = size / 2 + r * Math.cos(endA), y2 = size / 2 + r * Math.sin(endA);
        const largeArc = seg.v / total > 0.5 ? 1 : 0;
        return <path key={seg.label} d={`M ${size / 2} ${size / 2} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
          fill={seg.color} stroke="white" strokeWidth={1} />;
      })}
      <circle cx={size / 2} cy={size / 2} r={r * 0.55} fill="white" />
    </svg>
  );
}

const PLAN_PROGRESS_STEPS = ['담당자 입력(5/5)', '팀장 검토(3/3)', '본부장 승인(1/2)', '버전 종료(0/1)'];
const SALES_ALERTS = [
  { level: 'error',   icon: ErrorIcon,         CATEGORY1: 'AMT_PLAN_LOW',         VALUE1: 3, color: '#d32f2f' },
  { level: 'warning', icon: ReportProblemIcon, CATEGORY1: 'ITEM_PRC_CHANGED',     VALUE1: 5, color: '#f57c00' },
  { level: 'warning', icon: ReportProblemIcon, CATEGORY1: 'ACCOUNT_INACTIVE',     VALUE1: 2, color: '#f57c00' },
  { level: 'info',    icon: ReportIcon,        CATEGORY1: 'BF_DEMAND_NEW',         VALUE1: 8, color: '#ed6c02' },
];

const TEAMS = [
  { LABEL: 'AN 한국 내수',  VALUE1: 12500, UPLEVEL_VALUE: 14000 },
  { LABEL: 'AN 한국 수출',  VALUE1: 18200, UPLEVEL_VALUE: 18000 },
  { LABEL: 'AN 베트남',      VALUE1: 15800, UPLEVEL_VALUE: 16500 },
  { LABEL: 'AN 미국',         VALUE1: 28400, UPLEVEL_VALUE: 25000 },
  { LABEL: 'AN 브라질',       VALUE1:  9800, UPLEVEL_VALUE: 12000 },
  { LABEL: 'TN 전체',         VALUE1: 22500, UPLEVEL_VALUE: 24000 },
  { LABEL: 'BMS 전체',        VALUE1:  8200, UPLEVEL_VALUE:  9500 },
];

function W({ title, children, height }) {
  return (
    <Paper variant="outlined" sx={{ p: 1, height: height || 'auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5 }}>{title}</Typography>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>{children}</Box>
    </Paper>
  );
}

export default function CjboWidgetDashboardYMockup() {
  return (
    <MockShell patternCode="cjbo_widget_dashboard_y"
      patternLabel="CJBO — DP 연간 위젯 12종 대시보드"
      layoutCategory="LAYOUT_SINGLE"
      description="DP 연간 계획 대시보드 — KPI · 차트 · 슬라이더 · 스텝퍼 · 도넛 12개 위젯 구성.">

      <Box sx={{ p: 1.5, flex: 1, overflow: 'auto', backgroundColor: '#f5f5f7' }}>
        {/* Row 1: KPI 위젯 3개 (Year sales) */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 1.5 }}>
          <W title="① 연간 누계 매출">
            <Typography variant="caption" color="text.secondary">2026 누계 매출 ($)</Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#1976d2' }}>$ 142,580K</Typography>
            <Chip size="small" label="+12.5% WI_DP_OVER_LAST_YEAR" color="success" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
          </W>
          <W title="② 연간 목표 매출 달성률">
            <Typography variant="caption" color="text.secondary">2026 목표 달성률</Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>$ 142,580K / $180,000K</Typography>
            <Slider value={79} disabled sx={{ '& .MuiSlider-thumb': { display: 'none' }, color: '#10b981' }} />
            <Typography variant="caption" sx={{ fontFamily: 'monospace', textAlign: 'right' }}>79.2%</Typography>
          </W>
          <W title="③ 정확도">
            <Typography variant="caption">MENU_07 (BF Accuracy)</Typography>
            <Slider value={86} disabled marks valueLabelDisplay="on" sx={{ color: '#10b981' }} />
            <Typography variant="caption" sx={{ mt: 1 }}>MENU_05 (DP Accuracy)</Typography>
            <Slider value={92} disabled marks valueLabelDisplay="on" sx={{ color: '#1976d2' }} />
          </W>
          <W title="④ 매출 알림">
            <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5 }}>WI_TOTAL_ALERT : <b>18</b> CASE</Typography>
            <Stack spacing={0.25} sx={{ overflow: 'auto', flex: 1 }}>
              {SALES_ALERTS.map((a) => {
                const Icon = a.icon;
                return (
                  <Stack key={a.CATEGORY1} direction="row" alignItems="center" spacing={0.5}>
                    <Icon fontSize="small" sx={{ color: a.color }} />
                    <Typography variant="caption" sx={{ flex: 1, fontSize: 11 }}>{a.CATEGORY1}</Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{a.VALUE1} CASE</Typography>
                  </Stack>
                );
              })}
            </Stack>
          </W>
        </Box>

        {/* Row 2: Charts (status, forecast, plan-status, supply-suf) */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 1.5 }}>
          <W title="⑤ 연간 계획 현황" height={160}>
            <Stack direction="row" spacing={0.5} sx={{ mb: 0.5 }}>
              <Chip size="small" label="MENU_05_03" sx={{ height: 14, fontSize: 9, backgroundColor: '#ef4444', color: 'white' }} />
              <Chip size="small" label="SALES_PLAN" sx={{ height: 14, fontSize: 9, backgroundColor: '#1976d2', color: 'white' }} />
              <Chip size="small" label="ACTUAL_SALES" sx={{ height: 14, fontSize: 9, backgroundColor: '#fbbf24' }} />
              <Chip size="small" label="YOY" sx={{ height: 14, fontSize: 9, backgroundColor: '#10b981', color: 'white' }} />
              <Chip size="small" label="%" sx={{ height: 14, fontSize: 9, backgroundColor: '#9ca3af', color: 'white' }} />
            </Stack>
            <Box sx={{ flex: 1 }}>
              <MiniMixedBarLine
                months={['1','2','3','4','5','6']}
                bars={[
                  { name: 'ACTUAL', color: '#fbbf24', data: [80, 90, 100, 110, 105, 120] },
                  { name: 'YOY',    color: '#10b981', data: [70, 80,  90, 100,  95, 110] },
                ]}
                lines={[
                  { name: 'PLAN',   color: '#1976d2', data: [90, 95, 105, 115, 110, 125] },
                  { name: 'TARGET', color: '#ef4444', data: [85, 95, 100, 110, 105, 120] },
                  { name: 'GROWTH', color: '#9ca3af', data: [50, 60,  65,  75,  72,  80], dash: true },
                ]}
                height={110}
              />
            </Box>
          </W>
          <W title="⑥ 예측·수요계획" height={160}>
            <Stack direction="row" spacing={0.5} sx={{ mb: 0.5 }}>
              <Chip size="small" label="BF_MEAS_QTY" sx={{ height: 14, fontSize: 9, backgroundColor: '#fbbf24' }} />
              <Chip size="small" label="DEMAND_PLAN" sx={{ height: 14, fontSize: 9, backgroundColor: '#1976d2', color: 'white' }} />
            </Stack>
            <Box sx={{ flex: 1 }}>
              <MiniLine data={[1200, 1280, 1350, 1420, 1500, 1580]} color="#1976d2" height={110} />
            </Box>
          </W>
          <W title="⑦ 계획 현황" height={160}>
            <Stack direction="row" spacing={0.5} sx={{ mb: 0.5 }}>
              <Chip size="small" label="SALES_PLAN (line)" sx={{ height: 14, fontSize: 9, backgroundColor: '#1976d2', color: 'white' }} />
              <Chip size="small" label="ACTUAL_SALES (bar)" sx={{ height: 14, fontSize: 9, backgroundColor: '#fbbf24' }} />
            </Stack>
            <Box sx={{ flex: 1 }}>
              <MiniMixedBarLine
                months={['1','2','3','4','5','6']}
                bars={[{ name: 'ACT', color: '#fbbf24', data: [85, 92, 100, 108, 115, 120] }]}
                lines={[{ name: 'PLAN', color: '#1976d2', data: [90, 95, 102, 110, 118, 125] }]}
                height={110}
              />
            </Box>
          </W>
          <W title="⑧ 공급 충족률" height={160}>
            <Stack direction="row" spacing={0.5} sx={{ mb: 0.5 }}>
              <Chip size="small" label="Request (line)" sx={{ height: 14, fontSize: 9, backgroundColor: '#1976d2', color: 'white' }} />
              <Chip size="small" label="On Time" sx={{ height: 14, fontSize: 9, backgroundColor: '#10b981', color: 'white' }} />
              <Chip size="small" label="Late" sx={{ height: 14, fontSize: 9, backgroundColor: '#fbbf24' }} />
              <Chip size="small" label="Short" sx={{ height: 14, fontSize: 9, backgroundColor: '#ef4444', color: 'white' }} />
            </Stack>
            <Box sx={{ flex: 1 }}>
              <MiniMixedBarLine
                months={['1','2','3','4','5','6']}
                bars={[
                  { name: 'OT',    color: '#10b981', data: [85, 88, 90, 92, 95, 93] },
                  { name: 'Late',  color: '#fbbf24', data: [10, 8,  6,  5,  3,  4] },
                  { name: 'Short', color: '#ef4444', data: [5,  4,  4,  3,  2,  3] },
                ]}
                lines={[{ name: 'Req', color: '#1976d2', data: [100, 100, 100, 100, 100, 100] }]}
                height={110}
              />
            </Box>
          </W>
        </Box>

        {/* Row 3: Distribution doughnuts + Progress (Stepper + Sales Progress) */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 2fr 3fr', gap: 1.5, mb: 1.5 }}>
          <W title="⑨ 매출 계획 분포" height={180}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="caption">WI_DIST_ITEM_GRP</Typography>
                <Donut size={100} segments={[
                  { label: 'Lysine',     v: 42, color: '#1976d2' },
                  { label: 'Methionine', v: 28, color: '#10b981' },
                  { label: 'Tryptophan', v: 18, color: '#fbbf24' },
                  { label: '기타',        v: 12, color: '#9ca3af' },
                ]} />
              </Box>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="caption">WI_DIST_SALES_GRP</Typography>
                <Donut size={100} segments={[
                  { label: 'AN',  v: 68, color: '#1976d2' },
                  { label: 'TN',  v: 22, color: '#10b981' },
                  { label: 'BMS', v: 10, color: '#fbbf24' },
                ]} />
              </Box>
            </Stack>
          </W>

          <W title="⑩ 계획 진척도" height={180}>
            <Stepper activeStep={2} alternativeLabel sx={{ '& .MuiStepLabel-iconContainer': { '& .MuiStepIcon-root': { color: '#1976d2' } } }}>
              {PLAN_PROGRESS_STEPS.map((label, i) => (
                <Step key={label} completed={i < 2}>
                  <StepLabel icon={i < 2 ? <Avatar sx={{ width: 22, height: 22, backgroundColor: '#1976d2' }}><CheckIcon sx={{ fontSize: 14 }} /></Avatar>
                    : <Avatar sx={{ width: 22, height: 22, backgroundColor: 'grey.300' }}>·</Avatar>}>
                    <Typography variant="caption">{label}</Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </W>

          <W title="⑪ 월간 매출 진척" height={180}>
            <Stack direction="row" spacing={0.5} sx={{ mb: 0.5 }}>
              <Chip size="small" label="TOT_PREDICT_REVENUE" sx={{ height: 14, fontSize: 9, backgroundColor: '#1976d2', color: 'white' }} />
              <Chip size="small" label="SUM_REVENUE" sx={{ height: 14, fontSize: 9, backgroundColor: '#10b981', color: 'white' }} />
              <Chip size="small" label="PROGRESS_RATE" sx={{ height: 14, fontSize: 9, backgroundColor: '#ef4444', color: 'white' }} />
            </Stack>
            <Box sx={{ flex: 1 }}>
              <MiniMixedBarLine
                months={['Jan','Feb','Mar','Apr','May','Jun']}
                bars={[
                  { name: 'PRED', color: '#1976d2', data: [100, 100, 100, 100, 100, 100] },
                  { name: 'SUM',  color: '#10b981', data: [ 25,  45,  60,  75,  85,  92] },
                ]}
                lines={[{ name: 'RATE', color: '#ef4444', data: [25, 45, 60, 75, 85, 92] }]}
                height={130}
              />
            </Box>
          </W>
        </Box>

        {/* Row 4: TeamSalesPlan list */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.5 }}>
          <W title="⑫ 팀별 매출 계획" height={240}>
            <Stack spacing={0.5} sx={{ overflow: 'auto', flex: 1, pr: 1 }}>
              {TEAMS.map((t) => {
                const pct = (t.VALUE1 / t.UPLEVEL_VALUE) * 100;
                return (
                  <Box key={t.LABEL} sx={{ display: 'grid', gridTemplateColumns: '160px 1fr 100px', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{t.LABEL}</Typography>
                    <Slider value={Math.min(pct, 100)} disabled disableSwap
                      sx={{ '& .MuiSlider-thumb': { display: 'none' }, color: pct >= 100 ? '#10b981' : '#1976d2' }} />
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', textAlign: 'right' }}>
                      ${t.VALUE1.toLocaleString()} / {t.UPLEVEL_VALUE.toLocaleString()}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </W>
        </Box>
      </Box>
    </MockShell>
  );
}

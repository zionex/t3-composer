import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import MockShell from '../_shared/MockShell';
import DashboardPanelMock from '../_shared/DashboardPanelMock';

/**
 * UI_SA_SALES_STATE · 판매 현황 (demandplan/dashboard/SalesBoard)
 *
 * 원본 wingui DashboardPanel + 6 widgets 디자인을 그대로 재현:
 *   1. WI_DP_YEAR_TARGET_SALES   연 판매목표 KPI (AMT/QTY 토글)
 *   2. WI_DP_YEAR_ACTUAL_SALES   총 판매실적 KPI
 *   3. WI_DP_TOP_SALES_ITEM      최다 판매 품목 (1~3위)
 *   4. WI_DP_PLAN_STATUS_Y       판매 현황 — 라인 차트 + 다중 시리즈 체크박스
 *                                (목표계획 · 판매계획 · 성장률% · 판매 실적 · 전년동기)
 *   5. WI_DP_TOP_SALES_ITEMGRP   제품군별 판매 — 라인 차트 (Item Group 1~6)
 *   6. WI_DP_TOP_SALES_ACCOUNT   거래처 — 3분할 (좌 KPI · 중 World Map · 우 거래처 그리드)
 */

// ──────────────────────────────────────────────────────────
// 공용 mini-controls
// ──────────────────────────────────────────────────────────
const SegToggle = ({ left, right, active = 'left' }) => (
  <Stack direction="row" sx={{ border: '1px solid #d1d5db', borderRadius: 0.5, overflow: 'hidden' }}>
    <Box
      sx={{
        px: 0.85, py: 0.15,
        fontSize: 10, fontWeight: 700,
        bgcolor: active === 'left' ? '#2563eb' : '#ffffff',
        color:   active === 'left' ? '#ffffff' : '#6b7280',
      }}
    >
      {left}
    </Box>
    <Box
      sx={{
        px: 0.85, py: 0.15,
        fontSize: 10, fontWeight: 700,
        bgcolor: active === 'right' ? '#2563eb' : '#ffffff',
        color:   active === 'right' ? '#ffffff' : '#6b7280',
        borderLeft: '1px solid #d1d5db',
      }}
    >
      {right}
    </Box>
  </Stack>
);

const CheckboxItem = ({ color, label, checked = true }) => (
  <Stack direction="row" alignItems="center" spacing={0.4}>
    <Box
      sx={{
        width: 12, height: 12, borderRadius: 0.3,
        border: '1.5px solid ' + (checked ? color : '#d1d5db'),
        bgcolor: checked ? color : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 9, fontWeight: 900, lineHeight: 1,
      }}
    >
      {checked && '✓'}
    </Box>
    <Typography sx={{ fontSize: 10.5, color: '#374151' }}>{label}</Typography>
  </Stack>
);

// ──────────────────────────────────────────────────────────
// W1 — 연 판매목표
// ──────────────────────────────────────────────────────────
function W1Content() {
  return (
    <Stack sx={{ p: 1.5, height: '100%', justifyContent: 'space-between' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Typography sx={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>연 판매목표</Typography>
        <SegToggle left="AMT" right="QTY" active="left" />
      </Stack>
      <Stack direction="row" alignItems="baseline" spacing={1}>
        <Typography sx={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: '#1f2937' }}>$32.5B</Typography>
        <Typography sx={{ fontSize: 13, color: '#10b981', fontWeight: 700 }}>+39.7% ↗</Typography>
      </Stack>
      <Typography sx={{ fontSize: 12, color: '#6b7280' }}>판매 달성율</Typography>
    </Stack>
  );
}

// ──────────────────────────────────────────────────────────
// W2 — 총 판매실적
// ──────────────────────────────────────────────────────────
function W2Content() {
  return (
    <Stack sx={{ p: 1.5, height: '100%', justifyContent: 'space-between' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Typography sx={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>총 판매실적</Typography>
        <SegToggle left="AMT" right="QTY" active="left" />
      </Stack>
      <Stack direction="row" alignItems="baseline" spacing={1}>
        <Typography sx={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: '#1f2937' }}>$5M</Typography>
        <Typography sx={{ fontSize: 13, color: '#10b981', fontWeight: 700 }}>+12.8% ↗</Typography>
      </Stack>
      <Typography sx={{ fontSize: 12, color: '#6b7280' }}>전년대비</Typography>
    </Stack>
  );
}

// ──────────────────────────────────────────────────────────
// W3 — 최다 판매 품목 (Top 3)
// ──────────────────────────────────────────────────────────
const TOP_ITEMS = [
  { rank: 1, code: '43140', value: '$269.1M' },
  { rank: 2, code: '41935', value: '$258.7M' },
  { rank: 3, code: '42851', value: '$235.2M' },
];

function W3Content() {
  return (
    <Stack sx={{ p: 1.5, height: '100%', justifyContent: 'space-between' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Typography sx={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>최다 판매 품목</Typography>
        <SegToggle left="AMT" right="QTY" active="left" />
      </Stack>
      <Stack spacing={0.6} sx={{ flex: 1, justifyContent: 'center' }}>
        {TOP_ITEMS.map((t) => (
          <Stack key={t.rank} direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Typography sx={{ fontSize: 13, color: '#5281b3', fontWeight: 700, minWidth: 28 }}>
                {t.rank}위
              </Typography>
              <Typography sx={{ fontSize: 13, fontFamily: 'monospace', color: '#1f2937' }}>
                {t.code}
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>{t.value}</Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

// ──────────────────────────────────────────────────────────
// 다중 시리즈 라인 차트 (2-axis 지원)
// ──────────────────────────────────────────────────────────
function MultiLineSvg({ series, leftMax, rightMax }) {
  const w = 1000, h = 100;
  const n = series[0]?.data.length || 1;
  const dx = w / (n - 1 || 1);
  const yLeft  = (v) => h - (v / (leftMax  || 1)) * (h - 8) - 4;
  const yRight = (v) => h - (v / (rightMax || 1)) * (h - 8) - 4;
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {/* 가로 grid */}
      {[0.2, 0.4, 0.6, 0.8].map((p) => (
        <line key={p} x1={0} x2={w} y1={h * p} y2={h * p}
          stroke="#e5e7eb" strokeDasharray="3 4" strokeWidth={0.5} />
      ))}
      {series.map((s, si) => {
        const yAt = s.axis === 'right' ? yRight : yLeft;
        const pts = s.data.map((v, i) => `${(i * dx).toFixed(1)},${yAt(v).toFixed(1)}`).join(' ');
        return (
          <polyline
            key={si}
            points={pts}
            fill="none"
            stroke={s.color}
            strokeWidth={s.dashed ? 1.5 : 2}
            strokeDasharray={s.dashed ? '5 3' : undefined}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}

function YAxisLabels({ labels, width = 50, align = 'right' }) {
  // 위→아래 순서로 받음
  return (
    <Box
      sx={{
        width, display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', px: 0.5,
        textAlign: align, color: '#94a3b8',
      }}
    >
      {labels.map((t) => (
        <Typography key={t} sx={{ fontSize: 9, lineHeight: 1 }}>{t}</Typography>
      ))}
    </Box>
  );
}

function MonthLabels() {
  return (
    <Stack direction="row" justifyContent="space-around" sx={{ pl: 6, pr: 5, mt: 0.25 }}>
      {['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'].map((m) => (
        <Typography key={m} sx={{ fontSize: 9.5, color: '#6b7280' }}>{m}</Typography>
      ))}
    </Stack>
  );
}

// ──────────────────────────────────────────────────────────
// W4 — 판매 현황 (라인 + 다중 시리즈 + 좌/우 Y축)
// ──────────────────────────────────────────────────────────
const W4_TARGET = [120, 220, 340, 410, 480, 510, 570, 620, 660, 690, 710, 697];
const W4_PLAN   = [110, 210, 320, 390, 460, 490, 550, 600, 640, 680, 700, 690];
const W4_ACTUAL = [105, 215, 315, 395, 455, 495, 545, 605, 645, 675, 695, 695];
const W4_LAST   = [ 90, 180, 290, 360, 430, 460, 520, 580, 620, 660, 670, 670];
const W4_GROWTH = [ 10,  18,  24,  32,  40,  48,  55,  62,  70,  78,  85,  92];

const W4_SERIES = [
  { label: '목표계획',   color: '#5281b3', data: W4_TARGET, axis: 'left' },
  { label: '판매계획',   color: '#86efac', data: W4_PLAN,   axis: 'left' },
  { label: '성장률 (%)', color: '#f59e0b', data: W4_GROWTH, axis: 'right', dashed: true },
  { label: '판매 실적',  color: '#2a9d8f', data: W4_ACTUAL, axis: 'left' },
  { label: '전년동기',   color: '#94a3b8', data: W4_LAST,   axis: 'left', dashed: true },
];

function W4Content() {
  return (
    <Stack sx={{ p: 1, height: '100%' }}>
      <Stack direction="row" spacing={0.75} sx={{ mb: 0.5 }}>
        <SegToggle left="AMT" right="QTY" active="left" />
        <SegToggle left="Week" right="Month" active="right" />
      </Stack>
      <Stack direction="row" sx={{ flex: 1, minHeight: 0 }}>
        <YAxisLabels labels={['$696.9B', '$600B', '$500B', '$400B', '$300B', '$200B', '$100B', '$0']} />
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <MultiLineSvg series={W4_SERIES} leftMax={700} rightMax={100} />
        </Box>
        <YAxisLabels labels={['100%', '80%', '60%', '40%', '20%', '0%']} width={36} align="left" />
      </Stack>
      <MonthLabels />
      <Stack direction="row" spacing={1.25} justifyContent="center" sx={{ mt: 0.4 }} flexWrap="wrap">
        {W4_SERIES.map((s) => (
          <CheckboxItem key={s.label} color={s.color} label={s.label} />
        ))}
      </Stack>
    </Stack>
  );
}

// ──────────────────────────────────────────────────────────
// W5 — 제품군별 판매
// ──────────────────────────────────────────────────────────
const W5_SERIES = [
  { label: 'Item Group 1', color: '#5281b3', data: [ 50, 100, 130, 160, 190, 220, 240, 260, 275, 285, 292, 298] },
  { label: 'Item Group 2', color: '#2a9d8f', data: [ 42,  85, 115, 145, 175, 205, 230, 250, 265, 275, 282, 285] },
  { label: 'Item Group 3', color: '#8b5cf6', data: [ 35,  72,  98, 128, 152, 178, 205, 225, 240, 252, 260, 265] },
  { label: 'Item Group 4', color: '#fa7d5b', data: [ 28,  58,  82, 108, 132, 155, 180, 200, 215, 225, 232, 238] },
  { label: 'Item Group 5', color: '#f59e0b', data: [ 22,  45,  68,  90, 112, 135, 158, 178, 192, 200, 208, 215] },
  { label: 'Item Group 6', color: '#94a3b8', data: [ 18,  38,  55,  72,  92, 112, 132, 152, 168, 178, 185, 192] },
];

function W5Content() {
  return (
    <Stack sx={{ p: 1, height: '100%' }}>
      <Stack direction="row" spacing={0.75} sx={{ mb: 0.5 }}>
        <SegToggle left="AMT" right="QTY" active="left" />
        <SegToggle left="Week" right="Month" active="right" />
      </Stack>
      <Stack direction="row" sx={{ flex: 1, minHeight: 0 }}>
        <YAxisLabels labels={['$300M', '$250M', '$200M', '$150M', '$100M', '$50M', '$0']} />
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <MultiLineSvg series={W5_SERIES.map((s) => ({ ...s, axis: 'left' }))} leftMax={300} rightMax={300} />
        </Box>
      </Stack>
      <MonthLabels />
      <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 0.4 }} flexWrap="wrap">
        {W5_SERIES.map((s) => (
          <CheckboxItem key={s.label} color={s.color} label={s.label} />
        ))}
      </Stack>
    </Stack>
  );
}

// ──────────────────────────────────────────────────────────
// W6 — 거래처 3분할 (좌 KPI · 중 World Map · 우 거래처 그리드)
// ──────────────────────────────────────────────────────────
const TOP_ACCOUNTS = [
  { rank: 1, name: 'CORP_ROMA',     amt: '$679.8M', qty: '115,487', pct: '9.8%' },
  { rank: 2, name: 'CORP_DUBAI',    amt:   '$657M', qty: '126,358', pct: '9.5%' },
  { rank: 3, name: 'CORP_HANOI',    amt: '$612.5M', qty:  '98,420', pct: '8.7%' },
  { rank: 4, name: 'CORP_SEOUL',    amt:   '$598M', qty:  '94,150', pct: '8.4%' },
  { rank: 5, name: 'CORP_TOKYO',    amt: '$542.3M', qty:  '88,210', pct: '7.6%' },
  { rank: 6, name: 'CORP_BERLIN',   amt: '$508.7M', qty:  '82,340', pct: '7.1%' },
  { rank: 7, name: 'CORP_SHANGHAI', amt: '$486.2M', qty:  '79,420', pct: '6.8%' },
];

function WorldMapMock() {
  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', bgcolor: '#f7faff', borderRadius: 0.5, border: '1px solid #e5e7eb' }}>
      <svg
        width="100%" height="100%"
        viewBox="0 0 800 380"
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* 단순화된 대륙 윤곽 */}
        <path d="M 80 110 Q 130 80 200 90 L 240 130 Q 220 180 150 175 L 100 160 Z"  fill="#e0e7ef" />
        <path d="M 200 220 L 260 200 L 270 290 L 230 340 L 190 320 Z"               fill="#e0e7ef" />
        <path d="M 380 95 L 470 85 L 490 135 L 445 175 L 390 165 Z"                 fill="#e0e7ef" />
        <path d="M 405 185 L 485 175 L 505 265 L 450 300 L 405 270 Z"               fill="#e0e7ef" />
        <path d="M 515 90 L 640 95 L 660 175 L 590 200 L 515 170 Z"                 fill="#e0e7ef" />
        <path d="M 610 270 L 680 260 L 695 320 L 645 350 L 615 320 Z"               fill="#e0e7ef" />

        {/* 마커 */}
        {[
          { cx: 430, cy: 125, c: '#3b82f6' },
          { cx: 510, cy: 175, c: '#3b82f6' },
          { cx: 590, cy: 165, c: '#10b981' },
          { cx: 600, cy: 195, c: '#3b82f6' },
          { cx: 125, cy: 135, c: '#3b82f6' },
          { cx: 220, cy: 270, c: '#10b981' },
          { cx: 450, cy: 230, c: '#10b981' },
        ].map((m, i) => (
          <g key={i}>
            <path
              d={`M ${m.cx} ${m.cy + 8} L ${m.cx - 7} ${m.cy - 4} A 8 8 0 1 1 ${m.cx + 7} ${m.cy - 4} Z`}
              fill={m.c}
              stroke="#ffffff"
              strokeWidth={1.5}
            />
            <circle cx={m.cx} cy={m.cy - 4} r={3} fill="#ffffff" />
          </g>
        ))}
      </svg>
      <Typography sx={{ position: 'absolute', bottom: 4, left: 6, fontSize: 9, color: '#94a3b8' }}>Google</Typography>
      <Typography sx={{ position: 'absolute', bottom: 4, right: 6, fontSize: 9, color: '#94a3b8' }}>
        지도 데이터 ©2026  약관
      </Typography>
    </Box>
  );
}

function W6Content() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '170px 1fr 340px',
        gap: 1,
        height: '100%',
        p: 1,
      }}
    >
      {/* 좌측 KPI 3개 */}
      <Stack spacing={1}>
        <Box sx={{ p: 1.25, border: '1px solid #e5e7eb', borderRadius: 0.5, bgcolor: '#fafbfc', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: 11, color: '#6b7280' }}>판매실적 상위 전체 금액</Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 700, mt: 0.5 }}>$4.5B</Typography>
        </Box>
        <Box sx={{ p: 1.25, border: '1px solid #e5e7eb', borderRadius: 0.5, bgcolor: '#fafbfc', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: 11, color: '#6b7280' }}>판매실적 상위 전체 판매량</Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 700, mt: 0.5 }}>801,853</Typography>
        </Box>
        <Box sx={{ p: 1.25, border: '1px solid #e5e7eb', borderRadius: 0.5, bgcolor: '#fafbfc', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: 11, color: '#6b7280' }}>최다 판매 거래처</Typography>
          <Typography sx={{ fontSize: 17, fontWeight: 700, mt: 0.5 }}>CORP_ROMA</Typography>
        </Box>
      </Stack>

      {/* 중앙 World Map */}
      <WorldMapMock />

      {/* 우측 거래처 그리드 */}
      <Stack sx={{ height: '100%', minHeight: 0 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.5, color: '#1f2937' }}>
          판매실적 상위 거래처
        </Typography>
        <Box
          sx={{
            height: 14, mb: 0.75, borderRadius: 0.3,
            background: 'linear-gradient(90deg, #1e3a8a 0%, #3b82f6 25%, #60a5fa 50%, #93c5fd 75%, #86efac 100%)',
          }}
        />
        {/* Header */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '36px 1.4fr 1fr 0.85fr 0.7fr',
            fontSize: 10, color: '#6b7280', borderBottom: '1px solid #d1d5db',
            py: 0.4, fontWeight: 600,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>순위</Box>
          <Box>거래처</Box>
          <Box sx={{ textAlign: 'right' }}>판매금액</Box>
          <Box sx={{ textAlign: 'right' }}>판매량</Box>
          <Box sx={{ textAlign: 'right', lineHeight: 1.05 }}>판매비중<br />(%)</Box>
        </Box>
        {/* Rows */}
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {TOP_ACCOUNTS.map((a) => (
            <Box
              key={a.rank}
              sx={{
                display: 'grid',
                gridTemplateColumns: '36px 1.4fr 1fr 0.85fr 0.7fr',
                fontSize: 11, py: 0.6,
                borderBottom: '1px solid #f1f5f9',
                alignItems: 'center',
              }}
            >
              <Box sx={{ textAlign: 'center' }}>{a.rank}</Box>
              <Box sx={{ color: '#1f2937' }}>{a.name}</Box>
              <Box sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{a.amt}</Box>
              <Box sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{a.qty}</Box>
              <Box sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{a.pct}</Box>
            </Box>
          ))}
        </Box>
      </Stack>
    </Box>
  );
}

// ──────────────────────────────────────────────────────────
// widget list — 원본 data-grid 비율 그대로 (12-col grid)
//   row 1 (h=4): KPI 3종
//   row 2 (h=8): 라인차트 2종
//   row 3 (h=8): 거래처 (12-wide 3분할)
//   maxY = 20 — fitToParent 모드에서 1fr 균등분할 → 한 화면 fit
// ──────────────────────────────────────────────────────────
const widgets = [
  { key: '1', title: '연 판매목표',   widgetId: 'WI_DP_YEAR_TARGET_SALES', dataGrid: { w: 4,  h: 4, x: 0, y:  0 }, showTitleBar: false, render: W1Content },
  { key: '2', title: '총 판매실적',   widgetId: 'WI_DP_YEAR_ACTUAL_SALES', dataGrid: { w: 4,  h: 4, x: 4, y:  0 }, showTitleBar: false, render: W2Content },
  { key: '3', title: '최다 판매 품목', widgetId: 'WI_DP_TOP_SALES_ITEM',    dataGrid: { w: 4,  h: 4, x: 8, y:  0 }, showTitleBar: false, render: W3Content },
  { key: '4', title: '판매 현황',     widgetId: 'WI_DP_PLAN_STATUS_Y',     dataGrid: { w: 6,  h: 8, x: 0, y:  4 }, showTitleBar: true,  render: W4Content },
  { key: '5', title: '제품군별 판매',  widgetId: 'WI_DP_TOP_SALES_ITEMGRP', dataGrid: { w: 6,  h: 8, x: 6, y:  4 }, showTitleBar: true,  render: W5Content },
  { key: '6', title: '거래처',        widgetId: 'WI_DP_TOP_SALES_ACCOUNT', dataGrid: { w: 12, h: 8, x: 0, y: 12 }, showTitleBar: false, render: W6Content },
];

export default function DashSalesStateMockup() {
  return (
    <MockShell
      patternCode="dash_sales_state"
      patternLabel="판매 현황 — SalesBoard"
      layoutCategory="LAYOUT_DASHBOARD"
      description="UI_SA_SALES_STATE — KPI 3종 (AMT/QTY) + 라인차트 2종 (월/주 토글) + 거래처 3분할 (KPI · 지도 · 그리드)"
    >
      <DashboardPanelMock widgets={widgets} fitToParent />
    </MockShell>
  );
}

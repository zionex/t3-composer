import React from 'react';
import { Box, Typography, Stack, Card } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';

import MockShell from '../_shared/MockShell';

/**
 * UI_SA_PSI · PSI 균형 관제 (snop/PsiBalance) — PDF page 12 디자인 기반
 *
 * 구성:
 *   상단: 4 KPI (판매 성과 / 재고 커버리지 / 공급 충족률 / PSI 불균형 지수)
 *   중단: PSI 수급 흐름 개요 — 큰 차트 + Month/Week 토글 + 우측 범례
 *   하단: 좌 PSI 불균형 분석 (3행 상태) + 우 AI PSI 불균형 진단 (텍스트)
 */

const KPIS = [
  { label: '판매 성과 (최근 3개월)',  value: '1', unit: '%',  delta: '-89% vs. 이전 3개월',     status: 'error' },
  { label: '재고 커버리지',           value: '0',  unit: '',  delta: '(현 재고 vs. +3개월 일 평균 판매)', status: 'error' },
  { label: '공급 충족률 (최근 3개월)', value: '0',  unit: '%', delta: '-89% vs. 이전 3개월',     status: 'error' },
  { label: 'PSI 불균형 지수',         value: '0',  unit: '%', delta: '(균형)',                   status: 'success' },
];

const STATUS_COLORS = {
  success: { dot: '#10b981', text: '#047857' },
  warning: { dot: '#f59e0b', text: '#b45309' },
  error:   { dot: '#ef4444', text: '#b91c1c' },
};

const PSI_MONTHS = ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'];

function KpiCard({ k }) {
  const cfg = STATUS_COLORS[k.status];
  return (
    <Card variant="outlined" sx={{ p: 1.5, flex: 1, minWidth: 200, position: 'relative' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{k.label}</Typography>
        <CircleIcon sx={{ fontSize: 10, color: cfg.dot }} />
      </Stack>
      <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mt: 1 }}>
        <Typography sx={{ fontSize: 26, fontWeight: 700, color: cfg.text, lineHeight: 1 }}>
          {k.value}{k.unit}
        </Typography>
        <Typography sx={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>▾</Typography>
      </Stack>
      <Typography sx={{ fontSize: 10, color: '#6b7280', mt: 0.5 }}>{k.delta}</Typography>
    </Card>
  );
}

function PsiFlowChart() {
  return (
    <Box sx={{ height: '100%', position: 'relative', p: 1.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CalendarViewMonthIcon sx={{ fontSize: 18, color: '#2563eb' }} />
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>PSI 수급 흐름 개요</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Stack direction="row" spacing={1.5}>
            {[
              { c: '#3b82f6', l: '판매(S)', t: 'box' },
              { c: '#86efac', l: '공급(P)', t: 'box' },
              { c: '#1f2937', l: '재고(I)', t: 'line' },
              { c: '#94a3b8', l: '목표 재고', t: 'dash' },
              { c: '#ef4444', l: '안전 재고', t: 'dash' },
            ].map((i) => (
              <Stack key={i.l} direction="row" alignItems="center" spacing={0.4}>
                {i.t === 'box' && <Box sx={{ width: 12, height: 10, bgcolor: i.c, borderRadius: 0.25 }} />}
                {i.t === 'line' && <Box sx={{ width: 14, height: 0, borderTop: `2px solid ${i.c}` }} />}
                {i.t === 'dash' && <Box sx={{ width: 14, height: 0, borderTop: `2px dashed ${i.c}` }} />}
                <Typography sx={{ fontSize: 10, color: '#374151' }}>{i.l}</Typography>
              </Stack>
            ))}
          </Stack>
          <Stack direction="row" sx={{ border: '1px solid #d1d5db', borderRadius: 0.5, overflow: 'hidden' }}>
            <Box sx={{ px: 1, py: 0.2, bgcolor: '#2563eb', color: '#fff', fontSize: 10, fontWeight: 700 }}>Month</Box>
            <Box sx={{ px: 1, py: 0.2, fontSize: 10, fontWeight: 600, color: '#6b7280' }}>Week</Box>
          </Stack>
        </Stack>
      </Stack>

      {/* Y축 + 차트 */}
      <Box sx={{ display: 'flex', height: 'calc(100% - 50px)' }}>
        <Box sx={{ width: 44, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pr: 0.5, pb: 2 }}>
          {['$0', '$0.1', '$0.2', '$0.3', '$0.4', '$0.5', '$0.6', '$0.7', '$0.8', '$0.9', '$1'].map((t) => (
            <Typography key={t} sx={{ fontSize: 9, color: '#94a3b8', textAlign: 'right', lineHeight: 1 }}>{t}</Typography>
          ))}
        </Box>
        <Box sx={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, position: 'relative' }}>
            {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((p) => (
              <Box key={p} sx={{ position: 'absolute', left: 0, right: 0, top: `${p * 100}%`, borderTop: '1px dashed #e5e7eb' }} />
            ))}
          </Box>
          <Box sx={{ display: 'flex', mt: 0.5 }}>
            {PSI_MONTHS.map((m) => (
              <Typography key={m} sx={{ flex: 1, textAlign: 'center', fontSize: 9.5, color: '#6b7280' }}>{m}</Typography>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

const GAP_ITEMS = [
  { label: '계획 대비 판매 실적 추이 분석', sub: '(과거 수요 계획 vs. 판매 실적 편차 분석)', badge: '-89% 수요 급증', status: 'error' },
  { label: '재고 적정도',                  sub: '(현 재고 vs. 목표 / 안전 재고)',           badge: '품절 위험',     status: 'error' },
  { label: '수요-공급 계획 충족',           sub: '(수요 계획 vs. 공급 계획)',                badge: '공급 부족 심각', status: 'error' },
];

function GapItem({ it }) {
  const cfg = STATUS_COLORS[it.status];
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between"
      sx={{ p: 1, bgcolor: '#fff1f2', borderRadius: 0.5, border: '1px solid #fecaca' }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <CircleIcon sx={{ fontSize: 10, color: cfg.dot }} />
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{it.label}</Typography>
          <Typography sx={{ fontSize: 10.5, color: '#6b7280' }}>{it.sub}</Typography>
        </Box>
      </Stack>
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: cfg.text }}>{it.badge}</Typography>
    </Stack>
  );
}

export default function DashPsiBalanceMockup() {
  return (
    <MockShell
      patternCode="dash_psi_balance"
      patternLabel="PSI 균형 관제"
      layoutCategory="LAYOUT_DASHBOARD"
      description="UI_SA_PSI — KPI 4종 + PSI 수급 흐름 개요 차트 + PSI 불균형 분석 + AI PSI 불균형 진단 (snop/PsiBalance)"
    >
      <Box sx={{ p: 1.5, height: '100%', bgcolor: '#f4f6f9', display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 0, overflow: 'hidden' }}>
        {/* KPI 4종 */}
        <Stack direction="row" spacing={1.5}>
          {KPIS.map((k, i) => <KpiCard key={i} k={k} />)}
        </Stack>

        {/* PSI 수급 흐름 개요 */}
        <Card variant="outlined" sx={{ flex: 1.5, minHeight: 0 }}>
          <PsiFlowChart />
        </Card>

        {/* 하단 좌우 분할 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 1.5, flex: 1, minHeight: 0 }}>
          <Card variant="outlined" sx={{ p: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Box sx={{ fontSize: 16 }}>⚖️</Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>PSI 불균형 분석</Typography>
            </Stack>
            <Stack spacing={1}>
              {GAP_ITEMS.map((it, i) => <GapItem key={i} it={it} />)}
            </Stack>
          </Card>
          <Card variant="outlined" sx={{ p: 1.5, background: 'linear-gradient(150deg, #eff6ff 0%, #f0fdf4 100%)' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <AutoAwesomeIcon sx={{ fontSize: 18, color: '#2563eb' }} />
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1e40af' }}>AI PSI 불균형 진단</Typography>
            </Stack>
            <Box sx={{ fontSize: 11.5, color: '#1f2937', lineHeight: 1.6 }}>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: '#10b981', borderRadius: 0.3 }} />
                <Typography sx={{ fontSize: 12, fontWeight: 700 }}>재고 부족 위험</Typography>
              </Stack>
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, mt: 0.75 }}>⚠ 영향</Typography>
              <Typography component="ul" sx={{ fontSize: 11, pl: 2.5, m: 0 }}>
                <li>15개 주차 연속 안전재고 미달로 결품 위험이 매우 큼.</li>
                <li>판매 대응이 어려워져 매출 기회 손실 가능성이 큼.</li>
              </Typography>
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, mt: 0.75 }}>★ 원인</Typography>
              <Typography component="ul" sx={{ fontSize: 11, pl: 2.5, m: 0 }}>
                <li>구간: 2025년 12월 W44~9주차</li>
                <li>핵심 지표: 안전재고 대비 부족 비율 100.0%, 연속 미달 주차 ≥ 15주</li>
                <li>예상 원인: 초기 가용재고가 없음, 공급 반영이 재고 회복으로 이어지지 않음.</li>
              </Typography>
            </Box>
          </Card>
        </Box>
      </Box>
    </MockShell>
  );
}

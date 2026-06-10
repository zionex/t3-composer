import React from 'react';
import { Box, Typography, Stack, Card } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MockShell from '../_shared/MockShell';

/**
 * UI_FP_PLAN_AGAINST_PRFM_DETAIL · 계획 대비 실적 상세 — PDF page 11 디자인 기반
 *
 *   상단: 검색 (공장 / 고객 / 품목 그룹 / 품목 / 공정 그룹 / 공정 / 자원 / Bucket)
 *   중단: 계획 대비 실적 상세 PIVOT 그리드 (좌측 식별 + 분석 지표 + 일자 시계열)
 *   하단: 좌 차트 (달성률/적종률/계획 생산량/실제 생산량) + 우 차트 (누적 버전)
 */

const FILTER_DROPDOWNS = [
  { label: '공장',     value: 'PLANT - FAB A' },
  { label: '고객',     value: '전체' },
  { label: '품목 그룹', value: '전체' },
  { label: '품목',     value: '전체' },
  { label: '공정 그룹', value: '전체' },
  { label: '공정',     value: '전체' },
  { label: '자원',     value: '전체' },
  { label: 'Bucket',  value: '일' },
];

const DATE_COLS = [
  { date: '2026-06-03', day: '수' },
  { date: '2026-06-04', day: '목' },
  { date: '2026-06-05', day: '금' },
  { date: '2026-06-06', day: '토' },
  { date: '2026-06-07', day: '일' },
  { date: '2026-06-08', day: '월' },
  { date: '2026-06-09', day: '화' },
  { date: '2026-06-10', day: '수' },
];

const METRICS = [
  { name: '계획 생산량',    values: [0, 0, 0, 50, 25, 0, 25, 50] },
  { name: '실제 생산량',    values: [0, 0, 0, 50, 25, 0, 25, 47] },
  { name: '달성률 (%)',     values: [0, 0, 0, 100, 100, 0, 100, 94] },
  { name: '적종률 (%)',     values: [0, 0, 0, 100, 100, 0, 100, 94] },
  { name: '누적 계획 생산량', values: [0, 0, 0, 50, 75, 75, 100, 150] },
  { name: '누적 실제 생산량', values: [0, 0, 0, 50, 75, 75, 100, 147] },
  { name: '달성률 (누적) ...', values: [0, 0, 0, 100, 100, 100, 100, 98] },
];

function MetricCell({ v, isPct }) {
  return (
    <Box sx={{
      px: 0.5, py: 0.3,
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      borderBottom: '1px solid #f1f5f9', fontFamily: 'monospace',
      bgcolor: isPct && v === 100 ? '#dbeafe' : 'transparent',
      color: isPct && v === 100 ? '#1e40af' : '#1f2937',
      fontWeight: isPct && v === 100 ? 700 : 400,
    }}>
      {v}
    </Box>
  );
}

const DAY_LABELS = ['2026-06-03_WED', '2026-06-04_THU', '2026-06-05_FRI', '2026-06-06_SAT', '2026-06-07_SUN', '2026-06-08_MON', '2026-06-09_TUE', '2026-06-10_WED', '2026-06-11_THU', '2026-06-12_FRI', '2026-06-13_SAT'];

const PLAN_VALUES   = [4800, 5200, 5500, 5300, 5700, 5400, 5100, 5500, 5800, 5300, 5600];
const ACTUAL_VALUES = [4500, 5000, 5300, 5100, 5500, 5200, 4900, 5300, 5600, 5100, 5400];

const CUM_PLAN_VALUES = [10000, 20000, 30000, 40000, 50000, 55000, 60000, 65000, 70000, 75000, 80000];
const CUM_ACTUAL_VALUES = [9500, 19000, 28500, 38000, 47000, 52000, 56500, 61500, 66000, 70500, 75500];

function PlanActualChart({ title, plan, actual, yMax, legendLabels }) {
  return (
    <Box sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, mb: 0.5 }}>{title}</Typography>
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <Box sx={{ width: 32, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pb: 2.5 }}>
          {['0', `${(yMax * 0.2).toLocaleString()}`, `${(yMax * 0.4).toLocaleString()}`, `${(yMax * 0.6).toLocaleString()}`, `${(yMax * 0.8).toLocaleString()}`, `${yMax.toLocaleString()}`].map((t) => (
            <Typography key={t} sx={{ fontSize: 8, color: '#94a3b8', textAlign: 'right' }}>{t}</Typography>
          ))}
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((p) => (
              <Box key={p} sx={{ position: 'absolute', left: 0, right: 0, top: `${p * 100}%`, borderTop: '1px dashed #e5e7eb' }} />
            ))}
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex' }}>
              {plan.map((v, i) => (
                <Box key={i} sx={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '2px', minWidth: 0 }}>
                  <Box sx={{ width: '38%', maxWidth: 8, height: `${(v / yMax) * 100}%`, bgcolor: '#cbd5e1' }} />
                  <Box sx={{ width: '38%', maxWidth: 8, height: `${(actual[i] / yMax) * 100}%`, bgcolor: '#3b82f6' }} />
                </Box>
              ))}
            </Box>
            {/* line */}
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
              <polyline
                points={plan.map((v, i) => {
                  const x = ((i + 0.5) / plan.length) * 100;
                  const y = v < yMax * 0.7 ? 10 : 5;
                  return `${x.toFixed(2)},${y}`;
                }).join(' ')}
                fill="none" stroke="#fb923c" strokeWidth="1.3" vectorEffect="non-scaling-stroke"
              />
            </svg>
            {plan.map((_, i) => (
              <Box key={i} sx={{
                position: 'absolute',
                left: `${((i + 0.5) / plan.length) * 100}%`,
                top: '8%',
                width: 5, height: 5, bgcolor: '#fb923c', borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
              }} />
            ))}
          </Box>
          <Box sx={{ display: 'flex', mt: 0.3 }}>
            {DAY_LABELS.map((d) => (
              <Typography key={d} sx={{ flex: 1, textAlign: 'center', fontSize: 6.5, color: '#94a3b8', transform: 'rotate(-25deg)', whiteSpace: 'nowrap', minWidth: 0 }}>
                {d}
              </Typography>
            ))}
          </Box>
        </Box>
        <Box sx={{ width: 24, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pb: 2.5 }}>
          {[0, 20, 40, 60, 80, 100].map((v) => (
            <Typography key={v} sx={{ fontSize: 8, color: '#94a3b8' }}>{v}</Typography>
          ))}
        </Box>
      </Box>
      <Stack direction="row" justifyContent="center" spacing={0.75} sx={{ mt: 0.3 }}>
        {legendLabels.map((it) => (
          <Stack key={it.l} direction="row" alignItems="center" spacing={0.3}>
            <Box sx={{ width: 9, height: 9, bgcolor: it.c, borderRadius: 0.2 }} />
            <Typography sx={{ fontSize: 9 }}>{it.l}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

export default function DashPlanAgainstPrfmDetailMockup() {
  return (
    <MockShell
      patternCode="dash_plan_against_prfm_detail"
      patternLabel="계획 대비 실적 상세"
      layoutCategory="LAYOUT_DASHBOARD"
      description="UI_FP_PLAN_AGAINST_PRFM_DETAIL — 검색조건 + PIVOT 그리드 + 일별 추이 차트 2종 (factoryplan/dashboard/PlanAgainstPrfmDetailDashboard)"
    >
      <Box sx={{ p: 1.5, height: '100%', bgcolor: '#f4f6f9', display: 'flex', flexDirection: 'column', gap: 1.5, overflow: 'hidden' }}>
        {/* 검색 영역 */}
        <Stack direction="row" spacing={1} sx={{ flex: '0 0 auto', flexWrap: 'wrap' }}>
          {FILTER_DROPDOWNS.map((f) => (
            <Box key={f.label} sx={{ border: '1px solid #d1d5db', borderRadius: 0.5, px: 1, py: 0.4, bgcolor: '#fff', minWidth: 110 }}>
              <Typography sx={{ fontSize: 9.5, color: '#94a3b8' }}>{f.label}</Typography>
              <Typography sx={{ fontSize: 11, color: '#1f2937', fontWeight: 600 }}>{f.value} ▾</Typography>
            </Box>
          ))}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#2563eb', color: '#fff', borderRadius: 0.5, px: 1.5 }}>
            <SearchIcon sx={{ fontSize: 18 }} />
          </Box>
        </Stack>

        {/* PIVOT 그리드 */}
        <Card variant="outlined" sx={{ flex: 1.6, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, p: 1, borderBottom: '1px solid #e5e7eb' }}>계획 대비 실적 상세</Typography>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: `80px 90px 90px 100px 100px 100px 80px 100px 100px repeat(${DATE_COLS.length}, minmax(70px, 1fr))`,
              fontSize: 10.5, minWidth: '100%',
            }}>
              {/* Header row 1 — meta */}
              {['공장 코드', '공장 명', '품목 코드', '품목 명칭', '자원 코드', '자원 명칭', '고객 코드', '고객 명', '분석 지표'].map((h, i) => (
                <Box key={i} sx={{
                  px: 0.5, py: 0.5, bgcolor: '#eef2f7', borderBottom: '1px solid #cbd5e1',
                  fontWeight: 700, fontSize: 10, display: 'flex', alignItems: 'center',
                  gridRow: 'span 2',
                  borderRight: '1px solid #e5e7eb',
                }}>{h}</Box>
              ))}
              {DATE_COLS.map((d) => (
                <Box key={d.date} sx={{
                  bgcolor: '#eef2f7', borderBottom: '1px solid #cbd5e1', fontWeight: 700,
                  fontSize: 9.5, textAlign: 'center', py: 0.3,
                }}>{d.date}</Box>
              ))}
              {DATE_COLS.map((d) => (
                <Box key={d.date + '_day'} sx={{
                  bgcolor: '#eef2f7', borderBottom: '1px solid #cbd5e1', fontWeight: 700,
                  fontSize: 9.5, textAlign: 'center', py: 0.3,
                  color: d.day === '토' ? '#3b82f6' : d.day === '일' ? '#ef4444' : '#1f2937',
                }}>{d.day}</Box>
              ))}
              {/* Data row — single entity */}
              {[
                { v: 'FAB#A' },
                { v: 'PLANT - FA...' },
                { v: 'ITEM#01#01' },
                { v: 'Bare Wafer' },
                { v: 'RES#01#01...' },
                { v: 'Wafer Fabri...' },
                { v: 'APPLE' },
                { v: 'Apple Inc.' },
              ].map((cell, i) => (
                <Box key={i} sx={{
                  px: 0.5, py: 0.5, borderBottom: '1px solid #f1f5f9',
                  display: 'flex', alignItems: 'center',
                  gridRow: `span ${METRICS.length}`, borderRight: '1px solid #e5e7eb',
                }}>{cell.v}</Box>
              ))}
              {/* 분석 지표 + 일자 값 */}
              {METRICS.map((m) => [
                <Box key={`m-${m.name}`} sx={{
                  px: 0.5, py: 0.4, borderBottom: '1px solid #f1f5f9',
                  display: 'flex', alignItems: 'center', fontSize: 10,
                }}>{m.name}</Box>,
                ...m.values.map((v, i) => (
                  <MetricCell key={`${m.name}-${i}`} v={v} isPct={m.name.includes('%')} />
                )),
              ])}
            </Box>
          </Box>
        </Card>

        {/* 하단 차트 2개 */}
        <Box sx={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <Card variant="outlined" sx={{ minHeight: 0 }}>
            <PlanActualChart
              title=""
              plan={PLAN_VALUES} actual={ACTUAL_VALUES} yMax={6000}
              legendLabels={[
                { c: '#fb923c', l: '달성률 (%)' },
                { c: '#86efac', l: '적종률 (%)' },
                { c: '#cbd5e1', l: '계획 생산량' },
                { c: '#3b82f6', l: '실제 생산량' },
              ]}
            />
          </Card>
          <Card variant="outlined" sx={{ minHeight: 0 }}>
            <PlanActualChart
              title=""
              plan={CUM_PLAN_VALUES} actual={CUM_ACTUAL_VALUES} yMax={80000}
              legendLabels={[
                { c: '#fb923c', l: '달성률 (누적) (%)' },
                { c: '#86efac', l: '적종률 (누적) (%)' },
                { c: '#cbd5e1', l: '누적 계획 생산량' },
                { c: '#3b82f6', l: '누적 실제 생산량' },
              ]}
            />
          </Card>
        </Box>
      </Box>
    </MockShell>
  );
}

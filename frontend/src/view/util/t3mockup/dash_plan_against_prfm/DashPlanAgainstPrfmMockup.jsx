import React from 'react';
import { Box, Typography, Stack, Card } from '@mui/material';
import MockShell from '../_shared/MockShell';

/**
 * UI_FP_PLAN_AGAINST_PRFM · 계획 대비 실적 — PDF page 10 디자인 기반 (2 × 3 widgets)
 *
 *   상단 좌: 계획 대비 실적 누적 (추이) — line + bar (D/W/M)
 *   상단 중: 품목 그룹별 차질 수량 현황 — pie (CW/CM/CY)
 *   상단 우: 생산 차질 현황 — stacked bar (D/W/M)
 *   하단 좌: 계획 대비 실적 (추이) — line + bar (D/W/M)
 *   하단 중: 문제 현황 — line (QTY/CNT, CW/CM/CY)
 *   하단 우: 문제 현황 (추이) — line (QTY/CNT, D/W/M)
 */

const COLORS = {
  ASSEMBLY: '#cbd5e1',
  BUMP:     '#fb923c',
  FAB:      '#86efac',
  MEOL:     '#1e3a8a',
  SHIP:     '#3b82f6',
};

const DATES = ['2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06', '2026-06-07', '2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12', '2026-06-13'];

// Cumulative — 누적 데이터 (점진적 증가)
const CUM_PLAN   = [5000, 15000, 25000, 30000, 38000, 46000, 50000, 58000, 66000, 70000, 78000];
const CUM_ACTUAL = [4500, 14000, 22000, 27000, 35000, 42000, 47000, 55000, 62000, 67000, 75000];
const CUM_RATE   = Array(11).fill(95);

// Daily — 일별 비교
const PLAN_DAILY   = [5500, 6500, 6000, 5800, 6300, 6100, 5900, 6200, 6500, 6800, 6500];
const ACTUAL_DAILY = [5000, 6200, 5700, 5500, 6000, 5800, 5600, 5900, 6200, 6500, 6300];

function SegToggle({ items, active }) {
  return (
    <Stack direction="row" sx={{ border: '1px solid #d1d5db', borderRadius: 0.3, overflow: 'hidden' }}>
      {items.map((it, i) => (
        <Box key={it}
             sx={{
               px: 0.75, py: 0.1,
               bgcolor: it === active ? '#2563eb' : '#fff',
               color: it === active ? '#fff' : '#6b7280',
               fontSize: 10, fontWeight: 600,
               borderLeft: i > 0 ? '1px solid #d1d5db' : 'none',
             }}>
          {it}
        </Box>
      ))}
    </Stack>
  );
}

function CumulativeChart() {
  const yMax = 80000;
  return (
    <Box sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>계획 대비 실적 누적 (추이)</Typography>
        <SegToggle items={['D', 'W', 'M']} active="D" />
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, mt: 0.5, display: 'flex' }}>
        <Box sx={{ width: 42, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pr: 0.5, pb: 2.5 }}>
          {['0', '20,000', '40,000', '60,000', '80,000'].map((t) => (
            <Typography key={t} sx={{ fontSize: 9, color: '#94a3b8', textAlign: 'right' }}>{t}</Typography>
          ))}
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
            {[0, 0.25, 0.5, 0.75, 1].map((p) => (
              <Box key={p} sx={{ position: 'absolute', left: 0, right: 0, top: `${p * 100}%`, borderTop: '1px dashed #e5e7eb' }} />
            ))}
            {/* 누적 막대 */}
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex' }}>
              {DATES.map((d, i) => (
                <Box key={d} sx={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '2px', minWidth: 0 }}>
                  <Box sx={{ width: '40%', maxWidth: 10, height: `${(CUM_PLAN[i] / yMax) * 100}%`, bgcolor: '#cbd5e1' }} />
                  <Box sx={{ width: '40%', maxWidth: 10, height: `${(CUM_ACTUAL[i] / yMax) * 100}%`, bgcolor: '#3b82f6' }} />
                </Box>
              ))}
            </Box>
            {/* 적종률 라인 */}
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
                 style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
              <polyline
                points={CUM_RATE.map((v, i) => {
                  const x = ((i + 0.5) / DATES.length) * 100;
                  const y = 100 - v;
                  return `${x.toFixed(2)},${y.toFixed(2)}`;
                }).join(' ')}
                fill="none" stroke="#fb923c" strokeWidth="1.3" vectorEffect="non-scaling-stroke"
              />
            </svg>
            {CUM_RATE.map((v, i) => (
              <Box key={i} sx={{
                position: 'absolute',
                left: `${((i + 0.5) / DATES.length) * 100}%`,
                top: `${100 - v}%`,
                width: 5, height: 5, bgcolor: '#fb923c', borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
              }} />
            ))}
          </Box>
          <Box sx={{ display: 'flex', mt: 0.3 }}>
            {DATES.map((d) => (
              <Typography key={d} sx={{ flex: 1, textAlign: 'center', fontSize: 7, color: '#94a3b8', transform: 'rotate(-30deg)', whiteSpace: 'nowrap', minWidth: 0 }}>
                {d}
              </Typography>
            ))}
          </Box>
        </Box>
        <Box sx={{ width: 28, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pl: 0.5, pb: 2.5 }}>
          {[0, 20, 40, 60, 80, 100].map((v) => (
            <Typography key={v} sx={{ fontSize: 9, color: '#94a3b8' }}>{v}</Typography>
          ))}
        </Box>
      </Box>
      <Stack direction="row" justifyContent="center" spacing={1} sx={{ mt: 0.5 }}>
        {[
          { c: '#fb923c', l: '달성률 (누적) (%)' },
          { c: '#86efac', l: '적종률 (누적) (%)' },
          { c: '#cbd5e1', l: '누적 계획 생산량' },
          { c: '#3b82f6', l: '누적 실제 생산량' },
        ].map((it) => (
          <Stack key={it.l} direction="row" alignItems="center" spacing={0.3}>
            <Box sx={{ width: 10, height: 10, bgcolor: it.c, borderRadius: 0.2 }} />
            <Typography sx={{ fontSize: 9.5 }}>{it.l}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

function DefectsPie() {
  const items = [
    { name: 'ASSEMBLY', value: 70, color: COLORS.ASSEMBLY },
    { name: 'BUMP',     value: 10, color: COLORS.BUMP },
    { name: 'FAB',      value: 12, color: COLORS.FAB },
    { name: 'MEOL',     value:  5, color: COLORS.MEOL },
    { name: 'SHIP',     value:  3, color: COLORS.SHIP },
  ];
  const total = items.reduce((s, it) => s + it.value, 0);
  let cum = 0;
  return (
    <Box sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>품목 그룹별 차질 수량 현황</Typography>
        <Stack direction="row" spacing={0.5}>
          <Typography sx={{ fontSize: 10.5, color: '#1f2937', fontWeight: 600 }}>2026-W24</Typography>
          <SegToggle items={['CW', 'CM', 'CY']} active="CW" />
        </Stack>
      </Stack>
      <Box sx={{
        flex: 1, minHeight: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%',
      }}>
        <svg
          width="100%" height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          style={{ maxWidth: 320, maxHeight: 320, display: 'block' }}
        >
          {items.map((it, i) => {
            const sa = (cum / total) * 2 * Math.PI - Math.PI / 2;
            cum += it.value;
            const ea = (cum / total) * 2 * Math.PI - Math.PI / 2;
            const r = 42;
            const x1 = 50 + r * Math.cos(sa), y1 = 50 + r * Math.sin(sa);
            const x2 = 50 + r * Math.cos(ea), y2 = 50 + r * Math.sin(ea);
            const large = (it.value / total) > 0.5 ? 1 : 0;
            return (
              <path key={i}
                    d={`M 50 50 L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
                    fill={it.color} stroke="#fff" strokeWidth={0.6} />
            );
          })}
          <text x="50" y="56" fontSize="13" textAnchor="middle" fontWeight={700} fill="#1f2937">192</text>
        </svg>
      </Box>
      <Stack direction="row" justifyContent="center" spacing={0.75} flexWrap="wrap" sx={{ flexShrink: 0, pt: 0.5 }}>
        {items.map((it) => (
          <Stack key={it.name} direction="row" alignItems="center" spacing={0.3}>
            <Box sx={{ width: 10, height: 10, bgcolor: it.color, borderRadius: 0.2 }} />
            <Typography sx={{ fontSize: 9.5 }}>{it.name}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

function DefectsBar() {
  const data = DATES.map((d, i) => ({
    date: d,
    ASSEMBLY: 30 + (i % 4) * 5,
    BUMP:     8 + (i % 3) * 2,
    FAB:      12 + (i % 5) * 2,
    MEOL:     5 + (i % 2) * 2,
    SHIP:     i === DATES.length - 1 ? 4 : 8,
  }));
  const totals = data.map((d) => d.ASSEMBLY + d.BUMP + d.FAB + d.MEOL + d.SHIP);
  const max = Math.max(...totals);
  return (
    <Box sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>생산 차질 현황</Typography>
        <SegToggle items={['D', 'W', 'M']} active="D" />
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, mt: 0.5, display: 'flex' }}>
        <Box sx={{ width: 30, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pb: 2.5 }}>
          {['0', '20', '40', '60', '80', '100', '120'].map((t) => (
            <Typography key={t} sx={{ fontSize: 9, color: '#94a3b8', textAlign: 'right' }}>{t}</Typography>
          ))}
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
            {[0, 0.25, 0.5, 0.75, 1].map((p) => (
              <Box key={p} sx={{ position: 'absolute', left: 0, right: 0, top: `${p * 100}%`, borderTop: '1px dashed #e5e7eb' }} />
            ))}
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex' }}>
              {data.map((d, i) => {
                const total = totals[i];
                return (
                  <Box key={d.date} sx={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', minWidth: 0 }}>
                    <Box sx={{ width: '60%', maxWidth: 22, height: `${(total / max) * 100}%`, display: 'flex', flexDirection: 'column' }}>
                      {['SHIP', 'MEOL', 'FAB', 'BUMP', 'ASSEMBLY'].map((k) => (
                        <Box key={k} sx={{ flex: d[k], bgcolor: COLORS[k] }} />
                      ))}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', mt: 0.3 }}>
            {DATES.map((d) => (
              <Typography key={d} sx={{ flex: 1, textAlign: 'center', fontSize: 7, color: '#94a3b8', transform: 'rotate(-30deg)', whiteSpace: 'nowrap', minWidth: 0 }}>
                {d}
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>
      <Stack direction="row" justifyContent="center" spacing={0.75} flexWrap="wrap">
        {['ASSEMBLY', 'BUMP', 'FAB', 'MEOL', 'SHIP'].map((k) => (
          <Stack key={k} direction="row" alignItems="center" spacing={0.3}>
            <Box sx={{ width: 10, height: 10, bgcolor: COLORS[k], borderRadius: 0.2 }} />
            <Typography sx={{ fontSize: 9 }}>{k}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

function DailyPlanActualChart() {
  const yMax = 7000;
  return (
    <Box sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>계획 대비 실적 (추이)</Typography>
        <SegToggle items={['D', 'W', 'M']} active="D" />
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, mt: 0.5, display: 'flex' }}>
        <Box sx={{ width: 32, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pb: 2.5 }}>
          {['0', '1,000', '2,000', '3,000', '4,000', '5,000', '6,000', '7,000'].map((t) => (
            <Typography key={t} sx={{ fontSize: 8, color: '#94a3b8', textAlign: 'right' }}>{t}</Typography>
          ))}
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
            {[0, 0.25, 0.5, 0.75, 1].map((p) => (
              <Box key={p} sx={{ position: 'absolute', left: 0, right: 0, top: `${p * 100}%`, borderTop: '1px dashed #e5e7eb' }} />
            ))}
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex' }}>
              {DATES.map((d, i) => (
                <Box key={d} sx={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '2px', minWidth: 0 }}>
                  <Box sx={{ width: '40%', maxWidth: 10, height: `${(PLAN_DAILY[i] / yMax) * 100}%`, bgcolor: '#cbd5e1' }} />
                  <Box sx={{ width: '40%', maxWidth: 10, height: `${(ACTUAL_DAILY[i] / yMax) * 100}%`, bgcolor: '#3b82f6' }} />
                </Box>
              ))}
            </Box>
            {/* 달성률 라인 */}
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
              <polyline
                points={DATES.map((_, i) => {
                  const x = ((i + 0.5) / DATES.length) * 100;
                  const y = 8;
                  return `${x.toFixed(2)},${y}`;
                }).join(' ')}
                fill="none" stroke="#fb923c" strokeWidth="1.3" vectorEffect="non-scaling-stroke"
              />
            </svg>
            {DATES.map((_, i) => (
              <Box key={i} sx={{
                position: 'absolute',
                left: `${((i + 0.5) / DATES.length) * 100}%`,
                top: '8%',
                width: 5, height: 5, bgcolor: '#fb923c', borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
              }} />
            ))}
          </Box>
          <Box sx={{ display: 'flex', mt: 0.3 }}>
            {DATES.map((d) => (
              <Typography key={d} sx={{ flex: 1, textAlign: 'center', fontSize: 7, color: '#94a3b8', transform: 'rotate(-30deg)', whiteSpace: 'nowrap', minWidth: 0 }}>
                {d}
              </Typography>
            ))}
          </Box>
        </Box>
        <Box sx={{ width: 28, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pb: 2.5 }}>
          {[0, 20, 40, 60, 80, 100].map((v) => (
            <Typography key={v} sx={{ fontSize: 9, color: '#94a3b8' }}>{v}</Typography>
          ))}
        </Box>
      </Box>
      <Stack direction="row" justifyContent="center" spacing={1} sx={{ mt: 0.5 }}>
        {[
          { c: '#fb923c', l: '적종률 (%)' },
          { c: '#86efac', l: '달성률 (%)' },
          { c: '#cbd5e1', l: '계획 생산량' },
          { c: '#3b82f6', l: '실제 생산량' },
        ].map((it) => (
          <Stack key={it.l} direction="row" alignItems="center" spacing={0.3}>
            <Box sx={{ width: 10, height: 10, bgcolor: it.c, borderRadius: 0.2 }} />
            <Typography sx={{ fontSize: 9.5 }}>{it.l}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

function EmptyChart({ title, toggleItems, toggleActive, header }) {
  return (
    <Box sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{title}</Typography>
        <Stack direction="row" spacing={0.5}>
          {header}
          <SegToggle items={toggleItems} active={toggleActive} />
        </Stack>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, mt: 0.5, display: 'flex', position: 'relative' }}>
        <Box sx={{ width: 28, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pb: 0.5 }}>
          {['0', '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0'].map((t) => (
            <Typography key={t} sx={{ fontSize: 8, color: '#94a3b8', textAlign: 'right' }}>{t}</Typography>
          ))}
        </Box>
        <Box sx={{ flex: 1, position: 'relative' }}>
          {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((p) => (
            <Box key={p} sx={{ position: 'absolute', left: 0, right: 0, top: `${p * 100}%`, borderTop: '1px dashed #e5e7eb' }} />
          ))}
        </Box>
        <Box sx={{ width: 28, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pb: 0.5 }}>
          {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((v) => (
            <Typography key={v} sx={{ fontSize: 8, color: '#94a3b8' }}>{v}</Typography>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default function DashPlanAgainstPrfmMockup() {
  return (
    <MockShell
      patternCode="dash_plan_against_prfm"
      patternLabel="계획 대비 실적"
      layoutCategory="LAYOUT_DASHBOARD"
      description="UI_FP_PLAN_AGAINST_PRFM — 6 widgets (계획대비 실적 누적/품목군 차질 pie/생산 차질 stack/계획대비 실적/문제현황/문제현황 추이)"
    >
      <Box sx={{ p: 1.5, height: '100%', bgcolor: '#f4f6f9', display: 'grid', gridTemplateRows: '1fr 1fr', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: 1.5, overflow: 'hidden' }}>
        <Card variant="outlined" sx={{ minHeight: 0 }}><CumulativeChart /></Card>
        <Card variant="outlined" sx={{ minHeight: 0 }}><DefectsPie /></Card>
        <Card variant="outlined" sx={{ minHeight: 0 }}><DefectsBar /></Card>

        <Card variant="outlined" sx={{ minHeight: 0 }}><DailyPlanActualChart /></Card>
        <Card variant="outlined" sx={{ minHeight: 0 }}>
          <EmptyChart title="문제 현황" toggleItems={['CW', 'CM', 'CY']} toggleActive="CW"
                      header={
                        <>
                          <SegToggle items={['QTY', 'CNT']} active="QTY" />
                          <Typography sx={{ fontSize: 10.5, color: '#1f2937', fontWeight: 600 }}>2026-W24</Typography>
                        </>
                      } />
        </Card>
        <Card variant="outlined" sx={{ minHeight: 0 }}>
          <EmptyChart title="문제 현황 (추이)" toggleItems={['D', 'W', 'M']} toggleActive="D"
                      header={<SegToggle items={['QTY', 'CNT']} active="QTY" />} />
        </Card>
      </Box>
    </MockShell>
  );
}

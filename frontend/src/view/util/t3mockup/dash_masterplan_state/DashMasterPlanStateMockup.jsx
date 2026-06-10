import React from 'react';
import { Box, Typography, Stack, Card } from '@mui/material';
import MockShell from '../_shared/MockShell';

/**
 * UI_SA_MASTER_PLAN_STATE · 공급 계획 현황 — PDF page 8 디자인 기반
 *
 *   상단: 5 KPI (초기 재고(BOH) / 총 수요량 / 총 공급량 / 수요 충족량 / 수요 충족률)
 *   중단: 수요-공급 충족 현황 — Week/Month/Quarter/Year 토글 + 막대(Request) + 점선(다른 시리즈)
 *   하단: Capacity 부하 현황 — 생산 거점/자원 dropdown + 누적 막대 + 점선
 */

function KpiCard({ label, value, sub }) {
  return (
    <Card variant="outlined" sx={{ p: 1.5, flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontSize: 11.5, color: '#374151', fontWeight: 500 }}>{label}</Typography>
      <Typography sx={{ fontSize: 22, fontWeight: 700, mt: 0.5, color: '#1f2937' }}>{value}</Typography>
      {sub && <Typography sx={{ fontSize: 10, color: '#94a3b8', mt: 0.25 }}>{sub}</Typography>}
    </Card>
  );
}

function SegToggle({ items, active }) {
  return (
    <Box
      sx={{
        display: 'inline-flex',        // ★ 콘텐츠 너비만 차지
        alignSelf: 'flex-start',       // ★ flex column 부모 안에서 stretch 방지
        border: '1px solid #d1d5db',
        borderRadius: 0.5,
        overflow: 'hidden',
        width: 'fit-content',
        flexShrink: 0,
      }}
    >
      {items.map((it, i) => (
        <Box key={it}
             sx={{
               px: 1, py: 0.2,
               bgcolor: it === active ? '#2563eb' : '#fff',
               color: it === active ? '#fff' : '#6b7280',
               fontSize: 10.5, fontWeight: 600,
               borderLeft: i > 0 ? '1px solid #d1d5db' : 'none',
             }}>
          {it}
        </Box>
      ))}
    </Box>
  );
}

const WEEKS = [
  '2025-W44','2025-W45','2025-W46','2025-W47','2025-W48','2025-W49','2025-W50','2025-W51',
  '2025-W52','2025-W53','2026-W01','2026-W02','2026-W03','2026-W04','2026-W05','2026-W06','2026-W07','2026-W08','2026-W09',
];
const DEMAND_DATA = [120, 480, 230, 250, 100, 460, 280, 280, 280, 280, 280, 380, 280, 280, 400, 300, 280, 280, 280];

// Capacity 누적 막대 데이터 — total 이 maxY(50) 안에 들어가도록 조정
const CAP_DATA = WEEKS.map((w, i) => ({
  week: w,
  scp:     20 + (i % 3),         // 20~22 (위쪽 진한 파랑 — 가장 큼)
  load:    15 + (i % 4) * 2,     // 15~21 (중간 파랑)
  avail:   2.5 + (i % 2) * 1.5,  // 2.5~4 (연한 파랑)
  loss:    i === 9 || i === 10 ? 4 : 0.5,
  overload: 0.5,
}));
// total ≈ 38~49 — maxY=50 안에서 안전

function FulfillChart() {
  const yMax = 500;
  return (
    <Box sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75, flexShrink: 0 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>수요 - 공급 충족 현황</Typography>
      </Stack>
      <Box sx={{ flexShrink: 0, mb: 0.75 }}>
        <SegToggle items={['Week', 'Month', 'Quarter', 'Year']} active="Week" />
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* Y axis */}
        <Box sx={{ width: 42, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pr: 0.5, pb: 2.5 }}>
          {['0', '100K', '200K', '300K', '400K', '500K'].map((t) => (
            <Typography key={t} sx={{ fontSize: 9, color: '#94a3b8', textAlign: 'right' }}>{t}</Typography>
          ))}
        </Box>
        <Box sx={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Box sx={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((p) => (
              <Box key={p} sx={{ position: 'absolute', left: 0, right: 0, top: `${p * 100}%`, borderTop: '1px dashed #e5e7eb' }} />
            ))}
            {/* 막대 */}
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex' }}>
              {WEEKS.map((w, i) => (
                <Box key={w} sx={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', minWidth: 0 }}>
                  <Box sx={{ width: '60%', maxWidth: 16, height: `${Math.min((DEMAND_DATA[i] / yMax) * 100, 100)}%`,
                              bgcolor: i === 1 || i === 5 ? '#fb923c' : '#cbd5e1' }} />
                </Box>
              ))}
            </Box>
            {/* 점선 라인 (On Time Commit) */}
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
                 style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
              <polyline
                points={DEMAND_DATA.slice(0, WEEKS.length).map((v, i) => {
                  const x = ((i + 0.5) / WEEKS.length) * 100;
                  const y = 100 - ((v - 50) / 450) * 100;
                  return `${x.toFixed(2)},${y.toFixed(2)}`;
                }).join(' ')}
                fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 1.5" vectorEffect="non-scaling-stroke"
              />
            </svg>
            {/* dot 표시 */}
            {DEMAND_DATA.map((v, i) => (
              <Box key={i} sx={{
                position: 'absolute',
                left: `${((i + 0.5) / WEEKS.length) * 100}%`,
                top: `${100 - ((v - 50) / 450) * 100}%`,
                width: 5, height: 5, bgcolor: '#1f2937', borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
              }} />
            ))}
          </Box>
          <Box sx={{ display: 'flex', mt: 0.5 }}>
            {WEEKS.map((w) => (
              <Typography key={w} sx={{ flex: 1, textAlign: 'center', fontSize: 8.5, color: '#94a3b8', minWidth: 0 }}>{w}</Typography>
            ))}
          </Box>
        </Box>
      </Box>
      <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 0.5 }}>
        {[
          { c: '#10b981', l: 'Request Qty' },
          { c: '#1f2937', l: 'On Time Commit' },
          { c: '#fb923c', l: 'Late Qty' },
          { c: '#ef4444', l: 'Short Qty' },
        ].map((it) => (
          <Stack key={it.l} direction="row" alignItems="center" spacing={0.4}>
            <Box sx={{ width: 12, height: 10, bgcolor: it.c, borderRadius: 0.2 }} />
            <Typography sx={{ fontSize: 10 }}>{it.l}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

function CapacityChart() {
  return (
    <Box sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75, flexShrink: 0 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>Capacity 부하 현황</Typography>
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <Box sx={{ border: '1px solid #d1d5db', borderRadius: 0.5, px: 1, py: 0.4, fontSize: 10, color: '#6b7280', bgcolor: '#fff' }}>
            <Typography sx={{ fontSize: 8.5, color: '#94a3b8', lineHeight: 1.1 }}>생산 거점</Typography>
            <Typography sx={{ fontSize: 10.5, color: '#1f2937', fontWeight: 600, lineHeight: 1.1, mt: 0.2 }}>FAC_BUSAN ▾</Typography>
          </Box>
          <Box sx={{ border: '1px solid #d1d5db', borderRadius: 0.5, px: 1, py: 0.4, fontSize: 10, color: '#6b7280', bgcolor: '#fff' }}>
            <Typography sx={{ fontSize: 8.5, color: '#94a3b8', lineHeight: 1.1 }}>자원</Typography>
            <Typography sx={{ fontSize: 10.5, color: '#1f2937', fontWeight: 600, lineHeight: 1.1, mt: 0.2 }}>FG Packing Res #1 ▾</Typography>
          </Box>
        </Stack>
      </Stack>
      <Box sx={{ flexShrink: 0, mb: 0.75 }}>
        <SegToggle items={['Week', 'Month', 'Quarter']} active="Week" />
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <Box sx={{ width: 42, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pr: 0.5, pb: 2.5 }}>
          {['0', '10K', '20K', '30K', '40K', '50K'].map((t) => (
            <Typography key={t} sx={{ fontSize: 9, color: '#94a3b8', textAlign: 'right' }}>{t}</Typography>
          ))}
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Box sx={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((p) => (
              <Box key={p} sx={{ position: 'absolute', left: 0, right: 0, top: `${p * 100}%`, borderTop: '1px dashed #e5e7eb' }} />
            ))}
            {/* 누적 막대 */}
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex' }}>
              {CAP_DATA.map((c, i) => {
                const total = c.scp + c.load + c.avail + c.loss + c.overload;
                const maxY = 50;
                return (
                  <Box key={c.week} sx={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', minWidth: 0, position: 'relative' }}>
                    <Box sx={{ width: '60%', maxWidth: 16, display: 'flex', flexDirection: 'column', height: `${(total / maxY) * 100}%` }}>
                      <Box sx={{ flex: c.scp,      bgcolor: '#1e3a8a' }} />
                      <Box sx={{ flex: c.load,     bgcolor: '#3b82f6' }} />
                      <Box sx={{ flex: c.avail,    bgcolor: '#60a5fa' }} />
                      <Box sx={{ flex: c.loss,     bgcolor: '#93c5fd' }} />
                      <Box sx={{ flex: c.overload, bgcolor: '#dbeafe' }} />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', mt: 0.5 }}>
            {WEEKS.map((w) => (
              <Typography key={w} sx={{ flex: 1, textAlign: 'center', fontSize: 8.5, color: '#94a3b8', minWidth: 0 }}>{w}</Typography>
            ))}
          </Box>
        </Box>
      </Box>
      <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 0.5 }} flexWrap="wrap">
        {[
          { c: '#1e3a8a', l: 'SCP Total Capacity' },
          { c: '#3b82f6', l: 'Capacity Load' },
          { c: '#60a5fa', l: 'Available Capacity' },
          { c: '#93c5fd', l: 'Constraint loss' },
          { c: '#dbeafe', l: 'Overload Capacity' },
        ].map((it) => (
          <Stack key={it.l} direction="row" alignItems="center" spacing={0.4}>
            <Box sx={{ width: 12, height: 10, bgcolor: it.c, borderRadius: 0.2, border: '1px solid #cbd5e1' }} />
            <Typography sx={{ fontSize: 10 }}>{it.l}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

export default function DashMasterPlanStateMockup() {
  return (
    <MockShell
      patternCode="dash_masterplan_state"
      patternLabel="공급 계획 현황"
      layoutCategory="LAYOUT_DASHBOARD"
      description="UI_SA_MASTER_PLAN_STATE — KPI 5종 + 수요-공급 충족 현황 + Capacity 부하 현황 (masterplan/analysisreport/MasterPlanBoard)"
    >
      <Box sx={{ p: 1.5, height: '100%', bgcolor: '#f4f6f9', display: 'flex', flexDirection: 'column', gap: 1.5, overflow: 'hidden' }}>
        {/* 상단 5 KPI */}
        <Stack direction="row" spacing={1.5} sx={{ flex: '0 0 auto' }}>
          <KpiCard label="초기 재고(BOH)" value="14K" />
          <KpiCard label="총 수요량"     value="4.9M" />
          <KpiCard label="총 공급량"     value="4.9M" />
          <KpiCard label="수요 충족량"   value="4.9M" />
          <KpiCard label="수요 충족률"   value="100 %" />
        </Stack>
        {/* 중단 차트 */}
        <Card variant="outlined" sx={{ flex: 1, minHeight: 0 }}>
          <FulfillChart />
        </Card>
        {/* 하단 차트 */}
        <Card variant="outlined" sx={{ flex: 1, minHeight: 0 }}>
          <CapacityChart />
        </Card>
      </Box>
    </MockShell>
  );
}

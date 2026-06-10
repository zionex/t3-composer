import React from 'react';
import { Box, Typography, Stack, Card } from '@mui/material';
import MockShell from '../_shared/MockShell';

/**
 * UI_SA_DEMAND_PLAN_STATE · 수요 계획 현황 — PDF page 4 디자인 기반 (3 × 3 widget grid)
 *
 *   Row 1: 계획 진행 상황 (stepper) / 계획 점검 (0건) / 계획 정확도 (0% / 0%)
 *   Row 2: 계획 상태 (USD bar) / 수요-공급 충족 현황 (bar + line) / 판매진척상황 (multi-team)
 *   Row 3: 판매분포 (2 donut) / 예측대비계획 (single point) / 팀별 판매계획정확도 (도넛 + 4 bars)
 */

function SegToggle({ items, active }) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignSelf: 'flex-start',
        width: 'fit-content',
        flexShrink: 0,
        border: '1px solid #d1d5db',
        borderRadius: 0.3,
        overflow: 'hidden',
      }}
    >
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
    </Box>
  );
}

// 체크박스 + 색칠 박스 + 라벨 형식의 범례 아이템
function LegendCheck({ items }) {
  return (
    <Stack direction="row" justifyContent="center" spacing={1.5} sx={{ pt: 0.5, pb: 0.25, flexShrink: 0 }} flexWrap="wrap">
      {items.map((it) => (
        <Stack key={it.l} direction="row" alignItems="center" spacing={0.4}>
          <Box sx={{
            width: 11, height: 11,
            border: '1.5px solid #3b82f6',
            bgcolor: '#3b82f6',
            borderRadius: 0.3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 8, fontWeight: 900, lineHeight: 1,
          }}>✓</Box>
          {it.dot
            ? <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: it.c }} />
            : it.line
              ? <Box sx={{ width: 14, height: 0, borderTop: `2px ${it.dashed ? 'dashed' : 'solid'} ${it.c}` }} />
              : <Box sx={{ width: 12, height: 10, bgcolor: it.c, borderRadius: 0.2 }} />}
          <Typography sx={{ fontSize: 10, color: '#374151' }}>{it.l}</Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function WidgetCard({ title, children, headerRight }) {
  return (
    <Card variant="outlined" sx={{ minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1.25, py: 0.75, borderBottom: '1px solid #f1f5f9' }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{title}</Typography>
        {headerRight}
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {children}
      </Box>
    </Card>
  );
}

// ─── Row 1
function ProgressStepper() {
  return (
    <Box sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        {[
          { idx: '0/10', label: 'SalesMan',   active: true },
          { idx: '0/4',  label: 'Department', active: false },
          { idx: '0/2',  label: 'Director',   active: false },
        ].map((s, i) => (
          <React.Fragment key={s.label}>
            <Stack alignItems="center" spacing={0.3} sx={{ minWidth: 60 }}>
              <Box sx={{
                width: 12, height: 12, borderRadius: '50%',
                bgcolor: s.active ? '#3b82f6' : '#cbd5e1',
              }} />
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: s.active ? '#3b82f6' : '#6b7280' }}>
                {s.idx}
              </Typography>
              <Typography sx={{ fontSize: 10, color: s.active ? '#3b82f6' : '#6b7280' }}>
                {s.label}
              </Typography>
            </Stack>
            {i < 2 && <Box sx={{ flex: 1, height: 0, borderTop: '1px dashed #cbd5e1' }} />}
          </React.Fragment>
        ))}
      </Stack>
    </Box>
  );
}

function AlertCount() {
  return (
    <Stack alignItems="flex-end" justifyContent="center" sx={{ p: 1.5, height: '100%' }}>
      <Typography sx={{ fontSize: 32, fontWeight: 700, color: '#1f2937' }}>0<span style={{ fontSize: 16, marginLeft: 4 }}>건</span></Typography>
      <Typography sx={{ fontSize: 10, color: '#94a3b8' }}>전체 경고수</Typography>
    </Stack>
  );
}

function AccuracyMeters() {
  return (
    <Box sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
      {['수요 예측', '수요 계획'].map((l) => (
        <Box key={l}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1f2937' }}>0%</Typography>
          <Box sx={{ height: 4, bgcolor: '#dbeafe', borderRadius: 2, mt: 0.4 }}>
            <Box sx={{ width: '0%', height: '100%', bgcolor: '#3b82f6', borderRadius: 2 }} />
          </Box>
          <Typography sx={{ fontSize: 10, color: '#94a3b8', mt: 0.25 }}>{l}</Typography>
        </Box>
      ))}
    </Box>
  );
}

// ─── Row 2
function PlanStatusBar() {
  return (
    <Box sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" spacing={1} sx={{ mb: 0.5 }}>
        <SegToggle items={['AMT', 'QTY']} active="AMT" />
        <SegToggle items={['Week', 'Month']} active="Month" />
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <Box sx={{ width: 50, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pb: 1.5 }}>
          {['$0', '$100B', '$200B', '$300B', '$400B', '$500B', '$600B', '$700B'].map((t) => (
            <Typography key={t} sx={{ fontSize: 8.5, color: '#94a3b8', textAlign: 'right' }}>{t}</Typography>
          ))}
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, position: 'relative' }}>
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((p) => (
              <Box key={p} sx={{ position: 'absolute', left: 0, right: 0, top: `${p * 100}%`, borderTop: '1px dashed #e5e7eb' }} />
            ))}
            <Stack direction="row" alignItems="flex-end" sx={{ position: 'absolute', inset: 0 }} spacing={1} justifyContent="center">
              <Box sx={{ width: 60, height: '85%', bgcolor: '#3b82f6' }} />
            </Stack>
          </Box>
          <Typography sx={{ fontSize: 10, textAlign: 'center', mt: 0.3, color: '#6b7280' }}>USD</Typography>
        </Box>
      </Box>
      <LegendCheck items={[
        { c: '#3b82f6', l: '판매계획' },
        { c: '#cbd5e1', l: '판매 실적' },
      ]} />
    </Box>
  );
}

const SUPPLY_WEEKS = ['2025-W43','2025-W44','2025-W45','2025-W46','2025-W47','2025-W48','2025-W49','2025-W50','2025-W51','2025-W52','2026-W01','2026-W02','2026-W03','2026-W04','2026-W05','2026-W06','2026-W07','2026-W08'];
const SUPPLY_DATA = [2.5, 2.2, 1.5, 1.7, 1.5, 0.6, 0.8, 1.8, 2.2, 1.5, 1.8, 1.5, 1.6, 1.5, 1.8, 1.6, 1.5, 1.5];

function SupplyFulfillment() {
  return (
    <Box sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" spacing={1} sx={{ mb: 0.5 }}>
        <SegToggle items={['AMT', 'QTY']} active="AMT" />
        <SegToggle items={['Week', 'Month']} active="Week" />
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <Box sx={{ width: 40, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pb: 1.5 }}>
          {['$0', '$500M', '$1B', '$1.5B', '$2B', '$2.5B'].map((t) => (
            <Typography key={t} sx={{ fontSize: 8.5, color: '#94a3b8', textAlign: 'right' }}>{t}</Typography>
          ))}
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, position: 'relative' }}>
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((p) => (
              <Box key={p} sx={{ position: 'absolute', left: 0, right: 0, top: `${p * 100}%`, borderTop: '1px dashed #e5e7eb' }} />
            ))}
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex' }}>
              {SUPPLY_WEEKS.map((w, i) => (
                <Box key={w} sx={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', minWidth: 0 }}>
                  <Box sx={{ width: '60%', maxWidth: 12, height: `${(SUPPLY_DATA[i] / 2.5) * 100}%`,
                              bgcolor: i < 8 ? '#fb923c' : '#cbd5e1' }} />
                </Box>
              ))}
            </Box>
            {/* dot line */}
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
              <polyline
                points={SUPPLY_DATA.map((v, i) => {
                  const x = ((i + 0.5) / SUPPLY_WEEKS.length) * 100;
                  const y = 100 - (v / 2.5) * 95;
                  return `${x.toFixed(2)},${y.toFixed(2)}`;
                }).join(' ')}
                fill="none" stroke="#1f2937" strokeWidth="0.9" strokeDasharray="2 1.5" vectorEffect="non-scaling-stroke"
              />
            </svg>
            {SUPPLY_DATA.map((v, i) => (
              <Box key={i} sx={{
                position: 'absolute',
                left: `${((i + 0.5) / SUPPLY_WEEKS.length) * 100}%`,
                top: `${100 - (v / 2.5) * 95}%`,
                width: 4, height: 4, bgcolor: '#1f2937', borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
              }} />
            ))}
          </Box>
          <Box sx={{ display: 'flex', mt: 0.2 }}>
            {SUPPLY_WEEKS.map((w) => (
              <Typography key={w} sx={{ flex: 1, textAlign: 'center', fontSize: 6.5, color: '#94a3b8', transform: 'rotate(-30deg)', whiteSpace: 'nowrap', minWidth: 0 }}>{w}</Typography>
            ))}
          </Box>
        </Box>
      </Box>
      <LegendCheck items={[
        { c: '#10b981', l: 'Request' },
        { c: '#1f2937', l: 'On Time' },
        { c: '#fb923c', l: 'Late' },
        { c: '#ef4444', l: 'Short' },
      ]} />
    </Box>
  );
}

function TeamProgress() {
  const teams = [
    { name: 'Sales Team 2',         value: 30 },
    { name: 'Europe Sales Team',     value: 25 },
    { name: 'Online Sales Team',     value: 22 },
    { name: 'Sales Team 1',         value: 20 },
    { name: 'America Sales Team',    value: 18 },
    { name: 'Sales Team 3',         value: 15 },
    { name: 'Asia Sales Team',       value: 12 },
    { name: '합계',                  value: 8,  isTotal: true },
  ];
  return (
    <Box sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <Box sx={{ flex: 1, position: 'relative' }}>
          {/* line peaks (sales 시리즈 점선) */}
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            <polyline
              points={teams.map((t, i) => {
                const x = ((i + 0.5) / teams.length) * 100;
                const peak = i === 0 || i === 3 ? 20 : i === 1 ? 30 : i === 2 ? 60 : 80;
                return `${x.toFixed(2)},${peak}`;
              }).join(' ')}
              fill="none" stroke="#1f2937" strokeWidth="1" vectorEffect="non-scaling-stroke"
            />
          </svg>
          {teams.map((t, i) => (
            <Box key={i} sx={{
              position: 'absolute',
              left: `${((i + 0.5) / teams.length) * 100}%`,
              top: `${i === 0 || i === 3 ? 20 : i === 1 ? 30 : i === 2 ? 60 : 80}%`,
              width: 5, height: 5, bgcolor: '#1f2937', borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
            }} />
          ))}
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end' }}>
            {teams.map((t, i) => (
              <Box key={i} sx={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', minWidth: 0 }}>
                <Box sx={{ width: '50%', maxWidth: 14, height: `${t.value}%`, bgcolor: '#cbd5e1' }} />
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ width: 60, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pl: 0.5 }}>
          {['0%', '14600%', '29200%', '43800%', '58400%', '73000%', '80300%'].map((t) => (
            <Typography key={t} sx={{ fontSize: 8, color: '#94a3b8' }}>{t}</Typography>
          ))}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', mt: 0.3 }}>
        {teams.map((t) => (
          <Typography key={t.name} sx={{ flex: 1, textAlign: 'center', fontSize: 7, color: '#94a3b8', transform: 'rotate(-25deg)', whiteSpace: 'nowrap', minWidth: 0 }}>
            {t.name}
          </Typography>
        ))}
      </Box>
      <LegendCheck items={[
        { c: '#1f2937', l: '진행율(%)', line: true },
        { c: '#cbd5e1', l: '예상 매출' },
        { c: '#3b82f6', l: '매출' },
      ]} />
    </Box>
  );
}

// ─── Row 3
function SalesDistribution() {
  // 원본 디자인: 파랑 톤 통일 (짙은 남색 → 연한 파랑 → 회색)
  const itemGroups = [
    { name: '제품그룹 1', value: 29.5, color: '#2563eb' },
    { name: '제품그룹 2', value: 25.2, color: '#3b82f6' },
    { name: '제품그룹 3', value: 18.5, color: '#60a5fa' },
    { name: '제품그룹 4', value: 11.5, color: '#94a3b8' },
    { name: '제품그룹 5', value: 11.3, color: '#cbd5e1' },
    { name: '제품그룹 6', value:  4.0, color: '#1e3a8a' },
  ];
  const channels = [
    { name: '채널 1', value: 39.4, color: '#2563eb' },
    { name: '채널 2', value: 35.4, color: '#3b82f6' },
    { name: '채널 3', value: 25.1, color: '#60a5fa' },
    { name: '채널 4', value:  0.1, color: '#cbd5e1' },
  ];
  return (
    <Box sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ flexShrink: 0, mb: 0.75 }}>
        <SegToggle items={['AMT', 'QTY']} active="AMT" />
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
        {[
          { title: '제품그룹\n판매분포', items: itemGroups },
          { title: '채널별\n판매분포',  items: channels },
        ].map((g) => {
          const total = g.items.reduce((s, i) => s + i.value, 0);
          let cum = 0;
          return (
            <Stack key={g.title} alignItems="center" justifyContent="center" sx={{ position: 'relative', minHeight: 0 }}>
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <svg
                  width="100%" height="100%"
                  viewBox="-15 -15 130 130"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ maxWidth: 240, maxHeight: 240 }}
                >
                  <circle cx="50" cy="50" r="32" fill="#fff" />
                  {g.items.map((it, i) => {
                    const sa = (cum / total) * 2 * Math.PI - Math.PI / 2;
                    const midA = ((cum + it.value / 2) / total) * 2 * Math.PI - Math.PI / 2;
                    cum += it.value;
                    const ea = (cum / total) * 2 * Math.PI - Math.PI / 2;
                    const r = 40, ri = 26;
                    const x1 = 50 + r * Math.cos(sa), y1 = 50 + r * Math.sin(sa);
                    const x2 = 50 + r * Math.cos(ea), y2 = 50 + r * Math.sin(ea);
                    const x3 = 50 + ri * Math.cos(ea), y3 = 50 + ri * Math.sin(ea);
                    const x4 = 50 + ri * Math.cos(sa), y4 = 50 + ri * Math.sin(sa);
                    const large = (it.value / total) > 0.5 ? 1 : 0;
                    // 외곽 % 라벨 좌표
                    const lx = 50 + 49 * Math.cos(midA);
                    const ly = 50 + 49 * Math.sin(midA);
                    return (
                      <g key={i}>
                        <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${ri} ${ri} 0 ${large} 0 ${x4} ${y4} Z`}
                              fill={it.color} stroke="#fff" strokeWidth="0.5" />
                        {it.value >= 3 && (
                          <text
                            x={lx} y={ly}
                            fontSize="4.5"
                            fill="#1f2937"
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            {it.value}%
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
                <Typography sx={{
                  position: 'absolute',
                  fontSize: 11, fontWeight: 700, color: '#1f2937',
                  textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.2,
                }}>
                  {g.title}
                </Typography>
              </Box>
            </Stack>
          );
        })}
      </Box>
    </Box>
  );
}

function FcstVsPlan() {
  return (
    <Box sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" spacing={1} sx={{ mb: 0.5 }}>
        <SegToggle items={['AMT', 'QTY']} active="AMT" />
        <SegToggle items={['Week', 'Month']} active="Week" />
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex' }}>
        <Box sx={{ width: 50, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pb: 1.5 }}>
          {['$0', '$100B', '$200B', '$300B', '$400B', '$500B', '$600B', '$700B'].map((t) => (
            <Typography key={t} sx={{ fontSize: 8.5, color: '#94a3b8', textAlign: 'right' }}>{t}</Typography>
          ))}
        </Box>
        <Box sx={{ flex: 1, position: 'relative' }}>
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((p) => (
            <Box key={p} sx={{ position: 'absolute', left: 0, right: 0, top: `${p * 100}%`, borderTop: '1px dashed #e5e7eb' }} />
          ))}
          {/* center dot */}
          <Box sx={{ position: 'absolute', left: '50%', top: '5%', transform: 'translate(-50%, -50%)' }}>
            <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#fff', border: '2.5px solid #3b82f6' }} />
          </Box>
          <Typography sx={{ position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: '#6b7280' }}>USD</Typography>
        </Box>
      </Box>
      <LegendCheck items={[
        { c: '#3b82f6', l: '수요예측', dot: true },
        { c: '#3b82f6', l: '수요 계획' },
      ]} />
    </Box>
  );
}

function TeamAccuracy() {
  const teams = [
    { name: 'Online Sales ...', value: 0 },
    { name: 'Sales Team 3',    value: 0 },
    { name: 'Sales Team 1',    value: 0 },
    { name: 'Sales Team 2',    value: 0 },
  ];
  return (
    <Box sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Stack direction="row" spacing={0.5} sx={{ mb: 0.75, flexShrink: 0 }}>
        <Box sx={{ px: 0.75, py: 0.1, bgcolor: '#1f2937', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 0.3 }}>EXPORT</Box>
        <Box sx={{ px: 0.75, py: 0.1, bgcolor: '#3b82f6', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 0.3 }}>DOMESTIC</Box>
      </Stack>
      <Stack direction="row" alignItems="center" sx={{ flex: 1, minHeight: 0 }} spacing={1.5}>
        <Box sx={{ position: 'relative', height: '100%', aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            {/* 회색 배경 도넛 */}
            <circle cx="50" cy="50" r="38" fill="none" stroke="#e5e7eb" strokeWidth={10} />
            {/* 파란 진행 호 (소량) */}
            <circle cx="50" cy="50" r="38" fill="none" stroke="#3b82f6" strokeWidth={10}
                    strokeDasharray={2 * Math.PI * 38} strokeDashoffset={2 * Math.PI * 38 * 0.97}
                    transform="rotate(-90 50 50)" strokeLinecap="round" />
            {/* 도넛 위쪽 12시 위치 마커 (작은 점) */}
            <circle cx="50" cy="12" r="3.5" fill="#3b82f6" stroke="#fff" strokeWidth={1.5} />
          </svg>
          <Stack alignItems="center" sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1f2937' }}>DOMESTIC</Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1f2937' }}>0%</Typography>
          </Stack>
        </Box>
        <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
          {teams.map((t) => (
            <Box key={t.name}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
                <Typography sx={{ fontSize: 11, color: '#374151' }}>{t.name}</Typography>
                <Typography sx={{ fontSize: 11, fontFamily: 'monospace', color: '#1f2937', fontWeight: 600 }}>{t.value}%</Typography>
              </Stack>
              <Box sx={{ height: 8, bgcolor: '#dbeafe', borderRadius: 1 }}>
                <Box sx={{ width: `${t.value}%`, height: '100%', bgcolor: '#3b82f6', borderRadius: 1 }} />
              </Box>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}

export default function DashDemandPlanStateMockup() {
  return (
    <MockShell
      patternCode="dash_demandplan_state"
      patternLabel="수요 계획 현황"
      layoutCategory="LAYOUT_DASHBOARD"
      description="UI_SA_DEMAND_PLAN_STATE — 9 widgets (3×3): 진행/점검/정확도 + 계획상태/충족현황/판매진척 + 판매분포/예측대비계획/팀별정확도 (demandplan/dashboard/DemandPlanBoard)"
    >
      <Box sx={{ p: 1.5, height: '100%', bgcolor: '#f4f6f9',
                  display: 'grid',
                  gridTemplateRows: '0.7fr 1.3fr 1.3fr',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 1.5, overflow: 'hidden' }}>
        <WidgetCard title="계획 진행 상황"><ProgressStepper /></WidgetCard>
        <WidgetCard title="계획 점검"><AlertCount /></WidgetCard>
        <WidgetCard title="계획 정확도"><AccuracyMeters /></WidgetCard>

        <WidgetCard title="계획 상태"><PlanStatusBar /></WidgetCard>
        <WidgetCard title="수요 - 공급 충족 현황"><SupplyFulfillment /></WidgetCard>
        <WidgetCard title="판매진척상황"><TeamProgress /></WidgetCard>

        <WidgetCard title="판매분포"><SalesDistribution /></WidgetCard>
        <WidgetCard title="예측대비계획"><FcstVsPlan /></WidgetCard>
        <WidgetCard title="팀별 판매계획정확도"><TeamAccuracy /></WidgetCard>
      </Box>
    </MockShell>
  );
}

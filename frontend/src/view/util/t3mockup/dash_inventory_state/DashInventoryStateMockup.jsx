import React from 'react';
import { Box, Typography, Stack, Card } from '@mui/material';
import MockShell from '../_shared/MockShell';

/**
 * UI_SA_INVENTORY_STATE · 재고 현황 — PDF page 6 디자인 기반
 *
 *   상단: 재고 추이 / 판매 추이 / 재고 일수 추이 (3 line KPIs with mini sparkline)
 *   중단: 품절 경고 (상위 10) 그리드 · 과잉 경고 (상위 10) 그리드
 *   하단: 부진 재고 현황 (horizontal bar) · 불용 재고 현황 (pie + bar)
 */

function MiniSparkline({ data, color = '#3b82f6', height = 40 }) {
  const w = 200, h = height;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const dx = w / (data.length - 1);
  const pts = data.map((v, i) => `${(i * dx).toFixed(1)},${(h - ((v - min) / range) * (h - 6) - 3).toFixed(1)}`).join(' ');
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

function KpiSparkline({ title, dateLeft, dateRight, valueLeft, valueRight, data, color }) {
  return (
    <Card variant="outlined" sx={{ p: 1.5, flex: 1, minWidth: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>{title}</Typography>
        <Stack direction="row" sx={{ border: '1px solid #d1d5db', borderRadius: 0.5, overflow: 'hidden' }}>
          <Box sx={{ px: 0.75, py: 0.15, bgcolor: '#2563eb', color: '#fff', fontSize: 9.5, fontWeight: 700 }}>AMT</Box>
          <Box sx={{ px: 0.75, py: 0.15, fontSize: 9.5, fontWeight: 600, color: '#6b7280' }}>QTY</Box>
        </Stack>
      </Stack>
      <Box sx={{ mt: 1 }}>
        <MiniSparkline data={data} color={color} height={50} />
      </Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
        <Box>
          <Typography sx={{ fontSize: 10, color: '#94a3b8' }}>{dateLeft}</Typography>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1f2937' }}>{valueLeft}</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ fontSize: 10, color: '#94a3b8' }}>{dateRight}</Typography>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1f2937' }}>{valueRight}</Typography>
        </Box>
      </Stack>
    </Card>
  );
}

const STOCKOUT_ROWS = [
  { locat: 'Ulsan CDC',    code: '43667', name: '43667', abc: 'AY', stock: '$115.5K', qty: 231, days: 1, gap: 0 },
  { locat: 'Ulsan CDC',    code: '58175', name: '58175', abc: 'AY', stock:  '$97.5K', qty: 195, days: 1, gap: 0 },
  { locat: 'Ulsan CDC',    code: '43140', name: '43140', abc: 'AY', stock: '$145.5K', qty: 291, days: 1, gap: 0 },
  { locat: 'Ulsan CDC',    code: '43608', name: '43608', abc: 'AY', stock:  '$83.5K', qty: 167, days: 1, gap: 0 },
  { locat: 'Ulsan CDC',    code: '43607', name: '43607', abc: 'AY', stock:  '$89.5K', qty: 179, days: 1, gap: 0 },
  { locat: 'New Delhi R..', code: '41213', name: '41213', abc: 'AY', stock:    '$91K', qty: 130, days: 2, gap: 0 },
];

const EXCESS_ROWS = [
  { locat: 'Ulsan CDC',    code: '41292', name: '41292', abc: 'CZ', stock: '$176K',   qty: 352, days: 28 },
  { locat: 'AnSeong R..',  code: '43395', name: '43395', abc: 'CZ', stock: '$446.4K', qty: 372, days: 29 },
  { locat: 'New Delhi R..', code: '43395', name: '43395', abc: 'CZ', stock: '$221.9K', qty: 317, days: 21 },
  { locat: 'AnSeong R..',  code: '43106', name: '43106', abc: 'CZ', stock: '$223.2K', qty: 186, days: 18 },
  { locat: 'New Delhi R..', code: '43604', name: '43604', abc: 'CZ', stock: '$251.3K', qty: 359, days: 17 },
  { locat: 'AnSeong R..',  code: '43050', name: '43050', abc: 'CZ', stock: '$561.6K', qty: 468, days: 16 },
];

function MiniGrid({ columns, rows, fontSize = 10.5 }) {
  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: columns.map((c) => c.width || '1fr').join(' '),
        fontSize, minWidth: '100%',
      }}>
        {columns.map((c) => (
          <Box key={c.field} sx={{
            px: 0.6, py: 0.5, bgcolor: '#eef2f7', borderBottom: '1px solid #cbd5e1',
            fontWeight: 700, fontSize: fontSize - 0.5,
            textAlign: c.align || 'left', position: 'sticky', top: 0, zIndex: 1,
            display: 'flex', alignItems: 'center', justifyContent: c.align === 'right' ? 'flex-end' : c.align === 'center' ? 'center' : 'flex-start',
          }}>
            {c.header}
          </Box>
        ))}
        {rows.map((row, ri) => columns.map((c) => {
          const v = row[c.field];
          return (
            <Box key={`${ri}-${c.field}`} sx={{
              px: 0.6, py: 0.45, borderBottom: '1px solid #f1f5f9',
              bgcolor: ri % 2 === 0 ? '#fff' : '#fafbfc',
              display: 'flex', alignItems: 'center',
              justifyContent: c.align === 'right' ? 'flex-end' : c.align === 'center' ? 'center' : 'flex-start',
              fontFamily: c.mono ? 'monospace' : 'inherit',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {c.format ? c.format(v, row) : v}
            </Box>
          );
        }))}
      </Box>
    </Box>
  );
}

const STOCKOUT_COLS = [
  { field: 'locat', header: '거점 명',  width: 'minmax(100px, 1.4fr)' },
  { field: 'code',  header: '품목 코드', width: 'minmax(60px, 1fr)',  mono: true, align: 'center' },
  { field: 'name',  header: '품목 명',  width: 'minmax(60px, 1fr)',  align: 'center' },
  { field: 'abc',   header: 'ABC-XYZ', width: '60px',  align: 'center',
    format: (v) => <span style={{ padding: '1px 6px', borderRadius: 8, bgcolor: '#dbeafe', backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 700, fontSize: 9.5 }}>{v}</span> },
  { field: 'stock', header: '현 재고', width: '80px',  align: 'right',  mono: true },
  { field: 'qty',   header: '수량',    width: '60px',  align: 'right',  mono: true },
  { field: 'days',  header: '재고 일수', width: '70px', align: 'right', mono: true },
];

const EXCESS_COLS = [
  { field: 'locat', header: '거점 명',  width: 'minmax(100px, 1.4fr)' },
  { field: 'code',  header: '품목 코드', width: 'minmax(60px, 1fr)',  mono: true, align: 'center' },
  { field: 'name',  header: '품목 명',  width: 'minmax(60px, 1fr)',  align: 'center' },
  { field: 'abc',   header: 'ABC-XYZ', width: '60px',  align: 'center',
    format: (v) => <span style={{ padding: '1px 6px', borderRadius: 8, backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 700, fontSize: 9.5 }}>{v}</span> },
  { field: 'stock', header: '현 재고', width: '80px',  align: 'right',  mono: true },
  { field: 'qty',   header: '수량',    width: '60px',  align: 'right',  mono: true },
  { field: 'days',  header: '재고 일수', width: '70px', align: 'right', mono: true },
];

// 부진 재고 (재고 일수 그룹별 금액)
const SLOW_DATA = [
  { range: '> 240',     amt: 1.9 },
  { range: '180 ~ 240', amt: 0.4 },
  { range: '90 ~ 180',  amt: 0.25 },
  { range: '61 ~ 90',   amt: 0.1 },
  { range: '30 ~ 60',   amt: 0.05 },
];

function SlowHBar() {
  const max = Math.max(...SLOW_DATA.map((d) => d.amt));
  return (
    <Box sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 1 }}>부진 재고 현황</Typography>
      <Stack spacing={0.5} sx={{ flex: 1 }}>
        {SLOW_DATA.map((d) => (
          <Stack key={d.range} direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontSize: 10, color: '#64748b', width: 70, textAlign: 'right' }}>{d.range}</Typography>
            <Box sx={{ flex: 1, height: 18, bgcolor: '#f1f5f9', position: 'relative', borderRadius: 0.3 }}>
              <Box sx={{ position: 'absolute', inset: 0, width: `${(d.amt / max) * 100}%`, bgcolor: '#3b82f6', borderRadius: 0.3 }} />
            </Box>
            <Typography sx={{ fontSize: 10, fontFamily: 'monospace', width: 50, textAlign: 'right' }}>
              ${d.amt}B
            </Typography>
          </Stack>
        ))}
      </Stack>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5, pl: 9 }}>
        {['$0', '$200M', '$400M', '$600M', '$800M', '$1B', '$1.2B', '$1.4B', '$1.6B', '$1.8B', '$2B'].map((t) => (
          <Typography key={t} sx={{ fontSize: 8.5, color: '#94a3b8' }}>{t}</Typography>
        ))}
      </Stack>
      <Typography sx={{ fontSize: 10, color: '#6b7280', textAlign: 'center', mt: 0.5 }}>재고금액</Typography>
    </Box>
  );
}

function ObsoletePieBar() {
  const unusable = 28;
  // 좌→우 점차 작아지면서 색상도 진한 파랑 → 연한 파랑 그라데이션
  const locations = [
    { lbl: 'AnSeong RDC',    v: 1.20, color: '#1e40af' },
    { lbl: 'Praha RDC',      v: 0.85, color: '#2563eb' },
    { lbl: 'LA RDC',         v: 0.62, color: '#3b82f6' },
    { lbl: 'Ulsan CDC',      v: 0.48, color: '#60a5fa' },
    { lbl: 'NamWon RDC',     v: 0.35, color: '#93c5fd' },
    { lbl: 'New Delhi RDC',  v: 0.25, color: '#bfdbfe' },
    { lbl: 'Daejeon CDC',    v: 0.15, color: '#dbeafe' },
  ];
  const yMax = 1.2;

  const cx = 50 + 40 * Math.cos(((360 * unusable) / 100 - 90) * Math.PI / 180);
  const cy = 50 + 40 * Math.sin(((360 * unusable) / 100 - 90) * Math.PI / 180);

  return (
    <Box sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.5, flexShrink: 0 }}>불용 재고 현황</Typography>
      {/* AMT/% toggle */}
      <Box sx={{
        flexShrink: 0, mb: 0.75,
        display: 'inline-flex', alignSelf: 'flex-start', width: 'fit-content',
        border: '1px solid #d1d5db', borderRadius: 0.5, overflow: 'hidden',
      }}>
        <Box sx={{ px: 0.75, py: 0.15, bgcolor: '#2563eb', color: '#fff', fontSize: 10, fontWeight: 700 }}>AMT</Box>
        <Box sx={{ px: 0.75, py: 0.15, fontSize: 10, fontWeight: 600, color: '#6b7280', borderLeft: '1px solid #d1d5db' }}>%</Box>
      </Box>

      {/* 좌측 Pie / 우측 거점별 막대 차트 */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '0.8fr 1.4fr', gap: 1.5 }}>
        {/* 좌측 Pie + 가용/불용 범례 */}
        <Stack alignItems="center" sx={{ minWidth: 0, minHeight: 0 }}>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 0 }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={{ maxWidth: 160, maxHeight: 160 }}>
              <circle cx={50} cy={50} r={40} fill="#3b82f6" />
              <path d={`M 50 50 L 50 10 A 40 40 0 0 1 ${cx} ${cy} Z`} fill="#fb923c" />
            </svg>
          </Box>
          {/* 가용/불용 체크박스 범례 — 하단 가운데 */}
          <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0, pt: 0.75 }}>
            {[
              { c: '#3b82f6', l: '가용' },
              { c: '#fb923c', l: '불용' },
            ].map((it) => (
              <Stack key={it.l} direction="row" alignItems="center" spacing={0.4}>
                <Box sx={{
                  width: 11, height: 11,
                  bgcolor: '#3b82f6', borderRadius: 0.3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 8, fontWeight: 900, lineHeight: 1,
                }}>✓</Box>
                <Box sx={{ width: 12, height: 10, bgcolor: it.c, borderRadius: 0.2 }} />
                <Typography sx={{ fontSize: 10, color: '#374151' }}>{it.l}</Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>

        {/* 우측 거점별 막대 차트 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
            {/* Y축 라벨 */}
            <Box sx={{
              width: 40,
              display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between',
              pr: 0.5, pb: 2.5,
            }}>
              {['$0', '$400K', '$800K', '$1.2M'].map((t) => (
                <Typography key={t} sx={{ fontSize: 9, color: '#94a3b8', textAlign: 'right', lineHeight: 1 }}>{t}</Typography>
              ))}
            </Box>
            {/* 막대 영역 */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
                {/* gridlines */}
                {[0, 1 / 3, 2 / 3, 1].map((p) => (
                  <Box key={p} sx={{ position: 'absolute', left: 0, right: 0, top: `${p * 100}%`, borderTop: '1px dashed #e5e7eb' }} />
                ))}
                {/* bars */}
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', gap: 0.5 }}>
                  {locations.map((b) => (
                    <Box key={b.lbl} sx={{
                      flex: 1, display: 'flex',
                      alignItems: 'flex-end', justifyContent: 'center',
                      minWidth: 0,
                    }}>
                      <Box sx={{
                        width: '70%', maxWidth: 30,
                        height: `${(b.v / yMax) * 100}%`,
                        bgcolor: b.color,
                      }} />
                    </Box>
                  ))}
                </Box>
              </Box>
              {/* X축 라벨 — 거점명 */}
              <Box sx={{ display: 'flex', mt: 0.4, height: 22 }}>
                {locations.map((b) => (
                  <Box key={b.lbl} sx={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}>
                    <Typography sx={{
                      fontSize: 8.5, color: '#64748b',
                      transform: 'rotate(-18deg)',
                      transformOrigin: 'center top',
                      whiteSpace: 'nowrap',
                    }}>
                      {b.lbl}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function DashInventoryStateMockup() {
  return (
    <MockShell
      patternCode="dash_inventory_state"
      patternLabel="재고 현황"
      layoutCategory="LAYOUT_DASHBOARD"
      description="UI_SA_INVENTORY_STATE — 추이 KPI 3종 + 품절/과잉 상위 10 그리드 + 부진/불용 재고 (inventoryplan/analysis/InventoryBoard)"
    >
      <Box sx={{ p: 1.5, height: '100%', bgcolor: '#f4f6f9', display: 'flex', flexDirection: 'column', gap: 1.5, overflow: 'hidden' }}>
        {/* 상단 3 KPI */}
        <Stack direction="row" spacing={1.5} sx={{ flex: '0 0 auto' }}>
          <KpiSparkline title="재고 추이" dateLeft="2025-07-01" valueLeft="$81.2M" dateRight="2026-02-01" valueRight="$86.1M"
            data={[810, 815, 820, 825, 818, 821, 819, 823, 824, 822, 825, 828, 830, 829, 856, 861]} color="#3b82f6" />
          <KpiSparkline title="판매 추이" dateLeft="2025-07-01" valueLeft="$5B"   dateRight="2026-02-01" valueRight="$5.7B"
            data={[50, 51, 52, 53, 50, 51, 50, 49, 51, 52, 51, 53, 54, 55, 56, 57]} color="#3b82f6" />
          <KpiSparkline title="재고 일수 추이" dateLeft="2025-07-01" valueLeft="7일" dateRight="2026-02-01" valueRight="4일"
            data={[7, 7, 8, 8, 7, 8, 9, 8, 10, 9, 8, 7, 6, 5, 4, 4]} color="#3b82f6" />
        </Stack>

        {/* 중단 — 품절/과잉 그리드 */}
        <Box sx={{ flex: 1.4, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, p: 1, borderBottom: '1px solid #e5e7eb' }}>품절 경고 (상위 10)</Typography>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <MiniGrid columns={STOCKOUT_COLS} rows={STOCKOUT_ROWS} />
            </Box>
          </Card>
          <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, p: 1, borderBottom: '1px solid #e5e7eb' }}>과잉 경고 (상위 10)</Typography>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <MiniGrid columns={EXCESS_COLS} rows={EXCESS_ROWS} />
            </Box>
          </Card>
        </Box>

        {/* 하단 — 부진/불용 */}
        <Box sx={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <Card variant="outlined" sx={{ minHeight: 0 }}>
            <SlowHBar />
          </Card>
          <Card variant="outlined" sx={{ minHeight: 0 }}>
            <ObsoletePieBar />
          </Card>
        </Box>
      </Box>
    </MockShell>
  );
}

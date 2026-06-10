import React from 'react';
import { Box, Typography, Stack, Card } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MockShell from '../_shared/MockShell';

/**
 * UI_SA_LOCATION_INVENTORY_STATE · 거점 재고 현황 — PDF page 7 디자인 기반
 *
 *   상단: 4 KPI (총 수요 / 현 재고 + 도넛 / 품질 위험 SKU 건수 / 잠재적 품질 손실)
 *   하단: 좌 Map (한국 거점 마커) + 우 거점 재고 현황 그리드 (No / 거점명 / 현 재고 / 보유/목표 bar / 재고 추이 / ⚠ / 잠재적 손실)
 */

function KpiCard({ label, value, sub, color = '#1f2937', extra }) {
  return (
    <Card variant="outlined" sx={{ p: 1.5, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Typography sx={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{label}</Typography>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
        <Stack direction="row" alignItems="baseline" spacing={0.5}>
          <Typography sx={{ fontSize: 24, fontWeight: 700, color }}>{value}</Typography>
        </Stack>
        {extra}
      </Stack>
      {sub && <Typography sx={{ fontSize: 10.5, color: '#6b7280' }}>{sub}</Typography>}
    </Card>
  );
}

// 미니 도넛 (현 재고 카드 우측)
function MiniDonut({ pct = 3.4 }) {
  const r = 18, c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return (
    <Stack alignItems="center" spacing={0}>
      <svg width="46" height="46" viewBox="0 0 50 50">
        <circle cx={25} cy={25} r={r} fill="none" stroke="#e5e7eb" strokeWidth={6} />
        <circle cx={25} cy={25} r={r} fill="none" stroke="#3b82f6" strokeWidth={6}
                strokeDasharray={c} strokeDashoffset={offset}
                transform="rotate(-90 25 25)" strokeLinecap="round" />
        <text x={25} y={29} fontSize={10} textAnchor="middle" fontWeight={700} fill="#1f2937">{pct}%</text>
      </svg>
    </Stack>
  );
}

// 미니 sparkline (재고 추이)
function MiniLine({ data, color = '#10b981', height = 24 }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const dx = 100 / (data.length - 1);
  const pts = data.map((v, i) => `${(i * dx).toFixed(1)},${(height - ((v - min) / range) * (height - 4) - 2).toFixed(1)}`).join(' ');
  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const LOCAT_ROWS = [
  { no: 1, name: 'NamWon RDC',   color: '#10b981', stock: '$21.4M', stockNum: 21.4, target: 24.3,  delta: '4%',   trendColor: '#10b981', trend: [10, 11, 12, 12, 14, 13, 15, 16, 14, 15],  riskColor: '#f59e0b', loss: '$13.9M' },
  { no: 2, name: 'Praha RDC',    color: '#ef4444', stock: '$18M',   stockNum: 18,   target: 18.6,  delta: '26%',  trendColor: '#10b981', trend: [12, 13, 14, 15, 16, 14, 15, 16, 18, 18],  riskColor: '#f59e0b', loss: '$11.9M' },
  { no: 3, name: 'AnSeong RDC',  color: '#10b981', stock: '$13.3M', stockNum: 13.3, target: 33.7,  delta: '-8%',  trendColor: '#ef4444', trend: [16, 15, 14, 13, 12, 11, 12, 11, 13, 13],  riskColor: '#f59e0b', loss: '$17.8M' },
  { no: 4, name: 'LA RDC',       color: '#fb923c', stock: '$12.1M', stockNum: 12.1, target: 19.9,  delta: '-33%', trendColor: '#ef4444', trend: [22, 20, 18, 16, 15, 14, 13, 12, 12, 12],  riskColor: '#f59e0b', loss: '$13.3M' },
  { no: 5, name: 'New Delhi RDC', color: '#3b82f6', stock: '$9.7M',  stockNum: 9.7,  target: 18.8,  delta: '5%',   trendColor: '#10b981', trend: [7, 8, 8, 9, 9, 10, 10, 9, 10, 10],        riskColor: '#f59e0b', loss: '$9.6M' },
  { no: 6, name: 'Daejeon CDC',  color: '#10b981', stock: '$6.3M',  stockNum: 6.3,  target: 24.9,  delta: '-11%', trendColor: '#ef4444', trend: [9, 8, 8, 7, 7, 7, 6, 7, 6, 6],            riskColor: '#f59e0b', loss: '$17M'   },
  { no: 7, name: 'Ulsan CDC',    color: '#fb923c', stock: '$5.3M',  stockNum: 5.3,  target: 33.3,  delta: '-21%', trendColor: '#ef4444', trend: [9, 8, 8, 7, 7, 6, 6, 5, 5, 5],            riskColor: '#f59e0b', loss: '$25.5M' },
];

function KoreaMap() {
  // 한국 본토 단순화된 SVG path + 도시 라벨 + 거점 마커
  return (
    <Box sx={{
      position: 'relative', width: '100%', height: '100%',
      bgcolor: '#fafbfc', borderRadius: 0.5, overflow: 'hidden',
      border: '1px solid #e5e7eb',
    }}>
      <svg
        width="100%" height="100%"
        viewBox="0 0 400 580"
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* 배경 */}
        <rect width="400" height="580" fill="#fafbfc" />

        {/* 한국 본토 윤곽 (남한 위주, 단순화) */}
        <path
          d="M 195 55
             Q 220 50 245 60
             L 268 75
             Q 280 95 288 120
             L 293 150
             Q 285 178 272 195
             L 277 215
             Q 290 240 296 275
             L 290 315
             Q 280 350 268 380
             L 258 415
             Q 240 445 220 465
             L 200 478
             Q 188 482 175 472
             L 162 460
             Q 148 442 140 420
             L 132 388
             Q 127 350 130 315
             L 130 280
             Q 125 248 130 215
             L 138 188
             Q 142 158 135 130
             L 138 105
             Q 150 78 170 65
             L 185 58
             Q 190 55 195 55 Z"
          fill="#e8edf2"
          stroke="#9ca3af"
          strokeWidth={1.2}
        />

        {/* 제주도 */}
        <ellipse cx="180" cy="525" rx="22" ry="11" fill="#e8edf2" stroke="#9ca3af" strokeWidth={1} />

        {/* 작은 도시 라벨들 */}
        <text x="208" y="115" fontSize="10" fill="#94a3b8" textAnchor="middle" fontWeight="500">서울</text>
        <text x="208" y="135" fontSize="9" fill="#9ca3af" textAnchor="middle">·</text>

        <text x="200" y="220" fontSize="10" fill="#94a3b8" textAnchor="middle" fontWeight="500">대전</text>
        <text x="200" y="232" fontSize="9" fill="#9ca3af" textAnchor="middle">·</text>

        <text x="178" y="370" fontSize="10" fill="#94a3b8" textAnchor="middle" fontWeight="500">광주</text>
        <text x="178" y="382" fontSize="9" fill="#9ca3af" textAnchor="middle">·</text>

        <text x="240" y="350" fontSize="10" fill="#94a3b8" textAnchor="middle" fontWeight="500">대구</text>
        <text x="240" y="362" fontSize="9" fill="#9ca3af" textAnchor="middle">·</text>

        <text x="265" y="425" fontSize="10" fill="#94a3b8" textAnchor="middle" fontWeight="500">부산</text>
        <text x="265" y="437" fontSize="9" fill="#9ca3af" textAnchor="middle">·</text>

        <text x="180" y="540" fontSize="9" fill="#94a3b8" textAnchor="middle">제주</text>
      </svg>

      {/* 거점 마커들 - 한국 지형에 맞춰 배치 */}
      {[
        { x: 50, y: 26, color: '#10b981', label: 'AnSeong RDC' },    // 안성 (경기 남부)
        { x: 52, y: 48, color: '#10b981', label: 'Daejeon CDC' },    // 대전 (중부)
        { x: 45, y: 65, color: '#3b82f6', label: 'New Delhi RDC' },  // 광주/전남쪽
        { x: 68, y: 72, color: '#fb923c', label: 'Ulsan CDC' },      // 울산 (남동)
      ].map((m) => (
        <Box
          key={m.label}
          sx={{
            position: 'absolute',
            left: `${m.x}%`,
            top: `${m.y}%`,
            transform: 'translate(-50%, -100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <LocationOnIcon sx={{
            color: m.color,
            fontSize: 28,
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))',
          }} />
          <Typography sx={{
            fontSize: 11,
            fontWeight: 700,
            color: m.color,
            whiteSpace: 'nowrap',
            mt: -0.5,
            // 흰색 외곽선으로 가독성 향상 (지도 위에 글자가 잘 보이도록)
            textShadow: '0 0 3px #fff, 0 0 3px #fff, 0 0 3px #fff, 0 0 3px #fff',
          }}>
            {m.label}
          </Typography>
        </Box>
      ))}

      {/* Google 로고 + 저작권 표시 (좌하 / 우하) */}
      <Typography sx={{
        position: 'absolute', bottom: 6, left: 8,
        fontSize: 12, color: '#5f6368', fontWeight: 600,
        fontFamily: '"Product Sans", Roboto, Arial, sans-serif',
      }}>
        Google
      </Typography>
      <Typography sx={{
        position: 'absolute', bottom: 6, right: 8,
        fontSize: 8.5, color: '#94a3b8',
      }}>
        키보드 단축키 · 지도 데이터 ©2026 Google, TMap Mobility · 약관
      </Typography>
    </Box>
  );
}

export default function DashLocationInventoryStateMockup() {
  return (
    <MockShell
      patternCode="dash_location_inventory_state"
      patternLabel="거점 재고 현황"
      layoutCategory="LAYOUT_DASHBOARD"
      description="UI_SA_LOCATION_INVENTORY_STATE — KPI 4종 + Korea Map + 거점 재고 현황 그리드 (inventoryplan/analysis/InventoryLocationBoard)"
    >
      <Box sx={{ p: 1.5, height: '100%', bgcolor: '#f4f6f9', display: 'flex', flexDirection: 'column', gap: 1.5, overflow: 'hidden' }}>
        {/* 상단 4 KPI */}
        <Stack direction="row" spacing={1.5} sx={{ flex: '0 0 auto' }}>
          <KpiCard label="총 수요"            value="$2.5B" sub="이전 수요 대비"     color="#1f2937"
                   extra={<Typography sx={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>+90% ↗</Typography>} />
          <KpiCard label="현 재고"            value="$85M"  sub="수요 대비"          color="#1f2937"
                   extra={<MiniDonut pct={3.4} />} />
          <KpiCard label="품질 위험 SKU 건수"  value="113"   sub="113 전 필"          color="#ef4444"
                   extra={<WarningAmberIcon sx={{ color: '#ef4444', fontSize: 22 }} />} />
          <KpiCard label="잠재적 품질 손실"    value="$109M" sub=""                  color="#1f2937" />
        </Stack>

        {/* 하단 — 거점 재고 현황 (Map + Grid 분할) */}
        <Card variant="outlined" sx={{ flex: 1, minHeight: 0, p: 1.5, display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 1 }}>거점 재고 현황</Typography>
          <Box sx={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 1 }}>
            <KoreaMap />

            {/* Grid */}
            <Box sx={{ height: '100%', overflow: 'auto' }}>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '36px 1.4fr 0.8fr 1.4fr 0.8fr 0.8fr 0.5fr 0.9fr',
                fontSize: 11, minWidth: '100%',
              }}>
                {['No.', '거점 명', '현 재고', '보유 / 목표', '재고 추이', '품질 경고', '', '잠재적 품질 손실'].map((h, i) => (
                  <Box key={i} sx={{
                    px: 0.5, py: 0.5, bgcolor: '#eef2f7', borderBottom: '1px solid #cbd5e1',
                    fontWeight: 700, fontSize: 10, color: '#374151', display: 'flex', alignItems: 'center',
                    textAlign: i === 0 || i === 5 || i === 6 ? 'center' : 'left',
                    justifyContent: i === 0 || i === 5 || i === 6 ? 'center' : 'flex-start',
                  }}>
                    {h}
                  </Box>
                ))}
                {LOCAT_ROWS.map((r, ri) => {
                  const cells = [
                    <span style={{ textAlign: 'center' }}>{r.no}</span>,
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <LocationOnIcon sx={{ color: r.color, fontSize: 14 }} />
                      <span>{r.name}</span>
                    </Stack>,
                    <span style={{ fontFamily: 'monospace' }}>{r.stock}</span>,
                    <Stack sx={{ width: '100%' }}>
                      <Box sx={{ position: 'relative', height: 10, bgcolor: '#dbeafe', borderRadius: 0.3 }}>
                        <Box sx={{ position: 'absolute', inset: 0, width: `${(r.stockNum / r.target) * 100}%`, bgcolor: '#3b82f6', borderRadius: 0.3 }} />
                      </Box>
                      <Typography sx={{ fontSize: 9, color: '#3b82f6', mt: 0.2 }}>
                        <span style={{ fontFamily: 'monospace' }}>{r.stock} / ${r.target}M</span>
                      </Typography>
                    </Stack>,
                    <Stack sx={{ width: '100%' }}>
                      <Typography sx={{ fontSize: 10, fontWeight: 600, color: r.trendColor, mb: 0.2 }}>
                        {r.delta} {r.delta.startsWith('-') ? '↘' : '↗'}
                      </Typography>
                      <MiniLine data={r.trend} color={r.trendColor} height={18} />
                    </Stack>,
                    <WarningAmberIcon sx={{ color: r.riskColor, fontSize: 16 }} />,
                    null,
                    <span style={{ fontFamily: 'monospace' }}>{r.loss}</span>,
                  ];
                  return cells.map((cell, ci) => (
                    <Box key={`${ri}-${ci}`} sx={{
                      px: 0.5, py: 0.5, borderBottom: '1px solid #f1f5f9',
                      bgcolor: ri % 2 === 0 ? '#fff' : '#fafbfc',
                      display: 'flex', alignItems: 'center',
                      justifyContent: ci === 0 || ci === 5 ? 'center' : 'flex-start',
                      minWidth: 0,
                    }}>
                      {cell}
                    </Box>
                  ));
                })}
              </Box>
            </Box>
          </Box>
        </Card>
      </Box>
    </MockShell>
  );
}

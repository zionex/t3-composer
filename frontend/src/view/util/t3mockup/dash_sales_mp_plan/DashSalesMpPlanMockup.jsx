import React from 'react';
import { Box, Typography, Stack, Card } from '@mui/material';
import MockShell from '../_shared/MockShell';

/**
 * UI_SA_SALES_MP_PLAN · RTF 충족률 — PDF page 13 디자인 기반
 *
 *   상단: RTF 충족율 — 큰 차트 (월별 막대 + 100% dot 라인) + 우측 범례
 *   중단: 3개 도넛 (영업그룹별 / 거래형태별 / 제품군별)
 *   하단: 영업조직/거래형태/제품군 월별 RTF 충족률 분석 PIVOT 그리드
 */

const RTF_MONTHS = ['202311','202312','202313','202314','202315','202316','202317','202318','202319','202320','202321','202322','202323','202324','202325','202326'];

function RtfMainChart() {
  return (
    <Box sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>RTF 충족율</Typography>
        <Box sx={{ fontSize: 14, color: '#94a3b8' }}>⇄</Box>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <Box sx={{ width: 70, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pr: 0.5, pb: 2.5 }}>
          {['0', '4,000,000', '8,000,000', '12,000,000'].map((t) => (
            <Typography key={t} sx={{ fontSize: 9, color: '#94a3b8', textAlign: 'right' }}>{t}</Typography>
          ))}
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
            {[0, 0.25, 0.5, 0.75, 1].map((p) => (
              <Box key={p} sx={{ position: 'absolute', left: 0, right: 0, top: `${p * 100}%`, borderTop: '1px dashed #e5e7eb' }} />
            ))}
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex' }}>
              {RTF_MONTHS.map((m, i) => (
                <Box key={m} sx={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '2px', minWidth: 0 }}>
                  <Box sx={{ width: '22%', maxWidth: 8, height: '65%', bgcolor: '#cbd5e1' }} />
                  <Box sx={{ width: '22%', maxWidth: 8, height: '65%', bgcolor: '#fb923c' }} />
                  <Box sx={{ width: '22%', maxWidth: 8, height: '65%', bgcolor: '#fde68a' }} />
                </Box>
              ))}
            </Box>
            {/* 100% 라인 위에 dot */}
            {RTF_MONTHS.map((m, i) => (
              <React.Fragment key={i}>
                <Box sx={{
                  position: 'absolute',
                  left: `${((i + 0.5) / RTF_MONTHS.length) * 100}%`,
                  top: '5%',
                  width: 7, height: 7, bgcolor: '#fb923c', border: '1.5px solid #fff', borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  boxShadow: '0 0 0 0.5px #fb923c',
                }} />
                <Typography sx={{
                  position: 'absolute',
                  left: `${((i + 0.5) / RTF_MONTHS.length) * 100}%`,
                  top: '0%',
                  transform: 'translate(-50%, 0)',
                  fontSize: 8, fontWeight: 700, color: '#fb923c',
                }}>100%</Typography>
              </React.Fragment>
            ))}
          </Box>
          <Box sx={{ display: 'flex', mt: 0.3 }}>
            {RTF_MONTHS.map((m) => (
              <Typography key={m} sx={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#94a3b8', minWidth: 0 }}>
                {m}
              </Typography>
            ))}
          </Box>
        </Box>
        <Stack sx={{ width: 90, pl: 1 }} spacing={0.4}>
          {[
            { c: '#cbd5e1', l: '경영계획' },
            { c: '#fb923c', l: '판매계획' },
            { c: '#fde68a', l: '예측-공급가능' },
            { c: '#fb923c', l: 'RTF충족율', dot: true },
          ].map((it) => (
            <Stack key={it.l} direction="row" alignItems="center" spacing={0.4}>
              {it.dot
                ? <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: it.c }} />
                : <Box sx={{ width: 12, height: 10, bgcolor: it.c, borderRadius: 0.2 }} />}
              <Typography sx={{ fontSize: 10 }}>{it.l}</Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

function Pie({ title, items }) {
  const total = items.reduce((s, it) => s + it.v, 0);
  let cum = 0;
  return (
    <Box sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.5 }}>{title}</Typography>
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Stack alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ maxHeight: 150 }}>
            {items.map((it, i) => {
              const sa = (cum / total) * 2 * Math.PI - Math.PI / 2;
              cum += it.v;
              const ea = (cum / total) * 2 * Math.PI - Math.PI / 2;
              const r = 40;
              const x1 = 50 + r * Math.cos(sa), y1 = 50 + r * Math.sin(sa);
              const x2 = 50 + r * Math.cos(ea), y2 = 50 + r * Math.sin(ea);
              const large = (it.v / total) > 0.5 ? 1 : 0;
              return <path key={i} d={`M 50 50 L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`} fill={it.c} stroke="#fff" strokeWidth="0.5" />;
            })}
          </svg>
        </Stack>
        <Stack spacing={0.3} sx={{ minWidth: 90 }}>
          {items.map((it) => (
            <Stack key={it.l} direction="row" alignItems="center" spacing={0.4}>
              <Box sx={{ width: 10, height: 10, bgcolor: it.c, borderRadius: 0.2 }} />
              <Typography sx={{ fontSize: 10 }}>{it.l}</Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

const SALES_GRP    = [
  { l: '동물약품',   v: 35, c: '#f97316' },
  { l: '비료',       v: 25, c: '#fb923c' },
  { l: '작물보호',   v: 20, c: '#fdba74' },
  { l: '종자',       v: 20, c: '#fed7aa' },
];
const ACCOUNT_TP   = [
  { l: '계동',        v: 30, c: '#b91c1c' },
  { l: '로컬수출',    v: 30, c: '#dc2626' },
  { l: '시판',        v: 22, c: '#f87171' },
  { l: '직수출',      v: 18, c: '#fca5a5' },
];
const ITEM_GRP     = [
  { l: '바이오텍_가정용',      v: 18, c: '#fb923c' },
  { l: '세계스급유원물',       v: 16, c: '#ec4899' },
  { l: '정밀정밀화학',         v: 14, c: '#f472b6' },
  { l: '한농)동물약품',        v: 12, c: '#f9a8d4' },
  { l: '한농)비료',           v: 10, c: '#86efac' },
  { l: '한농)식물보호',        v:  9, c: '#fde68a' },
  { l: '한농)정밀화학',        v:  8, c: '#fcd34d' },
  { l: '한농)종자',           v:  7, c: '#a78bfa' },
  { l: '환위)동물비비미니',     v:  6, c: '#ef4444' },
];

// PIVOT 그리드 (영업조직/거래형태/제품군 월별 RTF 충족률 분석)
const PIVOT_GROUPS = [
  {
    type: 'DOMES...', salesGroup: '동물약품', accountType: '계동', itemGroup: '바이오텍_가정...', itemName: '엠에사망 리본레페드 알반형 50매',
    months: [
      { alert: 'g', forecast: 11643, rate: 100, plan: 11643 },
      { alert: 'g', forecast: 15900, rate: 100, plan: 15900 },
      { alert: 'g', forecast: 15400, rate: 100, plan: 15400 },
      { alert: 'g', forecast: 15000, rate: null, plan: null },
    ],
  },
  {
    type: '', salesGroup: '', accountType: '', itemGroup: '', itemName: '강옥도링크 액체 450ML',
    months: [
      { alert: 'g', forecast: 10857, rate: 100, plan: 10857 },
      { alert: 'g', forecast: 15800, rate: 100, plan: 15800 },
      { alert: 'g', forecast: 16400, rate: 100, plan: 16400 },
      { alert: 'g', forecast: 16300, rate: null, plan: null },
    ],
  },
  {
    type: '', salesGroup: '', accountType: '한농)동봉약품', itemGroup: '', itemName: '독시클린 액체 1L',
    months: [
      { alert: 'g', forecast: 11714, rate: 100, plan: 11714 },
      { alert: 'g', forecast: 16300, rate: 100, plan: 16300 },
      { alert: 'g', forecast: 15900, rate: 100, plan: 15900 },
      { alert: 'g', forecast: 15400, rate: null, plan: null },
    ],
  },
  {
    type: '', salesGroup: '', accountType: '', itemGroup: '', itemName: '라비다이 산제 20KG',
    months: [
      { alert: 'g', forecast: 11643, rate: 100, plan: 11643 },
      { alert: 'g', forecast: 15900, rate: 100, plan: 15900 },
      { alert: 'g', forecast: 15400, rate: 100, plan: 15400 },
      { alert: 'g', forecast: 15000, rate: null, plan: null },
    ],
  },
  {
    type: '', salesGroup: '', accountType: '', itemGroup: '', itemName: '바이오쇼라 산제 1KG',
    months: [
      { alert: 'g', forecast: 11001, rate: 100, plan: 11001 },
      { alert: 'g', forecast: 15000, rate: 100, plan: 15000 },
      { alert: 'g', forecast: 15200, rate: 100, plan: 15200 },
      { alert: 'g', forecast: 15800, rate: null, plan: null },
    ],
  },
  {
    type: '', salesGroup: '', accountType: '', itemGroup: '', itemName: '비타마네 산제 1KG',
    months: [
      { alert: 'g', forecast: 10715, rate: 100, plan: 10715 },
      { alert: 'g', forecast: 15200, rate: 100, plan: 15200 },
      { alert: 'g', forecast: 15800, rate: 100, plan: 15800 },
      { alert: 'g', forecast: 16400, rate: null, plan: null },
    ],
  },
];
const PIVOT_MONTHS = ['202311', '202312', '202313', '202314'];

export default function DashSalesMpPlanMockup() {
  return (
    <MockShell
      patternCode="dash_sales_mp_plan"
      patternLabel="RTF 충족률"
      layoutCategory="LAYOUT_DASHBOARD"
      description="UI_SA_SALES_MP_PLAN — RTF 월별 충족율 큰 차트 + 3 도넛 + 월별 PIVOT 그리드 (snop/mdb/SalesMPPlan)"
    >
      <Box sx={{ p: 1.5, height: '100%', bgcolor: '#f4f6f9', display: 'flex', flexDirection: 'column', gap: 1.5, overflow: 'hidden' }}>
        {/* 상단: RTF 충족율 차트 */}
        <Card variant="outlined" sx={{ flex: 1, minHeight: 0 }}><RtfMainChart /></Card>

        {/* 중단: 3 도넛 */}
        <Box sx={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
          <Card variant="outlined" sx={{ minHeight: 0 }}><Pie title="영업그룹별 RTF 할당 비율"   items={SALES_GRP} /></Card>
          <Card variant="outlined" sx={{ minHeight: 0 }}><Pie title="거래형태별 RTF 할당 비율"   items={ACCOUNT_TP} /></Card>
          <Card variant="outlined" sx={{ minHeight: 0 }}><Pie title="제품군별 RTF 할당 비율"     items={ITEM_GRP} /></Card>
        </Box>

        {/* 하단: PIVOT 그리드 */}
        <Card variant="outlined" sx={{ flex: 1.2, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, p: 1, borderBottom: '1px solid #e5e7eb' }}>
            영업조직/거래형태/제품군 월별 RTF 충족율 분석
          </Typography>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: `40px 70px 70px 60px 80px minmax(160px, 1.5fr) repeat(${PIVOT_MONTHS.length}, minmax(180px, 1.5fr))`,
              fontSize: 10.5, minWidth: '100%',
            }}>
              {/* Header row 1 */}
              {['No.', '내수/수출', '영업그룹', '거래형태', '제품군', '제품명'].map((h, i) => (
                <Box key={i} sx={{
                  bgcolor: '#eef2f7', borderBottom: '1px solid #cbd5e1', fontWeight: 700, fontSize: 10,
                  px: 0.5, py: 0.5, gridRow: 'span 2', borderRight: '1px solid #e5e7eb',
                  display: 'flex', alignItems: 'center', justifyContent: i === 0 ? 'center' : 'flex-start',
                }}>{h}</Box>
              ))}
              {PIVOT_MONTHS.map((m) => (
                <Box key={m} sx={{
                  bgcolor: '#eef2f7', borderBottom: '1px solid #cbd5e1', fontWeight: 700, fontSize: 10,
                  px: 0.5, py: 0.3, textAlign: 'center', borderRight: '1px solid #e5e7eb',
                }}>{m}</Box>
              ))}
              {PIVOT_MONTHS.map((m) => (
                <Box key={m + '_sub'} sx={{
                  bgcolor: '#eef2f7', borderBottom: '1px solid #cbd5e1',
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', fontSize: 9, fontWeight: 700,
                  borderRight: '1px solid #e5e7eb',
                }}>
                  {['ALERT', '예측-공급가능', 'RTF적중률', '판매계획'].map((c) => (
                    <Box key={c} sx={{ p: 0.3, textAlign: 'center', borderLeft: '1px solid #e5e7eb' }}>{c}</Box>
                  ))}
                </Box>
              ))}
              {/* Data rows */}
              {PIVOT_GROUPS.map((g, ri) => {
                const cells = [
                  <Box key={`${ri}-no`}    sx={{ ...cellSx(ri), justifyContent: 'center' }}>{ri + 1}</Box>,
                  <Box key={`${ri}-type`}  sx={cellSx(ri)}>{g.type}</Box>,
                  <Box key={`${ri}-sg`}    sx={cellSx(ri)}>{g.salesGroup}</Box>,
                  <Box key={`${ri}-at`}    sx={cellSx(ri)}>{g.accountType}</Box>,
                  <Box key={`${ri}-ig`}    sx={cellSx(ri)}>{g.itemGroup}</Box>,
                  <Box key={`${ri}-name`}  sx={cellSx(ri)}>{g.itemName}</Box>,
                ];
                g.months.forEach((mo, mi) => {
                  cells.push(
                    <Box key={`${ri}-${mi}`} sx={{
                      ...cellSx(ri),
                      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                      p: 0, fontSize: 10.5,
                    }}>
                      <Box sx={{ p: 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box sx={{ width: 8, height: 8, bgcolor: '#10b981', borderRadius: '50%' }} />
                      </Box>
                      <Box sx={{ p: 0.4, textAlign: 'right', fontFamily: 'monospace' }}>{mo.forecast.toLocaleString()}</Box>
                      <Box sx={{ p: 0.4, textAlign: 'right', fontFamily: 'monospace' }}>{mo.rate != null ? mo.rate : ''}</Box>
                      <Box sx={{ p: 0.4, textAlign: 'right', fontFamily: 'monospace' }}>{mo.plan != null ? mo.plan.toLocaleString() : ''}</Box>
                    </Box>
                  );
                });
                return cells;
              })}
            </Box>
          </Box>
        </Card>
      </Box>
    </MockShell>
  );
}

function cellSx(ri) {
  return {
    px: 0.5, py: 0.4, borderBottom: '1px solid #f1f5f9',
    bgcolor: ri % 2 === 0 ? '#fff' : '#fafbfc',
    borderRight: '1px solid #e5e7eb',
    display: 'flex', alignItems: 'center',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  };
}

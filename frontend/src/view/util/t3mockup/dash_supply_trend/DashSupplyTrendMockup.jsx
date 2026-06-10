import React from 'react';
import { Box, Typography, Stack, Card } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MockShell from '../_shared/MockShell';

/**
 * UI_MP_SUPPLY_TREND · 거점별 공급/출하/재고 추이 — PDF page 9 디자인 기반
 *
 *   상단: 검색바 (거점 / 시작일~종료일 / 검색 버튼)
 *   상단2: 4 KPI (총 재고량 / 총 출하량 / 총 공급량 / 재고 회전율)
 *   중단: 공급/출하/재고 추이 (월별 막대 차트)
 *   하단: 재고 현황 PIVOT 그리드 (No / 품목 레벨 코드/명 / 품목 코드/명 / 총 재고량 / 총 공급량(1) / 총 출하량(2) / 차이)
 */

function KpiCard({ label, value }) {
  return (
    <Card variant="outlined" sx={{ p: 1.5, flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontSize: 11.5, color: '#374151', fontWeight: 500 }}>{label}</Typography>
      <Typography sx={{ fontSize: 22, fontWeight: 700, mt: 0.5, color: '#1f2937' }}>{value}</Typography>
    </Card>
  );
}

const TREND_MONTHS = ['2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05'];
const TREND_DATA = [180, 185, 175, 165, 160, 158, 155, 165, 170, 175, 178, 180];  // 백만 단위

const INV_ROWS = [
  { no: 1, lvlCd: '',           lvlNm: '',          code: '40048', name: '40048', stock: 244, supply: 22285,    ship: 59559384.14, diff: -59537099.14 },
  { no: 2, lvlCd: '',           lvlNm: '',          code: '40822', name: '40822', stock: 323, supply: 9666,     ship: 59618410.62, diff: -59608744.62 },
  { no: 3, lvlCd: 'ITEM_LVL2_01', lvlNm: 'Item Group 1', code: '41213', name: '41213', stock: 222, supply: 22796,    ship: 24228.26,    diff: -1432.26 },
  { no: 4, lvlCd: '',           lvlNm: '',          code: '41269', name: '41269', stock: 408, supply: 181712,   ship: 59562780.3,  diff: -59381068.3 },
  { no: 5, lvlCd: '',           lvlNm: '',          code: '41288', name: '41288', stock: 424, supply: 165329,   ship: 59618392.24, diff: -59453063.24 },
  { no: 6, lvlCd: '',           lvlNm: '',          code: '41289', name: '41289', stock: 219, supply: 20866,    ship: 20345.92,    diff: 520.08 },
  { no: 'Σ', lvlCd: '',         lvlNm: '',          code: '',     name: '전체 합계', stock: 12254, supply: 2976540, ship: 1370620945, diff: null, summary: true },
];

function SupplyTrendChart() {
  return (
    <Box sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>공급/출하/재고 추이</Typography>
        <Stack direction="row" spacing={1.5}>
          {[
            { c: '#cbd5e1', l: '총 재고량' },
            { c: '#fb923c', l: '총 공급량' },
            { c: '#3b82f6', l: '총 출하량' },
          ].map((it) => (
            <Stack key={it.l} direction="row" alignItems="center" spacing={0.4}>
              <Box sx={{ width: 12, height: 10, bgcolor: it.c, borderRadius: 0.2 }} />
              <Typography sx={{ fontSize: 10 }}>{it.l}</Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, mt: 1, display: 'flex' }}>
        <Box sx={{ width: 90, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pr: 0.5, pb: 2.5 }}>
          {['0', '100,000,000', '200,000,000'].map((t) => (
            <Typography key={t} sx={{ fontSize: 9, color: '#94a3b8', textAlign: 'right', lineHeight: 1 }}>{t}</Typography>
          ))}
          <Typography sx={{ fontSize: 9, color: '#94a3b8', textAlign: 'right', transform: 'rotate(-90deg)', whiteSpace: 'nowrap' }}>금액</Typography>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
            {[0, 0.33, 0.66, 1].map((p) => (
              <Box key={p} sx={{ position: 'absolute', left: 0, right: 0, top: `${p * 100}%`, borderTop: '1px dashed #e5e7eb' }} />
            ))}
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex' }}>
              {TREND_DATA.map((v, i) => (
                <Box key={i} sx={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', minWidth: 0 }}>
                  <Box sx={{ width: '50%', maxWidth: 28, height: `${(v / 200) * 100}%`, bgcolor: '#fb923c' }} />
                </Box>
              ))}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', mt: 0.5 }}>
            {TREND_MONTHS.map((m) => (
              <Typography key={m} sx={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#94a3b8', minWidth: 0 }}>{m}</Typography>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function DashSupplyTrendMockup() {
  return (
    <MockShell
      patternCode="dash_supply_trend"
      patternLabel="거점별 공급/출하/재고 추이"
      layoutCategory="LAYOUT_DASHBOARD"
      description="UI_MP_SUPPLY_TREND — 검색(거점+기간) + KPI 4종 + 월별 추이 막대 + 재고 현황 그리드 (masterplan/analysisreport/SupplyTrend)"
    >
      <Box sx={{ p: 1.5, height: '100%', bgcolor: '#f4f6f9', display: 'flex', flexDirection: 'column', gap: 1.5, overflow: 'hidden' }}>
        {/* 검색 영역 */}
        <Stack direction="row" spacing={1} sx={{ flex: '0 0 auto' }}>
          <Box sx={{ border: '1px solid #d1d5db', borderRadius: 0.5, px: 1, py: 0.4, bgcolor: '#fff', minWidth: 160 }}>
            <Typography sx={{ fontSize: 9.5, color: '#94a3b8' }}>거점</Typography>
            <Typography sx={{ fontSize: 12, color: '#1f2937', fontWeight: 600 }}>CDC-ULSAN ▾</Typography>
          </Box>
          <Box sx={{ border: '1px solid #d1d5db', borderRadius: 0.5, px: 1, py: 0.4, bgcolor: '#fff', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box>
              <Typography sx={{ fontSize: 9.5, color: '#94a3b8' }}>시작일</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600 }}>2025-06</Typography>
            </Box>
            <CalendarTodayIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
            <Typography sx={{ fontSize: 14, color: '#94a3b8', mx: 0.5 }}>~</Typography>
            <Box>
              <Typography sx={{ fontSize: 9.5, color: '#94a3b8' }}>종료일</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600 }}>2026-05</Typography>
            </Box>
            <CalendarTodayIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#2563eb', color: '#fff', borderRadius: 0.5, px: 1.5 }}>
            <SearchIcon sx={{ fontSize: 18 }} />
          </Box>
        </Stack>

        {/* KPI 4 */}
        <Stack direction="row" spacing={1.5} sx={{ flex: '0 0 auto' }}>
          <KpiCard label="총 재고량"   value="12,254" />
          <KpiCard label="총 출하량"   value="1,966,765,330.22" />
          <KpiCard label="총 공급량"   value="4,183,490" />
          <KpiCard label="재고 회전율" value="162,321.2" />
        </Stack>

        {/* 추이 차트 */}
        <Card variant="outlined" sx={{ flex: 1, minHeight: 0 }}>
          <SupplyTrendChart />
        </Card>

        {/* 재고 현황 그리드 */}
        <Card variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, p: 1, borderBottom: '1px solid #e5e7eb' }}>재고 현황</Typography>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '40px minmax(110px, 1fr) minmax(110px, 1fr) minmax(90px, 1fr) minmax(110px, 1fr) 90px 100px 130px 110px',
              fontSize: 11, minWidth: '100%',
            }}>
              {['No.', '품목 레벨 코드', '품목 레벨 명', '품목 코드', '품목 명', '총 재고량', '총 공급량 (1)', '총 출하량 (2)', '차이 (1) - (2)'].map((h, i) => (
                <Box key={i} sx={{
                  px: 0.6, py: 0.5, bgcolor: '#eef2f7', borderBottom: '1px solid #cbd5e1',
                  fontWeight: 700, fontSize: 10.5, display: 'flex', alignItems: 'center',
                  justifyContent: i === 0 ? 'center' : i >= 5 ? 'flex-end' : 'flex-start',
                }}>{h}</Box>
              ))}
              {INV_ROWS.map((r, ri) => {
                const isSummary = r.summary;
                return [
                  <Box key={`${ri}-0`} sx={{
                    px: 0.6, py: 0.5, borderBottom: '1px solid #f1f5f9',
                    bgcolor: isSummary ? '#fafbfc' : ri % 2 === 0 ? '#fff' : '#fafbfc',
                    fontWeight: isSummary ? 700 : 400,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{r.no}</Box>,
                  <Box key={`${ri}-1`} sx={{ px: 0.6, py: 0.5, borderBottom: '1px solid #f1f5f9', bgcolor: ri % 2 === 0 ? '#fff' : '#fafbfc', display: 'flex', alignItems: 'center' }}>{r.lvlCd}</Box>,
                  <Box key={`${ri}-2`} sx={{ px: 0.6, py: 0.5, borderBottom: '1px solid #f1f5f9', bgcolor: ri % 2 === 0 ? '#fff' : '#fafbfc', display: 'flex', alignItems: 'center' }}>{r.lvlNm}</Box>,
                  <Box key={`${ri}-3`} sx={{ px: 0.6, py: 0.5, borderBottom: '1px solid #f1f5f9', bgcolor: ri % 2 === 0 ? '#fff' : '#fafbfc', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>{r.code}</Box>,
                  <Box key={`${ri}-4`} sx={{ px: 0.6, py: 0.5, borderBottom: '1px solid #f1f5f9', bgcolor: ri % 2 === 0 ? '#fff' : '#fafbfc', display: 'flex', alignItems: 'center', fontWeight: isSummary ? 700 : 400 }}>{r.name}</Box>,
                  <Box key={`${ri}-5`} sx={{
                    px: 0.6, py: 0.5, borderBottom: '1px solid #f1f5f9',
                    bgcolor: '#dcfce7',  // 녹색 강조 (재고)
                    fontFamily: 'monospace', display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                    fontWeight: isSummary ? 700 : 500,
                  }}>{r.stock.toLocaleString()}</Box>,
                  <Box key={`${ri}-6`} sx={{
                    px: 0.6, py: 0.5, borderBottom: '1px solid #f1f5f9', bgcolor: ri % 2 === 0 ? '#fff' : '#fafbfc',
                    fontFamily: 'monospace', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontWeight: isSummary ? 700 : 400,
                  }}>{r.supply.toLocaleString()}</Box>,
                  <Box key={`${ri}-7`} sx={{
                    px: 0.6, py: 0.5, borderBottom: '1px solid #f1f5f9', bgcolor: ri % 2 === 0 ? '#fff' : '#fafbfc',
                    fontFamily: 'monospace', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontWeight: isSummary ? 700 : 400,
                  }}>{r.ship.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Box>,
                  <Box key={`${ri}-8`} sx={{
                    px: 0.6, py: 0.5, borderBottom: '1px solid #f1f5f9',
                    bgcolor: r.diff != null && r.diff < 0 ? '#fee2e2' : ri % 2 === 0 ? '#fff' : '#fafbfc',
                    fontFamily: 'monospace', display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                    color: r.diff != null && r.diff < 0 ? '#b91c1c' : '#1f2937',
                    fontWeight: 500,
                  }}>{r.diff != null ? r.diff.toLocaleString(undefined, { maximumFractionDigits: 2 }) : ''}</Box>,
                ];
              })}
            </Box>
          </Box>
        </Card>
      </Box>
    </MockShell>
  );
}

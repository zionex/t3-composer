import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import MockShell from '../_shared/MockShell';
import DashboardPanelMock from '../_shared/DashboardPanelMock';

/**
 * UI_SA_SALES_PLAN_STATE_DETAIL · 판매계획 대비 실적 상세 (snop/mdb/SalesPlanStateDetail)
 *
 * 원본 wingui 화면 그대로:
 *   1. WI_SNOP_SALESPLANDETAILBAR (w=12 h=6)
 *      - 월별(yyyyMM) BP/Plan/Actual 막대 3개 + 적중률 빨간 점선 라인
 *      - 좌 Y축 금액 / 우 Y축 % / 우측 범례
 *   2. WI_SNOP_SALESPLANDETAILGRID (w=12 h=14)
 *      - PIVOT 그리드
 *      - 좌측 식별 컬럼: No./내수수출/영업그룹/영업지역/거래형태/거래처/제품군/제품명/구분
 *      - 우측 시계열 컬럼: 월별 (yyyyMM × N)
 *      - 한 (거래처×제품) 조합 = 4행 stack (경영계획/판매계획/판매실적/판매적중률)
 *      - 동일 그룹의 식별 컬럼은 첫 row 만 표시 (cell merge 효과)
 */

// ─────────────────────────────────────────
// 차트 데이터 (16개월)
// ─────────────────────────────────────────
const CHART_MONTHS = [
  '202311','202312','202313','202314','202315','202316','202317','202318',
  '202319','202320','202321','202322','202323','202324','202325','202326',
];
const BP_DATA     = [160000, 162000, 161000, 158000, 160000, 159000, 161000, 162000, 160000, 159000, 158000, 161000, 162000, 160000, 156000, 159000];
const PLAN_DATA   = [158000, 160000, 159000, 156000, 158000, 157000, 159000, 160000, 158000, 157000, 156000, 159000, 160000, 158000, 154000, 157000];
const ACTUAL_DATA = [156000, 158000, 157000, 154000, 156000, 155000, 157000, 158000, 156000, 155000, 154000, 157000, 158000, 156000,  80000, 120000];
const RATE_DATA   = [   99,    99,    99,    99,    99,    99,    99,    99,    99,    99,    99,    99,    99,    99,    52,    76];

// ─────────────────────────────────────────
// W1 — 차트 (HTML/CSS layout + SVG overlay 로 100% 너비 활용)
// ─────────────────────────────────────────
const Y_MAX = 170000;
const LEGEND = [
  { label: '경영계획', color: '#94a3b8', type: 'box' },
  { label: '판매계획', color: '#fbbf24', type: 'box' },
  { label: '판매실적', color: '#94d2bd', type: 'box' },
  { label: '적중률',   color: '#ef4444', type: 'dash' },
];

function W1Content() {
  const ratePoints = RATE_DATA
    .map((v, i) => {
      const x = ((i + 0.5) / CHART_MONTHS.length) * 100;
      const y = 100 - v;  // % 기준 (yMax = 100%)
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <Box sx={{ p: 1, height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* 우측 상단 범례 */}
      <Stack
        sx={{
          position: 'absolute', top: 8, right: 10,
          bgcolor: 'rgba(255,255,255,0.92)',
          p: 0.6, borderRadius: 0.5,
          zIndex: 3,
        }}
        spacing={0.4}
      >
        {LEGEND.map((it) => (
          <Stack key={it.label} direction="row" alignItems="center" spacing={0.6}>
            {it.type === 'box' && (
              <Box sx={{ width: 14, height: 12, bgcolor: it.color, borderRadius: 0.3 }} />
            )}
            {it.type === 'dash' && (
              <Box sx={{ width: 14, height: 0, borderTop: `2px dashed ${it.color}` }} />
            )}
            <Typography sx={{ fontSize: 10.5, color: '#374151' }}>{it.label}</Typography>
          </Stack>
        ))}
      </Stack>

      {/* chart layout: [leftY label] [chart center] [rightY label] */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* Y 좌측 — 금액 */}
        <Box
          sx={{
            width: 56,
            display: 'flex',
            flexDirection: 'column-reverse',
            justifyContent: 'space-between',
            pr: 0.75, pb: 2.5, pt: 0.5,
          }}
        >
          {[0, 40000, 80000, 120000, 160000].map((v) => (
            <Typography key={v} sx={{ fontSize: 10.5, color: '#64748b', textAlign: 'right', lineHeight: 1 }}>
              {v.toLocaleString()}
            </Typography>
          ))}
        </Box>

        {/* chart center: bar area + x labels */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* bar area */}
          <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
            {/* 가로 grid */}
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((p) => (
              <Box
                key={p}
                sx={{
                  position: 'absolute', left: 0, right: 0,
                  top: `${p * 100}%`,
                  borderTop: '1px dashed #e5e7eb',
                }}
              />
            ))}
            {/* 막대 — flex 균등 분할 (전체 너비 100%) */}
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex' }}>
              {CHART_MONTHS.map((m, i) => (
                <Box
                  key={m}
                  sx={{
                    flex: 1, display: 'flex',
                    alignItems: 'flex-end', justifyContent: 'center', gap: '3px',
                    minWidth: 0,
                  }}
                >
                  <Box sx={{
                    width: '24%', maxWidth: 14, minWidth: 4,
                    height: `${(BP_DATA[i]     / Y_MAX) * 100}%`,
                    bgcolor: '#94a3b8',
                  }} />
                  <Box sx={{
                    width: '24%', maxWidth: 14, minWidth: 4,
                    height: `${(PLAN_DATA[i]   / Y_MAX) * 100}%`,
                    bgcolor: '#fbbf24',
                  }} />
                  <Box sx={{
                    width: '24%', maxWidth: 14, minWidth: 4,
                    height: `${(ACTUAL_DATA[i] / Y_MAX) * 100}%`,
                    bgcolor: '#94d2bd',
                  }} />
                </Box>
              ))}
            </Box>
            {/* 적중률 라인 SVG overlay (좌표는 0~100 % 기준) */}
            <svg
              width="100%" height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
            >
              <polyline
                points={ratePoints}
                fill="none"
                stroke="#ef4444"
                strokeWidth="1.4"
                strokeDasharray="3 2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {/* 적중률 점 — HTML 절대좌표 (SVG circle 의 stretch 문제 회피) */}
            {RATE_DATA.map((v, i) => (
              <Box
                key={i}
                sx={{
                  position: 'absolute',
                  left: `${((i + 0.5) / CHART_MONTHS.length) * 100}%`,
                  top: `${100 - v}%`,
                  width: 7, height: 7,
                  bgcolor: '#ef4444',
                  border: '1.5px solid #fff',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  boxShadow: '0 0 0 0.5px #ef4444',
                  pointerEvents: 'none',
                }}
              />
            ))}
          </Box>
          {/* X labels — flex 균등 분할 (막대와 정렬) */}
          <Box sx={{ display: 'flex', mt: 0.5, height: 18 }}>
            {CHART_MONTHS.map((m) => (
              <Box
                key={m}
                sx={{
                  flex: 1, textAlign: 'center',
                  fontSize: 10, color: '#64748b',
                  minWidth: 0,
                }}
              >
                {m}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Y 우측 — % */}
        <Box
          sx={{
            width: 36,
            display: 'flex',
            flexDirection: 'column-reverse',
            justifyContent: 'space-between',
            pl: 0.75, pb: 2.5, pt: 0.5,
          }}
        >
          {[0, 20, 40, 60, 80, 100].map((v) => (
            <Typography key={v} sx={{ fontSize: 10.5, color: '#64748b', lineHeight: 1 }}>
              {v}%
            </Typography>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────
// W2 — PIVOT 그리드 (원본 화면 그대로)
// ─────────────────────────────────────────
const GRID_MONTHS = ['202311','202312','202313','202314','202315','202316','202317','202318'];

const PIVOT_GROUPS = [
  {
    type:        'DOMES...',
    salesGroup:  '동물약품',
    region:      '가정용살충제 판매',
    accountType: '계장',
    account:     'GOLDEN...',
    itemGroup:   '바이오텍_가정...',
    itemName:    '엠에사망 리본레페드 알반형 50매',
    rows: [
      { kind: '경영계획',  kindColor: '#5281b3', data: [1106, 1710, 1870, 1620, 1703, 1155, 1044, 1106] },
      { kind: '판매계획',  kindColor: '#5281b3', data: [1400, 1500, 1700, 1800, 1300, 1100, 1200, 1400] },
      { kind: '판매실적',  kindColor: '#94a3b8', data: [1218, 1500, 1547, 1638, 1300, 1100, 1092, 1218] },
      { kind: '판매적중률', kindColor: '#ef4444', data: [  87,  100,   91,   91,  100,  100,   91,   87] },
    ],
  },
  {
    type: '', salesGroup: '', region: '', accountType: '', account: '',
    itemGroup: '', itemName: '강옥도링크 액체 450ML',
    rows: [
      { kind: '경영계획',  kindColor: '#5281b3', data: [1703, 1155, 1044, 1106, 1710, 1870, 1620, 1703] },
      { kind: '판매계획',  kindColor: '#5281b3', data: [1300, 1100, 1200, 1400, 1500, 1700, 1800, 1300] },
      { kind: '판매실적',  kindColor: '#94a3b8', data: [1300, 1100, 1092, 1218, 1500, 1547, 1638, 1300] },
      { kind: '판매적중률', kindColor: '#ef4444', data: [ 100,  100,   91,   87,  100,   91,   91,  100] },
    ],
  },
  {
    type: '', salesGroup: '', region: '', accountType: '', account: '',
    itemGroup: '한농)동봉약품', itemName: '독시클린 액체 1L',
    rows: [
      { kind: '경영계획',  kindColor: '#5281b3', data: [1044, 1106, 1710, 1870, 1620, 1703, 1155, 1044] },
      { kind: '판매계획',  kindColor: '#5281b3', data: [1200, 1400, 1500, 1700, 1800, 1300, 1100, 1200] },
      { kind: '판매실적',  kindColor: '#94a3b8', data: [1092, 1218, 1500, 1547, 1638, 1300, 1100, 1092] },
      { kind: '판매적중률', kindColor: '#ef4444', data: [  91,   87,  100,   91,   91,  100,  100,   91] },
    ],
  },
  {
    type: '', salesGroup: '', region: '', accountType: '', account: '',
    itemGroup: '', itemName: '라비다이 산제 20KG',
    rows: [
      { kind: '경영계획',  kindColor: '#5281b3', data: [1106, 1710, 1870, 1620, 1703, 1155, 1044, 1106] },
      { kind: '판매계획',  kindColor: '#5281b3', data: [1400, 1500, 1700, 1800, 1300, 1100, 1200, 1400] },
      { kind: '판매실적',  kindColor: '#94a3b8', data: [1218, 1500, 1547, 1638, 1300, 1100, 1092, 1218] },
    ],
  },
];

const IDENT_COLS = [
  { key: 'no',          header: 'No.',     width: '40px',  align: 'center' },
  { key: 'type',        header: '내수/수출', width: '70px',  align: 'left'   },
  { key: 'salesGroup',  header: '영업그룹',  width: '75px',  align: 'left'   },
  { key: 'region',      header: '영업지역',  width: '110px', align: 'left'   },
  { key: 'accountType', header: '거래형태',  width: '65px',  align: 'left'   },
  { key: 'account',     header: '거래처',    width: '85px',  align: 'left'   },
  { key: 'itemGroup',   header: '제품군',    width: '105px', align: 'left'   },
  { key: 'itemName',    header: '제품명',    width: '180px', align: 'left'   },
  { key: 'kind',        header: '구분',      width: '85px',  align: 'center' },
];

function W2Content() {
  // 평탄화: 각 group 의 row 들을 풀어 No. 부여 + 첫 row 만 group meta 표시
  const flat = [];
  let runningNo = 1;
  PIVOT_GROUPS.forEach((g) => {
    g.rows.forEach((r, ri) => {
      flat.push({
        ...r,
        no:          runningNo++,
        type:        ri === 0 ? g.type        : '',
        salesGroup:  ri === 0 ? g.salesGroup  : '',
        region:      ri === 0 ? g.region      : '',
        accountType: ri === 0 ? g.accountType : '',
        account:     ri === 0 ? g.account     : '',
        itemGroup:   ri === 0 ? g.itemGroup   : '',
        itemName:    ri === 0 ? g.itemName    : '',
      });
    });
  });

  // 월별 컬럼은 `minmax(70px, 1fr)` — 남는 너비를 균등 분할해 그리드가 100% 채움
  const monthCols = GRID_MONTHS.map((m) => ({
    key: m, header: m, width: 'minmax(70px, 1fr)', align: 'right', isMonth: true,
  }));
  const cols = [...IDENT_COLS, ...monthCols];
  const gridCols = cols.map((c) => c.width).join(' ');

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: gridCols,
          fontSize: 11,
          minWidth: '100%',
        }}
      >
        {/* Header row */}
        {cols.map((c) => (
          <Box
            key={c.key}
            sx={{
              px: 0.75, py: 0.6,
              bgcolor: '#eef2f7',
              borderBottom: '1px solid #cbd5e1',
              fontWeight: 700,
              fontSize: 10.5,
              textAlign: c.align,
              position: 'sticky', top: 0, zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: c.align === 'right' ? 'flex-end' : c.align === 'center' ? 'center' : 'flex-start',
            }}
          >
            {c.header}
          </Box>
        ))}
        {/* Data rows */}
        {flat.map((row, ri) => {
          const rowBg = ri % 2 === 0 ? '#ffffff' : '#fafbfc';
          return cols.map((c) => {
            let content = '';
            let cellSx = { color: '#1f2937' };

            if (c.isMonth) {
              const idx = GRID_MONTHS.indexOf(c.key);
              const val = row.data[idx];
              content = typeof val === 'number' ? val.toLocaleString() : '';
              cellSx = {
                color: row.kindColor,
                fontWeight: 600,
                fontFamily: 'monospace',
              };
            } else if (c.key === 'kind') {
              content = row.kind;
              cellSx = { color: row.kindColor, fontWeight: 700 };
            } else if (c.key === 'no') {
              content = row.no;
              cellSx = { color: '#6b7280' };
            } else {
              content = row[c.key] || '';
              cellSx = { color: '#374151' };
            }

            return (
              <Box
                key={`${ri}-${c.key}`}
                sx={{
                  px: 0.75, py: 0.5,
                  borderBottom: '1px solid #f1f5f9',
                  bgcolor: rowBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: c.align === 'right' ? 'flex-end' : c.align === 'center' ? 'center' : 'flex-start',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  ...cellSx,
                }}
              >
                {content}
              </Box>
            );
          });
        })}
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────
// widget grid — 원본 wingui data-grid 비율 그대로
//   row 1 (h=6): 차트
//   row 2 (h=14): PIVOT 그리드
//   maxY = 20 — fitToParent 모드에서 한 화면 fit
// ─────────────────────────────────────────
const widgets = [
  {
    key: '1',
    title: '주차별 판매계획 상세 현황',
    widgetId: 'WI_SNOP_SALESPLANDETAILBAR',
    dataGrid: { w: 12, h: 6, x: 0, y: 0 },
    showTitleBar: true,
    render: W1Content,
  },
  {
    key: '2',
    title: '경영계획/판매계획 및 판매계획/실적 비교 분석',
    widgetId: 'WI_SNOP_SALESPLANDETAILGRID',
    dataGrid: { w: 12, h: 14, x: 0, y: 6 },
    showTitleBar: true,
    render: W2Content,
  },
];

export default function DashSalesPlanStateDetailMockup() {
  return (
    <MockShell
      patternCode="dash_salesplan_state_detail"
      patternLabel="판매계획 대비 실적 상세 — SalesPlanStateDetail"
      layoutCategory="LAYOUT_DASHBOARD"
      description="UI_SA_SALES_PLAN_STATE_DETAIL — 월별 BP/Plan/Actual 막대 + 적중률 라인 + 좌측 식별 컬럼 + 월별 PIVOT 그리드 (snop/mdb/SalesPlanStateDetail)"
    >
      <DashboardPanelMock widgets={widgets} fitToParent />
    </MockShell>
  );
}

import React from 'react';

import { Box } from '@mui/material';

/**
 * PatternPreview — 패턴의 Layout 키를 받아 실제 화면과 유사한 HTML 미리보기 렌더.
 *
 * 모든 미리보기는 **내부 좌표 400×260 기준** 으로 그려지며
 * wrapper 의 aspect-ratio 4:2.6 으로 카드/툴팁 어디서든 비율 유지하며 스케일됩니다.
 *
 * props:
 *   layout   — 'widget_dashboard' | 'search_grid' | ... (35개 키)
 *   width    — 컨테이너 width (기본 100%)
 *   height   — (선택) 고정 height. 없으면 aspect-ratio 유지
 */
function PatternPreview({ layout, width = '100%', height }) {
  const render = RENDERERS[layout] || RENDERERS.__fallback;
  return (
    <Box
      sx={{
        width,
        height: height || undefined,
        aspectRatio: height ? undefined : '4 / 2.6',
        position: 'relative',
        bgcolor: '#f5f6f8',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 1,
        overflow: 'hidden',
        fontSize: 9,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#333',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {render()}
      </Box>
    </Box>
  );
}

// ====== 공통 빌딩 블록 ======

const COLORS = {
  panel:      '#ffffff',
  border:     '#e4e7ec',
  headerBg:   '#f8f9fb',
  text:       '#374151',
  textMuted:  '#9ca3af',
  primary:    '#5281b3',
  accent:     '#2a9d8f',
  warning:    '#ffb100',
  danger:     '#fa7d5b',
  chart1:     '#5281b3',
  chart2:     '#2a9d8f',
  chart3:     '#ffb100',
  chart4:     '#fa7d5b',
  rowAlt:     '#fafbfc',
};

const SX = {
  searchBar: {
    p: '4px 6px', bgcolor: COLORS.panel, borderBottom: `1px solid ${COLORS.border}`,
    display: 'flex', alignItems: 'center', gap: 0.5, height: 22, flexShrink: 0,
  },
  searchInput: {
    bgcolor: '#f0f1f3', borderRadius: 0.5, px: 0.8, py: 0.2,
    height: 14, width: 70, color: COLORS.textMuted, fontSize: 8,
  },
  btn: {
    px: 0.8, py: 0.2, borderRadius: 0.5, fontSize: 8, fontWeight: 500,
    display: 'inline-block', lineHeight: '14px', height: 14,
  },
  btnPrimary:   { bgcolor: COLORS.primary, color: 'white' },
  btnGhost:     { bgcolor: '#f0f1f3',      color: COLORS.text },
  btnAccent:    { bgcolor: COLORS.accent,  color: 'white' },
  btnDanger:    { bgcolor: COLORS.danger,  color: 'white' },
  panelTitle: {
    px: 0.8, py: 0.3, fontSize: 8, fontWeight: 600, color: COLORS.text,
    bgcolor: COLORS.headerBg, borderBottom: `1px solid ${COLORS.border}`,
    height: 16, display: 'flex', alignItems: 'center', flexShrink: 0,
  },
};

function GridRows({ cols = 5, rows = 4, selected = -1, hasHeader = true }) {
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'white', minHeight: 0 }}>
      {hasHeader && (
        <Box sx={{ display: 'flex', bgcolor: COLORS.headerBg, borderBottom: `1px solid ${COLORS.border}`, height: 12, flexShrink: 0 }}>
          {Array.from({ length: cols }).map((_, i) => (
            <Box key={i} sx={{ flex: 1, borderRight: i < cols - 1 ? `1px solid ${COLORS.border}` : 'none', px: 0.5, fontSize: 7, color: COLORS.textMuted, fontWeight: 600, lineHeight: '12px' }}>
              열{i + 1}
            </Box>
          ))}
        </Box>
      )}
      {Array.from({ length: rows }).map((_, r) => (
        <Box
          key={r}
          sx={{
            display: 'flex',
            height: 10,
            borderBottom: r < rows - 1 ? `1px solid ${COLORS.border}` : 'none',
            bgcolor: r === selected ? '#e6f0fa' : (r % 2 === 0 ? 'white' : COLORS.rowAlt),
          }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Box key={c} sx={{ flex: 1, borderRight: c < cols - 1 ? `1px solid ${COLORS.border}` : 'none', px: 0.5, fontSize: 7, color: COLORS.textMuted, lineHeight: '10px' }}>
              ━━
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}

function BarChart({ bars = 6, h = '100%' }) {
  const heights = [60, 80, 45, 70, 55, 90, 40, 65, 75, 50];
  return (
    <Box sx={{ height: h, display: 'flex', alignItems: 'flex-end', gap: 0.5, p: 1, bgcolor: 'white' }}>
      {Array.from({ length: bars }).map((_, i) => (
        <Box
          key={i}
          sx={{
            flex: 1,
            height: `${heights[i % heights.length]}%`,
            bgcolor: i % 2 === 0 ? COLORS.chart1 : COLORS.chart2,
            borderRadius: '1px 1px 0 0',
            minHeight: 3,
          }}
        />
      ))}
    </Box>
  );
}

function LineChart() {
  return (
    <Box sx={{ flex: 1, bgcolor: 'white', position: 'relative' }}>
      <svg viewBox="0 0 100 50" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <polyline
          points="0,35 15,25 30,30 45,15 60,20 75,10 100,18"
          fill="none"
          stroke={COLORS.chart1}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="0,40 15,38 30,32 45,30 60,25 75,28 100,22"
          fill="none"
          stroke={COLORS.chart3}
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2,1"
        />
      </svg>
    </Box>
  );
}

function PieChart() {
  return (
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'white' }}>
      <svg viewBox="0 0 40 40" style={{ width: '60%', height: '90%' }}>
        <circle cx="20" cy="20" r="15" fill={COLORS.chart1} />
        <path d="M 20 5 A 15 15 0 0 1 32.99 27.5 L 20 20 Z" fill={COLORS.chart2} />
        <path d="M 32.99 27.5 A 15 15 0 0 1 20 35 L 20 20 Z" fill={COLORS.chart3} />
      </svg>
    </Box>
  );
}

function KpiCard({ value, label, color }) {
  return (
    <Box
      sx={{
        flex: 1, bgcolor: 'white', border: `1px solid ${COLORS.border}`,
        borderRadius: 0.5, p: 0.5, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
      }}
    >
      <Box sx={{ fontSize: 12, fontWeight: 700, color: color || COLORS.primary, lineHeight: 1 }}>
        {value}
      </Box>
      <Box sx={{ fontSize: 7, color: COLORS.textMuted, mt: 0.3 }}>{label}</Box>
    </Box>
  );
}

function Chip({ label, variant = 'default' }) {
  const palette = {
    default: { bg: '#f0f1f3', color: COLORS.text },
    primary: { bg: '#e6f0fa', color: COLORS.primary },
    success: { bg: '#e6f7f5', color: COLORS.accent },
    warning: { bg: '#fff4dc', color: '#b67900' },
  }[variant];
  return (
    <Box sx={{ bgcolor: palette.bg, color: palette.color, borderRadius: 2, px: 0.6, py: 0.05, fontSize: 7, fontWeight: 500, lineHeight: '10px' }}>
      {label}
    </Box>
  );
}

function TreeList() {
  return (
    <Box sx={{ p: 0.5, fontSize: 8, lineHeight: '11px' }}>
      <Box sx={{ color: COLORS.text }}>▼ 루트</Box>
      <Box sx={{ pl: 1, color: COLORS.textMuted }}>▼ 그룹 A</Box>
      <Box sx={{ pl: 2, color: COLORS.primary, bgcolor: '#e6f0fa', borderRadius: 0.3 }}>• 항목 A-1</Box>
      <Box sx={{ pl: 2, color: COLORS.textMuted }}>• 항목 A-2</Box>
      <Box sx={{ pl: 1, color: COLORS.textMuted }}>▶ 그룹 B</Box>
      <Box sx={{ pl: 1, color: COLORS.textMuted }}>▶ 그룹 C</Box>
    </Box>
  );
}

function TabBar({ tabs = ['탭 A', '탭 B', '탭 C'], active = 0 }) {
  return (
    <Box sx={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}`, bgcolor: COLORS.headerBg, height: 16, flexShrink: 0 }}>
      {tabs.map((t, i) => (
        <Box
          key={i}
          sx={{
            px: 1, fontSize: 8, fontWeight: i === active ? 600 : 400,
            color: i === active ? COLORS.primary : COLORS.textMuted,
            borderBottom: i === active ? `2px solid ${COLORS.primary}` : 'none',
            lineHeight: '14px',
            mb: '-1px',
          }}
        >
          {t}
        </Box>
      ))}
    </Box>
  );
}

function SearchArea({ showButtons = true }) {
  return (
    <Box sx={SX.searchBar}>
      <Box sx={{ fontSize: 9 }}>🔍</Box>
      <Box sx={SX.searchInput}>PlanScope</Box>
      <Box sx={SX.searchInput}>기간 ~</Box>
      <Box sx={{ ...SX.searchInput, width: 60 }}>조건</Box>
      {showButtons && (
        <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
          <Box sx={{ ...SX.btn, ...SX.btnGhost }}>+</Box>
          <Box sx={{ ...SX.btn, ...SX.btnGhost }}>−</Box>
          <Box sx={{ ...SX.btn, ...SX.btnPrimary }}>저장</Box>
        </Box>
      )}
    </Box>
  );
}

// ====== 각 레이아웃별 Renderer ======

const RENDERERS = {

  // ---- DASHBOARD ----

  widget_dashboard: () => (
    <>
      <Box sx={SX.panelTitle}>대시보드</Box>
      <Box sx={{ flex: 1, p: 0.8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5, gridTemplateRows: 'repeat(2, 1fr)' }}>
        <Box sx={{ bgcolor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 0.5, p: 0.5 }}>
          <Box sx={{ fontSize: 14, fontWeight: 700, color: COLORS.primary }}>1,234</Box>
          <Box sx={{ fontSize: 7, color: COLORS.textMuted }}>Sales KPI</Box>
        </Box>
        <Box sx={{ bgcolor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 0.5, p: 0.5 }}>
          <Box sx={{ fontSize: 14, fontWeight: 700, color: COLORS.accent }}>89%</Box>
          <Box sx={{ fontSize: 7, color: COLORS.textMuted }}>Accuracy</Box>
        </Box>
        <Box sx={{ bgcolor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 0.5, gridRow: 'span 2', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ fontSize: 7, color: COLORS.textMuted, p: 0.4 }}>Trend</Box>
          <LineChart />
        </Box>
        <Box sx={{ bgcolor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 0.5, gridColumn: 'span 2' }}>
          <Box sx={{ fontSize: 7, color: COLORS.textMuted, p: 0.4 }}>월별 실적</Box>
          <Box sx={{ height: 'calc(100% - 15px)' }}>
            <BarChart bars={7} />
          </Box>
        </Box>
      </Box>
    </>
  ),

  kpi_chart: () => (
    <>
      <Box sx={SX.panelTitle}>KPI + Main Chart</Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.5, p: 0.8, flexShrink: 0 }}>
        <KpiCard value="1,234" label="KPI 1" color={COLORS.primary} />
        <KpiCard value="89%"   label="KPI 2" color={COLORS.accent} />
        <KpiCard value="456"   label="KPI 3" color={COLORS.warning} />
        <KpiCard value="2.1%"  label="KPI 4" color={COLORS.danger} />
      </Box>
      <Box sx={{ flex: 1, mx: 0.8, mb: 0.8, bgcolor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 0.5, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ fontSize: 7, color: COLORS.textMuted, p: 0.4 }}>Main Chart</Box>
        <BarChart bars={10} />
      </Box>
    </>
  ),

  grid_2x2: () => (
    <>
      <Box sx={SX.panelTitle}>2 x 2 Multi Chart</Box>
      <Box sx={{ flex: 1, p: 0.8, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 0.5 }}>
        {[0, 1, 2, 3].map((i) => (
          <Box key={i} sx={{ bgcolor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 0.5, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ fontSize: 7, color: COLORS.textMuted, p: 0.4 }}>Chart {i + 1}</Box>
            {i % 2 === 0 ? <BarChart bars={5} /> : <LineChart />}
          </Box>
        ))}
      </Box>
    </>
  ),

  drilldown: () => (
    <>
      <Box sx={SX.panelTitle}>Drilldown Analysis</Box>
      <Box sx={{ flex: 1, p: 0.8, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Box sx={{ flex: 1, bgcolor: 'white', border: `2px solid ${COLORS.primary}`, borderRadius: 0.5, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ fontSize: 7, color: COLORS.primary, fontWeight: 600, p: 0.4 }}>🔹 Master (클릭으로 Drilldown)</Box>
          <BarChart bars={6} />
        </Box>
        <Box sx={{ alignSelf: 'center', fontSize: 10, color: COLORS.primary }}>↓</Box>
        <Box sx={{ flex: 1, bgcolor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 0.5, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ fontSize: 7, color: COLORS.textMuted, p: 0.4 }}>Detail</Box>
          <LineChart />
        </Box>
      </Box>
    </>
  ),

  // ---- GRID ----

  search_grid: () => (
    <>
      <SearchArea />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.8, py: 0.3, bgcolor: COLORS.headerBg, borderBottom: `1px solid ${COLORS.border}` }}>
        <Box sx={{ fontSize: 8, color: COLORS.textMuted }}>총 128건</Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
          <Box sx={{ ...SX.btn, ...SX.btnGhost }}>+ 추가</Box>
          <Box sx={{ ...SX.btn, ...SX.btnGhost }}>− 삭제</Box>
          <Box sx={{ ...SX.btn, ...SX.btnPrimary }}>💾 저장</Box>
          <Box sx={{ ...SX.btn, ...SX.btnGhost }}>📄 Excel</Box>
        </Box>
      </Box>
      <GridRows cols={5} rows={8} selected={2} />
    </>
  ),

  split_master_detail: () => (
    <>
      <SearchArea />
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Box sx={{ flex: 1, borderRight: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column' }}>
          <Box sx={SX.panelTitle}>Master</Box>
          <GridRows cols={3} rows={6} selected={1} />
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={SX.panelTitle}>Detail (선택 행의 하위)</Box>
          <GridRows cols={4} rows={6} />
        </Box>
      </Box>
    </>
  ),

  tree_grid: () => (
    <>
      <SearchArea />
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Box sx={{ width: '32%', borderRight: `1px solid ${COLORS.border}`, bgcolor: 'white' }}>
          <Box sx={SX.panelTitle}>Tree</Box>
          <TreeList />
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={SX.panelTitle}>Grid</Box>
          <GridRows cols={4} rows={7} />
        </Box>
      </Box>
    </>
  ),

  tree_grid_detail: () => (
    <>
      <SearchArea />
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Box sx={{ width: '25%', borderRight: `1px solid ${COLORS.border}`, bgcolor: 'white' }}>
          <Box sx={SX.panelTitle}>Tree</Box>
          <TreeList />
        </Box>
        <Box sx={{ flex: 1, borderRight: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column' }}>
          <Box sx={SX.panelTitle}>Grid</Box>
          <GridRows cols={3} rows={7} selected={3} />
        </Box>
        <Box sx={{ width: '28%', bgcolor: 'white', display: 'flex', flexDirection: 'column' }}>
          <Box sx={SX.panelTitle}>Detail</Box>
          <Box sx={{ p: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5, fontSize: 8 }}>
            <Box sx={{ color: COLORS.textMuted }}>이름: <span style={{ color: COLORS.text }}>━━━━</span></Box>
            <Box sx={{ color: COLORS.textMuted }}>유형: <span style={{ color: COLORS.text }}>━━━</span></Box>
            <Box sx={{ color: COLORS.textMuted }}>상태: <Chip label="활성" variant="success" /></Box>
            <Box sx={{ color: COLORS.textMuted }}>설명: <span style={{ color: COLORS.text }}>━━━━━━</span></Box>
          </Box>
        </Box>
      </Box>
    </>
  ),

  card_list: () => (
    <>
      <SearchArea />
      <Box sx={{ flex: 1, p: 0.8, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.5, alignContent: 'start' }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Box key={i} sx={{ bgcolor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 0.5, p: 0.5, display: 'flex', flexDirection: 'column', gap: 0.3, height: 36 }}>
            <Box sx={{ height: 12, bgcolor: '#f0f1f3', borderRadius: 0.3 }} />
            <Box sx={{ fontSize: 7, color: COLORS.text, lineHeight: '9px' }}>카드 #{i + 1}</Box>
            <Box sx={{ fontSize: 6, color: COLORS.textMuted, lineHeight: '8px' }}>설명 텍스트</Box>
          </Box>
        ))}
      </Box>
    </>
  ),

  infinite_list: () => (
    <>
      <Box sx={SX.panelTitle}>Infinite Scroll List</Box>
      <Box sx={{ flex: 1, p: 0.5, display: 'flex', flexDirection: 'column', gap: 0.3, overflow: 'hidden' }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <Box key={i} sx={{ bgcolor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 0.3, p: 0.4, display: 'flex', gap: 0.5, opacity: 1 - i * 0.03 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS.primary + (i % 2 ? '22' : '44') }} />
            <Box sx={{ flex: 1 }}>
              <Box sx={{ fontSize: 8, fontWeight: 500 }}>항목 #{i + 1}</Box>
              <Box sx={{ fontSize: 7, color: COLORS.textMuted }}>━━━━━━━━</Box>
            </Box>
          </Box>
        ))}
        <Box sx={{ textAlign: 'center', fontSize: 8, color: COLORS.textMuted, py: 0.5 }}>
          ⟳ 로드 중...
        </Box>
      </Box>
    </>
  ),

  // ---- ENTRY ----

  pivot_entry: () => (
    <>
      <SearchArea />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.8, py: 0.3, bgcolor: COLORS.headerBg, borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
        <Box sx={{ ...SX.btn, ...SX.btnGhost }}>버전 ▼</Box>
        <Box sx={{ ...SX.btn, ...SX.btnGhost }}>W / M / Q</Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
          <Box sx={{ ...SX.btn, ...SX.btnPrimary }}>💾 저장</Box>
          <Box sx={{ ...SX.btn, ...SX.btnGhost }}>📥 Excel</Box>
        </Box>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'white', minHeight: 0 }}>
        <Box sx={{ display: 'flex', bgcolor: COLORS.headerBg, borderBottom: `1px solid ${COLORS.border}`, fontSize: 7, fontWeight: 600 }}>
          <Box sx={{ width: 50, px: 0.4, borderRight: `1px solid ${COLORS.border}`, color: COLORS.textMuted }}>지표</Box>
          {['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월'].map((m) => (
            <Box key={m} sx={{ flex: 1, px: 0.4, borderRight: `1px solid ${COLORS.border}`, color: COLORS.textMuted, textAlign: 'right' }}>{m}</Box>
          ))}
        </Box>
        {['계획', '실적', '예측', '조정'].map((label, r) => (
          <Box key={r} sx={{ display: 'flex', fontSize: 7, borderBottom: `1px solid ${COLORS.border}`, height: 12, bgcolor: r === 1 ? '#fff8e1' : 'white' }}>
            <Box sx={{ width: 50, px: 0.4, borderRight: `1px solid ${COLORS.border}`, color: COLORS.text, fontWeight: 500, lineHeight: '12px' }}>{label}</Box>
            {[100, 120, 95, 110, 130, 115, 108, 125].map((v, c) => (
              <Box key={c} sx={{ flex: 1, px: 0.4, borderRight: `1px solid ${COLORS.border}`, color: r === 1 ? '#b67900' : COLORS.text, textAlign: 'right', lineHeight: '12px' }}>{v + r * 3}</Box>
            ))}
          </Box>
        ))}
      </Box>
    </>
  ),

  form_detail_grid: () => (
    <>
      <Box sx={SX.panelTitle}>주문 헤더</Box>
      <Box sx={{ p: 0.8, bgcolor: 'white', borderBottom: `1px solid ${COLORS.border}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0.5, flexShrink: 0 }}>
        {['고객', '주문일', '납기', '담당자', '상태', '금액'].map((l) => (
          <Box key={l} sx={{ fontSize: 7 }}>
            <Box sx={{ color: COLORS.textMuted, mb: 0.1 }}>{l}</Box>
            <Box sx={{ bgcolor: '#f0f1f3', borderRadius: 0.3, height: 11, px: 0.4, lineHeight: '11px', color: COLORS.text }}>━━━━</Box>
          </Box>
        ))}
      </Box>
      <Box sx={SX.panelTitle}>주문 라인</Box>
      <GridRows cols={6} rows={5} />
    </>
  ),

  wizard_stepper: () => (
    <>
      <Box sx={SX.panelTitle}>Wizard</Box>
      <Box sx={{ p: 1, bgcolor: 'white', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        {['기본', '상세', '확인', '완료'].map((s, i) => (
          <React.Fragment key={s}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <Box sx={{
                width: 14, height: 14, borderRadius: '50%',
                bgcolor: i < 2 ? COLORS.primary : (i === 2 ? 'white' : '#f0f1f3'),
                border: i === 2 ? `2px solid ${COLORS.primary}` : 'none',
                color: i < 2 ? 'white' : (i === 2 ? COLORS.primary : COLORS.textMuted),
                fontSize: 8, fontWeight: 700, lineHeight: '14px', textAlign: 'center',
              }}>
                {i + 1}
              </Box>
              <Box sx={{ fontSize: 7, color: i <= 2 ? COLORS.text : COLORS.textMuted, fontWeight: i === 2 ? 600 : 400 }}>{s}</Box>
            </Box>
            {i < 3 && <Box sx={{ flex: 1, height: 1, bgcolor: i < 2 ? COLORS.primary : '#f0f1f3' }} />}
          </React.Fragment>
        ))}
      </Box>
      <Box sx={{ flex: 1, p: 1, bgcolor: 'white', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.8, alignContent: 'start' }}>
        {['이름', '부서', '이메일', '전화', '상태', '메모'].map((l) => (
          <Box key={l} sx={{ fontSize: 7 }}>
            <Box sx={{ color: COLORS.textMuted, mb: 0.2 }}>{l}</Box>
            <Box sx={{ bgcolor: '#f0f1f3', borderRadius: 0.3, height: 12, px: 0.4, lineHeight: '12px' }}>━━━━━━</Box>
          </Box>
        ))}
      </Box>
    </>
  ),

  settings_form: () => (
    <>
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Box sx={{ width: 80, bgcolor: COLORS.headerBg, borderRight: `1px solid ${COLORS.border}`, p: 0.5, display: 'flex', flexDirection: 'column', gap: 0.3 }}>
          {['일반', '알림', '보안', '데이터', '고급'].map((s, i) => (
            <Box key={s} sx={{
              fontSize: 8, px: 0.5, py: 0.3, borderRadius: 0.3,
              bgcolor: i === 1 ? COLORS.primary : 'transparent',
              color:   i === 1 ? 'white' : COLORS.text,
              fontWeight: i === 1 ? 600 : 400,
            }}>
              {s}
            </Box>
          ))}
        </Box>
        <Box sx={{ flex: 1, p: 1, bgcolor: 'white', display: 'flex', flexDirection: 'column', gap: 0.6 }}>
          {[
            { label: '이메일 알림', val: '☑' },
            { label: 'SMS 알림', val: '☐' },
            { label: '다크 모드', val: '○' },
            { label: '알림 시간', val: '09:00~18:00' },
          ].map((r) => (
            <Box key={r.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, borderBottom: `1px solid ${COLORS.border}`, pb: 0.4, fontSize: 8 }}>
              <Box sx={{ flex: 1, color: COLORS.text }}>{r.label}</Box>
              <Box sx={{ color: COLORS.primary, fontWeight: 600 }}>{r.val}</Box>
            </Box>
          ))}
        </Box>
      </Box>
    </>
  ),

  // ---- ANALYSIS ----

  search_tab: () => (
    <>
      <SearchArea />
      <TabBar tabs={['요약', '상세', '차트', '원본']} active={1} />
      <GridRows cols={6} rows={8} selected={3} />
    </>
  ),

  grid_chart_stacked: () => (
    <>
      <SearchArea />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Box sx={SX.panelTitle}>집계 그리드</Box>
          <GridRows cols={5} rows={5} selected={1} />
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderTop: `2px solid ${COLORS.border}`, minHeight: 0 }}>
          <Box sx={SX.panelTitle}>📊 트렌드</Box>
          <LineChart />
        </Box>
      </Box>
    </>
  ),

  chart_grid_horizontal: () => (
    <>
      <SearchArea />
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${COLORS.border}`, minHeight: 0 }}>
          <Box sx={SX.panelTitle}>📊 차트</Box>
          <BarChart bars={8} />
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Box sx={SX.panelTitle}>그리드</Box>
          <GridRows cols={4} rows={7} />
        </Box>
      </Box>
    </>
  ),

  chart_grid_vertical: () => (
    <>
      <SearchArea />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Box sx={SX.panelTitle}>📊 트렌드 차트</Box>
          <LineChart />
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderTop: `1px solid ${COLORS.border}`, minHeight: 0 }}>
          <Box sx={SX.panelTitle}>상세 데이터</Box>
          <GridRows cols={6} rows={6} />
        </Box>
      </Box>
    </>
  ),

  tab_chart: () => (
    <>
      <TabBar tabs={['월별', '분기별', '연별']} active={0} />
      <Box sx={{ flex: 1, p: 0.8, bgcolor: 'white' }}>
        <BarChart bars={12} />
      </Box>
    </>
  ),

  pivot_table: () => (
    <>
      <Box sx={SX.panelTitle}>PivotTable (D / M / P / V)</Box>
      <Box sx={{ display: 'flex', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', bgcolor: COLORS.primary + '22', fontSize: 7, fontWeight: 600 }}>
          <Box sx={{ width: 60, px: 0.4, borderRight: `1px solid ${COLORS.border}`, color: COLORS.primary, lineHeight: '12px' }}>D Dim1</Box>
          <Box sx={{ width: 60, px: 0.4, borderRight: `1px solid ${COLORS.border}`, color: COLORS.primary, lineHeight: '12px' }}>D Dim2</Box>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', bgcolor: COLORS.accent + '22', fontSize: 7, fontWeight: 600 }}>
          {['M 수량', 'M 금액', 'V %', 'V 증감'].map((h) => (
            <Box key={h} sx={{ flex: 1, px: 0.4, borderRight: `1px solid ${COLORS.border}`, color: COLORS.accent, lineHeight: '12px', textAlign: 'right' }}>{h}</Box>
          ))}
        </Box>
      </Box>
      <GridRows cols={6} rows={8} hasHeader={false} />
    </>
  ),

  heatmap: () => {
    const getCol = (v) => {
      if (v < 0.2) return '#eef0f3';
      if (v < 0.4) return '#cfe1f2';
      if (v < 0.6) return '#8fc1e2';
      if (v < 0.8) return '#5298c9';
      return '#2a6fa0';
    };
    return (
      <>
        <Box sx={SX.panelTitle}>Heatmap</Box>
        <Box sx={{ flex: 1, p: 0.8, display: 'flex', flexDirection: 'column', gap: 0.2 }}>
          <Box sx={{ display: 'flex', gap: 0.2, pl: 3.5 }}>
            {['月', '火', '水', '木', '金', '土', '日'].map((d) => (
              <Box key={d} sx={{ flex: 1, fontSize: 7, color: COLORS.textMuted, textAlign: 'center' }}>{d}</Box>
            ))}
          </Box>
          {[0.15, 0.35, 0.75, 0.55, 0.9, 0.42, 0.68].map((row, r) => (
            <Box key={r} sx={{ display: 'flex', gap: 0.2, alignItems: 'center' }}>
              <Box sx={{ width: 20, fontSize: 7, color: COLORS.textMuted, textAlign: 'right', pr: 0.5 }}>
                {String(9 + r * 2).padStart(2, '0')}
              </Box>
              {Array.from({ length: 7 }).map((_, c) => (
                <Box key={c} sx={{ flex: 1, height: 16, bgcolor: getCol((row + c * 0.12) % 1), borderRadius: 0.3 }} />
              ))}
            </Box>
          ))}
        </Box>
      </>
    );
  },

  report_tabs: () => (
    <>
      <TabBar tabs={['종합', '매출', '재고', '예측', '설정']} active={1} />
      <Box sx={{ flex: 1, p: 0.8, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto 1fr', gap: 0.5, minHeight: 0 }}>
        <KpiCard value="₩2.4B" label="당월 매출" color={COLORS.primary} />
        <KpiCard value="+12%"  label="YoY"      color={COLORS.accent} />
        <Box sx={{ bgcolor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 0.5, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ fontSize: 7, color: COLORS.textMuted, p: 0.3 }}>월별 트렌드</Box>
          <LineChart />
        </Box>
        <Box sx={{ bgcolor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 0.5, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ fontSize: 7, color: COLORS.textMuted, p: 0.3 }}>세그먼트</Box>
          <PieChart />
        </Box>
      </Box>
    </>
  ),

  // ---- VISUALIZATION ----

  gantt: () => (
    <>
      <SearchArea />
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Box sx={{ width: 80, borderRight: `1px solid ${COLORS.border}`, bgcolor: 'white' }}>
          <Box sx={SX.panelTitle}>리소스</Box>
          <Box sx={{ p: 0.4, fontSize: 7, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ fontWeight: 600 }}>▼ 공장 A</Box>
            <Box sx={{ pl: 0.8, color: COLORS.textMuted }}>· 라인 1</Box>
            <Box sx={{ pl: 0.8, color: COLORS.textMuted }}>· 라인 2</Box>
            <Box sx={{ fontWeight: 600 }}>▼ 공장 B</Box>
            <Box sx={{ pl: 0.8, color: COLORS.textMuted }}>· 라인 3</Box>
          </Box>
        </Box>
        <Box sx={{ flex: 1, bgcolor: 'white', position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', bgcolor: COLORS.headerBg, fontSize: 7, borderBottom: `1px solid ${COLORS.border}`, height: 16 }}>
            {['월', '화', '수', '목', '금', '토', '일'].map((d) => (
              <Box key={d} sx={{ flex: 1, textAlign: 'center', color: COLORS.textMuted, lineHeight: '16px' }}>{d}</Box>
            ))}
          </Box>
          {[
            { s: 5,  w: 25, c: COLORS.chart1 },
            { s: 10, w: 30, c: COLORS.chart2 },
            { s: 0,  w: 20, c: COLORS.chart3 },
            { s: 15, w: 35, c: COLORS.chart4 },
            { s: 25, w: 20, c: COLORS.chart1 },
          ].map((bar, i) => (
            <Box key={i} sx={{ position: 'relative', height: 8, my: 0.5 }}>
              <Box sx={{
                position: 'absolute',
                left: `${bar.s}%`, width: `${bar.w}%`,
                height: '100%', bgcolor: bar.c, borderRadius: 0.3,
              }} />
            </Box>
          ))}
        </Box>
      </Box>
    </>
  ),

  flo_diagram: () => (
    <>
      <Box sx={SX.panelTitle}>FLO Diagram (ReactFlow)</Box>
      <Box sx={{ flex: 1, position: 'relative', bgcolor: '#fafbfc', overflow: 'hidden' }}>
        <svg viewBox="0 0 400 200" style={{ width: '100%', height: '100%' }}>
          <defs>
            <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#5281b3" />
            </marker>
          </defs>
          {[
            { x: 40,  y: 100 },
            { x: 160, y: 60 },
            { x: 160, y: 140 },
            { x: 280, y: 100 },
            { x: 360, y: 100 },
          ].map((n, i) => (
            <React.Fragment key={i}>
              <rect x={n.x - 25} y={n.y - 12} width="50" height="24" rx="4"
                fill="white" stroke={COLORS.primary} strokeWidth="1.5" />
              <text x={n.x} y={n.y + 3} textAnchor="middle" fontSize="9" fill={COLORS.primary}>
                Node {i + 1}
              </text>
            </React.Fragment>
          ))}
          <line x1="65"  y1="96"  x2="135" y2="70" stroke="#5281b3" strokeWidth="1.2" markerEnd="url(#arr)"/>
          <line x1="65"  y1="104" x2="135" y2="132" stroke="#5281b3" strokeWidth="1.2" markerEnd="url(#arr)"/>
          <line x1="185" y1="60"  x2="255" y2="92"  stroke="#5281b3" strokeWidth="1.2" markerEnd="url(#arr)"/>
          <line x1="185" y1="140" x2="255" y2="108" stroke="#5281b3" strokeWidth="1.2" markerEnd="url(#arr)"/>
          <line x1="305" y1="100" x2="335" y2="100" stroke="#5281b3" strokeWidth="1.2" markerEnd="url(#arr)"/>
        </svg>
      </Box>
    </>
  ),

  map: () => (
    <>
      <Box sx={SX.panelTitle}>🗺️ Map</Box>
      <Box sx={{ flex: 1, position: 'relative', bgcolor: '#d8e9f5', overflow: 'hidden' }}>
        {/* 지도 배경 */}
        <svg viewBox="0 0 400 200" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <path d="M 50 80 Q 100 60 150 90 T 250 80 Q 300 70 350 100 L 380 120 Q 340 140 300 135 Q 220 150 150 140 Q 90 130 50 80 Z" fill="#b4d5e8" />
          <path d="M 60 140 Q 120 155 180 150 Q 250 148 320 160 Q 280 170 220 172 Q 140 175 60 140 Z" fill="#a0c8de" />
        </svg>
        {/* 마커 */}
        {[
          { x: 25, y: 35 },
          { x: 50, y: 50 },
          { x: 40, y: 70 },
          { x: 70, y: 45 },
          { x: 80, y: 65 },
        ].map((m, i) => (
          <Box key={i} sx={{ position: 'absolute', left: `${m.x}%`, top: `${m.y}%`, transform: 'translate(-50%, -100%)', fontSize: 14 }}>📍</Box>
        ))}
      </Box>
    </>
  ),

  timeline: () => (
    <>
      <Box sx={SX.panelTitle}>Timeline</Box>
      <Box sx={{ flex: 1, p: 1, position: 'relative' }}>
        <Box sx={{ position: 'absolute', left: 20, top: 12, bottom: 12, width: 2, bgcolor: COLORS.primary }} />
        {[
          { d: '2024.01', title: '프로젝트 시작',      c: COLORS.primary },
          { d: '2024.03', title: '요구사항 확정',      c: COLORS.accent },
          { d: '2024.05', title: '개발 진행중',        c: COLORS.warning },
          { d: '2024.08', title: 'QA 완료 · 배포',   c: COLORS.primary },
        ].map((e, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 0.8, mb: 0.8, position: 'relative' }}>
            <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: e.c, border: '2px solid white', zIndex: 1, flexShrink: 0, ml: 0.5 }} />
            <Box>
              <Box sx={{ fontSize: 8, color: COLORS.textMuted }}>{e.d}</Box>
              <Box sx={{ fontSize: 9, fontWeight: 500, color: COLORS.text }}>{e.title}</Box>
            </Box>
          </Box>
        ))}
      </Box>
    </>
  ),

  calendar: () => (
    <>
      <Box sx={SX.panelTitle}>Calendar — 2026.04</Box>
      <Box sx={{ flex: 1, p: 0.5, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.2, fontSize: 7, textAlign: 'center', py: 0.3 }}>
          {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
            <Box key={d} sx={{ color: COLORS.textMuted, fontWeight: 600 }}>{d}</Box>
          ))}
        </Box>
        <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(5, 1fr)', gap: 0.2 }}>
          {Array.from({ length: 35 }).map((_, i) => {
            const d = i - 2;
            const today = d === 9;
            const event = [3, 9, 15, 22, 27].includes(d);
            return (
              <Box key={i} sx={{
                bgcolor: today ? COLORS.primary + '22' : 'white',
                border: `1px solid ${COLORS.border}`, borderRadius: 0.3,
                p: 0.2, fontSize: 6,
                color: d < 1 || d > 30 ? COLORS.textMuted : COLORS.text,
                position: 'relative',
              }}>
                {d >= 1 && d <= 30 ? d : ''}
                {event && (
                  <Box sx={{ position: 'absolute', left: 1, right: 1, bottom: 1, height: 3, bgcolor: COLORS.accent, borderRadius: 0.2 }} />
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    </>
  ),

  scheduler: () => (
    <>
      <Box sx={SX.panelTitle}>Scheduler</Box>
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Box sx={{ width: 28, bgcolor: COLORS.headerBg, borderRight: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column' }}>
          {['09', '10', '11', '12', '13', '14'].map((t) => (
            <Box key={t} sx={{ flex: 1, fontSize: 7, color: COLORS.textMuted, textAlign: 'center', borderBottom: `1px solid ${COLORS.border}` }}>{t}</Box>
          ))}
        </Box>
        <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', position: 'relative' }}>
          {['월', '화', '수', '목', '금'].map((d) => (
            <Box key={d} sx={{ borderRight: `1px solid ${COLORS.border}`, position: 'relative' }}>
              <Box sx={{ fontSize: 7, textAlign: 'center', borderBottom: `1px solid ${COLORS.border}`, color: COLORS.textMuted, py: 0.2 }}>{d}</Box>
            </Box>
          ))}
          {[
            { col: 0, top: 18, h: 22, title: '미팅',   c: COLORS.chart1 },
            { col: 1, top: 38, h: 28, title: '발표',   c: COLORS.chart2 },
            { col: 2, top: 18, h: 18, title: '회의',   c: COLORS.chart3 },
            { col: 3, top: 58, h: 30, title: '교육',   c: COLORS.chart4 },
          ].map((ev, i) => (
            <Box key={i} sx={{
              position: 'absolute',
              left: `${(ev.col / 5) * 100 + 0.5}%`,
              width: `${100 / 5 - 1}%`,
              top: ev.top,
              height: ev.h,
              bgcolor: ev.c,
              color: 'white',
              borderRadius: 0.3,
              fontSize: 7,
              p: 0.2,
            }}>
              {ev.title}
            </Box>
          ))}
        </Box>
      </Box>
    </>
  ),

  network_graph: () => (
    <>
      <Box sx={SX.panelTitle}>Network Graph</Box>
      <Box sx={{ flex: 1, bgcolor: '#fafbfc' }}>
        <svg viewBox="0 0 400 200" style={{ width: '100%', height: '100%' }}>
          {/* lines */}
          {[
            [100, 80, 180, 60],
            [100, 80, 150, 130],
            [180, 60, 260, 90],
            [150, 130, 260, 90],
            [260, 90, 340, 50],
            [260, 90, 340, 130],
            [180, 60, 80, 160],
            [80, 160, 150, 130],
          ].map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={COLORS.textMuted} strokeWidth="0.8" opacity="0.6" />
          ))}
          {/* nodes */}
          {[
            { x: 100, y: 80,  r: 10, c: COLORS.chart1 },
            { x: 180, y: 60,  r: 8,  c: COLORS.chart2 },
            { x: 150, y: 130, r: 9,  c: COLORS.chart3 },
            { x: 260, y: 90,  r: 12, c: COLORS.chart1 },
            { x: 340, y: 50,  r: 7,  c: COLORS.chart4 },
            { x: 340, y: 130, r: 8,  c: COLORS.chart2 },
            { x: 80,  y: 160, r: 7,  c: COLORS.chart3 },
          ].map((n, i) => (
            <circle key={i} cx={n.x} cy={n.y} r={n.r} fill={n.c} stroke="white" strokeWidth="1.5" />
          ))}
        </svg>
      </Box>
    </>
  ),

  // ---- WORKFLOW ----

  control_board: () => (
    <>
      <Box sx={SX.panelTitle}>Control Board</Box>
      <Box sx={{ p: 1, bgcolor: 'white', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        {['Step 1', 'Step 2', 'Step 3', 'Step 4'].map((s, i) => (
          <React.Fragment key={s}>
            <Box sx={{
              width: 14, height: 14, borderRadius: '50%',
              bgcolor: i <= 1 ? COLORS.accent : 'white',
              border: i === 2 ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
              color: i <= 1 ? 'white' : COLORS.textMuted,
              fontSize: 7, fontWeight: 700, lineHeight: '12px', textAlign: 'center',
            }}>{i + 1}</Box>
            {i < 3 && <Box sx={{ flex: 1, height: 1, bgcolor: i < 1 ? COLORS.accent : '#f0f1f3' }} />}
          </React.Fragment>
        ))}
      </Box>
      <Box sx={{ flex: 1, p: 0.8, display: 'flex', flexDirection: 'column', gap: 0.5, overflow: 'hidden' }}>
        {[
          { v: 'v2026.04.01', status: 'ACTIVE',    c: 'success' },
          { v: 'v2026.03.15', status: 'CLOSED',    c: 'default' },
          { v: 'v2026.03.01', status: 'ARCHIVED',  c: 'default' },
        ].map((ver) => (
          <Box key={ver.v} sx={{ bgcolor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 0.5, p: 0.5, display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <Box sx={{ width: 24, height: 24, bgcolor: COLORS.primary + '22', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.primary, fontSize: 10 }}>📋</Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ fontSize: 8, fontWeight: 600 }}>{ver.v}</Box>
              <Box sx={{ fontSize: 7, color: COLORS.textMuted }}>2026.04.01 ~ 04.30</Box>
            </Box>
            <Chip label={ver.status} variant={ver.c} />
          </Box>
        ))}
      </Box>
    </>
  ),

  process_status: () => (
    <>
      <SearchArea />
      <Box sx={{ p: 0.8, bgcolor: 'white', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        {['입력', '검토', '승인', '확정'].map((s, i) => (
          <React.Fragment key={s}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <Box sx={{
                width: 12, height: 12, borderRadius: '50%',
                bgcolor: i <= 1 ? COLORS.accent : 'white',
                border: i === 1 ? 'none' : `1px solid ${i === 1 ? COLORS.accent : COLORS.border}`,
              }} />
              <Box sx={{ fontSize: 7, fontWeight: i === 1 ? 600 : 400 }}>{s}</Box>
            </Box>
            {i < 3 && <Box sx={{ flex: 1, height: 1, bgcolor: i < 1 ? COLORS.accent : '#f0f1f3' }} />}
          </React.Fragment>
        ))}
      </Box>
      <Box sx={{ flex: 1, bgcolor: 'white', p: 0.5, fontSize: 7, overflow: 'hidden' }}>
        <Box sx={{ fontWeight: 600, mb: 0.3 }}>▼ 영업팀 A (진행률 60%)</Box>
        <Box sx={{ pl: 1, color: COLORS.text, mb: 0.3 }}>• 홍길동 <Chip label="SUBMITTED" variant="success" /></Box>
        <Box sx={{ pl: 1, color: COLORS.text, mb: 0.3 }}>• 이영희 <Chip label="PENDING"   variant="warning" /></Box>
        <Box sx={{ pl: 1, color: COLORS.text, mb: 0.3 }}>• 박철수 <Chip label="REJECTED"  variant="default" /></Box>
        <Box sx={{ fontWeight: 600, mt: 0.5 }}>▼ 영업팀 B</Box>
        <Box sx={{ pl: 1, color: COLORS.text }}>• 김민수 <Chip label="SUBMITTED" variant="success" /></Box>
      </Box>
    </>
  ),

  approval_list: () => (
    <>
      <Box sx={SX.panelTitle}>승인 대기 · 5건</Box>
      <Box sx={{ flex: 1, p: 0.5, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
        {['자재 발주 #1234', '지출 결의 #5678', '계약 승인 #9012', '휴가 신청 #3456', '출장 품의 #7890'].map((item, i) => (
          <Box key={i} sx={{ bgcolor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 0.5, p: 0.4, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: COLORS.primary + '22', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📄</Box>
            <Box sx={{ flex: 1, fontSize: 8 }}>{item}</Box>
            <Box sx={{ ...SX.btn, ...SX.btnAccent }}>승인</Box>
            <Box sx={{ ...SX.btn, ...SX.btnDanger }}>반려</Box>
          </Box>
        ))}
      </Box>
    </>
  ),

  kanban: () => (
    <>
      <Box sx={SX.panelTitle}>Kanban</Box>
      <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5, p: 0.5, minHeight: 0 }}>
        {[
          { title: 'TODO',  c: COLORS.textMuted, cards: ['작업 #1', '작업 #2', '작업 #3'] },
          { title: 'DOING', c: COLORS.primary,   cards: ['작업 #4', '작업 #5'] },
          { title: 'DONE',  c: COLORS.accent,    cards: ['작업 #6', '작업 #7', '작업 #8'] },
        ].map((col) => (
          <Box key={col.title} sx={{ bgcolor: COLORS.headerBg, borderRadius: 0.5, p: 0.3, display: 'flex', flexDirection: 'column', gap: 0.3 }}>
            <Box sx={{ fontSize: 8, fontWeight: 700, color: col.c, px: 0.3 }}>{col.title} ({col.cards.length})</Box>
            {col.cards.map((card, i) => (
              <Box key={i} sx={{ bgcolor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 0.3, p: 0.3 }}>
                <Box sx={{ fontSize: 7, fontWeight: 500 }}>{card}</Box>
                <Box sx={{ fontSize: 6, color: COLORS.textMuted }}>━━━━━</Box>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </>
  ),

  // ---- NAVIGATION ----

  sidebar_main: () => (
    <>
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Box sx={{ width: 70, bgcolor: '#2e3a4b', display: 'flex', flexDirection: 'column', p: 0.5, gap: 0.3 }}>
          {['🏠 홈', '📊 보고서', '⚙ 설정', '👥 사용자', '📁 파일'].map((m, i) => (
            <Box key={m} sx={{
              fontSize: 8, color: i === 1 ? 'white' : '#a0abc0',
              bgcolor: i === 1 ? 'rgba(255,255,255,0.12)' : 'transparent',
              px: 0.4, py: 0.3, borderRadius: 0.3,
              fontWeight: i === 1 ? 600 : 400,
            }}>
              {m}
            </Box>
          ))}
        </Box>
        <Box sx={{ flex: 1, bgcolor: 'white', display: 'flex', flexDirection: 'column' }}>
          <Box sx={SX.panelTitle}>보고서 대시보드</Box>
          <Box sx={{ flex: 1, p: 0.8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, alignContent: 'start' }}>
            <KpiCard value="1.2K" label="방문자"  color={COLORS.primary} />
            <KpiCard value="87%"  label="재방문"  color={COLORS.accent} />
            <Box sx={{ gridColumn: 'span 2', bgcolor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 0.5, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ fontSize: 7, color: COLORS.textMuted, p: 0.3 }}>일별 방문</Box>
              <LineChart />
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  ),

  // ---- SPECIAL ----

  code_editor: () => (
    <>
      <Box sx={SX.panelTitle}>SQL Editor</Box>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ flex: 1, bgcolor: '#1e1e1e', p: 0.5, fontFamily: 'Consolas, monospace', fontSize: 8, color: '#d4d4d4', overflow: 'hidden' }}>
          <Box><span style={{ color: '#569cd6' }}>SELECT</span> * </Box>
          <Box sx={{ pl: 1 }}><span style={{ color: '#569cd6' }}>FROM</span> <span style={{ color: '#4ec9b0' }}>TB_CM_ITEM_MST</span></Box>
          <Box sx={{ pl: 1 }}><span style={{ color: '#569cd6' }}>WHERE</span> <span style={{ color: '#9cdcfe' }}>ACTV_YN</span> = <span style={{ color: '#ce9178' }}>'Y'</span></Box>
          <Box sx={{ pl: 1 }}><span style={{ color: '#569cd6' }}>AND</span> <span style={{ color: '#9cdcfe' }}>ITEM_TP_CD</span> <span style={{ color: '#569cd6' }}>IN</span> (<span style={{ color: '#ce9178' }}>'FG'</span>,<span style={{ color: '#ce9178' }}>'WIP'</span>);</Box>
          <Box sx={{ color: '#6a9955', mt: 0.3 }}>-- 실행 결과: 342 rows</Box>
        </Box>
        <Box sx={{ display: 'flex', bgcolor: COLORS.headerBg, px: 0.5, py: 0.3, gap: 0.3, borderTop: `1px solid ${COLORS.border}` }}>
          <Box sx={{ ...SX.btn, ...SX.btnAccent }}>▶ 실행</Box>
          <Box sx={{ ...SX.btn, ...SX.btnGhost }}>⏹</Box>
          <Box sx={{ ...SX.btn, ...SX.btnGhost }}>💾</Box>
        </Box>
        <Box sx={{ height: '35%', borderTop: `1px solid ${COLORS.border}` }}>
          <GridRows cols={4} rows={3} hasHeader={true} />
        </Box>
      </Box>
    </>
  ),

  doc_viewer: () => (
    <>
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Box sx={{ width: 80, borderRight: `1px solid ${COLORS.border}`, bgcolor: 'white', p: 0.5 }}>
          <Box sx={{ fontSize: 8, fontWeight: 600, mb: 0.3 }}>📁 문서</Box>
          {['매뉴얼.pdf', '계약서.pdf', '제안서.docx', '사양서.xlsx'].map((f, i) => (
            <Box key={f} sx={{ fontSize: 7, color: i === 0 ? COLORS.primary : COLORS.text, fontWeight: i === 0 ? 600 : 400, py: 0.2 }}>📄 {f}</Box>
          ))}
        </Box>
        <Box sx={{ flex: 1, bgcolor: '#e5e7eb', p: 0.8, display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ width: '80%', bgcolor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', p: 0.5, display: 'flex', flexDirection: 'column', gap: 0.3 }}>
            <Box sx={{ fontSize: 9, fontWeight: 700, textAlign: 'center', mb: 0.4 }}>📄 매뉴얼.pdf</Box>
            {Array.from({ length: 8 }).map((_, i) => (
              <Box key={i} sx={{ height: 2, bgcolor: '#d1d5db', width: `${80 + (i % 3) * 7}%`, borderRadius: 1 }} />
            ))}
          </Box>
        </Box>
      </Box>
    </>
  ),

  diff_view: () => (
    <>
      <Box sx={SX.panelTitle}>Diff View</Box>
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0, fontFamily: 'Consolas, monospace', fontSize: 7 }}>
        <Box sx={{ flex: 1, borderRight: `1px solid ${COLORS.border}`, bgcolor: 'white', p: 0.3, overflow: 'hidden' }}>
          <Box sx={{ color: COLORS.textMuted, fontSize: 7, fontWeight: 600, mb: 0.3 }}>Before</Box>
          <Box>  function add(a, b) {`{`}</Box>
          <Box sx={{ bgcolor: '#ffdce0' }}>−   return a + b;</Box>
          <Box>  {`}`}</Box>
          <Box>  const x = 10;</Box>
          <Box sx={{ bgcolor: '#ffdce0' }}>−  let y = 20;</Box>
        </Box>
        <Box sx={{ flex: 1, bgcolor: 'white', p: 0.3, overflow: 'hidden' }}>
          <Box sx={{ color: COLORS.textMuted, fontSize: 7, fontWeight: 600, mb: 0.3 }}>After</Box>
          <Box>  function add(a, b) {`{`}</Box>
          <Box sx={{ bgcolor: '#cdffd8' }}>+   const sum = a + b;</Box>
          <Box sx={{ bgcolor: '#cdffd8' }}>+   return sum;</Box>
          <Box>  {`}`}</Box>
          <Box>  const x = 10;</Box>
          <Box sx={{ bgcolor: '#cdffd8' }}>+  const y = 20;</Box>
        </Box>
      </Box>
    </>
  ),

  chat: () => (
    <>
      <Box sx={SX.panelTitle}>Chat · 협업</Box>
      <Box sx={{ flex: 1, p: 0.5, display: 'flex', flexDirection: 'column', gap: 0.4, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', gap: 0.3, alignItems: 'flex-start' }}>
          <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: COLORS.primary, color: 'white', fontSize: 8, textAlign: 'center', lineHeight: '14px', flexShrink: 0 }}>홍</Box>
          <Box sx={{ bgcolor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 1, p: 0.4, fontSize: 8, maxWidth: '75%' }}>
            안녕하세요, 회의 자료 확인 부탁드립니다.
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.3, alignItems: 'flex-start', alignSelf: 'flex-end', flexDirection: 'row-reverse' }}>
          <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: COLORS.accent, color: 'white', fontSize: 8, textAlign: 'center', lineHeight: '14px', flexShrink: 0 }}>이</Box>
          <Box sx={{ bgcolor: '#e6f0fa', border: `1px solid ${COLORS.primary}33`, borderRadius: 1, p: 0.4, fontSize: 8, maxWidth: '75%' }}>
            네, 방금 확인했습니다. 👍
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.3, alignItems: 'flex-start' }}>
          <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: COLORS.warning, color: 'white', fontSize: 8, textAlign: 'center', lineHeight: '14px', flexShrink: 0 }}>박</Box>
          <Box sx={{ bgcolor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 1, p: 0.4, fontSize: 8, maxWidth: '75%' }}>
            2페이지 수정 필요해 보입니다.
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.3, p: 0.5, borderTop: `1px solid ${COLORS.border}`, bgcolor: 'white', flexShrink: 0 }}>
        <Box sx={{ flex: 1, bgcolor: '#f0f1f3', borderRadius: 1, px: 0.5, py: 0.3, fontSize: 8, color: COLORS.textMuted }}>메시지 입력...</Box>
        <Box sx={{ ...SX.btn, ...SX.btnPrimary }}>전송</Box>
      </Box>
    </>
  ),

  // ---- Fallback ----

  __fallback: () => (
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.textMuted, fontSize: 10 }}>
      미리보기 없음
    </Box>
  ),
};

// =====================================================================
// 확장 레이아웃 렌더러 (V2/V3/V4/V5/H2/H3/H4/H5/MIX) — 133개 신규 Seed 패턴용
//   atom + V()/H()/HW() 조합 DSL 로 한 줄 매핑.
// =====================================================================

function Strip({ h = 22, children, bg = 'white' }) {
  return (
    <Box sx={{ height: h, flexShrink: 0, bgcolor: bg, display: 'flex', alignItems: 'center',
               px: 0.5, gap: 0.4, fontSize: 8, borderBottom: `1px solid ${COLORS.border}` }}>
      {children}
    </Box>
  );
}

function Fill({ children, bg = 'white', p = 0 }) {
  return (
    <Box sx={{ flex: 1, bgcolor: bg, p, display: 'flex', flexDirection: 'column',
               minHeight: 0, minWidth: 0 }}>
      {children}
    </Box>
  );
}

// 동일 폭 수평 분할
function H(...items) {
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0, minWidth: 0 }}>
      {items.map((it, i) => (
        <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column',
                           minHeight: 0, minWidth: 0,
                           borderRight: i < items.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
          {it}
        </Box>
      ))}
    </Box>
  );
}

// 가중치 수평 분할: HW(2, elLeft, 5, elRight)
function HW(...args) {
  const parts = [];
  for (let i = 0; i < args.length; i += 2) parts.push({ w: args[i], el: args[i + 1] });
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0, minWidth: 0 }}>
      {parts.map((p, i) => (
        <Box key={i} sx={{ flex: p.w, display: 'flex', flexDirection: 'column',
                           minHeight: 0, minWidth: 0,
                           borderRight: i < parts.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
          {p.el}
        </Box>
      ))}
    </Box>
  );
}

// 수직 분할 (중첩된 세로 스택용)
function V(...items) {
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {items.map((it, i) => (
        <React.Fragment key={i}>{it}</React.Fragment>
      ))}
    </Box>
  );
}

function grid2D(rows, cols) {
  return (
    <Fill p={0.5}>
      <Box sx={{ display: 'grid', flex: 1, gap: 0.4,
                 gridTemplateRows:    `repeat(${rows}, 1fr)`,
                 gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: rows * cols }).map((_, i) => (
          <Box key={i} sx={{ bgcolor: '#f8f9fb', border: `1px solid ${COLORS.border}`, borderRadius: 0.3,
                             display: 'flex', alignItems: 'center', justifyContent: 'center',
                             fontSize: 8, color: COLORS.textMuted }}>
            {String.fromCharCode(65 + i)}
          </Box>
        ))}
      </Box>
    </Fill>
  );
}

// ---- 확장 아톰 (고정 스트립 + 플렉스 콘텐츠) ----
const A = {};

// 고정 높이 스트립
A.search = <SearchArea showButtons={false} />;

A.toolbar = (
  <Strip h={22}>
    <Box sx={{ ...SX.btn, ...SX.btnGhost }}>+</Box>
    <Box sx={{ ...SX.btn, ...SX.btnGhost }}>−</Box>
    <Box sx={{ ...SX.btn, ...SX.btnPrimary }}>💾</Box>
    <Box sx={{ ...SX.btn, ...SX.btnGhost }}>⬇</Box>
  </Strip>
);

A.tabs = <TabBar tabs={['탭 A', '탭 B', '탭 C']} active={0} />;

A.kpi = (
  <Box sx={{ display: 'flex', gap: 0.4, p: 0.4, bgcolor: 'white',
             borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0, height: 32 }}>
    <KpiCard value="1,234" label="KPI 1" color={COLORS.primary} />
    <KpiCard value="89%"   label="KPI 2" color={COLORS.accent} />
    <KpiCard value="456"   label="KPI 3" color={COLORS.warning} />
  </Box>
);

A.filters = (
  <Strip h={22}>
    {['카테고리', '기간', '상태', '지역'].map((t) => (
      <Chip key={t} label={t} variant="default" />
    ))}
  </Strip>
);

A.breadcrumb = (
  <Strip h={16}>
    <Box sx={{ fontSize: 8, color: COLORS.textMuted }}>Home › Section › Page</Box>
  </Strip>
);

A.notice = (
  <Box sx={{ height: 18, bgcolor: '#fff4dc', color: '#b67900', px: 0.8, fontSize: 8,
             lineHeight: '18px', borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
    ⚠ 공지: 시스템 점검 예정 · 2026-04-28
  </Box>
);

A.progress = (
  <Box sx={{ height: 16, bgcolor: 'white', flexShrink: 0, px: 0.5, display: 'flex',
             alignItems: 'center', gap: 0.4, borderBottom: `1px solid ${COLORS.border}` }}>
    <Box sx={{ flex: 1, height: 6, bgcolor: '#f0f1f3', borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ width: '65%', height: '100%', bgcolor: COLORS.accent }} />
    </Box>
    <Box sx={{ fontSize: 7, color: COLORS.textMuted, minWidth: 20, textAlign: 'right' }}>65%</Box>
  </Box>
);

A.stepper = (
  <Strip h={22}>
    {['①', '②', '③', '④'].map((s, i) => (
      <React.Fragment key={i}>
        <Box sx={{ width: 14, height: 14, borderRadius: '50%',
                   bgcolor: i === 1 ? COLORS.primary : '#e4e7ec',
                   color:   i === 1 ? 'white' : COLORS.textMuted,
                   textAlign: 'center', lineHeight: '14px', fontSize: 8 }}>{s}</Box>
        {i < 3 && <Box sx={{ width: 8, height: 1, bgcolor: COLORS.border }} />}
      </React.Fragment>
    ))}
  </Strip>
);

A.header = (
  <Strip h={22}>
    <Box sx={{ fontSize: 9, fontWeight: 600, color: COLORS.text }}>상세 정보</Box>
    <Chip label="활성" variant="success" />
    <Box sx={{ ml: 'auto', fontSize: 7, color: COLORS.textMuted }}>2024-01-01</Box>
  </Strip>
);

A.actions = (
  <Strip h={22}>
    <Box sx={{ ml: 'auto' }} />
    <Box sx={{ ...SX.btn, ...SX.btnGhost }}>취소</Box>
    <Box sx={{ ...SX.btn, ...SX.btnPrimary }}>저장</Box>
  </Strip>
);

A.status = (
  <Strip h={14}>
    <Box sx={{ fontSize: 7, color: COLORS.textMuted }}>총 120 건</Box>
    <Box sx={{ ml: 'auto', fontSize: 7, color: COLORS.textMuted }}>합계: 1,234,567</Box>
  </Strip>
);

A.pagination = (
  <Strip h={18}>
    <Box sx={{ margin: '0 auto', display: 'flex', alignItems: 'center', gap: 0.5,
               fontSize: 8, color: COLORS.textMuted }}>
      ‹ 1 <Box sx={{ color: COLORS.primary, fontWeight: 600 }}>2</Box> 3 4 5 ›
    </Box>
  </Strip>
);

A.footer = (
  <Strip h={14}>
    <Box sx={{ margin: '0 auto', fontSize: 7, color: COLORS.textMuted }}>© 2026 T3Series</Box>
  </Strip>
);

A.ribbon = (
  <Box sx={{ bgcolor: 'white', borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
    <Box sx={{ display: 'flex', height: 14, fontSize: 8, borderBottom: `1px solid ${COLORS.border}` }}>
      {['파일', '홈', '삽입', '분석'].map((t, i) => (
        <Box key={t} sx={{ px: 0.6, color: i === 1 ? COLORS.primary : COLORS.textMuted,
                           borderBottom: i === 1 ? `1.5px solid ${COLORS.primary}` : 'none',
                           lineHeight: '14px' }}>{t}</Box>
      ))}
    </Box>
    <Box sx={{ display: 'flex', height: 18, gap: 0.3, p: 0.3, alignItems: 'center' }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Box key={i} sx={{ width: 14, height: 14, bgcolor: '#f0f1f3', borderRadius: 0.3 }} />
      ))}
    </Box>
  </Box>
);

A.title = (
  <Strip h={16}>
    <Box sx={{ fontSize: 9, fontWeight: 600, color: COLORS.text }}>제목</Box>
  </Strip>
);

A.summary = (
  <Strip h={18}>
    <Box sx={{ fontSize: 8, color: COLORS.textMuted }}>Σ 합계</Box>
    <Box sx={{ fontSize: 9, fontWeight: 600, color: COLORS.primary, ml: 'auto' }}>1,234,567 ₩</Box>
  </Strip>
);

// 플렉스 콘텐츠 아톰
A.grid       = <Fill><GridRows cols={5} rows={4} /></Fill>;
A.grid_small = <Fill><GridRows cols={3} rows={3} /></Fill>;
A.chart      = <Fill><LineChart /></Fill>;
A.bars       = <Fill><BarChart bars={6} /></Fill>;
A.pie        = <Fill><PieChart /></Fill>;
A.tree       = <Fill><TreeList /></Fill>;

A.detail = (
  <Fill p={0.5}>
    <Box sx={{ fontSize: 8, fontWeight: 600, mb: 0.3, color: COLORS.text }}>상세 정보</Box>
    {['코드', '명칭', '구분', '수량', '비고'].map((k) => (
      <Box key={k} sx={{ display: 'flex', gap: 0.3, mb: 0.25, fontSize: 7 }}>
        <Box sx={{ width: 30, color: COLORS.textMuted }}>{k}</Box>
        <Box sx={{ flex: 1, bgcolor: '#f0f1f3', borderRadius: 0.3, height: 10 }} />
      </Box>
    ))}
  </Fill>
);

A.form = (
  <Fill p={0.5}>
    {['입력 A', '입력 B', '입력 C'].map((k) => (
      <Box key={k} sx={{ display: 'flex', gap: 0.3, mb: 0.3, fontSize: 7 }}>
        <Box sx={{ width: 36, color: COLORS.textMuted }}>{k}</Box>
        <Box sx={{ flex: 1, bgcolor: '#f0f1f3', borderRadius: 0.3, height: 10 }} />
      </Box>
    ))}
  </Fill>
);

A.log = (
  <Fill p={0.5} bg="#1e1e1e">
    {['[INFO] Starting batch', '[INFO] Processed 120 rows', '[WARN] Slow query',
      '[INFO] Completed in 1.2s'].map((l, i) => (
      <Box key={i} sx={{ color: l.includes('WARN') ? '#ffb100' : '#a6da95',
                         fontSize: 7, fontFamily: 'monospace', lineHeight: '10px' }}>{l}</Box>
    ))}
  </Fill>
);

A.cards = (
  <Fill p={0.5}>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.3, flex: 1 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Box key={i} sx={{ bgcolor: '#f8f9fb', border: `1px solid ${COLORS.border}`, borderRadius: 0.3,
                           display: 'flex', alignItems: 'center', justifyContent: 'center',
                           fontSize: 8, color: COLORS.textMuted }}>Card {i + 1}</Box>
      ))}
    </Box>
  </Fill>
);

A.list = (
  <Fill p={0.5}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.3, py: 0.3,
                         borderBottom: `1px solid ${COLORS.border}`, fontSize: 8,
                         bgcolor: i === 1 ? '#e6f0fa' : 'transparent' }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#e4e7ec' }} />
        <Box>항목 {i + 1}</Box>
        <Box sx={{ ml: 'auto', fontSize: 7, color: COLORS.textMuted }}>상태</Box>
      </Box>
    ))}
  </Fill>
);

A.pivot = (
  <Fill p={0.3}>
    <Box sx={{ display: 'flex', height: 10, bgcolor: COLORS.headerBg, borderBottom: `1px solid ${COLORS.border}` }}>
      {['D', 'D', 'M', 'V'].map((h, i) => (
        <Box key={i} sx={{ flex: 1, fontSize: 7, fontWeight: 600, color: COLORS.primary, px: 0.3, lineHeight: '10px' }}>{h}</Box>
      ))}
    </Box>
    {Array.from({ length: 4 }).map((_, r) => (
      <Box key={r} sx={{ display: 'flex', height: 10, borderBottom: `1px solid ${COLORS.border}` }}>
        {Array.from({ length: 4 }).map((_, c) => (
          <Box key={c} sx={{ flex: 1, fontSize: 7, color: COLORS.textMuted, px: 0.3, lineHeight: '10px' }}>···</Box>
        ))}
      </Box>
    ))}
  </Fill>
);

A.preview = (
  <Fill p={0.5}>
    <Box sx={{ border: `1px dashed ${COLORS.border}`, flex: 1, display: 'flex',
               alignItems: 'center', justifyContent: 'center', color: COLORS.textMuted, fontSize: 9 }}>
      👁 Preview
    </Box>
  </Fill>
);

A.editor = (
  <Fill p={0.4} bg="#1e1e1e">
    {["SELECT *", "  FROM TB_CM_ITEM", "  WHERE USE_YN = 'Y'", "    AND STATUS = 1"].map((l, i) => (
      <Box key={i} sx={{ color: '#c0caf5', fontSize: 7, fontFamily: 'monospace', lineHeight: '10px' }}>{l}</Box>
    ))}
  </Fill>
);

A.canvas = (
  <Fill p={0.4} bg="#fafafa">
    <Box sx={{ flex: 1,
               backgroundImage: `linear-gradient(${COLORS.border} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.border} 1px, transparent 1px)`,
               backgroundSize: '8px 8px', opacity: 0.5 }} />
  </Fill>
);

A.network = (
  <Fill>
    <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
      <line x1="20" y1="20" x2="50" y2="15" stroke={COLORS.border} strokeWidth="0.5" />
      <line x1="50" y1="15" x2="80" y2="25" stroke={COLORS.border} strokeWidth="0.5" />
      <line x1="50" y1="15" x2="45" y2="45" stroke={COLORS.border} strokeWidth="0.5" />
      <line x1="45" y1="45" x2="75" y2="50" stroke={COLORS.border} strokeWidth="0.5" />
      <line x1="20" y1="20" x2="45" y2="45" stroke={COLORS.border} strokeWidth="0.5" />
      {[[20, 20, COLORS.chart1], [50, 15, COLORS.chart2], [80, 25, COLORS.chart3],
        [45, 45, COLORS.chart1], [75, 50, COLORS.chart4]].map(([x, y, c], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill={c} />
      ))}
    </svg>
  </Fill>
);

A.timeline = (
  <Fill p={0.5}>
    {['2024.01 생성', '2024.03 수정', '2024.06 승인', '2024.09 완료'].map((e, i) => (
      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.4, py: 0.3,
                         fontSize: 7, color: COLORS.text }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: i === 2 ? COLORS.accent : COLORS.border }} />
        <Box sx={{ color: COLORS.textMuted }}>{e}</Box>
      </Box>
    ))}
  </Fill>
);

A.calendar = (
  <Fill p={0.4}>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.15, flex: 1 }}>
      {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
        <Box key={d} sx={{ fontSize: 7, fontWeight: 600, color: COLORS.textMuted,
                           textAlign: 'center', lineHeight: '10px' }}>{d}</Box>
      ))}
      {Array.from({ length: 21 }).map((_, i) => (
        <Box key={i} sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 0.2,
                           bgcolor: i === 8 ? '#e6f0fa' : 'white',
                           fontSize: 6, color: COLORS.textMuted, textAlign: 'center', lineHeight: '12px' }}>
          {i + 1}
        </Box>
      ))}
    </Box>
  </Fill>
);

A.gantt = (
  <Fill p={0.4}>
    {['Line A', 'Line B', 'Line C'].map((l, i) => (
      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.3, py: 0.25 }}>
        <Box sx={{ width: 28, fontSize: 7, color: COLORS.textMuted }}>{l}</Box>
        <Box sx={{ flex: 1, height: 8, bgcolor: '#f0f1f3', borderRadius: 0.3, position: 'relative' }}>
          <Box sx={{ position: 'absolute', left: `${i * 15 + 10}%`, width: '35%', top: 0,
                     height: '100%', bgcolor: [COLORS.chart1, COLORS.chart2, COLORS.chart3][i],
                     borderRadius: 0.3 }} />
        </Box>
      </Box>
    ))}
  </Fill>
);

A.map = (
  <Fill p={0.3} bg="#e8f4fa">
    <Box sx={{ flex: 1, position: 'relative' }}>
      {[[20, 25], [50, 15], [70, 40], [35, 55]].map(([x, y], i) => (
        <Box key={i} sx={{ position: 'absolute', left: `${x}%`, top: `${y}%`, fontSize: 10 }}>📍</Box>
      ))}
    </Box>
  </Fill>
);

A.flow = (
  <Fill>
    <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
      {[[20, 30], [45, 30], [70, 30], [45, 15], [70, 50]].map(([x, y], i) => (
        <React.Fragment key={i}>
          <rect x={x - 6} y={y - 4} width="12" height="8" fill="white" stroke={COLORS.primary} strokeWidth="0.6" rx="1" />
          <text x={x} y={y + 1} fontSize="4" textAnchor="middle" fill={COLORS.text}>N{i + 1}</text>
        </React.Fragment>
      ))}
      <line x1="26" y1="30" x2="39" y2="30" stroke={COLORS.border} strokeWidth="0.5" />
      <line x1="51" y1="30" x2="64" y2="30" stroke={COLORS.border} strokeWidth="0.5" />
      <line x1="45" y1="26" x2="45" y2="19" stroke={COLORS.border} strokeWidth="0.5" />
      <line x1="70" y1="34" x2="70" y2="46" stroke={COLORS.border} strokeWidth="0.5" />
    </svg>
  </Fill>
);

A.menu = (
  <Fill p={0.4}>
    {['▪ 홈', '▪ 통계', '▪ 주문', '▪ 재고', '▪ 설정'].map((m, i) => (
      <Box key={i} sx={{ px: 0.4, py: 0.25, fontSize: 8, borderRadius: 0.3,
                         bgcolor: i === 1 ? '#e6f0fa' : 'transparent',
                         color:   i === 1 ? COLORS.primary : COLORS.text,
                         fontWeight: i === 1 ? 600 : 400 }}>{m}</Box>
    ))}
  </Fill>
);

A.nav = (
  <Fill p={0.4}>
    {[['🏠', true], ['📊', false], ['📋', false], ['⚙', false], ['❓', false]].map(([icon, active], i) => (
      <Box key={i} sx={{ width: '100%', height: 20, borderRadius: 0.3, my: 0.2,
                         display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
                         bgcolor: active ? '#e6f0fa' : 'transparent',
                         color:   active ? COLORS.primary : COLORS.textMuted }}>{icon}</Box>
    ))}
  </Fill>
);

A.categories = (
  <Fill p={0.4}>
    {['전체', '가전', '의류', '식품', '도서', '가구'].map((c, i) => (
      <Box key={i} sx={{ px: 0.4, py: 0.25, fontSize: 8,
                         color: i === 1 ? COLORS.primary : COLORS.text,
                         fontWeight: i === 1 ? 600 : 400,
                         bgcolor: i === 1 ? '#e6f0fa' : 'transparent',
                         borderRadius: 0.3 }}>{c}</Box>
    ))}
  </Fill>
);

A.filter_panel = (
  <Fill p={0.4}>
    <Box sx={{ fontSize: 8, fontWeight: 600, mb: 0.3, color: COLORS.text }}>🔍 필터</Box>
    {['가격대', '브랜드', '색상', '크기', '재고'].map((f, i) => (
      <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mb: 0.25, fontSize: 7 }}>
        <Box sx={{ width: 8, height: 8, border: `1px solid ${COLORS.border}`, borderRadius: 0.2,
                   bgcolor: i < 2 ? COLORS.primary : 'white' }} />
        <Box sx={{ color: COLORS.text }}>{f}</Box>
      </Box>
    ))}
  </Fill>
);

A.search_panel = (
  <Fill p={0.4}>
    <Box sx={{ fontSize: 8, fontWeight: 600, mb: 0.3, color: COLORS.text }}>🔍 검색</Box>
    {['키워드', 'PlanScope', '기간', '상태'].map((k) => (
      <Box key={k} sx={{ display: 'flex', gap: 0.3, mb: 0.3, fontSize: 7 }}>
        <Box sx={{ width: 28, color: COLORS.textMuted }}>{k}</Box>
        <Box sx={{ flex: 1, bgcolor: '#f0f1f3', borderRadius: 0.3, height: 10 }} />
      </Box>
    ))}
    <Box sx={{ ...SX.btn, ...SX.btnPrimary, textAlign: 'center', mt: 0.3 }}>조회</Box>
  </Fill>
);

A.chat = (
  <Fill p={0.3}>
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.3, overflow: 'hidden' }}>
      {[{ user: '박', text: '확인했습니다', mine: false },
        { user: '나', text: '네, 감사합니다!', mine: true }].map((m, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 0.3, justifyContent: m.mine ? 'flex-end' : 'flex-start' }}>
          {!m.mine && (
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS.warning,
                       color: 'white', fontSize: 7, textAlign: 'center', lineHeight: '12px' }}>{m.user}</Box>
          )}
          <Box sx={{ bgcolor: m.mine ? COLORS.primary : 'white',
                     color:   m.mine ? 'white' : COLORS.text,
                     border:  m.mine ? 'none' : `1px solid ${COLORS.border}`,
                     borderRadius: 0.5, px: 0.4, py: 0.2, fontSize: 7 }}>{m.text}</Box>
        </Box>
      ))}
    </Box>
    <Box sx={{ display: 'flex', gap: 0.3, mt: 0.3 }}>
      <Box sx={{ flex: 1, bgcolor: '#f0f1f3', borderRadius: 0.3, height: 12 }} />
      <Box sx={{ ...SX.btn, ...SX.btnPrimary }}>전송</Box>
    </Box>
  </Fill>
);

A.tab_content = (
  <Fill>
    <TabBar tabs={['탭 A', '탭 B', '탭 C']} active={0} />
    <Fill><GridRows cols={4} rows={3} /></Fill>
  </Fill>
);

A.accordion = (
  <Fill p={0.4}>
    {[['▼ 섹션 A', true], ['▷ 섹션 B', false], ['▷ 섹션 C', false]].map(([t, open], i) => (
      <Box key={i} sx={{ mb: 0.3 }}>
        <Box sx={{ fontSize: 8, fontWeight: 600, color: COLORS.text, py: 0.2 }}>{t}</Box>
        {open && (
          <Box sx={{ pl: 0.6, fontSize: 7, color: COLORS.textMuted }}>
            <Box>- 내용 A-1</Box>
            <Box>- 내용 A-2</Box>
          </Box>
        )}
      </Box>
    ))}
  </Fill>
);

A.drawer = (
  <Box sx={{ width: 14, bgcolor: COLORS.headerBg, flexShrink: 0, borderRight: `1px solid ${COLORS.border}`,
             display: 'flex', flexDirection: 'column', alignItems: 'center', py: 0.4, gap: 0.3 }}>
    {['☰', '🏠', '📊', '⚙'].map((ic, i) => (
      <Box key={i} sx={{ fontSize: 9, color: COLORS.textMuted }}>{ic}</Box>
    ))}
  </Box>
);

A.v_stepper = (
  <Fill p={0.4}>
    {['① 준비', '● 진행', '③ 검토', '④ 완료'].map((s, i) => (
      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.4, py: 0.3, fontSize: 8,
                         color: i === 1 ? COLORS.primary : COLORS.textMuted,
                         fontWeight: i === 1 ? 600 : 400 }}>{s}</Box>
    ))}
  </Fill>
);

A.diff = (
  <Fill p={0.3} bg="#1e1e1e">
    {[['', 'line A'], ['-', 'line B (old)'], ['+', 'line B (new)'], ['', 'line C']].map(([sign, t], i) => (
      <Box key={i} sx={{ fontSize: 7, fontFamily: 'monospace', lineHeight: '10px',
                         color: sign === '-' ? '#ff6b6b' : sign === '+' ? '#a6da95' : '#c0caf5' }}>
        {sign || ' '} {t}
      </Box>
    ))}
  </Fill>
);

A.tool_panel = (
  <Fill p={0.4}>
    <Box sx={{ fontSize: 8, fontWeight: 600, mb: 0.3, color: COLORS.text, textAlign: 'center' }}>🛠</Box>
    {['🖌', '✂', '🔍', '⚙', '💾'].map((ic, i) => (
      <Box key={i} sx={{ fontSize: 11, color: COLORS.textMuted, py: 0.2, textAlign: 'center' }}>{ic}</Box>
    ))}
  </Fill>
);

A.file_tree = (
  <Fill p={0.3}>
    <Box sx={{ fontSize: 7, lineHeight: '11px' }}>
      <Box>📁 프로젝트</Box>
      <Box sx={{ pl: 1 }}>▼ 📁 src</Box>
      <Box sx={{ pl: 2, color: COLORS.primary, bgcolor: '#e6f0fa', borderRadius: 0.2 }}>📄 App.jsx</Box>
      <Box sx={{ pl: 2, color: COLORS.textMuted }}>📄 index.js</Box>
      <Box sx={{ pl: 1, color: COLORS.textMuted }}>▶ 📁 components</Box>
      <Box sx={{ pl: 1, color: COLORS.textMuted }}>📄 package.json</Box>
    </Box>
  </Fill>
);

A.content = (
  <Fill p={0.5}>
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
               color: COLORS.textMuted, fontSize: 9,
               border: `1px dashed ${COLORS.border}`, borderRadius: 0.5 }}>
      Main Content
    </Box>
  </Fill>
);

// ---- 확장 렌더러 ----
Object.assign(RENDERERS, {

  // LAYOUT_V2
  v2_search_grid:        () => <>{A.search}{A.grid}</>,
  v2_search_chart:       () => <>{A.search}{A.chart}</>,
  v2_search_cards:       () => <>{A.search}{A.cards}</>,
  v2_search_tree:        () => <>{A.search}{A.tree}</>,
  v2_search_pivot:       () => <>{A.search}{A.pivot}</>,
  v2_filter_list:        () => <>{A.filters}{A.list}</>,
  v2_toolbar_grid:       () => <>{A.toolbar}{A.grid}</>,
  v2_kpi_grid:           () => <>{A.kpi}{A.grid}</>,
  v2_kpi_chart:          () => <>{A.kpi}{A.chart}</>,
  v2_grid_chart:         () => <>{A.grid}{A.chart}</>,
  v2_chart_grid:         () => <>{A.chart}{A.grid}</>,
  v2_form_grid:          () => <>{A.form}{A.grid}</>,
  v2_form_chart:         () => <>{A.form}{A.chart}</>,
  v2_header_tab:         () => <>{A.header}{A.tab_content}</>,
  v2_master_master:      () => <>{A.grid}{A.grid_small}</>,
  v2_info_grid:          () => <>{A.header}{A.grid}</>,
  v2_search_gantt:       () => <>{A.search}{A.gantt}</>,
  v2_search_map:         () => <>{A.search}{A.map}</>,
  v2_search_flo:         () => <>{A.search}{A.flow}</>,
  v2_title_canvas:       () => <>{A.title}{A.canvas}</>,
  v2_notice_main:        () => <>{A.notice}{A.content}</>,
  v2_progress_content:   () => <>{A.progress}{A.content}</>,
  v2_header_timeline:    () => <>{A.header}{A.timeline}</>,
  v2_search_calendar:    () => <>{A.search}{A.calendar}</>,
  v2_breadcrumb_content: () => <>{A.breadcrumb}{A.content}</>,

  // LAYOUT_V3
  v3_search_grid_chart:        () => <>{A.search}{A.grid}{A.chart}</>,
  v3_search_chart_grid:        () => <>{A.search}{A.chart}{A.grid}</>,
  v3_search_kpi_grid:          () => <>{A.search}{A.kpi}{A.grid}</>,
  v3_header_main_action:       () => <>{A.header}{A.content}{A.actions}</>,
  v3_toolbar_grid_status:      () => <>{A.toolbar}{A.grid}{A.status}</>,
  v3_search_tab_detail:        () => <>{A.search}{A.tab_content}{A.detail}</>,
  v3_kpi_grid_chart:           () => <>{A.kpi}{A.grid}{A.chart}</>,
  v3_search_master_detail_v:   () => <>{A.search}{A.grid}{A.grid_small}</>,
  v3_search_grid_log:          () => <>{A.search}{A.grid}{A.log}</>,
  v3_stepper_form_button:      () => <>{A.stepper}{A.form}{A.actions}</>,
  v3_filter_cards_pagination:  () => <>{A.filters}{A.cards}{A.pagination}</>,
  v3_search_gantt_grid:        () => <>{A.search}{A.gantt}{A.grid}</>,
  v3_search_pivot_chart:       () => <>{A.search}{A.pivot}{A.chart}</>,
  v3_header_lines_summary:     () => <>{A.header}{A.grid}{A.summary}</>,
  v3_kpi_chart_grid:           () => <>{A.kpi}{A.chart}{A.grid}</>,
  v3_search_map_grid:          () => <>{A.search}{A.map}{A.grid}</>,
  v3_search_network_grid:      () => <>{A.search}{A.network}{A.grid}</>,
  v3_progress_grid_action:     () => <>{A.progress}{A.grid}{A.actions}</>,
  v3_condition_preview_result: () => <>{A.form}{A.editor}{A.grid}</>,
  v3_notice_kpi_grid:          () => <>{A.notice}{A.kpi}{A.grid}</>,

  // LAYOUT_V4
  v4_search_kpi_grid_chart:         () => <>{A.search}{A.kpi}{A.grid}{A.chart}</>,
  v4_search_toolbar_grid_detail:    () => <>{A.search}{A.toolbar}{A.grid}{A.detail}</>,
  v4_header_tab_grid_action:        () => <>{A.header}{A.tabs}{A.grid}{A.actions}</>,
  v4_stepper_search_grid_detail:    () => <>{A.stepper}{A.search}{A.grid}{A.detail}</>,
  v4_filter_cards_grid_chart:       () => <>{A.filters}{A.cards}{A.grid}{A.chart}</>,
  v4_search_kpi_chart_grid:         () => <>{A.search}{A.kpi}{A.chart}{A.grid}</>,
  v4_toolbar_search_grid_footer:    () => <>{A.toolbar}{A.search}{A.grid}{A.summary}</>,
  v4_header_kpi_tab_detail:         () => <>{A.header}{A.kpi}{A.tabs}{A.detail}</>,
  v4_search_pivot_grid_chart:       () => <>{A.search}{A.pivot}{A.grid}{A.chart}</>,
  v4_notice_filter_list_pagination: () => <>{A.notice}{A.filters}{A.list}{A.pagination}</>,

  // LAYOUT_V5
  v5_search_kpi_chart_grid_detail:      () => <>{A.search}{A.kpi}{A.chart}{A.grid}{A.detail}</>,
  v5_header_toolbar_tree_grid_log:      () => <>{A.header}{A.toolbar}{A.tree}{A.grid}{A.log}</>,
  v5_nav_search_kpi_grid_status:        () => <>{A.breadcrumb}{A.search}{A.kpi}{A.grid}{A.status}</>,
  v5_header_stepper_tab_content_action: () => <>{A.header}{A.stepper}{A.tabs}{A.content}{A.actions}</>,
  v5_notice_filter_kpi_grid_pagination: () => <>{A.notice}{A.filters}{A.kpi}{A.grid}{A.pagination}</>,

  // LAYOUT_H2
  h2_master_detail:     () => H(A.grid, A.detail),
  h2_tree_grid:         () => HW(2, A.tree, 5, A.grid),
  h2_form_grid:         () => H(A.form, A.grid),
  h2_chart_grid:        () => H(A.chart, A.grid),
  h2_menu_content:      () => HW(2, A.menu, 5, A.content),
  h2_list_editform:     () => HW(2, A.list, 5, A.form),
  h2_nav_main:          () => HW(1, A.nav, 6, A.content),
  h2_filetree_editor:   () => HW(2, A.file_tree, 5, A.editor),
  h2_category_items:    () => HW(2, A.categories, 5, A.cards),
  h2_searchcond_result: () => HW(2, A.search_panel, 5, A.grid),
  h2_grid_chart:        () => H(A.grid, A.chart),
  h2_tree_detail_form:  () => HW(2, A.tree, 5, A.detail),
  h2_list_preview:      () => H(A.list, A.preview),
  h2_form_preview:      () => H(A.form, A.preview),
  h2_filter_cards:      () => HW(2, A.filter_panel, 5, A.cards),
  h2_channel_chat:      () => HW(2, A.list, 5, A.chat),

  // LAYOUT_H3
  h3_tree_grid_detail:     () => HW(2, A.tree, 4, A.grid, 3, A.detail),
  h3_menu_list_editor:     () => HW(2, A.menu, 3, A.list, 4, A.editor),
  h3_category_grid_chart:  () => HW(2, A.categories, 4, A.grid, 3, A.chart),
  h3_tree_chart_grid:      () => HW(2, A.tree, 4, A.chart, 4, A.grid),
  h3_left_main_right:      () => HW(1, A.nav, 5, A.content, 2, A.detail),
  h3_folder_editor_output: () => HW(2, A.file_tree, 4, A.editor, 3, A.log),
  h3_filter_list_detail:   () => HW(2, A.filter_panel, 3, A.list, 3, A.detail),
  h3_folder_file_preview:  () => HW(2, A.file_tree, 2, A.list, 3, A.preview),
  h3_step_form_result:     () => HW(1, A.v_stepper, 3, A.form, 3, A.preview),
  h3_source_diff_target:   () => HW(3, A.editor, 3, A.diff, 3, A.editor),

  // LAYOUT_H4
  h4_menu_tree_grid_detail:      () => HW(1, A.menu, 2, A.tree, 4, A.grid, 3, A.detail),
  h4_filter_category_list_chart: () => HW(2, A.filter_panel, 2, A.categories, 3, A.list, 3, A.chart),
  h4_nav_tree_editor_output:     () => HW(1, A.nav, 2, A.file_tree, 4, A.editor, 3, A.log),
  h4_drill_drill_drill_detail:   () => HW(2, A.list, 2, A.list, 2, A.list, 3, A.detail),
  h4_menu_center_center_tool:    () => HW(1, A.menu, 3, A.content, 3, A.content, 2, A.tool_panel),

  // LAYOUT_H5
  h5_nav_tree_grid_detail_toolbar:     () => HW(1, A.nav, 2, A.tree, 4, A.grid, 3, A.detail, 1, A.tool_panel),
  h5_menu_category_list_detail_action: () => HW(1, A.menu, 2, A.categories, 3, A.list, 3, A.detail, 2, A.tool_panel),

  // LAYOUT_MIXED
  mix_v2_h2_search_tree_grid:          () => <>{A.search}{HW(2, A.tree, 5, A.grid)}</>,
  mix_v2_h2v2_tree_chart_grid:         () => <>{A.search}{HW(2, A.tree, 5, V(A.chart, A.grid))}</>,
  mix_v2_h3_filter_grid_detail:        () => <>{A.header}{HW(2, A.filter_panel, 4, A.grid, 3, A.detail)}</>,
  mix_v2_h2_master_detail:             () => <>{A.search}{H(A.grid, A.detail)}</>,
  mix_v2_h2v2_toolbar_tree_chart_grid: () => <>{A.toolbar}{HW(2, A.tree, 5, V(A.chart, A.grid))}</>,
  mix_v2_tab_bottom:                   () => <>{A.search}{A.tab_content}</>,
  mix_v2_kpi_tab:                      () => <>{A.kpi}{A.tab_content}</>,
  mix_v2_form_tab:                     () => <>{A.form}{A.tab_content}</>,
  mix_v3_mid_h2:                       () => <>{A.search}{H(A.grid, A.chart)}{A.detail}</>,
  mix_v3_kpi_mid_detail:               () => <>{A.kpi}{H(A.grid, A.detail)}{A.log}</>,
  mix_h2_right_v2:                     () => HW(2, A.tree, 5, V(A.grid, A.detail)),
  mix_h2_right_v3:                     () => HW(2, A.grid, 5, V(A.chart, A.grid, A.log)),
  mix_h2_right_v3b:                    () => HW(1, A.nav, 6, V(A.search, A.grid, A.pagination)),
  mix_h3_mid_v2:                       () => HW(2, A.filter_panel, 4, V(A.chart, A.grid), 3, A.detail),
  mix_h3_mid_v3:                       () => HW(2, A.tree, 4, V(A.kpi, A.chart, A.grid), 3, A.detail),
  mix_tab_h2:                          () => <>{A.tabs}{H(A.content, A.content)}</>,
  mix_tab_v2:                          () => <>{A.tabs}{A.grid}{A.chart}</>,
  mix_tab_h3:                          () => <>{A.tabs}{HW(2, A.tree, 4, A.grid, 3, A.detail)}</>,
  mix_stepper_tab:                     () => <>{A.stepper}{A.tab_content}</>,
  mix_sidetab_main:                    () => HW(1, A.nav, 6, A.content),
  mix_accordion_main:                  () => HW(2, A.accordion, 5, A.content),
  mix_v2_accordion_grid:               () => <>{A.search}{HW(2, A.accordion, 5, A.grid)}</>,
  mix_drawer_main:                     () => (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0 }}>{A.drawer}{A.content}</Box>
  ),
  mix_notice_drawer_main:              () => (
    <>{A.notice}
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0 }}>{A.drawer}{A.content}</Box>
    </>
  ),

  // 격자
  mix_grid_2x2:         () => grid2D(2, 2),
  mix_grid_2x3:         () => grid2D(2, 3),
  mix_grid_3x2:         () => grid2D(3, 2),
  mix_grid_3x3:         () => grid2D(3, 3),
  mix_strip_horizontal: () => <>{H(A.bars, A.chart, A.pie, A.bars)}{A.detail}</>,
  mix_strip_vertical:   () => <>{A.bars}{A.chart}{A.pie}{A.bars}</>,

  // 익스플로러·앱쉘·리본
  mix_explorer_5:                () => <>{A.header}{HW(2, A.nav, 5, A.content, 2, A.detail)}{A.footer}</>,
  mix_explorer_3:                () => <>{A.header}{HW(2, A.tree, 5, V(A.grid, A.detail))}{A.footer}</>,
  mix_header_nav_content_status: () => <>{A.header}{HW(1, A.nav, 6, A.tab_content)}{A.status}</>,
  mix_ribbon_main:               () => <>{A.ribbon}{A.content}</>,
  mix_ribbon_h2:                 () => <>{A.ribbon}{H(A.content, A.content)}</>,

  // 마스터 + 변형
  mix_master_tabbed_detail:   () => HW(2, A.grid, 5, A.tab_content),
  mix_master_v_tabbed_detail: () => <>{A.grid}{A.tab_content}</>,
  mix_master_v2_detail:       () => HW(2, A.grid, 5, V(A.form, A.grid)),
  mix_report_v3:              () => <>{A.filters}{H(V(A.bars, A.chart), V(A.pie, A.bars))}{A.grid}</>,
  mix_side_v3:                () => HW(1, A.nav, 6, V(A.kpi, A.chart, A.grid)),
});

// =====================================================================
// ControlBoard 렌더러 — 다크 테마, 31개 CB_* 레이아웃
//   SCM Engine Control Board UI Patterns HTML 기반.
// =====================================================================

const DC = {
  bg:       '#0f1219',
  surface:  '#171b26',
  surface2: '#1d2331',
  surface3: '#262d40',
  border:   '#2f374e',
  border2:  '#404b69',
  text:     '#ebedf2',
  text2:    '#a5b0c7',
  text3:    '#626f8d',
  blue:     '#3b82f6',
  cyan:     '#06b6d4',
  green:    '#10b981',
  amber:    '#f59e0b',
  red:      '#ef4444',
  purple:   '#8b5cf6',
};

function CBWrap({ header, children }) {
  return (
    <Box sx={{ flex: 1, bgcolor: DC.bg, display: 'flex', flexDirection: 'column',
               p: 0.4, gap: 0.3, minHeight: 0, minWidth: 0 }}>
      {header}
      {children}
    </Box>
  );
}

function CBHead({ title, titleColor = DC.cyan, right }) {
  return (
    <Box sx={{ height: 14, display: 'flex', alignItems: 'center', flexShrink: 0, px: 0.2 }}>
      <Box sx={{ fontSize: 8, fontWeight: 700, color: titleColor }}>{title}</Box>
      {right && <Box sx={{ ml: 'auto' }}>{right}</Box>}
    </Box>
  );
}

function CBBadge({ label, color }) {
  return (
    <Box sx={{ bgcolor: `${color}22`, color, fontSize: 6, fontWeight: 700,
               px: 0.4, py: 0.1, borderRadius: 0.3, border: `1px solid ${color}55` }}>
      {label}
    </Box>
  );
}

function CBCard({ title, titleColor = DC.text, borderColor = DC.border, children, flex = 1 }) {
  return (
    <Box sx={{ flex, bgcolor: DC.surface, border: `1px solid ${borderColor}`, borderRadius: 0.4, p: 0.3,
               display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
      {title && <Box sx={{ fontSize: 6, fontWeight: 700, color: titleColor, mb: 0.2, flexShrink: 0 }}>{title}</Box>}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>{children}</Box>
    </Box>
  );
}

function CBProgressRow({ label, pct, color = DC.cyan }) {
  return (
    <Box sx={{ mb: 0.25 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 6, color: DC.text2, lineHeight: '7px' }}>
        <Box>{label}</Box><Box>{pct}%</Box>
      </Box>
      <Box sx={{ height: 3, bgcolor: DC.surface3, borderRadius: 2, overflow: 'hidden', mt: 0.1 }}>
        <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: color }} />
      </Box>
    </Box>
  );
}

function CBStepper({ steps, activeIdx = 0 }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2, flex: 1, justifyContent: 'center' }}>
      {steps.map((s, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
            <Box sx={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                       bgcolor: done ? `${DC.green}33` : active ? DC.cyan : DC.surface3,
                       color:   done ? DC.green : active ? '#000' : DC.text3,
                       fontSize: 6, textAlign: 'center', lineHeight: '9px', fontWeight: 700 }}>
              {done ? '✓' : (i + 1)}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ fontSize: 6, color: active ? DC.cyan : done ? DC.text : DC.text3,
                         lineHeight: '7px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s}</Box>
              <Box sx={{ height: 2, bgcolor: DC.surface3, borderRadius: 1, mt: 0.1 }}>
                <Box sx={{ width: done ? '100%' : active ? '45%' : '0%', height: '100%',
                           bgcolor: done ? DC.green : DC.cyan, borderRadius: 1 }} />
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function CBTable({ cols, rows, rowBg = [], colFlex, fontSize = 5 }) {
  const getFlex = (i) => (Array.isArray(colFlex) ? (colFlex[i] ?? 1) : 1);
  return (
    <Box sx={{ flex: 1, bgcolor: DC.surface, border: `1px solid ${DC.border}`, borderRadius: 0.3,
               overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ display: 'flex', bgcolor: DC.surface3, borderBottom: `1px solid ${DC.border}`, flexShrink: 0 }}>
        {cols.map((c, i) => (
          <Box key={i} sx={{ flex: getFlex(i), fontSize, color: DC.text2, px: 0.3, py: 0.25, fontWeight: 700,
                             borderRight: i < cols.length - 1 ? `1px solid ${DC.border}` : 'none',
                             whiteSpace: 'nowrap', overflow: 'hidden' }}>{c}</Box>
        ))}
      </Box>
      {rows.map((r, i) => (
        <Box key={i} sx={{ display: 'flex',
                           borderBottom: i < rows.length - 1 ? `1px solid ${DC.border}` : 'none',
                           bgcolor: rowBg[i] || 'transparent' }}>
          {r.map((c, j) => {
            const isObj = c !== null && typeof c === 'object' && !React.isValidElement(c);
            const text = isObj ? c.v : c;
            const cellColor  = (isObj && c.color) || DC.text;
            const cellBg     = isObj ? c.bg : undefined;
            const fontWeight = (isObj && c.bold) ? 700 : 400;
            const family     = (isObj && c.mono) ? 'monospace' : undefined;
            const align      = (isObj && c.align) || 'left';
            return (
              <Box key={j} sx={{ flex: getFlex(j), fontSize, color: cellColor, px: 0.3, py: 0.22,
                                 fontWeight, fontFamily: family, textAlign: align,
                                 borderRight: j < r.length - 1 ? `1px solid ${DC.border}` : 'none',
                                 whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                 bgcolor: cellBg }}>
                {text}
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}

function CBStat({ value, label, valueColor = DC.text, bg = DC.surface3, border }) {
  return (
    <Box sx={{
      flex: 1, bgcolor: bg, borderRadius: 0.3, py: 0.3, px: 0.2, textAlign: 'center',
      border: border ? `1px solid ${border}` : 'none', minWidth: 0,
    }}>
      <Box sx={{ fontSize: 9, color: valueColor, fontWeight: 700, lineHeight: '11px' }}>{value}</Box>
      <Box sx={{ fontSize: 4, color: valueColor === DC.red ? DC.red : DC.text3, mt: 0.1, whiteSpace: 'nowrap', overflow: 'hidden' }}>{label}</Box>
    </Box>
  );
}

function CBBtn({ label, color = DC.blue, flex, solid = false }) {
  return (
    <Box sx={{
      flex: flex ?? undefined,
      bgcolor: solid ? color : `${color}22`,
      color: solid ? '#fff' : color,
      border: `1px solid ${color}${solid ? '' : '55'}`,
      fontSize: 6, fontWeight: 700, textAlign: 'center',
      borderRadius: 0.3, px: 0.3, py: 0.25,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>
      {label}
    </Box>
  );
}

function CBInput({ value, flex = 1, icon }) {
  return (
    <Box sx={{
      flex, bgcolor: DC.surface3, border: `1px solid ${DC.border}`,
      borderRadius: 0.3, px: 0.3, py: 0.25, fontSize: 5, color: DC.text,
      display: 'flex', alignItems: 'center', gap: 0.2, minWidth: 0,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>
      {icon && <Box sx={{ color: DC.text3, fontSize: 5 }}>{icon}</Box>}
      <Box sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</Box>
    </Box>
  );
}

// 컬러 뱃지 텍스트(테이블 안에서 사용)
function cbBadgeCell(label, color) {
  return { v: label, color, bold: true, bg: `${color}22` };
}

function CBTerminal({ lines, activeLine }) {
  return (
    <Box sx={{ flex: 1, bgcolor: '#000', fontFamily: 'monospace', fontSize: 5, p: 0.3,
               borderRadius: 0.3, minHeight: 0, overflow: 'hidden' }}>
      {lines.map((l, i) => (
        <Box key={i} sx={{ lineHeight: '7px', color: '#10b981' }}>{l}</Box>
      ))}
      {activeLine && <Box sx={{ lineHeight: '7px', color: DC.cyan, fontWeight: 700 }}>{activeLine}</Box>}
    </Box>
  );
}

function CBRow(...items) { return <Box sx={{ display: 'flex', gap: 0.3, flex: 1, minHeight: 0 }}>{React.Children.toArray(items)}</Box>; }
function CBCol(...items) { return <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3, flex: 1, minHeight: 0 }}>{React.Children.toArray(items)}</Box>; }

// ---- 재사용 공통 렌더러 ----
function cbSimpleTable(title, cols, rows, topRight, rowBg) {
  return (
    <CBWrap header={<CBHead title={title} right={topRight} />}>
      <CBTable cols={cols} rows={rows} rowBg={rowBg || []} />
    </CBWrap>
  );
}

function cbCardGrid(title, items, cols, topRight) {
  return (
    <CBWrap header={<CBHead title={title} right={topRight} />}>
      <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 0.3, minHeight: 0 }}>
        {items.map((it, i) => (
          <Box key={i} sx={{ bgcolor: DC.surface, border: `1px solid ${it.border || DC.border}`,
                             borderRadius: 0.3, p: 0.3, display: 'flex', flexDirection: 'column',
                             alignItems: 'center', justifyContent: 'center', gap: 0.2 }}>
            {it.top && <Box sx={{ fontSize: 6, color: it.topColor || DC.text2, fontWeight: 700 }}>{it.top}</Box>}
            <Box sx={{ fontSize: 7, color: it.color || DC.text, fontWeight: 700 }}>{it.label}</Box>
            {it.bottom && <Box sx={{ fontSize: 5, color: DC.text3 }}>{it.bottom}</Box>}
          </Box>
        ))}
      </Box>
    </CBWrap>
  );
}

Object.assign(RENDERERS, {

  // ---- CB_01 ControlBoard (마스터 대시보드) ----
  cb_master_dashboard: () => (
    <CBWrap header={
      <CBHead
        title="🎛️ SCM Engine Master Dashboard"
        titleColor={DC.cyan}
        right={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3,
                     bgcolor: DC.surface, border: `1px solid ${DC.border}`,
                     px: 0.3, py: 0.15, borderRadius: 0.3 }}>
            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: DC.green,
                       boxShadow: `0 0 4px ${DC.green}` }} />
            <Box sx={{ fontSize: 5, color: DC.text, fontWeight: 700, fontFamily: 'monospace' }}>
              SYSTEM: ONLINE
            </Box>
          </Box>
        }
      />}>
      {CBRow(
        <CBCard title="엔진 종합 제어 (Control)" titleColor={DC.cyan} borderColor={DC.cyan}>
          <Box sx={{ bgcolor: DC.surface3, p: 0.3, borderRadius: 0.3, textAlign: 'center', mb: 0.25 }}>
            <Box sx={{ fontSize: 4, color: DC.text3 }}>현재 엔진 상태</Box>
            <Box sx={{ fontSize: 10, color: DC.green, fontWeight: 700, fontFamily: 'monospace', lineHeight: '12px' }}>
              RUNNING (45%)
            </Box>
            <Box sx={{ fontSize: 4, color: DC.text3 }}>Job: RUN-2411-0089</Box>
          </Box>
          <Box sx={{ fontSize: 4, color: DC.text2, fontWeight: 700, mb: 0.15 }}>시나리오 대상 및 옵션</Box>
          <Box sx={{ display: 'flex', gap: 0.2, mb: 0.25 }}>
            <CBInput value="📅 2024-11-01" />
            <CBInput value="Heuristic ▾" />
          </Box>
          <Box sx={{ display: 'flex', gap: 0.2, mt: 'auto' }}>
            <CBBtn label="▶ 전체 실행" color={DC.blue} flex={1} />
            <CBBtn label="■ 강제 중지" color={DC.red} flex={1} />
          </Box>
        </CBCard>,
        <CBCard title="실시간 파이프라인 단계">
          <CBStepper
            steps={['1. I/F Data Extract', '2. Master Data Check', '3. Heuristic Engine (Running)', '4. Post Processing', '5. Result Publish']}
            activeIdx={2}
          />
        </CBCard>,
        <CBCard title="노드 리소스 현황">
          <CBProgressRow label="Cluster CPU Avg" pct={78} color={DC.amber} />
          <CBProgressRow label="Cluster Memory (118/128GB)" pct={92} color={DC.red} />
          <Box sx={{ display: 'flex', gap: 0.2, mt: 'auto' }}>
            <CBStat value="12" label="Active Nodes" valueColor={DC.green} />
            <CBStat value="1"  label="Dead Nodes"  valueColor={DC.red} bg={`${DC.red}22`} border={DC.red} />
          </Box>
        </CBCard>
      )}
      {CBRow(
        <CBCard title="최근 엔진 구동 이력">
          <CBTable
            cols={['Job ID', '소요시간', '상태']}
            colFlex={[1.6, 1, 1]}
            rows={[
              [{ v: 'RUN-2411-089', color: DC.blue, mono: true }, '2m 34s', cbBadgeCell('Success', DC.green)],
              [{ v: 'RUN-2411-088', color: DC.blue, mono: true }, '3m 12s', cbBadgeCell('Error',   DC.red)],
              [{ v: 'RUN-2411-087', color: DC.blue, mono: true }, '2m 58s', cbBadgeCell('Success', DC.green)],
              [{ v: 'RUN-2411-086', color: DC.blue, mono: true }, '2m 41s', cbBadgeCell('Success', DC.green)],
              [{ v: 'RUN-2411-085', color: DC.blue, mono: true }, '2m 29s', cbBadgeCell('Success', DC.green)],
            ]}
          />
        </CBCard>,
        <CBCard title="치명적 예외 및 오류 (Top 5)" titleColor={DC.red} borderColor={DC.red}>
          <CBTable
            cols={['모듈', '에러 내용']}
            colFlex={[0.9, 2]}
            rows={[
              [{ v: 'Solver',    color: DC.text2, bold: true }, 'Memory Limit Exceeded'],
              [{ v: 'DataLoad',  color: DC.text2, bold: true }, 'Missing LT values'],
              [{ v: 'MDM',       color: DC.text2, bold: true }, 'Cycle detected in BOM'],
              [{ v: 'Heuristic', color: DC.text2, bold: true }, 'Timeout during calc'],
              [{ v: 'PostProc',  color: DC.text2, bold: true }, 'Failed to write to DB'],
            ]}
          />
        </CBCard>,
        <CBCard title="Live Terminal (실시간 로그)">
          <CBTerminal
            lines={[
              '[14:30:01] INFO batch 3421 OK',
              '[14:30:05] INFO batch 3422 OK',
              '[14:30:10] INFO Item master',
              '[14:31:12] WARN Slow query',
              '[14:32:00] INFO Heur iter 42',
              '[14:32:45] INFO Matrix 65%',
              '[14:33:10] INFO LP step 1',
            ]}
            activeLine="[14:33:45] ENGINE RUNNING... (45%)"
          />
        </CBCard>
      )}
    </CBWrap>
  ),

  // ---- CB_02 ControlBoard(복합공정 / LED 4공정) ----
  cb_composite_process: () => (
    <CBWrap header={
      <CBHead
        title="🏭 LED 4대 공정 MP/MRP 개별 제어"
        titleColor={DC.cyan}
        right={<CBBtn label="⚡ 4공정 일괄 배치 Run (Backward)" color={DC.blue} solid />}
      />}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.25, flexShrink: 0 }}>
        {[
          { name: '1. MOD (모듈 조립)', color: DC.green,  mpState: '완료',   mpColor: DC.green, mpTime: '14:30 | 12m 30s',      mrpState: '완료', mrpColor: DC.green, mrpTime: '14:35 | 05m 10s' },
          { name: '2. PKG (패키징)',    color: DC.amber,  mpState: '실행중', mpColor: DC.cyan,  mpTime: '진행율 65% | 08m...',  mrpState: '대기', mrpColor: DC.text3, mrpTime: 'MP 완료 후 대기' },
          { name: '3. FAB (칩 제조)',   color: DC.blue,   mpState: '대기',   mpColor: DC.text3, mpTime: '-',                    mrpState: '대기', mrpColor: DC.text3, mrpTime: '-' },
          { name: '4. EPI (에피택시)',  color: DC.purple, mpState: '대기',   mpColor: DC.text3, mpTime: '-',                    mrpState: '대기', mrpColor: DC.text3, mrpTime: '-' },
        ].map((p, i) => (
          <Box key={i} sx={{ bgcolor: DC.surface, borderTop: `2px solid ${p.color}`,
                             border: `1px solid ${DC.border}`, borderRadius: 0.3, p: 0.3,
                             display: 'flex', flexDirection: 'column', gap: 0.2 }}>
            <Box sx={{ fontSize: 6, fontWeight: 700, color: DC.text }}>{p.name}</Box>
            <Box sx={{ display: 'flex', gap: 0.2 }}>
              <CBBtn label="▶ MP"  color={DC.blue} flex={1} />
              <CBBtn label="▶ MRP" color={DC.cyan} flex={1} />
            </Box>
            <Box sx={{ bgcolor: DC.surface3, borderRadius: 0.2, p: 0.25, fontSize: 4, color: DC.text2 }}>
              <Box><Box component="span" sx={{ color: DC.text, fontWeight: 700 }}>[MP]</Box> 상태: <Box component="span" sx={{ color: p.mpColor }}>{p.mpState}</Box></Box>
              <Box sx={{ color: DC.text3 }}>{p.mpTime}</Box>
              <Box sx={{ borderTop: `1px dashed ${DC.border}`, mt: 0.1, pt: 0.1 }}>
                <Box><Box component="span" sx={{ color: DC.text, fontWeight: 700 }}>[MRP]</Box> <Box component="span" sx={{ color: p.mrpColor }}>{p.mrpState}</Box></Box>
                <Box sx={{ color: DC.text3 }}>{p.mrpTime}</Box>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
      {CBRow(
        <CBCard title="공정 간 파이프라인 진척도">
          <CBStepper
            steps={['1. MOD (모듈 조립) 계산', '2. PKG (패키징) 계산', '3. FAB (칩 제조) 계산 중', '4. EPI (에피택시) 대기']}
            activeIdx={2}
          />
        </CBCard>,
        <CBCard title="노드 리소스 현황 (LED Cluster)">
          <CBProgressRow label="Cluster CPU Avg" pct={82} color={DC.amber} />
          <CBProgressRow label="Cluster Mem (245/256GB)" pct={95} color={DC.red} />
          <Box sx={{ display: 'flex', gap: 0.2, mt: 'auto' }}>
            <CBStat value="16" label="Active Nodes" valueColor={DC.green} />
            <CBStat value="0"  label="Dead Nodes"  valueColor={DC.red} bg={`${DC.red}22`} border={DC.red} />
          </Box>
        </CBCard>,
        <CBCard title="공정 간 자재 정합성" titleColor={DC.amber} borderColor={DC.amber}>
          <CBTable
            cols={['흐름 (Flow)', '자재 아이템', '상태']}
            colFlex={[1.1, 1.5, 0.9]}
            rows={[
              ['MOD ➔ PKG', 'PKG 3528 SMD',  cbBadgeCell('SYNC OK', DC.green)],
              ['PKG ➔ FAB', 'Blue Chip 0.2W', cbBadgeCell('CALC..',  DC.cyan)],
              ['FAB ➔ EPI', 'Wafer 6inch',   cbBadgeCell('WAIT',    DC.text2)],
            ]}
          />
        </CBCard>
      )}
    </CBWrap>
  ),

  // ---- CB_03 병렬 시나리오 ----
  cb_parallel_scenario: () => (
    <CBWrap header={<CBHead title="② 다중 시나리오 병렬 구동 (Parallel Run)"
                           right={<CBBtn label="▶ 병렬 실행 (Run All)" color={DC.blue} solid />} />}>
      <CBTable
        cols={['☑', '시나리오명', 'Demand 변동율', 'Capa 한도', '상태']}
        colFlex={[0.3, 1.5, 1, 1, 0.9]}
        rows={[
          ['☑', { v: 'SCENARIO_OPT_BASE', mono: true }, { v: '  0%',  align: 'right', mono: true }, { v: '100%', align: 'right', mono: true }, cbBadgeCell('Ready', DC.blue)],
          ['☑', { v: 'SCENARIO_OPT_01',   mono: true }, { v: '-10%',  align: 'right', mono: true }, { v: '110%', align: 'right', mono: true }, cbBadgeCell('Ready', DC.blue)],
          ['☑', { v: 'SCENARIO_OPT_02',   mono: true }, { v: ' +5%',  align: 'right', mono: true }, { v: ' 90%', align: 'right', mono: true }, cbBadgeCell('Ready', DC.blue)],
          ['☑', { v: 'SCENARIO_OPT_03',   mono: true }, { v: '+10%',  align: 'right', mono: true }, { v: '120%', align: 'right', mono: true }, cbBadgeCell('Ready', DC.blue)],
          ['☐', { v: 'SCENARIO_OPT_04',   mono: true }, { v: '+15%',  align: 'right', mono: true }, { v: '120%', align: 'right', mono: true }, cbBadgeCell('Pending', DC.text2)],
          ['☑', { v: 'SCENARIO_OPT_05',   mono: true }, { v: ' -5%',  align: 'right', mono: true }, { v: ' 95%', align: 'right', mono: true }, cbBadgeCell('Ready', DC.blue)],
          ['☑', { v: 'SCENARIO_OPT_06',   mono: true }, { v: '-15%',  align: 'right', mono: true }, { v: '105%', align: 'right', mono: true }, cbBadgeCell('Ready', DC.blue)],
          ['☐', { v: 'SCENARIO_OPT_07',   mono: true }, { v: '+20%',  align: 'right', mono: true }, { v: '130%', align: 'right', mono: true }, cbBadgeCell('Pending', DC.text2)],
        ]}
      />
    </CBWrap>
  ),

  // ---- CB_04 파라미터 튜닝 ----
  cb_param_tuning: () => (
    <CBWrap header={<CBHead title="③ 엔진 파라미터 튜닝 (Parameter Tuning)"
                           right={<CBBtn label="설정 저장" color={DC.text2} />} />}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.25, flex: 1 }}>
        {[
          { name: '납기 지연 페널티',   val: 320, unit: '/day' },
          { name: '재고 유지 페널티',   val: 120, unit: '/unit' },
          { name: '셋업 변경 페널티',   val:  80, unit: '/chg' },
          { name: '생산 평활화 가중치', val:  50, unit: 'ratio' },
          { name: '외주 허용 비율',     val:  15, unit: '%' },
          { name: '안전재고 위반 페널티', val: 250, unit: '/unit' },
        ].map((p, i) => (
          <CBCard key={i} title={p.name}>
            <Box sx={{ bgcolor: DC.surface3, border: `1px solid ${DC.border}`, borderRadius: 0.3, p: 0.3,
                       display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 0.2 }}>
              <Box sx={{ fontSize: 10, color: DC.cyan, fontFamily: 'monospace', fontWeight: 700 }}>{p.val}</Box>
              <Box sx={{ fontSize: 5, color: DC.text3 }}>{p.unit}</Box>
            </Box>
            <Box sx={{ height: 2, bgcolor: DC.surface3, borderRadius: 1, mt: 'auto' }}>
              <Box sx={{ width: `${Math.min(100, p.val / 4)}%`, height: '100%', bgcolor: DC.cyan, borderRadius: 1 }} />
            </Box>
          </CBCard>
        ))}
      </Box>
    </CBWrap>
  ),

  // ---- CB_05 배치 스케줄 ----
  cb_batch_schedule: () => (
    <CBWrap header={<CBHead title="④ 배치 스케줄 등록 (Job Scheduling)"
                           right={<CBBtn label="+ 신규 스케줄" color={DC.blue} />} />}>
      <CBTable
        cols={['Job ID', '스케줄 명칭', '실행 주기 (Cron)', '다음 실행', '상태', '액션']}
        colFlex={[0.7, 1.5, 1.3, 1.1, 0.8, 0.8]}
        rows={[
          [{ v: 'SCH-01', mono: true }, 'Daily Night Batch',        { v: '0 2 * * *',   mono: true }, '2024-11-10 02:00', cbBadgeCell('Active', DC.green), { v: 'Pause', color: DC.text2 }],
          [{ v: 'SCH-02', mono: true }, 'ERP Hourly Sync',          { v: '0 */2 * * *', mono: true }, '2024-11-09 14:00', cbBadgeCell('Active', DC.green), { v: 'Pause', color: DC.text2 }],
          [{ v: 'SCH-03', mono: true }, 'Weekly Full Run',          { v: '0 0 * * 0',   mono: true }, '2024-11-10 00:00', cbBadgeCell('Active', DC.green), { v: 'Pause', color: DC.text2 }],
          [{ v: 'SCH-04', mono: true }, 'Monthly Consolidation',    { v: '0 1 1 * *',   mono: true }, '2024-12-01 01:00', cbBadgeCell('Active', DC.green), { v: 'Pause', color: DC.text2 }],
          [{ v: 'SCH-05', mono: true }, 'Intraday MDM Refresh',     { v: '0 */4 * * *', mono: true }, '2024-11-09 16:00', cbBadgeCell('Paused', DC.amber), { v: 'Start', color: DC.green }],
          [{ v: 'SCH-06', mono: true }, 'Morning KPI Aggregation',  { v: '30 6 * * *',  mono: true }, '2024-11-10 06:30', cbBadgeCell('Active', DC.green), { v: 'Pause', color: DC.text2 }],
          [{ v: 'SCH-07', mono: true }, 'Forecast Recalibration',   { v: '0 3 * * 1',   mono: true }, '2024-11-11 03:00', cbBadgeCell('Active', DC.green), { v: 'Pause', color: DC.text2 }],
        ]}
      />
    </CBWrap>
  ),

  // ---- CB_06 MDM 검증 ----
  cb_mdm_check: () => (
    <CBWrap header={<CBHead title="⑤ 마스터 데이터 사전 검증 (MDM Check)"
                           right={<CBBtn label="검증 실행 ↻" color={DC.amber} />} />}>
      <CBTable
        cols={['검증 항목 (Rule)', '대상 건수', '오류 건수', '판정']}
        colFlex={[2.2, 1, 1, 0.8]}
        rows={[
          ['BOM 순환(Cycle) 구조 체크',     { v: '150,000', align: 'right', mono: true }, { v: '    0', align: 'right', mono: true, color: DC.text3 }, cbBadgeCell('PASS', DC.green)],
          ['라우팅/리드타임 누락 체크',     { v: ' 45,000', align: 'right', mono: true }, { v: '   12', align: 'right', mono: true, color: DC.amber, bold: true }, cbBadgeCell('WARN', DC.amber)],
          ['단종 품목 수요 연결 체크',      { v: '  8,500', align: 'right', mono: true }, { v: '    5', align: 'right', mono: true, color: DC.red,   bold: true }, cbBadgeCell('FAIL', DC.red)],
          ['자재 대체 룰 일관성 체크',      { v: ' 12,400', align: 'right', mono: true }, { v: '    0', align: 'right', mono: true, color: DC.text3 }, cbBadgeCell('PASS', DC.green)],
          ['재고 초기값 음수 검증',         { v: '  3,800', align: 'right', mono: true }, { v: '    2', align: 'right', mono: true, color: DC.amber, bold: true }, cbBadgeCell('WARN', DC.amber)],
          ['수주 납기-출하LT 정합성',       { v: ' 22,100', align: 'right', mono: true }, { v: '    0', align: 'right', mono: true, color: DC.text3 }, cbBadgeCell('PASS', DC.green)],
        ]}
        rowBg={['transparent', `${DC.amber}22`, `${DC.red}22`, 'transparent', `${DC.amber}22`, 'transparent']}
      />
    </CBWrap>
  ),

  // ---- CB_07 실행 결재 ----
  cb_approval: () => (
    <CBWrap header={<CBHead title="⑥ 실행 승인 및 결재 (Approval)" />}>
      <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.3, minHeight: 0 }}>
        {[
          { title: '결재 요청: SCM V2.0 확정', team: '생산계획팀 (김계획)', items: ['납기 준수율 95%', '평균 재고 1.2M', '생산량 46,500 EA'], color: DC.blue },
          { title: '결재 요청: BF V1.3 재추정', team: 'BF팀 (박수요)',     items: ['MAPE 12.4%',       'Bias -0.8%',      'NPI SKU 48건'],    color: DC.cyan },
          { title: '결재 요청: DP V1.1 조정',   team: 'DP팀 (이영업)',     items: ['Consensus 97%',    '월 +4.2% 조정',    '채널 3건'],        color: DC.purple },
          { title: '결재 요청: MP V3.0 긴급',   team: 'MP팀 (최마스터)',   items: ['Capa 부하 98%',    '병목 2건',         '납기지연 6건'],    color: DC.amber },
        ].map((a, i) => (
          <Box key={i} sx={{ bgcolor: DC.surface, border: `1px solid ${a.color}66`, borderLeft: `3px solid ${a.color}`,
                             borderRadius: 0.3, p: 0.35, display: 'flex', flexDirection: 'column', gap: 0.2 }}>
            <Box sx={{ fontSize: 6, color: a.color, fontWeight: 700 }}>{a.title}</Box>
            <Box sx={{ fontSize: 5, color: DC.text3 }}>기안자: {a.team}</Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.1, mt: 0.1 }}>
              {a.items.map((it, j) => (
                <Box key={j} sx={{ fontSize: 5, color: DC.text2 }}>• {it}</Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 0.2, mt: 'auto' }}>
              <CBBtn label="승인" color={DC.green} flex={1} />
              <CBBtn label="반려" color={DC.red}   flex={1} />
              <CBBtn label="상세" color={DC.text2} flex={1} />
            </Box>
          </Box>
        ))}
      </Box>
    </CBWrap>
  ),

  // ---- CB_08 노드 상태 ----
  cb_node_status: () => (
    <CBWrap header={<CBHead title="⑦ 전체 노드 상태 (Global Node Status)"
                           right={<CBBadge label="16 Active · 1 Dead" color={DC.green} />} />}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.25, flex: 1 }}>
        {Array.from({ length: 16 }).map((_, i) => {
          const err = i === 10;
          const cpu = err ? 0 : 30 + ((i * 17) % 60);
          const mem = err ? 0 : 40 + ((i * 13) % 50);
          const status = err ? 'Error (OOM)' : (i % 3 === 0 ? 'Running' : 'Idle');
          const color = err ? DC.red : (status === 'Running' ? DC.green : DC.text2);
          return (
            <Box key={i} sx={{ bgcolor: DC.surface, border: `1px solid ${err ? DC.red : DC.border}`,
                               borderRadius: 0.3, p: 0.25, display: 'flex', flexDirection: 'column', gap: 0.1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ fontSize: 5, fontWeight: 700, color: err ? DC.red : DC.text }}>
                  🖥 Node-{String(i + 1).padStart(2, '0')}
                </Box>
                <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: color,
                           boxShadow: `0 0 3px ${color}` }} />
              </Box>
              <Box sx={{ fontSize: 4, color, fontWeight: 700 }}>{status}</Box>
              <Box sx={{ fontSize: 4, color: DC.text3, display: 'flex', justifyContent: 'space-between' }}>
                <Box>CPU</Box><Box>{err ? '-' : cpu + '%'}</Box>
              </Box>
              <Box sx={{ height: 1.5, bgcolor: DC.surface3, borderRadius: 0.5 }}>
                <Box sx={{ width: err ? '0%' : `${cpu}%`, height: '100%',
                           bgcolor: cpu > 80 ? DC.red : cpu > 60 ? DC.amber : DC.cyan, borderRadius: 0.5 }} />
              </Box>
              <Box sx={{ fontSize: 4, color: DC.text3, display: 'flex', justifyContent: 'space-between' }}>
                <Box>MEM</Box><Box>{err ? '-' : mem + '%'}</Box>
              </Box>
              <Box sx={{ height: 1.5, bgcolor: DC.surface3, borderRadius: 0.5 }}>
                <Box sx={{ width: err ? '0%' : `${mem}%`, height: '100%',
                           bgcolor: mem > 80 ? DC.red : mem > 60 ? DC.amber : DC.purple, borderRadius: 0.5 }} />
              </Box>
            </Box>
          );
        })}
      </Box>
    </CBWrap>
  ),

  // ---- CB_09 진척도 ----
  cb_pipeline_progress: () => (
    <CBWrap header={<CBHead title="⑧ 파이프라인 진척도 (Pipeline Progress)"
                           right={<CBBadge label="Job: RUN-2411-0089" color={DC.blue} />} />}>
      <CBCard>
        {[
          { label: 'Step 1: Data Extract',      pct: 100, time: '0:45', color: DC.green },
          { label: 'Step 2: MDM Check',          pct: 100, time: '0:28', color: DC.green },
          { label: 'Step 3: Heuristic Build',    pct: 100, time: '1:12', color: DC.green },
          { label: 'Step 4: LP Solve (Running)', pct:  45, time: '진행 중...', color: DC.cyan },
          { label: 'Step 5: Post Processing',    pct:   0, time: '대기', color: DC.text3 },
          { label: 'Step 6: Result Save & Pub',  pct:   0, time: '대기', color: DC.text3 },
        ].map((s, i) => (
          <Box key={i} sx={{ mb: 0.3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 6, mb: 0.1 }}>
              <Box sx={{ color: s.color === DC.text3 ? DC.text3 : DC.text, fontWeight: 700 }}>{s.label}</Box>
              <Box sx={{ color: DC.text3, fontFamily: 'monospace' }}>{s.time} · {s.pct}%</Box>
            </Box>
            <Box sx={{ height: 5, bgcolor: DC.surface3, borderRadius: 0.3 }}>
              <Box sx={{ width: `${s.pct}%`, height: '100%', bgcolor: s.color, borderRadius: 0.3 }} />
            </Box>
          </Box>
        ))}
      </CBCard>
    </CBWrap>
  ),

  // ---- CB_10 실시간 로그 ----
  cb_live_log: () => (
    <CBWrap header={<CBHead title="⑨ 실시간 엔진 로그 (Live Terminal Log)"
                           right={<CBBtn label="로그 다운로드 ⬇" color={DC.cyan} />} />}>
      <Box sx={{ flex: 1, bgcolor: '#000', fontFamily: 'monospace', fontSize: 5, p: 0.4,
                 borderRadius: 0.3, border: `1px solid ${DC.border}`, overflow: 'hidden', minHeight: 0 }}>
        {[
          ['[2024-11-08 14:30:01]', 'INFO',  '[EngineCore] Starting job RUN-2411-0089', DC.green],
          ['[2024-11-08 14:30:03]', 'INFO',  '[I/F] ERP extract: 12,845 rows loaded',   DC.green],
          ['[2024-11-08 14:30:12]', 'INFO',  '[I/F] MES extract: 8,210 rows loaded',    DC.green],
          ['[2024-11-08 14:30:18]', 'INFO',  '[MDM] 156,340 items validated OK',         DC.green],
          ['[2024-11-08 14:30:25]', 'WARN',  '[MDM] 12 items with missing LT (defaulted)', DC.amber],
          ['[2024-11-08 14:31:02]', 'INFO',  '[Heuristic] Initializing matrix...',       DC.green],
          ['[2024-11-08 14:31:45]', 'INFO',  '[Heuristic] Iteration 12 / 50',            DC.green],
          ['[2024-11-08 14:32:18]', 'INFO',  '[Heuristic] Iteration 25 / 50 (obj=45,820)', DC.green],
          ['[2024-11-08 14:32:58]', 'INFO',  '[Heuristic] Iteration 38 / 50 (obj=42,105)', DC.green],
          ['[2024-11-08 14:33:20]', 'INFO',  '[LP Solve] Entering Gurobi solver...',     DC.green],
          ['[2024-11-08 14:33:45]', 'INFO',  '[LP Solve] Presolve complete',             DC.green],
        ].map(([ts, lvl, msg, color], i) => (
          <Box key={i} sx={{ lineHeight: '7px', color: DC.text3 }}>
            <Box component="span" sx={{ color: DC.text3 }}>{ts} </Box>
            <Box component="span" sx={{ color, fontWeight: 700 }}>{lvl} </Box>
            <Box component="span" sx={{ color: DC.text }}>{msg}</Box>
          </Box>
        ))}
        <Box sx={{ lineHeight: '7px', color: DC.cyan, fontWeight: 700 }}>
          [2024-11-08 14:34:02] INFO  [LP Solve] 45% ... ENGINE RUNNING ▊
        </Box>
      </Box>
    </CBWrap>
  ),

  // ---- CB_11 리소스 관제 ----
  cb_resource_monitor: () => (
    <CBWrap header={<CBHead title="⑩ 리소스(CPU/Mem) 모니터링"
                           right={<CBBadge label="Live · 1s 갱신" color={DC.cyan} />} />}>
      {CBRow(
        <CBCard title="CPU Usage (%)">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 5, color: DC.text3, mb: 0.1 }}>
            <Box>Avg: <Box component="span" sx={{ color: DC.amber, fontWeight: 700 }}>78%</Box></Box>
            <Box>Max: <Box component="span" sx={{ color: DC.red, fontWeight: 700 }}>95%</Box></Box>
          </Box>
          <Box sx={{ flex: 1, bgcolor: DC.surface3, borderRadius: 0.3, display: 'flex', alignItems: 'flex-end',
                     gap: 0.08, p: 0.25, position: 'relative' }}>
            {[40, 55, 70, 50, 65, 80, 60, 75, 85, 70, 65, 90, 75, 68, 82, 88, 72, 79, 85, 72].map((h, i) => (
              <Box key={i} sx={{ flex: 1, bgcolor: h > 85 ? DC.red : h > 70 ? DC.amber : DC.cyan,
                                 height: `${h}%`, borderRadius: 0.15 }} />
            ))}
          </Box>
        </CBCard>,
        <CBCard title="Memory Usage (GB / 256GB)">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 5, color: DC.text3, mb: 0.1 }}>
            <Box>Cur: <Box component="span" sx={{ color: DC.red, fontWeight: 700 }}>235GB</Box></Box>
            <Box>Peak: <Box component="span" sx={{ color: DC.red, fontWeight: 700 }}>248GB</Box></Box>
          </Box>
          <Box sx={{ flex: 1, bgcolor: DC.surface3, borderRadius: 0.3, display: 'flex', alignItems: 'flex-end',
                     gap: 0.08, p: 0.25 }}>
            {[50, 60, 55, 70, 65, 75, 80, 78, 82, 85, 80, 75, 78, 82, 88, 92, 90, 88, 91, 89].map((h, i) => (
              <Box key={i} sx={{ flex: 1, bgcolor: h > 85 ? DC.red : DC.purple,
                                 height: `${h}%`, borderRadius: 0.15 }} />
            ))}
          </Box>
        </CBCard>
      )}
    </CBWrap>
  ),

  // ---- CB_12 I/O 현황 ----
  cb_io_interface: () => (
    <CBWrap header={<CBHead title="⑪ I/O 인터페이스 상태 (Data Ingestion)"
                           right={<CBBadge label="10 Active · 0 Fail" color={DC.green} />} />}>
      <CBTable
        cols={['IF-ID', '소스 시스템', '수신 건수', '마지막 수신', '상태']}
        colFlex={[1, 1.1, 1, 1.1, 0.8]}
        rows={[
          [{ v: 'IF-ERP-001', mono: true }, 'SAP ERP',       { v: '12,845', align: 'right', mono: true }, { v: '14:30:12', mono: true }, cbBadgeCell('Success', DC.green)],
          [{ v: 'IF-ERP-002', mono: true }, 'SAP ERP',       { v: ' 8,210', align: 'right', mono: true }, { v: '14:30:25', mono: true }, cbBadgeCell('Success', DC.green)],
          [{ v: 'IF-MES-001', mono: true }, 'MES Siemens',   { v: '15,402', align: 'right', mono: true }, { v: '14:31:45', mono: true }, cbBadgeCell('Success', DC.green)],
          [{ v: 'IF-MES-002', mono: true }, 'MES Siemens',   { v: ' 5,118', align: 'right', mono: true }, { v: '14:28:03', mono: true }, cbBadgeCell('Warning', DC.amber)],
          [{ v: 'IF-WMS-001', mono: true }, 'WMS Manhattan', { v: ' 2,340', align: 'right', mono: true }, { v: '14:32:01', mono: true }, cbBadgeCell('Success', DC.green)],
          [{ v: 'IF-DMS-001', mono: true }, 'Demand API',    { v: ' 1,045', align: 'right', mono: true }, { v: '14:29:12', mono: true }, cbBadgeCell('Success', DC.green)],
          [{ v: 'IF-CRM-001', mono: true }, 'Salesforce',    { v: '   856', align: 'right', mono: true }, { v: '14:15:33', mono: true }, cbBadgeCell('Delayed', DC.amber)],
          [{ v: 'IF-LGS-001', mono: true }, 'Logistics API', { v: ' 3,210', align: 'right', mono: true }, { v: '14:30:55', mono: true }, cbBadgeCell('Success', DC.green)],
          [{ v: 'IF-FIN-001', mono: true }, 'Finance SAP',   { v: '   425', align: 'right', mono: true }, { v: '13:00:00', mono: true }, cbBadgeCell('Scheduled', DC.blue)],
        ]}
      />
    </CBWrap>
  ),

  // ---- CB_13 대기열(Queue) ----
  cb_job_queue: () => (
    <CBWrap header={<CBHead title="⑫ 작업 대기열 큐 관리 (Job Queue)"
                           right={<CBBadge label="12 Waiting · 3 Running" color={DC.cyan} />} />}>
      <CBCard title="엔진 대기열 (Drag to Reorder)">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2, flex: 1 }}>
          {[
            { rank: 1, job: 'Job_BF_Rerun_4521',      user: 'bf_admin',  eta: '즉시',    status: 'Running', color: DC.cyan },
            { rank: 2, job: 'Job_DP_Consensus_2103',  user: 'dp_user01', eta: '2분 내',  status: 'Running', color: DC.cyan },
            { rank: 3, job: 'Job_MP_Daily_8842',      user: 'mp_sched',  eta: '5분 내',  status: 'Running', color: DC.cyan },
            { rank: 4, job: 'Job_FP_Scenario_A',      user: 'fp_user02', eta: '12분 후', status: 'Waiting', color: DC.text2 },
            { rank: 5, job: 'Job_IM_SlowMov_7132',    user: 'im_admin',  eta: '15분 후', status: 'Waiting', color: DC.text2 },
            { rank: 6, job: 'Job_SA_Monthly_1122',    user: 'sa_mgr',    eta: '25분 후', status: 'Waiting', color: DC.text2 },
            { rank: 7, job: 'Job_BF_Weekly_8990',     user: 'bf_user',   eta: '30분 후', status: 'Waiting', color: DC.text2 },
            { rank: 8, job: 'Job_DP_Hotfix_5511',     user: 'dp_admin',  eta: '45분 후', status: 'Waiting', color: DC.text2 },
          ].map((q) => (
            <Box key={q.rank} sx={{ display: 'flex', alignItems: 'center', gap: 0.3,
                                    bgcolor: DC.surface3, border: `1px solid ${DC.border}`,
                                    borderRadius: 0.3, px: 0.3, py: 0.2 }}>
              <Box sx={{ width: 10, textAlign: 'center', fontSize: 7, color: DC.text3, fontFamily: 'monospace' }}>⋮⋮</Box>
              <Box sx={{ fontSize: 5, color: DC.text3, width: 14 }}>#{q.rank}</Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ fontSize: 5, color: DC.text, fontWeight: 700, fontFamily: 'monospace',
                           whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {q.job}
                </Box>
                <Box sx={{ fontSize: 4, color: DC.text3 }}>{q.user} · ETA {q.eta}</Box>
              </Box>
              <Box sx={{ fontSize: 5, color: q.color, fontWeight: 700, fontFamily: 'monospace' }}>{q.status}</Box>
            </Box>
          ))}
        </Box>
      </CBCard>
    </CBWrap>
  ),

  // ---- CB_14 통합 오류 로그 ----
  cb_error_log: () => (
    <CBWrap header={<CBHead title="⑬ 통합 오류/예외 로그 (Global Error Grid)"
                           right={<CBBtn label="Export CSV" color={DC.red} />} />}>
      <CBTable
        cols={['발생 일시', '수준', '에러 코드', '모듈', '메시지 내용']}
        colFlex={[1.3, 0.6, 0.8, 0.9, 2.5]}
        fontSize={5}
        rows={[
          [{ v: '2024-11-08 14:32:15', mono: true }, cbBadgeCell('ERROR', DC.red),   { v: 'ERR-501', mono: true }, 'Solver',    'Matrix exceeds dimensional limit (15M vars)'],
          [{ v: '2024-11-08 14:28:02', mono: true }, cbBadgeCell('WARN',  DC.amber), { v: 'WRN-301', mono: true }, 'DataLoad',  'Missing LT values for 12 items, defaulted'],
          [{ v: '2024-11-08 14:25:48', mono: true }, cbBadgeCell('ERROR', DC.red),   { v: 'ERR-502', mono: true }, 'Solver',    'Gurobi reports infeasible constraint group'],
          [{ v: '2024-11-08 14:20:33', mono: true }, cbBadgeCell('WARN',  DC.amber), { v: 'WRN-302', mono: true }, 'MDM',       'Duplicate item code detected: ITEM_A_001'],
          [{ v: '2024-11-08 14:15:11', mono: true }, cbBadgeCell('INFO',  DC.blue),  { v: 'INF-101', mono: true }, 'Scheduler', 'Cron job SCH-03 triggered weekly run'],
          [{ v: '2024-11-08 14:10:56', mono: true }, cbBadgeCell('ERROR', DC.red),   { v: 'ERR-503', mono: true }, 'Heuristic', 'Iteration diverged, restart with seed 42'],
          [{ v: '2024-11-08 14:05:22', mono: true }, cbBadgeCell('WARN',  DC.amber), { v: 'WRN-303', mono: true }, 'DB',        'Connection pool at 80% capacity'],
          [{ v: '2024-11-08 14:01:07', mono: true }, cbBadgeCell('ERROR', DC.red),   { v: 'ERR-504', mono: true }, 'Network',   'Timeout calling external forecast API'],
          [{ v: '2024-11-08 13:55:45', mono: true }, cbBadgeCell('INFO',  DC.blue),  { v: 'INF-102', mono: true }, 'Auth',      'User mp_admin session started'],
        ]}
        rowBg={[`${DC.red}18`, 'transparent', `${DC.red}18`, 'transparent', 'transparent', `${DC.red}18`, 'transparent', `${DC.red}18`, 'transparent']}
      />
    </CBWrap>
  ),

  // ---- CB_15 알람 임계치 ----
  cb_alert_threshold: () => (
    <CBWrap header={<CBHead title="⑭ 알람 임계치 설정 (Alert Threshold)"
                           right={<CBBtn label="+ 새 룰" color={DC.blue} />} />}>
      <CBTable
        cols={['알람 룰 명칭', '트리거 조건', '수신자 (Email/SMS)', '채널', 'ON']}
        colFlex={[1.5, 1.2, 1.7, 0.8, 0.4]}
        rows={[
          ['엔진 구동 실패 알람',      { v: 'Error Count > 0',        mono: true }, 'admin@scm.com',           { v: 'MAIL+SMS', color: DC.cyan },   '☑'],
          ['메모리 초과 경고',         { v: 'MEM Usage > 90%',        mono: true }, 'dba@scm.com, ops@...',    { v: 'MAIL',      color: DC.blue },   '☑'],
          ['Dead Node 감지',           { v: 'Dead Count > 0',         mono: true }, 'admin@scm.com, oncall…',  { v: 'MAIL+SMS', color: DC.cyan },   '☑'],
          ['엔진 실행 시간 초과',      { v: 'Runtime > 120min',       mono: true }, 'ops@scm.com',             { v: 'MAIL',      color: DC.blue },   '☑'],
          ['납기 지연 임박',           { v: 'Late Orders > 10',       mono: true }, 'planner@scm.com, sales…', { v: 'MAIL',      color: DC.blue },   '☑'],
          ['안전재고 위반',            { v: 'SS Violation > 5',       mono: true }, 'im_mgr@scm.com',          { v: 'MAIL',      color: DC.blue },   '☑'],
          ['I/F 수신 지연 (1hr)',       { v: 'Last Recv > 60min',      mono: true }, 'ops@scm.com',             { v: 'SMS',       color: DC.amber },  '☐'],
          ['MDM 오류 증가',            { v: 'MDM Err growth > 10%',   mono: true }, 'mdm@scm.com',             { v: 'MAIL',      color: DC.blue },   '☑'],
        ]}
      />
    </CBWrap>
  ),

  // ---- CB_16 노드 원격복구 ----
  cb_node_recovery: () => (
    <CBWrap header={<CBHead title="⑮ 장애 노드 원격 제어 (Node Recovery)"
                           right={<CBBadge label="Dead: 2 · Unhealthy: 1" color={DC.red} />} />}>
      <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.3, minHeight: 0 }}>
        {[
          { name: 'Worker-03', state: 'Dead (OOM)',     color: DC.red,   pct: 0,  time: '12m ago' },
          { name: 'Worker-07', state: 'Dead (Crash)',   color: DC.red,   pct: 0,  time: '34m ago' },
          { name: 'Worker-11', state: 'Unhealthy',      color: DC.amber, pct: 15, time: '2m ago' },
          { name: 'Worker-15', state: 'Running',        color: DC.green, pct: 85, time: 'Active' },
          { name: 'Worker-21', state: 'Running',        color: DC.green, pct: 70, time: 'Active' },
          { name: 'Worker-24', state: 'Running',        color: DC.green, pct: 42, time: 'Active' },
        ].map((n, i) => (
          <Box key={i} sx={{ bgcolor: DC.surface, border: `1px solid ${n.color}66`, borderRadius: 0.3,
                             p: 0.4, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <Box sx={{ fontSize: 12 }}>🖥️</Box>
              <Box>
                <Box sx={{ fontSize: 6, color: DC.text, fontWeight: 700 }}>{n.name}</Box>
                <Box sx={{ fontSize: 4, color: n.color, fontWeight: 700 }}>{n.state}</Box>
              </Box>
            </Box>
            <Box sx={{ fontSize: 4, color: DC.text3 }}>CPU / Last: {n.time}</Box>
            <Box sx={{ height: 3, bgcolor: DC.surface3, borderRadius: 0.3 }}>
              <Box sx={{ width: `${n.pct}%`, height: '100%', bgcolor: n.color, borderRadius: 0.3 }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 0.2, mt: 'auto' }}>
              <CBBtn label="Kill"    color={DC.red}   flex={1} />
              <CBBtn label="Restart" color={DC.amber} flex={1} />
              <CBBtn label="Log"     color={DC.text2} flex={1} />
            </Box>
          </Box>
        ))}
      </Box>
    </CBWrap>
  ),

  // ---- CB_17 결측치 보정 ----
  cb_data_imputation: () => (
    <CBWrap header={<CBHead title="⑯ 데이터 결측치 보정 (Data Imputation)"
                           right={<CBBtn label="룰 적용 ▶" color={DC.green} />} />}>
      <CBTable
        cols={['대상 테이블', '컬럼명', '결측 건수', '보정 룰 (Action)', '처리 결과']}
        colFlex={[1.6, 1, 1, 1.5, 0.9]}
        rows={[
          [{ v: 'TB_DP_DEMAND_PLAN',      mono: true }, { v: 'QTY',       mono: true }, { v: '  152', align: 'right', mono: true }, 'Fill with 0',        cbBadgeCell('Applied', DC.green)],
          [{ v: 'TB_IM_INVENTORY',        mono: true }, { v: 'STOCK_QTY', mono: true }, { v: '   48', align: 'right', mono: true }, 'AVG of last 7d',     cbBadgeCell('Applied', DC.green)],
          [{ v: 'TB_SO_SALES_ORDER',      mono: true }, { v: 'DUE_DT',    mono: true }, { v: '   12', align: 'right', mono: true }, 'Fill with order+14d', cbBadgeCell('Applied', DC.green)],
          [{ v: 'TB_CM_ITEM_MASTER',      mono: true }, { v: 'LEAD_TIME', mono: true }, { v: '   25', align: 'right', mono: true }, 'Default by Category', cbBadgeCell('Applied', DC.green)],
          [{ v: 'TB_BF_FORECAST',         mono: true }, { v: 'FCST_QTY',  mono: true }, { v: '  312', align: 'right', mono: true }, 'Linear Interpolation', cbBadgeCell('Applied', DC.green)],
          [{ v: 'TB_RP_REPLENISHMENT',    mono: true }, { v: 'MOQ',       mono: true }, { v: '    8', align: 'right', mono: true }, 'Fill with 100',      cbBadgeCell('Applied', DC.green)],
          [{ v: 'TB_MP_CAPACITY',         mono: true }, { v: 'HR_CAPA',   mono: true }, { v: '    4', align: 'right', mono: true }, 'AVG by Resource',    cbBadgeCell('Applied', DC.green)],
          [{ v: 'TB_FP_ROUTE',            mono: true }, { v: 'SETUP_T',   mono: true }, { v: '   18', align: 'right', mono: true }, 'Fill with 0',        cbBadgeCell('Skipped', DC.amber)],
        ]}
      />
    </CBWrap>
  ),

  // ---- CB_18 오류 할당 ----
  cb_ticket_assign: () => (
    <CBWrap header={<CBHead title="⑰ 오류 담당자 할당 (Ticket Assign)"
                           right={<CBBadge label="Open: 6 · Closed: 2" color={DC.amber} />} />}>
      <CBTable
        cols={['티켓 ID', '오류 요약', '담당 부서/자', '처리 기한', '우선순위', '상태']}
        colFlex={[0.9, 2, 1.3, 0.9, 0.8, 0.8]}
        rows={[
          [{ v: 'TCK-1024', mono: true }, 'Master Data Not Found (Item A_001)',  'IT-DBA 팀 / 이DBA',   'Today',        cbBadgeCell('High', DC.red),   cbBadgeCell('Open',     DC.amber)],
          [{ v: 'TCK-1025', mono: true }, 'Capa Exceeded (Line-3 over 115%)',    'Operations / 박담당',  'Tomorrow',     cbBadgeCell('High', DC.red),   cbBadgeCell('Open',     DC.amber)],
          [{ v: 'TCK-1026', mono: true }, 'Solver Timeout after 120min',         'IT-DBA 팀 / 김DBA',   'Today',        cbBadgeCell('High', DC.red),   cbBadgeCell('Working',  DC.cyan)],
          [{ v: 'TCK-1027', mono: true }, 'Missing BOM for Item P_331',          'MDM 팀 / 최마스터',    '11/10 18:00',  cbBadgeCell('Mid',  DC.amber), cbBadgeCell('Open',     DC.amber)],
          [{ v: 'TCK-1028', mono: true }, 'Late Order SO-2411-0321 delay +5d',    'Sales / 정세일즈',     '11/11',        cbBadgeCell('Mid',  DC.amber), cbBadgeCell('Open',     DC.amber)],
          [{ v: 'TCK-1029', mono: true }, 'Forecast API returning 5xx',           'IT-IF 팀',             '11/09',        cbBadgeCell('High', DC.red),   cbBadgeCell('Working',  DC.cyan)],
          [{ v: 'TCK-1022', mono: true }, 'LT missing for Resource R_042',        'MDM 팀 / 송마스터',    '-',             cbBadgeCell('Low',  DC.text2), cbBadgeCell('Closed',   DC.green)],
          [{ v: 'TCK-1019', mono: true }, 'Duplicate SKU ITEM_B_009',             'MDM 팀 / 최마스터',    '-',             cbBadgeCell('Low',  DC.text2), cbBadgeCell('Closed',   DC.green)],
        ]}
      />
    </CBWrap>
  ),

  // ---- CB_19 장애 분석 (RCA) ----
  cb_rca_analysis: () => (
    <CBWrap header={<CBHead title="⑱ 장애 분석 리포트 (Root Cause Analysis)"
                           titleColor={DC.red}
                           right={<CBBadge label="AI 자동 분석" color={DC.purple} />} />}>
      <CBCard title="최근 치명적 실패 원인 분석 (RCA-2411-001)" titleColor={DC.red} borderColor={DC.red}>
        <Box sx={{ fontFamily: 'monospace', fontSize: 5, lineHeight: '7.5px',
                   bgcolor: '#000', color: DC.text, p: 0.4, borderRadius: 0.3, flex: 1,
                   border: `1px solid ${DC.border}`, overflow: 'hidden' }}>
          <Box sx={{ color: DC.red, fontWeight: 700 }}>[Root Cause]</Box>
          <Box>Memory Limit Exceeded during LP Matrix generation.</Box>
          <Box sx={{ mt: 0.2 }}/>
          <Box sx={{ color: DC.amber, fontWeight: 700 }}>[Detail]</Box>
          <Box>• Variable size reached <Box component="span" sx={{ color: DC.cyan }}>15,000,000</Box> exceeding <Box component="span" sx={{ color: DC.cyan }}>32GB RAM</Box> limit on Node-03.</Box>
          <Box>• Occurred at step: <Box component="span" sx={{ color: DC.cyan }}>LP Solve / Matrix Build</Box> (iteration 38)</Box>
          <Box>• Affected: 2,340 SKUs × 365 days × 12 resources</Box>
          <Box sx={{ mt: 0.2 }}/>
          <Box sx={{ color: DC.green, fontWeight: 700 }}>[Stack Trace (condensed)]</Box>
          <Box sx={{ color: DC.text3 }}>at com.zionex.mp.solver.LPMatrixBuilder.allocateCols(LPMatrixBuilder.java:247)</Box>
          <Box sx={{ color: DC.text3 }}>at com.zionex.mp.solver.GurobiBridge.loadModel(GurobiBridge.java:112)</Box>
          <Box sx={{ color: DC.text3 }}>at com.zionex.mp.engine.MpEngine.run(MpEngine.java:85)</Box>
          <Box sx={{ mt: 0.2 }}/>
          <Box sx={{ color: DC.green, fontWeight: 700 }}>[Recommendation]</Box>
          <Box>1) Increase memory limit to <Box component="span" sx={{ color: DC.cyan }}>64GB</Box> on Worker-03</Box>
          <Box>2) Reduce scheduling horizon from <Box component="span" sx={{ color: DC.cyan }}>365d → 180d</Box></Box>
          <Box>3) Enable <Box component="span" sx={{ color: DC.cyan }}>sparse matrix optimization</Box> flag</Box>
        </Box>
      </CBCard>
    </CBWrap>
  ),

  // ---- CB_20 수급 밸런스 ----
  cb_supply_demand: () => (
    <CBWrap header={<CBHead title="⑲ 수요/공급 밸런스 결과 (Supply-Demand)"
                           right={<CBBadge label="Shortage: 3 Wks" color={DC.red} />} />}>
      <CBTable
        cols={['기간 (Week)', '총 수요 (A)', '총 공급 (B)', 'Balance (B-A)', '충족율', '상태']}
        colFlex={[0.8, 1.1, 1.1, 1.2, 1, 1]}
        rows={[
          ['W1',  { v: ' 4,500', align: 'right', mono: true }, { v: ' 4,700', align: 'right', mono: true }, { v: '  +200', align: 'right', mono: true, color: DC.green },                      { v: '104%', align: 'right', mono: true, color: DC.green }, cbBadgeCell('OK',        DC.green)],
          ['W2',  { v: ' 4,800', align: 'right', mono: true }, { v: ' 4,100', align: 'right', mono: true }, { v: '  -700', align: 'right', mono: true, color: DC.red,   bold: true },          { v: ' 85%', align: 'right', mono: true, color: DC.red   }, cbBadgeCell('Shortage',  DC.red)],
          ['W3',  { v: ' 5,200', align: 'right', mono: true }, { v: ' 5,300', align: 'right', mono: true }, { v: '  +100', align: 'right', mono: true, color: DC.green },                      { v: '102%', align: 'right', mono: true, color: DC.green }, cbBadgeCell('OK',        DC.green)],
          ['W4',  { v: ' 5,500', align: 'right', mono: true }, { v: ' 5,000', align: 'right', mono: true }, { v: '  -500', align: 'right', mono: true, color: DC.red,   bold: true },          { v: ' 91%', align: 'right', mono: true, color: DC.amber }, cbBadgeCell('Shortage',  DC.red)],
          ['W5',  { v: ' 4,900', align: 'right', mono: true }, { v: ' 5,100', align: 'right', mono: true }, { v: '  +200', align: 'right', mono: true, color: DC.green },                      { v: '104%', align: 'right', mono: true, color: DC.green }, cbBadgeCell('OK',        DC.green)],
          ['W6',  { v: ' 5,600', align: 'right', mono: true }, { v: ' 5,200', align: 'right', mono: true }, { v: '  -400', align: 'right', mono: true, color: DC.red,   bold: true },          { v: ' 93%', align: 'right', mono: true, color: DC.amber }, cbBadgeCell('Shortage',  DC.red)],
          ['W7',  { v: ' 4,700', align: 'right', mono: true }, { v: ' 4,800', align: 'right', mono: true }, { v: '  +100', align: 'right', mono: true, color: DC.green },                      { v: '102%', align: 'right', mono: true, color: DC.green }, cbBadgeCell('OK',        DC.green)],
          ['W8',  { v: ' 5,000', align: 'right', mono: true }, { v: ' 5,000', align: 'right', mono: true }, { v: '     0', align: 'right', mono: true, color: DC.text2 },                      { v: '100%', align: 'right', mono: true, color: DC.text2 }, cbBadgeCell('Tight',     DC.amber)],
        ]}
        rowBg={['transparent', `${DC.red}22`, 'transparent', `${DC.red}22`, 'transparent', `${DC.red}22`, 'transparent', 'transparent']}
      />
    </CBWrap>
  ),

  // ---- CB_21 KPI 변화비교 ----
  cb_kpi_compare: () => (
    <CBWrap header={<CBHead title="⑳ 핵심 KPI 전/후 비교 (Before / After)"
                           right={<CBBadge label="V1.0 → V1.1" color={DC.purple} />} />}>
      <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.3, minHeight: 0 }}>
        {[
          { name: 'Fill Rate',          as: '85%',    to: '96%',    delta: '+11%p', color: DC.green, arrow: '▲' },
          { name: 'Total Inventory',    as: '2.5B',   to: '1.8B',   delta: '-28%',  color: DC.green, arrow: '▼' },
          { name: 'Late Orders',        as: '150',    to: '12',     delta: '-92%',  color: DC.green, arrow: '▼' },
          { name: 'Avg Lead Time',      as: '8.2d',   to: '6.1d',   delta: '-2.1d', color: DC.green, arrow: '▼' },
          { name: 'Capacity Util',      as: '72%',    to: '88%',    delta: '+16%p', color: DC.green, arrow: '▲' },
          { name: 'Plan Stability',     as: '4.8/10', to: '8.2/10', delta: '+3.4',  color: DC.green, arrow: '▲' },
        ].map((k, i) => (
          <Box key={i} sx={{ bgcolor: DC.surface, border: `1px solid ${DC.border}`, borderRadius: 0.3,
                             p: 0.4, display: 'flex', flexDirection: 'column', gap: 0.2 }}>
            <Box sx={{ fontSize: 6, color: DC.text2, fontWeight: 700 }}>{k.name}</Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.2 }}>
              <Box sx={{ fontSize: 5, color: DC.text3 }}>AS-IS</Box>
              <Box sx={{ fontSize: 7, color: DC.text2, fontFamily: 'monospace' }}>{k.as}</Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.2 }}>
              <Box sx={{ fontSize: 5, color: DC.text3 }}>TO-BE</Box>
              <Box sx={{ fontSize: 10, color: k.color, fontWeight: 700, fontFamily: 'monospace' }}>{k.to}</Box>
            </Box>
            <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ fontSize: 6, color: k.color, fontWeight: 700 }}>{k.arrow} {k.delta}</Box>
              <Box sx={{ fontSize: 5, color: DC.green, fontWeight: 700 }}>개선</Box>
            </Box>
          </Box>
        ))}
      </Box>
    </CBWrap>
  ),

  // ---- CB_22 안전재고 경고 ----
  cb_safety_alert: () => (
    <CBWrap header={<CBHead title="㉑ 안전재고 위반 경고 (Safety Stock Alert)"
                           right={<CBBadge label="위반: 12 SKU / 8 Wk" color={DC.red} />} />}>
      <CBTable
        cols={['위반 품목', '품목명', '발생 주차', '안전재고', '예상 재고', '부족량', '위험도']}
        colFlex={[1, 1.4, 0.8, 1, 1, 1, 0.8]}
        rows={[
          [{ v: 'SKU_A_001', mono: true }, 'Blue Chip 0.2W',   'W3', { v: '  500', align: 'right', mono: true }, { v: '  180', align: 'right', mono: true, color: DC.red,   bold: true }, { v: ' -320', align: 'right', mono: true, color: DC.red }, cbBadgeCell('High', DC.red)],
          [{ v: 'SKU_A_002', mono: true }, 'PKG 3528 SMD',     'W5', { v: '  500', align: 'right', mono: true }, { v: '  280', align: 'right', mono: true, color: DC.amber, bold: true }, { v: ' -220', align: 'right', mono: true, color: DC.amber }, cbBadgeCell('Mid',  DC.amber)],
          [{ v: 'SKU_A_003', mono: true }, 'Wafer 6inch',      'W8', { v: '  500', align: 'right', mono: true }, { v: '   95', align: 'right', mono: true, color: DC.red,   bold: true }, { v: ' -405', align: 'right', mono: true, color: DC.red }, cbBadgeCell('High', DC.red)],
          [{ v: 'SKU_B_117', mono: true }, 'PCB Substrate',    'W4', { v: '1,200', align: 'right', mono: true }, { v: '  820', align: 'right', mono: true, color: DC.amber },           { v: ' -380', align: 'right', mono: true, color: DC.amber }, cbBadgeCell('Mid',  DC.amber)],
          [{ v: 'SKU_B_118', mono: true }, 'Phosphor Layer',   'W6', { v: '  800', align: 'right', mono: true }, { v: '  110', align: 'right', mono: true, color: DC.red,   bold: true }, { v: ' -690', align: 'right', mono: true, color: DC.red }, cbBadgeCell('High', DC.red)],
          [{ v: 'SKU_C_204', mono: true }, 'Lead Frame',       'W7', { v: '2,000', align: 'right', mono: true }, { v: '1,450', align: 'right', mono: true, color: DC.amber },           { v: ' -550', align: 'right', mono: true, color: DC.amber }, cbBadgeCell('Low',  DC.text2)],
          [{ v: 'SKU_C_205', mono: true }, 'Gold Wire 20um',   'W9', { v: '  300', align: 'right', mono: true }, { v: '   45', align: 'right', mono: true, color: DC.red,   bold: true }, { v: ' -255', align: 'right', mono: true, color: DC.red }, cbBadgeCell('High', DC.red)],
          [{ v: 'SKU_D_302', mono: true }, 'Encaps. Silicone', 'W10', { v: '  600', align: 'right', mono: true }, { v: '  380', align: 'right', mono: true, color: DC.amber },           { v: ' -220', align: 'right', mono: true, color: DC.amber }, cbBadgeCell('Mid',  DC.amber)],
        ]}
      />
    </CBWrap>
  ),

  // ---- CB_23 납기지연 오더 ----
  cb_late_orders: () => (
    <CBWrap header={<CBHead title="㉒ 납기 지연 예상 오더 (Late Orders)"
                           right={<CBBadge label="지연: 15건 · +3.4d 평균" color={DC.red} />} />}>
      <CBTable
        cols={['영업수주 (SO)', '고객사', '품목', '요청 납기', '예상 출하', '지연 일수', '우선순위']}
        colFlex={[1.2, 1, 1.4, 0.9, 0.9, 0.9, 0.8]}
        rows={[
          [{ v: 'SO-24-11001', mono: true }, 'Client A',  'LED Module 60W', { v: '11/15', mono: true }, { v: '11/18', mono: true, color: DC.amber }, { v: '+3 Days', color: DC.red,   bold: true }, cbBadgeCell('High', DC.red)],
          [{ v: 'SO-24-11002', mono: true }, 'Client B',  'PKG 3528 SMD',   { v: '11/15', mono: true }, { v: '11/17', mono: true, color: DC.amber }, { v: '+2 Days', color: DC.amber, bold: true }, cbBadgeCell('Mid',  DC.amber)],
          [{ v: 'SO-24-11003', mono: true }, 'Client C',  'Blue Chip 0.2W', { v: '11/20', mono: true }, { v: '11/25', mono: true, color: DC.red },   { v: '+5 Days', color: DC.red,   bold: true }, cbBadgeCell('High', DC.red)],
          [{ v: 'SO-24-11004', mono: true }, 'Client A',  'LED Module 30W', { v: '11/18', mono: true }, { v: '11/22', mono: true, color: DC.red },   { v: '+4 Days', color: DC.red,   bold: true }, cbBadgeCell('High', DC.red)],
          [{ v: 'SO-24-11005', mono: true }, 'Client D',  'PCB Substrate',  { v: '11/22', mono: true }, { v: '11/24', mono: true, color: DC.amber }, { v: '+2 Days', color: DC.amber, bold: true }, cbBadgeCell('Mid',  DC.amber)],
          [{ v: 'SO-24-11006', mono: true }, 'Client E',  'Wafer 6inch',    { v: '11/25', mono: true }, { v: '12/01', mono: true, color: DC.red },   { v: '+6 Days', color: DC.red,   bold: true }, cbBadgeCell('High', DC.red)],
          [{ v: 'SO-24-11007', mono: true }, 'Client B',  'Encaps. Sil.',   { v: '11/28', mono: true }, { v: '11/30', mono: true, color: DC.amber }, { v: '+2 Days', color: DC.amber, bold: true }, cbBadgeCell('Mid',  DC.amber)],
          [{ v: 'SO-24-11008', mono: true }, 'Client F',  'Phosphor',       { v: '12/01', mono: true }, { v: '12/05', mono: true, color: DC.red },   { v: '+4 Days', color: DC.red,   bold: true }, cbBadgeCell('High', DC.red)],
        ]}
      />
    </CBWrap>
  ),

  // ---- CB_24 자원 병목구간 ----
  cb_bottleneck: () => (
    <CBWrap header={<CBHead title="㉓ 자원 병목 구간 하이라이트 (Bottlenecks)"
                           right={<CBBadge label="과부하 3 · 주의 2" color={DC.red} />} />}>
      <CBTable
        cols={['설비 / 자원명', '필요 Capa (H)', '가용 Capa (H)', '가동률', '부하 차트', '상태']}
        colFlex={[1.6, 1, 1, 0.8, 1.8, 0.9]}
        rows={[
          ['Line-1 / M-EPI-01', { v: '  180', align: 'right', mono: true }, { v: '  160', align: 'right', mono: true }, { v: '113%', align: 'right', color: DC.red,   bold: true, mono: true }, '', cbBadgeCell('Overload', DC.red)],
          ['Line-2 / M-FAB-02', { v: '  150', align: 'right', mono: true }, { v: '  160', align: 'right', mono: true }, { v: ' 94%', align: 'right', color: DC.amber, bold: true, mono: true }, '', cbBadgeCell('Warn',     DC.amber)],
          ['Line-3 / M-PKG-03', { v: '  175', align: 'right', mono: true }, { v: '  160', align: 'right', mono: true }, { v: '109%', align: 'right', color: DC.red,   bold: true, mono: true }, '', cbBadgeCell('Overload', DC.red)],
          ['Line-4 / M-MOD-04', { v: '  140', align: 'right', mono: true }, { v: '  160', align: 'right', mono: true }, { v: ' 88%', align: 'right', color: DC.green, bold: true, mono: true }, '', cbBadgeCell('Normal',   DC.green)],
          ['Line-5 / M-EPI-05', { v: '  195', align: 'right', mono: true }, { v: '  160', align: 'right', mono: true }, { v: '122%', align: 'right', color: DC.red,   bold: true, mono: true }, '', cbBadgeCell('Overload', DC.red)],
          ['Line-6 / M-FAB-06', { v: '  120', align: 'right', mono: true }, { v: '  160', align: 'right', mono: true }, { v: ' 75%', align: 'right', color: DC.green, bold: true, mono: true }, '', cbBadgeCell('Normal',   DC.green)],
          ['Line-7 / M-PKG-07', { v: '  155', align: 'right', mono: true }, { v: '  160', align: 'right', mono: true }, { v: ' 97%', align: 'right', color: DC.amber, bold: true, mono: true }, '', cbBadgeCell('Warn',     DC.amber)],
          ['Line-8 / M-MOD-08', { v: '  110', align: 'right', mono: true }, { v: '  160', align: 'right', mono: true }, { v: ' 69%', align: 'right', color: DC.green, bold: true, mono: true }, '', cbBadgeCell('Normal',   DC.green)],
        ]}
        rowBg={[`${DC.red}22`, `${DC.amber}14`, `${DC.red}22`, 'transparent', `${DC.red}22`, 'transparent', `${DC.amber}14`, 'transparent']}
      />
    </CBWrap>
  ),

  // ---- CB_25 엔진버전 비교 ----
  cb_version_diff: () => (
    <CBWrap header={<CBHead title="㉔ 엔진 버전 비교 (Version Diff)"
                           right={<CBBadge label="V1.0 vs V1.1" color={DC.purple} />} />}>
      {CBRow(
        <CBCard title="Version 1.0 (어제 · 베이스라인)" titleColor={DC.text}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
            {[
              { k: '총 생산량',       v: '45,000 EA' },
              { k: '납기 준수율',     v: '92.0%' },
              { k: '평균 재고금액',   v: '1.2M' },
              { k: '총 원가',         v: '3.45B' },
              { k: '지연 오더 수',    v: '38 건' },
              { k: '평균 LT',         v: '7.8 days' },
              { k: '셋업 변경 수',    v: '128 회' },
              { k: '엔진 Runtime',    v: '2m 45s' },
            ].map((r, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between',
                                 borderBottom: `1px dashed ${DC.border}`, py: 0.15 }}>
                <Box sx={{ fontSize: 5, color: DC.text3 }}>{r.k}</Box>
                <Box sx={{ fontSize: 6, color: DC.text2, fontFamily: 'monospace', fontWeight: 700 }}>{r.v}</Box>
              </Box>
            ))}
          </Box>
        </CBCard>,
        <CBCard title="Version 1.1 (오늘 · 개선)" titleColor={DC.purple} borderColor={DC.purple}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
            {[
              { k: '총 생산량',       v: '46,500 EA',  d: '+1,500',  up: true },
              { k: '납기 준수율',     v: '95.4%',       d: '+3.4%p',  up: true },
              { k: '평균 재고금액',   v: '1.4M',        d: '+0.2M',   up: false },
              { k: '총 원가',         v: '3.38B',       d: '-0.07B',  up: true },
              { k: '지연 오더 수',    v: '12 건',       d: '-26 건',  up: true },
              { k: '평균 LT',         v: '6.4 days',    d: '-1.4d',   up: true },
              { k: '셋업 변경 수',    v: '94 회',       d: '-34 회',  up: true },
              { k: '엔진 Runtime',    v: '3m 12s',      d: '+27s',    up: false },
            ].map((r, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                 borderBottom: `1px dashed ${DC.border}`, py: 0.15 }}>
                <Box sx={{ fontSize: 5, color: DC.text2 }}>{r.k}</Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.3 }}>
                  <Box sx={{ fontSize: 6, color: r.up ? DC.green : DC.red, fontFamily: 'monospace', fontWeight: 700 }}>{r.v}</Box>
                  <Box sx={{ fontSize: 4, color: r.up ? DC.green : DC.red, fontWeight: 700 }}>
                    {r.up ? '▲' : '▼'} {r.d}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </CBCard>
      )}
    </CBWrap>
  ),

  // ---- CB_26 ERP 확정/전송 ----
  cb_erp_publish: () => (
    <CBWrap header={<CBHead title="㉕ 결과 승인 및 ERP 확정 (Publish)"
                           titleColor={DC.green}
                           right={<CBBtn label="✅ 최종 확정 및 ERP 인터페이스" color={DC.green} solid />} />}>
      <CBCard>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.4, p: 0.3 }}>
          <Box sx={{ textAlign: 'center', py: 0.3 }}>
            <Box sx={{ fontSize: 22 }}>📤</Box>
            <Box sx={{ fontSize: 7, color: DC.text, fontWeight: 700, mt: 0.2 }}>
              현재 시나리오 V1.1 결과를 공식 확정 플랜(Official Plan)으로 릴리즈합니다.
            </Box>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.3 }}>
            <CBStat value="46,500" label="총 생산량 (EA)"   valueColor={DC.green} />
            <CBStat value="95.4%"  label="납기 준수율"       valueColor={DC.green} />
            <CBStat value="12"     label="지연 오더"         valueColor={DC.green} />
            <CBStat value="1.4M"   label="재고 금액"         valueColor={DC.amber} />
          </Box>
          <Box sx={{ bgcolor: DC.surface3, border: `1px solid ${DC.border}`, borderRadius: 0.3, p: 0.3 }}>
            <Box sx={{ fontSize: 5, color: DC.text2, fontWeight: 700, mb: 0.15 }}>전송 대상 시스템</Box>
            <Box sx={{ display: 'flex', gap: 0.3, flexWrap: 'wrap' }}>
              {[
                { n: 'SAP ERP',      c: DC.blue  },
                { n: 'MES Siemens',  c: DC.cyan  },
                { n: 'WMS Manhattan', c: DC.purple },
                { n: 'BI Tableau',   c: DC.amber },
                { n: 'Analytics DW', c: DC.green },
              ].map((s, i) => (
                <CBBtn key={i} label={`● ${s.n}`} color={s.c} />
              ))}
            </Box>
          </Box>
        </Box>
      </CBCard>
    </CBWrap>
  ),

  // ---- CB_27 수동 오버라이드 ----
  cb_manual_override: () => (
    <CBWrap header={<CBHead title="㉖ 수동 오버라이드 (Manual Override)"
                           right={<CBBtn label="✎ 편집 저장" color={DC.amber} />} />}>
      <CBTable
        cols={['품목명', '품목 설명', '엔진 권장', '수동 확정', '차이', 'Override 사유', '담당']}
        colFlex={[1, 1.5, 1, 1, 0.8, 1.8, 0.9]}
        rows={[
          [{ v: 'Item_001', mono: true }, 'LED Chip 0.2W Blue',   { v: '   320', align: 'right', mono: true }, { v: '   350', align: 'right', mono: true, color: DC.amber, bold: true }, { v: '+30',  align: 'right', mono: true, color: DC.green }, '긴급 수요 (Client A)',   'mp_admin'],
          [{ v: 'Item_002', mono: true }, 'PKG 3528 SMD White',    { v: '   180', align: 'right', mono: true }, { v: '   150', align: 'right', mono: true, color: DC.amber, bold: true }, { v: '-30',  align: 'right', mono: true, color: DC.red   }, '재고 과다',               'mp_user01'],
          [{ v: 'Item_003', mono: true }, 'Wafer 6inch Sapphire',  { v: '   420', align: 'right', mono: true }, { v: '   420', align: 'right', mono: true, color: DC.text2 },            { v: '  0',  align: 'right', mono: true, color: DC.text3 }, '-',                      '-'],
          [{ v: 'Item_004', mono: true }, 'PCB Substrate RF',      { v: '   250', align: 'right', mono: true }, { v: '   300', align: 'right', mono: true, color: DC.amber, bold: true }, { v: '+50',  align: 'right', mono: true, color: DC.green }, '마케팅 캠페인',          'mp_user02'],
          [{ v: 'Item_005', mono: true }, 'Phosphor Yellow Layer', { v: '   540', align: 'right', mono: true }, { v: '   500', align: 'right', mono: true, color: DC.amber, bold: true }, { v: '-40',  align: 'right', mono: true, color: DC.red   }, '원재료 부족',            'mp_admin'],
          [{ v: 'Item_006', mono: true }, 'Lead Frame Copper',     { v: '   870', align: 'right', mono: true }, { v: '   870', align: 'right', mono: true, color: DC.text2 },            { v: '  0',  align: 'right', mono: true, color: DC.text3 }, '-',                      '-'],
          [{ v: 'Item_007', mono: true }, 'Gold Wire 20um',        { v: '   145', align: 'right', mono: true }, { v: '   180', align: 'right', mono: true, color: DC.amber, bold: true }, { v: '+35',  align: 'right', mono: true, color: DC.green }, '신제품 런칭',             'mp_user01'],
        ]}
      />
    </CBWrap>
  ),

  // ---- CB_28 AI 챗봇 ----
  cb_ai_chatbot: () => (
    <CBWrap header={<CBHead title="㉗ AI 챗봇 헬프데스크 (NL Query)"
                           right={<CBBadge label="LLM · GraphRAG 기반" color={DC.purple} />} />}>
      <CBCard>
        <Box sx={{ flex: 1, bgcolor: DC.surface2, borderRadius: 0.3, p: 0.4, mb: 0.3,
                   display: 'flex', flexDirection: 'column', gap: 0.3, minHeight: 0, overflow: 'hidden' }}>
          {/* 시스템 메시지 */}
          <Box sx={{ fontSize: 5, color: DC.text3, fontStyle: 'italic', textAlign: 'center' }}>
            — 온톨로지 기반 자연어 질의 응답 —
          </Box>
          {/* AI 인사 */}
          <Box sx={{ display: 'flex', gap: 0.2 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: DC.purple, display: 'flex',
                       alignItems: 'center', justifyContent: 'center', fontSize: 6 }}>🤖</Box>
            <Box sx={{ maxWidth: '75%', bgcolor: DC.surface, border: `1px solid ${DC.border}`,
                       borderRadius: 0.3, p: 0.3 }}>
              <Box sx={{ fontSize: 5, color: DC.text }}>안녕하세요. SCM 데이터에 대해 무엇을 도와드릴까요?</Box>
              <Box sx={{ fontSize: 4, color: DC.text3, mt: 0.1 }}>예) "이번 주 납기 지연 오더 보여줘"</Box>
            </Box>
          </Box>
          {/* 사용자 질문 */}
          <Box sx={{ display: 'flex', gap: 0.2, alignSelf: 'flex-end' }}>
            <Box sx={{ maxWidth: '75%', bgcolor: `${DC.cyan}22`, border: `1px solid ${DC.cyan}55`,
                       borderRadius: 0.3, p: 0.3 }}>
              <Box sx={{ fontSize: 5, color: DC.cyan }}>이번 주 납기 지연 예상되는 수주를 위험도 순으로 보여줘</Box>
            </Box>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: DC.cyan, display: 'flex',
                       alignItems: 'center', justifyContent: 'center', fontSize: 6, color: '#000', fontWeight: 700 }}>U</Box>
          </Box>
          {/* AI 응답 */}
          <Box sx={{ display: 'flex', gap: 0.2 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: DC.purple, display: 'flex',
                       alignItems: 'center', justifyContent: 'center', fontSize: 6 }}>🤖</Box>
            <Box sx={{ maxWidth: '80%', bgcolor: DC.surface, border: `1px solid ${DC.border}`,
                       borderRadius: 0.3, p: 0.3 }}>
              <Box sx={{ fontSize: 5, color: DC.text, mb: 0.2 }}>
                납기 지연 예상 수주 <Box component="span" sx={{ color: DC.red, fontWeight: 700 }}>15건</Box>을 찾았습니다 (View: VW_LATE_ORDERS).
              </Box>
              <Box sx={{ bgcolor: '#000', color: DC.green, fontFamily: 'monospace', fontSize: 4,
                         p: 0.2, borderRadius: 0.2 }}>
                SELECT SO_NO, CUSTOMER, DELAY_DAYS FROM VW_LATE_ORDERS WHERE DELAY_DAYS &gt; 0 ORDER BY DELAY_DAYS DESC
              </Box>
              <Box sx={{ fontSize: 4, color: DC.text3, mt: 0.1 }}>• Top 3: SO-11003 +5d, SO-11006 +6d, SO-11008 +4d</Box>
            </Box>
          </Box>
        </Box>
        {/* 입력창 */}
        <Box sx={{ display: 'flex', gap: 0.2 }}>
          <Box sx={{ flex: 1, bgcolor: DC.surface3, border: `1px solid ${DC.border}`, borderRadius: 0.3,
                     px: 0.3, py: 0.3, fontSize: 5, color: DC.text3 }}>
            자연어로 질문을 입력하세요...
          </Box>
          <CBBtn label="질문하기 ↵" color={DC.green} />
        </Box>
      </CBCard>
    </CBWrap>
  ),

  // ---- CB_29 물류망 Map ----
  cb_geo_map: () => (
    <CBWrap header={<CBHead title="㉘ 글로벌 물류망 맵 뷰 (Geo-Map View)"
                           right={<CBBadge label="5 거점 · 4 운송 경로" color={DC.amber} />} />}>
      <Box sx={{ flex: 1, border: `1px solid ${DC.border}`, borderRadius: 0.3,
                 background: `radial-gradient(circle, ${DC.surface} 0%, #000 100%)`,
                 position: 'relative', minHeight: 0, overflow: 'hidden' }}>
        <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
          {/* 지도 배경 — 간단한 대륙 윤곽 */}
          <path d="M 8 18 Q 20 10 35 14 T 55 12 T 75 16 T 92 20 L 92 40 Q 80 45 65 42 T 40 45 T 18 42 Z"
                fill={`${DC.surface3}88`} stroke={DC.border2} strokeWidth="0.3" />
          <path d="M 15 30 Q 25 28 35 32 T 55 35 T 80 32 L 80 50 Q 60 52 35 50 Z"
                fill={`${DC.surface3}55`} stroke={DC.border2} strokeWidth="0.2" />

          {/* 운송 경로 (애니메이션 느낌 — 굵기/투명도 다양) */}
          <line x1="20" y1="20" x2="50" y2="15" stroke={DC.cyan} strokeWidth="0.5" strokeDasharray="1 0.5" />
          <line x1="50" y1="15" x2="80" y2="30" stroke={DC.cyan} strokeWidth="0.5" strokeDasharray="1 0.5" />
          <line x1="50" y1="15" x2="40" y2="45" stroke={DC.amber} strokeWidth="0.5" />
          <line x1="40" y1="45" x2="75" y2="50" stroke={DC.cyan} strokeWidth="0.5" strokeDasharray="1 0.5" />
          <line x1="20" y1="20" x2="40" y2="45" stroke={DC.purple} strokeWidth="0.4" />

          {/* 거점 노드 */}
          {[
            { x: 20, y: 20, n: 'Seoul',  t: 'HQ',     c: DC.green },
            { x: 50, y: 15, n: 'Tianjin', t: 'Plant',  c: DC.amber },
            { x: 80, y: 30, n: 'LA',      t: 'Whse',   c: DC.cyan },
            { x: 40, y: 45, n: 'HCMC',    t: 'Plant',  c: DC.amber },
            { x: 75, y: 50, n: 'Mumbai',  t: 'Whse',   c: DC.cyan },
          ].map((p, i) => (
            <React.Fragment key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill={`${p.c}33`} />
              <circle cx={p.x} cy={p.y} r="2"   fill={p.c} />
              <text x={p.x} y={p.y - 4}    fontSize="2" fill={DC.text} textAnchor="middle" fontWeight="700">{p.n}</text>
              <text x={p.x} y={p.y + 6}    fontSize="1.8" fill={p.c}  textAnchor="middle">{p.t}</text>
            </React.Fragment>
          ))}
        </svg>
        {/* 범례 */}
        <Box sx={{ position: 'absolute', bottom: 3, left: 3,
                   bgcolor: `${DC.surface}dd`, border: `1px solid ${DC.border}`,
                   borderRadius: 0.2, px: 0.3, py: 0.2, display: 'flex', gap: 0.4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.15 }}>
            <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: DC.green }} /><Box sx={{ fontSize: 4, color: DC.text2 }}>본사</Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.15 }}>
            <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: DC.amber }} /><Box sx={{ fontSize: 4, color: DC.text2 }}>공장</Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.15 }}>
            <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: DC.cyan }} /><Box sx={{ fontSize: 4, color: DC.text2 }}>창고</Box>
          </Box>
        </Box>
      </Box>
    </CBWrap>
  ),

  // ---- CB_30 토폴로지 View ----
  cb_topology: () => (
    <CBWrap header={<CBHead title="㉙ 마이크로서비스 토폴로지 (Topology)"
                           right={<CBBadge label="10 Services · 1 Warning" color={DC.amber} />} />}>
      <Box sx={{ flex: 1, border: `1px solid ${DC.border}`, borderRadius: 0.3,
                 bgcolor: DC.surface2, minHeight: 0, overflow: 'hidden' }}>
        <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
          {/* 연결선 */}
          {[
            [25, 10, 50, 10, DC.green],
            [50, 10, 75, 10, DC.green],
            [25, 10, 25, 30, DC.green],
            [50, 10, 50, 30, DC.green],
            [75, 10, 75, 30, DC.amber],
            [25, 30, 50, 30, DC.green],
            [50, 30, 75, 30, DC.green],
            [25, 30, 42, 50, DC.green],
            [50, 30, 42, 50, DC.green],
            [75, 30, 58, 50, DC.green],
            [42, 50, 58, 50, DC.green],
          ].map(([x1, y1, x2, y2, color], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="0.4" opacity="0.8" />
          ))}

          {/* 서비스 노드 */}
          {[
            { x: 25, y: 10, name: 'API GW',   rps: '820', c: DC.green,  shape: 'rect' },
            { x: 50, y: 10, name: 'Auth',     rps: '245', c: DC.green,  shape: 'rect' },
            { x: 75, y: 10, name: 'LLM API',  rps: ' 42', c: DC.amber,  shape: 'rect' },
            { x: 25, y: 30, name: 'MP Engine', rps: ' 12', c: DC.green,  shape: 'rect' },
            { x: 50, y: 30, name: 'Cache',    rps: '1.2k', c: DC.green,  shape: 'rect' },
            { x: 75, y: 30, name: 'Queue',    rps: '180', c: DC.green,  shape: 'rect' },
            { x: 42, y: 50, name: 'DB Master', rps: '420', c: DC.green,  shape: 'rect' },
            { x: 58, y: 50, name: 'DB Slave',  rps: '210', c: DC.green,  shape: 'rect' },
          ].map((n, i) => (
            <React.Fragment key={i}>
              <rect x={n.x - 9} y={n.y - 3.5} width="18" height="7" rx="1"
                    fill={DC.surface} stroke={n.c} strokeWidth="0.5" />
              <text x={n.x} y={n.y - 0.3} fontSize="2" fill={DC.text} textAnchor="middle" fontWeight="700">{n.name}</text>
              <text x={n.x} y={n.y + 2}   fontSize="1.6" fill={n.c}  textAnchor="middle" fontFamily="monospace">{n.rps} rps</text>
            </React.Fragment>
          ))}
        </svg>
      </Box>
    </CBWrap>
  ),

  // ---- CB_31 커스텀 위젯 ----
  cb_custom_widget: () => (
    <CBWrap header={<CBHead title="㉚ 사용자 커스텀 대시보드 (Widgets)"
                           right={<CBBtn label="+ 위젯 추가" color={DC.blue} />} />}>
      <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                 gridTemplateRows: 'repeat(2, 1fr)', gap: 0.3, minHeight: 0 }}>
        {/* Widget 1: KPI */}
        <Box sx={{ bgcolor: DC.surface, border: `1px solid ${DC.border}`, borderRadius: 0.3, p: 0.35,
                   display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ fontSize: 5, color: DC.text2, fontWeight: 700, mb: 0.1 }}>Fill Rate</Box>
          <Box sx={{ fontSize: 12, color: DC.green, fontWeight: 700, fontFamily: 'monospace' }}>96.4%</Box>
          <Box sx={{ fontSize: 4, color: DC.green }}>▲ 3.4%p vs. 어제</Box>
        </Box>
        {/* Widget 2: Mini Line */}
        <Box sx={{ bgcolor: DC.surface, border: `1px solid ${DC.border}`, borderRadius: 0.3, p: 0.35,
                   display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ fontSize: 5, color: DC.text2, fontWeight: 700, mb: 0.2 }}>주간 생산 추이</Box>
          <svg viewBox="0 0 50 20" preserveAspectRatio="none" style={{ width: '100%', flex: 1 }}>
            <polyline points="0,15 8,12 16,10 24,8 32,6 40,4 50,5" fill="none" stroke={DC.cyan} strokeWidth="0.6" />
            <polyline points="0,15 8,12 16,10 24,8 32,6 40,4 50,5 50,20 0,20" fill={`${DC.cyan}22`} />
          </svg>
        </Box>
        {/* Widget 3: Donut */}
        <Box sx={{ bgcolor: DC.surface, border: `1px solid ${DC.border}`, borderRadius: 0.3, p: 0.35,
                   display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ fontSize: 5, color: DC.text2, fontWeight: 700, mb: 0.2 }}>Capa 가동률</Box>
          <svg viewBox="0 0 40 40" style={{ width: 26, height: 26, margin: '0 auto' }}>
            <circle cx="20" cy="20" r="14" fill="none" stroke={DC.surface3} strokeWidth="5" />
            <circle cx="20" cy="20" r="14" fill="none" stroke={DC.amber} strokeWidth="5"
                    strokeDasharray="70 30" strokeDashoffset="25" transform="rotate(-90 20 20)" />
            <text x="20" y="22" fontSize="8" fill={DC.text} textAnchor="middle" fontWeight="700">78%</text>
          </svg>
        </Box>
        {/* Widget 4: Bar */}
        <Box sx={{ bgcolor: DC.surface, border: `1px solid ${DC.border}`, borderRadius: 0.3, p: 0.35,
                   display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ fontSize: 5, color: DC.text2, fontWeight: 700, mb: 0.2 }}>Top 5 지연</Box>
          {['A', 'B', 'C', 'D', 'E'].map((l, i) => {
            const w = [90, 70, 55, 40, 25][i];
            return (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.2, mb: 0.1 }}>
                <Box sx={{ width: 6, fontSize: 4, color: DC.text3 }}>{l}</Box>
                <Box sx={{ flex: 1, height: 2, bgcolor: DC.surface3, borderRadius: 0.3 }}>
                  <Box sx={{ width: `${w}%`, height: '100%', bgcolor: DC.red, borderRadius: 0.3 }} />
                </Box>
                <Box sx={{ fontSize: 4, color: DC.text3, width: 6, textAlign: 'right', fontFamily: 'monospace' }}>{w}</Box>
              </Box>
            );
          })}
        </Box>
        {/* Widget 5: Mini Table */}
        <Box sx={{ bgcolor: DC.surface, border: `1px solid ${DC.border}`, borderRadius: 0.3, p: 0.25,
                   display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <Box sx={{ fontSize: 5, color: DC.text2, fontWeight: 700, mb: 0.15 }}>최근 실행</Box>
          <Box sx={{ fontSize: 4, color: DC.text3, display: 'flex', flexDirection: 'column', gap: 0.1 }}>
            <Box>RUN-089 · OK   · 2m34s</Box>
            <Box>RUN-088 · ERR · 3m12s</Box>
            <Box>RUN-087 · OK   · 2m58s</Box>
            <Box>RUN-086 · OK   · 2m41s</Box>
          </Box>
        </Box>
        {/* Widget 6: Add placeholder */}
        <Box sx={{ border: `2px dashed ${DC.border2}`, borderRadius: 0.3,
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   flexDirection: 'column', gap: 0.2, color: DC.text3 }}>
          <Box sx={{ fontSize: 16 }}>+</Box>
          <Box sx={{ fontSize: 5 }}>위젯 추가</Box>
        </Box>
      </Box>
    </CBWrap>
  ),

});

// =====================================================================
// PlanEdit 렌더러 — 다크 테마, 20개 PE_* 레이아웃
// =====================================================================

function PEPivotCell({ v, state }) {
  const bg = state === 'edit' ? `${DC.amber}44` : state === 'over' ? `${DC.red}44` : 'transparent';
  const col = state === 'edit' ? DC.amber : state === 'over' ? DC.red : DC.text;
  return (
    <Box sx={{ flex: 1, bgcolor: bg, color: col, fontSize: 5, px: 0.2, py: 0.15,
               borderRight: `1px solid ${DC.border}`, textAlign: 'right', fontFamily: 'monospace' }}>
      {v}
    </Box>
  );
}

function PEGanttRow({ label, start, width, color }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2, mb: 0.2 }}>
      <Box sx={{ width: 24, fontSize: 5, color: DC.text2, fontFamily: 'monospace' }}>{label}</Box>
      <Box sx={{ flex: 1, position: 'relative', height: 6, bgcolor: DC.surface3, borderRadius: 0.2 }}>
        <Box sx={{ position: 'absolute', left: `${start}%`, width: `${width}%`, height: '100%',
                   bgcolor: color, borderRadius: 0.2 }} />
      </Box>
    </Box>
  );
}

function PESlider({ label, value, color = DC.blue }) {
  return (
    <Box sx={{ mb: 0.3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 5, color: DC.text2 }}>
        <Box>{label}</Box><Box sx={{ color }}>{value}</Box>
      </Box>
      <Box sx={{ height: 3, bgcolor: DC.surface3, borderRadius: 2, position: 'relative', mt: 0.1 }}>
        <Box sx={{ position: 'absolute', left: `${value}%`, top: -1, width: 5, height: 5,
                   bgcolor: color, borderRadius: '50%' }} />
      </Box>
    </Box>
  );
}

Object.assign(RENDERERS, {

  // ---- PE_01 Pivot Grid 직접 보정 ----
  pe_pivot_grid_edit: () => (
    <CBWrap header={
      <CBHead
        title="① 날짜 Pivot Grid 직접 보정"
        titleColor={DC.green}
        right={
          <Box sx={{ display: 'flex', gap: 0.25 }}>
            <CBBtn label="⟳ 원복"        color={DC.text2} />
            <CBBtn label="변경 검증"     color={DC.amber} />
            <CBBtn label="💾 보정 저장"  color={DC.blue}  solid />
          </Box>
        }
      />}>
      {/* 범례 */}
      <Box sx={{ display: 'flex', gap: 0.2, flexShrink: 0, mb: 0.2 }}>
        <CBBadge label="보정대상: 계획수량" color={DC.blue} />
        <CBBadge label="● 수정됨"           color={DC.amber} />
        <CBBadge label="● 용량초과"         color={DC.red} />
        <CBBadge label="회색 = 주말"        color={DC.text2} />
      </Box>
      {/* Pivot */}
      <Box sx={{ flex: 1, bgcolor: DC.surface, border: `1px solid ${DC.border}`, borderRadius: 0.3,
                 overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Header row — D+1..D+8 + 합계 */}
        <Box sx={{ display: 'flex', bgcolor: DC.surface3, borderBottom: `1px solid ${DC.border}`, flexShrink: 0 }}>
          <Box sx={{ flex: 2.2, fontSize: 5, color: DC.text2, px: 0.3, py: 0.25, fontWeight: 700,
                     borderRight: `1px solid ${DC.border}` }}>품목 / 공급사</Box>
          {['11/09\n토', '11/10\n일', '11/11\n월', '11/12\n화', '11/13\n수', '11/14\n목', '11/15\n금', '11/16\n토', '합계'].map((d, i) => {
            const wk = i === 0 || i === 1 || i === 7;
            const last = i === 8;
            return (
              <Box key={i} sx={{ flex: last ? 1 : 0.9, fontSize: 4.5, color: wk ? DC.text3 : DC.text2,
                                 px: 0.2, py: 0.15, fontWeight: 700, textAlign: 'center',
                                 bgcolor: wk ? '#0e1020' : 'transparent',
                                 borderRight: i < 8 ? `1px solid ${DC.border}` : 'none',
                                 whiteSpace: 'pre-line', lineHeight: '6px' }}>
                {d}
              </Box>
            );
          })}
        </Box>
        {/* Rows */}
        {[
          { item: '메인보드 A형',       sup: '삼성전기',   vals: [   0,    0, 3200, 2850, 3100, 2950, 3050,    0, 15150], mods: {2:'edit', 3:'edit'} },
          { item: 'LCD 패널 32"',       sup: 'LG이노텍',   vals: [   0,    0, 4100, 3800, 5400, 4200, 3900,    0, 21400], mods: {4:'over'} },
          { item: 'MCU 칩 STM32',        sup: '대덕전자',   vals: [   0,    0, 1800, 1650, 1900, 1750, 1820,    0,  8920], mods: {} },
          { item: 'PCB 어셈블리',        sup: '영풍전자',   vals: [   0,    0, 2450, 2300, 2100, 5200, 2250,    0, 14300], mods: {5:'over'} },
          { item: '하우징 플라스틱',     sup: '세진반도체', vals: [   0,    0, 3700, 3500, 3600, 3650, 3720,    0, 18170], mods: {3:'edit'} },
          { item: '배터리 팩 3000mAh',   sup: '삼성SDI',     vals: [   0,    0, 1200, 1250, 1180, 1300, 1220,    0,  6150], mods: {} },
        ].map((r, ri) => (
          <Box key={ri} sx={{ display: 'flex', borderBottom: `1px solid ${DC.border}`, flexShrink: 0 }}>
            <Box sx={{ flex: 2.2, px: 0.3, py: 0.2, borderRight: `1px solid ${DC.border}` }}>
              <Box sx={{ fontSize: 5, color: DC.text, fontWeight: 600 }}>{r.item}</Box>
              <Box sx={{ fontSize: 4, color: DC.text3 }}>{r.sup}</Box>
            </Box>
            {r.vals.map((v, ci) => {
              const last = ci === 8;
              const wk = !last && (ci === 0 || ci === 1 || ci === 7);
              const state = r.mods[ci];
              const bg = wk ? '#0e1020' : state === 'edit' ? `${DC.amber}44` : state === 'over' ? `${DC.red}44` : 'transparent';
              const color = last ? DC.cyan : wk ? DC.text3 : state === 'edit' ? DC.amber : state === 'over' ? DC.red : DC.text;
              return (
                <Box key={ci} sx={{ flex: last ? 1 : 0.9, fontSize: 5, color, bgcolor: bg,
                                    fontWeight: (state || last) ? 700 : 400,
                                    px: 0.2, py: 0.2, textAlign: 'right', fontFamily: 'monospace',
                                    borderRight: ci < 8 ? `1px solid ${DC.border}` : 'none' }}>
                  {wk && v === 0 ? '—' : v.toLocaleString()}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
      {/* Summary */}
      <Box sx={{ display: 'flex', gap: 0.2, flexShrink: 0, mt: 0.2 }}>
        <CBStat value="4"       label="수정 셀 수"       valueColor={DC.amber} />
        <CBStat value="+1,250"  label="증가 합계"        valueColor={DC.green} />
        <CBStat value="-480"    label="감소 합계"        valueColor={DC.red} />
        <CBStat value="2"       label="용량초과 일수"    valueColor={DC.red} bg={`${DC.red}22`} border={DC.red} />
      </Box>
    </CBWrap>
  ),

  // ---- PE_02 간트 드래그 ----
  pe_gantt_drag_edit: () => (
    <CBWrap header={
      <CBHead
        title="② 간트 차트 드래그 & 리사이즈 보정"
        titleColor={DC.blue}
        right={
          <Box sx={{ display: 'flex', gap: 0.2, alignItems: 'center' }}>
            <CBBadge label="■ 계획" color={DC.blue} />
            <CBBadge label="■ 실적" color={DC.green} />
            <CBBadge label="■ 보정" color={DC.amber} />
            <CBBtn label="📅 보정 확정" color={DC.amber} solid />
          </Box>
        }
      />}>
      {/* Gantt */}
      <Box sx={{ flex: 1, bgcolor: DC.surface, border: `1px solid ${DC.border}`, borderRadius: 0.3,
                 display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        {/* Date header */}
        <Box sx={{ display: 'flex', bgcolor: DC.surface3, borderBottom: `1px solid ${DC.border}` }}>
          <Box sx={{ width: 70, fontSize: 4.5, color: DC.text2, px: 0.3, py: 0.2, fontWeight: 700,
                     borderRight: `1px solid ${DC.border}` }}>발주 / 품목</Box>
          <Box sx={{ flex: 1, display: 'flex' }}>
            {Array.from({ length: 14 }).map((_, i) => {
              const today = i === 0;
              const wk = i === 4 || i === 5 || i === 11 || i === 12;
              return (
                <Box key={i} sx={{ flex: 1, fontSize: 4, color: today ? DC.cyan : wk ? DC.text3 : DC.text3,
                                   textAlign: 'center', py: 0.2, fontFamily: 'monospace',
                                   bgcolor: wk ? '#10111e' : 'transparent',
                                   borderRight: i < 13 ? `1px solid ${DC.border}` : 'none',
                                   fontWeight: today ? 700 : 400 }}>
                  11/{(9 + i).toString().padStart(2, '0')}
                </Box>
              );
            })}
          </Box>
        </Box>
        {/* Rows */}
        {[
          { po: 'PO-2026-0001', item: '메인보드 A형',     planS: 0,  planW: 4, actS: 0, actW: 3, rev: false },
          { po: 'PO-2026-0002', item: 'LCD 패널 32"',     planS: 2,  planW: 5, actS: 2, actW: 4, rev: true  },
          { po: 'PO-2026-0003', item: 'MCU 칩 STM32',      planS: 4,  planW: 3, actS: 4, actW: 2, rev: false },
          { po: 'PO-2026-0004', item: 'PCB 어셈블리',      planS: 6,  planW: 4, actS: 6, actW: 3, rev: false },
          { po: 'PO-2026-0005', item: '하우징 플라스틱',   planS: 8,  planW: 5, actS: 8, actW: 2, rev: true  },
          { po: 'PO-2026-0006', item: '케이블 하네스',     planS: 10, planW: 3, actS: 0, actW: 0, rev: false },
        ].map((r, ri) => {
          const planColor = r.rev ? DC.amber : DC.blue;
          return (
            <Box key={ri} sx={{ display: 'flex', borderBottom: `1px solid ${DC.border}`, flexShrink: 0 }}>
              <Box sx={{ width: 70, px: 0.3, py: 0.2, borderRight: `1px solid ${DC.border}` }}>
                <Box sx={{ fontSize: 4, color: DC.blue, fontFamily: 'monospace' }}>{r.po}</Box>
                <Box sx={{ fontSize: 4.5, color: DC.text, fontWeight: 600,
                           whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.item}</Box>
              </Box>
              <Box sx={{ flex: 1, position: 'relative', minHeight: 16 }}>
                {/* Day cells + weekend bg */}
                {Array.from({ length: 14 }).map((_, i) => {
                  const wk = i === 4 || i === 5 || i === 11 || i === 12;
                  return (
                    <Box key={i} sx={{
                      position: 'absolute', top: 0, bottom: 0,
                      left: `${(i / 14) * 100}%`, width: `${100 / 14}%`,
                      bgcolor: wk ? '#10111e' : 'transparent',
                      borderRight: `1px solid ${DC.border}`,
                    }} />
                  );
                })}
                {/* Plan bar */}
                <Box sx={{
                  position: 'absolute', top: 2, height: 5,
                  left: `${(r.planS / 14) * 100}%`, width: `${(r.planW / 14) * 100}%`,
                  bgcolor: `${planColor}33`, border: `1px solid ${planColor}`,
                  borderRadius: 0.3, fontSize: 3.5, color: planColor, fontWeight: 700,
                  display: 'flex', alignItems: 'center', pl: 0.2,
                  whiteSpace: 'nowrap', overflow: 'hidden',
                }}>계획</Box>
                {/* Act bar */}
                {r.actW > 0 && (
                  <Box sx={{
                    position: 'absolute', top: 9, height: 5,
                    left: `${(r.actS / 14) * 100}%`, width: `${(r.actW / 14) * 100}%`,
                    bgcolor: `${DC.green}33`, border: `1px solid ${DC.green}`,
                    borderRadius: 0.3, fontSize: 3.5, color: DC.green, fontWeight: 700,
                    display: 'flex', alignItems: 'center', pl: 0.2,
                    whiteSpace: 'nowrap', overflow: 'hidden',
                  }}>실적</Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
      {/* Move log */}
      <Box sx={{ bgcolor: DC.surface, border: `1px solid ${DC.border}`, borderRadius: 0.3,
                 p: 0.3, mt: 0.2, flexShrink: 0 }}>
        <Box sx={{ fontSize: 5, color: DC.text, fontWeight: 700, mb: 0.1,
                   display: 'flex', justifyContent: 'space-between' }}>
          <Box>이동 이력</Box><CBBadge label="최근 3건" color={DC.text2} />
        </Box>
        <Box sx={{ fontSize: 4.5, color: DC.amber, lineHeight: '7px' }}>
          <Box>▸ PO-2026-0002  +2일 이동</Box>
          <Box>▸ PO-2026-0005  -1일 이동</Box>
          <Box>▸ PO-2026-0006  +3일 이동</Box>
        </Box>
      </Box>
    </CBWrap>
  ),

  // ---- PE_03 Excel 업로드 일괄 ----
  pe_excel_upload_edit: () => (
    <CBWrap header={<CBHead title="③ Excel 파일 업로드 일괄 보정" titleColor={DC.cyan}
                           right={<CBBadge label="Template v1.2" color={DC.cyan} />} />}>
      <Box sx={{ flex: 1, display: 'flex', gap: 0.3, minHeight: 0 }}>
        {/* Left column */}
        <Box sx={{ width: 95, display: 'flex', flexDirection: 'column', gap: 0.3 }}>
          <CBCard title="Step 1. 파일 업로드">
            <Box sx={{ flex: 1, border: `2px dashed ${DC.cyan}`, borderRadius: 0.4,
                       bgcolor: `${DC.cyan}11`,
                       display: 'flex', flexDirection: 'column', alignItems: 'center',
                       justifyContent: 'center', gap: 0.2, minHeight: 50 }}>
              <Box sx={{ fontSize: 14 }}>✅</Box>
              <Box sx={{ fontSize: 5.5, color: DC.green, fontWeight: 700 }}>업로드 완료</Box>
              <Box sx={{ fontSize: 4, color: DC.text3 }}>plan_edit_20241108.xlsx</Box>
            </Box>
          </CBCard>
          <CBCard title="업로드 결과">
            <Box sx={{ display: 'flex', gap: 0.2, mb: 0.2 }}>
              <CBStat value="300"  label="전체" />
              <CBStat value="278"  label="정상" valueColor={DC.green} />
              <CBStat value="22"   label="오류" valueColor={DC.red} bg={`${DC.red}22`} border={DC.red} />
            </Box>
            <CBBtn label="✓ 정상 행 일괄 반영" color={DC.blue} solid />
          </CBCard>
        </Box>
        {/* Right column — validation table */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.2 }}>
          <Box sx={{ fontSize: 5, color: DC.text2, fontWeight: 700, flexShrink: 0 }}>
            검증 결과 (일부)
          </Box>
          <CBTable
            cols={['행', '발주번호', '품목코드', '보정일자', '수량', '검증', '오류 내용']}
            colFlex={[0.4, 1.3, 1.2, 1, 0.8, 0.9, 1.8]}
            rows={[
              [{ v: '01', mono: true }, { v: 'PO-2026-0001', mono: true, color: DC.blue }, { v: 'ITEM_A01', mono: true }, { v: '11/11', mono: true }, { v: '  320', align: 'right', mono: true }, cbBadgeCell('정상', DC.green), ''],
              [{ v: '02', mono: true }, { v: 'PO-2026-0002', mono: true, color: DC.blue }, { v: 'ITEM_B02', mono: true }, { v: '11/12', mono: true }, { v: '  180', align: 'right', mono: true }, cbBadgeCell('정상', DC.green), ''],
              [{ v: '03', mono: true }, { v: 'PO-2026-0003', mono: true, color: DC.blue }, { v: 'ITEM_C03', mono: true }, { v: '2026-13-32', mono: true, color: DC.red }, { v: '  450', align: 'right', mono: true }, cbBadgeCell('오류', DC.red), { v: '날짜 형식 오류', color: DC.red }],
              [{ v: '04', mono: true }, { v: 'PO-2026-0004', mono: true, color: DC.blue }, { v: 'ITEM_D04', mono: true }, { v: '11/14', mono: true }, { v: '6,200', align: 'right', mono: true, color: DC.red, bold: true }, cbBadgeCell('오류', DC.red), { v: '용량 초과 (>5000)', color: DC.red }],
              [{ v: '05', mono: true }, { v: 'PO-2026-0005', mono: true, color: DC.blue }, { v: 'ITEM_E05', mono: true }, { v: '11/15', mono: true }, { v: '  275', align: 'right', mono: true }, cbBadgeCell('정상', DC.green), ''],
              [{ v: '06', mono: true }, { v: 'PO-2026-0006', mono: true, color: DC.blue }, { v: 'ITEM_F06', mono: true }, { v: '11/15', mono: true }, { v: '  420', align: 'right', mono: true }, cbBadgeCell('정상', DC.green), ''],
              [{ v: '07', mono: true }, { v: 'PO-2026-0007', mono: true, color: DC.blue }, { v: '(비어있음)', color: DC.red }, { v: '11/18', mono: true }, { v: '  180', align: 'right', mono: true }, cbBadgeCell('오류', DC.red), { v: '품목코드 누락', color: DC.red }],
              [{ v: '08', mono: true }, { v: 'PO-2026-0008', mono: true, color: DC.blue }, { v: 'ITEM_H08', mono: true }, { v: '11/18', mono: true }, { v: '  340', align: 'right', mono: true }, cbBadgeCell('정상', DC.green), ''],
            ]}
            rowBg={['transparent', 'transparent', `${DC.red}22`, `${DC.red}22`, 'transparent', 'transparent', `${DC.red}22`, 'transparent']}
          />
        </Box>
      </Box>
    </CBWrap>
  ),

  // ---- PE_04 Before/After Diff Viewer ----
  pe_diff_viewer: () => (
    <CBWrap header={
      <CBHead
        title="④ Before / After 차이 비교 뷰 (Diff Viewer)"
        titleColor={DC.amber}
        right={
          <Box sx={{ display: 'flex', gap: 0.25 }}>
            <CBBtn label="⟳ 새 비교"    color={DC.text2} />
            <CBBtn label="✓ 선택 적용"  color={DC.green} />
            <CBBtn label="전체 적용"    color={DC.blue}  solid />
          </Box>
        }
      />}>
      <CBTable
        cols={['☑', '발주번호', '품목명', '납기일', '계획수량(전)', '계획수량(후)', '차이', '구분']}
        colFlex={[0.3, 1.3, 1.3, 0.9, 1, 1, 0.8, 0.7]}
        rows={[
          ['☑', { v: 'PO-2026-0001', mono: true, color: DC.blue }, '메인보드 A형',     { v: '11/15', mono: true }, { v: ' 3,200', align: 'right', mono: true },                              { v: ' 3,450', align: 'right', mono: true, color: DC.green, bold: true }, { v: '+250', align: 'right', mono: true, color: DC.green }, cbBadgeCell('변경', DC.amber)],
          ['☑', { v: 'PO-2026-0002', mono: true, color: DC.blue }, 'LCD 패널 32"',      { v: '11/16', mono: true }, { v: ' 4,100', align: 'right', mono: true, color: DC.red },
                                                                                                                  { v: ' 3,800', align: 'right', mono: true, color: DC.green, bold: true }, { v: '-300', align: 'right', mono: true, color: DC.red },   cbBadgeCell('변경', DC.amber)],
          ['☐', { v: 'PO-2026-0003', mono: true, color: DC.blue }, 'MCU 칩 STM32',       { v: '11/17', mono: true }, { v: ' 1,800', align: 'right', mono: true },                              { v: ' 1,800', align: 'right', mono: true },                              { v: '   0', align: 'right', mono: true, color: DC.text3 }, cbBadgeCell('동일', DC.text2)],
          ['☑', { v: 'PO-2026-0004', mono: true, color: DC.blue }, 'PCB 어셈블리',       { v: '11/18', mono: true }, { v: '   —',   align: 'right', mono: true, color: DC.text3 },            { v: ' 2,450', align: 'right', mono: true, color: DC.green, bold: true }, { v: 'NEW',  align: 'right', mono: true, color: DC.green }, cbBadgeCell('추가', DC.green)],
          ['☑', { v: 'PO-2026-0005', mono: true, color: DC.blue }, '하우징 플라스틱',    { v: '11/19', mono: true }, { v: ' 3,700', align: 'right', mono: true },                              { v: ' 3,950', align: 'right', mono: true, color: DC.green, bold: true }, { v: '+250', align: 'right', mono: true, color: DC.green }, cbBadgeCell('변경', DC.amber)],
          ['☑', { v: 'PO-2026-0006', mono: true, color: DC.blue }, '케이블 하네스',      { v: '11/19', mono: true }, { v: ' 2,100', align: 'right', mono: true },                              { v: '   —',   align: 'right', mono: true, color: DC.red },               { v: 'DEL',  align: 'right', mono: true, color: DC.red },   cbBadgeCell('삭제', DC.red)],
          ['☑', { v: 'PO-2026-0007', mono: true, color: DC.blue }, '배터리 팩',          { v: '11/20', mono: true }, { v: ' 1,200', align: 'right', mono: true },                              { v: ' 1,380', align: 'right', mono: true, color: DC.green, bold: true }, { v: '+180', align: 'right', mono: true, color: DC.green }, cbBadgeCell('변경', DC.amber)],
          ['☑', { v: 'PO-2026-0008', mono: true, color: DC.blue }, '냉각팬 80mm',        { v: '11/21', mono: true }, { v: ' 2,500', align: 'right', mono: true },                              { v: ' 2,200', align: 'right', mono: true, color: DC.red, bold: true },   { v: '-300', align: 'right', mono: true, color: DC.red },   cbBadgeCell('변경', DC.amber)],
          ['☐', { v: 'PO-2026-0009', mono: true, color: DC.blue }, '전원공급장치',       { v: '11/22', mono: true }, { v: ' 1,800', align: 'right', mono: true },                              { v: ' 1,800', align: 'right', mono: true },                              { v: '   0', align: 'right', mono: true, color: DC.text3 }, cbBadgeCell('동일', DC.text2)],
        ]}
        rowBg={[`${DC.amber}22`, `${DC.amber}22`, 'transparent', `${DC.green}22`, `${DC.amber}22`, `${DC.red}22`, `${DC.amber}22`, `${DC.amber}22`, 'transparent']}
      />
    </CBWrap>
  ),

  // ---- PE_05 시나리오 비교 ----
  pe_scenario_compare: () => (
    <CBWrap header={<CBHead title="⑤ 시나리오 비교 & 선택 (What-if Analysis)"
                           titleColor={DC.purple}
                           right={<CBBtn label="시나리오 확정" color={DC.purple} solid />} />}>
      {/* Scenario Tabs */}
      <Box sx={{ display: 'flex', gap: 0.1, flexShrink: 0, mb: 0.2 }}>
        {[
          { n: '현재안',     tag: '현재',    tagColor: DC.text2, active: false, color: DC.text2, best: false },
          { n: '시나리오 A', tag: '절충안',  tagColor: DC.blue,  active: false, color: DC.blue,   best: false },
          { n: '시나리오 B', tag: '★ 최적안', tagColor: DC.green, active: true,  color: DC.green, best: true  },
        ].map((s, i) => (
          <Box key={i} sx={{
            bgcolor: s.active ? DC.surface : DC.surface3,
            borderTop:    `1px solid ${s.best ? DC.green : DC.border}`,
            borderLeft:   `1px solid ${s.best ? DC.green : DC.border}`,
            borderRight:  `1px solid ${s.best ? DC.green : DC.border}`,
            borderBottom: s.active ? `2px solid ${DC.surface}` : `1px solid ${DC.border}`,
            borderRadius: '4px 4px 0 0', px: 0.5, py: 0.25,
            fontSize: 6, color: s.active ? s.color : DC.text2, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 0.2,
          }}>
            {s.n}
            <Box sx={{ fontSize: 4.5, color: s.tagColor, bgcolor: `${s.tagColor}22`,
                       px: 0.2, borderRadius: 0.15 }}>{s.tag}</Box>
          </Box>
        ))}
      </Box>
      {/* Detail panel */}
      <Box sx={{ flex: 1, bgcolor: DC.surface, border: `1px solid ${DC.border}`, borderRadius: '0 4px 4px 4px',
                 p: 0.4, display: 'flex', flexDirection: 'column', gap: 0.3, minHeight: 0 }}>
        {/* KPI Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.2 }}>
          <CBStat value="98,450"  label="총 계획수량"   valueColor={DC.green} />
          <CBStat value="96.4%"   label="납기 준수율"   valueColor={DC.green} />
          <CBStat value="1.1M"    label="재고 금액"      valueColor={DC.green} />
          <CBStat value="88%"     label="설비 가동률"    valueColor={DC.amber} />
        </Box>
        {/* Comparison Table */}
        <CBTable
          cols={['지표', '현재안', '시나리오 A', '시나리오 B ★', 'Best Δ']}
          colFlex={[1.5, 1, 1, 1.2, 0.9]}
          rows={[
            ['총 계획수량',   { v: '92,100',  align: 'right', mono: true },                              { v: '94,800',  align: 'right', mono: true },                              { v: '98,450',  align: 'right', mono: true, color: DC.green, bold: true }, { v: '+6,350', align: 'right', mono: true, color: DC.green }],
            ['납기 준수율',   { v: '89.2%',   align: 'right', mono: true, color: DC.red },               { v: '93.5%',   align: 'right', mono: true, color: DC.amber },             { v: '96.4%',   align: 'right', mono: true, color: DC.green, bold: true }, { v: '+7.2%p', align: 'right', mono: true, color: DC.green }],
            ['재고 금액',     { v: '1.45M',   align: 'right', mono: true, color: DC.red },               { v: '1.25M',   align: 'right', mono: true, color: DC.amber },             { v: '1.10M',   align: 'right', mono: true, color: DC.green, bold: true }, { v: '-0.35M', align: 'right', mono: true, color: DC.green }],
            ['지연 오더 수',  { v: '38',      align: 'right', mono: true, color: DC.red },               { v: '22',      align: 'right', mono: true, color: DC.amber },             { v: '12',      align: 'right', mono: true, color: DC.green, bold: true }, { v: '-26',    align: 'right', mono: true, color: DC.green }],
            ['설비 가동률',   { v: '72%',     align: 'right', mono: true, color: DC.amber },             { v: '85%',     align: 'right', mono: true, color: DC.green },             { v: '88%',     align: 'right', mono: true, color: DC.green, bold: true }, { v: '+16%p',  align: 'right', mono: true, color: DC.green }],
            ['총 원가',       { v: '3.45B',   align: 'right', mono: true },                              { v: '3.40B',   align: 'right', mono: true },                              { v: '3.38B',   align: 'right', mono: true, color: DC.green, bold: true }, { v: '-0.07B', align: 'right', mono: true, color: DC.green }],
          ]}
        />
      </Box>
    </CBWrap>
  ),

  // ---- PE_06 캘린더 드래그 ----
  pe_calendar_drag: () => (
    <CBWrap header={
      <CBHead
        title="⑥ 캘린더 뷰 드래그 납기 보정"
        titleColor={DC.green}
        right={
          <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'center' }}>
            <CBBtn label="◀" color={DC.text2} />
            <Box sx={{ fontSize: 5.5, color: DC.text, fontWeight: 700 }}>2026년 4월</Box>
            <CBBtn label="▶" color={DC.text2} />
            <CBBtn label="💾 저장" color={DC.green} solid />
          </Box>
        }
      />}>
      <Box sx={{ flex: 1, display: 'flex', gap: 0.3, minHeight: 0 }}>
        {/* Calendar */}
        <CBCard>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.1, flex: 1, minHeight: 0 }}>
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <Box key={d} sx={{ fontSize: 4.5, fontWeight: 700,
                                 color: i === 0 ? DC.red : i === 6 ? DC.blue : DC.text3,
                                 textAlign: 'center', py: 0.1 }}>{d}</Box>
            ))}
            {Array.from({ length: 35 }).map((_, i) => {
              const day = i - 2;
              if (day < 1 || day > 30) return <Box key={i} />;
              const dow = i % 7;
              const wk = dow === 0 || dow === 6;
              const today = day === 22;
              const orders = {
                3:  [{ po: 'PO-01', item: 'MCU',  color: DC.blue }],
                8:  [{ po: 'PO-02', item: 'LCD',  color: DC.purple }, { po: 'PO-03', item: 'PCB',  color: DC.amber }],
                14: [{ po: 'PO-04', item: 'Board', color: DC.blue }],
                17: [{ po: 'PO-05', item: 'Cable', color: DC.green }, { po: 'PO-06', item: 'Fan',   color: DC.cyan }],
                22: [{ po: 'PO-07', item: 'Batt',  color: DC.purple }],
                25: [{ po: 'PO-08', item: 'Touch', color: DC.amber }, { po: 'PO-09', item: 'PSU',   color: DC.blue }],
                28: [{ po: 'PO-10', item: 'Hse',   color: DC.green }],
              }[day] || [];
              return (
                <Box key={i} sx={{
                  border: `1px solid ${today ? DC.cyan : DC.border}`, borderRadius: 0.2, p: 0.1,
                  bgcolor: wk ? DC.bg : DC.surface,
                  opacity: wk ? 0.7 : 1,
                  minHeight: 24, display: 'flex', flexDirection: 'column', gap: 0.1, overflow: 'hidden',
                }}>
                  <Box sx={{ fontSize: 4.5, fontWeight: 700, color: today ? DC.cyan : wk ? DC.text3 : DC.text }}>
                    {day}
                  </Box>
                  {orders.slice(0, 2).map((o, oi) => (
                    <Box key={oi} sx={{
                      bgcolor: `${o.color}22`, border: `1px solid ${o.color}55`,
                      color: o.color, borderRadius: 0.1, px: 0.15, py: 0.05,
                      fontSize: 3.5, fontWeight: 700,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {o.po}
                    </Box>
                  ))}
                </Box>
              );
            })}
          </Box>
        </CBCard>
        {/* Queue */}
        <Box sx={{ width: 75, flexShrink: 0 }}>
          <CBCard title="이동 대기열">
            {[
              { po: 'PO-12', item: '하우징',  old: '4/10', nw: '4/15' },
              { po: 'PO-35', item: 'MCU',     old: '4/18', nw: '4/22' },
              { po: 'PO-48', item: 'PCB',     old: '4/25', nw: '4/28' },
              { po: 'PO-52', item: 'Cable',   old: '4/20', nw: '4/24' },
            ].map((q, i) => (
              <Box key={i} sx={{
                bgcolor: DC.surface3, border: `1px dashed ${DC.border2}`,
                borderRadius: 0.2, p: 0.2, mb: 0.15,
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ fontSize: 4, color: DC.blue, fontFamily: 'monospace', fontWeight: 700 }}>{q.po}</Box>
                  <Box sx={{ fontSize: 4, color: DC.text3 }}>⋮⋮</Box>
                </Box>
                <Box sx={{ fontSize: 3.5, color: DC.text }}>{q.item}</Box>
                <Box sx={{ fontSize: 3.5, color: DC.text3, mt: 0.1 }}>
                  <Box component="span" sx={{ textDecoration: 'line-through' }}>{q.old}</Box>
                  {' → '}
                  <Box component="span" sx={{ color: DC.amber, fontWeight: 700 }}>{q.nw}</Box>
                </Box>
              </Box>
            ))}
          </CBCard>
        </Box>
      </Box>
    </CBWrap>
  ),

  // ---- PE_07 제약조건 알림 & 가이드 ----
  pe_constraint_guide: () => (
    <CBWrap header={
      <CBHead
        title="⑦ 제약조건 알림 & 가이드 보정"
        titleColor={DC.red}
        right={
          <Box sx={{ display: 'flex', gap: 0.25 }}>
            <CBBtn label="⟳ 재분석"           color={DC.text2} />
            <CBBtn label="권장안 일괄 적용"   color={DC.blue} solid />
          </Box>
        }
      />}>
      <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.3, minHeight: 0 }}>
        {/* Violations */}
        <CBCard title={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Box>🔴 위반 항목</Box>
            <CBBadge label="5건" color={DC.red} />
          </Box>
        } titleColor={DC.red} borderColor={DC.red}>
          {[
            { sev: 'red',   icon: '⛔', title: 'L1-SMT 용량 초과 (4/15)',     detail: '필요 5,400 > 가용 5,000 (+8%)' },
            { sev: 'red',   icon: '⛔', title: '재고 부족 — Wafer 6inch',      detail: 'W2: SS 500 → 95 (-81%)' },
            { sev: 'red',   icon: '⛔', title: 'PO-2026-0042 납기 초과',        detail: '요청 11/15 → 예상 11/20 (+5d)' },
            { sev: 'amber', icon: '⚠',  title: 'L3-조립 가동률 주의 (94%)',    detail: '임계치 95% 근접' },
            { sev: 'amber', icon: '⚠',  title: 'LT 누락 — Item_P_331',         detail: 'MDM에 LT 정의 없음 (기본값 적용)' },
          ].map((a, i) => {
            const color = a.sev === 'red' ? DC.red : DC.amber;
            return (
              <Box key={i} sx={{
                display: 'flex', gap: 0.25,
                bgcolor: `${color}22`,
                borderLeft: `2px solid ${color}`,
                borderRadius: 0.2, p: 0.25, mb: 0.2,
              }}>
                <Box sx={{ fontSize: 8, color }}>{a.icon}</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ fontSize: 5, color: DC.text, fontWeight: 700 }}>{a.title}</Box>
                  <Box sx={{ fontSize: 4, color: DC.text3 }}>{a.detail}</Box>
                </Box>
              </Box>
            );
          })}
        </CBCard>
        {/* Suggestions */}
        <CBCard title={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Box>💡 권장 보정 액션</Box>
            <CBBadge label="6개" color={DC.blue} />
          </Box>
        } titleColor={DC.blue} borderColor={DC.blue}>
          {[
            { icon: '⏩', title: 'PO-0042 다음 주로 이동',       score: 92, benefit: '지연 0일 회복' },
            { icon: '✂',  title: 'PO-0055 수량 50% 분할 생산',    score: 85, benefit: 'L1 부하 -12%' },
            { icon: '⬇',  title: 'PO-0088 수량 -20% 감량',        score: 80, benefit: 'Wafer 재고 +200' },
            { icon: '↔',  title: 'Alt-Part 스왑 (Item_331)',       score: 78, benefit: '결품 해결' },
            { icon: '🔄', title: 'L3 작업 L4로 재배치',             score: 70, benefit: 'L3 부하 -7%' },
            { icon: '📦', title: 'B공장 이관 (PO-0101)',          score: 68, benefit: 'A공장 부하 -15%' },
          ].map((a, i) => (
            <Box key={i} sx={{
              display: 'flex', gap: 0.2,
              bgcolor: DC.surface3,
              borderRadius: 0.2, p: 0.25, mb: 0.15,
            }}>
              <Box sx={{ fontSize: 7 }}>{a.icon}</Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ fontSize: 5, color: DC.text, fontWeight: 600,
                           whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {a.title}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 4, color: DC.text3 }}>
                  <Box>효과: <Box component="span" sx={{ color: DC.green }}>{a.benefit}</Box></Box>
                  <Box>Score <Box component="span" sx={{ color: DC.purple, fontWeight: 700 }}>{a.score}</Box></Box>
                </Box>
              </Box>
            </Box>
          ))}
        </CBCard>
      </Box>
    </CBWrap>
  ),

  // ---- PE_08 Capacity 슬라이더 ----
  pe_capacity_slider: () => (
    <CBWrap header={<CBHead title="⑧ 설비/라인 Capacity 슬라이더 보정"
                           titleColor={DC.blue}
                           right={<CBBtn label="💾 저장" color={DC.blue} solid />} />}>
      {CBRow(
        <CBCard title="라인별 일간 Capacity 보정">
          {[
            { line: 'L1-SMT',    v: 85,  hr: '680h / 800h',  color: DC.amber },
            { line: 'L2-삽입',    v: 98,  hr: '784h / 800h',  color: DC.red   },
            { line: 'L3-조립',    v: 45,  hr: '360h / 800h',  color: DC.green },
            { line: 'L4-검사',    v: 72,  hr: '576h / 800h',  color: DC.amber },
            { line: 'L5-포장',    v: 55,  hr: '440h / 800h',  color: DC.green },
            { line: 'L6-출하',    v: 62,  hr: '496h / 800h',  color: DC.green },
          ].map((r, i) => (
            <Box key={i} sx={{ mb: 0.25 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 5, mb: 0.1 }}>
                <Box sx={{ color: DC.text, fontWeight: 700 }}>{r.line}</Box>
                <Box sx={{ color: DC.text3, fontFamily: 'monospace' }}>{r.hr}</Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.2, alignItems: 'center' }}>
                <Box sx={{ flex: 1, height: 3, bgcolor: DC.surface3, borderRadius: 2, position: 'relative' }}>
                  <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0,
                             width: `${r.v}%`, bgcolor: r.color, borderRadius: 2 }} />
                  <Box sx={{ position: 'absolute', left: `${r.v}%`, top: -1.5, width: 6, height: 6,
                             bgcolor: r.color, borderRadius: '50%',
                             boxShadow: `0 0 4px ${r.color}` }} />
                </Box>
                <Box sx={{ width: 22, fontSize: 5.5, color: r.color, fontFamily: 'monospace',
                           fontWeight: 700, textAlign: 'right' }}>{r.v}%</Box>
              </Box>
            </Box>
          ))}
        </CBCard>,
        <CBCard title="보정 후 부하율 (Load %)">
          {[
            { line: 'L1-SMT', load: 85,  color: DC.amber },
            { line: 'L2-삽입', load: 108, color: DC.red   },
            { line: 'L3-조립', load: 62,  color: DC.green },
            { line: 'L4-검사', load: 92,  color: DC.amber },
            { line: 'L5-포장', load: 55,  color: DC.green },
            { line: 'L6-출하', load: 78,  color: DC.amber },
          ].map((r, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mb: 0.25 }}>
              <Box sx={{ width: 28, fontSize: 5, color: DC.text2, fontWeight: 700 }}>{r.line}</Box>
              <Box sx={{ flex: 1, height: 5, bgcolor: DC.surface3, borderRadius: 0.2, position: 'relative',
                         overflow: 'visible' }}>
                <Box sx={{ height: '100%', width: `${Math.min(r.load, 100)}%`,
                           bgcolor: r.color, borderRadius: 0.2 }} />
                {r.load > 100 && (
                  <Box sx={{ position: 'absolute', left: '100%', top: 0, bottom: 0,
                             width: `${r.load - 100}%`, bgcolor: DC.red, borderRadius: 0.2,
                             border: `0.5px solid #fff` }} />
                )}
                {/* 100% limit line */}
                <Box sx={{ position: 'absolute', right: 0, top: -2, bottom: -2, width: 1.2, bgcolor: DC.red }} />
              </Box>
              <Box sx={{ width: 18, fontSize: 5, color: r.color, fontWeight: 700, fontFamily: 'monospace',
                         textAlign: 'right' }}>{r.load}%</Box>
            </Box>
          ))}
          <Box sx={{ mt: 0.3, fontSize: 4, color: DC.text3, textAlign: 'right' }}>
            ━ 빨간 선 = 100% 한계 · 초과 = 외주 필요
          </Box>
        </CBCard>
      )}
    </CBWrap>
  ),

  // ---- PE_09 Ripple Effect ----
  pe_ripple_effect: () => (
    <CBWrap header={<CBHead title="⑨ 파급 영향 분석 & 연쇄 보정 (Ripple Effect)"
                           titleColor={DC.amber}
                           right={<CBBtn label="⚡ 연쇄 자동 보정" color={DC.amber} solid />} />}>
      <Box sx={{ flex: 1, display: 'flex', gap: 0.3, minHeight: 0 }}>
        {/* Trigger */}
        <Box sx={{ width: 95 }}>
          <CBCard title="보정 트리거 선택">
            <Box sx={{ fontSize: 4.5, color: DC.text3, mb: 0.1 }}>발주번호</Box>
            <CBInput value="PO-2026-0042  ▾" />
            <Box sx={{ fontSize: 4.5, color: DC.text3, mb: 0.1, mt: 0.25 }}>변경 유형</Box>
            <CBInput value="납기일 변경 (+3일)  ▾" />
            <Box sx={{ fontSize: 4.5, color: DC.text3, mb: 0.1, mt: 0.25 }}>변경 상세</Box>
            <Box sx={{ bgcolor: `${DC.amber}22`, border: `1px solid ${DC.amber}55`,
                       borderRadius: 0.2, p: 0.2, fontSize: 4.5, color: DC.text }}>
              <Box>• 원 납기: <b>11/15</b></Box>
              <Box>• 신 납기: <b>11/18</b></Box>
              <Box>• 수량 유지</Box>
            </Box>
            <Box sx={{ flex: 1 }} />
            <CBBtn label="분석 실행 ▶" color={DC.blue} solid />
          </CBCard>
        </Box>
        {/* Impact tree */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <CBCard title={
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Box>파급 영향 트리</Box>
              <CBBadge label="영향: 12건 · 치명 3건" color={DC.red} />
            </Box>
          }>
            {[
              { lvl: 0, txt: '🎯 PO-2026-0042 (트리거)',                     sev: 'head' },
              { lvl: 1, txt: '├─ 📦 공정 L2-삽입 · 지연 예상',                sev: 'red',   meta: '2h 부족' },
              { lvl: 2, txt: '│    ├─ 📉 자재 재고 부족: Wafer 6inch',         sev: 'red',   meta: '−145 EA' },
              { lvl: 2, txt: '│    └─ ⛓ SO-2026-017 연쇄 지연',               sev: 'red',   meta: '+2일' },
              { lvl: 1, txt: '├─ ⏰ 자재 조달 리드타임 +2일',                 sev: 'amber', meta: '삼성전기' },
              { lvl: 2, txt: '│    └─ 🔄 대체 자재 검토 권장',                 sev: 'amber', meta: 'Sub-A1' },
              { lvl: 1, txt: '├─ 📋 후속 PO-2026-0043 ~ 0051',                sev: 'amber', meta: '9건 재계산' },
              { lvl: 1, txt: '└─ ✅ 창고 출고 스케줄 자동 조정                  ', sev: 'green', meta: 'auto' },
            ].map((n, i) => {
              const colorMap = { head: DC.text, red: DC.red, amber: DC.amber, green: DC.green };
              const color = colorMap[n.sev];
              const bgMap = { red: `${DC.red}11`, amber: `${DC.amber}11`, green: `${DC.green}11`, head: DC.surface3 };
              return (
                <Box key={i} sx={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  bgcolor: bgMap[n.sev], borderRadius: 0.15, px: 0.25, py: 0.15, mb: 0.1,
                  fontSize: 5, color, fontFamily: 'monospace',
                  fontWeight: n.sev === 'head' ? 700 : (n.sev === 'red' ? 700 : 400),
                }}>
                  <Box sx={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.txt}</Box>
                  {n.meta && <Box sx={{ flexShrink: 0, fontSize: 4.5, color }}>{n.meta}</Box>}
                </Box>
              );
            })}
          </CBCard>
        </Box>
      </Box>
    </CBWrap>
  ),

  // ---- PE_10 % 비율 슬라이더 ----
  pe_ratio_slider: () => (
    <CBWrap header={<CBHead title="⑩ % 비율 슬라이더 보정"
                           titleColor={DC.cyan}
                           right={<Box sx={{ display: 'flex', gap: 0.25 }}>
                             <CBBtn label="⟳ 초기화" color={DC.text2} />
                             <CBBtn label="보정 적용" color={DC.blue} solid />
                           </Box>} />}>
      {CBRow(
        <CBCard title="품목군별 조정 비율 (%)">
          {[
            { grp: 'A군 · 메인보드류',   pct: 65, delta: '+10%', color: DC.green },
            { grp: 'B군 · LCD 패널류',   pct: 40, delta: '-5%',  color: DC.red   },
            { grp: 'C군 · MCU/IC류',     pct: 50, delta: '±0%',  color: DC.text2 },
            { grp: 'D군 · PCB 어셈블리', pct: 75, delta: '+15%', color: DC.green },
            { grp: 'E군 · 하우징 플라',   pct: 55, delta: '+5%',  color: DC.green },
            { grp: 'F군 · 케이블·배터리', pct: 45, delta: '-8%',  color: DC.red   },
          ].map((r, i) => (
            <Box key={i} sx={{ mb: 0.25 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 5, mb: 0.1 }}>
                <Box sx={{ color: DC.text, fontWeight: 600 }}>{r.grp}</Box>
                <Box sx={{ color: r.color, fontWeight: 700, fontFamily: 'monospace' }}>{r.delta}</Box>
              </Box>
              <Box sx={{ height: 3, bgcolor: DC.surface3, borderRadius: 2, position: 'relative' }}>
                {/* Zero mark */}
                <Box sx={{ position: 'absolute', left: '50%', top: -1, bottom: -1, width: 1, bgcolor: DC.border2 }} />
                <Box sx={{ position: 'absolute', left: `${Math.min(r.pct, 50)}%`, top: 0, bottom: 0,
                           width: `${Math.abs(r.pct - 50)}%`, bgcolor: r.color, borderRadius: 2 }} />
                <Box sx={{ position: 'absolute', left: `${r.pct}%`, top: -1.5, width: 6, height: 6,
                           bgcolor: r.color, borderRadius: '50%', boxShadow: `0 0 4px ${r.color}` }} />
              </Box>
            </Box>
          ))}
        </CBCard>,
        <CBCard title="미리보기 (적용 후)">
          <CBTable
            cols={['품목군', '기존 수량', '보정 후', '증감', '%']}
            colFlex={[1.4, 1, 1, 0.9, 0.7]}
            rows={[
              ['A군',  { v: '12,500', align: 'right', mono: true }, { v: '13,750', align: 'right', mono: true, color: DC.green, bold: true }, { v: '+1,250', align: 'right', mono: true, color: DC.green }, { v: '+10%', align: 'right', mono: true, color: DC.green }],
              ['B군',  { v: '18,200', align: 'right', mono: true }, { v: '17,290', align: 'right', mono: true, color: DC.red,   bold: true }, { v: '-910',   align: 'right', mono: true, color: DC.red   }, { v: '-5%',  align: 'right', mono: true, color: DC.red }],
              ['C군',  { v: ' 8,400', align: 'right', mono: true }, { v: ' 8,400', align: 'right', mono: true },                              { v: '±0',    align: 'right', mono: true, color: DC.text3 }, { v: '±0%',  align: 'right', mono: true, color: DC.text3 }],
              ['D군',  { v: ' 6,800', align: 'right', mono: true }, { v: ' 7,820', align: 'right', mono: true, color: DC.green, bold: true }, { v: '+1,020', align: 'right', mono: true, color: DC.green }, { v: '+15%', align: 'right', mono: true, color: DC.green }],
              ['E군',  { v: ' 9,500', align: 'right', mono: true }, { v: ' 9,975', align: 'right', mono: true, color: DC.green, bold: true }, { v: '+475',   align: 'right', mono: true, color: DC.green }, { v: '+5%',  align: 'right', mono: true, color: DC.green }],
              ['F군',  { v: ' 5,200', align: 'right', mono: true }, { v: ' 4,784', align: 'right', mono: true, color: DC.red,   bold: true }, { v: '-416',   align: 'right', mono: true, color: DC.red   }, { v: '-8%',  align: 'right', mono: true, color: DC.red }],
              [{ v: '합계', color: DC.text, bold: true }, { v: '60,600', align: 'right', mono: true, bold: true }, { v: '62,019', align: 'right', mono: true, color: DC.cyan, bold: true }, { v: '+1,419', align: 'right', mono: true, color: DC.green, bold: true }, { v: '+2.3%', align: 'right', mono: true, color: DC.green, bold: true }],
            ]}
            rowBg={[`${DC.green}11`, `${DC.red}11`, 'transparent', `${DC.green}11`, `${DC.green}11`, `${DC.red}11`, DC.surface3]}
          />
        </CBCard>
      )}
    </CBWrap>
  ),

  // ---- PE_11 복수 발주 인라인 편집 ----
  pe_bulk_inline_edit: () => (
    <CBWrap header={
      <CBHead
        title="⑪ 복수 발주 동시 보정 (인라인 편집)"
        titleColor={DC.amber}
        right={
          <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'center' }}>
            <CBBadge label="5건 선택" color={DC.amber} />
            <CBBtn label="전체선택" color={DC.text2} />
            <CBBtn label="일괄편집" color={DC.amber} />
            <CBBtn label="💾 저장" color={DC.blue} solid />
          </Box>
        }
      />}>
      {/* Bulk edit bar */}
      <Box sx={{ bgcolor: DC.surface, border: `1px solid ${DC.amber}55`, borderRadius: 0.3,
                 p: 0.25, display: 'flex', gap: 0.3, alignItems: 'center', flexShrink: 0, mb: 0.2 }}>
        <Box sx={{ fontSize: 5, color: DC.amber, fontWeight: 700 }}>🔸 일괄 편집</Box>
        <Box sx={{ flex: 1, display: 'flex', gap: 0.2 }}>
          <CBInput value="+ 일수 (예: +3)" />
          <CBInput value="± % (예: +10)" />
          <CBInput value="우선순위: HI ▾" />
          <CBInput value="상태: 승인 ▾" />
        </Box>
        <CBBtn label="적용" color={DC.amber} solid />
      </Box>
      <CBTable
        cols={['☑', '발주번호', '품목명', '납기일', '계획수량', '우선순위', '상태', '담당자']}
        colFlex={[0.3, 1.3, 1.4, 0.9, 0.9, 0.9, 0.9, 1]}
        rows={[
          ['☑', { v: 'PO-2026-0001', mono: true, color: DC.blue }, '메인보드 A형',      { v: '11/15', mono: true }, { v: '3,200', align: 'right', mono: true }, cbBadgeCell('HI',  DC.red),    cbBadgeCell('승인', DC.green),  '김철수'],
          ['☑', { v: 'PO-2026-0002', mono: true, color: DC.blue }, 'LCD 패널 32"',       { v: '11/16', mono: true }, { v: '4,100', align: 'right', mono: true }, cbBadgeCell('HI',  DC.red),    cbBadgeCell('진행', DC.blue),   '이영희'],
          ['☐', { v: 'PO-2026-0003', mono: true, color: DC.blue }, 'MCU 칩 STM32',        { v: '11/17', mono: true }, { v: '1,800', align: 'right', mono: true }, cbBadgeCell('MID', DC.amber),  cbBadgeCell('대기', DC.text2),  '박민준'],
          ['☑', { v: 'PO-2026-0004', mono: true, color: DC.blue }, 'PCB 어셈블리',        { v: '11/18', mono: true }, { v: '2,450', align: 'right', mono: true }, cbBadgeCell('HI',  DC.red),    cbBadgeCell('진행', DC.blue),   '최수연'],
          ['☑', { v: 'PO-2026-0005', mono: true, color: DC.blue }, '하우징 플라스틱',     { v: '11/19', mono: true }, { v: '3,700', align: 'right', mono: true }, cbBadgeCell('MID', DC.amber),  cbBadgeCell('승인', DC.green),  '김철수'],
          ['☐', { v: 'PO-2026-0006', mono: true, color: DC.blue }, '케이블 하네스',       { v: '11/20', mono: true }, { v: '2,100', align: 'right', mono: true }, cbBadgeCell('LOW', DC.text2),  cbBadgeCell('완료', DC.green),  '이영희'],
          ['☑', { v: 'PO-2026-0007', mono: true, color: DC.blue }, '배터리 팩',           { v: '11/21', mono: true }, { v: '1,200', align: 'right', mono: true }, cbBadgeCell('MID', DC.amber),  cbBadgeCell('대기', DC.text2),  '박민준'],
          ['☐', { v: 'PO-2026-0008', mono: true, color: DC.blue }, '냉각팬 80mm',         { v: '11/22', mono: true }, { v: '2,500', align: 'right', mono: true }, cbBadgeCell('LOW', DC.text2),  cbBadgeCell('대기', DC.text2),  '최수연'],
          ['☑', { v: 'PO-2026-0009', mono: true, color: DC.blue }, '전원공급장치',        { v: '11/23', mono: true }, { v: '1,800', align: 'right', mono: true }, cbBadgeCell('HI',  DC.red),    cbBadgeCell('진행', DC.blue),   '김철수'],
        ]}
      />
    </CBWrap>
  ),

  // ---- PE_12 잠금 기반 재계산 ----
  pe_lock_based_edit: () => (
    <CBWrap header={
      <CBHead
        title="⑫ 잠금(Lock) / 해제 기반 선택적 보정"
        titleColor={DC.blue}
        right={
          <Box sx={{ display: 'flex', gap: 0.25 }}>
            <CBBtn label="🔒 전체 잠금" color={DC.text2} />
            <CBBtn label="🔓 전체 해제" color={DC.text2} />
            <CBBtn label="🔄 해제 재계산" color={DC.blue} solid />
          </Box>
        }
      />}>
      {CBRow(
        <CBCard title={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Box>발주 잠금 관리</Box>
            <CBBadge label="잠금 4 / 해제 5" color={DC.text2} />
          </Box>
        }>
          {[
            { po: 'PO-2026-0001', item: '메인보드 A형',    lock: true,  reason: '결재 완료' },
            { po: 'PO-2026-0002', item: 'LCD 패널 32"',     lock: false, reason: '' },
            { po: 'PO-2026-0003', item: 'MCU 칩 STM32',      lock: true,  reason: '양산 확정' },
            { po: 'PO-2026-0004', item: 'PCB 어셈블리',      lock: false, reason: '' },
            { po: 'PO-2026-0005', item: '하우징 플라',       lock: true,  reason: '긴급 오더' },
            { po: 'PO-2026-0006', item: '케이블 하네스',     lock: false, reason: '' },
            { po: 'PO-2026-0007', item: '배터리 팩',         lock: false, reason: '' },
            { po: 'PO-2026-0008', item: '냉각팬 80mm',       lock: true,  reason: '외주 확정' },
            { po: 'PO-2026-0009', item: '전원공급장치',      lock: false, reason: '' },
          ].map((r, i) => (
            <Box key={i} sx={{
              display: 'flex', alignItems: 'center', gap: 0.25,
              bgcolor: r.lock ? `${DC.amber}15` : DC.surface3,
              border: r.lock ? `1px solid ${DC.amber}33` : `1px solid ${DC.border}`,
              borderRadius: 0.2, px: 0.25, py: 0.15, mb: 0.1,
            }}>
              <Box sx={{ fontSize: 8 }}>{r.lock ? '🔒' : '🔓'}</Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ fontSize: 4.5, color: DC.blue, fontFamily: 'monospace' }}>{r.po}</Box>
                <Box sx={{ fontSize: 5, color: DC.text, fontWeight: 600,
                           whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.item}</Box>
              </Box>
              <Box sx={{ fontSize: 4, color: r.lock ? DC.amber : DC.text3,
                         bgcolor: r.lock ? `${DC.amber}22` : 'transparent',
                         px: 0.2, py: 0.1, borderRadius: 0.15 }}>
                {r.lock ? r.reason : '자동 재계산'}
              </Box>
            </Box>
          ))}
        </CBCard>,
        <CBCard title={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Box>재계산 결과 (해제 5건)</Box>
            <CBBadge label="변경: 5건" color={DC.green} />
          </Box>
        }>
          <CBTable
            cols={['발주번호', '기존', '재계산', '변화', '영향']}
            colFlex={[1.4, 1, 1, 0.9, 1]}
            rows={[
              [{ v: 'PO-2026-0002', mono: true, color: DC.blue }, { v: '4,100', align: 'right', mono: true }, { v: '3,850', align: 'right', mono: true, color: DC.green, bold: true }, { v: '-250', align: 'right', mono: true, color: DC.red   }, '부하↓'],
              [{ v: 'PO-2026-0004', mono: true, color: DC.blue }, { v: '2,450', align: 'right', mono: true }, { v: '2,680', align: 'right', mono: true, color: DC.green, bold: true }, { v: '+230', align: 'right', mono: true, color: DC.green }, '결품해결'],
              [{ v: 'PO-2026-0006', mono: true, color: DC.blue }, { v: '2,100', align: 'right', mono: true }, { v: '2,100', align: 'right', mono: true }, { v: '  ±0', align: 'right', mono: true, color: DC.text3 }, '변동없음'],
              [{ v: 'PO-2026-0007', mono: true, color: DC.blue }, { v: '1,200', align: 'right', mono: true }, { v: '1,380', align: 'right', mono: true, color: DC.green, bold: true }, { v: '+180', align: 'right', mono: true, color: DC.green }, '수요반영'],
              [{ v: 'PO-2026-0009', mono: true, color: DC.blue }, { v: '1,800', align: 'right', mono: true }, { v: '1,620', align: 'right', mono: true, color: DC.amber, bold: true }, { v: '-180', align: 'right', mono: true, color: DC.red   }, 'Capa조정'],
              [{ v: '합계', color: DC.text, bold: true }, { v: '11,650', align: 'right', mono: true, bold: true }, { v: '11,630', align: 'right', mono: true, color: DC.cyan, bold: true }, { v: '  -20', align: 'right', mono: true, color: DC.red, bold: true }, ''],
            ]}
            rowBg={['transparent', 'transparent', 'transparent', 'transparent', 'transparent', DC.surface3]}
          />
        </CBCard>
      )}
    </CBWrap>
  ),

  // ---- PE_13 AI Copilot ----
  pe_ai_copilot: () => (
    <CBWrap header={
      <CBHead
        title="⑬ AI 추천 보정안 (SCM Copilot)"
        titleColor={DC.purple}
        right={
          <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'center' }}>
            <CBBadge label="🤖 분석 완료" color={DC.purple} />
            <CBBtn label="⟳ 재분석" color={DC.text2} />
            <CBBtn label="최적안 적용" color={DC.purple} solid />
          </Box>
        }
      />}>
      {CBRow(
        <CBCard title="추천 보정안 (Score 순)">
          {[
            { name: 'Option A · 납기 집중',         score: 95, effect: '납기준수 +8%',    risk: '낮음', color: DC.purple, best: true },
            { name: 'Option B · 원가 최적',         score: 88, effect: '원가 -5%',         risk: '낮음', color: DC.blue,   best: false },
            { name: 'Option C · 재고 최소',         score: 82, effect: '재고 -12%',        risk: '중간', color: DC.cyan,   best: false },
            { name: 'Option D · 부하 평준화',       score: 78, effect: 'Capa 이용율 +6%',  risk: '낮음', color: DC.green,  best: false },
            { name: 'Option E · 하이브리드',        score: 73, effect: '종합 균형',         risk: '중간', color: DC.amber,  best: false },
          ].map((r, i) => (
            <Box key={i} sx={{
              bgcolor: DC.surface3, border: `1px solid ${r.color}${r.best ? '' : '33'}`,
              borderLeft: `3px solid ${r.color}`, borderRadius: 0.2,
              p: 0.25, mb: 0.2,
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ fontSize: 5.5, color: DC.text, fontWeight: 700 }}>
                  {r.best && <Box component="span" sx={{ color: DC.purple }}>★ </Box>}
                  {r.name}
                </Box>
                <Box sx={{ fontSize: 7, color: r.color, fontFamily: 'monospace', fontWeight: 700 }}>{r.score}</Box>
              </Box>
              {/* Score bar */}
              <Box sx={{ height: 2, bgcolor: DC.border, borderRadius: 0.5, my: 0.15 }}>
                <Box sx={{ width: `${r.score}%`, height: '100%', bgcolor: r.color, borderRadius: 0.5 }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 4, color: DC.text3 }}>
                <Box>효과: <Box component="span" sx={{ color: DC.green }}>{r.effect}</Box></Box>
                <Box>리스크: <Box component="span" sx={{ color: r.risk === '낮음' ? DC.green : DC.amber }}>{r.risk}</Box></Box>
              </Box>
            </Box>
          ))}
        </CBCard>,
        <CBCard title="선택 상세 (Option A)" titleColor={DC.purple} borderColor={DC.purple}>
          <Box sx={{ fontSize: 5, color: DC.text, lineHeight: '8px' }}>
            <Box sx={{ color: DC.purple, fontWeight: 700, mb: 0.2 }}>Option A · 납기 집중 전략 (Score 95)</Box>
            <Box sx={{ bgcolor: DC.surface3, p: 0.25, borderRadius: 0.2, mb: 0.2 }}>
              <Box sx={{ fontSize: 4.5, color: DC.text3 }}>Confidence: <Box component="span" sx={{ color: DC.purple, fontWeight: 700 }}>95%</Box></Box>
              <Box sx={{ fontSize: 4.5, color: DC.text3 }}>Risk Score: <Box component="span" sx={{ color: DC.green, fontWeight: 700 }}>Low (12/100)</Box></Box>
            </Box>
            <Box sx={{ color: DC.green, fontWeight: 700, mt: 0.2 }}>▲ 주요 효과</Box>
            <Box>• 납기 준수율: 89% → <Box component="span" sx={{ color: DC.green }}>97%</Box></Box>
            <Box>• 지연 오더: 38건 → <Box component="span" sx={{ color: DC.green }}>12건</Box></Box>
            <Box>• 재작업률: -22%</Box>
            <Box sx={{ color: DC.amber, fontWeight: 700, mt: 0.2 }}>▼ 주요 영향</Box>
            <Box>• 재고 금액: 1.2M → 1.4M (+17%)</Box>
            <Box>• 외주 비용: +3,200만원</Box>
            <Box sx={{ color: DC.cyan, fontWeight: 700, mt: 0.2 }}>📋 실행 액션</Box>
            <Box>1. PO-0042~0051 납기 +3일 이동</Box>
            <Box>2. L3→L4 작업 2건 재배치</Box>
            <Box>3. B공장 이관 3건</Box>
          </Box>
        </CBCard>
      )}
    </CBWrap>
  ),

  // ---- PE_14 이력 + 롤백 ----
  pe_history_rollback: () => (
    <CBWrap header={<CBHead title="⑭ 보정 이력 조회 & 버전 롤백"
                           titleColor={DC.amber}
                           right={<CBBtn label="⟳ 선택 버전 롤백" color={DC.amber} solid />} />}>
      <Box sx={{ flex: 1, display: 'flex', gap: 0.3, minHeight: 0 }}>
        {/* Timeline */}
        <Box sx={{ width: 110 }}>
          <CBCard title="보정 타임라인">
            <Box sx={{ position: 'relative', pl: 0.3 }}>
              {/* Vertical line */}
              <Box sx={{ position: 'absolute', left: 5, top: 3, bottom: 3, width: 0.5, bgcolor: DC.border2 }} />
              {[
                { v: 'v1.6',  at: '14:30', user: '김철수', msg: 'PE-04 수량 일괄 +5%',    sel: false, color: DC.text },
                { v: 'v1.5',  at: '13:52', user: '이영희', msg: '시나리오 B 적용',         sel: false, color: DC.green },
                { v: 'v1.4',  at: '13:15', user: '이영희', msg: 'AI Option A 채택',        sel: true,  color: DC.amber },
                { v: 'v1.3',  at: '12:05', user: '박민준', msg: 'PO-0042 납기 +3일',       sel: false, color: DC.blue },
                { v: 'v1.2',  at: '11:22', user: '최수연', msg: 'Alt-Part 스왑 5건',       sel: false, color: DC.cyan },
                { v: 'v1.1',  at: '11:00', user: '박민준', msg: 'Capa L2 95% 조정',        sel: false, color: DC.text },
                { v: 'v1.0',  at: '09:00', user: 'system', msg: '엔진 초기 산출',          sel: false, color: DC.text3 },
              ].map((h, i) => (
                <Box key={i} sx={{
                  position: 'relative',
                  bgcolor: h.sel ? `${DC.amber}22` : 'transparent',
                  border: h.sel ? `1px solid ${DC.amber}55` : 'none',
                  borderRadius: 0.2, px: 0.3, py: 0.15, mb: 0.1, ml: 0.5,
                }}>
                  <Box sx={{ position: 'absolute', left: -6, top: 3, width: 5, height: 5,
                             borderRadius: '50%', bgcolor: h.color,
                             boxShadow: h.sel ? `0 0 4px ${DC.amber}` : 'none' }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 5 }}>
                    <Box sx={{ color: DC.text, fontFamily: 'monospace', fontWeight: 700 }}>{h.v}</Box>
                    <Box sx={{ color: DC.text3 }}>{h.at}</Box>
                  </Box>
                  <Box sx={{ fontSize: 4.5, color: DC.text3 }}>by {h.user}</Box>
                  <Box sx={{ fontSize: 4.5, color: h.color,
                             whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.msg}</Box>
                </Box>
              ))}
            </Box>
          </CBCard>
        </Box>
        {/* Detail */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <CBCard title="버전 상세 (v1.4 · AI Option A 채택)" titleColor={DC.amber} borderColor={DC.amber}>
            <CBTable
              cols={['발주번호', '구분', '변경 전', '변경 후', '변화', '사유']}
              colFlex={[1.4, 0.7, 1, 1, 0.9, 1.3]}
              rows={[
                [{ v: 'PO-2026-0042', mono: true, color: DC.blue }, cbBadgeCell('납기', DC.cyan),    { v: '11/15', mono: true }, { v: '11/18', mono: true, color: DC.amber, bold: true }, { v: '+3일', align: 'right', mono: true, color: DC.red }, 'Capa 부족'],
                [{ v: 'PO-2026-0045', mono: true, color: DC.blue }, cbBadgeCell('수량', DC.purple),  { v: '2,100', align: 'right', mono: true }, { v: '2,450', align: 'right', mono: true, color: DC.green, bold: true }, { v: '+350', align: 'right', mono: true, color: DC.green }, '결품 해결'],
                [{ v: 'PO-2026-0048', mono: true, color: DC.blue }, cbBadgeCell('라인', DC.amber),   { v: 'L3',    mono: true }, { v: 'L4',    mono: true, color: DC.amber, bold: true }, { v: '이동',  align: 'right', mono: true, color: DC.amber }, 'L3 부하↓'],
                [{ v: 'PO-2026-0051', mono: true, color: DC.blue }, cbBadgeCell('수량', DC.purple),  { v: '1,800', align: 'right', mono: true }, { v: '1,620', align: 'right', mono: true, color: DC.red,   bold: true }, { v: '-180', align: 'right', mono: true, color: DC.red }, 'Capa 조정'],
                [{ v: 'PO-2026-0055', mono: true, color: DC.blue }, cbBadgeCell('공장', DC.green),    { v: 'A공장',  mono: true }, { v: 'B공장',  mono: true, color: DC.green, bold: true }, { v: '이관',  align: 'right', mono: true, color: DC.green }, '외주 필요'],
                [{ v: 'PO-2026-0058', mono: true, color: DC.blue }, cbBadgeCell('납기', DC.cyan),    { v: '11/20', mono: true }, { v: '11/17', mono: true, color: DC.green, bold: true }, { v: '-3일', align: 'right', mono: true, color: DC.green }, '선행 가능'],
                [{ v: 'PO-2026-0062', mono: true, color: DC.blue }, cbBadgeCell('수량', DC.purple),  { v: '  900', align: 'right', mono: true }, { v: '1,050', align: 'right', mono: true, color: DC.green, bold: true }, { v: '+150', align: 'right', mono: true, color: DC.green }, '수요 반영'],
              ]}
            />
          </CBCard>
        </Box>
      </Box>
    </CBWrap>
  ),

  // ---- PE_15 KPI 대시보드 요약 ----
  pe_kpi_summary: () => (
    <CBWrap header={
      <CBHead
        title="⑮ 보정 후 KPI 대시보드 요약"
        titleColor={DC.green}
        right={
          <Box sx={{ display: 'flex', gap: 0.25 }}>
            <CBBtn label="⟳ 재계산" color={DC.text2} />
            <CBBtn label="✅ 최종 확정" color={DC.green} solid />
          </Box>
        }
      />}>
      {/* KPI Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.25, flexShrink: 0, mb: 0.25 }}>
        {[
          { l: '납기 준수율',   v: '96.4%', as: '89.2%',   d: '+7.2%p', color: DC.green,  icon: '📈' },
          { l: '재고 금액',     v: '1.10M', as: '1.45M',   d: '-24%',   color: DC.green,  icon: '📉' },
          { l: '지연 오더',      v: '12',    as: '38',      d: '-26',    color: DC.green,  icon: '⚡' },
          { l: '설비 가동률',   v: '88%',   as: '72%',     d: '+16%p',  color: DC.purple, icon: '⚙' },
        ].map((k, i) => (
          <Box key={i} sx={{ bgcolor: DC.surface, border: `1px solid ${k.color}44`, borderRadius: 0.3,
                             p: 0.3, display: 'flex', flexDirection: 'column', gap: 0.1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ fontSize: 5, color: DC.text3, fontWeight: 600 }}>{k.l}</Box>
              <Box sx={{ fontSize: 6 }}>{k.icon}</Box>
            </Box>
            <Box sx={{ fontSize: 11, color: k.color, fontWeight: 700, fontFamily: 'monospace', lineHeight: '13px' }}>{k.v}</Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 4 }}>
              <Box sx={{ color: DC.text3 }}>이전: {k.as}</Box>
              <Box sx={{ color: k.color, fontWeight: 700 }}>▲ {k.d}</Box>
            </Box>
          </Box>
        ))}
      </Box>
      {CBRow(
        <CBCard title="수량 비교 (주요 PO Top 7)">
          <CBTable
            cols={['발주번호', '전', '후', '증감', '위험도']}
            colFlex={[1.4, 1, 1, 0.9, 0.9]}
            rows={[
              [{ v: 'PO-2026-0001', mono: true, color: DC.blue }, { v: '3,200', align: 'right', mono: true }, { v: '3,450', align: 'right', mono: true, color: DC.green, bold: true }, { v: '+250', align: 'right', mono: true, color: DC.green }, cbBadgeCell('Low',  DC.green)],
              [{ v: 'PO-2026-0002', mono: true, color: DC.blue }, { v: '4,100', align: 'right', mono: true }, { v: '3,800', align: 'right', mono: true, color: DC.red,   bold: true }, { v: '-300', align: 'right', mono: true, color: DC.red   }, cbBadgeCell('Mid',  DC.amber)],
              [{ v: 'PO-2026-0004', mono: true, color: DC.blue }, { v: '  —',   align: 'right', mono: true, color: DC.text3 }, { v: '2,450', align: 'right', mono: true, color: DC.green, bold: true }, { v: 'NEW',  align: 'right', mono: true, color: DC.green }, cbBadgeCell('Low',  DC.green)],
              [{ v: 'PO-2026-0005', mono: true, color: DC.blue }, { v: '3,700', align: 'right', mono: true }, { v: '3,950', align: 'right', mono: true, color: DC.green, bold: true }, { v: '+250', align: 'right', mono: true, color: DC.green }, cbBadgeCell('Low',  DC.green)],
              [{ v: 'PO-2026-0042', mono: true, color: DC.blue }, { v: '2,500', align: 'right', mono: true }, { v: '2,500', align: 'right', mono: true },                              { v: '  ±0', align: 'right', mono: true, color: DC.text3 }, cbBadgeCell('High', DC.red)],
              [{ v: 'PO-2026-0051', mono: true, color: DC.blue }, { v: '1,800', align: 'right', mono: true }, { v: '1,620', align: 'right', mono: true, color: DC.red,   bold: true }, { v: '-180', align: 'right', mono: true, color: DC.red   }, cbBadgeCell('Mid',  DC.amber)],
              [{ v: 'PO-2026-0062', mono: true, color: DC.blue }, { v: '  900', align: 'right', mono: true }, { v: '1,050', align: 'right', mono: true, color: DC.green, bold: true }, { v: '+150', align: 'right', mono: true, color: DC.green }, cbBadgeCell('Low',  DC.green)],
            ]}
          />
        </CBCard>,
        <CBCard title="일별 부하 Heatmap (30일)">
          {/* Day labels */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 0.1, mb: 0.15 }}>
            {['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10'].map((w, i) => (
              <Box key={i} sx={{ fontSize: 3.5, color: DC.text3, textAlign: 'center', fontFamily: 'monospace' }}>{w}</Box>
            ))}
          </Box>
          {/* Heatmap */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 0.1, flex: 1 }}>
            {Array.from({ length: 30 }).map((_, i) => {
              const lv = (i * 37 + 3) % 5;
              const bgs = [DC.surface3, `${DC.green}66`, `${DC.green}`, `${DC.amber}aa`, DC.red];
              return (
                <Box key={i} sx={{
                  bgcolor: bgs[lv], borderRadius: 0.15, minHeight: 10,
                  border: `1px solid ${DC.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 3, color: lv >= 3 ? '#fff' : DC.text3, fontFamily: 'monospace', fontWeight: 700,
                }}>
                  {40 + lv * 15}
                </Box>
              );
            })}
          </Box>
          {/* Legend */}
          <Box sx={{ display: 'flex', gap: 0.15, mt: 0.2, justifyContent: 'center', alignItems: 'center' }}>
            <Box sx={{ fontSize: 4, color: DC.text3 }}>부하</Box>
            {[{ l: '낮음', c: `${DC.green}66` }, { l: '보통', c: DC.green }, { l: '높음', c: `${DC.amber}aa` }, { l: '과부하', c: DC.red }].map((s, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.1 }}>
                <Box sx={{ width: 6, height: 3, bgcolor: s.c, borderRadius: 0.1 }} />
                <Box sx={{ fontSize: 4, color: DC.text3 }}>{s.l}</Box>
              </Box>
            ))}
          </Box>
        </CBCard>
      )}
    </CBWrap>
  ),

  // ---- PE_16 우선순위 랭킹 ----
  pe_rank_reschedule: () => (
    <CBWrap header={<CBHead title="⑯ 우선순위 큐 랭킹 보정 (Rank-based)"
                           titleColor={DC.teal || DC.green}
                           right={<Box sx={{ display: 'flex', gap: 0.25 }}>
                             <CBBtn label="⟳ 초기화" color={DC.text2} />
                             <CBBtn label="순위 기반 확정" color={DC.blue} solid />
                           </Box>} />}>
      <Box sx={{ flex: 1, display: 'flex', gap: 0.3, minHeight: 0 }}>
        {/* Rank list */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <CBCard title="우선순위 목록 (Drag to Reorder)">
            {[
              { rank: 1, po: 'PO-2026-0042', item: '메인보드 A형',    priority: 'HI',  start: '11/09', due: '11/13', delay: 0 },
              { rank: 2, po: 'PO-2026-0051', item: 'LCD 패널 32"',     priority: 'HI',  start: '11/10', due: '11/14', delay: 0 },
              { rank: 3, po: 'PO-2026-0017', item: 'MCU 칩 STM32',      priority: 'HI',  start: '11/11', due: '11/16', delay: 0 },
              { rank: 4, po: 'PO-2026-0089', item: 'PCB 어셈블리',      priority: 'MID', start: '11/13', due: '11/17', delay: 0 },
              { rank: 5, po: 'PO-2026-0124', item: '하우징 플라',       priority: 'MID', start: '11/14', due: '11/18', delay: 0 },
              { rank: 6, po: 'PO-2026-0155', item: '케이블 하네스',     priority: 'MID', start: '11/16', due: '11/20', delay: 1 },
              { rank: 7, po: 'PO-2026-0198', item: '배터리 팩',         priority: 'LOW', start: '11/18', due: '11/22', delay: 2 },
              { rank: 8, po: 'PO-2026-0220', item: '냉각팬 80mm',       priority: 'LOW', start: '11/20', due: '11/25', delay: 3 },
            ].map((r, i) => (
              <Box key={i} sx={{
                display: 'flex', alignItems: 'center', gap: 0.3,
                bgcolor: DC.surface3, border: `1px solid ${DC.border}`,
                borderLeft: `3px solid ${r.priority === 'HI' ? DC.red : r.priority === 'MID' ? DC.amber : DC.text2}`,
                borderRadius: 0.2, px: 0.3, py: 0.2, mb: 0.15,
              }}>
                <Box sx={{ fontSize: 6, color: DC.text3, fontFamily: 'monospace', width: 6 }}>⋮⋮</Box>
                <Box sx={{ width: 10, fontSize: 7, color: DC.blue, fontWeight: 700, fontFamily: 'monospace' }}>#{r.rank}</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ fontSize: 5, color: DC.blue, fontFamily: 'monospace' }}>{r.po}</Box>
                  <Box sx={{ fontSize: 5, color: DC.text, fontWeight: 600,
                             whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.item}</Box>
                </Box>
                <Box sx={{ fontSize: 4.5, color: DC.text3, fontFamily: 'monospace' }}>
                  <Box>Start <Box component="span" sx={{ color: DC.text }}>{r.start}</Box></Box>
                  <Box>Due <Box component="span" sx={{ color: DC.text }}>{r.due}</Box></Box>
                </Box>
                <CBBadge label={r.priority} color={r.priority === 'HI' ? DC.red : r.priority === 'MID' ? DC.amber : DC.text2} />
                {r.delay > 0 ? (
                  <CBBadge label={`+${r.delay}d`} color={DC.red} />
                ) : (
                  <CBBadge label="OK" color={DC.green} />
                )}
              </Box>
            ))}
          </CBCard>
        </Box>
        {/* Summary */}
        <Box sx={{ width: 75 }}>
          <CBCard title="자동 계산 요약">
            <Box sx={{ bgcolor: `${DC.amber}22`, border: `1px solid ${DC.amber}55`,
                       borderRadius: 0.2, p: 0.25, mb: 0.3 }}>
              <Box sx={{ fontSize: 5, color: DC.amber, fontWeight: 700 }}>💡 드래그로 순위를 변경</Box>
              <Box sx={{ fontSize: 4, color: DC.text3, mt: 0.1 }}>순위 상승 시 착수일이 앞당겨집니다</Box>
            </Box>
            <Box sx={{ mb: 0.25 }}>
              <Box sx={{ fontSize: 4.5, color: DC.text3 }}>대기 오더</Box>
              <Box sx={{ fontSize: 10, color: DC.blue, fontFamily: 'monospace', fontWeight: 700 }}>12건</Box>
            </Box>
            <Box sx={{ mb: 0.25 }}>
              <Box sx={{ fontSize: 4.5, color: DC.text3 }}>납기 지연 예상</Box>
              <Box sx={{ fontSize: 10, color: DC.red, fontFamily: 'monospace', fontWeight: 700 }}>3건</Box>
            </Box>
            <Box sx={{ mb: 0.25 }}>
              <Box sx={{ fontSize: 4.5, color: DC.text3 }}>총 소요 시간</Box>
              <Box sx={{ fontSize: 7, color: DC.cyan, fontFamily: 'monospace', fontWeight: 700 }}>18.5일</Box>
            </Box>
            <Box>
              <Box sx={{ fontSize: 4.5, color: DC.text3 }}>평균 리드타임</Box>
              <Box sx={{ fontSize: 7, color: DC.purple, fontFamily: 'monospace', fontWeight: 700 }}>6.2일</Box>
            </Box>
          </CBCard>
        </Box>
      </Box>
    </CBWrap>
  ),

  // ---- PE_17 Alt-Part 스왑 ----
  pe_altpart_swap: () => (
    <CBWrap header={<CBHead title="⑰ 대체 자재 스왑 보정 (Alt-Part Substitution)"
                           titleColor={DC.green}
                           right={<CBBtn label="✓ 스왑 반영" color={DC.green} solid />} />}>
      <CBTable
        cols={['발주번호', '생산품목', '결품 자재', '필요 수량', '현재 재고', '상태', '대체 자재 후보', '효과']}
        colFlex={[1.3, 1.3, 1.2, 0.9, 0.9, 0.9, 1.7, 0.9]}
        rows={[
          [{ v: 'PO-2026-0042', mono: true, color: DC.blue }, '메인보드 A형',    { v: 'WFR-6IN-S', mono: true }, { v: '  320', align: 'right', mono: true }, { v: '  145', align: 'right', mono: true, color: DC.red }, cbBadgeCell('결품', DC.red),    { v: '▾ WFR-6IN-T (유사)',  color: DC.green }, cbBadgeCell('해결', DC.green)],
          [{ v: 'PO-2026-0051', mono: true, color: DC.blue }, 'LCD 패널 32"',     { v: 'PNL-32-BL', mono: true }, { v: '  180', align: 'right', mono: true }, { v: '   60', align: 'right', mono: true, color: DC.red }, cbBadgeCell('결품', DC.red),    { v: '▾ PNL-32-BG (대체)',   color: DC.green }, cbBadgeCell('해결', DC.green)],
          [{ v: 'PO-2026-0088', mono: true, color: DC.blue }, 'MCU 칩 STM32',      { v: 'STM32F4',   mono: true }, { v: '1,200', align: 'right', mono: true }, { v: '    0', align: 'right', mono: true, color: DC.red }, cbBadgeCell('결품', DC.red),    { v: '▾ 대체 불가',            color: DC.text3 }, cbBadgeCell('보류', DC.amber)],
          [{ v: 'PO-2026-0103', mono: true, color: DC.blue }, 'PCB 어셈블리',      { v: 'PCB-4L',    mono: true }, { v: '  850', align: 'right', mono: true }, { v: '  420', align: 'right', mono: true, color: DC.amber }, cbBadgeCell('부족', DC.amber), { v: '▾ PCB-4L-V2 (신버전)', color: DC.green }, cbBadgeCell('해결', DC.green)],
          [{ v: 'PO-2026-0127', mono: true, color: DC.blue }, '하우징 플라스틱',   { v: 'HSG-PC',    mono: true }, { v: '  620', align: 'right', mono: true }, { v: '  580', align: 'right', mono: true, color: DC.amber }, cbBadgeCell('부족', DC.amber), { v: '▾ HSG-ABS (원가↑)',    color: DC.amber }, cbBadgeCell('검토', DC.cyan)],
          [{ v: 'PO-2026-0155', mono: true, color: DC.blue }, '케이블 하네스',     { v: 'CBL-24AWG', mono: true }, { v: '  450', align: 'right', mono: true }, { v: '  450', align: 'right', mono: true },               cbBadgeCell('정상', DC.green),  { v: '—',                      color: DC.text3 }, cbBadgeCell('N/A',  DC.text3)],
          [{ v: 'PO-2026-0198', mono: true, color: DC.blue }, '배터리 팩',         { v: 'BAT-3000',  mono: true }, { v: '  310', align: 'right', mono: true }, { v: '   85', align: 'right', mono: true, color: DC.red }, cbBadgeCell('결품', DC.red),    { v: '▾ BAT-2800 (소용량)',  color: DC.amber }, cbBadgeCell('검토', DC.cyan)],
          [{ v: 'PO-2026-0220', mono: true, color: DC.blue }, '냉각팬 80mm',       { v: 'FAN-80',    mono: true }, { v: '  280', align: 'right', mono: true }, { v: '  140', align: 'right', mono: true, color: DC.amber }, cbBadgeCell('부족', DC.amber), { v: '▾ FAN-80-PWM (PWM)',   color: DC.green }, cbBadgeCell('해결', DC.green)],
        ]}
        rowBg={[`${DC.red}14`, `${DC.red}14`, `${DC.red}22`, `${DC.amber}14`, `${DC.amber}14`, 'transparent', `${DC.red}14`, `${DC.amber}14`]}
      />
    </CBWrap>
  ),

  // ---- PE_18 Heijunka Matrix ----
  pe_heijunka_matrix: () => (
    <CBWrap header={<CBHead title="⑱ 생산 평준화 보드 (Heijunka Matrix)"
                           titleColor={DC.cyan}
                           right={
                             <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'center' }}>
                               <CBBadge label="평준화 점수 82/100" color={DC.cyan} />
                               <CBBtn label="자동 평준화" color={DC.cyan} solid />
                             </Box>
                           } />}>
      {/* Kanban board */}
      <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.2, minHeight: 0 }}>
        {[
          { day: 'Mon 11/11', load: 85, color: DC.amber, cards: [
            { po: 'PO-0042', item: 'M.Board', q: 320, type: 'A' },
            { po: 'PO-0051', item: 'LCD 32"', q: 180, type: 'B' },
            { po: 'PO-0088', item: 'MCU',      q: 240, type: 'C' },
          ]},
          { day: 'Tue 11/12', load: 95, color: DC.red, cards: [
            { po: 'PO-0103', item: 'PCB',      q: 420, type: 'A' },
            { po: 'PO-0127', item: 'Housing',  q: 310, type: 'D' },
            { po: 'PO-0155', item: 'Cable',    q: 280, type: 'E' },
            { po: 'PO-0198', item: 'Battery',  q: 140, type: 'F' },
          ]},
          { day: 'Wed 11/13', load: 62, color: DC.green, cards: [
            { po: 'PO-0220', item: 'Fan',      q: 160, type: 'G' },
            { po: 'PO-0245', item: 'PSU',      q: 200, type: 'H' },
          ]},
          { day: 'Thu 11/14', load: 75, color: DC.amber, cards: [
            { po: 'PO-0260', item: 'Touch',    q: 140, type: 'I' },
            { po: 'PO-0282', item: 'Sensor',   q: 200, type: 'C' },
            { po: 'PO-0301', item: 'Speaker',  q: 180, type: 'E' },
          ]},
          { day: 'Fri 11/15', load: 40, color: DC.green, cards: [
            { po: 'PO-0320', item: 'Antenna',  q: 120, type: 'B' },
            { po: 'PO-0341', item: 'SIM',      q:  80, type: 'J' },
          ]},
        ].map((col, i) => (
          <Box key={i} sx={{ bgcolor: DC.surface2, border: `1px solid ${DC.border}`, borderRadius: 0.3,
                             display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            {/* Column header */}
            <Box sx={{ bgcolor: DC.surface3, borderBottom: `2px solid ${col.color}`,
                       px: 0.3, py: 0.2 }}>
              <Box sx={{ fontSize: 5.5, color: DC.text, fontWeight: 700, textAlign: 'center' }}>{col.day}</Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.15, mt: 0.1 }}>
                <Box sx={{ flex: 1, height: 2, bgcolor: DC.border, borderRadius: 0.3 }}>
                  <Box sx={{ width: `${Math.min(col.load, 100)}%`, height: '100%', bgcolor: col.color, borderRadius: 0.3 }} />
                </Box>
                <Box sx={{ fontSize: 4.5, color: col.color, fontFamily: 'monospace', fontWeight: 700 }}>{col.load}%</Box>
              </Box>
            </Box>
            {/* Cards */}
            <Box sx={{ flex: 1, p: 0.2, display: 'flex', flexDirection: 'column', gap: 0.15 }}>
              {col.cards.map((c, ci) => {
                const typeColors = { A: DC.blue, B: DC.green, C: DC.amber, D: DC.purple, E: DC.cyan, F: DC.red, G: DC.blue, H: DC.green, I: DC.amber, J: DC.purple };
                const tc = typeColors[c.type] || DC.blue;
                return (
                  <Box key={ci} sx={{
                    bgcolor: DC.surface, border: `1px solid ${DC.border}`,
                    borderLeft: `3px solid ${tc}`,
                    borderRadius: 0.2, p: 0.2,
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box sx={{ fontSize: 4, color: DC.blue, fontFamily: 'monospace' }}>{c.po}</Box>
                      <Box sx={{ fontSize: 3.5, color: tc, fontWeight: 700 }}>[{c.type}]</Box>
                    </Box>
                    <Box sx={{ fontSize: 4.5, color: DC.text, fontWeight: 600 }}>{c.item}</Box>
                    <Box sx={{ fontSize: 4, color: DC.text3, fontFamily: 'monospace' }}>{c.q} EA</Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}
      </Box>
    </CBWrap>
  ),

  // ---- PE_19 Setup Batching ----
  pe_setup_batching: () => (
    <CBWrap header={<CBHead title="⑲ 셋업/교체시간 최적화 배치 (Setup Batching)"
                           titleColor={DC.purple}
                           right={
                             <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'center' }}>
                               <CBBadge label="셋업시간: 180분 → 55분" color={DC.amber} />
                               <CBBtn label="✨ AI 자동 그룹핑" color={DC.purple} solid />
                             </Box>
                           } />}>
      {CBRow(
        <CBCard title={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Box>대기 Pool (미배치 오더)</Box>
            <CBBadge label="18건" color={DC.text2} />
          </Box>
        }>
          <Box sx={{ flex: 1, bgcolor: DC.surface3, border: `2px dashed ${DC.border2}`,
                     borderRadius: 0.3, p: 0.3, display: 'flex', flexWrap: 'wrap', gap: 0.2,
                     alignContent: 'flex-start', overflow: 'hidden' }}>
            {[
              { po: 'PO-0042', type: 'A', color: DC.blue, q: 320 },
              { po: 'PO-0051', type: 'A', color: DC.blue, q: 180 },
              { po: 'PO-0088', type: 'B', color: DC.green, q: 240 },
              { po: 'PO-0103', type: 'C', color: DC.amber, q: 420 },
              { po: 'PO-0127', type: 'A', color: DC.blue, q: 310 },
              { po: 'PO-0155', type: 'B', color: DC.green, q: 280 },
              { po: 'PO-0198', type: 'C', color: DC.amber, q: 140 },
              { po: 'PO-0220', type: 'A', color: DC.blue, q: 160 },
              { po: 'PO-0245', type: 'B', color: DC.green, q: 200 },
              { po: 'PO-0260', type: 'D', color: DC.purple, q: 140 },
              { po: 'PO-0282', type: 'C', color: DC.amber, q: 200 },
              { po: 'PO-0301', type: 'D', color: DC.purple, q: 180 },
            ].map((c, i) => (
              <Box key={i} sx={{
                bgcolor: DC.bg, border: `1px solid ${c.color}55`,
                borderRadius: 2, px: 0.3, py: 0.15,
                display: 'inline-flex', alignItems: 'center', gap: 0.15,
                fontSize: 4.5,
              }}>
                <Box sx={{ color: c.color, fontWeight: 700 }}>[{c.type}]</Box>
                <Box sx={{ color: DC.blue, fontFamily: 'monospace' }}>{c.po}</Box>
                <Box sx={{ color: DC.text3 }}>·{c.q}</Box>
              </Box>
            ))}
          </Box>
        </CBCard>,
        <CBCard title={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Box>생성된 배치 (Batch)</Box>
            <CBBadge label="4 batches" color={DC.purple} />
          </Box>
        }>
          {[
            { name: 'Batch 1 · Type A',  color: DC.blue,   n: 4, time: '45분', setup: '15분', list: 'PO-0042, 0051, 0127, 0220' },
            { name: 'Batch 2 · Type B',  color: DC.green,  n: 3, time: '38분', setup: '12분', list: 'PO-0088, 0155, 0245' },
            { name: 'Batch 3 · Type C',  color: DC.amber,  n: 3, time: '42분', setup: '15분', list: 'PO-0103, 0198, 0282' },
            { name: 'Batch 4 · Type D',  color: DC.purple, n: 2, time: '25분', setup: '13분', list: 'PO-0260, 0301' },
          ].map((b, i) => (
            <Box key={i} sx={{
              bgcolor: DC.surface3,
              borderLeft: `3px solid ${b.color}`,
              borderRadius: 0.2, px: 0.3, py: 0.25, mb: 0.2,
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ fontSize: 5.5, color: b.color, fontWeight: 700 }}>{b.name}</Box>
                <CBBadge label={`${b.n}건`} color={b.color} />
              </Box>
              <Box sx={{ display: 'flex', gap: 0.3, mt: 0.1, fontSize: 4, color: DC.text3 }}>
                <Box>⏱ 생산 <Box component="span" sx={{ color: DC.text, fontFamily: 'monospace' }}>{b.time}</Box></Box>
                <Box>🔧 셋업 <Box component="span" sx={{ color: DC.amber, fontFamily: 'monospace' }}>{b.setup}</Box></Box>
              </Box>
              <Box sx={{ fontSize: 4, color: DC.text3, mt: 0.1,
                         whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {b.list}
              </Box>
            </Box>
          ))}
        </CBCard>
      )}
    </CBWrap>
  ),

  // ---- PE_20 Multi-Plant Transfer ----
  pe_multi_plant_transfer: () => (
    <CBWrap header={<CBHead title="⑳ 거점/공장간 물량 이관 (Multi-Plant Transfer)"
                           titleColor={DC.blue}
                           right={
                             <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'center' }}>
                               <CBBadge label="이관: 3건 · -55%↘" color={DC.blue} />
                               <CBBtn label="이관 확정" color={DC.blue} solid />
                             </Box>
                           } />}>
      <Box sx={{ flex: 1, display: 'flex', gap: 0.3, minHeight: 0, alignItems: 'stretch' }}>
        {/* A Plant (overload) */}
        <Box sx={{ flex: 1, bgcolor: DC.surface, border: `1px solid ${DC.red}55`, borderRadius: 0.3, p: 0.3,
                   display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ fontSize: 7, fontWeight: 700, color: DC.text }}>🏭 A공장 (Busan)</Box>
            <CBBadge label="부하 115%" color={DC.red} />
          </Box>
          <Box sx={{ fontSize: 4.5, color: DC.text3 }}>용량: 8,000h/주 · 현재: 9,200h/주 (+1,200h 초과)</Box>
          <Box sx={{ height: 5, bgcolor: DC.surface3, borderRadius: 0.3, position: 'relative', overflow: 'visible' }}>
            <Box sx={{ width: '87%', height: '100%', bgcolor: DC.amber, borderRadius: 0.3 }} />
            <Box sx={{ position: 'absolute', left: '87%', top: 0, bottom: 0, width: '13%',
                       bgcolor: DC.red, border: '0.5px solid #fff', borderRadius: 0.3 }} />
            <Box sx={{ position: 'absolute', right: '13%', top: -2, bottom: -2, width: 1, bgcolor: DC.red }} />
          </Box>
          <Box sx={{ fontSize: 4, color: DC.text2, fontWeight: 700, mt: 0.2 }}>📦 오더 목록</Box>
          <Box sx={{ flex: 1, bgcolor: DC.surface3, border: `1px solid ${DC.border}`, borderRadius: 0.2,
                     p: 0.2, display: 'flex', flexDirection: 'column', gap: 0.15, minHeight: 0, overflow: 'hidden' }}>
            {[
              { po: 'PO-0042', item: '메인보드 A형',   q: 320, chk: false },
              { po: 'PO-0051', item: 'LCD 패널 32"',   q: 180, chk: true,  move: true },
              { po: 'PO-0088', item: 'MCU 칩',          q: 240, chk: false },
              { po: 'PO-0103', item: 'PCB 어셈블리',    q: 420, chk: true,  move: true },
              { po: 'PO-0127', item: '하우징 플라',     q: 310, chk: false },
              { po: 'PO-0155', item: '케이블 하네스',   q: 280, chk: true,  move: true },
              { po: 'PO-0198', item: '배터리 팩',       q: 140, chk: false },
            ].map((r, i) => (
              <Box key={i} sx={{
                display: 'flex', alignItems: 'center', gap: 0.2,
                bgcolor: r.chk ? `${DC.blue}22` : DC.surface,
                border: `1px solid ${r.chk ? DC.blue : DC.border}`,
                borderRadius: 0.15, px: 0.2, py: 0.1,
                opacity: r.move ? 0.6 : 1,
              }}>
                <Box sx={{ fontSize: 5, color: r.chk ? DC.blue : DC.text3 }}>{r.chk ? '☑' : '☐'}</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ fontSize: 4, color: DC.blue, fontFamily: 'monospace' }}>{r.po}</Box>
                  <Box sx={{ fontSize: 4, color: DC.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.item}</Box>
                </Box>
                <Box sx={{ fontSize: 4, color: DC.text3, fontFamily: 'monospace' }}>{r.q}</Box>
              </Box>
            ))}
          </Box>
        </Box>
        {/* Transfer controls */}
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0.4,
                   alignItems: 'center', flexShrink: 0 }}>
          <Box sx={{ fontSize: 4, color: DC.text3, writingMode: 'vertical-rl',
                     transform: 'rotate(180deg)', textOrientation: 'mixed' }}>이관 방향</Box>
          <Box sx={{
            bgcolor: `${DC.blue}33`, color: DC.blue, border: `2px solid ${DC.blue}`,
            borderRadius: '50%', width: 22, height: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700,
            boxShadow: `0 0 6px ${DC.blue}55`,
          }}>▶</Box>
          <Box sx={{
            bgcolor: DC.surface3, color: DC.text3, border: `1px solid ${DC.border}`,
            borderRadius: '50%', width: 18, height: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9,
          }}>◀</Box>
          <Box sx={{ fontSize: 4, color: DC.blue, fontWeight: 700, fontFamily: 'monospace' }}>3건</Box>
        </Box>
        {/* B Plant (healthy) */}
        <Box sx={{ flex: 1, bgcolor: DC.surface, border: `1px solid ${DC.green}55`, borderRadius: 0.3, p: 0.3,
                   display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ fontSize: 7, fontWeight: 700, color: DC.text }}>🏭 B공장 (Gumi)</Box>
            <CBBadge label="부하 60% → 82%" color={DC.green} />
          </Box>
          <Box sx={{ fontSize: 4.5, color: DC.text3 }}>용량: 6,000h/주 · 이관 후: 4,920h/주 (+880h)</Box>
          <Box sx={{ height: 5, bgcolor: DC.surface3, borderRadius: 0.3, position: 'relative' }}>
            <Box sx={{ width: '60%', height: '100%', bgcolor: DC.green, borderRadius: 0.3 }} />
            <Box sx={{ position: 'absolute', left: '60%', top: 0, bottom: 0, width: '22%',
                       bgcolor: `${DC.amber}aa`, borderRadius: 0.3 }} />
          </Box>
          <Box sx={{ fontSize: 4, color: DC.text2, fontWeight: 700, mt: 0.2 }}>📦 오더 목록</Box>
          <Box sx={{ flex: 1, bgcolor: DC.surface3, border: `1px solid ${DC.border}`, borderRadius: 0.2,
                     p: 0.2, display: 'flex', flexDirection: 'column', gap: 0.15, minHeight: 0, overflow: 'hidden' }}>
            {[
              { po: 'PO-0220', item: '냉각팬 80mm',   q: 160, chk: false, isNew: false },
              { po: 'PO-0245', item: '전원공급장치', q: 200, chk: false, isNew: false },
              { po: 'PO-0260', item: '터치스크린',   q: 140, chk: false, isNew: false },
              { po: 'PO-0051', item: 'LCD 패널 32"', q: 180, chk: false, isNew: true },
              { po: 'PO-0103', item: 'PCB 어셈블리', q: 420, chk: false, isNew: true },
              { po: 'PO-0155', item: '케이블 하네스', q: 280, chk: false, isNew: true },
              { po: 'PO-0282', item: '센서 모듈',     q: 200, chk: false, isNew: false },
            ].map((r, i) => (
              <Box key={i} sx={{
                display: 'flex', alignItems: 'center', gap: 0.2,
                bgcolor: r.isNew ? `${DC.green}22` : DC.surface,
                border: `1px solid ${r.isNew ? DC.green : DC.border}`,
                borderRadius: 0.15, px: 0.2, py: 0.1,
              }}>
                {r.isNew && <Box sx={{ fontSize: 4, color: DC.green, fontWeight: 700 }}>+</Box>}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ fontSize: 4, color: DC.blue, fontFamily: 'monospace' }}>{r.po}</Box>
                  <Box sx={{ fontSize: 4, color: DC.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.item}</Box>
                </Box>
                <Box sx={{ fontSize: 4, color: DC.text3, fontFamily: 'monospace' }}>{r.q}</Box>
                {r.isNew && <CBBadge label="NEW" color={DC.green} />}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </CBWrap>
  ),

});

// =====================================================================
// Monitoring 렌더러 — 다크 테마, 30개 MN_* 레이아웃
// =====================================================================

function MNKpiStrip({ items }) {
  return (
    <Box sx={{ display: 'flex', gap: 0.3, flexShrink: 0 }}>
      {items.map((k, i) => (
        <Box key={i} sx={{ flex: 1, bgcolor: DC.surface, border: `1px solid ${DC.border}`,
                           borderRadius: 0.3, p: 0.3, textAlign: 'center' }}>
          <Box sx={{ fontSize: 5, color: DC.text3 }}>{k.label}</Box>
          <Box sx={{ fontSize: 8, color: k.color, fontWeight: 700, fontFamily: 'monospace' }}>{k.value}</Box>
        </Box>
      ))}
    </Box>
  );
}

function MNSparkBars({ values, color = DC.cyan }) {
  return (
    <Box sx={{ flex: 1, bgcolor: DC.surface3, borderRadius: 0.2, display: 'flex',
               alignItems: 'flex-end', gap: 0.1, p: 0.2 }}>
      {values.map((v, i) => (
        <Box key={i} sx={{ flex: 1, height: `${v}%`, bgcolor: color, borderRadius: 0.1 }} />
      ))}
    </Box>
  );
}

Object.assign(RENDERERS, {

  // ---- MN_01 통합 KPI 대시보드 ----
  mn_kpi_dashboard: () => (
    <CBWrap header={<CBHead title="① 통합 KPI 대시보드 (Overall Dashboard)"
                           titleColor={DC.cyan}
                           right={<CBBtn label="⟳ 새로고침" color={DC.blue} />} />}>
      {/* 4 KPI Cards with delta */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.25, flexShrink: 0 }}>
        {[
          { l: '월간 총 생산 계획',  v: '124,500', u: 'EA', d: '+5.2%',    dc: DC.green, color: DC.blue },
          { l: '납기 준수 예상률',    v: '94.2',    u: '%',  d: '-0.5%p',   dc: DC.red,   color: DC.green },
          { l: '자재 결품 위험',      v: '8',       u: '건', d: '조치요망', dc: DC.amber, color: DC.red },
          { l: '평균 OEE',            v: '82.5',    u: '%',  d: '+2.1%p',   dc: DC.green, color: DC.amber },
        ].map((k, i) => (
          <Box key={i} sx={{ bgcolor: DC.surface, border: `1px solid ${DC.border}`, borderRadius: 0.3, p: 0.3 }}>
            <Box sx={{ fontSize: 4.5, color: DC.text3 }}>{k.l}</Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.2 }}>
              <Box sx={{ fontSize: 10, color: k.color, fontWeight: 700, fontFamily: 'monospace' }}>{k.v}</Box>
              <Box sx={{ fontSize: 4, color: DC.text3 }}>{k.u}</Box>
            </Box>
            <Box sx={{ fontSize: 4.5, color: k.dc, fontWeight: 700 }}>{k.d}</Box>
          </Box>
        ))}
      </Box>
      {CBRow(
        <CBCard title="월간 생산 계획 추이 (30일)">
          <Box sx={{ flex: 1, bgcolor: DC.surface3, borderRadius: 0.2, display: 'flex',
                     alignItems: 'flex-end', gap: 0.1, p: 0.25 }}>
            {[65, 70, 55, 72, 80, 68, 75, 82, 78, 85, 72, 90, 88, 76, 82, 92, 85, 78, 88, 95, 88, 82, 90, 95, 85, 78, 92, 88, 95, 90].map((h, i) => (
              <Box key={i} sx={{ flex: 1, height: `${h}%`,
                                 bgcolor: h > 90 ? DC.red : h > 80 ? DC.amber : DC.blue, borderRadius: 0.1 }} />
            ))}
          </Box>
        </CBCard>,
        <CBCard title="🚨 시스템 주요 알림 (Exceptions)" titleColor={DC.red} borderColor={DC.red}>
          {[
            { sev: 'red', msg: '자재 결품 대기',       po: 'PO-2026-0042', delay: '+3일' },
            { sev: 'red', msg: 'L3 용량 초과',          po: 'L3-Assembly',    delay: '115%' },
            { sev: 'amber', msg: '설비(CNC) 고장',     po: 'PO-2026-0088', delay: '+2일' },
            { sev: 'amber', msg: '금형 마모 교체',      po: 'T-004',          delay: '14K/15K' },
            { sev: 'amber', msg: '품질 불량 재작업',    po: 'PO-2026-0155', delay: 'RW-03' },
          ].map((a, i) => {
            const c = a.sev === 'red' ? DC.red : DC.amber;
            return (
              <Box key={i} sx={{
                bgcolor: `${c}22`, borderLeft: `2px solid ${c}`, borderRadius: 0.2,
                px: 0.3, py: 0.15, mb: 0.1, display: 'flex', alignItems: 'center', gap: 0.2,
              }}>
                <Box sx={{ fontSize: 5 }}>{a.sev === 'red' ? '🔴' : '🟡'}</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ fontSize: 4.5, color: DC.text, fontWeight: 700 }}>{a.msg}</Box>
                  <Box sx={{ fontSize: 4, color: DC.text3 }}>{a.po} · {a.delay}</Box>
                </Box>
              </Box>
            );
          })}
        </CBCard>
      )}
    </CBWrap>
  ),

  // ---- MN_02 일일 생산 지시 ----
  mn_daily_work_order: () => (
    <CBWrap header={<CBHead title="② 일일 생산 지시 현황 (Daily Status)"
                           titleColor={DC.blue}
                           right={
                             <Box sx={{ display: 'flex', gap: 0.25 }}>
                               <CBBadge label="오늘: 40건 / 가동: 18" color={DC.cyan} />
                               <CBBtn label="Excel ⬇" color={DC.text2} />
                             </Box>
                           } />}>
      <CBTable
        cols={['작업지시(WO)', '할당 라인', '품목명', '계획', '실적', '실시간 진척률', '상태']}
        colFlex={[1.3, 1.4, 1.5, 0.7, 0.7, 1.6, 0.8]}
        rows={[
          [{ v: 'WO-2604-001', mono: true, color: DC.cyan }, { v: 'L1-SMT(표면실장)', bold: true },    '고성능 메인보드 V1',     { v: '3,500', align: 'right', mono: true }, { v: '3,500', align: 'right', mono: true, color: DC.cyan, bold: true }, { v: '████████████ 100%', mono: true, color: DC.green },  cbBadgeCell('완료',  DC.green)],
          [{ v: 'WO-2604-002', mono: true, color: DC.cyan }, { v: 'L2-Wave(수삽)',    bold: true },    'OLED 디스플레이 27"',    { v: '2,800', align: 'right', mono: true }, { v: '2,520', align: 'right', mono: true, color: DC.cyan, bold: true }, { v: '██████████░░  90%', mono: true, color: DC.blue },   cbBadgeCell('가동중', DC.blue)],
          [{ v: 'WO-2604-003', mono: true, color: DC.cyan }, { v: 'L3-Assembly',       bold: true },    '마이크로컨트롤러 M4',     { v: '1,200', align: 'right', mono: true }, { v: '  600', align: 'right', mono: true, color: DC.cyan, bold: true }, { v: '█████░░░░░░░  50%', mono: true, color: DC.blue },   cbBadgeCell('가동중', DC.blue)],
          [{ v: 'WO-2604-004', mono: true, color: DC.cyan }, { v: 'L4-Inspect(검사)',  bold: true },    '하우징 프레임 (알루미늄)', { v: '  800', align: 'right', mono: true }, { v: '  280', align: 'right', mono: true, color: DC.cyan, bold: true }, { v: '███░░░░░░░░░  35%', mono: true, color: DC.amber },  cbBadgeCell('가동중', DC.blue)],
          [{ v: 'WO-2604-005', mono: true, color: DC.cyan }, { v: 'L5-Packing(포장)',  bold: true },    '배터리 팩 5000mAh',       { v: '1,500', align: 'right', mono: true }, { v: '1,500', align: 'right', mono: true, color: DC.cyan, bold: true }, { v: '████████████ 100%', mono: true, color: DC.green },  cbBadgeCell('완료',  DC.green)],
          [{ v: 'WO-2604-006', mono: true, color: DC.cyan }, { v: 'L1-SMT',            bold: true },    '전원 모듈 800W',          { v: '  950', align: 'right', mono: true }, { v: '  190', align: 'right', mono: true, color: DC.cyan, bold: true }, { v: '██░░░░░░░░░░  20%', mono: true, color: DC.amber },  cbBadgeCell('가동중', DC.blue)],
          [{ v: 'WO-2604-007', mono: true, color: DC.cyan }, { v: 'L3-Assembly',       bold: true },    '정밀 센서 어셈블리',       { v: '  600', align: 'right', mono: true }, { v: '    0', align: 'right', mono: true, color: DC.text3 },              { v: '░░░░░░░░░░░░   0%', mono: true, color: DC.text3 },   cbBadgeCell('대기',  DC.text2)],
          [{ v: 'WO-2604-008', mono: true, color: DC.cyan }, { v: 'L4-Inspect',        bold: true },    'BLDC 모터 유닛',          { v: '1,100', align: 'right', mono: true }, { v: '  770', align: 'right', mono: true, color: DC.cyan, bold: true }, { v: '████████░░░░  70%', mono: true, color: DC.blue },   cbBadgeCell('가동중', DC.blue)],
          [{ v: 'WO-2604-009', mono: true, color: DC.cyan }, { v: 'L2-Wave',           bold: true },    '고성능 메인보드 V1',       { v: '  750', align: 'right', mono: true }, { v: '    0', align: 'right', mono: true, color: DC.text3 },              { v: '░░░░░░░░░░░░   0%', mono: true, color: DC.text3 },   cbBadgeCell('대기',  DC.text2)],
        ]}
      />
    </CBWrap>
  ),

  // ---- MN_03 기간별 생산 계획 피벗 ----
  mn_pivot_plan: () => (
    <CBWrap header={<CBHead title="③ 기간별 생산 계획 피벗 (Pivot Plan)"
                           titleColor={DC.blue}
                           right={<CBBadge label="14일 · 8품목" color={DC.cyan} />} />}>
      <Box sx={{ flex: 1, bgcolor: DC.surface, border: `1px solid ${DC.border}`, borderRadius: 0.3,
                 overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', bgcolor: DC.surface3, borderBottom: `1px solid ${DC.border}`, flexShrink: 0 }}>
          <Box sx={{ width: 85, fontSize: 4.5, color: DC.text2, px: 0.3, py: 0.2, fontWeight: 700,
                     borderRight: `1px solid ${DC.border}` }}>품목 / 라인</Box>
          {Array.from({ length: 10 }).map((_, i) => (
            <Box key={i} sx={{ flex: 1, fontSize: 4, color: DC.text3, textAlign: 'center',
                               py: 0.2, fontFamily: 'monospace',
                               borderRight: i < 9 ? `1px solid ${DC.border}` : 'none' }}>
              4/{i + 1}
            </Box>
          ))}
          <Box sx={{ width: 36, fontSize: 4.5, color: DC.cyan, textAlign: 'right', px: 0.3, py: 0.2,
                     fontWeight: 700, bgcolor: DC.surface4 || DC.surface3 }}>합계</Box>
        </Box>
        {/* Rows */}
        {[
          { item: '고성능 메인보드 V1',  line: 'L1-SMT',     vals: [3200,    0, 3500, 3300, 3400,    0,    0, 3600, 3500, 3400], sum: 20900 },
          { item: 'OLED 27"',             line: 'L2-Wave',    vals: [2800, 2900,    0, 2700, 2800, 2900,    0,    0, 2850, 2800], sum: 17750 },
          { item: 'MCU M4',                line: 'L3-Assembly', vals: [1200, 1100, 1300,    0,    0, 1200, 1250,    0, 1200, 1150], sum:  9400 },
          { item: '하우징 프레임',         line: 'L4-Inspect',  vals: [ 800,  850,  800,  820,  780,    0,    0,  850,  820,  810], sum:  6530 },
          { item: '배터리 5000mAh',        line: 'L5-Packing',  vals: [1500, 1450, 1500,    0, 1550, 1520, 1480,    0,    0, 1500], sum: 10500 },
          { item: '전원 모듈 800W',        line: 'L1-SMT',     vals: [ 950,  920,    0,  980,  940,  960,    0, 1000,  950,  920], sum:  7620 },
          { item: '정밀 센서',             line: 'L3-Assembly', vals: [ 600,    0,  620,  580,    0,  610,  590,  600,    0,  620], sum:  4220 },
          { item: 'BLDC 모터',              line: 'L4-Inspect',  vals: [1100, 1080,    0, 1120, 1090,    0, 1100, 1110,    0, 1050], sum:  7650 },
        ].map((r, ri) => (
          <Box key={ri} sx={{ display: 'flex', borderBottom: `1px solid ${DC.border}` }}>
            <Box sx={{ width: 85, px: 0.3, py: 0.15, borderRight: `1px solid ${DC.border}` }}>
              <Box sx={{ fontSize: 4.5, color: DC.text, fontWeight: 600,
                         whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.item}</Box>
              <Box sx={{ fontSize: 4, color: DC.text3 }}>{r.line}</Box>
            </Box>
            {r.vals.map((v, ci) => (
              <Box key={ci} sx={{
                flex: 1, fontSize: 4.5, px: 0.2, py: 0.15, textAlign: 'right', fontFamily: 'monospace',
                color: v === 0 ? DC.text3 : DC.text,
                bgcolor: v > 3000 ? `${DC.blue}22` : v > 1500 ? `${DC.blue}11` : 'transparent',
                borderRight: ci < 9 ? `1px solid ${DC.border}` : 'none',
              }}>
                {v === 0 ? '—' : v.toLocaleString()}
              </Box>
            ))}
            <Box sx={{ width: 36, fontSize: 4.5, color: DC.cyan, textAlign: 'right', px: 0.3, py: 0.15,
                       fontWeight: 700, fontFamily: 'monospace', bgcolor: DC.surface4 || DC.surface3 }}>
              {r.sum.toLocaleString()}
            </Box>
          </Box>
        ))}
      </Box>
    </CBWrap>
  ),

  // ---- MN_04 공정별 WIP 흐름 ----
  mn_wip_flow: () => (
    <CBWrap header={<CBHead title="④ 공정별 재공/재고 흐름 (WIP Status)"
                           titleColor={DC.amber}
                           right={<CBBadge label="총 WIP: 28,450 EA" color={DC.amber} />} />}>
      {/* Funnel Strip */}
      <Box sx={{ display: 'flex', gap: 0.3, flexShrink: 0, mb: 0.2 }}>
        {[
          { stage: '자재 투입 대기',   count: 12500, color: DC.text2 },
          { stage: '조립 공정 (WIP)',   count:  8200, color: DC.blue },
          { stage: '검사 대기 (Hold)',  count:  4800, color: DC.amber },
          { stage: '포장/출하 대기',    count:  2950, color: DC.green },
        ].map((s, i) => (
          <Box key={i} sx={{ flex: 1, bgcolor: DC.surface3, borderLeft: `3px solid ${s.color}`,
                             borderRadius: 0.2, p: 0.25 }}>
            <Box sx={{ fontSize: 4.5, color: DC.text3 }}>{s.stage}</Box>
            <Box sx={{ fontSize: 8, color: s.color, fontWeight: 700, fontFamily: 'monospace' }}>
              {s.count.toLocaleString()} <Box component="span" sx={{ fontSize: 4 }}>EA</Box>
            </Box>
          </Box>
        ))}
      </Box>
      <CBTable
        cols={['발주번호', '품목', '현재 공정(위치)', '재공 수량', '체류 시간', '상태']}
        colFlex={[1.4, 1.8, 1.4, 1, 1, 1.2]}
        rows={[
          [{ v: 'PO-2026-0042', mono: true, color: DC.blue }, '고성능 메인보드 V1',  { v: 'L3-Assembly', bold: true },    { v: ' 1,820', align: 'right', mono: true }, { v: ' 6시간', align: 'right', mono: true }, cbBadgeCell('정상',           DC.green)],
          [{ v: 'PO-2026-0051', mono: true, color: DC.blue }, 'OLED 디스플레이 27"', { v: 'L4-Inspect',   bold: true },    { v: '   920', align: 'right', mono: true }, { v: '28시간', align: 'right', mono: true, color: DC.amber, bold: true }, cbBadgeCell('품질 홀딩', DC.amber)],
          [{ v: 'PO-2026-0088', mono: true, color: DC.blue }, '마이크로컨트롤러 M4',  { v: 'L1-SMT',       bold: true },    { v: ' 3,250', align: 'right', mono: true }, { v: ' 2시간', align: 'right', mono: true }, cbBadgeCell('정상',           DC.green)],
          [{ v: 'PO-2026-0103', mono: true, color: DC.blue }, '하우징 프레임',         { v: 'L5-Packing',   bold: true },    { v: '   480', align: 'right', mono: true }, { v: ' 1시간', align: 'right', mono: true }, cbBadgeCell('정상',           DC.green)],
          [{ v: 'PO-2026-0127', mono: true, color: DC.blue }, '배터리 팩 5000mAh',    { v: 'L4-Inspect',   bold: true },    { v: ' 2,140', align: 'right', mono: true }, { v: '36시간', align: 'right', mono: true, color: DC.red,   bold: true }, cbBadgeCell('불량 재작업', DC.red)],
          [{ v: 'PO-2026-0155', mono: true, color: DC.blue }, '전원 모듈 800W',       { v: 'L2-Wave',      bold: true },    { v: ' 1,250', align: 'right', mono: true }, { v: ' 4시간', align: 'right', mono: true }, cbBadgeCell('정상',           DC.green)],
          [{ v: 'PO-2026-0198', mono: true, color: DC.blue }, '정밀 센서 어셈블리',    { v: 'L3-Assembly', bold: true },    { v: '   760', align: 'right', mono: true }, { v: '32시간', align: 'right', mono: true, color: DC.amber, bold: true }, cbBadgeCell('자재 대기', DC.amber)],
          [{ v: 'PO-2026-0220', mono: true, color: DC.blue }, 'BLDC 모터 유닛',         { v: 'L4-Inspect',   bold: true },    { v: ' 1,080', align: 'right', mono: true }, { v: '12시간', align: 'right', mono: true }, cbBadgeCell('정상',           DC.green)],
        ]}
        rowBg={['transparent', `${DC.amber}14`, 'transparent', 'transparent', `${DC.red}14`, 'transparent', `${DC.amber}14`, 'transparent']}
      />
    </CBWrap>
  ),

  // ---- MN_05 납기 지연 위험 경보 ----
  mn_delay_risk: () => (
    <CBWrap header={<CBHead title="⑤ 납기 지연 위험 경보 (Delay Risk)"
                           titleColor={DC.red}
                           right={<CBBtn label="지연 리포트 ⬇" color={DC.text2} />} />}>
      {/* 2 Stat Cards */}
      <Box sx={{ display: 'flex', gap: 0.3, flexShrink: 0, mb: 0.2 }}>
        <Box sx={{ flex: 1, bgcolor: DC.surface, border: `1px solid ${DC.red}55`, borderRadius: 0.3, p: 0.3,
                   display: 'flex', alignItems: 'center', gap: 0.3 }}>
          <Box sx={{ fontSize: 20 }}>🚨</Box>
          <Box>
            <Box sx={{ fontSize: 4.5, color: DC.text3 }}>총 납기 지연 예상 금액 (Penalty Risk)</Box>
            <Box sx={{ fontSize: 10, color: DC.red, fontWeight: 700, fontFamily: 'monospace', lineHeight: '12px' }}>
              ₩ 145,200,000
            </Box>
            <Box sx={{ fontSize: 4, color: DC.text3 }}>총 12건 · 평균 +3.2일 지연</Box>
          </Box>
        </Box>
        <Box sx={{ flex: 1, bgcolor: DC.surface, border: `1px solid ${DC.border}`, borderRadius: 0.3, p: 0.3 }}>
          <Box sx={{ fontSize: 4.5, color: DC.text3, mb: 0.2 }}>지연 사유별 비율</Box>
          <Box sx={{ display: 'flex', height: 8, borderRadius: 0.2, overflow: 'hidden', mb: 0.2 }}>
            <Box sx={{ flex: 40, bgcolor: DC.red,    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 3.5, color: '#fff', fontWeight: 700 }}>결품 40%</Box>
            <Box sx={{ flex: 30, bgcolor: DC.amber,  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 3.5, color: '#000', fontWeight: 700 }}>캐파 30%</Box>
            <Box sx={{ flex: 20, bgcolor: DC.blue,   display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 3.5, color: '#fff', fontWeight: 700 }}>품질 20%</Box>
            <Box sx={{ flex: 10, bgcolor: DC.purple, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 3.5, color: '#fff', fontWeight: 700 }}>기타</Box>
          </Box>
          <Box sx={{ fontSize: 4, color: DC.text3 }}>자재 결품이 최대 원인 (40%) · AI 제안: Alt-Part 스왑</Box>
        </Box>
      </Box>
      <CBTable
        cols={['위험도', '발주번호', '고객사 / 품목', '요구일', '예상 완료', '지연', '주요 사유', '조치']}
        colFlex={[0.7, 1.3, 1.8, 0.8, 0.9, 0.7, 1.3, 0.8]}
        rows={[
          [cbBadgeCell('High', DC.red),   { v: 'PO-26-D001', mono: true }, { v: '삼성전자 / 메인보드 V1',      bold: true }, { v: '11/10', mono: true }, { v: '11/18', mono: true, color: DC.red }, { v: '+8일', align: 'right', color: DC.red, bold: true }, '자재 결품 대기',   { v: '협의', color: DC.amber }],
          [cbBadgeCell('High', DC.red),   { v: 'PO-26-D002', mono: true }, { v: 'LG전자 / OLED 27"',            bold: true }, { v: '11/15', mono: true }, { v: '11/22', mono: true, color: DC.red }, { v: '+7일', align: 'right', color: DC.red, bold: true }, '설비(CNC) 고장',     { v: '협의', color: DC.amber }],
          [cbBadgeCell('Med',  DC.amber), { v: 'PO-26-D003', mono: true }, { v: '현대모비스 / BLDC 모터',       bold: true }, { v: '11/18', mono: true }, { v: '11/23', mono: true, color: DC.amber }, { v: '+5일', align: 'right', color: DC.amber, bold: true }, '캐파 부족',         { v: '협의', color: DC.amber }],
          [cbBadgeCell('Med',  DC.amber), { v: 'PO-26-D004', mono: true }, { v: '테슬라 / 배터리 팩',           bold: true }, { v: '11/20', mono: true }, { v: '11/24', mono: true, color: DC.amber }, { v: '+4일', align: 'right', color: DC.amber, bold: true }, '품질 불량 재작업', { v: '협의', color: DC.amber }],
          [cbBadgeCell('High', DC.red),   { v: 'PO-26-D005', mono: true }, { v: '애플 / MCU M4',                bold: true }, { v: '11/22', mono: true }, { v: '12/02', mono: true, color: DC.red }, { v: '+10일', align: 'right', color: DC.red, bold: true }, '외주 입고 지연',   { v: '협의', color: DC.amber }],
          [cbBadgeCell('Low',  DC.text2), { v: 'PO-26-D006', mono: true }, { v: '삼성전자 / 정밀 센서',          bold: true }, { v: '11/25', mono: true }, { v: '11/27', mono: true, color: DC.amber }, { v: '+2일', align: 'right', color: DC.amber, bold: true }, '작업자 결근',       { v: '협의', color: DC.amber }],
          [cbBadgeCell('Med',  DC.amber), { v: 'PO-26-D007', mono: true }, { v: 'LG전자 / 하우징 프레임',        bold: true }, { v: '11/28', mono: true }, { v: '12/01', mono: true, color: DC.amber }, { v: '+3일', align: 'right', color: DC.amber, bold: true }, '금형 마모 교체',     { v: '협의', color: DC.amber }],
          [cbBadgeCell('High', DC.red),   { v: 'PO-26-D008', mono: true }, { v: '현대모비스 / 전원 모듈',        bold: true }, { v: '11/30', mono: true }, { v: '12/09', mono: true, color: DC.red }, { v: '+9일', align: 'right', color: DC.red, bold: true }, '자재 결품 대기',     { v: '협의', color: DC.amber }],
        ]}
        rowBg={[`${DC.red}14`, `${DC.red}14`, `${DC.amber}10`, `${DC.amber}10`, `${DC.red}14`, 'transparent', `${DC.amber}10`, `${DC.red}14`]}
      />
    </CBWrap>
  ),

  // ---- MN_06 계획 미수립 오더 ----
  mn_unplanned_orders: () => (
    <CBWrap header={<CBHead title="⑥ 계획 미수립 오더 (Unplanned)"
                           titleColor={DC.red}
                           right={<CBBadge label="미수립: 12건 · 평균 4.2일 체류" color={DC.amber} />} />}>
      <CBTable
        cols={['수주번호(SO)', '영업 확정일', '미수립 체류일', '고객사', '품목명', '주문 수량', '미수립 사유 (시스템 판정)']}
        colFlex={[1.2, 1.1, 1.3, 1.2, 1.6, 0.9, 2.2]}
        rows={[
          [{ v: 'SO-2026-0101', mono: true, color: DC.blue }, { v: '11/01', mono: true }, { v: '  7일', align: 'right', mono: true, color: DC.red, bold: true }, { v: '삼성전자', bold: true },    '고성능 메인보드 V1',      { v: '  500', align: 'right', mono: true }, '자재 결품 (Wafer 6inch · -320EA)'],
          [{ v: 'SO-2026-0102', mono: true, color: DC.blue }, { v: '11/03', mono: true }, { v: '  5일', align: 'right', mono: true, color: DC.red, bold: true }, { v: 'LG전자', bold: true },      'OLED 디스플레이 27"',     { v: '  280', align: 'right', mono: true }, '캐파 부족 (L2 부하 115%)'],
          [{ v: 'SO-2026-0103', mono: true, color: DC.blue }, { v: '11/04', mono: true }, { v: '  4일', align: 'right', mono: true, color: DC.amber, bold: true }, { v: '현대모비스', bold: true }, '마이크로컨트롤러 M4',      { v: '  800', align: 'right', mono: true }, '자재 LT 초과 (조달 21일)'],
          [{ v: 'SO-2026-0104', mono: true, color: DC.blue }, { v: '11/05', mono: true }, { v: '  3일', align: 'right', mono: true, color: DC.amber, bold: true }, { v: '테슬라', bold: true },      '배터리 팩 5000mAh',       { v: '1,500', align: 'right', mono: true }, '라인 전환 불가 (전용 금형)'],
          [{ v: 'SO-2026-0105', mono: true, color: DC.blue }, { v: '11/06', mono: true }, { v: '  3일', align: 'right', mono: true, color: DC.amber, bold: true }, { v: '애플', bold: true },        '정밀 센서 어셈블리',       { v: '  350', align: 'right', mono: true }, '품질 기준 미확정 (QA 대기)'],
          [{ v: 'SO-2026-0106', mono: true, color: DC.blue }, { v: '11/07', mono: true }, { v: '  2일', align: 'right', mono: true }, { v: '삼성전자', bold: true },                                'BLDC 모터 유닛',            { v: '  900', align: 'right', mono: true }, '외주 가공 확정 대기 (성일정밀)'],
          [{ v: 'SO-2026-0107', mono: true, color: DC.blue }, { v: '11/07', mono: true }, { v: '  2일', align: 'right', mono: true }, { v: 'LG전자', bold: true },                                  '하우징 프레임',             { v: '  450', align: 'right', mono: true }, '작업자 숙련도 부족 (야간조)'],
          [{ v: 'SO-2026-0108', mono: true, color: DC.blue }, { v: '11/08', mono: true }, { v: '  1일', align: 'right', mono: true }, { v: '현대모비스', bold: true },                              '전원 모듈 800W',            { v: '  200', align: 'right', mono: true }, 'ATP 계산 중 (자동 재배정 대기)'],
        ]}
        rowBg={[`${DC.red}14`, `${DC.red}14`, `${DC.amber}14`, `${DC.amber}14`, `${DC.amber}14`, 'transparent', 'transparent', 'transparent']}
      />
    </CBWrap>
  ),

  // ---- MN_07 자재 결품 예상 ----
  mn_material_shortage: () => (
    <CBWrap header={<CBHead title="⑦ 자재 결품 예상 리스트 (Shortage)"
                           titleColor={DC.red}
                           right={<CBBadge label="결품: 8건 · 총 -1,845 EA" color={DC.red} />} />}>
      <CBTable
        cols={['자재 코드', '자재 분류 / 명칭', '총 소요', '가용 재고(ATP)', '결품 수량', '주 공급사', '입고 예정일', '상태']}
        colFlex={[1.1, 1.8, 0.9, 1.1, 1, 1.3, 1.1, 0.9]}
        rows={[
          [{ v: 'WFR-6IN-S',   mono: true }, '기판 / Wafer 6inch Sapphire',  { v: ' 320', align: 'right', mono: true }, { v: '  145', align: 'right', mono: true }, { v: '-175', align: 'right', mono: true, color: DC.red, bold: true },   '삼성전기',  { v: '11/18', mono: true, color: DC.amber }, cbBadgeCell('결품', DC.red)],
          [{ v: 'PNL-32-BL',   mono: true }, '디스플레이 / OLED 32" Blue',   { v: ' 180', align: 'right', mono: true }, { v: '   60', align: 'right', mono: true }, { v: '-120', align: 'right', mono: true, color: DC.red, bold: true },   'LG이노텍',  { v: '11/22', mono: true, color: DC.red }, cbBadgeCell('결품', DC.red)],
          [{ v: 'STM32F4',     mono: true }, 'IC / ARM Cortex-M4 MCU',        { v: '1,200', align: 'right', mono: true }, { v: '    0', align: 'right', mono: true }, { v: '-1,200', align: 'right', mono: true, color: DC.red, bold: true }, '대덕전자',  { v: '11/25', mono: true, color: DC.red }, cbBadgeCell('결품', DC.red)],
          [{ v: 'PCB-4L',      mono: true }, 'PCB / 4 Layer Standard',        { v: ' 850', align: 'right', mono: true }, { v: '  420', align: 'right', mono: true }, { v: '-430', align: 'right', mono: true, color: DC.amber, bold: true }, '영풍전자',  { v: '11/14', mono: true, color: DC.amber }, cbBadgeCell('부족', DC.amber)],
          [{ v: 'HSG-PC',      mono: true }, '하우징 / Polycarbonate',         { v: ' 620', align: 'right', mono: true }, { v: '  580', align: 'right', mono: true }, { v: ' -40', align: 'right', mono: true, color: DC.amber, bold: true }, '세진반도체', { v: '11/12', mono: true, color: DC.green }, cbBadgeCell('부족', DC.amber)],
          [{ v: 'BAT-3000',    mono: true }, '배터리 셀 / Li-ion 3000mAh',     { v: ' 310', align: 'right', mono: true }, { v: '   85', align: 'right', mono: true }, { v: '-225', align: 'right', mono: true, color: DC.red, bold: true },   '삼성SDI',   { v: '11/20', mono: true, color: DC.amber }, cbBadgeCell('결품', DC.red)],
          [{ v: 'FAN-80',      mono: true }, '냉각 / 80mm PWM Fan',             { v: ' 280', align: 'right', mono: true }, { v: '  140', align: 'right', mono: true }, { v: '-140', align: 'right', mono: true, color: DC.amber, bold: true }, '영풍전자',  { v: '11/15', mono: true, color: DC.amber }, cbBadgeCell('부족', DC.amber)],
          [{ v: 'CBL-24AWG',   mono: true }, '케이블 / 24AWG 실리콘',           { v: ' 450', align: 'right', mono: true }, { v: '  450', align: 'right', mono: true }, { v: '   0', align: 'right', mono: true, color: DC.text3 },              '삼성전기',  { v: '11/11', mono: true, color: DC.green }, cbBadgeCell('정상', DC.green)],
        ]}
        rowBg={[`${DC.red}14`, `${DC.red}14`, `${DC.red}22`, `${DC.amber}14`, `${DC.amber}14`, `${DC.red}14`, `${DC.amber}14`, 'transparent']}
      />
    </CBWrap>
  ),

  // ---- MN_08 설비 과부하/병목 ----
  mn_bottleneck: () => (
    <CBWrap header={<CBHead title="⑧ 설비 과부하/병목 모니터링 (Bottleneck)"
                           titleColor={DC.red}
                           right={<CBBadge label="병목 3건 감지" color={DC.red} />} />}>
      {/* 3 Stat Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.25, flexShrink: 0, mb: 0.2 }}>
        {[
          { l: '병목 설비 수',    v: '3',     u: '건',    d: '전일 +1',    dc: DC.red,   color: DC.red,   icon: '⛔' },
          { l: 'OEE 평균',        v: '65.3',  u: '%',     d: '목표 85%',  dc: DC.amber, color: DC.amber, icon: '⚙' },
          { l: '부하율 평균',     v: '92',    u: '%',     d: '임계 95%',  dc: DC.amber, color: DC.amber, icon: '📊' },
        ].map((k, i) => (
          <Box key={i} sx={{ bgcolor: DC.surface, border: `1px solid ${k.color}44`, borderRadius: 0.3, p: 0.3,
                             display: 'flex', alignItems: 'center', gap: 0.3 }}>
            <Box sx={{ fontSize: 14 }}>{k.icon}</Box>
            <Box>
              <Box sx={{ fontSize: 4.5, color: DC.text3 }}>{k.l}</Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.2 }}>
                <Box sx={{ fontSize: 10, color: k.color, fontWeight: 700, fontFamily: 'monospace' }}>{k.v}</Box>
                <Box sx={{ fontSize: 4, color: DC.text3 }}>{k.u}</Box>
              </Box>
              <Box sx={{ fontSize: 4, color: k.dc, fontWeight: 700 }}>{k.d}</Box>
            </Box>
          </Box>
        ))}
      </Box>
      {/* Heatmap */}
      <CBCard title="설비별 일간 부하율 Heatmap (12일)">
        <Box sx={{ display: 'grid', gridTemplateColumns: '80px repeat(12, 1fr)', gap: 0.1, flex: 1 }}>
          <Box />
          {['11/1','11/2','11/3','11/4','11/5','11/6','11/7','11/8','11/9','11/10','11/11','11/12'].map((d, i) => (
            <Box key={i} sx={{ fontSize: 3.5, color: DC.text3, textAlign: 'center', fontFamily: 'monospace' }}>{d}</Box>
          ))}
          {[
            { line: 'L1-SMT',       vals: [75, 82, 78, 88, 92, 95, 85, 72, 78, 82, 88, 92] },
            { line: 'L2-Wave',      vals: [95, 98, 105, 108, 115, 95, 88, 92, 98, 105, 110, 108] },
            { line: 'L3-Assembly',  vals: [62, 68, 72, 75, 68, 65, 70, 72, 75, 78, 82, 75] },
            { line: 'L4-Inspect',   vals: [88, 92, 95, 98, 105, 110, 108, 95, 98, 102, 108, 105] },
            { line: 'L5-Packing',   vals: [55, 58, 62, 68, 65, 60, 62, 58, 55, 62, 68, 65] },
            { line: 'L6-Outbound',  vals: [72, 75, 82, 88, 85, 78, 75, 80, 82, 85, 88, 82] },
          ].map((row, ri) => (
            <React.Fragment key={ri}>
              <Box sx={{ fontSize: 4.5, color: DC.text, display: 'flex', alignItems: 'center', fontWeight: 700 }}>{row.line}</Box>
              {row.vals.map((v, ci) => {
                const bg = v > 100 ? DC.red
                  : v > 90 ? `${DC.red}aa`
                  : v > 80 ? `${DC.amber}aa`
                  : v > 60 ? `${DC.green}88`
                  : `${DC.green}44`;
                return (
                  <Box key={ci} sx={{
                    bgcolor: bg, borderRadius: 0.1, minHeight: 10,
                    border: `0.5px solid ${DC.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 3.5, color: v > 80 ? '#fff' : DC.text3, fontWeight: 700, fontFamily: 'monospace',
                  }}>{v}</Box>
                );
              })}
            </React.Fragment>
          ))}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.3, mt: 0.2, fontSize: 3.5, color: DC.text3 }}>
          <Box>부하:</Box>
          {[{ l: '낮음', c: `${DC.green}44` }, { l: '보통', c: `${DC.green}88` }, { l: '높음', c: `${DC.amber}aa` }, { l: '임박', c: `${DC.red}aa` }, { l: '초과', c: DC.red }].map((s, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.1 }}>
              <Box sx={{ width: 5, height: 3, bgcolor: s.c, borderRadius: 0.1 }} /><Box>{s.l}</Box>
            </Box>
          ))}
        </Box>
      </CBCard>
    </CBWrap>
  ),

  // ---- MN_09 계획 vs 실적 차이 ----
  mn_plan_vs_actual: () => (
    <CBWrap header={<CBHead title="⑨ 계획 vs 실적 차이 분석 (Plan vs Actual)"
                           titleColor={DC.blue}
                           right={<CBBadge label="집계 기간: 11/01~11/08" color={DC.cyan} />} />}>
      {/* 2 KPI Cards */}
      <Box sx={{ display: 'flex', gap: 0.3, flexShrink: 0, mb: 0.2 }}>
        <Box sx={{ flex: 1, bgcolor: DC.surface, border: `1px solid ${DC.blue}44`, borderRadius: 0.3, p: 0.3,
                   display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Box sx={{ fontSize: 4.5, color: DC.text3 }}>누적 계획 달성률</Box>
            <Box sx={{ fontSize: 12, color: DC.blue, fontWeight: 700, fontFamily: 'monospace', lineHeight: '14px' }}>92.8<Box component="span" sx={{ fontSize: 5 }}>%</Box></Box>
            <Box sx={{ fontSize: 4, color: DC.amber }}>목표 95% 대비 -2.2%p</Box>
          </Box>
          <Box sx={{ fontSize: 22 }}>📊</Box>
        </Box>
        <Box sx={{ flex: 1, bgcolor: DC.surface, border: `1px solid ${DC.red}44`, borderRadius: 0.3, p: 0.3,
                   display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Box sx={{ fontSize: 4.5, color: DC.text3 }}>누적 생산 차질 (Variance)</Box>
            <Box sx={{ fontSize: 12, color: DC.red, fontWeight: 700, fontFamily: 'monospace', lineHeight: '14px' }}>-12,450<Box component="span" sx={{ fontSize: 5 }}>EA</Box></Box>
            <Box sx={{ fontSize: 4, color: DC.red }}>주요 원인: L2 과부하 · 자재 결품</Box>
          </Box>
          <Box sx={{ fontSize: 22 }}>📉</Box>
        </Box>
      </Box>
      <CBTable
        cols={['일자', '생산 라인', '품목명', '계획(P)', '실적(A)', '차이(Gap)', '달성률', '주요 미달 사유']}
        colFlex={[0.8, 1.5, 1.7, 0.9, 0.9, 0.9, 0.9, 2]}
        rows={[
          [{ v: '11/01', mono: true }, { v: 'L1-SMT',      bold: true }, '고성능 메인보드 V1',  { v: '3,500', align: 'right', mono: true }, { v: '3,325', align: 'right', mono: true, color: DC.cyan, bold: true }, { v: ' -175', align: 'right', mono: true, color: DC.red },   { v: ' 95.0%', align: 'right', mono: true, color: DC.amber }, '정상 진행'],
          [{ v: '11/02', mono: true }, { v: 'L2-Wave',     bold: true }, 'OLED 디스플레이 27"', { v: '2,800', align: 'right', mono: true }, { v: '2,380', align: 'right', mono: true, color: DC.amber, bold: true }, { v: ' -420', align: 'right', mono: true, color: DC.red }, { v: ' 85.0%', align: 'right', mono: true, color: DC.red   }, '캐파 부족 (부하 115%)'],
          [{ v: 'MyLine', mono: true }, { v: 'L3-Assembly', bold: true }, '마이크로컨트롤러 M4',  { v: '1,200', align: 'right', mono: true }, { v: '1,320', align: 'right', mono: true, color: DC.green, bold: true }, { v: ' +120', align: 'right', mono: true, color: DC.green }, { v: '110.0%', align: 'right', mono: true, color: DC.green }, '초과 달성 (야간 증산)'],
          [{ v: '11/04', mono: true }, { v: 'L4-Inspect',  bold: true }, '하우징 프레임',        { v: '  800', align: 'right', mono: true }, { v: '  640', align: 'right', mono: true, color: DC.amber, bold: true }, { v: ' -160', align: 'right', mono: true, color: DC.red },   { v: ' 80.0%', align: 'right', mono: true, color: DC.red   }, '품질 불량 재작업'],
          [{ v: '11/05', mono: true }, { v: 'L5-Packing',  bold: true }, '배터리 팩 5000mAh',    { v: '1,500', align: 'right', mono: true }, { v: '1,500', align: 'right', mono: true, color: DC.green, bold: true }, { v: '    0', align: 'right', mono: true, color: DC.text3 },  { v: '100.0%', align: 'right', mono: true, color: DC.green }, '정상 진행'],
          [{ v: '11/06', mono: true }, { v: 'L1-SMT',      bold: true }, '전원 모듈 800W',       { v: '  950', align: 'right', mono: true }, { v: '  665', align: 'right', mono: true, color: DC.amber, bold: true }, { v: ' -285', align: 'right', mono: true, color: DC.red },   { v: ' 70.0%', align: 'right', mono: true, color: DC.red   }, '설비(CNC) 고장 4h'],
          [{ v: '11/07', mono: true }, { v: 'L3-Assembly', bold: true }, '정밀 센서 어셈블리',   { v: '  600', align: 'right', mono: true }, { v: '  540', align: 'right', mono: true, color: DC.cyan, bold: true }, { v: '  -60', align: 'right', mono: true, color: DC.amber },  { v: ' 90.0%', align: 'right', mono: true, color: DC.amber }, '작업자 결근 (야간조)'],
          [{ v: '11/08', mono: true }, { v: 'L4-Inspect',  bold: true }, 'BLDC 모터 유닛',        { v: '1,100', align: 'right', mono: true }, { v: '1,045', align: 'right', mono: true, color: DC.cyan, bold: true }, { v: '  -55', align: 'right', mono: true, color: DC.amber }, { v: ' 95.0%', align: 'right', mono: true, color: DC.amber }, '자재 투입 지연 30m'],
        ]}
        rowBg={['transparent', `${DC.red}14`, `${DC.green}14`, `${DC.red}14`, 'transparent', `${DC.red}14`, `${DC.amber}10`, `${DC.amber}10`]}
      />
    </CBWrap>
  ),

  // ---- MN_10 스케줄 준수율 트렌드 ----
  mn_compliance_trend: () => (
    <CBWrap header={<CBHead title="⑩ 스케줄 준수율 트렌드 (Compliance Rate)"
                           titleColor={DC.green}
                           right={<CBBadge label="12주 평균 92.4%" color={DC.green} />} />}>
      {CBRow(
        <CBCard title="최근 12주 준수율 트렌드">
          <Box sx={{ flex: 1, bgcolor: DC.surface3, borderRadius: 0.2, position: 'relative',
                     display: 'flex', alignItems: 'flex-end', gap: 0.15, p: 0.3 }}>
            {/* Target line 95% */}
            <Box sx={{ position: 'absolute', left: 3, right: 3, top: '5%', borderTop: `1px dashed ${DC.red}`, zIndex: 1 }} />
            {[88, 92, 85, 94, 90, 96, 91, 95, 93, 97, 92, 94].map((v, i) => (
              <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.1 }}>
                <Box sx={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                  <Box sx={{ width: '100%', height: `${v}%`,
                             bgcolor: v >= 95 ? DC.green : v >= 90 ? DC.cyan : DC.amber,
                             borderRadius: 0.15, position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
                               fontSize: 3.5, color: DC.text, fontWeight: 700, fontFamily: 'monospace' }}>{v}</Box>
                  </Box>
                </Box>
                <Box sx={{ fontSize: 3.5, color: DC.text3, fontFamily: 'monospace' }}>W{i + 1}</Box>
              </Box>
            ))}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.3, mt: 0.3, fontSize: 4, color: DC.text3 }}>
            <Box>━ 목표 95%</Box>
            <Box>평균: <Box component="span" sx={{ color: DC.green, fontWeight: 700, fontFamily: 'monospace' }}>92.4%</Box></Box>
            <Box>최고: <Box component="span" sx={{ color: DC.green, fontFamily: 'monospace' }}>W10 97%</Box></Box>
            <Box>최저: <Box component="span" sx={{ color: DC.red, fontFamily: 'monospace' }}>W3 85%</Box></Box>
          </Box>
        </CBCard>,
        <CBCard title="주차별 준수 상세">
          <CBTable
            cols={['주차', '대상', '일정 준수', '위반(Late)', '준수율']}
            colFlex={[0.7, 1, 1.1, 1.1, 1]}
            rows={[
              [{ v: 'W1', bold: true }, { v: ' 50', align: 'right', mono: true }, { v: '44', align: 'right', mono: true, color: DC.cyan }, { v: ' 6', align: 'right', mono: true, color: DC.red }, { v: ' 88%', align: 'right', mono: true, color: DC.amber }],
              [{ v: 'W2', bold: true }, { v: ' 52', align: 'right', mono: true }, { v: '48', align: 'right', mono: true, color: DC.cyan }, { v: ' 4', align: 'right', mono: true, color: DC.red }, { v: ' 92%', align: 'right', mono: true, color: DC.green }],
              [{ v: 'W3', bold: true }, { v: ' 48', align: 'right', mono: true }, { v: '41', align: 'right', mono: true, color: DC.cyan }, { v: ' 7', align: 'right', mono: true, color: DC.red }, { v: ' 85%', align: 'right', mono: true, color: DC.red }],
              [{ v: 'W4', bold: true }, { v: ' 55', align: 'right', mono: true }, { v: '52', align: 'right', mono: true, color: DC.cyan }, { v: ' 3', align: 'right', mono: true, color: DC.red }, { v: ' 94%', align: 'right', mono: true, color: DC.green }],
              [{ v: 'W5', bold: true }, { v: ' 50', align: 'right', mono: true }, { v: '45', align: 'right', mono: true, color: DC.cyan }, { v: ' 5', align: 'right', mono: true, color: DC.red }, { v: ' 90%', align: 'right', mono: true, color: DC.amber }],
              [{ v: 'W10', bold: true }, { v: ' 52', align: 'right', mono: true }, { v: '50', align: 'right', mono: true, color: DC.cyan }, { v: ' 2', align: 'right', mono: true, color: DC.red }, { v: ' 97%', align: 'right', mono: true, color: DC.green }],
              [{ v: 'W11', bold: true }, { v: ' 48', align: 'right', mono: true }, { v: '44', align: 'right', mono: true, color: DC.cyan }, { v: ' 4', align: 'right', mono: true, color: DC.red }, { v: ' 92%', align: 'right', mono: true, color: DC.green }],
              [{ v: 'W12', bold: true }, { v: ' 50', align: 'right', mono: true }, { v: '47', align: 'right', mono: true, color: DC.cyan }, { v: ' 3', align: 'right', mono: true, color: DC.red }, { v: ' 94%', align: 'right', mono: true, color: DC.green }],
            ]}
          />
        </CBCard>
      )}
    </CBWrap>
  ),

  // ---- MN_11 라인별 가동률 ----
  mn_line_utilization: () => (
    <CBWrap header={<CBHead title="⑪ 라인별 가동률 현황 (Utilization)"
                           titleColor={DC.green}
                           right={<CBBadge label="평균 가동률 81.2%" color={DC.cyan} />} />}>
      <CBTable
        cols={['설비/라인명', '총 가용 시간', '계획 배정', '예상 가동률', '유휴/비가동', '비가동 내역 분석 (PM/Setup/Idle)']}
        colFlex={[1.7, 1, 1, 1.3, 1.1, 2.6]}
        rows={[
          [{ v: 'L1-SMT(표면실장)',       bold: true }, { v: '480h',  align: 'right', mono: true }, { v: '422h', align: 'right', mono: true }, { v: '  88%  ▓▓▓▓▓▓▓▓░',  align: 'right', mono: true, color: DC.green }, { v: ' 58h', align: 'right', mono: true }, 'PM 정기점검 20h · Setup 25h · Idle 13h'],
          [{ v: 'L2-Wave(수삽)',           bold: true }, { v: '480h',  align: 'right', mono: true }, { v: '390h', align: 'right', mono: true }, { v: '  81%  ▓▓▓▓▓▓▓▓░',  align: 'right', mono: true, color: DC.green }, { v: ' 90h', align: 'right', mono: true }, 'PM 30h · Setup 40h · Idle 20h'],
          [{ v: 'L3-Assembly(조립)',       bold: true }, { v: '480h',  align: 'right', mono: true }, { v: '461h', align: 'right', mono: true }, { v: '  96%  ▓▓▓▓▓▓▓▓▓',  align: 'right', mono: true, color: DC.red, bold: true }, { v: ' 19h', align: 'right', mono: true, color: DC.red }, { v: '과부하 · PM 10h · Setup 5h · Idle 4h', color: DC.red }],
          [{ v: 'L4-Inspect(검사)',        bold: true }, { v: '480h',  align: 'right', mono: true }, { v: '350h', align: 'right', mono: true }, { v: '  73%  ▓▓▓▓▓▓▓░░',  align: 'right', mono: true, color: DC.amber }, { v: '130h', align: 'right', mono: true, color: DC.amber }, 'PM 25h · Setup 30h · Idle 75h'],
          [{ v: 'L5-Packing(포장)',        bold: true }, { v: '480h',  align: 'right', mono: true }, { v: '302h', align: 'right', mono: true }, { v: '  63%  ▓▓▓▓▓▓░░░',  align: 'right', mono: true, color: DC.amber, bold: true }, { v: '178h', align: 'right', mono: true, color: DC.amber }, { v: '유휴 과다 · PM 15h · Idle 163h', color: DC.amber }],
          [{ v: 'L6-Outbound(출하)',       bold: true }, { v: '480h',  align: 'right', mono: true }, { v: '385h', align: 'right', mono: true }, { v: '  80%  ▓▓▓▓▓▓▓▓░',  align: 'right', mono: true, color: DC.green }, { v: ' 95h', align: 'right', mono: true }, 'PM 20h · Setup 35h · Idle 40h'],
          [{ v: 'CNC-01 (가공 센터)',       bold: true }, { v: '480h',  align: 'right', mono: true }, { v: '228h', align: 'right', mono: true }, { v: '  48%  ▓▓▓▓▓░░░░',  align: 'right', mono: true, color: DC.red, bold: true }, { v: '252h', align: 'right', mono: true, color: DC.red }, { v: '고장 복구 중 · PM 80h · Idle 172h', color: DC.red }],
          [{ v: 'CNC-02 (가공 센터)',       bold: true }, { v: '480h',  align: 'right', mono: true }, { v: '418h', align: 'right', mono: true }, { v: '  87%  ▓▓▓▓▓▓▓▓░',  align: 'right', mono: true, color: DC.green }, { v: ' 62h', align: 'right', mono: true }, 'PM 22h · Setup 28h · Idle 12h'],
        ]}
        rowBg={['transparent', 'transparent', `${DC.red}14`, `${DC.amber}10`, `${DC.amber}14`, 'transparent', `${DC.red}14`, 'transparent']}
      />
    </CBWrap>
  ),

  // ---- MN_12 셋업/교체 시간 손실 ----
  mn_setup_loss: () => (
    <CBWrap header={<CBHead title="⑫ 셋업/교체 시간 손실 (Setup Loss)"
                           titleColor={DC.amber}
                           right={<CBBadge label="주간 Loss: +2h 35m" color={DC.red} />} />}>
      <CBTable
        cols={['발생 일자', '라인명', '교체 전 ➔ 교체 후', '교체 유형', '표준', '실제', 'Loss/Gain']}
        colFlex={[1, 1.3, 2.4, 1.1, 0.8, 0.8, 1.1]}
        rows={[
          [{ v: '11/01 08:30', mono: true }, { v: 'L1-SMT',        bold: true }, '메인보드 V1 ➔ OLED 27"',      cbBadgeCell('Major',  DC.red),   { v: '30분', align: 'right', mono: true }, { v: '45분', align: 'right', mono: true, color: DC.red, bold: true }, { v: '+15분  Loss', align: 'right', mono: true, color: DC.red }],
          [{ v: '11/01 14:20', mono: true }, { v: 'L2-Wave',       bold: true }, 'OLED 27" ➔ MCU M4',           cbBadgeCell('Minor',  DC.amber), { v: '20분', align: 'right', mono: true }, { v: '15분', align: 'right', mono: true, color: DC.green, bold: true }, { v: '-5분   Gain', align: 'right', mono: true, color: DC.green }],
          [{ v: '11/02 09:00', mono: true }, { v: 'L3-Assembly',   bold: true }, '메인보드 V1 ➔ 하우징 프레임',  cbBadgeCell('Major',  DC.red),   { v: '45분', align: 'right', mono: true }, { v: '60분', align: 'right', mono: true, color: DC.red, bold: true }, { v: '+15분  Loss', align: 'right', mono: true, color: DC.red }],
          [{ v: '11/02 16:45', mono: true }, { v: 'L1-SMT',        bold: true }, '하우징 ➔ 배터리 팩',          cbBadgeCell('Medium', DC.amber), { v: '25분', align: 'right', mono: true }, { v: '22분', align: 'right', mono: true, color: DC.green, bold: true }, { v: '-3분   Gain', align: 'right', mono: true, color: DC.green }],
          [{ v: '11/03 10:15', mono: true }, { v: 'L4-Inspect',    bold: true }, 'MCU M4 ➔ 정밀 센서 어셈블리',   cbBadgeCell('Minor',  DC.amber), { v: '15분', align: 'right', mono: true }, { v: '18분', align: 'right', mono: true, color: DC.amber }, { v: '+3분   Loss', align: 'right', mono: true, color: DC.amber }],
          [{ v: '11/03 15:30', mono: true }, { v: 'L2-Wave',       bold: true }, 'MCU M4 ➔ 전원 모듈 800W',      cbBadgeCell('Major',  DC.red),   { v: '40분', align: 'right', mono: true }, { v: '55분', align: 'right', mono: true, color: DC.red, bold: true }, { v: '+15분  Loss', align: 'right', mono: true, color: DC.red }],
          [{ v: '11/04 08:00', mono: true }, { v: 'L5-Packing',    bold: true }, '하우징 ➔ BLDC 모터 유닛',      cbBadgeCell('Medium', DC.amber), { v: '20분', align: 'right', mono: true }, { v: '17분', align: 'right', mono: true, color: DC.green, bold: true }, { v: '-3분   Gain', align: 'right', mono: true, color: DC.green }],
          [{ v: '11/04 13:40', mono: true }, { v: 'L3-Assembly',   bold: true }, '배터리 팩 ➔ 메인보드 V1',      cbBadgeCell('Major',  DC.red),   { v: '35분', align: 'right', mono: true }, { v: '52분', align: 'right', mono: true, color: DC.red, bold: true }, { v: '+17분  Loss', align: 'right', mono: true, color: DC.red }],
        ]}
        rowBg={[`${DC.red}14`, `${DC.green}10`, `${DC.red}14`, `${DC.green}10`, 'transparent', `${DC.red}14`, `${DC.green}10`, `${DC.red}14`]}
      />
    </CBWrap>
  ),

  // ---- MN_13 PO 상세 추적 ----
  mn_po_tracking: () => (
    <CBWrap header={<CBHead title="⑬ 발주번호(PO) 상세 추적 (Tracking)"
                           titleColor={DC.cyan}
                           right={<CBBadge label="실시간 · 5분 간격" color={DC.blue} />} />}>
      {/* PO Header */}
      <Box sx={{ bgcolor: DC.surface, border: `1px solid ${DC.cyan}44`, borderRadius: 0.3, p: 0.3, flexShrink: 0, mb: 0.2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
            <Box sx={{ fontSize: 10, color: DC.cyan, fontWeight: 700, fontFamily: 'monospace' }}>PO-2026-0994</Box>
            <CBBadge label="생산 진행중 · 60%" color={DC.blue} />
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Box sx={{ fontSize: 4.5, color: DC.text3 }}>고객: 삼성전자 | 품목: 고성능 메인보드 V1</Box>
            <Box sx={{ fontSize: 5, color: DC.text, fontWeight: 700 }}>목표 수량: <Box component="span" sx={{ color: DC.cyan, fontFamily: 'monospace' }}>5,000 EA</Box> · 납기 <Box component="span" sx={{ color: DC.amber }}>11/20</Box></Box>
          </Box>
        </Box>
        {/* Progress timeline */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.1 }}>
          {[
            { s: '자재 입고',   state: 'done' },
            { s: 'SMT',         state: 'done' },
            { s: '조립',         state: 'active' },
            { s: '검사',         state: 'pending' },
            { s: '포장',         state: 'pending' },
            { s: '출하',         state: 'pending' },
          ].map((step, i, arr) => (
            <React.Fragment key={i}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.1 }}>
                <Box sx={{
                  width: 14, height: 14, borderRadius: '50%',
                  bgcolor: step.state === 'done' ? DC.green : step.state === 'active' ? DC.cyan : DC.surface3,
                  color: step.state === 'pending' ? DC.text3 : '#000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 6, fontWeight: 700,
                  boxShadow: step.state === 'active' ? `0 0 4px ${DC.cyan}` : 'none',
                }}>
                  {step.state === 'done' ? '✓' : i + 1}
                </Box>
                <Box sx={{ fontSize: 4, color: step.state === 'pending' ? DC.text3 : DC.text, fontWeight: 700 }}>{step.s}</Box>
              </Box>
              {i < arr.length - 1 && (
                <Box sx={{ flex: 1, height: 1.5, bgcolor: step.state === 'done' ? DC.green : DC.surface3, mt: -1 }} />
              )}
            </React.Fragment>
          ))}
        </Box>
      </Box>
      <CBTable
        cols={['하위 작업지시(WO)', '공정명', '지시 수량', '완료 수량', '진척률', '시작 시각', '상태']}
        colFlex={[1.3, 1.3, 0.9, 0.9, 1.7, 0.9, 0.9]}
        rows={[
          [{ v: 'WO-0994-001', mono: true, color: DC.cyan }, { v: 'SMT(표면실장)',   bold: true }, { v: '5,000', align: 'right', mono: true }, { v: '5,000', align: 'right', mono: true, color: DC.cyan, bold: true }, { v: '████████████ 100%', mono: true, color: DC.green }, { v: '11/09 08:00', mono: true }, cbBadgeCell('완료',   DC.green)],
          [{ v: 'WO-0994-002', mono: true, color: DC.cyan }, { v: 'Wave(수삽)',       bold: true }, { v: '5,000', align: 'right', mono: true }, { v: '5,000', align: 'right', mono: true, color: DC.cyan, bold: true }, { v: '████████████ 100%', mono: true, color: DC.green }, { v: '11/10 09:30', mono: true }, cbBadgeCell('완료',   DC.green)],
          [{ v: 'WO-0994-003', mono: true, color: DC.cyan }, { v: 'Assembly(조립)',   bold: true }, { v: '5,000', align: 'right', mono: true }, { v: '3,000', align: 'right', mono: true, color: DC.cyan, bold: true }, { v: '███████░░░░░  60%', mono: true, color: DC.cyan },  { v: '11/11 08:00', mono: true }, cbBadgeCell('가동중', DC.blue)],
          [{ v: 'WO-0994-004', mono: true, color: DC.cyan }, { v: 'Inspect(검사)',    bold: true }, { v: '5,000', align: 'right', mono: true }, { v: '    0', align: 'right', mono: true, color: DC.text3 },              { v: '░░░░░░░░░░░░   0%', mono: true, color: DC.text3 },  '—',                              cbBadgeCell('대기',   DC.text2)],
          [{ v: 'WO-0994-005', mono: true, color: DC.cyan }, { v: 'Packing(포장)',    bold: true }, { v: '5,000', align: 'right', mono: true }, { v: '    0', align: 'right', mono: true, color: DC.text3 },              { v: '░░░░░░░░░░░░   0%', mono: true, color: DC.text3 },  '—',                              cbBadgeCell('대기',   DC.text2)],
          [{ v: 'WO-0994-006', mono: true, color: DC.cyan }, { v: 'Outbound(출하)',   bold: true }, { v: '5,000', align: 'right', mono: true }, { v: '    0', align: 'right', mono: true, color: DC.text3 },              { v: '░░░░░░░░░░░░   0%', mono: true, color: DC.text3 },  '—',                              cbBadgeCell('대기',   DC.text2)],
        ]}
      />
    </CBWrap>
  ),

  // ---- MN_14 간트 진척률 ----
  mn_gantt_progress: () => (
    <CBWrap header={<CBHead title="⑭ 간트 차트 기반 진척률 (Gantt Progress)"
                           titleColor={DC.cyan}
                           right={<CBBadge label="8 WO · 금주 계획" color={DC.cyan} />} />}>
      <Box sx={{ flex: 1, bgcolor: DC.surface, border: `1px solid ${DC.border}`, borderRadius: 0.3,
                 overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Date header */}
        <Box sx={{ display: 'flex', bgcolor: DC.surface3, borderBottom: `1px solid ${DC.border}` }}>
          <Box sx={{ width: 95, fontSize: 4.5, color: DC.text2, px: 0.3, py: 0.2, fontWeight: 700,
                     borderRight: `1px solid ${DC.border}` }}>작업지시(WO) / 선행</Box>
          <Box sx={{ flex: 1, display: 'flex' }}>
            {Array.from({ length: 12 }).map((_, i) => {
              const wk = i === 5 || i === 6;
              const today = i === 2;
              return (
                <Box key={i} sx={{ flex: 1, fontSize: 4, color: today ? DC.cyan : wk ? DC.text3 : DC.text3,
                                   textAlign: 'center', py: 0.2, fontFamily: 'monospace',
                                   fontWeight: today ? 700 : 400,
                                   bgcolor: wk ? '#10111e' : 'transparent',
                                   borderRight: i < 11 ? `1px solid ${DC.border}` : 'none' }}>
                  11/{(9 + i).toString().padStart(2, '0')}
                </Box>
              );
            })}
          </Box>
        </Box>
        {/* Rows */}
        {[
          { wo: 'WO-0994-001', sub: 'SMT (선행 없음)',      start: 0, width: 2, pct: 100, color: DC.green },
          { wo: 'WO-0994-002', sub: 'Wave (← 001)',          start: 1, width: 2, pct: 100, color: DC.green },
          { wo: 'WO-0994-003', sub: 'Assembly (← 002)',      start: 2, width: 3, pct:  60, color: DC.cyan },
          { wo: 'WO-0994-004', sub: 'Inspect (← 003)',       start: 4, width: 2, pct:   0, color: DC.text3 },
          { wo: 'WO-0994-005', sub: 'Packing (← 004)',       start: 6, width: 2, pct:   0, color: DC.text3 },
          { wo: 'WO-0994-006', sub: 'Outbound (← 005)',      start: 8, width: 2, pct:   0, color: DC.text3 },
          { wo: 'WO-1050-001', sub: 'SMT (병렬)',             start: 3, width: 3, pct:  40, color: DC.cyan },
          { wo: 'WO-1050-002', sub: 'Assembly (← 1050-001)',  start: 6, width: 3, pct:   0, color: DC.text3 },
        ].map((b, ri) => (
          <Box key={ri} sx={{ display: 'flex', borderBottom: `1px solid ${DC.border}`, flexShrink: 0 }}>
            <Box sx={{ width: 95, px: 0.3, py: 0.2, borderRight: `1px solid ${DC.border}` }}>
              <Box sx={{ fontSize: 4.5, color: DC.cyan, fontFamily: 'monospace', fontWeight: 700 }}>{b.wo}</Box>
              <Box sx={{ fontSize: 4, color: DC.text3,
                         whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.sub}</Box>
            </Box>
            <Box sx={{ flex: 1, position: 'relative', minHeight: 18 }}>
              {/* Day cells */}
              {Array.from({ length: 12 }).map((_, i) => {
                const wk = i === 5 || i === 6;
                return (
                  <Box key={i} sx={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: `${(i / 12) * 100}%`, width: `${100 / 12}%`,
                    bgcolor: wk ? '#10111e' : 'transparent',
                    borderRight: `1px solid ${DC.border}`,
                  }} />
                );
              })}
              {/* Bar container */}
              <Box sx={{
                position: 'absolute', top: 3, height: 11,
                left: `${(b.start / 12) * 100}%`, width: `${(b.width / 12) * 100}%`,
                bgcolor: `${b.color}22`, border: `1px solid ${b.color}`, borderRadius: 0.2,
                overflow: 'hidden', display: 'flex', alignItems: 'center',
              }}>
                {/* Progress fill */}
                <Box sx={{ height: '100%', width: `${b.pct}%`,
                           bgcolor: `${b.color}66`, borderRight: b.pct > 0 && b.pct < 100 ? `2px solid ${b.color}` : 'none' }} />
                {/* Label */}
                <Box sx={{ position: 'absolute', left: '50%', top: '50%',
                           transform: 'translate(-50%, -50%)',
                           fontSize: 4, color: DC.text, fontWeight: 700, fontFamily: 'monospace',
                           textShadow: '0 0 2px #000' }}>
                  {b.pct}%
                </Box>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </CBWrap>
  ),

  // ---- MN_15 공용 부품 소요량 전개 ----
  mn_part_explosion: () => (
    <CBWrap header={<CBHead title="⑮ 공용 부품 소요량 전개 (Part Explosion)"
                           titleColor={DC.blue}
                           right={<CBBadge label="BOM · 2 Level 전개" color={DC.cyan} />} />}>
      <CBTable
        cols={['부품 코드', '규격 / 명칭', '조달 LT', '총 소요량', '가용 재고', '부족량', '사용처 (Where-used)', '상태']}
        colFlex={[1.1, 2, 0.8, 1, 1, 1, 2.2, 0.9]}
        rows={[
          [{ v: 'SUB-001', mono: true }, '저항 1kΩ 1/4W 5%',           { v: ' 7일', align: 'right', mono: true }, { v: '45,250', align: 'right', mono: true }, { v: '38,500', align: 'right', mono: true, color: DC.amber }, { v: ' -6,750', align: 'right', mono: true, color: DC.amber, bold: true }, '메인보드 V1, 전원 모듈 800W, 센서',        cbBadgeCell('부족', DC.amber)],
          [{ v: 'SUB-002', mono: true }, '캐패시터 10uF Ceramic',      { v: ' 5일', align: 'right', mono: true }, { v: '28,400', align: 'right', mono: true }, { v: '42,000', align: 'right', mono: true, color: DC.green }, { v: '+13,600', align: 'right', mono: true, color: DC.green },           '메인보드 V1, OLED 디스플레이',             cbBadgeCell('정상', DC.green)],
          [{ v: 'SUB-003', mono: true }, 'MOSFET IRF540N',              { v: '14일', align: 'right', mono: true }, { v: ' 3,850', align: 'right', mono: true }, { v: ' 1,200', align: 'right', mono: true, color: DC.red }, { v: ' -2,650', align: 'right', mono: true, color: DC.red, bold: true },     '전원 모듈 800W, BLDC 모터 유닛',             cbBadgeCell('결품', DC.red)],
          [{ v: 'SUB-004', mono: true }, '인덕터 100uH SMD',             { v: ' 3일', align: 'right', mono: true }, { v: '18,900', align: 'right', mono: true }, { v: '22,500', align: 'right', mono: true, color: DC.green }, { v: ' +3,600', align: 'right', mono: true, color: DC.green },           '배터리 팩, 전원 모듈',                         cbBadgeCell('정상', DC.green)],
          [{ v: 'SUB-005', mono: true }, 'LED 0603 White',               { v: ' 2일', align: 'right', mono: true }, { v: '62,000', align: 'right', mono: true }, { v: '85,000', align: 'right', mono: true, color: DC.green }, { v: '+23,000', align: 'right', mono: true, color: DC.green },           'OLED 디스플레이, 하우징, 센서',                cbBadgeCell('정상', DC.green)],
          [{ v: 'SUB-006', mono: true }, '크리스탈 16MHz HC-49/S',       { v: '10일', align: 'right', mono: true }, { v: ' 4,200', align: 'right', mono: true }, { v: ' 2,800', align: 'right', mono: true, color: DC.amber }, { v: ' -1,400', align: 'right', mono: true, color: DC.amber, bold: true }, '메인보드 V1, MCU M4',                        cbBadgeCell('부족', DC.amber)],
          [{ v: 'SUB-007', mono: true }, '커넥터 JST XH 2.54mm',        { v: ' 4일', align: 'right', mono: true }, { v: '12,500', align: 'right', mono: true }, { v: '18,000', align: 'right', mono: true, color: DC.green }, { v: ' +5,500', align: 'right', mono: true, color: DC.green },           '메인보드, 배터리, 전원 모듈, 센서',             cbBadgeCell('정상', DC.green)],
          [{ v: 'SUB-008', mono: true }, '스크류 M3×8mm SUS304',         { v: ' 1일', align: 'right', mono: true }, { v: '85,000', align: 'right', mono: true }, { v: '120K',   align: 'right', mono: true, color: DC.green }, { v: '+35,000', align: 'right', mono: true, color: DC.green },           '하우징, 배터리, BLDC, 전원 모듈',               cbBadgeCell('정상', DC.green)],
        ]}
        rowBg={[`${DC.amber}10`, 'transparent', `${DC.red}14`, 'transparent', 'transparent', `${DC.amber}10`, 'transparent', 'transparent']}
      />
    </CBWrap>
  ),

  // ---- MN_16 고객사별 SLA ----
  mn_customer_sla: () => (
    <CBWrap header={<CBHead title="⑯ 고객사별 납기 달성률 (Customer SLA)"
                           titleColor={DC.cyan}
                           right={<CBBadge label="평균 SLA 90.2%" color={DC.green} />} />}>
      <Box sx={{ flex: 1, display: 'flex', gap: 0.3, minHeight: 0 }}>
        {/* Customer SLA list */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <CBCard title="주요 고객사 SLA 현황 (월간)">
            {[
              { name: '삼성전자',   target: 95, actual: 96.4, orders: 142, color: DC.green,  status: '달성' },
              { name: 'LG전자',     target: 95, actual: 88.2, orders:  98, color: DC.amber,  status: '미달' },
              { name: '현대모비스', target: 92, actual: 94.1, orders:  76, color: DC.green,  status: '달성' },
              { name: '테슬라',     target: 98, actual: 82.5, orders:  54, color: DC.red,    status: '위험' },
              { name: '애플(APPL)', target: 98, actual: 97.8, orders:  42, color: DC.amber,  status: '주의' },
              { name: '화웨이',     target: 90, actual: 92.3, orders:  38, color: DC.green,  status: '달성' },
            ].map((s, i) => (
              <Box key={i} sx={{ mb: 0.25 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 4.5, mb: 0.1 }}>
                  <Box sx={{ color: DC.text, fontWeight: 700 }}>
                    {s.name} <Box component="span" sx={{ color: DC.text3, fontSize: 4 }}>({s.orders}건)</Box>
                  </Box>
                  <Box>
                    <Box component="span" sx={{ color: s.color, fontFamily: 'monospace', fontWeight: 700 }}>{s.actual}%</Box>
                    <Box component="span" sx={{ color: DC.text3, fontSize: 4 }}> / {s.target}%</Box>
                  </Box>
                </Box>
                <Box sx={{ height: 4, bgcolor: DC.surface3, borderRadius: 0.3, position: 'relative' }}>
                  <Box sx={{ position: 'absolute', left: `${s.target}%`, top: -1, bottom: -1,
                             width: 1, bgcolor: DC.red2 || DC.red }} />
                  <Box sx={{ width: `${Math.min(s.actual, 100)}%`, height: '100%', bgcolor: s.color, borderRadius: 0.3 }} />
                </Box>
              </Box>
            ))}
            <Box sx={{ fontSize: 4, color: DC.text3, textAlign: 'center', mt: 0.3 }}>━ 목표선 (Target)</Box>
          </CBCard>
        </Box>
        {/* Order detail */}
        <Box sx={{ flex: 1.2, minWidth: 0 }}>
          <CBCard title="금주 주요 발주 현황">
            <CBTable
              cols={['고객사', '발주번호', '품목', '요구 납기', '예상 출하', '달성']}
              colFlex={[1, 1.2, 1.4, 0.9, 0.9, 0.7]}
              rows={[
                [{ v: '삼성전자',   bold: true }, { v: 'PO-26-0142', mono: true, color: DC.blue }, '메인보드 V1',     { v: '11/15', mono: true }, { v: '11/14', mono: true, color: DC.green }, cbBadgeCell('✓', DC.green)],
                [{ v: 'LG전자',     bold: true }, { v: 'PO-26-0098', mono: true, color: DC.blue }, 'OLED 27"',        { v: '11/17', mono: true }, { v: '11/20', mono: true, color: DC.red }, cbBadgeCell('✗', DC.red)],
                [{ v: '현대모비스', bold: true }, { v: 'PO-26-0076', mono: true, color: DC.blue }, 'BLDC 모터',       { v: '11/20', mono: true }, { v: '11/19', mono: true, color: DC.green }, cbBadgeCell('✓', DC.green)],
                [{ v: '테슬라',     bold: true }, { v: 'PO-26-0054', mono: true, color: DC.blue }, '배터리 팩',       { v: '11/22', mono: true }, { v: '11/26', mono: true, color: DC.red }, cbBadgeCell('✗', DC.red)],
                [{ v: '애플',       bold: true }, { v: 'PO-26-0042', mono: true, color: DC.blue }, 'MCU M4',           { v: '11/25', mono: true }, { v: '11/25', mono: true, color: DC.green }, cbBadgeCell('✓', DC.green)],
                [{ v: '화웨이',     bold: true }, { v: 'PO-26-0038', mono: true, color: DC.blue }, '정밀 센서',        { v: '11/28', mono: true }, { v: '11/27', mono: true, color: DC.green }, cbBadgeCell('✓', DC.green)],
                [{ v: '삼성전자',   bold: true }, { v: 'PO-26-0155', mono: true, color: DC.blue }, '하우징 프레임',    { v: '11/30', mono: true }, { v: '11/30', mono: true, color: DC.green }, cbBadgeCell('✓', DC.green)],
                [{ v: 'LG전자',     bold: true }, { v: 'PO-26-0198', mono: true, color: DC.blue }, '전원 모듈',        { v: '12/02', mono: true }, { v: '12/05', mono: true, color: DC.red }, cbBadgeCell('✗', DC.red)],
              ]}
            />
          </CBCard>
        </Box>
      </Box>
    </CBWrap>
  ),

  // ---- MN_17 외주 가공 의뢰 현황 ----
  mn_subcontracting: () => (
    <CBWrap header={<CBHead title="⑰ 외주 가공 의뢰 현황 (Subcontracting)"
                           titleColor={DC.amber}
                           right={<CBBadge label="외주 8건 · 진행 5 / 완료 3" color={DC.cyan} />} />}>
      <CBTable
        cols={['외주 협력사', '외주발주(Sub-PO)', '의뢰 품목 / 공정', '의뢰 수량', '진척도', 'ETA', '품질 합격률', '상태']}
        colFlex={[1.3, 1.2, 1.8, 0.9, 1.7, 1, 1.1, 0.9]}
        rows={[
          [{ v: '(주)에이테크', bold: true }, { v: 'S-2026-001', mono: true, color: DC.blue }, '알루미늄 하우징 / 절삭',      { v: '  500', align: 'right', mono: true }, { v: '██████████░░  80%', mono: true, color: DC.blue }, { v: '11/12', mono: true, color: DC.green }, { v: ' 99.2%', align: 'right', mono: true, color: DC.green }, cbBadgeCell('진행',   DC.blue)],
          [{ v: '비전가공',     bold: true }, { v: 'S-2026-002', mono: true, color: DC.blue }, 'PCB 패턴 가공 / 에칭',         { v: '  300', align: 'right', mono: true }, { v: '█████░░░░░░░  45%', mono: true, color: DC.amber }, { v: '11/15', mono: true, color: DC.amber }, { v: ' 97.5%', align: 'right', mono: true, color: DC.green }, cbBadgeCell('진행',   DC.blue)],
          [{ v: '성일정밀',     bold: true }, { v: 'S-2026-003', mono: true, color: DC.blue }, '정밀 케이스 / 밀링',            { v: '  200', align: 'right', mono: true }, { v: '████████████ 100%', mono: true, color: DC.green }, { v: '11/08', mono: true, color: DC.green }, { v: ' 99.8%', align: 'right', mono: true, color: DC.green }, cbBadgeCell('완료',   DC.green)],
          [{ v: '동화전자',     bold: true }, { v: 'S-2026-004', mono: true, color: DC.blue }, 'PCB 4 Layer / 조립',            { v: '  800', align: 'right', mono: true }, { v: '████████░░░░  65%', mono: true, color: DC.cyan }, { v: '11/18', mono: true, color: DC.cyan }, { v: ' 96.8%', align: 'right', mono: true, color: DC.amber }, cbBadgeCell('진행',   DC.blue)],
          [{ v: '(주)에이테크', bold: true }, { v: 'S-2026-005', mono: true, color: DC.blue }, '방열판 / 다이캐스팅',           { v: '  450', align: 'right', mono: true }, { v: '███████░░░░░  55%', mono: true, color: DC.cyan }, { v: '11/16', mono: true, color: DC.amber }, { v: ' 98.4%', align: 'right', mono: true, color: DC.green }, cbBadgeCell('진행',   DC.blue)],
          [{ v: '성일정밀',     bold: true }, { v: 'S-2026-006', mono: true, color: DC.blue }, '샤프트 / 선삭',                  { v: '  250', align: 'right', mono: true }, { v: '████████████ 100%', mono: true, color: DC.green }, { v: '11/10', mono: true, color: DC.green }, { v: ' 99.6%', align: 'right', mono: true, color: DC.green }, cbBadgeCell('완료',   DC.green)],
          [{ v: '비전가공',     bold: true }, { v: 'S-2026-007', mono: true, color: DC.blue }, '코팅 / PVD',                     { v: '  380', align: 'right', mono: true }, { v: '██░░░░░░░░░░  15%', mono: true, color: DC.amber }, { v: '11/22', mono: true, color: DC.red }, { v: ' 95.2%', align: 'right', mono: true, color: DC.amber }, cbBadgeCell('지연',   DC.red)],
          [{ v: '동화전자',     bold: true }, { v: 'S-2026-008', mono: true, color: DC.blue }, '표면처리 / 아노다이징',          { v: '  620', align: 'right', mono: true }, { v: '████████████ 100%', mono: true, color: DC.green }, { v: '11/09', mono: true, color: DC.green }, { v: ' 98.9%', align: 'right', mono: true, color: DC.green }, cbBadgeCell('완료',   DC.green)],
        ]}
        rowBg={['transparent', `${DC.amber}10`, 'transparent', 'transparent', 'transparent', 'transparent', `${DC.red}14`, 'transparent']}
      />
    </CBWrap>
  ),

  // ---- MN_18 생산 비용/원가 예상 ----
  mn_expected_cost: () => (
    <CBWrap header={<CBHead title="⑱ 생산 비용/원가 예상 (Expected Cost)"
                           titleColor={DC.amber}
                           right={<CBBadge label="월간 집계 · 2026-11" color={DC.blue} />} />}>
      {/* 3 Cost Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.25, flexShrink: 0, mb: 0.2 }}>
        <Box sx={{ bgcolor: DC.surface, border: `1px solid ${DC.amber}44`, borderRadius: 0.3, p: 0.3 }}>
          <Box sx={{ fontSize: 4.5, color: DC.text3 }}>월간 예상 총 제조원가</Box>
          <Box sx={{ fontSize: 11, color: DC.amber, fontWeight: 700, fontFamily: 'monospace', lineHeight: '13px' }}>
            ₩ 2,450.5 <Box component="span" sx={{ fontSize: 4.5 }}>M</Box>
          </Box>
          <Box sx={{ fontSize: 4, color: DC.text3 }}>전월 +8.5%</Box>
        </Box>
        <Box sx={{ bgcolor: DC.surface, border: `1px solid ${DC.red}44`, borderRadius: 0.3, p: 0.3 }}>
          <Box sx={{ fontSize: 4.5, color: DC.text3 }}>예산 대비 초과 비용</Box>
          <Box sx={{ fontSize: 11, color: DC.red, fontWeight: 700, fontFamily: 'monospace', lineHeight: '13px' }}>
            + ₩ 120.0 <Box component="span" sx={{ fontSize: 4.5 }}>M</Box>
          </Box>
          <Box sx={{ fontSize: 4, color: DC.red }}>원자재 인상 · 외주비 증가</Box>
        </Box>
        <Box sx={{ bgcolor: DC.surface, border: `1px solid ${DC.green}44`, borderRadius: 0.3, p: 0.3 }}>
          <Box sx={{ fontSize: 4.5, color: DC.text3 }}>예상 평균 이익률 (Margin)</Box>
          <Box sx={{ fontSize: 11, color: DC.green, fontWeight: 700, fontFamily: 'monospace', lineHeight: '13px' }}>
            18.4 <Box component="span" sx={{ fontSize: 4.5 }}>%</Box>
          </Box>
          <Box sx={{ fontSize: 4, color: DC.green }}>목표 17% 상회</Box>
        </Box>
      </Box>
      <CBTable
        cols={['발주번호', '품목명', '직접재료비(M)', '직접노무비(L)', '제조간접비(OH)', '총 원가', '이익률', '등급']}
        colFlex={[1.2, 1.7, 1.1, 1.1, 1.1, 1, 0.9, 0.8]}
        rows={[
          [{ v: 'PO-26-0042', mono: true, color: DC.blue }, '고성능 메인보드 V1',     { v: ' 120.5', align: 'right', mono: true }, { v: ' 30.2', align: 'right', mono: true }, { v: ' 40.0', align: 'right', mono: true }, { v: ' 190.7', align: 'right', mono: true, color: DC.amber, bold: true }, { v: ' 22.3%', align: 'right', mono: true, color: DC.green }, cbBadgeCell('A',   DC.green)],
          [{ v: 'PO-26-0051', mono: true, color: DC.blue }, 'OLED 디스플레이 27"',    { v: ' 180.8', align: 'right', mono: true }, { v: ' 45.0', align: 'right', mono: true }, { v: ' 60.5', align: 'right', mono: true }, { v: ' 286.3', align: 'right', mono: true, color: DC.amber, bold: true }, { v: ' 18.0%', align: 'right', mono: true, color: DC.green }, cbBadgeCell('B',   DC.cyan)],
          [{ v: 'PO-26-0088', mono: true, color: DC.blue }, '마이크로컨트롤러 M4',     { v: '  95.0', align: 'right', mono: true }, { v: ' 25.5', align: 'right', mono: true }, { v: ' 30.2', align: 'right', mono: true }, { v: ' 150.7', align: 'right', mono: true, color: DC.amber, bold: true }, { v: ' 15.2%', align: 'right', mono: true, color: DC.amber }, cbBadgeCell('B',   DC.cyan)],
          [{ v: 'PO-26-0103', mono: true, color: DC.blue }, '하우징 프레임',           { v: '  65.8', align: 'right', mono: true }, { v: ' 22.8', align: 'right', mono: true }, { v: ' 25.0', align: 'right', mono: true }, { v: ' 113.6', align: 'right', mono: true, color: DC.amber, bold: true }, { v: ' 21.5%', align: 'right', mono: true, color: DC.green }, cbBadgeCell('A',   DC.green)],
          [{ v: 'PO-26-0127', mono: true, color: DC.blue }, '배터리 팩 5000mAh',      { v: ' 210.5', align: 'right', mono: true }, { v: ' 50.0', align: 'right', mono: true }, { v: ' 70.5', align: 'right', mono: true }, { v: ' 331.0', align: 'right', mono: true, color: DC.red, bold: true }, { v: ' 11.2%', align: 'right', mono: true, color: DC.red }, cbBadgeCell('C',   DC.red)],
          [{ v: 'PO-26-0155', mono: true, color: DC.blue }, '전원 모듈 800W',         { v: ' 145.0', align: 'right', mono: true }, { v: ' 40.5', align: 'right', mono: true }, { v: ' 50.8', align: 'right', mono: true }, { v: ' 236.3', align: 'right', mono: true, color: DC.amber, bold: true }, { v: ' 19.8%', align: 'right', mono: true, color: DC.green }, cbBadgeCell('B',   DC.cyan)],
          [{ v: 'PO-26-0198', mono: true, color: DC.blue }, '정밀 센서 어셈블리',      { v: '  82.5', align: 'right', mono: true }, { v: ' 28.0', align: 'right', mono: true }, { v: ' 35.0', align: 'right', mono: true }, { v: ' 145.5', align: 'right', mono: true, color: DC.amber, bold: true }, { v: ' 24.0%', align: 'right', mono: true, color: DC.green }, cbBadgeCell('A',   DC.green)],
          [{ v: 'PO-26-0220', mono: true, color: DC.blue }, 'BLDC 모터 유닛',           { v: ' 175.2', align: 'right', mono: true }, { v: ' 48.5', align: 'right', mono: true }, { v: ' 62.0', align: 'right', mono: true }, { v: ' 285.7', align: 'right', mono: true, color: DC.amber, bold: true }, { v: ' 17.5%', align: 'right', mono: true, color: DC.amber }, cbBadgeCell('B',   DC.cyan)],
        ]}
        rowBg={['transparent', 'transparent', 'transparent', 'transparent', `${DC.red}14`, 'transparent', 'transparent', 'transparent']}
      />
    </CBWrap>
  ),

  // ---- MN_19 탄소 배출/에너지 사용 ----
  mn_energy_carbon: () => (
    <CBWrap header={<CBHead title="⑲ 탄소 배출 / 에너지 사용 예상 (Energy/Carbon)"
                           titleColor={DC.green}
                           right={<CBBadge label="ESG · 2026-11" color={DC.green} />} />}>
      {/* 2 Top Cards */}
      <Box sx={{ display: 'flex', gap: 0.3, flexShrink: 0, mb: 0.2 }}>
        <Box sx={{ flex: 1, bgcolor: DC.surface, border: `1px solid ${DC.amber}44`, borderRadius: 0.3, p: 0.3 }}>
          <Box sx={{ fontSize: 4.5, color: DC.text2, fontWeight: 700, mb: 0.15 }}>월간 탄소 배출량 쿼터 관리</Box>
          <Box sx={{ fontSize: 14, color: DC.amber, fontWeight: 700, textAlign: 'center', fontFamily: 'monospace', lineHeight: '16px' }}>
            1,240 <Box component="span" sx={{ fontSize: 5, color: DC.text3 }}>tCO2e</Box>
          </Box>
          <Box sx={{ height: 6, bgcolor: DC.surface3, borderRadius: 0.3, mt: 0.15, position: 'relative' }}>
            <Box sx={{ width: '82.6%', height: '100%', bgcolor: DC.amber, borderRadius: 0.3 }} />
            <Box sx={{ position: 'absolute', right: 0, top: -1, bottom: -1, width: 1, bgcolor: DC.red }} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 4, color: DC.text3, mt: 0.1 }}>
            <Box>누적 배출량</Box>
            <Box>쿼터 1,500 대비 <Box component="span" sx={{ color: DC.amber, fontWeight: 700 }}>82.6%</Box> 도달</Box>
          </Box>
        </Box>
        <Box sx={{ flex: 1, bgcolor: DC.surface, border: `1px solid ${DC.border}`, borderRadius: 0.3, p: 0.3 }}>
          <Box sx={{ fontSize: 4.5, color: DC.text2, fontWeight: 700, mb: 0.15 }}>전력 사용량 (Peak vs Off-peak)</Box>
          <Box sx={{ display: 'flex', height: 18, borderRadius: 0.2, overflow: 'hidden', mb: 0.2 }}>
            <Box sx={{ flex: 6, bgcolor: `${DC.red}44`, color: DC.red, fontSize: 5, fontWeight: 700,
                       display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Peak 60% · 고비용</Box>
            <Box sx={{ flex: 4, bgcolor: `${DC.green}44`, color: DC.green, fontSize: 5, fontWeight: 700,
                       display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Off-Peak 40% · 저비용</Box>
          </Box>
          <Box sx={{ fontSize: 4, color: DC.text3, textAlign: 'center' }}>
            🤖 <Box component="span" sx={{ color: DC.purple, fontWeight: 700 }}>AI 제안:</Box> 심야 시간대로 대형 로트 15% 이전 시 <Box component="span" sx={{ color: DC.green, fontWeight: 700 }}>₩12.5M 절감 가능</Box>
          </Box>
        </Box>
      </Box>
      <CBTable
        cols={['설비명 (소비처)', '예상 총 가동시간', '예상 전력량(kWh)', '예상 CO2(tCO2e)', '효율 등급', '대체 에너지 전환율']}
        colFlex={[2, 1.2, 1.2, 1.2, 1, 1.6]}
        rows={[
          [{ v: 'L1-SMT(표면실장)',          bold: true }, { v: '480h', align: 'right', mono: true }, { v: ' 2,540', align: 'right', mono: true }, { v: '1.22', align: 'right', mono: true, color: DC.amber }, cbBadgeCell('B', DC.cyan),   { v: ' 15%  ▓▓░░░░░░░░', mono: true, color: DC.amber }],
          [{ v: 'L2-Wave(수삽)',              bold: true }, { v: '480h', align: 'right', mono: true }, { v: ' 3,180', align: 'right', mono: true }, { v: '1.53', align: 'right', mono: true, color: DC.red }, cbBadgeCell('C', DC.red),    { v: '  5%  ▓░░░░░░░░░', mono: true, color: DC.red }],
          [{ v: 'L3-Assembly(조립)',          bold: true }, { v: '480h', align: 'right', mono: true }, { v: ' 1,850', align: 'right', mono: true }, { v: '0.89', align: 'right', mono: true, color: DC.green }, cbBadgeCell('A', DC.green), { v: ' 32%  ▓▓▓░░░░░░░', mono: true, color: DC.green }],
          [{ v: 'L4-Inspect(검사)',           bold: true }, { v: '480h', align: 'right', mono: true }, { v: '   920', align: 'right', mono: true }, { v: '0.44', align: 'right', mono: true, color: DC.green }, cbBadgeCell('A+', DC.green), { v: ' 45%  ▓▓▓▓░░░░░░', mono: true, color: DC.green }],
          [{ v: 'L5-Packing(포장)',           bold: true }, { v: '480h', align: 'right', mono: true }, { v: '   680', align: 'right', mono: true }, { v: '0.33', align: 'right', mono: true, color: DC.green }, cbBadgeCell('A+', DC.green), { v: ' 50%  ▓▓▓▓▓░░░░░', mono: true, color: DC.green }],
          [{ v: 'CNC-01 (가공센터)',           bold: true }, { v: '480h', align: 'right', mono: true }, { v: ' 4,250', align: 'right', mono: true }, { v: '2.04', align: 'right', mono: true, color: DC.red }, cbBadgeCell('D', DC.red),    { v: '  0%  ░░░░░░░░░░', mono: true, color: DC.red }],
          [{ v: 'CNC-02 (가공센터)',           bold: true }, { v: '480h', align: 'right', mono: true }, { v: ' 3,890', align: 'right', mono: true }, { v: '1.87', align: 'right', mono: true, color: DC.red }, cbBadgeCell('D', DC.red),    { v: '  0%  ░░░░░░░░░░', mono: true, color: DC.red }],
        ]}
        rowBg={['transparent', `${DC.red}10`, 'transparent', 'transparent', 'transparent', `${DC.red}14`, `${DC.red}14`]}
      />
    </CBWrap>
  ),

  // ---- MN_20 작업자/인력 투입 ----
  mn_labor_input: () => (
    <CBWrap header={<CBHead title="⑳ 작업자/인력 투입 계획 (Labor Input)"
                           titleColor={DC.blue}
                           right={<CBBadge label="금주 인력 매칭률 92%" color={DC.cyan} />} />}>
      <CBTable
        cols={['일자', '라인명', '근무조(Shift)', '필요(Req)', '배정(Act)', '과부족(Gap)', '필수 스킬 매칭률', '조치 사항']}
        colFlex={[0.8, 1.5, 0.9, 0.9, 0.9, 0.9, 1.6, 1.8]}
        rows={[
          [{ v: '11/11', mono: true }, { v: 'L1-SMT',       bold: true }, cbBadgeCell('주간 A', DC.blue), { v: '25',   align: 'right', mono: true }, { v: '24',   align: 'right', mono: true, color: DC.amber, bold: true }, { v: ' -1', align: 'right', mono: true, color: DC.amber }, { v: ' 92%  ▓▓▓▓▓▓▓▓▓░', mono: true, color: DC.green }, '예비 인력 1명 투입'],
          [{ v: '11/11', mono: true }, { v: 'L2-Wave',      bold: true }, cbBadgeCell('주간 A', DC.blue), { v: '30',   align: 'right', mono: true }, { v: '30',   align: 'right', mono: true, color: DC.green, bold: true }, { v: '  0', align: 'right', mono: true, color: DC.text3 }, { v: ' 95%  ▓▓▓▓▓▓▓▓▓▓', mono: true, color: DC.green }, '정상'],
          [{ v: '11/11', mono: true }, { v: 'L3-Assembly',  bold: true }, cbBadgeCell('주간 B', DC.blue), { v: '20',   align: 'right', mono: true }, { v: '18',   align: 'right', mono: true, color: DC.red, bold: true }, { v: ' -2', align: 'right', mono: true, color: DC.red, bold: true }, { v: ' 88%  ▓▓▓▓▓▓▓▓░░', mono: true, color: DC.amber }, { v: '숙련공 긴급 호출', color: DC.red }],
          [{ v: '11/12', mono: true }, { v: 'L4-Inspect',   bold: true }, cbBadgeCell('주간 A', DC.blue), { v: '15',   align: 'right', mono: true }, { v: '15',   align: 'right', mono: true, color: DC.green, bold: true }, { v: '  0', align: 'right', mono: true, color: DC.text3 }, { v: '100%  ▓▓▓▓▓▓▓▓▓▓', mono: true, color: DC.green }, '정상'],
          [{ v: '11/12', mono: true }, { v: 'L5-Packing',   bold: true }, cbBadgeCell('야간 C', DC.purple), { v: '12',   align: 'right', mono: true }, { v: '10',   align: 'right', mono: true, color: DC.amber, bold: true }, { v: ' -2', align: 'right', mono: true, color: DC.amber, bold: true }, { v: ' 75%  ▓▓▓▓▓▓▓░░░', mono: true, color: DC.amber }, '교대 연장 협의'],
          [{ v: '11/13', mono: true }, { v: 'L1-SMT',       bold: true }, cbBadgeCell('야간 C', DC.purple), { v: '18',   align: 'right', mono: true }, { v: '20',   align: 'right', mono: true, color: DC.green, bold: true }, { v: ' +2', align: 'right', mono: true, color: DC.green }, { v: ' 90%  ▓▓▓▓▓▓▓▓▓░', mono: true, color: DC.green }, '초과 배치 (증산 대비)'],
          [{ v: '11/13', mono: true }, { v: 'L3-Assembly',  bold: true }, cbBadgeCell('주간 A', DC.blue), { v: '22',   align: 'right', mono: true }, { v: '18',   align: 'right', mono: true, color: DC.red, bold: true }, { v: ' -4', align: 'right', mono: true, color: DC.red, bold: true }, { v: ' 82%  ▓▓▓▓▓▓▓▓░░', mono: true, color: DC.amber }, { v: '외주 인력 요청 중', color: DC.amber }],
          [{ v: '11/14', mono: true }, { v: 'L2-Wave',      bold: true }, cbBadgeCell('주간 B', DC.blue), { v: '28',   align: 'right', mono: true }, { v: '28',   align: 'right', mono: true, color: DC.green, bold: true }, { v: '  0', align: 'right', mono: true, color: DC.text3 }, { v: ' 96%  ▓▓▓▓▓▓▓▓▓▓', mono: true, color: DC.green }, '정상'],
        ]}
        rowBg={[`${DC.amber}10`, 'transparent', `${DC.red}14`, 'transparent', `${DC.amber}10`, `${DC.green}10`, `${DC.red}14`, 'transparent']}
      />
    </CBWrap>
  ),

  // ---- MN_21 AI 예측 vs 확정 계획 ----
  mn_forecast_vs_plan: () => (
    <CBWrap header={<CBHead title="㉑ AI 예측 vs 확정 계획 비교 (Forecast vs Plan)"
                           titleColor={DC.purple}
                           right={<CBBadge label="LLM Accuracy 91.3%" color={DC.purple} />} />}>
      <CBTable
        cols={['품목명 / SKU', 'AI 수요 예측', '실제 생산 계획', '편차(Gap)', '편차율', 'AI 신뢰도', '시스템 판정', '권고']}
        colFlex={[2, 1.2, 1.2, 1, 0.9, 1.6, 1, 1.3]}
        rows={[
          ['고성능 메인보드 V1',      { v: '3,500', align: 'right', mono: true }, { v: '3,480', align: 'right', mono: true }, { v: '  -20', align: 'right', mono: true, color: DC.text3 }, { v: '-0.6%',  align: 'right', mono: true, color: DC.text3 }, { v: ' 95%  ▓▓▓▓▓▓▓▓▓▓', mono: true, color: DC.green }, cbBadgeCell('정상',  DC.green),  '유지'],
          ['OLED 디스플레이 27"',     { v: '2,800', align: 'right', mono: true }, { v: '3,200', align: 'right', mono: true, color: DC.red }, { v: ' +400', align: 'right', mono: true, color: DC.red, bold: true }, { v: '+14.3%', align: 'right', mono: true, color: DC.red }, { v: ' 88%  ▓▓▓▓▓▓▓▓▓░', mono: true, color: DC.green }, cbBadgeCell('과잉',  DC.amber),  { v: '-200 EA 조정', color: DC.amber }],
          ['마이크로컨트롤러 M4',      { v: '1,500', align: 'right', mono: true }, { v: '1,200', align: 'right', mono: true, color: DC.red }, { v: ' -300', align: 'right', mono: true, color: DC.red, bold: true }, { v: '-20.0%', align: 'right', mono: true, color: DC.red }, { v: ' 92%  ▓▓▓▓▓▓▓▓▓▓', mono: true, color: DC.green }, cbBadgeCell('결품',  DC.red),    { v: '+300 긴급 증산', color: DC.red }],
          ['하우징 프레임',            { v: '  800', align: 'right', mono: true }, { v: '  820', align: 'right', mono: true }, { v: '  +20', align: 'right', mono: true, color: DC.text3 }, { v: '+2.5%',  align: 'right', mono: true, color: DC.text3 }, { v: ' 96%  ▓▓▓▓▓▓▓▓▓▓', mono: true, color: DC.green }, cbBadgeCell('정상',  DC.green),  '유지'],
          ['배터리 팩 5000mAh',        { v: '1,800', align: 'right', mono: true }, { v: '1,500', align: 'right', mono: true, color: DC.red }, { v: ' -300', align: 'right', mono: true, color: DC.red, bold: true }, { v: '-16.7%', align: 'right', mono: true, color: DC.red }, { v: ' 94%  ▓▓▓▓▓▓▓▓▓▓', mono: true, color: DC.green }, cbBadgeCell('결품',  DC.red),    { v: '+300 긴급 증산', color: DC.red }],
          ['전원 모듈 800W',            { v: '1,000', align: 'right', mono: true }, { v: '  950', align: 'right', mono: true }, { v: '  -50', align: 'right', mono: true, color: DC.amber }, { v: '-5.0%',  align: 'right', mono: true, color: DC.amber }, { v: ' 85%  ▓▓▓▓▓▓▓▓▓░', mono: true, color: DC.amber }, cbBadgeCell('주의',  DC.amber),  { v: '모니터링', color: DC.amber }],
          ['정밀 센서 어셈블리',        { v: '  550', align: 'right', mono: true }, { v: '  600', align: 'right', mono: true }, { v: '  +50', align: 'right', mono: true, color: DC.amber }, { v: '+9.1%',  align: 'right', mono: true, color: DC.amber }, { v: ' 82%  ▓▓▓▓▓▓▓▓░░', mono: true, color: DC.amber }, cbBadgeCell('주의',  DC.amber),  '모니터링'],
          ['BLDC 모터 유닛',             { v: '1,200', align: 'right', mono: true }, { v: '1,500', align: 'right', mono: true, color: DC.red }, { v: ' +300', align: 'right', mono: true, color: DC.red, bold: true }, { v: '+25.0%', align: 'right', mono: true, color: DC.red }, { v: ' 78%  ▓▓▓▓▓▓▓░░░', mono: true, color: DC.amber }, cbBadgeCell('과잉',  DC.amber),  { v: '-300 EA 조정', color: DC.amber }],
        ]}
        rowBg={['transparent', `${DC.amber}14`, `${DC.red}14`, 'transparent', `${DC.red}14`, `${DC.amber}10`, `${DC.amber}10`, `${DC.amber}14`]}
      />
    </CBWrap>
  ),

  // ---- MN_22 대체 라인 전환 이력 ----
  mn_line_switching: () => (
    <CBWrap header={<CBHead title="㉒ 대체 라인 전환 이력 (Line Switching)"
                           titleColor={DC.purple}
                           right={<CBBadge label="금주 전환: 8건 · 평균 -2.3%" color={DC.green} />} />}>
      <CBTable
        cols={['발주번호', '원래 할당', '➔', '대체 변경', '변경 사유 (제약 회피)', '비용 증감', '효과', '변경 일시']}
        colFlex={[1.3, 1.2, 0.3, 1.2, 1.9, 0.9, 1, 1.3]}
        rows={[
          [{ v: 'PO-2026-0042', mono: true, color: DC.blue }, { v: 'L1-SMT',      bold: true }, { v: '➔', color: DC.amber }, { v: 'L2-Wave',     bold: true, color: DC.amber }, { v: '설비 고장 (CNC-01)', color: DC.red },         { v: '+5.2%', align: 'right', mono: true, color: DC.red, bold: true }, { v: '납기 준수',   color: DC.green }, { v: '11/10 14:25', mono: true }],
          [{ v: 'PO-2026-0051', mono: true, color: DC.blue }, { v: 'L3-Assembly', bold: true }, { v: '➔', color: DC.amber }, { v: 'L4-Inspect',  bold: true, color: DC.amber }, { v: '캐파 부족 (L3 115%)', color: DC.red },        { v: '-3.1%', align: 'right', mono: true, color: DC.green, bold: true }, { v: '부하 해소',  color: DC.green }, { v: '11/10 09:40', mono: true }],
          [{ v: 'PO-2026-0088', mono: true, color: DC.blue }, { v: 'L2-Wave',     bold: true }, { v: '➔', color: DC.amber }, { v: 'L3-Assembly', bold: true, color: DC.amber }, { v: '품질 기준 미달',      color: DC.amber },       { v: '+2.4%', align: 'right', mono: true, color: DC.red }, { v: '수율 개선',   color: DC.green }, { v: '11/09 16:10', mono: true }],
          [{ v: 'PO-2026-0103', mono: true, color: DC.blue }, { v: 'L1-SMT',      bold: true }, { v: '➔', color: DC.amber }, { v: 'L3-Assembly', bold: true, color: DC.amber }, { v: '셋업 최소화',         color: DC.cyan },        { v: '-1.2%', align: 'right', mono: true, color: DC.green }, { v: '시간 단축',  color: DC.green }, { v: '11/09 11:20', mono: true }],
          [{ v: 'PO-2026-0127', mono: true, color: DC.blue }, { v: 'L2-Wave',     bold: true }, { v: '➔', color: DC.amber }, { v: 'L4-Inspect',  bold: true, color: DC.amber }, { v: '작업자 숙련도 부족',  color: DC.amber },       { v: '+3.8%', align: 'right', mono: true, color: DC.red }, { v: '품질 보장',  color: DC.green }, { v: '11/08 13:45', mono: true }],
          [{ v: 'PO-2026-0155', mono: true, color: DC.blue }, { v: 'L4-Inspect',  bold: true }, { v: '➔', color: DC.amber }, { v: 'L5-Packing',  bold: true, color: DC.amber }, { v: '전용 금형 필요',      color: DC.amber },       { v: '+4.5%', align: 'right', mono: true, color: DC.red }, { v: '금형 호환',  color: DC.amber }, { v: '11/08 08:30', mono: true }],
          [{ v: 'PO-2026-0198', mono: true, color: DC.blue }, { v: 'L3-Assembly', bold: true }, { v: '➔', color: DC.amber }, { v: 'L2-Wave',     bold: true, color: DC.amber }, { v: '납기 단축 (+2일 앞당김)', color: DC.green },   { v: '-0.8%', align: 'right', mono: true, color: DC.green }, { v: '납기 앞당김', color: DC.green }, { v: '11/07 15:00', mono: true }],
          [{ v: 'PO-2026-0220', mono: true, color: DC.blue }, { v: 'CNC-01',      bold: true }, { v: '➔', color: DC.amber }, { v: 'CNC-02',      bold: true, color: DC.amber }, { v: '금형 마모 (Life 95%)',  color: DC.red },         { v: '+1.5%', align: 'right', mono: true, color: DC.red }, { v: '금형 보호',   color: DC.green }, { v: '11/07 10:15', mono: true }],
        ]}
        rowBg={[`${DC.red}14`, `${DC.green}14`, `${DC.amber}10`, `${DC.green}10`, `${DC.amber}10`, `${DC.amber}10`, `${DC.green}10`, `${DC.red}14`]}
      />
    </CBWrap>
  ),

  // ---- MN_23 품질/수율 영향 ----
  mn_yield_impact: () => (
    <CBWrap header={<CBHead title="㉓ 품질/수율 연동 계획 영향 (Yield Impact)"
                           titleColor={DC.purple}
                           right={<CBBadge label="수율 저하 공정 3건" color={DC.amber} />} />}>
      <CBTable
        cols={['공정명 / 라인', '기준 수율(%)', '최근 3일 실적', '수율 갭', '예상 수량 손실(EA)', '수율 저하 원인', '보정 상태']}
        colFlex={[1.8, 1, 1.1, 0.9, 1.2, 2, 1.3]}
        rows={[
          [{ v: 'SMT / L1-표면실장',        bold: true }, { v: '98.0%', align: 'right', mono: true }, { v: '95.2%', align: 'right', mono: true, color: DC.red, bold: true }, { v: '-2.8%p', align: 'right', mono: true, color: DC.red }, { v: '    525', align: 'right', mono: true, color: DC.red, bold: true }, '자재(Solder Paste) 불량 · 작업 환경 습도 변화',   cbBadgeCell('할증 +3% 적용', DC.green)],
          [{ v: 'Wave / L2-수삽',            bold: true }, { v: '96.5%', align: 'right', mono: true }, { v: '94.1%', align: 'right', mono: true, color: DC.amber, bold: true }, { v: '-2.4%p', align: 'right', mono: true, color: DC.amber }, { v: '    340', align: 'right', mono: true, color: DC.amber }, '노즐 마모 · 플럭스 적용량 편차',                  cbBadgeCell('할증 +2.5% 적용', DC.green)],
          [{ v: 'Assembly / L3-조립',        bold: true }, { v: '95.0%', align: 'right', mono: true }, { v: '91.8%', align: 'right', mono: true, color: DC.red, bold: true }, { v: '-3.2%p', align: 'right', mono: true, color: DC.red }, { v: '    485', align: 'right', mono: true, color: DC.red, bold: true }, '설비 노후 · 체결 토크 편차 (±10% 초과)',          cbBadgeCell('할증 +3.5% 적용', DC.green)],
          [{ v: 'Inspect / L4-검사',         bold: true }, { v: '97.0%', align: 'right', mono: true }, { v: '93.4%', align: 'right', mono: true, color: DC.red, bold: true }, { v: '-3.6%p', align: 'right', mono: true, color: DC.red }, { v: '    290', align: 'right', mono: true, color: DC.red, bold: true }, '검사원 숙련도 부족 · 기준 재조정 필요',           cbBadgeCell('교육 + 할증 적용', DC.amber)],
          [{ v: 'Packing / L5-포장',          bold: true }, { v: '99.0%', align: 'right', mono: true }, { v: '99.1%', align: 'right', mono: true, color: DC.green, bold: true }, { v: '+0.1%p', align: 'right', mono: true, color: DC.green }, { v: '      0', align: 'right', mono: true, color: DC.text3 }, '정상',                                              cbBadgeCell('유지',  DC.green)],
          [{ v: 'CNC / 가공 센터',            bold: true }, { v: '98.5%', align: 'right', mono: true }, { v: '96.8%', align: 'right', mono: true, color: DC.amber, bold: true }, { v: '-1.7%p', align: 'right', mono: true, color: DC.amber }, { v: '    145', align: 'right', mono: true, color: DC.amber }, '금형 마모 (Life 85% 초과)',                       cbBadgeCell('금형 교체 예정', DC.amber)],
          [{ v: 'Coating / 도장',             bold: true }, { v: '94.0%', align: 'right', mono: true }, { v: '92.0%', align: 'right', mono: true, color: DC.amber, bold: true }, { v: '-2.0%p', align: 'right', mono: true, color: DC.amber }, { v: '    220', align: 'right', mono: true, color: DC.amber }, '도료 배합 비율 편차',                             cbBadgeCell('할증 +2% 적용', DC.green)],
          [{ v: 'SMD (표면실장 2)',           bold: true }, { v: '97.5%', align: 'right', mono: true }, { v: '97.8%', align: 'right', mono: true, color: DC.green, bold: true }, { v: '+0.3%p', align: 'right', mono: true, color: DC.green }, { v: '      0', align: 'right', mono: true, color: DC.text3 }, '정상',                                              cbBadgeCell('유지',  DC.green)],
        ]}
        rowBg={[`${DC.red}14`, `${DC.amber}10`, `${DC.red}14`, `${DC.red}14`, 'transparent', `${DC.amber}10`, `${DC.amber}10`, 'transparent']}
      />
    </CBWrap>
  ),

  // ---- MN_24 물류/출하 연동 ----
  mn_logistics_sync: () => (
    <CBWrap header={<CBHead title="㉔ 물류/출하 연동 스케줄 (Logistics Sync)"
                           titleColor={DC.purple}
                           right={<CBBadge label="매칭률 88% · 지연 2건" color={DC.amber} />} />}>
      <CBTable
        cols={['출하번호', '생산 완료 예상', '출하 도크(Dock)', '배차 차량(Truck)', '차량 적재율', '도크 대기 예상', '매칭 상태']}
        colFlex={[1.2, 1.5, 1.1, 1.7, 1.4, 1.2, 1.2]}
        rows={[
          [{ v: 'SH-2026-001', mono: true, color: DC.cyan }, { v: '11/12 14:00', mono: true }, { v: 'D-01', bold: true, color: DC.green }, 'CJ-대한통운 80815 (11t)',    { v: ' 85%  ▓▓▓▓▓▓▓▓▓░', mono: true, color: DC.green }, { v: ' 30분 이내', align: 'right', mono: true, color: DC.green }, cbBadgeCell('정상',     DC.green)],
          [{ v: 'SH-2026-002', mono: true, color: DC.cyan }, { v: '11/13 09:30', mono: true }, { v: 'D-02', bold: true, color: DC.green }, 'HANJIN 2571 (15t)',          { v: ' 92%  ▓▓▓▓▓▓▓▓▓▓', mono: true, color: DC.green }, { v: ' 15분 이내', align: 'right', mono: true, color: DC.green }, cbBadgeCell('정상',     DC.green)],
          [{ v: 'SH-2026-003', mono: true, color: DC.cyan }, { v: '11/13 16:45', mono: true }, { v: 'D-01', bold: true, color: DC.amber }, 'ROKKISS 4411 (5t)',          { v: ' 78%  ▓▓▓▓▓▓▓▓░░', mono: true, color: DC.amber }, { v: ' 45분',     align: 'right', mono: true, color: DC.amber }, cbBadgeCell('도크 대기', DC.amber)],
          [{ v: 'SH-2026-004', mono: true, color: DC.cyan }, { v: '11/14 11:15', mono: true }, { v: 'D-03', bold: true, color: DC.green }, 'LOTTE GL 7392 (25t)',        { v: ' 95%  ▓▓▓▓▓▓▓▓▓▓', mono: true, color: DC.green }, { v: ' 즉시',      align: 'right', mono: true, color: DC.green }, cbBadgeCell('정상',     DC.green)],
          [{ v: 'SH-2026-005', mono: true, color: DC.cyan }, { v: '11/14 13:40', mono: true }, { v: 'D-02', bold: true, color: DC.red },   '(미배차)',                    { v: '  —  ░░░░░░░░░░', mono: true, color: DC.red },    { v: ' 60분+',    align: 'right', mono: true, color: DC.red }, cbBadgeCell('차량 미배차', DC.red)],
          [{ v: 'SH-2026-006', mono: true, color: DC.cyan }, { v: '11/15 08:00', mono: true }, { v: 'D-04', bold: true, color: DC.green }, 'CJ-대한통운 81234 (11t)',    { v: ' 88%  ▓▓▓▓▓▓▓▓▓░', mono: true, color: DC.green }, { v: ' 20분 이내', align: 'right', mono: true, color: DC.green }, cbBadgeCell('정상',     DC.green)],
          [{ v: 'SH-2026-007', mono: true, color: DC.cyan }, { v: '11/15 15:20', mono: true }, { v: 'D-03', bold: true, color: DC.amber }, 'HYUNDAI GL 5517 (8t)',       { v: ' 65%  ▓▓▓▓▓▓░░░░', mono: true, color: DC.amber }, { v: ' 40분',     align: 'right', mono: true, color: DC.amber }, cbBadgeCell('적재율 낮음', DC.amber)],
          [{ v: 'SH-2026-008', mono: true, color: DC.cyan }, { v: '11/16 10:00', mono: true }, { v: 'D-01', bold: true, color: DC.red },   '(배차 확인 중)',              { v: '  —  ░░░░░░░░░░', mono: true, color: DC.red },    { v: '미정',      align: 'right', mono: true, color: DC.red }, cbBadgeCell('긴급 배차 필요', DC.red)],
        ]}
        rowBg={['transparent', 'transparent', `${DC.amber}10`, 'transparent', `${DC.red}14`, 'transparent', `${DC.amber}10`, `${DC.red}14`]}
      />
    </CBWrap>
  ),

  // ---- MN_25 긴급 오더 (Hot Orders) ----
  mn_hot_orders: () => (
    <Box sx={{ flex: 1, bgcolor: DC.bg, display: 'flex', flexDirection: 'column',
               p: 0.4, gap: 0.3, minHeight: 0, border: `2px solid ${DC.red}`,
               boxShadow: `inset 0 0 20px ${DC.red}33` }}>
      {/* Flashing Header */}
      <Box sx={{ height: 16, display: 'flex', alignItems: 'center', flexShrink: 0, px: 0.3,
                 bgcolor: `${DC.red}22`, borderBottom: `1px solid ${DC.red}`, borderRadius: 0.3 }}>
        <Box sx={{ fontSize: 7, fontWeight: 700, color: DC.red }}>㉕ 🚨 긴급 오더 처리 현황 (Hot Orders)</Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 0.3, alignItems: 'center' }}>
          <Box sx={{ fontSize: 4.5, color: DC.red, fontWeight: 700, fontFamily: 'monospace' }}>
            ⏰ LIVE · 실시간 · 1분 갱신
          </Box>
          <CBBadge label="🔴 HOT! 6건" color={DC.red} />
        </Box>
      </Box>
      <CBTable
        cols={['긴급 발주(Hot PO)', '요청자(부서)', '투입 라인', '목표 수량', '실시간 진척률', '남은 납기 시간', '현재 상태']}
        colFlex={[1.3, 1.3, 1.3, 0.9, 1.7, 1.2, 1]}
        rows={[
          [{ v: 'HOT-2026-001', mono: true, color: DC.red, bold: true },   { v: '영업본부 / 김과장',  bold: true }, { v: 'L1-SMT',       bold: true }, { v: '500', align: 'right', mono: true }, { v: '██████████░░  85%', mono: true, color: DC.green }, { v: '  4시간 12분', align: 'right', mono: true, color: DC.amber, bold: true }, cbBadgeCell('가동중', DC.green)],
          [{ v: 'HOT-2026-002', mono: true, color: DC.red, bold: true },   { v: '영업본부 / 이차장',  bold: true }, { v: 'L3-Assembly', bold: true }, { v: '320', align: 'right', mono: true }, { v: '█████░░░░░░░  45%', mono: true, color: DC.amber }, { v: '  8시간 30분', align: 'right', mono: true, color: DC.amber, bold: true }, cbBadgeCell('가동중', DC.cyan)],
          [{ v: 'HOT-2026-003', mono: true, color: DC.red, bold: true },   { v: '생산기술 / 박팀장',  bold: true }, { v: 'L2-Wave',     bold: true }, { v: '180', align: 'right', mono: true }, { v: '███░░░░░░░░░  25%', mono: true, color: DC.red },   { v: ' 12시간 45분', align: 'right', mono: true, color: DC.amber }, cbBadgeCell('가동중', DC.cyan)],
          [{ v: 'HOT-2026-004', mono: true, color: DC.red, bold: true },   { v: '영업본부 / 최부장',  bold: true }, { v: 'L4-Inspect',  bold: true }, { v: '450', align: 'right', mono: true }, { v: '████████████ 100%', mono: true, color: DC.green }, { v: '  출하 완료',   align: 'right', mono: true, color: DC.green, bold: true }, cbBadgeCell('완료',   DC.green)],
          [{ v: 'HOT-2026-005', mono: true, color: DC.red, bold: true },   { v: '기획본부 / 정상무',  bold: true }, { v: 'L1-SMT',       bold: true }, { v: '200', align: 'right', mono: true }, { v: '█░░░░░░░░░░░  10%', mono: true, color: DC.red },   { v: '   1시간 55분', align: 'right', mono: true, color: DC.red, bold: true }, { v: '🚨 위험', color: DC.red, bold: true }],
          [{ v: 'HOT-2026-006', mono: true, color: DC.red, bold: true },   { v: '영업본부 / 홍대리',  bold: true }, { v: 'L5-Packing',  bold: true }, { v: '120', align: 'right', mono: true }, { v: '░░░░░░░░░░░░   0%', mono: true, color: DC.text3 },  { v: ' 24시간 00분', align: 'right', mono: true, color: DC.amber }, cbBadgeCell('대기',   DC.text2)],
        ]}
        rowBg={[`${DC.red}22`, `${DC.red}14`, `${DC.red}22`, `${DC.green}14`, `${DC.red}33`, `${DC.red}22`]}
      />
    </Box>
  ),

  // ---- MN_26 재작업(Rework) 오더 ----
  mn_rework_status: () => (
    <CBWrap header={<CBHead title="㉖ 재작업(Rework) 오더 발생 현황"
                           titleColor={DC.red}
                           right={<CBBadge label="RW 총 8건 · 비용 ₩12.5M" color={DC.red} />} />}>
      <CBTable
        cols={['재작업 지시(RW-WO)', '불량 원인 공정', '불량 세부 사유', '재작업 수량', '재작업 예상 비용', '투입 라인', '진행 상태']}
        colFlex={[1.4, 1.4, 2, 1, 1.2, 1.3, 1]}
        rows={[
          [{ v: 'RW-WO-26-001', mono: true, color: DC.red, bold: true }, { v: 'L1-SMT',       bold: true }, '솔더링 불량 (Tombstone)',          { v: '  120', align: 'right', mono: true }, { v: ' ₩3.2M',  align: 'right', mono: true, color: DC.red }, { v: 'L1-SMT',       bold: true }, cbBadgeCell('진행중', DC.blue)],
          [{ v: 'RW-WO-26-002', mono: true, color: DC.red, bold: true }, { v: 'L3-Assembly', bold: true }, '접합부 균열 (체결 토크 부족)',        { v: '   80', align: 'right', mono: true }, { v: ' ₩2.4M',  align: 'right', mono: true, color: DC.red }, { v: 'L3-Assembly', bold: true }, cbBadgeCell('완료',   DC.green)],
          [{ v: 'RW-WO-26-003', mono: true, color: DC.red, bold: true }, { v: 'L4-Inspect',  bold: true }, '치수 불량 (±0.1mm 초과)',            { v: '   50', align: 'right', mono: true }, { v: ' ₩1.5M',  align: 'right', mono: true, color: DC.red }, { v: 'CNC-02',       bold: true }, cbBadgeCell('대기',   DC.text2)],
          [{ v: 'RW-WO-26-004', mono: true, color: DC.red, bold: true }, { v: 'L2-Wave',      bold: true }, '플럭스 잔여물 과다 · 세척 필요',       { v: '  210', align: 'right', mono: true }, { v: ' ₩2.8M',  align: 'right', mono: true, color: DC.red }, { v: 'L2-Wave',      bold: true }, cbBadgeCell('진행중', DC.blue)],
          [{ v: 'RW-WO-26-005', mono: true, color: DC.red, bold: true }, { v: 'L1-SMT',       bold: true }, '부품 실장 오류 (Misalignment)',        { v: '   65', align: 'right', mono: true }, { v: ' ₩1.8M',  align: 'right', mono: true, color: DC.red }, { v: 'L1-SMT',       bold: true }, cbBadgeCell('완료',   DC.green)],
          [{ v: 'RW-WO-26-006', mono: true, color: DC.red, bold: true }, { v: 'Coating',       bold: true }, '도장 기포 발생 · 재도장',              { v: '   95', align: 'right', mono: true }, { v: ' ₩0.8M',  align: 'right', mono: true, color: DC.red }, { v: 'Coating',       bold: true }, cbBadgeCell('진행중', DC.blue)],
          [{ v: 'RW-WO-26-007', mono: true, color: DC.red, bold: true }, { v: 'L3-Assembly', bold: true }, '케이블 배선 오류',                    { v: '   40', align: 'right', mono: true }, { v: ' ₩0.5M',  align: 'right', mono: true, color: DC.red }, { v: 'L3-Assembly', bold: true }, cbBadgeCell('대기',   DC.text2)],
          [{ v: 'RW-WO-26-008', mono: true, color: DC.red, bold: true }, { v: 'L4-Inspect',  bold: true }, '기능 검사 불합격 (BGA 쇼트)',           { v: '  180', align: 'right', mono: true }, { v: ' ₩3.5M',  align: 'right', mono: true, color: DC.red }, { v: 'L1-SMT',       bold: true }, cbBadgeCell('진행중', DC.blue)],
        ]}
        rowBg={[`${DC.red}14`, `${DC.green}10`, 'transparent', `${DC.red}14`, `${DC.green}10`, `${DC.red}14`, 'transparent', `${DC.red}14`]}
      />
    </CBWrap>
  ),

  // ---- MN_27 안전재고 이탈 ----
  mn_safety_stock_alert: () => (
    <CBWrap header={<CBHead title="㉗ 안전재고(SS) 이탈 모니터링"
                           titleColor={DC.amber}
                           right={<CBBadge label="SS 이탈 임박: 8 SKU" color={DC.red} />} />}>
      <CBTable
        cols={['품목명 / SKU', '안전재고(SS)', '현재 예상재고', '이탈량', '잔여 재고일수(DOC)', '일일 소진율', '시스템 조치 상태']}
        colFlex={[2, 1.1, 1.1, 1, 1.4, 1.1, 1.5]}
        rows={[
          [{ v: '고성능 메인보드 V1',       bold: true }, { v: '  500', align: 'right', mono: true }, { v: '  450', align: 'right', mono: true, color: DC.amber, bold: true }, { v: '  -50', align: 'right', mono: true, color: DC.amber }, { v: ' 3일 이내', align: 'right', mono: true, color: DC.amber }, { v: '150 EA', align: 'right', mono: true }, cbBadgeCell('긴급 재발주', DC.amber)],
          [{ v: 'OLED 디스플레이 27"',      bold: true }, { v: '  300', align: 'right', mono: true }, { v: '  180', align: 'right', mono: true, color: DC.red, bold: true }, { v: ' -120', align: 'right', mono: true, color: DC.red }, { v: ' 1일 이내', align: 'right', mono: true, color: DC.red, bold: true }, { v: '180 EA', align: 'right', mono: true }, { v: '🚨 SUPL 콜', color: DC.red, bold: true }],
          [{ v: '마이크로컨트롤러 M4',       bold: true }, { v: '  800', align: 'right', mono: true }, { v: '  950', align: 'right', mono: true, color: DC.green, bold: true }, { v: ' +150', align: 'right', mono: true, color: DC.green }, { v: ' 7일 이내', align: 'right', mono: true, color: DC.green }, { v: '135 EA', align: 'right', mono: true }, cbBadgeCell('정상', DC.green)],
          [{ v: '하우징 프레임',              bold: true }, { v: '  200', align: 'right', mono: true }, { v: '  100', align: 'right', mono: true, color: DC.red, bold: true }, { v: ' -100', align: 'right', mono: true, color: DC.red }, { v: ' 2일 이내', align: 'right', mono: true, color: DC.red, bold: true }, { v: ' 50 EA', align: 'right', mono: true }, cbBadgeCell('긴급 재발주', DC.amber)],
          [{ v: '배터리 팩 5000mAh',         bold: true }, { v: '1,200', align: 'right', mono: true }, { v: '  720', align: 'right', mono: true, color: DC.red, bold: true }, { v: ' -480', align: 'right', mono: true, color: DC.red }, { v: ' 2일 이내', align: 'right', mono: true, color: DC.red, bold: true }, { v: '360 EA', align: 'right', mono: true }, { v: '🚨 SUPL 콜', color: DC.red, bold: true }],
          [{ v: '전원 모듈 800W',             bold: true }, { v: '  600', align: 'right', mono: true }, { v: '  580', align: 'right', mono: true, color: DC.amber, bold: true }, { v: '  -20', align: 'right', mono: true, color: DC.amber }, { v: ' 4일 이내', align: 'right', mono: true, color: DC.amber }, { v: '145 EA', align: 'right', mono: true }, cbBadgeCell('모니터링', DC.cyan)],
          [{ v: '정밀 센서 어셈블리',          bold: true }, { v: '  350', align: 'right', mono: true }, { v: '  420', align: 'right', mono: true, color: DC.green, bold: true }, { v: '  +70', align: 'right', mono: true, color: DC.green }, { v: ' 6일 이내', align: 'right', mono: true, color: DC.green }, { v: ' 70 EA', align: 'right', mono: true }, cbBadgeCell('정상', DC.green)],
          [{ v: 'BLDC 모터 유닛',               bold: true }, { v: '  500', align: 'right', mono: true }, { v: '  380', align: 'right', mono: true, color: DC.amber, bold: true }, { v: ' -120', align: 'right', mono: true, color: DC.amber }, { v: ' 3일 이내', align: 'right', mono: true, color: DC.amber }, { v: '125 EA', align: 'right', mono: true }, cbBadgeCell('긴급 재발주', DC.amber)],
        ]}
        rowBg={[`${DC.amber}14`, `${DC.red}22`, 'transparent', `${DC.red}14`, `${DC.red}22`, `${DC.amber}10`, 'transparent', `${DC.amber}14`]}
      />
    </CBWrap>
  ),

  // ---- MN_28 금형/치공구 스케줄 ----
  mn_tooling_mgmt: () => (
    <CBWrap header={<CBHead title="㉘ 금형/치공구 스케줄 (Tooling Mgmt)"
                           titleColor={DC.amber}
                           right={<CBBadge label="수명 임박 4건 · PM 2건" color={DC.amber} />} />}>
      <CBTable
        cols={['금형/치공구 ID', '장착 예정 라인', '대상 생산 품목', '사용 예정 일시', '누적 타발수 / 한계', '수명 사용률', '상태 / 알림']}
        colFlex={[1.2, 1.4, 1.7, 1.3, 1.5, 1.5, 1.4]}
        rows={[
          [{ v: 'TL-MLD-001', mono: true, color: DC.amber }, { v: 'L1-SMT',       bold: true }, '고성능 메인보드 V1',    { v: '11/11 08:00', mono: true }, { v: ' 12,450 / 15,000', align: 'right', mono: true },                    { v: ' 83%  ▓▓▓▓▓▓▓▓░░', mono: true, color: DC.amber }, cbBadgeCell('정상',       DC.green)],
          [{ v: 'TL-MLD-002', mono: true, color: DC.amber }, { v: 'L2-Wave',      bold: true }, 'OLED 디스플레이 27"',   { v: '11/12 09:30', mono: true }, { v: '  8,320 / 10,000', align: 'right', mono: true },                    { v: ' 83%  ▓▓▓▓▓▓▓▓░░', mono: true, color: DC.amber }, cbBadgeCell('정상',       DC.green)],
          [{ v: 'TL-MLD-003', mono: true, color: DC.amber }, { v: 'L3-Assembly', bold: true }, '마이크로컨트롤러 M4',     { v: '11/13 14:00', mono: true }, { v: ' 14,250 / 15,000', align: 'right', mono: true, color: DC.red }, { v: ' 95%  ▓▓▓▓▓▓▓▓▓▓', mono: true, color: DC.red }, { v: '🔴 교체 임박', color: DC.red, bold: true }],
          [{ v: 'TL-JIG-004', mono: true, color: DC.amber }, { v: 'L4-Inspect',  bold: true }, '하우징 프레임',          { v: '11/14 11:00', mono: true }, { v: '  9,550 / 10,000', align: 'right', mono: true, color: DC.red }, { v: ' 95%  ▓▓▓▓▓▓▓▓▓▓', mono: true, color: DC.red }, { v: '🔴 교체 임박', color: DC.red, bold: true }],
          [{ v: 'TL-MLD-005', mono: true, color: DC.amber }, { v: 'L2-Wave',      bold: true }, '배터리 팩 하우징',       { v: '11/15 08:00', mono: true }, { v: '  5,680 /  8,000', align: 'right', mono: true },                    { v: ' 71%  ▓▓▓▓▓▓▓░░░', mono: true, color: DC.green }, cbBadgeCell('정상',       DC.green)],
          [{ v: 'TL-JIG-006', mono: true, color: DC.amber }, { v: 'CNC-01',       bold: true }, '알루미늄 하우징',        { v: '11/16 13:00', mono: true }, { v: ' 18,200 / 20,000', align: 'right', mono: true, color: DC.amber }, { v: ' 91%  ▓▓▓▓▓▓▓▓▓░', mono: true, color: DC.amber }, { v: '⚠ PM 예정 11/18', color: DC.amber }],
          [{ v: 'TL-MLD-007', mono: true, color: DC.amber }, { v: 'L5-Packing',  bold: true }, '포장 박스 프레임',       { v: '11/17 09:00', mono: true }, { v: '  3,450 /  8,000', align: 'right', mono: true },                    { v: ' 43%  ▓▓▓▓░░░░░░', mono: true, color: DC.green }, cbBadgeCell('정상',       DC.green)],
          [{ v: 'TL-JIG-008', mono: true, color: DC.amber }, { v: 'CNC-02',       bold: true }, '정밀 샤프트',            { v: '11/18 10:00', mono: true }, { v: ' 11,850 / 12,000', align: 'right', mono: true, color: DC.red }, { v: ' 99%  ▓▓▓▓▓▓▓▓▓▓', mono: true, color: DC.red }, { v: '🚨 즉시 교체', color: DC.red, bold: true }],
        ]}
        rowBg={['transparent', 'transparent', `${DC.red}22`, `${DC.red}22`, 'transparent', `${DC.amber}14`, 'transparent', `${DC.red}22`]}
      />
    </CBWrap>
  ),

  // ---- MN_29 계획 버전별 비교 ----
  mn_version_diff: () => (
    <CBWrap header={<CBHead title="㉙ 계획 버전별 비교 조회 (Version Diff)"
                           titleColor={DC.blue}
                           right={<CBBadge label="v1.0 ➔ v1.1 · 2026-11-08" color={DC.purple} />} />}>
      <CBTable
        cols={['비교 항목 (KPI / Metric)', 'v1.0 (어제 확정본)', 'v1.1 (오늘 보정본)', 'Δ 차이', '차이(Diff) 상세 분석 내역']}
        colFlex={[2.1, 1.3, 1.3, 0.9, 3]}
        rows={[
          ['납기 준수율 (Due Date Compliance)',  { v: ' 92.0%',    align: 'right', mono: true }, { v: ' 94.2%',    align: 'right', mono: true, color: DC.green, bold: true }, { v: '▲ +2.2%p', align: 'right', mono: true, color: DC.green }, 'AI 셋업 최적화로 교체 손실 축소 · 라인 전환 3건'],
          ['평균 재고 금액 (Avg Inventory Value)',{ v: ' ₩1.20M',   align: 'right', mono: true }, { v: ' ₩1.10M',   align: 'right', mono: true, color: DC.green, bold: true }, { v: '▼ -₩0.10M',align: 'right', mono: true, color: DC.green }, '잠금 해제 재계산 + 안전재고 하한 조정'],
          ['총 생산 계획량 (EA)',                 { v: '45,000',    align: 'right', mono: true }, { v: '46,500',    align: 'right', mono: true, color: DC.green, bold: true }, { v: '▲ +1,500',align: 'right', mono: true, color: DC.green }, 'L3 야간 가동 추가 · PO-0994 수량 +320'],
          ['총 제조 원가 (Total Cost)',           { v: ' ₩2.40B',   align: 'right', mono: true }, { v: ' ₩2.45B',   align: 'right', mono: true, color: DC.red, bold: true }, { v: '▲ +₩0.05B',align: 'right', mono: true, color: DC.red }, '외주 가공 비용 +₩7M · 원자재 단가 상승'],
          ['지연 오더 수 (Late Orders)',          { v: '    38',    align: 'right', mono: true }, { v: '    12',    align: 'right', mono: true, color: DC.green, bold: true }, { v: '▼ -26',   align: 'right', mono: true, color: DC.green }, '긴급 오더 3건 대응 + B공장 이관 3건'],
          ['설비 가동률 (OEE)',                    { v: ' 78.5%',    align: 'right', mono: true }, { v: ' 82.5%',    align: 'right', mono: true, color: DC.green, bold: true }, { v: '▲ +4.0%p', align: 'right', mono: true, color: DC.green }, 'Heijunka 평준화 · L3 병목 해소'],
          ['외주 가공 비용 (Subcontracting)',      { v: ' ₩45.0M',   align: 'right', mono: true }, { v: ' ₩52.0M',   align: 'right', mono: true, color: DC.red, bold: true }, { v: '▲ +₩7.0M', align: 'right', mono: true, color: DC.red }, '성일정밀 추가 의뢰 3건 · 품질 합격률 98.9%'],
          ['엔진 Runtime (계산 시간)',             { v: '  2m 45s',  align: 'right', mono: true }, { v: '  3m 12s',  align: 'right', mono: true, color: DC.red }, { v: '▲ +27s',  align: 'right', mono: true, color: DC.red }, '제약 조건 추가 (납기 페널티 가중치 +20%)'],
          ['잔존 리스크 (Risk Score)',              { v: '  High',    align: 'right', mono: true, color: DC.red }, { v: '  Low',     align: 'right', mono: true, color: DC.green, bold: true }, { v: '▼ 2단계',  align: 'right', mono: true, color: DC.green }, { v: '납기 리스크 -₩20M 절감 예상', color: DC.green }],
        ]}
        rowBg={[`${DC.green}10`, `${DC.green}10`, `${DC.green}10`, `${DC.red}10`, `${DC.green}14`, `${DC.green}10`, `${DC.red}10`, `${DC.red}10`, `${DC.green}14`]}
      />
    </CBWrap>
  ),

  // ---- MN_30 경영진 요약 리포트 ----
  mn_exec_summary: () => (
    <CBWrap header={<CBHead title="㉚ 경영진 요약 리포트 (Executive Summary)"
                           titleColor={DC.purple}
                           right={
                             <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'center' }}>
                               <CBBadge label="SCM Plan v1.1 · 2026-11-08" color={DC.purple} />
                               <CBBtn label="PDF 다운로드 ⬇" color={DC.text2} />
                             </Box>
                           } />}>
      {/* Top: Commentary + KPI cards */}
      <Box sx={{ display: 'flex', gap: 0.3, flexShrink: 0, mb: 0.2 }}>
        {/* Commentary box */}
        <Box sx={{ flex: 1.6, bgcolor: `${DC.blue}14`, border: `1px solid ${DC.blue}`, borderRadius: 0.3,
                   p: 0.35, display: 'flex', flexDirection: 'column', gap: 0.15 }}>
          <Box sx={{ fontSize: 6, color: DC.blue, fontWeight: 700 }}>📌 SCM Plan v1.1 요약 코멘트</Box>
          <Box sx={{ fontSize: 4.5, color: DC.text, lineHeight: '7px' }}>
            금일 보정된 계획안은 <Box component="span" sx={{ color: DC.purple, fontWeight: 700 }}>AI 셋업 최적화</Box>와 일부 <Box component="span" sx={{ color: DC.cyan, fontWeight: 700 }}>외주 이관</Box>을 통해 납기 준수율을 <Box component="span" sx={{ color: DC.green, fontWeight: 700 }}>94.2%</Box>로 대폭 상향시켰습니다.
            이에 따라 외주 가공비가 <Box component="span" sx={{ color: DC.red, fontWeight: 700 }}>₩7M 증가</Box>하였으나, 전체 지연 페널티 리스크 대비 <Box component="span" sx={{ color: DC.green, fontWeight: 700 }}>₩20M 이상의 순비용 절감 효과</Box>가 기대됩니다.
            L3 조립 라인의 병목은 <Box component="span" sx={{ color: DC.cyan, fontWeight: 700 }}>야간 가동 및 평준화(Heijunka)</Box>로 해소되었습니다.
          </Box>
        </Box>
        {/* 2 KPI cards */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.2 }}>
          <Box sx={{ flex: 1, bgcolor: DC.surface, border: `1px solid ${DC.cyan}44`, borderRadius: 0.3, p: 0.3,
                     display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Box sx={{ fontSize: 4.5, color: DC.text3 }}>예상 매출 기여액 (Revenue)</Box>
            <Box sx={{ fontSize: 10, color: DC.cyan, fontWeight: 700, fontFamily: 'monospace', lineHeight: '12px' }}>₩ 14.5 B</Box>
            <Box sx={{ fontSize: 4, color: DC.green, fontWeight: 700 }}>▲ 전월 +8.2%</Box>
          </Box>
          <Box sx={{ flex: 1, bgcolor: DC.surface, border: `1px solid ${DC.red}44`, borderRadius: 0.3, p: 0.3,
                     display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Box sx={{ fontSize: 4.5, color: DC.text3 }}>잔존 납기/결품 리스크</Box>
            <Box sx={{ fontSize: 10, color: DC.red, fontWeight: 700, fontFamily: 'monospace', lineHeight: '12px' }}>3 건</Box>
            <Box sx={{ fontSize: 4, color: DC.amber }}>Hot PO 감시 중 · 임원 결재 대기</Box>
          </Box>
        </Box>
      </Box>
      <CBTable
        cols={['핵심 전략 과제 (Strategic Focus)', '세부 내용 및 기대 효과', '담당 부서', 'Owner', '기한', '상태']}
        colFlex={[2, 2.9, 1.1, 1, 0.9, 1]}
        rows={[
          [{ v: '① AI 셋업 최적화', bold: true, color: DC.purple }, '유사 스펙 로트 그룹핑 → 교체 시간 180→55분, ₩5M 절감', { v: 'IT-AI',  bold: true }, '박AI 팀장',  { v: '11/15', mono: true }, cbBadgeCell('완료',   DC.green)],
          [{ v: '② 외주 가공 이관', bold: true, color: DC.cyan },   '캐파 과부하 품목 8건 → 4개 협력사 분산, 납기 확보',       { v: 'SCM',    bold: true }, '이SCM 차장', { v: '11/20', mono: true }, cbBadgeCell('진행중', DC.blue)],
          [{ v: '③ Heijunka 평준화', bold: true, color: DC.green }, 'L3 일일 부하 ±8% 이내 유지, 야간조 증설',               { v: 'Prod',   bold: true }, '최Prod 상무',{ v: '11/18', mono: true }, cbBadgeCell('진행중', DC.blue)],
          [{ v: '④ Alt-Part 스왑',   bold: true, color: DC.amber }, '결품 자재 6종 대체 부품 전환, SS 리스크 해소',           { v: 'MDM',    bold: true }, '정MDM 부장', { v: '11/22', mono: true }, cbBadgeCell('계획',   DC.text2)],
          [{ v: '⑤ Hot Order 대응',  bold: true, color: DC.red },   '영업 긴급 요청 6건 실시간 처리, 납기 카운트다운',        { v: '영업',   bold: true }, '김영업 본부장',{ v: '11/10', mono: true }, cbBadgeCell('진행중', DC.blue)],
          [{ v: '⑥ ESG/Carbon 감축',  bold: true, color: DC.green }, '심야 시간대 15% 이전 + 대체 에너지 32%, ₩12.5M 절감',   { v: 'ESG',    bold: true }, '홍ESG 상무', { v: '11/30', mono: true }, cbBadgeCell('계획',   DC.text2)],
        ]}
      />
    </CBWrap>
  ),

});

// =====================================================================
// RouteLayout 렌더러 — 다크 테마, 3개 RL_* 레이아웃 (Sample Data 포함)
//   실 HTML 동일한 샘플: Factories(F1/F2), 5개 Line, 6개 Storage,
//   다수 Equipment, Routing Flow 2개(cyan/amber), CNC 4 stacked 등.
// =====================================================================

// 실제 HTML 과 동일한 샘플 데이터
const RL_SAMPLE = {
  factories: [
    { id: 'F1', name: '창원 제1공장', active: true,
      floors: [
        { id: 'F1-L1', name: '1층 메인 생산동', active: true },
        { id: 'F1-L2', name: '2층 정밀 가공실', active: false },
      ] },
    { id: 'F2', name: '평택 SMT 센터', active: false,
      floors: [
        { id: 'F2-L1', name: '1층 SMT 전용라인', active: false },
      ] },
  ],
  // 미리보기 캔버스(내부 % 좌표)에 재배치 — 실제 Layout 구조 보존
  // Flow 1 (cyan): W-RAW → L-SMT → W-WIP1 → L-ASSY → L-PKG → W-FG
  // Flow 2 (amber): W-RAW → L-CNC → W-WIP2 → L-INSP → W-FG
  canvasItems: [
    { type: 'storage', id: 'W-RAW',  name: '원자재',  icon: '🏭', x: 1,  y: 20, w: 8,  h: 40, color: DC.amber },
    { type: 'line',    id: 'L-SMT',  name: 'SMT',   x: 11, y: 10, w: 22, h: 22, color: DC.blue,
      eqps: [{ id:'LDR',i:'📥' }, { id:'PRT',i:'🖨️' }, { id:'MNT',i:'🦾' }, { id:'RFL',i:'🔥' }, { id:'AOI',i:'🔍' }] },
    { type: 'storage', id: 'W-WIP1', name: 'WIP1', icon: '🗄️', x: 35, y: 12, w: 5,  h: 22, color: DC.amber },
    { type: 'line',    id: 'L-ASSY', name: 'ASSY',  x: 42, y: 8,  w: 18, h: 26, color: DC.blue,
      eqps: [{ id:'CVY',i:'🛤️' }, { id:'RBT',i:'🤖' }, { id:'RBT',i:'🤖' }, { id:'WRK',i:'🧑‍🔧' }] },
    { type: 'line',    id: 'L-PKG',  name: 'PKG',   x: 62, y: 12, w: 14, h: 22, color: DC.blue,
      eqps: [{ id:'PKG',i:'📦' }, { id:'LBL',i:'🏷️' }, { id:'CVY',i:'🛤️' }] },
    { type: 'storage', id: 'W-FG',   name: '완제품', icon: '📦', x: 91, y: 18, w: 8,  h: 55, color: DC.amber },
    { type: 'storage', id: 'W-TOOL', name: '치공구', icon: '🧰', x: 1,  y: 74, w: 8,  h: 22, color: DC.amber },
    { type: 'line',    id: 'L-CNC',  name: 'CNC', stacked: 4, bottleneck: true,
      x: 11, y: 62, w: 18, h: 30, color: DC.blue,
      eqps: [{ id:'CNC',i:'⚙️' }, { id:'CNC',i:'⚙️' }, { id:'CNC',i:'⚙️' }, { id:'CNC',i:'⚙️' }, { id:'WRK',i:'🧑‍🔧' }] },
    { type: 'storage', id: 'W-WIP2', name: 'WIP2', icon: '🗄️', x: 31, y: 64, w: 5,  h: 22, color: DC.amber },
    { type: 'line',    id: 'L-INSP', name: 'INSP',  x: 38, y: 62, w: 14, h: 25, color: DC.blue,
      eqps: [{ id:'AOI',i:'🔍' }, { id:'WRK',i:'🧑‍🔧' }] },
    { type: 'storage', id: 'W-RWK',  name: 'Rework', icon: '♻️', x: 62, y: 68, w: 10, h: 22, color: DC.amber },
    // 흩어진 Equipment
    { type: 'eqp', id: 'AGV1', i: '🛒', x: 10, y: 52 },
    { type: 'eqp', id: 'AGV2', i: '🛒', x: 40, y: 50 },
    { type: 'eqp', id: 'AGV3', i: '🛒', x: 58, y: 48 },
    { type: 'eqp', id: 'AGV4', i: '🛒', x: 77, y: 52 },
    { type: 'eqp', id: 'RCK',  i: '🗃️', x: 28, y: 88, stacked: 3 },
  ],
  // Flow 라인 연결 (from → to 의 canvas coord 퍼센트)
  flows: [
    // cyan flow — SMT route
    { color: DC.cyan,  path: [[9,40],[11,21]] },   // W-RAW → L-SMT
    { color: DC.cyan,  path: [[33,21],[35,23]] },  // L-SMT → W-WIP1
    { color: DC.cyan,  path: [[40,23],[42,21]] },  // W-WIP1 → L-ASSY
    { color: DC.cyan,  path: [[60,21],[62,23]] },  // L-ASSY → L-PKG
    { color: DC.cyan,  path: [[76,23],[91,45]] },  // L-PKG → W-FG
    // amber flow — CNC route
    { color: DC.amber, path: [[9,35],[11,77]] },   // W-RAW → L-CNC
    { color: DC.amber, path: [[29,77],[31,75]] },  // L-CNC → W-WIP2
    { color: DC.amber, path: [[36,75],[38,74]] },  // W-WIP2 → L-INSP
    { color: DC.amber, path: [[52,74],[91,55]] },  // L-INSP → W-FG
  ],
};

// 캔버스 아이템 — Line 블록
function RLCanvasLine({ item, ledMap, showLed, showBottleneck }) {
  return (
    <Box sx={{
      position: 'absolute',
      left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%`, height: `${item.h}%`,
      border: `1px dashed ${item.color}88`,
      bgcolor: `${item.color}11`,
      borderRadius: 0.3, boxShadow: `inset 0 0 4px ${item.color}33`,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Label bar */}
      <Box sx={{ bgcolor: `${item.color}33`, color: item.color, fontSize: 3.5, fontWeight: 700,
                 px: 0.2, py: 0.05, lineHeight: '6px',
                 display: 'flex', justifyContent: 'space-between' }}>
        <span>{item.name}</span>
        <span style={{ opacity: 0.6, fontSize: 3 }}>{item.id}</span>
      </Box>
      {/* Equipment row */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-around',
                 gap: 0.1, px: 0.2, py: 0.1, position: 'relative' }}>
        {item.eqps.map((e, i) => {
          const ledKey = `${item.id}-${i}`;
          const led = ledMap?.[ledKey];
          return (
            <Box key={i} sx={{ position: 'relative',
                               width: item.stacked && i < 4 ? 7 : 8,
                               height: 8,
                               marginLeft: item.stacked && i > 0 && i < 4 ? '-5px' : 0,
                               bgcolor: DC.surface3, borderRadius: 0.2,
                               border: `1px solid ${showBottleneck && item.bottleneck ? DC.red : DC.border2}`,
                               display: 'flex', alignItems: 'center', justifyContent: 'center',
                               fontSize: 5,
                               boxShadow: item.stacked && i < 4 ? '1px 1px 1px rgba(0,0,0,.4)' : 'none',
                               zIndex: i }}>
              {e.i}
              {showLed && led && (
                <Box sx={{ position:'absolute', top:-1, right:-1, width:2.5, height:2.5, borderRadius:'50%',
                           bgcolor: led,
                           boxShadow: `0 0 3px ${led}`,
                           border: `1px solid ${DC.surface}`,
                           animation: led === DC.red ? 'blink 1s infinite' : 'none' }} />
              )}
            </Box>
          );
        })}
      </Box>
      {/* stacked badge */}
      {item.stacked && (
        <Box sx={{ position: 'absolute', top: -3, left: -3, width: 8, height: 8, borderRadius: '50%',
                   bgcolor: DC.red, color: '#fff', fontSize: 4, fontWeight: 700,
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   border: `1px solid ${DC.surface}`, boxShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
          {item.stacked}
        </Box>
      )}
      {/* bottleneck badge */}
      {showBottleneck && item.bottleneck && (
        <Box sx={{ position: 'absolute', bottom: -5, left: 0, right: 0, textAlign: 'center' }}>
          <Box sx={{ display: 'inline-block',
                     bgcolor: `${DC.red}44`, color: DC.red, border: `1px solid ${DC.red}`,
                     borderRadius: 0.2, fontSize: 3.5, px: 0.3, py: 0.05, fontWeight: 700 }}>
            ⚠ 대기 5건
          </Box>
        </Box>
      )}
    </Box>
  );
}

function RLCanvasStorage({ item }) {
  return (
    <Box sx={{
      position: 'absolute',
      left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%`, height: `${item.h}%`,
      border: `1px dashed ${item.color}88`,
      bgcolor: `${item.color}11`,
      borderRadius: 0.3, boxShadow: `inset 0 0 4px ${item.color}33`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0,
                 bgcolor: `${item.color}33`, color: item.color, fontSize: 3.5, fontWeight: 700,
                 px: 0.2, py: 0.05, lineHeight: '6px' }}>
        {item.id}
      </Box>
      <Box sx={{ fontSize: 10, opacity: 0.35, mt: 0.6 }}>{item.icon}</Box>
    </Box>
  );
}

function RLCanvasEqp({ item }) {
  return (
    <Box sx={{
      position: 'absolute',
      left: `${item.x}%`, top: `${item.y}%`, width: 10, height: 10,
      bgcolor: DC.surface3, borderRadius: 0.2, border: `1px solid ${DC.border2}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 6, zIndex: 4,
      boxShadow: item.stacked ? '-1px -1px 2px rgba(0,0,0,.4), 1px 1px 2px rgba(0,0,0,.3)' : 'none',
    }}>
      {item.i}
      {item.stacked && (
        <Box sx={{ position: 'absolute', top: -2, left: -2, width: 6, height: 6, borderRadius: '50%',
                   bgcolor: DC.red, color: '#fff', fontSize: 3.5, fontWeight: 700,
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   border: `1px solid ${DC.surface}` }}>{item.stacked}</Box>
      )}
    </Box>
  );
}

function RLFlows({ flows }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none"
         style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                   pointerEvents: 'none', zIndex: 2 }}>
      <defs>
        <marker id="rl-arrow-c" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto">
          <polygon points="0 0, 5 2, 0 4" fill={DC.cyan} />
        </marker>
        <marker id="rl-arrow-a" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto">
          <polygon points="0 0, 5 2, 0 4" fill={DC.amber} />
        </marker>
      </defs>
      {flows.map((f, i) => {
        const [[x1, y1], [x2, y2]] = f.path;
        const dx = Math.abs(x2 - x1);
        const cx1 = x1 + Math.max(dx / 2, 3);
        const cx2 = x2 - Math.max(dx / 2, 3);
        const pathData = `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
        const marker = f.color === DC.cyan ? 'rl-arrow-c' : 'rl-arrow-a';
        return (
          <path key={i} d={pathData} fill="none" stroke={f.color} strokeWidth="0.7"
                strokeDasharray="2,1.5" opacity="0.8" markerEnd={`url(#${marker})`}
                style={{ filter: `drop-shadow(0 0 1px ${f.color})` }} />
        );
      })}
    </svg>
  );
}

function RLCanvas({ showLed = false, showBottleneck = false, showTooltip = false, showFlow = true }) {
  const ledMap = showLed ? {
    'L-SMT-0': DC.green, 'L-SMT-1': DC.green, 'L-SMT-2': DC.red, 'L-SMT-3': DC.green, 'L-SMT-4': DC.green,
    'L-ASSY-0': DC.green, 'L-ASSY-1': DC.amber, 'L-ASSY-2': DC.green, 'L-ASSY-3': DC.green,
    'L-PKG-0': DC.green, 'L-PKG-1': DC.green, 'L-PKG-2': DC.green,
    'L-CNC-0': DC.amber, 'L-CNC-1': DC.amber, 'L-CNC-2': DC.amber, 'L-CNC-3': DC.amber, 'L-CNC-4': DC.amber,
    'L-INSP-0': DC.green, 'L-INSP-1': DC.green,
  } : null;

  return (
    <Box sx={{ flex: 1, position: 'relative',
               bgcolor: DC.bg,
               backgroundImage: `linear-gradient(${DC.border}44 1px, transparent 1px),
                                 linear-gradient(90deg, ${DC.border}44 1px, transparent 1px)`,
               backgroundSize: '8px 8px',
               overflow: 'hidden', minHeight: 0, minWidth: 0 }}>
      {showFlow && <RLFlows flows={RL_SAMPLE.flows} />}
      {RL_SAMPLE.canvasItems.map((item, i) => {
        if (item.type === 'line')    return <RLCanvasLine    key={i} item={item} ledMap={ledMap} showLed={showLed} showBottleneck={showBottleneck} />;
        if (item.type === 'storage') return <RLCanvasStorage key={i} item={item} />;
        if (item.type === 'eqp')     return <RLCanvasEqp     key={i} item={item} />;
        return null;
      })}
      {showTooltip && (
        <Box sx={{ position: 'absolute', left: '30%', top: '18%',
                   bgcolor: 'rgba(17, 24, 39, 0.95)',
                   border: `1px solid ${DC.cyan}`, borderRadius: 0.4, p: 0.3,
                   boxShadow: `0 0 6px ${DC.cyan}88`,
                   width: 80, zIndex: 100, fontSize: 4 }}>
          <Box sx={{ color: DC.cyan, fontWeight: 700, fontSize: 4.5, mb: 0.1 }}>🔍 Mounter</Box>
          <Box sx={{ color: DC.text2 }}>WO-2604-0012</Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2, mt: 0.15 }}>
            <Box sx={{ flex: 1, height: 2, bgcolor: DC.surface3, borderRadius: 1, overflow: 'hidden' }}>
              <Box sx={{ width: '85%', height: '100%', bgcolor: DC.green }} />
            </Box>
            <Box sx={{ color: DC.green, fontWeight: 700 }}>85%</Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.2, mt: 0.2 }}>
            <Box sx={{ bgcolor: DC.surface3, p: 0.15, borderRadius: 0.15, flex: 1, textAlign: 'center' }}>
              <Box sx={{ fontSize: 3, color: DC.text3 }}>가동률</Box>
              <Box sx={{ color: DC.green, fontWeight: 700 }}>92%</Box>
            </Box>
            <Box sx={{ bgcolor: DC.surface3, p: 0.15, borderRadius: 0.15, flex: 1, textAlign: 'center' }}>
              <Box sx={{ fontSize: 3, color: DC.text3 }}>불량률</Box>
              <Box sx={{ color: DC.amber, fontWeight: 700 }}>1.2%</Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

function RLTreePanel({ highlight = 'F1-L1', extraFilters = true }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Filter bar */}
      {extraFilters && (
        <Box sx={{ bgcolor: DC.surface, borderBottom: `1px solid ${DC.border}`,
                   p: 0.2, display: 'flex', flexDirection: 'column', gap: 0.1, flexShrink: 0 }}>
          {['사업장', '공장동', '공정'].map((f) => (
            <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
              <Box sx={{ fontSize: 3.5, color: DC.text3, width: 15 }}>{f}</Box>
              <Box sx={{ flex: 1, bgcolor: DC.surface3, borderRadius: 0.2, height: 5, border: `1px solid ${DC.border}` }} />
            </Box>
          ))}
          <Box sx={{ display: 'flex', gap: 0.2, mt: 0.1 }}>
            <Box sx={{ flex: 1, bgcolor: `${DC.blue}22`, color: DC.blue, border: `1px solid ${DC.blue}55`,
                       borderRadius: 0.2, fontSize: 3.5, textAlign: 'center', py: 0.1, fontWeight: 700 }}>🔍 조회</Box>
            <Box sx={{ bgcolor: DC.surface3, color: DC.text3, borderRadius: 0.2,
                       fontSize: 3.5, px: 0.3, py: 0.1 }}>↺</Box>
          </Box>
        </Box>
      )}
      <Box sx={{ px: 0.2, py: 0.2, bgcolor: DC.surface, borderBottom: `1px solid ${DC.border}`,
                 fontSize: 4, color: DC.text, fontWeight: 700, flexShrink: 0 }}>
        도면 계층 트리
      </Box>
      <Box sx={{ p: 0.2, flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {RL_SAMPLE.factories.map((f) => (
          <Box key={f.id}>
            <Box sx={{ fontSize: 4, color: DC.text, fontWeight: 700, mt: 0.2, mb: 0.1 }}>
              🏢 {f.name}
            </Box>
            {f.floors.map((fl) => {
              const isActive = fl.id === highlight;
              return (
                <Box key={fl.id} sx={{
                  pl: 0.4, ml: 0.2, borderLeft: `1px solid ${DC.border2}`,
                  py: 0.05,
                }}>
                  <Box sx={{
                    fontSize: 3.8,
                    color: isActive ? DC.cyan : DC.text3,
                    bgcolor: isActive ? `${DC.cyan}22` : 'transparent',
                    border: isActive ? `1px solid ${DC.cyan}55` : '1px solid transparent',
                    borderRadius: 0.15, px: 0.2, py: 0.1,
                    fontWeight: isActive ? 700 : 400,
                  }}>
                    📄 {fl.name}
                  </Box>
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function RLPalettePanel() {
  const tabs = ['라인', '창고', '설비'];
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box sx={{ display: 'flex', borderBottom: `1px solid ${DC.border}`, flexShrink: 0, bgcolor: DC.surface }}>
        {tabs.map((t, i) => (
          <Box key={t} sx={{
            flex: 1, textAlign: 'center', fontSize: 3.8, py: 0.2,
            color: i === 0 ? DC.cyan : DC.text3,
            borderBottom: i === 0 ? `1.5px solid ${DC.cyan}` : 'none',
            fontWeight: 700,
          }}>{t}</Box>
        ))}
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', p: 0.2,
                 display: 'flex', flexDirection: 'column', gap: 0.15 }}>
        {[
          { icon: '🟦', name: 'SMT 표면실장',    id: 'L-SMT' },
          { icon: '🟦', name: '메인 조립 라인',   id: 'L-ASSY' },
          { icon: '🟦', name: 'CNC 가공',       id: 'L-CNC' },
          { icon: '🟦', name: '품질 검사',       id: 'L-INSP' },
          { icon: '🟦', name: '포장 출하',       id: 'L-PKG' },
        ].map((p, i) => (
          <Box key={i} sx={{
            bgcolor: DC.surface, border: `1px solid ${DC.border2}`, borderRadius: 0.3,
            p: 0.2, display: 'flex', alignItems: 'center', gap: 0.25,
            boxShadow: '0 1px 2px rgba(0,0,0,.3)',
          }}>
            <Box sx={{ width: 9, height: 9, bgcolor: DC.surface3, borderRadius: 0.2,
                       display: 'flex', alignItems: 'center', justifyContent: 'center',
                       fontSize: 6, color: DC.cyan, border: `1px solid ${DC.cyan}55` }}>
              {p.icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ fontSize: 4, color: DC.text, fontWeight: 700,
                         whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</Box>
              <Box sx={{ fontSize: 3, color: DC.text3, fontFamily: 'monospace' }}>{p.id}</Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function RLWipPanel({ showErr = false }) {
  const wos = [
    { id: 'WO-2604-0001', item: '메인보드 V1',      qty: 2500, rate: 95, status: 'run'  },
    { id: 'WO-2604-0002', item: 'OLED 27"',        qty: 1200, rate: 65, status: 'run'  },
    { id: 'WO-2604-0003', item: 'MCU STM32',       qty: 4500, rate: 100, status: 'done' },
    { id: 'WO-2604-0004', item: '배터리 5000mAh', qty:  800, rate: 42, status: showErr ? 'err' : 'run' },
    { id: 'WO-2604-0005', item: '센서 어셈블리',   qty: 3000, rate:  0, status: 'wait' },
  ];
  const statusColor = { run: DC.green, wait: DC.amber, done: DC.blue, err: DC.red };
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box sx={{ bgcolor: DC.surface, borderBottom: `1px solid ${DC.border}`,
                 p: 0.25, flexShrink: 0 }}>
        <Box sx={{ fontSize: 4.5, color: DC.cyan, fontWeight: 700 }}>창원 제1공장 1층</Box>
        <Box sx={{ fontSize: 3.5, color: DC.text3, mb: 0.2 }}>전체 구역 실시간 WIP</Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.15 }}>
          {[
            { l: '총WO',  v: '45', c: DC.text  },
            { l: '진행',  v: '12', c: DC.green },
            { l: '대기',  v: '8',  c: DC.amber },
            { l: '완료',  v: '25', c: DC.blue  },
          ].map((k, i) => (
            <Box key={i} sx={{ bgcolor: DC.surface3, borderRadius: 0.2, p: 0.1, textAlign: 'center' }}>
              <Box sx={{ fontSize: 3, color: DC.text3 }}>{k.l}</Box>
              <Box sx={{ fontSize: 6, color: k.c, fontWeight: 700, fontFamily: 'monospace' }}>{k.v}</Box>
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', p: 0.2,
                 display: 'flex', flexDirection: 'column', gap: 0.15 }}>
        {wos.map((wo) => {
          const c = statusColor[wo.status];
          return (
            <Box key={wo.id} sx={{
              bgcolor: DC.surface, border: `1px solid ${c}44`, borderLeft: `2px solid ${c}`,
              borderRadius: 0.2, p: 0.2,
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ fontSize: 3.5, fontFamily: 'monospace', color: DC.text, fontWeight: 700 }}>{wo.id}</Box>
                <Box sx={{ fontSize: 3, color: c, fontWeight: 700 }}>{wo.status.toUpperCase()}</Box>
              </Box>
              <Box sx={{ fontSize: 3, color: DC.text2, mt: 0.05 }}>{wo.item}</Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2, mt: 0.1 }}>
                <Box sx={{ flex: 1, height: 2, bgcolor: DC.surface3, borderRadius: 1, overflow: 'hidden' }}>
                  <Box sx={{ width: `${wo.rate}%`, height: '100%', bgcolor: c }} />
                </Box>
                <Box sx={{ fontSize: 3, color: c, fontWeight: 700 }}>{wo.rate}%</Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function RLTimelineBar({ simTime = '2026-04-15 08:00', progressPct = 8, playing = false, withScale = true }) {
  return (
    <Box sx={{ height: 16, flexShrink: 0, bgcolor: DC.surface,
               borderTop: `1px solid ${DC.border}`,
               display: 'flex', alignItems: 'center', px: 0.3, gap: 0.3,
               boxShadow: '0 -1px 3px rgba(0,0,0,.4)' }}>
      <Box sx={{ width: 10, height: 10, borderRadius: '50%',
                 bgcolor: playing ? DC.amber : DC.green,
                 color: '#000', fontSize: 6, fontWeight: 700,
                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                 boxShadow: `0 0 3px ${playing ? DC.amber : DC.green}` }}>
        {playing ? '⏸' : '▶'}
      </Box>
      <Box sx={{ flex: 1, position: 'relative', height: 10, display: 'flex', alignItems: 'center' }}>
        <Box sx={{ position: 'absolute', left: 0, right: 0, height: 2,
                   bgcolor: DC.surface3, borderRadius: 1 }} />
        <Box sx={{ position: 'absolute', left: 0, width: `${progressPct}%`, height: 2,
                   bgcolor: DC.cyan, borderRadius: 1 }} />
        <Box sx={{ position: 'absolute', left: `${progressPct}%`,
                   width: 4, height: 10, bgcolor: DC.cyan, borderRadius: 0.2,
                   transform: 'translateX(-2px)',
                   boxShadow: `0 0 4px ${DC.cyan}` }} />
        {withScale && (
          <Box sx={{ position: 'absolute', left: 0, right: 0, top: 11,
                     display: 'flex', justifyContent: 'space-between',
                     fontSize: 3, color: DC.text3 }}>
            <span>Day 1</span><span>Day 2</span><span>Day 3</span><span>End</span>
          </Box>
        )}
      </Box>
      <Box sx={{ fontSize: 4, color: DC.text, fontFamily: 'monospace', fontWeight: 700,
                 bgcolor: DC.surface3, px: 0.3, py: 0.15, borderRadius: 0.2 }}>
        {simTime}
      </Box>
    </Box>
  );
}

function RLShell({ headerTitle, headerRight, headerColor = DC.cyan, children, bottom }) {
  return (
    <Box sx={{ flex: 1, bgcolor: DC.bg, display: 'flex', flexDirection: 'column',
               minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ height: 14, flexShrink: 0, bgcolor: DC.surface,
                 borderBottom: `1px solid ${DC.border}`,
                 display: 'flex', alignItems: 'center', px: 0.3, gap: 0.3 }}>
        <Box sx={{ fontSize: 6, fontWeight: 700, color: headerColor }}>{headerTitle}</Box>
        {headerRight && <Box sx={{ ml: 'auto', display: 'flex', gap: 0.2 }}>{headerRight}</Box>}
      </Box>
      {/* Main 3-col */}
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>{children}</Box>
      {bottom}
    </Box>
  );
}

Object.assign(RENDERERS, {

  // ---- RL_01 RouteLayout 설계 ----
  rl_layout_design: () => (
    <RLShell
      headerTitle="🚀 Factory Layout & Routing Flow"
      headerRight={
        <>
          <Box sx={{ bgcolor: `${DC.red}22`, color: DC.red, border: `1px solid ${DC.red}55`,
                     fontSize: 3.5, px: 0.3, py: 0.1, borderRadius: 0.2, fontWeight: 700 }}>🗑 초기화</Box>
          <Box sx={{ bgcolor: `${DC.blue}22`, color: DC.blue, border: `1px solid ${DC.blue}55`,
                     fontSize: 3.5, px: 0.3, py: 0.1, borderRadius: 0.2, fontWeight: 700 }}>💾 저장</Box>
        </>
      }>
      {/* Left: Tree */}
      <Box sx={{ width: '22%', bgcolor: DC.surface2, borderRight: `1px solid ${DC.border}`,
                 display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <RLTreePanel />
      </Box>
      {/* Center: Canvas toolbar + canvas */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
        <Box sx={{ height: 10, flexShrink: 0, bgcolor: DC.surface,
                   borderBottom: `1px solid ${DC.border}`,
                   display: 'flex', alignItems: 'center', px: 0.3, gap: 0.3, fontSize: 3.5 }}>
          <Box sx={{ color: DC.cyan, fontWeight: 700 }}>📍 창원 제1공장 &gt; 1층</Box>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 0.3, alignItems: 'center' }}>
            <Box sx={{ color: DC.cyan, bgcolor: `${DC.blue}22`, border: `1px solid ${DC.blue}55`,
                       borderRadius: 0.2, px: 0.2, fontWeight: 700 }}>☑ 흐름선</Box>
            <Box sx={{ color: DC.text2 }}>Grid <span style={{ color: DC.amber, fontWeight: 700 }}>20px</span></Box>
          </Box>
        </Box>
        <RLCanvas />
      </Box>
      {/* Right: Palette */}
      <Box sx={{ width: '25%', bgcolor: DC.surface2, borderLeft: `1px solid ${DC.border}`,
                 display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <RLPalettePanel />
      </Box>
    </RLShell>
  ),

  // ---- RL_02 RouteLayout WIP 현황 ----
  rl_layout_wip: () => (
    <RLShell
      headerTitle="⏱ WIP Simulator & Real-time Monitor"
      headerRight={
        <>
          <Box sx={{ bgcolor: `${DC.green}22`, color: DC.green, border: `1px solid ${DC.green}55`,
                     fontSize: 3.5, px: 0.2, py: 0.1, borderRadius: 0.2, fontWeight: 700 }}>● 가동중</Box>
          <Box sx={{ bgcolor: `${DC.amber}22`, color: DC.amber, border: `1px solid ${DC.amber}55`,
                     fontSize: 3.5, px: 0.2, py: 0.1, borderRadius: 0.2, fontWeight: 700 }}>● 대기</Box>
          <Box sx={{ bgcolor: `${DC.red}22`, color: DC.red, border: `1px solid ${DC.red}55`,
                     fontSize: 3.5, px: 0.2, py: 0.1, borderRadius: 0.2, fontWeight: 700 }}>⚠ 병목</Box>
        </>
      }
      bottom={<RLTimelineBar simTime="2026-04-15 08:00" progressPct={11} playing={false} withScale />}>
      {/* Left: Tree */}
      <Box sx={{ width: '22%', bgcolor: DC.surface2, borderRight: `1px solid ${DC.border}`,
                 display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <RLTreePanel />
      </Box>
      {/* Center: Canvas */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
        <Box sx={{ height: 10, flexShrink: 0, bgcolor: DC.surface,
                   borderBottom: `1px solid ${DC.border}`,
                   display: 'flex', alignItems: 'center', px: 0.3, gap: 0.3, fontSize: 3.5 }}>
          <Box sx={{ color: DC.cyan, fontWeight: 700 }}>📍 창원 제1공장 &gt; 1층</Box>
          <Box sx={{ ml: 'auto', color: DC.text2 }}>ℹ️ 설비 Hover 시 3D 툴팁</Box>
        </Box>
        <RLCanvas showLed showBottleneck />
      </Box>
      {/* Right: WIP Panel */}
      <Box sx={{ width: '28%', bgcolor: DC.surface2, borderLeft: `1px solid ${DC.border}`,
                 display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <RLWipPanel showErr={false} />
      </Box>
    </RLShell>
  ),

  // ---- RL_03 RouteLayout Simulation ----
  rl_layout_simulation: () => (
    <RLShell
      headerTitle="⏱ Factory Simulation 3D"
      headerRight={
        <>
          <Box sx={{ bgcolor: `${DC.green}22`, color: DC.green, border: `1px solid ${DC.green}55`,
                     fontSize: 3.5, px: 0.2, py: 0.1, borderRadius: 0.2, fontWeight: 700 }}>● RUN</Box>
          <Box sx={{ bgcolor: `${DC.amber}22`, color: DC.amber, border: `1px solid ${DC.amber}55`,
                     fontSize: 3.5, px: 0.2, py: 0.1, borderRadius: 0.2, fontWeight: 700 }}>● WAIT</Box>
          <Box sx={{ bgcolor: `${DC.red}22`, color: DC.red, border: `1px solid ${DC.red}55`,
                     fontSize: 3.5, px: 0.2, py: 0.1, borderRadius: 0.2, fontWeight: 700 }}>⚠ ERR</Box>
        </>
      }
      bottom={<RLTimelineBar simTime="2026-04-16 20:00" progressPct={60} playing withScale />}>
      {/* Left: Tree + Filter */}
      <Box sx={{ width: '22%', bgcolor: DC.surface2, borderRight: `1px solid ${DC.border}`,
                 display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <RLTreePanel />
      </Box>
      {/* Center: Canvas with tooltip */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
        <Box sx={{ height: 10, flexShrink: 0, bgcolor: DC.surface,
                   borderBottom: `1px solid ${DC.border}`,
                   display: 'flex', alignItems: 'center', px: 0.3, gap: 0.3, fontSize: 3.5 }}>
          <Box sx={{ color: DC.cyan, fontWeight: 700 }}>📍 창원 제1공장 &gt; 1층 (Sim)</Box>
          <Box sx={{ ml: 'auto', color: DC.purple, fontWeight: 700 }}>▶ 시뮬 가동</Box>
        </Box>
        <RLCanvas showLed showBottleneck showTooltip />
      </Box>
      {/* Right: WIP + error */}
      <Box sx={{ width: '28%', bgcolor: DC.surface2, borderLeft: `1px solid ${DC.border}`,
                 display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <RLWipPanel showErr />
      </Box>
    </RLShell>
  ),

});

export default PatternPreview;

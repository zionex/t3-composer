/**
 * T3Mockup — 모든 목업 메타 정보 (Phase 5 갤러리 / Composer LLM 참조용)
 *
 * 각 entry:
 *   - patternCode    DB seed LAYOUT (정규화된 코드)
 *   - patternLabel   인간 친화 라벨
 *   - layoutCategory LAYOUT_* / POPUP / WIDGET / SUBCOMPONENT / BASE
 *   - category       UI 분류 그룹 (정규/도메인/메타)
 *   - usage          Phase 1 분류기가 매칭한 화면 수
 *   - file           lazy import 경로 (View Mockup 컴포넌트)
 *   - description    1줄 설명
 *   - layers         (선택, dashboard 필수) mockup 의 *구조* 만 12-col 좌표로 옮긴 배열.
 *                    title 은 generic 라벨 (`KPI 1`/`위젯 1`). 미선언 시 wizardState.js 의
 *                    LAYOUT_CATEGORY_TO_LAYERS 고정 템플릿 폴백.
 *                    상세: CLAUDE.md "T3Mockup 갤러리 → 신규 mockup 추가 절차 §3"
 */

import { lazy } from 'react';

// T3SmartSCM 운영 메뉴 ↔ mockup 매핑 (scripts/mockup-menu-mapping.cjs 생성)
import menuMappingJson from './_data/t3smartscm-menu-mapping.json';

// ─────────────────────────────────────────
// T3SmartSCM — Phase 1~4a 산출물 (54개 mockup)
// ─────────────────────────────────────────
const T3SMART_SCM_ENTRIES = [
  // ─── 정규 패턴 (Phase 1 빈도 ≥ 8) ───
  { patternCode: 'search_grid',         patternLabel: 'P02 — 검색 + 그리드',         layoutCategory: 'LAYOUT_SINGLE',       category: 'core',   usage: 101, description: '가장 흔한 마스터 CRUD',
    layers: [
      { key: 'mainGrid', title: '그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./search_grid/SearchGridMockup')) },
  { patternCode: 'widget_dashboard',    patternLabel: 'P01 — 위젯 대시보드',         layoutCategory: 'LAYOUT_SINGLE',       category: 'core',   usage: 48,  description: 'DashboardPanel 기반 위젯 그리드',
    layers: [
      { key: 'kpi1',    title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 0,  y: 0, w: 2,  h: 3 } },
      { key: 'kpi2',    title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 2,  y: 0, w: 2,  h: 3 } },
      { key: 'kpi3',    title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 4,  y: 0, w: 2,  h: 3 } },
      { key: 'kpi4',    title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 6,  y: 0, w: 2,  h: 3 } },
      { key: 'kpi5',    title: 'KPI 5',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 8,  y: 0, w: 2,  h: 3 } },
      { key: 'kpi6',    title: 'KPI 6',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 10, y: 0, w: 2,  h: 3 } },
      { key: 'widget1', title: '위젯 1', type: 'CHART', subtype: 'CHART_LINE', position: { x: 0,  y: 3, w: 8,  h: 5 } },
      { key: 'widget2', title: '위젯 2', type: 'CHART', subtype: 'CHART_BAR',  position: { x: 8,  y: 3, w: 4,  h: 5 } },
      { key: 'widget3', title: '위젯 3', type: 'GRID',  subtype: 'GRID_BASE',  position: { x: 0,  y: 8, w: 12, h: 4 } },
    ],
    component: lazy(() => import('./widget_dashboard/WidgetDashboardMockup')) },
  { patternCode: 'grid_chart_stacked',  patternLabel: 'v2 — 차트 + 그리드',           layoutCategory: 'LAYOUT_V2',           category: 'core',   usage: 32,  description: '차트와 그리드 수직 스택',
    layers: [
      { key: 'chart',    title: '차트',   type: 'CHART', subtype: 'CHART_LINE', position: { x: 0, y: 0, w: 12, h: 6 } },
      { key: 'mainGrid', title: '그리드', type: 'GRID',  subtype: 'GRID_BASE',  position: { x: 0, y: 6, w: 12, h: 6 } },
    ],
    component: lazy(() => import('./grid_chart_stacked/GridChartStackedMockup')) },
  { patternCode: 'v2_dual_grid',        patternLabel: 'v2 — 듀얼 그리드',             layoutCategory: 'LAYOUT_V2',           category: 'core',   usage: 28,  description: '서로 다른 두 그리드 스택',
    layers: [
      { key: 'grid1', title: '그리드 1', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 6 } },
      { key: 'grid2', title: '그리드 2', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 6, w: 12, h: 6 } },
    ],
    component: lazy(() => import('./v2_dual_grid/V2DualGridMockup')) },
  { patternCode: 'search_tab',          patternLabel: 'P03 — 검색 + 탭 그리드',       layoutCategory: 'LAYOUT_SINGLE',       category: 'core',   usage: 27,  description: '검색 공유 + 탭 전환',
    layers: [
      { key: 'tab1', title: '탭 1', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./search_tab/SearchTabMockup')) },
  { patternCode: 'P02b_grid_only',      patternLabel: 'P02b — 그리드 전용',           layoutCategory: 'LAYOUT_SINGLE',       category: 'core',   usage: 47,  description: '검색 없이 단일 그리드 (로그/알람)',
    layers: [
      { key: 'mainGrid', title: '그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./P02b_grid_only/GridOnlyMockup')) },
  { patternCode: 'P09_chart_view',      patternLabel: 'P09 — 차트 단독',              layoutCategory: 'LAYOUT_SINGLE',       category: 'core',   usage: 23,  description: '큰 차트 1개 (트렌드 분석)',
    layers: [
      { key: 'chart', title: '차트', type: 'CHART', subtype: 'CHART_LINE', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./P09_chart_view/ChartViewMockup')) },
  { patternCode: 'h2_tree_grid',        patternLabel: 'P04 — 트리 그리드',            layoutCategory: 'LAYOUT_H2',           category: 'core',   usage: 8,   description: '좌측 트리 + 우측 디테일',
    layers: [
      { key: 'tree',   title: '마스터 그리드', type: 'GRID', subtype: 'GRID_TREE', position: { x: 0, y: 0, w: 4, h: 12 } },
      { key: 'detail', title: '디테일 그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 4, y: 0, w: 8, h: 12 } },
    ],
    component: lazy(() => import('./h2_tree_grid/TreeGridMockup')) },
  { patternCode: 'rl_layout_design',    patternLabel: 'RL — 라우트 레이아웃 (FLO)',   layoutCategory: 'LAYOUT_ROUTELAYOUT',  category: 'core',   usage: 21,  description: '공정 라우트 / 공급망',
    layers: [
      { key: 'diagram', title: '위젯 1', type: 'CHART', subtype: 'DIAGRAM_FLO', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./rl_layout_design/RouteLayoutMockup')) },
  { patternCode: 'cb_master_dashboard', patternLabel: 'CB — 마스터 컨트롤보드',       layoutCategory: 'LAYOUT_CONTROLBOARD', category: 'core',   usage: 4,   description: '엔진 관제 + 단계 + KPI + 로그',
    layers: [
      { key: 'stepper',    title: '패널 1', type: 'CHART', subtype: 'STEPPER',  position: { x: 0, y: 0, w: 12, h: 3 } },
      { key: 'kpi1',       title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 3, w: 3,  h: 2 } },
      { key: 'kpi2',       title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD', position: { x: 3, y: 3, w: 3,  h: 2 } },
      { key: 'kpi3',       title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD', position: { x: 6, y: 3, w: 3,  h: 2 } },
      { key: 'kpi4',       title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD', position: { x: 9, y: 3, w: 3,  h: 2 } },
      { key: 'logPanel',   title: '로그',   type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 5, w: 8,  h: 7 } },
      { key: 'alertPanel', title: '패널 3', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 8, y: 5, w: 4,  h: 7 } },
    ],
    component: lazy(() => import('./cb_master_dashboard/ControlBoardMockup')) },
  { patternCode: 'pivot_table',         patternLabel: 'P06 — 크로스탭 피벗',          layoutCategory: 'LAYOUT_SINGLE',       category: 'core',   usage: 0,   description: '행×시간 크로스탭',
    layers: [
      { key: 'pivotGrid', title: '그리드', type: 'GRID', subtype: 'GRID_CROSSTAB', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./pivot_table/PivotTableMockup')) },
  { patternCode: 'split_master_detail', patternLabel: 'v2 — 마스터·디테일 (분할)',    layoutCategory: 'LAYOUT_V2',           category: 'core',   usage: 0,   description: '마스터 선택 → 디테일 갱신',
    layers: [
      { key: 'masterGrid', title: '마스터 그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 5 } },
      { key: 'detailGrid', title: '디테일 그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 5, w: 12, h: 7 } },
    ],
    component: lazy(() => import('./split_master_detail/MasterDetailMockup')) },

  // ─── 도메인 변형 (CB / PE / MN / Gantt / Multi-grid) ───
  { patternCode: 'cb_gantt_master',     patternLabel: 'CB — 간트형 컨트롤보드',       layoutCategory: 'LAYOUT_CONTROLBOARD', category: 'domain', usage: 0,   description: '작업 일정 간트 관제',
    layers: [
      { key: 'gantt', title: '간트 차트', type: 'CHART', subtype: 'DIAGRAM_GANTT', position: { x: 0, y: 0, w: 12, h: 8 } },
    ],
    component: lazy(() => import('./cb_gantt_master/CbGanttMockup')) },
  { patternCode: 'cb_chart_master',     patternLabel: 'CB — 차트형 컨트롤보드',       layoutCategory: 'LAYOUT_CONTROLBOARD', category: 'domain', usage: 0,   description: 'KPI + 다중 sparkline',
    layers: [
      { key: 'kpi1',   title: 'KPI 1', type: 'CHART', subtype: 'KPI_CARD',   position: { x: 0, y: 0, w: 4,  h: 3 } },
      { key: 'kpi2',   title: 'KPI 2', type: 'CHART', subtype: 'KPI_CARD',   position: { x: 4, y: 0, w: 4,  h: 3 } },
      { key: 'kpi3',   title: 'KPI 3', type: 'CHART', subtype: 'KPI_CARD',   position: { x: 8, y: 0, w: 4,  h: 3 } },
      { key: 'kpi4',   title: 'KPI 4', type: 'CHART', subtype: 'KPI_CARD',   position: { x: 0, y: 3, w: 4,  h: 3 } },
      { key: 'kpi5',   title: 'KPI 5', type: 'CHART', subtype: 'KPI_CARD',   position: { x: 4, y: 3, w: 4,  h: 3 } },
      { key: 'kpi6',   title: 'KPI 6', type: 'CHART', subtype: 'KPI_CARD',   position: { x: 8, y: 3, w: 4,  h: 3 } },
      { key: 'chart1', title: '차트',  type: 'CHART', subtype: 'CHART_LINE', position: { x: 0, y: 6, w: 12, h: 5 } },
    ],
    component: lazy(() => import('./cb_chart_master/CbChartMockup')) },
  { patternCode: 'pe_pivot_grid_edit',  patternLabel: 'PE — 피벗 편집',               layoutCategory: 'LAYOUT_PLANEDIT',     category: 'domain', usage: 0,   description: '크로스탭 셀 편집',
    layers: [
      { key: 'pivotGrid', title: '그리드', type: 'GRID', subtype: 'GRID_CROSSTAB', position: { x: 0, y: 0, w: 12, h: 8 } },
    ],
    component: lazy(() => import('./pe_pivot_grid_edit/PePivotEditMockup')) },
  { patternCode: 'pe_grid_edit',        patternLabel: 'PE — 그리드 편집',             layoutCategory: 'LAYOUT_PLANEDIT',     category: 'domain', usage: 0,   description: '일반 그리드 셀 편집',
    layers: [
      { key: 'grid', title: '그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 8 } },
    ],
    component: lazy(() => import('./pe_grid_edit/PeGridEditMockup')) },
  { patternCode: 'pe_gantt_edit',       patternLabel: 'PE — 간트 편집 (Drag & Drop)', layoutCategory: 'LAYOUT_PLANEDIT',     category: 'domain', usage: 0,   description: '간트 막대 드래그',
    layers: [
      { key: 'ganttEdit', title: '간트 차트', type: 'CHART', subtype: 'DIAGRAM_GANTT', position: { x: 0, y: 0, w: 12, h: 8 } },
    ],
    component: lazy(() => import('./pe_gantt_edit/PeGanttEditMockup')) },
  { patternCode: 'mn_kpi_dashboard',    patternLabel: 'MN — KPI 모니터링',            layoutCategory: 'LAYOUT_MONITORING',   category: 'domain', usage: 0,   description: '실시간 KPI 보드 (다크)',
    layers: [
      { key: 'kpi1',   title: 'KPI 1',    type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 4,  h: 3 } },
      { key: 'kpi2',   title: 'KPI 2',    type: 'CHART', subtype: 'KPI_CARD',  position: { x: 4, y: 0, w: 4,  h: 3 } },
      { key: 'kpi3',   title: 'KPI 3',    type: 'CHART', subtype: 'KPI_CARD',  position: { x: 8, y: 0, w: 4,  h: 3 } },
      { key: 'kpi4',   title: 'KPI 4',    type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 3, w: 4,  h: 3 } },
      { key: 'kpi5',   title: 'KPI 5',    type: 'CHART', subtype: 'KPI_CARD',  position: { x: 4, y: 3, w: 4,  h: 3 } },
      { key: 'kpi6',   title: 'KPI 6',    type: 'CHART', subtype: 'KPI_CARD',  position: { x: 8, y: 3, w: 4,  h: 3 } },
      { key: 'alerts', title: '알람 큐', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 6, w: 12, h: 5 } },
    ],
    component: lazy(() => import('./mn_kpi_dashboard/MnKpiMockup')) },
  { patternCode: 'mn_grid_alert',       patternLabel: 'MN — 그리드 알람',             layoutCategory: 'LAYOUT_MONITORING',   category: 'domain', usage: 1,   description: '운영 NOC 알람 큐',
    layers: [
      { key: 'alertGrid', title: '알람 큐', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 8 } },
    ],
    component: lazy(() => import('./mn_grid_alert/MnGridAlertMockup')) },
  { patternCode: 'mn_simple',           patternLabel: 'MN — 간단 상태',               layoutCategory: 'LAYOUT_MONITORING',   category: 'domain', usage: 0,   description: '거점 헬스 카드 (신호등)',
    layers: [
      { key: 'card1', title: '위젯 1', type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 0, w: 3, h: 3 } },
      { key: 'card2', title: '위젯 2', type: 'CHART', subtype: 'KPI_CARD', position: { x: 3, y: 0, w: 3, h: 3 } },
      { key: 'card3', title: '위젯 3', type: 'CHART', subtype: 'KPI_CARD', position: { x: 6, y: 0, w: 3, h: 3 } },
      { key: 'card4', title: '위젯 4', type: 'CHART', subtype: 'KPI_CARD', position: { x: 9, y: 0, w: 3, h: 3 } },
      { key: 'card5', title: '위젯 5', type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 3, w: 3, h: 3 } },
      { key: 'card6', title: '위젯 6', type: 'CHART', subtype: 'KPI_CARD', position: { x: 3, y: 3, w: 3, h: 3 } },
      { key: 'card7', title: '위젯 7', type: 'CHART', subtype: 'KPI_CARD', position: { x: 6, y: 3, w: 3, h: 3 } },
      { key: 'card8', title: '위젯 8', type: 'CHART', subtype: 'KPI_CARD', position: { x: 9, y: 3, w: 3, h: 3 } },
    ],
    component: lazy(() => import('./mn_simple/MnSimpleMockup')) },
  { patternCode: 'gantt_view',          patternLabel: '간트 단독 (읽기 전용)',         layoutCategory: 'LAYOUT_SINGLE',       category: 'domain', usage: 2,   description: '자원별 작업 일정',
    layers: [
      { key: 'gantt', title: '간트 차트', type: 'CHART', subtype: 'DIAGRAM_GANTT', position: { x: 0, y: 0, w: 12, h: 8 } },
    ],
    component: lazy(() => import('./gantt_view/GanttViewMockup')) },
  { patternCode: 'v3_multi_grid',       patternLabel: 'v3 — 멀티 그리드 3-stack',     layoutCategory: 'LAYOUT_V3',           category: 'domain', usage: 2,   description: 'PO/SO/WO 통합 검토',
    layers: [
      { key: 'grid1', title: '그리드 1', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 4 } },
      { key: 'grid2', title: '그리드 2', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 4, w: 12, h: 4 } },
      { key: 'grid3', title: '그리드 3', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 8, w: 12, h: 4 } },
    ],
    component: lazy(() => import('./v3_multi_grid/V3MultiGridMockup')) },
  { patternCode: 'v4_multi_grid',       patternLabel: 'v4 — 멀티 그리드 (2×2)',       layoutCategory: 'LAYOUT_V4',           category: 'domain', usage: 1,   description: '4개 영역 동시 비교',
    layers: [
      { key: 'grid1', title: '그리드 1', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 6, h: 4 } },
      { key: 'grid2', title: '그리드 2', type: 'GRID', subtype: 'GRID_BASE', position: { x: 6, y: 0, w: 6, h: 4 } },
      { key: 'grid3', title: '그리드 3', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 4, w: 6, h: 4 } },
      { key: 'grid4', title: '그리드 4', type: 'GRID', subtype: 'GRID_BASE', position: { x: 6, y: 4, w: 6, h: 4 } },
    ],
    component: lazy(() => import('./v4_multi_grid/V4MultiGridMockup')) },
  { patternCode: 'h2_master_detail',    patternLabel: 'h2 — 좌·우 마스터-디테일',     layoutCategory: 'LAYOUT_H2',           category: 'domain', usage: 1,   description: 'CRM 형식',
    layers: [
      { key: 'masterGrid', title: '마스터 그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 4, h: 8 } },
      { key: 'detailGrid', title: '디테일 그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 4, y: 0, w: 8, h: 8 } },
    ],
    component: lazy(() => import('./h2_master_detail/H2MasterDetailMockup')) },
  { patternCode: 'mix_split',           patternLabel: '혼합 분할 (H+V)',              layoutCategory: 'LAYOUT_MIXED',        category: 'domain', usage: 6,   description: '좌측 트리 + 우측 상하',
    layers: [
      { key: 'treePanel', title: '패널 1', type: 'GRID',  subtype: 'GRID_TREE', position: { x: 0, y: 0, w: 3, h: 8 } },
      { key: 'chart',     title: '차트',   type: 'CHART', subtype: 'CHART_BAR', position: { x: 3, y: 0, w: 9, h: 4 } },
      { key: 'grid',      title: '그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 3, y: 4, w: 9, h: 4 } },
    ],
    component: lazy(() => import('./mix_split/MixSplitMockup')) },

  // ─── Phase 4d 추가 mockup 5종 — 운영 미커버 영역 보완 (2026-05-15) ───
  { patternCode: 'log_viewer',          patternLabel: 'Log Viewer — 로그/이력',         layoutCategory: 'LAYOUT_SINGLE',       category: 'core',   usage: 3,
    description: '시간 필터 + 검색 + 시간순 그리드 (EngineHistory · EntryLog · TimeHistory)',
    layers: [
      { key: 'mainGrid', title: '그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./log_viewer/LogViewerMockup')) },
  { patternCode: 'sim_compare',         patternLabel: 'Simulation Compare — 시뮬 비교', layoutCategory: 'LAYOUT_SINGLE',       category: 'domain', usage: 2,
    description: '두 시뮬 버전 좌·우 비교 + delta (ImSimulationCompare)',
    layers: [
      { key: 'kpi1',        title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 3,  h: 3 } },
      { key: 'kpi2',        title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 3, y: 0, w: 3,  h: 3 } },
      { key: 'kpi3',        title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 6, y: 0, w: 3,  h: 3 } },
      { key: 'kpi4',        title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 9, y: 0, w: 3,  h: 3 } },
      { key: 'compareGrid', title: '그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 3, w: 12, h: 6 } },
    ],
    component: lazy(() => import('./sim_compare/SimCompareMockup')) },
  { patternCode: 'analysis_report',     patternLabel: 'Analysis Report — 분석 리포트',  layoutCategory: 'LAYOUT_SINGLE',       category: 'core',   usage: 18,
    description: 'KPI + 차트 + 분석 표 통합 (analysis · analysisreport · report 폴더)',
    layers: [
      { key: 'kpi1',     title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 0, y: 0, w: 3,  h: 3 } },
      { key: 'kpi2',     title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 3, y: 0, w: 3,  h: 3 } },
      { key: 'kpi3',     title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 6, y: 0, w: 3,  h: 3 } },
      { key: 'kpi4',     title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 9, y: 0, w: 3,  h: 3 } },
      { key: 'chart1',   title: '위젯 1', type: 'CHART', subtype: 'CHART_BAR',  position: { x: 0, y: 3, w: 5,  h: 5 } },
      { key: 'chart2',   title: '위젯 2', type: 'CHART', subtype: 'CHART_LINE', position: { x: 5, y: 3, w: 7,  h: 5 } },
      { key: 'mainGrid', title: '그리드', type: 'GRID',  subtype: 'GRID_BASE',  position: { x: 0, y: 8, w: 12, h: 4 } },
    ],
    component: lazy(() => import('./analysis_report/AnalysisReportMockup')) },
  { patternCode: 'fp_simulation_edit',  patternLabel: 'FP Sim Edit — 생산계획 보정',     layoutCategory: 'LAYOUT_PLANEDIT',     category: 'domain', usage: 4,
    description: '간트 + 편집 가능 그리드 (AdjustmentGantt · AdjustmentGrid)',
    layers: [
      { key: 'gantt',    title: '간트 차트', type: 'CHART', subtype: 'DIAGRAM_GANTT', position: { x: 0, y: 0, w: 12, h: 5 } },
      { key: 'editGrid', title: '그리드',    type: 'GRID',  subtype: 'GRID_BASE',     position: { x: 0, y: 5, w: 12, h: 5 } },
    ],
    component: lazy(() => import('./fp_simulation_edit/FpSimulationEditMockup')) },
  { patternCode: 'dev_tool',            patternLabel: 'Developer Tool — 개발자 도구',    layoutCategory: 'LAYOUT_SINGLE',       category: 'meta',   usage: 2,
    description: 'Form + Action 버튼 + 결과 log (DevMakeData · MenuBadge)',
    layers: [
      { key: 'formLeft', title: '폼', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 5, h: 12 } },
      { key: 'logRight', title: '폼', type: 'GRID', subtype: 'GRID_BASE', position: { x: 5, y: 0, w: 7, h: 12 } },
    ],
    component: lazy(() => import('./dev_tool/DevToolMockup')) },

  // ─── Dashboard 류 (운영 화면 1:1 — patternCode 묶음 안 함) ───
  { patternCode: 'dash_executive',      patternLabel: 'Executive — 경영 종합 대시보드',  layoutCategory: 'LAYOUT_DASHBOARD',     category: 'dashboard', usage: 1,
    sourceMenuCd: 'UI_SA_EXECUTIVE_DASHBOARD', sourceFilePath: 'view/snop/dashboard/ExecutiveDashboard.jsx',
    description: '매출목표/AOP-DP/제품군 수익 + KPI 종합',
    // mockup 의 *구조* 만 옮김 — KPI 4개 (각 w=3) + 본문 3개 (w=6/3/3). title 은 generic 라벨.
    // mockup 의 구체 텍스트(월 매출/GP 마진/...) 는 mockupContextText 로 Claude 가 참조하며,
    // Layout step 에서는 사용자가 자유 편집할 placeholder 만 보여준다.
    layers: [
      { key: 'kpi1',    title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 0, y: 0, w: 3, h: 3 } },
      { key: 'kpi2',    title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 3, y: 0, w: 3, h: 3 } },
      { key: 'kpi3',    title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 6, y: 0, w: 3, h: 3 } },
      { key: 'kpi4',    title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 9, y: 0, w: 3, h: 3 } },
      { key: 'widget1', title: '위젯 1', type: 'CHART', subtype: 'CHART_LINE', position: { x: 0, y: 3, w: 6, h: 6 } },
      { key: 'widget2', title: '위젯 2', type: 'CHART', subtype: 'CHART_BAR',  position: { x: 6, y: 3, w: 3, h: 6 } },
      { key: 'widget3', title: '위젯 3', type: 'CHART', subtype: 'CHART_BAR',  position: { x: 9, y: 3, w: 3, h: 6 } },
    ],
    component: lazy(() => import('./dash_executive/DashExecutiveMockup')) },
  { patternCode: 'dash_overview',       patternLabel: 'Overview — 전사 개요',           layoutCategory: 'LAYOUT_DASHBOARD',     category: 'dashboard', usage: 1,
    sourceMenuCd: 'UI_DASH_OVERVIEW', sourceFilePath: 'view/dashboard/Overview.jsx',
    description: '전사 KPI 6종 + 트렌드 라인차트',
    layers: [
      { key: 'kpi1',    title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 0,  y: 0, w: 2,  h: 3 } },
      { key: 'kpi2',    title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 2,  y: 0, w: 2,  h: 3 } },
      { key: 'kpi3',    title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 4,  y: 0, w: 2,  h: 3 } },
      { key: 'kpi4',    title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 6,  y: 0, w: 2,  h: 3 } },
      { key: 'kpi5',    title: 'KPI 5',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 8,  y: 0, w: 2,  h: 3 } },
      { key: 'kpi6',    title: 'KPI 6',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 10, y: 0, w: 2,  h: 3 } },
      { key: 'widget1', title: '위젯 1', type: 'CHART', subtype: 'CHART_LINE', position: { x: 0,  y: 3, w: 12, h: 6 } },
    ],
    component: lazy(() => import('./dash_overview/DashOverviewMockup')) },
  { patternCode: 'dash_kpi_board',      patternLabel: 'KPI Board — 통합 KPI',          layoutCategory: 'LAYOUT_DASHBOARD',     category: 'dashboard', usage: 1,
    sourceMenuCd: 'UI_DASH_KPI_BOARD', sourceFilePath: 'view/dashboard/KpiBoard.jsx',
    description: 'KPI 카드 9개 + sparkline + 상태칩',
    layers: [
      { key: 'kpi1', title: 'KPI 1', type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 0, w: 4, h: 4 } },
      { key: 'kpi2', title: 'KPI 2', type: 'CHART', subtype: 'KPI_CARD', position: { x: 4, y: 0, w: 4, h: 4 } },
      { key: 'kpi3', title: 'KPI 3', type: 'CHART', subtype: 'KPI_CARD', position: { x: 8, y: 0, w: 4, h: 4 } },
      { key: 'kpi4', title: 'KPI 4', type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 4, w: 4, h: 4 } },
      { key: 'kpi5', title: 'KPI 5', type: 'CHART', subtype: 'KPI_CARD', position: { x: 4, y: 4, w: 4, h: 4 } },
      { key: 'kpi6', title: 'KPI 6', type: 'CHART', subtype: 'KPI_CARD', position: { x: 8, y: 4, w: 4, h: 4 } },
      { key: 'kpi7', title: 'KPI 7', type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 8, w: 4, h: 4 } },
      { key: 'kpi8', title: 'KPI 8', type: 'CHART', subtype: 'KPI_CARD', position: { x: 4, y: 8, w: 4, h: 4 } },
      { key: 'kpi9', title: 'KPI 9', type: 'CHART', subtype: 'KPI_CARD', position: { x: 8, y: 8, w: 4, h: 4 } },
    ],
    component: lazy(() => import('./dash_kpi_board/DashKpiBoardMockup')) },
  { patternCode: 'dash_supply_kpi',     patternLabel: 'Supply Plan KPI — 공급계획',     layoutCategory: 'LAYOUT_DASHBOARD',     category: 'dashboard', usage: 1,
    sourceMenuCd: 'UI_SA_SUPPLY_PLAN_KPI', sourceFilePath: 'view/snop/mdb/SupplyPlanKpi.jsx',
    description: 'MP 변경율 · MP/FP 일치율 등 KPI 카드 6개',
    layers: [
      { key: 'kpi1', title: 'KPI 1', type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 0, w: 4, h: 4 } },
      { key: 'kpi2', title: 'KPI 2', type: 'CHART', subtype: 'KPI_CARD', position: { x: 4, y: 0, w: 4, h: 4 } },
      { key: 'kpi3', title: 'KPI 3', type: 'CHART', subtype: 'KPI_CARD', position: { x: 8, y: 0, w: 4, h: 4 } },
      { key: 'kpi4', title: 'KPI 4', type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 4, w: 4, h: 4 } },
      { key: 'kpi5', title: 'KPI 5', type: 'CHART', subtype: 'KPI_CARD', position: { x: 4, y: 4, w: 4, h: 4 } },
      { key: 'kpi6', title: 'KPI 6', type: 'CHART', subtype: 'KPI_CARD', position: { x: 8, y: 4, w: 4, h: 4 } },
    ],
    component: lazy(() => import('./dash_supply_kpi/DashSupplyKpiMockup')) },
  { patternCode: 'dash_ontime_sales',   patternLabel: 'On-Time Sales — 정시 출하',       layoutCategory: 'LAYOUT_DASHBOARD',     category: 'dashboard', usage: 1,
    sourceMenuCd: 'UI_SA_ONTIME_SALES', sourceFilePath: 'view/snop/mdb/OntimeSales.jsx',
    description: '정시 출하율 trend + 지연 사유 도넛',
    layers: [
      { key: 'kpi1',    title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',    position: { x: 0, y: 0, w: 3, h: 3 } },
      { key: 'kpi2',    title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',    position: { x: 3, y: 0, w: 3, h: 3 } },
      { key: 'kpi3',    title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',    position: { x: 6, y: 0, w: 3, h: 3 } },
      { key: 'kpi4',    title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',    position: { x: 9, y: 0, w: 3, h: 3 } },
      { key: 'widget1', title: '위젯 1', type: 'CHART', subtype: 'CHART_LINE',  position: { x: 0, y: 3, w: 8, h: 6 } },
      { key: 'widget2', title: '위젯 2', type: 'CHART', subtype: 'CHART_DONUT', position: { x: 8, y: 3, w: 4, h: 6 } },
    ],
    component: lazy(() => import('./dash_ontime_sales/DashOntimeSalesMockup')) },
  { patternCode: 'dash_sales_growth',   patternLabel: 'Sales Growth — 매출 성장률',     layoutCategory: 'LAYOUT_DASHBOARD',     category: 'dashboard', usage: 1,
    sourceMenuCd: 'UI_SA_SALES_GROWTH_RATE', sourceFilePath: 'view/snop/mdb/SalesGrowthRate.jsx',
    description: '전년 대비 매출 성장률 + 바 차트',
    layers: [
      { key: 'kpi1',    title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 3, h: 3 } },
      { key: 'kpi2',    title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 3, y: 0, w: 3, h: 3 } },
      { key: 'kpi3',    title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 6, y: 0, w: 3, h: 3 } },
      { key: 'kpi4',    title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 9, y: 0, w: 3, h: 3 } },
      { key: 'widget1', title: '위젯 1', type: 'CHART', subtype: 'CHART_BAR', position: { x: 0, y: 3, w: 8, h: 6 } },
      { key: 'widget2', title: '위젯 2', type: 'CHART', subtype: 'CHART_BAR', position: { x: 8, y: 3, w: 4, h: 6 } },
    ],
    component: lazy(() => import('./dash_sales_growth/DashSalesGrowthMockup')) },
  { patternCode: 'dash_production_perf', patternLabel: 'Production Perf — 생산 실적 분석', layoutCategory: 'LAYOUT_DASHBOARD',   category: 'dashboard', usage: 1,
    sourceMenuCd: 'UI_FP_PRODUCTION_PERFORMANCE', sourceFilePath: 'view/factoryplan/dashboard/ProductionPerformance.jsx',
    description: '일생산실적 + 제품별 + 공장재고 + 재고상태',
    layers: [
      { key: 'widget1', title: '위젯 1', type: 'CHART', subtype: 'CHART_LINE', position: { x: 0, y: 0, w: 6, h: 6 } },
      { key: 'widget2', title: '위젯 2', type: 'CHART', subtype: 'CHART_BAR',  position: { x: 6, y: 0, w: 6, h: 6 } },
      { key: 'widget3', title: '위젯 3', type: 'CHART', subtype: 'CHART_BAR',  position: { x: 0, y: 6, w: 6, h: 6 } },
      { key: 'widget4', title: '위젯 4', type: 'CHART', subtype: 'CHART_BAR',  position: { x: 6, y: 6, w: 6, h: 6 } },
    ],
    component: lazy(() => import('./dash_production_perf/DashProductionPerfMockup')) },
  { patternCode: 'dash_simulation_kpi', patternLabel: 'Simulation KPI — 시뮬 결과',     layoutCategory: 'LAYOUT_DASHBOARD',     category: 'dashboard', usage: 1,
    sourceMenuCd: 'UI_FP_SIMUL_KPI', sourceFilePath: 'view/factoryplan/dashboard/SimulationKPIDashboard.jsx',
    description: '충족율/납기율/배송/리드타임 KPI 4종 + 비교 차트',
    layers: [
      { key: 'kpi1',  title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 3,  h: 4 } },
      { key: 'kpi2',  title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 3, y: 0, w: 3,  h: 4 } },
      { key: 'kpi3',  title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 6, y: 0, w: 3,  h: 4 } },
      { key: 'kpi4',  title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 9, y: 0, w: 3,  h: 4 } },
      { key: 'grid1', title: '그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 4, w: 12, h: 6 } },
    ],
    component: lazy(() => import('./dash_simulation_kpi/DashSimulationKpiMockup')) },
  { patternCode: 'dash_inout_status',   patternLabel: 'In/Out Status — 입출하 현황',     layoutCategory: 'LAYOUT_DASHBOARD',     category: 'dashboard', usage: 1,
    sourceMenuCd: 'UI_FP_IN_OUT_STATUS_DASHBOARD', sourceFilePath: 'view/factoryplan/dashboard/InOutStatusDashboard.jsx',
    description: '경로 필터 + 입출하/WIP/출하상태 4데이터셋',
    layers: [
      { key: 'kpi1',    title: 'KPI 1',     type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 3, h: 3 } },
      { key: 'kpi2',    title: 'KPI 2',     type: 'CHART', subtype: 'KPI_CARD',  position: { x: 3, y: 0, w: 3, h: 3 } },
      { key: 'kpi3',    title: 'KPI 3',     type: 'CHART', subtype: 'KPI_CARD',  position: { x: 6, y: 0, w: 3, h: 3 } },
      { key: 'kpi4',    title: 'KPI 4',     type: 'CHART', subtype: 'KPI_CARD',  position: { x: 9, y: 0, w: 3, h: 3 } },
      { key: 'grid1',   title: '그리드 1', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 3, w: 6, h: 6 } },
      { key: 'grid2',   title: '그리드 2', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 6, y: 3, w: 6, h: 6 } },
      { key: 'grid3',   title: '그리드 3', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 9, w: 6, h: 6 } },
      { key: 'widget1', title: '위젯 1',   type: 'CHART', subtype: 'CHART_BAR', position: { x: 6, y: 9, w: 6, h: 6 } },
    ],
    component: lazy(() => import('./dash_inout_status/DashInOutStatusMockup')) },
  { patternCode: 'dash_plan_problem',   patternLabel: 'Plan Problem — 문제 현황',        layoutCategory: 'LAYOUT_DASHBOARD',     category: 'dashboard', usage: 1,
    sourceMenuCd: 'UI_FP_PLAN_PROBLEM_DASHBOARD', sourceFilePath: 'view/factoryplan/dashboard/PlanProblemDashboard.jsx',
    description: 'KPI + 문제유형(지연/부족/기타) + 상세표 3계층',
    layers: [
      { key: 'kpi1',    title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 3,  h: 3 } },
      { key: 'kpi2',    title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 3, y: 0, w: 3,  h: 3 } },
      { key: 'kpi3',    title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 6, y: 0, w: 3,  h: 3 } },
      { key: 'kpi4',    title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 9, y: 0, w: 3,  h: 3 } },
      { key: 'widget1', title: '위젯 1', type: 'CHART', subtype: 'CHART_BAR', position: { x: 0, y: 3, w: 12, h: 4 } },
      { key: 'grid1',   title: '그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 7, w: 12, h: 7 } },
    ],
    component: lazy(() => import('./dash_plan_problem/DashPlanProblemMockup')) },
  { patternCode: 'dash_wip_eoh',        patternLabel: 'WIP / EOH — 재공 투입 생산',      layoutCategory: 'LAYOUT_DASHBOARD',     category: 'dashboard', usage: 1,
    sourceMenuCd: 'UI_FP_WIP_EOH_OUT_DASHBOARD', sourceFilePath: 'view/factoryplan/dashboard/WipEohOutDashboard.jsx',
    description: '공장별 라우팅 필터 + WIP/EOH 출하 차트',
    layers: [
      { key: 'kpi1',    title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 0, y: 0, w: 3,  h: 3 } },
      { key: 'kpi2',    title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 3, y: 0, w: 3,  h: 3 } },
      { key: 'kpi3',    title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 6, y: 0, w: 3,  h: 3 } },
      { key: 'kpi4',    title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 9, y: 0, w: 3,  h: 3 } },
      { key: 'widget1', title: '위젯 1', type: 'CHART', subtype: 'CHART_LINE', position: { x: 0, y: 3, w: 12, h: 6 } },
      { key: 'widget2', title: '위젯 2', type: 'CHART', subtype: 'CHART_BAR',  position: { x: 0, y: 9, w: 12, h: 5 } },
    ],
    component: lazy(() => import('./dash_wip_eoh/DashWipEohMockup')) },
  { patternCode: 'dash_sales_board',    patternLabel: 'Sales Board — 판매 요약',         layoutCategory: 'LAYOUT_DASHBOARD',     category: 'dashboard', usage: 2,
    sourceMenuCd: 'UI_DASH_SALES_BOARD', sourceFilePath: 'view/dashboard/SalesBoard.jsx',
    description: '판매 경보 + 정확도 + 진척 9-위젯',
    layers: [
      { key: 'widget1', title: '위젯 1', type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 0, w: 4, h: 4 } },
      { key: 'widget2', title: '위젯 2', type: 'CHART', subtype: 'KPI_CARD', position: { x: 4, y: 0, w: 4, h: 4 } },
      { key: 'widget3', title: '위젯 3', type: 'CHART', subtype: 'KPI_CARD', position: { x: 8, y: 0, w: 4, h: 4 } },
      { key: 'widget4', title: '위젯 4', type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 4, w: 4, h: 4 } },
      { key: 'widget5', title: '위젯 5', type: 'CHART', subtype: 'KPI_CARD', position: { x: 4, y: 4, w: 4, h: 4 } },
      { key: 'widget6', title: '위젯 6', type: 'CHART', subtype: 'KPI_CARD', position: { x: 8, y: 4, w: 4, h: 4 } },
      { key: 'widget7', title: '위젯 7', type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 8, w: 4, h: 4 } },
      { key: 'widget8', title: '위젯 8', type: 'CHART', subtype: 'KPI_CARD', position: { x: 4, y: 8, w: 4, h: 4 } },
      { key: 'widget9', title: '위젯 9', type: 'CHART', subtype: 'KPI_CARD', position: { x: 8, y: 8, w: 4, h: 4 } },
    ],
    component: lazy(() => import('./dash_sales_board/DashSalesBoardMockup')) },
  { patternCode: 'dash_demand_board',   patternLabel: 'Demand Board — 수요 계획 요약',    layoutCategory: 'LAYOUT_DASHBOARD',     category: 'dashboard', usage: 1,
    sourceMenuCd: 'UI_DASH_DEMAND_PLAN_BOARD', sourceFilePath: 'view/demandplan/dashboard/DemandPlanBoard.jsx',
    description: '계획 진행 + 상태 + KPI 9-위젯',
    layers: [
      { key: 'widget1', title: '위젯 1', type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 0, w: 4, h: 4 } },
      { key: 'widget2', title: '위젯 2', type: 'CHART', subtype: 'KPI_CARD', position: { x: 4, y: 0, w: 4, h: 4 } },
      { key: 'widget3', title: '위젯 3', type: 'CHART', subtype: 'KPI_CARD', position: { x: 8, y: 0, w: 4, h: 4 } },
      { key: 'widget4', title: '위젯 4', type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 4, w: 4, h: 4 } },
      { key: 'widget5', title: '위젯 5', type: 'CHART', subtype: 'KPI_CARD', position: { x: 4, y: 4, w: 4, h: 4 } },
      { key: 'widget6', title: '위젯 6', type: 'CHART', subtype: 'KPI_CARD', position: { x: 8, y: 4, w: 4, h: 4 } },
      { key: 'widget7', title: '위젯 7', type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 8, w: 4, h: 4 } },
      { key: 'widget8', title: '위젯 8', type: 'CHART', subtype: 'KPI_CARD', position: { x: 4, y: 8, w: 4, h: 4 } },
      { key: 'widget9', title: '위젯 9', type: 'CHART', subtype: 'KPI_CARD', position: { x: 8, y: 8, w: 4, h: 4 } },
    ],
    component: lazy(() => import('./dash_demand_board/DashDemandBoardMockup')) },
  { patternCode: 'dash_supply_board',   patternLabel: 'Supply Board — 공급 요약',         layoutCategory: 'LAYOUT_DASHBOARD',     category: 'dashboard', usage: 1,
    sourceMenuCd: 'UI_DASH_SUPPLY_BOARD', sourceFilePath: 'view/dashboard/SupplyBoard.jsx',
    description: '공급 충족율 + 자원 가용성 + 리스크 6-위젯',
    layers: [
      { key: 'widget1', title: '위젯 1', type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 0, w: 4, h: 4 } },
      { key: 'widget2', title: '위젯 2', type: 'CHART', subtype: 'KPI_CARD', position: { x: 4, y: 0, w: 4, h: 4 } },
      { key: 'widget3', title: '위젯 3', type: 'CHART', subtype: 'KPI_CARD', position: { x: 8, y: 0, w: 4, h: 4 } },
      { key: 'widget4', title: '위젯 4', type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 4, w: 4, h: 4 } },
      { key: 'widget5', title: '위젯 5', type: 'CHART', subtype: 'KPI_CARD', position: { x: 4, y: 4, w: 4, h: 4 } },
      { key: 'widget6', title: '위젯 6', type: 'CHART', subtype: 'KPI_CARD', position: { x: 8, y: 4, w: 4, h: 4 } },
    ],
    component: lazy(() => import('./dash_supply_board/DashSupplyBoardMockup')) },
  { patternCode: 'dash_psi_board',      patternLabel: 'PSI Board — 생산·재고·판매',       layoutCategory: 'LAYOUT_DASHBOARD',     category: 'dashboard', usage: 1,
    sourceMenuCd: 'UI_DASH_PSI_BOARD', sourceFilePath: 'view/dashboard/PsiBoard.jsx',
    description: 'PSI 균형 + 변동 alert 6-위젯',
    layers: [
      { key: 'widget1', title: '위젯 1', type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 0, w: 4, h: 4 } },
      { key: 'widget2', title: '위젯 2', type: 'CHART', subtype: 'KPI_CARD', position: { x: 4, y: 0, w: 4, h: 4 } },
      { key: 'widget3', title: '위젯 3', type: 'CHART', subtype: 'KPI_CARD', position: { x: 8, y: 0, w: 4, h: 4 } },
      { key: 'widget4', title: '위젯 4', type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 4, w: 4, h: 4 } },
      { key: 'widget5', title: '위젯 5', type: 'CHART', subtype: 'KPI_CARD', position: { x: 4, y: 4, w: 4, h: 4 } },
      { key: 'widget6', title: '위젯 6', type: 'CHART', subtype: 'KPI_CARD', position: { x: 8, y: 4, w: 4, h: 4 } },
    ],
    component: lazy(() => import('./dash_psi_board/DashPsiBoardMockup')) },
  { patternCode: 'dash_inven_board',    patternLabel: 'Inventory Board — 재고 요약',       layoutCategory: 'LAYOUT_DASHBOARD',     category: 'dashboard', usage: 1,
    sourceMenuCd: 'UI_DASH_INVENTORY_BOARD', sourceFilePath: 'view/dashboard/InvenBoard.jsx',
    description: '재고 turnover + ABC/XYZ + 결품 4-6 위젯',
    layers: [
      { key: 'widget1', title: '위젯 1', type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 0, w: 4, h: 4 } },
      { key: 'widget2', title: '위젯 2', type: 'CHART', subtype: 'KPI_CARD', position: { x: 4, y: 0, w: 4, h: 4 } },
      { key: 'widget3', title: '위젯 3', type: 'CHART', subtype: 'KPI_CARD', position: { x: 8, y: 0, w: 4, h: 4 } },
      { key: 'widget4', title: '위젯 4', type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 4, w: 4, h: 4 } },
      { key: 'widget5', title: '위젯 5', type: 'CHART', subtype: 'KPI_CARD', position: { x: 4, y: 4, w: 4, h: 4 } },
      { key: 'widget6', title: '위젯 6', type: 'CHART', subtype: 'KPI_CARD', position: { x: 8, y: 4, w: 4, h: 4 } },
    ],
    component: lazy(() => import('./dash_inven_board/DashInvenBoardMockup')) },

  // ─── ControlBoard 류 (엔진 실행 화면 1:1) ───
  { patternCode: 'cb_bf_forecast',      patternLabel: 'CB — BF 예측 엔진',               layoutCategory: 'LAYOUT_CONTROLBOARD',  category: 'controlboard', usage: 1,
    sourceMenuCd: 'UI_BF_16', sourceFilePath: 'view/baselineforecast/version/controlboard/ControlBoard.jsx',
    description: '버전 + 5단계 Stepper + KPI + 로그 + 결과 그리드',
    layers: [
      { key: 'stepper',    title: 'Stepper',    type: 'CHART', subtype: 'STEPPER',   position: { x: 0, y: 0, w: 12, h: 2 } },
      { key: 'kpi1',       title: 'KPI 1',      type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 2, w: 3,  h: 3 } },
      { key: 'kpi2',       title: 'KPI 2',      type: 'CHART', subtype: 'KPI_CARD',  position: { x: 3, y: 2, w: 3,  h: 3 } },
      { key: 'kpi3',       title: 'KPI 3',      type: 'CHART', subtype: 'KPI_CARD',  position: { x: 6, y: 2, w: 3,  h: 3 } },
      { key: 'kpi4',       title: 'KPI 4',      type: 'CHART', subtype: 'KPI_CARD',  position: { x: 9, y: 2, w: 3,  h: 3 } },
      { key: 'logPane',    title: '로그',       type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 5, w: 6,  h: 6 } },
      { key: 'resultGrid', title: '결과 그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 6, y: 5, w: 6,  h: 6 } },
    ],
    component: lazy(() => import('./cb_bf_forecast/CbBfForecastMockup')) },
  { patternCode: 'cb_insight_prediction', patternLabel: 'CB — Insight 예측 (Job 폴링)',   layoutCategory: 'LAYOUT_CONTROLBOARD',  category: 'controlboard', usage: 1,
    sourceMenuCd: 'UI_BF_IS_CONTROLBOARD', sourceFilePath: 'view/baselineforecast/version/iscontrolboard/IsControlBoard.jsx',
    description: 'PlanScope + 엔진 실행 + Job progress + 결과 그리드',
    layers: [
      { key: 'phase1',     title: '위젯 1',     type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 4, h: 3 } },
      { key: 'phase2',     title: '위젯 2',     type: 'CHART', subtype: 'KPI_CARD',  position: { x: 4, y: 0, w: 4, h: 3 } },
      { key: 'phase3',     title: '위젯 3',     type: 'CHART', subtype: 'KPI_CARD',  position: { x: 8, y: 0, w: 4, h: 3 } },
      { key: 'logPane',    title: '로그',       type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 3, w: 6, h: 6 } },
      { key: 'resultGrid', title: '결과 그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 6, y: 3, w: 6, h: 6 } },
    ],
    component: lazy(() => import('./cb_insight_prediction/CbInsightPredictionMockup')) },
  { patternCode: 'cb_dp_demand',        patternLabel: 'CB — DP 수요계획 엔진',           layoutCategory: 'LAYOUT_CONTROLBOARD',  category: 'controlboard', usage: 1,
    sourceMenuCd: 'UI_DP_93', sourceFilePath: 'view/demandplan/version/controlboard/BaseControlBoard.jsx',
    description: '버전 + Stepper + 승인/릴리즈 + 결과 그리드(편집)',
    layers: [
      { key: 'stepper',    title: 'Stepper',    type: 'CHART', subtype: 'STEPPER',   position: { x: 0, y: 0, w: 12, h: 2 } },
      { key: 'kpi1',       title: 'KPI 1',      type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 2, w: 3,  h: 3 } },
      { key: 'kpi2',       title: 'KPI 2',      type: 'CHART', subtype: 'KPI_CARD',  position: { x: 3, y: 2, w: 3,  h: 3 } },
      { key: 'kpi3',       title: 'KPI 3',      type: 'CHART', subtype: 'KPI_CARD',  position: { x: 6, y: 2, w: 3,  h: 3 } },
      { key: 'kpi4',       title: 'KPI 4',      type: 'CHART', subtype: 'KPI_CARD',  position: { x: 9, y: 2, w: 3,  h: 3 } },
      { key: 'logPane',    title: '로그',       type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 5, w: 5,  h: 6 } },
      { key: 'resultGrid', title: '결과 그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 5, y: 5, w: 7,  h: 6 } },
    ],
    component: lazy(() => import('./cb_dp_demand/CbDpDemandMockup')) },
  { patternCode: 'cb_bp_yearly',        patternLabel: 'CB — BP 년간계획',               layoutCategory: 'LAYOUT_CONTROLBOARD',  category: 'controlboard', usage: 1,
    sourceMenuCd: 'UI_BP_93', sourceFilePath: 'view/demandplan/yearlyplan/controlboard/ControlBoard.jsx',
    description: '년간 시계열 + Stepper + 결과',
    layers: [
      { key: 'stepper',    title: 'Stepper',    type: 'CHART', subtype: 'STEPPER',       position: { x: 0, y: 0,  w: 12, h: 2 } },
      { key: 'kpi1',       title: 'KPI 1',      type: 'CHART', subtype: 'KPI_CARD',      position: { x: 0, y: 2,  w: 3,  h: 3 } },
      { key: 'kpi2',       title: 'KPI 2',      type: 'CHART', subtype: 'KPI_CARD',      position: { x: 3, y: 2,  w: 3,  h: 3 } },
      { key: 'kpi3',       title: 'KPI 3',      type: 'CHART', subtype: 'KPI_CARD',      position: { x: 6, y: 2,  w: 3,  h: 3 } },
      { key: 'kpi4',       title: 'KPI 4',      type: 'CHART', subtype: 'KPI_CARD',      position: { x: 9, y: 2,  w: 3,  h: 3 } },
      { key: 'resultGrid', title: '결과 그리드', type: 'GRID',  subtype: 'GRID_CROSSTAB', position: { x: 0, y: 5,  w: 12, h: 5 } },
      { key: 'chart',      title: '차트',       type: 'CHART', subtype: 'CHART_BAR',     position: { x: 0, y: 10, w: 12, h: 3 } },
    ],
    component: lazy(() => import('./cb_bp_yearly/CbBpYearlyMockup')) },

  // ─── 메타 카테고리 (DB 시드 대상 아님) ───
  { patternCode: 'popup',         patternLabel: '팝업 다이얼로그',     layoutCategory: 'POPUP',        category: 'meta', usage: 223, description: 'Pop*.jsx 표준 양식',
    layers: [
      { key: 'body', title: '팝업 본문', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./popup/PopupMockup')) },
  { patternCode: 'widget_chart',  patternLabel: '위젯 — 차트형',        layoutCategory: 'WIDGET',       category: 'meta', usage: 94,  description: 'Dashboard 셀 안 차트',
    layers: [
      { key: 'widget', title: '위젯', type: 'CHART', subtype: 'CHART_LINE', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./widget_chart/WidgetChartMockup')) },
  { patternCode: 'widget_grid',   patternLabel: '위젯 — 그리드형',       layoutCategory: 'WIDGET',       category: 'meta', usage: 27,  description: 'Dashboard 셀 안 그리드',
    layers: [
      { key: 'widget', title: '위젯', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./widget_grid/WidgetGridMockup')) },
  { patternCode: 'widget_pivot',  patternLabel: '위젯 — 피벗형',         layoutCategory: 'WIDGET',       category: 'meta', usage: 13,  description: 'Dashboard 셀 안 heatmap',
    layers: [
      { key: 'widget', title: '위젯', type: 'GRID', subtype: 'GRID_CROSSTAB', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./widget_pivot/WidgetPivotMockup')) },
  { patternCode: 'widget_panel',  patternLabel: '위젯 — 패널형 KPI',     layoutCategory: 'WIDGET',       category: 'meta', usage: 0,   description: '단일 KPI + sparkline',
    layers: [
      { key: 'widget', title: '위젯', type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./widget_panel/WidgetPanelMockup')) },
  { patternCode: 'widget_misc',   patternLabel: '위젯 — 자유 폼',        layoutCategory: 'WIDGET',       category: 'meta', usage: 49,  description: '활동 피드 / Timeline',
    layers: [
      { key: 'widget', title: '위젯', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./widget_misc/WidgetMiscMockup')) },
  { patternCode: 'subcomponent',  patternLabel: '서브 컴포넌트',         layoutCategory: 'SUBCOMPONENT', category: 'meta', usage: 16,  description: '메인 화면의 내부 부품',
    layers: [
      { key: 'body', title: '폼', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./subcomponent/SubcomponentMockup')) },
  { patternCode: 'base_wrapper',  patternLabel: 'Base*.jsx 래퍼',        layoutCategory: 'BASE',         category: 'meta', usage: 6,   description: '공통 로직 래퍼',
    layers: [
      { key: 'body', title: '폼', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./base_wrapper/BaseWrapperMockup')) },
  { patternCode: 'free_form',     patternLabel: '비표준 / 자유 폼',      layoutCategory: 'LAYOUT_SINGLE', category: 'meta', usage: 175, description: '설정 폼 / 로그인 등',
    layers: [
      { key: 'formLeft',  title: '폼', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 6, h: 12 } },
      { key: 'infoRight', title: '폼', type: 'GRID', subtype: 'GRID_BASE', position: { x: 6, y: 0, w: 6, h: 12 } },
    ],
    component: lazy(() => import('./free_form/FreeFormMockup')) },
];

// ─────────────────────────────────────────
// PlaNEL — 향후 작업 placeholder
// ─────────────────────────────────────────
const PLANEL_ENTRIES = [
  // 향후 PlaNEL 화면 mockup 추가 예정. 추가 시 productLine: 'PlaNEL' 자동 부여됨
];

// ─────────────────────────────────────────
// 최종 export — 각 entry 에 productLine + menus (운영 매핑) 자동 부여
// ─────────────────────────────────────────
const T3SMART_SCM_MOCKUP_TO_MENUS = menuMappingJson?.mockupToMenus || {};
export const MOCKUP_ENTRIES = [
  ...T3SMART_SCM_ENTRIES.map((e) => ({
    productLine: 'T3SmartSCM',
    menus: T3SMART_SCM_MOCKUP_TO_MENUS[e.patternCode] || [],
    ...e,
  })),
  ...PLANEL_ENTRIES.map((e) => ({ productLine: 'PlaNEL', menus: [], ...e })),
];

// 운영 메뉴ID → mockup patternCode 역방향 lookup
export const MENU_TO_MOCKUP = menuMappingJson?.menuToMockup || {};

export const PRODUCT_LINE_LABEL = {
  T3SmartSCM: 'T3SmartSCM',
  PlaNEL:     'PlaNEL',
};

export const CATEGORY_LABEL = {
  core:         '정규 패턴 (Phase 1 사용)',
  domain:       '도메인 변형 (CB / PE / MN / Multi-grid)',
  dashboard:    'Dashboard (운영 1:1)',
  controlboard: 'ControlBoard (엔진 실행)',
  meta:         '메타 카테고리 (popup / widget / subcomponent / base / free)',
};

// 패턴 코드로 조회
export function findMockup(patternCode) {
  return MOCKUP_ENTRIES.find((e) => e.patternCode === patternCode);
}

// 통계 (mockup 인덱스 화면에서 사용)
export const MOCK_STATS = {
  totalMockups: MOCKUP_ENTRIES.length,
  byProductLine: MOCKUP_ENTRIES.reduce((acc, e) => {
    acc[e.productLine] = (acc[e.productLine] || 0) + 1;
    return acc;
  }, {}),
  byCategory: MOCKUP_ENTRIES.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {}),
};

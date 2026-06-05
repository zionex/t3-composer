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
// KTNG 운영 메뉴 ↔ mockup 매핑 (수동 작성, .claude-project/_data/ktng-menu-source-raw.txt 기반)
import ktngMenuMappingJson from './_data/ktng-menu-mapping.json';
// PLANNEL 운영 메뉴 ↔ mockup 매핑 (R1: Data Management 7 mockup)
import plannelMenuMappingJson from './_data/plannel-menu-mapping.json';
// ORON 운영 메뉴 ↔ mockup 매핑 (수동 작성, 사용자 제공 메뉴 목록 기반)
import oronMenuMappingJson from './_data/oron-menu-mapping.json';
// CJBO 운영 메뉴 ↔ mockup 매핑 (수동 작성, C:\vs_project\CJBO 메뉴 목록 기반)
import cjboMenuMappingJson from './_data/cjbo-menu-mapping.json';

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
// PlanNEL — PLANNEL saas-web 화면 ~130개 → ~42 mockup 패턴 (단계적 진행)
// 현재 R1: Data Management 7 mockup (37 메뉴 커버)
// 다음 라운드: R2 Demand Plan (8) · R3 Replen Plan (6) · R4 Master Plan (5) · R5 Inv Plan (6) · R6 System+AI (5) · R7 Dashboard+DataLoad (5)
// ─────────────────────────────────────────
const PLANEL_ENTRIES = [
  { patternCode: 'plannel_dm_master_basic',     patternLabel: 'PlanNEL — DM 기본 마스터 (Item/Customer/Site/Location/Workcenter/Resource/Supplier)',
    layoutCategory: 'LAYOUT_SINGLE', category: 'domain', usage: 7,
    description: '기본 마스터 CRUD — 단일 BaseGrid + 검색조건 + Add/Save/Delete',
    layers: [
      { key: "mainGrid", title: "그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./_planel/plannel_dm_master_basic/DmMasterBasicMockup')) },
  { patternCode: 'plannel_dm_hierarchy_tree',   patternLabel: 'PlanNEL — DM 계층 마스터 (Hrchy Config / Item Hrchy / Customer Hrchy)',
    layoutCategory: 'LAYOUT_H2', category: 'domain', usage: 3,
    description: '좌측 계층 TreeGrid + 우측 디테일 폼. LV1~LV5 정의 → 노드 클릭 시 우측 속성',
    layers: [
      { key: "leftTree", title: "트리", type: "GRID", subtype: "GRID_TREE", position: { x: 0, y: 0, w: 4, h: 12 } },
      { key: "rightForm", title: "패널 1", type: "GRID", subtype: "GRID_BASE", position: { x: 4, y: 0, w: 8, h: 12 } },
    ],
    component: lazy(() => import('./_planel/plannel_dm_hierarchy_tree/DmHierarchyTreeMockup')) },
  { patternCode: 'plannel_dm_calendar_rate',    patternLabel: 'PlanNEL — DM 시계열 마스터 (Calendar / Calendar Group / Exchange Rate / Unit Price)',
    layoutCategory: 'LAYOUT_V2', category: 'domain', usage: 4,
    description: '상단 마스터 헤더 + 하단 기간별 매트릭스. 일자/주차/월 column iteration',
    layers: [
      { key: "headerPanel", title: "패널 1", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 0, w: 12, h: 3 } },
      { key: "matrixGrid", title: "그리드", type: "GRID", subtype: "GRID_CROSSTAB", position: { x: 0, y: 3, w: 12, h: 9 } },
    ],
    component: lazy(() => import('./_planel/plannel_dm_calendar_rate/DmCalendarRateMockup')) },
  { patternCode: 'plannel_dm_relation_link',    patternLabel: 'PlanNEL — DM 관계 마스터 (Customer-Item / Location-Item / Customer-Location / Supplier-Item / Hrchy Perm)',
    layoutCategory: 'LAYOUT_H2', category: 'domain', usage: 5,
    description: '좌측 부모 마스터 + 우측 연결 자식 cross. 좌측 선택 → 우측 체크박스로 연결',
    layers: [
      { key: "parentGrid", title: "마스터 그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 0, w: 5, h: 12 } },
      { key: "childGrid", title: "디테일 그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 5, y: 0, w: 7, h: 12 } },
    ],
    component: lazy(() => import('./_planel/plannel_dm_relation_link/DmRelationLinkMockup')) },
  { patternCode: 'plannel_dm_bom_route',        patternLabel: 'PlanNEL — DM BOM/Route (BOM Master / BOM Detail / Route / Routing / BOD Master / BOD Item)',
    layoutCategory: 'LAYOUT_ROUTELAYOUT', category: 'domain', usage: 6,
    description: 'BOM / 공정 라우트 다이어그램. FLODiagram 풍 트리 + 노드별 detail',
    layers: [
      { key: "bomDiagram", title: "위젯 1", type: "CHART", subtype: "DIAGRAM_FLO", position: { x: 0, y: 0, w: 8, h: 12 } },
      { key: "nodeDetail", title: "패널 1", type: "GRID", subtype: "GRID_BASE", position: { x: 8, y: 0, w: 4, h: 12 } },
    ],
    component: lazy(() => import('./_planel/plannel_dm_bom_route/DmBomRouteMockup')) },
  { patternCode: 'plannel_dm_planning_grid',    patternLabel: 'PlanNEL — DM 시계열 계획 입력 (Sales Plan / Finance Plan / Purchase Budget / Material Receipt)',
    layoutCategory: 'LAYOUT_SINGLE', category: 'domain', usage: 4,
    description: '시계열 매트릭스 입력 — 좌측 고정 + 시간 버킷 피벗 + 직접 편집 셀',
    layers: [
      { key: "mainGrid", title: "그리드", type: "GRID", subtype: "GRID_CROSSTAB", position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./_planel/plannel_dm_planning_grid/DmPlanningGridMockup')) },
  { patternCode: 'plannel_dm_transaction_log',  patternLabel: 'PlanNEL — DM 거래 로그 (Sales/Inventory/Shipment/Prod/Purchase/Intransit/BF Feature 8종)',
    layoutCategory: 'LAYOUT_SINGLE', category: 'domain', usage: 8,
    description: '대량 거래 로그 그리드 — 필터 다중 + 페이지네이션 + 엑셀 익스포트',
    layers: [
      { key: "mainGrid", title: "그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./_planel/plannel_dm_transaction_log/DmTransactionLogMockup')) },

  // ── R2: Demand Plan (8 mockup) ──────────────────────────────────────
  { patternCode: 'plannel_dp_settings',         patternLabel: 'PlanNEL — DP 설정 (DP Settings / BF Settings / Target Item / Plan Horizon)',
    layoutCategory: 'LAYOUT_SINGLE', category: 'domain', usage: 4,
    description: '좌측 설정 카테고리 list + 우측 설정 폼. 4개 DP 정책/설정 통합',
    layers: [
      { key: "leftList", title: "패널 1", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 0, w: 3, h: 12 } },
      { key: "rightForm", title: "패널 2", type: "GRID", subtype: "GRID_BASE", position: { x: 3, y: 0, w: 9, h: 12 } },
    ],
    component: lazy(() => import('./_planel/plannel_dp_settings/DpSettingsMockup')) },
  { patternCode: 'plannel_bf_config',           patternLabel: 'PlanNEL — BF 알고리즘 설정 (Algorithm / Training / Access Control)',
    layoutCategory: 'LAYOUT_SINGLE', category: 'domain', usage: 3,
    description: 'BF 앙상블 알고리즘 가중치 + 학습 파라미터 + 권한',
    layers: [
      { key: "configPanel", title: "패널 1", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./_planel/plannel_bf_config/BfConfigMockup')) },
  { patternCode: 'plannel_dp_workbench',        patternLabel: 'PlanNEL — DP 워크벤치 (Workbench / Editable / Version Select / Scenario Compare)',
    layoutCategory: 'LAYOUT_H2', category: 'domain', usage: 4,
    description: '좌측 버전/시나리오 list + 우측 편집 매트릭스',
    layers: [
      { key: "leftList", title: "패널 1", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 0, w: 3, h: 12 } },
      { key: "rightGrid", title: "그리드", type: "GRID", subtype: "GRID_CROSSTAB", position: { x: 3, y: 0, w: 9, h: 12 } },
    ],
    component: lazy(() => import('./_planel/plannel_dp_workbench/DpWorkbenchMockup')) },
  { patternCode: 'plannel_dp_review',           patternLabel: 'PlanNEL — DP 검토 (BF Review / Process Management / Lifecycle)',
    layoutCategory: 'LAYOUT_DASHBOARD', category: 'domain', usage: 3,
    description: 'KPI cards + cycle stepper + 검토 진척 패널',
    layers: [
      { key: "kpi1", title: "KPI 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 0, w: 3, h: 3 } },
      { key: "kpi2", title: "KPI 2", type: "CHART", subtype: "KPI_CARD", position: { x: 3, y: 0, w: 3, h: 3 } },
      { key: "kpi3", title: "KPI 3", type: "CHART", subtype: "KPI_CARD", position: { x: 6, y: 0, w: 3, h: 3 } },
      { key: "kpi4", title: "KPI 4", type: "CHART", subtype: "KPI_CARD", position: { x: 9, y: 0, w: 3, h: 3 } },
      { key: "stepper", title: "Stepper", type: "CHART", subtype: "STEPPER", position: { x: 0, y: 3, w: 12, h: 3 } },
      { key: "reviewPanel", title: "패널 1", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 6, w: 12, h: 6 } },
    ],
    component: lazy(() => import('./_planel/plannel_dp_review/DpReviewMockup')) },
  { patternCode: 'plannel_dp_monitoring',       patternLabel: 'PlanNEL — DP 상태 모니터링 (DP Status Dashboard)',
    layoutCategory: 'LAYOUT_H2', category: 'domain', usage: 1,
    description: '좌측 실시간 alert + 우측 KPI grid',
    layers: [
      { key: "alertList", title: "패널 1", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 0, w: 5, h: 12 } },
      { key: "kpiGrid", title: "패널 2", type: "GRID", subtype: "GRID_BASE", position: { x: 5, y: 0, w: 7, h: 12 } },
    ],
    component: lazy(() => import('./_planel/plannel_dp_monitoring/DpMonitoringMockup')) },
  { patternCode: 'plannel_bf_accuracy',         patternLabel: 'PlanNEL — BF 정확도 & 리더보드 (Accuracy Report / Leaderboard / NPI History)',
    layoutCategory: 'LAYOUT_DASHBOARD', category: 'domain', usage: 3,
    description: '정확도 트렌드 + 알고리즘 leaderboard + NPI 이력',
    layers: [
      { key: "kpi1", title: "KPI 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 0, w: 4, h: 4 } },
      { key: "kpi2", title: "KPI 2", type: "CHART", subtype: "KPI_CARD", position: { x: 4, y: 0, w: 4, h: 4 } },
      { key: "trendChart", title: "차트", type: "CHART", subtype: "CHART_BAR", position: { x: 8, y: 0, w: 4, h: 4 } },
      { key: "leaderboard", title: "그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 4, w: 8, h: 8 } },
      { key: "npiHistory", title: "패널 1", type: "GRID", subtype: "GRID_BASE", position: { x: 8, y: 4, w: 4, h: 8 } },
    ],
    component: lazy(() => import('./_planel/plannel_bf_accuracy/BfAccuracyMockup')) },
  { patternCode: 'plannel_dp_reports',          patternLabel: 'PlanNEL — DP 리포트 (Plan vs Actual / Tracking / Item-Customer / Feature)',
    layoutCategory: 'LAYOUT_V2', category: 'domain', usage: 4,
    description: '상단 KPI summary + 하단 Plan/Actual 디테일 그리드',
    layers: [
      { key: "kpi1", title: "KPI 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 0, w: 3, h: 3 } },
      { key: "kpi2", title: "KPI 2", type: "CHART", subtype: "KPI_CARD", position: { x: 3, y: 0, w: 3, h: 3 } },
      { key: "kpi3", title: "KPI 3", type: "CHART", subtype: "KPI_CARD", position: { x: 6, y: 0, w: 3, h: 3 } },
      { key: "kpi4", title: "KPI 4", type: "CHART", subtype: "KPI_CARD", position: { x: 9, y: 0, w: 3, h: 3 } },
      { key: "detailGrid", title: "그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 3, w: 12, h: 9 } },
    ],
    component: lazy(() => import('./_planel/plannel_dp_reports/DpReportsMockup')) },
  { patternCode: 'plannel_sales_analysis',      patternLabel: 'PlanNEL — Sales 상위 분석 (Top Level Item)',
    layoutCategory: 'LAYOUT_SINGLE', category: 'domain', usage: 1,
    description: 'LV1~LV3 계층 집계 — 수량/금액/점유율/YoY',
    layers: [
      { key: "grid", title: "그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 0, w: 12, h: 8 } },
    ],
    component: lazy(() => import('./_planel/plannel_sales_analysis/SalesAnalysisMockup')) },

  // ── R3: Replenishment Plan (6 mockup) ────────────────────────────────
  { patternCode: 'plannel_rp_settings',         patternLabel: 'PlanNEL — RP 설정 (Settings / Policy / Distribution Network)',
    layoutCategory: 'LAYOUT_SINGLE', category: 'domain', usage: 3,
    description: 'RP 정책 + 분배 네트워크 노드 테이블',
    layers: [
      { key: "tabs", title: "탭 1", type: "CHART", subtype: "STEPPER", position: { x: 0, y: 0, w: 12, h: 1 } },
      { key: "panel1", title: "패널 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 1, w: 12, h: 3 } },
      { key: "grid", title: "그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 4, w: 12, h: 5 } },
    ],
    component: lazy(() => import('./_planel/plannel_rp_settings/RpSettingsMockup')) },
  { patternCode: 'plannel_rp_create',           patternLabel: 'PlanNEL — RP 계획 생성 (RP Demand / Run RP / RP Review)',
    layoutCategory: 'LAYOUT_H2', category: 'domain', usage: 3,
    description: '좌측 RP step stepper + 우측 실행 로그/결과',
    layers: [
      { key: "stepper", title: "Stepper", type: "CHART", subtype: "STEPPER", position: { x: 0, y: 0, w: 4, h: 8 } },
      { key: "panel1", title: "패널 1", type: "CHART", subtype: "KPI_CARD", position: { x: 4, y: 0, w: 8, h: 3 } },
      { key: "log", title: "로그", type: "GRID", subtype: "GRID_BASE", position: { x: 4, y: 3, w: 8, h: 5 } },
    ],
    component: lazy(() => import('./_planel/plannel_rp_create/RpCreateMockup')) },
  { patternCode: 'plannel_rp_workbench',        patternLabel: 'PlanNEL — RP 워크벤치 (RP Workbench)',
    layoutCategory: 'LAYOUT_DASHBOARD', category: 'domain', usage: 1,
    description: 'KPI cards + 발주 추천 그리드. 보충 의사결정 워크벤치',
    layers: [
      { key: "kpi1", title: "KPI 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 0, w: 2, h: 3 } },
      { key: "kpi2", title: "KPI 2", type: "CHART", subtype: "KPI_CARD", position: { x: 2, y: 0, w: 2, h: 3 } },
      { key: "kpi3", title: "KPI 3", type: "CHART", subtype: "KPI_CARD", position: { x: 4, y: 0, w: 2, h: 3 } },
      { key: "kpi4", title: "KPI 4", type: "CHART", subtype: "KPI_CARD", position: { x: 6, y: 0, w: 2, h: 3 } },
      { key: "kpi5", title: "KPI 5", type: "CHART", subtype: "KPI_CARD", position: { x: 8, y: 0, w: 4, h: 3 } },
      { key: "grid", title: "그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 3, w: 12, h: 6 } },
    ],
    component: lazy(() => import('./_planel/plannel_rp_workbench/RpWorkbenchMockup')) },
  { patternCode: 'plannel_rp_exceptions',       patternLabel: 'PlanNEL — RP 예외 (Inventory Exceptions / Detail / PSI Simulation)',
    layoutCategory: 'LAYOUT_V2', category: 'domain', usage: 3,
    description: '상단 예외 KPI + 하단 디테일 그리드',
    layers: [
      { key: "kpi1", title: "KPI 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 0, w: 3, h: 3 } },
      { key: "kpi2", title: "KPI 2", type: "CHART", subtype: "KPI_CARD", position: { x: 3, y: 0, w: 3, h: 3 } },
      { key: "kpi3", title: "KPI 3", type: "CHART", subtype: "KPI_CARD", position: { x: 6, y: 0, w: 3, h: 3 } },
      { key: "kpi4", title: "KPI 4", type: "CHART", subtype: "KPI_CARD", position: { x: 9, y: 0, w: 3, h: 3 } },
      { key: "grid", title: "그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 3, w: 12, h: 6 } },
    ],
    component: lazy(() => import('./_planel/plannel_rp_exceptions/RpExceptionsMockup')) },
  { patternCode: 'plannel_rp_reports',          patternLabel: 'PlanNEL — RP 리포트 (Order List / Plan vs Actual / Monthly Trend / Procurement / Expired)',
    layoutCategory: 'LAYOUT_DASHBOARD', category: 'domain', usage: 5,
    description: 'KPI + 발주 현황 + 월간 트렌드 통합 대시보드',
    layers: [
      { key: "kpi1", title: "KPI 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 0, w: 2, h: 3 } },
      { key: "kpi2", title: "KPI 2", type: "CHART", subtype: "KPI_CARD", position: { x: 2, y: 0, w: 2, h: 3 } },
      { key: "kpi3", title: "KPI 3", type: "CHART", subtype: "KPI_CARD", position: { x: 4, y: 0, w: 2, h: 3 } },
      { key: "kpi4", title: "KPI 4", type: "CHART", subtype: "KPI_CARD", position: { x: 6, y: 0, w: 2, h: 3 } },
      { key: "kpi5", title: "KPI 5", type: "CHART", subtype: "KPI_CARD", position: { x: 8, y: 0, w: 4, h: 3 } },
      { key: "grid", title: "그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 3, w: 8, h: 6 } },
      { key: "chart", title: "차트", type: "CHART", subtype: "CHART_BAR", position: { x: 8, y: 3, w: 4, h: 6 } },
    ],
    component: lazy(() => import('./_planel/plannel_rp_reports/RpReportsMockup')) },
  { patternCode: 'plannel_rp_fill_rate',        patternLabel: 'PlanNEL — RP Fill Rate & 시나리오 (Fill Rate / Scenario Comparison)',
    layoutCategory: 'LAYOUT_DASHBOARD', category: 'domain', usage: 2,
    description: '창고별 Fill Rate + 시나리오 (A/B/C) 비교',
    layers: [
      { key: "kpi1", title: "KPI 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 0, w: 4, h: 3 } },
      { key: "kpi2", title: "KPI 2", type: "CHART", subtype: "KPI_CARD", position: { x: 4, y: 0, w: 4, h: 3 } },
      { key: "kpi3", title: "KPI 3", type: "CHART", subtype: "KPI_CARD", position: { x: 8, y: 0, w: 4, h: 3 } },
      { key: "chart", title: "차트", type: "CHART", subtype: "CHART_BAR", position: { x: 0, y: 3, w: 6, h: 6 } },
      { key: "grid", title: "그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 6, y: 3, w: 6, h: 6 } },
    ],
    component: lazy(() => import('./_planel/plannel_rp_fill_rate/RpFillRateMockup')) },

  // ── R4: Master Plan (5 mockup) ──────────────────────────────────────
  { patternCode: 'plannel_mp_settings',         patternLabel: 'PlanNEL — MP 설정 (Settings / Material Constraints / Demand Priority)',
    layoutCategory: 'LAYOUT_SINGLE', category: 'domain', usage: 3,
    description: 'MP 정책 + 자재 capacity 제약 + 거래처 우선순위',
    layers: [
      { key: "tabs", title: "탭 1", type: "CHART", subtype: "STEPPER", position: { x: 0, y: 0, w: 12, h: 1 } },
      { key: "panel1", title: "패널 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 1, w: 12, h: 3 } },
      { key: "masterGrid", title: "마스터 그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 4, w: 6, h: 5 } },
      { key: "detailGrid", title: "디테일 그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 6, y: 4, w: 6, h: 5 } },
    ],
    component: lazy(() => import('./_planel/plannel_mp_settings/MpSettingsMockup')) },
  { patternCode: 'plannel_mp_create',           patternLabel: 'PlanNEL — MP 계획 생성 (MP Demand / Run MP / MP Review)',
    layoutCategory: 'LAYOUT_H2', category: 'domain', usage: 3,
    description: '좌측 MP 엔진 step + 우측 실행 로그/결과',
    layers: [
      { key: "stepper", title: "Stepper", type: "CHART", subtype: "STEPPER", position: { x: 0, y: 0, w: 4, h: 9 } },
      { key: "kpi1", title: "KPI 1", type: "CHART", subtype: "KPI_CARD", position: { x: 4, y: 0, w: 2, h: 3 } },
      { key: "kpi2", title: "KPI 2", type: "CHART", subtype: "KPI_CARD", position: { x: 6, y: 0, w: 2, h: 3 } },
      { key: "kpi3", title: "KPI 3", type: "CHART", subtype: "KPI_CARD", position: { x: 8, y: 0, w: 2, h: 3 } },
      { key: "kpi4", title: "KPI 4", type: "CHART", subtype: "KPI_CARD", position: { x: 10, y: 0, w: 2, h: 3 } },
      { key: "log", title: "로그", type: "GRID", subtype: "GRID_BASE", position: { x: 4, y: 3, w: 8, h: 6 } },
    ],
    component: lazy(() => import('./_planel/plannel_mp_create/MpCreateMockup')) },
  { patternCode: 'plannel_mp_exceptions',       patternLabel: 'PlanNEL — MP 예외 (Production Exceptions / Detail / PSI Simulation)',
    layoutCategory: 'LAYOUT_V2', category: 'domain', usage: 3,
    description: '상단 생산 예외 KPI + 하단 워크센터 위반 디테일',
    layers: [
      { key: "kpi1", title: "KPI 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 0, w: 3, h: 3 } },
      { key: "kpi2", title: "KPI 2", type: "CHART", subtype: "KPI_CARD", position: { x: 3, y: 0, w: 3, h: 3 } },
      { key: "kpi3", title: "KPI 3", type: "CHART", subtype: "KPI_CARD", position: { x: 6, y: 0, w: 3, h: 3 } },
      { key: "kpi4", title: "KPI 4", type: "CHART", subtype: "KPI_CARD", position: { x: 9, y: 0, w: 3, h: 3 } },
      { key: "grid", title: "그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 3, w: 12, h: 6 } },
    ],
    component: lazy(() => import('./_planel/plannel_mp_exceptions/MpExceptionsMockup')) },
  { patternCode: 'plannel_mp_reports',          patternLabel: 'PlanNEL — MP 리포트 (MRP Order List / Report / Order Tracking / Resource Plan)',
    layoutCategory: 'LAYOUT_DASHBOARD', category: 'domain', usage: 4,
    description: 'MRP KPI + WO 현황 + 자원 가동률',
    layers: [
      { key: "kpi1", title: "KPI 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 0, w: 3, h: 3 } },
      { key: "kpi2", title: "KPI 2", type: "CHART", subtype: "KPI_CARD", position: { x: 3, y: 0, w: 3, h: 3 } },
      { key: "kpi3", title: "KPI 3", type: "CHART", subtype: "KPI_CARD", position: { x: 6, y: 0, w: 3, h: 3 } },
      { key: "kpi4", title: "KPI 4", type: "CHART", subtype: "KPI_CARD", position: { x: 9, y: 0, w: 3, h: 3 } },
      { key: "grid", title: "그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 3, w: 8, h: 6 } },
      { key: "chart", title: "차트", type: "CHART", subtype: "CHART_BAR", position: { x: 8, y: 3, w: 4, h: 6 } },
    ],
    component: lazy(() => import('./_planel/plannel_mp_reports/MpReportsMockup')) },
  { patternCode: 'plannel_mp_scenario',         patternLabel: 'PlanNEL — MP 시나리오 비교 (MP Scenario Comparison Dashboard)',
    layoutCategory: 'LAYOUT_H2', category: 'domain', usage: 1,
    description: '좌측 4개 시나리오 list + 우측 KPI 비교 매트릭스',
    layers: [
      { key: "masterGrid", title: "마스터 그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 0, w: 5, h: 9 } },
      { key: "detailGrid", title: "디테일 그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 5, y: 0, w: 7, h: 9 } },
    ],
    component: lazy(() => import('./_planel/plannel_mp_scenario/MpScenarioMockup')) },

  // ── R5: Inventory Plan (6 mockup) ────────────────────────────────────
  { patternCode: 'plannel_ip_settings',         patternLabel: 'PlanNEL — IP 설정 (IP Settings)',
    layoutCategory: 'LAYOUT_SINGLE', category: 'domain', usage: 1,
    description: '재고 정책 / 서비스 레벨 / 동적 안전재고 설정',
    layers: [
      { key: "panel1", title: "패널 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 0, w: 12, h: 3 } },
      { key: "panel2", title: "패널 2", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 3, w: 12, h: 3 } },
      { key: "panel3", title: "패널 3", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 6, w: 12, h: 3 } },
    ],
    component: lazy(() => import('./_planel/plannel_ip_settings/IpSettingsMockup')) },
  { patternCode: 'plannel_ip_analysis',         patternLabel: 'PlanNEL — IP 분석 (Overview / Trend / Slow Moving / Supply 등 7종)',
    layoutCategory: 'LAYOUT_DASHBOARD', category: 'domain', usage: 7,
    description: '재고 KPI + 월간 트렌드 + Slow Moving 디테일',
    layers: [
      { key: "kpi1", title: "KPI 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 0, w: 2, h: 3 } },
      { key: "kpi2", title: "KPI 2", type: "CHART", subtype: "KPI_CARD", position: { x: 2, y: 0, w: 2, h: 3 } },
      { key: "kpi3", title: "KPI 3", type: "CHART", subtype: "KPI_CARD", position: { x: 4, y: 0, w: 2, h: 3 } },
      { key: "kpi4", title: "KPI 4", type: "CHART", subtype: "KPI_CARD", position: { x: 6, y: 0, w: 2, h: 3 } },
      { key: "kpi5", title: "KPI 5", type: "CHART", subtype: "KPI_CARD", position: { x: 8, y: 0, w: 4, h: 3 } },
      { key: "chart", title: "차트", type: "CHART", subtype: "CHART_BAR", position: { x: 0, y: 3, w: 4, h: 6 } },
      { key: "grid", title: "그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 4, y: 3, w: 8, h: 6 } },
    ],
    component: lazy(() => import('./_planel/plannel_ip_analysis/IpAnalysisMockup')) },
  { patternCode: 'plannel_ip_abc_xyz',          patternLabel: 'PlanNEL — IP ABC-XYZ 분석 (Scenarios / Results)',
    layoutCategory: 'LAYOUT_V2', category: 'domain', usage: 2,
    description: '상단 분석 입력 + 하단 ABC-XYZ 매트릭스 (3×3)',
    layers: [
      { key: "masterGrid", title: "마스터 그리드", type: "GRID", subtype: "GRID_CROSSTAB", position: { x: 0, y: 0, w: 5, h: 12 } },
      { key: "detailGrid", title: "디테일 그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 5, y: 0, w: 7, h: 12 } },
    ],
    component: lazy(() => import('./_planel/plannel_ip_abc_xyz/IpAbcXyzMockup')) },
  { patternCode: 'plannel_ip_evaluation',       patternLabel: 'PlanNEL — IP 평가 (Target Inventory Evaluation / Result)',
    layoutCategory: 'LAYOUT_DASHBOARD', category: 'domain', usage: 2,
    description: '평가 점수 KPI + 카테고리별 비교 + 품목 등급',
    layers: [
      { key: "kpi1", title: "KPI 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 0, w: 3, h: 3 } },
      { key: "kpi2", title: "KPI 2", type: "CHART", subtype: "KPI_CARD", position: { x: 3, y: 0, w: 3, h: 3 } },
      { key: "kpi3", title: "KPI 3", type: "CHART", subtype: "KPI_CARD", position: { x: 6, y: 0, w: 3, h: 3 } },
      { key: "kpi4", title: "KPI 4", type: "CHART", subtype: "KPI_CARD", position: { x: 9, y: 0, w: 3, h: 3 } },
      { key: "widget1", title: "위젯 1", type: "CHART", subtype: "CHART_BAR", position: { x: 0, y: 3, w: 7, h: 9 } },
      { key: "grid", title: "그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 7, y: 3, w: 5, h: 9 } },
    ],
    component: lazy(() => import('./_planel/plannel_ip_evaluation/IpEvaluationMockup')) },
  { patternCode: 'plannel_ip_simulation',       patternLabel: 'PlanNEL — IP 시뮬레이션 (Simulation / Results / AI Recommend)',
    layoutCategory: 'LAYOUT_H2', category: 'domain', usage: 3,
    description: '좌측 시나리오 + AI 추천 / 우측 결과 비교 KPI',
    layers: [
      { key: "panel1", title: "패널 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 0, w: 5, h: 12 } },
      { key: "panel2", title: "패널 2", type: "CHART", subtype: "KPI_CARD", position: { x: 5, y: 0, w: 7, h: 12 } },
    ],
    component: lazy(() => import('./_planel/plannel_ip_simulation/IpSimulationMockup')) },
  { patternCode: 'plannel_ip_comparison',       patternLabel: 'PlanNEL — IP 시나리오 비교 (IP Comparison Dashboard)',
    layoutCategory: 'LAYOUT_DASHBOARD', category: 'domain', usage: 1,
    description: 'Baseline vs Sim-A vs Sim-B 3-시나리오 비교',
    layers: [
      { key: "masterGrid", title: "마스터 그리드", type: "GRID", subtype: "GRID_CROSSTAB", position: { x: 0, y: 0, w: 12, h: 6 } },
      { key: "detailGrid", title: "디테일 그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 6, w: 12, h: 6 } },
    ],
    component: lazy(() => import('./_planel/plannel_ip_comparison/IpComparisonMockup')) },

  // ── R6: System + AI (5 mockup) ──────────────────────────────────────
  { patternCode: 'plannel_auth_signin',         patternLabel: 'PlanNEL — 인증 (Sign In / Sign Up / Forgot / Reset / 2FA / Mail Auth 9종)',
    layoutCategory: 'LAYOUT_SINGLE', category: 'meta', usage: 9,
    description: '중앙 인증 카드 + Sign-in Policy 패널',
    layers: [
      { key: "form", title: "폼", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 0, w: 8, h: 12 } },
      { key: "panel1", title: "패널 1", type: "CHART", subtype: "KPI_CARD", position: { x: 8, y: 0, w: 4, h: 12 } },
    ],
    component: lazy(() => import('./_planel/plannel_auth_signin/AuthSigninMockup')) },
  { patternCode: 'plannel_user_mgmt',           patternLabel: 'PlanNEL — 사용자 & 조직 (User Mgmt / Personal / Change Password / Company)',
    layoutCategory: 'LAYOUT_DASHBOARD', category: 'meta', usage: 4,
    description: '조직 KPI + 사용자 목록',
    layers: [
      { key: "panel1", title: "패널 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 0, w: 12, h: 3 } },
      { key: "kpi1", title: "KPI 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 3, w: 3, h: 3 } },
      { key: "kpi2", title: "KPI 2", type: "CHART", subtype: "KPI_CARD", position: { x: 3, y: 3, w: 3, h: 3 } },
      { key: "kpi3", title: "KPI 3", type: "CHART", subtype: "KPI_CARD", position: { x: 6, y: 3, w: 3, h: 3 } },
      { key: "kpi4", title: "KPI 4", type: "CHART", subtype: "KPI_CARD", position: { x: 9, y: 3, w: 3, h: 3 } },
      { key: "grid", title: "그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 6, w: 12, h: 6 } },
    ],
    component: lazy(() => import('./_planel/plannel_user_mgmt/UserMgmtMockup')) },
  { patternCode: 'plannel_schedule',            patternLabel: 'PlanNEL — 스케줄러 (Schedule Settings / History)',
    layoutCategory: 'LAYOUT_SINGLE', category: 'meta', usage: 2,
    description: '스케줄러 cron 설정 + 실행 이력',
    layers: [
      { key: "masterGrid", title: "마스터 그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 0, w: 7, h: 12 } },
      { key: "detailGrid", title: "디테일 그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 7, y: 0, w: 5, h: 12 } },
    ],
    component: lazy(() => import('./_planel/plannel_schedule/ScheduleMockup')) },
  { patternCode: 'plannel_audit',               patternLabel: 'PlanNEL — 감사 (Audit Trail / Difference)',
    layoutCategory: 'LAYOUT_V2', category: 'meta', usage: 2,
    description: '상단 감사 검색 + 하단 변경 이력 + Diff',
    layers: [
      { key: "masterGrid", title: "마스터 그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 0, w: 7, h: 12 } },
      { key: "panel1", title: "패널 1", type: "CHART", subtype: "KPI_CARD", position: { x: 7, y: 0, w: 5, h: 12 } },
    ],
    component: lazy(() => import('./_planel/plannel_audit/AuditMockup')) },
  { patternCode: 'plannel_version_mgmt',        patternLabel: 'PlanNEL — 버전 관리 (Version Management)',
    layoutCategory: 'LAYOUT_SINGLE', category: 'meta', usage: 1,
    description: '데이터 버전 스냅샷 목록 + 복원/비교/삭제',
    layers: [
      { key: "kpi1", title: "KPI 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 0, w: 3, h: 3 } },
      { key: "kpi2", title: "KPI 2", type: "CHART", subtype: "KPI_CARD", position: { x: 3, y: 0, w: 3, h: 3 } },
      { key: "kpi3", title: "KPI 3", type: "CHART", subtype: "KPI_CARD", position: { x: 6, y: 0, w: 3, h: 3 } },
      { key: "kpi4", title: "KPI 4", type: "CHART", subtype: "KPI_CARD", position: { x: 9, y: 0, w: 3, h: 3 } },
      { key: "grid", title: "그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 3, w: 12, h: 9 } },
    ],
    component: lazy(() => import('./_planel/plannel_version_mgmt/VersionMgmtMockup')) },

  // ── R7: Dashboard + Data Load (5 mockup) ─────────────────────────────
  { patternCode: 'plannel_dashboards',          patternLabel: 'PlanNEL — 통합 대시보드 (Integrated / DP / RP / IP Dashboards)',
    layoutCategory: 'LAYOUT_DASHBOARD', category: 'dashboard', usage: 4,
    description: 'Tab 전환 통합 대시보드. 전체 KPI + 모듈별 상태',
    layers: [
      { key: "kpi1", title: "KPI 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 0, w: 2, h: 3 } },
      { key: "kpi2", title: "KPI 2", type: "CHART", subtype: "KPI_CARD", position: { x: 2, y: 0, w: 3, h: 3 } },
      { key: "kpi3", title: "KPI 3", type: "CHART", subtype: "KPI_CARD", position: { x: 5, y: 0, w: 2, h: 3 } },
      { key: "kpi4", title: "KPI 4", type: "CHART", subtype: "KPI_CARD", position: { x: 7, y: 0, w: 3, h: 3 } },
      { key: "kpi5", title: "KPI 5", type: "CHART", subtype: "KPI_CARD", position: { x: 10, y: 0, w: 2, h: 3 } },
      { key: "widget1", title: "위젯 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 3, w: 3, h: 4 } },
      { key: "widget2", title: "위젯 2", type: "CHART", subtype: "KPI_CARD", position: { x: 3, y: 3, w: 3, h: 4 } },
      { key: "widget3", title: "위젯 3", type: "CHART", subtype: "KPI_CARD", position: { x: 6, y: 3, w: 3, h: 4 } },
      { key: "widget4", title: "위젯 4", type: "CHART", subtype: "KPI_CARD", position: { x: 9, y: 3, w: 3, h: 4 } },
      { key: "panel1", title: "패널 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 7, w: 6, h: 5 } },
      { key: "panel2", title: "패널 2", type: "CHART", subtype: "KPI_CARD", position: { x: 6, y: 7, w: 6, h: 5 } },
    ],
    component: lazy(() => import('./_planel/plannel_dashboards/DashboardsMockup')) },
  { patternCode: 'plannel_data_validation',     patternLabel: 'PlanNEL — 데이터 검증 (Data Validation / Load Validation)',
    layoutCategory: 'LAYOUT_DASHBOARD', category: 'domain', usage: 2,
    description: '업로드 진행 + 검증 결과 + 오류 상세',
    layers: [
      { key: "kpi1", title: "KPI 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 0, w: 3, h: 3 } },
      { key: "kpi2", title: "KPI 2", type: "CHART", subtype: "KPI_CARD", position: { x: 3, y: 0, w: 3, h: 3 } },
      { key: "kpi3", title: "KPI 3", type: "CHART", subtype: "KPI_CARD", position: { x: 6, y: 0, w: 3, h: 3 } },
      { key: "kpi4", title: "KPI 4", type: "CHART", subtype: "KPI_CARD", position: { x: 9, y: 0, w: 3, h: 3 } },
      { key: "panel1", title: "패널 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 3, w: 7, h: 9 } },
      { key: "grid", title: "그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 7, y: 3, w: 5, h: 9 } },
    ],
    component: lazy(() => import('./_planel/plannel_data_validation/DataValidationMockup')) },
  { patternCode: 'plannel_data_transform',      patternLabel: 'PlanNEL — 데이터 변환 (Data Transform)',
    layoutCategory: 'LAYOUT_SINGLE', category: 'domain', usage: 1,
    description: 'ETL 변환 룰 정의 + 파이프라인 진행',
    layers: [
      { key: "stepper", title: "Stepper", type: "CHART", subtype: "STEPPER", position: { x: 0, y: 0, w: 12, h: 3 } },
      { key: "grid", title: "그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 3, w: 12, h: 9 } },
    ],
    component: lazy(() => import('./_planel/plannel_data_transform/DataTransformMockup')) },
  { patternCode: 'plannel_data_history',        patternLabel: 'PlanNEL — 데이터 이력 (Data History / Transform History)',
    layoutCategory: 'LAYOUT_V2', category: 'domain', usage: 2,
    description: '통계 + LOAD/TRANSFORM 이력 통합 그리드',
    layers: [
      { key: "kpi1", title: "KPI 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 0, w: 3, h: 3 } },
      { key: "kpi2", title: "KPI 2", type: "CHART", subtype: "KPI_CARD", position: { x: 3, y: 0, w: 3, h: 3 } },
      { key: "kpi3", title: "KPI 3", type: "CHART", subtype: "KPI_CARD", position: { x: 6, y: 0, w: 3, h: 3 } },
      { key: "kpi4", title: "KPI 4", type: "CHART", subtype: "KPI_CARD", position: { x: 9, y: 0, w: 3, h: 3 } },
      { key: "grid", title: "그리드", type: "GRID", subtype: "GRID_BASE", position: { x: 0, y: 3, w: 12, h: 9 } },
    ],
    component: lazy(() => import('./_planel/plannel_data_history/DataHistoryMockup')) },
  { patternCode: 'plannel_system_error',        patternLabel: 'PlanNEL — 시스템 오류 페이지 (Not Found 404)',
    layoutCategory: 'LAYOUT_SINGLE', category: 'meta', usage: 1,
    description: '404 / 권한 오류 등 정적 에러 페이지',
    layers: [
      { key: "panel1", title: "패널 1", type: "CHART", subtype: "KPI_CARD", position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./_planel/plannel_system_error/SystemErrorMockup')) },
];

// ─────────────────────────────────────────
// KTNG — c:/vs_project/KTNG 의 KTNG 명시 화면 (bfktng/cmktng/dpktng/mpktng/rptktng) 68개를
// 27개 mockup 패턴으로 그룹화. 표준 화면 (master/controlboard/entry/report 등) 은
// 기존 t3series 표준 화면을 그대로 사용하므로 mockup 대상 외.
//
// 현재 라운드: 6개 component 연결 (BF 2 + CM 3 + DP psi 1)
// 다음 라운드: DP 9개 (upload/price_exchange/production_alloc/plc_lifecycle/org_mapping/
//                       demand_validation/domestic_entry/stuffing_report/approval)
// 그 다음:    MP 6개 (master_data/supply_summary/routing/rtf_adjustment/load_capacity/compare_check)
// 그 다음:    RPT 6개 (accuracy/execution/inventory_days/psi_working/forecast_daily/personalization)
// ─────────────────────────────────────────
const KTNG_ENTRIES = [
  // ── BF (3개 화면 → 2 mockups) ────────────────────────────────────────
  { patternCode: 'ktng_bf_promotion',       patternLabel: 'KTNG — BF 프로모션 계획 (BfKtng01/02)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 2, description: '한국/해외 프로모션 계획 — 거래처-품목 LV3 단위 기간·할인율·프로모션 유형',
    layers: [
      { key: 'mainGrid', title: '그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./_ktng/bf_promotion/BfPromotionMockup')) },
  { patternCode: 'ktng_bf_accuracy_trend',  patternLabel: 'KTNG — BF 수요예측 정확도 추이 (BfKtng03)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 1, description: 'M-1/M-2/M-3 예측 정확도 시계열 라인 차트 + 비교 그리드 + 목표선',
    layers: [
      { key: 'kpi1',        title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 0, y: 0, w: 3,  h: 3 } },
      { key: 'kpi2',        title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 3, y: 0, w: 3,  h: 3 } },
      { key: 'kpi3',        title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 6, y: 0, w: 3,  h: 3 } },
      { key: 'kpi4',        title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 9, y: 0, w: 3,  h: 3 } },
      { key: 'trendChart',  title: '차트',   type: 'CHART', subtype: 'CHART_LINE', position: { x: 0, y: 3, w: 12, h: 5 } },
      { key: 'compareGrid', title: '그리드', type: 'GRID',  subtype: 'GRID_BASE',  position: { x: 0, y: 8, w: 12, h: 4 } },
    ],
    component: lazy(() => import('./_ktng/bf_accuracy_trend/BfAccuracyTrendMockup')) },

  // ── CM (11개 화면 → 3 mockups) ──────────────────────────────────────
  { patternCode: 'ktng_cm_summary',         patternLabel: 'KTNG — 공헌이익 Summary (CmKtng01)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 1, description: 'KPI + 비용 항목 breakdown + 생산지별 Lvl 4 그리드',
    layers: [
      { key: 'kpi1',      title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 3,  h: 3 } },
      { key: 'kpi2',      title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 3, y: 0, w: 3,  h: 3 } },
      { key: 'kpi3',      title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 6, y: 0, w: 3,  h: 3 } },
      { key: 'kpi4',      title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 9, y: 0, w: 3,  h: 3 } },
      { key: 'costChart', title: '차트',   type: 'CHART', subtype: 'CHART_BAR', position: { x: 0, y: 3, w: 12, h: 3 } },
      { key: 'siteGrid',  title: '그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 6, w: 12, h: 6 } },
    ],
    component: lazy(() => import('./_ktng/cm_summary/CmSummaryMockup')) },
  { patternCode: 'ktng_cm_cost_breakdown',  patternLabel: 'KTNG — 비용 항목 분석 (CmKtng02~08)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 7, description: '재료비/마킹비/물류비/관세/정상자재/원화가/하이퍼인플레이션 — 단일 비용 항목 상세 분석',
    layers: [
      { key: 'kpi1',       title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 3,  h: 3 } },
      { key: 'kpi2',       title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 3, y: 0, w: 3,  h: 3 } },
      { key: 'kpi3',       title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 6, y: 0, w: 3,  h: 3 } },
      { key: 'kpi4',       title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 9, y: 0, w: 3,  h: 3 } },
      { key: 'trendChart', title: '차트',   type: 'CHART', subtype: 'CHART_BAR', position: { x: 0, y: 3, w: 12, h: 3 } },
      { key: 'detailGrid', title: '그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 6, w: 12, h: 6 } },
    ],
    component: lazy(() => import('./_ktng/cm_cost_breakdown/CmCostBreakdownMockup')) },
  { patternCode: 'ktng_cm_lvl4',            patternLabel: 'KTNG — Lvl 4 코드/공헌이익/Unmapping (CmKtng09/10/11)', layoutCategory: 'LAYOUT_H2', category: 'domain',
    usage: 3, description: '좌측 Lvl4 생산지 트리 + 우측 탭(속성/공헌이익/미매핑) 통합',
    layers: [
      { key: 'leftTree',  title: '마스터 그리드', type: 'GRID', subtype: 'GRID_TREE', position: { x: 0, y: 0, w: 3, h: 12 } },
      { key: 'rightTabs', title: '디테일 그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 3, y: 0, w: 9, h: 12 } },
    ],
    component: lazy(() => import('./_ktng/cm_lvl4/CmLvl4Mockup')) },

  // ── DP (18개 화면 → 10 mockups) ─────────────────────────────────────
  { patternCode: 'ktng_dp_upload',          patternLabel: 'KTNG — 판매실적/재고 Upload (DpKtng01)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 1, description: 'Excel/CSV 일괄 업로드 + 진행률 + 이력 로그',
    layers: [
      { key: 'uploadZone',     title: '위젯 1', type: 'CHART', subtype: 'STEPPER',   position: { x: 0, y: 0, w: 12, h: 4 } },
      { key: 'progressPanel',  title: '위젯 2', type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 4, w: 12, h: 2 } },
      { key: 'historyGrid',    title: '그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 6, w: 12, h: 6 } },
    ],
    component: lazy(() => import('./_ktng/dp_upload/DpUploadMockup')) },
  { patternCode: 'ktng_dp_price_exchange',  patternLabel: 'KTNG — 판가/환율 관리 (DpKtng02/19)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 2, description: '판가 마스터 + 환율 마스터 (탭 전환)',
    layers: [
      { key: 'priceGrid', title: '마스터 그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 7 } },
      { key: 'fxGrid',    title: '디테일 그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 7, w: 12, h: 5 } },
    ],
    component: lazy(() => import('./_ktng/dp_price_exchange/DpPriceExchangeMockup')) },
  { patternCode: 'ktng_dp_production_alloc',patternLabel: 'KTNG — 생산계획 할당 Rule (DpKtng03)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 1, description: '품목-생산지 우선순위 + 비율 매핑 (합계 100% 검증)',
    layers: [
      { key: 'mainGrid', title: '그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./_ktng/dp_production_alloc/DpProductionAllocMockup')) },
  { patternCode: 'ktng_dp_plc_lifecycle',   patternLabel: 'KTNG — PLC / EOP / 생명주기 (DpKtng04/14/16)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 3, description: '제품 생명주기 단계별 stepper + 신/구품 매핑 + EOP 수량',
    layers: [
      { key: 'stageStepper',  title: '위젯 1', type: 'CHART', subtype: 'STEPPER',   position: { x: 0, y: 0, w: 12, h: 3 } },
      { key: 'lifecycleGrid', title: '그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 3, w: 12, h: 9 } },
    ],
    component: lazy(() => import('./_ktng/dp_plc_lifecycle/DpPlcLifecycleMockup')) },
  { patternCode: 'ktng_dp_psi_crosstab',    patternLabel: 'KTNG — 판매계획 PSI 크로스탭 (DpKtng05/06/07/09)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 4, description: '판매계획 PSI 4종 — 좌측 고정 + 시간 버킷 피벗',
    layers: [
      { key: 'mainGrid', title: '그리드', type: 'GRID', subtype: 'GRID_CROSSTAB', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./_ktng/dp_psi_crosstab/DpPsiCrosstabMockup')) },
  { patternCode: 'ktng_dp_org_mapping',     patternLabel: 'KTNG — 영업조직 매핑 (DpKtng11/12)', layoutCategory: 'LAYOUT_V2', category: 'domain',
    usage: 2, description: '영업조직-제품레벨 + 영업조직-담당자 매핑 (상하 2분할)',
    layers: [
      { key: 'masterGrid', title: '마스터 그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 4 } },
      { key: 'detailGrid', title: '디테일 그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 4, w: 12, h: 4 } },
    ],
    component: lazy(() => import('./_ktng/dp_org_mapping/DpOrgMappingMockup')) },
  { patternCode: 'ktng_dp_demand_validation', patternLabel: 'KTNG — 수요 적정성 점검 (DpKtng15/17)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 2, description: '수출/내수 수요 적정성 룰별 통과/실패 + 위반 상세',
    layers: [
      { key: 'kpi1',    title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 3,  h: 3 } },
      { key: 'kpi2',    title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 3, y: 0, w: 3,  h: 3 } },
      { key: 'widget1', title: '위젯 1', type: 'CHART', subtype: 'CHART_BAR', position: { x: 6, y: 0, w: 6,  h: 3 } },
      { key: 'grid',    title: '그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 3, w: 12, h: 6 } },
    ],
    component: lazy(() => import('./_ktng/dp_demand_validation/DpDemandValidationMockup')) },
  { patternCode: 'ktng_dp_domestic_entry',  patternLabel: 'KTNG — 내수 수요 입력 (DpKtng18)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 1, description: '거래처-품목 × 월별 셀 직접 입력 (편집 가능)',
    layers: [
      { key: 'grid', title: '그리드', type: 'GRID', subtype: 'GRID_CROSSTAB', position: { x: 0, y: 0, w: 12, h: 8 } },
    ],
    component: lazy(() => import('./_ktng/dp_domestic_entry/DpDomesticEntryMockup')) },
  { patternCode: 'ktng_dp_stuffing_report', patternLabel: 'KTNG — Stuffing 리포트 (DpKtng20)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 1, description: '수출 컨테이너 적재 계획 — 거점·도착지·주차별 CNTR/CTN/CBM/Fill Rate',
    layers: [
      { key: 'kpi1', title: 'KPI 1', type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 3,  h: 3 } },
      { key: 'kpi2', title: 'KPI 2', type: 'CHART', subtype: 'KPI_CARD',  position: { x: 3, y: 0, w: 3,  h: 3 } },
      { key: 'kpi3', title: 'KPI 3', type: 'CHART', subtype: 'KPI_CARD',  position: { x: 6, y: 0, w: 3,  h: 3 } },
      { key: 'kpi4', title: 'KPI 4', type: 'CHART', subtype: 'KPI_CARD',  position: { x: 9, y: 0, w: 3,  h: 3 } },
      { key: 'grid', title: '그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 3, w: 12, h: 7 } },
    ],
    component: lazy(() => import('./_ktng/dp_stuffing_report/DpStuffingReportMockup')) },
  { patternCode: 'ktng_dp_approval',        patternLabel: 'KTNG — 결재 요청 현황 (DpKtngApv)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 1, description: '수요계획 결재 워크플로 — 단계별 진행 상태',
    layers: [
      { key: 'kpi1', title: 'KPI 1', type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 3,  h: 3 } },
      { key: 'kpi2', title: 'KPI 2', type: 'CHART', subtype: 'KPI_CARD',  position: { x: 3, y: 0, w: 3,  h: 3 } },
      { key: 'kpi3', title: 'KPI 3', type: 'CHART', subtype: 'KPI_CARD',  position: { x: 6, y: 0, w: 3,  h: 3 } },
      { key: 'kpi4', title: 'KPI 4', type: 'CHART', subtype: 'KPI_CARD',  position: { x: 9, y: 0, w: 3,  h: 3 } },
      { key: 'grid', title: '그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 3, w: 12, h: 7 } },
    ],
    component: lazy(() => import('./_ktng/dp_approval/DpApprovalMockup')) },

  // ── MP (9개 화면 → 6 mockups) ───────────────────────────────────────
  { patternCode: 'ktng_mp_master_data',     patternLabel: 'KTNG — MP 기준정보 / 자재 마스터 (MpKtng01/09)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 2, description: 'MP 기준정보 + 자재 마스터 (탭 전환)',
    layers: [
      { key: 'masterGrid', title: '마스터 그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 4 } },
      { key: 'detailGrid', title: '디테일 그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 4, w: 12, h: 4 } },
    ],
    component: lazy(() => import('./_ktng/mp_master_data/MpMasterDataMockup')) },
  { patternCode: 'ktng_mp_supply_summary',  patternLabel: 'KTNG — 공급계획 결과 요약 (MpKtng02)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 1, description: '제품 형태별 PSI 집계 + 주차별 트렌드',
    layers: [
      { key: 'kpi1',  title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 3,  h: 3 } },
      { key: 'kpi2',  title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 3, y: 0, w: 3,  h: 3 } },
      { key: 'kpi3',  title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 6, y: 0, w: 3,  h: 3 } },
      { key: 'kpi4',  title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 9, y: 0, w: 3,  h: 3 } },
      { key: 'chart', title: '차트',   type: 'CHART', subtype: 'CHART_BAR', position: { x: 0, y: 3, w: 12, h: 4 } },
      { key: 'grid',  title: '그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 7, w: 12, h: 5 } },
    ],
    component: lazy(() => import('./_ktng/mp_supply_summary/MpSupplySummaryMockup')) },
  { patternCode: 'ktng_mp_routing',         patternLabel: 'KTNG — 공급망 라우팅 (MpKtng03)', layoutCategory: 'LAYOUT_ROUTELAYOUT', category: 'domain',
    usage: 1, description: '공장→DC→항구→해외 거점 운송 경로 다이어그램 + 경로별 L/T/비용',
    layers: [
      { key: 'route', title: '라우트', type: 'CHART', subtype: 'DIAGRAM_FLO', position: { x: 0, y: 0, w: 12, h: 6 } },
      { key: 'grid',  title: '그리드', type: 'GRID',  subtype: 'GRID_BASE',   position: { x: 0, y: 6, w: 12, h: 5 } },
    ],
    component: lazy(() => import('./_ktng/mp_routing/MpRoutingMockup')) },
  { patternCode: 'ktng_mp_rtf_adjustment',  patternLabel: 'KTNG — RTF 조정 (MpKtng04)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 1, description: 'RTF 부족 시 거래처 우선순위 기반 할당량 수동 조정',
    layers: [
      { key: 'kpi1', title: 'KPI 1', type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 3,  h: 3 } },
      { key: 'kpi2', title: 'KPI 2', type: 'CHART', subtype: 'KPI_CARD',  position: { x: 3, y: 0, w: 3,  h: 3 } },
      { key: 'kpi3', title: 'KPI 3', type: 'CHART', subtype: 'KPI_CARD',  position: { x: 6, y: 0, w: 3,  h: 3 } },
      { key: 'kpi4', title: 'KPI 4', type: 'CHART', subtype: 'KPI_CARD',  position: { x: 9, y: 0, w: 3,  h: 3 } },
      { key: 'grid', title: '그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 3, w: 12, h: 7 } },
    ],
    component: lazy(() => import('./_ktng/mp_rtf_adjustment/MpRtfAdjustmentMockup')) },
  { patternCode: 'ktng_mp_load_capacity',   patternLabel: 'KTNG — 공장/설비 부하·가동조건 (MpKtng05/07)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 2, description: '공장 / 설비 단위 부하율 + 교대·가동시간 가동조건',
    layers: [
      { key: 'masterGrid', title: '마스터 그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 4 } },
      { key: 'detailGrid', title: '디테일 그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 4, w: 12, h: 4 } },
    ],
    component: lazy(() => import('./_ktng/mp_load_capacity/MpLoadCapacityMockup')) },
  { patternCode: 'ktng_mp_compare_check',   patternLabel: 'KTNG — 예측 비교 / 정수 점검 (MpKtng06/08)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 2, description: 'BF vs 회귀 예측 정확도 비교 + 설비별 정수/부정수 점검',
    layers: [
      { key: 'masterGrid', title: '마스터 그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 4 } },
      { key: 'detailGrid', title: '디테일 그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 4, w: 12, h: 4 } },
    ],
    component: lazy(() => import('./_ktng/mp_compare_check/MpCompareCheckMockup')) },

  // ── RPT (27개 화면 → 6 mockups) ─────────────────────────────────────
  { patternCode: 'ktng_rpt_accuracy',       patternLabel: 'KTNG — 예측 정확도 리포트 (RptKtng01~06)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 6, description: 'Sell Out / 유통재고 / 수요예측 / 수요입력 정확도 6개 통합',
    layers: [
      { key: 'tabs', title: '탭 1',   type: 'CHART', subtype: 'STEPPER',   position: { x: 0, y: 0, w: 12, h: 1 } },
      { key: 'kpi1', title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 1, w: 3,  h: 3 } },
      { key: 'kpi2', title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 3, y: 1, w: 3,  h: 3 } },
      { key: 'kpi3', title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 6, y: 1, w: 3,  h: 3 } },
      { key: 'kpi4', title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 9, y: 1, w: 3,  h: 3 } },
      { key: 'grid', title: '그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 4, w: 12, h: 8 } },
    ],
    component: lazy(() => import('./_ktng/rpt_accuracy/RptAccuracyMockup')) },
  { patternCode: 'ktng_rpt_execution',      patternLabel: 'KTNG — 실행율 / 진척율 (RptKtng07~11)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 5, description: 'MP 실행율 / RTF 실행율 / 연간계획 진척율 5개 통합',
    layers: [
      { key: 'tabs',  title: '탭 1',   type: 'CHART', subtype: 'STEPPER',   position: { x: 0,  y: 0, w: 12, h: 1 } },
      { key: 'kpi1',  title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0,  y: 1, w: 2,  h: 3 } },
      { key: 'kpi2',  title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 2,  y: 1, w: 3,  h: 3 } },
      { key: 'kpi3',  title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 5,  y: 1, w: 3,  h: 3 } },
      { key: 'kpi4',  title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 8,  y: 1, w: 2,  h: 3 } },
      { key: 'kpi5',  title: 'KPI 5',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 10, y: 1, w: 2,  h: 3 } },
      { key: 'chart', title: '차트',   type: 'CHART', subtype: 'CHART_BAR', position: { x: 0,  y: 4, w: 12, h: 5 } },
      { key: 'grid',  title: '그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0,  y: 9, w: 12, h: 6 } },
    ],
    component: lazy(() => import('./_ktng/rpt_execution/RptExecutionMockup')) },
  { patternCode: 'ktng_rpt_inventory_days', patternLabel: 'KTNG — 재고일수 / 장기재고 (RptKtng12~15, 26)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 5, description: '완제품 재고일수 + 장기재고 + WMS — 거점·품목군 × 30/60/90/180일 Aging',
    layers: [
      { key: 'tabs', title: '탭 1',   type: 'CHART', subtype: 'STEPPER',   position: { x: 0, y: 0, w: 12, h: 1 } },
      { key: 'kpi1', title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 1, w: 3,  h: 3 } },
      { key: 'kpi2', title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 3, y: 1, w: 3,  h: 3 } },
      { key: 'kpi3', title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 6, y: 1, w: 3,  h: 3 } },
      { key: 'kpi4', title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 9, y: 1, w: 3,  h: 3 } },
      { key: 'grid', title: '그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 4, w: 12, h: 8 } },
    ],
    component: lazy(() => import('./_ktng/rpt_inventory_days/RptInventoryDaysMockup')) },
  { patternCode: 'ktng_rpt_psi_working',    patternLabel: 'KTNG — Working Report PSI (RptKtng16~22)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 7, description: '7개 채널 PSI / 계획 vs 실적 — 거점 × 품목군 × 주차별 PLAN/ACTUAL/INV',
    layers: [
      { key: 'tabs', title: '탭 1',   type: 'CHART', subtype: 'STEPPER',       position: { x: 0, y: 0, w: 12, h: 1  } },
      { key: 'grid', title: '그리드', type: 'GRID',  subtype: 'GRID_CROSSTAB', position: { x: 0, y: 1, w: 12, h: 11 } },
    ],
    component: lazy(() => import('./_ktng/rpt_psi_working/RptPsiWorkingMockup')) },
  { patternCode: 'ktng_rpt_forecast_daily', patternLabel: 'KTNG — 연간 전망 / Daily 실적 (RptKtng23~25)', layoutCategory: 'LAYOUT_V2', category: 'domain',
    usage: 3, description: '연간 생산/판매 전망 (월별) + Daily 실적 (일별) — 상하 2분할',
    layers: [
      { key: 'tabs',  title: '탭 1',   type: 'CHART', subtype: 'STEPPER',   position: { x: 0, y: 0, w: 12, h: 1 } },
      { key: 'chart', title: '차트',   type: 'CHART', subtype: 'CHART_BAR', position: { x: 0, y: 1, w: 12, h: 6 } },
      { key: 'grid',  title: '그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 7, w: 12, h: 6 } },
    ],
    component: lazy(() => import('./_ktng/rpt_forecast_daily/RptForecastDailyMockup')) },
  { patternCode: 'ktng_rpt_personalization', patternLabel: 'KTNG — 개인화 버전 관리 (RptKtng00)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 1, description: '리포트별 저장된 개인화 버전 (필터·파라미터) 관리 + 공유/즐겨찾기/복제',
    layers: [
      { key: 'kpi1', title: 'KPI 1', type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 3,  h: 3 } },
      { key: 'kpi2', title: 'KPI 2', type: 'CHART', subtype: 'KPI_CARD',  position: { x: 3, y: 0, w: 3,  h: 3 } },
      { key: 'kpi3', title: 'KPI 3', type: 'CHART', subtype: 'KPI_CARD',  position: { x: 6, y: 0, w: 3,  h: 3 } },
      { key: 'kpi4', title: 'KPI 4', type: 'CHART', subtype: 'KPI_CARD',  position: { x: 9, y: 0, w: 3,  h: 3 } },
      { key: 'grid', title: '그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 3, w: 12, h: 9 } },
    ],
    component: lazy(() => import('./_ktng/rpt_personalization/RptPersonalizationMockup')) },
];

// ─────────────────────────────────────────
// ORON (오론) — view/oron 의 ORN_* 화면 ~118개를 22개 mockup 패턴으로 그룹화.
// MP(8) · PK(6) · DP(3) · RP(3) · YP(2). 화장품 OEM/자사 SCM 도메인 (마스크/세럼/토너/선크림/포장재).
// ─────────────────────────────────────────
const ORON_ENTRIES = [
  // ── MP — 공급/생산계획 (8 mockups) ──────────────────────────────────
  { patternCode: 'oron_mp_master',        patternLabel: 'ORON — MP 기준정보 마스터 (완제품/반제품/자재/자원/그룹)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 5, description: '공급 계획 기준정보 5개 탭 통합 CRUD (완제품·반제품·원부자재·생산라인·제품그룹)',
    layers: [
      { key: 'mainGrid', title: '그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./_oron/mp_master/OronMpMasterMockup')) },
  { patternCode: 'oron_mp_bom_route',     patternLabel: 'ORON — BOM + 생산순서 정의', layoutCategory: 'LAYOUT_H2', category: 'domain',
    usage: 2, description: '좌측 BOM 트리 다단 전개 + 우측 생산순서 (라인별 공정 SEQ + SETUP/RUN_RATE)',
    layers: [
      { key: 'bomTree',  title: '마스터 그리드', type: 'GRID', subtype: 'GRID_TREE', position: { x: 0, y: 0, w: 5, h: 12 } },
      { key: 'seqGrid',  title: '디테일 그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 5, y: 0, w: 7, h: 12 } },
    ],
    component: lazy(() => import('./_oron/mp_bom_route/OronMpBomRouteMockup')) },
  { patternCode: 'oron_mp_capacity',      patternLabel: 'ORON — 생산능력 + 캘린더 + 작업교체시간', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 5, description: 'BOR + JC_TIME 매트릭스 + 라인 캘린더 + 동시생산제약',
    layers: [
      { key: 'borGrid',  title: '그리드 1', type: 'GRID', subtype: 'GRID_BASE',  position: { x: 0, y: 0, w: 7, h: 6 } },
      { key: 'jcMatrix', title: '그리드 2', type: 'GRID', subtype: 'GRID_BASE',  position: { x: 7, y: 0, w: 5, h: 6 } },
      { key: 'calGrid',  title: '그리드 3', type: 'GRID', subtype: 'GRID_BASE',  position: { x: 0, y: 6, w: 12, h: 6 } },
    ],
    component: lazy(() => import('./_oron/mp_capacity/OronMpCapacityMockup')) },
  { patternCode: 'oron_mp_simulation',    patternLabel: 'ORON — 공급계획 시뮬레이션 컨트롤보드', layoutCategory: 'LAYOUT_CONTROLBOARD', category: 'controlboard',
    usage: 3, description: '공급계획 엔진 6단계 진행 + 실시간 로그 + 기준정보 점검 결과',
    layers: [
      { key: 'stepper',  title: '패널 1', type: 'CHART', subtype: 'STEPPER',  position: { x: 0, y: 0, w: 12, h: 3 } },
      { key: 'kpi1',     title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 3, w: 3,  h: 2 } },
      { key: 'kpi2',     title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD', position: { x: 3, y: 3, w: 3,  h: 2 } },
      { key: 'kpi3',     title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD', position: { x: 6, y: 3, w: 3,  h: 2 } },
      { key: 'kpi4',     title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD', position: { x: 9, y: 3, w: 3,  h: 2 } },
      { key: 'logPanel', title: '로그',   type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 5, w: 7,  h: 7 } },
      { key: 'validPanel', title: '패널 3', type: 'GRID', subtype: 'GRID_BASE', position: { x: 7, y: 5, w: 5, h: 7 } },
    ],
    component: lazy(() => import('./_oron/mp_simulation/OronMpSimulationMockup')) },
  { patternCode: 'oron_mp_plan_adj',      patternLabel: 'ORON — 완제품/반제품 생산계획 편성·수정', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 6, description: '라인×품목 주별 크로스탭 (수요 vs 계획 차이 시각화) + 편성 저장',
    layers: [
      { key: 'planGrid', title: '그리드', type: 'GRID', subtype: 'GRID_PIVOT', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./_oron/mp_plan_adj/OronMpPlanAdjMockup')) },
  { patternCode: 'oron_mp_mrp_psi',       patternLabel: 'ORON — 원부자재 발주요청 + PSI', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 6, description: '원부자재 PSI 크로스탭(주별) + 발주요청 (내자/외자/통합) + 자재별 재고',
    layers: [
      { key: 'mainGrid', title: '그리드', type: 'GRID', subtype: 'GRID_PIVOT', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./_oron/mp_mrp_psi/OronMpMrpPsiMockup')) },
  { patternCode: 'oron_mp_material_move', patternLabel: 'ORON — 공장이동 요청·확정 (반제품/자재/외자)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 4, description: '공장간 자재 이동 요청→본사 확정→운송→도착 워크플로우 (외자 통관 포함)',
    layers: [
      { key: 'mainGrid', title: '그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./_oron/mp_material_move/OronMpMaterialMoveMockup')) },
  { patternCode: 'oron_mp_bundle',        patternLabel: 'ORON — 번들작업 + OEM 요청 + 생산실적 대비', layoutCategory: 'LAYOUT_V2', category: 'domain',
    usage: 4, description: '번들 작업 헤더+상세 (구성 품목 재고/부족) + 라인×품목 계획 대비 실적',
    layers: [
      { key: 'bundleHdr', title: '그리드 1', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 6, h: 6 } },
      { key: 'bundleDtl', title: '그리드 2', type: 'GRID', subtype: 'GRID_BASE', position: { x: 6, y: 0, w: 6, h: 6 } },
      { key: 'planAct',   title: '그리드 3', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 6, w: 12, h: 6 } },
    ],
    component: lazy(() => import('./_oron/mp_bundle/OronMpBundleMockup')) },

  // ── PK — 포장재 계획 (6 mockups) ────────────────────────────────────
  { patternCode: 'oron_pk_master',        patternLabel: 'ORON — 포장재 기준정보 (제품/반제품/자재/자원/재고)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 10, description: '포장재 계획 기준정보 7개 탭 통합 CRUD. 인쇄→가공→분단 공정 체인',
    layers: [
      { key: 'mainGrid', title: '그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./_oron/pk_master/OronPkMasterMockup')) },
  { patternCode: 'oron_pk_simulation',    patternLabel: 'ORON — 포장재 계획 생성 + 시나리오 관리', layoutCategory: 'LAYOUT_CONTROLBOARD', category: 'controlboard',
    usage: 2, description: '포장재 6단계 엔진 (수요→재고→인쇄→가공→분단→확정) + 시나리오 카탈로그 + 로그',
    layers: [
      { key: 'stepper',   title: '패널 1', type: 'CHART', subtype: 'STEPPER',   position: { x: 0, y: 0, w: 12, h: 3 } },
      { key: 'scenGrid',  title: '로그',   type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 3, w: 6,  h: 9 } },
      { key: 'logPane',   title: '패널 3', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 6, y: 3, w: 6,  h: 9 } },
    ],
    component: lazy(() => import('./_oron/pk_simulation/OronPkSimulationMockup')) },
  { patternCode: 'oron_pk_process_plan',  patternLabel: 'ORON — 인쇄/가공/분단 생산계획 관리·점검', layoutCategory: 'LAYOUT_V2', category: 'domain',
    usage: 7, description: '상단 공정별 생산계획 (라인×품목, Setup/End) + 하단 자동/수동 점검 결과',
    layers: [
      { key: 'planGrid',   title: '그리드 1', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 7 } },
      { key: 'notifyGrid', title: '그리드 2', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 7, w: 12, h: 5 } },
    ],
    component: lazy(() => import('./_oron/pk_process_plan/OronPkProcessPlanMockup')) },
  { patternCode: 'oron_pk_daily_plan',    patternLabel: 'ORON — 일일/주간 생산계획 + 배송계획', layoutCategory: 'LAYOUT_V2', category: 'domain',
    usage: 5, description: '일별 라인×품목 생산 크로스탭 + 공장간/외부 배송계획',
    layers: [
      { key: 'dailyGrid',   title: '그리드 1', type: 'GRID', subtype: 'GRID_PIVOT', position: { x: 0, y: 0, w: 12, h: 7 } },
      { key: 'deliveryGrid',title: '그리드 2', type: 'GRID', subtype: 'GRID_BASE',  position: { x: 0, y: 7, w: 12, h: 5 } },
    ],
    component: lazy(() => import('./_oron/pk_daily_plan/OronPkDailyPlanMockup')) },
  { patternCode: 'oron_pk_mat_req',       patternLabel: 'ORON — 자재/잉크/원단/지관 소요량 + 발주 분배', layoutCategory: 'LAYOUT_V2', category: 'domain',
    usage: 8, description: '자재별 소요량 자동 생성 + 보유 재고 차감 + 부족분 발주 + 공장별 분배',
    layers: [
      { key: 'reqGrid',  title: '그리드 1', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 7 } },
      { key: 'distGrid', title: '그리드 2', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 7, w: 12, h: 5 } },
    ],
    component: lazy(() => import('./_oron/pk_mat_req/OronPkMatReqMockup')) },
  { patternCode: 'oron_pk_actual',        patternLabel: 'ORON — 포장재 생산실적 + 이슈 + 전송', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 5, description: 'KPI + 생산계획 대비 실적 + 라인별 이슈사항 + 배송/생산 전송 조회',
    layers: [
      { key: 'kpi1',     title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 3,  h: 3 } },
      { key: 'kpi2',     title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 3, y: 0, w: 3,  h: 3 } },
      { key: 'kpi3',     title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 6, y: 0, w: 3,  h: 3 } },
      { key: 'kpi4',     title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 9, y: 0, w: 3,  h: 3 } },
      { key: 'actGrid',  title: '그리드 1', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 3, w: 12, h: 5 } },
      { key: 'issueGrid', title: '그리드 2', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 8, w: 12, h: 4 } },
    ],
    component: lazy(() => import('./_oron/pk_actual/OronPkActualMockup')) },

  // ── DP — 수요/판매계획 (3 mockups) ──────────────────────────────────
  { patternCode: 'oron_dp_entry',         patternLabel: 'ORON — 판매계획 입력 (PSI 크로스탭)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 3, description: '좌측 고정 5컬럼 + 우측 동적 월 버킷. 판매계획 vs 실적(잠금) vs 재고계획',
    layers: [
      { key: 'kpi1',    title: 'KPI 1', type: 'CHART', subtype: 'KPI_CARD',   position: { x: 0, y: 0, w: 3,  h: 3 } },
      { key: 'kpi2',    title: 'KPI 2', type: 'CHART', subtype: 'KPI_CARD',   position: { x: 3, y: 0, w: 3,  h: 3 } },
      { key: 'kpi3',    title: 'KPI 3', type: 'CHART', subtype: 'KPI_CARD',   position: { x: 6, y: 0, w: 3,  h: 3 } },
      { key: 'kpi4',    title: 'KPI 4', type: 'CHART', subtype: 'KPI_CARD',   position: { x: 9, y: 0, w: 3,  h: 3 } },
      { key: 'psiGrid', title: '그리드', type: 'GRID', subtype: 'GRID_PIVOT', position: { x: 0, y: 3, w: 12, h: 9 } },
    ],
    component: lazy(() => import('./_oron/dp_entry/OronDpEntryMockup')) },
  { patternCode: 'oron_dp_chart',         patternLabel: 'ORON — 판매계획 입력/보고서 (Chart)', layoutCategory: 'LAYOUT_V2', category: 'domain',
    usage: 3, description: '라인 차트 (V현재 vs V이전 vs 실적 vs BF) + 채널별 Stacked Bar',
    layers: [
      { key: 'lineChart',  title: '차트 1', type: 'CHART', subtype: 'CHART_LINE', position: { x: 0, y: 0, w: 12, h: 7 } },
      { key: 'stackChart', title: '차트 2', type: 'CHART', subtype: 'CHART_BAR',  position: { x: 0, y: 7, w: 12, h: 5 } },
    ],
    component: lazy(() => import('./_oron/dp_chart/OronDpChartMockup')) },
  { patternCode: 'oron_dp_master_review', patternLabel: 'ORON — 판매계획 기준정보 + 검토 + 적중률', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 6, description: '담당자 관리 · 전략 브랜드 · 출고가 · 매핑 · 계획 검토 · 적중률 보고서 통합',
    layers: [
      { key: 'userMap',   title: '그리드 1', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 4 } },
      { key: 'brandGrid', title: '그리드 2', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 4, w: 12, h: 4 } },
      { key: 'accGrid',   title: '그리드 3', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 8, w: 12, h: 4 } },
    ],
    component: lazy(() => import('./_oron/dp_master_review/OronDpMasterReviewMockup')) },

  // ── RP — 분배계획 (3 mockups) ───────────────────────────────────────
  { patternCode: 'oron_rp_request',       patternLabel: 'ORON — 분배요청/주문 입력·조회·확정', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 8, description: '물류센터·영업소 주문 입력→조회→특정 요청/확정→추가의뢰→거점 기준정보',
    layers: [
      { key: 'mainGrid', title: '그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./_oron/rp_request/OronRpRequestMockup')) },
  { patternCode: 'oron_rp_availability',  patternLabel: 'ORON — 분배 가용량 + 시뮬레이션 + 결과', layoutCategory: 'LAYOUT_CONTROLBOARD', category: 'controlboard',
    usage: 6, description: '분배 5단계 엔진 + 품목별 가용량 산정 + 주문별 할당 결과',
    layers: [
      { key: 'stepper',   title: '패널 1', type: 'CHART', subtype: 'STEPPER',   position: { x: 0, y: 0, w: 12, h: 3 } },
      { key: 'kpi1',      title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 3, w: 3,  h: 2 } },
      { key: 'kpi2',      title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 3, y: 3, w: 3,  h: 2 } },
      { key: 'kpi3',      title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 6, y: 3, w: 3,  h: 2 } },
      { key: 'kpi4',      title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 9, y: 3, w: 3,  h: 2 } },
      { key: 'availGrid', title: '그리드 1', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 5, w: 6,  h: 7 } },
      { key: 'allocGrid', title: '그리드 2', type: 'GRID', subtype: 'GRID_BASE', position: { x: 6, y: 5, w: 6,  h: 7 } },
    ],
    component: lazy(() => import('./_oron/rp_availability/OronRpAvailabilityMockup')) },
  { patternCode: 'oron_rp_actual',        patternLabel: 'ORON — 분배 계획/실적 + 출하 + OSLS 수신', layoutCategory: 'LAYOUT_V2', category: 'domain',
    usage: 3, description: '거점별 분배 계획 vs 실적 주별 크로스탭 + OSLS 인터페이스 수신 이력',
    layers: [
      { key: 'planActGrid', title: '그리드 1', type: 'GRID', subtype: 'GRID_PIVOT', position: { x: 0, y: 0, w: 12, h: 7 } },
      { key: 'oslsGrid',    title: '그리드 2', type: 'GRID', subtype: 'GRID_BASE',  position: { x: 0, y: 7, w: 12, h: 5 } },
    ],
    component: lazy(() => import('./_oron/rp_actual/OronRpActualMockup')) },

  // ── YP — 연간계획 (2 mockups) ───────────────────────────────────────
  { patternCode: 'oron_yp_controlboard',  patternLabel: 'ORON — 연간계획 생성·관리 컨트롤보드', layoutCategory: 'LAYOUT_CONTROLBOARD', category: 'controlboard',
    usage: 3, description: '연간계획 6단계 (목표→마케팅→영업팀→원료감자→통합조정→확정) + 팀별 진척 현황',
    layers: [
      { key: 'stepper',   title: '패널 1', type: 'CHART', subtype: 'STEPPER',   position: { x: 0, y: 0, w: 12, h: 3 } },
      { key: 'kpi1',      title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 3, w: 3,  h: 2 } },
      { key: 'kpi2',      title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 3, y: 3, w: 3,  h: 2 } },
      { key: 'kpi3',      title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 6, y: 3, w: 3,  h: 2 } },
      { key: 'kpi4',      title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 9, y: 3, w: 3,  h: 2 } },
      { key: 'teamGrid',  title: '그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 5, w: 12, h: 7 } },
    ],
    component: lazy(() => import('./_oron/yp_controlboard/OronYpControlBoardMockup')) },
  { patternCode: 'oron_yp_entry',         patternLabel: 'ORON — 연간계획 입력 (마케팅/영업/원료) + 비교', layoutCategory: 'LAYOUT_V2', category: 'domain',
    usage: 8, description: '브랜드×Lvl3 12개월 크로스탭 입력 + 전년 대비 성장률/목표 비교',
    layers: [
      { key: 'entryGrid', title: '그리드', type: 'GRID', subtype: 'GRID_PIVOT', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./_oron/yp_entry/OronYpEntryMockup')) },
];

// ─────────────────────────────────────────
// CJBO — C:/vs_project/CJBO 의 CJBO 명시 화면 (demandplan/service · cjbo/* · widgets/* · masterplan/*)
// 270+ 운영 메뉴 중 CJBO-unique 화면들을 17개 mockup 패턴으로 그룹화. 표준 t3series 와
// 중복되는 화면 (마스터 CRUD/계획 컨트롤보드 등) 은 mockup 대상 외.
//
// 카테고리: DP Service 7 · Plan Workflow 3 (OP/TP/BP) · DP Operations 2 · Widget 2 · MP Extensions 2 · CM 1
// ─────────────────────────────────────────
const CJBO_ENTRIES = [
  // ── DP Service — CJBO 핵심 서비스 (7 mockups) ───────────────────────
  { patternCode: 'cjbo_cm_tariff_mgmt',     patternLabel: 'CJBO — 관세기준 관리 (CmTariffMgmt)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 1, description: '판매지역 × 품목 LV × HS코드 × 관세구분(국제/국가/FTA) 기간별 관세율',
    layers: [
      { key: 'mainGrid', title: '그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./_cjbo/cm_tariff_mgmt/CjboCmTariffMgmtMockup')) },
  { patternCode: 'cjbo_dp_sku_ratio',       patternLabel: 'CJBO — TP/OP SKU 비율 관리 (DpItemRatio*)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 4, description: '브랜드 × 품목 × 월별 판매비율(%) 입력 — TP/OP × 평균/월별 4종 통합',
    layers: [
      { key: 'mainGrid', title: '그리드', type: 'GRID', subtype: 'GRID_CROSSTAB', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./_cjbo/dp_sku_ratio/CjboDpSkuRatioMockup')) },
  { patternCode: 'cjbo_dp_pm_account',      patternLabel: 'CJBO — 품목-거래처 관계 PM (DpPmAccount)', layoutCategory: 'LAYOUT_V2', category: 'domain',
    usage: 1, description: '상단 품목 마스터 + 하단 매핑 거래처 (채널·비율·기간)',
    layers: [
      { key: 'masterGrid', title: '마스터 그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 6 } },
      { key: 'detailGrid', title: '디테일 그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 6, w: 12, h: 6 } },
    ],
    component: lazy(() => import('./_cjbo/dp_pm_account/CjboDpPmAccountMockup')) },
  { patternCode: 'cjbo_dp_org_management',  patternLabel: 'CJBO — 조직 매핑/변경/TP 조직 (DpOrgMap/Chg/TpOrg)', layoutCategory: 'LAYOUT_H2', category: 'domain',
    usage: 3, description: '좌측 조직 트리 (본부→팀→하위팀) + 우측 팀원·담당 영역·품목 매핑',
    layers: [
      { key: 'tree',   title: '마스터 그리드', type: 'GRID', subtype: 'GRID_TREE', position: { x: 0, y: 0, w: 4, h: 12 } },
      { key: 'detail', title: '디테일 그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 4, y: 0, w: 8, h: 12 } },
    ],
    component: lazy(() => import('./_cjbo/dp_org_management/CjboDpOrgManagementMockup')) },
  { patternCode: 'cjbo_dp_entry_report',    patternLabel: 'CJBO — OP/TP 계획 조회 통합 (DpEntryReport*)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 4, description: 'OP/TP 계획 4종 — 대분류/거래처/품목/담당자 × 월별 + 달성률',
    layers: [
      { key: 'mainGrid', title: '그리드', type: 'GRID', subtype: 'GRID_CROSSTAB', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./_cjbo/dp_entry_report/CjboDpEntryReportMockup')) },
  { patternCode: 'cjbo_dp_plan_accuracy',   patternLabel: 'CJBO — 수요계획 정확도/실적/RTF (DpPlanAccuracy/Report/RtfReport)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 3, description: 'KPI + 월별 정확도 추이 + 거래처-품목별 정확도/RTF/편차',
    layers: [
      { key: 'kpi1',  title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 0, y: 0, w: 3, h: 3 } },
      { key: 'kpi2',  title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 3, y: 0, w: 3, h: 3 } },
      { key: 'kpi3',  title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 6, y: 0, w: 3, h: 3 } },
      { key: 'kpi4',  title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 9, y: 0, w: 3, h: 3 } },
      { key: 'chart', title: '차트',   type: 'CHART', subtype: 'CHART_LINE', position: { x: 0, y: 3, w: 12, h: 4 } },
      { key: 'grid',  title: '그리드', type: 'GRID',  subtype: 'GRID_BASE',  position: { x: 0, y: 7, w: 12, h: 5 } },
    ],
    component: lazy(() => import('./_cjbo/dp_plan_accuracy/CjboDpPlanAccuracyMockup')) },
  { patternCode: 'cjbo_dp_ver_diff',        patternLabel: 'CJBO — DP 버전 비교 (DpVerDiff)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 1, description: 'V2026-04 / V2026-05 / V2026-06 다중 버전 × 월별 비교 + 증감률',
    layers: [
      { key: 'mainGrid', title: '그리드', type: 'GRID', subtype: 'GRID_CROSSTAB', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./_cjbo/dp_ver_diff/CjboDpVerDiffMockup')) },

  // ── DP Operations — 판매실적 / 창고변경 (2 mockups) ─────────────────
  { patternCode: 'cjbo_dp_sales_act',       patternLabel: 'CJBO — 판매 실적 (DpSalesAct)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 1, description: '채널 × 거래처 × 품목별 판매 실적 + 전년동기 (YoY) 비교 + 일별 추이',
    layers: [
      { key: 'kpi1',  title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 3, h: 3 } },
      { key: 'kpi2',  title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 3, y: 0, w: 3, h: 3 } },
      { key: 'kpi3',  title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 6, y: 0, w: 3, h: 3 } },
      { key: 'kpi4',  title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',  position: { x: 9, y: 0, w: 3, h: 3 } },
      { key: 'chart', title: '차트',   type: 'CHART', subtype: 'CHART_BAR', position: { x: 0, y: 3, w: 12, h: 4 } },
      { key: 'grid',  title: '그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 7, w: 12, h: 5 } },
    ],
    component: lazy(() => import('./_cjbo/dp_sales_act/CjboDpSalesActMockup')) },
  { patternCode: 'cjbo_dp_loc_change',      patternLabel: 'CJBO — 창고 변경 관리 (DpLocChange)', layoutCategory: 'LAYOUT_SINGLE', category: 'domain',
    usage: 1, description: '품목-거래처별 출고 창고 변경 (현재→신규) + 적용 기간 + 사유 + 승인 단계',
    layers: [
      { key: 'mainGrid', title: '그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 12 } },
    ],
    component: lazy(() => import('./_cjbo/dp_loc_change/CjboDpLocChangeMockup')) },

  // ── Plan Workflow — OP/TP/BP 계획 워크플로 (3 mockups) ──────────────
  { patternCode: 'cjbo_op_workflow',        patternLabel: 'CJBO — OP 계획 워크플로 (UI_DP_93/94/95)', layoutCategory: 'LAYOUT_CONTROLBOARD', category: 'controlboard',
    usage: 3, description: 'OP (Operation Plan) — 컨트롤보드 6단계 + 담당자 진행상태 + 입력 마감',
    layers: [
      { key: 'stepper',    title: '패널 1', type: 'CHART', subtype: 'STEPPER',  position: { x: 0, y: 0, w: 12, h: 3 } },
      { key: 'kpi1',       title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 3, w: 3,  h: 2 } },
      { key: 'kpi2',       title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD', position: { x: 3, y: 3, w: 3,  h: 2 } },
      { key: 'kpi3',       title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD', position: { x: 6, y: 3, w: 3,  h: 2 } },
      { key: 'kpi4',       title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD', position: { x: 9, y: 3, w: 3,  h: 2 } },
      { key: 'progress',   title: '패널 2', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 5, w: 8,  h: 7 } },
      { key: 'logPanel',   title: '로그',   type: 'GRID',  subtype: 'GRID_BASE', position: { x: 8, y: 5, w: 4,  h: 7 } },
    ],
    component: lazy(() => import('./_cjbo/op_workflow/CjboOpWorkflowMockup')) },
  { patternCode: 'cjbo_tp_workflow',        patternLabel: 'CJBO — TP 계획 워크플로 (UI_DT_93/94/95)', layoutCategory: 'LAYOUT_CONTROLBOARD', category: 'controlboard',
    usage: 3, description: 'TP (Target Plan) — 7단계 + KPI + 본부/팀별 검토 진척 + 월별 추이',
    layers: [
      { key: 'stepper',    title: '패널 1', type: 'CHART', subtype: 'STEPPER',  position: { x: 0, y: 0, w: 12, h: 3 } },
      { key: 'kpi1',       title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 3, w: 3,  h: 2 } },
      { key: 'kpi2',       title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD', position: { x: 3, y: 3, w: 3,  h: 2 } },
      { key: 'kpi3',       title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD', position: { x: 6, y: 3, w: 3,  h: 2 } },
      { key: 'kpi4',       title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD', position: { x: 9, y: 3, w: 3,  h: 2 } },
      { key: 'chart',      title: '차트',   type: 'CHART', subtype: 'CHART_LINE', position: { x: 0, y: 5, w: 12, h: 3 } },
      { key: 'progress',   title: '그리드', type: 'GRID',  subtype: 'GRID_BASE',  position: { x: 0, y: 8, w: 12, h: 4 } },
    ],
    component: lazy(() => import('./_cjbo/tp_workflow/CjboTpWorkflowMockup')) },
  { patternCode: 'cjbo_bp_workflow',        patternLabel: 'CJBO — 경영계획 BP 워크플로 (UI_BP_93/94/95)', layoutCategory: 'LAYOUT_CONTROLBOARD', category: 'controlboard',
    usage: 3, description: 'BP (Business Plan / 경영계획) — 6단계 + 본부별 매출/이익 계획 + 전년대비 성장률',
    layers: [
      { key: 'stepper',    title: '패널 1', type: 'CHART', subtype: 'STEPPER',  position: { x: 0, y: 0, w: 12, h: 3 } },
      { key: 'kpi1',       title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD', position: { x: 0, y: 3, w: 3,  h: 2 } },
      { key: 'kpi2',       title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD', position: { x: 3, y: 3, w: 3,  h: 2 } },
      { key: 'kpi3',       title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD', position: { x: 6, y: 3, w: 3,  h: 2 } },
      { key: 'kpi4',       title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD', position: { x: 9, y: 3, w: 3,  h: 2 } },
      { key: 'segments',   title: '그리드', type: 'GRID',  subtype: 'GRID_BASE', position: { x: 0, y: 5, w: 12, h: 7 } },
    ],
    component: lazy(() => import('./_cjbo/bp_workflow/CjboBpWorkflowMockup')) },

  // ── DP Plan Confirm (계획확인+점검+로그) (1 mockup) ─────────────────
  { patternCode: 'cjbo_dp_plan_confirm',    patternLabel: 'CJBO — 계획 확인/점검/로그 (EntryConf/Notify/Log)', layoutCategory: 'LAYOUT_V2', category: 'domain',
    usage: 4, description: '상단: 계획점검 알림 (오류/경고/정보) · 하단: 입력 변경 로그',
    layers: [
      { key: 'notifyGrid', title: '마스터 그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 6 } },
      { key: 'logGrid',    title: '디테일 그리드', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 6, w: 12, h: 6 } },
    ],
    component: lazy(() => import('./_cjbo/dp_plan_confirm/CjboDpPlanConfirmMockup')) },

  // ── Dashboard Widgets (2 mockups) ───────────────────────────────────
  { patternCode: 'cjbo_widget_top_sales_map', patternLabel: 'CJBO — Top 판매 거래처/품목 지도 위젯 (DpTopSales*)', layoutCategory: 'LAYOUT_H2', category: 'dashboard',
    usage: 3, description: 'Google Maps 위에 거점·거래처별 판매 실적 마커 + Top 8 거래처 랭킹',
    layers: [
      { key: 'map',     title: '위젯 1', type: 'CHART', subtype: 'DIAGRAM_FLO', position: { x: 0, y: 0, w: 8, h: 12 } },
      { key: 'topGrid', title: '그리드', type: 'GRID',  subtype: 'GRID_BASE',   position: { x: 8, y: 0, w: 4, h: 12 } },
    ],
    component: lazy(() => import('./_cjbo/widget_top_sales_map/CjboWidgetTopSalesMapMockup')) },
  { patternCode: 'cjbo_widget_dashboard_y',  patternLabel: 'CJBO — 연간 계획·실적 위젯 대시보드 (DpPlanStatusY 외 14종)', layoutCategory: 'LAYOUT_SINGLE', category: 'dashboard',
    usage: 14, description: '연간 계획 대비 실적 + 팀별 진척 + 알림 + 시계열 위젯 통합',
    layers: [
      { key: 'kpi1',     title: 'KPI 1',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 0,  y: 0, w: 3,  h: 3 } },
      { key: 'kpi2',     title: 'KPI 2',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 3,  y: 0, w: 3,  h: 3 } },
      { key: 'kpi3',     title: 'KPI 3',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 6,  y: 0, w: 3,  h: 3 } },
      { key: 'kpi4',     title: 'KPI 4',  type: 'CHART', subtype: 'KPI_CARD',   position: { x: 9,  y: 0, w: 3,  h: 3 } },
      { key: 'donut',    title: '위젯 1', type: 'CHART', subtype: 'CHART_DONUT', position: { x: 0,  y: 3, w: 4,  h: 4 } },
      { key: 'trend',    title: '위젯 2', type: 'CHART', subtype: 'CHART_LINE',  position: { x: 4,  y: 3, w: 4,  h: 4 } },
      { key: 'alerts',   title: '위젯 3', type: 'GRID',  subtype: 'GRID_BASE',   position: { x: 8,  y: 3, w: 4,  h: 4 } },
      { key: 'teamProgress', title: '위젯 4', type: 'CHART', subtype: 'CHART_BAR', position: { x: 0, y: 7, w: 12, h: 5 } },
    ],
    component: lazy(() => import('./_cjbo/widget_dashboard_y/CjboWidgetDashboardYMockup')) },

  // ── MP Extensions (2 mockups) ───────────────────────────────────────
  { patternCode: 'cjbo_mp_sku_management',  patternLabel: 'CJBO — MP SKU 우선순위/비율/Capa 관리 (MP_ST_01~04)', layoutCategory: 'LAYOUT_V2', category: 'domain',
    usage: 4, description: '상단: 품목-라인 우선순위·할당 비율 · 하단: 라인별 기간 Capa vs 사용량',
    layers: [
      { key: 'priorityGrid', title: '마스터 그리드', type: 'GRID', subtype: 'GRID_BASE',     position: { x: 0, y: 0, w: 12, h: 6 } },
      { key: 'capaGrid',     title: '디테일 그리드', type: 'GRID', subtype: 'GRID_CROSSTAB', position: { x: 0, y: 6, w: 12, h: 6 } },
    ],
    component: lazy(() => import('./_cjbo/mp_sku_management/CjboMpSkuManagementMockup')) },
  { patternCode: 'cjbo_mp_scm_demand',      patternLabel: 'CJBO — MP SCM Demand (재처리/거점이동/Stuffing) (MP_PN_01/03/04/05)', layoutCategory: 'LAYOUT_V3', category: 'domain',
    usage: 5, description: '재처리·M to M · 거점간 재고이동 · Stuffing 컨테이너 적재 계획 3종 통합',
    layers: [
      { key: 'reworkGrid',   title: '그리드 1', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 4 } },
      { key: 'moveGrid',     title: '그리드 2', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 4, w: 12, h: 4 } },
      { key: 'stuffingGrid', title: '그리드 3', type: 'GRID', subtype: 'GRID_BASE', position: { x: 0, y: 8, w: 12, h: 4 } },
    ],
    component: lazy(() => import('./_cjbo/mp_scm_demand/CjboMpScmDemandMockup')) },
];

// ─────────────────────────────────────────
// 최종 export — 각 entry 에 productLine + menus (운영 매핑) 자동 부여
// ─────────────────────────────────────────
const T3SMART_SCM_MOCKUP_TO_MENUS = menuMappingJson?.mockupToMenus || {};
const KTNG_MOCKUP_TO_MENUS        = ktngMenuMappingJson?.mockupToMenus || {};
const PLANEL_MOCKUP_TO_MENUS      = plannelMenuMappingJson?.mockupToMenus || {};
const ORON_MOCKUP_TO_MENUS        = oronMenuMappingJson?.mockupToMenus || {};
const CJBO_MOCKUP_TO_MENUS        = cjboMenuMappingJson?.mockupToMenus || {};
export const MOCKUP_ENTRIES = [
  ...T3SMART_SCM_ENTRIES.map((e) => ({
    productLine: 'T3SmartSCM',
    menus: T3SMART_SCM_MOCKUP_TO_MENUS[e.patternCode] || [],
    ...e,
  })),
  ...PLANEL_ENTRIES.map((e) => ({
    productLine: 'PlaNEL',
    menus: PLANEL_MOCKUP_TO_MENUS[e.patternCode] || [],
    ...e,
  })),
  ...KTNG_ENTRIES.map((e) => ({
    productLine: 'KTNG',
    menus: KTNG_MOCKUP_TO_MENUS[e.patternCode] || [],
    ...e,
  })),
  ...ORON_ENTRIES.map((e) => ({
    productLine: 'ORON',
    menus: ORON_MOCKUP_TO_MENUS[e.patternCode] || [],
    ...e,
  })),
  ...CJBO_ENTRIES.map((e) => ({
    productLine: 'CJBO',
    menus: CJBO_MOCKUP_TO_MENUS[e.patternCode] || [],
    ...e,
  })),
];

// 운영 메뉴ID → mockup patternCode 역방향 lookup
export const MENU_TO_MOCKUP = menuMappingJson?.menuToMockup || {};

export const PRODUCT_LINE_LABEL = {
  T3SmartSCM: 'T3SmartSCM',
  PlaNEL:     'PlanNEL',  // ★ 표시 라벨 — code key 는 'PlaNEL' 유지 (spec.productLine 호환)
  KTNG:       'KT&G',
  ORON:       'Orion',
  CJBO:       'CJ Bio',
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

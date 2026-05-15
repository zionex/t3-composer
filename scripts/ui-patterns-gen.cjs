#!/usr/bin/env node
/*
 * T3Series UI Patterns — Phase 2
 *
 * - Phase 1 산출물 (ui-inventory.json) 을 입력으로 받아
 * - 모듈별 markdown 카탈로그 + 전체 README (reverse index) 자동 생성
 *
 * 산출물: docs/reference/ui-patterns/README.md + <module>.md × N
 * 실행: node t3series-wingui/packages/wingui/scripts/ui-patterns-gen.cjs
 */

const fs = require('fs');
const path = require('path');

// 스크립트 위치별 입출력 경로 결정
//   - t3-composer/scripts/ → input: ../docs/ui-inventory/, output: ../docs/ui-patterns-auto/
//   - t3series/.../scripts/ → input: t3series/docs/reference/, output: 같은 디렉토리/ui-patterns/
const scriptParent = path.basename(path.resolve(__dirname, '..'));
const IS_COMPOSER  = scriptParent === 't3-composer';

const IN_JSON  = IS_COMPOSER
  ? path.join(__dirname, '..', 'docs', 'ui-inventory', 'ui-inventory.json')
  : path.join(__dirname, '..', '..', '..', '..', 'docs', 'reference', 'ui-inventory.json');
const OUT_DIR  = IS_COMPOSER
  ? path.join(__dirname, '..', 'docs', 'ui-patterns-auto')
  : path.join(__dirname, '..', '..', '..', '..', 'docs', 'reference', 'ui-patterns');

// ─────────────────────────────────────────────
// 1. 패턴별 ASCII 미니 미리보기
// ─────────────────────────────────────────────
const ASCII = {
  P02_search_grid: [
    '┌──────────────────────────────┐',
    '│ Search: id / nm / useYn      │',
    '├──────────────────────────────┤',
    '│ + Add  Delete  Save  Excel   │',
    '│ ┌──────────────────────────┐ │',
    '│ │ BaseGrid (N cols × N rows)│ │',
    '│ └──────────────────────────┘ │',
    '└──────────────────────────────┘',
  ],
  P02b_grid_only: [
    '┌──────────────────────────────┐',
    '│ ButtonArea                   │',
    '├──────────────────────────────┤',
    '│ ┌──────────────────────────┐ │',
    '│ │ BaseGrid                  │ │',
    '│ └──────────────────────────┘ │',
    '└──────────────────────────────┘',
  ],
  P01_widget_dashboard: [
    '┌──────────────────────────────┐',
    '│ ┌──────┐┌──────┐┌──────┐    │',
    '│ │ KPI 1││ KPI 2││ KPI 3│    │',
    '│ └──────┘└──────┘└──────┘    │',
    '│ ┌────────────┐┌────────────┐ │',
    '│ │ Chart       ││ Grid       │ │',
    '│ └────────────┘└────────────┘ │',
    '└──────────────────────────────┘',
  ],
  P03_search_tabs: [
    '┌──────────────────────────────┐',
    '│ Search                       │',
    '├──────────────────────────────┤',
    '│ [ Tab1 ][ Tab2 ][ Tab3 ]     │',
    '│ ┌──────────────────────────┐ │',
    '│ │ BaseGrid / Chart          │ │',
    '│ └──────────────────────────┘ │',
    '└──────────────────────────────┘',
  ],
  P04_tree_grid: [
    '┌──────────────────────────────┐',
    '│ Search                       │',
    '├──────────────────────────────┤',
    '│ ▼ Root                       │',
    '│   ▼ Branch A                 │',
    '│     • Leaf 1                 │',
    '│     • Leaf 2                 │',
    '│   ▶ Branch B                 │',
    '└──────────────────────────────┘',
  ],
  P06_cross_pivot: [
    '┌──────────────────────────────┐',
    '│ Search: 기간 / Item / Sales  │',
    '├──────────────────────────────┤',
    '│        2026-01 | 2026-02 | …│',
    '│ Item A   100  |   120   | … │',
    '│ Item B   200  |   180   | … │',
    '└──────────────────────────────┘',
  ],
  P09_chart_view: [
    '┌──────────────────────────────┐',
    '│ Search                       │',
    '├──────────────────────────────┤',
    '│   ▁ ▃ ▅ ▇ █ ▇ ▅ ▃            │',
    '│   ●─●─●─●─●─●                │',
    '│   (ChartComponent)           │',
    '└──────────────────────────────┘',
  ],
  v2_chart_grid: [
    '┌──────────────────────────────┐',
    '│ Search                       │',
    '├──────────────────────────────┤',
    '│ ┌──────────────────────────┐ │',
    '│ │ Chart                     │ │',
    '│ ├──────────────────────────┤ │',
    '│ │ BaseGrid                  │ │',
    '│ └──────────────────────────┘ │',
    '└──────────────────────────────┘',
  ],
  v2_dual_grid: [
    '┌──────────────────────────────┐',
    '│ Search                       │',
    '├──────────────────────────────┤',
    '│ ┌──────────────────────────┐ │',
    '│ │ BaseGrid 1                │ │',
    '│ ├──────────────────────────┤ │',
    '│ │ BaseGrid 2                │ │',
    '│ └──────────────────────────┘ │',
    '└──────────────────────────────┘',
  ],
  v2_master_detail: [
    '┌──────────────────────────────┐',
    '│ Search                       │',
    '├──────────────────────────────┤',
    '│ ┌─ Master ─────────────────┐ │',
    '│ │ Master grid               │ │',
    '│ ├─ Detail ─────────────────┤ │',
    '│ │ Detail grid (filtered)    │ │',
    '│ └──────────────────────────┘ │',
    '└──────────────────────────────┘',
  ],
  v3_multi_grid: [
    '┌──────────────────────────────┐',
    '│ Search                       │',
    '├──────────────────────────────┤',
    '│ ┌── Grid 1 ───────────────┐  │',
    '│ ├── Grid 2 ───────────────┤  │',
    '│ ├── Grid 3 ───────────────┤  │',
    '│ └──────────────────────────┘ │',
    '└──────────────────────────────┘',
  ],
  v4_multi_grid: [
    '┌──────────────────────────────┐',
    '│ ┌──┐┌──┐┌──┐┌──┐             │',
    '│ │  ││  ││  ││  │ 4 stacked   │',
    '│ │  ││  ││  ││  │ grids       │',
    '│ └──┘└──┘└──┘└──┘             │',
    '└──────────────────────────────┘',
  ],
  h2_master_detail: [
    '┌──────────────────────────────┐',
    '│ Search                       │',
    '├──────────────┬───────────────┤',
    '│ Master Grid  │ Detail Grid   │',
    '│              │               │',
    '│              │               │',
    '└──────────────┴───────────────┘',
  ],
  mix_split: [
    '┌──────────────────────────────┐',
    '│ Search                       │',
    '├──────────┬───────────────────┤',
    '│ Tree     │ Top: Chart        │',
    '│          ├───────────────────┤',
    '│          │ Bottom: Grid      │',
    '└──────────┴───────────────────┘',
  ],
  cb_master: [
    '┌──────────────────────────────┐',
    '│ Version status · Step bar    │',
    '├──────┬───────────┬───────────┤',
    '│ KPI  │ Chart     │ Log/Alert │',
    '├──────┴───────────┴───────────┤',
    '│ Engine execution grid        │',
    '└──────────────────────────────┘',
  ],
  cb_gantt_master: [
    '┌──────────────────────────────┐',
    '│ ControlBoard · Version       │',
    '├──────────────────────────────┤',
    '│ ▓▓▓░░░░░░░░░░░░░░░░░░░░      │',
    '│ ░░░▓▓▓▓▓░░░░░░░░░░░░░░░      │',
    '│ ░░░░░░░▓▓▓▓▓░░░░░░░░░░░      │',
    '│ (Gantt timeline)             │',
    '└──────────────────────────────┘',
  ],
  cb_chart_master: [
    '┌──────────────────────────────┐',
    '│ ControlBoard                 │',
    '├───────────────┬──────────────┤',
    '│ Steps         │ KPI Cards    │',
    '├───────────────┴──────────────┤',
    '│ Chart (Forecast / Trend)     │',
    '└──────────────────────────────┘',
  ],
  pe_pivot_grid_edit: [
    '┌──────────────────────────────┐',
    '│ Search · Period · Edit toggle│',
    '├──────────────────────────────┤',
    '│ Date columns →               │',
    '│ Item A  100  120  130   ...  │',
    '│ Item B  200  220  180   ...  │',
    '│ (Editable pivot)             │',
    '└──────────────────────────────┘',
  ],
  pe_grid_edit: [
    '┌──────────────────────────────┐',
    '│ Search                       │',
    '├──────────────────────────────┤',
    '│ ✏ Editable grid              │',
    '│ Save / Reset                 │',
    '└──────────────────────────────┘',
  ],
  pe_gantt_edit: [
    '┌──────────────────────────────┐',
    '│ PlanEdit · Drag & Drop       │',
    '├──────────────────────────────┤',
    '│ ▓▓▓→ drag ▓▓▓░░░░░           │',
    '│ ░░▓▓▓░░▓▓▓░░░░░░             │',
    '│ (Editable Gantt)             │',
    '└──────────────────────────────┘',
  ],
  mn_kpi_dashboard: [
    '┌──────────────────────────────┐',
    '│ ┌───┐┌───┐┌───┐┌───┐         │',
    '│ │KPI││KPI││KPI││KPI│         │',
    '│ └───┘└───┘└───┘└───┘         │',
    '│ ─── Live chart ─────         │',
    '│ Alerts: ⚠ Shortage 3         │',
    '└──────────────────────────────┘',
  ],
  mn_grid_alert: [
    '┌──────────────────────────────┐',
    '│ Monitoring filters           │',
    '├──────────────────────────────┤',
    '│ ⚠ Alert grid (status colors) │',
    '│ ● Critical 5                 │',
    '│ ◆ Warning  12                │',
    '└──────────────────────────────┘',
  ],
  mn_simple: [
    '┌──────────────────────────────┐',
    '│ Monitoring                   │',
    '├──────────────────────────────┤',
    '│ Simple status display        │',
    '└──────────────────────────────┘',
  ],
  rl_layout: [
    '┌──────────────────────────────┐',
    '│ Route Layout (FLODiagram)    │',
    '├──────────────────────────────┤',
    '│ [A]──▶[B]──▶[C]              │',
    '│         │     ▼              │',
    '│         └──▶[D]──▶[E]        │',
    '└──────────────────────────────┘',
  ],
  gantt_view: [
    '┌──────────────────────────────┐',
    '│ Gantt View                   │',
    '├──────────────────────────────┤',
    '│ ▓▓▓░░░░░░░░░░░░░░░░░         │',
    '│ ░░▓▓▓▓▓░░░░░░░░░░░░          │',
    '│ ░░░░░░▓▓▓▓░░░░░░░░░          │',
    '└──────────────────────────────┘',
  ],
  popup: [
    '╔══════════════════════════════╗',
    '║  Popup Dialog (modal)        ║',
    '╠══════════════════════════════╣',
    '║ Search: code / name          ║',
    '║ ┌──────────────────────────┐ ║',
    '║ │ Selectable BaseGrid       │ ║',
    '║ └──────────────────────────┘ ║',
    '║  [ Confirm ] [ Cancel ]       ║',
    '╚══════════════════════════════╝',
  ],
  widget_chart: [
    '┌────────────────────┐',
    '│ Widget Chart       │',
    '│  ▁▃▅▇█▇▅▃          │',
    '└────────────────────┘',
  ],
  widget_grid: [
    '┌────────────────────┐',
    '│ Widget Grid        │',
    '│ ╶─┬─┬─┬─╴           │',
    '└────────────────────┘',
  ],
  widget_pivot: [
    '┌────────────────────┐',
    '│ Widget Pivot       │',
    '│  A 100  B 200      │',
    '└────────────────────┘',
  ],
  widget_panel: [
    '┌────────────────────┐',
    '│ Widget Panel       │',
    '└────────────────────┘',
  ],
  widget_misc: [
    '┌────────────────────┐',
    '│ Widget (misc)      │',
    '└────────────────────┘',
  ],
  subcomponent: [
    '┌─────────────┐',
    '│ Sub Comp.   │',
    '└─────────────┘',
  ],
  base_wrapper: [
    '┌─────────────┐',
    '│ Base*.jsx   │',
    '│ (wrapper)   │',
    '└─────────────┘',
  ],
  free_form: [
    '┌──────────────────────────────┐',
    '│ (Free form / non-standard)   │',
    '└──────────────────────────────┘',
  ],
  unknown: ['(unknown)'],
};

// 정규화 후 코드 → 기존 ASCII art 키 매핑
const ASCII_ALIAS = {
  widget_dashboard:     'P01_widget_dashboard',
  search_grid:          'P02_search_grid',
  search_tab:           'P03_search_tabs',
  pivot_table:          'P06_cross_pivot',
  grid_chart_stacked:   'v2_chart_grid',
  split_master_detail:  'v2_master_detail',
  h2_tree_grid:         'P04_tree_grid',
  cb_master_dashboard:  'cb_master',
  rl_layout_design:     'rl_layout',
};
function asciiFor(patternCode) {
  const aliased = ASCII_ALIAS[patternCode] || patternCode;
  return ASCII[aliased] || ASCII.free_form;
}

// ─────────────────────────────────────────────
// 2. 패턴 코드 → 인간 친화 라벨
// ─────────────────────────────────────────────
const PATTERN_LABEL = {
  // DB 시드 정규화된 코드 (분류기가 정규화 후 출력)
  widget_dashboard:     'P01 위젯 대시보드',
  search_grid:          'P02 검색 + 그리드 (마스터 CRUD)',
  search_tab:           'P03 검색 + 탭 그리드',
  pivot_table:          'P06 크로스탭 피벗',
  grid_chart_stacked:   'v2 차트 + 그리드 (수직 스택)',
  split_master_detail:  'v2 마스터-디테일 (분할)',
  h2_tree_grid:         'P04 트리 그리드',
  h2_master_detail:     'h2 마스터-디테일 (수평)',
  cb_master_dashboard:  'CB 마스터 컨트롤보드',
  pe_pivot_grid_edit:   'PE 피벗 편집',
  mn_kpi_dashboard:     'MN KPI 모니터링',
  rl_layout_design:     'RL 라우트 레이아웃 (FLO)',
  // 분류기 신규 코드 (DB·Preview 양쪽에 아직 없음 — Phase 3 권장 추가 후보)
  P02b_grid_only:       'P02b 그리드 전용 (검색 없음)',
  P09_chart_view:       'P09 차트 단독',
  v2_dual_grid:         'v2 듀얼 그리드 2-stack',
  v3_multi_grid:        'v3 멀티 그리드 3-stack',
  v4_multi_grid:        'v4 멀티 그리드 4-stack',
  mix_split:            '혼합 분할',
  cb_gantt_master:      'CB 간트형 컨트롤보드',
  cb_chart_master:      'CB 차트형 컨트롤보드',
  pe_grid_edit:         'PE 그리드 편집',
  pe_gantt_edit:        'PE 간트 편집',
  mn_grid_alert:        'MN 그리드 알람',
  mn_simple:            'MN 간단 표시',
  gantt_view:           '간트 단독',
  // 메타 카테고리 (DB 시드 대상 아님)
  popup:                '팝업 다이얼로그',
  widget_chart:         '위젯 (차트)',
  widget_grid:          '위젯 (그리드)',
  widget_pivot:         '위젯 (피벗)',
  widget_panel:         '위젯 (대시보드 패널)',
  widget_misc:          '위젯 (자유)',
  subcomponent:         '서브 컴포넌트',
  base_wrapper:         'Base 래퍼',
  free_form:            '비표준 / 자유 폼',
  unknown:              '미분류',
};

const LAYOUT_LABEL = {
  LAYOUT_SINGLE:        '01 미분할 (단일)',
  LAYOUT_V2:            '11 상하 2분할',
  LAYOUT_V3:            '12 상하 3분할',
  LAYOUT_V4:            '13 상하 4분할',
  LAYOUT_V5:            '14 상하 5+분할',
  LAYOUT_H2:            '21 좌우 2분할',
  LAYOUT_H3:            '22 좌우 3분할',
  LAYOUT_H4:            '23 좌우 4분할',
  LAYOUT_H5:            '24 좌우 5+분할',
  LAYOUT_MIXED:         '31 혼합·격자·특수',
  LAYOUT_CONTROLBOARD:  '91 ControlBoard',
  LAYOUT_PLANEDIT:      '92 PlanEdit',
  LAYOUT_MONITORING:    '93 Monitoring',
  LAYOUT_ROUTELAYOUT:   '95 RouteLayout',
  POPUP:                '— 팝업',
  WIDGET:               '— 위젯',
  SUBCOMPONENT:         '— 서브컴포넌트',
  BASE:                 '— Base 래퍼',
  UNKNOWN:              '— 미분류',
};

const LAYOUT_ORDER = [
  'LAYOUT_SINGLE','LAYOUT_V2','LAYOUT_V3','LAYOUT_V4','LAYOUT_V5',
  'LAYOUT_H2','LAYOUT_H3','LAYOUT_H4','LAYOUT_H5','LAYOUT_MIXED',
  'LAYOUT_CONTROLBOARD','LAYOUT_PLANEDIT','LAYOUT_MONITORING','LAYOUT_ROUTELAYOUT',
  'POPUP','WIDGET','SUBCOMPONENT','BASE','UNKNOWN',
];

// ─────────────────────────────────────────────
// 3. 화면 entry markdown 포맷
// ─────────────────────────────────────────────
function formatScreenEntry(r) {
  const lines = [];
  const title = r.menuCd ? `${r.screenName} (\`${r.menuCd}\`)` : `${r.screenName}`;
  lines.push(`#### ${title}`);
  lines.push('');
  lines.push(`- 경로: \`${r.relativePath}\``);
  const patternLabel = PATTERN_LABEL[r.patternCode] || r.patternCode;
  lines.push(`- 패턴: **${patternLabel}** (${r.layoutCategory}) · confidence: **${r.confidence}**`);
  if (r.reason) lines.push(`- 추정 근거: ${r.reason}`);
  if (r.components) {
    const compList = r.components.split(';').slice(0, 8).join(', ');
    lines.push(`- 컴포넌트: ${compList}${r.components.split(';').length > 8 ? ', …' : ''}`);
  }
  if (r.spNames) {
    const spList = r.spNames.split(';').filter(Boolean).slice(0, 5);
    if (spList.length) lines.push(`- SP: \`${spList.join('\` · \`')}\``);
  }
  if (r.apiCalls) {
    const apiList = r.apiCalls.split(';').filter(Boolean).slice(0, 3);
    if (apiList.length) lines.push(`- 호출: \`${apiList.join('\` · \`')}\``);
  }
  // ASCII
  const art = asciiFor(r.patternCode);
  lines.push('');
  lines.push('```');
  lines.push(...art);
  lines.push('```');
  lines.push('');
  return lines.join('\n');
}

// ─────────────────────────────────────────────
// 4. 모듈별 markdown
// ─────────────────────────────────────────────
function generateModuleMd(moduleCode, rows) {
  const lines = [];
  lines.push(`# ${moduleCode} 모듈 — UI 패턴 카탈로그`);
  lines.push('');
  lines.push(`> Phase 1 자동 분류 결과 (생성: \`ui-patterns-gen.cjs\`). 정정·보강 환영.`);
  lines.push('');

  // 요약 (isWidget/isPopup/isBase/isSubComponent 는 'Y'/'N' 문자열로 저장됨)
  const total = rows.length;
  const matched = rows.filter((r) => r.menuCd).length;
  const widgetN = rows.filter((r) => r.isWidget === 'Y').length;
  const popupN  = rows.filter((r) => r.isPopup === 'Y').length;
  const baseN   = rows.filter((r) => r.isBase === 'Y').length;
  const subN    = rows.filter((r) => r.isSubComponent === 'Y').length;
  lines.push(`## 요약`);
  lines.push('');
  lines.push(`| 항목 | 값 |`);
  lines.push(`|---|---:|`);
  lines.push(`| 총 화면 | ${total} |`);
  lines.push(`| 등록 메뉴 (UI_*) | ${matched} |`);
  lines.push(`| 위젯 | ${widgetN} |`);
  lines.push(`| 팝업 | ${popupN} |`);
  lines.push(`| Base 래퍼 | ${baseN} |`);
  lines.push(`| Sub-component | ${subN} |`);
  lines.push('');

  // 레이아웃 카테고리별 분포
  const byLayout = {};
  for (const r of rows) byLayout[r.layoutCategory] = (byLayout[r.layoutCategory] || 0) + 1;
  lines.push(`### 레이아웃 카테고리 분포`);
  lines.push('');
  lines.push(`| 카테고리 | 화면 수 |`);
  lines.push(`|---|---:|`);
  for (const layout of LAYOUT_ORDER) {
    if (!byLayout[layout]) continue;
    lines.push(`| ${LAYOUT_LABEL[layout] || layout} | ${byLayout[layout]} |`);
  }
  lines.push('');

  // 패턴 분포
  const byPattern = {};
  for (const r of rows) byPattern[r.patternCode] = (byPattern[r.patternCode] || 0) + 1;
  lines.push(`### 패턴 분포 (상위 10)`);
  lines.push('');
  lines.push(`| 패턴 | 화면 수 |`);
  lines.push(`|---|---:|`);
  for (const [p, n] of Object.entries(byPattern).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    lines.push(`| ${PATTERN_LABEL[p] || p} (\`${p}\`) | ${n} |`);
  }
  lines.push('');

  // 화면 상세 (레이아웃 카테고리별 그룹 → 화면명 정렬)
  lines.push(`---`);
  lines.push(`## 화면별 상세`);
  lines.push('');
  for (const layout of LAYOUT_ORDER) {
    const layoutRows = rows
      .filter((r) => r.layoutCategory === layout)
      .sort((a, b) => a.screenName.localeCompare(b.screenName));
    if (layoutRows.length === 0) continue;
    lines.push(`### ${LAYOUT_LABEL[layout] || layout} (${layoutRows.length}개)`);
    lines.push('');
    for (const r of layoutRows) {
      lines.push(formatScreenEntry(r));
    }
  }
  return lines.join('\n');
}

// ─────────────────────────────────────────────
// 5. README — 전체 통계 + 모듈 인덱스 + 패턴 reverse index
// ─────────────────────────────────────────────
function generateReadme(allRows) {
  const lines = [];
  lines.push(`# T3Series UI 패턴 카탈로그`);
  lines.push('');
  lines.push(`> Phase 2 산출물 — \`ui-patterns-gen.cjs\` 로 자동 생성. 입력: \`docs/reference/ui-inventory.json\`.`);
  lines.push(`> 모든 화면을 모듈별로 분류한 카탈로그입니다. 패턴 코드 / ASCII 미리보기 / 컴포넌트 stack / SP 매핑을 한자리에.`);
  lines.push('');

  // 전체 통계
  const total = allRows.length;
  const byModule = {};
  const byLayout = {};
  const byConf = { high: 0, mid: 0, low: 0 };
  const byPattern = {};
  let menuMatched = 0;
  for (const r of allRows) {
    byModule[r.moduleCode] = (byModule[r.moduleCode] || 0) + 1;
    byLayout[r.layoutCategory] = (byLayout[r.layoutCategory] || 0) + 1;
    byConf[r.confidence] = (byConf[r.confidence] || 0) + 1;
    byPattern[r.patternCode] = (byPattern[r.patternCode] || 0) + 1;
    if (r.menuCd) menuMatched++;
  }

  lines.push(`## 전체 통계`);
  lines.push('');
  lines.push(`- 총 화면: **${total}**`);
  lines.push(`- 등록 메뉴 (UI_*): **${menuMatched}** (${(menuMatched / total * 100).toFixed(1)}%)`);
  lines.push(`- 분류 confidence — high **${byConf.high}** (${(byConf.high / total * 100).toFixed(1)}%) · mid **${byConf.mid}** (${(byConf.mid / total * 100).toFixed(1)}%) · low **${byConf.low}** (${(byConf.low / total * 100).toFixed(1)}%)`);
  lines.push('');

  // 모듈 인덱스
  lines.push(`## 모듈 인덱스`);
  lines.push('');
  lines.push(`| 모듈 | 화면 수 | 링크 |`);
  lines.push(`|---|---:|---|`);
  for (const [m, n] of Object.entries(byModule).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${m} | ${n} | [${m}.md](./${m}.md) |`);
  }
  lines.push('');

  // 레이아웃 카테고리 분포
  lines.push(`## 레이아웃 카테고리 분포`);
  lines.push('');
  lines.push(`| 카테고리 | 화면 수 |`);
  lines.push(`|---|---:|`);
  for (const layout of LAYOUT_ORDER) {
    if (!byLayout[layout]) continue;
    lines.push(`| ${LAYOUT_LABEL[layout] || layout} | ${byLayout[layout]} |`);
  }
  lines.push('');

  // 패턴 reverse index
  lines.push(`## 패턴 → 화면 Reverse Index`);
  lines.push('');
  lines.push(`각 패턴이 어떤 화면들에서 사용되는지. 화면명 클릭 시 해당 모듈 markdown 의 섹션으로 이동(앵커는 생성 안 함, 모듈 파일에서 검색).`);
  lines.push('');
  const patternsSorted = Object.entries(byPattern).sort((a, b) => b[1] - a[1]);
  for (const [p, n] of patternsSorted) {
    lines.push(`### ${PATTERN_LABEL[p] || p} — \`${p}\` (${n}개)`);
    lines.push('');
    // ASCII
    const art = asciiFor(p);
    lines.push('```');
    lines.push(...art);
    lines.push('```');
    lines.push('');
    // 화면 목록 (모듈별 그룹)
    const screensOfPat = allRows.filter((r) => r.patternCode === p);
    const byModForPat = {};
    for (const r of screensOfPat) {
      if (!byModForPat[r.moduleCode]) byModForPat[r.moduleCode] = [];
      byModForPat[r.moduleCode].push(r.screenName);
    }
    for (const [m, names] of Object.entries(byModForPat).sort((a, b) => b[1].length - a[1].length)) {
      const sorted = names.sort();
      // 너무 길면 상위 10개만 + …
      const display = sorted.length > 12 ? sorted.slice(0, 12).join(', ') + `, … (총 ${sorted.length}개)` : sorted.join(', ');
      lines.push(`- **${m}** (${sorted.length}): ${display}`);
    }
    lines.push('');
  }

  // 생성 정보
  lines.push(`---`);
  lines.push('');
  lines.push(`*자동 생성: \`t3series-wingui/packages/wingui/scripts/ui-patterns-gen.cjs\`*`);
  lines.push(`*Phase 1 입력: \`docs/reference/ui-inventory.json\`*`);
  return lines.join('\n');
}

// ─────────────────────────────────────────────
// 6. 메인
// ─────────────────────────────────────────────
function main() {
  console.log('[ui-patterns-gen] start');
  if (!fs.existsSync(IN_JSON)) {
    console.error('ERROR: ui-inventory.json not found at', IN_JSON);
    console.error('       Run scripts/ui-inventory.cjs first (Phase 1)');
    process.exit(1);
  }
  const rows = JSON.parse(fs.readFileSync(IN_JSON, 'utf8'));
  console.log(`[ui-patterns-gen] loaded ${rows.length} screens`);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // 모듈별 그룹
  const byModule = {};
  for (const r of rows) {
    if (!byModule[r.moduleCode]) byModule[r.moduleCode] = [];
    byModule[r.moduleCode].push(r);
  }

  // 모듈별 markdown 출력
  const moduleSorted = Object.keys(byModule).sort();
  for (const m of moduleSorted) {
    const md = generateModuleMd(m, byModule[m]);
    const outFile = path.join(OUT_DIR, `${m}.md`);
    fs.writeFileSync(outFile, md, 'utf8');
    console.log(`  ${m}.md — ${byModule[m].length} screens (${md.length} bytes)`);
  }

  // README
  const readme = generateReadme(rows);
  const readmeFile = path.join(OUT_DIR, 'README.md');
  fs.writeFileSync(readmeFile, readme, 'utf8');
  console.log(`  README.md — ${readme.length} bytes`);

  console.log(`\n[ui-patterns-gen] 완료`);
  console.log(`  출력 디렉토리: ${OUT_DIR}`);
  console.log(`  파일 수: ${moduleSorted.length + 1}`);
}

main();

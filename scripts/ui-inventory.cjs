#!/usr/bin/env node
/*
 * T3Series UI Inventory — Phase 1
 *
 * - view/ 디렉토리의 모든 .jsx 화면을 정적 분석하여 UI 패턴 분류
 * - menus.js 와 매칭하여 등록된 menuCd 부착
 * - 결과: docs/reference/ui-inventory.json + .csv
 *
 * 실행: node t3series-wingui/packages/wingui/scripts/ui-inventory.cjs
 *       (의존성 없음 — fs / path / 정규식만 사용)
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────
// 경로 설정 (스크립트 기준 상대)
// ─────────────────────────────────────────────
// t3series 입력 루트 결정:
//   1) env T3SERIES_ROOT 사용 (절대경로)
//   2) 형제 폴더 탐색 (../t3series, ../../t3series)
//   3) 부모 디렉토리 추정 (t3series 안에서 실행한 경우 — 원본 위치)
function resolveSeriesRoot() {
  if (process.env.T3SERIES_ROOT) {
    const r = path.resolve(process.env.T3SERIES_ROOT);
    if (fs.existsSync(path.join(r, 't3series-wingui'))) return r;
    console.warn(`[ui-inventory] T3SERIES_ROOT (${r}) 에 t3series-wingui 폴더가 없습니다.`);
  }
  const candidates = [
    path.resolve(__dirname, '..', '..', 't3series'),       // t3-composer/scripts → ../t3series
    path.resolve(__dirname, '..', 't3series'),              // scripts → t3series (root level)
    path.resolve(__dirname, '..', '..', '..', '..'),        // t3series/t3series-wingui/packages/wingui/scripts → t3series (원본)
    path.resolve(__dirname, '..'),                           // t3-composer → ../t3-composer 같은 폴더 안
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 't3series-wingui'))) return c;
  }
  throw new Error('t3series 루트를 찾을 수 없습니다. 환경변수 T3SERIES_ROOT 를 설정하거나 t3series 와 같은 형제 폴더에 두세요.');
}

// 출력 루트 결정:
//   - 스크립트가 t3-composer/scripts/ 안에 있으면 → t3-composer/docs/
//   - 그 외 (t3series 원본 위치) → t3series/docs/reference/
function resolveOutDir(subdir) {
  const scriptParent = path.basename(path.resolve(__dirname, '..'));
  if (scriptParent === 't3-composer') {
    return path.join(__dirname, '..', 'docs', subdir);
  }
  // 원본 위치
  return path.join(resolveSeriesRoot(), 'docs', 'reference');
}

const REPO_ROOT  = resolveSeriesRoot();
const VIEW_ROOT  = path.join(REPO_ROOT, 't3series-wingui', 'packages', 'wingui', 'src', 'view');
const MENUS_FILE = path.join(REPO_ROOT, 't3series-wingui', 'packages', 'wingui', 'src', 'data', 'menus.js');
const OUT_DIR    = resolveOutDir('ui-inventory');
const OUT_JSON   = path.join(OUT_DIR, 'ui-inventory.json');
const OUT_CSV    = path.join(OUT_DIR, 'ui-inventory.csv');

// ─────────────────────────────────────────────
// 무시 경로 (테스트/샘플)
// ─────────────────────────────────────────────
const IGNORE_PATH_FRAGMENTS = ['/sample/', '\\sample\\', '/sample-', '\\sample-', '/__tests__/'];

// ─────────────────────────────────────────────
// 검출 대상 컴포넌트 (JSX 사용 카운트)
// ─────────────────────────────────────────────
const TRACK_COMPONENTS = [
  'ContentInner', 'SearchArea', 'SearchRow', 'WorkArea',
  'BaseGrid', 'TreeGrid', 'PivotTable',
  'SplitPanel', 'TabContainer', 'VLayoutBox', 'HLayoutBox',
  'DashboardPanel', 'ChartComponent', 'FLODiagram', 'GanttChart',
  'WidgetFlowDiagram', 'ZEditor', 'MyGoogleMap',
  'EqualizerBarChart',
  'GridCnt', 'GridAddRowButton', 'GridDeleteRowButton', 'GridSaveButton',
  'GridExcelExportButton', 'GridExcelImportButton',
  'InputField', 'CommonCodeSelect',
  'PlanScope', 'PopSelectItem', 'PopItemMulti', 'PopSelectAccount', 'PopAccountMulti',
  'PopLocatMst', 'PopLocatTp', 'PopLocatTpMulti', 'PopResourceMulti', 'PopRouteMulti',
  'PopDepartment', 'PopPosition', 'PopupDialog',
  'PopPersonalize', 'PopPersonalizeDp', 'PopKpiWeightConfig',
];

// ─────────────────────────────────────────────
// 1. 디렉토리 walk
// ─────────────────────────────────────────────
function walk(dir, acc = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return acc;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    const norm = full.replace(/\\/g, '/');
    if (IGNORE_PATH_FRAGMENTS.some((f) => norm.includes(f.replace(/\\/g, '/')))) continue;
    if (ent.isDirectory()) {
      walk(full, acc);
    } else if (ent.isFile() && ent.name.endsWith('.jsx')) {
      acc.push(full);
    }
  }
  return acc;
}

// ─────────────────────────────────────────────
// 2. 파일 경로 → moduleCode / category / screenName / relativeFilePath
//    relativeFilePath: menus.js 의 `filePath` 형식과 일치 — `/<module>[/<category>]/<PascalName>` (확장자 없음)
//    contentStore.js 의 라우팅 변환식과 호환:
//      filepath = filePath.toLowerCase() + filePath.slice(filePath.lastIndexOf('/'))
//      예: '/system/Multilingual' → 'view/system/multilingual/Multilingual.jsx'
//          '/snop/dashboard/ExecutiveDashboard' → 'view/snop/dashboard/executivedashboard/ExecutiveDashboard.jsx'
// ─────────────────────────────────────────────
function parseFileMeta(absFile) {
  const rel = path.relative(VIEW_ROOT, absFile).replace(/\\/g, '/');
  const segs = rel.split('/');
  const fileName = segs[segs.length - 1];
  const screenName = fileName.replace(/\.jsx$/i, '');
  const lowerScreen = screenName.toLowerCase();
  const lowerPath = rel.toLowerCase();

  // 모듈 코드 — root 레벨 .jsx (예: view/home.jsx) 는 화면명 자체가 모듈
  let moduleCode;
  if (segs.length === 1) {
    moduleCode = lowerScreen;
  } else {
    moduleCode = segs[0] || '';
  }

  // 마지막 직전 세그먼트가 PascalScreen 의 lowercase 와 같으면 그것은 자동 추가 폴더 → 제거
  let menuPathSegs = segs.slice(0, -1);
  if (menuPathSegs.length > 0 && menuPathSegs[menuPathSegs.length - 1] === lowerScreen) {
    menuPathSegs = menuPathSegs.slice(0, -1);
  }
  menuPathSegs.push(screenName);
  const relativeFilePath = '/' + menuPathSegs.join('/');

  // category = segs[1] (모듈 안쪽 첫 폴더, 단 마지막 직전이면 카테고리 아님)
  let category = '';
  if (segs.length >= 3) {
    category = segs[1];
    if (segs.length === 3 && segs[1] === lowerScreen) category = '';
  }

  const isWidget = segs.includes('widgets');
  const isPopup = /^Pop[A-Z]/.test(screenName);
  const isBase  = /^Base[A-Z]/.test(screenName) && screenName !== 'BaseGrid';

  // 메인 화면의 sub-component (예: abcanalysis/component/AbcXyzBox.jsx)
  // 라우팅 진입점이 아닌 내부 부품
  const isSubComponent =
    segs.some((s) => /^components?$/i.test(s)) ||
    segs.some((s) => /^(parts|fragments|widgets-internal)$/i.test(s));

  // 파일명 기반 도메인 힌트
  const nameLower = lowerScreen;
  const nameHints = {
    controlboard: /controlboard$/.test(nameLower),
    monitoring:   /monitoring|monitor$/.test(nameLower),
    planedit:     /planedit$/.test(nameLower),
    board:        /board$/.test(nameLower) && !/keyboard$/.test(nameLower),
    dashboard:    /dashboard$/.test(nameLower),
    routelayout:  /routelayout$/.test(nameLower) || /flodiagram$/.test(nameLower),
    simulation:   /simulation$/.test(nameLower),
    map:          /map$/.test(nameLower) && !/sitemap$/.test(nameLower),
  };

  // 경로 기반 힌트
  const pathHints = {
    controlboard: /\/controlboard\//.test(lowerPath),
    monitoring:   /\/monitoring\/|\/monitor\//.test(lowerPath),
    planedit:     /\/planedit\//.test(lowerPath),
    routelayout:  /\/route|\/flo\//.test(lowerPath),
    dashboard:    /\/dashboard\//.test(lowerPath) || /\/widgets\//.test(lowerPath),
    simulation:   /\/simulation\//.test(lowerPath),
  };

  return {
    absPath: absFile,
    relativePath: 'view/' + rel,
    relativeFilePath,
    moduleCode,
    category,
    screenName,
    isWidget,
    isPopup,
    isBase,
    isSubComponent,
    nameHints,
    pathHints,
  };
}

// ─────────────────────────────────────────────
// 3. menus.js 파싱 — id ↔ filePath 매핑 추출
//    트리 JSON 의 같은 객체 안 "id" 와 "filePath" 를 페어 매칭 (인접 400자 범위)
// ─────────────────────────────────────────────
function loadMenuMap() {
  const text = fs.readFileSync(MENUS_FILE, 'utf8');
  const map = new Map(); // filePath (lowercase) → menuCd

  // "id" 와 "filePath" 가 같은 객체 안에 있을 때 — 인접 매칭
  const re = /"id"\s*:\s*"(UI_[A-Z0-9_]+)"[\s\S]{0,400}?"filePath"\s*:\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const id = m[1];
    const filePath = m[2];
    if (!filePath || filePath === '') continue;
    map.set(filePath.toLowerCase(), id);
  }

  // 반대 순서로도 (filePath 가 id 앞에 오는 경우)
  const re2 = /"filePath"\s*:\s*"([^"]+)"[\s\S]{0,400}?"id"\s*:\s*"(UI_[A-Z0-9_]+)"/g;
  while ((m = re2.exec(text)) !== null) {
    const filePath = m[1];
    const id = m[2];
    if (!filePath || filePath === '') continue;
    if (!map.has(filePath.toLowerCase())) {
      map.set(filePath.toLowerCase(), id);
    }
  }
  return map;
}

// ─────────────────────────────────────────────
// 4. 파일 내용 정적 분석 — 컴포넌트 / API / 키워드
// ─────────────────────────────────────────────
function analyzeContent(meta) {
  let src;
  try {
    src = fs.readFileSync(meta.absPath, 'utf8');
  } catch (e) {
    return { error: 'read-failed', err: String(e) };
  }

  // 주석 제거 (대략) — 정확도보다 속도 우선. 단순 line/block 제거.
  const noComment = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/[^\n]*$/gm, '');

  // 1) JSX 컴포넌트 사용 카운트
  const components = {};
  for (const name of TRACK_COMPONENTS) {
    const re = new RegExp(`<${name}\\b`, 'g');
    const matches = noComment.match(re);
    if (matches && matches.length > 0) components[name] = matches.length;
  }

  // 2) SplitPanel direction
  const splitDirections = [];
  const sdRe = /<SplitPanel\b[^>]*direction\s*=\s*["']([^"']+)["']/g;
  let sm;
  while ((sm = sdRe.exec(noComment)) !== null) {
    splitDirections.push(sm[1]);
  }
  if (components.SplitPanel && splitDirections.length === 0) {
    // direction prop 이 없으면 default 가 'horizontal' 일 수 있음 — 직접 검증 필요
    splitDirections.push('unknown');
  }

  // 3) zAxios / callService 호출
  const apiCalls = new Set();
  const zaRe = /\bzAxios\s*\(\s*\{[\s\S]{0,200}?url\s*:\s*["']([^"']+)["']/g;
  const zaGetRe = /\bzAxios\.(?:get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g;
  let am;
  while ((am = zaRe.exec(noComment)) !== null) apiCalls.add(am[1]);
  while ((am = zaGetRe.exec(noComment)) !== null) apiCalls.add(am[1]);
  // GridSaveButton url="..." prop
  const gsbRe = /<GridSaveButton\b[^>]*url\s*=\s*["']([^"']+)["']/g;
  while ((am = gsbRe.exec(noComment)) !== null) apiCalls.add(am[1]);

  const callServices = new Set();
  const csRe = /\bcallService\s*\(\s*["']([^"']+)["']/g;
  while ((am = csRe.exec(noComment)) !== null) callServices.add(am[1]);

  // 4) SP 이름 (SP_UI_*, SRV_GET_SP_UI_*, SRV_SET_SP_UI_*)
  const spNames = new Set();
  const spRe = /\b(?:SRV_(?:GET|SET)_)?(SP_UI_[A-Z][A-Z0-9_]+|SP_COMM_[A-Z][A-Z0-9_]+|SP_UT_[A-Z][A-Z0-9_]+)\b/g;
  while ((am = spRe.exec(noComment)) !== null) spNames.add(am[1]);

  // 5) 키워드 (도메인 카테고리 추정용)
  const lowerSrc = noComment.toLowerCase();
  const keywords = {
    controlboard: /\bcontrolboard\b|컨트롤\s*보드/.test(lowerSrc),
    planedit:     /\bplanedit\b|plan\s*edit|계획\s*편집|계획\s*조정/.test(lowerSrc),
    monitoring:   /\bmonitoring\b|모니터링|관제/.test(lowerSrc),
    route:        /\broutelayout\b|\broute\s*layout\b|공정\s*라우트/.test(lowerSrc),
    dashboard:    /\bdashboard\b|대시보드/.test(lowerSrc),
    simulation:   /\bsimulation\b|시뮬레이션/.test(lowerSrc),
    pivot:        /\bpivot\b/.test(lowerSrc) || (components.PivotTable > 0),
    gantt:        (components.GanttChart > 0),
  };

  return {
    error: null,
    components,
    splitDirections,
    apiCalls: [...apiCalls],
    callServices: [...callServices],
    spNames: [...spNames],
    keywords,
    bytes: src.length,
    lines: src.split('\n').length,
  };
}

// ─────────────────────────────────────────────
// Phase 1 → DB 시드 LAYOUT 정규화 매핑
// (TB_IS_COMPOSER_PATTERN.LAYOUT 컬럼 = PatternPreview.jsx RENDERERS 키와 1:1)
// 분류기 출력 코드를 이 매핑으로 정규화 → coverage 매칭률 향상
//
// 메타 카테고리 (popup / widget_* / free_form / subcomponent / base_wrapper) 는
// DB 시드 대상 아님 — 분류기 전용으로 유지
// ─────────────────────────────────────────────
const NORMALIZE = {
  // 정확 매칭 (DB·Preview 양쪽에 있음)
  P01_widget_dashboard: 'widget_dashboard',
  P02_search_grid:      'search_grid',
  P03_search_tabs:      'search_tab',
  P06_cross_pivot:      'pivot_table',
  v2_chart_grid:        'grid_chart_stacked',
  v2_master_detail:     'split_master_detail',
  cb_master:            'cb_master_dashboard',
  // 도메인 변형 — DB 의 가장 유사한 키로 매핑
  P04_tree_grid:        'h2_tree_grid',
  rl_layout:            'rl_layout_design',
  mn_kpi_dashboard:     'mn_kpi_dashboard',
  pe_pivot_grid_edit:   'pe_pivot_grid_edit',
  // 메타 카테고리 — DB 시드 없음, 분류기 전용 그대로 유지
  // popup, widget_chart, widget_grid, widget_pivot, widget_panel, widget_misc,
  // subcomponent, base_wrapper, free_form
};
function normalizePatternCode(code) {
  return NORMALIZE[code] || code;
}

// ─────────────────────────────────────────────
// 5. 패턴 추정 (휴리스틱)
// ─────────────────────────────────────────────
function classify(meta, content) {
  if (!content || content.error) {
    return { layoutCategory: 'UNKNOWN', patternCode: 'unknown', subPattern: '', confidence: 'low', reason: content?.error || 'read-failed' };
  }

  const c = content.components;
  const k = content.keywords;
  // 파일명/경로 기반 힌트 통합 (소스 키워드 매칭은 종종 약함 — 명시적 힌트 우선)
  const nh = meta.nameHints || {};
  const ph = meta.pathHints || {};
  k.controlboard = k.controlboard || nh.controlboard || ph.controlboard;
  k.monitoring   = k.monitoring   || nh.monitoring   || ph.monitoring;
  k.planedit     = k.planedit     || nh.planedit     || ph.planedit;
  k.route        = k.route        || nh.routelayout  || ph.routelayout;
  k.dashboard    = k.dashboard    || nh.dashboard    || nh.board || ph.dashboard;

  const baseGridN  = c.BaseGrid || 0;
  const treeGridN  = c.TreeGrid || 0;
  const splitN     = c.SplitPanel || 0;
  const tabN       = c.TabContainer || 0;
  const dashN      = c.DashboardPanel || 0;
  const chartN     = c.ChartComponent || 0;
  const ganttN     = c.GanttChart || 0;
  const floN       = c.FLODiagram || 0;
  const pivotN     = c.PivotTable || 0;

  // Sub-component (메인 화면의 내부 부품) — 별도 분류
  if (meta.isSubComponent) {
    return {
      layoutCategory: 'SUBCOMPONENT',
      patternCode: 'subcomponent',
      subPattern: chartN > 0 ? 'chart_part' : (baseGridN > 0 ? 'grid_part' : (pivotN > 0 ? 'pivot_part' : 'form_part')),
      confidence: 'high',
      reason: 'sub-component folder',
    };
  }

  // Base*.jsx (BaseControlBoard 등) — 별도 분류
  if (meta.isBase) {
    return {
      layoutCategory: 'BASE',
      patternCode: 'base_wrapper',
      subPattern: '',
      confidence: 'high',
      reason: 'Base*.jsx wrapper',
    };
  }

  // 위젯은 별도 분류
  if (meta.isWidget) {
    let widgetType = 'widget_misc';
    if (chartN > 0 || ganttN > 0)         widgetType = 'widget_chart';
    else if (baseGridN > 0 || treeGridN > 0) widgetType = 'widget_grid';
    else if (pivotN > 0)                  widgetType = 'widget_pivot';
    else if (dashN > 0)                   widgetType = 'widget_panel';
    return {
      layoutCategory: 'WIDGET',
      patternCode: widgetType,
      subPattern: '',
      confidence: 'high',
      reason: `widget folder · chart=${chartN} grid=${baseGridN}`,
    };
  }

  // 팝업 (Pop*.jsx) — 별도 분류
  if (meta.isPopup) {
    return {
      layoutCategory: 'POPUP',
      patternCode: 'popup',
      subPattern: pivotN > 0 ? 'popup_pivot' : (baseGridN > 0 ? 'popup_grid' : 'popup_form'),
      confidence: 'high',
      reason: `Pop* file · grid=${baseGridN}`,
    };
  }

  // 도메인 특화 키워드 — 최우선
  if (k.route || floN > 0) {
    return {
      layoutCategory: 'LAYOUT_ROUTELAYOUT',
      patternCode: 'rl_layout',
      subPattern: '',
      confidence: floN > 0 ? 'high' : 'mid',
      reason: `route keyword · flo=${floN}`,
    };
  }

  // ControlBoard — 파일명/경로/키워드 중 하나면 매칭
  if (nh.controlboard || ph.controlboard) {
    let sub = 'cb_master';
    if (ganttN > 0) sub = 'cb_gantt_master';
    else if (chartN > 0) sub = 'cb_chart_master';
    return {
      layoutCategory: 'LAYOUT_CONTROLBOARD',
      patternCode: sub,
      subPattern: '',
      confidence: (chartN > 0 || ganttN > 0 || baseGridN > 0) ? 'high' : 'mid',
      reason: `controlboard match · chart=${chartN} gantt=${ganttN}`,
    };
  }

  // PlanEdit
  if (nh.planedit || ph.planedit) {
    return {
      layoutCategory: 'LAYOUT_PLANEDIT',
      patternCode: pivotN > 0 ? 'pe_pivot_grid_edit' : (ganttN > 0 ? 'pe_gantt_edit' : 'pe_grid_edit'),
      subPattern: '',
      confidence: (baseGridN > 0 || pivotN > 0 || ganttN > 0) ? 'high' : 'mid',
      reason: `planedit match · pivot=${pivotN} gantt=${ganttN}`,
    };
  }

  // Monitoring 키워드 + 차트/그리드
  if (nh.monitoring || ph.monitoring) {
    return {
      layoutCategory: 'LAYOUT_MONITORING',
      patternCode: chartN > 0 ? 'mn_kpi_dashboard' : (baseGridN > 0 ? 'mn_grid_alert' : 'mn_simple'),
      subPattern: '',
      confidence: (chartN > 0 || baseGridN > 0) ? 'high' : 'mid',
      reason: `monitoring match · chart=${chartN} grid=${baseGridN}`,
    };
  }

  // 대시보드 (Widget Dashboard)
  if (dashN > 0) {
    return {
      layoutCategory: 'LAYOUT_SINGLE',
      patternCode: 'P01_widget_dashboard',
      subPattern: '',
      confidence: 'high',
      reason: `DashboardPanel=${dashN}`,
    };
  }

  // Pivot Table 전용 화면
  if (pivotN > 0 && baseGridN === 0) {
    return {
      layoutCategory: 'LAYOUT_SINGLE',
      patternCode: 'P06_cross_pivot',
      subPattern: '',
      confidence: 'high',
      reason: `PivotTable=${pivotN}`,
    };
  }

  // SplitPanel 기반 분할
  if (splitN > 0) {
    const dirs = content.splitDirections || [];
    const isVertical   = dirs.some((d) => d === 'vertical');
    const isHorizontal = dirs.some((d) => d === 'horizontal');
    // pane 개수 = SplitPanel 개수 + 1 (대략)
    const paneCount = splitN + 1;
    let layout;
    let pattern;
    if (isVertical && !isHorizontal) {
      layout = paneCount >= 5 ? 'LAYOUT_V5' : (paneCount === 4 ? 'LAYOUT_V4' : (paneCount === 3 ? 'LAYOUT_V3' : 'LAYOUT_V2'));
      pattern = paneCount === 2 ? 'v2_master_detail' : `v${Math.min(paneCount,5)}_layout`;
    } else if (isHorizontal && !isVertical) {
      layout = paneCount >= 5 ? 'LAYOUT_H5' : (paneCount === 4 ? 'LAYOUT_H4' : (paneCount === 3 ? 'LAYOUT_H3' : 'LAYOUT_H2'));
      pattern = paneCount === 2 ? 'h2_master_detail' : `h${Math.min(paneCount,5)}_layout`;
    } else {
      // 혼합 (V+H) 또는 unknown
      layout = 'LAYOUT_MIXED';
      pattern = 'mix_split';
    }
    return {
      layoutCategory: layout,
      patternCode: pattern,
      subPattern: tabN > 0 ? 'with_tabs' : '',
      confidence: dirs.length > 0 && !dirs.includes('unknown') ? 'high' : 'mid',
      reason: `splits=${splitN} dirs=[${dirs.join(',')}] tabs=${tabN}`,
    };
  }

  // TabContainer 가 메인
  if (tabN > 0) {
    return {
      layoutCategory: 'LAYOUT_SINGLE',
      patternCode: 'P03_search_tabs',
      subPattern: `tabs=${tabN}`,
      confidence: 'high',
      reason: `TabContainer=${tabN}`,
    };
  }

  // Gantt 단독
  if (ganttN > 0) {
    return {
      layoutCategory: k.monitoring ? 'LAYOUT_MONITORING' : 'LAYOUT_SINGLE',
      patternCode: 'gantt_view',
      subPattern: '',
      confidence: 'mid',
      reason: `GanttChart=${ganttN}`,
    };
  }

  // Chart 단독
  if (chartN > 0 && baseGridN === 0) {
    return {
      layoutCategory: 'LAYOUT_SINGLE',
      patternCode: 'P09_chart_view',
      subPattern: '',
      confidence: 'mid',
      reason: `Chart=${chartN}`,
    };
  }

  // Chart + Grid
  if (chartN > 0 && baseGridN > 0) {
    return {
      layoutCategory: 'LAYOUT_V2',
      patternCode: 'v2_chart_grid',
      subPattern: '',
      confidence: 'mid',
      reason: `Chart=${chartN} Grid=${baseGridN}`,
    };
  }

  // TreeGrid 단독
  if (treeGridN > 0) {
    return {
      layoutCategory: 'LAYOUT_SINGLE',
      patternCode: 'P04_tree_grid',
      subPattern: '',
      confidence: 'high',
      reason: `TreeGrid=${treeGridN}`,
    };
  }

  // 표준 P02 — SearchArea + BaseGrid 1개
  if (baseGridN === 1 && (c.SearchArea || 0) > 0) {
    return {
      layoutCategory: 'LAYOUT_SINGLE',
      patternCode: 'P02_search_grid',
      subPattern: '',
      confidence: 'high',
      reason: `SearchArea + 1 BaseGrid`,
    };
  }

  // BaseGrid 1개 (검색 없음)
  if (baseGridN === 1) {
    return {
      layoutCategory: 'LAYOUT_SINGLE',
      patternCode: 'P02b_grid_only',
      subPattern: '',
      confidence: 'mid',
      reason: `1 BaseGrid no SearchArea`,
    };
  }

  // BaseGrid 2개 (split 없음) — 동일 layer 에 두 그리드
  if (baseGridN === 2) {
    return {
      layoutCategory: 'LAYOUT_V2',
      patternCode: 'v2_dual_grid',
      subPattern: '',
      confidence: 'mid',
      reason: `2 BaseGrid no SplitPanel`,
    };
  }

  // BaseGrid 3+ 개
  if (baseGridN >= 3) {
    return {
      layoutCategory: baseGridN === 3 ? 'LAYOUT_V3' : (baseGridN === 4 ? 'LAYOUT_V4' : 'LAYOUT_V5'),
      patternCode: `v${Math.min(baseGridN,5)}_multi_grid`,
      subPattern: '',
      confidence: 'mid',
      reason: `${baseGridN} BaseGrid no SplitPanel`,
    };
  }

  // 아무것도 매칭 안 됨 (Form-only, 빈 화면, 자유 창작)
  return {
    layoutCategory: 'LAYOUT_SINGLE',
    patternCode: 'free_form',
    subPattern: '',
    confidence: 'low',
    reason: `no recognized grid/chart/split components`,
  };
}

// ─────────────────────────────────────────────
// 6. CSV 직렬화
// ─────────────────────────────────────────────
function csvCell(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[,"\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function rowsToCsv(rows, headers) {
  const out = [];
  out.push('﻿' + headers.map(csvCell).join(','));
  for (const r of rows) {
    out.push(headers.map((h) => csvCell(r[h])).join(','));
  }
  return out.join('\n');
}

// ─────────────────────────────────────────────
// 7. 메인
// ─────────────────────────────────────────────
function main() {
  console.log('[ui-inventory] start');
  console.log('  view root :', VIEW_ROOT);
  console.log('  menus.js  :', MENUS_FILE);
  console.log('  out dir   :', OUT_DIR);

  const files = walk(VIEW_ROOT);
  console.log(`[ui-inventory] discovered ${files.length} .jsx files`);

  const menuMap = loadMenuMap();
  console.log(`[ui-inventory] menus.js parsed ${menuMap.size} (id, filePath) pairs`);

  const rows = [];
  for (const f of files) {
    const meta = parseFileMeta(f);
    const content = analyzeContent(meta);
    const cls = classify(meta, content);
    const menuCd = menuMap.get(meta.relativeFilePath.toLowerCase()) || '';
    // 분류기 출력 코드를 DB 시드 LAYOUT 으로 정규화 (Phase 3 coverage 매칭률 향상)
    const rawPatternCode = cls.patternCode;
    const normalizedCode = normalizePatternCode(rawPatternCode);

    rows.push({
      moduleCode: meta.moduleCode,
      category:   meta.category,
      screenName: meta.screenName,
      isWidget:       meta.isWidget ? 'Y' : 'N',
      isPopup:        meta.isPopup ? 'Y' : 'N',
      isBase:         meta.isBase ? 'Y' : 'N',
      isSubComponent: meta.isSubComponent ? 'Y' : 'N',
      menuCd:     menuCd,
      layoutCategory: cls.layoutCategory,
      patternCode:    normalizedCode,
      rawPatternCode: rawPatternCode === normalizedCode ? '' : rawPatternCode,
      subPattern:     cls.subPattern,
      confidence:     cls.confidence,
      reason:         cls.reason,
      components:     content?.error ? '' : Object.entries(content.components).map(([k,v]) => `${k}:${v}`).join(';'),
      apiCalls:       content?.error ? '' : (content.apiCalls || []).join(';'),
      callServices:   content?.error ? '' : (content.callServices || []).join(';'),
      spNames:        content?.error ? '' : (content.spNames || []).join(';'),
      lines:          content?.lines || 0,
      filePath:       meta.relativeFilePath,
      relativePath:   meta.relativePath,
    });
  }

  // 정렬: 모듈 → 카테고리 → 화면명
  rows.sort((a, b) => {
    return (a.moduleCode || '').localeCompare(b.moduleCode || '')
        || (a.category   || '').localeCompare(b.category   || '')
        || (a.screenName || '').localeCompare(b.screenName || '');
  });

  // 출력
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(rows, null, 2), 'utf8');

  const headers = [
    'moduleCode', 'category', 'screenName', 'isWidget', 'isPopup', 'isBase', 'isSubComponent',
    'menuCd', 'layoutCategory', 'patternCode', 'rawPatternCode', 'subPattern', 'confidence', 'reason',
    'components', 'apiCalls', 'callServices', 'spNames', 'lines', 'filePath', 'relativePath',
  ];
  fs.writeFileSync(OUT_CSV, rowsToCsv(rows, headers), 'utf8');

  // 통계 출력
  const byModule = {};
  const byLayout = {};
  const byConf = { high: 0, mid: 0, low: 0 };
  let menuMatched = 0;
  for (const r of rows) {
    byModule[r.moduleCode] = (byModule[r.moduleCode] || 0) + 1;
    byLayout[r.layoutCategory] = (byLayout[r.layoutCategory] || 0) + 1;
    byConf[r.confidence] = (byConf[r.confidence] || 0) + 1;
    if (r.menuCd) menuMatched++;
  }

  console.log('\n[ui-inventory] ===== 결과 요약 =====');
  console.log(`총 화면: ${rows.length}`);
  console.log(`menus.js 매칭: ${menuMatched} / ${menuMap.size} (등록 메뉴 매칭)`);
  console.log(`\n모듈별 화면 수:`);
  for (const [m, n] of Object.entries(byModule).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${m.padEnd(22)} ${n}`);
  }
  console.log(`\n레이아웃 카테고리 분포:`);
  for (const [l, n] of Object.entries(byLayout).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${l.padEnd(22)} ${n}`);
  }
  console.log(`\nConfidence 분포:`);
  for (const [c, n] of Object.entries(byConf).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c.padEnd(8)} ${n} (${(n / rows.length * 100).toFixed(1)}%)`);
  }
  console.log(`\n출력:`);
  console.log(`  ${OUT_JSON}`);
  console.log(`  ${OUT_CSV}`);
}

main();

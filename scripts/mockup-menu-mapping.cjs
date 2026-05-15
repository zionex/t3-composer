#!/usr/bin/env node
// mockup-menu-mapping.cjs v2 — T3SmartSCM 운영 메뉴 ↔ mockup 자동 매핑
// 우선순위: 1) ui-inventory patternCode 매칭  2) mockup sourceFilePath 매칭
//          3) 키워드 (menuNm/fileName)  4) 폴더 fallback

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const MENU_JSON      = path.join(REPO_ROOT, 'frontend/src/view/util/t3mockup/_data/t3smartscm-menus.json');
const INVENTORY_JSON = path.join(REPO_ROOT, 'docs/ui-inventory/ui-inventory.json');
const INDEX_JS       = path.join(REPO_ROOT, 'frontend/src/view/util/t3mockup/index.js');
const OUT_JSON       = path.join(REPO_ROOT, 'frontend/src/view/util/t3mockup/_data/t3smartscm-menu-mapping.json');

// ─────────────────────────────────────────
// Load data
// ─────────────────────────────────────────
const menus = JSON.parse(fs.readFileSync(MENU_JSON, 'utf8')).items;
const inventory = JSON.parse(fs.readFileSync(INVENTORY_JSON, 'utf8'));
console.log(`loaded ${menus.length} leaf menus, ${inventory.length} inventory screens`);

// inventory: menuCd 또는 relativePath 로 lookup
const invByMenuCd = {};
const invByPath = {};
for (const inv of inventory) {
  if (inv.menuCd) invByMenuCd[inv.menuCd] = inv;
  const rel = (inv.relativePath || inv.filePath || '').replace(/\.jsx$/i, '').replace(/^\//, '');
  if (rel) invByPath[rel.toLowerCase()] = inv;
}

// Parse mockup entries — block 단위 (T3SMART_SCM_ENTRIES 의 시작 ~ 끝)
const indexText = fs.readFileSync(INDEX_JS, 'utf8');
const startIdx = indexText.indexOf('const T3SMART_SCM_ENTRIES = [');
const endIdx   = indexText.indexOf('];', startIdx);
const block    = indexText.slice(startIdx, endIdx);
const entryRe = /\{ patternCode:\s*'([^']+)'[\s\S]*?(?=\{ patternCode:|$)/g;
const sfpRe   = /sourceFilePath:\s*'([^']+)'/;
const slmRe   = /sourceMenuCd:\s*'([^']+)'/;
const catRe   = /\bcategory:\s*'([^']+)'/;
const lcRe    = /layoutCategory:\s*'([^']+)'/;

const mockups = [];
let m;
while ((m = entryRe.exec(block)) !== null) {
  const eb = m[0];
  mockups.push({
    patternCode: m[1],
    layoutCategory: (lcRe.exec(eb) || [])[1],
    category:       (catRe.exec(eb) || [])[1],
    sourceFilePath: (sfpRe.exec(eb) || [])[1] || null,
    sourceMenuCd:   (slmRe.exec(eb) || [])[1] || null,
  });
}
console.log(`parsed ${mockups.length} mockup entries`);
const mockupSet = new Set(mockups.map((m) => m.patternCode));
const mockupByPattern = Object.fromEntries(mockups.map((m) => [m.patternCode, m]));

// ─────────────────────────────────────────
// Mapping helpers
// ─────────────────────────────────────────
function folderOf(filePath) {
  if (!filePath) return '';
  const segs = filePath.split('/').filter(Boolean);
  segs.pop();
  return segs.join('/').toLowerCase();
}
function fileNameOf(filePath) {
  if (!filePath) return '';
  return (filePath.split('/').pop() || '').toLowerCase();
}

const KEYWORD_RULES = [
  // Phase 4d 신규 mockup (운영 미커버 영역 보완)
  [/entrylog|enginehistory|timehistory/i,             'log_viewer'],
  [/imsimulationcompare|simulationcompare|targetinventoryresultperiod/i, 'sim_compare'],
  [/adjustmentgantt|adjustmentgrid|simulationadjustment|adjustmentchart/i, 'fp_simulation_edit'],
  [/devmakedata|menubadge|systemconfig.*badge/i,       'dev_tool'],

  // Phase 4a 신규 mockup 의 운영 매핑 (구체적)
  [/^ui_sa_executive_dashboard$|executivedashboard/i, 'dash_executive'],
  [/supplyplankpi/i,                                    'dash_supply_kpi'],
  [/ontimesales/i,                                       'dash_ontime_sales'],
  [/salesgrowthrate/i,                                   'dash_sales_growth'],
  [/productionperformance/i,                             'dash_production_perf'],
  [/simulationkpidashboard|simulkpidashboard/i,         'dash_simulation_kpi'],
  [/inoutstatusdashboard/i,                              'dash_inout_status'],
  [/planproblemdashboard/i,                              'dash_plan_problem'],
  [/wipeohoutdashboard/i,                                'dash_wip_eoh'],
  [/^\/dashboard\/salesboard|salesboard/i,             'dash_sales_board'],
  [/^\/dashboard\/demandplanboard|demandplanboard/i,  'dash_demand_board'],
  [/^\/dashboard\/supplyboard|supplyboard/i,            'dash_supply_board'],
  [/^\/dashboard\/psiboard|psiboard/i,                  'dash_psi_board'],
  [/^\/dashboard\/invenboard|invenboard|inventoryboard/i, 'dash_inven_board'],
  [/kpiboard/i,                                          'dash_kpi_board'],
  [/^\/dashboard\/overview/i,                            'dash_overview'],

  // ControlBoard 변형
  [/iscontrolboard/i,                                   'cb_insight_prediction'],
  [/yearlyplan.*controlboard|yearlyplanctrlboard/i,    'cb_bp_yearly'],
  [/baselineforecast\/version\/controlboard\/controlboard/i, 'cb_bf_forecast'],
  [/demandplan\/version\/controlboard/i,                'cb_dp_demand'],
];

const FOLDER_RULES = [
  // controlboard 폴더 (가장 구체) — fallback
  [/\/(.+\/)?controlboard/i, 'cb_master_dashboard'],

  // dashboard 폴더 — fallback (dash_overview generic)
  [/\/dashboard($|\/)/i,     'dash_overview'],
  [/\/snop\/mdb/i,           'dash_supply_kpi'],
  [/\/snop\/dashboard/i,     'dash_executive'],
  [/\/factoryplan\/dashboard/i, 'dash_production_perf'],
  [/\/demandplan\/dashboard/i,  'dash_demand_board'],

  // analysis / report 류 — analysis_report (KPI + 차트 + 표 통합)
  [/\/analysisreport($|\/)/i, 'analysis_report'],
  [/\/analysis($|\/)/i,       'analysis_report'],
  [/\/report($|\/)/i,         'analysis_report'],

  // 시뮬 비교 / 시뮬 결과 — sim_compare
  [/\/planningsimulation($|\/)/i, 'sim_compare'],

  // factoryplan 시뮬 보정 — fp_simulation_edit
  [/\/factoryplan\/simulation($|\/)/i, 'fp_simulation_edit'],

  // log / history 류
  [/\/(.+\/)?(log|history)($|\/)/i, 'log_viewer'],
  [/\/servermgmt|\/systemanalysis/i, 'log_viewer'],

  // 시스템 설정 / 개발자 도구 — dev_tool
  [/\/systemconfig|\/developer($|\/)/i, 'dev_tool'],

  // entry / master / setting — 검색+그리드 패턴
  [/\/entry($|\/)/i,          'search_grid'],
  [/\/setting($|\/)/i,        'search_grid'],
  [/\/simulation($|\/)/i,     'split_master_detail'],

  // 트리/계층
  [/\/usermgmt|\/role|\/menu($|\/)/i, 'h2_tree_grid'],

  // 그 외 마스터 / 자유 — search_grid 가 가장 흔한 P02
  [/\/master($|\/)/i,         'search_grid'],
  [/\/supplychainmodel/i,     'rl_layout_design'],
  [/\/yearlyplan/i,           'pivot_table'],
];

// 운영 메뉴 → mockup
function mapMenuToMockup(menu) {
  const fp = (menu.filePath || '');
  const fpLower = fp.toLowerCase();
  const fileName = fileNameOf(fp);

  // 1) ui-inventory 의 분류 결과를 활용
  const invRel = fp.replace(/^\//, '').toLowerCase().replace(/\.jsx$/, '');
  const inv = invByMenuCd[menu.menuId] || invByPath[invRel];
  if (inv && inv.patternCode && mockupSet.has(inv.patternCode)) {
    return { patternCode: inv.patternCode, reason: 'inventory.patternCode' };
  }

  // 2) 키워드 매칭 (Phase 4a dashboard/controlboard 세분화)
  for (const [re, pc] of KEYWORD_RULES) {
    if (re.test(menu.menuNm || '') || re.test(fileName) || re.test(fpLower)) {
      if (mockupSet.has(pc)) return { patternCode: pc, reason: 'keyword: ' + re.source };
    }
  }

  // 3) 폴더 패턴
  for (const [re, pc] of FOLDER_RULES) {
    if (re.test(fpLower)) {
      if (mockupSet.has(pc)) return { patternCode: pc, reason: 'folder: ' + re.source };
    }
  }

  // 4) inventory 의 layoutCategory 기반 fallback
  if (inv) {
    if (inv.layoutCategory === 'LAYOUT_SINGLE') return { patternCode: 'search_grid', reason: 'inv.layoutCategory=SINGLE' };
    if (inv.layoutCategory === 'LAYOUT_V2')     return { patternCode: 'v2_dual_grid', reason: 'inv.layoutCategory=V2' };
    if (inv.layoutCategory === 'LAYOUT_H2')     return { patternCode: 'h2_master_detail', reason: 'inv.layoutCategory=H2' };
  }

  // 5) 최종 fallback — search_grid (P02 마스터 CRUD)
  return { patternCode: 'search_grid', reason: 'default fallback' };
}

// ─────────────────────────────────────────
// Build mapping
// ─────────────────────────────────────────
const mockupToMenus = {};
const menuToMockup = {};
const mappingByReason = {};
let mappedCount = 0;

for (const menu of menus) {
  const r = mapMenuToMockup(menu);
  if (!r) continue;
  const { patternCode, reason } = r;
  if (!mockupToMenus[patternCode]) mockupToMenus[patternCode] = [];
  mockupToMenus[patternCode].push({
    menuId: menu.menuId,
    menuNm: menu.menuNm,
    filePath: menu.filePath,
    reason,
  });
  menuToMockup[menu.menuId] = patternCode;
  mappingByReason[reason] = (mappingByReason[reason] || 0) + 1;
  mappedCount++;
}

// ─────────────────────────────────────────
// Stats
// ─────────────────────────────────────────
const stats = {
  totalMenus: menus.length,
  mappedCount,
  mockupCoverage: {},
  byReasonTop: Object.entries(mappingByReason).sort((a, b) => b[1] - a[1]),
};
for (const mk of mockups) {
  stats.mockupCoverage[mk.patternCode] = {
    category: mk.category,
    count: (mockupToMenus[mk.patternCode] || []).length,
  };
}

fs.writeFileSync(OUT_JSON, JSON.stringify({
  stats, mockupToMenus, menuToMockup,
}, null, 2), 'utf8');

console.log('\n=== Mapping Summary ===');
console.log(`total menus:   ${stats.totalMenus}`);
console.log(`mapped:        ${stats.mappedCount} (${(mappedCount / menus.length * 100).toFixed(1)}%)`);

console.log('\nMockups with most menus (top 20):');
Object.entries(stats.mockupCoverage)
  .filter(([_, v]) => v.count > 0)
  .sort((a, b) => b[1].count - a[1].count)
  .slice(0, 20)
  .forEach(([pc, v]) => console.log(`  ${pc.padEnd(28)} (${v.category.padEnd(12)})  ${v.count}`));

console.log('\nMockups with 0 menus:');
Object.entries(stats.mockupCoverage)
  .filter(([_, v]) => v.count === 0)
  .forEach(([pc, v]) => console.log(`  ${pc.padEnd(28)} (${v.category})`));

console.log('\nMapping reasons (top 10):');
stats.byReasonTop.slice(0, 10).forEach(([r, c]) => console.log(`  ${c.toString().padStart(4)}  ${r}`));

console.log(`\nwritten: ${OUT_JSON}`);

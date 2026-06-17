/* eslint-disable */
// node 단위 테스트 — assert 만 사용 (jest 미설치 환경 호환)
const assert = require('assert');
const { extractLayers } = require('../split-t3mes-tabs.cjs');

function eq(a, b, msg) { assert.deepStrictEqual(a, b, msg); }

// ── C1: 단일 그리드 (panel 안 table.tbl 1개) ──
const c1 = extractLayers(`
<!DOCTYPE html><div class="panel" id="p0">
  <div class="sec-hdr"><h3>제목</h3></div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>A</th></tr></thead></table></div>
</div>`);
eq(c1, [
  { key: 'grid1', title: '그리드 1', type: 'GRID', subtype: 'GRID_BASE',
    position: { x: 0, y: 0, w: 12, h: 12 } },
], 'C1 단일 그리드');

// ── C2: 마스터-디테일 (grid2 = 좌우 분할) ──
const c2 = extractLayers(`
<div class="panel" id="p1">
  <div class="grid2" style="grid-template-columns:320px 1fr">
    <div class="card"><table class="tbl"></table></div>
    <div class="card"><div class="form-row"><input class="inp"></div>
                      <div class="form-row"><select class="inp"></select></div></div>
  </div>
</div>`);
eq(c2, [
  { key: 'grid1', title: '그리드 1', type: 'GRID', subtype: 'GRID_BASE',
    position: { x: 0, y: 0, w: 6, h: 12 } },
  { key: 'form1', title: '입력 폼', type: 'CONTAINER', subtype: 'GRID_BASE',
    position: { x: 6, y: 0, w: 6, h: 12 } },
], 'C2 마스터-디테일');

// ── C3: 그리드 + 차트 (column 기본 — grid2/grid3 없음) ──
const c3 = extractLayers(`
<div class="panel" id="p0">
  <div class="tbl-wrap"><table class="tbl"></table></div>
  <canvas id="chart1"></canvas>
</div>`);
eq(c3, [
  { key: 'grid1', title: '그리드 1', type: 'GRID', subtype: 'GRID_BASE',
    position: { x: 0, y: 0, w: 12, h: 6 } },
  { key: 'chart1', title: '차트 1', type: 'CHART', subtype: 'CHART_LINE',
    position: { x: 0, y: 6, w: 12, h: 6 } },
], 'C3 grid + chart column');

// ── C4: KPI 그리드 + 그리드 ──
const c4 = extractLayers(`
<div class="panel" id="p0">
  <div class="kpi-grid">
    <div class="kpi-card">A</div><div class="kpi-card">B</div>
    <div class="kpi-card">C</div><div class="kpi-card">D</div>
  </div>
  <div class="tbl-wrap"><table class="tbl"></table></div>
</div>`);
eq(c4, [
  { key: 'kpi1', title: 'KPI 영역', type: 'CHART', subtype: 'KPI_CARD',
    position: { x: 0, y: 0, w: 12, h: 6 } },
  { key: 'grid1', title: '그리드 1', type: 'GRID', subtype: 'GRID_BASE',
    position: { x: 0, y: 6, w: 12, h: 6 } },
], 'C4 KPI + grid');

// ── C5: 시그니처 0건 (텍스트만) ──
const c5 = extractLayers(`<div class="panel"><div class="sec-hdr"><h3>제목</h3></div></div>`);
eq(c5, [], 'C5 0건');

// ── C6: 비정상 8개 그리드 (첫 6개만 + warn) ──
const warnings = [];
const origWarn = console.warn;
console.warn = (m) => warnings.push(m);
const c6 = extractLayers(
  '<div class="panel">' +
  '<table class="tbl"></table>'.repeat(8) +
  '</div>',
);
console.warn = origWarn;
assert.strictEqual(c6.length, 6, 'C6 6개 cap');
assert.ok(warnings.some((w) => /6\+/.test(w)), 'C6 warn 발생');

// ── C7: 트리 시각화 (org-tree) ──
const c7 = extractLayers(`
<div class="panel" id="p0">
  <div class="org-tree"><ul><li>root<ul><li>child</li></ul></li></ul></div>
</div>`);
eq(c7, [
  { key: 'tree1', title: '트리', type: 'GRID', subtype: 'GRID_TREE',
    position: { x: 0, y: 0, w: 12, h: 12 } },
], 'C7 tree');

// ── C8: 카드 리스트 (≥3 card) ──
const c8 = extractLayers(`
<div class="panel" id="p0">
  <div class="card">A</div><div class="card">B</div><div class="card">C</div><div class="card">D</div>
</div>`);
eq(c8, [
  { key: 'cards1', title: '카드 리스트', type: 'CONTAINER', subtype: 'CARD_LIST',
    position: { x: 0, y: 0, w: 12, h: 12 } },
], 'C8 cards');

// ── C9: 스테퍼 + 그리드 (stepper 위, grid 아래) ──
const c9 = extractLayers(`
<div class="panel" id="p0">
  <div class="stepper"><div class="step">1</div><div class="step">2</div></div>
  <table class="tbl"></table>
</div>`);
eq(c9, [
  { key: 'stepper1', title: '단계', type: 'CHART', subtype: 'GRID_BASE',
    position: { x: 0, y: 0, w: 12, h: 6 } },
  { key: 'grid1', title: '그리드 1', type: 'GRID', subtype: 'GRID_BASE',
    position: { x: 0, y: 6, w: 12, h: 6 } },
], 'C9 stepper + grid');

// ── C10: 대시보드 — grid4 KPI strip + grid2 안 2 card-title (차트+알림) ──
//   grid4 = KPI strip (kpi=1), chart-card = chart (chart=1),
//   card-title 2개 = cardSections=2.
//   explicitSlots = grid(0) + chart(1) + form(0) = 1, cardSections(2) > 1 → 1 card region 추가.
//   결과: kpi + chart + card → 3 layer
const c10 = extractLayers(`
<div class="panel" id="p0">
  <div class="sec-hdr"><h3>대시보드</h3></div>
  <div class="grid4" id="kpis"></div>
  <div class="grid2">
    <div class="card"><div class="card-title">차트</div><div class="chart-card"></div></div>
    <div class="card"><div class="card-title">알림</div><div id="alerts"></div></div>
  </div>
</div>`);
assert.strictEqual(c10.length, 3, 'C10 — 3 layers (KPI + chart + card region)');
assert.strictEqual(c10[0].subtype, 'KPI_CARD', 'C10 layer 0 = KPI');
const c10ChartIdx = c10.findIndex((l) => l.subtype === 'CHART_LINE');
const c10CardIdx = c10.findIndex((l) => l.subtype === 'CARD_LIST');
assert.ok(c10ChartIdx >= 0, 'C10 has chart');
assert.ok(c10CardIdx >= 0, 'C10 has card region');

// ── C11: grid4 단독 (KPI strip only) ──
const c11 = extractLayers(`
<div class="panel" id="p0">
  <div class="grid4" id="kpis"></div>
</div>`);
eq(c11, [
  { key: 'kpi1', title: 'KPI 영역', type: 'CHART', subtype: 'KPI_CARD',
    position: { x: 0, y: 0, w: 12, h: 12 } },
], 'C11 KPI strip 단독');

console.log('OK — extract-layers 11 cases passed');

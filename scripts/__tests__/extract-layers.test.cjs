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
  { key: 'form1', title: '입력 폼 1', type: 'GRID', subtype: 'GRID_BASE',
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

// ── C4: KPI 그리드 + 그리드 (4 KPI 카드 + 1 grid = 5 layers) ──
const c4 = extractLayers(`
<div class="panel" id="p0">
  <div class="kpi-grid">
    <div class="kpi-card">A</div><div class="kpi-card">B</div>
    <div class="kpi-card">C</div><div class="kpi-card">D</div>
  </div>
  <div class="tbl-wrap"><table class="tbl"></table></div>
</div>`);
eq(c4, [
  { key: 'kpi1', title: 'KPI 1', type: 'CHART', subtype: 'KPI_CARD',
    position: { x: 0, y: 0, w: 3, h: 3 } },
  { key: 'kpi2', title: 'KPI 2', type: 'CHART', subtype: 'KPI_CARD',
    position: { x: 3, y: 0, w: 3, h: 3 } },
  { key: 'kpi3', title: 'KPI 3', type: 'CHART', subtype: 'KPI_CARD',
    position: { x: 6, y: 0, w: 3, h: 3 } },
  { key: 'kpi4', title: 'KPI 4', type: 'CHART', subtype: 'KPI_CARD',
    position: { x: 9, y: 0, w: 3, h: 3 } },
  { key: 'grid1', title: '그리드 1', type: 'GRID', subtype: 'GRID_BASE',
    position: { x: 0, y: 3, w: 12, h: 9 } },
], 'C4 KPI 카드 4개 + grid');

// ── C5: 시그니처 0건 (텍스트만) ──
const c5 = extractLayers(`<div class="panel"><div class="sec-hdr"><h3>제목</h3></div></div>`);
eq(c5, [], 'C5 0건');

// ── C6: 비정상 12개 그리드 (첫 10개만 + warn) ──
const warnings = [];
const origWarn = console.warn;
console.warn = (m) => warnings.push(m);
const c6 = extractLayers(
  '<div class="panel">' +
  '<table class="tbl"></table>'.repeat(12) +
  '</div>',
);
console.warn = origWarn;
assert.strictEqual(c6.length, 10, 'C6 10개 cap');
assert.ok(warnings.some((w) => /10\+/.test(w)), 'C6 warn 발생');

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
  { key: 'cards1', title: '카드 리스트', type: 'GRID', subtype: 'CARD_LIST',
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
//   grid4 = 4 KPI 카드 (kpi=4), chart-card = chart (chart=1),
//   card-title 2개 = cardSections=2.
//   explicitSlots = grid(0) + chart(1) + form(0) = 1, cardSections(2) > 1 → 1 card region 추가.
//   결과: 4 kpi + chart + card → 6 layer
const c10 = extractLayers(`
<div class="panel" id="p0">
  <div class="sec-hdr"><h3>대시보드</h3></div>
  <div class="grid4" id="kpis"></div>
  <div class="grid2">
    <div class="card"><div class="card-title">차트</div><div class="chart-card"></div></div>
    <div class="card"><div class="card-title">알림</div><div id="alerts"></div></div>
  </div>
</div>`);
eq(c10, [
  { key: 'kpi1', title: 'KPI 1', type: 'CHART', subtype: 'KPI_CARD',
    position: { x: 0, y: 0, w: 3, h: 3 } },
  { key: 'kpi2', title: 'KPI 2', type: 'CHART', subtype: 'KPI_CARD',
    position: { x: 3, y: 0, w: 3, h: 3 } },
  { key: 'kpi3', title: 'KPI 3', type: 'CHART', subtype: 'KPI_CARD',
    position: { x: 6, y: 0, w: 3, h: 3 } },
  { key: 'kpi4', title: 'KPI 4', type: 'CHART', subtype: 'KPI_CARD',
    position: { x: 9, y: 0, w: 3, h: 3 } },
  { key: 'chart1', title: '차트 1', type: 'CHART', subtype: 'CHART_LINE',
    position: { x: 0, y: 3, w: 6, h: 9 } },
  { key: 'card1', title: '카드 영역 1', type: 'GRID', subtype: 'CARD_LIST',
    position: { x: 6, y: 3, w: 6, h: 9 } },
], 'C10 대시보드 4 KPI + chart + card region');

// ── C11: grid4 단독 (KPI strip only — 4 카드 전면) ──
const c11 = extractLayers(`
<div class="panel" id="p0">
  <div class="grid4" id="kpis"></div>
</div>`);
eq(c11, [
  { key: 'kpi1', title: 'KPI 1', type: 'CHART', subtype: 'KPI_CARD',
    position: { x: 0, y: 0, w: 3, h: 12 } },
  { key: 'kpi2', title: 'KPI 2', type: 'CHART', subtype: 'KPI_CARD',
    position: { x: 3, y: 0, w: 3, h: 12 } },
  { key: 'kpi3', title: 'KPI 3', type: 'CHART', subtype: 'KPI_CARD',
    position: { x: 6, y: 0, w: 3, h: 12 } },
  { key: 'kpi4', title: 'KPI 4', type: 'CHART', subtype: 'KPI_CARD',
    position: { x: 9, y: 0, w: 3, h: 12 } },
], 'C11 KPI strip 단독 — 4 카드 전면');

// ── C12: grid4 with inputs = FORM (NOT KPI strip — false positive 차단) ──
const c12 = extractLayers(`
<div class="panel" id="p0">
  <div class="grid4">
    <div><div class="label">A</div><input class="inp" value=""></div>
    <div><div class="label">B</div><select><option>x</option></select></div>
    <div><div class="label">C</div><input class="inp" value=""></div>
    <div><div class="label">D</div><input class="inp" value=""></div>
  </div>
  <table class="tbl"></table>
</div>`);
// Expected: 단일 grid + form (KPI 미카운트) — 4 inputs/selects 가 form 카운트 트리거
// Slots: [grid, form] (no KPI). 분배: 상하 6+6 (splitCols 없음)
eq(c12, [
  { key: 'grid1', title: '그리드 1', type: 'GRID', subtype: 'GRID_BASE',
    position: { x: 0, y: 0, w: 12, h: 6 } },
  { key: 'form1', title: '입력 폼 1', type: 'GRID', subtype: 'GRID_BASE',
    position: { x: 0, y: 6, w: 12, h: 6 } },
], 'C12 grid4 with inputs = FORM');

// ── C13: grid3 with cards only (no signature inside) — pad to 3 layers ──
const c13 = extractLayers(`
<div class="panel" id="p0">
  <div class="grid3">
    <div class="card">공급사 A 정보</div>
    <div class="card">공급사 B 정보</div>
    <div class="card">공급사 C 정보</div>
  </div>
</div>`);
// 3 cards (no signature inside) → cards 시그니처가 트리거 (≥3 card)
// + grid3 splitCols → cards count 1 + pad to 3 = 3 layers
// cards 가 wrapper 가 아닌 자체 1 layer 라 dedup 안 됨 (grid=0, chart=0).
// 결과: 3 generic GRID layers 좌우 분할.
assert.strictEqual(c13.length, 3, 'C13 3 layers from grid3 cards');
assert.ok(c13.every((l) => l.position.y === 0 && l.position.h === 12),
  'C13 all layers full height');
assert.ok(c13[0].position.w === 4 && c13[1].position.w === 4 && c13[2].position.w === 4,
  'C13 each w=4');

// ── C14: grid2 with form inputs only (no table) → 2 form layers ──
const c14 = extractLayers(`
<div class="panel" id="p0">
  <div class="grid2">
    <div class="card">
      <div class="form-row"><label>A</label><input class="inp"></div>
      <div class="form-row"><label>B</label><input class="inp"></div>
    </div>
    <div class="card">
      <div class="form-row"><label>C</label><input class="inp"></div>
      <div class="form-row"><label>D</label><input class="inp"></div>
    </div>
  </div>
</div>`);
// 4 inputs total → form count = 1 → Rule B1 upgrades to 2 (splitCols=2)
// 좌우 분할: form1 (0,0,6,12) + form2 (6,0,6,12)
eq(c14, [
  { key: 'form1', title: '입력 폼 1', type: 'GRID', subtype: 'GRID_BASE',
    position: { x: 0, y: 0, w: 6, h: 12 } },
  { key: 'form2', title: '입력 폼 2', type: 'GRID', subtype: 'GRID_BASE',
    position: { x: 6, y: 0, w: 6, h: 12 } },
], 'C14 form-only grid2 → 2 form layers');

console.log('OK — extract-layers 14 cases passed');

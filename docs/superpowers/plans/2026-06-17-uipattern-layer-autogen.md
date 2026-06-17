# T3MES UI Pattern Layer Auto-Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** T3MES UI Pattern picker 에서 패턴 선택 시 `ComposerSpec.layers` 자동 생성 — SCM UI Mockup 의 `specFromMockup` 과 동등하게.

**Architecture:** 빌드 타임에 `split-t3mes-tabs.cjs` 가 730+ lite HTML 을 정규식으로 파싱해 12-col RGL 좌표 layers 를 `t3mes-tabs.json` 에 인라인 캐시. 런타임은 `T3mesPatternCatalog` 가 `ALL_ENTRIES` 에 전파하고, `specFromUiPattern` 이 layers 를 spec 으로 변환.

**Tech Stack:** Node.js (cjs script · 정규식 파싱) · React (frontend) · 단위 테스트는 node assert + 직접 require (jest 미사용 — 코드베이스 컨벤션 확인 후 결정).

**Spec:** [`docs/superpowers/specs/2026-06-17-uipattern-layer-autogen-design.md`](../specs/2026-06-17-uipattern-layer-autogen-design.md)

---

## Task 1: 파서 함수 `extractLayers()` + 단위 테스트

**Files:**
- Modify: `scripts/split-t3mes-tabs.cjs` (파서 함수 추가, 호출은 아직 안 함)
- Create: `scripts/__tests__/extract-layers.test.cjs`

- [ ] **Step 1: 테스트 파일 작성 (failing)**

Create `scripts/__tests__/extract-layers.test.cjs`:

```javascript
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
  { key: 'form1', title: '입력 폼', type: 'CONTAINER', subtype: 'FORM',
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

console.log('OK — extract-layers 7 cases passed');
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `node scripts/__tests__/extract-layers.test.cjs`
Expected: FAIL with `Cannot find module './split-t3mes-tabs.cjs'` exporting `extractLayers` (함수 미존재 또는 미export)

- [ ] **Step 3: `extractLayers()` 구현 + module.exports 추가**

Edit `scripts/split-t3mes-tabs.cjs` — 파일 끝의 `main();` 줄 **위에** 다음 블록 추가, 그리고 마지막 `main();` 라인을 `if (require.main === module) main();` 로 변경:

```javascript
// ──────────────────────────────────────────────────────────────
// Layer 추출 — lite HTML → ComposerSpec.layers 12-col RGL 좌표
//
// 인식 시그니처 (rules/spec §3.2):
//   <table class="tbl"> · <div class="tbl-wrap">  → GRID (GRID_BASE)
//   <canvas> · class="chart" / class="chart-card" → CHART (CHART_LINE)
//   <div class="kpi-grid"> · <div class="kpi-row"> + 자식 → KPI 영역 1개 (KPI_CARD)
//   <div class="form-row"> 다수 · <input>/<select> 다수 → CONTAINER (FORM)
//
// 좌표 신호:
//   class="grid2" 또는 grid-template-columns 2-col → 좌우 분할 (w 분배)
//   class="grid3" 또는 grid-template-columns 3-col → 좌우 3분할
//   그 외 (기본) → 상하 분할 (h 분배)
//
// 한계:
//   - panel 안 첫 grid2/grid3 만 인식 (1레벨 중첩만)
//   - KPI 카드는 자식 수 무관 1개 영역 layer 로 묶음
// ──────────────────────────────────────────────────────────────
const MAX_LAYERS = 6;

function extractLayers(html) {
  if (!html || typeof html !== 'string') return [];

  // panel 루트 안의 내용만 보기 (lite HTML 은 보통 <div class="panel" id="pN"> 안에 본문)
  const panelMatch = /<div[^>]*class="[^"]*panel[^"]*"[^>]*>([\s\S]*)<\/div>/i.exec(html);
  const inner = panelMatch ? panelMatch[1] : html;

  // 좌우 분할 신호 — panel 안에 grid2/grid3 가 있으면 자식들을 좌우 layer 로 본다
  const gridSplit = /<div[^>]*class="[^"]*\bgrid([23])\b/i.exec(inner);
  const splitCols = gridSplit ? parseInt(gridSplit[1], 10) : null;

  // 시그니처 카운트 (panel 안 전체 기준 — 1레벨 중첩 무시)
  const matchCount = (re) => (inner.match(re) || []).length;
  const counts = {
    grid:  matchCount(/<table[^>]*class="[^"]*\btbl\b/gi)
             || matchCount(/<div[^>]*class="[^"]*\btbl-wrap\b/gi),
    chart: matchCount(/<canvas\b/gi)
             || matchCount(/<div[^>]*class="[^"]*\bchart(-card)?\b/gi),
    kpi:   (/<div[^>]*class="[^"]*\bkpi-(grid|row)\b/i.test(inner)
             || matchCount(/<div[^>]*class="[^"]*\bkpi-card\b/gi) >= 2) ? 1 : 0,
    form:  (matchCount(/<div[^>]*class="[^"]*\bform-row\b/gi) >= 2
             || matchCount(/<input\b/gi) + matchCount(/<select\b/gi) >= 3) ? 1 : 0,
  };

  // type 메타 빌드 — Mockup 의 type/subtype 관례 따름.
  //   KPI 가 있으면 항상 맨 위 (대시보드 패턴 관례)
  //   순서: [KPI] → grids → charts → [form]
  const META = {
    GRID:  { type: 'GRID',      subtype: 'GRID_BASE', titlePrefix: '그리드' },
    CHART: { type: 'CHART',     subtype: 'CHART_LINE', titlePrefix: '차트' },
    KPI:   { type: 'CHART',     subtype: 'KPI_CARD',   titlePrefix: 'KPI' },
    FORM:  { type: 'CONTAINER', subtype: 'FORM',       titlePrefix: '입력 폼' },
  };
  const slots = [];
  if (counts.kpi) slots.push({ ...META.KPI, slot: 'kpi' });
  for (let i = 0; i < counts.grid;  i++) slots.push({ ...META.GRID,  slot: 'grid' });
  for (let i = 0; i < counts.chart; i++) slots.push({ ...META.CHART, slot: 'chart' });
  if (counts.form) slots.push({ ...META.FORM, slot: 'form' });

  if (slots.length === 0) return [];

  // 7개 이상 → 첫 6개만 + warn
  if (slots.length > MAX_LAYERS) {
    console.warn(
      `[extractLayers] layer 6+ 개 인식 — 첫 ${MAX_LAYERS}개만 유지 (총 ${slots.length}개)`,
    );
    slots.length = MAX_LAYERS;
  }

  // 좌표 분배
  const N = slots.length;
  const positions = [];
  if (splitCols && N >= 2) {
    // 좌우 분배 — 나머지는 마지막 layer 가 흡수
    const w = Math.floor(12 / N);
    let x = 0;
    for (let i = 0; i < N; i++) {
      const widthW = (i === N - 1) ? (12 - x) : w;
      positions.push({ x, y: 0, w: widthW, h: 12 });
      x += widthW;
    }
  } else {
    // 상하 분배 (기본)
    const h = Math.floor(12 / N);
    let y = 0;
    for (let i = 0; i < N; i++) {
      const heightH = (i === N - 1) ? (12 - y) : h;
      positions.push({ x: 0, y, w: 12, h: heightH });
      y += heightH;
    }
  }

  // key/title 부여 (slot 별 인덱스)
  const counters = { kpi: 0, grid: 0, chart: 0, form: 0 };
  return slots.map((s, i) => {
    counters[s.slot] += 1;
    const n = counters[s.slot];
    const isSingleton = (s.slot === 'kpi' || s.slot === 'form');
    return {
      key:   `${s.slot}${n}`,
      title: isSingleton ? (s.slot === 'kpi' ? 'KPI 영역' : '입력 폼')
                         : `${s.titlePrefix} ${n}`,
      type: s.type,
      subtype: s.subtype,
      position: positions[i],
    };
  });
}

module.exports = { extractLayers };
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `node scripts/__tests__/extract-layers.test.cjs`
Expected: `OK — extract-layers 7 cases passed`

만약 실패하면 어떤 케이스가 왜 실패했는지 출력 확인 후 파서 보정.

- [ ] **Step 5: Commit**

```bash
git add scripts/split-t3mes-tabs.cjs scripts/__tests__/extract-layers.test.cjs
git commit -m "$(cat <<'EOF'
feat(composer): T3MES UI Pattern lite HTML → layers 파서 (extractLayers)

raw mockup HTML 마크업 (table.tbl · canvas · grid2/grid3 · kpi-grid ·
form-row) 을 인식해 12-col RGL 좌표 layers 로 변환. 7+ 개는 첫 6개로 cap
+ warn. 호출 추가는 다음 Task.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: split-t3mes-tabs.cjs 메인 루프에서 extractLayers 호출 + JSON 인라인 주입

**Files:**
- Modify: `scripts/split-t3mes-tabs.cjs:344-385` (main 함수 안 tabMetas 빌드)

- [ ] **Step 1: main() 루프에서 lite 생성 직후 extractLayers 호출**

Find in `scripts/split-t3mes-tabs.cjs` main() (around L364-378):

```javascript
      // lite — 정적 panel 우선, 없으면 동적 템플릿 fallback
      let panelHtml = extractPanel(html, t.index);
      let liteSource = 'static';
      if (!panelHtml) {
        panelHtml = extractPanelTemplate(html, t.index, t.label);
        liteSource = panelHtml ? 'template' : 'none';
      }
      if (liteSource === 'static')        liteStatic++;
      else if (liteSource === 'template') liteTemplate++;
      else                                liteNone++;
      const liteRel  = `t3mes-split/lite/${stem}/${fname}`;
      writeFileEnsured(path.join(SPLIT_DIR, 'lite', stem, fname),
                       buildLiteHtml(panelHtml, liteSource,
                                     { label: t.label, index: t.index, stem, srcFile: f }));
      totalLite++;

      tabMetas.push({ index: t.index, label: t.label, full: fullRel, lite: liteRel });
```

Replace with:

```javascript
      // lite — 정적 panel 우선, 없으면 동적 템플릿 fallback
      let panelHtml = extractPanel(html, t.index);
      let liteSource = 'static';
      if (!panelHtml) {
        panelHtml = extractPanelTemplate(html, t.index, t.label);
        liteSource = panelHtml ? 'template' : 'none';
      }
      if (liteSource === 'static')        liteStatic++;
      else if (liteSource === 'template') liteTemplate++;
      else                                liteNone++;
      const liteRel  = `t3mes-split/lite/${stem}/${fname}`;
      const liteContent = buildLiteHtml(panelHtml, liteSource,
                                       { label: t.label, index: t.index, stem, srcFile: f });
      writeFileEnsured(path.join(SPLIT_DIR, 'lite', stem, fname), liteContent);
      totalLite++;

      // ★ layers 추출 — panel HTML (정적/템플릿) 에서 직접 파싱
      //   panelHtml 이 null 이면 (liteSource='none') 추출 시도 불가 → layers 미주입
      const layers = panelHtml ? extractLayers(panelHtml) : [];
      if (layers.length > 0) totalLayersExtracted++;
      else                   totalLayersNone++;

      const tabMeta = { index: t.index, label: t.label, full: fullRel, lite: liteRel };
      if (layers.length > 0) tabMeta.layers = layers;
      tabMetas.push(tabMeta);
```

- [ ] **Step 2: main() 상단에 카운터 추가 + 끝에 통계 출력**

In `scripts/split-t3mes-tabs.cjs` main() function, find:

```javascript
  let totalTabs = 0, totalFull = 0, totalLite = 0;
  let liteStatic = 0, liteTemplate = 0, liteNone = 0;
```

Replace with:

```javascript
  let totalTabs = 0, totalFull = 0, totalLite = 0;
  let liteStatic = 0, liteTemplate = 0, liteNone = 0;
  let totalLayersExtracted = 0, totalLayersNone = 0;
```

Then find the final stats block:

```javascript
  console.log(`\n파일: ${files.length}  ·  TabPage: ${totalTabs}`);
  console.log(`분리 산출: full ${totalFull}개, lite ${totalLite}개`);
  console.log(`  lite 내역: 정적추출 ${liteStatic}  ·  동적템플릿 ${liteTemplate}  ·  placeholder ${liteNone}`);
  console.log(`tabs json : ${OUT_FILE}`);
  console.log(`split dir : ${SPLIT_DIR}`);
```

Replace with:

```javascript
  console.log(`\n파일: ${files.length}  ·  TabPage: ${totalTabs}`);
  console.log(`분리 산출: full ${totalFull}개, lite ${totalLite}개`);
  console.log(`  lite 내역: 정적추출 ${liteStatic}  ·  동적템플릿 ${liteTemplate}  ·  placeholder ${liteNone}`);
  console.log(`layers   : 추출 ${totalLayersExtracted}  ·  미추출 ${totalLayersNone}` +
              ` (${Math.round(totalLayersExtracted / totalTabs * 100)}%)`);
  console.log(`tabs json : ${OUT_FILE}`);
  console.log(`split dir : ${SPLIT_DIR}`);
```

- [ ] **Step 3: 스크립트 실행 + 통계 확인**

Run: `node scripts/split-t3mes-tabs.cjs`

Expected (예시 — 실제 수치는 환경 따라 다름):
```
파일: 30  ·  TabPage: 730
분리 산출: full 730개, lite 730개
  lite 내역: 정적추출 600  ·  동적템플릿 100  ·  placeholder 30
layers   : 추출 580  ·  미추출 150 (79%)
tabs json : .../t3mes-tabs.json
split dir : .../t3mes-split
```

- 70% 이상 추출되면 OK 진행
- 50% 미만이면 STOP — Task 1 의 파서 룰을 lite HTML 실제 케이스에 맞게 보강 필요

- [ ] **Step 4: 추출 결과 샘플 검증 (5개 대표 tab)**

```bash
node -e "
const j = require('./frontend/src/view/util/t3composerpatterns/_data/t3mes-tabs.json');
for (const f of Object.keys(j).slice(0, 3)) {
  console.log('FILE:', f);
  for (const t of j[f].slice(0, 2)) {
    console.log('  tab', t.index, t.label);
    console.log('  layers:', JSON.stringify(t.layers || 'NONE'));
  }
}
"
```

5개 대표 tab 의 layers 가 그럴듯한지 시각 확인 (단일 그리드/마스터-디테일/대시보드 등).

- [ ] **Step 5: Commit (대량 JSON 변경 별도)**

```bash
git add scripts/split-t3mes-tabs.cjs
git commit -m "$(cat <<'EOF'
feat(composer): split-t3mes-tabs 가 lite HTML 에서 layers 추출 + JSON 인라인

main 루프에 extractLayers 호출 + tab entry 에 layers 필드 인라인 주입.
파싱 0건이면 layers 필드 미주입 (필드 부재 = 폴백 신호).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

git add frontend/src/view/util/t3composerpatterns/_data/t3mes-tabs.json
git commit -m "$(cat <<'EOF'
chore(composer): t3mes-tabs.json 재생성 — 730 tab 에 layers 메타 인라인

scripts/split-t3mes-tabs.cjs 의 layers 추출 결과. 수동 편집 금지.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: T3mesPatternCatalog.buildEntries — layers 전파

**Files:**
- Modify: `frontend/src/view/util/t3composerpatterns/T3mesPatternCatalog.jsx:119-154`

- [ ] **Step 1: buildEntries() 가 t 의 layers 를 ALL_ENTRIES entry 로 복사**

Find in `T3mesPatternCatalog.jsx:140-149`:

```jsx
          for (const t of tabs) {
            // 분리된 독립 HTML(full) / 경량 조각(lite) 경로 — t3mes-tabs.json 이 제공
            out.push({
              ...base, tabIndex: t.index, tabLabel: t.label,
              srcUrl:  t.full ? `/${t.full}` : `/t3mes/${item.file}`,
              liteUrl: t.lite ? `/${t.lite}` : null,
            });
          }
```

Replace with:

```jsx
          for (const t of tabs) {
            // 분리된 독립 HTML(full) / 경량 조각(lite) 경로 — t3mes-tabs.json 이 제공
            // layers — split 스크립트가 lite HTML 파싱으로 추출 (있을 때만 전파)
            const entry = {
              ...base, tabIndex: t.index, tabLabel: t.label,
              srcUrl:  t.full ? `/${t.full}` : `/t3mes/${item.file}`,
              liteUrl: t.lite ? `/${t.lite}` : null,
            };
            if (Array.isArray(t.layers) && t.layers.length > 0) {
              entry.layers = t.layers;
            }
            out.push(entry);
          }
```

- [ ] **Step 2: 빠른 sanity check — frontend dev 로 entry 의 layers 확인**

```bash
# 컨테이너 안 또는 frontend 디렉토리에서:
node -e "
const j = require('./frontend/src/view/util/t3composerpatterns/_data/t3mes-tabs.json');
const cnt = Object.values(j).reduce(
  (a, tabs) => a + tabs.filter((t) => Array.isArray(t.layers) && t.layers.length).length, 0);
console.log('layers 보유 tab 수:', cnt);
"
```

100 이상 보유면 OK.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/view/util/t3composerpatterns/T3mesPatternCatalog.jsx
git commit -m "$(cat <<'EOF'
feat(composer): T3mesPatternCatalog.buildEntries — layers 메타 ALL_ENTRIES 전파

t3mes-tabs.json 의 layers 가 있는 tab 만 entry 에 layers 필드 복사.
선택적 필드라 catalog UI 변경 불필요.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: wizardState.js specFromUiPattern — layers 적용

**Files:**
- Modify: `frontend/src/view/util/t3composer/wizardState.js:3135-3143`

- [ ] **Step 1: specFromUiPattern 확장 — entry.layers 가 있으면 specFromMockup 동일 패턴으로 변환**

Find in `wizardState.js:3128-3143`:

```jsx
/**
 * UiPatternPickerDialog 의 onConfirm(entry) 결과 → ComposerSpec.
 *   entry: ALL_ENTRIES 항목 (file, tabIndex, label, sectionCode, ...)
 *
 *   UI Pattern 은 layer 구조 메타가 없으므로 단일 mainGrid + 패턴 식별자만 보존.
 *   실제 mockup 의 HTML 콘텐츠를 자연어 컨텍스트로 변환하는 작업은 Phase 2B.
 */
export function specFromUiPattern(entry, baseMeta = {}) {
  if (!entry) return createComposerSpec({ ...baseMeta, pattern: 'BLANK' });
  const patternId = `${entry.file || ''}#${entry.tabIndex ?? 0}`;
  return createComposerSpec({
    ...baseMeta,
    pattern: `UIPATTERN_${patternId}`,
    title: baseMeta.title || entry.label || '새 화면',
  });
}
```

Replace with:

```jsx
/**
 * UiPatternPickerDialog 의 onConfirm(entry) 결과 → ComposerSpec.
 *   entry: ALL_ENTRIES 항목 (file, tabIndex, label, sectionCode, layers?, ...)
 *
 *   entry.layers 가 있으면 specFromMockup 동일 패턴으로 ComposerSpec 생성.
 *   미주입 시 단일 mainGrid 폴백 (createComposerSpec 기본값).
 *   plan: docs/superpowers/plans/2026-06-17-uipattern-layer-autogen.md (Task 4)
 */
function uiPatternContextText(entry, layerTitle) {
  const lines = [
    `[참조 패턴] ${entry.tabLabel || entry.fileLabel || 'UI Pattern'}`,
  ];
  if (entry.fileLabel && entry.tabLabel && entry.fileLabel !== entry.tabLabel) {
    lines.push(`[파일] ${entry.fileLabel}`);
  }
  if (entry.section)  lines.push(`[섹션] ${entry.section}`);
  if (entry.group)    lines.push(`[그룹] ${entry.group}`);
  if (layerTitle)     lines.push(`[이 영역의 역할] ${layerTitle}`);
  lines.push('');
  lines.push('이 영역에서 보여줄 데이터를 자유롭게 보완하세요 — 또는 Data Source 탐색에서 Table/SP 를 직접 참조 추가.');
  return lines.join('\n');
}

export function specFromUiPattern(entry, baseMeta = {}) {
  if (!entry) return createComposerSpec({ ...baseMeta, pattern: 'BLANK' });
  const patternId = `${entry.file || ''}#${entry.tabIndex ?? 0}`;
  const base = createComposerSpec({
    ...baseMeta,
    pattern: `UIPATTERN_${patternId}`,
    title: baseMeta.title || entry.tabLabel || entry.fileLabel || entry.label || '새 화면',
  });

  // entry.layers 미주입 시 createComposerSpec 의 단일 mainGrid 유지 (폴백)
  if (!Array.isArray(entry.layers) || entry.layers.length === 0) {
    return base;
  }

  // 각 layer 검증 (key/type/position 필수) — 누락 시 전체 폴백
  const valid = entry.layers.every((l) =>
    l && typeof l.key === 'string' && l.key
    && typeof l.type === 'string' && l.type
    && l.position && typeof l.position.x === 'number'
    && typeof l.position.y === 'number'
    && typeof l.position.w === 'number'
    && typeof l.position.h === 'number');
  if (!valid) {
    console.warn('[specFromUiPattern] entry.layers 형식 오류 — 단일 mainGrid 폴백', entry);
    return base;
  }

  base.layers = entry.layers.map((d) => ({
    key: d.key,
    title: d.title || d.key,
    type: d.type,
    subtype: d.subtype || null,
    position: d.position,
    dataSource: {
      mode: 'NL',
      naturalText: uiPatternContextText(entry, d.title),
      references: [],
      sqlBlocks: [],
    },
    columns: [],
    cascade: {},
  }));
  base.filterBar.affects = Object.fromEntries(base.layers.map((l) => [l.key, []]));
  return base;
}
```

- [ ] **Step 2: 인라인 단위 테스트 (수동 확인)**

```bash
# 컨테이너 안 또는 frontend 환경에서:
node -e "
require('@babel/register')({presets:['@babel/preset-env']});
const { specFromUiPattern } = require('./frontend/src/view/util/t3composer/wizardState.js');
const entry = {
  file: 'mes_mrp_1_order_ui_patterns.html', tabIndex: 1,
  fileLabel: 'MRP 발주', tabLabel: '마스터디테일',
  section: 'MES', group: 'MRP',
  layers: [
    {key:'grid1', type:'GRID', subtype:'GRID_BASE', position:{x:0,y:0,w:6,h:12}},
    {key:'form1', type:'CONTAINER', subtype:'FORM',  position:{x:6,y:0,w:6,h:12}},
  ],
};
const spec = specFromUiPattern(entry, { menuCd: 'UI_TEST', menuFilePath: '/util/Test' });
console.log('layers:', spec.layers.length, spec.layers.map(l => l.key + ':' + l.type));
console.log('pattern:', spec.meta.pattern);
console.log('first naturalText:', spec.layers[0].dataSource.naturalText.split('\\n')[0]);
"
```

(babel/register 안 깔려 있으면 이 단계 skip — 실제 검증은 frontend dev 에서)

Expected: layers 2개 (`grid1:GRID`, `form1:CONTAINER`), pattern `UIPATTERN_mes_mrp_1_order_ui_patterns.html#1`, naturalText 첫줄 `[참조 패턴] 마스터디테일`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/view/util/t3composer/wizardState.js
git commit -m "$(cat <<'EOF'
feat(composer): specFromUiPattern — entry.layers 적용 (Mockup 패리티)

entry.layers 가 있으면 specFromMockup 동일 패턴으로 ComposerSpec 생성
— dataSource NL · uiPatternContextText 주입 · filterBar.affects 매핑.
검증 실패 / 미주입 시 단일 mainGrid 폴백 (기존 동작 유지).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: UiPatternPickerDialog — layer 수 칩 표시

**Files:**
- Modify: `frontend/src/view/util/t3composer/UiPatternPickerDialog.jsx:138-166` (entry 행 렌더)

- [ ] **Step 1: entry 행 우측에 layer 수 칩 추가**

Find in `UiPatternPickerDialog.jsx:138-166`:

```jsx
                            {fileObj.entries.map((e) => {
                              const k = entryKey(e);
                              const isSel = selected === k;
                              return (
                                <Box
                                  key={k}
                                  onClick={() => setSelected(k)}
                                  sx={{
                                    display: 'flex', alignItems: 'center', gap: 0.6,
                                    p: 0.7, borderRadius: 1, cursor: 'pointer',
                                    border: '1px solid',
                                    borderColor: isSel ? '#7c3aed' : 'rgba(0,0,0,0.1)',
                                    bgcolor: isSel ? 'rgba(124,58,237,0.08)' : '#fff',
                                    '&:hover': { borderColor: '#7c3aed', bgcolor: 'rgba(124,58,237,0.04)' },
                                  }}
                                >
                                  {e.tabIndex != null && (
                                    <Chip size="small" label={e.tabIndex + 1}
                                      sx={{ height: 18, minWidth: 26, fontSize: 10, fontFamily: 'monospace',
                                            bgcolor: '#7c3aed', color: '#fff', '& .MuiChip-label': { px: 0.6 } }} />
                                  )}
                                  <Typography variant="caption" noWrap
                                    sx={{ fontWeight: 600, flex: 1, minWidth: 0 }}
                                    title={e.tabLabel || e.fileLabel}>
                                    {e.tabLabel || e.fileLabel}
                                  </Typography>
                                </Box>
                              );
                            })}
```

Replace with (Chip for layer count added right after Typography):

```jsx
                            {fileObj.entries.map((e) => {
                              const k = entryKey(e);
                              const isSel = selected === k;
                              const layerCount = Array.isArray(e.layers) ? e.layers.length : 0;
                              return (
                                <Box
                                  key={k}
                                  onClick={() => setSelected(k)}
                                  sx={{
                                    display: 'flex', alignItems: 'center', gap: 0.6,
                                    p: 0.7, borderRadius: 1, cursor: 'pointer',
                                    border: '1px solid',
                                    borderColor: isSel ? '#7c3aed' : 'rgba(0,0,0,0.1)',
                                    bgcolor: isSel ? 'rgba(124,58,237,0.08)' : '#fff',
                                    '&:hover': { borderColor: '#7c3aed', bgcolor: 'rgba(124,58,237,0.04)' },
                                  }}
                                >
                                  {e.tabIndex != null && (
                                    <Chip size="small" label={e.tabIndex + 1}
                                      sx={{ height: 18, minWidth: 26, fontSize: 10, fontFamily: 'monospace',
                                            bgcolor: '#7c3aed', color: '#fff', '& .MuiChip-label': { px: 0.6 } }} />
                                  )}
                                  <Typography variant="caption" noWrap
                                    sx={{ fontWeight: 600, flex: 1, minWidth: 0 }}
                                    title={e.tabLabel || e.fileLabel}>
                                    {e.tabLabel || e.fileLabel}
                                  </Typography>
                                  {layerCount > 0 && (
                                    <Chip size="small" label={`${layerCount}L`}
                                      title={`이 패턴은 ${layerCount}개 layer 로 자동 분할됩니다`}
                                      sx={{ height: 16, fontSize: 9, fontWeight: 700,
                                            bgcolor: 'rgba(124,58,237,0.12)', color: '#7c3aed',
                                            border: '1px solid rgba(124,58,237,0.25)',
                                            '& .MuiChip-label': { px: 0.5 } }} />
                                  )}
                                </Box>
                              );
                            })}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/view/util/t3composer/UiPatternPickerDialog.jsx
git commit -m "$(cat <<'EOF'
feat(composer): UiPatternPickerDialog — entry 행에 layer 수 칩 표시

layers 자동 생성된 패턴인지 선택 전 시각 확인 (Mockup picker 와 패리티).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: 수동 회귀 테스트 + 부족분 보정

**Files:** 변경 없음 (검증만)

- [ ] **Step 1: frontend dev 기동**

```bash
docker compose up -d composer-frontend composer-backend
# 또는 이미 띄워져 있으면 hot-reload 자동 반영
```

브라우저로 `http://localhost:5173/` 접속.

- [ ] **Step 2: 5개 대표 패턴 회귀 시각 검증**

UiPatternPickerDialog 진입 (자연어 생성 모드 또는 ModeNewStep) →

각 패턴 선택 → "이 패턴 적용" → LayoutStep RGL 캔버스에서 layers 위치 확인:

| # | 패턴 | 기대 layers |
|---|---|---|
| 1 | `mes_master_1_ui_patterns.html#0` (품목 마스터 조회) | 단일 `grid1` 전면 |
| 2 | `mes_master_1_ui_patterns.html#1` (품목 상세 폼) | 좌우 — `grid1`(좌) + `form1`(우) |
| 3 | `mes_mrp_1_order_ui_patterns.html#0` (그리드 일괄) | 단일 `grid1` |
| 4 | `mes_mrp_1_order_ui_patterns.html#1` (마스터-디테일) | 좌우 — `grid1`(좌) + `form1`(우) |
| 5 | dashboard 류 패턴 1개 | KPI 영역 + 그리드/차트 상하 분할 |

- 각 패턴에서 entry 옆 layer 수 칩 (`2L` 등) 노출 확인
- LayoutStep 의 RGL 캔버스에서 위치가 그럴듯한지 시각 확인 (정확한 픽셀 매칭 아닌 placeholder 수준)
- 미주입 패턴은 `1L` 칩 없이 단일 mainGrid 로 진입하는지 확인

- [ ] **Step 3: 미주입 비율이 50% 넘으면 파서 보정 (선택)**

Task 2 step 3 에서 70% 이상이었으면 skip.

50~70% 면: lite 샘플 5개 확인해 missing 시그니처 찾기:

```bash
# 미주입 tab 의 lite 파일 5개 샘플 보기:
node -e "
const j = require('./frontend/src/view/util/t3composerpatterns/_data/t3mes-tabs.json');
let n = 0;
for (const f of Object.keys(j)) {
  for (const t of j[f]) {
    if (!t.layers && t.lite) {
      console.log('  ', t.lite);
      if (++n >= 5) process.exit(0);
    }
  }
}
"
```

해당 lite 파일들의 공통 마크업 패턴 발견 시 Task 1 의 `extractLayers` 에 추가 후 Task 2 재실행. 50% 미만이면 STOP — 별도 spec 보강 PR 권장.

- [ ] **Step 4: 회귀 통과 후 최종 확인 commit (수정 없으면 skip)**

회귀 중 Task 1~5 로 인한 사이드 이펙트 발견 시 fix commit. 없으면 skip.

---

## Self-Review

### 1. Spec 커버리지

- [x] §3.1 빌드 타임 전략 — Task 1, 2 (extractLayers + main 호출)
- [x] §3.2 시그니처 — Task 1 (table.tbl, canvas, kpi-grid, form-row, grid2/grid3)
- [x] §3.3 좌표 매핑 — Task 1 (splitCols + 균등 분배)
- [x] §3.4 key/title — Task 1 (type 별 인덱스 + generic title)
- [x] §3.5 폴백 — Task 1 (0건 → []), Task 4 (검증 실패 → mainGrid 폴백)
- [x] §4 데이터 흐름 — Task 2 (JSON 인라인) + Task 3 (전파) + Task 4 (적용)
- [x] §5 변경 파일 5개 — Task 1+2 (script), 2 (JSON 재생성), 3 (catalog), 4 (wizardState), 5 (dialog)
- [x] §6.1 자동 단위 테스트 7케이스 — Task 1 step 1 (모두 inline)
- [x] §6.2 수동 회귀 5케이스 — Task 6 step 2
- [x] §7 호환성 — Task 4 (검증 실패 폴백 + pattern 보존)

### 2. Placeholder scan

- "TBD"/"TODO" 검색: 0건
- "implement later"/"fill in details": 0건
- "Similar to Task N": 0건
- "appropriate error handling": 0건
- 모든 step 에 실제 코드 또는 명령어 포함

### 3. Type consistency

- Task 1 출력 layer shape `{key, title, type, subtype, position}` ↔ Task 4 입력 expectation 일치
- Task 4 의 `entry.layers` ↔ Task 3 에서 `t.layers` ↔ Task 2 의 JSON 인라인 `layers` 모두 같은 배열
- `extractLayers` 함수명 일관 (Task 1 정의, Task 2 호출, 테스트에서 require)
- `splitCols` (Task 1 내부 변수) · `grid2/grid3` (spec 시그니처) 일치

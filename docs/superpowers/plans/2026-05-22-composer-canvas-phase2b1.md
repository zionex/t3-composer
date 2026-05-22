# Composer Canvas (Phase 2B-1 — Mockup 파싱 보강) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase 2A 의 `LAYOUT_CATEGORY_TO_LAYERS` 가 7개 카테고리만 다루고 실제 `MOCKUP_ENTRIES` 의 11개 카테고리 중 5개 (DASHBOARD/WIDGET/PLANEDIT/MONITORING/ROUTELAYOUT) 를 미커버하던 한계를 보완하고, `specFromMockup` 이 entry 의 `patternLabel`·`description` 을 layer.dataSource.naturalText 에 자동 prefill 해 Claude 가 패턴 의도를 자연어 컨텍스트로 활용할 수 있게 한다.

**Architecture:** wizardState.js 의 `LAYOUT_CATEGORY_TO_LAYERS` 매핑을 실제 사용 카테고리 기준으로 확장하고 (DASHBOARD/WIDGET/PLANEDIT/MONITORING/ROUTELAYOUT 신규 + V4/V5/H4/H5 미래 대비), `specFromMockup` 함수가 entry 의 메타 (patternLabel, description, category) 를 모든 생성된 layer 의 naturalText 에 자동 주입한다. 추상 카테고리(SUBCOMPONENT/POPUP/BASE) 는 SINGLE 로 폴백하되 console.warn.

**Tech Stack:** React 18 + wizardState.js 순수 함수. 테스트 환경 없음 — webpack 빌드 + dev server 시각 검증.

**Spec:** `docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md`
**전제:** Phase 2A (commit 3303dbc) 까지 머지된 상태.

**Dev 환경**: composer-frontend 컨테이너 자동 hot-reload (port 5173). 로그: `docker compose logs --tail=50 composer-frontend`.

---

## File Structure

| 파일 | 변경 종류 | 책임 |
|---|---|---|
| `frontend/src/view/util/t3composer/wizardState.js` | **함수 확장** | `LAYOUT_CATEGORY_TO_LAYERS` 에 5개 카테고리 추가 (DASHBOARD/WIDGET/PLANEDIT/MONITORING/ROUTELAYOUT) + V4/V5/H4/H5 미래 대비. `specFromMockup` 에 patternLabel/description prefill 로직 |

**기존 활용:**
- `MOCKUP_ENTRIES[i].patternLabel` (예: "P02 — 검색 + 그리드"), `description` (예: "가장 흔한 마스터 CRUD"), `category` (core/domain/dashboard/...)
- `LAYER_TYPES` (GRID/CHART/CONTAINER/DOCUMENT/AI)
- 7개 기존 카테고리 (SINGLE/V2/V3/H2/H3/MIXED/CONTROLBOARD) — 유지

**실제 MOCKUP_ENTRIES 카테고리 분포 (54건):**

| category | 사용 mockup 수 | 신규/기존 |
|---|---|---|
| LAYOUT_DASHBOARD | 16 | **신규** |
| LAYOUT_SINGLE | 12 | 기존 |
| LAYOUT_CONTROLBOARD | 7 | 기존 |
| WIDGET | 5 | **신규** |
| LAYOUT_PLANEDIT | 4 | **신규** |
| LAYOUT_MONITORING | 3 | **신규** |
| SUBCOMPONENT | 1 | 폴백 |
| POPUP | 1 | 폴백 |
| BASE | 1 | 폴백 |
| LAYOUT_ROUTELAYOUT | 1 | **신규** |
| LAYOUT_MIXED | 1 | 기존 |

---

## Task 1: LAYOUT_CATEGORY_TO_LAYERS 확장 (5개 신규 + 4개 미래 대비)

**Files:**
- Modify: `frontend/src/view/util/t3composer/wizardState.js`

**배경:** Phase 2A 의 매핑은 7개 카테고리 (SINGLE/V2/V3/H2/H3/MIXED/CONTROLBOARD) 만 커버. 실제 MOCKUP_ENTRIES 의 LAYOUT_DASHBOARD (16건, 최다) / WIDGET (5) / PLANEDIT (4) / MONITORING (3) / ROUTELAYOUT (1) 가 미매칭 → SINGLE 폴백. 추상 카테고리(SUBCOMPONENT/POPUP/BASE) 는 layer 가 무의미하므로 SINGLE 폴백 + warn.

- [ ] **Step 1: 기존 `LAYOUT_CATEGORY_TO_LAYERS` 객체 위치 확인**

```bash
grep -n "^export const LAYOUT_CATEGORY_TO_LAYERS" frontend/src/view/util/t3composer/wizardState.js
```

Expected: 한 라인 매칭.

- [ ] **Step 2: `LAYOUT_CONTROLBOARD` 항목 바로 아래에 신규 5개 + 미래 4개 추가**

기존:
```js
  LAYOUT_CONTROLBOARD: () => [
    { key: 'kpiRow',    title: 'KPI 행',     type: LAYER_TYPES.CHART,
      subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 12, h: 3 } },
    { key: 'chartRow',  title: '차트',       type: LAYER_TYPES.CHART,
      subtype: 'CHART_BAR', position: { x: 0, y: 3, w: 12, h: 5 } },
    { key: 'detailRow', title: '상세 그리드', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 8, w: 12, h: 4 } },
  ],
};
```

→ 다음으로 교체 (마지막 `};` 직전에 9개 항목 삽입):

```js
  LAYOUT_CONTROLBOARD: () => [
    { key: 'kpiRow',    title: 'KPI 행',     type: LAYER_TYPES.CHART,
      subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 12, h: 3 } },
    { key: 'chartRow',  title: '차트',       type: LAYER_TYPES.CHART,
      subtype: 'CHART_BAR', position: { x: 0, y: 3, w: 12, h: 5 } },
    { key: 'detailRow', title: '상세 그리드', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 8, w: 12, h: 4 } },
  ],

  // ─── Phase 2B-1 신규: 실제 사용 카테고리 5종 ───

  /** DASHBOARD (16건, 최다) — KPI 카드 행 + 다중 위젯 격자 (2x3 widget grid) */
  LAYOUT_DASHBOARD: () => [
    { key: 'kpiRow',    title: 'KPI 행',     type: LAYER_TYPES.CHART,
      subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 12, h: 3 } },
    { key: 'widgetTL',  title: '위젯 좌상', type: LAYER_TYPES.CHART,
      subtype: 'CHART_BAR', position: { x: 0, y: 3, w: 6,  h: 4 } },
    { key: 'widgetTR',  title: '위젯 우상', type: LAYER_TYPES.CHART,
      subtype: 'CHART_LINE',position: { x: 6, y: 3, w: 6,  h: 4 } },
    { key: 'widgetBL',  title: '위젯 좌하', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 7, w: 6,  h: 5 } },
    { key: 'widgetBR',  title: '위젯 우하', type: LAYER_TYPES.CHART,
      subtype: 'CHART_DONUT', position: { x: 6, y: 7, w: 6, h: 5 } },
  ],

  /** WIDGET (5건) — 다른 화면에 임베드되는 단일 위젯 (mainWidget 1개) */
  WIDGET: () => [
    { key: 'mainWidget', title: '메인 위젯', type: LAYER_TYPES.CHART,
      subtype: 'CHART_BAR', position: { x: 0, y: 0, w: 12, h: 12 } },
  ],

  /** PLANEDIT (4건) — 검색 영역 + 크로스탭 피벗 그리드 (계획 보정) */
  LAYOUT_PLANEDIT: () => [
    { key: 'pivotGrid', title: '피벗 그리드', type: LAYER_TYPES.GRID,
      subtype: 'GRID_CROSSTAB', position: { x: 0, y: 0, w: 12, h: 12 } },
  ],

  /** MONITORING (3건) — KPI 행 + 실시간 차트 + 알람 그리드 */
  LAYOUT_MONITORING: () => [
    { key: 'kpiRow',    title: 'KPI 행',     type: LAYER_TYPES.CHART,
      subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 12, h: 3 } },
    { key: 'liveChart', title: '실시간 차트', type: LAYER_TYPES.CHART,
      subtype: 'CHART_LINE', position: { x: 0, y: 3, w: 8, h: 6 } },
    { key: 'alertList', title: '알람',       type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 8, y: 3, w: 4, h: 6 } },
    { key: 'eventLog',  title: '이벤트 로그', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 9, w: 12, h: 3 } },
  ],

  /** ROUTELAYOUT (1건) — 공정 라우트 다이어그램 단일 */
  LAYOUT_ROUTELAYOUT: () => [
    { key: 'routeDiagram', title: '공정 라우트', type: LAYER_TYPES.CHART,
      subtype: 'DIAGRAM_FLO', position: { x: 0, y: 0, w: 12, h: 12 } },
  ],

  // ─── Phase 2B-1 신규: 다른 Target (PlaNEL/LGES_NEXTSCM) mockup 추가 대비 ───

  /** V4 — 수직 4분할 */
  LAYOUT_V4: () => [
    { key: 'panel1', title: '1단', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 3 } },
    { key: 'panel2', title: '2단', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 3, w: 12, h: 3 } },
    { key: 'panel3', title: '3단', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 6, w: 12, h: 3 } },
    { key: 'panel4', title: '4단', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 9, w: 12, h: 3 } },
  ],

  /** V5 — 수직 5단 (단당 더 얇음) */
  LAYOUT_V5: () => [
    { key: 'panel1', title: '1단', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 0,  w: 12, h: 3 } },
    { key: 'panel2', title: '2단', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 3,  w: 12, h: 2 } },
    { key: 'panel3', title: '3단', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 5,  w: 12, h: 2 } },
    { key: 'panel4', title: '4단', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 7,  w: 12, h: 2 } },
    { key: 'panel5', title: '5단', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 9,  w: 12, h: 3 } },
  ],

  /** H4 — 수평 4분할 */
  LAYOUT_H4: () => [
    { key: 'panel1', title: '1열', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 3, h: 12 } },
    { key: 'panel2', title: '2열', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 3, y: 0, w: 3, h: 12 } },
    { key: 'panel3', title: '3열', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 6, y: 0, w: 3, h: 12 } },
    { key: 'panel4', title: '4열', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 9, y: 0, w: 3, h: 12 } },
  ],

  /** H5 — 수평 5열 (열당 더 좁음) */
  LAYOUT_H5: () => [
    { key: 'panel1', title: '1열', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0,  y: 0, w: 2, h: 12 } },
    { key: 'panel2', title: '2열', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 2,  y: 0, w: 2, h: 12 } },
    { key: 'panel3', title: '3열', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 4,  y: 0, w: 2, h: 12 } },
    { key: 'panel4', title: '4열', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 6,  y: 0, w: 3, h: 12 } },
    { key: 'panel5', title: '5열', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 9,  y: 0, w: 3, h: 12 } },
  ],
};
```

- [ ] **Step 3: `layersForLayoutCategory` 폴백에 console.warn 추가**

기존:
```js
export function layersForLayoutCategory(layoutCategory) {
  const builder = LAYOUT_CATEGORY_TO_LAYERS[layoutCategory];
  return builder ? builder() : LAYOUT_CATEGORY_TO_LAYERS.LAYOUT_SINGLE();
}
```

→ 다음으로 교체:
```js
/** layoutCategory 미매칭 시 SINGLE 폴백. 추상 카테고리(SUBCOMPONENT/POPUP/BASE) 도 SINGLE.
 *  미정의 카테고리는 console.warn 으로 알림 (신규 mockup 추가 시 매핑 보강 시그널). */
const ABSTRACT_CATEGORIES = new Set(['SUBCOMPONENT', 'POPUP', 'BASE']);

export function layersForLayoutCategory(layoutCategory) {
  const builder = LAYOUT_CATEGORY_TO_LAYERS[layoutCategory];
  if (builder) return builder();
  if (!ABSTRACT_CATEGORIES.has(layoutCategory)) {
    // 추상이 아닌데 매핑 없음 → 매핑 보강 신호
    // eslint-disable-next-line no-console
    console.warn(`[ComposerSpec] LAYOUT_CATEGORY_TO_LAYERS 에 '${layoutCategory}' 매핑 없음 → SINGLE 폴백. LAYOUT_CATEGORY_TO_LAYERS 에 추가 권장.`);
  }
  return LAYOUT_CATEGORY_TO_LAYERS.LAYOUT_SINGLE();
}
```

- [ ] **Step 4: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError" | head -5`
Expected: 0건.

- [ ] **Step 5: commit**

```bash
git add frontend/src/view/util/t3composer/wizardState.js
git commit -m "$(cat <<'EOF'
feat(composer): LAYOUT_CATEGORY_TO_LAYERS 9개 카테고리 추가

[신규 — MOCKUP_ENTRIES 실제 사용]
- LAYOUT_DASHBOARD (16건, 최다) → KPI 행 + 4-위젯 격자 (2x2)
- WIDGET (5건) → 단일 mainWidget
- LAYOUT_PLANEDIT (4건) → 단일 피벗 그리드 (GRID_CROSSTAB)
- LAYOUT_MONITORING (3건) → KPI 행 + 실시간 차트 + 알람 + 로그
- LAYOUT_ROUTELAYOUT (1건) → 공정 라우트 다이어그램 (DIAGRAM_FLO)

[신규 — 미래 대비 (V4/V5/H4/H5)]
다른 Target (PlaNEL/LGES_NEXTSCM) mockup 추가 시 즉시 대응.

[폴백 강화]
- ABSTRACT_CATEGORIES (SUBCOMPONENT/POPUP/BASE) 는 조용히 SINGLE 폴백
- 미정의 카테고리는 console.warn — 신규 mockup 매핑 누락 신호

Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2b1.md (Task 1)
EOF
)"
```

---

## Task 2: specFromMockup — patternLabel + description 을 layer.dataSource.naturalText 에 prefill

**Files:**
- Modify: `frontend/src/view/util/t3composer/wizardState.js` (기존 `specFromMockup` 함수)

**배경:** Phase 2A 의 `specFromMockup` 은 layoutCategory → layer 골격만 만들고 dataSource 는 빈 NL 상태. Claude 가 화면 의도를 파악할 단서가 사라짐. mockup entry 의 `patternLabel` + `description` + `category` 를 layer 의 naturalText 에 자동 prefill 해 사용자가 추가 입력 없이도 Claude 가 패턴 의도 파악 가능.

- [ ] **Step 1: 기존 `specFromMockup` 함수 위치 확인**

```bash
grep -n "^export function specFromMockup" frontend/src/view/util/t3composer/wizardState.js
```

Expected: 한 라인 매칭.

- [ ] **Step 2: 함수 본문 교체**

기존:
```js
export function specFromMockup(entry, baseMeta = {}) {
  if (!entry) return createComposerSpec({ ...baseMeta, pattern: 'BLANK' });
  const layersDef = layersForLayoutCategory(entry.layoutCategory);
  const base = createComposerSpec({
    ...baseMeta,
    pattern: `MOCKUP_${entry.patternCode}`,
    title: baseMeta.title || entry.patternLabel || '새 화면',
  });
  base.layers = layersDef.map((d) => ({
    ...d,
    dataSource: { mode: 'NL', naturalText: '', references: [], sqlBlocks: [] },
    columns: [],
    cascade: {},
  }));
  base.filterBar.affects = Object.fromEntries(base.layers.map((l) => [l.key, []]));
  return base;
}
```

→ 다음으로 교체:
```js
/**
 * Mockup entry 의 메타를 layer.dataSource.naturalText 로 변환.
 *   Claude 가 화면 의도를 파악할 단서로 활용.
 *   각 layer 마다 동일한 컨텍스트 문자열이 주입되며, 사용자가 DataMiniDialog 에서
 *   추가/수정 가능.
 */
function mockupContextText(entry, layerTitle) {
  const lines = [
    `[참조 패턴] ${entry.patternLabel || entry.patternCode}`,
  ];
  if (entry.description) lines.push(`[설명] ${entry.description}`);
  if (entry.category)    lines.push(`[카테고리] ${entry.category}`);
  if (layerTitle)        lines.push(`[이 영역의 역할] ${layerTitle}`);
  lines.push('');
  lines.push('이 영역에서 보여줄 데이터를 자유롭게 보완하세요 — 또는 Data Source 탐색에서 Table/SP 를 직접 참조 추가.');
  return lines.join('\n');
}

export function specFromMockup(entry, baseMeta = {}) {
  if (!entry) return createComposerSpec({ ...baseMeta, pattern: 'BLANK' });
  const layersDef = layersForLayoutCategory(entry.layoutCategory);
  const base = createComposerSpec({
    ...baseMeta,
    pattern: `MOCKUP_${entry.patternCode}`,
    title: baseMeta.title || entry.patternLabel || '새 화면',
  });
  base.layers = layersDef.map((d) => ({
    ...d,
    dataSource: {
      mode: 'NL',
      naturalText: mockupContextText(entry, d.title),
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

- [ ] **Step 3: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError" | head -5`
Expected: 0건.

- [ ] **Step 4: 시각 검증 (브라우저)**

`http://localhost:5173` → ModeSelector → "단계별 생성 (Beta)" → "SCM UI Mockup" → 임의 mockup 선택 (예: P02 "search_grid") → [적용] → ComposerCanvas → 메인 그리드 클릭 → DataMiniDialog → **자연어 textarea 에 다음 텍스트가 prefill 되어 있는지** 확인:

```
[참조 패턴] P02 — 검색 + 그리드
[설명] 가장 흔한 마스터 CRUD
[카테고리] core
[이 영역의 역할] 메인

이 영역에서 보여줄 데이터를 자유롭게 보완하세요 — 또는 Data Source 탐색에서 Table/SP 를 직접 참조 추가.
```

다른 mockup 도 확인 (LAYOUT_DASHBOARD: KPI 행 / 위젯 좌상 / 위젯 우상 등 각 layer 마다 다른 `[이 영역의 역할]` 표시).

- [ ] **Step 5: commit**

```bash
git add frontend/src/view/util/t3composer/wizardState.js
git commit -m "$(cat <<'EOF'
feat(composer): specFromMockup — patternLabel/description → naturalText prefill

mockup entry 의 메타 (patternLabel, description, category, layer title) 를
각 layer 의 dataSource.naturalText 에 자동 주입.

prefill 형식:
  [참조 패턴] <patternLabel>
  [설명] <description>
  [카테고리] <category>
  [이 영역의 역할] <layer.title>

  이 영역에서 보여줄 데이터를 자유롭게 보완하세요 — 또는 Data Source
  탐색에서 Table/SP 를 직접 참조 추가.

이로써 Claude 가 화면 의도 (P02 마스터 CRUD vs LAYOUT_DASHBOARD KPI vs ...)
를 자연어 컨텍스트로 파악 가능. 사용자는 DataMiniDialog 에서 수정/보강.

Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2b1.md (Task 2)
EOF
)"
```

---

## Task 3: 통합 smoke + Phase 2B-1 종료 마커

**Files:** (변경 없음, 검증만)

- [ ] **Step 1: 전체 컴파일 healthcheck**

Run: `docker compose logs --tail=200 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError|Failed to compile" | head -10`
Expected: 0건.

- [ ] **Step 2: smoke 시나리오 (8가지 mockup 카테고리 확인)**

브라우저 `http://localhost:5173` → ModeSelector → "단계별 생성 (Beta)" → "SCM UI Mockup":

각 카테고리에서 mockup 1개씩 선택 → ComposerCanvas 의 layer 갯수/이름 확인:

| 선택할 mockup 후보 | 카테고리 | 예상 layer |
|---|---|---|
| `search_grid` 또는 첫 SINGLE | LAYOUT_SINGLE | mainGrid 1개 |
| (DASHBOARD 카테고리 mockup) | LAYOUT_DASHBOARD | kpiRow + widgetTL/TR/BL/BR (5개) |
| (CONTROLBOARD 카테고리) | LAYOUT_CONTROLBOARD | kpiRow + chartRow + detailRow (3개) |
| (WIDGET 카테고리) | WIDGET | mainWidget 1개 |
| (PLANEDIT 카테고리) | LAYOUT_PLANEDIT | pivotGrid 1개 (GRID_CROSSTAB subtype) |
| (MONITORING 카테고리) | LAYOUT_MONITORING | kpiRow + liveChart + alertList + eventLog (4개) |
| (ROUTELAYOUT 카테고리) | LAYOUT_ROUTELAYOUT | routeDiagram 1개 (CHART · DIAGRAM_FLO) |
| (MIXED 카테고리) | LAYOUT_MIXED | leftTop + rightTop(chart) + bottomFull (3개) |

각 케이스에서:
1. layer 갯수 일치 ✓
2. layer 타이틀 일치 ✓
3. layer 클릭 → DataMiniDialog → 자연어 textarea 의 prefill 표시 (`[참조 패턴] ... [이 영역의 역할] ...`) ✓
4. 하단 디버그 JSON 에 `layers[i].dataSource.naturalText` 가 채워져 있음 ✓

- [ ] **Step 3: 미정의 카테고리 console.warn 검증**

브라우저 콘솔(F12) 열고 SUBCOMPONENT/POPUP/BASE 카테고리 mockup 선택 → console 에 warn 없음 (ABSTRACT_CATEGORIES 라 조용히 SINGLE 폴백) ✓

(미래 시나리오: 새 mockup 이 정의되지 않은 카테고리 사용 시 console 에 `[ComposerSpec] LAYOUT_CATEGORY_TO_LAYERS 에 '...' 매핑 없음 → SINGLE 폴백.` warn 표시)

- [ ] **Step 4: 회귀 없음 확인**

다른 모드 (NEW_NL / NEW_FROM_COPY / NEW_FROM_DESIGN / EXISTING_MODIFY) 진입해도 기존 동작 그대로 ✓

- [ ] **Step 5: Phase 2B-1 종료 commit**

```bash
git commit --allow-empty -m "$(cat <<'EOF'
milestone(composer): Phase 2B-1 complete — Mockup 파싱 보강

Phase 2A 의 layoutCategory 매핑 한계 보완:
- LAYOUT_CATEGORY_TO_LAYERS 9개 카테고리 추가 (5개 실제 사용 + 4개 미래 대비)
- specFromMockup 이 mockup 메타 (patternLabel/description/category/layer title)
  를 layer.dataSource.naturalText 에 자동 prefill
- ABSTRACT_CATEGORIES (SUBCOMPONENT/POPUP/BASE) 조용히 SINGLE 폴백
- 미정의 카테고리 console.warn (신규 mockup 매핑 누락 감지)

[검증]
- 54개 MOCKUP_ENTRIES 의 11개 카테고리 중 8개가 자체 layer 구성, 3개(추상)는
  SINGLE 폴백 — 미정의 카테고리 0건
- 각 layer 자연어에 mockup 의도 자동 표시

[다음 단계]
- Phase 2B-2 + 2B-3: 4모드 (NEW_GENERAL/NL/COPY/DESIGN) 결과를 ComposerSpec
  으로 통일 + Backend PrefillFromSourceService 응답 형식 조정 +
  ComposerPromptBuilder mode 가이드 갱신
- Phase 2C: ComposerWorkspace 통합 (산출물 생성 / 메뉴등록 / 화면실행)
- Phase 1.5 (나중): Layer 자유 추가/이동/삭제

Spec: docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md
Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2b1.md
EOF
)"
```

---

## Self-Review

**1. Spec coverage (Phase 2B-1 부분):**

| Spec/사용자 요구 | 구현 task |
|---|---|
| LAYOUT_CATEGORY_TO_LAYERS 확장 (모든 실제 카테고리 매핑) | Task 1 |
| 추상 카테고리 폴백 처리 | Task 1 (Step 3) |
| mockup 의 patternLabel/description 자연어 prefill | Task 2 |
| 미정의 카테고리 감지 (warn) | Task 1 (Step 3) |
| Backend prompt 갱신 | **Phase 2B-3** (별도 plan) |
| 4모드 ComposerSpec 통일 | **Phase 2B-2** |

**2. Placeholder scan:** "TBD" / "implement later" / "fill in details" 패턴 0건. ✓

**3. Type consistency:**
- 추가된 모든 LAYOUT_* 항목이 `LAYER_TYPES.{GRID,CHART}` 만 사용 (wizardState.js 의 LAYER_TYPES 정의와 일치) ✓
- subtype 값 (`GRID_CROSSTAB` / `DIAGRAM_FLO` / `CHART_DONUT` / `CHART_LINE` / `CHART_BAR` / `KPI_CARD`) 모두 Phase 1 의 COMPONENT_CATALOG 5그룹 41개 안 (constants.js) ✓
- `mockupContextText(entry, layerTitle)` 의 반환값 = string → `naturalText` 필드 type 일치 ✓
- `ABSTRACT_CATEGORIES` Set 만 새 추가, 기존 함수 시그니처 변경 없음 ✓

**4. Ambiguity:**
- DASHBOARD 의 위젯 5개 위치는 추정 (실제 mockup 의 의도된 위치와 다를 수 있음) — Phase 2B-1 은 골격만, 정확한 위치는 mockup component 파싱 (별도 plan, Phase 2B-extra) 에서 보강 가능
- console.warn 은 dev 환경에서만 의미. production 빌드에서도 출력되지만 무해.

---

## Execution Choice

**Plan complete and saved to `docs/superpowers/plans/2026-05-22-composer-canvas-phase2b1.md`.** 두 가지 실행 옵션:

**1. Subagent-Driven** — 매 task fresh subagent
**2. Inline Execution (recommended)** — 이 세션에서 직접 (3 task 만이라 가벼움)

어느 쪽으로?

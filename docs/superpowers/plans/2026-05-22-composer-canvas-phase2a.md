# Composer Canvas (Phase 2A — Picker 연결) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase 1 의 ModeNewStep / DataMiniDialog 에 **기존 3개 풀스크린 picker** (`MockupPickerDialog` · `UiPatternPickerDialog` · `DataSourcePickerDialog`) 를 실제 연결해 — 패턴 선택 시 ComposerSpec.layers 자동 prefill, Data 객체 탐색 시 별자리 맵 진입 가능하게 한다.

**Architecture:** 기존 picker 들은 모두 `{ open, onClose, currentValue, onConfirm }` 시그니처. ModeNewStep 의 alert-stub 들을 실제 picker 호출로 교체하고, `onConfirm(entry)` 의 layoutCategory → ComposerSpec.layers 매핑 함수 (`specFromMockup` / `specFromUiPattern`) 를 wizardState.js 에 추가. DataMiniDialog 는 `onOpenDataSourcePicker` prop 을 picker 진입으로 연결.

**Tech Stack:** React 18 + MUI 5 + 기존 picker 컴포넌트 그대로 재활용. 테스트 환경 없음 — webpack 빌드 + dev server 시각 검증.

**Spec:** `docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md`
**전제:** Phase 1 (commit 354b4b2 까지) 머지된 상태에서 시작.

**Dev 환경**: composer-frontend 컨테이너 webpack-dev-server (port 5173) 자동 hot-reload. 로그: `docker compose logs --tail=50 composer-frontend`.

---

## File Structure

| 파일 | 변경 종류 | 책임 |
|---|---|---|
| `frontend/src/view/util/t3composer/wizardState.js` | **export 추가** | `LAYOUT_CATEGORY_TO_LAYERS` 매핑 + `specFromMockup(entry, baseMeta)` + `specFromUiPattern(entry, baseMeta)` 함수 |
| `frontend/src/view/util/t3composer/ModeNewStep.jsx` | **stub 교체** | "SCM UI Mockup" alert-stub → `MockupPickerDialog` 호출. "UI Pattern" alert-stub → `UiPatternPickerDialog` 호출 |
| `frontend/src/view/util/t3composer/ComposerCanvas.jsx` | **prop chain** | `onOpenDataSourcePicker` prop 을 받아 DataMiniDialog 로 전달 (현재는 hardcoded null) |
| `frontend/src/view/util/t3composer/DataMiniDialog.jsx` | **onConfirm 변환** | DataSourcePicker 의 basket[] → references[] 로 변환하는 콜백 추가 (이미 prop 있음) |
| (ModeNewStep.jsx) | DataSourcePicker 진입 연결 | ModeNewStep 에 `<DataSourcePickerDialog>` 인스턴스 추가 + ComposerCanvas 에 prop 전달 |

**기존 picker API (전부 동일 패턴):**
- `MockupPickerDialog({ open, onClose, currentValue, onConfirm })` — `onConfirm(entry|null)`, entry = `MOCKUP_ENTRIES` 항목 (`{patternCode, patternLabel, layoutCategory, category, file, description, ...}`)
- `UiPatternPickerDialog({ open, onClose, currentValue, onConfirm })` — `onConfirm(entry|null)`, entry = `ALL_ENTRIES` 항목 (`{file, tabIndex, label, ...}`)
- `DataSourcePickerDialog({ open, onClose, currentValue, onConfirm, targetCd })` — `onConfirm(basket[])`, basket = `[{kind: 'TABLE'|'SP'|'ONTOLOGY_*'|'INLINE_QUERY', key, label, meta}]`

---

## Task 1: specFromMockup / specFromUiPattern 함수 추가

**Files:**
- Modify: `frontend/src/view/util/t3composer/wizardState.js` (끝부분, 기존 `specFromPattern` 아래)

**배경:** `MOCKUP_ENTRIES[i].layoutCategory` 는 `LAYOUT_SINGLE` / `LAYOUT_V2` / `LAYOUT_H2` / `LAYOUT_MIXED` 등 (rules/40-composer-patterns.md §2.1). 이를 보고 layer 갯수와 RGL position 을 자동 결정한다.

- [ ] **Step 1: 기존 `specFromPattern` 함수 위치 확인**

```bash
grep -n "^export function specFromPattern" frontend/src/view/util/t3composer/wizardState.js
```

Expected: 마지막 export 의 라인 번호 노출.

- [ ] **Step 2: `specFromPattern` 함수 바로 아래에 신규 export 3개 추가**

`frontend/src/view/util/t3composer/wizardState.js` 의 파일 끝에 다음 추가:

```js
// ============================================================================
// Phase 2A — Mockup / UI Pattern picker entry → ComposerSpec 변환
// ============================================================================

/**
 * layoutCategory 코드 → layer 골격 정의.
 *   각 항목: [{ key, title, type, subtype, position:{x,y,w,h} }, ...]
 *   RGL 12-column grid 기준.
 *   상세: .claude/rules/40-composer-patterns.md §2.1
 */
export const LAYOUT_CATEGORY_TO_LAYERS = {
  LAYOUT_SINGLE: () => [
    { key: 'mainGrid', title: '메인', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 12 } },
  ],
  LAYOUT_V2: () => [
    { key: 'topPanel',    title: '상단', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 6 } },
    { key: 'bottomPanel', title: '하단', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 6, w: 12, h: 6 } },
  ],
  LAYOUT_V3: () => [
    { key: 'topPanel',    title: '상단', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 4 } },
    { key: 'midPanel',    title: '중단', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 4, w: 12, h: 4 } },
    { key: 'bottomPanel', title: '하단', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 8, w: 12, h: 4 } },
  ],
  LAYOUT_H2: () => [
    { key: 'leftPanel',  title: '좌측', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 6,  h: 12 } },
    { key: 'rightPanel', title: '우측', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 6, y: 0, w: 6,  h: 12 } },
  ],
  LAYOUT_H3: () => [
    { key: 'leftPanel',  title: '좌',   type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 4,  h: 12 } },
    { key: 'midPanel',   title: '중',   type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 4, y: 0, w: 4,  h: 12 } },
    { key: 'rightPanel', title: '우',   type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 8, y: 0, w: 4,  h: 12 } },
  ],
  LAYOUT_MIXED: () => [
    { key: 'leftTop',     title: '좌상', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 6,  h: 6 } },
    { key: 'rightTop',    title: '우상', type: LAYER_TYPES.CHART,
      subtype: 'CHART_BAR',  position: { x: 6, y: 0, w: 6,  h: 6 } },
    { key: 'bottomFull',  title: '하단', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 6, w: 12, h: 6 } },
  ],
  LAYOUT_CONTROLBOARD: () => [
    { key: 'kpiRow',    title: 'KPI 행',     type: LAYER_TYPES.CHART,
      subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 12, h: 3 } },
    { key: 'chartRow',  title: '차트',       type: LAYER_TYPES.CHART,
      subtype: 'CHART_BAR', position: { x: 0, y: 3, w: 12, h: 5 } },
    { key: 'detailRow', title: '상세 그리드', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 8, w: 12, h: 4 } },
  ],
};

/** layoutCategory 미매칭 시 폴백 — 단일 그리드 */
export function layersForLayoutCategory(layoutCategory) {
  const builder = LAYOUT_CATEGORY_TO_LAYERS[layoutCategory];
  return builder ? builder() : LAYOUT_CATEGORY_TO_LAYERS.LAYOUT_SINGLE();
}

/**
 * MockupPickerDialog 의 onConfirm(entry) 결과 → ComposerSpec.
 *   entry: MOCKUP_ENTRIES 항목 (patternCode, patternLabel, layoutCategory, category, description, ...)
 */
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

/**
 * UiPatternPickerDialog 의 onConfirm(entry) 결과 → ComposerSpec.
 *   entry: ALL_ENTRIES 항목 (file, tabIndex, label, sectionCode, ...)
 *
 *   UI Pattern 은 layer 구조 메타가 없으므로 단일 mainGrid + 패턴 식별자만 보존.
 *   실제 mockup 의 HTML 콘텐츠는 자연어로 변환할 때 Phase 2B 에서 처리.
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

- [ ] **Step 3: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError" | head -5`
Expected: 0건.

- [ ] **Step 4: commit**

```bash
git add frontend/src/view/util/t3composer/wizardState.js
git commit -m "$(cat <<'EOF'
feat(composer): layoutCategory → layers 매핑 + specFromMockup/UiPattern

Phase 2A picker 연결의 기반. MOCKUP_ENTRIES[i].layoutCategory (LAYOUT_SINGLE
/V2/V3/H2/H3/MIXED/CONTROLBOARD) 를 RGL 12-col grid position 으로 매핑.

- LAYOUT_CATEGORY_TO_LAYERS: 7개 카테고리 → layer 골격 정의
- layersForLayoutCategory(): 폴백 포함 (미매칭 시 SINGLE)
- specFromMockup(entry): MockupPicker 결과 → ComposerSpec.layers 자동 prefill
- specFromUiPattern(entry): UiPatternPicker 결과 → BLANK 단일 layer +
  pattern 식별자 보존 (실제 HTML 콘텐츠 변환은 Phase 2B)

Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2a.md (Task 1)
EOF
)"
```

---

## Task 2: ModeNewStep — MockupPickerDialog 연결

**Files:**
- Modify: `frontend/src/view/util/t3composer/ModeNewStep.jsx`

- [ ] **Step 1: import 추가**

기존 import 블록에 추가:

```jsx
import MockupPickerDialog from './MockupPickerDialog';
import { specFromMockup } from './wizardState';
```

(기존 `import { specFromPattern } from './wizardState';` 를 `import { specFromPattern, specFromMockup } from './wizardState';` 로 합치는 게 깔끔.)

- [ ] **Step 2: 컴포넌트 안에 picker state 추가**

`function ModeNewStep({ onBack }) {` 안의 useState 블록에 다음 추가:

```jsx
const [mockupPickerOpen, setMockupPickerOpen] = useState(false);
```

- [ ] **Step 3: SCM UI Mockup 카드의 onClick 교체**

기존:
```jsx
<Paper variant="outlined"
       sx={{ p: 2, cursor: 'pointer', '&:hover': { borderColor: '#3b82f6', bgcolor: '#f8fafc' } }}
       onClick={() => {
         alert('SCM Mockup picker 통합은 Phase 2 — 지금은 BLANK 로 진입합니다.');
         startWithPattern('BLANK');
       }}>
```

→ 다음으로 교체:
```jsx
<Paper variant="outlined"
       sx={{ p: 2, cursor: 'pointer', '&:hover': { borderColor: '#3b82f6', bgcolor: '#f8fafc' } }}
       onClick={() => setMockupPickerOpen(true)}>
```

- [ ] **Step 4: 컴포넌트 return 끝에 MockupPickerDialog 인스턴스 추가**

`return ( ... )` 의 stage === 'PICK' 분기의 마지막 `</Box>` 직전 (또는 외곽 fragment 로 감싸) 다음 추가:

```jsx
<MockupPickerDialog
  open={mockupPickerOpen}
  onClose={() => setMockupPickerOpen(false)}
  currentValue={null}
  onConfirm={(entry) => {
    setMockupPickerOpen(false);
    if (!entry) return;  // 사용자가 '해제' 한 경우
    setSpec(specFromMockup(entry, { title: '새 화면', menuCd: '', pattern: `MOCKUP_${entry.patternCode}` }));
    setStage('CANVAS');
  }}
/>
```

⚠️ `return` 의 최상위가 단일 `<Box>` 라면 두 가지 root 요소가 안 됨 → `<>...</>` Fragment 로 감쌈. 패턴:

```jsx
return (
  <>
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {/* ... 기존 picker UI ... */}
    </Box>
    <MockupPickerDialog ... />
  </>
);
```

- [ ] **Step 5: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError" | head -5`
Expected: 0건.

- [ ] **Step 6: 시각 검증**

브라우저 `http://localhost:5173` → ModeSelector → "단계별 생성 (Beta)" → "SCM UI Mockup (54개)" 카드 클릭 → `MockupPickerDialog` 열림 → 임의 mockup 선택 (예: "P02 — 검색 + 그리드") → [적용] → ComposerCanvas 진입. layer 갯수가 patternCode 의 layoutCategory 와 일치하는지 확인 (P02 = LAYOUT_SINGLE → mainGrid 1개).

다른 layoutCategory 도 확인: `widget_dashboard` (LAYOUT_SINGLE → 1개), `grid_chart_stacked` (LAYOUT_V2 → 2개 상하), 등.

- [ ] **Step 7: commit**

```bash
git add frontend/src/view/util/t3composer/ModeNewStep.jsx
git commit -m "feat(composer): ModeNewStep — SCM Mockup picker 실제 연결

기존 alert-stub 제거. MockupPickerDialog onConfirm(entry) → specFromMockup
으로 layers 자동 prefill → ComposerCanvas 진입.

검증: P02(LAYOUT_SINGLE) → mainGrid 1개, V2 → 상하 2개, H2 → 좌우 2개 등."
```

---

## Task 3: ModeNewStep — UiPatternPickerDialog 연결

**Files:**
- Modify: `frontend/src/view/util/t3composer/ModeNewStep.jsx`

- [ ] **Step 1: import 추가**

```jsx
import UiPatternPickerDialog from './UiPatternPickerDialog';
import { specFromUiPattern } from './wizardState';  // (Task 2 의 specFromMockup import 와 합쳐도 됨)
```

최종 wizardState import 라인:
```jsx
import { specFromPattern, specFromMockup, specFromUiPattern } from './wizardState';
```

- [ ] **Step 2: state 추가**

```jsx
const [uiPatternPickerOpen, setUiPatternPickerOpen] = useState(false);
```

- [ ] **Step 3: UI Pattern 카드의 onClick 교체**

기존 alert-stub 을:
```jsx
onClick={() => setUiPatternPickerOpen(true)}
```
로 교체.

- [ ] **Step 4: Fragment 안 (MockupPickerDialog 옆) 에 UiPatternPickerDialog 추가**

```jsx
<UiPatternPickerDialog
  open={uiPatternPickerOpen}
  onClose={() => setUiPatternPickerOpen(false)}
  currentValue={null}
  onConfirm={(entry) => {
    setUiPatternPickerOpen(false);
    if (!entry) return;
    setSpec(specFromUiPattern(entry, { title: '새 화면', menuCd: '' }));
    setStage('CANVAS');
  }}
/>
```

- [ ] **Step 5: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError" | head -5`
Expected: 0건.

- [ ] **Step 6: 시각 검증**

브라우저 → ModeNewStep → "T3MES UI Pattern (730개)" 클릭 → `UiPatternPickerDialog` 열림 → 임의 패턴 선택 → [적용] → ComposerCanvas 진입. layer 는 mainGrid 1개 (UI Pattern 은 layer 구조 메타 없음), pattern 메타에 `UIPATTERN_<file>#<tabIndex>` 식별자가 저장된 것 디버그 JSON 으로 확인.

- [ ] **Step 7: commit**

```bash
git add frontend/src/view/util/t3composer/ModeNewStep.jsx
git commit -m "feat(composer): ModeNewStep — UI Pattern picker 실제 연결

기존 alert-stub 제거. UiPatternPickerDialog onConfirm(entry) → specFromUiPattern
으로 BLANK 단일 layer + pattern 식별자 보존 → ComposerCanvas 진입.

UI Pattern 의 실제 HTML 콘텐츠를 자연어 컨텍스트로 변환하는 작업은 Phase 2B."
```

---

## Task 4: DataMiniDialog — DataSourcePicker 풀스크린 진입 활성

**Files:**
- Modify: `frontend/src/view/util/t3composer/ComposerCanvas.jsx`
- Modify: `frontend/src/view/util/t3composer/ModeNewStep.jsx`

**배경:** `DataMiniDialog` 는 이미 `onOpenDataSourcePicker` prop 을 받지만 `ComposerCanvas` 가 hardcoded `null` 로 전달 중. ComposerCanvas 가 외부에서 받은 콜백을 그대로 전달하도록 변경 + ModeNewStep 이 `DataSourcePickerDialog` 인스턴스를 들고 콜백 제공.

- [ ] **Step 1: ComposerCanvas prop chain**

`ComposerCanvas.jsx` 의 함수 시그니처 + 사용 위치 수정:

기존:
```jsx
function ComposerCanvas({ spec, onChange, readOnly = false, targetCd }) {
  ...
  <DataMiniDialog
    open={!!editingLayer}
    layer={editingLayer}
    targetCd={targetCd}
    onClose={() => setEditingLayerKey(null)}
    onApply={handleApplyLayer}
    /* Phase 1 에서는 DataSourcePicker 풀스크린 진입 미연결 — Phase 2 에서 추가 */
    onOpenDataSourcePicker={null}
  />
```

→ 다음으로 교체:
```jsx
function ComposerCanvas({ spec, onChange, readOnly = false, targetCd, onOpenDataSourcePicker }) {
  ...
  <DataMiniDialog
    open={!!editingLayer}
    layer={editingLayer}
    targetCd={targetCd}
    onClose={() => setEditingLayerKey(null)}
    onApply={handleApplyLayer}
    onOpenDataSourcePicker={
      onOpenDataSourcePicker
        ? () => onOpenDataSourcePicker(editingLayer)   // editingLayer 정보 전달
        : null
    }
  />
```

- [ ] **Step 2: ModeNewStep 에 DataSourcePickerDialog 인스턴스 + 콜백 추가**

`ModeNewStep.jsx` 에:

1) import 추가:
```jsx
import DataSourcePickerDialog from './DataSourcePickerDialog';
```

2) state 추가 (CANVAS 단계 안에서):
```jsx
const [dsPickerOpen, setDsPickerOpen] = useState(false);
const [dsPickerLayerKey, setDsPickerLayerKey] = useState(null);  // 어느 layer 가 picker 를 열었는지
```

3) ComposerCanvas 사용 부분에 prop 추가:
```jsx
<ComposerCanvas
  spec={spec}
  onChange={setSpec}
  targetCd={currentTargetCd}
  onOpenDataSourcePicker={(editingLayer) => {
    setDsPickerLayerKey(editingLayer?.key || null);
    setDsPickerOpen(true);
  }}
/>
```

4) CANVAS 단계 JSX 의 마지막에 (또는 outer fragment 안에) `DataSourcePickerDialog` 추가:
```jsx
<DataSourcePickerDialog
  open={dsPickerOpen}
  targetCd={currentTargetCd}
  currentValue={null}
  onClose={() => setDsPickerOpen(false)}
  onConfirm={(basket) => {
    setDsPickerOpen(false);
    if (!basket || basket.length === 0 || !dsPickerLayerKey) return;
    // basket 의 TABLE/SP 항목을 해당 layer 의 references 에 추가
    setSpec((prev) => {
      const nextLayers = prev.layers.map((l) => {
        if (l.key !== dsPickerLayerKey) return l;
        const newRefs = basket
          .filter((b) => b.kind === 'TABLE' || b.kind === 'SP')
          .map((b) => ({
            kind: b.kind,
            name: b.label || b.key,
          }));
        const existing = l.dataSource?.references || [];
        // 중복 제거: 같은 kind+name 은 한 번만
        const merged = [...existing];
        for (const r of newRefs) {
          if (!merged.find((m) => m.kind === r.kind && m.name === r.name)) {
            merged.push(r);
          }
        }
        // INLINE_QUERY 는 sqlBlocks 에 추가
        const newSql = basket
          .filter((b) => b.kind === 'INLINE_QUERY')
          .map((b) => b.meta?.sql || b.label || '')
          .filter(Boolean);
        const mergedSql = [...(l.dataSource?.sqlBlocks || []), ...newSql];

        return {
          ...l,
          dataSource: {
            ...(l.dataSource || {}),
            references: merged,
            sqlBlocks: mergedSql,
          },
        };
      });
      return { ...prev, layers: nextLayers };
    });
  }}
/>
```

⚠️ Note: ONTOLOGY_QA / ONTOLOGY_INTENT / ONTOLOGY_SP 같은 ontology 항목은 Phase 2A 에서는 무시. Phase 2B 에서 자연어 컨텍스트로 흡수.

- [ ] **Step 3: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError" | head -5`
Expected: 0건.

- [ ] **Step 4: 시각 검증**

브라우저 → ModeNewStep → "빈 캔버스 (P02)" → ComposerCanvas → 메인 그리드 클릭 → DataMiniDialog → 하단 `🔍 Data Source 탐색` 버튼이 **활성** (이전엔 prop 없어서 안 보였음) → 클릭 → `DataSourcePickerDialog` 풀스크린 열림 → 별자리 맵에서 TABLE 선택 + 바스켓 추가 → [적용] → DataMiniDialog 의 references chip 으로 표시됨 + 하단 디버그 JSON 갱신.

INLINE_QUERY (Query Inline 탭) 도 같이 추가하면 sqlBlocks 에 들어가는지 확인.

- [ ] **Step 5: commit**

```bash
git add frontend/src/view/util/t3composer/ComposerCanvas.jsx \
        frontend/src/view/util/t3composer/ModeNewStep.jsx
git commit -m "feat(composer): DataMiniDialog 의 풀스크린 DataSourcePicker 진입 활성

Phase 1 에서 hardcoded null 로 비활성됐던 onOpenDataSourcePicker 콜백을
ModeNewStep 의 DataSourcePickerDialog 인스턴스로 연결.

ComposerCanvas: onOpenDataSourcePicker prop 추가 + editingLayer 전달
ModeNewStep: dsPickerOpen state + DataSourcePickerDialog 인스턴스 추가
  onConfirm(basket) 처리:
   - TABLE/SP 항목 → 해당 layer 의 references 에 추가 (중복 제거)
   - INLINE_QUERY → 해당 layer 의 sqlBlocks 에 추가
   - ONTOLOGY_* → Phase 2A 에서는 무시 (Phase 2B 의 자연어 컨텍스트로)

Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2a.md (Task 4)"
```

---

## Task 5: Phase 2A 통합 smoke 검증 + 종료 마커

**Files:** (변경 없음, 검증만)

- [ ] **Step 1: 전체 컴파일 healthcheck**

Run: `docker compose logs --tail=200 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError|Failed to compile" | head -15`
Expected: 0건.

- [ ] **Step 2: 5분 smoke 시나리오**

브라우저 `http://localhost:5173`:

1. ModeSelector → "단계별 생성 (Beta)" → 패턴 picker 화면 ✓
2. **"SCM UI Mockup (54개)"** 클릭 → MockupPickerDialog 열림 → "P02 — 검색 + 그리드" 선택 → [적용] → ComposerCanvas 에 mainGrid 1개 ✓
3. "패턴 다시 선택" 으로 돌아가서 **"grid_chart_stacked" (LAYOUT_V2)** 같은 다른 패턴 선택 → layer 2개 (topPanel / bottomPanel) ✓
4. "패턴 다시 선택" → **"T3MES UI Pattern"** 클릭 → UiPatternPickerDialog 열림 → 임의 패턴 → [적용] → ComposerCanvas mainGrid 1개 + 디버그 JSON 에 `pattern: 'UIPATTERN_<file>#<tabIndex>'` ✓
5. "패턴 다시 선택" → **"빈 캔버스 (P02)"** → 메인 그리드 클릭 → DataMiniDialog → **`🔍 Data Source 탐색` 버튼 활성** ✓
6. 클릭 → DataSourcePickerDialog 풀스크린 → DB Entity 탭 별자리 맵에서 TABLE 1~2개 선택 (예: TB_AD_USER, TB_AD_MENU) → [적용] → DataMiniDialog 의 references chip 에 표시 ✓
7. 다시 `🔍 Data Source 탐색` → Query Inline 탭에서 SQL 입력 → 바스켓 추가 → [적용] → DataMiniDialog 의 sqlBlocks 에 추가 ✓
8. 기존 모드 (NEW_NL / NEW_FROM_COPY / NEW_FROM_DESIGN) 회귀 없음 ✓

- [ ] **Step 3: Phase 2A 종료 commit**

```bash
git commit --allow-empty -m "$(cat <<'EOF'
milestone(composer): Phase 2A complete — Picker 연결

Phase 1 의 alert-stub / hardcoded null 을 모두 실제 picker 호출로 교체:
- SCM Mockup picker → specFromMockup → layers 자동 prefill (layoutCategory 별)
- UI Pattern picker → specFromUiPattern → pattern 식별자 보존
- DataSourcePicker 풀스크린 → references / sqlBlocks 자동 추가

[유지]
9-Step Wizard / 다른 모드 (NEW_NL/NEW_FROM_COPY/NEW_FROM_DESIGN) 미변경.

[다음 단계]
- Phase 2B: 4개 NEW_* 모드의 결과를 ComposerSpec 으로 통일 + Backend prompt 갱신
- Phase 2C: ComposerWorkspace 통합 (산출물 생성 / 메뉴등록 / 화면실행)
- Phase 1.5 (나중): Layer 자유 추가/이동/삭제

Spec: docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md
Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2a.md
EOF
)"
```

---

## Self-Review

**1. Spec coverage (Phase 2A 부분):**

| Spec 항목 (Phase 2A) | 구현 task |
|---|---|
| SCM Mockup picker → ComposerSpec 매핑 | Task 1 (specFromMockup) + Task 2 (ModeNewStep 연결) |
| UI Pattern picker → ComposerSpec 매핑 | Task 1 (specFromUiPattern) + Task 3 (ModeNewStep 연결) |
| DataMiniDialog 의 풀스크린 DataSourcePicker 진입 | Task 4 |
| layoutCategory → layer 갯수/배치 매핑 | Task 1 (LAYOUT_CATEGORY_TO_LAYERS) |
| Backend `PrefillFromSourceService` 응답 형식 조정 | **Phase 2B** (별도 plan) |
| NEW_GENERAL/NL/COPY/DESIGN 의 결과 통일 | **Phase 2B** |
| ComposerWorkspace 통합 (산출물 생성/메뉴등록/실행) | **Phase 2C** |

**2. Placeholder scan:** "TBD" / "implement later" / "fill in details" 패턴 검색 0건. ✓

**3. Type consistency:**
- `specFromMockup` / `specFromUiPattern` 의 반환 객체와 `createComposerSpec` 의 구조 일치 ✓
- `LAYOUT_CATEGORY_TO_LAYERS` 의 각 layer 가 `LAYER_TYPES.GRID` / `LAYER_TYPES.CHART` 만 사용 (Task 1 의 wizardState.js 안 LAYER_TYPES 정의와 일치) ✓
- `DataSourcePickerDialog` 의 `basket[]` kind = `'TABLE'|'SP'|'ONTOLOGY_*'|'INLINE_QUERY'` 와 Task 4 의 처리 분기 일치 ✓
- `MockupPickerDialog` 의 `onConfirm(entry|null)` 시그니처와 Task 2 의 `if (!entry) return;` 처리 일치 ✓

**4. Ambiguity:**
- "layer 배치 RGL grid 12-col" — Phase 1 은 RGL 미사용이지만, 매핑 데이터는 미리 RGL 호환 형식으로 저장 (Phase 1.5/3 에서 RGL 도입 시 그대로 사용). 현재 ComposerCanvas 는 position 무시하고 단순 flex column 배치 — 의도된 점진적 통합.
- "Ontology 항목 무시" — Phase 2A 에서는 사용자가 별자리 맵에서 Ontology 만 선택해도 references / sqlBlocks 에 안 들어감. UI 가 "선택했는데 반영 안 됨" 으로 보일 위험 → Task 4 의 시각 검증 단계에서 명시.

---

## Execution Choice

**Plan complete and saved to `docs/superpowers/plans/2026-05-22-composer-canvas-phase2a.md`.** 두 가지 실행 옵션:

**1. Subagent-Driven (recommended)** — 매 task 마다 fresh subagent dispatch
**2. Inline Execution** — 이 세션에서 직접 진행

어느 쪽으로?

# Composer Canvas Phase 3a — Spec Converter Design

**Goal:** 9-step Wizard spec format 을 새 ComposerWizard (4-step) format 으로 변환하는 `convertStep9SpecToWizardSpec()` 함수를 작성. Phase 3b 이후 4개 모드 마이그레이션 시 prefill 데이터를 새 wizard 에 주입할 때 사용.

**Architecture:** `wizardState.js` 에 export 함수 1개 추가. 입력 9-step format, 출력 4-step (`createComposerSpec` 호환) format. 기존 함수 / behavior 변경 0.

---

## 1. 입출력 명세

### Input — 9-step format
```js
{
  moduleCode, sourceMenu, sourceBundle, designDoc, parsedDesign,
  layoutSizes, mainLayoutConfig, changeReq,
  step1_layout: { patternCode, areas[], layoutConfig: { cols, rowHeight, layers[], filterBar: { items[], affects, h } } },
  step2_overview: { screenId, screenName, menuCd, parentMenuCd, menuFilePath, langKey, description },
  step3_components: { [areaId]: { components: [] } },
  step4_dataBinding: { [areaId]: { source, entity, baseUrl, spName, ... } },
  step5_columns:    { [areaId]: { columns: [] } },
  step6_cascade:    { [areaId]: { rules: [] } },
  step7_filter:     { blockId, fields: [] },
  step8_filterCascade: { dependencies: [], crossFieldRules: [] },
}
```

### Output — 4-step format (createComposerSpec 호환)
```js
{
  meta: { menuCd, title, parentMenuCd, menuFilePath, pattern },
  filterBar: {
    items:   [{ key, label, type }],
    affects: { [layerKey]: [fieldKey] },
  },
  layers: [
    {
      key, title, type, subtype, position: { x, y, w, h },
      parentKey?,    // Container 자식
      dataSource: { mode, naturalText, references, sqlBlocks },
      columns: [],
      cascade: {},
    },
  ],
  // 보존 (디버깅·다음 단계 참조용)
  _originStep9: <원본>,
}
```

## 2. 매핑 규칙

| 4-step 경로 | 9-step 소스 | 비고 |
|---|---|---|
| `meta.menuCd` | `step2_overview.menuCd` | 빈 문자열 fallback |
| `meta.title` | `step2_overview.screenName` | empty → `''` |
| `meta.parentMenuCd` | `step2_overview.parentMenuCd` | |
| `meta.menuFilePath` | `step2_overview.menuFilePath` | |
| `meta.pattern` | `step1_layout.patternCode` | fallback `'BLANK'` |
| `layers[].key` | `step1_layout.layoutConfig.layers[].key` | |
| `layers[].title` | `step1_layout.layoutConfig.layers[].title` | |
| `layers[].type` | `componentType → LAYER_TYPES` (CHART/CONTAINER/GRID 등) | helper 추가 |
| `layers[].subtype` | `componentType` 자체 (예 `GRID_BASE`/`CHART_BAR`) | |
| `layers[].position` | `{x,y,w,h}` from layoutConfig.layers | |
| `layers[].dataSource` | `step4_dataBinding[layerKey]` → 변환 | source 별 분기 |
| `layers[].columns` | `step5_columns[layerKey].columns` | 그대로 (필요 시 정리) |
| `layers[].cascade` | `step6_cascade[layerKey].rules` 배열 → `{rules:[]}` 객체 | |
| `filterBar.items` | `step7_filter.fields` → `[{key:fieldId, label, type}]` | `step1_layout.layoutConfig.filterBar.items` 가 더 풍부하면 그쪽 우선 |
| `filterBar.affects` | `{}` (기본) — 새 Wizard 의 FilterBarInlinePanel 이 추가 시 채움 | 또는 step1.layoutConfig.filterBar.affects 가 있으면 보존 |

### 2.1 step4 → dataSource 변환 분기

| step4.source | 4-step dataSource |
|---|---|
| `'SP'` | `{ mode: 'SP', references: [{kind:'SP', name: spName}], naturalText: '', sqlBlocks: [] }` |
| `'JPA_ENTITY'` | `{ mode: 'ENTITY', references: [{kind:'ENTITY', name: entity}], naturalText: baseUrl||'', sqlBlocks: [] }` |
| `'ONTOLOGY'` | `{ mode: 'TABLE', references: [{kind:'TABLE', name: ontologyRef||''}], naturalText: '', sqlBlocks: [] }` |
| `'DIRECT'` | `{ mode: 'NL', references: [], naturalText: directUrl||'', sqlBlocks: [] }` |
| `'ENGINE'` | `{ mode: 'SP', references: [{kind:'SP', name: spName||''}], naturalText: '', sqlBlocks: [] }` |
| undefined | `{ mode: 'NL', references: [], naturalText: '', sqlBlocks: [] }` |

### 2.2 componentType → LAYER_TYPES

| componentType (포함) | type | subtype |
|---|---|---|
| `CONTAINER` / `TAB` | `CONTAINER` | 원본 componentType 그대로 |
| `CHART` | `CHART` | 원본 |
| `DASHBOARD` / `WIDGET` | `CHART` | `CHART_DASHBOARD` |
| `DOCUMENT` / `PDF` | `DOCUMENT` | 원본 |
| `AI` / `INSIGHT` | `AI` | 원본 |
| 그 외 (`GRID_BASE` 등) | `GRID` | 원본 |

## 3. 안전성

- 입력 null/undefined → 빈 4-step spec (`createComposerSpec()`) 반환
- 필수 키 누락 → 부분 변환 + 빈 default 채움 (throw 안 함)
- `_originStep9` 에 원본 보존 — 향후 reverse 변환 또는 디버깅 시 활용

## 4. 검증

- NEW_STEP 회귀: ModeNewStep 흐름은 4-step format 직접 사용 (Phase 2E-1) — 본 변환기 미경유 → 영향 0.
- Phase 3a 종료 시: 콘솔에서 `convertStep9SpecToWizardSpec(sampleStep9)` 호출 → 4-step 구조 검증.
- 단위 검증 코드 1개 함수 (개발자 콘솔 expose) — Jest 등 환경 없으므로 수동 검증.

## 5. Out of scope

- 역변환 (4-step → 9-step) — Phase 3a 범위 외. 마이그레이션이 단방향이므로 불필요.
- `step8_filterCascade.dependencies` 변환 — 4-step 의 cascade 표현이 layer-level 이라 직접 매핑 어려움. Phase 3 후속에서 처리 (cascade 가 4-step 에 정착할 때).
- 보조 컴포넌트 (InferredSqlPanel/StepDataInspector) 영향 — Phase 3f 의 cleanup 단계.

---

## 관련 파일

- `frontend/src/view/util/t3composer/wizardState.js` — 함수 추가 (export)

# Composer Canvas Phase 3a — Spec Converter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `wizardState.js` 에 `convertStep9SpecToWizardSpec()` export 추가. Phase 3b~3e 모드 마이그레이션의 토대.

**Architecture:** export 함수 1개 + 내부 helper 2개 (`mapSource` / `mapComponentType`). 기존 코드 변경 0.

**Tech Stack:** Pure JS, 외부 의존성 0.

**Spec:** `docs/superpowers/specs/2026-05-22-composer-canvas-phase3a-spec-converter-design.md`
**전제:** Phase 2E-3 완료 (commit `5dedfcc`).
**Dev 환경**: composer-frontend port 5173. 로그: `docker compose logs --tail=50 composer-frontend`.

---

## File Structure

| 파일 | 변경 종류 | 책임 |
|---|---|---|
| `frontend/src/view/util/t3composer/wizardState.js` | **수정 (추가만)** | `convertStep9SpecToWizardSpec()` export + helpers. 기존 함수 / 변수 변경 0. |

---

## Task 1: Converter 구현

**Files:**
- Modify: `frontend/src/view/util/t3composer/wizardState.js` (파일 끝에 append)

- [ ] **Step 1: 파일 끝에 converter + helper 함수 append**

`frontend/src/view/util/t3composer/wizardState.js` 마지막 줄 다음에 추가:

```jsx
// ============================================================================
// Phase 3a — 9-step Wizard spec → 4-step ComposerWizard spec converter
// ============================================================================

/**
 * step4_dataBinding 의 source 토큰을 4-step dataSource 객체로 변환.
 * 9-step 의 모든 source 가 표현 가능하지만 일부는 lossy (예: methods 정보).
 *
 * @param {object} db4  step4_dataBinding[areaId] entry — 없으면 빈 NL.
 * @returns {object}    { mode, naturalText, references, sqlBlocks }
 */
function mapStep4ToDataSource(db4) {
  if (!db4 || typeof db4 !== 'object') {
    return { mode: 'NL', naturalText: '', references: [], sqlBlocks: [] };
  }
  const src = String(db4.source || '').toUpperCase();
  if (src === 'SP') {
    return {
      mode: 'SP',
      naturalText: '',
      references: db4.spName ? [{ kind: 'SP', name: db4.spName }] : [],
      sqlBlocks: [],
    };
  }
  if (src === 'JPA_ENTITY') {
    return {
      mode: 'ENTITY',
      naturalText: db4.baseUrl || '',
      references: db4.entity ? [{ kind: 'ENTITY', name: db4.entity }] : [],
      sqlBlocks: [],
    };
  }
  if (src === 'ONTOLOGY') {
    return {
      mode: 'TABLE',
      naturalText: '',
      references: db4.ontologyRef ? [{ kind: 'TABLE', name: db4.ontologyRef }] : [],
      sqlBlocks: [],
    };
  }
  if (src === 'DIRECT') {
    return {
      mode: 'NL',
      naturalText: db4.directUrl || '',
      references: [],
      sqlBlocks: [],
    };
  }
  if (src === 'ENGINE') {
    return {
      mode: 'SP',
      naturalText: '',
      references: db4.spName ? [{ kind: 'SP', name: db4.spName }] : [],
      sqlBlocks: [],
    };
  }
  // default — 빈 NL
  return { mode: 'NL', naturalText: '', references: [], sqlBlocks: [] };
}

/**
 * 9-step layoutConfig.layers[].componentType → 4-step LAYER_TYPES.
 *
 * @param {string} componentType
 * @returns {object} { type, subtype }
 */
function mapComponentTypeToLayerType(componentType) {
  const ct = String(componentType || '').toUpperCase();
  if (ct.includes('CONTAINER') || ct.includes('TAB')) {
    return { type: LAYER_TYPES.CONTAINER, subtype: ct || 'CONTAINER_TAB' };
  }
  if (ct.includes('DASHBOARD') || ct.includes('WIDGET')) {
    return { type: LAYER_TYPES.CHART, subtype: 'CHART_DASHBOARD' };
  }
  if (ct.includes('CHART')) {
    return { type: LAYER_TYPES.CHART, subtype: ct };
  }
  if (ct.includes('DOCUMENT') || ct.includes('PDF') || ct.includes('IMAGE')) {
    return { type: LAYER_TYPES.DOCUMENT, subtype: ct };
  }
  if (ct.includes('AI') || ct.includes('INSIGHT')) {
    return { type: LAYER_TYPES.AI, subtype: ct };
  }
  return { type: LAYER_TYPES.GRID, subtype: ct || 'GRID_BASE' };
}

/**
 * 9-step Wizard spec → 4-step ComposerWizard spec 변환.
 *
 * Phase 3a 의 핵심 — 4개 모드 (NEW_FROM_COPY/EXISTING_MODIFY/NEW_FROM_DESIGN/NEW_GENERAL)
 * 마이그레이션 시 prefill 데이터를 새 ComposerWizard 에 주입할 때 사용.
 *
 * @param {object} spec9   9-step Wizard spec (createInitialSpec/FromSource/FromDesign 출력)
 * @returns {object}       4-step ComposerWizard spec (createComposerSpec 호환)
 *
 * Spec: docs/superpowers/specs/2026-05-22-composer-canvas-phase3a-spec-converter-design.md
 * Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase3a.md
 */
export function convertStep9SpecToWizardSpec(spec9) {
  if (!spec9 || typeof spec9 !== 'object') {
    return createComposerSpec();
  }

  // ── meta ──
  const step2 = spec9.step2_overview || {};
  const step1 = spec9.step1_layout   || {};
  const meta = {
    menuCd:       step2.menuCd       || '',
    title:        step2.screenName   || '',
    parentMenuCd: step2.parentMenuCd || '',
    menuFilePath: step2.menuFilePath || '',
    pattern:      step1.patternCode  || 'BLANK',
  };

  // ── layers ──
  const lc = step1.layoutConfig || {};
  const lcLayers = Array.isArray(lc.layers) ? lc.layers : [];
  const step4 = spec9.step4_dataBinding || {};
  const step5 = spec9.step5_columns     || {};
  const step6 = spec9.step6_cascade     || {};

  const layers = lcLayers.map((l, idx) => {
    const key = l.key || `layer${idx + 1}`;
    const { type, subtype } = mapComponentTypeToLayerType(l.componentType);
    const layer = {
      key,
      title: l.title || key,
      type,
      subtype,
      position: {
        x: typeof l.x === 'number' ? l.x : 0,
        y: typeof l.y === 'number' ? l.y : 0,
        w: typeof l.w === 'number' ? l.w : 12,
        h: typeof l.h === 'number' ? l.h : 6,
      },
      dataSource: mapStep4ToDataSource(step4[key]),
      columns: (step5[key] && Array.isArray(step5[key].columns)) ? step5[key].columns : [],
      cascade: (step6[key] && Array.isArray(step6[key].rules))
        ? { rules: step6[key].rules }
        : {},
    };
    if (l.parentKey) layer.parentKey = l.parentKey;
    return layer;
  });

  // ── filterBar ──
  // step7_filter.fields 가 더 풍부 (label/type 메타) → 우선 사용.
  // step1.layoutConfig.filterBar.items 가 있고 step7 가 비었으면 폴백.
  const step7 = spec9.step7_filter || {};
  const fbStep1 = lc.filterBar || {};
  let items = [];
  if (Array.isArray(step7.fields) && step7.fields.length > 0) {
    items = step7.fields.map((f) => ({
      key:   f.fieldId || f.varName || `field_${Math.random().toString(36).slice(2, 8)}`,
      label: f.label || '',
      type:  f.type  || 'TEXT',
    }));
  } else if (Array.isArray(fbStep1.items) && fbStep1.items.length > 0) {
    items = fbStep1.items.map((it) => ({
      key:   it.key,
      label: it.label || '',
      type:  it.type  || 'TEXT',
    }));
  }
  // affects: step1.layoutConfig.filterBar.affects 가 있으면 보존, 없으면 빈 {}.
  // (4-step 의 FilterBarInlinePanel 이 추가 시 default 채움)
  const affects = (fbStep1.affects && typeof fbStep1.affects === 'object')
    ? fbStep1.affects
    : {};

  return {
    meta,
    filterBar: { items, affects },
    layers,
    _originStep9: spec9,
  };
}
```

- [ ] **Step 2: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|SyntaxError" | head -5`
Expected: 0건.

- [ ] **Step 3: NEW_STEP 회귀 검증 (시각)**

브라우저 `http://localhost:5173`:
1. ModeSelector → 단계별 생성 → 빈 캔버스 (P02) → Wizard 진입 ✓ (변화 없어야 함)
2. ① Layout / ② Data / ③ Meta / ④ Generate 모두 정상 동작 ✓

본 변환기는 export 만 추가 — 기존 호출 그래프 변경 0. NEW_STEP 흐름이 본 함수를 호출하지 않으므로 회귀 가능성 0. 그래도 한 번 확인.

- [ ] **Step 4: 브라우저 콘솔 단위 검증 (선택)**

브라우저 콘솔에서:
```js
// 가짜 9-step spec 1개 만들어 변환 결과 확인
const fake9 = {
  moduleCode: 'AD',
  step1_layout: {
    patternCode: 'P02',
    layoutConfig: {
      cols: 12, rowHeight: 30,
      layers: [
        { key: 'mainGrid', title: '사용자 목록', componentType: 'GRID_BASE',
          x: 0, y: 0, w: 12, h: 8 },
      ],
      filterBar: { items: [{ key: 'q', label: '검색', type: 'TEXT' }], affects: {} },
    },
    areas: [],
  },
  step2_overview: {
    screenName: '사용자관리',
    menuCd: 'UI_AD_USER',
    parentMenuCd: 'MENU_AD',
    menuFilePath: '/system/User',
  },
  step4_dataBinding: {
    mainGrid: { source: 'JPA_ENTITY', entity: 'User', baseUrl: 'system/users' },
  },
  step5_columns: {
    mainGrid: { columns: [
      { name: 'username', dataType: 'text', headerText: '사용자 ID', width: 130 },
    ]},
  },
  step7_filter: {
    blockId: 'filter_main',
    fields: [{ fieldId: 'USER_ID', type: 'TEXT', label: '사용자 ID' }],
  },
};
// 모듈 import 가 어렵다면 dev tools 의 React DevTools 에서 확인 또는 직접 wizardState 의
// 함수를 window 에 expose 해 콘솔 호출. Phase 3a 의 hard 검증은 Phase 3b 통합 시 자연스럽게 됨.
```

이 검증은 선택사항 — Phase 3b 첫 통합 (ModeNewFromCopy → ComposerWizard) 시 자연스럽게 실증 검증된다.

- [ ] **Step 5: commit**

```bash
git add frontend/src/view/util/t3composer/wizardState.js \
        docs/superpowers/specs/2026-05-22-composer-canvas-phase3a-spec-converter-design.md \
        docs/superpowers/plans/2026-05-22-composer-canvas-phase3a.md
git commit -m "$(cat <<'EOF'
feat(composer): Phase 3a — 9-step → 4-step spec converter

Phase 3 의 토대 — 9-step Wizard spec format 을 새 ComposerWizard (4-step) format
으로 변환하는 convertStep9SpecToWizardSpec() export 함수 추가. Phase 3b~3e 의
4개 모드 마이그레이션 (NEW_FROM_COPY/EXISTING_MODIFY/NEW_FROM_DESIGN/NEW_GENERAL) 시
prefill 데이터를 새 wizard 에 주입하는 brige.

[추가 export]
- convertStep9SpecToWizardSpec(spec9): 9-step → 4-step.
  - meta: step2_overview + step1_layout.patternCode 매핑.
  - layers: step1.layoutConfig.layers + step4/5/6 의 area 별 메타 병합.
  - filterBar: step7_filter.fields 우선 + step1.layoutConfig.filterBar fallback.
  - _originStep9 에 원본 보존 (디버깅/향후 reverse).

[추가 internal helpers]
- mapStep4ToDataSource(db4): source(SP/JPA_ENTITY/ONTOLOGY/DIRECT/ENGINE) 분기.
- mapComponentTypeToLayerType(ct): LAYER_TYPES (CHART/CONTAINER/GRID/DOCUMENT/AI) 매핑.

[영향]
- 기존 함수 / behavior 변경 0. export 만 추가 — 호출처 0 (Phase 3b 부터 사용).
- NEW_STEP 흐름 영향 0 — 4-step format 직접 사용해 변환기 미경유.

[Out of scope]
- 역변환 (4→9) — 마이그레이션 단방향이라 불필요.
- step8_filterCascade 변환 — 4-step cascade 정착 시 Phase 3 후속에서 처리.

Spec: docs/superpowers/specs/2026-05-22-composer-canvas-phase3a-spec-converter-design.md
Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase3a.md
EOF
)"
```

---

## Task 2: Phase 3a milestone

- [ ] **Step 1: milestone commit**

```bash
git commit --allow-empty -m "$(cat <<'EOF'
milestone(composer): Phase 3a complete — spec converter

9-step Wizard spec → 4-step ComposerWizard spec converter 도입.
Phase 3b~3e (4개 모드 마이그레이션) 의 토대.

[Commits]
- (Spec+Plan+Impl) feat — convertStep9SpecToWizardSpec export

[다음]
- Phase 3b: ModeNewFromCopy 마이그레이션 (StepByStepWizard → ComposerWizard)
- Phase 3c: ModeNewFromDesign 마이그레이션
- Phase 3d: ModeExistingModify [STEP] 마이그레이션
- Phase 3e: ModeNewGeneral [STEP] 마이그레이션
- Phase 3f: dead code 일괄 삭제 (StepByStepWizard + steps/* + wizardState 9-step helpers)

Spec: docs/superpowers/specs/2026-05-22-composer-canvas-phase3a-spec-converter-design.md
Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase3a.md
EOF
)"
```

---

## Self-Review

**1. Spec coverage:**

| Spec 요구 | 구현 task |
|---|---|
| convertStep9SpecToWizardSpec export | Task 1 Step 1 |
| meta 매핑 (step2 + step1.patternCode) | Task 1 Step 1 |
| layers 매핑 (step1.layoutConfig.layers + step4/5/6) | Task 1 Step 1 |
| filterBar 매핑 (step7.fields 우선) | Task 1 Step 1 |
| step4 source 분기 (SP/JPA_ENTITY/ONTOLOGY/DIRECT/ENGINE) | mapStep4ToDataSource |
| componentType → LAYER_TYPES | mapComponentTypeToLayerType |
| 안전성 (null 입력 → 빈 4-step) | Task 1 Step 1 첫 분기 |
| _originStep9 보존 | Task 1 Step 1 마지막 return |

**2. Placeholder scan:** 0건. ✓

**3. Type consistency:** mapStep4ToDataSource 반환 형태 (`{mode,naturalText,references,sqlBlocks}`) — createComposerLayer 의 dataSource 와 일치 ✓. layers[].cascade 가 `{rules:[]}` 객체 — createComposerLayer 의 `cascade: {}` 와 호환 ✓.

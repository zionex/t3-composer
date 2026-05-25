# Composer Canvas Phase 2D-2a — Layer Relations UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** spec.relations[] 데이터 모델 + `LayerRelationsPanel`/`LayerRelationCard` UI 컴포넌트 2개 신규. DataAndFilterStep 우측 영역에 통합. ComposerWizard 검증 보강.

**Architecture:** wizardState.js 에 createComposerSpec/removeLayer 수정 + addRelation/removeRelation/updateRelation 3개 export 추가. UI 2개 컴포넌트 (controlled props). DataAndFilterStep 우측 영역 column flex 로 FilterBar + Relations 세로 배치. Wizard validateStep 에 orphan 검사 추가.

**Tech Stack:** React 18 + MUI 5. 외부 의존성 0.

**Spec:** `docs/superpowers/specs/2026-05-25-composer-canvas-phase2d2a-layer-relations-ui-design.md`
**전제:** Phase 3a 완료 (commit `2fde1fd`).
**Dev 환경**: composer-frontend port 5173. 로그: `docker compose logs --tail=50 composer-frontend`.

---

## File Structure

| 파일 | 변경 종류 | 책임 |
|---|---|---|
| `frontend/src/view/util/t3composer/wizardState.js` | **수정** | createComposerSpec 에 relations:[] · removeLayer 의 relations 정리 · addRelation/removeRelation/updateRelation export · specToInitialPrompt 의 placeholder 1줄 추가 |
| `frontend/src/view/util/t3composer/LayerRelationCard.jsx` | **신규** | 개별 관계 카드 (source/target dropdown + event/action + mapping pairs + 삭제) |
| `frontend/src/view/util/t3composer/LayerRelationsPanel.jsx` | **신규** | 우측 패널 wrapper (header + [+ 추가] + LayerRelationCard list) |
| `frontend/src/view/util/t3composer/DataAndFilterStep.jsx` | **수정** | 우측 영역 column flex 로 FilterBarInlinePanel + LayerRelationsPanel 세로 배치 |
| `frontend/src/view/util/t3composer/ComposerWizard.jsx` | **수정** | validateStep('DATA') 에 orphan 검사 추가 |

---

## Task 1: wizardState 변경 (relations 데이터 모델 + helpers)

**Files:**
- Modify: `frontend/src/view/util/t3composer/wizardState.js`

- [ ] **Step 1: createComposerSpec 에 relations:[] 추가**

기존 (line 2433 부근):
```jsx
  return {
    meta: { menuCd, title, parentMenuCd, menuFilePath, pattern },
    filterBar: {
      items: [],
      affects: {},
    },
    layers: [
      {
        key: 'mainGrid',
        ...
      },
    ],
  };
}
```

→ `layers: [...]` 다음에 한 줄 추가:
```jsx
  return {
    meta: { menuCd, title, parentMenuCd, menuFilePath, pattern },
    filterBar: {
      items: [],
      affects: {},
    },
    layers: [
      {
        key: 'mainGrid',
        ...
      },
    ],
    relations: [],   // Phase 2D-2a — Layer 간 관계 (master→detail 등). spec.layers[].key 참조.
  };
}
```

- [ ] **Step 2: removeLayer 에 relations 정리 추가**

`removeLayer` 함수를 찾아 — layer 제거 + filterBar.affects 정리 다음에 relations 정리 한 줄 추가:

기존 마지막 부근:
```jsx
  // filterBar.affects 의 그 layer key 항목 제거
  if (next.filterBar && typeof next.filterBar.affects === 'object') {
    const aff = { ...next.filterBar.affects };
    delete aff[key];
    next.filterBar = { ...next.filterBar, affects: aff };
  }
  return next;
}
```

→ relations 정리 추가:
```jsx
  // filterBar.affects 의 그 layer key 항목 제거
  if (next.filterBar && typeof next.filterBar.affects === 'object') {
    const aff = { ...next.filterBar.affects };
    delete aff[key];
    next.filterBar = { ...next.filterBar, affects: aff };
  }
  // relations 중 source/target.layerKey 가 삭제 대상이면 제거 (orphan 방지).
  if (Array.isArray(next.relations) && next.relations.length > 0) {
    next.relations = next.relations.filter((r) =>
      r?.source?.layerKey !== key && r?.target?.layerKey !== key
    );
  }
  return next;
}
```

(실제 코드 정확 위치는 `grep -n "function removeLayer" wizardState.js` 후 확인 — relations filter 는 마지막 return 직전에 추가)

- [ ] **Step 3: addRelation / removeRelation / updateRelation export 추가**

`createComposerLayer` 함수 정의 다음 (line ~2480 부근) 에 추가:

```jsx
// ============================================================================
// Phase 2D-2a — Layer 관계 helpers
//   spec.relations[] 의 add/remove/update. UI (LayerRelationsPanel) 가 사용.
// ============================================================================

/**
 * 새 관계 추가. id 자동 생성, 빈 mapping 으로 시작.
 *
 * @param {object} spec        ComposerSpec
 * @param {object} [init]      { source?, target?, mapping? } — 명시 안 하면 첫 layer 두 개로 기본값.
 * @returns {object}           새 spec (immutable)
 */
export function addRelation(spec, init = {}) {
  if (!spec) throw new Error('addRelation: spec required');
  const layers = Array.isArray(spec.layers) ? spec.layers : [];
  const relations = Array.isArray(spec.relations) ? spec.relations : [];
  const newId = `rel_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const defaultSource = layers[0]?.key || '';
  const defaultTarget = layers[1]?.key || layers[0]?.key || '';
  const relation = {
    id:     init.id     || newId,
    source: init.source || { layerKey: defaultSource, event: 'cellClick' },
    target: init.target || { layerKey: defaultTarget, action: 'refetch' },
    mapping: init.mapping && typeof init.mapping === 'object' ? { ...init.mapping } : {},
  };
  return { ...spec, relations: [...relations, relation] };
}

/**
 * 관계 id 로 제거.
 */
export function removeRelation(spec, id) {
  if (!spec || !id) return spec;
  const relations = Array.isArray(spec.relations) ? spec.relations : [];
  return { ...spec, relations: relations.filter((r) => r.id !== id) };
}

/**
 * 관계 부분 갱신 — patch 가 mapping 이면 통째 교체.
 */
export function updateRelation(spec, id, patch) {
  if (!spec || !id || !patch) return spec;
  const relations = Array.isArray(spec.relations) ? spec.relations : [];
  return {
    ...spec,
    relations: relations.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  };
}
```

- [ ] **Step 4: specToInitialPrompt 에 placeholder 블록 추가**

`specToInitialPrompt` 함수 안 — `// ── 4) 지시사항 ──` 직전에 추가:

```jsx
  // ── 5.5) Layer 관계 (Phase 2D-2b 에서 본격 출력) ──
  const rels = Array.isArray(spec.relations) ? spec.relations : [];
  if (rels.length > 0) {
    lines.push('');
    lines.push(`[Layer 관계 (${rels.length}개 — Phase 2D-2b 에서 prompt 정식 통합)]`);
    rels.forEach((r) => {
      const map = r.mapping || {};
      const mapStr = Object.keys(map).length > 0
        ? ` | mapping: ${Object.entries(map).map(([k,v]) => `${k}→${v}`).join(', ')}`
        : '';
      lines.push(`- ${r.source?.layerKey} (${r.source?.event}) → ${r.target?.layerKey} (${r.target?.action})${mapStr}`);
    });
  }
```

- [ ] **Step 5: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|SyntaxError" | head -5`
Expected: 0건.

---

## Task 2: LayerRelationCard — 개별 관계 카드

**Files:**
- Create: `frontend/src/view/util/t3composer/LayerRelationCard.jsx`

- [ ] **Step 1: 신규 파일 작성**

```jsx
/**
 * LayerRelationCard — 개별 layer 관계 카드 (inline 편집).
 *   상위 LayerRelationsPanel 이 controlled props 로 호출.
 *
 *   props:
 *     relation    {id, source, target, mapping}
 *     layers      spec.layers (dropdown 옵션)
 *     onUpdate(patch)  source/target/mapping 변경
 *     onRemove()       관계 삭제
 *
 *   Plan: docs/superpowers/plans/2026-05-25-composer-canvas-phase2d2a.md (Task 2)
 */
import React from 'react';
import {
  Box, Stack, Typography, Select, MenuItem, FormControl, TextField, IconButton, Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export const SOURCE_EVENTS = [
  { value: 'cellClick',       label: 'cellClick (셀 클릭)' },
  { value: 'cellDblClick',    label: 'cellDblClick (셀 더블클릭)' },
  { value: 'selectionChange', label: 'selectionChange (행 선택)' },
  { value: 'valueChange',     label: 'valueChange (form/chart 값 변경)' },
  { value: 'manual',          label: 'manual (사용자 버튼)' },
];

export const TARGET_ACTIONS = [
  { value: 'refetch',  label: 'refetch (재조회)' },
  { value: 'filter',   label: 'filter (로컬 필터)' },
  { value: 'setValue', label: 'setValue (값만 갱신)' },
];

function LayerRelationCard({ relation, layers, onUpdate, onRemove }) {
  const mapping = relation.mapping || {};
  const mappingEntries = Object.entries(mapping);

  const updateSource = (key, value) => {
    onUpdate({ source: { ...relation.source, [key]: value } });
  };
  const updateTarget = (key, value) => {
    onUpdate({ target: { ...relation.target, [key]: value } });
  };
  const addMappingPair = () => {
    const newKey = `field_${mappingEntries.length + 1}`;
    onUpdate({ mapping: { ...mapping, [newKey]: '' } });
  };
  const updateMappingPair = (oldKey, newKey, newVal) => {
    const next = { ...mapping };
    delete next[oldKey];
    next[newKey] = newVal;
    onUpdate({ mapping: next });
  };
  const removeMappingPair = (key) => {
    const next = { ...mapping };
    delete next[key];
    onUpdate({ mapping: next });
  };

  // self-relation 경고
  const selfRel = relation.source?.layerKey
    && relation.source.layerKey === relation.target?.layerKey;

  return (
    <Box sx={{
      bgcolor: '#fff', border: `1px solid ${selfRel ? '#dc2626' : '#c084fc'}`,
      borderRadius: 1, p: 1, display: 'flex', flexDirection: 'column', gap: 0.7,
    }}>
      {/* 헤더 — 삭제 */}
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#6b21a8', flex: 1 }}>
          관계 {selfRel ? '⚠ self-loop' : ''}
        </Typography>
        <IconButton size="small" onClick={onRemove} sx={{ p: 0.3 }}>
          <DeleteIcon fontSize="small" sx={{ color: '#ef4444' }} />
        </IconButton>
      </Stack>

      {/* Source */}
      <Box>
        <Typography sx={{ fontSize: 10, color: '#6b21a8', fontWeight: 700 }}>Source</Typography>
        <FormControl size="small" variant="standard" fullWidth>
          <Select
            value={relation.source?.layerKey || ''}
            onChange={(e) => updateSource('layerKey', e.target.value)}
            displayEmpty
            sx={{ fontSize: 11, color: '#3b0764' }}
          >
            <MenuItem value="" sx={{ fontSize: 11, fontStyle: 'italic', color: '#94a3b8' }}>(layer 선택)</MenuItem>
            {layers.map((l) => (
              <MenuItem key={l.key} value={l.key} sx={{ fontSize: 11 }}>
                {l.title || l.key} <span style={{ color: '#94a3b8', marginLeft: 4 }}>({l.key})</span>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" variant="standard" fullWidth sx={{ mt: 0.3 }}>
          <Select
            value={relation.source?.event || 'cellClick'}
            onChange={(e) => updateSource('event', e.target.value)}
            sx={{ fontSize: 11, color: '#64748b' }}
          >
            {SOURCE_EVENTS.map((ev) => (
              <MenuItem key={ev.value} value={ev.value} sx={{ fontSize: 11 }}>
                {ev.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* 화살표 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', color: '#a855f7' }}>
        <ArrowForwardIcon fontSize="small" />
      </Box>

      {/* Target */}
      <Box>
        <Typography sx={{ fontSize: 10, color: '#6b21a8', fontWeight: 700 }}>Target</Typography>
        <FormControl size="small" variant="standard" fullWidth>
          <Select
            value={relation.target?.layerKey || ''}
            onChange={(e) => updateTarget('layerKey', e.target.value)}
            displayEmpty
            sx={{ fontSize: 11, color: '#3b0764' }}
          >
            <MenuItem value="" sx={{ fontSize: 11, fontStyle: 'italic', color: '#94a3b8' }}>(layer 선택)</MenuItem>
            {layers.map((l) => (
              <MenuItem key={l.key} value={l.key} sx={{ fontSize: 11 }}>
                {l.title || l.key} <span style={{ color: '#94a3b8', marginLeft: 4 }}>({l.key})</span>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" variant="standard" fullWidth sx={{ mt: 0.3 }}>
          <Select
            value={relation.target?.action || 'refetch'}
            onChange={(e) => updateTarget('action', e.target.value)}
            sx={{ fontSize: 11, color: '#64748b' }}
          >
            {TARGET_ACTIONS.map((a) => (
              <MenuItem key={a.value} value={a.value} sx={{ fontSize: 11 }}>
                {a.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Mapping */}
      <Box sx={{ mt: 0.3 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography sx={{ fontSize: 10, color: '#6b21a8', fontWeight: 700, flex: 1 }}>
            Mapping (source 필드 → target param)
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon fontSize="small" />}
            onClick={addMappingPair}
            sx={{ fontSize: 10, color: '#6b21a8', minWidth: 0, p: 0.2 }}
          >
            추가
          </Button>
        </Stack>
        {mappingEntries.length === 0 && (
          <Typography sx={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}>
            mapping 없음 — source row 전체가 전달됨
          </Typography>
        )}
        {mappingEntries.map(([k, v]) => (
          <Stack key={k} direction="row" alignItems="center" spacing={0.3} sx={{ mt: 0.2 }}>
            <TextField
              value={k}
              onChange={(e) => updateMappingPair(k, e.target.value, v)}
              placeholder="source 필드"
              size="small" variant="standard"
              sx={{ flex: 1, '& input': { fontSize: 10, fontFamily: 'monospace' } }}
            />
            <Typography sx={{ fontSize: 11, color: '#a855f7' }}>→</Typography>
            <TextField
              value={v}
              onChange={(e) => updateMappingPair(k, k, e.target.value)}
              placeholder="target param"
              size="small" variant="standard"
              sx={{ flex: 1, '& input': { fontSize: 10, fontFamily: 'monospace' } }}
            />
            <IconButton size="small" onClick={() => removeMappingPair(k)} sx={{ p: 0.2 }}>
              <DeleteIcon fontSize="small" sx={{ color: '#ef4444', fontSize: 14 }} />
            </IconButton>
          </Stack>
        ))}
      </Box>
    </Box>
  );
}

export default LayerRelationCard;
```

- [ ] **Step 2: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|SyntaxError" | head -5`
Expected: 0건.

---

## Task 3: LayerRelationsPanel — 패널 wrapper

**Files:**
- Create: `frontend/src/view/util/t3composer/LayerRelationsPanel.jsx`

- [ ] **Step 1: 신규 파일 작성**

```jsx
/**
 * LayerRelationsPanel — DataAndFilterStep 우측 영역의 'Layer 관계' 섹션.
 *   FilterBarInlinePanel 아래 같은 폭 (280px) 보라 패널.
 *
 *   props:
 *     spec     ComposerSpec
 *     onChange(nextSpec)
 *
 *   Plan: docs/superpowers/plans/2026-05-25-composer-canvas-phase2d2a.md (Task 3)
 */
import React from 'react';
import { Box, Stack, Typography, Button } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import AddIcon from '@mui/icons-material/Add';

import LayerRelationCard from './LayerRelationCard';
import { addRelation, removeRelation, updateRelation } from './wizardState';

function LayerRelationsPanel({ spec, onChange }) {
  const relations = spec?.relations || [];
  const layers    = spec?.layers    || [];

  const handleAdd = () => onChange(addRelation(spec));
  const handleRemove = (id) => onChange(removeRelation(spec, id));
  const handleUpdate = (id, patch) => onChange(updateRelation(spec, id, patch));

  const canAdd = layers.length >= 1;  // 1개면 self-loop 만 가능하나 허용 — 사용자 의도

  return (
    <Box sx={{
      flexShrink: 0, width: 280,
      display: 'flex', flexDirection: 'column', gap: 1,
      bgcolor: '#f3e8ff', border: '2px solid #a855f7', borderRadius: 1.5,
      p: 1.5, overflow: 'auto',
    }}>
      <Stack direction="row" alignItems="center" spacing={0.8}>
        <LinkIcon sx={{ fontSize: 18, color: '#6b21a8' }} />
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#6b21a8', flex: 1 }}>
          🔗 Layer 관계
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon fontSize="small" />}
          onClick={handleAdd}
          disabled={!canAdd}
          sx={{ fontSize: 11, color: '#6b21a8' }}
        >
          관계 추가
        </Button>
      </Stack>

      {!canAdd && (
        <Typography variant="caption" sx={{
          color: '#6b21a8', fontStyle: 'italic', textAlign: 'center', py: 1, fontSize: 11,
        }}>
          layer 1개 이상 필요
        </Typography>
      )}

      {canAdd && relations.length === 0 && (
        <Typography variant="caption" sx={{
          color: '#6b21a8', fontStyle: 'italic', textAlign: 'center', py: 2, fontSize: 11,
        }}>
          관계 없음 — [+ 관계 추가] 클릭<br/>
          (예: master grid 클릭 → detail grid 재조회)
        </Typography>
      )}

      {relations.map((r) => (
        <LayerRelationCard
          key={r.id}
          relation={r}
          layers={layers}
          onUpdate={(patch) => handleUpdate(r.id, patch)}
          onRemove={() => handleRemove(r.id)}
        />
      ))}
    </Box>
  );
}

export default LayerRelationsPanel;
```

- [ ] **Step 2: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|SyntaxError" | head -5`
Expected: 0건.

---

## Task 4: DataAndFilterStep — 우측 column flex + LayerRelationsPanel 통합

**Files:**
- Modify: `frontend/src/view/util/t3composer/DataAndFilterStep.jsx`

- [ ] **Step 1: import 추가**

기존:
```jsx
import DataMiniDialog from './DataMiniDialog';
import FilterBarInlinePanel from './FilterBarInlinePanel';
```

→ 다음으로 교체:
```jsx
import DataMiniDialog from './DataMiniDialog';
import FilterBarInlinePanel from './FilterBarInlinePanel';
import LayerRelationsPanel from './LayerRelationsPanel';
```

- [ ] **Step 2: 우측 영역 column flex wrapper 로 두 패널 세로 배치**

기존:
```jsx
      {/* ── 우측 ~280px : FilterBar inline editor (Phase 2E-2) ── */}
      <FilterBarInlinePanel spec={spec} onChange={onChange} />

      {/* ── Dialogs ── */}
```

→ 다음으로 교체:
```jsx
      {/* ── 우측 ~280px column : FilterBar (상) + LayerRelations (하) 세로 배치 ── */}
      <Box sx={{
        flexShrink: 0, width: 280,
        display: 'flex', flexDirection: 'column', gap: 1.5,
        minHeight: 0, overflow: 'hidden',
      }}>
        <FilterBarInlinePanel spec={spec} onChange={onChange} />
        <LayerRelationsPanel spec={spec} onChange={onChange} />
      </Box>

      {/* ── Dialogs ── */}
```

⚠️ FilterBarInlinePanel 의 width:280 + flexShrink:0 + p:1.5 sx 는 그대로 — wrapper Box 도 280 폭 — 자식 두 패널이 같은 폭 차지하고 세로로 쌓임.

- [ ] **Step 3: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|SyntaxError" | head -5`
Expected: 0건.

- [ ] **Step 4: 시각 검증**

`http://localhost:5173`:
1. 패턴 → Wizard → ② 단계 → 우측에 노란 FilterBar + 보라 Layer 관계 패널 세로 ✓
2. [관계 추가] → 카드 추가, source/target/event/action dropdown 동작 ✓
3. [+ mapping 추가] → key/value text input 동작 ✓
4. [✕ 삭제] → 카드 사라짐 ✓
5. layer 추가/삭제 시 dropdown 옵션 갱신 + 삭제된 layer 참조 관계는 자동 제거 ✓

---

## Task 5: ComposerWizard — validateStep('DATA') 에 orphan 검사 추가

**Files:**
- Modify: `frontend/src/view/util/t3composer/ComposerWizard.jsx`

- [ ] **Step 1: validateStep 함수 보강**

기존:
```jsx
  const validateStep = (stepId) => {
    if (stepId === 'DATA') {
      const items = spec?.filterBar?.items || [];
      const blanks = items.filter((it) => !(it.label || '').trim());
      if (blanks.length > 0) {
        return `FilterBar 필드 ${blanks.length}개에 라벨이 비어있습니다. 입력 후 다음으로 진행하세요.`;
      }
    }
    return null;
  };
```

→ 다음으로 교체:
```jsx
  const validateStep = (stepId) => {
    if (stepId === 'DATA') {
      const items = spec?.filterBar?.items || [];
      const blanks = items.filter((it) => !(it.label || '').trim());
      if (blanks.length > 0) {
        return `FilterBar 필드 ${blanks.length}개에 라벨이 비어있습니다. 입력 후 다음으로 진행하세요.`;
      }
      // Layer 관계의 orphan 검사 — 존재하지 않는 layer 를 참조하는 관계 차단.
      const layerKeys = new Set((spec?.layers || []).map((l) => l.key));
      const relations = spec?.relations || [];
      const orphans = relations.filter((r) =>
        !layerKeys.has(r.source?.layerKey) || !layerKeys.has(r.target?.layerKey)
      );
      if (orphans.length > 0) {
        return `Layer 관계 ${orphans.length}개의 source/target layer 가 존재하지 않습니다. 정리 후 다음으로 진행.`;
      }
    }
    return null;
  };
```

- [ ] **Step 2: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|SyntaxError" | head -5`
Expected: 0건.

---

## Task 6: 통합 commit + smoke + milestone

**Files:** (변경 없음)

- [ ] **Step 1: 전체 컴파일 healthcheck**

Run: `docker compose logs --tail=80 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError|Failed to compile" | head -10`
Expected: 0건.

- [ ] **Step 2: end-to-end 시각 검증**

1. 빈 캔버스 → Wizard ② 단계 ✓
2. [+ Layer] 로 layer 2개 만들기 (masterGrid, detailGrid)
3. ② 단계 → 우측 보라 패널 [관계 추가] ✓
4. source = masterGrid, event = cellClick / target = detailGrid, action = refetch ✓
5. mapping 추가 — `orderId → orderId` ✓
6. layer 1개 삭제 (예: detailGrid) → 관계 자동 제거 확인 ✓
7. orphan 만들기 시나리오 (관계 추가 후 그 layer 가 다른 경로로 사라지는 경우 등 — 안전망 검증)
8. 다음 단계 진행 → orphan 없으면 통과, 있으면 Snackbar ✓

- [ ] **Step 3: 통합 커밋 (Task 1~5)**

```bash
git add frontend/src/view/util/t3composer/wizardState.js \
        frontend/src/view/util/t3composer/LayerRelationCard.jsx \
        frontend/src/view/util/t3composer/LayerRelationsPanel.jsx \
        frontend/src/view/util/t3composer/DataAndFilterStep.jsx \
        frontend/src/view/util/t3composer/ComposerWizard.jsx \
        docs/superpowers/specs/2026-05-25-composer-canvas-phase2d2a-layer-relations-ui-design.md \
        docs/superpowers/plans/2026-05-25-composer-canvas-phase2d2a.md
git commit -m "$(cat <<'EOF'
feat(composer): Phase 2D-2a — Layer 관계 설정 UI

spec.relations[] 데이터 모델 + DataAndFilterStep 우측 보라 패널에 inline 편집기.
4개 모드 (NEW_FROM_COPY 등) 의 master-detail / drill-down 표현 수단 추가.

[데이터 모델]
- spec.relations: [{id, source:{layerKey,event}, target:{layerKey,action}, mapping}]
- createComposerSpec 에 relations:[] 추가.
- removeLayer 가 source/target 참조 관계 자동 정리 (orphan 방지).

[새 export]
- addRelation(spec, init?)    — id 자동, 빈 mapping
- removeRelation(spec, id)
- updateRelation(spec, id, patch)

[UI 신규 컴포넌트]
- LayerRelationCard — source/target layer dropdown + event/action select +
  mapping key/value text pairs + 삭제. self-loop 시 보더 빨강 경고.
- LayerRelationsPanel — DataAndFilterStep 우측 280px 보라 패널. header +
  [+ 관계 추가] + LayerRelationCard list + 빈 상태 안내.

[Trigger event 5종]
cellClick · cellDblClick · selectionChange · valueChange · manual.

[Target action 3종]
refetch · filter · setValue.

[DataAndFilterStep 우측 영역]
column flex wrapper 로 FilterBarInlinePanel (위, 노랑) + LayerRelationsPanel
(아래, 보라) 세로 배치. 폭 280px 동일.

[ComposerWizard 검증]
validateStep('DATA') 에 관계 orphan 검사 추가 — 존재하지 않는 layer 를
참조하면 Snackbar 차단.

[specToInitialPrompt]
placeholder 1줄 추가 — '[Layer 관계 (N개)]' 와 형태 요약. LLM 이 informal
컨텍스트로 해석 가능. 정식 가이드는 Phase 2D-2b.

[Out of scope — 후속 plan]
- 2D-2b: LLM 산출 변환 (spec.relations → JSX onCellClick 패턴 + backend prompt)
- 2D-2c: end-to-end 검증 (실제 화면에서 master row 클릭 → detail 재조회)
- Phase 3b~3e: 다른 모드 (NEW_FROM_COPY 등) 마이그레이션 + 관계 inherit

Spec: docs/superpowers/specs/2026-05-25-composer-canvas-phase2d2a-layer-relations-ui-design.md
Plan: docs/superpowers/plans/2026-05-25-composer-canvas-phase2d2a.md
EOF
)"
```

- [ ] **Step 4: milestone**

```bash
git commit --allow-empty -m "$(cat <<'EOF'
milestone(composer): Phase 2D-2a complete — Layer 관계 UI

spec.relations[] 데이터 모델 + LayerRelationsPanel + LayerRelationCard 신규.
DataAndFilterStep 우측에 통합. ComposerWizard 검증 보강.

[다음]
- 2D-2b: LLM 산출 변환 (onCellClick + zAxios refetch 패턴) + backend prompt
- 2D-2c: end-to-end 검증 (산출 화면에서 master→detail 실제 동작)
- Phase 3b~3e: 다른 모드에 적용

Spec: docs/superpowers/specs/2026-05-25-composer-canvas-phase2d2a-layer-relations-ui-design.md
Plan: docs/superpowers/plans/2026-05-25-composer-canvas-phase2d2a.md
EOF
)"
```

---

## Self-Review

**1. Spec coverage:**

| Spec 요구 | 구현 task |
|---|---|
| spec.relations[] 데이터 모델 | Task 1 Step 1 |
| createComposerSpec relations:[] | Task 1 Step 1 |
| removeLayer 의 relations 정리 | Task 1 Step 2 |
| addRelation/removeRelation/updateRelation export | Task 1 Step 3 |
| specToInitialPrompt placeholder | Task 1 Step 4 |
| LayerRelationCard 컴포넌트 | Task 2 |
| LayerRelationsPanel 컴포넌트 | Task 3 |
| DataAndFilterStep 우측 column flex 통합 | Task 4 |
| ComposerWizard orphan 검사 | Task 5 |
| Trigger 5종 / Action 3종 enum | Task 2 SOURCE_EVENTS/TARGET_ACTIONS |
| self-loop 시각 경고 | Task 2 selfRel 분기 |

**2. Placeholder scan:** 0건. ✓

**3. Type consistency:**
- LayerRelationCard props ↔ LayerRelationsPanel 호출 일치 ✓
- spec.relations[] 구조 ↔ addRelation/updateRelation/removeRelation 반환 일치 ✓
- removeLayer 의 relations filter 키 (`r.source.layerKey` / `r.target.layerKey`) ↔ relation 객체 구조 일치 ✓
- ComposerWizard.validateStep 의 layerKeys Set lookup ↔ spec.layers[].key 일치 ✓

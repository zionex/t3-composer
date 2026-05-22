# Composer Canvas Phase 2E-2 — FilterBar Inline 강화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wizard 의 ② 데이터·검색조건 단계 우측 FilterBar 패널을 popup 없이 **inline 직접 편집** 가능하게 강화한다.

**Architecture:** `FilterBarMiniDialog` 폐기. 신규 `FilterBarInlinePanel` + `FilterFieldCard` 2개 컴포넌트가 우측 280px 패널 안에서 controlled-input 으로 spec 즉시 갱신. `DataAndFilterStep` / `ComposerCanvas` 의 FilterBarMiniDialog 호출처 정리.

**Tech Stack:** React 18 + MUI 5 (TextField/Select/Chip). 테스트 환경 없음 — webpack dev server 시각 검증.

**Spec:** `docs/superpowers/specs/2026-05-22-composer-canvas-phase2e2-filterbar-inline-design.md`
**전제:** Phase 2E-1 완료 (commit `ea16754`).
**Dev 환경**: composer-frontend port 5173. 로그: `docker compose logs --tail=50 composer-frontend`.

---

## File Structure

| 파일 | 변경 종류 | 책임 |
|---|---|---|
| `frontend/src/view/util/t3composer/FilterFieldCard.jsx` | **신규** | 개별 field 카드 — label TextField + type Select + affects chip toggle + 삭제 IconButton |
| `frontend/src/view/util/t3composer/FilterBarInlinePanel.jsx` | **신규** | 우측 280px 패널 전체 — header + [+ 필드 추가] + FilterFieldCard 반복 + 빈 상태 |
| `frontend/src/view/util/t3composer/DataAndFilterStep.jsx` | **수정** | 우측 panel 인라인 코드 (line 86~132) 를 `<FilterBarInlinePanel>` 한 줄로 교체. FilterBarMiniDialog import + state + 호출 제거 |
| `frontend/src/view/util/t3composer/ComposerCanvas.jsx` | **수정** | line 70 import + line 754 호출 제거 (mode='all' 분기에서 dead code) + filterDialogOpen state 제거 |
| `frontend/src/view/util/t3composer/FilterBarMiniDialog.jsx` | **삭제** | 두 호출처 제거 후 파일 자체 삭제 |

**기존 활용 (변경 없음):**
- `wizardState.js` 의 `spec.filterBar.items` / `spec.filterBar.affects` 구조 — 동일 데이터 흐름
- FILTER_TYPES 상수 — `FilterFieldCard` 로 이동

---

## Task 1: FilterFieldCard — 개별 field 카드 컴포넌트

**Files:**
- Create: `frontend/src/view/util/t3composer/FilterFieldCard.jsx`

- [ ] **Step 1: 신규 파일 작성**

`frontend/src/view/util/t3composer/FilterFieldCard.jsx`:

```jsx
/**
 * FilterFieldCard — FilterBar 의 개별 필드 카드 (inline 편집).
 *   상위 FilterBarInlinePanel 이 controlled props 로 호출.
 *
 *   props:
 *     field           {key, label, type}  spec.filterBar.items[i]
 *     layers          spec.layers (chip 노출용)
 *     affectsForField { [layerKey]: boolean }  이 필드가 영향 주는 layer 매핑
 *     onUpdate(patch) field 의 label/type 변경
 *     onRemove()      이 필드 삭제
 *     onToggleAffect(layerKey)  영향 토글
 *
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e2.md (Task 1)
 *   Spec: docs/superpowers/specs/2026-05-22-composer-canvas-phase2e2-filterbar-inline-design.md
 */
import React from 'react';
import {
  Box, TextField, Select, MenuItem, FormControl, IconButton,
  Chip, Stack, Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutline';

export const FILTER_TYPES = [
  { value: 'TEXT',                 label: 'TEXT' },
  { value: 'NUMBER',               label: 'NUMBER' },
  { value: 'SELECT',               label: 'SELECT' },
  { value: 'DATE_RANGE',           label: 'DATE_RANGE' },
  { value: 'DOMAIN_PLAN_SCOPE',    label: 'DOMAIN_PLAN_SCOPE' },
  { value: 'DOMAIN_ITEM_MULTI',    label: 'DOMAIN_ITEM_MULTI' },
  { value: 'DOMAIN_ACCOUNT_MULTI', label: 'DOMAIN_ACCOUNT_MULTI' },
  { value: 'DOMAIN_LOCATION_MULTI',label: 'DOMAIN_LOCATION_MULTI' },
  { value: 'DOMAIN_VERSION',       label: 'DOMAIN_VERSION' },
];

function FilterFieldCard({ field, layers, affectsForField, onUpdate, onRemove, onToggleAffect }) {
  return (
    <Box sx={{
      bgcolor: '#fff', border: '1px solid #fbbf24', borderRadius: 1,
      p: 1, display: 'flex', flexDirection: 'column', gap: 0.7,
    }}>
      {/* 1행: label + 삭제 */}
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <TextField
          value={field.label || ''}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="라벨"
          size="small" variant="standard" fullWidth
          inputProps={{ style: { fontSize: 12, fontWeight: 700, color: '#92400e' } }}
        />
        <IconButton size="small" onClick={onRemove} sx={{ p: 0.3 }}>
          <DeleteIcon fontSize="small" sx={{ color: '#ef4444' }} />
        </IconButton>
      </Stack>

      {/* 2행: type */}
      <FormControl size="small" variant="standard" fullWidth>
        <Select
          value={field.type || 'TEXT'}
          onChange={(e) => onUpdate({ type: e.target.value })}
          sx={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}
        >
          {FILTER_TYPES.map((t) => (
            <MenuItem key={t.value} value={t.value} sx={{ fontSize: 11, fontFamily: 'monospace' }}>
              {t.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* 3행: 영향 chip 들 */}
      {layers.length > 0 && (
        <Box sx={{ mt: 0.3 }}>
          <Typography variant="caption" sx={{ fontSize: 10, color: '#92400e', mr: 0.5 }}>
            영향:
          </Typography>
          <Stack direction="row" spacing={0.3} flexWrap="wrap" useFlexGap sx={{ mt: 0.3 }}>
            {layers.map((l) => {
              const checked = !!affectsForField[l.key];
              return (
                <Chip
                  key={l.key}
                  label={l.title || l.key}
                  size="small"
                  onClick={() => onToggleAffect(l.key)}
                  sx={{
                    fontSize: 10, height: 18, cursor: 'pointer',
                    bgcolor: checked ? '#92400e' : '#fef3c7',
                    color: checked ? '#fff' : '#92400e',
                    border: checked ? 'none' : '1px dashed #fbbf24',
                    fontWeight: 700,
                    '&:hover': {
                      bgcolor: checked ? '#78350f' : '#fde68a',
                    },
                  }}
                />
              );
            })}
          </Stack>
        </Box>
      )}
    </Box>
  );
}

export default FilterFieldCard;
```

- [ ] **Step 2: 컴파일 확인 (참조처 없어도 unused import 만 — 통과)**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|SyntaxError" | head -5`
Expected: 0건.

---

## Task 2: FilterBarInlinePanel — 우측 패널 전체 컴포넌트

**Files:**
- Create: `frontend/src/view/util/t3composer/FilterBarInlinePanel.jsx`

- [ ] **Step 1: 신규 파일 작성**

`frontend/src/view/util/t3composer/FilterBarInlinePanel.jsx`:

```jsx
/**
 * FilterBarInlinePanel — DataAndFilterStep 의 우측 FilterBar 패널 (inline 편집).
 *   FilterBarMiniDialog popup 대체.
 *
 *   props:
 *     spec     ComposerSpec
 *     onChange(nextSpec)  spec 갱신
 *
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e2.md (Task 2)
 *   Spec: docs/superpowers/specs/2026-05-22-composer-canvas-phase2e2-filterbar-inline-design.md
 */
import React from 'react';
import { Box, Stack, Typography, Button } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';

import FilterFieldCard from './FilterFieldCard';

function FilterBarInlinePanel({ spec, onChange }) {
  const items   = spec?.filterBar?.items   || [];
  const affects = spec?.filterBar?.affects || {};
  const layers  = spec?.layers || [];

  const updateFilterBar = (patch) => {
    onChange({
      ...spec,
      filterBar: { ...(spec?.filterBar || {}), ...patch },
    });
  };

  const handleAddField = () => {
    const newKey = `field_${Date.now().toString(36)}`;
    const nextItems = [...items, { key: newKey, label: '새 필드', type: 'TEXT' }];
    // default 로 모든 layer 영향 매핑 체크 (f8d675f 정책 유지)
    const nextAffects = { ...affects };
    layers.forEach((l) => {
      const cur = nextAffects[l.key] || [];
      if (!cur.includes(newKey)) nextAffects[l.key] = [...cur, newKey];
    });
    updateFilterBar({ items: nextItems, affects: nextAffects });
  };

  const handleRemoveField = (idx) => {
    const removedKey = items[idx]?.key;
    const nextItems = items.filter((_, i) => i !== idx);
    const nextAffects = {};
    Object.entries(affects).forEach(([lk, fks]) => {
      nextAffects[lk] = (fks || []).filter((k) => k !== removedKey);
    });
    updateFilterBar({ items: nextItems, affects: nextAffects });
  };

  const handleUpdateField = (idx, patch) => {
    const nextItems = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    updateFilterBar({ items: nextItems });
  };

  const handleToggleAffect = (layerKey, fieldKey) => {
    const cur = affects[layerKey] || [];
    const next = cur.includes(fieldKey)
      ? cur.filter((k) => k !== fieldKey)
      : [...cur, fieldKey];
    updateFilterBar({ affects: { ...affects, [layerKey]: next } });
  };

  return (
    <Box sx={{
      flexShrink: 0, width: 280,
      display: 'flex', flexDirection: 'column', gap: 1,
      bgcolor: '#fef9c3', border: '2px solid #f59e0b', borderRadius: 1.5,
      p: 1.5, overflow: 'auto',
    }}>
      {/* header */}
      <Stack direction="row" alignItems="center" spacing={0.8}>
        <FilterListIcon sx={{ fontSize: 18, color: '#92400e' }} />
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400e', flex: 1 }}>
          🔍 FilterBar (검색조건)
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon fontSize="small" />}
          onClick={handleAddField}
          sx={{ fontSize: 11, color: '#92400e' }}
        >
          필드 추가
        </Button>
      </Stack>

      {/* 빈 상태 */}
      {items.length === 0 && (
        <Typography variant="caption" sx={{
          color: '#92400e', fontStyle: 'italic', textAlign: 'center', py: 2,
        }}>
          필드 없음 — [+ 필드 추가] 클릭
        </Typography>
      )}

      {/* field 카드 list */}
      {items.map((field, idx) => {
        const affectsForField = {};
        layers.forEach((l) => {
          affectsForField[l.key] = (affects[l.key] || []).includes(field.key);
        });
        return (
          <FilterFieldCard
            key={field.key}
            field={field}
            layers={layers}
            affectsForField={affectsForField}
            onUpdate={(patch) => handleUpdateField(idx, patch)}
            onRemove={() => handleRemoveField(idx)}
            onToggleAffect={(layerKey) => handleToggleAffect(layerKey, field.key)}
          />
        );
      })}
    </Box>
  );
}

export default FilterBarInlinePanel;
```

- [ ] **Step 2: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|SyntaxError" | head -5`
Expected: 0건.

---

## Task 3: DataAndFilterStep — inline panel 호출로 교체

**Files:**
- Modify: `frontend/src/view/util/t3composer/DataAndFilterStep.jsx`

- [ ] **Step 1: import 정리**

기존 (line 8~14):
```jsx
import { Box, Typography, Stack, Chip, Button } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';

import DataMiniDialog from './DataMiniDialog';
import FilterBarMiniDialog from './FilterBarMiniDialog';
```

→ 다음으로 교체:
```jsx
import { Box, Typography, Stack, Chip } from '@mui/material';

import DataMiniDialog from './DataMiniDialog';
import FilterBarInlinePanel from './FilterBarInlinePanel';
```

(`Button`/`FilterListIcon`/`AddIcon` 은 우측 패널 인라인 코드와 함께 제거 — 더 이상 직접 사용 안 함. left side header 의 emoji 만 사용)

- [ ] **Step 2: filterDialogOpen state 제거**

기존:
```jsx
function DataAndFilterStep({ spec, onChange, targetCd }) {
  const [editingLayerKey, setEditingLayerKey] = useState(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const layers = spec?.layers || [];
  const filterItems = spec?.filterBar?.items || [];
  const editingLayer = layers.find((l) => l.key === editingLayerKey) || null;
```

→ 다음으로 교체:
```jsx
function DataAndFilterStep({ spec, onChange, targetCd }) {
  const [editingLayerKey, setEditingLayerKey] = useState(null);

  const layers = spec?.layers || [];
  const editingLayer = layers.find((l) => l.key === editingLayerKey) || null;
```

(`filterItems` 도 제거 — 우측 패널이 자체 관리)

- [ ] **Step 3: 우측 panel 코드 (line 86~132) 통째 교체**

기존 86~132 라인의 `<Box sx={...우측 패널...}>` 블록 전체를 다음 한 줄로:

```jsx
      <FilterBarInlinePanel spec={spec} onChange={onChange} />
```

- [ ] **Step 4: FilterBarMiniDialog 호출 제거 (Dialogs 섹션)**

기존 (line 142~147):
```jsx
      <FilterBarMiniDialog
        open={filterDialogOpen}
        spec={spec}
        onClose={() => setFilterDialogOpen(false)}
        onApply={(nextSpec) => onChange(nextSpec)}
      />
```

→ 통째 삭제.

- [ ] **Step 5: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|SyntaxError" | head -5`
Expected: 0건.

- [ ] **Step 6: 브라우저 시각 검증 (선택 — Task 4·5 합쳐서 한 번에 검증해도 무방)**

`http://localhost:5173` → 패턴 선택 → ② 데이터·검색조건 단계:
- 우측 노란 패널에 [필드 추가] 버튼 노출 ✓
- 클릭 시 즉시 새 카드 추가 (라벨/Type/영향 chip) ✓
- 라벨 텍스트 변경 → spec 즉시 반영 ✓
- Type 변경 → spec 즉시 반영 ✓
- 영향 chip 클릭 → 색 토글 ✓
- 삭제 아이콘 → 카드 사라짐 ✓

---

## Task 4: ComposerCanvas — FilterBarMiniDialog 호출 제거

**Files:**
- Modify: `frontend/src/view/util/t3composer/ComposerCanvas.jsx`

**배경:** ComposerCanvas 의 mode='all' 분기에서 FilterBar 노란 띠 click → FilterBarMiniDialog 였음. Phase 2E-1 이후 ComposerCanvas 의 유일 호출처는 LayoutStep (mode='layout') 이라 mode='all' 분기는 dead code. FilterBarMiniDialog 파일 삭제를 위해 이 호출도 정리.

- [ ] **Step 1: filterDialogOpen state + FilterBarMiniDialog 호출 위치 확인**

Run: `grep -n "filterDialogOpen\|FilterBarMiniDialog" /Users/hej/work/projects/t3-composer/frontend/src/view/util/t3composer/ComposerCanvas.jsx`
Expected: 4건 (import + state declare + onClick + render).

- [ ] **Step 2: FilterBarMiniDialog import 제거 (line 70 부근)**

기존:
```jsx
import FilterBarMiniDialog from './FilterBarMiniDialog';
```
→ 통째 삭제.

- [ ] **Step 3: filterDialogOpen state 제거**

기존 (line 70~80 부근 어딘가):
```jsx
const [filterDialogOpen, setFilterDialogOpen] = useState(false);
```
→ 통째 삭제.

- [ ] **Step 4: FilterBar 노란 띠 onClick 핸들러를 readOnly 처럼 disable**

mode='all' 분기의 FilterBar 띠 `<Box onClick={...setFilterDialogOpen(true)}>` 를 찾아 onClick 자체를 제거 (또는 `undefined`).

mode='all' 호출처가 더 이상 없으므로 단순 정리:
```jsx
{mode === 'all' && (
  <Box
    onClick={undefined}      // mode='all' 호출처 dead — onClick 제거
    sx={{ ... cursor 도 default 로 ... }}
  >
    🔍 FilterBar (검색조건) — Phase 2E-2 이후 우측 inline panel 로 이동
  </Box>
)}
```

(실제 코드는 ComposerCanvas 의 현재 mode='all' 분기 패턴 확인 후 적용 — Step 6 의 grep 결과로 정확한 줄 파악)

- [ ] **Step 5: render 위치의 `<FilterBarMiniDialog .../>` 호출 통째 삭제**

기존 (line 754 부근):
```jsx
<FilterBarMiniDialog
  open={filterDialogOpen}
  spec={spec}
  onClose={() => setFilterDialogOpen(false)}
  onApply={(nextSpec) => onChange(nextSpec)}
/>
```
→ 통째 삭제.

- [ ] **Step 6: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError" | head -5`
Expected: 0건.

---

## Task 5: FilterBarMiniDialog.jsx 파일 삭제

**Files:**
- Delete: `frontend/src/view/util/t3composer/FilterBarMiniDialog.jsx`

- [ ] **Step 1: 모든 호출처 제거 확인**

Run: `grep -rn "FilterBarMiniDialog" /Users/hej/work/projects/t3-composer/frontend/src/ 2>/dev/null | grep -v "FilterBarMiniDialog.jsx:"`
Expected: 0건 (자기 자신 외 참조 없음). wizardState.js 의 주석은 매칭되지만 코드가 아니므로 무시 OK — 다음 단계에서 갱신.

- [ ] **Step 2: wizardState.js 주석 갱신**

`frontend/src/view/util/t3composer/wizardState.js` line 2590 부근:

기존:
```js
base.filterBar.items = [];  // 사용자가 FilterBarMiniDialog 로 채움
```

→ 다음으로 교체:
```js
base.filterBar.items = [];  // 사용자가 FilterBarInlinePanel (DataAndFilterStep 우측) 에서 채움
```

- [ ] **Step 3: 파일 삭제**

Run: `rm /Users/hej/work/projects/t3-composer/frontend/src/view/util/t3composer/FilterBarMiniDialog.jsx`
Expected: 명령 성공 (출력 없음).

- [ ] **Step 4: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError" | head -10`
Expected: 0건.

- [ ] **Step 5: Task 3·4·5 통합 커밋**

```bash
git add frontend/src/view/util/t3composer/FilterFieldCard.jsx \
        frontend/src/view/util/t3composer/FilterBarInlinePanel.jsx \
        frontend/src/view/util/t3composer/DataAndFilterStep.jsx \
        frontend/src/view/util/t3composer/ComposerCanvas.jsx \
        frontend/src/view/util/t3composer/wizardState.js
git rm frontend/src/view/util/t3composer/FilterBarMiniDialog.jsx
git commit -m "$(cat <<'EOF'
feat(composer): Phase 2E-2 — FilterBar inline 강화

popup (FilterBarMiniDialog) 폐기 — DataAndFilterStep 우측 패널이 자체 inline editor.

[신규]
- FilterFieldCard — 개별 field 카드 (label TextField + type Select +
  영향 chip toggle + 삭제). controlled props 로 onUpdate/onRemove/onToggleAffect 위임.
- FilterBarInlinePanel — 우측 280px 패널 전체. header + [+ 필드 추가] +
  FilterFieldCard 반복 + 빈 상태. 모든 변경 즉시 onChange(spec) 발화.

[수정]
- DataAndFilterStep — 우측 panel 인라인 코드 (line 86~132) 를
  '<FilterBarInlinePanel spec onChange/>' 한 줄로 교체.
  FilterBarMiniDialog import/state/호출 제거.
- ComposerCanvas — mode='all' 분기의 FilterBarMiniDialog import/state/호출 제거
  (LayoutStep 의 mode='layout' 이 유일 호출처라 dead code 였음).
- wizardState.js — 주석을 'FilterBarMiniDialog' → 'FilterBarInlinePanel' 로 갱신.

[삭제]
- FilterBarMiniDialog.jsx — 두 호출처 모두 제거됐으므로 파일 삭제.

[데이터 흐름]
spec.filterBar.{items,affects} 구조 변경 없음. controlled inputs 가 매 변경마다
직접 onChange 호출 → 부모 (ComposerWizard) state 즉시 갱신.

[default 영향 매핑]
새 필드 추가 시 모든 layer 의 affects 에 newKey 자동 push (f8d675f 정책 유지).

Spec: docs/superpowers/specs/2026-05-22-composer-canvas-phase2e2-filterbar-inline-design.md
Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e2.md
EOF
)"
```

---

## Task 6: 통합 smoke + Phase 2E-2 milestone

**Files:** (변경 없음)

- [ ] **Step 1: 전체 컴파일 healthcheck**

Run: `docker compose logs --tail=80 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError|Failed to compile" | head -10`
Expected: 0건.

- [ ] **Step 2: end-to-end 시각 검증**

브라우저 `http://localhost:5173`:

1. ModeSelector → "단계별 생성" → "빈 캔버스 (P02)" → Wizard 진입 ✓
2. ② 데이터·검색조건 단계 → 우측 노란 패널에 [필드 추가] 버튼 ✓
3. [필드 추가] 클릭 → 카드 즉시 추가 (라벨 '새 필드' + Type TEXT + 모든 layer 영향 체크) ✓
4. 라벨 텍스트 입력 → 즉시 반영 (다른 단계로 갔다 와도 유지) ✓
5. Type dropdown 변경 → 즉시 반영 ✓
6. 영향 chip 클릭 → 색 토글 (선택=짙은 갈색·미선택=연한 노랑) ✓
7. 삭제 아이콘 → 카드 사라짐 + affects 정리 ✓
8. 좌측 layer 카드 클릭 → DataMiniDialog 정상 (기존 동작 유지) ✓
9. ① Layout 단계 진입 → ComposerCanvas mode='layout' 정상 (FilterBar 노란 띠 숨김 유지) ✓
10. ④ 화면 생성 진입 → ComposerWorkspace 정상 (Phase 2E-1 동작 유지) ✓

- [ ] **Step 3: Phase 2E-2 종료 commit**

```bash
git commit --allow-empty -m "$(cat <<'EOF'
milestone(composer): Phase 2E-2 complete — FilterBar inline editor

popup (FilterBarMiniDialog) 폐기 — DataAndFilterStep 우측 패널이 자체 inline editor.

[효과]
- 사용자가 [편집] 버튼 → popup 4-step 행동 없이 우측 패널에서 직접 편집.
- 모든 변경 즉시 spec 반영 — popup [적용] 버튼 폐기.
- 영향 매핑이 field 카드 안 inline chip — Layer × Field 격자 테이블 폐기 (좁은
  패널에 자연스러움).

[Commits]
- (Spec)        5a29eca — design doc
- (Task 1~6)    feat — FilterFieldCard + FilterBarInlinePanel + DataAndFilterStep
                       + ComposerCanvas 정리 + FilterBarMiniDialog 삭제

[다음 단계]
- Phase 2E-3: ScreenMetaDialog 제거 + ComposerCanvas mode='layout' 미완성 정리
- Phase 2D-2: Layer 간 관계 설정 (master-detail / drill-down)
- Phase 3: 9-Step Wizard 코드 제거

Spec: docs/superpowers/specs/2026-05-22-composer-canvas-phase2e2-filterbar-inline-design.md
Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e2.md
EOF
)"
```

---

## Self-Review

**1. Spec coverage:**

| Spec 요구 | 구현 task |
|---|---|
| FilterBarInlinePanel 신규 | Task 2 |
| FilterFieldCard 신규 | Task 1 |
| DataAndFilterStep 우측 panel inline 교체 | Task 3 |
| FilterBarMiniDialog 파일 삭제 | Task 5 |
| ComposerCanvas 의 FilterBarMiniDialog 호출 정리 | Task 4 |
| 모든 변경 즉시 onChange (controlled input) | Task 1/2 코드 패턴 |
| 영향 chip toggle (Layer × Field 격자 폐기) | Task 1 의 3행 chip row |
| 새 필드 추가 시 모든 layer affects default ✓ | Task 2 의 handleAddField |
| FILTER_TYPES 상수 이동 | Task 1 (FilterFieldCard.jsx 안에서 export) |
| 빈 상태 안내 | Task 2 |

**2. Placeholder scan:** "TBD"/"implement later" 0건. ✓

**3. Type consistency:**
- `FilterFieldCard` props 시그니처 (`field`, `layers`, `affectsForField`, `onUpdate`, `onRemove`, `onToggleAffect`) — Task 1 정의 ↔ Task 2 호출 일치 ✓
- `FilterBarInlinePanel` props (`spec`, `onChange`) — Task 2 정의 ↔ Task 3 호출 일치 ✓
- `affectsForField` 는 `{ [layerKey]: boolean }` 형태 — Task 2 의 `layers.forEach((l) => { affectsForField[l.key] = (affects[l.key] || []).includes(field.key); })` ↔ Task 1 의 `affectsForField[l.key]` 일치 ✓
- `spec.filterBar.items` / `spec.filterBar.affects` 데이터 구조 — wizardState.js 의 기존 정의 일치 ✓

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-22-composer-canvas-phase2e2.md`.** 사용자가 전체 위임했으므로 **Inline Execution** 으로 진행 — 다음 발화에서 `superpowers:executing-plans` 호출.

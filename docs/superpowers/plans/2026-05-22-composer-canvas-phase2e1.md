# Composer Canvas (Phase 2E-1 — Wizard 골격) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ComposerCanvas 단일 화면을 **4단계 Wizard 골격** (Layout / 데이터·검색조건 / 메타·메뉴 / 화면 생성) 으로 wrap 하고 단계 자유 이동 가능하게 한다. FilterBar inline 강화 (2E-2) · ComposerCanvas mode prop 의 완성 (2E-3) 은 후속 plan 으로 분리.

**Architecture:** 신규 `ComposerWizard` 가 4개 step 컴포넌트 (`LayoutStep` · `DataAndFilterStep` · `MetaStep` · `GenerateStep`) 를 분기 렌더 + 상단 Stepper + 하단 Footer (← 이전 / 다음 →). spec state 는 ComposerWizard 가 single source of truth. ModeNewStep 의 CANVAS / WORKSPACE 분기 로직을 ComposerWizard / GenerateStep 으로 이전. ComposerCanvas 는 `mode='layout'` prop 추가 (Phase 2E-3 의 일부 — LayoutStep 동작에 필수).

**Tech Stack:** React 18 + MUI 5 + 기존 ComposerCanvas / ScreenMetaDialog / ComposerWorkspace / FilterBarMiniDialog 재활용. 테스트 환경 없음 — webpack 빌드 + dev server 시각 검증.

**Spec:** `docs/superpowers/specs/2026-05-22-composer-canvas-wizard-redesign-design.md`
**전제:** Phase 2D-1 (commit 3d378b0) 머지된 상태.

**Dev 환경**: composer-frontend port 5173. 로그: `docker compose logs --tail=50 composer-frontend`.

---

## File Structure

| 파일 | 변경 종류 | 책임 |
|---|---|---|
| `frontend/src/view/util/t3composer/ComposerCanvas.jsx` | **mode prop 추가** | `mode='layout'` 일 때 FilterBar 노란 띠 + [메뉴/메타] 버튼 + 그 chip 숨김 (해당 단계 별도). default `mode='all'` 일 때 기존 동작 (다른 곳에서 사용 시 회귀 없음) |
| `frontend/src/view/util/t3composer/ComposerWizard.jsx` | **신규** | 4단계 wrapper. step state + Stepper + Footer + step 별 분기 |
| `frontend/src/view/util/t3composer/LayoutStep.jsx` | **신규** | 단순 wrap — `<ComposerCanvas mode='layout' ...>` 만 호출 |
| `frontend/src/view/util/t3composer/DataAndFilterStep.jsx` | **신규** | 좌측 layer 카드 stacked list (클릭 → 기존 DataMiniDialog) + 우측 FilterBar 카드 list (클릭 → 기존 FilterBarMiniDialog). 2E-1 은 단순 버전 (inline panel 강화는 2E-2) |
| `frontend/src/view/util/t3composer/MetaStep.jsx` | **신규** | ScreenMetaDialog 의 본문을 inline form 으로. 부모 메뉴 picker 는 MenuPickerDialog popup 으로 유지 |
| `frontend/src/view/util/t3composer/GenerateStep.jsx` | **신규** | ModeNewStep 의 기존 WORKSPACE 분기 로직 이전 (createSession + ComposerWorkspace 임베드 + extraHeader) |
| `frontend/src/view/util/t3composer/ModeNewStep.jsx` | **단순화** | stage='CANVAS' 분기를 `<ComposerWizard>` 호출로 교체. WORKSPACE 단계 분기는 GenerateStep 으로 이전됐으므로 제거. CANVAS 단계 안에서 step 이동 (단계 변경 시 stage 변경 X) |

**기존 활용 (변경 없음):**
- `ComposerCanvas` 의 모든 기능 (Phase 1.5 의 RGL drag/resize + Container nested)
- `DataMiniDialog` / `FilterBarMiniDialog` / `ScreenMetaDialog` 의 popup 모드 (자세한 입력)
- `MenuPickerDialog` (targetCd prop · Phase 2D-1 의 Task 1)
- `ComposerWorkspace` (Phase 2C end-to-end)
- `specToInitialPrompt` (Phase 2C)
- `createSession` API

**Phase 2E-1 범위 외 (별도 plan):**
- **2E-2**: FilterBar 의 진짜 inline 강화 (현재 DataAndFilterStep 은 우측에 FilterBar 카드 list 만 — 클릭 시 mini dialog popup. 2E-2 에서 popup 없이 panel 안에서 직접 편집)
- **2E-3**: ScreenMetaDialog 와 헤더 [메뉴/메타] 버튼 정리 (현재는 mode='layout' 으로 숨길 뿐 — 실제 코드 제거는 2E-3)

---

## Task 1: ComposerCanvas — `mode` prop 추가 + FilterBar/[메뉴/메타] 조건 숨김

**Files:**
- Modify: `frontend/src/view/util/t3composer/ComposerCanvas.jsx`

**배경:** LayoutStep 안에서 ComposerCanvas 를 호출할 때, FilterBar 노란 띠 + [메뉴/메타] 버튼 + 그 chip 은 다른 단계 (DataAndFilterStep / MetaStep) 에서 처리하므로 숨겨야 함. `mode='layout'` prop 추가 — default 는 `'all'` (기존 동작).

- [ ] **Step 1: 함수 시그니처에 mode prop 추가**

기존:
```jsx
function ComposerCanvas({ spec, onChange, readOnly = false, targetCd, onOpenDataSourcePicker, onCreate }) {
```

→ 다음으로 교체:
```jsx
function ComposerCanvas({
  spec, onChange, readOnly = false, targetCd, onOpenDataSourcePicker, onCreate,
  mode = 'all',  // 'all' (기존) | 'layout' (LayoutStep 전용 — FilterBar/메타/생성 숨김)
}) {
```

- [ ] **Step 2: 헤더 영역에 mode 분기 조건 추가**

헤더 액션 영역 (`{!readOnly && (...)}` 안) 의 각 요소에 mode 조건:

기존 헤더 안:
```jsx
{spec?.meta && (
  <Chip ... />
)}
<Button ... onClick={() => setMetaDialogOpen(true)}> 메뉴/메타 </Button>
<Button ... onClick={(e) => setAddAnchor(e.currentTarget)}> Layer </Button>
...
{onCreate && (
  <Button ...> 화면 생성 </Button>
)}
```

→ 각 요소를 mode 조건으로 감쌈:
```jsx
{/* 메타 chip + [메뉴/메타] 버튼 — mode='all' 에서만 (LayoutStep 은 별도 MetaStep 사용) */}
{mode === 'all' && spec?.meta && (
  <Chip ... />
)}
{mode === 'all' && (
  <Button ... onClick={() => setMetaDialogOpen(true)}> 메뉴/메타 </Button>
)}

{/* [+ Layer] 는 항상 노출 (LayoutStep 에서도 필요) */}
<Button ... onClick={(e) => setAddAnchor(e.currentTarget)}> Layer </Button>
...

{/* [화면 생성] — mode='all' 에서만 (LayoutStep 은 별도 GenerateStep) */}
{mode === 'all' && onCreate && (
  <Button ...> 화면 생성 </Button>
)}
```

- [ ] **Step 3: FilterBar 노란 띠도 mode 조건으로**

기존 FilterBar 노란 띠 (`<Box onClick={...setFilterDialogOpen...}>`) 를 mode 분기로 감쌈:

기존:
```jsx
{/* ───── FilterBar 노란 띠 ───── */}
<Box
  onClick={readOnly ? undefined : () => setFilterDialogOpen(true)}
  sx={{ ... }}
>
  ...
</Box>
```

→ 다음으로 교체:
```jsx
{/* ───── FilterBar 노란 띠 — mode='all' 에서만 (LayoutStep 은 DataAndFilterStep 으로 분리) ───── */}
{mode === 'all' && (
  <Box
    onClick={readOnly ? undefined : () => setFilterDialogOpen(true)}
    sx={{ ... }}
  >
    ...
  </Box>
)}
```

- [ ] **Step 4: 컴파일 확인**

Run: `docker compose logs --tail=20 composer-frontend 2>&1 | grep -iE "ERROR in|SyntaxError" | head -5`
Expected: 0건.

- [ ] **Step 5: commit**

```bash
git add frontend/src/view/util/t3composer/ComposerCanvas.jsx
git commit -m "$(cat <<'EOF'
feat(composer): ComposerCanvas — mode prop ('all' | 'layout')

Phase 2E-1 의 LayoutStep 에서 단순 wrap 으로 사용하기 위해.

[mode='layout' 일 때 숨김]
- FilterBar 노란 띠 (DataAndFilterStep 으로 이전)
- [메뉴/메타] 버튼 + 메타 chip (MetaStep 으로 이전)
- [화면 생성] 버튼 (GenerateStep 으로 이전)

[mode='all' (default)]
기존 동작 유지 — 다른 호출처 (현재는 ModeNewStep 만) 회귀 없음.

Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e1.md (Task 1)
EOF
)"
```

---

## Task 2: ComposerWizard 신규 — 4단계 wrapper

**Files:**
- Create: `frontend/src/view/util/t3composer/ComposerWizard.jsx`

**배경:** spec state 의 single source of truth + 상단 Stepper + 하단 Footer + step 분기.

- [ ] **Step 1: 신규 파일 작성**

`frontend/src/view/util/t3composer/ComposerWizard.jsx`:

```jsx
/**
 * ComposerWizard — ComposerCanvas 4단계 wrapper.
 *
 *   props:
 *     initialSpec    ComposerSpec (mockup/uipattern picker 또는 빈 spec 으로 진입)
 *     targetCd       활성 Target — Step 들이 prop chain 으로 받음
 *     onBack         "← 뒤로" — picker 단계로 돌아갈 콜백 (ModeNewStep 가 PICK 단계 복귀)
 *
 *   stage:
 *     ① 'LAYOUT'   — 패턴 + Layer 자유 편집
 *     ② 'DATA'     — 데이터 + FilterBar
 *     ③ 'META'     — 화면 제목 / 메뉴 코드 / 부모 메뉴
 *     ④ 'GENERATE' — Claude 호출 + ComposerWorkspace 임베드
 *
 *   spec: docs/superpowers/specs/2026-05-22-composer-canvas-wizard-redesign-design.md
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e1.md (Task 2)
 */
import React, { useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowBackIcon    from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import LayoutStep        from './LayoutStep';
import DataAndFilterStep from './DataAndFilterStep';
import MetaStep          from './MetaStep';
import GenerateStep      from './GenerateStep';

const STEPS = [
  { id: 'LAYOUT',   label: '① Layout',         color: '#16a34a', bg: '#f0fdf4', border: '#16a34a' },
  { id: 'DATA',     label: '② 데이터·검색조건', color: '#713f12', bg: '#fef9c3', border: '#facc15' },
  { id: 'META',     label: '③ 메타·메뉴',      color: '#1e40af', bg: '#eff6ff', border: '#2563eb' },
  { id: 'GENERATE', label: '④ 화면 생성',      color: '#5b21b6', bg: '#f5f3ff', border: '#9D8FD4' },
];

function ComposerWizard({ initialSpec, targetCd, onBack }) {
  const [spec, setSpec] = useState(initialSpec);
  const [step, setStep] = useState('LAYOUT');

  const curIdx = STEPS.findIndex((s) => s.id === step);
  const isFirst = curIdx === 0;
  const isLast  = curIdx === STEPS.length - 1;

  const goPrev = () => { if (!isFirst) setStep(STEPS[curIdx - 1].id); };
  const goNext = () => { if (!isLast)  setStep(STEPS[curIdx + 1].id); };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* ── 상단 헤더 (뒤로 + 현재 spec 메타 hint) ── */}
      <Stack direction="row" alignItems="center" spacing={1}
             sx={{ p: 1, borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={onBack}>
          패턴 다시 선택
        </Button>
        <Typography variant="caption" sx={{ color: '#64748b', ml: 1 }}>
          pattern: <b>{spec?.meta?.pattern || 'BLANK'}</b>
          {spec?.meta?.menuCd && (
            <> · menu: <b>{spec.meta.menuCd}</b></>
          )}
        </Typography>
      </Stack>

      {/* ── Stepper ── */}
      <Box sx={{ p: 1.2, borderBottom: '1px solid #e2e8f0', flexShrink: 0,
                 display: 'flex', gap: 1, alignItems: 'center', bgcolor: '#fafafa' }}>
        {STEPS.map((s, i) => {
          const active = s.id === step;
          return (
            <React.Fragment key={s.id}>
              <Box
                onClick={() => setStep(s.id)}
                sx={{
                  flex: 1, py: 1, px: 1.5, borderRadius: 1.5,
                  cursor: 'pointer',
                  bgcolor: active ? s.bg : '#fff',
                  border: active ? `2px solid ${s.border}` : '1px solid #cbd5e1',
                  color: active ? s.color : '#64748b',
                  fontWeight: active ? 800 : 600,
                  fontSize: 12, textAlign: 'center',
                  transition: 'all 0.15s ease',
                  '&:hover': active ? {} : { bgcolor: '#f1f5f9', borderColor: '#94a3b8' },
                }}
              >
                {s.label}
              </Box>
              {i < STEPS.length - 1 && (
                <Box sx={{ color: '#cbd5e1', flexShrink: 0 }}>›</Box>
              )}
            </React.Fragment>
          );
        })}
      </Box>

      {/* ── Step 본문 ── */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 1.5 }}>
        {step === 'LAYOUT'   && <LayoutStep        spec={spec} onChange={setSpec} targetCd={targetCd} />}
        {step === 'DATA'     && <DataAndFilterStep spec={spec} onChange={setSpec} targetCd={targetCd} />}
        {step === 'META'     && <MetaStep          spec={spec} onChange={setSpec} targetCd={targetCd} />}
        {step === 'GENERATE' && <GenerateStep      spec={spec}                     targetCd={targetCd} onBackToWizard={() => setStep('META')} />}
      </Box>

      {/* ── Footer (← 이전 / 다음 →) — GENERATE 단계에서는 숨김 ── */}
      {step !== 'GENERATE' && (
        <Stack direction="row" spacing={1} sx={{
          p: 1, borderTop: '1px solid #e2e8f0', flexShrink: 0,
          bgcolor: '#fafafa', justifyContent: 'space-between',
        }}>
          <Button
            size="small" variant="outlined"
            startIcon={<ArrowBackIcon fontSize="small" />}
            onClick={goPrev} disabled={isFirst}
          >
            이전
          </Button>
          <Button
            size="small" variant="contained"
            endIcon={<ArrowForwardIcon fontSize="small" />}
            onClick={goNext}
            sx={{
              bgcolor: STEPS[curIdx + 1]?.border || '#2563eb',
              '&:hover': { bgcolor: STEPS[curIdx + 1]?.border || '#1d4ed8', opacity: 0.85 },
              fontWeight: 700,
            }}
          >
            다음: {STEPS[curIdx + 1]?.label.replace(/^[①②③④]\s*/, '') || '끝'}
          </Button>
        </Stack>
      )}
    </Box>
  );
}

export default ComposerWizard;
```

- [ ] **Step 2: 컴파일 확인 (Step 컴포넌트들 import 실패 예정 — Task 3-6 에서 작성됨)**

Run: `docker compose logs --tail=20 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found" | head -5`
Expected: `Module not found: ./LayoutStep` 등 4개 — Task 3-6 진행 후 사라짐.

⚠️ **이 단계에서는 컴파일 실패 정상**. 다음 task 들 마치고 통과.

- [ ] **Step 3: commit (Step 컴포넌트 작성 후 함께)**

이 commit 은 Task 6 통과 후 함께 묶어서 진행 (Task 6 의 commit step 참조).

---

## Task 3: LayoutStep — ComposerCanvas mode='layout' 단순 wrap

**Files:**
- Create: `frontend/src/view/util/t3composer/LayoutStep.jsx`

- [ ] **Step 1: 신규 파일 작성**

```jsx
/**
 * LayoutStep — ① Layout 단계. ComposerCanvas mode='layout' 단순 wrap.
 *   FilterBar 노란 띠 / [메뉴/메타] 버튼 / [화면 생성] 버튼은 ComposerCanvas 가 mode 분기로 숨김.
 *
 *   props:
 *     spec       ComposerSpec
 *     onChange(nextSpec)
 *     targetCd
 *
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e1.md (Task 3)
 */
import React from 'react';
import ComposerCanvas from './ComposerCanvas';

function LayoutStep({ spec, onChange, targetCd }) {
  return (
    <ComposerCanvas
      mode="layout"
      spec={spec}
      onChange={onChange}
      targetCd={targetCd}
      /* DataMiniDialog 의 [Data Source 탐색] 은 ② 단계로 옮기는 게 자연스럽지만,
         layer 본문 click 시 DataMiniDialog 가 여전히 LayoutStep 에서도 열리도록 유지.
         Phase 2E-2 에서 정리 시 검토. */
    />
  );
}

export default LayoutStep;
```

- [ ] **Step 2: 컴파일 확인**

Run: `docker compose logs --tail=20 composer-frontend 2>&1 | grep -iE "ERROR in|SyntaxError" | head -5`
Expected: `Module not found: ./LayoutStep` 사라짐.

---

## Task 4: DataAndFilterStep — 단순 버전 (좌측 layer list + 우측 FilterBar list)

**Files:**
- Create: `frontend/src/view/util/t3composer/DataAndFilterStep.jsx`

**배경:** Phase 2E-1 은 골격 — 자세한 inline 편집은 Phase 2E-2. 일단 좌측 layer 카드 list (클릭 → 기존 DataMiniDialog) + 우측 FilterBar 카드 list (클릭 → 기존 FilterBarMiniDialog) 만.

- [ ] **Step 1: 신규 파일 작성**

```jsx
/**
 * DataAndFilterStep — ② 데이터·검색조건 단계.
 *   Phase 2E-1: 단순 버전 — 좌측 layer 카드 list + 우측 FilterBar 카드 list. 자세한 입력은 mini dialog.
 *   Phase 2E-2: 우측 FilterBar 를 inline panel 로 강화 (popup 없이 직접 편집).
 *
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e1.md (Task 4)
 */
import React, { useState } from 'react';
import { Box, Typography, Stack, Chip, Button } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';

import DataMiniDialog from './DataMiniDialog';
import FilterBarMiniDialog from './FilterBarMiniDialog';

function DataAndFilterStep({ spec, onChange, targetCd }) {
  const [editingLayerKey, setEditingLayerKey] = useState(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const layers = spec?.layers || [];
  const filterItems = spec?.filterBar?.items || [];
  const editingLayer = layers.find((l) => l.key === editingLayerKey) || null;

  const handleApplyLayer = (nextLayer) => {
    if (!nextLayer) return;
    onChange({
      ...spec,
      layers: layers.map((l) => (l.key === nextLayer.key ? nextLayer : l)),
    });
  };

  return (
    <Box sx={{ display: 'flex', gap: 1.5, height: '100%', minHeight: 0 }}>

      {/* ── 좌측 70% : Body Layers ── */}
      <Box sx={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column',
                  gap: 1, overflow: 'auto' }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e40af',
                                              flexShrink: 0 }}>
          📐 Body Layers — 클릭하여 데이터 편집
        </Typography>
        {layers.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8' }}>
            Layer 가 없습니다. ① Layout 단계에서 추가하세요.
          </Box>
        )}
        {layers.map((l) => {
          const hasData = !!(l.dataSource?.naturalText) || (l.dataSource?.references || []).length > 0;
          return (
            <Box
              key={l.key}
              onClick={() => setEditingLayerKey(l.key)}
              sx={{
                cursor: 'pointer', p: 1.5,
                bgcolor: '#fff', border: '1px solid #cbd5e1', borderRadius: 1.5,
                borderLeft: '4px solid #7CA7E0',
                transition: 'box-shadow 0.15s ease',
                '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>
                    {l.title || l.key}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: '#64748b' }}>
                    {l.type}{l.subtype ? ` · ${l.subtype}` : ''}
                    {l.parentKey ? ` · (자식: ⊂ ${l.parentKey})` : ''}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={hasData ? '✓ 설정됨' : '미설정'}
                  sx={{
                    bgcolor: hasData ? '#dcfce7' : '#fef3c7',
                    color:   hasData ? '#166534' : '#92400e',
                    fontWeight: 700,
                  }}
                />
              </Stack>
            </Box>
          );
        })}
      </Box>

      {/* ── 우측 ~280px : FilterBar (단순 버전 — Phase 2E-2 에서 inline 강화) ── */}
      <Box sx={{
        flexShrink: 0, width: 280,
        display: 'flex', flexDirection: 'column', gap: 1,
        bgcolor: '#fef9c3', border: '2px solid #f59e0b', borderRadius: 1.5,
        p: 1.5, overflow: 'auto',
      }}>
        <Stack direction="row" alignItems="center" spacing={0.8}>
          <FilterListIcon sx={{ fontSize: 18, color: '#92400e' }} />
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400e', flex: 1 }}>
            🔍 FilterBar (검색조건)
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => setFilterDialogOpen(true)}
            sx={{ fontSize: 11, color: '#92400e' }}
          >
            편집
          </Button>
        </Stack>

        {filterItems.length === 0 && (
          <Typography variant="caption" sx={{
            color: '#92400e', fontStyle: 'italic', textAlign: 'center', py: 2,
          }}>
            필드 없음 — [편집] 클릭하여 추가
          </Typography>
        )}
        {filterItems.map((it) => (
          <Box key={it.key} sx={{
            bgcolor: '#fff', border: '1px solid #fbbf24', borderRadius: 1, p: 0.8,
          }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>
              {it.label || it.key}
            </Typography>
            <Typography sx={{ fontSize: 10, color: '#64748b' }}>{it.type}</Typography>
          </Box>
        ))}

        <Typography variant="caption" sx={{
          color: '#92400e', fontSize: 10, mt: 'auto', pt: 1,
          borderTop: '1px dashed #f59e0b',
        }}>
          ⓘ Phase 2E-2 에서 inline 편집 강화 예정
        </Typography>
      </Box>

      {/* ── Dialogs ── */}
      <DataMiniDialog
        open={!!editingLayer}
        layer={editingLayer}
        targetCd={targetCd}
        onClose={() => setEditingLayerKey(null)}
        onApply={handleApplyLayer}
      />
      <FilterBarMiniDialog
        open={filterDialogOpen}
        spec={spec}
        onClose={() => setFilterDialogOpen(false)}
        onApply={(nextSpec) => onChange(nextSpec)}
      />
    </Box>
  );
}

export default DataAndFilterStep;
```

- [ ] **Step 2: 컴파일 확인**

Run: `docker compose logs --tail=20 composer-frontend 2>&1 | grep -iE "ERROR in|SyntaxError" | head -5`
Expected: `Module not found: ./DataAndFilterStep` 사라짐.

---

## Task 5: MetaStep — ScreenMetaDialog 본문 inline form

**Files:**
- Create: `frontend/src/view/util/t3composer/MetaStep.jsx`

**배경:** ScreenMetaDialog 의 본문 (4 입력 필드 + MenuPickerDialog) 을 popup 껍데기 없이 inline form 으로. ScreenMetaDialog 자체는 일단 유지 (Phase 2E-3 에서 제거 검토).

- [ ] **Step 1: 신규 파일 작성**

```jsx
/**
 * MetaStep — ③ 메타·메뉴 단계.
 *   ScreenMetaDialog 의 본문을 inline form 으로 추출. spec.meta 직접 갱신.
 *
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e1.md (Task 5)
 */
import React, { useState } from 'react';
import {
  Box, TextField, Typography, Stack, Chip, Button,
} from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

import MenuPickerDialog from './MenuPickerDialog';

function MetaStep({ spec, onChange, targetCd }) {
  const meta = spec?.meta || {};
  const [menuPickerOpen, setMenuPickerOpen] = useState(false);
  const [parentMenuLabel, setParentMenuLabel] = useState(meta.parentMenuCd || '');

  const update = (patch) => {
    onChange({ ...spec, meta: { ...meta, ...patch } });
  };

  const handleParentSelect = (selectedMenu) => {
    if (!selectedMenu) return;
    const cd = selectedMenu.menuCd || selectedMenu.id || '';
    update({ parentMenuCd: cd });
    setParentMenuLabel(selectedMenu.menuNm
      ? `${cd} (${selectedMenu.menuNm})`
      : cd);
    setMenuPickerOpen(false);
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Typography variant="h6" sx={{ color: '#1e40af', fontWeight: 800, mb: 0.5 }}>
        ③ 메타·메뉴
      </Typography>
      <Typography variant="caption" sx={{ color: '#64748b', mb: 2, display: 'block' }}>
        화면의 식별 정보와 메뉴 등록 위치를 입력합니다. 빈 값은 Claude 가 추론합니다.
      </Typography>

      <Stack spacing={2}>
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
            화면 제목
          </Typography>
          <TextField
            value={meta.title || ''}
            onChange={(e) => update({ title: e.target.value })}
            fullWidth size="small"
            placeholder="예: 사용자정보 관리"
            sx={{ mt: 0.5 }}
          />
        </Box>

        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
            메뉴 코드 (MENU_CD) — <code style={{ fontSize: 11 }}>UI_&lt;DOMAIN&gt;_&lt;NAME&gt;</code>
          </Typography>
          <TextField
            value={meta.menuCd || ''}
            onChange={(e) => update({ menuCd: e.target.value.toUpperCase() })}
            fullWidth size="small"
            placeholder="UI_UT_USER_INFO_MGMT"
            helperText="비워두면 Claude 가 화면 의도에서 추론."
            FormHelperTextProps={{ sx: { fontSize: 10 } }}
            sx={{ mt: 0.5, '& input': { fontFamily: 'monospace' } }}
          />
        </Box>

        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
            메뉴 파일 경로 (MENU_FILE_PATH)
          </Typography>
          <TextField
            value={meta.menuFilePath || ''}
            onChange={(e) => update({ menuFilePath: e.target.value })}
            fullWidth size="small"
            placeholder="/util/UserInfoMgmt"
            helperText="형식: /<module>[/<category>]/<PascalName> (확장자 없이)."
            FormHelperTextProps={{ sx: { fontSize: 10 } }}
            sx={{ mt: 0.5, '& input': { fontFamily: 'monospace' } }}
          />
        </Box>

        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
            부모 메뉴 (그룹) — 활성 Target ({targetCd || '미선택'}) 의 메뉴 트리
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.7 }}>
            {meta.parentMenuCd ? (
              <Chip
                label={parentMenuLabel || meta.parentMenuCd}
                onDelete={() => { update({ parentMenuCd: '' }); setParentMenuLabel(''); }}
                sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 700,
                       fontFamily: 'monospace' }}
              />
            ) : (
              <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                미선택 — Claude 가 화면 의도에서 추론
              </Typography>
            )}
            <Button
              size="small" variant="outlined"
              startIcon={<AccountTreeIcon fontSize="small" />}
              onClick={() => setMenuPickerOpen(true)}
              disabled={!targetCd}
            >
              메뉴 선택
            </Button>
          </Stack>
        </Box>
      </Stack>

      <MenuPickerDialog
        open={menuPickerOpen}
        onClose={() => setMenuPickerOpen(false)}
        onSelect={handleParentSelect}
        selectGroupOnly={true}
        targetCd={targetCd}
      />
    </Box>
  );
}

export default MetaStep;
```

- [ ] **Step 2: 컴파일 확인**

Run: `docker compose logs --tail=20 composer-frontend 2>&1 | grep -iE "ERROR in|SyntaxError" | head -5`
Expected: `Module not found: ./MetaStep` 사라짐.

---

## Task 6: GenerateStep — createSession + ComposerWorkspace 이전

**Files:**
- Create: `frontend/src/view/util/t3composer/GenerateStep.jsx`

**배경:** 현재 ModeNewStep 의 WORKSPACE 분기 (createSession + setSession + `<ComposerWorkspace>` 임베드) 로직을 GenerateStep 으로 이전. 진입 시 자동 createSession.

- [ ] **Step 1: 신규 파일 작성**

```jsx
/**
 * GenerateStep — ④ 화면 생성·미리보기 단계.
 *   진입 시 자동 createSession (mode='NEW_STEP') → ComposerWorkspace 임베드.
 *   "← 이전 단계로" 버튼 (extraHeader) — 메타 단계 (③) 로 복귀.
 *
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e1.md (Task 6)
 */
import React, { useEffect, useState, useRef } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import ComposerWorkspace from './ComposerWorkspace';
import { specToInitialPrompt } from './wizardState';
import { createSession } from './api';

function GenerateStep({ spec, targetCd, onBackToWizard }) {
  const [session, setSession] = useState(null);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const triedRef = useRef(false);  // mount 시 1회만 createSession

  useEffect(() => {
    if (triedRef.current) return;
    triedRef.current = true;
    let alive = true;
    (async () => {
      setCreating(true);
      setError(null);
      try {
        const promptText = specToInitialPrompt(spec);
        const title = (spec?.meta?.title || '새 화면').slice(0, 80);
        const res = await createSession({
          mode: 'NEW_STEP',
          title,
          modelName: 'claude-sonnet-4-5',
          targetCd,
        });
        if (!alive) return;
        setSession(res.data);
        setInitialPrompt(promptText);
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message
              || e?.response?.data?.error
              || e?.message
              || '세션 생성 실패');
      } finally {
        if (alive) setCreating(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (creating) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', height: '100%', gap: 2 }}>
        <CircularProgress size={32} />
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          세션 생성 중 — Claude 호출 준비
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body2" sx={{
          color: '#991b1b', bgcolor: '#fee2e2', border: '1px solid #fecaca',
          p: 2, borderRadius: 1, fontWeight: 600,
        }}>
          ⚠ {error}
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBackToWizard}
          sx={{ mt: 2 }}
        >
          이전 단계로
        </Button>
      </Box>
    );
  }

  if (!session) return null;

  return (
    <Box sx={{ height: '100%', mt: -1.5, mx: -1.5, mb: -1.5 }}>
      <ComposerWorkspace
        session={session}
        initialPrompt={initialPrompt}
        extraHeader={
          <Button
            size="small"
            startIcon={<ArrowBackIcon fontSize="small" />}
            onClick={onBackToWizard}
            sx={{ mr: 1 }}
          >
            이전 단계
          </Button>
        }
      />
    </Box>
  );
}

export default GenerateStep;
```

- [ ] **Step 2: 컴파일 확인**

Run: `docker compose logs --tail=20 composer-frontend 2>&1 | grep -iE "ERROR in|SyntaxError" | head -5`
Expected: 0건 (Task 2~6 모든 신규 파일 작성 완료 — ComposerWizard 의 import 성공).

- [ ] **Step 3: commit (Task 2~6 통합)**

```bash
git add frontend/src/view/util/t3composer/ComposerWizard.jsx \
        frontend/src/view/util/t3composer/LayoutStep.jsx \
        frontend/src/view/util/t3composer/DataAndFilterStep.jsx \
        frontend/src/view/util/t3composer/MetaStep.jsx \
        frontend/src/view/util/t3composer/GenerateStep.jsx
git commit -m "$(cat <<'EOF'
feat(composer): ComposerWizard 골격 + 4개 Step 컴포넌트

Phase 2E-1 의 핵심.

[신규 컴포넌트]
- ComposerWizard — 4단계 wrapper (상단 Stepper + 하단 Footer + step 분기)
- LayoutStep — ComposerCanvas mode='layout' 단순 wrap (FilterBar/메타/생성 숨김)
- DataAndFilterStep — 좌 layer 카드 + 우 FilterBar 카드 (단순 버전, mini dialog 호출)
- MetaStep — ScreenMetaDialog 본문을 inline form 으로 추출
- GenerateStep — ModeNewStep 의 WORKSPACE 로직 이전 (mount 시 자동 createSession)

[Stepper]
- 4개 step 클릭으로 자유 이동 (강제 순서 없음)
- 각 step 별 색 차별화 (Layout 초록 / Data 노랑 / Meta 파랑 / Generate 보라)
- 활성 step 진한 border + bg, 나머지 회색

[Footer]
- ← 이전 / 다음 → 버튼 (GENERATE 단계 진입 후 숨김)
- 다음 step 의 색으로 버튼 강조

[GenerateStep]
- mount 시 useRef 가드로 1회만 createSession
- 진행 중 CircularProgress · 실패 시 에러 + [이전 단계로]
- ComposerWorkspace 임베드 + extraHeader 에 [이전 단계] 버튼

다음 Task 7 — ModeNewStep 의 CANVAS/WORKSPACE 분기를 ComposerWizard 호출로 교체.

Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e1.md (Task 2-6)
EOF
)"
```

---

## Task 7: ModeNewStep — CANVAS 분기를 ComposerWizard 호출로 교체

**Files:**
- Modify: `frontend/src/view/util/t3composer/ModeNewStep.jsx`

**배경:** 기존 ModeNewStep 의 stage 는 'PICK' / 'CANVAS' / 'WORKSPACE' 3단계. ComposerWizard 도입 후:
- 'PICK' 단계 그대로
- 'CANVAS' 단계 = `<ComposerWizard initialSpec={spec} targetCd={...} onBack={...} />` 한 줄 호출
- 'WORKSPACE' 단계는 ComposerWizard 의 GENERATE step 으로 흡수 → ModeNewStep 에서 제거

- [ ] **Step 1: import + state 정리**

기존 ModeNewStep.jsx 의 import 블록에서 사용 안 하게 될 것 제거:

기존:
```jsx
import ComposerCanvas from './ComposerCanvas';
import ComposerWorkspace from './ComposerWorkspace';
...
import { specFromPattern, specFromMockup, specFromUiPattern, specToInitialPrompt } from './wizardState';
import { useTargetStore } from './targetStore';
import { createSession } from './api';
```

→ 다음으로 교체 (ComposerWizard 만 import):
```jsx
import ComposerWizard from './ComposerWizard';
import MockupPickerDialog from './MockupPickerDialog';
import UiPatternPickerDialog from './UiPatternPickerDialog';
import { specFromPattern, specFromMockup, specFromUiPattern } from './wizardState';
import { useTargetStore } from './targetStore';
```

(`ComposerCanvas` · `ComposerWorkspace` · `DataSourcePickerDialog` · `specToInitialPrompt` · `createSession` import 제거 — GenerateStep / ComposerWizard 안에서 사용)

- [ ] **Step 2: 미사용 state 제거 + stage 단순화**

기존 ModeNewStep 의 state 들:
```jsx
const [stage, setStage] = useState('PICK');
const [spec, setSpec]   = useState(null);
const [mockupPickerOpen, setMockupPickerOpen] = useState(false);
const [uiPatternPickerOpen, setUiPatternPickerOpen] = useState(false);
const [dsPickerOpen, setDsPickerOpen] = useState(false);
const [dsPickerLayerKey, setDsPickerLayerKey] = useState(null);
const [session, setSession] = useState(null);
const [initialPrompt, setInitialPrompt] = useState('');
const [creating, setCreating] = useState(false);
const [createError, setCreateError] = useState(null);
const currentTargetCd = useTargetStore((s) => s.currentTargetCd);
```

→ 다음으로 단순화 (dsPicker / session / initialPrompt / creating / createError 제거):
```jsx
const [stage, setStage] = useState('PICK');  // 'PICK' | 'WIZARD'
const [spec, setSpec]   = useState(null);
const [mockupPickerOpen, setMockupPickerOpen] = useState(false);
const [uiPatternPickerOpen, setUiPatternPickerOpen] = useState(false);
const currentTargetCd = useTargetStore((s) => s.currentTargetCd);
```

- [ ] **Step 3: handleCreate / 기존 WORKSPACE 분기 / DataSourcePickerDialog 호출 제거**

기존 `handleCreate`, `if (stage === 'WORKSPACE' && session)` 블록, ComposerCanvas 의 onCreate/onOpenDataSourcePicker, 그 outer Fragment 안의 `<DataSourcePickerDialog>` 모두 제거.

(상세 코드는 Step 4 의 단순화된 return 참조)

- [ ] **Step 4: CANVAS 분기를 ComposerWizard 호출로 교체**

기존 `if (stage === 'CANVAS' && spec) { ... }` 분기 전체를 다음으로 교체:

```jsx
if (stage === 'WIZARD' && spec) {
  return (
    <ComposerWizard
      initialSpec={spec}
      targetCd={currentTargetCd}
      onBack={() => { setSpec(null); setStage('PICK'); }}
    />
  );
}
```

- [ ] **Step 5: startWithPattern / 패턴 picker 의 setStage 호출 갱신**

기존 `setStage('CANVAS')` 를 모두 `setStage('WIZARD')` 로 치환 (`startWithPattern`, MockupPicker `onConfirm`, UiPatternPicker `onConfirm` 3곳).

```bash
# 자동 치환 명령 (참고용):
# 실제로는 Edit tool 로 한 줄씩 변경
grep -n "setStage('CANVAS')" frontend/src/view/util/t3composer/ModeNewStep.jsx
# 3개 매칭 예상 → 각각 setStage('WIZARD') 로
```

- [ ] **Step 6: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError" | head -10`
Expected: 0건.

- [ ] **Step 7: end-to-end smoke 검증**

브라우저 `http://localhost:5173`:

1. ModeSelector → "단계별 생성" → "빈 캔버스 (P02)" → **ComposerWizard 진입** ✓
2. 상단 Stepper 4개 (Layout/Data/Meta/Generate) + 하단 [← 이전 / 다음 →] 보임 ✓
3. **① Layout** 단계 — ComposerCanvas (mode='layout' 으로 FilterBar/메타/생성 숨김) — Layer drag/resize/추가/삭제/Container nested 모두 정상 ✓
4. [다음] → **② 데이터·검색조건** 단계 — 좌측 layer 카드 list + 우측 노란 FilterBar panel ✓
   - layer 클릭 → DataMiniDialog 정상
   - FilterBar [편집] → FilterBarMiniDialog 정상
5. [다음] → **③ 메타·메뉴** 단계 — inline form (화면 제목 / 메뉴 코드 / 메뉴 파일 경로 / 부모 메뉴) ✓
   - [메뉴 선택] → MenuPickerDialog (활성 Target 메뉴 트리)
6. [다음] → **④ 화면 생성** 단계 — 자동 createSession → ComposerWorkspace 임베드 ✓
   - extraHeader 에 [이전 단계] 버튼 → META 단계 복귀
7. Stepper 의 다른 step 클릭으로 자유 이동 가능 ✓
8. [패턴 다시 선택] (ComposerWizard 헤더의 ← 뒤로) → PICK 단계 복귀 (spec 초기화) ✓
9. 다른 모드 (NEW_NL / NEW_FROM_COPY / NEW_FROM_DESIGN) 회귀 없음 ✓

- [ ] **Step 8: commit**

```bash
git add frontend/src/view/util/t3composer/ModeNewStep.jsx
git commit -m "$(cat <<'EOF'
feat(composer): ModeNewStep — CANVAS/WORKSPACE 분기를 ComposerWizard 로 교체

Phase 2E-1 Task 7. 기존 stage 3단계 (PICK/CANVAS/WORKSPACE) → 2단계 (PICK/WIZARD).
WORKSPACE 분기 로직은 GenerateStep 으로 이전됐으므로 ModeNewStep 에서 제거.

[변경]
- import 정리: ComposerCanvas/ComposerWorkspace/DataSourcePickerDialog/createSession/specToInitialPrompt 제거,
  ComposerWizard 만 import
- state 단순화: dsPicker/session/initialPrompt/creating/createError 제거
- handleCreate 제거 (GenerateStep 의 mount effect 로 이전)
- WORKSPACE 분기 블록 제거
- CANVAS 분기 → '<ComposerWizard initialSpec={spec} targetCd={...} onBack={...} />' 한 줄
- setStage('CANVAS') → setStage('WIZARD') 3곳

[효과]
ModeNewStep 의 책임 단순화 — 패턴 picker (PICK) + wizard 호출만.
세션 생성/산출물/화면실행은 ComposerWizard 내부 (GenerateStep) 가 담당.

Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e1.md (Task 7)
EOF
)"
```

---

## Task 8: Phase 2E-1 통합 smoke + 종료 마커

**Files:** (변경 없음)

- [ ] **Step 1: 전체 컴파일 healthcheck**

Run: `docker compose logs --tail=80 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError|Failed to compile" | head -10`
Expected: 0건.

- [ ] **Step 2: 4단계 wizard end-to-end (Task 7 Step 7 시나리오 반복)**

브라우저 — T3SERIES 활성:
1. PICK → "빈 캔버스" → ComposerWizard 진입
2. ① Layout: Container 추가 + 자식 추가 ✓
3. ② Data: layer 데이터 입력 + FilterBar 필드 추가 ✓
4. ③ Meta: 화면 제목/메뉴 코드/부모 메뉴 입력 ✓
5. ④ Generate: 자동 createSession → ArtifactPanel → [화면 실행] → 미리보기 ✓
6. Stepper 자유 이동 — META 로 돌아가서 수정 → GENERATE 다시 진입 시 새 세션 (triedRef 리셋 위해 새 GenerateStep mount)

⚠️ **알려진 한계 (Phase 2E-1)**:
- Stepper 로 GENERATE → META 돌아간 후 다시 GENERATE 진입 시 새 세션. 의도된 동작 (spec 변경 후 새 생성).
- triedRef 가 한 번 set 되면 후속 GenerateStep 재진입 시 효과 없음 — 매 GenerateStep mount 시 ref 리셋 (current React 동작).

- [ ] **Step 3: Phase 2E-1 종료 commit**

```bash
git commit --allow-empty -m "$(cat <<'EOF'
milestone(composer): Phase 2E-1 complete — ComposerWizard 골격

4단계 wizard 도입 — Layout / 데이터·검색조건 / 메타·메뉴 / 화면 생성.

[Commits]
- (Task 1) ComposerCanvas mode='layout' prop
- (Task 2-6) ComposerWizard + LayoutStep + DataAndFilterStep + MetaStep + GenerateStep
- (Task 7) ModeNewStep 단순화 — CANVAS/WORKSPACE → WIZARD

[효과]
- 단계 분리 — 한 화면 결정 부담 해소
- 자유 이동 — Stepper 클릭으로 어느 단계든 이동
- 강제 순서 없음 — 각 단계 독립 (메타 미설정이라도 ④ 가능, Claude 추론)
- ModeNewStep 단순화 — 책임 = 패턴 picker + Wizard 호출만

[유지]
- 9-Step Wizard 코드 (StepByStepWizard) 그대로 — 별개
- 다른 모드 (NEW_NL/COPY/DESIGN) 영향 0
- ComposerCanvas mode='all' (default) — 다른 호출처 회귀 없음

[다음 단계]
- Phase 2E-2: FilterBar inline 강화 (현재 우측 panel 은 list 만 — 직접 편집 X)
- Phase 2E-3: ScreenMetaDialog 제거 + ComposerCanvas mode='layout' 완성
- Phase 2D-2: Layer 간 관계 설정 (master-detail / drill-down)
- Phase 3: 9-Step Wizard 코드 제거

Spec (재설계): docs/superpowers/specs/2026-05-22-composer-canvas-wizard-redesign-design.md
Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e1.md
EOF
)"
```

---

## Self-Review

**1. Spec coverage (Phase 2E-1):**

| Spec 요구 | 구현 task |
|---|---|
| ComposerWizard wrapper | Task 2 |
| 4단계 Stepper + Footer | Task 2 |
| LayoutStep | Task 3 |
| DataAndFilterStep 단순 버전 | Task 4 |
| MetaStep inline form | Task 5 |
| GenerateStep | Task 6 |
| ModeNewStep 분기 단순화 | Task 7 |
| ComposerCanvas mode='layout' | Task 1 (의존성 — LayoutStep 동작에 필수) |
| FilterBar 진짜 inline 강화 | **Phase 2E-2** (별도 plan) |
| ScreenMetaDialog 제거 | **Phase 2E-3** |

**2. Placeholder scan:** "TBD" / "implement later" 0건. ✓

**3. Type consistency:**
- `ComposerWizard` props (`initialSpec, targetCd, onBack`) — Task 7 의 호출 인자와 일치 ✓
- 각 Step 의 props (`spec, onChange, targetCd`) — ComposerWizard 의 전달 일치 ✓
- `GenerateStep.onBackToWizard` — ComposerWizard 의 `setStep('META')` 일치 ✓
- `ModeNewStep` 의 `setStage('WIZARD')` — `if (stage === 'WIZARD' && spec)` 분기 일치 ✓

**4. Ambiguity:**
- "Stepper 의 활성 시 색 차별화" — STEPS 배열에 정의된 4가지 색 (초록/노랑/파랑/보라) 일관 ✓
- "GenerateStep mount 시 자동 createSession" — useRef 가드. 사용자가 META 로 돌아갔다 다시 GENERATE 진입 시 새 GenerateStep mount (component unmount/mount 발생) → useRef 새로 초기화 → 새 세션 ✓
- "Container nested" — LayoutStep 에서 ComposerCanvas mode='layout' 그대로 사용하므로 Phase 1.5 의 Container nested 기능 유지 ✓

---

## Execution Choice

**Plan complete and saved to `docs/superpowers/plans/2026-05-22-composer-canvas-phase2e1.md`.** 두 가지 실행 옵션:

**1. Subagent-Driven** — 매 task fresh subagent
**2. Inline Execution (recommended)** — 이 세션에서 직접 (8 task — 신규 컴포넌트 5개 + ModeNewStep 수정)

어느 쪽으로?

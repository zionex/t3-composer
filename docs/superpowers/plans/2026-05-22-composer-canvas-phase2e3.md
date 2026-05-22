# Composer Canvas Phase 2E-3 — Dead Code Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ComposerCanvas 의 `mode='all'` dead 분기 4곳 + `ScreenMetaDialog` 전체 제거. LayoutStep 의 `mode="layout"` prop 호출도 제거.

**Architecture:** dead code 정리만 — behavior 변경 0, 신규 컴포넌트 0.

**Tech Stack:** React 18.

**Spec:** `docs/superpowers/specs/2026-05-22-composer-canvas-phase2e3-dead-code-cleanup-design.md`
**전제:** Phase 2E-2 완료 (commit `93a9332`).
**Dev 환경**: composer-frontend port 5173. 로그: `docker compose logs --tail=50 composer-frontend`.

---

## File Structure

| 파일 | 변경 종류 | 책임 |
|---|---|---|
| `frontend/src/view/util/t3composer/ComposerCanvas.jsx` | **수정** | mode prop / mode==='all' 분기 4곳 / onCreate prop / metaDialogOpen state / ScreenMetaDialog import·render 제거 |
| `frontend/src/view/util/t3composer/LayoutStep.jsx` | **수정** | `mode="layout"` prop 호출 제거 (no-op 됐으므로) |
| `frontend/src/view/util/t3composer/ScreenMetaDialog.jsx` | **삭제** | 모든 호출처 제거됨 |

---

## Task 1: ComposerCanvas — mode='all' 분기 + ScreenMetaDialog 제거

**Files:**
- Modify: `frontend/src/view/util/t3composer/ComposerCanvas.jsx`

- [ ] **Step 1: import 제거**

기존 (line 70 부근):
```jsx
import ScreenMetaDialog from './ScreenMetaDialog';
```
→ 통째 삭제.

- [ ] **Step 2: 함수 시그니처 단순화**

기존:
```jsx
function ComposerCanvas({
  spec, onChange, readOnly = false, targetCd, onOpenDataSourcePicker, onCreate,
  mode = 'all',  // 'all' (기존) | 'layout' (LayoutStep 전용 — FilterBar/메타/생성 숨김)
}) {
```
→ 다음으로 교체:
```jsx
function ComposerCanvas({
  spec, onChange, readOnly = false, targetCd, onOpenDataSourcePicker,
}) {
```

- [ ] **Step 3: metaDialogOpen state 제거**

기존 (line 154 부근):
```jsx
const [metaDialogOpen, setMetaDialogOpen] = useState(false);
```
→ 통째 삭제.

- [ ] **Step 4: 메타 chip / [메뉴/메타] / [화면 생성] / FilterBar 노란 띠 4곳 정리**

**4-a: 메타 chip (line 283 부근) — 통째 삭제:**
```jsx
{mode === 'all' && spec?.meta && (
  <Chip ... />
)}
```

**4-b: [메뉴/메타] 버튼 (line 301 부근) — 통째 삭제:**
```jsx
{mode === 'all' && (
  <Button ... onClick={() => setMetaDialogOpen(true)}> 메뉴/메타 </Button>
)}
```

**4-c: [화면 생성] 버튼 (line 375 부근) — 통째 삭제:**
```jsx
{mode === 'all' && onCreate && (
  <Button ...> 화면 생성 </Button>
)}
```

**4-d: FilterBar 노란 띠 wrapper (line 393 부근) — `{mode === 'all' && (` 와 매칭 `)}` 만 제거 (안의 띠 자체는 LayoutStep 에서 안 보여도 무방하나, mode 가 사라지므로 띠도 사라져야 함. 그러나 wizard 의 ② 단계가 자체 FilterBar 노란 패널을 갖고 있으므로 LayoutStep 의 ComposerCanvas 에서는 띠 노출이 잉여):**

기존:
```jsx
{/* ───── FilterBar 노란 띠 — mode='all' 에서만 ... ───── */}
{mode === 'all' && (
<Box sx={...}>
  ...
</Box>
)}
```
→ 통째 삭제 (mode='all' 만 노출되던 분기였고 LayoutStep 에선 보이지 않았음).

- [ ] **Step 5: `<ScreenMetaDialog>` render 제거 (line 749 부근)**

기존:
```jsx
<ScreenMetaDialog
  open={metaDialogOpen}
  onClose={() => setMetaDialogOpen(false)}
  meta={spec?.meta}
  targetCd={targetCd}
  onApply={(nextMeta) => {
    onChange({ ...spec, meta: nextMeta });
  }}
/>
```
→ 통째 삭제.

- [ ] **Step 6: 컴파일 + grep 확인**

Run:
```
grep -n "mode === 'all'\|metaDialogOpen\|ScreenMetaDialog\|mode === 'layout'\|onCreate" \
  /Users/hej/work/projects/t3-composer/frontend/src/view/util/t3composer/ComposerCanvas.jsx
```
Expected: 0건.

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|SyntaxError|Module not found" | head -5`
Expected: 0건.

---

## Task 2: LayoutStep — mode="layout" prop 호출 제거

**Files:**
- Modify: `frontend/src/view/util/t3composer/LayoutStep.jsx`

- [ ] **Step 1: mode prop 호출 제거 + doc comment 갱신**

기존:
```jsx
/**
 * LayoutStep — ① Layout 단계. ComposerCanvas mode='layout' 단순 wrap.
 *   FilterBar 노란 띠 / [메뉴/메타] 버튼 / [화면 생성] 버튼은 ComposerCanvas 가 mode 분기로 숨김.
 * ...
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
    />
  );
}

export default LayoutStep;
```

→ 다음으로 교체:
```jsx
/**
 * LayoutStep — ① Layout 단계. ComposerCanvas 단순 wrap.
 *   Phase 2E-3 이후 ComposerCanvas 는 layout 편집 전용 — FilterBar/메타/생성 분기 제거됨.
 *
 *   props:
 *     spec       ComposerSpec
 *     onChange(nextSpec)
 *     targetCd
 *
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e3.md (Task 2)
 */
import React from 'react';
import ComposerCanvas from './ComposerCanvas';

function LayoutStep({ spec, onChange, targetCd }) {
  return (
    <ComposerCanvas
      spec={spec}
      onChange={onChange}
      targetCd={targetCd}
    />
  );
}

export default LayoutStep;
```

- [ ] **Step 2: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|SyntaxError" | head -5`
Expected: 0건.

---

## Task 3: ScreenMetaDialog 파일 삭제 + 통합 커밋

**Files:**
- Delete: `frontend/src/view/util/t3composer/ScreenMetaDialog.jsx`

- [ ] **Step 1: 모든 호출처 제거 확인**

Run: `grep -rn "ScreenMetaDialog" /Users/hej/work/projects/t3-composer/frontend/src/ 2>/dev/null | grep -v "ScreenMetaDialog.jsx:"`
Expected: 0건 (`MetaStep.jsx` 의 doc comment 는 매칭되지만 코드가 아니라 무시 OK — 아래 step 에서 갱신).

- [ ] **Step 2: MetaStep doc comment 갱신**

`frontend/src/view/util/t3composer/MetaStep.jsx` 의 doc comment:

기존:
```jsx
/**
 * MetaStep — ③ 메타·메뉴 단계.
 *   ScreenMetaDialog 의 본문을 inline form 으로 추출. spec.meta 직접 갱신.
 *
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e1.md (Task 5)
 */
```

→ 다음으로 교체:
```jsx
/**
 * MetaStep — ③ 메타·메뉴 단계.
 *   spec.meta 직접 갱신 (Phase 2E-1 에서 ScreenMetaDialog popup 의 본문을 inline form 으로 추출,
 *   Phase 2E-3 에서 ScreenMetaDialog 파일 자체 삭제).
 *
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e1.md (Task 5)
 */
```

- [ ] **Step 3: 파일 삭제**

Run: `rm /Users/hej/work/projects/t3-composer/frontend/src/view/util/t3composer/ScreenMetaDialog.jsx`

- [ ] **Step 4: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError" | head -10`
Expected: 0건.

- [ ] **Step 5: Task 1·2·3 통합 커밋**

```bash
git add frontend/src/view/util/t3composer/ComposerCanvas.jsx \
        frontend/src/view/util/t3composer/LayoutStep.jsx \
        frontend/src/view/util/t3composer/MetaStep.jsx
git rm frontend/src/view/util/t3composer/ScreenMetaDialog.jsx
git commit -m "$(cat <<'EOF'
refactor(composer): Phase 2E-3 — dead code 정리 (mode='all' + ScreenMetaDialog)

Wizard 도입 (Phase 2E-1) + FilterBar inline (Phase 2E-2) 이후 ComposerCanvas 의
mode='all' 분기 4곳 + ScreenMetaDialog 전체가 dead code. 제거.

[ComposerCanvas]
- mode prop 제거 (default 'all' 이었으나 호출처 LayoutStep 이 'layout' 만 전달).
- mode === 'all' 분기 4곳 통째 삭제:
  - 메타 chip
  - [메뉴/메타] 버튼
  - [화면 생성] 버튼
  - FilterBar 노란 띠
- onCreate prop 제거 (mode='all' 전용).
- metaDialogOpen state + ScreenMetaDialog import + render 제거.

[LayoutStep]
- <ComposerCanvas mode='layout' ...> → <ComposerCanvas ...> 단순화.
- doc comment 갱신.

[ScreenMetaDialog.jsx 삭제]
- 호출처 0 (ComposerCanvas 가 유일했고 그 호출이 dead).
- MetaStep.jsx doc comment 의 옛 참조도 갱신.

[Behavior]
변경 0 — Wizard 의 4단계 흐름 그대로. ComposerCanvas 는 ① Layout 단계의
layout 편집 전용으로 단순화.

Spec: docs/superpowers/specs/2026-05-22-composer-canvas-phase2e3-dead-code-cleanup-design.md
Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e3.md
EOF
)"
```

---

## Task 4: 통합 smoke + Phase 2E-3 milestone

**Files:** (변경 없음)

- [ ] **Step 1: 전체 컴파일 healthcheck**

Run: `docker compose logs --tail=80 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError|Failed to compile" | head -10`
Expected: 0건.

- [ ] **Step 2: end-to-end 시각 검증**

`http://localhost:5173`:
1. ModeSelector → 단계별 생성 → 빈 캔버스 → Wizard 진입 ✓
2. ① Layout: ComposerCanvas — RGL drag/resize/추가/삭제/Container nested 동작 ✓ · 우상단 [+ Layer] 동작 ✓ · 좌측 layer 카드 클릭 → DataMiniDialog ✓
3. ② 데이터·검색조건: layer 카드 클릭 → DataMiniDialog ✓ · 우측 FilterBar inline panel (Phase 2E-2) ✓
4. ③ 메타·메뉴: inline form ✓ · [메뉴 선택] → MenuPickerDialog ✓
5. ④ 화면 생성: 자동 createSession → ComposerWorkspace ✓
6. Stepper 자유 이동 ✓ · [패턴 다시 선택] → PICK 복귀 ✓

- [ ] **Step 3: Phase 2E-3 종료 commit**

```bash
git commit --allow-empty -m "$(cat <<'EOF'
milestone(composer): Phase 2E-3 complete — dead code cleanup

ComposerCanvas mode='all' 분기 + ScreenMetaDialog 전체 제거.

[효과]
- ComposerCanvas 가 layout 편집 전용으로 명료해짐.
- mode prop / onCreate prop / metaDialogOpen state 제거 — 시그니처 축소.
- 호출 그래프 단순화: LayoutStep → ComposerCanvas (단일 mode).

[Commits]
- (Spec)        design doc
- (Plan)        implementation plan
- (Task 1~3)    refactor — mode='all' + ScreenMetaDialog 제거

[남은 단계]
- Phase 2D-2: Layer 간 관계 설정 (master-detail / drill-down)
- Phase 3: 9-Step Wizard 코드 제거 (StepByStepWizard 등)

Spec: docs/superpowers/specs/2026-05-22-composer-canvas-phase2e3-dead-code-cleanup-design.md
Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e3.md
EOF
)"
```

---

## Self-Review

**1. Spec coverage:**

| Spec 요구 | 구현 task |
|---|---|
| ComposerCanvas mode prop 제거 | Task 1 Step 2 |
| mode === 'all' 분기 4곳 제거 | Task 1 Step 4 |
| onCreate prop 제거 | Task 1 Step 2 |
| metaDialogOpen state 제거 | Task 1 Step 3 |
| ScreenMetaDialog import + render 제거 | Task 1 Step 1·5 |
| LayoutStep mode="layout" 호출 제거 | Task 2 Step 1 |
| ScreenMetaDialog.jsx 파일 삭제 | Task 3 Step 3 |
| MetaStep doc 참조 갱신 | Task 3 Step 2 |
| 컴파일/시각 검증 | Task 1·2·3·4 의 grep + smoke |

**2. Placeholder scan:** 0건. ✓

**3. Type consistency:** ComposerCanvas 시그니처 ↔ LayoutStep 호출 — `mode`/`onCreate` 제거 일치 ✓.

---

## Execution Handoff

**Plan complete.** 사용자가 전체 위임 → **Inline Execution** 으로 다음 발화에서 task 1~4 차례 실행.

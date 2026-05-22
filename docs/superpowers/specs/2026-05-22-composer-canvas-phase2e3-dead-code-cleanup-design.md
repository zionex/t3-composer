# Composer Canvas Phase 2E-3 — Dead Code Cleanup Design

**Goal:** Wizard 도입 (Phase 2E-1) + FilterBar inline 강화 (Phase 2E-2) 로 무용해진 `ScreenMetaDialog` 와 `ComposerCanvas` 의 `mode='all'` 분기를 제거한다.

**Architecture:** ComposerCanvas 의 `mode` prop / `mode === 'all'` 분기 / `onCreate` prop / `metaDialogOpen` state / `ScreenMetaDialog` import·render 제거. `LayoutStep` 의 `mode="layout"` prop 호출 제거. `ScreenMetaDialog.jsx` 파일 삭제.

**Tech Stack:** React 18 — dead code 정리만, 신규 컴포넌트 0, behavior 변경 0.

---

## 1. 현재 상태 (Phase 2E-2 종료)

`ComposerCanvas.jsx`:
- 호출처 1개 — `LayoutStep` 의 `<ComposerCanvas mode="layout" ...>`.
- 시그니처: `{ spec, onChange, readOnly, targetCd, onOpenDataSourcePicker, onCreate, mode='all' }`
- mode='all' 분기 4곳 (모두 dead — LayoutStep 은 mode='layout' 만 전달):
  - line 283: 메타 chip
  - line 301: [메뉴/메타] 버튼
  - line 375: [화면 생성] 버튼 (`onCreate` 필요)
  - line 395: FilterBar 노란 띠 (Phase 2E-2 에서 onClick 만 제거됨, 띠는 남음)
- `metaDialogOpen` state + `setMetaDialogOpen` 호출 (2곳) — mode='all' 분기에서만 trigger
- `<ScreenMetaDialog>` render (line 749~757) — `metaDialogOpen` 으로만 열림

`ScreenMetaDialog.jsx`:
- 호출처 0개 (ComposerCanvas 가 유일 호출자 — 그 호출이 dead). 파일 전체 dead.

`LayoutStep.jsx`:
- `<ComposerCanvas mode="layout" ...>` — `mode` prop 자체가 없어지면 그 인자도 폐기.

## 2. 목표 (Phase 2E-3 종료)

`ComposerCanvas.jsx`:
- 시그니처: `{ spec, onChange, readOnly, targetCd, onOpenDataSourcePicker }` — `onCreate`, `mode` 제거.
- `mode === 'all'` 분기 4곳 모두 통째 삭제.
- `metaDialogOpen` state + setter + `<ScreenMetaDialog>` render 삭제.
- `ScreenMetaDialog` import 삭제.
- 우상단 헤더의 [+ Layer] 버튼은 그대로 (layout 편집의 본질).

`ScreenMetaDialog.jsx`:
- 파일 삭제.

`LayoutStep.jsx`:
- `mode="layout"` prop 호출 제거 (no-op 가 됐으므로 noise).

## 3. 검증

- 컴파일 (webpack dev server) 클린.
- 시각: Wizard 진입 → ① Layout 단계 → ComposerCanvas 의 모든 기능 동작 (RGL drag/resize/추가/삭제/Container nested + 우상단 [+ Layer] + 좌측 layer 클릭 → DataMiniDialog).
- ② 데이터·검색조건 / ③ 메타·메뉴 / ④ 화면 생성 — Phase 2E-1/2E-2 동작 유지.

## 4. 호환성 / Out of scope

- ComposerCanvas 의 `DataMiniDialog` (layer 클릭 시 열림) 은 그대로 유지. LayoutStep 안에서 data 입력이 가능한 건 의도적 — 사용자가 layout 단계에서도 가볍게 data 수정 가능. ② 단계의 본격 편집과 병행 OK.
- DataMiniDialog 자체의 inline 강화는 별도 plan (이 spec 의 범위 외).
- Layer 간 관계 (master-detail) 는 Phase 2D-2 별도.

---

## 관련 파일

- `frontend/src/view/util/t3composer/ComposerCanvas.jsx` — dead 분기 4곳 + state + import 제거
- `frontend/src/view/util/t3composer/LayoutStep.jsx` — mode prop 호출 제거
- `frontend/src/view/util/t3composer/ScreenMetaDialog.jsx` — 파일 삭제

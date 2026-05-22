# Composer Canvas Phase 2E-2 — FilterBar Inline 강화 Design

**Goal:** Wizard 의 ② 데이터·검색조건 단계의 **우측 FilterBar 패널을 popup 없이 직접 편집 가능**한 inline editor 로 강화한다. 현재는 [편집] 버튼 → `FilterBarMiniDialog` popup 으로 분리돼 있는데 이를 panel 안에서 완결되도록 한다.

**Architecture:** 280px 우측 패널 안에 inline editable field cards. 각 card 는 label/type 편집 + affects chip toggle 을 포함. 변경 즉시 spec 반영 (debounce). `FilterBarMiniDialog` 와 [편집] 버튼은 제거.

**Tech Stack:** React 18 + MUI 5. 기존 DataAndFilterStep 컴포넌트 확장.

---

## 1. 현재 상태 (Phase 2E-1 종료 시점)

`DataAndFilterStep.jsx`:
- 좌측: layer 카드 list (클릭 → DataMiniDialog popup)
- 우측 280px 노란 패널:
  - header: 🔍 FilterBar (검색조건) + [편집] 버튼
  - read-only field cards (label + type, click 안 됨)
  - [편집] 클릭 → `FilterBarMiniDialog` popup 으로 진짜 편집

`FilterBarMiniDialog.jsx`:
- 모달 다이얼로그
- 필드 목록 테이블 (Label/Type/Delete 3 컬럼)
- [+ 필드 추가] 버튼
- affects 매핑 테이블 (Layer × Field 격자 + checkbox)
- [취소]/[적용] 버튼

**문제**: popup 호출 → 편집 → 적용 → 닫기 4-step. wizard 의 ② 단계가 본질적으로 FilterBar 편집 화면인데 popup 분리는 잉여 행동.

## 2. 목표 (Phase 2E-2 종료 시점)

우측 280px 패널이 **그 자체로 편집기**:

```
┌── 🔍 FilterBar (검색조건) ─────────┐
│                       [+ 필드 추가]  │
│  ┌────────────────────────────────┐ │
│  │ Label: [사용자 ID         ]  ✕ │ │
│  │ Type:  [TEXT             ▼]    │ │
│  │ 영향: ✓Layer1 ✓Layer2 ☐Layer3 │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ Label: [기간              ]  ✕ │ │
│  │ Type:  [DATE_RANGE       ▼]    │ │
│  │ 영향: ✓Layer1 ☐Layer2 ✓Layer3 │ │
│  └────────────────────────────────┘ │
│                                      │
│  (필드 없음 시 “+ 필드 추가” 만 노출) │
└──────────────────────────────────────┘
```

- 모든 변경 즉시 `onChange(nextSpec)` 발화 (popup 의 [적용] 폐기 — `wizardState` 의 단방향 흐름과 일치)
- [편집] 버튼 제거
- `FilterBarMiniDialog` 파일 삭제

## 3. 컴포넌트 분해

```
DataAndFilterStep
├── 좌측: layer 카드 list (변경 없음)
└── 우측: FilterBarInlinePanel  ★ 신규
    ├── header: 타이틀 + [+ 필드 추가] (우측 정렬)
    └── List<FilterFieldCard>      ★ 신규 (반복)
        ├── 1행: TextField (label)        + IconButton 삭제
        ├── 2행: Select (type)
        └── 3행: AffectsChipRow            ★ 신규
            └── 각 layer 마다 Chip (선택/미선택 toggle)
```

**신규 파일 2개**:
- `FilterBarInlinePanel.jsx` — 우측 패널 전체 (DataAndFilterStep 에서 import)
- `FilterFieldCard.jsx` — 개별 필드 카드 (FilterBarInlinePanel 의 자식)

`AffectsChipRow` 는 `FilterFieldCard` 안에 inline 함수로 두거나 같은 파일에 sub-component 로 (분리 별 가치 없음).

## 4. 데이터 흐름

```
FilterBarInlinePanel
  props: { spec, onChange }
  
  derived:
    items   = spec.filterBar?.items ?? []
    affects = spec.filterBar?.affects ?? {}
    layers  = spec.layers ?? []
  
  handlers (모두 onChange 호출 — 부모가 spec 갱신):
    handleAddField()      → items 끝에 새 field 추가 + 모든 layer 에 default affect (f8d675f 의 정책 유지)
    handleRemoveField(k)  → items 에서 제거 + affects 모든 layer 의 그 key 제거
    handleUpdateField(idx, patch)  → items[idx] = { ...items[idx], ...patch }
    handleToggleAffect(layerKey, fieldKey)  → affects[layerKey] 에서 fieldKey toggle

FilterFieldCard
  props: { field, layers, affectsForField, onUpdate, onRemove, onToggleAffect }
```

상태는 모두 부모 spec 의 derived value — 로컬 useState 없음 (controlled input).

## 5. UI 상세

### 5.1 폭 & 여백
- 우측 패널 폭 = 280px 유지 (Phase 2E-1 그대로)
- 패널 내부 padding 1.5 (12px)
- field 카드 간 gap 1 (8px)

### 5.2 필드 카드 스타일
```jsx
{
  bgcolor: '#fff',
  border: '1px solid #fbbf24',  // 노란 (panel 의 #f59e0b 와 일관)
  borderRadius: 1,
  p: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 0.7,
}
```

### 5.3 label/type 입력
- `TextField` size="small" variant="standard" fullWidth (밀착, label 위쪽 placeholder)
- `Select` size="small" variant="standard" fullWidth
- 폰트 크기 12px (현재 panel 의 캡션과 일관)

### 5.4 영향 chip
```
영향: ✓Layer1 ✓Layer2 ☐Layer3
```
- 라벨 + chip 들을 한 줄로 flex wrap
- Chip size="small" — clickable
- 선택: `bgcolor: '#92400e', color: '#fff'`
- 미선택: `bgcolor: '#fef3c7', color: '#92400e', border: '1px dashed #fbbf24'`
- onClick → `onToggleAffect(layer.key, field.key)`

### 5.5 [+ 필드 추가] 버튼
- 패널 header 우측 정렬 (현재 [편집] 위치)
- size="small" startIcon=AddIcon
- 색: 노란 panel theme

### 5.6 빈 상태
- 필드 0개일 때: "필드 없음 — [+ 필드 추가] 클릭" 안내 (현재 동일)

## 6. 제거 대상

- `FilterBarMiniDialog.jsx` — 파일 삭제
- `DataAndFilterStep.jsx` 의 [편집] 버튼 + FilterBarMiniDialog import + filterDialogOpen state
- `ComposerCanvas.jsx` 의 FilterBarMiniDialog 호출 (있다면 — Phase 2E-1 의 mode='all' 분기에서 popup 노란 띠 클릭 경로 — 확인 필요)

`FilterBarMiniDialog` 가 다른 호출처에서 사용되지 않는지 확인 후 삭제.

## 7. 호환성

- spec 의 `filterBar.items` / `filterBar.affects` 데이터 구조 변경 없음 — wizardState 의 모든 흐름 그대로
- `defaultValueExpression` 등 mini dialog 가 다루지 않던 고급 필드는 본 plan 외 (필요 시 별도 plan)
- ComposerCanvas 의 mode='all' 분기 (다른 호출처) 의 FilterBar 노란 띠 click 경로는 Phase 2E-3 에서 정리

## 8. Testing

- 테스트 환경 없음 — webpack dev server 시각 검증
- 시나리오:
  1. 패턴 picker → wizard 진입 → ② 단계 → 우측 패널 inline 편집 가능 확인
  2. [+ 필드 추가] → 새 카드 즉시 추가 + 모든 layer affect default ✓
  3. label 입력 → spec.filterBar.items[*].label 즉시 반영
  4. type Select 변경 → spec.filterBar.items[*].type 즉시 반영
  5. 영향 chip 클릭 → affects 토글
  6. ✕ → 카드 제거 + affects 정리
  7. ④ 화면 생성 진입 → spec 그대로 Claude prompt 에 포함 (Phase 2E-1 동작 유지)

## 9. Out of scope (별도 plan)

- Phase 2E-3: ScreenMetaDialog 코드 제거 + ComposerCanvas mode='layout' 미완성 부분
- Phase 2D-2: Layer 간 관계 설정 (master-detail / drill-down)
- FilterBar 의 고급 메타 (defaultValueExpression / nullWhenEmpty / flatten 등) inline 편집
- 필드 순서 drag-reorder

---

## 관련 파일

- `docs/superpowers/specs/2026-05-22-composer-canvas-wizard-redesign-design.md` — Phase 2E 전체 spec
- `docs/superpowers/plans/2026-05-22-composer-canvas-phase2e1.md` — Phase 2E-1 plan (직전 단계)
- `frontend/src/view/util/t3composer/DataAndFilterStep.jsx` — 우측 패널 수정 대상
- `frontend/src/view/util/t3composer/FilterBarMiniDialog.jsx` — 삭제 대상
- `frontend/src/view/util/t3composer/wizardState.js` — spec.filterBar 데이터 구조

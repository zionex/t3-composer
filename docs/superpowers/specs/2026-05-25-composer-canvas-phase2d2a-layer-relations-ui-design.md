# Composer Canvas Phase 2D-2a — Layer Relations UI Design

**Goal:** Wizard 의 ② 데이터·검색조건 단계에 **Layer 간 관계 설정 UI** 를 추가한다. 사용자가 master layer ↔ detail layer 의 trigger / action / mapping 을 inline 으로 정의할 수 있게 한다.

**Architecture:** `spec.relations[]` 신규 배열. `DataAndFilterStep` 우측 패널 (현 FilterBarInlinePanel) 아래에 `LayerRelationsPanel` 추가. 각 관계 카드는 `LayerRelationCard` 컴포넌트. Phase 2D-2a 는 데이터 + UI 만 — LLM 산출 변환은 Phase 2D-2b.

**Tech Stack:** React 18 + MUI 5. 기존 패턴 (controlled props, immediate spec 갱신) 유지.

---

## 1. 배경

현재 Wizard 의 spec 은 `meta` / `layers` / `filterBar` 3개 토픽. layer 간 의존성 (master row 선택 → detail 재조회 같은 drill-down/master-detail) 은 표현 수단이 없어 Claude 가 추측해 생성해야 함. 사용자가 명시적으로 정의할 수 있는 토픽 추가.

## 2. 데이터 모델

`spec.relations[]` 신규 배열 — wizardState.js 의 `createComposerSpec()` 에 추가.

```js
spec.relations = [
  {
    id: 'rel_xxx',               // 자동 생성 (Date.now+random)
    source: {
      layerKey: 'masterGrid',    // spec.layers 의 key 참조
      event: 'cellClick',        // §3.1 표 참조
    },
    target: {
      layerKey: 'detailGrid',    // spec.layers 의 key 참조
      action: 'refetch',         // §3.2 표 참조
    },
    mapping: {
      // source 필드 → target param/필드
      // 예: 'orderId': 'orderId', 'region': 'regionCd'
      'orderId': 'orderId',
    },
  },
]
```

### 2.1 빈 spec 초기값

`createComposerSpec()` 의 반환에 `relations: []` 추가. 기존 NEW_STEP 흐름에 영향 0 (빈 배열은 LLM 에게 무관).

### 2.2 layer 삭제 시 정리

`removeLayer(spec, key)` 가 호출되면 `spec.relations` 중 source.layerKey 또는 target.layerKey 가 그 key 인 항목 자동 제거. wizardState.js 의 기존 cascade 정리 패턴 (filterBar.affects 정리와 동일) 확장.

## 3. Trigger / Action 카탈로그

### 3.1 source.event (5종)

| 값 | 의미 | 적용 layer 타입 |
|---|---|---|
| `cellClick` | 그리드 셀 1회 클릭 / chart point 클릭 | GRID · CHART |
| `cellDblClick` | 그리드 셀 더블클릭 | GRID |
| `selectionChange` | 그리드 행 선택 변경 (chip/checkbox) | GRID |
| `valueChange` | form / chart filter value 변경 | FORM · CHART |
| `manual` | 사용자가 [조회] 버튼 등 명시 trigger | ALL |

UI 는 모든 event 노출 (layer type 별 disable 안 함) — 사용자가 자유 선택, LLM 이 적절히 해석.

### 3.2 target.action (3종)

| 값 | 의미 |
|---|---|
| `refetch` | 새 param 으로 server 재조회 (zAxios.get 호출) |
| `filter` | 로컬 데이터 client-side 필터 (이미 fetch 된 데이터에서 추출) |
| `setValue` | form/검색조건 값만 setValue (자동 fetch 없음, 사용자가 별도 [조회] 누름) |

## 4. UI 컴포넌트

### 4.1 위치

`DataAndFilterStep` 우측 280px 노란 패널 (현 `FilterBarInlinePanel`) **아래** 새 보라 패널 (`LayerRelationsPanel`).

```
┌── 좌측 (layer 카드들) ──┐  ┌── 우측 ──┐
│                          │  │ 🔍 FilterBar     │
│  ...                     │  │   ...            │
│                          │  │                  │
│                          │  ├──────────────────┤
│                          │  │ 🔗 Layer 관계    │
│                          │  │   [+ 관계 추가]  │
│                          │  │                  │
│                          │  │   각 관계 카드    │
│                          │  │                  │
└──────────────────────────┘  └──────────────────┘
```

DataAndFilterStep 의 우측 영역을 column flex 로 — FilterBarInlinePanel + LayerRelationsPanel 세로 배치.

### 4.2 LayerRelationsPanel

```jsx
<Box sx={{ width: 280, flexShrink: 0, ...보라 패널 스타일 }}>
  <Stack direction="row">
    <LinkIcon /> 🔗 Layer 관계
    <Button> + 관계 추가 </Button>
  </Stack>
  {relations.length === 0 && <빈 상태 안내 />}
  {relations.map(r => <LayerRelationCard relation={r} layers={layers}
                                          onUpdate={...} onRemove={...} />)}
</Box>
```

색 톤: 보라 (`#f3e8ff` bg + `#a855f7` border + `#6b21a8` text) — FilterBar 노란 / Data 파랑 과 구분.

### 4.3 LayerRelationCard

```
┌── 카드 ────────────────────────────┐
│ Source                          ✕  │
│   layer:  [▼ masterGrid          ] │
│   event:  [▼ cellClick           ] │
│ Target                              │
│   layer:  [▼ detailGrid          ] │
│   action: [▼ refetch             ] │
│ Mapping                             │
│   [orderId    ] → [orderId      ] ✕│
│   [region     ] → [regionCd     ] ✕│
│   [+ mapping 추가]                  │
└─────────────────────────────────────┘
```

- Source/Target layer dropdown: `spec.layers` 의 layer.key 들 (+ title 표시)
- event/action: §3 의 enum dropdown
- mapping: key-value text pair 리스트. [+] 으로 추가, [×] 로 제거. 빈 mapping 허용 (LLM 이 source 행 전체를 param 으로 처리하도록 해석)
- 카드 우상단 [✕] 로 관계 자체 삭제

### 4.4 사용성 — disable 조건

- source.layerKey 와 target.layerKey 가 같으면 (self-relation) 경고 표시. 저장은 허용 (사용자 의도 우선).
- 같은 (source, target) 쌍이 이미 있으면 중복 경고 (저장 허용).
- layers 가 1개 이하면 [+ 관계 추가] disabled + 안내 "layer 2개 이상 필요".

## 5. 검증 (Wizard 검증 통합)

`ComposerWizard.validateStep('DATA')` 에 추가:
- 각 relation 의 source.layerKey · target.layerKey 가 spec.layers 에 존재하는지 (orphan 검사)
- orphan 있으면 "관계 N개의 layer 가 존재하지 않습니다. 정리 후 다음으로 진행." Snackbar.
- mapping 의 키/값이 모두 빈 문자열인 항목은 자동 제외 (저장 시점에 filter).

Phase 2D-2a 는 검증 최소만 — orphan + 빈 mapping 자동 정리.

## 6. wizardState.js 변경

| 함수 | 변경 |
|---|---|
| `createComposerSpec()` | `relations: []` 추가 |
| `addLayer(spec, init)` | 변경 없음 (관계는 사용자가 명시 추가) |
| `removeLayer(spec, key)` | `spec.relations` 에서 source/target.layerKey 가 그 key 인 항목 필터 아웃 추가 |
| `addRelation(spec, init)` | **신규** export — id 자동 부여, 빈 mapping 으로 시작 |
| `removeRelation(spec, id)` | **신규** export |
| `updateRelation(spec, id, patch)` | **신규** export |

## 7. specToInitialPrompt 변경

Phase 2D-2a 범위 외 — Phase 2D-2b 에서 처리. 그러나 placeholder 1줄 추가:
```js
// 5.5) Layer 관계 (Phase 2D-2b 에서 본격 출력)
if (spec.relations && spec.relations.length > 0) {
  lines.push('');
  lines.push(`[Layer 관계 (${spec.relations.length}개 — Phase 2D-2b 에서 prompt 정식 통합)]`);
  spec.relations.forEach((r) => {
    lines.push(`- ${r.source.layerKey} (${r.source.event}) → ${r.target.layerKey} (${r.target.action})`
             + (Object.keys(r.mapping || {}).length > 0
                ? ` | mapping: ${Object.entries(r.mapping).map(([k,v]) => `${k}→${v}`).join(', ')}`
                : ''));
  });
}
```

Claude 가 informal 정보로 해석 가능 — 정식 가이드는 Phase 2D-2b.

## 8. Out of scope (Phase 2D-2a)

- **LLM 산출 변환** — spec.relations → JSX 의 `onCellClick`/`onItemClicked` 패턴. **Phase 2D-2b**.
- **end-to-end 검증** — 실제 화면에서 master row 클릭 → detail 재조회. **Phase 2D-2c**.
- **다른 모드 적용** — NEW_FROM_COPY 등 STEP 분기 마이그레이션 + 관계 inherit. **Phase 3b~3e** (이미 토대는 3a 완료).
- **visual line drawing** — canvas 위 화살표. 별도 plan.
- **N:N 그래프 시각화** — 같은 source 가 여러 target 으로 / 여러 source 가 한 target 으로 — 데이터 모델은 표현 가능하나 UI 시각화는 카드 list 만.
- **transform 함수** — mapping 의 값 변환 (예: `region.toUpperCase()`). 단순 key-pass 만.

---

## 관련 파일

- `frontend/src/view/util/t3composer/wizardState.js` — createComposerSpec/removeLayer 수정 + addRelation/removeRelation/updateRelation export
- `frontend/src/view/util/t3composer/DataAndFilterStep.jsx` — 우측 영역 column flex + LayerRelationsPanel 추가
- `frontend/src/view/util/t3composer/LayerRelationsPanel.jsx` — **신규**
- `frontend/src/view/util/t3composer/LayerRelationCard.jsx` — **신규**
- `frontend/src/view/util/t3composer/ComposerWizard.jsx` — validateStep('DATA') 의 orphan 검사 추가

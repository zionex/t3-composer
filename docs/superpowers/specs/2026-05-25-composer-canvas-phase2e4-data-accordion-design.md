# Composer Canvas Phase 2E-4 — Data Step 컴팩트 list + Inline Accordion Design

**Goal:** ② 데이터·검색조건 단계의 좌측 layer 영역을 컴팩트 list (height 36px 한 줄) + 클릭 시 accordion 으로 펼침 (inline 편집) 으로 재설계. popup (DataMiniDialog) 사용 제거.

**Architecture:** DataMiniDialog 본문을 신규 `DataInlineEditor` 컴포넌트로 추출 (controlled props — 즉시 onChange). DataAndFilterStep 좌측은 layer-row + (펼친 상태) DataInlineEditor 렌더. DataMiniDialog 자체는 ComposerCanvas (layout 단계 layer 클릭 popup) 호환 용으로 `DataInlineEditor` 를 wrap 하는 thin shell 로 유지.

**Tech Stack:** React 18 + MUI 5.

---

## 1. 현재 상태 (Phase 2D-2a 종료)

`DataAndFilterStep`:
- 좌측 (flex 1): layer 카드 큰 list — 각 카드 padding 1.5 · 칩 + title + meta · 70-80px 높이. layer 5개면 400px 차지.
- 카드 클릭 → `DataMiniDialog` popup.
- 우측 280px column: FilterBarInlinePanel + LayerRelationsPanel.

**문제**:
- 좌측 카드 정보 밀도 낮음 (`title` + `type/subtype` + `'설정됨'/'미설정'` chip — 한 줄에 충분).
- 좌측은 popup, 우측은 inline 인 비대칭.
- 데이터 의도 / 참조 / SQL 본문이 popup 안에 숨겨져 한 눈에 안 보임.

`DataMiniDialog`:
- DialogContent 안 (line 178-356) 의 본문 = 자연어 TextField + 참조 chips + + Table/SP/Entity/SQL 버튼 + Table/SP autocomplete UI + SQL 추가 UI + 등록된 SQL 목록.
- Local state (naturalText/references/sqlBlocks) + [적용] 버튼으로 spec 갱신.

## 2. 목표

### 2.1 좌측 layer 영역

```
┌── 📐 Body Layers — 클릭하여 데이터 편집 ──────────┐
│  ▸ 📊 masterGrid    ✓ 설정됨               GRID  │  ← 36px 한 줄
│  ▾ 📊 detailGrid    미설정                 GRID  │  ← 펼친 상태 (확장)
│  ┌─ DataInlineEditor (inline) ───────────────┐    │
│  │ 💬 자연어 [                           ]   │    │
│  │ 🔗 참조 [TB_X][SP_Y]                       │    │
│  │   + Table  + SP  + Entity  + SQL          │    │
│  │ 📄 등록된 SQL (0)                          │    │
│  └─────────────────────────────────────────────┘    │
│  ▸ 📈 chartLayer    미설정                 CHART │
└──────────────────────────────────────────────────┘
```

- 각 layer-row: ▸/▾ + icon + title + 설정상태 chip + type chip — height 36px
- 클릭 시 토글 — 펼치면 그 자리에 inline `DataInlineEditor` 렌더
- 단일 펼침 모드 (한 번에 하나만 열림 — 다른 행 펼치면 이전 자동 닫힘)
- 동시 펼침 X (UI 단순 + 화면 공간 절약)

### 2.2 우측

변경 없음 — FilterBarInlinePanel + LayerRelationsPanel.

### 2.3 DataMiniDialog

- ComposerCanvas 의 layer 클릭 popup 용으로 유지 — 본문은 DataInlineEditor 사용으로 위임.
- local buffer state (naturalText/references/sqlBlocks) → [적용] 시 onApply 호출 — 기존 동작 유지.
- DialogContent 안의 inline 코드 제거 — `<DataInlineEditor ...>` 한 줄로 대체.

## 3. DataInlineEditor 컴포넌트

### Props (controlled)

```js
{
  dataSource,   // { mode, naturalText, references, sqlBlocks }
  onChange(next), // dataSource 부분/전체 갱신 호출 — 즉시 spec 갱신
  targetCd,     // Table/SP autocomplete 옵션 fetch
  onOpenDataSourcePicker?, // optional — 풀스크린 탐색 진입
  layer?,       // optional title 표시용 (없으면 헤더 생략)
}
```

### 내부

기존 DataMiniDialog 본문의 모든 동작 그대로:
- 자연어 TextField
- 참조 chips (Table/SP/Entity)
- + Table/SP/Entity/SQL 추가 UI (Autocomplete · 자유 텍스트 · multiline)
- 등록된 SQL 블록 목록 (편집 가능)

차이: local state 없이 onChange 만 호출 — 매 변경마다 부모 spec 즉시 갱신.

내부 helper:
```js
const patch = (k, v) => onChange({ ...dataSource, [k]: v });
// 자연어 변경: patch('naturalText', e.target.value)
// 참조 추가:   onChange({ ...dataSource, references: [...references, newRef] })
// SQL 추가:    onChange({ ...dataSource, sqlBlocks: [...sqlBlocks, newSql] })
```

mode 추론은 onChange 시점에 매번 다시 계산 — 또는 부모가 책임. 단순화: DataInlineEditor 가 references/sqlBlocks 변경 시 mode 도 함께 갱신.

## 4. DataAndFilterStep 좌측 재설계

### 4.1 단일 펼침 state

```jsx
const [expandedLayerKey, setExpandedLayerKey] = useState(null);
// 클릭: setExpandedLayerKey(k === expandedLayerKey ? null : k)
```

### 4.2 layer-row 컴포넌트 (inline, 별도 파일 X — 가벼움)

```jsx
<Box
  onClick={() => setExpandedLayerKey(k === expandedLayerKey ? null : k)}
  sx={{ height: 36, display: 'flex', alignItems: 'center', px: 1, gap: 1,
        bgcolor: '#fff', border: '1px solid #cbd5e1', borderLeft: `4px solid ${LAYER_TYPE_ACCENT[l.type]}`,
        borderRadius: 1, cursor: 'pointer',
        '&:hover': { bgcolor: '#f8fafc' } }}
>
  <ExpandMoreIcon sx={{ fontSize: 16, transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
  <Typography sx={{ flex: 1, fontSize: 12, fontWeight: 700 }}>{l.title || l.key}</Typography>
  <Chip size="small" label={hasData ? '✓' : '미설정'} sx={{ height: 18, fontSize: 10 }} />
  <Typography sx={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{l.type}</Typography>
</Box>
{expanded && (
  <Box sx={{ p: 1.5, border: '1px solid #cbd5e1', borderTop: 'none', borderRadius: '0 0 4px 4px', bgcolor: '#f8fafc' }}>
    <DataInlineEditor
      dataSource={l.dataSource}
      onChange={(nextDs) => handleApplyLayer({ ...l, dataSource: nextDs })}
      targetCd={targetCd}
      layer={l}
    />
  </Box>
)}
```

### 4.3 DataMiniDialog 호출 제거

`editingLayerKey` state + `DataMiniDialog` import/render 모두 제거. accordion 으로 대체.

## 5. wizardState 변경

없음. spec.layers[].dataSource 구조 그대로.

## 6. 호환성

- ComposerCanvas (LayoutStep) 의 layer 클릭 → DataMiniDialog popup 그대로 동작. (DataMiniDialog 가 내부적으로 DataInlineEditor 사용 — 본문 동일)
- spec 구조 변경 0 — 데이터 흐름 그대로.

## 7. Out of scope

- 다중 펼침 — 화면 공간 절약 위해 단일 펼침. 필요 시 별도 plan.
- Drag reorder — layer 순서 변경. 별도 plan.
- Data Source 별자리 picker integration — onOpenDataSourcePicker prop 그대로 옵션 노출.

---

## 관련 파일

- `frontend/src/view/util/t3composer/DataInlineEditor.jsx` — **신규**
- `frontend/src/view/util/t3composer/DataMiniDialog.jsx` — DialogContent 본문을 DataInlineEditor 로 위임
- `frontend/src/view/util/t3composer/DataAndFilterStep.jsx` — 좌측 컴팩트 list + accordion
- `frontend/src/view/util/t3composer/ComposerCanvas.jsx` — 변경 없음 (DataMiniDialog 호출 그대로)

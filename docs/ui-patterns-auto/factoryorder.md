# factoryorder 모듈 — UI 패턴 카탈로그

> Phase 1 자동 분류 결과 (생성: `ui-patterns-gen.cjs`). 정정·보강 환영.

## 요약

| 항목 | 값 |
|---|---:|
| 총 화면 | 9 |
| 등록 메뉴 (UI_*) | 4 |
| 위젯 | 0 |
| 팝업 | 0 |
| Base 래퍼 | 0 |
| Sub-component | 0 |

### 레이아웃 카테고리 분포

| 카테고리 | 화면 수 |
|---|---:|
| 01 미분할 (단일) | 9 |

### 패턴 분포 (상위 10)

| 패턴 | 화면 수 |
|---|---:|
| P02 검색 + 그리드 (마스터 CRUD) (`search_grid`) | 3 |
| P09 차트 단독 (`P09_chart_view`) | 3 |
| 비표준 / 자유 폼 (`free_form`) | 2 |
| P02b 그리드 전용 (검색 없음) (`P02b_grid_only`) | 1 |

---
## 화면별 상세

### 01 미분할 (단일) (9개)

#### Mrp (`UI_FO_MRP`)

- 경로: `view/factoryorder/mrp/Mrp.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, InputField:3
- 호출: `factoryorder/mrp` · `factoryorder/versions`

```
┌──────────────────────────────┐
│ Search: id / nm / useYn      │
├──────────────────────────────┤
│ + Add  Delete  Save  Excel   │
│ ┌──────────────────────────┐ │
│ │ BaseGrid (N cols × N rows)│ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### MrpChart

- 경로: `view/factoryorder/mrp/MrpChart.jsx`
- 패턴: **P09 차트 단독** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: Chart=1
- 컴포넌트: ChartComponent:1

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│   ▁ ▃ ▅ ▇ █ ▇ ▅ ▃            │
│   ●─●─●─●─●─●                │
│   (ChartComponent)           │
└──────────────────────────────┘
```

#### OrderAdjustment (`UI_FO_ORDER_ADJUSTMENT`)

- 경로: `view/factoryorder/orderadjustment/OrderAdjustment.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, InputField:5
- 호출: `factoryorder/versions` · `factoryorder/adjustorders`

```
┌──────────────────────────────┐
│ Search: id / nm / useYn      │
├──────────────────────────────┤
│ + Add  Delete  Save  Excel   │
│ ┌──────────────────────────┐ │
│ │ BaseGrid (N cols × N rows)│ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### OrderAdjustmentChart

- 경로: `view/factoryorder/orderadjustment/OrderAdjustmentChart.jsx`
- 패턴: **P09 차트 단독** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: Chart=1
- 컴포넌트: ChartComponent:1

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│   ▁ ▃ ▅ ▇ █ ▇ ▅ ▃            │
│   ●─●─●─●─●─●                │
│   (ChartComponent)           │
└──────────────────────────────┘
```

#### OrderConversionPopup

- 경로: `view/factoryorder/orderadjustment/popup/OrderConversionPopup.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:2, PopupDialog:1
- 호출: `factoryorder/actions/adjust`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### OrderCreation (`UI_FO_ORDER_CREATION`)

- 경로: `view/factoryorder/ordercreation/OrderCreation.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: ContentInner:1, WorkArea:1, InputField:5
- 호출: `factoryorder/versions` · `factoryorder/actions/convert`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### OrderDetailAdjustmentPopup

- 경로: `view/factoryorder/orderadjustment/popup/OrderDetailAdjustmentPopup.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `factoryorder/adjustorders/split-orders`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### RequestAnalysis (`UI_FO_REQUEST_ANALYSIS`)

- 경로: `view/factoryorder/requestanalysis/RequestAnalysis.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, InputField:5
- 호출: `factoryorder/versions` · `factoryorder/requestorders`

```
┌──────────────────────────────┐
│ Search: id / nm / useYn      │
├──────────────────────────────┤
│ + Add  Delete  Save  Excel   │
│ ┌──────────────────────────┐ │
│ │ BaseGrid (N cols × N rows)│ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### RequestAnalysisChart

- 경로: `view/factoryorder/requestanalysis/RequestAnalysisChart.jsx`
- 패턴: **P09 차트 단독** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: Chart=1
- 컴포넌트: ChartComponent:1

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│   ▁ ▃ ▅ ▇ █ ▇ ▅ ▃            │
│   ●─●─●─●─●─●                │
│   (ChartComponent)           │
└──────────────────────────────┘
```

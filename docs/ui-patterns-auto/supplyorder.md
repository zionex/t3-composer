# supplyorder 모듈 — UI 패턴 카탈로그

> Phase 1 자동 분류 결과 (생성: `ui-patterns-gen.cjs`). 정정·보강 환영.

## 요약

| 항목 | 값 |
|---|---:|
| 총 화면 | 7 |
| 등록 메뉴 (UI_*) | 5 |
| 위젯 | 0 |
| 팝업 | 0 |
| Base 래퍼 | 0 |
| Sub-component | 0 |

### 레이아웃 카테고리 분포

| 카테고리 | 화면 수 |
|---|---:|
| 01 미분할 (단일) | 4 |
| 11 상하 2분할 | 3 |

### 패턴 분포 (상위 10)

| 패턴 | 화면 수 |
|---|---:|
| v2 차트 + 그리드 (수직 스택) (`grid_chart_stacked`) | 3 |
| 비표준 / 자유 폼 (`free_form`) | 2 |
| P02 검색 + 그리드 (마스터 CRUD) (`search_grid`) | 1 |
| P03 검색 + 탭 그리드 (`search_tab`) | 1 |

---
## 화면별 상세

### 01 미분할 (단일) (4개)

#### SoItemTrend (`UI_SO_ITEMTREND`)

- 경로: `view/supplyorder/soitemtrend/SoItemTrend.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, PlanScope:1
- SP: `SP_UI_SO_ADJUST_DMD_TP` · `SP_UI_SO_ITEM_TREND_Q1`
- 호출: `engine/dp/SRV_UI_DP_00_POPUP_ITEM_TREE_Q2` · `engine/dp/SRV_GET_SP_UI_SO_ITEM_TREND_Q1`

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

#### SoPopRegister

- 경로: `view/supplyorder/soadjust/SoPopRegister.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: TabContainer:1, InputField:9, PopSelectItem:1, PopSelectAccount:1, PopupDialog:1
- SP: `SP_UI_SO_ADJUST_S1` · `SP_UI_SO_ADJUST_S1_P_RT_MSG`

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│ [ Tab1 ][ Tab2 ][ Tab3 ]     │
│ ┌──────────────────────────┐ │
│ │ BaseGrid / Chart          │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### SoSplitDialog

- 경로: `view/supplyorder/soadjust/SoSplitDialog.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- SP: `SP_UI_SO_ADJUST_SEPERATE` · `SP_UI_SO_ADJUST_SEPERATE_P_RT_MSG`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### SoTransform (`UI_SO_TRANSFORM`)

- 경로: `view/supplyorder/sotransform/SoTransform.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: ContentInner:1, WorkArea:1, PlanScope:1
- SP: `SP_UI_SO_TRANS_LOC` · `SP_UI_SO_TRANS_VER` · `SP_UI_SO_TRANS_CONFIG` · `SP_UI_SO_TRANS_CONFIRM` · `SP_UI_SO_TRANS_CONFIRM_P_RT_MSG`
- 호출: `engine/dp/`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

### 11 상하 2분할 (3개)

#### DpAnalysis (`UI_SO_DPANALYSIS`)

- 경로: `view/supplyorder/dpanalysis/DpAnalysis.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, GridCnt:1, InputField:1, …
- SP: `SP_UI_SO_TRANS_VER`
- 호출: `engine/dp/GetDpAnalysisChart` · `engine/dp/GetDpAnalysis`

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ Chart                     │ │
│ ├──────────────────────────┤ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### SoAdjust (`UI_SO_ADJUST`)

- 경로: `view/supplyorder/soadjust/SoAdjust.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, GridDeleteRowButton:1, GridSaveButton:1, …
- SP: `SP_UI_SO_ADJUST_DMD_TP` · `SP_UI_SO_ADJUST_CONFIG` · `SP_UI_SO_URGENT_TP` · `SP_UI_SO_DEMAND_CLASS` · `SP_UI_SO_ADJUST_MERGE`
- 호출: `engine/dp/SRV_GET_SP_UI_SO_ADJUST_CHART_Q1` · `engine/dp/SRV_GET_SP_UI_SO_ADJUST_CHART_Q2` · `so/adjust`

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ Chart                     │ │
│ ├──────────────────────────┤ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### SoAnalysis (`UI_SO_ANALYSIS`)

- 경로: `view/supplyorder/soanalysis/SoAnalysis.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, PlanScope:1, PopPersonalize:1
- SP: `SP_UI_SO_ANALYSIS_Q2` · `SP_UI_SO_ANALYSIS_CHART_Q1`
- 호출: `engine/dp/SRV_GET_SP_UI_SO_ANALYSIS_Q2` · `engine/dp/SRV_GET_SP_UI_SO_ANALYSIS_CHART_Q1`

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ Chart                     │ │
│ ├──────────────────────────┤ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

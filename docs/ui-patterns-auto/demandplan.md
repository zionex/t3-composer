# demandplan 모듈 — UI 패턴 카탈로그

> Phase 1 자동 분류 결과 (생성: `ui-patterns-gen.cjs`). 정정·보강 환영.

## 요약

| 항목 | 값 |
|---|---:|
| 총 화면 | 103 |
| 등록 메뉴 (UI_*) | 42 |
| 위젯 | 16 |
| 팝업 | 15 |
| Base 래퍼 | 6 |
| Sub-component | 0 |

### 레이아웃 카테고리 분포

| 카테고리 | 화면 수 |
|---|---:|
| 01 미분할 (단일) | 48 |
| 11 상하 2분할 | 12 |
| 12 상하 3분할 | 1 |
| 31 혼합·격자·특수 | 1 |
| 91 ControlBoard | 2 |
| 95 RouteLayout | 2 |
| — 팝업 | 15 |
| — 위젯 | 16 |
| — Base 래퍼 | 6 |

### 패턴 분포 (상위 10)

| 패턴 | 화면 수 |
|---|---:|
| 비표준 / 자유 폼 (`free_form`) | 30 |
| 팝업 다이얼로그 (`popup`) | 15 |
| P02 검색 + 그리드 (마스터 CRUD) (`search_grid`) | 13 |
| 위젯 (차트) (`widget_chart`) | 10 |
| v2 듀얼 그리드 2-stack (`v2_dual_grid`) | 7 |
| Base 래퍼 (`base_wrapper`) | 6 |
| 위젯 (자유) (`widget_misc`) | 6 |
| v2 차트 + 그리드 (수직 스택) (`grid_chart_stacked`) | 5 |
| P04 트리 그리드 (`h2_tree_grid`) | 2 |
| P01 위젯 대시보드 (`widget_dashboard`) | 2 |

---
## 화면별 상세

### 01 미분할 (단일) (48개)

#### Account (`UI_DP_11`)

- 경로: `view/demandplan/master/account/Account.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:2, WorkArea:1, BaseGrid:1, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- SP: `SP_UI_DP_00_SALES_LV_DATA_Q1` · `SP_UI_DP_00_CONF_Q1` · `SP_UI_DP_00_CONF_Q1_01` · `SP_UI_DP_00_CONF_Q1_02` · `SP_UI_DP_00_CONF_Q1_03`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_11_Q1` · `engine/dp/SRV_SET_SP_UI_DP_11_D1`

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

#### AccountSearchInput

- 경로: `view/demandplan/common/AccountSearchInput.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:1

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### ActualSales (`UI_DP_42`)

- 경로: `view/demandplan/master/actualsales/ActualSales.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- SP: `SP_UI_DP_00_CONF_Q1` · `SP_UI_DP_00_CONF_Q1_01` · `SP_UI_DP_00_CONF_Q1_02` · `SP_UI_DP_00_CONF_Q1_03` · `SP_UI_DP_42_S1_J`
- 호출: `dp/actualsales` · `engine/dp/SRV_SET_SP_UI_DP_42_D1`

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

#### AllReport (`UI_DP_96`)

- 경로: `view/demandplan/entry/allreport/AllReport.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### AllReport (`UI_BP_96`)

- 경로: `view/demandplan/yearlyplan/allreport/AllReport.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### AllReportChart (`UI_DP_96_CHART`)

- 경로: `view/demandplan/entry/allreportchart/AllReportChart.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### AllReportChart (`UI_BP_96_CHART`)

- 경로: `view/demandplan/yearlyplan/allreportchart/AllReportChart.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### AntSwitch

- 경로: `view/demandplan/common/AntSwitch.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### CompareVersion (`UI_DP_40`)

- 경로: `view/demandplan/report/compareversion/CompareVersion.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridCnt:1, InputField:2, PlanScope:1, …
- 호출: `/system/users/` · `engine/dp/GetReport`

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

#### ControlBoardMaster (`UI_DP_22`)

- 경로: `view/demandplan/setting/controlboardmaster/ControlBoardMaster.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### DemandOrder

- 경로: `view/demandplan/report/demandorder/DemandOrder.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### DemandPlanBoard (`UI_DP_DEMAND_PLAN_STATE`)

- 경로: `view/demandplan/dashboard/demandplanboard/DemandPlanBoard.jsx`
- 패턴: **P01 위젯 대시보드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: DashboardPanel=1
- 컴포넌트: ContentInner:1, DashboardPanel:1

```
┌──────────────────────────────┐
│ ┌──────┐┌──────┐┌──────┐    │
│ │ KPI 1││ KPI 2││ KPI 3│    │
│ └──────┘└──────┘└──────┘    │
│ ┌────────────┐┌────────────┐ │
│ │ Chart       ││ Grid       │ │
│ └────────────┘└────────────┘ │
└──────────────────────────────┘
```

#### DevMakeData

- 경로: `view/demandplan/developer/devmakedata/DevMakeData.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, InputField:3
- SP: `SP_UI_DP_MAKE_MONTHLY_SALES_SUM_P_RT_MSG`
- 호출: `engine/dp/SRV_GET_DP_MAKE_EX_MEASURE` · `engine/dp/SRV_GET_DP_MAKE_ACTUAL_SALES` · `engine/dp/SRV_DP_MAKE_DIMENSTION_DATA`

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

#### DimData (`UI_DP_16`)

- 경로: `view/demandplan/master/dimdata/DimData.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- SP: `SP_UI_DP_16_S1_J` · `SP_UI_DP_16_DIM_Q1` · `SP_UI_DP_16_D1`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_16_DIM_Q1` · `engine/dp/SRV_SET_SP_UI_DP_16_D1` · `dp/dimdata`

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

#### DimensionSet (`UI_DP_18`)

- 경로: `view/demandplan/setting/dimensionset/DimensionSet.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- SP: `SP_UI_DP_00_USER_GRP_Q1` · `SP_UI_DP_00_CONF_Q1` · `SP_UI_DP_00_CONF_Q1_01` · `SP_UI_DP_00_CONF_Q1_02` · `SP_UI_DP_00_CONF_Q1_03`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_18_DIMENS_COL_COMBO` · `engine/dp/SRV_GET_SP_UI_DP_18_Q1` · `engine/dp/SRV_SET_SP_UI_DP_18_D1`

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

#### DrawerMemo

- 경로: `view/demandplan/common/DrawerMemo.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### Entry (`UI_DP_95`)

- 경로: `view/demandplan/entry/entry/Entry.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### Entry (`UI_BP_95`)

- 경로: `view/demandplan/yearlyplan/entry/Entry.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### EntryChart (`UI_DP_95_CHART`)

- 경로: `view/demandplan/entry/entrychart/EntryChart.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### EntryChart (`UI_BP_95_CHART`)

- 경로: `view/demandplan/yearlyplan/entrychart/EntryChart.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### EntryExtra

- 경로: `view/demandplan/entry/entryextra/EntryExtra.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridCnt:1, GridExcelExportButton:1, GridExcelImportButton:1, …
- SP: `SP_UI_DP_00_CONF_Q1` · `SP_UI_DP_00_CONF_Q1_01` · `SP_UI_DP_00_CONF_Q1_02` · `SP_UI_DP_00_CONF_Q1_03` · `SP_UI_DP_00_CONF_Q1_04`
- 호출: `engine/dp/CancelApproval` · `engine/dp/Approve` · `engine/dp/GetDemand`

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

#### EntryLog

- 경로: `view/demandplan/version/entrylog/EntryLog.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridCnt:1, InputField:3, PlanScope:1, …
- 호출: `engine/dp/GetEntryLog`

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

#### EntryReportDrawer

- 경로: `view/demandplan/entry/entry/EntryReportDrawer.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### GridSelectionInfoBox

- 경로: `view/demandplan/common/GridSelectionInfoBox.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### IconComponent

- 경로: `view/demandplan/common/IconComponent.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### IconSelectInput

- 경로: `view/demandplan/common/IconSelectInput.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:1

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### IssueReciver

- 경로: `view/demandplan/entry/entry/IssueReciver.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:2
- 호출: `system/users/groups`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### Item (`UI_DP_09`)

- 경로: `view/demandplan/master/item/Item.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:3, WorkArea:1, BaseGrid:1, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- SP: `SP_UI_DP_00_ITEM_LV_DATA_Q1` · `SP_UI_DP_00_ITEM_LV_DATA_Q1_01` · `SP_UI_DP_00_ITEM_LV_DATA_Q1_02` · `SP_UI_DP_00_ITEM_LV_DATA_Q1_03` · `SP_UI_DP_00_ITEM_LV_DATA_Q1_04`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_09_Q1` · `engine/dp/SRV_SET_SP_UI_DP_09_D1`

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

#### ItemSearchInput

- 경로: `view/demandplan/common/ItemSearchInput.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:3

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### ItemSearchInputTree

- 경로: `view/demandplan/common/ItemSearchInputTree.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:1

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### Measure (`UI_DP_17`)

- 경로: `view/demandplan/setting/measure/Measure.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- SP: `SP_UI_DP_17_D1` · `SP_UI_DP_17_D1_P_RT_MSG` · `SP_UI_DP_17_S1` · `SP_UI_DP_17_S1_P_RT_MSG` · `SP_UI_DP_17_Q1_01`
- 호출: `engine/dp/SRV_SET_SP_UI_DP_17_D1` · `engine/dp/SRV_GET_SP_UI_DP_17_Q1` · `engine/dp/SRV_GET_SP_UI_DP_17_MEASURE_TP_COMBO`

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

#### MeasureData (`UI_DP_41`)

- 경로: `view/demandplan/master/measuredata/MeasureData.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- SP: `SP_UI_DP_41_S1_J` · `SP_UI_DP_41_D1` · `SP_UI_DP_41_D1_P_RT_MSG` · `SP_UI_DP_41_POP_Q1`
- 호출: `engine/dp/SRV_SET_SP_UI_DP_41_D1` · `dp/measuredata`

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

#### MeasureSet (`UI_DP_19`)

- 경로: `view/demandplan/setting/measureset/MeasureSet.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- SP: `SP_UI_DP_00_USER_GRP_Q1` · `SP_UI_DP_00_CONF_Q1` · `SP_UI_DP_00_CONF_Q1_01` · `SP_UI_DP_00_CONF_Q1_02` · `SP_UI_DP_00_CONF_Q1_03`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_19_MEASURE_TP_COMBO` · `engine/dp/SRV_GET_SP_UI_DP_19_Q1` · `engine/dp/SRV_SET_SP_UI_DP_19_D1`

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

#### MemoCard

- 경로: `view/demandplan/common/MemoCard.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### Pagination

- 경로: `view/demandplan/common/Pagination.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### PlanPolicy (`UI_DP_36`)

- 경로: `view/demandplan/setting/planpolicy/PlanPolicy.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### PlanScope

- 경로: `view/demandplan/common/PlanScope.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:1

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### ProcessStatus (`UI_DP_94`)

- 경로: `view/demandplan/version/processstatus/ProcessStatus.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### ProcessStatus (`UI_BP_94`)

- 경로: `view/demandplan/yearlyplan/processstatus/ProcessStatus.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### SalesBoard (`UI_DP_SALES_STATE`)

- 경로: `view/demandplan/dashboard/salesboard/SalesBoard.jsx`
- 패턴: **P01 위젯 대시보드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: DashboardPanel=1
- 컴포넌트: ContentInner:1, DashboardPanel:1
- SP: `SP_UI_SA_SALES_DP`
- 호출: `common/data`

```
┌──────────────────────────────┐
│ ┌──────┐┌──────┐┌──────┐    │
│ │ KPI 1││ KPI 2││ KPI 3│    │
│ └──────┘└──────┘└──────┘    │
│ ┌────────────┐┌────────────┐ │
│ │ Chart       ││ Grid       │ │
│ └────────────┘└────────────┘ │
└──────────────────────────────┘
```

#### TreeListSelectInput

- 경로: `view/demandplan/common/TreeListSelectInput.jsx`
- 패턴: **P04 트리 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TreeGrid=1
- 컴포넌트: TreeGrid:1, InputField:1

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│ ▼ Root                       │
│   ▼ Branch A                 │
│     • Leaf 1                 │
│     • Leaf 2                 │
│   ▶ Branch B                 │
└──────────────────────────────┘
```

#### TreeSelectInput

- 경로: `view/demandplan/common/TreeSelectInput.jsx`
- 패턴: **P04 트리 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TreeGrid=1
- 컴포넌트: TreeGrid:1, InputField:1

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│ ▼ Root                       │
│   ▼ Branch A                 │
│     • Leaf 1                 │
│     • Leaf 2                 │
│   ▶ Branch B                 │
└──────────────────────────────┘
```

#### UserInputField

- 경로: `view/demandplan/common/UserInputField.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:1

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### UserItemAccountMap (`UI_DP_15`)

- 경로: `view/demandplan/master/useritemaccountmap/UserItemAccountMap.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- SP: `SP_UI_DP_00_LV_CD_Q1` · `SP_UI_DP_00_EMP_AUTH_TP_Q1` · `SP_UI_DP_00_EMP_AUTH_TP_Q1_01` · `SP_UI_DP_00_EMP_AUTH_TP_Q1_02` · `SP_UI_DP_00_EMP_AUTH_TP_Q1_03`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_15_Q1` · `engine/dp/SRV_SET_SP_UI_DP_15_D1`

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

#### UserSearchInput

- 경로: `view/demandplan/common/UserSearchInput.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:1

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### Validation (`UI_DP_05`)

- 경로: `view/demandplan/master/validation/Validation.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: ContentInner:1, WorkArea:1, BaseGrid:1, PlanScope:1
- 호출: `engine/dp/GetValidation`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### ValidationAccordion

- 경로: `view/demandplan/master/validation/ValidationAccordion.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### ValueOptionSelector

- 경로: `view/demandplan/common/ValueOptionSelector.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:2
- SP: `SP_UI_DP_00_CM_CD_Q1` · `SP_UI_DP_00_CM_CD_Q1_01` · `SP_UI_DP_00_CM_CD_Q1_02`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

### 11 상하 2분할 (12개)

#### CompareSalesDp (`UI_DP_30`)

- 경로: `view/demandplan/report/comparesalesdp/CompareSalesDp.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, GridCnt:1, GridExcelExportButton:1, …
- 호출: `engine/dp/GetReport`

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

#### CompareVerProgress (`UI_DP_VER_COMP_PROG`)

- 경로: `view/demandplan/report/compareverprogress/CompareVerProgress.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, BaseGrid:1, ChartComponent:1, GridCnt:1, PlanScope:1, PopPersonalize:1
- 호출: `/system/users/` · `engine/dp/` · `engine/dp/GetReport`

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

#### Config (`UI_DP_01`)

- 경로: `view/demandplan/setting/config/Config.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridCnt:1, GridAddRowButton:2, GridDeleteRowButton:2, …
- SP: `SP_UI_DP_01_` · `SP_UI_DP_00_CM_CD_Q1` · `SP_UI_DP_00_CM_CD_Q1_01` · `SP_UI_DP_00_CM_CD_Q1_02`
- 호출: `engine/dp/SRV_SET_SP_UI_DP_01_` · `engine/dp/SRV_GET_`

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid 1                │ │
│ ├──────────────────────────┤ │
│ │ BaseGrid 2                │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### EntryNotify (`UI_DP_ENTRY_NOTIFY`)

- 경로: `view/demandplan/entry/entrynotify/EntryNotify.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, GridCnt:1, InputField:3, …
- SP: `SP_UI_DP_00_CONF_Q1` · `SP_UI_DP_00_CONF_Q1_01` · `SP_UI_DP_00_CONF_Q1_02` · `SP_UI_DP_00_CONF_Q1_03` · `SP_UI_DP_AUTH_DIS_OPT_COMBO_Q1`
- 호출: `engine/dp/GetDemand` · `engine/dp/SetDemand` · `engine/dp/`

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

#### ExchangeRate (`UI_DP_07`)

- 경로: `view/demandplan/master/exchangerate/ExchangeRate.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- SP: `SP_UI_DP_00_CM_CD_Q1` · `SP_UI_DP_00_CM_CD_Q1_01` · `SP_UI_DP_00_CM_CD_Q1_02` · `SP_UI_DP_00_CONF_Q1` · `SP_UI_DP_00_CONF_Q1_01`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_07_Q1` · `engine/dp/SRV_GET_SP_UI_DP_07_Q2` · `engine/dp/SRV_SET_SP_UI_DP_07_D1`

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid 1                │ │
│ ├──────────────────────────┤ │
│ │ BaseGrid 2                │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### Level (`UI_DP_02`)

- 경로: `view/demandplan/master/level/Level.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, BaseGrid:2, GridAddRowButton:2, GridDeleteRowButton:2, GridSaveButton:2, PlanScope:1
- SP: `SP_UI_DP_00_CONF_Q1` · `SP_UI_DP_00_CONF_Q1_01` · `SP_UI_DP_00_CONF_Q1_02` · `SP_UI_DP_00_CONF_Q1_03` · `SP_UI_DP_00_CONF_Q1_04`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_02_NQ1` · `engine/dp/SRV_SET_SP_UI_DP_02_ND1`

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid 1                │ │
│ ├──────────────────────────┤ │
│ │ BaseGrid 2                │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### PlanCheckSales (`UI_DP_32`)

- 경로: `view/demandplan/report/planchecksales/PlanCheckSales.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridCnt:1, InputField:1, PlanScope:1, …
- SP: `SP_UI_DP_32_Q1` · `SP_UI_DP_32_Q2`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_32_Q1` · `engine/dp/SRV_GET_SP_UI_DP_32_Q2`

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid 1                │ │
│ ├──────────────────────────┤ │
│ │ BaseGrid 2                │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### RtfAnalysis (`UI_DP_31`)

- 경로: `view/demandplan/report/rtfanalysis/RtfAnalysis.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=2 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:2, GridCnt:1, GridExcelExportButton:1, …
- 호출: `engine/dp/GetReport`

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

#### SalesAuthMap (`UI_DP_12`)

- 경로: `view/demandplan/master/salesauthmap/SalesAuthMap.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- SP: `SP_UI_DP_00_LV_CD_Q1` · `SP_UI_DP_12_Q1_01` · `SP_UI_DP_12_Q1_02` · `SP_UI_DP_12_Q1_03` · `SP_UI_DP_12_Q1`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_12_Q1` · `engine/dp/SRV_GET_SP_UI_DP_12_Q2` · `engine/dp/SRV_SET_SP_UI_DP_12_D2`

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid 1                │ │
│ ├──────────────────────────┤ │
│ │ BaseGrid 2                │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### SalesPerformance (`UI_DP_28`)

- 경로: `view/demandplan/report/salesperformance/SalesPerformance.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=4 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:4, GridCnt:1, GridExcelExportButton:1, …
- SP: `SP_UI_DP_28_CHART_Q`
- 호출: `engine/dp/GetReport` · `engine/dp/SRV_GET_SP_UI_DP_28_CHART_Q`

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

#### SalesPrice (`UI_DP_21`)

- 경로: `view/demandplan/master/salesprice/SalesPrice.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- SP: `SP_UI_DP_00_CONF_Q1` · `SP_UI_DP_00_CONF_Q1_01` · `SP_UI_DP_00_CONF_Q1_02` · `SP_UI_DP_00_CONF_Q1_03` · `SP_UI_DP_21_Q1`
- 호출: `engine/dp/` · `engine/dp/SRV_SET_SP_UI_DP_21_D1`

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid 1                │ │
│ ├──────────────────────────┤ │
│ │ BaseGrid 2                │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### UserSalesMap

- 경로: `view/demandplan/master/usersalesmap/UserSalesMap.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridAddRowButton:2, GridDeleteRowButton:2, GridSaveButton:2, …
- SP: `SP_UI_DP_00_EMP_AUTH_TP_Q1` · `SP_UI_DP_00_EMP_AUTH_TP_Q1_01` · `SP_UI_DP_00_EMP_AUTH_TP_Q1_02` · `SP_UI_DP_USER_LEVEL_MAP_Q1` · `SP_UI_DP_USER_LEVEL_MAP_S1`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_USER_LEVEL_MAP_Q1` · `engine/dp/SRV_GET_SP_UI_DP_USER_LEVEL_MAP_D1` · `engine/dp/SRV_GET_SP_UI_DP_USER_LEVEL_MAP_Q2`

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid 1                │ │
│ ├──────────────────────────┤ │
│ │ BaseGrid 2                │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### 12 상하 3분할 (1개)

#### UserLevelMap (`UI_DP_USER_LEVEL_MAP`)

- 경로: `view/demandplan/master/userlevelmap/UserLevelMap.jsx`
- 패턴: **v3 멀티 그리드 3-stack** (LAYOUT_V3) · confidence: **mid**
- 추정 근거: 3 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:3, GridAddRowButton:3, GridDeleteRowButton:3, GridSaveButton:3, …
- SP: `SP_UI_DP_00_EMP_AUTH_TP_Q1` · `SP_UI_DP_00_EMP_AUTH_TP_Q1_01` · `SP_UI_DP_00_EMP_AUTH_TP_Q1_02` · `SP_UI_DP_00_EMP_AUTH_TP_Q1_03` · `SP_UI_DP_USER_LEVEL_MAP_Q1`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_USER_LEVEL_MAP_Q1` · `engine/dp/SRV_GET_SP_UI_DP_USER_LEVEL_MAP_D1` · `engine/dp/SRV_GET_SP_UI_DP_USER_LEVEL_MAP_Q2`

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│ ┌── Grid 1 ───────────────┐  │
│ ├── Grid 2 ───────────────┤  │
│ ├── Grid 3 ───────────────┤  │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### 31 혼합·격자·특수 (1개)

#### PlanCheckItem (`UI_DP_33`)

- 경로: `view/demandplan/report/plancheckitem/PlanCheckItem.jsx`
- 패턴: **혼합 분할** (LAYOUT_MIXED) · confidence: **mid**
- 추정 근거: splits=1 dirs=[unknown] tabs=0
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, SplitPanel:1, VLayoutBox:2, GridCnt:1, …
- SP: `SP_UI_DP_33_Q1` · `SP_UI_DP_33_Q2`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_33_Q1` · `engine/dp/SRV_GET_SP_UI_DP_33_Q2`

```
┌──────────────────────────────┐
│ Search                       │
├──────────┬───────────────────┤
│ Tree     │ Top: Chart        │
│          ├───────────────────┤
│          │ Bottom: Grid      │
└──────────┴───────────────────┘
```

### 91 ControlBoard (2개)

#### ControlBoard (`UI_DP_93`)

- 경로: `view/demandplan/version/controlboard/ControlBoard.jsx`
- 패턴: **CB 마스터 컨트롤보드** (LAYOUT_CONTROLBOARD) · confidence: **mid**
- 추정 근거: controlboard match · chart=0 gantt=0

```
┌──────────────────────────────┐
│ Version status · Step bar    │
├──────┬───────────┬───────────┤
│ KPI  │ Chart     │ Log/Alert │
├──────┴───────────┴───────────┤
│ Engine execution grid        │
└──────────────────────────────┘
```

#### ControlBoard (`UI_BP_93`)

- 경로: `view/demandplan/yearlyplan/controlboard/ControlBoard.jsx`
- 패턴: **CB 마스터 컨트롤보드** (LAYOUT_CONTROLBOARD) · confidence: **mid**
- 추정 근거: controlboard match · chart=0 gantt=0

```
┌──────────────────────────────┐
│ Version status · Step bar    │
├──────┬───────────┬───────────┤
│ KPI  │ Chart     │ Log/Alert │
├──────┴───────────┴───────────┤
│ Engine execution grid        │
└──────────────────────────────┘
```

### 95 RouteLayout (2개)

#### ItemHierarchy (`UI_DP_08`)

- 경로: `view/demandplan/master/itemhierarchy/ItemHierarchy.jsx`
- 패턴: **RL 라우트 레이아웃 (FLO)** (LAYOUT_ROUTELAYOUT) · confidence: **high**
- 추정 근거: route keyword · flo=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, TreeGrid:1, TabContainer:1, FLODiagram:1, GridCnt:1, …
- SP: `SP_UI_DP_00_CONF_Q1` · `SP_UI_DP_00_CONF_Q1_01` · `SP_UI_DP_00_CONF_Q1_02` · `SP_UI_DP_00_CONF_Q1_03` · `SP_UI_DP_00_CONF_Q1_04`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_08_Q1` · `engine/dp/SRV_SET_SP_UI_DP_08_D1`

```
┌──────────────────────────────┐
│ Route Layout (FLODiagram)    │
├──────────────────────────────┤
│ [A]──▶[B]──▶[C]              │
│         │     ▼              │
│         └──▶[D]──▶[E]        │
└──────────────────────────────┘
```

#### SalesHierarchy (`UI_DP_10`)

- 경로: `view/demandplan/master/saleshierarchy/SalesHierarchy.jsx`
- 패턴: **RL 라우트 레이아웃 (FLO)** (LAYOUT_ROUTELAYOUT) · confidence: **high**
- 추정 근거: route keyword · flo=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, TreeGrid:1, TabContainer:1, FLODiagram:1, GridCnt:1, …
- SP: `SP_UI_DP_00_CONF_Q1` · `SP_UI_DP_00_CONF_Q1_01` · `SP_UI_DP_00_CONF_Q1_02` · `SP_UI_DP_00_CONF_Q1_03` · `SP_UI_DP_00_CONF_Q1_04`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_10_Q1` · `engine/dp/SRV_SET_SP_UI_DP_10_D1`

```
┌──────────────────────────────┐
│ Route Layout (FLODiagram)    │
├──────────────────────────────┤
│ [A]──▶[B]──▶[C]              │
│         │     ▼              │
│         └──▶[D]──▶[E]        │
└──────────────────────────────┘
```

### — 팝업 (15개)

#### PopAccountLv

- 경로: `view/demandplan/common/PopAccountLv.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, BaseGrid:1, InputField:3, PopupDialog:1
- SP: `SP_UI_DP_ACCOUNT_LV_CD_Q1` · `SP_UI_DP_00_POPUP_ACCOUNT_Q2`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_ACCOUNT_LV_CD_Q1` · `engine/dp/SRV_GET_SP_UI_DP_00_POPUP_ACCOUNT_Q2`

```
╔══════════════════════════════╗
║  Popup Dialog (modal)        ║
╠══════════════════════════════╣
║ Search: code / name          ║
║ ┌──────────────────────────┐ ║
║ │ Selectable BaseGrid       │ ║
║ └──────────────────────────┘ ║
║  [ Confirm ] [ Cancel ]       ║
╚══════════════════════════════╝
```

#### PopAccountTree

- 경로: `view/demandplan/common/PopAccountTree.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:2, WorkArea:2, BaseGrid:1, InputField:4, PopupDialog:1
- SP: `SP_UI_DP_00_CONF_Q1_01` · `SP_UI_DP_00_CONF_Q1_02` · `SP_UI_DP_00_CONF_Q1_03` · `SP_UI_DP_00_CONF_Q1_04` · `SP_UI_DP_00_CONF_Q1`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_00_CONF_Q1` · `engine/dp/SRV_UI_DP_00_POPUP_ACC_TREE_Q2` · `engine/dp/SRV_UI_DP_00_POPUP_ACC_TREE_Q1`

```
╔══════════════════════════════╗
║  Popup Dialog (modal)        ║
╠══════════════════════════════╣
║ Search: code / name          ║
║ ┌──────────────────────────┐ ║
║ │ Selectable BaseGrid       │ ║
║ └──────────────────────────┘ ║
║  [ Confirm ] [ Cancel ]       ║
╚══════════════════════════════╝
```

#### PopComment

- 경로: `view/demandplan/entry/entry/PopComment.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:1, PopupDialog:1

```
╔══════════════════════════════╗
║  Popup Dialog (modal)        ║
╠══════════════════════════════╣
║ Search: code / name          ║
║ ┌──────────────────────────┐ ║
║ │ Selectable BaseGrid       │ ║
║ └──────────────────────────┘ ║
║  [ Confirm ] [ Cancel ]       ║
╚══════════════════════════════╝
```

#### PopExtraParam

- 경로: `view/demandplan/entry/entry/PopExtraParam.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:8, PopupDialog:1

```
╔══════════════════════════════╗
║  Popup Dialog (modal)        ║
╠══════════════════════════════╣
║ Search: code / name          ║
║ ┌──────────────────────────┐ ║
║ │ Selectable BaseGrid       │ ║
║ └──────────────────────────┘ ║
║  [ Confirm ] [ Cancel ]       ║
╚══════════════════════════════╝
```

#### PopItemLv

- 경로: `view/demandplan/common/PopItemLv.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, BaseGrid:1, InputField:3, PopupDialog:1
- SP: `SP_UI_DP_ITEM_LV_CD_Q1` · `SP_UI_DP_00_POPUP_ITEM_Q3`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_ITEM_LV_CD_Q1` · `engine/dp/SRV_GET_SP_UI_DP_00_POPUP_ITEM_Q3`

```
╔══════════════════════════════╗
║  Popup Dialog (modal)        ║
╠══════════════════════════════╣
║ Search: code / name          ║
║ ┌──────────────────────────┐ ║
║ │ Selectable BaseGrid       │ ║
║ └──────────────────────────┘ ║
║  [ Confirm ] [ Cancel ]       ║
╚══════════════════════════════╝
```

#### PopItemTree

- 경로: `view/demandplan/common/PopItemTree.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:2, WorkArea:2, BaseGrid:1, InputField:4, PopupDialog:1
- SP: `SP_UI_DP_00_CONF_Q1_01` · `SP_UI_DP_00_CONF_Q1_02` · `SP_UI_DP_00_CONF_Q1_03` · `SP_UI_DP_00_CONF_Q1_04` · `SP_UI_DP_00_CONF_Q1`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_00_CONF_Q1` · `engine/dp/SRV_UI_DP_00_POPUP_ITEM_TREE_Q2` · `engine/dp/SRV_GET_SP_UI_DP_00_ITEM_TREE_LV_DATA_Q1`

```
╔══════════════════════════════╗
║  Popup Dialog (modal)        ║
╠══════════════════════════════╣
║ Search: code / name          ║
║ ┌──────────────────────────┐ ║
║ │ Selectable BaseGrid       │ ║
║ └──────────────────────────┘ ║
║  [ Confirm ] [ Cancel ]       ║
╚══════════════════════════════╝
```

#### PopItemTreeList

- 경로: `view/demandplan/common/PopItemTreeList.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, BaseGrid:1, InputField:4, PopupDialog:1
- SP: `SP_UI_DP_00_CONF_Q1_01` · `SP_UI_DP_00_CONF_Q1_02` · `SP_UI_DP_00_CONF_Q1_03` · `SP_UI_DP_00_CONF_Q1` · `SP_UI_DP_00_ITEM_TREE_LV_DATA_Q1`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_00_CONF_Q1` · `engine/dp/SRV_UI_DP_00_POPUP_ITEM_TREE_Q2` · `engine/dp/SRV_GET_SP_UI_DP_00_ITEM_TREE_LV_DATA_Q1`

```
╔══════════════════════════════╗
║  Popup Dialog (modal)        ║
╠══════════════════════════════╣
║ Search: code / name          ║
║ ┌──────────────────────────┐ ║
║ │ Selectable BaseGrid       │ ║
║ └──────────────────────────┘ ║
║  [ Confirm ] [ Cancel ]       ║
╚══════════════════════════════╝
```

#### PopMapUserTransfer

- 경로: `view/demandplan/master/useritemaccountmap/PopMapUserTransfer.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:6
- SP: `SP_UI_DP_00_EMP_AUTH_TP_Q1` · `SP_UI_DP_00_EMP_AUTH_TP_Q1_01` · `SP_UI_DP_00_EMP_AUTH_TP_Q1_02` · `SP_UI_DP_00_EMP_AUTH_TP_Q1_03` · `SP_UI_DP_15_S3`
- 호출: `engine/dp/SRV_SET_SP_UI_DP_15_S3`

```
╔══════════════════════════════╗
║  Popup Dialog (modal)        ║
╠══════════════════════════════╣
║ Search: code / name          ║
║ ┌──────────────────────────┐ ║
║ │ Selectable BaseGrid       │ ║
║ └──────────────────────────┘ ║
║  [ Confirm ] [ Cancel ]       ║
╚══════════════════════════════╝
```

#### PopMeasure

- 경로: `view/demandplan/master/measuredata/PopMeasure.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, GridAddRowButton:1, GridSaveButton:1, InputField:2, PopupDialog:1
- SP: `SP_UI_DP_41_POP_Q1` · `SP_UI_DP_41_POP_D1` · `SP_UI_DP_41_POP_D1_P_RT_MSG` · `SP_UI_DP_41_POP_S1` · `SP_UI_DP_41_POP_S1_P_RT_MSG`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_41_POP_Q1` · `engine/dp/SRV_SET_SP_UI_DP_41_POP_D1` · `engine/dp/SRV_SET_SP_UI_DP_41_POP_S2`

```
╔══════════════════════════════╗
║  Popup Dialog (modal)        ║
╠══════════════════════════════╣
║ Search: code / name          ║
║ ┌──────────────────────────┐ ║
║ │ Selectable BaseGrid       │ ║
║ └──────────────────────────┘ ║
║  [ Confirm ] [ Cancel ]       ║
╚══════════════════════════════╝
```

#### PopMeasureCopy

- 경로: `view/demandplan/entry/entry/PopMeasureCopy.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:6, PopupDialog:1

```
╔══════════════════════════════╗
║  Popup Dialog (modal)        ║
╠══════════════════════════════╣
║ Search: code / name          ║
║ ┌──────────────────────────┐ ║
║ │ Selectable BaseGrid       │ ║
║ └──────────────────────────┘ ║
║  [ Confirm ] [ Cancel ]       ║
╚══════════════════════════════╝
```

#### PopMeasureFormula

- 경로: `view/demandplan/entry/entry/PopMeasureFormula.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:5, PopupDialog:1

```
╔══════════════════════════════╗
║  Popup Dialog (modal)        ║
╠══════════════════════════════╣
║ Search: code / name          ║
║ ┌──────────────────────────┐ ║
║ │ Selectable BaseGrid       │ ║
║ └──────────────────────────┘ ║
║  [ Confirm ] [ Cancel ]       ║
╚══════════════════════════════╝
```

#### PopMultiMap

- 경로: `view/demandplan/master/useritemaccountmap/PopMultiMap.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=2
- 컴포넌트: SearchArea:1, BaseGrid:2, InputField:6, PopSelectAccount:1, PopupDialog:1
- SP: `SP_UI_DP_00_USER_ITEM_LV_Q1` · `SP_UI_DP_00_POPUP_ITEM_Q1` · `SP_UI_DP_15_S1` · `SP_UI_DP_15_S1_P_RT_MSG`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_00_POPUP_ITEM_Q1` · `engine/dp/SRV_SET_SP_UI_DP_15_S1`

```
╔══════════════════════════════╗
║  Popup Dialog (modal)        ║
╠══════════════════════════════╣
║ Search: code / name          ║
║ ┌──────────────────────────┐ ║
║ │ Selectable BaseGrid       │ ║
║ └──────────────────────────┘ ║
║  [ Confirm ] [ Cancel ]       ║
╚══════════════════════════════╝
```

#### PopNewItemAccountMap

- 경로: `view/demandplan/master/useritemaccountmap/PopNewItemAccountMap.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=3
- 컴포넌트: SearchArea:1, BaseGrid:3, InputField:7, PopupDialog:1
- SP: `SP_UI_DP_00_EMP_AUTH_TP_Q1` · `SP_UI_DP_00_EMP_AUTH_TP_Q1_01` · `SP_UI_DP_00_EMP_AUTH_TP_Q1_02` · `SP_UI_DP_00_EMP_AUTH_TP_Q1_03` · `SP_UI_DP_00_USER_ITEM_LV_Q1`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_00_POPUP_ITEM_Q1` · `engine/dp/SRV_GET_SP_UI_DP_00_POPUP_ACCOUNT_Q1`

```
╔══════════════════════════════╗
║  Popup Dialog (modal)        ║
╠══════════════════════════════╣
║ Search: code / name          ║
║ ┌──────────────────────────┐ ║
║ │ Selectable BaseGrid       │ ║
║ └──────────────────────────┘ ║
║  [ Confirm ] [ Cancel ]       ║
╚══════════════════════════════╝
```

#### PopNewMap

- 경로: `view/demandplan/master/useritemaccountmap/PopNewMap.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=2
- 컴포넌트: SearchArea:1, BaseGrid:2, GridDeleteRowButton:1, InputField:4, PopupDialog:1
- SP: `SP_UI_DP_00_EMP_AUTH_TP_Q1` · `SP_UI_DP_00_EMP_AUTH_TP_Q1_01` · `SP_UI_DP_00_EMP_AUTH_TP_Q1_02` · `SP_UI_DP_00_EMP_AUTH_TP_Q1_03` · `SP_UI_DP_00_USER_ITEM_LV_Q1`
- 호출: `engine/dp/SRV_GET_UI_DP_15_POP_NEW_Q1` · `engine/dp/SRV_SET_SP_UI_DP_15_POP_Q1`

```
╔══════════════════════════════╗
║  Popup Dialog (modal)        ║
╠══════════════════════════════╣
║ Search: code / name          ║
║ ┌──────────────────────────┐ ║
║ │ Selectable BaseGrid       │ ║
║ └──────────────────────────┘ ║
║  [ Confirm ] [ Cancel ]       ║
╚══════════════════════════════╝
```

#### PopSelectUser

- 경로: `view/demandplan/common/PopSelectUser.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, WorkArea:1, BaseGrid:1, InputField:2, PopupDialog:1
- SP: `SP_UI_DP_00_POPUP_USER_Q1`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_00_POPUP_USER_Q1`

```
╔══════════════════════════════╗
║  Popup Dialog (modal)        ║
╠══════════════════════════════╣
║ Search: code / name          ║
║ ┌──────────────────────────┐ ║
║ │ Selectable BaseGrid       │ ║
║ └──────────────────────────┘ ║
║  [ Confirm ] [ Cancel ]       ║
╚══════════════════════════════╝
```

### — 위젯 (16개)

#### Accuracy

- 경로: `view/demandplan/widgets/accuracy/Accuracy.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- SP: `SP_UI_SA_SALES_DP`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### DpPlanStatusY

- 경로: `view/demandplan/widgets/dpplanstatusy/DpPlanStatusY.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DpTopSalesAccount

- 경로: `view/demandplan/widgets/dptopsalesaccount/DpTopSalesAccount.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- 컴포넌트: WorkArea:1
- SP: `SP_UI_SA_SALES_DP`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### DpTopSalesItem

- 경로: `view/demandplan/widgets/dptopsalesitem/DpTopSalesItem.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- SP: `SP_UI_SA_SALES_DP`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### DpTopSalesItemgrp

- 경로: `view/demandplan/widgets/dptopsalesitemgrp/DpTopSalesItemgrp.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SALES_DP`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DpTopSalesMap

- 경로: `view/demandplan/widgets/dptopsalesaccount/DpTopSalesMap.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### DpYearActualSales

- 경로: `view/demandplan/widgets/dpyearactualsales/DpYearActualSales.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SALES_DP`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DpYearTargetSales

- 경로: `view/demandplan/widgets/dpyeartargetsales/DpYearTargetSales.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SALES_DP`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### ForecastPlan

- 경로: `view/demandplan/widgets/forecastplan/ForecastPlan.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SALES_DP`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### PlanProgress

- 경로: `view/demandplan/widgets/planprogress/PlanProgress.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- 호출: `engine/dp/GetApprovalSteps`

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### PlanStatus

- 경로: `view/demandplan/widgets/planstatus/PlanStatus.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SALES_DP`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SalesAlerts

- 경로: `view/demandplan/widgets/salesalerts/SalesAlerts.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- SP: `SP_UI_SA_SALES_DP`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### SalesPlanDistribution

- 경로: `view/demandplan/widgets/salesplandistribution/SalesPlanDistribution.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=2 grid=0
- 컴포넌트: ChartComponent:2
- SP: `SP_UI_SA_SALES_DP`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SalesProgress

- 경로: `view/demandplan/widgets/salesprogress/SalesProgress.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SALES_DP`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SupplySufRate

- 경로: `view/demandplan/widgets/supplysufrate/SupplySufRate.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_MP_DASHBOARD`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### TeamSalesPlan

- 경로: `view/demandplan/widgets/teamsalesplan/TeamSalesPlan.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SALES_DP`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

### — Base 래퍼 (6개)

#### BaseAllReport

- 경로: `view/demandplan/entry/allreport/BaseAllReport.jsx`
- 패턴: **Base 래퍼** (BASE) · confidence: **high**
- 추정 근거: Base*.jsx wrapper
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, GridCnt:1, GridExcelExportButton:1, …
- SP: `SP_UI_DP_00_CONF_Q1` · `SP_UI_DP_00_CONF_Q1_01` · `SP_UI_DP_00_CONF_Q1_02` · `SP_UI_DP_00_CONF_Q1_03` · `SP_UI_DP_00_CONF_Q1_04`
- 호출: `engine/dp/GetDemand`

```
┌─────────────┐
│ Base*.jsx   │
│ (wrapper)   │
└─────────────┘
```

#### BaseControlBoard

- 경로: `view/demandplan/version/controlboard/BaseControlBoard.jsx`
- 패턴: **Base 래퍼** (BASE) · confidence: **high**
- 추정 근거: Base*.jsx wrapper
- 컴포넌트: ContentInner:1, WorkArea:1, InputField:7, PlanScope:1
- SP: `SP_UI_DP_CONTROLBOARD_GEN_P_RT_MSG` · `SP_UI_DP_CONF_COMBO` · `SP_UI_DP_PERSON_AUTH_LV_COMBO` · `SP_UI_DP_VER_CLOSE_P_RT_MSG` · `SP_UI_DP_VER_CLOSE_Y_P_RT_MSG`
- 호출: `engine/dp/` · `engine/dp/GetApprovalSteps` · `engine/dp/SRV_GET_SP_UI_DP_CONTROLBOARD_MAIL_INFO`

```
┌─────────────┐
│ Base*.jsx   │
│ (wrapper)   │
└─────────────┘
```

#### BaseControlBoardMaster

- 경로: `view/demandplan/setting/controlboardmaster/BaseControlBoardMaster.jsx`
- 패턴: **Base 래퍼** (BASE) · confidence: **high**
- 추정 근거: Base*.jsx wrapper
- 컴포넌트: ContentInner:1, WorkArea:1, BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, InputField:4, PlanScope:1
- SP: `SP_UI_DP_00_CONF_Q1` · `SP_UI_DP_00_CONF_Q1_01` · `SP_UI_DP_00_CONF_Q1_02` · `SP_UI_DP_00_CONF_Q1_03` · `SP_UI_DP_CONF_COMBO`
- 호출: `engine/dp/` · `engine/dp/SRV_GET_SP_UI_DP_CONBD_MASTER_MAIL_INFO` · `engine/dp/SRV_GET_SP_UI_DP_00_LV_CD_Q1`

```
┌─────────────┐
│ Base*.jsx   │
│ (wrapper)   │
└─────────────┘
```

#### BaseEntry

- 경로: `view/demandplan/entry/entry/BaseEntry.jsx`
- 패턴: **Base 래퍼** (BASE) · confidence: **high**
- 추정 근거: Base*.jsx wrapper
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, ChartComponent:1, GridCnt:1, GridExcelExportButton:2, …
- SP: `SP_UI_DP_00_CONF_Q1` · `SP_UI_DP_00_CONF_Q1_01` · `SP_UI_DP_00_CONF_Q1_02` · `SP_UI_DP_00_CONF_Q1_03` · `SP_UI_DP_00_CONF_Q1_04`
- 호출: `engine/dp/CancelApproval` · `engine/dp/Approve` · `engine/dp/GetDemand`

```
┌─────────────┐
│ Base*.jsx   │
│ (wrapper)   │
└─────────────┘
```

#### BasePlanPolicy

- 경로: `view/demandplan/setting/planpolicy/BasePlanPolicy.jsx`
- 패턴: **Base 래퍼** (BASE) · confidence: **high**
- 추정 근거: Base*.jsx wrapper
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridCnt:1, InputField:1, PlanScope:1
- SP: `SP_UI_DP_00_CONF_Q1` · `SP_UI_DP_00_CONF_Q1_01` · `SP_UI_DP_00_CONF_Q1_02` · `SP_UI_DP_00_CONF_Q1_03` · `SP_UI_DP_00_CONF_Q1_04`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_36_Q1` · `engine/dp/SRV_SET_SP_UI_DP_36_S1`

```
┌─────────────┐
│ Base*.jsx   │
│ (wrapper)   │
└─────────────┘
```

#### BaseProcessStatus

- 경로: `view/demandplan/version/processstatus/BaseProcessStatus.jsx`
- 패턴: **Base 래퍼** (BASE) · confidence: **high**
- 추정 근거: Base*.jsx wrapper
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, TreeGrid:1, GridCnt:1, InputField:3, PlanScope:1
- SP: `SP_UI_DP_00_EMP_AUTH_TP_Q1` · `SP_UI_DP_00_EMP_AUTH_TP_Q1_01` · `SP_UI_DP_00_EMP_AUTH_TP_Q1_02` · `SP_UI_DP_00_EMP_AUTH_TP_Q1_03` · `SP_UI_DP_00_CONF_Q1`
- 호출: `engine/dp/GetStatus` · `engine/dp/GetApprovalSteps`

```
┌─────────────┐
│ Base*.jsx   │
│ (wrapper)   │
└─────────────┘
```

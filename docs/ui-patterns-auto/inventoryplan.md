# inventoryplan 모듈 — UI 패턴 카탈로그

> Phase 1 자동 분류 결과 (생성: `ui-patterns-gen.cjs`). 정정·보강 환영.

## 요약

| 항목 | 값 |
|---|---:|
| 총 화면 | 55 |
| 등록 메뉴 (UI_*) | 18 |
| 위젯 | 24 |
| 팝업 | 6 |
| Base 래퍼 | 0 |
| Sub-component | 0 |

### 레이아웃 카테고리 분포

| 카테고리 | 화면 수 |
|---|---:|
| 01 미분할 (단일) | 21 |
| 11 상하 2분할 | 4 |
| — 팝업 | 6 |
| — 위젯 | 24 |

### 패턴 분포 (상위 10)

| 패턴 | 화면 수 |
|---|---:|
| 위젯 (차트) (`widget_chart`) | 14 |
| P02 검색 + 그리드 (마스터 CRUD) (`search_grid`) | 11 |
| P01 위젯 대시보드 (`widget_dashboard`) | 6 |
| 팝업 다이얼로그 (`popup`) | 6 |
| 위젯 (그리드) (`widget_grid`) | 5 |
| 위젯 (자유) (`widget_misc`) | 5 |
| v2 차트 + 그리드 (수직 스택) (`grid_chart_stacked`) | 3 |
| 비표준 / 자유 폼 (`free_form`) | 2 |
| P03 검색 + 탭 그리드 (`search_tab`) | 2 |
| v2 듀얼 그리드 2-stack (`v2_dual_grid`) | 1 |

---
## 화면별 상세

### 01 미분할 (단일) (21개)

#### AbcxyzAnalysisResult (`UI_IM_ABCXYZ_ANALYSIS`)

- 경로: `view/inventoryplan/analysis/abcxyzanalysisresult/AbcxyzAnalysisResult.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridSaveButton:1, GridExcelExportButton:1, InputField:5, …
- SP: `SP_UI_IM_ABCXYZ_ANLYS_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_CODE` · `engine/mp/SRV_UI_IM_ABCXYZ_ANLYS_Q1` · `engine/mp/SRV_UI_IM_CLASS_ANLYS_Q4`

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

#### DemandRateBase

- 경로: `view/inventoryplan/master/demandratebase/DemandRateBase.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridSaveButton:1, GridExcelExportButton:1, PlanScope:1
- SP: `SP_UI_IM_DEMAND_RATE_CAL_BASE_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_IM_DEMAND_RATE_CAL_BASE_Q1` · `engine/mp/SRV_UI_IM_DEMAND_RATE_CAL_BASE_S1`

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

#### GeneralConfig (`UI_IM_02`)

- 경로: `view/inventoryplan/master/generalconfig/GeneralConfig.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### GradeTarget (`UI_IM_03`)

- 경로: `view/inventoryplan/master/gradetarget/GradeTarget.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, TabContainer:1, GridSaveButton:2, GridExcelExportButton:2, …
- SP: `SP_UI_IM_03_S1_P_RT_MSG` · `SP_UI_IM_03_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_IM_03_Q1` · `engine/mp/SRV_UI_IM_03_Q2` · `engine/mp/SRV_UI_IM_03_S1`

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

#### ImSimulationComparison

- 경로: `view/inventoryplan/planningsimulation/imsimulationcomparison/ImSimulationComparison.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, InputField:1, PlanScope:1, PopKpiWeightConfig:1
- SP: `SP_UI_IM_SIMUL_CONFIRM_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_IM_TARGET_INV_VER_Q1` · `engine/mp/SRV_UI_IM_SIMUL_COMPARE` · `engine/mp/SRV_UI_IM_SIMUL_CONFIRM`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### InTransitStock (`UI_IM_13`)

- 경로: `view/inventoryplan/master/intransitstock/InTransitStock.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridSaveButton:1, GridExcelExportButton:1, GridExcelImportButton:1, …
- SP: `SP_UI_IM_13_S1_J` · `SP_UI_IM_13_S1_J_P_RT_MSG` · `SP_UI_IM_13_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_GET_CUTOFF_DATE_LIST` · `engine/mp/SRV_UI_IM_13_Q1`

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

#### InventoryBoard (`UI_IM_INVENTORY_STATE`)

- 경로: `view/inventoryplan/analysis/inventoryboard/InventoryBoard.jsx`
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

#### InventoryDetail (`UI_IM_INVENTORY_DETAIL`)

- 경로: `view/inventoryplan/analysis/inventorydetail/InventoryDetail.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridExcelExportButton:1, InputField:2, PlanScope:1
- 호출: `engine/mp/SRV_UI_IM_STOCK_RANGE` · `engine/mp/SRV_UI_IM_TARGET_INV_VER_Q1` · `engine/mp/SRV_UI_IM_INVENTORY_DETAIL`

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

#### InventoryLocationBoard (`UI_IM_LOCATION_INVENTORY_STATE`)

- 경로: `view/inventoryplan/analysis/inventorylocationboard/InventoryLocationBoard.jsx`
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

#### LossInventory

- 경로: `view/inventoryplan/analysis/lossinventory/LossInventory.jsx`
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

#### Obsolete (`UI_IM_OBSOLETE_STATE`)

- 경로: `view/inventoryplan/analysis/obsolete/Obsolete.jsx`
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

#### ReturnInventory

- 경로: `view/inventoryplan/analysis/returninventory/ReturnInventory.jsx`
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

#### SalesShippingHistoryCheck (`UI_IM_SALES_SHIPPING_HISTORY_CHECK`)

- 경로: `view/inventoryplan/analysis/salesshippinghistorycheck/SalesShippingHistoryCheck.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridExcelExportButton:1, InputField:2, PlanScope:1
- 호출: `engine/mp/`

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

#### ShippingActual (`UI_IM_SHIPPING_ACTUAL`)

- 경로: `view/inventoryplan/master/shippingactual/ShippingActual.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridExcelExportButton:1, InputField:1, PlanScope:1
- 호출: `engine/mp/SRV_UI_IM_SHIPPING_ACTUAL`

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

#### SlowMoving (`UI_IM_SLOWMOVING_STATE`)

- 경로: `view/inventoryplan/analysis/slowmoving/SlowMoving.jsx`
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

#### StockCost (`UI_IM_05`)

- 경로: `view/inventoryplan/master/stockcost/StockCost.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridSaveButton:1, GridExcelExportButton:1, PlanScope:1
- SP: `SP_UI_IM_05_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_IM_05_Q1` · `engine/mp/SRV_UI_IM_05_S1`

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

#### StorageLocation

- 경로: `view/inventoryplan/master/storagelocation/StorageLocation.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, …
- SP: `SP_UI_IM_11_S1_P_RT_MSG` · `SP_UI_IM_11_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_IM_11_Q1` · `engine/mp/SRV_UI_IM_11_S1` · `engine/mp/SRV_UI_IM_11_S2`

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

#### TargetInventoryResult (`UI_IM_TARGET_INVENTORY_RESULT`)

- 경로: `view/inventoryplan/planningsimulation/targetinventoryresult/TargetInventoryResult.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridSaveButton:1, GridExcelExportButton:1, InputField:1, …
- SP: `SP_UI_IM_TARGET_INV_RESULT_SAVE` · `SP_UI_IM_TARGET_INV_RESULT_SAVE_P_RT_MSG` · `SP_UI_IM_SIMUL_CONFIRM_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_IM_TARGET_INV_VER_Q1` · `engine/mp/SRV_UI_IM_TARGET_INV_RESULT_Q1` · `common/json-save`

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

#### TargetInventoryResultPeriod

- 경로: `view/inventoryplan/planningsimulation/targetinventoryresultperiod/TargetInventoryResultPeriod.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridSaveButton:1, GridExcelExportButton:1, InputField:1, …
- SP: `SP_UI_IM_TARGET_INV_RESULT_PERIOD_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_IM_TARGET_INV_VER_Q1` · `engine/mp/SRV_UI_IM_TARGET_INV_RESULT_PERIOD_Q1` · `engine/mp/SRV_UI_IM_TARGET_INV_RESULT_PERIOD_S1`

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

#### TargetInventorySimulation (`UI_IM_TARGET_INVENTORY_SIMULATION`)

- 경로: `view/inventoryplan/planningsimulation/targetinventorysimulation/TargetInventorySimulation.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:3, TabContainer:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- SP: `SP_UI_IM_TARGET_INV_VER_DELETE_P_RT_MSG` · `SP_UI_IM_TARGET_INV_VERSION_P_RT_MSG` · `SP_UI_IM_TARGET_INV_UPDATE_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_IM_TARGET_INV_VER_Q1` · `engine/mp/SRV_UI_IM_TARGET_INV_VER_DELETE` · `engine/mp/SRV_UI_IM_TARGET_INV_VER_Q2`

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

#### WarehouseStock (`UI_IM_12`)

- 경로: `view/inventoryplan/master/warehousestock/WarehouseStock.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridSaveButton:1, GridExcelExportButton:1, GridExcelImportButton:1, …
- SP: `SP_UI_IM_12_S1_J` · `SP_UI_IM_12_S1_J_P_RT_MSG` · `SP_UI_IM_12_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_GET_CUTOFF_DATE_LIST` · `engine/mp/SRV_UI_IM_12_Q1`

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

### 11 상하 2분할 (4개)

#### Abcxyz (`UI_IM_ABCXYZ_CLASSIFICATION`)

- 경로: `view/inventoryplan/analysis/abcxyz/Abcxyz.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, …
- SP: `SP_UI_IM_CLASS_ANLYS_S1_P_RT_MSG` · `SP_UI_IM_CLASS_ANLYS_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_IM_CLASS_ANLYS_Q1` · `engine/mp/SRV_UI_IM_CLASS_ANLYS_S1` · `engine/mp/SRV_UI_IM_CLASS_ANLYS_Q2`

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

#### DemandVariabilityAnalysis (`UI_IM_DEMAND_VARIABILITY_ANALYSIS`)

- 경로: `view/inventoryplan/analysis/demandvariabilityanalysis/DemandVariabilityAnalysis.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, GridExcelExportButton:1, InputField:3, …
- 호출: `engine/mp/`

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

#### ImSimulationCompare

- 경로: `view/inventoryplan/planningsimulation/imsimulationcompare/ImSimulationCompare.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, InputField:1, PlanScope:1
- SP: `SP_UI_IM_SIMUL_CONFIRM_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_IM_TARGET_INV_VER_Q1` · `engine/mp/SRV_UI_IM_SIMUL_COMPARE` · `engine/mp/SRV_UI_IM_SIMUL_CONFIRM`

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

#### SupplyVariabilityAnalysis (`UI_IM_SUPPLY_VARIABILITY_ANALYSIS`)

- 경로: `view/inventoryplan/analysis/supplyvariabilityanalysis/SupplyVariabilityAnalysis.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, GridExcelExportButton:1, InputField:1, …
- 호출: `engine/mp/SRV_UI_IM_SUPPLY_VARIABILITY_ANALYSIS`

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

### — 팝업 (6개)

#### PopColorPalette

- 경로: `view/inventoryplan/analysis/inventorydetail/PopColorPalette.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: PopupDialog:1

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

#### PopStockCostBundleCreate

- 경로: `view/inventoryplan/master/stockcost/PopStockCostBundleCreate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:2, PopupDialog:1
- 호출: `engine/mp/SRV_UI_IM_05_BATCH`

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

#### PopStockRange

- 경로: `view/inventoryplan/analysis/inventorydetail/PopStockRange.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: PopupDialog:1
- SP: `SP_UI_IM_STOCK_RANGE_SAVE_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_IM_STOCK_RANGE` · `engine/mp/SRV_UI_IM_STOCK_RANGE_SAVE`

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

#### PopStoragelocation

- 경로: `view/inventoryplan/master/storagelocation/PopStoragelocation.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: TabContainer:1, InputField:18, PopLocatTp:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_IM_11_S1`

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

#### PopStorageLocationNew

- 경로: `view/inventoryplan/master/storagelocation/PopStorageLocationNew.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:6, PopupDialog:1
- SP: `SP_UI_IM_11_POP_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_IM_11_POP_S1`

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

#### PopWarehouseStock

- 경로: `view/inventoryplan/master/warehousestock/PopWarehouseStock.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, GridSaveButton:1, PopupDialog:1
- SP: `SP_UI_IM_12_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_IM_12_Q2` · `engine/mp/SRV_UI_IM_12_S2`

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

### — 위젯 (24개)

#### CurrentInventory

- 경로: `view/inventoryplan/widgets/currentinventory/CurrentInventory.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_INV_TREND`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### ExcessAlert

- 경로: `view/inventoryplan/widgets/excessalert/ExcessAlert.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: BaseGrid:1
- SP: `SP_UI_SA_INV_STOCKOUT_ALERT`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### InventoryDays

- 경로: `view/inventoryplan/widgets/inventorydays/InventoryDays.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_INV_TREND`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### InventoryTrend

- 경로: `view/inventoryplan/widgets/inventorytrend/InventoryTrend.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_INV_TREND`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### LocationInventoryStatus

- 경로: `view/inventoryplan/widgets/locationinventorystatus/LocationInventoryStatus.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- SP: `SP_UI_SA_INV_LOCATION_STATUS`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### LocationMap

- 경로: `view/inventoryplan/widgets/locationinventorystatus/LocationMap.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### LocatLoss

- 경로: `view/inventoryplan/widgets/locatloss/LocatLoss.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: BaseGrid:1
- 호출: `engine/mp/SRV_UI_IM_LOCAT_LOSS`

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### LocatLossDistribution

- 경로: `view/inventoryplan/widgets/locatlossdistribution/LocatLossDistribution.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- 호출: `engine/mp/SRV_UI_IM_LOCAT_LOSS_DISTRIBUTION`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### LocatLossTrend

- 경로: `view/inventoryplan/widgets/locatlosstrend/LocatLossTrend.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- 호출: `engine/mp/SRV_UI_IM_LOCAT_LOSS_TREND`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### LocatObsoleteStock

- 경로: `view/inventoryplan/widgets/locatobsoletestock/LocatObsoleteStock.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: BaseGrid:1
- 호출: `engine/mp/SRV_UI_IM_OBSOLETE_STATE_Q1`

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### LocatObsoleteStockDistribution

- 경로: `view/inventoryplan/widgets/locatobsoletestockdistribution/LocatObsoleteStockDistribution.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- 호출: `engine/mp/SRV_UI_IM_OBSOLETE_STATE_Q2`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### LocatReturn

- 경로: `view/inventoryplan/widgets/locatreturn/LocatReturn.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: BaseGrid:1
- 호출: `engine/mp/SRV_UI_IM_LOCAT_RETURN`

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### LocatReturnDistribution

- 경로: `view/inventoryplan/widgets/locatreturndistribution/LocatReturnDistribution.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- 호출: `engine/mp/SRV_UI_IM_LOCAT_RETURN_DISTRIBUTION`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### LocatReturnTrend

- 경로: `view/inventoryplan/widgets/locatreturntrend/LocatReturnTrend.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- 호출: `engine/mp/SRV_UI_IM_LOCAT_RETURN_TREND`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### ObsoleteStatus

- 경로: `view/inventoryplan/widgets/obsoletestatus/ObsoleteStatus.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=2 grid=0
- 컴포넌트: ChartComponent:2
- SP: `SP_UI_SA_INV_OBSOLETE_STATUS`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### ObsoleteStockDistribution

- 경로: `view/inventoryplan/widgets/obsoletestockdistribution/ObsoleteStockDistribution.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- 호출: `engine/mp/SRV_UI_IM_OBSOLETE_STATE_Q3`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### PotentialLoss

- 경로: `view/inventoryplan/widgets/potentialloss/PotentialLoss.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- SP: `SP_UI_SA_INV_POTENTIAL_LOSS`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### SalesTrend

- 경로: `view/inventoryplan/widgets/salestrend/SalesTrend.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_INV_TREND`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SlowMovingDetail

- 경로: `view/inventoryplan/widgets/slowmovingdetail/SlowMovingDetail.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=1
- 컴포넌트: BaseGrid:1, ChartComponent:1
- 호출: `engine/mp/SRV_UI_IM_01_RST_LOAD` · `engine/mp/SRV_UI_IM_SLOW_MOVING_STATE_Q2` · `engine/mp/SRV_UI_IM_SLOW_MOVING_STATE_Q3`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SlowMovingLocation

- 경로: `view/inventoryplan/widgets/slowmovinglocation/SlowMovingLocation.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- 호출: `engine/mp/SRV_UI_IM_01_RST_LOAD` · `engine/mp/SRV_UI_IM_SLOW_MOVING_STATE_Q1`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SlowMovingStatus

- 경로: `view/inventoryplan/widgets/slowmovingstatus/SlowMovingStatus.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_INV_SLOWMOVING_STATUS`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### StockoutAlert

- 경로: `view/inventoryplan/widgets/stockoutalert/StockoutAlert.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: BaseGrid:1
- SP: `SP_UI_SA_INV_STOCKOUT_ALERT`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### StockoutSku

- 경로: `view/inventoryplan/widgets/stockoutsku/StockoutSku.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- SP: `SP_UI_SA_INV_STOCKOUT_SKU`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### TotalDemand

- 경로: `view/inventoryplan/widgets/totaldemand/TotalDemand.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- SP: `SP_UI_SA_INV_TREND`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

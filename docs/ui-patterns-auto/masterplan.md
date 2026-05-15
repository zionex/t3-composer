# masterplan 모듈 — UI 패턴 카탈로그

> Phase 1 자동 분류 결과 (생성: `ui-patterns-gen.cjs`). 정정·보강 환영.

## 요약

| 항목 | 값 |
|---|---:|
| 총 화면 | 162 |
| 등록 메뉴 (UI_*) | 39 |
| 위젯 | 13 |
| 팝업 | 85 |
| Base 래퍼 | 0 |
| Sub-component | 0 |

### 레이아웃 카테고리 분포

| 카테고리 | 화면 수 |
|---|---:|
| 01 미분할 (단일) | 52 |
| 11 상하 2분할 | 9 |
| 93 Monitoring | 1 |
| 95 RouteLayout | 2 |
| — 팝업 | 85 |
| — 위젯 | 13 |

### 패턴 분포 (상위 10)

| 패턴 | 화면 수 |
|---|---:|
| 팝업 다이얼로그 (`popup`) | 85 |
| 비표준 / 자유 폼 (`free_form`) | 19 |
| P03 검색 + 탭 그리드 (`search_tab`) | 13 |
| P02 검색 + 그리드 (마스터 CRUD) (`search_grid`) | 12 |
| 위젯 (자유) (`widget_misc`) | 9 |
| v2 차트 + 그리드 (수직 스택) (`grid_chart_stacked`) | 6 |
| P02b 그리드 전용 (검색 없음) (`P02b_grid_only`) | 5 |
| v2 듀얼 그리드 2-stack (`v2_dual_grid`) | 3 |
| 위젯 (차트) (`widget_chart`) | 3 |
| RL 라우트 레이아웃 (FLO) (`rl_layout_design`) | 2 |

---
## 화면별 상세

### 01 미분할 (단일) (52개)

#### AllocationRulePartialPlan

- 경로: `view/masterplan/planningsimulation/planpolicy/AllocationRulePartialPlan.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:2
- SP: `SP_UI_CM_15_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_15_Q3` · `engine/mp/SRV_UI_CM_15_S2`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### AllocationRuleResource

- 경로: `view/masterplan/planningsimulation/planpolicy/AllocationRuleResource.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, InputField:2
- SP: `SP_UI_CM_15_S3_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_15_Q3` · `engine/mp/SRV_UI_CM_15_S2` · `engine/mp/SRV_UI_CM_15_Q6`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### AllocationRuleSite

- 경로: `view/masterplan/planningsimulation/planpolicy/AllocationRuleSite.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:4
- SP: `SP_UI_CM_15_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_15_Q3` · `engine/mp/SRV_UI_CM_15_S2`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### ByProduct

- 경로: `view/masterplan/master/byproduct/ByProduct.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, TabContainer:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- SP: `SP_UI_MP_GRADEBYPRODUCT_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_GRADEBYPRODUCT_Q1` · `engine/mp/SRV_UI_MP_GRADEBYPRODUCT_S1`

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

#### ColorInputMp

- 경로: `view/masterplan/common/ColorInputMp.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### ConfirmedPlanningLevel

- 경로: `view/masterplan/planningsimulation/planpolicy/ConfirmedPlanningLevel.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1
- SP: `SP_UI_CM_15_S3_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_15_Q3` · `engine/mp/SRV_UI_CM_15_Q7` · `engine/mp/SRV_UI_CM_15_S2`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### ConsumptionPlan (`UI_MP_30`)

- 경로: `view/masterplan/analysisreport/consumptionplan/ConsumptionPlan.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, TabContainer:1, ChartComponent:2, GridExcelExportButton:2, …
- 호출: `engine/mp/GetMRP` · `engine/mp/GetPoCheck`

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

#### CustomComponent

- 경로: `view/masterplan/master/plantrescalendar/CustomComponent.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### CycleConsecutive (`UI_MP_14`)

- 경로: `view/masterplan/master/cycleconsecutive/CycleConsecutive.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridSaveButton:1, GridExcelExportButton:1, InputField:2, …
- SP: `SP_UI_MP_14_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_14_Q1` · `engine/mp/SRV_UI_MP_14_S1`

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

#### DemandFacingLevel

- 경로: `view/masterplan/planningsimulation/planpolicy/DemandFacingLevel.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:7
- SP: `SP_UI_CM_15_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_15_Q8` · `engine/mp/SRV_UI_CM_15_Q9` · `engine/mp/SRV_UI_CM_15_Q3`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### DemandOverview (`UI_MP_19`)

- 경로: `view/masterplan/planningsimulation/demandoverview/DemandOverview.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:7, TabContainer:1, GridAddRowButton:1, GridSaveButton:7, …
- SP: `SP_UI_MP_19_S1_P_RT_MSG` · `SP_UI_MP_19_S5_P_RT_MSG` · `SP_UI_MP_19_S7_P_RT_MSG` · `SP_UI_MP_19_S2_P_RT_MSG` · `SP_UI_MP_19_S8_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_19_Q4` · `engine/mp/SRV_SP_UI_MP_19_Q1` · `engine/mp/SRV_SP_UI_MP_19_S1`

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

#### General

- 경로: `view/masterplan/planningsimulation/planpolicy/General.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:1
- SP: `SP_UI_CM_15_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_15_Q3` · `engine/mp/SRV_UI_CM_15_S2`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### GeneralConfig (`UI_MP_01`)

- 경로: `view/masterplan/master/generalconfig/GeneralConfig.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### InFinitePlanningLevel

- 경로: `view/masterplan/planningsimulation/planpolicy/InFinitePlanningLevel.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1
- SP: `SP_UI_CM_15_S3_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_15_Q3` · `engine/mp/SRV_UI_CM_15_Q7` · `engine/mp/SRV_UI_CM_15_S2`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### InTransitStock

- 경로: `view/masterplan/master/intransitstock/InTransitStock.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### ItemProductionCalendar (`UI_MP_17`)

- 경로: `view/masterplan/master/itemproductioncalendar/ItemProductionCalendar.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridDeleteRowButton:1, GridSaveButton:1, GridExcelExportButton:1, …
- SP: `SP_UI_MP_17_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_17_Q1` · `engine/mp/SRV_UI_MP_17_S1`

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

#### ItemResCapacity (`UI_MP_09`)

- 경로: `view/masterplan/master/itemrescapacity/ItemResCapacity.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:3, TabContainer:1, GridAddRowButton:3, GridDeleteRowButton:2, …
- SP: `SP_UI_MP_09_S1_P_RT_MSG` · `SP_UI_MP_09_S2_P_RT_MSG` · `SP_UI_MP_09_S3_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_09_Q1` · `engine/mp/SRV_UI_MP_09_S1` · `engine/mp/SRV_UI_MP_09_Q2`

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

#### ItemStatus (`UI_MP_41`)

- 경로: `view/masterplan/analysisreport/itemstatus/ItemStatus.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, TabContainer:1, ChartComponent:1, InputField:3, …
- 호출: `engine/mp/GetInventoryStatus` · `engine/mp/GetInventoryOperationInfo`

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

#### JobChangeTime (`UI_MP_23`)

- 경로: `view/masterplan/master/jobchangetime/JobChangeTime.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, TabContainer:1, GridAddRowButton:2, GridDeleteRowButton:2, …
- SP: `SP_UI_MP_23_S2_P_RT_MSG` · `SP_UI_MP_23_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_23_Q2` · `engine/mp/SRV_UI_MP_23_Q1` · `engine/mp/SRV_UI_MP_23_S2`

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

#### MasterPlanBoard (`UI_MP_MASTER_PLAN_STATE`)

- 경로: `view/masterplan/analysisreport/masterplanboard/MasterPlanBoard.jsx`
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

#### MaterialConstraint (`UI_MP_05`)

- 경로: `view/masterplan/master/materialconstraint/MaterialConstraint.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridSaveButton:1, GridExcelExportButton:1, InputField:1, …
- SP: `SP_UI_MP_05_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_05_Q1` · `engine/mp/SRV_UI_MP_05_S1`

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

#### MaterialSupplyCalendar (`UI_MP_18`)

- 경로: `view/masterplan/master/materialsupplycalendar/MaterialSupplyCalendar.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridSaveButton:1, GridExcelExportButton:1, GridExcelImportButton:1, …
- SP: `SP_UI_MP_18_S1_J` · `SP_UI_MP_18_S1_J_P_RT_MSG`
- 호출: `engine/mp/SRV_GET_CUTOFF_DATE_LIST` · `engine/mp/SRV_UI_MP_18_Q1` · `common/json-save`

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

#### MaxOpresGrp (`UI_MP_35`)

- 경로: `view/masterplan/master/maxopresgrp/MaxOpresGrp.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, …
- SP: `SP_UI_MP_35_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_35_Q1` · `engine/mp/SRV_UI_MP_35_S1`

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

#### MpComparative (`UI_MP_26`)

- 경로: `view/masterplan/analysisreport/mpcomparative/MpComparative.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridExcelExportButton:1, InputField:6, PlanScope:1
- 호출: `engine/mp/SRV_COMM_DEFAULT_VER` · `engine/mp/GetMPComparativeAnalysis`

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

#### MpComparativeReportDrawer

- 경로: `view/masterplan/analysisreport/mpcomparative/MpComparativeReportDrawer.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### MpResult (`UI_MP_27`)

- 경로: `view/masterplan/analysisreport/mpresult/MpResult.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, TabContainer:1, ChartComponent:1, GridExcelExportButton:2, …
- 호출: `engine/mp/SRV_UI_MP_29_Q2` · `engine/mp/GetDemandAnalysis` · `engine/mp/GetMPSimulationAnalysis`

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

#### MpSimulationComparison

- 경로: `view/masterplan/analysisreport/mpsimulationcomparison/MpSimulationComparison.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, InputField:4, PlanScope:1, PopKpiWeightConfig:1
- 호출: `engine/mp/SRV_COMM_SRH_VER_Q` · `engine/mp/SRV_COMM_DEFAULT_VER` · `engine/mp/SRV_UI_MP_SIMUL_COMPARE`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### PlanDetail (`UI_MP_32`)

- 경로: `view/masterplan/analysisreport/plandetail/PlanDetail.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridExcelExportButton:1, InputField:6, PlanScope:1
- 호출: `engine/mp/SRV_COMM_DEFAULT_DATE` · `engine/mp/GetPlanDetailAnalysis`

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

#### PlannedOrder

- 경로: `view/masterplan/planningsimulation/plannedorder/PlannedOrder.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridExcelExportButton:1, InputField:2, PlanScope:1
- 호출: `engine/mp/SRV_UI_MP_PLANNEDORDER_Q1`

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

#### PlanningMethod

- 경로: `view/masterplan/planningsimulation/planpolicy/PlanningMethod.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:2
- SP: `SP_UI_CM_15_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_15_Q3` · `engine/mp/SRV_UI_CM_15_S2`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### PlanOption

- 경로: `view/masterplan/planningsimulation/planpolicy/PlanOption.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:14
- SP: `SP_UI_CM_15_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_15_Q9` · `engine/mp/SRV_UI_CM_15_Q3` · `engine/mp/SRV_UI_CM_15_S2`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### PlanPolicy (`UI_MP_20`)

- 경로: `view/masterplan/planningsimulation/planpolicy/PlanPolicy.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, InputField:2, PlanScope:1
- SP: `SP_UI_CM_15_S5_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_15_Q4` · `engine/mp/SRV_UI_CM_15_Q2` · `engine/mp/SRV_UI_CM_15_Q1`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### PlanPolicyCoverage

- 경로: `view/masterplan/planningsimulation/planpolicy/PlanPolicyCoverage.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:7
- SP: `SP_UI_CM_15_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_15_Q9` · `engine/mp/SRV_UI_CM_15_Q3` · `engine/mp/SRV_UI_CM_15_S2`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### PlanPriority

- 경로: `view/masterplan/planningsimulation/planpolicy/PlanPriority.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- SP: `SP_UI_CM_15_S3_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_15_Q5` · `engine/mp/SRV_UI_CM_15_S3`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### PlanScenario (`UI_MP_43`)

- 경로: `view/masterplan/planningsimulation/planscenario/PlanScenario.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### PlantResCalendar (`UI_MP_11`)

- 경로: `view/masterplan/master/plantrescalendar/PlantResCalendar.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, TabContainer:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- SP: `SP_UI_MP_11_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_11_Q1` · `engine/mp/SRV_UI_MP_11_S3` · `engine/mp/SRV_UI_MP_11_S1`

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

#### PreBuildLimit (`UI_MP_13`)

- 경로: `view/masterplan/master/prebuildlimit/PreBuildLimit.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridSaveButton:1, PlanScope:1
- SP: `SP_UI_MP_13_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_13_Q2` · `engine/mp/SRV_UI_MP_13_S2`

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

#### ProblemAnalysis (`UI_MP_34`)

- 경로: `view/masterplan/planningsimulation/problemanalysis/ProblemAnalysis.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridExcelExportButton:1, InputField:5, PlanScope:1, …
- 호출: `engine/mp/SRV_COMM_DEFAULT_VER` · `engine/mp/SRV_COMM_DEFAULT_DATE` · `engine/mp/GetProblemAnalysis`

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

#### ProductMixMax (`UI_MP_16`)

- 경로: `view/masterplan/master/productmixmax/ProductMixMax.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:4, TabContainer:1, GridAddRowButton:4, GridDeleteRowButton:4, …
- SP: `SP_UI_MP_16_S1_P_RT_MSG` · `SP_UI_MP_16_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_16_Q1` · `engine/mp/SRV_UI_MP_16_S1` · `engine/mp/SRV_UI_MP_16_Q2`

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

#### ProductMixMaxNew1

- 경로: `view/masterplan/master/productmixmax/ProductMixMaxNew1.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:4, PopupDialog:1
- SP: `SP_UI_MP_16_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_16_S1`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### ProductMixMin (`UI_MP_15`)

- 경로: `view/masterplan/master/productmixmin/ProductMixMin.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:3, TabContainer:1, GridAddRowButton:3, GridDeleteRowButton:3, …
- SP: `SP_UI_MP_15_D1_P_RT_MSG` · `SP_UI_MP_15_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_GET_COMBO_LIST` · `engine/mp/SRV_UI_MP_15_Q1` · `engine/mp/SRV_UI_MP_15_D1`

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

#### Resource (`UI_MP_06`)

- 경로: `view/masterplan/master/resource/Resource.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=2
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:4, TabContainer:2, GridAddRowButton:4, GridDeleteRowButton:4, …
- SP: `SP_UI_MP_06_S1_P_RT_MSG` · `SP_UI_MP_06_S8_P_RT_MSG` · `SP_UI_MP_06_S2_P_RT_MSG` · `SP_UI_MP_06_POP_S1_P_RT_MSG` · `SP_UI_MP_06_S3_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_06_Q1` · `engine/mp/SRV_UI_MP_06_S1` · `engine/mp/SRV_UI_MP_06_S8`

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

#### ResourceGantt (`UI_MP_GANTT_RESOURCE`)

- 경로: `view/masterplan/analysisreport/resourcegantt/ResourceGantt.jsx`
- 패턴: **간트 단독** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: GanttChart=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, GanttChart:1, InputField:1, PlanScope:1
- 호출: `engine/mp/SRV_COMM_SRH_VER_Q` · `masterplan/resource-gantt/plan-horizon` · `masterplan/resource-gantt`

```
┌──────────────────────────────┐
│ Gantt View                   │
├──────────────────────────────┤
│ ▓▓▓░░░░░░░░░░░░░░░░░         │
│ ░░▓▓▓▓▓░░░░░░░░░░░░          │
│ ░░░░░░▓▓▓▓░░░░░░░░░          │
└──────────────────────────────┘
```

#### ResStatus (`UI_MP_42`)

- 경로: `view/masterplan/analysisreport/resstatus/ResStatus.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:3, TabContainer:1, ChartComponent:1, InputField:3, …
- 호출: `engine/mp/SRV_UI_MP_42_Q3` · `engine/mp/GetResourceStatus` · `engine/mp/GetResourceOperationInfo`

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

#### Routing (`UI_MP_38`)

- 경로: `view/masterplan/master/routing/Routing.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, TabContainer:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- SP: `SP_UI_MP_38_S2_P_RT_MSG` · `SP_UI_MP_38_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_38_Q2` · `engine/mp/SRV_UI_MP_38_S2` · `engine/mp/SRV_UI_MP_38_Q1`

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

#### SiteIncomingCalendar (`UI_MP_LOC_HOLIDAY`)

- 경로: `view/masterplan/master/siteincomingcalendar/SiteIncomingCalendar.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, …
- SP: `SP_UI_MP_LOC_HOLIDAY_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_LOC_HOLIDAY_Q1` · `engine/mp/SRV_UI_MP_LOC_HOLIDAY_S1` · `engine/mp/SRV_UI_MP_LOC_HOLIDAY_D1`

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

#### SubPlanPriority

- 경로: `view/masterplan/planningsimulation/planpolicy/SubPlanPriority.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1
- SP: `SP_UI_CM_15_S3_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_15_Q5` · `engine/mp/SRV_UI_CM_15_S3`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### SupplyTrend

- 경로: `view/masterplan/analysisreport/supplytrend/SupplyTrend.jsx`
- 패턴: **P01 위젯 대시보드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: DashboardPanel=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, DashboardPanel:1, InputField:2, PlanScope:1
- 호출: `engine/mp/SRV_UI_MP_LOCAT_INV_POLICY_TARGET` · `engine/mp/SRV_UI_MP_LOCAT_TOTAL_INVENTORY` · `engine/mp/SRV_UI_MP_LOCAT_TOTAL_SHIPMENT`

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

#### Validation (`UI_MP_VALIDATION`)

- 경로: `view/masterplan/master/validation/Validation.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: ContentInner:1, WorkArea:1, BaseGrid:1, PlanScope:1
- SP: `SP_UI_MP_VALIDATION_BATCH_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_VALIDATION_Q2` · `engine/mp/SRV_UI_MP_VALIDATION_Q1` · `engine/mp/SRV_UI_MP_VALIDATION_BATCH`

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

- 경로: `view/masterplan/master/validation/ValidationAccordion.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### WarehouseStock

- 경로: `view/masterplan/master/warehousestock/WarehouseStock.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### Wip (`UI_MP_02`)

- 경로: `view/masterplan/master/wip/Wip.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridSaveButton:1, GridExcelExportButton:1, InputField:1, …
- SP: `SP_UI_MP_02_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_GET_CUTOFF_DATE_LIST` · `engine/mp/SRV_UI_MP_02_Q1` · `engine/mp/SRV_UI_MP_02_S1`

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

### 11 상하 2분할 (9개)

#### DemandDistribution (`UI_MP_44`)

- 경로: `view/masterplan/planningsimulation/demanddistribution/DemandDistribution.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, GridExcelExportButton:1, InputField:2, …
- 호출: `engine/mp/SRV_UI_MP_19_Q4` · `engine/mp/SRV_SP_UI_MP_19_Q10`

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

#### ItemClassification (`UI_CM_03`)

- 경로: `view/masterplan/master/itemclassification/ItemClassification.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridAddRowButton:2, GridDeleteRowButton:2, GridSaveButton:2, …
- SP: `SP_UI_CM_03_S1_P_RT_MSG` · `SP_UI_CM_03_S6_P_RT_MSG` · `SP_UI_CM_03_S3_P_RT_MSG` · `SP_UI_CM_03_BATCH_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_03_POP_01_Q` · `engine/mp/SRV_UI_CM_03_Q1` · `engine/mp/SRV_UI_CM_03_S1`

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

#### ItemResPreference (`UI_MP_08`)

- 경로: `view/masterplan/master/itemrespreference/ItemResPreference.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridAddRowButton:2, GridDeleteRowButton:1, GridSaveButton:2, …
- SP: `SP_UI_MP_08_S1_P_RT_MSG` · `SP_UI_MP_08_S3_P_RT_MSG`
- 호출: `engine/mp/SRV_GET_COMBO_LIST` · `engine/mp/SRV_UI_MP_08_Q1` · `engine/mp/SRV_UI_MP_08_S1`

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

#### MPSimulation (`UI_MP_21`)

- 경로: `view/masterplan/planningsimulation/mpsimulation/MPSimulation.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, InputField:5, PlanScope:1
- SP: `SP_UI_CM_17_S1_P_RT_MSG`
- 호출: `common/json-save` · `engine/mp/SRV_UI_CM_17_Q1` · `engine/mp/SRV_COMM_SRH_DMND_VER`

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

#### ResProdPlan (`UI_MP_RES_PROD_PLAN`)

- 경로: `view/masterplan/analysisreport/resprodplan/ResProdPlan.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, GridExcelExportButton:1, InputField:2, …
- 호출: `engine/mp/GetResProdPlan` · `engine/mp/SRV_COMM_DEFAULT_DATE` · `engine/mp/GetResourceUtilization`

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

#### ResProductionPlanning (`UI_MP_29`)

- 경로: `view/masterplan/analysisreport/resproductionplanning/ResProductionPlanning.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, GridSaveButton:1, GridExcelExportButton:1, …
- SP: `SP_UI_MP_29_S1_J_P_RT_MSG`
- 호출: `engine/mp/SRV_COMM_SRH_VER_Q` · `engine/mp/SRV_UI_MP_29_Q2` · `engine/mp/SRV_UI_MP_29_S1_J`

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

#### ResUtilization (`UI_MP_31`)

- 경로: `view/masterplan/analysisreport/resutilization/ResUtilization.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, GridExcelExportButton:1, InputField:5, …
- 호출: `engine/mp/SRV_COMM_SRH_VER_Q` · `engine/mp/SRV_COMM_DEFAULT_DATE` · `engine/mp/GetResourceUtilization`

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

#### Rtf

- 경로: `view/masterplan/analysisreport/rtf/Rtf.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, GridExcelExportButton:1, InputField:4, …
- 호출: `engine/mp/SRV_UI_MP_RTF` · `engine/mp/SRV_UI_MP_RTF_DETAIL`

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

#### ShortLateReason (`UI_MP_25`)

- 경로: `view/masterplan/planningsimulation/shortlatereason/ShortLateReason.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=2 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:2, GridExcelExportButton:1, InputField:6, …
- 호출: `engine/mp/GetPlanProblem` · `engine/mp/GetProblemSummary`

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

### 93 Monitoring (1개)

#### ShortageMonitoring

- 경로: `view/masterplan/analysisreport/shortagemonitoring/ShortageMonitoring.jsx`
- 패턴: **MN KPI 모니터링** (LAYOUT_MONITORING) · confidence: **high**
- 추정 근거: monitoring match · chart=1 grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, GridSaveButton:1, InputField:4, …
- SP: `SP_UI_MP_DEMAND_ADJUST` · `SP_UI_MP_DEMAND_ADJUST_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_SHORTAGE_MONITORING` · `engine/mp/SRV_UI_MP_SHORTAGE_MONITORING_DETAIL` · `common/json-save`

```
┌──────────────────────────────┐
│ ┌───┐┌───┐┌───┐┌───┐         │
│ │KPI││KPI││KPI││KPI│         │
│ └───┘└───┘└───┘└───┘         │
│ ─── Live chart ─────         │
│ Alerts: ⚠ Shortage 3         │
└──────────────────────────────┘
```

### 95 RouteLayout (2개)

#### DemandOrderTracking (`UI_MP_22`)

- 경로: `view/masterplan/analysisreport/demandordertracking/DemandOrderTracking.jsx`
- 패턴: **RL 라우트 레이아웃 (FLO)** (LAYOUT_ROUTELAYOUT) · confidence: **high**
- 추정 근거: route keyword · flo=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:5, TreeGrid:1, TabContainer:1, FLODiagram:1, …
- 호출: `engine/mp/GetDemandInfo` · `engine/mp/GetDemandAssign` · `engine/mp/GetDemandTracking`

```
┌──────────────────────────────┐
│ Route Layout (FLODiagram)    │
├──────────────────────────────┤
│ [A]──▶[B]──▶[C]              │
│         │     ▼              │
│         └──▶[D]──▶[E]        │
└──────────────────────────────┘
```

#### RouteClassification (`UI_MP_ROUTE_CLASSIFICATION`)

- 경로: `view/masterplan/master/routeclassification/RouteClassification.jsx`
- 패턴: **RL 라우트 레이아웃 (FLO)** (LAYOUT_ROUTELAYOUT) · confidence: **mid**
- 추정 근거: route keyword · flo=0
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridAddRowButton:2, GridDeleteRowButton:2, GridSaveButton:2, …
- SP: `SP_UI_MP_ROUTE_CLASS_S1_P_RT_MSG` · `SP_UI_MP_ROUTE_CLASS_D1_P_RT_MSG` · `SP_UI_MP_ROUTE_CLASS_S3_P_RT_MSG` · `SP_UI_MP_ROUTE_CLASS_BATCH_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_ROUTE_CLASS_POP_01_Q` · `engine/mp/SRV_UI_MP_ROUTE_CLASS_Q1` · `engine/mp/SRV_UI_MP_ROUTE_CLASS_S1`

```
┌──────────────────────────────┐
│ Route Layout (FLODiagram)    │
├──────────────────────────────┤
│ [A]──▶[B]──▶[C]              │
│         │     ▼              │
│         └──▶[D]──▶[E]        │
└──────────────────────────────┘
```

### — 팝업 (85개)

#### PopAccount

- 경로: `view/masterplan/master/wip/PopAccount.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_02_POP_Q2`

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

#### PopAdjustShppPlan

- 경로: `view/masterplan/common/PopAdjustShppPlan.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, GridAddRowButton:1, GridSaveButton:1, InputField:1, PopupDialog:1
- SP: `SP_UI_MP_27_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_27_POP_Q1` · `engine/mp/GetShipmentPlan` · `engine/mp/SRV_UI_MP_27_S2`

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

#### PopAllRoute

- 경로: `view/masterplan/master/itemrespreference/PopAllRoute.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_38_Q2`

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

#### PopConfirmAdjPlan

- 경로: `view/masterplan/common/PopConfirmAdjPlan.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:12, PopupDialog:1
- 호출: `engine/mp/SRV_UI_CM_17_Q3` · `engine/mp/`

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

#### PopConfirmPlan

- 경로: `view/masterplan/common/PopConfirmPlan.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:12, PopupDialog:1
- 호출: `engine/mp/SRV_UI_CM_17_Q3` · `engine/mp/`

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

#### PopCycleConsecutiveBundleCreate

- 경로: `view/masterplan/master/cycleconsecutive/PopCycleConsecutiveBundleCreate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:3, PopupDialog:1
- SP: `SP_UI_MP_14_BATCH_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_14_BATCH`

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

#### PopDemandInfo

- 경로: `view/masterplan/common/PopDemandInfo.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, GridExcelExportButton:1, PopupDialog:1
- 호출: `engine/mp/GetDemandTargetInfo`

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

#### PopDemandOverview

- 경로: `view/masterplan/planningsimulation/demandoverview/PopDemandOverview.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=6
- 컴포넌트: BaseGrid:6, TabContainer:1, GridAddRowButton:6, GridDeleteRowButton:6, InputField:26, PopupDialog:1
- SP: `SP_UI_MP_19_S4_P_RT_MSG` · `SP_UI_MP_19_POP_S5_P_RT_MSG` · `SP_UI_MP_19_POP_S8_P_RT_MSG` · `SP_UI_MP_19_POP_S2_P_RT_MSG` · `SP_UI_MP_19_POP_S10_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_19_Q9` · `engine/mp/SRV_SP_UI_MP_19_POP_Q3` · `engine/mp/SRV_UI_MP_19_POP_Q10`

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

#### PopDemandOverviewBatchUpdate

- 경로: `view/masterplan/planningsimulation/demandoverview/PopDemandOverviewBatchUpdate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:1, PopupDialog:1
- SP: `SP_UI_MP_19_BATCH_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_19_BATCH`

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

#### PopDetailProductionPlan

- 경로: `view/masterplan/analysisreport/consumptionplan/PopDetailProductionPlan.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/GetSemiProductionPlan`

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

#### PopDueInTrack

- 경로: `view/masterplan/common/PopDueInTrack.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/GetInventoryActivity`

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

#### PopGradeByProduct

- 경로: `view/masterplan/master/byproduct/PopGradeByProduct.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:12, PopupDialog:1
- SP: `SP_UI_MP_GRADEBYPRODUCT_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_GRADEBYPRODUCT_S1`

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

#### PopItem

- 경로: `view/masterplan/master/jobchangetime/PopItem.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_23_POP_Q2`

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

#### PopItemClass

- 경로: `view/masterplan/master/itemclassification/PopItemClass.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_CM_03_POP_01_Q`

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

#### PopItemClass

- 경로: `view/masterplan/master/productmixmax/PopItemClass.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_COMM_DATA_Q`

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

#### PopItemClassificationNew1

- 경로: `view/masterplan/master/itemclassification/PopItemClassificationNew1.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, TabContainer:1, InputField:5, PopupDialog:1
- SP: `SP_UI_CM_03_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_COMM_AUTO_GEN_ID` · `engine/mp/SRV_UI_CM_03_POP_01_Q` · `engine/mp/SRV_UI_CM_03_S1_INS`

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

#### PopItemClassificationNew2

- 경로: `view/masterplan/master/itemclassification/PopItemClassificationNew2.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, InputField:6, PopupDialog:1
- SP: `SP_UI_CM_03_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_03_POP_01_Q` · `engine/mp/SRV_UI_CM_03_S2`

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

#### PopItemGroup

- 경로: `view/masterplan/master/productmixmax/PopItemGroup.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_16_POP_Q3`

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

#### PopItemLocation

- 경로: `view/masterplan/master/itemrespreference/PopItemLocation.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, WorkArea:1, BaseGrid:1, InputField:4, PopupDialog:1
- 호출: `engine/mp/SRV_GET_COMBO_LIST` · `engine/mp/SRV_UI_MP_08_POP_Q4`

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

- 경로: `view/masterplan/master/productmixmax/PopItemLv.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_16_POP_Q2`

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

#### PopItemPlantResCalendarBundleCreate

- 경로: `view/masterplan/master/plantrescalendar/PopItemPlantResCalendarBundleCreate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: TabContainer:1, InputField:15, PopupDialog:1
- SP: `SP_UI_MP_11_BATCH_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_11_BATCH`

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

#### PopItemProductionCalendarBundleCreate

- 경로: `view/masterplan/master/itemproductioncalendar/PopItemProductionCalendarBundleCreate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: TabContainer:1, InputField:16, PopLocatTp:1, PopupDialog:1
- SP: `SP_UI_MP_17_BATCH_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_17_BATCH`

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

#### PopItemResCapacityBatchUpdate

- 경로: `view/masterplan/master/itemrescapacity/PopItemResCapacityBatchUpdate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:9, PopupDialog:1
- SP: `SP_UI_MP_09_POP_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_09_POP_S2`

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

#### PopItemResCapacityBundleCreate

- 경로: `view/masterplan/master/itemrescapacity/PopItemResCapacityBundleCreate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:13, PopLocatTp:1, PopupDialog:1
- SP: `SP_UI_MP_09_BATCH_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_09_BATCH`

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

#### PopItemResCapacityNew1

- 경로: `view/masterplan/master/itemrescapacity/PopItemResCapacityNew1.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: TabContainer:1, InputField:27, PopupDialog:1
- SP: `SP_UI_MP_09_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_09_S1`

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

#### PopItemResCapacityNew2

- 경로: `view/masterplan/master/itemrescapacity/PopItemResCapacityNew2.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: TabContainer:1, InputField:15, PopupDialog:1
- SP: `SP_UI_MP_09_POP_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_09_POP_S2`

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

#### PopItemResCapacityPeriodNew

- 경로: `view/masterplan/master/itemrescapacity/PopItemResCapacityPeriodNew.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: TabContainer:1, InputField:12, PopupDialog:1
- SP: `SP_UI_MP_09_POP_S3_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_09_POP_S3`

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

#### PopItemResPreferenceBatchUpdate

- 경로: `view/masterplan/master/itemrespreference/PopItemResPreferenceBatchUpdate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:5, PopupDialog:1
- SP: `SP_UI_MP_08_POP_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_08_POP_S2`

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

#### PopItemResPreferenceBundleCreate

- 경로: `view/masterplan/master/itemrespreference/PopItemResPreferenceBundleCreate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:13, PopLocatTp:1, PopupDialog:1
- SP: `SP_UI_MP_08_BATCH_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_08_BATCH`

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

#### PopItemResPreferenceNew

- 경로: `view/masterplan/master/itemrespreference/PopItemResPreferenceNew.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, TabContainer:1, GridAddRowButton:1, InputField:10, PopupDialog:1
- SP: `SP_UI_MP_08_POP_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_08_POP_Q2` · `engine/mp/SRV_UI_MP_08_POP_S1`

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

#### PopJobChangeTimeNew

- 경로: `view/masterplan/master/jobchangetime/PopJobChangeTimeNew.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: TabContainer:1, InputField:19, PopLocatTp:1, PopupDialog:1
- SP: `SP_UI_MP_23_S2_P_RT_MSG` · `SP_UI_MP_23_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_23_S2` · `engine/mp/SRV_UI_MP_23_S1`

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

#### PopLocation

- 경로: `view/masterplan/master/itemrespreference/PopLocation.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_08_POP_Q3`

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

#### PopLocation

- 경로: `view/masterplan/planningsimulation/demandoverview/PopLocation.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_19_POP_Q5`

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

#### PopLocationResource

- 경로: `view/masterplan/master/jobchangetime/PopLocationResource.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_11_Q2`

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

#### PopMainVersion

- 경로: `view/masterplan/analysisreport/mpcomparative/PopMainVersion.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, WorkArea:1, BaseGrid:1, InputField:3, PopupDialog:1
- 호출: `engine/mp/SRV_COMM_SRH_MAIN_VER_Q`

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

#### PopMaxOpersGrpNew

- 경로: `view/masterplan/master/maxopresgrp/PopMaxOpersGrpNew.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:6, PopupDialog:1
- SP: `SP_UI_MP_35_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_35_S1`

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

#### PopMPSimulation

- 경로: `view/masterplan/planningsimulation/mpsimulation/PopMPSimulation.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:12, PopupDialog:1
- 호출: `engine/mp/SRV_UI_CM_17_S2` · `engine/mp/SRV_UI_CM_17_Q3` · `engine/mp/SRV_UI_CM_17_S4`

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

#### PopNewItemProductionLimit

- 경로: `view/masterplan/master/productmixmax/PopNewItemProductionLimit.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: PopupDialog:1
- SP: `SP_UI_MP_16_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_16_S1`

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

#### PopNewPlanPolicyVersion

- 경로: `view/masterplan/planningsimulation/planpolicy/PopNewPlanPolicyVersion.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:5, PopupDialog:1
- SP: `SP_UI_CM_15_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_15_S1`

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

#### PopNewSimulationVersion

- 경로: `view/masterplan/common/PopNewSimulationVersion.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:12, PopupDialog:1
- 호출: `engine/mp/SRV_UI_CM_17_S5`

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

#### PopOrderBomRate

- 경로: `view/masterplan/planningsimulation/demandoverview/PopOrderBomRate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=2
- 컴포넌트: BaseGrid:2, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_19_POP_Q6` · `engine/mp/SRV_UI_MP_19_POP_Q8`

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

#### PopPegging

- 경로: `view/masterplan/master/wip/PopPegging.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_02_POP_Q1`

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

#### PopPeriodItemResPreferenceNew

- 경로: `view/masterplan/master/itemrespreference/PopPeriodItemResPreferenceNew.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, TabContainer:1, InputField:14, PopupDialog:1
- SP: `SP_UI_MP_08_S4_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_CODE` · `engine/mp/SRV_UI_MP_08_POP_Q2` · `engine/mp/SRV_UI_MP_08_S4`

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

#### PopPlanPolicyVersion

- 경로: `view/masterplan/planningsimulation/planpolicy/PopPlanPolicyVersion.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_CM_15_Q2`

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

#### PopPlanProblem

- 경로: `view/masterplan/planningsimulation/problemanalysis/PopPlanProblem.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, GridExcelExportButton:1, PopupDialog:1
- 호출: `engine/mp/GetPlanProblem`

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

#### PopPlantResCalendarNew1

- 경로: `view/masterplan/master/plantrescalendar/PopPlantResCalendarNew1.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: TabContainer:1, InputField:12, PopupDialog:1
- SP: `SP_UI_MP_11_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_11_S1`

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

#### PopPlantResCalendarUpdate1

- 경로: `view/masterplan/master/plantrescalendar/PopPlantResCalendarUpdate1.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: TabContainer:1, InputField:12, PopupDialog:1
- SP: `SP_UI_MP_11_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_11_S1`

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

#### PopPopGradeByProductLocItem

- 경로: `view/masterplan/master/byproduct/PopPopGradeByProductLocItem.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, WorkArea:1, BaseGrid:1, InputField:4, PopupDialog:1
- 호출: `engine/mp/SRV_GET_COMBO_LIST` · `engine/mp/SRV_UI_CM_05_POP_01_Q`

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

#### PopPopGradeByProductRoute

- 경로: `view/masterplan/master/byproduct/PopPopGradeByProductRoute.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_38_Q2`

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

#### PopPopItem

- 경로: `view/masterplan/master/resource/PopPopItem.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, WorkArea:1, BaseGrid:1, InputField:4, PopupDialog:1
- 호출: `engine/mp/SRV_GET_COMBO_LIST` · `engine/mp/SRV_UI_MP_08_POP_Q4`

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

#### PopPopLocat

- 경로: `view/masterplan/master/itemrescapacity/PopPopLocat.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_08_POP_Q3`

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

#### PopPopLocat

- 경로: `view/masterplan/master/plantrescalendar/PopPopLocat.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_11_Q3`

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

#### PopPopLocat

- 경로: `view/masterplan/master/siteincomingcalendar/PopPopLocat.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_LOC_HOLIDAY_Q2`

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

#### PopPopLocatMst

- 경로: `view/masterplan/master/siteincomingcalendar/PopPopLocatMst.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_LOC_HOLIDAY_Q3`

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

#### PopPopPlant

- 경로: `view/masterplan/master/plantrescalendar/PopPopPlant.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_11_Q4`

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

#### PopPopResource

- 경로: `view/masterplan/master/itemrescapacity/PopPopResource.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_09_POP_Q1`

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

#### PopPopResource

- 경로: `view/masterplan/master/plantrescalendar/PopPopResource.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_11_Q2`

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

#### PopPopResourceNew

- 경로: `view/masterplan/master/resource/PopPopResourceNew.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_06_POP_Q5`

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

#### PopPopRoute

- 경로: `view/masterplan/master/resource/PopPopRoute.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_08_POP_Q5`

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

#### PopProcessStep

- 경로: `view/masterplan/analysisreport/mpcomparative/PopProcessStep.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_COMM_SRH_PROCESS_STEP_Q`

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

#### PopProductMixMaxBundleCreate

- 경로: `view/masterplan/master/productmixmax/PopProductMixMaxBundleCreate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:9, PopupDialog:1
- SP: `SP_UI_MP_16_BATCH_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_16_BATCH`

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

#### PopProductMixMinAllocationNew

- 경로: `view/masterplan/master/productmixmin/PopProductMixMinAllocationNew.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: TabContainer:1, InputField:15, PopupDialog:1
- SP: `SP_UI_MP_15_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_15_S1`

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

#### PopResource

- 경로: `view/masterplan/master/itemrespreference/PopResource.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_11_Q2`

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

#### PopResource

- 경로: `view/masterplan/planningsimulation/demandoverview/PopResource.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_19_POP_Q7`

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

#### PopResourceBundleCreate

- 경로: `view/masterplan/master/resource/PopResourceBundleCreate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:7, PopLocatTp:1, PopupDialog:1
- SP: `SP_UI_MP_06_BATCH_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_06_BATCH`

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

#### PopResourceGroup

- 경로: `view/masterplan/master/resource/PopResourceGroup.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_06_POP_Q2`

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

#### PopResourceGroupNew

- 경로: `view/masterplan/master/resource/PopResourceGroupNew.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:9, PopupDialog:1
- SP: `SP_UI_MP_06_POP_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_06_POP_S2`

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

#### PopResourceNew2

- 경로: `view/masterplan/master/resource/PopResourceNew2.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: TabContainer:1, InputField:18, PopupDialog:1
- SP: `SP_UI_MP_06_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_06_S2`

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

#### PopResourceNew3

- 경로: `view/masterplan/master/resource/PopResourceNew3.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, InputField:12, PopLocatTp:1, PopupDialog:1
- SP: `SP_UI_MP_06_POP_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_06_POP_Q4` · `engine/mp/SRV_UI_MP_06_POP_S1`

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

#### PopResourceNew4

- 경로: `view/masterplan/master/resource/PopResourceNew4.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:14, PopupDialog:1
- SP: `SP_UI_MP_06_S3_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_06_S3`

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

#### PopResUtilization

- 경로: `view/masterplan/analysisreport/resutilization/PopResUtilization.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, BaseGrid:1, InputField:3, PopupDialog:1
- 호출: `engine/mp/GetResourcePlanDetail`

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

#### PopRoute

- 경로: `view/masterplan/planningsimulation/demandoverview/PopRoute.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_19_POP_Q13`

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

#### PopRouteClassificationNew1

- 경로: `view/masterplan/master/routeclassification/PopRouteClassificationNew1.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, TabContainer:1, InputField:5, PopupDialog:1
- SP: `SP_UI_MP_ROUTE_CLASS_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_COMM_AUTO_GEN_ID` · `engine/mp/SRV_UI_MP_ROUTE_CLASS_POP_01_Q` · `engine/mp/SRV_UI_MP_ROUTE_CLASS_S1_INS`

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

#### PopRouteClassificationNew2

- 경로: `view/masterplan/master/routeclassification/PopRouteClassificationNew2.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, InputField:5, PopupDialog:1
- SP: `SP_UI_MP_ROUTE_CLASS_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_ROUTE_CLASS_POP_01_Q` · `engine/mp/SRV_UI_MP_ROUTE_CLASS_S2`

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

#### PopRouteGroup

- 경로: `view/masterplan/master/jobchangetime/PopRouteGroup.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_23_POP_Q1`

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

#### PopRouteGrp

- 경로: `view/masterplan/master/maxopresgrp/PopRouteGrp.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_35_POP_Q1`

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

#### PopRoutingBatchUpdate

- 경로: `view/masterplan/master/routing/PopRoutingBatchUpdate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:1, PopupDialog:1
- SP: `SP_UI_MP_38_BATCH_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_38_BATCH`

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

#### PopSelectLocation

- 경로: `view/masterplan/planningsimulation/planpolicy/PopSelectLocation.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_CM_15_Q8`

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

#### PopSimulationVersion

- 경로: `view/masterplan/common/PopSimulationVersion.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, WorkArea:1, BaseGrid:1, InputField:3, PopupDialog:1
- 호출: `engine/mp/SRV_COMM_SRH_VER_Q`

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

#### PopSiteIncomingCalendarCreate

- 경로: `view/masterplan/master/siteincomingcalendar/PopSiteIncomingCalendarCreate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: TabContainer:1, InputField:11, PopupDialog:1
- SP: `SP_UI_MP_LOC_HOLIDAY_BATCH_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_LOC_HOLIDAY_BATCH`

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

#### PopSiteIncomingCalendarNew

- 경로: `view/masterplan/master/siteincomingcalendar/PopSiteIncomingCalendarNew.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: TabContainer:1, InputField:10, PopupDialog:1
- SP: `SP_UI_MP_LOC_HOLIDAY_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_MP_LOC_HOLIDAY_S1`

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

#### PopStep

- 경로: `view/masterplan/common/PopStep.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_CM_17_Q4`

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

#### PopStock

- 경로: `view/masterplan/planningsimulation/demandoverview/PopStock.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_SP_UI_MP_19_POP_Q4`

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

#### PopUiLinkSetting

- 경로: `view/masterplan/planningsimulation/shortlatereason/PopUiLinkSetting.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, GridSaveButton:1, PopupDialog:1
- SP: `SP_UI_UI_LINK_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_16_Q2` · `engine/mp/SRV_UI_CM_01_POP_01_Q` · `engine/mp/SRV_UI_UI_LINK_S1`

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

#### PopWip

- 경로: `view/masterplan/planningsimulation/demandoverview/PopWip.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_MP_19_POP_Q11`

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

### — 위젯 (13개)

#### AllDemand

- 경로: `view/masterplan/widgets/alldemand/AllDemand.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- SP: `SP_UI_SA_MP_DASHBOARD`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### AllSupply

- 경로: `view/masterplan/widgets/allsupply/AllSupply.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- SP: `SP_UI_SA_MP_DASHBOARD`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### Boh

- 경로: `view/masterplan/widgets/boh/Boh.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- SP: `SP_UI_SA_MP_DASHBOARD`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### CapacityLoadCondition

- 경로: `view/masterplan/widgets/capacityloadcondition/CapacityLoadCondition.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1, InputField:2
- SP: `SP_UI_SA_MP_DASHBOARD`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DemandFulfillment

- 경로: `view/masterplan/widgets/demandfulfillment/DemandFulfillment.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- SP: `SP_UI_SA_MP_DASHBOARD`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### DemandFulfillmentRate

- 경로: `view/masterplan/widgets/demandfulfillmentrate/DemandFulfillmentRate.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- SP: `SP_UI_SA_MP_DASHBOARD`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### DemandSupplyFulfill

- 경로: `view/masterplan/widgets/demandsupplyfulfill/DemandSupplyFulfill.jsx`
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

#### LocatInventoryTurnover

- 경로: `view/masterplan/widgets/locatinventoryturnover/LocatInventoryTurnover.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### LocatSkuStatus

- 경로: `view/masterplan/widgets/locatskustatus/LocatSkuStatus.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: WorkArea:1, BaseGrid:1

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### LocatSupplyTrend

- 경로: `view/masterplan/widgets/locatsupplytrend/LocatSupplyTrend.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### LocatTotalInventory

- 경로: `view/masterplan/widgets/locattotalinventory/LocatTotalInventory.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### LocatTotalShipment

- 경로: `view/masterplan/widgets/locattotalshipment/LocatTotalShipment.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### LocatTotalSupply

- 경로: `view/masterplan/widgets/locattotalsupply/LocatTotalSupply.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

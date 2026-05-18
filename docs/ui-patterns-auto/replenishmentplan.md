# replenishmentplan 모듈 — UI 패턴 카탈로그

> Phase 1 자동 분류 결과 (생성: `ui-patterns-gen.cjs`). 정정·보강 환영.

## 요약

| 항목 | 값 |
|---|---:|
| 총 화면 | 29 |
| 등록 메뉴 (UI_*) | 12 |
| 위젯 | 0 |
| 팝업 | 8 |
| Base 래퍼 | 0 |
| Sub-component | 0 |

### 레이아웃 카테고리 분포

| 카테고리 | 화면 수 |
|---|---:|
| 01 미분할 (단일) | 18 |
| 11 상하 2분할 | 3 |
| — 팝업 | 8 |

### 패턴 분포 (상위 10)

| 패턴 | 화면 수 |
|---|---:|
| 비표준 / 자유 폼 (`free_form`) | 13 |
| 팝업 다이얼로그 (`popup`) | 8 |
| P02 검색 + 그리드 (마스터 CRUD) (`search_grid`) | 4 |
| v2 차트 + 그리드 (수직 스택) (`grid_chart_stacked`) | 2 |
| P02b 그리드 전용 (검색 없음) (`P02b_grid_only`) | 1 |
| v2 듀얼 그리드 2-stack (`v2_dual_grid`) | 1 |

---
## 화면별 상세

### 01 미분할 (단일) (18개)

#### AllocationRulePartialPlan

- 경로: `view/replenishmentplan/planningsimulation/planpolicy/AllocationRulePartialPlan.jsx`
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

#### DemandDistribution (`UI_RP_30`)

- 경로: `view/replenishmentplan/planningsimulation/demanddistribution/DemandDistribution.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### DemandOrderTracking (`UI_RP_10`)

- 경로: `view/replenishmentplan/analysisreport/demandordertracking/DemandOrderTracking.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### DemandOverview (`UI_RP_07`)

- 경로: `view/replenishmentplan/planningsimulation/demandoverview/DemandOverview.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### General

- 경로: `view/replenishmentplan/planningsimulation/planpolicy/General.jsx`
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

#### InFinitePlanningLevel

- 경로: `view/replenishmentplan/planningsimulation/planpolicy/InFinitePlanningLevel.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, PopLocatTp:1
- SP: `SP_UI_CM_15_S3_P_RT_MSG` · `SP_UI_CM_15_S7_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_15_Q11` · `engine/mp/SRV_UI_CM_15_Q10` · `engine/mp/SRV_UI_CM_15_S3`

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

- 경로: `view/replenishmentplan/master/intransitstock/InTransitStock.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### OrderCycleCalendar (`UI_RP_04`)

- 경로: `view/replenishmentplan/master/ordercyclecalendar/OrderCycleCalendar.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, WorkArea:1, BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, GridExcelExportButton:1, …
- SP: `SP_UI_IM_06_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_IM_06_Q1` · `engine/mp/SRV_UI_IM_06_S1`

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

- 경로: `view/replenishmentplan/planningsimulation/planpolicy/PlanningMethod.jsx`
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

#### PlanOption

- 경로: `view/replenishmentplan/planningsimulation/planpolicy/PlanOption.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:5
- SP: `SP_UI_CM_15_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_15_Q9` · `engine/mp/SRV_UI_CM_15_Q3` · `engine/mp/SRV_UI_CM_15_S2`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### PlanPolicy (`UI_RP_08`)

- 경로: `view/replenishmentplan/planningsimulation/planpolicy/PlanPolicy.jsx`
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

#### PlanPriority

- 경로: `view/replenishmentplan/planningsimulation/planpolicy/PlanPriority.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- SP: `SP_UI_CM_15_S3_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_15_Q5` · `engine/mp/SRV_UI_CM_15_S3`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### PlanScenario (`UI_RP_28`)

- 경로: `view/replenishmentplan/planningsimulation/planscenario/PlanScenario.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### PoList (`UI_RP_25`)

- 경로: `view/replenishmentplan/analysisreport/polist/PoList.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridSaveButton:1, GridExcelExportButton:1, InputField:2, …
- SP: `SP_UI_RP_25_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_COMM_DEFAULT_VER` · `engine/mp/GetReplenishmentOrder` · `engine/mp/SRV_UI_RP_25_S1`

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

#### ReplenishmentPolicy (`UI_RP_POLICY`)

- 경로: `view/replenishmentplan/master/replenishmentpolicy/ReplenishmentPolicy.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridSaveButton:1, GridExcelExportButton:1, InputField:1, …
- SP: `SP_UI_RP_REPLENISHMENT_POLICY_SAVE` · `SP_UI_RP_REPLENISHMENT_POLICY_SAVE_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_IM_TARGET_INV_VER_Q1` · `engine/mp/SRV_UI_RP_POLICY_Q1` · `common/json-save`

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

#### RpSimulationComparison

- 경로: `view/replenishmentplan/analysisreport/rpsimulationcomparison/RpSimulationComparison.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, InputField:4, PlanScope:1, PopKpiWeightConfig:1
- 호출: `engine/mp/SRV_COMM_SRH_VER_Q` · `engine/mp/SRV_COMM_DEFAULT_VER` · `engine/mp/SRV_UI_RP_SIMUL_COMPARE`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### RpTarget (`UI_RP_01`)

- 경로: `view/replenishmentplan/master/rptarget/RpTarget.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridSaveButton:1, GridExcelExportButton:1, PlanScope:1
- SP: `SP_UI_IM_04_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_IM_04_Q1` · `engine/mp/SRV_UI_IM_04_S1`

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

#### WarehouseStock

- 경로: `view/replenishmentplan/master/warehousestock/WarehouseStock.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

### 11 상하 2분할 (3개)

#### RpComparative (`UI_RP_14`)

- 경로: `view/replenishmentplan/analysisreport/rpcomparative/RpComparative.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=3 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:3, GridExcelExportButton:1, InputField:6, …
- 호출: `engine/mp/SRV_COMM_DEFAULT_VER` · `engine/mp/GetRPComparativeAnalysis`

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

#### RpResult (`UI_RP_15`)

- 경로: `view/replenishmentplan/analysisreport/rpresult/RpResult.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, GridSaveButton:1, GridExcelExportButton:1, …
- SP: `SP_UI_RP_15_S1_P_RT_MSG`
- 호출: `engine/mp/GetRPSimulationAnalysis` · `engine/mp/SRV_UI_CM_17_Q5` · `engine/mp/SRV_UI_CM_17_Q6`

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

#### RPSimulation (`UI_RP_09`)

- 경로: `view/replenishmentplan/planningsimulation/rpsimulation/RPSimulation.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, InputField:6, PlanScope:1
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

### — 팝업 (8개)

#### PopExceptionSchedule

- 경로: `view/replenishmentplan/master/ordercyclecalendar/PopExceptionSchedule.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, PopupDialog:1
- SP: `SP_UI_IM_06_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_IM_06_Q4` · `engine/mp/SRV_UI_IM_06_S2`

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

#### PopMonthlyExceptionSchedule

- 경로: `view/replenishmentplan/master/ordercyclecalendar/PopMonthlyExceptionSchedule.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, PopupDialog:1
- SP: `SP_UI_IM_06_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_IM_06_Q4` · `engine/mp/SRV_UI_IM_06_S2`

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

#### PopOrderCycleCalendar

- 경로: `view/replenishmentplan/master/ordercyclecalendar/PopOrderCycleCalendar.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, InputField:8, PopupDialog:1
- SP: `SP_UI_IM_06_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_IM_06_Q2` · `engine/mp/SRV_UI_IM_06_Q3` · `engine/mp/SRV_UI_IM_06_S1`

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

#### PopOrderCycleCalendarNew

- 경로: `view/replenishmentplan/master/ordercyclecalendar/PopOrderCycleCalendarNew.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, TabContainer:1, InputField:4, PopupDialog:1
- SP: `SP_UI_IM_06_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_IM_06_Q3` · `engine/mp/SRV_UI_IM_06_S1`

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

#### PopReplenishmentPolicyBatchUpdate

- 경로: `view/replenishmentplan/master/replenishmentpolicy/PopReplenishmentPolicyBatchUpdate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:2, PopupDialog:1
- SP: `SP_UI_RP_REPLSH_STRATEGY_BATCH_UPDATE_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_RP_POLICY_BATCH_UPDATE`

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

#### PopReplenishmentPolicyCreate

- 경로: `view/replenishmentplan/master/replenishmentpolicy/PopReplenishmentPolicyCreate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:1, PopupDialog:1
- SP: `SP_UI_RP_REPLSH_STRATEGY_BATCH_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_RP_POLICY_BATCH_CREATE`

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

- 경로: `view/replenishmentplan/planningsimulation/planpolicy/PopSelectLocation.jsx`
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

#### PopWarehouseStock

- 경로: `view/replenishmentplan/master/warehousestock/PopWarehouseStock.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_IM_12_Q2`

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

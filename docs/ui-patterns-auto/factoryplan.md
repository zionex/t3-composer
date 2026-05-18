# factoryplan 모듈 — UI 패턴 카탈로그

> Phase 1 자동 분류 결과 (생성: `ui-patterns-gen.cjs`). 정정·보강 환영.

## 요약

| 항목 | 값 |
|---|---:|
| 총 화면 | 200 |
| 등록 메뉴 (UI_*) | 25 |
| 위젯 | 49 |
| 팝업 | 3 |
| Base 래퍼 | 0 |
| Sub-component | 14 |

### 레이아웃 카테고리 분포

| 카테고리 | 화면 수 |
|---|---:|
| 01 미분할 (단일) | 118 |
| 11 상하 2분할 | 4 |
| 12 상하 3분할 | 1 |
| 93 Monitoring | 1 |
| 95 RouteLayout | 10 |
| — 팝업 | 3 |
| — 위젯 | 49 |
| — 서브컴포넌트 | 14 |

### 패턴 분포 (상위 10)

| 패턴 | 화면 수 |
|---|---:|
| P02b 그리드 전용 (검색 없음) (`P02b_grid_only`) | 34 |
| 비표준 / 자유 폼 (`free_form`) | 23 |
| 위젯 (자유) (`widget_misc`) | 22 |
| P02 검색 + 그리드 (마스터 CRUD) (`search_grid`) | 20 |
| P09 차트 단독 (`P09_chart_view`) | 17 |
| 위젯 (그리드) (`widget_grid`) | 17 |
| 서브 컴포넌트 (`subcomponent`) | 14 |
| RL 라우트 레이아웃 (FLO) (`rl_layout_design`) | 10 |
| P01 위젯 대시보드 (`widget_dashboard`) | 10 |
| 위젯 (차트) (`widget_chart`) | 10 |

---
## 화면별 상세

### 01 미분할 (단일) (118개)

#### AdjustDetailTab

- 경로: `view/factoryplan/simulation/adjustmentgantt/adjustmentUtils/tabs/AdjustDetailTab.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:8

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### AdjustmentGantt

- 경로: `view/factoryplan/simulation/adjustmentgantt/AdjustmentGantt.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, TabContainer:1, GanttChart:1, InputField:3
- 호출: `factoryplan/adjustment/alt-resources` · `factoryplan/resources` · `factoryplan/adjustment/gantt/activities`

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

#### AdjustmentGrid2

- 경로: `view/factoryplan/simulation/adjustmentgrid2/AdjustmentGrid2.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridExcelExportButton:1
- 호출: `factoryplan/adjustment/grid2`

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

#### AdjustmentGrid3

- 경로: `view/factoryplan/simulation/adjustmentgrid3/AdjustmentGrid3.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, TabContainer:1, GridExcelExportButton:1, InputField:2
- 호출: `factoryplan/adjustment/alt-resources` · `factoryplan/analysis/resource-gantt/activity/detail` · `factoryplan/adjustment/grid3`

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

#### AdjustQtyPopup

- 경로: `view/factoryplan/simulation/adjustmentgrid3/AdjustQtyPopup.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:5, PopupDialog:1

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### AdjustResourcePlanDetailTab

- 경로: `view/factoryplan/simulation/adjustmentgantt/adjustmentUtils/tabs/AdjustResourcePlanDetailTab.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### Bom (`UI_FP_BOM`)

- 경로: `view/factoryplan/master/bom/Bom.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, TreeGrid:1, TabContainer:1, InputField:2, …
- 호출: `factoryplan/items` · `common/codes`

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

#### Bor (`UI_FP_BOR`)

- 경로: `view/factoryplan/master/bor/Bor.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, TabContainer:1, PlanScope:1

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

#### BorTab

- 경로: `view/factoryplan/master/bor/BorTab.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, GridExcelExportButton:1
- 호출: `factoryplan/master/bor/bors` · `factoryplan/master/bor/bors/save`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### Byproduct

- 경로: `view/factoryplan/master/byproduct/Byproduct.jsx`
- 패턴: **P04 트리 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TreeGrid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, TreeGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, …
- 호출: `factoryplan/master/byproduct/byproducts`

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

#### CalendarCopyPopup

- 경로: `view/factoryplan/master/resourcecalendar/CalendarCopyPopup.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `factoryplan/master/resource/resources` · `factoryplan/master/resource-calendar/copy`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### CalendarCopyPopup

- 경로: `view/factoryplan/master/resourcedowntime/CalendarCopyPopup.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `factoryplan/master/resource/resources` · `/factoryplan/master/resource-downtime/copy`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### CustomComponent

- 경로: `view/factoryplan/master/resourcecalendar/CustomComponent.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### CustomComponent

- 경로: `view/factoryplan/master/resourcedowntime/CustomComponent.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### CustomerMasterPopup

- 경로: `view/factoryplan/master/order/CustomerMasterPopup.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, PopupDialog:1
- 호출: `factoryplan/customers` · `factoryplan/master/order/customers/save`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### CustomerPopup

- 경로: `view/factoryplan/common/popup/CustomerPopup.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `factoryplan/customers`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### DeliveryDelayStatus

- 경로: `view/factoryplan/analysis/planproblem/details/DeliveryDelayStatus.jsx`
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

#### DeliveryShortStatus

- 경로: `view/factoryplan/analysis/planproblem/details/DeliveryShortStatus.jsx`
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

#### DeliveryStatus

- 경로: `view/factoryplan/analysis/deliverystatus/DeliveryStatus.jsx`
- 패턴: **P04 트리 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TreeGrid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, TreeGrid:1, GridExcelExportButton:1, InputField:1
- 호출: `factoryplan/analysis/delivery-status`

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

#### DeliveryStatusSummary

- 경로: `view/factoryplan/analysis/planproblem/details/DeliveryStatusSummary.jsx`
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

#### DemandPopup

- 경로: `view/factoryplan/common/popup/DemandPopup.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `factoryplan/demands`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### DemandTab

- 경로: `view/factoryplan/master/order/DemandTab.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, GridExcelExportButton:1
- 호출: `factoryplan/master/order/demands` · `factoryplan/master/order/demands/save`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### DetailGrid

- 경로: `view/factoryplan/analysis/stockresult/grid/DetailGrid.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, GridExcelExportButton:1
- 호출: `factoryplan/analysis/stock-result/stock-outputs/consumption`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### DispatchList

- 경로: `view/factoryplan/analysis/dispatchlist/DispatchList.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridExcelExportButton:1
- 호출: `factoryplan/analysis/dispatch-list`

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

#### EditEventDialog

- 경로: `view/factoryplan/master/resourcecalendar/EditEventDialog.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### EditEventDialog

- 경로: `view/factoryplan/master/resourcedowntime/EditEventDialog.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### EngineRun

- 경로: `view/factoryplan/common/drawer/EngineRun.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### FpVersusPerformance

- 경로: `view/factoryplan/dashboard/fpversusperformance/FpVersusPerformance.jsx`
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

#### InoutStatus

- 경로: `view/factoryplan/analysis/inoutstatus/InoutStatus.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1
- 호출: `factoryplan/analysis/inout-status`

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

#### InoutStatusChart

- 경로: `view/factoryplan/analysis/inoutstatus/InoutStatusChart.jsx`
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

#### InOutStatusDashboard

- 경로: `view/factoryplan/dashboard/inoutstatusdashboard/InOutStatusDashboard.jsx`
- 패턴: **P01 위젯 대시보드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: DashboardPanel=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, DashboardPanel:1, InputField:1, PlanScope:1
- 호출: `factoryplan/dashboard/inout-status/route-grp/target-actl` · `factoryplan/dashboard/inout-status/shipment-status` · `factoryplan/dashboard/inout-status`

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

#### InOutStatusDetailDashboard

- 경로: `view/factoryplan/dashboard/inoutstatusdetaildashboard/InOutStatusDetailDashboard.jsx`
- 패턴: **P01 위젯 대시보드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: DashboardPanel=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, DashboardPanel:1, InputField:1, PlanScope:1
- 호출: `factoryplan/dashboard/inout-status-detail/output-status` · `factoryplan/dashboard/inout-status-detail/input-status` · `factoryplan/dashboard/inout-status-detail/input-trend`

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

#### InputOrderBoard

- 경로: `view/factoryplan/dashboard/inputorderboard/InputOrderBoard.jsx`
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

#### insightPlanProblem

- 경로: `view/factoryplan/insight/simulation/planproblem/insightPlanProblem.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### insightSimulationCompare

- 경로: `view/factoryplan/insight/simulation/simulationcompare/insightSimulationCompare.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### InventoryPopup

- 경로: `view/factoryplan/common/popup/InventoryPopup.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `factoryplan/inventories`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### InventoryTab

- 경로: `view/factoryplan/master/item/InventoryTab.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, GridExcelExportButton:1
- 호출: `factoryplan/master/item/inventories`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### Item (`UI_FP_ITEM`)

- 경로: `view/factoryplan/master/item/Item.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, TabContainer:1, PlanScope:1

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

#### ItemGroupJobChangeTab

- 경로: `view/factoryplan/master/jobchangetime/ItemGroupJobChangeTab.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, GridExcelExportButton:1
- 호출: `factoryplan/master/jobchange/jctimeitemgroups` · `factoryplan/master/jobchange/jctimeitemgroups/save`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### ItemGroupMasterPopup

- 경로: `view/factoryplan/master/item/ItemGroupMasterPopup.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, PopupDialog:1
- 호출: `factoryplan/master/item/itemgroups`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### ItemGroupPopup

- 경로: `view/factoryplan/common/popup/ItemGroupPopup.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `factoryplan/itemGroups`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### ItemJobChangeTab

- 경로: `view/factoryplan/master/jobchangetime/ItemJobChangeTab.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, GridExcelExportButton:1
- 호출: `factoryplan/master/jobchange/jctimeitems` · `factoryplan/master/jobchange/jctimeitems/save`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### ItemLeadTime (`UI_FP_ITEM_LEAD_TIME`)

- 경로: `view/factoryplan/analysis/itemleadtime/ItemLeadTime.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, InputField:3
- 호출: `factoryplan/analysis/item-lead-time`

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

#### ItemLeadTimeChart

- 경로: `view/factoryplan/analysis/itemleadtime/ItemLeadTimeChart.jsx`
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

#### ItemPopup

- 경로: `view/factoryplan/common/popup/ItemPopup.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `factoryplan/items`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### ItemTab

- 경로: `view/factoryplan/master/item/ItemTab.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, GridExcelExportButton:1
- 호출: `factoryplan/master/item/items`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### JobChangeTime (`UI_FP_JC_TIME`)

- 경로: `view/factoryplan/master/jobchangetime/JobChangeTime.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, TabContainer:1, PlanScope:1

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

#### JobChangeTimeInfo (`UI_FP_JC_TIME_INFO`)

- 경로: `view/factoryplan/analysis/jobchangetimeinfo/JobChangeTimeInfo.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1
- 호출: `factoryplan/analysis/job-change-time`

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

#### JobChangeTimeInfoChart

- 경로: `view/factoryplan/analysis/jobchangetimeinfo/JobChangeTimeInfoChart.jsx`
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

#### LeadTime

- 경로: `view/factoryplan/simulation/simulationkpi/details/LeadTime.jsx`
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

#### MainGrid

- 경로: `view/factoryplan/analysis/stockresult/grid/MainGrid.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, GridExcelExportButton:1
- 호출: `factoryplan/analysis/stock-result/stock-outputs/supply`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### MaterialPsi (`UI_FP_MATERIAL_PSI`)

- 경로: `view/factoryplan/analysis/materialpsi/MaterialPsi.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1
- 호출: `factoryplan/analysis/mrp/psi`

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

#### MaterialPsiChart

- 경로: `view/factoryplan/analysis/materialpsi/MaterialPsiChart.jsx`
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

#### OnTimeRate

- 경로: `view/factoryplan/simulation/simulationkpi/details/OnTimeRate.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### Order (`UI_FP_ORDER`)

- 경로: `view/factoryplan/master/order/Order.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, TabContainer:1, PlanScope:1

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

#### OrderGantt (`UI_FP_GANTT_ORDER`)

- 경로: `view/factoryplan/analysis/ordergantt/OrderGantt.jsx`
- 패턴: **간트 단독** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: GanttChart=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, GanttChart:1, InputField:2
- 호출: `factoryplan/analysis/order-gantt/activities` · `common/search-option/data`

```
┌──────────────────────────────┐
│ Gantt View                   │
├──────────────────────────────┤
│ ▓▓▓░░░░░░░░░░░░░░░░░         │
│ ░░▓▓▓▓▓░░░░░░░░░░░░          │
│ ░░░░░░▓▓▓▓░░░░░░░░░          │
└──────────────────────────────┘
```

#### OrderPopup

- 경로: `view/factoryplan/common/popup/OrderPopup.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `factoryplan/orders`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### OrderTracking (`UI_FP_ORDER_TRACKING`)

- 경로: `view/factoryplan/analysis/ordertracking/OrderTracking.jsx`
- 패턴: **P04 트리 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TreeGrid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, TreeGrid:1
- 호출: `factoryplan/analysis/order-tracking/orders`

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

#### OrderTypeMasterPopup

- 경로: `view/factoryplan/master/order/OrderTypeMasterPopup.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, PopupDialog:1
- 호출: `factoryplan/ordertypes` · `factoryplan/master/order/ordertypes/save`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### OrderTypePopup

- 경로: `view/factoryplan/common/popup/OrderTypePopup.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `factoryplan/ordertypes`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### PlanAgainstPrfmDashboard

- 경로: `view/factoryplan/dashboard/planagainstprfmdashboard/PlanAgainstPrfmDashboard.jsx`
- 패턴: **P01 위젯 대시보드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: DashboardPanel=1
- 컴포넌트: ContentInner:1, DashboardPanel:1
- 호출: `factoryplan/dashboard/plan-against-prfm/stack` · `factoryplan/dashboard/plan-against-prfm/prod-prbm-item-grp-circular` · `factoryplan/dashboard/plan-against-prfm/prod-prbm-item-grp-stack`

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

#### PlanAgainstPrfmDetailDashboard

- 경로: `view/factoryplan/dashboard/planagainstprfmdetaildashboard/PlanAgainstPrfmDetailDashboard.jsx`
- 패턴: **P01 위젯 대시보드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: DashboardPanel=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, DashboardPanel:1, InputField:1
- 호출: `factoryplan/dashboard/plan-against-prfm-detail`

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

#### PlanDetail

- 경로: `view/factoryplan/analysis/plandetail/PlanDetail.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridExcelExportButton:1
- 호출: `factoryplan/analysis/fp-plan-detail`

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

#### PlanProblem (`UI_FP_PLAN_PROBLEM`)

- 경로: `view/factoryplan/analysis/planproblem/PlanProblem.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1

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

#### PlanProblemDashboard

- 경로: `view/factoryplan/dashboard/planproblemdashboard/PlanProblemDashboard.jsx`
- 패턴: **P01 위젯 대시보드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: DashboardPanel=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, DashboardPanel:1

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

#### PlanResult (`UI_FP_PLAN_RESULT`)

- 경로: `view/factoryplan/analysis/planresult/PlanResult.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1
- 호출: `factoryplan/analysis/plan-result`

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

#### PlanResultChart

- 경로: `view/factoryplan/analysis/planresult/PlanResultChart.jsx`
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

#### ProdCustomer

- 경로: `view/factoryplan/analysis/prodcustomer/ProdCustomer.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1
- 호출: `factoryplan/analysis/plan-production`

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

#### ProdCustomerChart

- 경로: `view/factoryplan/analysis/prodcustomer/ProdCustomerChart.jsx`
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

#### ProdDisruptionChart

- 경로: `view/factoryplan/simulation/proddisruptionmonitoring/ProdDisruptionChart.jsx`
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

#### ProdSalesStockStatus

- 경로: `view/factoryplan/analysis/prodsalesstockstatus/ProdSalesStockStatus.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, InputField:1
- 호출: `factoryplan/analysis/prod-sales-stock-status`

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

#### ProdSalesStockStatusChart

- 경로: `view/factoryplan/analysis/prodsalesstockstatus/ProdSalesStockStatusChart.jsx`
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

#### ProductionPerformance

- 경로: `view/factoryplan/dashboard/productionperformance/ProductionPerformance.jsx`
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

#### PsiDetail

- 경로: `view/factoryplan/analysis/psidetail/PsiDetail.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, InputField:1
- 호출: `factoryplan/analysis/prod-sales-stock-status/detail`

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

#### PsiDetailChart

- 경로: `view/factoryplan/analysis/psidetail/PsiDetailChart.jsx`
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

#### PsiTab

- 경로: `view/factoryplan/simulation/adjustmentgrid3/PsiTab.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1
- 호출: `factoryplan/analysis/prod-sales-stock-status`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### Resource (`UI_FP_RESOURCE`)

- 경로: `view/factoryplan/master/resource/Resource.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- 호출: `factoryplan/master/resource/resources`

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

#### ResourceCalendar (`UI_FP_RESOURCE_CALENDAR`)

- 경로: `view/factoryplan/master/resourcecalendar/ResourceCalendar.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, InputField:1, PlanScope:1
- 호출: `factoryplan/master/resource/resources` · `factoryplan/master/resource-calendar/events` · `factoryplan/master/resource-calendar/events/delete`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### ResourceDownTime

- 경로: `view/factoryplan/master/resourcedowntime/ResourceDownTime.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, TabContainer:1, InputField:4, PlanScope:1
- 호출: `factoryplan/master/resource/resources`

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

#### ResourceDownTimeCalendarTab

- 경로: `view/factoryplan/master/resourcedowntime/ResourceDownTimeCalendarTab.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 호출: `factoryplan/master/resource-downtime` · `/factoryplan/master/resource-downtime/delete` · `/factoryplan/master/resource-downtime/save`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### ResourceDownTimeMasterTab

- 경로: `view/factoryplan/master/resourcedowntime/ResourceDownTimeMasterTab.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, GridExcelExportButton:1
- 호출: `factoryplan/master/resource-downtime` · `/factoryplan/master/resource-downtime/import`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### ResourceGantt (`UI_FP_GANTT_RESOURCE`)

- 경로: `view/factoryplan/analysis/resourcegantt/ResourceGantt.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, TabContainer:1, GanttChart:1, InputField:1
- 호출: `factoryplan/analysis/resource-gantt/activity-relations` · `factoryplan/analysis/resource-gantt/short-activities` · `factoryplan/analysis/resource-gantt/activities`

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

#### ResourceJobChangeTab

- 경로: `view/factoryplan/master/jobchangetime/ResourceJobChangeTab.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, GridCnt:1, GridSaveButton:1, GridExcelExportButton:1
- 호출: `factoryplan/master/jobchange/resources` · `factoryplan/master/jobchange/resources/save`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### ResourcePlanDetailTab

- 경로: `view/factoryplan/analysis/resourcegantt/tabs/ResourcePlanDetailTab.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### ResourcePopup

- 경로: `view/factoryplan/common/popup/ResourcePopup.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `factoryplan/resources`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### ResourceRouteGroupPopup

- 경로: `view/factoryplan/common/popup/ResourceRouteGroupPopup.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `factoryplan/routegroups`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### ResourceRoutePopup

- 경로: `view/factoryplan/common/popup/ResourceRoutePopup.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `factoryplan/bors`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### ResourceUtilization (`UI_FP_RESRC_UTILIZATION`)

- 경로: `view/factoryplan/analysis/resourceutilization/ResourceUtilization.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1
- 호출: `factoryplan/analysis/resource-utilization/utilization`

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

#### ResProdPlan

- 경로: `view/factoryplan/analysis/resprodplan/ResProdPlan.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridExcelExportButton:1
- 호출: `factoryplan/analysis/res-prod-plan/grid` · `factoryplan/analysis/res-prod-plan/item-chart` · `factoryplan/analysis/res-prod-plan/res-chart`

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

#### ResProdPlanChart

- 경로: `view/factoryplan/analysis/resprodplan/ResProdPlanChart.jsx`
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

#### ScenarioComparePanel

- 경로: `view/factoryplan/simulation/simulationcompare/ScenarioComparePanel.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### ScenarioScriptPopup

- 경로: `view/factoryplan/simulation/simulationscenario/ScenarioScriptPopup.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: PopupDialog:1

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### ShortageDetailTab

- 경로: `view/factoryplan/analysis/resourcegantt/tabs/ShortageDetailTab.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### Simulation (`UI_FP_SIMULATION`)

- 경로: `view/factoryplan/simulation/simulation/Simulation.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, PlanScope:1

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### SimulationCompare (`UI_FP_SIMUL_COMPARE`)

- 경로: `view/factoryplan/simulation/simulationcompare/SimulationCompare.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, InputField:1, PlanScope:1, PopKpiWeightConfig:1
- 호출: `factoryplan/versions/plan-dts` · `factoryplan/simulation/simulation-compare/versions` · `factoryplan/simulation/simulation-compare/confirm`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### SimulationDetails

- 경로: `view/factoryplan/simulation/simulation/details/SimulationDetails.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1
- 호출: `factoryplan/simulation/is-engine-running` · `factoryplan/plan-policy` · `factoryplan/simulation/simulation/details`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### SimulationHistory

- 경로: `view/factoryplan/simulation/simulation/details/SimulationHistory.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### SimulationKPIDashboard

- 경로: `view/factoryplan/dashboard/simulationkpidashboard/SimulationKPIDashboard.jsx`
- 패턴: **P01 위젯 대시보드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: DashboardPanel=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, DashboardPanel:1
- 호출: `factoryplan/simulation/simulation-kpi/ful-fill-rate` · `factoryplan/simulation/simulation-kpi/on-time-rate` · `factoryplan/simulation/simulation-kpi/lead-time`

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

#### SimulationOptionPopup

- 경로: `view/factoryplan/simulation/simulation/SimulationOptionPopup.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:2, PopupDialog:1
- 호출: `factoryplan/simulation/simulation/plan-versions/options`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### SimulationScenario (`UI_FP_SIMUL_SCENARIO`)

- 경로: `view/factoryplan/simulation/simulationscenario/SimulationScenario.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, InputField:2, PlanScope:1
- 호출: `factoryplan/plan-policy` · `factoryplan/plan-policy-detail` · `factoryplan/simulation/simulation-scenario/policy-dtls`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### SimulationStep (`UI_FP_SIMUL_STEP`)

- 경로: `view/factoryplan/simulation/simulationstep/SimulationStep.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridAddRowButton:1, PlanScope:1
- 호출: `factoryplan/plan-steps` · `factoryplan/simulation/simulation-step/step-seqs` · `factoryplan/simulation/simulation-step/step-seqs/save`

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

#### StagePopup

- 경로: `view/factoryplan/common/popup/StagePopup.jsx`
- 패턴: **P04 트리 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TreeGrid=1
- 컴포넌트: TreeGrid:1, PopupDialog:1
- 호출: `factoryplan/stages-tree`

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

#### Stock (`UI_FP_STOCK`)

- 경로: `view/factoryplan/master/stock/Stock.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- 호출: `factoryplan/master/stock/stocks` · `factoryplan/master/stock/stocks/save`

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

#### StockResult (`UI_FP_STOCK_RESULT`)

- 경로: `view/factoryplan/analysis/stockresult/StockResult.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, InputField:1

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### ToolSupplyTabChart

- 경로: `view/factoryplan/master/bor/ToolSupplyTabChart.jsx`
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

#### UrgencyOrder

- 경로: `view/factoryplan/common/drawer/UrgencyOrder.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### UtilizationChart

- 경로: `view/factoryplan/analysis/resourceutilization/UtilizationChart.jsx`
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

#### Validation (`UI_FP_VALIDATION`)

- 경로: `view/factoryplan/master/validation/Validation.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, InputField:1, PlanScope:1
- 호출: `factoryplan/master/validation/validations` · `common/codes`

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

#### ValidationAccordion

- 경로: `view/factoryplan/master/validation/ValidationAccordion.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### VersionCreation

- 경로: `view/factoryplan/simulation/simulation/details/VersionCreation.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:4
- 호출: `factoryplan/simulation/simulation/main-versions/default` · `factoryplan/plan-steps` · `factoryplan/simulation/simulation/main-versions`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### VersionGroupInputField

- 경로: `view/factoryplan/simulation/simulationcompare/VersionGroupInputField.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:1

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### Wip (`UI_FP_WIP`)

- 경로: `view/factoryplan/master/wip/Wip.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- 호출: `factoryplan/master/wip/wips` · `factoryplan/master/wip/wips/save`

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

#### WipEohOutDashboard

- 경로: `view/factoryplan/dashboard/wipeohoutdashboard/WipEohOutDashboard.jsx`
- 패턴: **P01 위젯 대시보드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: DashboardPanel=1
- 컴포넌트: ContentInner:1, DashboardPanel:1
- 호출: `factoryplan/dashboard/wip-eoh-out/route-output` · `factoryplan/dashboard/wip-eoh-out/route-wip`

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

#### WipLocationPopup

- 경로: `view/factoryplan/common/popup/WipLocationPopup.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `factoryplan/bors`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### WipProfile

- 경로: `view/factoryplan/analysis/wipprofile/WipProfile.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1
- 호출: `factoryplan/analysis/wip-profile`

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

#### WipProfileChart

- 경로: `view/factoryplan/analysis/wipprofile/WipProfileChart.jsx`
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

#### WorkOrderPopup

- 경로: `view/factoryplan/common/popup/WorkOrderPopup.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `factoryplan/work-orders`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### WorkOrderTab

- 경로: `view/factoryplan/master/order/WorkOrderTab.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, GridExcelExportButton:1
- 호출: `factoryplan/master/order/workorders` · `factoryplan/master/order/workorders/save`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### 11 상하 2분할 (4개)

#### AdjustmentGrid1

- 경로: `view/factoryplan/simulation/adjustmentgrid1/AdjustmentGrid1.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridSaveButton:2, InputField:3
- 호출: `factoryplan/master/resource/resources` · `factoryplan/adjustment/grid1`

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

#### FpConfiguration

- 경로: `view/factoryplan/master/fpconfiguration/FpConfiguration.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, …
- 호출: `factoryplan/master/fpconfig-grp` · `factoryplan/master/fpconfig-codes` · `common/setting/fpconfig-save`

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

#### ToolSettingTab

- 경로: `view/factoryplan/master/bor/ToolSettingTab.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: BaseGrid:2, GridDeleteRowButton:1, GridSaveButton:1
- 호출: `factoryplan/master/bor/borsettools` · `factoryplan/master/resource/resources` · `factoryplan/master/bor/borsettools/save`

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

#### ToolSupplyTab

- 경로: `view/factoryplan/master/bor/ToolSupplyTab.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: BaseGrid:2, GridAddRowButton:1
- 호출: `factoryplan/master/resource/resources` · `factoryplan/master/bor/toolsupplies` · `factoryplan/master/bor/toolsupplies/delete`

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

#### BorSetTab

- 경로: `view/factoryplan/master/bor/BorSetTab.jsx`
- 패턴: **v3 멀티 그리드 3-stack** (LAYOUT_V3) · confidence: **mid**
- 추정 근거: 3 BaseGrid no SplitPanel
- 컴포넌트: BaseGrid:3, GridDeleteRowButton:1, InputField:1
- 호출: `factoryplan/master/bor/bors` · `factoryplan/master/bor/borsets` · `factoryplan/master/bor/borsets/save`

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

### 93 Monitoring (1개)

#### ProdDisruptionMonitoring

- 경로: `view/factoryplan/simulation/proddisruptionmonitoring/ProdDisruptionMonitoring.jsx`
- 패턴: **MN 그리드 알람** (LAYOUT_MONITORING) · confidence: **high**
- 추정 근거: monitoring match · chart=0 grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridSaveButton:1, InputField:1
- 호출: `factoryplan/analysis/prod-disruption-monitoring/chart` · `factoryplan/analysis/prod-disruption-monitoring/grid`

```
┌──────────────────────────────┐
│ Monitoring filters           │
├──────────────────────────────┤
│ ⚠ Alert grid (status colors) │
│ ● Critical 5                 │
│ ◆ Warning  12                │
└──────────────────────────────┘
```

### 95 RouteLayout (10개)

#### BomDiagram

- 경로: `view/factoryplan/master/bom/BomDiagram.jsx`
- 패턴: **RL 라우트 레이아웃 (FLO)** (LAYOUT_ROUTELAYOUT) · confidence: **high**
- 추정 근거: route keyword · flo=1
- 컴포넌트: FLODiagram:1

```
┌──────────────────────────────┐
│ Route Layout (FLODiagram)    │
├──────────────────────────────┤
│ [A]──▶[B]──▶[C]              │
│         │     ▼              │
│         └──▶[D]──▶[E]        │
└──────────────────────────────┘
```

#### ByproductDiagram

- 경로: `view/factoryplan/master/byproduct/ByproductDiagram.jsx`
- 패턴: **RL 라우트 레이아웃 (FLO)** (LAYOUT_ROUTELAYOUT) · confidence: **high**
- 추정 근거: route keyword · flo=1
- 컴포넌트: FLODiagram:1
- 호출: `factoryplan/master/byproduct/byproducts/route-flo`

```
┌──────────────────────────────┐
│ Route Layout (FLODiagram)    │
├──────────────────────────────┤
│ [A]──▶[B]──▶[C]              │
│         │     ▼              │
│         └──▶[D]──▶[E]        │
└──────────────────────────────┘
```

#### Flo

- 경로: `view/factoryplan/master/flo/Flo.jsx`
- 패턴: **RL 라우트 레이아웃 (FLO)** (LAYOUT_ROUTELAYOUT) · confidence: **high**
- 추정 근거: route keyword · flo=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, FLODiagram:1, InputField:1, PlanScope:1
- 호출: `factoryplan/master/bom/flo`

```
┌──────────────────────────────┐
│ Route Layout (FLODiagram)    │
├──────────────────────────────┤
│ [A]──▶[B]──▶[C]              │
│         │     ▼              │
│         └──▶[D]──▶[E]        │
└──────────────────────────────┘
```

#### OrderTrackingDiagram

- 경로: `view/factoryplan/analysis/ordertracking/OrderTrackingDiagram.jsx`
- 패턴: **RL 라우트 레이아웃 (FLO)** (LAYOUT_ROUTELAYOUT) · confidence: **high**
- 추정 근거: route keyword · flo=1
- 컴포넌트: FLODiagram:1

```
┌──────────────────────────────┐
│ Route Layout (FLODiagram)    │
├──────────────────────────────┤
│ [A]──▶[B]──▶[C]              │
│         │     ▼              │
│         └──▶[D]──▶[E]        │
└──────────────────────────────┘
```

#### Route (`UI_FP_ROUTE`)

- 경로: `view/factoryplan/master/route/Route.jsx`
- 패턴: **RL 라우트 레이아웃 (FLO)** (LAYOUT_ROUTELAYOUT) · confidence: **mid**
- 추정 근거: route keyword · flo=0
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- 호출: `factoryplan/master/route/routes` · `factoryplan/master/route/routes/save`

```
┌──────────────────────────────┐
│ Route Layout (FLODiagram)    │
├──────────────────────────────┤
│ [A]──▶[B]──▶[C]              │
│         │     ▼              │
│         └──▶[D]──▶[E]        │
└──────────────────────────────┘
```

#### RouteGroupJobChangeTab

- 경로: `view/factoryplan/master/jobchangetime/RouteGroupJobChangeTab.jsx`
- 패턴: **RL 라우트 레이아웃 (FLO)** (LAYOUT_ROUTELAYOUT) · confidence: **mid**
- 추정 근거: route keyword · flo=0
- 컴포넌트: BaseGrid:1, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, GridExcelExportButton:1
- 호출: `factoryplan/master/jobchange/jctimegroups` · `factoryplan/master/jobchange/jctimegroups/save`

```
┌──────────────────────────────┐
│ Route Layout (FLODiagram)    │
├──────────────────────────────┤
│ [A]──▶[B]──▶[C]              │
│         │     ▼              │
│         └──▶[D]──▶[E]        │
└──────────────────────────────┘
```

#### RouteGroupMasterPopup

- 경로: `view/factoryplan/master/route/RouteGroupMasterPopup.jsx`
- 패턴: **RL 라우트 레이아웃 (FLO)** (LAYOUT_ROUTELAYOUT) · confidence: **mid**
- 추정 근거: route keyword · flo=0
- 컴포넌트: BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, PopupDialog:1
- 호출: `factoryplan/master/route/routegroups` · `factoryplan/master/route/routegroups/save`

```
┌──────────────────────────────┐
│ Route Layout (FLODiagram)    │
├──────────────────────────────┤
│ [A]──▶[B]──▶[C]              │
│         │     ▼              │
│         └──▶[D]──▶[E]        │
└──────────────────────────────┘
```

#### RouteGroupPopup

- 경로: `view/factoryplan/common/popup/RouteGroupPopup.jsx`
- 패턴: **RL 라우트 레이아웃 (FLO)** (LAYOUT_ROUTELAYOUT) · confidence: **mid**
- 추정 근거: route keyword · flo=0
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `factoryplan/routegroups`

```
┌──────────────────────────────┐
│ Route Layout (FLODiagram)    │
├──────────────────────────────┤
│ [A]──▶[B]──▶[C]              │
│         │     ▼              │
│         └──▶[D]──▶[E]        │
└──────────────────────────────┘
```

#### RouteJobChangeTab

- 경로: `view/factoryplan/master/jobchangetime/RouteJobChangeTab.jsx`
- 패턴: **RL 라우트 레이아웃 (FLO)** (LAYOUT_ROUTELAYOUT) · confidence: **mid**
- 추정 근거: route keyword · flo=0
- 컴포넌트: BaseGrid:1, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, GridExcelExportButton:1
- 호출: `factoryplan/master/jobchange/jctimes` · `factoryplan/master/jobchange/jctimes/save`

```
┌──────────────────────────────┐
│ Route Layout (FLODiagram)    │
├──────────────────────────────┤
│ [A]──▶[B]──▶[C]              │
│         │     ▼              │
│         └──▶[D]──▶[E]        │
└──────────────────────────────┘
```

#### RoutePopup

- 경로: `view/factoryplan/common/popup/RoutePopup.jsx`
- 패턴: **RL 라우트 레이아웃 (FLO)** (LAYOUT_ROUTELAYOUT) · confidence: **mid**
- 추정 근거: route keyword · flo=0
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `factoryplan/producingroutes`

```
┌──────────────────────────────┐
│ Route Layout (FLODiagram)    │
├──────────────────────────────┤
│ [A]──▶[B]──▶[C]              │
│         │     ▼              │
│         └──▶[D]──▶[E]        │
└──────────────────────────────┘
```

### — 팝업 (3개)

#### PopFpInsightFeature

- 경로: `view/factoryplan/insight/common/popup/PopFpInsightFeature.jsx`
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

#### PopGeneralConfig

- 경로: `view/factoryplan/common/popup/PopGeneralConfig.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=2
- 컴포넌트: BaseGrid:2, GridSaveButton:1, InputField:1, PopupDialog:1
- 호출: `common/search-option/save` · `common/search-option/group` · `common/search-option/srh-options`

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

#### PopPlanScope

- 경로: `view/factoryplan/common/popup/PopPlanScope.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, WorkArea:1, BaseGrid:1, InputField:4, PopupDialog:1

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

### — 위젯 (49개)

#### DailyProductionPerformanceByProduct

- 경로: `view/factoryplan/widgets/dailyproductionperformancebyproduct/DailyProductionPerformanceByProduct.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_FP_DASHBOARD`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### factoryStock

- 경로: `view/factoryplan/widgets/factorystock/factoryStock.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: BaseGrid:1
- SP: `SP_UI_SA_FP_DASHBOARD`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### FpBar

- 경로: `view/factoryplan/widgets/fpbar/FpBar.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### FpBarLine

- 경로: `view/factoryplan/widgets/fpbarline/FpBarLine.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### FpBarStack

- 경로: `view/factoryplan/widgets/fpbarstack/FpBarStack.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### FpBarStackLine

- 경로: `view/factoryplan/widgets/fpbarstackline/FpBarStackLine.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### FpCircularSum

- 경로: `view/factoryplan/widgets/fpcircularsum/FpCircularSum.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### FpCumulativeBarLine

- 경로: `view/factoryplan/widgets/fpcumulativebarline/FpCumulativeBarLine.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### InOutStatus

- 경로: `view/factoryplan/widgets/inoutstatus/InOutStatus.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### InputDelayedProductionOrder

- 경로: `view/factoryplan/widgets/inputdelayedproductionorder/InputDelayedProductionOrder.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=2
- 컴포넌트: BaseGrid:2, GridAddRowButton:2, GridDeleteRowButton:2, GridSaveButton:2

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### InputPlanComplianceRate

- 경로: `view/factoryplan/widgets/inputplancompliancerate/InputPlanComplianceRate.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- SP: `SP_UI_SA_FP_DASHBOARD`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### InputStatus

- 경로: `view/factoryplan/widgets/inputstatus/InputStatus.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: WorkArea:1, BaseGrid:1

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### InputTrend

- 경로: `view/factoryplan/widgets/inputtrend/InputTrend.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### InventoryStatusByProduct

- 경로: `view/factoryplan/widgets/inventorystatusbyproduct/InventoryStatusByProduct.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: BaseGrid:1
- SP: `SP_UI_SA_FP_DASHBOARD`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### KpiPlanResultDeliveryStatusSummary

- 경로: `view/factoryplan/widgets/kpiplanresultdeliverystatussummary/KpiPlanResultDeliveryStatusSummary.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### KpiProblemDetailGrid

- 경로: `view/factoryplan/widgets/kpiproblemdetailgrid/KpiProblemDetailGrid.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: BaseGrid:1

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### OutputStatus

- 경로: `view/factoryplan/widgets/outputstatus/OutputStatus.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: WorkArea:1, BaseGrid:1

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### PlanAgainstPerformance

- 경로: `view/factoryplan/widgets/planagainstperformance/PlanAgainstPerformance.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### PlanAgainstPerformanceStack

- 경로: `view/factoryplan/widgets/planagainstperformancestack/PlanAgainstPerformanceStack.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### PlanAgainstPrfmPrbm

- 경로: `view/factoryplan/widgets/planagainstprfmprbm/PlanAgainstPrfmPrbm.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### PlanAgainstPrfmPrbmStack

- 경로: `view/factoryplan/widgets/planagainstprfmprbmstack/PlanAgainstPrfmPrbmStack.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### PlanAgainstPrfmProdPrbmItemGrp

- 경로: `view/factoryplan/widgets/planagainstprfmprodprbmitemgrp/PlanAgainstPrfmProdPrbmItemGrp.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### PlanAgainstPrfmProdPrbmStack

- 경로: `view/factoryplan/widgets/planagainstprfmprodprbmstack/PlanAgainstPrfmProdPrbmStack.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### PlanResultDeliveryDelayStatus

- 경로: `view/factoryplan/widgets/planresultdeliverydelaystatus/PlanResultDeliveryDelayStatus.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### PlanResultDeliveryShortStatus

- 경로: `view/factoryplan/widgets/planresultdeliveryshortstatus/PlanResultDeliveryShortStatus.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### PlanResultDeliveryStatusSummary

- 경로: `view/factoryplan/widgets/planresultdeliverystatussummary/PlanResultDeliveryStatusSummary.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### PlanResultSummaryDeliveryRate

- 경로: `view/factoryplan/widgets/planresultsummarydeliveryrate/PlanResultSummaryDeliveryRate.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### PlanResultSummaryOrderCount

- 경로: `view/factoryplan/widgets/planresultsummaryordercount/PlanResultSummaryOrderCount.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### PlanVsActualDetailGrid

- 경로: `view/factoryplan/widgets/planvsactualdetailgrid/PlanVsActualDetailGrid.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: WorkArea:1, BaseGrid:1
- 호출: `factoryplan/dashboard/plan-against-prfm-detail/chart`

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### POFinishFpPlanPerformance

- 경로: `view/factoryplan/widgets/pofinishfpplanperformance/POFinishFpPlanPerformance.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: BaseGrid:1
- SP: `SP_UI_SA_FP_DASHBOARD`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### POInputPlanPerformance

- 경로: `view/factoryplan/widgets/poinputplanperformance/POInputPlanPerformance.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: BaseGrid:1
- SP: `SP_UI_SA_FP_DASHBOARD`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### ProblemDetailGrid

- 경로: `view/factoryplan/widgets/problemdetailgrid/ProblemDetailGrid.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: BaseGrid:1

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### ProdCompletComplianceRate

- 경로: `view/factoryplan/widgets/prodcompletcompliancerate/ProdCompletComplianceRate.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- SP: `SP_UI_SA_FP_DASHBOARD`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### RouteGrpTargetActl

- 경로: `view/factoryplan/widgets/routegrptargetactl/RouteGrpTargetActl.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: WorkArea:1, BaseGrid:1

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### RouteOutChart

- 경로: `view/factoryplan/widgets/routeoutchart/RouteOutChart.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### RouteOutGrid

- 경로: `view/factoryplan/widgets/routeoutgrid/RouteOutGrid.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: WorkArea:1, BaseGrid:1

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### RouteWip

- 경로: `view/factoryplan/widgets/routewip/RouteWip.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: WorkArea:1, BaseGrid:1

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### ScheduledInputProductionOrder

- 경로: `view/factoryplan/widgets/scheduledinputproductionorder/ScheduledInputProductionOrder.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: BaseGrid:1

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### ScheduledOrderToCompleteProduction

- 경로: `view/factoryplan/widgets/scheduledordertocompleteproduction/ScheduledOrderToCompleteProduction.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: BaseGrid:1

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### ShipmentStatus

- 경로: `view/factoryplan/widgets/shipmentstatus/ShipmentStatus.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### SimulationKpiBedResrcUtil

- 경로: `view/factoryplan/widgets/simulationkpibedresrcutil/SimulationKpiBedResrcUtil.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SimulationKpiFulfillRate

- 경로: `view/factoryplan/widgets/simulationkpifulfillrate/SimulationKpiFulfillRate.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### SimulationKpiLeadTime

- 경로: `view/factoryplan/widgets/simulationkpileadtime/SimulationKpiLeadTime.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### SimulationKpiOnTimeRate

- 경로: `view/factoryplan/widgets/simulationkpiontimerate/SimulationKpiOnTimeRate.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### SimulationKpiWorkerResrcUtil

- 경로: `view/factoryplan/widgets/simulationkpiworkerresrcutil/SimulationKpiWorkerResrcUtil.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### TotalFinishFpPlanPerformance

- 경로: `view/factoryplan/widgets/totalfinishfpplanperformance/TotalFinishFpPlanPerformance.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: BaseGrid:1
- SP: `SP_UI_SA_FP_DASHBOARD`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### TotalProdCompletAmount

- 경로: `view/factoryplan/widgets/totalprodcompletamount/TotalProdCompletAmount.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- SP: `SP_UI_SA_FP_DASHBOARD`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### TotalProductionPerformancePerDay

- 경로: `view/factoryplan/widgets/totalproductionperformanceperday/TotalProductionPerformancePerDay.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_FP_DASHBOARD`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### WeeklyShipment

- 경로: `view/factoryplan/widgets/weeklyshipment/WeeklyShipment.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: WorkArea:1, BaseGrid:1

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

### — 서브컴포넌트 (14개)

#### ActualSearchCondition

- 경로: `view/factoryplan/common/component/ActualSearchCondition.jsx`
- 패턴: **서브 컴포넌트** (SUBCOMPONENT) · confidence: **high**
- 추정 근거: sub-component folder
- 컴포넌트: InputField:7, PlanScope:1
- 호출: `common/actual/codes`

```
┌─────────────┐
│ Sub Comp.   │
└─────────────┘
```

#### ChartDateRange

- 경로: `view/factoryplan/insight/common/component/ChartDateRange.jsx`
- 패턴: **서브 컴포넌트** (SUBCOMPONENT) · confidence: **high**
- 추정 근거: sub-component folder

```
┌─────────────┐
│ Sub Comp.   │
└─────────────┘
```

#### ChartWithDateRange

- 경로: `view/factoryplan/insight/common/component/ChartWithDateRange.jsx`
- 패턴: **서브 컴포넌트** (SUBCOMPONENT) · confidence: **high**
- 추정 근거: sub-component folder
- 컴포넌트: ChartComponent:1

```
┌─────────────┐
│ Sub Comp.   │
└─────────────┘
```

#### ClickableListPanel

- 경로: `view/factoryplan/common/component/ClickableListPanel.jsx`
- 패턴: **서브 컴포넌트** (SUBCOMPONENT) · confidence: **high**
- 추정 근거: sub-component folder

```
┌─────────────┐
│ Sub Comp.   │
└─────────────┘
```

#### CommonActiveScreen

- 경로: `view/factoryplan/insight/common/component/CommonActiveScreen.jsx`
- 패턴: **서브 컴포넌트** (SUBCOMPONENT) · confidence: **high**
- 추정 근거: sub-component folder
- 컴포넌트: TabContainer:1

```
┌─────────────┐
│ Sub Comp.   │
└─────────────┘
```

#### DetailCard

- 경로: `view/factoryplan/common/component/DetailCard.jsx`
- 패턴: **서브 컴포넌트** (SUBCOMPONENT) · confidence: **high**
- 추정 근거: sub-component folder

```
┌─────────────┐
│ Sub Comp.   │
└─────────────┘
```

#### DetailsSplitArea

- 경로: `view/factoryplan/common/component/DetailsSplitArea.jsx`
- 패턴: **서브 컴포넌트** (SUBCOMPONENT) · confidence: **high**
- 추정 근거: sub-component folder

```
┌─────────────┐
│ Sub Comp.   │
└─────────────┘
```

#### PeriodSearchGroup

- 경로: `view/factoryplan/common/component/PeriodSearchGroup.jsx`
- 패턴: **서브 컴포넌트** (SUBCOMPONENT) · confidence: **high**
- 추정 근거: sub-component folder
- 컴포넌트: InputField:5

```
┌─────────────┐
│ Sub Comp.   │
└─────────────┘
```

#### PlanScope

- 경로: `view/factoryplan/common/component/PlanScope.jsx`
- 패턴: **서브 컴포넌트** (SUBCOMPONENT) · confidence: **high**
- 추정 근거: sub-component folder
- 컴포넌트: InputField:2
- 호출: `factoryplan/examples`

```
┌─────────────┐
│ Sub Comp.   │
└─────────────┘
```

#### PsnlItems

- 경로: `view/factoryplan/common/component/PsnlItems.jsx`
- 패턴: **서브 컴포넌트** (SUBCOMPONENT) · confidence: **high**
- 추정 근거: sub-component folder

```
┌─────────────┐
│ Sub Comp.   │
└─────────────┘
```

#### SearchOptsGroup

- 경로: `view/factoryplan/common/component/SearchOptsGroup.jsx`
- 패턴: **서브 컴포넌트** (SUBCOMPONENT) · confidence: **high**
- 추정 근거: sub-component folder
- 컴포넌트: InputField:2

```
┌─────────────┐
│ Sub Comp.   │
└─────────────┘
```

#### VersionPlantSearchCondition

- 경로: `view/factoryplan/common/component/VersionPlantSearchCondition.jsx`
- 패턴: **서브 컴포넌트** (SUBCOMPONENT) · confidence: **high**
- 추정 근거: sub-component folder
- 컴포넌트: InputField:3, PlanScope:1

```
┌─────────────┐
│ Sub Comp.   │
└─────────────┘
```

#### VersionSearchGroup

- 경로: `view/factoryplan/common/component/VersionSearchGroup.jsx`
- 패턴: **서브 컴포넌트** (SUBCOMPONENT) · confidence: **high**
- 추정 근거: sub-component folder
- 컴포넌트: InputField:4, PlanScope:1

```
┌─────────────┐
│ Sub Comp.   │
└─────────────┘
```

#### VerticalGridChartBox

- 경로: `view/factoryplan/common/component/VerticalGridChartBox.jsx`
- 패턴: **서브 컴포넌트** (SUBCOMPONENT) · confidence: **high**
- 추정 근거: sub-component folder
- 컴포넌트: GridExcelExportButton:1

```
┌─────────────┐
│ Sub Comp.   │
└─────────────┘
```

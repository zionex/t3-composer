# snop 모듈 — UI 패턴 카탈로그

> Phase 1 자동 분류 결과 (생성: `ui-patterns-gen.cjs`). 정정·보강 환영.

## 요약

| 항목 | 값 |
|---|---:|
| 총 화면 | 134 |
| 등록 메뉴 (UI_*) | 11 |
| 위젯 | 75 |
| 팝업 | 14 |
| Base 래퍼 | 0 |
| Sub-component | 0 |

### 레이아웃 카테고리 분포

| 카테고리 | 화면 수 |
|---|---:|
| 01 미분할 (단일) | 39 |
| 11 상하 2분할 | 4 |
| 31 혼합·격자·특수 | 2 |
| — 팝업 | 14 |
| — 위젯 | 75 |

### 패턴 분포 (상위 10)

| 패턴 | 화면 수 |
|---|---:|
| 위젯 (차트) (`widget_chart`) | 55 |
| P01 위젯 대시보드 (`widget_dashboard`) | 18 |
| 팝업 다이얼로그 (`popup`) | 14 |
| 비표준 / 자유 폼 (`free_form`) | 13 |
| 위젯 (피벗) (`widget_pivot`) | 13 |
| v2 차트 + 그리드 (수직 스택) (`grid_chart_stacked`) | 4 |
| 위젯 (그리드) (`widget_grid`) | 4 |
| P09 차트 단독 (`P09_chart_view`) | 3 |
| P02 검색 + 그리드 (마스터 CRUD) (`search_grid`) | 3 |
| 위젯 (자유) (`widget_misc`) | 3 |

---
## 화면별 상세

### 01 미분할 (단일) (39개)

#### AgendaContentEditor

- 경로: `view/snop/meeting/AgendaContentEditor.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: ZEditor:1

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### AgendaList

- 경로: `view/snop/meeting/AgendaList.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### AggrMstList (`UI_SA_AGGR_MST_LIST`)

- 경로: `view/snop/dashboard/aggrmstlist/AggrMstList.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, InputField:2
- 호출: `dashboardfact/deleteAggrMst` · `dashboardfact/aggrmstlist`

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

#### ChartDashboard

- 경로: `view/snop/dashboard/chartdashboard/ChartDashboard.jsx`
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

#### ChartExample

- 경로: `view/snop/dashboard/chartexample/ChartExample.jsx`
- 패턴: **P09 차트 단독** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: Chart=3
- 컴포넌트: ContentInner:1, ChartComponent:3

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│   ▁ ▃ ▅ ▇ █ ▇ ▅ ▃            │
│   ●─●─●─●─●─●                │
│   (ChartComponent)           │
└──────────────────────────────┘
```

#### Demand (`UI_SA_DPMP_SIMUL`)

- 경로: `view/snop/simulation/demand/Demand.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, WorkArea:1, BaseGrid:1, GridCnt:1, InputField:2, PopPersonalize:1
- SP: `SP_UI_DP_CURRENCY_COMBO`
- 호출: `/snop/simulation/create-version` · `/snop/simulation/version` · `engine/dp/GetSADemand`

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

#### EditableDiv

- 경로: `view/snop/meeting/EditableDiv.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### ExecutiveDashboard (`UI_SA_EXECUTIVE_DASHBOARD`)

- 경로: `view/snop/dashboard/executivedashboard/ExecutiveDashboard.jsx`
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

#### FileList

- 경로: `view/snop/meeting/FileList.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 호출: `meeting/files` · `meeting/files/delete`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### FlxReportView (`UI_SA_FLEXIBLE_VIEW`)

- 경로: `view/snop/dashboard/flxreportview/FlxReportView.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, PivotTable:1, InputField:7
- 호출: `common/data` · `flxreport/flxreport` · `snop/dashboardfact/fact`

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

#### ItemMeetTarget (`UI_SA_ITEMGRP_MEET_TARGET`)

- 경로: `view/snop/dashboard/itemmeettarget/ItemMeetTarget.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, InputField:1
- SP: `SP_UI_SA_ITEMGRP_MEET_TARGET`
- 호출: `common/data`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### ItemTree

- 경로: `view/snop/dashboard/itemmeettarget/ItemTree.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- SP: `SP_UI_DP_00_POPUP_ITEM_TREE_Q2`
- 호출: `snop/common/list-hierarch`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### Keymetrics (`UI_SA_KEY_METRICS`)

- 경로: `view/snop/simulation/keymetrics/Keymetrics.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### MenuList

- 경로: `view/snop/meeting/MenuList.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 호출: `meeting/menu/delete`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### MyGoogleMap

- 경로: `view/snop/map/MyGoogleMap.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### OntimeSales

- 경로: `view/snop/mdb/ontimesales/OntimeSales.jsx`
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

#### OntimeSalesDetail

- 경로: `view/snop/mdb/ontimesalesdetail/OntimeSalesDetail.jsx`
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

#### OntimeSalesPrbl

- 경로: `view/snop/mdb/ontimesalesprbl/OntimeSalesPrbl.jsx`
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

#### periodStepper

- 경로: `view/snop/common/periodStepper.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### PopulationPopup

- 경로: `view/snop/map/PopulationPopup.jsx`
- 패턴: **P09 차트 단독** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: Chart=1
- 컴포넌트: ChartComponent:1, PopupDialog:1

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│   ▁ ▃ ▅ ▇ █ ▇ ▅ ▃            │
│   ●─●─●─●─●─●                │
│   (ChartComponent)           │
└──────────────────────────────┘
```

#### PsiBalance

- 경로: `view/snop/psibalance/PsiBalance.jsx`
- 패턴: **P09 차트 단독** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: Chart=1
- 컴포넌트: ContentInner:1, WorkArea:1, ChartComponent:1, InputField:3
- SP: `SP_UI_DP_00_ITEM_LV_DATA_Q1` · `SP_UI_DP_00_ITEM_LV_DATA_Q1_01` · `SP_UI_DP_00_ITEM_LV_DATA_Q1_02` · `SP_UI_DP_00_ITEM_LV_DATA_Q1_03` · `SP_UI_DP_00_ITEM_LV_DATA_Q1_04`
- 호출: `common/data`

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│   ▁ ▃ ▅ ▇ █ ▇ ▅ ▃            │
│   ●─●─●─●─●─●                │
│   (ChartComponent)           │
└──────────────────────────────┘
```

#### SalesGrowthRate

- 경로: `view/snop/mdb/salesgrowthrate/SalesGrowthRate.jsx`
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

#### SalesGrowthRateDetail

- 경로: `view/snop/mdb/salesgrowthratedetail/SalesGrowthRateDetail.jsx`
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

#### SalesMPPlan

- 경로: `view/snop/mdb/salesmpplan/SalesMPPlan.jsx`
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

#### SalesMPPlanDetail

- 경로: `view/snop/mdb/salesmpplandetail/SalesMPPlanDetail.jsx`
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

#### SalesPlanStateDetail

- 경로: `view/snop/mdb/salesplanstatedetail/SalesPlanStateDetail.jsx`
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

#### Setup

- 경로: `view/snop/simulation/keymetrics/Setup.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:5

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### SnopCalendar (`UI_UT_CALENDAR`)

- 경로: `view/snop/snopcalendar/SnopCalendar.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: ContentInner:1, WorkArea:1, InputField:1
- 호출: `calendar` · `calendar-category` · `calendar-category/delete`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### SnopIssueList

- 경로: `view/snop/meeting/SnopIssueList.jsx`
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

#### SupplyMatPsi

- 경로: `view/snop/mdb/supplymatpsi/SupplyMatPsi.jsx`
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

#### SupplyMatPsiDetail

- 경로: `view/snop/mdb/supplymatpsidetail/SupplyMatPsiDetail.jsx`
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

#### SupplyPlanKpi

- 경로: `view/snop/mdb/supplyplankpi/SupplyPlanKpi.jsx`
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

#### SupplyPlanKpiDtl1

- 경로: `view/snop/mdb/supplyplankpidtl1/SupplyPlanKpiDtl1.jsx`
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

#### SupplyPlanKpiDtl2

- 경로: `view/snop/mdb/supplyplankpidtl2/SupplyPlanKpiDtl2.jsx`
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

#### SupplyPlanKpiDtl3

- 경로: `view/snop/mdb/supplyplankpidtl3/SupplyPlanKpiDtl3.jsx`
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

#### SupplyPlanKpiDtl4

- 경로: `view/snop/mdb/supplyplankpidtl4/SupplyPlanKpiDtl4.jsx`
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

#### SupplyPlanKpiDtl5

- 경로: `view/snop/mdb/supplyplankpidtl5/SupplyPlanKpiDtl5.jsx`
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

#### UserSearchInput

- 경로: `view/snop/snopcalendar/UserSearchInput.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:1

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### WidgetMgmt (`UI_SA_WIDGET`)

- 경로: `view/snop/widgetmgmt/WidgetMgmt.jsx`
- 패턴: **P04 트리 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TreeGrid=1
- 컴포넌트: ContentInner:1, WorkArea:1, TreeGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1
- 호출: `system/widgets/delete` · `system/widgets` · `system/widgets?all-widgets=true`

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

### 11 상하 2분할 (4개)

#### DemandRisk (`UI_SA_SNOP_DEMAND_RISK`)

- 경로: `view/snop/simulation/demandrisk/DemandRisk.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=2 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:2, InputField:2
- SP: `SP_UI_DP_CURRENCY_COMBO` · `SP_UI_CM_CODE` · `SP_UI_SA_DEMAND_RISK_Q` · `SP_UI_SA_DEMAND_RISK_RANK_Q`
- 호출: `/snop/simulation/create-version` · `/snop/simulation/version` · `common/data`

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

#### Fact

- 경로: `view/snop/dashboard/fact/Fact.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=2
- 컴포넌트: ContentInner:1, WorkArea:1, BaseGrid:2, ChartComponent:1

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

#### Map

- 경로: `view/snop/map/Map.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, BaseGrid:1, ChartComponent:1, MyGoogleMap:1

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

#### SalesPlanState

- 경로: `view/snop/mdb/salesplanstate/SalesPlanState.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=2 Grid=1
- 컴포넌트: ContentInner:1, WorkArea:1, BaseGrid:1, ChartComponent:2, InputField:3
- SP: `SP_UI_DP_00_ITEM_LV_DATA_Q1` · `SP_UI_DP_00_ITEM_LV_DATA_Q1_01` · `SP_UI_DP_00_ITEM_LV_DATA_Q1_02` · `SP_UI_DP_00_ITEM_LV_DATA_Q1_03` · `SP_UI_DP_00_ITEM_LV_DATA_Q1_04`
- 호출: `common/data`

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

### 31 혼합·격자·특수 (2개)

#### FlxReport (`UI_SA_FLEXIBLE_REPORT`)

- 경로: `view/snop/dashboard/flxreport/FlxReport.jsx`
- 패턴: **혼합 분할** (LAYOUT_MIXED) · confidence: **mid**
- 추정 근거: splits=2 dirs=[unknown] tabs=0
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, PivotTable:1, SplitPanel:2, GridAddRowButton:2, …
- 호출: `flxreport/saveflxreport` · `flxreport/deleteflxreport` · `flxreport/flxreport`

```
┌──────────────────────────────┐
│ Search                       │
├──────────┬───────────────────┤
│ Tree     │ Top: Chart        │
│          ├───────────────────┤
│          │ Bottom: Grid      │
└──────────┴───────────────────┘
```

#### Meeting (`UI_SA_MEETING`)

- 경로: `view/snop/meeting/Meeting.jsx`
- 패턴: **혼합 분할** (LAYOUT_MIXED) · confidence: **mid**
- 추정 근거: splits=2 dirs=[unknown] tabs=0
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, SplitPanel:2, VLayoutBox:2, ZEditor:1, GridAddRowButton:2, …
- 호출: `meeting/dates` · `meeting` · `meeting/check-repeat-type`

```
┌──────────────────────────────┐
│ Search                       │
├──────────┬───────────────────┤
│ Tree     │ Top: Chart        │
│          ├───────────────────┤
│          │ Bottom: Grid      │
└──────────┴───────────────────┘
```

### — 팝업 (14개)

#### PopAggrField

- 경로: `view/snop/dashboard/flxreport/PopAggrField.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=2
- 컴포넌트: BaseGrid:2, SplitPanel:1, PopupDialog:1
- 호출: `dashboardfact/aggrmstlist` · `dashboardfact/aggrfilddesc`

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

#### PopAggrList

- 경로: `view/snop/dashboard/aggrmstlist/PopAggrList.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, VLayoutBox:1, PopupDialog:1
- 호출: `dashboardfact/getAggrSqlList`

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

#### PopAggrSetting

- 경로: `view/snop/dashboard/aggrmstlist/PopAggrSetting.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, VLayoutBox:1, GridAddRowButton:1, GridDeleteRowButton:1, InputField:5, PopupDialog:1
- 호출: `dashboardfact/loadProc` · `dashboardfact/saveAggrMst` · `dashboardfact/saveFieldDesc`

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

#### PopBeforeSave

- 경로: `view/snop/meeting/PopBeforeSave.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:1, PopupDialog:1
- 호출: `meeting/dates` · `meeting?repeatTp=`

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

#### PopDeleteOption

- 경로: `view/snop/snopcalendar/PopDeleteOption.jsx`
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

#### PopMettingCopy

- 경로: `view/snop/meeting/PopMettingCopy.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:1, PopupDialog:1
- 호출: `meeting/dates` · `meeting/copy`

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

#### PopSaveOption

- 경로: `view/snop/snopcalendar/PopSaveOption.jsx`
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

#### PopSelectAttendee

- 경로: `view/snop/meeting/PopSelectAttendee.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, WorkArea:1, BaseGrid:1, InputField:2, PopupDialog:1
- 호출: `system/users`

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

#### PopSelectMenu

- 경로: `view/snop/meeting/PopSelectMenu.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:3

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

#### PopShowList

- 경로: `view/snop/meeting/PopShowList.jsx`
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

#### PopSnopCalendar

- 경로: `view/snop/snopcalendar/PopSnopCalendar.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: ZEditor:1, InputField:12, PopupDialog:1
- 호출: `calendar` · `calendar/delete` · `calendar/repeatdelete`

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

#### PopSnopCalendarShowList

- 경로: `view/snop/snopcalendar/PopSnopCalendarShowList.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:4, PopupDialog:1

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

#### PopSnopCategory

- 경로: `view/snop/snopcalendar/PopSnopCategory.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:2, PopupDialog:1
- 호출: `calendar-category`

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

#### PopUserSearch

- 경로: `view/snop/snopcalendar/PopUserSearch.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=2
- 컴포넌트: SearchArea:1, WorkArea:1, BaseGrid:2, InputField:3, PopupDialog:1
- 호출: `system/groups` · `system/users/group`

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

### — 위젯 (75개)

#### AopVsDp

- 경로: `view/snop/widgets/aopvsdp/AopVsDp.jsx`
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

#### DashboardWidget01

- 경로: `view/snop/widgets/dashboardwidget01/DashboardWidget01.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget02

- 경로: `view/snop/widgets/dashboardwidget02/DashboardWidget02.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=2 grid=0
- 컴포넌트: ChartComponent:2

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget03

- 경로: `view/snop/widgets/dashboardwidget03/DashboardWidget03.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=2 grid=0
- 컴포넌트: ChartComponent:2

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget04

- 경로: `view/snop/widgets/dashboardwidget04/DashboardWidget04.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### DashboardWidget05

- 경로: `view/snop/widgets/dashboardwidget05/DashboardWidget05.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=4 grid=0
- 컴포넌트: ChartComponent:4

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget06

- 경로: `view/snop/widgets/dashboardwidget06/DashboardWidget06.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=2 grid=0
- 컴포넌트: ChartComponent:2

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget07

- 경로: `view/snop/widgets/dashboardwidget07/DashboardWidget07.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget08

- 경로: `view/snop/widgets/dashboardwidget08/DashboardWidget08.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=4 grid=0
- 컴포넌트: ChartComponent:4

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget09

- 경로: `view/snop/widgets/dashboardwidget09/DashboardWidget09.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget10

- 경로: `view/snop/widgets/dashboardwidget10/DashboardWidget10.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=2 grid=0
- 컴포넌트: ChartComponent:2

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget11

- 경로: `view/snop/widgets/dashboardwidget11/DashboardWidget11.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget12

- 경로: `view/snop/widgets/dashboardwidget12/DashboardWidget12.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget13

- 경로: `view/snop/widgets/dashboardwidget13/DashboardWidget13.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget14

- 경로: `view/snop/widgets/dashboardwidget14/DashboardWidget14.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget15

- 경로: `view/snop/widgets/dashboardwidget15/DashboardWidget15.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=2 grid=0
- 컴포넌트: ChartComponent:2

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget16

- 경로: `view/snop/widgets/dashboardwidget16/DashboardWidget16.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=1
- 컴포넌트: BaseGrid:1, ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget17

- 경로: `view/snop/widgets/dashboardwidget17/DashboardWidget17.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=1
- 컴포넌트: BaseGrid:1, ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget18

- 경로: `view/snop/widgets/dashboardwidget18/DashboardWidget18.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=1
- 컴포넌트: BaseGrid:1, ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget19

- 경로: `view/snop/widgets/dashboardwidget19/DashboardWidget19.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=3 grid=0
- 컴포넌트: ChartComponent:3

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget20

- 경로: `view/snop/widgets/dashboardwidget20/DashboardWidget20.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=4 grid=0
- 컴포넌트: ChartComponent:4

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget21

- 경로: `view/snop/widgets/dashboardwidget21/DashboardWidget21.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget22

- 경로: `view/snop/widgets/dashboardwidget22/DashboardWidget22.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget23

- 경로: `view/snop/widgets/dashboardwidget23/DashboardWidget23.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget24

- 경로: `view/snop/widgets/dashboardwidget24/DashboardWidget24.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget25

- 경로: `view/snop/widgets/dashboardwidget25/DashboardWidget25.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### DashboardWidget26

- 경로: `view/snop/widgets/dashboardwidget26/DashboardWidget26.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DashboardWidget27

- 경로: `view/snop/widgets/dashboardwidget27/DashboardWidget27.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### DpItemGrp

- 경로: `view/snop/widgets/dpitemgrp/DpItemGrp.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_DP_ITEMGRP`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DpItemgrpRevenue

- 경로: `view/snop/widgets/dpitemgrprevenue/DpItemgrpRevenue.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_DP_ITEMGRP`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### OntimeSales1

- 경로: `view/snop/widgets/ontimesales1/OntimeSales1.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_ONTIMESALES_MONTHLYONTIMESALES_01`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### OntimeSales2

- 경로: `view/snop/widgets/ontimesales2/OntimeSales2.jsx`
- 패턴: **위젯 (피벗)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- 컴포넌트: PivotTable:2
- SP: `SP_UI_SA_ONTIMESALES_SALESGRPMONTHLYSALESPRBL_01` · `SP_UI_SA_ONTIMESALES_TRADETYPEMONTHLYSALESPRBL_01`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Pivot       │
│  A 100  B 200      │
└────────────────────┘
```

#### OntimeSales3

- 경로: `view/snop/widgets/ontimesales3/OntimeSales3.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_ONTIMESALES_SALESPRBLCATCHART_01`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### OntimeSales4

- 경로: `view/snop/widgets/ontimesales4/OntimeSales4.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: BaseGrid:1, GridExcelExportButton:1
- SP: `SP_UI_SA_ONTIMESALES_MONTHLYSALESIMPL_01`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### OntimeSalesAnalysis1

- 경로: `view/snop/widgets/ontimesalesanalysis1/OntimeSalesAnalysis1.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_ONTIMESALES_SALESPROBLEMANALYSIS_01`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### OntimeSalesAnalysis2

- 경로: `view/snop/widgets/ontimesalesanalysis2/OntimeSalesAnalysis2.jsx`
- 패턴: **위젯 (피벗)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- 컴포넌트: PivotTable:1
- SP: `SP_UI_SA_ONTIMESALES_SALESPROBLEMANALYSIS_02`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Pivot       │
│  A 100  B 200      │
└────────────────────┘
```

#### OntimeSalesDetail1

- 경로: `view/snop/widgets/ontimesalesdetail1/OntimeSalesDetail1.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_ONTIMESALES_MONTHLYONTIMESALES_01`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### OntimeSalesDetail2

- 경로: `view/snop/widgets/ontimesalesdetail2/OntimeSalesDetail2.jsx`
- 패턴: **위젯 (피벗)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- 컴포넌트: PivotTable:1
- SP: `SP_UI_SA_ONTIMESALES_MONTHLYONTIMESALES_02`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Pivot       │
│  A 100  B 200      │
└────────────────────┘
```

#### PivotTest

- 경로: `view/snop/widgets/pivottest/PivotTest.jsx`
- 패턴: **위젯 (피벗)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- 컴포넌트: PivotTable:1

```
┌────────────────────┐
│ Widget Pivot       │
│  A 100  B 200      │
└────────────────────┘
```

#### RTFAccountRate

- 경로: `view/snop/widgets/rtfaccountrate/RTFAccountRate.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SALESSUPPLY_MONTHLYSALESSUPPLY`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### RTFItemRate

- 경로: `view/snop/widgets/rtfitemrate/RTFItemRate.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SALESSUPPLY_MONTHLYSALESSUPPLY`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### RTFSalesRate

- 경로: `view/snop/widgets/rtfsalesrate/RTFSalesRate.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SALESSUPPLY_MONTHLYSALESSUPPLY`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### RTFSatisfactionAnalysis

- 경로: `view/snop/widgets/rtfsatisfactionanalysis/RTFSatisfactionAnalysis.jsx`
- 패턴: **위젯 (피벗)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- 컴포넌트: PivotTable:1
- SP: `SP_UI_SA_SALESSUPPLY_WEEKLYSALESSUPPLY_02`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Pivot       │
│  A 100  B 200      │
└────────────────────┘
```

#### RTFSatisfactionAnalysisDetail

- 경로: `view/snop/widgets/rtfsatisfactionanalysisdetail/RTFSatisfactionAnalysisDetail.jsx`
- 패턴: **위젯 (피벗)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- 컴포넌트: PivotTable:1
- SP: `SP_UI_SA_SALESSUPPLY_WEEKLYSALESSUPPLY_02`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Pivot       │
│  A 100  B 200      │
└────────────────────┘
```

#### RTFSatisfactionRate

- 경로: `view/snop/widgets/rtfsatisfactionrate/RTFSatisfactionRate.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SALESSUPPLY_WEEKLYSALESSUPPLY_01`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SalesGrowthRate1

- 경로: `view/snop/widgets/salesgrowthrate1/SalesGrowthRate1.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SALES_RT_01`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SalesGrowthRate2

- 경로: `view/snop/widgets/salesgrowthrate2/SalesGrowthRate2.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SALES_RT_02`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SalesGrowthRate3

- 경로: `view/snop/widgets/salesgrowthrate3/SalesGrowthRate3.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SALES_RT_03`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SalesGrowthRateDetail1

- 경로: `view/snop/widgets/salesgrowthratedetail1/SalesGrowthRateDetail1.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: BaseGrid:1, GridExcelExportButton:1
- SP: `SP_UI_SALES_RT_04`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### SalesPlanDetailBar

- 경로: `view/snop/widgets/salesplandetailbar/SalesPlanDetailBar.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SALESPLAN_WEEKLYSALESPLANHIT_01`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SalesPlanDetailGrid

- 경로: `view/snop/widgets/salesplandetailgrid/SalesPlanDetailGrid.jsx`
- 패턴: **위젯 (피벗)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- 컴포넌트: PivotTable:1
- SP: `SP_UI_SA_SALESPLAN_WEEKLYSALESPLANHIT_03`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Pivot       │
│  A 100  B 200      │
└────────────────────┘
```

#### SalesPlanStateBar1

- 경로: `view/snop/widgets/salesplanstatebar1/SalesPlanStateBar1.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SALESPLAN_WEEKLYSALESPLANHIT_01`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SalesPlanStateBar2

- 경로: `view/snop/widgets/salesplanstatebar2/SalesPlanStateBar2.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SALESPLAN_WEEKLYSALESPLANHIT_02`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SalesPlanStateGrid

- 경로: `view/snop/widgets/salesplanstategrid/SalesPlanStateGrid.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: BaseGrid:1, GridExcelExportButton:1
- SP: `SP_UI_SA_SALESPLAN_BIZSALESRTCOMPR_03`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### SalesPlanStatePie1

- 경로: `view/snop/widgets/salesplanstatepie1/SalesPlanStatePie1.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SALESPLAN_BIZSALESRTCOMPR_01`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SalesPlanStatePie2

- 경로: `view/snop/widgets/salesplanstatepie2/SalesPlanStatePie2.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SALESPLAN_BIZSALESRTCOMPR_02`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SupplyMatPsiChart

- 경로: `view/snop/widgets/supplymatpsichart/SupplyMatPsiChart.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SUPPLYMATPSI_SUPPLYMATPSI_01`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SupplyMatPsiDetail

- 경로: `view/snop/widgets/supplymatpsidetail/SupplyMatPsiDetail.jsx`
- 패턴: **위젯 (그리드)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=1
- 컴포넌트: BaseGrid:1, GridExcelExportButton:1
- SP: `SP_UI_SA_SUPPLYMATPSI_SUPPLYMATSHORT_01`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

#### SupplyMatPsiGrid

- 경로: `view/snop/widgets/supplymatpsigrid/SupplyMatPsiGrid.jsx`
- 패턴: **위젯 (피벗)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- 컴포넌트: PivotTable:1
- SP: `SP_UI_SA_SUPPLYMATPSI_SUPPLYMATPSI_02`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Pivot       │
│  A 100  B 200      │
└────────────────────┘
```

#### SupplyPlanKpi1

- 경로: `view/snop/widgets/supplyplankpi1/SupplyPlanKpi1.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SUPPLYPLANKPI_FIXMPNOCHGRATE_04`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SupplyPlanKpi2

- 경로: `view/snop/widgets/supplyplankpi2/SupplyPlanKpi2.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SUPPLYPLANKPI_FIXMPNOCHGRATE_01`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SupplyPlanKpi3

- 경로: `view/snop/widgets/supplyplankpi3/SupplyPlanKpi3.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SUPPLYPLANKPI_FIXMPIMPLRATE_01`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SupplyPlanKpi4

- 경로: `view/snop/widgets/supplyplankpi4/SupplyPlanKpi4.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SUPPLYPLANKPI_MPFPMATCHRATE_01`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SupplyPlanKpi5

- 경로: `view/snop/widgets/supplyplankpi5/SupplyPlanKpi5.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SUPPLYPLANKPI_FIXFPIMPLRATE_01`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SupplyPlanKpi6

- 경로: `view/snop/widgets/supplyplankpi6/SupplyPlanKpi6.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SUPPLYPLANKPI_FIXFPCOMPLRATE_01`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SupplyPlanKpiDtl1Bar

- 경로: `view/snop/widgets/supplyplankpidtl1bar/SupplyPlanKpiDtl1Bar.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SUPPLYPLANKPI_FIXMPNOCHGRATE_02`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SupplyPlanKpiDtl1Grid

- 경로: `view/snop/widgets/supplyplankpidtl1grid/SupplyPlanKpiDtl1Grid.jsx`
- 패턴: **위젯 (피벗)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- 컴포넌트: PivotTable:1
- SP: `SP_UI_SA_SUPPLYPLANKPI_FIXMPNOCHGRATE_03`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Pivot       │
│  A 100  B 200      │
└────────────────────┘
```

#### SupplyPlanKpiDtl2Bar

- 경로: `view/snop/widgets/supplyplankpidtl2bar/SupplyPlanKpiDtl2Bar.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SUPPLYPLANKPI_FIXMPIMPLRATE_02`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SupplyPlanKpiDtl2Grid

- 경로: `view/snop/widgets/supplyplankpidtl2grid/SupplyPlanKpiDtl2Grid.jsx`
- 패턴: **위젯 (피벗)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- 컴포넌트: PivotTable:1
- SP: `SP_UI_SA_SUPPLYPLANKPI_FIXMPIMPLRATE_03`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Pivot       │
│  A 100  B 200      │
└────────────────────┘
```

#### SupplyPlanKpiDtl3Bar

- 경로: `view/snop/widgets/supplyplankpidtl3bar/SupplyPlanKpiDtl3Bar.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SUPPLYPLANKPI_MPFPMATCHRATE_02`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SupplyPlanKpiDtl3Grid

- 경로: `view/snop/widgets/supplyplankpidtl3grid/SupplyPlanKpiDtl3Grid.jsx`
- 패턴: **위젯 (피벗)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- 컴포넌트: PivotTable:1
- SP: `SP_UI_SA_SUPPLYPLANKPI_MPFPMATCHRATE_03`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Pivot       │
│  A 100  B 200      │
└────────────────────┘
```

#### SupplyPlanKpiDtl4Bar

- 경로: `view/snop/widgets/supplyplankpidtl4bar/SupplyPlanKpiDtl4Bar.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SUPPLYPLANKPI_FIXFPIMPLRATE_02`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SupplyPlanKpiDtl4Grid

- 경로: `view/snop/widgets/supplyplankpidtl4grid/SupplyPlanKpiDtl4Grid.jsx`
- 패턴: **위젯 (피벗)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- 컴포넌트: PivotTable:1
- SP: `SP_UI_SA_SUPPLYPLANKPI_FIXFPIMPLRATE_03`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Pivot       │
│  A 100  B 200      │
└────────────────────┘
```

#### SupplyPlanKpiDtl5Bar

- 경로: `view/snop/widgets/supplyplankpidtl5bar/SupplyPlanKpiDtl5Bar.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_SUPPLYPLANKPI_FIXFPCOMPLRATE_02`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### SupplyPlanKpiDtl5Grid

- 경로: `view/snop/widgets/supplyplankpidtl5grid/SupplyPlanKpiDtl5Grid.jsx`
- 패턴: **위젯 (피벗)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- 컴포넌트: PivotTable:1
- SP: `SP_UI_SA_SUPPLYPLANKPI_FIXFPCOMPLRATE_03`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Pivot       │
│  A 100  B 200      │
└────────────────────┘
```

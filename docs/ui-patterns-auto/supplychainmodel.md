# supplychainmodel 모듈 — UI 패턴 카탈로그

> Phase 1 자동 분류 결과 (생성: `ui-patterns-gen.cjs`). 정정·보강 환영.

## 요약

| 항목 | 값 |
|---|---:|
| 총 화면 | 98 |
| 등록 메뉴 (UI_*) | 14 |
| 위젯 | 2 |
| 팝업 | 67 |
| Base 래퍼 | 0 |
| Sub-component | 0 |

### 레이아웃 카테고리 분포

| 카테고리 | 화면 수 |
|---|---:|
| 01 미분할 (단일) | 22 |
| 11 상하 2분할 | 4 |
| 95 RouteLayout | 3 |
| — 팝업 | 67 |
| — 위젯 | 2 |

### 패턴 분포 (상위 10)

| 패턴 | 화면 수 |
|---|---:|
| 팝업 다이얼로그 (`popup`) | 67 |
| 비표준 / 자유 폼 (`free_form`) | 11 |
| P02 검색 + 그리드 (마스터 CRUD) (`search_grid`) | 9 |
| v2 듀얼 그리드 2-stack (`v2_dual_grid`) | 4 |
| RL 라우트 레이아웃 (FLO) (`rl_layout_design`) | 3 |
| 위젯 (자유) (`widget_misc`) | 2 |
| P02b 그리드 전용 (검색 없음) (`P02b_grid_only`) | 1 |
| P01 위젯 대시보드 (`widget_dashboard`) | 1 |

---
## 화면별 상세

### 01 미분할 (단일) (22개)

#### AccountMultiSearchBox

- 경로: `view/supplychainmodel/common/AccountMultiSearchBox.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:1, PopAccountMulti:1

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### AccountSearchCondition

- 경로: `view/supplychainmodel/common/AccountSearchCondition.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:2

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### DemandMapping (`UI_CM_12`)

- 경로: `view/supplychainmodel/demandmapping/DemandMapping.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridAddRowButton:1, GridSaveButton:1, GridExcelExportButton:1, …
- SP: `SP_UI_CM_12_S1_P_RT_MSG` · `SP_UI_CM_12_POP_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_12_Q1` · `engine/mp/SRV_UI_CM_12_S1` · `engine/mp/SRV_UI_CM_12_POP_S1`

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

#### GeneralConfig (`UI_CM_01`)

- 경로: `view/supplychainmodel/generalconfig/GeneralConfig.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: ContentInner:1, WorkArea:1, BaseGrid:1
- 호출: `engine/mp/SRV_UI_CM_CODE` · `engine/mp/SRV_UI_CM_01_Q`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### Item (`UI_CM_18`)

- 경로: `view/supplychainmodel/item/Item.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, …
- SP: `SP_UI_CM_18_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_18_Q1` · `engine/mp/SRV_UI_CM_18_S1`

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

#### ItemMultiSearchBox

- 경로: `view/supplychainmodel/common/ItemMultiSearchBox.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:1, PopItemMulti:1

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### ItemSearchBox

- 경로: `view/supplychainmodel/common/ItemSearchBox.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:2

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### ItemSearchCondition

- 경로: `view/supplychainmodel/common/ItemSearchCondition.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:3
- 호출: `engine/mp/SRV_GET_ITEM_INFO`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### ItemShipmentSchedule (`UI_CM_19`)

- 경로: `view/supplychainmodel/itemshipmentschedule/ItemShipmentSchedule.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, BaseGrid:1, GridSaveButton:1, GridExcelExportButton:1, PlanScope:1
- SP: `SP_UI_CM_19_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_19_Q1` · `engine/mp/SRV_UI_CM_19_S1`

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

#### LocationMultiSearchBox

- 경로: `view/supplychainmodel/common/LocationMultiSearchBox.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:1, PopLocatTp:1

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### LocationSearchBox

- 경로: `view/supplychainmodel/common/LocationSearchBox.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:1, PopLocatTp:1

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### LocationSearchCondition

- 경로: `view/supplychainmodel/common/LocationSearchCondition.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:4, PopLocatTp:1
- 호출: `engine/mp/SRV_GET_LOCAT_INFO`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### PlanScope

- 경로: `view/supplychainmodel/common/PlanScope.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:1

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### ResourceMultiSearchBox

- 경로: `view/supplychainmodel/common/ResourceMultiSearchBox.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:1, PopResourceMulti:1

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### ShipmentLt (`UI_CM_07`)

- 경로: `view/supplychainmodel/shipmentlt/ShipmentLt.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridAddRowButton:1, GridSaveButton:1, GridExcelExportButton:1, …
- 호출: `engine/mp/SRV_UI_CM_07_Q1` · `engine/mp/SRV_UI_CM_07_S1`

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

#### ShippingCalendar (`UI_CM_14`)

- 경로: `view/supplychainmodel/shippingcalendar/ShippingCalendar.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridSaveButton:1, GridExcelExportButton:1, PlanScope:1
- SP: `SP_UI_CM_14_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_14_Q1` · `engine/mp/SRV_UI_CM_14_S1`

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

#### SimulationVersionCondition

- 경로: `view/supplychainmodel/common/SimulationVersionCondition.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:3
- 호출: `engine/mp/SRV_COMM_DEFAULT_VER`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### Site (`UI_CM_02`)

- 경로: `view/supplychainmodel/site/Site.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, …
- SP: `SP_UI_CM_02_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_02_Q1` · `engine/mp/SRV_UI_CM_02_S1`

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

#### SiteItem (`UI_CM_04`)

- 경로: `view/supplychainmodel/siteitem/SiteItem.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, …
- SP: `SP_UI_CM_04_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_04_Q1` · `engine/mp/SRV_UI_CM_04_S1`

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

#### SiteShipmentSchedule (`UI_CM_08`)

- 경로: `view/supplychainmodel/siteshipmentschedule/SiteShipmentSchedule.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridSaveButton:1, GridExcelExportButton:1, PlanScope:1
- SP: `SP_UI_CM_08_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_08_S1` · `engine/mp/SRV_UI_CM_08_Q1`

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

#### SiteWarehouse

- 경로: `view/supplychainmodel/sitewarehouse/SiteWarehouse.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, …
- SP: `SP_UI_CM_13_POP_02_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_13_Q1` · `engine/mp/SRV_UI_CM_13_POP_02_S2` · `engine/mp/SRV_UI_CM_13_POP_02_S1`

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

#### SupplyChainViewer (`UI_CM_SUPPLYCHAIN`)

- 경로: `view/supplychainmodel/supplychainviewer/SupplyChainViewer.jsx`
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

### 11 상하 2분할 (4개)

#### PlanningBom (`UI_CM_11`)

- 경로: `view/supplychainmodel/planningbom/PlanningBom.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridAddRowButton:2, GridDeleteRowButton:1, GridSaveButton:2, …
- SP: `SP_UI_CM_11_S2_P_RT_MSG` · `SP_UI_CM_11_S3_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_11_Q1` · `engine/mp/SRV_UI_CM_11_Q3` · `engine/mp/SRV_UI_CM_11_S2`

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

#### PlanScenario

- 경로: `view/supplychainmodel/planscenario/PlanScenario.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridAddRowButton:2, GridDeleteRowButton:2, GridSaveButton:1, …
- SP: `SP_UI_CM_16_S1_P_RT_MSG` · `SP_UI_CM_16_S4_P_RT_MSG` · `SP_UI_CM_16_S3_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_16_Q2` · `engine/mp/SRV_UI_CM_16_Q1` · `engine/mp/SRV_UI_CM_16_Q3`

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

#### SiteBod (`UI_CM_06`)

- 경로: `view/supplychainmodel/sitebod/SiteBod.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridAddRowButton:2, GridDeleteRowButton:2, GridSaveButton:2, …
- SP: `SP_UI_CM_06_POP_01_S_P_RT_MSG` · `SP_UI_CM_06_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_06_Q1` · `engine/mp/SRV_UI_CM_06_Q2` · `engine/mp/SRV_UI_CM_06_POP_01_S`

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

#### Transportation (`UI_CM_10`)

- 경로: `view/supplychainmodel/transportation/Transportation.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridAddRowButton:2, GridDeleteRowButton:2, GridSaveButton:2, …
- SP: `SP_UI_CM_10_D1_P_RT_MSG` · `SP_UI_CM_10_S1_P_RT_MSG` · `SP_UI_CM_10_S3_P_RT_MSG` · `SP_UI_CM_10_D3_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_10_Q2` · `engine/mp/SRV_UI_CM_10_D1` · `engine/mp/SRV_UI_CM_10_S1`

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

### 95 RouteLayout (3개)

#### Flo

- 경로: `view/supplychainmodel/flo/Flo.jsx`
- 패턴: **RL 라우트 레이아웃 (FLO)** (LAYOUT_ROUTELAYOUT) · confidence: **high**
- 추정 근거: route keyword · flo=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, TreeGrid:1, TabContainer:1, FLODiagram:1, …
- 호출: `engine/mp/SRV_UI_CM_FLO_Q1` · `engine/mp/SRV_UI_CM_FLO_Q2` · `engine/mp/SRV_UI_CM_FLO_Q3`

```
┌──────────────────────────────┐
│ Route Layout (FLODiagram)    │
├──────────────────────────────┤
│ [A]──▶[B]──▶[C]              │
│         │     ▼              │
│         └──▶[D]──▶[E]        │
└──────────────────────────────┘
```

#### ProductionBom (`UI_CM_05`)

- 경로: `view/supplychainmodel/productionbom/ProductionBom.jsx`
- 패턴: **RL 라우트 레이아웃 (FLO)** (LAYOUT_ROUTELAYOUT) · confidence: **high**
- 추정 근거: route keyword · flo=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:4, TreeGrid:1, TabContainer:1, FLODiagram:1, …
- SP: `SP_UI_CM_05_S1_P_RT_MSG` · `SP_UI_CM_05_S2_P_RT_MSG` · `SP_UI_CM_05_S3_P_RT_MSG` · `SP_UI_CM_05_S4_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_CODE` · `engine/mp/SRV_UI_CM_05_Q1` · `engine/mp/SRV_UI_CM_05_Q7`

```
┌──────────────────────────────┐
│ Route Layout (FLODiagram)    │
├──────────────────────────────┤
│ [A]──▶[B]──▶[C]              │
│         │     ▼              │
│         └──▶[D]──▶[E]        │
└──────────────────────────────┘
```

#### RouteMultiSearchBox

- 경로: `view/supplychainmodel/common/RouteMultiSearchBox.jsx`
- 패턴: **RL 라우트 레이아웃 (FLO)** (LAYOUT_ROUTELAYOUT) · confidence: **mid**
- 추정 근거: route keyword · flo=0
- 컴포넌트: InputField:1, PopRouteMulti:1

```
┌──────────────────────────────┐
│ Route Layout (FLODiagram)    │
├──────────────────────────────┤
│ [A]──▶[B]──▶[C]              │
│         │     ▼              │
│         └──▶[D]──▶[E]        │
└──────────────────────────────┘
```

### — 팝업 (67개)

#### PopAccount

- 경로: `view/supplychainmodel/common/PopAccount.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_GET_ACCOUNT_GRID_LIST`

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

#### PopCommAccount

- 경로: `view/supplychainmodel/common/PopCommAccount.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_GET_ACCOUNT_GRID_LIST`

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

#### PopCommItem

- 경로: `view/supplychainmodel/common/PopCommItem.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, WorkArea:1, BaseGrid:1, InputField:4, PopupDialog:1
- 호출: `engine/mp/SRV_GET_COMBO_LIST` · `engine/mp/`

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

#### PopCommItemClass

- 경로: `view/supplychainmodel/common/PopCommItemClass.jsx`
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

#### PopCommItemLoc

- 경로: `view/supplychainmodel/common/PopCommItemLoc.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, WorkArea:1, BaseGrid:1, InputField:3, PopupDialog:1
- 호출: `engine/mp/SRV_GET_COMBO_LIST` · `engine/mp/SRV_UI_CM_11_POP_Q2`

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

#### PopCommItemLv

- 경로: `view/supplychainmodel/common/PopCommItemLv.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, WorkArea:1, BaseGrid:1, InputField:3, PopupDialog:1
- 호출: `engine/mp/SRV_GET_COMBO_LIST` · `engine/mp/SRV_UI_CM_04_POP_01_Q`

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

#### PopCommItemTree

- 경로: `view/supplychainmodel/common/PopCommItemTree.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, BaseGrid:1, TreeGrid:1, InputField:4, PopupDialog:1
- SP: `SP_UI_DP_00_CONF_Q1_01` · `SP_UI_DP_00_CONF_Q1_02` · `SP_UI_DP_00_CONF_Q1_03` · `SP_UI_DP_00_CONF_Q1` · `SP_UI_IM_00_ITEM_TREE_LV_DATA_Q1`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_00_CONF_Q1` · `engine/mp/SRV_UI_IM_00_POPUP_ITEM_TREE_Q2` · `engine/mp/SRV_GET_SP_UI_IM_00_ITEM_TREE_LV_DATA_Q1`

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

#### PopCommResource

- 경로: `view/supplychainmodel/common/PopCommResource.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, WorkArea:1, BaseGrid:1, InputField:4, PopupDialog:1
- 호출: `engine/mp/SRV_GET_RES_GRID_LIST`

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

#### PopCommSimulationVersion

- 경로: `view/supplychainmodel/common/PopCommSimulationVersion.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, BaseGrid:1, InputField:4, PopupDialog:1
- 호출: `engine/T3SeriesSupplyNetServer/SRV_COMM_SRH_VER_Q`

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

#### PopComponentItem

- 경로: `view/supplychainmodel/productionbom/PopComponentItem.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_CM_05_Q2`

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

#### PopConfirmSubjectPlan

- 경로: `view/supplychainmodel/planscenario/PopConfirmSubjectPlan.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_CM_16_Q2`

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

#### PopCurcy

- 경로: `view/supplychainmodel/common/PopCurcy.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_CM_04_POP_01_Q`

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

#### PopCyclCalendar

- 경로: `view/supplychainmodel/common/PopCyclCalendar.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_SP_UI_IM_26_Q4`

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

#### PopDailyExceptionSchedule

- 경로: `view/supplychainmodel/siteshipmentschedule/PopDailyExceptionSchedule.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, PopupDialog:1
- SP: `SP_UI_CM_08_POP_02_S_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_08_POP_01_Q` · `engine/mp/SRV_UI_CM_08_POP_02_S`

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

#### PopDemandAccount

- 경로: `view/supplychainmodel/common/PopDemandAccount.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_GET_ACCOUNT_GRID_LIST`

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

#### PopDemandItem

- 경로: `view/supplychainmodel/common/PopDemandItem.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, BaseGrid:1, InputField:4, PopupDialog:1
- 호출: `engine/mp/SRV_GET_COMBO_LIST` · `engine/mp/SRV_GET_ITEM_GRID_LIST`

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

#### PopDemanditem02

- 경로: `view/supplychainmodel/common/PopDemanditem02.jsx`
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

#### PopDemandItem03

- 경로: `view/supplychainmodel/common/PopDemandItem03.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, BaseGrid:1, InputField:3, PopupDialog:1
- 호출: `engine/mp/SRV_GET_COMBO_LIST` · `engine/mp/SRV_UI_COMM_DATA_Q`

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

#### PopDemandItem04

- 경로: `view/supplychainmodel/common/PopDemandItem04.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, BaseGrid:1, InputField:3, PopupDialog:1
- 호출: `engine/mp/SRV_GET_COMBO_LIST` · `engine/mp/SRV_UI_COMM_DATA_Q`

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

#### PopDemandLocat

- 경로: `view/supplychainmodel/common/PopDemandLocat.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_GET_LOCAT_GRID_LIST`

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

#### PopDemandMappingCreate

- 경로: `view/supplychainmodel/demandmapping/PopDemandMappingCreate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: TabContainer:1, InputField:25, PopupDialog:1
- SP: `SP_UI_CM_CODE` · `SP_UI_CM_12_BATCH_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_12_BATCH`

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

#### PopDemandMappingNew

- 경로: `view/supplychainmodel/demandmapping/PopDemandMappingNew.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: TabContainer:1, InputField:12, PopupDialog:1

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

#### PopDemandSalesLevel

- 경로: `view/supplychainmodel/common/PopDemandSalesLevel.jsx`
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

#### PopDifGrade

- 경로: `view/supplychainmodel/siteitem/PopDifGrade.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/dp/SRV_UI_CM_01_POP_01_Q`

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

- 경로: `view/supplychainmodel/generalconfig/PopGeneralConfig.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, PlanScope:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_CM_CODE`

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

#### PopGeneralConfigMulti

- 경로: `view/supplychainmodel/generalconfig/PopGeneralConfigMulti.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=2
- 컴포넌트: BaseGrid:2, GridAddRowButton:2, GridDeleteRowButton:2, GridSaveButton:2, PlanScope:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_CM_CODE`

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

#### PopGeneralConfigTab

- 경로: `view/supplychainmodel/generalconfig/PopGeneralConfigTab.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=3
- 컴포넌트: BaseGrid:3, TabContainer:1, GridAddRowButton:3, GridDeleteRowButton:3, PopupDialog:1
- SP: `SP_UI_IM_01_POP_05_S2_P_RT_MSG` · `SP_UI_IM_01_POP_05_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_CODE`

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

#### PopHoliday

- 경로: `view/supplychainmodel/siteshipmentschedule/PopHoliday.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, PopupDialog:1
- SP: `SP_UI_CM_08_POP_04_S_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_08_POP_01_Q` · `engine/mp/SRV_UI_CM_08_POP_04_S`

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

#### PopLocationBundleCreate

- 경로: `view/supplychainmodel/site/PopLocationBundleCreate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:5, PopLocatMst:1, PopupDialog:1
- SP: `SP_UI_CM_02_BATCH_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_02_BATCH`

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

#### PopLocationItem

- 경로: `view/supplychainmodel/common/PopLocationItem.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, WorkArea:1, BaseGrid:1, InputField:4, PopupDialog:1
- 호출: `engine/mp/SRV_GET_LOCAT_ITEM_LIST`

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

#### PopLocationMaster

- 경로: `view/supplychainmodel/site/PopLocationMaster.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_CM_01_POP_01_Q`

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

- 경로: `view/supplychainmodel/siteshipmentschedule/PopMonthlyExceptionSchedule.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, PopupDialog:1
- SP: `SP_UI_CM_08_POP_03_S_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_08_POP_01_Q` · `engine/mp/SRV_UI_CM_08_POP_03_S`

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

#### PopNewChildBom

- 경로: `view/supplychainmodel/productionbom/PopNewChildBom.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:18, PopupDialog:1
- SP: `SP_UI_CM_05_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_05_S2`

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

#### PopNewParentBom

- 경로: `view/supplychainmodel/productionbom/PopNewParentBom.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:11, PopupDialog:1
- SP: `SP_UI_CM_05_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_05_S1`

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

#### PopNewPeriodActiveBom

- 경로: `view/supplychainmodel/productionbom/PopNewPeriodActiveBom.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: TabContainer:1, InputField:10, PopupDialog:1
- SP: `SP_UI_CM_05_S3_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_05_S3`

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

#### PopNewPeriodBomRate

- 경로: `view/supplychainmodel/productionbom/PopNewPeriodBomRate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: TabContainer:1, InputField:16, PopupDialog:1
- SP: `SP_UI_CM_05_S4_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_05_S4`

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

#### PopParentComponentItem

- 경로: `view/supplychainmodel/productionbom/PopParentComponentItem.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, BaseGrid:1, InputField:4, PopupDialog:1
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

#### PopPeggingAttr

- 경로: `view/supplychainmodel/common/PopPeggingAttr.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/`

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

#### PopPeriodSourcingPolicy

- 경로: `view/supplychainmodel/sitebod/PopPeriodSourcingPolicy.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, TabContainer:1, InputField:6, PopupDialog:1
- SP: `SP_UI_CM_06_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_06_POP_02_Q` · `engine/mp/SRV_UI_CM_06_S2`

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

#### PopPlanningBomBundleCreate

- 경로: `view/supplychainmodel/planningbom/PopPlanningBomBundleCreate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:4, PopupDialog:1
- SP: `SP_UI_CM_11_BATCH_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_11_BATCH`

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

#### PopPlanningBomGrid1New

- 경로: `view/supplychainmodel/planningbom/PopPlanningBomGrid1New.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:10, PopupDialog:1
- SP: `SP_UI_CM_11_POP_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_11_POP_S2`

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

#### PopPlanningBomGrid2New

- 경로: `view/supplychainmodel/planningbom/PopPlanningBomGrid2New.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, TabContainer:1, InputField:10, PopupDialog:1
- SP: `SP_UI_CM_11_S3_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_11_POP_Q1` · `engine/mp/SRV_UI_CM_11_S3`

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

#### PopPlanPolicy

- 경로: `view/supplychainmodel/planscenario/PopPlanPolicy.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_CM_16_Q2`

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

#### PopPlanScenario

- 경로: `view/supplychainmodel/generalconfig/PopPlanScenario.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_CM_16_Q1`

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

#### PopPlanScenario

- 경로: `view/supplychainmodel/planscenario/PopPlanScenario.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:4, PopupDialog:1
- SP: `SP_UI_CM_16_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_15_Q1` · `engine/mp/SRV_UI_CM_16_S1`

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

#### PopPlanScenarioStep

- 경로: `view/supplychainmodel/planscenario/PopPlanScenarioStep.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, TabContainer:1, GridAddRowButton:1, GridDeleteRowButton:1, InputField:12, PopupDialog:1
- SP: `SP_UI_CM_16_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_15_Q1` · `engine/mp/SRV_UI_CM_16_Q2` · `engine/mp/SRV_UI_CM_16_S2`

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

#### PopPoCycleCalendar

- 경로: `view/supplychainmodel/common/PopPoCycleCalendar.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- SP: `SP_UI_RP_PO_CYCLE_CALENDAR_Q1`
- 호출: `common/data`

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

- 경로: `view/supplychainmodel/sitewarehouse/PopPopLocat.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_CM_13_POP_01_Q`

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

#### PopPopParentComponentItem

- 경로: `view/supplychainmodel/productionbom/PopPopParentComponentItem.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=2
- 컴포넌트: SearchArea:1, WorkArea:1, BaseGrid:2, InputField:4, PopupDialog:1
- 호출: `engine/mp/SRV_GET_COMBO_LIST` · `engine/mp/SRV_UI_CM_05_POP_01_Q` · `engine/mp/SRV_UI_CM_05_Q6`

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

#### PopProcedure

- 경로: `view/supplychainmodel/planscenario/PopProcedure.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_CM_16_Q2`

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

#### PopProductionBomBundleCreate

- 경로: `view/supplychainmodel/productionbom/PopProductionBomBundleCreate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:4, PopupDialog:1
- SP: `SP_UI_CM_05_BATCH_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_05_BATCH`

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

#### PopSABC

- 경로: `view/supplychainmodel/common/PopSABC.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_IM_08_Q3`

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

#### PopShipmentLtBundleCreate

- 경로: `view/supplychainmodel/shipmentlt/PopShipmentLtBundleCreate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:8, PopLocatTp:1, PopupDialog:1
- SP: `SP_UI_CM_07_BATCH_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_07_BATCH`

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

#### PopShipmentLtGridNew

- 경로: `view/supplychainmodel/shipmentlt/PopShipmentLtGridNew.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=2
- 컴포넌트: BaseGrid:2, TabContainer:1, PopupDialog:1
- SP: `SP_UI_CM_07_POP_S1_P_RT_MSG` · `SP_UI_CM_07_POP_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_07_POP_S1` · `engine/mp/SRV_UI_CM_07_POP_S2`

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

#### PopShipmentSchedule

- 경로: `view/supplychainmodel/siteshipmentschedule/PopShipmentSchedule.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, InputField:9, PopupDialog:1
- SP: `SP_UI_CM_08_POP_01_S_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_08_POP_01_Q` · `engine/mp/SRV_UI_CM_08_POP_01_S`

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

#### PopSiteBod

- 경로: `view/supplychainmodel/sitebod/PopSiteBod.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, TabContainer:1, GridAddRowButton:1, GridDeleteRowButton:1, InputField:4, PopLocatTp:1, PopupDialog:1
- SP: `SP_UI_CM_06_POP_01_S_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_06_POP_02_Q` · `engine/mp/SRV_UI_CM_06_POP_01_S`

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

#### PopSiteBodBundleCreate

- 경로: `view/supplychainmodel/sitebod/PopSiteBodBundleCreate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:3, PopupDialog:1
- SP: `SP_UI_CM_06_BATCH_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_06_BATCH`

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

#### PopSiteItemBatchUpdate

- 경로: `view/supplychainmodel/siteitem/PopSiteItemBatchUpdate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: TabContainer:1, InputField:63, PopLocatTp:2, PopupDialog:1
- SP: `SP_UI_CM_04_BATCH_UPDATE_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_04_BATCH_UPDATE`

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

#### PopSiteItemBundleCreate

- 경로: `view/supplychainmodel/siteitem/PopSiteItemBundleCreate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:11, PopLocatTp:1, PopupDialog:1
- SP: `SP_UI_CM_04_BATCH_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_04_BATCH`

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

#### PopSiteItemNew

- 경로: `view/supplychainmodel/siteitem/PopSiteItemNew.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: TabContainer:1, InputField:34, PopLocatTp:1, PopupDialog:1
- SP: `SP_UI_CM_04_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_04_S2`

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

#### PopSiteWarehouse

- 경로: `view/supplychainmodel/sitewarehouse/PopSiteWarehouse.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, TabContainer:1, GridAddRowButton:1, GridDeleteRowButton:1, InputField:9, PopLocatTp:1, PopupDialog:1
- SP: `SP_UI_CM_13_POP_02_S1_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_13_POP_03_Q` · `engine/mp/SRV_UI_CM_13_POP_02_S1` · `engine/mp/SRV_UI_CM_13_POP_02_S2`

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

#### PopStockType

- 경로: `view/supplychainmodel/common/PopStockType.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- SP: `SP_UI_IM_12_S3_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_IM_12_S3`

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

#### PopSupplyLocation

- 경로: `view/supplychainmodel/sitebod/PopSupplyLocation.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_CM_06_POP_Q1`

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

#### PopTransportationBundleCreate

- 경로: `view/supplychainmodel/transportation/PopTransportationBundleCreate.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: TabContainer:1, InputField:11, PopupDialog:1
- SP: `SP_UI_CM_10_BATCH_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_CM_10_BATCH`

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

#### PopTransportationGridNew

- 경로: `view/supplychainmodel/transportation/PopTransportationGridNew.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=2
- 컴포넌트: BaseGrid:2, TabContainer:1, InputField:8, PopupDialog:1
- SP: `SP_UI_CM_10_POP_S1_P_RT_MSG` · `SP_UI_CM_10_POP_S2_P_RT_MSG`
- 호출: `engine/mp/SRV_UI_COMM_DATA_Q` · `engine/mp/SRV_UI_CM_10_POP_S1` · `engine/mp/SRV_UI_CM_10_POP_S2`

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

#### PopUILink

- 경로: `view/supplychainmodel/planscenario/PopUILink.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_CM_16_Q2`

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

#### PopWhType

- 경로: `view/supplychainmodel/common/PopWhType.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, PopupDialog:1
- 호출: `engine/mp/SRV_UI_IM_11_Q2`

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

### — 위젯 (2개)

#### SupplyChainMap

- 경로: `view/supplychainmodel/widgets/supplychainview/SupplyChainMap.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### SupplyChainView

- 경로: `view/supplychainmodel/widgets/supplychainview/SupplyChainView.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- SP: `SP_UI_CM_SUPPLYCHAIN`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

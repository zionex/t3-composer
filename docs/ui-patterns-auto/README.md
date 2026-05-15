# T3Series UI 패턴 카탈로그

> Phase 2 산출물 — `ui-patterns-gen.cjs` 로 자동 생성. 입력: `docs/reference/ui-inventory.json`.
> 모든 화면을 모듈별로 분류한 카탈로그입니다. 패턴 코드 / ASCII 미리보기 / 컴포넌트 stack / SP 매핑을 한자리에.

## 전체 통계

- 총 화면: **992**
- 등록 메뉴 (UI_*): **220** (22.2%)
- 분류 confidence — high **627** (63.2%) · mid **156** (15.7%) · low **209** (21.1%)

## 모듈 인덱스

| 모듈 | 화면 수 | 링크 |
|---|---:|---|
| factoryplan | 200 | [factoryplan.md](./factoryplan.md) |
| masterplan | 162 | [masterplan.md](./masterplan.md) |
| snop | 134 | [snop.md](./snop.md) |
| demandplan | 103 | [demandplan.md](./demandplan.md) |
| supplychainmodel | 98 | [supplychainmodel.md](./supplychainmodel.md) |
| util | 91 | [util.md](./util.md) |
| inventoryplan | 55 | [inventoryplan.md](./inventoryplan.md) |
| baselineforecast | 38 | [baselineforecast.md](./baselineforecast.md) |
| replenishmentplan | 29 | [replenishmentplan.md](./replenishmentplan.md) |
| system | 28 | [system.md](./system.md) |
| common | 22 | [common.md](./common.md) |
| factoryorder | 9 | [factoryorder.md](./factoryorder.md) |
| supplyorder | 7 | [supplyorder.md](./supplyorder.md) |
| dashboard | 6 | [dashboard.md](./dashboard.md) |
| home | 6 | [home.md](./home.md) |
| pages | 4 | [pages.md](./pages.md) |

## 레이아웃 카테고리 분포

| 카테고리 | 화면 수 |
|---|---:|
| 01 미분할 (단일) | 465 |
| 11 상하 2분할 | 60 |
| 12 상하 3분할 | 2 |
| 13 상하 4분할 | 1 |
| 21 좌우 2분할 | 1 |
| 31 혼합·격자·특수 | 6 |
| 91 ControlBoard | 4 |
| 93 Monitoring | 2 |
| 95 RouteLayout | 22 |
| — 팝업 | 223 |
| — 위젯 | 183 |
| — 서브컴포넌트 | 16 |
| — Base 래퍼 | 7 |

## 패턴 → 화면 Reverse Index

각 패턴이 어떤 화면들에서 사용되는지. 화면명 클릭 시 해당 모듈 markdown 의 섹션으로 이동(앵커는 생성 안 함, 모듈 파일에서 검색).

### 팝업 다이얼로그 — `popup` (223개)

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

- **masterplan** (85): PopAccount, PopAdjustShppPlan, PopAllRoute, PopConfirmAdjPlan, PopConfirmPlan, PopCycleConsecutiveBundleCreate, PopDemandInfo, PopDemandOverview, PopDemandOverviewBatchUpdate, PopDetailProductionPlan, PopDueInTrack, PopGradeByProduct, … (총 85개)
- **supplychainmodel** (67): PopAccount, PopCommAccount, PopCommItem, PopCommItemClass, PopCommItemLoc, PopCommItemLv, PopCommItemTree, PopCommResource, PopCommSimulationVersion, PopComponentItem, PopConfirmSubjectPlan, PopCurcy, … (총 67개)
- **common** (15): PopAccountMulti, PopDepartment, PopItemMulti, PopKpiWeightConfig, PopLocatMst, PopLocatTp, PopLocatTpMulti, PopPersonalize, PopPersonalizeDp, PopResourceMulti, PopRouteMulti, PopSelectAccount, … (총 15개)
- **demandplan** (15): PopAccountLv, PopAccountTree, PopComment, PopExtraParam, PopItemLv, PopItemTree, PopItemTreeList, PopMapUserTransfer, PopMeasure, PopMeasureCopy, PopMeasureFormula, PopMultiMap, … (총 15개)
- **snop** (14): PopAggrField, PopAggrList, PopAggrSetting, PopBeforeSave, PopDeleteOption, PopMettingCopy, PopSaveOption, PopSelectAttendee, PopSelectMenu, PopShowList, PopSnopCalendar, PopSnopCalendarShowList, … (총 14개)
- **replenishmentplan** (8): PopExceptionSchedule, PopMonthlyExceptionSchedule, PopOrderCycleCalendar, PopOrderCycleCalendarNew, PopReplenishmentPolicyBatchUpdate, PopReplenishmentPolicyCreate, PopSelectLocation, PopWarehouseStock
- **inventoryplan** (6): PopColorPalette, PopStockCostBundleCreate, PopStockRange, PopStorageLocationNew, PopStoragelocation, PopWarehouseStock
- **baselineforecast** (5): PopForecastResultAccount, PopForecastResultItem, PopScenarioKpiWeightConfig, PopSelectItemLvItem, PopSelectSalesLvAccount
- **factoryplan** (3): PopFpInsightFeature, PopGeneralConfig, PopPlanScope
- **system** (3): PopColorPicker, PopPreferenceOptions, PopSelectUser
- **util** (2): PopNoticeDetail, PopNoticeSetting

### 비표준 / 자유 폼 — `free_form` (209개)

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

- **util** (75): ApiKeyDialog, ArtifactApplyDialog, ArtifactPanel, CbChartMockup, CbGanttMockup, ChartTypeTab, ChartViewMockup, ChatPanel, ComposerWorkspace, ControlBoardMockup, DataImportback, FlowDiagram, … (총 75개)
- **demandplan** (30): AccountSearchInput, AllReport, AllReport, AllReportChart, AllReportChart, AntSwitch, ControlBoardMaster, DemandOrder, DrawerMemo, Entry, Entry, EntryChart, … (총 30개)
- **factoryplan** (23): AdjustDetailTab, AdjustQtyPopup, CustomComponent, CustomComponent, EditEventDialog, EditEventDialog, EngineRun, OnTimeRate, ResourceCalendar, ResourceDownTimeCalendarTab, ScenarioComparePanel, ScenarioScriptPopup, … (총 23개)
- **masterplan** (19): AllocationRulePartialPlan, AllocationRuleSite, ColorInputMp, CustomComponent, DemandFacingLevel, General, GeneralConfig, InTransitStock, MpComparativeReportDrawer, MpSimulationComparison, PlanOption, PlanPolicy, … (총 19개)
- **replenishmentplan** (13): AllocationRulePartialPlan, DemandDistribution, DemandOrderTracking, DemandOverview, General, InTransitStock, PlanOption, PlanPolicy, PlanPriority, PlanScenario, PlanningMethod, RpSimulationComparison, … (총 13개)
- **snop** (13): AgendaContentEditor, AgendaList, EditableDiv, FileList, ItemMeetTarget, ItemTree, Keymetrics, MenuList, MyGoogleMap, Setup, SnopCalendar, UserSearchInput, … (총 13개)
- **supplychainmodel** (11): AccountMultiSearchBox, AccountSearchCondition, ItemMultiSearchBox, ItemSearchBox, ItemSearchCondition, LocationMultiSearchBox, LocationSearchBox, LocationSearchCondition, PlanScope, ResourceMultiSearchBox, SimulationVersionCondition
- **common** (6): IconPicker, LlmMarkdown, LogPopup, SearchInputStyles, SimulationAiPanel, SimulationComparisonTable
- **home** (5): Calendar, CalendarPopup, NoticeDetails, NoticeList, home
- **baselineforecast** (4): ForecastresultDrawer, Scenario, Setup, ValidationAccordion
- **pages** (4): Loading, Login, NoContent, Password
- **factoryorder** (2): OrderConversionPopup, OrderCreation
- **inventoryplan** (2): GeneralConfig, ImSimulationComparison
- **supplyorder** (2): SoSplitDialog, SoTransform

### P02 검색 + 그리드 (마스터 CRUD) — `search_grid` (101개)

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

- **factoryplan** (20): AdjustmentGrid2, DispatchList, InoutStatus, ItemLeadTime, JobChangeTimeInfo, MaterialPsi, PlanDetail, PlanProblem, PlanResult, ProdCustomer, ProdSalesStockStatus, PsiDetail, … (총 20개)
- **demandplan** (13): Account, ActualSales, CompareVersion, DevMakeData, DimData, DimensionSet, EntryExtra, EntryLog, Item, Measure, MeasureData, MeasureSet, … (총 13개)
- **masterplan** (12): CycleConsecutive, ItemProductionCalendar, MaterialConstraint, MaterialSupplyCalendar, MaxOpresGrp, MpComparative, PlanDetail, PlannedOrder, PreBuildLimit, ProblemAnalysis, SiteIncomingCalendar, Wip
- **inventoryplan** (11): AbcxyzAnalysisResult, DemandRateBase, InTransitStock, InventoryDetail, SalesShippingHistoryCheck, ShippingActual, StockCost, StorageLocation, TargetInventoryResult, TargetInventoryResultPeriod, WarehouseStock
- **system** (11): AdminHistory, EngineHistory, JobScheduleMgmt, LoginHistory, MenuBadge, Multilingual, SchedulerJobHistory, ThemeMgmt, TimeHistory, UserDelegation, Users
- **supplychainmodel** (9): DemandMapping, Item, ItemShipmentSchedule, ShipmentLt, ShippingCalendar, Site, SiteItem, SiteShipmentSchedule, SiteWarehouse
- **baselineforecast** (8): AbcAnalysis, ActualSales, DateFactor, Factor, ForecastError, ForecastTarget, SalesFactor, Validation
- **util** (5): DataImportHistory, DeptMgmt, IssueMgmt, NoticeBoard, UserInfo
- **replenishmentplan** (4): OrderCycleCalendar, PoList, ReplenishmentPolicy, RpTarget
- **factoryorder** (3): Mrp, OrderAdjustment, RequestAnalysis
- **snop** (3): AggrMstList, Demand, FlxReportView
- **common** (1): CommonCodeSelect
- **supplyorder** (1): SoItemTrend

### 위젯 (차트) — `widget_chart` (94개)

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

- **snop** (55): AopVsDp, DashboardWidget01, DashboardWidget02, DashboardWidget03, DashboardWidget05, DashboardWidget06, DashboardWidget07, DashboardWidget08, DashboardWidget09, DashboardWidget10, DashboardWidget11, DashboardWidget12, … (총 55개)
- **inventoryplan** (14): CurrentInventory, InventoryDays, InventoryTrend, LocatLossDistribution, LocatLossTrend, LocatObsoleteStockDistribution, LocatReturnDistribution, LocatReturnTrend, ObsoleteStatus, ObsoleteStockDistribution, SalesTrend, SlowMovingDetail, … (총 14개)
- **demandplan** (10): DpPlanStatusY, DpTopSalesItemgrp, DpYearActualSales, DpYearTargetSales, ForecastPlan, PlanStatus, SalesPlanDistribution, SalesProgress, SupplySufRate, TeamSalesPlan
- **factoryplan** (10): DailyProductionPerformanceByProduct, FpBar, FpBarLine, FpBarStack, FpBarStackLine, FpCircularSum, FpCumulativeBarLine, SimulationKpiBedResrcUtil, SimulationKpiWorkerResrcUtil, TotalProductionPerformancePerDay
- **masterplan** (3): CapacityLoadCondition, DemandSupplyFulfill, LocatSupplyTrend
- **baselineforecast** (2): BestSelectModel, DemandForecastResult

### 위젯 (자유) — `widget_misc` (49개)

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

- **factoryplan** (22): InOutStatus, InputPlanComplianceRate, InputTrend, KpiPlanResultDeliveryStatusSummary, PlanAgainstPerformance, PlanAgainstPerformanceStack, PlanAgainstPrfmPrbm, PlanAgainstPrfmPrbmStack, PlanAgainstPrfmProdPrbmItemGrp, PlanAgainstPrfmProdPrbmStack, PlanResultDeliveryDelayStatus, PlanResultDeliveryShortStatus, … (총 22개)
- **masterplan** (9): AllDemand, AllSupply, Boh, DemandFulfillment, DemandFulfillmentRate, LocatInventoryTurnover, LocatTotalInventory, LocatTotalShipment, LocatTotalSupply
- **demandplan** (6): Accuracy, DpTopSalesAccount, DpTopSalesItem, DpTopSalesMap, PlanProgress, SalesAlerts
- **inventoryplan** (5): LocationInventoryStatus, LocationMap, PotentialLoss, StockoutSku, TotalDemand
- **snop** (3): DashboardWidget04, DashboardWidget25, DashboardWidget27
- **baselineforecast** (2): DataValidation, GroupAccuracy
- **supplychainmodel** (2): SupplyChainMap, SupplyChainView

### P01 위젯 대시보드 — `widget_dashboard` (48개)

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

- **snop** (18): ChartDashboard, ExecutiveDashboard, OntimeSales, OntimeSalesDetail, OntimeSalesPrbl, SalesGrowthRate, SalesGrowthRateDetail, SalesMPPlan, SalesMPPlanDetail, SalesPlanStateDetail, SupplyMatPsi, SupplyMatPsiDetail, … (총 18개)
- **factoryplan** (10): FpVersusPerformance, InOutStatusDashboard, InOutStatusDetailDashboard, InputOrderBoard, PlanAgainstPrfmDashboard, PlanAgainstPrfmDetailDashboard, PlanProblemDashboard, ProductionPerformance, SimulationKPIDashboard, WipEohOutDashboard
- **dashboard** (6): InvenBoard, KpiBoard, Overview, PsiBoard, SalesBoard, SupplyBoard
- **inventoryplan** (6): InventoryBoard, InventoryLocationBoard, LossInventory, Obsolete, ReturnInventory, SlowMoving
- **demandplan** (2): DemandPlanBoard, SalesBoard
- **masterplan** (2): MasterPlanBoard, SupplyTrend
- **baselineforecast** (1): BaselineForecastBoard
- **home** (1): Home
- **supplychainmodel** (1): SupplyChainViewer
- **util** (1): DashboardTool

### P02b 그리드 전용 (검색 없음) — `P02b_grid_only` (47개)

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

- **factoryplan** (34): AdjustResourcePlanDetailTab, BorTab, CalendarCopyPopup, CalendarCopyPopup, CustomerMasterPopup, CustomerPopup, DemandPopup, DemandTab, DetailGrid, InventoryPopup, InventoryTab, ItemGroupJobChangeTab, … (총 34개)
- **masterplan** (5): AllocationRuleResource, ConfirmedPlanningLevel, InFinitePlanningLevel, SubPlanPriority, Validation
- **system** (3): PropertiesPanal, SchedulerJobMgmt, ServerStatus
- **demandplan** (1): Validation
- **factoryorder** (1): OrderDetailAdjustmentPopup
- **replenishmentplan** (1): InFinitePlanningLevel
- **snop** (1): SnopIssueList
- **supplychainmodel** (1): GeneralConfig

### v2 차트 + 그리드 (수직 스택) — `grid_chart_stacked` (32개)

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

- **baselineforecast** (9): Accuracy, AccuracyAnalysisReport, ErrorCompare, FactorAnalysis, ForecastResult, RiskAnalysis, SalesAnalysis, VersionCompare, VersionErrorCompare
- **masterplan** (6): DemandDistribution, ResProdPlan, ResProductionPlanning, ResUtilization, Rtf, ShortLateReason
- **demandplan** (5): CompareSalesDp, CompareVerProgress, EntryNotify, RtfAnalysis, SalesPerformance
- **snop** (4): DemandRisk, Fact, Map, SalesPlanState
- **inventoryplan** (3): DemandVariabilityAnalysis, ImSimulationCompare, SupplyVariabilityAnalysis
- **supplyorder** (3): DpAnalysis, SoAdjust, SoAnalysis
- **replenishmentplan** (2): RpComparative, RpResult

### v2 듀얼 그리드 2-stack — `v2_dual_grid` (28개)

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

- **demandplan** (7): Config, ExchangeRate, Level, PlanCheckSales, SalesAuthMap, SalesPrice, UserSalesMap
- **system** (6): GroupPermission, PlanScopeUser, PlanScopeUserGroup, Preference, UserGroup, UserPermission
- **factoryplan** (4): AdjustmentGrid1, FpConfiguration, ToolSettingTab, ToolSupplyTab
- **supplychainmodel** (4): PlanScenario, PlanningBom, SiteBod, Transportation
- **masterplan** (3): ItemClassification, ItemResPreference, MPSimulation
- **baselineforecast** (2): Config, NewTargetSalesMap
- **inventoryplan** (1): Abcxyz
- **replenishmentplan** (1): RPSimulation

### P03 검색 + 탭 그리드 — `search_tab` (27개)

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

- **masterplan** (13): ByProduct, ConsumptionPlan, DemandOverview, ItemResCapacity, ItemStatus, JobChangeTime, MpResult, PlantResCalendar, ProductMixMax, ProductMixMin, ResStatus, Resource, … (총 13개)
- **factoryplan** (9): AdjustmentGantt, AdjustmentGrid3, Bom, Bor, Item, JobChangeTime, Order, ResourceDownTime, ResourceGantt
- **inventoryplan** (2): GradeTarget, TargetInventorySimulation
- **supplyorder** (1): SoPopRegister
- **system** (1): PlanScope
- **util** (1): DataImport

### 위젯 (그리드) — `widget_grid` (27개)

```
┌────────────────────┐
│ Widget Grid        │
│ ╶─┬─┬─┬─╴           │
└────────────────────┘
```

- **factoryplan** (17): InputDelayedProductionOrder, InputStatus, InventoryStatusByProduct, KpiProblemDetailGrid, OutputStatus, POFinishFpPlanPerformance, POInputPlanPerformance, PlanVsActualDetailGrid, ProblemDetailGrid, RouteGrpTargetActl, RouteOutGrid, RouteWip, … (총 17개)
- **inventoryplan** (5): ExcessAlert, LocatLoss, LocatObsoleteStock, LocatReturn, StockoutAlert
- **snop** (4): OntimeSales4, SalesGrowthRateDetail1, SalesPlanStateGrid, SupplyMatPsiDetail
- **masterplan** (1): LocatSkuStatus

### P09 차트 단독 — `P09_chart_view` (23개)

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│   ▁ ▃ ▅ ▇ █ ▇ ▅ ▃            │
│   ●─●─●─●─●─●                │
│   (ChartComponent)           │
└──────────────────────────────┘
```

- **factoryplan** (17): DeliveryDelayStatus, DeliveryShortStatus, DeliveryStatusSummary, InoutStatusChart, ItemLeadTimeChart, JobChangeTimeInfoChart, LeadTime, MaterialPsiChart, PlanResultChart, ProdCustomerChart, ProdDisruptionChart, ProdSalesStockStatusChart, … (총 17개)
- **factoryorder** (3): MrpChart, OrderAdjustmentChart, RequestAnalysisChart
- **snop** (3): ChartExample, PopulationPopup, PsiBalance

### RL 라우트 레이아웃 (FLO) — `rl_layout_design` (22개)

```
┌──────────────────────────────┐
│ Route Layout (FLODiagram)    │
├──────────────────────────────┤
│ [A]──▶[B]──▶[C]              │
│         │     ▼              │
│         └──▶[D]──▶[E]        │
└──────────────────────────────┘
```

- **factoryplan** (10): BomDiagram, ByproductDiagram, Flo, OrderTrackingDiagram, Route, RouteGroupJobChangeTab, RouteGroupMasterPopup, RouteGroupPopup, RouteJobChangeTab, RoutePopup
- **util** (4): PatternFormDialog, PatternSelector, RouteLayoutMockup, T3ComposerPatterns
- **supplychainmodel** (3): Flo, ProductionBom, RouteMultiSearchBox
- **demandplan** (2): ItemHierarchy, SalesHierarchy
- **masterplan** (2): DemandOrderTracking, RouteClassification
- **baselineforecast** (1): ItemMapFLODiagram

### 서브 컴포넌트 — `subcomponent` (16개)

```
┌─────────────┐
│ Sub Comp.   │
└─────────────┘
```

- **factoryplan** (14): ActualSearchCondition, ChartDateRange, ChartWithDateRange, ClickableListPanel, CommonActiveScreen, DetailCard, DetailsSplitArea, PeriodSearchGroup, PlanScope, PsnlItems, SearchOptsGroup, VersionPlantSearchCondition, … (총 14개)
- **baselineforecast** (2): AbcXyzBox, heatmap

### 위젯 (피벗) — `widget_pivot` (13개)

```
┌────────────────────┐
│ Widget Pivot       │
│  A 100  B 200      │
└────────────────────┘
```

- **snop** (13): OntimeSales2, OntimeSalesAnalysis2, OntimeSalesDetail2, PivotTest, RTFSatisfactionAnalysis, RTFSatisfactionAnalysisDetail, SalesPlanDetailGrid, SupplyMatPsiGrid, SupplyPlanKpiDtl1Grid, SupplyPlanKpiDtl2Grid, SupplyPlanKpiDtl3Grid, SupplyPlanKpiDtl4Grid, … (총 13개)

### P04 트리 그리드 — `h2_tree_grid` (8개)

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

- **factoryplan** (4): Byproduct, DeliveryStatus, OrderTracking, StagePopup
- **demandplan** (2): TreeListSelectInput, TreeSelectInput
- **snop** (1): WidgetMgmt
- **system** (1): MenuMgmt

### Base 래퍼 — `base_wrapper` (7개)

```
┌─────────────┐
│ Base*.jsx   │
│ (wrapper)   │
└─────────────┘
```

- **demandplan** (6): BaseAllReport, BaseControlBoard, BaseControlBoardMaster, BaseEntry, BasePlanPolicy, BaseProcessStatus
- **util** (1): BaseWrapperMockup

### 혼합 분할 — `mix_split` (6개)

```
┌──────────────────────────────┐
│ Search                       │
├──────────┬───────────────────┤
│ Tree     │ Top: Chart        │
│          ├───────────────────┤
│          │ Bottom: Grid      │
└──────────┴───────────────────┘
```

- **snop** (2): FlxReport, Meeting
- **system** (2): CommonCode, License
- **demandplan** (1): PlanCheckItem
- **util** (1): ModeNewFromDesign

### CB 마스터 컨트롤보드 — `cb_master_dashboard` (4개)

```
┌──────────────────────────────┐
│ Version status · Step bar    │
├──────┬───────────┬───────────┤
│ KPI  │ Chart     │ Log/Alert │
├──────┴───────────┴───────────┤
│ Engine execution grid        │
└──────────────────────────────┘
```

- **baselineforecast** (2): ControlBoard, IsControlBoard
- **demandplan** (2): ControlBoard, ControlBoard

### v3 멀티 그리드 3-stack — `v3_multi_grid` (2개)

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

- **demandplan** (1): UserLevelMap
- **factoryplan** (1): BorSetTab

### 간트 단독 — `gantt_view` (2개)

```
┌──────────────────────────────┐
│ Gantt View                   │
├──────────────────────────────┤
│ ▓▓▓░░░░░░░░░░░░░░░░░         │
│ ░░▓▓▓▓▓░░░░░░░░░░░░          │
│ ░░░░░░▓▓▓▓░░░░░░░░░          │
└──────────────────────────────┘
```

- **factoryplan** (1): OrderGantt
- **masterplan** (1): ResourceGantt

### MN 그리드 알람 — `mn_grid_alert` (1개)

```
┌──────────────────────────────┐
│ Monitoring filters           │
├──────────────────────────────┤
│ ⚠ Alert grid (status colors) │
│ ● Critical 5                 │
│ ◆ Warning  12                │
└──────────────────────────────┘
```

- **factoryplan** (1): ProdDisruptionMonitoring

### MN KPI 모니터링 — `mn_kpi_dashboard` (1개)

```
┌──────────────────────────────┐
│ ┌───┐┌───┐┌───┐┌───┐         │
│ │KPI││KPI││KPI││KPI│         │
│ └───┘└───┘└───┘└───┘         │
│ ─── Live chart ─────         │
│ Alerts: ⚠ Shortage 3         │
└──────────────────────────────┘
```

- **masterplan** (1): ShortageMonitoring

### v4 멀티 그리드 4-stack — `v4_multi_grid` (1개)

```
┌──────────────────────────────┐
│ ┌──┐┌──┐┌──┐┌──┐             │
│ │  ││  ││  ││  │ 4 stacked   │
│ │  ││  ││  ││  │ grids       │
│ └──┘└──┘└──┘└──┘             │
└──────────────────────────────┘
```

- **system** (1): TotalPermission

### h2 마스터-디테일 (수평) — `h2_master_detail` (1개)

```
┌──────────────────────────────┐
│ Search                       │
├──────────────┬───────────────┤
│ Master Grid  │ Detail Grid   │
│              │               │
│              │               │
└──────────────┴───────────────┘
```

- **util** (1): SalesDashboard

---

*자동 생성: `t3series-wingui/packages/wingui/scripts/ui-patterns-gen.cjs`*
*Phase 1 입력: `docs/reference/ui-inventory.json`*
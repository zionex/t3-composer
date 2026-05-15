# baselineforecast 모듈 — UI 패턴 카탈로그

> Phase 1 자동 분류 결과 (생성: `ui-patterns-gen.cjs`). 정정·보강 환영.

## 요약

| 항목 | 값 |
|---|---:|
| 총 화면 | 38 |
| 등록 메뉴 (UI_*) | 19 |
| 위젯 | 4 |
| 팝업 | 5 |
| Base 래퍼 | 0 |
| Sub-component | 2 |

### 레이아웃 카테고리 분포

| 카테고리 | 화면 수 |
|---|---:|
| 01 미분할 (단일) | 13 |
| 11 상하 2분할 | 11 |
| 91 ControlBoard | 2 |
| 95 RouteLayout | 1 |
| — 팝업 | 5 |
| — 위젯 | 4 |
| — 서브컴포넌트 | 2 |

### 패턴 분포 (상위 10)

| 패턴 | 화면 수 |
|---|---:|
| v2 차트 + 그리드 (수직 스택) (`grid_chart_stacked`) | 9 |
| P02 검색 + 그리드 (마스터 CRUD) (`search_grid`) | 8 |
| 팝업 다이얼로그 (`popup`) | 5 |
| 비표준 / 자유 폼 (`free_form`) | 4 |
| 서브 컴포넌트 (`subcomponent`) | 2 |
| v2 듀얼 그리드 2-stack (`v2_dual_grid`) | 2 |
| CB 마스터 컨트롤보드 (`cb_master_dashboard`) | 2 |
| 위젯 (차트) (`widget_chart`) | 2 |
| 위젯 (자유) (`widget_misc`) | 2 |
| RL 라우트 레이아웃 (FLO) (`rl_layout_design`) | 1 |

---
## 화면별 상세

### 01 미분할 (단일) (13개)

#### AbcAnalysis (`UI_BF_17`)

- 경로: `view/baselineforecast/master/abcanalysis/AbcAnalysis.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, InputField:4, PlanScope:1
- SP: `SP_UI_DP_00_LV_CD_Q1`
- 호출: `baselineforecast/master/getHeatMapLevelsByPlanScope` · `engine/bf/UpdateHeatSimulation` · `engine/bf/DoHeatMapLoad`

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

#### ActualSales (`UI_BF_05`)

- 경로: `view/baselineforecast/master/actualsales/ActualSales.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridCnt:1, GridSaveButton:1, GridExcelExportButton:1, …
- SP: `SP_UI_DP_00_CONF_Q1` · `SP_UI_DP_00_CONF_Q1_01` · `SP_UI_DP_00_CONF_Q1_02` · `SP_UI_DP_00_CONF_Q1_03` · `SP_UI_BF_05_Q1`
- 호출: `engine/dp/SRV_GET_SP_UI_BF_05_Q1` · `common/json-save`

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

#### BaselineForecastBoard (`UI_BF_BASELINE_FORECAST_STATE`)

- 경로: `view/baselineforecast/report/baselineforecastboard/BaselineForecastBoard.jsx`
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

#### DateFactor (`UI_BF_06`)

- 경로: `view/baselineforecast/master/datefactor/DateFactor.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- SP: `SP_UI_BF_06_Q1` · `SP_UI_BF_06_D1` · `SP_UI_BF_06_D1_P_RT_MSG` · `SP_UI_BF_06_S1_J`
- 호출: `engine/dp/SRV_GET_SP_UI_BF_06_Q1` · `engine/dp/SRV_SET_SP_UI_BF_06_D1` · `common/json-save`

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

#### Factor (`UI_BF_09`)

- 경로: `view/baselineforecast/master/factor/Factor.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridCnt:1, GridSaveButton:1, InputField:2, …
- SP: `SP_UI_BF_09_Q1` · `SP_UI_BF_09_D1` · `SP_UI_BF_09_D1_P_RT_MSG` · `SP_UI_BF_09_S1`
- 호출: `engine/dp/SRV_GET_SP_UI_BF_09_Q1` · `engine/dp/SRV_SET_SP_UI_BF_09_D1`

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

#### ForecastError (`UI_BF_51`)

- 경로: `view/baselineforecast/report/forecasterror/ForecastError.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridCnt:1, GridExcelExportButton:1, InputField:3, …
- SP: `SP_UI_BF_00_VERSION_Q1` · `SP_UI_BF_51_Q1` · `SP_UI_DP_00_LV_CD_Q1`
- 호출: `engine/dp/SRV_GET_SP_UI_BF_00_VERSION_Q1` · `engine/dp/SRV_GET_SP_UI_BF_51_Q1` · `engine/dp/SRV_GET_SP_UI_DP_00_LV_CD_Q1`

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

#### ForecastresultDrawer

- 경로: `view/baselineforecast/report/forecastresult/ForecastresultDrawer.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### ForecastTarget (`UI_BF_13`)

- 경로: `view/baselineforecast/master/forecasttarget/ForecastTarget.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, …
- SP: `SP_UI_BF_13_Q1` · `SP_UI_BF_13_S1_J` · `SP_UI_BF_13_D1` · `SP_UI_BF_13_M1`
- 호출: `engine/dp/SRV_GET_SP_UI_BF_13_Q1` · `common/json-save` · `engine/dp/SRV_SET_SP_UI_BF_13_D1`

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

#### SalesFactor (`UI_BF_07`)

- 경로: `view/baselineforecast/master/salesfactor/SalesFactor.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- SP: `SP_UI_BF_07_Q1` · `SP_UI_BF_07_D1` · `SP_UI_BF_07_D1_P_RT_MSG` · `SP_UI_BF_07_S1_J`
- 호출: `engine/dp/SRV_GET_SP_UI_BF_07_Q1` · `engine/dp/SRV_SET_SP_UI_BF_07_D1` · `common/json-save`

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

#### Scenario

- 경로: `view/baselineforecast/version/scenario/Scenario.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, InputField:1, PlanScope:1
- SP: `SP_UI_BF_KPI_SCENARIO_SELECT` · `SP_UI_BF_19_LIST` · `SP_UI_BF_19_KPI_SCORE` · `SP_UI_BF_19_KPI_SCENARIO_FEATURE`
- 호출: `engine/dp/SRV_GET_SP_UI_BF_KPI_SCENARIO_SELECT` · `engine/dp/SRV_GET_SP_UI_BF_19_LIST` · `engine/dp/SRV_GET_SP_UI_BF_19_KPI_SCORE`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### Setup

- 경로: `view/baselineforecast/version/scenario/Setup.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 컴포넌트: InputField:5

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### Validation (`UI_BF_00`)

- 경로: `view/baselineforecast/master/validation/Validation.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, PlanScope:1
- SP: `SP_UI_BF_DATA_VALIDATION`
- 호출: `common/data`

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

- 경로: `view/baselineforecast/master/validation/ValidationAccordion.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

### 11 상하 2분할 (11개)

#### Accuracy (`UI_BF_55`)

- 경로: `view/baselineforecast/report/accuracy/Accuracy.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, GridCnt:1, GridExcelExportButton:1, …
- SP: `SP_UI_BF_00_VERSION_Q1` · `SP_UI_DP_00_LV_CD_Q1` · `SP_UI_BF_55_Q1`
- 호출: `engine/dp/SRV_GET_SP_UI_BF_00_VERSION_Q1` · `engine/dp/SRV_GET_SP_UI_DP_00_LV_CD_Q1` · `engine/dp/SRV_GET_SP_UI_BF_55_Q1`

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

#### AccuracyAnalysisReport

- 경로: `view/baselineforecast/report/accuracyanalysisreport/AccuracyAnalysisReport.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, InputField:2, PlanScope:1
- 호출: `accuaryAnalysisReport/version` · `accuaryAnalysisReport/accuracyClick`

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

#### Config (`UI_BF_01`)

- 경로: `view/baselineforecast/master/config/Config.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:2, …
- SP: `SP_UI_DP_01_`
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

#### ErrorCompare (`UI_BF_52`)

- 경로: `view/baselineforecast/report/errorcompare/ErrorCompare.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, GridCnt:1, GridExcelExportButton:1, …
- SP: `SP_UI_BF_00_VERSION_Q1` · `SP_UI_BF_52_Q1` · `SP_UI_DP_00_LV_CD_Q1`
- 호출: `engine/dp/SRV_GET_SP_UI_BF_00_VERSION_Q1` · `engine/dp/SRV_GET_SP_UI_BF_52_Q1` · `engine/dp/SRV_SP_UI_BF_52_Q2`

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

#### FactorAnalysis (`UI_BF_57`)

- 경로: `view/baselineforecast/report/factoranalysis/FactorAnalysis.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=4 Grid=3
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:3, ChartComponent:4, GridCnt:1, GridExcelExportButton:3, …
- SP: `SP_UI_DP_00_LV_CD_Q1` · `SP_UI_BF_56_CHART_Q1` · `SP_UI_BF_56_Q1`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_00_LV_CD_Q1` · `engine/bf/DoFctImpCorr` · `engine/bf/DoSalesFct`

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

#### ForecastResult (`UI_BF_50`)

- 경로: `view/baselineforecast/report/forecastresult/ForecastResult.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, GridCnt:1, GridExcelExportButton:1, …
- SP: `SP_UI_BF_00_VERSION_Q1` · `SP_UI_BF_50_Q1` · `SP_UI_BF_50_CHART_Q1` · `SP_UI_DP_00_LV_CD_Q1`
- 호출: `engine/dp/SRV_GET_SP_UI_BF_00_VERSION_Q1` · `engine/dp/SRV_GET_SP_UI_BF_50_Q1` · `engine/dp/SRV_GET_SP_UI_BF_50_CHART_Q1`

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

#### NewTargetSalesMap (`UI_BF_14`)

- 경로: `view/baselineforecast/master/newtargetsalesmap/NewTargetSalesMap.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridCnt:1, GridAddRowButton:1, GridDeleteRowButton:1, …
- SP: `SP_UI_BF_14_Q2` · `SP_UI_BF_14_CHART_Q2` · `SP_UI_BF_14_Q1` · `SP_UI_BF_14_S2_J` · `SP_UI_BF_14_S2_J_P_RT_MSG`
- 호출: `engine/dp/SRV_GET_SP_UI_BF_14_Q2` · `engine/dp/SRV_GET_SP_UI_BF_14_CHART_Q2` · `engine/dp/SRV_GET_SP_UI_BF_14_Q1`

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

#### RiskAnalysis

- 경로: `view/baselineforecast/report/riskanalysis/RiskAnalysis.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, InputField:2, PlanScope:1
- SP: `SP_UI_BF_60` · `SP_UI_BF_60_CHART`
- 호출: `engine/dp/SRV_GET_SP_UI_BF_60` · `engine/dp/SRV_GET_SP_UI_BF_60_CHART`

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

#### SalesAnalysis (`UI_BF_58`)

- 경로: `view/baselineforecast/report/salesanalysis/SalesAnalysis.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=2 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:2, GridCnt:1, GridExcelExportButton:1, …
- SP: `SP_UI_BF_05_S1_J` · `SP_UI_DP_00_LV_CD_Q1` · `SP_UI_BF_58_CHART_Q1`
- 호출: `common/json-save` · `engine/dp/SRV_GET_SP_UI_DP_00_LV_CD_Q1` · `engine/dp/SRV_GET_SP_UI_BF_58_CHART_Q1`

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

#### VersionCompare (`UI_BF_53`)

- 경로: `view/baselineforecast/report/versioncompare/VersionCompare.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, GridExcelExportButton:1, InputField:2, …
- SP: `SP_UI_BF_00_ENGINE_TP` · `SP_UI_BF_53_Q0` · `SP_UI_BF_53_Q1` · `SP_UI_BF_53_CHART_Q1`
- 호출: `engine/dp/SRV_GET_SP_UI_BF_00_ENGINE_TP` · `engine/dp/SRV_GET_SP_UI_BF_53_Q0` · `engine/dp/SRV_GET_SP_UI_BF_53_Q1`

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

#### VersionErrorCompare (`UI_BF_54`)

- 경로: `view/baselineforecast/report/versionerrorcompare/VersionErrorCompare.jsx`
- 패턴: **v2 차트 + 그리드 (수직 스택)** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: Chart=1 Grid=1
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, ChartComponent:1, GridExcelExportButton:1, InputField:3, …
- SP: `SP_UI_BF_00_ENGINE_TP` · `SP_UI_BF_53_Q0` · `SP_UI_DP_00_CONF_Q1_01` · `SP_UI_DP_00_CONF_Q1_02` · `SP_UI_DP_00_CONF_Q1_03`
- 호출: `engine/dp/SRV_GET_SP_UI_BF_00_ENGINE_TP` · `engine/dp/SRV_GET_SP_UI_BF_53_Q0` · `engine/dp/SRV_GET_SP_UI_DP_00_CONF_Q1`

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

### 91 ControlBoard (2개)

#### ControlBoard (`UI_BF_16`)

- 경로: `view/baselineforecast/version/controlboard/ControlBoard.jsx`
- 패턴: **CB 마스터 컨트롤보드** (LAYOUT_CONTROLBOARD) · confidence: **mid**
- 추정 근거: controlboard match · chart=0 gantt=0
- 컴포넌트: ContentInner:1, WorkArea:1, InputField:6
- SP: `SP_UI_BF_CONTROLBOARD_CLOSE_P_RT_MSG` · `SP_UI_BF_CONTROLBOARD_GEN_P_RT_MSG`
- 호출: `engine/dp/` · `engine/dp/SRV_BF_NEW_VERSION` · `engine/dp/GenerateBF`

```
┌──────────────────────────────┐
│ Version status · Step bar    │
├──────┬───────────┬───────────┤
│ KPI  │ Chart     │ Log/Alert │
├──────┴───────────┴───────────┤
│ Engine execution grid        │
└──────────────────────────────┘
```

#### IsControlBoard

- 경로: `view/baselineforecast/version/iscontrolboard/IsControlBoard.jsx`
- 패턴: **CB 마스터 컨트롤보드** (LAYOUT_CONTROLBOARD) · confidence: **mid**
- 추정 근거: controlboard match · chart=0 gantt=0
- 컴포넌트: ContentInner:1, WorkArea:1, InputField:6, PlanScope:1
- SP: `SP_UI_BF_DELETE_VERSION_P_RT_MSG`
- 호출: `engine/dp/` · `engine/bf/JobInvokeEngineService` · `engine/bf/UIInsightPredictCloseNetworkService`

```
┌──────────────────────────────┐
│ Version status · Step bar    │
├──────┬───────────┬───────────┤
│ KPI  │ Chart     │ Log/Alert │
├──────┴───────────┴───────────┤
│ Engine execution grid        │
└──────────────────────────────┘
```

### 95 RouteLayout (1개)

#### ItemMapFLODiagram

- 경로: `view/baselineforecast/master/newtargetsalesmap/ItemMapFLODiagram.jsx`
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

### — 팝업 (5개)

#### PopForecastResultAccount

- 경로: `view/baselineforecast/report/forecastresult/PopForecastResultAccount.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, BaseGrid:1, InputField:3, PopupDialog:1
- SP: `SP_UI_DP_00_USER_SALES_LV_Q1` · `SP_UI_DP_00_POPUP_ACCOUNT_Q1`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_00_USER_SALES_LV_Q1` · `engine/dp/SRV_GET_SP_UI_DP_00_POPUP_ACCOUNT_Q1`

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

#### PopForecastResultItem

- 경로: `view/baselineforecast/report/forecastresult/PopForecastResultItem.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, BaseGrid:1, InputField:3, PopupDialog:1
- SP: `SP_UI_DP_00_USER_ITEM_LV_Q1` · `SP_UI_DP_00_POPUP_ITEM_Q1`
- 호출: `engine/dp/SRV_GET_SP_UI_DP_00_USER_ITEM_LV_Q1` · `/engine/dp/SRV_GET_SP_UI_DP_00_POPUP_ITEM_Q1`

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

#### PopScenarioKpiWeightConfig

- 경로: `view/baselineforecast/version/scenario/PopScenarioKpiWeightConfig.jsx`
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

#### PopSelectItemLvItem

- 경로: `view/baselineforecast/common/PopSelectItemLvItem.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, WorkArea:1, BaseGrid:1, InputField:2, PopupDialog:1
- 호출: `engine/dp/SRV_GET_UI_BF_00_POPUP_ITEM_Q1`

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

#### PopSelectSalesLvAccount

- 경로: `view/baselineforecast/common/PopSelectSalesLvAccount.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, WorkArea:1, BaseGrid:1, InputField:2, PopupDialog:1
- 호출: `engine/dp/SRV_GET_UI_BF_00_POPUP_ACCT_Q1`

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

### — 위젯 (4개)

#### BestSelectModel

- 경로: `view/baselineforecast/widgets/bestselectmodel/BestSelectModel.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_BF_BEST_MODEL`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### DataValidation

- 경로: `view/baselineforecast/widgets/datavalidation/DataValidation.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

#### DemandForecastResult

- 경로: `view/baselineforecast/widgets/demandforecastresult/DemandForecastResult.jsx`
- 패턴: **위젯 (차트)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=1 grid=0
- 컴포넌트: ChartComponent:1
- SP: `SP_UI_SA_BF_FORECAST_RESULT`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget Chart       │
│  ▁▃▅▇█▇▅▃          │
└────────────────────┘
```

#### GroupAccuracy

- 경로: `view/baselineforecast/widgets/groupaccuracy/GroupAccuracy.jsx`
- 패턴: **위젯 (자유)** (WIDGET) · confidence: **high**
- 추정 근거: widget folder · chart=0 grid=0
- SP: `SP_UI_SA_BF_BEST_MODEL`
- 호출: `common/data`

```
┌────────────────────┐
│ Widget (misc)      │
└────────────────────┘
```

### — 서브컴포넌트 (2개)

#### AbcXyzBox

- 경로: `view/baselineforecast/master/abcanalysis/component/AbcXyzBox.jsx`
- 패턴: **서브 컴포넌트** (SUBCOMPONENT) · confidence: **high**
- 추정 근거: sub-component folder

```
┌─────────────┐
│ Sub Comp.   │
└─────────────┘
```

#### heatmap

- 경로: `view/baselineforecast/master/abcanalysis/component/heatmap.jsx`
- 패턴: **서브 컴포넌트** (SUBCOMPONENT) · confidence: **high**
- 추정 근거: sub-component folder
- 호출: `engine/bf/DoHeatMapDrag`

```
┌─────────────┐
│ Sub Comp.   │
└─────────────┘
```

# T3Series 화면 구성 패턴 카탈로그

> 신규 화면 설계 시 참조하는 **화면 레이아웃 패턴 모음**. 현재 `t3series-wingui/packages/wingui/src/view/` 에 구현된 실제 화면을 분석해 14개 패턴으로 정리.
>
> - [**components-inventory.md**](./components-inventory.md) — 레이아웃 래퍼/그리드/차트/스토어/팝업 공통 컴포넌트 목록
> - [**new-screen-guide.md**](./new-screen-guide.md) — 신규 화면 생성 단계별 가이드 (스켈레톤 코드 포함)

## 목차

- [패턴 선택 가이드](#패턴-선택-가이드)
- [패턴 요약 (빈도순)](#패턴-요약-빈도순)
- [패턴 상세](#패턴-상세)

---

## 패턴 선택 가이드

| 업무 요구 | 적합 패턴 |
|----------|----------|
| KPI · 차트 조합 모니터링 | **P01** 위젯 대시보드 |
| 마스터 데이터 CRUD (품목·사이트·사용자 등) | **P02** 검색+단일 그리드 |
| 같은 조건으로 여러 관점(요약/상세/차트) 전환 | **P03** 검색+탭 그리드/차트 |
| 부모-자식 관계 마스터 (코드그룹-코드 등) | **P04** 수평 스플릿 마스터-디테일 |
| 계획 결과·분석 리포트 (그리드+트렌드 차트) | **P05** 그리드+차트 상하 |
| 시간버킷(주/월/분기) 피벗 데이터 입력 | **P06** 크로스탭 피벗 입력 |
| 버전 생성/승인/마감 워크플로 | **P07** 컨트롤보드 |
| 다단계 승인 진행 현황 추적 | **P08** 프로세스 진행 현황 |
| 리소스 부하·일정 시각화 | **P09** 간트 차트 |
| BOM/공급망 그래프 탐색 | **P10** FLO 다이어그램 |
| 지리적 시각화 | **P11** 지도 위젯 |
| 다차원 피벗 분석 | **P12** 피벗 테이블 |

---

## 패턴 요약 (빈도순)

| # | 패턴명 | 빈도 | 레이아웃 코드 | 대표 파일 |
|---|-------|:---:|---------------|----------|
| P01 | 위젯 대시보드 | ⭐⭐⭐ | `{"layout": "widget_dashboard"}` | `view/dashboard/kpiboard/KpiBoard.jsx` |
| P02 | 검색+단일 그리드 | ⭐⭐⭐ | `{"layout": "search_grid"}` | `view/system/usermgmt/usergroup/UserGroup.jsx` |
| P03 | 검색+탭 그리드/차트 | ⭐⭐ | `{"layout": "search_tab"}` | `view/masterplan/analysisreport/mpresult/MpResult.jsx` |
| P04 | 수평 스플릿 마스터-디테일 | ⭐⭐ | `{"layout": "split_master_detail"}` | `view/system/commoncode/CommonCode.jsx` |
| P05 | 그리드+차트 상하 | ⭐⭐ | `{"layout": "grid_chart_stacked"}` | `view/baselineforecast/report/salesanalysis/SalesAnalysis.jsx` |
| P06 | 크로스탭 피벗 입력 | ⭐⭐ | `{"layout": "pivot_entry"}` | `view/demandplan/entry/entry/BaseEntry.jsx` |
| P07 | 컨트롤보드 | ⭐⭐ | `{"layout": "control_board"}` | `view/baselineforecast/version/controlboard/ControlBoard.jsx` |
| P08 | 프로세스 진행 현황 | ⭐ | `{"layout": "process_status"}` | `view/demandplan/version/processstatus/BaseProcessStatus.jsx` |
| P09 | 간트 차트 | ⭐ | `{"layout": "gantt"}` | `view/masterplan/analysisreport/resourcegantt/ResourceGantt.jsx` |
| P10 | FLO 다이어그램 | ⭐ | `{"layout": "flo_diagram"}` | `view/supplychainmodel/flo/Flo.jsx` |
| P11 | 지도 위젯 | ⭐ | `{"layout": "map"}` | `view/snop/map/Map.jsx` |
| P12 | 피벗 테이블 | ⭐ | `{"layout": "pivot_table"}` | `view/sample/sample02/Sample02.jsx` |
| P13 | 협업 문서+채팅 | (ad-hoc) | `{"layout": "doc_chat"}` | `view/sample/sample06/Sample06.jsx` |
| P14 | 워크플로 편집기 | (ad-hoc) | `{"layout": "workflow_canvas"}` | `view/util/flowdiagram/FlowDiagram.jsx` |

---

## 패턴 상세

### P01 · 위젯 대시보드 (Widget Dashboard)

**레이아웃 코드**: `{"layout": "widget_dashboard"}`

```
┌─────────────────────────────────────────────┐
│  ContentInner                               │
│  ┌─────────────────────────────────────────┐│
│  │  DashboardPanel (12-column grid)        ││
│  │  ┌──────┐ ┌──────┐ ┌──────┐           ││
│  │  │ 📊 W1│ │ 📊 W2│ │ 📊 W3│  row 0    ││
│  │  └──────┘ └──────┘ └──────┘           ││
│  │  ┌──────────┐ ┌────────────┐           ││
│  │  │   W4     │ │    W5      │  row 1    ││
│  │  └──────────┘ └────────────┘           ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

- **구성**: `ContentInner` > `DashboardPanel` (내부적으로 `react-grid-layout`)
- **위젯 배치**: `data-grid: { x, y, w, h }` 좌표 (12 컬럼 기준)
- **언제 사용**: 사용자가 직접 수정하지 않는 읽기 전용 KPI/차트 모니터링 보드
- **대표 파일**:
  - `view/dashboard/kpiboard/KpiBoard.jsx` — 3×3 구성 9개 위젯
  - `view/dashboard/overview/Overview.jsx` — 비대칭 5개 위젯
  - `view/snop/mdb/ontimesales/OntimeSales.jsx` — 전폭(w=12) 위젯 혼합
- **핵심 API**:
  ```jsx
  <DashboardPanel
    widgets={makeWidgetPanel()}
    isResizable={false}
    isDraggable={false}
  />
  ```
- **주의**: 각 위젯은 `view/*/widgets/` 에 `ContentInner` 없이 독립 컴포넌트로 작성. 파라미터는 부모 대시보드 또는 `useDashboardStore` 로 전달.

---

### P02 · 검색+단일 그리드 (Search-Grid)

**레이아웃 코드**: `{"layout": "search_grid"}`

```
┌─────────────────────────────────────────────┐
│  ContentInner                               │
│  ┌─────────────────────────────────────────┐│
│  │  SearchArea                             ││
│  │  ┌ SearchRow ───────────────────────┐   ││
│  │  │ 🔍 [InputA] [InputB] [InputC]    │   ││
│  │  └──────────────────────────────────┘   ││
│  └─────────────────────────────────────────┘│
│  WorkArea                                   │
│  ┌─────────────────────────────────────────┐│
│  │  [+ 추가] [− 삭제] [💾 저장] [📄 Excel] ││
│  │  ╔═════════════════════════════════════╗││
│  │  ║  BaseGrid (flex: 1)                 ║││
│  │  ║  │ 코드 │ 명칭 │ 상태 │ 수정일시 │ ║││
│  │  ╚═════════════════════════════════════╝││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

- **구성**: `ContentInner` > `SearchArea`/`SearchRow`/`InputField` + `WorkArea` > `ButtonArea` + `BaseGrid`
- **언제 사용**: 마스터 데이터 유지보수 (품목, 거래처, 사용자, 메뉴, 공통코드 등)
- **대표 파일**:
  - `view/system/usermgmt/usergroup/UserGroup.jsx`
  - `view/baselineforecast/master/actualsales/ActualSales.jsx`
  - `view/supplychainmodel/sitebod/SiteBod.jsx`
- **핵심 구조**:
  - `gridItems` 는 모듈 최상단 `let gridItems = [...]` 로 선언 (리렌더 방지)
  - 검색 버튼은 `setViewInfo(activeViewId, 'globalButtons', [...])` 로 프레임워크에 등록
  - `BaseGrid` 의 `afterCreate` 콜백에서 그리드 ref 저장
- **CRUD 버튼**: `GridAddRowButton`, `GridDeleteRowButton`, `GridSaveButton`, `GridExcelExportButton`

---

### P03 · 검색+탭 그리드/차트 (Search-Tab)

**레이아웃 코드**: `{"layout": "search_tab"}`

```
┌─────────────────────────────────────────────┐
│  SearchArea 🔍                              │
│  WorkArea                                   │
│  ┌─────────────────────────────────────────┐│
│  │  TabContainer                           ││
│  │  [탭A] [탭B] [탭C]                      ││
│  │  ┌─────────────────────────────────────┐││
│  │  │  (활성 탭) BaseGrid 또는 Chart      │││
│  │  └─────────────────────────────────────┘││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

- **구성**: `SearchArea` + `TabContainer` 안에 탭별 `BaseGrid` 또는 `ChartComponent`
- **언제 사용**: 같은 조회 조건으로 여러 관점(요약/상세, 차트/그리드) 을 전환해서 볼 때
- **대표 파일**:
  - `view/masterplan/analysisreport/resstatus/ResStatus.jsx` — 3개 그리드 탭(Load/Operation/Data)
  - `view/masterplan/analysisreport/mpresult/MpResult.jsx` — 요약/상세 그리드
  - `view/baselineforecast/report/salesanalysis/SalesAnalysis.jsx` — 그리드 탭 + 차트 탭
- **핵심 패턴**:
  - `tabValue` state + `loadData(tabValue)` — 탭 변경 시 지연 로딩
  - 검색 버튼은 현재 활성 탭 기준으로 실행

---

### P04 · 수평 스플릿 마스터-디테일 (Split Master-Detail)

**레이아웃 코드**: `{"layout": "split_master_detail"}`

```
┌──────────────────────────────────────────────┐
│ SearchArea                                   │
│ ┌─────────── SplitPanel ─────────────────┐   │
│ │                   │                    │   │
│ │  Master Grid  ────►  Detail Grid       │   │
│ │  (선택 행)        │  (종속 데이터)     │   │
│ │                   │                    │   │
│ └───────────────────┴────────────────────┘   │
└──────────────────────────────────────────────┘
     또는 상하 분할:
┌──────────────────────────────────────────────┐
│ Master Grid                                  │
├──────────────────────────────────────────────┤
│ Detail Grid 또는 Form                        │
└──────────────────────────────────────────────┘
```

- **구성**: `SplitPanel` (수평 또는 수직) 안에 두 `BaseGrid`
- **언제 사용**: 부모-자식 관계 마스터 (코드그룹↔코드, 계층↔매핑)
- **대표 파일**:
  - `view/system/commoncode/CommonCode.jsx` — 좌측 코드그룹 / 우측 코드
  - `view/demandplan/master/saleshierarchy/SalesHierarchy.jsx`
  - `view/masterplan/master/byproduct/ByProduct.jsx` — 상하 스플릿
- **핵심 패턴**:
  - 좌(상) 그리드 `onCellClicked` → 선택 id 추출 → 우(하) `loadData(id)`
  - 우측 미저장 변경 시 경고: `if (rightGrid.isUpdated()) showMessage(...)`
  - `prevRowRef` 로 이전 선택 복원(Save 취소 시)

---

### P05 · 그리드+차트 상하 (Grid-Chart Stacked)

**레이아웃 코드**: `{"layout": "grid_chart_stacked"}`

```
┌─────────────────────────────────────────────┐
│ SearchArea                                  │
│ WorkArea                                    │
│ ┌─────────────────────────────────────────┐ │
│ │  ╔═════════════════════════════════════╗│ │
│ │  ║  BaseGrid (상단, ~50%)              ║│ │
│ │  ╚═════════════════════════════════════╝│ │
│ │  ══════ SplitPanel Divider ═══════     │ │
│ │  ┌─────────────────────────────────────┐│ │
│ │  │  📊 ChartComponent / Line / Bar     ││ │
│ │  │     (하단, ~50%)                    ││ │
│ │  └─────────────────────────────────────┘│ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

- **구성**: `SplitPanel` (또는 flex) 로 상단 `BaseGrid` + 하단 `ChartComponent`
- **언제 사용**: 분석 리포트에서 집계 수치(그리드) 와 트렌드(차트) 동시 표시
- **대표 파일**:
  - `view/baselineforecast/report/salesanalysis/SalesAnalysis.jsx`
  - `view/masterplan/analysisreport/consumptionplan/ConsumptionPlan.jsx`
  - `view/baselineforecast/report/forecastresult/ForecastResult.jsx`
- **핵심 패턴**:
  - 그리드 행 선택 → `chart.current.data.datasets` 갱신 → `chart.current.update()`
  - `chart1Key` state 변경으로 차트 강제 리마운트
  - 차트 타입 전환: MUI `Tabs` / `ButtonGroup`

---

### P06 · 크로스탭 피벗 입력 (Pivot Entry)

**레이아웃 코드**: `{"layout": "pivot_entry"}`

```
┌──────────────────────────────────────────────────────┐
│ SearchArea                                           │
│  [PlanScope] [Item] [Account] [기간범위]              │
│ ButtonArea  [버전▼] [💾 저장] [📤 엑셀] [📥 엑셀입력]│
│ ┌──────────────────────────────────────────────────┐ │
│ │ BaseGrid (크로스탭)                              │ │
│ │ ┌─────┬──────┬──────┬──────┬──────┬──────┐      │ │
│ │ │지표 │DATE_ │DATE_ │DATE_ │DATE_ │ ...  │      │ │
│ │ │     │2024- │2024- │2024- │2024- │      │      │ │
│ │ │     │01    │02    │03    │04    │      │      │ │
│ │ ├─────┼──────┼──────┼──────┼──────┼──────┤      │ │
│ │ │계획 │ 1000 │ 1200 │ ...  │ ...  │ ...  │      │ │
│ │ │실적 │  950 │ 1100 │ ...  │ ...  │ ...  │      │ │
│ │ └─────┴──────┴──────┴──────┴──────┴──────┘      │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

- **구성**: 일반 그리드에 `iteration: { prefix: 'DATE_', delimiter: '-' }` 설정으로 날짜 열을 동적 생성
- **언제 사용**: 시간버킷(주/월/분기) 단위 계획 데이터 입력·조회 (수요계획, 생산계획, 재고계획)
- **대표 파일**:
  - `view/demandplan/entry/entry/BaseEntry.jsx`
  - `view/masterplan/analysisreport/mpresult/MpResult.jsx`
  - `view/replenishmentplan/analysisreport/rpresult/RpResult.jsx`
- **핵심 패턴**:
  - `loadBuckets()` + 버킷 타입(W/M/Q) 전환 → 컬럼 재생성
  - 버전 선택: `loadRecentSimulationVersion()` + 드롭다운
  - 컬럼 헤더 색상화: `setHeaderColor(gridObj, colorMap)`
  - `PopPersonalize` 로 개인 컬럼 프리셋 저장

---

### P07 · 컨트롤보드 (Control Board)

**레이아웃 코드**: `{"layout": "control_board"}`

```
┌──────────────────────────────────────────────┐
│ ContentInner                                 │
│ WorkArea                                     │
│ ┌──────────────────────────────────────────┐ │
│ │ MUI Stepper                              │ │
│ │   ○ Step1 ─── ● Step2 ─── ○ Step3       │ │
│ ├──────────────────────────────────────────┤ │
│ │ Card 1: 버전명 [Chip: ACTIVE]            │ │
│ │   날짜범위 / 설명                         │ │
│ │   [생성] [마감] [승인]                    │ │
│ │ ──────────────────────────────────────   │ │
│ │ Card 2: 버전명 [Chip: CLOSED]            │ │
│ │   ...                                    │ │
│ │                                          │ │
│ │                 → SwipeableDrawer         │ │
│ │                    (신규 버전 생성 폼)    │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

- **구성**: MUI `Stepper` + `Card` 반복 + `SwipeableDrawer` (우측 슬라이드 폼)
- **언제 사용**: 계획 버전 생성·마감·승인 워크플로 (BF/DP/MP/RP 공용)
- **대표 파일**:
  - `view/baselineforecast/version/controlboard/ControlBoard.jsx`
  - `view/demandplan/version/controlboard/BaseControlBoard.jsx` (← 1줄 래핑으로 특수화)
- **핵심 패턴**:
  - Base 컴포넌트를 `planTypeCode`, `isDemandPlanOnly`, `viewCd` props 로 특수화
  - `versionsInfo`, `versionSteps` state
  - `callService(serviceId, paramMap)` 로 engine API 호출

---

### P08 · 프로세스 진행 현황 (Process Status)

**레이아웃 코드**: `{"layout": "process_status"}`

```
┌───────────────────────────────────────────────┐
│ SearchArea [PlanScope][User][버전][기간]       │
│ WorkArea                                      │
│ ┌───────────────────────────────────────────┐ │
│ │ MUI Stepper (클릭 가능)                   │ │
│ │  ● 입력 ─── ○ 검토 ─── ○ 승인             │ │
│ ├───────────────────────────────────────────┤ │
│ │ TreeGrid                                  │ │
│ │   ▼ 영업레벨 A                            │ │
│ │      · 홍길동 | SUBMITTED | 2026-04-22    │ │
│ │      · 이영희 | PENDING   | 2026-04-22    │ │
│ │   ▶ 영업레벨 B                            │ │
│ └───────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘
```

- **구성**: MUI `Stepper` + `TreeGrid` (계층형)
- **언제 사용**: 다단계/다사용자 계획 제출·승인 현황 트리뷰
- **대표 파일**: `view/demandplan/version/processstatus/BaseProcessStatus.jsx`
- **핵심 패턴**:
  - `activeStep` state 변경 → TreeGrid 데이터 필터
  - `planTypeCode`, `viewCd` props 로 특수화

---

### P09 · 간트 차트 (Gantt Chart)

**레이아웃 코드**: `{"layout": "gantt"}`

```
┌───────────────────────────────────────────────┐
│ SearchArea [PlanScope][Location][버전][기간]   │
│ ButtonArea [Half-Day|Day|Week|Month]          │
│ ┌───────────────────────────────────────────┐ │
│ │ ┌────────────┬──────────────────────────┐ │ │
│ │ │ 리소스 트리 │    시간축 →             │ │ │
│ │ │ ▼ 공장 A   │  ▓▓░░░░▓▓▓░░░         │ │ │
│ │ │   ▼ 라인 1 │  ▓▓▓▓░░░░▓▓▓░          │ │ │
│ │ │   ▼ 라인 2 │  ░▓▓▓▓▓░░░             │ │ │
│ │ └────────────┴──────────────────────────┘ │ │
│ └───────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘
```

- **구성**: `GanttChart` + `HeaderUnitSetting` (시간단위 선택) + `ActivitySearch`
- **언제 사용**: 생산 리소스 부하·일정 시각화, 간트 내 작업 이동 시뮬레이션
- **대표 파일**:
  - `view/masterplan/analysisreport/resourcegantt/ResourceGantt.jsx`
  - `view/factoryplan/analysis/resourcegantt/ResourceGantt.jsx`
  - `view/factoryplan/simulation/adjustmentgantt/AdjustmentGantt.jsx`
- **핵심 상태**:
  - `headerUnit` state (기본 `'Day'`)
  - `gantt.resourceGantt` ref — GanttChart 인스턴스

---

### P10 · FLO 다이어그램 (FLO Flow Diagram)

**레이아웃 코드**: `{"layout": "flo_diagram"}`

```
┌────────────────────────────────────────────────┐
│ SearchArea [PlanScope][Location][Item]          │
│ TabContainer                                   │
│  [ bomTree 탭 ] [ flo 탭 ]                     │
│  ┌─ bomTree ──────────────────────────────┐   │
│  │   BaseGrid (상위)                       │   │
│  │   TreeGrid (하위 BOM)                   │   │
│  └─────────────────────────────────────────┘   │
│  ┌─ flo ──────────────────────────────────┐   │
│  │          ○────────►○────────►○         │   │
│  │           ╲          ╲                 │   │
│  │            ○──────────►○               │   │
│  │   (ReactFlow 캔버스)                    │   │
│  └─────────────────────────────────────────┘   │
└────────────────────────────────────────────────┘
```

- **구성**: `TabContainer` (그리드 탭 / `FLODiagram` 탭) — ReactFlow 기반
- **언제 사용**: BOM 다단계 전개, 공급망 물자 흐름 그래프 탐색
- **대표 파일**:
  - `view/supplychainmodel/flo/Flo.jsx`
  - `view/factoryplan/master/bom/Bom.jsx`
  - `view/baselineforecast/master/newtargetsalesmap/NewTargetSalesMap.jsx`
- **핵심 패턴**:
  - `TidyTreeUtil` → `getLayoutedElements` 로 트리 → 노드/엣지 변환
  - `direction` (`LR`/`TB`), `hierarchyType` (`CTOP`/`PTOC`)

---

### P11 · 지도 위젯 (Map Widget)

**레이아웃 코드**: `{"layout": "map"}`

```
┌────────────────────────────────┐
│ ContentInner                   │
│ ┌────────────────────────────┐ │
│ │    🗺️ Google Maps          │ │
│ │                            │ │
│ │   📍   📍                  │ │
│ │      📍      📍            │ │
│ │         📍                 │ │
│ │  (마커 클릭 → Popup)       │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

- **구성**: `MyGoogleMap` (또는 Leaflet 기반 `LocationMap`)
- **언제 사용**: 공급망 거점·재고 위치 지리 시각화. 단독 화면 또는 대시보드 위젯
- **대표 파일**:
  - `view/snop/map/Map.jsx`
  - `view/supplychainmodel/widgets/supplychainview/SupplyChainView.jsx`

---

### P12 · 피벗 테이블 (Pivot Table)

**레이아웃 코드**: `{"layout": "pivot_table"}`

```
┌─────────────────────────────────────┐
│ ContentInner                        │
│  [📤 Excel Reader]                  │
│ ┌─────────────────────────────────┐ │
│ │ PivotTable                      │ │
│ │  ┌─────┬─────┬──────┬──────┐    │ │
│ │  │ D   │ D   │  M   │  V   │    │ │
│ │  │Dim1 │Dim2 │Meas. │Value │    │ │
│ │  ├─────┼─────┼──────┼──────┤    │ │
│ │  │ ... │ ... │ ...  │ ...  │    │ │
│ │  └─────┴─────┴──────┴──────┘    │ │
│ │  colType: D / M / P / V / G     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

- **구성**: `PivotTable` 전용 컴포넌트 + `ExcelReaderBtn`
- **언제 사용**: 다차원 피벗 분석 (실사용 사례 제한적)
- **대표 파일**: `view/sample/sample02/Sample02.jsx`
- **컬럼 타입**: `D` (Dimension) / `M` (Measure) / `P` (Period) / `V` (Value) / `G` (Group)

---

### P13 · 협업 문서+채팅 (Collaborative Doc + Chat) — 애드혹

**레이아웃 코드**: `{"layout": "doc_chat"}`

- 좌측 200px 페이지 목록 + 우측 `ZEditor` (TUI Editor) + `SwipeableDrawer` 채팅창
- 실시간 소켓 기반 `MessageListener`
- **대표 파일**: `view/sample/sample06/Sample06.jsx` (유사: `view/snop/meeting/Meeting.jsx`)
- **주의**: 정식 패턴 후보지만 현재 사례 1-2건. 업무 적용 전 검토 필요.

---

### P14 · 워크플로 편집기 (Workflow Canvas) — 애드혹

**레이아웃 코드**: `{"layout": "workflow_canvas"}`

- `WidgetFlowDiagram` (ReactFlow) 으로 노드·엣지 편집
- 좌측 목록 사이드패널 + 우측 캔버스
- **대표 파일**: `view/sample/sample04/Sample04.jsx`, `view/util/flowdiagram/FlowDiagram.jsx`
- **주의**: 업무용 다이어그램은 P10(FLO Diagram)이 담당. 본 패턴은 범용 편집기 용도.

---

## 패턴 조합 · 하이브리드

실제 화면은 **두 패턴 이상 결합**되는 경우가 많습니다:

| 조합 예 | 구현 |
|---------|------|
| P02 + P04 | 검색 영역 + 상하 스플릿 그리드 |
| P03 + P05 | 탭 안에 그리드+차트 조합 |
| P03 + P06 | 탭으로 피벗 크로스탭 / 요약 전환 |
| P07 + P08 | 컨트롤보드 안에서 처리 상태 미니뷰 |
| P01 + 위젯별 P05/P09/P11 | 대시보드 위젯들이 각자 다른 서브패턴 |

---

## 다음 단계

- **컴포넌트 인벤토리** → [components-inventory.md](./components-inventory.md)
- **신규 화면 생성 가이드** (스켈레톤 코드) → [new-screen-guide.md](./new-screen-guide.md)
- **패턴 선정 후 실제 구현**: 대표 파일을 복사해 시작하는 것을 권장 (sample 폴더는 일부 패턴만 제공)

# 21. 공용 컴포넌트 인벤토리 (PlanNEL)

> 모든 import 는 **`@plannel/components/*`** alias 사용. 신규 화면 작성 시 아래에서 골라 쓰고, **없으면 신규 추가 금지** — 기존 컴포넌트로 조합 가능한지 먼저 검토.

## 1. 레이아웃

| 컴포넌트 | 경로 | 역할 / Props |
|---|---|---|
| `FilterContainer` | `@plannel/components/layout/FilterContainer` | 검색조건 + 우측 버튼 영역 wrapper. `({ sx, children, hasIcons })` — 화면 상단 고정 |
| `ComparisonContainer` | `@plannel/components/layout/ComparisonContainer` | 비교 화면 좌우 분할 |
| `DashboardComponent` | `@plannel/components/layout/DashboardComponent` | 대시보드 그리드 패널 컨테이너 |
| `PaginationContainer` | `@plannel/components/PaginationContainer` | 페이지 네비게이션 — `{ currentPage, totalPages, pageSize, pageSizes, setCurrentPage, setPageSize }` |
| `TabContainer` | `@plannel/components/TabContainer` | 탭 네비 — `{ tabs, selectedTab, setSelectedTab, onTabChange }` |
| `SplitterContainer` | `@plannel/components/SplitterContainer` | resizable split panel — `{ sizes, setSize, children }` |

---

## 2. 검색조건 (filter/ 16개)

| 컴포넌트 | 역할 | 핵심 Props |
|---|---|---|
| `AdvancedFilter` | column 별 동적 필터 빌더 (AND/OR 조합) | `{ filterNode, onChange, columnDefs, getOperatorOptions, depth }` 또는 화면 상위에선 `{ columnDefs, advancedFilters, onApply }` |
| `CustomerAutocomplete` | 거래처 자동완성 (단/복수) | `{ selectedCustomer, setSelectedCustomer, multiple, onBlur }` |
| `ItemAutocomplete` | 품목 자동완성 | `{ selectedItem, setSelectedItem, multiple, onBlur }` |
| `CustomerHrchyTreeFilter` | 거래처 계층 트리 | `{ treeData, selectedNodes, setSelectedNodes }` |
| `ItemHrchyTreeFilter` | 품목 계층 트리 | 동일 |
| `LocationFilter` | 거점 단건 dropdown | — |
| `LocationTreeFilter` | 거점 계층 트리 | — |
| `ResourceFilter` | 자원 선택 | — |
| `PeriodFilter` | 기간 (from/to) | — |
| `ClassificationFilter` | 분류 코드 | — |
| `InvClassCdFilter` | 재고 분류 코드 | — |
| `ItemTypeFilter` | 품목 유형 dropdown | — |
| `IpVersionFilter` | IP 버전 선택 | `{ versionId, setVersionId, reloadIpVersionFilter }` |
| `MpVersionFilter` | MP 버전 선택 | 동일 패턴 |
| `RpVersionFilter` | RP 버전 선택 | 동일 패턴 |
| `ZeroExclusionFilter` | "0 제외" 체크박스 | — |

### 2.1 검색조건 사용 패턴

```jsx
// useState + useRef 직접 관리 (react-hook-form 미사용)
const customerSearch = useRef(reduxViewState?.searchCode ?? "");
const extraCustomerCodesRef = useRef(reduxViewState?.extraCustomerCodes ?? []);
const [versionId, setVersionId] = useState(reduxViewState?.versionId ?? null);

<FilterContainer>
  <CustomerAutocomplete
    selectedCustomer={customerSearch}
    setSelectedCustomer={(v) => { customerSearch.current = v; }}
    multiple={false}
  />
  <IpVersionFilter versionId={versionId} setVersionId={setVersionId} />
  {/* 우측 액션 버튼 영역 */}
  <Box sx={{ ml: "auto" }}>
    <SaveButton onClick={handleSave} />
  </Box>
</FilterContainer>
```

---

## 3. AG-Grid 헬퍼 (aggrid/ 12개)

| 헬퍼 | 역할 | API |
|---|---|---|
| `DefaultGridSetting({title, viewName})` | 그리드 기본 props 빌더 | columnDefs / defaultColDef / rowSelection / paginationPageSize / suppressRowClickSelection / enableCellChangeFlash 등 반환. **모든 그리드 필수** |
| `DataState` | 행 변경 추적 (created/updated 분리) | `setDataState(e)`, `initialize(gridApi)`, `getAllStateRow(gridApi)`, `getStateData(gridApi, "created"\|"updated")`, `getRowState(gridApi, rowIdx)`, `getRowStyles(params)` |
| `GridUtils` | 그리드 utility | `getColumnDefs(columns)` (i18n 적용), `autoSizeColumn(columnApi, skipHeader, columns)`, `getColumnIds(api)`, `addRow(api, newRow, addIndex=0, selected=true)`, `getAllData(api)`, `getSortState(params)` → `{orderByColumn, sortType}`, `getColumnGroupId(columnApi, name)`, `gridValueL10N(value, {headerName})` |
| `GridExportSetting` | Excel/CSV export 스타일 | `excelStyles` (header / alertBackground / dataTypes) |
| `NumericEditor` | 숫자 입력 셀 에디터 | Props: `min`, `max`, `point`, `sumFields`, `setSnackInfo` |
| `CalendarGroupRenderer` | 캘린더 그룹 셀 렌더러 | — |
| `CycleCalendarRenderer` | 사이클 캘린더 셀 렌더러 | — |
| `CustomDetailHeader` | Master-detail row 헤더 | — |
| `CustomHeaderGroup` | 컬럼 그룹 헤더 커스텀 | — |
| `CustomHeaderMenuIcon` | 헤더 메뉴 아이콘 렌더러 | — |
| `FilterStatusPanel` | 적용된 필터 상태 사이드 패널 | — |
| `CustomTooltip` | 그리드 셀 툴팁 | — |

### 3.1 표준 그리드 패턴

```jsx
const gridRef = useRef();
const defaultGridMemo = useMemo(() => DefaultGridSetting({ title, viewName }), []);

const columnDefs = [
  { headerName: "customerCd", field: "customerCd",
    checkboxSelection: true, headerCheckboxSelection: true,
    cellClass: 'stringType', filterType: 'string' },
  { headerName: "name", field: "name", filterType: 'string' },
  { headerName: "qty", field: "qty", type: ["rightAligned"], width: 100, filterType: 'number' },
  { headerName: "activeFlg", field: "activeFlg", type: ["booleanColumn"], width: 80, filterType: 'boolean' },
  { headerName: "createdTs", field: "createdTs", type: ["nonEditableColumn"],
    valueFormatter: dateUtils.formatDateTime, filterType: "timestamp" },
];

const onGridReady = (params) => {
  DataState.initialize(params.api);     // 변경 추적 init
  GridUtils.autoSizeColumn(params.columnApi);
  setGridLoading(true);
};

<AgGridReact
  ref={gridRef}
  rowData={rows}
  {...defaultGridMemo}
  columnDefs={columnDefs}
  getRowStyle={(p) => DataState.getRowStyles(p)}
  onGridReady={onGridReady}
  onSortChanged={(p) => setSortParams(GridUtils.getSortState(p))}
/>
```

### 3.2 컬럼 타입 관례 (`type:["..."]`)

| type | 의미 |
|---|---|
| `"rightAligned"` | 숫자 컬럼 — 우측 정렬 |
| `"booleanColumn"` | Y/N flag boolean 체크박스 셀 |
| `"nonEditableColumn"` | 읽기 전용 |
| `"defaultValueParser"` | 기본 값 파서 적용 |

### 3.3 `filterType` (AdvancedFilter 통합용)

| filterType | AdvancedFilter 가 인식 |
|---|---|
| `"string"` | text contains / equals 등 |
| `"number"` | 범위 / 비교 |
| `"boolean"` | true/false 토글 |
| `"timestamp"` | 날짜 from~to |

### 3.4 `cellClass` 관례

| cellClass | 용도 |
|---|---|
| `"stringType"` | 클립보드/엑셀 export 시 문자열 타입 보존 (숫자처럼 보이는 코드 보호) |

### 3.5 저장 패턴 (`DataState.getStateData`)

```jsx
const handleSave = () => {
  const created = DataState.getStateData(gridRef.current.api, "created");
  const updated = DataState.getStateData(gridRef.current.api, "updated");
  const changes = [...(created ?? []), ...(updated ?? [])];
  if (changes.length === 0) {
    setSnackInfo({ open: true, severity: "info", content: t("MSG_NoChanges") });
    return;
  }
  customerService.upsert(changes).then(() => {
    setSnackInfo({ open: true, severity: "success", content: t("MSG_SaveSuccess") });
    retrieve();
  });
};
```

---

## 4. 버튼 / 액션 (`@plannel/components/ActionIconButton` named import)

| 버튼 | 용도 | Props |
|---|---|---|
| `AddButton` | 신규 행 추가 | `({ label, onClick, ...others })` |
| `RemoveButton` | 선택 행 삭제 | 동일 |
| `SaveButton` | 변경 저장 | 동일 |
| `SettingsButton` | 화면별 설정 (속성 컬럼) 다이얼로그 열기 | 동일 |
| `FilterButton` | AdvancedFilter 패널 토글 | `{ label, advancedFilterColor, onClick }` (`advancedFilterColor="info"` 면 활성 표시) |
| `RunButton` | 시뮬레이션 실행 | 동일 |
| `BulkValueUpdateButton` | 선택 행 일괄 업데이트 | 동일 |

기타 단일 컴포넌트:
- **`ExcelExportButton`** (`@plannel/components/ExcelExportButton`) — `{ title, service, params, columnDefs, setExcelData, headerFormatter, dataType, formatHeaderList, hasUnsavedChanges, totalRows, isCsv, translationColumns, noteDefs }`
- **`PaginationContainer`** (`@plannel/components/PaginationContainer`) — 페이지 네비

---

## 5. 다이얼로그 / 알림

| 컴포넌트 | 경로 | Props |
|---|---|---|
| `Dialog` | `@plannel/components/Dialog` | `{ open, title, actionName, content, checkBox, setChecked, checked, onHandler, onClose, t, el, cancelText, customButton, maxWidth }` |
| `Snackbar` | `@plannel/components/Snackbar` | `{ onClose, open, content, duration, severity }` (severity: `"success"` / `"error"` / `"info"` / `"warning"`) |
| `DeleteOptionDialog` | `@plannel/components/DeleteOptionDialog` | 삭제 옵션 (cascade vs 본인만) — `{ open, onConfirm, onCancel }` |

### 5.1 Modal (modal/ 20개)

| 모달 | 역할 | 주요 Props |
|---|---|---|
| `AttributeConfigModal` | 사용자 정의 속성 (attr01..attr20) 컬럼 표시 설정 | `{ open, onClose, attrColDefs, setAttrColDefs }` |
| `CreateVersionModal` | 신규 plan 버전 생성 | `{ open, onClose, onVersionCreate }` |
| `CalendarModal` | 캘린더 날짜 선택 (큰 grid) | `{ open, dates, onChange }` |
| `CalendarGroupModal` | 캘린더 그룹 설정 | — |
| `MeasureModal` | KPI/measure 설정 | `{ open, measures, setMeasures }` |
| `DimensionModal` | 차원 계층 설정 | — |
| `ChartCommonConfigModal` | 차트 공통 설정 | — |
| `ClassificationSettingsModal` | ABC/XYZ 설정 | — |
| `MultiSelectLocation` | 다중 거점 선택 | `{ selectedLocations, setSelectedLocations }` |
| `AuthAppSettingModal` | 앱 인증 설정 | — |
| `InvCovDaysSettings` | 재고 커버리지 일수 설정 | — |
| `AbcXyzFilterModal` | ABC/XYZ 분석 필터 | — |

### 5.2 알림 사용 패턴

```jsx
const [snackInfo, setSnackInfo] = useState({ open: false, severity: "", content: "" });
const [dialogInfo, setDialogInfo] = useState({ open: false, title: "", content: "" });

const handleDelete = () => {
  setDialogInfo({
    open: true, title: "delete", content: t("MSG_ConfirmDelete"),
    action: () => doDelete(),
  });
};

<Dialog
  open={dialogInfo.open}
  onClose={() => setDialogInfo({ open: false, title: "", content: "" })}
  title={dialogInfo.title}
  content={dialogInfo.content}
  onHandler={() => { dialogInfo.action?.(); setDialogInfo({ open: false, title: "", content: "" }); }}
/>
<Snackbar
  open={snackInfo.open}
  onClose={() => setSnackInfo({ ...snackInfo, open: false })}
  severity={snackInfo.severity}
  content={snackInfo.content}
/>
```

---

## 6. 기타 단일 파일 컴포넌트 (root `components/`)

| 컴포넌트 | 용도 |
|---|---|
| `AutocompleteSearch` | 범용 자동완성 — `{ value, onChange, options, getOptionLabel }` |
| `OriginDestLocationAutocomplete` | 출발지/도착지 거점 선택 |
| `BucketToggleButton` | 시간 버킷 (일/주/월) 토글 — `{ value, onChange }` |
| `ToggleButton` | 다중 옵션 토글 |
| `CustomStyledSwitch` | MUI Switch 스타일 |
| `DateCondition` | 날짜 조건 (from/to/single) — `{ conditionList, period, maxDate, minDate, views, selectedSearch, setSelectedSearch, setPeriod, dateFormat, useAutoComplete }` |
| `GridDatePicker` | AG-Grid 셀 에디터 (날짜) |
| `GridAutoComplete` | AG-Grid 셀 에디터 (자동완성) |
| `TextFieldSearch` | 검색 텍스트 입력 |
| `RpPeriodSlider` | RP 기간 슬라이더 |
| `ChatWidget` | AI 챗 위젯 |
| `useChat` | 챗 메시지 관리 hook |
| `NotificationBell` | 상단 알림 |
| `Navbar` | 상단 네비 |
| `Sidebar` | 사이드 네비 |
| `ModuleVersionSetting` | 모듈별 버전 선택 다이얼로그 |
| `VersionConfigContent` | 버전 설정 form |
| `PasswordInput` | 비밀번호 + visibility toggle |
| `PasswordPolicyContainer` | 비번 강도 표시 |
| `SelectLanguage` | 언어 dropdown |
| `SelectExpTime` | 만료 시간 picker |
| `AbcHeatMap` | ABC-XYZ heatmap |
| `AggregationIcon` | 집계 표시 아이콘 |
| `AuthVerify` | 인증 토큰 검증 HOC — `{ children }` |
| `BackToSignIn` | 로그인 fallback |
| `GoogleSSOSignIn` | Google OAuth 버튼 |
| `PlannelFooter` | 푸터 |

---

## 7. Redux 상태 영속화

```js
import { useDispatch } from "react-redux";
import reduxUtil from "@plannel/utils/redux-util";

const reduxViewState = reduxUtil.getViewState(viewName);   // localStorage / store 통합 (BigInt + ZDate parsing)
const reduxDispatch  = useDispatch();

// 페이지 진입 시 state 복원
const [currentPage, setCurrentPage] = useState(reduxViewState?.page ?? 1);
const [pageSize, setPageSize]       = useState(reduxViewState?.pageSize ?? 100);
const [advancedFilters, setAdvancedFilters]
  = useState(reduxViewState?.advancedFilters ?? null);

// 상태 변경 시 store 에 dispatch
import { updateViewState } from "@plannel/redux/modules/viewStates";
reduxDispatch(updateViewState({
  viewName,
  page: newPage,
  pageSize: newPageSize,
  searchCode: customerSearch.current,
  advancedFilters,
}));
```

### 7.1 redux-util export 함수

| 함수 | 역할 |
|---|---|
| `createViewState(viewName, searchCode, page, pageSize)` | 화면 state 초기화 객체 생성 |
| `createFilterViewState(viewName, filter)` | 필터 state |
| `createObjectState(viewName, object)` | 임의 object state |
| `getViewState(viewName)` | 저장된 화면 state 조회 (BigInt + ISO date 자동 parsing) |
| `updateViewState(payload)` | dispatch 용 action creator |
| `removeViewState(payload)` | 화면 state 삭제 |
| `initViewState()` | 전체 초기화 |
| `getHistoryState()` | 네비 history |
| `createTabsState(keys, tabIndex, object)` | 탭 state 생성 |
| `getTabState()` | 탭 state 조회 |
| `updateTabState(payload)` | 탭 state 업데이트 |

### 7.2 redux store 구성 (`@plannel/redux/modules/store.js`)

```js
const rootReducer = combineReducers({
  historyState: historyReducer,
  viewStates:   viewReducer,
  tabState:     persistReducer(persistConfig, tabReducer)   // localStorage 영속
});
```

- `viewStates`: 화면별 검색조건/페이징 (in-memory · 새로고침 시 사라짐)
- `tabState`: 열린 탭 목록 (localStorage 영속)
- `historyState`: 네비 history
- 커스텀 미들웨어 `customSerializableMiddleware`: BigInt 직렬화 (json-bigint 사용)

---

## 8. i18n (`react-i18next` 6언어)

```js
import { useTranslation } from "react-i18next";
const { t } = useTranslation();

const label = t("customerName");           // menu/UI label
const message = t("MSG_SaveSuccess");      // 메시지

// AG-Grid 컬럼 — i18n key 그대로 headerName 에 입력하면 GridUtils 가 번역
{ headerName: "customerCd", field: "customerCd" }
```

### 8.1 언어 코드

| 코드 | 언어 |
|---|---|
| `en-US` | 영어 |
| `ko-KR` | 한국어 |
| `ja-JP` | 일본어 |
| `zh-TW` | 중국어 (번체) |
| `zh-CN` | 중국어 (간체) |
| `vi-VN` | 베트남어 |

### 8.2 번역 파일 구조

`saas-web/src/assets/data/l10n/translation.<lang>.js`:

```js
export default {
  menu: { customerName: "거래처명", ... },           // 메뉴 + UI 라벨
  msg:  { MSG_SaveSuccess: "저장되었습니다.", ... },  // 메시지
  problem: { ... },                                   // 에러
  notification: { ... },                              // 알림
  plannelAgent: { ... },                              // AI 챗봇
  grid: {                                             // 그리드 셀 값 번역
    activeFlg: { Y: "사용", N: "미사용" }
  }
};
```

## 9. Anti-patterns (컴포넌트 사용 시)

| ❌ | ✅ |
|---|---|
| `import { ... } from "@wingui/common/imports"` | `@plannel/components/*` (PlanNEL 컴포넌트 시스템 별개) |
| `<BaseGrid items={...} afterGridCreate={fn}>` | `<AgGridReact columnDefs={...} rowData={...} ref={gridRef} {...defaultGridMemo}>` |
| `grid.dataProvider.fillJsonData(rows)` | `setRows(rows)` (state 변경 → AG-Grid 자동 리렌더) |
| `grid.dataProvider.getAllStateRows()` | `DataState.getStateData(api, "created")` + `"updated"` 분리 |
| `useViewStore` / `useContentStore` | `reduxUtil.getViewState(viewName)` + `useDispatch` |
| `useFieldCascade` / `applyGridCascade` | (PlanNEL 동등 헬퍼 없음 — 화면별 cascade 수동 구현) |
| `<PopSelectItem>` / `<PopSelectAccount>` | `<ItemAutocomplete>` / `<CustomerAutocomplete>` (`@plannel/components/filter/...`) |
| `<CommonCodeSelect groupCd="USE_YN">` | MUI `<Select>` + `<MenuItem>` + 자체 lookup service 또는 `getLookup()` 호출 |
| `setViewInfo(activeViewId, 'globalButtons', [...])` | 로컬 JSX 에 직접 버튼 (`<AddButton>` / `<SaveButton>` 등) — globalButtons 개념 없음 |
| `showMessage('확인', '메시지', cb)` | `<Dialog open content onHandler />` + `<Snackbar open severity content />` |
| `zAxios.get('util/user-infos')` | `customerService.getAll(params)` (service 레이어 경유) — URL 직접 작성 금지 |
| 컬럼 정의에 `dataType: 'text'` | AG-Grid 는 `cellClass: 'stringType'` + `filterType: 'string'` |
| `headerText:` (RealGrid 키) | `headerName:` (AG-Grid 키) |
| `editor: { type: 'date' }` (RealGrid) | `cellEditor: 'agDateCellEditor'` 또는 `GridDatePicker` (AG-Grid) |
| 한글 라벨 하드코딩 | i18n key + `t("KEY")` 또는 columnDef.headerName 에 i18n key |

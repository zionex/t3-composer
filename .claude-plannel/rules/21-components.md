---
description: PlanNEL 화면(.jsx/.js)에서 사용하는 공용 컴포넌트 인벤토리 (AG-Grid + MUI + Redux + i18next).
globs:
  - "**/pages/**/*.js"
  - "**/pages/**/*.jsx"
alwaysApply: false
---

# 21. PlanNEL 프론트엔드 컴포넌트 인벤토리

> PlanNEL 전용 규칙. wingui / t3series 코드베이스와 무관.
> 코드 표면 권위: `30-data-access.md` (서비스·Redux 패턴).

---

## §1. AG-Grid (`@ag-grid-community/react`)

### §1.1 AgGridReact — 기본 사용 패턴

```jsx
import { AgGridReact } from "@ag-grid-community/react";
import { useMemo, useRef, useState } from "react";
import { Box } from "@mui/material";
import DefaultGridSetting from "@plannel/components/aggrid/DefaultGridSetting";

const MyView = ({ t }) => {
  const gridRef = useRef(null);
  const [rowData, setRowData] = useState([]);

  const defaultGridMemo = useMemo(
    () => DefaultGridSetting({ title: t("menu.myView"), viewName: "MyView", columnDefs }),
    []
  );

  return (
    <Box className="ag-theme-balham" sx={{ width: "100%", height: "400px" }}>
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        {...defaultGridMemo}
        onGridReady={(e) => onGridReady(e, "myGrid")}
        onCellValueChanged={onCellValueChanged}
        onRowSelected={onRowSelected}
      />
    </Box>
  );
};
```

**필수 체크**:
- 컨테이너 `Box` 에 `className="ag-theme-balham"` **필수** (없으면 스타일 없는 흰 화면)
- 컨테이너에 명시적 `height` 또는 `flex:1 + minHeight:0` 필수 (AG-Grid 는 부모 높이 100% 채움)
- `ref={gridRef}` 는 `DataState.getAllStateData(gridRef)` 등 유틸에 필요

### §1.2 DefaultGridSetting — 팩토리 함수 (컴포넌트 아님)

```js
import DefaultGridSetting, { DpDefaultGridSetting, nullSafeComparator }
  from "@plannel/components/aggrid/DefaultGridSetting";

// ✅ useMemo 안에서 호출 (리렌더마다 재생성 방지)
const defaultGridMemo = useMemo(
  () => DefaultGridSetting({ title, viewName, columnDefs, gridId }),
  []  // 빈 deps — columnDefs 변경 시에만 deps 추가
);

// spread 로 AgGridReact 에 적용
<AgGridReact ref={gridRef} rowData={rowData} {...defaultGridMemo} />
```

**반환 객체 포함 내용**:
| 속성 | 기본값 |
|---|---|
| `defaultColDef.sortable` | `true` |
| `defaultColDef.resizable` | `true` |
| `defaultColDef.editable` | `true` |
| `defaultColDef.width` | `190` |
| `defaultColDef.wrapHeaderText` | `true` |
| `defaultColDef.autoHeaderHeight` | `true` |
| `defaultColDef.comparator` | `nullSafeComparator` |
| `rowSelection` | `'multiple'` |
| `enableRangeSelection` | `true` |
| `stopEditingWhenCellsLoseFocus` | `true` |
| `getRowStyle` | `DataState.getRowStyles` |
| `getRowClass` | `DataState.getRowClass` |
| `onCellValueChanged` | `DataState.setDataState(e)` 호출 포함 |

`DpDefaultGridSetting` — DP(수요계획) 도메인 전용 기본값 (기간 컬럼 처리 포함).

### §1.3 컬럼 타입 (`columnTypes`)

DefaultGridSetting 이 등록하는 타입. 컬럼 정의의 `type` 배열에 사용:

| 타입 이름 | 용도 |
|---|---|
| `numberColumn` | 정수 — `rightAligned` + `numericEditor` |
| `currencyNumberColumn` | 통화 — 소수점 없는 숫자 서식 |
| `decimalPointColumn` | 소수점 숫자 |
| `rationalColumn` | 비율 (0~1 소수) |
| `percentColumn` | 백분율 표시 (0~100) |
| `nonEditableColumn` | 편집 불가 — `editable: false` + 회색 스타일 |
| `booleanColumn` | Y/N 또는 true/false |
| `defaultValueParser` | 빈 셀 파서 |
| `defaultValueFormatter` | null/undefined → '' 포맷터 |

```js
// ✅ 컬럼 정의 예시
const columnDefs = [
  { headerName: "menu.name",   field: "name",     width: 200, checkboxSelection: true, pinned: "left" },
  { headerName: "menu.qty",    field: "qty",       width: 120, type: ["numberColumn", "rightAligned"] },
  { headerName: "menu.rate",   field: "rate",      width: 100, type: ["percentColumn"] },
  { headerName: "menu.status", field: "statusCd",  width: 140, type: ["nonEditableColumn"] },
  {
    headerName: "menu.groupLabel",
    groupId: "groupA",
    children: [
      { headerName: "menu.child1", field: "child1", width: 110 },
      { headerName: "menu.child2", field: "child2", width: 110 }
    ]
  },
];
```

**headerName 규칙**: i18n 키 문자열 그대로 작성 — `GridUtils.gridValueL10N(t)` 가 `onGridReady` 시점에 변환.

### §1.4 GridUtils

```js
import GridUtils from "@plannel/components/aggrid/GridUtils";

// ① 컬럼 정의 교체 (동적 컬럼 변경)
GridUtils.setColumnDefs(gridApi, newColDefs);

// ② headerName i18n 일괄 적용 — onGridReady 또는 컬럼 변경 후 호출
//    columnDefs 의 headerName 을 t(headerName) 으로 변환
const onGridReady = (e) => {
  GridUtils.setColumnDefs(e.api, GridUtils.gridValueL10N(t)(columnDefs));
};

// ③ 선택 행으로 스크롤
GridUtils.focusOnSelectedRow(gridRef);

// ④ 개인화 컬럼 숨김 키 (AG-Grid Column State 에서 제외할 컬럼)
GridUtils.IGNORE_P13N_COLLID  // string[]
```

`GridUtils.gridValueL10N(t)` 는 `useTranslation()` 의 `t` 를 받아 curried 함수 반환.

### §1.5 DataState — 더티 행 추적

```js
import DataState from "@plannel/components/aggrid/DataState";

// ① 그리드 초기화 — 데이터 로드 완료 후 호출 (더티 상태 리셋)
DataState.initialize(gridRef.current?.api);

// ② 편집 감지 — DefaultGridSetting 이 자동 등록 (중복 등록 불필요)
//    수동 등록이 필요할 때만:
onCellValueChanged={(e) => DataState.setDataState(e)}

// ③ 저장 직전 변경 행 추출
const changedData = DataState.getAllStateData(gridRef);
// 반환: { created: [], updated: [], deleted: [], createAndDeleted: [] }

// ④ 삭제 행 추출 전용
const deleteRows = DataState.deleteState(gridRef);
```

**중요**: `DataState.initialize` 는 서비스 호출 `.finally()` 에서 호출.

```js
someService.getAll(params)
  .then(res => { setRowData(res.data?.results ?? []); })
  .catch(e => { console.error(e); })
  .finally(() => { DataState.initialize(gridRef.current?.api); }); // 항상 초기화
```

### §1.6 커스텀 에디터 / 렌더러

```js
// 숫자 입력 에디터
import NumericEditor from "@plannel/components/aggrid/NumericEditor";

// 달력 그룹 렌더러 (월별 컬럼 그룹)
import CalendarGroupRenderer from "@plannel/components/aggrid/CalendarGroupRenderer";
import CycleCalendarRenderer from "@plannel/components/aggrid/CycleCalendarRenderer";

// 커스텀 헤더
import CustomHeaderGroup  from "@plannel/components/aggrid/CustomHeaderGroup";
import CustomDetailHeader from "@plannel/components/aggrid/CustomDetailHeader";
import CustomHeaderMenuIcon from "@plannel/components/aggrid/CustomHeaderMenuIcon";

// 툴팁
import CustomTooltip from "@plannel/components/aggrid/CustomTooltip";

// 필터 상태 패널
import FilterStatusPanel from "@plannel/components/aggrid/FilterStatusPanel";

// 컬럼 정의에 에디터 적용
const columnDefs = [
  { headerName: "menu.qty",     field: "qty",     cellEditor: NumericEditor,
    type: ["numberColumn"], width: 110 },
  { headerName: "menu.endDate", field: "endDate",
    valueFormatter: (p) => dateUtils.formatDate(p.value, "yyyy-MM"),
    width: 90 },
];
```

### §1.7 엑셀 내보내기

```js
import GridExportSetting from "@plannel/components/aggrid/GridExportSetting";

const onExport = () => {
  const exportParams = GridExportSetting({ title: t("menu.myPage"), gridRef });
  gridRef.current?.api?.exportDataAsExcel(exportParams);
};
```

---

## §2. 레이아웃 컴포넌트

### §2.1 FilterContainer — 필터 영역

```jsx
import FilterContainer from "@plannel/components/layout/FilterContainer";
import { Box, TextField, Button } from "@mui/material";

<FilterContainer>
  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
    <TextField size="small" label={t("menu.name")} value={name}
      onChange={(e) => setName(e.target.value)} />
    <Button variant="contained" onClick={handleSearch}>{t("search")}</Button>
  </Box>
</FilterContainer>
```

**Props**:
| prop | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `children` | `node` | 필수 | 필터 내용 |
| `sx` | `object` | `{}` | 외부 Box sx override |
| `hasIcons` | `boolean` | `true` | `false` 이면 마지막 자식에 null 추가 |

**동작**: 마지막 자식은 우측 float + 접기/펼치기(`FilterListIcon`/`FilterListOffIcon`) 토글 버튼 자동 추가. 접힌 상태에서 마지막 자식 외 모든 자식은 `display:none`.

복수 행 필터:
```jsx
<FilterContainer>
  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
    <TextField size="small" label={t("menu.name")} ... />
    <Select ... />
  </Box>
  {/* 마지막 자식 — 우측 float 영역 */}
  <Box sx={{ display: "flex", gap: 1 }}>
    <Button variant="contained" onClick={handleSearch}>{t("search")}</Button>
  </Box>
</FilterContainer>
```

### §2.2 페이지 골격 — MUI 직접 사용

PlanNEL 화면에는 `ContentInner` 같은 전용 wrapper 가 없다. MUI `Box` 로 직접 구성.

```jsx
// ✅ 표준 페이지 구조
const MyPage = ({ t }) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", p: 1 }}>
      {/* 필터 영역 */}
      <FilterContainer>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TextField size="small" label={t("menu.name")} ... />
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="contained" onClick={handleSearch}>{t("search")}</Button>
        </Box>
      </FilterContainer>

      {/* 액션 버튼 영역 */}
      <Box sx={{ display: "flex", gap: 1, my: 1 }}>
        <SaveButton onClick={handleSave} />
        <DeleteButton onClick={handleDelete} />
      </Box>

      {/* 그리드 영역 — flex:1 + minHeight:0 필수 */}
      <Box className="ag-theme-balham" sx={{ flex: 1, minHeight: 0 }}>
        <AgGridReact ref={gridRef} rowData={rowData} {...defaultGridMemo} />
      </Box>
    </Box>
  );
};

export default withTranslation()(MyPage);
```

**`flex: 1, minHeight: 0`** — 그리드 컨테이너에 반드시 적용. `minHeight: 0` 없으면 flex 자식의 자연 높이가 0 → AG-Grid 보이지 않음.

### §2.3 분할 레이아웃

```jsx
// 상하 분할 (마스터-디테일)
<Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
  <Box className="ag-theme-balham" sx={{ height: "40%", minHeight: 0 }}>
    <AgGridReact ref={masterGridRef} rowData={masterData} {...masterGridMemo} />
  </Box>
  <Box className="ag-theme-balham" sx={{ flex: 1, minHeight: 0 }}>
    <AgGridReact ref={detailGridRef} rowData={detailData} {...detailGridMemo} />
  </Box>
</Box>

// 좌우 분할
<Box sx={{ display: "flex", height: "100%", gap: 1 }}>
  <Box className="ag-theme-balham" sx={{ width: "30%", minWidth: 0 }}>
    <AgGridReact ref={leftGridRef} ... />
  </Box>
  <Box className="ag-theme-balham" sx={{ flex: 1, minWidth: 0 }}>
    <AgGridReact ref={rightGridRef} ... />
  </Box>
</Box>
```

### §2.4 탭 레이아웃

```jsx
import { Tabs, Tab, Box } from "@mui/material";

const [tabValue, setTabValue] = useState(0);

<Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
  <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
    <Tab label={t("menu.tab1")} value={0} />
    <Tab label={t("menu.tab2")} value={1} />
  </Tabs>
  <Box sx={{ flex: 1, minHeight: 0, display: tabValue === 0 ? "flex" : "none",
             flexDirection: "column" }}>
    {/* 탭 1 콘텐츠 */}
  </Box>
  <Box sx={{ flex: 1, minHeight: 0, display: tabValue === 1 ? "flex" : "none",
             flexDirection: "column" }}>
    {/* 탭 2 콘텐츠 */}
  </Box>
</Box>
```

---

## §3. ActionIconButton 인벤토리

모두 `@plannel/components/ActionIconButton` 에서 named import.

```jsx
import {
  AddButton, BulkValueUpdateButton, CalculationButton, CheckButton,
  CreateButton, DeleteButton, DetailButton, DownloadButton,
  EditButton, FilterButton, FullScreenButton, LockButton,
  RemoveButton, ResetButton, ResultButton, RunButton, RunningButton,
  SaveButton, SettingsButton, UnlockButton, UploadButton,
} from "@plannel/components/ActionIconButton";
```

### §3.1 전체 버튼 목록

| Export 이름 | 기본 `label` (i18n 키) | 주요 용도 |
|---|---|---|
| `SaveButton` | `"save"` | 그리드 저장 |
| `DeleteButton` | `"delete"` | 행 삭제 |
| `AddButton` | `"add"` | 행 추가 |
| `CreateButton` | `"create"` | 신규 생성 |
| `EditButton` | `"edit"` | 편집 모드 |
| `RemoveButton` | `"remove"` | 제거 |
| `ResetButton` | `"reset"` | 초기화 / 재조회 |
| `RunButton` | `"run"` | 실행 |
| `RunningButton` | `"running"` | 실행 중 표시 |
| `CalculationButton` | `"calculation"` | 계산 |
| `ResultButton` | `"result"` | 결과 조회 |
| `CheckButton` | `"check"` | 확인/검증 |
| `LockButton` | `"lock"` | 잠금 |
| `UnlockButton` | `"unlock"` | 잠금 해제 |
| `DownloadButton` | `"download"` | 다운로드/엑셀 |
| `UploadButton` | `"upload"` | 업로드 |
| `BulkValueUpdateButton` | `"bulkValueUpdate"` | 일괄 값 수정 |
| `SettingsButton` | `"settings"` | 설정 |
| `FullScreenButton` | `"fullScreen"` | 전체화면 |
| `DetailButton` | `"detail"` | 상세 보기 |
| `FilterButton` | `"filter"` | 필터 토글 |

### §3.2 사용 패턴

```jsx
// 기본 — label 기본값 그대로 (i18n 키 자동 번역)
<SaveButton onClick={handleSave} />
<DeleteButton onClick={handleDelete} disabled={!selectedRows.length} />

// label 재정의 (i18n 키로)
<RunButton label="calculate" onClick={handleCalculate} />

// MUI IconButton props 전달 가능
<SaveButton onClick={handleSave} size="small" color="primary" />
```

**구현 패턴 (내부)**:
```jsx
const SaveButton = ({ label = "save", ...others }) => {
  const { t } = useTranslation();
  return (
    <Tooltip title={t(label)}>
      <Box component="span">
        <IconButton {...others}><SaveIcon /></IconButton>
      </Box>
    </Tooltip>
  );
};
```
→ `label` prop 은 항상 i18n 키. 한글 하드코딩 금지.

---

## §4. Redux UI 상태 — viewStates 슬라이스

**원칙**: Redux 는 **UI 상태 영속화** (검색 조건, 선택 탭, 그리드 열 상태 등) 에만 사용. API 결과 저장 금지 (`30-data-access.md §11`).

### §4.1 읽기 — `reduxUtil.getViewState`

```js
import reduxUtil from "@plannel/utils/reduxUtil";

// 컴포넌트 마운트 시 또는 이벤트 핸들러에서 store 직접 읽기 (훅 불필요)
const reduxViewState = reduxUtil.getViewState(viewName);
// 반환: undefined 또는 { viewName, ...savedFields }

const savedSearchName = reduxViewState?.searchName ?? "";
const savedTabIndex   = reduxViewState?.tabIndex   ?? 0;
```

### §4.2 쓰기 — `dispatch(updateViewState(...))`

```js
import { useDispatch } from "react-redux";
import { updateViewState } from "@plannel/redux/modules/viewStates";

const reduxDispatch = useDispatch();

// 상태 저장 (viewName 기준 upsert)
reduxDispatch(updateViewState({
  viewName,               // 화면 고유 식별자 (컴포넌트 이름 권장)
  searchName: name,       // 저장할 필드들
  tabIndex:   currentTab,
}));
```

### §4.3 viewStates 슬라이스 구조 (참고)

```js
// @plannel/redux/modules/viewStates.js
import { createSlice, current } from "@reduxjs/toolkit";

const initialState = { viewInfos: [] };

export const viewState = createSlice({
  name: "viewStates",
  initialState,
  reducers: {
    updateViewState: (state, action) => {
      // viewName 기준 upsert
      const viewInfos = current(state.viewInfos);
      const { payload } = action;
      const findState = viewInfos.find((v) => v.viewName === payload.viewName);
      if (findState?.viewName) {
        state.viewInfos = viewInfos.map((item) =>
          item.viewName === findState.viewName ? { ...item, ...payload } : item
        );
      } else {
        state.viewInfos = viewInfos.concat(payload);
      }
    },
    removeViewState: (state, action) => {
      const viewInfos = current(state.viewInfos);
      const { payload } = action;
      const findState = viewInfos.find((item) => item.viewName === payload?.viewName);
      if (findState?.viewName) {
        state.viewInfos = viewInfos.filter((item) => item.viewName !== findState.viewName);
      } else {
        state.viewInfos = viewInfos;
      }
    },
    initViewState: (state) => { state.viewInfos = []; },
  },
});

export const { updateViewState, removeViewState, initViewState } = viewState.actions;
export default viewState.reducer;
```

### §4.4 사용 예 — 검색 조건 영속화

```jsx
const viewName = "TargetInventorySimulation";
const reduxDispatch = useDispatch();

// 마운트 시 복원
useEffect(() => {
  const saved = reduxUtil.getViewState(viewName);
  if (saved?.scenarioName) setScenarioName(saved.scenarioName);
}, []);

// 검색 실행 시 저장
const handleSearch = () => {
  reduxDispatch(updateViewState({ viewName, scenarioName }));
  loadData();
};
```

---

## §5. 다국어 (`react-i18next`)

### §5.1 함수형 컴포넌트 — `useTranslation()` 훅

```jsx
import { useTranslation } from "react-i18next";

const MyComponent = () => {
  const { t } = useTranslation();
  return <Typography>{t("menu.scenario")}</Typography>;
};
```

### §5.2 클래스 컴포넌트 / 페이지 — `withTranslation()` HOC

```jsx
import { withTranslation } from "react-i18next";

class MyPage extends React.Component {
  render() {
    const { t } = this.props;
    return <div>{t("menu.actualSales")}</div>;
  }
}

export default withTranslation()(MyPage);
```

**모든 페이지 컴포넌트는 `withTranslation()` 으로 export** (라우팅 레이어가 `t` prop 주입).

### §5.3 키 패턴

```json
// translation.ko-kr.json 구조 (일부)
{
  "menu": {
    "scenario":    "버전",
    "actualSales": "판매 실적",
    "activeFlg":   "사용",
    "name":        "이름",
    "status":      "상태"
  },
  "MSG_SaveSuccess":   "저장되었습니다.",
  "MSG_DeleteConfirm": "삭제하시겠습니까?",
  "save":   "저장",
  "delete": "삭제",
  "search": "검색",
  "reset":  "초기화",
  "add":    "추가"
}
```

| 키 범주 | 예시 |
|---|---|
| 필드 라벨 | `t("menu.scenario")`, `t("menu.activeFlg")` |
| 버튼/액션 | `t("save")`, `t("delete")`, `t("search")` |
| 메시지 | `t("MSG_SaveSuccess")`, `t("MSG_DeleteConfirm")` |
| AG-Grid headerName | 컬럼 정의에 i18n 키 문자열 그대로 — `GridUtils.gridValueL10N(t)` 로 변환 |

### §5.4 AG-Grid headerName i18n 적용

```js
// columnDefs 에 i18n 키 그대로
const columnDefs = [
  { headerName: "menu.scenario", field: "name" },
  { headerName: "menu.status",   field: "statusCd" },
];

// onGridReady 에서 번역 적용
const onGridReady = (e) => {
  GridUtils.setColumnDefs(e.api, GridUtils.gridValueL10N(t)(columnDefs));
};
```

---

## §6. MUI 입력 컴포넌트 (필터 영역)

직접 `@mui/material` import. wingui InputField / SearchArea 없음.

```jsx
import {
  TextField, Select, MenuItem, FormControl, InputLabel,
  Autocomplete, Checkbox, FormControlLabel,
  Button, IconButton,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
```

### §6.1 TextField

```jsx
<TextField
  size="small"
  label={t("menu.name")}
  value={name}
  onChange={(e) => setName(e.target.value)}
  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
  sx={{ width: 200 }}
/>
```

### §6.2 Select (공통코드 드롭다운)

```jsx
const [options, setOptions] = useState([]);

useEffect(() => {
  commonCodeService.getCodes({ groupCd: "STATUS_CD" })
    .then(res => setOptions(res.data ?? []));
}, []);

<FormControl size="small" sx={{ minWidth: 140 }}>
  <InputLabel>{t("menu.status")}</InputLabel>
  <Select value={statusCd} label={t("menu.status")}
          onChange={(e) => setStatusCd(e.target.value)}>
    <MenuItem value="">{t("all")}</MenuItem>
    {options.map(opt => (
      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
    ))}
  </Select>
</FormControl>
```

### §6.3 Autocomplete

```jsx
<Autocomplete
  size="small"
  options={scenarioOptions}
  getOptionLabel={(opt) => opt.name ?? ""}
  value={selectedScenario}
  onChange={(_, v) => setSelectedScenario(v)}
  renderInput={(params) => (
    <TextField {...params} label={t("menu.scenario")} sx={{ width: 220 }} />
  )}
/>
```

### §6.4 DatePicker

```jsx
<LocalizationProvider dateAdapter={AdapterDateFns}>
  <DatePicker
    label={t("startDate")}
    value={startDate}
    onChange={(v) => setStartDate(v)}
    slotProps={{ textField: { size: "small", sx: { width: 160 } } }}
  />
</LocalizationProvider>
```

---

## §7. 서비스 호출 패턴

상세 → `30-data-access.md §2~§5`.

```js
import someService from "@plannel/services/some/some-service";

// 조회
const loadData = () => {
  setLoading(true);
  someService.getAll({ param1: value1 })
    .then(res => {
      setRowData(res.data?.results ?? []);
      setTotal(res.data?.totalElements ?? 0);
    })
    .catch(e => console.error(e))
    .finally(() => {
      setLoading(false);
      DataState.initialize(gridRef.current?.api);
    });
};

// 저장
const handleSave = () => {
  const changedData = DataState.getAllStateData(gridRef);
  const toSave = [...changedData.created, ...changedData.updated];
  if (!toSave.length) return;
  someService.save(toSave)
    .then(() => { alert(t("MSG_SaveSuccess")); loadData(); })
    .catch(e => console.error(e));
};

// 삭제
const handleDelete = () => {
  const deleteRows = DataState.deleteState(gridRef);
  if (!deleteRows.length) return;
  someService.delete(deleteRows)
    .then(() => loadData())
    .catch(e => console.error(e));
};
```

**restApi 인스턴스** (`30-data-access.md §4`):
- `restApi` — 기본
- `restApiDP` — 수요계획 (`x-module-name: DP`)
- `restApiIP` — 재고계획 (`x-module-name: IP`)
- `restApiRP` — 보충계획 (`x-module-name: RP`)
- `restApiMP` — 생산계획 (`x-module-name: MP`)

---

## §8. 페이지 라이프사이클 표준

```jsx
import { AgGridReact } from "@ag-grid-community/react";
import { Box, TextField, Button } from "@mui/material";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { withTranslation } from "react-i18next";
import DefaultGridSetting from "@plannel/components/aggrid/DefaultGridSetting";
import DataState from "@plannel/components/aggrid/DataState";
import GridUtils from "@plannel/components/aggrid/GridUtils";
import FilterContainer from "@plannel/components/layout/FilterContainer";
import { SaveButton, DeleteButton } from "@plannel/components/ActionIconButton";
import { updateViewState } from "@plannel/redux/modules/viewStates";
import reduxUtil from "@plannel/utils/reduxUtil";
import someService from "@plannel/services/some/some-service";

const viewName = "MyPage";

const columnDefs = [
  { headerName: "menu.name",   field: "name",     width: 200, checkboxSelection: true },
  { headerName: "menu.status", field: "statusCd", width: 140, type: ["nonEditableColumn"] },
];

const MyPage = ({ t }) => {
  const [rowData, setRowData]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searchName, setSearchName] = useState("");
  const gridRef        = useRef(null);
  const reduxDispatch  = useDispatch();

  const defaultGridMemo = useMemo(
    () => DefaultGridSetting({ title: t("menu.myPage"), viewName, columnDefs }),
    []
  );

  // Redux 복원
  useEffect(() => {
    const saved = reduxUtil.getViewState(viewName);
    if (saved?.searchName) setSearchName(saved.searchName);
  }, []);

  // 초기 로드
  useEffect(() => { loadData(); }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    someService.getAll({ name: searchName })
      .then(res => { setRowData(res.data?.results ?? []); })
      .catch(e => { console.error(e); })
      .finally(() => {
        setLoading(false);
        DataState.initialize(gridRef.current?.api);
      });
  }, [searchName]);

  const handleSearch = () => {
    reduxDispatch(updateViewState({ viewName, searchName }));
    loadData();
  };

  const handleSave = () => {
    const { created, updated } = DataState.getAllStateData(gridRef);
    someService.save([...created, ...updated])
      .then(() => { alert(t("MSG_SaveSuccess")); loadData(); })
      .catch(e => console.error(e));
  };

  const onGridReady = (e) => {
    GridUtils.setColumnDefs(e.api, GridUtils.gridValueL10N(t)(columnDefs));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", p: 1 }}>
      <FilterContainer>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TextField size="small" label={t("menu.name")} value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
        </Box>
        <Box>
          <Button variant="contained" onClick={handleSearch}>{t("search")}</Button>
        </Box>
      </FilterContainer>

      <Box sx={{ display: "flex", gap: 1, my: 1 }}>
        <SaveButton onClick={handleSave} />
        <DeleteButton onClick={() => DataState.deleteState(gridRef)} />
      </Box>

      <Box className="ag-theme-balham" sx={{ flex: 1, minHeight: 0 }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          {...defaultGridMemo}
          onGridReady={onGridReady}
        />
      </Box>
    </Box>
  );
};

export default withTranslation()(MyPage);
```

---

## §9. 안티패턴 카탈로그

| # | ❌ 금지 | ✅ PlanNEL 표준 | 이유 |
|---|---|---|---|
| AP-1 | `import { BaseGrid } from '@wingui/common/imports'` | `import { AgGridReact } from "@ag-grid-community/react"` | wingui 는 PlanNEL 에 없음 |
| AP-2 | `import { ContentInner, SearchArea, InputField } from '@wingui/common/imports'` | MUI `Box`, `FilterContainer`, `TextField` 직접 사용 | 동일 |
| AP-3 | `import { useViewStore, useContentStore } from '@wingui/common/imports'` | `useDispatch()` + `dispatch(updateViewState({viewName,...}))` | PlanNEL 은 Redux Toolkit |
| AP-4 | `setViewInfo(activeViewId, 'globalButtons', [...])` | `reduxDispatch(updateViewState({ viewName, ...uiState }))` | wingui 전용 API |
| AP-5 | `transLangKey('KEY')` | `const { t } = useTranslation(); t('menu.key')` | react-i18next 사용 |
| AP-6 | `zAxios.get('/util/...')` | `someService.getAll(params).then(...)` | 서비스 레이어 경유 필수 |
| AP-7 | `<BaseGrid items={colDefs} afterGridCreate={fn} />` | `<AgGridReact ref={gridRef} columnDefs={colDefs} onGridReady={fn} />` | API 완전 상이 |
| AP-8 | `grid.dataProvider.fillJsonData(rows)` | `setRowData(rows)` (React state) | AG-Grid 는 React state 패턴 |
| AP-9 | `grid.dataProvider.getAllStateRows()` | `DataState.getAllStateData(gridRef)` | DataState 유틸 사용 |
| AP-10 | `multipart/form-data` + `'changes'` key POST | JSON body `{ created, updated, deleted }` | `30-data-access.md §3` |
| AP-11 | `createAsyncThunk` 로 API 결과 저장 | `useState` + `.then()/.catch()` 직접 처리 | `30-data-access.md §10` |
| AP-12 | `applyGridCascade` / `useFieldCascade` | AG-Grid `onCellValueChanged` + 직접 필드 연동 로직 | wingui-core 전용 |
| AP-13 | `import { SplitPanel } from '@zionex/wingui-core'` | MUI `Box` flex 레이아웃 직접 구성 | 동일 |
| AP-14 | `<TabContainer tabs={[...]} />` | MUI `Tabs` + `Tab` 직접 구성 | 동일 |
| AP-15 | 그리드 컨테이너에 `minHeight: 0` 누락 | `sx={{ flex: 1, minHeight: 0 }}` 필수 | 0px collapse 방지 |
| AP-16 | `className` 없이 `<AgGridReact />` 렌더 | 부모 `Box` 에 `className="ag-theme-balham"` 필수 | 스타일 없음 |
| AP-17 | `DefaultGridSetting(...)` 을 `useMemo` 없이 호출 | `useMemo(() => DefaultGridSetting({...}), [])` | 매 렌더마다 재생성 방지 |
| AP-18 | 데이터 로드 후 `DataState.initialize` 생략 | `.finally(() => DataState.initialize(gridRef.current?.api))` | 더티 상태 누적 방지 |
| AP-19 | `headerName` 에 한글 하드코딩 | i18n 키 문자열 + `GridUtils.gridValueL10N(t)` | 다국어 지원 |
| AP-20 | Redux 에 API 결과(목록 데이터) 저장 | `useState` 로 컴포넌트 로컬 상태 관리 | `30-data-access.md §11` |
| AP-21 | `withTranslation()` HOC 누락 | `export default withTranslation()(MyPage)` | t prop 미주입 시 번역 불가 |

---

## 관련 파일

- `30-data-access.md` — 서비스 패턴·Redux 규칙 (권위)
- `@plannel/components/aggrid/DefaultGridSetting.js`
- `@plannel/components/aggrid/DataState.js`
- `@plannel/components/aggrid/GridUtils.js`
- `@plannel/components/ActionIconButton.js`
- `@plannel/components/layout/FilterContainer.js`
- `@plannel/redux/modules/viewStates.js`
- `src/pages/inventory-plan/inventory-simulation/TargetInventorySimulation.js` — 대표 페이지 참조

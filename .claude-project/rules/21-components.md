# 21. KTNG 공용 컴포넌트 인벤토리

> KTNG 화면이 사용하는 공용 React 컴포넌트·훅·유틸 목록. 모두 `@wingui/common/imports` 단일 경로에서 import.

## 1. 레이아웃 래퍼 (필수)

| 컴포넌트 | 역할 | 비고 |
|---|---|---|
| `ContentInner` | 화면 최상위 컨테이너 | **모든 화면 필수** |
| `ViewPath` | 메뉴 경로 표시 (선택) | |
| `SearchArea` | 조회 조건 영역 | 접거나 좌측 고정 가능 |
| `SearchRow` | 조회 조건 한 행 | SearchArea 자식 |
| `WorkArea` | 메인 작업 영역 (그리드/차트) | flex: 1 |
| `ResultArea` | 결과 전용 영역 | 일부 화면 |
| `StatusArea` | 하단 상태 메시지 | 선택 |
| `ButtonArea` | 버튼 묶음 컨테이너 | |
| `LeftButtonArea` / `RightButtonArea` | 좌/우 정렬 버튼 | |
| `PopupDialog` | 팝업 다이얼로그 | 표준 양식 — Pop\*Ktng\*.jsx |

## 2. 입력 / 폼

### 2.1 `InputField`
지원 타입: `text`, `number`, `select`, `multiSelect`, `autocomplete`, `dateRange`, `datetime`, `check`, `radio`, `popover`, `textarea`, `action`

`react-hook-form` 의 `control` prop 으로 연결.

```jsx
const { control, getValues, setValue, handleSubmit, watch } = useForm({
  defaultValues: { salesOrg: '', startDt: null, endDt: null },
});

<InputField control={control} type="select" name="salesOrg" label="Sales Org"
  options={salesOrgOptions} />
<InputField control={control} type="datetime" name="startDt" label="START_DT"
  displayType="date" />
```

### 2.2 ⛔ `useForm({ defaultValues })` — 타입별 초기값

| type | ✅ 초기값 | ❌ 금지 |
|---|---|---|
| text/textarea/action | `''` | — |
| select/radio | `''` 또는 첫 옵션 value | — |
| multiSelect/autocomplete(multi) | `[]` | `''` |
| number | `null` 또는 숫자 | `''` (NaN) |
| check | `false` | `''` |
| **datetime** | **`null`** | `''` (Invalid Date!) |
| dateRange | `[null, null]` | `''` · `[]` |

## 3. 그리드 (RealGrid2)

### 3.1 `BaseGrid`

```jsx
<BaseGrid
  id="grid1"                  // 문자열 id (필수)
  items={grid1Items}           // ★ items (columns 아님)
  afterGridCreate={(gridObj, gridView, dataProvider) => { setGrid1(gridObj); }}
/>
```

KTNG 의 grid 객체 사용 패턴 (BfKtng01 기반):
- `grid1.dataProvider.fillJsonData(rows)` — 데이터 주입
- `grid1.dataProvider.getAllStateRows()` — `{created, updated, deleted, createAndDeleted}`
- `grid1.dataProvider.getOutputRow({booleanFormat: 'N:Y'}, row)` — 변경 행 출력
- `grid1.gridView.commit(true)` — 편집 중인 셀 commit
- `grid1.gridView.refresh()` — 갱신
- `grid1.gridView.setColumnProperty(name, prop, value)` — 컬럼 속성 동적 변경
- `grid1.gridView.validateCells(null, false)` — 검증
- `grid1.gridView.setDisplayOptions({ fitStyle: 'fill' })` — afterGridCreate 안에서
- `grid1.gridView.onCellButtonClicked = (grid, itemIndex, column) => {...}` — 셀 액션 버튼
- `grid1.gridView.onGetEditValue = (grid, index, editResult) => {...}` — 편집값 후처리
- `grid1.gridView.setRowStyleCallback(callback)` — 행 스타일 콜백
- `grid1._dataProvider.getRowState(rowIndex)` — `"created" | "updated" | "deleted" | "none"` (★ KTNG 일부 코드는 `_dataProvider`)

### 3.2 컬럼 정의 — 컴포넌트 밖

```jsx
let grid1Items = [
  // ─── 컬럼 그룹 (KTNG 흔히 사용) ────────────────────────────────
  {name: 'ORG', dataType: 'group', orientation: 'horizontal',
    headerText: 'ORG', expandable: false, expanded: false,
    childs: [
      {name: "SALES_ORG", dataType: "text", headerText: "SALES_ORG",
        visible: true, editable: false, width: 80,
        textAlignment: "center", groupShowMode: "always"},
    ]
  },

  // ─── 일반 컬럼 ──────────────────────────────────────────────────
  {name: "ACCOUNT_CD", dataType: "text", headerText: "ACCOUNT",
    width: 80, textAlignment: "near",
    validRules: [{ criteria: "required" }],
    exportStyleName: "excel-req-column-left"},

  // ─── 신규행만 편집 가능 (styleCallback 패턴) ─────────────────────
  {name: "ITEM_LV3_CD", dataType: "text", headerText: "ITEM_LV_3_CD",
    width: 100, textAlignment: "center",
    button: "action", buttonVisibleCallback: isGridButtonVisible,
    styleCallback: function (grid, dataCell) {
      const ret = {};
      if (dataCell.item.rowState == "created") {
        ret.editable = true;
        ret.styleName = "editable-column column-textAlignt-center";
      } else {
        ret.editable = false;
        ret.styleName = "column-textAlignt-center";
      }
      return ret;
    },
  },

  // ─── 일자 ───────────────────────────────────────────────────────
  {name: "START_DT", dataType: "datetime", headerText: "START_DT",
    timezone: true, width: 80, textAlignment: "center",
    displayType: "date",
    validRules: [{ criteria: "required" }]},

  // ─── 숫자 ───────────────────────────────────────────────────────
  {name: "DISCOUNT_RATE", dataType: "number", headerText: "DISCOUNT_RATE",
    width: 100, textAlignment: "far", numberFormat: "#,##0.##"},

  // ─── 드롭다운 (lookup) ───────────────────────────────────────────
  {name: "PROMOTION_TYPE_NM", dataType: "text", headerText: "PROMOTION_TYPE",
    useDropdown: true, lookupDisplay: true, width: 120, textAlignment: "near"},
];
```

### 3.3 그리드 버튼 (공용)

```jsx
<GridAddRowButton    grid="grid1" />
<GridDeleteRowButton grid="grid1" onDelete={deleteData} onAfterDelete={loadData} />
<GridSaveButton      grid="grid1" onSave={saveData} onAfterSave={loadData} />
<GridExcelExportButton grid="grid1" fileName="BfKtng01" />
<GridExcelImportButton grid="grid1" />
<GridCnt grid="grid1" format={"{0} " + transLangKey("CASES") + " " + transLangKey("MSG_0010")} />
```

⚠️ `grid` prop 은 **문자열 id** — `grid={gridStateRef}` (객체) 금지

## 4. 공용 유틸 / 훅

| 유틸 | 시그니처 / 용도 |
|---|---|
| `zAxios` | HTTP 클라이언트 (axios 래퍼) |
| `baseURI()` | API base URL (예: `'/api/'`) — Controller URL 앞에 prefix |
| `showMessage(title, msg, callback)` | `(answer: boolean) => void` 콜백. 첫 인자 = **제목 문자열** |
| `transLangKey('MSG_0001')` | 다국어 키 변환 |
| `loadComboList({PROCEDURE_NAME, URL, CODE_KEY, CODE_VALUE, ALLFLAG, PARAM})` | 공통코드 콤보 비동기 로드 |
| `validateDateRange(start, end, showMessage, transLangKey, "day")` | 기간 검증 헬퍼 |
| `setVisibleProps(grid, num, state, check)` | RealGrid 의 번호/상태/체크박스 토글 |
| `HTTP_STATUS.SUCCESS` | 200 |

## 5. 상태 / 스토어 (Zustand)

| 스토어 | 보유 키 | 용도 |
|---|---|---|
| `useContentStore` | **`activeViewId`**, `viewList`, `addView`, `removeView` | 활성 뷰 ID |
| `useViewStore` | **`setViewInfo`**, `getViewInfo`, `viewData` | 뷰별 그리드 ref 보관 |
| `useUserStore` | `userInfo`, `setUserInfo` | 로그인 사용자 |
| `useStyles` | (테마 / 스타일 유틸) | |
| `useInsightSystemStore` | `setProvider` (Insight 화면용) | AI 분석 데이터 |

### 5.1 ⚠️ Store 매핑 (swap 금지)

```jsx
// ✅ 올바른 매핑
const [activeViewId] = useContentStore((s) => [s.activeViewId]);
const [setViewInfo]  = useViewStore((s) => [s.setViewInfo]);
const [getViewInfo]  = useViewStore((s) => [s.getViewInfo]);
```

KTNG 화면 패턴 — `getViewInfo` 로 그리드 객체 재취득:
```jsx
let grdObj1 = getViewInfo(activeViewId, "grid1");
grdObj1.gridView.setColumnProperty("PROMOTION_TYPE_NM", "lookupData", {...});
```

## 6. 팝업 (KTNG 패턴)

KTNG 의 팝업은 **각 화면 폴더에 동봉** — 공통 팝업 인벤토리(`PopSelectItem` 등) 는 거의 안 씀.

```jsx
// 예: PopBfKtng01.jsx
<PopupDialog
  open={open} onClose={onClose} onSubmit={handleSubmit(submitFn)}
  title="품목 검색" checks={[gridPopup]}
  resizeWidth={800} resizeHeight={600}
>
  <SearchArea>
    <InputField control={control} name="itemNm" label="품목명" />
  </SearchArea>
  <WorkArea>
    <ResultArea>
      <BaseGrid id="gridPopup" items={popupItems} afterGridCreate={setGridPopup} />
    </ResultArea>
  </WorkArea>
</PopupDialog>
```

호출자:
```jsx
const handleConfirm = (records) => {
  records.forEach((rowData, index) => {
    // 그리드 selectedRow 에 값 주입
  });
};

<PopBfKtng01
  open={itemPopupOpen}
  onClose={() => setItemPopupOpen(false)}
  confirm={handleConfirm}
  multiple={true}
/>
```

## 7. 차트

| 컴포넌트 | 패키지 | 용도 |
|---|---|---|
| `react-chartjs-2` 의 `Line`, `Bar`, `Chart` | `react-chartjs-2` | Chart.js 3.9 |
| `ChartComponent` (있을 시) | `@zionex/wingui-core/component/chart` | 공용 래퍼 |
| `d3` | `d3` | 커스텀 차트 (KTNG 리포트 다수) |

## 8. 네이밍 규약

| 대상 | 규약 | 예 |
|---|---|---|
| 화면 폴더 | lowercase concat | `view/ktng/baselineforecast/master/bfktng01/` |
| 화면 파일 | PascalCase + 2자리 번호 | `BfKtng01.jsx` |
| 팝업 파일 | `Pop<File>.jsx` | `PopBfKtng01.jsx` |
| CSS | `<File>.css` | `BfKtng01.css` |
| 그리드 id | `grid1` · `grid2` · `gridPopup` | 짧은 영문 |
| 그리드 state | `grid1` · `setGrid1` | useState |

## 9. Anti-patterns

| ❌ | ✅ |
|---|---|
| ContentInner 없이 화면 작성 | `<ContentInner>` 최상위 |
| gridItems 컴포넌트 안에 선언 | 컴포넌트 밖 |
| BaseGrid `columns={...}` / `afterCreate={...}` | `items={...}` / `afterGridCreate={...}` |
| grid 객체에 `setData/getChanges` 호출 | `dataProvider.fillJsonData/getAllStateRows` |
| Grid 버튼 `grid={ref객체}` | `grid="<string-id>"` |
| `useViewStore` 에서 `activeViewId` 추출 | `useContentStore` 에서 |
| `useContentStore` 에서 `setViewInfo` 추출 | `useViewStore` 에서 |
| `showMessage('confirm', msg, cb)` | `showMessage(transLangKey('MSG_CONFIRM'), msg, cb)` |
| `useForm({defaultValues:{regDt:''}})` (datetime) | `regDt: null` |
| 그리드 enum 컬럼에 `lookupDisplay:true` 만 (useDropdown 누락) | 둘 다 + values + labels |
| material-icons 폰트 텍스트 | `@mui/icons-material/<Name>` import |

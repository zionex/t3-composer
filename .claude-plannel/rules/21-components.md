---
description: 화면(.jsx)에서 사용하는 공용 컴포넌트 인벤토리.
globs:
  - "**/view/**/*.jsx"
alwaysApply: false
---

# 21. 공용 컴포넌트 인벤토리

> 인벤토리 카탈로그만. 코드 표면 (BaseGrid prop · grid API · zAxios · showMessage · store) 의 권위는
> `41a-composer-jsx.md` · `41c-composer-widgets.md`. 본 문서 예시는 그것을 따름.

## 1. 최상위 레이아웃 (단일 경로 `@wingui/common/imports`)

| 컴포넌트 | 역할 |
|---|---|
| `ContentInner` | 화면 최상위 (flex column, overflow). **모든 화면 필수** |
| `SearchArea` · `SearchRow` | 조회 조건 영역 |
| `WorkArea` · `ResultArea` · `StatusArea` | 작업/결과/상태 |
| `ButtonArea` · `LeftButtonArea` · `RightButtonArea` | 버튼 묶음 |

## 2. 레이아웃 분할 (`@zionex/wingui-core`)

| 컴포넌트 | 실제 prop |
|---|---|
| `SplitPanel` | `direction='horizontal'|'vertical'` · `sizes={[20,80]}` · `minSize={n}` · `sx` ★ `initialSizes/minSizes/defaultSizes` 는 허구 (hook block) |
| `VLayoutBox`/`HLayoutBox` | `sx` · children — 수직/수평 flex |
| `TabContainer` | `value` · `onChange` · children `<Tab>` ★ `tabs={[...]}` 허구 (hook block) |
| `PopupDialog` | `open` · `onClose` · `onSubmit` · `title` · `checks={[grid]}` · `resizeWidth/Height` · `type='CONFIRM'|'NOBUTTONS'` ★ `sizeWidth/sizeHeight/fullWidth/maxWidth` 허구 |

## 3. 입력 필드

### 3.1 `InputField` (from `@wingui/common/imports`)

타입: `text`, `number`, `select`, `multiSelect`, `autocomplete`, `dateRange`, `datetime`, `check`, `radio`, `popover`, `textarea`, `time`, **`action`**

`react-hook-form` 의 `control` prop 연결. `useForm()` 에서 `control`, `getValues`, `setValue`, `watch` 추출.

### 3.1.0 ⛔ `useForm({ defaultValues })` — 타입별 초기값 (필수)

| type | ✅ 초기값 | ❌ 금지 |
|---|---|---|
| `text`/`textarea`/`action`/`popover` | `''` | — |
| `select`/`radio` (단일) | `''` 또는 첫 옵션 value | — |
| `multiSelect`/`autocomplete`(multi) | `[]` | `''` (crash) |
| `number` | `null` 또는 숫자 | `''` (NaN) |
| `check` (단일 boolean) | `false` | `''`·`'N'` |
| **`datetime`** | **`null`** 또는 `new Date()` | **`''` 금지** — Invalid Date |
| **`dateRange`** | **`[null, null]`** | `''`·`[]` |
| `time` | `null` 또는 `'HH:mm'` | `''` |

datetime defaultValue `''` → `new Date('')` → Invalid Date → 매 keystroke RangeError + RHF validator throw. 항상 `null` 시작.

### 3.1.1 `type="action"` 팝업 트리거 — children 필수

```jsx
import SearchIcon from '@mui/icons-material/Search';
<InputField control={control} type="action" name="deptNm" label="부서" title="부서 검색"
  readonly={true}                            // ★ readOnly(camel) 아님
  onClick={() => setDeptPopupOpen(true)}
>
  <SearchIcon fontSize="small" />            // ★ children 필수 (없으면 빈 버튼)
</InputField>
```
❌ 자기닫힘 = 빈 버튼 · `InputProps.endAdornment` = 미동작.

### 3.2 SCM 도메인 특화

| 컴포넌트 | 용도 |
|---|---|
| `PlanScope` | 플랜 스코프 |
| `LocationMultiSearchBox` · `ItemMultiSearchBox` · `ItemSearchInput` · `AccountSearchInput` · `ResourceMultiSearchBox` | 거점/품목/거래처/리소스 단·복수 |
| `UserInputField` | 사용자 선택 |

### 3.3 공통코드 Dropdown — `InputField type="select"` 사용

⛔ **산출물에 `CommonCodeSelect` import 금지** — wingui 본 환경에 없는 컴포넌트 (t3-composer preview shim 전용).

```jsx
const [opts] = useState([{value:'Y',label:'사용'},{value:'N',label:'미사용'}]);
<InputField control={control} type="select" name="useYn" options={opts} />

// 동적 옵션
useEffect(() => {
  zAxios.get('/system/common/codes', { params: { 'group-cd': 'USE_YN' } })
    .then((res) => setOpts(res.data));
}, []);
```

## 4. 그리드 (RealGrid2)

| 컴포넌트 | 경로 | 역할 |
|---|---|---|
| `BaseGrid` | `@wingui/common/imports` | 표준 그리드 (RealGrid2 wrapper) |
| `TreeGrid` | `@zionex/wingui-core/component/grid/TreeGrid` | 계층형 |
| `GridCnt` | `@wingui/common/imports` | 행 카운터 — `format` prop 필수 |
| `PivotTable` | `@zionex/wingui-core/component/dstable/PivotTable` | D/M/P/V 컬럼 피벗 |

### 4.1 BaseGrid 실제 API

| 잘못된 이름 (hook block) | 실제 |
|---|---|
| `columns={...}` | **`items={...}`** |
| `afterCreate={fn}` | **`afterGridCreate={fn}`** `(grid, gridView, dataProvider)` |
| (id 없음) | **`id="<camelCase>Grid"`** (Grid 버튼이 string id 로 참조) |
| `grid.setData(rows)` | **`grid.dataProvider.fillJsonData(rows)`** |
| `grid.getChangedData()` | **`grid.dataProvider.getAllStateRows()`** → `{created, updated, deleted}` |
| (단건 행) | `grid.dataProvider.getJsonRow(idx)` |

### 4.2 그리드 컬럼 정의 — 컴포넌트 밖 + 모든 컬럼 `dataType` 필수

```jsx
// 허용 dataType: 'text' | 'number' | 'datetime' | 'boolean' | 'group'
// key='name', 헤더 라벨='headerText', 정렬='textAlignment'
let gridItems = [
  { name: 'userId', dataType: 'text', headerText: '사용자 ID', width: 130, textAlignment: 'center', editable: true,
    validRules: [{ criteria: 'required' }] },
  { name: 'userNm', dataType: 'text', headerText: '사용자명', width: 120, editable: true },
  { name: 'userTp', dataType: 'text', headerText: '유형', width: 110, textAlignment: 'center', editable: true,
    useDropdown: true, lookupDisplay: true,    // ★ enum 셀 편집 — 4개 필수
    values: ['ADMIN', 'NORMAL'], labels: ['ADMIN', 'NORMAL'] },
  { name: 'useYnBool', dataType: 'boolean', headerText: '사용', width: 80, textAlignment: 'center', editable: true },
  { name: 'joinDt', dataType: 'datetime', headerText: '입사일', width: 110, textAlignment: 'center', editable: true,
    displayType: 'date', datetimeFormat: 'yyyy-MM-dd',
    editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd' } },
];
```

**안티패턴 (hook block):**
- `field:` (실제 `name:`) · `header:`(실제 `headerText:`) · `textAlign:`(실제 `textAlignment:`)
- `type:'combo', items:[]` (실제 `useDropdown:true + lookupDisplay:true + values + labels`)
- `dataType` 누락 → `BaseGrid.jsx:1016` TypeError, 화면 즉시 크래시
- enum 컬럼에 `lookupDisplay:true` 만 (useDropdown 누락) → 셀 편집 자유 text

### 4.3 정렬 규약
- **LEFT** (기본): 이름·이메일·자유 텍스트 (`textAlignment` 생략)
- **CENTER**: 코드·날짜·boolean·enum·등록자·일시
- **`'far'` (RIGHT)**: 숫자

### 4.4 날짜 포맷
- 단일 일자 `yyyy-MM-dd` · 일시 `yyyy-MM-dd HH:mm:ss`
- 그리드 편집 `editor:{type:'date', datetimeFormat:'yyyy-MM-dd'}`
- 기간 선택 `<InputField type="dateRange" displayType="date">`

### 4.5 공용 Grid 버튼 — `grid` prop = **문자열 id**

```jsx
import { transLangKey } from '@zionex/wingui-core';

<GridCnt grid="userInfoGrid" format={"{0} " + transLangKey("CASES") + " " + transLangKey("MSG_0010")} />
<GridAddRowButton    grid="userInfoGrid" />
<GridDeleteRowButton grid="userInfoGrid" onDelete={onDelete} onAfterDelete={handleSearch} />
<GridSaveButton      grid="userInfoGrid" onSave={onSave}     onAfterSave={handleSearch} />
<GridExcelExportButton grid="userInfoGrid" fileName="사용자정보" />
```
❌ `grid={gridStateRef}` (객체) · `<GridCnt grid="...">` 만 (`format` 누락 — 라벨 없이 숫자만)

## 5. 차트

| 컴포넌트 | 경로 | 용도 |
|---|---|---|
| `ChartComponent` | `@zionex/wingui-core/component/chart/ChartComponent` | 공용 Chart.js wrapper |
| `Line`/`Bar`/`Chart`/`PolarArea` | `react-chartjs-2` | 직접 사용 시 |
| `GanttChart` | `@zionex/wingui-core/component/gantt/GanttChart` | 간트 |

업데이트: `chart.current.data.datasets` 갱신 후 `chart.current.update()`. 강제 리마운트: `chartKey` 증가.

## 6. 다이어그램 · 특수

| 컴포넌트 | 경로 | 역할 |
|---|---|---|
| `FLODiagram` | `@zionex/wingui-core/component/workflow/component/FLODiagram` | BOM/공급망 (ReactFlow) |
| `DashboardPanel` | `@zionex/wingui-core/component/dashboard/DashboardPanel` | react-grid-layout 위젯 캔버스 |
| `ZEditor` | `@zionex/wingui-core` | TUI Editor WYSIWYG |
| `MyGoogleMap` | `@zionex/wingui-core` | Google Maps |

## 7. Zustand 스토어

> ★ import 는 **단일 경로 `@wingui/common/imports`**.

```jsx
import { useViewStore, useContentStore, useUserStore, useMenuStore } from '@wingui/common/imports';
```

| 스토어 | 자주 쓰는 키 | 용도 |
|---|---|---|
| `useContentStore` | **`activeViewId`**, `viewList`, `addView`, `removeView` | 활성 뷰 ID |
| `useViewStore` | **`setViewInfo`**, `getViewInfo`, `viewData` | 뷰별 상태: `globalButtons`, grid ref |
| `useUserStore` | `userInfo`, `setUserInfo` | 로그인 사용자 |
| `useMenuStore` | `menuList`, `currentMenu` | 메뉴 경로 |

⚠️ **Store 매핑 swap 금지** (hook block):
```jsx
// ✅ 올바름
const [activeViewId] = useContentStore((s) => [s.activeViewId]);
const [setViewInfo]  = useViewStore((s) => [s.setViewInfo]);

// ❌ swap — selector undefined → setViewInfo is not a function
const [activeViewId] = useViewStore((s) => [s.activeViewId]);
const [setViewInfo]  = useContentStore((s) => [s.setViewInfo]);
```

## 8. 공통 팝업 (`src/view/common/`)

> ⛔ **사전 검증 필수**: `import X from '@wingui/view/common/Y'` 작성 전 `Y.jsx` 파일 존재 확인. 부재 시 일반 `<InputField>` 대체 또는 같이 생성. (PLANNEL 같은 Target 에서는 부재 컴포넌트 다름)

### 8.1 ✅ 실재 (T3SERIES 기준)
- `PopSelectItem` · `PopItemMulti` · `PopSelectAccount` · `PopAccountMulti`
- `PopSelectLvlAndAcct` · `PopSelectLvlAndItem`
- `PopLocatMst` · `PopLocatTp` · `PopLocatTpMulti`
- `PopResourceMulti` · `PopRouteMulti`
- `PopPersonalize` · `PopPersonalizeDp` · `PopKpiWeightConfig`
- `LogPopup` · `LlmMarkdown` · `IconPicker` · `PopLogout` · `PopSimulationVersion`
- `SimulationAiPanel`

⚠️ `CommonCodeSelect` 는 산출물 사용 금지 (preview shim 전용).

### 8.2 ❌ 미실재 (rule 표에 있어도) — 사용 시 같이 생성 또는 InputField 대체
- `PopDepartment` · `PopPosition`

### 8.3 표준 양식 (PopSelectItem 기준 — confirm 콜백 항상 배열)

```jsx
<PopupDialog open onClose onSubmit={handleSubmit(saveSubmit, onError)}
  title checks={[grid]} resizeWidth resizeHeight>
  <SearchArea>
    <InputField control={control} name="xxxCd" label="코드"
      onKeyDown={(e) => e.key === 'Enter' && loadPopupData()} />
  </SearchArea>
  <WorkArea>
    <ButtonArea title="도메인명"><RightButtonArea>
      <CommonButton title="검색" onClick={loadPopupData}>
        <SearchIcon fontSize="small" />
      </CommonButton>
    </RightButtonArea></ButtonArea>
    <ResultArea><BaseGrid id={`${props.id}_Grid`} items={popupGridItems} /></ResultArea>
  </WorkArea>
</PopupDialog>
```

**props 인터페이스**:
- `id`: 고유 prefix · `open` · `onClose`
- `confirm(rows: object[])` — **항상 배열** (호출자는 `firstOf(s)=Array.isArray(s)?s[0]:s` 단건 추출)
- `multiple`: boolean (default false)

호출자 표준:
```jsx
const firstOf = (sel) => Array.isArray(sel) ? sel[0] : sel;
const handleConfirm = (selected) => {
  const row = firstOf(selected);
  if (!row) return;
  setValue('xxxCd', row.xxxCd);
  setValue('xxxNm', row.xxxNm);
};
```

## 9. 공용 유틸 · 서비스

| 유틸 | 시그니처 |
|---|---|
| `zAxios` | wingui REST 클라이언트 (axios wrapper) |
| `zAxios.get(url, { params })` · `zAxios({method,url,headers,data})` | GET / POST 객체 인자 |
| `callService(serviceId, paramMap, target)` | 엔진 API (target ∈ `'mp'|'dp'|'bf'|'fp'`). ★ 신규 화면 사용 금지 — BF/DP/MP/FP 계산 수정 전용 |
| `showMessage(title, message, callback?)` | **첫 인자는 제목 문자열** (★ `'confirm'`/`'error'` 토큰 아님). callback `(answer:boolean) => void` |
| `useFieldCascade({control, setValue, getValues})` | 검색 form cascade hook |
| `applyGridCascade(grid, items, {onCellPopupRequest})` | 그리드 cascade — afterGridCreate 안에서 호출 |
| `buildPopupFilterProps('<child>', getValues)` | Pop\* 에 cascade parent 자동 주입 |
| `loadRecentSimulationVersion()` | 최근 시뮬 버전 |

### 9.1 zAxios 호출 표준 (신규 화면 = REST)

```jsx
// 조회
zAxios.get('util/user-infos', { params: getValues() })
  .then((res) => grid?.dataProvider.fillJsonData(res.data));

// 저장 (GridSaveButton 표준 — multipart/form-data 'changes')
const fd = new FormData();
fd.append('changes', JSON.stringify(payload));
zAxios({ method:'post', url:'util/user-infos',
  headers:{'content-type':'multipart/form-data'}, data: fd });

// 삭제 (JSON body)
zAxios({ method:'post', url:'util/user-infos/delete',
  headers:{'content-type':'application/json'}, data: rows });
```
❌ `zAxios.get('ut/...')` (utility 도메인 잘못된 약어) · `'/api/common/sp/query'` (존재 안 함)

### 9.2 callService (BF/DP/MP/FP 계산 화면 수정 전용)

```jsx
callService('SRV_GET_SP_UI_BF_10_Q1', { planScope: 'PS01' }, 'bf');
```
❌ `callService({url, params})` (객체) · `callService('SP_UI_*', ...)` (SP 이름 첫 인자) · target='common'/'ut'/'cm' (미등록 — 4개 enum 만)

도메인-서버: BF/DP→`'dp'` · CM/MP/IM/RP/SO/UT→`'mp'` · FP→`'fp'`

### 9.3 showMessage

```jsx
// ✅
showMessage('확인', '저장하시겠습니까?', (ok) => { if (ok) doSave(); });

// ❌ 타입 토큰 (hook block)
showMessage('confirm', msg, cb);
```

## 10. 네이밍 규약

| 대상 | 규약 | 예 |
|---|---|---|
| 화면 폴더 | lowercase | `view/util/userinfomgmt/` |
| 화면 파일 | PascalCase | `UserInfoMgmt.jsx` |
| 공통 팝업 | `Pop<N>.jsx` | `PopSelectItem.jsx` |
| 그리드 id | `<camelCase>Grid` (string) | `userInfoGrid` |
| 그리드 state | `grid`, `masterGrid`, `detailGrid` 등 | (의미 있는 이름) |

## 11. Anti-patterns (요약)

| ❌ | ✅ | 검증 |
|---|---|---|
| `ContentInner` 누락 | 최상위 wrapper 필수 | hook block |
| `gridItems` 컴포넌트 안 선언 | 컴포넌트 밖 (매 렌더 재생성 방지) | hook block |
| `<BaseGrid columns={} afterCreate={} />` | `items={} afterGridCreate={}` | hook block |
| 컬럼 `dataType` 누락 | 모든 컬럼 `dataType` 명시 | hook block |
| Store swap (활성ViewId←useViewStore) | `useContentStore` | hook block |
| Grid 버튼 `grid={ref}` | `grid="<string-id>"` | hook block |
| `globalButtons` `{code,onClick}` | `{name,action}` | hook block |
| `showMessage('confirm',...)` | `showMessage('확인',...)` | hook block |
| `<InputField type="action" />` 자기닫힘 | children `<SearchIcon/>` | hook warn |
| datetime defaultValue `''` | `null` | LLM |
| 산출물에 `CommonCodeSelect` import | `InputField type="select"` | LLM |
| 신규 화면 `callService` | `zAxios` REST | hook warn |
| utility 도메인 `ut/` | `util/` (한 자리도 줄이지 않음) | hook block |

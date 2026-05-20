---
description: UI 화면(.jsx)에서 공용 컴포넌트·레이아웃·스토어·팝업·유틸을 선택할 때 참조. 임포트 규약과 컴포넌트 카탈로그.
globs:
  - "packages/wingui/src/view/**/*.jsx"
  - "packages/wingui/src/component/**/*.jsx"
alwaysApply: false
---

# 21. 공용 컴포넌트 인벤토리

> 화면 구성에 사용하는 공용 래퍼·그리드·차트·상태 스토어·팝업.
> 신규 화면 작성 시 이 인벤토리에서 고르되, **없으면 신규 추가 금지 — 먼저 기존 컴포넌트로 조합 가능한지 검토**.
>
> ★ 코드 표면 (BaseGrid prop · 그리드 API · zAxios · showMessage · globalButtons) 의 단일 진실 저장소는
> **`.claude/rules/41a-composer-jsx.md`** · **`.claude/rules/41c-composer-widgets.md`** 다.
> 본 문서의 코드 예시는 그것을 따른다.

## 1. 최상위 레이아웃 래퍼

패키지: **`@wingui/common/imports`** (단일 경로 import — 개별 store 경로 금지)

| 컴포넌트 | 역할 |
|---|---|
| `ContentInner` | 화면 최상위 컨테이너 (flex column, overflow 처리). **모든 화면 필수** |
| `SearchArea` | 조회 조건 영역. 접거나 좌측 고정 가능 |
| `SearchRow` | 조회 조건 한 행. `SearchArea` 자식 |
| `WorkArea` | 메인 작업 영역 (그리드/차트). `flex: 1` |
| `ResultArea` | 결과 전용 영역 (일부 화면) |
| `StatusArea` | 하단 상태 메시지 (선택) |
| `ButtonArea` | 버튼 묶음 컨테이너 |
| `LeftButtonArea` / `RightButtonArea` | 좌/우 정렬 버튼 |

## 2. 레이아웃 분할

| 컴포넌트 | 패키지 | 실제 prop |
|---|---|---|
| `SplitPanel` | `@zionex/wingui-core` | `direction='horizontal'\|'vertical'` · `sizes={[20,80]}` · `minSize={number}` · `sx` ★ `initialSizes`/`minSizes`/`defaultSizes`/`panelSize` 는 **허구 prop** (Hook block) |
| `VLayoutBox` / `HLayoutBox` | `@zionex/wingui-core` | `sx` · children — 수직/수평 flex 박스 |
| `TabContainer` | `@zionex/wingui-core/component/TabContainer` | `value` · `onChange` · `indicatorColor='primary'\|'secondary'` · **children `<Tab>`** ★ `tabs={[...]}` 는 허구 prop (Hook block) |
| `PopupDialog` | `@zionex/wingui-core` | `open` · `onClose` · `onSubmit` · `title` · `checks={[grid]}` · `resizeWidth` · `resizeHeight` · `type='CONFIRM'\|'NOBUTTONS'` ★ `sizeWidth`/`sizeHeight`/`fullWidth`/`maxWidth` 는 허구 prop |

## 3. 입력 필드

### 3.1 범용 — `InputField` (from `@wingui/common/imports`)
지원 타입: `text`, `number`, `select`, `multiSelect`, `autocomplete`, `dateRange`, `datetime`, `check`, `radio`, `popover`, `textarea`, `time`, **`action`**

`react-hook-form` 의 `control` prop 으로 연결. `useForm()` 에서 `control`, `getValues`, `setValue`, `watch`, `handleSubmit` 추출.

#### 3.1.0 ⛔ `useForm({ defaultValues })` — 타입별 초기값 (필수)

`react-hook-form` 의 `defaultValues` 객체에서 **각 필드 type 에 맞는 초기값** 을 줘야 함.
모든 필드를 `''` (빈 문자열) 로 두면 `datetime` / `dateRange` / `number` / `check` / `multiSelect`
입력에서 validator/coerce 가 깨져 콘솔 에러나 화면 깨짐 발생 (특히 datetime).

| InputField type | ✅ 올바른 초기값 | ❌ 금지 |
|---|---|---|
| `text` · `textarea` · `action` · `popover` | `''` | — |
| `select` · `radio` (단일) | `''` 또는 첫 옵션 value | — |
| `multiSelect` · `autocomplete`(multi) | `[]` | `''` (배열 메서드 호출 시 crash) |
| `number` | `null` 또는 숫자 | `''` (NaN 발생) |
| `check` (단일 boolean) | `false` | `''` · `'N'` (boolean 강제 안 됨) |
| **`datetime`** (단일 일자/일시) | **`null`** 또는 `new Date()` 또는 `''` 미사용 | **`''` 금지** — datetime picker 가 invalid Date 로 해석 |
| **`dateRange`** | **`[null, null]`** 또는 `{from:null, to:null}` (컴포넌트 spec) | `''` · `[]` |
| `time` | `null` 또는 `'HH:mm'` 문자열 | `''` |

```jsx
const { control, getValues, handleSubmit } = useForm({
  defaultValues: {
    userId: '', userNm: '',                  // text — '' OK
    useYn: '',                                // select — '' (전체)
    joinDt: null,                             // ★ datetime — null (또는 new Date())
    periodRange: [null, null],                // ★ dateRange — [null, null]
    minAmount: null,                          // number
    includeRetired: false,                    // check
    statusList: [],                           // multiSelect
  },
});
```

⛔ **자주 발생하는 사고**: `defaultValues: { regDt: '' }` → datetime InputField 가 `''` 을
`new Date('')` 로 변환 시도 → `Invalid Date` → 콘솔 RangeError + RHF validator 가 매 keystroke
마다 throw. 항상 `null` 로 시작하고 사용자가 입력 시 setValue 로 Date 객체 주입.

#### 3.1.1 검색조건 팝업 트리거 (`type="action"`) — children 필수
```jsx
import SearchIcon from '@mui/icons-material/Search';

<InputField
  control={control} type="action" name="deptNm" label="부서" title="부서 검색"
  readonly={true}                              // ★ readOnly(camel) 가 아닌 readonly(lowercase)
  onClick={() => setDeptPopupOpen(true)}
>
  <SearchIcon fontSize="small" />              // ★ children 필수 (없으면 빈 버튼)
</InputField>
```
- ❌ `<InputField type="action" .../>` 자기닫힘 = 빈 버튼 (Hook block)
- ❌ `InputProps.endAdornment` 로 IconButton 부착 = 미동작 (Hook warn)

### 3.2 SCM 도메인 특화

| 컴포넌트 | 용도 | 주 사용 모듈 |
|---|---|---|
| `PlanScope` | 플랜 스코프 선택 | MP/RP/FP/BF |
| `LocationMultiSearchBox` | 거점 복수 선택 | MP/RP/FP |
| `ItemMultiSearchBox` | 품목 복수 선택 | 전체 |
| `ItemSearchInput` | 품목 단건 검색 | DP/BF |
| `AccountSearchInput` | 거래처 단건 검색 | DP/BF |
| `ResourceMultiSearchBox` | 리소스 복수 선택 | MP/FP |
| `UserInputField` | 사용자 선택 | 공통 |

### 3.3 공통코드 Dropdown — 표준 `InputField type="select"` 사용

> ⛔ **`CommonCodeSelect` 컴포넌트 산출물 사용 금지** — wingui 본 환경에는 존재하지 않는
> 컴포넌트이고 t3-composer 의 [화면 실행] preview shim 에만 있는 도우미이다. 산출물 코드에
> import 하면 wingui sync 후 컴파일 깨짐.

`TB_AD_COMN_CODE` 기반 enum 코드 (`USE_YN`, `USER_TP`, `STATUS_CD` 등) 는 표준
`<InputField type="select" options={[...]}>` 또는 호출자가 직접 fetch 한 옵션으로 처리:

```jsx
const [useYnOptions, setUseYnOptions] = useState([
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
]);

<InputField control={control} type="select" name="useYn" label="사용여부" options={useYnOptions} />
```

옵션을 공통코드에서 동적으로 받으려면 화면 onMount 에 zAxios 로 조회:
```jsx
useEffect(() => {
  zAxios.get('/system/common/codes', { params: { 'group-cd': 'USE_YN' } })
    .then((res) => setUseYnOptions(res.data));
}, []);
```

## 4. 그리드 (RealGrid2)

| 컴포넌트 | 경로 | 역할 |
|---|---|---|
| `BaseGrid` | `@wingui/common/imports` | **표준 그리드** (RealGrid2 래퍼) |
| `TreeGrid` | `@zionex/wingui-core/component/grid/TreeGrid` | 계층형 트리 그리드 |
| `GridCnt` | `@wingui/common/imports` | 행 수 카운터 — `format` prop 필수 |
| `PivotTable` | `@zionex/wingui-core/component/dstable/PivotTable` | D/M/P/V 컬럼 타입 피벗 |

### 4.1 BaseGrid 실제 API (★ 가장 자주 틀리는 부분)

| 잘못된 이름 (Hook block) | 실제 API |
|---|---|
| `<BaseGrid columns={...}>` | **`<BaseGrid items={...}>`** |
| `<BaseGrid afterCreate={fn}>` | **`<BaseGrid afterGridCreate={fn}>`** (콜백 인자: `(grid, gridView, dataProvider)`) |
| `<BaseGrid>` (id 없음) | **`<BaseGrid id="<camelCase>Grid">`** (Grid 버튼이 string id 로 참조) |
| `grid.setData(rows)` | **`grid.dataProvider.fillJsonData(rows)`** |
| `grid.getChangedData()` / `grid.getChanges()` | **`grid.dataProvider.getAllStateRows()`** → `{created, updated, deleted, createAndDeleted}` |
| (단건 행) | `grid.dataProvider.getJsonRow(idx)` |

### 4.2 그리드 컬럼 정의 — 컴포넌트 밖 + 모든 컬럼에 `dataType` 필수

```jsx
// ✅ OK - 컴포넌트 밖 (리렌더 재생성 방지)
//   허용 dataType: 'text' | 'number' | 'datetime' | 'boolean' | 'group'
//   key 는 'name', 헤더 라벨은 'headerText', 정렬은 'textAlignment'
let gridItems = [
  { name: 'userId',     dataType: 'text',     headerText: '사용자 ID', width: 130, textAlignment: 'center', editable: true,
    validRules: [{ criteria: 'required' }] },
  { name: 'userNm',     dataType: 'text',     headerText: '사용자명',   width: 120, editable: true },
  { name: 'userTp',     dataType: 'text',     headerText: '사용자유형', width: 110, textAlignment: 'center', editable: true,
    useDropdown: true, lookupDisplay: true,
    values: ['ADMIN', 'NORMAL', 'GUEST'], labels: ['ADMIN', 'NORMAL', 'GUEST'] },
  { name: 'useYnBool',  dataType: 'boolean',  headerText: '사용여부',   width: 80,  textAlignment: 'center', editable: true },
  { name: 'joinDt',     dataType: 'datetime', headerText: '입사일',     width: 110, textAlignment: 'center', editable: true,
    displayType: 'date', datetimeFormat: 'yyyy-MM-dd',
    editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd' } },
  // 시간 버킷 동적 컬럼:
  {
    iteration: { prefix: 'date_', delimiter: '-' },
    name: 'date_{idx}', fieldName: 'date_{idx}',
    dataType: 'number', headerText: '{idx}', width: 100,
    textAlignment: 'far', editable: true, numberFormat: '#,##0.##',
  },
];
```

> **컬럼 정의 안티패턴 (Hook block)**
> - `field:` (실제 key 는 `name:`)
> - `header:` (실제 prop 은 `headerText:`)
> - `textAlign:` (실제 prop 은 `textAlignment:`)
> - `type:'combo', items:[...]` (실제: `useDropdown:true + lookupDisplay:true + values + labels`)
> - `dataType` 누락 → `BaseGrid.jsx:1016` 에서 TypeError, 화면 즉시 크래시
> - enum 컬럼에 `lookupDisplay:true` 만 있고 `useDropdown:true` 누락 → 셀 편집 시 자유 text (가장 흔한 실수)

### 4.3 정렬 규약
- **LEFT (기본)**: 이름·이메일·주소·자유 텍스트 (`textAlignment` 생략)
- **CENTER**: 코드·날짜·boolean·선택 enum·등록자·일시
- **`'far'` (RIGHT)**: 숫자

### 4.4 날짜 포맷 (전역)
- 단일 일자: `yyyy-MM-dd`
- 일시: `yyyy-MM-dd HH:mm:ss`
- 검색 form: `getDateInputProps()` 헬퍼
- 그리드 편집: `editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd' }`
- 기간 선택: `<InputField type="dateRange" displayType="date">`

### 4.5 공용 Grid 버튼 (`@wingui/common/imports`) — `grid` prop 은 **문자열 id**
```jsx
<GridCnt
  grid="userInfoGrid"
  format={"{0} " + transLangKey("CASES") + " " + transLangKey("MSG_0010")}
/>
<GridAddRowButton    grid="userInfoGrid" addInfo={{ userTp: 'NORMAL', useYnBool: true }} />
<GridDeleteRowButton grid="userInfoGrid" onDelete={onDelete} onAfterDelete={handleSearch} />
<GridSaveButton      grid="userInfoGrid" onSave={onSave}     onAfterSave={handleSearch} />
<GridExcelExportButton grid="userInfoGrid" fileName="사용자정보" />
<GridExcelImportButton grid="userInfoGrid" />
<LargeExcelDownload  grid="userInfoGrid" />
```
- ❌ `grid={gridStateRef}` (객체 ref) — Hook block

### 4.6 `GridCnt` — `format` prop 필수 (Hook block)
`format` 누락 시 라벨 없이 카운트 숫자(예: "2") 만 외로이 출력. 표준:
```jsx
import { transLangKey } from '@zionex/wingui-core';

<GridCnt
  grid="userInfoGrid"
  format={"{0} " + transLangKey("CASES") + " " + transLangKey("MSG_0010")}
/>
```
- ❌ `<GridCnt rowCount={...}>` — `rowCount` prop 은 컴포넌트 정의에 없음 (PropTypes: grid 만)

## 5. 차트

| 컴포넌트 | 경로 | 용도 |
|---|---|---|
| `ChartComponent` | `@zionex/wingui-core/component/chart/ChartComponent` | 공용 Chart.js 래퍼 |
| `Line`, `Bar`, `Chart`, `PolarArea` | `react-chartjs-2` | 직접 사용 시 |
| `EqualizerBarChart` | `src/component/chart/EqualizerBarChart.jsx` | 커스텀 이퀄라이저 바 |
| `GanttChart` | `@zionex/wingui-core/component/gantt/GanttChart` | 간트 차트 |

### 차트 업데이트 패턴
- 데이터 갱신: `chart.current.data.datasets` 갱신 후 `chart.current.update()`
- 강제 리마운트: `chartKey` state 증가 → `<Chart key={chartKey} ...>`

## 6. 다이어그램 · 특수 컴포넌트

| 컴포넌트 | 경로 | 역할 |
|---|---|---|
| `FLODiagram` | `@zionex/wingui-core/component/workflow/component/FLODiagram` | BOM/공급망 그래프 (ReactFlow) |
| `WidgetFlowDiagram` | `@zionex/wingui-core` | 편집 가능 워크플로 캔버스 |
| `DashboardPanel` | `@zionex/wingui-core/component/dashboard/DashboardPanel` | react-grid-layout 위젯 캔버스 |
| `ZEditor` | `@zionex/wingui-core` | TUI Editor WYSIWYG 래퍼 |
| `MyGoogleMap` | `@zionex/wingui-core` | Google Maps 래퍼 |

## 7. 상태 · 스토어 (Zustand)

> ★ **import 는 단일 경로 `@wingui/common/imports`** 에서 추출 (Hook warn).
> 개별 경로 (`@wingui/common/store/viewStore` 등) 는 shim 으로 동작은 하지만 비표준.

```jsx
// ✅ 표준
import { useViewStore, useContentStore /*, useUserStore, useMenuStore */ } from '@wingui/common/imports';
```

| 스토어 | 보유 키 (자주 쓰는 것) | 용도 |
|---|---|---|
| `useContentStore` | **`activeViewId`**, `viewList`, `addView`, `removeView` | 활성 뷰 ID 등 콘텐츠 전역 |
| `useViewStore` | **`setViewInfo`**, `getViewInfo`, `viewData` | 뷰별 상태: `globalButtons`, 그리드 ref |
| `useUserStore` | `userInfo`, `setUserInfo` | 로그인 사용자 정보 |
| `useMenuStore` | `menuList`, `currentMenu`, `AUTO_LOAD` 옵션 | 메뉴 경로 |
| `useDashboardStore` | (FP/SNop 전용) | 대시보드 공유 데이터 |
| `useInsightSystemStore` | `setProvider` | AI 분석 데이터 프로바이더 등록 |

> ⚠️ **Store 매핑 swap 절대 금지** (Hook block — `composer-jsx.sh CG-STORE`)
>
> ```jsx
> // ✅ 올바른 매핑
> const [activeViewId] = useContentStore((s) => [s.activeViewId]);
> const [setViewInfo]  = useViewStore((s) => [s.setViewInfo]);
>
> // ❌ swap — selector 가 undefined 반환 → setViewInfo is not a function
> const [activeViewId] = useViewStore((s) => [s.activeViewId]);     // useViewStore 에 없음
> const [setViewInfo]  = useContentStore((s) => [s.setViewInfo]);   // useContentStore 에 없음
> ```

## 8. 공통 팝업 (`src/view/common/`) — 실재 인벤토리

> ⛔ **사전 검증 (Hook 직접 차단 안 됨 — LLM 자기 검증 필수)**:
> `import X from '@wingui/view/common/Y'` 작성 전 반드시 해당 `Y.jsx` 파일이 실제로 존재하는지 확인.
> 부재 시 ① 일반 `<InputField>` 텍스트로 대체 ② Pop\* 파일을 산출물에 함께 포함 (`PopSelectItem.jsx` 양식 복제).
> 부재 컴포넌트를 import 하면 webpack "Module not found" 빌드 깨짐. (2026-04-29 사고)

### 8.1 ✅ 실재 — 자유롭게 import 가능
```
PopSelectItem · PopItemMulti · PopSelectAccount · PopAccountMulti
PopSelectLvlAndAcct · PopSelectLvlAndItem
PopLocatMst · PopLocatTp · PopLocatTpMulti
PopResourceMulti · PopRouteMulti
PopPersonalize · PopPersonalizeDp · PopKpiWeightConfig
LogPopup · LlmMarkdown · IconPicker · PopLogout · PopSimulationVersion
SimulationAiPanel
```

> ⚠️ **`CommonCodeSelect` 는 산출물에서 사용 금지** — preview shim 에만 있고 wingui 본 환경엔
> 없는 컴포넌트. §3.3 참조 (`InputField type="select"` + 옵션 fetch 패턴 사용).

### 8.2 ❌ 미실재 (rule 표·인벤토리에 적혀 있어도) — 사용 시 같이 생성하거나 일반 input 으로 대체
```
PopDepartment · PopPosition  (Master 필드 popup 양식 복제 필요)
```

### 8.3 분류 (참조용)
- **개인화·설정**: `PopPersonalize` · `PopPersonalizeDp` · `PopKpiWeightConfig` · `PopLogout`
- **단건 선택**: `PopSelectItem` · `PopSelectAccount` · `PopSelectLvlAndAcct` · `PopSelectLvlAndItem` · `PopLocatMst` · `PopLocatTp`
- **복수 선택**: `PopItemMulti` · `PopAccountMulti` · `PopResourceMulti` · `PopRouteMulti` · `PopLocatTpMulti`
- **시뮬레이션·버전**: `PopSimulationVersion` · `SimulationAiPanel`
- **기타**: `LogPopup` · `LlmMarkdown` · `IconPicker`

### 8.4 표준 양식 (PopSelectItem 기준 — `confirm` 콜백은 항상 배열 반환)
상세는 **`.claude/rules/41c-composer-widgets.md §8`** 참조.

## 9. 공통 유틸 · 서비스 (`@wingui/common/imports`)

| 유틸 | 시그니처 / 용도 |
|---|---|
| `zAxios` | wingui 표준 HTTP 클라이언트 — REST 호출 (axios 래퍼) |
| `zAxios.get(url, { params })` | GET 호출 |
| `zAxios({ method, url, headers, data })` | 객체 인자 — POST/multipart 등 |
| `callService(serviceId, paramMap, target)` | 엔진 API 호출 — **target ∈ `'mp'\|'dp'\|'bf'\|'fp'`** (4개 enum). ★ 신규 화면에서 사용 금지 (BF/DP/MP/FP 계산 화면 수정 전용) |
| `showMessage(title, message, callback?)` | **첫 인자는 제목 문자열** (★ `'confirm'`/`'error'` 토큰 아님). callback 시그니처: `(answer: boolean) => void` |
| `useFieldCascade({ control, setValue, getValues })` | 검색 form cascade hook (한 줄) |
| `applyGridCascade(gridObj, gridItems, { onCellPopupRequest })` | 그리드 cascade 자동 wiring (afterGridCreate 안에서 호출) |
| `buildPopupFilterProps('<child>', getValues)` | Pop\* 컴포넌트에 cascade 부모 값 자동 주입 |
| `useMessage()` | 메시지 출력 훅 (alternative) |
| `loadRecentSimulationVersion()` | 최근 시뮬레이션 버전 로딩 |
| `setHeaderColor(gridObj, colorMap)` | 그리드 헤더 색상 설정 |

### 9.1 zAxios 호출 표준 (신규 화면 = REST 가 기본)
```jsx
// 조회
zAxios.get('util/user-infos', { params: getValues() })
  .then((res) => grid?.dataProvider.fillJsonData(res.data));

// 저장 — multipart/form-data 'changes' 파라미터 (GridSaveButton 표준)
const formData = new FormData();
formData.append('changes', JSON.stringify(payload));
zAxios({
  method: 'post', url: 'util/user-infos',
  headers: { 'content-type': 'multipart/form-data' },
  data: formData,
});

// 삭제 — JSON body
zAxios({
  method: 'post', url: 'util/user-infos/delete',
  headers: { 'content-type': 'application/json' },
  data: rows,
});
```
- ❌ `zAxios.get('ut/...')` (utility 도메인 잘못된 약어 — Hook block)
- ❌ `'/api/common/sp/query'` / `'/api/common/sp/execute'` 엔드포인트 사용 (존재 안 함)

### 9.2 callService 호출 (BF/DP/MP/FP 계산 화면 수정 전용)
```jsx
// 시그니처: callService(serviceId, paramMap, target)
//   serviceId = XML 의 <service id> (★ SP_UI_* 같은 SP 이름이 아님)
//   target ∈ 'mp' | 'dp' | 'bf' | 'fp'  (PlatformService.Module enum 4개)
callService('SRV_GET_SP_UI_BF_10_Q1', { planScope: 'PS01' }, 'bf');
```
- ❌ `callService({ url, params })` (객체 인자 — 존재 안 함)
- ❌ `callService('SP_UI_*', ...)` (SP 이름 첫 인자 — 서비스 ID 가 아님)
- ❌ `target='common'/'ut'/'cm'/'ad'` 등 미등록 (4개 enum 외 cannot find destination)
- 도메인-서버 매핑: BF/DP→`'dp'` · CM/MP/IM/RP/SO/UT→`'mp'` · FP→`'fp'`

### 9.3 showMessage 시그니처
```jsx
// ✅ 표준
showMessage('확인', '저장하시겠습니까?', (ok) => { if (ok) doSave(); });

// ❌ 첫 인자에 type 토큰 (Hook block)
showMessage('confirm', msg, cb);
showMessage('error', msg);

// ❌ 옛 옵션 객체 콜백 (현 시그니처 아님)
showMessage('알림', msg, { onOk, onCancel });
```

## 10. 모듈별 자주 쓰는 컴포넌트

| 모듈 | 주 컴포넌트 |
|---|---|
| BF | `ItemSearchInput`, `AccountSearchInput`, `ChartComponent` (정확도·트렌드) |
| DP | `PlanScope`, `PopPersonalizeDp`, 크로스탭 그리드 |
| MP | `PlanScope`, `LocationMultiSearchBox`, `GanttChart` |
| FP | `ActivitySearch`, `GanttChart`, `FLODiagram`, `ChartComponent` |
| IM | `LocationMap` (Leaflet), `ChartComponent` (ABC/XYZ) |
| RP | `PlanScope`, 크로스탭 그리드, 재고 차트 |
| SA | `PivotTable`, 유연 리포트, 대시보드 |
| SNop | `DashboardPanel`, `MyGoogleMap`, 회의 문서 |
| System | `BaseGrid` + `TreeGrid` (메뉴/권한 트리) |
| Util  | `BaseGrid` + 마스터 CRUD (참조 원본: `Users.jsx`, `IssueMgmt.jsx`, `UserInfoMgmt.jsx`) |

## 11. 네이밍 규약

| 대상 | 규약 | 예 |
|---|---|---|
| 화면 폴더 | lowercase | `view/util/userinfomgmt/` |
| 화면 파일 | PascalCase | `UserInfoMgmt.jsx` |
| Base 래핑 | `Base<N>.jsx` + `<N>.jsx` | `BaseEntry.jsx` + `Entry.jsx` |
| 위젯 파일 | `view/<module>/widgets/<widget>/` | `view/baselineforecast/widgets/forecastaccuracy/` |
| 공통 팝업 | `Pop<N>.jsx` | `PopSelectItem.jsx` |
| 그리드 id | `<camelCase>Grid` (string) | `userInfoGrid`, `masterGrid`, `detailGrid` |
| 그리드 state 변수 | `grid`, `masterGrid`, `detailGrid` 등 | (의미 있는 이름) |

## 12. Anti-patterns (금지)

- ❌ `ContentInner` 없이 화면 작성 — 레이아웃 깨짐 (Hook block)
- ❌ 글로벌 버튼을 로컬 JSX 에 직접 렌더 — `setViewInfo` 로 위임
- ❌ `gridItems` 를 컴포넌트 내부에 선언 — 매 렌더마다 재생성 (Hook block)
- ❌ `BaseGrid.afterGridCreate` 전 그리드 객체 접근 — undefined
- ❌ `<BaseGrid columns={...} afterCreate={...}>` — 옛 prop (Hook block)
- ❌ `grid.setData/getChanges/getChangedData` — 존재 안 하는 메서드 (Hook block)
- ❌ Grid 버튼에 `grid={ref객체}` — 문자열 id 만 (Hook block)
- ❌ `globalButtons` 키 `code` + `onClick` 동시 사용 — `name` + `action` (Hook block)
- ❌ Zustand store swap (`activeViewId` ← `useViewStore`) — `useContentStore` 가 정확 (Hook block)
- ❌ `import { useViewStore } from '@wingui/common/store/viewStore'` 개별 경로 — `@wingui/common/imports` 통일 (Hook warn)
- ❌ `<TabContainer tabs={[...]}>` — children `<Tab>` (Hook block)
- ❌ `<SplitPanel initialSizes={...}>` — `sizes={[...]} minSize={n}` (Hook block)
- ❌ `<InputField type="action" .../>` 자기닫힘 — children `<SearchIcon/>` 필수 (Hook block)
- ❌ `<span className="material-icons">search</span>` — `import SearchIcon from '@mui/icons-material/Search'` (Hook block)
- ❌ `<GridCnt grid="...">` 만 (`format` 누락) — `format={"{0} " + transLangKey("CASES") + ...}` (Hook block)
- ❌ `useFieldCascade` 가 다루는 컬럼 (itemCd/accountCd/simulVerCd 등) 사용하면서 `useFieldCascade`/`applyGridCascade` 미호출 — Hook warn
- ❌ Master 필드 (품목/거래처/거점/부서/직위) 자유 text 입력 — Pop\* 사용
- ❌ 산출물에 `import CommonCodeSelect from '@wingui/view/common/CommonCodeSelect'` — wingui 본 환경에 없는 컴포넌트 (preview shim 전용). `InputField type="select"` + 직접 옵션 fetch 사용 (§3.3)
- ❌ `use_yn`/status 무시하고 온톨로지 사용 — `.claude/rules/10-ontology-first.md`
- ❌ CRUD 가 아닌 분석 화면에 `GridAddRowButton` 노출 — UX 혼란
- ❌ `sample` 폴더 코드 그대로 프로덕션 복사 — `setViewInfo`, AI 프로바이더 누락됨
- ❌ 신규 화면에서 `callService(...)` 사용 — `zAxios` REST + RestController + JdbcTemplate + SP_UI_\* 사용
- ❌ utility 도메인에 `ut/` 사용 — `util/` 단 하나뿐 (Hook block, 한 자리도 줄이지 않음)

# 41a. Composer — JSX 표준 (wingui 네이티브)

> **상위 규칙**: `41-composer-generation.md` 의 §4 (JSX 표준) + §0.6 (레이아웃 변경 시 허용 prop 명세) 분리.
> Composer 모든 모드에서 생성/수정되는 JSX 의 단일 진실 저장소.

---

## §4. JSX 표준

### §4.1 Imports — `@wingui/common/imports` 단일 경로
```jsx
import {
  ContentInner, SearchArea, SearchRow, WorkArea,
  ButtonArea, LeftButtonArea, RightButtonArea,
  InputField, BaseGrid, GridCnt,
  GridAddRowButton, GridDeleteRowButton,
  GridSaveButton, GridExcelExportButton,
  zAxios, showMessage,
  useViewStore, useContentStore,
  useFieldCascade, applyGridCascade, buildPopupFilterProps,
} from '@wingui/common/imports';
```
❌ `@wingui/common/store/*` · `@zionex/wingui-core/*` 직접 import 금지.

### §4.2 BaseGrid 실제 API
| 잘못된 이름 | 실제 API |
|---|---|
| `columns={...}` | **`items={...}`** |
| `afterCreate={fn}` | **`afterGridCreate={fn}`** (콜백 인자: `(grid, gridView, dataProvider)`) |
| `grid.setData(data)` | `grid.dataProvider.fillJsonData(data)` |
| `grid.getChangedData()` | `grid.dataProvider.getAllStateRows()` → `{created,updated,deleted,createAndDeleted}` |

### §4.2.0 ⛔ Layout 단계의 RGL position → SplitPanel direction 강제 매핑

사용자가 Composer Wizard 의 ① Layout 단계에서 layer 의 RGL position (x/y/w/h) 을 직접 결정한다. 그 배치는 **사용자 의도 의 단일 진실 저장소** — Claude 는 임의로 좌우↔상하 변경 금지.

**매핑 규칙** (specToInitialPrompt 가 자동 계산해 prompt 의 `[★ 사용자 의도 레이아웃]` 블록으로 전달):

| layer 배치 (top-level 2개+) | SplitPanel direction | sizes |
|---|---|---|
| 모두 `y` 동일, `x` 다름 | `horizontal` (좌우) | 각 layer 의 `w` 합비율 (12 cols 기준) |
| 모두 `x` 동일, `y` 다름 | `vertical` (상하) | 각 layer 의 `h` 합비율 |
| 격자 / 혼합 (양축 분할) | 외곽 vertical + 내부 horizontal 중첩 또는 격자 grid 직접 구성 | — |
| 1개 | `<SplitPanel>` 미사용 — 단일 layer 그대로 mount | — |

**예**:
- layers = [`mainGrid (x=0,y=0,w=6,h=8)`, `chartLayer (x=6,y=0,w=6,h=8)`]
  → 모두 y=0 (좌우 배치) → `<SplitPanel direction="horizontal" sizes={[50,50]} minSize={290}>`
- layers = [`masterGrid (x=0,y=0,w=12,h=4)`, `detailGrid (x=0,y=4,w=12,h=4)`]
  → 모두 x=0 (상하 배치) → `<SplitPanel direction="vertical" sizes={[50,50]} minSize={200}>`

❌ 금지: 사용자가 상하 배치 (y 다름) 인데 Claude 가 멋대로 `direction="horizontal"` 로 생성. 이러면 시각적 의도와 산출물이 어긋남 (사용자가 ↕ 라인 그렸는데 ↔ 가 나옴).

### §4.2.1 ⛔ BaseGrid 컨테이너 — flex chain 끊김 방지 (필수)

BaseGrid 는 RealGrid2 GridView 로 부모 컨테이너 100% 를 채우는 구조다. 부모 chain 어느 한 칸이라도 height 계산이 깨지면 그리드 body 가 0px 로 collapse 되어 **버튼과 컬럼 헤더는 보이는데 데이터 영역은 빈 흰 화면** 으로 렌더된다.

**필수 규칙**:

1. `BaseGrid` 바로 위 wrapper div 는 **반드시 `flex: 1, minHeight: 0`** 둘 다 명시:
   ```jsx
   <div style={{ flex: 1, minHeight: 0 }}>          // ← 둘 다 필수
     <BaseGrid id="..." items={...} afterGridCreate={...} />
   </div>
   ```
   `minHeight: 0` 없으면 flex 자식의 자연 높이 = 컨텐츠 (BaseGrid 는 자연 높이 0) → wrapper 도 0 → 그리드 보이지 않음.

2. SplitPanel 안에서 ButtonArea + BaseGrid 를 세로 배치할 때 **두 컨테이너 모두 flex column + 마지막 wrapper 에 `minHeight: 0`**:
   ```jsx
   <SplitPanel direction="horizontal" sizes={[50,50]} minSize={290}>
     {/* 좌측 — flex column 으로 ButtonArea(자연) + Grid wrapper(flex:1+minHeight:0) */}
     <div style={{ display: 'flex', flexDirection: 'column',
                    height: '100%', minHeight: 0 }}>     // ★ parent 도 minHeight:0
       <ButtonArea title="...">{/* ... */}</ButtonArea>
       <div style={{ flex: 1, minHeight: 0 }}>          // ★ grid wrapper minHeight:0
         <BaseGrid id="masterGrid" items={...} afterGridCreate={...} />
       </div>
     </div>
     <div style={{ display: 'flex', flexDirection: 'column',
                    height: '100%', minHeight: 0 }}>
       {/* detail 도 동일 */}
     </div>
   </SplitPanel>
   ```

3. **부모 ContentInner / WorkArea** 는 이미 flex column · flex:1 · minHeight:0 가 기본 제공 — 그쪽은 손대지 않음. 깨지는 지점은 항상 **사용자 작성 wrapper div**.

**검증**: 화면 렌더 시 버튼 영역은 보이는데 그리드 body 가 빈 흰 화면이면 100% 본 규칙 위반. 모든 flex 부모 chain 에서 `minHeight: 0` 확인.

❌ **금지 패턴**:
```jsx
<div style={{ flex: 1 }}>                            // minHeight:0 누락 — 그리드 0px collapse
  <BaseGrid ... />
</div>
```
```jsx
<div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                                      // parent minHeight:0 누락
  <ButtonArea>...</ButtonArea>
  <div style={{ flex: 1 }}><BaseGrid/></div>          // wrapper minHeight:0 도 누락
</div>
```

### §4.3 그리드 컬럼 정의 (RealGrid2)

> ⚠️ **`dataType` 는 모든 컬럼 필수**. BaseGrid 가 내부적으로 `item.dataType.toLowerCase() === 'group'` 호출(컬럼 그룹 판별) 하므로 누락 시 화면 진입 즉시 `Cannot read properties of undefined (reading 'toLowerCase')` TypeError. 텍스트 컬럼은 `dataType: 'text'` 명시 (생략 ❌). Hook (`composer-jsx.sh CG-FAB3-DT`) 가 자동 차단.

허용값: `'text'` · `'number'` · `'datetime'` · `'boolean'` · `'group'` (컬럼 그룹 헤더)

> **컬럼 너비(`width`)** — 헤더 명칭이 잘리지 않도록 여유있게 확보한다. `width` 는 (헤더 명칭 폭)과 (셀 내용 폭) 중 넓은 쪽 이상으로 잡는다. 한글 헤더 기준 `width ≥ 헤더글자수 × 16 + 48` (예: 5자 헤더 → 128 이상). 역할별 권장 최소: 코드/번호/짧은날짜 **110** · 일반 명칭 **140** · 일시(`yyyy-MM-dd HH:mm:ss`) **170** · 설명/비고 **220+**. 헤더가 6자 이상이거나 단위·괄호를 포함하면 더 넓게. `width:50~90` 같은 과소 지정은 헤더가 잘려 금지. Hook (`composer-jsx.sh CG-WIDTH`) 가 width 미지정·과소(<100) 컬럼을 warn 한다. shim/wingui BaseGrid 는 컬럼별 `width` 를 그대로 존중하므로(`fitStyle:'none'` — `rules/50 §13.12`) 여기서 지정한 값이 곧 렌더 너비다.

```jsx
let gridItems = [
  { name: 'userId',     dataType: 'text',     headerText: '사용자 ID', width: 140, textAlignment: 'center', editable: true,
    validRules: [{ criteria: 'required' }] },
  { name: 'userNm',     dataType: 'text',     headerText: '사용자명',   width: 140, editable: true },
  { name: 'userTp',     dataType: 'text',     headerText: '사용자유형', width: 130, textAlignment: 'center', editable: true,
    useDropdown: true, lookupDisplay: true, values: ['ADMIN','NORMAL','GUEST'], labels: ['ADMIN','NORMAL','GUEST'] },
  { name: 'useYnBool',  dataType: 'boolean',  headerText: '사용여부',   width: 110, textAlignment: 'center', editable: true },
  { name: 'joinDt',     dataType: 'datetime', headerText: '입사일',     width: 120, textAlignment: 'center', editable: true,
    displayType: 'date', datetimeFormat: 'yyyy-MM-dd', editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd' } },
  { name: 'createDttm', dataType: 'datetime', headerText: '등록일시',   width: 170, textAlignment: 'center', editable: false,
    datetimeFormat: 'yyyy-MM-dd HH:mm:ss' },
];

// ❌ 금지 — dataType 누락 시 BaseGrid.jsx:1016 에서 TypeError, 화면 즉시 크래시
let gridItems = [
  { name: 'userId',     headerText: '사용자 ID', width: 130 },   // dataType 없음!
  { name: 'createDttm', headerText: '등록일시',   width: 150, dataType: 'datetime' },
];
```

### §4.4 Grid 버튼 — `grid=` prop 은 **문자열 id**
```jsx
<GridAddRowButton    grid="userInfoGrid" />
<GridDeleteRowButton grid="userInfoGrid" onDelete={onDelete} onAfterDelete={handleSearch} />
<GridSaveButton      grid="userInfoGrid" onSave={onSave} onAfterSave={handleSearch} />
<GridExcelExportButton grid="userInfoGrid" fileName="사용자정보" />
```

#### §4.4.1 ⛔ Grid 버튼 + 라이프사이클 — 무반응 사고 방지 (2026-04-30 부서관리 사고 후 추가)

| ❌ 사고 패턴 | ✅ 표준 | 결과 |
|---|---|---|
| `<GridAddRowButton grid="..." initRow={{...}} />` | prop 없이 `<GridAddRowButton grid="..." />` (빈 행) 또는 함수형 `onGetData={() => ({field:'A'})}` | `initRow` · `addInfo` 는 **GridButton.jsx 가 인식하지 않는 무효 prop** — 무시되긴 하나 표준 위반 (Hook block) |
| `<GridSaveButton grid="..." url="util/x" />` (onSave 누락) | `const onSave = useCallback((_g, rows) => zAxios({...}, []); <GridSaveButton grid="..." onSave={onSave} onAfterSave={onSearch} />` | url 단독 prop 으로는 컴포넌트가 자동 zAxios 호출 안 함 → 저장 버튼 무반응 (Hook block) |
| `const gridRef = useRef(null);` + `useEffect(() => { if(gridRef.current) onSearch(); }, []);` | `const [grid, setGrid] = useState(null);` + `afterGridCreate=(g)=>setGrid(g);` + `useEffect(()=>{ if(grid) onSearch(); }, [grid])` | mount 시 `ref.current === null` → 자동조회 한 번도 안 불려 그리드 영구히 빈 상태. useState 패턴은 setGrid 가 re-render 트리거 → grid deps 가 발화 (Hook warn) |

GridButton.jsx 의 실제 props (절대 다른 이름 사용 금지):
- `GridAddRowButton`: `grid` (string), `onBeforeAdd`, `onAfterAdd`, **`onGetData`** (함수 — 새 행 데이터 반환)
- `GridDeleteRowButton`: `grid`, `onBeforeDelete`, `onDelete(grid, rows)`, `onAfterDelete`
- `GridSaveButton`: `grid`, `onBeforeSave`, **`onSave(grid, changeRowData)`**, `onAfterSave`
- `GridExcelExportButton`: `grid`, `fileName`, `sheetName`

#### §4.4.2 RealGrid2 — `getAllStateRows()` 전 `commit()` 호출 (2026-05-11 단독 환경)

shim `GridSaveButton` / `GridDeleteRowButton` 이 `g.dataProvider.getAllStateRows()` 호출 직전에 자동으로 `g.commit(true)` 호출. 셀 편집 중 상태에서 RealGrid 가 `Client is editing (call grid.commit() or grid.cancel() first)` 오류 throw 하는 케이스 회피.

산출물 JSX 는 추가 코드 불필요 — shim 이 자동 처리. wingui 본 환경의 GridSaveButton 도 동일 거동.

### §4.5 서버 통신 = wingui REST (zAxios) 기본
```jsx
// 조회
zAxios.get('util/user-infos', { params: getValues() })
  .then((res) => grid.dataProvider.fillJsonData(res.data));

// 저장 — payload 에 백엔드 Entity 필드만 명시 추출 (RealGrid 메타·화면용 가공 필드 제외)
const onSave = (gridObj, changeRowData) => {
  const payload = changeRowData.map((row) => ({
    userId: row.userId ?? '', userNm: row.userNm ?? '', /* ... 명시 필드만 ... */
    useYn: toYN(row.useYnBool ?? row.useYn),
  }));
  const formData = new FormData();
  formData.append('changes', JSON.stringify(payload));
  return zAxios({ method:'post', url:'util/user-infos',
    headers:{'content-type':'multipart/form-data'}, data: formData });
};

// 삭제 — JSON body
const onDelete = (_g, rows) => zAxios({
  method: 'post', url: 'util/user-infos/delete',
  headers: { 'content-type': 'application/json' }, data: rows,
});
```

❌ 신규 화면에서 `callService(...)` / `engine/...` URL 사용 금지 (BF/DP/MP/FP 계산 화면 전용 — 메인 §13).

#### §4.5.1 ⛔ zAxios URL 은 백엔드 Controller 매핑과 1:1 일치 — MENU_CD 의 V-접미어 환각 금지 (2026-04-30 추가)

> **2026-04-30 DeptMgmt V2 사고**: 사용자가 기존 메뉴 `UI_UT_DEPT_MGMT` 와 코드만 다른 신규 `UI_UT_DEPT_MGMT_V2` 를 추가. V2 는 **메뉴 코드 distinction 한정** 이고 백엔드(Controller URL · Service · Entity · Table · SP) 는 단일 자원 공유. 그러나 LLM 이 JSX zAxios URL 3곳에 `-v2` 환각 추가 → `@RequestMapping("/util/dept-mgmt")` 와 불일치 → 모든 호출 404. Hook (`composer-jsx.sh CG-URL-VSFX`) 자동 차단.

**핵심 원칙**: zAxios URL 은 **MENU_CD 가 아니라 백엔드 Controller 매핑** 을 따른다.

| 표면 | V-접미어 적용 가능? |
|---|---|
| `MENU_CD` (`UI_<DOMAIN>_<NAME>_V2`) | ✅ |
| `MENU_FILE_PATH` (`/util/DeptMgmtV2`) | 별도 화면일 때만 |
| JSX 파일명 (`DeptMgmtV2.jsx`) | 별도 화면일 때만 |
| **`zAxios.get('<url>')` 의 url** | ❌ **항상 Controller `@RequestMapping` 과 일치** |
| `@RequestMapping("/util/dept-mgmt")` | 일반적으로 v 없음 (별도 자원이면 명시) |
| `Service` · `Entity` · `Table` · `SP` | 일반적으로 v 없음 (단일 자원 공유) |

```jsx
// ✅ 올바름 — V2 메뉴라도 동일 백엔드 자원 공유
zAxios.get('util/dept-mgmt', { params: getValues() });   // Controller 와 일치

// ❌ 환각 — MENU_CD 의 _V2 가 URL 까지 전파
zAxios.get('util/dept-mgmt-v2', { params: getValues() });  // 404 (Controller 는 /util/dept-mgmt)
```

**자기 검증** (JSX 출력 직전):
1. 모든 `zAxios.{get,post,...}` 의 URL · `url: '...'` · `url="..."` 값 추출
2. 대응 Java Controller 의 `@RequestMapping("...")` 와 prefix 비교
3. JSX 폴더/파일명에 v2 가 없는데 zAxios URL 에 `-v2` 가 있으면 100% 환각

### §4.6 showMessage / 글로벌 버튼 / Store 매핑

> ⚠️ **Zustand store 분리 — swap 금지**:
> - **`activeViewId`** 는 `useContentStore` 소속 (`wingui-core/store/contentStore.js:93`)
> - **`setViewInfo`** 는 `useViewStore` 소속 (`wingui-core/store/viewStore.js:25`)
>
> 두 store 를 바꿔서 selector 에 넣으면 selector 가 `undefined` 를 돌려주어 `setViewInfo(...)` 호출 시 `is not a function` TypeError, `globalButtons` 미등록 → 상단 바 빈 채로 렌더. Hook (`composer-jsx.sh CG-STORE`) 이 자동 차단.

> 🔴 **2026-05-11 t3-composer 단독 환경 추가 사례**: 산출물 jsx 가 `const activeViewId = useViewStore(s => s.activeViewId)` 사용 → t3composer shim 에서 `useViewStore.activeViewId` 가 undefined → `useEffect(() => { if (!activeViewId) return; setViewInfo(...) }, [activeViewId])` 에서 early return → globalButtons 미등록 → SearchArea 의 [조회] 버튼 click 시 `[shim] SearchArea: globalButtons.search 가 등록되지 않았습니다` 무반응. 단독 환경 보완으로 useViewStore 에도 activeViewId 노출했지만, **wingui 본 환경에서는 여전히 정확한 store 사용 필수**. (TROUBLESHOOTING.md §14)

```jsx
// ✅ 올바른 store 매핑
const [activeViewId] = useContentStore((s) => [s.activeViewId]);
const [setViewInfo]  = useViewStore((s) => [s.setViewInfo]);

showMessage('확인', '저장하시겠습니까?', (ok) => { if (ok) doSave(); });

useEffect(() => {
  if (!grid) return;
  setViewInfo(activeViewId, 'globalButtons', [
    { name: 'search', action: handleSearch, visible: true, disable: false },
  ]);
}, [activeViewId, grid, setViewInfo, handleSearch]);

// ❌ 금지 — store swap (selector 가 undefined 반환 → 런타임 TypeError)
const [activeViewId] = useViewStore((s) => [s.activeViewId]);     // useViewStore 에 activeViewId 없음
const [setViewInfo]  = useContentStore((s) => [s.setViewInfo]);   // useContentStore 에 setViewInfo 없음
```

대안 (구조 분해 형태): 표준 원본 `Users.jsx` 는 `props.viewId` 를 활용:
```jsx
const activeViewId = props.viewId;
const [viewData, getViewInfo, setViewInfo] = useViewStore((state) => [state.viewData, state.getViewInfo, state.setViewInfo]);
```

### §4.7 Y/N ↔ Boolean 변환 헬퍼
DB 컬럼이 `'Y'/'N'` (NCHAR(1)) 일 때 그리드는 boolean CheckBox 권장:
```js
const toBool = (v) => v === true || v === 'Y' || v === 'y' || v === 1 || v === '1';
const toYN   = (v) => (toBool(v) ? 'Y' : 'N');

// 조회 응답 → 그리드
const rows = res.data.map((r) => ({ ...r, useYnBool: toBool(r.useYn) }));

// 저장 직전
const payload = changeRowData.map((r) => ({ ...r, useYn: toYN(r.useYnBool) }));
```

---

## §0.6 레이아웃 변경 서브플로우 (NEW_FROM_COPY + 사용자 명시 요구 시)

사용자가 요구사항에 **명시적으로** 레이아웃 변경을 적은 경우에만 (예: "좌우 2분할로", "탭으로 나눠서", "팝업 형태로") 이 절차 적용. 요구사항에 없으면 원본 그대로 복제.

### §0.6.1 허용 공용 컴포넌트 · 실제 prop 명세

| 컴포넌트 | 실제 prop | 금지 prop (허구) | 샘플 |
|---|---|---|---|
| `<SplitPanel>` | `direction='horizontal'\|'vertical'` · `sizes={[20,80]}` · `minSize={290}` · `sx` | ~~initialSizes~~ · ~~minSizes~~ · ~~defaultSizes~~ · ~~panelSize~~ | `<SplitPanel direction="horizontal" sizes={[20,80]} minSize={290}>` |
| `<TabContainer>` | `value` · `onChange` · `indicatorColor='primary'\|'secondary'` · children `<Tab>` | ~~tabs={[...]}~~ 객체 배열 | `<TabContainer value={v} onChange={fn}><Tab ... /></TabContainer>` |
| `<PopupDialog>` | `open` · `onClose` · `onSubmit` · `title` (i18n key) · `checks={[grid]}` · `resizeWidth` · `resizeHeight` · `type='CONFIRM'\|'NOBUTTONS'` | ~~sizeWidth~~ · ~~sizeHeight~~ · ~~fullWidth~~ · ~~maxWidth~~ | `<PopupDialog open onClose onSubmit={handleSubmit(save)} title='X' resizeWidth={500} resizeHeight={500} checks={[grid]} />` |
| `<VLayoutBox>` / `<HLayoutBox>` | `sx` · children | — | 수직/수평 flex 컨테이너 |

### §0.6.2 절차

1. 사용자 요구사항의 레이아웃 변경 문장을 그대로 인용
2. 위 표에서 해당 컴포넌트 선택
3. prop 을 표에서 **그대로 복사** (추측 · 축약 · 추가 모두 금지)
4. STEP 1 계획 선언에 3줄 추가:
   ```
   레이아웃 변경 요구: <사용자 요구 문장 인용>
   채택 컴포넌트: <SplitPanel | TabContainer | PopupDialog | VLayoutBox | HLayoutBox>
   사용할 prop: <표에서 복사한 prop 이름 목록>
   ```
5. STEP 6 자기 대조에 추가 체크: "채택 컴포넌트의 prop 이 §0.6.1 표와 완전 일치?"
6. **백엔드는 NEW_FROM_COPY 기본 원칙 유지** — 테이블·Entity 재사용 · DDL·Java 4종 세트 생성 금지

### §0.6.3 Hook 방어

- `<SplitPanel initialSizes/minSizes/defaultSizes/panelSize=` → **block**
- `<TabContainer tabs={` → **block**
- `<PopupDialog sizeWidth/sizeHeight/fullWidth/maxWidth=` → **block**
- `BaseGrid` 컬럼에 `textAlign:` → **block** · `fieldName` 전무 → **warn**

---

## 관련 파일

- `41-composer-generation.md` — 메인 (§0 참조 원본 / §10 MENU_SQL / §14 Anti-patterns)
- `41b-composer-java.md` — Java 백엔드 표준
- `41c-composer-widgets.md` — 위젯 카탈로그 + Cascade + POPUP + 공통코드 Dropdown 정책
- `41d-composer-wizard.md` — 4-Step Wizard
- `21-components.md` — 공용 컴포넌트 인벤토리 전반

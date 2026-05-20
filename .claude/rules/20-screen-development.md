---
description: React 화면(.jsx)을 신규로 만들거나 수정할 때 참조. 파일 경로·래퍼·그리드·글로벌버튼 등록·SP/REST 연결 규약을 강제한다.
globs:
  - "packages/wingui/src/view/**/*.jsx"
  - "packages/wingui/src/view/**/*.tsx"
  - "packages/wingui/src/component/**/*.jsx"
alwaysApply: false
---

# 20. 화면 개발 규칙 (New Screen Development)

> **이 문서는 "화면 골격(레이아웃·파일배치·메뉴등록)" 만 다룬다.**
> JSX/Java 산출물의 모든 코드 표면 — BaseGrid prop·그리드 API·zAxios·showMessage·globalButtons·Pop\*·useFieldCascade —
> 의 단일 진실 저장소는 다음 4개 파일이며 본 문서의 예시는 그것을 따른다.
>
> | 주제 | 정답지 |
> |---|---|
> | JSX 표준 (BaseGrid · grid id · zAxios · store 매핑) | **`.claude/rules/41a-composer-jsx.md`** |
> | Java 백엔드 (jakarta.* · BaseEntity · JdbcTemplate SP 호출) | **`.claude/rules/41b-composer-java.md`** |
> | 위젯 매트릭스 / Cascade / POPUP / 공통코드 Dropdown 정책 | **`.claude/rules/41c-composer-widgets.md`** |
> | 9-Step Wizard (Composer 신규 화면 3종) | **`.claude/rules/41d-composer-wizard.md`** |

---

## 1. 결정 플로우 (반드시 이 순서)

```
요구사항 확정
  ↓
Step 1. 업무 유형 식별  (마스터 CRUD · 리포트 · 입력 · 버전/워크플로 · 대시보드)
  ↓
Step 2. 패턴 선정  (P01 위젯대시보드 · P02 검색+단일그리드 · P03 검색+탭 ·
                   P04 수평스플릿 M-D · P06 크로스탭 피벗 등)
  ↓
Step 3. 대표 파일 복사 (sample 폴더 코드는 부분적이므로 프로덕션 화면 템플릿 사용)
   - 마스터 CRUD: view/system/usermgmt/users/Users.jsx
                 view/util/issuemgmt/IssueMgmt.jsx
                 view/util/userinfomgmt/UserInfoMgmt.jsx
   - 검색+cascade: view/baselineforecast/master/actualsales/ActualSales.jsx
   - 컨트롤보드: view/baselineforecast/version/controlboard/ControlBoard.jsx
   - 팝업 기준: view/common/PopSelectItem.jsx
  ↓
Step 4. 21-components.md 에서 필요 입력/그리드/차트 선택
  ↓
Step 5. 백엔드 4종 + SP_UI_*.sql 작성
         - SP 네이밍: SP_UI_<DOMAIN>_<NO>_<ACTION> (→ rules/31-stored-procedures.md)
         - Service: JdbcTemplate.query("EXEC SP_UI_<...>_Q1 ?, ?", ...) 패턴 (→ rules/41b §5.6.4)
         - 자연어 질의 대상이면 View 온톨로지 등록 (→ rules/10-ontology-first.md)
  ↓
Step 6. 구현 · 라우팅 · 메뉴 등록
```

## 2. 파일 배치 규칙 (강제)

```
t3series-wingui/packages/wingui/src/view/
  └── <module>/                 ← baselineforecast, demandplan, masterplan, factoryplan,
                                   inventory, sales, system, util
      └── <category>/           ← (선택) master, entry, report, version, analysis, dashboard
          └── <n>/              ← 화면 이름 폴더 (lowercase)
              ├── <N>.jsx       ← 화면 컴포넌트 (PascalCase)
              ├── Base<N>.jsx   ← (선택) Base 래핑
              └── <N>.css       ← (선택) 스타일
```

### 네이밍 예시

| 업무 | 경로 |
|---|---|
| DP 수요 입력 | `view/demandplan/entry/entry/Entry.jsx` (+ `BaseEntry.jsx`) |
| MP 결과 분석 | `view/masterplan/analysisreport/mpresult/MpResult.jsx` |
| BF 컨트롤보드 | `view/baselineforecast/version/controlboard/ControlBoard.jsx` |
| Util 사용자정보 | `view/util/userinfomgmt/UserInfoMgmt.jsx` |
| System 사용자 | `view/system/usermgmt/users/Users.jsx` |

### 위젯 (대시보드용)
```
view/<module>/widgets/<widget-name>/
  └── <WidgetName>.jsx
```
(ContentInner 없이 직접 차트·그리드 렌더)

### ⛔ utility 도메인은 **`util/`** 단 하나뿐 — `ut/` 절대 금지

| ✅ | ❌ |
|---|---|
| `view/util/userinfomgmt/UserInfoMgmt.jsx` | `view/ut/userinfomgmt/UserInfoMgmt.jsx` |
| `web/domain/util/userinfo/` | `web/domain/ut/userinfo/` |
| `@RequestMapping("/util/user-infos")` | `@RequestMapping("/ut/user-infos")` |
| `zAxios.get('util/user-infos')` | `zAxios.get('ut/user-infos')` |

상세는 `CLAUDE.md §1.-1` · Hook (`path-convention.sh`) 자동 차단.

## 3. 필수 구조 (모든 화면 공통)

> **조회 조건(SearchArea)은 FilterBar JSON 으로 정의** — 상세는 `.claude/rules/22-filter-bar.md`.
> `SearchArea` · `SearchRow` 컴포넌트는 JSON 선언을 런타임에서 렌더하는 껍데기이며, 필드/검증/의존성은 반드시 `filter-bar.schema.json` 을 따르는 JSON 으로 작성한다.

### 3.1 임포트 블록 — 표준 (단일 경로 `@wingui/common/imports`)

```jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import SearchIcon from '@mui/icons-material/Search';

import {
  ContentInner, SearchArea, SearchRow, WorkArea,
  ButtonArea, LeftButtonArea, RightButtonArea,
  InputField, BaseGrid, GridCnt,
  GridAddRowButton, GridDeleteRowButton, GridSaveButton, GridExcelExportButton,
  zAxios, showMessage,
  useViewStore, useContentStore,
  useFieldCascade, applyGridCascade, buildPopupFilterProps,
} from '@wingui/common/imports';

import { transLangKey } from '@zionex/wingui-core';

// (선택) 분할/탭 등 레이아웃이 필요한 경우만
import { SplitPanel, TabContainer } from '@zionex/wingui-core';

// (선택) Master 팝업 — 실제 파일이 view/common/ 에 존재하는 것만 import
// import PopSelectItem from '@wingui/view/common/PopSelectItem';
```

> ❌ **금지**: `import { useViewStore } from '@wingui/common/store/viewStore'` 같은 개별 경로
> 이유: shim 으로 동작은 하지만 단일 경로 `@wingui/common/imports` 가 표준. Hook (`composer-patterns.sh §6.2.1`) warn.
> 단, `Pop*` 등 view/common 산하 컴포넌트는 `@wingui/view/common/<X>` 직접 import.
>
> ⛔ **`CommonCodeSelect` 산출물 import 금지** — wingui 본 환경에 없는 컴포넌트 (t3-composer
> preview shim 전용). 공통코드 dropdown 은 `<InputField type="select" options={[...]}>` 사용.
> 동적 옵션이 필요하면 화면 onMount 에서 `zAxios.get('/system/common/codes',{params:{'group-cd':'XXX'}})`.

### 3.2 그리드 컬럼 정의 — 반드시 컴포넌트 밖 (R3 강제)

```jsx
// ✅ OK - 컴포넌트 밖 (리렌더 재생성 방지)
//   - 모든 컬럼에 dataType 명시 (필수: text | number | datetime | boolean | group)
//   - 컬럼 헤더 라벨은 headerText (header 아님)
//   - 정렬 prop 은 textAlignment (textAlign 아님)
let gridItems = [
  { name: 'userId',     dataType: 'text',     headerText: '사용자 ID', width: 130, textAlignment: 'center', editable: true,
    validRules: [{ criteria: 'required' }] },
  { name: 'userNm',     dataType: 'text',     headerText: '사용자명',   width: 120, editable: true },
  { name: 'userTp',     dataType: 'text',     headerText: '사용자유형', width: 110, textAlignment: 'center', editable: true,
    useDropdown: true, lookupDisplay: true,
    values: ['ADMIN', 'NORMAL', 'GUEST'],
    labels: ['ADMIN', 'NORMAL', 'GUEST'] },
  { name: 'useYnBool',  dataType: 'boolean',  headerText: '사용여부',   width: 80,  textAlignment: 'center', editable: true },
  { name: 'joinDt',     dataType: 'datetime', headerText: '입사일',     width: 110, textAlignment: 'center', editable: true,
    displayType: 'date', datetimeFormat: 'yyyy-MM-dd',
    editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd' } },
  { name: 'createDttm', dataType: 'datetime', headerText: '등록일시',   width: 150, textAlignment: 'center', editable: false,
    datetimeFormat: 'yyyy-MM-dd HH:mm:ss' },
];

function MyScreen() { /* ... */ }
```

```jsx
// ❌ NG - 컴포넌트 안 (매 렌더마다 재생성되어 그리드 초기화 반복)
function MyScreen() {
  const gridItems = [ /* ... */ ];  // 금지
}
```

> **그리드 컬럼 안티패턴 (Hook 차단)**
> - `field:` (실제 key 는 `name:`) — `composer-jsx.sh CG5`
> - `type:'combo', items:[]` (실제: `useDropdown:true + lookupDisplay + values + labels`) — `CG5`
> - `dataType` 누락 — `BaseGrid.jsx:1016` 의 `item.dataType.toLowerCase()` 에서 TypeError, 화면 즉시 크래시
> - `textAlign:` (실제: `textAlignment:`) — `CG-FAB2`
> - enum 컬럼에 `lookupDisplay:true` 만 있고 `useDropdown:true` 누락 → 셀 편집 시 자유 text 됨 — `CG5b-2`

### 3.3 글로벌 버튼 등록 — 반드시 setViewInfo + `{ name, action }`

```jsx
// ✅ OK - 프레임워크 위임
//   activeViewId  ← useContentStore   (★ store 매핑 swap 금지)
//   setViewInfo   ← useViewStore
const [activeViewId] = useContentStore((s) => [s.activeViewId]);
const [setViewInfo]  = useViewStore((s) => [s.setViewInfo]);

useEffect(() => {
  if (!grid) return;  // 그리드 준비 후 등록
  setViewInfo(activeViewId, 'globalButtons', [
    { name: 'search', action: handleSearch, visible: true, disable: false },
    { name: 'save',   action: handleSave,   visible: true, disable: false },
  ]);
}, [activeViewId, grid, setViewInfo, handleSearch, handleSave]);
```

```jsx
// ❌ NG - 로컬 JSX 에 직접 렌더 (프레임워크 상단 바 미사용)
return (
  <>
    <button onClick={handleSearch}>조회</button>
  </>
);

// ❌ NG - { code, onClick } 옛 키 (Hook 차단 — composer-jsx.sh CG10)
//        실제 키는 { name, action }
[{ code: 'search', onClick: handleSearch }]

// ❌ NG - store swap (selector 가 undefined → setViewInfo is not a function)
const [activeViewId] = useViewStore((s) => [s.activeViewId]);     // useViewStore 에 activeViewId 없음
const [setViewInfo]  = useContentStore((s) => [s.setViewInfo]);   // useContentStore 에 setViewInfo 없음
```

### 3.4 그리드 객체 획득 — `afterGridCreate` 콜백 + `id` prop

```jsx
const [grid, setGrid] = useState(null);

const afterGridCreate = useCallback((gridObj /*, gridView, dataProvider */) => {
  setGrid(gridObj);
  // (선택) cascade 자동 wiring — fieldCascade.js 의 레지스트리 컬럼이 있으면
  applyGridCascade(gridObj, gridItems, {
    onCellPopupRequest: (rowIndex, columnName, parentValues) => { /* ... */ },
  });
}, []);

<BaseGrid
  id="userInfoGrid"          // ★ 문자열 id 필수 — Grid 버튼이 string 으로 참조
  items={gridItems}          // ★ items={...}  (columns= 아님)
  afterGridCreate={afterGridCreate}  // ★ afterGridCreate (afterCreate 아님)
/>

// 사용 시 null 체크 필수
const handleSave = () => {
  if (!grid) return;
  const states = grid.dataProvider.getAllStateRows();
  // states = { created: [...], updated: [...], deleted: [...], createAndDeleted: [...] }
};
```

> **그리드 API — 실제 메서드만 사용 (Hook 차단)**
>
> | ❌ 존재 안 함 | ✅ 실제 API |
> |---|---|
> | `grid.setData(rows)` | `grid.dataProvider.fillJsonData(rows)` |
> | `grid.getChangedData()` | `grid.dataProvider.getAllStateRows()` |
> | `grid.getChanges()` | `grid.dataProvider.getAllStateRows()` |
> | (행 단건 추출) | `grid.dataProvider.getJsonRow(idx)` |

### 3.5 그리드 버튼 — `grid=` prop 은 **문자열 id**

```jsx
<GridCnt
  grid="userInfoGrid"
  format={"{0} " + transLangKey("CASES") + " " + transLangKey("MSG_0010")}
/>
<GridAddRowButton    grid="userInfoGrid" addInfo={{ userTp: 'NORMAL', useYnBool: true }} />
<GridDeleteRowButton grid="userInfoGrid" onDelete={onDelete} onAfterDelete={handleSearch} />
<GridSaveButton      grid="userInfoGrid" onSave={onSave}     onAfterSave={handleSearch} />
<GridExcelExportButton grid="userInfoGrid" fileName="사용자정보" />
```

> ❌ `<GridSaveButton grid={grid1}>` (객체 ref) · `<GridSaveButton ... onClick={...}>` (옛 prop) — Hook block.

## 4. 서버 통신 = wingui REST (zAxios) 가 기본 (2026-04-27 정책 전환)

신규 화면은 모두 **zAxios → RestController → JdbcTemplate → SP_UI_\*** 4-tier.
`callService(...)` 엔진 경유 호출은 **BF/DP/MP/FP 계산 화면 수정 전용**으로 신규 화면에서 사용 금지.

### 4.1 조회 (zAxios.get)
```jsx
const handleSearch = () => {
  zAxios.get('util/user-infos', { params: getValues() })
    .then((res) => grid?.dataProvider.fillJsonData(res.data));
};
```
백엔드: `UserInfoController.list()` → `UserInfoService.search()` → `jdbcTemplate.query("EXEC SP_UI_UT_01_Q1 ?, ?", ...)`

### 4.2 저장 (multipart/form-data + GridSaveButton)
```jsx
const onSave = (gridObj, changeRowData) => {
  // payload 에 백엔드 Entity 필드만 명시 추출 (RealGrid 메타·화면용 가공 필드 제외)
  const payload = changeRowData.map((row) => ({
    userId: row.userId ?? '',
    userNm: row.userNm ?? '',
    /* ... 명시 필드만 ... */
    useYn:  toYN(row.useYnBool ?? row.useYn),
  }));
  const formData = new FormData();
  formData.append('changes', JSON.stringify(payload));
  return zAxios({
    method: 'post',
    url: 'util/user-infos',
    headers: { 'content-type': 'multipart/form-data' },
    data: formData,
  });
};
```
백엔드: `Controller.save(HttpServletRequest)` → `request.getParameter(ServiceConstants.PARAMETER_KEY_DATA)` → `ObjectMapper.readValue` → `service.saveAll(items)` → `jdbcTemplate.update("EXEC SP_UI_UT_01_S1 ?, ?, ?, ?", ...)`

### 4.3 삭제 (JSON body)
```jsx
const onDelete = (_g, rows) => zAxios({
  method: 'post',
  url: 'util/user-infos/delete',
  headers: { 'content-type': 'application/json' },
  data: rows,
});
```

### 4.4 Y/N ↔ Boolean 변환 헬퍼
```js
const toBool = (v) => v === true || v === 'Y' || v === 'y' || v === 1 || v === '1';
const toYN   = (v) => (toBool(v) ? 'Y' : 'N');

// 조회 응답 → 그리드 (Y/N CHAR(1) → boolean)
const rows = res.data.map((r) => ({ ...r, useYnBool: toBool(r.useYn) }));
```

### 4.5 ❌ 신규 화면에서 callService 사용 금지

```jsx
// ❌ 신규 화면에서 callService 사용 — Hook warn (composer-jsx.sh CG6f)
callService('SRV_GET_SP_UI_CM_50_Q1', getValues());

// ✅ zAxios 로 변경 (RestController + JdbcTemplate 으로 SP 호출)
zAxios.get('common/<features>', { params: getValues() });
```

> **예외**: BF/DP/MP/FP 계산 기반 **기존** 엔진 경유 화면을 수정하는 경우만 `callService(serviceId, paramMap, target)` 유지.
> target ∈ `'mp'|'dp'|'bf'|'fp'` (PlatformService.Module enum 4개만).
> 도메인-서버 매핑: BF/DP→`dp` · MP/CM/IM/RP/SO→`mp` · FP→`fp`.
> 상세: `.claude/rules/41-composer-generation.md §13`.

## 5. 라우팅 · 메뉴 등록

### 5.1 메뉴 등록 SQL 표준 (TB_AD_MENU **실제 컬럼만** 사용)

```sql
-- (1) 메뉴 등록 — TB_AD_MENU 실제 컬럼만:
--     ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN
--     + BaseEntity (CREATE_BY, CREATE_DTTM, MODIFY_BY, MODIFY_DTTM)
--     ❌ MENU_NM · PARENT_MENU_CD · URL · DEPTH · SORT_ORDER 컬럼은 존재하지 않음
INSERT INTO TB_AD_MENU (
    ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN, CREATE_BY, CREATE_DTTM
)
SELECT
    LOWER(REPLACE(NEWID(), '-', '')),                                      -- 32자 UUID
    (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'MENU_UTIL'),               -- 부모 (★ MENU_UT 아님)
    'UI_UT_USER_INFO_MGMT',                                                -- UI_<DOMAIN>_<NAME>
    N'유틸리티 > 사용자정보 관리',                                          -- 화면 표시 경로 (i18n)
    110,                                                                    -- 정렬 순서
    '/util/UserInfoMgmt',                                                  -- 단일 세그먼트 + PascalCase
    'Y', 'composer', GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM TB_AD_MENU WHERE MENU_CD = 'UI_UT_USER_INFO_MGMT');

-- (2) 다국어 라벨 — 메뉴 표시명은 **TB_AD_LANG_PACK** 에 별도 등록
--     컬럼: LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM, MODIFY_BY, MODIFY_DTTM
--     ❌ UPDATE_BY · UPDATE_DTTM 컬럼은 존재하지 않음 — MODIFY_* 사용
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM)
SELECT 'ko', 'UI_UT_USER_INFO_MGMT', N'사용자정보 관리', 'composer', GETDATE()
 WHERE NOT EXISTS (SELECT 1 FROM TB_AD_LANG_PACK WHERE LANG_CD='ko' AND LANG_KEY='UI_UT_USER_INFO_MGMT');

INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM)
SELECT 'en', 'UI_UT_USER_INFO_MGMT', N'User Info Management', 'composer', GETDATE()
 WHERE NOT EXISTS (SELECT 1 FROM TB_AD_LANG_PACK WHERE LANG_CD='en' AND LANG_KEY='UI_UT_USER_INFO_MGMT');

INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM)
SELECT 'ja', 'UI_UT_USER_INFO_MGMT', N'ユーザー情報管理', 'composer', GETDATE()
 WHERE NOT EXISTS (SELECT 1 FROM TB_AD_LANG_PACK WHERE LANG_CD='ja' AND LANG_KEY='UI_UT_USER_INFO_MGMT');

INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM)
SELECT 'zh', 'UI_UT_USER_INFO_MGMT', N'用户信息管理', 'composer', GETDATE()
 WHERE NOT EXISTS (SELECT 1 FROM TB_AD_LANG_PACK WHERE LANG_CD='zh' AND LANG_KEY='UI_UT_USER_INFO_MGMT');

-- (3) 권한 — 형제 메뉴 복사 (TB_AD_PERMISSION_GROUP)
--     컬럼: ID, GRP_ID, MENU_ID, PERMISSION_TP(READ|UPDATE|DELETE), USABILITY + BaseEntity
DECLARE @SRC CHAR(32) = (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'UI_UT_ISSUE_MGMT');
DECLARE @NEW CHAR(32) = (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'UI_UT_USER_INFO_MGMT');

INSERT INTO TB_AD_PERMISSION_GROUP (ID, GRP_ID, MENU_ID, PERMISSION_TP, USABILITY, CREATE_BY, CREATE_DTTM)
SELECT REPLACE(NEWID(),'-',''), p.GRP_ID, @NEW, p.PERMISSION_TP, p.USABILITY, 'composer', GETDATE()
  FROM TB_AD_PERMISSION_GROUP p
 WHERE p.MENU_ID = @SRC
   AND NOT EXISTS (
        SELECT 1 FROM TB_AD_PERMISSION_GROUP x
         WHERE x.MENU_ID = @NEW AND x.GRP_ID = p.GRP_ID AND x.PERMISSION_TP = p.PERMISSION_TP
   );
```

> **핵심 규칙 (Hook 자동 차단 — `menu-sql.sh`, `sql-schema-whitelist.sh`)**
> - `MENU_CD` 형식: `UI_<DOMAIN>_<NAME>` (정규식 `^UI_(AD|BF|CM|DP|DPD|FO|FP|IM|MP|RP|SA|SALES|SO|UT)_[A-Z][A-Z0-9_]*$`)
> - `MENU_FILE_PATH`: `/<module>[/<category>]/<PascalName>` — 마지막 직전 세그먼트 ≠ lowercase(마지막) (자동 추가 폴더 이중화 금지)
> - `.jsx` 확장자 포함 금지
> - `MENU_PATH` = `LOWER(MENU_FILE_PATH)`
> - 부모 lookup: `MENU_UTIL`/`MENU_DP`/`MENU_MP`/`MENU_FP`/`MENU_BF`/`MENU_IM`/`MENU_RP`/`MENU_SA`/`MENU_AD` (★ `MENU_UT` 는 존재 안 함)
> - MSSQL 구문만 — `GETDATE()` / `NEWID()` (Oracle `SYSDATE` / `SYS_GUID()` 금지)

### 5.2 프런트엔드 라우트
프레임워크의 메뉴-URL 자동 매핑으로 처리. 파일을 규약에 맞게 배치하면 자동 로드. **별도 라우트 코드 불필요**.

라우팅 변환식 (`contentStore.js:569`):
```js
filepath = view.filePath.toLowerCase() + view.filePath.slice(view.filePath.lastIndexOf('/'))
React.lazy(() => import('@wingui/view' + filepath))
```
즉 MENU_FILE_PATH `/util/UserInfoMgmt` → `view/util/userinfomgmt/UserInfoMgmt.jsx` 자동 매핑.

## 6. 백엔드 4종 세트 (2026-04-27 SP 정책 전환)

신규 화면은 다음 4개 산출물 + SP DDL 이 한 세트.

```
t3series-wingui/src/main/java/com/zionex/t3series/web/domain/<module>/<feature>/
  <Feature>.java               @Entity(TB_<DOMAIN>_<NAME>) extends BaseEntity (스키마 매핑용)
  <Feature>Service.java        @Service @RequiredArgsConstructor + JdbcTemplate (SP 호출)
  <Feature>Controller.java     @RestController (zAxios 엔드포인트)
  <Feature>Repository.java     (선택) extends JpaRepository — 단순 JPA CRUD 가 필요한 경우만
```

코드 템플릿·import 화이트리스트·정책 차단 조건은 **`.claude/rules/41b-composer-java.md`** 참조. 핵심만:

- ✅ `jakarta.persistence.*` / `jakarta.servlet.*` / `jakarta.validation.*` (Spring Boot 3.x)
- ✅ `com.zionex.t3series.web.util.audit.BaseEntity` (★ 허구 `web.domain.BaseEntity` 금지)
- ✅ Service: `jdbcTemplate.query("EXEC SP_UI_<DOMAIN>_<NO>_Q1 ?, ?", new BeanPropertyRowMapper<>(Feature.class), ...)`
- ✅ Controller 저장: `HttpServletRequest` + `request.getParameter(ServiceConstants.PARAMETER_KEY_DATA)` + `ObjectMapper.readValue`
- ❌ `javax.*` (Spring Boot 3 에서 제거됨 — 컴파일 실패)
- ❌ `SpecificationBuilder` / `QueryDslBuilder` (프로젝트에 없는 허구 유틸)
- ❌ 엔진 service XML (`mp/dp/bf/fp server/config/*_service.xml`) — 신규 화면용 생성 절대 금지

## 7. SP_UI_*.sql DDL 작성 규약

### 7.1 네이밍
```
SP_UI_<DOMAIN>_<SCREEN_NO>_<ACTION>[번호]
SP_UI_<DOMAIN>_<SCREEN_NO>_POP_<ACTION>
SP_UI_<DOMAIN>_<SCREEN_NO>_CHART_<ACTION>
```
- DOMAIN ∈ `{AD, BF, CM, DP, DPD, FO, FP, IM, MP, RP, SA, SALES, SO, UT}`
- ACTION ∈ `{Q1..Qn, S1..Sn, D1..Dn, J[n], M[n], BATCH, POP_Q1.., CHART_Q1..}`

### 7.2 배치 위치
```
t3series-database/mssql/upgrade/vX.Y.Z-YYYYMMDD/procedures/SP_UI_<...>.sql
```
- **MSSQL 방언만 작성** (`t3series-database/oracle/` 폴더에 파일 생성 금지 — memory 의 "MSSQL only" 규칙)

### 7.3 결정론적 정렬 필수
조회 SP (`_Q[0-9]+`) 는 **반드시** `ORDER BY` 포함. SORT_ORDER / CODE / NAME / DATE / PK 우선순위로 동일 입력 → 동일 순서 보장. 상세 `.claude/rules/31-stored-procedures.md §9`.

### 7.4 SQL 작성 전 스키마 사전 검증 (강제)
- 대응 Java Entity 의 `@Column(name=...)` 또는 `docs/reference/tables-catalog.md` 에서 **실제 컬럼명 확인**
- 같은 테이블 DDL 이 여러 upgrade 폴더에 있으면 **가장 최근 폴더** + Entity 가 진실 소스
- 상세 `.claude/rules/32-sql-schema-verification.md`

대표 함정:
- `TB_UT_USER_INFO`: 실제 `USER_EMAIL` / `USER_TEL` (★ `EMAIL` / `PHONE` 아님)
- `TB_AD_MENU`: 실제 `MENU_PATH` / `PARENT_ID` / `MENU_FILE_PATH` (★ `MENU_NM` / `PARENT_MENU_CD` / `URL` 아님)
- `TB_AD_LANG_PACK`: 실제 `MODIFY_BY` / `MODIFY_DTTM` (★ `UPDATE_BY` / `UPDATE_DTTM` 아님)

## 8. 온톨로지 등록 (자연어 질의 대상 화면)

자연어 질의 대응 화면은 **반드시** View 온톨로지 등록 필요.

```sql
-- 1. View 온톨로지에 화면 추가
INSERT INTO tb_is_vwbusnss_ontlgy (id, menu_cd, llm_infrrd, business_ontlgy, status, version)
VALUES (
  NEWID(),
  'UI_UT_USER_INFO_MGMT',
  '{}',                             -- LLM 이 자동 추론 후 채움
  '{"intent": "...", "tables": [...], "queries": [...]}',
  'DRAFT',                          -- 초기는 DRAFT, 검증 후 UPTODATE 로 전환
  1
);

-- 2. 관련 엔티티 등록
INSERT INTO tb_is_ontlgy_entity (id, version, name, entity_type, menu_cd, attributes, tables, status)
VALUES (
  'ENTITY_ID', 'v1', '사용자정보', 'business_entity', 'UI_UT_USER_INFO_MGMT',
  '["USER_ID", "USER_NM", "USER_EMAIL", "USER_TEL", "DEPT_CD", "POSITION_CD"]',
  '{"tables": ["TB_UT_USER_INFO"]}',
  'CANDIDATE'                       -- 검토 후 CONFIRMED
);
```

이후 LLM 자동 추론 → 검증 → `status='UPTODATE'`, `published_version` 설정.

상세 라이프사이클: `.claude/rules/10-ontology-first.md`.

## 9. 패턴별 스켈레톤 (모두 hook 통과 형태)

### 9.1 P02 · 검색+단일 그리드 (가장 일반적 — 마스터 CRUD)

```jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import SearchIcon from '@mui/icons-material/Search';

import {
  ContentInner, SearchArea, SearchRow, WorkArea,
  ButtonArea, LeftButtonArea, RightButtonArea,
  InputField, BaseGrid, GridCnt,
  GridAddRowButton, GridDeleteRowButton, GridSaveButton, GridExcelExportButton,
  zAxios, showMessage,
  useViewStore, useContentStore,
} from '@wingui/common/imports';
import { transLangKey } from '@zionex/wingui-core';

const toBool = (v) => v === true || v === 'Y' || v === 'y' || v === 1 || v === '1';
const toYN   = (v) => (toBool(v) ? 'Y' : 'N');

let gridItems = [
  { name: 'userId',     dataType: 'text',     headerText: '사용자 ID', width: 130, textAlignment: 'center', editable: true,
    validRules: [{ criteria: 'required' }] },
  { name: 'userNm',     dataType: 'text',     headerText: '사용자명',   width: 120, editable: true },
  { name: 'userTp',     dataType: 'text',     headerText: '사용자유형', width: 110, textAlignment: 'center', editable: true,
    useDropdown: true, lookupDisplay: true,
    values: ['ADMIN', 'NORMAL', 'GUEST'], labels: ['ADMIN', 'NORMAL', 'GUEST'] },
  { name: 'useYnBool',  dataType: 'boolean',  headerText: '사용여부',   width: 80,  textAlignment: 'center', editable: true },
  { name: 'createDttm', dataType: 'datetime', headerText: '등록일시',   width: 150, textAlignment: 'center', editable: false,
    datetimeFormat: 'yyyy-MM-dd HH:mm:ss' },
];

function UserInfoMgmt() {
  const [activeViewId] = useContentStore((s) => [s.activeViewId]);
  const [setViewInfo]  = useViewStore((s) => [s.setViewInfo]);

  const { control, getValues, handleSubmit } = useForm({
    // type 별 적정 초기값 — 21-components.md §3.1.0 참조
    //   text/select: '' / number: null / check: false / multiSelect: []
    //   datetime: null  (★ '' 금지 — Invalid Date)
    //   dateRange: [null, null]
    defaultValues: { userId: '', userNm: '', useYn: '' },
  });
  const [grid, setGrid] = useState(null);

  const handleSearch = useCallback(() => {
    zAxios.get('util/user-infos', { params: getValues() })
      .then((res) => {
        const rows = res.data.map((r) => ({ ...r, useYnBool: toBool(r.useYn) }));
        grid?.dataProvider.fillJsonData(rows);
      });
  }, [grid, getValues]);

  const onSave = useCallback((gridObj, changeRowData) => {
    const payload = changeRowData.map((row) => ({
      userId: row.userId ?? '',
      userNm: row.userNm ?? '',
      userTp: row.userTp ?? 'NORMAL',
      useYn:  toYN(row.useYnBool ?? row.useYn),
    }));
    const formData = new FormData();
    formData.append('changes', JSON.stringify(payload));
    return zAxios({
      method: 'post', url: 'util/user-infos',
      headers: { 'content-type': 'multipart/form-data' },
      data: formData,
    });
  }, []);

  const onDelete = useCallback((_g, rows) => zAxios({
    method: 'post', url: 'util/user-infos/delete',
    headers: { 'content-type': 'application/json' },
    data: rows,
  }), []);

  const handleSave = useCallback(() => {
    if (!grid) return;
    showMessage('확인', '저장하시겠습니까?', (ok) => {
      if (!ok) return;
      const states = grid.dataProvider.getAllStateRows();
      const changes = [
        ...(states.created ?? []),
        ...(states.updated ?? []),
      ];
      if (changes.length === 0) {
        showMessage('알림', '변경된 내용이 없습니다.');
        return;
      }
      onSave(grid, changes).then(() => {
        showMessage('알림', '저장되었습니다.', () => handleSearch());
      });
    });
  }, [grid, onSave, handleSearch]);

  const afterGridCreate = useCallback((gridObj) => {
    setGrid(gridObj);
  }, []);

  useEffect(() => {
    if (!grid) return;
    setViewInfo(activeViewId, 'globalButtons', [
      { name: 'search', action: handleSearch, visible: true, disable: false },
      { name: 'save',   action: handleSave,   visible: true, disable: false },
    ]);
  }, [activeViewId, grid, setViewInfo, handleSearch, handleSave]);

  return (
    <ContentInner>
      <SearchArea onSearch={handleSubmit(handleSearch)}>
        <SearchRow>
          <InputField control={control} type="text" name="userId" label="사용자 ID" />
          <InputField control={control} type="text" name="userNm" label="사용자명" />
          <InputField control={control} type="select" name="useYn" label="사용여부"
            options={[
              { value: '',  label: '전체' },
              { value: 'Y', label: '사용' },
              { value: 'N', label: '미사용' },
            ]} />
        </SearchRow>
      </SearchArea>

      <WorkArea>
        <ButtonArea>
          <LeftButtonArea>
            <GridCnt
              grid="userInfoGrid"
              format={"{0} " + transLangKey("CASES") + " " + transLangKey("MSG_0010")}
            />
          </LeftButtonArea>
          <RightButtonArea>
            <GridAddRowButton    grid="userInfoGrid" addInfo={{ userTp: 'NORMAL', useYnBool: true }} />
            <GridDeleteRowButton grid="userInfoGrid" onDelete={onDelete} onAfterDelete={handleSearch} />
            <GridSaveButton      grid="userInfoGrid" onSave={onSave}     onAfterSave={handleSearch} />
            <GridExcelExportButton grid="userInfoGrid" fileName="사용자정보" />
          </RightButtonArea>
        </ButtonArea>

        <BaseGrid id="userInfoGrid" items={gridItems} afterGridCreate={afterGridCreate} />
      </WorkArea>
    </ContentInner>
  );
}

export default UserInfoMgmt;
```

### 9.2 P04 · 수평 스플릿 마스터-디테일

```jsx
import { SplitPanel } from '@zionex/wingui-core';

function MyScreen() {
  const [masterGrid, setMasterGrid] = useState(null);
  const [detailGrid, setDetailGrid] = useState(null);
  const [masterId, setMasterId] = useState(null);

  const loadDetail = useCallback((id) => {
    setMasterId(id);
    zAxios.get(`<m>/<masters>/${id}/details`)
      .then((res) => detailGrid?.dataProvider.fillJsonData(res.data));
  }, [detailGrid]);

  const handleMasterClick = useCallback((row) => {
    // 디테일에 미저장 변경이 있으면 확인
    const detailStates = detailGrid?.dataProvider.getAllStateRows() ?? {};
    const hasChanges =
      (detailStates.created?.length ?? 0) +
      (detailStates.updated?.length ?? 0) +
      (detailStates.deleted?.length ?? 0) > 0;
    if (hasChanges) {
      showMessage('확인', '변경사항이 있습니다. 저장하시겠습니까?', (ok) => {
        if (ok) saveDetail().then(() => loadDetail(row.masterId));
        else loadDetail(row.masterId);
      });
    } else {
      loadDetail(row.masterId);
    }
  }, [detailGrid, loadDetail]);

  return (
    <ContentInner>
      <SearchArea>{/* ... */}</SearchArea>
      <WorkArea>
        <SplitPanel direction="vertical" sizes={[40, 60]} minSize={200}>
          <BaseGrid id="masterGrid" items={masterItems} afterGridCreate={setMasterGrid}
            onCellClicked={handleMasterClick} />
          <BaseGrid id="detailGrid" items={detailItems} afterGridCreate={setDetailGrid} />
        </SplitPanel>
      </WorkArea>
    </ContentInner>
  );
}
```

> **SplitPanel 실제 prop**: `direction='horizontal'|'vertical'` · `sizes={[20,80]}` · `minSize={number}` · `sx`
> ❌ `initialSizes` / `minSizes` / `defaultSizes` / `panelSize` (허구 prop — Hook block)

### 9.3 P03 · 검색+탭 그리드/차트

```jsx
import { TabContainer } from '@zionex/wingui-core';
// ★ TabContainer 는 children 으로 <Tab> 요소 — tabs={[]} prop 금지

function MyScreen() {
  const [tab, setTab] = useState('summary');
  const [summaryGrid, setSummaryGrid] = useState(null);
  const [detailGrid, setDetailGrid]   = useState(null);

  const loadData = useCallback((t) => {
    const url = t === 'summary' ? '<m>/<feat>/summary' : '<m>/<feat>/detail';
    zAxios.get(url, { params: getValues() }).then((res) => {
      const target = t === 'summary' ? summaryGrid : detailGrid;
      target?.dataProvider.fillJsonData(res.data);
    });
  }, [summaryGrid, detailGrid]);

  return (
    <ContentInner>
      <SearchArea>{/* ... */}</SearchArea>
      <WorkArea>
        <TabContainer value={tab} onChange={(v) => { setTab(v); loadData(v); }}>
          <Tab value="summary" label="요약">
            <BaseGrid id="summaryGrid" items={summaryItems} afterGridCreate={setSummaryGrid} />
          </Tab>
          <Tab value="detail" label="상세">
            <BaseGrid id="detailGrid" items={detailItems} afterGridCreate={setDetailGrid} />
          </Tab>
        </TabContainer>
      </WorkArea>
    </ContentInner>
  );
}
```

### 9.4 P06 · 크로스탭 피벗 입력

```jsx
// iteration 으로 시간 버킷 컬럼 동적 생성
let gridItems = [
  { name: 'itemCd',   fieldName: 'itemCd',  dataType: 'text',   headerText: '품목', width: 120, textAlignment: 'center' },
  { name: 'measure',  fieldName: 'measure', dataType: 'text',   headerText: '지표', width: 100, textAlignment: 'center' },
  {
    iteration: { prefix: 'date_', delimiter: '-' },
    name: 'date_{idx}', fieldName: 'date_{idx}',
    dataType: 'number', headerText: '{idx}', width: 100,
    textAlignment: 'far', editable: true,
    numberFormat: '#,##0.##',
  },
];
```

### 9.5 P01 · 위젯 대시보드

```jsx
import DashboardPanel from '@zionex/wingui-core/component/dashboard/DashboardPanel';

function MyDashboard() {
  const widgets = [
    { key: 'w1', title: 'Sales KPI',      widgetId: 'W_KPI_SALES',
      'data-grid': { x: 0, y: 0, w: 4, h: 2 } },
    { key: 'w2', title: 'Forecast Trend', widgetId: 'W_CHART_FORECAST',
      'data-grid': { x: 4, y: 0, w: 8, h: 4 } },
  ];
  return (
    <ContentInner>
      <DashboardPanel widgets={widgets} isResizable={false} isDraggable={false} />
    </ContentInner>
  );
}
```

## 10. 기획→개발→통합→테스트 체크리스트

### 기획
- [ ] 업무 유형 (마스터/리포트/입력/워크플로/대시보드) 확정
- [ ] 조회 조건 정의 (PlanScope · Location · Item · 기간 · 버전) — `.claude/rules/22-filter-bar.md` 의 DOMAIN_* 타입 우선
- [ ] 데이터 소스 확정 (테이블·뷰·SP)
- [ ] 사용자 액션 정의 (조회/저장/삭제/시뮬레이션/승인)
- [ ] 패턴 결정 (P01~P14)

### 개발 환경 준비
- [ ] 메뉴 코드 확정: `UI_<DOMAIN>_<NAME>`
- [ ] SP 네이밍 확정: `SP_UI_<DOMAIN>_<NO>_<ACTION>`
- [ ] 파일 경로 확정: `view/<module>[/<category>]/<n>/<N>.jsx`

### 구현 — JSX
- [ ] 표준 원본 (Users.jsx / IssueMgmt.jsx / UserInfoMgmt.jsx) Read 후 import 블록 그대로 복제
- [ ] `<ContentInner>` 최상위 래퍼
- [ ] `gridItems` 컴포넌트 밖 선언 + **모든 컬럼에 `dataType` 명시**
- [ ] `<BaseGrid id="..." items={...} afterGridCreate={...} />`
- [ ] Grid 버튼은 `grid="<string-id>"`
- [ ] `useContentStore` ← `activeViewId` · `useViewStore` ← `setViewInfo` (★ swap 금지)
- [ ] `setViewInfo(activeViewId, 'globalButtons', [{ name, action, visible, disable }])`
- [ ] `showMessage('제목', '메시지', (ok) => { ... })` 콜백 시그니처
- [ ] zAxios.get/post — `util/`/`<module>/` URL (★ `ut/` 금지)
- [ ] Master 필드는 Pop\* (자유 text 금지) — `view/common/` 에 실제 존재하는 Pop\* 만 import
- [ ] 공통코드는 `<InputField type="select" options=[...]>` (산출물 코드에 `CommonCodeSelect` import 금지 — preview shim 전용)
- [ ] 다국어: `transLangKey('...')` / `t('...')` 사용 (한글 하드코딩 시 warn)

### 구현 — 백엔드
- [ ] Entity / Service / Controller (+ 선택 Repository) 4종 작성
- [ ] `jakarta.*` import + `com.zionex.t3series.web.util.audit.BaseEntity`
- [ ] Service 는 `JdbcTemplate.query("EXEC SP_UI_<...>_Q1 ?, ?", new BeanPropertyRowMapper<>(Entity.class), ...)`
- [ ] Controller 저장: `HttpServletRequest` + `request.getParameter(ServiceConstants.PARAMETER_KEY_DATA)`
- [ ] SP_UI_*.sql DDL 작성 (CRUD 액션마다 1개 · MSSQL 만 · 조회 SP 결정론적 ORDER BY)

### 통합
- [ ] `TB_AD_MENU` INSERT (실제 컬럼만 — `MENU_NM`/`PARENT_MENU_CD`/`URL` 절대 사용 X)
- [ ] `TB_AD_LANG_PACK` ko/en/ja/zh 4개 INSERT (`MODIFY_BY` 사용 — `UPDATE_BY` X)
- [ ] `TB_AD_PERMISSION_GROUP` 형제 메뉴 권한 복사
- [ ] (자연어 질의 대상이면) `tb_is_vwbusnss_ontlgy.menu_cd` 등록
- [ ] 개인화 지원 시 `PopPersonalize` 연결
- [ ] FilterBar 의 모든 `label_i18n_key` 를 `TB_AD_LANG_PACK` 에 4언어 등록

### 테스트
- [ ] 조회 ▷ 저장 ▷ 삭제 플로우
- [ ] 검증 에러 케이스 (`validRules: [{ criteria: 'required' }]`)
- [ ] 엑셀 다운/업로드 (해당 시)
- [ ] 권한별 버튼 노출/숨김
- [ ] 다국어 (ko/en/ja/zh) 표시
- [ ] wingui 단독 기동으로 동작 확인 (mpserver/dpserver/fpserver 미기동 상태)

## 11. 배포 전 최종 점검

- [ ] `ContentInner` 최상위 래퍼?
- [ ] `gridItems` 컴포넌트 밖 + 모든 컬럼 `dataType` 명시?
- [ ] `BaseGrid id="..." items={...} afterGridCreate={...}` (★ columns/afterCreate 아님)?
- [ ] Grid 버튼 `grid="<string-id>"` (★ 객체 ref 아님)?
- [ ] `setViewInfo` 글로벌 버튼 `{ name, action }` 키 (★ `code, onClick` 아님)?
- [ ] `showMessage('제목', '메시지', cb)` 시그니처 (★ 첫 인자가 'confirm'/'error' 등 토큰 아님)?
- [ ] 신규 화면이 `zAxios` + RestController + JdbcTemplate + SP_UI_\* 4-tier (★ callService 미사용)?
- [ ] `TB_AD_MENU` INSERT 컬럼 = ID/PARENT_ID/MENU_CD/MENU_PATH/MENU_SEQ/MENU_FILE_PATH/USE_YN ?
- [ ] `TB_AD_LANG_PACK` ko/en/ja/zh INSERT (MODIFY_* 컬럼)?
- [ ] `TB_AD_PERMISSION_GROUP` 권한 복사?
- [ ] SP_UI_*.sql DDL (MSSQL upgrade 폴더)? 조회 SP `ORDER BY` 결정론적?
- [ ] Java 4종 import = `jakarta.*` + `com.zionex.t3series.web.util.audit.BaseEntity`?
- [ ] 모든 utility 산출물이 `util/` (★ `ut/` 한 자리도 사용 안 함)?
- [ ] (자연어 질의 대상) `tb_is_vwbusnss_ontlgy` 등록 + `status='UPTODATE'` 전이?
- [ ] 엑셀 다운/업로드 동작? (해당 시)
- [ ] 개인화 (`PopPersonalize`) 연결? (해당 시)

## 12. Anti-pattern 한눈에

| # | ❌ 금지 | ✅ 정답 | 검증 |
|---|---|---|---|
| R1 | `ContentInner` 누락 | `<ContentInner>` 최상위 | hook block |
| R2 | 글로벌 버튼 로컬 JSX 직접 렌더 | `setViewInfo` 위임 | hook warn |
| R3 | `gridItems` 컴포넌트 안 선언 | 컴포넌트 밖 선언 | hook block |
| R4 | `BaseGrid.afterGridCreate` 전 그리드 접근 | null 가드 + 콜백 안에서만 사용 | L |
| R5 | 분석 화면에 `GridAddRowButton` 노출 | CRUD 화면만 | L |
| R6 | sample/ 코드 그대로 프로덕션 복사 | Users / IssueMgmt / UserInfoMgmt 복제 | hook warn |
| R7 | 파일 경로 규약 위반 | `view/<module>[/<category>]/<n>/<N>.jsx` | hook warn |
| R8 | 자체 다이얼로그 작성 | 공용 Pop\* 재사용 | L |
| R9 | 한글 하드코딩 | `t(...)` / `transLangKey('...')` | hook warn |
| R10 | `<span className="material-icons">search</span>` | `import SearchIcon from '@mui/icons-material/Search'` + `<SearchIcon fontSize="small" />` | hook block |
| R11 | `<GridCnt grid="...">` 만 (`format` 누락) | `format={"{0} " + transLangKey(...) + ...}` | hook block |
| API1 | `<BaseGrid columns={...} afterCreate={...}>` | `items={...} afterGridCreate={...}` | hook block |
| API2 | `grid.setData/getChanges/getChangedData` | `grid.dataProvider.fillJsonData/getAllStateRows/getJsonRow` | hook block |
| API3 | Grid 버튼 `grid={ref객체}` | `grid="<string-id>"` | hook block |
| API4 | `globalButtons: [{code, onClick}]` | `[{name, action, visible, disable}]` | hook block |
| API5 | `showMessage('confirm', msg, cb)` | `showMessage('확인', msg, (ok)=>{...})` | hook block |
| API6 | `<TabContainer tabs={[...]}>` | children `<Tab>` | hook block |
| API7 | `<SplitPanel initialSizes={...}>` | `sizes={[...]} minSize={n}` | hook block |
| API8 | `<InputField type="action" .../>` 자기닫힘 | `<InputField type="action" readonly={true} ...><SearchIcon/></InputField>` | hook block |
| API9 | `import { useViewStore } from '@wingui/common/store/viewStore'` | `from '@wingui/common/imports'` | hook warn |
| API10 | `useViewStore` 에서 `activeViewId` 추출 | `useContentStore` 에서 추출 | hook block |
| API11 | `useContentStore` 에서 `setViewInfo` 추출 | `useViewStore` 에서 추출 | hook block |
| SQL1 | `TB_AD_MENU` 에 `MENU_NM/PARENT_MENU_CD/URL` 사용 | 실제 컬럼 (MENU_PATH/PARENT_ID/MENU_FILE_PATH) | hook block |
| SQL2 | `TB_AD_LANG_PACK` 에 `UPDATE_BY/UPDATE_DTTM` 사용 | `MODIFY_BY/MODIFY_DTTM` | hook block |
| SQL3 | parent `MENU_UT` (util) | `MENU_UTIL` | hook block |
| SQL4 | MENU_FILE_PATH `/util/userinfomgmt/UserInfoMgmt` (이중) | `/util/UserInfoMgmt` | hook block |
| SQL5 | `MENU_CD` 가 `UT_USER_INFO_MGMT` (UI_ 누락) | `UI_UT_USER_INFO_MGMT` | hook block |
| SQL6 | MENU_SQL 에 `SYSDATE`/`SYS_GUID` (Oracle) | `GETDATE()`/`NEWID()` (MSSQL) | hook block |
| API12 | 신규 화면이 `callService(...)` | `zAxios.get('<m>/<fs>')` REST | hook warn |
| API13 | 신규 화면이 엔진 service XML 생성 | wingui RestController + JdbcTemplate SP 호출 | server block |
| PATH1 | utility 도메인 산출물에 `ut/` | `util/` 표준 (한 자리도 줄이지 않음) | hook block |
| JAVA1 | `javax.persistence/servlet/validation/...` | `jakarta.*` (Spring Boot 3.x) | hook block |
| JAVA2 | `com.zionex.t3series.web.domain.BaseEntity` | `com.zionex.t3series.web.util.audit.BaseEntity` | hook block |
| JAVA3 | `SpecificationBuilder` / `QueryDslBuilder` 등 허구 유틸 | Criteria API 직접 작성 또는 JdbcTemplate + SP | hook block |

---

## 관련 문서

- 패턴 카탈로그: `docs/ui-patterns/README.md` (또는 프로젝트 지식의 `views.md`)
- 컴포넌트 인벤토리: `.claude/rules/21-components.md`
- FilterBar JSON: `.claude/rules/22-filter-bar.md` + `.claude/schemas/filter-bar.schema.json`
- DB 스키마: `.claude/rules/30-database-schema.md` + `docs/reference/tables-catalog.md`
- SP 작성: `.claude/rules/31-stored-procedures.md`
- SQL 사전 검증: `.claude/rules/32-sql-schema-verification.md`
- Composer 화면 생성:
  - 메인: `.claude/rules/41-composer-generation.md`
  - JSX 표준: `.claude/rules/41a-composer-jsx.md` ★ JSX 정답지
  - Java 백엔드: `.claude/rules/41b-composer-java.md` ★ Java 정답지
  - 위젯/Cascade/POPUP/CommonCode: `.claude/rules/41c-composer-widgets.md`
  - 9-Step Wizard: `.claude/rules/41d-composer-wizard.md`
- 안티패턴: `.claude/rules/99-anti-patterns.md` + `.claude/rules/99a-composer-anti-patterns.md`

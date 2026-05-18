# 99a. Composer 화면 생성 안티패턴 (CG-A ~ CG-F)

> **상위 규칙**: `99-anti-patterns.md` 의 §9-1 분리.
> Composer 화면 생성/수정 시 자주 발생하는 카테고리별 핵심 안티패턴.
> 전체 규약은 `41-composer-generation.md` (메인) + 4개 sub 파일 참조:
> - 41a-composer-jsx.md (JSX) · 41b-composer-java.md (Java) · 41c-composer-widgets.md (위젯) · 41d-composer-wizard.md (Wizard)

---

## A. 참조·구현 방식
| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CG-A1 | 유사 원본 안 읽고 자유 창작 | Read 2~3개 후 `참조 원본:` 명시 | LLM/L |
| CG-A2 | 신규 화면에 SP_UI_*.sql 누락 / 엔진 service XML 생성 (둘 다 안티패턴) | **SP_UI_*.sql 필수** + RestController + JdbcTemplate. 엔진 XML 만 금지 (2026-04-27 정책 전환) | hook H |
| CG-A3 | 신규 화면이 외부 엔진 (mpserver/dpserver 등) 기동 의존 / `callService(...)` 사용 | wingui 단독 구동 — RestController 가 JdbcTemplate 으로 SP 직접 호출 | server H |
| CG-A4 | Entity/Service/Controller 중 누락 또는 Service 가 JpaRepository/Specification 사용 | Entity + Service(JdbcTemplate SP 호출) + Controller 풀세트. Repository 는 선택 | server H |
| CG-A5 | 기존 공통 유틸(BaseEntity/BooleanToYNConverter/ResponseMessage) 무시 중복 구현 | wingui 기존 유틸 재사용 | L |
| CG-A6 | Controller 저장 엔드포인트가 `@RequestBody List<T>` (GridSaveButton 와 불일치) | `request.getParameter("changes")` + ObjectMapper | L |
| CG-A7 | **존재하지 않는 컴포넌트를 import** — 특히 `@wingui/view/common/PopDepartment`/`PopPosition` 처럼 Rule 표(`41c §6.1`)에 "표준 양식" 으로 적혀 있다고 해서 검증 없이 import. 실제 파일 부재 시 webpack "Module not found" 로 빌드 깨짐 (2026-04-29 사고 — UserInfoMgmt) | **JSX 출력 직전 모든 `@wingui/view/common/X` import 의 `X.jsx` 파일 존재 확인** (Glob/Read). 부재 시 두 갈래: ① 사용자 요청에 맞춰 일반 InputField 로 대체 (단순 화면) ② Pop\* 파일을 산출물에 함께 포함 (Master 필드 popup 필수). Rule 표는 인벤토리 이름이지 존재 보장 아님 | LLM/L |

## B. MENU_CD / MENU_FILE_PATH / MENU_PATH
| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CG-B1 | `UT_USER_INFO_MGMT` (UI_ 누락) · `MENU_UT_*` (그룹 prefix 차용) · 소문자/하이픈 | `UI_<DOMAIN>_<NAME>` UPPER_SNAKE | hook H |
| CG-B2 | MENU_FILE_PATH 마지막 직전 == lowercase(마지막) — 자동 추가 폴더 이중화 | `/<module>[/<category>]/<PascalCase>` | hook H |
| CG-B3 | MENU_FILE_PATH 에 `.jsx` 확장자 | 확장자 없이 | hook H |
| CG-B4 | MENU_FILE_PATH 마지막 세그먼트가 lowercase | JSX 파일명 PascalCase 강제 | hook warn |
| CG-B5 | MENU_PATH 에 PascalCase 대문자 | 모두 lowercase | hook warn |
| CG-B6 | MENU_PATH ≠ LOWER(MENU_FILE_PATH) (특수 케이스 외) | 페어 등식 유지 | L |
| CG-B7 | parent `MENU_UT` (util) | `MENU_UTIL` | hook H |
| CG-B8 | menus.js 만 수정 (DB 미등록) | TB_AD_MENU INSERT 필수 | L |
| CG-B9 | MENU_SQL 에 Oracle 구문 (`SYSDATE`/`SYS_GUID`) | MSSQL T-SQL (`GETDATE()`/`NEWID()`) | hook H |

## C. JSX 표면 API
| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CG-C1 | `import { ... } from '@wingui/common/store/*'` 또는 `@zionex/wingui-core/*` 직접 | `@wingui/common/imports` 단일 | hook H |
| CG-C2 | `<BaseGrid columns={...} afterCreate={...} />` | `items={...} afterGridCreate={...}` | hook H |
| CG-C3 | 그리드 컬럼 key `field:` · `type:'combo', items:[]` | `name:` · `useDropdown:true + lookupDisplay + values + labels` | hook H |
| CG-C4 | enum 컬럼에 `lookupDisplay:true` 만 (`useDropdown:true` 누락) — 셀 편집 시 자유 text | 4개 (useDropdown + lookupDisplay + values + labels) 모두 | hook warn |
| CG-C5 | `grid.setData / getChangedData / getChanges` | `grid.dataProvider.fillJsonData / getAllStateRows / getJsonRow` | hook H |
| CG-C6 | `<GridSaveButton grid={gridStateRef}>` (객체) | `grid="userInfoGrid"` (문자열 id) | hook H |
| CG-C7 | `globalButtons: [{code, onClick}]` | `[{name, action}]` | hook H |
| CG-C8 | `showMessage('confirm', msg, cb)` (타입 토큰) | `showMessage('확인', msg, cb)` (제목 문자열) | hook H |
| CG-C9 | `<InputField type="action" .../>` 자기닫힘 (children 없음 = 빈 버튼) · `InputProps.endAdornment` | `<InputField type="action" readonly={true} ...><SearchIcon/></InputField>` | hook warn |
| CG-C10 | 그리드 컬럼에 `button:'action'` / `buttonVisibility:'always'` 수동 지정 | `applyGridCascade` 가 자동 주입 | hook warn |
| CG-C11 | BaseGrid 컬럼에 `dataType` 누락 — `BaseGrid.jsx:1016` 의 `item.dataType.toLowerCase()` 호출에서 TypeError, 화면 진입 즉시 크래시 | 모든 컬럼에 `dataType: 'text'\|'number'\|'datetime'\|'boolean'\|'group'` 명시 | hook H (CG-FAB3-DT) |
| CG-C12 | Zustand store 매핑 swap — `useViewStore` 에서 `activeViewId` / `useContentStore` 에서 `setViewInfo` 추출 → selector 가 undefined 반환 → `setViewInfo is not a function` TypeError | `activeViewId` ← `useContentStore` · `setViewInfo` ← `useViewStore` (각각 정확한 store 사용) | hook H (CG-STORE) |

## D. 서버 통신
| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CG-D1 | 신규 화면이 `callService(...)` / `engine/...` URL 사용 | `zAxios.get('<m>/<fs>')` REST | hook warn |
| CG-D2 | `callService({url, params})` 객체 인자 | `callService(serviceId, paramMap, target)` (BF/DP/MP/FP 계산 전용) | hook H |
| CG-D3 | `callService('SP_UI_...', ...)` SP 이름 첫 인자 | XML 의 `<service id>` 값 (`SRV_UI_*` 또는 `SRV_GET_SP_UI_*`) | hook H |
| CG-D4 | `target='common'/'ut'/'cm'` 등 미등록 | `mp` / `dp` / `bf` / `fp` 4개만 (PlatformService.Module enum) | hook H |
| CG-D5 | 도메인-서버 매핑 위반 (UT/CM 을 dp 로) | CM/MP/IM/RP/SO/UT → mp · BF/DP → dp · FP → fp | L |

## E. Master 필드 / 공통코드 / Cascade
| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CG-E1 | Master 필드 (품목/거래처/거점/부서/직위) 자유 text 입력 | 기본 POPUP (Pop\* 컴포넌트 재사용) | hook warn |
| CG-E2 | hardcoded `options=[{value:'Y',label:'Y'},...]` (공통코드) | `<CommonCodeSelect groupCd="...">` | hook warn |
| CG-E3 | Cascade parent 잘못 모델링 (예: `deptCd → positionCd`) | 독립 마스터는 popup-only 등록 | L |
| CG-E4 | `useFieldCascade` / `applyGridCascade` 누락 (cascade 컬럼 사용 시) | form 에 useFieldCascade · 그리드 afterGridCreate 에 applyGridCascade | hook warn |
| CG-E5 | POPUP `confirm` 콜백을 단건 객체 가정 | 항상 배열 · `firstOf(sel)=Array.isArray(s)?s[0]:s` 추출 | L |

## F. 9단계 Wizard 통합 (2026-04 · NEW_STEP / NEW_FROM_COPY / NEW_FROM_DESIGN)
| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CG-F1 | `ModeNewFromCopy` / `ModeNewFromDesign` 가 직접 `createSession` + 단일 LLM 호출 | `prefilledSpec` + `mode` prop 으로 `StepByStepWizard` 위임. Step9 가 통합 호출 | L |
| CG-F2 | 모드별로 별도 prompt builder 호출 (`newFromCopyGuide` / `newFromDesignGuide`) | `newStepGuide(StepGuideMode.{PLAIN,COPY,DESIGN})` 단일 진입점 | L |
| CG-F3 | NEW_FROM_COPY 진입 후 `createInitialSpec()` 빈 spec 사용 | `createInitialSpecFromSource(sourceMenu, sourceBundle, ...)` 로 prefill | L |
| CG-F4 | NEW_FROM_DESIGN 진입 후 `createInitialSpec()` 빈 spec 사용 | `createInitialSpecFromDesign({ parsed, fileName, layoutSizes, ... })` 로 prefill | L |
| CG-F5 | NEW_FROM_COPY 자유 변경 요청을 진입 화면 텍스트박스에 입력 (단일 LLM 호출) | Step9 의 `changeReq` 자유 텍스트 입력란 (Wizard 진행 중) | L |
| CG-F6 | NEW_FROM_DESIGN 의 `parsedDesign` 텍스트 블록을 LLM 으로 안 보냄 | `formatDesignDocForPrompt({ parsed, layoutSizes, ... })` 로 첨부 | L |
| CG-F7 | NEW_FROM_COPY 의 `sourceBundle` 텍스트 블록을 LLM 으로 안 보냄 | `formatSourceBundleForPrompt(bundle)` 로 첨부 | L |
| CG-F8 | spec.sourceMenu / designDoc 메타가 `toLlmPayload()` payload 에 누락 | LLM 이 모드 컨텍스트 인식하도록 payload 에 포함 | L |

## G. 아티팩트 파일경로 환각 (2026-04-29 · ===FILE: 헤더 분류 실패)
> **사고 (2026-04-29)**: Composer 자연어 모드에서 LLM 이 ===FILE: 헤더 path 를
> `UI_UT_USER_INFO_MENU_sql` 처럼 **확장자를 underscore** 로 작성. 결과:
> `ArtifactExtractor.classifyArtifact` 의 `lower.endsWith(".sql")` 통과 못 해
> `TYPE_OTHER` 로 떨어짐 → `MenuRegistrationDialog.loadMenuSql` 이 `artifactType
> === 'MENU_SQL'` 매치 실패 → "MENU_SQL 아티팩트가 없습니다. Claude 응답에 메뉴
> 등록 SQL 이 포함되지 않았습니다." 에러로 메뉴 등록 자체 불가능.

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CG-G1 | LLM 이 ===FILE: path 끝을 `_sql` / `_jsx` / `_java` / `_tsx` / `_yaml` / `_json` / `_md` (underscore) 로 작성 | 정규 확장자 dot 사용 — `.sql` / `.jsx` / `.java` / `.tsx` / `.yaml` / `.json` / `.md` | hook H (`composer-artifact-path.sh`) |
| CG-G2 | `ArtifactExtractor.classifyArtifact` 가 정규 확장자 매치 실패 시 그냥 `TYPE_OTHER` 로 fallthrough | `_sql`/`_jsx`/`_java` underscore fallback + `/menus/` · `/procedures/` 디렉토리 기반 보강 분류 | LLM/L (`ArtifactExtractor.java`) |
| CG-G3 | MENU_SQL path 에 `menu` 단어가 들어있지 않음 (예: `UI_UT_USER_INFO_MGMT.sql`) → `TYPE_SQL_DDL` 로 분류 | path 에 `/menus/` 디렉토리 또는 파일명에 `menu` / `_menu` / `tb_ad_menu` 단어 포함 | LLM/L |
| CG-G4 | LLM 응답에 ===FILE: 블록은 있는데 분류 실패로 메뉴 등록 dialog 가 못 찾는 경우 사용자 안내 부재 | DB 진단 SQL: `SELECT ARTIFACT_TYPE, FILE_PATH FROM TB_IS_COMPOSER_ARTIFACT WHERE SESSION_ID=? AND STATUS<>'DISCARDED'` 로 분류 결과 직접 점검 | L |
| CG-G5 | 분류 실패한 OTHER 아티팩트가 DB 에 남아있어 사용자가 같은 세션에서 메뉴 등록을 또 시도 | 1회성 SQL: `UPDATE TB_IS_COMPOSER_ARTIFACT SET ARTIFACT_TYPE='MENU_SQL' WHERE ARTIFACT_TYPE='OTHER' AND (LOWER(FILE_PATH) LIKE '%/menus/%' OR LOWER(FILE_PATH) LIKE '%_menu_sql' OR LOWER(FILE_PATH) LIKE '%_menu.sql%') AND STATUS='DRAFT'` | L (1회성) |

## H. Grid 라이프사이클 — 화면 진입 후 + 버튼 / 저장 버튼 무반응 (2026-04-30 · 부서관리 사고)

> **사고 (2026-04-30)**: 부서관리 화면(`DeptMgmt.jsx`) 의 **`+` 버튼 (GridAddRowButton) 무반응**. 원인은 단일 결함이 아닌 3가지 결합:
> 1. `gridRef = useRef(null)` + 자동조회 `useEffect(() => {...}, [])` 빈 deps → mount 시 `ref.current === null` 이라 onSearch 한 번도 안 불려 그리드 영구히 빈 상태
> 2. `<GridAddRowButton initRow={{...}} />` — `initRow` 는 `GridButton.jsx` 가 인식하지 않는 prop (실제는 `onGetData` 함수)
> 3. `<GridSaveButton url="..." />` 만 있고 `onSave` 핸들러 누락 → 저장 버튼 클릭해도 zAxios 호출 안 됨
>
> rules/41a §4.4 의 예시에 잘못 적힌 `addInfo={{...}}` 도 같은 부류 — GridButton.jsx 의 실제 props 는 `grid · onBeforeAdd · onAfterAdd · onGetData`.

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CG-H1 | `<GridAddRowButton initRow={{...}} />` 또는 `addInfo={{...}}` — GridButton.jsx 가 인식 안 함 | 단순 빈 행: `<GridAddRowButton grid="..." />` · 기본값 필요: `onGetData={() => ({field:'A', useYn:'Y'})}` | hook H (`composer-jsx.sh CG-GRID-LIFECYCLE-2`) block |
| CG-H2 | `<GridSaveButton grid="..." url="..." />` 만 (onSave 누락) — 저장 버튼 무반응 | `const onSave = useCallback((_g, rows) => zAxios({method:'post', url:'<m>/<fs>', headers:{'content-type':'multipart/form-data'}, data: fd}), []); <GridSaveButton grid="..." onSave={onSave} onAfterSave={onSearch} />` | hook H (`composer-jsx.sh CG-GRID-LIFECYCLE-3`) block |
| CG-H3 | `useRef(null)` 로 grid 저장 + 자동조회 `useEffect(()=>{...},[])` (빈 deps) — `ref.current==null` 이라 onSearch 한 번도 안 불림 → 그리드 영구히 빈 상태 | `const [grid,setGrid]=useState(null); afterGridCreate=(g)=>setGrid(g); useEffect(()=>{ if(grid) onSearch(); }, [grid]);` — UserInfo.jsx 표준 패턴 | hook H (`composer-jsx.sh CG-GRID-LIFECYCLE-1`) warn |
| CG-H4 | `useRef` 로 저장한 grid 를 `useCallback(onSearch, [])` 의 deps 에서 제외 → stale closure 우려 (작동은 함) | `useState` 로 저장한 grid 를 deps 에 포함 — 매 grid 변경 시 onSearch 재생성 | LLM/L (코드 리뷰) |
| CG-H5 | rules/41a §4.4 예시에 `addInfo` 같은 잘못된 prop 명시 → LLM 학습 매체 오염 | 실제 GridButton.jsx 코드에서 props 추출하여 rule 갱신 | LLM/L (rule 검토) |

GridButton.jsx 실제 props 화이트리스트 (절대 다른 이름 사용 금지):
| 컴포넌트 | 인식되는 props |
|---|---|
| `GridAddRowButton` | `grid` (string) · `onBeforeAdd(grid)` · `onAfterAdd(grid)` · `onGetData(grid)` (새 행 데이터 반환 함수) |
| `GridDeleteRowButton` | `grid` · `onBeforeDelete` · `onDelete(grid, rows)` · `onAfterDelete` |
| `GridSaveButton` | `grid` · `onBeforeSave` · `onSave(grid, changeRowData)` · `onAfterSave` |
| `GridExcelExportButton` | `grid` · `fileName` · `sheetName` · 그 외 엑셀 옵션 |

## I. MENU_CD V2 distinction 의 백엔드 URL 환각 전파 (2026-04-30 · DeptMgmt V2 사고)

> **사고 (2026-04-30)**: 사용자가 기존 `UI_UT_DEPT_MGMT` 와 코드만 다른 신규 메뉴 `UI_UT_DEPT_MGMT_V2` 를 추가. **V2 는 메뉴 코드 distinction 한정** — 동일 JSX(`view/util/deptmgmt/DeptMgmt.jsx`) 와 동일 백엔드 (`/util/dept-mgmt` Controller, `TB_UT_DEPT`, `SP_UI_UT_DEPT_MGMT_*`) 를 공유하는 게 의도였음. 그러나 LLM 이 JSX zAxios 호출 3곳의 URL 을 `util/dept-mgmt-v2` 로 환각 → `@RequestMapping("/util/dept-mgmt")` 와 불일치 → 조회·저장·삭제 모두 404. 화면 진입 즉시 자동조회 실패.

### 핵심 원칙 — 어디에 V-접미어를 적용해야 하는가
| 표면 | V-접미어 적용? | 비고 |
|---|---|---|
| MENU_CD | ✅ 가능 | 기존 메뉴와 코드 distinguish (`UI_<DOMAIN>_<NAME>_V2`) |
| MENU_FILE_PATH | ✅ 가능 / ❌ 선택 | 동일 JSX 재사용이면 v-접미어 없음. 별도 JSX 파일이면 PascalCase 에 V2 (`/util/DeptMgmtV2`) |
| JSX 폴더/파일명 | ❌ 선택 | 동일 화면 재사용이면 v 없음. 다른 화면이면 폴더명/파일명에 v2 |
| **zAxios URL (JSX 안)** | ❌ **백엔드 Controller 매핑과 일치해야 함** | URL 은 메뉴 코드를 따라가는 게 아니라 백엔드 매핑을 따라간다 |
| **`@RequestMapping` (Controller)** | ❌ 일반적으로 단일 자원 공유 | Controller 도 v 가 있다면 명시적으로 그렇게 만든 경우만 |
| Service / Entity / Table / SP | ❌ 단일 자원 | V2 메뉴라도 같은 자원을 본다 |

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CG-I1 | MENU_CD 가 `_V2` 라서 JSX zAxios URL 도 `-v2` (예: `'util/dept-mgmt-v2'`) | zAxios URL 은 백엔드 Controller `@RequestMapping` 과 1:1 일치. V2 distinction 은 메뉴 코드에서만 | hook H (`composer-jsx.sh CG-URL-VSFX`) block |
| CG-I2 | Composer 가 NEW_FROM_COPY 로 V2 메뉴 만들 때 백엔드 자원도 v2 로 fork (Controller URL 변경 · Service 신규 · SP 신규) | 동일 백엔드 재사용이 기본. 정말 별도 자원이 필요한 경우만 Controller `@RequestMapping("/util/x-v2")` + 신규 Service/Entity/SP 함께 생성 (이때는 6종 모두 일관) | LLM/L |
| CG-I3 | zAxios URL 의 v-접미어를 발견하고 Controller 쪽을 v-접미어로 맞추려 함 (역방향 보완) | 항상 **백엔드 자원이 진실** — JSX URL 의 v-접미어를 제거해 Controller 와 정렬 | LLM/L |
| CG-I4 | V2 메뉴 의도 (`UI_<DOMAIN>_<NAME>_V2`) 인데 MENU_FILE_PATH 까지 v 접미어 없이 정확히 동일 (`/util/DeptMgmt`) → 두 메뉴가 같은 JSX 모듈을 로드 | 의도가 동일 화면 공유면 정상 (V2 는 메뉴만 다른 alias). 다른 화면이면 MENU_FILE_PATH 에 V2 를 명시 (`/util/DeptMgmtV2`) + JSX 파일명/폴더도 v2 | L |

### 자기 검증 절차 (V2 메뉴 작업 시 출력 직전)
1. JSX 안 모든 `zAxios.{get,post,...}('<url>', ...)` 의 첫 인자 추출
2. JSX 안 모든 `url: '<url>'` / `url="<url>"` 의 값 추출
3. 위 값들을 Java Controller 의 `@RequestMapping("<base>")` 값과 prefix 매칭 — 1:1 일치 여부 확인
4. JSX 폴더/파일명에 v2 가 없는데 zAxios URL 에는 v-접미어가 있다면 100% 환각

## J. Standalone preview Service / SP routing (2026-05-11 · Phase 3)

> Composer 단독 환경에서 산출물 Service 가 `JdbcTemplate` 을 무지정 인젝션 받으면 Spring 이 어느 DataSource (composer-db PG vs target-mssql) 와 wire 할지 불확정. 산출물이 MSSQL SP 호출 의도라면 반드시 `targetJdbcTemplate` qualifier 필요.

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CG-J1 | 산출물 `Service.java` 가 `private final JdbcTemplate jdbcTemplate;` (qualifier 없음) → composer-db (PG) 에 wire 됨 → MSSQL SP 호출 시 `'now' is not a recognized built-in function name` 등 syntax 오류 | `JavaArtifactRewriter.injectTargetJdbcTemplateQualifier()` 가 자동으로 `@Qualifier("targetJdbcTemplate")` + `org.springframework.beans.factory.annotation.Qualifier` import 주입 | backend rewriter 자동 |
| CG-J2 | Lombok `@RequiredArgsConstructor` 가 만드는 생성자 파라미터로 `@Qualifier` 가 복사되지 않아 qualifier 무효 | `backend/lombok.config` 에 `lombok.copyableAnnotations += org.springframework.beans.factory.annotation.Qualifier` | 설정 1회 |
| CG-J3 | 산출물 Controller 가 `ResponseMessage.builder().message(...).build()` 사용 (Lombok @Builder 없음) → 컴파일 실패 → 전체 startup 실패 → 모든 endpoint 500 | `ResponseMessage.ok()` / `ok(msg)` / `error(msg)` / `ofSuccess()` / `ofFail(msg)` 정적 팩토리 사용 | LLM/L · shared/data/ResponseMessage.java |
| CG-J4 | composer-backend 의 모듈 코드가 `JdbcTemplate` 을 qualifier 없이 인젝션 — Spring 의 autoconfig 가 target-mssql 빈에 잘못 wire 해 메타 DB UPDATE 가 MSSQL 로 전송 (`Invalid object name 'dbo.tb_cmp_target_system'`) | `@Qualifier("composerJdbcTemplate")` 명시 (PG 메타 DB) 또는 `@Qualifier("targetJdbcTemplate")` (운영 DB) | LLM/L |
| CG-J5 | shim `GridSaveButton` / `GridDeleteRowButton` 이 `g.dataProvider.getAllStateRows()` 직전 commit 호출 안 함 → 셀 편집 중일 때 `Client is editing (call grid.commit() or grid.cancel() first)` 오류 | 진입 직후 `try { if (typeof g.commit === 'function') g.commit(true); } catch (_) {}` | shim 자동 |
| CG-J6 | AI prefill 이 `source: "SP"` 라고 응답했지만 spName/crudSp/allSpNames/serviceIds 모두 비어있음 → Wizard Step4 가 빈 SP 모드로 표시되어 사용자가 데이터 흐름 파악 불가 | `mergeAiSpecIntoBaseSpec` 사후 정합화 — baseUrl 또는 entity 있으면 자동 `JPA_ENTITY` 로 전환 + 빈 SP 필드 제거 | wizardState.js 자동 |
| CG-J7 | NEW_FROM_COPY / EXISTING_MODIFY 가 각각 local `SourceBundlePreview` 정의 → 보강 시 두 곳 모두 수정 필요 | `SourceBundleSection.jsx` 공용 컴포넌트 import — `SourceBundleAnalysisPanel` + `SourceBundlePreview` | L |
| CG-J8 | Repository 의 method-name 기반 finder 를 SQL 로 추론할 때 camelCase → snake_case 단순 변환 사용 (예: `userName` → `user_name`) — 실제 컬럼이 `USER_NAME` 인 경우 잘못 매핑 | `JpaMethodSqlMapper.resolveColumn()` 이 Entity 의 `@Column(name="...")` 매핑 우선 사용 | backend 자동 |
| CG-J9 | sourceBundle.backend.entities[0] 의 `name` 필드가 `User.java` (확장자 포함) → frontend 의 `entityClassNames[0]` 가 잘못된 클래스명으로 인식 | `InsightSourceController.addJavaFile()` 이 `className` 별도 필드로 확장자 제거된 이름 동봉 (`User.java` → `User`) | backend 자동 |
| CG-J10 | `User.java` 같은 디렉토리에 `UserDeserializer.java`/`UserUtil.java` 등이 entities 배열에 함께 포함되어 첫 element 가 비-Entity 클래스 | `looksLikeNonEntity()` 가 `Deserializer/Serializer/Util/Helper/Config/Constants/Builder/Mapper/Converter.java` 자동 제외 + 정렬 시 dir 이름과 일치하는 className 우선 | backend 자동 |

### J 의 자기 검증 (산출물 Service 출력 직전)
- [ ] `JdbcTemplate` 필드에 `@Qualifier(...)` 있나? (LLM 출력 시점)
- [ ] `ResponseMessage.builder()` 호출 없는가?
- [ ] AI prefill 결과의 step4 area 중 `source==='SP'` AND `(spName + crudSp + allSpNames + serviceIds)` 모두 비어있는 항목 없는가?

## K. Target DB 접근 (2026-05-11 · Phase 3)

> Composer 의 NEW_FROM_COPY / EXISTING_MODIFY 가 활성 Target 의 운영 DB 에서 메뉴 트리·LangPack·소스를 실시간 조회.

| # | ❌ | ✅ | 비고 |
|---|---|---|---|
| CG-K1 | 트리 응답이 `source: "local"` 인데 한글 메뉴명 매핑 부족하다고 보고 | 활성 Target 의 `db_url` 미설정 또는 연결 실패 — TargetDataSourceRegistry 가 폴백한 상태. `[Storage 다이얼로그 → 연결 테스트]` 로 확인 |  |
| CG-K2 | 운영 DB 정보를 한 사용자가 UI 로 입력했는데 docker compose down/up 후 사라진 것으로 오해 | 입력값은 `composer-db.tb_cmp_target_system` 에 영구 저장됨. 영구 보존 + 다중 환경 동기화는 `.env` 의 `TARGET_<CD>_DB_*` 사용 (`TargetDbConnectionEnvLoader` 가 startup 시 적용) |  |
| CG-K3 | 헤더 Target 변경했는데 메뉴 트리/소스 결과가 안 바뀜 | `MenuTreeBrowser` / `ModeNewFromCopy` / `ModeExistingModify` 가 `activeTargetCd` prop 으로 명시 받아야 함. `useTargetStore.currentTargetCd` 의존 누락 시 발생 |  |
| CG-K4 | TargetSystem 의 jsonb 컬럼 (`artifact_naming` 등) 때문에 `targetRepo.save(t)` 실패 — `column "artifact_naming" is of type jsonb but expression is of type character varying` | DB 정보 update 는 `composerJdbcTemplate.update("UPDATE dbo.tb_cmp_target_system SET ...")` 직접 SQL 로 우회. JPA save() 미사용 |  |
| CG-K5 | TargetMenuController 가 `targetJdbcTemplate` 만 사용 (활성 Target 무시) | `pickJdbc(targetCd)` 헬퍼 — registry 에서 live DataSource 시도, 실패하면 로컬 폴백. 응답에 `source: "target:<cd>" | "local"` 표시 |  |

## L. Java 클래스 네이밍 충돌 (2026-05-15 · 연속 생성 사고)

> **사고 (2026-05-15)**: 사용자가 신규 화면을 연속적으로 생성. LLM 이 매번 클래스명을 **축약** (MENU_CD `UI_UT_USER_INFO_MGMT` 의 expected `UserInfoMgmt` 를 `UserInfo` 로 단축) → 다른 메뉴들도 모두 `UserInfo*.java` 환각 → Spring Bean 이름 충돌(`ConflictingBeanDefinitionException`) · wingui sync 시 silent 덮어쓰기 · JSX-Java 일관성 깨짐. 사용자 강력 차단 요청.

### L-1. 도출식 (rules/41b §5.6.0 단일 기준)
- `<Feature>` = MENU_FILE_PATH 마지막 segment **그대로** (글자수까지 1:1)
- `<feature_dir>` = `LOWER(<Feature>)` — 단일 lowercase 토큰
- 4종 파일: `<Feature>.java` · `<Feature>Controller.java` · `<Feature>Service.java` · `<Feature>Repository.java` (선택)
- package: `com.zionex.t3series.web.domain.<module>.<feature_dir>`

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CG-L1 | MENU_FILE_PATH `/util/UserInfoMgmt` 인데 Java 만 `UserInfo*.java` 로 축약 → 다른 메뉴 (`UserInfoView`, `UserInfoDetail`) 도 동일하게 `UserInfo*.java` 환각 → wingui sync 시 덮어쓰기 / Spring Bean 충돌 / JSX-Java mismatch | `UserInfoMgmt.java` / `UserInfoMgmtController.java` / `UserInfoMgmtService.java` — MENU_FILE_PATH 마지막 segment 글자수까지 1:1 보존 | hook H (`java-class-naming.sh`) block |
| CG-L2 | 디렉토리는 `userinfomgmt` 인데 안의 클래스는 `UserInfo*.java` — `lowercase(stripSuffix(ClassName)) ≠ feature_dir` | 디렉토리 `userinfomgmt` 안에 `UserInfoMgmt*.java`. `lowercase("UserInfoMgmt") == "userinfomgmt"` 확인 | hook H block |
| CG-L3 | 디렉토리에 하이픈/언더스코어 (`user-info-mgmt` · `user_info_mgmt`) | 단일 lowercase concat (`userinfomgmt`) — Java 패키지 segment 는 식별자 1개 | hook H block |
| CG-L4 | `@Service("userInfoService")` / `@Controller("user")` 등 명시 빈 이름 사용 — 다른 산출물이 같은 빈 이름 지정 시 충돌 | 빈 이름 명시 안 함 — Spring 기본 (클래스 첫 글자 lowercase) 자동 사용 (`userInfoMgmtService`) | hook H warn |
| CG-L5 | JSX 의 `export default UserInfo` 인데 Java 의 클래스명은 `UserInfoMgmt` (또는 반대) — 단어 수준 불일치 | JSX 의 `export default <X>` 와 Java 의 `<Feature>` 그리고 MENU_FILE_PATH 마지막 segment **셋 모두 동일** | LLM/L |
| CG-L6 | 산출물에 `BaseEntity`/`ResponseMessage` 등 공용 클래스를 신규 생성 → 기존 wingui 의 같은 이름 클래스와 충돌 | 공용 클래스는 산출물 대상 외 — 항상 import 만. 신규로 만들지 말 것 | LLM/L |

### L 의 자기 검증 (Java 산출물 출력 직전 — 모든 신규 화면 모드)

```
사용자 요청 MENU_CD: UI_UT_USER_INFO_MGMT
사용자 요청 MENU_FILE_PATH: /util/UserInfoMgmt
                            ────────────
                            └─ <Feature> = "UserInfoMgmt" (이대로)
                               <feature_dir> = "userinfomgmt" (LOWER)

작성할 파일:
[✓] backend/.../web/domain/util/userinfomgmt/UserInfoMgmt.java
[✓] backend/.../web/domain/util/userinfomgmt/UserInfoMgmtController.java
[✓] backend/.../web/domain/util/userinfomgmt/UserInfoMgmtService.java
[✓] backend/.../web/domain/util/userinfomgmt/UserInfoMgmtRepository.java  (선택)
[✓] frontend/.../view/util/userinfomgmt/UserInfoMgmt.jsx
    └─ export default UserInfoMgmt;

대조 확인:
  - 4개 .java 의 basename 이 모두 "UserInfoMgmt" prefix 인가?
  - 4개 모두 동일 디렉토리 "userinfomgmt/" 인가?
  - JSX 의 export default 명이 "UserInfoMgmt" 인가?
  - 셋 (MENU_FILE_PATH 마지막, Java <Feature>, JSX 컴포넌트) 모두 글자수까지 동일한가?
```

## M. 사용자 선택 데이터 소스 대체 (2026-05-16 · TB_AD_USER → TB_UT_USER_INFO 사고)

> **사고 (2026-05-16)**: Data Source 별자리 맵에서 사용자가 `TB_AD_USER` 를 직접 선택했으나
> 생성 결과가 `TB_UT_USER_INFO`(레거시 사용자 부가정보 테이블)를 사용 → 충돌. 원인 ① 테이블
> 검증(`ComposerService.enrichUserContentWithTableLookup`)이 세션 Target 이 아닌 composer-db
> 를 조회해 `TB_AD_USER` 를 "미존재" 오판 ② `.claude/rules` 의 사용자관리 예시가 전부
> `TB_UT_USER_INFO` / `UserInfoMgmt` 라 LLM 이 그쪽으로 표류.

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CG-M1 | `=== 데이터 소스 ===` / `=== 자동 테이블 존재 여부 확인 ===` 블록의 테이블을 무시하고 이름이 비슷한 다른 테이블로 대체 (`TB_AD_USER`→`TB_UT_USER_INFO`) | 블록에 적힌 그 테이블/SP **만** 사용 — 학습된 표준 예시(`UserInfoMgmt`/`TB_UT_USER_INFO`)로 표류 금지 | ComposerPromptBuilder INVARIANTS §②-2 |
| CG-M2 | 운영 코어 테이블(TB_AD_USER·TB_AD_MENU·TB_AD_LANG_PACK 등)에 `CREATE TABLE` 생성 | 기존 테이블은 실제 컬럼으로 Entity·SP 매핑 — CREATE 금지 | hook H (`sql-schema-whitelist.sh` CORE_TABLES) · apply `tableCollisionBlocked` |
| CG-M3 | 테이블 검증을 targetCd 없이 호출 → composer-db(PG) 조회 → 모든 TB_* "미존재" 오판 | `enrichUserContentWithTableLookup` / `checkTableNameCollisions` 가 세션 `targetCd` 로 운영 DB 질의 (수정 완료 — rules/50 §13.7) | backend |
| CG-M4 | 화면 MENU_CD 도메인과 다르다는 이유로 사용자 지정 테이블을 같은 도메인 테이블로 교체 | 도메인 불일치는 정상 (UI_AD_* 화면이 TB_AD_USER 사용) — 사용자 지정이 우선 | LLM/L |

# 99a. Composer 화면 생성 안티패턴 카탈로그

> 본 문서 = **표 형식 카탈로그**. 사건 경위·코드 예시는 git history 또는 hook 메시지 참조.
> 99-anti-patterns.md §9-1 분리. 전체 규약: `41-composer-generation.md` + sub `41a/b/c/d`.

## A. 참조·구현 방식

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CG-A1 | 유사 원본 안 읽고 자유 창작 | Read 2~3개 후 `참조 원본:` 명시 | LLM |
| CG-A2 | 신규 화면에 SP_UI_*.sql 누락 (NEW_FROM_COPY 제외) / 엔진 service XML 생성 | SP_UI_*.sql 필수 + RestController + JdbcTemplate | hook H |
| CG-A3 | 신규 화면이 외부 엔진 기동 의존 / `callService(...)` | wingui 단독 — RestController + JdbcTemplate + SP | server H |
| CG-A4 | Entity/Service/Controller 누락 또는 Service 가 JpaRepository/Specification | Entity + Service(JdbcTemplate SP) + Controller. Repository 선택 | server H |
| CG-A5 | 공통 유틸 (BaseEntity/ResponseMessage 등) 무시 중복 구현 | 기존 유틸 재사용 | LLM |
| CG-A6 | Controller 저장이 `@RequestBody List<T>` | `HttpServletRequest` + `request.getParameter("changes")` + ObjectMapper | LLM |
| CG-A7 | 존재하지 않는 Pop\* 컴포넌트 import (예: PopDepartment 부재) | 파일 사전 확인. 부재 시 InputField 대체 또는 Pop\* 같이 생성 | LLM |

## B. MENU_CD / MENU_FILE_PATH / MENU_PATH

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CG-B1 | `UT_USER_INFO_MGMT` (UI_ 누락) · `MENU_UT_*` · 소문자/하이픈 | `UI_<DOMAIN>_<NAME>` UPPER_SNAKE | hook H |
| CG-B2 | MENU_FILE_PATH 마지막 직전 == lowercase(마지막) — 이중화 | `/<module>[/<category>]/<PascalCase>` | hook H |
| CG-B3 | MENU_FILE_PATH 에 `.jsx` 확장자 | 확장자 없이 | hook H |
| CG-B4 | MENU_FILE_PATH 마지막 segment 가 lowercase | PascalCase 강제 | hook warn |
| CG-B5 | MENU_PATH 에 대문자 | 모두 lowercase | hook warn |
| CG-B6 | MENU_PATH ≠ LOWER(MENU_FILE_PATH) | 페어 등식 유지 | LLM |
| CG-B7 | parent `MENU_UT` (util) | `MENU_UTIL` | hook H |
| CG-B8 | menus.js 만 수정 (DB 미등록) | TB_AD_MENU INSERT 필수 | LLM |
| CG-B9 | MENU_SQL 에 Oracle 구문 (`SYSDATE`/`SYS_GUID`) | MSSQL (`GETDATE()`/`NEWID()`) | hook H |

## C. JSX 표면 API

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CG-C1 | `@wingui/common/store/*` · `@zionex/wingui-core/*` 직접 | `@wingui/common/imports` 단일 | hook H |
| CG-C2 | `<BaseGrid columns={} afterCreate={} />` | `items={} afterGridCreate={}` | hook H |
| CG-C3 | 컬럼 key `field:` · `type:'combo', items:[]` | `name:` · `useDropdown:true + lookupDisplay + values + labels` | hook H |
| CG-C4 | enum 컬럼에 `lookupDisplay:true` 만 (useDropdown 누락) | 4개 모두 (useDropdown + lookupDisplay + values + labels) | hook warn |
| CG-C5 | `grid.setData / getChangedData / getChanges` | `grid.dataProvider.fillJsonData / getAllStateRows / getJsonRow` | hook H |
| CG-C6 | `<GridSaveButton grid={ref}>` (객체) | `grid="userInfoGrid"` (문자열 id) | hook H |
| CG-C7 | `globalButtons: [{code, onClick}]` | `[{name, action}]` | hook H |
| CG-C8 | `showMessage('confirm', msg, cb)` | `showMessage('확인', msg, cb)` | hook H |
| CG-C8a | `import { showMessage } from '@wingui/common/imports'` (또는 어떤 경로에서든 named import) — wingui 본 환경에 named export 없음, sync 후 컴파일 실패 | **import 라인 없이 free variable 로 호출** — 번들/부트스트랩 전역. `rules/41a §4.1` · `rules/50 §13.8` | hook H |
| CG-C9 | `<InputField type="action" />` 자기닫힘 · `InputProps.endAdornment` | children `<SearchIcon/>` 필수 | hook warn |
| CG-C10 | 컬럼에 `button:'action'`/`buttonVisibility` 수동 | `applyGridCascade` 자동 주입 | hook warn |
| CG-C11 | BaseGrid 컬럼 `dataType` 누락 → 화면 즉시 크래시 | 모든 컬럼에 `dataType` | hook H |
| CG-C12 | Store swap — `useViewStore`에서 `activeViewId` / `useContentStore`에서 `setViewInfo` | `activeViewId` ← `useContentStore` · `setViewInfo` ← `useViewStore` | hook H |
| CG-C13 | `useForm` 의 datetime/dateRange/number/check/multiSelect 빈 문자열 default | `datetime→null` · `dateRange→[null,null]` · `number→null` · `check→false` · `multiSelect→[]` | LLM |

## D. 서버 통신

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CG-D1 | 신규 화면이 `callService` / `engine/...` URL | `zAxios.get('<m>/<fs>')` REST | hook warn |
| CG-D2 | `callService({url, params})` 객체 인자 | `callService(serviceId, paramMap, target)` (계산 화면 전용) | hook H |
| CG-D3 | `callService('SP_UI_*', ...)` SP 이름 첫 인자 | XML `<service id>` 값 | hook H |
| CG-D4 | `target='common'/'ut'/'cm'` 미등록 | `mp` / `dp` / `bf` / `fp` 4개만 | hook H |
| CG-D5 | 도메인-서버 매핑 위반 | CM/MP/IM/RP/SO → mp · BF/DP → dp · FP → fp | LLM |

## E. Master 필드 / 공통코드 / Cascade

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CG-E1 | Master 필드 자유 text | 기본 POPUP (Pop\* 재사용) | hook warn |
| CG-E2 | 산출물에 `CommonCodeSelect` import (preview shim 전용) | `<InputField type="select" options={...}>` + 동적 fetch | LLM |
| CG-E3 | Cascade parent 잘못 모델링 (독립 마스터를 종속으로) | 독립 마스터는 popup-only | LLM |
| CG-E4 | cascade 컬럼인데 `useFieldCascade` / `applyGridCascade` 누락 | form 에 useFieldCascade · grid afterGridCreate 에 applyGridCascade | hook warn |
| CG-E5 | POPUP confirm 콜백을 단건 객체 가정 | 항상 배열 · `firstOf(sel)` 추출 | LLM |

## F. Wizard 통합

> 2026-06-11 정리: 9-Step Wizard 는 deprecated (소스 보존 · 진입점 폐기 — rules/41d §16.7).
> 활성 Wizard 는 4-Step (`ComposerWizard.jsx`). 모드 (`NEW_STEP` · `NEW_FROM_COPY` ·
> `EXISTING_MODIFY`) 통합 흐름은 rules/41d §16 참조.

| # | ❌ | ✅ |
|---|---|---|
| CG-F1 | Mode 진입 화면에서 `createSession` 직접 호출 (단일 LLM 호출) | `initialSpec` prop 으로 `ComposerWizard` 위임 — GenerateStep 이 통합 호출 |
| CG-F2 | 모드별 별도 prompt builder | 단일 `specToInitialPrompt(spec)` (wizardState.js) |
| CG-F3 | 빈 spec 진입 | `spec*FromPattern/Mockup/Synthesized/UiPattern()` 또는 `mergeAiPrefillIntoSpec` |
| CG-F4 | 변경 요청을 진입 화면 텍스트박스 (단일 호출) | GenerateStep 이후 ComposerWorkspace 자유 채팅 |
| CG-F5 | `sourceBundle` 텍스트 안 보냄 | `formatSourceBundleForPrompt` 로 첨부 |
| CG-F6 | spec 의 보조 필드 (`sourceMenu` / `_intentNl` / `_prefillMeta`) 임의 제거 | 진입 모드별 동작에 필요 — 보존 |
| CG-F7 (deprecated) | ~~9-Step `StepByStepWizard` 신규 사용~~ | 4-Step `ComposerWizard` 로 통일 (2026-06-11) |

## G. 아티팩트 파일경로 환각

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CG-G1 | ===FILE: path 끝 `_sql`/`_jsx`/`_java` (underscore) | 정규 확장자 dot — `.sql` / `.jsx` / `.java` | hook H |
| CG-G2 | classifyArtifact 가 매치 실패 시 `TYPE_OTHER` | underscore fallback + 디렉토리 기반 보강 | LLM |
| CG-G3 | MENU_SQL path 에 `menu` 단어 없음 → `TYPE_SQL_DDL` | path 에 `/menus/` 또는 `menu`/`tb_ad_menu` 단어 | LLM |
| CG-G4 | 분류 실패 OTHER 가 DB 에 남음 | DB 진단 SQL 로 ARTIFACT_TYPE 점검 | LLM |

## H. Grid 라이프사이클 — 버튼 무반응

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CG-H1 | `<GridAddRowButton initRow={}>` / `addInfo={}` (미인식 prop) | `grid="..."` 만 또는 `onGetData={() => ({...})}` | hook H |
| CG-H2 | `<GridSaveButton url="..." />` (onSave 누락) | `onSave={(g,rows) => zAxios.post(...)}` | hook H |
| CG-H3 | `useRef(null)` grid + 자동조회 `useEffect(()=>{},[])` → 영구 빈 그리드 | `useState(null)` + `setGrid` in `afterGridCreate` + `useEffect(()=>{if(grid)onSearch()},[grid])` | hook H |

**GridButton.jsx 실제 props 화이트리스트:**
| 컴포넌트 | props |
|---|---|
| `GridAddRowButton` | `grid` · `onBeforeAdd` · `onAfterAdd` · `onGetData` |
| `GridDeleteRowButton` | `grid` · `onBeforeDelete` · `onDelete(grid, rows)` · `onAfterDelete` |
| `GridSaveButton` | `grid` · `onBeforeSave` · `onSave(grid, changeRowData)` · `onAfterSave` |
| `GridExcelExportButton` | `grid` · `fileName` · `sheetName` |

## I. V2 메뉴 — URL 환각 금지

**핵심**: V2 distinction = **메뉴 코드 한정**. zAxios URL · Controller · Service · Entity · Table · SP 는 단일 자원 공유.

| 표면 | V-접미어? |
|---|---|
| `MENU_CD` (`UI_<DOMAIN>_<NAME>_V2`) | ✅ |
| `MENU_FILE_PATH` · JSX 파일명 | 별도 화면일 때만 |
| **zAxios URL** | ❌ 항상 Controller `@RequestMapping` 과 일치 |
| 백엔드 (Controller/Service/Entity/Table/SP) | 일반적으로 공유 |

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CG-I1 | MENU_CD `_V2` 라서 URL `-v2` 환각 | URL = Controller `@RequestMapping` 1:1 일치 | hook H |
| CG-I2 | NEW_FROM_COPY 로 V2 만들 때 backend 전부 fork | 동일 backend 재사용 기본 |  |
| CG-I3 | URL 의 v-접미어 발견하고 Controller 를 그쪽에 맞춤 | 백엔드가 진실 — URL 의 v-접미어 제거 | LLM |

## J. Standalone preview Service / SP routing

| # | ❌ | ✅ |
|---|---|---|
| CG-J1 | Service 가 `private final JdbcTemplate jdbcTemplate;` (qualifier 없음) | `JavaArtifactRewriter` 가 `@Qualifier("targetJdbcTemplate")` 자동 주입 |
| CG-J2 | Lombok `@RequiredArgsConstructor` 가 `@Qualifier` 미복사 | `lombok.config` 에 `copyableAnnotations += @Qualifier` |
| CG-J3 | `ResponseMessage.builder()` · `ResponseMessage.ok()/error()/of()/ofSuccess()/ofFail()` 호출 | **`new ResponseMessage(HttpStatus.OK.value(), "saved")`** · `new ResponseMessage(HttpStatus.BAD_REQUEST.value(), msg)` 직접 생성자 (wingui 본 환경엔 정적 팩토리 없음 — sync 후 컴파일 실패. 단독 환경 별칭은 안전망일 뿐 의존 금지) |
| CG-J4 | `JdbcTemplate` qualifier 없이 인젝션 | `@Qualifier("composerJdbcTemplate")` (메타) 또는 `@Qualifier("targetJdbcTemplate")` (운영) |
| CG-J5 | Grid 버튼이 `getAllStateRows()` 전 commit 없음 | shim 이 `g.commit(true)` 자동 |
| CG-J6 | AI prefill `source:"SP"` 인데 spName/crudSp 빈 string | `mergeAiSpecIntoBaseSpec` 사후 정합화 |
| CG-J7 | NEW_FROM_COPY / EXISTING_MODIFY 각자 local SourceBundlePreview | `SourceBundleSection.jsx` 공용 |
| CG-J8 | Repository finder camelCase→snake 단순 변환 | Entity `@Column(name)` 매핑 우선 |
| CG-J9 | entities[0].name = `User.java` (확장자 포함) | `className` 필드 별도 (확장자 제거) |
| CG-J10 | entities[0] 가 `UserDeserializer.java` 같은 비-Entity | `looksLikeNonEntity()` 자동 제외 |

## K. Target DB 접근

| # | ❌ | ✅ |
|---|---|---|
| CG-K1 | 트리 응답 `source:"local"` 인데 매핑 부족 보고 | Target `db_url` 미설정/연결 실패 — TargetSystemSelector 확인 |
| CG-K2 | UI 입력값이 docker down/up 후 사라진 줄 오해 | composer-db 에 영구 저장. 다중 환경은 `.env` 의 `TARGET_<CD>_DB_*` |
| CG-K3 | Target 변경했는데 결과 안 바뀜 | `activeTargetCd` prop 명시 전달 |
| CG-K4 | jsonb 컬럼 때문에 `targetRepo.save(t)` 실패 | `composerJdbcTemplate.update(...)` 직접 SQL |
| CG-K5 | TargetMenuController 가 `targetJdbcTemplate` 만 (활성 Target 무시) | `pickJdbc(targetCd)` 헬퍼 — live + 폴백 |

## L. Java 클래스 네이밍 충돌

**도출식** (`41b §5.6.0`):
- `<Feature>` = MENU_FILE_PATH 마지막 segment **그대로** (글자수까지 1:1)
- `<feature_dir>` = `LOWER(<Feature>)` — 단일 lowercase 토큰
- 4종: `<Feature>.java` / `<Feature>Controller.java` / `<Feature>Service.java` / `<Feature>Repository.java` (선택)

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CG-L1 | MENU_FILE_PATH `/util/UserInfoMgmt` 인데 Java `UserInfo*.java` 축약 | `UserInfoMgmt*.java` 1:1 | hook H |
| CG-L2 | 디렉토리 `userinfomgmt` 안에 `UserInfo*.java` | 디렉토리 = `userinfomgmt`, 클래스 = `UserInfoMgmt*` | hook H |
| CG-L3 | 디렉토리에 하이픈/언더스코어 | 단일 lowercase concat | hook H |
| CG-L4 | `@Service("xxx")` 명시 빈 이름 | Spring 기본 (첫 글자 lowercase) | hook warn |
| CG-L5 | JSX export ≠ Java 클래스명 | export 명 = Java `<Feature>` = MENU_FILE_PATH 마지막 셋 다 동일 | LLM |
| CG-L6 | `BaseEntity`/`ResponseMessage` 신규 생성 | 공용은 import 만 | LLM |

## M. 사용자 선택 데이터 소스 대체 금지

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CG-M1 | `=== 데이터 소스 ===` 의 테이블을 이름 비슷한 다른 것으로 대체 | 블록에 적힌 그 테이블/SP **만** 사용 | INVARIANTS §②-2 |
| CG-M2 | 운영 코어 테이블에 `CREATE TABLE` 생성 | 기존 테이블 매핑 — CREATE 금지 | hook H + `tableCollisionBlocked` |
| CG-M3 | 테이블 검증을 targetCd 없이 → composer-db 만 → "미존재" 오판 | 세션 `targetCd` 로 운영 DB 질의 | backend |
| CG-M4 | 화면 도메인 ≠ 테이블 도메인이라며 교체 | 도메인 불일치 정상 — 사용자 지정 우선 | LLM |

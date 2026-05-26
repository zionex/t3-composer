# 99. KTNG Anti-patterns (절대 하지 말 것)

> KTNG 작업에서 발생하기 쉬운 실수 카탈로그. Hook 이 차단 가능한 것은 `[H]`, LLM 판단인 것은 `[L]`.

## A. KTNG 네이밍 환각

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| A1 | MENU_CD `UI_BF_<DESCRIPTIVE>` (KTNG 접미 없음) | `UI_BF_KTNG_<NN>` | [H] KN5 |
| A2 | `UI_KTNG_BF_01` (도메인·접미 순서 뒤바뀜) | `UI_BF_KTNG_01` | [H] KN5 |
| A3 | `ui_bf_ktng_01` (소문자) · `UI-BF-KTNG-01` (하이픈) | UPPER_SNAKE | [H] KN5 |
| A4 | Java 패키지 `web.domain.ktng.<...>` | `web.ktng.<도메인>.<카테고리>` | [H] KN1 |
| A5 | JSX 경로 `view/baselineforecast/ktng/<...>` | `view/ktng/baselineforecast/<카테고리>/<feature>/` | [H] KN2 |
| A6 | Java 클래스 `Bf01Controller` (KTNG 누락) | `BfKtng01Controller` | [H] KN3 |
| A7 | JSX 파일 `Bf01.jsx` (KTNG 누락) | `BfKtng01.jsx` | [H] KN4 |
| A8 | SP `SP_KTNG_BF_01_Q1` (UI/COMM prefix 누락) | `SP_UI_BF_KTNG_01_Q1` | [H] S1 |
| A9 | SP `SP_UI_KTNG_01_Q1` (도메인 누락) | `SP_UI_BF_KTNG_01_Q1` | [H] S1 |

## B. Controller 패턴 환각 (Composer/wingui 본가 패턴 오적용)

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| B1 | `JdbcTemplate jdbcTemplate;` 인젝션 | `@Autowired QueryHandler queryHandler;` | [H] KC3 |
| B2 | `@RequestBody Map<...>` 단건 + multipart 저장 | `@RequestBody List<Map<String,Object>> changes` JSON | [H] KC4 |
| B3 | `request.getParameter(ServiceConstants.PARAMETER_KEY_DATA)` + ObjectMapper | `@RequestBody List<Map<...>>` 직접 | [H] KC4 |
| B4 | `@GetMapping("/q1")` 조회용 | `@PostMapping` 일관 | [H] KC2 (warn) |
| B5 | `@ExecPermission` 없는 엔드포인트 | 모든 엔드포인트에 명시 | [H] KC1 (warn) |
| B6 | `@Entity @Table` + `JpaRepository<X, String>` 4종 세트 | Controller + SP 만 (Entity/Repository 없음) | [H] KC5 (warn) |
| B7 | Service 계층 신규 작성 (`@Service @RequiredArgsConstructor`) | Controller 직접 QueryHandler 호출 | [L] |
| B8 | `jdbcTemplate.query("EXEC SP_UI_..." )` | `queryHandler.getList("SP_UI_...", params)` | [H] KC3 |

## C. JSX 표면 (옛 API 사용)

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| C1 | `<BaseGrid columns={...} afterCreate={...}>` | `items={...} afterGridCreate={...}` | [H] JX1 |
| C2 | `grid.setData(rows)` / `grid.getChanges()` / `grid.getChangedData()` | `grid.dataProvider.fillJsonData / getAllStateRows / getJsonRow` | [H] JX2 |
| C3 | `<GridSaveButton grid={gridRef}>` 객체 ref | `grid="grid1"` 문자열 id | [H] JX5 (warn) |
| C4 | `showMessage('confirm', msg, cb)` (type 토큰) | `showMessage(transLangKey('MSG_CONFIRM'), msg, cb)` | [H] JX4 |
| C5 | `<span className="material-icons">search</span>` | `<SearchIcon fontSize="small" />` (MUI import) | [H] JX6 |
| C6 | `useViewStore` 에서 `activeViewId` 추출 | `useContentStore` 에서 | [L] |
| C7 | `useContentStore` 에서 `setViewInfo` 추출 | `useViewStore` 에서 | [L] |
| C8 | gridItems 컴포넌트 안 선언 | 컴포넌트 밖 (매 렌더 재생성 방지) | [L] |
| C9 | 그리드 컬럼 `field:` / `header:` / `textAlign:` | `name:` / `headerText:` / `textAlignment:` | [L] |
| C10 | gridItems 컬럼에 `dataType` 누락 | 모든 컬럼에 `dataType: 'text'|'number'|'datetime'|'boolean'|'group'` | [L] |

## D. zAxios URL ↔ Controller URL 불일치

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| D1 | zAxios `url: '/baselineforecast/master/bfktng01/q1'` + Controller `@PostMapping("/bf/ktng/01/q1")` (어긋남) | 1:1 정확 일치 | [L] |
| D2 | `baseURI()` 누락 → 절대 경로 | `url: baseURI() + '<m>/<feature>/q1'` | [L] |
| D3 | zAxios 가 `method:'get'` | `method:'post'` 일관 | [L] |

## E. SQL / SP 함정

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| E1 | Oracle 함수 `SYSDATE` / `SYS_GUID()` | MSSQL `GETDATE()` / `NEWID()` | [H] S2 |
| E2 | PostgreSQL 함수 `gen_random_uuid()` / `now()::timestamp` | MSSQL T-SQL | [H] S3 |
| E3 | 한글 리터럴 N prefix 누락 (`'사용자 정보'`) | `N'사용자 정보'` | [L] |
| E4 | 조회 SP `ORDER BY` 누락 → 비결정론적 | SORT_ORDER/CODE/NAME/DATE/PK | [H] S4 (warn) |
| E5 | 저장 SP 트랜잭션 없음 | `BEGIN TRY/CATCH` + `BEGIN TRAN/COMMIT/ROLLBACK` | [H] S5 (warn) |
| E6 | TB_AD_MENU 에 `MENU_NM`/`PARENT_MENU_CD`/`URL`/`DEPTH` | 실제 컬럼 7개만 | [H] M1 |
| E7 | TB_AD_LANG_PACK 에 `UPDATE_BY`/`UPDATE_DTTM` | `MODIFY_BY`/`MODIFY_DTTM` | [H] SW1 |
| E8 | PARENT_ID 자리에 MENU_CD 문자열 | `(SELECT ID FROM TB_AD_MENU WHERE MENU_CD='...')` | [H] M2 (warn) |
| E9 | TB_AD_USER 에 `USER_ID`/`USER_NM` | `ID`/`USERNAME`/`DISPLAY_NAME` | [H] SW2 (warn) |
| E10 | TB_UT_USER_INFO 에 `EMAIL`/`PHONE` | `USER_EMAIL`/`USER_TEL` | [H] SW3 (warn) |

## F. Java import / 기술 스택

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| F1 | `import javax.persistence.*` | `import jakarta.persistence.*` | [H] JI1 |
| F2 | `import javax.servlet.*` | `import jakarta.servlet.*` | [H] JI2 |
| F3 | `import javax.validation.*` 또는 `javax.annotation.*` | `import jakarta.*` | [H] JI3 |
| F4 | `System.out.println(...)` | SLF4J Logger | [H] JB1 |
| F5 | `@Autowired` 필드 주입 신규 | `@AllArgsConstructor` + `private final X x;` (단 KTNG 기존 Controller 는 `@Autowired QueryHandler` 패턴 유지) | [H] JB2 (warn) |
| F6 | `ResponseMessage.builder().build()` | `ResponseMessage.ok()/error(msg)` (KTNG 가 사용한다면) | [H] JB3 |
| F7 | `@Value("${app.x.y}")` (default 없음) | `@Value("${app.x.y:}")` | [H] JB4 (warn) |

## G. 권한

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| G1 | `@PreAuthorize` 사용 | `@ExecPermission(menuCd, type)` | [L] |
| G2 | 권한 type 토큰 환각 (`PERMISSION_TYPE_VIEW`) | READ/UPDATE/DELETE/EXECUTE 만 | [L] |
| G3 | 메뉴는 추가했는데 `TB_AD_PERMISSION_GROUP` 미등록 | 형제 메뉴 권한 복사 SQL 함께 | [L] |
| G4 | menuCd 가 실재하지 않는 코드 환각 | TB_AD_MENU 에 등록된 MENU_CD 만 | [L] |

## H. 빠른 판별 가이드 (출력 직전 self-check)

작업 시 다음 순서로 자기 점검:

1. **MENU_CD** 가 `UI_<DOMAIN>_KTNG_<NN>` 정규식 매치?
2. **Java 패키지** 가 `com.zionex.t3series.web.ktng.<...>`?
3. **JSX 경로** 가 `view/ktng/<도메인>/<카테고리>/<feature>/`?
4. **Controller** 가 `@ExecPermission` + `@PostMapping` + `QueryHandler` 패턴?
5. **저장** 이 `@RequestBody List<Map<String,Object>> changes`?
6. **SP** 가 `SP_UI_<DOMAIN>_KTNG_<NN>_<ACTION>` 형식?
7. **zAxios URL** 이 Controller `@PostMapping` 과 1:1?
8. **gridItems** 가 컴포넌트 밖 + 모든 컬럼 `dataType` 명시?
9. **import** 가 모두 `jakarta.*` (javax 없음)?
10. **TB_AD_MENU/LANG_PACK** 컬럼이 실제 컬럼 화이트리스트?

이 10개 중 하나라도 통과 못 하면 출력 정지 후 수정.

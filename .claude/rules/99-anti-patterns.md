---
description: 전역 Anti-patterns. 코드·SQL·설계 어디서든 이 목록을 위반하면 즉시 차단한다. 새로운 안티패턴이 발견되면 이 문서에 추가.
globs:
  - "**/*"
alwaysApply: true
---

# 99. Anti-patterns (절대 하지 말 것)

> 이 목록은 프로젝트 전역에 적용되는 금지 사항 모음. Hook 으로 검증 가능한 것은 `[H]` 표시. LLM 판단이 필요한 것은 `[L]` 표시.

## 0. 경로 컨벤션 — `util/` 표준, `ut/` 절대 금지 ⛔ (가장 빈번한 실수)

> ⚠️ **이 §0 섹션은 T3SERIES wingui 한정** — `com.zionex.t3series.web.domain.util` 패키지 규약.
> PLANNEL 등 다른 Target 은 패키지 구조가 다르므로 자체 overlay 의 99-anti-patterns.md 가 통째 override.
> 차단 Hook 은 공용이 아니라 T3 overlay: `.claude/targets/t3series/hooks/validators/path-convention.sh`.

> **2026-04 두 차례 같은 사고 발생** — Composer / LLM 이 utility 도메인을 `ut/` 로 잘못 생성하여
> 백엔드/프런트 양쪽이 깨짐. 사용자 강력 차단 요청. **모든 utility 관련 산출물은 `util/` 단 하나뿐**.

| 영역 | ✅ 표준 (`util/`) | ❌ 절대 금지 (`ut/`) |
|---|---|---|
| Java 패키지 | `com.zionex.t3series.web.domain.util.userinfo` | `com.zionex.t3series.web.domain.ut.userinfo` |
| Java 디렉토리 | `web/domain/util/<feature>/` | `web/domain/ut/<feature>/` |
| Spring URL | `@RequestMapping("/util/user-infos")` | `@RequestMapping("/ut/user-infos")` |
| zAxios 호출 | `zAxios.get('util/user-infos')` | `zAxios.get('ut/user-infos')` |
| 객체 호출 url | `url: 'util/user-infos/delete'` | `url: 'ut/user-infos/delete'` |
| GridSaveButton | `url="util/user-infos"` | `url="ut/user-infos"` |
| fieldCascade | `optionsUrl: 'util/user-infos/departments'` | `optionsUrl: 'ut/user-infos/departments'` |
| JSX 디렉토리 | `view/util/<lowercase>/` | `view/ut/<lowercase>/` |
| MENU_FILE_PATH | `/util/UserInfoMgmt` | `/ut/UserInfoMgmt` |

**예외 (계속 사용)**: MENU_CD prefix 의 **`UI_UT_*`** (예: `UI_UT_USER_INFO_MGMT`) 는 모듈 도메인 코드의 약어로 별도 컨벤션. URL/패키지 path 의 `ut/` 만 금지.

**Hook 자동 차단** (`.claude/targets/t3series/hooks/validators/path-convention.sh` — T3 overlay):
- `package com.zionex.t3series.web.domain.ut.` → block
- `import com.zionex.t3series.web.domain.ut.` → block
- `@RequestMapping("/ut/...")` → block
- `zAxios.get('ut/...')` / `url: 'ut/...'` / `url="ut/..."` → block
- `optionsUrl: 'ut/...'` → block
- 파일 경로가 `view/ut/` 또는 `web/domain/ut/` → block

**LLM 자기 검증** (출력 직전):
- [ ] 모든 zAxios 호출 첫 인자가 `util/` 로 시작하는가?
- [ ] 모든 `@RequestMapping` 이 `/util/` 로 시작하는가? (utility 도메인 한정)
- [ ] Java 패키지가 `com.zionex.t3series.web.domain.util.*` 인가?
- [ ] PopDepartment / PopPosition 호출 endpoint 가 `util/user-infos/...` 인가?

**근본 원칙**: `ut` 는 utility 의 약어가 아니라 **잘못된 축약**. 이 프로젝트의 utility 도메인은 모든 표면(패키지·URL·디렉토리·MENU_FILE_PATH) 에서 `util/` 로 통일되어 있으며, 한 자리도 짧게 줄이지 않는다.

| # | 안티패턴 | 검증 |
|---|---|---|
| PATH-1 | Java 패키지/디렉토리에 `domain/ut/` 또는 `domain.ut.` 사용 | [H] hook block |
| PATH-2 | URL/zAxios/prop 에 `ut/` 시작 literal 사용 | [H] hook block |
| PATH-3 | 다른 화면이 호출 중인 `util/...` endpoint 를 `ut/...` 로 변경 (역방향 변경 금지 — 항상 `util/` 로 통일) | [L] |
| PATH-4 | `web/domain/util/<feature>/` 와 `web/domain/ut/<feature>/` 가 동시 존재 (Spring `Ambiguous mapping` 빌드 실패) | [H] startup block |

## 1. 온톨로지

| # | 안티패턴 | 왜? | 검증 |
|---|---|---|---|
| O1 | 테이블명·SP명에서 비즈니스 의미 역추측 | "TB_FP_DEMAND 있으니 수요 질의는 여기" → 업무 컨텍스트 누락 | [L] |
| O2 | LLM 에 674개 테이블 DDL **덤프** | 컨텍스트 낭비 + 품질 저하. 온톨로지가 선별한 엔티티만 사용 | [L] |
| O3 | `status='DRAFT'` 값으로 사용자 답변 | 초안 상태 → 잘못된 정보 전달 위험 | [H] grep |
| O4 | `db_type` 필터 없이 Q&A 캐시 사용 | MSSQL 답변을 PostgreSQL 에 사용 시 구문 오류 | [H] SQL AST |
| O5 | LLM 추론본(`llm_*`)과 사용자 편집본 동시 병합 | 두 버전 동시 사용 시 모순 발생 | [L] |
| O6 | Entity `MERGED`/`DEPRECATED` 를 `duplicate_of` 추적 없이 사용 | 중복 답변, 구 엔티티 반복 사용 | [L] |
| O7 | Entity Relation `weight` 무시 (모든 관계 동등 취급) | 노이즈 많은 답변. `weight >= 0.5` 권장 | [H] grep |

## 2. React · 화면 (wingui)

| # | 안티패턴 | 왜? | 검증 |
|---|---|---|---|
| R1 | `ContentInner` 없이 화면 작성 | 레이아웃 깨짐, flex 처리 누락 | [H] AST |
| R2 | 글로벌 버튼을 로컬 JSX 에 직접 렌더 | 프레임워크 상단 바 미사용. `setViewInfo` 로 위임 필수 | [H] grep |
| R3 | `gridItems` 를 컴포넌트 내부에 선언 | 매 렌더마다 재생성 → 그리드 초기화 반복 | [H] AST |
| R4 | `BaseGrid.afterCreate` 전에 그리드 객체 접근 | undefined 에러. `null` 가드 필수 | [L] |
| R5 | CRUD 가 아닌 분석 화면에 `GridAddRowButton` 노출 | UX 혼란, 읽기전용 리포트에 편집 UI 노출 | [L] |
| R6 | `sample` 폴더 코드를 그대로 프로덕션 복사 | `setViewInfo`·AI 프로바이더 등록 누락됨 | [H] path |
| R7 | 파일 경로가 `view/<module>/<category>/<n>/<N>.jsx` 규약 위반 | 라우트 자동 매핑 실패 | [H] path |
| R8 | 공통 팝업 대신 자체 다이얼로그 작성 | `PopSelectItem`, `PopSelectAccount` 등 공용 팝업 재사용 | [L] |
| R9 | `t(...)` 다국어 함수 미적용 한글 하드코딩 | ko/en/ja/zh 지원 실패 | [H] grep 한글문자열 |
| R10 | `<span className="material-icons">search</span>` 등 폰트 기반 아이콘 텍스트 사용 | Material Icons 폰트 로드 안 되면 'search' 텍스트가 그대로 표시. 표준은 `import SearchIcon from '@mui/icons-material/Search'` + `<SearchIcon fontSize="small" />` | [H] hook |
| R11 | `<GridCnt grid="...">` 사용 시 `format` prop 누락 | 라벨 없이 카운트 숫자만 단독 노출 (예: "2") — 표준은 `format={"{0} " + transLangKey("CASES") + " " + transLangKey("MSG_0010")}` + `import { transLangKey } from '@zionex/wingui-core'` | [H] hook |

## 3. SQL · SP · Function

| # | 안티패턴 | 왜? | 검증 |
|---|---|---|---|
| S1 | 자유 SP 네이밍 (`SP_NEW_QUERY` 등) | `SP_UI_<DOMAIN>_<NO>_<ACTION>` 규약 위반 | [H] 정규식 |
| S2 | 소문자·동사형 SP 네이밍 (`sp_select_items`) | 시스템 SP 와 충돌 (`sp_helpdiagrams` 등) | [H] 정규식 |
| S3 | MSSQL 만 작성 후 Oracle 생략 | 듀얼 DB 지원 실패 | [H] 파일쌍 확인 |
| S4 | `SP_COMM_RAISE_ERR` 미사용 에러 처리 | 오류 메시지 비일관 | [H] grep |
| S5 | 시스템 SP (`sp_helpdiagrams` 등) 수정 | MS 제공, 수정 금지 | [H] 파일명 |
| S6 | 트랜잭션 커밋/롤백 누락 (배치 SP) | 부분 실패 시 데이터 불일치 | [L] |
| S7 | `PLAN_SCOPE` 필터 누락 | 멀티 테넌트 데이터 섞임 | [L] |
| S8 | 674개 테이블 DDL 변경 없이 직접 `CREATE TABLE` | `t3series-database/{mssql,oracle}/upgrade/vX.Y.Z-YYYYMMDD/` 미경유 | [H] path |
| S9 | **SQL 작성 전 실제 스키마 미확인 → 허구 컬럼 생성** (예: TB_AD_MENU 의 `MENU_NM`/`PARENT_MENU_CD`/`URL`/`DEPTH`/`SORT_ORDER`) | Entity 파일 / `docs/reference/tables-catalog.md` 선행 검증 필수. Hook 이 차단 (`rules/32-sql-schema-verification.md`) | [H] hook |
| S10 | TB_AD_LANG_PACK 에 `UPDATE_BY`/`UPDATE_DTTM` 사용 | 실제 컬럼은 `MODIFY_BY`/`MODIFY_DTTM` | [H] hook |
| S11 | TB_AD_MENU.PARENT_ID 자리에 MENU_CD 값을 직접 INSERT | UUID 서브쿼리 `(SELECT ID FROM TB_AD_MENU WHERE MENU_CD='...')` 사용 | [L] |
| S12 | 조회 SP 에 `ORDER BY` 생략 | 실행마다 순서 달라져 그리드 UX 불안정. SORT_ORDER/CODE/NAME/DATE/PK 순위로 결정론적 정렬 (`rules/31-stored-procedures.md §9`) | [L] |
| S13 | `ORDER BY` 에 PK tie-breaker 누락 (예: `ORDER BY LOCAT_TP_CD` 만) | 동일 값 다수 시 비결정론적. 마지막에 PK 컬럼 추가 필수 | [L] |
| S14 | 시계열/트랜잭션 조회에 `ORDER BY <일자> ASC` (최신 우선이 맞는 상황) | 로그·트랜잭션은 `DESC`, 마스터·차트 X축은 `ASC`. 유형별 기본값은 `rules/31-stored-procedures.md §9.2` 참조 | [L] |
| **S15** | **TB_UT_USER_INFO 에 `EMAIL`/`PHONE`/`ID` 컬럼 사용** (실제는 `USER_EMAIL`/`USER_TEL`/`USER_ID`) | 두 폴더에 다른 버전 DDL 이 있을 때 오래된 것만 보고 SP 작성 — Entity (`UserInfo.java`) 가 1순위 진실. Hook (`sql-schema-whitelist.sh`) 차단 | [H] hook |
| **S16** | **여러 버전의 같은 테이블 DDL 존재 시 임의 1개 선택** | 폴더명 (`vX.Y.Z-YYYYMMDD`) 의 날짜 가장 큰 것 + Entity 비교가 진실. `rules/32 §0.1 진실 우선순위` | [L] |
| **S17** | **신규 SP 작성 시 같은 SP 의 기존 버전 (`find -name "<SP>.sql"`) 미확인** | 기존 SP 의 SELECT/INSERT 컬럼이 곧 검증된 컬럼 — 그대로 따라가기. `rules/32 §0.3 STEP 2` | [L] |

## 4. Java · Spring

| # | 안티패턴 | 왜? | 검증 |
|---|---|---|---|
| J1 | 루트 `pom.xml` BOM 우회, 모듈 POM 에 버전 직접 명시 | 버전 불일치, 갱신 누락 | [H] XML AST |
| J2 | `System.out.println` 사용 | SLF4J 로거 필수 | [H] grep |
| J3 | Magic number 사용 | 상수 추출 필요 (PMD/Checkstyle 차단) | [H] PMD |
| J4 | `@SuppressWarnings` 남용 | PMD 차단 우회 | [H] grep 횟수 |
| J5 | `@Autowired` 필드 주입 | 생성자 주입 권장 (Spring Boot 3.x 관례) | [H] AST |
| J6 | QueryDSL 없이 JPQL 문자열 직접 조립 | 컴파일 타임 검증 실패 | [L] |
| J7 | `wingui` 가 아닌 모듈에 `spring-boot-starter-security` 추가 | Security 는 `wingui` **독점** | [H] POM |
| **J8** | **`ResponseMessage.builder()` / `ResponseMessage.ok()` / `error()` / `of()` / `ofSuccess()` / `ofFail()` 호출** | wingui 본 환경의 `ResponseMessage` 는 Lombok `@Builder` 도 없고 **정적 팩토리도 없다** — `(int status, String message)` 생성자가 유일한 공식 API. 정적 팩토리·builder 호출 시 **컴파일 실패로 wingui 전체 기동 안 됨 → 모든 endpoint 500**. (단독 환경 `ResponseMessage.java` 의 `ok/error/ofSuccess/ofFail` 별칭은 [화면 실행] 호환 안전망일 뿐 산출물에 의존 금지 — sync 후 깨진다.) 표준 패턴: `new ResponseMessage(HttpStatus.OK.value(), "saved")` · `new ResponseMessage(HttpStatus.BAD_REQUEST.value(), "changes missing")` · `new ResponseMessage(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage())`. 정의: `web/util/data/ResponseMessage.java`. Hook 자동 차단 | [H] hook |
| **J9** | **사용자 정의 `@Value("${app.x.y}")` 에 default 누락** | Spring Boot 3.x 의 PropertyPlaceholderHelper 는 YAML 의 빈 값 (`x.y:` 콜론만) 을 placeholder 미해결로 처리 → `IllegalArgumentException: Could not resolve placeholder` → **startup 실패 (모든 endpoint 500)**. 해결: `@Value("${app.x.y:}")` 형식으로 default 빈 문자열 추가. 자동 키 (`server.port` 등) 는 예외. Hook 자동 차단 | [H] hook |
| **J10** | **Java 클래스명 ↔ 디렉토리 ↔ MENU_FILE_PATH 마지막 segment 불일치** (LLM 축약 환각). 예: MENU_FILE_PATH `/util/UserInfoMgmt` 인데 Java 만 `UserInfo*.java` 로 단축. 결과: 다른 메뉴 (`UserInfoView`, `UserInfoDetail` 등) 도 같은 `UserInfo*.java` 환각 → ① Spring Bean 이름 충돌 (`ConflictingBeanDefinitionException`) → backend startup 실패 ② wingui sync 시 silent overwrite ③ JSX-Java 일관성 깨짐. **모든 신규 화면 모드 (NEW_GENERAL/NL/STEP/FROM_COPY/FROM_DESIGN) 적용**. 상세: `rules/41b §5.6.0` + `99a §L CG-L1~L6`. Hook 자동 차단 | [H] hook (`java-class-naming.sh`) |

## 5. 기술 스택 · 라이브러리

| # | 안티패턴 | 왜? | 검증 |
|---|---|---|---|
| T1 | Java 17 이외 버전 사용 | 전 모듈 Java 17 고정 | [H] |
| T2 | `wingui` 가 아닌 모듈에 POI 4.1.2 사용 | POI 4.1.2 는 `wingui` 만. 나머지는 3.15 | [H] POM |
| T3 | Spring Boot 3.0.13 이외 버전 | 전 모듈 parent 고정 | [H] POM |
| T4 | `dpserver` 에 PostgreSQL/EDB 드라이버 추가 | dpserver 는 MSSQL+Oracle 만 | [H] POM |
| T5 | `mp` 모듈에 Spring Boot Starter 추가 | 순수 Swing 라이브러리, Spring 의존 없음 | [H] POM |
| T6 | Webpack heap 16GB 미설정 | `wingui` 프론트 빌드 실패 | [H] 빌드 스크립트 |

## 6. 보안 · 프라이버시

| # | 안티패턴 | 왜? | 검증 |
|---|---|---|---|
| SE1 | 평문 비밀번호를 `application.yaml` 에 기록 | Jasypt 로 암호화 필수 | [H] grep |
| SE2 | JWT 시크릿을 소스에 하드코딩 | 환경변수 또는 `.env` 필수 | [H] grep |
| SE3 | API 엔드포인트에 `@PreAuthorize` 미적용 | Spring Security 권한 체크 누락 | [L] |
| SE4 | SQL Injection 취약점 (문자열 연결 쿼리) | QueryDSL / PreparedStatement 필수 | [H] SpotBugs |
| SE5 | 로그에 개인정보·비밀번호 출력 | GDPR/개인정보보호법 위반 | [L] |

## 7. Git · 협업

| # | 안티패턴 | 왜? | 검증 |
|---|---|---|---|
| G1 | `_tmp_*.txt`, `*.bak`, IDE 설정 커밋 | `.gitignore` 필수 | [H] pre-commit |
| G2 | 커밋 메시지에 `<type>(<scope>): <subject>` 미준수 | 변경 이력 추적 어려움 | [H] commit-msg hook |
| G3 | 업그레이드 스크립트에 날짜 스탬프 누락 | `vX.Y.Z-YYYYMMDD` 누락 시 순서 관리 불가 | [H] 폴더명 |

## 8. Composer · Pattern · Dictionary (상세: `rules/40-composer-patterns.md`)

| # | 안티패턴 | 왜? | 검증 |
|---|---|---|---|
| CP1 | PatternPreview 렌더러에 styled / 복잡한 inline sx 중복 블록 | 공용 helper(CBWrap/CBHead/CBCard/CBTable 등) 재사용 원칙 위반 | [L] |
| CP2 | 렌더러에 `fontSize: 13+` 사용 | 400×260 캔버스 대비 과대, scale transform 시 깨짐 | [H] regex |
| CP3 | 렌더러에 컬러 hex 직접 하드코딩 (`#3b82f6` 등) | `DC.*` 팔레트 일관성 위반 | [H] regex |
| CP4 | `LAYOUT_*` 코드는 있으나 라벨에 숫자 prefix(`11 `, `91 ` 등) 누락 | 정렬 규약 위반 — dropdown/pill 섞임 | [H] regex on label |
| CP5 | KPI `CODE` 중복 또는 `SORT_ORDER` 겹침 | 사전 조회 정합성 파괴 (같은 KPI 이중 노출) | [L] |
| CP6 | `TB_AD_LANG_PACK` UPDATE 시 `UPDATE_BY`/`UPDATE_DTTM` 컬럼 사용 | 스키마에 없음 — 실제 컬럼은 `MODIFY_BY`/`MODIFY_DTTM` | [H] regex |
| CP7 | Tooltip preview 를 transform scale 없이 width 만 키움 | 고정 px fontSize 가 컨테이너 크기와 무관 → 글자 작게 남음 | [L] |
| CP8 | 렌더러 키 네이밍 접두어(`cb_/pe_/mn_/rl_`) 위반 | 카테고리 ↔ 코드 매칭 깨짐, 검색/필터 실패 | [H] regex |
| CP9 | Composer DDL/Seed 변경 시 `upgrade/vX.Y.Z/` 폴더 우회 | 버전 순서 관리 실패 | [H] path |
| CP10 | 화면 패턴 관리 초기 진입 시 `catFilter='ALL'` | 200+ PatternPreview 동시 렌더 → INP 급증 · 초기 화면 지연 | [L] |
| CP11 | LangPack 수정만 하고 `/system/lang-packs/{lang}/reload` 또는 서버 재시작 미수행 | LangPackService 가 서버 시작 시 캐싱 — DB 만 바꾸면 UI 반영 안됨 | [L] |

## 9. FilterBar · 조회 조건 (상세: `rules/22-filter-bar.md`)

| # | 안티패턴 | 왜? | 검증 |
|---|---|---|---|
| FB1 | `.claude/schemas/filter-bar.schema.json` 에 없는 속성을 JSON 에 추가 | 런타임/편집기가 스키마 외 속성을 무시 → silent fail. 스키마 먼저 수정 PR | [H] jsonschema |
| FB2 | SCM 도메인 필드를 `DROPDOWN` 으로 직접 구현 | PlanScope/Item/Account 등은 반드시 `DOMAIN_*` 타입 (내부 캐시·팝업 통합) | [H] regex on type |
| FB3 | `DATE_RANGE` / `DOMAIN_PLAN_SCOPE` / `DOMAIN_VERSION` 에 `flatten` 누락 | SP 는 스칼라 파라미터를 받음 → `dateFrom/dateTo`, `planCd/mainVerCd/simulVerCd` 로 분해 필수 | [H] jsonschema |
| FB4 | `data_type: array` 필드에 `delimiter_for_sp` 미지정 | `FN_SPLIT_NVARCHAR_TO_TABLE` 이 쉼표 기준 → `,` 권장. 누락 시 SP 파라미터 파싱 실패 | [H] jsonschema |
| FB5 | `include_all.enabled: true` 인데 `transform_when_all` 미지정 | "ALL" 문자열이 SP 로 전달되어 `WHERE = 'ALL'` 로 필터 실패. 기본 `send_null` 사용 | [H] jsonschema |
| FB6 | `block_id` 대문자/카멜 사용 (`FilterMain`) | 규약은 snake_case. 스키마·편집기가 강제 | [H] regex |
| FB7 | `field_id` 카멜/소문자 사용 (`itemCd`) | DB 컬럼·SP 파라미터 관례와 맞춰 UPPER_SNAKE | [H] regex |
| FB8 | `output_variable.name` 스네이크/대문자 사용 | JS 관례 camelCase 로 통일 — 참조 시 `@form.<form_id>.<camel>` | [H] regex |
| FB9 | 한글 라벨을 `label` 에 하드코딩 | i18n 깨짐. `label_i18n_key` + `TB_AD_LANG_PACK` 등록 필수 | [L] |
| FB10 | 계층 드롭다운에 `dependencies` 없이 옵션 정적 고정 | 상위 값 변경 시 하위 옵션이 갱신되지 않음. `reload_options` + `pass_params` + `also_clear: true` | [L] |
| FB11 | 옵션 SP 에 `cache.ttl_seconds` 없음 (공통코드 등 고정 데이터) | 매 렌더마다 SP 호출 → 성능 저하. `SP_COMM_SRH_*` 는 30분~1시간 캐시 권장 | [L] |
| FB12 | 맨땅에서 FilterBar JSON 작성 (샘플 미참조) | `.claude/schemas/examples/sample-{dp-monthly|common-code}.json` 부터 복사해서 수정 | [L] |
| FB13 | 다른 블록에서 FilterBar 값을 직접 SP 파라미터에 하드코딩 | `@form.<form_id>.<name>` 로 참조 → FilterBar 변경 시 자동 반영 | [L] |
| FB14 | `null_when_empty: false` 가 기본인 양 사용 | SP 의 `IS NULL OR` 패턴 호환을 위해 대부분 `true` 권장. 빈 문자열 전달은 지양 | [L] |
| FB15 | 여러 화면에 같은 FilterBar JSON 복붙 | 공통 FilterBar 는 `view/common/filters/` 템플릿화 | [L] |

## 9-1. Composer 화면 생성 (분리됨)

> Composer 안티패턴 카테고리 7종 (CG-A 참조방식 · CG-B MENU_CD 네이밍 · CG-C JSX 표면 API · CG-D 서버 통신 · CG-E Master/공통코드/Cascade · CG-F Wizard 통합 · **CG-G 아티팩트 파일경로 환각** — 2026-04-29 추가) 은 **`99a-composer-anti-patterns.md`** 로 분리.
>
> 전체 규약은 `41-composer-generation.md` (메인) + 4개 sub 파일 (41a/41b/41c/41d) 참조.

## 10. 부록 — 빠른 판별 가이드

### 코드 작성 시 이것부터 물어보기
1. 이 작업은 **온톨로지 참조가 필요한가?** → Yes → 5-Step 절차 (`rules/10-ontology-first.md`)
2. 이 작업은 **신규 화면 개발인가?** → Yes → 체크리스트 (`rules/20-screen-development.md`)
3. 이 작업은 **DB 스키마 변경인가?** → Yes → `upgrade/vX.Y.Z-YYYYMMDD/` 폴더 + 양쪽 방언
4. 이 작업은 **SP 작성인가?** → Yes → 네이밍 정규식 + MSSQL/Oracle 양쪽
5. 이 작업은 **의존성 추가인가?** → Yes → 루트 BOM 확인 + 모듈별 매트릭스 확인
6. 이 작업은 **Composer 패턴/사전/렌더러 작성인가?** → Yes → `rules/40-composer-patterns.md` + §8 안티패턴 확인
7. 이 작업은 **FilterBar(조회 조건) JSON 작성인가?** → Yes → `rules/22-filter-bar.md` + 샘플 복사부터. DOMAIN_* 타입 / flatten / delimiter_for_sp 필수 체크
8. 이 작업은 **SQL 쿼리 작성(INSERT/UPDATE/SELECT)인가?** → Yes → `rules/32-sql-schema-verification.md` — **Entity 파일로 실제 컬럼 확인 후** 작성. Hook 이 허구 컬럼 차단.
9. 이 작업은 **Composer 로 화면 생성/수정인가?** → Yes → `rules/41-composer-generation.md` (메인) + sub 4개 (41a JSX · 41b Java · 41c 위젯 · 41d Wizard).
   - 핵심: 유사 원본 Read 우선 · wingui 단독 구동 · JPA+RestController · `UI_<DOMAIN>_<NAME>` MENU_CD · `/<module>[/<category>]/<PascalCase>` MENU_FILE_PATH · BaseGrid `items/afterGridCreate` · grid `="<id>"` · 신규 화면 SP/엔진 XML 금지. Hook + ArtifactApplyService 자동 검증.
   - 안티패턴 상세: `rules/99a-composer-anti-patterns.md`
10. 이 작업은 **기존 메뉴와 코드만 다른 V2 메뉴 추가인가?** → Yes → MENU_CD 의 `_V2` distinction 은 **메뉴 코드 한정**. JSX zAxios URL · Controller `@RequestMapping` · Service · Entity · Table · SP 어디에도 v-접미어 전파 금지. 백엔드는 단일 자원 공유가 기본. (`rules/41a §4.5.1` · `rules/99a §I` · hook `CG-URL-VSFX`)

### "모르면 하지 말 것"
- 테이블 컬럼 의미를 모를 때 추측으로 `COL_A` 같은 이름 사용 → 금지
- SP 의 부작용(트리거, 커밋 시점)을 모를 때 프로덕션 실행 → 금지
- 온톨로지 `status` 를 확인하지 않고 답변 생성 → 금지
- 기존 PatternPreview helper 를 찾아보지 않고 유사 컴포넌트 새로 작성 → 금지
- FilterBar JSON 스키마에 없는 속성을 마음대로 추가 → 금지 (먼저 스키마 PR)
- **V2 메뉴라서 백엔드 URL 도 v2 일 거라고 가정** → 금지. zAxios URL 은 항상 Controller `@RequestMapping` 을 따른다 (V-접미어 환각, 2026-04-30 사고)

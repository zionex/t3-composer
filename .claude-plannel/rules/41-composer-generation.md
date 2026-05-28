# 41. Composer 화면 생성 규칙 (Screen Generation Contract)

> 모든 모드 (`new_general` · `new_nl` · `new_step` · `new_from_design` · `new_from_copy` · `existing_modify`) 공통 단일 계약서.
> 새 prefix/URL/래퍼/관례 생성 금지. 기존 화면과 **동일한 방식**으로.
>
> **3단계 강제 체계**:
> 1. LLM: `ComposerPromptBuilder.INVARIANTS`
> 2. 저장: `pre-tool-use-validator.sh`
> 3. 적용: `ArtifactApplyService.checkWinguiNativePolicy`

## Sub-rule 목차

| 파일 | 다루는 섹션 |
|---|---|
| 41-composer-generation.md (이 문서) | 핵심 원칙 + 런타임 + MENU_CD/PATH + 체크리스트 |
| 41a-composer-jsx.md | JSX 표준 (Imports / BaseGrid / 컬럼 / zAxios / store) |
| 41b-composer-java.md | Java 백엔드 (jakarta · BaseEntity · JdbcTemplate SP) |
| 41c-composer-widgets.md | 위젯 · Cascade · POPUP · 공통코드 |
| 41d-composer-wizard.md | 9-Step Wizard · 세션 상태 전이 |
| 30/31/32 | DB 스키마 · SP · SQL 사전 검증 |
| 99 / 99a | 안티패턴 (전체 / Composer 한정) |

---

## §0. 유사 화면 참조 (필수 첫 단계)

### §0.1 기본 원칙 — "복제 + 치환" 이지 "재구성" 이 아니다

신규 화면은 원본을 **기계적 복제 → 네이밍만 치환**. LLM 이 "더 좋은 레이아웃" 을 상상해 새 wrapper/prop 을 추가 금지. 유지보수자가 원본과 복사본을 같은 사람이 만든 것으로 느껴야 함.

작업 시작 전 **반드시** 유사 원본 2~3개 Read 후 출력 맨 앞에:
```
참조 원본: <Original.jsx>, <OriginalService.java>, ...
원본 import 리스트 (그대로 유지): @wingui/common/imports 의 X, Y, Z
치환 매핑: UserInfoMgmt → <New>, user-infos → <new-url>, userInfoGrid → <newGridId>
원본에 없는 새 컴포넌트·wrapper·prop 추가 예정: 없음
```

### §0.2 표준 원본

**JSX 패턴 참조 (트랙 A)** — 원본의 layout/cascade/popup/검색폼 패턴을 가져옴:
- 마스터 CRUD: 운영 화면 (예: `view/system/usermgmt/users/Users.jsx`)
- 검색+cascade: `view/baselineforecast/master/actualsales/ActualSales.jsx`
- 컨트롤보드: `view/baselineforecast/version/controlboard/ControlBoard.jsx`
- 팝업: `view/common/PopSelectItem.jsx`

**데이터 호출 변환 (트랙 C)** — 원본이 무엇이든 신규는 항상:
| 원본 | 신규 |
|---|---|
| `zAxios.get('<url>')` + JpaRepository | `zAxios.get('<NEW_url>')` + Service.JdbcTemplate(`EXEC SP_UI_<NEW>_Q1`) |
| `callService('SRV_GET_SP_UI_<NO>_Q1', ...)` | `zAxios.get('<NEW_url>')` + JdbcTemplate(`EXEC SP_UI_<NEW>_Q1`) |

원본 callService 는 신규에서 제거. wingui 단독 구동.

### §0.3 NEW_FROM_COPY 복제 7-Step

1. 계획 선언 (§0.1 4줄 블록)
2. JSX 복제 — 원본 import 그대로. gridItems 각 컬럼에 `fieldName` 필수, `textAlignment` (textAlign X)
3. Entity 복제 — 기존 테이블 재사용이면 원본 Entity 의 모든 `@Column` 복사 후 클래스명만 교체
4. 산출물 — JSX + MENU_SQL 만. DDL · Java 4종 세트 생성 금지 (기존 Controller URL 재사용)
5. 메뉴 SQL — TB_AD_MENU + TB_AD_LANG_PACK(4언어) + TB_AD_PERMISSION_GROUP 형제 메뉴 복사
6. 자기 대조 — §12.1 NEW_FROM_COPY 체크리스트
7. 변경 반영 — 사용자 '요구사항' 에 명시된 것만

### §0.4 금지

- 유사 원본 읽지 않고 바로 작성
- 원본과 다른 파일 구조/import/네이밍
- 원본에 없는 wrapper 추가 (`SplitPanel` / `GroupBox` / `FormArea` 등 임의 도입)
- 허구 prop 이름 (`initialSizes` · `minSizes` · `textAlign` 등)
- Entity 에 실제 테이블에 없는 컬럼 추가
- `===FILE:` 헤더 path 의 확장자를 underscore (`_sql` 등) — 정규 확장자는 dot (`.sql`)

`§0.6` 레이아웃 변경 prop 명세 → `41a-composer-jsx.md`.

---

## §1. 런타임 구조

> ★ Target 런타임 환경 패리티 — 산출물이 [화면 실행] 미리보기에서 동작하려면 `rules/50 §13.0` 따름. 미리보기 환경(shim·registry·ambient·store) = Target(wingui) 표면의 superset.

### §1.1 wingui 단독 구동 + SP 기반 CRUD
- 외부 엔진 (mp/dp/bf/fp server) 기동 없이 동작
- 신규 화면 SP 기반 CRUD 필수 — `SP_UI_<DOMAIN>_<NO>_<ACTION>` (Q1/S1/D1) + RestController 가 JdbcTemplate 으로 SP 호출
- `callService` + 엔진 XML 은 BF/DP/MP/FP **계산 화면 수정** 전용

### §1.1.1 NEW_FROM_COPY 예외 — JSX-only 복제 허용

기존 endpoint 재사용 케이스가 자연스러움:
- JSX-only 복제 (기존 endpoint 재사용) → ✅ apply 허용 (백엔드 4종 누락 OK)
- 새 SCREEN_NO 의 SP 필요한 복제 → Composer 가 함께 생성 권장

다른 신규 모드 (NEW_GENERAL/NL/STEP/FROM_DESIGN) 는 SP_UI_*.sql 필수.

### §1.2 메뉴 트리 + 라우팅

- 프로덕션 = DB `TB_AD_MENU` + `TB_AD_LANG_PACK`. develop = `data/menus.js`.
- 라우팅 자동 변환: `filepath = view.filePath.toLowerCase() + view.filePath.slice(lastIndexOf('/'))`
- 별도 라우트 코드 불필요.

---

## §2. MENU_CD / MENU_FILE_PATH / MENU_PATH

### §2.1 MENU_CD
```
UI_<DOMAIN>_<SCREEN_NAME>
정규식: ^UI_(AD|BF|CM|DP|DPD|FO|FP|IM|MP|RP|SA|SALES|SO|UT)_[A-Z][A-Z0-9_]*$
```
그룹 노드 `MENU_<DOMAIN>` 은 Composer 신규 생성 금지.

### §2.2 MENU_FILE_PATH
```
/<module>[/<category>]/<PascalComponentName>
```
- 마지막 직전 segment ≠ `lowercase(마지막)` (자동 추가 폴더 이중화 금지)
- `.jsx` 확장자 금지

| 예 | 결과 JSX |
|---|---|
| `/util/UserInfoMgmt` | `view/util/userinfomgmt/UserInfoMgmt.jsx` |
| ❌ `/util/userinfomgmt/UserInfoMgmt` | 이중화 → `view/util/userinfomgmt/userinfomgmt/UserInfoMgmt.jsx` (없음) |

### §2.3 MENU_PATH = `LOWER(MENU_FILE_PATH)` — URL slug. 한 URL = 한 MENU_CD (1:1).

---

## §3. 부모 메뉴 코드 (PARENT_MENU_CD)

| 모듈 | parent |
|---|---|
| util | `MENU_UTIL` (❌ `MENU_UT` 아님) |
| demandplan / masterplan / factoryplan / baselineforecast | `MENU_DP` / `MENU_MP` / `MENU_FP` / `MENU_BF` |
| inventory / replenishmentplan / sales | `MENU_IM` / `MENU_RP` / `MENU_SA` |
| system | `MENU_AD` |

---

## §4~§9 — 분리됨

| 섹션 | 파일 |
|---|---|
| §4 JSX 표준 + §0.6 레이아웃 prop | `41a-composer-jsx.md` |
| §5 Java 백엔드 · DDL/SP 정책 | `41b-composer-java.md` |
| §6~§9 위젯/Cascade/POPUP/CommonCode | `41c-composer-widgets.md` |

---

## §10. MENU_SQL — 표준 컬럼만 사용

`TB_AD_MENU` 실제 컬럼: `ID · PARENT_ID · MENU_CD · MENU_PATH · MENU_SEQ · MENU_FILE_PATH · USE_YN` + BaseEntity.
❌ 존재 안 함: `MENU_NM · PARENT_MENU_CD · URL · DEPTH · SORT_ORDER`.

`TB_AD_LANG_PACK` audit: `MODIFY_BY · MODIFY_DTTM` (❌ `UPDATE_BY` 아님).

ID 생성 `LOWER(REPLACE(NEWID(), '-', ''))`. parent lookup `(SELECT ID FROM TB_AD_MENU WHERE MENU_CD='MENU_<DOMAIN>')`. WHERE NOT EXISTS 패턴 (멱등).

ko/en/ja/zh 4언어 INSERT + 형제 메뉴 권한 복사 (TB_AD_PERMISSION_GROUP) 필수. 전체 템플릿 → `30-database-schema.md §5`.

---

## §11. 그리드 정렬 / 편집기 / 날짜 포맷

상세 → `41a §4.3` · `21 §4`.

핵심:
- 정렬: LEFT (이름·자유텍스트) · CENTER (코드·날짜·boolean·enum) · `'far'` (숫자)
- editable:true 컬럼 — 의미별 editor 필수 (number → `editor:{type:'number'}` + numberFormat; enum → useDropdown+lookupDisplay+values+labels; date → `editor:{type:'date'}`)
- 단일 일자 `yyyy-MM-dd` · 일시 `yyyy-MM-dd HH:mm:ss`
- 기간 선택 `<InputField type="dateRange" displayType="date">`

---

## §12. 작업 산출물 체크리스트

### §12.1 파일

**공통 (모든 케이스)**
- [ ] JSX: `<wingui-root>/src/view/<module>/<lowercase>/<PascalCase>.jsx`
- [ ] MENU_SQL (TB_AD_MENU + LANG_PACK + PERMISSION_GROUP)
- [ ] SP_UI_*.sql DDL (CRUD 액션마다 · MSSQL only · 조회 SP `ORDER BY` 결정론적)
- [ ] RestController + Service (JdbcTemplate + EXEC SP_UI_*)
- [ ] JPA Entity (스키마 매핑)

**NEW_FROM_DESIGN / NEW_FROM_COPY / NEW_STEP** — 기존 테이블 재사용:
- [ ] 새 테이블 DDL **생성 금지** (`41b §5.1` C 차단)
- [ ] Entity 기존 것 재사용 · 새 SP 는 모든 모드에서 생성 가능

**NEW_NL / NEW_GENERAL** — 자유 도메인 (새 테이블 DDL 허용):
- [ ] 명확히 필요한 경우 DDL + SP_UI_* + RestController 함께
- [ ] 테이블 DDL: `t3series-database/mssql/upgrade/vX.Y.Z-YYYYMMDD/tables/`

### §12.2 신규 화면에 **불필요** (생성 금지)
- ❌ `config/<DOMAIN>/UI_*_service.xml` 엔진 XML
- ❌ 외부 엔진 서버 기동 의존
- ❌ `callService(...)` 엔진 경유

### §12.3 출력 직전 자체 검증
- [ ] 맨 앞에 `참조 원본:` 명시
- [ ] MENU_CD = `UI_<DOMAIN>_<NAME>` · MENU_FILE_PATH 단일/카테고리 segment · MENU_PATH = LOWER
- [ ] BaseGrid: `items={...} afterGridCreate={...} id="<str>"` (`41a §4.2`)
- [ ] 모든 그리드 컬럼에 `dataType` 명시 — 누락 시 즉시 크래시
- [ ] Store 매핑 — `activeViewId` ← `useContentStore` · `setViewInfo` ← `useViewStore`
- [ ] 그리드 버튼 `grid="<string-id>"` (객체 X)
- [ ] Java 4종 모두 (NEW_NL 모드만)
- [ ] 검색 조건 모든 필드 의미별 위젯 (자유 text 금지)
- [ ] editable:true 컬럼 의미별 editor (`§11`)
- [ ] `useForm({defaultValues})` datetime → `null` (`'` 금지)
- [ ] Master 필드 Pop\* 연결
- [ ] 공통코드 `<InputField type="select">` (CommonCodeSelect import 금지)
- [ ] useForm 있으면 `useFieldCascade` · 그리드면 `applyGridCascade`

---

## §13. 예외 — 엔진 경유 화면 (BF/DP/MP/FP 계산)

기존 화면이 `engine/<target>/<service>` 방식이면 그대로 유지. target ∈ `mp|dp|bf|fp` (PlatformService.Module enum 4개). `callService(serviceId, paramMap, target)`.

도메인-서버: BF/DP → dpserver · MP/CM/IM/RP/SO → mpserver · FP → fpserver.

---

## §14. Anti-patterns

상세 카탈로그 → `99-anti-patterns.md` · `99a-composer-anti-patterns.md`.

가장 빈번한 5가지 (즉시 hook block):
1. `BaseGrid columns={} afterCreate={}` → `items={} afterGridCreate={}`
2. 컬럼 `dataType` 누락 → 즉시 화면 크래시
3. Store swap (`useViewStore`에서 `activeViewId`) → undefined TypeError
4. utility 도메인 `ut/` 사용 → `util/` 통일
5. ===FILE: path 끝 `_sql`/`_jsx`/`_java` (underscore) → 정규 dot 확장자

---

## 관련 파일

- `pre-tool-use-validator.sh` · `composer-jsx.sh` — Write/Edit 시 차단
- `ComposerPromptBuilder.java` — LLM system prompt (INVARIANTS + mode guides)
- `ArtifactApplyService.java` — apply 시 정책 검증
- 41a/b/c/d sub-rules — 코드 표면 단일 진실

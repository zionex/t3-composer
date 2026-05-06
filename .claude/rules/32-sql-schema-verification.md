# 32. SQL Schema Verification — 쿼리 작성 전 스키마 실검증 (강제)

> **모든 SQL 쿼리(INSERT · UPDATE · DELETE · SELECT · SP · 뷰) 작성 시** 실제 DB 스키마를 **반드시** 먼저 확인하고, 작성 후 컬럼명·타입·제약을 재검증한다. 예시 프롬프트·기억·추측에 기반한 "허구 컬럼명(hallucinated columns)" 생성은 절대 금지.

## 0. ⛔ 가장 빈번한 사고 패턴 — "오래된 DDL 만 보고 작성"

> **2026-04 두 차례 사고**: TB_UT_USER_INFO 의 SP 를 새로 작성할 때, LLM 이 두 개의 테이블 DDL 폴더 중 **오래된** 폴더 (`v1.0.0-20250127`) 만 보고 `EMAIL` / `PHONE` 컬럼을 사용한 SP 를 만들었다. 실제 운영 스키마는 newer 폴더 (`v26.0.0-20260423`) + Entity (`UserInfo.java`) 가 가지고 있는 `USER_EMAIL` / `USER_TEL` / `JOIN_DT` 였다. 사용자 강력 차단 요청.

### 0.1 진실 소스 우선순위 (반드시 이 순서)

```
1순위 — Java Entity (@Column)        ← 가장 신뢰. 실제 운영에서 매핑되는 컬럼명
2순위 — 가장 최근 SP DDL 파일         ← 같은 테이블에 대한 다른 SP 의 컬럼 사용 패턴
3순위 — 가장 최근 Table DDL 파일      ← 폴더명 (vX.Y.Z-YYYYMMDD) 의 날짜 가장 큰 것
4순위 — docs/reference/tables-catalog.md
5순위 — 실제 DB 조회 (INFORMATION_SCHEMA.COLUMNS)
```

### 0.2 절대 금지 행동

| ❌ | ✅ |
|---|---|
| 테이블 DDL 파일 1개만 보고 SP 작성 | Entity + 최신 DDL + 기존 SP 3개 모두 비교 |
| 같은 테이블 DDL 이 여러 폴더에 있을 때 임의 1개 선택 | 폴더명 날짜가 가장 큰 것 + Entity 비교로 진실 확인 |
| Entity 가 있는데 무시하고 DDL 만 봄 | Entity 가 1순위 — Entity 의 @Column 이 곧 컬럼명 |
| 같은 SP 의 기존 버전 (`v1.0.0-20260427/...`) 을 모르고 새로 작성 | `find -name "<SP_NAME>.sql"` 로 기존 버전 먼저 찾기 |
| 최신 SP 가 사용하는 컬럼명을 무시하고 자체 추론 | 최신 SP 가 무엇을 SELECT/INSERT 하는지 그대로 따름 |

### 0.3 SP 작성 전 의무 절차 (생략 금지)

```bash
# Step 1 — Entity 찾기 (1순위 진실)
find t3series-wingui/src/main/java -name "*.java" | xargs grep -l "@Table.*<TABLE_NAME>"
# 발견 시 그 파일의 모든 @Column(name="...") 을 추출하여 화이트리스트화

# Step 2 — 같은 SP 의 기존 버전 찾기 (있으면 컬럼 사용 패턴 그대로 따라가기)
find t3series-database -name "<SP_NAME>.sql"
# 발견 시 SELECT/INSERT/UPDATE 절의 컬럼명을 1:1 비교

# Step 3 — 같은 테이블 DDL 의 모든 버전 찾기 (날짜 폴더명 가장 큰 것이 진실)
find t3series-database -name "<TABLE_NAME>.sql"
# 여러 개 있으면 폴더명 정렬해서 최신본만 신뢰

# Step 4 — Entity ↔ 최신 DDL ↔ 기존 SP 의 컬럼 셋 일치 확인
# 셋이 모두 일치 = 진실 확정
# 불일치 = Entity 가 최우선 (운영 코드는 Entity 기반 매핑)
```

### 0.4 Hook 자동 차단 (`.claude/hooks/validators/sql-schema-whitelist.sh`)

`.sql` 파일 Write/Edit 시 다음 패턴 자동 block:
- `TB_UT_USER_INFO` 참조 + 컬럼명 `EMAIL` (실제는 USER_EMAIL) — block
- `TB_UT_USER_INFO` 참조 + 컬럼명 `PHONE` (실제는 USER_TEL) — block
- `TB_AD_MENU` 참조 + 컬럼명 `MENU_NM` 또는 `PARENT_MENU_CD` — block
- `TB_AD_LANG_PACK` 참조 + 컬럼명 `UPDATE_BY` 또는 `UPDATE_DTTM` (실제는 MODIFY_BY/MODIFY_DTTM) — block

신규 재사용 테이블 발견 시 이 hook 의 화이트리스트에 추가하는 게 원칙.

## 1. 검증 필수 상황

아래에 해당하면 **쿼리 작성 직전** 스키마 조회 필수:

- `INSERT INTO <table> (...)` — 컬럼 리스트가 포함된 모든 INSERT
- `UPDATE <table> SET col=...` — SET 절의 모든 컬럼
- `SELECT col1, col2 ... FROM <table>` — 명시 컬럼을 사용하는 SELECT (SELECT * 제외)
- `CREATE PROCEDURE` 내부의 테이블 참조
- `WHERE col = ?` — 필터/조인 컬럼
- 프런트의 파라미터 이름 ↔ SP 파라미터 이름 매칭
- Composer / LLM 생성 스크립트 전체

## 2. 스키마 확인 절차 (이 순서 필수)

```
1) 대응 Java Entity 파일 조회 (가장 정확)
   → t3series-wingui/src/main/java/.../<Table>.java
   → @Column(name="...") 가 1차 진실 소스
     ↓
2) docs/reference/tables-catalog.md (대용량 카탈로그)
   → 674개 테이블 정보 grep
     ↓
3) 최후: 실제 DB 조회 (개발자 확인 후)
   → SELECT column_name, data_type, is_nullable
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_NAME = 'TB_AD_MENU'
     ORDER BY ORDINAL_POSITION
     ↓
4) 작성 후 자기 검증
   → 사용한 모든 컬럼이 1)/2)/3) 결과에 존재하는가?
   → Base entity 의 감사 컬럼(CREATE_BY/CREATE_DTTM/MODIFY_BY/MODIFY_DTTM) 포함 여부 확인
```

### 실전 명령

```bash
# Entity 에서 특정 테이블의 모든 컬럼 확인
grep -A1 '@Column(name' t3series-wingui/src/main/java/**/<Entity>.java

# 예: TB_AD_MENU 의 정확한 컬럼
grep -A1 '@Column(name' t3series-wingui/src/main/java/com/zionex/t3series/web/domain/admin/menu/Menu.java

# 카탈로그 grep
grep -A 20 "TB_AD_MENU" docs/reference/tables-catalog.md
```

## 3. 자주 혼동되는 TB_AD_* 실제 컬럼 (치트시트)

### TB_AD_MENU — 가장 많이 틀리는 테이블

| 실제 컬럼 | 자주 쓰이는 잘못된 이름 | 비고 |
|---|---|---|
| `ID` | — | UUID PK. `LOWER(REPLACE(NEWID(),'-',''))` 로 생성 |
| `PARENT_ID` | ❌ `PARENT_MENU_CD` | UUID FK. `(SELECT ID FROM TB_AD_MENU WHERE MENU_CD='...')` 서브쿼리로 lookup |
| `MENU_CD` | — | 고유 코드 |
| `MENU_PATH` | — | 메뉴 경로 텍스트 (예: `"유틸리티 > T3Composer > 사용자관리"`) |
| `MENU_SEQ` | ❌ `SORT_ORDER` · `DISPLAY_ORDER` | 정수 정렬순서 |
| `MENU_FILE_PATH` | ❌ `URL` · `LINK` · `VIEW_PATH` | JSX 파일 경로 |
| `USE_YN` | — | `Y/N` |
| *(존재 안 함)* | ❌ `MENU_NM` | 메뉴 표시명은 **TB_AD_LANG_PACK** 에 `LANG_KEY=MENU_CD` 로 별도 등록 |
| *(존재 안 함)* | ❌ `DEPTH` | 계층 깊이는 저장하지 않음 (자동 계산) |
| BaseEntity | — | `CREATE_BY`, `CREATE_DTTM`, `MODIFY_BY`, `MODIFY_DTTM` |

### TB_AD_LANG_PACK

| 실제 컬럼 | 주의 |
|---|---|
| `LANG_CD` | `ko` / `en` / `ja` / `zh` |
| `LANG_KEY` | 메뉴 LANG_KEY = 해당 MENU_CD |
| `LANG_VALUE` | 다국어 값 — 한글은 `N'...'` 리터럴 |
| `CREATE_BY`, `CREATE_DTTM` | INSERT 시 포함 |
| `MODIFY_BY`, `MODIFY_DTTM` | **INSERT 시 생략** · UPDATE 시만 사용 (❌ `UPDATE_BY/UPDATE_DTTM` 은 존재 안 함) |

### TB_AD_PERMISSION_GROUP

| 실제 컬럼 |
|---|
| `ID`, `GRP_ID`, `MENU_ID`, `PERMISSION_TP`, `USABILITY` + BaseEntity |
| `PERMISSION_TP ∈ {READ, UPDATE, DELETE}` |
| `USABILITY` — `Y/N` |

### TB_AD_USER (메뉴 등록에서는 참조만)

| 실제 컬럼 |
|---|
| `ID`, `USERNAME`, `PASSWORD`, `DISPLAY_NAME`, `ENABLED`, `JTI`, `SESSION_EXPIRED_DTTM` ... |
| ❌ 테이블명 `TB_AD_USER_MST` 아님 |

## 4. SP 파라미터 검증

SP 호출 시:
1. SP 정의(`t3series-database/mssql/procedures/SP_UI_*.sql`) 에서 선언 파라미터 확인
2. 프런트 `callService(id, params)` 의 key 이름 ↔ SP 파라미터 이름 **camelCase 매칭**
3. 파라미터 순서·타입·NULL 허용 여부 확인

## 5. 작성 후 자기 검증 체크리스트

- [ ] 사용한 모든 컬럼이 Entity 파일에 `@Column(name=...)` 로 선언되어 있는가?
- [ ] `BaseEntity` 의 감사 컬럼 이름을 `UPDATE_BY/UPDATE_DTTM` 대신 `MODIFY_BY/MODIFY_DTTM` 로 썼는가?
- [ ] 한글 문자열은 `N'...'` 프리픽스로 감쌌는가?
- [ ] 새 row 의 `ID` 생성은 DB 네이티브 함수(MSSQL `NEWID()` · Oracle `SYS_GUID()`) 사용?
- [ ] 외래키 참조는 CD 가 아닌 **ID(UUID) 를 서브쿼리 lookup** 으로?
- [ ] 중복 방지 `WHERE NOT EXISTS` 패턴 적용?
- [ ] `db_type` 분기가 필요한 Q&A/온톨로지 쿼리인가? (`rules/10-ontology-first.md`)
- [ ] MSSQL/Oracle 양쪽 방언 필요한 SP 인가? (`rules/31-stored-procedures.md`)

## 6. 금지 행동 (Anti-patterns)

| # | ❌ | ✅ |
|---|---|---|
| Q1 | "예시에 있었으니 맞을 거야" — 프롬프트 예시 컬럼명을 스키마 확인 없이 그대로 사용 | Entity 파일 / 카탈로그 grep 후 실제 컬럼만 사용 |
| Q2 | `MENU_NM` · `PARENT_MENU_CD` · `URL` · `DEPTH` · `SORT_ORDER` 등 TB_AD_MENU 허구 컬럼 | `MENU_PATH / PARENT_ID / MENU_FILE_PATH / MENU_SEQ` — 표시명은 TB_AD_LANG_PACK 별도 등록 |
| Q3 | INSERT 작성 후 검토 없이 바로 제공 | 컬럼 리스트 하나하나 실제 스키마와 대조 |
| Q4 | TB_AD_LANG_PACK UPDATE 에 `UPDATE_BY/UPDATE_DTTM` 사용 | `MODIFY_BY/MODIFY_DTTM` 사용 |
| Q5 | UUID 외래키에 MENU_CD 값 직접 INSERT | `(SELECT ID FROM ...)` 서브쿼리 lookup |
| Q6 | 프런트 파라미터명과 SP 파라미터명 비교 안 함 | camelCase 매칭 확인, 미스매치면 한 쪽 수정 |

## 7. 위반 감지 (Hook 자동 차단)

`.claude/hooks/pre-tool-use-validator.sh` 가 Write/Edit 시점에 다음을 차단:

- TB_AD_MENU 에 `MENU_NM · PARENT_MENU_CD · URL · DEPTH · SORT_ORDER · DISPLAY_ORDER · LINK` 등장
- TB_AD_LANG_PACK 에 `UPDATE_BY · UPDATE_DTTM` 등장 (기존 CP6 규칙)
- TB_AD_PERMISSION / TB_AD_PERMISSION_GROUP 에 잘못된 컬럼 (향후 확장)

차단 시 메시지에 실제 컬럼 리스트와 대체 방법이 표시됨.

## 8. Composer 런타임 검증

T3Composer 의 MenuRegistrationService 는 실행 직전에 `validateInsertColumns` 로 화이트리스트 재검증 — Hook 을 우회해 DB 에 SQL 이 들어가는 경우도 방어.

---
description: Stored Procedure · Function 을 생성·수정할 때 참조. 네이밍 규약·액션 접미어·공통 유틸·대시보드 배치 규약을 강제한다.
globs:
  - "t3series-database/**/*.sql"
  - "**/procedures/**/*.sql"
  - "**/SP_*.sql"
  - "**/FN_*.sql"
  - "**/sp_*.sql"
  - "**/fn_*.sql"
alwaysApply: false
---

# 31. Stored Procedure · Function 규약

> 현재 **965개** (SP + Function). SP DDL: `T3Series_20260422_SP_DDL.sql` (4.7MB). MSSQL 1,023 / Oracle 834.

## 1. 네이밍 규약 (강제)

### 1.1 UI SP 형식
```
SP_UI_<DOMAIN>_<SCREEN_NUMBER>_<ACTION_TYPE>[번호]
SP_UI_<DOMAIN>_<SCREEN_NUMBER>_POP_<ACTION_TYPE>      -- 팝업
SP_UI_<DOMAIN>_<SCREEN_NUMBER>_CHART_<ACTION_TYPE>    -- 차트
SP_UI_<DOMAIN>_<SCREEN_NUMBER>_BATCH                  -- 배치
SP_UI_<DOMAIN>_<FEATURE_NAME>                         -- 기능 기반
```

### 1.2 DOMAIN 코드
| 코드 | 의미 | SP 개수 |
|---|---|---|
| `MP` | Master Planning | 197 |
| `CM` | Common Master | 181 |
| `DP` | Demand Planning | 155 |
| `IM` | Inventory Management | 90 |
| `BF` | Baseline Forecasting | 51 |
| `SA` | Sales Aggregation | 48 |
| `SO` | Sales/Stock Order | 15 |
| `RP` | Replenishment | 11 |
| `SALES` | Sales RT report | 4 |
| `DPD` | DP Dimension hierarchy | 3 |
| `FP` | Factory Planning | 1 (테스트) |
| `FO` | Forecast 변환 | 1 |
| `AD`, `COMM`, `UT` | 각 1 |

### 1.3 ACTION_TYPE 접미어
| 접미어 | 의미 |
|---|---|
| `Q1`, `Q2`, ... | Query (SELECT) — 여러 그리드 있을 때 번호로 구분 |
| `S1`, `S2`, ... | Save (INSERT/UPDATE) |
| `D1`, `D2`, ... | Delete |
| `J`, `J1` | Join / 보조 프로시저 |
| `M1` | Misc / 추가 |
| `BATCH` | 배치 처리 |
| `POP_Q1`, `POP_S1` | 팝업 대화상자용 |
| `CHART_Q1` | 차트 데이터 조회 |

### 1.4 예시
- `SP_UI_MP_08_Q1` — MP 8번 화면 첫 번째 조회
- `SP_UI_CM_50_S1` — CM 50번 화면 저장
- `SP_UI_CM_50_POP_Q1` — CM 50번 화면 팝업 조회
- `SP_UI_DP_17_MEASURE_TP_COMBO` — DP 17번 화면 측정유형 콤보
- `SP_UI_BF_14_CHART_Q2` — BF 14번 화면 두 번째 차트 데이터
- `SP_UI_IM_SLOW_MOVING_STATE_Q1` — IM Slow Moving 상태 조회

## 2. 네이밍 정규식 (Hook 검증용)

```
^SP_UI_(AD|BF|CM|COMM|DP|DPD|FO|FP|IM|MP|RP|SA|SALES|SO|UT|TEST|UI|SAMPLE)_
  (?:[0-9]{2,3}|[A-Z][A-Z0-9_]+)_
  (?:POP_|CHART_)?
  (?:Q[0-9]+|S[0-9]+|D[0-9]+|J[0-9]*|M[0-9]+|BATCH|COMBO|UPDATE|[A-Z][A-Z0-9_]+)
  $
```

## 3. 비UI SP 네이밍

### 3.1 공통 유틸
```
SP_COMM_<FUNCTION>               -- 공통 유틸 (28개)
FN_G_<FUNCTION>                  -- Global 함수 (9개)
FN_SPLIT_<TYPE>                  -- Split 테이블함수 (3개)
```

### 3.2 도메인 배치/로직
```
SP_<DOMAIN>_<FUNCTION>           -- 배치/로직 (~70개)
FN_<DOMAIN>_<FUNCTION>           -- 도메인 함수 (20+)
```

### 3.3 버전 관리 패턴 (모든 도메인 공통)
```
FN_<DOMAIN>_NEW_VERSION              -- 신규 버전 ID 생성
SP_<DOMAIN>_ADJ_VER_DATA_CREATE      -- 조정 버전 데이터 생성
SP_<DOMAIN>_KEEP_RESULT              -- 결과 보관
SP_<DOMAIN>_HANDLING_RESULT          -- 결과 처리
SP_COMM_AUTO_GEN_SIMUL_VER           -- 공통 시뮬레이션 버전 생성
```

### 3.4 결과 생명주기 (버전 관리 관점)
```
1. SP_COMM_AUTO_GEN_SIMUL_VER       → 새 버전 ID 생성
2. SP_<DOMAIN>_ADJ_VER_DATA_CREATE  → 조정 버전용 데이터 복사
3. 엔진 실행                         → TB_EN_* 에 결과 기록
4. SP_<DOMAIN>_HANDLING_RESULT      → 결과 가공/검증
5. SP_<DOMAIN>_KEEP_RESULT          → TB_RT_* 에 결과 아카이브
6. SP_<DOMAIN>_MAKE_DASHBOARD       → 대시보드 집계 생성
```

## 4. 공통 유틸 (반드시 사용)

### 4.1 SP_COMM_*
**자동 생성 / 복사**: `SP_COMM_AUTO_CONDITION`, `SP_COMM_AUTO_GEN_ID`, `SP_COMM_AUTO_GEN_MAIN_VER`, `SP_COMM_AUTO_GEN_SIMUL_VER`, `SP_COMM_PREFER_COPY`

**기본값/초기화**: `SP_COMM_DEFAULT_DATE`, `SP_COMM_DEFAULT_VER`, `SP_COMM_RST_INIT`, `SP_COMM_RST_PRE_SETTING`, `SP_COMM_RST_POST_SETTING`

**검색**: `SP_COMM_SRH_ACCOUNT_Q`, `SP_COMM_SRH_BUCKET`, `SP_COMM_SRH_COMBO_LIST_Q`, `SP_COMM_SRH_DMND_VER`, `SP_COMM_SRH_ITEM_Q`, `SP_COMM_SRH_LOCAT_Q`, `SP_COMM_SRH_LOCAT_ITEM_Q`, `SP_COMM_SRH_LOCAT_MST_Q`, `SP_COMM_SRH_MAIN_VER_Q`, `SP_COMM_SRH_PO_VER`, `SP_COMM_SRH_PROCESS_STEP_Q`, `SP_COMM_SRH_RES_Q`, `SP_COMM_SRH_VER_Q`

**정보 조회**: `SP_COMM_ITEM_INFO`, `SP_COMM_LOCAT_INFO`, `SP_COMM_DATE_LIST_Q`

**에러 처리** — 모든 모듈 필수: `SP_COMM_RAISE_ERR`

### 4.2 FN_G_* (Global Functions)
- `FN_G_ACCT_FILTER`, `FN_G_ACCT_FILTER_EXTENDS`
- `FN_G_ITEM_FILTER`, `FN_G_ITEM_FILTER_EXTENDS`
- `FN_G_AGGR_SQL`, `FN_G_LPAD`, `FN_G_BUCKET_CNT`
- `FN_G_TARGET_DAT`, `FN_G_TARGET_PERIOD`

### 4.3 FN_SPLIT_*
- `FN_SPLIT` — 기본 문자열 split
- `FN_SPLIT_NSTR_TO_TABLE` — N-String → 테이블
- `FN_SPLIT_NVARCHAR_TO_TABLE` — NVARCHAR → 테이블

### 4.4 DynamicPivot
동적 컬럼 피벗 범용 프로시저. 테이블명·행/열/값 컬럼·집계함수 → 런타임 피벗 SQL. 디버깅 플래그 지원.

## 5. 대시보드 빌드 SP
- `SP_CM_MAKE_DASHBOARD_BATCH`
- `SP_BF_MAKE_DASHBOARD`
- `SP_DP_MAKE_DASHBOARD`
- `SP_IM_MAKE_DASHBOARD`
- `SP_SA_MAKE_DASHBOARD`

## 6. DB 방언 — 양쪽 배치

### 6.1 MSSQL (T-SQL) 특징
- `NEWID()` · `NVARCHAR(MAX)` · `GETDATE()` · `GO` 배치 구분자
- `SET ANSI_NULLS`, `SET QUOTED_IDENTIFIER`

### 6.2 Oracle (PL/SQL) 특징
- `SYS_GUID()` · `NVARCHAR2` · `SYSTIMESTAMP`
- `CREATE OR REPLACE FUNCTION ... IS ... BEGIN ... END`
- `JSON_TABLE` (Oracle 12c+)
- 스키마 수식자: `T3SMARTSCM.FN_*`

### 6.3 파일 배치
```
t3series-database/
├── mssql/procedures/      ← T-SQL 버전 배치
└── oracle/procedures/     ← PL/SQL 버전 배치 (동일 이름)
```

**신규 SP 작성 시 두 방언 모두 작성해야 하며, MSSQL → PostgreSQL 변환은 `SP_MSSQL_TO_POSTGRESQL_DDL` 유틸 활용**.

## 7. 업그레이드 스크립트 배치

```
t3series-database/{mssql,oracle}/upgrade/vX.Y.Z-YYYYMMDD/
├── procedures/
├── tables/
├── functions/
└── views/
```
- 버전 폴더는 **날짜 스탬프** 필수 (예: `v26.0.0-20260422`)
- Flyway/Liquibase 미사용 — 수동 순서 관리

## 8. 사용자 채널·판매 구조 조회 (공통 뷰)
- `VW_PEGGING_TYPE` — Pegging 유형 (수요유형/수요분류/채널) 통합 조회 시 사용

## 9. ORDER BY 규칙 (조회 SP 필수 · 강제)

**모든 조회(Query) SP 는 반드시 `ORDER BY` 절을 포함**한다. 정렬 기준은 결정론적 결과를 보장해야 하며 (동일 입력 → 동일 순서), 다음 우선순위 중 해당하는 **모든** 항목을 조합한다.

### 9.1 우선순위 (위에서 아래로, 해당되는 것 모두 적용)

1. **PK (Primary Key)** — 테이블의 PK 컬럼 전체를 마지막 tie-breaker 로 포함 (예: `PLAN_CD, LOCAT_CD, ITEM_CD`)
2. **비즈니스 키 / CODE** — `*_CD`, `*_ID`, `*_NO` 계열 (예: `ITEM_CD`, `ACCOUNT_CD`, `WO_NO`)
3. **명칭** — `*_NM` (예: `ITEM_NM`, `USER_NM`) — 단, 동일 코드가 반복되는 경우 코드 다음 순위
4. **일자 / 시각** — `*_DT`, `*_DTTM`, `PLAN_DATE`, `CREATE_DTTM` — 시계열 리포트는 **DESC** (최신 우선), 마스터는 **ASC**
5. **정렬 순서 컬럼** — `SORT_ORDER`, `SEQ`, `DISPLAY_ORDER`, `LEVEL` — 있으면 **최우선**

### 9.2 적용 패턴 (업무 유형별)

| SP 유형 | 표준 ORDER BY |
|---|---|
| 마스터 CRUD 조회 | `<SORT_ORDER ASC,> <CODE ASC>, <PK>` |
| 코드/드롭다운 콤보 | `<SORT_ORDER ASC,> <CODE ASC>` |
| 시계열 리포트 | `<그룹키 ASC>, <일자 DESC>` |
| 트랜잭션/로그 조회 | `<일자 DESC>, <PK DESC>` (최신 우선) |
| 마스터-디테일 | `<마스터 CODE ASC>, <디테일 SEQ/CODE ASC>` |
| 크로스탭 피벗 소스 | `<행 키 ASC>, <열 키(일자) ASC>` |
| 팝업 (POP_Q1) | `<CODE ASC>` (검색 편의) |
| 차트 (CHART_Q1) | `<일자 ASC>` (시계열 X축 순) |
| 계층 트리 | `<LEVEL ASC>, <PARENT_CD, CHILD_CD>` |

### 9.3 예시

```sql
-- ✅ 마스터 CRUD — SORT_ORDER + CODE + PK
SELECT * FROM TB_CM_ITEM_MST WITH (NOLOCK)
 WHERE USE_YN = 'Y'
 ORDER BY SORT_ORDER ASC, ITEM_CD ASC;

-- ✅ 시계열 리포트 — 그룹 ASC + 일자 DESC
SELECT PLAN_CD, ITEM_CD, PLAN_DATE, QTY
  FROM VW_DEMAND_PLAN WITH (NOLOCK)
 WHERE PLAN_CD = @PLAN_CD
 ORDER BY ITEM_CD ASC, PLAN_DATE DESC;

-- ✅ 트랜잭션 로그 — 최신 우선
SELECT * FROM TB_AD_LOG WITH (NOLOCK)
 ORDER BY LOG_DTTM DESC, LOG_ID DESC;

-- ✅ 팝업 검색 — CODE ASC
SELECT ITEM_CD, ITEM_NM FROM TB_CM_ITEM_MST WITH (NOLOCK)
 WHERE ITEM_CD LIKE @keyword + '%' OR ITEM_NM LIKE '%' + @keyword + '%'
 ORDER BY ITEM_CD ASC;

-- ❌ ORDER BY 누락 — 실행마다 순서 달라짐
SELECT * FROM TB_CM_ITEM_MST WHERE USE_YN = 'Y';

-- ❌ 비결정론적 (동일 LOCAT_CD 가 여러 개일 때 순서 불안정)
SELECT * FROM TB_CM_LOCAT_MST ORDER BY LOCAT_TP_CD;  -- PK 미포함
```

### 9.4 성능 고려
- `ORDER BY` 컬럼에 인덱스가 있으면 `Sort` 연산 생략 가능 → PK/CODE 선호
- 대용량 피벗·집계 SP 는 `ROW_NUMBER() OVER (ORDER BY ...)` 로 먼저 순서 확정
- Top-N 쿼리는 `ORDER BY` + `OFFSET/FETCH` (MSSQL) / `ROWNUM` (Oracle) 조합

### 9.5 예외 (ORDER BY 생략 허용)
- 배치 SP 내부의 임시 staging INSERT (최종 SELECT 아닌 중간 단계)
- 단일 row 반환이 명확한 SP (`SELECT TOP 1 ... WHERE PK = @id`)
- UNION ALL 내부 서브쿼리 (외곽에서 정렬)

## 10. 체크리스트 (SP 작성 전)

- [ ] UI SP 인가? → `SP_UI_<DOMAIN>_<NO>_<ACTION>` 정규식 매치
- [ ] DOMAIN 코드가 위 리스트에 존재?
- [ ] ACTION 접미어가 표준에 부합? (`Q1/S1/D1/POP_Q1/CHART_Q1/BATCH`)
- [ ] MSSQL + Oracle 양쪽 작성?
- [ ] `SP_COMM_RAISE_ERR` 로 오류 처리?
- [ ] 버전 관련이면 `FN_<DOMAIN>_NEW_VERSION` 사용?
- [ ] 공통 검색은 `SP_COMM_SRH_*` 재사용?
- [ ] SP 내부에 한글 주석으로 로직 설명?
- [ ] 업그레이드 폴더 (`upgrade/vX.Y.Z-YYYYMMDD/`) 배치?
- [ ] **조회 SP 에 `ORDER BY` 포함** — §9 우선순위 (SORT_ORDER / CODE / NAME / DATE / PK) 준수?
- [ ] **결정론적 정렬** — tie-breaker 로 PK 포함하여 동일 입력 → 동일 순서 보장?

## 11. Anti-patterns

- ❌ `SP_NEW_SCREEN_QUERY` 같은 자유 네이밍 (DOMAIN·SCREEN_NO·ACTION 없음)
- ❌ `sp_select_items` 처럼 소문자·동사형 네이밍 (시스템 SP 와 충돌)
- ❌ MSSQL 만 작성 후 Oracle 생략
- ❌ 트랜잭션 커밋/롤백 누락 (배치 SP 필수)
- ❌ `PRINT` / `dbms_output.put_line` 만 있고 `SP_COMM_RAISE_ERR` 미사용
- ❌ 시스템 SP 네이밍(`sp_helpdiagrams` 등) 수정 시도 — **MS 제공, 금지**
- ❌ **조회 SP 에 `ORDER BY` 생략** — 실행마다 순서 달라져 그리드 UX 불안정 (§9)
- ❌ **`ORDER BY` 에 PK tie-breaker 누락** — 동일 값 다수 시 비결정론적 (§9.3)

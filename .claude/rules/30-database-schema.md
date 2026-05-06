---
description: 테이블·뷰·DB 구조에 접근해야 할 때 참조. 674개 테이블 전체 카탈로그는 docs/reference/tables-catalog.md에 별도 배치. 이 파일은 도메인 접두어와 핵심 뷰 요약만.
globs:
  - "**/*.sql"
  - "**/entity/**/*.java"
  - "**/*Repository.java"
  - "**/*Entity.java"
  - "**/query/**/*.java"
alwaysApply: false
---

# 30. Database Schema Reference (요약)

> 총 **674개 테이블**, **18개 뷰**. 상세 카탈로그는 `docs/reference/tables-catalog.md` / `docs/reference/views-catalog.md` 에. 여기는 **도메인 접두어 사전**과 **핵심 뷰 18개 목록**만.

## 1. 테이블 접두어 사전

| 접두어 | 개수 | 도메인 | 비고 |
|---|---|---|---|
| `TB_FP_*` | 135 | Factory Planning | BOR/WO/WIP/Route/Stock/Resource — FP 엔진 운영 데이터 |
| `TB_CM_*` | 106 | Common Master | 품목·사이트·창고·위치·캘린더·BOM·출하LT — 공용 마스터 |
| `TB_IS_*` | 60 | Insight (UPPERCASE) | 온톨로지·프롬프트·메타 (레거시) |
| `TB_MP_*` | 58 | Master Planning | 자원 Prefer/Capa, 품목-자원 매핑 |
| `TB_EN_*` | 45 | Engine | FP 실행 결과 임시 저장 |
| `tb_is_*` | 36 | insight (lowercase) | **신규 온톨로지 (GraphRAG)** — `tb_is_vwbusnss_ontlgy` 등 |
| `TB_RT_*` | 34 | Result | SCM 계획 결과 아카이브 |
| `TB_BF_*` | 31 | Baseline Forecasting | 예측 모델 결과 |
| `TB_DP_*` | 29 | Demand Planning | 수요 계획·이력 |
| `TB_AD_*` | 27 | Admin | 메뉴·권한·사용자·공통코드·언어팩 |
| `TB_UT_*` | 24 | Utility | 유틸리티 |
| `TB_SA_*` | 21 | Sales Aggregation | 판매 집계 |
| `TB_IF_*` | 20 | Interface | 외부 인터페이스 |
| `TB_IM_*` | 17 | Inventory Management | 목표재고·안전재고·ABC/XYZ |
| `QRTZ_*` | 11 | Quartz Native | Quartz JDBC 스토어 (시스템 제공) |
| `TB_DPD_*` | 5 | DP Dimension Closure | 계정/품목/사용자 계층 클로저 |
| `TB_RP_*` | 4 | Replenishment/Purchase | 보충 주문 |
| `TB_FO_*` | 4 | Forecast | 예측 입력 |
| `TB_SO_*` | 2 | Stock/Sales Order | |
| `TB_QZ_*` | 2 | Quartz Job 메타 | |
| `TB_EX_*` | 1 | External | |

### ⚠️ 대소문자 주의
- `TB_IS_*` (레거시) 와 `tb_is_*` (신규) **공존**. 신규 온톨로지 기능은 `tb_is_*` 를 사용.
- 예: `TB_IS_QAPATTERN` (레거시 Q&A) vs `tb_is_vwbusnss_ontlgy` (신규 View 온톨로지)

## 2. 핵심 View 목록 (18개)

| # | View | 카테고리 | 용도 요약 |
|---|---|---|---|
| 1 | `VW_BOR_INFO` | MP | 품목-자원 선호도 + 용량 마스터 조인 |
| 2 | `VW_DEMAND_PLAN` | DP | 수요 계획(월별) + 계정/품목 계층 |
| 3 | `VW_EXCHANGE_RATE` | DP | 환율 기간 구간 (LEAD 활용) |
| 4 | `VW_FP_BOM_TREE` | FP | BOM 재귀 전개 (루트→리프 경로) |
| 5 | `VW_FP_RES_PROD_PLAN` | FP | 자원별 생산 계획 + 지연 플래그 |
| 6 | `VW_INTRANSIT_STOCK` | CM/IM | 최신 Cutoff 기준 이동 중 재고 |
| 7 | `VW_INVENTORY_PLAN_CONFIRMED` | IM | 안전재고·목표재고·ROP·EOQ + 결품/과잉 리스크 |
| 8 | `VW_LOCAT_INFO` | CM | 위치 3-Level 조인 |
| 9 | `VW_LOCAT_ITEM_INFO` | CM | **재사용도 1위** — PlanScope × 위치 × 품목 |
| 10 | `VW_MASTER_PLAN_ORD_TRACKING_LATEST` | MP/RT | 최신 MP 시뮬의 수요-공급 충족률(RTF) |
| 11 | `VW_PEGGING_TYPE` | CM | Pegging 유형 코드 통합 |
| 12 | `VW_OBSOLETE_STOCK` | IM | **단종(EOS)** 기한 지난 창고 재고 |
| 13 | `VW_REPLENISHMENT_PLAN_CONFIRMED` | RP | 확정 RP 보충 주문 + 출발/도착 + 운송비 |
| 14 | `VW_RESULT_DATA_SIZE` | 모니터링 | `TB_RT_*` 테이블 크기 추정 (운영용) |
| 15 | `VW_SALES_PERFORMANCE` | SA | 실적 판매(수량+금액) + 팀/채널 |
| 16 | `VW_SHIPMENT_PERFORMANCE` | CM | 실제 출하 + 출발/도착 + 운송 방식 |
| 17 | `VW_SLOWMOVING_STOCK` | IM | **Slow Moving** — 입고 후 경과일 기반 |
| 18 | `VW_WAREHOUSE_STOCK` | CM | 창고 재고 (최신 Cutoff) + 상태 |

## 3. 공통 쿼리 패턴

### 3.1 NOLOCK 힌트 (MSSQL)
대부분 뷰에 `WITH (NOLOCK)` 기본 사용 — 읽기 전용 쿼리에 권장.
```sql
SELECT * FROM TB_CM_ITEM_MST WITH (NOLOCK) WHERE USE_YN = 'Y';
```

### 3.2 최신 CUTOFF 패턴
```sql
-- 최신 CUTOFF_DATE 만
WHERE CUTOFF_DATE = (SELECT MAX(CUTOFF_DATE) FROM TB_CM_INTRANSIT_STOCK_MST)
```

### 3.3 재귀 CTE (BOM 전개)
`VW_FP_BOM_TREE` 참조. 루트는 `ITEM_CLASS_CD = 'P'` (완제품).

### 3.4 버전 필터
```sql
-- 최신 메인 버전
MAIN_VER_CD = (SELECT MAIN_VER_CD FROM TB_CM_CONBD_MAIN_VER_MST
               WHERE STATUS_CD = 'CONFIRMED' ORDER BY ...)

-- 시뮬레이션 버전
SIMUL_VER_CD = :simulVerCd
```

### 3.5 한글 상태명 변환 (TB_AD_LANG_PACK 조인)
```sql
FROM ... LEFT JOIN TB_AD_LANG_PACK LP
  ON LP.LANG_KEY = X.STATUS_CD AND LP.LANG_CD = 'ko'
```

## 4. 온톨로지 테이블 (최우선 이해)

상세: `.claude/rules/10-ontology-first.md`

| 테이블 | 역할 | 키 |
|---|---|---|
| `tb_is_vwbusnss_ontlgy` | View 온톨로지 (화면 단위) | `menu_cd` |
| `tb_is_prcss_ontlgy` | Process 온톨로지 (프로세스 단위) | `process_cd` |
| `TB_IS_QAPATTERN` | Q&A 패턴 캐시 | `id` + `business_domain` |
| `tb_is_ontlgy_entity` | 개별 엔티티 | `(id, version)` |
| `tb_is_ontlgy_entity_relation` | 엔티티 관계 그래프 | 4-tuple |

**이력 테이블**: `tb_is_vwbusnss_ontlgy_hist`, `tb_is_prcss_ontlgy_hist` (snapshot JSON)

**버전 마스터**: `TB_IS_ONTLGY_VERSION` (`is_current='Y'` 필터)

## 5. Admin / Auth 핵심 (★ 실제 컬럼만 사용 — Hook 자동 차단)

### 5.1 `TB_AD_MENU` — 메뉴 정의

**실제 컬럼**:
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `ID` | CHAR(32) | PK (UUID, hyphen 제거) |
| `PARENT_ID` | CHAR(32) | 부모 메뉴 FK (`TB_AD_MENU.ID`) |
| `MENU_CD` | NVARCHAR | 메뉴 코드 (UNIQUE) — `UI_<DOMAIN>_<NAME>` 또는 그룹 `MENU_<DOMAIN>` |
| `MENU_PATH` | NVARCHAR | URL hash — `LOWER(MENU_FILE_PATH)` 권장 |
| `MENU_SEQ` | INT | 정렬 순서 |
| `MENU_FILE_PATH` | NVARCHAR | JSX 파일 경로 — `/<module>[/<category>]/<PascalName>` (확장자 없이) |
| `USE_YN` | NCHAR(1) | 사용 여부 |
| `CREATE_BY` / `CREATE_DTTM` | (BaseEntity) | 등록 정보 |
| `MODIFY_BY` / `MODIFY_DTTM` | (BaseEntity) | 수정 정보 |

**❌ 존재하지 않는 컬럼 (Hook block — `sql-schema-whitelist.sh` · `composer-patterns.sh §6.3.1`)**:
- `MENU_NM` — 메뉴 표시명은 `TB_AD_LANG_PACK` 에 별도 등록 (`LANG_KEY = MENU_CD`)
- `PARENT_MENU_CD` — 부모는 `PARENT_ID` (UUID FK), lookup: `(SELECT ID FROM TB_AD_MENU WHERE MENU_CD = '<...>')`
- `URL` — 라우팅은 `MENU_PATH` + `MENU_FILE_PATH` 로 자동 매핑
- `DEPTH` / `SORT_ORDER` / `DISPLAY_ORDER` / `LINK` — 모두 미존재

**INSERT 표준 (재실행 안전 — 멱등):**
```sql
INSERT INTO TB_AD_MENU (
    ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN, CREATE_BY, CREATE_DTTM
)
SELECT
    LOWER(REPLACE(NEWID(), '-', '')),
    (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'MENU_UTIL'),     -- ★ MENU_UT 아님
    'UI_UT_USER_INFO_MGMT',
    N'유틸리티 > 사용자정보 관리',                                 -- (선택) MENU_PATH 에 한글 경로
    110,
    '/util/UserInfoMgmt',                                         -- 단일 세그먼트 + PascalCase
    'Y', 'composer', GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM TB_AD_MENU WHERE MENU_CD = 'UI_UT_USER_INFO_MGMT');
```

### 5.2 `TB_AD_LANG_PACK` — 다국어 (메뉴/필드/메시지 표시명)

**실제 컬럼**:
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `LANG_CD` | NCHAR(2) | 언어 코드 (`ko` / `en` / `ja` / `zh`) |
| `LANG_KEY` | NVARCHAR | 키 (예: MENU_CD, 필드명) |
| `LANG_VALUE` | NVARCHAR | 표시 문자열 |
| `CREATE_BY` / `CREATE_DTTM` | (BaseEntity) | 등록 정보 |
| `MODIFY_BY` / `MODIFY_DTTM` | (BaseEntity) | 수정 정보 |

**❌ 존재하지 않는 컬럼 (Hook block)**:
- `UPDATE_BY` / `UPDATE_DTTM` — 실제는 `MODIFY_BY` / `MODIFY_DTTM`

**INSERT 표준 (메뉴 등록과 함께 4개 언어):**
```sql
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM)
SELECT 'ko', 'UI_UT_USER_INFO_MGMT', N'사용자정보 관리', 'composer', GETDATE()
 WHERE NOT EXISTS (SELECT 1 FROM TB_AD_LANG_PACK WHERE LANG_CD='ko' AND LANG_KEY='UI_UT_USER_INFO_MGMT');
-- (en/ja/zh 동일 패턴)
```

### 5.3 `TB_AD_PERMISSION_GROUP` — 메뉴별 권한 (★ `TB_AD_PERMISSION` 이 아님)

**실제 컬럼**:
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `ID` | CHAR(32) | PK |
| `GRP_ID` | NVARCHAR | 그룹 ID (사용자 그룹) |
| `MENU_ID` | CHAR(32) | 메뉴 FK (`TB_AD_MENU.ID`) — ★ `MENU_CD` 가 아닌 UUID |
| `PERMISSION_TP` | NVARCHAR | `READ` / `UPDATE` / `DELETE` |
| `USABILITY` | NCHAR(1) | 사용 가능 여부 |
| `CREATE_BY` / `CREATE_DTTM` / `MODIFY_BY` / `MODIFY_DTTM` | (BaseEntity) | |

**INSERT 표준 (형제 메뉴 권한 복사):**
```sql
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

### 5.4 기타 Admin 테이블 (간단 요약)

| 테이블 | 용도 | 핵심 컬럼 |
|---|---|---|
| `TB_AD_USER_MST` | 사용자 마스터 | USER_ID, USER_NM, ... (상세는 Entity 확인) |
| `TB_AD_COMN_CODE` | 공통코드 (코드값) | GRP_CD, COMN_CD, COMN_NM_KO/EN/JA/ZH |
| `TB_AD_COMN_GRP` | 공통코드 그룹 | GRP_CD, GRP_NM |

### 5.5 `TB_UT_USER_INFO` — 사용자 부가정보 (★ 자주 틀리는 함정)

**실제 컬럼** (`web/domain/util/userinfo/UserInfo.java` 의 `@Column(name=...)` 기준):
- PK: `USER_ID`
- `USER_NM` · **`USER_EMAIL`** · **`USER_TEL`** · `DEPT_CD` · `DEPT_NM` · `POSITION_CD` · `POSITION_NM` · `USER_TP` · `USE_YN` · `JOIN_DT` · `REMARK`
- BaseEntity: `CREATE_BY` / `CREATE_DTTM` / `MODIFY_BY` / `MODIFY_DTTM`

**❌ 존재하지 않는 컬럼 (Hook block)**:
- `EMAIL` — 실제는 `USER_EMAIL`
- `PHONE` — 실제는 `USER_TEL`
- `EMP_NO` — 미존재 (Composer 가 자주 추측 추가)
- `ID` (UUID) — PK 는 `USER_ID` (사용자가 입력한 식별자)

이전 사고 (2026-04): 같은 테이블 DDL 이 `v1.0.0-20250127` (옛: `EMAIL`/`PHONE`) 과 `v26.0.0-20260423` (현: `USER_EMAIL`/`USER_TEL`/`JOIN_DT`) 두 버전 존재 → LLM 이 옛 폴더만 보고 SP 작성. **진실 우선순위**:

1. **Entity (`@Column(name=...)`)** ← 1순위 (운영 ORM 매핑)
2. **같은 SP 의 가장 최근 버전** (`find -name "<SP_NAME>.sql"`)
3. **가장 최근 Table DDL** (폴더명 날짜 가장 큰 것)

상세 검증 절차: `.claude/rules/32-sql-schema-verification.md`.

## 6. 대용량 카탈로그 활용

상세 테이블·뷰 정보는 다음 파일에:
- `docs/reference/tables-catalog.md` — 674개 전체 테이블 카탈로그
- `docs/reference/views-catalog.md` — 18개 뷰 전체 스펙
- `docs/reference/sp-catalog.md` — 965개 SP/Function 전체 목록

필요 시 grep 으로 조회:
```bash
# "재고" 관련 테이블 찾기
grep -i "재고\|stock\|inventory" docs/reference/tables-catalog.md

# 특정 View 의 주 소스 테이블 확인
grep -A 20 "VW_INVENTORY_PLAN_CONFIRMED" docs/reference/views-catalog.md
```

## 7. SQL 작성 체크리스트

- [ ] **SQL 작성 전 Entity (`@Column(name=...)`) 또는 카탈로그로 실제 컬럼 사전 검증?** (`.claude/rules/32-sql-schema-verification.md`)
- [ ] 접두어 규약에 맞는 테이블명 사용?
- [ ] **MSSQL 방언 (TB_AD_MENU SQL · SP_UI_*.sql 은 MSSQL only — Oracle 폴더 생성 금지)?**
- [ ] 대용량 조회는 `NOLOCK`/`WITH (NOLOCK)` 적용? (MSSQL)
- [ ] 최신 버전·Cutoff 필터 포함?
- [ ] 상태 필터 (`USE_YN='Y'`, `ACTV_YN='Y'`, `STATUS_CD='CONFIRMED'` 등) 적용?
- [ ] JOIN 조건에 `PLAN_SCOPE` 누락 없음? (멀티 테넌트 분리)
- [ ] 다국어 필드는 `TB_AD_LANG_PACK` 로 변환 (`LANG_KEY` ↔ 코드)?
- [ ] **TB_AD_MENU INSERT 컬럼 = 실제 7개 (ID/PARENT_ID/MENU_CD/MENU_PATH/MENU_SEQ/MENU_FILE_PATH/USE_YN) + BaseEntity?**
- [ ] **TB_AD_LANG_PACK 의 audit 컬럼 = MODIFY_BY/MODIFY_DTTM (UPDATE_* 아님)?**
- [ ] **TB_UT_USER_INFO 컬럼 = USER_EMAIL/USER_TEL (EMAIL/PHONE 아님)?**
- [ ] 조회 SP 에 결정론적 `ORDER BY` 포함? (`.claude/rules/31-stored-procedures.md §9`)

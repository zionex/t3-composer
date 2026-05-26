# 30b. KTNG DB 스키마 핵심

> KTNG DB 는 **MSSQL** (T-SQL). 스키마는 `T3SMARTSCM.dbo` 기준. 일반 T3Series 와 동일한 도메인 접두어 사용 + KTNG 전용 테이블 일부 추가.

## 1. 테이블 접두어 (T3Series 표준 + KTNG)

| 접두어 | 의미 | 예 |
|---|---|---|
| `TB_AD_*` | Admin (메뉴/권한/사용자/공통코드/언어팩) | TB_AD_MENU, TB_AD_LANG_PACK |
| `TB_BF_*` | Baseline Forecasting | |
| `TB_CM_*` | Common Master + Contribution Margin | TB_CM_ITEM_MST |
| `TB_DP_*` | Demand Planning | |
| `TB_IM_*` | Inventory Management | TB_IM_TARGET_INV_POLICY_PERIOD |
| `TB_MP_*` | Master Planning | |
| `TB_SO_*` | Sales/Stock Order | |
| `TB_UT_*` | Utility | TB_UT_USER_INFO |
| `TB_RT_*` | Result archive | |
| `TB_EN_*` | Engine 임시 | |
| `TB_RPT_*` | Report (KTNG 추가 가능성) | |

## 2. Admin 핵심 테이블 — 실제 컬럼 (★ Hook 자동 차단)

### 2.1 `TB_AD_MENU`

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `ID` | CHAR(32) | PK · UUID hyphen 제거 (`REPLACE(NEWID(),'-','')`) |
| `PARENT_ID` | CHAR(32) | FK → 자기 자신 |
| `MENU_CD` | NVARCHAR | UNIQUE — `UI_<DOMAIN>_KTNG_<NN>` 또는 그룹 `MENU_<DOMAIN>` |
| `MENU_PATH` | NVARCHAR | 표시 경로 (예: `유틸리티 > KTNG 01`) |
| `MENU_SEQ` | INT | 정렬 |
| `MENU_FILE_PATH` | NVARCHAR | JSX 경로 (확장자 없이, PascalCase 끝) |
| `USE_YN` | NCHAR(1) | Y/N |
| `CREATE_BY` / `CREATE_DTTM` | | |
| `MODIFY_BY` / `MODIFY_DTTM` | | |

**❌ 존재하지 않는 컬럼**:
- `MENU_NM` — 메뉴 표시명은 **TB_AD_LANG_PACK** 에 별도 등록 (`LANG_KEY=MENU_CD`)
- `PARENT_MENU_CD` — FK 는 `PARENT_ID` (UUID). lookup: `(SELECT ID FROM TB_AD_MENU WHERE MENU_CD='...')`
- `URL`, `DEPTH`, `SORT_ORDER`, `DISPLAY_ORDER` — 모두 미존재

### 2.2 `TB_AD_LANG_PACK`

| 컬럼 | 비고 |
|---|---|
| `LANG_CD` | NCHAR(2) — `ko`/`en` (KTNG 는 보통 2개 언어) |
| `LANG_KEY` | NVARCHAR — 키 (MENU_CD, 필드명, 메시지) |
| `LANG_VALUE` | NVARCHAR — 표시 문자열 |
| `CREATE_BY` / `CREATE_DTTM` | |
| **`MODIFY_BY`** / **`MODIFY_DTTM`** | **★ `UPDATE_BY`/`UPDATE_DTTM` 아님** |

### 2.3 `TB_AD_PERMISSION_GROUP`

| 컬럼 | 비고 |
|---|---|
| `ID` | CHAR(32) |
| `GRP_ID` | NVARCHAR — 사용자 그룹 |
| `MENU_ID` | CHAR(32) — FK → TB_AD_MENU.ID (★ MENU_CD 가 아닌 UUID) |
| `PERMISSION_TP` | `READ` / `UPDATE` / `DELETE` / `EXECUTE` |
| `USABILITY` | Y/N |
| + BaseEntity | CREATE_*/MODIFY_* |

### 2.4 `TB_AD_USER`
- `ID` · `USERNAME` · `PASSWORD` · `DISPLAY_NAME` · `ENABLED` · `JTI` · `SESSION_EXPIRED_DTTM`
- ❌ `USER_ID`/`USER_NM` (이는 `TB_UT_USER_INFO` 의 컬럼)

### 2.5 `TB_UT_USER_INFO`
- `USER_ID` · `USER_NM` · **`USER_EMAIL`** · **`USER_TEL`** · `DEPT_CD` · `POSITION_CD` · `USE_YN` · `JOIN_DT`
- ❌ `EMAIL` (실제 `USER_EMAIL`) · ❌ `PHONE` (실제 `USER_TEL`)

## 3. KTNG 특화 테이블 (분석된 db_update_script.sql 기반)

| 테이블 | 용도 |
|---|---|
| `TB_IM_TARGET_INV_POLICY_PERIOD` | 기간별 목표재고 시뮬레이션 |
| `TB_AD_USER_PREF_MST` / `TB_AD_USER_PREF_DTL` | 사용자별 그리드 컬럼 설정 (`VIEW_CD = MENU_CD`) |
| `TB_AD_GROUP` | 사용자 그룹 (`GRP_CD = 'DEFAULT'` 등) |

## 4. 공통 쿼리 패턴

### 4.1 NEW UUID
```sql
REPLACE(NEWID(), '-', '')
```

### 4.2 멱등 INSERT
```sql
INSERT INTO TB_AD_MENU (ID, PARENT_ID, MENU_CD, ...)
SELECT REPLACE(NEWID(),'-',''), (SELECT ID FROM TB_AD_MENU WHERE MENU_CD='MENU_BF'),
       'UI_BF_KTNG_04', ...
WHERE NOT EXISTS (SELECT 1 FROM TB_AD_MENU WHERE MENU_CD = 'UI_BF_KTNG_04');
```

### 4.3 다국어 변환 조인
```sql
SELECT ... FROM TB_BF_... b
LEFT JOIN TB_AD_LANG_PACK LP
  ON LP.LANG_KEY = b.STATUS_CD AND LP.LANG_CD = 'ko'
```

### 4.4 NOLOCK 힌트 (대용량 조회)
```sql
SELECT * FROM TB_CM_ITEM_MST WITH (NOLOCK) WHERE USE_YN = 'Y'
```

## 5. 메뉴 등록 SQL — KTNG 표준 양식

```sql
-- ─── (1) 메뉴 ────────────────────────────────────────────────────
INSERT INTO TB_AD_MENU (
    ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN, CREATE_BY, CREATE_DTTM
)
SELECT
    REPLACE(NEWID(), '-', ''),
    (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'MENU_BF'),      -- 부모 그룹 (MENU_BF/DP/MP/IM/CM/RPT/AD)
    'UI_BF_KTNG_04',                                              -- UI_<DOMAIN>_KTNG_<NN>
    N'기준예측 > KTNG 04 화면',
    410,                                                          -- 정렬
    '/baselineforecast/master/BfKtng04',                          -- /<module>/<cat>/<PascalCase File>
    'Y', 'admin', GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM TB_AD_MENU WHERE MENU_CD = 'UI_BF_KTNG_04');

-- ─── (2) 다국어 ──────────────────────────────────────────────────
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM)
SELECT 'ko', 'UI_BF_KTNG_04', N'KTNG 04 화면', 'admin', GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM TB_AD_LANG_PACK WHERE LANG_CD='ko' AND LANG_KEY='UI_BF_KTNG_04');

INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM)
SELECT 'en', 'UI_BF_KTNG_04', 'KTNG 04 Screen', 'admin', GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM TB_AD_LANG_PACK WHERE LANG_CD='en' AND LANG_KEY='UI_BF_KTNG_04');

-- ─── (3) 권한 (형제 메뉴 복사) ────────────────────────────────────
DECLARE @SRC CHAR(32) = (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'UI_BF_KTNG_03');
DECLARE @NEW CHAR(32) = (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'UI_BF_KTNG_04');

INSERT INTO TB_AD_PERMISSION_GROUP (ID, GRP_ID, MENU_ID, PERMISSION_TP, USABILITY, CREATE_BY, CREATE_DTTM)
SELECT REPLACE(NEWID(),'-',''), p.GRP_ID, @NEW, p.PERMISSION_TP, p.USABILITY, 'admin', GETDATE()
FROM TB_AD_PERMISSION_GROUP p
WHERE p.MENU_ID = @SRC
  AND NOT EXISTS (
        SELECT 1 FROM TB_AD_PERMISSION_GROUP x
         WHERE x.MENU_ID = @NEW AND x.GRP_ID = p.GRP_ID AND x.PERMISSION_TP = p.PERMISSION_TP
  );
```

## 6. DB 변경 절차

| 변경 종류 | 위치 |
|---|---|
| 새 테이블 / 컬럼 추가 | `t3series-database/db_update_script.sql` 끝에 추가 |
| 새 SP / Function | `t3series-database/procedures/<SP_NAME>.sql` 신규 파일 |
| SP 수정 | 같은 파일 덮어쓰기 (히스토리는 git 이 관리) |

> Composer/wingui 본가의 `upgrade/vX.Y.Z-YYYYMMDD/` 폴더 구조는 KTNG 에서는 사용 안 함.

## 7. 체크리스트 (SQL 작성 전)

- [ ] TB_AD_MENU INSERT 컬럼 7개만 (ID/PARENT_ID/MENU_CD/MENU_PATH/MENU_SEQ/MENU_FILE_PATH/USE_YN + audit)?
- [ ] MENU_NM/PARENT_MENU_CD/URL 사용 안 함?
- [ ] TB_AD_LANG_PACK 의 audit 컬럼 MODIFY_BY/MODIFY_DTTM (UPDATE_* 아님)?
- [ ] PARENT_ID 자리에 MENU_CD 직접 넣지 않고 `(SELECT ID FROM TB_AD_MENU WHERE MENU_CD='...')`?
- [ ] MSSQL 함수만 사용 (NEWID/GETDATE — Oracle SYSDATE/SYS_GUID/PG gen_random_uuid 금지)?
- [ ] 한글 리터럴은 `N'...'` prefix?
- [ ] 멱등 INSERT (NOT EXISTS 또는 MERGE) 사용?

## 8. Anti-patterns

| ❌ | ✅ |
|---|---|
| TB_AD_MENU 에 `MENU_NM`/`PARENT_MENU_CD`/`URL` | 실제 컬럼 7개만. 표시명은 TB_AD_LANG_PACK |
| TB_AD_LANG_PACK 에 `UPDATE_BY`/`UPDATE_DTTM` | `MODIFY_BY`/`MODIFY_DTTM` |
| TB_AD_USER 에 `USER_ID`/`USER_NM` (운영 사용자 테이블) | `ID`/`USERNAME`/`DISPLAY_NAME` (USER_ID/NM 은 TB_UT_USER_INFO) |
| Oracle 함수 (`SYSDATE`/`SYS_GUID()`) | `GETDATE()`/`NEWID()` |
| PG 함수 (`gen_random_uuid()`/`now()::timestamp`) | MSSQL T-SQL |
| 한글 리터럴 `'...'` (N 누락 → ?? 깨짐) | `N'...'` |

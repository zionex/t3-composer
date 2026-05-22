# 31. KTNG Stored Procedure 규약

> KTNG SP 는 KTNG 화면 작업의 **핵심**. Controller 는 거의 SP 호출 wrapper.

## 1. 네이밍 규약 (강제)

### 1.1 UI 화면 SP — KTNG 전용
```
SP_UI_<DOMAIN>_KTNG_<NN>_<ACTION>
```
- DOMAIN ∈ {AD, BF, CM, DP, IM, MP, RPT, SO}
- NN = 2자리 번호 (01~99)
- ACTION ∈ {Q1..Qn, S1..Sn, D1..Dn, POP_Q1, CHART_Q1, M1, BATCH}

### 1.2 예시
```
SP_UI_BF_KTNG_01_Q1         — BF KTNG 01번 화면 조회
SP_UI_BF_KTNG_01_S1         — 저장 (기본)
SP_UI_BF_KTNG_01_S2         — 저장 (보조 — 수요예측 인자 반영 등)
SP_UI_BF_KTNG_01_D1         — 삭제
SP_UI_BF_KTNG_01_POP_Q1     — 품목 팝업 조회
SP_UI_DP_KTNG_05_CHART_Q1   — 차트 데이터
SP_UI_RPT_KTNG_15_Q1        — 리포트 조회
```

### 1.3 KTNG 공통 SP
```
SP_COMM_KTNG_COMBO_LIST     — KTNG 전용 공통코드 콤보 (P_TYPE 으로 그룹 구분)
```

### 1.4 일반 도메인 SP (KTNG 접미 없음)
```
SP_<DOMAIN>_<FUNCTION>      — 도메인 배치 (SP_BF_MAKE_DASHBOARD, SP_MP_DATA_BATCH 등)
SP_COMM_<FUNCTION>          — 공통 유틸 (SP_COMM_SRH_ACCOUNT_Q 등)
FN_<DOMAIN>_<FUNCTION>      — 도메인 함수 (FN_BF_NEW_VERSION)
FN_G_<FUNCTION>             — Global 함수 (FN_G_ITEM_FILTER)
```

## 2. 표준 SP 구조 (MSSQL T-SQL)

```sql
CREATE OR ALTER PROCEDURE [dbo].[SP_UI_BF_KTNG_01_Q1]
    @P_SALES_ORG_CD     NVARCHAR(50) = NULL,
    @P_ACCOUNT_CD       NVARCHAR(50) = NULL,
    @P_ITEM_LV3         NVARCHAR(50) = NULL,
    @P_START_DT         NVARCHAR(8)  = NULL,
    @P_END_DT           NVARCHAR(8)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET ANSI_NULLS ON;

    BEGIN TRY
        SELECT  CM.SALES_ORG_CD,
                CM.SALES_ORG_NM         AS SALES_ORG,
                AC.ACCOUNT_CD,
                AC.ACCOUNT_NM,
                IM.ITEM_LV3_CD,
                IM.ITEM_LV3_NM,
                CONVERT(NVARCHAR(8), B.START_DT, 112)  AS START_DT,
                CONVERT(NVARCHAR(8), B.END_DT, 112)    AS END_DT,
                B.PROMOTION_TYPE_CD,
                B.DISCOUNT_RATE,
                B.DESCRIPTION
        FROM    TB_BF_KTNG_PROMOTION B WITH (NOLOCK)
        LEFT JOIN TB_CM_SALES_ORG CM
               ON CM.SALES_ORG_CD = B.SALES_ORG_CD
        LEFT JOIN TB_CM_ACCOUNT AC
               ON AC.ACCOUNT_CD = B.ACCOUNT_CD
        LEFT JOIN TB_CM_ITEM_HIER IM
               ON IM.ITEM_LV3_CD = B.ITEM_LV3_CD
        WHERE   (@P_SALES_ORG_CD IS NULL OR B.SALES_ORG_CD = @P_SALES_ORG_CD)
            AND (@P_ACCOUNT_CD   IS NULL OR @P_ACCOUNT_CD = '' OR B.ACCOUNT_CD = @P_ACCOUNT_CD)
            AND (@P_START_DT     IS NULL OR B.START_DT >= @P_START_DT)
            AND (@P_END_DT       IS NULL OR B.END_DT   <= @P_END_DT)
        ORDER BY B.SALES_ORG_CD, B.ACCOUNT_CD, B.ITEM_LV3_CD, B.START_DT;
    END TRY
    BEGIN CATCH
        EXEC SP_COMM_RAISE_ERR;
    END CATCH
END
```

## 3. 저장 SP 패턴 (UPSERT)

```sql
CREATE OR ALTER PROCEDURE [dbo].[SP_UI_BF_KTNG_01_S1]
    @P_ACCOUNT_CD       NVARCHAR(50),
    @P_ITEM_LV_3_CD     NVARCHAR(50),
    @P_START_DT         NVARCHAR(8),
    @P_END_DT           NVARCHAR(8),
    @P_PROMOTION_TYPE_CD NVARCHAR(50) = NULL,
    @P_DISCOUNT_RATE    DECIMAL(20,3) = NULL,
    @P_DESCRIPTION      NVARCHAR(MAX) = NULL,
    @P_USER_ID          NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRAN;

        MERGE TB_BF_KTNG_PROMOTION AS T
        USING (SELECT @P_ACCOUNT_CD AS ACCOUNT_CD,
                      @P_ITEM_LV_3_CD AS ITEM_LV3_CD,
                      @P_START_DT  AS START_DT) AS S
           ON T.ACCOUNT_CD = S.ACCOUNT_CD
          AND T.ITEM_LV3_CD = S.ITEM_LV3_CD
          AND T.START_DT = S.START_DT
        WHEN MATCHED THEN
            UPDATE SET END_DT = @P_END_DT,
                       PROMOTION_TYPE_CD = @P_PROMOTION_TYPE_CD,
                       DISCOUNT_RATE = @P_DISCOUNT_RATE,
                       DESCRIPTION = @P_DESCRIPTION,
                       MODIFY_BY = @P_USER_ID,
                       MODIFY_DTTM = GETDATE()
        WHEN NOT MATCHED THEN
            INSERT (ID, ACCOUNT_CD, ITEM_LV3_CD, START_DT, END_DT,
                    PROMOTION_TYPE_CD, DISCOUNT_RATE, DESCRIPTION,
                    CREATE_BY, CREATE_DTTM)
            VALUES (REPLACE(NEWID(),'-',''),
                    @P_ACCOUNT_CD, @P_ITEM_LV_3_CD, @P_START_DT, @P_END_DT,
                    @P_PROMOTION_TYPE_CD, @P_DISCOUNT_RATE, @P_DESCRIPTION,
                    @P_USER_ID, GETDATE());

        COMMIT TRAN;
        SELECT 'success' AS RESULT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRAN;
        EXEC SP_COMM_RAISE_ERR;
    END CATCH
END
```

## 4. 삭제 SP 패턴

```sql
CREATE OR ALTER PROCEDURE [dbo].[SP_UI_BF_KTNG_01_D1]
    @P_ACCOUNT_CD       NVARCHAR(50),
    @P_ITEM_LV_3_CD     NVARCHAR(50),
    @P_START_DT         NVARCHAR(8),
    @P_END_DT           NVARCHAR(8) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DELETE FROM TB_BF_KTNG_PROMOTION
         WHERE ACCOUNT_CD = @P_ACCOUNT_CD
           AND ITEM_LV3_CD = @P_ITEM_LV_3_CD
           AND START_DT = @P_START_DT;

        SELECT 'success' AS RESULT;
    END TRY
    BEGIN CATCH
        EXEC SP_COMM_RAISE_ERR;
    END CATCH
END
```

## 5. 공통 유틸 (재사용)

| SP / 함수 | 용도 |
|---|---|
| `SP_COMM_RAISE_ERR` | 에러 던지기 (TRY/CATCH 의 CATCH 안에서) |
| `SP_COMM_SRH_ACCOUNT_Q` | 거래처 검색 |
| `SP_COMM_SRH_RES_Q` | 자원 검색 |
| `SP_COMM_SRH_VER_Q` | 버전 검색 |
| `SP_COMM_KTNG_COMBO_LIST` | KTNG 공통코드 콤보 (P_TYPE 으로 그룹 구분) |
| `FN_G_ITEM_FILTER` | 품목 필터 (Global) |
| `FN_BF_ITEM_FILTER` | BF 품목 필터 |
| `FN_BF_NEW_VERSION` | BF 새 버전 ID |

## 6. ORDER BY 규약 — 조회 SP 필수

조회 SP 는 **반드시** `ORDER BY` 포함. 결정론적 정렬 보장:

| 우선순위 | 후보 컬럼 |
|---|---|
| 1 | `SORT_ORDER`, `SEQ`, `DISPLAY_ORDER`, `LEVEL` |
| 2 | `*_CD` (CODE — ITEM_CD, ACCOUNT_CD 등) |
| 3 | `*_NM` (NAME) |
| 4 | `*_DT`, `*_DTTM` (일자 — 시계열 DESC, 마스터 ASC) |
| 5 | PK (마지막 tie-breaker) |

## 7. 파일 배치

```
t3series-database/procedures/
  ├── SP_UI_BF_KTNG_01_Q1.sql
  ├── SP_UI_BF_KTNG_01_S1.sql
  ├── SP_UI_BF_KTNG_01_D1.sql
  ├── SP_UI_BF_KTNG_01_POP_Q1.sql
  └── SP_COMM_KTNG_COMBO_LIST.sql
```

> Composer 의 `mssql/upgrade/vX.Y.Z-YYYYMMDD/procedures/` 구조 미사용. 단일 폴더에 평탄하게 보관.

## 8. 체크리스트 (SP 작성 전)

- [ ] 네이밍 `SP_UI_<DOMAIN>_KTNG_<NN>_<ACTION>` 정규식 매치?
- [ ] DOMAIN 코드가 BF/CM/DP/IM/MP/RPT/AD/SO 중?
- [ ] ACTION 접미어 표준 (Q1/S1/D1/POP_Q1/CHART_Q1)?
- [ ] MSSQL T-SQL only (Oracle/PG 함수 없음)?
- [ ] `BEGIN TRY/CATCH` + `SP_COMM_RAISE_ERR` 에러 처리?
- [ ] 조회 SP 에 결정론적 `ORDER BY`?
- [ ] 저장 SP 에 트랜잭션 + `MERGE` 또는 `INSERT/UPDATE` 분기?
- [ ] 파라미터 default `= NULL` 명시 (선택 파라미터)?
- [ ] `WHERE (@P_XXX IS NULL OR ...)` 패턴 (조건부 필터)?
- [ ] `T3SMARTSCM.dbo` 스키마 prefix 일관?

## 9. Anti-patterns

| ❌ | ✅ |
|---|---|
| `SP_NEW_BF_QUERY` (자유 네이밍) | `SP_UI_BF_KTNG_01_Q1` |
| `SP_KTNG_BF_01_Q1` (UI/COMM prefix 누락) | `SP_UI_BF_KTNG_01_Q1` |
| `SP_UI_KTNG_01_Q1` (도메인 누락) | `SP_UI_BF_KTNG_01_Q1` |
| 소문자 SP 명 (`sp_select_xxx`) | UPPER_SNAKE |
| Oracle `SYSDATE` / `SYS_GUID()` | `GETDATE()` / `NEWID()` |
| PG `gen_random_uuid()` / `now()` | MSSQL T-SQL |
| `ORDER BY` 누락 조회 SP | SORT_ORDER/CODE/NAME/DATE/PK 결정론적 정렬 |
| `BEGIN TRY` 없이 에러 흘려보냄 | TRY/CATCH + `SP_COMM_RAISE_ERR` |
| 저장 SP 에 트랜잭션 없음 | `BEGIN TRAN`/`COMMIT`/`ROLLBACK` |
| MERGE 안에서 IDENTITY 또는 SEQUENCE 사용 | `REPLACE(NEWID(),'-','')` UUID |

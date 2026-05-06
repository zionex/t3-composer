-- =============================================================================
-- 02. wingui Minimal DDL — Composer SQL 들이 참조하는 wingui 테이블
-- =============================================================================
-- 목적: composer-db 단독 환경에서 부모 wingui 의 핵심 admin/util 테이블을 미니
--       세트로 보유. 산출물 sync 시 동일 컬럼 구조라 1:1 매칭.
-- 진실 우선순위 (rules/32-sql-schema-verification.md):
--   1) wingui 의 Java Entity (@Column)  ← 기준
--   2) v26.0.0-* 의 가장 최근 DDL
-- =============================================================================

USE T3SMARTSCM;
GO

-- TB_AD_MENU
IF OBJECT_ID('dbo.TB_AD_MENU', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TB_AD_MENU (
        ID              CHAR(32)       NOT NULL,
        PARENT_ID       CHAR(32)       NULL,
        MENU_CD         NVARCHAR(100)  NOT NULL,
        MENU_PATH       NVARCHAR(500)  NULL,
        MENU_SEQ        INT            NULL,
        MENU_FILE_PATH  NVARCHAR(500)  NULL,
        USE_YN          NCHAR(1)       DEFAULT 'Y' NULL,
        CREATE_BY       NVARCHAR(100)  NULL,
        CREATE_DTTM     DATETIME       DEFAULT GETDATE() NULL,
        MODIFY_BY       NVARCHAR(100)  NULL,
        MODIFY_DTTM     DATETIME       NULL,
        CONSTRAINT PK_TB_AD_MENU PRIMARY KEY (ID),
        CONSTRAINT UQ_TB_AD_MENU_CD UNIQUE (MENU_CD)
    );
    CREATE NONCLUSTERED INDEX IX_TB_AD_MENU_PARENT ON dbo.TB_AD_MENU (PARENT_ID);
END
GO

-- TB_AD_LANG_PACK
IF OBJECT_ID('dbo.TB_AD_LANG_PACK', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TB_AD_LANG_PACK (
        LANG_CD       NCHAR(2)       NOT NULL,
        LANG_KEY      NVARCHAR(200)  NOT NULL,
        LANG_VALUE    NVARCHAR(MAX)  NULL,
        CREATE_BY     NVARCHAR(100)  NULL,
        CREATE_DTTM   DATETIME       DEFAULT GETDATE() NULL,
        MODIFY_BY     NVARCHAR(100)  NULL,
        MODIFY_DTTM   DATETIME       NULL,
        CONSTRAINT PK_TB_AD_LANG_PACK PRIMARY KEY (LANG_CD, LANG_KEY)
    );
END
GO

-- TB_AD_USER
IF OBJECT_ID('dbo.TB_AD_USER', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TB_AD_USER (
        ID                    CHAR(32)       NOT NULL,
        USERNAME              NVARCHAR(100)  NOT NULL,
        PASSWORD              NVARCHAR(255)  NULL,
        DISPLAY_NAME          NVARCHAR(200)  NULL,
        EMAIL                 NVARCHAR(200)  NULL,
        ENABLED               NCHAR(1)       DEFAULT 'Y' NULL,
        JTI                   NVARCHAR(255)  NULL,
        SESSION_EXPIRED_DTTM  DATETIME       NULL,
        FAILED_COUNT          INT            DEFAULT 0 NULL,
        LAST_LOGIN_DTTM       DATETIME       NULL,
        LAST_PASSWORD_DTTM    DATETIME       NULL,
        CREATE_BY             NVARCHAR(100)  NULL,
        CREATE_DTTM           DATETIME       DEFAULT GETDATE() NULL,
        MODIFY_BY             NVARCHAR(100)  NULL,
        MODIFY_DTTM           DATETIME       NULL,
        CONSTRAINT PK_TB_AD_USER PRIMARY KEY (ID),
        CONSTRAINT UQ_TB_AD_USER_NM UNIQUE (USERNAME)
    );
END
GO

-- TB_AD_GROUP
IF OBJECT_ID('dbo.TB_AD_GROUP', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TB_AD_GROUP (
        ID            CHAR(32)       NOT NULL,
        GRP_CD        NVARCHAR(100)  NOT NULL,
        GRP_NM        NVARCHAR(200)  NULL,
        USE_YN        NCHAR(1)       DEFAULT 'Y' NULL,
        CREATE_BY     NVARCHAR(100)  NULL,
        CREATE_DTTM   DATETIME       DEFAULT GETDATE() NULL,
        MODIFY_BY     NVARCHAR(100)  NULL,
        MODIFY_DTTM   DATETIME       NULL,
        CONSTRAINT PK_TB_AD_GROUP PRIMARY KEY (ID),
        CONSTRAINT UQ_TB_AD_GROUP UNIQUE (GRP_CD)
    );
END
GO

-- TB_AD_PERMISSION_GROUP
IF OBJECT_ID('dbo.TB_AD_PERMISSION_GROUP', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TB_AD_PERMISSION_GROUP (
        ID            CHAR(32)       NOT NULL,
        GRP_ID        CHAR(32)       NOT NULL,
        MENU_ID       CHAR(32)       NOT NULL,
        PERMISSION_TP NVARCHAR(20)   NOT NULL,
        USABILITY     NCHAR(1)       DEFAULT 'Y' NULL,
        CREATE_BY     NVARCHAR(100)  NULL,
        CREATE_DTTM   DATETIME       DEFAULT GETDATE() NULL,
        MODIFY_BY     NVARCHAR(100)  NULL,
        MODIFY_DTTM   DATETIME       NULL,
        CONSTRAINT PK_TB_AD_PERMISSION_GROUP PRIMARY KEY (ID),
        CONSTRAINT UQ_TB_AD_PERMISSION_GROUP UNIQUE (GRP_ID, MENU_ID, PERMISSION_TP)
    );
    CREATE NONCLUSTERED INDEX IX_TB_AD_PERMISSION_GROUP_MENU ON dbo.TB_AD_PERMISSION_GROUP (MENU_ID);
END
GO

-- TB_AD_MENU_BADGE
IF OBJECT_ID('dbo.TB_AD_MENU_BADGE', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TB_AD_MENU_BADGE (
        ID            CHAR(32)       NOT NULL,
        MENU_ID       CHAR(32)       NOT NULL,
        BADGE_TP      NVARCHAR(40)   NULL,
        BADGE_VALUE   NVARCHAR(255)  NULL,
        USE_YN        NCHAR(1)       DEFAULT 'Y' NULL,
        CREATE_BY     NVARCHAR(100)  NULL,
        CREATE_DTTM   DATETIME       DEFAULT GETDATE() NULL,
        MODIFY_BY     NVARCHAR(100)  NULL,
        MODIFY_DTTM   DATETIME       NULL,
        CONSTRAINT PK_TB_AD_MENU_BADGE PRIMARY KEY (ID)
    );
END
GO

-- TB_AD_MENU_BOOKMARK
IF OBJECT_ID('dbo.TB_AD_MENU_BOOKMARK', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TB_AD_MENU_BOOKMARK (
        ID            CHAR(32)       NOT NULL,
        USER_ID       CHAR(32)       NOT NULL,
        MENU_ID       CHAR(32)       NOT NULL,
        SORT_ORDER    INT            NULL,
        USE_YN        NCHAR(1)       DEFAULT 'Y' NULL,
        CREATE_BY     NVARCHAR(100)  NULL,
        CREATE_DTTM   DATETIME       DEFAULT GETDATE() NULL,
        MODIFY_BY     NVARCHAR(100)  NULL,
        MODIFY_DTTM   DATETIME       NULL,
        CONSTRAINT PK_TB_AD_MENU_BOOKMARK PRIMARY KEY (ID)
    );
END
GO

-- TB_AD_MANUAL
IF OBJECT_ID('dbo.TB_AD_MANUAL', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TB_AD_MANUAL (
        ID             CHAR(32)       NOT NULL,
        MENU_CD        NVARCHAR(100)  NOT NULL,
        LANG_CD        NCHAR(2)       NOT NULL,
        MANUAL_TITLE   NVARCHAR(500)  NULL,
        MANUAL_CONTENT NVARCHAR(MAX)  NULL,
        CREATE_BY      NVARCHAR(100)  NULL,
        CREATE_DTTM    DATETIME       DEFAULT GETDATE() NULL,
        MODIFY_BY      NVARCHAR(100)  NULL,
        MODIFY_DTTM    DATETIME       NULL,
        CONSTRAINT PK_TB_AD_MANUAL PRIMARY KEY (ID)
    );
END
GO

-- TB_UT_USER_INFO — NEW_FROM_COPY 표준 원본이 참조 (rules/30 §5.5)
IF OBJECT_ID('dbo.TB_UT_USER_INFO', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TB_UT_USER_INFO (
        USER_ID       NVARCHAR(50)   NOT NULL,
        USER_NM       NVARCHAR(100)  NULL,
        USER_EMAIL    NVARCHAR(200)  NULL,
        USER_TEL      NVARCHAR(50)   NULL,
        DEPT_CD       NVARCHAR(50)   NULL,
        DEPT_NM       NVARCHAR(200)  NULL,
        POSITION_CD   NVARCHAR(50)   NULL,
        POSITION_NM   NVARCHAR(200)  NULL,
        USER_TP       NVARCHAR(20)   NULL,
        USE_YN        NCHAR(1)       DEFAULT 'Y' NULL,
        JOIN_DT       DATE           NULL,
        REMARK        NVARCHAR(MAX)  NULL,
        CREATE_BY     NVARCHAR(100)  NULL,
        CREATE_DTTM   DATETIME       DEFAULT GETDATE() NULL,
        MODIFY_BY     NVARCHAR(100)  NULL,
        MODIFY_DTTM   DATETIME       NULL,
        CONSTRAINT PK_TB_UT_USER_INFO PRIMARY KEY (USER_ID)
    );
END
GO

PRINT '[02] wingui minimal DDL ready.';
GO

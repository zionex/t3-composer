-- =============================================================================
-- 02. wingui Minimal DDL — Composer SQL 들이 참조하는 wingui 테이블
-- =============================================================================
-- 목적: composer-db 단독 환경에서 부모 wingui 의 핵심 admin/util 테이블을 미니
--       세트로 보유. 산출물 sync 시 동일 컬럼 구조라 1:1 매칭.
-- 진실 우선순위 (rules/32-sql-schema-verification.md):
--   1) wingui 의 Java Entity (@Column)  ← 기준
--   2) v26.0.0-* 의 가장 최근 DDL
-- =============================================================================




-- TB_AD_MENU
    CREATE TABLE IF NOT EXISTS dbo.TB_AD_MENU (
        ID              CHAR(32)       NOT NULL,
        PARENT_ID       CHAR(32)       NULL,
        MENU_CD         varchar(100)  NOT NULL,
        MENU_PATH       varchar(500)  NULL,
        MENU_SEQ        INT            NULL,
        MENU_FILE_PATH  varchar(500)  NULL,
        USE_YN          char(1)       DEFAULT 'Y' NULL,
        CREATE_BY       varchar(100)  NULL,
        CREATE_DTTM     timestamp       DEFAULT now() NULL,
        MODIFY_BY       varchar(100)  NULL,
        MODIFY_DTTM     timestamp       NULL,
        CONSTRAINT PK_TB_AD_MENU PRIMARY KEY (ID),
        CONSTRAINT UQ_TB_AD_MENU_CD UNIQUE (MENU_CD)
    );
    CREATE INDEX IF NOT EXISTS IX_TB_AD_MENU_PARENT ON dbo.TB_AD_MENU (PARENT_ID);


-- TB_AD_LANG_PACK
    CREATE TABLE IF NOT EXISTS dbo.TB_AD_LANG_PACK (
        LANG_CD       char(2)       NOT NULL,
        LANG_KEY      varchar(200)  NOT NULL,
        LANG_VALUE    text  NULL,
        CREATE_BY     varchar(100)  NULL,
        CREATE_DTTM   timestamp       DEFAULT now() NULL,
        MODIFY_BY     varchar(100)  NULL,
        MODIFY_DTTM   timestamp       NULL,
        CONSTRAINT PK_TB_AD_LANG_PACK PRIMARY KEY (LANG_CD, LANG_KEY)
    );


-- TB_AD_USER
    CREATE TABLE IF NOT EXISTS dbo.TB_AD_USER (
        ID                    CHAR(32)       NOT NULL,
        USERNAME              varchar(100)  NOT NULL,
        PASSWORD              varchar(255)  NULL,
        DISPLAY_NAME          varchar(200)  NULL,
        EMAIL                 varchar(200)  NULL,
        ENABLED               char(1)       DEFAULT 'Y' NULL,
        JTI                   varchar(255)  NULL,
        SESSION_EXPIRED_DTTM  timestamp       NULL,
        FAILED_COUNT          INT            DEFAULT 0 NULL,
        LAST_LOGIN_DTTM       timestamp       NULL,
        LAST_PASSWORD_DTTM    timestamp       NULL,
        CREATE_BY             varchar(100)  NULL,
        CREATE_DTTM           timestamp       DEFAULT now() NULL,
        MODIFY_BY             varchar(100)  NULL,
        MODIFY_DTTM           timestamp       NULL,
        CONSTRAINT PK_TB_AD_USER PRIMARY KEY (ID),
        CONSTRAINT UQ_TB_AD_USER_NM UNIQUE (USERNAME)
    );


-- TB_AD_GROUP
    CREATE TABLE IF NOT EXISTS dbo.TB_AD_GROUP (
        ID            CHAR(32)       NOT NULL,
        GRP_CD        varchar(100)  NOT NULL,
        GRP_NM        varchar(200)  NULL,
        USE_YN        char(1)       DEFAULT 'Y' NULL,
        CREATE_BY     varchar(100)  NULL,
        CREATE_DTTM   timestamp       DEFAULT now() NULL,
        MODIFY_BY     varchar(100)  NULL,
        MODIFY_DTTM   timestamp       NULL,
        CONSTRAINT PK_TB_AD_GROUP PRIMARY KEY (ID),
        CONSTRAINT UQ_TB_AD_GROUP UNIQUE (GRP_CD)
    );


-- TB_AD_PERMISSION_GROUP
    CREATE TABLE IF NOT EXISTS dbo.TB_AD_PERMISSION_GROUP (
        ID            CHAR(32)       NOT NULL,
        GRP_ID        CHAR(32)       NOT NULL,
        MENU_ID       CHAR(32)       NOT NULL,
        PERMISSION_TP varchar(20)   NOT NULL,
        USABILITY     char(1)       DEFAULT 'Y' NULL,
        CREATE_BY     varchar(100)  NULL,
        CREATE_DTTM   timestamp       DEFAULT now() NULL,
        MODIFY_BY     varchar(100)  NULL,
        MODIFY_DTTM   timestamp       NULL,
        CONSTRAINT PK_TB_AD_PERMISSION_GROUP PRIMARY KEY (ID),
        CONSTRAINT UQ_TB_AD_PERMISSION_GROUP UNIQUE (GRP_ID, MENU_ID, PERMISSION_TP)
    );
    CREATE INDEX IF NOT EXISTS IX_TB_AD_PERMISSION_GROUP_MENU ON dbo.TB_AD_PERMISSION_GROUP (MENU_ID);


-- TB_AD_MENU_BADGE
    CREATE TABLE IF NOT EXISTS dbo.TB_AD_MENU_BADGE (
        ID            CHAR(32)       NOT NULL,
        MENU_ID       CHAR(32)       NOT NULL,
        BADGE_TP      varchar(40)   NULL,
        BADGE_VALUE   varchar(255)  NULL,
        USE_YN        char(1)       DEFAULT 'Y' NULL,
        CREATE_BY     varchar(100)  NULL,
        CREATE_DTTM   timestamp       DEFAULT now() NULL,
        MODIFY_BY     varchar(100)  NULL,
        MODIFY_DTTM   timestamp       NULL,
        CONSTRAINT PK_TB_AD_MENU_BADGE PRIMARY KEY (ID)
    );


-- TB_AD_MENU_BOOKMARK
    CREATE TABLE IF NOT EXISTS dbo.TB_AD_MENU_BOOKMARK (
        ID            CHAR(32)       NOT NULL,
        USER_ID       CHAR(32)       NOT NULL,
        MENU_ID       CHAR(32)       NOT NULL,
        SORT_ORDER    INT            NULL,
        USE_YN        char(1)       DEFAULT 'Y' NULL,
        CREATE_BY     varchar(100)  NULL,
        CREATE_DTTM   timestamp       DEFAULT now() NULL,
        MODIFY_BY     varchar(100)  NULL,
        MODIFY_DTTM   timestamp       NULL,
        CONSTRAINT PK_TB_AD_MENU_BOOKMARK PRIMARY KEY (ID)
    );


-- TB_AD_MANUAL
    CREATE TABLE IF NOT EXISTS dbo.TB_AD_MANUAL (
        ID             CHAR(32)       NOT NULL,
        MENU_CD        varchar(100)  NOT NULL,
        LANG_CD        char(2)       NOT NULL,
        MANUAL_TITLE   varchar(500)  NULL,
        MANUAL_CONTENT text  NULL,
        CREATE_BY      varchar(100)  NULL,
        CREATE_DTTM    timestamp       DEFAULT now() NULL,
        MODIFY_BY      varchar(100)  NULL,
        MODIFY_DTTM    timestamp       NULL,
        CONSTRAINT PK_TB_AD_MANUAL PRIMARY KEY (ID)
    );


-- TB_UT_USER_INFO — NEW_FROM_COPY 표준 원본이 참조 (rules/30 §5.5)
    CREATE TABLE IF NOT EXISTS dbo.TB_UT_USER_INFO (
        USER_ID       varchar(50)   NOT NULL,
        USER_NM       varchar(100)  NULL,
        USER_EMAIL    varchar(200)  NULL,
        USER_TEL      varchar(50)   NULL,
        DEPT_CD       varchar(50)   NULL,
        DEPT_NM       varchar(200)  NULL,
        POSITION_CD   varchar(50)   NULL,
        POSITION_NM   varchar(200)  NULL,
        USER_TP       varchar(20)   NULL,
        USE_YN        char(1)       DEFAULT 'Y' NULL,
        JOIN_DT       DATE           NULL,
        REMARK        text  NULL,
        CREATE_BY     varchar(100)  NULL,
        CREATE_DTTM   timestamp       DEFAULT now() NULL,
        MODIFY_BY     varchar(100)  NULL,
        MODIFY_DTTM   timestamp       NULL,
        CONSTRAINT PK_TB_UT_USER_INFO PRIMARY KEY (USER_ID)
    );


\echo '[02] wingui minimal DDL ready.'


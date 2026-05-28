-- =============================================================
-- T3Composer (Stage 1) : 테이블 · 메뉴 · 다국어 등록
-- =============================================================
-- Version : v26.0.0
-- Created : 2026-04-22
-- Tool    : DBeaver 호환 (GO 배치 구분자 미사용, 세미콜론만 사용)
-- 내용   :
--   1) TB_IS_COMPOSER_SESSION   - Composer 작업 세션
--   2) TB_IS_COMPOSER_MESSAGE   - Claude 채팅 메시지 이력
--   3) TB_IS_COMPOSER_ARTIFACT  - 생성된 코드 아티팩트
--   4) 메뉴 : 유틸 > T3Composer > Composer 등록
--   5) 다국어 라벨 (ko/en/ja/zh)
-- =============================================================


-- -------------------------------------------------------------
-- 1) TB_IS_COMPOSER_SESSION
-- -------------------------------------------------------------
    DROP TABLE IF EXISTS dbo.TB_IS_COMPOSER_ARTIFACT;

    DROP TABLE IF EXISTS dbo.TB_IS_COMPOSER_MESSAGE;

    DROP TABLE IF EXISTS dbo.TB_IS_COMPOSER_SESSION;


CREATE TABLE IF NOT EXISTS dbo.TB_IS_COMPOSER_SESSION (
    ID               VARCHAR(32)   NOT NULL,                                -- UUID (REPLACE(gen_random_uuid()::text,'-',''))
    USER_ID          CHAR(32)      NOT NULL,                                -- FK → TB_AD_USER.ID
    MODE             VARCHAR(32)   NOT NULL,                                -- NEW_GENERAL | NEW_FROM_DESIGN | EXISTING_MODIFY
    TARGET_MENU_CD   varchar(255) NULL,                                    -- EXISTING_MODIFY 일 때 대상 MENU_CD
    TITLE            varchar(255) NULL,                                    -- 사용자 입력 제목 (자동 생성 가능)
    MODEL_NAME       VARCHAR(100)  NULL,                                    -- 사용 모델 (claude-opus-4-5 등)
    STATUS           VARCHAR(20)   DEFAULT 'ACTIVE' NULL,                   -- ACTIVE | COMPLETED | ARCHIVED
    TOTAL_IN_TOKENS  INT           DEFAULT 0 NULL,
    TOTAL_OUT_TOKENS INT           DEFAULT 0 NULL,
    DESIGN_DOC_NAME  varchar(255) NULL,                                    -- NEW_FROM_DESIGN 일 때 업로드 파일명
    DESIGN_DOC_JSON  text NULL,                                    -- 파싱된 설계서 JSON
    CREATE_BY        varchar(100) NULL,
    CREATE_DTTM      timestamp      DEFAULT now() NULL,
    MODIFY_BY        varchar(100) NULL,
    MODIFY_DTTM      timestamp      NULL,
    CONSTRAINT PK_TB_IS_COMPOSER_SESSION PRIMARY KEY (ID)
);

CREATE INDEX IF NOT EXISTS IX_TB_IS_COMPOSER_SESSION_USER   ON dbo.TB_IS_COMPOSER_SESSION (USER_ID ASC);
CREATE INDEX IF NOT EXISTS IX_TB_IS_COMPOSER_SESSION_MODE   ON dbo.TB_IS_COMPOSER_SESSION (MODE ASC);
CREATE INDEX IF NOT EXISTS IX_TB_IS_COMPOSER_SESSION_STATUS ON dbo.TB_IS_COMPOSER_SESSION (STATUS ASC);

-- 화면 생성 rule 선별 scope (2026-05-28) — 기존 DB 에도 멱등 적용
ALTER TABLE dbo.TB_IS_COMPOSER_SESSION ADD COLUMN IF NOT EXISTS RULE_SCOPE varchar(40);

-- EXEC sys.sp_addextendedproperty
--     @name = 'MS_Description',
--     @value = 'T3Composer 작업 세션. 신규개발(일반/설계서기반)·기존수정 모드별 대화 컨테이너.',
--     @level0type = 'Schema', @level0name = 'dbo',
--     @level1type = 'Table',  @level1name = 'TB_IS_COMPOSER_SESSION';


-- -------------------------------------------------------------
-- 2) TB_IS_COMPOSER_MESSAGE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dbo.TB_IS_COMPOSER_MESSAGE (
    ID            VARCHAR(32)   NOT NULL,                                   -- UUID
    SESSION_ID    VARCHAR(32)   NOT NULL,                                   -- FK → TB_IS_COMPOSER_SESSION.ID
    TURN_SEQ      INT           NOT NULL,                                   -- 대화 순서
    ROLE          VARCHAR(16)   NOT NULL,                                   -- user | assistant | system | tool
    CONTENT       text NULL,                                       -- 메시지 본문
    STOP_REASON   VARCHAR(32)   NULL,                                       -- end_turn | max_tokens | tool_use | stop_sequence
    INPUT_TOKENS  INT           DEFAULT 0 NULL,
    OUTPUT_TOKENS INT           DEFAULT 0 NULL,
    MODEL_NAME    VARCHAR(100)  NULL,                                       -- 모델 (claude-opus-4-5 등)
    METADATA      text NULL,                                       -- JSON (tool_use_id, attachment refs 등)
    CREATE_DTTM   timestamp      DEFAULT now() NOT NULL,
    CONSTRAINT PK_TB_IS_COMPOSER_MESSAGE PRIMARY KEY (ID),
    CONSTRAINT UQ_TB_IS_COMPOSER_MESSAGE UNIQUE (SESSION_ID, TURN_SEQ),
    CONSTRAINT FK_TB_IS_COMPOSER_MESSAGE_SESSION FOREIGN KEY (SESSION_ID)
        REFERENCES dbo.TB_IS_COMPOSER_SESSION(ID)
);

CREATE INDEX IF NOT EXISTS IX_TB_IS_COMPOSER_MESSAGE_SESSION
    ON dbo.TB_IS_COMPOSER_MESSAGE (SESSION_ID ASC, TURN_SEQ ASC);

-- EXEC sys.sp_addextendedproperty
--     @name = 'MS_Description',
--     @value = 'Composer 세션 내 사용자·Claude 채팅 메시지 이력',
--     @level0type = 'Schema', @level0name = 'dbo',
--     @level1type = 'Table',  @level1name = 'TB_IS_COMPOSER_MESSAGE';


-- -------------------------------------------------------------
-- 3) TB_IS_COMPOSER_ARTIFACT
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dbo.TB_IS_COMPOSER_ARTIFACT (
    ID            VARCHAR(32)    NOT NULL,                                  -- UUID
    SESSION_ID    VARCHAR(32)    NOT NULL,                                  -- FK → SESSION
    MESSAGE_ID    VARCHAR(32)    NULL,                                      -- 생성 메시지 (assistant) 참조
    ARTIFACT_TYPE VARCHAR(40)    NOT NULL,                                  -- SCREEN_JSX | JAVA_CONTROLLER | JAVA_SERVICE | JAVA_REPOSITORY | JAVA_ENTITY | SQL_DDL | SQL_SP | MENU_SQL | MENUS_JS_PATCH | DESIGN_DOC_UPLOAD | SOURCE_SNAPSHOT | OTHER
    FILE_PATH     varchar(500)  NULL,                                      -- 권장 배치 경로
    FILE_NAME     varchar(255)  NULL,
    LANGUAGE      VARCHAR(32)    NULL,                                      -- jsx | java | sql | json | markdown
    CONTENT       text  NULL,                                      -- 텍스트 아티팩트
    CONTENT_BIN   bytea NULL,                                      -- Excel 업로드 등 바이너리
    VERSION_NO    INT            DEFAULT 1 NULL,                            -- 동일 아티팩트 재생성 시 증가
    STATUS        VARCHAR(20)    DEFAULT 'DRAFT' NULL,                      -- DRAFT | FINAL | DISCARDED
    CREATE_BY     varchar(100)  NULL,
    CREATE_DTTM   timestamp       DEFAULT now() NOT NULL,
    CONSTRAINT PK_TB_IS_COMPOSER_ARTIFACT PRIMARY KEY (ID),
    CONSTRAINT FK_TB_IS_COMPOSER_ARTIFACT_SESSION FOREIGN KEY (SESSION_ID)
        REFERENCES dbo.TB_IS_COMPOSER_SESSION(ID)
);

CREATE INDEX IF NOT EXISTS IX_TB_IS_COMPOSER_ARTIFACT_SESSION ON dbo.TB_IS_COMPOSER_ARTIFACT (SESSION_ID ASC);
CREATE INDEX IF NOT EXISTS IX_TB_IS_COMPOSER_ARTIFACT_TYPE    ON dbo.TB_IS_COMPOSER_ARTIFACT (ARTIFACT_TYPE ASC);

-- EXEC sys.sp_addextendedproperty
--     @name = 'MS_Description',
--     @value = 'Composer 생성 코드 아티팩트 (JSX·Java·SQL·메뉴 INSERT·menus.js 패치 등)',
--     @level0type = 'Schema', @level0name = 'dbo',
--     @level1type = 'Table',  @level1name = 'TB_IS_COMPOSER_ARTIFACT';


-- =============================================================
-- 4) 메뉴 등록
-- =============================================================

-- 재실행 대비 기존 항목 제거
DELETE FROM TB_AD_MENU_BADGE
    WHERE MENU_ID IN (SELECT ID FROM TB_AD_MENU WHERE MENU_CD IN ('MENU_UT_T3COMPOSER', 'UI_UT_COMPOSER'));

DELETE FROM TB_AD_MENU_BOOKMARK
    WHERE MENU_ID IN (SELECT ID FROM TB_AD_MENU WHERE MENU_CD IN ('MENU_UT_T3COMPOSER', 'UI_UT_COMPOSER'));

DELETE FROM TB_AD_MANUAL
    WHERE MENU_CD IN ('MENU_UT_T3COMPOSER', 'UI_UT_COMPOSER');

DELETE FROM TB_AD_MENU
    WHERE MENU_CD IN ('MENU_UT_T3COMPOSER', 'UI_UT_COMPOSER');


-- 4-1) MENU_UT_T3COMPOSER — 유틸 하위 그룹
INSERT INTO TB_AD_MENU (ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, USE_YN, CREATE_BY, CREATE_DTTM, MENU_FILE_PATH)
SELECT
    REPLACE(gen_random_uuid()::text, '-', ''),
    ID,
    'MENU_UT_T3COMPOSER',
    '',                                                                   -- 그룹 노드는 경로 없음
    200,
    'Y',
    'system',
    '1970-01-01 00:00:00'::date,
    ''
FROM TB_AD_MENU
WHERE MENU_CD = 'MENU_UTIL';


-- 4-2) UI_UT_COMPOSER — Composer 화면
-- filePath 규약: '/<module>/<ComponentName>' (단일 세그먼트).
-- 실제 파일 위치는 contentStore.js 가 toLowerCase() 로 자동 변환:
--   '/util/T3Composer' → @wingui/view/util/t3composer/T3Composer.jsx
INSERT INTO TB_AD_MENU (ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, USE_YN, CREATE_BY, CREATE_DTTM, MENU_FILE_PATH)
SELECT
    REPLACE(gen_random_uuid()::text, '-', ''),
    ID,
    'UI_UT_COMPOSER',
    '/util/t3composer',
    1,
    'Y',
    'system',
    '1970-01-01 00:00:00'::date,
    '/util/T3Composer'
FROM TB_AD_MENU
WHERE MENU_CD = 'MENU_UT_T3COMPOSER';


-- =============================================================
-- 5) 다국어 라벨
-- =============================================================

DELETE FROM TB_AD_LANG_PACK
    WHERE LANG_KEY IN ('MENU_UT_T3COMPOSER', 'UI_UT_COMPOSER');

-- MENU_UT_T3COMPOSER (그룹)
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE) VALUES ('ko', 'MENU_UT_T3COMPOSER', 'T3Composer');
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE) VALUES ('en', 'MENU_UT_T3COMPOSER', 'T3Composer');
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE) VALUES ('ja', 'MENU_UT_T3COMPOSER', 'T3Composer');
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE) VALUES ('zh', 'MENU_UT_T3COMPOSER', 'T3Composer');

-- UI_UT_COMPOSER (화면)
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE) VALUES ('ko', 'UI_UT_COMPOSER', 'Composer');
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE) VALUES ('en', 'UI_UT_COMPOSER', 'Composer');
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE) VALUES ('ja', 'UI_UT_COMPOSER', 'Composer');
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE) VALUES ('zh', 'UI_UT_COMPOSER', 'Composer');

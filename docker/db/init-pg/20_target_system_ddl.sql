-- =============================================================================
-- 20. Target System 메타 모델 — Composer 가 다중 프로젝트(Target) 지원
-- =============================================================================
-- 목적:
--   T3Series 의 .claude/rules/*.md + hooks/*.sh + 기술스택 메타를 DB 로 이관.
--   다른 프로젝트(예: 다른 회사의 SCM, 다른 도메인의 ERP) 추가 시 Target 만 등록하면
--   composer 가 그 Target 의 규약으로 화면 산출물을 생성한다.
--
-- 핵심 분리:
--   · Composer 자체 DB (PG) ↔ Target 의 운영 DB (MSSQL/Oracle/DB2/PG) — 무관
--   · 산출물 (JSX/Java/SQL) 의 방언은 Target.db_type 을 따라감
-- =============================================================================

-- ===========================================================================
-- 1) TB_CMP_TARGET_SYSTEM — Target 정의 마스터
-- ===========================================================================
CREATE TABLE IF NOT EXISTS dbo.TB_CMP_TARGET_SYSTEM (
    target_cd         varchar(50)   NOT NULL,                -- 'T3SERIES_MSSQL', 'XYZ_ORACLE' 등
    target_name       varchar(200)  NOT NULL,                -- 'T3Series (MSSQL)' 표시명
    description       text          NULL,
    db_type           varchar(20)   NOT NULL,                -- 'MSSQL'|'ORACLE'|'DB2'|'POSTGRESQL'
    db_dialect_class  varchar(200)  NULL,                    -- Hibernate dialect FQCN
    frontend_stack    varchar(50)   NOT NULL DEFAULT 'REACT',-- 'REACT'|'VUE'|'ANGULAR'
    grid_library      varchar(50)   NOT NULL DEFAULT 'REALGRID2', -- 'REALGRID2'|'AGGRID'|'KENDO'
    css_framework     varchar(50)   NOT NULL DEFAULT 'MUI',  -- 'MUI'|'BOOTSTRAP'|'TAILWIND'
    module_codes      jsonb         NULL,                    -- 도메인 코드: [{code:'BF', name:'Baseline Forecasting'}, ...]
    ref_paths         jsonb         NULL,                    -- 외부 source 경로: {wingui:"...", database:"..."}
    artifact_naming   jsonb         NULL,                    -- 산출물 네이밍 규약: {sp_prefix:"SP_UI_", menu_prefix:"UI_", ...}
    is_active         char(1)       NOT NULL DEFAULT 'Y',
    sort_order        int           NULL DEFAULT 100,
    create_by         varchar(100)  NULL,
    create_dttm       timestamp     NOT NULL DEFAULT now(),
    modify_by         varchar(100)  NULL,
    modify_dttm       timestamp     NULL,
    CONSTRAINT PK_TB_CMP_TARGET_SYSTEM PRIMARY KEY (target_cd),
    CONSTRAINT UQ_TB_CMP_TARGET_SYSTEM_NAME UNIQUE (target_name)
);

CREATE INDEX IF NOT EXISTS IX_TB_CMP_TARGET_SYSTEM_ACTIVE
    ON dbo.TB_CMP_TARGET_SYSTEM (is_active, sort_order);

-- ===========================================================================
-- 2) TB_CMP_TARGET_RULE — Target 별 규약 문서
--    .claude/rules/*.md 16개 + CLAUDE.md 핵심 부분이 row 로 들어감.
--    PromptBuilder 가 Target 선택 시 이 테이블에서 동적 load → cache_control=ephemeral 로 시스템 프롬프트 조립.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS dbo.TB_CMP_TARGET_RULE (
    id              varchar(32)   NOT NULL,                 -- UUID
    target_cd       varchar(50)   NOT NULL,                 -- FK → TB_CMP_TARGET_SYSTEM
    rule_code       varchar(100)  NOT NULL,                 -- '10-ontology-first' / '41-composer-generation' / '99-anti-patterns'
    title           varchar(500)  NULL,                     -- 사람용 제목
    content         text          NOT NULL,                 -- markdown 전체 본문
    applies_to      varchar(200)  NULL DEFAULT 'all',       -- 'all'|'invariant'|'NEW_GENERAL,NEW_NL'|...
    priority        int           NOT NULL DEFAULT 100,     -- 시스템 프롬프트 조립 순서
    rule_version    int           NOT NULL DEFAULT 1,       -- 갱신 추적
    source_path     varchar(500)  NULL,                     -- 원본 파일 경로 (예: '.claude/rules/41-composer-generation.md')
    content_hash    varchar(64)   NULL,                     -- SHA-256 (변경 감지)
    use_yn          char(1)       NOT NULL DEFAULT 'Y',
    create_by       varchar(100)  NULL,
    create_dttm     timestamp     NOT NULL DEFAULT now(),
    modify_by       varchar(100)  NULL,
    modify_dttm     timestamp     NULL,
    CONSTRAINT PK_TB_CMP_TARGET_RULE PRIMARY KEY (id),
    CONSTRAINT UQ_TB_CMP_TARGET_RULE_CODE UNIQUE (target_cd, rule_code, rule_version),
    CONSTRAINT FK_TB_CMP_TARGET_RULE_TARGET FOREIGN KEY (target_cd)
        REFERENCES dbo.TB_CMP_TARGET_SYSTEM(target_cd) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS IX_TB_CMP_TARGET_RULE_LOAD
    ON dbo.TB_CMP_TARGET_RULE (target_cd, use_yn, priority, rule_code);

-- ===========================================================================
-- 3) TB_CMP_TARGET_HOOK — Target 별 hook 스크립트
--    Claude Code 의 .claude/hooks/*.sh 와 의미상 동일. Composer 가 검증 hook 으로 직접 실행
--    또는 export 모드 시 Target 의 .claude/hooks/ 폴더에 파일로 출력.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS dbo.TB_CMP_TARGET_HOOK (
    id              varchar(32)   NOT NULL,
    target_cd       varchar(50)   NOT NULL,
    hook_event      varchar(50)   NOT NULL,                 -- 'PreToolUse'|'PostToolUse'|'UserPromptSubmit'|'Stop'|'SessionStart'
    script_name     varchar(200)  NOT NULL,                 -- 예: 'composer-jsx.sh', 'path-convention.sh'
    script_path     varchar(500)  NULL,                     -- 원본 상대 경로 (예: '.claude/hooks/validators/composer-jsx.sh')
    script_content  text          NOT NULL,                 -- 스크립트 본문
    language        varchar(20)   NOT NULL DEFAULT 'bash',  -- 'bash'|'python'|'node'
    matcher         varchar(500)  NULL,                     -- tool name 필터 (Write|Edit 등)
    sort_order      int           NOT NULL DEFAULT 100,
    enabled         char(1)       NOT NULL DEFAULT 'Y',
    content_hash    varchar(64)   NULL,
    create_by       varchar(100)  NULL,
    create_dttm     timestamp     NOT NULL DEFAULT now(),
    modify_by       varchar(100)  NULL,
    modify_dttm     timestamp     NULL,
    CONSTRAINT PK_TB_CMP_TARGET_HOOK PRIMARY KEY (id),
    CONSTRAINT UQ_TB_CMP_TARGET_HOOK_NAME UNIQUE (target_cd, script_name),
    CONSTRAINT FK_TB_CMP_TARGET_HOOK_TARGET FOREIGN KEY (target_cd)
        REFERENCES dbo.TB_CMP_TARGET_SYSTEM(target_cd) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS IX_TB_CMP_TARGET_HOOK_EVENT
    ON dbo.TB_CMP_TARGET_HOOK (target_cd, hook_event, enabled, sort_order);

-- ===========================================================================
-- 4) TB_CMP_TARGET_TEMPLATE — 코드 골격 템플릿 (Entity/Service/Controller/JSX/SP)
--    Composer 가 LLM prompt 에 골격으로 주입. Target 별로 다름.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS dbo.TB_CMP_TARGET_TEMPLATE (
    id              varchar(32)   NOT NULL,
    target_cd       varchar(50)   NOT NULL,
    template_kind   varchar(50)   NOT NULL,                 -- 'ENTITY'|'SERVICE'|'CONTROLLER'|'REPOSITORY'|'JSX_SCREEN'|'SP_QUERY'|'SP_SAVE'|'SP_DELETE'|'MENU_SQL'
    template_name   varchar(200)  NOT NULL,                 -- 'jpa_jdbctemplate_sp' 같은 식별자
    content         text          NOT NULL,
    description     text          NULL,
    is_default      char(1)       NOT NULL DEFAULT 'N',     -- 같은 kind 중 기본
    sort_order      int           NOT NULL DEFAULT 100,
    use_yn          char(1)       NOT NULL DEFAULT 'Y',
    create_by       varchar(100)  NULL,
    create_dttm     timestamp     NOT NULL DEFAULT now(),
    modify_by       varchar(100)  NULL,
    modify_dttm     timestamp     NULL,
    CONSTRAINT PK_TB_CMP_TARGET_TEMPLATE PRIMARY KEY (id),
    CONSTRAINT UQ_TB_CMP_TARGET_TEMPLATE UNIQUE (target_cd, template_kind, template_name),
    CONSTRAINT FK_TB_CMP_TARGET_TEMPLATE_TARGET FOREIGN KEY (target_cd)
        REFERENCES dbo.TB_CMP_TARGET_SYSTEM(target_cd) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS IX_TB_CMP_TARGET_TEMPLATE_KIND
    ON dbo.TB_CMP_TARGET_TEMPLATE (target_cd, template_kind, use_yn);

-- ===========================================================================
-- 5) TB_CMP_TARGET_GRID_SPEC — Grid 표면 API 명세 (Target 별 Grid library 차이 흡수)
--    예: T3Series 의 RealGrid2 BaseGrid 는 items/afterGridCreate/dataProvider 패턴.
--        다른 Target 이 AgGrid 면 columns/onGridReady/api 패턴.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS dbo.TB_CMP_TARGET_GRID_SPEC (
    target_cd       varchar(50)   NOT NULL,
    grid_library    varchar(50)   NOT NULL,                 -- 'REALGRID2'|'AGGRID'|'KENDO'
    spec_json       jsonb         NOT NULL,                 -- API 표면: { columns_prop, create_callback, data_setter, ... }
    sample_jsx      text          NULL,                     -- 동작하는 샘플 JSX
    create_by       varchar(100)  NULL,
    create_dttm     timestamp     NOT NULL DEFAULT now(),
    modify_by       varchar(100)  NULL,
    modify_dttm     timestamp     NULL,
    CONSTRAINT PK_TB_CMP_TARGET_GRID_SPEC PRIMARY KEY (target_cd),
    CONSTRAINT FK_TB_CMP_TARGET_GRID_SPEC_TARGET FOREIGN KEY (target_cd)
        REFERENCES dbo.TB_CMP_TARGET_SYSTEM(target_cd) ON DELETE CASCADE
);

-- ===========================================================================
-- 6) TB_CMP_USER_PREF — 사용자별 마지막 선택 Target
--    composer 메인 진입 시 자동 복원. 다른 Target 으로 전환은 UI dropdown.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS dbo.TB_CMP_USER_PREF (
    user_id           varchar(32)   NOT NULL,
    current_target_cd varchar(50)   NULL,                   -- FK (nullable: 첫 진입)
    last_pref_json    jsonb         NULL,                   -- 미래 확장용 (UI 상태 저장)
    create_dttm       timestamp     NOT NULL DEFAULT now(),
    modify_dttm       timestamp     NULL,
    CONSTRAINT PK_TB_CMP_USER_PREF PRIMARY KEY (user_id),
    CONSTRAINT FK_TB_CMP_USER_PREF_TARGET FOREIGN KEY (current_target_cd)
        REFERENCES dbo.TB_CMP_TARGET_SYSTEM(target_cd) ON DELETE SET NULL
);

\echo '[20] TB_CMP_TARGET_* 메타 모델 6개 테이블 ready.'

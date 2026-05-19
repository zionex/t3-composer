-- =============================================================================
-- 29. Target 별 거버넌스 설정 스냅샷 — TB_CMP_TARGET_SNAPSHOT(_FILE)
-- =============================================================================
-- 목적:
--   Target(T3SERIES 등) 의 거버넌스 설정 파일 — .claude/**, CLAUDE.md, README.md,
--   TROUBLESHOOTING.md, .env, docs/** + TB_CMP_TARGET_SYSTEM 행 — 을 시점 스냅샷으로
--   DB 에 저장. 다른 Target 으로 전환했다가 돌아왔을 때 디스크를 스냅샷 상태로 복원.
--
--   복원은 단순 덮어쓰기가 아니라 동기화: 스냅샷에 없는 파일은 (tracked root 범위 내에서)
--   삭제하여 Target 별 거버넌스를 정확히 격리한다.
--
-- 기존 composer-db 볼륨에는 t3composer_init_done 마커로 자동 미적용 →
--   docker compose exec -T composer-db psql -U composer -d t3composer -v ON_ERROR_STOP=1 \
--     -f /docker-entrypoint-initdb.d/29_target_config_snapshot_ddl.sql
-- (IF NOT EXISTS 라 재실행 안전)
-- =============================================================================

-- ===========================================================================
-- 1) TB_CMP_TARGET_SNAPSHOT — 스냅샷 헤더 (시점 번들)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS dbo.TB_CMP_TARGET_SNAPSHOT (
    id               varchar(32)   NOT NULL,                 -- UUID v7
    target_cd        varchar(50)   NOT NULL,                 -- FK → TB_CMP_TARGET_SYSTEM
    snapshot_no      int           NOT NULL,                 -- target 내 1부터 증가
    label            varchar(200)  NULL,                     -- 표시용 라벨
    snapshot_kind    varchar(20)   NOT NULL DEFAULT 'MANUAL', -- MANUAL | AUTO_BACKUP | SEED
    is_current       char(1)       NOT NULL DEFAULT 'N',     -- target 당 'Y' 1개 (디스크와 일치 간주)
    tracked_roots    text          NOT NULL,                 -- JSON 배열 — 동기화(삭제) 대상 root 목록
    file_count       int           NULL,
    total_bytes      bigint        NULL,
    target_row_json  text          NULL,                     -- TB_CMP_TARGET_SYSTEM 행 직렬화 (db_password 암호문)
    comment          text          NULL,
    create_by        varchar(100)  NULL,
    create_dttm      timestamp     NOT NULL DEFAULT now(),
    CONSTRAINT PK_TB_CMP_TARGET_SNAPSHOT PRIMARY KEY (id),
    CONSTRAINT UQ_TB_CMP_TARGET_SNAPSHOT_NO UNIQUE (target_cd, snapshot_no),
    CONSTRAINT FK_TB_CMP_TARGET_SNAPSHOT_TARGET FOREIGN KEY (target_cd)
        REFERENCES dbo.TB_CMP_TARGET_SYSTEM(target_cd) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS IX_TB_CMP_TARGET_SNAPSHOT_LIST
    ON dbo.TB_CMP_TARGET_SNAPSHOT (target_cd, create_dttm DESC);

-- target 당 is_current='Y' 단 하나만 존재하도록 강제 (부분 유니크 인덱스)
CREATE UNIQUE INDEX IF NOT EXISTS UX_TB_CMP_TARGET_SNAPSHOT_CURRENT
    ON dbo.TB_CMP_TARGET_SNAPSHOT (target_cd) WHERE is_current = 'Y';

-- ===========================================================================
-- 2) TB_CMP_TARGET_SNAPSHOT_FILE — 스냅샷의 개별 파일 행
-- ===========================================================================
CREATE TABLE IF NOT EXISTS dbo.TB_CMP_TARGET_SNAPSHOT_FILE (
    id            varchar(32)    NOT NULL,                   -- UUID v7
    snapshot_id   varchar(32)    NOT NULL,                   -- FK → TB_CMP_TARGET_SNAPSHOT
    rel_path      varchar(1000)  NOT NULL,                   -- 거버넌스 루트 기준 상대경로 (항상 '/')
    tracked_root  varchar(200)   NOT NULL,                   -- 소속 root (복원 삭제 범위 판정)
    file_kind     varchar(20)    NOT NULL,                   -- TEXT | BINARY | SECRET
    is_binary     char(1)        NOT NULL DEFAULT 'N',
    is_encrypted  char(1)        NOT NULL DEFAULT 'N',       -- 시크릿 값 Jasypt 암호화 여부
    executable    char(1)        NOT NULL DEFAULT 'N',       -- hook .sh +x 복원용
    content       text           NULL,                      -- 텍스트 본문 / 시크릿 암호문 (바이너리면 NULL)
    content_bin   bytea          NULL,                      -- 바이너리 원본 (텍스트면 NULL)
    content_hash  varchar(64)    NOT NULL,                  -- 평문/원본 기준 SHA-256 (diff 안정용)
    size_bytes    bigint         NULL,
    create_dttm   timestamp      NOT NULL DEFAULT now(),
    CONSTRAINT PK_TB_CMP_TARGET_SNAPSHOT_FILE PRIMARY KEY (id),
    CONSTRAINT UQ_TB_CMP_TARGET_SNAPSHOT_FILE UNIQUE (snapshot_id, rel_path),
    CONSTRAINT FK_TB_CMP_TARGET_SNAPSHOT_FILE_SNAP FOREIGN KEY (snapshot_id)
        REFERENCES dbo.TB_CMP_TARGET_SNAPSHOT(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS IX_TB_CMP_TARGET_SNAPSHOT_FILE_SNAP
    ON dbo.TB_CMP_TARGET_SNAPSHOT_FILE (snapshot_id);

\echo '[29] TB_CMP_TARGET_SNAPSHOT(_FILE) ready.'

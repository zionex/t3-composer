-- =============================================================================
-- 23. Target System — 운영 DB 접속 정보 컬럼 추가
-- =============================================================================
-- 목적:
--   NEW_FROM_COPY / EXISTING_MODIFY 모드에서 Target 의 운영 wingui DB 에 직접
--   접근해 메뉴/LangPack/SP DDL 등 정확한 데이터를 가져오기 위함.
--   composer-db 외 별도 DataSource 를 Target 별로 동적 생성.
--
-- 새 컬럼:
--   db_url            JDBC URL (예: jdbc:sqlserver://host:1433;databaseName=...)
--   db_username       DB 접속 계정
--   db_password       DB 비밀번호 (※ 추후 Jasypt 암호화 권장 — 현재는 plain)
--   db_driver_class   드라이버 클래스 (선택 — db_type 으로 추정)
--   db_connected_at   마지막 성공 연결 시각 (헬스체크용)
--   db_last_error     마지막 연결 오류 메시지
--
-- 멱등 실행: IF NOT EXISTS 보호.
-- =============================================================================

ALTER TABLE dbo.TB_CMP_TARGET_SYSTEM
    ADD COLUMN IF NOT EXISTS db_url           varchar(500)  NULL,
    ADD COLUMN IF NOT EXISTS db_username      varchar(100)  NULL,
    ADD COLUMN IF NOT EXISTS db_password      varchar(500)  NULL,
    ADD COLUMN IF NOT EXISTS db_driver_class  varchar(200)  NULL,
    ADD COLUMN IF NOT EXISTS db_connected_at  timestamp     NULL,
    ADD COLUMN IF NOT EXISTS db_last_error    text          NULL;

COMMENT ON COLUMN dbo.TB_CMP_TARGET_SYSTEM.db_url IS
    'Target 운영 DB JDBC URL — 비어있으면 직접 접근 비활성 (synced target-mssql 폴백 사용)';
COMMENT ON COLUMN dbo.TB_CMP_TARGET_SYSTEM.db_password IS
    'DB 비밀번호 — 추후 Jasypt 암호화 적용 권장. 현재는 plain text';

-- =============================================================================
-- 24. Target System DB 접속 정보 seed — T3SERIES → 로컬 target-mssql
-- =============================================================================
-- 목적:
--   기본 Target (T3SERIES) 가 docker-compose 의 target-mssql 컨테이너를 가리키도록
--   db_url/계정 자동 등록. PLANNEL / LGES_NEXTSCM 은 다른 환경 가능성이 있어 미등록.
--
-- 멱등 실행: db_url 이 이미 채워져 있으면 (사용자 수동 설정 추정) 덮어쓰지 않음.
-- =============================================================================

UPDATE dbo.TB_CMP_TARGET_SYSTEM
   SET db_url           = 'jdbc:sqlserver://target-mssql:1433;databaseName=T3SMARTSCM;encrypt=true;trustServerCertificate=true',
       db_username      = 'sa',
       db_password      = 'Composer!2026',
       db_driver_class  = 'com.microsoft.sqlserver.jdbc.SQLServerDriver',
       db_last_error    = NULL,
       modify_by        = 'init-seed',
       modify_dttm      = NOW()
 WHERE target_cd = 'T3SERIES'
   AND (db_url IS NULL OR db_url = '');

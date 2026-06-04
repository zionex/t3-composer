-- =============================================================================
-- 30. Target System 메타데이터 seed — 현재 등록된 3개 Target 정의
-- =============================================================================
-- TB_CMP_TARGET_SYSTEM 의 현재 메타데이터(정의·기술스택·모듈·경로·네이밍 규약)를
-- git 으로 버전관리. 새 환경에서 docker compose up 시 이 3개 Target 이 등록된다.
--
-- ★ DB 접속 자격증명(db_url / db_username / db_password / db_driver_class)은 의도적으로 제외.
--   운영/개발 DB 연결정보는 .env 의 TARGET_<CD>_DB_* 환경변수로 관리하며
--   TargetDbConnectionEnvLoader 가 startup 시 주입한다 — 자격증명을 git 에 두지 않는다.
--   → ON CONFLICT DO UPDATE 도 db_* 컬럼은 건드리지 않아 런타임 설정값을 보존한다.
--
-- 스냅샷 데이터(TB_CMP_TARGET_SNAPSHOT*)는 .claude/**·docs/** 파일의 복사본이라
--   git 에 중복 저장하지 않는다 — 새 환경에서는 [스냅샷 저장]으로 재캡처.
--
-- 멱등 — 재실행 안전 (ON CONFLICT DO UPDATE).
-- =============================================================================

INSERT INTO dbo.TB_CMP_TARGET_SYSTEM (
    target_cd, target_name, description, db_type, db_dialect_class,
    frontend_stack, grid_library, css_framework,
    module_codes, ref_paths, artifact_naming,
    is_active, sort_order, source_ref_path, database_ref_path, menu_source,
    create_by, create_dttm
) VALUES
    (
        'T3SERIES', 'T3Series',
        'T3SmartSCM (T3Series) — wingui 단독 구동. MSSQL 2022 운영. RealGrid2 + MUI.',
        'MSSQL', 'org.hibernate.dialect.SQLServerDialect',
        'REACT', 'REALGRID2', 'MUI',
        '[{"code": "AD", "name": "Admin"}, {"code": "BF", "name": "Baseline Forecasting"}, {"code": "CM", "name": "Common Master"}, {"code": "DP", "name": "Demand Planning"}, {"code": "DPD", "name": "DP Dimension"}, {"code": "FO", "name": "Forecast"}, {"code": "FP", "name": "Factory Planning"}, {"code": "IM", "name": "Inventory Management"}, {"code": "MP", "name": "Master Planning"}, {"code": "RP", "name": "Replenishment Planning"}, {"code": "SA", "name": "Sales Aggregation"}, {"code": "SALES", "name": "Sales Report"}, {"code": "SO", "name": "Sales/Stock Order"}, {"code": "UT", "name": "Utility"}]'::jsonb,
        '{"claude": "/workspace/wingui/.claude", "wingui": "/workspace/wingui", "database": "/workspace/database"}'::jsonb,
        '{"sp_prefix": "SP_UI_", "menu_prefix": "UI_", "sp_action_d": "D", "sp_action_q": "Q", "sp_action_s": "S", "table_prefix": "TB_", "audit_columns": ["CREATE_BY", "CREATE_DTTM", "MODIFY_BY", "MODIFY_DTTM"], "menu_group_prefix": "MENU_"}'::jsonb,
        'Y', 10, NULL, NULL, 'DB',
        'seed', now()
    ),
    (
        'PLANNEL', 'PlanNEL',
        'PlanNEL — PostgreSQL · AG-Grid · React + MUI · Liquibase migration.',
        'POSTGRESQL', 'org.hibernate.dialect.PostgreSQLDialect',
        'REACT', 'AGGRID', 'MUI',
        '[{"code": "AD", "name": "Admin"}, {"code": "BF", "name": "Baseline Forecasting"}, {"code": "CM", "name": "Common Master"}, {"code": "DP", "name": "Demand Planning"}, {"code": "DPD", "name": "DP Dimension"}, {"code": "FO", "name": "Forecast"}, {"code": "FP", "name": "Factory Planning"}, {"code": "IM", "name": "Inventory Management"}, {"code": "MP", "name": "Master Planning"}, {"code": "RP", "name": "Replenishment Planning"}, {"code": "SA", "name": "Sales Aggregation"}, {"code": "SALES", "name": "Sales Report"}, {"code": "SO", "name": "Sales/Stock Order"}, {"code": "UT", "name": "Utility"}]'::jsonb,
        '{"claude": "/workspace/wingui/.claude", "wingui": "/workspace/wingui", "database": "/workspace/database"}'::jsonb,
        '{"sp_prefix": "SP_UI_", "menu_prefix": "UI_", "sp_action_d": "D", "sp_action_q": "Q", "sp_action_s": "S", "table_prefix": "TB_", "audit_columns": ["CREATE_BY", "CREATE_DTTM", "MODIFY_BY", "MODIFY_DTTM"], "menu_group_prefix": "MENU_"}'::jsonb,
        'Y', 20, NULL, NULL, 'JS_FILE',
        'seed', now()
    ),
    (
        'LGES_NEXTSCM', 'LGES NextSCM',
        'LGES NextSCM — T3SERIES 메타를 기준으로 초기 등록. 차후 각 시스템 분석 후 분기.',
        'MSSQL', 'org.hibernate.dialect.SQLServerDialect',
        'REACT', 'REALGRID2', 'MUI',
        '[{"code": "AD", "name": "Admin"}, {"code": "BF", "name": "Baseline Forecasting"}, {"code": "CM", "name": "Common Master"}, {"code": "DP", "name": "Demand Planning"}, {"code": "DPD", "name": "DP Dimension"}, {"code": "FO", "name": "Forecast"}, {"code": "FP", "name": "Factory Planning"}, {"code": "IM", "name": "Inventory Management"}, {"code": "MP", "name": "Master Planning"}, {"code": "RP", "name": "Replenishment Planning"}, {"code": "SA", "name": "Sales Aggregation"}, {"code": "SALES", "name": "Sales Report"}, {"code": "SO", "name": "Sales/Stock Order"}, {"code": "UT", "name": "Utility"}]'::jsonb,
        '{"claude": "/workspace/wingui/.claude", "wingui": "/workspace/wingui", "database": "/workspace/database"}'::jsonb,
        '{"sp_prefix": "SP_UI_", "menu_prefix": "UI_", "sp_action_d": "D", "sp_action_q": "Q", "sp_action_s": "S", "table_prefix": "TB_", "audit_columns": ["CREATE_BY", "CREATE_DTTM", "MODIFY_BY", "MODIFY_DTTM"], "menu_group_prefix": "MENU_"}'::jsonb,
        'Y', 30, NULL, NULL, 'DB',
        'seed', now()
    )
ON CONFLICT (target_cd) DO UPDATE SET
    target_name       = EXCLUDED.target_name,
    description       = EXCLUDED.description,
    db_type           = EXCLUDED.db_type,
    db_dialect_class  = EXCLUDED.db_dialect_class,
    frontend_stack    = EXCLUDED.frontend_stack,
    grid_library      = EXCLUDED.grid_library,
    css_framework     = EXCLUDED.css_framework,
    module_codes      = EXCLUDED.module_codes,
    ref_paths         = EXCLUDED.ref_paths,
    artifact_naming   = EXCLUDED.artifact_naming,
    is_active         = EXCLUDED.is_active,
    sort_order        = EXCLUDED.sort_order,
    source_ref_path   = EXCLUDED.source_ref_path,
    database_ref_path = EXCLUDED.database_ref_path,
    menu_source       = EXCLUDED.menu_source,
    modify_by         = 'seed',
    modify_dttm       = now();
-- ※ db_url / db_username / db_password / db_driver_class / db_connected_at / db_last_error
--    는 의도적으로 미갱신 — 런타임(.env / TargetDbConnectionEnvLoader) 설정값 보존.

\echo '[30] TB_CMP_TARGET_SYSTEM 메타데이터 seed (3 targets) ready.'

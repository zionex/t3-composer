-- =============================================================================
-- 21. T3SERIES_MSSQL Target seed
-- =============================================================================
-- 첫 Target — 현재 코드베이스가 가지고 있는 T3Series 환경 (MSSQL + React + RealGrid2 + MUI).
-- Rule/Hook 본문은 별도 import 서비스가 .claude/rules/*.md + hooks/*.sh 를 읽어 채움.
-- =============================================================================

INSERT INTO dbo.TB_CMP_TARGET_SYSTEM (
    target_cd, target_name, description,
    db_type, db_dialect_class,
    frontend_stack, grid_library, css_framework,
    module_codes, ref_paths, artifact_naming,
    is_active, sort_order, create_by
)
VALUES (
    'T3SERIES_MSSQL',
    'T3Series (MSSQL)',
    'T3SmartSCM (T3Series) — wingui 단독 구동. MSSQL 2022 운영. RealGrid2 + MUI.',
    'MSSQL',
    'org.hibernate.dialect.SQLServerDialect',
    'REACT',
    'REALGRID2',
    'MUI',
    -- module_codes — composer 가 SP_UI_<DOMAIN>_* 등에서 사용하는 도메인 enum
    '[
      {"code":"AD",    "name":"Admin"},
      {"code":"BF",    "name":"Baseline Forecasting"},
      {"code":"CM",    "name":"Common Master"},
      {"code":"DP",    "name":"Demand Planning"},
      {"code":"DPD",   "name":"DP Dimension"},
      {"code":"FO",    "name":"Forecast"},
      {"code":"FP",    "name":"Factory Planning"},
      {"code":"IM",    "name":"Inventory Management"},
      {"code":"MP",    "name":"Master Planning"},
      {"code":"RP",    "name":"Replenishment Planning"},
      {"code":"SA",    "name":"Sales Aggregation"},
      {"code":"SALES", "name":"Sales Report"},
      {"code":"SO",    "name":"Sales/Stock Order"},
      {"code":"UT",    "name":"Utility"}
    ]'::jsonb,
    -- ref_paths — composer 가 외부 소스 참조용
    '{
      "wingui":   "/workspace/wingui",
      "database": "/workspace/database",
      "claude":   "/workspace/wingui/.claude"
    }'::jsonb,
    -- artifact_naming — 산출물 네이밍 컨벤션
    '{
      "menu_prefix":      "UI_",
      "menu_group_prefix":"MENU_",
      "sp_prefix":        "SP_UI_",
      "sp_action_q":      "Q",
      "sp_action_s":      "S",
      "sp_action_d":      "D",
      "table_prefix":     "TB_",
      "audit_columns":    ["CREATE_BY","CREATE_DTTM","MODIFY_BY","MODIFY_DTTM"]
    }'::jsonb,
    'Y',
    10,
    'system'
)
ON CONFLICT (target_cd) DO UPDATE SET
    target_name      = EXCLUDED.target_name,
    description      = EXCLUDED.description,
    db_type          = EXCLUDED.db_type,
    db_dialect_class = EXCLUDED.db_dialect_class,
    module_codes     = EXCLUDED.module_codes,
    ref_paths        = EXCLUDED.ref_paths,
    artifact_naming  = EXCLUDED.artifact_naming,
    is_active        = EXCLUDED.is_active,
    sort_order       = EXCLUDED.sort_order,
    modify_by        = 'system',
    modify_dttm      = now();

-- RealGrid2 grid spec — T3Series 가 사용 중인 패턴
INSERT INTO dbo.TB_CMP_TARGET_GRID_SPEC (target_cd, grid_library, spec_json, create_by)
VALUES (
    'T3SERIES_MSSQL',
    'REALGRID2',
    '{
      "columns_prop":    "items",
      "create_callback": "afterGridCreate",
      "callback_args":   ["grid","gridView","dataProvider"],
      "grid_id_type":    "string",
      "data_fill":       "grid.dataProvider.fillJsonData(rows)",
      "data_changes":    "grid.dataProvider.getAllStateRows()",
      "data_row":        "grid.dataProvider.getJsonRow(idx)",
      "column_keys":     {"name":"name","label":"headerText","type":"dataType","align":"textAlignment","editor":"editor"},
      "data_types":      ["text","number","datetime","boolean","group"],
      "alignments":      ["left","center","far"],
      "dropdown_props":  ["useDropdown","lookupDisplay","values","labels"]
    }'::jsonb,
    'system'
)
ON CONFLICT (target_cd) DO UPDATE SET
    spec_json   = EXCLUDED.spec_json,
    modify_by   = 'system',
    modify_dttm = now();

\echo '[21] T3SERIES_MSSQL Target seed ready. Rule/Hook 본문은 import 서비스로 채움.'

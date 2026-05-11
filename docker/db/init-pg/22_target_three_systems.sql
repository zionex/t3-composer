-- =============================================================================
-- 22. Target System 3개 — T3SERIES, PLANNEL, LGES_NEXTSCM
-- =============================================================================
-- 정책: 세부 등록 항목 (module_codes / ref_paths / artifact_naming / Rules / Hooks /
--      grid_spec) 은 T3SERIES 의 내용을 그대로 복제. 추후 각 시스템 분석 후 분기.
--
-- 기존 'T3SERIES_MSSQL' row 는 'T3SERIES' 로 rename (PK 변경 + FK row UPDATE + 기존 row DELETE).
-- =============================================================================

-- =====================================================
-- 1) 기존 T3SERIES_MSSQL → T3SERIES rename
-- =====================================================
INSERT INTO dbo.TB_CMP_TARGET_SYSTEM (
    target_cd, target_name, description, db_type, db_dialect_class,
    frontend_stack, grid_library, css_framework,
    module_codes, ref_paths, artifact_naming,
    is_active, sort_order, create_by
)
SELECT 'T3SERIES', 'T3Series', description, db_type, db_dialect_class,
       frontend_stack, grid_library, css_framework,
       module_codes, ref_paths, artifact_naming,
       is_active, 10, 'system'
  FROM dbo.TB_CMP_TARGET_SYSTEM
 WHERE target_cd = 'T3SERIES_MSSQL'
ON CONFLICT (target_cd) DO NOTHING;

UPDATE dbo.TB_CMP_TARGET_RULE      SET target_cd = 'T3SERIES' WHERE target_cd = 'T3SERIES_MSSQL';
UPDATE dbo.TB_CMP_TARGET_HOOK      SET target_cd = 'T3SERIES' WHERE target_cd = 'T3SERIES_MSSQL';
UPDATE dbo.TB_CMP_TARGET_GRID_SPEC SET target_cd = 'T3SERIES' WHERE target_cd = 'T3SERIES_MSSQL';

DELETE FROM dbo.TB_CMP_TARGET_SYSTEM WHERE target_cd = 'T3SERIES_MSSQL';

-- =====================================================
-- 2) PLANNEL — T3SERIES 메타 복제
-- =====================================================
INSERT INTO dbo.TB_CMP_TARGET_SYSTEM (
    target_cd, target_name, description, db_type, db_dialect_class,
    frontend_stack, grid_library, css_framework,
    module_codes, ref_paths, artifact_naming,
    is_active, sort_order, create_by
)
SELECT 'PLANNEL', 'PlanNEL',
       'PlanNEL — T3SERIES 메타를 기준으로 초기 등록. 차후 각 시스템 분석 후 분기.',
       db_type, db_dialect_class,
       frontend_stack, grid_library, css_framework,
       module_codes, ref_paths, artifact_naming,
       is_active, 20, 'system'
  FROM dbo.TB_CMP_TARGET_SYSTEM
 WHERE target_cd = 'T3SERIES'
ON CONFLICT (target_cd) DO NOTHING;

-- RULE 복제 (PLANNEL)
INSERT INTO dbo.TB_CMP_TARGET_RULE (
    id, target_cd, rule_code, title, content, applies_to, priority,
    rule_version, source_path, content_hash, use_yn, create_by
)
SELECT replace(gen_random_uuid()::text, '-', ''), 'PLANNEL',
       rule_code, title, content, applies_to, priority,
       1, source_path, content_hash, 'Y', 'system'
  FROM dbo.TB_CMP_TARGET_RULE
 WHERE target_cd = 'T3SERIES' AND use_yn = 'Y'
   AND NOT EXISTS (
        SELECT 1 FROM dbo.TB_CMP_TARGET_RULE x
         WHERE x.target_cd = 'PLANNEL' AND x.rule_code = dbo.TB_CMP_TARGET_RULE.rule_code
   );

-- HOOK 복제 (PLANNEL)
INSERT INTO dbo.TB_CMP_TARGET_HOOK (
    id, target_cd, hook_event, script_name, script_path, script_content,
    language, matcher, sort_order, enabled, content_hash, create_by
)
SELECT replace(gen_random_uuid()::text, '-', ''), 'PLANNEL',
       hook_event, script_name, script_path, script_content,
       language, matcher, sort_order, enabled, content_hash, 'system'
  FROM dbo.TB_CMP_TARGET_HOOK
 WHERE target_cd = 'T3SERIES' AND enabled = 'Y'
   AND NOT EXISTS (
        SELECT 1 FROM dbo.TB_CMP_TARGET_HOOK x
         WHERE x.target_cd = 'PLANNEL' AND x.script_name = dbo.TB_CMP_TARGET_HOOK.script_name
   );

-- GRID_SPEC (PLANNEL)
INSERT INTO dbo.TB_CMP_TARGET_GRID_SPEC (target_cd, grid_library, spec_json, sample_jsx, create_by)
SELECT 'PLANNEL', grid_library, spec_json, sample_jsx, 'system'
  FROM dbo.TB_CMP_TARGET_GRID_SPEC
 WHERE target_cd = 'T3SERIES'
ON CONFLICT (target_cd) DO NOTHING;

-- =====================================================
-- 3) LGES_NEXTSCM — T3SERIES 메타 복제
-- =====================================================
INSERT INTO dbo.TB_CMP_TARGET_SYSTEM (
    target_cd, target_name, description, db_type, db_dialect_class,
    frontend_stack, grid_library, css_framework,
    module_codes, ref_paths, artifact_naming,
    is_active, sort_order, create_by
)
SELECT 'LGES_NEXTSCM', 'LGES NextSCM',
       'LGES NextSCM — T3SERIES 메타를 기준으로 초기 등록. 차후 각 시스템 분석 후 분기.',
       db_type, db_dialect_class,
       frontend_stack, grid_library, css_framework,
       module_codes, ref_paths, artifact_naming,
       is_active, 30, 'system'
  FROM dbo.TB_CMP_TARGET_SYSTEM
 WHERE target_cd = 'T3SERIES'
ON CONFLICT (target_cd) DO NOTHING;

-- RULE 복제 (LGES_NEXTSCM)
INSERT INTO dbo.TB_CMP_TARGET_RULE (
    id, target_cd, rule_code, title, content, applies_to, priority,
    rule_version, source_path, content_hash, use_yn, create_by
)
SELECT replace(gen_random_uuid()::text, '-', ''), 'LGES_NEXTSCM',
       rule_code, title, content, applies_to, priority,
       1, source_path, content_hash, 'Y', 'system'
  FROM dbo.TB_CMP_TARGET_RULE
 WHERE target_cd = 'T3SERIES' AND use_yn = 'Y'
   AND NOT EXISTS (
        SELECT 1 FROM dbo.TB_CMP_TARGET_RULE x
         WHERE x.target_cd = 'LGES_NEXTSCM' AND x.rule_code = dbo.TB_CMP_TARGET_RULE.rule_code
   );

-- HOOK 복제 (LGES_NEXTSCM)
INSERT INTO dbo.TB_CMP_TARGET_HOOK (
    id, target_cd, hook_event, script_name, script_path, script_content,
    language, matcher, sort_order, enabled, content_hash, create_by
)
SELECT replace(gen_random_uuid()::text, '-', ''), 'LGES_NEXTSCM',
       hook_event, script_name, script_path, script_content,
       language, matcher, sort_order, enabled, content_hash, 'system'
  FROM dbo.TB_CMP_TARGET_HOOK
 WHERE target_cd = 'T3SERIES' AND enabled = 'Y'
   AND NOT EXISTS (
        SELECT 1 FROM dbo.TB_CMP_TARGET_HOOK x
         WHERE x.target_cd = 'LGES_NEXTSCM' AND x.script_name = dbo.TB_CMP_TARGET_HOOK.script_name
   );

-- GRID_SPEC (LGES_NEXTSCM)
INSERT INTO dbo.TB_CMP_TARGET_GRID_SPEC (target_cd, grid_library, spec_json, sample_jsx, create_by)
SELECT 'LGES_NEXTSCM', grid_library, spec_json, sample_jsx, 'system'
  FROM dbo.TB_CMP_TARGET_GRID_SPEC
 WHERE target_cd = 'T3SERIES'
ON CONFLICT (target_cd) DO NOTHING;

\echo '[22] Target System 3종 (T3SERIES + PLANNEL + LGES_NEXTSCM) 적재 완료.';

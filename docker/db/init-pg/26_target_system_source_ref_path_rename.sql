-- =============================================================================
-- 26. tb_cmp_target_system.wingui_ref_path → source_ref_path 컬럼명 변경.
--
-- 이전 컬럼명 'wingui_ref_path' 는 부모 t3series-wingui 를 가정한 이름이었으나,
-- target 별로 wingui 가 아닌 React SPA (PlanNEL 등) · 다른 프레임워크도 마운트되므로
-- 의미가 더 일반적인 'source_ref_path' 로 변경.
--
-- IF EXISTS 패턴으로 init-pg 재실행 안전.
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'dbo'
           AND table_name = 'tb_cmp_target_system'
           AND column_name = 'wingui_ref_path'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'dbo'
           AND table_name = 'tb_cmp_target_system'
           AND column_name = 'source_ref_path'
    ) THEN
        ALTER TABLE dbo.tb_cmp_target_system RENAME COLUMN wingui_ref_path TO source_ref_path;
    END IF;
END $$;

COMMENT ON COLUMN dbo.tb_cmp_target_system.source_ref_path IS
    'Target 의 frontend/jsx 소스 폴더 컨테이너 안 절대경로. 비어있으면 글로벌 fallback. 예: /workspace/targets/T3SERIES/wingui';

-- =============================================================================
-- 27. tb_cmp_target_system.menu_source 컬럼 추가.
--
-- Target 별 메뉴 트리가 어디서 오는지 분기:
--   'DB'      — TB_AD_MENU + TB_AD_LANG_PACK 조회 (T3SERIES 등 wingui 표준)
--   'JS_FILE' — source 폴더의 JS 파일 파싱 (PlanNEL — src/pages/TabMenuList.js)
--
-- 추후 'JSON_FILE' 등 확장 가능.
-- =============================================================================

ALTER TABLE dbo.tb_cmp_target_system
    ADD COLUMN IF NOT EXISTS menu_source varchar(20) NOT NULL DEFAULT 'DB';

COMMENT ON COLUMN dbo.tb_cmp_target_system.menu_source IS
    '메뉴 트리 소스: DB (TB_AD_MENU 조회) | JS_FILE (TabMenuList.js 파싱) 등';

-- PlanNEL 은 JS 파일 기반
UPDATE dbo.tb_cmp_target_system
   SET menu_source = 'JS_FILE',
       modify_by   = 'composer',
       modify_dttm = now()
 WHERE target_cd = 'PLANNEL';

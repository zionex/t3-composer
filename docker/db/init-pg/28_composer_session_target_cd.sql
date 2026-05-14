-- =============================================================================
-- 28. tb_is_composer_session.target_cd 컬럼 추가.
--
-- Composer 세션이 어느 Target System (T3SERIES / PLANNEL / ...) 을 대상으로
-- 만든 산출물인지 추적. Phase 1 (배선) — Phase 2 의 architecture 별 rule pack
-- 동적 로드를 위한 전제.
--
-- 기존 행: target_cd = NULL → ComposerPromptBuilder 가 글로벌 fallback 동작
--          (현재는 wingui 규약 그대로 적용)
-- =============================================================================

ALTER TABLE dbo.tb_is_composer_session
    ADD COLUMN IF NOT EXISTS target_cd varchar(50);

COMMENT ON COLUMN dbo.tb_is_composer_session.target_cd IS
    '세션의 대상 Target System 코드 (FK → tb_cmp_target_system.target_cd). NULL = 글로벌 fallback (wingui).';

CREATE INDEX IF NOT EXISTS ix_tb_is_composer_session_target
    ON dbo.tb_is_composer_session (target_cd);

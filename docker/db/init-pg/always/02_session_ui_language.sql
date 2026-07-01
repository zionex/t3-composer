-- =============================================================================
-- always/02. tb_is_composer_session.ui_language 컬럼 추가.
--
-- Composer 세션의 UI 언어 (Claude 응답 언어용 — Phase 6 i18n).
-- 'ko' (한국어) | 'en' (English). 산출물 코드는 system prompt 강제로 한국어 유지.
--
-- 멱등 ALTER — 매 docker compose up 마다 실행 가능. 기존 볼륨에도 자동 적용.
-- =============================================================================

ALTER TABLE dbo.tb_is_composer_session
    ADD COLUMN IF NOT EXISTS ui_language varchar(8) DEFAULT 'ko';

UPDATE dbo.tb_is_composer_session SET ui_language = 'ko' WHERE ui_language IS NULL;

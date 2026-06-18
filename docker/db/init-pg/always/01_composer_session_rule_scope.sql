-- =============================================================================
-- always/01. tb_is_composer_session.rule_scope 컬럼 추가.
--
-- 화면 생성 rule pack 선별 scope (2026-05-28 ComposerSession.ruleScope 필드 추가).
--
-- 원래 04_composer_session_message_artifact.sql 에 인라인 ALTER 로 들어있었으나,
-- 멱등 마커(t3composer_init_done) 가 이미 찍혀있는 기존 볼륨에는 04 가 재실행되지
-- 않아 적용 누락. always/ 폴더로 분리해 docker-compose.yml 의 Phase 2 (매 docker
-- compose up 마다 실행) 가 신규 install · 기존 볼륨 양쪽에서 자동 흡수하도록 함
-- (2026-06-18).
--
-- 멱등: ADD COLUMN IF NOT EXISTS — 이미 있으면 no-op.
-- =============================================================================

ALTER TABLE dbo.tb_is_composer_session
    ADD COLUMN IF NOT EXISTS rule_scope varchar(40);

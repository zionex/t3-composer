-- Phase 3+ — Target System 별 ref path 명시 컬럼.
-- Target 별로 source 폴더 (호스트 path) 를 가리킬 수 있다 (TARGET_<CD>_PATH).
--
-- 마운트 모델:
--   docker-compose 가 호스트 폴더를 컨테이너 안 /workspace/targets/<CD>/wingui 로 마운트.
--   wingui_ref_path 는 그 컨테이너 안 절대경로 (예: /workspace/targets/T3SERIES/wingui).
--   (컬럼명 'wingui_ref_path' 는 호환을 위한 잔재 — 의미는 'source 폴더' — 2026-06-04.)
--   값이 비어있으면 TargetPathResolver 가 마운트 convention 으로 자동 해석.
--
-- (2026-06-04) database_ref_path 는 미사용 컬럼으로 잔존 — TARGET_<CD>_DATABASE_PATH
--   env var 와 wingui sync 엔드포인트 제거됨. SQL 산출물은 ArtifactApplyService 가
--   source root (frontend) 안의 mssql/upgrade 또는 staging 으로 fallback.

ALTER TABLE dbo.tb_cmp_target_system
    ADD COLUMN IF NOT EXISTS wingui_ref_path   varchar(500),
    ADD COLUMN IF NOT EXISTS database_ref_path varchar(500);

COMMENT ON COLUMN dbo.tb_cmp_target_system.wingui_ref_path
    IS 'Target 별 wingui 소스 폴더 (컨테이너 안 절대경로). 비어있으면 글로벌 fallback.';
COMMENT ON COLUMN dbo.tb_cmp_target_system.database_ref_path
    IS 'Target 별 database upgrade 폴더 (컨테이너 안 절대경로). 비어있으면 글로벌 fallback.';

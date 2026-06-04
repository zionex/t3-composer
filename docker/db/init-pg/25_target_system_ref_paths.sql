-- Phase 3+ — Target System 별 ref path 명시 컬럼.
-- 기존엔 .env 의 단일 글로벌 source / database 마운트가 모든 Target 에 공유됐다.
-- 이제는 Target 별로 다른 source / database 폴더를 가리킬 수 있다 (TARGET_<CD>_PATH).
--
-- 마운트 모델 (옵션 A — 공통 상위 폴더):
--   docker-compose 의 WORKSPACE_HOST_ROOT 가 /workspace/projects 로 마운트.
--   각 Target 의 wingui_ref_path / database_ref_path 는 컨테이너 안 절대경로
--   (예: /workspace/projects/t3series/t3series-wingui).
--   (컬럼명 'wingui_ref_path' 는 호환을 위한 잔재 — 의미는 'source 폴더' — 2026-06-04.)
--   값이 비어있으면 app.composer.source-ref-path / database-ref-path (글로벌 fallback) 사용.

ALTER TABLE dbo.tb_cmp_target_system
    ADD COLUMN IF NOT EXISTS wingui_ref_path   varchar(500),
    ADD COLUMN IF NOT EXISTS database_ref_path varchar(500);

COMMENT ON COLUMN dbo.tb_cmp_target_system.wingui_ref_path
    IS 'Target 별 wingui 소스 폴더 (컨테이너 안 절대경로). 비어있으면 글로벌 fallback.';
COMMENT ON COLUMN dbo.tb_cmp_target_system.database_ref_path
    IS 'Target 별 database upgrade 폴더 (컨테이너 안 절대경로). 비어있으면 글로벌 fallback.';

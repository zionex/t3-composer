-- 35_ontology_overlay_revert.sql
--
-- tb_cmp_ontology_ext 를 base schema (extension jsonb 만) 로 정돈하는 dev cleanup 마이그레이션.
-- 신규 deploy 환경에서는 두 컬럼이 애초에 존재하지 않아 IF EXISTS 가 no-op 으로 안전 처리.
-- 일부 dev 환경에 잔존하는 실험 컬럼만 제거 — 멱등.
--
-- dev 환경에 적용:
--   docker compose exec -T composer-db psql -U composer -d t3composer \
--       -v ON_ERROR_STOP=1 < docker/db/init-pg/35_ontology_overlay_revert.sql

ALTER TABLE dbo.tb_cmp_ontology_ext
    DROP COLUMN IF EXISTS payload,
    DROP COLUMN IF EXISTS is_deleted;

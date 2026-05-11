-- =============================================================================
-- 00. PG schema 설정 — Composer DB 가 T3Series 와 같은 'dbo' 스키마 사용
-- =============================================================================
-- composer 의 모든 SQL (산출물 + init) 이 'dbo.TB_*' 명시. PG 에서 dbo 스키마를
-- 만들고 search_path 에 추가해서 SQL 수정 없이 그대로 적용 가능하게 한다.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS dbo;

-- 현 세션 + 미래 모든 세션이 dbo, public 순서로 검색
DO $$ BEGIN
    EXECUTE 'ALTER DATABASE ' || quote_ident(current_database()) || ' SET search_path TO dbo, public';
END $$;
SET search_path TO dbo, public;

\echo '[00] dbo schema created, search_path set.';

-- =============================================================================
-- 01. Database 생성 (master 에서 실행)
-- 멱등 — 이미 있으면 skip.
-- =============================================================================

USE master;
GO

IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = 'T3SMARTSCM')
BEGIN
    PRINT '[01] Creating database T3SMARTSCM ...';
    CREATE DATABASE T3SMARTSCM
        COLLATE Korean_Wansung_CI_AS;
END
ELSE
BEGIN
    PRINT '[01] Database T3SMARTSCM already exists. skip.';
END
GO

PRINT '[01] DONE - database ready.';
GO

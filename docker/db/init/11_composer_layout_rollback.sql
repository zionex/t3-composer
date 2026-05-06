-- =============================================================
-- T3Composer Layout 갤러리 전면 제거 [MSSQL]
-- =============================================================
-- Version : v26.0.0-20260430
-- Created : 2026-04-30
-- 목적   : Composer Layout 갤러리 (UI_UT_COMPOSER_LAYOUT · TB_IS_COMPOSER_LAYOUT)
--          관련 모든 행 + 테이블 + 메뉴 + 권한 + 다국어 라벨 제거.
--
-- 영향 범위 (모두 idempotent — 재실행 안전):
--   1) TB_IS_COMPOSER_LAYOUT       : 사전 데이터 + 테이블 자체 DROP
--   2) TB_AD_PERMISSION_GROUP       : MENU_ID 매칭 권한 행
--   3) TB_AD_PERMISSION             : MENU_ID 매칭 권한 행
--   4) TB_AD_MENU_BADGE             : MENU_ID 매칭 뱃지
--   5) TB_AD_MENU_BOOKMARK          : MENU_ID 매칭 즐겨찾기
--   6) TB_AD_MANUAL                 : MENU_CD 매칭 매뉴얼
--   7) TB_AD_MENU                   : MENU_CD = 'UI_UT_COMPOSER_LAYOUT'
--   8) TB_AD_LANG_PACK              : LANG_KEY = 'UI_UT_COMPOSER_LAYOUT'
--   9) (선택) TB_IS_COMPOSER_ARTIFACT 의 layout 관련 아티팩트 — 수동 확인 후 cleanup
--
-- 실행 후 필수 조치:
--   · 서버 재시작 또는 LangPackService 캐시 reload (4개 언어):
--     GET /system/lang-packs/{ko|en|ja|zh}/reload
-- =============================================================

SET NOCOUNT ON;

DECLARE @MENU_ID CHAR(32) = (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'UI_UT_COMPOSER_LAYOUT');

PRINT '─── Composer Layout 갤러리 제거 시작 ───';
PRINT '대상 MENU_ID = ' + ISNULL(@MENU_ID, '(이미 삭제됨)');

-- ───────────────────────────────────────────
-- 1) TB_IS_COMPOSER_LAYOUT — 사전 데이터 + 테이블 DROP
-- ───────────────────────────────────────────
IF OBJECT_ID('dbo.TB_IS_COMPOSER_LAYOUT', 'U') IS NOT NULL
BEGIN
    DECLARE @LAYOUT_CNT INT = (SELECT COUNT(*) FROM dbo.TB_IS_COMPOSER_LAYOUT);
    PRINT '  · TB_IS_COMPOSER_LAYOUT 행 수: ' + CAST(@LAYOUT_CNT AS NVARCHAR);
    DROP TABLE dbo.TB_IS_COMPOSER_LAYOUT;
    PRINT '  · TB_IS_COMPOSER_LAYOUT DROP TABLE 완료';
END
ELSE
BEGIN
    PRINT '  · TB_IS_COMPOSER_LAYOUT 테이블 미존재 — skip';
END

-- ───────────────────────────────────────────
-- 2~6) 메뉴 ID 매칭 행 — MENU_ID 가 NULL 이어도 NOT EXISTS 로 안전
-- ───────────────────────────────────────────
IF @MENU_ID IS NOT NULL
BEGIN
    DECLARE @PG_CNT  INT = (SELECT COUNT(*) FROM TB_AD_PERMISSION_GROUP WHERE MENU_ID = @MENU_ID);
    DECLARE @P_CNT   INT = (SELECT COUNT(*) FROM TB_AD_PERMISSION       WHERE MENU_ID = @MENU_ID);
    DECLARE @MB_CNT  INT;
    DECLARE @BM_CNT  INT;

    -- BADGE 테이블이 있으면
    IF OBJECT_ID('dbo.TB_AD_MENU_BADGE', 'U') IS NOT NULL
    BEGIN
        SET @MB_CNT = (SELECT COUNT(*) FROM TB_AD_MENU_BADGE WHERE MENU_ID = @MENU_ID);
        DELETE FROM TB_AD_MENU_BADGE WHERE MENU_ID = @MENU_ID;
        PRINT '  · TB_AD_MENU_BADGE 삭제: ' + CAST(@MB_CNT AS NVARCHAR);
    END

    IF OBJECT_ID('dbo.TB_AD_MENU_BOOKMARK', 'U') IS NOT NULL
    BEGIN
        SET @BM_CNT = (SELECT COUNT(*) FROM TB_AD_MENU_BOOKMARK WHERE MENU_ID = @MENU_ID);
        DELETE FROM TB_AD_MENU_BOOKMARK WHERE MENU_ID = @MENU_ID;
        PRINT '  · TB_AD_MENU_BOOKMARK 삭제: ' + CAST(@BM_CNT AS NVARCHAR);
    END

    DELETE FROM TB_AD_PERMISSION_GROUP WHERE MENU_ID = @MENU_ID;
    PRINT '  · TB_AD_PERMISSION_GROUP 삭제: ' + CAST(@PG_CNT AS NVARCHAR);

    DELETE FROM TB_AD_PERMISSION       WHERE MENU_ID = @MENU_ID;
    PRINT '  · TB_AD_PERMISSION 삭제: ' + CAST(@P_CNT AS NVARCHAR);
END

-- ───────────────────────────────────────────
-- 6) TB_AD_MANUAL — MENU_CD 기반
-- ───────────────────────────────────────────
IF OBJECT_ID('dbo.TB_AD_MANUAL', 'U') IS NOT NULL
BEGIN
    DECLARE @MAN_CNT INT = (SELECT COUNT(*) FROM TB_AD_MANUAL WHERE MENU_CD = 'UI_UT_COMPOSER_LAYOUT');
    DELETE FROM TB_AD_MANUAL WHERE MENU_CD = 'UI_UT_COMPOSER_LAYOUT';
    PRINT '  · TB_AD_MANUAL 삭제: ' + CAST(@MAN_CNT AS NVARCHAR);
END

-- ───────────────────────────────────────────
-- 7) TB_AD_MENU — MENU_CD 기반
-- ───────────────────────────────────────────
DELETE FROM TB_AD_MENU WHERE MENU_CD = 'UI_UT_COMPOSER_LAYOUT';
PRINT '  · TB_AD_MENU(UI_UT_COMPOSER_LAYOUT) 삭제: ' + CAST(@@ROWCOUNT AS NVARCHAR);

-- ───────────────────────────────────────────
-- 8) TB_AD_LANG_PACK — LANG_KEY 기반 (4개 언어 모두)
-- ───────────────────────────────────────────
DELETE FROM TB_AD_LANG_PACK WHERE LANG_KEY = 'UI_UT_COMPOSER_LAYOUT';
PRINT '  · TB_AD_LANG_PACK(UI_UT_COMPOSER_LAYOUT) 삭제: ' + CAST(@@ROWCOUNT AS NVARCHAR);

-- ───────────────────────────────────────────
-- 9) (선택) TB_IS_COMPOSER_ARTIFACT — Composer 가 만든 아티팩트 흔적
--    ARTIFACT_TYPE 또는 FILE_PATH 에 t3composerlayout 또는 ComposerLayout 포함된 행
-- ───────────────────────────────────────────
IF OBJECT_ID('dbo.TB_IS_COMPOSER_ARTIFACT', 'U') IS NOT NULL
BEGIN
    DECLARE @ART_CNT INT = (
        SELECT COUNT(*) FROM TB_IS_COMPOSER_ARTIFACT
        WHERE FILE_PATH LIKE '%t3composerlayout%'
           OR FILE_PATH LIKE '%ComposerLayout%'
           OR FILE_PATH LIKE '%composer_layout%'
           OR FILE_NAME LIKE '%ComposerLayout%'
    );
    PRINT '  · TB_IS_COMPOSER_ARTIFACT 후보 행 수: ' + CAST(@ART_CNT AS NVARCHAR)
        + ' (자동 삭제하지 않음 — 검토 후 수동 cleanup 권장)';
END

-- ───────────────────────────────────────────
-- 결과 검증
-- ───────────────────────────────────────────
PRINT '─── 검증 ───';
SELECT 'TB_AD_MENU' AS TARGET, COUNT(*) AS LEFT_CNT FROM TB_AD_MENU WHERE MENU_CD = 'UI_UT_COMPOSER_LAYOUT'
UNION ALL
SELECT 'TB_AD_LANG_PACK',     COUNT(*) FROM TB_AD_LANG_PACK WHERE LANG_KEY = 'UI_UT_COMPOSER_LAYOUT';
-- 두 행 모두 LEFT_CNT = 0 이어야 정상

PRINT '─── Composer Layout 갤러리 제거 완료 ───';

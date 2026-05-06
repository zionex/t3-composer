-- =============================================================
-- T3Composer — 메뉴 다국어 일괄 재적용 [MSSQL]
-- =============================================================
-- Version : v26.0.0-20260423
-- Created : 2026-04-24 · Updated 2026-04-30 (Layout 갤러리 제거)
-- 내용   : 유틸 > T3Composer 하위 메뉴 5개가 좌측 메뉴에서 코드
--          (예: 'UI_UT_COMPOSER_HISTORY') 로 노출되는 증상 해결.
--          원인은 TB_AD_LANG_PACK 행 누락(혹은 캐시 불일치).
--          아래 5개 × 4개 언어 = 20행을 재실행 안전하게 복원.
--
-- 대상 메뉴:
--   MENU_UT_T3COMPOSER       : 그룹 노드 (유틸 > T3 Composer)
--   UI_UT_COMPOSER           : UI Composer
--   UI_UT_COMPOSER_HISTORY   : 사용 이력
--   UI_UT_COMPOSER_PATTERNS  : 화면 패턴 관리
--   UI_UT_COMPOSER_DICT      : Composer 갤러리
--
-- (제거됨 2026-04-30) UI_UT_COMPOSER_LAYOUT — Composer Layout 갤러리.
--   별도 rollback SQL 로 삭제: db_update_script_composer_layout_rollback.sql
--
-- 실행 후 필수 조치 (LangPackService 캐시 반영):
--   방법 A) 서버 재시작
--   방법 B) 각 언어별 reload 엔드포인트 4회 호출 (로그인 상태):
--           GET /system/lang-packs/ko/reload
--           GET /system/lang-packs/en/reload
--           GET /system/lang-packs/ja/reload
--           GET /system/lang-packs/zh/reload
-- =============================================================

SET NOCOUNT ON;

-- 1) 대상 키 전체 제거 (재실행 대비)
DELETE FROM TB_AD_LANG_PACK
 WHERE LANG_KEY IN (
        'MENU_UT_T3COMPOSER',
        'UI_UT_COMPOSER',
        'UI_UT_COMPOSER_HISTORY',
        'UI_UT_COMPOSER_PATTERNS',
        'UI_UT_COMPOSER_DICT');

-- 2) 그룹 노드 — MENU_UT_T3COMPOSER
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM) VALUES
('ko', 'MENU_UT_T3COMPOSER', N'T3 Composer',            N'system', GETDATE()),
('en', 'MENU_UT_T3COMPOSER', N'T3 Composer',            N'system', GETDATE()),
('ja', 'MENU_UT_T3COMPOSER', N'T3 コンポーザー',         N'system', GETDATE()),
('zh', 'MENU_UT_T3COMPOSER', N'T3 生成器',              N'system', GETDATE());

-- 3) UI Composer 본체 — UI_UT_COMPOSER
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM) VALUES
('ko', 'UI_UT_COMPOSER', N'UI Composer',                N'system', GETDATE()),
('en', 'UI_UT_COMPOSER', N'UI Composer',                N'system', GETDATE()),
('ja', 'UI_UT_COMPOSER', N'UI Composer',                N'system', GETDATE()),
('zh', 'UI_UT_COMPOSER', N'UI Composer',                N'system', GETDATE());

-- 4) 사용 이력 — UI_UT_COMPOSER_HISTORY
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM) VALUES
('ko', 'UI_UT_COMPOSER_HISTORY', N'사용 이력',           N'system', GETDATE()),
('en', 'UI_UT_COMPOSER_HISTORY', N'Usage History',      N'system', GETDATE()),
('ja', 'UI_UT_COMPOSER_HISTORY', N'使用履歴',            N'system', GETDATE()),
('zh', 'UI_UT_COMPOSER_HISTORY', N'使用历史',            N'system', GETDATE());

-- 5) 화면 패턴 관리 — UI_UT_COMPOSER_PATTERNS
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM) VALUES
('ko', 'UI_UT_COMPOSER_PATTERNS', N'화면 패턴 관리',     N'system', GETDATE()),
('en', 'UI_UT_COMPOSER_PATTERNS', N'Screen Patterns',   N'system', GETDATE()),
('ja', 'UI_UT_COMPOSER_PATTERNS', N'画面パターン管理',   N'system', GETDATE()),
('zh', 'UI_UT_COMPOSER_PATTERNS', N'屏幕模式管理',       N'system', GETDATE());

-- 6) Composer 갤러리 — UI_UT_COMPOSER_DICT
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM) VALUES
('ko', 'UI_UT_COMPOSER_DICT', N'Composer 갤러리',        N'system', GETDATE()),
('en', 'UI_UT_COMPOSER_DICT', N'Composer Gallery',      N'system', GETDATE()),
('ja', 'UI_UT_COMPOSER_DICT', N'コンポーザーギャラリー',  N'system', GETDATE()),
('zh', 'UI_UT_COMPOSER_DICT', N'生成器画廊',             N'system', GETDATE());

-- (제거됨 2026-04-30) Composer Layout 갤러리 — UI_UT_COMPOSER_LAYOUT


-- =============================================================
-- 결과 검증
-- =============================================================

-- 언어별 매핑 (20행 기대 — 5 메뉴 × 4 언어)
SELECT LANG_KEY, LANG_CD, LANG_VALUE
  FROM TB_AD_LANG_PACK
 WHERE LANG_KEY IN (
        'MENU_UT_T3COMPOSER',
        'UI_UT_COMPOSER',
        'UI_UT_COMPOSER_HISTORY',
        'UI_UT_COMPOSER_PATTERNS',
        'UI_UT_COMPOSER_DICT')
 ORDER BY LANG_KEY,
          CASE LANG_CD WHEN 'ko' THEN 1 WHEN 'en' THEN 2 WHEN 'ja' THEN 3 WHEN 'zh' THEN 4 ELSE 5 END;

-- 건수 검증 — 5 메뉴 × 4 언어 = 20
SELECT COUNT(*) AS TOTAL_LANG_ENTRIES
  FROM TB_AD_LANG_PACK
 WHERE LANG_KEY IN (
        'MENU_UT_T3COMPOSER',
        'UI_UT_COMPOSER',
        'UI_UT_COMPOSER_HISTORY',
        'UI_UT_COMPOSER_PATTERNS',
        'UI_UT_COMPOSER_DICT');

-- 메뉴 자체가 TB_AD_MENU 에 존재하는지도 교차 확인
SELECT m.MENU_CD,
       m.MENU_SEQ,
       m.USE_YN,
       (SELECT COUNT(*) FROM TB_AD_LANG_PACK lp WHERE lp.LANG_KEY = m.MENU_CD) AS LANG_ROWS
  FROM TB_AD_MENU m
 WHERE m.MENU_CD IN (
        'MENU_UT_T3COMPOSER',
        'UI_UT_COMPOSER',
        'UI_UT_COMPOSER_HISTORY',
        'UI_UT_COMPOSER_PATTERNS',
        'UI_UT_COMPOSER_DICT')
 ORDER BY m.MENU_SEQ;

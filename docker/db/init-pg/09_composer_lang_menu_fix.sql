-- =============================================================
-- T3Composer — 메뉴 다국어 (LANG_PACK) 재적용 [MSSQL]
-- =============================================================
-- Version : v26.0.0
-- Created : 2026-04-22
-- 내용   : Composer 관련 모든 메뉴 코드에 대해 ko/en/ja/zh 번역을
--          누락·중복 없이 재등록.
--
--   MENU_UT_T3COMPOSER      : Composer 그룹 메뉴
--   UI_UT_COMPOSER          : 화면 생성기 (Composer)
--   UI_UT_COMPOSER_HISTORY  : 사용 이력
--   UI_UT_COMPOSER_PATTERNS : 화면 패턴 관리
--
-- 기존 문제 : 초기 스크립트에서 ko/en/ja/zh 모두 'T3Composer'·
--            'Composer' 영문으로만 등록되어 있어 한국어 세션에서
--            번역이 '적용 안 된 것처럼' 보이는 이슈 해결.
-- =============================================================


-- 재실행 대비 기존 Composer 메뉴 LANG_KEY 전체 제거
DELETE FROM TB_AD_LANG_PACK
    WHERE LANG_KEY IN (
        'MENU_UT_T3COMPOSER',
        'UI_UT_COMPOSER',
        'UI_UT_COMPOSER_HISTORY',
        'UI_UT_COMPOSER_PATTERNS'
    );


-- -------------------------------------------------------------
-- 1) MENU_UT_T3COMPOSER — Composer 그룹 메뉴
-- -------------------------------------------------------------
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM) VALUES
('ko', 'MENU_UT_T3COMPOSER', 'T3 Composer',          'system', now()),
('en', 'MENU_UT_T3COMPOSER', 'T3 Composer',          'system', now()),
('ja', 'MENU_UT_T3COMPOSER', 'T3 コンポーザー',       'system', now()),
('zh', 'MENU_UT_T3COMPOSER', 'T3 生成器',            'system', now());


-- -------------------------------------------------------------
-- 2) UI_UT_COMPOSER — UI Composer (4개 언어 통합 브랜드명)
-- -------------------------------------------------------------
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM) VALUES
('ko', 'UI_UT_COMPOSER', 'UI Composer',              'system', now()),
('en', 'UI_UT_COMPOSER', 'UI Composer',              'system', now()),
('ja', 'UI_UT_COMPOSER', 'UI Composer',              'system', now()),
('zh', 'UI_UT_COMPOSER', 'UI Composer',              'system', now());


-- -------------------------------------------------------------
-- 3) UI_UT_COMPOSER_HISTORY — 사용 이력
-- -------------------------------------------------------------
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM) VALUES
('ko', 'UI_UT_COMPOSER_HISTORY', '사용 이력',        'system', now()),
('en', 'UI_UT_COMPOSER_HISTORY', 'Usage History',   'system', now()),
('ja', 'UI_UT_COMPOSER_HISTORY', '使用履歴',          'system', now()),
('zh', 'UI_UT_COMPOSER_HISTORY', '使用历史',          'system', now());


-- -------------------------------------------------------------
-- 4) UI_UT_COMPOSER_PATTERNS — 화면 패턴 관리
-- -------------------------------------------------------------
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM) VALUES
('ko', 'UI_UT_COMPOSER_PATTERNS', '화면 패턴 관리',    'system', now()),
('en', 'UI_UT_COMPOSER_PATTERNS', 'Screen Patterns',   'system', now()),
('ja', 'UI_UT_COMPOSER_PATTERNS', '画面パターン管理',   'system', now()),
('zh', 'UI_UT_COMPOSER_PATTERNS', '屏幕模式管理',     'system', now());


-- =============================================================
-- 결과 확인
-- =============================================================
SELECT LANG_KEY, LANG_CD, LANG_VALUE
  FROM TB_AD_LANG_PACK
 WHERE LANG_KEY IN (
        'MENU_UT_T3COMPOSER',
        'UI_UT_COMPOSER',
        'UI_UT_COMPOSER_HISTORY',
        'UI_UT_COMPOSER_PATTERNS')
 ORDER BY LANG_KEY,
          CASE LANG_CD WHEN 'ko' THEN 1 WHEN 'en' THEN 2 WHEN 'ja' THEN 3 WHEN 'zh' THEN 4 ELSE 5 END;

-- 건수 검증 (4 메뉴 × 4 언어 = 16건이어야 정상)
SELECT COUNT(*) AS TOTAL_LANG_ENTRIES
  FROM TB_AD_LANG_PACK
 WHERE LANG_KEY IN (
        'MENU_UT_T3COMPOSER',
        'UI_UT_COMPOSER',
        'UI_UT_COMPOSER_HISTORY',
        'UI_UT_COMPOSER_PATTERNS');
-- =============================================================
-- T3Composer Stage 1 — 메뉴 경로 수정
-- =============================================================
-- 이슈: filePath 는 '/<module>/<ComponentName>' 단일 세그먼트 규약.
-- 초기 스크립트 값 '/util/t3composer/T3Composer' → '/util/T3Composer' 로 교정.
-- path 도 하위 세그먼트 제거: '/util/t3composer/composer' → '/util/t3composer'.
-- =============================================================

UPDATE TB_AD_MENU
SET    MENU_PATH      = '/util/t3composer',
       MENU_FILE_PATH = '/util/T3Composer',
       MODIFY_BY      = 'system',
       MODIFY_DTTM    = now()
WHERE  MENU_CD = 'UI_UT_COMPOSER';

-- 결과 확인
SELECT MENU_CD, MENU_PATH, MENU_FILE_PATH
FROM   TB_AD_MENU
WHERE  MENU_CD IN ('MENU_UT_T3COMPOSER', 'UI_UT_COMPOSER');
-- =============================================================
-- T3Composer — 화면 패턴 관리 메뉴 등록
-- =============================================================
-- Version : v26.0.0 (Stage 7)
-- Created : 2026-04-22
-- =============================================================

-- 재실행 대비 기존 항목 제거
DELETE FROM TB_AD_MENU_BADGE
    WHERE MENU_ID IN (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'UI_UT_COMPOSER_PATTERNS');

DELETE FROM TB_AD_MENU_BOOKMARK
    WHERE MENU_ID IN (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'UI_UT_COMPOSER_PATTERNS');

DELETE FROM TB_AD_MANUAL
    WHERE MENU_CD = 'UI_UT_COMPOSER_PATTERNS';

DELETE FROM TB_AD_MENU
    WHERE MENU_CD = 'UI_UT_COMPOSER_PATTERNS';


-- UI_UT_COMPOSER_PATTERNS
INSERT INTO TB_AD_MENU (ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, USE_YN, CREATE_BY, CREATE_DTTM, MENU_FILE_PATH)
SELECT
    REPLACE(gen_random_uuid()::text, '-', ''),
    ID,
    'UI_UT_COMPOSER_PATTERNS',
    '/util/t3composerpatterns',
    3,
    'Y',
    'system',
    '1970-01-01 00:00:00'::date,
    '/util/T3ComposerPatterns'
FROM TB_AD_MENU
WHERE MENU_CD = 'MENU_UT_T3COMPOSER';


-- 다국어 라벨
DELETE FROM TB_AD_LANG_PACK WHERE LANG_KEY = 'UI_UT_COMPOSER_PATTERNS';

INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE) VALUES ('ko', 'UI_UT_COMPOSER_PATTERNS', '화면 패턴 관리');
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE) VALUES ('en', 'UI_UT_COMPOSER_PATTERNS', 'Screen Patterns');
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE) VALUES ('ja', 'UI_UT_COMPOSER_PATTERNS', '画面パターン管理');
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE) VALUES ('zh', 'UI_UT_COMPOSER_PATTERNS', '屏幕模式管理');

-- 결과 확인
SELECT MENU_CD, MENU_PATH, MENU_FILE_PATH, MENU_SEQ
FROM   TB_AD_MENU
WHERE  MENU_CD LIKE 'UI_UT_COMPOSER%' OR MENU_CD = 'MENU_UT_T3COMPOSER'
ORDER  BY MENU_SEQ;
-- =============================================================
-- T3Composer 메뉴 명칭 변경 — '사전' → '갤러리' [MSSQL]
-- =============================================================
-- 대상 키: UI_UT_COMPOSER_DICT
--   ko: Composer 사전        → Composer 갤러리
--   en: Composer Dictionary  → Composer Gallery
--   ja: コンポーザー辞書        → コンポーザーギャラリー
--   zh: 生成器词典            → 生成器画廊
--
-- 주의: LangPackService 가 서버 시작 시점에 캐싱함.
--       변경 후 서버 재시작 또는 /system/lang-packs/{lang-cd}/reload 호출 필요.
-- =============================================================

UPDATE TB_AD_LANG_PACK
   SET LANG_VALUE  = 'Composer 갤러리',
       MODIFY_BY   = 'system',
       MODIFY_DTTM = now()
 WHERE LANG_KEY = 'UI_UT_COMPOSER_DICT' AND LANG_CD = 'ko';

UPDATE TB_AD_LANG_PACK
   SET LANG_VALUE  = 'Composer Gallery',
       MODIFY_BY   = 'system',
       MODIFY_DTTM = now()
 WHERE LANG_KEY = 'UI_UT_COMPOSER_DICT' AND LANG_CD = 'en';

UPDATE TB_AD_LANG_PACK
   SET LANG_VALUE  = 'コンポーザーギャラリー',
       MODIFY_BY   = 'system',
       MODIFY_DTTM = now()
 WHERE LANG_KEY = 'UI_UT_COMPOSER_DICT' AND LANG_CD = 'ja';

UPDATE TB_AD_LANG_PACK
   SET LANG_VALUE  = '生成器画廊',
       MODIFY_BY   = 'system',
       MODIFY_DTTM = now()
 WHERE LANG_KEY = 'UI_UT_COMPOSER_DICT' AND LANG_CD = 'zh';

-- 결과 확인
SELECT LANG_CD, LANG_KEY, LANG_VALUE
  FROM TB_AD_LANG_PACK
 WHERE LANG_KEY = 'UI_UT_COMPOSER_DICT'
 ORDER BY LANG_CD;
-- =============================================================
-- T3Composer 메인 메뉴 명칭 변경 — '화면 생성기' → 'UI Composer' [MSSQL]
-- =============================================================
-- 대상 키: UI_UT_COMPOSER (화면 생성기 메뉴)
--   ko: 화면 생성기       → UI Composer
--   en: Screen Composer   → UI Composer
--   ja: 画面コンポーザー    → UI Composer
--   zh: 画面生成器         → UI Composer
--
-- 주의: LangPackService 가 서버 시작 시점에 캐싱함.
--       변경 후 서버 재시작 또는 /system/lang-packs/{lang-cd}/reload 호출 필요.
-- =============================================================

UPDATE TB_AD_LANG_PACK
   SET LANG_VALUE  = 'UI Composer',
       MODIFY_BY   = 'system',
       MODIFY_DTTM = now()
 WHERE LANG_KEY = 'UI_UT_COMPOSER'
   AND LANG_CD IN ('ko', 'en', 'ja', 'zh');

-- 결과 확인
SELECT LANG_CD, LANG_KEY, LANG_VALUE
  FROM TB_AD_LANG_PACK
 WHERE LANG_KEY = 'UI_UT_COMPOSER'
 ORDER BY LANG_CD;

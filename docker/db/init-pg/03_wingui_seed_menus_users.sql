-- =============================================================================
-- 03. wingui Seed — 부모 메뉴 9개 + composer-dev 사용자 + 관리자 그룹
-- =============================================================================
-- composer 메뉴 등록 SQL (04_*) 이 PARENT lookup 으로 MENU_UTIL 등을 찾으므로
-- 부모 메뉴들을 미리 시드. wingui 의 실제 메뉴 트리와 동일한 MENU_CD.
-- =============================================================================




-- -----------------------------------------------------------------------------
-- 부모 그룹 메뉴 9개 (Composer 가 생성한 leaf 메뉴의 parent 후보)
-- ID 는 MENU_CD 기반 fixed 32자 문자열로 (재실행 안전 + sync 시 충돌 회피)
-- -----------------------------------------------------------------------------
INSERT INTO dbo.TB_AD_MENU (ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN, CREATE_BY, CREATE_DTTM)
SELECT 'menu0000000000000000000000000001', NULL, 'MENU_UTIL', '', 90, '', 'Y', 'system', now()
 WHERE NOT EXISTS (SELECT 1 FROM dbo.TB_AD_MENU WHERE MENU_CD = 'MENU_UTIL');

INSERT INTO dbo.TB_AD_MENU (ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN, CREATE_BY, CREATE_DTTM)
SELECT 'menu0000000000000000000000000002', NULL, 'MENU_DP',   '', 20, '', 'Y', 'system', now()
 WHERE NOT EXISTS (SELECT 1 FROM dbo.TB_AD_MENU WHERE MENU_CD = 'MENU_DP');

INSERT INTO dbo.TB_AD_MENU (ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN, CREATE_BY, CREATE_DTTM)
SELECT 'menu0000000000000000000000000003', NULL, 'MENU_MP',   '', 30, '', 'Y', 'system', now()
 WHERE NOT EXISTS (SELECT 1 FROM dbo.TB_AD_MENU WHERE MENU_CD = 'MENU_MP');

INSERT INTO dbo.TB_AD_MENU (ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN, CREATE_BY, CREATE_DTTM)
SELECT 'menu0000000000000000000000000004', NULL, 'MENU_FP',   '', 50, '', 'Y', 'system', now()
 WHERE NOT EXISTS (SELECT 1 FROM dbo.TB_AD_MENU WHERE MENU_CD = 'MENU_FP');

INSERT INTO dbo.TB_AD_MENU (ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN, CREATE_BY, CREATE_DTTM)
SELECT 'menu0000000000000000000000000005', NULL, 'MENU_BF',   '', 10, '', 'Y', 'system', now()
 WHERE NOT EXISTS (SELECT 1 FROM dbo.TB_AD_MENU WHERE MENU_CD = 'MENU_BF');

INSERT INTO dbo.TB_AD_MENU (ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN, CREATE_BY, CREATE_DTTM)
SELECT 'menu0000000000000000000000000006', NULL, 'MENU_IM',   '', 60, '', 'Y', 'system', now()
 WHERE NOT EXISTS (SELECT 1 FROM dbo.TB_AD_MENU WHERE MENU_CD = 'MENU_IM');

INSERT INTO dbo.TB_AD_MENU (ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN, CREATE_BY, CREATE_DTTM)
SELECT 'menu0000000000000000000000000007', NULL, 'MENU_RP',   '', 40, '', 'Y', 'system', now()
 WHERE NOT EXISTS (SELECT 1 FROM dbo.TB_AD_MENU WHERE MENU_CD = 'MENU_RP');

INSERT INTO dbo.TB_AD_MENU (ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN, CREATE_BY, CREATE_DTTM)
SELECT 'menu0000000000000000000000000008', NULL, 'MENU_SA',   '', 70, '', 'Y', 'system', now()
 WHERE NOT EXISTS (SELECT 1 FROM dbo.TB_AD_MENU WHERE MENU_CD = 'MENU_SA');

INSERT INTO dbo.TB_AD_MENU (ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN, CREATE_BY, CREATE_DTTM)
SELECT 'menu0000000000000000000000000009', NULL, 'MENU_AD',   '', 80, '', 'Y', 'system', now()
 WHERE NOT EXISTS (SELECT 1 FROM dbo.TB_AD_MENU WHERE MENU_CD = 'MENU_AD');

-- -----------------------------------------------------------------------------
-- 부모 메뉴 다국어 라벨 (ko/en/ja/zh)
-- -----------------------------------------------------------------------------
INSERT INTO dbo.TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM)
SELECT v.LANG_CD, v.LANG_KEY, v.LANG_VALUE, 'system', now()
  FROM (VALUES
    ('ko','MENU_UTIL', '유틸리티'),     ('en','MENU_UTIL', 'Utility'),       ('ja','MENU_UTIL', 'ユーティリティ'), ('zh','MENU_UTIL', '实用工具'),
    ('ko','MENU_DP',   '수요계획'),     ('en','MENU_DP',   'Demand Plan'),   ('ja','MENU_DP',   '需要計画'),       ('zh','MENU_DP',   '需求计划'),
    ('ko','MENU_MP',   '기준계획'),     ('en','MENU_MP',   'Master Plan'),   ('ja','MENU_MP',   'マスタープラン'), ('zh','MENU_MP',   '主计划'),
    ('ko','MENU_FP',   '공장계획'),     ('en','MENU_FP',   'Factory Plan'),  ('ja','MENU_FP',   '工場計画'),       ('zh','MENU_FP',   '工厂计划'),
    ('ko','MENU_BF',   '기준예측'),     ('en','MENU_BF',   'Baseline Forecast'), ('ja','MENU_BF', 'ベースライン予測'), ('zh','MENU_BF', '基线预测'),
    ('ko','MENU_IM',   '재고관리'),     ('en','MENU_IM',   'Inventory'),     ('ja','MENU_IM',   '在庫管理'),       ('zh','MENU_IM',   '库存管理'),
    ('ko','MENU_RP',   '보충계획'),     ('en','MENU_RP',   'Replenishment'), ('ja','MENU_RP',   '補充計画'),       ('zh','MENU_RP',   '补充计划'),
    ('ko','MENU_SA',   '판매집계'),     ('en','MENU_SA',   'Sales'),         ('ja','MENU_SA',   '販売集計'),       ('zh','MENU_SA',   '销售'),
    ('ko','MENU_AD',   '시스템관리'),   ('en','MENU_AD',   'Admin'),         ('ja','MENU_AD',   'システム管理'),   ('zh','MENU_AD',   '系统管理')
  ) v(LANG_CD, LANG_KEY, LANG_VALUE)
 WHERE NOT EXISTS (SELECT 1 FROM dbo.TB_AD_LANG_PACK lp WHERE lp.LANG_CD = v.LANG_CD AND lp.LANG_KEY = v.LANG_KEY);

-- -----------------------------------------------------------------------------
-- composer-dev 사용자 + 관리자 그룹 (mock 인증 대상)
-- -----------------------------------------------------------------------------
INSERT INTO dbo.TB_AD_USER (ID, USERNAME, PASSWORD, DISPLAY_NAME, EMAIL, ENABLED, CREATE_BY, CREATE_DTTM)
SELECT 'user0000000000000000000000000001', 'composer-dev',
       'NOT_USED_DEV_BYPASS', 'Composer Dev', 'dev@composer.local', 'Y', 'system', now()
 WHERE NOT EXISTS (SELECT 1 FROM dbo.TB_AD_USER WHERE USERNAME = 'composer-dev');

INSERT INTO dbo.TB_AD_GROUP (ID, GRP_CD, GRP_NM, USE_YN, CREATE_BY, CREATE_DTTM)
SELECT 'grp00000000000000000000000000001', 'GRP_ADMIN', '시스템관리자', 'Y', 'system', now()
 WHERE NOT EXISTS (SELECT 1 FROM dbo.TB_AD_GROUP WHERE GRP_CD = 'GRP_ADMIN');

\echo '[03] wingui seed (parent menus + dev user) ready.'


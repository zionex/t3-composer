-- ============================================================================
-- 로컬 개발용 시드 데이터 (composer-db / PostgreSQL / t3composer / dbo)
-- 멱등 — 재실행 안전 (ON CONFLICT DO NOTHING / WHERE NOT EXISTS)
--
-- 적용:
--   docker exec -i composer-db psql -U composer -d t3composer -v ON_ERROR_STOP=1 < docker/db/seed_local_dev.sql
--
-- 시드 범위 (사용자 요청 — 2026-05-21):
--   1) tb_ut_user_info — 사용자 정보 30명 (부서/직위/이메일/전화)
--   2) tb_ad_menu      — BF/DP/MP/FP/IM/RP/SA/AD/UTIL 운영 화면 메뉴 25개
--   3) tb_ad_lang_pack — 위 메뉴 4언어 (ko/en/ja/zh)
--   4) tb_ad_group     — GRP_USER / GRP_PLANNER / GRP_VIEWER 추가
--   5) tb_ad_permission_group — 그룹별 메뉴 권한
--   6) tb_is_composer_session/message/artifact — 샘플 세션 5건
-- ============================================================================

SET search_path TO dbo;

-- ============================================================================
-- 1) 사용자 그룹 (tb_ad_group) — GRP_ADMIN 외 추가
-- ============================================================================
INSERT INTO tb_ad_group (id, grp_cd, grp_nm, use_yn, create_by, create_dttm) VALUES
  ('grp00000000000000000000000000002', 'GRP_PLANNER', '계획수립자',      'Y', 'system', now()),
  ('grp00000000000000000000000000003', 'GRP_USER',    '일반사용자',      'Y', 'system', now()),
  ('grp00000000000000000000000000004', 'GRP_VIEWER',  '조회전용',        'Y', 'system', now())
ON CONFLICT (grp_cd) DO NOTHING;

-- ============================================================================
-- 2) 운영 화면 메뉴 (tb_ad_menu)
--    부모: MENU_BF / DP / MP / RP / FP / IM / SA / AD / UTIL (이미 있음)
-- ============================================================================
INSERT INTO tb_ad_menu (id, parent_id, menu_cd, menu_path, menu_seq, menu_file_path, use_yn, create_by, create_dttm) VALUES
  -- BF (기준예측)
  ('menubf00000000000000000000000001', 'menu0000000000000000000000000005', 'UI_BF_ACTUAL_SALES',        '/baselineforecast/master/actualsales',          110, '/baselineforecast/master/ActualSales',       'Y', 'system', now()),
  ('menubf00000000000000000000000002', 'menu0000000000000000000000000005', 'UI_BF_FORECAST_ACCURACY',   '/baselineforecast/report/forecastaccuracy',     120, '/baselineforecast/report/ForecastAccuracy',  'Y', 'system', now()),
  ('menubf00000000000000000000000003', 'menu0000000000000000000000000005', 'UI_BF_MODEL_MGMT',          '/baselineforecast/master/modelmgmt',            130, '/baselineforecast/master/ModelMgmt',         'Y', 'system', now()),
  ('menubf00000000000000000000000004', 'menu0000000000000000000000000005', 'UI_BF_CONTROL_BOARD',       '/baselineforecast/version/controlboard',        140, '/baselineforecast/version/ControlBoard',     'Y', 'system', now()),
  -- DP (수요계획)
  ('menudp00000000000000000000000001', 'menu0000000000000000000000000002', 'UI_DP_MONTHLY_PLAN',        '/demandplan/entry/monthlyplan',                 210, '/demandplan/entry/MonthlyPlan',              'Y', 'system', now()),
  ('menudp00000000000000000000000002', 'menu0000000000000000000000000002', 'UI_DP_WEEKLY_PLAN',         '/demandplan/entry/weeklyplan',                  220, '/demandplan/entry/WeeklyPlan',               'Y', 'system', now()),
  ('menudp00000000000000000000000003', 'menu0000000000000000000000000002', 'UI_DP_ENTRY_NOTIFY',        '/demandplan/entry/entrynotify',                 230, '/demandplan/entry/EntryNotify',              'Y', 'system', now()),
  ('menudp00000000000000000000000004', 'menu0000000000000000000000000002', 'UI_DP_COMPARE_VERSION',     '/demandplan/report/compareversion',             240, '/demandplan/report/CompareVersion',          'Y', 'system', now()),
  -- MP (기준계획)
  ('menump00000000000000000000000001', 'menu0000000000000000000000000003', 'UI_MP_RESOURCE_CAPA',       '/masterplan/master/resourcecapa',               310, '/masterplan/master/ResourceCapa',            'Y', 'system', now()),
  ('menump00000000000000000000000002', 'menu0000000000000000000000000003', 'UI_MP_ITEM_RESOURCE',       '/masterplan/master/itemresource',               320, '/masterplan/master/ItemResource',            'Y', 'system', now()),
  ('menump00000000000000000000000003', 'menu0000000000000000000000000003', 'UI_MP_RTF_ANALYSIS',        '/masterplan/analysisreport/rtfanalysis',        330, '/masterplan/analysisreport/RtfAnalysis',     'Y', 'system', now()),
  ('menump00000000000000000000000004', 'menu0000000000000000000000000003', 'UI_MP_GANTT_CHART',         '/masterplan/result/ganttchart',                 340, '/masterplan/result/GanttChart',              'Y', 'system', now()),
  -- RP (보충계획)
  ('menurp00000000000000000000000001', 'menu0000000000000000000000000007', 'UI_RP_REPLENISHMENT',       '/replenishmentplan/result/replenishment',       410, '/replenishmentplan/result/Replenishment',    'Y', 'system', now()),
  -- FP (공장계획)
  ('menufp00000000000000000000000001', 'menu0000000000000000000000000004', 'UI_FP_WORK_ORDER',          '/factoryplan/result/workorder',                 510, '/factoryplan/result/WorkOrder',              'Y', 'system', now()),
  ('menufp00000000000000000000000002', 'menu0000000000000000000000000004', 'UI_FP_BOM_TREE',            '/factoryplan/master/bomtree',                   520, '/factoryplan/master/BomTree',                'Y', 'system', now()),
  ('menufp00000000000000000000000003', 'menu0000000000000000000000000004', 'UI_FP_RESOURCE_PLAN',       '/factoryplan/result/resourceplan',               530, '/factoryplan/result/ResourcePlan',           'Y', 'system', now()),
  -- IM (재고관리)
  ('menuim00000000000000000000000001', 'menu0000000000000000000000000006', 'UI_IM_SAFETY_STOCK',        '/inventory/master/safetystock',                  610, '/inventory/master/SafetyStock',              'Y', 'system', now()),
  ('menuim00000000000000000000000002', 'menu0000000000000000000000000006', 'UI_IM_ABCXYZ_ANALYSIS',     '/inventory/analysis/abcxyz',                     620, '/inventory/analysis/AbcxyzAnalysis',         'Y', 'system', now()),
  ('menuim00000000000000000000000003', 'menu0000000000000000000000000006', 'UI_IM_SLOW_MOVING',         '/inventory/analysis/slowmoving',                 630, '/inventory/analysis/SlowMoving',             'Y', 'system', now()),
  ('menuim00000000000000000000000004', 'menu0000000000000000000000000006', 'UI_IM_INVENTORY_PLAN',      '/inventory/result/inventoryplan',                640, '/inventory/result/InventoryPlan',            'Y', 'system', now()),
  -- SA (판매집계)
  ('menusa00000000000000000000000001', 'menu0000000000000000000000000008', 'UI_SA_DASHBOARD',           '/sales/dashboard/saleskpi',                      710, '/sales/dashboard/SalesKpi',                  'Y', 'system', now()),
  ('menusa00000000000000000000000002', 'menu0000000000000000000000000008', 'UI_SA_PIVOT_REPORT',        '/sales/report/pivot',                            720, '/sales/report/SalesPivot',                   'Y', 'system', now()),
  -- AD (시스템관리)
  ('menuad00000000000000000000000001', 'menu0000000000000000000000000009', 'UI_AD_USERS',               '/system/usermgmt/users',                         810, '/system/usermgmt/Users',                     'Y', 'system', now()),
  ('menuad00000000000000000000000002', 'menu0000000000000000000000000009', 'UI_AD_MENU_MGMT',           '/system/menumgmt/menumgmt',                      820, '/system/menumgmt/MenuMgmt',                  'Y', 'system', now()),
  ('menuad00000000000000000000000003', 'menu0000000000000000000000000009', 'UI_AD_GROUP_MGMT',          '/system/usermgmt/groupmgmt',                     830, '/system/usermgmt/GroupMgmt',                 'Y', 'system', now()),
  -- UTIL (Composer 외 추가 1)
  ('menuut00000000000000000000000001', 'menu0000000000000000000000000001', 'UI_UT_USER_INFO_MGMT',      '/util/userinfomgmt',                              910, '/util/UserInfoMgmt',                          'Y', 'system', now())
ON CONFLICT (menu_cd) DO NOTHING;

-- ============================================================================
-- 3) 메뉴 다국어 (tb_ad_lang_pack) — 신규 메뉴 26개 × ko/en/ja/zh
-- ============================================================================
INSERT INTO tb_ad_lang_pack (lang_cd, lang_key, lang_value, create_by, create_dttm) VALUES
  -- BF
  ('ko','UI_BF_ACTUAL_SALES',     '실적 판매',           'system', now()),
  ('en','UI_BF_ACTUAL_SALES',     'Actual Sales',         'system', now()),
  ('ja','UI_BF_ACTUAL_SALES',     '実績販売',             'system', now()),
  ('zh','UI_BF_ACTUAL_SALES',     '实际销售',             'system', now()),
  ('ko','UI_BF_FORECAST_ACCURACY','예측 정확도',         'system', now()),
  ('en','UI_BF_FORECAST_ACCURACY','Forecast Accuracy',    'system', now()),
  ('ja','UI_BF_FORECAST_ACCURACY','予測精度',             'system', now()),
  ('zh','UI_BF_FORECAST_ACCURACY','预测精度',             'system', now()),
  ('ko','UI_BF_MODEL_MGMT',       '예측 모델 관리',      'system', now()),
  ('en','UI_BF_MODEL_MGMT',       'Forecast Model',       'system', now()),
  ('ja','UI_BF_MODEL_MGMT',       '予測モデル管理',       'system', now()),
  ('zh','UI_BF_MODEL_MGMT',       '预测模型管理',         'system', now()),
  ('ko','UI_BF_CONTROL_BOARD',    'BF 컨트롤보드',       'system', now()),
  ('en','UI_BF_CONTROL_BOARD',    'BF Control Board',     'system', now()),
  ('ja','UI_BF_CONTROL_BOARD',    'BF コントロールボード','system', now()),
  ('zh','UI_BF_CONTROL_BOARD',    'BF 控制板',            'system', now()),
  -- DP
  ('ko','UI_DP_MONTHLY_PLAN',     '월별 수요계획',       'system', now()),
  ('en','UI_DP_MONTHLY_PLAN',     'Monthly Demand Plan',  'system', now()),
  ('ja','UI_DP_MONTHLY_PLAN',     '月別需要計画',         'system', now()),
  ('zh','UI_DP_MONTHLY_PLAN',     '月度需求计划',         'system', now()),
  ('ko','UI_DP_WEEKLY_PLAN',      '주별 수요계획',       'system', now()),
  ('en','UI_DP_WEEKLY_PLAN',      'Weekly Demand Plan',   'system', now()),
  ('ja','UI_DP_WEEKLY_PLAN',      '週別需要計画',         'system', now()),
  ('zh','UI_DP_WEEKLY_PLAN',      '周需求计划',           'system', now()),
  ('ko','UI_DP_ENTRY_NOTIFY',     '수요 입력 알림',      'system', now()),
  ('en','UI_DP_ENTRY_NOTIFY',     'Demand Entry Notify',  'system', now()),
  ('ja','UI_DP_ENTRY_NOTIFY',     '需要入力通知',         'system', now()),
  ('zh','UI_DP_ENTRY_NOTIFY',     '需求录入通知',         'system', now()),
  ('ko','UI_DP_COMPARE_VERSION',  '버전별 비교',         'system', now()),
  ('en','UI_DP_COMPARE_VERSION',  'Version Compare',      'system', now()),
  ('ja','UI_DP_COMPARE_VERSION',  'バージョン比較',       'system', now()),
  ('zh','UI_DP_COMPARE_VERSION',  '版本比较',             'system', now()),
  -- MP
  ('ko','UI_MP_RESOURCE_CAPA',    '자원 용량',           'system', now()),
  ('en','UI_MP_RESOURCE_CAPA',    'Resource Capacity',    'system', now()),
  ('ja','UI_MP_RESOURCE_CAPA',    'リソース容量',         'system', now()),
  ('zh','UI_MP_RESOURCE_CAPA',    '资源产能',             'system', now()),
  ('ko','UI_MP_ITEM_RESOURCE',    '품목-자원 매핑',      'system', now()),
  ('en','UI_MP_ITEM_RESOURCE',    'Item-Resource',        'system', now()),
  ('ja','UI_MP_ITEM_RESOURCE',    '品目-リソース',         'system', now()),
  ('zh','UI_MP_ITEM_RESOURCE',    '物料-资源',            'system', now()),
  ('ko','UI_MP_RTF_ANALYSIS',     'RTF 충족률 분석',     'system', now()),
  ('en','UI_MP_RTF_ANALYSIS',     'RTF Analysis',         'system', now()),
  ('ja','UI_MP_RTF_ANALYSIS',     'RTF 分析',             'system', now()),
  ('zh','UI_MP_RTF_ANALYSIS',     'RTF 分析',             'system', now()),
  ('ko','UI_MP_GANTT_CHART',      '생산 간트',           'system', now()),
  ('en','UI_MP_GANTT_CHART',      'Production Gantt',     'system', now()),
  ('ja','UI_MP_GANTT_CHART',      '生産ガント',           'system', now()),
  ('zh','UI_MP_GANTT_CHART',      '生产甘特',             'system', now()),
  -- RP
  ('ko','UI_RP_REPLENISHMENT',    '보충 주문',           'system', now()),
  ('en','UI_RP_REPLENISHMENT',    'Replenishment',        'system', now()),
  ('ja','UI_RP_REPLENISHMENT',    '補充注文',             'system', now()),
  ('zh','UI_RP_REPLENISHMENT',    '补充订单',             'system', now()),
  -- FP
  ('ko','UI_FP_WORK_ORDER',       '작업 지시',           'system', now()),
  ('en','UI_FP_WORK_ORDER',       'Work Order',           'system', now()),
  ('ja','UI_FP_WORK_ORDER',       '作業指示',             'system', now()),
  ('zh','UI_FP_WORK_ORDER',       '工单',                 'system', now()),
  ('ko','UI_FP_BOM_TREE',         'BOM 트리',            'system', now()),
  ('en','UI_FP_BOM_TREE',         'BOM Tree',             'system', now()),
  ('ja','UI_FP_BOM_TREE',         'BOM ツリー',           'system', now()),
  ('zh','UI_FP_BOM_TREE',         'BOM 树',               'system', now()),
  ('ko','UI_FP_RESOURCE_PLAN',    'FP 자원 계획',        'system', now()),
  ('en','UI_FP_RESOURCE_PLAN',    'FP Resource Plan',     'system', now()),
  ('ja','UI_FP_RESOURCE_PLAN',    'FP リソース計画',      'system', now()),
  ('zh','UI_FP_RESOURCE_PLAN',    'FP 资源计划',          'system', now()),
  -- IM
  ('ko','UI_IM_SAFETY_STOCK',     '안전재고',            'system', now()),
  ('en','UI_IM_SAFETY_STOCK',     'Safety Stock',         'system', now()),
  ('ja','UI_IM_SAFETY_STOCK',     '安全在庫',             'system', now()),
  ('zh','UI_IM_SAFETY_STOCK',     '安全库存',             'system', now()),
  ('ko','UI_IM_ABCXYZ_ANALYSIS',  'ABC/XYZ 분석',        'system', now()),
  ('en','UI_IM_ABCXYZ_ANALYSIS',  'ABC/XYZ Analysis',     'system', now()),
  ('ja','UI_IM_ABCXYZ_ANALYSIS',  'ABC/XYZ 分析',         'system', now()),
  ('zh','UI_IM_ABCXYZ_ANALYSIS',  'ABC/XYZ 分析',         'system', now()),
  ('ko','UI_IM_SLOW_MOVING',      'Slow Moving 분석',    'system', now()),
  ('en','UI_IM_SLOW_MOVING',      'Slow Moving',          'system', now()),
  ('ja','UI_IM_SLOW_MOVING',      'スローモービング',     'system', now()),
  ('zh','UI_IM_SLOW_MOVING',      '滞销品分析',           'system', now()),
  ('ko','UI_IM_INVENTORY_PLAN',   '재고 계획',           'system', now()),
  ('en','UI_IM_INVENTORY_PLAN',   'Inventory Plan',       'system', now()),
  ('ja','UI_IM_INVENTORY_PLAN',   '在庫計画',             'system', now()),
  ('zh','UI_IM_INVENTORY_PLAN',   '库存计划',             'system', now()),
  -- SA
  ('ko','UI_SA_DASHBOARD',        '판매 KPI 대시보드',   'system', now()),
  ('en','UI_SA_DASHBOARD',        'Sales KPI Dashboard',  'system', now()),
  ('ja','UI_SA_DASHBOARD',        '販売 KPI ダッシュボード','system', now()),
  ('zh','UI_SA_DASHBOARD',        '销售 KPI 看板',         'system', now()),
  ('ko','UI_SA_PIVOT_REPORT',     '판매 피벗 리포트',    'system', now()),
  ('en','UI_SA_PIVOT_REPORT',     'Sales Pivot Report',   'system', now()),
  ('ja','UI_SA_PIVOT_REPORT',     '販売ピボット',         'system', now()),
  ('zh','UI_SA_PIVOT_REPORT',     '销售透视报表',         'system', now()),
  -- AD
  ('ko','UI_AD_USERS',            '사용자 관리',         'system', now()),
  ('en','UI_AD_USERS',            'User Management',      'system', now()),
  ('ja','UI_AD_USERS',            'ユーザー管理',         'system', now()),
  ('zh','UI_AD_USERS',            '用户管理',             'system', now()),
  ('ko','UI_AD_MENU_MGMT',        '메뉴 관리',           'system', now()),
  ('en','UI_AD_MENU_MGMT',        'Menu Management',      'system', now()),
  ('ja','UI_AD_MENU_MGMT',        'メニュー管理',         'system', now()),
  ('zh','UI_AD_MENU_MGMT',        '菜单管理',             'system', now()),
  ('ko','UI_AD_GROUP_MGMT',       '그룹 관리',           'system', now()),
  ('en','UI_AD_GROUP_MGMT',       'Group Management',     'system', now()),
  ('ja','UI_AD_GROUP_MGMT',       'グループ管理',         'system', now()),
  ('zh','UI_AD_GROUP_MGMT',       '组管理',               'system', now()),
  -- UTIL
  ('ko','UI_UT_USER_INFO_MGMT',   '사용자정보 관리',     'system', now()),
  ('en','UI_UT_USER_INFO_MGMT',   'User Info Management', 'system', now()),
  ('ja','UI_UT_USER_INFO_MGMT',   'ユーザー情報管理',     'system', now()),
  ('zh','UI_UT_USER_INFO_MGMT',   '用户信息管理',         'system', now())
ON CONFLICT (lang_cd, lang_key) DO NOTHING;

-- ============================================================================
-- 4) 권한 (tb_ad_permission_group) — 그룹별 메뉴 권한
--    ADMIN  : 모든 메뉴 READ/UPDATE/DELETE
--    PLANNER: BF/DP/MP/FP/IM/RP/SA 메뉴 READ/UPDATE
--    USER   : BF/DP/IM/SA 메뉴 READ
--    VIEWER : 전체 READ
-- ============================================================================
-- ADMIN — 모든 leaf 메뉴 (UI_* prefix) READ/UPDATE/DELETE
INSERT INTO tb_ad_permission_group (id, grp_id, menu_id, permission_tp, usability, create_by, create_dttm)
SELECT  md5('admin-' || m.menu_cd || '-READ'),
        'grp00000000000000000000000000001', m.id, 'READ',   'Y', 'system', now()
  FROM tb_ad_menu m
 WHERE m.menu_cd LIKE 'UI_%'
ON CONFLICT (grp_id, menu_id, permission_tp) DO NOTHING;

INSERT INTO tb_ad_permission_group (id, grp_id, menu_id, permission_tp, usability, create_by, create_dttm)
SELECT  md5('admin-' || m.menu_cd || '-UPDATE'),
        'grp00000000000000000000000000001', m.id, 'UPDATE', 'Y', 'system', now()
  FROM tb_ad_menu m
 WHERE m.menu_cd LIKE 'UI_%'
ON CONFLICT (grp_id, menu_id, permission_tp) DO NOTHING;

INSERT INTO tb_ad_permission_group (id, grp_id, menu_id, permission_tp, usability, create_by, create_dttm)
SELECT  md5('admin-' || m.menu_cd || '-DELETE'),
        'grp00000000000000000000000000001', m.id, 'DELETE', 'Y', 'system', now()
  FROM tb_ad_menu m
 WHERE m.menu_cd LIKE 'UI_%'
ON CONFLICT (grp_id, menu_id, permission_tp) DO NOTHING;

-- PLANNER — BF/DP/MP/FP/IM/RP/SA READ + UPDATE
INSERT INTO tb_ad_permission_group (id, grp_id, menu_id, permission_tp, usability, create_by, create_dttm)
SELECT  md5('planner-' || m.menu_cd || '-READ'),
        'grp00000000000000000000000000002', m.id, 'READ',   'Y', 'system', now()
  FROM tb_ad_menu m
 WHERE m.menu_cd ~ '^UI_(BF|DP|MP|FP|IM|RP|SA)_'
ON CONFLICT (grp_id, menu_id, permission_tp) DO NOTHING;

INSERT INTO tb_ad_permission_group (id, grp_id, menu_id, permission_tp, usability, create_by, create_dttm)
SELECT  md5('planner-' || m.menu_cd || '-UPDATE'),
        'grp00000000000000000000000000002', m.id, 'UPDATE', 'Y', 'system', now()
  FROM tb_ad_menu m
 WHERE m.menu_cd ~ '^UI_(BF|DP|MP|FP|IM|RP|SA)_'
ON CONFLICT (grp_id, menu_id, permission_tp) DO NOTHING;

-- USER — BF/DP/IM/SA READ only
INSERT INTO tb_ad_permission_group (id, grp_id, menu_id, permission_tp, usability, create_by, create_dttm)
SELECT  md5('user-' || m.menu_cd || '-READ'),
        'grp00000000000000000000000000003', m.id, 'READ',   'Y', 'system', now()
  FROM tb_ad_menu m
 WHERE m.menu_cd ~ '^UI_(BF|DP|IM|SA)_'
ON CONFLICT (grp_id, menu_id, permission_tp) DO NOTHING;

-- VIEWER — 모든 leaf READ only
INSERT INTO tb_ad_permission_group (id, grp_id, menu_id, permission_tp, usability, create_by, create_dttm)
SELECT  md5('viewer-' || m.menu_cd || '-READ'),
        'grp00000000000000000000000000004', m.id, 'READ',   'Y', 'system', now()
  FROM tb_ad_menu m
 WHERE m.menu_cd LIKE 'UI_%'
ON CONFLICT (grp_id, menu_id, permission_tp) DO NOTHING;

-- ============================================================================
-- 5) 사용자정보 마스터 (tb_ut_user_info) — 30명
--    부서: IT(전산) · SAL(영업) · PRD(생산) · PUR(구매) · MGT(경영지원)
--    직위: STAFF(사원) · ASST(대리) · MGR(과장) · SR_MGR(차장) · DIR(부장)
-- ============================================================================
INSERT INTO tb_ut_user_info
  (user_id, user_nm, user_email, user_tel, dept_cd, dept_nm, position_cd, position_nm, user_tp, use_yn, join_dt, remark, create_by, create_dttm) VALUES
  -- IT (전산팀)
  ('kim.minjun',   '김민준', 'kim.minjun@t3series.com',   '010-1001-0001', 'IT',  '전산팀',    'DIR',    '부장', 'ADMIN',  'Y', '2018-03-02', '시스템 운영 총괄',     'system', now()),
  ('lee.seoyeon',  '이서연', 'lee.seoyeon@t3series.com',  '010-1001-0002', 'IT',  '전산팀',    'SR_MGR', '차장', 'ADMIN',  'Y', '2019-07-15', '인프라 책임자',       'system', now()),
  ('park.jiho',    '박지호', 'park.jiho@t3series.com',    '010-1001-0003', 'IT',  '전산팀',    'MGR',    '과장', 'NORMAL', 'Y', '2020-04-01', 'DBA',                  'system', now()),
  ('choi.haeun',   '최하은', 'choi.haeun@t3series.com',   '010-1001-0004', 'IT',  '전산팀',    'ASST',   '대리', 'NORMAL', 'Y', '2022-02-14', '프론트엔드 개발',     'system', now()),
  ('jung.dohyun',  '정도현', 'jung.dohyun@t3series.com',  '010-1001-0005', 'IT',  '전산팀',    'STAFF',  '사원', 'NORMAL', 'Y', '2024-01-08', '백엔드 개발',         'system', now()),

  -- SAL (영업팀)
  ('han.jiwoo',    '한지우', 'han.jiwoo@t3series.com',    '010-2002-0001', 'SAL', '영업팀',    'DIR',    '부장', 'NORMAL', 'Y', '2017-05-20', '국내 영업 총괄',       'system', now()),
  ('shin.yuna',    '신유나', 'shin.yuna@t3series.com',    '010-2002-0002', 'SAL', '영업팀',    'SR_MGR', '차장', 'NORMAL', 'Y', '2019-11-03', '해외 영업',           'system', now()),
  ('oh.junwoo',    '오준우', 'oh.junwoo@t3series.com',    '010-2002-0003', 'SAL', '영업팀',    'MGR',    '과장', 'NORMAL', 'Y', '2021-06-21', 'B2B 영업',            'system', now()),
  ('cho.eunjin',   '조은진', 'cho.eunjin@t3series.com',   '010-2002-0004', 'SAL', '영업팀',    'ASST',   '대리', 'NORMAL', 'Y', '2022-09-12', 'KAM 담당',             'system', now()),
  ('kang.sumin',   '강수민', 'kang.sumin@t3series.com',   '010-2002-0005', 'SAL', '영업팀',    'STAFF',  '사원', 'NORMAL', 'Y', '2024-03-04', '신규 사업',           'system', now()),
  ('yoon.taeyang', '윤태양', 'yoon.taeyang@t3series.com', '010-2002-0006', 'SAL', '영업팀',    'STAFF',  '사원', 'GUEST',  'Y', '2025-02-17', '인턴 (영업)',         'system', now()),

  -- PRD (생산팀)
  ('seo.minho',    '서민호', 'seo.minho@t3series.com',    '010-3003-0001', 'PRD', '생산팀',    'DIR',    '부장', 'NORMAL', 'Y', '2016-08-11', '생산 본부장',         'system', now()),
  ('hwang.jiyoung','황지영', 'hwang.jiyoung@t3series.com','010-3003-0002', 'PRD', '생산팀',    'SR_MGR', '차장', 'NORMAL', 'Y', '2018-10-29', 'MES 운영',            'system', now()),
  ('kwon.dongha',  '권동하', 'kwon.dongha@t3series.com',  '010-3003-0003', 'PRD', '생산팀',    'MGR',    '과장', 'NORMAL', 'Y', '2020-12-07', '품질 책임자',         'system', now()),
  ('bae.soohyun',  '배수현', 'bae.soohyun@t3series.com',  '010-3003-0004', 'PRD', '생산팀',    'ASST',   '대리', 'NORMAL', 'Y', '2023-04-26', '생산 계획',           'system', now()),
  ('moon.jaewook', '문재욱', 'moon.jaewook@t3series.com', '010-3003-0005', 'PRD', '생산팀',    'STAFF',  '사원', 'NORMAL', 'N', '2024-05-13', '휴직 중',             'system', now()),

  -- PUR (구매팀)
  ('lim.hyunsoo',  '임현수', 'lim.hyunsoo@t3series.com',  '010-4004-0001', 'PUR', '구매팀',    'DIR',    '부장', 'NORMAL', 'Y', '2015-11-30', '구매 총괄',           'system', now()),
  ('ahn.dahye',    '안다혜', 'ahn.dahye@t3series.com',    '010-4004-0002', 'PUR', '구매팀',    'MGR',    '과장', 'NORMAL', 'Y', '2020-03-09', '원자재 소싱',         'system', now()),
  ('song.minjae',  '송민재', 'song.minjae@t3series.com',  '010-4004-0003', 'PUR', '구매팀',    'ASST',   '대리', 'NORMAL', 'Y', '2022-07-18', '벤더 관리',           'system', now()),
  ('ryu.gayeon',   '류가연', 'ryu.gayeon@t3series.com',   '010-4004-0004', 'PUR', '구매팀',    'STAFF',  '사원', 'NORMAL', 'Y', '2024-09-02', '구매 계약',           'system', now()),

  -- MGT (경영지원팀)
  ('jang.hyunwoo', '장현우', 'jang.hyunwoo@t3series.com', '010-5005-0001', 'MGT', '경영지원팀','DIR',    '부장', 'ADMIN',  'Y', '2014-01-15', '경영지원 총괄',       'system', now()),
  ('noh.seoyul',   '노서율', 'noh.seoyul@t3series.com',   '010-5005-0002', 'MGT', '경영지원팀','SR_MGR', '차장', 'NORMAL', 'Y', '2018-04-23', '회계 책임자',         'system', now()),
  ('koo.minkyu',   '구민규', 'koo.minkyu@t3series.com',   '010-5005-0003', 'MGT', '경영지원팀','MGR',    '과장', 'NORMAL', 'Y', '2020-08-17', 'HR',                  'system', now()),
  ('woo.jihye',    '우지혜', 'woo.jihye@t3series.com',    '010-5005-0004', 'MGT', '경영지원팀','ASST',   '대리', 'NORMAL', 'Y', '2022-12-05', '총무',                'system', now()),
  ('hong.seungho', '홍승호', 'hong.seungho@t3series.com', '010-5005-0005', 'MGT', '경영지원팀','STAFF',  '사원', 'GUEST',  'Y', '2025-01-20', '신입 (경영지원)',     'system', now()),

  -- 외부 협력사 (게스트)
  ('partner.kim',  '김파트너','partner.kim@vendor-a.com', '010-9009-0001', 'PUR', '구매팀',    'STAFF',  '사원', 'GUEST',  'Y', '2024-06-01', '벤더 A 파트너',       'system', now()),
  ('partner.lee',  '이파트너','partner.lee@vendor-b.com', '010-9009-0002', 'PUR', '구매팀',    'STAFF',  '사원', 'GUEST',  'N', '2023-10-11', '벤더 B (계약 종료)',  'system', now()),

  -- 컨설턴트
  ('consult.zionex','지오넥스컨설턴트','consult@zionex.com','010-9009-0003','MGT','경영지원팀','MGR',  '과장', 'GUEST', 'Y', '2025-03-10', '외부 컨설턴트',       'system', now()),

  -- 추가 NORMAL
  ('lee.jihoon',   '이지훈', 'lee.jihoon@t3series.com',   '010-2002-0007', 'SAL', '영업팀',    'MGR',    '과장', 'NORMAL', 'Y', '2021-01-04', '대리점 채널',         'system', now()),
  ('park.dabin',   '박다빈', 'park.dabin@t3series.com',   '010-3003-0006', 'PRD', '생산팀',    'ASST',   '대리', 'NORMAL', 'Y', '2023-07-22', 'SCM 계획',            'system', now())
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 6) Composer 세션 + 메시지 + 아티팩트 (샘플 5건)
--    각 세션마다 user/assistant 메시지 2~4건 + 아티팩트 1~3건
-- ============================================================================
-- 세션 1: NEW_NL 완료 — 사용자정보 관리 화면 생성
INSERT INTO tb_is_composer_session (id, user_id, mode, target_menu_cd, title, model_name, status, total_in_tokens, total_out_tokens, create_by, create_dttm, target_cd) VALUES
  ('sess000000000000000000000000001', 'user0000000000000000000000000001', 'NEW_NL',          'UI_UT_USER_INFO_MGMT', '사용자정보 관리 화면 (자연어)',         'claude-opus-4-7',   'COMPLETED', 12800,  8420, 'composer-dev', now() - interval '5 day',  'T3SERIES'),
  ('sess000000000000000000000000002', 'user0000000000000000000000000001', 'NEW_FROM_COPY',   'UI_MP_RTF_ANALYSIS',   'MP RTF 분석 — V2 복사',                'claude-opus-4-7',   'COMPLETED', 15200, 10110, 'composer-dev', now() - interval '3 day',  'T3SERIES'),
  ('sess000000000000000000000000003', 'user0000000000000000000000000001', 'NEW_FROM_DESIGN', 'UI_DP_MONTHLY_PLAN',   'DP 월별 수요계획 — 설계서 기반',       'claude-sonnet-4-6', 'ACTIVE',     9800,  6240, 'composer-dev', now() - interval '1 day',  'T3SERIES'),
  ('sess000000000000000000000000004', 'user0000000000000000000000000001', 'EXISTING_MODIFY', 'UI_DP_ENTRY_NOTIFY',   '수요 알림 — 컬럼 추가',               'claude-sonnet-4-6', 'ARCHIVED',   4200,  2840, 'composer-dev', now() - interval '7 day',  'T3SERIES'),
  ('sess000000000000000000000000005', 'user0000000000000000000000000001', 'NEW_STEP',        'UI_IM_ABCXYZ_ANALYSIS','재고 ABC/XYZ — 단계별',                'claude-haiku-4-5',  'ACTIVE',     6400,  3120, 'composer-dev', now() - interval '4 hour', 'T3SERIES')
ON CONFLICT (id) DO NOTHING;

-- 메시지 (각 세션별)
INSERT INTO tb_is_composer_message (id, session_id, turn_seq, role, content, stop_reason, input_tokens, output_tokens, model_name, metadata, create_dttm) VALUES
  ('msg00000000000000000000000000001', 'sess000000000000000000000000001', 1, 'user',      '사용자 정보 관리 화면을 만들어줘. TB_UT_USER_INFO 테이블 사용, 검색조건은 사용자ID/사용자명/사용여부, 그리드는 사용자ID/이름/이메일/전화/부서/직위/사용여부.', NULL,                  240, 0,    'claude-opus-4-7',   '{}', now() - interval '5 day'),
  ('msg00000000000000000000000000002', 'sess000000000000000000000000001', 2, 'assistant', 'UserInfoMgmt 화면을 생성하겠습니다. 참조 원본: UserInfoMgmt.jsx + UserInfoController.java. 산출물 4종(JSX/Java×3) + MENU_SQL + SP_UI_UT_01_Q1/S1/D1 생성합니다.', 'end_turn',        4200, 3680, 'claude-opus-4-7',   '{}', now() - interval '5 day'),
  ('msg00000000000000000000000000003', 'sess000000000000000000000000001', 3, 'user',      '저장 후 자동 새로고침 되도록 onAfterSave 콜백 추가해줘.',                                                                                                       NULL,                   80, 0,    'claude-opus-4-7',   '{}', now() - interval '5 day'),
  ('msg00000000000000000000000000004', 'sess000000000000000000000000001', 4, 'assistant', 'GridSaveButton 에 onAfterSave={handleSearch} 추가했습니다.',                                                                                                  'end_turn',         8280, 4740, 'claude-opus-4-7',   '{}', now() - interval '5 day'),

  ('msg00000000000000000000000000010', 'sess000000000000000000000000002', 1, 'user',      'MP RTF 분석 (UI_MP_RTF_ANALYSIS) 화면을 복사해서 UI_MP_RTF_ANALYSIS_V2 로 만들어줘. 기존 백엔드 재사용.',                                              NULL,                  180, 0,    'claude-opus-4-7',   '{}', now() - interval '3 day'),
  ('msg00000000000000000000000000011', 'sess000000000000000000000000002', 2, 'assistant', '원본 JSX 와 동일 import/gridItems 구조로 복제, MENU_CD/MENU_FILE_PATH 만 V2 로 변경. zAxios URL은 기존 /masterplan/rtfs 그대로 유지.',                  'end_turn',         5400, 4720, 'claude-opus-4-7',   '{}', now() - interval '3 day'),
  ('msg00000000000000000000000000012', 'sess000000000000000000000000002', 3, 'user',      '잘 동작하네. 메뉴 등록까지 해줘.',                                                                                                                          NULL,                   40, 0,    'claude-opus-4-7',   '{}', now() - interval '3 day'),
  ('msg00000000000000000000000000013', 'sess000000000000000000000000002', 4, 'assistant', 'TB_AD_MENU + TB_AD_LANG_PACK(4언어) + TB_AD_PERMISSION_GROUP 형제 메뉴 복사 SQL 생성 완료.',                                                              'end_turn',         9580, 5390, 'claude-opus-4-7',   '{}', now() - interval '3 day'),

  ('msg00000000000000000000000000020', 'sess000000000000000000000000003', 1, 'user',      'DP 월별 수요계획 설계서(엑셀) 기반으로 화면 생성. 검색조건: PlanScope/기간, 그리드 좌측 품목+계정, 우측 월별 수량 12개월 크로스탭.',                  NULL,                  320, 0,    'claude-sonnet-4-6', '{}', now() - interval '1 day'),
  ('msg00000000000000000000000000021', 'sess000000000000000000000000003', 2, 'assistant', '설계서 파싱 결과 패턴 P06(크로스탭 피벗)으로 인식. Step1~5 prefill 완료. 사용자가 Step6 Cascade 검토 후 진행 가능.',                              'end_turn',         9480, 6240, 'claude-sonnet-4-6', '{}', now() - interval '1 day'),

  ('msg00000000000000000000000000030', 'sess000000000000000000000000004', 1, 'user',      'UI_DP_ENTRY_NOTIFY 의 알림 그리드에 우선순위(PRIORITY) 컬럼 추가해줘.',                                                                                  NULL,                  120, 0,    'claude-sonnet-4-6', '{}', now() - interval '7 day'),
  ('msg00000000000000000000000000031', 'sess000000000000000000000000004', 2, 'assistant', 'Entry Notify JSX 의 gridItems 배열에 priority 컬럼(text, center, dropdown HIGH/MID/LOW) 추가. SP_UI_DP_NOTIFY_Q1 SELECT 절에 PRIORITY 추가. Entity 도 갱신.', 'end_turn',         4080, 2840, 'claude-sonnet-4-6', '{}', now() - interval '7 day'),

  ('msg00000000000000000000000000040', 'sess000000000000000000000000005', 1, 'user',      '재고 ABC/XYZ 분석 화면을 9단계 Wizard 로 만들고 싶어. 시작해줘.',                                                                                       NULL,                  140, 0,    'claude-haiku-4-5',  '{}', now() - interval '4 hour'),
  ('msg00000000000000000000000000041', 'sess000000000000000000000000005', 2, 'assistant', 'Step1 Layout 진행 중. 추천 패턴: P02(검색+단일그리드) 또는 P01(위젯대시보드). ABC/XYZ 매트릭스 분포가 보이는 P01 추천합니다.',                       'end_turn',         6260, 3120, 'claude-haiku-4-5',  '{}', now() - interval '4 hour')
ON CONFLICT (id) DO NOTHING;

-- 아티팩트 (세션 1, 2, 4 만 — ACTIVE 세션 3/5 는 아직 산출물 없음)
INSERT INTO tb_is_composer_artifact (id, session_id, message_id, artifact_type, file_path, file_name, language, content, version_no, status, create_by, create_dttm) VALUES
  ('art000000000000000000000000001', 'sess000000000000000000000000001', 'msg00000000000000000000000000002', 'SCREEN_JSX', 'frontend/src/view/util/userinfomgmt/UserInfoMgmt.jsx',                                'UserInfoMgmt.jsx',           'jsx',  '// JSX content (생략 — 실제 운영본 약 280줄)',                                                       1, 'FINAL', 'composer-dev', now() - interval '5 day'),
  ('art000000000000000000000000002', 'sess000000000000000000000000001', 'msg00000000000000000000000000002', 'JAVA_CONTROLLER','backend/src/main/java/com/zionex/t3composer/domain/util/userinfomgmt/UserInfoMgmtController.java','UserInfoMgmtController.java','java', '// Controller 약 90줄',                                                                              1, 'FINAL', 'composer-dev', now() - interval '5 day'),
  ('art000000000000000000000000003', 'sess000000000000000000000000001', 'msg00000000000000000000000000002', 'JAVA_SERVICE',    'backend/src/main/java/com/zionex/t3composer/domain/util/userinfomgmt/UserInfoMgmtService.java',   'UserInfoMgmtService.java',   'java', '// Service 약 60줄',                                                                                 1, 'FINAL', 'composer-dev', now() - interval '5 day'),
  ('art000000000000000000000000004', 'sess000000000000000000000000001', 'msg00000000000000000000000000002', 'JAVA_ENTITY',     'backend/src/main/java/com/zionex/t3composer/domain/util/userinfomgmt/UserInfoMgmt.java',          'UserInfoMgmt.java',          'java', '// Entity 약 45줄',                                                                                  1, 'FINAL', 'composer-dev', now() - interval '5 day'),
  ('art000000000000000000000000005', 'sess000000000000000000000000001', 'msg00000000000000000000000000002', 'SQL_SP',          't3series-database/mssql/upgrade/v26.0.0-20260516/procedures/SP_UI_UT_01_Q1.sql',                'SP_UI_UT_01_Q1.sql',         'sql',  '-- 조회 SP 약 30줄',                                                                                 1, 'FINAL', 'composer-dev', now() - interval '5 day'),
  ('art000000000000000000000000006', 'sess000000000000000000000000001', 'msg00000000000000000000000000004', 'MENU_SQL',        't3series-database/mssql/upgrade/v26.0.0-20260516/menus/UI_UT_USER_INFO_MGMT.sql',              'UI_UT_USER_INFO_MGMT.sql',   'sql',  '-- TB_AD_MENU + TB_AD_LANG_PACK + TB_AD_PERMISSION_GROUP INSERT',                                    1, 'FINAL', 'composer-dev', now() - interval '5 day'),

  ('art000000000000000000000000010', 'sess000000000000000000000000002', 'msg00000000000000000000000000011', 'SCREEN_JSX', 'frontend/src/view/masterplan/analysisreport/rtfanalysisv2/RtfAnalysisV2.jsx',                'RtfAnalysisV2.jsx',          'jsx',  '// JSX content (원본 RtfAnalysis 복제)',                                                              1, 'FINAL', 'composer-dev', now() - interval '3 day'),
  ('art000000000000000000000000011', 'sess000000000000000000000000002', 'msg00000000000000000000000000013', 'MENU_SQL',        't3series-database/mssql/upgrade/v26.0.0-20260518/menus/UI_MP_RTF_ANALYSIS_V2.sql',            'UI_MP_RTF_ANALYSIS_V2.sql',  'sql',  '-- MENU INSERT (형제 권한 복사 포함)',                                                              1, 'FINAL', 'composer-dev', now() - interval '3 day'),

  ('art000000000000000000000000020', 'sess000000000000000000000000004', 'msg00000000000000000000000000031', 'SCREEN_JSX', 'frontend/src/view/demandplan/entry/entrynotify/EntryNotify.jsx',                              'EntryNotify.jsx',            'jsx',  '// PRIORITY 컬럼 추가된 JSX',                                                                       2, 'FINAL', 'composer-dev', now() - interval '7 day'),
  ('art000000000000000000000000021', 'sess000000000000000000000000004', 'msg00000000000000000000000000031', 'SQL_SP',          't3series-database/mssql/upgrade/v26.0.0-20260514/procedures/SP_UI_DP_NOTIFY_Q1.sql',           'SP_UI_DP_NOTIFY_Q1.sql',     'sql',  '-- SELECT 절 PRIORITY 추가',                                                                        2, 'FINAL', 'composer-dev', now() - interval '7 day')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 검증
-- ============================================================================
SELECT 'tb_ad_group'             as t, count(*) FROM tb_ad_group
UNION ALL SELECT 'tb_ad_menu',                   count(*) FROM tb_ad_menu
UNION ALL SELECT 'tb_ad_lang_pack',              count(*) FROM tb_ad_lang_pack
UNION ALL SELECT 'tb_ad_permission_group',       count(*) FROM tb_ad_permission_group
UNION ALL SELECT 'tb_ut_user_info',              count(*) FROM tb_ut_user_info
UNION ALL SELECT 'tb_is_composer_session',       count(*) FROM tb_is_composer_session
UNION ALL SELECT 'tb_is_composer_message',       count(*) FROM tb_is_composer_message
UNION ALL SELECT 'tb_is_composer_artifact',      count(*) FROM tb_is_composer_artifact
ORDER BY 1;

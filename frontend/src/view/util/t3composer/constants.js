/**
 * T3Composer 상수 — 모듈 대그룹, 화면 패턴 카탈로그, Layer 정의.
 * 기존 docs/tech-stack 및 docs/ui-patterns 문서 내용을 반영.
 */

// ====================================================================
// 1. 모듈 대그룹
// ====================================================================
// 각 모듈의 접두어는 TB_<DOMAIN> · SP_UI_<DOMAIN>_* 네이밍 규약과 일치.
// tables / procedures 의 개수는 2026-04-22 DDL 스냅샷 기준.

export const MODULES = [
  {
    code: 'DP',
    name: 'Demand Planning',
    nameKo: '수요 계획',
    nameJa: '需要計画',
    nameZhCN: '需求计划',
    nameZhTW: '需求計畫',
    color: '#5281b3',
    icon: 'TrendingUp',
    tableCount: 29,
    spCount: 155,
    description: '수요 입력·예측·계획 관리 (Account·Control Board·Dimension·Entry·Measure)',
    descriptionEn: 'Demand input, forecasting and plan management (Account · Control Board · Dimension · Entry · Measure)',
    descriptionJa: '需要入力・予測・計画管理 (Account・Control Board・Dimension・Entry・Measure)',
    descriptionZhCN: '需求录入·预测·计划管理 (Account·Control Board·Dimension·Entry·Measure)',
    descriptionZhTW: '需求輸入·預測·計畫管理 (Account·Control Board·Dimension·Entry·Measure)',
    commonTables: ['TB_DP_ACCOUNT_MST', 'TB_DP_CONTROL_BOARD_VER_MST', 'TB_DP_ENTRY', 'TB_DP_MEASURE_DATA'],
    commonPatterns: ['P02', 'P06', 'P07'],
  },
  {
    code: 'MP',
    name: 'Master Planning',
    nameKo: '마스터 계획',
    nameJa: 'マスタープラン',
    nameZhCN: '主计划',
    nameZhTW: '主計畫',
    color: '#2a9d8f',
    icon: 'Inventory',
    tableCount: 58,
    spCount: 197,
    description: '마스터 플래닝 (BOR·Bundle·Demand·Route·Resource)',
    descriptionEn: 'Master planning (BOR · Bundle · Demand · Route · Resource)',
    descriptionJa: 'マスタープランニング (BOR・Bundle・Demand・Route・Resource)',
    descriptionZhCN: '主计划 (BOR·Bundle·Demand·Route·Resource)',
    descriptionZhTW: '主計畫 (BOR·Bundle·Demand·Route·Resource)',
    commonTables: ['TB_MP_ITEM_RES_CAPA_MST', 'TB_MP_ROUTE', 'TB_MP_PLANNEDORDER', 'TB_MP_RES_MGMT_MST'],
    commonPatterns: ['P02', 'P03', 'P04', 'P06', 'P09'],
  },
  {
    code: 'FP',
    name: 'Factory Planning',
    nameKo: '공장 계획',
    nameJa: '工場計画',
    nameZhCN: '工厂计划',
    nameZhTW: '工廠計畫',
    color: '#fa7d5b',
    icon: 'Factory',
    tableCount: 135,
    spCount: 1,
    description: 'Factory Planning (Work Order·WIP·BOR·Activity·Route·Stock)',
    descriptionEn: 'Factory planning (Work Order · WIP · BOR · Activity · Route · Stock)',
    descriptionJa: '工場計画 (Work Order・WIP・BOR・Activity・Route・Stock)',
    descriptionZhCN: '工厂计划 (Work Order·WIP·BOR·Activity·Route·Stock)',
    descriptionZhTW: '工廠計畫 (Work Order·WIP·BOR·Activity·Route·Stock)',
    commonTables: ['TB_FP_ACTIVITY', 'TB_FP_WORK_ORDER', 'TB_FP_WIP', 'TB_FP_PLAN_VERSION'],
    commonPatterns: ['P03', 'P05', 'P09', 'P10'],
  },
  {
    code: 'RP',
    name: 'Replenishment Planning',
    nameKo: '보충 계획',
    nameJa: '補充計画',
    nameZhCN: '补货计划',
    nameZhTW: '補貨計畫',
    color: '#ffb100',
    icon: 'LocalShipping',
    tableCount: 4,
    spCount: 11,
    description: '보충 주문·예약·구매 (Reservation·PO·Strategy)',
    descriptionEn: 'Replenishment orders, reservations and purchasing (Reservation · PO · Strategy)',
    descriptionJa: '補充注文・予約・購買 (Reservation・PO・Strategy)',
    descriptionZhCN: '补货订单·预订·采购 (Reservation·PO·Strategy)',
    descriptionZhTW: '補貨訂單·預約·採購 (Reservation·PO·Strategy)',
    commonTables: ['TB_RP_PURCHASE_ORDER', 'TB_RP_REPLSH_STRATEGY', 'TB_RT_REPLSH_ORDER'],
    commonPatterns: ['P02', 'P05', 'P06'],
  },
  {
    code: 'BF',
    name: 'Baseline Forecasting',
    nameKo: '베이스라인 예측',
    nameJa: 'ベースライン予測',
    nameZhCN: '基线预测',
    nameZhTW: '基線預測',
    color: '#6fa8dc',
    icon: 'QueryStats',
    tableCount: 31,
    spCount: 51,
    description: '통계/ML 기반 기초 예측 (Model·Factor·HyperParam·Control Board)',
    descriptionEn: 'Statistics/ML-based baseline forecasting (Model · Factor · HyperParam · Control Board)',
    descriptionJa: '統計/ML ベースの基礎予測 (Model・Factor・HyperParam・Control Board)',
    descriptionZhCN: '基于统计/ML 的基础预测 (Model·Factor·HyperParam·Control Board)',
    descriptionZhTW: '基於統計/ML 的基礎預測 (Model·Factor·HyperParam·Control Board)',
    commonTables: ['TB_BF_RT', 'TB_BF_FACTOR_MGMT', 'TB_BF_CONTROL_BOARD_VER_MST', 'TB_BF_MODEL_EVAL_HISTORY'],
    commonPatterns: ['P05', 'P07'],
  },
  {
    code: 'IM',
    name: 'Inventory Management',
    nameKo: '재고 관리',
    nameJa: '在庫管理',
    nameZhCN: '库存管理',
    nameZhTW: '庫存管理',
    color: '#79d46d',
    icon: 'Warehouse',
    tableCount: 17,
    spCount: 90,
    description: '재고 정책·ABC/XYZ·안전재고·PO 스케줄',
    descriptionEn: 'Inventory policy · ABC/XYZ · Safety stock · PO schedule',
    descriptionJa: '在庫ポリシー・ABC/XYZ・安全在庫・PO スケジュール',
    descriptionZhCN: '库存政策·ABC/XYZ·安全库存·PO 调度',
    descriptionZhTW: '庫存政策·ABC/XYZ·安全庫存·PO 排程',
    commonTables: ['TB_IM_TARGET_INV_POLICY', 'TB_IM_ABCXYZ_ANLYS', 'TB_IM_TARGET_INV_VERSION'],
    commonPatterns: ['P02', 'P04', 'P05'],
  },
  {
    code: 'SA',
    name: 'Sales Aggregation (S&OP)',
    nameKo: '판매 집계 · S&OP',
    nameJa: '販売集計・S&OP',
    nameZhCN: '销售汇总·S&OP',
    nameZhTW: '銷售彙整·S&OP',
    color: '#bface2',
    icon: 'Analytics',
    tableCount: 21,
    spCount: 48,
    description: '판매 집계·수요조정·Flex 리포트·Meeting',
    descriptionEn: 'Sales aggregation · Demand reconciliation · Flex reports · Meeting',
    descriptionJa: '販売集計・需要調整・Flex レポート・Meeting',
    descriptionZhCN: '销售汇总·需求调整·Flex 报表·Meeting',
    descriptionZhTW: '銷售彙整·需求調整·Flex 報表·Meeting',
    commonTables: ['TB_SA_AGGR_MST', 'TB_SA_FACT', 'TB_SA_MEET_MST', 'TB_SA_VER_MST'],
    commonPatterns: ['P01', 'P05', 'P12'],
  },
  {
    code: 'SO',
    name: 'Sales Order',
    nameKo: '판매 주문',
    nameJa: '販売注文',
    nameZhCN: '销售订单',
    nameZhTW: '銷售訂單',
    color: '#ffa9a6',
    icon: 'ShoppingCart',
    tableCount: 2,
    spCount: 15,
    description: '판매/재고 주문·수요 조정',
    descriptionEn: 'Sales / stock orders and demand reconciliation',
    descriptionJa: '販売/在庫注文・需要調整',
    descriptionZhCN: '销售/库存订单·需求调整',
    descriptionZhTW: '銷售/庫存訂單·需求調整',
    commonTables: ['TB_SO_DEMAND', 'TB_SO_LOG'],
    commonPatterns: ['P02', 'P04'],
  },
  {
    code: 'CM',
    name: 'Common Master',
    nameKo: '공통 마스터',
    nameJa: '共通マスター',
    nameZhCN: '通用主数据',
    nameZhTW: '共用主資料',
    color: '#a2c4c9',
    icon: 'Storage',
    tableCount: 106,
    spCount: 181,
    description: '전역 마스터 (품목·사이트·창고·비용·출하·캘린더)',
    descriptionEn: 'Global master data (Item · Site · Warehouse · Cost · Shipment · Calendar)',
    descriptionJa: 'グローバルマスター (品目・サイト・倉庫・コスト・出荷・カレンダー)',
    descriptionZhCN: '全局主数据 (品目·站点·仓库·成本·出货·日历)',
    descriptionZhTW: '全域主資料 (品項·站點·倉庫·成本·出貨·行事曆)',
    commonTables: ['TB_CM_ITEM_MST', 'TB_CM_SITE_ITEM', 'TB_CM_LOC_MST', 'TB_CM_CALENDAR', 'TB_CM_UOM'],
    commonPatterns: ['P02', 'P04'],
  },
  {
    code: 'AD',
    name: 'System / Admin',
    nameKo: '시스템 · 관리',
    nameJa: 'システム・管理',
    nameZhCN: '系统·管理',
    nameZhTW: '系統·管理',
    color: '#8dd8a3',
    icon: 'AdminPanelSettings',
    tableCount: 27,
    spCount: 1,
    description: '사용자·그룹·권한·메뉴·테마·코드',
    descriptionEn: 'Users · Groups · Permissions · Menus · Themes · Codes',
    descriptionJa: 'ユーザー・グループ・権限・メニュー・テーマ・コード',
    descriptionZhCN: '用户·组·权限·菜单·主题·代码',
    descriptionZhTW: '使用者·群組·權限·選單·主題·代碼',
    commonTables: ['TB_AD_USER', 'TB_AD_GROUP', 'TB_AD_MENU', 'TB_AD_PERMISSION'],
    commonPatterns: ['P02', 'P04'],
  },
  {
    code: 'UT',
    name: 'Utility',
    nameKo: '유틸리티',
    nameJa: 'ユーティリティ',
    nameZhCN: '实用工具',
    nameZhTW: '工具',
    color: '#d9d9d9',
    icon: 'Widgets',
    tableCount: 24,
    spCount: 3,
    description: '캘린더·대시보드·이슈·메일·공지·Task·Workflow',
    descriptionEn: 'Calendar · Dashboard · Issue · Mail · Notice · Task · Workflow',
    descriptionJa: 'カレンダー・ダッシュボード・課題・メール・お知らせ・Task・Workflow',
    descriptionZhCN: '日历·仪表盘·问题·邮件·公告·Task·Workflow',
    descriptionZhTW: '行事曆·儀表板·問題·郵件·公告·Task·Workflow',
    commonTables: ['TB_UT_CALENDAR', 'TB_UT_DASHBOARD', 'TB_UT_ISSUE', 'TB_UT_NOTICEBOARD'],
    commonPatterns: ['P01', 'P02'],
  },
];

export const getModule = (code) => MODULES.find((m) => m.code === code);

/**
 * 현재 locale 에 맞는 모듈명 / 설명 반환. 누락 시 ko → en 순으로 fallback.
 *
 * lng: 'ko' | 'en' | 'ja' | 'zh-CN' | 'zh-TW'
 */
const MODULE_NAME_FIELD = { ko: 'nameKo',        en: 'name',          ja: 'nameJa',
                            'zh-CN': 'nameZhCN', 'zh-TW': 'nameZhTW' };
const MODULE_DESC_FIELD = { ko: 'description',         en: 'descriptionEn', ja: 'descriptionJa',
                            'zh-CN': 'descriptionZhCN', 'zh-TW': 'descriptionZhTW' };
export const localizedModuleName = (m, lng) => {
  if (!m) return '';
  return m[MODULE_NAME_FIELD[lng] || 'name'] || m.name || m.nameKo || '';
};
export const localizedModuleDesc = (m, lng) => {
  if (!m) return '';
  return m[MODULE_DESC_FIELD[lng] || 'description'] || m.description || m.descriptionEn || '';
};

// ====================================================================
// 2. 화면 패턴 (14종) — docs/ui-patterns/README.md 기반 요약
// ====================================================================
// visual 은 ASCII 미니 다이어그램 (카드에 표시용)

export const PATTERNS = [
  {
    code: 'P01',
    layout: 'widget_dashboard',
    name: '위젯 대시보드',
    nameEn: 'Widget Dashboard',
    description: 'KPI/차트 위젯을 고정 캔버스에 배치하는 모니터링 보드',
    frequency: 3,
    visual:
`┌──────────────────────┐
│ [W1] [W2] [W3]       │
│ [W4]   [W5]          │
└──────────────────────┘`,
    example: 'view/dashboard/kpiboard/KpiBoard.jsx',
    recommendedFor: ['모니터링', 'KPI', '대시보드'],
  },
  {
    code: 'P02',
    layout: 'search_grid',
    name: '검색 + 단일 그리드',
    nameEn: 'Search-Grid',
    description: '상단 검색 + CRUD 가능한 단일 그리드 (마스터 데이터 관리)',
    frequency: 3,
    visual:
`┌──────────────────────┐
│ 🔍 검색 조건          │
├──────────────────────┤
│ [+][−][💾][📄] 버튼   │
│ ╔══════════════════╗ │
│ ║ 그리드            ║│
│ ╚══════════════════╝ │
└──────────────────────┘`,
    example: 'view/system/usermgmt/usergroup/UserGroup.jsx',
    recommendedFor: ['마스터', 'CRUD', '일반 조회'],
  },
  {
    code: 'P03',
    layout: 'search_tab',
    name: '검색 + 탭 그리드/차트',
    nameEn: 'Search-Tab',
    description: '같은 조건으로 여러 관점(탭) 전환',
    frequency: 2,
    visual:
`┌──────────────────────┐
│ 🔍 검색               │
├──────────────────────┤
│ [탭A][탭B][탭C]       │
│ ┌──────────────────┐ │
│ │ 탭별 그리드/차트  │ │
│ └──────────────────┘ │
└──────────────────────┘`,
    example: 'view/masterplan/analysisreport/resstatus/ResStatus.jsx',
    recommendedFor: ['분석 리포트', '다관점 조회'],
  },
  {
    code: 'P04',
    layout: 'split_master_detail',
    name: '수평 스플릿 마스터-디테일',
    nameEn: 'Split Master-Detail',
    description: '좌측 선택 → 우측 상세 표시 (코드그룹↔코드 등)',
    frequency: 2,
    visual:
`┌────────┬───────────┐
│ 마스터  │ 상세       │
│ [선택]──→[표시]     │
│        │           │
└────────┴───────────┘`,
    example: 'view/system/commoncode/CommonCode.jsx',
    recommendedFor: ['부모-자식', '계층 매핑'],
  },
  {
    code: 'P05',
    layout: 'grid_chart_stacked',
    name: '그리드 + 차트 상하',
    nameEn: 'Grid-Chart Stacked',
    description: '상단 그리드(집계) + 하단 차트(트렌드)',
    frequency: 2,
    visual:
`┌──────────────────────┐
│ ╔══════════════════╗ │
│ ║   그리드          ║│
│ ╚══════════════════╝ │
├──────────────────────┤
│   📊 차트            │
└──────────────────────┘`,
    example: 'view/baselineforecast/report/salesanalysis/SalesAnalysis.jsx',
    recommendedFor: ['분석', '리포트'],
  },
  {
    code: 'P06',
    layout: 'pivot_entry',
    name: '크로스탭 피벗 입력',
    nameEn: 'Pivot Entry',
    description: '시간버킷(월/주/분기) 단위 피벗 입력 그리드',
    frequency: 2,
    visual:
`┌──────────────────────┐
│ 🔍 검색               │
├──────────────────────┤
│ 지표│1월│2월│3월│...  │
│ 계획│100│120│...      │
│ 실적│ 95│110│...      │
└──────────────────────┘`,
    example: 'view/demandplan/entry/entry/BaseEntry.jsx',
    recommendedFor: ['계획 입력', '시간버킷'],
  },
  {
    code: 'P07',
    layout: 'control_board',
    name: '컨트롤보드 (Stepper + Card)',
    nameEn: 'Control Board',
    description: '버전 생성/승인/마감 워크플로',
    frequency: 2,
    visual:
`┌──────────────────────┐
│ ○─○─○─○  단계 Stepper │
├──────────────────────┤
│ [버전카드 1] [상태 Chip] │
│ [버전카드 2] ...       │
└──────────────────────┘`,
    example: 'view/baselineforecast/version/controlboard/ControlBoard.jsx',
    recommendedFor: ['버전 관리', '워크플로'],
  },
  {
    code: 'P08',
    layout: 'process_status',
    name: '프로세스 진행 현황',
    nameEn: 'Process Status',
    description: 'Stepper + TreeGrid 로 다단계 승인 추적',
    frequency: 1,
    visual:
`┌──────────────────────┐
│ ○─●─○   Stepper      │
├──────────────────────┤
│ ▼ 그룹 A             │
│   ·유저1 SUBMITTED   │
│   ·유저2 PENDING     │
└──────────────────────┘`,
    example: 'view/demandplan/version/processstatus/BaseProcessStatus.jsx',
    recommendedFor: ['승인 추적'],
  },
  {
    code: 'P09',
    layout: 'gantt',
    name: '간트 차트',
    nameEn: 'Gantt Chart',
    description: '리소스 부하 · 일정 시각화',
    frequency: 1,
    visual:
`┌──────────┬──────────┐
│ 리소스    │  ▓▓░░▓▓  │
│ ▼ 공장    │  ▓▓▓░░░  │
│   · 라인1 │  ░▓▓▓▓░  │
└──────────┴──────────┘`,
    example: 'view/masterplan/analysisreport/resourcegantt/ResourceGantt.jsx',
    recommendedFor: ['일정', '리소스 부하'],
  },
  {
    code: 'P10',
    layout: 'flo_diagram',
    name: 'FLO 다이어그램',
    nameEn: 'FLO Flow Diagram',
    description: 'BOM/공급망 그래프 (ReactFlow)',
    frequency: 1,
    visual:
`┌──────────────────────┐
│  ○────○────○         │
│   ╲    ╲             │
│    ○────○            │
└──────────────────────┘`,
    example: 'view/supplychainmodel/flo/Flo.jsx',
    recommendedFor: ['BOM', '공급망 그래프'],
  },
  {
    code: 'P11',
    layout: 'map',
    name: '지도 위젯',
    nameEn: 'Map Widget',
    description: 'Google Maps / Leaflet 기반 거점 시각화',
    frequency: 1,
    visual:
`┌──────────────────────┐
│       🗺️             │
│   📍    📍           │
│      📍              │
└──────────────────────┘`,
    example: 'view/snop/map/Map.jsx',
    recommendedFor: ['지리', '거점 시각화'],
  },
  {
    code: 'P12',
    layout: 'pivot_table',
    name: '피벗 테이블',
    nameEn: 'Pivot Table',
    description: 'D/M/P/V 컬럼 타입 다차원 피벗',
    frequency: 1,
    visual:
`┌──────────────────────┐
│ D │ D │ M │ V         │
│ Dim│Dim│Mea│Val       │
│ ··│···│···│···        │
└──────────────────────┘`,
    example: 'view/sample/sample02/Sample02.jsx',
    recommendedFor: ['다차원 분석'],
  },
];

export const getPattern = (code) => PATTERNS.find((p) => p.code === code);

// ====================================================================
// 3. Layer 정의 (단계별 SP 생성 · 선택)
// ====================================================================

export const LAYERS = [
  {
    key: 'search',
    name: '조회 (Query)',
    description: '화면 진입 시 데이터를 조회하는 SP. 검색 조건을 받아 그리드 데이터를 반환.',
    spSuffix: 'Q1',
    example: 'SP_UI_DP_17_Q1',
  },
  {
    key: 'save',
    name: '저장 (Save)',
    description: '그리드의 추가/수정된 행들을 저장하는 SP. 여러 행을 JSON/TVP 로 수신.',
    spSuffix: 'S1',
    example: 'SP_UI_DP_17_S1',
  },
  {
    key: 'delete',
    name: '삭제 (Delete)',
    description: '선택된 행을 삭제하는 SP. ID 목록을 수신.',
    spSuffix: 'D1',
    example: 'SP_UI_DP_17_D1',
  },
  {
    key: 'popup_query',
    name: '팝업 조회',
    description: '조회 조건의 팝업(예: 품목 선택) 에서 호출되는 SP.',
    spSuffix: 'POP_Q1',
    example: 'SP_UI_DP_17_POP_Q1',
  },
  {
    key: 'chart',
    name: '차트 데이터',
    description: '하단 차트/차트 탭용 집계 데이터 SP.',
    spSuffix: 'CHART_Q1',
    example: 'SP_UI_DP_17_CHART_Q1',
  },
  {
    key: 'batch',
    name: '배치 처리',
    description: '대량 업데이트/계산 배치 SP.',
    spSuffix: 'BATCH',
    example: 'SP_UI_DP_17_BATCH',
  },
];

// ====================================================================
// 4. SP 생성 방식 옵션
// ====================================================================

export const SP_STRATEGY = {
  SKIP:      { key: 'SKIP',      label: '건너뛰기',    description: '이 레이어는 SP 없이 진행' },
  EXISTING:  { key: 'EXISTING',  label: '기존 SP 재사용', description: '유사 SP 중 하나를 선택' },
  MANUAL:    { key: 'MANUAL',    label: '수동 작성',    description: '개발자가 직접 SQL 작성' },
  AI_GEN:    { key: 'AI_GEN',    label: 'AI 생성',     description: 'Claude 에 이 SP만 타겟팅 요청' },
};

// ====================================================================
// 5. Layer 컴포넌트 카탈로그 (10개 그룹, ~80 components)
//    LayoutDesigner 의 Layer header 드롭다운에서 사용
// ====================================================================

export const COMPONENT_CATALOG = {
  version: '1.0',
  // 5그룹 41개 — Phase 1 정리.
  //   본문 layer 자격 있는 그룹만 유지: CONTAINER(3) · DATA_DISPLAY(12) · CHART(17) · DOCUMENT(5) · AI(4)
  //   제거: INPUT(14) / INPUT_DOMAIN(7) — FilterBar 필드 타입으로 이주
  //   제거: ACTION(5) — Grid 자동 / setViewInfo / framework
  //   제거: FEEDBACK(6) — framework 자동 (showMessage 등)
  //   제거: NAVIGATION(5) — 화면 골격 / framework
  //   제거: CONTAINER_DRAWER · CONTAINER_MODAL — 별도 화면 / 팝업이라 layer 아님
  //   spec: docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md
  groups: [
    {
      code: 'CONTAINER',
      label: '컨테이너',
      color: '#8b5cf6',
      items: [
        // 탭 컨테이너 = 1 세트 (탭 페이지는 내부에서 자동 관리)
        { code: 'CONTAINER_TAB',             label: '탭 컨테이너',      level: 'L1' },
        { code: 'CONTAINER_CARD',            label: '카드',             level: 'L1' },
        { code: 'CONTAINER_DASHBOARD_PANEL', label: '대시보드 패널',    level: 'L1' },
      ],
    },
    {
      code: 'DATA_DISPLAY',
      label: '데이터 표시',
      color: '#3b82f6',
      items: [
        { code: 'GRID_BASE',      label: '기본 그리드',     multi_instance: true,
          config: { multi_select: true, excel_export: true, inline_edit: true } },
        { code: 'GRID_TREE',      label: '트리 그리드',     multi_instance: true },
        { code: 'GRID_CROSSTAB',  label: '크로스탭 그리드', multi_instance: true,
          config: { iteration: { prefix: 'DATE_', delimiter: '-' } } },
        { code: 'GRID_PIVOT',     label: '피벗 테이블' },
        { code: 'TREE_VIEW',      label: '트리 뷰' },
        { code: 'FILE_TREE',      label: '파일 트리' },
        { code: 'CARD_LIST',      label: '카드 리스트' },
        { code: 'TIMELINE',       label: '타임라인' },
        { code: 'CALENDAR_MONTH', label: '월간 캘린더' },
        { code: 'CALENDAR_WEEK',  label: '주간 캘린더' },
        { code: 'SCHEDULER',      label: '스케줄러' },
        { code: 'KANBAN_BOARD',   label: '칸반 보드', status: 'NEW' },
      ],
    },
    {
      code: 'CHART',
      label: '차트·시각화',
      color: '#f59e0b',
      items: [
        { code: 'CHART_LINE',        label: '선 차트',       data_source: ['manual', 'sp', 'kpi_dictionary'] },
        { code: 'CHART_BAR',         label: '막대 차트',     data_source: ['manual', 'sp', 'kpi_dictionary'] },
        { code: 'CHART_STACKED_BAR', label: '누적 막대' },
        { code: 'CHART_PIE',         label: '파이 차트' },
        { code: 'CHART_DONUT',       label: '도넛 차트' },
        { code: 'CHART_AREA',        label: '영역 차트' },
        { code: 'CHART_SCATTER',     label: '산점도' },
        { code: 'CHART_BOXPLOT',     label: '박스플롯' },
        { code: 'CHART_HEATMAP',     label: '히트맵', status: 'NEW' },
        { code: 'CHART_GAUGE',       label: '게이지' },
        { code: 'CHART_COMBO',       label: '혼합 차트' },
        { code: 'CHART_GANTT',       label: '간트 차트' },
        { code: 'KPI_CARD',          label: 'KPI 카드',      data_source: ['kpi_dictionary'] },
        { code: 'DIAGRAM_FLO',       label: 'FLO 다이어그램' },
        { code: 'DIAGRAM_NETWORK',   label: '네트워크 그래프' },
        { code: 'MAP_GOOGLE',        label: '지도 (Google)' },
        { code: 'MAP_VECTOR',        label: '벡터 지도' },
      ],
    },
    {
      code: 'DOCUMENT',
      label: '문서·미디어',
      color: '#6366f1',
      items: [
        { code: 'DOC_PDF_VIEWER',      label: 'PDF 뷰어' },
        { code: 'DOC_MARKDOWN_VIEWER', label: '마크다운 뷰어' },
        { code: 'DOC_IMAGE_VIEWER',    label: '이미지 뷰어' },
        { code: 'DOC_DIFF_VIEWER',     label: '차이점 뷰어', status: 'NEW' },
        { code: 'DOC_FILE_DROPZONE',   label: '파일 드롭존' },
      ],
    },
    {
      code: 'AI',
      label: 'AI·Insight',
      color: '#d946ef',
      items: [
        { code: 'AI_CHAT_PANEL',       label: 'AI 채팅',         status: 'NEW' },
        { code: 'AI_INSIGHT_CARD',     label: '인사이트 카드',   status: 'NEW' },
        { code: 'AI_SIMULATION_PANEL', label: '시뮬레이션 AI' },
        { code: 'AI_ONTOLOGY_EDITOR',  label: '온톨로지 편집기' },
      ],
    },
  ],
};

// 빠른 조회용 index: code → { label, groupCode, groupLabel, groupColor, status }
export const COMPONENT_INDEX = (() => {
  const map = {};
  COMPONENT_CATALOG.groups.forEach(g => {
    g.items.forEach(it => {
      map[it.code] = {
        ...it,
        groupCode:  g.code,
        groupLabel: g.label,
        groupColor: g.color,
      };
    });
  });
  return map;
})();

// Legacy 값 마이그레이션 — 삭제·통합된 code 를 신규 code 로 매핑.
//   2026-05-22: INPUT/ACTION/FEEDBACK/NAVIGATION 그룹 제거 (Phase 1).
//   FORM (옛 입력 폼) 은 layer 자격이 없어졌으므로 가까운 layer 인 GRID_BASE 로 폴백.
export const LEGACY_COMPONENT_MAP = {
  GRID: 'GRID_BASE',
  FORM: 'GRID_BASE',
  CONTAINER_SPLIT_H:   'CONTAINER_CARD',
  CONTAINER_SPLIT_V:   'CONTAINER_CARD',
  CONTAINER_TABPAGE:   'CONTAINER_TAB',
};

// Data binding source 옵션 (Layer 속성 > Data 탭)
export const DATA_SOURCES = [
  { code: 'sp',          label: 'SP' },
  { code: 'ontology',    label: 'Ontology' },
  { code: 'db_entity',   label: 'DB Entity' },
  { code: 'kpi_db',      label: 'KPI Dictionary & DB Entity' },
  { code: 'code_master', label: 'Code Master' },
  { code: 'manual',      label: 'Direct Input' },
  { code: 'block',       label: 'Other Layer Data' },
];

// Legacy Data source 코드 마이그레이션
export const LEGACY_DATA_SOURCE_MAP = {
  kpi_dictionary: 'kpi_db',
};

// Write 전용 data source (Create/Update/Delete) — SP + In-Line SQL 2가지
export const WRITE_DATA_SOURCES = [
  { code: 'sp',         label: 'SP' },
  { code: 'inline_sql', label: 'In-Line SQL' },
];

export const normalizeDataSource = (code) => {
  if (!code) return 'sp';
  return LEGACY_DATA_SOURCE_MAP[code] || code;
};

// Event 후보 — dataDisplay/chart/action 위주
export const EVENT_TYPES = [
  { code: 'rowClick',        label: '행 클릭',       description: '사용자가 행을 마우스 클릭 시 발생' },
  { code: 'rowDblClick',     label: '행 더블클릭',   description: '행 더블클릭 — 상세 조회/편집 트리거' },
  { code: 'selectionChange', label: '선택 변경',     description: '사용자가 행을 클릭하거나 키보드로 이동' },
  { code: 'click',           label: '클릭',          description: '컴포넌트(버튼/카드 등) 클릭' },
  { code: 'change',          label: '값 변경',       description: '입력 값이 변경될 때' },
  { code: 'submit',          label: '제출',          description: 'Form 제출 시' },
  { code: 'tabChange',       label: '탭 전환',       description: '탭 컨테이너의 활성 탭이 변경될 때' },
];

// Event 액션 — target block 에 대해 실행
export const EVENT_ACTIONS = [
  { code: 'refresh',  label: '재조회',              description: '대상의 data_source 를 다시 호출합니다' },
  { code: 'filter',   label: '필터 적용',            description: '대상에 필터 조건을 적용' },
  { code: 'navigate', label: '이동',                description: '다른 화면/URL 로 이동' },
  { code: 'setValue', label: '값 설정',              description: '대상 필드/state 에 값 주입' },
  { code: 'open',     label: '열기 (popup/drawer)', description: 'popup/drawer 를 열고 payload 전달' },
  { code: 'close',    label: '닫기',                description: '현재 열린 popup/drawer 를 닫기' },
];

// Initial-fire target — 화면 진입 직후 자동 발사 기준
export const INITIAL_FIRE_TARGETS = [
  { code: 'firstRow',    label: '첫 행' },
  { code: 'lastRow',     label: '마지막 행' },
  { code: 'specificIdx', label: '특정 행 번호' },
];

// Payload binding 자동완성 prefix
export const PAYLOAD_BINDING_SUGGESTIONS = [
  '@current_row.',   // 현재 선택된 행의 컬럼
  '@selected_rows',  // 다중 선택된 행 배열
  '@form.',          // 폼 필드
  '@global.',        // 전역 store
  '@user.',          // 사용자 context
  '@const.',         // 상수
];

export const DEFAULT_COMPONENT_CODE = 'GRID_BASE';

export const normalizeComponentCode = (code) => {
  if (!code) return DEFAULT_COMPONENT_CODE;
  if (LEGACY_COMPONENT_MAP[code]) return LEGACY_COMPONENT_MAP[code];
  return code;
};

// Grid 계열 componentType 집합 — Props 기본값 적용 대상
export const GRID_COMPONENT_CODES = new Set([
  'GRID_BASE', 'GRID_TREE', 'GRID_CROSSTAB', 'GRID_PIVOT',
]);

export const isGridComponentCode = (code) =>
  GRID_COMPONENT_CODES.has(normalizeComponentCode(code));

// Grid Layer 기본 Props — 설계서 기반 생성 > Layout 정리 단계에서 일괄 적용
//   · ReadOnly   : CRUD 지원 여부 (false = 편집 가능, true = 조회 전용)
//   · CheckBox   : 행 선택용 맨 앞 체크박스 표시
//   · No.        : Row Number(SEQ) 컬럼 표시
//   · UpdateFlag : 행 수정 상태 플래그 컬럼 표시
export const GRID_DEFAULT_PROPS_ORDER = ['ReadOnly', 'CheckBox', 'No.', 'UpdateFlag'];

export const GRID_DEFAULT_PROPS = {
  ReadOnly:   'false',
  CheckBox:   'false',
  'No.':      'false',
  UpdateFlag: 'false',
};

// Grid 계열 layer 에 대해 기본 props 4종을 보강. 기존 값은 보존.
//   - componentType 이 Grid 가 아니면 existingProps 그대로 반환
//   - existingProps 가 null/undefined 여도 안전
export const withGridDefaultProps = (componentType, existingProps) => {
  const safe = existingProps && typeof existingProps === 'object' ? existingProps : {};
  if (!isGridComponentCode(componentType)) return safe;
  const merged = {};
  // 기본 props 를 먼저 삽입하여 key 순서를 안정화
  GRID_DEFAULT_PROPS_ORDER.forEach(k => {
    merged[k] = Object.prototype.hasOwnProperty.call(safe, k) ? safe[k] : GRID_DEFAULT_PROPS[k];
  });
  // 그 외 사용자 추가 props 는 뒤에 유지
  Object.entries(safe).forEach(([k, v]) => {
    if (!Object.prototype.hasOwnProperty.call(merged, k)) merged[k] = v;
  });
  return merged;
};

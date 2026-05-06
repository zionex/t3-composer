-- =============================================================
-- T3Composer — 화면 패턴 DB 관리 + Seed 35개
-- =============================================================
-- Version : v26.0.0 (Stage 7)
-- Created : 2026-04-22
-- Fix     : DBeaver 파싱 호환 — VISUAL 을 단일 라인 + REPLACE 치환으로 변경
-- 비고    : 'line1@NL@line2' 형태의 @NL@ 를 CHAR(10) 으로 치환하여 실제 줄바꿈 저장
-- =============================================================

-- 기존 테이블 제거
IF OBJECT_ID('dbo.TB_IS_COMPOSER_PATTERN', 'U') IS NOT NULL
    DROP TABLE T3SMARTSCM.dbo.TB_IS_COMPOSER_PATTERN;

CREATE TABLE T3SMARTSCM.dbo.TB_IS_COMPOSER_PATTERN (
    ID               VARCHAR(32)   NOT NULL,
    CODE             VARCHAR(20)   NOT NULL,
    LAYOUT           VARCHAR(60)   NOT NULL,
    CATEGORY         VARCHAR(40)   NULL,
    NAME             NVARCHAR(100) NOT NULL,
    NAME_EN          NVARCHAR(100) NULL,
    DESCRIPTION      NVARCHAR(MAX) NULL,
    VISUAL           NVARCHAR(MAX) NULL,
    EXAMPLE_FILE     NVARCHAR(255) NULL,
    FREQUENCY        INT           DEFAULT 1 NULL,
    RECOMMENDED_FOR  NVARCHAR(500) NULL,
    COMPONENT_STACK  NVARCHAR(MAX) NULL,
    WHEN_TO_USE      NVARCHAR(MAX) NULL,
    SORT_ORDER       INT           DEFAULT 0 NULL,
    USE_YN           CHAR(1)       DEFAULT 'Y' NULL,
    CREATE_BY        NVARCHAR(100) NULL,
    CREATE_DTTM      DATETIME      DEFAULT GETDATE() NULL,
    MODIFY_BY        NVARCHAR(100) NULL,
    MODIFY_DTTM      DATETIME      NULL,
    CONSTRAINT PK_TB_IS_COMPOSER_PATTERN PRIMARY KEY (ID),
    CONSTRAINT UQ_TB_IS_COMPOSER_PATTERN UNIQUE (CODE)
);

CREATE NONCLUSTERED INDEX IX_TB_IS_COMPOSER_PATTERN_CAT   ON T3SMARTSCM.dbo.TB_IS_COMPOSER_PATTERN (CATEGORY ASC);
CREATE NONCLUSTERED INDEX IX_TB_IS_COMPOSER_PATTERN_ORDER ON T3SMARTSCM.dbo.TB_IS_COMPOSER_PATTERN (SORT_ORDER ASC);

EXEC T3SMARTSCM.sys.sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'T3Composer 화면 구성 패턴 카탈로그 (Wizard 에서 선택)',
    @level0type = N'Schema', @level0name = N'dbo',
    @level1type = N'Table',  @level1name = N'TB_IS_COMPOSER_PATTERN';


-- =============================================================
-- Seed data — 35 patterns
-- =============================================================

-- ============ DASHBOARD 카테고리 ============

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, EXAMPLE_FILE, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P01', 'widget_dashboard', 'DASHBOARD', N'위젯 대시보드', N'Widget Dashboard', N'KPI/차트 위젯을 고정 캔버스에 배치하는 모니터링 보드',
REPLACE(N'┌──────────────────────┐@NL@│ [W1] [W2] [W3]       │@NL@│ [W4]   [W5]          │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
N'view/dashboard/kpiboard/KpiBoard.jsx', 3, N'모니터링,KPI,대시보드', 10, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, EXAMPLE_FILE, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P13', 'kpi_chart', 'DASHBOARD', N'KPI 카드 + 메인 차트', N'KPI Cards + Main Chart', N'상단 KPI 4개 카드 + 하단 풀 차트. 단일 지표 집중 모니터링',
REPLACE(N'┌──────────────────────┐@NL@│ [1,234] [89%] [456]  │@NL@│  KPI1    KPI2   KPI3 │@NL@├──────────────────────┤@NL@│     📊 메인 차트      │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
N'view/dashboard/overview/Overview.jsx', 3, N'KPI,요약,모니터링', 11, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P16', 'grid_2x2', 'DASHBOARD', N'2x2 다중 차트', N'2x2 Multi Chart', N'4개의 차트를 2x2 그리드로 배치하여 다각도 분석',
REPLACE(N'┌──────────┬──────────┐@NL@│  Chart 1 │  Chart 2 │@NL@├──────────┼──────────┤@NL@│  Chart 3 │  Chart 4 │@NL@└──────────┴──────────┘', N'@NL@', CHAR(10)),
2, N'비교 분석,다중 지표', 12, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P18', 'drilldown', 'DASHBOARD', N'드릴다운 분석', N'Drilldown (Master→Detail)', N'마스터 차트 클릭 시 하단에 상세 차트 표시',
REPLACE(N'┌──────────────────────┐@NL@│  🔹 마스터 차트       │@NL@│  (클릭하여 드릴다운)  │@NL@└──────────┬───────────┘@NL@           ↓@NL@┌──────────────────────┐@NL@│  📊 디테일 차트       │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'계층 분석,상세 조회', 13, N'system', '1970-01-01');

-- ============ GRID 카테고리 ============

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, EXAMPLE_FILE, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P02', 'search_grid', 'GRID', N'검색 + 단일 그리드', N'Search-Grid', N'상단 검색 + CRUD 가능한 단일 그리드 (가장 일반적인 마스터 관리)',
REPLACE(N'┌──────────────────────┐@NL@│ 🔍 검색 조건          │@NL@├──────────────────────┤@NL@│ [+][−][💾][📄] 버튼   │@NL@│ ╔══════════════════╗ │@NL@│ ║ 그리드            ║ │@NL@│ ╚══════════════════╝ │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
N'view/system/usermgmt/usergroup/UserGroup.jsx', 3, N'마스터,CRUD,일반 조회', 20, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, EXAMPLE_FILE, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P04', 'split_master_detail', 'GRID', N'수평 스플릿 마스터-디테일', N'Split Master-Detail', N'좌측 선택 → 우측 상세 표시 (코드그룹↔코드 등)',
REPLACE(N'┌────────┬───────────┐@NL@│ 마스터  │ 상세       │@NL@│ [선택]──→[표시]     │@NL@│        │           │@NL@└────────┴───────────┘', N'@NL@', CHAR(10)),
N'view/system/commoncode/CommonCode.jsx', 2, N'부모-자식,계층 매핑', 21, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P19', 'tree_grid', 'GRID', N'트리 + 그리드', N'Tree + Grid', N'좌측 트리 구조 네비게이션 + 우측 그리드 목록 표시',
REPLACE(N'┌────────┬───────────┐@NL@│ ▼ 루트  │ 목록 그리드 │@NL@│  ├ A    │ ╔════════╗ │@NL@│  ├ B    │ ║ items  ║ │@NL@│  └ C    │ ╚════════╝ │@NL@└────────┴───────────┘', N'@NL@', CHAR(10)),
2, N'계층 탐색,분류', 22, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P24', 'tree_grid_detail', 'GRID', N'3분할: 트리-그리드-상세', N'Tree-Grid-Detail', N'좌 트리 탐색 + 중앙 그리드 목록 + 우 선택 항목 상세',
REPLACE(N'┌─────┬──────────┬──────┐@NL@│ 트리 │ 그리드    │ 상세 │@NL@│ ▼ A │ items     │ 폼   │@NL@│ ▼ B │ ...       │ ...  │@NL@└─────┴──────────┴──────┘', N'@NL@', CHAR(10)),
2, N'복합 탐색,대용량 마스터', 23, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P20', 'card_list', 'GRID', N'카드 리스트', N'Card List / Gallery', N'항목을 카드 형태로 표시 (갤러리 · 뉴스 · 제품 목록)',
REPLACE(N'┌──────────────────────┐@NL@│ 🔍 검색               │@NL@├──────────────────────┤@NL@│ [Card] [Card] [Card] │@NL@│ [Card] [Card] [Card] │@NL@│ [Card] [Card] [Card] │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'시각적 목록,갤러리,뉴스', 24, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P35', 'infinite_list', 'GRID', N'무한 스크롤 목록', N'Infinite Scroll List', N'아래로 스크롤하면서 자동 로드되는 대용량 목록',
REPLACE(N'┌──────────────────────┐@NL@│ 항목 1                │@NL@│ 항목 2                │@NL@│ ...                  │@NL@│ 항목 N  (loading...)  │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'대용량,피드,알림', 25, N'system', '1970-01-01');

-- ============ ENTRY 카테고리 ============

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, EXAMPLE_FILE, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P06', 'pivot_entry', 'ENTRY', N'크로스탭 피벗 입력', N'Pivot Entry', N'시간버킷(월/주/분기) 단위 피벗 입력 그리드',
REPLACE(N'┌──────────────────────┐@NL@│ 🔍 검색               │@NL@├──────────────────────┤@NL@│ 지표│1월│2월│3월│...  │@NL@│ 계획│100│120│...      │@NL@│ 실적│ 95│110│...      │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
N'view/demandplan/entry/entry/BaseEntry.jsx', 2, N'계획 입력,시간버킷', 30, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P21', 'form_detail_grid', 'ENTRY', N'헤더 폼 + 하단 그리드', N'Form + Detail Grid', N'상단 헤더 입력 폼 + 하단 라인 항목 그리드 (주문·세금계산서)',
REPLACE(N'┌──────────────────────┐@NL@│ 주문 헤더 정보        │@NL@│ 고객 ____ 날짜 ____   │@NL@├──────────────────────┤@NL@│ 품목 │ 수량 │ 단가   │@NL@│ ...  │ ...  │ ...    │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'주문,명세서,헤더-라인', 31, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P22', 'wizard_stepper', 'ENTRY', N'단계 마법사', N'Wizard Stepper', N'여러 단계로 분할된 순차 입력 (회원 가입·계획 생성)',
REPLACE(N'┌──────────────────────┐@NL@│ ①──②──●──④  Stepper │@NL@├──────────────────────┤@NL@│ Step 3 입력 폼        │@NL@│ [기본정보 ...]        │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'신규 등록,복잡한 입력', 32, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P34', 'settings_form', 'ENTRY', N'설정 화면', N'Settings Form', N'좌측 카테고리 네비게이션 + 우측 설정 항목 폼',
REPLACE(N'┌────────┬─────────────┐@NL@│ 일반    │ ☑ 알림 수신  │@NL@│ 알림 ●  │ ☑ 메일 수신  │@NL@│ 보안    │ ○ 다크 모드  │@NL@└────────┴─────────────┘', N'@NL@', CHAR(10)),
1, N'환경설정,개인화', 33, N'system', '1970-01-01');

-- ============ ANALYSIS 카테고리 ============

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, EXAMPLE_FILE, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P03', 'search_tab', 'ANALYSIS', N'검색 + 탭 그리드/차트', N'Search-Tab', N'같은 조건으로 여러 관점(탭) 전환',
REPLACE(N'┌──────────────────────┐@NL@│ 🔍 검색               │@NL@├──────────────────────┤@NL@│ [탭A][탭B][탭C]       │@NL@│ ┌──────────────────┐ │@NL@│ │ 탭별 그리드/차트  │ │@NL@│ └──────────────────┘ │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
N'view/masterplan/analysisreport/resstatus/ResStatus.jsx', 2, N'분석 리포트,다관점 조회', 40, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, EXAMPLE_FILE, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P05', 'grid_chart_stacked', 'ANALYSIS', N'그리드 + 차트 상하', N'Grid-Chart Stacked', N'상단 그리드(집계) + 하단 차트(트렌드)',
REPLACE(N'┌──────────────────────┐@NL@│ ╔══════════════════╗ │@NL@│ ║   그리드          ║ │@NL@│ ╚══════════════════╝ │@NL@├──────────────────────┤@NL@│   📊 차트            │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
N'view/baselineforecast/report/salesanalysis/SalesAnalysis.jsx', 2, N'분석,리포트', 41, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P14', 'chart_grid_horizontal', 'ANALYSIS', N'좌 차트 + 우 그리드', N'Chart Left + Grid Right', N'좌측 시각화 차트 + 우측 상세 테이블 (나란히 배치)',
REPLACE(N'┌──────────┬──────────┐@NL@│  📊 차트  │ 그리드    │@NL@│          │ ═════════│@NL@│          │ ═════════│@NL@└──────────┴──────────┘', N'@NL@', CHAR(10)),
2, N'대시보드,분석', 42, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P15', 'chart_grid_vertical', 'ANALYSIS', N'상 차트 + 하 그리드', N'Chart Top + Grid Bottom', N'상단 트렌드 차트 + 하단 상세 데이터 테이블',
REPLACE(N'┌──────────────────────┐@NL@│      📊 차트          │@NL@├──────────────────────┤@NL@│ ═════════════════════ │@NL@│ ═════════════════════ │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'트렌드,집계', 43, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P17', 'tab_chart', 'ANALYSIS', N'탭 내 차트 전환', N'Tab Chart Switch', N'서브탭(월별/분기별/연별)으로 동일 영역에 차트 교체',
REPLACE(N'┌──────────────────────┐@NL@│ [월별]▼ [분기별] [연별] │@NL@├──────────────────────┤@NL@│                      │@NL@│   📊 탭별 차트       │@NL@│                      │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'시간 집계,비교', 44, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, EXAMPLE_FILE, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P12', 'pivot_table', 'ANALYSIS', N'피벗 테이블', N'Pivot Table', N'D/M/P/V 컬럼 타입 다차원 피벗',
REPLACE(N'┌──────────────────────┐@NL@│ D │ D │ M │ V         │@NL@│ Dim│Dim│Mea│Val       │@NL@│ ··│···│···│···        │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
N'view/sample/sample02/Sample02.jsx', 1, N'다차원 분석', 45, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P29', 'heatmap', 'ANALYSIS', N'히트맵', N'Heatmap', N'시간·카테고리 매트릭스에 색상 강도로 값 표시',
REPLACE(N'┌──────────────────────┐@NL@│     月 火 水 木 金    │@NL@│ 09 ░░ ██ ▓▓ ░░ ░░    │@NL@│ 12 ██ ██ ▓▓ ▓▓ ██    │@NL@│ 18 ▓▓ ██ ██ ██ ▓▓    │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'밀도 분석,사용자 패턴', 46, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P26', 'report_tabs', 'ANALYSIS', N'리포트 탭', N'Report Tabs', N'상단에 여러 리포트 탭 전환 + 각 탭은 독립적인 그리드/차트',
REPLACE(N'┌──────────────────────┐@NL@│ [종합][매출][재고][예측] │@NL@├──────────────────────┤@NL@│ 리포트별 콘텐츠       │@NL@│ (그리드 + 차트 혼합)  │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'다종 리포트,경영 보고', 47, N'system', '1970-01-01');

-- ============ VISUALIZATION 카테고리 ============

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, EXAMPLE_FILE, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P09', 'gantt', 'VISUALIZATION', N'간트 차트', N'Gantt Chart', N'리소스 부하 · 일정 시각화',
REPLACE(N'┌──────────┬──────────┐@NL@│ 리소스    │  ▓▓░░▓▓  │@NL@│ ▼ 공장    │  ▓▓▓░░░  │@NL@│   · 라인1 │  ░▓▓▓▓░  │@NL@└──────────┴──────────┘', N'@NL@', CHAR(10)),
N'view/masterplan/analysisreport/resourcegantt/ResourceGantt.jsx', 1, N'일정,리소스 부하', 50, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, EXAMPLE_FILE, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P10', 'flo_diagram', 'VISUALIZATION', N'FLO 다이어그램', N'FLO Flow Diagram', N'BOM/공급망 그래프 (ReactFlow)',
REPLACE(N'┌──────────────────────┐@NL@│  ○────○────○         │@NL@│   ╲    ╲             │@NL@│    ○────○            │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
N'view/supplychainmodel/flo/Flo.jsx', 1, N'BOM,공급망 그래프', 51, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, EXAMPLE_FILE, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P11', 'map', 'VISUALIZATION', N'지도 위젯', N'Map Widget', N'Google Maps / Leaflet 기반 거점 시각화',
REPLACE(N'┌──────────────────────┐@NL@│       🗺️             │@NL@│   📍    📍           │@NL@│      📍              │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
N'view/snop/map/Map.jsx', 1, N'지리,거점 시각화', 52, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P23', 'timeline', 'VISUALIZATION', N'타임라인', N'Timeline / Event', N'시간 순서에 따른 이벤트 표시 (이력 · 감사 로그)',
REPLACE(N'┌──────────────────────┐@NL@│ ●──2024.01 생성      │@NL@│ │                    │@NL@│ ●──2024.03 변경      │@NL@│ │                    │@NL@│ ●──2024.06 완료      │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'이력,감사 로그', 53, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P25', 'calendar', 'VISUALIZATION', N'캘린더 뷰', N'Calendar View', N'월간 달력 그리드 + 이벤트 표시',
REPLACE(N'┌──────────────────────┐@NL@│   일 월 화 수 목 금 토 │@NL@│    1  2  3 [4] 5  6 7 │@NL@│    8 [9]10 11 12 13 .. │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'일정,회의,휴일', 54, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P27', 'scheduler', 'VISUALIZATION', N'스케줄러', N'Scheduler', N'일 / 주 / 월 단위 타임슬롯에 이벤트 배치 · 드래그 가능',
REPLACE(N'┌──────────────────────┐@NL@│      月 火 水 木 金  │@NL@│ 09 [미팅]   [회의]   │@NL@│ 10    [발표]         │@NL@│ 14         [교육]    │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'예약,회의실,근무시간', 55, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P28', 'network_graph', 'VISUALIZATION', N'네트워크 그래프', N'Network Graph', N'D3/Cytoscape 기반 관계 네트워크 시각화',
REPLACE(N'┌──────────────────────┐@NL@│    ○───○              │@NL@│   ╱ ╲ ╱               │@NL@│  ○   ●───○            │@NL@│   ╲   ╲               │@NL@│    ○───○              │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'관계망,영향도 분석', 56, N'system', '1970-01-01');

-- ============ WORKFLOW 카테고리 ============

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, EXAMPLE_FILE, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P07', 'control_board', 'WORKFLOW', N'컨트롤보드 (Stepper + Card)', N'Control Board', N'버전 생성/승인/마감 워크플로',
REPLACE(N'┌──────────────────────┐@NL@│ ○─○─○─○  단계 Stepper │@NL@├──────────────────────┤@NL@│ [버전카드 1] [상태]   │@NL@│ [버전카드 2] ...     │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
N'view/baselineforecast/version/controlboard/ControlBoard.jsx', 2, N'버전 관리,워크플로', 60, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, EXAMPLE_FILE, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P08', 'process_status', 'WORKFLOW', N'프로세스 진행 현황', N'Process Status', N'Stepper + TreeGrid 로 다단계 승인 추적',
REPLACE(N'┌──────────────────────┐@NL@│ ○─●─○   Stepper      │@NL@├──────────────────────┤@NL@│ ▼ 그룹 A             │@NL@│   ·유저1 SUBMITTED   │@NL@│   ·유저2 PENDING     │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
N'view/demandplan/version/processstatus/BaseProcessStatus.jsx', 1, N'승인 추적', 61, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P30', 'approval_list', 'WORKFLOW', N'승인 대기 리스트', N'Approval List', N'내가 처리해야 할 항목 목록 · 승인/반려 액션 버튼',
REPLACE(N'┌──────────────────────┐@NL@│ 대기 항목 (5)         │@NL@├──────────────────────┤@NL@│ [승인][반려] 항목 #1 │@NL@│ [승인][반려] 항목 #2 │@NL@│ [승인][반려] 항목 #3 │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'결재,업무 처리', 62, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P31', 'kanban', 'WORKFLOW', N'칸반 보드', N'Kanban Board', N'상태 컬럼 + 카드 드래그 앤 드롭으로 진행 단계 이동',
REPLACE(N'┌──────┬──────┬──────┐@NL@│ TODO │ DOING│ DONE │@NL@├──────┼──────┼──────┤@NL@│ [C1] │ [C3] │ [C5] │@NL@│ [C2] │ [C4] │      │@NL@└──────┴──────┴──────┘', N'@NL@', CHAR(10)),
1, N'작업 관리,프로젝트', 63, N'system', '1970-01-01');

-- ============ NAVIGATION 카테고리 ============

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P36', 'sidebar_main', 'NAVIGATION', N'사이드바 + 메인', N'Sidebar + Main', N'좌측 항목 네비게이션 + 우측 메인 콘텐츠 (설정·관리 화면)',
REPLACE(N'┌──────┬───────────────┐@NL@│ 메뉴1 │               │@NL@│ 메뉴2 │ 메인 콘텐츠   │@NL@│ 메뉴3 │               │@NL@│ 메뉴4 │               │@NL@└──────┴───────────────┘', N'@NL@', CHAR(10)),
1, N'관리 화면,설정', 70, N'system', '1970-01-01');

-- ============ SPECIAL 카테고리 ============

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P32', 'code_editor', 'SPECIAL', N'코드/SQL 에디터', N'Code Editor', N'Monaco Editor 기반 코드 · SQL 작성/실행',
REPLACE(N'┌──────────────────────┐@NL@│ SELECT *              │@NL@│   FROM TB_XXX         │@NL@│   WHERE ...           │@NL@├──────────────────────┤@NL@│ [실행]  결과 그리드   │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'SQL 콘솔,스크립트', 80, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P33', 'doc_viewer', 'SPECIAL', N'문서 뷰어', N'Document Viewer', N'PDF / Excel 미리보기 · 다운로드',
REPLACE(N'┌──────┬───────────────┐@NL@│ 파일  │  📄 PDF 본문  │@NL@│ 목록  │               │@NL@│ ├ A  │               │@NL@│ └ B  │ [다운로드]    │@NL@└──────┴───────────────┘', N'@NL@', CHAR(10)),
1, N'매뉴얼,첨부', 81, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P37', 'diff_view', 'SPECIAL', N'비교 뷰 (Diff)', N'Diff / Compare', N'좌우 또는 상하로 두 버전 비교 · 변경 강조',
REPLACE(N'┌──────────┬──────────┐@NL@│ Before   │ After    │@NL@│ line A   │ line A   │@NL@│ - line B │ + line B │@NL@│ line C   │ line C   │@NL@└──────────┴──────────┘', N'@NL@', CHAR(10)),
1, N'버전 비교,이력 조회', 82, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM)
VALUES (REPLACE(NEWID(),'-',''), 'P38', 'chat', 'SPECIAL', N'채팅 · 코멘트', N'Chat / Comment', N'대화형 메시지 목록 + 입력창 (업무 협업 · 이슈 코멘트)',
REPLACE(N'┌──────────────────────┐@NL@│ 👤 홍길동 09:20       │@NL@│   안녕하세요          │@NL@│          👤 10:01 저도 │@NL@│              안녕합니다 │@NL@├──────────────────────┤@NL@│ [입력...] [전송]      │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'협업,코멘트,채팅', 83, N'system', '1970-01-01');


-- 결과 확인
SELECT CATEGORY, COUNT(*) AS CNT FROM TB_IS_COMPOSER_PATTERN GROUP BY CATEGORY ORDER BY CATEGORY;
SELECT COUNT(*) AS TOTAL_PATTERNS FROM TB_IS_COMPOSER_PATTERN;

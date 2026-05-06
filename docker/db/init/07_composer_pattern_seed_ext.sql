-- =============================================================
-- T3Composer — 화면 패턴 Seed 대량 확장 (Layer 기반) [MSSQL]
-- =============================================================
-- Version : v26.0.0 (Stage 7-ext)
-- Created : 2026-04-22
-- 내용   : 레이아웃 분할(V/H/MIX) 관점의 패턴을 대량 추가.
--          사용자가 화면 패턴 관리 화면에서 수동 등록 부담을 줄이기
--          위해 가능한 조합을 최대한 많이 선등록.
-- 분류   :
--   LAYOUT_V2 : 상하 2분할 (V2_01 ~ V2_25)
--   LAYOUT_V3 : 상하 3분할 (V3_01 ~ V3_20)
--   LAYOUT_V4 : 상하 4분할 (V4_01 ~ V4_10)
--   LAYOUT_V5 : 상하 5+분할 (V5_01 ~ V5_05)
--   LAYOUT_H2 : 좌우 2분할 (H2_01 ~ H2_16)
--   LAYOUT_H3 : 좌우 3분할 (H3_01 ~ H3_10)
--   LAYOUT_H4 : 좌우 4분할 (H4_01 ~ H4_05)
--   LAYOUT_H5 : 좌우 5+분할 (H5_01 ~ H5_02)
--   LAYOUT_MIXED : 상하+좌우 혼합 + 탭/아코디언/격자/특수 (MIX_01 ~ MIX_40)
-- 총 133개 신규 패턴
-- 비고   : 'line1@NL@line2' 형태의 @NL@ 를 CHAR(10) 으로 치환하여 저장
-- =============================================================


-- 재실행 대비 기존 확장 Seed 제거 (기존 P01~P38 은 보존)
DELETE FROM TB_IS_COMPOSER_PATTERN
    WHERE CATEGORY LIKE 'LAYOUT[_]%'
       OR CODE LIKE 'V[0-9][_]%'
       OR CODE LIKE 'H[0-9][_]%'
       OR CODE LIKE 'MIX[_]%';


-- =============================================================
-- LAYOUT_V2  (상하 2분할)  -- 25개
-- =============================================================

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_01', 'v2_search_grid', 'LAYOUT_V2', N'상하2: 검색 + 그리드', N'V2: Search + Grid', N'상단 검색 조건 + 하단 CRUD 그리드 (가장 일반적)',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@└──────────────┘', N'@NL@', CHAR(10)),
3, N'마스터,CRUD,일반조회', 100, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_02', 'v2_search_chart', 'LAYOUT_V2', N'상하2: 검색 + 차트', N'V2: Search + Chart', N'상단 검색 조건 + 하단 단일 차트',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ 📊 Chart      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
3, N'트렌드,단일지표', 101, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_03', 'v2_search_cards', 'LAYOUT_V2', N'상하2: 검색 + 카드 리스트', N'V2: Search + Card List', N'상단 검색 + 하단 카드 갤러리',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ [▣][▣][▣]    │@NL@│ [▣][▣][▣]    │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'갤러리,제품목록', 102, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_04', 'v2_search_tree', 'LAYOUT_V2', N'상하2: 검색 + 트리', N'V2: Search + Tree', N'상단 검색 + 하단 계층 트리',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ ▼ Root        │@NL@│   ├ A ├ B     │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'계층,분류', 103, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_05', 'v2_search_pivot', 'LAYOUT_V2', N'상하2: 검색 + 피벗 테이블', N'V2: Search + Pivot', N'상단 검색 + 하단 D/M/P/V 피벗',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ D│D│M│V        │@NL@│ ··│··│··│··   │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'다차원분석', 104, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_06', 'v2_filter_list', 'LAYOUT_V2', N'상하2: 필터 + 리스트', N'V2: Filter + List', N'상단 필터 칩 + 하단 일반 리스트',
REPLACE(N'┌──────────────┐@NL@│ [F1][F2][F3] │@NL@├──────────────┤@NL@│ ▢ Item 1      │@NL@│ ▢ Item 2      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'필터링,목록', 105, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_07', 'v2_toolbar_grid', 'LAYOUT_V2', N'상하2: 툴바 + 그리드', N'V2: Toolbar + Grid', N'상단 액션 툴바 + 하단 그리드',
REPLACE(N'┌──────────────┐@NL@│ [+][-][💾][⬇] │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@└──────────────┘', N'@NL@', CHAR(10)),
3, N'검색없는 CRUD', 106, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_08', 'v2_kpi_grid', 'LAYOUT_V2', N'상하2: KPI 카드 + 그리드', N'V2: KPI Cards + Grid', N'상단 KPI 카드 N개 + 하단 상세 그리드',
REPLACE(N'┌──────────────┐@NL@│ [K1][K2][K3]  │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@└──────────────┘', N'@NL@', CHAR(10)),
3, N'대시보드,요약+상세', 107, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_09', 'v2_kpi_chart', 'LAYOUT_V2', N'상하2: KPI 카드 + 차트', N'V2: KPI Cards + Chart', N'상단 KPI + 하단 풀 차트',
REPLACE(N'┌──────────────┐@NL@│ [K1][K2][K3]  │@NL@├──────────────┤@NL@│ 📊 Chart      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
3, N'KPI 모니터링', 108, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_10', 'v2_grid_chart', 'LAYOUT_V2', N'상하2: 그리드 + 차트', N'V2: Grid (top) + Chart (bottom)', N'상단 집계 그리드 + 하단 트렌드 차트',
REPLACE(N'┌──────────────┐@NL@│ ▦ Grid        │@NL@├──────────────┤@NL@│ 📊 Chart      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'집계+트렌드', 109, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_11', 'v2_chart_grid', 'LAYOUT_V2', N'상하2: 차트 + 그리드', N'V2: Chart (top) + Grid (bottom)', N'상단 시각화 차트 + 하단 원천 데이터',
REPLACE(N'┌──────────────┐@NL@│ 📊 Chart      │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'분석,리포트', 110, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_12', 'v2_form_grid', 'LAYOUT_V2', N'상하2: 폼 + 그리드', N'V2: Form + Grid', N'상단 입력 폼 + 하단 입력 결과 그리드 (헤더-라인)',
REPLACE(N'┌──────────────┐@NL@│ ▢ Form        │@NL@│ ___ ___ ___  │@NL@├──────────────┤@NL@│ ▦ Lines       │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'주문,명세서', 111, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_13', 'v2_form_chart', 'LAYOUT_V2', N'상하2: 폼 + 차트', N'V2: Form + Chart', N'상단 파라미터 폼 + 하단 시뮬레이션 차트',
REPLACE(N'┌──────────────┐@NL@│ ▢ Form Params │@NL@├──────────────┤@NL@│ 📊 Chart      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
1, N'시뮬레이션', 112, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_14', 'v2_header_tab', 'LAYOUT_V2', N'상하2: 헤더 + 탭 패널', N'V2: Header + Tab Panel', N'상단 정보 헤더 + 하단 탭 전환 영역',
REPLACE(N'┌──────────────┐@NL@│ ℹ Header      │@NL@├──────────────┤@NL@│ [T1][T2][T3]  │@NL@│ 탭 콘텐츠      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
3, N'상세조회,탭 전환', 113, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_15', 'v2_master_master', 'LAYOUT_V2', N'상하2: 마스터 + 서브마스터', N'V2: Master + SubMaster', N'상단 상위 그리드 + 하단 하위 연관 그리드',
REPLACE(N'┌──────────────┐@NL@│ ▦ Master      │@NL@├──────────────┤@NL@│ ▦ Sub-Master  │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'두단계 계층', 114, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_16', 'v2_info_grid', 'LAYOUT_V2', N'상하2: 정보 카드 + 그리드', N'V2: Info Card + Grid', N'상단 정보 요약 카드 + 하단 상세 그리드',
REPLACE(N'┌──────────────┐@NL@│ ℹ Info Card   │@NL@│ 제목·상태     │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'상세 정보', 115, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_17', 'v2_search_gantt', 'LAYOUT_V2', N'상하2: 검색 + 간트 차트', N'V2: Search + Gantt', N'상단 검색 + 하단 간트 (자원 일정)',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ ▓▓░░▓▓  Line │@NL@│ ░▓▓░░░  Line │@NL@└──────────────┘', N'@NL@', CHAR(10)),
1, N'자원일정,간트', 116, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_18', 'v2_search_map', 'LAYOUT_V2', N'상하2: 검색 + 지도', N'V2: Search + Map', N'상단 검색 + 하단 전체 지도 (거점)',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│   🗺️  📍 📍  │@NL@│       📍      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
1, N'거점,GIS', 117, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_19', 'v2_search_flo', 'LAYOUT_V2', N'상하2: 검색 + 플로우 다이어그램', N'V2: Search + Flow', N'상단 검색 + 하단 BOM/공급망 그래프',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ ○─○─○         │@NL@│  ╲ ╲ ○        │@NL@└──────────────┘', N'@NL@', CHAR(10)),
1, N'BOM,공급망', 118, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_20', 'v2_title_canvas', 'LAYOUT_V2', N'상하2: 타이틀바 + 캔버스', N'V2: Title + Canvas', N'상단 타이틀/브레드크럼 + 하단 풀 캔버스',
REPLACE(N'┌──────────────┐@NL@│ 제목 > 경로   │@NL@├──────────────┤@NL@│               │@NL@│  큰 캔버스    │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'워크플로 에디터', 119, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_21', 'v2_notice_main', 'LAYOUT_V2', N'상하2: 알림 배너 + 메인', N'V2: Notice Banner + Main', N'상단 공지·알림 + 하단 메인 콘텐츠',
REPLACE(N'┌──────────────┐@NL@│ ⚠ 공지·알림   │@NL@├──────────────┤@NL@│ 메인 콘텐츠   │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'공지,시스템 알림', 120, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_22', 'v2_progress_content', 'LAYOUT_V2', N'상하2: 진행률 + 콘텐츠', N'V2: Progress + Content', N'상단 진행 상태 바/스텝 + 하단 콘텐츠',
REPLACE(N'┌──────────────┐@NL@│ ▰▰▰▰▱▱ 60%   │@NL@├──────────────┤@NL@│ 콘텐츠        │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'배치,긴 프로세스', 121, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_23', 'v2_header_timeline', 'LAYOUT_V2', N'상하2: 헤더 + 타임라인', N'V2: Header + Timeline', N'상단 헤더 + 하단 시간 흐름 이벤트',
REPLACE(N'┌──────────────┐@NL@│ ℹ Header      │@NL@├──────────────┤@NL@│ ●─●─●─●       │@NL@│ 이벤트         │@NL@└──────────────┘', N'@NL@', CHAR(10)),
1, N'이력,감사', 122, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_24', 'v2_search_calendar', 'LAYOUT_V2', N'상하2: 검색 + 캘린더', N'V2: Search + Calendar', N'상단 검색/기간 + 하단 월별 캘린더',
REPLACE(N'┌──────────────┐@NL@│ 🔍 기간       │@NL@├──────────────┤@NL@│ 일 월 화 …    │@NL@│ 1  2  3 ...   │@NL@└──────────────┘', N'@NL@', CHAR(10)),
1, N'일정,회의실', 123, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V2_25', 'v2_breadcrumb_content', 'LAYOUT_V2', N'상하2: 브레드크럼 + 콘텐츠', N'V2: Breadcrumb + Content', N'상단 경로 네비 + 하단 콘텐츠',
REPLACE(N'┌──────────────┐@NL@│ Home > A > B  │@NL@├──────────────┤@NL@│ 콘텐츠        │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'계층 네비게이션', 124, N'system', '1970-01-01');


-- =============================================================
-- LAYOUT_V3  (상하 3분할)  -- 20개
-- =============================================================

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V3_01', 'v3_search_grid_chart', 'LAYOUT_V3', N'상하3: 검색 + 그리드 + 차트', N'V3: Search + Grid + Chart', N'검색 조건 + 상세 그리드 + 트렌드 차트',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@├──────────────┤@NL@│ 📊 Chart      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
3, N'리포트,분석', 130, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V3_02', 'v3_search_chart_grid', 'LAYOUT_V3', N'상하3: 검색 + 차트 + 그리드', N'V3: Search + Chart + Grid', N'검색 조건 + 시각화 차트 + 상세 데이터',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ 📊 Chart      │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@└──────────────┘', N'@NL@', CHAR(10)),
3, N'분석,리포트', 131, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V3_03', 'v3_search_kpi_grid', 'LAYOUT_V3', N'상하3: 검색 + KPI + 그리드', N'V3: Search + KPI + Grid', N'검색 + KPI 카드 + 상세 그리드',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ [K1][K2][K3]  │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@└──────────────┘', N'@NL@', CHAR(10)),
3, N'KPI + 상세', 132, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V3_04', 'v3_header_main_action', 'LAYOUT_V3', N'상하3: 헤더 + 본문 + 액션바', N'V3: Header + Body + Actions', N'상단 헤더 + 중앙 본문 + 하단 액션 버튼',
REPLACE(N'┌──────────────┐@NL@│ ℹ Header      │@NL@├──────────────┤@NL@│ 본문          │@NL@├──────────────┤@NL@│ [저장][취소]  │@NL@└──────────────┘', N'@NL@', CHAR(10)),
3, N'편집,다이얼로그', 133, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V3_05', 'v3_toolbar_grid_status', 'LAYOUT_V3', N'상하3: 툴바 + 그리드 + 상태바', N'V3: Toolbar + Grid + Statusbar', N'상단 툴바 + 중앙 그리드 + 하단 상태바(행수/합계)',
REPLACE(N'┌──────────────┐@NL@│ [+][-][💾]    │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@├──────────────┤@NL@│ 📊 합계:1,234 │@NL@└──────────────┘', N'@NL@', CHAR(10)),
3, N'CRUD + 요약', 134, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V3_06', 'v3_search_tab_detail', 'LAYOUT_V3', N'상하3: 검색 + 탭 + 상세', N'V3: Search + Tab + Detail', N'검색 + 탭 영역 + 선택 항목 상세',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ [T1][T2] ▦    │@NL@├──────────────┤@NL@│ ▢ Detail      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'탭 분석 + 상세', 135, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V3_07', 'v3_kpi_grid_chart', 'LAYOUT_V3', N'상하3: KPI + 그리드 + 차트', N'V3: KPI + Grid + Chart', N'KPI 요약 + 상세 그리드 + 트렌드 차트',
REPLACE(N'┌──────────────┐@NL@│ [K1][K2][K3]  │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@├──────────────┤@NL@│ 📊 Chart      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
3, N'종합 대시보드', 136, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V3_08', 'v3_search_master_detail_v', 'LAYOUT_V3', N'상하3: 검색 + 마스터 + 디테일(세로)', N'V3: Search + Master + Detail', N'검색 + 상단 마스터 + 하단 디테일(세로 배치)',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ ▦ Master      │@NL@├──────────────┤@NL@│ ▦ Detail      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'계층 CRUD', 137, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V3_09', 'v3_search_grid_log', 'LAYOUT_V3', N'상하3: 검색 + 그리드 + 로그창', N'V3: Search + Grid + Log', N'검색 + 처리 대상 그리드 + 실행 로그',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@├──────────────┤@NL@│ ▤ Log         │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'배치 실행', 138, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V3_10', 'v3_stepper_form_button', 'LAYOUT_V3', N'상하3: 스텝퍼 + 폼 + 버튼', N'V3: Stepper + Form + Buttons', N'단계 표시 + 현재 단계 폼 + 이전/다음 버튼',
REPLACE(N'┌──────────────┐@NL@│ ①─●─③─④       │@NL@├──────────────┤@NL@│ ▢ Form        │@NL@├──────────────┤@NL@│ [이전][다음]  │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'마법사,가입', 139, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V3_11', 'v3_filter_cards_pagination', 'LAYOUT_V3', N'상하3: 필터 + 카드 + 페이지', N'V3: Filter + Cards + Pagination', N'필터 칩 + 카드 리스트 + 페이지네이션',
REPLACE(N'┌──────────────┐@NL@│ [F][F][F]     │@NL@├──────────────┤@NL@│ [▣][▣][▣]    │@NL@├──────────────┤@NL@│ ‹ 1 2 3 ›     │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'상품 목록', 140, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V3_12', 'v3_search_gantt_grid', 'LAYOUT_V3', N'상하3: 검색 + 간트 + 그리드', N'V3: Search + Gantt + Grid', N'검색 + 간트 + 원천 데이터 그리드',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ ▓▓░▓  ░▓▓   │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@└──────────────┘', N'@NL@', CHAR(10)),
1, N'자원 일정+상세', 141, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V3_13', 'v3_search_pivot_chart', 'LAYOUT_V3', N'상하3: 검색 + 피벗 + 차트', N'V3: Search + Pivot + Chart', N'검색 + 피벗 테이블 + 동기화 차트',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ D│M│V │···   │@NL@├──────────────┤@NL@│ 📊 Chart      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'다차원 분석', 142, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V3_14', 'v3_header_lines_summary', 'LAYOUT_V3', N'상하3: 헤더폼 + 라인 + 합계', N'V3: Header + Lines + Summary', N'주문 헤더 + 라인 그리드 + 합계/세금 영역',
REPLACE(N'┌──────────────┐@NL@│ ▢ 헤더 폼     │@NL@├──────────────┤@NL@│ ▦ Lines       │@NL@├──────────────┤@NL@│ Σ 합계 VAT    │@NL@└──────────────┘', N'@NL@', CHAR(10)),
3, N'주문서,세금계산서', 143, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V3_15', 'v3_kpi_chart_grid', 'LAYOUT_V3', N'상하3: KPI + 차트 + 그리드', N'V3: KPI + Chart + Grid', N'KPI 카드 + 메인 차트 + 드릴다운 그리드',
REPLACE(N'┌──────────────┐@NL@│ [K1][K2][K3]  │@NL@├──────────────┤@NL@│ 📊 Chart      │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@└──────────────┘', N'@NL@', CHAR(10)),
3, N'경영 대시보드', 144, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V3_16', 'v3_search_map_grid', 'LAYOUT_V3', N'상하3: 검색 + 지도 + 그리드', N'V3: Search + Map + Grid', N'검색 + 지도 + 하단 거점 리스트',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ 🗺️  📍 📍    │@NL@├──────────────┤@NL@│ ▦ 거점 목록   │@NL@└──────────────┘', N'@NL@', CHAR(10)),
1, N'GIS + 리스트', 145, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V3_17', 'v3_search_network_grid', 'LAYOUT_V3', N'상하3: 검색 + 네트워크 + 그리드', N'V3: Search + Network + Grid', N'검색 + 관계 네트워크 그래프 + 연결 목록',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ ○─○─○         │@NL@├──────────────┤@NL@│ ▦ 관계        │@NL@└──────────────┘', N'@NL@', CHAR(10)),
1, N'관계망,영향도', 146, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V3_18', 'v3_progress_grid_action', 'LAYOUT_V3', N'상하3: 진행률 + 그리드 + 액션', N'V3: Progress + Grid + Action', N'상단 진행률 바 + 중앙 작업 그리드 + 하단 액션 버튼',
REPLACE(N'┌──────────────┐@NL@│ ▰▰▰▰▱ 75%    │@NL@├──────────────┤@NL@│ ▦ Tasks       │@NL@├──────────────┤@NL@│ [실행][중단]  │@NL@└──────────────┘', N'@NL@', CHAR(10)),
1, N'배치 모니터', 147, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V3_19', 'v3_condition_preview_result', 'LAYOUT_V3', N'상하3: 조건 + 프리뷰 + 실행결과', N'V3: Condition + Preview + Result', N'조건 입력 + 쿼리 프리뷰 + 실행 결과',
REPLACE(N'┌──────────────┐@NL@│ ▢ 조건        │@NL@├──────────────┤@NL@│ SELECT ...    │@NL@├──────────────┤@NL@│ ▦ 결과        │@NL@└──────────────┘', N'@NL@', CHAR(10)),
1, N'쿼리 빌더,시뮬레이션', 148, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V3_20', 'v3_notice_kpi_grid', 'LAYOUT_V3', N'상하3: 공지 + KPI + 그리드', N'V3: Notice + KPI + Grid', N'상단 공지 배너 + KPI + 상세 그리드',
REPLACE(N'┌──────────────┐@NL@│ ⚠ 공지        │@NL@├──────────────┤@NL@│ [K1][K2][K3]  │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'경영 공지 + 지표', 149, N'system', '1970-01-01');


-- =============================================================
-- LAYOUT_V4  (상하 4분할)  -- 10개
-- =============================================================

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V4_01', 'v4_search_kpi_grid_chart', 'LAYOUT_V4', N'상하4: 검색 + KPI + 그리드 + 차트', N'V4: Search + KPI + Grid + Chart', N'완전 대시보드: 검색+요약+상세+시각화',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ [K1][K2][K3]  │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@├──────────────┤@NL@│ 📊 Chart      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
3, N'종합 리포트', 160, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V4_02', 'v4_search_toolbar_grid_detail', 'LAYOUT_V4', N'상하4: 검색 + 툴바 + 그리드 + 상세', N'V4: Search + Toolbar + Grid + Detail', N'검색 조건 + 액션 툴바 + 그리드 + 선택 상세',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ [+][-][💾]    │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@├──────────────┤@NL@│ ▢ Detail      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'상세 편집 화면', 161, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V4_03', 'v4_header_tab_grid_action', 'LAYOUT_V4', N'상하4: 헤더 + 탭 + 그리드 + 액션', N'V4: Header + Tab + Grid + Action', N'헤더 + 탭 전환 + 탭별 그리드 + 하단 액션',
REPLACE(N'┌──────────────┐@NL@│ ℹ Header      │@NL@├──────────────┤@NL@│ [T1][T2][T3]  │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@├──────────────┤@NL@│ [승인][반려]  │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'결재,다중 탭 작업', 162, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V4_04', 'v4_stepper_search_grid_detail', 'LAYOUT_V4', N'상하4: 스텝퍼 + 검색 + 그리드 + 상세', N'V4: Stepper + Search + Grid + Detail', N'단계 + 검색 + 대상 그리드 + 선택 상세',
REPLACE(N'┌──────────────┐@NL@│ ①─●─③─④       │@NL@├──────────────┤@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@├──────────────┤@NL@│ ▢ Detail      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
1, N'다단계 작업', 163, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V4_05', 'v4_filter_cards_grid_chart', 'LAYOUT_V4', N'상하4: 필터 + 카드 + 그리드 + 차트', N'V4: Filter + Cards + Grid + Chart', N'필터 칩 + 카드 썸네일 + 그리드 + 차트',
REPLACE(N'┌──────────────┐@NL@│ [F][F][F]     │@NL@├──────────────┤@NL@│ [▣][▣][▣]    │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@├──────────────┤@NL@│ 📊 Chart      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
1, N'상품 분석', 164, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V4_06', 'v4_search_kpi_chart_grid', 'LAYOUT_V4', N'상하4: 검색 + KPI + 차트 + 그리드', N'V4: Search + KPI + Chart + Grid', N'검색 + KPI + 트렌드 차트 + 원천 그리드',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ [K1][K2][K3]  │@NL@├──────────────┤@NL@│ 📊 Chart      │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@└──────────────┘', N'@NL@', CHAR(10)),
3, N'경영 리포트', 165, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V4_07', 'v4_toolbar_search_grid_footer', 'LAYOUT_V4', N'상하4: 툴바 + 검색 + 그리드 + 푸터', N'V4: Toolbar + Search + Grid + Footer', N'액션 툴바 + 검색 + 그리드 + 푸터 합계',
REPLACE(N'┌──────────────┐@NL@│ [+][-][💾]    │@NL@├──────────────┤@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@├──────────────┤@NL@│ Σ 합계:1,234 │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'회계,금액 합계', 166, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V4_08', 'v4_header_kpi_tab_detail', 'LAYOUT_V4', N'상하4: 헤더 + KPI + 탭 + 상세', N'V4: Header + KPI + Tab + Detail', N'상세 페이지: 정보 헤더 + KPI + 탭 + 상세',
REPLACE(N'┌──────────────┐@NL@│ ℹ Header      │@NL@├──────────────┤@NL@│ [K1][K2][K3]  │@NL@├──────────────┤@NL@│ [T1][T2][T3]  │@NL@├──────────────┤@NL@│ 상세          │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'고객/품목 상세', 167, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V4_09', 'v4_search_pivot_grid_chart', 'LAYOUT_V4', N'상하4: 검색 + 피벗 + 그리드 + 차트', N'V4: Search + Pivot + Grid + Chart', N'검색 + 피벗 요약 + 원천 그리드 + 차트',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ D│M│V  ···    │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@├──────────────┤@NL@│ 📊 Chart      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
1, N'다각도 분석', 168, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V4_10', 'v4_notice_filter_list_pagination', 'LAYOUT_V4', N'상하4: 알림 + 필터 + 리스트 + 페이지', N'V4: Notice + Filter + List + Pagination', N'공지 + 필터 + 리스트 + 페이지네이션',
REPLACE(N'┌──────────────┐@NL@│ ⚠ 공지        │@NL@├──────────────┤@NL@│ [F][F][F]     │@NL@├──────────────┤@NL@│ ▢ Item 1~10   │@NL@├──────────────┤@NL@│ ‹ 1 2 3 ›     │@NL@└──────────────┘', N'@NL@', CHAR(10)),
1, N'공지,게시판', 169, N'system', '1970-01-01');


-- =============================================================
-- LAYOUT_V5  (상하 5+분할)  -- 5개
-- =============================================================

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V5_01', 'v5_search_kpi_chart_grid_detail', 'LAYOUT_V5', N'상하5: 검색+KPI+차트+그리드+상세', N'V5: Search+KPI+Chart+Grid+Detail', N'최대 밀도 리포트: 5개 영역 수직 배치',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ [K1][K2][K3]  │@NL@├──────────────┤@NL@│ 📊 Chart      │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@├──────────────┤@NL@│ ▢ Detail      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
1, N'대형 대시보드', 180, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V5_02', 'v5_header_toolbar_tree_grid_log', 'LAYOUT_V5', N'상하5: 헤더+툴바+트리+그리드+로그', N'V5: Header+Toolbar+Tree+Grid+Log', N'관리자 화면: 헤더/툴바/트리/그리드/로그',
REPLACE(N'┌──────────────┐@NL@│ ℹ Header      │@NL@├──────────────┤@NL@│ [+][-][💾]    │@NL@├──────────────┤@NL@│ ▼ Tree        │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@├──────────────┤@NL@│ ▤ Log         │@NL@└──────────────┘', N'@NL@', CHAR(10)),
1, N'시스템 관리', 181, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V5_03', 'v5_nav_search_kpi_grid_status', 'LAYOUT_V5', N'상하5: 네비+검색+KPI+그리드+상태', N'V5: Nav+Search+KPI+Grid+Status', N'브레드크럼+검색+KPI+그리드+상태바',
REPLACE(N'┌──────────────┐@NL@│ A>B>C         │@NL@├──────────────┤@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ [K1][K2]      │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@├──────────────┤@NL@│ 상태: 12건    │@NL@└──────────────┘', N'@NL@', CHAR(10)),
1, N'계층 + 통계', 182, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V5_04', 'v5_header_stepper_tab_content_action', 'LAYOUT_V5', N'상하5: 헤더+스텝퍼+탭+콘텐츠+액션', N'V5: Header+Stepper+Tab+Content+Action', N'복잡 워크플로: 헤더/스텝/탭/본문/액션',
REPLACE(N'┌──────────────┐@NL@│ ℹ Header      │@NL@├──────────────┤@NL@│ ①─●─③         │@NL@├──────────────┤@NL@│ [T1][T2]      │@NL@├──────────────┤@NL@│ 콘텐츠        │@NL@├──────────────┤@NL@│ [이전][다음]  │@NL@└──────────────┘', N'@NL@', CHAR(10)),
1, N'계획 생성 마법사', 183, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'V5_05', 'v5_notice_filter_kpi_grid_pagination', 'LAYOUT_V5', N'상하5: 공지+필터+KPI+그리드+페이지', N'V5: Notice+Filter+KPI+Grid+Pagination', N'포털: 공지 + 필터 + KPI + 그리드 + 페이지',
REPLACE(N'┌──────────────┐@NL@│ ⚠ 공지        │@NL@├──────────────┤@NL@│ [F][F][F]     │@NL@├──────────────┤@NL@│ [K1][K2]      │@NL@├──────────────┤@NL@│ ▦ Grid        │@NL@├──────────────┤@NL@│ ‹ 1 2 3 ›     │@NL@└──────────────┘', N'@NL@', CHAR(10)),
1, N'포털 홈', 184, N'system', '1970-01-01');


-- =============================================================
-- LAYOUT_H2  (좌우 2분할)  -- 16개
-- =============================================================

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H2_01', 'h2_master_detail', 'LAYOUT_H2', N'좌우2: 마스터 + 디테일', N'H2: Master + Detail', N'좌측 선택 → 우측 상세 표시 (핵심 패턴)',
REPLACE(N'┌──────┬───────┐@NL@│ ▦    │ ▢     │@NL@│ Mst  │ Detail│@NL@│      │       │@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
3, N'마스터-디테일 CRUD', 200, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H2_02', 'h2_tree_grid', 'LAYOUT_H2', N'좌우2: 트리 + 그리드', N'H2: Tree + Grid', N'좌측 트리 네비 + 우측 그리드 목록',
REPLACE(N'┌──────┬───────┐@NL@│ ▼ A  │ ▦ Grid│@NL@│  ├ B │       │@NL@│  └ C │       │@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
3, N'계층 탐색', 201, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H2_03', 'h2_form_grid', 'LAYOUT_H2', N'좌우2: 폼 + 그리드', N'H2: Form + Grid', N'좌측 입력 폼 + 우측 관련 그리드',
REPLACE(N'┌──────┬───────┐@NL@│ ▢    │ ▦     │@NL@│ Form │ Grid  │@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
2, N'등록 + 연관 조회', 202, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H2_04', 'h2_chart_grid', 'LAYOUT_H2', N'좌우2: 차트 + 그리드', N'H2: Chart + Grid', N'좌측 차트 + 우측 상세 테이블',
REPLACE(N'┌──────┬───────┐@NL@│ 📊   │ ▦     │@NL@│      │ Grid  │@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
2, N'시각화 + 데이터', 203, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H2_05', 'h2_menu_content', 'LAYOUT_H2', N'좌우2: 메뉴 + 콘텐츠', N'H2: Menu + Content', N'좌측 세로 메뉴 + 우측 메인 콘텐츠',
REPLACE(N'┌──────┬───────┐@NL@│ ▪M1  │       │@NL@│ ▪M2  │ 콘텐츠│@NL@│ ▪M3  │       │@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
3, N'설정,관리 화면', 204, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H2_06', 'h2_list_editform', 'LAYOUT_H2', N'좌우2: 리스트 + 편집폼', N'H2: List + Edit Form', N'좌측 목록 + 우측 편집 폼 (이메일 클라이언트식)',
REPLACE(N'┌──────┬───────┐@NL@│ ▢ A  │ 편집  │@NL@│ ▢ B  │ 폼    │@NL@│ ▢ C  │       │@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
2, N'이메일,편집', 205, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H2_07', 'h2_nav_main', 'LAYOUT_H2', N'좌우2: 네비게이션 + 메인', N'H2: Navigation + Main', N'좌측 네비게이션 사이드바 + 우측 메인',
REPLACE(N'┌──────┬───────┐@NL@│ 🏠   │       │@NL@│ 📊   │ Main  │@NL@│ ⚙    │       │@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
2, N'앱 쉘', 206, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H2_08', 'h2_filetree_editor', 'LAYOUT_H2', N'좌우2: 파일트리 + 에디터', N'H2: File Tree + Editor', N'좌측 파일 트리 + 우측 코드 에디터 (IDE 스타일)',
REPLACE(N'┌──────┬───────┐@NL@│ 📁 A │ SELECT│@NL@│  ├ .j│  FROM │@NL@│  └ .s│  WHERE│@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
1, N'IDE,스크립트', 207, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H2_09', 'h2_category_items', 'LAYOUT_H2', N'좌우2: 카테고리 + 아이템', N'H2: Category + Items', N'좌측 카테고리 리스트 + 우측 아이템 그리드/카드',
REPLACE(N'┌──────┬───────┐@NL@│ 가전  │ [▣][▣]│@NL@│ 의류  │ [▣][▣]│@NL@│ 식품  │ [▣][▣]│@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
2, N'카탈로그', 208, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H2_10', 'h2_searchcond_result', 'LAYOUT_H2', N'좌우2: 검색조건(세로) + 결과', N'H2: Search Panel + Result', N'좌측 세로 검색 패널 + 우측 결과 (고급 검색)',
REPLACE(N'┌──────┬───────┐@NL@│ 🔍조건│ 결과  │@NL@│ ⌨___ │ ▦ Grid│@NL@│ ⌨___ │       │@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
2, N'고급 검색', 209, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H2_11', 'h2_grid_chart', 'LAYOUT_H2', N'좌우2: 그리드 + 차트', N'H2: Grid + Chart', N'좌측 상세 그리드 + 우측 관련 차트',
REPLACE(N'┌──────┬───────┐@NL@│ ▦    │ 📊    │@NL@│ Grid │ Chart │@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
2, N'데이터 + 시각화', 210, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H2_12', 'h2_tree_detail_form', 'LAYOUT_H2', N'좌우2: 트리 + 상세폼', N'H2: Tree + Detail Form', N'좌측 트리 선택 → 우측 선택 항목 편집 폼',
REPLACE(N'┌──────┬───────┐@NL@│ ▼ A  │ ▢ Form│@NL@│  ├ B*│       │@NL@│  └ C │       │@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
2, N'권한,분류 편집', 211, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H2_13', 'h2_list_preview', 'LAYOUT_H2', N'좌우2: 리스트 + 미리보기', N'H2: List + Preview', N'좌측 항목 리스트 + 우측 미리보기 패널',
REPLACE(N'┌──────┬───────┐@NL@│ ▢ A  │       │@NL@│ ▢ B* │ 미리  │@NL@│ ▢ C  │ 보기  │@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
2, N'문서,미리보기', 212, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H2_14', 'h2_form_preview', 'LAYOUT_H2', N'좌우2: 폼 + 미리보기', N'H2: Form + Preview', N'좌측 입력 + 우측 실시간 렌더 미리보기',
REPLACE(N'┌──────┬───────┐@NL@│ ▢    │ 📄    │@NL@│ Form │Preview│@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
1, N'템플릿,디자이너', 213, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H2_15', 'h2_filter_cards', 'LAYOUT_H2', N'좌우2: 필터 + 카드 리스트', N'H2: Filter + Card List', N'좌측 패싯 필터 + 우측 카드 갤러리 (e-commerce)',
REPLACE(N'┌──────┬───────┐@NL@│ ☑가격 │[▣][▣]│@NL@│ ☐브랜드│[▣][▣]│@NL@│ ☐색상 │[▣][▣]│@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
2, N'쇼핑,패싯 검색', 214, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H2_16', 'h2_channel_chat', 'LAYOUT_H2', N'좌우2: 채널 + 채팅', N'H2: Channels + Chat', N'좌측 채널/대화 목록 + 우측 대화창 (Slack 스타일)',
REPLACE(N'┌──────┬───────┐@NL@│ #gen │ 💬 대화│@NL@│ #dev │       │@NL@│ #ops │ ⌨ 입력│@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
1, N'메신저,협업', 215, N'system', '1970-01-01');


-- =============================================================
-- LAYOUT_H3  (좌우 3분할)  -- 10개
-- =============================================================

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H3_01', 'h3_tree_grid_detail', 'LAYOUT_H3', N'좌우3: 트리 + 그리드 + 상세', N'H3: Tree + Grid + Detail', N'좌트리 → 중그리드 → 우상세 (3단 드릴다운)',
REPLACE(N'┌────┬─────┬────┐@NL@│ ▼  │ ▦   │ ▢  │@NL@│Tree│Grid │Det │@NL@└────┴─────┴────┘', N'@NL@', CHAR(10)),
3, N'복합 네비게이션', 230, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H3_02', 'h3_menu_list_editor', 'LAYOUT_H3', N'좌우3: 메뉴 + 리스트 + 에디터', N'H3: Menu + List + Editor', N'좌메뉴 + 중리스트 + 우에디터 (IDE/문서편집)',
REPLACE(N'┌────┬─────┬────┐@NL@│📁  │ ▢ A │ ✎  │@NL@│메뉴│ ▢ B │편집│@NL@└────┴─────┴────┘', N'@NL@', CHAR(10)),
2, N'IDE,게시판 관리', 231, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H3_03', 'h3_category_grid_chart', 'LAYOUT_H3', N'좌우3: 카테고리 + 그리드 + 차트', N'H3: Category + Grid + Chart', N'좌카테고리 + 중그리드 + 우차트',
REPLACE(N'┌────┬─────┬────┐@NL@│ 가전│ ▦   │ 📊 │@NL@│ 의류│ Grid│Chrt│@NL@└────┴─────┴────┘', N'@NL@', CHAR(10)),
2, N'분류별 분석', 232, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H3_04', 'h3_tree_chart_grid', 'LAYOUT_H3', N'좌우3: 트리 + 차트 + 그리드', N'H3: Tree + Chart + Grid', N'좌트리 + 중차트 + 우그리드',
REPLACE(N'┌────┬─────┬────┐@NL@│ ▼  │ 📊  │ ▦  │@NL@│Tree│Chrt │Grid│@NL@└────┴─────┴────┘', N'@NL@', CHAR(10)),
2, N'계층별 시각화', 233, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H3_05', 'h3_left_main_right', 'LAYOUT_H3', N'좌우3: 좌 사이드 + 메인 + 우 사이드', N'H3: Left + Main + Right', N'좌 네비 + 중 본문 + 우 인스펙터 (클래식 3컬럼)',
REPLACE(N'┌────┬─────┬────┐@NL@│ ▪  │     │ 🔍 │@NL@│메뉴│ 본문│속성│@NL@└────┴─────┴────┘', N'@NL@', CHAR(10)),
3, N'WYSIWYG,속성편집', 234, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H3_06', 'h3_folder_editor_output', 'LAYOUT_H3', N'좌우3: 폴더 + 에디터 + 출력', N'H3: Folder + Editor + Output', N'좌 폴더 트리 + 중 에디터 + 우 실행 출력',
REPLACE(N'┌────┬─────┬────┐@NL@│📁 A│ ✎   │ ▤  │@NL@│    │ .sql│Out │@NL@└────┴─────┴────┘', N'@NL@', CHAR(10)),
1, N'SQL 콘솔', 235, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H3_07', 'h3_filter_list_detail', 'LAYOUT_H3', N'좌우3: 필터 + 목록 + 상세', N'H3: Filter + List + Detail', N'좌 필터 + 중 목록 + 우 상세 (상품/게시판)',
REPLACE(N'┌────┬─────┬────┐@NL@│ ☑  │ ▢ A │ 상세│@NL@│필터│ ▢ B*│ 폼  │@NL@└────┴─────┴────┘', N'@NL@', CHAR(10)),
2, N'상품 관리', 236, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H3_08', 'h3_folder_file_preview', 'LAYOUT_H3', N'좌우3: 폴더 + 파일 + 미리보기', N'H3: Folder + File + Preview', N'좌 폴더 + 중 파일 목록 + 우 미리보기 (Finder)',
REPLACE(N'┌────┬─────┬────┐@NL@│📁  │ 📄  │ 👁 │@NL@│    │ 📄  │미리│@NL@└────┴─────┴────┘', N'@NL@', CHAR(10)),
1, N'파일 탐색기', 237, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H3_09', 'h3_step_form_result', 'LAYOUT_H3', N'좌우3: 단계 + 폼 + 결과', N'H3: Step + Form + Result', N'좌 세로 스텝 + 중 현재 폼 + 우 결과/미리보기',
REPLACE(N'┌────┬─────┬────┐@NL@│ ①  │ ▢   │ ✓  │@NL@│ ●  │Form │결과│@NL@│ ③  │     │    │@NL@└────┴─────┴────┘', N'@NL@', CHAR(10)),
1, N'복잡 폼,자산등록', 238, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H3_10', 'h3_source_diff_target', 'LAYOUT_H3', N'좌우3: 소스 + 비교 + 타겟', N'H3: Source + Diff + Target', N'좌 소스 + 중 diff 하이라이트 + 우 타겟',
REPLACE(N'┌────┬─────┬────┐@NL@│ A  │ ±≠  │ B  │@NL@│Src │Diff │Tgt │@NL@└────┴─────┴────┘', N'@NL@', CHAR(10)),
1, N'버전 비교,변환', 239, N'system', '1970-01-01');


-- =============================================================
-- LAYOUT_H4  (좌우 4분할)  -- 5개
-- =============================================================

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H4_01', 'h4_menu_tree_grid_detail', 'LAYOUT_H4', N'좌우4: 메뉴 + 트리 + 그리드 + 상세', N'H4: Menu + Tree + Grid + Detail', N'4단 드릴다운 — 메뉴 > 트리 > 그리드 > 상세',
REPLACE(N'┌───┬───┬───┬───┐@NL@│▪  │▼  │▦  │▢  │@NL@│메뉴│트리│그리드│상세│@NL@└───┴───┴───┴───┘', N'@NL@', CHAR(10)),
2, N'대형 시스템', 260, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H4_02', 'h4_filter_category_list_chart', 'LAYOUT_H4', N'좌우4: 필터 + 카테고리 + 목록 + 차트', N'H4: Filter + Category + List + Chart', N'필터 + 카테고리 + 결과 목록 + 관련 차트',
REPLACE(N'┌───┬───┬───┬───┐@NL@│☑  │가전│▦  │📊 │@NL@│필터│의류│목록│차트│@NL@└───┴───┴───┴───┘', N'@NL@', CHAR(10)),
1, N'e-commerce 관리', 261, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H4_03', 'h4_nav_tree_editor_output', 'LAYOUT_H4', N'좌우4: 네비 + 트리 + 에디터 + 출력', N'H4: Nav + Tree + Editor + Output', N'네비 + 파일트리 + 코드 에디터 + 실행 출력',
REPLACE(N'┌───┬───┬───┬───┐@NL@│▪  │📁 │ ✎  │▤  │@NL@│네비│트리│에디터│출력│@NL@└───┴───┴───┴───┘', N'@NL@', CHAR(10)),
1, N'IDE,개발환경', 262, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H4_04', 'h4_drill_drill_drill_detail', 'LAYOUT_H4', N'좌우4: 연속 드릴다운(A > B > C) + 상세', N'H4: Drill × 3 + Detail', N'3단 카테고리 드릴다운 + 상세 (대형 카탈로그)',
REPLACE(N'┌───┬───┬───┬───┐@NL@│ A │ B │ C │▢  │@NL@│드릴│드릴│드릴│상세│@NL@└───┴───┴───┴───┘', N'@NL@', CHAR(10)),
1, N'대형 카탈로그', 263, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H4_05', 'h4_menu_center_center_tool', 'LAYOUT_H4', N'좌우4: 좌메뉴 + 중앙 + 중앙 + 우 툴', N'H4: Left Menu + Center × 2 + Right Tool', N'메뉴 + 중앙 이중 패널 + 우측 도구',
REPLACE(N'┌───┬───┬───┬───┐@NL@│▪  │ P1│ P2│🛠  │@NL@│메뉴│패널│패널│도구│@NL@└───┴───┴───┴───┘', N'@NL@', CHAR(10)),
1, N'대형 모니터링', 264, N'system', '1970-01-01');


-- =============================================================
-- LAYOUT_H5  (좌우 5+분할)  -- 2개
-- =============================================================

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H5_01', 'h5_nav_tree_grid_detail_toolbar', 'LAYOUT_H5', N'좌우5: 네비+트리+그리드+상세+툴바', N'H5: Nav+Tree+Grid+Detail+Toolbar', N'극단적 분할 5컬럼 (울트라와이드 모니터용)',
REPLACE(N'┌──┬──┬──┬──┬──┐@NL@│▪ │▼ │▦ │▢ │🛠│@NL@│  │  │  │  │  │@NL@└──┴──┴──┴──┴──┘', N'@NL@', CHAR(10)),
1, N'울트라와이드', 280, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'H5_02', 'h5_menu_category_list_detail_action', 'LAYOUT_H5', N'좌우5: 메뉴+카테고리+목록+상세+액션', N'H5: Menu+Category+List+Detail+Action', N'5컬럼 관리 화면',
REPLACE(N'┌──┬──┬──┬──┬──┐@NL@│▪ │가 │▢ │상 │🗹│@NL@│메뉴│전 │목록│세 │액션│@NL@└──┴──┴──┴──┴──┘', N'@NL@', CHAR(10)),
1, N'복합 관리', 281, N'system', '1970-01-01');


-- =============================================================
-- LAYOUT_MIXED  (상하+좌우 혼합 및 특수)  -- 40개
-- =============================================================

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_01', 'mix_v2_h2_search_tree_grid', 'LAYOUT_MIXED', N'혼합: V2/H2 — 상단 검색 + (트리|그리드)', N'V2/H2: Search + (Tree | Grid)', N'상단 검색 조건 + 하단 좌우 2분할(트리+그리드)',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────┬───────┤@NL@│ ▼Tree│ ▦ Grid│@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
3, N'계층 관리 + 검색', 300, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_02', 'mix_v2_h2v2_tree_chart_grid', 'LAYOUT_MIXED', N'혼합: V2/H2/V2 — 검색 + 좌트리 + 우(차트+그리드)', N'V2/H2/V2: Search + Tree + (Chart/Grid)', N'상단 검색 + 좌 트리 + 우측을 상하 2분할(차트+그리드)',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────┬───────┤@NL@│ ▼    │ 📊    │@NL@│      ├───────┤@NL@│ Tree │ ▦ Grid│@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
2, N'분석 대시보드', 301, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_03', 'mix_v2_h3_filter_grid_detail', 'LAYOUT_MIXED', N'혼합: V2/H3 — 상 헤더 + (필터|그리드|상세)', N'V2/H3: Header + (Filter|Grid|Detail)', N'상단 헤더 + 하단 좌우 3분할',
REPLACE(N'┌──────────────┐@NL@│ ℹ Header      │@NL@├────┬─────┬───┤@NL@│ ☑  │ ▦   │▢  │@NL@│필터│그리드│상세│@NL@└────┴─────┴───┘', N'@NL@', CHAR(10)),
2, N'복합 관리', 302, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_04', 'mix_v2_h2_master_detail', 'LAYOUT_MIXED', N'혼합: V2/H2 — 상 검색 + (마스터|디테일)', N'V2/H2: Search + (Master|Detail)', N'검색 + 좌우 마스터-디테일',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────┬───────┤@NL@│ ▦ Mst│ ▢ Det │@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
3, N'마스터-디테일 + 검색', 303, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_05', 'mix_v2_h2v2_toolbar_tree_chart_grid', 'LAYOUT_MIXED', N'혼합: V2/H2/V2 — 툴바 + 좌트리 + 우(차트/그리드)', N'Toolbar + Tree + (Chart/Grid)', N'툴바 + 좌 트리 + 우측 상하(차트+그리드)',
REPLACE(N'┌──────────────┐@NL@│ [+][-][💾]    │@NL@├──────┬───────┤@NL@│ ▼    │ 📊    │@NL@│ Tree ├───────┤@NL@│      │ ▦ Grid│@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
2, N'관리 + 분석', 304, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_06', 'mix_v2_tab_bottom', 'LAYOUT_MIXED', N'혼합: V2/탭 — 상 검색 + 하 탭(그리드/차트/피벗)', N'V2 + Tab: Search + Tab Panel', N'상단 검색 + 하단 탭으로 같은 데이터 다양한 뷰',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────────────┤@NL@│ [▦][📊][D/M]  │@NL@│ 탭 콘텐츠      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
3, N'다중 관점 리포트', 305, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_07', 'mix_v2_kpi_tab', 'LAYOUT_MIXED', N'혼합: V2/탭 — 상 KPI + 하 탭(트렌드/분포/상세)', N'V2 + Tab: KPI + Tab Panel', N'KPI 요약 + 탭 전환형 상세 (트렌드/분포/상세)',
REPLACE(N'┌──────────────┐@NL@│ [K1][K2][K3]  │@NL@├──────────────┤@NL@│ [T][B][▦]    │@NL@│ 탭 콘텐츠      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
3, N'KPI 대시보드', 306, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_08', 'mix_v2_form_tab', 'LAYOUT_MIXED', N'혼합: V2/탭 — 상 폼 + 하 탭(로그/이력/코멘트)', N'V2 + Tab: Form + Tab', N'헤더 폼 + 탭(로그/이력/코멘트)',
REPLACE(N'┌──────────────┐@NL@│ ▢ Form        │@NL@├──────────────┤@NL@│ [Log][Hist]   │@NL@│ 탭 콘텐츠      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'워크아이템 상세', 307, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_09', 'mix_v3_mid_h2', 'LAYOUT_MIXED', N'혼합: V3/H2 — 상 검색 + 중(그리드|차트) + 하 상세', N'V3/H2: Search + (Grid|Chart) + Detail', N'검색 + 좌우(그리드/차트) + 하단 상세',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────┬───────┤@NL@│ ▦    │ 📊    │@NL@├──────┴───────┤@NL@│ ▢ Detail      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'리포트 분석', 308, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_10', 'mix_v3_kpi_mid_detail', 'LAYOUT_MIXED', N'혼합: V3/H2 — 상 KPI + 중(마스터|디테일) + 하 로그', N'V3/H2: KPI + (Mst|Det) + Log', N'KPI + 좌우 마스터/디테일 + 하단 로그',
REPLACE(N'┌──────────────┐@NL@│ [K1][K2][K3]  │@NL@├──────┬───────┤@NL@│ ▦ Mst│ ▢ Det │@NL@├──────┴───────┤@NL@│ ▤ Log         │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'복합 업무 화면', 309, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_11', 'mix_h2_right_v2', 'LAYOUT_MIXED', N'혼합: H2/V2 — 좌 트리 + 우(그리드+상세)', N'H2/V2: Tree + (Grid/Detail)', N'좌 트리 + 우측을 상하 2분할(그리드+상세)',
REPLACE(N'┌──────┬───────┐@NL@│ ▼    │ ▦ Grid│@NL@│      ├───────┤@NL@│ Tree │ ▢ Det │@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
3, N'트리 + M/D', 310, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_12', 'mix_h2_right_v3', 'LAYOUT_MIXED', N'혼합: H2/V3 — 좌 마스터 + 우(차트+그리드+로그)', N'H2/V3: Master + (Chart/Grid/Log)', N'좌 마스터 + 우측을 상하 3분할',
REPLACE(N'┌──────┬───────┐@NL@│      │ 📊    │@NL@│ ▦    ├───────┤@NL@│ Mst  │ ▦ Grid│@NL@│      ├───────┤@NL@│      │ ▤ Log │@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
2, N'통합 관제', 311, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_13', 'mix_h2_right_v3b', 'LAYOUT_MIXED', N'혼합: H2/V3 — 좌 네비 + 우(검색+그리드+페이지)', N'H2/V3: Nav + (Search/Grid/Page)', N'좌 네비 + 우측 검색/그리드/페이지네이션',
REPLACE(N'┌──────┬───────┐@NL@│ ▪    │ 🔍    │@NL@│      ├───────┤@NL@│ 네비 │ ▦ Grid│@NL@│      ├───────┤@NL@│      │‹1 2 3›│@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
3, N'앱 쉘 + 리스트', 312, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_14', 'mix_h3_mid_v2', 'LAYOUT_MIXED', N'혼합: H3/V2 — 좌 필터 + 중(차트+그리드) + 우 상세', N'H3/V2: Filter + (Chart/Grid) + Detail', N'좌 필터 + 중앙 상하 분할 + 우 상세',
REPLACE(N'┌────┬─────┬────┐@NL@│ ☑  │ 📊  │ ▢  │@NL@│    ├─────┤    │@NL@│필터│ ▦   │상세│@NL@└────┴─────┴────┘', N'@NL@', CHAR(10)),
2, N'분석 + 필터', 313, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_15', 'mix_h3_mid_v3', 'LAYOUT_MIXED', N'혼합: H3/V3 — 좌 트리 + 중(KPI+차트+그리드) + 우 상세', N'H3/V3: Tree + (KPI/Chart/Grid) + Detail', N'3단 컬럼 + 중앙 3단 세로 분할',
REPLACE(N'┌────┬─────┬────┐@NL@│ ▼  │[K1][K2]│▢  │@NL@│    ├─────┤    │@NL@│    │ 📊   │    │@NL@│Tree├─────┤상세│@NL@│    │ ▦   │    │@NL@└────┴─────┴────┘', N'@NL@', CHAR(10)),
1, N'대형 대시보드', 314, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_16', 'mix_tab_h2', 'LAYOUT_MIXED', N'혼합: 탭+H2 — 상단 탭 + 탭 내부 좌우 2분할', N'Tab + H2 inside', N'상단 탭 + 각 탭 내부가 좌우 2분할',
REPLACE(N'┌──────────────┐@NL@│ [T1][T2][T3]  │@NL@├──────┬───────┤@NL@│  좌  │  우    │@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
2, N'탭별 M/D', 315, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_17', 'mix_tab_v2', 'LAYOUT_MIXED', N'혼합: 탭+V2 — 상단 탭 + 탭 내부 상하 2분할', N'Tab + V2 inside', N'상단 탭 + 각 탭 내부가 상하 2분할',
REPLACE(N'┌──────────────┐@NL@│ [T1][T2][T3]  │@NL@├──────────────┤@NL@│ 상             │@NL@├──────────────┤@NL@│ 하             │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'탭별 요약/상세', 316, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_18', 'mix_tab_h3', 'LAYOUT_MIXED', N'혼합: 탭+H3 — 상단 탭 + 탭 내부 3분할', N'Tab + H3 inside', N'상단 탭 + 각 탭 내부가 좌우 3분할',
REPLACE(N'┌──────────────┐@NL@│ [T1][T2][T3]  │@NL@├────┬─────┬───┤@NL@│ L  │ M    │R  │@NL@└────┴─────┴───┘', N'@NL@', CHAR(10)),
1, N'탭별 복합 분석', 317, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_19', 'mix_stepper_tab', 'LAYOUT_MIXED', N'혼합: 스텝퍼+탭 — 상 스텝퍼 + 탭 + 콘텐츠', N'Stepper + Tab + Content', N'단계 진행 + 각 단계별 탭 + 콘텐츠',
REPLACE(N'┌──────────────┐@NL@│ ①─●─③         │@NL@├──────────────┤@NL@│ [T1][T2][T3]  │@NL@│ 탭 콘텐츠      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'복잡 워크플로', 318, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_20', 'mix_sidetab_main', 'LAYOUT_MIXED', N'혼합: 사이드탭+메인 — 좌 세로 탭 + 우 메인', N'Side Tab + Main', N'좌측 세로 탭 (아이콘형) + 우측 메인',
REPLACE(N'┌──┬───────────┐@NL@│T1│            │@NL@│T2│  메인     │@NL@│T3│            │@NL@└──┴───────────┘', N'@NL@', CHAR(10)),
2, N'설정,프로필', 319, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_21', 'mix_accordion_main', 'LAYOUT_MIXED', N'혼합: 아코디언+메인 — 좌 아코디언 + 우 메인', N'Accordion + Main', N'좌측 아코디언 섹션 + 우측 메인',
REPLACE(N'┌──────┬───────┐@NL@│ ▼ A  │       │@NL@│  ▷ B │ Main  │@NL@│  ▷ C │       │@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
1, N'도움말,FAQ', 320, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_22', 'mix_v2_accordion_grid', 'LAYOUT_MIXED', N'혼합: V2/아코디언+그리드 — 검색 + (아코디언|그리드)', N'V2 + Accordion + Grid', N'상단 검색 + 좌 아코디언 카테고리 + 우 그리드',
REPLACE(N'┌──────────────┐@NL@│ 🔍 검색       │@NL@├──────┬───────┤@NL@│ ▼ A  │       │@NL@│  ▷ B │ ▦ Grid│@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
1, N'카테고리 네비', 321, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_23', 'mix_drawer_main', 'LAYOUT_MIXED', N'혼합: Drawer+메인 — 좌 슬라이드 드로어 + 메인', N'Drawer + Main', N'좌측 Drawer (열림/닫힘) + 메인 콘텐츠',
REPLACE(N'┌─┬────────────┐@NL@│▣│            │@NL@│ │   메인     │@NL@│▣│            │@NL@└─┴────────────┘', N'@NL@', CHAR(10)),
2, N'모바일 친화', 322, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_24', 'mix_notice_drawer_main', 'LAYOUT_MIXED', N'혼합: 알림+Drawer+메인', N'Notice + Drawer + Main', N'상단 알림 + 좌 Drawer + 메인 콘텐츠',
REPLACE(N'┌──────────────┐@NL@│ ⚠ 알림         │@NL@├─┬────────────┤@NL@│▣│   메인     │@NL@│▣│            │@NL@└─┴────────────┘', N'@NL@', CHAR(10)),
1, N'포털 홈', 323, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_25', 'mix_grid_2x2', 'LAYOUT_MIXED', N'격자: 2x2', N'Grid 2x2', N'2x2 동일 크기 셀 격자 (4개 위젯/차트)',
REPLACE(N'┌──────┬───────┐@NL@│  A   │  B    │@NL@├──────┼───────┤@NL@│  C   │  D    │@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
3, N'4차트 비교', 324, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_26', 'mix_grid_2x3', 'LAYOUT_MIXED', N'격자: 2x3', N'Grid 2x3', N'2행 3열 격자 (6개 셀)',
REPLACE(N'┌────┬────┬────┐@NL@│ A  │ B  │ C  │@NL@├────┼────┼────┤@NL@│ D  │ E  │ F  │@NL@└────┴────┴────┘', N'@NL@', CHAR(10)),
2, N'KPI 6개 보드', 325, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_27', 'mix_grid_3x2', 'LAYOUT_MIXED', N'격자: 3x2', N'Grid 3x2', N'3행 2열 격자',
REPLACE(N'┌──────┬───────┐@NL@│  A   │  B    │@NL@├──────┼───────┤@NL@│  C   │  D    │@NL@├──────┼───────┤@NL@│  E   │  F    │@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
2, N'카드 리스트', 326, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_28', 'mix_grid_3x3', 'LAYOUT_MIXED', N'격자: 3x3', N'Grid 3x3', N'3x3 매트릭스 (9개 셀)',
REPLACE(N'┌───┬───┬───┐@NL@│ A │ B │ C │@NL@├───┼───┼───┤@NL@│ D │ E │ F │@NL@├───┼───┼───┤@NL@│ G │ H │ I │@NL@└───┴───┴───┘', N'@NL@', CHAR(10)),
1, N'대형 모니터링', 327, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_29', 'mix_strip_horizontal', 'LAYOUT_MIXED', N'격자: 가로 스트립(1x4) + 하단 상세', N'Horizontal Strip + Detail', N'상단 4개 나란한 차트 + 하단 상세',
REPLACE(N'┌──┬──┬──┬──┐@NL@│A │B │C │D │@NL@├──┴──┴──┴──┤@NL@│ ▢ 상세      │@NL@└───────────┘', N'@NL@', CHAR(10)),
2, N'다차트 요약', 328, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_30', 'mix_strip_vertical', 'LAYOUT_MIXED', N'격자: 세로 스트립(4x1)', N'Vertical Strip', N'세로 4개 카드 스트립',
REPLACE(N'┌──────┐@NL@│  A   │@NL@├──────┤@NL@│  B   │@NL@├──────┤@NL@│  C   │@NL@├──────┤@NL@│  D   │@NL@└──────┘', N'@NL@', CHAR(10)),
1, N'타임라인 블록', 329, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_31', 'mix_explorer_5', 'LAYOUT_MIXED', N'익스플로러 5영역: 헤더+좌+중앙+우+푸터', N'Explorer 5-Area', N'IDE 스타일: 헤더/좌사이드/중앙/우인스펙터/푸터',
REPLACE(N'┌──────────────┐@NL@│ 헤더          │@NL@├───┬──────┬───┤@NL@│좌 │ 중앙  │우 │@NL@│사 │      │인 │@NL@│이 │      │스 │@NL@├───┴──────┴───┤@NL@│ 푸터          │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'IDE,디자이너', 330, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_32', 'mix_explorer_3', 'LAYOUT_MIXED', N'익스플로러 3영역: 헤더 + (트리|그리드+상세) + 푸터', N'Explorer 3-Area', N'헤더 + 좌 트리 + 우측 상하(그리드+상세) + 푸터',
REPLACE(N'┌──────────────┐@NL@│ 헤더          │@NL@├──────┬───────┤@NL@│ ▼    │ ▦     │@NL@│ Tree ├───────┤@NL@│      │ ▢     │@NL@├──────┴───────┤@NL@│ 푸터          │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'파일 탐색기', 331, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_33', 'mix_header_nav_content_status', 'LAYOUT_MIXED', N'앱 쉘: 헤더+네비+콘텐츠(탭)+상태바', N'App Shell: Header+Nav+Tab+Status', N'전체 앱 쉘 구조',
REPLACE(N'┌──────────────┐@NL@│ 헤더          │@NL@├───┬──────────┤@NL@│ ▪ │ [T1][T2]  │@NL@│ 네 │ 콘텐츠    │@NL@│ 비 │          │@NL@├───┴──────────┤@NL@│ 상태바        │@NL@└──────────────┘', N'@NL@', CHAR(10)),
3, N'표준 앱 쉘', 332, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_34', 'mix_ribbon_main', 'LAYOUT_MIXED', N'리본+콘텐츠: MS Office 스타일', N'Ribbon + Content', N'상단 리본 탭 메뉴 + 하단 콘텐츠',
REPLACE(N'┌──────────────┐@NL@│ [파일][홈][삽입]│@NL@│ ▣ ▣ ▣ ▣ ▣    │@NL@├──────────────┤@NL@│ 콘텐츠        │@NL@└──────────────┘', N'@NL@', CHAR(10)),
1, N'오피스형 도구', 333, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_35', 'mix_ribbon_h2', 'LAYOUT_MIXED', N'리본+H2: 리본 + 좌우 2분할', N'Ribbon + H2', N'상단 리본 + 하단 좌우 2분할',
REPLACE(N'┌──────────────┐@NL@│ [파일][홈]    │@NL@│ ▣ ▣ ▣ ▣ ▣    │@NL@├──────┬───────┤@NL@│ 좌   │ 우    │@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
1, N'리본 + 작업 공간', 334, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_36', 'mix_master_tabbed_detail', 'LAYOUT_MIXED', N'혼합: 좌 마스터 + 우(탭: 디테일 A/B/C)', N'Master + Tabbed Details', N'좌 마스터 + 우측이 탭별 다른 디테일',
REPLACE(N'┌──────┬───────┐@NL@│      │[A][B] │@NL@│ ▦    ├───────┤@NL@│ Mst  │ 탭     │@NL@│      │ 콘텐츠│@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
3, N'고객/품목 카드', 335, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_37', 'mix_master_v_tabbed_detail', 'LAYOUT_MIXED', N'혼합: 상 마스터 + 하(탭: 디테일 A/B)', N'V-Master + Tabbed Details', N'상 마스터 + 하단 탭별 디테일',
REPLACE(N'┌──────────────┐@NL@│ ▦ Master      │@NL@├──────────────┤@NL@│ [A][B]        │@NL@│ 탭 콘텐츠      │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'리포트 하단 탭', 336, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_38', 'mix_master_v2_detail', 'LAYOUT_MIXED', N'혼합: 좌 마스터 + 우(헤더+라인)', N'Master + (Header/Lines)', N'좌 마스터 + 우측 상(헤더폼)+하(라인그리드)',
REPLACE(N'┌──────┬───────┐@NL@│      │ ▢ Hdr │@NL@│ ▦ M  ├───────┤@NL@│      │ ▦ Line│@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
2, N'주문 상세', 337, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_39', 'mix_report_v3', 'LAYOUT_MIXED', N'리포트: 상 필터 + 중 4분할차트 + 하 테이블', N'Report: Filter + 4 Charts + Table', N'필터 + 2x2 차트 + 테이블',
REPLACE(N'┌──────────────┐@NL@│ [F][F][F]     │@NL@├──────┬───────┤@NL@│ 📊   │ 📊    │@NL@├──────┼───────┤@NL@│ 📊   │ 📊    │@NL@├──────┴───────┤@NL@│ ▦ Table       │@NL@└──────────────┘', N'@NL@', CHAR(10)),
2, N'경영 리포트', 338, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MIX_40', 'mix_side_v3', 'LAYOUT_MIXED', N'혼합: 좌 사이드 + 우(KPI+차트+그리드)', N'Sidebar + V3 Right', N'좌 사이드바 + 우측 상하 3분할 (KPI/차트/그리드)',
REPLACE(N'┌──────┬───────┐@NL@│ ▪    │[K1][K2]│@NL@│      ├───────┤@NL@│ 네비 │ 📊    │@NL@│      ├───────┤@NL@│      │ ▦ Grid│@NL@└──────┴───────┘', N'@NL@', CHAR(10)),
3, N'관리형 대시보드', 339, N'system', '1970-01-01');


-- =============================================================
-- 결과 확인
-- =============================================================
SELECT CATEGORY, COUNT(*) AS CNT FROM TB_IS_COMPOSER_PATTERN GROUP BY CATEGORY ORDER BY CATEGORY;
SELECT COUNT(*) AS TOTAL_PATTERNS FROM TB_IS_COMPOSER_PATTERN;
-- =============================================================
-- T3Composer — 화면 패턴 CATEGORY 통합 (Layout 기반) [MSSQL]
-- =============================================================
-- Version : v26.0.0
-- Created : 2026-04-22
-- 내용   : 기존 기능 기반 카테고리
--            DASHBOARD / GRID / ENTRY / ANALYSIS /
--            VISUALIZATION / WORKFLOW / NAVIGATION / SPECIAL
--          를 Layout 기반 카테고리로 통합.
--            LAYOUT_V2 / LAYOUT_V3 / LAYOUT_V4 / LAYOUT_V5
--            LAYOUT_H2 / LAYOUT_H3 / LAYOUT_H4 / LAYOUT_H5
--            LAYOUT_MIXED
--
-- 재배정 규칙 — 각 패턴의 VISUAL 구조 기준:
--   V2 (상하 2분할, 23개) : P02 P05 P06 P07 P08 P10 P11 P12 P13 P15
--                          P18 P20 P21 P22 P23 P25 P27 P28 P29 P30
--                          P32 P35 P38
--   H2 (좌우 2분할, 8개)  : P04 P09 P14 P19 P33 P34 P36 P37
--   H3 (좌우 3분할, 2개)  : P24 P31
--   MIXED (혼합·격자, 5개): P01 P03 P16 P17 P26
--   합계 38개 = 기존 전체
-- =============================================================


-- -------------------------------------------------------------
-- LAYOUT_V2 (상하 2분할)
-- -------------------------------------------------------------
UPDATE TB_IS_COMPOSER_PATTERN
   SET CATEGORY    = 'LAYOUT_V2',
       MODIFY_BY   = 'system',
       MODIFY_DTTM = GETDATE()
 WHERE CODE IN (
    'P02',  -- search_grid (검색 + 그리드)
    'P05',  -- grid_chart_stacked (그리드 + 차트)
    'P06',  -- pivot_entry (검색 + 피벗)
    'P07',  -- control_board (스텝퍼 + 카드)
    'P08',  -- process_status (스텝퍼 + 트리그리드)
    'P10',  -- flo_diagram (타이틀 + 플로우)
    'P11',  -- map (헤더 + 지도)
    'P12',  -- pivot_table (피벗 단독)
    'P13',  -- kpi_chart (KPI + 차트)
    'P15',  -- chart_grid_vertical (차트 + 그리드)
    'P18',  -- drilldown (마스터차트 + 디테일차트)
    'P20',  -- card_list (검색 + 카드)
    'P21',  -- form_detail_grid (헤더폼 + 라인그리드)
    'P22',  -- wizard_stepper (스텝퍼 + 폼)
    'P23',  -- timeline (헤더 + 타임라인)
    'P25',  -- calendar (헤더 + 캘린더)
    'P27',  -- scheduler (헤더 + 스케줄)
    'P28',  -- network_graph (헤더 + 네트워크)
    'P29',  -- heatmap (헤더 + 히트맵)
    'P30',  -- approval_list (헤더 + 리스트)
    'P32',  -- code_editor (에디터 + 실행결과)
    'P35',  -- infinite_list (검색 + 무한리스트)
    'P38'   -- chat (메시지 + 입력)
);


-- -------------------------------------------------------------
-- LAYOUT_H2 (좌우 2분할)
-- -------------------------------------------------------------
UPDATE TB_IS_COMPOSER_PATTERN
   SET CATEGORY    = 'LAYOUT_H2',
       MODIFY_BY   = 'system',
       MODIFY_DTTM = GETDATE()
 WHERE CODE IN (
    'P04',  -- split_master_detail (마스터 | 디테일)
    'P09',  -- gantt (리소스목록 | 간트)
    'P14',  -- chart_grid_horizontal (차트 | 그리드)
    'P19',  -- tree_grid (트리 | 그리드)
    'P33',  -- doc_viewer (파일목록 | 뷰어)
    'P34',  -- settings_form (카테고리 | 설정)
    'P36',  -- sidebar_main (사이드바 | 메인)
    'P37'   -- diff_view (Before | After)
);


-- -------------------------------------------------------------
-- LAYOUT_H3 (좌우 3분할)
-- -------------------------------------------------------------
UPDATE TB_IS_COMPOSER_PATTERN
   SET CATEGORY    = 'LAYOUT_H3',
       MODIFY_BY   = 'system',
       MODIFY_DTTM = GETDATE()
 WHERE CODE IN (
    'P24',  -- tree_grid_detail (트리 | 그리드 | 상세)
    'P31'   -- kanban (TODO | DOING | DONE)
);


-- -------------------------------------------------------------
-- LAYOUT_MIXED (혼합·격자·탭)
-- -------------------------------------------------------------
UPDATE TB_IS_COMPOSER_PATTERN
   SET CATEGORY    = 'LAYOUT_MIXED',
       MODIFY_BY   = 'system',
       MODIFY_DTTM = GETDATE()
 WHERE CODE IN (
    'P01',  -- widget_dashboard (격자형 위젯 보드)
    'P03',  -- search_tab (검색 + 탭)
    'P16',  -- grid_2x2 (2x2 차트)
    'P17',  -- tab_chart (탭 내부 차트 전환)
    'P26'   -- report_tabs (리포트 탭)
);


-- =============================================================
-- 결과 확인
-- =============================================================

-- 카테고리별 건수
SELECT CATEGORY, COUNT(*) AS CNT
  FROM TB_IS_COMPOSER_PATTERN
 GROUP BY CATEGORY
 ORDER BY CATEGORY;

-- 기존 38개 재배정 결과
SELECT CODE, CATEGORY, NAME
  FROM TB_IS_COMPOSER_PATTERN
 WHERE CODE LIKE 'P[0-9][0-9]'
 ORDER BY CATEGORY, CODE;

-- 예전 카테고리 잔류 여부 (0건이어야 정상)
SELECT COUNT(*) AS LEFTOVER
  FROM TB_IS_COMPOSER_PATTERN
 WHERE CATEGORY IN ('DASHBOARD', 'GRID', 'ENTRY', 'ANALYSIS',
                    'VISUALIZATION', 'WORKFLOW', 'NAVIGATION', 'SPECIAL');
-- =============================================================
-- T3Composer — 화면 패턴 Seed (ControlBoard 카테고리) [MSSQL]
-- =============================================================
-- Version : v26.0.0 (Stage 7-cb)
-- Created : 2026-04-22
-- 내용   : SCM Engine Control Board UI Patterns HTML 의 31개 Tab 을
--          각각 1 패턴으로 등록. CATEGORY = 'LAYOUT_CONTROLBOARD'.
--
--   CB_01 ControlBoard              (Tab 1 - 마스터 대시보드)
--   CB_02 ControlBoard(복합공정)    (Tab 2 - LED 4공정 관제)
--   CB_03 ~ CB_31                   (Tab 3 ~ 31 원본 이름 유지)
--
-- 비고   : 'line1@NL@line2' 형태의 @NL@ 를 CHAR(10) 으로 치환
-- =============================================================


-- 재실행 대비 기존 CB_* 제거
DELETE FROM TB_IS_COMPOSER_PATTERN
    WHERE CODE LIKE 'CB[_]%' OR CATEGORY = 'LAYOUT_CONTROLBOARD';


-- -------------------------------------------------------------
-- CB_01  ControlBoard (마스터 대시보드)
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_01', 'cb_master_dashboard', 'LAYOUT_CONTROLBOARD', N'ControlBoard', N'Master Control Dashboard', N'엔진 종합 제어 + 파이프라인 + 리소스 + 이력/오류/로그 통합 관제 대시보드',
REPLACE(N'┌──────────────────────┐@NL@│ 🎛️ Master Dashboard   │@NL@├─────┬──────┬─────────┤@NL@│제어 │파이프 │노드리소스│@NL@├─────┼──────┼─────────┤@NL@│이력 │오류   │Terminal │@NL@└─────┴──────┴─────────┘', N'@NL@', CHAR(10)),
3, N'엔진 종합 관제,대시보드', 500, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_02  ControlBoard(복합공정) - LED 4공정 관제
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_02', 'cb_composite_process', 'LAYOUT_CONTROLBOARD', N'ControlBoard(복합공정)', N'Composite Process Control Board', N'LED 4대 공정(MOD/PKG/FAB/EPI) MP·MRP 개별 제어 + 파이프라인·리소스·자재 정합성 관제',
REPLACE(N'┌──────────────────────┐@NL@│ 🏭 4공정 관제 [일괄Run]│@NL@├────┬────┬────┬───────┤@NL@│MOD │PKG │FAB │EPI    │@NL@├────┴────┴────┴───────┤@NL@│파이프 │리소스 │정합성 │@NL@├──────┼──────┼──────┤@NL@│이력  │오류  │Terminal│@NL@└──────┴──────┴──────┘', N'@NL@', CHAR(10)),
3, N'복합 공정 관제,역전개', 501, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_03  병렬 시나리오
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_03', 'cb_parallel_scenario', 'LAYOUT_CONTROLBOARD', N'병렬 시나리오', N'Parallel Scenario Run', N'다중 시나리오(안전재고/CAPA 변형) 병렬 구동 및 결과 비교 테이블',
REPLACE(N'┌──────────────────────┐@NL@│ ② 병렬시나리오 [▶Run] │@NL@├──────────────────────┤@NL@│ ☑ Scenario│Dem│Cap│상태│@NL@│ ☑ OPT_1  │-10│110│Rdy │@NL@│ ☑ OPT_2  │+5 │100│Rdy │@NL@│ ☑ OPT_3  │0  │90 │Rdy │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'시나리오 병렬 비교', 502, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_04  파라미터 튜닝
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_04', 'cb_param_tuning', 'LAYOUT_CONTROLBOARD', N'파라미터 튜닝', N'Engine Parameter Tuning', N'제약조건 가중치(납기 vs 원가), 페널티 값 미세 조정 그리드',
REPLACE(N'┌──────────────────────┐@NL@│ ③ 파라미터 튜닝 [저장] │@NL@├──────┬──────┬────────┤@NL@│납기  │재고  │셋업    │@NL@│▢ 320 │▢ 120 │▢ 80    │@NL@├──────┼──────┼────────┤@NL@│평활화│외주  │SS위반  │@NL@│▢ 50  │▢ 15  │▢ 250   │@NL@└──────┴──────┴────────┘', N'@NL@', CHAR(10)),
1, N'솔버 가중치 조정', 503, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_05  배치 스케줄
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_05', 'cb_batch_schedule', 'LAYOUT_CONTROLBOARD', N'배치 스케줄', N'Batch Job Scheduling', N'Crontab 스타일 엔진 배치 잡 등록·관리 그리드',
REPLACE(N'┌──────────────────────┐@NL@│ ④ 배치 스케줄           │@NL@├──────────────────────┤@NL@│ JobID│명칭│Cron │상태 │@NL@│ SCH-1│야간│0 2**│Act │@NL@│ SCH-2│시간│0 */2│Act │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'크론잡,스케줄링', 504, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_06  MDM 검증
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_06', 'cb_mdm_check', 'LAYOUT_CONTROLBOARD', N'MDM 검증', N'Master Data Validation', N'BOM 사이클·리드타임 누락·단종 수요 등 마스터 데이터 사전 검증',
REPLACE(N'┌──────────────────────┐@NL@│ ⑤ MDM 검증    [검증↻] │@NL@├──────────────────────┤@NL@│ Rule    │대상│오류│판정│@NL@│ BOM     │150K│  0 │PASS│@NL@│ LT      │ 45K│ 12 │WARN│@NL@│ 단종수요│  8K│  5 │FAIL│@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'마스터 데이터 사전검증', 505, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_07  실행 결재
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_07', 'cb_approval', 'LAYOUT_CONTROLBOARD', N'실행 결재', N'Execution Approval', N'대규모 엔진 확정 전 책임자 시스템 결재 카드 리스트',
REPLACE(N'┌──────────────────────┐@NL@│ ⑥ 실행 결재            │@NL@├──────────┬───────────┤@NL@│SCM V2.0  │ SCM V2.1  │@NL@│[승인][반려]│[승인][반려]│@NL@├──────────┼───────────┤@NL@│BF V1.3   │ DP V1.1   │@NL@│[승인][반려]│[승인][반려]│@NL@└──────────┴───────────┘', N'@NL@', CHAR(10)),
1, N'시스템 결재 워크플로', 506, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_08  노드 상태
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_08', 'cb_node_status', 'LAYOUT_CONTROLBOARD', N'노드 상태', N'Global Node Status', N'분산 엔진 노드 상태(Idle/Running/Error) 카드 형태 모니터링',
REPLACE(N'┌──────────────────────┐@NL@│ ⑦ 전체 노드 상태       │@NL@├───┬───┬───┬───┬───┬──┤@NL@│N01│N02│N03│N04│N05│..│@NL@│OK │RUN│OK │RUN│OK │  │@NL@├───┼───┼───┼───┼───┼──┤@NL@│N07│N08│N09│N10│N11│N12│@NL@│OK │OK │RUN│OK │ERR│OK │@NL@└───┴───┴───┴───┴───┴──┘', N'@NL@', CHAR(10)),
1, N'분산 서버 모니터', 507, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_09  진척도(Pipeline)
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_09', 'cb_pipeline_progress', 'LAYOUT_CONTROLBOARD', N'진척도(Pipeline)', N'Pipeline Progress', N'데이터 로드 → Heuristic → LP → 후처리 단계별 진행률 바',
REPLACE(N'┌──────────────────────┐@NL@│ ⑧ 파이프라인 진척도    │@NL@├──────────────────────┤@NL@│ Data    ▰▰▰▰▰ 100%  │@NL@│ MDM     ▰▰▰▰▰ 100%  │@NL@│ Heur    ▰▰░░░  45%  │@NL@│ LP      ░░░░░   0%  │@NL@│ Save    ░░░░░   0%  │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'엔진 단계 모니터', 508, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_10  실시간 로그
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_10', 'cb_live_log', 'LAYOUT_CONTROLBOARD', N'실시간 로그', N'Live Terminal Log', N'엔진 처리 로그 CLI 터미널 실시간 스트리밍',
REPLACE(N'┌──────────────────────┐@NL@│ ⑨ 실시간 로그  [⬇DL]  │@NL@├──────────────────────┤@NL@│ [14:30:01] INFO ...  │@NL@│ [14:30:05] INFO ...  │@NL@│ [14:31:12] WARN ...  │@NL@│ [14:32:00] INFO ...  │@NL@│ [14:32:45] RUNNING   │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'CLI 로그 스트리밍', 509, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_11  리소스 관제
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_11', 'cb_resource_monitor', 'LAYOUT_CONTROLBOARD', N'리소스 관제', N'CPU/Memory Monitor', N'CPU·메모리 사용률 실시간 히스토그램 (좌우 2분할)',
REPLACE(N'┌──────────┬───────────┐@NL@│ ⑩ CPU    │ Memory    │@NL@├──────────┼───────────┤@NL@│ ▂▄▆▃▅▇▂  │ ▃▅▆▄▇▆▅  │@NL@│ ▁▃▅▂▄▆▁  │ ▂▄▅▃▆▅▄  │@NL@└──────────┴───────────┘', N'@NL@', CHAR(10)),
2, N'하드웨어 리소스', 510, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_12  I/O 현황
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_12', 'cb_io_interface', 'LAYOUT_CONTROLBOARD', N'I/O 현황', N'I/O Interface Status', N'ERP/MES 등 외부 시스템 I/F 수신 현황·트래픽 관제',
REPLACE(N'┌──────────────────────┐@NL@│ ⑪ I/O 인터페이스       │@NL@├──────────────────────┤@NL@│ IF-ID │Src│건수│상태 │@NL@│ ERP001│SAP│12K │ OK  │@NL@│ MES002│MES│ 8K │ OK  │@NL@│ DMS003│DMS│ 5K │WARN │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'I/F 수신 모니터', 511, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_13  대기열(Queue)
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_13', 'cb_job_queue', 'LAYOUT_CONTROLBOARD', N'대기열(Queue)', N'Job Queue Management', N'엔진 Job Queue — 드래그 우선순위 재정렬·취소',
REPLACE(N'┌──────────────────────┐@NL@│ ⑫ 작업 대기열 Queue    │@NL@├──────────────────────┤@NL@│ #1 Job_9241  [Wait] ⋮│@NL@│ #2 Job_3845  [Wait] ⋮│@NL@│ #3 Job_2103  [Wait] ⋮│@NL@│ #4 Job_8612  [Wait] ⋮│@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'큐 우선순위 관리', 512, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_14  통합 오류 로그
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_14', 'cb_error_log', 'LAYOUT_CONTROLBOARD', N'통합 오류 로그', N'Global Error Grid', N'전체 시스템 Error/Warning 로그 통합 그리드',
REPLACE(N'┌──────────────────────┐@NL@│ ⑬ 통합오류 [ExportCSV] │@NL@├──────────────────────┤@NL@│일시│Lv│코드│모듈│메시지│@NL@│10:30│ERR│501│Slv │MatOOM│@NL@│10:32│WRN│301│Dat │MissLT│@NL@│10:35│ERR│502│Slv │Ctrl C│@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'오류 그리드', 513, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_15  알람 임계치
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_15', 'cb_alert_threshold', 'LAYOUT_CONTROLBOARD', N'알람 임계치', N'Alert Threshold Setup', N'에러 발생·지연 임계치 설정, 관리자 이메일 발송 룰',
REPLACE(N'┌──────────────────────┐@NL@│ ⑭ 알람 임계치          │@NL@├──────────────────────┤@NL@│ 룰     │Cond│수신│ON │@NL@│ Err>0  │E>0 │admn│ ☑ │@NL@│ LT>2h  │T>2h│ops │ ☑ │@NL@│ Mem>90%│M>90│dba │ ☑ │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'임계치 알람 룰', 514, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_16  노드 원격복구
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_16', 'cb_node_recovery', 'LAYOUT_CONTROLBOARD', N'노드 원격복구', N'Node Remote Recovery', N'장애 노드 Force Kill & Restart 원격 제어 패널',
REPLACE(N'┌──────────────────────┐@NL@│ ⑮ 노드 원격복구        │@NL@├───────┬───────┬──────┤@NL@│ 🖥 W1 │ 🖥 W2 │ 🖥 W3│@NL@│ [Kill]│ [Kill]│[Kill]│@NL@├───────┼───────┼──────┤@NL@│ 🖥 W4 │ 🖥 W5 │ 🖥 W6│@NL@│ [Kill]│ [Kill]│[Kill]│@NL@└───────┴───────┴──────┘', N'@NL@', CHAR(10)),
1, N'Dead Node 복구', 515, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_17  결측치 보정
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_17', 'cb_data_imputation', 'LAYOUT_CONTROLBOARD', N'결측치 보정', N'Data Imputation', N'Null 결측치 자동 보정 룰(0 처리/평균/최근값 등)',
REPLACE(N'┌──────────────────────┐@NL@│ ⑯ 결측치 보정          │@NL@├──────────────────────┤@NL@│ 테이블│컬럼│건수│룰│결과│@NL@│ DEMD │QTY │ 50 │0 │✓  │@NL@│ INV  │STK │ 30 │AVG│✓ │@NL@│ SO   │DT  │ 12 │0 │✓  │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'데이터 정제', 516, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_18  오류 할당
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_18', 'cb_ticket_assign', 'LAYOUT_CONTROLBOARD', N'오류 할당', N'Error Ticket Assignment', N'오류 티켓 담당자·부서 배정, 처리 기한 관리',
REPLACE(N'┌──────────────────────┐@NL@│ ⑰ 오류 담당자 할당     │@NL@├──────────────────────┤@NL@│ 티켓│요약│담당│기한│상태│@NL@│ T1  │MDM │IT  │Tdy │Opn │@NL@│ T2  │Cap │Ops │Tmr │Opn │@NL@│ T3  │Slv │DBA │Tdy │Opn │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'티켓 워크플로', 517, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_19  장애 분석(RCA)
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_19', 'cb_rca_analysis', 'LAYOUT_CONTROLBOARD', N'장애 분석(RCA)', N'Root Cause Analysis', N'AI Stack Trace 분석 → Root Cause · Detail · Recommendation',
REPLACE(N'┌──────────────────────┐@NL@│ ⑱ 장애 분석 RCA        │@NL@├──────────────────────┤@NL@│ [Root Cause]         │@NL@│ Memory Limit Exceed  │@NL@│ [Detail] ...         │@NL@│ [Recommendation]     │@NL@│ 1) Inc mem 2) ...    │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'장애 근본원인 분석', 518, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_20  수급 밸런스
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_20', 'cb_supply_demand', 'LAYOUT_CONTROLBOARD', N'수급 밸런스', N'Supply-Demand Balance', N'기간별 수요 vs 공급 밸런스 (부족 구간 하이라이트)',
REPLACE(N'┌──────────────────────┐@NL@│ ⑲ 수급 밸런스          │@NL@├──────────────────────┤@NL@│ Wk│ D  │ S  │Bal │상태│@NL@│ W1│4500│4700│+200│ OK │@NL@│ W2│4800│4100│-700│Shrt│@NL@│ W3│5200│5300│+100│ OK │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'D/S 매칭 분석', 519, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_21  KPI 변화비교
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_21', 'cb_kpi_compare', 'LAYOUT_CONTROLBOARD', N'KPI 변화비교', N'KPI Before/After', N'엔진 전/후 핵심 KPI(Fill Rate·Total Inv·Late Orders) 향상도',
REPLACE(N'┌──────────────────────┐@NL@│ ⑳ KPI 변화비교         │@NL@├──────┬──────┬────────┤@NL@│FillRt│TotInv│LateOrd │@NL@│85→96%│2.5→1.8│150→12 │@NL@│  ▲   │  ▲   │  ▲     │@NL@└──────┴──────┴────────┘', N'@NL@', CHAR(10)),
2, N'개선 효과 요약', 520, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_22  안전재고 경고
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_22', 'cb_safety_alert', 'LAYOUT_CONTROLBOARD', N'안전재고 경고', N'Safety Stock Alert', N'안전재고 위반 예상 품목 리스트 (위험도 표시)',
REPLACE(N'┌──────────────────────┐@NL@│ ㉑ 안전재고 위반        │@NL@├──────────────────────┤@NL@│ 품목│주차│SS│예상│위험│@NL@│ SKU1│ W3 │500│180 │HI  │@NL@│ SKU2│ W5 │500│280 │MID │@NL@│ SKU3│ W8 │500│ 95 │HI  │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'SS 위반 감시', 521, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_23  납기지연 오더
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_23', 'cb_late_orders', 'LAYOUT_CONTROLBOARD', N'납기지연 오더', N'Late Delivery Orders', N'CAPA·자재 제약으로 납기 지연 예상 수주(SO) 리스트',
REPLACE(N'┌──────────────────────┐@NL@│ ㉒ 납기지연 오더        │@NL@├──────────────────────┤@NL@│ SO  │고객│납기│출하│지연│@NL@│SO101│ A  │11/15│11/18│+3 │@NL@│SO102│ B  │11/15│11/17│+2 │@NL@│SO103│ C  │11/20│11/25│+5 │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'납기 위험 오더', 522, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_24  자원 병목구간
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_24', 'cb_bottleneck', 'LAYOUT_CONTROLBOARD', N'자원 병목구간', N'Resource Bottleneck', N'가동률 >95% 병목 설비(Resource) 식별 테이블',
REPLACE(N'┌──────────────────────┐@NL@│ ㉓ 자원 병목구간        │@NL@├──────────────────────┤@NL@│ 설비 │필요│가용│부하│상태│@NL@│ L1   │180 │160 │113%│OVR │@NL@│ L2   │150 │160 │ 94%│OK  │@NL@│ L3   │175 │160 │109%│OVR │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'병목 설비 식별', 523, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_25  엔진버전 비교
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_25', 'cb_version_diff', 'LAYOUT_CONTROLBOARD', N'엔진버전 비교', N'Engine Version Diff', N'V1.0(어제) vs V1.1(오늘) 주요 KPI 좌우 비교',
REPLACE(N'┌──────────┬───────────┐@NL@│V1.0 어제 │V1.1 오늘  │@NL@├──────────┼───────────┤@NL@│생산 45K  │생산 46.5K▲│@NL@│납기 92%  │납기 95%  ▲│@NL@│재고 1.2M │재고 1.4M ▼│@NL@└──────────┴───────────┘', N'@NL@', CHAR(10)),
2, N'버전 간 결과 비교', 524, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_26  ERP 확정/전송
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_26', 'cb_erp_publish', 'LAYOUT_CONTROLBOARD', N'ERP 확정/전송', N'ERP Result Publish', N'엔진 결과 최종 승인 → ERP/MES 인터페이스 전송',
REPLACE(N'┌──────────────────────┐@NL@│ ㉕ ERP확정  [✅ 확정]  │@NL@├──────────────────────┤@NL@│                      │@NL@│        📤            │@NL@│  V1.1 결과를          │@NL@│  Official Plan 릴리즈 │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'계획 확정·Publish', 525, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_27  수동 오버라이드
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_27', 'cb_manual_override', 'LAYOUT_CONTROLBOARD', N'수동 오버라이드', N'Manual Override', N'엔진 권장 수량 → 관리자 수동 확정 수량 고정(Fix) + 사유',
REPLACE(N'┌──────────────────────┐@NL@│ ㉖ 수동 오버라이드      │@NL@├──────────────────────┤@NL@│ 품목│권장│수동│사유   │@NL@│Itm01│320 │▢350│긴급수요│@NL@│Itm02│180 │▢150│재고과다│@NL@│Itm03│420 │▢420│       │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'플래너 수동 개입', 526, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_28  AI 챗봇 질의
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_28', 'cb_ai_chatbot', 'LAYOUT_CONTROLBOARD', N'AI 챗봇 질의', N'AI Helpdesk Chatbot', N'자연어 질문 → AI 쿼리 결과 표출 (채팅 인터페이스)',
REPLACE(N'┌──────────────────────┐@NL@│ ㉗ AI 챗봇 헬프데스크   │@NL@├──────────────────────┤@NL@│ [AI] 무엇을 도와 ...  │@NL@│                      │@NL@│ [나] 납기지연 오더?    │@NL@├──────────────────────┤@NL@│ ⌨ 자연어 입력 [질문]  │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'NL 헬프데스크', 527, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_29  물류망 Map
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_29', 'cb_geo_map', 'LAYOUT_CONTROLBOARD', N'물류망 Map', N'Geo-Map View', N'다거점 공장·물류센터 물동량 흐름 지도 시각화',
REPLACE(N'┌──────────────────────┐@NL@│ ㉘ 글로벌 물류망 Map   │@NL@├──────────────────────┤@NL@│                      │@NL@│   🗺 📍──📍          │@NL@│   📍    \\            │@NL@│    \\    📍           │@NL@│     \\___📍           │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'공급망 지오 시각화', 528, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_30  토폴로지 View
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_30', 'cb_topology', 'LAYOUT_CONTROLBOARD', N'토폴로지 View', N'Service Topology', N'마이크로서비스(API/DB/Cache) 연결·트래픽 그래프',
REPLACE(N'┌──────────────────────┐@NL@│ ㉙ 마이크로서비스 Topol │@NL@├──────────────────────┤@NL@│  API──DB              │@NL@│   │   │               │@NL@│  Cache─Queue          │@NL@│   │                   │@NL@│  Worker               │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'서비스 연결도', 529, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- CB_31  커스텀 위젯
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'CB_31', 'cb_custom_widget', 'LAYOUT_CONTROLBOARD', N'커스텀 위젯', N'User Custom Widget Grid', N'관리자 정의 차트·위젯 드래그&드롭 자유 배치',
REPLACE(N'┌──────────────────────┐@NL@│ ㉚ 커스텀 위젯 [+추가] │@NL@├──────┬──────┬────────┤@NL@│Widg1 │Widg2 │Widg3   │@NL@│ ░░░ │ ░░░ │ ░░░    │@NL@├──────┴──────┴────────┤@NL@│ (drag-and-drop free) │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'사용자 정의 대시', 530, N'system', '1970-01-01');


-- =============================================================
-- 결과 확인
-- =============================================================
SELECT CATEGORY, COUNT(*) AS CNT
  FROM TB_IS_COMPOSER_PATTERN
 WHERE CATEGORY = 'LAYOUT_CONTROLBOARD'
 GROUP BY CATEGORY;

SELECT CODE, NAME, LAYOUT
  FROM TB_IS_COMPOSER_PATTERN
 WHERE CATEGORY = 'LAYOUT_CONTROLBOARD'
 ORDER BY SORT_ORDER;
-- =============================================================
-- T3Composer — 화면 패턴 Seed (PlanEdit 카테고리) [MSSQL]
-- =============================================================
-- Version : v26.0.0 (Stage 7-pe)
-- Created : 2026-04-22
-- 내용   : SCM Plan/Schedule 보정 UI Patterns HTML 의 20개 Tab 을
--          각각 1 패턴으로 등록. CATEGORY = 'LAYOUT_PLANEDIT'.
--
--   PE_01 ~ PE_20 — 계획 보정(PlanEdit) 전용 화면 패턴
--
-- 비고   : 'line1@NL@line2' 형태의 @NL@ 를 CHAR(10) 으로 치환
-- =============================================================


-- 재실행 대비 기존 PE_* 제거
DELETE FROM TB_IS_COMPOSER_PATTERN
    WHERE CODE LIKE 'PE[_]%' OR CATEGORY = 'LAYOUT_PLANEDIT';


-- -------------------------------------------------------------
-- PE_01  Pivot Grid 직접 보정
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'PE_01', 'pe_pivot_grid_edit', 'LAYOUT_PLANEDIT', N'Pivot Grid 직접 보정', N'Pivot Grid Direct Edit', N'행=발주/품목, 열=일자(D+1~D+30) 피벗에서 셀 직접 수정 + 보정 요약 KPI',
REPLACE(N'┌──────────────────────┐@NL@│ ① Pivot Grid  [저장]  │@NL@├──────────────────────┤@NL@│ 품목│D+1│D+2│D+3│D+4 │@NL@│ A   │100│▦120│ 90│ 80│@NL@│ B   │ 80│ 75│▦ 95│ 85│@NL@├──────────────────────┤@NL@│ 수정 증감 용량초과 KPI │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
3, N'계획 수량 직접 편집', 600, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- PE_02  간트 드래그 & 리사이즈
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'PE_02', 'pe_gantt_drag_edit', 'LAYOUT_PLANEDIT', N'간트 드래그 보정', N'Gantt Drag & Resize', N'바(Bar) 드래그·리사이즈로 일정 이동. 계획(파랑)/실적(초록)/보정(주황) 표시',
REPLACE(N'┌──────────────────────┐@NL@│ ② 간트 보정          │@NL@├──────────────────────┤@NL@│ PO-01 ▰▰▰▰▱░░░      │@NL@│ PO-02 ░▰▰▰▰▱░░       │@NL@│ PO-03 ░░░▰▰▰▰░       │@NL@│ PO-04 ░░▰▰▰▰▱░       │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
3, N'일정 드래그 편집', 601, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- PE_03  Excel 일괄 업로드 보정
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'PE_03', 'pe_excel_upload_edit', 'LAYOUT_PLANEDIT', N'Excel 업로드 일괄 보정', N'Excel Upload Bulk Edit', N'엑셀 템플릿 업로드 + 행별 실시간 검증(서식/중복/용량초과) + 정상 행 일괄 반영',
REPLACE(N'┌──────┬───────────────┐@NL@│ ③ 업로드 일괄 보정     │@NL@├──────┼───────────────┤@NL@│ 📁DZ │ 행│PO│품목│검증 │@NL@│ Upld │ 01│A │item│ OK │@NL@│ 125건│ 02│B │item│ERR │@NL@│ OK 80│ 03│C │item│ OK │@NL@│ ERR20│ ...           │@NL@└──────┴───────────────┘', N'@NL@', CHAR(10)),
2, N'엑셀 일괄 업로드', 602, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- PE_04  Before / After Diff Viewer
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'PE_04', 'pe_diff_viewer', 'LAYOUT_PLANEDIT', N'Before/After Diff Viewer', N'Before/After Diff Viewer', N'보정 전·후 비교 + 체크박스로 선택적 적용 / 전체 적용',
REPLACE(N'┌──────────────────────┐@NL@│ ④ Diff Viewer [✓적용] │@NL@├──────────────────────┤@NL@│ ☑│PO│품목│전│후│차│ │@NL@│ ☑│01│A  │100│120│+20│@NL@│ ☐│02│B  │80 │60 │-20│@NL@│ ☑│03│C  │50 │50 │ 0 │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
3, N'변경 이력 비교·적용', 603, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- PE_05  시나리오 비교 & 선택
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'PE_05', 'pe_scenario_compare', 'LAYOUT_PLANEDIT', N'시나리오 비교 선택', N'Scenario Compare (What-if)', N'현재안/시나리오A/시나리오B 3-컬럼 비교 + 최적안 선택',
REPLACE(N'┌──────────────────────┐@NL@│ ⑤ 시나리오 [확정]     │@NL@├──────┬──────┬────────┤@NL@│현재  │ A안  │ B안    │@NL@│KPI 92│KPI 95│KPI 98  │@NL@│Inv1.2│Inv1.4│Inv1.1  │@NL@│ [선택]│[선택] │[선택]  │@NL@└──────┴──────┴────────┘', N'@NL@', CHAR(10)),
2, N'What-if 시나리오 비교', 604, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- PE_06  캘린더 드래그 납기 보정
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'PE_06', 'pe_calendar_drag', 'LAYOUT_PLANEDIT', N'캘린더 드래그 납기 보정', N'Calendar Drag Due-Date Edit', N'월간 캘린더에서 발주 chip 드래그하여 다른 날짜로 이동 + 이동 대기열',
REPLACE(N'┌──────────┬───────────┐@NL@│ ⑥ Cal [저장]│대기열    │@NL@├──────────┼───────────┤@NL@│일월화수목│ ▢ PO-12   │@NL@│1 2 3 4 5 │ ▢ PO-35   │@NL@│⦿8 9 ⦿10..│ ▢ PO-48   │@NL@│15 16 17..│           │@NL@└──────────┴───────────┘', N'@NL@', CHAR(10)),
2, N'납기일 드래그 조정', 605, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- PE_07  제약조건 알림 & 가이드
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'PE_07', 'pe_constraint_guide', 'LAYOUT_PLANEDIT', N'제약조건 알림 가이드', N'Constraint Alerts & Guide', N'좌측 위반 항목(용량/재고/납기) 리스트 + 우측 권장 보정 액션',
REPLACE(N'┌──────────┬───────────┐@NL@│ ⑦ [일괄 적용]         │@NL@├──────────┼───────────┤@NL@│🔴 위반 3건│💡 권장안  │@NL@│ ·L1 용량 │+ PO-01 이동│@NL@│ ·Inv 부족│+ PO-02 분할│@NL@│ ·납기 OVR│+ PO-03 감량│@NL@└──────────┴───────────┘', N'@NL@', CHAR(10)),
2, N'제약위반 가이드 적용', 606, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- PE_08  Capacity 슬라이더 보정
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'PE_08', 'pe_capacity_slider', 'LAYOUT_PLANEDIT', N'Capacity 슬라이더 보정', N'Capacity Slider Edit', N'좌측 라인별 Capacity 슬라이더 + 우측 실시간 부하율 바 차트',
REPLACE(N'┌──────────┬───────────┐@NL@│ ⑧ Capacity [저장]    │@NL@├──────────┼───────────┤@NL@│L1 ━━●━━━ │L1 ▰▰▰▰▱75%│@NL@│L2 ━━━━●━ │L2 ▰▰▰▰▰95%│@NL@│L3 ●━━━━━ │L3 ▰▰░░░30%│@NL@│L4 ━━━●━━ │L4 ▰▰▰▱░65%│@NL@└──────────┴───────────┘', N'@NL@', CHAR(10)),
2, N'설비 캐파 조정', 607, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- PE_09  Ripple Effect 연쇄 보정
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'PE_09', 'pe_ripple_effect', 'LAYOUT_PLANEDIT', N'Ripple Effect 분석', N'Ripple Effect Analysis', N'좌측 트리거 선택 + 우측 파급 영향 트리 (BOM 하위 공정/재고 연쇄)',
REPLACE(N'┌──────┬───────────────┐@NL@│ ⑨ Ripple  [⚡자동]    │@NL@├──────┼───────────────┤@NL@│트리거│ 영향 트리     │@NL@│PO-42 │ ├ 공정 L2 지연 │@NL@│납기+3│ │  ├ 재고 부족   │@NL@│ [▶] │ │  └ SO-17 지연 │@NL@│      │ └ 자재 조달+2  │@NL@└──────┴───────────────┘', N'@NL@', CHAR(10)),
1, N'연쇄 영향 분석', 608, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- PE_10  % 비율 슬라이더 보정
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'PE_10', 'pe_ratio_slider', 'LAYOUT_PLANEDIT', N'% 비율 슬라이더 보정', N'Ratio Slider Bulk Edit', N'좌측 품목군 % 슬라이더 + 우측 미리보기(기존/보정후/증감)',
REPLACE(N'┌──────────┬───────────┐@NL@│ ⑩ Ratio  [적용]      │@NL@├──────────┼───────────┤@NL@│A군 +10% ●│품목│전│후│증 │@NL@│B군  -5% ●│A  │100│110│+10│@NL@│C군  +0% ●│B  │200│190│-10│@NL@│D군 +15% ●│C  │150│150│ 0 │@NL@└──────────┴───────────┘', N'@NL@', CHAR(10)),
1, N'그룹 비율 일괄 조정', 609, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- PE_11  복수 발주 인라인 편집
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'PE_11', 'pe_bulk_inline_edit', 'LAYOUT_PLANEDIT', N'복수 발주 인라인 편집', N'Multi-Order Inline Edit', N'체크박스 다중 선택 + 일괄 편집 바(+일수/±%) + 인라인 그리드 편집',
REPLACE(N'┌──────────────────────┐@NL@│ ⑪ 일괄편집 [일괄][저장]│@NL@│ +3일 ±10% [적용]      │@NL@├──────────────────────┤@NL@│ ☑│PO│품목│납기│수량│우선│@NL@│ ☑│01│A │11/15│▢120│HI │@NL@│ ☑│02│B │11/17│▢ 80│MID│@NL@│ ☐│03│C │11/20│▢150│LOW│@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'다중 선택 일괄 편집', 610, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- PE_12  잠금 기반 선택적 보정
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'PE_12', 'pe_lock_based_edit', 'LAYOUT_PLANEDIT', N'잠금 기반 선택적 보정', N'Lock-based Selective Edit', N'확정 행 잠금(🔒), 해제(🔓) 행만 자동 재계산 + 결과 그리드',
REPLACE(N'┌──────────┬───────────┐@NL@│ ⑫ Lock [🔄재계산]     │@NL@├──────────┼───────────┤@NL@│🔒 PO-01  │재계산 결과 │@NL@│🔓 PO-02  │PO│전│후│Δ  │@NL@│🔒 PO-03  │02│100│115│+15│@NL@│🔓 PO-04  │04│ 80│ 90│+10│@NL@└──────────┴───────────┘', N'@NL@', CHAR(10)),
1, N'부분 고정 재계산', 611, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- PE_13  AI Copilot 추천 보정안
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'PE_13', 'pe_ai_copilot', 'LAYOUT_PLANEDIT', N'AI Copilot 추천 보정안', N'AI Copilot Recommendation', N'좌측 점수 기반 AI 추천 카드 + 우측 선택 카드 상세',
REPLACE(N'┌──────────┬───────────┐@NL@│ ⑬ 🤖AI [적용]        │@NL@├──────────┼───────────┤@NL@│추천안 95 │카드 상세  │@NL@│ Opt A   │효과 +12% │@NL@│추천안 88 │리스크 낮음│@NL@│ Opt B   │Conf 95%  │@NL@└──────────┴───────────┘', N'@NL@', CHAR(10)),
1, N'AI 자동 추천', 612, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- PE_14  이력 조회 + 버전 롤백
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'PE_14', 'pe_history_rollback', 'LAYOUT_PLANEDIT', N'보정 이력 + 버전 롤백', N'Edit History & Rollback', N'좌측 타임라인(버전 리스트) + 우측 선택 버전 상세 그리드 + 롤백',
REPLACE(N'┌──────┬───────────────┐@NL@│ ⑭ 이력 [⟳ 롤백]      │@NL@├──────┼───────────────┤@NL@│ v1.3 │ PO│구분│전│후  │@NL@│●v1.2 │ 01│수량│100│120│@NL@│ v1.1 │ 02│납기│Fri│Mon│@NL@│ v1.0 │ 03│수량│80 │90 │@NL@└──────┴───────────────┘', N'@NL@', CHAR(10)),
1, N'버전 타임라인', 613, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- PE_15  보정 후 KPI 대시보드
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'PE_15', 'pe_kpi_summary', 'LAYOUT_PLANEDIT', N'보정 후 KPI 대시보드', N'Post-Edit KPI Summary', N'상단 KPI 4 카드 + 하단(수량 비교 테이블 + 일별 부하 Heatmap)',
REPLACE(N'┌──────────────────────┐@NL@│ ⑮ KPI [✅ 확정]      │@NL@├──────┬───────────────┤@NL@│K1K2K3│K4                │@NL@│  KPI  4-Card Row     │@NL@├──────┼───────────────┤@NL@│수량비교│ Heatmap ░▒▓█  │@NL@│ 테이블 │ ░▒▓█▓▒░      │@NL@└──────┴───────────────┘', N'@NL@', CHAR(10)),
2, N'보정 전후 KPI 요약', 614, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- PE_16  우선순위 큐 랭킹 보정
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'PE_16', 'pe_rank_reschedule', 'LAYOUT_PLANEDIT', N'우선순위 랭킹 보정', N'Rank-based Rescheduling', N'좌측 드래그 랭킹 리스트 + 우측 자동 계산 요약(대기/지연 카드)',
REPLACE(N'┌──────────────┬───────┐@NL@│ ⑯ 랭킹 [확정] │요약    │@NL@├──────────────┼───────┤@NL@│#1 PO-05 ⋮     │대기12건│@NL@│#2 PO-12 ⋮     │지연 3건│@NL@│#3 PO-34 ⋮     │        │@NL@│#4 PO-55 ⋮     │        │@NL@└──────────────┴───────┘', N'@NL@', CHAR(10)),
1, N'드래그 우선순위', 615, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- PE_17  대체 자재 스왑
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'PE_17', 'pe_altpart_swap', 'LAYOUT_PLANEDIT', N'대체 자재 스왑', N'Alt-Part Substitution', N'결품 오더 + 대체 가능 자재 드롭다운 선택으로 보류 해제',
REPLACE(N'┌──────────────────────┐@NL@│ ⑰ Alt-Part [✓ 반영]   │@NL@├──────────────────────┤@NL@│PO│품목│결품│수량│대체    │@NL@│01│A   │X1  │100 │▾Sub-A1 │@NL@│02│B   │X2  │ 80 │▾Sub-B2 │@NL@│03│C   │X3  │150 │▾없음   │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'자재 부족 대체', 616, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- PE_18  Heijunka Matrix 평준화 보드
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'PE_18', 'pe_heijunka_matrix', 'LAYOUT_PLANEDIT', N'Heijunka Matrix 평준화', N'Heijunka Leveling Matrix', N'작업 카드(Kanban) 드래그&드롭으로 날짜×품목 매트릭스 부하 평탄화',
REPLACE(N'┌──────────────────────┐@NL@│ ⑱ Heijunka Matrix      │@NL@├──────┬───┬───┬───┬───┤@NL@│ 품목 │Mon│Tue│Wed│Thu│@NL@│ A  │ ▣▣│ ▣ │ ▣ │ ▣ │@NL@│ B  │ ▣ │ ▣▣│ ▣ │ ▣ │@NL@│ C  │ ▣ │ ▣ │ ▣▣│ ▣ │@NL@└──────┴───┴───┴───┴───┘', N'@NL@', CHAR(10)),
1, N'생산 평준화', 617, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- PE_19  Setup Batching 셋업 최적화
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'PE_19', 'pe_setup_batching', 'LAYOUT_PLANEDIT', N'Setup Batching 최적화', N'Setup Time Batching', N'좌측 대기 오더 풀 + 우측 생성 배치 (AI 자동 그룹핑으로 셋업 시간 절감)',
REPLACE(N'┌──────────┬───────────┐@NL@│ ⑲ Setup [✨AI 그룹]   │@NL@│ 현재 셋업: 180분      │@NL@├──────────┼───────────┤@NL@│대기 Pool │Batch 1 (A) │@NL@│ [A][A][B]│Batch 2 (B) │@NL@│ [B][C][C]│Batch 3 (C) │@NL@│ [A][B]   │            │@NL@└──────────┴───────────┘', N'@NL@', CHAR(10)),
1, N'유사 스펙 배치', 618, N'system', '1970-01-01');

-- -------------------------------------------------------------
-- PE_20  Multi-Plant Transfer 거점 간 이관
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'PE_20', 'pe_multi_plant_transfer', 'LAYOUT_PLANEDIT', N'Multi-Plant Transfer', N'Multi-Plant Order Transfer', N'좌/우 공장 패널 + 중앙 이관 화살표 버튼 (부하 평준화)',
REPLACE(N'┌──────┬───┬──────────┐@NL@│ ⑳ 이관 [확정]          │@NL@├──────┼───┼──────────┤@NL@│🏭 A  │ ▶ │🏭 B        │@NL@│부하115%│   │부하 60%   │@NL@│▰▰▰▰▓│ ◀ │▰▰░░░░      │@NL@│PO-01 │   │PO-10      │@NL@│PO-02 │   │PO-11      │@NL@└──────┴───┴──────────┘', N'@NL@', CHAR(10)),
1, N'거점간 부하 평준화', 619, N'system', '1970-01-01');


-- =============================================================
-- 결과 확인
-- =============================================================
SELECT CATEGORY, COUNT(*) AS CNT
  FROM TB_IS_COMPOSER_PATTERN
 WHERE CATEGORY = 'LAYOUT_PLANEDIT'
 GROUP BY CATEGORY;

SELECT CODE, NAME, LAYOUT
  FROM TB_IS_COMPOSER_PATTERN
 WHERE CATEGORY = 'LAYOUT_PLANEDIT'
 ORDER BY SORT_ORDER;
-- =============================================================
-- T3Composer — 화면 패턴 Seed (Monitoring 카테고리) [MSSQL]
-- =============================================================
-- Version : v26.0.0 (Stage 7-mn)
-- Created : 2026-04-22
-- 내용   : SCM Plan Monitoring UI Patterns HTML 의 30개 Tab 을
--          각각 1 패턴으로 등록. CATEGORY = 'LAYOUT_MONITORING'.
--
--   MN_01 ~ MN_30 — 계획 모니터링(Monitoring) 전용 화면 패턴
--
-- 비고   : 'line1@NL@line2' 형태의 @NL@ 를 CHAR(10) 으로 치환
-- =============================================================


-- 재실행 대비 기존 MN_* 제거
DELETE FROM TB_IS_COMPOSER_PATTERN
    WHERE CODE LIKE 'MN[_]%' OR CATEGORY = 'LAYOUT_MONITORING';


INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_01', 'mn_kpi_dashboard', 'LAYOUT_MONITORING', N'통합 KPI 대시보드', N'Overall KPI Dashboard', N'생산 계획 핵심 KPI 4개 + 월간 추이 차트 + 시스템 알림 통합 대시보드',
REPLACE(N'┌──────────────────────┐@NL@│ ① KPI 대시보드 [⟳]   │@NL@├──────────────────────┤@NL@│ [K1][K2][K3][K4]     │@NL@├──────────┬───────────┤@NL@│ 📊 추이   │ 🚨 알림   │@NL@└──────────┴───────────┘', N'@NL@', CHAR(10)),
3, N'경영 KPI 모니터링', 700, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_02', 'mn_daily_work_order', 'LAYOUT_MONITORING', N'일일 생산 지시 현황', N'Daily Work Order Status', N'오늘 배포된 작업지시별 실적 진척률 실시간 테이블',
REPLACE(N'┌──────────────────────┐@NL@│ ② 일일 지시 [⬇Excel] │@NL@├──────────────────────┤@NL@│ WO│라인│품목│계획│실적│% │@NL@│ W1│L1  │A   │500 │350 │70│@NL@│ W2│L2  │B   │800 │720 │90│@NL@│ W3│L3  │C   │300 │150 │50│@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
3, N'작업지시 진척 조회', 701, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_03', 'mn_pivot_plan', 'LAYOUT_MONITORING', N'기간별 생산 계획 피벗', N'Period Plan Pivot', N'가로축=날짜, 세로축=품목 피벗 조회 + 합계 행/열',
REPLACE(N'┌──────────────────────┐@NL@│ ③ 기간별 계획 피벗     │@NL@├──────────────────────┤@NL@│ 품목│D1 │D2 │D3 │합계│@NL@│ A   │100│120│110│330│@NL@│ B   │ 80│ 75│ 90│245│@NL@│ C   │150│160│145│455│@NL@│ 합계│330│355│345│1030│@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'피벗 계획 조회', 702, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_04', 'mn_wip_flow', 'LAYOUT_MONITORING', N'공정별 재공/재고 흐름(WIP)', N'WIP Flow Funnel', N'좌측 공정별 재공 Funnel + 우측 체류 Aging 테이블',
REPLACE(N'┌──────────┬───────────┐@NL@│ ④ WIP Flow           │@NL@├──────────┼───────────┤@NL@│ Funnel   │ PO│공정│재공│@NL@│ ████ 500 │ 01│L1 │120│@NL@│ ██░░ 300 │ 02│L2 │ 80│@NL@│ █░░░ 150 │ 03│L3 │ 50│@NL@└──────────┴───────────┘', N'@NL@', CHAR(10)),
2, N'재공 흐름 추적', 703, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_05', 'mn_delay_risk', 'LAYOUT_MONITORING', N'납기 지연 위험 경보', N'Delay Risk Alert', N'상단 지연 예상 페널티 KPI + 사유별 비율 바 + 하단 상세 테이블',
REPLACE(N'┌──────────────────────┐@NL@│ ⑤ 지연 위험 [⬇리포트] │@NL@├──────────┬───────────┤@NL@│🚨 ₩145M  │사유 ▰▰▰▰  │@NL@├──────────┴───────────┤@NL@│ 위험│PO│고객│CRD│지연│@NL@│ HIGH │01│A  │11/15│+3│@NL@│ MID  │02│B  │11/20│+2│@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'납기 리스크 관제', 704, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_06', 'mn_unplanned_orders', 'LAYOUT_MONITORING', N'계획 미수립 오더', N'Unplanned Orders', N'수주 확정되었으나 스케줄 미배정 오더 리스트 + 미수립 사유',
REPLACE(N'┌──────────────────────┐@NL@│ ⑥ 미수립 오더         │@NL@├──────────────────────┤@NL@│ SO  │확정│체류│고객│수량│@NL@│SO-01│11/01│ 7일 │A  │500│@NL@│SO-02│11/05│ 3일 │B  │800│@NL@│SO-03│11/06│ 2일 │C  │200│@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'계획 사각지대 감지', 705, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_07', 'mn_material_shortage', 'LAYOUT_MONITORING', N'자재 결품 예상', N'Material Shortage', N'투입 시점 현재고·입고예정고 부족 자재 리스트 + 공급사 정보',
REPLACE(N'┌──────────────────────┐@NL@│ ⑦ 자재 결품 예상       │@NL@├──────────────────────┤@NL@│ 자재│소요│ATP │결품│공급사│@NL@│ X1  │300│200 │-100│삼성│@NL@│ X2  │500│550 │ 50 │LG  │@NL@│ X3  │200│150 │-50 │대덕│@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'자재 부족 사전 감지', 706, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_08', 'mn_bottleneck', 'LAYOUT_MONITORING', N'설비 과부하/병목', N'Equipment Bottleneck', N'상단 3개 병목 지표 카드 + 하단 설비별 일간 부하율 Heatmap',
REPLACE(N'┌──────────────────────┐@NL@│ ⑧ 병목 모니터링        │@NL@├──────┬──────┬────────┤@NL@│병목 3│OEE 65│부하평균│@NL@├──────┴──────┴────────┤@NL@│설비│D1│D2│D3│D4│D5     │@NL@│ L1│▓█│▓█│▓░│▓█│▓█     │@NL@│ L2│▒░│▒▓│█░│▓█│▓▓     │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'병목 설비 식별', 707, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_09', 'mn_plan_vs_actual', 'LAYOUT_MONITORING', N'계획 vs 실적 차이', N'Plan vs Actual Variance', N'상단 누적 달성률/차질 KPI + 하단 일자별 편차 테이블',
REPLACE(N'┌──────────────────────┐@NL@│ ⑨ Plan vs Actual     │@NL@├──────────┬───────────┤@NL@│달성 92.8%│차질-12,450│@NL@├──────────┴───────────┤@NL@│일자│라인│P  │A  │Gap │%  │@NL@│11/01│L1 │100│95 │-5 │95 │@NL@│11/02│L2 │150│140│-10│93 │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'계획-실적 갭 분석', 708, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_10', 'mn_compliance_trend', 'LAYOUT_MONITORING', N'스케줄 준수율 트렌드', N'Schedule Compliance Trend', N'좌측 12주 트렌드 바 차트 + 우측 주차별 준수율 테이블',
REPLACE(N'┌──────────┬───────────┐@NL@│ ⑩ 준수율 트렌드        │@NL@├──────────┼───────────┤@NL@│ 📊 12주  │Wk│Tot│OK│% │@NL@│ ▂▄▆▅▇▅▆ │W1│50 │47│94│@NL@│ 평균 92.4%│W2│50 │45│90│@NL@│          │W3│50 │48│96│@NL@└──────────┴───────────┘', N'@NL@', CHAR(10)),
2, N'준수율 추이 분석', 709, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_11', 'mn_line_utilization', 'LAYOUT_MONITORING', N'라인별 가동률 현황', N'Line Utilization', N'라인별 총 가용/배정/유휴 시간 + 가동률 + 비가동 내역 분석',
REPLACE(N'┌──────────────────────┐@NL@│ ⑪ 라인별 가동률        │@NL@├──────────────────────┤@NL@│ 라인│총 │배정│Idle│%  │@NL@│ L1 │480│420│ 60 │88 │@NL@│ L2 │480│390│ 90 │81 │@NL@│ L3 │480│460│ 20 │96 │@NL@│ L4 │480│300│180 │63 │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'가동률 모니터', 710, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_12', 'mn_setup_loss', 'LAYOUT_MONITORING', N'셋업/교체 시간 손실', N'Setup Loss Monitoring', N'품목 교체 비가동 손실 시간 + 교체 유형별 Loss/Gain 분석',
REPLACE(N'┌──────────────────────┐@NL@│ ⑫ 셋업 손실           │@NL@├──────────────────────┤@NL@│ 일자│라인│전→후│표준│실 │@NL@│11/01│L1 │A→B │ 30 │45 │@NL@│11/02│L2 │B→C │ 20 │15 │@NL@│11/03│L3 │A→C │ 45 │60 │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'교체 시간 손실 추적', 711, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_13', 'mn_po_tracking', 'LAYOUT_MONITORING', N'PO 상세 추적', N'PO Detail Tracking', N'상단 PO 헤더 카드 + 타임라인(공정 단계) + 하단 하위 WO 테이블',
REPLACE(N'┌──────────────────────┐@NL@│ ⑬ PO 추적             │@NL@├──────────────────────┤@NL@│ PO-2026-0994  [진행]  │@NL@│ 삼성 / 메인보드 V1     │@NL@├──────────────────────┤@NL@│ ●──●──●──○──○         │@NL@├──────────────────────┤@NL@│ WO│공정│지시│완료│%  │@NL@│ W1│SMT │500 │500│100│@NL@│ W2│ASY │500 │300│ 60│@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'PO 단계별 추적', 712, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_14', 'mn_gantt_progress', 'LAYOUT_MONITORING', N'간트 진척률', N'Gantt Progress Chart', N'간트 바 내부에 진척률(%) 채움 + 선행관계 시각화',
REPLACE(N'┌──────────────────────┐@NL@│ ⑭ Gantt 진척률         │@NL@├──────────────────────┤@NL@│WO1 ▰▰▰▰▰ 100%         │@NL@│WO2 ▰▰▰▱░  60%         │@NL@│WO3 ▰▱░░░  20%         │@NL@│WO4 ░░░░░   0%         │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
2, N'간트 % 시각화', 713, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_15', 'mn_part_explosion', 'LAYOUT_MONITORING', N'공용 부품 소요량 전개', N'Common Part Explosion', N'Sub-BOM 공용 부품 총 소요량 + 조달 LT + 사용처(Where-used)',
REPLACE(N'┌──────────────────────┐@NL@│ ⑮ 공용 부품 소요량     │@NL@├──────────────────────┤@NL@│ 부품│LT│소요│가용│사용│@NL@│ P01│ 7│500│400│A,B │@NL@│ P02│14│300│500│C,D │@NL@│ P03│ 3│200│150│A,C │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'공통 부품 집계', 714, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_16', 'mn_customer_sla', 'LAYOUT_MONITORING', N'고객사별 납기 달성률(SLA)', N'Customer Delivery SLA', N'좌측 고객사별 SLA 바 + 우측 발주 상세 테이블',
REPLACE(N'┌──────────┬───────────┐@NL@│ ⑯ 고객 SLA           │@NL@├──────────┼───────────┤@NL@│ 삼성 ▰▰▰│고객│PO│품│Req│@NL@│ 96%      │삼성│01│A │11/15│@NL@│ LG ▰▰▱  │LG  │02│B │11/17│@NL@│ 88%      │현대│03│C │11/20│@NL@│ 현대 ▰▰▰│    │  │  │    │@NL@│ 94%      │    │  │  │    │@NL@└──────────┴───────────┘', N'@NL@', CHAR(10)),
2, N'고객별 SLA 관리', 715, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_17', 'mn_subcontracting', 'LAYOUT_MONITORING', N'외주 가공 의뢰 현황', N'Subcontracting Status', N'외주 협력사별 Sub-PO 진척도 + 입고 예정일 + 품질 합격률',
REPLACE(N'┌──────────────────────┐@NL@│ ⑰ 외주 가공 현황       │@NL@├──────────────────────┤@NL@│ 협력사│Sub-PO│품목│진척│@NL@│ A테크 │S001 │Alu │80% │@NL@│ 비전  │S002 │Chip│45% │@NL@│ 성일  │S003 │Case│100%│@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'외주 진척 관제', 716, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_18', 'mn_expected_cost', 'LAYOUT_MONITORING', N'생산 비용/원가 예상', N'Expected Production Cost', N'상단 3개 KPI(총 제조원가/예산 초과/평균 이익률) + 하단 PO별 원가 상세',
REPLACE(N'┌──────────────────────┐@NL@│ ⑱ 원가 예상            │@NL@├──────┬──────┬────────┤@NL@│₩2450M│초과₩120M│이익18.4%│@NL@├──────┴──────┴────────┤@NL@│ PO│품│M  │L  │OH │합계│@NL@│ 01│A│120 │30 │ 40│190 │@NL@│ 02│B│180 │45 │ 60│285 │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'원가·이익률 추정', 717, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_19', 'mn_energy_carbon', 'LAYOUT_MONITORING', N'탄소 배출/에너지 사용', N'Energy & Carbon', N'좌측 탄소 쿼터 게이지 + 우측 Peak/Off-peak 전력 바 + 하단 설비별 소비',
REPLACE(N'┌──────────┬───────────┐@NL@│ ⑲ Energy/Carbon      │@NL@├──────────┼───────────┤@NL@│ 1,240tCO2│ Peak  60%  │@NL@│ ▰▰▰▰▱82%│ Off40%    │@NL@├──────────┴───────────┤@NL@│ 설비│시간│kWh│CO2│등급 │@NL@│ L1  │480 │2.5K│1.2│ B  │@NL@│ L2  │420 │3.1K│1.5│ C  │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'ESG 에너지 관제', 718, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_20', 'mn_labor_input', 'LAYOUT_MONITORING', N'작업자/인력 투입 계획', N'Labor Input Plan', N'라인별/조별 필요 인원 vs 배정 인원 과부족 + 스킬 매칭률',
REPLACE(N'┌──────────────────────┐@NL@│ ⑳ 인력 투입 계획       │@NL@├──────────────────────┤@NL@│ 일 │라인│조│필요│배정│Gap│@NL@│11/1│L1 │A│ 25 │ 24 │-1 │@NL@│11/1│L2 │B│ 30 │ 30 │ 0 │@NL@│11/2│L3 │A│ 20 │ 18 │-2 │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'인력 수급 관제', 719, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_21', 'mn_forecast_vs_plan', 'LAYOUT_MONITORING', N'AI 예측 vs 확정 계획', N'Forecast vs Plan', N'AI 수요 예측 vs 실제 생산 계획 편차 + AI 신뢰도 + 판정',
REPLACE(N'┌──────────────────────┐@NL@│ ㉑ AI 예측 vs 계획      │@NL@├──────────────────────┤@NL@│ SKU│FC│Plan│Gap│Conf│판 │@NL@│ A  │500│480│-20│95%│OK │@NL@│ B  │800│900│+100│88%│과 │@NL@│ C  │300│250│-50│92%│결 │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'예측-계획 편차', 720, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_22', 'mn_line_switching', 'LAYOUT_MONITORING', N'대체 라인 전환 이력', N'Line Switching History', N'원래 라인 → 대체 라인 변경 이력 + 사유 + 비용 증감',
REPLACE(N'┌──────────────────────┐@NL@│ ㉒ 라인 전환 이력       │@NL@├──────────────────────┤@NL@│ PO│원래│➔│대체│사유│비용│@NL@│ 01│L1 │➔│L2 │고장│+5% │@NL@│ 02│L3 │➔│L4 │캐파│-3% │@NL@│ 03│L2 │➔│L3 │품질│+2% │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'라인 변경 추적', 721, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_23', 'mn_yield_impact', 'LAYOUT_MONITORING', N'품질/수율 연동 영향', N'Yield Impact Analysis', N'공정별 기준 수율 vs 최근 실적 수율 + 예상 수량 손실(EA)',
REPLACE(N'┌──────────────────────┐@NL@│ ㉓ 수율 영향 분석       │@NL@├──────────────────────┤@NL@│ 공정│기준│실적│손실│원인│@NL@│ SMT│98% │95% │500 │자재│@NL@│ ASY│95% │92% │300 │설비│@NL@│ PKG│99% │99% │  0 │-   │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'수율 저하 영향', 722, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_24', 'mn_logistics_sync', 'LAYOUT_MONITORING', N'물류/출하 연동 스케줄', N'Logistics Sync', N'생산 완료 시점 vs 출하 Dock 배차/트럭 스케줄 매칭',
REPLACE(N'┌──────────────────────┐@NL@│ ㉔ 물류/출하 연동       │@NL@├──────────────────────┤@NL@│ Ship│완료│Dock│차량│적재│@NL@│ S01│11/12│D1 │T01│85% │@NL@│ S02│11/13│D2 │T02│92% │@NL@│ S03│11/14│D1 │T03│78% │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'출하 스케줄 매칭', 723, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_25', 'mn_hot_orders', 'LAYOUT_MONITORING', N'긴급 오더 처리', N'Hot Orders Countdown', N'빨간 테두리 강조 + 긴급 오더 Countdown + 진척률 실시간 모니터',
REPLACE(N'╔══════════════════════╗@NL@║ ㉕ 🚨 긴급 오더        ║@NL@╠══════════════════════╣@NL@║ PO│요청│라인│진척│남음│@NL@║H01│영업│L1 │70% │ 4h │@NL@║H02│영업│L3 │45% │ 8h │@NL@║H03│생기│L2 │20% │24h │@NL@╚══════════════════════╝', N'@NL@', CHAR(10)),
1, N'긴급 오더 관제', 724, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_26', 'mn_rework_status', 'LAYOUT_MONITORING', N'재작업(Rework) 오더', N'Rework Orders Status', N'불량으로 강제 추가된 RW 지시 진행 상태 + 예상 비용',
REPLACE(N'┌──────────────────────┐@NL@│ ㉖ 재작업 오더         │@NL@├──────────────────────┤@NL@│ RW  │공정│사유│수량│비용│@NL@│RW-01│SMT │솔더│120 │₩3M │@NL@│RW-02│ASY │접합│ 80 │₩2M │@NL@│RW-03│INS │치수│ 50 │₩1M │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'재작업 추적', 725, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_27', 'mn_safety_stock_alert', 'LAYOUT_MONITORING', N'안전재고(SS) 이탈 모니터링', N'Safety Stock Violation', N'생산 출고로 SS 하한 이탈 예정 품목 + 잔여 재고일수(DOC)',
REPLACE(N'┌──────────────────────┐@NL@│ ㉗ SS 이탈 모니터링     │@NL@├──────────────────────┤@NL@│ SKU│SS  │예상│이탈│DOC │@NL@│ A1│500 │450 │-50 │ 3일│@NL@│ B2│300 │180 │-120│ 1일│@NL@│ C3│800 │950 │+150│ 7일│@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'SS 하한 감시', 726, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_28', 'mn_tooling_mgmt', 'LAYOUT_MONITORING', N'금형/치공구 스케줄', N'Tooling Schedule', N'금형/치공구 장착 예정 라인 + 누적 타발수(Life)/한계',
REPLACE(N'┌──────────────────────┐@NL@│ ㉘ 금형 스케줄         │@NL@├──────────────────────┤@NL@│ Tool│라인│품목│Life│한계│@NL@│T-01│L1 │A  │12K │15K │@NL@│T-02│L2 │B  │ 8K │10K │@NL@│T-03│L3 │C  │14K │15K │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'금형 수명 관리', 727, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_29', 'mn_version_diff', 'LAYOUT_MONITORING', N'계획 버전별 비교', N'Plan Version Diff', N'v1.0(어제) vs v1.1(오늘) 핵심 KPI 차이 상세 분석',
REPLACE(N'┌──────────────────────┐@NL@│ ㉙ 버전 비교 v1.0↔v1.1 │@NL@├──────────────────────┤@NL@│ KPI      │v1.0 │v1.1│Δ │@NL@│ 납기 %   │92.0 │94.2│▲ │@NL@│ 재고 M   │1.2  │1.1 │▼ │@NL@│ 생산 K   │45.0 │46.5│▲ │@NL@│ 원가 M   │2.4  │2.5 │▲ │@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'계획 차이 상세', 728, N'system', '1970-01-01');

INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'MN_30', 'mn_exec_summary', 'LAYOUT_MONITORING', N'경영진 요약 리포트', N'Executive Summary Report', N'SCM Plan 재무적 성과 + 핵심 리스크 + 전략 과제 임원 보고용 대시보드',
REPLACE(N'┌──────────────────────┐@NL@│ ㉚ 경영진 요약 [⬇PDF] │@NL@├──────────────────────┤@NL@│ 요약 코멘트 SCM v1.1   │@NL@│ 납기 94.2% ▲ 비용 -₩20M│@NL@├──────────┬───────────┤@NL@│매출 14.5B│리스크 3건  │@NL@├──────────┴───────────┤@NL@│ 전략 과제 │효과│부서 │상태│@NL@│ 외주 이관 │-₩7M│SCM │진행│@NL@└──────────────────────┘', N'@NL@', CHAR(10)),
1, N'임원 보고 대시보드', 729, N'system', '1970-01-01');


-- =============================================================
-- 결과 확인
-- =============================================================
SELECT CATEGORY, COUNT(*) AS CNT
  FROM TB_IS_COMPOSER_PATTERN
 WHERE CATEGORY = 'LAYOUT_MONITORING'
 GROUP BY CATEGORY;

SELECT CODE, NAME, LAYOUT
  FROM TB_IS_COMPOSER_PATTERN
 WHERE CATEGORY = 'LAYOUT_MONITORING'
 ORDER BY SORT_ORDER;
-- =============================================================
-- T3Composer — 화면 패턴 Seed (RouteLayout 카테고리) [MSSQL]
-- =============================================================
-- Version : v26.0.0 (Stage 7-rl)
-- Created : 2026-04-22
-- 내용   : MES Factory RouteLayout UI Patterns HTML 3종을
--          각각 1 패턴으로 등록. CATEGORY = 'LAYOUT_ROUTELAYOUT'.
--
--   RL_01 Route Layout 설계       (mes_route_1_layout.html)
--   RL_02 Route Layout WIP 현황   (mes_route_3_wip_3d.html)
--   RL_03 Route Layout Simulation (mes_route_5_wip_simulation_3d.html)
-- =============================================================


-- 재실행 대비 기존 RL_* 제거
DELETE FROM TB_IS_COMPOSER_PATTERN
    WHERE CODE LIKE 'RL[_]%' OR CATEGORY = 'LAYOUT_ROUTELAYOUT';


-- -------------------------------------------------------------
-- RL_01 RouteLayout 설계 (공장/층별 설비 Layout 설계)
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'RL_01', 'rl_layout_design', 'LAYOUT_ROUTELAYOUT', N'Route Layout 설계', N'Factory Route Layout Designer', N'공장/층별 설비 Layout 설계 · 좌측 공장계층 트리 + 중앙 캔버스(Line/Storage/Equipment 드래그앤드롭·중첩·Routing Flow 선) + 우측 Palette(Lines/Storage/Equip 3탭). Grid Snap 20px, 중첩 설비 자동 배지.',
REPLACE(N'┌──────────────────────────────┐@NL@│🚀 Factory Layout [🗑][💾 저장]│@NL@├────┬─────────────────┬───────┤@NL@│트리│ 캔버스          │팔레트  │@NL@│▼창원│ W-RAW → SMT → W1 │Lines   │@NL@│ 1F*│  → ASSY → PKG → │Storage │@NL@│ 2F │  →→→ W-FG       │ Equip  │@NL@│▼평택│ ━━━━━━━━━━━     │━━━━━━━ │@NL@│ 1F │ W-TOOL CNC × 4   │🟦 라인 │@NL@│    │ (stack 배지 4) │🏭 창고 │@NL@│    │ W-WIP2 INSP    │⚙ 설비  │@NL@└────┴─────────────────┴───────┘', N'@NL@', CHAR(10)),
3, N'공장 Layout 설계,설비 배치', 800, N'system', '1970-01-01');


-- -------------------------------------------------------------
-- RL_02 RouteLayout WIP 현황
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'RL_02', 'rl_layout_wip', 'LAYOUT_ROUTELAYOUT', N'Route Layout WIP 현황', N'Factory Layout WIP Monitor', N'설비 Layout 상 실시간 WIP 현황 조회 · 설비별 LED(녹:RUN/황:WAIT/적:ERR) + 병목 배지(⚠️ 대기 Nn건) + 우측 WIP 리스트 패널(총/진행/대기/완료 KPI + WO 상세 리스트) + 하단 타임라인 재생.',
REPLACE(N'┌──────────────────────────────┐@NL@│⏱ WIP Monitor  [●Run][●Wait][⚠]│@NL@├────┬─────────────────┬───────┤@NL@│트리│ 🟢SMT 🟢ASSY 🟢PKG│ WIP    │@NL@│ 1F*│ ↘→↘━━━━━━━━━━↘  │Tot 45  │@NL@│    │ 🟡CNC(⚠대기5건)  │Run 12  │@NL@│    │ 🔴 병목!         │Wait 8  │@NL@│    │ 🟢WIP1 🟢WIP2   │Done 25 │@NL@│    │                  │──WO── │@NL@│    │ W-RWK W-FG      │WO-0001 │@NL@├────┴─────────────────┴───────┤@NL@│▶ Day1──Day2──Day3 08:00      │@NL@└──────────────────────────────┘', N'@NL@', CHAR(10)),
3, N'실시간 WIP 모니터링', 801, N'system', '1970-01-01');


-- -------------------------------------------------------------
-- RL_03 RouteLayout Simulation
-- -------------------------------------------------------------
INSERT INTO TB_IS_COMPOSER_PATTERN (ID, CODE, LAYOUT, CATEGORY, NAME, NAME_EN, DESCRIPTION, VISUAL, FREQUENCY, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'RL_03', 'rl_layout_simulation', 'LAYOUT_ROUTELAYOUT', N'Route Layout Simulation', N'Factory Simulation Timeline 3D', N'Simulation 수행으로 Timeline별 설비별 작업현황 조회 · 72시간 시뮬레이션 재생 슬라이더 + 설비 Hover 시 3D 모델 툴팁(Mounter/CNC 등) + WO 상세 리스트 + 실시간 LED/병목 동기화.',
REPLACE(N'┌──────────────────────────────┐@NL@│⏱ Simulation 3D [▶Play]       │@NL@├────┬─────────────────┬───────┤@NL@│트리│ 🟢 🟡 🔴 🟢    │WIP KPI │@NL@│시뮬│ ┌─[3D Tooltip]─┐│🏭 1F   │@NL@│조건│ │ 🔍 Mounter   ││Tot 38  │@NL@│ 🔍 │ │ WO-2604-0012 ││Run 10  │@NL@│Run │ │ 85% ▰▰▰▰░   ││Wait 6  │@NL@│    │ └───────────┘   ││Err 2   │@NL@│    │ 🟢SMT 🟡CNC×4   │WO list │@NL@├────┴─────────────────┴───────┤@NL@│⏸ ─●────────── 2026-04-15 08:00│@NL@│  Day1   Day2   Day3   End(72h)│@NL@└──────────────────────────────┘', N'@NL@', CHAR(10)),
2, N'시뮬레이션 Timeline 관제', 802, N'system', '1970-01-01');


-- =============================================================
-- 결과 확인
-- =============================================================
SELECT CATEGORY, COUNT(*) AS CNT
  FROM TB_IS_COMPOSER_PATTERN
 WHERE CATEGORY = 'LAYOUT_ROUTELAYOUT'
 GROUP BY CATEGORY;

SELECT CODE, NAME, LAYOUT
  FROM TB_IS_COMPOSER_PATTERN
 WHERE CATEGORY = 'LAYOUT_ROUTELAYOUT'
 ORDER BY SORT_ORDER;

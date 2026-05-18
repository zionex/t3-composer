-- =============================================================
-- T3Composer Dictionary — 테이블 DDL (3종) [MSSQL]
-- =============================================================
-- Version : v26.0.0 (Stage 8-dict)
-- Created : 2026-04-22
-- 내용   :
--   TB_IS_COMPOSER_GRID_TYPE   — Grid 유형 사전
--   TB_IS_COMPOSER_CHART_TYPE  — Chart 유형 사전
--   TB_IS_COMPOSER_KPI_DICT    — KPI 사전
-- =============================================================


-- -------------------------------------------------------------
-- 1) TB_IS_COMPOSER_GRID_TYPE
-- -------------------------------------------------------------
    DROP TABLE IF EXISTS dbo.TB_IS_COMPOSER_GRID_TYPE;

CREATE TABLE IF NOT EXISTS dbo.TB_IS_COMPOSER_GRID_TYPE (
    ID               VARCHAR(32)   NOT NULL,
    CODE             VARCHAR(30)   NOT NULL,
    CATEGORY         VARCHAR(40)   NULL,             -- BASIC | ADVANCED | EDIT | TREE | PIVOT | SPECIAL
    NAME             varchar(200) NOT NULL,
    NAME_EN          varchar(200) NULL,
    DESCRIPTION      text NULL,
    LAYOUT_KEY       VARCHAR(80)   NULL,             -- 미리보기 렌더러 키
    COMPONENT_STACK  varchar(500) NULL,             -- 사용 컴포넌트 (RealGrid2/TreeGrid/PivotTable 등)
    PROPERTIES       text NULL,             -- JSON 설정 (편집/체크/고정컬럼 등 flag)
    SAMPLE_COLUMNS   text NULL,             -- JSON : [{name,header,dataType,width,visible}, ...]
    SAMPLE_ROWS      text NULL,             -- JSON : [[...], [...], ...]
    RECOMMENDED_FOR  varchar(500) NULL,
    SORT_ORDER       INT           DEFAULT 0 NULL,
    USE_YN           CHAR(1)       DEFAULT 'Y' NULL,
    CREATE_BY        varchar(100) NULL,
    CREATE_DTTM      timestamp      DEFAULT now() NULL,
    MODIFY_BY        varchar(100) NULL,
    MODIFY_DTTM      timestamp      NULL,
    CONSTRAINT PK_TB_IS_COMPOSER_GRID_TYPE PRIMARY KEY (ID),
    CONSTRAINT UQ_TB_IS_COMPOSER_GRID_TYPE UNIQUE (CODE)
);

CREATE INDEX IF NOT EXISTS IX_TB_IS_COMPOSER_GRID_TYPE_CAT ON dbo.TB_IS_COMPOSER_GRID_TYPE (CATEGORY);
-- EXEC sys.sp_addextendedproperty @name = 'MS_Description',
--     @value = 'T3Composer Grid 유형 사전 (RealGrid2/TreeGrid/PivotTable 등 Grid 변형)',
--     @level0type = 'Schema', @level0name = 'dbo',
--     @level1type = 'Table',  @level1name = 'TB_IS_COMPOSER_GRID_TYPE';


-- -------------------------------------------------------------
-- 2) TB_IS_COMPOSER_CHART_TYPE
-- -------------------------------------------------------------
    DROP TABLE IF EXISTS dbo.TB_IS_COMPOSER_CHART_TYPE;

CREATE TABLE IF NOT EXISTS dbo.TB_IS_COMPOSER_CHART_TYPE (
    ID               VARCHAR(32)   NOT NULL,
    CODE             VARCHAR(30)   NOT NULL,
    CATEGORY         VARCHAR(40)   NULL,             -- BAR | LINE | AREA | PIE | RADAR | SCATTER | COMBO | SCALE
    NAME             varchar(200) NOT NULL,
    NAME_EN          varchar(200) NULL,
    DESCRIPTION      text NULL,
    CHART_TYPE       VARCHAR(30)   NOT NULL,          -- Chart.js type (bar/line/pie/radar/...)
    OPTIONS_JSON     text NULL,              -- Chart.js options JSON
    SAMPLE_DATA      text NULL,              -- { labels: [...], datasets: [{...}] }
    PREVIEW_COLOR    VARCHAR(20)   NULL,
    COMPONENT_STACK  varchar(500) NULL,              -- ChartComponent / react-chartjs-2 / EqualizerBarChart / GanttChart
    RECOMMENDED_FOR  varchar(500) NULL,
    SORT_ORDER       INT           DEFAULT 0 NULL,
    USE_YN           CHAR(1)       DEFAULT 'Y' NULL,
    CREATE_BY        varchar(100) NULL,
    CREATE_DTTM      timestamp      DEFAULT now() NULL,
    MODIFY_BY        varchar(100) NULL,
    MODIFY_DTTM      timestamp      NULL,
    CONSTRAINT PK_TB_IS_COMPOSER_CHART_TYPE PRIMARY KEY (ID),
    CONSTRAINT UQ_TB_IS_COMPOSER_CHART_TYPE UNIQUE (CODE)
);

CREATE INDEX IF NOT EXISTS IX_TB_IS_COMPOSER_CHART_TYPE_CAT ON dbo.TB_IS_COMPOSER_CHART_TYPE (CATEGORY);
-- EXEC sys.sp_addextendedproperty @name = 'MS_Description',
--     @value = 'T3Composer Chart 유형 사전 (Chart.js 기반 60+ 변형)',
--     @level0type = 'Schema', @level0name = 'dbo',
--     @level1type = 'Table',  @level1name = 'TB_IS_COMPOSER_CHART_TYPE';


-- -------------------------------------------------------------
-- 3) TB_IS_COMPOSER_KPI_DICT
-- -------------------------------------------------------------
    DROP TABLE IF EXISTS dbo.TB_IS_COMPOSER_KPI_DICT;

CREATE TABLE IF NOT EXISTS dbo.TB_IS_COMPOSER_KPI_DICT (
    ID               VARCHAR(32)   NOT NULL,
    CODE             VARCHAR(30)   NOT NULL,
    CATEGORY_CD      VARCHAR(40)   NULL,             -- SALES | PROD | INV | PUR | FIN
    CATEGORY_NAME    varchar(100) NULL,             -- '1. 영업/수요' 등
    NAME             varchar(200) NOT NULL,         -- 한글 지표명
    NAME_EN          varchar(200) NULL,
    IS_MAIN          CHAR(1)       DEFAULT '' NULL, -- Y: 주요지표, N: 서브
    DEPARTMENT       varchar(100) NULL,             -- 담당 부서
    FREQUENCY        varchar(50)  NULL,             -- 집계 주기
    DESCRIPTION      text NULL,
    FORMULA          text NULL,             -- 산출 공식
    CHART1_TYPE      VARCHAR(30)   NULL,             -- line/bar/...
    CHART1_LABEL     varchar(200) NULL,
    CHART1_DATA      text NULL,             -- JSON array
    CHART2_TYPE      VARCHAR(30)   NULL,
    CHART2_LABEL     varchar(500) NULL,
    CHART2_DATA      text NULL,
    CHART2_UNIT      VARCHAR(20)   NULL,
    TARGET_VALUE     varchar(100) NULL,
    IS_REVERSE_GAP   CHAR(1)       DEFAULT '' NULL, -- Y: 낮을수록 좋음
    SORT_ORDER       INT           DEFAULT 0 NULL,
    USE_YN           CHAR(1)       DEFAULT 'Y' NULL,
    CREATE_BY        varchar(100) NULL,
    CREATE_DTTM      timestamp      DEFAULT now() NULL,
    MODIFY_BY        varchar(100) NULL,
    MODIFY_DTTM      timestamp      NULL,
    CONSTRAINT PK_TB_IS_COMPOSER_KPI_DICT PRIMARY KEY (ID),
    CONSTRAINT UQ_TB_IS_COMPOSER_KPI_DICT UNIQUE (CODE)
);

CREATE INDEX IF NOT EXISTS IX_TB_IS_COMPOSER_KPI_DICT_CAT ON dbo.TB_IS_COMPOSER_KPI_DICT (CATEGORY_CD);
-- EXEC sys.sp_addextendedproperty @name = 'MS_Description',
--     @value = 'T3Composer S&OP KPI 사전 (40 KPI × 5 카테고리)',
--     @level0type = 'Schema', @level0name = 'dbo',
--     @level1type = 'Table',  @level1name = 'TB_IS_COMPOSER_KPI_DICT';


-- -------------------------------------------------------------
-- 메뉴 + 다국어 (UI_UT_COMPOSER_DICT)
-- -------------------------------------------------------------

DELETE FROM TB_AD_MENU_BADGE
    WHERE MENU_ID IN (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'UI_UT_COMPOSER_DICT');
DELETE FROM TB_AD_MENU_BOOKMARK
    WHERE MENU_ID IN (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'UI_UT_COMPOSER_DICT');
DELETE FROM TB_AD_MANUAL WHERE MENU_CD = 'UI_UT_COMPOSER_DICT';
DELETE FROM TB_AD_MENU   WHERE MENU_CD = 'UI_UT_COMPOSER_DICT';

INSERT INTO TB_AD_MENU (ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, USE_YN, CREATE_BY, CREATE_DTTM, MENU_FILE_PATH)
SELECT
    REPLACE(gen_random_uuid()::text, '-', ''),
    ID,
    'UI_UT_COMPOSER_DICT',
    '/util/t3composerdict',
    4,
    'Y', 'system', '1970-01-01'::date,
    '/util/T3ComposerDict'
FROM TB_AD_MENU WHERE MENU_CD = 'MENU_UT_T3COMPOSER';

DELETE FROM TB_AD_LANG_PACK WHERE LANG_KEY = 'UI_UT_COMPOSER_DICT';
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM) VALUES
('ko', 'UI_UT_COMPOSER_DICT', 'Composer 갤러리',      'system', now()),
('en', 'UI_UT_COMPOSER_DICT', 'Composer Gallery',     'system', now()),
('ja', 'UI_UT_COMPOSER_DICT', 'コンポーザーギャラリー', 'system', now()),
('zh', 'UI_UT_COMPOSER_DICT', '生成器画廊',            'system', now());


-- 결과 확인
SELECT 'GRID_TYPE' T, COUNT(*) CNT FROM TB_IS_COMPOSER_GRID_TYPE
UNION ALL SELECT 'CHART_TYPE', COUNT(*) FROM TB_IS_COMPOSER_CHART_TYPE
UNION ALL SELECT 'KPI_DICT',   COUNT(*) FROM TB_IS_COMPOSER_KPI_DICT;
-- =============================================================
-- T3Composer Dictionary — Grid Type Seed [MSSQL]
-- =============================================================
-- Stack : RealGrid2 (BaseGrid), TreeGrid, PivotTable, MUI Table
-- =============================================================

DELETE FROM TB_IS_COMPOSER_GRID_TYPE;

-- BASIC
INSERT INTO TB_IS_COMPOSER_GRID_TYPE (ID, CODE, CATEGORY, NAME, NAME_EN, DESCRIPTION, LAYOUT_KEY, COMPONENT_STACK, PROPERTIES, SAMPLE_COLUMNS, SAMPLE_ROWS, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(gen_random_uuid()::text,'-',''), 'G01', 'BASIC', '기본 그리드', 'Basic Grid', '가장 일반적인 단일 그리드. 조회·정렬·열 리사이즈 기본 제공.', 'grid_basic', 'BaseGrid (RealGrid2)',
 '{"sortable":true,"resizable":true,"selectable":true}',
 '[{"name":"CODE","header":"코드","dataType":"text","width":80},{"name":"NAME","header":"명칭","dataType":"text","width":160},{"name":"QTY","header":"수량","dataType":"number","width":80},{"name":"STATUS","header":"상태","dataType":"text","width":80}]',
 '[["A001","품목 A",100,"정상"],["A002","품목 B",80,"대기"],["A003","품목 C",150,"정상"],["A004","품목 D",45,"완료"]]',
 '기본 CRUD, 마스터 조회', 10, 'system', now()),

(REPLACE(gen_random_uuid()::text,'-',''), 'G02', 'BASIC', '체크박스 그리드', 'Grid with Checkbox', '다중 선택 가능한 체크박스 컬럼 제공. 일괄 처리에 사용.', 'grid_checkbox', 'BaseGrid + CheckColumn',
 '{"checkable":true,"checkAll":true,"multiSelect":true}',
 '[{"name":"CHK","header":"","dataType":"check","width":30},{"name":"CODE","header":"코드","dataType":"text","width":80},{"name":"NAME","header":"명칭","dataType":"text","width":160},{"name":"PRICE","header":"단가","dataType":"number","width":100}]',
 '[[true,"A001","품목 A",12000],[false,"A002","품목 B",8500],[true,"A003","품목 C",15000]]',
 '다중 선택·일괄 삭제', 20, 'system', now()),

(REPLACE(gen_random_uuid()::text,'-',''), 'G03', 'BASIC', '합계 행 그리드', 'Grid with Footer Sum', '하단 고정 합계 행. 숫자 컬럼 자동 집계.', 'grid_footer_sum', 'BaseGrid + FooterRow',
 '{"footer":true,"footerAgg":["sum","avg"]}',
 '[{"name":"ITEM","header":"품목","dataType":"text","width":120},{"name":"QTY","header":"수량","dataType":"number","width":80},{"name":"AMT","header":"금액","dataType":"number","width":120}]',
 '[["품목 A",100,1200000],["품목 B",80,680000],["품목 C",150,2250000],["합계",330,4130000]]',
 '회계·금액 리포트', 30, 'system', now()),

(REPLACE(gen_random_uuid()::text,'-',''), 'G04', 'BASIC', '행번호 그리드', 'Grid with Row Number', '좌측 자동 행번호(RowNum) 표시.', 'grid_rownum', 'BaseGrid + RowNumColumn',
 '{"rowNumber":true}',
 '[{"name":"NO","header":"No","dataType":"number","width":40},{"name":"CODE","header":"코드","dataType":"text","width":80},{"name":"NAME","header":"명칭","dataType":"text","width":160}]',
 '[[1,"A001","품목 A"],[2,"A002","품목 B"],[3,"A003","품목 C"],[4,"A004","품목 D"]]',
 '순번 강조 리스트', 40, 'system', now()),

-- ADVANCED
(REPLACE(gen_random_uuid()::text,'-',''), 'G05', 'ADVANCED', '고정 컬럼 그리드', 'Grid with Fixed Column', '좌측 N개 컬럼 고정(Freeze). 가로 스크롤 시 고정.', 'grid_fixed_col', 'BaseGrid + fixedOptions',
 '{"fixedColumnCount":2}',
 '[{"name":"CODE","header":"코드","dataType":"text","width":80,"fixed":true},{"name":"NAME","header":"명칭","dataType":"text","width":140,"fixed":true},{"name":"M1","header":"1월","dataType":"number","width":80},{"name":"M2","header":"2월","dataType":"number","width":80},{"name":"M3","header":"3월","dataType":"number","width":80}]',
 '[["A001","품목 A",100,120,110],["A002","품목 B",80,75,90],["A003","품목 C",150,160,145]]',
 '월별·연별 시계열 리포트', 50, 'system', now()),

(REPLACE(gen_random_uuid()::text,'-',''), 'G06', 'ADVANCED', '그룹 헤더 그리드', 'Grid with Grouping Header', '여러 컬럼을 상위 그룹 헤더로 묶어 표시.', 'grid_grouping', 'BaseGrid + columnGroup',
 '{"groupHeader":true}',
 '[{"name":"ITEM","header":"품목","width":120},{"group":"1분기","children":[{"name":"Q1M1","header":"1월","width":60},{"name":"Q1M2","header":"2월","width":60},{"name":"Q1M3","header":"3월","width":60}]},{"group":"2분기","children":[{"name":"Q2M1","header":"4월","width":60},{"name":"Q2M2","header":"5월","width":60}]}]',
 '[["품목 A",100,120,110,130,105],["품목 B",80,75,90,85,88]]',
 '계획 리포트·복합 헤더', 60, 'system', now()),

(REPLACE(gen_random_uuid()::text,'-',''), 'G07', 'ADVANCED', '필터 로우 그리드', 'Grid with Filter Row', '컬럼 헤더 바로 아래 인라인 필터 입력 행.', 'grid_filter_row', 'BaseGrid + filterRow',
 '{"filterRow":true,"perColumnFilter":true}',
 '[{"name":"CODE","header":"코드","width":80,"filter":"text"},{"name":"NAME","header":"명칭","width":160,"filter":"text"},{"name":"QTY","header":"수량","width":80,"filter":"range"}]',
 '[["A001","품목 A",100],["A002","품목 B",80],["A003","품목 C",150],["A004","품목 D",45]]',
 '대용량 검색·필터', 70, 'system', now()),

(REPLACE(gen_random_uuid()::text,'-',''), 'G08', 'ADVANCED', '페이지네이션 그리드', 'Grid with Pagination', '서버/클라이언트 페이지네이션.', 'grid_pagination', 'BaseGrid + Pagination',
 '{"paging":true,"pageSize":20}',
 '[{"name":"CODE","header":"코드","width":80},{"name":"NAME","header":"명칭","width":160},{"name":"DT","header":"등록일","width":110}]',
 '[["A001","품목 A","2024-01-01"],["A002","품목 B","2024-01-02"],["A003","품목 C","2024-01-03"]]',
 '대용량 리스트·게시판형', 80, 'system', now()),

(REPLACE(gen_random_uuid()::text,'-',''), 'G09', 'ADVANCED', '셀 병합 그리드', 'Grid with Cell Merge', '같은 값 연속 셀 자동 병합(rowSpan).', 'grid_cell_merge', 'BaseGrid + cellMerge',
 '{"cellMerge":true,"mergeColumns":["DEPT","CATEGORY"]}',
 '[{"name":"DEPT","header":"부서","width":100},{"name":"CATEGORY","header":"분류","width":100},{"name":"ITEM","header":"품목","width":160}]',
 '[["생산","A군","품목 A"],["생산","A군","품목 B"],["생산","B군","품목 C"],["품질","A군","품목 D"]]',
 '계층적 리포트', 90, 'system', now()),

-- EDIT
(REPLACE(gen_random_uuid()::text,'-',''), 'G10', 'EDIT', '인라인 편집 그리드', 'Inline Editable Grid', '셀 더블클릭으로 즉시 편집. 편집 셀 하이라이트.', 'grid_inline_edit', 'BaseGrid + editable',
 '{"editable":true,"editOn":"dblclick","dirtyTracking":true}',
 '[{"name":"CODE","header":"코드","width":80},{"name":"NAME","header":"명칭","width":160,"editable":true},{"name":"QTY","header":"수량","width":80,"editable":true},{"name":"USE_YN","header":"사용","width":60,"editor":"check"}]',
 '[["A001","품목 A",100,true],["A002","품목 B",80,true],["A003","품목 C",150,false]]',
 '마스터 CRUD 화면', 100, 'system', now()),

(REPLACE(gen_random_uuid()::text,'-',''), 'G11', 'EDIT', '드롭다운 편집 그리드', 'Dropdown Edit Grid', '셀 내부에 드롭다운(select) 에디터.', 'grid_dropdown_edit', 'BaseGrid + dropDownEditor',
 '{"dropDownColumn":true}',
 '[{"name":"ITEM","header":"품목","width":140},{"name":"STATUS","header":"상태","width":100,"editor":"dropdown","values":["대기","진행","완료"]},{"name":"OWNER","header":"담당자","width":100,"editor":"dropdown"}]',
 '[["품목 A","진행","김철수"],["품목 B","대기","이영희"],["품목 C","완료","박민준"]]',
 '상태·담당자 선택 편집', 110, 'system', now()),

(REPLACE(gen_random_uuid()::text,'-',''), 'G12', 'EDIT', '행 드래그 그리드', 'Row Drag & Drop Grid', '행 순서 드래그 앤 드롭 변경.', 'grid_row_drag', 'BaseGrid + rowDrag',
 '{"rowDrag":true,"dragHandle":true}',
 '[{"name":"SEQ","header":"순번","width":40},{"name":"ITEM","header":"항목","width":180},{"name":"PRIORITY","header":"우선순위","width":80}]',
 '[[1,"작업 A","HIGH"],[2,"작업 B","MID"],[3,"작업 C","LOW"]]',
 '우선순위·랭킹 편집', 120, 'system', now()),

-- TREE
(REPLACE(gen_random_uuid()::text,'-',''), 'G13', 'TREE', '트리 그리드', 'Tree Grid (Hierarchical)', '계층 데이터 트리 전개. 부모-자식 노드 표시.', 'grid_tree', 'TreeGrid',
 '{"hierarchical":true,"expandLevel":2}',
 '[{"name":"NODE","header":"노드","width":240,"treeColumn":true},{"name":"TYPE","header":"유형","width":80},{"name":"COUNT","header":"건수","width":80}]',
 '[["▼ 공장A","GROUP",150],["  ▼ 라인 1","LINE",60],["    · 설비 A1","EQP",20],["    · 설비 A2","EQP",40],["  ▶ 라인 2","LINE",50],["▶ 공장B","GROUP",80]]',
 'BOM·메뉴·조직도', 130, 'system', now()),

(REPLACE(gen_random_uuid()::text,'-',''), 'G14', 'TREE', '체크 가능 트리', 'Checkable TreeGrid', '계층 노드별 체크박스 선택 (자동 부모/자식 연동).', 'grid_tree_check', 'TreeGrid + checkable',
 '{"hierarchical":true,"checkable":true,"cascadeCheck":true}',
 '[{"name":"CHK","header":"","dataType":"check","width":30},{"name":"NODE","header":"노드","width":240,"treeColumn":true},{"name":"ROLE","header":"권한","width":100}]',
 '[[true,"▼ 사용자 그룹","-"],[true,"  · 김철수","ADMIN"],[false,"  · 이영희","USER"],[true,"▶ 외부 파트너","-"]]',
 '권한·트리 선택', 140, 'system', now()),

-- PIVOT
(REPLACE(gen_random_uuid()::text,'-',''), 'G15', 'PIVOT', '크로스탭 피벗', 'Pivot Table (D/M/P/V)', 'Dimension/Measure/Pivot/Value 4가지 컬럼 타입으로 구성되는 피벗.', 'grid_pivot', 'PivotTable',
 '{"columnTypes":["D","M","P","V"]}',
 '[{"type":"D","name":"REGION","header":"지역","width":80},{"type":"D","name":"ITEM","header":"품목","width":120},{"type":"M","name":"MEASURE","header":"지표","width":80},{"type":"P","name":"DATE_","header":"기간 (피벗)"},{"type":"V","name":"VALUE","header":"값","width":80}]',
 '[["서울","A","계획","2024-01",100],["서울","A","계획","2024-02",120],["서울","A","실적","2024-01",95],["부산","B","계획","2024-01",80]]',
 '다차원 분석', 150, 'system', now()),

(REPLACE(gen_random_uuid()::text,'-',''), 'G16', 'PIVOT', '시간 버킷 피벗', 'Time-Bucket Pivot', 'iteration 으로 날짜 컬럼 동적 생성. DP/MP/RP 에 가장 많이 사용.', 'grid_time_pivot', 'BaseGrid + iteration columns',
 '{"iteration":{"prefix":"DATE_","delimiter":"-"}}',
 '[{"name":"ITEM","header":"품목","width":120},{"name":"MEASURE","header":"지표","width":80},{"iteration":{"prefix":"DATE_"},"header":"{idx}","width":70}]',
 '[["품목 A","계획","100","120","110","130"],["품목 A","실적","95","115","105","125"],["품목 B","계획","80","75","90","85"]]',
 'DP 월별·주별 입력', 160, 'system', now()),

-- SPECIAL
(REPLACE(gen_random_uuid()::text,'-',''), 'G17', 'SPECIAL', '엑셀 업로드/다운로드', 'Excel Import/Export Grid', '엑셀 템플릿 업로드·다운로드 통합 그리드.', 'grid_excel', 'BaseGrid + GridExcelExportButton + GridExcelImportButton',
 '{"excelExport":true,"excelImport":true,"template":true}',
 '[{"name":"CODE","header":"코드","width":80},{"name":"NAME","header":"명칭","width":160},{"name":"QTY","header":"수량","width":80}]',
 '[["A001","품목 A",100],["A002","품목 B",80],["A003","품목 C",150]]',
 '대량 데이터 입력', 170, 'system', now()),

(REPLACE(gen_random_uuid()::text,'-',''), 'G18', 'SPECIAL', '드릴다운 그리드', 'Drill-Down Grid', '상위 그리드 행 클릭 → 하위 그리드 필터 조회 연동.', 'grid_drilldown', 'BaseGrid × 2 (Master/Detail)',
 '{"drillDown":true,"linkKey":"PARENT_CD"}',
 '[{"name":"GROUP_CD","header":"그룹","width":100},{"name":"SUM_QTY","header":"합계","width":100},{"name":"CNT","header":"건수","width":80}]',
 '[["A군",330,3],["B군",200,2],["C군",450,5]]',
 '계층 드릴다운 리포트', 180, 'system', now()),

(REPLACE(gen_random_uuid()::text,'-',''), 'G19', 'SPECIAL', '상태 배지 그리드', 'Badge/Chip Rendering Grid', '셀 값에 따라 색상 배지(Chip) 렌더링.', 'grid_badge', 'BaseGrid + cellRenderer',
 '{"cellRenderer":{"STATUS":"badge","PRIORITY":"chip"}}',
 '[{"name":"PO","header":"PO","width":100},{"name":"STATUS","header":"상태","width":100},{"name":"PRIORITY","header":"우선순위","width":100}]',
 '[["PO-001","진행","HIGH"],["PO-002","완료","MID"],["PO-003","지연","HIGH"]]',
 '상태·등급 리스트', 190, 'system', now()),

(REPLACE(gen_random_uuid()::text,'-',''), 'G20', 'SPECIAL', '진행률 바 그리드', 'Progress-Bar Cell Grid', '셀 내부 진행률 바 렌더링 (%).', 'grid_progress', 'BaseGrid + progressRenderer',
 '{"cellRenderer":{"RATE":"progress"}}',
 '[{"name":"TASK","header":"작업","width":180},{"name":"RATE","header":"진척","width":180,"render":"progress"},{"name":"STATUS","header":"상태","width":80}]',
 '[["SMT 조립",85,"진행"],["PCB 검사",100,"완료"],["포장",45,"진행"]]',
 'WIP·작업 진척 모니터', 200, 'system', now());


SELECT COUNT(*) AS GRID_COUNT, CATEGORY FROM TB_IS_COMPOSER_GRID_TYPE GROUP BY CATEGORY ORDER BY CATEGORY;
-- =============================================================
-- T3Composer Dictionary — Chart Type Seed [MSSQL]
-- =============================================================
-- Stack : Chart.js / react-chartjs-2 / ChartComponent
--   8 카테고리 × 다양한 변형 = 54 종
-- =============================================================

DELETE FROM TB_IS_COMPOSER_CHART_TYPE;

-- 샘플 레이블
-- DECLARE @LBL text = '["1월","2월","3월","4월","5월","6월"]';
-- DECLARE @STACK varchar(500) = 'ChartComponent (Chart.js)';

-- ======================================================================
-- 1. BAR (10 variations)
-- ======================================================================
INSERT INTO TB_IS_COMPOSER_CHART_TYPE (ID, CODE, CATEGORY, NAME, NAME_EN, DESCRIPTION, CHART_TYPE, OPTIONS_JSON, SAMPLE_DATA, PREVIEW_COLOR, COMPONENT_STACK, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(gen_random_uuid()::text,'-',''), 'C01', 'BAR', '기본 수직 막대', 'Vertical Bar', '가장 기본적인 세로형 막대 차트.', 'bar', '{}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[35,42,28,50,45,38],"backgroundColor":"#4d9fff"}]}', '#4d9fff', 'ChartComponent (Chart.js)', '일반 범주 비교', 10, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C02', 'BAR', '기본 수평 막대', 'Horizontal Bar', 'indexAxis: ''y'' 를 사용한 가로형.', 'bar', '{"indexAxis":"y"}', '{"labels":["A","B","C","D","E","F"],"datasets":[{"label":"값","data":[25,48,36,42,30,55],"backgroundColor":"#00d68f"}]}', '#00d68f', 'ChartComponent (Chart.js)', '긴 라벨·순위 비교', 20, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C03', 'BAR', '그룹형 막대', 'Grouped Bar', '다중 데이터셋을 나란히 배치.', 'bar', '{}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"계획","data":[30,35,28,40,45,42],"backgroundColor":"#4d9fff"},{"label":"실적","data":[28,32,30,38,42,44],"backgroundColor":"#00d68f"}]}', '#4d9fff', 'ChartComponent (Chart.js)', '계획 vs 실적', 30, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C04', 'BAR', '누적 수직 막대', 'Stacked Vertical Bar', 'x/y 축 stacked: true.', 'bar', '{"scales":{"x":{"stacked":true},"y":{"stacked":true}}}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[15,22,18,25,28,24],"backgroundColor":"#4d9fff"},{"label":"B","data":[12,18,15,22,20,26],"backgroundColor":"#ffb347"},{"label":"C","data":[8,14,10,18,16,14],"backgroundColor":"#ff4d6d"}]}', '#ffb347', 'ChartComponent (Chart.js)', '구성 비교·누적 집계', 40, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C05', 'BAR', '누적 수평 막대', 'Stacked Horizontal Bar', '가로 누적 막대.', 'bar', '{"indexAxis":"y","scales":{"x":{"stacked":true},"y":{"stacked":true}}}', '{"labels":["Q1","Q2","Q3","Q4"],"datasets":[{"label":"계획","data":[100,120,135,110],"backgroundColor":"#4d9fff"},{"label":"실적","data":[95,118,130,115],"backgroundColor":"#00d68f"}]}', '#00d68f', 'ChartComponent (Chart.js)', '분기별 누적 비교', 50, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C06', 'BAR', '둥근 모서리 막대', 'Rounded Bar', 'borderRadius 로 막대 끝 둥글게.', 'bar', '{}', '{"labels":["A","B","C","D","E","F"],"datasets":[{"label":"값","data":[35,42,28,50,45,38],"backgroundColor":"#9d72ff","borderRadius":20}]}', '#9d72ff', 'ChartComponent (Chart.js)', '모던 UI·세련', 60, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C07', 'BAR', '플로팅 막대', 'Floating Bar', '시작/끝 값을 배열로 지정 (범위 차트).', 'bar', '{}', '{"labels":["A","B","C","D","E"],"datasets":[{"label":"범위","data":[[10,40],[20,55],[15,50],[25,45],[30,60]],"backgroundColor":"#ff4d6d","borderRadius":5}]}', '#ff4d6d', 'ChartComponent (Chart.js)', '범위·온도 차트', 70, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C08', 'BAR', '다중 색상 막대', 'Multi-color Bar', '단일 데이터셋에 배열 색상 적용.', 'bar', '{}', '{"labels":["A","B","C","D","E","F"],"datasets":[{"label":"값","data":[35,42,28,50,45,38],"backgroundColor":["#4d9fff","#00d68f","#ffb347","#ff4d6d","#9d72ff","#00e5ff"]}]}', '#4d9fff', 'ChartComponent (Chart.js)', '카테고리 컬러 강조', 80, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C09', 'BAR', '두께 고정 막대', 'Thin Bar', 'barThickness 로 픽셀 고정.', 'bar', '{}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"값","data":[35,42,28,50,45,38],"backgroundColor":"#00d68f","barThickness":10}]}', '#00d68f', 'ChartComponent (Chart.js)', '미니멀·얇은 막대', 90, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C10', 'BAR', '베이스라인 막대', 'Offset Base Bar', '0이 아닌 기준선(base) 설정.', 'bar', '{}', '{"labels":["A","B","C","D","E"],"datasets":[{"label":"편차","data":[-10,5,-5,15,8],"backgroundColor":"#4d9fff","base":0}]}', '#4d9fff', 'ChartComponent (Chart.js)', '편차·증감 차트', 100, 'system', now()),

-- ======================================================================
-- 2. LINE (10)
-- ======================================================================
(REPLACE(gen_random_uuid()::text,'-',''), 'C11', 'LINE', '기본 직선', 'Straight Line', '기본적인 꺾은선.', 'line', '{}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#4d9fff"}]}', '#4d9fff', 'ChartComponent (Chart.js)', '트렌드 조회', 110, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C12', 'LINE', '곡선 (Tension)', 'Smooth Line', 'tension: 0.4 적용된 부드러운 곡선.', 'line', '{}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#00d68f","tension":0.4}]}', '#00d68f', 'ChartComponent (Chart.js)', '트렌드·추이', 120, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C13', 'LINE', '계단형 (Before)', 'Stepped Line - Before', 'stepped: ''before''.', 'line', '{}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#ffb347","stepped":"before"}]}', '#ffb347', 'ChartComponent (Chart.js)', '단계별 상태 변화', 130, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C14', 'LINE', '계단형 (Middle)', 'Stepped Line - Middle', 'stepped: ''middle''.', 'line', '{}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#ff4d6d","stepped":"middle"}]}', '#ff4d6d', 'ChartComponent (Chart.js)', '이산 스냅샷', 140, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C15', 'LINE', '점선', 'Dashed Line', 'borderDash 옵션.', 'line', '{}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#9d72ff","borderDash":[5,5]}]}', '#9d72ff', 'ChartComponent (Chart.js)', '목표치·기준선', 150, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C16', 'LINE', '결측치 연결', 'Span Gaps', 'Null 건너뛰고 이전-이후 연결.', 'line', '{}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,30,null,null,40,50],"borderColor":"#00e5ff","spanGaps":true,"pointRadius":5}]}', '#00e5ff', 'ChartComponent (Chart.js)', '누락 데이터 트렌드', 160, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C17', 'LINE', '포인트 스타일', 'Custom Point Style', 'rectRot/cross 등 포인트 모양 커스텀.', 'line', '{}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#4d9fff","pointStyle":"rectRot","pointRadius":8,"pointBorderColor":"#fff","pointBorderWidth":2}]}', '#4d9fff', 'ChartComponent (Chart.js)', '포인트 강조', 170, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C18', 'LINE', '구간별 색상', 'Segmented Color Line', '값 하락 구간 다른 색상.', 'line', '{}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#00d68f"}]}', '#00d68f', 'ChartComponent (Chart.js)', '상승/하락 구분', 180, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C19', 'LINE', '다중 라인', 'Multi-line', '여러 데이터 동시 비교.', 'line', '{}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#4d9fff"},{"label":"B","data":[15,25,32,30,45,40],"borderColor":"#00d68f"},{"label":"C","data":[10,18,25,28,35,42],"borderColor":"#ffb347"}]}', '#4d9fff', 'ChartComponent (Chart.js)', '다지표 비교', 190, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C20', 'LINE', '포인트 숨김', 'No-Point Smooth', 'pointRadius: 0 + tension.', 'line', '{}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#ff4d6d","pointRadius":0,"tension":0.4}]}', '#ff4d6d', 'ChartComponent (Chart.js)', '매끈한 트렌드', 200, 'system', now()),

-- ======================================================================
-- 3. AREA (7)
-- ======================================================================
(REPLACE(gen_random_uuid()::text,'-',''), 'C21', 'AREA', '하단 채우기', 'Area (Fill Origin)', 'fill: ''origin''.', 'line', '{}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#4d9fff","backgroundColor":"#4d9fff40","fill":"origin"}]}', '#4d9fff', 'ChartComponent (Chart.js)', '추세 강조', 210, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C22', 'AREA', '시작점 채우기', 'Area (Fill Start)', 'fill: ''start''.', 'line', '{}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[-10,5,-5,15,8,20],"borderColor":"#00d68f","backgroundColor":"#00d68f40","fill":"start"}]}', '#00d68f', 'ChartComponent (Chart.js)', '편차·양수/음수', 220, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C23', 'AREA', '데이터 간 채우기', 'Fill Between', '이전 데이터셋 사이 채우기 (fill: -1).', 'line', '{}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"Upper","data":[40,45,38,50,48,52],"borderColor":"#9d72ff"},{"label":"Lower","data":[20,22,18,28,30,32],"borderColor":"#00d68f","backgroundColor":"#00d68f40","fill":"-1"}]}', '#9d72ff', 'ChartComponent (Chart.js)', '신뢰구간·밴드', 230, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C24', 'AREA', '누적 영역', 'Stacked Area', '누적 + 영역 채우기.', 'line', '{"scales":{"y":{"stacked":true}}}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[15,22,18,25,28,24],"fill":true,"backgroundColor":"#4d9fff80"},{"label":"B","data":[12,18,15,22,20,26],"fill":true,"backgroundColor":"#00d68f80"}]}', '#4d9fff', 'ChartComponent (Chart.js)', '구성 누적 트렌드', 240, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C25', 'AREA', '곡선 영역', 'Smooth Area', 'tension + fill.', 'line', '{}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#ffb347","backgroundColor":"#ffb34740","fill":true,"tension":0.4}]}', '#ffb347', 'ChartComponent (Chart.js)', '부드러운 트렌드', 250, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C26', 'AREA', '기준값 채우기', 'Fill at Value', '특정 Y값 기준 상/하 채우기.', 'line', '{}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#ff4d6d","backgroundColor":"#ff4d6d40","fill":{"value":30}}]}', '#ff4d6d', 'ChartComponent (Chart.js)', '기준치 초과 하이라이트', 260, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C27', 'AREA', '끝점 채우기', 'Fill End', 'fill: ''end''.', 'line', '{}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#00e5ff","backgroundColor":"#00e5ff40","fill":"end"}]}', '#00e5ff', 'ChartComponent (Chart.js)', '상한선 강조', 270, 'system', now()),

-- ======================================================================
-- 4. PIE / DOUGHNUT (8)
-- ======================================================================
(REPLACE(gen_random_uuid()::text,'-',''), 'C28', 'PIE', '기본 파이', 'Pie Chart', '원형 100% 구성비.', 'pie', '{}', '{"labels":["A","B","C","D","E"],"datasets":[{"data":[35,25,20,15,5],"backgroundColor":["#4d9fff","#00d68f","#ffb347","#ff4d6d","#9d72ff"]}]}', '#4d9fff', 'ChartComponent (Chart.js)', '비중 분석', 280, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C29', 'PIE', '기본 도넛', 'Doughnut Chart', 'type: ''doughnut''.', 'doughnut', '{}', '{"labels":["A","B","C","D","E"],"datasets":[{"data":[35,25,20,15,5],"backgroundColor":["#4d9fff","#00d68f","#ffb347","#ff4d6d","#9d72ff"]}]}', '#00d68f', 'ChartComponent (Chart.js)', '구성비·링 그래프', 290, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C30', 'PIE', '얇은 도넛', 'Thin Doughnut', 'cutout: 80%.', 'doughnut', '{"cutout":"80%"}', '{"labels":["A","B","C","D"],"datasets":[{"data":[40,25,20,15],"backgroundColor":["#4d9fff","#00d68f","#ffb347","#ff4d6d"]}]}', '#4d9fff', 'ChartComponent (Chart.js)', '미니 도넛·KPI', 300, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C31', 'PIE', '두꺼운 도넛', 'Thick Doughnut', 'cutout: 20%.', 'doughnut', '{"cutout":"20%"}', '{"labels":["A","B","C","D"],"datasets":[{"data":[40,25,20,15],"backgroundColor":["#4d9fff","#00d68f","#ffb347","#ff4d6d"]}]}', '#ffb347', 'ChartComponent (Chart.js)', '강조 도넛', 310, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C32', 'PIE', '반원 도넛', 'Half Doughnut', 'rotation -90 + circumference 180.', 'doughnut', '{"rotation":-90,"circumference":180}', '{"labels":["완료","대기"],"datasets":[{"data":[75,25],"backgroundColor":["#00d68f","#2a3352"]}]}', '#00d68f', 'ChartComponent (Chart.js)', '게이지형 진척', 320, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C33', 'PIE', '조각 분리', 'Exploded Pie', 'offset 으로 특정 조각 분리.', 'pie', '{}', '{"labels":["A","B","C","D","E"],"datasets":[{"data":[40,25,20,10,5],"backgroundColor":["#4d9fff","#00d68f","#ffb347","#ff4d6d","#9d72ff"],"offset":[30,0,0,0,0]}]}', '#ff4d6d', 'ChartComponent (Chart.js)', '이상치 강조', 330, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C34', 'PIE', '다중 링 도넛', 'Multi-Ring Doughnut', '여러 데이터셋 링으로.', 'doughnut', '{}', '{"labels":["A","B","C"],"datasets":[{"data":[40,30,30],"backgroundColor":["#4d9fff","#00d68f","#ffb347"]},{"data":[25,45,30],"backgroundColor":["#4d9fff80","#00d68f80","#ffb34780"]}]}', '#9d72ff', 'ChartComponent (Chart.js)', '비교 구성비', 340, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C35', 'PIE', '조각 간격 도넛', 'Spaced Doughnut', 'spacing 으로 조각 사이 간격.', 'doughnut', '{}', '{"labels":["A","B","C","D"],"datasets":[{"data":[35,25,25,15],"backgroundColor":["#4d9fff","#00d68f","#ffb347","#ff4d6d"],"spacing":5,"borderRadius":5}]}', '#00d68f', 'ChartComponent (Chart.js)', '모던 UI', 350, 'system', now()),

-- ======================================================================
-- 5. RADAR / POLAR (5)
-- ======================================================================
(REPLACE(gen_random_uuid()::text,'-',''), 'C36', 'RADAR', '기본 방사형', 'Radar Chart', '다각도 지표 비교.', 'radar', '{}', '{"labels":["품질","가격","배송","서비스","디자인"],"datasets":[{"label":"A","data":[85,70,92,78,88],"borderColor":"#4d9fff","backgroundColor":"#4d9fff40"}]}', '#4d9fff', 'ChartComponent (Chart.js)', '역량·성능 비교', 360, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C37', 'RADAR', '곡선 방사형', 'Smooth Radar', 'tension 적용.', 'radar', '{}', '{"labels":["품질","가격","배송","서비스","디자인"],"datasets":[{"label":"A","data":[85,70,92,78,88],"borderColor":"#00d68f","backgroundColor":"#00d68f40","tension":0.4}]}', '#00d68f', 'ChartComponent (Chart.js)', '부드러운 프로파일', 370, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C38', 'RADAR', '다중 방사형', 'Multi Radar', '복수 데이터 비교.', 'radar', '{}', '{"labels":["품질","가격","배송","서비스","디자인"],"datasets":[{"label":"A사","data":[85,70,92,78,88],"borderColor":"#4d9fff","backgroundColor":"#4d9fff40"},{"label":"B사","data":[75,85,80,90,75],"borderColor":"#ffb347","backgroundColor":"#ffb34740"}]}', '#ffb347', 'ChartComponent (Chart.js)', '경쟁사 비교', 380, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C39', 'RADAR', '속이 빈 방사형', 'Outlined Radar', 'fill: false + borderDash.', 'radar', '{}', '{"labels":["품질","가격","배송","서비스","디자인"],"datasets":[{"label":"A","data":[85,70,92,78,88],"borderColor":"#ff4d6d","borderDash":[5,5],"fill":false}]}', '#ff4d6d', 'ChartComponent (Chart.js)', '외곽선 강조', 390, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C40', 'RADAR', '극좌표형 (Polar)', 'Polar Area', '반지름=값.', 'polarArea', '{}', '{"labels":["A","B","C","D","E","F"],"datasets":[{"data":[35,42,28,50,45,38],"backgroundColor":["#4d9fff80","#00d68f80","#ffb34780","#ff4d6d80","#9d72ff80","#00e5ff80"]}]}', '#9d72ff', 'ChartComponent (Chart.js)', '원형 비교', 400, 'system', now()),

-- ======================================================================
-- 6. SCATTER / BUBBLE (5)
-- ======================================================================
(REPLACE(gen_random_uuid()::text,'-',''), 'C41', 'SCATTER', '산점도', 'Scatter', '(x,y) 좌표 분포.', 'scatter', '{}', '{"datasets":[{"label":"A","data":[{"x":10,"y":20},{"x":25,"y":35},{"x":40,"y":15},{"x":35,"y":45},{"x":15,"y":30},{"x":45,"y":25}],"backgroundColor":"#4d9fff","pointRadius":6}]}', '#4d9fff', 'ChartComponent (Chart.js)', '상관관계 분석', 410, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C42', 'SCATTER', '다중 산점도', 'Multi Scatter', '그룹별 분포.', 'scatter', '{}', '{"datasets":[{"label":"A","data":[{"x":10,"y":20},{"x":25,"y":35},{"x":40,"y":15}],"backgroundColor":"#00d68f","pointRadius":6},{"label":"B","data":[{"x":15,"y":45},{"x":30,"y":25},{"x":45,"y":40}],"backgroundColor":"#ff4d6d","pointRadius":6}]}', '#00d68f', 'ChartComponent (Chart.js)', '그룹 분포', 420, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C43', 'SCATTER', '선 연결 산점도', 'Scatter + Line', 'showLine: true.', 'scatter', '{}', '{"datasets":[{"label":"A","data":[{"x":5,"y":10},{"x":15,"y":25},{"x":25,"y":20},{"x":35,"y":35},{"x":45,"y":30}],"borderColor":"#ffb347","backgroundColor":"#ffb347","showLine":true}]}', '#ffb347', 'ChartComponent (Chart.js)', '회귀선·추세', 430, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C44', 'SCATTER', '기본 버블', 'Bubble', '(x,y,r) 3차원.', 'bubble', '{}', '{"datasets":[{"label":"A","data":[{"x":10,"y":20,"r":8},{"x":25,"y":35,"r":12},{"x":40,"y":15,"r":6},{"x":35,"y":45,"r":15}],"backgroundColor":"#9d72ff80"}]}', '#9d72ff', 'ChartComponent (Chart.js)', '3차원 비교', 440, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C45', 'SCATTER', '다중 버블', 'Multi Bubble', '그룹별 버블 분포.', 'bubble', '{}', '{"datasets":[{"label":"A","data":[{"x":10,"y":20,"r":10},{"x":30,"y":35,"r":8}],"backgroundColor":"#4d9fff80"},{"label":"B","data":[{"x":20,"y":40,"r":12},{"x":40,"y":25,"r":6}],"backgroundColor":"#00d68f80"}]}', '#4d9fff', 'ChartComponent (Chart.js)', '그룹 분포 크기 비교', 450, 'system', now()),

-- ======================================================================
-- 7. COMBO (5)
-- ======================================================================
(REPLACE(gen_random_uuid()::text,'-',''), 'C46', 'COMBO', '막대 + 꺾은선', 'Bar & Line', '가장 일반적인 S&OP 콤보.', 'bar', '{}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"type":"bar","label":"계획","data":[30,35,28,40,45,42],"backgroundColor":"#4d9fff"},{"type":"line","label":"실적","data":[28,32,30,38,42,44],"borderColor":"#ff4d6d","borderWidth":3}]}', '#4d9fff', 'ChartComponent (Chart.js)', '계획 vs 실적', 460, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C47', 'COMBO', '누적 + 라인 (Pareto)', 'Pareto Combo', '누적 막대 + 누적 라인.', 'bar', '{"scales":{"x":{"stacked":true},"y":{"stacked":true}}}', '{"labels":["A","B","C","D","E","F"],"datasets":[{"type":"bar","label":"건수","data":[50,30,10,5,3,2],"backgroundColor":"#ffb347"},{"type":"line","label":"누적%","data":[50,80,90,95,98,100],"borderColor":"#ff4d6d"}]}', '#ffb347', 'ChartComponent (Chart.js)', '파레토 분석', 470, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C48', 'COMBO', '영역 + 라인', 'Area & Line', '배경 영역 + 강조 라인.', 'line', '{}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"type":"line","label":"Range","data":[20,30,25,35,32,40],"fill":true,"backgroundColor":"#9d72ff40","borderColor":"#9d72ff"},{"type":"line","label":"Current","data":[22,28,28,32,35,38],"borderColor":"#4d9fff","borderWidth":3}]}', '#9d72ff', 'ChartComponent (Chart.js)', '추세 + 현재값', 480, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C49', 'COMBO', '수평 콤보', 'Horizontal Combo', 'indexAxis: y 콤보.', 'bar', '{"indexAxis":"y"}', '{"labels":["A","B","C","D","E","F"],"datasets":[{"type":"bar","label":"Bar","data":[35,42,28,50,45,38],"backgroundColor":"#00e5ff"},{"type":"line","label":"Line","data":[30,45,32,48,40,42],"borderColor":"#ff4d6d"}]}', '#00e5ff', 'ChartComponent (Chart.js)', '수평 비교', 490, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C50', 'COMBO', '산점도 + 추세선', 'Scatter + Trend', '분포 + 회귀선.', 'scatter', '{}', '{"datasets":[{"type":"scatter","label":"Data","data":[{"x":10,"y":20},{"x":20,"y":25},{"x":30,"y":40},{"x":40,"y":35},{"x":50,"y":50}],"backgroundColor":"#00d68f"},{"type":"line","label":"Trend","data":[{"x":0,"y":15},{"x":50,"y":48}],"borderColor":"#ff4d6d","borderDash":[5,5]}]}', '#00d68f', 'ChartComponent (Chart.js)', '상관 + 추세', 500, 'system', now()),

-- ======================================================================
-- 8. SCALE / AXIS (4)
-- ======================================================================
(REPLACE(gen_random_uuid()::text,'-',''), 'C51', 'SCALE', '이중 Y축', 'Dual Y-Axis', '좌/우 축 분리.', 'line', '{"scales":{"y":{"type":"linear","position":"left"},"y1":{"type":"linear","position":"right","grid":{"drawOnChartArea":false}}}}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"type":"line","label":"율(%)","data":[20,35,28,42,38,50],"yAxisID":"y","borderColor":"#4d9fff"},{"type":"bar","label":"금액","data":[1200,1800,1500,2200,2000,2500],"yAxisID":"y1","backgroundColor":"#ffb347"}]}', '#4d9fff', 'ChartComponent (Chart.js)', '단위 다른 지표', 510, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C52', 'SCALE', '로그 스케일', 'Log Scale', 'y 축 logarithmic.', 'line', '{"scales":{"y":{"type":"logarithmic"}}}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[10,100,1000,5000,20000,100000],"borderColor":"#ff4d6d"}]}', '#ff4d6d', 'ChartComponent (Chart.js)', '값 편차 큼', 520, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C53', 'SCALE', '그리드 숨김', 'No Grid', '배경선 제거.', 'bar', '{"scales":{"x":{"grid":{"display":false}},"y":{"grid":{"display":false}}}}', '{"labels":["A","B","C","D","E","F"],"datasets":[{"label":"값","data":[35,42,28,50,45,38],"backgroundColor":"#00d68f"}]}', '#00d68f', 'ChartComponent (Chart.js)', '깔끔한 UI', 530, 'system', now()),
(REPLACE(gen_random_uuid()::text,'-',''), 'C54', 'SCALE', '축 반전', 'Reversed Y-Axis', 'y 축 위에서 아래로.', 'line', '{"scales":{"y":{"reverse":true}}}', '{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"순위","data":[5,3,4,2,1,1],"borderColor":"#9d72ff"}]}', '#9d72ff', 'ChartComponent (Chart.js)', '순위·낮을수록 좋음', 540, 'system', now());


SELECT CATEGORY, COUNT(*) AS CNT FROM TB_IS_COMPOSER_CHART_TYPE GROUP BY CATEGORY ORDER BY CATEGORY;
SELECT COUNT(*) AS TOTAL_CHARTS FROM TB_IS_COMPOSER_CHART_TYPE;
-- =============================================================
-- T3Composer Dictionary — KPI 기반 Seed (S&OP 40 + SCM 기반 56 = 96) [PostgreSQL]
-- =============================================================
-- 부모 t3series 의 seed_kpi.sql / seed_kpi_scm.sql 을 PG 방언으로 이관.
-- 이 블록 + 아래 SCM 확장 v2(56) = 총 152 KPI.
-- 재실행 안전: 각 코드 집합만 선삭제 후 재삽입.
-- =============================================================

-- ---------- S&OP 범용 40 (SALES/PROD/INV/PUR/FIN) ----------
DELETE FROM TB_IS_COMPOSER_KPI_DICT WHERE CODE IN (
  'S1','S2','S3','S4','S5','S6','S7','S8','P1','P2','P3','P4','P5','P6','P7','P8','I1','I2','I3','I4','I5','I6','I7','I8','M1','M2','M3','M4','M5','M6','M7','M8','F1','F2','F3','F4','F5','F6','F7','F8'
);

INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(gen_random_uuid()::text,'-',''),'S1','SALES','1. 영업/수요','수요 예측 정확도 (Forecast Accuracy)','Y','영업 / SCM','월간','SCM의 출발점. 판매 계획(예측)과 실제 판매량 간 차이로 수요 계획 신뢰성 평가. 변동성을 줄여 과잉재고·결품 방지.','(1 - |실제 - 예측| / 실제) × 100','line','정확도(%)','[82,85,81,88,92,89]','doughnut','["정확(%)","오차(%)"]','[89,11]','%','N',10,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'S2','SALES','1. 영업/수요','납기 준수율 (OTD)','Y','영업 / 물류','일간/주간','고객 만족 핵심 지표. 요청 납기일에 정확한 수량 인도한 주문 비율.','(정상 납기 주문 / 전체 주문) × 100','bar','OTD(%)','[95,96,94,98,97,99]','doughnut','["준수(%)","지연(%)"]','[99,1]','%','N',20,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'S3','SALES','1. 영업/수요','매출 목표 달성률','Y','영업 / 재무','월간','S&OP 합의 월간·연간 매출 목표 대비 실제 매출 비율.','(실제 매출액 / 목표 매출액) × 100','bar','달성률(%)','[98,102,95,105,110,108]','bar_comp','["실적(당월)","목표(당월)"]','[108,100]','%','N',30,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'S4','SALES','1. 영업/수요','수주 잔고 (Order Backlog)','N','영업','주간/월간','수주 접수되었으나 미생산/미출하 물량. 미래 매출 선행 지표.','전기 잔고 + 신규수주 - 출하액','line','잔고(억)','[120,140,135,150,180,160]','bar_stack','["확정수주","생산중","출하대기"]','[80,50,30]','억','N',40,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'S5','SALES','1. 영업/수요','주문 수명주기 (O2C LT)','N','영업 / 물류','월간','주문 접수 → 생산/출하 → 대금 회수 총 소요 일수.','대금회수일 - 주문접수일','line','LT(일)','[35,33,36,30,28,26]','bar_stack','["주문/승인","생산","물류/배송","대금회수"]','[3,12,8,3]','일','Y',50,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'S6','SALES','1. 영업/수요','고객 집중도 (Customer Concentration)','N','영업','분기','상위 소수 고객 매출 비중. 편중 리스크 평가.','(상위 N사 매출 / 총 매출) × 100','line','비중(%)','[65,66,64,68,67,70]','pie','["A사","B사","C사","기타"]','[35,20,15,30]','%','N',60,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'S7','SALES','1. 영업/수요','신규 고객 획득률','N','영업','월간','특정 기간 신규 수주 확보 고객 비율.','(신규 거래처 / 총 거래처) × 100','bar','획득률(%)','[5,6,4,8,10,9]','doughnut','["신규(%)","기존(%)"]','[9,91]','%','N',70,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'S8','SALES','1. 영업/수요','수요 예측 편향 (Forecast Bias)','N','SCM','월간','예측이 과대(Over) / 과소(Under) 경향 지표.','(∑실제 - ∑예측) / ∑실제 × 100','bar','편향(%)','[2.5,1.2,-1.5,-3.2,0.5,-2.5]','bar_comp','["현재 편향","이상기준(0)"]','[-2.5,0]','%','N',80,'system',now());

INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(gen_random_uuid()::text,'-',''),'P1','PROD','2. 생산/운영','생산 계획 준수율 (Adherence to Plan)','Y','생산 관리','일간/주간','확정 MPS 대비 실제 생산 수량 일치 정도. 생산 안정성.','(실제 생산 / 계획 생산) × 100','line','준수율(%)','[92,95,91,89,96,98]','bar_comp','["실적(수량)","계획(수량)"]','[98,100]','K','N',90,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'P2','PROD','2. 생산/운영','설비 종합 효율 (OEE)','Y','생산 / 설비','일간','가동률 × 성능효율 × 양품률. 글로벌 제조 표준 지표.','가동률 × 성능효율 × 양품률','bar','OEE(%)','[75,78,82,80,85,84]','radar','["가동률","성능효율","양품률"]','[88,92,98]','%','N',100,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'P3','PROD','2. 생산/운영','제조 리드타임 (Mfg Lead Time)','Y','생산','월간','원자재 투입 → 완제품 나오기까지 총 시간. 짧을수록 대응 민첩.','대기 + 셋업 + 가동 + 이동 시간','line','LT(일)','[18,17,16,15,15,14]','bar_comp','["현재LT","목표LT"]','[14,12]','일','Y',110,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'P4','PROD','2. 생산/운영','초초수율 (First Pass Yield, FPY)','N','품질','일간','재작업·수리 없이 한 번에 양품 통과 비율.','(초품 양품 / 총 투입) × 100','line','FPY(%)','[94,95,93,96,97,98]','pie','["통과(양품)","재작업","스크랩"]','[98,1.5,0.5]','%','N',120,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'P5','PROD','2. 생산/운영','설비 가동률 (Availability)','N','설비','일간','계획 총 생산시간 중 실제 운전 시간 비율.','(실제 가동 / 계획 가동) × 100','bar','가동률(%)','[85,88,87,90,92,91]','doughnut','["가동","고장/수리","셋업"]','[91,5,4]','%','N',130,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'P6','PROD','2. 생산/운영','모델 교체 시간 (Setup Time)','N','생산','주간','품목 변경 시 금형/툴 교체 비가동 시간.','총 셋업 시간 / 셋업 횟수','line','평균 셋업(분)','[45,42,40,35,30,28]','bar_comp','["당월(분)","전년평균"]','[28,40]','분','Y',140,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'P7','PROD','2. 생산/운영','공정 불량률 (Defect Rate/PPM)','N','품질','일간/주간','생산 과정 불량품 비율. 자재 낭비·재작업 LT 지연.','(불량 / 생산) × 1,000,000','bar','불량률(PPM)','[3200,2800,3500,2100,1800,1500]','bar_comp','["실적(PPM)","목표(PPM)"]','[1500,2000]','PPM','Y',150,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'P8','PROD','2. 생산/운영','단위 생산원가 (Unit Mfg Cost)','N','생산 / 재무','월간','1단위 생산 투입 재료비+노무비+제조경비.','총 제조 원가 / 총 생산 수량','line','단가(원)','[12500,12200,12800,11500,11000,10800]','bar_stack','["재료비","노무비","제조경비"]','[6000,3000,1800]','원','Y',160,'system',now());

INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(gen_random_uuid()::text,'-',''),'I1','INV','3. 재고/자재','재고 회전일수 (DSI)','Y','SCM / 재무','월간','보유 재고 소진 → 매출 전환 평균 일수. 낮을수록 현금흐름·재고 효율 우수.','(평균 재고자산 / 연간 매출원가) × 365','line','회전일수(일)','[45,42,48,40,35,30]','bar_comp','["당월","목표"]','[30,45]','일','Y',170,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'I2','INV','3. 재고/자재','장기 체화 재고 비율 (Obsolete Inv)','Y','SCM / 자재','월간','6M+ 미이동 악성 재고 비중.','(장기 미이동 / 총 재고) × 100','bar','악성(%)','[12,15,14,10,8,5]','pie','["악성(6M+)","주의(3~6M)","건전(~3M)"]','[5,20,75]','%','Y',180,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'I3','INV','3. 재고/자재','자재 결품률 (Material Shortage)','Y','자재 / 구매','주간','생산라인 자재 적시 공급 실패 결품 비율. 생산 차질 주원인.','(결품 건수 / 총 요청) × 100','line','결품률(%)','[5.2,4.1,6.5,3.2,2.1,1.5]','bar_comp','["당월","목표"]','[1.5,3.0]','%','Y',190,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'I4','INV','3. 재고/자재','재고 정확도 (Inv Record Accuracy)','N','물류 / 창고','월간(실사)','ERP/MES 전산 수량 vs 실물 수량 일치 비율.','(수량 일치 품목 / 전체 실사) × 100','line','정확도(%)','[92,95,96,98,97,99]','doughnut','["일치","불일치"]','[99,1]','%','N',200,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'I5','INV','3. 재고/자재','품절 횟수 (Stockout Frequency)','N','SCM / 물류','주간','완제품 재고 부족으로 출하 실패 횟수.','월간 품절 발생 건수','bar','품절(건)','[8,5,10,3,2,1]','bar_comp','["당월","목표이하"]','[1,5]','건','Y',210,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'I6','INV','3. 재고/자재','안전재고 유지율 (SS Level)','N','SCM','주간','안전재고 기준치 이상 유지 품목 비율.','(SS 확보 품목 / 관리 대상) × 100','line','유지율(%)','[80,85,82,88,92,95]','pie','["적정/초과","미달"]','[95,5]','%','N',220,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'I7','INV','3. 재고/자재','반제품(WIP) 보유 현황','N','생산 / 자재','주간','공정 간 대기·조립 중 재공품 자산 금액.','∑ 공정별 WIP 수량 × 단가','bar','WIP(백만)','[520,550,500,480,450,420]','bar_stack','["가공","조립","검사","포장"]','[150,120,100,50]','M','N',230,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'I8','INV','3. 재고/자재','재고 유지 비용 (Carrying Cost)','N','재무','분기','보관료 + 자본비용 + 파손비용 + 보험 비중.','(연간 유지비 / 평균 재고) × 100','line','비용률(%)','[18,17,19,16,15,14]','pie','["보관","자본","파손","보험"]','[40,30,20,10]','%','Y',240,'system',now());

INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(gen_random_uuid()::text,'-',''),'M1','PUR','4. 구매/조달','협력사 납기 준수율 (Supplier OTD)','Y','구매','월간','공급업체 PO 납기일 준수 입고 비율. 생산차질 예방 선행.','(정상 입고 건수 / 총 발주) × 100','bar','OTD(%)','[88,90,85,92,95,96]','bar_comp','["당월","목표"]','[96,98]','%','N',250,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'M2','PUR','4. 구매/조달','구매 예산 절감률 (Cost Saving)','Y','구매 / 재무','월간','표준 단가 대비 협상·절감 비용 비율.','((표준 - 실제) × 수량) / (표준 × 수량) × 100','line','절감률(%)','[2.5,3.0,1.8,4.2,5.0,4.8]','bar_comp','["당월","목표"]','[4.8,4.0]','%','N',260,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'M3','PUR','4. 구매/조달','구매 리드타임 (Procurement LT)','N','구매','월간','PO 발주 → 입고 승인 평균 일수.','입고일 - PO일','line','LT(일)','[14,13,15,12,11,10]','bar_comp','["당월","전년"]','[10,14]','일','Y',270,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'M4','PUR','4. 구매/조달','핵심 품목 공급 리스크','N','구매 / SCM','분기','Single Vendor 의존 핵심 자재 비율.','(단독공급 자재 / 전체 핵심) × 100','line','리스크(%)','[25,24,26,20,18,15]','pie','["단독공급(위험)","다변화(안전)"]','[15,85]','%','Y',280,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'M5','PUR','4. 구매/조달','수입 검사 불량률 (IQC Defect)','N','품질 / 구매','주간','입고 IQC 검사 불량 판정 반품/특채 비율.','(불량 로트 / 전체 로트) × 100','line','불량률(%)','[3.2,2.5,4.1,1.8,1.2,0.8]','polarArea','["치수","외관","기능"]','[45,30,25]','%','Y',290,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'M6','PUR','4. 구매/조달','협력사 품질 불량률 (Supplier PPM)','N','품질','월간','협력사 귀책 불량 PPM 비율.','(협력사 불량 / 사용 수량) × 1,000,000','bar','PPM','[2500,2200,1800,1500,1300,1200]','bar_comp','["당월","목표"]','[1200,1500]','PPM','Y',300,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'M7','PUR','4. 구매/조달','긴급 발주 비율 (Rush Order)','N','구매','월간','표준 LT 무시 긴급 추가비 발주 비율.','(긴급 건수 / 총 발주) × 100','line','긴급(%)','[18,15,20,14,13,12]','pie','["긴급","정상"]','[12,88]','%','Y',310,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'M8','PUR','4. 구매/조달','단가 변동률 (PPV)','N','구매 / 재무','월간','Purchase Price Variance. 표준 단가 vs 실제 구매 단가 차이.','(실제 - 표준) / 표준 × 100','bar','변동률(%)','[1.2,1.5,0.8,-1.2,-0.5,2.1]','bar_comp','["현재","기준(0%)"]','[2.1,0]','%','N',320,'system',now());

INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(gen_random_uuid()::text,'-',''),'F1','FIN','5. 전사/재무','S&OP 통합 계획 달성률','Y','경영진','월간','이전 S&OP 통합 시나리오(수요+생산+재고+구매) vs 실제 비즈니스 결과 종합 평가.','∑ (실적/계획) × 가중치','line','달성률(%)','[88,90,89,92,94,96]','radar','["매출","생산","재고","구매","출하"]','[96,92,98,85,94]','%','N',330,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'F2','FIN','5. 전사/재무','현금 전환 주기 (CCC)','Y','재무','분기','자재 구매 현금 지출 → 완제품 판매 현금 회수까지 일수.','DSI + DSO - DPO','line','CCC(일)','[65,62,70,55,50,45]','bar_comp','["당월","목표"]','[45,60]','일','Y',340,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'F3','FIN','5. 전사/재무','매출원가율 (COGS %)','N','재무','월간','매출액 중 총 제조원가 비중.','(매출원가 / 매출액) × 100','line','원가율(%)','[75,74,76,72,70,68]','doughnut','["매출원가","매출총이익"]','[68,32]','%','Y',350,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'F4','FIN','5. 전사/재무','계획 대비 추가(변동) 비용','N','SCM / 재무','월간','계획 변동으로 발생한 긴급 물류비·잔업·외주 추가 비용.','∑ (긴급물류 + 특근 + 긴급외주)','bar','추가비용(M)','[120,150,100,80,50,30]','pie','["항공/긴급물류","특근수당","긴급외주"]','[40,35,25]','M','Y',360,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'F5','FIN','5. 전사/재무','재고 자산 회전율 (Turnover)','N','재무','월간','1년간 재고자산 회전 매출 횟수 (DSI 역산).','연간 매출원가 / 평균 재고자산','bar','회전(회)','[6.5,7.0,6.8,7.5,8.2,8.5]','bar_comp','["현재","목표"]','[8.5,10.0]','회','N',370,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'F6','FIN','5. 전사/재무','물류/운송 비용률 (Logistics Cost %)','N','물류 / 재무','월간','매출액 대비 운반/보관/하역 총 물류비 비율.','(총 물류비 / 매출액) × 100','line','비용률(%)','[6.2,5.8,6.5,5.2,4.8,4.5]','bar_comp','["실적","목표상한"]','[4.5,5.0]','%','Y',380,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'F7','FIN','5. 전사/재무','영업 이익률 (Operating Margin)','N','재무','분기','S&OP 효율화 종착지. 매출 - 매출원가 - 판관비 = 영업이익 비율.','(영업이익 / 매출액) × 100','bar','이익률(%)','[8.5,9.2,8.8,10.5,11.2,12.5]','bar_comp','["실적","목표"]','[12.5,10.0]','%','N',390,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'F8','FIN','5. 전사/재무','주문 당 처리 비용 (Cost Per Order)','N','SCM / 재무','분기','접수·피킹·패킹·발송 주문 1건 처리 평균 비용.','처리 총비용 / 총 주문','line','처리비용(원)','[21000,20500,19000,18500,16000,15000]','bar_comp','["당월","전년평균"]','[15000,18000]','원','Y',400,'system',now());

-- ---------- SCM 모듈별 기반 56 (BF01~SA08) ----------
DELETE FROM TB_IS_COMPOSER_KPI_DICT WHERE CODE IN (
  'BF01','BF02','BF03','BF04','BF05','BF06','BF07','BF08','DP01','DP02','DP03','DP04','DP05','DP06','DP07','DP08','MP01','MP02','MP03','MP04','MP05','MP06','MP07','MP08','FP01','FP02','FP03','FP04','FP05','FP06','FP07','FP08','IM01','IM02','IM03','IM04','IM05','IM06','IM07','IM08','RP01','RP02','RP03','RP04','RP05','RP06','RP07','RP08','SA01','SA02','SA03','SA04','SA05','SA06','SA07','SA08'
);

INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(gen_random_uuid()::text,'-',''),'BF01','BF','BF. 기준 예측','예측 정확도 (MAPE)','Y','BF팀','월간','판매실적 대비 기준예측(BF) 평균 절대 오차율. MAPE < 20% 목표.','(1/n) × Σ |실제 - 예측| / 실제 × 100','line','MAPE(%)','[22,19,18,15,14,12]','bar_comp','["당월","목표"]','[12,20]','%','Y',500,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'BF02','BF','BF. 기준 예측','예측 편향 (Bias/ME)','Y','BF팀','월간','과대/과소 예측 경향성. 0 에 가까울수록 우수.','(1/n) × Σ (실제 - 예측) / 실제 × 100','bar','편향(%)','[2.5,-1.2,1.8,-3.2,0.5,1.2]','bar_comp','["현재","이상기준"]','[1.2,0]','%','N',501,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'BF03','BF','BF. 기준 예측','모델별 정확도 비교','N','BF팀','월간','ARIMA / XGBoost / LightGBM / Prophet 등 모델별 MAPE 비교.','각 모델별 MAPE 산출 후 비교','bar','모델별 MAPE(%)','[18,15,12,14,16,19]','radar','["ARIMA","XGB","LGBM","Prophet","ETS"]','[82,88,91,86,80]','%','N',502,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'BF04','BF','BF. 기준 예측','시즌별 예측 오차','N','BF팀','분기','성수기/비수기별 예측 정확도 차이.','시즌 구분 후 각 시즌별 MAPE','line','시즌 오차(%)','[15,25,18,12,22,28]','bar_stack','["성수기","비수기","프로모션"]','[40,35,25]','%','Y',503,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'BF05','BF','BF. 기준 예측','예측 대상 SKU 커버리지','N','BF팀','월간','BF 가 예측한 SKU / 전체 관리 SKU 비율.','(예측 SKU / 전체 SKU) × 100','line','커버리지(%)','[75,82,85,88,92,95]','doughnut','["예측됨","미예측"]','[95,5]','%','N',504,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'BF06','BF','BF. 기준 예측','이상치 감지율','N','BF팀','주간','실적 데이터 중 이상치(outlier)를 자동 감지·보정한 건수 비율.','(감지 건수 / 전체 데이터) × 100','bar','감지(%)','[3.2,2.8,4.1,2.1,1.8,1.5]','pie','["자동보정","수동검토","미보정"]','[70,25,5]','%','Y',505,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'BF07','BF','BF. 기준 예측','예측 갱신 주기 준수율','N','BF팀','주간','정해진 예측 갱신 스케줄(주간/월간) 준수 비율.','(정시 갱신 횟수 / 총 예정 횟수) × 100','bar','준수(%)','[95,96,94,98,100,98]','doughnut','["준수","지연"]','[98,2]','%','N',506,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'BF08','BF','BF. 기준 예측','신뢰구간 적중률','N','BF팀','월간','95% 신뢰구간 내에 실제값이 들어간 비율.','(신뢰구간 내 실적 건수 / 총 건수) × 100','line','적중률(%)','[88,92,94,93,95,96]','bar_comp','["당월","목표(95%)"]','[96,95]','%','N',507,'system',now());

INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(gen_random_uuid()::text,'-',''),'DP01','DP','DP. 수요 계획','판매계획 달성률','Y','영업/DP팀','월간','확정 DP 계획 대비 실제 판매 실적 비율.','(실제 판매 / DP 계획) × 100','line','달성률(%)','[92,95,88,102,98,96]','bar_comp','["실적","계획"]','[96,100]','%','N',510,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'DP02','DP','DP. 수요 계획','DP 버전별 편차','Y','DP팀','월간','v1.0 → v1.1 → v1.2 버전별 총량 변동.','버전 간 수요 합계 차이 / v1.0 × 100','bar','버전편차(%)','[0,3.2,-1.8,2.5,5.1,3.8]','bar_stack','["v1.0","v1.1","v1.2","확정"]','[25,30,25,20]','%','N',511,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'DP03','DP','DP. 수요 계획','영업-SCM 합의율','N','영업/SCM','월간','영업 요청 vs SCM 확정 일치 비율. S&OP 회의 결과.','(합의 건수 / 총 항목) × 100','line','합의율(%)','[82,85,88,92,94,96]','doughnut','["합의","조정","미합의"]','[85,10,5]','%','N',512,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'DP04','DP','DP. 수요 계획','채널별 수요 변동성','N','영업','주간','온라인/오프라인/대리점 채널별 수요 표준편차.','채널별 σ / μ × 100','bar','변동성(%)','[18,12,25,15,22,10]','radar','["온라인","오프라인","대리점","직판","수출"]','[72,55,85,60,45]','%','Y',513,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'DP05','DP','DP. 수요 계획','계정(Account)별 정확도','N','DP팀','월간','주요 계정(고객·채널 그룹)별 예측 정확도.','Account 별 MAPE','line','정확도(%)','[88,85,90,92,94,95]','bar_stack','["A사","B사","C사","기타"]','[45,25,20,10]','%','N',514,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'DP06','DP','DP. 수요 계획','신제품 수요 적중률','N','영업/마케팅','분기','신제품(NPI) 초기 3개월 수요 예측 적중률.','(1 - |실제 - 예측| / 실제) × 100','bar','적중률(%)','[65,72,68,78,82,85]','bar_comp','["NPI","기존제품"]','[85,94]','%','N',515,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'DP07','DP','DP. 수요 계획','프로모션 효과 정확도','N','마케팅','월간','프로모션 기간 Uplift 실제 vs 예상 일치도.','(실제 Uplift / 예상 Uplift) × 100','bar','정확도(%)','[85,92,78,95,88,96]','pie','["계획 내","상회","미달"]','[60,25,15]','%','N',516,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'DP08','DP','DP. 수요 계획','DP 확정 리드타임','N','DP팀','월간','DP 초안 → 최종 확정까지 소요 일수.','확정일자 - 초안일자','line','LT(일)','[8,7,9,6,5,5]','bar_comp','["당월","목표"]','[5,5]','일','Y',517,'system',now());

INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(gen_random_uuid()::text,'-',''),'MP01','MP','MP. 주생산 계획','MP 계획 준수율','Y','MP팀/생산','주간','확정 MP 대비 실제 생산 실적 준수 비율.','(실적 수량 / MP 계획) × 100','line','준수율(%)','[90,92,88,95,96,98]','bar_comp','["실적","계획"]','[98,100]','%','N',520,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'MP02','MP','MP. 주생산 계획','자원 부하율 (CAPA Load)','Y','MP팀','주간','설비/라인별 필요 CAPA / 가용 CAPA. 100% 초과 시 병목.','(필요 CAPA / 가용 CAPA) × 100','bar','부하율(%)','[85,92,105,78,95,110]','radar','["L1","L2","L3","L4","L5"]','[85,92,105,78,95]','%','N',521,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'MP03','MP','MP. 주생산 계획','납기 충족률 (RTF %)','Y','MP팀/영업','주간','Request-To-Fulfill: 요청 납기일 대비 실제 공급 가능 비율.','(충족 수량 / 요청 수량) × 100','line','RTF(%)','[88,92,90,94,96,98]','pie','["정시","조기","지연"]','[85,10,5]','%','N',522,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'MP04','MP','MP. 주생산 계획','계획 변경 횟수','N','MP팀','주간','MP 확정 후 재계획 발생 횟수. 낮을수록 안정적.','주간 재계획 Run 수','bar','변경(회)','[12,8,15,6,4,3]','bar_comp','["당주","목표이하"]','[3,5]','회','Y',523,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'MP05','MP','MP. 주생산 계획','설비 스케줄 적중률','N','생산관리','일간','할당 스케줄대로 설비가 가동된 비율.','(계획대로 가동 시간 / 총 계획시간) × 100','line','적중(%)','[85,88,92,94,95,97]','doughnut','["적중","지연"]','[97,3]','%','N',524,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'MP06','MP','MP. 주생산 계획','자원 병목 비율','N','MP팀','주간','가동률 95% 초과 설비 개수 / 총 설비 개수.','(병목 설비 / 총 설비) × 100','bar','병목(%)','[25,30,20,15,10,8]','pie','["병목(>95%)","정상","유휴"]','[8,72,20]','%','Y',525,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'MP07','MP','MP. 주생산 계획','시뮬레이션 버전 수','N','MP팀','월간','월간 수행한 MP 시뮬레이션 버전(시나리오) 개수.','월간 시뮬레이션 Run 카운트','bar','Run(회)','[8,12,15,18,22,25]','bar_stack','["기준","민감도","What-if","긴급"]','[10,5,7,3]','회','N',526,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'MP08','MP','MP. 주생산 계획','MP 확정 준수율','N','MP팀','주간','Freeze Window 내 확정 MP 의 유지 비율 (변경 금지 기간).','(Freeze 기간 미변경 수량 / 전체) × 100','line','준수(%)','[80,85,88,92,95,97]','bar_comp','["실적","목표"]','[97,95]','%','N',527,'system',now());

INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(gen_random_uuid()::text,'-',''),'FP01','FP','FP. 공장 계획','BOR 가동률','Y','FP팀','일간','Bill of Resource 기반 설비 가동 시간 / 가용 시간.','(BOR 가동 / 가용) × 100','line','가동률(%)','[78,82,85,88,92,90]','radar','["SMT","ASY","INS","PKG","CNC"]','[85,90,88,82,92]','%','N',530,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'FP02','FP','FP. 공장 계획','작업지시(WO) 완료율','Y','생산','일간','일간 지시(WO) 중 정시 완료 비율.','(완료 WO / 총 WO) × 100','bar','완료(%)','[92,90,95,96,98,97]','doughnut','["완료","진행","지연"]','[92,5,3]','%','N',531,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'FP03','FP','FP. 공장 계획','공정 수율 (Process Yield)','Y','품질','일간','각 공정별 양품 통과 비율. FP 는 수율 반영해 공급량 산출.','(양품 수량 / 투입 수량) × 100','line','수율(%)','[94,95,93,96,97,98]','bar_stack','["SMT","ASY","INS","PKG"]','[98,96,94,99]','%','N',532,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'FP04','FP','FP. 공장 계획','셋업 시간 비율','N','생산','주간','총 가동시간 중 셋업/교체 시간 비중.','(셋업 시간 / 총 가동 시간) × 100','bar','셋업(%)','[12,15,10,8,7,6]','bar_comp','["당주","목표"]','[6,8]','%','Y',533,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'FP05','FP','FP. 공장 계획','라인 밸런싱 지수','N','FP팀','주간','라인 간 작업량 불균형도. 낮을수록 밸런싱 우수.','σ(라인 작업량) / μ(라인 작업량) × 100','line','불균형(%)','[25,22,18,15,12,10]','bar_comp','["실적","목표이하"]','[10,15]','%','Y',534,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'FP06','FP','FP. 공장 계획','FP 실행 시간','N','FP팀','일간','FP 엔진 1회 수행 소요 시간.','엔진 종료 시각 - 시작 시각','line','시간(분)','[45,42,38,35,30,28]','bar_comp','["현재","목표이하"]','[28,30]','분','Y',535,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'FP07','FP','FP. 공장 계획','외주 가공 비율','N','생산/구매','월간','내부 CAPA 부족으로 외주로 전환된 생산량 비율.','(외주 수량 / 전체 생산) × 100','bar','외주(%)','[18,15,20,12,10,8]','pie','["내부","외주"]','[92,8]','%','Y',536,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'FP08','FP','FP. 공장 계획','공정 지연 건수','N','생산관리','일간','일간 발생한 공정 지연(Bottleneck) 건수.','일간 지연 이벤트 카운트','bar','지연(건)','[25,22,18,12,8,5]','bar_comp','["당일","목표이하"]','[5,10]','건','Y',537,'system',now());

INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(gen_random_uuid()::text,'-',''),'IM01','IM_SCM','IM. 재고 관리','안전재고 유지율 (SS)','Y','SCM/IM팀','주간','SS 기준 이상을 유지하는 품목 비율 (VW_INVENTORY_PLAN_CONFIRMED).','(SS 확보 품목 / 관리 품목) × 100','line','유지율(%)','[85,88,90,92,94,96]','doughnut','["적정","미달"]','[96,4]','%','N',540,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'IM02','IM_SCM','IM. 재고 관리','재고 회전일수 (DOS)','Y','SCM/재무','월간','Days of Stock. 현재 재고가 소진되는 예상 일수.','현재 재고 / 일평균 출고량','line','DOS(일)','[42,38,35,32,30,28]','bar_comp','["당월","목표"]','[28,30]','일','Y',541,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'IM03','IM_SCM','IM. 재고 관리','ABCXYZ 분류 분포','N','IM팀','분기','금액(ABC)×변동성(XYZ) 9개 분포. A-X 는 집중관리.','ABC 분류 × XYZ 분류','bar','건수','[45,120,80,30,90,60,15,40,50]','pie','["AX","AY","AZ","BX","BY","BZ","CX","CY","CZ"]','[12,18,10,20,25,15,18,20,15]','건','N',542,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'IM04','IM_SCM','IM. 재고 관리','Slow-moving 재고 비율','Y','IM팀','월간','60일 이상 미출고 악성 재고 비중 (VW_SLOWMOVING_STOCK).','(슬로우무빙 금액 / 총 재고 금액) × 100','bar','비율(%)','[15,12,10,8,6,5]','pie','["슬로우","정상","패스트"]','[5,70,25]','%','Y',543,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'IM05','IM_SCM','IM. 재고 관리','Obsolete (EOS) 재고','N','IM팀','분기','단종 품목 기한 지난 창고 재고 (VW_OBSOLETE_STOCK).','EOS 지난 재고 금액','bar','EOS(M)','[85,70,55,40,25,15]','bar_stack','["1개월초과","3개월초과","6개월초과"]','[30,40,30]','M','Y',544,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'IM06','IM_SCM','IM. 재고 관리','목표재고 적중률','N','IM팀','월간','설정된 목표재고 범위(±10%) 내 품목 비율.','(목표 ±10% 내 품목 / 전체) × 100','line','적중(%)','[72,78,82,85,88,92]','doughnut','["적중","과다","부족"]','[92,5,3]','%','N',545,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'IM07','IM_SCM','IM. 재고 관리','이동중 재고 (In-transit)','N','물류/IM','주간','출발 후 도착 미확인 In-transit 재고 (VW_INTRANSIT_STOCK).','이동중 재고 금액','bar','In-transit(M)','[120,135,100,85,70,90]','bar_stack','["국내","국제","창고간"]','[40,35,25]','M','N',546,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'IM08','IM_SCM','IM. 재고 관리','창고별 재고 편차','N','물류','월간','창고 간 동일 품목 재고 불균형도.','σ(창고별 재고) / μ(창고별 재고) × 100','bar','편차(%)','[35,28,22,18,15,12]','radar','["창고A","창고B","창고C","창고D","창고E"]','[85,72,92,60,78]','%','Y',547,'system',now());

INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(gen_random_uuid()::text,'-',''),'RP01','RP','RP. 보충/발주','발주 준수율','Y','구매/RP팀','주간','RP 확정 발주 대비 실제 PO 발행 비율.','(실제 PO / RP 권고 PO) × 100','line','준수(%)','[88,92,90,95,97,98]','bar_comp','["실적","목표"]','[98,95]','%','N',550,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'RP02','RP','RP. 보충/발주','ROP 위반 건수','Y','RP팀','주간','재주문점(ROP) 도달 전 발주 누락 건수.','주간 ROP 도달 & 발주 미진행 건수','bar','위반(건)','[15,12,10,8,6,4]','bar_comp','["당주","목표이하"]','[4,5]','건','Y',551,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'RP03','RP','RP. 보충/발주','EOQ 최적화 지수','N','RP팀','월간','경제적 발주량(EOQ) 대비 실제 발주량 근접도.','100 - |실제 EOQ - 권고 EOQ| / 권고 EOQ × 100','line','적중(%)','[75,80,85,88,92,95]','doughnut','["최적","과다","과소"]','[85,10,5]','%','N',552,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'RP04','RP','RP. 보충/발주','조달 LT 준수','N','구매','월간','발주 → 입고까지 표준 LT 준수 비율.','(LT 준수 건수 / 전체 PO) × 100','bar','준수(%)','[82,85,88,92,94,96]','bar_comp','["당월","목표"]','[96,95]','%','N',553,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'RP05','RP','RP. 보충/발주','긴급 발주 비율','N','RP팀','월간','표준 LT 무시한 긴급 발주 건수 비율.','(긴급 발주 / 전체 발주) × 100','line','긴급(%)','[18,15,12,10,8,6]','pie','["정상","긴급"]','[94,6]','%','Y',554,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'RP06','RP','RP. 보충/발주','자재 결품 발생률','N','자재/RP','주간','생산 투입 시점 결품 발생 비율.','(결품 건수 / 총 자재 요청) × 100','bar','결품(%)','[5.2,4.1,3.5,2.8,2.1,1.5]','bar_comp','["당주","목표이하"]','[1.5,3.0]','%','Y',555,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'RP07','RP','RP. 보충/발주','구매 단가 변동률','N','구매/재무','월간','표준 단가 대비 실제 발주 단가 차이.','(실제 - 표준) / 표준 × 100','bar','변동(%)','[1.2,0.8,-1.5,2.1,-0.8,0.5]','bar_comp','["현재","기준"]','[0.5,0]','%','N',556,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'RP08','RP','RP. 보충/발주','공급사 다변화 지수','N','구매','분기','품목당 공급사 수 (단독=1, 다변화=2+).','평균 공급사 수 / 품목','line','평균(개)','[1.5,1.8,2.0,2.2,2.5,2.8]','pie','["단독","이원화","3원화+"]','[15,40,45]','개','N',557,'system',now());

INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(gen_random_uuid()::text,'-',''),'SA01','SA_SCM','SA. 판매 분석','월별 매출 달성률','Y','영업/SA팀','월간','월간 매출 목표 대비 실제 매출 (VW_SALES_PERFORMANCE).','(실제 매출 / 목표) × 100','line','달성률(%)','[95,102,98,108,112,110]','bar_comp','["실적","목표"]','[110,100]','%','N',560,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'SA02','SA_SCM','SA. 판매 분석','제품군별 매출 기여도','Y','SA팀','월간','전체 매출 중 제품군별 기여 비율.','(제품군 매출 / 총 매출) × 100','bar','기여(%)','[35,28,18,12,7]','pie','["A군","B군","C군","D군","기타"]','[35,28,18,12,7]','%','N',561,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'SA03','SA_SCM','SA. 판매 분석','지역/채널별 매출','N','영업','월간','지역×채널 매트릭스 매출 분포.','(지역×채널 매출 / 총 매출) × 100','bar','매출(B)','[4.5,3.8,2.5,2.0,1.8,1.5]','radar','["서울","부산","대구","인천","광주"]','[85,65,45,55,40]','B','N',562,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'SA04','SA_SCM','SA. 판매 분석','매출 성장률 (YoY)','N','재무/SA','월간','전년 동월 대비 매출 증감률.','((당년 - 전년) / 전년) × 100','line','YoY(%)','[5.2,8.5,12.2,15.8,18.2,22.5]','bar_comp','["당월","전년동월"]','[122.5,100]','%','N',563,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'SA05','SA_SCM','SA. 판매 분석','상위 고객사 집중도','N','영업','분기','상위 5개 고객 매출 비중 (집중 리스크).','(상위5 매출 / 총 매출) × 100','line','집중도(%)','[68,66,65,70,72,75]','pie','["A사","B사","C사","D사","E사","기타"]','[25,20,15,10,5,25]','%','Y',564,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'SA06','SA_SCM','SA. 판매 분석','신제품 매출 비중','N','영업/NPI','월간','출시 1년 이내 신제품 매출 비중.','(신제품 매출 / 총 매출) × 100','bar','비중(%)','[8,10,12,15,18,22]','bar_comp','["당월","목표"]','[22,20]','%','N',565,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'SA07','SA_SCM','SA. 판매 분석','판매 가격 변동률','N','영업/재무','월간','표준 가격 대비 평균 판매가(할인 반영) 편차.','(판매가 - 표준가) / 표준가 × 100','bar','변동(%)','[-2.5,-1.8,-3.2,-1.5,-0.8,-1.2]','bar_stack','["정가","할인","특가"]','[60,30,10]','%','N',566,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'SA08','SA_SCM','SA. 판매 분석','매출 대비 마진율','N','재무','월간','판매 이익 / 매출 비율.','(매출총이익 / 매출) × 100','line','마진(%)','[22,24,23,25,26,28]','bar_comp','["당월","목표"]','[28,25]','%','N',567,'system',now());

-- =============================================================
-- T3Composer Dictionary — SCM KPI 확장 Seed v2 (+56 KPIs) [MSSQL]
-- =============================================================
-- 기존 SCM KPI (8×7 = 56) + S&OP(40) = 96 에
-- 각 모듈별로 8개씩 추가 (56 신규) → 총 152 KPI
--
--   BF09~BF16 (+8)  DP09~DP16 (+8)  MP09~MP16 (+8)  FP09~FP16 (+8)
--   IM09~IM16 (+8)  RP09~RP16 (+8)  SA09~SA16 (+8)
-- =============================================================

-- 재실행 대비: BF09~SA16 만 제거 (기존 BF01~SA08 은 보존)
DELETE FROM TB_IS_COMPOSER_KPI_DICT
  WHERE CODE IN (
    'BF09','BF10','BF11','BF12','BF13','BF14','BF15','BF16',
    'DP09','DP10','DP11','DP12','DP13','DP14','DP15','DP16',
    'MP09','MP10','MP11','MP12','MP13','MP14','MP15','MP16',
    'FP09','FP10','FP11','FP12','FP13','FP14','FP15','FP16',
    'IM09','IM10','IM11','IM12','IM13','IM14','IM15','IM16',
    'RP09','RP10','RP11','RP12','RP13','RP14','RP15','RP16',
    'SA09','SA10','SA11','SA12','SA13','SA14','SA15','SA16'
  );

-- ---------- [BF] Baseline Forecasting (+8) ----------
INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(gen_random_uuid()::text,'-',''),'BF09','BF','BF. 기준 예측','예측 주기별 정확도 (단기/중기/장기)','','BF팀','월간','1주/1개월/3개월/6개월 horizon 별 예측 정확도 분해.','각 horizon 별 MAPE','line','Horizon 정확도(%)','[92,88,82,78,72,68]','radar','["1주","1개월","3개월","6개월"]','[92,85,78,70]','%','',570,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'BF10','BF','BF. 기준 예측','계절성/추세 반영도','','BF팀','분기','Seasonal 패턴·Trend 감지율. STL 분해 기반.','(정확 분해 건수 / 전체 SKU) × 100','line','반영도(%)','[75,80,82,85,88,92]','pie','["Trend","Season","Residual"]','[45,35,20]','%','',571,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'BF11','BF','BF. 기준 예측','모델 실행 시간 (Run Time)','','BF팀','주간','BF 엔진 1회 Run 소요 시간. SKU 많을수록 증가.','엔진 종료 - 시작','line','시간(분)','[85,75,65,55,45,40]','bar_comp','["현재","목표이하"]','[40,60]','분','Y',572,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'BF12','BF','BF. 기준 예측','모델 재학습 주기 준수','','BF팀','월간','정해진 재학습 주기 (주간/월간) 준수 비율.','(정시 재학습 / 총 예정) × 100','bar','준수(%)','[92,94,96,98,100,100]','doughnut','["준수","지연"]','[100,0]','%','',573,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'BF13','BF','BF. 기준 예측','신규/단종 SKU 예측 처리','','BF팀','월간','NPI(신제품) 및 EOS(단종) SKU 특수 처리 비율.','(특수처리 SKU / 전체 변경) × 100','line','처리율(%)','[68,75,82,88,92,95]','bar_stack','["신규","단종","리뉴얼"]','[50,35,15]','%','',574,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'BF14','BF','BF. 기준 예측','외부 변수 영향도','','BF팀','분기','프로모션/날씨/공휴일 등 외부변수가 예측에 기여하는 정도.','설명변수의 R² 기여도','bar','기여도(%)','[15,18,25,22,28,32]','pie','["프로모션","날씨","공휴일","경쟁사","기타"]','[35,25,20,10,10]','%','',575,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'BF15','BF','BF. 기준 예측','예측 결과 안정성 (분산)','','BF팀','주간','주차별 예측값 변동 계수(CoV). 낮을수록 안정적.','σ(예측값) / μ(예측값) × 100','line','CoV(%)','[18,15,12,10,8,6]','bar_comp','["당월","목표이하"]','[6,10]','%','Y',576,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'BF16','BF','BF. 기준 예측','Backtesting 정확도','','BF팀','분기','과거 기간 재현(Backtest) MAPE. Out-of-sample 검증.','Backtest 구간 MAPE','bar','BT 정확도(%)','[85,86,88,90,92,94]','bar_comp','["Backtest","Live"]','[94,88]','%','',577,'system',now());

-- ---------- [DP] Demand Planning (+8) ----------
INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(gen_random_uuid()::text,'-',''),'DP09','DP','DP. 수요 계획','DP → MP 연계 반영률','','DP/MP팀','주간','확정 DP 가 MP 주생산계획에 반영된 비율.','(MP 에 반영된 DP 수량 / DP 총 수량) × 100','line','반영률(%)','[85,88,92,94,96,98]','doughnut','["반영","미반영"]','[98,2]','%','',580,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'DP10','DP','DP. 수요 계획','장/중/단기 DP 정확도','','DP팀','월간','3M+ (장기), 1-3M (중기), <1M (단기) horizon 별 정확도.','각 기간 MAPE','line','Horizon 정확도','[88,82,75,72,68,65]','radar','["단기(<1M)","중기(1-3M)","장기(3M+)"]','[92,82,70]','%','',581,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'DP11','DP','DP. 수요 계획','Consensus 회의 합의율','','영업/SCM','월간','월간 S&OP 회의에서 DP 확정 합의(Vote) 비율.','(합의 항목 / 회의 항목) × 100','bar','합의(%)','[78,82,85,88,92,95]','pie','["영업","마케팅","생산","재무"]','[35,25,25,15]','%','',582,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'DP12','DP','DP. 수요 계획','수요 조정 횟수','','DP팀','주간','월간 DP 확정 후 재조정(Re-plan) 건수.','월간 조정 Run 카운트','bar','조정(회)','[12,10,8,6,5,3]','bar_comp','["당월","목표이하"]','[3,5]','회','Y',583,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'DP13','DP','DP. 수요 계획','판매예측회의 결과 보관율','','DP팀','월간','회의록/의사결정 이력 공식 보관 비율.','(보관된 회의 / 전체 회의) × 100','line','보관율(%)','[85,90,92,95,98,100]','doughnut','["보관","미보관"]','[100,0]','%','',584,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'DP14','DP','DP. 수요 계획','플래너별 확정 속도','','DP팀','월간','Demand Planner 별 DP 확정 평균 일수.','평균 (확정일 - 초안일)','line','평균(일)','[8,7,6,5,5,4]','bar','플래너별(일)','[5,6,4,5,3]','일','Y',585,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'DP15','DP','DP. 수요 계획','긴급/VIP 수요 처리율','','영업/DP','주간','긴급 오더 (Hot Order) 또는 핵심 고객 수요 반영 비율.','(반영 긴급수요 / 전체 긴급요청) × 100','bar','처리율(%)','[85,88,92,95,98,100]','pie','["정상","긴급","VIP"]','[80,15,5]','%','',586,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'DP16','DP','DP. 수요 계획','수요변동성 (CoV)','','DP팀','월간','수요 변동 계수 = σ/μ. 높을수록 예측 난이도 상승.','σ(수요) / μ(수요) × 100','line','CoV(%)','[25,22,28,20,18,15]','radar','["A군","B군","C군","D군"]','[12,18,28,35]','%','Y',587,'system',now());

-- ---------- [MP] Master Planning (+8) ----------
INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(gen_random_uuid()::text,'-',''),'MP09','MP','MP. 주생산 계획','MRP 전개 정확도','','MP팀/자재','주간','MP → MRP 자재 소요 전개 정확도.','(정확 전개 / 전체 BOM 계산) × 100','line','정확도(%)','[90,92,94,96,98,99]','doughnut','["정확","오류"]','[99,1]','%','',590,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'MP10','MP','MP. 주생산 계획','다거점(Multi-site) 할당 비율','','MP팀','주간','다공장 체계에서 거점 간 생산 할당 분포.','각 거점별 생산량 / 총량','bar','거점(%)','[40,30,20,8,2]','pie','["공장A","공장B","공장C","공장D","외주"]','[40,30,20,8,2]','%','',591,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'MP11','MP','MP. 주생산 계획','평준화(Heijunka) 지수','','MP팀','주간','일별 생산량 변동성. 낮을수록 Heijunka 우수.','σ(일간 생산) / μ × 100','line','변동성(%)','[22,18,15,12,10,8]','bar_comp','["실적","목표이하"]','[8,12]','%','Y',592,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'MP12','MP','MP. 주생산 계획','대체 라인 활용률','','MP팀','월간','주 라인 대신 대체 라인에 배정된 생산 비율.','(대체 배정 / 전체 배정) × 100','bar','대체(%)','[12,15,10,8,7,5]','pie','["주라인","대체라인","외주"]','[85,10,5]','%','Y',593,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'MP13','MP','MP. 주생산 계획','ATP 응답 속도','Y','MP/영업','일간','Available-To-Promise 문의 평균 응답 시간.','요청 → 응답 평균 분','line','응답(분)','[8,6,4,3,2,1]','bar_comp','["당월","목표이하"]','[1,3]','분','Y',594,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'MP14','MP','MP. 주생산 계획','CTP 적중률','','MP팀','월간','Capable-To-Promise 예측 납기 적중률.','(적중 건수 / CTP 약속 건수) × 100','line','적중(%)','[80,85,90,92,94,96]','doughnut','["적중","지연"]','[96,4]','%','',595,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'MP15','MP','MP. 주생산 계획','Lot Sizing 최적화','','MP팀','월간','경제적 로트 크기 (EOQ/POQ) 대비 실제 배치 근접도.','100 - |실제 - 최적| / 최적 × 100','line','적중(%)','[75,82,88,92,95,97]','bar_comp','["실적","이상치"]','[97,100]','%','',596,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'MP16','MP','MP. 주생산 계획','Pegging 적중률','','MP팀','주간','수요-공급 매칭(Pegging) 정확도.','(정확 Pegging / 전체 오더) × 100','bar','적중(%)','[88,90,92,94,96,98]','pie','["Hard","Soft","Unpegged"]','[70,25,5]','%','',597,'system',now());

-- ---------- [FP] Factory Planning (+8) ----------
INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(gen_random_uuid()::text,'-',''),'FP09','FP','FP. 공장 계획','Tact Time 준수율','','생산','일간','라인별 표준 Tact Time 대비 실제 사이클 준수 비율.','(표준 Tact 내 / 전체 생산) × 100','line','준수(%)','[88,90,92,94,96,97]','bar_comp','["실적","표준"]','[97,100]','%','',600,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'FP10','FP','FP. 공장 계획','설비 MTBF','Y','설비관리','월간','Mean Time Between Failures. 고장 간격 평균 시간.','총 가동시간 / 고장 횟수','line','MTBF(시간)','[420,450,480,520,560,600]','bar','라인별','[580,420,620,560,500]','시간','',601,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'FP11','FP','FP. 공장 계획','설비 MTTR','','설비관리','월간','Mean Time To Repair. 고장 수리 평균 시간.','총 수리시간 / 수리 횟수','line','MTTR(분)','[85,75,65,55,45,38]','bar_comp','["당월","목표이하"]','[38,60]','분','Y',602,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'FP12','FP','FP. 공장 계획','에너지 효율 (kWh/EA)','','설비/환경','월간','단위 생산당 전력 소모량. ESG 지표.','총 kWh / 총 생산 EA','line','kWh/EA','[0.35,0.32,0.30,0.28,0.26,0.25]','bar_comp','["당월","목표이하"]','[0.25,0.30]','kWh','Y',603,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'FP13','FP','FP. 공장 계획','작업자 생산성','','생산관리','월간','작업자 1인당 시간당 생산량.','총 생산 / (작업자 × 가동시간)','line','EA/인·시','[45,48,52,55,58,62]','bar','라인별','[62,55,68,50,58]','EA','',604,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'FP14','FP','FP. 공장 계획','생산 처리량 (Throughput)','','생산관리','일간','병목 설비 기준 일간 처리량.','24시간 / 병목 Tact × 가용률','line','EA/일','[4500,4800,5000,5200,5500,5800]','bar_comp','["실적","목표"]','[5800,5500]','EA','',605,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'FP15','FP','FP. 공장 계획','신제품 Ramp-up 시간','','생산/NPI','분기','신제품 양산 시작 → 안정 생산까지 소요 주수.','안정화 시점 - 양산 개시','line','주(Wk)','[12,10,8,7,6,5]','bar_comp','["현재","목표이하"]','[5,8]','주','Y',606,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'FP16','FP','FP. 공장 계획','SEQ 순서 최적화','','FP팀','일간','생산 순서(색상/모델) 최적 배열 비율.','(최적 순서 건수 / 전체) × 100','bar','최적(%)','[72,78,82,85,88,92]','pie','["최적","허용","재검토"]','[85,12,3]','%','',607,'system',now());

-- ---------- [IM_SCM] Inventory (+8) ----------
INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(gen_random_uuid()::text,'-',''),'IM09','IM_SCM','IM. 재고 관리','Cycle Count 정확도','Y','창고/IM','주간','순환 실사 (Cycle Count) 전산-실물 일치율.','(일치 건수 / 실사 건수) × 100','line','정확도(%)','[95,96,97,98,99,99.5]','doughnut','["일치","불일치"]','[99.5,0.5]','%','',610,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'IM10','IM_SCM','IM. 재고 관리','FIFO 준수율','','물류','주간','선입선출(First-In-First-Out) 원칙 준수 비율.','(FIFO 출고 / 전체 출고) × 100','bar','준수(%)','[88,92,94,96,98,99]','pie','["FIFO","LIFO","기타"]','[95,3,2]','%','',611,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'IM11','IM_SCM','IM. 재고 관리','재고 분산 (창고간 균형)','','물류','월간','창고 간 동일 품목 재고 불균형 해소도.','100 - CoV(창고별 재고) × 100','line','균형도(%)','[65,72,78,82,85,88]','radar','["창고A","창고B","창고C","창고D"]','[88,75,92,70]','%','',612,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'IM12','IM_SCM','IM. 재고 관리','Shrinkage 손실 비율','','창고','월간','파손/분실 재고 손실 (Shrinkage) 비율.','(손실 금액 / 재고 금액) × 100','line','손실(%)','[2.5,2.0,1.5,1.2,0.8,0.5]','bar_comp','["실적","허용"]','[0.5,1.0]','%','Y',613,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'IM13','IM_SCM','IM. 재고 관리','계절 재고 적중률','','IM/영업','분기','성수기 준비 재고 적정량 유지 비율.','(적정 유지 / 계절재고 품목) × 100','bar','적중(%)','[68,75,82,85,90,92]','pie','["적정","과다","부족"]','[88,8,4]','%','',614,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'IM14','IM_SCM','IM. 재고 관리','대체창고 활용률','','물류','주간','주 창고 캐파 초과 시 대체창고로 이관 비율.','(대체창고 재고 / 전체) × 100','line','대체(%)','[15,18,12,10,8,5]','doughnut','["주창고","대체","외부임대"]','[90,8,2]','%','Y',615,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'IM15','IM_SCM','IM. 재고 관리','보관 조건별 (냉장/냉동) 관리','','창고','일간','특수 보관 (냉장/냉동/위험물) 조건 준수율.','(조건 준수 / 특수 품목) × 100','line','준수(%)','[95,96,97,98,99,100]','pie','["상온","냉장","냉동","위험물"]','[70,15,10,5]','%','',616,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'IM16','IM_SCM','IM. 재고 관리','유통기한 임박 (Expiry) 재고','','IM','주간','유통기한 30일 이내 재고 금액.','기한 30일↓ 재고 금액','bar','임박재고(M)','[45,38,32,25,18,12]','bar_stack','["7일↓","7-15일","15-30일"]','[3,5,10]','M','Y',617,'system',now());

-- ---------- [RP] Replenishment (+8) ----------
INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(gen_random_uuid()::text,'-',''),'RP09','RP','RP. 보충/발주','Kanban 신호 지연','','자재/RP','일간','Kanban 신호 → 실제 보충까지 지연 건수.','일간 지연 Kanban 건수','bar','지연(건)','[15,12,8,6,4,2]','bar_comp','["당일","목표이하"]','[2,5]','건','Y',620,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'RP10','RP','RP. 보충/발주','JIT 준수율','Y','구매/RP','주간','Just-In-Time 배송 (±2H) 준수 비율.','(정시 배송 / 전체) × 100','line','JIT(%)','[82,85,88,92,95,97]','pie','["정시","조기","지연"]','[92,5,3]','%','',621,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'RP11','RP','RP. 보충/발주','VMI 커버리지','','구매','월간','Vendor-Managed Inventory 대상 자재 비율.','(VMI 자재 / 전체 자재) × 100','line','VMI(%)','[25,30,35,40,45,50]','pie','["VMI","직접관리"]','[50,50]','%','',622,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'RP12','RP','RP. 보충/발주','자재 표준화율','','구매/설계','분기','표준 자재로 관리되는 품목 비율.','(표준 자재 / 전체) × 100','line','표준화(%)','[55,62,68,72,78,82]','doughnut','["표준","특주","단종"]','[82,15,3]','%','',623,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'RP13','RP','RP. 보충/발주','장기계약(LTA) 비율','','구매','분기','장기계약(1년+) 자재 구매액 비중.','(LTA 구매액 / 총 구매액) × 100','bar','LTA(%)','[45,52,58,65,72,78]','pie','["LTA","Spot","Frame"]','[78,15,7]','%','',624,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'RP14','RP','RP. 보충/발주','Spot Buy 비율','','구매','월간','단건 긴급 구매 (Spot) 비율.','(Spot 건수 / 전체 발주) × 100','line','Spot(%)','[18,15,12,10,8,6]','bar_comp','["당월","목표이하"]','[6,10]','%','Y',625,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'RP15','RP','RP. 보충/발주','대체 자재 활용률','','구매/설계','월간','결품 시 대체(Substitute) 자재로 전환 비율.','(대체사용 / 결품대상) × 100','bar','활용(%)','[55,62,68,72,78,82]','pie','["원자재","대체","외주"]','[85,12,3]','%','',626,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'RP16','RP','RP. 보충/발주','구매 자동화 (E-Procurement)','','구매','분기','시스템 자동 발주 비율. 수기 PO 제외.','(자동 PO / 전체 PO) × 100','line','자동화(%)','[45,55,65,72,80,88]','doughnut','["자동","수기"]','[88,12]','%','',627,'system',now());

-- ---------- [SA_SCM] Sales Analysis (+8) ----------
INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(gen_random_uuid()::text,'-',''),'SA09','SA_SCM','SA. 판매 분석','제품 마진 편차','','재무/SA','월간','제품 간 마진율 편차. 높을수록 포트폴리오 불균형.','σ(제품 마진) / μ × 100','line','편차(%)','[28,25,22,20,18,15]','bar','제품군 마진','[32,28,22,18,15]','%','Y',630,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'SA10','SA_SCM','SA. 판매 분석','Sell-in vs Sell-out 갭','Y','SA/영업','주간','제조사 출하(Sell-in) vs 최종판매(Sell-out) 갭.','(Sell-in - Sell-out) / Sell-out × 100','line','갭(%)','[15,12,10,8,5,3]','bar_comp','["Sell-in","Sell-out"]','[103,100]','%','Y',631,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'SA11','SA_SCM','SA. 판매 분석','반품률 (Return Rate)','','영업/품질','월간','판매 대비 반품 건수 비율.','(반품 / 판매) × 100','line','반품률(%)','[3.5,3.0,2.8,2.2,1.8,1.5]','pie','["품질","오배송","주문취소","기타"]','[40,20,25,15]','%','Y',632,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'SA12','SA_SCM','SA. 판매 분석','고객 이탈률 (Churn)','','영업/CRM','분기','지난 분기 거래 후 이번 분기 미거래 고객 비율.','(이탈 고객 / 전분기 활동 고객) × 100','line','Churn(%)','[8,7,6,5,4,3]','bar_comp','["당분기","목표이하"]','[3,5]','%','Y',633,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'SA13','SA_SCM','SA. 판매 분석','시장 점유율 (Market Share)','Y','영업/전략','분기','자사 매출 / 시장 전체 규모.','자사 매출 / 시장규모 × 100','line','점유율(%)','[18,19,21,23,25,28]','pie','["자사","경쟁사A","경쟁사B","기타"]','[28,35,22,15]','%','',634,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'SA14','SA_SCM','SA. 판매 분석','채널별 수익성','','영업/재무','월간','온라인/오프라인/대리점 채널별 마진율 비교.','채널별 이익 / 채널별 매출 × 100','bar','마진(%)','[22,18,15,28,12]','radar','["온라인","오프라인","대리점","직판","수출"]','[28,18,15,32,22]','%','',635,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'SA15','SA_SCM','SA. 판매 분석','프로모션 ROI','','마케팅/재무','월간','프로모션 비용 대비 매출 증가 효과.','(프로모션 증가 매출 - 비용) / 비용 × 100','bar','ROI(%)','[180,220,250,280,320,350]','pie','["수익","BEP","손실"]','[70,20,10]','%','',636,'system',now()),
(REPLACE(gen_random_uuid()::text,'-',''),'SA16','SA_SCM','SA. 판매 분석','고객 만족도 (NPS)','','영업/CS','분기','Net Promoter Score. 추천 의향 설문 점수.','추천자% - 비추천자%','line','NPS','[35,42,48,52,58,65]','pie','["추천(9-10)","중립(7-8)","비추천(0-6)"]','[65,20,15]','','',637,'system',now());


-- =============================================================
-- 결과 확인
-- =============================================================
SELECT CATEGORY_CD, CATEGORY_NAME, COUNT(*) AS CNT
  FROM TB_IS_COMPOSER_KPI_DICT
 GROUP BY CATEGORY_CD, CATEGORY_NAME
 ORDER BY CATEGORY_CD;

SELECT COUNT(*) AS TOTAL_KPIS FROM TB_IS_COMPOSER_KPI_DICT;

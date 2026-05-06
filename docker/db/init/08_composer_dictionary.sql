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
IF OBJECT_ID('dbo.TB_IS_COMPOSER_GRID_TYPE', 'U') IS NOT NULL
    DROP TABLE T3SMARTSCM.dbo.TB_IS_COMPOSER_GRID_TYPE;

CREATE TABLE T3SMARTSCM.dbo.TB_IS_COMPOSER_GRID_TYPE (
    ID               VARCHAR(32)   NOT NULL,
    CODE             VARCHAR(30)   NOT NULL,
    CATEGORY         VARCHAR(40)   NULL,             -- BASIC | ADVANCED | EDIT | TREE | PIVOT | SPECIAL
    NAME             NVARCHAR(200) NOT NULL,
    NAME_EN          NVARCHAR(200) NULL,
    DESCRIPTION      NVARCHAR(MAX) NULL,
    LAYOUT_KEY       VARCHAR(80)   NULL,             -- 미리보기 렌더러 키
    COMPONENT_STACK  NVARCHAR(500) NULL,             -- 사용 컴포넌트 (RealGrid2/TreeGrid/PivotTable 등)
    PROPERTIES       NVARCHAR(MAX) NULL,             -- JSON 설정 (편집/체크/고정컬럼 등 flag)
    SAMPLE_COLUMNS   NVARCHAR(MAX) NULL,             -- JSON : [{name,header,dataType,width,visible}, ...]
    SAMPLE_ROWS      NVARCHAR(MAX) NULL,             -- JSON : [[...], [...], ...]
    RECOMMENDED_FOR  NVARCHAR(500) NULL,
    SORT_ORDER       INT           DEFAULT 0 NULL,
    USE_YN           CHAR(1)       DEFAULT 'Y' NULL,
    CREATE_BY        NVARCHAR(100) NULL,
    CREATE_DTTM      DATETIME      DEFAULT GETDATE() NULL,
    MODIFY_BY        NVARCHAR(100) NULL,
    MODIFY_DTTM      DATETIME      NULL,
    CONSTRAINT PK_TB_IS_COMPOSER_GRID_TYPE PRIMARY KEY (ID),
    CONSTRAINT UQ_TB_IS_COMPOSER_GRID_TYPE UNIQUE (CODE)
);

CREATE NONCLUSTERED INDEX IX_TB_IS_COMPOSER_GRID_TYPE_CAT ON T3SMARTSCM.dbo.TB_IS_COMPOSER_GRID_TYPE (CATEGORY);
EXEC T3SMARTSCM.sys.sp_addextendedproperty @name = N'MS_Description',
    @value = N'T3Composer Grid 유형 사전 (RealGrid2/TreeGrid/PivotTable 등 Grid 변형)',
    @level0type = N'Schema', @level0name = N'dbo',
    @level1type = N'Table',  @level1name = N'TB_IS_COMPOSER_GRID_TYPE';


-- -------------------------------------------------------------
-- 2) TB_IS_COMPOSER_CHART_TYPE
-- -------------------------------------------------------------
IF OBJECT_ID('dbo.TB_IS_COMPOSER_CHART_TYPE', 'U') IS NOT NULL
    DROP TABLE T3SMARTSCM.dbo.TB_IS_COMPOSER_CHART_TYPE;

CREATE TABLE T3SMARTSCM.dbo.TB_IS_COMPOSER_CHART_TYPE (
    ID               VARCHAR(32)   NOT NULL,
    CODE             VARCHAR(30)   NOT NULL,
    CATEGORY         VARCHAR(40)   NULL,             -- BAR | LINE | AREA | PIE | RADAR | SCATTER | COMBO | SCALE
    NAME             NVARCHAR(200) NOT NULL,
    NAME_EN          NVARCHAR(200) NULL,
    DESCRIPTION      NVARCHAR(MAX) NULL,
    CHART_TYPE       VARCHAR(30)   NOT NULL,          -- Chart.js type (bar/line/pie/radar/...)
    OPTIONS_JSON     NVARCHAR(MAX) NULL,              -- Chart.js options JSON
    SAMPLE_DATA      NVARCHAR(MAX) NULL,              -- { labels: [...], datasets: [{...}] }
    PREVIEW_COLOR    VARCHAR(20)   NULL,
    COMPONENT_STACK  NVARCHAR(500) NULL,              -- ChartComponent / react-chartjs-2 / EqualizerBarChart / GanttChart
    RECOMMENDED_FOR  NVARCHAR(500) NULL,
    SORT_ORDER       INT           DEFAULT 0 NULL,
    USE_YN           CHAR(1)       DEFAULT 'Y' NULL,
    CREATE_BY        NVARCHAR(100) NULL,
    CREATE_DTTM      DATETIME      DEFAULT GETDATE() NULL,
    MODIFY_BY        NVARCHAR(100) NULL,
    MODIFY_DTTM      DATETIME      NULL,
    CONSTRAINT PK_TB_IS_COMPOSER_CHART_TYPE PRIMARY KEY (ID),
    CONSTRAINT UQ_TB_IS_COMPOSER_CHART_TYPE UNIQUE (CODE)
);

CREATE NONCLUSTERED INDEX IX_TB_IS_COMPOSER_CHART_TYPE_CAT ON T3SMARTSCM.dbo.TB_IS_COMPOSER_CHART_TYPE (CATEGORY);
EXEC T3SMARTSCM.sys.sp_addextendedproperty @name = N'MS_Description',
    @value = N'T3Composer Chart 유형 사전 (Chart.js 기반 60+ 변형)',
    @level0type = N'Schema', @level0name = N'dbo',
    @level1type = N'Table',  @level1name = N'TB_IS_COMPOSER_CHART_TYPE';


-- -------------------------------------------------------------
-- 3) TB_IS_COMPOSER_KPI_DICT
-- -------------------------------------------------------------
IF OBJECT_ID('dbo.TB_IS_COMPOSER_KPI_DICT', 'U') IS NOT NULL
    DROP TABLE T3SMARTSCM.dbo.TB_IS_COMPOSER_KPI_DICT;

CREATE TABLE T3SMARTSCM.dbo.TB_IS_COMPOSER_KPI_DICT (
    ID               VARCHAR(32)   NOT NULL,
    CODE             VARCHAR(30)   NOT NULL,
    CATEGORY_CD      VARCHAR(40)   NULL,             -- SALES | PROD | INV | PUR | FIN
    CATEGORY_NAME    NVARCHAR(100) NULL,             -- '1. 영업/수요' 등
    NAME             NVARCHAR(200) NOT NULL,         -- 한글 지표명
    NAME_EN          NVARCHAR(200) NULL,
    IS_MAIN          CHAR(1)       DEFAULT 'N' NULL, -- Y: 주요지표, N: 서브
    DEPARTMENT       NVARCHAR(100) NULL,             -- 담당 부서
    FREQUENCY        NVARCHAR(50)  NULL,             -- 집계 주기
    DESCRIPTION      NVARCHAR(MAX) NULL,
    FORMULA          NVARCHAR(MAX) NULL,             -- 산출 공식
    CHART1_TYPE      VARCHAR(30)   NULL,             -- line/bar/...
    CHART1_LABEL     NVARCHAR(200) NULL,
    CHART1_DATA      NVARCHAR(MAX) NULL,             -- JSON array
    CHART2_TYPE      VARCHAR(30)   NULL,
    CHART2_LABEL     NVARCHAR(500) NULL,
    CHART2_DATA      NVARCHAR(MAX) NULL,
    CHART2_UNIT      VARCHAR(20)   NULL,
    TARGET_VALUE     NVARCHAR(100) NULL,
    IS_REVERSE_GAP   CHAR(1)       DEFAULT 'N' NULL, -- Y: 낮을수록 좋음
    SORT_ORDER       INT           DEFAULT 0 NULL,
    USE_YN           CHAR(1)       DEFAULT 'Y' NULL,
    CREATE_BY        NVARCHAR(100) NULL,
    CREATE_DTTM      DATETIME      DEFAULT GETDATE() NULL,
    MODIFY_BY        NVARCHAR(100) NULL,
    MODIFY_DTTM      DATETIME      NULL,
    CONSTRAINT PK_TB_IS_COMPOSER_KPI_DICT PRIMARY KEY (ID),
    CONSTRAINT UQ_TB_IS_COMPOSER_KPI_DICT UNIQUE (CODE)
);

CREATE NONCLUSTERED INDEX IX_TB_IS_COMPOSER_KPI_DICT_CAT ON T3SMARTSCM.dbo.TB_IS_COMPOSER_KPI_DICT (CATEGORY_CD);
EXEC T3SMARTSCM.sys.sp_addextendedproperty @name = N'MS_Description',
    @value = N'T3Composer S&OP KPI 사전 (40 KPI × 5 카테고리)',
    @level0type = N'Schema', @level0name = N'dbo',
    @level1type = N'Table',  @level1name = N'TB_IS_COMPOSER_KPI_DICT';


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
    REPLACE(NEWID(), '-', ''),
    ID,
    N'UI_UT_COMPOSER_DICT',
    N'/util/t3composerdict',
    4,
    'Y', N'system', CONVERT(DATE, '1970-01-01'),
    N'/util/T3ComposerDict'
FROM TB_AD_MENU WHERE MENU_CD = 'MENU_UT_T3COMPOSER';

DELETE FROM TB_AD_LANG_PACK WHERE LANG_KEY = 'UI_UT_COMPOSER_DICT';
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM) VALUES
('ko', 'UI_UT_COMPOSER_DICT', N'Composer 갤러리',      N'system', GETDATE()),
('en', 'UI_UT_COMPOSER_DICT', N'Composer Gallery',     N'system', GETDATE()),
('ja', 'UI_UT_COMPOSER_DICT', N'コンポーザーギャラリー', N'system', GETDATE()),
('zh', 'UI_UT_COMPOSER_DICT', N'生成器画廊',            N'system', GETDATE());


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
(REPLACE(NEWID(),'-',''), 'G01', 'BASIC', N'기본 그리드', N'Basic Grid', N'가장 일반적인 단일 그리드. 조회·정렬·열 리사이즈 기본 제공.', 'grid_basic', 'BaseGrid (RealGrid2)',
 N'{"sortable":true,"resizable":true,"selectable":true}',
 N'[{"name":"CODE","header":"코드","dataType":"text","width":80},{"name":"NAME","header":"명칭","dataType":"text","width":160},{"name":"QTY","header":"수량","dataType":"number","width":80},{"name":"STATUS","header":"상태","dataType":"text","width":80}]',
 N'[["A001","품목 A",100,"정상"],["A002","품목 B",80,"대기"],["A003","품목 C",150,"정상"],["A004","품목 D",45,"완료"]]',
 N'기본 CRUD, 마스터 조회', 10, N'system', GETDATE()),

(REPLACE(NEWID(),'-',''), 'G02', 'BASIC', N'체크박스 그리드', N'Grid with Checkbox', N'다중 선택 가능한 체크박스 컬럼 제공. 일괄 처리에 사용.', 'grid_checkbox', 'BaseGrid + CheckColumn',
 N'{"checkable":true,"checkAll":true,"multiSelect":true}',
 N'[{"name":"CHK","header":"","dataType":"check","width":30},{"name":"CODE","header":"코드","dataType":"text","width":80},{"name":"NAME","header":"명칭","dataType":"text","width":160},{"name":"PRICE","header":"단가","dataType":"number","width":100}]',
 N'[[true,"A001","품목 A",12000],[false,"A002","품목 B",8500],[true,"A003","품목 C",15000]]',
 N'다중 선택·일괄 삭제', 20, N'system', GETDATE()),

(REPLACE(NEWID(),'-',''), 'G03', 'BASIC', N'합계 행 그리드', N'Grid with Footer Sum', N'하단 고정 합계 행. 숫자 컬럼 자동 집계.', 'grid_footer_sum', 'BaseGrid + FooterRow',
 N'{"footer":true,"footerAgg":["sum","avg"]}',
 N'[{"name":"ITEM","header":"품목","dataType":"text","width":120},{"name":"QTY","header":"수량","dataType":"number","width":80},{"name":"AMT","header":"금액","dataType":"number","width":120}]',
 N'[["품목 A",100,1200000],["품목 B",80,680000],["품목 C",150,2250000],["합계",330,4130000]]',
 N'회계·금액 리포트', 30, N'system', GETDATE()),

(REPLACE(NEWID(),'-',''), 'G04', 'BASIC', N'행번호 그리드', N'Grid with Row Number', N'좌측 자동 행번호(RowNum) 표시.', 'grid_rownum', 'BaseGrid + RowNumColumn',
 N'{"rowNumber":true}',
 N'[{"name":"NO","header":"No","dataType":"number","width":40},{"name":"CODE","header":"코드","dataType":"text","width":80},{"name":"NAME","header":"명칭","dataType":"text","width":160}]',
 N'[[1,"A001","품목 A"],[2,"A002","품목 B"],[3,"A003","품목 C"],[4,"A004","품목 D"]]',
 N'순번 강조 리스트', 40, N'system', GETDATE()),

-- ADVANCED
(REPLACE(NEWID(),'-',''), 'G05', 'ADVANCED', N'고정 컬럼 그리드', N'Grid with Fixed Column', N'좌측 N개 컬럼 고정(Freeze). 가로 스크롤 시 고정.', 'grid_fixed_col', 'BaseGrid + fixedOptions',
 N'{"fixedColumnCount":2}',
 N'[{"name":"CODE","header":"코드","dataType":"text","width":80,"fixed":true},{"name":"NAME","header":"명칭","dataType":"text","width":140,"fixed":true},{"name":"M1","header":"1월","dataType":"number","width":80},{"name":"M2","header":"2월","dataType":"number","width":80},{"name":"M3","header":"3월","dataType":"number","width":80}]',
 N'[["A001","품목 A",100,120,110],["A002","품목 B",80,75,90],["A003","품목 C",150,160,145]]',
 N'월별·연별 시계열 리포트', 50, N'system', GETDATE()),

(REPLACE(NEWID(),'-',''), 'G06', 'ADVANCED', N'그룹 헤더 그리드', N'Grid with Grouping Header', N'여러 컬럼을 상위 그룹 헤더로 묶어 표시.', 'grid_grouping', 'BaseGrid + columnGroup',
 N'{"groupHeader":true}',
 N'[{"name":"ITEM","header":"품목","width":120},{"group":"1분기","children":[{"name":"Q1M1","header":"1월","width":60},{"name":"Q1M2","header":"2월","width":60},{"name":"Q1M3","header":"3월","width":60}]},{"group":"2분기","children":[{"name":"Q2M1","header":"4월","width":60},{"name":"Q2M2","header":"5월","width":60}]}]',
 N'[["품목 A",100,120,110,130,105],["품목 B",80,75,90,85,88]]',
 N'계획 리포트·복합 헤더', 60, N'system', GETDATE()),

(REPLACE(NEWID(),'-',''), 'G07', 'ADVANCED', N'필터 로우 그리드', N'Grid with Filter Row', N'컬럼 헤더 바로 아래 인라인 필터 입력 행.', 'grid_filter_row', 'BaseGrid + filterRow',
 N'{"filterRow":true,"perColumnFilter":true}',
 N'[{"name":"CODE","header":"코드","width":80,"filter":"text"},{"name":"NAME","header":"명칭","width":160,"filter":"text"},{"name":"QTY","header":"수량","width":80,"filter":"range"}]',
 N'[["A001","품목 A",100],["A002","품목 B",80],["A003","품목 C",150],["A004","품목 D",45]]',
 N'대용량 검색·필터', 70, N'system', GETDATE()),

(REPLACE(NEWID(),'-',''), 'G08', 'ADVANCED', N'페이지네이션 그리드', N'Grid with Pagination', N'서버/클라이언트 페이지네이션.', 'grid_pagination', 'BaseGrid + Pagination',
 N'{"paging":true,"pageSize":20}',
 N'[{"name":"CODE","header":"코드","width":80},{"name":"NAME","header":"명칭","width":160},{"name":"DT","header":"등록일","width":110}]',
 N'[["A001","품목 A","2024-01-01"],["A002","품목 B","2024-01-02"],["A003","품목 C","2024-01-03"]]',
 N'대용량 리스트·게시판형', 80, N'system', GETDATE()),

(REPLACE(NEWID(),'-',''), 'G09', 'ADVANCED', N'셀 병합 그리드', N'Grid with Cell Merge', N'같은 값 연속 셀 자동 병합(rowSpan).', 'grid_cell_merge', 'BaseGrid + cellMerge',
 N'{"cellMerge":true,"mergeColumns":["DEPT","CATEGORY"]}',
 N'[{"name":"DEPT","header":"부서","width":100},{"name":"CATEGORY","header":"분류","width":100},{"name":"ITEM","header":"품목","width":160}]',
 N'[["생산","A군","품목 A"],["생산","A군","품목 B"],["생산","B군","품목 C"],["품질","A군","품목 D"]]',
 N'계층적 리포트', 90, N'system', GETDATE()),

-- EDIT
(REPLACE(NEWID(),'-',''), 'G10', 'EDIT', N'인라인 편집 그리드', N'Inline Editable Grid', N'셀 더블클릭으로 즉시 편집. 편집 셀 하이라이트.', 'grid_inline_edit', 'BaseGrid + editable',
 N'{"editable":true,"editOn":"dblclick","dirtyTracking":true}',
 N'[{"name":"CODE","header":"코드","width":80},{"name":"NAME","header":"명칭","width":160,"editable":true},{"name":"QTY","header":"수량","width":80,"editable":true},{"name":"USE_YN","header":"사용","width":60,"editor":"check"}]',
 N'[["A001","품목 A",100,true],["A002","품목 B",80,true],["A003","품목 C",150,false]]',
 N'마스터 CRUD 화면', 100, N'system', GETDATE()),

(REPLACE(NEWID(),'-',''), 'G11', 'EDIT', N'드롭다운 편집 그리드', N'Dropdown Edit Grid', N'셀 내부에 드롭다운(select) 에디터.', 'grid_dropdown_edit', 'BaseGrid + dropDownEditor',
 N'{"dropDownColumn":true}',
 N'[{"name":"ITEM","header":"품목","width":140},{"name":"STATUS","header":"상태","width":100,"editor":"dropdown","values":["대기","진행","완료"]},{"name":"OWNER","header":"담당자","width":100,"editor":"dropdown"}]',
 N'[["품목 A","진행","김철수"],["품목 B","대기","이영희"],["품목 C","완료","박민준"]]',
 N'상태·담당자 선택 편집', 110, N'system', GETDATE()),

(REPLACE(NEWID(),'-',''), 'G12', 'EDIT', N'행 드래그 그리드', N'Row Drag & Drop Grid', N'행 순서 드래그 앤 드롭 변경.', 'grid_row_drag', 'BaseGrid + rowDrag',
 N'{"rowDrag":true,"dragHandle":true}',
 N'[{"name":"SEQ","header":"순번","width":40},{"name":"ITEM","header":"항목","width":180},{"name":"PRIORITY","header":"우선순위","width":80}]',
 N'[[1,"작업 A","HIGH"],[2,"작업 B","MID"],[3,"작업 C","LOW"]]',
 N'우선순위·랭킹 편집', 120, N'system', GETDATE()),

-- TREE
(REPLACE(NEWID(),'-',''), 'G13', 'TREE', N'트리 그리드', N'Tree Grid (Hierarchical)', N'계층 데이터 트리 전개. 부모-자식 노드 표시.', 'grid_tree', 'TreeGrid',
 N'{"hierarchical":true,"expandLevel":2}',
 N'[{"name":"NODE","header":"노드","width":240,"treeColumn":true},{"name":"TYPE","header":"유형","width":80},{"name":"COUNT","header":"건수","width":80}]',
 N'[["▼ 공장A","GROUP",150],["  ▼ 라인 1","LINE",60],["    · 설비 A1","EQP",20],["    · 설비 A2","EQP",40],["  ▶ 라인 2","LINE",50],["▶ 공장B","GROUP",80]]',
 N'BOM·메뉴·조직도', 130, N'system', GETDATE()),

(REPLACE(NEWID(),'-',''), 'G14', 'TREE', N'체크 가능 트리', N'Checkable TreeGrid', N'계층 노드별 체크박스 선택 (자동 부모/자식 연동).', 'grid_tree_check', 'TreeGrid + checkable',
 N'{"hierarchical":true,"checkable":true,"cascadeCheck":true}',
 N'[{"name":"CHK","header":"","dataType":"check","width":30},{"name":"NODE","header":"노드","width":240,"treeColumn":true},{"name":"ROLE","header":"권한","width":100}]',
 N'[[true,"▼ 사용자 그룹","-"],[true,"  · 김철수","ADMIN"],[false,"  · 이영희","USER"],[true,"▶ 외부 파트너","-"]]',
 N'권한·트리 선택', 140, N'system', GETDATE()),

-- PIVOT
(REPLACE(NEWID(),'-',''), 'G15', 'PIVOT', N'크로스탭 피벗', N'Pivot Table (D/M/P/V)', N'Dimension/Measure/Pivot/Value 4가지 컬럼 타입으로 구성되는 피벗.', 'grid_pivot', 'PivotTable',
 N'{"columnTypes":["D","M","P","V"]}',
 N'[{"type":"D","name":"REGION","header":"지역","width":80},{"type":"D","name":"ITEM","header":"품목","width":120},{"type":"M","name":"MEASURE","header":"지표","width":80},{"type":"P","name":"DATE_","header":"기간 (피벗)"},{"type":"V","name":"VALUE","header":"값","width":80}]',
 N'[["서울","A","계획","2024-01",100],["서울","A","계획","2024-02",120],["서울","A","실적","2024-01",95],["부산","B","계획","2024-01",80]]',
 N'다차원 분석', 150, N'system', GETDATE()),

(REPLACE(NEWID(),'-',''), 'G16', 'PIVOT', N'시간 버킷 피벗', N'Time-Bucket Pivot', N'iteration 으로 날짜 컬럼 동적 생성. DP/MP/RP 에 가장 많이 사용.', 'grid_time_pivot', 'BaseGrid + iteration columns',
 N'{"iteration":{"prefix":"DATE_","delimiter":"-"}}',
 N'[{"name":"ITEM","header":"품목","width":120},{"name":"MEASURE","header":"지표","width":80},{"iteration":{"prefix":"DATE_"},"header":"{idx}","width":70}]',
 N'[["품목 A","계획","100","120","110","130"],["품목 A","실적","95","115","105","125"],["품목 B","계획","80","75","90","85"]]',
 N'DP 월별·주별 입력', 160, N'system', GETDATE()),

-- SPECIAL
(REPLACE(NEWID(),'-',''), 'G17', 'SPECIAL', N'엑셀 업로드/다운로드', N'Excel Import/Export Grid', N'엑셀 템플릿 업로드·다운로드 통합 그리드.', 'grid_excel', 'BaseGrid + GridExcelExportButton + GridExcelImportButton',
 N'{"excelExport":true,"excelImport":true,"template":true}',
 N'[{"name":"CODE","header":"코드","width":80},{"name":"NAME","header":"명칭","width":160},{"name":"QTY","header":"수량","width":80}]',
 N'[["A001","품목 A",100],["A002","품목 B",80],["A003","품목 C",150]]',
 N'대량 데이터 입력', 170, N'system', GETDATE()),

(REPLACE(NEWID(),'-',''), 'G18', 'SPECIAL', N'드릴다운 그리드', N'Drill-Down Grid', N'상위 그리드 행 클릭 → 하위 그리드 필터 조회 연동.', 'grid_drilldown', 'BaseGrid × 2 (Master/Detail)',
 N'{"drillDown":true,"linkKey":"PARENT_CD"}',
 N'[{"name":"GROUP_CD","header":"그룹","width":100},{"name":"SUM_QTY","header":"합계","width":100},{"name":"CNT","header":"건수","width":80}]',
 N'[["A군",330,3],["B군",200,2],["C군",450,5]]',
 N'계층 드릴다운 리포트', 180, N'system', GETDATE()),

(REPLACE(NEWID(),'-',''), 'G19', 'SPECIAL', N'상태 배지 그리드', N'Badge/Chip Rendering Grid', N'셀 값에 따라 색상 배지(Chip) 렌더링.', 'grid_badge', 'BaseGrid + cellRenderer',
 N'{"cellRenderer":{"STATUS":"badge","PRIORITY":"chip"}}',
 N'[{"name":"PO","header":"PO","width":100},{"name":"STATUS","header":"상태","width":100},{"name":"PRIORITY","header":"우선순위","width":100}]',
 N'[["PO-001","진행","HIGH"],["PO-002","완료","MID"],["PO-003","지연","HIGH"]]',
 N'상태·등급 리스트', 190, N'system', GETDATE()),

(REPLACE(NEWID(),'-',''), 'G20', 'SPECIAL', N'진행률 바 그리드', N'Progress-Bar Cell Grid', N'셀 내부 진행률 바 렌더링 (%).', 'grid_progress', 'BaseGrid + progressRenderer',
 N'{"cellRenderer":{"RATE":"progress"}}',
 N'[{"name":"TASK","header":"작업","width":180},{"name":"RATE","header":"진척","width":180,"render":"progress"},{"name":"STATUS","header":"상태","width":80}]',
 N'[["SMT 조립",85,"진행"],["PCB 검사",100,"완료"],["포장",45,"진행"]]',
 N'WIP·작업 진척 모니터', 200, N'system', GETDATE());


SELECT COUNT(*) AS GRID_COUNT, CATEGORY FROM TB_IS_COMPOSER_GRID_TYPE GROUP BY CATEGORY ORDER BY CATEGORY;
-- =============================================================
-- T3Composer Dictionary — Chart Type Seed [MSSQL]
-- =============================================================
-- Stack : Chart.js / react-chartjs-2 / ChartComponent
--   8 카테고리 × 다양한 변형 = 54 종
-- =============================================================

DELETE FROM TB_IS_COMPOSER_CHART_TYPE;

-- 샘플 레이블
DECLARE @LBL NVARCHAR(MAX) = N'["1월","2월","3월","4월","5월","6월"]';
DECLARE @STACK NVARCHAR(500) = N'ChartComponent (Chart.js)';

-- ======================================================================
-- 1. BAR (10 variations)
-- ======================================================================
INSERT INTO TB_IS_COMPOSER_CHART_TYPE (ID, CODE, CATEGORY, NAME, NAME_EN, DESCRIPTION, CHART_TYPE, OPTIONS_JSON, SAMPLE_DATA, PREVIEW_COLOR, COMPONENT_STACK, RECOMMENDED_FOR, SORT_ORDER, CREATE_BY, CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''), 'C01', 'BAR', N'기본 수직 막대', N'Vertical Bar', N'가장 기본적인 세로형 막대 차트.', 'bar', '{}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[35,42,28,50,45,38],"backgroundColor":"#4d9fff"}]}', '#4d9fff', @STACK, N'일반 범주 비교', 10, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C02', 'BAR', N'기본 수평 막대', N'Horizontal Bar', N'indexAxis: ''y'' 를 사용한 가로형.', 'bar', '{"indexAxis":"y"}', N'{"labels":["A","B","C","D","E","F"],"datasets":[{"label":"값","data":[25,48,36,42,30,55],"backgroundColor":"#00d68f"}]}', '#00d68f', @STACK, N'긴 라벨·순위 비교', 20, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C03', 'BAR', N'그룹형 막대', N'Grouped Bar', N'다중 데이터셋을 나란히 배치.', 'bar', '{}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"계획","data":[30,35,28,40,45,42],"backgroundColor":"#4d9fff"},{"label":"실적","data":[28,32,30,38,42,44],"backgroundColor":"#00d68f"}]}', '#4d9fff', @STACK, N'계획 vs 실적', 30, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C04', 'BAR', N'누적 수직 막대', N'Stacked Vertical Bar', N'x/y 축 stacked: true.', 'bar', '{"scales":{"x":{"stacked":true},"y":{"stacked":true}}}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[15,22,18,25,28,24],"backgroundColor":"#4d9fff"},{"label":"B","data":[12,18,15,22,20,26],"backgroundColor":"#ffb347"},{"label":"C","data":[8,14,10,18,16,14],"backgroundColor":"#ff4d6d"}]}', '#ffb347', @STACK, N'구성 비교·누적 집계', 40, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C05', 'BAR', N'누적 수평 막대', N'Stacked Horizontal Bar', N'가로 누적 막대.', 'bar', '{"indexAxis":"y","scales":{"x":{"stacked":true},"y":{"stacked":true}}}', N'{"labels":["Q1","Q2","Q3","Q4"],"datasets":[{"label":"계획","data":[100,120,135,110],"backgroundColor":"#4d9fff"},{"label":"실적","data":[95,118,130,115],"backgroundColor":"#00d68f"}]}', '#00d68f', @STACK, N'분기별 누적 비교', 50, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C06', 'BAR', N'둥근 모서리 막대', N'Rounded Bar', N'borderRadius 로 막대 끝 둥글게.', 'bar', '{}', N'{"labels":["A","B","C","D","E","F"],"datasets":[{"label":"값","data":[35,42,28,50,45,38],"backgroundColor":"#9d72ff","borderRadius":20}]}', '#9d72ff', @STACK, N'모던 UI·세련', 60, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C07', 'BAR', N'플로팅 막대', N'Floating Bar', N'시작/끝 값을 배열로 지정 (범위 차트).', 'bar', '{}', N'{"labels":["A","B","C","D","E"],"datasets":[{"label":"범위","data":[[10,40],[20,55],[15,50],[25,45],[30,60]],"backgroundColor":"#ff4d6d","borderRadius":5}]}', '#ff4d6d', @STACK, N'범위·온도 차트', 70, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C08', 'BAR', N'다중 색상 막대', N'Multi-color Bar', N'단일 데이터셋에 배열 색상 적용.', 'bar', '{}', N'{"labels":["A","B","C","D","E","F"],"datasets":[{"label":"값","data":[35,42,28,50,45,38],"backgroundColor":["#4d9fff","#00d68f","#ffb347","#ff4d6d","#9d72ff","#00e5ff"]}]}', '#4d9fff', @STACK, N'카테고리 컬러 강조', 80, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C09', 'BAR', N'두께 고정 막대', N'Thin Bar', N'barThickness 로 픽셀 고정.', 'bar', '{}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"값","data":[35,42,28,50,45,38],"backgroundColor":"#00d68f","barThickness":10}]}', '#00d68f', @STACK, N'미니멀·얇은 막대', 90, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C10', 'BAR', N'베이스라인 막대', N'Offset Base Bar', N'0이 아닌 기준선(base) 설정.', 'bar', '{}', N'{"labels":["A","B","C","D","E"],"datasets":[{"label":"편차","data":[-10,5,-5,15,8],"backgroundColor":"#4d9fff","base":0}]}', '#4d9fff', @STACK, N'편차·증감 차트', 100, N'system', GETDATE()),

-- ======================================================================
-- 2. LINE (10)
-- ======================================================================
(REPLACE(NEWID(),'-',''), 'C11', 'LINE', N'기본 직선', N'Straight Line', N'기본적인 꺾은선.', 'line', '{}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#4d9fff"}]}', '#4d9fff', @STACK, N'트렌드 조회', 110, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C12', 'LINE', N'곡선 (Tension)', N'Smooth Line', N'tension: 0.4 적용된 부드러운 곡선.', 'line', '{}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#00d68f","tension":0.4}]}', '#00d68f', @STACK, N'트렌드·추이', 120, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C13', 'LINE', N'계단형 (Before)', N'Stepped Line - Before', N'stepped: ''before''.', 'line', '{}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#ffb347","stepped":"before"}]}', '#ffb347', @STACK, N'단계별 상태 변화', 130, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C14', 'LINE', N'계단형 (Middle)', N'Stepped Line - Middle', N'stepped: ''middle''.', 'line', '{}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#ff4d6d","stepped":"middle"}]}', '#ff4d6d', @STACK, N'이산 스냅샷', 140, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C15', 'LINE', N'점선', N'Dashed Line', N'borderDash 옵션.', 'line', '{}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#9d72ff","borderDash":[5,5]}]}', '#9d72ff', @STACK, N'목표치·기준선', 150, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C16', 'LINE', N'결측치 연결', N'Span Gaps', N'Null 건너뛰고 이전-이후 연결.', 'line', '{}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,30,null,null,40,50],"borderColor":"#00e5ff","spanGaps":true,"pointRadius":5}]}', '#00e5ff', @STACK, N'누락 데이터 트렌드', 160, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C17', 'LINE', N'포인트 스타일', N'Custom Point Style', N'rectRot/cross 등 포인트 모양 커스텀.', 'line', '{}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#4d9fff","pointStyle":"rectRot","pointRadius":8,"pointBorderColor":"#fff","pointBorderWidth":2}]}', '#4d9fff', @STACK, N'포인트 강조', 170, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C18', 'LINE', N'구간별 색상', N'Segmented Color Line', N'값 하락 구간 다른 색상.', 'line', '{}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#00d68f"}]}', '#00d68f', @STACK, N'상승/하락 구분', 180, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C19', 'LINE', N'다중 라인', N'Multi-line', N'여러 데이터 동시 비교.', 'line', '{}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#4d9fff"},{"label":"B","data":[15,25,32,30,45,40],"borderColor":"#00d68f"},{"label":"C","data":[10,18,25,28,35,42],"borderColor":"#ffb347"}]}', '#4d9fff', @STACK, N'다지표 비교', 190, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C20', 'LINE', N'포인트 숨김', N'No-Point Smooth', N'pointRadius: 0 + tension.', 'line', '{}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#ff4d6d","pointRadius":0,"tension":0.4}]}', '#ff4d6d', @STACK, N'매끈한 트렌드', 200, N'system', GETDATE()),

-- ======================================================================
-- 3. AREA (7)
-- ======================================================================
(REPLACE(NEWID(),'-',''), 'C21', 'AREA', N'하단 채우기', N'Area (Fill Origin)', N'fill: ''origin''.', 'line', '{}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#4d9fff","backgroundColor":"#4d9fff40","fill":"origin"}]}', '#4d9fff', @STACK, N'추세 강조', 210, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C22', 'AREA', N'시작점 채우기', N'Area (Fill Start)', N'fill: ''start''.', 'line', '{}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[-10,5,-5,15,8,20],"borderColor":"#00d68f","backgroundColor":"#00d68f40","fill":"start"}]}', '#00d68f', @STACK, N'편차·양수/음수', 220, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C23', 'AREA', N'데이터 간 채우기', N'Fill Between', N'이전 데이터셋 사이 채우기 (fill: -1).', 'line', '{}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"Upper","data":[40,45,38,50,48,52],"borderColor":"#9d72ff"},{"label":"Lower","data":[20,22,18,28,30,32],"borderColor":"#00d68f","backgroundColor":"#00d68f40","fill":"-1"}]}', '#9d72ff', @STACK, N'신뢰구간·밴드', 230, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C24', 'AREA', N'누적 영역', N'Stacked Area', N'누적 + 영역 채우기.', 'line', '{"scales":{"y":{"stacked":true}}}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[15,22,18,25,28,24],"fill":true,"backgroundColor":"#4d9fff80"},{"label":"B","data":[12,18,15,22,20,26],"fill":true,"backgroundColor":"#00d68f80"}]}', '#4d9fff', @STACK, N'구성 누적 트렌드', 240, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C25', 'AREA', N'곡선 영역', N'Smooth Area', N'tension + fill.', 'line', '{}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#ffb347","backgroundColor":"#ffb34740","fill":true,"tension":0.4}]}', '#ffb347', @STACK, N'부드러운 트렌드', 250, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C26', 'AREA', N'기준값 채우기', N'Fill at Value', N'특정 Y값 기준 상/하 채우기.', 'line', '{}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#ff4d6d","backgroundColor":"#ff4d6d40","fill":{"value":30}}]}', '#ff4d6d', @STACK, N'기준치 초과 하이라이트', 260, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C27', 'AREA', N'끝점 채우기', N'Fill End', N'fill: ''end''.', 'line', '{}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[20,35,28,42,38,50],"borderColor":"#00e5ff","backgroundColor":"#00e5ff40","fill":"end"}]}', '#00e5ff', @STACK, N'상한선 강조', 270, N'system', GETDATE()),

-- ======================================================================
-- 4. PIE / DOUGHNUT (8)
-- ======================================================================
(REPLACE(NEWID(),'-',''), 'C28', 'PIE', N'기본 파이', N'Pie Chart', N'원형 100% 구성비.', 'pie', '{}', N'{"labels":["A","B","C","D","E"],"datasets":[{"data":[35,25,20,15,5],"backgroundColor":["#4d9fff","#00d68f","#ffb347","#ff4d6d","#9d72ff"]}]}', '#4d9fff', @STACK, N'비중 분석', 280, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C29', 'PIE', N'기본 도넛', N'Doughnut Chart', N'type: ''doughnut''.', 'doughnut', '{}', N'{"labels":["A","B","C","D","E"],"datasets":[{"data":[35,25,20,15,5],"backgroundColor":["#4d9fff","#00d68f","#ffb347","#ff4d6d","#9d72ff"]}]}', '#00d68f', @STACK, N'구성비·링 그래프', 290, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C30', 'PIE', N'얇은 도넛', N'Thin Doughnut', N'cutout: 80%.', 'doughnut', '{"cutout":"80%"}', N'{"labels":["A","B","C","D"],"datasets":[{"data":[40,25,20,15],"backgroundColor":["#4d9fff","#00d68f","#ffb347","#ff4d6d"]}]}', '#4d9fff', @STACK, N'미니 도넛·KPI', 300, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C31', 'PIE', N'두꺼운 도넛', N'Thick Doughnut', N'cutout: 20%.', 'doughnut', '{"cutout":"20%"}', N'{"labels":["A","B","C","D"],"datasets":[{"data":[40,25,20,15],"backgroundColor":["#4d9fff","#00d68f","#ffb347","#ff4d6d"]}]}', '#ffb347', @STACK, N'강조 도넛', 310, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C32', 'PIE', N'반원 도넛', N'Half Doughnut', N'rotation -90 + circumference 180.', 'doughnut', '{"rotation":-90,"circumference":180}', N'{"labels":["완료","대기"],"datasets":[{"data":[75,25],"backgroundColor":["#00d68f","#2a3352"]}]}', '#00d68f', @STACK, N'게이지형 진척', 320, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C33', 'PIE', N'조각 분리', N'Exploded Pie', N'offset 으로 특정 조각 분리.', 'pie', '{}', N'{"labels":["A","B","C","D","E"],"datasets":[{"data":[40,25,20,10,5],"backgroundColor":["#4d9fff","#00d68f","#ffb347","#ff4d6d","#9d72ff"],"offset":[30,0,0,0,0]}]}', '#ff4d6d', @STACK, N'이상치 강조', 330, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C34', 'PIE', N'다중 링 도넛', N'Multi-Ring Doughnut', N'여러 데이터셋 링으로.', 'doughnut', '{}', N'{"labels":["A","B","C"],"datasets":[{"data":[40,30,30],"backgroundColor":["#4d9fff","#00d68f","#ffb347"]},{"data":[25,45,30],"backgroundColor":["#4d9fff80","#00d68f80","#ffb34780"]}]}', '#9d72ff', @STACK, N'비교 구성비', 340, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C35', 'PIE', N'조각 간격 도넛', N'Spaced Doughnut', N'spacing 으로 조각 사이 간격.', 'doughnut', '{}', N'{"labels":["A","B","C","D"],"datasets":[{"data":[35,25,25,15],"backgroundColor":["#4d9fff","#00d68f","#ffb347","#ff4d6d"],"spacing":5,"borderRadius":5}]}', '#00d68f', @STACK, N'모던 UI', 350, N'system', GETDATE()),

-- ======================================================================
-- 5. RADAR / POLAR (5)
-- ======================================================================
(REPLACE(NEWID(),'-',''), 'C36', 'RADAR', N'기본 방사형', N'Radar Chart', N'다각도 지표 비교.', 'radar', '{}', N'{"labels":["품질","가격","배송","서비스","디자인"],"datasets":[{"label":"A","data":[85,70,92,78,88],"borderColor":"#4d9fff","backgroundColor":"#4d9fff40"}]}', '#4d9fff', @STACK, N'역량·성능 비교', 360, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C37', 'RADAR', N'곡선 방사형', N'Smooth Radar', N'tension 적용.', 'radar', '{}', N'{"labels":["품질","가격","배송","서비스","디자인"],"datasets":[{"label":"A","data":[85,70,92,78,88],"borderColor":"#00d68f","backgroundColor":"#00d68f40","tension":0.4}]}', '#00d68f', @STACK, N'부드러운 프로파일', 370, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C38', 'RADAR', N'다중 방사형', N'Multi Radar', N'복수 데이터 비교.', 'radar', '{}', N'{"labels":["품질","가격","배송","서비스","디자인"],"datasets":[{"label":"A사","data":[85,70,92,78,88],"borderColor":"#4d9fff","backgroundColor":"#4d9fff40"},{"label":"B사","data":[75,85,80,90,75],"borderColor":"#ffb347","backgroundColor":"#ffb34740"}]}', '#ffb347', @STACK, N'경쟁사 비교', 380, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C39', 'RADAR', N'속이 빈 방사형', N'Outlined Radar', N'fill: false + borderDash.', 'radar', '{}', N'{"labels":["품질","가격","배송","서비스","디자인"],"datasets":[{"label":"A","data":[85,70,92,78,88],"borderColor":"#ff4d6d","borderDash":[5,5],"fill":false}]}', '#ff4d6d', @STACK, N'외곽선 강조', 390, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C40', 'RADAR', N'극좌표형 (Polar)', N'Polar Area', N'반지름=값.', 'polarArea', '{}', N'{"labels":["A","B","C","D","E","F"],"datasets":[{"data":[35,42,28,50,45,38],"backgroundColor":["#4d9fff80","#00d68f80","#ffb34780","#ff4d6d80","#9d72ff80","#00e5ff80"]}]}', '#9d72ff', @STACK, N'원형 비교', 400, N'system', GETDATE()),

-- ======================================================================
-- 6. SCATTER / BUBBLE (5)
-- ======================================================================
(REPLACE(NEWID(),'-',''), 'C41', 'SCATTER', N'산점도', N'Scatter', N'(x,y) 좌표 분포.', 'scatter', '{}', N'{"datasets":[{"label":"A","data":[{"x":10,"y":20},{"x":25,"y":35},{"x":40,"y":15},{"x":35,"y":45},{"x":15,"y":30},{"x":45,"y":25}],"backgroundColor":"#4d9fff","pointRadius":6}]}', '#4d9fff', @STACK, N'상관관계 분석', 410, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C42', 'SCATTER', N'다중 산점도', N'Multi Scatter', N'그룹별 분포.', 'scatter', '{}', N'{"datasets":[{"label":"A","data":[{"x":10,"y":20},{"x":25,"y":35},{"x":40,"y":15}],"backgroundColor":"#00d68f","pointRadius":6},{"label":"B","data":[{"x":15,"y":45},{"x":30,"y":25},{"x":45,"y":40}],"backgroundColor":"#ff4d6d","pointRadius":6}]}', '#00d68f', @STACK, N'그룹 분포', 420, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C43', 'SCATTER', N'선 연결 산점도', N'Scatter + Line', N'showLine: true.', 'scatter', '{}', N'{"datasets":[{"label":"A","data":[{"x":5,"y":10},{"x":15,"y":25},{"x":25,"y":20},{"x":35,"y":35},{"x":45,"y":30}],"borderColor":"#ffb347","backgroundColor":"#ffb347","showLine":true}]}', '#ffb347', @STACK, N'회귀선·추세', 430, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C44', 'SCATTER', N'기본 버블', N'Bubble', N'(x,y,r) 3차원.', 'bubble', '{}', N'{"datasets":[{"label":"A","data":[{"x":10,"y":20,"r":8},{"x":25,"y":35,"r":12},{"x":40,"y":15,"r":6},{"x":35,"y":45,"r":15}],"backgroundColor":"#9d72ff80"}]}', '#9d72ff', @STACK, N'3차원 비교', 440, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C45', 'SCATTER', N'다중 버블', N'Multi Bubble', N'그룹별 버블 분포.', 'bubble', '{}', N'{"datasets":[{"label":"A","data":[{"x":10,"y":20,"r":10},{"x":30,"y":35,"r":8}],"backgroundColor":"#4d9fff80"},{"label":"B","data":[{"x":20,"y":40,"r":12},{"x":40,"y":25,"r":6}],"backgroundColor":"#00d68f80"}]}', '#4d9fff', @STACK, N'그룹 분포 크기 비교', 450, N'system', GETDATE()),

-- ======================================================================
-- 7. COMBO (5)
-- ======================================================================
(REPLACE(NEWID(),'-',''), 'C46', 'COMBO', N'막대 + 꺾은선', N'Bar & Line', N'가장 일반적인 S&OP 콤보.', 'bar', '{}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"type":"bar","label":"계획","data":[30,35,28,40,45,42],"backgroundColor":"#4d9fff"},{"type":"line","label":"실적","data":[28,32,30,38,42,44],"borderColor":"#ff4d6d","borderWidth":3}]}', '#4d9fff', @STACK, N'계획 vs 실적', 460, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C47', 'COMBO', N'누적 + 라인 (Pareto)', N'Pareto Combo', N'누적 막대 + 누적 라인.', 'bar', '{"scales":{"x":{"stacked":true},"y":{"stacked":true}}}', N'{"labels":["A","B","C","D","E","F"],"datasets":[{"type":"bar","label":"건수","data":[50,30,10,5,3,2],"backgroundColor":"#ffb347"},{"type":"line","label":"누적%","data":[50,80,90,95,98,100],"borderColor":"#ff4d6d"}]}', '#ffb347', @STACK, N'파레토 분석', 470, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C48', 'COMBO', N'영역 + 라인', N'Area & Line', N'배경 영역 + 강조 라인.', 'line', '{}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"type":"line","label":"Range","data":[20,30,25,35,32,40],"fill":true,"backgroundColor":"#9d72ff40","borderColor":"#9d72ff"},{"type":"line","label":"Current","data":[22,28,28,32,35,38],"borderColor":"#4d9fff","borderWidth":3}]}', '#9d72ff', @STACK, N'추세 + 현재값', 480, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C49', 'COMBO', N'수평 콤보', N'Horizontal Combo', N'indexAxis: y 콤보.', 'bar', '{"indexAxis":"y"}', N'{"labels":["A","B","C","D","E","F"],"datasets":[{"type":"bar","label":"Bar","data":[35,42,28,50,45,38],"backgroundColor":"#00e5ff"},{"type":"line","label":"Line","data":[30,45,32,48,40,42],"borderColor":"#ff4d6d"}]}', '#00e5ff', @STACK, N'수평 비교', 490, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C50', 'COMBO', N'산점도 + 추세선', N'Scatter + Trend', N'분포 + 회귀선.', 'scatter', '{}', N'{"datasets":[{"type":"scatter","label":"Data","data":[{"x":10,"y":20},{"x":20,"y":25},{"x":30,"y":40},{"x":40,"y":35},{"x":50,"y":50}],"backgroundColor":"#00d68f"},{"type":"line","label":"Trend","data":[{"x":0,"y":15},{"x":50,"y":48}],"borderColor":"#ff4d6d","borderDash":[5,5]}]}', '#00d68f', @STACK, N'상관 + 추세', 500, N'system', GETDATE()),

-- ======================================================================
-- 8. SCALE / AXIS (4)
-- ======================================================================
(REPLACE(NEWID(),'-',''), 'C51', 'SCALE', N'이중 Y축', N'Dual Y-Axis', N'좌/우 축 분리.', 'line', '{"scales":{"y":{"type":"linear","position":"left"},"y1":{"type":"linear","position":"right","grid":{"drawOnChartArea":false}}}}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"type":"line","label":"율(%)","data":[20,35,28,42,38,50],"yAxisID":"y","borderColor":"#4d9fff"},{"type":"bar","label":"금액","data":[1200,1800,1500,2200,2000,2500],"yAxisID":"y1","backgroundColor":"#ffb347"}]}', '#4d9fff', @STACK, N'단위 다른 지표', 510, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C52', 'SCALE', N'로그 스케일', N'Log Scale', N'y 축 logarithmic.', 'line', '{"scales":{"y":{"type":"logarithmic"}}}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"A","data":[10,100,1000,5000,20000,100000],"borderColor":"#ff4d6d"}]}', '#ff4d6d', @STACK, N'값 편차 큼', 520, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C53', 'SCALE', N'그리드 숨김', N'No Grid', N'배경선 제거.', 'bar', '{"scales":{"x":{"grid":{"display":false}},"y":{"grid":{"display":false}}}}', N'{"labels":["A","B","C","D","E","F"],"datasets":[{"label":"값","data":[35,42,28,50,45,38],"backgroundColor":"#00d68f"}]}', '#00d68f', @STACK, N'깔끔한 UI', 530, N'system', GETDATE()),
(REPLACE(NEWID(),'-',''), 'C54', 'SCALE', N'축 반전', N'Reversed Y-Axis', N'y 축 위에서 아래로.', 'line', '{"scales":{"y":{"reverse":true}}}', N'{"labels":["1월","2월","3월","4월","5월","6월"],"datasets":[{"label":"순위","data":[5,3,4,2,1,1],"borderColor":"#9d72ff"}]}', '#9d72ff', @STACK, N'순위·낮을수록 좋음', 540, N'system', GETDATE());


SELECT CATEGORY, COUNT(*) AS CNT FROM TB_IS_COMPOSER_CHART_TYPE GROUP BY CATEGORY ORDER BY CATEGORY;
SELECT COUNT(*) AS TOTAL_CHARTS FROM TB_IS_COMPOSER_CHART_TYPE;
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
(REPLACE(NEWID(),'-',''),'BF09','BF',N'BF. 기준 예측',N'예측 주기별 정확도 (단기/중기/장기)','N',N'BF팀',N'월간',N'1주/1개월/3개월/6개월 horizon 별 예측 정확도 분해.',N'각 horizon 별 MAPE','line',N'Horizon 정확도(%)',N'[92,88,82,78,72,68]','radar',N'["1주","1개월","3개월","6개월"]',N'[92,85,78,70]','%','N',570,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'BF10','BF',N'BF. 기준 예측',N'계절성/추세 반영도','N',N'BF팀',N'분기',N'Seasonal 패턴·Trend 감지율. STL 분해 기반.',N'(정확 분해 건수 / 전체 SKU) × 100','line',N'반영도(%)',N'[75,80,82,85,88,92]','pie',N'["Trend","Season","Residual"]',N'[45,35,20]','%','N',571,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'BF11','BF',N'BF. 기준 예측',N'모델 실행 시간 (Run Time)','N',N'BF팀',N'주간',N'BF 엔진 1회 Run 소요 시간. SKU 많을수록 증가.',N'엔진 종료 - 시작','line',N'시간(분)',N'[85,75,65,55,45,40]','bar_comp',N'["현재","목표이하"]',N'[40,60]','분','Y',572,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'BF12','BF',N'BF. 기준 예측',N'모델 재학습 주기 준수','N',N'BF팀',N'월간',N'정해진 재학습 주기 (주간/월간) 준수 비율.',N'(정시 재학습 / 총 예정) × 100','bar',N'준수(%)',N'[92,94,96,98,100,100]','doughnut',N'["준수","지연"]',N'[100,0]','%','N',573,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'BF13','BF',N'BF. 기준 예측',N'신규/단종 SKU 예측 처리','N',N'BF팀',N'월간',N'NPI(신제품) 및 EOS(단종) SKU 특수 처리 비율.',N'(특수처리 SKU / 전체 변경) × 100','line',N'처리율(%)',N'[68,75,82,88,92,95]','bar_stack',N'["신규","단종","리뉴얼"]',N'[50,35,15]','%','N',574,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'BF14','BF',N'BF. 기준 예측',N'외부 변수 영향도','N',N'BF팀',N'분기',N'프로모션/날씨/공휴일 등 외부변수가 예측에 기여하는 정도.',N'설명변수의 R² 기여도','bar',N'기여도(%)',N'[15,18,25,22,28,32]','pie',N'["프로모션","날씨","공휴일","경쟁사","기타"]',N'[35,25,20,10,10]','%','N',575,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'BF15','BF',N'BF. 기준 예측',N'예측 결과 안정성 (분산)','N',N'BF팀',N'주간',N'주차별 예측값 변동 계수(CoV). 낮을수록 안정적.',N'σ(예측값) / μ(예측값) × 100','line',N'CoV(%)',N'[18,15,12,10,8,6]','bar_comp',N'["당월","목표이하"]',N'[6,10]','%','Y',576,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'BF16','BF',N'BF. 기준 예측',N'Backtesting 정확도','N',N'BF팀',N'분기',N'과거 기간 재현(Backtest) MAPE. Out-of-sample 검증.',N'Backtest 구간 MAPE','bar',N'BT 정확도(%)',N'[85,86,88,90,92,94]','bar_comp',N'["Backtest","Live"]',N'[94,88]','%','N',577,N'system',GETDATE());

-- ---------- [DP] Demand Planning (+8) ----------
INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''),'DP09','DP',N'DP. 수요 계획',N'DP → MP 연계 반영률','N',N'DP/MP팀',N'주간',N'확정 DP 가 MP 주생산계획에 반영된 비율.',N'(MP 에 반영된 DP 수량 / DP 총 수량) × 100','line',N'반영률(%)',N'[85,88,92,94,96,98]','doughnut',N'["반영","미반영"]',N'[98,2]','%','N',580,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'DP10','DP',N'DP. 수요 계획',N'장/중/단기 DP 정확도','N',N'DP팀',N'월간',N'3M+ (장기), 1-3M (중기), <1M (단기) horizon 별 정확도.',N'각 기간 MAPE','line',N'Horizon 정확도',N'[88,82,75,72,68,65]','radar',N'["단기(<1M)","중기(1-3M)","장기(3M+)"]',N'[92,82,70]','%','N',581,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'DP11','DP',N'DP. 수요 계획',N'Consensus 회의 합의율','N',N'영업/SCM',N'월간',N'월간 S&OP 회의에서 DP 확정 합의(Vote) 비율.',N'(합의 항목 / 회의 항목) × 100','bar',N'합의(%)',N'[78,82,85,88,92,95]','pie',N'["영업","마케팅","생산","재무"]',N'[35,25,25,15]','%','N',582,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'DP12','DP',N'DP. 수요 계획',N'수요 조정 횟수','N',N'DP팀',N'주간',N'월간 DP 확정 후 재조정(Re-plan) 건수.',N'월간 조정 Run 카운트','bar',N'조정(회)',N'[12,10,8,6,5,3]','bar_comp',N'["당월","목표이하"]',N'[3,5]','회','Y',583,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'DP13','DP',N'DP. 수요 계획',N'판매예측회의 결과 보관율','N',N'DP팀',N'월간',N'회의록/의사결정 이력 공식 보관 비율.',N'(보관된 회의 / 전체 회의) × 100','line',N'보관율(%)',N'[85,90,92,95,98,100]','doughnut',N'["보관","미보관"]',N'[100,0]','%','N',584,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'DP14','DP',N'DP. 수요 계획',N'플래너별 확정 속도','N',N'DP팀',N'월간',N'Demand Planner 별 DP 확정 평균 일수.',N'평균 (확정일 - 초안일)','line',N'평균(일)',N'[8,7,6,5,5,4]','bar',N'플래너별(일)',N'[5,6,4,5,3]','일','Y',585,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'DP15','DP',N'DP. 수요 계획',N'긴급/VIP 수요 처리율','N',N'영업/DP',N'주간',N'긴급 오더 (Hot Order) 또는 핵심 고객 수요 반영 비율.',N'(반영 긴급수요 / 전체 긴급요청) × 100','bar',N'처리율(%)',N'[85,88,92,95,98,100]','pie',N'["정상","긴급","VIP"]',N'[80,15,5]','%','N',586,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'DP16','DP',N'DP. 수요 계획',N'수요변동성 (CoV)','N',N'DP팀',N'월간',N'수요 변동 계수 = σ/μ. 높을수록 예측 난이도 상승.',N'σ(수요) / μ(수요) × 100','line',N'CoV(%)',N'[25,22,28,20,18,15]','radar',N'["A군","B군","C군","D군"]',N'[12,18,28,35]','%','Y',587,N'system',GETDATE());

-- ---------- [MP] Master Planning (+8) ----------
INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''),'MP09','MP',N'MP. 주생산 계획',N'MRP 전개 정확도','N',N'MP팀/자재',N'주간',N'MP → MRP 자재 소요 전개 정확도.',N'(정확 전개 / 전체 BOM 계산) × 100','line',N'정확도(%)',N'[90,92,94,96,98,99]','doughnut',N'["정확","오류"]',N'[99,1]','%','N',590,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'MP10','MP',N'MP. 주생산 계획',N'다거점(Multi-site) 할당 비율','N',N'MP팀',N'주간',N'다공장 체계에서 거점 간 생산 할당 분포.',N'각 거점별 생산량 / 총량','bar',N'거점(%)',N'[40,30,20,8,2]','pie',N'["공장A","공장B","공장C","공장D","외주"]',N'[40,30,20,8,2]','%','N',591,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'MP11','MP',N'MP. 주생산 계획',N'평준화(Heijunka) 지수','N',N'MP팀',N'주간',N'일별 생산량 변동성. 낮을수록 Heijunka 우수.',N'σ(일간 생산) / μ × 100','line',N'변동성(%)',N'[22,18,15,12,10,8]','bar_comp',N'["실적","목표이하"]',N'[8,12]','%','Y',592,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'MP12','MP',N'MP. 주생산 계획',N'대체 라인 활용률','N',N'MP팀',N'월간',N'주 라인 대신 대체 라인에 배정된 생산 비율.',N'(대체 배정 / 전체 배정) × 100','bar',N'대체(%)',N'[12,15,10,8,7,5]','pie',N'["주라인","대체라인","외주"]',N'[85,10,5]','%','Y',593,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'MP13','MP',N'MP. 주생산 계획',N'ATP 응답 속도','Y',N'MP/영업',N'일간',N'Available-To-Promise 문의 평균 응답 시간.',N'요청 → 응답 평균 분','line',N'응답(분)',N'[8,6,4,3,2,1]','bar_comp',N'["당월","목표이하"]',N'[1,3]','분','Y',594,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'MP14','MP',N'MP. 주생산 계획',N'CTP 적중률','N',N'MP팀',N'월간',N'Capable-To-Promise 예측 납기 적중률.',N'(적중 건수 / CTP 약속 건수) × 100','line',N'적중(%)',N'[80,85,90,92,94,96]','doughnut',N'["적중","지연"]',N'[96,4]','%','N',595,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'MP15','MP',N'MP. 주생산 계획',N'Lot Sizing 최적화','N',N'MP팀',N'월간',N'경제적 로트 크기 (EOQ/POQ) 대비 실제 배치 근접도.',N'100 - |실제 - 최적| / 최적 × 100','line',N'적중(%)',N'[75,82,88,92,95,97]','bar_comp',N'["실적","이상치"]',N'[97,100]','%','N',596,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'MP16','MP',N'MP. 주생산 계획',N'Pegging 적중률','N',N'MP팀',N'주간',N'수요-공급 매칭(Pegging) 정확도.',N'(정확 Pegging / 전체 오더) × 100','bar',N'적중(%)',N'[88,90,92,94,96,98]','pie',N'["Hard","Soft","Unpegged"]',N'[70,25,5]','%','N',597,N'system',GETDATE());

-- ---------- [FP] Factory Planning (+8) ----------
INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''),'FP09','FP',N'FP. 공장 계획',N'Tact Time 준수율','N',N'생산',N'일간',N'라인별 표준 Tact Time 대비 실제 사이클 준수 비율.',N'(표준 Tact 내 / 전체 생산) × 100','line',N'준수(%)',N'[88,90,92,94,96,97]','bar_comp',N'["실적","표준"]',N'[97,100]','%','N',600,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'FP10','FP',N'FP. 공장 계획',N'설비 MTBF','Y',N'설비관리',N'월간',N'Mean Time Between Failures. 고장 간격 평균 시간.',N'총 가동시간 / 고장 횟수','line',N'MTBF(시간)',N'[420,450,480,520,560,600]','bar',N'라인별',N'[580,420,620,560,500]','시간','N',601,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'FP11','FP',N'FP. 공장 계획',N'설비 MTTR','N',N'설비관리',N'월간',N'Mean Time To Repair. 고장 수리 평균 시간.',N'총 수리시간 / 수리 횟수','line',N'MTTR(분)',N'[85,75,65,55,45,38]','bar_comp',N'["당월","목표이하"]',N'[38,60]','분','Y',602,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'FP12','FP',N'FP. 공장 계획',N'에너지 효율 (kWh/EA)','N',N'설비/환경',N'월간',N'단위 생산당 전력 소모량. ESG 지표.',N'총 kWh / 총 생산 EA','line',N'kWh/EA',N'[0.35,0.32,0.30,0.28,0.26,0.25]','bar_comp',N'["당월","목표이하"]',N'[0.25,0.30]','kWh','Y',603,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'FP13','FP',N'FP. 공장 계획',N'작업자 생산성','N',N'생산관리',N'월간',N'작업자 1인당 시간당 생산량.',N'총 생산 / (작업자 × 가동시간)','line',N'EA/인·시',N'[45,48,52,55,58,62]','bar',N'라인별',N'[62,55,68,50,58]','EA','N',604,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'FP14','FP',N'FP. 공장 계획',N'생산 처리량 (Throughput)','N',N'생산관리',N'일간',N'병목 설비 기준 일간 처리량.',N'24시간 / 병목 Tact × 가용률','line',N'EA/일',N'[4500,4800,5000,5200,5500,5800]','bar_comp',N'["실적","목표"]',N'[5800,5500]','EA','N',605,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'FP15','FP',N'FP. 공장 계획',N'신제품 Ramp-up 시간','N',N'생산/NPI',N'분기',N'신제품 양산 시작 → 안정 생산까지 소요 주수.',N'안정화 시점 - 양산 개시','line',N'주(Wk)',N'[12,10,8,7,6,5]','bar_comp',N'["현재","목표이하"]',N'[5,8]','주','Y',606,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'FP16','FP',N'FP. 공장 계획',N'SEQ 순서 최적화','N',N'FP팀',N'일간',N'생산 순서(색상/모델) 최적 배열 비율.',N'(최적 순서 건수 / 전체) × 100','bar',N'최적(%)',N'[72,78,82,85,88,92]','pie',N'["최적","허용","재검토"]',N'[85,12,3]','%','N',607,N'system',GETDATE());

-- ---------- [IM_SCM] Inventory (+8) ----------
INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''),'IM09','IM_SCM',N'IM. 재고 관리',N'Cycle Count 정확도','Y',N'창고/IM',N'주간',N'순환 실사 (Cycle Count) 전산-실물 일치율.',N'(일치 건수 / 실사 건수) × 100','line',N'정확도(%)',N'[95,96,97,98,99,99.5]','doughnut',N'["일치","불일치"]',N'[99.5,0.5]','%','N',610,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'IM10','IM_SCM',N'IM. 재고 관리',N'FIFO 준수율','N',N'물류',N'주간',N'선입선출(First-In-First-Out) 원칙 준수 비율.',N'(FIFO 출고 / 전체 출고) × 100','bar',N'준수(%)',N'[88,92,94,96,98,99]','pie',N'["FIFO","LIFO","기타"]',N'[95,3,2]','%','N',611,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'IM11','IM_SCM',N'IM. 재고 관리',N'재고 분산 (창고간 균형)','N',N'물류',N'월간',N'창고 간 동일 품목 재고 불균형 해소도.',N'100 - CoV(창고별 재고) × 100','line',N'균형도(%)',N'[65,72,78,82,85,88]','radar',N'["창고A","창고B","창고C","창고D"]',N'[88,75,92,70]','%','N',612,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'IM12','IM_SCM',N'IM. 재고 관리',N'Shrinkage 손실 비율','N',N'창고',N'월간',N'파손/분실 재고 손실 (Shrinkage) 비율.',N'(손실 금액 / 재고 금액) × 100','line',N'손실(%)',N'[2.5,2.0,1.5,1.2,0.8,0.5]','bar_comp',N'["실적","허용"]',N'[0.5,1.0]','%','Y',613,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'IM13','IM_SCM',N'IM. 재고 관리',N'계절 재고 적중률','N',N'IM/영업',N'분기',N'성수기 준비 재고 적정량 유지 비율.',N'(적정 유지 / 계절재고 품목) × 100','bar',N'적중(%)',N'[68,75,82,85,90,92]','pie',N'["적정","과다","부족"]',N'[88,8,4]','%','N',614,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'IM14','IM_SCM',N'IM. 재고 관리',N'대체창고 활용률','N',N'물류',N'주간',N'주 창고 캐파 초과 시 대체창고로 이관 비율.',N'(대체창고 재고 / 전체) × 100','line',N'대체(%)',N'[15,18,12,10,8,5]','doughnut',N'["주창고","대체","외부임대"]',N'[90,8,2]','%','Y',615,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'IM15','IM_SCM',N'IM. 재고 관리',N'보관 조건별 (냉장/냉동) 관리','N',N'창고',N'일간',N'특수 보관 (냉장/냉동/위험물) 조건 준수율.',N'(조건 준수 / 특수 품목) × 100','line',N'준수(%)',N'[95,96,97,98,99,100]','pie',N'["상온","냉장","냉동","위험물"]',N'[70,15,10,5]','%','N',616,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'IM16','IM_SCM',N'IM. 재고 관리',N'유통기한 임박 (Expiry) 재고','N',N'IM',N'주간',N'유통기한 30일 이내 재고 금액.',N'기한 30일↓ 재고 금액','bar',N'임박재고(M)',N'[45,38,32,25,18,12]','bar_stack',N'["7일↓","7-15일","15-30일"]',N'[3,5,10]','M','Y',617,N'system',GETDATE());

-- ---------- [RP] Replenishment (+8) ----------
INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''),'RP09','RP',N'RP. 보충/발주',N'Kanban 신호 지연','N',N'자재/RP',N'일간',N'Kanban 신호 → 실제 보충까지 지연 건수.',N'일간 지연 Kanban 건수','bar',N'지연(건)',N'[15,12,8,6,4,2]','bar_comp',N'["당일","목표이하"]',N'[2,5]','건','Y',620,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'RP10','RP',N'RP. 보충/발주',N'JIT 준수율','Y',N'구매/RP',N'주간',N'Just-In-Time 배송 (±2H) 준수 비율.',N'(정시 배송 / 전체) × 100','line',N'JIT(%)',N'[82,85,88,92,95,97]','pie',N'["정시","조기","지연"]',N'[92,5,3]','%','N',621,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'RP11','RP',N'RP. 보충/발주',N'VMI 커버리지','N',N'구매',N'월간',N'Vendor-Managed Inventory 대상 자재 비율.',N'(VMI 자재 / 전체 자재) × 100','line',N'VMI(%)',N'[25,30,35,40,45,50]','pie',N'["VMI","직접관리"]',N'[50,50]','%','N',622,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'RP12','RP',N'RP. 보충/발주',N'자재 표준화율','N',N'구매/설계',N'분기',N'표준 자재로 관리되는 품목 비율.',N'(표준 자재 / 전체) × 100','line',N'표준화(%)',N'[55,62,68,72,78,82]','doughnut',N'["표준","특주","단종"]',N'[82,15,3]','%','N',623,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'RP13','RP',N'RP. 보충/발주',N'장기계약(LTA) 비율','N',N'구매',N'분기',N'장기계약(1년+) 자재 구매액 비중.',N'(LTA 구매액 / 총 구매액) × 100','bar',N'LTA(%)',N'[45,52,58,65,72,78]','pie',N'["LTA","Spot","Frame"]',N'[78,15,7]','%','N',624,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'RP14','RP',N'RP. 보충/발주',N'Spot Buy 비율','N',N'구매',N'월간',N'단건 긴급 구매 (Spot) 비율.',N'(Spot 건수 / 전체 발주) × 100','line',N'Spot(%)',N'[18,15,12,10,8,6]','bar_comp',N'["당월","목표이하"]',N'[6,10]','%','Y',625,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'RP15','RP',N'RP. 보충/발주',N'대체 자재 활용률','N',N'구매/설계',N'월간',N'결품 시 대체(Substitute) 자재로 전환 비율.',N'(대체사용 / 결품대상) × 100','bar',N'활용(%)',N'[55,62,68,72,78,82]','pie',N'["원자재","대체","외주"]',N'[85,12,3]','%','N',626,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'RP16','RP',N'RP. 보충/발주',N'구매 자동화 (E-Procurement)','N',N'구매',N'분기',N'시스템 자동 발주 비율. 수기 PO 제외.',N'(자동 PO / 전체 PO) × 100','line',N'자동화(%)',N'[45,55,65,72,80,88]','doughnut',N'["자동","수기"]',N'[88,12]','%','N',627,N'system',GETDATE());

-- ---------- [SA_SCM] Sales Analysis (+8) ----------
INSERT INTO TB_IS_COMPOSER_KPI_DICT (ID,CODE,CATEGORY_CD,CATEGORY_NAME,NAME,IS_MAIN,DEPARTMENT,FREQUENCY,DESCRIPTION,FORMULA,CHART1_TYPE,CHART1_LABEL,CHART1_DATA,CHART2_TYPE,CHART2_LABEL,CHART2_DATA,CHART2_UNIT,IS_REVERSE_GAP,SORT_ORDER,CREATE_BY,CREATE_DTTM) VALUES
(REPLACE(NEWID(),'-',''),'SA09','SA_SCM',N'SA. 판매 분석',N'제품 마진 편차','N',N'재무/SA',N'월간',N'제품 간 마진율 편차. 높을수록 포트폴리오 불균형.',N'σ(제품 마진) / μ × 100','line',N'편차(%)',N'[28,25,22,20,18,15]','bar',N'제품군 마진',N'[32,28,22,18,15]','%','Y',630,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'SA10','SA_SCM',N'SA. 판매 분석',N'Sell-in vs Sell-out 갭','Y',N'SA/영업',N'주간',N'제조사 출하(Sell-in) vs 최종판매(Sell-out) 갭.',N'(Sell-in - Sell-out) / Sell-out × 100','line',N'갭(%)',N'[15,12,10,8,5,3]','bar_comp',N'["Sell-in","Sell-out"]',N'[103,100]','%','Y',631,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'SA11','SA_SCM',N'SA. 판매 분석',N'반품률 (Return Rate)','N',N'영업/품질',N'월간',N'판매 대비 반품 건수 비율.',N'(반품 / 판매) × 100','line',N'반품률(%)',N'[3.5,3.0,2.8,2.2,1.8,1.5]','pie',N'["품질","오배송","주문취소","기타"]',N'[40,20,25,15]','%','Y',632,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'SA12','SA_SCM',N'SA. 판매 분석',N'고객 이탈률 (Churn)','N',N'영업/CRM',N'분기',N'지난 분기 거래 후 이번 분기 미거래 고객 비율.',N'(이탈 고객 / 전분기 활동 고객) × 100','line',N'Churn(%)',N'[8,7,6,5,4,3]','bar_comp',N'["당분기","목표이하"]',N'[3,5]','%','Y',633,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'SA13','SA_SCM',N'SA. 판매 분석',N'시장 점유율 (Market Share)','Y',N'영업/전략',N'분기',N'자사 매출 / 시장 전체 규모.',N'자사 매출 / 시장규모 × 100','line',N'점유율(%)',N'[18,19,21,23,25,28]','pie',N'["자사","경쟁사A","경쟁사B","기타"]',N'[28,35,22,15]','%','N',634,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'SA14','SA_SCM',N'SA. 판매 분석',N'채널별 수익성','N',N'영업/재무',N'월간',N'온라인/오프라인/대리점 채널별 마진율 비교.',N'채널별 이익 / 채널별 매출 × 100','bar',N'마진(%)',N'[22,18,15,28,12]','radar',N'["온라인","오프라인","대리점","직판","수출"]',N'[28,18,15,32,22]','%','N',635,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'SA15','SA_SCM',N'SA. 판매 분석',N'프로모션 ROI','N',N'마케팅/재무',N'월간',N'프로모션 비용 대비 매출 증가 효과.',N'(프로모션 증가 매출 - 비용) / 비용 × 100','bar',N'ROI(%)',N'[180,220,250,280,320,350]','pie',N'["수익","BEP","손실"]',N'[70,20,10]','%','N',636,N'system',GETDATE()),
(REPLACE(NEWID(),'-',''),'SA16','SA_SCM',N'SA. 판매 분석',N'고객 만족도 (NPS)','N',N'영업/CS',N'분기',N'Net Promoter Score. 추천 의향 설문 점수.',N'추천자% - 비추천자%','line',N'NPS',N'[35,42,48,52,58,65]','pie',N'["추천(9-10)","중립(7-8)","비추천(0-6)"]',N'[65,20,15]','','N',637,N'system',GETDATE());


-- =============================================================
-- 결과 확인
-- =============================================================
SELECT CATEGORY_CD, CATEGORY_NAME, COUNT(*) AS CNT
  FROM TB_IS_COMPOSER_KPI_DICT
 GROUP BY CATEGORY_CD, CATEGORY_NAME
 ORDER BY CATEGORY_CD;

SELECT COUNT(*) AS TOTAL_KPIS FROM TB_IS_COMPOSER_KPI_DICT;

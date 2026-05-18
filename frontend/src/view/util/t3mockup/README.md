# T3Mockup — UI 패턴 목업 갤러리

> T3Series 의 34개 UI 패턴 목업을 한곳에 모은 정적 viewer. Composer LLM 학습 / 디자인 시스템 문서 / 신규 화면 디자인 참조용.

## 진입점

- **인덱스 화면**: `T3Mockup.jsx`
  - 3축 필터 (category · layout · 검색어)
  - 그리드/리스트 뷰 토글
  - 카드 클릭 → 해당 패턴 목업이 같은 ContentInner 안에 lazy 렌더
- **메타 export**: `index.js` 의 `MOCKUP_ENTRIES` (34개)

## 라우팅 등록 (Phase 5 작업)

이 화면을 메뉴에 노출하려면:

```sql
-- TB_AD_MENU INSERT
INSERT INTO TB_AD_MENU (ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN, CREATE_BY, CREATE_DTTM)
SELECT LOWER(REPLACE(NEWID(), '-', '')),
       (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'MENU_UTIL'),
       'UI_UT_T3_MOCKUP',
       N'유틸리티 > T3Mockup 갤러리',
       180,
       '/util/T3Mockup',                  -- contentStore.js 자동 변환 → view/util/t3mockup/T3Mockup.jsx
       'Y', 'composer', GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM TB_AD_MENU WHERE MENU_CD = 'UI_UT_T3_MOCKUP');

-- TB_AD_LANG_PACK ko/en/ja/zh (4언어)
-- TB_AD_PERMISSION_GROUP 형제 메뉴 권한 복사
```

상세 가이드: `docs/UI-ANALYSIS-OVERVIEW.md` §"Phase 5 — T3Composer 에 적용"

## 디렉토리 구조

```
t3mockup/
├── _data/mockData.js          공통 SCM 도메인 더미 데이터
├── _shared/MockShell.jsx      ContentInner + 헤더 Chip 공통 래퍼
├── T3Mockup.jsx               인덱스 갤러리 화면
├── index.js                   MOCKUP_ENTRIES (메타 + lazy component)
├── README.md                  (이 문서)
│
├── 정규 패턴 (12개)
│   search_grid/SearchGridMockup.jsx
│   widget_dashboard/WidgetDashboardMockup.jsx
│   grid_chart_stacked/GridChartStackedMockup.jsx
│   v2_dual_grid/V2DualGridMockup.jsx
│   search_tab/SearchTabMockup.jsx
│   P02b_grid_only/GridOnlyMockup.jsx
│   P09_chart_view/ChartViewMockup.jsx
│   h2_tree_grid/TreeGridMockup.jsx
│   rl_layout_design/RouteLayoutMockup.jsx
│   cb_master_dashboard/ControlBoardMockup.jsx
│   pivot_table/PivotTableMockup.jsx
│   split_master_detail/MasterDetailMockup.jsx
│
├── 도메인 변형 (13개)
│   cb_gantt_master/    cb_chart_master/
│   pe_pivot_grid_edit/ pe_grid_edit/    pe_gantt_edit/
│   mn_kpi_dashboard/   mn_grid_alert/   mn_simple/
│   gantt_view/         v3_multi_grid/   v4_multi_grid/
│   h2_master_detail/   mix_split/
│
└── 메타 카테고리 (9개 — DB 시드 대상 아님)
    popup/  widget_chart/  widget_grid/  widget_pivot/  widget_panel/  widget_misc/
    subcomponent/  base_wrapper/  free_form/
```

## 외부 의존성

- `@wingui/common/imports` — `ContentInner` 만 사용
- `@mui/material`, `@mui/icons-material` — 정적 UI 컴포넌트
- 외부 차트 라이브러리 **없음** (SVG 직접 작성)
- RealGrid2 / 백엔드 호출 / Zustand store 사용 **없음** (정적 viewer)

## 공통 더미 데이터 (`_data/mockData.js`)

| 변수 | 내용 |
|---|---|
| `ITEMS` | 14개 품목 (LED Module / Camera Sensor / Battery / Display / PCB / Resistor / Capacitor) |
| `ACCOUNTS` | 9개 거래처 (Samsung Display · LG Innotek · Sony · BOE · Apple · TSMC · Murata 등) |
| `LOCATIONS` | 8개 거점 (KR-Suwon · KR-Asan · VN-Hanoi · VN-HCMC · CN-Wuxi · CN-Suzhou · US-Austin · MX-Tijuana) |
| `DEPARTMENTS` / `POSITIONS` | 5개 부서 / 5개 직위 |
| `PURCHASE_ORDERS` · `SALES_ORDERS` · `WORK_ORDERS` | 각각 4~5건 — `PO-2026-XXXX` / `SO-2026-XXXX` / `WO-2026-XXXX` |
| `WEEK_BUCKETS` · `FORECAST_TS` · `ACTUAL_TS` | 12주 시계열 (W14 ~ W25) |
| `KPI_CARDS` | 6개 KPI (RTF · 재고정확도 · 결품률 · DOH · 출하량 · MAPE) |
| `ALERTS` | 4개 알람 (CRITICAL/WARNING/INFO) |
| `USERS` | 5명 (P02 마스터 CRUD 샘플) |

## Phase 5 에서 확장 가능

- 모듈 ↔ 패턴 cross-tab (Phase 1 의 `ui-inventory.json` 을 사용)
- 마크다운 본문 우측 패널 (Phase 2 의 모듈별 markdown fetch)
- 실제 화면 deep link (해당 패턴을 사용하는 t3series 의 실 화면 경로)
- 패턴 코드 검색 → 자동 import 코드 스니펫 추출

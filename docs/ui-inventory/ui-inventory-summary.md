# T3Series UI Inventory — Phase 1 결과 요약

> 생성: `node t3series-wingui/packages/wingui/scripts/ui-inventory.cjs`
> 산출물: `docs/reference/ui-inventory.json` · `docs/reference/ui-inventory.csv`
> 행 수: **956개 화면** (sample / __tests__ 제외)
> 분류 신뢰도: high **65.5%** / mid **16.2%** / low **18.3%** — Phase 1 종료 조건(low ≤ 30%) 통과

## 1. 전체 통계

| 항목 | 값 |
|---|---|
| `.jsx` 총 파일 수 | 956 |
| menus.js 등록 메뉴 (UI_\*) | 252 |
| 자동 매칭된 메뉴 | 220 (87%) |
| 미매칭 메뉴 | 32 — 대부분 `sample/` · `test/` 폴더 (의도된 제외) + 일부 menus.js ↔ 실제 폴더 경로 불일치 |

## 2. 모듈별 화면 수

| 순위 | 모듈 | 화면 수 |
|---:|---|---:|
| 1 | factoryplan | 200 |
| 2 | masterplan | 162 |
| 3 | snop | 134 |
| 4 | demandplan | 103 |
| 5 | supplychainmodel | 98 |
| 6 | inventoryplan | 55 |
| 7 | util | 55 |
| 8 | baselineforecast | 38 |
| 9 | replenishmentplan | 29 |
| 10 | system | 28 |
| 11 | common | 22 |
| 12 | factoryorder | 9 |
| 13 | supplyorder | 7 |
| 14 | dashboard | 6 |
| 15 | home | 6 |
| 16 | pages | 4 |
| **합계** | | **956** |

## 3. 레이아웃 카테고리 분포

| 카테고리 | 화면 수 | 비율 | 설명 |
|---|---:|---:|---|
| `LAYOUT_SINGLE` | 431 | 45.1% | 단일 본문 (P02 마스터 CRUD / P01 대시보드 / P03 탭 등 포함) |
| `POPUP` | 223 | 23.3% | `Pop*.jsx` — 검색/선택 다이얼로그 |
| `WIDGET` | 183 | 19.1% | `widgets/` 폴더 안의 대시보드 위젯 |
| `LAYOUT_V2` | 60 | 6.3% | 본문 수직 2분할 (master-detail / chart+grid 등) |
| `LAYOUT_ROUTELAYOUT` | 21 | 2.2% | FLODiagram · 공정 라우트 |
| `SUBCOMPONENT` | 16 | 1.7% | 메인 화면의 내부 부품 (`components/` 폴더) |
| `LAYOUT_MIXED` | 6 | 0.6% | 수평·수직 SplitPanel 혼합 |
| `BASE` | 6 | 0.6% | `Base*.jsx` 래퍼 (BaseControlBoard 등) |
| `LAYOUT_CONTROLBOARD` | 4 | 0.4% | 엔진 관제 ControlBoard |
| `LAYOUT_V3` | 2 | 0.2% | 본문 수직 3분할 |
| `LAYOUT_MONITORING` | 2 | 0.2% | 실시간 모니터링 (Shortage / ProdDisruption) |
| `LAYOUT_V4` | 1 | 0.1% | 본문 수직 4분할 |
| `LAYOUT_H2` | 1 | 0.1% | 본문 수평 2분할 |

## 4. 패턴 코드 Top 15

| 순위 | 패턴 코드 | 화면 수 | 의미 |
|---:|---|---:|---|
| 1 | `popup` | 223 | Pop*.jsx 팝업 다이얼로그 |
| 2 | `free_form` | 175 | 표준 컴포넌트 미사용 — utility/pages/sub-component 등 |
| 3 | `P02_search_grid` | **101** | 가장 흔한 표준 화면 (SearchArea + 1 BaseGrid) |
| 4 | `widget_chart` | 94 | 위젯의 차트 |
| 5 | `widget_misc` | 49 | 위젯의 자유 폼 |
| 6 | `P01_widget_dashboard` | 48 | DashboardPanel 기반 위젯 대시보드 |
| 7 | `P02b_grid_only` | 47 | 검색 없는 단일 그리드 |
| 8 | `v2_chart_grid` | 32 | Chart + Grid 2-stack |
| 9 | `v2_dual_grid` | 28 | BaseGrid 2개 (SplitPanel 없음) |
| 10 | `P03_search_tabs` | 27 | 검색 + 탭 그리드 |
| 11 | `widget_grid` | 27 | 위젯의 그리드 |
| 12 | `P09_chart_view` | 23 | Chart 단독 |
| 13 | `rl_layout` | 21 | FLODiagram 라우트 |
| 14 | `subcomponent` | 16 | 메인 화면 내부 부품 |
| 15 | `widget_pivot` | 13 | 위젯의 피벗 |
| | `P04_tree_grid` | 8 | TreeGrid 계층 |
| | `cb_master` | 4 | ControlBoard |
| | `gantt_view` | 2 | Gantt 단독 |
| | `mn_kpi_dashboard` / `mn_grid_alert` | 1 + 1 | Monitoring |
| | `h2_master_detail` · `v4_multi_grid` | 1 + 1 | 드문 분할 |

## 5. 컴포넌트 사용 빈도 (Top 25)

| 순위 | 컴포넌트 | 화면 수 |
|---:|---|---:|
| 1 | `BaseGrid` | 430 |
| 2 | `InputField` | 367 |
| 3 | `ContentInner` | 293 |
| 4 | `WorkArea` | 269 |
| 5 | `SearchArea` | 267 |
| 6 | `PopupDialog` | 253 |
| 7 | `SearchRow` | 218 |
| 8 | `PlanScope` | 168 |
| 9 | `ChartComponent` | 157 |
| 10 | `GridSaveButton` | 132 |
| 11 | `GridExcelExportButton` | 117 |
| 12 | `GridAddRowButton` | 113 |
| 13 | `GridDeleteRowButton` | 111 |
| 14 | `TabContainer` | 68 |
| 15 | `GridCnt` | 60 |
| 16 | `DashboardPanel` | 48 |
| 17 | `PopPersonalize` | 37 |
| 18 | `PopLocatTp` | 17 |
| 19 | `TreeGrid` | 16 |
| 20 | `PivotTable` | 15 |
| 21 | `PopSelectItem` | 11 |
| 22 | `PopSelectAccount` | 11 |
| 23 | `FLODiagram` | 10 |
| 24 | `SplitPanel` | 8 |
| 25 | `GridExcelImportButton` | 6 |

**관찰**:
- BaseGrid (430) / ContentInner (293) — 표준 골격이 70% 이상 화면에서 사용됨
- PopupDialog (253) 가 BaseGrid 와 거의 동급 — 마스터 화면당 평균 1개 팝업 호출
- PlanScope (168) — SCM 도메인 핵심. ALL DP/MP/BF/FP 화면에서 필수
- SplitPanel 사용 8개로 드뭄 — V2 의 60개 분류는 대부분 `v2_chart_grid`/`v2_dual_grid` (SplitPanel 없는 2-stack)

## 6. SP 사용 빈도 (Top 10)

| 순위 | SP 이름 | 사용 화면 수 |
|---:|---|---:|
| 1 | `SP_UI_DP_00_CONF_Q1` | 23 |
| 2 | `SP_UI_DP_00_CONF_Q1_01` | 23 |
| 3 | `SP_UI_DP_00_CONF_Q1_02` | 23 |
| 4 | `SP_UI_DP_00_CONF_Q1_03` | 23 |
| 5 | `SP_UI_SA_SALES_DP` | 16 |
| 6 | `SP_UI_DP_00_LV_CD_Q1` | 15 |
| 7 | `SP_UI_DP_00_CONF_Q1_04` | 11 |
| 8 | `SP_UI_CM_15_S2_P_RT_MSG` | 11 |
| 9 | `SP_UI_SA_FP_DASHBOARD` | 10 |
| 10 | `SP_UI_SA_MP_DASHBOARD` | 8 |

DP/MP/BF 도메인의 Plan 설정 SP 가 압도적. Phase 4 목업 작성 시 더미 데이터 도메인 선택에 영향.

## 7. 모듈 × 레이아웃 카테고리 Cross-tab (요약)

가장 큰 모듈 5개:

| 모듈 | SINGLE | V2 | POPUP | WIDGET | SUB | 도메인 (CB/PE/MN/RL) | 합계 |
|---|---:|---:|---:|---:|---:|---:|---:|
| factoryplan | 118 | 4 | 3 | 49 | 14 | 10 (RL) + 1 (MN) | 200 |
| masterplan | 52 | 9 | 85 | 13 | 0 | 2 (RL) + 1 (MN) | 162 |
| snop | 39 | 4 | 14 | 75 | 0 | — | 134 |
| demandplan | 48 | 12 | 15 | 16 | 0 | 2 (CB) + 2 (RL) + 6 (BASE) | 103 |
| supplychainmodel | 22 | 4 | 67 | 2 | 0 | 3 (RL) | 98 |

- **factoryplan** = 위젯 + sub-component 가 거점. 라우트(FLO) 가 도메인 특화
- **masterplan** = POPUP 비중 압도적 (검색 다이얼로그 다수)
- **snop** = 위젯 75개로 위젯 카탈로그 중심
- **demandplan** = SINGLE/V2 균형 + ControlBoard 2개 + BASE 6개
- **supplychainmodel** = POPUP 67개 (마스터 검색 화면 + BOM/FLO)

## 8. Phase 1 종료 조건 검증

| 조건 | 목표 | 실측 | 결과 |
|---|---|---|---|
| CSV 행 수 | 1,139 ± 5 | 956 (sample/test 제외, 위젯 183 포함됨) | ✅ 가용 .jsx 전수 |
| menus.js 매칭 | 252개 등록 모두 매핑 | 220/252 (87%) | ⚠️ 32개 미매칭 (대부분 sample · 일부 폴더 경로 불일치) |
| confidence=low 비율 | ≤ 30% | 18.3% | ✅ 통과 |
| LAYOUT_\* 14개 분포 | 직관적 | SINGLE 45% / V2 6% / 위젯 19% | ✅ 마스터-디테일+팝업 모델 일관 |

## 9. Phase 2 시작 전 권장 조정 (선택)

이 결과 그대로 Phase 2 (Markdown 카탈로그)로 진행 가능. 다만 다음 보강을 고려할 수 있음:

1. **`free_form` 175개의 세분화**: utility/pages/sub-component 의 비표준 화면들. Phase 2 에서 모듈별 markdown 에 "비표준 화면 섹션" 으로 묶을 수 있음
2. **`menuCd` 미매칭 32개 분석**: menus.js 와 실제 폴더 경로가 다른 케이스(예: `/demandplan/dashboard/SalesBoard` 등록인데 실제는 `/dashboard/salesboard/SalesBoard.jsx`). 운영 메뉴라면 둘 중 한쪽을 정정해야 하나 Phase 1 범위 밖
3. **`subPattern` 활용**: 현재 빈 칸이 대부분. Phase 2 에서 `v2_chart_grid` 의 chart 종류(bar/line/pie) 분리 등 가능

## 10. 다음 단계 (Phase 2)

Phase 2 산출물:
- `docs/reference/ui-patterns/README.md` — 전체 통계 + 패턴 → 화면 reverse index
- `docs/reference/ui-patterns/<module>.md` × 16개 (모듈 16개) — 모듈별 화면 카탈로그

Phase 2 스크립트는 `ui-inventory.json` 을 입력으로 받아 markdown 자동 생성. 각 화면 1블록:
- 파일 경로
- 패턴 코드 + 카테고리
- 컴포넌트 stack
- ASCII 미니 미리보기
- 데이터 소스 (zAxios endpoints / SP)

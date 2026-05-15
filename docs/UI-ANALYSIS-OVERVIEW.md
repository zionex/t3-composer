# T3Series UI 분석 · 패턴 카탈로그 · 목업 (Phase 1~4 산출물)

> 부모 `t3series` 의 956개 화면을 자동 분류하여 UI 패턴별로 정리한 작업 결과. T3Composer LLM 학습/참조용, 디자인 시스템 문서, 신규 화면 갤러리 UI 의 베이스 자료.
>
> **2026-05-15 t3-composer 로 이관됨.** 원본은 `t3series/` 와 `t3series-wingui/.../scripts/` 그대로 보존.

## Phase 진행 현황

| Phase | 상태 | 내용 |
|---|---|---|
| 1 | ✅ 완료 | 화면 정적 분석 + 자동 패턴 분류 (956개 화면) |
| 2 | ✅ 완료 | 모듈별 markdown 카탈로그 (17 파일) |
| 3 | ✅ 완료 | DB 시드 ↔ PatternPreview ↔ 분류기 3-way cross-check |
| 4 | ✅ 완료 | Full-size JSX 목업 34개 + 인덱스 갤러리 |
| 5 | ⏳ 다음 | T3Composer 화면에서 갤러리 UI 생성 + TB_AD_MENU 등록 |
| 6 | ⏳ 후속 | Composer 통합 — prompt builder 가 산출물 참조 |

## 디렉토리 구조 (t3-composer 안)

```
t3-composer/
├── docs/
│   ├── ui-inventory/               ★ Phase 1 산출물
│   │   ├── ui-inventory.json       (956개 화면 raw 메타데이터, 720KB)
│   │   ├── ui-inventory.csv        (Excel 호환, UTF-8 BOM, 300KB)
│   │   └── ui-inventory-summary.md (통계 요약)
│   ├── ui-patterns-auto/           ★ Phase 2 산출물 — 자동 생성 카탈로그
│   │   ├── README.md               (전체 인덱스 + 패턴 reverse index)
│   │   └── <module>.md × 16        (모듈별 카탈로그, 총 ~800KB)
│   ├── pattern-coverage/           ★ Phase 3 산출물 — 3-way cross-check
│   │   ├── pattern-coverage.md     (보고서)
│   │   └── pattern-coverage.json   (raw)
│   └── UI-ANALYSIS-OVERVIEW.md     (이 문서)
│
├── scripts/                        ★ 분석 스크립트 (Node.js · 의존성 없음)
│   ├── ui-inventory.cjs            (Phase 1 — 정적 분류기)
│   ├── ui-patterns-gen.cjs         (Phase 2 — markdown 생성기)
│   └── pattern-coverage.cjs        (Phase 3 — cross-check)
│
└── frontend/src/view/util/t3mockup/  ★ Phase 4 산출물 — JSX 목업
    ├── _data/mockData.js           (공통 SCM 더미 데이터)
    ├── _shared/MockShell.jsx       (ContentInner + 헤더 공통 래퍼)
    ├── T3Mockup.jsx                (인덱스 갤러리 화면 — 3축 필터)
    ├── index.js                    (34개 MOCKUP_ENTRIES 메타)
    └── <patternCode>/<File>.jsx × 34  (각 패턴별 목업)
```

## 작업 요약

### Phase 1 — 화면 정적 분석 (956개)
- 모듈 18개 × 평균 53개 화면 = 956개 (sample/test 제외)
- 자동 분류 신뢰도: high **65.5%** / mid 16.2% / low **18.3%** (목표 30% 이하 달성)
- 컴포넌트 사용 빈도: `BaseGrid` 430 > `InputField` 367 > `ContentInner` 293
- 가장 흔한 패턴: `search_grid` (101개, P02 마스터 CRUD)

### Phase 2 — Markdown 카탈로그 (17 파일)
- 17,659 줄 / 약 800KB
- 각 화면 entry: 패턴 코드 + 컴포넌트 stack + SP 매핑 + ASCII 미니 미리보기
- `README.md` 의 "패턴 → 화면 Reverse Index" 로 패턴별 화면 검색

### Phase 3 — Cross-check
- **DB 시드 ↔ PatternPreview 완벽 동기화** (255:255)
- 분류기 alias 정규화 후 16개 신규 코드 잔존
- 9개는 **메타 카테고리** (popup / widget_* / subcomponent / base_wrapper / free_form) — DB 시드 대상 아님
- 7개는 DB 시드 추가 후보: `P02b_grid_only` (47), `v2_dual_grid` (28), `P09_chart_view` (23) 등

### Phase 4 — 54개 high-fidelity 목업 (Phase 4a 보강 — 2026-05-15)
- **MUI + SVG 기반 정적 viewer** (RealGrid2 등 무거운 의존성 없음 — 빠른 빌드)
- **공통 더미 데이터**: 14개 품목 (LED/Camera/Battery/Display) · 9개 거래처 (Samsung/LG/Sony) · 8개 거점 (KR-Suwon/VN-Hanoi/CN-Wuxi)
- **5 카테고리**:
  - **정규 (12개)**: search_grid · widget_dashboard · grid_chart_stacked · v2_dual_grid · search_tab · P02b_grid_only · P09_chart_view · h2_tree_grid · rl_layout_design · cb_master_dashboard · pivot_table · split_master_detail
  - **도메인 (13개)**: cb_gantt_master · cb_chart_master · pe_pivot_grid_edit · pe_grid_edit · pe_gantt_edit · mn_kpi_dashboard · mn_grid_alert · mn_simple · gantt_view · v3_multi_grid · v4_multi_grid · h2_master_detail · mix_split
  - **Dashboard (16개)** ★ 신규: dash_executive · dash_overview · dash_kpi_board · dash_supply_kpi · dash_ontime_sales · dash_sales_growth · dash_production_perf · dash_simulation_kpi · dash_inout_status · dash_plan_problem · dash_wip_eoh · dash_sales_board · dash_demand_board · dash_supply_board · dash_psi_board · dash_inven_board
  - **ControlBoard (4개)** ★ 신규: cb_bf_forecast · cb_insight_prediction · cb_dp_demand · cb_bp_yearly
  - **메타 (9개)**: popup · widget_chart · widget_grid · widget_pivot · widget_panel · widget_misc · subcomponent · base_wrapper · free_form

### Phase 4a — Dashboard / ControlBoard 개별 mockup 추가 (2026-05-15)
- **배경**: 분류기 (`scripts/ui-inventory.cjs`) 가 운영 dashboard 47~62개를 단일 `widget_dashboard` 로, ControlBoard 5종을 단일 `cb_master_dashboard` 로 축약 → 다양성 손실
- **해결**: 운영 화면 1:1 mockup 도입 — `category: 'dashboard' | 'controlboard'` 신규, 각 entry 에 `sourceMenuCd` + `sourceFilePath` 첨부
- **공통 sub**: `_shared/BoardWidgetTile.jsx` (5 Board) · `_shared/CbStepper.jsx` · `_shared/CbLogPane.jsx` (4 ControlBoard)
- **신규 entry 20개** (`MOCKUP_ENTRIES` 34→54): 위 Dashboard 16 + ControlBoard 4
- **T3Mockup.jsx** filter chips 에 Dashboard / ControlBoard 추가 + 브라우저 뒤로가기 ↔ active state 연동 (popstate + history.pushState)
- **App.jsx 메뉴 등록**: t3-composer 단독 frontend 의 상단 메뉴 바에 `목업` Tab 추가 (`MENU_ITEMS` 에 5번째)

### Phase 4b — 운영 메뉴 ↔ mockup 매핑 (2026-05-15)
- **배경**: 사용자가 "T3SmartSCM 의 어느 메뉴에서 이 mockup 패턴이 쓰이는지 알고 싶다" 요청
- **해결**:
  - target=T3SERIES 운영 DB → leaf 메뉴 (filePath 보유) **263개** 추출 → `frontend/src/view/util/t3mockup/_data/t3smartscm-menus.json`
  - 자동 매핑 스크립트 (`scripts/mockup-menu-mapping.cjs`) — Phase 1 ui-inventory 의 patternCode 직접 매칭 (78%) + 키워드/폴더 fallback (22%)
  - 결과: **263/263 (100%) 매핑** → `frontend/src/view/util/t3mockup/_data/t3smartscm-menu-mapping.json`
- **index.js 구조 변경**:
  - `T3SMART_SCM_ENTRIES` (54) + `PLANEL_ENTRIES` (placeholder, 향후 추가) 두 그룹으로 분리
  - 최종 `MOCKUP_ENTRIES` 는 각 entry 에 `productLine` + `menus: [{ menuId, menuNm, filePath, reason }]` 자동 부여
  - 새 export: `PRODUCT_LINE_LABEL`, `MENU_TO_MOCKUP`

### Phase 4c — productLine 축 + 검색·UI 보강 (2026-05-15)
- **T3Mockup.jsx** 필터바 2-line 구조:
  - L1: `Product Line` 토글 — 전체 / T3SmartSCM (54) / PlaNEL (0)
  - L2: `Category` 토글 — 현재 productLine 의 동적 카운트 (`visibleCategoryCount`)
- **검색 input**: 메뉴ID, 메뉴명, filePath 도 매칭 대상 — `UI_FP_16`, `재고`, `생산` 등으로 mockup 카드 검색 가능
- **카드/리스트**: `📋 N` chip 으로 매핑된 운영 메뉴 수 노출
- **본문 진입 — `ActiveView` 컴포넌트**:
  - 헤더 우측 `[사용 메뉴 N개]` 토글 버튼 → `<Collapse>` 안 `<Table>` 펼침
  - 컬럼: `#`, `메뉴ID`, `메뉴명`, `경로 (filePath)`, `매핑 근거`
  - 테이블 위 검색 input — 매핑 mockup 안에서 메뉴 빠른 조회 (특히 `search_grid` 87개 메뉴 안에서)
  - sticky header + maxHeight 280px overflow

### Phase 5 (다음) — Composer 통합 (옵션)
- Composer 의 `NEW_FROM_COPY` / `NEW_FROM_DESIGN` 모드가 mockup 갤러리를 참조 자료로 사용 가능
- 예: NEW_FROM_COPY 진입 시 사용자가 mockup patternCode 선택 → LLM prompt 에 `sourceFilePath` 와 매핑된 운영 메뉴 정보 첨부

---

## 산출물 파일 카운트 (Phase 4c 기준)

```
frontend/src/view/util/t3mockup/
├── _data/
│   ├── mockData.js                     공통 더미 SCM 데이터
│   ├── t3smartscm-menus.json           운영 메뉴 263개 (Phase 4b)
│   └── t3smartscm-menu-mapping.json    mockup ↔ menu 매핑 결과 (Phase 4b)
├── _shared/
│   ├── MockShell.jsx                   ContentInner + 헤더 래퍼
│   ├── BoardWidgetTile.jsx             5개 Board 의 공통 위젯 타일 (Phase 4a)
│   ├── CbStepper.jsx                   4개 ControlBoard 의 공통 Stepper (Phase 4a)
│   └── CbLogPane.jsx                   4개 ControlBoard 의 공통 로그 패널 (Phase 4a)
├── <patternCode>/<File>.jsx × 54       각 mockup
├── T3Mockup.jsx                        인덱스 갤러리 + ActiveView
└── index.js                            MOCKUP_ENTRIES + 매핑 통합

전체 jsx 파일: 59개 (54 mockup + MockShell + 3 sub + T3Mockup + index 미포함)
```

## 스크립트 재실행 방법

스크립트는 입력 소스인 t3series 폴더를 자동 탐색합니다 (형제 폴더 `../t3series` 우선).

```bash
# t3-composer 루트에서 실행
cd /c/Project/t3-composer

# Phase 1 — 화면 인벤토리 재생성
node scripts/ui-inventory.cjs

# Phase 2 — markdown 카탈로그 재생성 (Phase 1 결과 입력)
node scripts/ui-patterns-gen.cjs

# Phase 3 — cross-check 재실행
node scripts/pattern-coverage.cjs
```

### 환경변수 (선택)
t3series 가 형제 폴더가 아니면 명시:
```bash
T3SERIES_ROOT=/path/to/t3series node scripts/ui-inventory.cjs
```

### 자동 탐색 우선순위
1. `process.env.T3SERIES_ROOT`
2. `../t3series` (형제 폴더 — 권장)
3. `../../t3series`
4. 부모 디렉토리 추정 (원본 위치 호환)

스크립트가 자기 위치를 인식해 자동으로 출력 디렉토리 결정:
- `t3-composer/scripts/` 안 → `t3-composer/docs/ui-inventory/`, `pattern-coverage/`, `ui-patterns-auto/`
- 원본 `t3series/.../scripts/` 안 → `t3series/docs/reference/`

## T3Mockup 갤러리 진입 (Phase 5 전 사전 체크)

`frontend/src/view/util/t3mockup/T3Mockup.jsx` 가 모든 34개 목업의 인덱스 화면. 3축 필터(category/layout/검색) + 그리드/리스트 뷰 + lazy loading. 화면 진입 후 카드 클릭 시 해당 목업이 같은 ContentInner 안에 렌더.

**현재 라우팅 미등록 상태**. Phase 5 에서 다음 작업 필요:
1. `t3-composer/frontend` 의 라우트 설정 또는 `menus.js` 에 `t3mockup/T3Mockup` 추가
2. (선택) MENU_SQL 작성 — 부모 t3series 에 sync 할 때 사용

## Phase 5 — T3Composer 에 적용 (다음 단계)

플랜에 따라 T3Composer 의 `NEW_FROM_COPY` 또는 `NEW_FROM_DESIGN` 모드로 갤러리 화면을 정식 생성 + 메뉴 등록할 수 있습니다.

### 옵션 A — 기존 T3Mockup.jsx 그대로 활용
1. `frontend/src/view/util/t3mockup/T3Mockup.jsx` 를 라우팅 진입점으로 등록
2. `menus.js` (또는 TB_AD_MENU SQL) 에 `MENU_CD = UI_UT_T3_MOCKUP`, `filePath = /util/T3Mockup` 추가
3. 4언어 LANG_PACK + PERMISSION_GROUP 형제 메뉴 복사
4. `sync/` 스크립트로 t3series 에 동기화

### 옵션 B — T3Composer 로 정식 생성 (plan 5단계 본문)
1. T3Composer Web (`http://localhost:5173/composer`) 진입
2. `NEW_FROM_COPY` 모드 + 원본으로 `T3ComposerPatterns.jsx` 선택 (갤러리 베이스 템플릿)
3. 신규 메뉴 `UI_UT_UI_GALLERY` 입력
4. 9-Step Wizard 진행 + Step9 에서 LLM 생성 트리거
5. 생성된 갤러리 화면이 `t3mockup/index.js` 의 `MOCKUP_ENTRIES` 를 import 해 사용하도록 changeReq 에 명시

옵션 A 가 더 단순하고 빠릅니다 (이미 갤러리 화면 작성됨). 옵션 B 는 T3Composer 의 NEW_FROM_COPY 모드 자체를 검증하는 의미가 있습니다.

## 산출물 검증 명령

```bash
# 파일 수 확인
find docs/ui-patterns-auto -name "*.md" | wc -l           # 17 (README + 16 모듈)
find frontend/src/view/util/t3mockup -name "*.jsx" | wc -l # 36 (34 mockup + MockShell + T3Mockup)

# 분류 일관성 (이관 후 재실행)
node scripts/ui-inventory.cjs && \
node scripts/ui-patterns-gen.cjs && \
node scripts/pattern-coverage.cjs

# index.js 의 모든 lazy import 가 실존 파일과 매칭되는지
node -e "
const fs = require('fs'), path = require('path');
const text = fs.readFileSync('frontend/src/view/util/t3mockup/index.js','utf8');
const re = /patternCode:\s*'([^']+)'[\s\S]*?import\('([^']+)'\)/g;
let m, miss = 0, total = 0;
while ((m = re.exec(text)) !== null) {
  total++;
  if (!fs.existsSync(path.join('frontend/src/view/util/t3mockup', m[2] + '.jsx'))) {
    miss++;
    console.log('MISSING:', m[1]);
  }
}
console.log('total:', total, '· missing:', miss);
"
```

## 관련 문서

- 부모 `t3series/CLAUDE.md` — Composer 골든룰 + 패턴 규약
- 부모 `t3series/.claude/rules/40-composer-patterns.md` — DB 시드 카테고리·정렬 규약
- 부모 `t3series/.claude/rules/41-composer-generation.md` (+ sub 4개) — Composer 화면 생성 가이드
- `docs/ui-patterns/README.md` — 기존 T3Series 14개 수동 패턴 가이드 (이번 자동 분류와 별개로 보존)
- `docs/ui-patterns-auto/README.md` — 이번 작업의 자동 생성 결과

---

*Phase 1~4 완료: 2026-05-15. 다음 작업: Phase 5 (T3Composer 갤러리 UI 정식 등록).*

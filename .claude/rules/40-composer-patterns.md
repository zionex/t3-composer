# 40. T3Composer — Pattern / Dictionary / Preview 규칙

> **T3Composer** 는 자연어 요청으로부터 신규 화면의 레이아웃·데이터 바인딩·SP 를 자동 생성하는 화면 생성기입니다. 이 문서는 **패턴 카탈로그**, **사전(Dictionary)**, **미리보기 렌더러(PatternPreview)** 작성에 적용되는 규약입니다.

---

## 1. 모듈 구성

### 1.1 Frontend (React / MUI)
```
t3series-wingui/packages/wingui/src/view/util/
├── t3composer/              ← Composer 메인 워크스페이스
│   ├── T3Composer.jsx
│   ├── ComposerWorkspace.jsx
│   ├── PatternPreview.jsx   ← ★ 패턴 시각 미리보기 렌더러 (4,500+ 줄)
│   ├── PatternSelector.jsx
│   ├── api.js                ← zAxios 기반 /composer/** 호출 래퍼
│   └── constants.js
├── t3composerpatterns/       ← 화면 패턴 관리 화면
│   ├── T3ComposerPatterns.jsx
│   └── PatternFormDialog.jsx
└── t3composerdict/           ← Composer 갤러리(Grid/Chart/KPI 사전)
    ├── T3ComposerDict.jsx
    ├── GridTypeTab.jsx
    ├── ChartTypeTab.jsx
    ├── KpiDictTab.jsx
    └── api.js
```

### 1.2 Backend (Spring Boot · wingui)
```
src/main/java/com/zionex/t3series/web/domain/insight/composer/
├── (메인 CRUD/Chat/Session)
└── dictionary/                                    ← 사전 API
    ├── entity/ComposerGridType.java
    ├── entity/ComposerChartType.java
    ├── entity/ComposerKpiDict.java
    ├── repository/*.java
    ├── service/DictionaryService.java
    └── controller/DictionaryController.java         /composer/dictionary/{grid-types|chart-types|kpis}
```

### 1.3 DB (MSSQL `T3SMARTSCM.dbo`)
| 테이블 | 역할 |
|---|---|
| `TB_IS_COMPOSER_PATTERN`      | 화면 패턴 카탈로그 (255+ 레코드, 카테고리별 분류) |
| `TB_IS_COMPOSER_GRID_TYPE`    | Grid Type 사전 (RealGrid2 / TreeGrid / Pivot 등) |
| `TB_IS_COMPOSER_CHART_TYPE`   | Chart Type 사전 (Chart.js 60+ 변형) |
| `TB_IS_COMPOSER_KPI_DICT`     | KPI 사전 (S&OP 40개 + SCM 모듈별 112개 = 152개) |

### 1.4 메뉴
- `MENU_UT_T3COMPOSER` — Composer 메인
- `UI_UT_COMPOSER_PATTERNS` — 화면 패턴 관리
- `UI_UT_COMPOSER_DICT` — Composer 갤러리 (Grid/Chart/KPI)

---

## 2. 화면 패턴 카테고리 체계 (강제)

### 2.1 카테고리 코드 → 라벨 매핑
라벨에 **반드시 숫자 접두어** 포함. Drop-down / Pill / Grid 정렬 기준으로 사용.

| 코드                     | 라벨                   | 설명                       | 색상 (UI) |
|---                        |---                     |---                         |---        |
| `LAYOUT_SINGLE`           | `01 미분할 (단일)`     | 본문 layer 1개 (FilterBar 제외) — 기본 화면 | `#0ea5e9` |
| `LAYOUT_V2`               | `11 상하 2분할`        | 본문 수직 2-Split (FilterBar 제외)         | `#5281b3` |
| `LAYOUT_V3`               | `12 상하 3분할`        | 본문 수직 3-Split                           | `#3e6088` |
| `LAYOUT_V4`               | `13 상하 4분할`        | 본문 수직 4-Split                           | `#2a3d5c` |
| `LAYOUT_V5`               | `14 상하 5+분할`       | 본문 수직 5+ / 복합 상하                    | `#1a2438` |
| `LAYOUT_H2`               | `21 좌우 2분할`        | 본문 수평 2-Split                           | `#2a9d8f` |
| `LAYOUT_H3`               | `22 좌우 3분할`        | 본문 수평 3-Split                           | `#1f7a70` |
| `LAYOUT_H4`               | `23 좌우 4분할`        | 본문 수평 4-Split                           | `#145850` |
| `LAYOUT_H5`               | `24 좌우 5+분할`       | 본문 수평 5+ / 복합 좌우                    | `#0a3a34` |
| `LAYOUT_MIXED`            | `31 혼합·격자·특수`   | L자 / 크로스 / 사분면 등                    | `#fa7d5b` |
| `LAYOUT_CONTROLBOARD`     | `91 ControlBoard`      | 엔진 관제 · 31개 CB_* 패턴                  | `#8b5cf6` |
| `LAYOUT_PLANEDIT`         | `92 PlanEdit`          | 계획 보정 · 20개 PE_* 패턴 | `#00d68f` |
| `LAYOUT_MONITORING`       | `93 Monitoring`        | 실시간 관제 · 30개 MN_* 패턴 | `#00e5ff` |
| `LAYOUT_ROUTELAYOUT`      | `95 RouteLayout`       | 공정 라우트 · 3개 RL_* 패턴 | `#ffb347` |

### 2.2 정렬 규약 (강제)
패턴 목록 / 카테고리 드롭다운은 **라벨 앞 숫자 prefix 기준 오름차순 → 같은 prefix 내는 코드 알파벳 순** 으로 정렬한다.

```js
function categorySortKey(cat) {
  const label = CATEGORY_LABELS[cat]?.label || cat;
  const m = /^(\d+)/.exec(label);
  return m ? parseInt(m[1], 10) : 9999;
}
```

### 2.3 번호 예약 블록 (2026-04-30 변경)
- **0대** (01): **미분할 (단일)** — 본문 layer 1개 (FilterBar 제외 · 기본 화면)
- **10대** (11~14): **상하 분할** (V) — 본문 수직 N분할 (이전 21~24 였음)
- **20대** (21~24): **좌우 분할** (H) — 본문 수평 N분할 (이전 11~14 였음)
- **30대** (31): 혼합·격자·특수
- **90대** (91~99): 도메인 특화 (91 CB, 92 PE, 93 MN, 95 RL) — **신규 도메인은 94/96/97/98 중 선택**

★ 분류 시 **FilterBar (조회조건) 는 layer 카운트에서 제외** — 본문(WorkArea) 의 layers 만 보고 V/H/SINGLE 결정.

---

## 3. PatternPreview 렌더러 작성 규약

### 3.1 로직컬 캔버스
- 모든 미리보기는 **400×260 픽셀 기준** 으로 그린다 (aspectRatio 4/2.6).
- 외부 컨테이너는 임의 크기로 설정해도 내부 비율이 유지되도록 `position: absolute; inset: 0` 로 채운다.
- Tooltip 확대 시에는 **`transform: scale(viewportW × 0.5 / 400)`** 로 전체를 비율 확대 (고정 px 폰트를 키우기 위함).

### 3.2 폰트 크기 규약
고정 px 사용. CSS em/rem 은 사용하지 않음 (scale transform 호환성).

| 용도                    | fontSize | 예시                            |
|---                       |---       |---                              |
| 본문·표 셀·칩·라벨        | 5        | 테이블 행, 칩, 일반 텍스트       |
| 헤더·버튼·캡션            | 6        | 카드 제목, 버튼, 범례           |
| 강조 라벨·서브 타이틀     | 7        | 카드 서브 타이틀                |
| 스텝·스탯 값              | 8        | 작은 KPI 수치                   |
| 강조 수치                 | 9~10    | 주요 KPI 수치, 진척률 큰 값     |
| 히어로 수치               | 11~12   | 대시보드 메인 수치              |

### 3.3 색상 팔레트 (`DC` 객체, 다크 테마 전용)
```js
const DC = {
  bg:       '#0f1219',
  surface:  '#171b26',
  surface2: '#1d2331',
  surface3: '#262d40',
  border:   '#2f374e',
  border2:  '#404b69',
  text:     '#ebedf2',
  text2:    '#a5b0c7',
  text3:    '#626f8d',
  blue:     '#3b82f6',
  cyan:     '#06b6d4',
  green:    '#10b981',
  amber:    '#f59e0b',
  red:      '#ef4444',
  purple:   '#8b5cf6',
};
```
- 의미별 사용: **green=정상/완료**, **cyan=진행중/실시간**, **amber=주의/대기**, **red=위험/결품**, **blue=정보/조회**, **purple=AI/버전/차별화**, **text3=비활성/끝값**.

### 3.4 공용 Helper (이미 존재) — **재사용 필수, 중복 금지**

| Helper               | 역할                                          |
|---                    |---                                            |
| `CBWrap`             | 전체 400×260 컨테이너 (dark bg + padding)     |
| `CBHead`             | 상단 타이틀 + right 액션 영역                 |
| `CBCard`             | 내부 섹션 카드 (title, titleColor, borderColor, flex) |
| `CBRow(...items)`    | 수평 flex 컨테이너                            |
| `CBCol(...items)`    | 수직 flex 컨테이너                            |
| `CBTable`            | 표 (cols/rows/rowBg/colFlex/fontSize)         |
| `CBStepper`          | 단계별 진척 (steps, activeIdx)                |
| `CBTerminal`         | 터미널 스타일 로그 (lines, activeLine)        |
| `CBProgressRow`      | 라벨 + % 프로그레스 바                        |
| `CBBadge`            | 작은 상태 뱃지 (label, color)                 |
| `CBStat`             | 값 + 라벨 통계 카드                           |
| `CBBtn`              | 버튼 스타일 박스 (color, solid)              |
| `CBInput`            | 입력창 스타일 박스                            |
| `cbBadgeCell(l, c)`  | 테이블 셀용 뱃지 객체 생성                   |
| `cbSimpleTable(...)` | 단일 테이블 카드 래퍼                        |
| `cbCardGrid(...)`    | 카드 그리드 래퍼                             |

### 3.5 CBTable 셀 객체 API
셀은 문자열 또는 다음 객체 형태 지원:
```js
{
  v: string,           // 표시 값 (필수)
  color: '#xxx',        // 텍스트 색상
  bg: '#xxx33',         // 셀 배경색
  bold: true,           // 굵게
  mono: true,           // monospace 폰트 (Job ID, 수치, 날짜 등)
  align: 'right',       // 정렬 ('left' 기본)
}
```
- **규약**: 수치·Job ID·날짜는 `mono: true` + `align: 'right'`, 상태 뱃지는 `cbBadgeCell('label', DC.green)` 헬퍼 사용.

### 3.6 렌더러 네이밍 규약 (강제)
카테고리 접두어를 **반드시** 준수:

| 카테고리              | 렌더러 접두어 | 예시                       |
|---                    |---            |---                         |
| `LAYOUT_CONTROLBOARD` | `cb_*`        | `cb_master_dashboard`      |
| `LAYOUT_PLANEDIT`     | `pe_*`        | `pe_pivot_grid_edit`       |
| `LAYOUT_MONITORING`   | `mn_*`        | `mn_kpi_dashboard`         |
| `LAYOUT_ROUTELAYOUT`  | `rl_*`        | `rl_route_layout`          |
| `LAYOUT_SINGLE`       | `(자유명)`    | `search_grid`, `pivot_table`, `card_list`, `heatmap` |
| 상하/좌우/혼합 일반   | `(자유명)`    | `v2_kpi_grid`, `h2_master_detail`, `grid_2x2`        |

신규 렌더러는 `Object.assign(RENDERERS, { ... })` 블록에 추가. 한 카테고리 내 블록은 **한 번만** 작성 (중복 `Object.assign` 금지).

---

## 4. 사전(Dictionary) 작성 규칙

### 4.1 KPI 사전 스키마
```sql
TB_IS_COMPOSER_KPI_DICT (
  ID, CODE, CATEGORY_CD, CATEGORY_NAME, NAME,
  IS_MAIN,             -- Y/N, 대표 KPI 여부
  DEPARTMENT,          -- '영업팀' 등
  FREQUENCY,           -- '월간' / '주간' / '일간'
  DESCRIPTION, FORMULA,
  CHART1_TYPE, CHART1_LABEL, CHART1_DATA,        -- 주 차트
  CHART2_TYPE, CHART2_LABEL, CHART2_DATA, CHART2_UNIT,  -- 보조 차트
  IS_REVERSE_GAP,      -- Y = 낮을수록 좋음
  SORT_ORDER,
  USE_YN, CREATE_BY, CREATE_DTTM
)
```

### 4.2 KPI CODE 규약 (SCM 모듈 KPI)
- 형식: `<MODULE><NN>` (대문자, 2자리 번호)
- 모듈: `BF`, `DP`, `MP`, `FP`, `IM_SCM`(or `IM`), `RP`, `SA_SCM`(or `SA`)
- 예: `BF01` ~ `BF16`, `DP01` ~ `DP16`, ... `SA01` ~ `SA16`
- S&OP 범용 KPI 는 `SALES`, `PROD`, `INV`, `PUR`, `FIN` 카테고리 사용

### 4.3 Seed SQL 배치 경로
- 최신: `t3series-database/mssql/upgrade/v26.0.0/db_update_script_composer_dictionary_seed_kpi_scm_v2.sql`
- 재실행 안전성: **반드시 `DELETE FROM ... WHERE CODE IN (...)` 선행** 후 INSERT

---

## 5. 메뉴 라벨 변경 규칙 (LangPack)

### 5.1 `TB_AD_LANG_PACK` 컬럼
`LANG_CD`, `LANG_KEY`, `LANG_VALUE`, `CREATE_BY`, `CREATE_DTTM`, **`MODIFY_BY`**, **`MODIFY_DTTM`** (업데이트 시 사용).

❌ `UPDATE_BY` / `UPDATE_DTTM` 컬럼은 **존재하지 않음** — 관용적 실수 주의.

### 5.2 캐시 무효화
`LangPackService` 는 서버 시작 시 캐싱. 변경 반영을 위해:
- 서버 재시작 **또는**
- 로그인된 브라우저에서 `GET /system/lang-packs/{ko|en|ja|zh}/reload` 4개 호출

### 5.3 Composer 메뉴 4언어 기본
| LANG_KEY                   | ko                  | en                 | ja                      | zh           |
|---                          |---                  |---                 |---                      |---           |
| `UI_UT_COMPOSER_DICT`       | `Composer 갤러리`    | `Composer Gallery` | `コンポーザーギャラリー` | `生成器画廊` |
| `UI_UT_COMPOSER_PATTERNS`   | `화면 패턴 관리`     | `Pattern Catalog`  | `パターン管理`           | `画面模式管理` |

---

## 6. Tooltip 미리보기 크기 규칙

- **기본 크기**: 화면 폭의 50% (`viewportW × 0.5`), 최대 1200px
- **Placement**: `right` + Popper `flip` modifier (`fallbackPlacements: ['left','top','bottom']`) + `preventOverflow` (boundary: viewport, padding: 8, altAxis: true)
- **Scale 계산**: `scale = targetW / 400` 을 400×260 inner box 에 `transform: scale()` 적용
- **Overflow**: 외곽 Box 를 `overflow: hidden` 로 격리하여 transform 이 Tooltip 밖으로 침범하지 않게 함

---

## 7. 작성 체크리스트 (PatternPreview 렌더러 신규 추가 시)

- [ ] 카테고리 접두어(`cb_/pe_/mn_/rl_`) 준수?
- [ ] `RENDERERS` 에 추가, 중복 키 없음?
- [ ] `CBWrap` 최상위 래퍼 사용?
- [ ] `CBHead` 에 번호(①~㉚) 포함한 타이틀 작성?
- [ ] 공용 helper 재사용 (자체 styled Box 남발 금지)?
- [ ] fontSize 는 5~12 범위?
- [ ] DC 팔레트에서만 색상 선택?
- [ ] 실제 SCM 도메인 데이터 사용 (더미 'Item A', '01' 대신 'LED Module 60W', 'PO-2026-0042')?
- [ ] 테이블 수치는 `mono + align:right` 적용?
- [ ] 상태 컬럼은 `cbBadgeCell` 사용?
- [ ] 각 renderer 는 400×260 안에서 정보 전달되는지 (축약 OK, 공백 과다 NG)?

---

## 8. Anti-patterns (Composer 전용)

| # | 안티패턴 | 왜? |
|---|---|---|
| CP1 | 렌더러 내부에 `styled` 또는 복잡한 inline sx 블록 중복 작성 | 공용 helper 재사용 원칙 위반 |
| CP2 | fontSize 13+ 사용 | 400×260 캔버스 대비 과대, 스케일 깨짐 |
| CP3 | 컬러 hex 직접 하드코딩 | `DC.*` 팔레트 일관성 위반 |
| CP4 | `LAYOUT_*` 코드는 있으나 라벨에 숫자 prefix 누락 | 정렬 규약 위반 |
| CP5 | KPI CODE 중복 / SORT_ORDER 겹침 | 사전 조회 정합성 파괴 |
| CP6 | LangPack UPDATE 시 `UPDATE_BY`/`UPDATE_DTTM` 컬럼 사용 | 스키마에 없음 (MODIFY_BY/MODIFY_DTTM) |
| CP7 | Tooltip preview 를 transform scale 없이 width 만 키움 | 글자는 작게 남아 가독성 저하 |
| CP8 | 렌더러 네이밍 `cb_*` 접두어 위반 (예: `controlboard01`) | 카테고리-코드 매칭 깨짐 |
| CP9 | DDL/Seed 변경 시 `upgrade/vX.Y.Z/` 폴더 우회 | 버전 순서 관리 실패 |
| CP10 | 화면 패턴 관리 초기 진입 시 `LAYOUT_*='ALL'` 로 전체 렌더 | 200+ PatternPreview 동시 렌더로 INP 급증 → 기본 `LAYOUT_H2` 등 특정 카테고리로 시작 |

---

**최종 업데이트**: 2026-04-22

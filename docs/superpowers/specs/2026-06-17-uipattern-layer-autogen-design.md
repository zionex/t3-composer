# T3MES UI Pattern → ComposerSpec.layers 자동 생성 설계

> 작업 일자: 2026-06-17
> 작업 범위: Composer 4-Step Wizard 의 Layout 단계에서 T3MES UI Pattern 선택 시 layers 자동 채움
> 패리티 대상: SCM UI Mockup 선택 시의 `specFromMockup()` 동작

## 1. 배경

### 1.1 현재 동작

Composer 4-Step Wizard 의 진입 화면 `ModeNewStep` 에서 사용자는 패턴 picker, SCM UI Mockup picker, T3MES UI Pattern picker 중 하나를 골라 LayoutStep 으로 진입한다. 각 picker 가 만드는 `ComposerSpec.layers` 의 품질에 차이가 있다.

- `specFromPattern()` — 고정 카테고리(P02/P03/P04/P06/BLANK) 기준 정적 layers 생성
- `specFromMockup()` — mockup entry 의 `layers` 필드(12-col RGL 좌표)를 그대로 사용하거나, `layoutCategory` 별 폴백 템플릿 사용
- **`specFromUiPattern()` — `pattern: UIPATTERN_<file>#<tab>` 식별자만 세팅, layers 는 항상 `createComposerSpec()` 기본값(단일 mainGrid 1개)**

결과: T3MES UI Pattern 카탈로그에서 어떤 패턴을 골라도 LayoutStep 의 첫 캔버스 상태가 동일하다. 사용자가 매번 수동으로 layer 를 분할·배치해야 한다.

### 1.2 격차

- Mockup 은 작성자가 entry 에 `layers` 배열을 손으로 선언 (54개 mockup — 관리 가능)
- T3MES UI Pattern 은 외부 퍼블리싱 산출물 730+ 탭 — 사람이 일일이 메타를 달기 비현실적
- 가용 신호: lite HTML 마크업(DOM), `fileLabel/tabLabel`, `srcUrl`
- `UiPatternPickerDialog` 주석에는 "고른 패턴의 경량 마크업을 Claude 가 레이아웃 참조로 사용" 이라 적혀 있으나, 실제로는 자연어 prompt 첨부에만 쓰이고 ComposerSpec 에는 반영되지 않음

## 2. 목표·비목표

### 2.1 목표

- T3MES UI Pattern 선택 시 LayoutStep 진입 캔버스에 패턴의 대략적 구조를 layers placeholder 로 보여줌
- 사용자가 LayoutStep 에서 미세 조정 (위치·크기·layer 추가/삭제)
- Mockup picker 와 동일한 메타 구조(`entry.layers`) 사용 — 두 경로의 wizardState 로직 통일
- `pattern: UIPATTERN_<file>#<tab>` 식별자 보존 — downstream prompt 가 lite HTML 룩업하는 경로 변동 없음
- 워크플로 변동 없음 — CLAUDE.md 의 "신규/수정 시 `split-t3mes-tabs.cjs` 재실행" 그대로 유지

### 2.2 비목표

- T3MES 마크업 픽셀 단위 충실 재현 (LayoutStep 은 placeholder 정도면 충분 — Mockup 규약과 동일)
- 런타임 DOM 파싱 (deterministic 메타 철학 위배)
- 백엔드 변경 — 이 spec 의 범위는 frontend wizard 뿐. `ComposerPromptBuilder` · backend `PrefillFromSourceService` 등 손대지 않음. (`specToInitialPrompt` 가 새 `spec.layers` 를 자동 직렬화하는 부수효과는 자연스러운 확장이며 회귀 위험 없음)
- 다른 picker (`specFromMockup` · `specFromPattern` · `specFromSynthesized`) 동작 변경
- T3MES UI Pattern 카탈로그 화면 (`T3mesPatternCatalog`) 의 검색·필터 UI 변경

## 3. 설계 결정

### 3.1 추론 방식 — 빌드 타임 일괄 + 캐시

대안 비교:

| 전략 | 장점 | 단점 | 채택 |
|---|---|---|---|
| 런타임 lite HTML fetch + DOM 파싱 | 새 패턴 자동 적용 | 비-deterministic · sessionStorage 캐시 필요 · 첫 클릭 지연 | ✗ |
| **빌드 타임 일괄 파싱 + JSON 캐시** | **Mockup 과 동일 철학 · deterministic · 기존 워크플로 그대로** | 새 T3MES 패턴 추가 시 스크립트 재실행 필요 (이미 강제됨) | **✓** |
| 두 전략 결합 (빌드 캐시 + 런타임 폴백) | 중간 사례 자동 처리 | 복잡도 증가 · 폴백이 실제로 발화하는 케이스 거의 없음 | ✗ |

빌드 타임 채택 이유: 기존 `scripts/split-t3mes-tabs.cjs` 가 이미 T3MES HTML 을 일괄 처리해 `t3mes-tabs.json` + lite/full 파일을 생성하고 있다. 같은 스크립트에 layers 추출을 추가하면 워크플로 한 줄도 바뀌지 않는다. Mockup 의 hand-authored `entry.layers` 와 동일한 "deterministic 메타" 철학.

### 3.2 인식 시그니처 — 최소 세트

> ⚠️ **2026-06-17 보정**: lite HTML 은 wingui 컴포넌트 (`<BaseGrid>`/`<SearchArea>` 등) 가 아니라 T3MES 퍼블리싱 산출물의 **raw mockup HTML** 이다. 실제 마크업 샘플 분석 결과 다음 시그니처로 갱신.

| lite HTML 시그니처 (대소문자 무시) | 의미 | layers 처리 |
|---|---|---|
| `<table class="tbl">` 또는 `<div class="tbl-wrap">` | 그리드 (마스터 데이터 · 리스트) | `{type:'GRID', subtype:'GRID_BASE'}`, key 자동 (`grid1`/`grid2`/...) |
| `<canvas>` (Chart.js 산출) 또는 `class="chart"` / `class="chart-card"` | 차트 | `{type:'CHART', subtype:'CHART_LINE'}` |
| `<div class="kpi-card">` · `<div class="stat-card">` · `<div class="kpi-tile">` · `<div class="kpi-grid">` 자식 | KPI 카드 | `{type:'CHART', subtype:'KPI_CARD'}` (Mockup KPI 관례) |
| `<div class="form-row">` 다수 또는 `<div class="card">` 안의 `<input>`/`<select>` 다수 | 입력 폼 / 디테일 | `{type:'CONTAINER', subtype:'FORM'}` |
| `class="grid2"` 또는 `class="grid3"` · `style="grid-template-columns:..."` | 좌우 분할 컨테이너 | layer 자체가 되지 않음 — **부모 컨테이너 신호** (자식 layer 들 좌우 배치) |

위 5개 외 마크업 (`<div class="sec-hdr">`, `<button class="btn">`, `<span class="tip">` 등) 은 무시. (rules/41d "Layout step 은 placeholder 만 보여주고, 실제 의도는 자연어 컨텍스트로 Claude 가 참조" 와 일치)

**조회 영역(SearchArea) 인식**: lite HTML 에 wingui 식 SearchArea 마크업이 없음 — T3MES 패턴은 검색 폼 대신 헤더 버튼·필터 칩을 사용. 따라서 **`hasSearchArea` 는 항상 `false`** 로 두고, 사용자가 LayoutStep 에서 필요하면 직접 활성화. (spec 단순화 — 검색바 부재가 기본)

### 3.3 좌표 매핑 — 12-col × 12-row 보드

panel 루트 (`<div class="panel" id="pN">`) 안의 top-level layer 후보 N개를 찾은 뒤 부모 컨테이너 신호로 방향 추론:
- **row 배치** (panel 안에 `class="grid2"` · `class="grid3"` · `style="grid-template-columns:..."` 발견) → w 균등 분배 (`12/N` 반올림, 나머지는 마지막 layer 에 흡수)
- **column 배치** (기본 — 컨테이너 신호 없음) → h 균등 분배 (`12/N`)

| N | row 배치 (grid2/grid3) | column 배치 (기본) |
|---|---|---|
| 1 | `{x:0,y:0,w:12,h:12}` | 동일 |
| 2 | 각 `w:6, h:12` — (0,0)·(6,0) | 각 `h:6, w:12` — (0,0)·(0,6) |
| 3 | 각 `w:4, h:12` | 각 `h:4` |
| 4+ | 균등 분배, 6 초과는 §3.5 폴백 |

중첩 처리는 1레벨만. KPI 카드들은 `<div class="kpi-grid">` 또는 `<div class="kpi-row">` 안에 다수 있는 경우 1개의 KPI 영역 layer 로 묶음 (자식 KPI 자세히 안 봄).

**예시 — `mes_master_1/02_품목_상세_폼.html`** (실제 lite 샘플):
```html
<div class="panel" id="p1">
  <div class="sec-hdr">...</div>  <!-- 무시 -->
  <div class="grid2" style="grid-template-columns:320px 1fr">
    <div class="card"><table class="tbl">...</table></div>   <!-- 좌: GRID -->
    <div class="card">...<input>...<select>...</div>          <!-- 우: FORM -->
  </div>
</div>
```
→ `grid2` 신호 감지 → 2개 layer 좌우 분할:
```json
[
  {"key":"grid1","type":"GRID","subtype":"GRID_BASE","position":{"x":0,"y":0,"w":6,"h":12}},
  {"key":"form1","type":"CONTAINER","subtype":"FORM","position":{"x":6,"y":0,"w":6,"h":12}}
]
```

### 3.4 key · title 규약

- **key**: type 별 인덱스만 사용 — `grid1`/`grid2`/`chart1`/`kpi1`/`form1`. raw mockup HTML 의 `id="tb0"`/`id="p0"` 등은 의미 없는 ID 라 무시.
- **title**: 항상 generic — `그리드 1`, `차트 1`, `KPI 영역`, `입력 폼` — Mockup 규약과 동일

### 3.5 폴백 (3중)

| 상황 | 동작 |
|---|---|
| 파싱 결과 layer 0건 | entry 에 `layers` 미주입 → `specFromUiPattern` 이 기본 단일 mainGrid 폴백 (현재 동작 유지) |
| layer 7건 이상 (비정상 추출) | 스크립트가 첫 6건만 유지 + `console.warn` 으로 파일/탭 ID 출력 |
| lite 파일 자체 없음 (legacy entry) | 위 1번과 동일 폴백 |
| `entry.layers` 형식 오류 (key 누락 등) | `specFromUiPattern` 검증 실패 시 단일 mainGrid 폴백 + `console.warn` |

스크립트 결과 0건 비율은 빌드 로그 끝 통계 (`layers: 추출 N · 미추출 M`) 로 확인 가능 — 미추출 비율이 50% 넘으면 파서 룰 보강 검토.

## 4. 아키텍처 + 데이터 흐름

```
[1회·빌드 타임]
  scripts/split-t3mes-tabs.cjs
    └─ 730개 lite HTML 파싱 추가 → t3mes-tabs.json 의 각 탭 entry 에
       layers 필드 인라인 주입 (단일 진실 저장소, 별도 JSON 안 만듦)

[런타임]
  T3mesPatternCatalog.buildEntries()
    └─ ALL_ENTRIES 의 각 entry 에 layers (있으면) 자동 포함

  사용자가 UiPatternPickerDialog 에서 패턴 선택
    └─ ModeNewStep.handleConfirmUiPattern(entry)
        └─ specFromUiPattern(entry, baseMeta)
            ├─ entry.layers 있음 → Mockup 동일 로직으로 ComposerSpec 생성
            │  (dataSource NL mode · columns [] · cascade {} · filterBar 매핑)
            └─ entry.layers 없음 (파싱 0건) → 단일 mainGrid 폴백
```

### 4.1 t3mes-tabs.json 스키마 확장

**실제 JSON 형식** — 파일명을 key 로 하고 값은 tab 배열:
```json
{
  "mes_mrp_1_order_ui_patterns.html": [
    {
      "index": 0,
      "label": "그리드 일괄",
      "full": "t3mes-split/full/mes_mrp_1_order/01_그리드_일괄.html",
      "lite": "t3mes-split/lite/mes_mrp_1_order/01_그리드_일괄.html",
      "layers": [
        {"key":"grid1","type":"GRID","subtype":"GRID_BASE",
         "position":{"x":0,"y":0,"w":12,"h":12}}
      ]
    },
    {
      "index": 1,
      "label": "마스터디테일",
      "full": "...",
      "lite": "...",
      "layers": [
        {"key":"grid1","type":"GRID","subtype":"GRID_BASE",
         "position":{"x":0,"y":0,"w":6,"h":12}},
        {"key":"form1","type":"CONTAINER","subtype":"FORM",
         "position":{"x":6,"y":0,"w":6,"h":12}}
      ]
    }
  ]
}
```

기존 `{index, label, full, lite}` 에 `layers` 만 추가. 파싱 결과 0건이면 `layers` 필드 자체를 미주입 (필드 부재 = 단일 mainGrid 폴백 신호). 선택적 필드라 기존 코드는 영향 없음.

## 5. 변경 파일

| # | 파일 | 변경 |
|---|---|---|
| 1 | `scripts/split-t3mes-tabs.cjs` | 기존 lite HTML 생성 루프 안에 `extractLayers(liteHtml)` 호출 추가. 결과를 각 tab entry JSON 에 인라인 주입. 파서 함수 (~150줄) 같은 파일 안에 추가. **HTML 파싱은 정규식 기반** (기존 스크립트가 cheerio 미사용 — 의존성 추가 없음) |
| 2 | `frontend/src/view/util/t3composerpatterns/_data/t3mes-tabs.json` | 스크립트 출력 — 각 tab entry 에 `layers` 필드 추가 (파싱 0건이면 미주입). 수동 편집 금지 |
| 3 | `frontend/src/view/util/t3composerpatterns/T3mesPatternCatalog.jsx` `buildEntries()` (L119-154 부근) | `t3mes-tabs.json` 의 `layers` 를 `ALL_ENTRIES` entry 로 전파. catalog UI 자체는 손대지 않음 (필드는 선택적) |
| 4 | `frontend/src/view/util/t3composer/wizardState.js` `specFromUiPattern()` (L3135-L3143) | `entry.layers` 있으면 `specFromMockup` 동일 패턴으로 `spec.layers` 생성 (dataSource NL + columns [] + cascade {} + filterBar.affects 빈 배열 매핑). `pattern: UIPATTERN_<id>` 식별자는 보존. 미주입 시 기본 단일 mainGrid 폴백 |
| 5 | `frontend/src/view/util/t3composer/UiPatternPickerDialog.jsx` | MockupPickerDialog 처럼 entry 행 우측에 layer 수 칩 ("2L" 등) 노출 — 시각적 패리티만, 동작 변경 없음 |

### 5.1 손대지 않는 곳

- `LayoutStep.jsx` · `ComposerCanvas.jsx` — 이미 `spec.layers` 를 RGL 로 렌더
- `MockupPickerDialog` · `specFromMockup` — 무관
- `ComposerPromptBuilder` · `specToInitialPrompt` — `pattern: UIPATTERN_<id>` 식별자 보존으로 downstream 룩업 경로 변동 없음
- 백엔드 — 변경 없음 (frontend-only)

## 6. 테스트

### 6.1 자동 단위 테스트 (파서 함수 `extractLayers`)

`scripts/__tests__/extract-layers.test.cjs` — node 단위 (cjs 환경에서 직접 require 가능):

| 케이스 | 입력 lite HTML | 기대 결과 |
|---|---|---|
| C1 단일 그리드 | `<div class="panel" id="p0"><div class="tbl-wrap"><table class="tbl">...</table></div></div>` | `[{key:'grid1', type:'GRID', subtype:'GRID_BASE', position:{x:0,y:0,w:12,h:12}}]` |
| C2 마스터-디테일 (grid2) | `panel` 안 `<div class="grid2">` + `<table class="tbl">` + `<input class="inp">` 폼 | `[{key:'grid1',w:6}, {key:'form1',type:'CONTAINER',subtype:'FORM',w:6}]` |
| C3 그리드 + 차트 (column 기본) | `panel` 안 `<table class="tbl">` 1개 + `<canvas>` 1개 | `[{key:'grid1',h:6,y:0}, {key:'chart1',h:6,y:6}]` |
| C4 KPI 그리드 (kpi-grid) | `panel` 안 `<div class="kpi-grid">` + KPI 카드 다수 + `<table class="tbl">` | `[{key:'kpi1',type:'CHART',subtype:'KPI_CARD',h:6}, {key:'grid1',h:6}]` |
| C5 시그니처 0건 | 텍스트만 또는 빈 panel | `[]` → JSON 미주입 |
| C6 비정상 8개 | 8개 `<table class="tbl">` | 첫 6개만 + warn 발생 |
| C7 트리 시각화 | `panel` 안 `<div class="org-tree">` | `[{key:'tree1', type:'GRID', subtype:'GRID_TREE', w:12, h:12}]` |
| C8 카드 리스트 | `panel` 안 `<div class="card">` ≥3개 | `[{key:'cards1', type:'CONTAINER', subtype:'CARD_LIST', w:12, h:12}]` |
| C9 스테퍼 + 그리드 | `panel` 안 `<div class="stepper">` + `<table class="tbl">` | `[{key:'stepper1', type:'CHART', subtype:'GRID_BASE', h:6}, {key:'grid1', h:6}]` (subtype 은 COMPONENT_INDEX 와 정합) |

### 6.2 수동 회귀 — 빌드 후 5개 대표 패턴

LayoutStep 진입 시 RGL 캔버스에서 layers placeholder 위치 시각 확인:
1. 단일 그리드 (`00.html#0` 등)
2. 마스터-디테일 (좌우 분할)
3. 차트+그리드 대시보드
4. 탭 컨테이너
5. SearchArea 없는 단순 패턴

## 7. 롤아웃

단일 PR. commit 단위는 다음과 같이 분리 권장:
1. `extractLayers()` 파서 함수 + 단위 테스트 추가 (기존 동작에 영향 없음)
2. `split-t3mes-tabs.cjs` 에 호출 추가 + `t3mes-tabs.json` 재생성 (대량 변경 — 별도 commit)
3. `T3mesPatternCatalog.buildEntries` 가 layers 를 entry 에 전파
4. `specFromUiPattern` 확장
5. `UiPatternPickerDialog` 에 layer 수 칩
6. 수동 회귀 테스트 + 부족분 보정

### 7.1 호환성

- 기존 `entry.layers` 가 없는 경로 (구 JSON 사용자 · 빌드 미실행) → 단일 mainGrid 폴백 → **현재와 동일 동작**
- `pattern: UIPATTERN_<id>` 식별자 보존 → downstream prompt 가 lite HTML 룩업하는 경로 변동 없음
- Mockup picker · `specFromMockup` 무관

## 8. 위험 + 완화

| 위험 | 완화 |
|---|---|
| lite HTML 마크업 일관성 부족 — T3MES 퍼블리싱 산출물마다 className/태그 컨벤션이 다를 수 있음 | 파서가 대소문자 무시 + 5개 시그니처 모두 alias 허용 (`SearchArea`/`search-area` 등). 빌드 시 5개 대표 패턴 + 단위 테스트로 회귀 확인 |
| 좌표 추론이 잘못된 패턴 | 폴백 (3중) — 최악의 경우 단일 mainGrid 로 떨어져 사용자가 LayoutStep 에서 수동 조정. 현재 동작과 동일 |
| 730개 일괄 재생성 시 `t3mes-tabs.json` 거대 diff | 별도 commit 으로 분리 (롤아웃 §7 step 2) |
| 빌드 의존성 추가 (cheerio) | 구현 시 기존 split 스크립트가 이미 쓰는 HTML 파서가 있으면 그것 재사용. 없으면 정규식 기반 파서로 fallback (5개 시그니처 정도면 정규식으로 충분) |

## 9. 후속 작업 (이 spec 의 비목표)

- Mockup 처럼 dashboard 카테고리에 `layers` 강제 발화는 도입 안 함 (T3MES 는 카테고리 분류 없음)
- T3MES 패턴에 자연어 의도 텍스트(`uiPatternContextText`) 동봉 — 현재 lite HTML 자체가 prompt 에 첨부되므로 별도 텍스트 불필요
- 런타임 lite HTML 파싱 폴백 (옵션 3) — 빌드 워크플로가 일괄 재실행을 강제하고 있어 실제로 발화하는 케이스 거의 없음, 도입 안 함

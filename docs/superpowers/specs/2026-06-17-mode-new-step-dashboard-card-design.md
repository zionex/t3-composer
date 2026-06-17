# 단계별 화면 생성 — Dashboard 카드 추가

- 작성일: 2026-06-17
- 대상 화면: `ModeNewStep` (Composer 단계별 화면 생성 — 패턴 선택)
- 관련 파일:
  - `frontend/src/view/util/t3composer/ModeNewStep.jsx`
  - `frontend/src/view/util/t3dashboard/T3Dashboard.jsx`
  - `frontend/src/view/util/t3dashboard/component/dashboardstudio/UserDashboardPage.jsx`
  - `frontend/src/view/util/t3composer/wizardState.js`

## 1. 배경 / 목적

좌측 사이드바 [Dashboard] 메뉴에서 사용자는 본인 대시보드(KPI/Chart/Grid 위젯 그리드)를 만들고 조회한다. 이 대시보드 자산을 신규 화면 생성의 시작 골격으로 재활용한다.

기존 패턴 선택 화면의 4개 카드(AI 추천 / SCM UI Mockup / T3MES UI Pattern / 빈 캔버스)에 5번째 카드 **[Dashboard]** 를 `T3MES UI Pattern` 아래·`빈 캔버스` 위에 추가한다.

## 2. 동작 요약

1. 사용자가 [Dashboard] 카드 클릭.
2. PICK stage 영역이 `T3Dashboard`(좌측 사이드바 Dashboard 메뉴와 동일 컴포넌트)로 전환된다.
3. 사용자는 T3Dashboard 안에서 평소처럼 대시보드를 조회·확인한다.
4. 대시보드 1개가 로드된 상태에서 헤더 우측의 **[이 대시보드로 화면 생성]** 버튼이 활성화된다.
5. 버튼 클릭 → 대시보드의 `layout_json.widgets` 를 `ComposerSpec.layers` 로 변환(`specFromDashboard`) → 4단계 `ComposerWizard` 진입.

## 3. UI 변경

### 3.1 카드 추가 (`ModeNewStep.jsx` PICK stage)

| 위치 | T3MES UI Pattern 카드와 빈 캔버스 카드 사이 (4번째) |
|---|---|
| 아이콘 | `DashboardIcon` (`@mui/icons-material/Dashboard`) — 좌측 사이드바 Dashboard 메뉴와 동일 |
| 색상 | `#0ea5e9` (sky-blue) · hover bg `#f0f9ff` · hover border `#0ea5e9` |
| 제목 | **Dashboard** |
| 부제 | 기존 대시보드 1개를 골라 위젯 레이아웃을 자동 prefill |

### 3.2 stage 전이

`ModeNewStep` 의 stage state 에 `'DASHBOARD'` 추가:

```
PICK → (Dashboard 카드 클릭) → DASHBOARD → (대시보드 선택 + 버튼) → WIZARD
```

`DASHBOARD` stage 일 때 PICK 영역 자리에 `<T3Dashboard onUseAsScreen={handleDashboardPicked} />` 임베드 + 상단 [뒤로] 버튼. 다른 진입 흐름은 변경 없음.

## 4. 컴포넌트 변경 — `UserDashboardPage` / `T3Dashboard`

### 4.1 옵셔널 콜백 prop 추가

`UserDashboardPage` 의 시그니처를 옵셔널 props 로 확장:

```jsx
export default function UserDashboardPage({ onUseAsScreen } = {}) { ... }
```

- `onUseAsScreen` 가 함수로 **주어진 경우에만** 헤더 우측 영역에 `[이 대시보드로 화면 생성]` 버튼 노출.
- 활성 조건: `hasSelectedDashboard === true`.
- disable 조건: 대시보드 미선택 / `dashboardLoading` / `dashboardError` 존재.

`T3Dashboard` 는 prop 패스스루 (1줄 변경).

### 4.2 회귀 0 보장

좌측 사이드바 진입(`<T3Dashboard />` 무 prop) 은 `onUseAsScreen === undefined` → 버튼 미노출 → 기존 동작 100% 동일.

## 5. 데이터 변환 — `specFromDashboard`

`wizardState.js` 에 `specFromMockup` 패턴을 따라 신규 함수 추가.

```js
export function specFromDashboard(dashboard, baseMeta = {}) {
  if (!dashboard) return createComposerSpec({ ...baseMeta, pattern: 'BLANK' });

  const widgets = normalizeDashboardWidgets(dashboard.layout_json);
  if (widgets.length === 0) {
    return createComposerSpec({
      ...baseMeta,
      pattern: 'BLANK',
      title: baseMeta.title || dashboard.name || dashboard.title || '새 화면',
    });
  }

  const base = createComposerSpec({
    ...baseMeta,
    pattern: 'DASHBOARD',
    title: baseMeta.title || dashboard.name || dashboard.title || '새 화면',
  });

  base.layers = widgets.map((w, idx) => ({
    key:      getWidgetId(w) || w.key || `w${idx + 1}`,
    title:    w.title || w.spec_json?.title || getWidgetId(w) || `위젯 ${idx + 1}`,
    type:     inferDashboardLayerType(w.widget_type),
    subtype:  w.widget_type || 'unknown',
    position: pickDashboardPosition(w['data-grid'] || w.data_grid, idx),
    dataSource: {
      mode: 'NL',
      naturalText: dashboardContextText(dashboard, w),
      references: [],
      sqlBlocks: [],
    },
    columns: [],
    cascade: {},
  }));
  base.filterBar.affects = Object.fromEntries(base.layers.map((l) => [l.key, []]));
  return base;
}
```

### 5.1 `inferDashboardLayerType(widget_type)`

`LAYER_TYPES` enum 은 `GRID·CHART·CONTAINER·DOCUMENT·AI` 만 정의 — KPI 없음. 따라서 KPI 위젯도 `CHART` 로 매핑하되 `subtype` 에 widget_type 그대로 보존 (`AiRecommendPanel`/`SynthesizedMockupPreview` 가 subtype 으로 KPI 식별 — 기존 mockup 들과 동일 컨벤션).

| widget_type 키워드 | layer.type |
|---|---|
| `grid` · `table` · `list` | `GRID` |
| 그 외 (chart 류 · kpi/score/gauge/metric · 누락) | `CHART` |

### 5.2 `pickDashboardPosition('data-grid', idx)`

`DASHBOARD_GRID_COLS = 12`, Composer RGL 도 12-col → identity. 다른 cols 일 때를 위한 안전 정규화는 함수 형태로 유지.

- 4개 필드 (x, y, w, h) 모두 finite → 그대로 반환.
- 누락 → 디폴트 `{x: 0, y: idx * 4, w: 6, h: 4}`.

### 5.3 `dashboardContextText(dashboard, widget)`

minimal — 위젯 타입/제목만:

```
위젯 타입: ${kind} · 제목: ${title}
이 영역의 데이터를 보완하거나 Data Source 탐색에서 Table/SP 직접 참조 추가.
```

★ 의도적으로 **원본 대시보드 메타 (`[참조 대시보드] xxx`) 는 박지 않음** — 사용자가 ① Layout step 에서 위젯을 재배치한 후에도 `naturalText` 가 변하지 않아 Claude 가 원본 layout 을 따라하려 하는 부작용 회피. 위치는 specToInitialPrompt 의 좌표표가 단일 진실.

## 6. 데이터 흐름

```
ModeNewStep PICK
  └─ [Dashboard] 카드 클릭
      └─ stage = 'DASHBOARD'
          └─ <T3Dashboard onUseAsScreen={handleDashboardPicked} /> 임베드
              └─ 사용자가 대시보드 1개 선택 → [이 대시보드로 화면 생성] 활성
                  └─ onUseAsScreen(selectedDashboard) 발화
                      └─ spec = specFromDashboard(selectedDashboard, { title, menuCd: '' })
                          └─ setSpec(spec); setStage('WIZARD')
                              └─ <ComposerWizard initialSpec={spec} ... />
```

## 7. 산출물 화면의 layer position 정확도 — DASHBOARD 패턴 전용 prompt 가이드

대시보드는 비대칭 위젯 격자 + 사용자가 ① Layout step 에서 재배치 가능하므로, 산출물 화면이 그 좌표를 정확히 따르려면 prompt 측 가이드가 추가로 필요. `specToInitialPrompt(spec)` 에 `meta.pattern === 'DASHBOARD'` 분기를 두고 다음을 prepend:

### 7.1 ★★★ 절대 규칙 헤더
- 좌표표는 사용자가 ① Layout step 에서 명시한 최종 의도.
- 원본 대시보드의 위치/구성은 무시.
- naturalText 의 "원본 대시보드" 표현이 있더라도 좌표표가 단일 진실.

### 7.2 CSS Grid template 가이드
- 외곽 `<Box sx={{ height:'100%', overflow:'hidden', display:'grid', gridTemplateColumns:'repeat(12, 1fr)', gridTemplateRows:'<행별 fr>', gap:2 }}>` → 스크롤 없이 viewport fit + 행 높이 비율 반영.
- 각 layer → `<Paper variant="outlined" sx={{ gridColumn:'${x+1} / span ${w}', gridRow:'${rowIdx+1} / span 1', p:2, overflow:'hidden', minWidth:0, minHeight:0, border:'1px solid rgba(124,167,224,0.30)' }}>` → 위젯 경계 명확화, 셀 텍스트가 옆 위젯으로 흘러넘침 방지.
- 본문 subtype 매핑 (chart → react-chartjs-2 / grid → BaseGrid / kpi → Typography h3 큰 수치).

### 7.3 y tolerance 클러스터링
RGL 의 `compactType="vertical"` 때문에 사용자가 ① Layout step 에서 본 시각 행 ↔ `spec.layers[].position.y` raw 값이 어긋날 수 있다. 가까운 y 들 (≤2 RGL unit) 을 같은 행으로 묶어 사용자의 시각 행 구조를 prompt 에 그대로 반영.

### 7.4 본 화면 layer 좌표표
spec.layers 각 layer 의 (key, title, subtype, x, y, w, h) 와 변환된 (gridColumn, gridRow) 를 마크다운 표로 prompt 에 직접 박는다 — Claude 가 추측 여지 없이 그대로 사용.

## 8. 엣지케이스

| # | 케이스 | 처리 |
|---|---|---|
| E1 | `layout_json` 비었거나 위젯 0개 | `BLANK` 패턴 폴백 (단일 layer) |
| E2 | 위젯 `'data-grid'` 메타 없음 | position 디폴트 `{x:0, y:idx*4, w:6, h:4}` |
| E3 | `widget_type` 누락 | `subtype='unknown'`, `type='CHART'` |
| E4 | `dashboard.name`/`title` 누락 | `baseMeta.title` → `'새 화면'` |
| E5 | T3Dashboard 안 대시보드 미선택 | 버튼 disabled |
| E6 | 대시보드 로드 실패 | 버튼 disabled |
| E7 | Composer 안 임베드 시 flex collapse | `T3Dashboard` 컨테이너 `flex:1, minHeight:0` 유지 |
| E8 | 좌측 사이드바 Dashboard 진입 (회귀 0) | `onUseAsScreen` prop 미주입 → 버튼 미노출 → 기존 동작 100% 동일 |

## 9. 테스트 (수동 검증 7시나리오)

frontend 에 jest/vitest 미설정 — 단위 테스트는 도입하지 않고 클릭 검증으로 진행.

1. 좌측 사이드바 Dashboard 진입 → [이 대시보드로 화면 생성] 버튼 안 보임 (회귀 0).
2. Composer → 단계별 화면 생성 (Beta) → Dashboard 카드 4번째 위치에 노출.
3. Dashboard 카드 클릭 → T3Dashboard 임베드 + 상단 [뒤로] + 제목.
4. 대시보드 미선택 → 헤더 버튼 disabled. 1개 선택 → 버튼 활성.
5. 버튼 클릭 → 4단계 Wizard 진입 + Step ① Layout 에 위젯 prefill.
6. 빈 대시보드 → BLANK 단일 layer Wizard 진입.
7. [뒤로] → PICK stage 복귀.

## 10. 비범위 (Out of scope)

- 대시보드 위젯의 데이터 바인딩(어떤 SP/엔티티) 까지 spec prefill. 본 디자인은 레이아웃 + 자연어 컨텍스트만 prefill, 데이터 바인딩은 4단계 Wizard 의 ② DataAndFilterStep 에서.
- 대시보드 → 화면 생성 후 양방향 동기화 (일회성 prefill).
- 신규 패턴 코드 `DASHBOARD` 의 `PatternPreview` 렌더러 추가.

## 11. 변경 파일 목록

| 파일 | 변경 |
|---|---|
| `frontend/src/view/util/t3composer/ModeNewStep.jsx` | `DASHBOARD` stage 추가 · 카드 4번째 추가 (`DashboardIcon`) · T3Dashboard 임베드 · `specFromDashboard` 호출 |
| `frontend/src/view/util/t3dashboard/T3Dashboard.jsx` | `onUseAsScreen` prop 패스스루 |
| `frontend/src/view/util/t3dashboard/component/dashboardstudio/UserDashboardPage.jsx` | `onUseAsScreen` prop 수신 + 헤더 버튼 conditional 렌더 |
| `frontend/src/view/util/t3composer/wizardState.js` | `specFromDashboard` + `inferDashboardLayerType` + `pickDashboardPosition` + `dashboardContextText` + `specToInitialPrompt` 의 DASHBOARD 분기 |

신규 파일 없음.

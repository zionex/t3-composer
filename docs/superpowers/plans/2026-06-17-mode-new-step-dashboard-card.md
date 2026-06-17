# ModeNewStep — Dashboard 카드 추가 Implementation Plan

**Goal:** Composer 의 [단계별 화면 생성 (Beta) — 패턴 선택] 화면에 5번째 [Dashboard] 카드를 추가해, 사용자가 본인 대시보드 1개를 골라 위젯 레이아웃을 ComposerSpec 으로 prefill 한 후 4단계 Wizard 로 진입하게 한다.

**Architecture:** `ModeNewStep` 의 PICK stage 에 카드 1개를 추가하고 `DASHBOARD` stage 분기를 신설. 그 stage 에서 좌측 사이드바 [Dashboard] 메뉴와 동일한 `T3Dashboard` 컴포넌트를 임베드하되, 옵셔널 `onUseAsScreen` 콜백 prop 을 주입해 헤더에 [이 대시보드로 화면 생성] 버튼이 나타나게 한다. 버튼 클릭 시 `specFromDashboard()` 가 대시보드의 `layout_json.widgets` 를 `ComposerSpec.layers` 로 변환하고, `specToInitialPrompt` 의 DASHBOARD 분기가 산출물 화면에 layer 좌표를 정확히 반영하도록 prompt 가이드를 prepend.

**Tech Stack:** React 18 · MUI 5 · Zustand · Composer ComposerSpec 스키마 (wizardState.js) · T3Dashboard (UserDashboardPage)

## Global Constraints

- 변경 파일 4개, 신규 파일 0 — 모두 기존 파일 편집.
- **회귀 0** — 좌측 사이드바 Dashboard 메뉴 진입 (`<T3Dashboard />` 무 prop) 은 기존과 100% 동일 동작.
- 단위 테스트 프레임워크 없음 (frontend 에 jest/vitest 미설정) — 검증은 수동 클릭.
- `LAYER_TYPES` enum (`wizardState.js`) 은 `GRID·CHART·CONTAINER·DOCUMENT·AI` 만 정의. KPI 위젯도 `CHART` 로 매핑 (subtype 에 widget_type 보존).
- spec: `docs/superpowers/specs/2026-06-17-mode-new-step-dashboard-card-design.md`.

---

### Task 1: `specFromDashboard` + 헬퍼 + DASHBOARD prompt 가이드 (wizardState.js)

**Files:**
- Modify: `frontend/src/view/util/t3composer/wizardState.js`

**Produces:**
- `specFromDashboard(dashboard, baseMeta) → ComposerSpec` (export)
- 내부 헬퍼: `inferDashboardLayerType` · `pickDashboardPosition` · `dashboardContextText`
- `specToInitialPrompt` 의 `meta.pattern === 'DASHBOARD'` 분기 — ★★★ 절대 규칙 + CSS Grid template 가이드 + y tolerance 클러스터링 + 좌표표

- [x] **Step 1: import 추가**

```js
import { normalizeDashboardWidgets, getWidgetId } from '../t3dashboard/component/dashboardstudio/viewer/widgetNormalize';
import { DASHBOARD_GRID_COLS } from '../t3dashboard/component/dashboardstudio/core/dashboardGridRules';
```

- [x] **Step 2: `specFromMockup` 바로 뒤에 헬퍼 3개 + `specFromDashboard` 추가**

핵심 매핑:
- `inferDashboardLayerType(widgetType)`: grid/table/list → `LAYER_TYPES.GRID`, 그 외 → `LAYER_TYPES.CHART` (KPI 포함, subtype 보존).
- `pickDashboardPosition(dataGrid, idx)`: 4개 필드 finite → identity (DASHBOARD_GRID_COLS=12 라 Composer 와 동일), 누락 → 디폴트 stack.
- `dashboardContextText(dashboard, widget)`: 위젯 타입/제목만 — 원본 대시보드 메타 의도적 제외.

```js
function dashboardContextText(dashboard, widget) {
  const title = widget?.title || widget?.spec_json?.title || getWidgetId(widget) || '';
  const kind  = widget?.widget_type || 'unknown';
  return [
    `위젯 타입: ${kind} · 제목: ${title}`,
    '이 영역의 데이터를 보완하거나 Data Source 탐색에서 Table/SP 직접 참조 추가.',
  ].join('\n');
}

export function specFromDashboard(dashboard, baseMeta = {}) {
  if (!dashboard) return createComposerSpec({ ...baseMeta, pattern: 'BLANK' });
  const widgets = normalizeDashboardWidgets(dashboard.layout_json);
  if (widgets.length === 0) {
    return createComposerSpec({
      ...baseMeta, pattern: 'BLANK',
      title: baseMeta.title || dashboard.name || dashboard.title || '새 화면',
    });
  }
  const base = createComposerSpec({
    ...baseMeta, pattern: 'DASHBOARD',
    title: baseMeta.title || dashboard.name || dashboard.title || '새 화면',
  });
  base.layers = widgets.map((w, idx) => {
    const grid = w['data-grid'] || w.data_grid || {};
    const wid  = getWidgetId(w) || w.key || `w${idx + 1}`;
    return {
      key: wid,
      title: w.title || w.spec_json?.title || wid || `위젯 ${idx + 1}`,
      type: inferDashboardLayerType(w.widget_type),
      subtype: w.widget_type || 'unknown',
      position: pickDashboardPosition(grid, idx),
      dataSource: { mode: 'NL', naturalText: dashboardContextText(dashboard, w), references: [], sqlBlocks: [] },
      columns: [], cascade: {},
    };
  });
  base.filterBar.affects = Object.fromEntries(base.layers.map((l) => [l.key, []]));
  return base;
}
```

- [x] **Step 3: `specToInitialPrompt` 의 NEW_STEP 헤더 직전에 DASHBOARD 분기 추가**

`meta.pattern === 'DASHBOARD'` 일 때 prepend:

1. **y tolerance 클러스터링** — RGL `compactType="vertical"` 때문에 사용자의 시각 행 ↔ raw y 가 어긋날 수 있어, 가까운 y (≤2) 들을 같은 행으로 묶음.
2. **★★★ 절대 규칙 헤더** — "좌표표는 사용자가 ① Layout step 에서 명시한 최종 의도. 원본 대시보드의 위치/구성은 무시."
3. **CSS Grid template 가이드** — 외곽 Box `display:grid` + `gridTemplateColumns:"repeat(12, 1fr)"` + `gridTemplateRows: rowHeightsFr` + `gap:2` + `overflow:hidden` (스크롤 없이 viewport fit).
4. **Paper 카드 가이드** — `gridColumn:'${x+1} / span ${w}'` + `gridRow:'${rowIdx+1} / span 1'` + `minWidth:0, minHeight:0, overflow:hidden` + outlined 파스텔 보더.
5. **subtype 매핑** — chart/line/bar 류 → react-chartjs-2, grid/table → BaseGrid, kpi/score/gauge/metric → Typography h3 큰 수치.
6. **좌표표** — spec.layers 의 각 layer 를 (key, title, subtype, x, y, w, h, gridColumn, gridRow) 마크다운 표로 직접 prompt 에 박음.

---

### Task 2: `UserDashboardPage` — `onUseAsScreen` prop + 헤더 버튼

**Files:**
- Modify: `frontend/src/view/util/t3dashboard/component/dashboardstudio/UserDashboardPage.jsx`

- [x] **Step 1: import 추가**

```jsx
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
```

- [x] **Step 2: 시그니처 변경**

```jsx
export default function UserDashboardPage({ onUseAsScreen } = {}) { ... }
```

- [x] **Step 3: 헤더 spacer 뒤, 모드 토글 앞에 conditional 버튼 추가**

```jsx
{typeof onUseAsScreen === 'function' && (
  <Button
    size="small" variant="contained"
    startIcon={<OpenInNewIcon fontSize="small" />}
    disabled={!hasSelectedDashboard || dashboardLoading || Boolean(dashboardError)}
    onClick={() => onUseAsScreen(selectedDashboard)}
    sx={{ fontWeight: 700, bgcolor: '#0ea5e9', '&:hover': { bgcolor: '#0284c7' } }}
  >
    {transLangKey('이 대시보드로 화면 생성')}
  </Button>
)}
```

`transLangKey` 는 이미 import 됨. 회귀 0: prop 없으면 버튼 미렌더.

---

### Task 3: `T3Dashboard` — prop 패스스루

**Files:**
- Modify: `frontend/src/view/util/t3dashboard/T3Dashboard.jsx`

- [x] **Step 1: 시그니처 + 패스스루**

```jsx
export default function T3Dashboard({ onUseAsScreen } = {}) {
  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      <Suspense fallback={...}>
        <UserDashboardPage onUseAsScreen={onUseAsScreen} />
      </Suspense>
    </Box>
  );
}
```

JSDoc 유지.

---

### Task 4: `ModeNewStep` — [Dashboard] 카드 + `DASHBOARD` stage

**Files:**
- Modify: `frontend/src/view/util/t3composer/ModeNewStep.jsx`

- [x] **Step 1: import 추가**

```jsx
import DashboardIcon from '@mui/icons-material/Dashboard';  // 좌측 사이드바와 동일 아이콘
import T3Dashboard from '../../util/t3dashboard/T3Dashboard';
```

기존 `specFromPattern, specFromMockup, specFromUiPattern` import 에 `specFromDashboard` 추가.

- [x] **Step 2: `DASHBOARD` stage 분기 추가 (AI_RECOMMEND 분기 직후)**

```jsx
if (stage === 'DASHBOARD') {
  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => setStage('PICK')}>뒤로</Button>
        <Typography variant="h6" sx={{ color: '#1e40af', fontWeight: 800 }}>
          Dashboard 에서 시작 — 대시보드 선택
        </Typography>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <T3Dashboard
          onUseAsScreen={(dashboard) => {
            if (!dashboard) return;
            setSpec(specFromDashboard(dashboard, { title: dashboard.name || dashboard.title || '새 화면', menuCd: '' }));
            setStage('WIZARD');
          }}
        />
      </Box>
    </Box>
  );
}
```

- [x] **Step 3: [Dashboard] 카드를 빈 캔버스 카드 앞에 삽입 (4번째 위치)**

```jsx
<Paper variant="outlined"
       sx={{ p: 2, cursor: 'pointer', '&:hover': { borderColor: '#0ea5e9', bgcolor: '#f0f9ff' } }}
       onClick={() => setStage('DASHBOARD')}>
  <Stack direction="row" spacing={1.5} alignItems="center">
    <DashboardIcon sx={{ fontSize: 32, color: '#0ea5e9' }} />
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#075985' }}>
        Dashboard
      </Typography>
      <Typography variant="caption" sx={{ color: '#64748b' }}>
        기존 대시보드 1개를 골라 위젯 레이아웃을 자동 prefill
      </Typography>
    </Box>
  </Stack>
</Paper>
```

---

### Task 5: 수동 검증

frontend 단위 테스트 미설정 — 실 클릭 검증으로 진행.

- [x] **시나리오 ① — 회귀 0**: 좌측 사이드바 [Dashboard] → 헤더 우측에 [이 대시보드로 화면 생성] 버튼 **없음**.
- [x] **시나리오 ② — 카드 노출**: Composer → 단계별 화면 생성 (Beta) → 5개 카드 (AI 추천 / SCM UI Mockup / T3MES UI Pattern / **Dashboard** / 빈 캔버스).
- [x] **시나리오 ③ — DASHBOARD stage**: [Dashboard] 카드 클릭 → 상단 [뒤로] + 제목 + T3Dashboard 임베드.
- [x] **시나리오 ④ — 버튼 활성**: 미선택 시 disabled, 1개 선택 시 활성.
- [x] **시나리오 ⑤ — Wizard 진입**: 버튼 클릭 → 4단계 Wizard 진입 + Step ① Layout 에 위젯 prefill.
- [x] **시나리오 ⑥ — 빈 대시보드**: 위젯 0개 → BLANK 단일 layer Wizard.
- [x] **시나리오 ⑦ — 뒤로**: DASHBOARD stage → PICK stage 복귀 + 다른 카드 정상.

---

## 진행 결과

모든 task 완료 — 수동 검증 7시나리오 통과. 산출물 화면이 ① Layout step 의 layer 좌표를 CSS Grid template 으로 따르고, 위젯 카드 경계가 명확히 구분되며, y tolerance 클러스터링이 RGL vertical compact 와 사용자 시각의 어긋남을 해소.

commit 은 사용자 명시 요청 시 일괄 진행.

# Dashboard Studio Migration Design

**Date:** 2026-06-02  
**Author:** Inhye Kim  
**Status:** Approved — ready for implementation planning

---

## 1. 목표

`t3series-wingui/packages/insight-front/src/component/dashboardstudio`에 있는 대시보드 빌더(UserDashboardPage 및 관련 전체 소스)를 `t3-composer/frontend/src/view/util/t3dashboard`로 마이그레이션하여 t3-composer의 새로운 메뉴로 추가한다.

**성공 기준:**
- t3-composer 사이드바에 "Dashboard" 메뉴가 추가되고, 기존 Composer/History 등과 동일한 방식으로 동작한다
- dashboardstudio의 기존 기능(대시보드 조회·편집·위젯 빌더)이 t3-composer 내에서 정상 동작한다
- insight 백엔드 서버와 API 통신이 정상적으로 이루어진다
- t3-composer의 기존 파일 구조·컨벤션과 자연스럽게 어우러진다

---

## 2. 접근 방법: Mirror 구조 (Option B)

### 왜 이 방법인가

dashboardstudio는 자기 폴더 밖의 여러 파일을 상대경로(`../../restapi/`, `../../auth/` 등)로 참조한다. t3dashboard 폴더 안에 **동일한 디렉토리 구조를 미러링**하면 dashboardstudio 내부 파일을 **한 줄도 수정하지 않아도** 모든 상대경로가 그대로 작동한다.

### 왜 insight-front/src 전체 복사는 아닌가

- insight-front/src는 445개 파일이며 dashboardstudio와 무관한 모듈이 다수 포함됨 (networkdiagram 137개, graphrag, chatbotEval 등)
- insight-front는 App.jsx가 없는 모노레포 서브패키지라 가져가도 API 초기화·라우팅 연결 작업은 어차피 동일하게 필요함
- 미러 구조로 필요한 것만 가져오면 약 15개 파일로 동일한 결과를 얻을 수 있음

---

## 3. 최종 파일 구조

```
t3-composer/frontend/src/
│
├── App.jsx                              ← 메뉴 항목 1개 추가 (수정)
│
├── view/util/
│   └── t3dashboard/                     ← 신규 폴더 (t3 접두사 컨벤션 준수)
│       │
│       ├── T3Dashboard.jsx              ← 진입점 (신규 작성)
│       │                                  UserDashboardPage를 t3-composer 스타일로 재작성
│       │
│       ├── component/
│       │   ├── dashboardstudio/         ← insight-front에서 원본 그대로 복사 (수정 없음)
│       │   │   ├── core/
│       │   │   ├── generic/
│       │   │   ├── dashboardbuilder/
│       │   │   ├── dashboardviewer/
│       │   │   ├── widgetbuilder/
│       │   │   ├── layout/
│       │   │   ├── popup/
│       │   │   ├── types/
│       │   │   └── userwidgetcreator/
│       │   ├── chart/
│       │   │   └── ChartComponent.jsx   ← insight-front/src/component/chart에서 복사
│       │   └── data/
│       │       └── DataGrid.jsx         ← insight-front/src/component/data에서 복사
│       │
│       ├── restapi/                     ← 신규 작성 (원본 대비 대폭 단순화)
│       │   ├── widgetBuilder.js         ← 원본 함수 시그니처 유지, insightAxios로 재구현
│       │   ├── apiconfig.js             ← 원본 460줄 → ~50줄로 단순화
│       │   ├── serviceCall.js           ← insight 전용 axios 인스턴스
│       │   └── baseURI.js              ← INSIGHT_API_BASE 읽는 단순 버전
│       │
│       ├── auth/
│       │   └── userStore.js             ← shim의 useUserStore를 re-export (5줄)
│       │
│       ├── store/
│       │   ├── insightStore.js          ← 필요한 상태만 유지한 경량 버전
│       │   └── captureStore.js          ← stub (t3-composer에서 캡처 기능 미사용)
│       │
│       └── lang/
│           └── i18n-func.js             ← shim의 transLangKey를 re-export (3줄)
│
└── shim/
    └── zionex/
        └── wingui-core.js               ← DashboardPanel lightweight shim 추가 (수정)
```

### 상대경로가 그대로 작동하는 원리

원본 dashboardstudio에서:
```
component/dashboardstudio/generic/renderers/ChartRenderer.jsx
  → import ChartComponent from '../../../chart/ChartComponent'  (상대경로)
```

t3dashboard 구조에서:
```
component/dashboardstudio/generic/renderers/ChartRenderer.jsx
  → ../../../chart/ChartComponent
  → t3dashboard/component/chart/ChartComponent.jsx  ✅ 그대로 작동
```

---

## 4. 신규 작성 파일 상세

### 4.1 `restapi/baseURI.js`

```js
// 원본: window.location.pathname + <remote> 태그에서 읽음
// 신규: 환경변수로 주입된 값만 읽음 (단순화)
export function baseURI() {
  return window.__INSIGHT_API_BASE__ || 'http://localhost:8080';
}
```

### 4.2 `restapi/serviceCall.js`

```js
import axios from 'axios';
import { baseURI } from './baseURI';

export const zAxios = axios.create({
  baseURL: baseURI(),
  timeout: 3_600_000,
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터: sessionStorage의 access_token 자동 주입
zAxios.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});
```

### 4.3 `restapi/apiconfig.js`

원본 460줄의 복잡한 클래스를 ~50줄로 단순화한다. dashboardstudio가 실제로 사용하는 기능만 유지:
- `makeRequest(method, path, data, options)` — 범용 HTTP 요청
- `getInsightFullPath(path)` — `/insight` 경로 조합
- `apiConfig` singleton export

`captureStore`, `insightStore`, WebSocket, SSE, i18n 초기화 등 미사용 기능 제거.

### 4.4 `restapi/widgetBuilder.js`

원본의 **함수 시그니처를 100% 동일하게 유지**하고, 내부 구현만 새 serviceCall로 교체.  
dashboardstudio 전체에서 호출하는 함수 목록:

| 함수 | 엔드포인트 |
|------|-----------|
| `getDashboard(id)` | `GET /insight/dashboard-builder/{id}` |
| `listDashboards(...)` | `GET /insight/dashboard-builder/list` |
| `saveDashboard(data)` | `POST /insight/dashboard-builder/save` |
| `deleteDashboard(id)` | `DELETE /insight/dashboard-builder/{id}` |
| `updateDashboardAccess(id, data)` | `PUT /insight/dashboard-builder/{id}/access` |
| `getWidgetLibrary(...)` | `GET /insight/widget-builder/library` |
| `saveWidgetToLibrary(data)` | `POST /insight/widget-builder/library` |
| `updateWidgetInLibrary(id, data)` | `PUT /insight/widget-builder/library/{id}` |
| `suggestWidget(data)` | `POST /insight/widget-builder/suggest` |
| `getSourceCatalog()` | `GET /insight/widget-builder/source-catalog` |
| `getSourceMetadata(...)` | `GET /insight/widget-builder/source-metadata` |
| `exportBusinesstree(...)` | `GET /insight/widget-builder/business-tree/export` |
| `getBusinessTree(...)` | `GET /insight/widget-builder/business-tree` |
| `getBusinessTreeModules(...)` | `GET /insight/widget-builder/business-tree/modules` |
| `getBusinessTreeCandidates(...)` | `GET /insight/widget-builder/business-tree/candidates` |
| `getBizTables(...)` | `GET /insight/widget-builder/biz-tables` |
| `getBizCategories(...)` | `GET /insight/widget-builder/biz-categories` |

### 4.5 `auth/userStore.js`

```js
// shim의 useUserStore를 그대로 위임
export { useUserStore, getUserStore, userStoreApi } from '@wingui/common/imports';
```

### 4.6 `store/insightStore.js`

원본 379줄 → 경량화. dashboardstudio가 실제 사용하는 상태만 유지:
- `apiPrefix` (API 경로 접두사)
- `menuList`, `widgetList` (메뉴·위젯 캐시)
- `useInsightSystemStore()`, `getInsightSystemStore()`, `insightSystemStoreApi` export

WebSocket 설정, ViewDataComposer, AI 함수 맵 등 미사용 상태 제거.

### 4.7 `store/captureStore.js`

```js
// DashboardPage의 캡처 기능은 t3-composer에서 미사용 → stub
import { create } from 'zustand';
export const useCaptureStore = create(() => ({ contentRef: null, capturedImage: null }));
export const captureStoreApi = { getState: useCaptureStore.getState, setState: useCaptureStore.setState };
```

### 4.8 `lang/i18n-func.js`

```js
export { transLangKey, t } from '@zionex/i18n-func';
// shim의 transLangKey를 위임
```

### 4.9 `T3Dashboard.jsx` (진입점)

UserDashboardPage.jsx를 t3-composer 레이아웃 패턴에 맞게 재작성:
- t3-composer의 MUI 테마·레이아웃 스타일 사용
- `MENU_CD: 'USR_DASHBOARD'` 유지 (insight 백엔드 식별자)
- 대시보드 목록 조회·선택·뷰어 렌더링 흐름 유지
- `DashboardPanel` shim 사용

---

## 5. 기존 파일 수정

### 5.1 `App.jsx` — 메뉴 추가

```js
import DashboardIcon from '@mui/icons-material/Dashboard';
import T3Dashboard from './view/util/t3dashboard/T3Dashboard';

const MENU_ITEMS = [
  { key: 'composer',   label: 'Composer',      Icon: AutoAwesomeIcon,        Component: T3Composer },
  { key: 'history',    label: 'History',        Icon: HistoryIcon,            Component: T3ComposerHistory },
  { key: 'dashboard',  label: 'Dashboard',      Icon: DashboardIcon,          Component: T3Dashboard },  // ← 추가
  { key: 'mockup',     label: 'SCM UI Mockup',  Icon: DashboardCustomizeIcon, Component: T3Mockup },
  { key: 'patterns',   label: 'UI Pattern',     Icon: ViewQuiltIcon,          Component: T3mesPatternCatalog },
  { key: 'dict',       label: 'Gallery',        Icon: WidgetsIcon,            Component: T3ComposerDict },
];
```

### 5.2 `shim/zionex/wingui-core.js` — DashboardPanel shim 추가

원본 DashboardPanel은 1000줄+ 클래스형 컴포넌트이지만, UserDashboardPage는 `store: 'PGM'`(읽기 전용) 모드로만 사용한다. 이 모드에서 실제로 동작하는 기능만 구현한다:

```jsx
// DashboardPanel lightweight shim
// 사용 패턴: store='PGM', isDraggable=false, isResizable=false, fitHeight=true
export function DashboardPanel({ id, widgets = [], OnGetWidgets, fitHeight, autoSize, option = {}, ...rest }) {
  const resolvedWidgets = OnGetWidgets ? OnGetWidgets(widgets) : widgets;
  // react-grid-layout 기반 읽기 전용 렌더링
  // 각 위젯의 onGetWidget 콜백으로 실제 컴포넌트 렌더링
  return (
    <GridLayout
      layout={resolvedWidgets.map(w => w['data-grid'])}
      isDraggable={false}
      isResizable={false}
      ...
    >
      {resolvedWidgets.map(w => (
        <div key={w.key}>{w.onGetWidget?.(w)}</div>
      ))}
    </GridLayout>
  );
}
```

---

## 6. 환경변수 및 빌드 설정

### 6.1 `webpack.config.js` — INSIGHT_API_BASE 추가

```js
new webpack.DefinePlugin({
  'process.env.COMPOSER_API_BASE': JSON.stringify(process.env.COMPOSER_API_BASE || 'http://localhost:8090'),
  'process.env.INSIGHT_API_BASE':  JSON.stringify(process.env.INSIGHT_API_BASE  || 'http://localhost:8080'),
}),
```

### 6.2 `index.jsx` — INSIGHT_API_BASE 런타임 주입

```js
window.__INSIGHT_API_BASE__ = process.env.INSIGHT_API_BASE || 'http://localhost:8080';
```

### 6.3 `package.json` — 신규 의존성 추가

```json
"@tanstack/react-table": "^8.11.0",
"@tanstack/react-virtual": "^3.0.0"
```
DataGrid.jsx가 사용하는 패키지. ChartComponent.jsx는 기존 `chart.js`, `react-chartjs-2`로 커버됨.

---

## 7. 의존성 해결 요약

| dashboardstudio 참조 | 해결 방법 | 수정 필요 |
|---|---|---|
| `@wingui/common/imports` (14개 심볼) | 기존 shim 그대로 사용 | ❌ 없음 |
| `@zionex/wingui-core/DashboardPanel` | shim에 경량 구현 추가 | shim 수정 |
| `../../restapi/widgetBuilder` | t3dashboard/restapi/ 신규 작성 | 신규 |
| `../../restapi/apiconfig` | t3dashboard/restapi/ 단순화 버전 | 신규 |
| `../../auth/userStore` | shim re-export | 신규 (5줄) |
| `../../component/chart/ChartComponent` | insight-front에서 복사 | 복사 |
| `../../component/data/DataGrid` | insight-front에서 복사 | 복사 |
| `../../store/insightStore` | 경량화 버전 신규 작성 | 신규 |
| `../../store/captureStore` | stub | 신규 (10줄) |
| `../../lang/i18n-func` | shim re-export | 신규 (3줄) |

**dashboardstudio 내부 파일 수정: 0건**

---

## 8. 작업 범위 요약

| 작업 | 대상 | 비고 |
|---|---|---|
| 폴더 복사 (수정 없음) | dashboardstudio/ (101파일) | 원본 그대로 |
| 파일 복사 | ChartComponent.jsx, DataGrid.jsx | 원본 그대로 |
| 신규 작성 | T3Dashboard.jsx | 진입점 재작성 |
| 신규 작성 | restapi/ (4파일) | 단순화된 API 레이어 |
| 신규 작성 (소형) | auth/userStore.js, store/ (2파일), lang/i18n-func.js | re-export 또는 stub |
| 수정 | App.jsx | 메뉴 항목 1줄 추가 |
| 수정 | shim/zionex/wingui-core.js | DashboardPanel shim 추가 |
| 수정 | webpack.config.js, index.jsx | INSIGHT_API_BASE 환경변수 |
| 패키지 추가 | package.json | @tanstack 2개 |

**총 신규/수정 파일: ~15개 + dashboardstudio 폴더 복사**

---

## 9. 백엔드 연동: t3series-insight-neo

### 9.1 서버 정보

| 항목 | 값 |
|---|---|
| **프레임워크** | Python FastAPI |
| **로컬 포트** | **9160** |
| **API prefix** | `/insight` |
| **CORS** | `allow_origins=["*"]` — 프론트엔드 직접 연결 가능 |
| **인증** | JWT Bearer Token + `x-user-id` 헤더 |

### 9.2 엔드포인트 일치 확인

insight-neo 백엔드의 실제 구현과 widgetBuilder.js가 호출하는 경로가 **정확히 일치**한다.

| widgetBuilder.js 호출 | insight-neo 실제 엔드포인트 |
|---|---|
| `GET /insight/dashboard-builder/list` | ✅ 구현됨 |
| `GET /insight/dashboard-builder/{id}` | ✅ 구현됨 |
| `POST /insight/dashboard-builder/save` | ✅ 구현됨 |
| `DELETE /insight/dashboard-builder/{id}` | ✅ 구현됨 |
| `PUT /insight/dashboard-builder/{id}/access` | ✅ 구현됨 |

위젯 빌더 엔드포인트(`/insight/widget-builder/*`)는 구현 여부를 별도 확인 필요.

### 9.3 인증 연동 방식

insight-neo는 두 가지 사용자 식별 방법을 사용한다:

1. **`x-user-id` 헤더** — 사용자 ID (선택적이지만 권한 필터링에 사용)
2. **JWT Bearer Token** — `Authorization: Bearer <token>` (auth_method=jwt 설정)

t3-composer에서 insight-neo에 요청할 때 `serviceCall.js`에서 다음 헤더를 자동 주입한다:

```js
// restapi/serviceCall.js
zAxios.interceptors.request.use((config) => {
  // 1. JWT 토큰 (t3-composer 세션 토큰 재사용 또는 insight-neo 별도 로그인)
  const token = sessionStorage.getItem('access_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;

  // 2. x-user-id (useUserStore에서 현재 로그인 사용자 ID)
  const userId = getUserStore(s => s.username || s.userId);
  if (userId) config.headers['x-user-id'] = userId;

  return config;
});
```

**인증 토큰 전략 (우선순위):**

| 전략 | 설명 | 권장 여부 |
|---|---|---|
| A. t3-composer 토큰 재사용 | t3-composer 로그인 시 발급된 JWT를 insight-neo에도 전달 | ⭐ 권장 (동일 secret key라면) |
| B. insight-neo 별도 로그인 | T3Dashboard 마운트 시 insight-neo에 별도 로그인 후 토큰 저장 | 두 서버 secret key가 다를 경우 |
| C. 토큰 없이 x-user-id만 사용 | insight-neo auth_method를 비인증으로 설정 | 개발/내부망 환경에서만 |

**권장: 전략 A** — insight-neo의 JWT secret key(`Zionex!SaaS!Key`)와 t3-composer 인증 서버의 secret key가 같다면 토큰 재사용이 가능하다. 다르다면 전략 B로 전환.

### 9.4 환경변수 설정

**`webpack.config.js`:**
```js
new webpack.DefinePlugin({
  'process.env.COMPOSER_API_BASE': JSON.stringify(process.env.COMPOSER_API_BASE || 'http://localhost:8090'),
  'process.env.INSIGHT_API_BASE':  JSON.stringify(process.env.INSIGHT_API_BASE  || 'http://localhost:9160'),
}),
```

**`index.jsx`:**
```js
window.__INSIGHT_API_BASE__ = process.env.INSIGHT_API_BASE || 'http://localhost:9160';
```

**로컬 개발 `.env` (또는 webpack 실행 시):**
```
INSIGHT_API_BASE=http://localhost:9160
```

**프로덕션 (Docker/컨테이너):**
```
INSIGHT_API_BASE=http://<insight-neo-host>:9160
```

### 9.5 로컬 개발 실행 순서

```
1. t3series-insight-neo 서버 시작
   cd C:\workspace\t3series-insight-neo\packages\insight-llm
   python -m server  (포트 9160)

2. t3-composer 프론트엔드 시작
   cd C:\workspace\t3-composer\frontend
   INSIGHT_API_BASE=http://localhost:9160 npm start  (포트 3000)

3. 브라우저에서 Dashboard 메뉴 진입 → insight-neo 9160 포트로 API 요청
```

### 9.6 미확인 엔드포인트

위젯 빌더 기능(`/insight/widget-builder/*`)이 insight-neo에 구현되어 있는지 확인 필요:
- `POST /insight/widget-builder/suggest`
- `GET /insight/widget-builder/source-catalog`
- `GET /insight/widget-builder/source-metadata`
- `GET /insight/widget-builder/business-tree`
- 기타

구현이 없으면 위젯 생성 기능은 비활성화하거나 별도 구현 필요.

---

## 11. 미결 사항 및 리스크

| 항목 | 리스크 | 대응 |
|---|---|---|
| `insightStore.js` 경량화 범위 | dashboardstudio가 실제로 사용하는 상태가 더 있을 수 있음 | 구현 중 import 추적으로 확인 |
| `apiconfig.js` 단순화 | 일부 위젯 빌더 기능이 apiconfig의 고급 기능을 사용할 수 있음 | 기능 테스트 후 필요 시 복원 |
| `DashboardPanel` shim 완성도 | 읽기 전용 이외 기능이 필요한 경우 | 초기엔 PGM 모드만 구현, 필요 시 확장 |
| insight 백엔드 인증 방식 | t3-composer의 access_token이 insight 백엔드에서 유효한지 | 실제 연결 테스트 필요 |
| DataGrid @tanstack 버전 호환성 | 원본의 tanstack 버전과 신규 설치 버전 차이 | package.json에서 원본 버전 확인 후 맞춤 |

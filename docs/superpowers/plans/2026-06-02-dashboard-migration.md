# Dashboard Studio Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `insight-front`의 `dashboardstudio`를 `t3-composer`의 `view/util/t3dashboard/`로 마이그레이션하고, `t3series-insight-neo`(FastAPI, 포트 9160) 백엔드와 연동되는 새 Dashboard 메뉴를 추가한다.

**Architecture:** `t3dashboard/` 안에 insight-front의 디렉토리 구조를 미러링하여 dashboardstudio 내부 파일의 상대경로 import(`../../restapi/`, `../../auth/` 등)가 수정 없이 그대로 작동하게 한다. API 레이어(`restapi/`)는 단순화된 버전으로 새로 작성하고, insight 전용 axios 인스턴스를 `INSIGHT_API_BASE` 환경변수로 구성한다.

**Tech Stack:** React 18, MUI v5, axios, zustand, react-grid-layout, @tanstack/react-table, @tanstack/react-virtual, chart.js, react-chartjs-2, Python FastAPI (insight-neo, 포트 9160)

---

## 파일 구조 (전체)

### 신규 생성
```
frontend/src/view/util/t3dashboard/
├── T3Dashboard.jsx                          Task 10
├── restapi/
│   ├── baseURI.js                           Task 3
│   ├── serviceCall.js                       Task 3
│   ├── apiconfig.js                         Task 4
│   └── widgetBuilder.js                     Task 5
├── auth/
│   └── userStore.js                         Task 6
├── store/
│   ├── insightStore.js                      Task 6
│   └── captureStore.js                      Task 6
├── lang/
│   └── i18n-func.js                         Task 6
├── component/
│   ├── chart/
│   │   └── ChartComponent.jsx               Task 7 (복사)
│   ├── data/
│   │   └── DataGrid.jsx                     Task 8 (복사)
│   └── dashboardstudio/                     Task 9 (폴더 전체 복사)
```

### 수정
```
frontend/package.json                        Task 1
frontend/webpack.config.js                   Task 2
frontend/src/index.jsx                       Task 2
frontend/src/shim/zionex/wingui-core.js      Task 11 (DashboardPanel shim)
frontend/src/App.jsx                         Task 12 (메뉴 추가)
```

---

## Task 1: @tanstack 패키지 설치

**Files:**
- Modify: `frontend/package.json`

DataGrid.jsx가 `@tanstack/react-table`과 `@tanstack/react-virtual`을 사용한다. 원본 insight-front의 버전을 확인한 뒤 일치시킨다.

- [ ] **Step 1: 원본 버전 확인**

```bash
# insight-front 또는 insight-neo의 lock 파일에서 버전 확인
# (없으면 최신 안정 버전 사용)
cat "C:\workspace\t3series-insight-neo\packages\webapps\package.json" | grep tanstack
# 또는
cat "C:\workspace\t3series-dev\t3series-wingui\packages\insight-front\package.json" | grep tanstack
```

- [ ] **Step 2: package.json에 의존성 추가**

`frontend/package.json`의 `"dependencies"` 블록에 추가 (알파벳 순서 유지):

```json
"@tanstack/react-table": "^8.11.0",
"@tanstack/react-virtual": "^3.0.1",
```

Step 1에서 확인한 버전이 있으면 그 버전으로 교체.

- [ ] **Step 3: 패키지 설치**

```bash
cd C:\workspace\t3-composer\frontend
npm install
```

Expected: `added N packages` 메시지, 에러 없음.

---

## Task 2: INSIGHT_API_BASE 환경변수 구성

**Files:**
- Modify: `frontend/webpack.config.js` (11번째 줄 근처, DefinePlugin 섹션)
- Modify: `frontend/src/index.jsx` (9번째 줄 근처)

- [ ] **Step 1: webpack.config.js 수정**

`frontend/webpack.config.js`에서 `apiBase` 변수 선언 바로 아래(12번째 줄)에 추가:

```js
// 기존 (11번째 줄)
const apiBase = process.env.COMPOSER_API_BASE || 'http://localhost:8090';

// 추가
const insightApiBase = process.env.INSIGHT_API_BASE || 'http://localhost:9160';
```

같은 파일의 `DefinePlugin` 블록(67번째 줄)에 항목 추가:

```js
new webpack.DefinePlugin({
  'process.env.COMPOSER_API_BASE': JSON.stringify(apiBase),
  'process.env.INSIGHT_API_BASE':  JSON.stringify(insightApiBase),   // ← 추가
  'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
}),
```

- [ ] **Step 2: index.jsx 수정**

`frontend/src/index.jsx`에서 `window.__COMPOSER_API_BASE__` 설정 바로 아래에 추가:

```js
// 기존 (9~12번째 줄)
const apiBase = process.env.COMPOSER_API_BASE || '';
if (typeof window !== 'undefined') {
    window.__COMPOSER_API_BASE__ = apiBase;
}

// 추가
const insightApiBase = process.env.INSIGHT_API_BASE || 'http://localhost:9160';
if (typeof window !== 'undefined') {
    window.__INSIGHT_API_BASE__ = insightApiBase;
}
```

- [ ] **Step 3: 빌드 오류 없는지 확인**

```bash
cd C:\workspace\t3-composer\frontend
npm start
```

Expected: 브라우저에서 기존 t3-composer 화면이 정상 표시됨 (대시보드 메뉴는 아직 없음). 터미널에 webpack 컴파일 에러 없음.

---

## Task 3: insight axios 인스턴스 생성

**Files:**
- Create: `frontend/src/view/util/t3dashboard/restapi/baseURI.js`
- Create: `frontend/src/view/util/t3dashboard/restapi/serviceCall.js`

insight-neo(포트 9160) 전용 axios 인스턴스. t3-composer의 기존 `zAxios`(포트 8090)와 완전히 분리된다.

- [ ] **Step 1: 폴더 생성**

```bash
mkdir -p "C:\workspace\t3-composer\frontend\src\view\util\t3dashboard\restapi"
```

- [ ] **Step 2: baseURI.js 생성**

`frontend/src/view/util/t3dashboard/restapi/baseURI.js`:

```js
/**
 * insight-neo 백엔드 Base URL.
 * webpack.config.js → index.jsx 에서 window.__INSIGHT_API_BASE__ 로 주입됨.
 * 기본값: http://localhost:9160
 */
export function baseURI() {
  return (typeof window !== 'undefined' && window.__INSIGHT_API_BASE__)
    ? window.__INSIGHT_API_BASE__
    : 'http://localhost:9160';
}
```

- [ ] **Step 3: serviceCall.js 생성**

`frontend/src/view/util/t3dashboard/restapi/serviceCall.js`:

```js
import axios from 'axios';
import { baseURI } from './baseURI';

/**
 * insight-neo 전용 axios 인스턴스.
 * - Authorization 헤더: sessionStorage의 access_token 자동 주입
 * - x-user-id 헤더: sessionStorage의 userId 자동 주입 (대시보드 접근권한 필터용)
 * - insight-neo CORS 설정이 allow_origins=["*"] 이므로 별도 proxy 불필요
 */
export const zAxios = axios.create({
  baseURL: baseURI(),
  timeout: 3_600_000,
  headers: { 'Content-Type': 'application/json' },
});

zAxios.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  const userId = sessionStorage.getItem('userId') || sessionStorage.getItem('username');
  if (userId) {
    config.headers['x-user-id'] = userId;
  }

  return config;
});

export default zAxios;
```

---

## Task 4: apiconfig.js 단순화 버전 생성

**Files:**
- Create: `frontend/src/view/util/t3dashboard/restapi/apiconfig.js`

원본 460줄 → 핵심 50줄만 유지. dashboardstudio 내부 파일들(`useGenericData.js`, `dataSourceApi.js`, `spDataApi.js` 등)이 `apiConfig.makeRequest()`와 `apiConfig.getInsightFullPath()`를 사용한다.

- [ ] **Step 1: apiconfig.js 생성**

`frontend/src/view/util/t3dashboard/restapi/apiconfig.js`:

```js
import { zAxios } from './serviceCall';

/**
 * insight API 설정 싱글톤 (단순화 버전).
 *
 * 원본(apiconfig.js 460줄)에서 dashboardstudio가 실제 사용하는 기능만 남김:
 * - getInsightFullPath(path): "/insight" prefix 조합
 * - makeRequest(method, path, data, options): HTTP 요청
 *
 * 제거된 기능: WebSocket, SSE, configureT3SeriesInsight, captureStore, i18n 초기화
 */
class ApiConfig {
  /**
   * path 앞에 "/insight"를 붙여 전체 경로를 반환한다.
   * 호출 예: getInsightFullPath('/widget-builder/suggest')
   *        → '/insight/widget-builder/suggest'
   */
  getInsightFullPath(path) {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `/insight${normalized}`;
  }

  /**
   * insight-neo 서버에 HTTP 요청을 보낸다.
   * @param {string} method - 'get' | 'post' | 'put' | 'delete' | 'patch'
   * @param {string} path   - /insight 이하 경로 (예: '/widget-builder/suggest')
   * @param {*}      data   - GET이면 query params, 나머지는 request body
   * @param {object} options - axios 추가 옵션
   */
  async makeRequest(method, path, data, options = {}) {
    const fullPath = this.getInsightFullPath(path);
    const isGet = method.toLowerCase() === 'get';
    return zAxios({
      method,
      url: fullPath,
      ...(isGet ? { params: data } : { data }),
      ...options,
    });
  }
}

export const apiConfig = new ApiConfig();
export default apiConfig;
```

---

## Task 5: widgetBuilder.js API 함수 재구현

**Files:**
- Create: `frontend/src/view/util/t3dashboard/restapi/widgetBuilder.js`

원본 함수 시그니처를 100% 유지하고, 내부를 새 `zAxios`로 교체한다. dashboardstudio 전체에서 이 파일을 `../../restapi/widgetBuilder`로 import한다.

- [ ] **Step 1: widgetBuilder.js 생성**

`frontend/src/view/util/t3dashboard/restapi/widgetBuilder.js`:

```js
import { zAxios } from './serviceCall';

const DB = '/insight/dashboard-builder';
const WB = '/insight/widget-builder';

// ──────────────────────────────────────────────────────────────
// Dashboard Builder
// ──────────────────────────────────────────────────────────────

/** 대시보드 단건 조회 */
export const getDashboard = (dashboardId) =>
  zAxios.get(`${DB}/${dashboardId}`);

/**
 * 대시보드 목록 조회
 * @param {object|null} params    - 추가 쿼리 파라미터
 * @param {string}      groupId   - 그룹 필터
 */
export const listDashboards = (params, groupId) =>
  zAxios.get(`${DB}/list`, { params: { groupId, ...params } });

/** 대시보드 저장 (신규/수정) */
export const saveDashboard = (data) =>
  zAxios.post(`${DB}/save`, data);

/** 대시보드 삭제 */
export const deleteDashboard = (dashboardId) =>
  zAxios.delete(`${DB}/${dashboardId}`);

/** 대시보드 접근 권한 변경 (생성자만 가능) */
export const updateDashboardAccess = (dashboardId, data) =>
  zAxios.put(`${DB}/${dashboardId}/access`, data);

// ──────────────────────────────────────────────────────────────
// Widget Builder
// ──────────────────────────────────────────────────────────────

/** 위젯 라이브러리 목록 조회 */
export const getWidgetLibrary = (params) =>
  zAxios.get(`${WB}/library`, { params });

/** 위젯 라이브러리에 저장 */
export const saveWidgetToLibrary = (data) =>
  zAxios.post(`${WB}/library`, data);

/** 위젯 라이브러리 수정 */
export const updateWidgetInLibrary = (id, data) =>
  zAxios.put(`${WB}/library/${id}`, data);

/** 위젯 라이브러리에서 삭제 */
export const deleteWidgetFromLibrary = (id) =>
  zAxios.delete(`${WB}/library/${id}`);

/** AI 위젯 추천 */
export const suggestWidget = (data) =>
  zAxios.post(`${WB}/suggest`, data);

/** 소스 카탈로그 조회 */
export const getSourceCatalog = () =>
  zAxios.get(`${WB}/source-catalog`);

/** 소스 메타데이터 조회 */
export const getSourceMetadata = (params) =>
  zAxios.get(`${WB}/source-metadata`, { params });

/** 비즈니스 트리 export */
export const exportBusinesstree = (params) =>
  zAxios.get(`${WB}/business-tree/export`, { params });

/** 비즈니스 트리 조회 */
export const getBusinessTree = (params) =>
  zAxios.get(`${WB}/business-tree`, { params });

/** 비즈니스 트리 모듈 목록 */
export const getBusinessTreeModules = (params) =>
  zAxios.get(`${WB}/business-tree/modules`, { params });

/** 비즈니스 트리 후보 조회 */
export const getBusinessTreeCandidates = (params) =>
  zAxios.get(`${WB}/business-tree/candidates`, { params });

/** 비즈 테이블 목록 */
export const getBizTables = (params) =>
  zAxios.get(`${WB}/biz-tables`, { params });

/** 비즈 컬럼 목록 */
export const getBizColumns = (params) =>
  zAxios.get(`${WB}/biz-columns`, { params });

/** 비즈 키워드 목록 */
export const getBizKeywords = (params) =>
  zAxios.get(`${WB}/biz-keywords`, { params });

/** 비즈 조인 목록 */
export const getBizJoins = (params) =>
  zAxios.get(`${WB}/biz-joins`, { params });

/** 비즈 카테고리 목록 */
export const getBizCategories = (params) =>
  zAxios.get(`${WB}/biz-categories`, { params });

/** 비즈 카테고리 수정 */
export const patchBizCategory = (id, data) =>
  zAxios.patch(`${WB}/biz-categories/${id}`, data);

/** 비즈 키워드 수정 */
export const patchBizKeyword = (id, data) =>
  zAxios.patch(`${WB}/biz-keywords/${id}`, data);

/** 비즈 컬럼 수정 */
export const patchBizColumn = (id, data) =>
  zAxios.patch(`${WB}/biz-columns/${id}`, data);

/** 비즈 조인 추가 */
export const addBizJoin = (data) =>
  zAxios.post(`${WB}/biz-joins`, data);

/** 비즈 조인 삭제 */
export const deleteBizJoin = (id) =>
  zAxios.delete(`${WB}/biz-joins/${id}`);
```

---

## Task 6: shim 위임 파일 4개 생성

**Files:**
- Create: `frontend/src/view/util/t3dashboard/auth/userStore.js`
- Create: `frontend/src/view/util/t3dashboard/store/insightStore.js`
- Create: `frontend/src/view/util/t3dashboard/store/captureStore.js`
- Create: `frontend/src/view/util/t3dashboard/lang/i18n-func.js`

dashboardstudio 내부 파일들이 `../../auth/userStore`, `../../store/insightStore` 등을 참조한다. t3-composer의 shim이나 zustand stub으로 위임한다.

- [ ] **Step 1: 폴더 생성**

```bash
mkdir -p "C:\workspace\t3-composer\frontend\src\view\util\t3dashboard\auth"
mkdir -p "C:\workspace\t3-composer\frontend\src\view\util\t3dashboard\store"
mkdir -p "C:\workspace\t3-composer\frontend\src\view\util\t3dashboard\lang"
```

- [ ] **Step 2: auth/userStore.js 생성**

`frontend/src/view/util/t3dashboard/auth/userStore.js`:

```js
/**
 * insight-front의 auth/userStore를 t3-composer shim으로 위임.
 * dashboardstudio에서 useUserStore, getUserStore, userStoreApi를 import한다.
 */
export { useUserStore, getUserStore, userStoreApi } from '@wingui/common/imports';
```

- [ ] **Step 3: store/insightStore.js 생성**

`frontend/src/view/util/t3dashboard/store/insightStore.js`:

```js
import { create } from 'zustand';

/**
 * insight 시스템 상태 스토어 (경량화 버전).
 * 원본(379줄)에서 dashboardstudio가 실제 사용하는 상태만 유지.
 *
 * 제거된 것: ViewDataComposer, AI 함수 맵, ViewDataProvider, WebSocket 설정
 */
const useInsightSystemStore = create(() => ({
  apiPrefix: '',
  baseURL: '',
  menuList: null,
  widgetList: null,
  userId: '',
  languageCode: (typeof localStorage !== 'undefined' && localStorage.getItem('languageCode')) || 'ko',
}));

export { useInsightSystemStore };
export const getInsightSystemStore = useInsightSystemStore.getState;
export const insightSystemStoreApi = {
  getState: useInsightSystemStore.getState,
  setState: useInsightSystemStore.setState,
  subscribe: useInsightSystemStore.subscribe,
};
```

- [ ] **Step 4: store/captureStore.js 생성**

`frontend/src/view/util/t3dashboard/store/captureStore.js`:

```js
import { create } from 'zustand';

/**
 * 이미지 캡처 상태 스토어 (stub).
 * t3-composer에서 대시보드 캡처 기능은 미사용이므로 빈 상태만 제공.
 */
export const useCaptureStore = create(() => ({
  contentRef: null,
  capturedImage: null,
}));

export const captureStoreApi = {
  getState: useCaptureStore.getState,
  setState: useCaptureStore.setState,
  subscribe: useCaptureStore.subscribe,
};
```

- [ ] **Step 5: lang/i18n-func.js 생성**

`frontend/src/view/util/t3dashboard/lang/i18n-func.js`:

```js
/**
 * insight-front의 lang/i18n-func를 t3-composer shim으로 위임.
 * wingui-core shim의 transLangKey(key, fallback) → fallback || key 반환.
 */
export { transLangKey, t } from '@zionex/wingui-core';
```

---

## Task 7: ChartComponent 복사

**Files:**
- Create: `frontend/src/view/util/t3dashboard/component/chart/ChartComponent.jsx` (복사)

dashboardstudio의 `generic/renderers/ChartRenderer.jsx`가 `../../../chart/ChartComponent`를 import한다. chart.js / react-chartjs-2는 t3-composer package.json에 이미 있다.

- [ ] **Step 1: 폴더 생성**

```bash
mkdir -p "C:\workspace\t3-composer\frontend\src\view\util\t3dashboard\component\chart"
```

- [ ] **Step 2: 파일 복사**

```bash
copy "C:\workspace\t3series-dev\t3series-wingui\packages\insight-front\src\component\chart\ChartComponent.jsx" `
     "C:\workspace\t3-composer\frontend\src\view\util\t3dashboard\component\chart\ChartComponent.jsx"
```

- [ ] **Step 3: 복사 후 import 경로 점검**

복사된 파일을 열어 `@insight/` 또는 `../../` 로 시작하는 import가 있는지 확인:

```bash
grep -n "from '@insight\|from '\.\." `
  "C:\workspace\t3-composer\frontend\src\view\util\t3dashboard\component\chart\ChartComponent.jsx"
```

`@insight/` import가 있다면 해당 줄을 확인하고 상대경로로 수정한다. `@wingui/` import는 기존 shim이 처리하므로 수정 불필요.

---

## Task 8: DataGrid 복사

**Files:**
- Create: `frontend/src/view/util/t3dashboard/component/data/DataGrid.jsx` (복사)

dashboardstudio의 `generic/renderers/TableRenderer.jsx`가 `../../../data/DataGrid`를 import한다. @tanstack 패키지는 Task 1에서 설치했다.

- [ ] **Step 1: 폴더 생성**

```bash
mkdir -p "C:\workspace\t3-composer\frontend\src\view\util\t3dashboard\component\data"
```

- [ ] **Step 2: 파일 복사**

```bash
copy "C:\workspace\t3series-dev\t3series-wingui\packages\insight-front\src\component\data\DataGrid.jsx" `
     "C:\workspace\t3-composer\frontend\src\view\util\t3dashboard\component\data\DataGrid.jsx"
```

- [ ] **Step 3: import 경로 점검**

```bash
grep -n "from '@insight\|from '\.\." `
  "C:\workspace\t3-composer\frontend\src\view\util\t3dashboard\component\data\DataGrid.jsx"
```

`@insight/` import가 있다면 상대경로로 수정. `@wingui/`, `@zionex/` import는 기존 shim이 처리하므로 수정 불필요.

- [ ] **Step 4: transLangKey import 경로 확인**

DataGrid.jsx가 `transLangKey`를 어디서 import하는지 확인:

```bash
grep -n "transLangKey\|i18n" `
  "C:\workspace\t3-composer\frontend\src\view\util\t3dashboard\component\data\DataGrid.jsx"
```

`@zionex/wingui-core` 또는 `@zionex/i18n-func`에서 import한다면 기존 shim이 처리하므로 그대로 유지. 다른 경로라면 `@zionex/wingui-core`로 변경.

---

## Task 9: dashboardstudio 폴더 전체 복사

**Files:**
- Create: `frontend/src/view/util/t3dashboard/component/dashboardstudio/` (101개 파일, 수정 없음)

이 단계가 핵심이다. 내부 파일을 수정하지 않고 그대로 복사한다. 상대경로 import(`../../restapi/`, `../../auth/` 등)는 Task 3~6에서 생성한 파일들을 가리키게 된다.

- [ ] **Step 1: 폴더 복사**

PowerShell에서 실행:

```powershell
Copy-Item `
  "C:\workspace\t3series-dev\t3series-wingui\packages\insight-front\src\component\dashboardstudio" `
  "C:\workspace\t3-composer\frontend\src\view\util\t3dashboard\component\dashboardstudio" `
  -Recurse
```

- [ ] **Step 2: 복사 결과 확인**

```bash
ls "C:\workspace\t3-composer\frontend\src\view\util\t3dashboard\component\dashboardstudio"
```

Expected: `core/`, `generic/`, `dashboardbuilder/`, `dashboardviewer/`, `widgetbuilder/`, `layout/`, `popup/`, `types/`, `userwidgetcreator/`, `UserDashboardPage.jsx` 등이 보여야 함.

- [ ] **Step 3: @insight/ import 잔존 여부 전수 확인**

```bash
grep -rn "from '@insight/" `
  "C:\workspace\t3-composer\frontend\src\view\util\t3dashboard\component\dashboardstudio"
```

**Expected:** 결과가 없어야 함. 만약 결과가 있다면 해당 파일과 경로를 기록하고 상대경로로 수정한다.

일반적으로 나올 수 있는 케이스:
- `from '@insight/restapi/widgetBuilder'` → `from '../../../restapi/widgetBuilder'`
- `from '@insight/component/chart/ChartComponent'` → `from '../../../chart/ChartComponent'`

---

## Task 10: T3Dashboard.jsx 진입점 생성

**Files:**
- Create: `frontend/src/view/util/t3dashboard/T3Dashboard.jsx`

t3-composer의 App.jsx가 import할 진입점 컴포넌트. UserDashboardPage를 t3-composer 레이아웃에 맞게 감싼다.

- [ ] **Step 1: T3Dashboard.jsx 생성**

`frontend/src/view/util/t3dashboard/T3Dashboard.jsx`:

```jsx
import React, { Suspense } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import UserDashboardPage from './component/dashboardstudio/UserDashboardPage';

/**
 * t3-composer Dashboard 메뉴 진입점.
 *
 * insight-front의 UserDashboardPage를 t3-composer 탭 레이아웃 안에서 렌더링한다.
 * - API: insight-neo (포트 9160), INSIGHT_API_BASE 환경변수로 구성
 * - 인증: sessionStorage의 access_token → Bearer 헤더 자동 주입 (serviceCall.js)
 * - 레이아웃: 탭 전체 높이를 채우는 Box
 */
export default function T3Dashboard() {
  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      <Suspense
        fallback={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">Dashboard 로딩 중...</Typography>
          </Box>
        }
      >
        <UserDashboardPage />
      </Suspense>
    </Box>
  );
}
```

---

## Task 11: DashboardPanel shim 추가

**Files:**
- Modify: `frontend/src/shim/zionex/wingui-core.js` (파일 끝에 추가)

UserDashboardPage가 `@zionex/wingui-core/component/dashboard/DashboardPanel`을 import한다. t3-composer의 wingui-core shim에 경량 구현을 추가한다.

사용 패턴: `store='PGM'`(읽기 전용), `isDraggable=false`, `isResizable=false`. 이 모드에서는 react-grid-layout 기반 렌더링만 필요하다.

- [ ] **Step 1: react-grid-layout CSS import 확인**

react-grid-layout이 이미 package.json에 있으므로 설치는 불필요. CSS를 import해야 한다:

```bash
grep -rn "react-grid-layout" "C:\workspace\t3-composer\frontend\src"
```

이미 CSS import가 있으면 중복 추가 불필요. 없으면 아래 Step 2에서 함께 처리.

- [ ] **Step 2: wingui-core.js 파일 끝에 DashboardPanel 추가**

`frontend/src/shim/zionex/wingui-core.js` 파일 **맨 끝**에 추가:

```jsx
// =============================================================================
// DashboardPanel — @zionex/wingui-core/component/dashboard/DashboardPanel
// 원본: 1000줄+ 클래스형 컴포넌트 (저장/로드/WebSocket 포함)
// shim: PGM 모드(읽기 전용)만 구현 — react-grid-layout 기반
// =============================================================================
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

/**
 * DashboardPanel lightweight shim.
 *
 * Props (UserDashboardPage에서 사용하는 것만):
 *   id           {string}   대시보드 ID (key로 사용)
 *   widgets      {Array}    위젯 배열 — 각 항목에 'data-grid' (x,y,w,h,i), key 포함
 *   OnGetWidgets {Function} widgets 배열을 받아 onGetWidget 콜백을 추가한 배열 반환
 *   isDraggable  {boolean}  false (읽기 전용)
 *   isResizable  {boolean}  false (읽기 전용)
 *   fitHeight    {boolean}  컨테이너 높이에 맞춤
 *   option       {object}   { store: 'PGM', ... } — 현재 미사용 (PGM 고정)
 */
export function DashboardPanel({
  id,
  widgets = [],
  OnGetWidgets,
  isDraggable = false,
  isResizable = false,
  fitHeight = false,
  option = {},
  actionBar,
  autoSize,
  menuCd,
  ...rest
}) {
  const containerRef = React.useRef(null);
  const [containerWidth, setContainerWidth] = React.useState(1200);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width || 1200);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const resolvedWidgets = React.useMemo(
    () => (OnGetWidgets ? OnGetWidgets(widgets) : widgets),
    [widgets, OnGetWidgets]
  );

  const layout = resolvedWidgets
    .filter(w => w['data-grid'])
    .map(w => ({ ...w['data-grid'], i: String(w.key ?? w.id ?? w['data-grid'].i) }));

  return (
    <Box
      ref={containerRef}
      sx={{ width: '100%', height: fitHeight ? '100%' : 'auto', overflow: 'auto' }}
    >
      <GridLayout
        layout={layout}
        cols={12}
        rowHeight={60}
        width={containerWidth}
        isDraggable={isDraggable}
        isResizable={isResizable}
        compactType={null}
        margin={[8, 8]}
      >
        {resolvedWidgets.map(w => {
          const key = String(w.key ?? w.id ?? w['data-grid']?.i ?? Math.random());
          return (
            <div key={key}>
              {w.onGetWidget ? w.onGetWidget(w) : null}
            </div>
          );
        })}
      </GridLayout>
    </Box>
  );
}
```

---

## Task 12: App.jsx에 Dashboard 메뉴 추가

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: import 추가**

`frontend/src/App.jsx`의 import 블록(상단 10~11번째 줄)에 추가:

```js
import DashboardIcon from '@mui/icons-material/Dashboard';
import T3Dashboard from './view/util/t3dashboard/T3Dashboard';
```

- [ ] **Step 2: MENU_ITEMS에 항목 추가**

`frontend/src/App.jsx`의 `MENU_ITEMS` 배열에서 `history` 항목 바로 뒤에 추가:

```js
const MENU_ITEMS = [
    { key: 'composer',   label: 'Composer',      Icon: AutoAwesomeIcon,        hint: 'AI 화면 생성 — 자연어·복사·설계서 기반 신규 / 기존 화면 수정', Component: T3Composer },
    { key: 'history',    label: 'History',        Icon: HistoryIcon,            hint: '작업 이력 — 진행·완료·보관 세션 조회 및 이어하기',           Component: T3ComposerHistory },
    { key: 'dashboard',  label: 'Dashboard',      Icon: DashboardIcon,          hint: '대시보드 빌더 — 위젯 기반 사용자 대시보드 조회 및 편집',       Component: T3Dashboard },  // ← 추가
    { key: 'mockup',     label: 'SCM UI Mockup',  Icon: DashboardCustomizeIcon, hint: 'SCM UI Mockup 패턴 갤러리 — 화면 목업 카탈로그',             Component: T3Mockup },
    { key: 'patterns',   label: 'UI Pattern',     Icon: ViewQuiltIcon,          hint: 'T3MES UI 패턴 카탈로그 — MES/SCM 도메인별 화면 패턴',         Component: T3mesPatternCatalog },
    { key: 'dict',       label: 'Gallery',        Icon: WidgetsIcon,            hint: 'Composer 갤러리 — Grid·Chart·KPI 사전',                      Component: T3ComposerDict },
];
```

---

## Task 13: 연동 검증

**목표:** insight-neo 서버와 t3-composer 프론트엔드가 정상 연동되는지 확인.

- [ ] **Step 1: insight-neo 서버 실행 확인**

```bash
# insight-neo가 이미 실행 중인지 확인
curl http://localhost:9160/insight/dashboard-builder/list
```

Expected: JSON 응답 (빈 배열 `[]` 또는 대시보드 목록). 서버가 꺼져 있으면 insight-neo 실행 후 진행.

- [ ] **Step 2: t3-composer 개발 서버 실행**

```bash
cd C:\workspace\t3-composer\frontend
npm start
```

Expected: `webpack compiled successfully` 메시지. 브라우저에서 `http://localhost:3000` 열림.

- [ ] **Step 3: Dashboard 메뉴 확인**

브라우저에서:
1. 좌측 사이드바에 "Dashboard" 메뉴 항목이 보이는지 확인
2. Dashboard 클릭 → 탭이 열리는지 확인
3. 브라우저 콘솔(F12)에서 빨간 에러가 없는지 확인

- [ ] **Step 4: API 요청 확인**

브라우저 DevTools → Network 탭:
1. Dashboard 탭이 열릴 때 `localhost:9160/insight/dashboard-builder/list` 요청이 가는지 확인
2. 요청 헤더에 `x-user-id`가 있는지 확인
3. 응답이 200이면 정상. 401이면 Task 13 Step 5로 이동

- [ ] **Step 5: 인증 오류 대응 (401 발생 시)**

insight-neo가 JWT 인증을 요구하고 t3-composer의 토큰이 없는 경우:

**개발 환경 임시 우회:** insight-neo의 auth_method를 비인증으로 변경:
```yaml
# C:\workspace\t3series-insight-neo\packages\insight-llm\conf\local\server_config.yaml
app:
  security:
    auth_method: none   # jwt → none 으로 변경 (개발용)
```

**또는:** sessionStorage에 수동으로 토큰 설정 후 테스트:
```js
// 브라우저 콘솔에서 실행
sessionStorage.setItem('access_token', '<insight-neo에서 발급한 JWT>');
sessionStorage.setItem('userId', 'your-user-id');
location.reload();
```

- [ ] **Step 6: 컴파일 오류 트러블슈팅**

webpack 컴파일 에러가 있다면 에러 메시지의 파일 경로와 줄 번호를 확인한다.

일반적인 케이스:
- `Module not found: @insight/...` → Task 9 Step 3에서 놓친 import가 있음. 해당 파일에서 상대경로로 수정
- `Module not found: @tanstack/...` → Task 1을 다시 실행
- `Cannot find module 'react-grid-layout/css/styles.css'` → `npm install` 재실행

---

## 미결 사항 (구현 중 확인 필요)

| # | 항목 | 확인 방법 |
|---|---|---|
| 1 | `/insight/widget-builder/*` 엔드포인트 insight-neo 구현 여부 | insight-neo 서버 실행 후 curl로 확인 |
| 2 | JWT 토큰 재사용 가능 여부 (secret key 일치 여부) | 401 발생 시 Step 5 참고 |
| 3 | DataGrid.jsx의 `transLangKey` import 경로 | Task 8 Step 4에서 확인 |
| 4 | dashboardstudio 내 `@insight/style` 또는 CSS alias 사용 여부 | Task 9 Step 3 grep에서 확인 |
| 5 | insightStore의 실제 사용 범위 (경량화 버전으로 충분한지) | 런타임 에러로 확인 |

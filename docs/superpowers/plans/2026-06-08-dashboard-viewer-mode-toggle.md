# Dashboard Viewer Mode Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `UserDashboardPage` 에서 읽기 전용 그리드 렌더링을 공통 viewer 컴포넌트로 추출하고, 편집/뷰어 모드 토글을 도입한다.

**Architecture:** 한 화면 안에서 `mode = 'edit' | 'viewer'` state 로 헤더의 편집 버튼만 조건부 노출. 본문(위젯 그리드)은 모드와 무관하게 동일. `ReadOnlyDashboardGrid` + `ViewerWidget` + 정규화 유틸을 `viewer/` 폴더로 추출해 향후 일반 사용자 화면이 재사용할 수 있게 한다.

**Tech Stack:** React 18, Material-UI 5, react-grid-layout, Zustand. **테스트 프레임워크 없음** — 검증은 webpack dev server (`npm run dev`, port 5173) + 브라우저 수동 확인.

**Spec:** [docs/superpowers/specs/2026-06-08-dashboard-viewer-mode-toggle-design.md](../specs/2026-06-08-dashboard-viewer-mode-toggle-design.md)

---

## 작업 전 확인 사항

- [ ] 작업 디렉토리: `c:\workspace\t3-composer\`
- [ ] 대상 폴더: `frontend/src/view/util/t3dashboard/`
- [ ] 브라우저 접근 URL: dev server 기동 후 Composer 의 Dashboard 메뉴
- [ ] 검증용 dev server 명령: `cd frontend && npm run dev` (또는 docker compose 환경의 frontend 컨테이너 hot-reload)
- [ ] 검증용 대시보드: insight-neo 백엔드에 등록된 대시보드 1개 이상 (위젯 포함)

---

## File Structure

| 파일 | 작업 | 책임 |
|---|---|---|
| `frontend/src/view/util/t3dashboard/component/dashboardstudio/viewer/widgetNormalize.js` | 신규 | 위젯 정규화 순수 함수 + 도메인 상수 (SalesBoard 레이아웃 등) |
| `frontend/src/view/util/t3dashboard/component/dashboardstudio/viewer/DashboardViewer.jsx` | 신규 | 읽기 전용 그리드 렌더링 컴포넌트 (`ReadOnlyDashboardGrid` + 내부 `ViewerWidget`) |
| `frontend/src/view/util/t3dashboard/auth/currentUser.js` | 수정 | `canEditUser()` + `useCanEditUser()` export 추가 |
| `frontend/src/view/util/t3dashboard/component/dashboardstudio/UserDashboardPage.jsx` | 수정 | (1) 추출 대상 코드 제거 + `DashboardViewer` 호출 (Task 4) → (2) `mode` state · 토글 · 헤더 재구성 (Task 5) |

---

## Task 1: viewer/widgetNormalize.js 신규 작성

추출 대상은 모두 순수 함수 + 상수 — 사이드이펙트 없음, React 의존 없음.

**Files:**
- Create: `frontend/src/view/util/t3dashboard/component/dashboardstudio/viewer/widgetNormalize.js`

**Source (move from)**:
- `UserDashboardPage.jsx:74~163` 의 다음 항목 전부:
  - 상수: `SALESBOARD_LAYOUT_BY_WIDGET_ID`, `SALESBOARD_WIDGET_IDS`
  - 함수: `getWidgetId`, `shouldNormalizeSalesBoardLayout`, `normalizeSalesBoardLayout`, `normalizeDashboardWidgets`, `toFiniteGridNumber`, `getWidgetGrid`, `getDashboardMaxRow`, `toReadOnlyLayoutItem`

> `getDashboardDescription` (line 85~87) 은 `DashboardListDialog` 에서만 쓰는 메타 표시 함수이므로 **이번 추출 대상이 아님**. `UserDashboardPage.jsx` 에 남겨둠.

- [ ] **Step 1: 폴더 생성 + 파일 신규 작성**

폴더가 없으면 자동 생성됨 (Write 도구가 처리). 다음 내용으로 작성:

```jsx
import {
  DASHBOARD_GRID_COLS,
  DASHBOARD_GRID_DEFAULT_H,
  DASHBOARD_GRID_DEFAULT_W,
} from '../core/dashboardGridRules';

// SalesBoard 전용 표준 레이아웃 — 사용자가 KPI 위젯을 임의 크기로 저장했더라도
// 도메인 표준 비율로 강제 정규화한다. (도메인 특화 분기지만 추후 별도 모듈로 분리 가능)
export const SALESBOARD_LAYOUT_BY_WIDGET_ID = {
  WI_DP_YEAR_TARGET_SALES: { x: 0, y: 0, w: 4, h: 18 },
  WI_DP_YEAR_ACTUAL_SALES: { x: 4, y: 0, w: 4, h: 18 },
  WI_DP_TOP_SALES_ITEM:    { x: 8, y: 0, w: 4, h: 18 },
  WI_DP_PLAN_STATUS_Y:     { x: 0, y: 18, w: 6, h: 41 },
  WI_DP_TOP_SALES_ITEMGRP: { x: 6, y: 18, w: 6, h: 41 },
  WI_DP_TOP_SALES_ACCOUNT: { x: 0, y: 59, w: 12, h: 41 },
};

export const SALESBOARD_WIDGET_IDS = Object.keys(SALESBOARD_LAYOUT_BY_WIDGET_ID);

export function getWidgetId(wconfig) {
  return wconfig?.widgetId || wconfig?.widget_id || wconfig?.id;
}

export function getWidgetGrid(wconfig) {
  return wconfig?.['data-grid'] || wconfig?.data_grid || {};
}

export function toFiniteGridNumber(value, fallback) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function shouldNormalizeSalesBoardLayout(widgetConfigs) {
  if (!Array.isArray(widgetConfigs)) return false;

  const widgetById = new Map(widgetConfigs.map(wconfig => [getWidgetId(wconfig), wconfig]));
  if (!SALESBOARD_WIDGET_IDS.every(widgetId => widgetById.has(widgetId))) return false;

  const kpiWidgets = [
    widgetById.get('WI_DP_YEAR_TARGET_SALES'),
    widgetById.get('WI_DP_YEAR_ACTUAL_SALES'),
    widgetById.get('WI_DP_TOP_SALES_ITEM'),
  ];
  const accountWidget = widgetById.get('WI_DP_TOP_SALES_ACCOUNT');

  return (
    kpiWidgets.every(wconfig => wconfig?.['data-grid']?.w === 2 && Number(wconfig?.['data-grid']?.h) < 10) &&
    accountWidget?.['data-grid']?.w === 6 &&
    accountWidget?.['data-grid']?.x === 6 &&
    Number(accountWidget?.['data-grid']?.h) < 20
  );
}

export function normalizeSalesBoardLayout(widgetConfigs) {
  if (!shouldNormalizeSalesBoardLayout(widgetConfigs)) return widgetConfigs;

  return widgetConfigs.map((wconfig) => {
    const normalizedLayout = SALESBOARD_LAYOUT_BY_WIDGET_ID[getWidgetId(wconfig)];
    if (!normalizedLayout) return wconfig;

    return {
      ...wconfig,
      'data-grid': {
        ...wconfig['data-grid'],
        ...normalizedLayout,
        i: wconfig.key,
      },
    };
  });
}

export function normalizeDashboardWidgets(widgetConfigs) {
  if (!Array.isArray(widgetConfigs)) return [];

  return normalizeSalesBoardLayout(widgetConfigs).map((wconfig, index) => ({
    ...wconfig,
    key: wconfig.key || String(index + 1),
    'data-grid': {
      ...(wconfig['data-grid'] || {}),
      i: wconfig.key || String(index + 1),
    },
  }));
}

export function getDashboardMaxRow(widgetConfigs) {
  if (!Array.isArray(widgetConfigs) || widgetConfigs.length === 0) return 0;

  return widgetConfigs.reduce((maxRow, wconfig, index) => {
    const grid = getWidgetGrid(wconfig);
    const y = toFiniteGridNumber(grid.y, index * 2);
    const h = toFiniteGridNumber(grid.h, DASHBOARD_GRID_DEFAULT_H);
    return Math.max(maxRow, y + h);
  }, 0);
}

export function toReadOnlyLayoutItem(wconfig, index = 0) {
  const grid = getWidgetGrid(wconfig);
  const minW = toFiniteGridNumber(grid.minW, 2);
  const minH = toFiniteGridNumber(grid.minH, 3);
  const rawX = toFiniteGridNumber(grid.x, 0);
  const rawY = toFiniteGridNumber(grid.y, index * 2);
  const rawW = toFiniteGridNumber(grid.w, DASHBOARD_GRID_DEFAULT_W);
  const rawH = toFiniteGridNumber(grid.h, DASHBOARD_GRID_DEFAULT_H);
  let x = Math.max(0, Math.min(rawX, DASHBOARD_GRID_COLS - 1));
  let w = Math.min(DASHBOARD_GRID_COLS - x, Math.max(minW, rawW));

  if (w < minW) {
    w = minW;
    x = Math.max(0, DASHBOARD_GRID_COLS - w);
  }

  return {
    ...grid,
    i: grid.i || wconfig.key || String(index + 1),
    x,
    y: Math.max(0, rawY),
    w,
    h: Math.max(minH, rawH),
    minW,
    minH,
    static: true,
    isDraggable: false,
    isResizable: false,
  };
}
```

- [ ] **Step 2: 검증 — 파일 존재 + import 경로 해석**

다음 명령으로 확인:
```bash
ls frontend/src/view/util/t3dashboard/component/dashboardstudio/viewer/widgetNormalize.js
```
Expected: 파일 표시됨.

추가로 ESLint 가 잡지 못한 syntax 오류가 있는지 webpack dev server 가 기동되어 있다면 자동으로 컴파일 로그에 에러 노출됨. (아직 어디서도 import 안 했으므로 lazy chunk 까지는 안 들어감 — Task 2 후에 import 됨.)

- [ ] **Step 3: 검증 — Step 1 에 명시한 export 목록과 실제 작성된 함수/상수 1:1 일치 확인**

다음 9개가 모두 named export 인지 grep 으로 확인:
```bash
grep -E "^export (const|function) " frontend/src/view/util/t3dashboard/component/dashboardstudio/viewer/widgetNormalize.js
```
Expected: 정확히 9개 (`SALESBOARD_LAYOUT_BY_WIDGET_ID`, `SALESBOARD_WIDGET_IDS`, `getWidgetId`, `getWidgetGrid`, `toFiniteGridNumber`, `shouldNormalizeSalesBoardLayout`, `normalizeSalesBoardLayout`, `normalizeDashboardWidgets`, `getDashboardMaxRow`, `toReadOnlyLayoutItem`) — 10개가 맞음.

---

## Task 2: viewer/DashboardViewer.jsx 신규 작성

`UserDashboardPage.jsx:196~367` 의 `ViewerWidget` (line 196~259) + `ReadOnlyDashboardGrid` (line 261~367) 두 컴포넌트를 옮긴다.

**Files:**
- Create: `frontend/src/view/util/t3dashboard/component/dashboardstudio/viewer/DashboardViewer.jsx`

**Public interface (spec §5):**
```jsx
<DashboardViewer
  widgets={...}           // (Array) 정규화된 위젯 배열
  onMaximize={...}        // (widget) => void — 위젯 최대화 콜백 (optional)
  maximizedWidget={...}   // (Object|null) 현재 최대화된 위젯 (optional)
  onRestoreMaximize={...} // () => void — 최대화 복원 콜백 (optional)
/>
```

`DashboardViewer` 의 본문은 기존 `ReadOnlyDashboardGrid` 와 동일하게 위젯 그리드만 렌더링한다. **최대화 오버레이는 `DashboardViewer` 가 그리지 않고 부모(`UserDashboardPage`) 가 그대로 그린다** — 기존 line 920~940 의 `maximizedWidget` overlay JSX 는 UserDashboardPage 에 남는다. `DashboardViewer` 에 `maximizedWidget`/`onRestoreMaximize` prop 을 받기는 하지만 v1 에서는 사용하지 않고 추후 일반 사용자 화면에서 자체 오버레이를 그릴 때 확장 여지로만 둔다.

> 이 분리 방식은 spec §11 의 "DashboardViewer 가 maximizedWidget 상태를 부모가 갖는지 자체가 갖는지 → 부모가 보유 → prop 으로 주입" 결정과 일치한다.

- [ ] **Step 1: 파일 신규 작성**

```jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';

import GenericWidget from '../generic/GenericWidget';
import { toWidgetDataConfig, toWidgetVisualConfig } from '../generic/widgetSpecAdapter';
import { GridLayout, useContainerWidth, noCompactor } from '../core/GridLayoutCompat';
import {
  DASHBOARD_GRID_COLS,
  DASHBOARD_GRID_MIN_ROWS,
  DASHBOARD_GRID_MARGIN,
  DASHBOARD_GRID_PADDING,
  calculateDashboardRowHeight,
} from '../core/dashboardGridRules';
import {
  getDashboardMaxRow,
  toReadOnlyLayoutItem,
} from './widgetNormalize';

function ViewerWidget({ item, embeddedInPanel = false, maximized = false, onMaximize, onRestore }) {
  const dataConfig = useMemo(() => toWidgetDataConfig(item.spec_json), [item.spec_json]);
  const visualConfig = useMemo(() => toWidgetVisualConfig(item.spec_json, item.widget_type), [item.spec_json, item.widget_type]);

  const handleMaximize = () => {
    if (maximized) {
      onRestore?.();
    } else {
      onMaximize?.(item);
    }
  };

  if (embeddedInPanel) {
    return (
      <Box sx={{ height: '100%', minHeight: 0, overflow: 'hidden', p: 1.25, bgcolor: '#fbfcfe' }}>
        <GenericWidget dataConfig={dataConfig} visualConfig={visualConfig} />
      </Box>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        height: '100%',
        width: '100%',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderColor: '#e5eaf2',
        borderRadius: '8px',
        bgcolor: '#fff',
        boxShadow: '0 10px 28px rgba(15, 23, 42, 0.05)',
      }}
    >
      <Box
        sx={{
          minHeight: 36,
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.25,
          py: 0.75,
          borderBottom: '1px solid #edf2f7',
          bgcolor: '#fff',
        }}
      >
        <Box sx={{ width: 3, height: 15, borderRadius: 1, bgcolor: '#3b82f6', flexShrink: 0 }} />
        <Typography sx={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 800, color: '#1e293b' }} noWrap>
          {item.title}
        </Typography>
        <Tooltip title={maximized ? 'Restore' : 'Maximize'}>
          <IconButton size="small" onClick={handleMaximize} sx={{ width: 22, height: 22, p: 0.25 }}>
            {maximized ? <CloseFullscreenIcon sx={{ fontSize: 15 }} /> : <OpenInFullIcon sx={{ fontSize: 15 }} />}
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, width: '100%', overflow: 'hidden', p: 1.25, bgcolor: '#fbfcfe' }}>
        <GenericWidget dataConfig={dataConfig} visualConfig={visualConfig} />
      </Box>
    </Paper>
  );
}

export { ViewerWidget };

/**
 * 읽기 전용 대시보드 viewer 컴포넌트.
 *
 * - 위젯 배열을 받아 react-grid-layout 기반 읽기 전용 그리드 렌더링
 * - isDraggable=false, isResizable=false 고정 (모드와 무관하게 항상 읽기 전용)
 * - 컨테이너 크기 ResizeObserver 측정 → rowHeight 동적 계산 → 필요 시 세로 스크롤
 * - 최대화 콜백 (onMaximize) 만 받음. 최대화 오버레이 렌더링은 부모 책임.
 *
 * Props:
 *   widgets               : (Array)  정규화된 위젯 배열 (normalizeDashboardWidgets 적용 완료 상태)
 *   onMaximize            : (widget) => void   위젯 최대화 요청 콜백. 없으면 최대화 아이콘 비활성.
 *   maximizedWidget       : (Object|null)  현재 최대화된 위젯 — v1 에서는 사용하지 않음 (확장 여지).
 *   onRestoreMaximize     : () => void  최대화 복원 콜백 — v1 에서는 사용하지 않음.
 */
export default function DashboardViewer({
  widgets,
  onMaximize,
  // 아래 두 prop 은 인터페이스 안정성을 위해 받지만 v1 에서는 사용하지 않는다.
  // 일반 사용자 화면이 자체 최대화 오버레이를 그릴 때 의미를 갖는다.
  // eslint-disable-next-line no-unused-vars
  maximizedWidget,
  // eslint-disable-next-line no-unused-vars
  onRestoreMaximize,
}) {
  const { containerRef, width, mounted, measureWidth } = useContainerWidth({
    initialWidth: 1200,
    measureBeforeMount: true,
  });
  const [containerHeight, setContainerHeight] = useState(0);
  const layout = useMemo(
    () => widgets.map((widget, index) => toReadOnlyLayoutItem(widget, index)),
    [widgets]
  );

  const maxUsedRow = useMemo(() => getDashboardMaxRow(widgets), [widgets]);
  const displayRows = Math.max(DASHBOARD_GRID_MIN_ROWS, maxUsedRow);

  useEffect(() => {
    const rafId = requestAnimationFrame(measureWidth);
    const timerId = setTimeout(measureWidth, 150);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
    };
  }, [measureWidth, widgets.length]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return undefined;

    // containerRef 는 inner div (overflowY 가 발화하는 그 자체) 를 가리킨다.
    // clientWidth/Height 가 스크롤바 폭과 자체 패딩을 자동 반영하므로 보정값 불필요.
    const updateSize = () => {
      setContainerHeight(Math.max(0, element.clientHeight || 0));
      measureWidth();
    };
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    updateSize();
    return () => observer.disconnect();
  }, [containerRef, measureWidth]);

  const rowHeight = useMemo(() => calculateDashboardRowHeight(containerHeight, displayRows), [containerHeight, displayRows]);

  const gridPixelHeight = useMemo(() => {
    const marginY = DASHBOARD_GRID_MARGIN[1];
    const paddingY = DASHBOARD_GRID_PADDING[1];
    return displayRows * rowHeight + Math.max(0, displayRows - 1) * marginY + paddingY * 2;
  }, [displayRows, rowHeight]);

  const needsScroll = containerHeight > 0 && gridPixelHeight > containerHeight;

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        p: 1,
        bgcolor: '#f8fafc',
        boxSizing: 'border-box',
        '& .react-grid-layout': {
          minHeight: '100%',
          overflow: 'hidden',
        },
        '& .react-grid-item': {
          overflow: 'hidden',
        },
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 8, left: 8, right: 8, bottom: 8,
          overflowY: needsScroll ? 'auto' : 'hidden',
          overflowX: 'hidden',
        }}
      >
        {mounted && (
          <GridLayout
            className="layout"
            layout={layout}
            width={Math.max(320, width)}
            gridConfig={{
              cols: DASHBOARD_GRID_COLS,
              maxRows: displayRows,
              rowHeight,
              margin: DASHBOARD_GRID_MARGIN,
              containerPadding: DASHBOARD_GRID_PADDING,
            }}
            dragConfig={{ enabled: false }}
            resizeConfig={{ enabled: false }}
            compactor={noCompactor}
            autoSize={false}
            style={{ height: needsScroll ? gridPixelHeight : '100%', minHeight: '100%', overflow: 'hidden' }}
          >
            {widgets.map((item, index) => (
              <div key={item.key} data-grid={toReadOnlyLayoutItem(item, index)}>
                <ViewerWidget item={item} onMaximize={onMaximize} />
              </div>
            ))}
          </GridLayout>
        )}
      </div>
    </Box>
  );
}
```

- [ ] **Step 2: 검증 — 파일 존재 + ESLint syntax**

```bash
ls frontend/src/view/util/t3dashboard/component/dashboardstudio/viewer/DashboardViewer.jsx
```

webpack dev server 가 기동 중이라면 (`docker compose logs -f composer-frontend`) 이 파일이 새로 추가됐다는 watch 메시지 외 에러 없음을 확인. **아직 어디서도 import 안 했으므로 lazy chunk 까진 안 들어감.**

- [ ] **Step 3: 검증 — `ViewerWidget` named export + `DashboardViewer` default export 둘 다 노출 확인**

```bash
grep -E "^(export default|export \{)" frontend/src/view/util/t3dashboard/component/dashboardstudio/viewer/DashboardViewer.jsx
```
Expected:
```
export { ViewerWidget };
export default function DashboardViewer({
```

`UserDashboardPage.jsx` 의 `handleGetWidgets` 가 여전히 `ViewerWidget` 을 직접 사용하므로 named export 가 필요하다 (Task 4 에서 import 추가).

---

## Task 3: auth/currentUser.js 수정 — `canEditUser` / `useCanEditUser` 추가

`ENABLE_AUTH=false` 환경에서는 항상 true 반환. 미래 인증 켜지면 role/permission 체크로 교체.

**Files:**
- Modify: `frontend/src/view/util/t3dashboard/auth/currentUser.js`

- [ ] **Step 1: 파일 끝에 함수 2개 추가**

`canEditDashboardAccess` 아래(line 39 다음)에 다음을 추가:

```jsx
/**
 * 편집 액션(위젯/대시보드 생성, 모드 토글) 수행 권한.
 *
 * - 대시보드 단위가 아닌 **사용자 단위 전역** 판정.
 * - 오픈 환경(ENABLE_AUTH=false)에서는 항상 true → 모든 컨설턴트가 편집자.
 * - 인증 켜지면 role/permission flag 체크로 교체 (TODO).
 *
 * (destructive 액션인 권한 편집 ✎ 은 canEditDashboardAccess 로 별도 보호 — 본 함수 사용 X)
 */
export function canEditUser() {
  if (!ENABLE_AUTH) return true;
  // TODO: ENABLE_AUTH=true 시 resolveCurrentUser().role/permissions 등으로 판정.
  return false;
}

/** canEditUser 의 React hook 버전. zustand selector 형태로 교체될 자리. */
export function useCanEditUser() {
  return canEditUser();
}
```

- [ ] **Step 2: 검증 — 두 함수가 export 됨**

```bash
grep -E "^export function (canEditUser|useCanEditUser)" frontend/src/view/util/t3dashboard/auth/currentUser.js
```
Expected:
```
export function canEditUser() {
export function useCanEditUser() {
```

- [ ] **Step 3: 검증 — `ENABLE_AUTH=false` 분기에서 true 반환**

`currentUser.js` 의 `ENABLE_AUTH` 가 `false` 인지 확인 (line 14):
```bash
grep -n "ENABLE_AUTH" frontend/src/view/util/t3dashboard/auth/currentUser.js
```
Expected: `export const ENABLE_AUTH = false;` 행 노출. → `canEditUser()` 도 항상 true 반환.

---

## Task 4: UserDashboardPage.jsx — 추출 코드 제거 + `DashboardViewer` 호출로 교체 (기능 변경 없는 리팩토링)

**이 task 의 목적은 기능 변경 없이 코드 위치만 옮기는 것.** 화면은 기존과 시각적으로 100% 동일하게 동작해야 한다.

**Files:**
- Modify: `frontend/src/view/util/t3dashboard/component/dashboardstudio/UserDashboardPage.jsx`

- [ ] **Step 1: import 블록 정리**

`UserDashboardPage.jsx:46~71` 의 import 블록을 다음으로 교체.

**제거할 import** (이 파일에서 더 이상 직접 쓰지 않음):
- `Paper` (MUI) — `ViewerWidget` 만 쓰던 것
- `OpenInFullIcon`, `CloseFullscreenIcon` — `ViewerWidget` 만 쓰던 것
- `GridLayout`, `useContainerWidth`, `noCompactor` (core/GridLayoutCompat) — `ReadOnlyDashboardGrid` 만 쓰던 것
- `GenericWidget` (generic/GenericWidget) — `ViewerWidget` 만 쓰던 것
- `toWidgetDataConfig`, `toWidgetVisualConfig` (generic/widgetSpecAdapter) — `ViewerWidget` 만 쓰던 것
- `DASHBOARD_GRID_COLS`, `DASHBOARD_GRID_DEFAULT_H`, `DASHBOARD_GRID_DEFAULT_W`, `DASHBOARD_GRID_MIN_ROWS`, `DASHBOARD_GRID_MARGIN`, `DASHBOARD_GRID_PADDING`, `calculateDashboardRowHeight` (core/dashboardGridRules) — `ReadOnlyDashboardGrid` / `toReadOnlyLayoutItem` / `getDashboardMaxRow` 가 쓰던 것

> ⚠️ **유지할 import**: `DashboardBuilderPopup` 의 `DASHBOARD_GRID_DEFAULT_H/W` 사용 여부는 무관 — 이 두 상수는 UserDashboardPage 본문이 직접 쓰지 않으면 import 제거 대상. 확인 필요 시 `grep -n "DASHBOARD_GRID_" UserDashboardPage.jsx` 로 잔존 참조 확인.

**추가할 import**:
- `DashboardViewer`, `ViewerWidget` from `./viewer/DashboardViewer`
- `normalizeDashboardWidgets` from `./viewer/widgetNormalize`

교체 후 import 블록은 이렇게:

```jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EditIcon from '@mui/icons-material/Edit';
import GroupIcon from '@mui/icons-material/Group';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';

import { ContentInner, WorkArea } from '@wingui/common/imports';
import { transLangKey } from '@zionex/wingui-core';

import DashboardPanel from '@zionex/wingui-core/component/dashboard/DashboardPanel';
import { getDashboard, listDashboards, updateDashboardAccess } from '../../restapi/widgetBuilder';
import { getGroups } from '../../restapi/user';
import { useCurrentUser, canEditDashboardAccess } from '../../auth/currentUser';
import DashboardBuilderPopup from './dashboardbuilder/DashboardBuilderPopup';
import { useDashboardBuilderStore } from './dashboardbuilder/store/dashboardBuilderStore';
import WidgetBuilderPopup from './widgetbuilder/WidgetBuilderPopup';
import {
  DASHBOARD_LIST_CHANGED_EVENT,
  notifyDashboardListChanged,
} from './core/dashboardEvents';
import DashboardViewer, { ViewerWidget } from './viewer/DashboardViewer';
import { normalizeDashboardWidgets } from './viewer/widgetNormalize';

const MENU_CD = 'USR_DASHBOARD';
```

- [ ] **Step 2: 추출된 함수/상수 본문 전부 삭제 (line 73~367 영역)**

다음을 삭제 (모두 `viewer/widgetNormalize.js` 와 `viewer/DashboardViewer.jsx` 로 이동된 코드):
- `SALESBOARD_LAYOUT_BY_WIDGET_ID` (line 74~81)
- `SALESBOARD_WIDGET_IDS` (line 83)
- `getWidgetId` (line 89~91)
- `shouldNormalizeSalesBoardLayout` (line 93~112)
- `normalizeSalesBoardLayout` (line 114~130)
- `normalizeDashboardWidgets` (line 132~143)
- `toFiniteGridNumber` (line 145~148)
- `getWidgetGrid` (line 150~152)
- `getDashboardMaxRow` (line 154~163)
- `toReadOnlyLayoutItem` (line 165~194)
- `ViewerWidget` 함수 (line 196~259)
- `ReadOnlyDashboardGrid` 함수 (line 261~367)

**유지**:
- `MENU_CD = 'USR_DASHBOARD';` (line 72) — UserDashboardPage 가 직접 사용
- `getDashboardDescription` (line 85~87) — `DashboardListDialog` 만 쓰므로 그 파일 안에 남김

```jsx
// 삭제 후 line 72 의 MENU_CD 바로 다음에 line 369 의 AccessEditDialog 가 오도록
const MENU_CD = 'USR_DASHBOARD';

function getDashboardDescription(dashboard) {
  return dashboard?.descrip || dashboard?.description || '';
}

function AccessEditDialog({ open, onClose, dashboard, onSaved, availableGroups }) {
  // (기존 내용 그대로)
  ...
}
```

- [ ] **Step 3: 본문 WorkArea 의 `ReadOnlyDashboardGrid` 호출을 `DashboardViewer` 로 교체**

`UserDashboardPage.jsx:887~892` 의 다음 블록:

```jsx
{!showDashboardLoading && !dashboardError && hasSelectedDashboard && useStudioGridRenderer && (
  <ReadOnlyDashboardGrid
    widgets={dashboardWidgets}
    onMaximize={handleMaximizeWidget}
  />
)}
```

를 다음으로 교체:

```jsx
{!showDashboardLoading && !dashboardError && hasSelectedDashboard && useStudioGridRenderer && (
  <DashboardViewer
    widgets={dashboardWidgets}
    onMaximize={handleMaximizeWidget}
    maximizedWidget={maximizedWidget}
    onRestoreMaximize={handleRestoreWidget}
  />
)}
```

`!useStudioGridRenderer` 경로의 `DashboardPanel` 호출 블록 (line 894~914) 은 그대로 둔다.

> `handleGetWidgets` (line 701~712) 안의 `<ViewerWidget item={wc} onMaximize={handleMaximizeWidget} />` 는 그대로 동작 — 새 import 의 named export `ViewerWidget` 을 자동으로 사용. 변경 불필요.

- [ ] **Step 4: 검증 — 잔존 참조 0건 확인**

```bash
grep -n "ReadOnlyDashboardGrid\|SALESBOARD_\|shouldNormalizeSalesBoardLayout\|normalizeSalesBoardLayout\|toReadOnlyLayoutItem\|getDashboardMaxRow\|toFiniteGridNumber\|getWidgetGrid\|getWidgetId" frontend/src/view/util/t3dashboard/component/dashboardstudio/UserDashboardPage.jsx
```
Expected: **출력 없음** (`getDashboardDescription` 은 매칭 안 되므로 OK).

`normalizeDashboardWidgets` 와 `ViewerWidget` 호출은 남아있어야 함 (둘 다 import 로 해결됨):
```bash
grep -n "normalizeDashboardWidgets\|ViewerWidget" frontend/src/view/util/t3dashboard/component/dashboardstudio/UserDashboardPage.jsx
```
Expected: `normalizeDashboardWidgets` 2건 (line 688, 702), `ViewerWidget` 2건 (line 708 의 handleGetWidgets 내, line 933 의 maximized overlay).

- [ ] **Step 5: 검증 — 브라우저 렌더링 (기능 회귀 테스트)**

dev server (또는 docker compose 의 composer-frontend) 가 hot-reload 로 새 모듈을 컴파일했음을 확인 후 브라우저에서:

1. Composer 메뉴 → Dashboard 진입
2. 대시보드 목록 다이얼로그 열기 → 대시보드 1개 선택
3. 위젯 그리드가 **기존과 시각적으로 동일하게** 렌더링되는지 확인:
   - 위젯 위치·크기 동일
   - 각 위젯 우상단 ⤡ 아이콘 (최대화) 클릭 → 풀스크린 전환
   - 풀스크린 상태에서 ⤡ 아이콘 (복원) 클릭 → 원래대로
4. 대시보드 변경 (다른 항목 선택) → 정상 로드
5. (검증 대상이 있다면) SalesBoard 패턴 대시보드: 정규화된 레이아웃이 동일하게 적용되는지 확인

이상이 통과해야 Task 5 진행 가능. 문제 발생 시 잔존 참조·import 경로·default vs named export 확인.

---

## Task 5: UserDashboardPage.jsx — `mode` state 추가 + 헤더 재구성 + 모드 토글

이 task 가 실제 기능 추가 단계.

**Files:**
- Modify: `frontend/src/view/util/t3dashboard/component/dashboardstudio/UserDashboardPage.jsx`

- [ ] **Step 1: `useCanEditUser` import 추가**

기존 `useCurrentUser, canEditDashboardAccess` import 행 (line 52 자리) 을 다음으로 교체:

```jsx
import { useCurrentUser, useCanEditUser, canEditDashboardAccess } from '../../auth/currentUser';
```

- [ ] **Step 2: `mode` state + `canEditUser` 변수 추가**

`UserDashboardPage` 컴포넌트 함수 본문 시작부(현재 line 662 `useState(null)` 들이 모여있는 블록) 의 마지막 useState 다음에 추가. 다음 위치에 삽입 — `resetDashboardBuilder` / `addCanvasWidget` 줄 바로 위 (line 677 자리):

```jsx
const [mode, setMode] = useState('edit'); // 'edit' | 'viewer' — Composer 내부는 기본 편집 모드
const canEditUser = useCanEditUser();
```

- [ ] **Step 3: 헤더 JSX 재구성**

`UserDashboardPage.jsx:838~875` 의 헤더 Box 블록을 다음으로 교체. (Box 자체의 sx 속성은 유지하고 내부 children 만 재구성하면서 우측 토글을 위한 spacer 추가):

```jsx
<Box sx={{
  display: 'flex', alignItems: 'center', gap: 1,
  px: 1, py: 0.75,
  border: '1px solid rgba(124,167,224,0.30)',
  bgcolor: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  borderRadius: '8px',
  flex: '0 0 auto',
}}>
  {/* 공통부 — 모드 무관, 양쪽 모드 모두에서 노출 */}
  {hasSelectedDashboard && (
    <Typography
      noWrap
      sx={{
        maxWidth: 320,
        px: 1,
        fontSize: 13,
        fontWeight: 700,
        color: '#1e293b',
      }}
      title={selectedDashboard.title}
    >
      {selectedDashboard.title}
    </Typography>
  )}
  <Button size="small" variant="outlined" startIcon={<DashboardIcon fontSize="small" />}
          onClick={() => setDashboardListOpen(true)}>
    {transLangKey('대시보드 선택')}
  </Button>

  {/* 편집부 — edit 모드 + 편집 권한자만 노출 */}
  {mode === 'edit' && canEditUser && (
    <>
      <Button size="small" variant="outlined" startIcon={<EditIcon fontSize="small" />}
              onClick={handleWidgetBuilderClick}>
        {transLangKey('위젯 생성')}
      </Button>
      <Button size="small" variant="outlined" startIcon={<DashboardIcon fontSize="small" />}
              onClick={handleOpenDashboardBuilder}>
        {transLangKey('대시보드 생성')}
      </Button>
    </>
  )}

  {/* spacer */}
  <Box sx={{ flex: 1 }} />

  {/* 모드 토글 — 편집 권한자만 노출 */}
  {canEditUser && (
    <ToggleButtonGroup
      value={mode}
      exclusive
      size="small"
      onChange={(_, next) => { if (next) setMode(next); }}
      sx={{
        '& .MuiToggleButton-root': {
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'none',
          py: 0.25, px: 1,
        },
      }}
    >
      <ToggleButton value="edit">{transLangKey('편집')}</ToggleButton>
      <ToggleButton value="viewer">{transLangKey('뷰어')}</ToggleButton>
    </ToggleButtonGroup>
  )}
</Box>
```

> `ToggleButton`, `ToggleButtonGroup` 은 기존 import (line 30~31) 에 이미 포함되어 있으므로 추가 import 불필요.

- [ ] **Step 4: 검증 — 잔존 참조 + 신규 참조 확인**

```bash
grep -n "mode\|canEditUser\|ToggleButtonGroup" frontend/src/view/util/t3dashboard/component/dashboardstudio/UserDashboardPage.jsx | head -30
```
Expected: `const [mode, setMode] = useState('edit');` · `const canEditUser = useCanEditUser();` · 헤더 JSX 내 `{mode === 'edit' && canEditUser && ...}` · `{canEditUser && ...}` · `<ToggleButtonGroup value={mode}` 가 모두 포함되어야 함.

- [ ] **Step 5: 검증 — 브라우저 동작 확인 (수동 시나리오)**

dev server hot-reload 후:

1. **진입 시 기본 모드 = edit** — Composer → Dashboard 메뉴 진입 시 `[위젯 생성]` `[대시보드 생성]` 버튼 노출, 우측 토글이 `편집` 선택 상태.
2. **viewer 모드 전환** — 토글 `뷰어` 클릭 → `[위젯 생성]` `[대시보드 생성]` 즉시 사라짐. `[대시보드 선택]` 은 그대로 유지. 본문 위젯 그리드는 변화 없음.
3. **edit 모드 복귀** — 토글 `편집` 클릭 → 두 버튼 다시 노출.
4. **모드 유지 — 대시보드 변경** — viewer 모드에서 `[대시보드 선택]` → 다른 대시보드 선택 → 모드 그대로 viewer 유지. edit 모드에서도 동일하게 edit 유지.
5. **edit 모드의 빌더 진입** — edit 모드에서 `[대시보드 생성]` 클릭 → `DashboardBuilderPopup` 정상 열림 → 닫기 → 화면 복귀 후 모드 그대로 edit 유지.
6. **위젯 최대화 (양쪽 모드)** — edit / viewer 양쪽 모드에서 위젯 ⤡ 아이콘으로 최대화 / 복원 모두 정상 동작.
7. **대시보드 목록 다이얼로그의 `[권한 편집 ✎]`** — `[대시보드 선택]` → 다이얼로그 안에서 각 대시보드 옆 ✎ 아이콘이 기존처럼 노출 (`canEditDashboardAccess` 가드 그대로 유지) → 클릭 시 `AccessEditDialog` 정상 열림.
8. **메뉴 이탈 후 재진입** — Composer 메뉴 → 다른 메뉴(History 등) → Dashboard 로 돌아옴 → 모드가 `edit` 로 리셋되어 있는지 확인.

위 8개 시나리오가 모두 통과하면 Task 5 완료.

---

## Task 6: 최종 검증 + 사용자 승인 + commit

- [ ] **Step 1: ESLint / webpack 컴파일 에러 0건**

webpack dev server 의 stdout/log 에 에러 없음을 확인:
```bash
docker compose logs --tail 50 composer-frontend
```
Expected: `Compiled successfully` 또는 동등한 메시지. `Module not found`, `SyntaxError`, `is not defined` 등 0건.

- [ ] **Step 2: 변경 파일 git diff 요약 확인**

```bash
git status --short | grep -E "viewer/|currentUser\.js|UserDashboardPage\.jsx"
```
Expected: 다음 4개 라인 (M 또는 ??):
- `?? frontend/src/view/util/t3dashboard/component/dashboardstudio/viewer/widgetNormalize.js` (신규)
- `?? frontend/src/view/util/t3dashboard/component/dashboardstudio/viewer/DashboardViewer.jsx` (신규)
- ` M frontend/src/view/util/t3dashboard/auth/currentUser.js` (수정)
- `MM frontend/src/view/util/t3dashboard/component/dashboardstudio/UserDashboardPage.jsx` (수정)

```bash
git diff --stat frontend/src/view/util/t3dashboard/auth/currentUser.js frontend/src/view/util/t3dashboard/component/dashboardstudio/UserDashboardPage.jsx
```
Expected: `UserDashboardPage.jsx` 가 약 295 줄 감소(추출), 30~40 줄 증가(헤더 재구성), `currentUser.js` 가 약 17 줄 증가.

- [ ] **Step 3: Task 5 Step 5 의 8개 시나리오 재확인**

각 시나리오 pass / fail 을 한 줄씩 기록 (콘솔 로그나 노트):
```
1. 진입 시 기본 모드 = edit: PASS
2. viewer 모드 전환: ...
...
```

전부 PASS 여야 다음 step.

- [ ] **Step 4: 사용자에게 변경 요약 보고 + commit 승인 요청**

다음 형식으로 사용자에게 보고:

```
Dashboard viewer mode toggle 구현 완료.

변경 파일 4개:
- viewer/widgetNormalize.js (신규, ~140줄)
- viewer/DashboardViewer.jsx (신규, ~190줄)
- auth/currentUser.js (canEditUser/useCanEditUser 추가, +17줄)
- UserDashboardPage.jsx (추출 -295줄, 헤더 재구성/모드 토글 +~40줄)

검증 시나리오 8개 모두 통과 (모드 토글, 대시보드 선택, 최대화, 빌더 진입, 모드 유지 등).

commit 해도 될까요?
```

사용자가 승인하면 다음 Step. 거절하면 추가 수정 후 다시 보고.

- [ ] **Step 5: (사용자 승인 시) commit 1건 생성**

```bash
git add frontend/src/view/util/t3dashboard/component/dashboardstudio/viewer/widgetNormalize.js \
        frontend/src/view/util/t3dashboard/component/dashboardstudio/viewer/DashboardViewer.jsx \
        frontend/src/view/util/t3dashboard/auth/currentUser.js \
        frontend/src/view/util/t3dashboard/component/dashboardstudio/UserDashboardPage.jsx

git commit -m "$(cat <<'EOF'
feat(t3dashboard): viewer 모드 토글 + 공통 viewer 컴포넌트 추출

- DashboardViewer.jsx / widgetNormalize.js 신규 — ReadOnlyDashboardGrid 와
  위젯 정규화 유틸을 viewer/ 폴더로 추출. 향후 일반 사용자 화면 재사용 자산.
- UserDashboardPage 에 mode state (기본 edit) + 헤더 우측 모드 토글 추가.
  viewer 모드에서는 [위젯 생성]·[대시보드 생성] 버튼만 사라짐 (본문 변화 없음).
- auth/currentUser.js 에 canEditUser/useCanEditUser 추가 — 사용자 단위 전역
  편집 권한. ENABLE_AUTH=false 환경에서는 항상 true.

Spec: docs/superpowers/specs/2026-06-08-dashboard-viewer-mode-toggle-design.md

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6: commit 결과 확인**

```bash
git log --oneline -1
git status --short
```
Expected: 새 commit 한 줄 + working tree 의 다른 변경 파일들은 그대로 유지.

---

## 작업 완료 후

Spec 의 후속 작업 (이번 스코프 밖) 은 별도 plan 으로 진행:
- 일반 사용자용 별도 메뉴/화면 신설
- 공통 조회 API 권한 필터링 확인
- `ENABLE_AUTH=true` 활성화 + `useCanEditUser` 의 실제 role 체크 구현

이번 산출물 (`DashboardViewer` 컴포넌트) 이 위 후속 작업의 핵심 자산이다.

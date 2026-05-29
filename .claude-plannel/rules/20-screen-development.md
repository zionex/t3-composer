# 20. PlanNEL 화면 개발 골격 규칙

> 본 문서 = **파일 배치 · 라우팅 · 메뉴 등록 · i18n 키 등록** 만.
> 컴포넌트 코드 표면(AG-Grid · MUI · Redux · 서비스 호출)은 `21-components.md` 가 단일 진실.

---

## 1. 결정 플로우

```
요구사항
  ↓
화면 유형 식별 (마스터 CRUD · 조회 리포트 · 설정 입력 · 대시보드)
  ↓
도메인 결정 — lv1 소속 모듈 (e.g. INVENTORY_PLAN · DATA_MANAGEMENT · ...)
  ↓
유사 원본 화면 Read → 복제 + 변경분만 수정
  ↓
페이지 파일 생성 (src/pages/<domain>/<ScreenName>.js)
  ↓
TabMenuList.js lv3 항목 추가 (lv1 · lv2 가 없으면 먼저 추가)
  ↓
i18n 키 6개 언어 JSON 에 모두 추가
  ↓
(라우트 코드 변경 없음 — 비즈니스 화면은 모두 /scm 탭 체계로 동작)
```

---

## 2. 파일 배치 규칙 (강제)

### 2.1 페이지 파일 위치

```
saas-web/src/pages/<domain-kebab-case>/<PascalCase>.js
```

| ✅ 예 | ❌ 금지 |
|---|---|
| `src/pages/inventory-plan/IpSettings.js` | `src/pages/inventoryPlan/IpSettings.js` (camel 폴더) |
| `src/pages/data-management/LocationMaster.js` | `src/pages/DataManagement/LocationMaster.js` (Pascal 폴더) |
| `src/pages/demand-plan/DpForecast.js` | `src/pages/dp/DpForecast.js` (약어 폴더) |

규칙:
- 폴더명: **kebab-case** (소문자 + 하이픈)
- 파일명: **PascalCase.js** (`.jsx` 금지 — 기존 코드베이스 전체 `.js`)
- 서브 카테고리가 필요하면 한 단계 더 : `src/pages/<domain>/<category>/<PascalCase>.js`

### 2.2 관련 파일 위치 규약

| 종류 | 위치 |
|---|---|
| 페이지 컴포넌트 | `src/pages/<domain>/[<category>/]<Name>.js` |
| 재사용 컴포넌트 | `src/components/<domain>/<ComponentName>.js` |
| 서비스(API 호출) | `src/services/<domain>/ServiceName.js` |
| Redux 슬라이스 | `src/redux/<domain>/sliceName.js` |
| 공통 유틸리티 | `src/utils/<utilName>.js` |

---

## 3. 라우팅 등록

### 3.1 핵심 원칙 — 비즈니스 화면에 신규 `<Route>` 추가 불필요

`App.js` 의 라우트 구조:

```jsx
// App.js (발췌)
<Routes>
  <Route path={RouteList.Home.path} element={<Home />} />
  <Route path={RouteList.SCM.path} element={<TabsWith data={showedTabsInfo} ... />} />
  <Route path={RouteList.Help.path} element={<HelpPage />} />
  {/* 시스템 경로만 여기 등록 */}
</Routes>
```

`RouteList.SCM.path = "/scm"` 아래에 **모든 비즈니스 화면이 탭 체계로 렌더**된다.
`TabsWith` 는 `showedTabsInfo` (열린 탭 목록) 를 받아 각 탭의 `component` JSX 를 표시한다.

### 3.2 새 비즈니스 화면 추가 시 라우트 파일 수정 금지

| ❌ 하지 말 것 | ✅ 해야 할 것 |
|---|---|
| `App.js` 에 `<Route path="/scm/my-screen" ...>` 추가 | `TabMenuList.js` 의 lv3 에 항목 추가만 |
| `routeList.js` 에 새 경로 상수 추가 | — |
| lazy import 설정 | — (static import 만 사용) |

### 3.3 시스템/인증 경로 추가 시 (비즈니스 화면이 아닌 경우)

로그인·도움말·관리자 전용처럼 `/scm` 바깥에 독립 경로가 필요한 경우에만:
1. `src/routeList.js` 에 상수 추가
2. `App.js` `<Routes>` 에 `<Route>` 추가 (static import 사용)

---

## 4. 메뉴 등록 — TabMenuList.js

`saas-web/src/pages/TabMenuList.js` 가 **모든 비즈니스 화면 메뉴의 단일 진실 저장소**.
DB 등록 없이 이 파일만 수정하면 사이드바 · 탭 · 권한 체크가 모두 동작한다.

### 4.1 3단계 메뉴 계층

```
lv1 (사이드바 최상위 그룹)
  └── lv2 (서브 그룹)
        └── lv3 (실제 화면 — component JSX 포함)
```

### 4.2 lv1MenuList — 최상위 그룹 (신규 추가 드문 경우)

```js
const lv1MenuList = {
  INVENTORY_PLAN: {
    key: 2,                              // 정수, 사이드바 정렬
    reduxKey: "INVENTORY_PLAN",          // Redux 네임스페이스
    title: "inventoryPlan",              // i18n 키 (menu 섹션)
    icon: <WarehouseIcon fontSize="large" />,
    sideBarMenu: true,
    appRoles: ["ROLE_APP_IP"],           // 앱 수준 역할
    userRoles: ["ROLE_ADMIN", "ROLE_IP_MGR", "ROLE_IP_USER", "ROLE_GUEST"],
  },
  // ...
};
```

### 4.3 lv2MenuList — 서브 그룹

`lv1MenuList` 의 키를 그대로 사용한다.

```js
const lv2MenuList = {
  INVENTORY_PLAN: [
    {
      reduxKey: "SUBMENU_IP_SETTINGS",   // lv3 조회 키
      menuCd: "SUBMENU_IP_SETTINGS",     // findLv3Menu 에서 사용
      menuTitle: "menuSettings",         // i18n 키
      icon: <InputIcon />,
      userRoles: ["ROLE_ADMIN", "ROLE_IP_MGR"],
    },
    {
      reduxKey: "IP_PLAN",
      menuCd: "IP_PLAN",
      menuTitle: "menuPlan",
      icon: <AppRegistrationIcon />,
      userRoles: ["ROLE_ADMIN", "ROLE_IP_MGR", "ROLE_IP_USER"],
    },
  ],
  // ...
};
```

### 4.4 lv3MenuList — 실제 화면 항목 (신규 화면 시 필수 추가)

`lv2MenuList` 의 `menuCd` 를 키로 사용한다.

```js
const lv3MenuList = {
  SUBMENU_IP_SETTINGS: [
    {
      key: 1000,                              // 정수, 탭 정렬
      reduxKey: "IP_SETTINGS",               // Redux 뷰 상태 격리 키
      title: "menuIpSettings",               // i18n 키 (표시명)
      icon: <LeafIcon />,
      userRoles: ["ROLE_ADMIN", "ROLE_IP_MGR"],
      component: (                           // ★ JSX 직접 삽입
        <IpSettings
          viewName={"IP_SETTINGS"}           // ★ reduxKey 와 동일값
          title="menuIpSettings"             // ★ i18n 키
        />
      ),
    },
  ],
  // ...
};
```

### 4.5 신규 화면 추가 절차

```
1. 파일 상단에 static import 추가
   import MyNewScreen from "./domain/MyNewScreen";

2. 소속 lv2 의 lv3MenuList 배열에 항목 추가:
   {
     key: <다음 정수>,
     reduxKey: "MY_NEW_SCREEN",       ← 전체에서 유니크한 대문자 상수
     title: "menuMyNewScreen",         ← i18n 키 (§5 에서 등록)
     icon: <적절한 MUI Icon />,
     userRoles: [필요 역할],
     component: (
       <MyNewScreen
         viewName={"MY_NEW_SCREEN"}
         title="menuMyNewScreen"
       />
     ),
   }

3. lv2 그룹이 없으면 lv2MenuList 에도 추가 (lv1 소속 확인)
4. lv1 그룹 자체가 없으면 lv1MenuList + lv2MenuList + lv3MenuList 모두 추가
```

### 4.6 주의사항

- `key` 는 전체 lv3 에서 유니크한 정수 — 기존 최댓값 + 10 권장
- `reduxKey` 는 전체에서 유니크한 UPPER_SNAKE_CASE 문자열
- `viewName` prop 은 항상 해당 항목의 `reduxKey` 와 동일한 값
- `component` JSX 는 static import 된 컴포넌트만 사용 (dynamic import / lazy 금지)

---

## 5. i18n 키 등록

### 5.1 6개 언어 파일 모두 필수

```
saas-web/src/assets/data/l10n/
├── translation.en-us.json
├── translation.ja-jp.json
├── translation.ko-kr.json
├── translation.vi-vn.json
├── translation.zh-cn.json
└── translation.zh-tw.json
```

**6개 언어 파일에 모두 추가**하지 않으면 해당 언어 사용자 화면에서 키 문자열 그대로 노출된다.

### 5.2 키 위치 — `"menu"` 섹션 내 flat camelCase

```json
{
  "menu": {
    "menuMyNewScreen": "내 새 화면",
    "menuIpSettings": "재고계획 설정",
    ...
  },
  "grid": { ... },
  "msg": { ... }
}
```

- 키 형식: `menu` + 화면 의미의 PascalCase → 전체 camelCase (예: `menuMyNewScreen`)
- `keySeparator: false` 설정이므로 점 표기 금지 — `t("menuMyNewScreen")` 으로 직접 호출

### 5.3 i18n 키 사용 패턴

```js
// 컴포넌트 props 로 전달 (TabMenuList component: JSX 에서)
<MyNewScreen title="menuMyNewScreen" viewName={"MY_NEW_SCREEN"} />

// 페이지 컴포넌트 내부
const MyNewScreen = ({ t, viewName, title }) => {
  return (
    <div>
      <h1>{t(title)}</h1>           {/* t("menuMyNewScreen") → "내 새 화면" */}
    </div>
  );
};
```

### 5.4 언어별 예시 (`menuMyNewScreen`)

| 파일 | 값 |
|---|---|
| `ko-kr.json` | `"menuMyNewScreen": "내 새 화면"` |
| `en-us.json` | `"menuMyNewScreen": "My New Screen"` |
| `ja-jp.json` | `"menuMyNewScreen": "新しい画面"` |
| `zh-cn.json` | `"menuMyNewScreen": "新屏幕"` |
| `zh-tw.json` | `"menuMyNewScreen": "新畫面"` |
| `vi-vn.json` | `"menuMyNewScreen": "Màn hình mới"` |

---

## 6. 필수 표준 페이지 구조

### 6.1 페이지 컴포넌트 골격

```js
import { useState, useEffect, useRef } from "react";
import { withTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import reduxUtil from "@plannel/utils/redux-util";
// MUI 컴포넌트
import { Box, Button } from "@mui/material";
// 서비스
import myDomainService from "../../services/my-domain/myDomainService";

const MyNewScreen = ({ t, viewName, title }) => {
  // Redux 뷰 상태 — viewName 으로 격리
  const reduxViewState = reduxUtil.getViewState(viewName);
  const reduxDispatch = useDispatch();

  // 로컬 상태
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const gridRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await myDomainService.getList();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* 화면 내용 */}
    </Box>
  );
};

export default withTranslation()(MyNewScreen);
```

### 6.2 필수 규칙

- `export default withTranslation()(ComponentName)` — HOC 래핑 필수
- props `({ t, viewName, title })` — 3개 모두 선언
- `reduxUtil.getViewState(viewName)` 으로 뷰 상태 격리
- 파일 확장자 `.js` / 컴포넌트명 PascalCase (파일명 일치)

AG-Grid 사용 상세 → `21-components.md §3`.

---

## 7. 체크리스트 (배포 전 최종 점검)

- [ ] 페이지 파일 경로: `src/pages/<domain-kebab-case>/<PascalCase>.js`
- [ ] 파일 확장자 `.js` (`.jsx` 아님)
- [ ] `TabMenuList.js` static import 추가
- [ ] lv3 항목: `key` 유니크 정수 · `reduxKey` 유니크 UPPER_SNAKE · `viewName = reduxKey`
- [ ] lv2 · lv1 그룹 존재 확인 (없으면 먼저 추가)
- [ ] 6개 언어 JSON 모두 `"menu"` 섹션에 flat camelCase 키 추가
- [ ] `export default withTranslation()(ComponentName)` HOC 래핑
- [ ] props `({ t, viewName, title })` 선언
- [ ] `App.js` / `routeList.js` 수정 없음 (비즈니스 화면 불필요)

---

## 8. Anti-patterns

| ❌ | ✅ | 결과 |
|---|---|---|
| `src/pages/InventoryPlan/IpSettings.js` (Pascal 폴더) | `src/pages/inventory-plan/IpSettings.js` | 파일 탐색 규약 위반 |
| `IpSettings.jsx` (jsx 확장자) | `IpSettings.js` | 기존 코드베이스 불일치 |
| `export default IpSettings` (HOC 없이) | `export default withTranslation()(IpSettings)` | `t` prop undefined |
| `({ t, viewName })` (title 누락) | `({ t, viewName, title })` | title undefined |
| TabMenuList 에서 dynamic/lazy import | static import 만 | 탭 전환 시 컴포넌트 미로드 |
| `App.js` 에 `<Route path="/scm/my-screen">` 추가 | TabMenuList lv3 에만 추가 | 라우트 충돌 |
| `"menu.myScreen"` (점 구분 키) | `"menuMyScreen"` (flat camelCase) | `keySeparator:false` 로 키 미매칭 |
| ko-kr 만 번역 키 추가 | 6개 언어 파일 모두 추가 | 타 언어 사용자에게 키 raw 노출 |
| `reduxKey` ≠ `viewName` 값 | 동일한 문자열 | Redux 뷰 상태 격리 실패 |
| lv3 `key` 중복 정수 | 전체 최댓값 + 10 | 탭 식별 충돌 |

---

## 관련 문서

- 컴포넌트 코드 표면: `21-components.md` (AG-Grid · MUI · Redux · 서비스 호출 · i18next 훅)
- 데이터 접근: `30-data-access.md`
- 멀티테넌시: `31-multi-tenancy.md`
- 보안: `32-security.md`
- 안티패턴: `99-anti-patterns.md`

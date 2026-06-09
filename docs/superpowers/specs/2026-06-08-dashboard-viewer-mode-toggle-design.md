# Dashboard Viewer Mode Toggle — Design

**Date:** 2026-06-08
**Author:** Inhye Kim
**Status:** Approved — ready for implementation planning

---

## 1. 목표

`T3Dashboard` 화면 안에서 **편집 모드 / 뷰어 모드** 토글을 도입한다. 편집자가 자신이 만든 대시보드를 "사용자가 볼 때 어떻게 보일지" 그 자리에서 확인할 수 있게 한다.

동시에, 향후 일반 사용자용 별도 뷰어 화면을 추가하는 작업을 단순화하기 위해 **읽기 전용 그리드 렌더링을 공통 viewer 컴포넌트로 추출**한다. 이번 작업의 뷰어 모드와 미래의 일반 사용자 화면이 같은 컴포넌트를 공유한다.

**성공 기준:**
- T3Dashboard 진입 시 기본 모드는 `edit`. 컨설턴트는 평소처럼 편집 가능.
- 헤더 우측의 토글로 즉시 `viewer` 모드 전환 → 헤더의 편집 액션이 사라지고 위젯만 보이는 화면.
- 다시 토글로 `edit` 모드 복귀.
- 추출된 `DashboardViewer` 컴포넌트가 미래의 일반 사용자 화면에서 그대로 재사용 가능.

---

## 2. 배경

### 2.1 현재 상태

`UserDashboardPage.jsx` (989줄) 한 파일에 다음이 섞여 있다:

| 책임 | 위치 |
|---|---|
| 헤더 (대시보드 선택, 위젯/대시보드 생성 버튼) | line 838~875 |
| 읽기 전용 그리드 렌더링 (`ReadOnlyDashboardGrid`) | line 261~367 |
| 개별 위젯 카드 (`ViewerWidget`) | line 196~259 |
| 위젯 정규화 유틸 (`normalizeDashboardWidgets`, `getDashboardMaxRow` 등) | line 83~163 |
| 관리용 다이얼로그 (`AccessEditDialog`, `DashboardListDialog`) | line 369~668 |
| 메인 페이지 컨테이너 (대시보드 로딩, 상태 관리) | line 670~989 |

빌더는 이미 `DashboardBuilderPopup.jsx` (모달) 로 분리되어 있다. 따라서 메인 화면은 사실상 **뷰어 + 관리 헤더** 구조다.

### 2.2 로드맵 문서와의 관계

`component/dashboardstudio/doc/T3Dashboard_빌더_화면_설계_로드맵.md` 는 다음 방향을 적어둔 상태다:

- `T3Dashboard` = 컨설턴트용 빌더/관리 화면 (모든 대시보드 편집 가능)
- 일반 사용자 화면 = 별도 (권한에 맞는 대시보드만 읽기 전용)
- 두 화면은 **분리**, 공통 viewer 컴포넌트로 추출해서 공유

이번 작업은 그 최종 그림으로 가는 **단계적 접근**이다:

- **이번** — T3Dashboard 안에 뷰어/편집 모드 토글 추가. 공통 viewer 컴포넌트 추출.
- **다음 (별도 작업)** — 인증이 실제로 켜질 때, 일반 사용자용 별도 메뉴/화면을 추가하고 공통 viewer 를 재사용. T3Dashboard 의 뷰어 모드는 그대로 두거나 (편집자가 미리보기 용도로) 제거.

### 2.3 권한 모델

T3Dashboard 의 권한은 **사용자 단위 전역** 으로 정의한다 — 편집자라면 자신이 만들지 않은 대시보드도 편집 가능. 이는 로드맵 §3 "빌더 화면 안에서는 created_by 를 기준으로 수정 가능 여부를 제한하지 않는다" 와 일치.

다만 destructive 한 액션 한 가지는 예외:

- `[권한 편집 ✎]` (대시보드 공개범위 변경) — `canEditDashboardAccess(dashboard)` 의 *작성자 단위* 판정을 그대로 유지. 컨설턴트가 다른 컨설턴트의 대시보드 공개범위를 임의로 바꿀 수 없게 보호.

현재는 `ENABLE_AUTH = false` 이므로 두 판정 모두 항상 `true` 를 반환한다. 미래에 인증이 켜질 때 위 규칙이 발효된다.

---

## 3. 결정 사항 요약

| 항목 | 결정 |
|---|---|
| 구조 | T3Dashboard 한 화면 안에서 모드 토글 (분리하지 않음) |
| 기본 모드 | `edit` (Composer 내부는 모두 편집자라는 전제) |
| 모드 상태 저장 | `useState` (메모리). 세션·메뉴 이탈 시 리셋. URL/localStorage 불사용. |
| 모드 유지 정책 | 대시보드를 다른 것으로 전환해도 모드 유지 |
| 권한 모델 | 사용자 단위 전역 (편집자면 모든 대시보드 편집 가능) |
| 토글 노출 조건 | `canEditUser(currentUser)` — 현재는 항상 true |
| `[권한 편집 ✎]` 가드 | 기존 `canEditDashboardAccess(dashboard)` 유지 (작성자 단위, destructive 보호) |
| 공통 viewer 추출 | 이번 작업에 포함 (`DashboardViewer.jsx` 신규) |
| 위젯 정규화 유틸 추출 | 이번 작업에 포함 (`widgetNormalize.js` 신규) |
| 모달 빌더/위젯 빌더 | 변경 없음 |

---

## 4. 변경 후 파일 구조

```
component/dashboardstudio/
├── UserDashboardPage.jsx           ← 헤더 + 모드 토글 + 컨테이너 (크게 줄어듦, ~500줄 예상)
├── viewer/                          ← 신규 폴더
│   ├── DashboardViewer.jsx         ← ReadOnlyDashboardGrid + ViewerWidget 묶음
│   └── widgetNormalize.js          ← normalize* 유틸 함수들
├── dashboardbuilder/                ← 변화 없음
├── widgetbuilder/                   ← 변화 없음
├── core/                            ← 변화 없음
├── generic/                         ← 변화 없음
└── ...
```

**옮겨가는 것:**

| 원래 위치 | 새 위치 | 비고 |
|---|---|---|
| `UserDashboardPage.jsx` 내부 `ReadOnlyDashboardGrid` 함수 | `viewer/DashboardViewer.jsx` 의 default export | 헤더 없는 순수 그리드 렌더러 |
| `UserDashboardPage.jsx` 내부 `ViewerWidget` 함수 | `viewer/DashboardViewer.jsx` 안 (모듈 private) | DashboardViewer 가 사용 |
| `normalizeDashboardWidgets`, `normalizeSalesBoardLayout`, `getDashboardMaxRow`, `toReadOnlyLayoutItem`, `toFiniteGridNumber`, `getWidgetGrid`, `shouldNormalizeSalesBoardLayout`, `getWidgetId` | `viewer/widgetNormalize.js` | 순수 유틸 모듈 |
| `SALESBOARD_LAYOUT_BY_WIDGET_ID`, `SALESBOARD_WIDGET_IDS` 상수 | `viewer/widgetNormalize.js` | 동반 이동 |

**그대로 남는 것:**

- `UserDashboardPage.jsx` — 헤더 JSX, 모드 state, 대시보드 로딩 흐름, 대시보드 목록·접근권한 다이얼로그, 모달 빌더 호출
- 모든 다른 dashboardstudio 파일

---

## 5. DashboardViewer 컴포넌트 인터페이스

```jsx
// viewer/DashboardViewer.jsx
export default function DashboardViewer({
  widgets,                // (Array) 정규화된 위젯 배열 — normalizeDashboardWidgets 가 이미 적용된 형태
  onMaximize,             // (widget) => void — 위젯 최대화 요청 콜백. 없으면 최대화 아이콘 미노출.
  maximizedWidget,        // (Object|null) 현재 최대화된 위젯. null 이면 일반 그리드 렌더링.
  onRestoreMaximize,      // () => void — 최대화 복원 콜백. maximizedWidget 이 있을 때만 호출됨.
}) { ... }
```

**책임:**
- 위젯 배열을 받아 react-grid-layout 기반 읽기 전용 그리드 렌더링
- 컨테이너 크기 측정 → rowHeight 동적 계산 → 필요 시 세로 스크롤
- 최대화 토글 (옵션)
- `isDraggable={false}`, `isResizable={false}` 고정 — 모드 무관

**의도적으로 제외:**
- 대시보드 메타데이터 로딩 (부모 책임)
- 대시보드 선택·전환 UI
- 편집 진입점 — 어떤 형태의 편집 버튼도 노출하지 않음 (미래 일반 사용자 화면에서 안전하게 재사용 가능)

이 인터페이스는 **나중 일반 사용자 화면에서도 그대로 사용**한다. 일반 사용자 화면은 자신의 권한 필터링 + 대시보드 선택 UI 만 추가하면 된다.

---

## 6. UserDashboardPage 헤더 변경

### 6.1 변경 후 헤더 JSX 구조

```jsx
<HeaderBar>
  {/* 공통부 — 모드 무관 */}
  {hasSelectedDashboard && <Title>{selectedDashboard.title}</Title>}
  <Button>대시보드 선택</Button>

  {/* 편집부 — edit 모드 + 사용자 권한자만 */}
  {mode === 'edit' && canEditUser && (
    <>
      <Button onClick={handleWidgetBuilderClick}>위젯 생성</Button>
      <Button onClick={handleOpenDashboardBuilder}>대시보드 생성</Button>
    </>
  )}

  <Spacer />

  {/* 토글 — 사용자 권한자만 */}
  {canEditUser && (
    <ToggleButtonGroup
      value={mode}
      exclusive
      onChange={(_, next) => next && setMode(next)}
      size="small"
    >
      <ToggleButton value="edit">편집</ToggleButton>
      <ToggleButton value="viewer">뷰어</ToggleButton>
    </ToggleButtonGroup>
  )}
</HeaderBar>
```

### 6.2 본문 (WorkArea) 변경

본문은 `DashboardViewer` 호출로 단순화:

```jsx
<WorkArea>
  {showDashboardLoading && <Loading />}
  {dashboardError && <Alert>{dashboardError}</Alert>}
  {hasSelectedDashboard && useStudioGridRenderer && (
    <DashboardViewer
      widgets={dashboardWidgets}
      onMaximize={handleMaximizeWidget}
      maximizedWidget={maximizedWidget}
      onRestoreMaximize={handleRestoreWidget}
    />
  )}
  {hasSelectedDashboard && !useStudioGridRenderer && (
    <DashboardPanel ... />   // 기존 호출 그대로 유지
  )}
  {!dashboardId && <EmptyState />}
</WorkArea>
```

본문은 **모드와 무관하게 동일**. 모드 차이는 헤더에만 반영된다 — 위젯 그리드는 원래도 읽기 전용이었기 때문.

`useStudioGridRenderer` 분기는 기존 코드 그대로 유지한다. 이번 추출 범위는 `useStudioGridRenderer === true` 경로의 `ReadOnlyDashboardGrid` 만이다. `false` 경로의 `DashboardPanel` 호출은 그대로 둔다 (§11 참조).

### 6.3 권한 체크 함수

`auth/currentUser.js` 에 다음을 추가:

```js
/** 편집 액션(위젯/대시보드 생성, 모드 토글) 권한 — 사용자 단위 전역 */
export function canEditUser() {
  if (!ENABLE_AUTH) return true;
  // TODO: ENABLE_AUTH=true 시 role/permission 체크
  return false;
}

export function useCanEditUser() {
  return canEditUser();
}
```

`canEditDashboardAccess(dashboard)` 는 그대로 둔다 — `[권한 편집 ✎]` 아이콘이 계속 이걸 사용.

---

## 7. 모드 동작 상세

### 7.1 진입

- 진입 시 항상 `mode = 'edit'`
- `canEditUser()` 가 false 면 토글이 노출되지 않으므로 사용자는 영구히 `edit` 모드에 있지만 편집부 헤더가 안 보임 → 실질적으로 뷰어

### 7.2 토글 전환

- `edit → viewer`: 편집부 버튼 사라짐. 본문 그대로.
- `viewer → edit`: 편집부 버튼 다시 노출. 본문 그대로.

### 7.3 대시보드 전환 시 모드 유지

`handleSelect` 등 대시보드 변경 핸들러는 `mode` 를 건드리지 않는다. 편집자가 여러 대시보드를 연속 편집할 때 자연스러움.

### 7.4 모달 빌더 동작

- 편집 모드에서 `[위젯 생성]` / `[대시보드 생성]` 클릭 → 기존 모달 그대로 열림
- 뷰어 모드에서는 해당 버튼이 없으므로 모달 진입 경로가 없음
- 모달 자체 코드는 변경 없음

### 7.5 위젯 최대화

- 모드와 무관하게 위젯 우상단 `[OpenInFull]` 아이콘으로 최대화 가능
- 뷰어 모드에서도 동일하게 동작 — 위젯 본문은 늘 인터랙티브

---

## 8. 변경 파일 목록

| 파일 | 작업 | 비고 |
|---|---|---|
| `UserDashboardPage.jsx` | 수정 | 헤더 JSX 재구성, `mode` state 추가, `ReadOnlyDashboardGrid`/`ViewerWidget`/`normalize*` 들 제거 (viewer 모듈로 이동), `DashboardViewer` import 후 본문에서 호출 |
| `viewer/DashboardViewer.jsx` | 신규 | `ReadOnlyDashboardGrid` + `ViewerWidget` 묶음 |
| `viewer/widgetNormalize.js` | 신규 | 정규화 유틸 함수 + 상수 |
| `auth/currentUser.js` | 수정 | `canEditUser()` / `useCanEditUser()` export 추가 |

**변경 없는 영역:**
- `DashboardBuilderPopup.jsx` 및 하위
- `WidgetBuilderPopup.jsx` 및 하위
- `core/`, `generic/`, `types/`, `widgetbuilder/`, `restapi/` 등
- `T3Dashboard.jsx` (UserDashboardPage 를 그대로 호출)

---

## 9. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|---|---|
| 1 | 메뉴 진입 (개발 환경, `ENABLE_AUTH=false`) | `edit` 모드, 토글 노출, `[위젯 생성]`·`[대시보드 생성]` 노출 |
| 2 | 토글로 `viewer` 클릭 | 편집부 버튼 즉시 사라짐. 위젯 그리드는 그대로. |
| 3 | 다시 `edit` 클릭 | 편집부 복귀 |
| 4 | `edit` 모드에서 `[대시보드 생성]` 클릭 | `DashboardBuilderPopup` 정상 열림 |
| 5 | `viewer` 모드에서 다른 대시보드로 전환 | 모드는 `viewer` 유지. 새 대시보드 정상 로드. |
| 6 | `edit` 모드에서 다른 대시보드로 전환 | 모드는 `edit` 유지 |
| 7 | 위젯 최대화 (양쪽 모드) | 정상 작동 |
| 8 | 메뉴 이탈 후 재진입 | `edit` 모드로 리셋 |
| 9 | 미래 `ENABLE_AUTH=true` + `canEditUser=false` 가정 | 토글·편집부 모두 미노출. 사용자는 `edit` state 라도 시각적으로 뷰어. |
| 10 | `[권한 편집 ✎]` (대시보드 목록 다이얼로그 안) | 기존 `canEditDashboardAccess` 가드 그대로 동작 |
| 11 | 추출 후 회귀: `ReadOnlyDashboardGrid` 의 SalesBoard 정규화 케이스 | `widgetNormalize.js` 에서 동일하게 처리됨을 확인 |
| 12 | 추출 후 회귀: 그리드 스크롤 / rowHeight 계산 / ResizeObserver | 기존 동작 보존 |

---

## 10. 후속 작업 (이번 스코프 밖)

로드맵에 명시된 다음 단계는 **별도 작업**으로 진행한다:

1. **일반 사용자용 별도 메뉴/화면 신설** — App.jsx 의 메뉴 항목 추가 또는 라우팅 분기. 진입 시 권한 기반 대시보드 목록 필터링.
2. **공통 조회 API 권한 필터링 확인** — 서버 또는 공통 API 가 `public/group/private` 정책을 보장하는지 점검.
3. **인증 활성화** (`ENABLE_AUTH=true`) — `auth/currentUser.js` 의 실제 사용자/그룹 조회 연동.
4. **T3Dashboard 의 뷰어 모드 운명 결정** — 인증 켜진 뒤 일반 사용자 화면이 본격적으로 쓰이면, T3Dashboard 의 뷰어 모드는 (a) 미리보기 용도로 유지 (b) 제거 중 결정.

이번 작업의 산출물(특히 `DashboardViewer` 컴포넌트)은 위 후속 작업의 핵심 자산이다.

---

## 11. 미해결 / 리스크

| 항목 | 리스크 | 대응 |
|---|---|---|
| `useCanEditUser` 의 hook 형태 vs 함수 형태 | 컴포넌트 외부에서도 호출할 수 있도록 둘 다 export | `canEditUser()` 함수 + `useCanEditUser()` hook 모두 제공 |
| `DashboardViewer` 가 `maximizedWidget` 상태를 부모가 갖는지 자체가 갖는지 | 양쪽 다 가능, 첫 추출에서는 **부모가 보유 → prop 으로 주입** (기존 UserDashboardPage 동작과 동일) | 인터페이스에 `maximizedWidget`, `onRestoreMaximize` 포함 |
| `useStudioGridRenderer` (기존 코드의 분기 플래그) | 어느 쪽 경로로 `DashboardViewer` 가 매핑되는지 명확히 해야 함 | 추출 단계에서 `useStudioGridRenderer` 가 true 인 경로의 `ReadOnlyDashboardGrid` 만 이동. false 경로의 `DashboardPanel` 호출은 UserDashboardPage 에 그대로 둠. 두 경로 통합은 별도 검토. |
| 정규화 유틸 중 SalesBoard 전용 분기 | 도메인 특화 — 일반 viewer 에 묶기에 어색할 수 있음 | 일단 같이 이동. 추후 필요 시 widgetNormalize 안에서 별도 함수로 분리. |

# 공용 레이아웃·컴포넌트 인벤토리

> 화면 구성에 사용하는 공용 래퍼, 그리드, 차트, 상태 스토어, 팝업을 정리. 신규 화면 작성 시 이 인벤토리에서 필요한 것을 골라 사용.

## 1. 최상위 레이아웃 래퍼

`@wingui/common/imports` 경유로 import.

| 컴포넌트 | 역할 | 비고 |
|---------|-----|------|
| `ContentInner` | 화면 최상위 컨테이너 | flex column, overflow 처리 |
| `SearchArea` | 조회 조건 영역 | 접거나 좌측 고정 가능 |
| `SearchRow` | 조회 조건 한 행 | `SearchArea` 자식 |
| `WorkArea` | 메인 작업 영역 (그리드/차트) | `flex: 1` |
| `ResultArea` | 결과 전용 영역 | 일부 화면에서만 사용 |
| `StatusArea` | 하단 상태 메시지 | 선택적 |
| `ButtonArea` | 버튼 묶음 컨테이너 | |
| `LeftButtonArea` | 좌측 정렬 버튼 | |
| `RightButtonArea` | 우측 정렬 버튼 | |

## 2. 레이아웃 분할

| 컴포넌트 | 패키지 | 역할 |
|---------|-------|------|
| `SplitPanel` | `@zionex/wingui-core` | 수평/수직 리사이저블 분할. props: `sizes`, `minSize` |
| `VLayoutBox` | `@zionex/wingui-core` | 수직 flex 박스 |
| `TabContainer` | `@zionex/wingui-core/component/TabContainer` | 탭 컨테이너. `tabValue` state 로 제어 |

## 3. 입력 필드

### 3.1 범용
| 컴포넌트 | 지원 타입 |
|---------|----------|
| `InputField` | `text` · `number` · `select` · `multiSelect` · `autocomplete` · `dateRange` · `datetime` · `check` · `radio` · `popover` · `textarea` · `time` |

`react-hook-form` 의 `control` prop 으로 연결. `useForm()` 에서 `control`, `getValues`, `setValue`, `watch`, `handleSubmit` 추출.

### 3.2 SCM 도메인 특화
| 컴포넌트 | 용도 | 주 사용 모듈 |
|---------|-----|-------------|
| `PlanScope` | 플랜 스코프 선택 | MP/RP/FP/BF |
| `LocationMultiSearchBox` | 거점 복수 선택 | MP/RP/FP |
| `ItemMultiSearchBox` | 품목 복수 선택 | 전체 |
| `ItemSearchInput` | 품목 단건 검색 | DP/BF |
| `AccountSearchInput` | 거래처 단건 검색 | DP/BF |
| `ResourceMultiSearchBox` | 리소스 복수 선택 | MP/FP |
| `UserInputField` | 사용자 선택 | 공통 |

## 4. 그리드

| 컴포넌트 | 경로 | 역할 |
|---------|------|------|
| `BaseGrid` | `@wingui/common/imports` | RealGrid2 래퍼, **표준 그리드** |
| `TreeGrid` | `@zionex/wingui-core/component/grid/TreeGrid` | 계층형 트리 그리드 |
| `GridCnt` | `@wingui/common/imports` | 행 수 카운터 |
| `PivotTable` | `@zionex/wingui-core/component/dstable/PivotTable` | D/M/P/V 컬럼 타입 피벗 |

### 4.1 그리드 공용 버튼
모두 `@wingui/common/imports` 에서 import.

- `GridAddRowButton` — 행 추가
- `GridDeleteRowButton` / `GridDelRowButton` — 행 삭제 (두 별칭 혼용)
- `GridSaveButton` — 저장
- `GridExcelExportButton` — 엑셀 다운로드
- `GridExcelImportButton` — 엑셀 업로드
- `LargeExcelDownload` — 대용량 엑셀 다운로드

### 4.2 그리드 컬럼 정의 규약

```jsx
// 컴포넌트 함수 밖에 선언 (리렌더 시 재생성 방지)
let gridItems = [
  { name: 'ID', fieldName: 'ID', header: 'ID', dataType: 'text', width: 80 },
  { name: 'NAME', fieldName: 'NAME', header: '이름', dataType: 'text', width: 200 },
  // 시간 버킷 동적 컬럼:
  {
    iteration: { prefix: 'DATE_', delimiter: '-' },
    name: 'DATE_{idx}', fieldName: 'DATE_{idx}',
    header: '{idx}', dataType: 'number', width: 100,
  },
];
```

## 5. 차트

| 컴포넌트 | 경로 | 용도 |
|---------|------|------|
| `ChartComponent` | `@zionex/wingui-core/component/chart/ChartComponent` | 공용 Chart.js 래퍼 |
| `Line`, `Bar`, `Chart`, `PolarArea` | `react-chartjs-2` | 직접 사용 시 |
| `EqualizerBarChart` | `src/component/chart/EqualizerBarChart.jsx` | 커스텀 이퀄라이저 바 |
| `GanttChart` | `@zionex/wingui-core/component/gantt/GanttChart` | 간트 차트 |

### 차트 상태 관리
- `chart.current.data.datasets` 갱신 후 `chart.current.update()`
- 강제 리마운트: `chartKey` state 증가 → `<Chart key={chartKey} ...>`

## 6. 다이어그램·특수 컴포넌트

| 컴포넌트 | 경로 | 역할 |
|---------|------|------|
| `FLODiagram` | `@zionex/wingui-core/component/workflow/component/FLODiagram` | BOM/공급망 그래프 (ReactFlow) |
| `WidgetFlowDiagram` | `@zionex/wingui-core` | 편집 가능 워크플로 캔버스 |
| `DashboardPanel` | `@zionex/wingui-core/component/dashboard/DashboardPanel` | react-grid-layout 위젯 캔버스 |
| `ZEditor` | `@zionex/wingui-core` | TUI Editor WYSIWYG 래퍼 |
| `MyGoogleMap` | `@zionex/wingui-core` | Google Maps 래퍼 |

## 7. 상태·스토어 (Zustand)

| 스토어 | 경로 | 역할 |
|--------|------|------|
| `useViewStore` | `@wingui/common/store/viewStore` | 뷰별 상태: `globalButtons`, 그리드 ref 등 |
| `useUserStore` | `@wingui/common/store/userStore` | 로그인 사용자 정보 |
| `useContentStore` | `@wingui/common/store/contentStore` | `activeViewId` 등 콘텐츠 전역 상태 |
| `useMenuStore` | `@wingui/common/store/menuStore` | 메뉴 경로, `AUTO_LOAD` 등 뷰 옵션 |
| `useDashboardStore` | `view/factoryplan/dashboard/...` | 대시보드 공유 데이터 (FP/SNop 전용) |
| `useInsightSystemStore` | Insight AI 연동 | AI 분석 데이터 프로바이더 등록 |

### 상단 글로벌 버튼 등록 패턴
```jsx
useEffect(() => {
  setViewInfo(activeViewId, 'globalButtons', [
    { code: 'search', visible: true, disable: false, action: handleSearch },
    { code: 'save',   visible: true, disable: false, action: handleSave   },
  ]);
}, [activeViewId, grid1 /* 그리드 객체 준비된 후 등록 */]);
```

## 8. 공통 팝업

`src/view/common/` 에 위치. 검색·선택·설정 용도로 재사용.

### 8.1 개인화·설정
- `PopPersonalize` — 그리드 컬럼 개인화 저장/복원
- `PopPersonalizeDp` — DP 전용 개인화 (측정 항목 토글)
- `PopKpiWeightConfig` — KPI 가중치 설정
- `PopLogout` — 로그아웃 확인

### 8.2 단건 선택
- `PopSelectItem` — 품목 선택
- `PopSelectAccount` — 거래처 선택
- `PopSelectLvlAndAcct` — 판매레벨 + 거래처 선택
- `PopSelectLvlAndItem` — 품목레벨 + 품목 선택
- `PopLocatMst` — 거점 마스터 선택
- `PopLocatTp` — 거점 유형 선택

### 8.3 복수 선택
- `PopItemMulti`
- `PopAccountMulti`
- `PopResourceMulti`
- `PopRouteMulti`
- `PopLocatTpMulti`

### 8.4 시뮬레이션·버전
- `PopSimulationVersion` — 시뮬레이션 버전 선택
- `SimulationAiPanel` — 시뮬레이션 AI 패널

### 8.5 기타
- `LogPopup` — 로그 뷰어
- `LlmMarkdown` — LLM 결과 마크다운 렌더
- `IconPicker` — 아이콘 선택

## 9. 공통 유틸·서비스

| 유틸 | 용도 |
|-----|------|
| `callService(serviceId, paramMap)` | 엔진 API 호출 (`@wingui/common/imports`) |
| `showMessage(title, message, callbacks)` | 확인 다이얼로그 |
| `useMessage()` | 메시지 출력 훅 |
| `loadRecentSimulationVersion()` | 최근 시뮬레이션 버전 로딩 |
| `setHeaderColor(gridObj, colorMap)` | 그리드 헤더 색상 설정 |
| `TidyTreeUtil` | 트리 → 노드/엣지 변환 (FLO Diagram) |
| `getLayoutedElements` | FLO Diagram 레이아웃 계산 |

## 10. 폼 처리

```jsx
const { control, getValues, setValue, watch, handleSubmit, reset } = useForm({
  defaultValues: { name: '', itemType: '' },
});

<InputField control={control} name="name" type="text" label="이름" />
<InputField control={control} name="itemType" type="select" options={itemTypes} />
```

## 11. 모듈 간 차이점

### 필수 컴포넌트
- **모든 화면**: `ContentInner`
- **조회 화면**: `SearchArea` + `SearchRow` + `InputField`
- **CRUD 화면**: `BaseGrid` + `Grid*Button`

### 모듈별 특이 사용
| 모듈 | 자주 쓰는 컴포넌트 |
|------|------------------|
| BF | `ItemSearchInput`, `AccountSearchInput`, `ChartComponent` (정확도·트렌드) |
| DP | `PlanScope`, `PopPersonalizeDp`, 크로스탭 그리드 |
| MP | `PlanScope`, `LocationMultiSearchBox`, `GanttChart` |
| FP | `ActivitySearch`, `GanttChart`, `FLODiagram`, `ChartComponent` |
| IM | `LocationMap` (Leaflet), `ChartComponent` (ABC/XYZ) |
| RP | `PlanScope`, 크로스탭 그리드, 재고 차트 |
| SA | `PivotTable`, 유연 리포트, 대시보드 |
| SNop | `DashboardPanel`, `MyGoogleMap`, 회의 문서 |
| System | `BaseGrid` + `TreeGrid` (메뉴/권한 트리) |

## 12. 임포트 규약

### 자주 쓰는 import 블록
```jsx
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';

// 공용 래퍼/그리드/버튼
import {
  ContentInner, SearchArea, SearchRow, WorkArea,
  ButtonArea, LeftButtonArea, RightButtonArea,
  InputField, BaseGrid, GridCnt,
  GridAddRowButton, GridDeleteRowButton, GridSaveButton, GridExcelExportButton,
  callService, showMessage, useMessage,
} from '@wingui/common/imports';

// 스토어
import { useViewStore } from '@wingui/common/store/viewStore';
import { useContentStore } from '@wingui/common/store/contentStore';

// 필요 시
import { SplitPanel, TabContainer } from '@zionex/wingui-core';
import ChartComponent from '@zionex/wingui-core/component/chart/ChartComponent';
```

### 그리드 컬럼 정의는 컴포넌트 밖
```jsx
// ✅ 리렌더 시 재생성 방지
let gridItems = [ /* ... */ ];

function MyScreen() {
  // ...
}
```

## 13. 네이밍 규약

| 대상 | 규약 | 예 |
|-----|-----|-----|
| 화면 폴더 | lowercase | `view/demandplan/master/saleshierarchy/` |
| 화면 파일 | PascalCase | `SalesHierarchy.jsx` |
| Base 래핑 | `Base<Name>.jsx` + `<Name>.jsx` | `BaseEntry.jsx` + `Entry.jsx` |
| 위젯 파일 | `view/<module>/widgets/<widget>/` | `view/baselineforecast/widgets/forecastaccuracy/` |
| 공통 팝업 | `Pop<Name>.jsx` | `PopSelectItem.jsx` |
| 그리드 객체 state | `grid1`, `grid2`, ... | (숫자 서픽스) |

## 14. 안티 패턴 (하지 말 것)

- ❌ **`ContentInner` 없이 화면 작성** — 레이아웃 깨짐
- ❌ **글로벌 버튼을 로컬 JSX 에 직접 렌더** — `setViewInfo` 로 프레임워크 위임
- ❌ **`gridItems` 를 컴포넌트 내부에 선언** — 매 렌더마다 재생성되어 그리드 초기화 반복
- ❌ **`BaseGrid.afterCreate` 전에 그리드 객체 접근** — undefined 에러
- ❌ **`use_yn`/status 무시하고 온톨로지 사용** — (→ [ontology-rule.md](../database/ontology-rule.md))
- ❌ **CRUD 가 아닌 분석 화면에 `GridAddRowButton` 노출** — UX 혼란
- ❌ **sample 폴더 코드를 그대로 프로덕션에 복사** — `setViewInfo`, AI 프로바이더 등록 등이 누락됨

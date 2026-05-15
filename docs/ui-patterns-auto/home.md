# home 모듈 — UI 패턴 카탈로그

> Phase 1 자동 분류 결과 (생성: `ui-patterns-gen.cjs`). 정정·보강 환영.

## 요약

| 항목 | 값 |
|---|---:|
| 총 화면 | 6 |
| 등록 메뉴 (UI_*) | 0 |
| 위젯 | 0 |
| 팝업 | 0 |
| Base 래퍼 | 0 |
| Sub-component | 0 |

### 레이아웃 카테고리 분포

| 카테고리 | 화면 수 |
|---|---:|
| 01 미분할 (단일) | 6 |

### 패턴 분포 (상위 10)

| 패턴 | 화면 수 |
|---|---:|
| 비표준 / 자유 폼 (`free_form`) | 5 |
| P01 위젯 대시보드 (`widget_dashboard`) | 1 |

---
## 화면별 상세

### 01 미분할 (단일) (6개)

#### Calendar

- 경로: `view/home/Calendar.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 호출: `task`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### CalendarPopup

- 경로: `view/home/CalendarPopup.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 호출: `task` · `task/delete`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### home

- 경로: `view/home.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### Home

- 경로: `view/home/Home.jsx`
- 패턴: **P01 위젯 대시보드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: DashboardPanel=1
- 컴포넌트: ContentInner:1, DashboardPanel:1
- SP: `SP_UI_SA_SALES_DP`
- 호출: `common/data`

```
┌──────────────────────────────┐
│ ┌──────┐┌──────┐┌──────┐    │
│ │ KPI 1││ KPI 2││ KPI 3│    │
│ └──────┘└──────┘└──────┘    │
│ ┌────────────┐┌────────────┐ │
│ │ Chart       ││ Grid       │ │
│ └────────────┘└────────────┘ │
└──────────────────────────────┘
```

#### NoticeDetails

- 경로: `view/home/NoticeDetails.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

#### NoticeList

- 경로: `view/home/NoticeList.jsx`
- 패턴: **비표준 / 자유 폼** (LAYOUT_SINGLE) · confidence: **low**
- 추정 근거: no recognized grid/chart/split components
- 호출: `noticeboard-home` · `noticeboard-file`

```
┌──────────────────────────────┐
│ (Free form / non-standard)   │
└──────────────────────────────┘
```

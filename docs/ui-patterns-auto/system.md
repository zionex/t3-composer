# system 모듈 — UI 패턴 카탈로그

> Phase 1 자동 분류 결과 (생성: `ui-patterns-gen.cjs`). 정정·보강 환영.

## 요약

| 항목 | 값 |
|---|---:|
| 총 화면 | 28 |
| 등록 메뉴 (UI_*) | 19 |
| 위젯 | 0 |
| 팝업 | 3 |
| Base 래퍼 | 0 |
| Sub-component | 0 |

### 레이아웃 카테고리 분포

| 카테고리 | 화면 수 |
|---|---:|
| 01 미분할 (단일) | 16 |
| 11 상하 2분할 | 6 |
| 13 상하 4분할 | 1 |
| 31 혼합·격자·특수 | 2 |
| — 팝업 | 3 |

### 패턴 분포 (상위 10)

| 패턴 | 화면 수 |
|---|---:|
| P02 검색 + 그리드 (마스터 CRUD) (`search_grid`) | 11 |
| v2 듀얼 그리드 2-stack (`v2_dual_grid`) | 6 |
| P02b 그리드 전용 (검색 없음) (`P02b_grid_only`) | 3 |
| 팝업 다이얼로그 (`popup`) | 3 |
| 혼합 분할 (`mix_split`) | 2 |
| P04 트리 그리드 (`h2_tree_grid`) | 1 |
| v4 멀티 그리드 4-stack (`v4_multi_grid`) | 1 |
| P03 검색 + 탭 그리드 (`search_tab`) | 1 |

---
## 화면별 상세

### 01 미분할 (단일) (16개)

#### AdminHistory

- 경로: `view/system/systemanalysis/adminhistory/AdminHistory.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, InputField:3
- 호출: `system/logs/admin-action`

```
┌──────────────────────────────┐
│ Search: id / nm / useYn      │
├──────────────────────────────┤
│ + Add  Delete  Save  Excel   │
│ ┌──────────────────────────┐ │
│ │ BaseGrid (N cols × N rows)│ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### EngineHistory

- 경로: `view/system/servermgmt/enginehistory/EngineHistory.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, InputField:3
- SP: `SP_UI_CM_LOG`
- 호출: `common/data`

```
┌──────────────────────────────┐
│ Search: id / nm / useYn      │
├──────────────────────────────┤
│ + Add  Delete  Save  Excel   │
│ ┌──────────────────────────┐ │
│ │ BaseGrid (N cols × N rows)│ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### JobScheduleMgmt

- 경로: `view/system/jobschedulemgmt/JobScheduleMgmt.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, InputField:1
- 호출: `engine/T3SeriesDataServer/InitializeJobSchedule` · `engine/T3SeriesDataServer/TerminateJobSchedule` · `engine/T3SeriesDataServer/PauseJob`

```
┌──────────────────────────────┐
│ Search: id / nm / useYn      │
├──────────────────────────────┤
│ + Add  Delete  Save  Excel   │
│ ┌──────────────────────────┐ │
│ │ BaseGrid (N cols × N rows)│ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### LoginHistory (`UI_AD_10`)

- 경로: `view/system/systemanalysis/loginhistory/LoginHistory.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, InputField:2
- 호출: `system/logs/system-access`

```
┌──────────────────────────────┐
│ Search: id / nm / useYn      │
├──────────────────────────────┤
│ + Add  Delete  Save  Excel   │
│ ┌──────────────────────────┐ │
│ │ BaseGrid (N cols × N rows)│ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### MenuBadge

- 경로: `view/system/systemconfig/menubadge/MenuBadge.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, …
- 호출: `system/menus/badges` · `system/menus/badges/general`

```
┌──────────────────────────────┐
│ Search: id / nm / useYn      │
├──────────────────────────────┤
│ + Add  Delete  Save  Excel   │
│ ┌──────────────────────────┐ │
│ │ BaseGrid (N cols × N rows)│ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### MenuMgmt (`UI_AD_MENU_MST`)

- 경로: `view/system/menumgmt/MenuMgmt.jsx`
- 패턴: **P04 트리 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TreeGrid=1
- 컴포넌트: ContentInner:1, WorkArea:1, TreeGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1
- 호출: `system/menus/delete` · `system/menus` · `system/menus?all-menus=true`

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│ ▼ Root                       │
│   ▼ Branch A                 │
│     • Leaf 1                 │
│     • Leaf 2                 │
│   ▶ Branch B                 │
└──────────────────────────────┘
```

#### Multilingual (`UI_AD_07`)

- 경로: `view/system/multilingual/Multilingual.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, …
- 호출: `system/lang-packs/delete` · `system/lang-packs` · `system/lang-packs/language-codes`

```
┌──────────────────────────────┐
│ Search: id / nm / useYn      │
├──────────────────────────────┤
│ + Add  Delete  Save  Excel   │
│ ┌──────────────────────────┐ │
│ │ BaseGrid (N cols × N rows)│ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### PlanScope (`UI_AD_PLAN_SCOPE`)

- 경로: `view/system/planscope/planscope/PlanScope.jsx`
- 패턴: **P03 검색 + 탭 그리드** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: TabContainer=1
- 컴포넌트: ContentInner:1, WorkArea:1, BaseGrid:3, TabContainer:1, GridAddRowButton:3, GridDeleteRowButton:2, GridSaveButton:3
- 호출: `common/planscope` · `common/planscope/modules` · `common/planscope/link`

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│ [ Tab1 ][ Tab2 ][ Tab3 ]     │
│ ┌──────────────────────────┐ │
│ │ BaseGrid / Chart          │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### PropertiesPanal

- 경로: `view/system/thememgmt/PropertiesPanal.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, InputField:2
- 호출: `system/themes/` · `system/themes/delete`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### SchedulerJobHistory (`UI_AD_SCHEDULER_JOB_HISTORY`)

- 경로: `view/system/schedulerjob/schedulerjobhistory/SchedulerJobHistory.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, InputField:3
- 호출: `/scheduler-history/histories` · `system/common/codes`

```
┌──────────────────────────────┐
│ Search: id / nm / useYn      │
├──────────────────────────────┤
│ + Add  Delete  Save  Excel   │
│ ┌──────────────────────────┐ │
│ │ BaseGrid (N cols × N rows)│ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### SchedulerJobMgmt (`UI_AD_SCHEDULER_JOB_MGMT`)

- 경로: `view/system/schedulerjob/schedulerjobmgmt/SchedulerJobMgmt.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: ContentInner:1, WorkArea:1, BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, InputField:5
- 호출: `scheduler-mgmt/jobs` · `scheduler-mgmt/synchronize` · `scheduler-mgmt/cron-check`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### ServerStatus (`UI_AD_15`)

- 경로: `view/system/servermgmt/serverstatus/ServerStatus.jsx`
- 패턴: **P02b 그리드 전용 (검색 없음)** (LAYOUT_SINGLE) · confidence: **mid**
- 추정 근거: 1 BaseGrid no SearchArea
- 컴포넌트: ContentInner:1, WorkArea:1, BaseGrid:1
- 호출: `engine/` · `system/server/server-status`

```
┌──────────────────────────────┐
│ ButtonArea                   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid                  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### ThemeMgmt (`UI_AD_THEME`)

- 경로: `view/system/thememgmt/ThemeMgmt.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, …
- 호출: `system/themes/` · `system/themes/delete`

```
┌──────────────────────────────┐
│ Search: id / nm / useYn      │
├──────────────────────────────┤
│ + Add  Delete  Save  Excel   │
│ ┌──────────────────────────┐ │
│ │ BaseGrid (N cols × N rows)│ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### TimeHistory

- 경로: `view/system/systemanalysis/timehistory/TimeHistory.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridExcelExportButton:1, InputField:4
- 호출: `system/logs/view-execution`

```
┌──────────────────────────────┐
│ Search: id / nm / useYn      │
├──────────────────────────────┤
│ + Add  Delete  Save  Excel   │
│ ┌──────────────────────────┐ │
│ │ BaseGrid (N cols × N rows)│ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### UserDelegation (`UI_AD_18`)

- 경로: `view/system/permission/userdelegation/UserDelegation.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, …
- 호출: `system/users/delegations/delete` · `system/users/delegations` · `system/users`

```
┌──────────────────────────────┐
│ Search: id / nm / useYn      │
├──────────────────────────────┤
│ + Add  Delete  Save  Excel   │
│ ┌──────────────────────────┐ │
│ │ BaseGrid (N cols × N rows)│ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### Users (`UI_AD_02`)

- 경로: `view/system/usermgmt/users/Users.jsx`
- 패턴: **P02 검색 + 그리드 (마스터 CRUD)** (LAYOUT_SINGLE) · confidence: **high**
- 추정 근거: SearchArea + 1 BaseGrid
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, …
- 호출: `system/users/delete` · `system/users/password-reset` · `system/users/login-unlock`

```
┌──────────────────────────────┐
│ Search: id / nm / useYn      │
├──────────────────────────────┤
│ + Add  Delete  Save  Excel   │
│ ┌──────────────────────────┐ │
│ │ BaseGrid (N cols × N rows)│ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### 11 상하 2분할 (6개)

#### GroupPermission (`UI_AD_04`)

- 경로: `view/system/permission/grouppermission/GroupPermission.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridSaveButton:1, InputField:1
- 호출: `system/groups/permissions` · `system/groups` · `system/groups/`

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid 1                │ │
│ ├──────────────────────────┤ │
│ │ BaseGrid 2                │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### PlanScopeUser (`UI_AD_PLAN_SCOPE_USER`)

- 경로: `view/system/planscope/planscopeuser/PlanScopeUser.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridSaveButton:1, InputField:3
- 호출: `system/users/planscope` · `system/users` · `system/users/`

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid 1                │ │
│ ├──────────────────────────┤ │
│ │ BaseGrid 2                │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### PlanScopeUserGroup (`UI_AD_PLAN_SCOPE_USER_GRP`)

- 경로: `view/system/planscope/planscopeusergroup/PlanScopeUserGroup.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridSaveButton:1, InputField:1
- 호출: `/system/groups/planscope` · `system/groups` · `system/groups/`

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid 1                │ │
│ ├──────────────────────────┤ │
│ │ BaseGrid 2                │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### Preference (`UI_AD_GROUP_PREF`)

- 경로: `view/system/systemconfig/preference/Preference.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridCnt:1, GridAddRowButton:2, GridDeleteRowButton:2, …
- SP: `SP_UI_AD_GRID_DEFAULT_PREF_COPY`
- 호출: `system/groups` · `system/common/code-name-maps` · `system/users/preference-masters/delete`

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid 1                │ │
│ ├──────────────────────────┤ │
│ │ BaseGrid 2                │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### UserGroup (`UI_AD_03`)

- 경로: `view/system/usermgmt/usergroup/UserGroup.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridAddRowButton:1, GridDeleteRowButton:2, GridSaveButton:2, …
- 호출: `system/groups` · `system/groups/` · `system/groups/delete`

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid 1                │ │
│ ├──────────────────────────┤ │
│ │ BaseGrid 2                │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

#### UserPermission (`UI_AD_05`)

- 경로: `view/system/permission/userpermission/UserPermission.jsx`
- 패턴: **v2 듀얼 그리드 2-stack** (LAYOUT_V2) · confidence: **mid**
- 추정 근거: 2 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, GridSaveButton:1, InputField:3
- 호출: `system/users/permissions` · `system/users` · `system/users/`

```
┌──────────────────────────────┐
│ Search                       │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ BaseGrid 1                │ │
│ ├──────────────────────────┤ │
│ │ BaseGrid 2                │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### 13 상하 4분할 (1개)

#### TotalPermission (`UI_AD_22`)

- 경로: `view/system/permission/totalpermission/TotalPermission.jsx`
- 패턴: **v4 멀티 그리드 4-stack** (LAYOUT_V4) · confidence: **mid**
- 추정 근거: 4 BaseGrid no SplitPanel
- 컴포넌트: ContentInner:1, WorkArea:1, BaseGrid:4
- 호출: `/system/users` · `/system/users/groups` · `/system/users/`

```
┌──────────────────────────────┐
│ ┌──┐┌──┐┌──┐┌──┐             │
│ │  ││  ││  ││  │ 4 stacked   │
│ │  ││  ││  ││  │ grids       │
│ └──┘└──┘└──┘└──┘             │
└──────────────────────────────┘
```

### 31 혼합·격자·특수 (2개)

#### CommonCode (`UI_AD_01`)

- 경로: `view/system/commoncode/CommonCode.jsx`
- 패턴: **혼합 분할** (LAYOUT_MIXED) · confidence: **mid**
- 추정 근거: splits=1 dirs=[unknown] tabs=0
- 컴포넌트: ContentInner:1, SearchArea:1, SearchRow:1, WorkArea:1, BaseGrid:2, SplitPanel:1, VLayoutBox:2, GridAddRowButton:2, …
- 호출: `system/common/`

```
┌──────────────────────────────┐
│ Search                       │
├──────────┬───────────────────┤
│ Tree     │ Top: Chart        │
│          ├───────────────────┤
│          │ Bottom: Grid      │
└──────────┴───────────────────┘
```

#### License (`UI_AD_06`)

- 경로: `view/system/servermgmt/license/License.jsx`
- 패턴: **혼합 분할** (LAYOUT_MIXED) · confidence: **mid**
- 추정 근거: splits=1 dirs=[unknown] tabs=0
- 컴포넌트: ContentInner:1, WorkArea:1, BaseGrid:2, SplitPanel:1
- 호출: `engine/LicenseServer/GetLicenseResultInfo` · `engine/LicenseServer/GetLicensePossessionInfo` · `engine/LicenseServer/GetServerLicenseInfo`

```
┌──────────────────────────────┐
│ Search                       │
├──────────┬───────────────────┤
│ Tree     │ Top: Chart        │
│          ├───────────────────┤
│          │ Bottom: Grid      │
└──────────┴───────────────────┘
```

### — 팝업 (3개)

#### PopColorPicker

- 경로: `view/system/thememgmt/PopColorPicker.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=0
- 컴포넌트: InputField:2, PopupDialog:1

```
╔══════════════════════════════╗
║  Popup Dialog (modal)        ║
╠══════════════════════════════╣
║ Search: code / name          ║
║ ┌──────────────────────────┐ ║
║ │ Selectable BaseGrid       │ ║
║ └──────────────────────────┘ ║
║  [ Confirm ] [ Cancel ]       ║
╚══════════════════════════════╝
```

#### PopPreferenceOptions

- 경로: `view/system/systemconfig/preference/PopPreferenceOptions.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: BaseGrid:1, GridAddRowButton:1, GridDeleteRowButton:1, GridSaveButton:1, PopupDialog:1
- 호출: `system/common/code-name-maps` · `system/users/preference-options` · `system/users/preference-options/delete`

```
╔══════════════════════════════╗
║  Popup Dialog (modal)        ║
╠══════════════════════════════╣
║ Search: code / name          ║
║ ┌──────────────────────────┐ ║
║ │ Selectable BaseGrid       │ ║
║ └──────────────────────────┘ ║
║  [ Confirm ] [ Cancel ]       ║
╚══════════════════════════════╝
```

#### PopSelectUser

- 경로: `view/system/usermgmt/usergroup/PopSelectUser.jsx`
- 패턴: **팝업 다이얼로그** (POPUP) · confidence: **high**
- 추정 근거: Pop* file · grid=1
- 컴포넌트: SearchArea:1, WorkArea:1, BaseGrid:1, InputField:2, PopupDialog:1
- 호출: `system/users/`

```
╔══════════════════════════════╗
║  Popup Dialog (modal)        ║
╠══════════════════════════════╣
║ Search: code / name          ║
║ ┌──────────────────────────┐ ║
║ │ Selectable BaseGrid       │ ║
║ └──────────────────────────┘ ║
║  [ Confirm ] [ Cancel ]       ║
╚══════════════════════════════╝
```

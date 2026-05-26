# PlaNEL Mockup Gallery — Design

> **Status**: Approved (2026-05-26)
> **Scope**: T3Composer 의 SCM UI Mockup 갤러리에 PlaNEL Product Line 카드 추가
> **First Round (R1)**: Data Management 7 mockup

## 1. 목적 / 배경

T3Composer 의 `[SCM UI Mockup]` 탭에서 PlaNEL 탭이 0건(placeholder) 상태. KTNG (27 mockup) 처럼 PLANNEL 의 운영 화면을 mockup 패턴으로 그룹화해 갤러리에 노출.

활용처:
- **Composer LLM 학습 / 디자인 시스템 문서화** — PLANNEL 의 실제 운영 화면 구조를 한눈에 확인
- **신규 화면 생성 시 참조** — `ModeNewGeneral` 의 SCM UI Mockup picker 에서 PlaNEL 패턴 선택 가능
- **메뉴 ↔ 패턴 lookup** — `_data/plannel-menu-mapping.json` 으로 운영 메뉴 → 적용 패턴 빠른 매핑

참조 사례: `index.js:209` 의 KTNG_ENTRIES 27개 + `_data/ktng-menu-mapping.json` 의 68 메뉴 매핑.

## 2. 전체 카탈로그 (라운드별)

PLANNEL `saas-web` 의 TabMenuList.js 분석 결과 **leaf 메뉴 약 130개**. 단계적 진행 — 도메인 단위로 끊어 라운드별 추가.

| Round | 도메인 | 메뉴 수 | Mockup 수 | 비율 |
|---|---|---|---|---|
| **R1 ★ (이번 작업)** | Data Management | 45 | **7** | 6.4:1 |
| R2 | Demand Plan | 20 | 8 | 2.5:1 |
| R3 | Replenishment Plan | 16 | 6 | 2.7:1 |
| R4 | Master Plan | 14 | 5 | 2.8:1 |
| R5 | Inventory Plan | 15 | 6 | 2.5:1 |
| R6 | System + AI | 10 | 5 | 2:1 |
| R7 | Dashboard + Data Load | 9 | 5 | 1.8:1 |
| | **합계** | **129** | **42** | **3.1:1** |

**전체 합계 ≈ 42 mockup** (옵션 A — PlaNEL 내부 중복 그대로 유지, 동일 패턴 통합 없음).

T3SmartSCM 의 기존 59 mockup 과 layout 이 유사하더라도 PlaNEL 은 **자체 mockup entry 를 별도로 생성** — 사용자 결정 (2026-05-26).

## 3. R1 (Data Management) 상세 — 7 Mockup

| # | patternCode | layoutCategory | menus | description |
|---|---|---|---|---|
| 1 | `plannel_dm_master_basic` | `LAYOUT_SINGLE` | **7** — Item / Customer / Site / Location / Workcenter / Resource / Supplier | 기본 마스터 CRUD — 단일 BaseGrid + 검색조건 + Add/Save/Delete 버튼 |
| 2 | `plannel_dm_hierarchy_tree` | `LAYOUT_H2` | **3** — HrchyConfig / ItemHrchyMaster / CustomerHrchyMaster | 좌측 계층 TreeGrid + 우측 디테일 폼. 계층 LV1~LV5 정의 |
| 3 | `plannel_dm_calendar_rate` | `LAYOUT_V2` | **4** — Calendar / CalendarGroup / ExchangeRate / UnitPrice | 상단 마스터 헤더 + 하단 기간별 매트릭스. 일자/주차 column iteration |
| 4 | `plannel_dm_relation_link` | `LAYOUT_H2` | **5** — CustomerItem / LocationItem / CustomerLocation / SupplierItemMaster / HrchyPermission | 좌측 부모 마스터 + 우측 연결 자식 cross. 선택 → 우측 적용 |
| 5 | `plannel_dm_bom_route` | `LAYOUT_ROUTELAYOUT` | **6** — BomMaster / BomDetail / Route / Routing / BodMaster / BodItem | BOM / 공정 라우트 다이어그램. FLODiagram 풍 트리 + 노드별 detail |
| 6 | `plannel_dm_planning_grid` | `LAYOUT_SINGLE` | **4** — SalesPlanMaster / FinancePlanMaster / PurchaseBudget / MaterialReceiptPlan | 시계열 매트릭스 입력. 좌측 고정 + 시간 버킷 피벗 + 직접 편집 |
| 7 | `plannel_dm_transaction_log` | `LAYOUT_SINGLE` | **8** — SalesTransaction / InventoryTransaction / ShipmentTransaction / ProdOrder / PurchaseOrderMaster / IntransitInventoryMaster / BfFeatureDate / BfFeatureSales | 대량 거래 로그 그리드. 필터 다중 + 페이지네이션 + 익스포트 |

**R1 합계**: 37 메뉴 매핑 / 7 mockup. 나머지 8개 메뉴 (Postn 등) 는 R2 이후 또는 미사용 메뉴 (data-load 영역은 R7).

> `_data/plannel-menu-mapping.json` 의 정확한 `menuId` / `menuNm` / `filePath` 는 R1 구현 진입 시 `TabMenuList.js` 의 import 경로 + 라벨에서 추출 (KTNG 사례 그대로).

## 4. 산출물 파일 배치

KTNG 의 `_ktng/` 디렉토리 패턴 그대로:

```
frontend/src/view/util/t3mockup/
├── _planel/                              ★ 신규
│   ├── dm_master_basic/DmMasterBasicMockup.jsx
│   ├── dm_hierarchy_tree/DmHierarchyTreeMockup.jsx
│   ├── dm_calendar_rate/DmCalendarRateMockup.jsx
│   ├── dm_relation_link/DmRelationLinkMockup.jsx
│   ├── dm_bom_route/DmBomRouteMockup.jsx
│   ├── dm_planning_grid/DmPlanningGridMockup.jsx
│   └── dm_transaction_log/DmTransactionLogMockup.jsx
├── _data/
│   └── plannel-menu-mapping.json         ★ 신규
└── index.js                              ★ 수정 (PLANEL_ENTRIES + mapping import)
```

## 5. 구현 표준

### 5.1 Mockup 컴포넌트 (KTNG 와 1:1 동일)

```jsx
import React from 'react';
import { Box, Stack, /* MUI */ } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MockShell from '../../_shared/MockShell';

const SAMPLE_ROWS = [ /* PlaNEL 도메인 더미 데이터 */ ];

export default function DmMasterBasicMockup() {
  return (
    <MockShell
      patternCode="plannel_dm_master_basic"
      patternLabel="PlaNEL — DM 기본 마스터 (Item/Customer/Site/Location/Workcenter/Resource/Supplier)"
      layoutCategory="LAYOUT_SINGLE"
      description="기본 마스터 CRUD — 단일 BaseGrid + 검색 + Add/Save/Delete"
    >
      {/* SearchArea + Toolbar + Grid (MUI Table 으로 흉내) */}
    </MockShell>
  );
}
```

**원칙**:
- 외부 의존성은 MUI + `MockShell` 뿐 (`@wingui/*` import 금지 — 갤러리는 격리)
- 더미 데이터는 **PlaNEL 도메인 색깔** (가전/디바이스/판매 시뮬레이션 등) — 도메인은 R1 mockup 별로 자유. 단 Item/Customer 등 일반 단어로 채워도 무방
- `layoutCategory` 는 정해진 token (`LAYOUT_SINGLE`/`LAYOUT_H2`/`LAYOUT_V2`/`LAYOUT_ROUTELAYOUT` 등) 만 사용

### 5.2 `plannel-menu-mapping.json` (KTNG schema 동일)

```json
{
  "_comment": "PLANNEL saas-web 의 화면 ~130개를 ~42 mockup 패턴으로 그룹화. 단계적 라운드 진행.",
  "stats": { "plannelMenus": 130, "mockupPatterns": 42, "currentRound": 1 },
  "mockupToMenus": {
    "plannel_dm_master_basic": [
      { "menuId": "DM_ITEM_MASTER",     "menuNm": "Item Master",     "filePath": "/data-management/ItemMaster" },
      /* ... */
    ],
    /* R1 의 7 mockup 모두 */
  }
}
```

`menuId` 는 PLANNEL 의 명시적 ID 가 없으므로 **`DM_<ComponentName upper-snake>`** 패턴으로 생성. `filePath` 는 TabMenuList.js 의 import 경로 그대로.

### 5.3 `index.js` 수정

기존 line 204 `PLANEL_ENTRIES = []` → 7개 entry 채움. line 315 `T3SMART_SCM_MOCKUP_TO_MENUS` 옆에 `PLANEL_MOCKUP_TO_MENUS` 추가. line 323 의 `menus: []` 를 `PLANEL_MOCKUP_TO_MENUS[e.patternCode] || []` 로 변경.

## 6. 검증 방법

- [ ] T3Mockup [SCM UI Mockup] 탭 → Product Line `PlaNEL` 클릭 → 7 mockup 카드 노출
- [ ] 각 카드 클릭 → mockup 본문 + `[사용 메뉴 N개]` 토글 펼침 → 매핑 메뉴 표
- [ ] 검색바에 "Item" / "Calendar" / "BOM" 등 메뉴명 검색 → 해당 mockup 매칭
- [ ] 카테고리 필터 `domain` → 7 mockup 모두 표시 (모두 category: 'domain')
- [ ] Layout 카테고리 필터 `LAYOUT_SINGLE` / `LAYOUT_H2` / `LAYOUT_V2` / `LAYOUT_ROUTELAYOUT` 각각 정확히 매칭
- [ ] hook `.claude/hooks/validators/t3mockup.sh` (M1~M4) 통과
- [ ] webpack-dev-server hot reload 시 컴파일 에러 없음

## 7. Out of Scope (이번 작업 외)

- R2 ~ R7 (DP / RP / MP / IP / System+AI / Dashboard+DataLoad) — 별도 라운드
- PlaNEL 의 [화면 실행] 동적 AI mockup 변환 (`tb_cmp_preview_mockup` 캐시) 과 무관 — 본 작업은 **정적 갤러리 entry** 만
- `T3SmartSCM` 또는 `KTNG` 기존 mockup 변경 — 절대 건드리지 않음
- PLANNEL backend (MyBatis SQL) 분석 — mockup 갤러리는 frontend 패턴만

## 8. Future Rounds (개요)

각 라운드는 별도 spec/plan 으로. 본 spec 는 R1 만 covers.

| Round | 주요 mockup 후보 (가제) |
|---|---|
| R2 (DP, 8) | dp_settings · dp_workbench · dp_review_process · dp_lifecycle · dp_sales_analysis · dp_forecast_accuracy · bf_leaderboard · scenario_comp_dp |
| R3 (RP, 6) | rp_settings · rp_network · run_rp_review · psi_simulation · fill_rate_exceptions · rp_analysis |
| R4 (MP, 5) | mp_settings · mp_constraints · run_mp_review · mp_exceptions · mrp_resource_analysis |
| R5 (IP, 6) | ip_settings · abc_xyz · target_inv_simulation · inv_overview · inv_trend · ip_evaluation |
| R6 (System+AI, 5) | system_admin · system_auth · system_scheduler · user_personalization · ai_recommend |
| R7 (Dashboard+DataLoad, 5) | integrated_dashboard · domain_dashboard (DP/IP/RP) · file_upload_wizard · data_validation · transform_history |

## 9. 핵심 결정 기록 (사용자 합의)

1. **2026-05-26** — KTNG 와 동일 접근, 전체 도메인 단계적 진행
2. **2026-05-26** — 첫 라운드 = Data Management
3. **2026-05-26** — 옵션 A (42 mockup, 동일 패턴 통합 없이 그대로) 채택
4. **2026-05-26** — T3SmartSCM 기존 mockup 과의 layout 동일성 무관, PlaNEL 자체 entry 별도 생성

## 10. 참조 파일

- `frontend/src/view/util/t3mockup/index.js` — 갤러리 메인 (수정 대상)
- `frontend/src/view/util/t3mockup/_ktng/mp_master_data/MpMasterDataMockup.jsx` — KTNG 참조 사례
- `frontend/src/view/util/t3mockup/_shared/MockShell.jsx` — 모든 mockup 의 wrapper
- `frontend/src/view/util/t3mockup/_data/ktng-menu-mapping.json` — KTNG mapping schema 참조
- `C:/vs_project/PLANNEL/saas-web/src/pages/TabMenuList.js` — PLANNEL 메뉴 트리 (분석 입력)
- `.claude/rules/50-composer-standalone-runtime.md §11` — T3Mockup 갤러리 운영 규약
- `.claude/hooks/validators/t3mockup.sh` — M1~M4 검증 hook

# PlaNEL Mockup Gallery — R1 (Data Management) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** T3Composer 의 `[SCM UI Mockup]` 갤러리에서 `PlaNEL (0)` 탭을 `PlaNEL (7)` 로 채우기 — Data Management 도메인 37개 메뉴를 7개 mockup 패턴으로 그룹화한 정적 갤러리 entry 추가.

**Architecture:** KTNG (`_ktng/`) 와 1:1 평행한 `_planel/` 디렉토리 + `_data/plannel-menu-mapping.json` + `index.js` 의 `PLANEL_ENTRIES` 배열 채우기. 각 mockup 은 `MockShell` wrap + MUI 컴포넌트만 사용. wingui 본 모듈에 무영향.

**Tech Stack:** React + MUI (@mui/material + @mui/icons-material) · webpack-dev-server hot reload (변경 시 자동 컴파일) · 검증 hook `.claude/hooks/validators/t3mockup.sh`

**Spec:** [docs/superpowers/specs/2026-05-26-plannel-mockups-design.md](../specs/2026-05-26-plannel-mockups-design.md)

---

## File Structure

**Create (9 files):**
- `frontend/src/view/util/t3mockup/_planel/plannel_dm_master_basic/DmMasterBasicMockup.jsx` — 기본 마스터 CRUD 7개
- `frontend/src/view/util/t3mockup/_planel/plannel_dm_hierarchy_tree/DmHierarchyTreeMockup.jsx` — 계층 트리 3개
- `frontend/src/view/util/t3mockup/_planel/plannel_dm_calendar_rate/DmCalendarRateMockup.jsx` — 시계열 마스터 4개
- `frontend/src/view/util/t3mockup/_planel/plannel_dm_relation_link/DmRelationLinkMockup.jsx` — 관계 마스터 5개
- `frontend/src/view/util/t3mockup/_planel/plannel_dm_bom_route/DmBomRouteMockup.jsx` — BOM/Route 6개
- `frontend/src/view/util/t3mockup/_planel/plannel_dm_planning_grid/DmPlanningGridMockup.jsx` — 시계열 입력 4개
- `frontend/src/view/util/t3mockup/_planel/plannel_dm_transaction_log/DmTransactionLogMockup.jsx` — 거래 로그 8개
- `frontend/src/view/util/t3mockup/_data/plannel-menu-mapping.json` — 7 mockup ↔ 37 메뉴 매핑

**Modify (1 file):**
- `frontend/src/view/util/t3mockup/index.js` — `PLANEL_ENTRIES` 7 entry 추가, `plannelMenuMappingJson` import + 매핑 적용 (line 14-19 영역에 import, line 204 영역에 entries, line 315 영역에 매핑 변수, line 323 영역에 mapping lookup)

**디렉토리명 = patternCode 1:1 일치 강제** — `.claude/hooks/validators/t3mockup.sh` M2 가 block. 따라서 모든 디렉토리에 `plannel_` 접두어 포함.

**Mockup JSX 표준 (모든 7개 공통):**
- 최상위: `<MockShell patternCode patternLabel layoutCategory description>` wrapping
- 외부 의존성: `@mui/material` + `@mui/icons-material` + `MockShell` 뿐 (`@wingui/*` 절대 금지)
- 인터랙션 없음 (static viewer) — onClick / state 사용 금지
- 더미 데이터는 mockup 안에 const 로 inline (M3 hook 은 warn 만이라 통과)
- import path: `'../../_shared/MockShell'` (KTNG 와 동일 — 2단계 위)

---

## Task 1: plannel-menu-mapping.json 생성

**Files:**
- Create: `frontend/src/view/util/t3mockup/_data/plannel-menu-mapping.json`

- [ ] **Step 1: JSON 파일 작성**

파일 `frontend/src/view/util/t3mockup/_data/plannel-menu-mapping.json` 을 다음 내용으로 생성:

```json
{
  "_comment": "PLANNEL saas-web 의 화면 ~130개를 ~42 mockup 패턴으로 그룹화. 단계적 라운드 진행 — 현재 R1 = Data Management 7 mockup. 추가 라운드 시 mockupToMenus 키 추가.",
  "stats": {
    "plannelMenus": 130,
    "mockupPatterns": 42,
    "currentRound": 1,
    "currentRoundMockups": 7,
    "currentRoundMenus": 37
  },

  "mockupToMenus": {

    "plannel_dm_master_basic": [
      { "menuId": "DM_ITEM_MASTER",       "menuNm": "Item Master",       "filePath": "/data-management/ItemMaster" },
      { "menuId": "DM_CUSTOMER_MASTER",   "menuNm": "Customer Master",   "filePath": "/data-management/CustomerMaster" },
      { "menuId": "DM_SITE_MASTER",       "menuNm": "Site Master",       "filePath": "/data-management/SiteMaster" },
      { "menuId": "DM_LOCATION_MASTER",   "menuNm": "Location Master",   "filePath": "/data-management/LocationMaster" },
      { "menuId": "DM_WORKCENTER_MASTER", "menuNm": "Workcenter Master", "filePath": "/data-management/WorkcenterMaster" },
      { "menuId": "DM_RESOURCE",          "menuNm": "Resource",          "filePath": "/data-management/Resource" },
      { "menuId": "DM_SUPPLIER_MASTER",   "menuNm": "Supplier Master",   "filePath": "/data-management/SupplierMaster" }
    ],

    "plannel_dm_hierarchy_tree": [
      { "menuId": "DM_HRCHY_CONFIG",        "menuNm": "Hierarchy Config",        "filePath": "/data-management/HrchyConfig" },
      { "menuId": "DM_ITEM_HRCHY_MASTER",   "menuNm": "Item Hierarchy Master",   "filePath": "/data-management/ItemHrchyMaster" },
      { "menuId": "DM_CUSTOMER_HRCHY",      "menuNm": "Customer Hierarchy Master","filePath": "/data-management/CustomerHrchyMaster" }
    ],

    "plannel_dm_calendar_rate": [
      { "menuId": "DM_CALENDAR_MASTER",       "menuNm": "Cycle Calendar Master",  "filePath": "/data-management/CycleCalendarMaster" },
      { "menuId": "DM_CALENDAR_GROUP_MASTER", "menuNm": "Calendar Group Master",  "filePath": "/data-management/CalendarGroupMaster" },
      { "menuId": "DM_EXCHANGE_RATE",         "menuNm": "Exchange Rate",          "filePath": "/data-management/ExchangeRate" },
      { "menuId": "DM_UNIT_PRICE",            "menuNm": "Unit Price",             "filePath": "/data-management/UnitPrice" }
    ],

    "plannel_dm_relation_link": [
      { "menuId": "DM_CUSTOMER_ITEM",        "menuNm": "Customer Item",            "filePath": "/data-management/CustomerItem" },
      { "menuId": "DM_LOCATION_ITEM",        "menuNm": "Location Item",            "filePath": "/data-management/LocationItem" },
      { "menuId": "DM_CUSTOMER_LOCATION",    "menuNm": "Customer Location",        "filePath": "/data-management/CustomerLocation" },
      { "menuId": "DM_SUPPLIER_ITEM_MASTER", "menuNm": "Supplier Item Master",     "filePath": "/data-management/SupplierItemMaster" },
      { "menuId": "DM_HRCHY_PERMISSION",     "menuNm": "Customer Hierarchy Permission", "filePath": "/data-management/HrchyPermission" }
    ],

    "plannel_dm_bom_route": [
      { "menuId": "DM_BOM_MASTER",  "menuNm": "BOM Master",  "filePath": "/data-management/BomMaster" },
      { "menuId": "DM_BOM_DETAIL",  "menuNm": "BOM Detail",  "filePath": "/data-management/BomDetail" },
      { "menuId": "DM_ROUTE",       "menuNm": "Route",       "filePath": "/data-management/Route" },
      { "menuId": "DM_ROUTING",     "menuNm": "Routing",     "filePath": "/data-management/ProdRouting" },
      { "menuId": "DM_BOD_MASTER",  "menuNm": "BOD Master",  "filePath": "/data-management/BodMaster" },
      { "menuId": "DM_BOD_ITEM",    "menuNm": "BOD Item",    "filePath": "/data-management/BodItem" }
    ],

    "plannel_dm_planning_grid": [
      { "menuId": "DM_SALES_PLAN_MASTER",      "menuNm": "Sales Plan Master",      "filePath": "/data-management/SalesPlanMaster" },
      { "menuId": "DM_FINANCE_PLAN_MASTER",    "menuNm": "Finance Plan Master",    "filePath": "/data-management/FinancePlanMaster" },
      { "menuId": "DM_PURCHASE_BUDGET",        "menuNm": "Purchase Budget",        "filePath": "/data-management/PurchaseBudget" },
      { "menuId": "DM_MATERIAL_RECEIPT_PLAN",  "menuNm": "Material Receipt Plan",  "filePath": "/data-management/MaterialReceiptPlan" }
    ],

    "plannel_dm_transaction_log": [
      { "menuId": "DM_SALES_TRANSACTION",     "menuNm": "Sales Transaction Master",     "filePath": "/data-management/SalesTransactionMaster" },
      { "menuId": "DM_INVENTORY_TRANSACTION", "menuNm": "Inventory Transaction Master", "filePath": "/data-management/InventoryTransactionMaster" },
      { "menuId": "DM_SHIPMENT_TRANSACTION",  "menuNm": "Shipment Transaction Master",  "filePath": "/data-management/ShipmentTransactionMaster" },
      { "menuId": "DM_PROD_ORDER",            "menuNm": "Production Order",             "filePath": "/data-management/ProdOrder" },
      { "menuId": "DM_PURCHASE_ORDER_MASTER", "menuNm": "Purchase Order Master",        "filePath": "/data-management/PurchaseOrderMaster" },
      { "menuId": "DM_INTRANSIT_INVENTORY",   "menuNm": "Intransit Inventory Master",   "filePath": "/data-management/IntransitInventoryMaster" },
      { "menuId": "DM_BF_FEATURE_DATE",       "menuNm": "BF Feature Date",              "filePath": "/data-management/BfFeatureDate" },
      { "menuId": "DM_BF_FEATURE_SALES",      "menuNm": "BF Feature Sales",             "filePath": "/data-management/BfFeatureSales" }
    ]

  }
}
```

- [ ] **Step 2: JSON 유효성 검증**

Run: `node -e "console.log(Object.keys(require('c:/vs_project/Composer/frontend/src/view/util/t3mockup/_data/plannel-menu-mapping.json').mockupToMenus).length)"`
Expected: `7`

---

## Task 2: DmMasterBasicMockup (LAYOUT_SINGLE — 기본 마스터 CRUD 7개)

**Files:**
- Create: `frontend/src/view/util/t3mockup/_planel/plannel_dm_master_basic/DmMasterBasicMockup.jsx`

- [ ] **Step 1: 디렉토리 + JSX 파일 작성**

파일 `frontend/src/view/util/t3mockup/_planel/plannel_dm_master_basic/DmMasterBasicMockup.jsx` 를 다음 내용으로 생성 (디렉토리도 함께 생성):

```jsx
import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, Checkbox } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import MockShell from '../../_shared/MockShell';

// PLANNEL DM 기본 마스터 — Item/Customer/Site/Location/Workcenter/Resource/Supplier 7개
// 공통 레이아웃: 검색조건 + 그리드 + 우측 toolbar (Add/Save/Delete)

const SAMPLE_ROWS = [
  { CD: 'ITM-A100', NM: 'LED Module 60W',      TYPE: 'FG',  UOM: 'EA', STATUS: 'ACTIVE',   USE_YN: 'Y' },
  { CD: 'ITM-A101', NM: 'LED Module 80W',      TYPE: 'FG',  UOM: 'EA', STATUS: 'ACTIVE',   USE_YN: 'Y' },
  { CD: 'ITM-B205', NM: 'PCB Board Rev.3',     TYPE: 'SF',  UOM: 'EA', STATUS: 'ACTIVE',   USE_YN: 'Y' },
  { CD: 'ITM-B206', NM: 'PCB Board Rev.4',     TYPE: 'SF',  UOM: 'EA', STATUS: 'PHASEOUT', USE_YN: 'Y' },
  { CD: 'ITM-C310', NM: 'Aluminum Heatsink',   TYPE: 'RM',  UOM: 'KG', STATUS: 'ACTIVE',   USE_YN: 'Y' },
  { CD: 'ITM-C311', NM: 'Copper Wire 1.5mm',   TYPE: 'RM',  UOM: 'KG', STATUS: 'ACTIVE',   USE_YN: 'Y' },
  { CD: 'ITM-D420', NM: 'Plastic Housing',     TYPE: 'RM',  UOM: 'EA', STATUS: 'ACTIVE',   USE_YN: 'N' },
  { CD: 'ITM-D421', NM: 'Glass Cover',         TYPE: 'RM',  UOM: 'EA', STATUS: 'ACTIVE',   USE_YN: 'Y' },
];

export default function DmMasterBasicMockup() {
  return (
    <MockShell
      patternCode="plannel_dm_master_basic"
      patternLabel="PlaNEL — DM 기본 마스터 (Item / Customer / Site / Location / Workcenter / Resource / Supplier)"
      layoutCategory="LAYOUT_SINGLE"
      description="기본 마스터 CRUD — 단일 BaseGrid + 검색조건 + Add/Save/Delete 버튼. 7개 마스터 공통 layout."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="코드" size="small" value="" placeholder="CD/NM 검색" sx={{ width: 200 }} />
          <TextField label="Type" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="FG">완제품 (FG)</MenuItem>
            <MenuItem value="SF">반제품 (SF)</MenuItem>
            <MenuItem value="RM">원자재 (RM)</MenuItem>
          </TextField>
          <TextField label="USE_YN" size="small" select value="Y" sx={{ width: 100 }}>
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="Y">사용</MenuItem>
            <MenuItem value="N">미사용</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
        <Tabs value={0}>
          <Tab label="Item Master" />
          <Tab label="Customer / Site / Location / Workcenter / Resource / Supplier" disabled />
        </Tabs>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={0.75} sx={{ pr: 1 }}>
          <Button size="small" startIcon={<AddIcon />}>추가</Button>
          <Button size="small" startIcon={<DeleteIcon />} color="error">삭제</Button>
          <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell padding="checkbox"><Checkbox size="small" /></TableCell>
              <TableCell sx={{ fontWeight: 700 }}>코드</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>명칭</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>UOM</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>USE_YN</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {SAMPLE_ROWS.map((r) => (
              <TableRow key={r.CD} hover>
                <TableCell padding="checkbox"><Checkbox size="small" /></TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{r.CD}</TableCell>
                <TableCell>{r.NM}</TableCell>
                <TableCell><Chip label={r.TYPE} size="small" variant="outlined" /></TableCell>
                <TableCell>{r.UOM}</TableCell>
                <TableCell>
                  <Chip label={r.STATUS} size="small"
                    color={r.STATUS === 'ACTIVE' ? 'success' : 'warning'} />
                </TableCell>
                <TableCell>{r.USE_YN}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </MockShell>
  );
}
```

- [ ] **Step 2: 컴파일 확인**

webpack-dev-server hot reload 시 콘솔 에러 없음 확인. 또는:

Run: `docker compose logs --tail 50 composer-frontend 2>&1 | grep -iE "error|fail|module not found" | head -5`
Expected: 출력 없음 (또는 무관한 warning만)

---

## Task 3: DmHierarchyTreeMockup (LAYOUT_H2 — 계층 트리 3개)

**Files:**
- Create: `frontend/src/view/util/t3mockup/_planel/plannel_dm_hierarchy_tree/DmHierarchyTreeMockup.jsx`

- [ ] **Step 1: 디렉토리 + JSX 파일 작성**

파일 `frontend/src/view/util/t3mockup/_planel/plannel_dm_hierarchy_tree/DmHierarchyTreeMockup.jsx`:

```jsx
import React from 'react';
import { Box, Stack, TextField, Button, Chip, Typography, Tabs, Tab,
  List, ListItem, ListItemText, IconButton, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MockShell from '../../_shared/MockShell';

// PLANNEL DM 계층 마스터 — HrchyConfig / ItemHrchy / CustomerHrchy 3개
// 좌측 계층 트리 + 우측 디테일 폼 (LV1~LV5 정의 → 노드 클릭 시 우측 속성)

const TREE_NODES = [
  { id: 'L1-FG',  label: '완제품 (LV1)',  level: 1, expanded: true, indent: 0 },
  { id: 'L2-LED', label: 'LED Lighting (LV2)', level: 2, expanded: true, indent: 1 },
  { id: 'L3-IDR', label: 'Indoor (LV3)',       level: 3, expanded: true, indent: 2 },
  { id: 'L4-OFF', label: 'Office (LV4)',       level: 4, expanded: false, indent: 3 },
  { id: 'L4-HOM', label: 'Home (LV4)',         level: 4, expanded: false, indent: 3 },
  { id: 'L3-ODR', label: 'Outdoor (LV3)',      level: 3, expanded: false, indent: 2 },
  { id: 'L2-IOT', label: 'IoT Device (LV2)',   level: 2, expanded: false, indent: 1 },
  { id: 'L1-SF',  label: '반제품 (LV1)',  level: 1, expanded: false, indent: 0 },
  { id: 'L1-RM',  label: '원자재 (LV1)',  level: 1, expanded: false, indent: 0 },
];

export default function DmHierarchyTreeMockup() {
  return (
    <MockShell
      patternCode="plannel_dm_hierarchy_tree"
      patternLabel="PlaNEL — DM 계층 마스터 (Hierarchy Config / Item Hierarchy / Customer Hierarchy)"
      layoutCategory="LAYOUT_H2"
      description="좌측 계층 TreeGrid + 우측 디테일 폼. LV1~LV5 정의 → 노드 클릭 시 우측 속성 편집."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="계층 검색" size="small" value="" placeholder="레벨/명칭" sx={{ width: 220 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Tabs value={0}>
            <Tab label="Item Hierarchy" />
            <Tab label="Customer Hierarchy" disabled />
            <Tab label="Hrchy Config" disabled />
          </Tabs>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 좌측 30% — Tree */}
        <Box sx={{ width: '32%', borderRight: '1px solid', borderColor: 'divider', overflow: 'auto' }}>
          <Stack direction="row" spacing={0.5} sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Button size="small" startIcon={<AddIcon />}>레벨 추가</Button>
            <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
          </Stack>
          <List dense disablePadding>
            {TREE_NODES.map((n, idx) => (
              <ListItem key={n.id} disablePadding sx={{
                pl: 1 + n.indent * 2,
                py: 0.5,
                backgroundColor: idx === 2 ? 'primary.50' : 'transparent',
                borderLeft: idx === 2 ? '3px solid' : '3px solid transparent',
                borderLeftColor: idx === 2 ? 'primary.main' : 'transparent',
              }}>
                <IconButton size="small" sx={{ p: 0.25 }}>
                  {n.expanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                </IconButton>
                <Chip label={`LV${n.level}`} size="small" variant="outlined"
                  sx={{ mr: 1, fontFamily: 'monospace', fontSize: 10 }} />
                <ListItemText primary={n.label} primaryTypographyProps={{ fontSize: 13 }} />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* 우측 68% — Detail Form */}
        <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            노드 속성 — Indoor (LV3)
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField label="레벨 코드" size="small" value="L3-IDR" sx={{ flex: 1 }} disabled />
              <TextField label="레벨 깊이" size="small" value="3" sx={{ flex: 1 }} disabled />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="레벨 명 (한글)" size="small" value="Indoor" sx={{ flex: 1 }} />
              <TextField label="레벨 명 (English)" size="small" value="Indoor" sx={{ flex: 1 }} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="상위 노드" size="small" value="LED Lighting (LV2)" sx={{ flex: 1 }} disabled />
              <TextField label="자식 노드 수" size="small" value="2" sx={{ flex: 1 }} disabled />
            </Stack>
            <TextField label="설명" size="small" value="실내용 LED 조명 카테고리 — Office/Home 으로 세분화" multiline rows={2} />
            <Stack direction="row" spacing={1}>
              <Chip label="ACTIVE" color="success" size="small" />
              <Chip label="USE_YN: Y" variant="outlined" size="small" />
              <Chip label="생성: 2024-08-15" variant="outlined" size="small" />
            </Stack>
          </Stack>
        </Box>
      </Box>
    </MockShell>
  );
}
```

- [ ] **Step 2: 컴파일 확인**

Run: `docker compose logs --tail 30 composer-frontend 2>&1 | grep -iE "error|fail" | grep -i hierarchy | head -3`
Expected: 출력 없음

---

## Task 4: DmCalendarRateMockup (LAYOUT_V2 — 시계열 마스터 4개)

**Files:**
- Create: `frontend/src/view/util/t3mockup/_planel/plannel_dm_calendar_rate/DmCalendarRateMockup.jsx`

- [ ] **Step 1: 디렉토리 + JSX 파일 작성**

파일 `frontend/src/view/util/t3mockup/_planel/plannel_dm_calendar_rate/DmCalendarRateMockup.jsx`:

```jsx
import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import MockShell from '../../_shared/MockShell';

// PLANNEL DM 시계열 마스터 — Calendar / CalendarGroup / ExchangeRate / UnitPrice
// 상단 마스터 헤더(폼) + 하단 기간별 매트릭스. 일자/주차/월 column iteration

const HEADER_INFO = {
  group: 'KR_STANDARD',
  desc: '대한민국 표준 캘린더',
  fromTo: '2025-01-01 ~ 2026-12-31',
};

const MONTHS = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];

const RATE_ROWS = [
  { CCY: 'USD', NM: '미국 달러',     vals: [1330, 1325, 1340, 1355, 1360, 1345, 1338, 1342, 1350, 1365, 1370, 1355] },
  { CCY: 'EUR', NM: '유로',          vals: [1450, 1448, 1455, 1462, 1470, 1465, 1460, 1458, 1465, 1472, 1478, 1470] },
  { CCY: 'JPY', NM: '일본 엔 (100)', vals: [905, 902, 908, 912, 918, 915, 910, 907, 912, 920, 925, 918] },
  { CCY: 'CNY', NM: '중국 위안',     vals: [184, 183, 185, 187, 189, 188, 186, 185, 187, 190, 192, 189] },
];

export default function DmCalendarRateMockup() {
  return (
    <MockShell
      patternCode="plannel_dm_calendar_rate"
      patternLabel="PlaNEL — DM 시계열 마스터 (Calendar / Calendar Group / Exchange Rate / Unit Price)"
      layoutCategory="LAYOUT_V2"
      description="상단 마스터 헤더 + 하단 기간별 매트릭스. 일자/주차/월 column iteration."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="마스터" size="small" select value="EXCHANGE_RATE" sx={{ width: 180 }}>
            <MenuItem value="CALENDAR">Cycle Calendar</MenuItem>
            <MenuItem value="CALENDAR_GROUP">Calendar Group</MenuItem>
            <MenuItem value="EXCHANGE_RATE">Exchange Rate</MenuItem>
            <MenuItem value="UNIT_PRICE">Unit Price</MenuItem>
          </TextField>
          <TextField label="조회 연도" size="small" select value="2026" sx={{ width: 120 }}>
            <MenuItem value="2024">2024</MenuItem>
            <MenuItem value="2025">2025</MenuItem>
            <MenuItem value="2026">2026</MenuItem>
          </TextField>
          <TextField label="단위" size="small" select value="MONTH" sx={{ width: 110 }}>
            <MenuItem value="DAY">일</MenuItem>
            <MenuItem value="WEEK">주</MenuItem>
            <MenuItem value="MONTH">월</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      {/* 상단 V2 첫번째 — Header Form */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={3} alignItems="center">
          <Stack>
            <Typography variant="caption" color="text.secondary">캘린더 그룹</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{HEADER_INFO.group}</Typography>
          </Stack>
          <Stack>
            <Typography variant="caption" color="text.secondary">설명</Typography>
            <Typography variant="body2">{HEADER_INFO.desc}</Typography>
          </Stack>
          <Stack>
            <Typography variant="caption" color="text.secondary">유효 기간</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{HEADER_INFO.fromTo}</Typography>
          </Stack>
          <Box sx={{ flexGrow: 1 }} />
          <Chip label="ACTIVE" color="success" size="small" />
          <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
        </Stack>
      </Box>

      {/* 하단 V2 두번째 — 매트릭스 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 0, backgroundColor: 'grey.100', minWidth: 100 }}>통화</TableCell>
              <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 100, backgroundColor: 'grey.100', minWidth: 140 }}>명칭</TableCell>
              {MONTHS.map((m) => (
                <TableCell key={m} sx={{ fontWeight: 700, textAlign: 'right', minWidth: 90, fontFamily: 'monospace' }}>{m}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {RATE_ROWS.map((r) => (
              <TableRow key={r.CCY} hover>
                <TableCell sx={{ fontFamily: 'monospace', position: 'sticky', left: 0, backgroundColor: 'background.paper' }}>{r.CCY}</TableCell>
                <TableCell sx={{ position: 'sticky', left: 100, backgroundColor: 'background.paper' }}>{r.NM}</TableCell>
                {r.vals.map((v, i) => (
                  <TableCell key={i} sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{v.toLocaleString()}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </MockShell>
  );
}
```

- [ ] **Step 2: 컴파일 확인**

Run: `docker compose logs --tail 30 composer-frontend 2>&1 | grep -iE "error|fail" | grep -i calendar | head -3`
Expected: 출력 없음

---

## Task 5: DmRelationLinkMockup (LAYOUT_H2 — 관계 마스터 5개)

**Files:**
- Create: `frontend/src/view/util/t3mockup/_planel/plannel_dm_relation_link/DmRelationLinkMockup.jsx`

- [ ] **Step 1: 디렉토리 + JSX 파일 작성**

파일 `frontend/src/view/util/t3mockup/_planel/plannel_dm_relation_link/DmRelationLinkMockup.jsx`:

```jsx
import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, Checkbox, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import LinkIcon from '@mui/icons-material/Link';
import MockShell from '../../_shared/MockShell';

// PLANNEL DM 관계 마스터 — CustomerItem / LocationItem / CustomerLocation / SupplierItem / HrchyPermission
// 좌측 부모 마스터 + 우측 연결 자식 cross. 좌측 선택 → 우측 적용 (체크박스)

const PARENT_ROWS = [
  { CD: 'CUST-K001', NM: 'Samsung Display', linked: 12, region: 'KR' },
  { CD: 'CUST-K002', NM: 'LG Innotek',      linked:  8, region: 'KR' },
  { CD: 'CUST-K003', NM: 'SK Hynix',        linked: 15, region: 'KR' },
  { CD: 'CUST-U001', NM: 'Apple Inc.',      linked: 22, region: 'US' },
  { CD: 'CUST-U002', NM: 'Tesla Motors',    linked:  6, region: 'US' },
  { CD: 'CUST-J001', NM: 'Sony Corp.',      linked:  9, region: 'JP' },
];

const CHILD_ROWS = [
  { CD: 'ITM-A100', NM: 'LED Module 60W',    linked: true,  alloc: 5000 },
  { CD: 'ITM-A101', NM: 'LED Module 80W',    linked: true,  alloc: 3000 },
  { CD: 'ITM-A102', NM: 'LED Module 100W',   linked: false, alloc: 0 },
  { CD: 'ITM-B205', NM: 'PCB Board Rev.3',   linked: true,  alloc: 1200 },
  { CD: 'ITM-B206', NM: 'PCB Board Rev.4',   linked: false, alloc: 0 },
  { CD: 'ITM-C310', NM: 'Aluminum Heatsink', linked: true,  alloc: 8000 },
  { CD: 'ITM-D420', NM: 'Plastic Housing',   linked: false, alloc: 0 },
  { CD: 'ITM-D421', NM: 'Glass Cover',       linked: true,  alloc: 4500 },
];

export default function DmRelationLinkMockup() {
  return (
    <MockShell
      patternCode="plannel_dm_relation_link"
      patternLabel="PlaNEL — DM 관계 마스터 (Customer-Item / Location-Item / Customer-Location / Supplier-Item / Hrchy Permission)"
      layoutCategory="LAYOUT_H2"
      description="좌측 부모 마스터 + 우측 연결 자식 cross. 좌측 선택 → 우측 체크박스로 연결 정의."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="관계 유형" size="small" select value="CUSTOMER_ITEM" sx={{ width: 200 }}>
            <MenuItem value="CUSTOMER_ITEM">Customer ↔ Item</MenuItem>
            <MenuItem value="LOCATION_ITEM">Location ↔ Item</MenuItem>
            <MenuItem value="CUSTOMER_LOCATION">Customer ↔ Location</MenuItem>
            <MenuItem value="SUPPLIER_ITEM">Supplier ↔ Item</MenuItem>
            <MenuItem value="HRCHY_PERM">Hrchy Permission</MenuItem>
          </TextField>
          <TextField label="검색" size="small" value="" placeholder="CD/NM" sx={{ width: 180 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 좌측 H2 첫번째 — Parent (Customer) */}
        <Box sx={{ width: '38%', borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'primary.50' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Customer (부모)</Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Customer CD</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>명칭</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>연결</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {PARENT_ROWS.map((r, idx) => (
                  <TableRow key={r.CD} hover selected={idx === 0}
                    sx={{ '&.Mui-selected': { backgroundColor: 'primary.100' } }}>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.CD}</TableCell>
                    <TableCell>
                      {r.NM} <Chip label={r.region} size="small" sx={{ ml: 0.5, fontSize: 10 }} />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Chip label={`${r.linked}개`} size="small" color={r.linked > 10 ? 'primary' : 'default'} icon={<LinkIcon sx={{ fontSize: 12 }} />} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>

        {/* 우측 H2 두번째 — Child (Item) */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'success.50' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Item (자식) — Samsung Display 의 12개 연결
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" startIcon={<SaveIcon />} variant="contained">관계 저장</Button>
          </Stack>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.100' }}>
                  <TableCell padding="checkbox"><Checkbox size="small" indeterminate /></TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Item CD</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>명칭</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>할당량</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {CHILD_ROWS.map((r) => (
                  <TableRow key={r.CD} hover>
                    <TableCell padding="checkbox"><Checkbox size="small" checked={r.linked} /></TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.CD}</TableCell>
                    <TableCell>{r.NM}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: r.linked ? 'inherit' : 'text.disabled' }}>
                      {r.linked ? r.alloc.toLocaleString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>
      </Box>
    </MockShell>
  );
}
```

- [ ] **Step 2: 컴파일 확인**

Run: `docker compose logs --tail 30 composer-frontend 2>&1 | grep -iE "error|fail" | grep -i relation | head -3`
Expected: 출력 없음

---

## Task 6: DmBomRouteMockup (LAYOUT_ROUTELAYOUT — BOM/Route 6개)

**Files:**
- Create: `frontend/src/view/util/t3mockup/_planel/plannel_dm_bom_route/DmBomRouteMockup.jsx`

- [ ] **Step 1: 디렉토리 + JSX 파일 작성**

파일 `frontend/src/view/util/t3mockup/_planel/plannel_dm_bom_route/DmBomRouteMockup.jsx`:

```jsx
import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Tabs, Tab, Paper, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import MockShell from '../../_shared/MockShell';

// PLANNEL DM BOM / Route — BomMaster / BomDetail / Route / Routing / BodMaster / BodItem 6개
// LAYOUT_ROUTELAYOUT — BOM 트리 다이어그램 (nested boxes + arrows) + 우측 노드 detail

const NODE = (label, code, qty, type, color) => ({ label, code, qty, type, color });

const BOM_LEVEL_0 = NODE('LED Module 60W', 'ITM-A100', 1, 'FG', 'primary');
const BOM_LEVEL_1 = [
  NODE('PCB Board Rev.3',   'ITM-B205', 1, 'SF',  'info'),
  NODE('Plastic Housing',   'ITM-D420', 1, 'RM',  'success'),
  NODE('Glass Cover',       'ITM-D421', 1, 'RM',  'success'),
  NODE('Aluminum Heatsink', 'ITM-C310', 0.5, 'RM','warning'),
];
const BOM_LEVEL_2 = [
  NODE('LED Chip 0.5W', 'ITM-E510', 12, 'RM', 'success'),
  NODE('Resistor 1kΩ',  'ITM-E520', 24, 'RM', 'success'),
  NODE('Capacitor',     'ITM-E530',  8, 'RM', 'success'),
];

const NodeBox = ({ node, level }) => (
  <Paper elevation={1} sx={{
    p: 1, minWidth: 160, textAlign: 'center',
    border: '2px solid', borderColor: `${node.color}.main`,
    backgroundColor: `${node.color}.50`,
  }}>
    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: `${node.color}.dark` }}>
      {node.code}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12 }}>{node.label}</Typography>
    <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mt: 0.5 }}>
      <Chip label={node.type} size="small" sx={{ height: 16, fontSize: 9 }} />
      <Chip label={`× ${node.qty}`} size="small" variant="outlined" sx={{ height: 16, fontSize: 9, fontFamily: 'monospace' }} />
    </Stack>
  </Paper>
);

export default function DmBomRouteMockup() {
  return (
    <MockShell
      patternCode="plannel_dm_bom_route"
      patternLabel="PlaNEL — DM BOM/Route (BOM Master / BOM Detail / Route / Routing / BOD Master / BOD Item)"
      layoutCategory="LAYOUT_ROUTELAYOUT"
      description="BOM / 공정 라우트 다이어그램. FLODiagram 풍 트리 (LV0→LV1→LV2) + 노드 클릭 시 우측 detail."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="Top Item" size="small" value="ITM-A100 — LED Module 60W" sx={{ width: 260 }} />
          <TextField label="유형" size="small" select value="BOM" sx={{ width: 110 }}>
            <MenuItem value="BOM">BOM</MenuItem>
            <MenuItem value="ROUTE">Route</MenuItem>
            <MenuItem value="BOD">BOD</MenuItem>
          </TextField>
          <TextField label="버전" size="small" select value="V2026.05" sx={{ width: 130 }}>
            <MenuItem value="V2025.12">V2025.12</MenuItem>
            <MenuItem value="V2026.05">V2026.05</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Tabs value={0}>
            <Tab label="BOM" />
            <Tab label="Route" disabled />
            <Tab label="BOD" disabled />
          </Tabs>
          <Button size="small" startIcon={<SearchIcon />} variant="contained">조회</Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 좌측 70% — BOM Tree Diagram */}
        <Box sx={{ flex: 1, p: 3, overflow: 'auto', backgroundColor: 'grey.50' }}>
          {/* LV0 */}
          <Stack alignItems="center" spacing={3}>
            <NodeBox node={BOM_LEVEL_0} level={0} />
            <Box sx={{ width: 2, height: 24, backgroundColor: 'grey.400' }} />
            {/* LV1 */}
            <Stack direction="row" spacing={2} sx={{ position: 'relative' }}>
              {BOM_LEVEL_1.map((n) => <NodeBox key={n.code} node={n} level={1} />)}
            </Stack>
            <Box sx={{ width: 2, height: 24, backgroundColor: 'grey.400' }} />
            {/* LV2 — PCB Board 의 하위 */}
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'flex-start', ml: 2 }}>
              ↑ PCB Board Rev.3 의 하위 구성요소
            </Typography>
            <Stack direction="row" spacing={2}>
              {BOM_LEVEL_2.map((n) => <NodeBox key={n.code} node={n} level={2} />)}
            </Stack>
          </Stack>
        </Box>

        {/* 우측 30% — Selected Node Detail */}
        <Box sx={{ width: '30%', borderLeft: '1px solid', borderColor: 'divider', p: 2, overflow: 'auto' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>선택 노드</Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1.5}>
            <Stack>
              <Typography variant="caption" color="text.secondary">코드</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>ITM-B205</Typography>
            </Stack>
            <Stack>
              <Typography variant="caption" color="text.secondary">명칭</Typography>
              <Typography variant="body2">PCB Board Rev.3</Typography>
            </Stack>
            <Stack>
              <Typography variant="caption" color="text.secondary">유형 / 단위</Typography>
              <Typography variant="body2">SF (반제품) / EA</Typography>
            </Stack>
            <Stack>
              <Typography variant="caption" color="text.secondary">소요량 (per parent)</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>1 EA</Typography>
            </Stack>
            <Stack>
              <Typography variant="caption" color="text.secondary">하위 구성요소</Typography>
              <Typography variant="body2">3개 (LED Chip / Resistor / Capacitor)</Typography>
            </Stack>
            <Divider />
            <Button size="small" startIcon={<AddIcon />}>하위 노드 추가</Button>
            <Button size="small" startIcon={<SaveIcon />} variant="contained">변경 저장</Button>
          </Stack>
        </Box>
      </Box>
    </MockShell>
  );
}
```

- [ ] **Step 2: 컴파일 확인**

Run: `docker compose logs --tail 30 composer-frontend 2>&1 | grep -iE "error|fail" | grep -i bom | head -3`
Expected: 출력 없음

---

## Task 7: DmPlanningGridMockup (LAYOUT_SINGLE — 시계열 입력 4개)

**Files:**
- Create: `frontend/src/view/util/t3mockup/_planel/plannel_dm_planning_grid/DmPlanningGridMockup.jsx`

- [ ] **Step 1: 디렉토리 + JSX 파일 작성**

파일 `frontend/src/view/util/t3mockup/_planel/plannel_dm_planning_grid/DmPlanningGridMockup.jsx`:

```jsx
import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import UploadIcon from '@mui/icons-material/Upload';
import MockShell from '../../_shared/MockShell';

// PLANNEL DM 시계열 계획 입력 — SalesPlan / FinancePlan / PurchaseBudget / MaterialReceiptPlan 4개
// 좌측 고정 (Item/Account) + 시간 버킷 피벗 + 직접 편집 (편집 가능 셀)

const MONTHS = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];

const PLAN_ROWS = [
  { CUST: 'Samsung Display', ITEM: 'ITM-A100', NM: 'LED Module 60W', vals: [5000, 5200, 5500, 5800, 6000, 5500, 5000] },
  { CUST: 'Samsung Display', ITEM: 'ITM-A101', NM: 'LED Module 80W', vals: [3000, 3100, 3300, 3500, 3600, 3300, 3000] },
  { CUST: 'LG Innotek',      ITEM: 'ITM-A100', NM: 'LED Module 60W', vals: [2500, 2600, 2800, 3000, 3100, 2800, 2500] },
  { CUST: 'LG Innotek',      ITEM: 'ITM-B205', NM: 'PCB Board Rev.3', vals: [1200, 1250, 1300, 1350, 1400, 1300, 1200] },
  { CUST: 'Apple Inc.',      ITEM: 'ITM-A101', NM: 'LED Module 80W', vals: [8000, 8200, 8500, 8800, 9000, 8500, 8000] },
  { CUST: 'Tesla Motors',    ITEM: 'ITM-C310', NM: 'Aluminum Heatsink', vals: [4500, 4600, 4700, 4800, 4900, 4700, 4500] },
];

export default function DmPlanningGridMockup() {
  return (
    <MockShell
      patternCode="plannel_dm_planning_grid"
      patternLabel="PlaNEL — DM 시계열 계획 입력 (Sales Plan / Finance Plan / Purchase Budget / Material Receipt Plan)"
      layoutCategory="LAYOUT_SINGLE"
      description="시계열 매트릭스 입력 — 좌측 고정 (Customer/Item) + 시간 버킷 피벗 + 직접 편집 가능 셀."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="계획 유형" size="small" select value="SALES_PLAN" sx={{ width: 180 }}>
            <MenuItem value="SALES_PLAN">Sales Plan</MenuItem>
            <MenuItem value="FINANCE_PLAN">Finance Plan</MenuItem>
            <MenuItem value="PURCHASE_BUDGET">Purchase Budget</MenuItem>
            <MenuItem value="MATERIAL_RECEIPT">Material Receipt</MenuItem>
          </TextField>
          <TextField label="기간" size="small" select value="MONTH_7" sx={{ width: 130 }}>
            <MenuItem value="MONTH_3">3개월</MenuItem>
            <MenuItem value="MONTH_6">6개월</MenuItem>
            <MenuItem value="MONTH_7">7개월</MenuItem>
            <MenuItem value="MONTH_12">12개월</MenuItem>
          </TextField>
          <TextField label="버전" size="small" select value="V2026.06" sx={{ width: 130 }}>
            <MenuItem value="V2026.05">V2026.05</MenuItem>
            <MenuItem value="V2026.06">V2026.06</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Chip label="편집 모드: ON" color="warning" size="small" />
          <Button size="small" startIcon={<UploadIcon />}>Excel 업로드</Button>
          <Button size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 0, backgroundColor: 'grey.100', minWidth: 150, zIndex: 2 }}>
                Customer
              </TableCell>
              <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 150, backgroundColor: 'grey.100', minWidth: 110, zIndex: 2 }}>
                Item CD
              </TableCell>
              <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 260, backgroundColor: 'grey.100', minWidth: 160, zIndex: 2 }}>
                Item NM
              </TableCell>
              {MONTHS.map((m) => (
                <TableCell key={m} sx={{ fontWeight: 700, textAlign: 'right', minWidth: 100, fontFamily: 'monospace' }}>{m}</TableCell>
              ))}
              <TableCell sx={{ fontWeight: 700, textAlign: 'right', minWidth: 100, backgroundColor: 'primary.50', fontFamily: 'monospace' }}>합계</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {PLAN_ROWS.map((r) => {
              const sum = r.vals.reduce((a, b) => a + b, 0);
              return (
                <TableRow key={r.CUST + r.ITEM} hover>
                  <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: 'background.paper' }}>{r.CUST}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', position: 'sticky', left: 150, backgroundColor: 'background.paper' }}>{r.ITEM}</TableCell>
                  <TableCell sx={{ position: 'sticky', left: 260, backgroundColor: 'background.paper' }}>{r.NM}</TableCell>
                  {r.vals.map((v, i) => (
                    <TableCell key={i} sx={{
                      textAlign: 'right',
                      fontFamily: 'monospace',
                      backgroundColor: 'warning.50',
                      borderRight: '1px dashed',
                      borderColor: 'warning.200',
                    }}>
                      {v.toLocaleString()}
                    </TableCell>
                  ))}
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, backgroundColor: 'primary.50' }}>
                    {sum.toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </MockShell>
  );
}
```

- [ ] **Step 2: 컴파일 확인**

Run: `docker compose logs --tail 30 composer-frontend 2>&1 | grep -iE "error|fail" | grep -i planning | head -3`
Expected: 출력 없음

---

## Task 8: DmTransactionLogMockup (LAYOUT_SINGLE — 거래 로그 8개)

**Files:**
- Create: `frontend/src/view/util/t3mockup/_planel/plannel_dm_transaction_log/DmTransactionLogMockup.jsx`

- [ ] **Step 1: 디렉토리 + JSX 파일 작성**

파일 `frontend/src/view/util/t3mockup/_planel/plannel_dm_transaction_log/DmTransactionLogMockup.jsx`:

```jsx
import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Pagination,
  Table, TableHead, TableBody, TableRow, TableCell, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MockShell from '../../_shared/MockShell';

// PLANNEL DM 거래 로그 — SalesTransaction / InventoryTransaction / ShipmentTransaction /
//   ProdOrder / PurchaseOrder / IntransitInventory / BfFeatureDate / BfFeatureSales 8개
// LAYOUT_SINGLE — 대량 거래 로그 그리드 + 필터 다중 + 페이지네이션 + 엑셀 익스포트

const TX_ROWS = [
  { DT: '2026-05-26 14:23', TYPE: 'SALES',     REF: 'SO-2026-04829', CUST: 'Samsung Display', ITEM: 'ITM-A100', QTY:   500, UOM: 'EA',  AMT: 12500000, STATUS: 'CONFIRMED' },
  { DT: '2026-05-26 13:55', TYPE: 'SHIPMENT',  REF: 'SH-2026-08412', CUST: 'Samsung Display', ITEM: 'ITM-A101', QTY:   300, UOM: 'EA',  AMT:  9000000, STATUS: 'SHIPPED' },
  { DT: '2026-05-26 12:40', TYPE: 'INVENTORY', REF: 'IV-2026-22841', CUST: '—',               ITEM: 'ITM-B205', QTY: 12000, UOM: 'EA',  AMT:        0, STATUS: 'IN_STOCK' },
  { DT: '2026-05-26 11:15', TYPE: 'PROD',      REF: 'PO-2026-05172', CUST: '—',               ITEM: 'ITM-A100', QTY:  1000, UOM: 'EA',  AMT:        0, STATUS: 'RELEASED' },
  { DT: '2026-05-26 10:08', TYPE: 'PURCHASE',  REF: 'PR-2026-03291', CUST: 'Supplier-K012',   ITEM: 'ITM-C310', QTY:  5000, UOM: 'KG',  AMT:  7500000, STATUS: 'OPEN' },
  { DT: '2026-05-25 18:42', TYPE: 'INTRANSIT', REF: 'IT-2026-01158', CUST: 'Supplier-J005',   ITEM: 'ITM-D420', QTY:  8000, UOM: 'EA',  AMT:  3200000, STATUS: 'IN_TRANSIT' },
  { DT: '2026-05-25 16:30', TYPE: 'BF_FEAT',   REF: 'BF-2026-09934', CUST: '—',               ITEM: 'ITM-A102', QTY:     0, UOM: '—',   AMT:        0, STATUS: 'CALC' },
  { DT: '2026-05-25 15:12', TYPE: 'SALES',     REF: 'SO-2026-04825', CUST: 'LG Innotek',      ITEM: 'ITM-B205', QTY:   200, UOM: 'EA',  AMT:  6000000, STATUS: 'CONFIRMED' },
  { DT: '2026-05-25 14:48', TYPE: 'SHIPMENT',  REF: 'SH-2026-08410', CUST: 'Apple Inc.',      ITEM: 'ITM-A101', QTY:  1500, UOM: 'EA',  AMT: 45000000, STATUS: 'SHIPPED' },
  { DT: '2026-05-25 13:25', TYPE: 'SALES',     REF: 'SO-2026-04820', CUST: 'Tesla Motors',    ITEM: 'ITM-C310', QTY:  3000, UOM: 'KG',  AMT:  4500000, STATUS: 'PENDING' },
];

const statusColor = (s) => {
  if (['CONFIRMED', 'SHIPPED', 'IN_STOCK', 'RELEASED'].includes(s)) return 'success';
  if (['IN_TRANSIT', 'OPEN', 'CALC'].includes(s)) return 'info';
  if (s === 'PENDING') return 'warning';
  return 'default';
};

export default function DmTransactionLogMockup() {
  return (
    <MockShell
      patternCode="plannel_dm_transaction_log"
      patternLabel="PlaNEL — DM 거래 로그 (Sales / Inventory / Shipment / Prod Order / Purchase / Intransit / BF Feature 8종)"
      layoutCategory="LAYOUT_SINGLE"
      description="대량 거래 로그 그리드 — 필터 다중 + 페이지네이션 + 엑셀 익스포트. 8개 거래 유형 통합 뷰."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="거래 유형" size="small" select value="ALL" sx={{ width: 150 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="SALES">Sales</MenuItem>
            <MenuItem value="INVENTORY">Inventory</MenuItem>
            <MenuItem value="SHIPMENT">Shipment</MenuItem>
            <MenuItem value="PROD">Prod Order</MenuItem>
            <MenuItem value="PURCHASE">Purchase</MenuItem>
            <MenuItem value="INTRANSIT">Intransit</MenuItem>
            <MenuItem value="BF_FEAT">BF Feature</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-05-19 ~ 2026-05-26" sx={{ width: 220 }} />
          <TextField label="Customer/Item" size="small" placeholder="CD/NM 검색" sx={{ width: 180 }} />
          <TextField label="Status" size="small" select value="ALL" sx={{ width: 120 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="CONFIRMED">Confirmed</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="SHIPPED">Shipped</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" startIcon={<FileDownloadIcon />}>Excel</Button>
          <Button size="small" startIcon={<SearchIcon />} variant="contained">조회</Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>일시</TableCell>
              <TableCell sx={{ fontWeight: 700, minWidth: 100 }}>유형</TableCell>
              <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>참조 번호</TableCell>
              <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Customer / Supplier</TableCell>
              <TableCell sx={{ fontWeight: 700, minWidth: 100 }}>Item</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right', minWidth: 90 }}>수량</TableCell>
              <TableCell sx={{ fontWeight: 700, minWidth: 60 }}>UOM</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right', minWidth: 120 }}>금액 (KRW)</TableCell>
              <TableCell sx={{ fontWeight: 700, minWidth: 110 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {TX_ROWS.map((r) => (
              <TableRow key={r.REF} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.DT}</TableCell>
                <TableCell><Chip label={r.TYPE} size="small" variant="outlined" /></TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{r.REF}</TableCell>
                <TableCell>{r.CUST}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{r.ITEM}</TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.QTY.toLocaleString()}</TableCell>
                <TableCell>{r.UOM}</TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: r.AMT > 0 ? 'inherit' : 'text.disabled' }}>
                  {r.AMT > 0 ? r.AMT.toLocaleString() : '—'}
                </TableCell>
                <TableCell><Chip label={r.STATUS} size="small" color={statusColor(r.STATUS)} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', backgroundColor: 'grey.50' }}>
        <Typography variant="caption" color="text.secondary">총 12,484건 · 페이지당 10건</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Pagination count={1249} page={1} size="small" />
      </Box>
    </MockShell>
  );
}
```

- [ ] **Step 2: 컴파일 확인**

Run: `docker compose logs --tail 30 composer-frontend 2>&1 | grep -iE "error|fail" | grep -i transaction | head -3`
Expected: 출력 없음

---

## Task 9: index.js 수정 — PLANEL_ENTRIES + mapping import + lookup

**Files:**
- Modify: `frontend/src/view/util/t3mockup/index.js` (line 14-19, 200-206, 315, 322-328 영역)

- [ ] **Step 1: import 추가**

`frontend/src/view/util/t3mockup/index.js` 의 line 19 직후 (KTNG mapping import 다음) 에 추가:

기존 (line 16-19):
```js
// T3SmartSCM 운영 메뉴 ↔ mockup 매핑 (scripts/mockup-menu-mapping.cjs 생성)
import menuMappingJson from './_data/t3smartscm-menu-mapping.json';
// KTNG 운영 메뉴 ↔ mockup 매핑 (수동 작성, .claude-project/_data/ktng-menu-source-raw.txt 기반)
import ktngMenuMappingJson from './_data/ktng-menu-mapping.json';
```

변경 후:
```js
// T3SmartSCM 운영 메뉴 ↔ mockup 매핑 (scripts/mockup-menu-mapping.cjs 생성)
import menuMappingJson from './_data/t3smartscm-menu-mapping.json';
// KTNG 운영 메뉴 ↔ mockup 매핑 (수동 작성, .claude-project/_data/ktng-menu-source-raw.txt 기반)
import ktngMenuMappingJson from './_data/ktng-menu-mapping.json';
// PLANNEL 운영 메뉴 ↔ mockup 매핑 (R1: Data Management 7 mockup)
import plannelMenuMappingJson from './_data/plannel-menu-mapping.json';
```

- [ ] **Step 2: PLANEL_ENTRIES 채우기**

기존 (line 201-206):
```js
// ─────────────────────────────────────────
// PlaNEL — 향후 작업 placeholder
// ─────────────────────────────────────────
const PLANEL_ENTRIES = [
  // 향후 PlaNEL 화면 mockup 추가 예정. 추가 시 productLine: 'PlaNEL' 자동 부여됨
];
```

변경 후:
```js
// ─────────────────────────────────────────
// PlaNEL — PLANNEL saas-web 화면 ~130개 → ~42 mockup 패턴 (단계적 진행)
// 현재 R1: Data Management 7 mockup (37 메뉴 커버)
// 다음 라운드: R2 Demand Plan (8) · R3 Replen Plan (6) · R4 Master Plan (5) · R5 Inv Plan (6) · R6 System+AI (5) · R7 Dashboard+DataLoad (5)
// ─────────────────────────────────────────
const PLANEL_ENTRIES = [
  { patternCode: 'plannel_dm_master_basic',     patternLabel: 'PlaNEL — DM 기본 마스터 (Item/Customer/Site/Location/Workcenter/Resource/Supplier)',
    layoutCategory: 'LAYOUT_SINGLE', category: 'domain', usage: 7,
    description: '기본 마스터 CRUD — 단일 BaseGrid + 검색조건 + Add/Save/Delete',
    component: lazy(() => import('./_planel/plannel_dm_master_basic/DmMasterBasicMockup')) },
  { patternCode: 'plannel_dm_hierarchy_tree',   patternLabel: 'PlaNEL — DM 계층 마스터 (Hrchy Config / Item Hrchy / Customer Hrchy)',
    layoutCategory: 'LAYOUT_H2', category: 'domain', usage: 3,
    description: '좌측 계층 TreeGrid + 우측 디테일 폼. LV1~LV5 정의 → 노드 클릭 시 우측 속성',
    component: lazy(() => import('./_planel/plannel_dm_hierarchy_tree/DmHierarchyTreeMockup')) },
  { patternCode: 'plannel_dm_calendar_rate',    patternLabel: 'PlaNEL — DM 시계열 마스터 (Calendar / Calendar Group / Exchange Rate / Unit Price)',
    layoutCategory: 'LAYOUT_V2', category: 'domain', usage: 4,
    description: '상단 마스터 헤더 + 하단 기간별 매트릭스. 일자/주차/월 column iteration',
    component: lazy(() => import('./_planel/plannel_dm_calendar_rate/DmCalendarRateMockup')) },
  { patternCode: 'plannel_dm_relation_link',    patternLabel: 'PlaNEL — DM 관계 마스터 (Customer-Item / Location-Item / Customer-Location / Supplier-Item / Hrchy Perm)',
    layoutCategory: 'LAYOUT_H2', category: 'domain', usage: 5,
    description: '좌측 부모 마스터 + 우측 연결 자식 cross. 좌측 선택 → 우측 체크박스로 연결',
    component: lazy(() => import('./_planel/plannel_dm_relation_link/DmRelationLinkMockup')) },
  { patternCode: 'plannel_dm_bom_route',        patternLabel: 'PlaNEL — DM BOM/Route (BOM Master / BOM Detail / Route / Routing / BOD Master / BOD Item)',
    layoutCategory: 'LAYOUT_ROUTELAYOUT', category: 'domain', usage: 6,
    description: 'BOM / 공정 라우트 다이어그램. FLODiagram 풍 트리 + 노드별 detail',
    component: lazy(() => import('./_planel/plannel_dm_bom_route/DmBomRouteMockup')) },
  { patternCode: 'plannel_dm_planning_grid',    patternLabel: 'PlaNEL — DM 시계열 계획 입력 (Sales Plan / Finance Plan / Purchase Budget / Material Receipt)',
    layoutCategory: 'LAYOUT_SINGLE', category: 'domain', usage: 4,
    description: '시계열 매트릭스 입력 — 좌측 고정 + 시간 버킷 피벗 + 직접 편집 셀',
    component: lazy(() => import('./_planel/plannel_dm_planning_grid/DmPlanningGridMockup')) },
  { patternCode: 'plannel_dm_transaction_log',  patternLabel: 'PlaNEL — DM 거래 로그 (Sales/Inventory/Shipment/Prod/Purchase/Intransit/BF Feature 8종)',
    layoutCategory: 'LAYOUT_SINGLE', category: 'domain', usage: 8,
    description: '대량 거래 로그 그리드 — 필터 다중 + 페이지네이션 + 엑셀 익스포트',
    component: lazy(() => import('./_planel/plannel_dm_transaction_log/DmTransactionLogMockup')) },
];
```

- [ ] **Step 3: PLANEL_MOCKUP_TO_MENUS 변수 + menus mapping 적용**

기존 (line 315-323 부근):
```js
// ─────────────────────────────────────────
// 최종 export — 각 entry 에 productLine + menus (운영 매핑) 자동 부여
// ─────────────────────────────────────────
const T3SMART_SCM_MOCKUP_TO_MENUS = menuMappingJson?.mockupToMenus || {};
const KTNG_MOCKUP_TO_MENUS        = ktngMenuMappingJson?.mockupToMenus || {};
export const MOCKUP_ENTRIES = [
  ...T3SMART_SCM_ENTRIES.map((e) => ({
    productLine: 'T3SmartSCM',
    menus: T3SMART_SCM_MOCKUP_TO_MENUS[e.patternCode] || [],
    ...e,
  })),
  ...PLANEL_ENTRIES.map((e) => ({ productLine: 'PlaNEL', menus: [], ...e })),
```

변경 후:
```js
// ─────────────────────────────────────────
// 최종 export — 각 entry 에 productLine + menus (운영 매핑) 자동 부여
// ─────────────────────────────────────────
const T3SMART_SCM_MOCKUP_TO_MENUS = menuMappingJson?.mockupToMenus || {};
const KTNG_MOCKUP_TO_MENUS        = ktngMenuMappingJson?.mockupToMenus || {};
const PLANEL_MOCKUP_TO_MENUS      = plannelMenuMappingJson?.mockupToMenus || {};
export const MOCKUP_ENTRIES = [
  ...T3SMART_SCM_ENTRIES.map((e) => ({
    productLine: 'T3SmartSCM',
    menus: T3SMART_SCM_MOCKUP_TO_MENUS[e.patternCode] || [],
    ...e,
  })),
  ...PLANEL_ENTRIES.map((e) => ({
    productLine: 'PlaNEL',
    menus: PLANEL_MOCKUP_TO_MENUS[e.patternCode] || [],
    ...e,
  })),
```

(KTNG 의 `...KTNG_ENTRIES.map(...)` 부분은 건드리지 않음 — 그 다음 줄에 그대로 유지)

- [ ] **Step 4: 컴파일 + 모듈 등록 확인**

Run: `docker compose logs --tail 50 composer-frontend 2>&1 | grep -iE "error|fail|module not found" | head -10`
Expected: 출력 없음

Run: `grep -c "plannel_dm_" c:/vs_project/Composer/frontend/src/view/util/t3mockup/index.js`
Expected: `14` (entry 7개 × 2 라인 — patternCode + import path)

---

## Task 10: 통합 검증 — 브라우저 확인 + hook 검증

**Files:** (수정 없음 — 검증만)

- [ ] **Step 1: 브라우저에서 PlaNEL 탭 표시 확인**

브라우저에서 T3Composer 화면 새로고침 (Ctrl+F5) → 상단 메뉴 `[SCM UI Mockup]` 탭 클릭 → `Product Line` 행에서 `PlaNEL (7)` 표시 확인 (이전 `PlaNEL (0)` → `PlaNEL (7)` 로 변경).

Expected:
- `PlaNEL (7)` 표시
- 카테고리 행에 `도메인 (7)` (모두 category: 'domain' 임)
- 7개 mockup 카드 grid 노출

- [ ] **Step 2: 각 mockup 카드 클릭 확인**

각 카드 클릭 → mockup 본문 (MUI 컴포넌트로 렌더된 화면) 표시 확인.

```
plannel_dm_master_basic       → SearchArea + Tabs + 8행 Table (LED Module 등 sample data)
plannel_dm_hierarchy_tree     → 좌측 TreeView + 우측 노드 속성 폼
plannel_dm_calendar_rate      → 상단 헤더 폼 + 하단 12개월 환율 매트릭스
plannel_dm_relation_link      → 좌측 Customer Grid + 우측 Item Grid (체크박스)
plannel_dm_bom_route          → BOM 트리 다이어그램 (3 레벨 nested boxes)
plannel_dm_planning_grid      → 좌측 고정 + 7개월 매트릭스 (편집 가능 셀 색상)
plannel_dm_transaction_log    → 8행 거래 로그 + 페이지네이션
```

각 화면에 console error 없음 확인 (F12 → Console 탭).

- [ ] **Step 3: 카드의 `[사용 메뉴 N개]` 토글 확인**

`plannel_dm_master_basic` 카드 → `[사용 메뉴 7개]` 토글 클릭 → 매핑 메뉴 표 표시:
- DM_ITEM_MASTER · Item Master · /data-management/ItemMaster
- DM_CUSTOMER_MASTER · Customer Master · /data-management/CustomerMaster
- ... (총 7개 행)

다른 6 mockup 도 동일하게 토글 → menus 매핑 정상 표시 확인.

- [ ] **Step 4: 검색·필터 동작 확인**

- 검색바에 `Calendar` 입력 → `plannel_dm_calendar_rate` 카드만 표시
- 검색바에 `BOM` 입력 → `plannel_dm_bom_route` 카드만 표시
- 검색바 비우고 `Layout 카테고리` → `LAYOUT_H2` 선택 → `hierarchy_tree` + `relation_link` 2개만 표시
- `LAYOUT_ROUTELAYOUT` 선택 → `bom_route` 1개만 표시

- [ ] **Step 5: hook validator 확인**

Run: `bash c:/vs_project/Composer/.claude/hooks/validators/t3mockup.sh --self-test 2>&1 || true`
Expected: 스크립트 syntax error 없음 (스크립트 자체 self-test 가 없으면 종료 코드 무관)

수동 검증 — 각 mockup 파일의 `patternCode` 가 디렉토리명과 1:1 일치:

Run:
```bash
for d in c:/vs_project/Composer/frontend/src/view/util/t3mockup/_planel/*/; do
  dir_name="$(basename "$d")"
  jsx_file="$(ls "$d"*.jsx 2>/dev/null | head -1)"
  if [ -n "$jsx_file" ]; then
    prop_code="$(grep -oE 'patternCode="[^"]+"' "$jsx_file" | head -1 | sed -E 's/patternCode="([^"]+)"/\1/')"
    if [ "$dir_name" = "$prop_code" ]; then
      echo "[OK]   $dir_name"
    else
      echo "[FAIL] $dir_name != patternCode '$prop_code'"
    fi
  fi
done
```

Expected:
```
[OK]   plannel_dm_bom_route
[OK]   plannel_dm_calendar_rate
[OK]   plannel_dm_hierarchy_tree
[OK]   plannel_dm_master_basic
[OK]   plannel_dm_planning_grid
[OK]   plannel_dm_relation_link
[OK]   plannel_dm_transaction_log
```
(7 OK · 0 FAIL)

- [ ] **Step 6: 사용자에게 시각 검증 요청**

브라우저 스크린샷 또는 시각 확인 후 사용자 승인 → commit 진행 여부 별도 결정 (commit 은 사용자 명시 요청 시).

---

## Self-Review (작성자 점검 후 반영 완료)

1. **Spec coverage** — spec 의 모든 R1 mockup 7개 + menu-mapping.json + index.js 수정이 task 로 매핑됨 ✓
2. **Placeholder scan** — TBD / TODO / "implement later" 없음 ✓
3. **Type consistency** — patternCode (`plannel_dm_*`) · 디렉토리명 · 파일명 · import path 모두 일관 ✓ . menuId 형식 (`DM_<UPPER>`) JSON 과 일관 ✓
4. **Hook compliance** — M1 (MockShell import) · M2 (디렉토리 = patternCode) · M3 (warn only) · M4 (index.js 등록) 모두 task 9 에서 통과 ✓

## 다음 라운드 안내

R1 완료 시 사용자 시각 검증 후 commit. R2 (Demand Plan 8 mockup) 는 별도 spec/plan 으로 진행 — 본 plan 의 §8 Future Rounds 참조.

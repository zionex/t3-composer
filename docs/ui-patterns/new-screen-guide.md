# 신규 화면 생성 가이드

> 이 문서는 **신규 화면을 개발할 때** 의 단계별 체크리스트와 스켈레톤 코드를 제공합니다.

## 목차

- [1. 결정 플로우](#1-결정-플로우)
- [2. 단계별 체크리스트](#2-단계별-체크리스트)
- [3. 패턴별 스켈레톤 코드](#3-패턴별-스켈레톤-코드)
- [4. 파일 배치 규칙](#4-파일-배치-규칙)
- [5. 라우팅·메뉴 등록](#5-라우팅메뉴-등록)
- [6. Stored Procedure 연결](#6-stored-procedure-연결)
- [7. 온톨로지 등록](#7-온톨로지-등록)
- [8. 최종 점검 체크리스트](#8-최종-점검-체크리스트)

---

## 1. 결정 플로우

```
신규 화면 요구사항
    │
    ▼
┌─────────────────────────────────────┐
│ Step 1. 화면 업무 유형 식별         │
│  · 마스터 CRUD?                     │
│  · 분석 리포트?                     │
│  · 계획 입력?                       │
│  · 버전 관리/워크플로?              │
│  · 대시보드/모니터링?               │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Step 2. 패턴 선택                   │
│  → patterns.md 의 표에서 업무 유형  │
│    에 맞는 패턴(P01~P14) 선정       │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Step 3. 대표 파일 복사              │
│  → 선정 패턴의 "대표 파일" 을       │
│    템플릿으로 복사해서 시작         │
│  (sample 폴더 코드는 부분적)       │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Step 4. 컴포넌트 인벤토리 체크      │
│  → components-inventory.md 참조     │
│    하여 필요 입력 필드/그리드/차트  │
│    선택                             │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Step 5. SP / 온톨로지 연결          │
│  → database/procedures.md 의        │
│    SP_UI_<모듈>_*  네이밍 맞춰 신규 │
│    SP 작성                          │
│  → database/ontology-rule.md 기반   │
│    View 온톨로지 등록               │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Step 6. 구현 · 라우팅 · 메뉴 등록    │
└─────────────────────────────────────┘
```

## 2. 단계별 체크리스트

### ✅ 기획 단계
- [ ] 화면 업무 유형 (마스터 / 리포트 / 입력 / 워크플로 / 대시보드) 확정
- [ ] 조회 조건 정의 (PlanScope · Location · Item · 기간 · 버전 등)
- [ ] 화면에 표시할 데이터 소스 확정 (테이블·뷰·프로시저)
- [ ] 사용자 액션 정의 (조회/저장/삭제/시뮬레이션/승인 등)
- [ ] 패턴 결정 → [README.md](./README.md)

### ✅ 개발 환경 준비
- [ ] 메뉴 코드 확정 (`TB_AD_MENU.MENU_CD`)
- [ ] SP 네이밍 확정 (`SP_UI_<DOMAIN>_<NO>_<ACTION>`)
- [ ] 파일 경로 확정 (`view/<module>/<category>/<name>/<Name>.jsx`)

### ✅ 구현 단계
- [ ] 대표 파일 복사 → 새 파일명/경로로 이동
- [ ] 컬럼/필드 요구사항에 맞춰 수정
- [ ] `setViewInfo` 로 글로벌 버튼 등록
- [ ] react-hook-form 으로 검색 폼 설정
- [ ] SP 호출 로직 (`callService`) 작성
- [ ] 에러 처리·빈 데이터 처리·로딩 인디케이터
- [ ] 다국어 메시지 (`t(...)`) 적용

### ✅ 통합 단계
- [ ] 메뉴 등록 (`TB_AD_MENU`)
- [ ] 권한 등록 (`TB_AD_PERMISSION` / `TB_AD_PERMISSION_GROUP`)
- [ ] View 온톨로지 등록 (`tb_is_vwbusnss_ontlgy.menu_cd`)
- [ ] SP_UI 작성 및 `SP_UI_<...>_Q1` 매핑
- [ ] 개인화 지원 시 `PopPersonalize` 연결

### ✅ 테스트
- [ ] 조회 ▷ 저장 ▷ 삭제 플로우
- [ ] 검증 에러 케이스
- [ ] 엑셀 다운/업로드 (해당 시)
- [ ] 권한별 버튼 노출/숨김
- [ ] 다국어 (ko/en/ja/zh) 표시

---

## 3. 패턴별 스켈레톤 코드

### 3.1 P02 · 검색+단일 그리드 (가장 일반적)

```jsx
import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';

import {
  ContentInner, SearchArea, SearchRow, WorkArea,
  ButtonArea, LeftButtonArea, RightButtonArea,
  InputField, BaseGrid, GridCnt,
  GridAddRowButton, GridDeleteRowButton, GridSaveButton, GridExcelExportButton,
  callService, showMessage,
} from '@wingui/common/imports';

import { useViewStore } from '@wingui/common/store/viewStore';
import { useContentStore } from '@wingui/common/store/contentStore';

// 컬럼 정의는 컴포넌트 밖에 (리렌더 시 재생성 방지)
let gridItems = [
  { name: 'ID',         fieldName: 'ID',         header: 'ID',   dataType: 'text', width: 80,  visible: false },
  { name: 'CODE',       fieldName: 'CODE',       header: '코드', dataType: 'text', width: 120 },
  { name: 'NAME',       fieldName: 'NAME',       header: '명칭', dataType: 'text', width: 200 },
  { name: 'USE_YN',     fieldName: 'USE_YN',     header: '사용', dataType: 'text', width: 60  },
  { name: 'MODIFY_DTTM',fieldName: 'MODIFY_DTTM',header: '수정일시', dataType: 'datetime', width: 140 },
];

function MyScreen(props) {
  const { activeViewId } = useContentStore();
  const { setViewInfo } = useViewStore();

  const { control, getValues, handleSubmit, reset } = useForm({
    defaultValues: { code: '', name: '', useYn: 'ALL' },
  });

  const [grid1, setGrid1] = useState(null);

  // 조회
  const handleSearch = () => {
    const params = getValues();
    callService('SP_UI_CM_<NO>_Q1', params).then((data) => {
      grid1?.setRows(data);
    });
  };

  // 저장
  const handleSave = () => {
    if (!grid1) return;
    const changes = grid1.getChanges();
    if (changes.length === 0) return;
    callService('SP_UI_CM_<NO>_S1', { rows: changes }).then(() => {
      showMessage('알림', '저장되었습니다', { onOk: handleSearch });
    });
  };

  // 글로벌 버튼 등록 (그리드 준비 후)
  useEffect(() => {
    if (!grid1) return;
    setViewInfo(activeViewId, 'globalButtons', [
      { code: 'search', visible: true, action: handleSearch },
      { code: 'save',   visible: true, action: handleSave   },
    ]);
  }, [activeViewId, grid1]);

  return (
    <ContentInner>
      <SearchArea onSearch={handleSubmit(handleSearch)}>
        <SearchRow>
          <InputField control={control} name="code" type="text" label="코드" />
          <InputField control={control} name="name" type="text" label="명칭" />
          <InputField control={control} name="useYn" type="select"
            options={[
              { value: 'ALL', label: '전체' },
              { value: 'Y',   label: '사용' },
              { value: 'N',   label: '미사용' },
            ]} label="사용여부"
          />
        </SearchRow>
      </SearchArea>

      <WorkArea>
        <ButtonArea>
          <LeftButtonArea>
            <GridCnt grid={grid1} />
          </LeftButtonArea>
          <RightButtonArea>
            <GridAddRowButton grid={grid1} />
            <GridDeleteRowButton grid={grid1} />
            <GridSaveButton grid={grid1} onClick={handleSave} />
            <GridExcelExportButton grid={grid1} />
          </RightButtonArea>
        </ButtonArea>

        <BaseGrid
          columns={gridItems}
          afterCreate={(g) => setGrid1(g)}
        />
      </WorkArea>
    </ContentInner>
  );
}

export default MyScreen;
```

### 3.2 P04 · 수평 스플릿 마스터-디테일

```jsx
import { SplitPanel } from '@zionex/wingui-core';

function MyScreen() {
  const [grid1, setGrid1] = useState(null); // 마스터
  const [grid2, setGrid2] = useState(null); // 디테일
  const [masterId, setMasterId] = useState(null);

  // 마스터 선택 시 디테일 로딩
  const handleMasterClick = (row) => {
    if (grid2?.isUpdated()) {
      showMessage('알림', '변경사항이 있습니다. 저장하시겠습니까?', {
        onOk: () => saveDetail().then(() => loadDetail(row.ID)),
        onCancel: () => loadDetail(row.ID),
      });
    } else {
      loadDetail(row.ID);
    }
  };

  const loadDetail = (id) => {
    setMasterId(id);
    callService('SP_UI_CM_<NO>_Q2', { masterId: id })
      .then((data) => grid2?.setRows(data));
  };

  return (
    <ContentInner>
      <SearchArea>{/* ... */}</SearchArea>
      <WorkArea>
        <SplitPanel sizes={[40, 60]} minSize={200}>
          <BaseGrid
            columns={masterItems}
            afterCreate={setGrid1}
            onCellClicked={handleMasterClick}
          />
          <BaseGrid
            columns={detailItems}
            afterCreate={setGrid2}
          />
        </SplitPanel>
      </WorkArea>
    </ContentInner>
  );
}
```

### 3.3 P03 · 검색+탭 그리드/차트

```jsx
import { TabContainer } from '@zionex/wingui-core';

function MyScreen() {
  const [tabValue, setTabValue] = useState('summary');
  const [gridSummary, setGridSummary] = useState(null);
  const [gridDetail, setGridDetail] = useState(null);

  const handleTabChange = (newValue) => {
    setTabValue(newValue);
    loadData(newValue);
  };

  const loadData = (tab) => {
    const serviceId = tab === 'summary'
      ? 'SP_UI_MP_<NO>_Q1'
      : 'SP_UI_MP_<NO>_Q2';
    callService(serviceId, getValues()).then((data) => {
      if (tab === 'summary') gridSummary?.setRows(data);
      else gridDetail?.setRows(data);
    });
  };

  return (
    <ContentInner>
      <SearchArea>{/* ... */}</SearchArea>
      <WorkArea>
        <TabContainer value={tabValue} onChange={handleTabChange}
          tabs={[
            { value: 'summary', label: '요약' },
            { value: 'detail',  label: '상세' },
            { value: 'chart',   label: '차트' },
          ]}
        >
          {tabValue === 'summary' && (
            <BaseGrid columns={summaryItems} afterCreate={setGridSummary} />
          )}
          {tabValue === 'detail' && (
            <BaseGrid columns={detailItems} afterCreate={setGridDetail} />
          )}
          {tabValue === 'chart' && (
            <ChartComponent type="line" data={chartData} />
          )}
        </TabContainer>
      </WorkArea>
    </ContentInner>
  );
}
```

### 3.4 P06 · 크로스탭 피벗 입력

```jsx
// 핵심: iteration 으로 날짜 열 동적 생성
let gridItems = [
  { name: 'ITEM_CD',  fieldName: 'ITEM_CD',  header: '품목', dataType: 'text', width: 120 },
  { name: 'MEASURE',  fieldName: 'MEASURE',  header: '지표', dataType: 'text', width: 100 },
  // 시간 버킷 동적 컬럼:
  {
    iteration: { prefix: 'DATE_', delimiter: '-' },
    name: 'DATE_{idx}', fieldName: 'DATE_{idx}',
    header: '{idx}', dataType: 'number', width: 100,
    styleName: 'editable',
  },
];

function PivotEntry() {
  const [buckets, setBuckets] = useState([]);

  useEffect(() => {
    loadBuckets().then(setBuckets);
  }, []);

  // 버킷 타입(W/M/Q) 변경 시 컬럼 재생성
  const handleBucketChange = (type) => {
    getBucketOptions(type).then((newBuckets) => {
      setBuckets(newBuckets);
      grid1.setColumns(regenerateColumns(newBuckets));
    });
  };

  return (
    <ContentInner>
      <SearchArea>{/* PlanScope, Item, Period */}</SearchArea>
      <WorkArea>
        <ButtonArea>
          <BucketTypeSelector onChange={handleBucketChange} />
          <VersionDropdown />
          <GridSaveButton grid={grid1} />
          <GridExcelExportButton grid={grid1} />
          <GridExcelImportButton grid={grid1} />
        </ButtonArea>
        <BaseGrid columns={gridItems} afterCreate={setGrid1} />
      </WorkArea>
    </ContentInner>
  );
}
```

### 3.5 P01 · 위젯 대시보드

```jsx
import DashboardPanel from '@zionex/wingui-core/component/dashboard/DashboardPanel';

function MyDashboard() {
  const widgets = [
    { key: 'w1', title: 'Sales KPI',       widgetId: 'W_KPI_SALES',
      'data-grid': { x: 0, y: 0, w: 4, h: 2 } },
    { key: 'w2', title: 'Forecast Trend',  widgetId: 'W_CHART_FORECAST',
      'data-grid': { x: 4, y: 0, w: 8, h: 4 } },
    { key: 'w3', title: 'Top Items',       widgetId: 'W_GRID_TOP_ITEMS',
      'data-grid': { x: 0, y: 2, w: 4, h: 2 } },
    { key: 'w4', title: 'Supply Map',      widgetId: 'W_MAP_SUPPLY',
      'data-grid': { x: 0, y: 4, w: 12, h: 4 } },
  ];

  return (
    <ContentInner>
      <DashboardPanel
        widgets={widgets}
        isResizable={false}
        isDraggable={false}
      />
    </ContentInner>
  );
}
```

## 4. 파일 배치 규칙

### 4.1 경로 구조

```
t3series-wingui/packages/wingui/src/view/
  └── <module>/                    ← 모듈 (baselineforecast, demandplan, masterplan, ...)
      └── <category>/              ← 카테고리 (master, entry, report, version, analysis)
          └── <name>/              ← 화면 이름 (lowercase)
              ├── <Name>.jsx       ← 화면 컴포넌트 (PascalCase)
              ├── Base<Name>.jsx   ← (선택) Base 래핑
              └── <Name>.css       ← (선택) 스타일
```

### 4.2 명명 예시

| 업무 | 경로 |
|-----|------|
| DP 수요 입력 | `view/demandplan/entry/entry/Entry.jsx` (+ `BaseEntry.jsx`) |
| MP 결과 분석 | `view/masterplan/analysisreport/mpresult/MpResult.jsx` |
| BF 컨트롤보드 | `view/baselineforecast/version/controlboard/ControlBoard.jsx` |
| System 공통코드 | `view/system/commoncode/CommonCode.jsx` |

### 4.3 위젯 (대시보드용)

```
view/<module>/widgets/<widget-name>/
  ├── <WidgetName>.jsx
  └── (ContentInner 없이 직접 차트·그리드 렌더)
```

---

## 5. 라우팅·메뉴 등록

### 5.1 DB 메뉴 등록
```sql
INSERT INTO TB_AD_MENU (MENU_CD, MENU_NM, PARENT_MENU_CD, URL, ...) VALUES
('SCREEN_CODE', '화면명', 'PARENT_CD', '/path/to/screen', ...);
```

### 5.2 권한 부여
```sql
INSERT INTO TB_AD_PERMISSION (GROUP_ID, MENU_CD, ...) VALUES
('ADMIN',  'SCREEN_CODE', ...),
('USER',   'SCREEN_CODE', ...);
```

### 5.3 프런트엔드 라우트 매핑
라우트 매핑은 프레임워크의 메뉴-URL 자동 매핑으로 처리되므로, 일반적으로 추가 코드는 필요 없음. 화면 파일을 규약에 맞게 배치하면 자동 로드됨.

> 라우트 자동 매핑 상세 로직은 `src/common/` 및 `src/App.js` 참조.

---

## 6. Stored Procedure 연결

### 6.1 SP 네이밍 규약
[database/procedures.md](../database/procedures.md) 참조.

```
SP_UI_<DOMAIN>_<SCREEN_NO>_<ACTION>[번호]
```

- `DOMAIN`: BF, CM, DP, IM, MP, RP, SA, SO, FP, DPD 등
- `SCREEN_NO`: 화면 번호 (`00`, `01`, ... 또는 기능 이름)
- `ACTION`:
  - `Q1`, `Q2`: Query (SELECT)
  - `S1`, `S2`: Save (INSERT/UPDATE)
  - `D1`, `D2`: Delete
  - `POP_Q1`, `POP_S1`: 팝업용
  - `CHART_Q1`: 차트 데이터
  - `BATCH`: 배치

### 6.2 예시

| 목적 | SP 이름 |
|-----|---------|
| 목록 조회 | `SP_UI_CM_50_Q1` |
| 상세 조회 | `SP_UI_CM_50_Q2` |
| 저장 | `SP_UI_CM_50_S1` |
| 삭제 | `SP_UI_CM_50_D1` |
| 팝업 조회 | `SP_UI_CM_50_POP_Q1` |
| 엑셀 다운용 | `SP_UI_CM_50_Q3` |

### 6.3 프런트엔드 호출

```jsx
callService('SP_UI_CM_50_Q1', {
  paramA: 'value1',
  paramB: 'value2',
}).then((data) => {
  grid1?.setRows(data);
});
```

---

## 7. 온톨로지 등록

[database/ontology-rule.md](../database/ontology-rule.md) 참조.

자연어 질의 대응 화면은 **반드시** View 온톨로지 등록 필요:

```sql
-- 1. View 온톨로지에 화면 추가
INSERT INTO tb_is_vwbusnss_ontlgy (id, menu_cd, llm_infrrd, business_ontlgy, status, version)
VALUES (
  NEWID(),
  'SCREEN_CODE',
  '{}',  -- LLM 이 자동 추론
  '{...}',  -- 화면 의도·데이터·쿼리 JSON
  'DRAFT',
  1
);

-- 2. 관련 엔티티 등록
INSERT INTO tb_is_ontlgy_entity (id, version, name, entity_type, menu_cd, attributes, tables, status)
VALUES (
  'ENTITY_ID',
  'v1',
  '엔티티명',
  'business_entity',
  'SCREEN_CODE',
  '["COL_A", "COL_B"]',
  '{"tables": ["TB_CM_XXX"]}',
  'CANDIDATE'  -- 검토 후 CONFIRMED 로 전환
);
```

이후 LLM 자동 추론 (`llm_screen_contract`, `llm_intent_list`, `llm_querydsl_list`) 실행 → 검증 → `status='UPTODATE'`, `published_version` 설정.

---

## 8. 최종 점검 체크리스트

배포 전 확인:

- [ ] `ContentInner` 로 감쌌는가?
- [ ] `gridItems` 를 컴포넌트 밖에 선언했는가?
- [ ] `setViewInfo` 로 글로벌 버튼 등록했는가? (search, save 등)
- [ ] `afterCreate` 에서 그리드 객체 저장했는가?
- [ ] 조회 API (`SP_UI_*_Q1`) 실제 호출 확인했는가?
- [ ] 저장 API (`SP_UI_*_S1`) 실제 호출 확인했는가?
- [ ] `isUpdated()` 로 미저장 경고 처리했는가?
- [ ] 다국어 메시지 (`t(...)`) 사용했는가?
- [ ] 에러 처리 / 빈 데이터 처리 / 로딩 인디케이터 있는가?
- [ ] `TB_AD_MENU` 등록·권한 부여 완료했는가?
- [ ] 온톨로지 등록 (자연어 질의 대상인 경우) 완료했는가?
- [ ] 엑셀 다운/업로드 동작하는가? (해당 시)
- [ ] 개인화 (`PopPersonalize`) 연결했는가? (해당 시)
- [ ] 로그 (`SP_CM_LOG`) 기록 되는가?

---

## 참조

- 패턴 카탈로그: [README.md](./README.md)
- 컴포넌트 인벤토리: [components-inventory.md](./components-inventory.md)
- SP 카탈로그: [../database/procedures.md](../database/procedures.md)
- 테이블 카탈로그: [../database/tables.md](../database/tables.md)
- 온톨로지 규칙: [../database/ontology-rule.md](../database/ontology-rule.md)
- t3series-wingui 기술 스택: [../tech-stack/t3series-wingui.md](../tech-stack/t3series-wingui.md)

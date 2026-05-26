# 20. KTNG 화면 개발

> KTNG 신규 화면 작성 절차 + 표준 골격. Composer/wingui 본가의 9-Step Wizard 와 무관 (수동 개발).

## 1. 결정 플로우

```
요구사항 확정
  ↓
Step 1. 도메인 결정  (BF · CM · DP · IM · MP · RPT)
Step 2. 다음 번호 부여  (UI_<DOMAIN>_KTNG_<NN> — 기존 번호 +1)
Step 3. 표준 원본 복사
        - 마스터 CRUD: view/ktng/baselineforecast/master/bfktng01/BfKtng01.jsx
        - 리포트:      view/ktng/baselineforecast/report/bfktng03/BfKtng03.jsx
        - 콘트리뷰션:  view/ktng/contributionmargin/cmktng01/CmKtng01.jsx
Step 4. 21-components.md 에서 필요 위젯 선택
Step 5. SP 작성  (SP_UI_<DOMAIN>_KTNG_<NN>_<Q1|S1|D1|POP_Q1>)
Step 6. Controller 작성  (web/ktng/<domain>/<cat>/<Prefix>Ktng<NN>Controller.java)
Step 7. 메뉴 등록 SQL  (TB_AD_MENU + TB_AD_LANG_PACK + TB_AD_PERMISSION_GROUP)
```

## 2. 파일 배치 규약

### 2.1 JSX (Frontend)

```
packages/wingui/src/view/ktng/<도메인>/<카테고리>/<feature>/
  ├── <Prefix>Ktng<NN>.jsx       — 메인 화면 (PascalCase + 2자리 번호)
  ├── Pop<Prefix>Ktng<NN>.jsx    — 팝업 (필요 시)
  └── <Prefix>Ktng<NN>.css       — 화면 전용 스타일 (필요 시)
```

- **도메인**: `baselineforecast`, `contributionmargin`, `demandplan`, `inventoryplan`, `masterplan`, `report`, `supplychainmodel`, `system`
- **카테고리** (도메인마다 다름): `master`, `report`, `entry`, `analysis`, `simulation`, `common`
- **feature 폴더명**: lowercase concat (예: `bfktng01`)
- **파일명**: PascalCase + 2자리 번호 (예: `BfKtng01`)

### 2.2 Java (Backend)

```
src/main/java/com/zionex/t3series/web/ktng/<도메인>/<카테고리>/
  └── <Prefix>Ktng<NN>Controller.java
```

- **<Prefix>** 매핑:
  - `Bf` ↔ baselineforecast
  - `Cm` ↔ contributionmargin
  - `Dp` ↔ demandplan
  - `Im` ↔ inventoryplan
  - `Mp` ↔ masterplan
  - `Rpt` ↔ report
- **Service/Repository/Entity 분리는 KTNG 에서 거의 안 함** — Controller 가 직접 `QueryHandler` 호출

## 3. JSX 표준 골격 (BfKtng01 기준)

### 3.1 Import 블록

```jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Box } from '@mui/material';
import {
  ContentInner, ViewPath, ResultArea, SearchArea, StatusArea,
  ButtonArea, LeftButtonArea, RightButtonArea, SearchRow,
  InputField, CommonButton,
  GridExcelExportButton, GridExcelImportButton,
  GridAddRowButton, GridDeleteRowButton, GridSaveButton,
  BaseGrid, PopupDialog, GridCnt,
  useViewStore, useContentStore, useStyles, zAxios, useUserStore,
  WorkArea,
} from "@wingui/common/imports";
import { onErrorInput } from "@zionex/wingui-core/utils/common";
import { validateDateRange, loadComboList, baseURI } from "@wingui/common/common";
import { transLangKey } from "@zionex/wingui-core";
import { HTTP_STATUS } from "@wingui/common/constants";
import { showMessage } from "@wingui/common/showMessage";
import PopBfKtng01 from "./PopBfKtng01";
import "./BfKtng01.css";
```

⚠️ KTNG 코드는 일부 import 가 다양하게 흩어져 있으므로 **참조 원본 파일의 import 블록을 그대로 복제** 후 필요한 것만 추가/제거.

### 3.2 gridItems 정의 — 컴포넌트 밖

```jsx
let grid1Items = [
  {name: 'ORG', dataType: 'group', orientation: 'horizontal', headerText: 'ORG',
    childs: [
      {name: "SALES_ORG", dataType: "text", headerText: "SALES_ORG", visible: true, editable: false, width: 80, textAlignment: "center", groupShowMode: "always"},
    ]
  },
  {name: "ACCOUNT_CD", dataType: "text", headerText: "ACCOUNT", width: 80, textAlignment: "near",
    validRules: [{ criteria: "required" }],
    exportStyleName: "excel-req-column-left",
    styleCallback: function (grid, dataCell) {
      let ret = {};
      if (dataCell.item.rowState == "created") {
        ret.editable = true;
        ret.styleName = "editable-column column-textAlignt-near";
      } else {
        ret.editable = false;
        ret.styleName = "column-textAlignt-near";
      }
      return ret;
    },
  },
  {name: "START_DT", dataType: "datetime", headerText: "START_DT", timezone: true,
    width: 80, textAlignment: "center", displayType: "date",
    validRules: [{ criteria: "required" }]},
];
```

**KTNG 의 컬럼 특징**:
- `dataType: 'group'` 으로 컬럼 그룹화 (`childs`) 가 흔함
- `styleCallback` 으로 신규행만 편집 가능하게 조건부 스타일 적용
- `validRules: [{criteria: "required"}]` + `exportStyleName` 페어로 엑셀까지 일관

### 3.3 zAxios 호출

```jsx
// 조회 — POST + JSON body
const loadData = () => {
  const param = {
    P_SALES_ORG_CD: getValues('salesOrg'),
    P_START_DT: getValues('startDt').format('yyyyMMdd'),
    // ...
  };
  zAxios({
    method: 'post',
    headers: { 'content-type': 'application/json' },
    url: baseURI() + 'baselineforecast/master/bfktng01/q1',
    data: param,
  })
  .then(res => {
    if (res.status === HTTP_STATUS.SUCCESS) {
      grid1.dataProvider.fillJsonData(res.data);
    }
  })
  .catch(err => console.log(err));
};

// 저장 — POST + changeRowData 배열 (JSON body)
function saveData() {
  grid1.gridView.commit(true);
  showMessage(transLangKey('MSG_CONFIRM'), transLangKey('MSG_SAVE'), function (answer) {
    if (answer) {
      let changes = [];
      changes = changes.concat(
        grid1.dataProvider.getAllStateRows().created,
        grid1.dataProvider.getAllStateRows().updated,
        grid1.dataProvider.getAllStateRows().deleted,
      );
      let changeRowData = [];
      changes.forEach(row => {
        changeRowData.push(grid1.dataProvider.getOutputRow({booleanFormat: 'N:Y'}, row));
      });

      zAxios({
        method: 'post',
        headers: { 'content-type': 'application/json' },
        url: baseURI() + 'baselineforecast/master/bfktng01/s1',
        data: changeRowData,
      })
      .then(() => {
        showMessage(transLangKey('MSG_CONFIRM'), transLangKey('MSG_0001'), { close: false });
        loadData();
      });
    }
  });
}
```

### 3.4 공통코드 콤보 로드

```jsx
const loadCombo = async () => {
  const salesOrgList = await loadComboList({
    PROCEDURE_NAME: "SP_COMM_KTNG_COMBO_LIST",
    URL: "common/data",
    CODE_KEY: "CD",
    CODE_VALUE: "CD_NM",
    ALLFLAG: false,
    PARAM: { P_TYPE: "SALES_ORG_DO" },
  });
  if (salesOrgList.length > 0) {
    setSalesOrgOptions(salesOrgList);
    setValue("salesOrg", salesOrgList[0].value);
  }
};
```

### 3.5 afterGridCreate — 그리드 옵션 설정

```jsx
const afterGrid1Create = (gridObj, gridView, dataProvider) => {
  gridView.setDisplayOptions({ fitStyle: 'fill' });
  setVisibleProps(gridObj, true, true, true);  // 번호, 상태, 체크박스
  setGrid1(gridObj);

  gridView.excelExportOptions = {
    footer: 'default',
    allColumns: false,
    lookupDisplay: false,
    separateRows: true,
  };

  gridView.onCellButtonClicked = (grid, itemIndex, column) => {
    gridView.commit();
    if (column.fieldName === "ITEM_LV3_CD") {
      const rowState = grid.getDataSource().getRowState(itemIndex.dataRow);
      if (rowState == "created") setItemPopupOpen(true);
    }
  };
};
```

## 4. Controller 표준 골격 (BfKtng01Controller 기준)

```java
package com.zionex.t3series.web.ktng.baselineforecast.master;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.zionex.t3series.web.constant.ServiceConstants;
import com.zionex.t3series.web.domain.admin.user.UserService;
import com.zionex.t3series.web.util.interceptor.ExecPermission;
import com.zionex.t3series.web.util.query.QueryHandler;

import jakarta.persistence.ParameterMode;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
public class BfKtng01Controller {

    private final UserService userService;

    @Autowired
    QueryHandler queryHandler;

    // ─── 조회 ────────────────────────────────────────────────────────
    @ExecPermission(menuCd = "UI_BF_KTNG_01", type = ServiceConstants.PERMISSION_TYPE_READ)
    @PostMapping("/baselineforecast/master/bfktng01/q1")
    public List<Map<String, Object>> getData1(
        @RequestBody Map<String, Object> params, HttpServletRequest request) throws Exception {
        return queryHandler.getList("SP_UI_BF_KTNG_01_Q1", params);
    }

    // ─── 팝업 조회 ────────────────────────────────────────────────────
    @ExecPermission(menuCd = "UI_BF_KTNG_01", type = ServiceConstants.PERMISSION_TYPE_READ)
    @PostMapping("/baselineforecast/master/bfktng01/popq1")
    public List<Map<String, Object>> getPopupData1(
        @RequestBody Map<String, Object> params, HttpServletRequest request) throws Exception {
        return queryHandler.getList("SP_UI_BF_KTNG_01_POP_Q1", params);
    }

    // ─── 공통코드 조회 ────────────────────────────────────────────────
    @ExecPermission(menuCd = "UI_BF_KTNG_01", type = ServiceConstants.PERMISSION_TYPE_READ)
    @PostMapping("/baselineforecast/master/bfktng01/codeq1")
    public List<Map<String, Object>> getCodeData1(
        @RequestBody Map<String, Object> params, HttpServletRequest request) throws Exception {
        return queryHandler.getList("SP_COMM_KTNG_COMBO_LIST", params);
    }

    // ─── 저장 ────────────────────────────────────────────────────────
    @ExecPermission(menuCd = "UI_BF_KTNG_01", type = ServiceConstants.PERMISSION_TYPE_UPDATE)
    @PostMapping("/baselineforecast/master/bfktng01/s1")
    public Map<String, Object> saveData1(
        @RequestBody List<Map<String, Object>> changes, HttpServletRequest request) throws Exception {

        String username = userService.getUserDetails().getUsername();
        Map<String, Object> resultMap = new HashMap<>();

        for (Map<String, Object> params : changes) {
            Map<String, Object> param = new HashMap<>();
            param.put("P_ACCOUNT_CD", new Object[] { params.get("ACCOUNT_CD"), String.class, ParameterMode.IN });
            param.put("P_ITEM_LV_3_CD", new Object[] { params.get("ITEM_LV3_CD"), String.class, ParameterMode.IN });
            param.put("P_START_DT", new Object[] { params.get("START_DT"), String.class, ParameterMode.IN });
            param.put("P_USER_ID", new Object[] { username, String.class, ParameterMode.IN });
            // ...
            Map<String, Object> result = queryHandler.save("SP_UI_BF_KTNG_01_S1", param);
            resultMap.putAll(result);
        }
        return resultMap;
    }

    // ─── 삭제 ────────────────────────────────────────────────────────
    @ExecPermission(menuCd = "UI_BF_KTNG_01", type = ServiceConstants.PERMISSION_TYPE_UPDATE)
    @PostMapping("/baselineforecast/master/bfktng01/d1")
    public Map<String, Object> deleteData1(
        @RequestBody List<Map<String, Object>> changes, HttpServletRequest request) throws Exception {
        Map<String, Object> resultMap = new HashMap<>();
        for (Map<String, Object> params : changes) {
            Map<String, Object> param = new HashMap<>();
            param.put("P_ACCOUNT_CD", new Object[] { params.get("ACCOUNT_CD"), String.class, ParameterMode.IN });
            // ...
            Map<String, Object> result = queryHandler.save("SP_UI_BF_KTNG_01_D1", param);
            resultMap.putAll(result);
        }
        return resultMap;
    }
}
```

### 4.1 QueryHandler 호출 패턴

| 메서드 | 용도 | 반환 |
|---|---|---|
| `queryHandler.getList(spName, params)` | 조회 (SP_UI_*_Q1, POP_Q1, CODE) | `List<Map<String, Object>>` |
| `queryHandler.save(spName, paramMap)` | 저장/삭제 (SP_UI_*_S1, _D1) | `Map<String, Object>` |

**파라미터 형식** (저장 시):
```java
param.put("P_<COLUMN>", new Object[] { value, <Type>.class, ParameterMode.IN });
```
- `<Type>.class`: `String.class` · `BigDecimal.class` · `Integer.class` · `java.sql.Date.class`
- ParameterMode: 거의 항상 `IN`

## 5. 메뉴 등록 SQL

```sql
-- (1) 메뉴
INSERT INTO TB_AD_MENU (
    ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN, CREATE_BY, CREATE_DTTM
)
SELECT
    REPLACE(NEWID(), '-', ''),
    (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'MENU_BF'),   -- 부모 메뉴 그룹
    'UI_BF_KTNG_04',
    N'기준예측 > KTNG 04 화면',
    410,
    '/baselineforecast/master/BfKtng04',                       -- JSX 경로 (PascalCase)
    'Y', 'admin', GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM TB_AD_MENU WHERE MENU_CD = 'UI_BF_KTNG_04');

-- (2) 다국어 (ko/en)
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM)
SELECT 'ko', 'UI_BF_KTNG_04', N'KTNG 04 화면', 'admin', GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM TB_AD_LANG_PACK WHERE LANG_CD='ko' AND LANG_KEY='UI_BF_KTNG_04');

INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM)
SELECT 'en', 'UI_BF_KTNG_04', 'KTNG 04 Screen', 'admin', GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM TB_AD_LANG_PACK WHERE LANG_CD='en' AND LANG_KEY='UI_BF_KTNG_04');

-- (3) 권한 (형제 메뉴 복사)
DECLARE @SRC CHAR(32) = (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'UI_BF_KTNG_03');
DECLARE @NEW CHAR(32) = (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'UI_BF_KTNG_04');

INSERT INTO TB_AD_PERMISSION_GROUP (ID, GRP_ID, MENU_ID, PERMISSION_TP, USABILITY, CREATE_BY, CREATE_DTTM)
SELECT REPLACE(NEWID(),'-',''), p.GRP_ID, @NEW, p.PERMISSION_TP, p.USABILITY, 'admin', GETDATE()
FROM TB_AD_PERMISSION_GROUP p
WHERE p.MENU_ID = @SRC
  AND NOT EXISTS (
      SELECT 1 FROM TB_AD_PERMISSION_GROUP x
       WHERE x.MENU_ID = @NEW AND x.GRP_ID = p.GRP_ID AND x.PERMISSION_TP = p.PERMISSION_TP
  );
```

## 6. 체크리스트 (출력 직전)

- [ ] MENU_CD = `UI_<DOMAIN>_KTNG_<NN>`?
- [ ] Java 패키지 `com.zionex.t3series.web.ktng.<도메인>.<카테고리>`?
- [ ] JSX 경로 `view/ktng/<도메인>/<카테고리>/<feature>/<File>.jsx`?
- [ ] Controller 모든 엔드포인트에 `@ExecPermission(menuCd, type)`?
- [ ] 모두 `@PostMapping` (GET 안 씀)?
- [ ] `QueryHandler.getList/save` (JdbcTemplate 직접 사용 X)?
- [ ] 저장은 `@RequestBody List<Map<String,Object>> changes`?
- [ ] SP 네이밍 `SP_UI_<DOMAIN>_KTNG_<NN>_<ACTION>`?
- [ ] BaseGrid `items={...} afterGridCreate={...}`?
- [ ] gridItems 컴포넌트 밖 선언 + 모든 컬럼 `dataType` 명시?
- [ ] zAxios URL 이 Controller `@PostMapping` 과 1:1?
- [ ] TB_AD_MENU INSERT + TB_AD_LANG_PACK (ko/en) + TB_AD_PERMISSION_GROUP?
- [ ] jakarta.* import (javax.* 없음)?

# 20. 신규 화면 추가 절차 (PlanNEL)

> **PlanNEL 화면 = 4단계 backend (Entity / Repository / Service / Controller) + 1단계 frontend (page + service) + 메뉴 등록 (TabMenuList.js + i18n)**.
> 표준 원본: `pages/data-management/CustomerMaster.js` + `controller/WorkcenterController.java`.

## 0. 전체 단계

```
1. (DB) DDL 추가 — Liquibase changelog (z_<table>) 또는 직접 PostgreSQL
2. Backend Entity (saas-application/.../model/<Name>.java)         @Entity @Table("z_<name>") extends BaseEntity
3. Backend DTO     (saas-application/.../dto/<Name>Dto.java)        + DtoConvertable
4. Backend Repository (saas-application/.../repository/<Name>Repository.java)        JpaRepository
   (필요 시) <Name>QueryRepository.java                              QueryDSL 동적 쿼리
   (필요 시) src/main/resources/mapper/<area>/<Name>Mapper.xml      MyBatis (복잡한 SQL)
5. Backend Service (saas-application/.../service/<Name>Service.java)
6. Backend Controller (saas-application/.../controller/<Name>Controller.java)        @RestController @RequestMapping("/api") @PreAuthorize
7. Frontend service (saas-web/src/services/<area>/<name>-service.js)                  axios wrapper
8. Frontend page (saas-web/src/pages/<area>/<Name>.js)                                AG-Grid + FilterContainer + Action buttons
9. Frontend menu (saas-web/src/pages/TabMenuList.js)                                   lv3MenuList 에 entry 추가
10. i18n (saas-web/src/assets/data/l10n/translation.<lang>.js)                          6언어 키 추가
```

## 1. 파일 배치

| 영역 | 경로 |
|---|---|
| Entity | `saas-application/src/main/java/t3series/saas/model/<Name>.java` |
| DTO | `saas-application/src/main/java/t3series/saas/dto/<Name>Dto.java` |
| Repository | `saas-application/src/main/java/t3series/saas/repository/<Name>Repository.java` |
| QueryRepository (선택) | `saas-application/src/main/java/t3series/saas/repository/<Name>QueryRepository.java` |
| MyBatis mapper (선택) | `saas-application/src/main/java/t3series/saas/mapper/<area>/<Name>Mapper.java` + `src/main/resources/mapper/<area>/<Name>Mapper.xml` |
| Service | `saas-application/src/main/java/t3series/saas/service/<Name>Service.java` |
| Controller | `saas-application/src/main/java/t3series/saas/controller/<Name>Controller.java` |
| Frontend service | `saas-web/src/services/<area>/<kebab-name>-service.js` (area: `data` / `system` / `dp` / `ip` / `rp` / `mp` / `dashboard`) |
| Frontend page | `saas-web/src/pages/<area>/<PascalName>.js` |
| Liquibase changelog | `saas-application/src/main/resources/db/changelog/...` |

## 2. TabMenuList.js 등록

신규 화면이 어느 lv1/lv2 에 속하는지 결정 후 **3곳** 수정:
`saas-web/src/pages/TabMenuList.js`

### 2.1 상단 import (~60줄 부근)

```js
import NewItemMaster from "./data-management/NewItemMaster";
```

### 2.2 `lv3MenuList` 의 그룹 배열에 entry 추가

```js
const lv3MenuList = {
  // ...
  DATA_MGMT: [
    {
      key: 130,                                  // 기존과 중복 안 되는 정수 (data-mgmt 100~199)
      reduxKey: "INPUT_NEW_ITEM",                // = viewName. UPPER_SNAKE
      title: "newItemMaster",                    // i18n key (camelCase)
      icon: <LeafIcon />,                         // 또는 다른 MUI Icon
      groupType: MENU_GROUP.MASTER,              // CONFIG / MASTER / RELATION / PLANNING / TRANSACTION
      appRoles: ["ROLE_APP_DP", "ROLE_APP_IP"],  // 어느 모듈에서 보일지 (생략 시 모든 모듈)
      userRoles: ["ROLE_ADMIN", "ROLE_DP_MGR"],   // (생략 시 부모 lv1 의 userRoles 상속)
      component: <NewItemMaster viewName={"INPUT_NEW_ITEM"} title="newItemMaster" />,
    },
  ],
};
```

### 2.2.1 key 번호 컨벤션

| 번호 범위 | 도메인 |
|---|---|
| 100~999 | Master Data (data-management) |
| 400~421 | System (admin) |
| 1000~1999 | Inventory Plan |
| 2000~2999 | Demand Plan |
| 3000~3999 | Replenishment Plan |
| 4000~4999 | Master Plan |
| 9000~9999 | Dashboard / Analytics |

### 2.2.2 MENU_GROUP 5종 (data-management 내부 정렬용)

```js
const MENU_GROUP = {
  CONFIG: "configurationData",
  MASTER: "masterData",
  RELATION: "relationalData",
  PLANNING: "planningData",
  TRANSACTION: "transactionalData",
};
```

### 2.3 i18n 등록

`saas-web/src/assets/data/l10n/translation.<lang>.js` 의 `menu` 섹션에 키 추가 (6언어):
- ko-KR · en-US · ja-JP · zh-TW · zh-CN · vi-VN

```js
// translation.ko-kr.js menu 섹션
menu: {
  newItemMaster: "신규 항목",
  // ...
}
```

### 2.4 lv1/lv2 메뉴 (이미 있는 것 재사용)

신규 화면용 lv1/lv2 가 필요하지 않은 한 기존 entry 사용. 기존 lv1MenuList:
- `DASHBOARD` (key: 9999)
- `DEMAND_PLAN` (key: 1) — `ROLE_APP_DP`
- `INVENTORY_PLAN` (key: 2) — `ROLE_APP_IP`
- `REPLENISHMENT_PLAN` (key: 3) — `ROLE_APP_RP`
- `MASTER_PLAN` (key: 4) — `ROLE_APP_MP`
- `DATA_INTEGRATION` (key: 5)
- `USER_ACCOUNT` (key: 6)
- `ANALYTICS_REPORT` (key: 9000)

기존 lv2 예시 (INVENTORY_PLAN 의 sub):
- `SUBMENU_IP_SETTINGS` · `IP_PLAN` · `INV_ANALYSIS_MONITORING`

---

## 3. 페이지 컴포넌트 골격 (마스터 CRUD)

표준 원본: `saas-web/src/pages/data-management/CustomerMaster.js`

```jsx
import { useEffect, useMemo, useRef, useState } from "react";

import { AgGridReact } from "@ag-grid-community/react";
import Box from "@mui/material/Box";

import { useDispatch } from "react-redux";
import { withTranslation } from "react-i18next";
import { isEmpty } from "lodash";

import newItemService from "@plannel/services/data/new-item-service";
import DefaultGridSetting from "@plannel/components/aggrid/DefaultGridSetting";
import DataState from "@plannel/components/aggrid/DataState";
import GridUtils from "@plannel/components/aggrid/GridUtils";
import { AddButton, RemoveButton, SaveButton, FilterButton } from "@plannel/components/ActionIconButton";
import FilterContainer from "@plannel/components/layout/FilterContainer";
import PaginationContainer from "@plannel/components/PaginationContainer";
import Dialog from "@plannel/components/Dialog";
import Snackbar from "@plannel/components/Snackbar";
import ExcelExportButton from "@plannel/components/ExcelExportButton";
import AdvancedFilter from "@plannel/components/filter/AdvancedFilter";
import reduxUtil from "@plannel/utils/redux-util";
import dateUtils from "@plannel/utils/date-util";

const NewItemMaster = ({ t, viewName, title }) => {
  // (1) Redux 상태 복원
  const reduxViewState = reduxUtil.getViewState(viewName);
  const reduxDispatch = useDispatch();

  // (2) Pagination state
  const pageSizes = [100, 200, 500];
  const [currentPage, setCurrentPage] = useState(reduxViewState?.page ?? 1);
  const [pageSize, setPageSize]       = useState(reduxViewState?.pageSize ?? pageSizes[0]);
  const [tPages, setTotalPages]       = useState(0);
  const [sortParams, setSortParams]   = useState({});

  // (3) 알림 / 다이얼로그
  const [snackInfo, setSnackInfo]     = useState({ open: false, severity: "", content: "" });
  const [dialogInfo, setDialogInfo]   = useState({ open: false, title: "", content: "" });

  // (4) Grid + 데이터
  const gridRef = useRef();
  const [rows, setRows] = useState([]);
  const [gridLoading, setGridLoading] = useState(false);

  // (5) 검색조건 ref + AdvancedFilter
  const codeSearch = useRef(reduxViewState?.searchCode ?? "");
  const [advancedFilters, setAdvancedFilters]
    = useState(reduxViewState?.advancedFilters ?? null);
  const [openFilter, setOpenFilter] = useState(false);
  const [advancedFilterColor, setAdvancedFilterColor]
    = useState(!isEmpty(reduxViewState?.advancedFilters) ? "info" : "default");

  // (6) AG-Grid default props (1회만)
  const defaultGridMemo = useMemo(
    () => DefaultGridSetting({ title, viewName }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // (7) 컬럼 정의 — type/filterType/cellClass 표준 attribute 활용
  const columnDefs = [
    { headerName: "itemCd",   field: "itemCd",   checkboxSelection: true, headerCheckboxSelection: true,
      filterType: 'string', cellClass: 'stringType' },
    { headerName: "name",     field: "name",     filterType: 'string' },
    { headerName: "qty",      field: "qty",      type: ["rightAligned"], filterType: 'number' },
    { headerName: "activeFlg", field: "activeFlg", type: ["booleanColumn"], width: 80, filterType: 'boolean' },
    { headerName: "createdTs", field: "createdTs", type: ["nonEditableColumn"],
      valueFormatter: dateUtils.formatDateTime, filterType: "timestamp" },
  ];

  // (8) 요청 파라미터 빌더
  const getRequestParams = () => {
    const params = {
      page: currentPage - 1,
      pageSize,
      pagination: true,
      ...sortParams,
    };
    const searchFilters = {};
    if (codeSearch.current) searchFilters.itemCd = codeSearch.current;
    if (!isEmpty(searchFilters)) params.searchFilters = searchFilters;
    if (advancedFilters?.children?.length) params.advancedFilters = advancedFilters;
    return params;
  };

  // (9) 조회
  const retrieve = () => {
    newItemService.getAll(getRequestParams()).then((res) => {
      const { results, totalPages } = res.data ?? {};
      setRows(results || []);
      setTotalPages(totalPages || 0);
    });
  };

  const onGridReady = (params) => {
    DataState.initialize(params.api);     // 행 변경 추적 init
    setGridLoading(true);
  };

  useEffect(() => {
    if (gridLoading) retrieve();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridLoading, currentPage, pageSize]);

  // (10) 행 추가
  const addRow = () => {
    DataState.setDataState(GridUtils.addRow(gridRef.current.api, {
      id: null, itemCd: "", name: "", qty: 0, activeFlg: true, delFlg: false, verNum: 0,
    }));
  };

  // (11) 저장 — DataState 가 created/updated 분리
  const handleSave = () => {
    const created = DataState.getStateData(gridRef.current.api, "created");
    const updated = DataState.getStateData(gridRef.current.api, "updated");
    const changes = [...(created ?? []), ...(updated ?? [])];
    if (changes.length === 0) {
      setSnackInfo({ open: true, severity: "info", content: t("MSG_NoChanges") });
      return;
    }
    newItemService.upsert(changes).then(() => {
      setSnackInfo({ open: true, severity: "success", content: t("MSG_SaveSuccess") });
      retrieve();
    });
  };

  // (12) 삭제
  const handleDelete = () => {
    const selected = gridRef.current.api.getSelectedRows();
    if (selected.length === 0) return;
    setDialogInfo({
      open: true, title: "delete", content: t("MSG_ConfirmDelete"),
      action: () => {
        const ids = selected.map((r) => r.id).filter(Boolean).join(",");
        if (!ids) return;
        newItemService.remove(ids).then(() => {
          setSnackInfo({ open: true, severity: "success", content: t("MSG_DeleteSuccess") });
          retrieve();
        });
      },
    });
  };

  return (
    <>
      <FilterContainer>
        {/* 검색조건 컴포넌트 (filter/ 디렉토리에서 선택) */}
        <Box sx={{ ml: "auto" }}>
          <ExcelExportButton title={title} service={newItemService} params={getRequestParams()} columnDefs={columnDefs} />
          <AddButton onClick={addRow} />
          <RemoveButton onClick={handleDelete} />
          <SaveButton onClick={handleSave} />
          <FilterButton label="advancedFilter" advancedFilterColor={advancedFilterColor}
                        onClick={() => setOpenFilter(!openFilter)} />
        </Box>
      </FilterContainer>
      <Box className="ag-theme-balham grid-area" mb={1}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row', height: '100%', mr: 1.5 }}>
          <Box sx={{ flexGrow: 1 }}>
            <AgGridReact
              ref={gridRef}
              rowData={rows}
              {...defaultGridMemo}
              columnDefs={columnDefs}
              onGridReady={onGridReady}
              onSortChanged={(p) => setSortParams(GridUtils.getSortState(p))}
              getRowStyle={(p) => DataState.getRowStyles(p)}
            />
          </Box>
          {openFilter && (
            <Box sx={{ width: '30%', overflowY: 'auto', ml: 1, border: 1, borderColor: "#cccccc" }}>
              <AdvancedFilter columnDefs={columnDefs} advancedFilters={advancedFilters} onApply={setAdvancedFilters} />
            </Box>
          )}
        </Box>
      </Box>
      <PaginationContainer
        currentPage={currentPage} totalPages={tPages}
        pageSize={pageSize} pageSizes={pageSizes}
        setCurrentPage={setCurrentPage} setPageSize={setPageSize}
      />
      <Dialog
        open={dialogInfo.open}
        onClose={() => setDialogInfo({ open: false, title: "", content: "" })}
        title={dialogInfo.title}
        content={dialogInfo.content}
        onHandler={() => { dialogInfo.action?.(); setDialogInfo({ open: false, title: "", content: "" }); }}
      />
      <Snackbar
        open={snackInfo.open}
        onClose={() => setSnackInfo({ ...snackInfo, open: false })}
        severity={snackInfo.severity}
        content={snackInfo.content}
      />
    </>
  );
};

export default withTranslation()(NewItemMaster);
```

---

## 4. Frontend service 골격

```js
// saas-web/src/services/data/new-item-service.js
import restApi from "@plannel/services/utils/rest-api";

const getAll       = (params) => restApi.post("/api/new-items", params);
const getAllForCSV = (params) => restApi.post("/api/new-items/csv", params);
const getLookup    = ()       => restApi.get("/api/new-items/lookup");
const get          = (id)     => restApi.get(`/api/new-items/${id}`);
const upsert       = (data)   => restApi.post("/api/new-items/save", data);
const remove       = (ids)    => restApi.delete(`/api/new-items/${ids}`);
const search       = (params) => restApi.get("/api/search/index/new-item", { params });

const newItemService = { getAll, getAllForCSV, getLookup, get, upsert, remove, search };
export default newItemService;
```

URL 컨벤션 상세는 `30-data-access.md §1.2`.

---

## 5. Backend 4종 세트 골격

### 5.1 Entity

```java
package t3series.saas.model;

import javax.persistence.*;                                                 // ★ jakarta 가 아님
import javax.validation.constraints.NotBlank;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.EqualsAndHashCode;

import t3series.saas.config.hibernate.typehandler.BooleanToYNConverter;
import t3series.saas.multi_tenancy.model.BaseEntity;

@Data
@EqualsAndHashCode(callSuper = false, exclude = {"itemHrchy"})
@Entity
@Table(name = "z_new_item")                                                  // ★ 'z_' prefix
public class NewItem extends BaseEntity implements DtoConvertable<NewItemDto> {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "item_cd")
    private String itemCd;

    @NotBlank
    private String name;

    @Column(name = "qty_num")
    private Integer qty;

    @ManyToOne
    @JoinColumn(name = "hrchy_id")
    @JsonIgnore                                                              // 양방향 순환 참조 방지
    private ItemHrchy itemHrchy;

    @Convert(converter = BooleanToYNConverter.class)                         // boolean ↔ Y/N 자동
    private boolean activeFlg;

    @Convert(converter = BooleanToYNConverter.class)
    private boolean delFlg;

    // 유연한 속성
    private String attr01;
    // ... attr02 ~ attr19
    private String attr20;

    @Override
    public NewItemDto toDto() {
        // 매핑 로직
        NewItemDto dto = new NewItemDto();
        dto.setId(this.id);
        dto.setItemCd(this.itemCd);
        dto.setName(this.name);
        dto.setQty(this.qty);
        dto.setActiveFlg(this.activeFlg);
        dto.setDelFlg(this.delFlg);
        return dto;
    }
}
```

### 5.2 DTO

```java
package t3series.saas.dto;

import lombok.Data;
import t3series.saas.model.NewItem;

import java.time.LocalDateTime;

@Data
public class NewItemDto {
    private Long id;
    private String itemCd;
    private String name;
    private Integer qty;
    private boolean activeFlg;
    private boolean delFlg;

    private String attr01; private String attr02; /* ... */ private String attr20;

    // Audit
    private int verNum;
    private LocalDateTime createdTs;
    private String createdUser;
    private LocalDateTime updatedTs;
    private String updatedUser;

    public NewItem toEntity() {
        NewItem e = new NewItem();
        e.setId(this.id);
        e.setItemCd(this.itemCd);
        e.setName(this.name);
        e.setQty(this.qty);
        e.setActiveFlg(this.activeFlg);
        e.setDelFlg(this.delFlg);
        return e;
    }
}
```

### 5.3 Repository

```java
package t3series.saas.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import t3series.saas.model.NewItem;

import java.util.Optional;

public interface NewItemRepository extends JpaRepository<NewItem, Long> {
    Optional<NewItem> findByItemCdAndDelFlgFalse(String itemCd);
}
```

복잡한 검색은 별도 `NewItemQueryRepository` (QueryDSL 사용):

```java
package t3series.saas.repository;

import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Repository;

import t3series.saas.dto.NewItemDto;
import t3series.saas.dto.SearchDto;
import static t3series.saas.model.QNewItem.newItem;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class NewItemQueryRepository {
    private final JPAQueryFactory queryFactory;

    public Page<NewItemDto> findAll(SearchDto searchDto, Pageable paging) {
        // QueryDSL 동적 쿼리 + advancedFilters 처리
        var query = queryFactory.select(Projections.fields(NewItemDto.class,
                newItem.id, newItem.itemCd, newItem.name, newItem.qty,
                newItem.activeFlg, newItem.delFlg))
            .from(newItem)
            .where(newItem.delFlg.isFalse());
        // searchDto.searchFilters 처리
        long total = query.fetchCount();
        List<NewItemDto> content = query.offset(paging.getOffset()).limit(paging.getPageSize()).fetch();
        return new PageImpl<>(content, paging, total);
    }
}
```

### 5.4 Service

```java
package t3series.saas.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import t3series.saas.dto.NewItemDto;
import t3series.saas.dto.SearchDto;
import t3series.saas.model.NewItem;
import t3series.saas.repository.NewItemRepository;
import t3series.saas.repository.NewItemQueryRepository;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class NewItemService {
    private final NewItemRepository repo;
    private final NewItemQueryRepository queryRepo;

    @Transactional(readOnly = true)
    public Page<NewItemDto> findAll(SearchDto searchDto, Pageable paging) {
        return queryRepo.findAll(searchDto, paging);
    }

    @Transactional(readOnly = true)
    public List<NewItemDto> findAll(SearchDto searchDto) {
        return queryRepo.findAll(searchDto, Pageable.unpaged()).getContent();
    }

    @Transactional
    public void upsert(List<NewItemDto> rows) {
        for (NewItemDto dto : rows) {
            NewItem e = dto.toEntity();
            repo.save(e);                    // ID 가 있으면 update, 없으면 insert
        }
    }

    @Transactional
    public void delete(List<Long> ids) {
        repo.deleteAllById(ids);
    }
}
```

### 5.5 Controller

```java
package t3series.saas.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import t3series.saas.dto.NewItemDto;
import t3series.saas.dto.SearchDto;
import t3series.saas.service.NewItemService;
import t3series.saas.util.PaginationUtil;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('APP_DP', 'APP_IP', 'APP_RP', 'APP_MP')")           // 마스터: 모든 모듈 OR
public class NewItemController {
    private final NewItemService service;

    @PostMapping("/new-items")
    public ResponseEntity<Map<String, Object>> getAll(@RequestBody(required = false) SearchDto searchDto) {
        try {
            if (searchDto == null) searchDto = new SearchDto();

            String orderBy = searchDto.getOrderByColumn() != null ? searchDto.getOrderByColumn() : "id";
            Sort sort = "asc".equals(searchDto.getSortType())
                ? Sort.by(orderBy).ascending()
                : Sort.by(orderBy).descending();

            Map<String, Object> response;
            if (searchDto.isPagination()) {
                Pageable paging = PageRequest.of(searchDto.getPage(), searchDto.getPageSize(), sort);
                Page<NewItemDto> page = service.findAll(searchDto, paging);
                response = PaginationUtil.getPageResponse(page, page.getContent());
            } else {
                List<NewItemDto> list = service.findAll(searchDto);
                response = PaginationUtil.getAllPageResponse(list);
            }
            if (response.isEmpty()) return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            log.error(e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/new-items/save")
    public ResponseEntity<?> save(@RequestBody List<NewItemDto> rows) {
        service.upsert(rows);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/new-items/{ids}")
    public ResponseEntity<?> remove(@PathVariable String ids) {
        List<Long> idList = Arrays.stream(ids.split(",")).map(Long::valueOf).toList();
        service.delete(idList);
        return ResponseEntity.ok().build();
    }
}
```

---

## 6. 절대 규칙

| ❌ 금지 | ✅ 표준 | 사유 |
|---|---|---|
| `jakarta.persistence.*` 사용 | **`javax.persistence.*`** | Spring Boot 2.4.13 — jakarta 는 SB 3.x 부터 |
| `jakarta.validation.*` | **`javax.validation.*`** | 동일 |
| 상대 경로 import (`../../services/...`) | **`@plannel/*` alias** | craco webpack alias 강제 |
| `TB_<DOMAIN>_*` 테이블명 | **`z_<table>`** prefix | PlanNEL 테이블 컨벤션 |
| `SP_UI_*` Stored Procedure | **JPA Repository + QueryDSL/JPQL** (또는 MyBatis) | PlanNEL 은 SP 사용 안 함 |
| RealGrid2 / `<BaseGrid>` | **`<AgGridReact>`** | AG-Grid 30 |
| Zustand store | **Redux Toolkit** (`useDispatch` / `useSelector` / `reduxUtil`) | |
| URL `/composer/...` / `/util/...` | **`/api/...`** prefix | |
| TB_AD_MENU INSERT | **TabMenuList.js 의 lv3MenuList 객체 entry** | DB 가 아닌 JS 객체로 메뉴 관리 |
| `useViewStore` / `useContentStore` | **`reduxUtil.getViewState(viewName)`** + Redux dispatch | |
| 한글 라벨 하드코딩 | **i18n key** (`t("KEY")` 또는 columnDef.headerName) | 6언어 지원 |
| `@RequestMapping("/composer/...")` | **`@RequestMapping("/api")`** + method 별 path | |
| `Controller.save(HttpServletRequest)` + `getParameter("changes")` multipart | **`@PostMapping("/api/x/save") @RequestBody List<XDto>`** | JSON body 표준 |
| Entity boolean 을 raw 매핑 | **`@Convert(converter = BooleanToYNConverter.class)`** | DB 컬럼은 `CHAR(1) Y/N` |
| 응답으로 `List<X>` 직접 반환 | **`PaginationUtil.getPageResponse(...)` 또는 `getAllPageResponse(...)` Map** | totalPages 포함 표준 응답 |
| 인증 없는 endpoint | **`@PreAuthorize("hasAnyRole(...)")` 필수** | 모듈 role: APP_DP / APP_IP / APP_RP / APP_MP / ADMIN |
| Tenant 무시한 raw SQL | TenantContext 적용된 JPA / QueryDSL | `31-multi-tenancy.md` 참조 |

---

## 7. 화면 작성 자기 검증 체크리스트

### 7.1 페이지 컴포넌트
- [ ] `withTranslation()` HOC export?
- [ ] props 가 `({ t, viewName, title })` 시그니처?
- [ ] `reduxUtil.getViewState(viewName)` 로 page/pageSize/검색조건 복원?
- [ ] `gridRef = useRef()`, `defaultGridMemo = useMemo(() => DefaultGridSetting({title, viewName}), [])`?
- [ ] 컬럼 정의에 `field` · `filterType` · (boolean 인 경우) `type:["booleanColumn"]` · (숫자) `type:["rightAligned"]` · (날짜) `valueFormatter: dateUtils.formatDateTime, filterType:"timestamp"`?
- [ ] `onGridReady` 안에서 `DataState.initialize(params.api)` 호출?
- [ ] 저장 시 `DataState.getStateData(api, "created")` + `"updated"` 분리 추출?
- [ ] `<FilterContainer>` 안에 검색조건 + 우측 `<AddButton>` `<RemoveButton>` `<SaveButton>` `<FilterButton>` `<ExcelExportButton>`?
- [ ] `<PaginationContainer>` 적용?
- [ ] `<Dialog>` + `<Snackbar>` 알림?
- [ ] 한글 하드코딩 없음 — 모두 `t("KEY")`?
- [ ] 모든 import 가 `@plannel/*` alias 또는 외부 라이브러리?

### 7.2 service / controller
- [ ] Frontend service: `restApi.post("/api/<plural>", params)` (페이징 조회) + `restApi.post("/api/<plural>/save", data)` + `restApi.delete("/api/<plural>/{ids}")`?
- [ ] Controller: `@RequestMapping("/api")` + `@PostMapping("/<plural>")` + `@RequestBody(required=false) SearchDto`?
- [ ] `@PreAuthorize("hasAnyRole(...)")` 명시?
- [ ] Pagination 분기 + `PaginationUtil.getPageResponse` / `getAllPageResponse`?
- [ ] `try/catch` + `log.error` + `INTERNAL_SERVER_ERROR` 응답?

### 7.3 entity / repository / service
- [ ] `import javax.persistence.*` (★ jakarta 아님)?
- [ ] `extends BaseEntity` (`t3series.saas.multi_tenancy.model.BaseEntity`) 상속?
- [ ] `@Table(name = "z_<table>")` prefix?
- [ ] boolean 필드에 `@Convert(converter = BooleanToYNConverter.class)`?
- [ ] `@ManyToOne` 관계 필드에 `@JsonIgnore` (양방향 순환 방지)?
- [ ] `DtoConvertable<XDto>` 구현 + `toDto()` / `toEntity()` 메서드?
- [ ] Repository = `JpaRepository` 단순 + 복잡 쿼리는 `<X>QueryRepository` 별도?
- [ ] Service `@Transactional(readOnly=true)` (조회) / `@Transactional` (변경)?

### 7.4 메뉴 + i18n
- [ ] TabMenuList.js 상단 import 추가?
- [ ] `lv3MenuList[<lv2_key>]` 배열에 entry 추가 (key/reduxKey/title/icon/groupType/component)?
- [ ] component prop 으로 `viewName={"<reduxKey>"} title="<i18n_key>"` 넘김?
- [ ] appRoles / userRoles 명시 (또는 부모 lv1 의 것 상속)?
- [ ] `translation.<lang>.js` 6개 파일 모두에 menu key 추가?
- [ ] 메시지/그리드 헤더 i18n key 도 추가?

---

## 8. 자주 틀리는 함정

- **viewName 이 reduxKey 와 일치 안 함** → reduxUtil.getViewState 가 항상 undefined 리턴 → 새로고침 시 페이지 상태 사라짐
- **DataState.initialize 누락** → 저장 시 `getStateData(api, "created")` 가 undefined → 저장 동작 안 함
- **컬럼 정의에 `filterType` 누락** → AdvancedFilter 가 컬럼을 인식 못함
- **`type:["booleanColumn"]` 누락** → boolean 셀이 true/false 텍스트로 표시
- **`@JsonIgnore` 누락** → `@ManyToOne` 양방향 관계 → JSON 직렬화 시 StackOverflow
- **`@Convert(BooleanToYNConverter)` 누락** → DB 의 `Y/N` 가 boolean 으로 매핑 안 됨 → 항상 false
- **`@PreAuthorize` 누락** → 인증 없이 endpoint 노출 (보안 사고)
- **`PaginationUtil.getPageResponse` 미사용** → frontend 가 `res.data.results / totalPages` 분해 못함
- **앞서 만든 i18n key 의 6언어 중 일부 누락** → 해당 언어 사용자에게 raw key 가 노출

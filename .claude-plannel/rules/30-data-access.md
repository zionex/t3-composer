# 30. 데이터 접근 (PlanNEL)

> Frontend axios → `restApi` 인스턴스 → `@PreAuthorize` Controller → Service → JPA Repository / QueryDSL / MyBatis. **모든 요청은 JWT + tenant header 자동 부착**.

## 1. Frontend service 레이어

모든 REST 호출은 **`@plannel/services/<area>/<name>-service.js`** 에 wrapping. 화면 컴포넌트에서 axios 직접 호출 **금지**.

### 1.1 service 표준 형태

```js
// saas-web/src/services/data/customer-service.js
import restApi from "@plannel/services/utils/rest-api";

const getAll       = (params) => restApi.post("/api/customers", params);
const getAllForCSV = (params) => restApi.post("/api/customers/csv", params);
const getLookup    = ()       => restApi.get("/api/customers/lookup");
const get          = (id)     => restApi.get(`/api/customers/${id}`);
const getByPostn   = (params) => restApi.get("/api/customers/postn", { params });
const getByHrchyCd = (params) => restApi.get("/api/customers/hrchy-code", { params });
const upsert       = (data)   => restApi.post("/api/customers/save", data);
const remove       = (ids)    => restApi.delete(`/api/customers/${ids}`);
const search       = (params) => restApi.get("/api/search/index/customer", { params });
const validateCodes= (codes)  => restApi.post("/api/search/index/customer/validate", codes);

const customerService = { getAll, getAllForCSV, getLookup, get, getByPostn, getByHrchyCd,
                           upsert, remove, search, validateCodes };
export default customerService;
```

### 1.2 URL 컨벤션

| 동작 | HTTP | URL 패턴 | 비고 |
|---|---|---|---|
| 페이징 조회 | **POST** | `/api/<plural-resource>` body: SearchDto | GET 이 아닌 POST — 검색조건이 길어도 안전 |
| CSV export | POST | `/api/<plural-resource>/csv` | 페이징 없이 전체 반환 |
| 단건 조회 | GET | `/api/<plural-resource>/{id}` | |
| Lookup | GET | `/api/<plural-resource>/lookup` | 코드/명 페어 등 메타 (combo box용) |
| 저장 (upsert) | POST | `/api/<plural-resource>/save` | body: `List<XDto>` |
| 삭제 | DELETE | `/api/<plural-resource>/{ids}` | ids: 콤마 구분 |
| Elasticsearch 검색 | GET | `/api/search/index/<resource>` | params: keyword 등 |
| 코드 유효성 | POST | `/api/search/index/<resource>/validate` | body: 코드 배열 |

**resource 네이밍**: 복수형 + kebab-case. `/api/customers` · `/api/items` · `/api/new-items` · `/api/work-centers`. 단수형/snake_case/camelCase 금지.

### 1.3 SearchDto 구조 (Backend 입력)

```json
{
  "searchFilters": {
    "customer": "ABC",                  // 단건 키워드
    "customers": ["A", "B"],            // 여러 코드
    "locCd": "Seoul",
    "activeFlg": true
  },
  "page": 0,                            // 0-base!
  "pageSize": 100,
  "pagination": true,
  "orderByColumn": "customerCd",        // 정렬 컬럼 (camelCase 또는 db column)
  "sortType": "asc",                    // "asc" | "desc"
  "advancedFilters": {                  // (column 별 동적 필터 — null 가능)
    "operator": "AND",                  // "AND" | "OR"
    "children": [
      { "field": "name",       "type": "string",    "op": "contains", "value": "..." },
      { "field": "qty",        "type": "number",    "op": ">=",       "value": 100   },
      { "field": "createdTs",  "type": "timestamp", "op": "between",
        "valueFrom": "2026-01-01", "valueTo": "2026-12-31" }
    ]
  }
}
```

★ Frontend 의 `currentPage` 는 1-base 인데 **backend 는 0-base** — `page: currentPage - 1` 로 변환 필요.

### 1.4 응답 표준

`PaginationUtil.getPageResponse(page, content)` / `getAllPageResponse(list)` 가 만드는 Map:

```json
{
  "results": [...],         // 데이터 배열
  "totalPages": 12,         // 페이징
  "totalElements": 1234,    // 전체 건수
  "page": 0,
  "pageSize": 100
}
```

비어있을 때는 backend 가 `HTTP 204 No Content` 반환. 화면은 `res.data?.results || []` 로 안전 처리.

---

## 2. Frontend HTTP 인스턴스 (`rest-api.js`)

`@plannel/services/utils/rest-api`:

```js
import axios from "axios";
import axiosUtil from "@plannel/utils/axios-bigint";
import { format } from "date-fns";
import qs from "qs";

const DATE_PATTERN = "yyyy-MM-dd";
const DP_MODULE = "DP";
const IP_MODULE = "IP";
const RP_MODULE = "RP";
const MP_MODULE = "MP";

const authHeader = (module = "") => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user && user.accessToken ? {
    "Content-type": "application/json",
    "x-tenant-id": user.tenantId,           // ★ 멀티테넌트
    Authorization: `${user.type} ${user.accessToken}`,
    "x-module-name": module                 // ★ 모듈 식별
  } : {};
};

const restApi = (module) => {
  const instance = axios.create({
    headers: authHeader(module),
    transformResponse: axiosUtil.transformResponse,    // BigInt parser
    transformRequest:  axiosUtil.transformRequest,
    timeout: 7200000                                    // ★ 2시간 (long-running 작업)
  });
  instance.interceptors.request.use((config) => {
    config.paramsSerializer = {
      serialize: (params) => {
        for (const item in params) {
          if (params[item] instanceof Date) {
            params[item] = format(params[item], DATE_PATTERN);
          }
        }
        return qs.stringify(params, { arrayFormat: 'repeat' });   // ?id=1&id=2
      },
      indexes: null
    };
    return config;
  });
  return instance;
};

export default restApi();                                // 기본 (모듈 무지정)
export const restApiDP = restApi(DP_MODULE);             // x-module-name: DP
export const restApiIP = restApi(IP_MODULE);
export const restApiRP = restApi(RP_MODULE);
export const restApiMP = restApi(MP_MODULE);
```

### 2.1 모듈별 axios 인스턴스 사용

```js
// 기본 — module header 없음 (마스터 데이터 등)
import restApi from "@plannel/services/utils/rest-api";
restApi.post("/api/customers", body);

// 모듈 명시 (DP/IP/RP/MP) — 백엔드가 x-module-name 으로 라우팅 분기
import { restApiDP } from "@plannel/services/utils/rest-api";
restApiDP.post("/api/dp-versions", body);
```

### 2.2 핵심 동작

| 동작 | 구현 |
|---|---|
| JWT 자동 첨부 | `Authorization: ${user.type} ${user.accessToken}` (localStorage 의 `user`) |
| Tenant 자동 라우팅 | `x-tenant-id` 헤더 → 백엔드 `MultiTenancyInterceptor` 에서 `TenantContext.setTenantId()` |
| 모듈 라우팅 | `x-module-name` 헤더 (DP/IP/RP/MP) — 권한·로깅·필터링용 |
| BigInt 처리 | `transformResponse/Request` 가 json-bigint 으로 직렬화 (Instagram-style ID 보호) |
| Date 직렬화 | params 의 Date 객체를 `yyyy-MM-dd` 자동 변환 |
| 배열 직렬화 | `arrayFormat: 'repeat'` → `?id=1&id=2` (★ `?id[]=1` 또는 `?id=1,2` 아님) |
| Timeout | 2시간 (7,200,000ms) — 시뮬레이션/대량 처리용 |

---

## 3. Backend Controller 패턴

### 3.1 표준 Controller (페이징 + Sort + AdvancedFilter)

```java
package t3series.saas.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import t3series.saas.dto.WorkcenterDto;
import t3series.saas.dto.SearchDto;
import t3series.saas.service.WorkcenterService;
import t3series.saas.util.PaginationUtil;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('APP_MP')")                              // 모듈 전용
public class WorkcenterController {

    private final WorkcenterService workcenterService;

    @PostMapping("/workcenter")
    public ResponseEntity<Map<String, Object>> getWorkcenters(
            @RequestBody(required = false) SearchDto searchDto) {
        try {
            if (searchDto == null) searchDto = new SearchDto();

            String orderByColumn = searchDto.getOrderByColumn() != null
                ? searchDto.getOrderByColumn() : "locationCd";

            Map<String, Object> response;
            if (searchDto.isPagination()) {
                Sort sort = "asc".equals(searchDto.getSortType())
                    ? Sort.by(orderByColumn).ascending()
                    : Sort.by(orderByColumn).descending();
                Pageable paging = PageRequest.of(
                    searchDto.getPage(), searchDto.getPageSize(), sort);

                Page<WorkcenterDto> pageItems =
                    workcenterService.findByLocCdAndWcCd(searchDto, paging);
                response = PaginationUtil.getPageResponse(pageItems, pageItems.getContent());
            } else {
                List<WorkcenterDto> workcenters =
                    workcenterService.findByLocCdAndWcCd(searchDto);
                response = PaginationUtil.getAllPageResponse(workcenters);
            }
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            log.error(e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/workcenter/save")
    public ResponseEntity<?> save(@RequestBody List<WorkcenterDto> rows) {
        workcenterService.upsert(rows);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/workcenter/{ids}")
    public ResponseEntity<?> remove(@PathVariable String ids) {
        List<Long> idList = Arrays.stream(ids.split(",")).map(Long::valueOf).toList();
        workcenterService.delete(idList);
        return ResponseEntity.ok().build();
    }
}
```

### 3.2 단순 Company 패턴 (단건 GET/POST)

```java
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class CompanyController {
    private final CompanyRepository companyRepository;
    private final CompanyQueryRepository companyQueryRepository;
    private final CompanyService companyService;
    private final TenantCurrencyService tenantCurrencyService;

    @GetMapping("/company")
    public ResponseEntity<Company> getCompany() {
        try {
            Company company = companyService.getCompany();
            return new ResponseEntity<>(company, HttpStatus.OK);
        } catch (Exception e) {
            log.error(e.getMessage());
            return new ResponseEntity<>(HttpStatus.OK);
        }
    }

    @PostMapping("/company")
    @PreAuthorize("hasRole('ADMIN')")                               // 메서드 레벨 role
    public ResponseEntity<Void> updateCompany(@RequestBody CompanyDto updateData) {
        try {
            Company company = companyQueryRepository.findCompany();
            if (company == null) company = new Company();
            company.setName(updateData.getName());
            // ...
            companyRepository.save(company);
            tenantCurrencyService.updateCompanyCurrencyCd(TenantContext.getTenantId());
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (Exception e) {
            log.error(e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
```

### 3.3 @PreAuthorize role 매트릭스

| Role | 의미 |
|---|---|
| `APP_DP` | Demand Plan 모듈 라이선스 보유 |
| `APP_IP` | Inventory Plan |
| `APP_RP` | Replenishment Plan |
| `APP_MP` | Master Plan |
| `APP_BF` | Baseline Forecasting |
| `ADMIN` | 시스템 관리자 |
| `DI` | Data Integration (관리자보조) |
| `DP_MGR`, `DP_USER`, `IP_MGR`, ... | 사용자 역할 |

```java
// 마스터 데이터 — 모든 모듈 접근 가능
@PreAuthorize("hasAnyRole('APP_DP', 'APP_IP', 'APP_RP', 'APP_MP')")

// 단일 모듈 전용
@PreAuthorize("hasAnyRole('APP_DP')")

// 관리자 전용 (clas/메서드 양쪽 가능)
@PreAuthorize("hasRole('ADMIN')")

// 관리자 또는 데이터 통합 담당
@PreAuthorize("hasAnyRole('ADMIN', 'DI')")
```

---

## 4. JPA Entity 패턴

### 4.1 표준

```java
package t3series.saas.model;

import javax.persistence.*;                                              // ★ jakarta.* 아님
import javax.validation.constraints.NotBlank;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.EqualsAndHashCode;

import t3series.saas.config.hibernate.typehandler.BooleanToYNConverter;
import t3series.saas.model.BaseEntity;

@Data
@EqualsAndHashCode(callSuper = false, exclude = {"customerHrchy"})
@Entity
@Table(name = "z_customer")                                              // ★ 'z_' prefix
public class Customer extends BaseEntity implements DtoConvertable<CustomerDto> {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String customerCd;

    @ManyToOne
    @JoinColumn(name = "hrchy_id")
    @JsonIgnore                                                          // 양방향 순환 참조 방지
    private CustomerHrchy customerHrchy;

    @Convert(converter = BooleanToYNConverter.class)
    private boolean activeFlg;

    @Column(name = "desc_txt")
    private String descTxt;

    private String currencyCd;
    private String name;

    // 유연한 속성 (attr01~attr20)
    private String attr01;
    // ... attr02 ~ attr19
    private String attr20;

    @Override
    public CustomerDto toDto() { /* ... */ }
}
```

### 4.2 BaseEntity — Audit + Optimistic Locking

`t3series.saas.model.BaseEntity`:

```java
@Data
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {
    @Column(name = "created_ts", columnDefinition = "TIMESTAMP", nullable = false, updatable = false)
    @CreationTimestamp
    protected LocalDateTime createdTs;

    @Column(name = "created_by")
    protected long createdBy;

    @Column(name = "updated_ts", columnDefinition = "TIMESTAMP", nullable = false)
    @UpdateTimestamp
    protected LocalDateTime updatedTs;

    @Column(name = "updated_by")
    protected long updatedBy;

    @Column(name = "ver_num")
    @Version
    protected int verNum;                              // Optimistic Locking
}
```

- `@CreationTimestamp` / `@UpdateTimestamp` → Hibernate 자동 timestamp
- `@Version verNum` → 동시 수정 시 `OptimisticLockException` 자동 throw
- `created_by` / `updated_by` 는 `long` (사용자 BigInt ID)

### 4.3 BooleanToYNConverter

`t3series.saas.config.hibernate.typehandler.BooleanToYNConverter`:

```java
@Converter
public class BooleanToYNConverter implements AttributeConverter<Boolean, Character> {
    @Override
    public Character convertToDatabaseColumn(Boolean attribute) {
        return (attribute != null && attribute) ? 'Y' : 'N';
    }
    @Override
    public Boolean convertToEntityAttribute(Character dbData) {
        return dbData != null && dbData.equals('Y');
    }
}
```

사용:
```java
@Convert(converter = BooleanToYNConverter.class)
private boolean activeFlg;
```

→ Java 의 `boolean` 이 PostgreSQL `CHAR(1)` 의 `'Y'` / `'N'` 으로 자동 매핑.

---

## 5. Repository

### 5.1 단순 CRUD (`JpaRepository`)

```java
package t3series.saas.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import t3series.saas.model.Customer;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Customer findByCustomerCd(String customerCd);
    List<Customer> findByCustomerCdOrName(String customerCd, String name);
    Optional<Customer> findByCustomerCdAndDelFlgFalse(String customerCd);
}
```

`@Repository` 어노테이션 불필요 — Spring Data 자동 빈 등록.

### 5.2 동적 쿼리 (`<X>QueryRepository` + QueryDSL)

```java
package t3series.saas.repository;

import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import t3series.saas.dto.WorkcenterDto;
import t3series.saas.dto.BOMDetail;
import static t3series.saas.model.QItem.item;
import static t3series.saas.model.QWorkcenter.workcenter;
import static t3series.saas.model.QBom.bom;

import com.querydsl.core.group.GroupBy;
import static com.querydsl.core.group.GroupBy.groupBy;

import java.util.*;

@Repository
@RequiredArgsConstructor
public class ModelQueryRepository {
    private final JPAQueryFactory queryFactory;

    public List<BOMDetail> getProductionBOM(List<String> locCd) {
        return queryFactory.selectDistinct(
                Projections.fields(BOMDetail.class,
                        item.id.as("itemId"),
                        item.itemCd.as("itemCd")))
                .from(bom)
                .innerJoin(item).on(bom.item.eq(item))
                .where(bom.activeFlg.isTrue())
                .fetch();
    }

    @Transactional(readOnly = true)
    public Map<String, WorkcenterDto> getWorkcenterAll(String locCd) {
        return queryFactory
                .from(workcenter)
                .where(workcenter.location.locCd.eq(locCd))
                .transform(groupBy(workcenter.wcCd)
                        .as(Projections.fields(WorkcenterDto.class, /* ... */)));
    }
}
```

### 5.3 MyBatis (복잡한 SQL 또는 native query)

`src/main/resources/mapper/<area>/<X>Mapper.xml`:

```xml
<mapper namespace="t3series.saas.mapper.master.SupplierItemMapper">
  <resultMap id="SupplierItemDtoResultMap" type="t3series.saas.dto.SupplierItemDto">
    <id property="id" column="id"/>
    <result property="itemCd" column="item_cd"/>
    <result property="itemName" column="item_name"/>
    <result property="avgLtDays" column="avg_lt_days"/>
    <result property="activeFlg" column="active_flg"/>
    <association property="location" javaType="t3series.saas.model.Location"
                 resultMap="LocationResultMap"/>
    <association property="supplier" javaType="t3series.saas.model.Supplier"
                 resultMap="SupplierResultMap"/>
  </resultMap>

  <sql id="selectSupplierItem">
    supplierItem.id, supplierItem.avg_lt_days, supplierItem.active_flg,
    supplierItem.ver_num, supplierItem.created_ts, supplierItem.updated_ts
  </sql>
</mapper>
```

Java 인터페이스:
```java
package t3series.saas.mapper.master;

import org.apache.ibatis.annotations.Mapper;
import t3series.saas.dto.SupplierItemDto;

import java.util.List;
import java.util.Map;

@Mapper
public interface SupplierItemMapper {
    List<SupplierItemDto> selectAll(Map<String, Object> params);
}
```

**Namespace 컨벤션**: `t3series.saas.mapper.<area>.<X>Mapper` (Java 인터페이스 fully qualified name 과 동일)

**도메인 폴더**: `mapper/master/` · `mapper/dp/` · `mapper/ip/` · `mapper/rp/` · `mapper/notification/` · `mapper/quicksight/`

### 5.4 선택 가이드

| 케이스 | 추천 |
|---|---|
| 단순 CRUD (`findById` / `save` / `delete`) | **JpaRepository** |
| 메서드명 finder (`findByItemCdAndDelFlgFalse`) | **JpaRepository** |
| 동적 검색 (advancedFilters / 다중 조건 / 정렬) | **QueryDSL** (`<X>QueryRepository`) |
| 복잡한 JOIN / GROUP BY / native window function | **MyBatis** |
| Batch 처리 (수천 row 일괄 update) | `PlannelBatchUpdate.upsert(list, X.class)` |

---

## 6. Service 패턴

```java
package t3series.saas.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class LocationItemService {

    private final LocationItemMapper locationItemMapper;                    // MyBatis
    private final ItemRepository itemRepository;                            // JPA
    private final LocationItemQueryRepository locationItemQueryRepository;  // QueryDSL
    private final PlannelBatchUpdate<LocationItem> locationItemBatchUpdate; // Batch
    private final AuthenticationFacade authenticationFacade;                // 현재 user

    public LocationItem toEntity(LocationItemDto dto) { /* ... */ }

    @Transactional(readOnly = true)
    public Page<LocationItemDto> findAll(SearchDto searchDto, Pageable paging) {
        return locationItemQueryRepository.findAll(searchDto, paging);
    }

    @Transactional
    public void applySafetyTargetStockToLocationItem(
            List<IpEvaluation> ipEvaluations, boolean newSafetyStock) {
        IpSettings ipSettings = ipSettingsService.getIpSettings();
        List<LocationItemDto> locationDtoList = locationItemQueryRepository.findAll();

        Map<String, IpEvaluation> ipEvaluationMap = new HashMap<>();
        for (IpEvaluation e : ipEvaluations) {
            ipEvaluationMap.put(PlannelUtil.getKey(e.getLocCd(), e.getItemCd()), e);
        }

        List<LocationItem> updateLocationItemList = new ArrayList<>();
        for (LocationItemDto dto : locationDtoList) {
            if (!dto.isIpFixedFlg()) {
                IpEvaluation evalResult = ipEvaluationMap.get(PlannelUtil.getKey(dto.getLocCd(), dto.getItemCd()));
                // ... 비즈니스 로직
                updateLocationItemList.add(dto.toEntity());
            }
        }

        // Batch upsert (수천 row 일괄)
        locationItemBatchUpdate.upsert(updateLocationItemList, LocationItem.class);
    }
}
```

### 6.1 Transaction 정책

- 조회 메서드: `@Transactional(readOnly = true)`
- 변경 메서드: `@Transactional` (default propagation = REQUIRED)
- Service 레벨에서 트랜잭션 경계, Controller 는 **트랜잭션 어노테이션 금지**

---

## 7. DTO 패턴

### 7.1 SearchDto (모든 검색 controller 공통)

```java
package t3series.saas.dto;

import lombok.Data;
import org.springframework.data.domain.Pageable;
import t3series.saas.util.AdvancedFilterUtil;
import t3series.saas.util.MasterColumnEnum;

import java.util.HashMap;
import java.util.Map;

@Data
public class SearchDto {
    private Map<String, Object> searchFilters;          // 단순 키-값 필터
    private AdvancedFilter advancedFilters;              // 복잡한 필터

    private int page = 0;
    private int pageSize = 100;
    private boolean pagination = true;
    private String orderByColumn;
    private String sortType = "asc";
    private Pageable paging;

    public String getFilterBuilder(MasterColumnEnum[] enumValues) {
        if (advancedFilters == null) return null;
        AdvancedFilterUtil.bindFilterData(advancedFilters, enumValues);
        return AdvancedFilterUtil.makeWhereClause(advancedFilters);
    }

    public SearchDto setFilter(String key, Object value) {
        if (this.searchFilters == null) this.searchFilters = new HashMap<>();
        if (value != null) this.searchFilters.put(key, value);
        return this;
    }
}
```

### 7.2 도메인 DTO (CustomerDto 예시 발췌)

```java
@Data
public class CustomerDto {
    private Long id;
    private String customerCd;
    private String name;

    private CustomerHrchy customerHrchy;
    @Transient private Long customerHrchyId;
    @Transient private String customerHrchyCd;

    private boolean activeFlg;
    private String descTxt;
    private String currencyCd;

    // 유연한 속성 (attr01..attr20)
    private String attr01; private String attr20;

    private boolean delFlg;
    private boolean markedAsDelete;

    // Audit
    private int verNum;
    private LocalDateTime createdTs;
    private String createdUser;
    private LocalDateTime updatedTs;
    private String updatedUser;

    // 변경 추적 (frontend 가 dirty 필드 표시)
    private boolean hrchyChanged;
    private boolean activeFlgChanged;

    public Customer toEntity() {
        Customer c = new Customer();
        c.setId(this.id);
        c.setCustomerCd(this.customerCd);
        // ...
        return c;
    }
}
```

특징:
- Entity 의 `@ManyToOne` 관계는 `customerHrchy` (객체 통째로) + `@Transient` 보조 필드 (`customerHrchyCd`) 둘 다 노출
- 변경 추적 필드 (`*Changed`) — frontend 의 cell 변경 후 backend 가 어떤 필드만 검증할지 결정
- audit 필드를 DTO 에도 노출 (`createdTs`, `updatedUser` 등 — frontend 표시용)

---

## 8. PaginationUtil

```java
package t3series.saas.util;

public class PaginationUtil {
    public static Map<String, Object> getPageResponse(Page<?> page, List<?> content) {
        Map<String, Object> response = new HashMap<>();
        response.put("results", content);
        response.put("totalPages", page.getTotalPages());
        response.put("totalElements", page.getTotalElements());
        response.put("page", page.getNumber());
        response.put("pageSize", page.getSize());
        return response;
    }

    public static Map<String, Object> getAllPageResponse(List<?> list) {
        Map<String, Object> response = new HashMap<>();
        response.put("results", list);
        response.put("totalPages", 1);
        response.put("totalElements", list.size());
        return response;
    }
}
```

### 8.1 응답 빈 처리

- `getPageResponse` 결과의 results 가 빈 배열이면 controller 가 `HTTP 204 No Content` 반환 권장
- frontend 는 `res.data?.results ?? []` 로 안전 fallback

---

## 9. AdvancedFilter — column 별 동적 필터

`SearchDto.advancedFilters` 가 `AdvancedFilterUtil` 를 통해 SQL/JPQL where clause 로 변환:

```json
{
  "operator": "AND",
  "children": [
    {
      "field": "name", "type": "string", "op": "contains", "value": "Apple"
    },
    {
      "operator": "OR",
      "children": [
        { "field": "qty", "type": "number", "op": ">=", "value": 100 },
        { "field": "qty", "type": "number", "op": "<", "value": 10 }
      ]
    }
  ]
}
```

```java
// Service 안에서
String whereClause = searchDto.getFilterBuilder(MyColumnEnum.values());
// → "name LIKE '%Apple%' AND (qty >= 100 OR qty < 10)"
```

`MasterColumnEnum` 이 frontend `field` 명을 실제 DB 컬럼명으로 매핑.

---

## 10. Frontend 컴포넌트 데이터 흐름

saas-plannel 은 **`createAsyncThunk` 를 사용하지 않는다**. 모든 API 호출은 컴포넌트(또는 커스텀 훅) 안에서 service 메서드를 직접 호출하고 `.then()/.catch()` 로 처리한다. Redux 는 **API 결과 저장에 사용되지 않으며**, 뷰 필터/페이지네이션 같은 UI 상태 영속화에만 쓰인다.

### 10.1 데이터 fetching 표준 패턴

```js
// src/pages/<domain>/<Feature>.js
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import customerService from "@plannel/services/data/customer-service";
import { updateViewState } from "@plannel/redux/modules/viewStates";
import reduxUtil from "@plannel/utils/redux-util";

const VIEW_NAME = "CustomerPage";

const CustomerPage = () => {
  // 1. API 결과는 로컬 state 로 관리
  const [customers, setCustomers] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);

  // 2. 뷰 상태 (필터, 페이지 번호 등) 는 Redux 에서 복원
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = reduxUtil.getViewState(VIEW_NAME);
    return saved?.currentPage ?? 1;
  });
  const [filters, setFilters] = useState(() => {
    const saved = reduxUtil.getViewState(VIEW_NAME);
    return saved?.filters ?? {};
  });

  // 3. 직접 service 호출 + .then() 처리
  const fetchCustomers = () => {
    setLoading(true);
    customerService
      .getAll({
        searchFilters: filters,
        page: currentPage - 1,           // frontend 1-base → backend 0-base
        pageSize: 50,
        pagination: true,
        orderByColumn: "customerCd",
        sortType: "asc",
      })
      .then((res) => {
        setCustomers(res.data?.results ?? []);
        setTotalElements(res.data?.totalElements ?? 0);
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => setLoading(false));
  };

  // 4. 뷰 상태 Redux 에 저장 (탭 이동 후 돌아와도 필터 유지)
  const saveViewState = (patch) => {
    dispatch(updateViewState({ viewName: VIEW_NAME, ...patch }));
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, filters]);  // 필터·페이지 변경 시 재조회

  const handlePageChange = (page) => {
    setCurrentPage(page);
    saveViewState({ currentPage: page });
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    saveViewState({ filters: newFilters, currentPage: 1 });
  };

  // ... JSX
};
```

### 10.2 저장 패턴 (그리드 변경 → POST /save)

```js
const handleSave = (changedRows) => {
  customerService
    .upsert(changedRows)          // POST /api/customers/save, body: List<CustomerDto>
    .then(() => {
      fetchCustomers();           // 저장 후 목록 재조회
    })
    .catch((e) => console.error(e));
};

const handleDelete = (selectedIds) => {
  const ids = selectedIds.join(",");
  customerService
    .remove(ids)                  // DELETE /api/customers/{ids}
    .then(() => fetchCustomers())
    .catch((e) => console.error(e));
};
```

---

## 11. Redux Toolkit — UI 상태 영속화

Redux 는 **API 응답 캐싱이나 async 상태 관리에 쓰이지 않는다** (createAsyncThunk 미사용). 역할은 다음 셋:

1. **viewStates** — 각 페이지의 필터·정렬·페이지 번호·탭 상태를 메모리에 저장, 탭 전환 후 복귀 시 복원
2. **historyState** — 페이지 이동 이력
3. **tabState** (`redux-persist`) — 열린 탭 목록 영속화 (브라우저 새로고침 후에도 복원)

### 11.1 Redux 구조

```
src/redux/
├── modules/
│   ├── store.js          — combineReducers + BigInt serializability middleware
│   ├── viewStates.js     — createSlice (viewInfos 배열)
│   ├── historyState.js   — createSlice (이력)
│   └── tabState.js       — createSlice + redux-persist
└── index.js
```

### 11.2 viewStates slice

```js
// src/redux/modules/viewStates.js
import { createSlice } from "@reduxjs/toolkit";

export const viewState = createSlice({
  name: "viewStates",
  initialState: { viewInfos: [] },
  reducers: {
    updateViewState: (state, action) => {
      const existing = state.viewInfos.find(v => v.viewName === action.payload.viewName);
      if (existing) {
        Object.assign(existing, action.payload);
      } else {
        state.viewInfos.push(action.payload);
      }
    },
    removeViewState: (state, action) => {
      state.viewInfos = state.viewInfos.filter(v => v.viewName !== action.payload);
    },
    initViewState: (state) => { state.viewInfos = []; }
  }
});

export const { updateViewState, removeViewState, initViewState } = viewState.actions;
export default viewState.reducer;
```

### 11.3 reduxUtil helpers

```js
// src/utils/redux-util.js — store 에서 직접 읽기 (hook 없이 호출 가능)
import store from "@plannel/redux/modules/store";
import JSONbig from "json-bigint";

export const getViewState = (viewName) => {
  const state = store.getState();
  const found = state.viewStates.viewInfos?.find(v => v.viewName === viewName);
  if (!found) return null;
  // BigInt 직렬화 복원
  return JSONbig({ useNativeBigInt: true }).parse(JSONbig.stringify(found));
};

// dispatch 래퍼 — 화면 컴포넌트에서 임포트하여 바로 사용
export { updateViewState, removeViewState, initViewState } from "@plannel/redux/modules/viewStates";
export { updateHistoryState } from "@plannel/redux/modules/historyState";
```

### 11.4 사용 규칙

| 케이스 | 방법 |
|---|---|
| 현재 뷰의 필터/페이지 저장 | `dispatch(updateViewState({ viewName: VIEW_NAME, filters, currentPage }))` |
| 저장된 뷰 상태 복원 | `reduxUtil.getViewState(VIEW_NAME)` — `useState` 초기값에 사용 |
| API 결과 저장 | ❌ Redux 사용 금지 → `useState` 로 관리 |
| 비동기 액션 | ❌ `createAsyncThunk` 미사용 → 직접 `.then()/.catch()` |

---

## 12. Anti-patterns

| ❌ | ✅ |
|---|---|
| Frontend 에서 `axios.get(...)` 직접 호출 | `@plannel/services/<area>/<name>-service.js` 안에 wrapping |
| `restApi.get("/api/customers", {params: filter})` (GET 검색) — 검색조건 길어지면 URL limit | `restApi.post("/api/customers", searchDto)` |
| `jakarta.persistence.*` 사용 | **`javax.persistence.*`** (Spring Boot 2.4) |
| `@RequestBody(required=true)` + null 처리 누락 | `@RequestBody(required=false)` + `if (dto==null) dto = new SearchDto()` |
| URL `/composer/...` / `/util/...` | **`/api/<plural-resource>`** |
| `@RequestMapping("/customers")` — class 레벨에 단수형 | class 는 `/api`, method 별 `/customers` (복수형 + kebab-case OK) |
| Entity 안 `boolean` 필드를 변환 없이 사용 | `@Convert(converter = BooleanToYNConverter.class)` 명시 |
| 응답으로 List 직접 반환 | `PaginationUtil.getPageResponse(...)` 또는 `getAllPageResponse(...)` |
| 인증 없는 endpoint | `@PreAuthorize("hasAnyRole(...)")` 필수 — 모듈별 role 매핑 |
| Tenant 무시한 raw SQL (`jdbc.execute(...)`) | JPA / QueryDSL / MyBatis 통한 자동 schema 라우팅 (`31-multi-tenancy.md`) |
| `BigInt` ID 를 frontend 에서 number 로 변환 | `json-bigint` 그대로 유지 (`axios-bigint.js` transformer) |
| `frontend currentPage = 0` 으로 보냄 | frontend 1-base · backend 0-base — `page: currentPage - 1` 변환 |
| `searchFilters: { search: "..." }` (자유 키) | 명시적 키 (예: `customer`, `customers`, `locCd`) — backend 에서 명시적으로 `searchFilters.get(...)` |
| 응답 `{data: [...]}` (자유 형식) | 표준 `{results, totalPages, totalElements, page, pageSize}` Map |
| `@Transactional` 을 Controller 에 부착 | Service 레벨에만 |
| QueryDSL Q클래스 import 경로 무시 | `import static t3series.saas.model.QCustomer.customer;` 표준 |

---

## 13. 체크리스트

### Java Controller 작성 시
- [ ] 패키지 `t3series.saas.<도메인>` 아래에 작성 — `com.zionex.t3series.web.*` 사용 안 함
- [ ] `@RestController` + `@RequestMapping("/api")` 클래스 레벨 + 메서드별 `@PostMapping("/<plural-resource>/...")`
- [ ] `@PreAuthorize` 로 역할 가드 — `hasAnyRole('APP_DP','APP_IP','APP_RP','APP_MP')` 중 해당 모듈만 (§3.3)
- [ ] 리스트 조회는 `POST /api/<resource>` + `@RequestBody(required=false) SearchDto` — GET 사용 안 함 (§1.2)
- [ ] 응답은 `PaginationUtil.getPageResponse(...)` 또는 `getAllPageResponse(...)` — raw `List<>` 직접 반환 금지 (§1.4)
- [ ] 저장은 `@RequestBody List<FeatureDto>` JSON — `HttpServletRequest.getParameter("changes")` (wingui multipart 패턴) 사용 안 함
- [ ] 낙관적 잠금 — `BaseEntity.verNum` (`@Version`) 필드 DTO 에 포함, `OptimisticLockException` 발생 시 409 처리 (§4.2)
- [ ] `javax.persistence.*` 사용 (★ `jakarta.*` 아님 — Spring Boot 2.4) (§4.1)
- [ ] Service 에만 `@Transactional` 부착 — Controller 에는 금지 (§6.1)

### Frontend axios / Service 작성 시
- [ ] 서비스 파일 위치 `src/services/<area>/<feature>-service.js` — 화면 컴포넌트에서 axios 직접 호출 금지 (§1)
- [ ] 도메인별 axios instance — `restApi` / `restApiDP` / `restApiIP` / `restApiRP` / `restApiMP` 중 적절한 것 사용 (§2)
- [ ] 페이지네이션 — frontend 1-base → backend 0-base 변환: `page: currentPage - 1` (§10.1)
- [ ] 결과 null-safe — `res.data?.results ?? []` 패턴 (§10.1)
- [ ] API 결과를 `useState` 로 받음 — Redux store 에 저장하지 않음, `createAsyncThunk` 미사용 (§11.4)
- [ ] UI 상태 (필터/탭/페이지) 만 Redux `viewStates` slice 에 persist (§11)
- [ ] 에러 처리 — `.catch(...)` + 사용자 알림. raw `fetch()` 사용 안 함

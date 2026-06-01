# 41b. Composer — Java 백엔드 표준 (PlanNEL / saas-plannel)

> **PlanNEL 전용** — wingui(T3SmartSCM) 와 완전히 다른 스택.
> 이 파일이 생성하는 모든 Java 산출물은 `saas-plannel` 레포의 Spring Boot 2.4.13 / PostgreSQL 환경에서 동작한다.
> 생성 전 반드시 이 파일을 참조할 것.

---

## §5.0 스택 정의 (불변)

| 항목 | 값 |
|---|---|
| **Spring Boot** | **2.4.13** (Spring Boot 2.x — `javax.*` 사용, `jakarta.*` 금지) |
| **Java** | 17 |
| **루트 패키지** | `t3series.saas` |
| **DB** | PostgreSQL (`jdbc:postgresql://`, driver `org.postgresql.Driver`) |
| **SP / 저장 프로시저** | ❌ **없음** — PlanNEL 은 SP 사용 안 함 |
| **MSSQL / Oracle** | ❌ 없음 |
| **테이블 접두어** | `z_` (예: `z_customer`, `z_workcenter`) |
| **BaseEntity** | `t3series.saas.model.BaseEntity` |
| **ResponseMessage** | `t3series.saas.response.ResponseMessage` |
| **보안** | `@PreAuthorize("hasAnyRole('ADMIN', 'APP_DP', 'APP_IP', 'APP_RP', 'APP_MP')")` |

---

## §5.1 정책 차단 조건 (PlanNEL Composer apply 단계 검증)

PlanNEL 산출물은 wingui 와 다른 정책 — 핵심 차이:
- ❌ SP 자체 없음 — `SP_UI_*.sql` 산출 시도가 곧 anti-pattern (§5.3)
- ❌ 엔진 service XML 없음
- ⚠️ `SQL_DDL` (새 `z_*` 테이블 DDL) 정책은 §5.2 참조

| # | 차단 조건 | 적용 모드 |
|---|---|---|
| A | `SP_UI_*.sql` 또는 `SP_<DOMAIN>_*.sql` 형식의 SP DDL 산출 | 모든 모드 |
| B | wingui 엔진 service XML (`*_service.xml`) 산출 | 모든 모드 |
| C | 새 `z_*` 테이블 DDL (`SQL_DDL`) | NEW_FROM_DESIGN/NEW_FROM_COPY/NEW_STEP (NL/GENERAL 이외) |
| D | `com.zionex.t3series.web.*` 패키지 import | 모든 모드 |

---

## §5.1a Java 파일 구조 (4~5 종 세트)

| 파일 | 역할 | 필수? |
|---|---|---|
| `<Feature>.java` (Entity) | `@Entity` + `z_<table>` 매핑 | ✅ 필수 |
| `<Feature>Dto.java` (DTO) | 컨트롤러 ↔ 서비스 간 데이터 전달 | ✅ 필수 (Entity 와 분리) |
| `<Feature>Service.java` | 비즈니스 로직 + 트랜잭션 | ✅ 필수 |
| `<Feature>Controller.java` | REST 엔드포인트 (`/api/...`) | ✅ 필수 |
| `<Feature>Repository.java` | `JpaRepository` 단순 CRUD | 선택 (필요 시) |
| `<Feature>QueryRepository.java` | QueryDSL 복잡 조회 | 선택 (필요 시) |
| `<Feature>Mapper.java` | MyBatis `@Mapper` (페이지네이션·벌크) | 선택 (필요 시) |

> **DTO 분리 필수**: Entity 를 컨트롤러에서 직접 반환하지 않는다. 조회·저장 모두 DTO 를 통해 이동. 단순 마스터 조회는 Entity 반환이 허용되나 수정 작업은 반드시 DTO.

---

## §5.2 모드별 DDL 정책

PlanNEL 은 `z_*` PostgreSQL 테이블만 사용 (SP/View 없음). 새 테이블 생성 권한은 모드별로 다름:

| 모드 | 새 `z_*` Table | 기존 Table 재사용 |
|---|---|---|
| NEW_NL / NEW_GENERAL | ✅ 허용 (스키마 작성 후 마이그레이션 폴더 등록) | 권장 |
| NEW_FROM_DESIGN | ❌ 생성 금지 (설계서 기반은 기존 스키마 매핑) | 필수 |
| NEW_FROM_COPY | ❌ 생성 금지 (원본 화면의 테이블 재사용) | 필수 |
| NEW_STEP | ❌ 생성 금지 (Wizard 산출은 기존 스키마만) | 필수 |
| EXISTING_MODIFY | ✅ ALTER 만 허용 (DROP/CREATE 금지) | — |

---

## §5.2b ORM 레이어 선택 기준

| 상황 | 사용할 레이어 |
|---|---|
| 단순 PK 조회 / ID 저장·삭제 | `JpaRepository` |
| 조건부 단일 조회 (WHERE + JOIN) | `JPAQueryFactory` (QueryDSL) |
| 페이지네이션 + 복잡 필터 + 정렬 | `MyBatis @Mapper` + XML |
| 벌크 INSERT/UPDATE/softDelete | `MyBatis @Mapper` |

### QueryDSL 패턴

```java
package t3series.saas.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import t3series.saas.model.QFeature;
import t3series.saas.model.Feature;

@RequiredArgsConstructor
@Repository
public class FeatureQueryRepository {

    private final JPAQueryFactory queryFactory;
    static QFeature feature = QFeature.feature;

    public Feature findByCode(String code) {
        return queryFactory.selectFrom(feature)
            .where(feature.code.eq(code).and(feature.delFlg.ne("Y")))
            .orderBy(feature.id.asc())
            .fetchOne();
    }
}
```

### MyBatis Mapper 패턴

> **파일 위치 (두 곳 — 반드시 분리)**:
> - Java interface: `saas-application/src/main/java/t3series/saas/mapper/<subdomain>/<Feature>Mapper.java`
> - XML SQL: `saas-application/src/main/resources/mapper/<subdomain>/<Feature>Mapper.xml`
> (`<subdomain>` 은 동일하게 — `master` / `dp` / `ip` / `mp` / `rp` / `notification` / `quicksight` / `audittrail`)

```java
package t3series.saas.mapper.master;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import t3series.saas.dto.FeatureDto;
import java.util.List;
import java.util.Map;

@Mapper
public interface FeatureMapper {

    List<FeatureDto> findAll(
        @Param("searchFilters") Map<String, Object> searchFilters,
        @Param("orderBy") String orderBy,
        @Param("offset") Long offset,
        @Param("limit") Long limit
    );

    int countAll(@Param("searchFilters") Map<String, Object> searchFilters);

    void insert(@Param("feature") FeatureDto feature, @Param("userId") Long userId);

    int update(@Param("feature") FeatureDto feature, @Param("userId") Long userId);

    void softDeleteByIds(@Param("ids") List<Long> ids, @Param("userId") Long userId);
}
```

### MyBatis XML UPDATE 패턴 (ver_num 낙관적 잠금 — 필수)

`update` 메서드의 XML 은 반드시 `WHERE id = #{feature.id} AND ver_num = #{feature.verNum}` 조건을 포함하고, SET 절에서 `ver_num = ver_num + 1` 을 증가시켜야 한다. 이 조건이 없으면 낙관적 잠금이 동작하지 않아 동시 수정 시 silent overwrite 발생.

```xml
<update id="update" parameterType="t3series.saas.dto.FeatureDto">
    UPDATE z_feature
       SET feature_cd  = #{feature.featureCd},
           feature_nm  = #{feature.featureNm},
           use_yn      = #{feature.useYn},
           ver_num     = ver_num + 1,
           updated_by  = #{userId},
           updated_ts  = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
     WHERE id      = #{feature.id}
       AND ver_num = #{feature.verNum}
</update>
```

`update` 의 반환값(`int`)은 실제 갱신된 행 수다. `WHERE ver_num = #{feature.verNum}` 조건 불일치 시 0 반환 → Service 에서 `OptimisticLockingFailureException` throw → Controller 가 HTTP 409 반환.

---

## §5.3 SP 정책 — PlanNEL 은 SP 사용 안 함

PlanNEL 은 PostgreSQL 을 사용하며 저장 프로시저(Stored Procedure)를 사용하지 않는다.
복잡한 쿼리는 **MyBatis XML mapper** 또는 **QueryDSL** 로 작성한다.

❌ `EXEC SP_UI_*` — 생성 금지  
❌ SP DDL (`.sql` 파일에 `CREATE PROCEDURE`) — 생성 금지  
❌ `BeanPropertyRowMapper` + `jdbcTemplate.query("EXEC ...")` — 생성 금지

---

## §5.4 import 화이트리스트 (Spring Boot 2.4.13)

> ⚠️ **Spring Boot 2.x — `javax.*` 사용**. `jakarta.*` 를 쓰면 컴파일 실패.

### Entity
```java
import javax.persistence.*;           // Spring Boot 2.x — javax 사용
import javax.validation.constraints.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.Type;          // JSON 컬럼 필요 시
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import t3series.saas.model.BaseEntity;         // ★ 실제 BaseEntity
```

### DTO
```java
import lombok.*;
import java.time.LocalDateTime;
import java.util.*;
// 필요에 따라 javax.validation.constraints.* 추가
```

### Repository (JPA)
```java
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;  // 선택
// @Repository 어노테이션 불필요 (JpaRepository 구현체가 자동 등록)
```

### QueryRepository (QueryDSL)
```java
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import t3series.saas.model.Q<Feature>;
```

### Mapper (MyBatis)
```java
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Map;
```

### Service
```java
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import t3series.saas.config.LoggedUserContext;     // 현재 사용자 ID
import t3series.saas.dto.FeatureDto;
import t3series.saas.model.Feature;
import java.util.*;
```

### Controller
```java
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import t3series.saas.dto.FeatureDto;
import t3series.saas.dto.SearchDto;
import t3series.saas.response.ResponseMessage;
import t3series.saas.service.FeatureService;
import t3series.saas.util.PaginationUtil;
import java.util.*;
```

### §5.4.1 금지 import (완전 금지 — ❌)

| 금지 | 이유 |
|---|---|
| `jakarta.persistence.*` · `jakarta.servlet.*` · `jakarta.validation.*` | Spring Boot 2.x 에 없음 → 컴파일 실패 |
| `com.zionex.t3series.web.*` | wingui 패키지 — PlanNEL 에 없음 |
| `com.zionex.t3series.web.util.audit.BaseEntity` | wingui 전용 — `t3series.saas.model.BaseEntity` 사용 |
| `com.zionex.t3series.web.util.data.ResponseMessage` | wingui 전용 — `t3series.saas.response.ResponseMessage` 사용 |
| `com.zionex.t3series.web.constant.ServiceConstants` | wingui 전용 — PlanNEL 에 없음 |
| `org.springframework.beans.factory.annotation.Qualifier` | targetJdbcTemplate 패턴 — PlanNEL 미사용 |
| `SpecificationBuilder` / 임의 Utils | 존재하지 않는 클래스 |

---

## §5.5 클래스 네이밍 규약

### §5.5.1 도출식

> ★ 본 rule 의 `saas-application/...` = `TARGET_PLANNEL_BACKEND_PATH` (`.env`). 컨테이너 내부에서는 `/workspace/targets/PLANNEL/backend/...` 로 마운트. 자세히는 41 §3.0.

```
MENU_FILE_PATH   = /<module>[/<category>]/<PascalName>    예: /master/customer
                                            └─ <Feature> = Customer

<Feature> = MENU_FILE_PATH 마지막 segment PascalCase 그대로
<feature_dir> = LOWER(<Feature>)           예: customer

파일 세트:
  <Feature>.java                  → Customer.java           @Entity
  <Feature>Dto.java               → CustomerDto.java
  <Feature>Service.java           → CustomerService.java    @Service
  <Feature>Controller.java        → CustomerController.java @RestController
  <Feature>Repository.java        → CustomerRepository.java (선택, JpaRepository)
  <Feature>QueryRepository.java   → CustomerQueryRepository.java (선택, QueryDSL)
  <Feature>Mapper.java            → CustomerMapper.java (선택, MyBatis @Mapper interface)
  resources/mapper/<subdomain>/<Feature>Mapper.xml → resources/mapper/master/CustomerMapper.xml (선택, MyBatis XML)

패키지:
  entity:     t3series.saas.model
  dto:        t3series.saas.dto
  service:    t3series.saas.service
  controller: t3series.saas.controller
  repository: t3series.saas.repository
  mapper:     t3series.saas.mapper.<subdomain>   예: t3series.saas.mapper.master
  mapper XML: saas-application/src/main/resources/mapper/<subdomain>/  (java 측 subdomain 과 동일)
```

### §5.5.2 절대 규칙

| ❌ | ✅ |
|---|---|
| `Cust*.java` (축약) | `Customer*.java` (1:1) |
| `CustomerManagement*.java` (확장) | `Customer*.java` |
| `@Service("customerService")` 명시 빈 이름 | Spring 기본 (자동) |
| `package com.zionex.t3series.*` | `package t3series.saas.*` |
| `package t3series.saas.domain.master` (wingui 흉내) | `package t3series.saas.service`, `t3series.saas.controller` 등 |

---

## §5.6 코드 템플릿

### Entity

```java
package t3series.saas.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import javax.persistence.*;
import javax.validation.constraints.*;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "z_feature")                    // ★ 테이블명은 z_ 접두어
@JsonIgnoreProperties(ignoreUnknown = true)
public class Feature extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 50)
    @Column(name = "feature_cd")
    private String featureCd;

    @Column(name = "feature_nm")
    private String featureNm;

    @Column(name = "use_yn")
    private String useYn;

    @Column(name = "del_flg")
    private String delFlg;

    // BaseEntity 상속: created_ts, created_by, updated_ts, updated_by, ver_num
}
```

### DTO

```java
package t3series.saas.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeatureDto {

    private Long id;
    private String featureCd;
    private String featureNm;
    private String useYn;
    private int verNum;                        // 낙관적 잠금 — 저장 시 필수 전달

    // 조회 전용 (JOIN 결과 등)
    private LocalDateTime createdTs;
    private LocalDateTime updatedTs;
}
```

### SearchDto (페이지네이션 요청)

```java
// saas-plannel 에 이미 존재 — 재사용. 새로 만들지 말 것.
// t3series.saas.dto.SearchDto
// 주요 필드: page (int), pageSize (int), searchFilters (Map<String,Object>), orderByColumn (String)
// getter: getPage(), getPageSize(), getSearchFilters(), getOrderByColumn()
```

### Controller

```java
package t3series.saas.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import t3series.saas.dto.FeatureDto;
import t3series.saas.dto.SearchDto;
import t3series.saas.response.ResponseMessage;
import t3series.saas.service.FeatureService;
import t3series.saas.util.PaginationUtil;
import java.util.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class FeatureController {

    private final FeatureService featureService;

    // 목록 조회 (페이지네이션)
    @PostMapping("/features")
    @PreAuthorize("hasAnyRole('ADMIN', 'APP_DP', 'APP_IP', 'APP_RP', 'APP_MP')")
    public ResponseEntity<Map<String, Object>> getFeatures(
            @RequestBody(required = false) SearchDto searchDto) {
        try {
            return new ResponseEntity<>(featureService.getFeatures(searchDto), HttpStatus.OK);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 저장 (등록 + 수정)
    @PostMapping("/features/save")
    @PreAuthorize("hasAnyRole('ADMIN', 'APP_DP', 'APP_IP', 'APP_RP', 'APP_MP')")
    public ResponseEntity<Void> saveFeatures(@RequestBody List<FeatureDto> features) {
        try {
            featureService.saveFeatures(features);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (OptimisticLockingFailureException e) {
            log.error(e.getMessage(), e);
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 삭제 (소프트 삭제 또는 하드 삭제)
    @DeleteMapping("/features/{ids}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteFeatures(@PathVariable List<Long> ids) {
        try {
            featureService.deleteFeatures(ids);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
```

### Service

```java
package t3series.saas.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import t3series.saas.config.LoggedUserContext;
import t3series.saas.dto.FeatureDto;
import t3series.saas.dto.SearchDto;
import t3series.saas.mapper.master.FeatureMapper;
import t3series.saas.util.PaginationUtil;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeatureService {

    private final FeatureMapper featureMapper;           // MyBatis — 페이지네이션

    public Map<String, Object> getFeatures(SearchDto searchDto) {
        if (searchDto == null) searchDto = new SearchDto();

        Map<String, Object> filters = searchDto.getSearchFilters() != null
            ? searchDto.getSearchFilters() : new HashMap<>();
        int page = Math.max(0, searchDto.getPage());
        int size = searchDto.getPageSize() > 0 ? searchDto.getPageSize() : 20;
        long offset = (long) page * size;

        List<FeatureDto> results = featureMapper.findAll(filters, searchDto.getOrderByColumn(), offset, (long) size);
        long total = results.isEmpty() ? 0 : featureMapper.countAll(filters);

        Pageable pageable = PageRequest.of(page, size);
        Page<FeatureDto> pageResult = new PageImpl<>(results, pageable, total);
        return PaginationUtil.getPageResponse(pageResult, results);
    }

    @Transactional
    public void saveFeatures(List<FeatureDto> features) {
        Long userId = LoggedUserContext.get();
        for (FeatureDto dto : features) {
            if (dto.getId() == null) {
                featureMapper.insert(dto, userId);
            } else {
                int updated = featureMapper.update(dto, userId);
                if (updated == 0) {
                    throw new OptimisticLockingFailureException(
                        "Feature " + dto.getId() + " was modified by another user");
                }
            }
        }
    }

    @Transactional
    public void deleteFeatures(List<Long> ids) {
        Long userId = LoggedUserContext.get();
        featureMapper.softDeleteByIds(ids, userId);
    }
}
```

### Repository (JPA — 단순 케이스)

```java
package t3series.saas.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import t3series.saas.model.Feature;
import java.util.Optional;

public interface FeatureRepository extends JpaRepository<Feature, Long> {

    Optional<Feature> findByFeatureCd(String featureCd);
    boolean existsByFeatureCd(String featureCd);
}
```

---

## §5.7 URL 구조 (Controller 매핑 규약)

| HTTP 메서드 + 경로 | 역할 |
|---|---|
| `POST /api/<resource>` | 목록 조회 (SearchDto body, 페이지네이션) |
| `GET  /api/<resource>/{id}` | 단건 조회 |
| `POST /api/<resource>/save` | 등록 + 수정 (`List<FeatureDto>` body) |
| `DELETE /api/<resource>/{ids}` | 삭제 (PathVariable, 콤마 구분 가능) |
| `GET  /api/<resource>/combo` | 콤보박스용 전체 목록 (페이지네이션 없음) |

모든 컨트롤러는 **`@RequestMapping("/api")`** 클래스 레벨 + 메서드 레벨 경로로 조합한다.

---

## §5.8 응답 타입 선택

| 상황 | 반환 타입 | 예 |
|---|---|---|
| 목록 조회 (페이지네이션) | `ResponseEntity<Map<String, Object>>` | `PaginationUtil.getPageResponse(...)` |
| 단건 조회 (Entity/DTO) | `ResponseEntity<FeatureDto>` | — |
| 저장/삭제 성공 | `ResponseEntity<Void>` (HTTP 200) | — |
| 낙관적 잠금 실패 | `ResponseEntity<Void>` (HTTP 409) | `HttpStatus.CONFLICT` |
| 오류 | `ResponseEntity<Void>` (HTTP 500) | — |

**`ResponseMessage` 사용 시** (오류 상세 전달 필요한 경우):
```java
// t3series.saas.response.ResponseMessage 를 사용
// 생성자: new ResponseMessage(code, status, message, type, detail, data, details)
// 단순 에러: new ResponseMessage("ERR", 500, e.getMessage(), "error", null, null, null)
```

---

## §5.9 BaseEntity 필드 참조

`t3series.saas.model.BaseEntity` 상속 시 다음 필드 자동 포함:

| 필드 (Java) | DB 컬럼 | 설명 |
|---|---|---|
| `createdTs` | `created_ts` | 생성 일시 (자동) |
| `createdBy` | `created_by` | 생성자 ID (자동) |
| `updatedTs` | `updated_ts` | 수정 일시 (자동) |
| `updatedBy` | `updated_by` | 수정자 ID (자동) |
| `verNum` | `ver_num` | 낙관적 잠금 버전 (`@Version`) |

MyBatis 로 INSERT/UPDATE 할 때는 `setAuditInfo()` 를 호출하거나 mapper XML 에서 직접 `userId` 를 받아 처리한다.

---

## §5.10 낙관적 잠금 (Optimistic Locking)

PlanNEL Entity 는 모두 `@Version` 으로 낙관적 락 적용. 충돌 시 `OptimisticLockingFailureException` throw. 구체 처리 패턴(Controller 409 반환, MyBatis `ver_num = #{dto.verNum}` WHERE 절)은 §5.6 의 Service/Controller 템플릿 참조.

| ❌ | ✅ |
|---|---|
| `ver_num` 컬럼 없이 Entity 작성 → 동시 수정 시 마지막 쓰기가 silent 덮어쓰기 | `BaseEntity` 상속 → `ver_num` 자동 포함 (§5.9) |

---

## §5.11 자기 검증 (Java 출력 직전 체크리스트)

- [ ] 패키지 루트가 `t3series.saas.*` 인가? (`com.zionex.*` 없음)
- [ ] import 에 `javax.persistence.*`, `javax.validation.*` 사용 (`jakarta.*` 없음)
- [ ] `BaseEntity` = `t3series.saas.model.BaseEntity` 인가?
- [ ] `ResponseMessage` = `t3series.saas.response.ResponseMessage` 인가?
- [ ] Entity 클래스에 `@Table(name = "z_...")` — `z_` 접두어 적용?
- [ ] Controller 에 `@RequestMapping("/api")` 클래스 레벨 + `@PreAuthorize` 있음?
- [ ] 저장 URL = `POST /api/<resource>/save` 패턴?
- [ ] 삭제 URL = `DELETE /api/<resource>/{ids}` 패턴?
- [ ] `OptimisticLockingFailureException` catch → `HttpStatus.CONFLICT` 반환?
- [ ] Entity 와 DTO 가 분리되어 있음?
- [ ] SP(`EXEC SP_UI_*`) 없음 — PostgreSQL 환경 확인?
- [ ] `@Qualifier("targetJdbcTemplate")` 없음?
- [ ] `LoggedUserContext.get()` 으로 현재 사용자 ID 획득?

---

## 관련 파일

- `41-composer-generation.md` — 생성 메인 규약
- `41a-composer-jsx.md` — JSX 표준
- `30-data-access.md` — PlanNEL DB / ORM 상세
- `saas-plannel/saas-application/src/main/java/t3series/saas/controller/CustomerController.java` — 실제 참조 원본
- `saas-plannel/saas-application/src/main/java/t3series/saas/service/CustomerService.java` — 실제 참조 원본
- `saas-plannel/saas-application/src/main/java/t3series/saas/mapper/master/CustomerMapper.java` — 실제 참조 원본

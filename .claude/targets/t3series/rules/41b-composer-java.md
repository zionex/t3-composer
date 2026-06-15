# 41b. Composer — Java 백엔드 표준 (JPA + RestController)

> 모든 모드에서 생성/수정되는 Java 4종 세트 + DDL/SP 정책의 단일 진실 저장소.
> 41-composer-generation.md §5 분리.

## §5.1 정책 차단 조건 (`ArtifactApplyService.checkWinguiNativePolicy`)

| # | 차단 조건 | 적용 모드 |
|---|---|---|
| A | 신규 화면에 `SP_UI_*.sql` DDL 누락 | `NEW_GENERAL`/`NEW_NL`/`NEW_STEP`/`NEW_FROM_DESIGN` (★ NEW_FROM_COPY 제외) |
| B | 엔진 service XML (`*_service.xml`) | 모든 신규 모드 |
| C | 새 테이블 DDL (`SQL_DDL`) | NEW_FROM_DESIGN/NEW_FROM_COPY/NEW_STEP (NL 이외) |

**A 의 NEW_FROM_COPY 예외**: JSX-only 복제 (기존 endpoint 재사용) 허용.

## §5.2 모드별 DDL 정책

| 모드 | 새 Table | 새 SP | 기존 Table/View 재사용 |
|---|---|---|---|
| NEW_NL / NEW_GENERAL | ✅ | ✅ 필수 | 권장 |
| NEW_FROM_DESIGN | ❌ | ✅ 필수 | 필수 |
| NEW_FROM_COPY | ❌ | 선택 (JSX-only OK) | 필수 |
| NEW_STEP | ❌ | ✅ 필수 | 필수 |
| EXISTING_MODIFY | ✅ ALTER | 허용 | — |

## §5.3 SP 정책

- 네이밍 `SP_UI_<DOMAIN>_<NO>_<ACTION>` (`31-stored-procedures.md`)
- 배치 `t3series-database/mssql/upgrade/vX.Y.Z-YYYYMMDD/procedures/`
- **MSSQL 방언만** (Oracle 폴더 생성 금지)
- 조회 SP 결정론적 `ORDER BY` 필수
- 호출: wingui RestController + Service + JdbcTemplate (엔진 X)
  - 조회 `jdbcTemplate.query("EXEC SP_UI_<NO>_Q1 ?, ?", new BeanPropertyRowMapper<>(Entity.class), p1, p2)`
  - 저장/삭제 `jdbcTemplate.update("EXEC SP_UI_<NO>_S1/D1 ?, ?", ...)`

## §5.4 Java 4종 세트

- 필수 3종: Entity + Service + RestController
- 선택: Repository (JpaRepository) — JPA 단순 CRUD 필요 시
- NEW_FROM_COPY 에서 기존 Entity 재사용 시 Entity 재생성 금지

---

## §5.5 import 화이트리스트 (Spring Boot 3.x)

`javax.*` 시리즈는 Spring Boot 3 에서 제거 → 컴파일 실패. 허구 유틸 (`SpecificationBuilder` 등) 금지.

### Entity
```java
import jakarta.persistence.{Column, Entity, Id, Table};
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.zionex.t3series.web.util.audit.BaseEntity;   // ★ 허구 `web.domain.BaseEntity` 금지
import lombok.{Data, EqualsAndHashCode};
```

### Repository
```java
import org.springframework.data.jpa.repository.{JpaRepository, JpaSpecificationExecutor};
// @Repository 어노테이션 불필요
```

### Service (JdbcTemplate + SP)
```java
import java.util.{List, Map};
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.{BeanPropertyRowMapper, JdbcTemplate};
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
```
❌ JPA Specification / Criteria API · JpaRepository 인젝션 — JdbcTemplate 만.

### Controller
```java
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3series.web.constant.ServiceConstants;
import com.zionex.t3series.web.util.data.ResponseMessage;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.{HttpStatus, ResponseEntity};
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import lombok.{RequiredArgsConstructor, extern.slf4j.Slf4j};
```
❌ `MultipartHttpServletRequest` — `HttpServletRequest` 만.

### §5.5.1 금지 import

| 금지 | 대체 |
|---|---|
| `javax.persistence/servlet/validation/...` | `jakarta.*` |
| `com.zionex.t3series.web.domain.BaseEntity` | `com.zionex.t3series.web.util.audit.BaseEntity` |
| `SpecificationBuilder` / `QueryDslBuilder` / 임의 `Utils` | Criteria API 직접 또는 원본에 있는 심볼만 |

---

## §5.6 Java 클래스 네이밍 (유니크 보장)

### §5.6.1 도출식 (한 가지 — 변형 금지)

```
MENU_FILE_PATH   = /<module>[/<category>]/<PascalName>    예: /util/UserInfoMgmt
                                            └─ <Feature>

<Feature> = MENU_FILE_PATH 마지막 segment **그대로** (글자수까지 1:1)
<feature_dir> = LOWER(<Feature>)            — 단일 lowercase concat

4종:
  <Feature>.java                            예: UserInfoMgmt.java
  <Feature>Controller.java                  UserInfoMgmtController.java
  <Feature>Service.java                     UserInfoMgmtService.java
  <Feature>Repository.java (선택)            UserInfoMgmtRepository.java

package com.zionex.t3series.web.domain.<module>.<feature_dir>;
  예: com.zionex.t3series.web.domain.util.userinfomgmt;
```

### §5.6.2 절대 규칙

| ❌ | ✅ |
|---|---|
| `UserInfo*.java` (`/util/UserInfoMgmt` 축약) | `UserInfoMgmt*.java` 1:1 |
| `MgmtUserInfo` (어순) · `UserInfoManagement` (확장) | `UserInfoMgmt` |
| 디렉토리 `user-info-mgmt` 또는 `user_info_mgmt` | `userinfomgmt` (단일 lowercase) |
| `@Service("xxx")` 명시 빈 이름 | Spring 기본 (자동) |

`@Table(name)` 의 테이블명은 별개 — `TB_<DOMAIN>_<NAME>` (rules/30), 클래스명 무관.

### §5.6.3 utility 도메인 — `util/` 단 하나, `ut/` 금지

| 표면 | ✅ | ❌ |
|---|---|---|
| 디렉토리 / package | `web/domain/util/<f>/` · `...util.<f>` | `domain/ut/*` · `...ut.*` |
| `@RequestMapping` | `/util/<features>` | `/ut/<features>` |
| zAxios | `'util/<features>'` | `'ut/<features>'` |

Hook (`path-convention.sh`) 자동 차단.

---

## §5.7 코드 템플릿

### Entity
```java
@Data @EqualsAndHashCode(callSuper = false)
@Entity @Table(name = "TB_<DOMAIN>_<NAME>")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Feature extends BaseEntity {
    @Id @Column(name = "<PK_COL>") private String featureId;
    // @Column 매핑 (실제 컬럼만 — 32-sql-schema-verification.md 사전 검증 필수)
}
```

### Controller (Save 패턴)

> ⛔ **`ResponseMessage` API — 직접 생성자 (HttpStatus.X.value()) 만 사용**
> wingui 본 환경 `ResponseMessage.java` 는 `(int status, String message)` 생성자가 유일한 공식 API.
> `ResponseMessage.builder()` / `ok()` / `error()` / `of()` / `ofSuccess()` / `ofFail()` 모두 **존재하지 않음** —
> 호출 시 컴파일 실패 → wingui 전체 startup down → 모든 endpoint 500.
> (단독 환경 `ResponseMessage.java` 의 `ok/error/ofSuccess/ofFail` 별칭은 [화면 실행] 호환 안전망일 뿐
> 산출물에 의존 금지. sync 후 깨진다.) Hook (`java-basic.sh §J11`) 자동 차단.
>
> **표준 패턴** (모든 응답에 적용):
> ```java
> // 성공
> new ResponseMessage(HttpStatus.OK.value(), "saved")
> // 4xx 클라이언트 오류
> new ResponseMessage(HttpStatus.BAD_REQUEST.value(), "changes parameter is missing")
> // 5xx 서버 오류 (try/catch 안에서)
> new ResponseMessage(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage())
> ```

```java
@Slf4j @RestController @RequiredArgsConstructor
public class FeatureController {
    private final FeatureService service;
    private final ObjectMapper objectMapper;

    @GetMapping("/<m>/<fs>")
    public List<Feature> list(@RequestParam(required=false) String q) { ... }

    @Transactional
    @PostMapping("/<m>/<fs>")
    public ResponseEntity<ResponseMessage> save(HttpServletRequest request) {
        try {
            String raw = request.getParameter(ServiceConstants.PARAMETER_KEY_DATA);
            if (raw == null || raw.isBlank()) {
                return new ResponseEntity<>(
                        new ResponseMessage(HttpStatus.BAD_REQUEST.value(), "changes parameter is missing"),
                        HttpStatus.BAD_REQUEST);
            }
            List<Feature> items = objectMapper.readValue(raw, new TypeReference<List<Feature>>() {});
            service.saveAll(items);
            return new ResponseEntity<>(
                    new ResponseMessage(HttpStatus.OK.value(), "saved"),
                    HttpStatus.OK);
        } catch (Exception e) {
            log.error("Feature save error", e);
            return new ResponseEntity<>(
                    new ResponseMessage(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional
    @PostMapping("/<m>/<fs>/delete")
    public ResponseEntity<ResponseMessage> delete(@RequestBody List<Feature> items) {
        try {
            service.deleteAll(items);
            return new ResponseEntity<>(
                    new ResponseMessage(HttpStatus.OK.value(), "deleted"),
                    HttpStatus.OK);
        } catch (Exception e) {
            log.error("Feature delete error", e);
            return new ResponseEntity<>(
                    new ResponseMessage(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
```

### Service (JdbcTemplate + SP)

> ⚠️ 단독 환경에서 `@Qualifier("targetJdbcTemplate")` 필수 — composer-db(PG) 가 아닌 target-mssql 라우팅.
> `JavaArtifactRewriter` 가 자동 주입하지만 LLM 출력에 있으면 안전.
> `backend/lombok.config` 의 `copyableAnnotations += @Qualifier` 필수.

```java
@Service @RequiredArgsConstructor
public class FeatureService {
    @Qualifier("targetJdbcTemplate")
    private final JdbcTemplate jdbcTemplate;
    private static final String SP_QUERY  = "EXEC SP_UI_<DOMAIN>_<NO>_Q1 ?, ?";
    private static final String SP_SAVE   = "EXEC SP_UI_<DOMAIN>_<NO>_S1 ?, ?, ?, ?";
    private static final String SP_DELETE = "EXEC SP_UI_<DOMAIN>_<NO>_D1 ?";

    public List<Feature> search(String f1, String f2) {
        return jdbcTemplate.query(SP_QUERY, new BeanPropertyRowMapper<>(Feature.class), f1, f2);
    }
    @Transactional
    public void saveAll(List<Feature> items) {
        for (Feature row : items) {
            if (row == null || StringUtils.isBlank(row.getFeatureId())) continue;
            jdbcTemplate.update(SP_SAVE, row.getFeatureId(), row.getField1(), row.getField2(), row.getModifyBy());
        }
    }
    @Transactional
    public void deleteAll(List<Feature> items) {
        for (Feature row : items) {
            if (row == null || StringUtils.isBlank(row.getFeatureId())) continue;
            jdbcTemplate.update(SP_DELETE, row.getFeatureId());
        }
    }
}
```

`BeanPropertyRowMapper` 가 SP 결과 컬럼(snake_case) → Entity camelCase 자동 매핑. audit (`CREATE_BY/MODIFY_BY/_DTTM`) 은 SP 안에서 처리. `@Transactional` 누락 시 부분 커밋 위험.

---

## §5.8 자기 검증 (Java 출력 직전)

- [ ] `<Feature>` = MENU_FILE_PATH 마지막 segment 1:1 (축약/확장/어순 금지)
- [ ] 모든 .java basename = `<Feature>` prefix
- [ ] package 마지막 segment = `LOWER(<Feature>)` (하이픈/언더스코어 금지)
- [ ] JSX `export default <X>` = Java `<Feature>`
- [ ] `@Service("xxx")` 명시 빈 이름 없음
- [ ] import 모두 `jakarta.*` 또는 실존 (`javax.*` 제거)
- [ ] `BaseEntity` = `com.zionex.t3series.web.util.audit.BaseEntity`
- [ ] `SpecificationBuilder` 등 허구 유틸 없음
- [ ] Controller 저장 = `HttpServletRequest` + `request.getParameter("changes")`
- [ ] Entity `@JsonIgnoreProperties(ignoreUnknown = true)`
- [ ] utility 산출물 grep 0건 `ut/`
- [ ] Service `JdbcTemplate` 필드 `@Qualifier("targetJdbcTemplate")`
- [ ] `ResponseMessage.builder()` / `.ok()` / `.error()` / `.of()` / `.ofSuccess()` / `.ofFail()` 호출 없음 — 모두 `new ResponseMessage(HttpStatus.X.value(), msg)` 직접 생성자

---

## 관련 파일

- `41-composer-generation.md` · `41a-composer-jsx.md` · `41c-composer-widgets.md` · `41d-composer-wizard.md`
- `web/domain/admin/user/UserController.java` — wingui REST 관례 원본
- `web/domain/util/userinfo/` — 최신 Composer 산출물

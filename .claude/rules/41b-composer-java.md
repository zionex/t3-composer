# 41b. Composer — Java 백엔드 표준 (JPA + RestController)

> **상위 규칙**: `41-composer-generation.md` 의 §5 분리. (원본 §5 의 중복 번호 정리: 정책 §5.1~§5.4 / 코드 §5.5~§5.8 로 재정렬)
> Composer 모든 모드에서 생성/수정되는 Java 4종 세트 + DDL/SP 정책의 단일 진실 저장소.

---

## §5. Java 백엔드 · DDL / SP 정책

### §5.1 정책 차단 조건 3가지 (`ArtifactApplyService.checkWinguiNativePolicy`) — 2026-04-27 정책 / 2026-04-29 NEW_FROM_COPY 완화

| # | 차단 조건 | 적용 모드 |
|---|---|---|
| A | **신규 화면에 `SP_UI_\*.sql` DDL 누락** — CRUD 액션마다 최소 1개 SP 필수 (조회 화면이면 `_Q1` 만으로도 OK) | `NEW_GENERAL` / `NEW_NL` / `NEW_STEP` / `NEW_FROM_DESIGN` (★ `NEW_FROM_COPY` 제외 — 2026-04-29) |
| B | **엔진 service XML (`mp/dp/bf/fp server/config/*_service.xml`) 포함** — wingui 단독 구동 위반 | 모든 신규 모드 |
| C | **새 테이블 DDL (`SQL_DDL` 아티팩트) 포함** | `NEW_FROM_DESIGN` / `NEW_FROM_COPY` / `NEW_STEP` — **NL 이외 신규 모드** |

#### A 조건의 NEW_FROM_COPY 예외 (2026-04-29 추가)

`NEW_FROM_COPY` 는 본질적으로 "기존 화면 + 기존 backend 재사용" 케이스가 자연스러우므로 SP 누락을 차단하지 않는다:
- **JSX-only 복제** (기존 `util/user-infos` endpoint 그대로 호출하는 사본) → ✅ apply 허용
- 사용자가 새 SCREEN_NO 의 SP 를 원하면 후속 채팅 ("SP 도 만들어줘") 으로 추가 요청 → 별도 apply
- WARN 로그만 남김: `Composer 권장사항: 신규 화면(JSX)+SP 세션에 백엔드 [Entity, Service, Controller] 아티팩트가 누락됨...`

### §5.2 모드별 DDL 정책

| 모드 | 새 Table DDL | 새 SP DDL | 기존 Table/View 사용 | 비고 |
|---|---|---|---|---|
| `NEW_NL` / `NEW_GENERAL` (자연어) | ✅ 허용 | ✅ **필수** | ✅ 권장 | 자유 도메인 — 새 테이블 + SP 함께 생성 |
| `NEW_FROM_DESIGN` (설계서) | ❌ 차단 | ✅ **필수** | ✅ 필수 | 기존 테이블 재사용 + 신규 SP 생성 |
| `NEW_FROM_COPY` (복사) | ❌ 차단 | **선택** (JSX-only OK) | ✅ 필수 | 기존 Entity/SP 재사용 가능. 새 SP 가 필요한 경우만 함께 생성 (원본 SP 의 SCREEN_NO 변경 복제) |
| `NEW_STEP` (단계별) | ❌ 차단 | ✅ **필수** | ✅ 필수 | 기존 테이블 + 신규 SP |
| `EXISTING_MODIFY` (수정) | ✅ 허용 | ✅ 허용 | — | ALTER TABLE · 기존 SP ALTER 허용 |

### §5.3 SP 정책 (2026-04-27 전환)

- **LLM 이 Composer 대화에서 SP_UI_\*.sql 생성은 모든 신규 모드에서 필수**.
- 네이밍: `SP_UI_<DOMAIN>_<NO>_<ACTION>` (`.claude/rules/31-stored-procedures.md`).
  - DOMAIN ∈ {AD, BF, CM, DP, DPD, FO, FP, IM, MP, RP, SA, SALES, SO, UT}
  - ACTION ∈ {Q1..Qn, S1..Sn, D1..Dn, POP_Q1, CHART_Q1, BATCH}
- 배치 위치: `t3series-database/mssql/upgrade/vX.Y.Z-YYYYMMDD/procedures/<SP_NAME>.sql`
- **MSSQL 방언만 작성** (memory 의 "MSSQL only" 규칙 — `t3series-database/oracle/` 폴더에 파일 생성 금지)
- 조회 SP 는 결정론적 `ORDER BY` 필수 (`rules/31 §9`)
- 호출 경로: **wingui 의 RestController + Service + JdbcTemplate** (엔진 서버 경유 X)
  - `JdbcTemplate.queryForList("EXEC SP_UI_<...> ?, ?", new BeanPropertyRowMapper<>(Entity.class), params)`
  - `JdbcTemplate.update("EXEC SP_UI_<...>_S1 ?, ?", params)` (저장/삭제)

### §5.4 Java 4종 세트 정책

- **필수 산출물 3종**: Entity (스키마 매핑) + Service (JdbcTemplate SP 호출) + RestController (zAxios 엔드포인트)
- **선택 산출물**: Repository (JpaRepository) — JPA 단순 CRUD 가 필요한 경우만. SP 기반 화면은 Repository 불필요.
- `NEW_FROM_COPY` 에서 기존 Entity 재사용 시 Entity 재생성 금지. Service + RestController + 신규 SP 만 생성.

---

## §5.5 표준 import 화이트리스트 (Spring Boot 3.x · 절대 준수)

> **모든 Composer 생성 Java 파일은 아래 화이트리스트에 있는 패키지만 import 한다.** `javax.*` 시리즈는 Spring Boot 3 에서 제거되어 컴파일 실패한다. 허구 유틸 (`SpecificationBuilder` 등) import 도 금지. Hook (`pre-tool-use-validator.sh`) 이 javax 감지 차단.

### Entity (`<Feature>.java`)
```java
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.zionex.t3series.web.util.audit.BaseEntity;   // ★ 허구 `web.domain.BaseEntity` 금지

import lombok.Data;
import lombok.EqualsAndHashCode;
```

### Repository (`<Feature>Repository.java`)
```java
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
// @Repository 어노테이션 불필요 (Spring Data 자동 빈 등록)
```

### Service (`<Feature>Service.java`) — JdbcTemplate 으로 SP 호출 (2026-04-27 정책)
```java
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
```
- 조회: `jdbcTemplate.query("EXEC SP_UI_<DOMAIN>_<NO>_Q1 ?, ?", new BeanPropertyRowMapper<>(<Feature>.class), p1, p2)`
- 저장: `jdbcTemplate.update("EXEC SP_UI_<DOMAIN>_<NO>_S1 ?, ?, ?", row.getField1(), row.getField2(), ...)`
- 삭제: `jdbcTemplate.update("EXEC SP_UI_<DOMAIN>_<NO>_D1 ?", row.getPk())`
- null 파라미터는 SP 의 `IS NULL OR ...` 패턴과 호환 (`StringUtils.defaultString(p, null)` 그대로 전달)
- 결정론적 정렬은 SP 안에서 `ORDER BY` 로 보장 (rules/31 §9)
- ❌ JPA Specification / Criteria API 미사용 — SP 가 모든 쿼리 책임
- ❌ JpaRepository 인젝션 미사용 — JdbcTemplate 만 사용

### Controller (`<Feature>Controller.java`)
```java
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3series.web.constant.ServiceConstants; // PARAMETER_KEY_DATA = "changes"
import com.zionex.t3series.web.util.data.ResponseMessage;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
```
- 저장은 **`HttpServletRequest` + `request.getParameter(ServiceConstants.PARAMETER_KEY_DATA)` + `ObjectMapper.readValue`** 패턴만 사용
- ❌ `MultipartHttpServletRequest` 는 쓰지 않음 (HttpServletRequest 로 통일)
- 참조 원본: `web/domain/util/userinfo/UserInfoController.java`

### §5.5.1 금지 import (컴파일 실패 · 정적 검증 차단 대상)

| 금지 패키지 / 심볼 | 대체 |
|---|---|
| `javax.persistence.*` | `jakarta.persistence.*` |
| `javax.servlet.*` | `jakarta.servlet.*` |
| `javax.validation.*` | `jakarta.validation.*` |
| `javax.annotation.*` | `jakarta.annotation.*` |
| `javax.transaction.*` | `org.springframework.transaction.annotation.Transactional` (Spring 관리) |
| `com.zionex.t3series.web.domain.BaseEntity` | `com.zionex.t3series.web.util.audit.BaseEntity` |
| `com.zionex.t3series.web.util.query.SpecificationBuilder` | Criteria API (`cb.like` / `cb.equal`) 직접 작성 |
| `QueryDslBuilder` · 임의 `Utils` · `Helpers` | 원본 파일에 있는 심볼만 사용 — 추측해서 import 금지 |

---

## §5.6 패키지 구조 + 코드 템플릿

### §5.6.1 패키지 구조
```
t3series-wingui/src/main/java/com/zionex/t3series/web/domain/<module>/<feature>/
  <Feature>.java               @Entity(TB_<DOMAIN>_<NAME>) extends BaseEntity
  <Feature>Repository.java     extends JpaRepository<Feature, String>, JpaSpecificationExecutor<Feature>
  <Feature>Service.java        @Service @RequiredArgsConstructor — search / saveAll / deleteAll
  <Feature>Controller.java     @RestController — GET /<m>/<fs>, POST /<m>/<fs>, POST /<m>/<fs>/delete
```
**참조 원본**: `web/domain/admin/user/UserController` (`/system/users`)

#### ⛔ utility 도메인 — `<module>` 토큰 강제 매핑 (2026-04-29 사고 후 강화)

| utility 화면을 만들 때 | ✅ 표준 | ❌ 절대 금지 |
|---|---|---|
| `<module>` 디렉토리 | `web/domain/util/<feature>/` | `web/domain/ut/<feature>/` |
| `package` 선언 | `com.zionex.t3series.web.domain.util.<feature>` | `com.zionex.t3series.web.domain.ut.<feature>` |
| `@RequestMapping` URL | `/util/<features>` (예: `/util/user-infos`) | `/ut/<features>` |
| 프런트 zAxios | `zAxios.get('util/<features>')` | `zAxios.get('ut/<features>')` |
| `<feature>` 자체 | `userinfo`, `issuemgmt`, `noticeboard` 등 (lowercase 단일 segment) | — |

**이유**: 2026-04-29 사고. Composer 가 `web/domain/ut/userinfo/` + `/ut/user-infos` 로 만들어
기존 `web/domain/util/` 와 혼재 → 404 + Ambiguous mapping 위험. 사용자 강력 차단 요청.

**Hook 자동 차단** (`.claude/hooks/validators/path-convention.sh`):
- Write 시 `file_path` 가 `*/web/domain/ut/*` 매칭 → block (CONTENT 비어있어도 검사)
- `package com.zionex.t3series.web.domain.ut.` → block
- `@RequestMapping("/ut/...")` → block

**Composer 자기 검증 (출력 직전)**:
```bash
# utility 도메인 산출물 1개라도 'ut/' 가 있으면 즉시 stop
grep -nE 'domain[\\./]ut[\\./]|/ut/|"ut/|''ut/' <모든 산출물>
# 매칭 0 건이어야 정상
```

"ut" 라는 3-letter 약어가 머릿속에 떠올라도 즉시 차단. `util` — 한 자도 줄이지 말 것.

### §5.6.2 Entity (BaseEntity 상속 · `@JsonIgnoreProperties(ignoreUnknown = true)` 필수)
```java
@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "TB_<DOMAIN>_<NAME>")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Feature extends BaseEntity {
    @Id @Column(name = "<PK_COL>")
    private String featureId;
    // ...
}
```

### §5.6.3 Controller (Save 패턴)
```java
@Slf4j
@RestController
@RequiredArgsConstructor
public class FeatureController {
    private final FeatureService service;
    private final ObjectMapper objectMapper;

    @GetMapping("/<m>/<fs>")
    public List<Feature> list(@RequestParam(required=false) String q) { ... }

    /** GridSaveButton 이 multipart/form-data 'changes' 로 POST */
    @Transactional
    @PostMapping("/<m>/<fs>")
    public ResponseEntity<ResponseMessage> save(HttpServletRequest request) {
        String raw = request.getParameter(ServiceConstants.PARAMETER_KEY_DATA);
        try {
            if (raw == null || raw.isBlank()) {
                return new ResponseEntity<>(new ResponseMessage(400, "changes missing"), HttpStatus.BAD_REQUEST);
            }
            List<Feature> items = objectMapper.readValue(raw, new TypeReference<List<Feature>>() {});
            service.saveAll(items);
            return new ResponseEntity<>(new ResponseMessage(200, "saved"), HttpStatus.OK);
        } catch (Exception e) {
            log.error("save failed. raw='{}' err={}", raw, e.getMessage(), e);
            return new ResponseEntity<>(new ResponseMessage(500, "save failed: " + e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /** GridDeleteRowButton onDelete → JSON body */
    @Transactional
    @PostMapping("/<m>/<fs>/delete")
    public ResponseEntity<ResponseMessage> delete(@RequestBody List<Feature> items) {
        service.deleteAll(items);
        return new ResponseEntity<>(new ResponseMessage(200, "deleted"), HttpStatus.OK);
    }
}
```

### §5.6.4 Service.saveAll (JdbcTemplate + SP 호출 — 2026-04-27 정책)

> ⚠️ **JdbcTemplate 인젝션 — Composer 단독 환경에서는 `@Qualifier("targetJdbcTemplate")` 필수.**
>
> wingui 본 환경은 단일 DataSource 라 무지정 OK. **t3-composer 단독 환경은 composer-db (PG) 와 target-mssql 2개 DataSource** 라 무지정 인젝션 시 Spring 이 PG 에 wire → MSSQL SP 호출 시 `'now' is not a recognized built-in function name` 등 syntax 오류 발생.
>
> `JavaArtifactRewriter.injectTargetJdbcTemplateQualifier()` 가 산출물 컴파일 시점에 **자동 주입** 하지만, LLM 출력 자체에 `@Qualifier` 가 있으면 더 안전. wingui 환경에는 무해 (qualifier 가 무시될 뿐).
>
> 추가로 `backend/lombok.config` 에 `lombok.copyableAnnotations += org.springframework.beans.factory.annotation.Qualifier` 가 있어야 `@RequiredArgsConstructor` 가 만드는 생성자 파라미터로 qualifier 가 복사됨.

```java
@Service
@RequiredArgsConstructor
public class FeatureService {

    @Qualifier("targetJdbcTemplate")        // ★ 단독 환경 호환 (wingui 본 환경은 무시됨)
    private final JdbcTemplate jdbcTemplate;
    private static final String SP_QUERY  = "EXEC SP_UI_<DOMAIN>_<NO>_Q1 ?, ?";
    private static final String SP_SAVE   = "EXEC SP_UI_<DOMAIN>_<NO>_S1 ?, ?, ?, ?";
    private static final String SP_DELETE = "EXEC SP_UI_<DOMAIN>_<NO>_D1 ?";

    public List<Feature> search(String f1, String f2) {
        return jdbcTemplate.query(SP_QUERY,
            new BeanPropertyRowMapper<>(Feature.class), f1, f2);
    }

    @Transactional
    public void saveAll(List<Feature> items) {
        for (Feature row : items) {
            if (row == null || StringUtils.isBlank(row.getFeatureId())) continue;
            jdbcTemplate.update(SP_SAVE,
                row.getFeatureId(), row.getField1(), row.getField2(),
                /* createBy/modifyBy 는 SP 안에서 SUSER_NAME() 또는 파라미터로 처리 */
                row.getModifyBy());
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
- `BeanPropertyRowMapper` 가 SP 결과 컬럼 (snake_case) 을 Entity camelCase 필드로 자동 매핑
- audit (`CREATE_BY`/`MODIFY_BY`/`CREATE_DTTM`/`MODIFY_DTTM`) 은 SP 안에서 처리하거나 파라미터로 전달
- transaction 은 Service 메서드 단위 — `@Transactional` 누락 시 SP 실패해도 부분 커밋

---

## §5.7 자기 검증 체크리스트 (Java 파일 출력 직전)

- [ ] 모든 import 가 `jakarta.*` 또는 프로젝트 실존 패키지인가? (`javax.*` 완전 제거)
- [ ] `BaseEntity` import 가 `com.zionex.t3series.web.util.audit.BaseEntity` 인가?
- [ ] Service 에 `SpecificationBuilder` / `QueryDslBuilder` 등 **프로젝트에 존재하지 않는** 유틸 import 가 있지 않은가?
- [ ] Controller 저장 엔드포인트가 `HttpServletRequest` + `request.getParameter(ServiceConstants.PARAMETER_KEY_DATA)` 인가?
- [ ] 참조 원본(`UserInfoController` / `UserInfoService`) 의 import 리스트와 비교해 누락·추가 없음?
- [ ] `@JsonIgnoreProperties(ignoreUnknown = true)` 어노테이션 누락 없음?
- [ ] saveAll 에서 기존 row 의 `createDttm` 보존 로직 포함?

---

## 관련 파일

- `41-composer-generation.md` — 메인 (§13 엔진 경유 화면 예외 / §14 Anti-patterns)
- `41a-composer-jsx.md` — JSX 표준 (zAxios REST 호출 패턴)
- `41c-composer-widgets.md` — 위젯 카탈로그
- `41d-composer-wizard.md` — Wizard Step4 dataBinding (JPA_ENTITY)
- `web/domain/admin/user/UserController.java` — wingui REST 관례 원본
- `web/domain/util/userinfo/` — 최신 Composer 산출물

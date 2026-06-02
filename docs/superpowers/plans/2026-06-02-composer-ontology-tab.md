# Composer Ontology Tab v1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Composer 안에 상단 Tab `[Ontology]` 를 신설해 Target DB 의 `tb_is_*` 5종 중 Q&A · Entity 를 CRUD 하고, 같은 데이터를 DataSourcePicker 의 prompt 주입에서 Answer 본문·Paraphrases·연관 Entity 까지 보강 사용한다.

**Architecture:** Target DB (MSSQL) `tb_is_*` 는 `@Qualifier("targetJdbcTemplate")` 으로 직접 읽기·쓰기. V2 가 가진 확장 필드(`paraphrases` · `relatedEntityIds`)는 composer-db (PG) 의 신규 side-table `tb_cmp_ontology_ext` 에 jsonb 로 저장 — Target DB schema 무손상. AI 어시스트는 필드별 ✨ 버튼 1개 → Claude 1회 호출 → 미리보기 모달 → 사용자 수락만 적용.

**Tech Stack:** Spring Boot 3 + JdbcTemplate · JPA · React + MUI · Anthropic Claude (`claude-sonnet-4-5` — AutoSuggestService 동일 모델) · PostgreSQL (composer-db) · MSSQL (Target DB)

**Spec:** `docs/superpowers/specs/2026-06-02-composer-ontology-tab-design.md`

---

## File Structure

**Frontend** (`frontend/src/view/util/t3composer/ontology/` — 신규):
- `OntologyPage.jsx` — 상단 Tab 진입점. 좌 트리 240px + 우 디테일 flex
- `OntologyTree.jsx` — 카테고리 트리 (Q&A · Entity · View · Process) + 카운트 + 검색
- `editors/QaEditor.jsx` — Q&A CRUD 폼
- `editors/EntityEditor.jsx` — Entity CRUD 폼
- `editors/ViewReadOnly.jsx` — View 메타 패널 (readOnly)
- `editors/ProcessReadOnly.jsx` — Process 메타 패널 (readOnly)
- `AiSuggestButton.jsx` — ✨ 공용 버튼 + diff 모달
- `api.js` — `/composer/ontology/*` zAxios 래퍼 (기존 `view/util/t3composer/api.js` 에 추가)

**Frontend 수정**:
- `frontend/src/App.jsx` — `MENU_ITEMS` 에 Ontology 항목 1줄 추가
- `frontend/src/view/util/t3composer/ModeNewGeneral.jsx` — `systemContext` 의 `[온톨로지 — Q&A]` 블록을 본문까지 직렬화
- `frontend/src/view/util/t3composer/OntologyTab.jsx` (Picker 안) — 우측 미리보기 패널 추가 + 새 API 사용

**Backend** (`backend/src/main/java/com/zionex/t3composer/domain/ontology/` — 신규):
- `entity/OntologyExtension.java` — `@Entity → tb_cmp_ontology_ext` (composer-db)
- `repository/OntologyExtensionRepository.java` — JpaRepository
- `service/OntologyService.java` — Target DB 읽기·쓰기 + extension JOIN
- `service/OntologySuggestService.java` — Claude 1회 호출
- `controller/OntologyController.java` — REST endpoints `/composer/ontology/*`
- `dto/QaDto.java` · `EntityDto.java` · `ViewMetaDto.java` · `ProcessMetaDto.java` · `TreeNodeDto.java` · `SuggestRequest.java` · `SuggestResponse.java`

**DB 마이그레이션**:
- `docker/db/init-pg/33_ontology_extension.sql` — composer-db PG. 멱등 `CREATE TABLE IF NOT EXISTS`

---

## Task 1: composer-db 마이그레이션 — tb_cmp_ontology_ext

**Files:**
- Create: `docker/db/init-pg/33_ontology_extension.sql`

- [ ] **Step 1: SQL 파일 작성**

```sql
-- 33_ontology_extension.sql
--
-- Composer Ontology Tab v1 — Target DB 의 tb_is_* (Q&A · Entity) 에 V1 schema 가
-- 가지지 않은 확장 필드 (paraphrases · relatedEntityIds · notes) 를 보관하는 side-table.
-- Target DB 는 운영 wingui 와 공유하므로 무손상 — composer-db (PG) 에 격리.
--
-- 조회: (target_cd, kind, ref_id) 로 base row 와 1:1 JOIN.
-- target_cd 까지 키에 포함시켜 다중 Target 환경(T3SERIES, B사 SCM 등)에서 격리.

CREATE TABLE IF NOT EXISTS dbo.tb_cmp_ontology_ext (
    id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    target_cd     varchar(50)   NOT NULL,        -- 'T3SERIES' 등
    kind          varchar(20)   NOT NULL,        -- 'QA' | 'ENTITY'
    ref_id        varchar(64)   NOT NULL,        -- Target DB row PK (TB_IS_QAPATTERN.id 등)
    extension     jsonb         NOT NULL DEFAULT '{}'::jsonb,
    -- { paraphrases: [string], relatedEntityIds: [string], notes: string }
    create_by     varchar(50),
    create_dttm   timestamp     DEFAULT now(),
    modify_by     varchar(50),
    modify_dttm   timestamp     DEFAULT now(),
    CONSTRAINT uk_ontology_ext UNIQUE (target_cd, kind, ref_id)
);

CREATE INDEX IF NOT EXISTS ix_ontology_ext_lookup
    ON dbo.tb_cmp_ontology_ext (target_cd, kind, ref_id);
```

- [ ] **Step 2: 기존 composer-db 에 수동 적용 (멱등 — 신규 환경은 init 시 자동)**

Run:
```bash
docker compose exec -T composer-db psql -U composer -d T3SMARTSCM -v ON_ERROR_STOP=1 \
  < docker/db/init-pg/33_ontology_extension.sql
```

Expected output:
```
CREATE TABLE
CREATE INDEX
```

(이미 적용되어 있으면 `NOTICE: relation "tb_cmp_ontology_ext" already exists, skipping` — 정상.)

- [ ] **Step 3: 테이블 생성 확인**

Run:
```bash
docker compose exec -T composer-db psql -U composer -d T3SMARTSCM -c "\d dbo.tb_cmp_ontology_ext"
```

Expected: `id` (uuid PK), `target_cd`, `kind`, `ref_id`, `extension` (jsonb), audit 4개 컬럼 표시. UNIQUE 제약 + ix index 표시.

- [ ] **Step 4: Commit**

```bash
git add docker/db/init-pg/33_ontology_extension.sql
git commit -m "feat(composer): add tb_cmp_ontology_ext for ontology side-table"
```

---

## Task 2: Backend — OntologyExtension JPA Entity + Repository

**Files:**
- Create: `backend/src/main/java/com/zionex/t3composer/domain/ontology/entity/OntologyExtension.java`
- Create: `backend/src/main/java/com/zionex/t3composer/domain/ontology/repository/OntologyExtensionRepository.java`

- [ ] **Step 1: OntologyExtension Entity 작성**

```java
package com.zionex.t3composer.domain.ontology.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * composer-db 의 dbo.tb_cmp_ontology_ext — Target DB 의 tb_is_* 에 없는 확장 필드 보관.
 * extension JSON 구조: { paraphrases:[string], relatedEntityIds:[string], notes:string }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "tb_cmp_ontology_ext", schema = "dbo")
public class OntologyExtension {

    @Id
    @Column(name = "id")
    private UUID id;

    @Column(name = "target_cd", nullable = false, length = 50)
    private String targetCd;

    @Column(name = "kind", nullable = false, length = 20)
    private String kind;   // 'QA' | 'ENTITY'

    @Column(name = "ref_id", nullable = false, length = 64)
    private String refId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "extension", nullable = false, columnDefinition = "jsonb")
    private String extensionJson;   // jsonb 직렬화 — Service 에서 ObjectMapper 로 변환

    @Column(name = "create_by", length = 50)
    private String createBy;

    @Column(name = "create_dttm")
    private LocalDateTime createDttm;

    @Column(name = "modify_by", length = 50)
    private String modifyBy;

    @Column(name = "modify_dttm")
    private LocalDateTime modifyDttm;
}
```

- [ ] **Step 2: Repository 작성**

```java
package com.zionex.t3composer.domain.ontology.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.zionex.t3composer.domain.ontology.entity.OntologyExtension;

public interface OntologyExtensionRepository extends JpaRepository<OntologyExtension, UUID> {

    Optional<OntologyExtension> findByTargetCdAndKindAndRefId(
            String targetCd, String kind, String refId);

    List<OntologyExtension> findByTargetCdAndKindAndRefIdIn(
            String targetCd, String kind, List<String> refIds);

    void deleteByTargetCdAndKindAndRefId(String targetCd, String kind, String refId);
}
```

- [ ] **Step 3: 컨테이너 backend hot-reload — 컴파일 성공 확인**

Run:
```bash
docker compose exec -T composer-backend mvn -B -DskipTests compile 2>&1 | tail -20
```

Expected: `BUILD SUCCESS` 없으면 import / type 오류 수정.

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/ontology/entity/OntologyExtension.java \
        backend/src/main/java/com/zionex/t3composer/domain/ontology/repository/OntologyExtensionRepository.java
git commit -m "feat(composer): add OntologyExtension entity + repository (composer-db side-table)"
```

---

## Task 3: Backend — DTOs

**Files:**
- Create: `backend/src/main/java/com/zionex/t3composer/domain/ontology/dto/QaDto.java`
- Create: `backend/src/main/java/com/zionex/t3composer/domain/ontology/dto/EntityDto.java`
- Create: `backend/src/main/java/com/zionex/t3composer/domain/ontology/dto/ViewMetaDto.java`
- Create: `backend/src/main/java/com/zionex/t3composer/domain/ontology/dto/ProcessMetaDto.java`
- Create: `backend/src/main/java/com/zionex/t3composer/domain/ontology/dto/TreeNodeDto.java`
- Create: `backend/src/main/java/com/zionex/t3composer/domain/ontology/dto/SuggestRequest.java`
- Create: `backend/src/main/java/com/zionex/t3composer/domain/ontology/dto/SuggestResponse.java`

- [ ] **Step 1: QaDto 작성**

```java
package com.zionex.t3composer.domain.ontology.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QaDto {
    private String id;                        // TB_IS_QAPATTERN.id (UUID 형 string)
    private String question;
    private String answer;
    private String dbType;                    // mssql/oracle/postgresql
    private String domain;                    // business_domain (BF/DP/MP/...)
    private List<String> paraphrases;         // 확장 — tb_cmp_ontology_ext.extension
    private List<String> relatedEntityIds;    // 확장
    private String notes;                     // 확장
    private LocalDateTime modifyDttm;         // optimistic lock 용
}
```

- [ ] **Step 2: EntityDto 작성**

```java
package com.zionex.t3composer.domain.ontology.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EntityDto {
    private String id;                       // tb_is_ontlgy_entity.id
    private String version;                  // (id, version) 복합 키 — 1.0 기본
    private String name;
    private String entityType;
    private String description;
    private List<String> terms;              // 검색 별칭
    private String status;                   // CANDIDATE/REVIEWING/CONFIRMED
    private Double importanceScore;
    private List<String> relatedTableNames;  // 확장 — tb_cmp_ontology_ext.extension
    private String notes;
    private LocalDateTime modifyDttm;
}
```

- [ ] **Step 3: ViewMetaDto / ProcessMetaDto 작성**

```java
package com.zionex.t3composer.domain.ontology.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ViewMetaDto {
    private String id;
    private String menuCd;
    private String status;
    private String publishedVersion;
}
```

```java
package com.zionex.t3composer.domain.ontology.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessMetaDto {
    private String id;
    private String processCd;
    private String processName;
    private String processOverview;
    private String module;
    private String status;
    private String version;
}
```

- [ ] **Step 4: TreeNodeDto 작성**

```java
package com.zionex.t3composer.domain.ontology.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 좌 트리 1개 노드. 카테고리(루트) → 도메인(중간) → row(리프).
 * - category: 'QA' | 'ENTITY' | 'VIEW' | 'PROCESS'
 * - readOnly: true 면 우 패널이 ViewReadOnly/ProcessReadOnly 로 swap
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TreeNodeDto {
    private String key;          // 'QA' / 'QA:BF' / 'QA:BF:7c3a-...'
    private String category;     // 'QA' | 'ENTITY' | 'VIEW' | 'PROCESS'
    private String label;        // 사용자가 보는 라벨
    private String refId;        // 리프만 (Target DB row id)
    private boolean readOnly;
    private Integer count;       // 중간 노드의 자식 수
    private List<TreeNodeDto> children;
}
```

- [ ] **Step 5: SuggestRequest / SuggestResponse 작성**

```java
package com.zionex.t3composer.domain.ontology.dto;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuggestRequest {
    private String field;          // 'question' | 'answer' | 'paraphrases' | 'relatedEntityIds' | 'domain'
    private String kind;           // 'QA' | 'ENTITY'
    private String targetCd;
    private Map<String, Object> row;   // 현재 row state — Service 가 필요한 필드만 추출
}
```

```java
package com.zionex.t3composer.domain.ontology.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuggestResponse {
    private boolean ok;
    private String message;
    private Object value;     // String / List / Map — 필드에 따라 다름
    private String modelName;
}
```

- [ ] **Step 6: 컴파일 확인 + Commit**

Run:
```bash
docker compose exec -T composer-backend mvn -B -DskipTests compile 2>&1 | tail -10
```

Expected: `BUILD SUCCESS`.

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/ontology/dto/
git commit -m "feat(composer): add ontology DTOs (Qa/Entity/ViewMeta/ProcessMeta/TreeNode/Suggest)"
```

---

## Task 4: Backend — OntologyService skeleton + Tree endpoint

**Files:**
- Create: `backend/src/main/java/com/zionex/t3composer/domain/ontology/service/OntologyService.java`
- Create: `backend/src/main/java/com/zionex/t3composer/domain/ontology/controller/OntologyController.java`

- [ ] **Step 1: OntologyService 작성 (tree 메서드만 — 다음 task 들에서 확장)**

```java
package com.zionex.t3composer.domain.ontology.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3composer.config.TargetDataSourceRegistry;
import com.zionex.t3composer.domain.ontology.dto.TreeNodeDto;
import com.zionex.t3composer.domain.ontology.repository.OntologyExtensionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Ontology Tab 의 Target DB 읽기·쓰기 + composer-db extension JOIN.
 *
 * Target DB 라우팅: TargetDataSourceRegistry 로 세션 targetCd 의 live JdbcTemplate.
 * Target 미등록/연결 실패 → 정적 targetJdbcTemplate 폴백.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OntologyService {

    @Qualifier("targetJdbcTemplate")
    private final JdbcTemplate fallbackTarget;
    private final TargetDataSourceRegistry registry;
    private final OntologyExtensionRepository extRepo;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /** 세션의 targetCd → live JdbcTemplate. 미등록/실패 시 정적 폴백. */
    private JdbcTemplate jdbc(String targetCd) {
        if (targetCd == null || targetCd.isBlank()) return fallbackTarget;
        try {
            JdbcTemplate live = registry.getJdbcTemplate(targetCd);
            return live != null ? live : fallbackTarget;
        } catch (Exception e) {
            log.warn("OntologyService: target {} 라우팅 실패, 폴백 사용: {}", targetCd, e.getMessage());
            return fallbackTarget;
        }
    }

    /**
     * 좌 트리 — 카테고리별 카운트 + 도메인 그룹.
     * 검색어 q 가 있으면 모든 카테고리에서 필터링.
     */
    public List<TreeNodeDto> tree(String targetCd, String q) {
        JdbcTemplate t = jdbc(targetCd);
        List<TreeNodeDto> roots = new ArrayList<>();

        roots.add(buildCategory(t, "QA", q,
            "SELECT id, business_domain FROM TB_IS_QAPATTERN WITH (NOLOCK)"
          + " WHERE use_yn='Y'"
          + (q != null && !q.isBlank() ? " AND (question LIKE :q OR business_domain LIKE :q)" : "")
          + " ORDER BY business_domain ASC, id ASC", q,
            "id", "business_domain", false));

        roots.add(buildCategory(t, "ENTITY", q,
            "SELECT id, COALESCE(entity_type, '?') AS dom FROM tb_is_ontlgy_entity WITH (NOLOCK)"
          + " WHERE ISNULL(use_yn,'Y')='Y'"
          + (q != null && !q.isBlank() ? " AND (name LIKE :q OR entity_type LIKE :q OR terms LIKE :q)" : "")
          + " ORDER BY entity_type ASC, name ASC", q,
            "id", "dom", false));

        roots.add(buildCategory(t, "VIEW", q,
            "SELECT id, COALESCE(menu_cd,'?') AS dom FROM tb_is_vwbusnss_ontlgy WITH (NOLOCK)"
          + " WHERE use_yn='Y'"
          + (q != null && !q.isBlank() ? " AND menu_cd LIKE :q" : "")
          + " ORDER BY menu_cd ASC", q,
            "id", "dom", true));

        roots.add(buildCategory(t, "PROCESS", q,
            "SELECT id, COALESCE(module,'?') AS dom FROM tb_is_prcss_ontlgy WITH (NOLOCK)"
          + " WHERE ISNULL(use_yn,'Y')='Y'"
          + (q != null && !q.isBlank() ? " AND (process_cd LIKE :q OR process_name LIKE :q OR module LIKE :q)" : "")
          + " ORDER BY module ASC, process_cd ASC", q,
            "id", "dom", true));

        return roots;
    }

    private TreeNodeDto buildCategory(JdbcTemplate t, String cat, String q,
                                      String sql, String qParam,
                                      String idCol, String domCol, boolean readOnly) {
        String label = switch (cat) {
            case "QA" -> "Q&A";
            case "ENTITY" -> "Entity";
            case "VIEW" -> "View";
            case "PROCESS" -> "Process";
            default -> cat;
        };
        List<TreeNodeDto> domainNodes = new ArrayList<>();
        try {
            String resolved = sql.replace(":q", "?");
            List<Map<String, Object>> rows = (qParam != null && !qParam.isBlank())
                ? t.queryForList(resolved, "%" + qParam + "%")
                : t.queryForList(resolved);

            java.util.Map<String, List<TreeNodeDto>> byDom = new java.util.LinkedHashMap<>();
            for (Map<String, Object> r : rows) {
                String dom = r.get(domCol) == null ? "?" : r.get(domCol).toString();
                String id = r.get(idCol) == null ? "" : r.get(idCol).toString();
                byDom.computeIfAbsent(dom, k -> new ArrayList<>())
                     .add(TreeNodeDto.builder()
                         .key(cat + ":" + dom + ":" + id)
                         .category(cat).refId(id).label(id)
                         .readOnly(readOnly).build());
            }
            for (var e : byDom.entrySet()) {
                domainNodes.add(TreeNodeDto.builder()
                    .key(cat + ":" + e.getKey())
                    .category(cat).label(e.getKey())
                    .readOnly(readOnly).count(e.getValue().size())
                    .children(e.getValue()).build());
            }
        } catch (Exception ex) {
            log.warn("tree({}) 실패: {} — 카운트 0 로 폴백", cat, ex.getMessage());
        }
        int total = domainNodes.stream().mapToInt(n -> n.getCount() == null ? 0 : n.getCount()).sum();
        return TreeNodeDto.builder()
            .key(cat).category(cat).label(label).readOnly(readOnly)
            .count(total).children(domainNodes).build();
    }
}
```

- [ ] **Step 2: OntologyController 작성 (tree endpoint 만)**

```java
package com.zionex.t3composer.domain.ontology.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.zionex.t3composer.domain.ontology.dto.TreeNodeDto;
import com.zionex.t3composer.domain.ontology.service.OntologyService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/composer/ontology")
public class OntologyController {

    private final OntologyService service;

    @GetMapping("/tree")
    public List<TreeNodeDto> tree(
            @RequestParam(value = "targetCd", required = false) String targetCd,
            @RequestParam(value = "q", required = false) String q) {
        return service.tree(targetCd, q);
    }
}
```

- [ ] **Step 3: backend devtools restart 트리거 + 검증**

Run:
```bash
docker compose exec -T composer-backend mvn -B -DskipTests compile && \
docker compose exec -T composer-backend bash -c 'date +%s > /app/target/classes/.devtools-restart-trigger'
sleep 8   # DevTools restart 대기
curl -s "http://localhost:8090/composer/ontology/tree?targetCd=T3SERIES" | head -c 500
```

Expected: JSON 배열 — `[{"key":"QA","category":"QA","label":"Q&A","count":..., "children":[...]}, ...]`. 4개 카테고리 노드.

만약 target 미연결이면 모든 count=0 + children=[] (정상 폴백).

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/ontology/service/OntologyService.java \
        backend/src/main/java/com/zionex/t3composer/domain/ontology/controller/OntologyController.java
git commit -m "feat(composer): OntologyService.tree() + GET /composer/ontology/tree"
```

---

## Task 5: Backend — Q&A GET single + bulk

**Files:**
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/ontology/service/OntologyService.java` (메서드 추가)
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/ontology/controller/OntologyController.java` (endpoint 추가)

- [ ] **Step 1: OntologyService 에 Q&A 단건/다건 메서드 추가**

기존 `OntologyService.java` 의 마지막 메서드 뒤에 추가:

```java
    // ─────────────────────────── Q&A ───────────────────────────

    public com.zionex.t3composer.domain.ontology.dto.QaDto getQa(String targetCd, String id) {
        JdbcTemplate t = jdbc(targetCd);
        List<Map<String, Object>> rows = t.queryForList(
            "SELECT id, question, answer, db_type, business_domain, modify_dttm"
          + " FROM TB_IS_QAPATTERN WITH (NOLOCK)"
          + " WHERE id = ? AND use_yn='Y'", id);
        if (rows.isEmpty()) return null;
        Map<String, Object> r = rows.get(0);

        var ext = extRepo.findByTargetCdAndKindAndRefId(safeTarget(targetCd), "QA", id);
        Map<String, Object> extMap = parseExtension(ext.map(e -> e.getExtensionJson()).orElse("{}"));

        return com.zionex.t3composer.domain.ontology.dto.QaDto.builder()
            .id(asString(r.get("id")))
            .question(asString(r.get("question")))
            .answer(asString(r.get("answer")))
            .dbType(asString(r.get("db_type")))
            .domain(asString(r.get("business_domain")))
            .paraphrases(asStringList(extMap.get("paraphrases")))
            .relatedEntityIds(asStringList(extMap.get("relatedEntityIds")))
            .notes(asString(extMap.get("notes")))
            .modifyDttm(asLdt(r.get("modify_dttm")))
            .build();
    }

    public List<com.zionex.t3composer.domain.ontology.dto.QaDto> getQaBulk(
            String targetCd, List<String> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        JdbcTemplate t = jdbc(targetCd);

        // IN 절을 위한 placeholder 조립
        String placeholders = String.join(",", ids.stream().map(s -> "?").toList());
        Object[] params = ids.toArray();
        List<Map<String, Object>> rows = t.queryForList(
            "SELECT id, question, answer, db_type, business_domain, modify_dttm"
          + " FROM TB_IS_QAPATTERN WITH (NOLOCK)"
          + " WHERE id IN (" + placeholders + ") AND use_yn='Y'", params);

        var exts = extRepo.findByTargetCdAndKindAndRefIdIn(safeTarget(targetCd), "QA", ids);
        java.util.Map<String, String> extByRef = new java.util.HashMap<>();
        for (var e : exts) extByRef.put(e.getRefId(), e.getExtensionJson());

        List<com.zionex.t3composer.domain.ontology.dto.QaDto> out = new ArrayList<>(rows.size());
        for (Map<String, Object> r : rows) {
            String id = asString(r.get("id"));
            Map<String, Object> extMap = parseExtension(extByRef.getOrDefault(id, "{}"));
            out.add(com.zionex.t3composer.domain.ontology.dto.QaDto.builder()
                .id(id)
                .question(asString(r.get("question")))
                .answer(asString(r.get("answer")))
                .dbType(asString(r.get("db_type")))
                .domain(asString(r.get("business_domain")))
                .paraphrases(asStringList(extMap.get("paraphrases")))
                .relatedEntityIds(asStringList(extMap.get("relatedEntityIds")))
                .notes(asString(extMap.get("notes")))
                .modifyDttm(asLdt(r.get("modify_dttm")))
                .build());
        }
        return out;
    }

    // ─────────────────────────── helpers ───────────────────────────

    private String safeTarget(String c) { return (c == null || c.isBlank()) ? "T3SERIES" : c; }
    private String asString(Object o) { return o == null ? null : o.toString(); }

    @SuppressWarnings("unchecked")
    private List<String> asStringList(Object o) {
        if (!(o instanceof List)) return new ArrayList<>();
        List<Object> raw = (List<Object>) o;
        return raw.stream().filter(java.util.Objects::nonNull).map(Object::toString).toList();
    }

    private java.time.LocalDateTime asLdt(Object o) {
        if (o == null) return null;
        if (o instanceof java.time.LocalDateTime ldt) return ldt;
        if (o instanceof java.sql.Timestamp ts) return ts.toLocalDateTime();
        return null;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseExtension(String json) {
        try {
            if (json == null || json.isBlank()) return new java.util.HashMap<>();
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            log.warn("extension JSON parse 실패: {}", e.getMessage());
            return new java.util.HashMap<>();
        }
    }
```

- [ ] **Step 2: OntologyController 에 Q&A GET endpoint 추가**

```java
    // ─────────────────────────── Q&A ───────────────────────────

    @GetMapping("/qa/{id}")
    public com.zionex.t3composer.domain.ontology.dto.QaDto getQa(
            @PathVariable String id,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        return service.getQa(targetCd, id);
    }

    @GetMapping("/qa/bulk")
    public List<com.zionex.t3composer.domain.ontology.dto.QaDto> getQaBulk(
            @RequestParam(value = "ids") String idsCsv,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        if (idsCsv == null || idsCsv.isBlank()) return List.of();
        return service.getQaBulk(targetCd,
            java.util.Arrays.stream(idsCsv.split(",")).map(String::trim)
                .filter(s -> !s.isEmpty()).toList());
    }
```

`@PathVariable`/`@RequestParam` import 확인:
```java
import org.springframework.web.bind.annotation.PathVariable;
```

- [ ] **Step 3: 빌드 + 검증**

Run:
```bash
docker compose exec -T composer-backend mvn -B -DskipTests compile && \
docker compose exec -T composer-backend bash -c 'date +%s > /app/target/classes/.devtools-restart-trigger'
sleep 8
# 트리에서 임의 Q&A id 1개 추출
QA_ID=$(curl -s "http://localhost:8090/composer/ontology/tree?targetCd=T3SERIES" \
  | python -c "import sys,json; r=json.load(sys.stdin)[0]; print(r['children'][0]['children'][0]['refId'])" 2>/dev/null)
echo "Pick: $QA_ID"
curl -s "http://localhost:8090/composer/ontology/qa/$QA_ID?targetCd=T3SERIES" | head -c 500
```

Expected: JSON `{ id, question, answer, dbType, domain, paraphrases:[], relatedEntityIds:[], notes:null, modifyDttm:... }`. extension 은 아직 빈 배열/null (Task 6 에서 쓰기 시작).

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/ontology/service/OntologyService.java \
        backend/src/main/java/com/zionex/t3composer/domain/ontology/controller/OntologyController.java
git commit -m "feat(composer): GET /composer/ontology/qa/{id} + /qa/bulk with extension JOIN"
```

---

## Task 6: Backend — Q&A POST/PUT/DELETE (with extension upsert)

**Files:**
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/ontology/service/OntologyService.java`
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/ontology/controller/OntologyController.java`

- [ ] **Step 1: Service 에 Q&A 쓰기 메서드 + upsert 헬퍼 추가**

`OntologyService.java` 의 헬퍼 위에 추가:

```java
    @org.springframework.transaction.annotation.Transactional
    public com.zionex.t3composer.domain.ontology.dto.QaDto createQa(
            String targetCd, com.zionex.t3composer.domain.ontology.dto.QaDto dto, String userId) {
        JdbcTemplate t = jdbc(targetCd);
        String id = java.util.UUID.randomUUID().toString().replace("-", "");
        t.update(
            "INSERT INTO TB_IS_QAPATTERN (id, question, answer, db_type, business_domain,"
          + " use_yn, create_by, create_dttm, modify_by, modify_dttm)"
          + " VALUES (?, ?, ?, ?, ?, 'Y', ?, GETDATE(), ?, GETDATE())",
            id, dto.getQuestion(), dto.getAnswer(), dto.getDbType(), dto.getDomain(),
            userId, userId);
        upsertExtension(targetCd, "QA", id, dto.getParaphrases(), dto.getRelatedEntityIds(),
                        dto.getNotes(), userId);
        return getQa(targetCd, id);
    }

    @org.springframework.transaction.annotation.Transactional
    public com.zionex.t3composer.domain.ontology.dto.QaDto updateQa(
            String targetCd, String id,
            com.zionex.t3composer.domain.ontology.dto.QaDto dto,
            java.time.LocalDateTime ifMatchModifyDttm, String userId) {
        JdbcTemplate t = jdbc(targetCd);

        if (ifMatchModifyDttm != null) {
            List<Map<String, Object>> cur = t.queryForList(
                "SELECT modify_dttm FROM TB_IS_QAPATTERN WHERE id = ?", id);
            if (cur.isEmpty()) throw new java.util.NoSuchElementException("Q&A not found: " + id);
            java.time.LocalDateTime db = asLdt(cur.get(0).get("modify_dttm"));
            if (db != null && !db.equals(ifMatchModifyDttm)) {
                throw new OptimisticLockException("modify_dttm mismatch");
            }
        }

        int n = t.update(
            "UPDATE TB_IS_QAPATTERN SET question=?, answer=?, db_type=?, business_domain=?,"
          + " modify_by=?, modify_dttm=GETDATE()"
          + " WHERE id = ? AND use_yn='Y'",
            dto.getQuestion(), dto.getAnswer(), dto.getDbType(), dto.getDomain(), userId, id);
        if (n == 0) throw new java.util.NoSuchElementException("Q&A not found or deleted: " + id);

        upsertExtension(targetCd, "QA", id, dto.getParaphrases(), dto.getRelatedEntityIds(),
                        dto.getNotes(), userId);
        return getQa(targetCd, id);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteQa(String targetCd, String id, String userId) {
        JdbcTemplate t = jdbc(targetCd);
        int n = t.update(
            "UPDATE TB_IS_QAPATTERN SET use_yn='N', modify_by=?, modify_dttm=GETDATE() WHERE id=?",
            userId, id);
        if (n == 0) throw new java.util.NoSuchElementException("Q&A not found: " + id);
        // extension 은 그대로 둔다 (soft delete — 복원 시 재사용)
    }

    /** 모든 카테고리 공용 extension upsert. */
    @org.springframework.transaction.annotation.Transactional
    public void upsertExtension(String targetCd, String kind, String refId,
                                 List<String> paraphrases, List<String> relatedEntityIds,
                                 String notes, String userId) {
        Map<String, Object> ext = new java.util.LinkedHashMap<>();
        if (paraphrases != null) ext.put("paraphrases", paraphrases);
        if (relatedEntityIds != null) ext.put("relatedEntityIds", relatedEntityIds);
        if (notes != null) ext.put("notes", notes);
        String json;
        try { json = objectMapper.writeValueAsString(ext); }
        catch (Exception e) { json = "{}"; }

        String tc = safeTarget(targetCd);
        var existing = extRepo.findByTargetCdAndKindAndRefId(tc, kind, refId);
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        if (existing.isPresent()) {
            var e = existing.get();
            e.setExtensionJson(json);
            e.setModifyBy(userId);
            e.setModifyDttm(now);
            extRepo.save(e);
        } else {
            extRepo.save(com.zionex.t3composer.domain.ontology.entity.OntologyExtension.builder()
                .id(java.util.UUID.randomUUID())
                .targetCd(tc).kind(kind).refId(refId).extensionJson(json)
                .createBy(userId).createDttm(now).modifyBy(userId).modifyDttm(now)
                .build());
        }
    }

    /** 412 Precondition Failed 로 매핑할 충돌 시그널. */
    public static class OptimisticLockException extends RuntimeException {
        public OptimisticLockException(String msg) { super(msg); }
    }
```

- [ ] **Step 2: Controller 에 Q&A CUD endpoint 추가**

`OntologyController.java` 에 추가:

```java
    @org.springframework.web.bind.annotation.PostMapping("/qa")
    public com.zionex.t3composer.domain.ontology.dto.QaDto createQa(
            @org.springframework.web.bind.annotation.RequestBody
                com.zionex.t3composer.domain.ontology.dto.QaDto dto,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        return service.createQa(targetCd, dto, "composer-dev");
    }

    @org.springframework.web.bind.annotation.PutMapping("/qa/{id}")
    public org.springframework.http.ResponseEntity<com.zionex.t3composer.domain.ontology.dto.QaDto> updateQa(
            @PathVariable String id,
            @org.springframework.web.bind.annotation.RequestBody
                com.zionex.t3composer.domain.ontology.dto.QaDto dto,
            @org.springframework.web.bind.annotation.RequestHeader(value = "If-Match", required = false) String ifMatch,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        java.time.LocalDateTime ifMatchDt = null;
        if (ifMatch != null && !ifMatch.isBlank()) {
            try { ifMatchDt = java.time.LocalDateTime.parse(ifMatch); }
            catch (Exception ignore) { /* 헤더 무효 — 충돌 검사 skip */ }
        }
        try {
            var saved = service.updateQa(targetCd, id, dto, ifMatchDt, "composer-dev");
            return org.springframework.http.ResponseEntity.ok(saved);
        } catch (OntologyService.OptimisticLockException ex) {
            return org.springframework.http.ResponseEntity
                .status(org.springframework.http.HttpStatus.PRECONDITION_FAILED).build();
        }
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/qa/{id}")
    public void deleteQa(
            @PathVariable String id,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        service.deleteQa(targetCd, id, "composer-dev");
    }
```

- [ ] **Step 3: 빌드 + curl 검증 (생성·수정·삭제 라운드트립)**

Run:
```bash
docker compose exec -T composer-backend mvn -B -DskipTests compile && \
docker compose exec -T composer-backend bash -c 'date +%s > /app/target/classes/.devtools-restart-trigger'
sleep 8

# 신규 생성
NEW_ID=$(curl -s -X POST "http://localhost:8090/composer/ontology/qa?targetCd=T3SERIES" \
  -H 'Content-Type: application/json' \
  -d '{"question":"테스트 Q","answer":"테스트 A","dbType":"mssql","domain":"BF","paraphrases":["변형1","변형2"]}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "NEW: $NEW_ID"

# 조회
curl -s "http://localhost:8090/composer/ontology/qa/$NEW_ID?targetCd=T3SERIES"

# soft delete
curl -s -X DELETE "http://localhost:8090/composer/ontology/qa/$NEW_ID?targetCd=T3SERIES" -w "%{http_code}\n"

# 조회 — 삭제 후 null
curl -s "http://localhost:8090/composer/ontology/qa/$NEW_ID?targetCd=T3SERIES"
```

Expected:
- POST: id + 본문 + paraphrases: ["변형1","변형2"]
- 첫 GET: 본문 정상
- DELETE: 200
- 두번째 GET: 빈 응답 (use_yn='N' 이라 SELECT 가 걸러냄)

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/ontology/
git commit -m "feat(composer): Q&A POST/PUT/DELETE + If-Match optimistic lock + extension upsert"
```

---

## Task 7: Backend — Entity GET + CUD (mirror Q&A)

**Files:**
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/ontology/service/OntologyService.java`
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/ontology/controller/OntologyController.java`

- [ ] **Step 1: Service 에 Entity GET 추가**

```java
    // ─────────────────────────── Entity ───────────────────────────

    public com.zionex.t3composer.domain.ontology.dto.EntityDto getEntity(String targetCd, String id) {
        JdbcTemplate t = jdbc(targetCd);
        List<Map<String, Object>> rows = t.queryForList(
            "SELECT TOP 1 id, version, name, entity_type, description, status,"
          + "       importance_score, terms"
          + " FROM tb_is_ontlgy_entity WITH (NOLOCK)"
          + " WHERE id = ? AND ISNULL(use_yn,'Y')='Y'"
          + " ORDER BY version DESC", id);
        if (rows.isEmpty()) return null;
        Map<String, Object> r = rows.get(0);

        var ext = extRepo.findByTargetCdAndKindAndRefId(safeTarget(targetCd), "ENTITY", id);
        Map<String, Object> extMap = parseExtension(ext.map(e -> e.getExtensionJson()).orElse("{}"));

        return com.zionex.t3composer.domain.ontology.dto.EntityDto.builder()
            .id(asString(r.get("id")))
            .version(asString(r.get("version")))
            .name(asString(r.get("name")))
            .entityType(asString(r.get("entity_type")))
            .description(asString(r.get("description")))
            .terms(splitTerms(asString(r.get("terms"))))
            .status(asString(r.get("status")))
            .importanceScore(r.get("importance_score") == null ? null
                : Double.valueOf(r.get("importance_score").toString()))
            .relatedTableNames(asStringList(extMap.get("relatedTableNames")))
            .notes(asString(extMap.get("notes")))
            .build();
    }

    public List<com.zionex.t3composer.domain.ontology.dto.EntityDto> getEntityBulk(
            String targetCd, List<String> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        List<com.zionex.t3composer.domain.ontology.dto.EntityDto> out = new ArrayList<>();
        for (String id : ids) {
            var dto = getEntity(targetCd, id);
            if (dto != null) out.add(dto);
        }
        return out;
    }

    @org.springframework.transaction.annotation.Transactional
    public com.zionex.t3composer.domain.ontology.dto.EntityDto createEntity(
            String targetCd, com.zionex.t3composer.domain.ontology.dto.EntityDto dto, String userId) {
        JdbcTemplate t = jdbc(targetCd);
        String id = java.util.UUID.randomUUID().toString().replace("-", "");
        String version = dto.getVersion() == null ? "1.0" : dto.getVersion();
        t.update(
            "INSERT INTO tb_is_ontlgy_entity (id, version, name, entity_type, description,"
          + " status, importance_score, terms, use_yn, create_by, create_dttm, modify_by, modify_dttm)"
          + " VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Y', ?, GETDATE(), ?, GETDATE())",
            id, version, dto.getName(), dto.getEntityType(), dto.getDescription(),
            dto.getStatus() == null ? "CONFIRMED" : dto.getStatus(),
            dto.getImportanceScore(), joinTerms(dto.getTerms()), userId, userId);
        upsertExtension(targetCd, "ENTITY", id, null, null,   // entity 는 paraphrases/relatedEntityIds 없음
            dto.getNotes(), userId);
        // relatedTableNames 는 ext 에 별도 — 다음 헬퍼로
        upsertEntityExtTables(targetCd, id, dto.getRelatedTableNames(), userId);
        return getEntity(targetCd, id);
    }

    @org.springframework.transaction.annotation.Transactional
    public com.zionex.t3composer.domain.ontology.dto.EntityDto updateEntity(
            String targetCd, String id,
            com.zionex.t3composer.domain.ontology.dto.EntityDto dto, String userId) {
        JdbcTemplate t = jdbc(targetCd);
        int n = t.update(
            "UPDATE tb_is_ontlgy_entity SET name=?, entity_type=?, description=?,"
          + " status=?, importance_score=?, terms=?, modify_by=?, modify_dttm=GETDATE()"
          + " WHERE id=? AND ISNULL(use_yn,'Y')='Y'",
            dto.getName(), dto.getEntityType(), dto.getDescription(),
            dto.getStatus(), dto.getImportanceScore(), joinTerms(dto.getTerms()),
            userId, id);
        if (n == 0) throw new java.util.NoSuchElementException("Entity not found: " + id);
        upsertEntityExtTables(targetCd, id, dto.getRelatedTableNames(), userId);
        return getEntity(targetCd, id);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteEntity(String targetCd, String id, String userId) {
        jdbc(targetCd).update(
            "UPDATE tb_is_ontlgy_entity SET use_yn='N', modify_by=?, modify_dttm=GETDATE() WHERE id=?",
            userId, id);
    }

    private void upsertEntityExtTables(String targetCd, String id, List<String> tables, String userId) {
        // entity 의 extension JSON 안에 relatedTableNames 만 별도 갱신 (paraphrases/relatedEntityIds 미사용).
        Map<String, Object> ext = new java.util.LinkedHashMap<>();
        if (tables != null) ext.put("relatedTableNames", tables);
        String json;
        try { json = objectMapper.writeValueAsString(ext); }
        catch (Exception e) { json = "{}"; }
        String tc = safeTarget(targetCd);
        var existing = extRepo.findByTargetCdAndKindAndRefId(tc, "ENTITY", id);
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        if (existing.isPresent()) {
            var e = existing.get();
            // notes 보존 (다른 메서드에서 set 했을 수 있음) — merge
            Map<String, Object> merged = parseExtension(e.getExtensionJson());
            merged.putAll(ext);
            try { e.setExtensionJson(objectMapper.writeValueAsString(merged)); }
            catch (Exception ignore) { e.setExtensionJson(json); }
            e.setModifyBy(userId); e.setModifyDttm(now);
            extRepo.save(e);
        } else {
            extRepo.save(com.zionex.t3composer.domain.ontology.entity.OntologyExtension.builder()
                .id(java.util.UUID.randomUUID())
                .targetCd(tc).kind("ENTITY").refId(id).extensionJson(json)
                .createBy(userId).createDttm(now).modifyBy(userId).modifyDttm(now).build());
        }
    }

    private List<String> splitTerms(String terms) {
        if (terms == null || terms.isBlank()) return new ArrayList<>();
        return java.util.Arrays.stream(terms.split("[,;|]"))
            .map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    private String joinTerms(List<String> terms) {
        if (terms == null || terms.isEmpty()) return null;
        return String.join(",", terms);
    }
```

- [ ] **Step 2: Controller 에 Entity endpoint 추가**

```java
    // ─────────────────────────── Entity ───────────────────────────

    @GetMapping("/entity/{id}")
    public com.zionex.t3composer.domain.ontology.dto.EntityDto getEntity(
            @PathVariable String id,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        return service.getEntity(targetCd, id);
    }

    @GetMapping("/entity/bulk")
    public List<com.zionex.t3composer.domain.ontology.dto.EntityDto> getEntityBulk(
            @RequestParam("ids") String idsCsv,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        if (idsCsv == null || idsCsv.isBlank()) return List.of();
        return service.getEntityBulk(targetCd,
            java.util.Arrays.stream(idsCsv.split(",")).map(String::trim)
                .filter(s -> !s.isEmpty()).toList());
    }

    @org.springframework.web.bind.annotation.PostMapping("/entity")
    public com.zionex.t3composer.domain.ontology.dto.EntityDto createEntity(
            @org.springframework.web.bind.annotation.RequestBody
                com.zionex.t3composer.domain.ontology.dto.EntityDto dto,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        return service.createEntity(targetCd, dto, "composer-dev");
    }

    @org.springframework.web.bind.annotation.PutMapping("/entity/{id}")
    public com.zionex.t3composer.domain.ontology.dto.EntityDto updateEntity(
            @PathVariable String id,
            @org.springframework.web.bind.annotation.RequestBody
                com.zionex.t3composer.domain.ontology.dto.EntityDto dto,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        return service.updateEntity(targetCd, id, dto, "composer-dev");
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/entity/{id}")
    public void deleteEntity(
            @PathVariable String id,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        service.deleteEntity(targetCd, id, "composer-dev");
    }
```

- [ ] **Step 3: 빌드 + 검증 (생성·수정·삭제 라운드트립)**

Run:
```bash
docker compose exec -T composer-backend mvn -B -DskipTests compile && \
docker compose exec -T composer-backend bash -c 'date +%s > /app/target/classes/.devtools-restart-trigger'
sleep 8

NEW_ENT_ID=$(curl -s -X POST "http://localhost:8090/composer/ontology/entity?targetCd=T3SERIES" \
  -H 'Content-Type: application/json' \
  -d '{"name":"TEST_ENTITY","entityType":"KPI","description":"테스트용","status":"CONFIRMED","importanceScore":0.5,"terms":["테스트","TEST"],"relatedTableNames":["TB_FOO","TB_BAR"]}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['id'])")
curl -s "http://localhost:8090/composer/ontology/entity/$NEW_ENT_ID?targetCd=T3SERIES"
curl -s -X DELETE "http://localhost:8090/composer/ontology/entity/$NEW_ENT_ID?targetCd=T3SERIES" -w "%{http_code}\n"
```

Expected: POST → relatedTableNames 보존 · GET → 일치 · DELETE 200.

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/ontology/
git commit -m "feat(composer): Entity CRUD endpoints + tb_cmp_ontology_ext relatedTableNames"
```

---

## Task 8: Backend — View / Process read-only GET endpoints

**Files:**
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/ontology/service/OntologyService.java`
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/ontology/controller/OntologyController.java`

- [ ] **Step 1: Service 에 View / Process 단건 조회 추가**

```java
    // ─────────────────────────── View / Process (read-only) ───────────────────────────

    public com.zionex.t3composer.domain.ontology.dto.ViewMetaDto getView(String targetCd, String menuCd) {
        JdbcTemplate t = jdbc(targetCd);
        List<Map<String, Object>> rows = t.queryForList(
            "SELECT id, menu_cd, status, published_version"
          + " FROM tb_is_vwbusnss_ontlgy WITH (NOLOCK)"
          + " WHERE menu_cd = ? AND use_yn='Y'", menuCd);
        if (rows.isEmpty()) return null;
        Map<String, Object> r = rows.get(0);
        return com.zionex.t3composer.domain.ontology.dto.ViewMetaDto.builder()
            .id(asString(r.get("id"))).menuCd(asString(r.get("menu_cd")))
            .status(asString(r.get("status")))
            .publishedVersion(asString(r.get("published_version")))
            .build();
    }

    public com.zionex.t3composer.domain.ontology.dto.ProcessMetaDto getProcess(
            String targetCd, String processCd) {
        JdbcTemplate t = jdbc(targetCd);
        List<Map<String, Object>> rows = t.queryForList(
            "SELECT id, process_cd, process_name, process_overview, module, status, version"
          + " FROM tb_is_prcss_ontlgy WITH (NOLOCK)"
          + " WHERE process_cd = ? AND ISNULL(use_yn,'Y')='Y'", processCd);
        if (rows.isEmpty()) return null;
        Map<String, Object> r = rows.get(0);
        return com.zionex.t3composer.domain.ontology.dto.ProcessMetaDto.builder()
            .id(asString(r.get("id"))).processCd(asString(r.get("process_cd")))
            .processName(asString(r.get("process_name")))
            .processOverview(asString(r.get("process_overview")))
            .module(asString(r.get("module")))
            .status(asString(r.get("status"))).version(asString(r.get("version")))
            .build();
    }
```

- [ ] **Step 2: Controller 에 endpoint 추가**

```java
    // ─────────────────────────── View / Process ───────────────────────────

    @GetMapping("/view/{menuCd}")
    public com.zionex.t3composer.domain.ontology.dto.ViewMetaDto getView(
            @PathVariable String menuCd,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        return service.getView(targetCd, menuCd);
    }

    @GetMapping("/process/{processCd}")
    public com.zionex.t3composer.domain.ontology.dto.ProcessMetaDto getProcess(
            @PathVariable String processCd,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        return service.getProcess(targetCd, processCd);
    }
```

- [ ] **Step 3: 빌드 + 검증**

Run:
```bash
docker compose exec -T composer-backend mvn -B -DskipTests compile && \
docker compose exec -T composer-backend bash -c 'date +%s > /app/target/classes/.devtools-restart-trigger'
sleep 8

# 트리에서 VIEW 노드의 menuCd 1개 추출 — 또는 알려진 값 (예: UI_DP_95)
curl -s "http://localhost:8090/composer/ontology/view/UI_DP_95?targetCd=T3SERIES"
```

Expected: View 1건 정보 or `null` (해당 메뉴 미등록).

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/ontology/
git commit -m "feat(composer): GET /composer/ontology/{view,process}/{id} read-only"
```

---

## Task 9: Backend — Suggest endpoint (Claude 1회)

**Files:**
- Create: `backend/src/main/java/com/zionex/t3composer/domain/ontology/service/OntologySuggestService.java`
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/ontology/controller/OntologyController.java`

- [ ] **Step 1: OntologySuggestService 작성 (AutoSuggestService 패턴 모방)**

```java
package com.zionex.t3composer.domain.ontology.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3composer.domain.client.AnthropicClient;
import com.zionex.t3composer.domain.client.AnthropicModels.Message;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesRequest;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;
import com.zionex.t3composer.domain.client.AnthropicModels.SystemBlock;
import com.zionex.t3composer.domain.ontology.dto.SuggestRequest;
import com.zionex.t3composer.domain.ontology.dto.SuggestResponse;
import com.zionex.t3composer.domain.service.AnthropicApiKeyService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Q&A · Entity 의 필드별 ✨ 제안 — Claude 1회 호출 = 1 필드 = 1 제안.
 * AutoSuggestService 와 같은 모델·클라이언트.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OntologySuggestService {

    private final AnthropicClient anthropicClient;
    private final AnthropicApiKeyService apiKeyService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String MODEL = "claude-sonnet-4-5";
    private static final int MAX_TOKENS = 2000;

    public SuggestResponse suggest(String userId, SuggestRequest req) {
        if (req == null || req.getField() == null) {
            return SuggestResponse.builder().ok(false).message("field 누락").build();
        }
        String apiKey = apiKeyService.getApiKey(userId)
                .orElseThrow(() -> new IllegalStateException(
                    "Anthropic API key 가 등록되어 있지 않습니다. 우상단 [API 키] 에서 등록하세요."));

        String system = buildSystemPrompt(req);
        String user = buildUserPrompt(req);

        MessagesRequest mr = MessagesRequest.builder()
                .model(MODEL).max_tokens(MAX_TOKENS)
                .system(List.of(SystemBlock.builder().type("text").text(system).build()))
                .messages(List.of(Message.builder().role("user").content(user).build()))
                .build();

        try {
            MessagesResponse resp = anthropicClient.sendMessages(apiKey, mr).block();
            String text = extractText(resp).trim();
            log.info("OntologySuggest: field={} chars={}", req.getField(), text.length());
            Object value = postProcess(req.getField(), text);
            return SuggestResponse.builder()
                .ok(true).value(value).modelName(MODEL).build();
        } catch (Exception ex) {
            log.warn("OntologySuggest 실패: {}", ex.getMessage());
            return SuggestResponse.builder()
                .ok(false).message(ex.getMessage()).build();
        }
    }

    private String buildSystemPrompt(SuggestRequest req) {
        String base = "당신은 T3SmartSCM 도메인 온톨로지 편집을 돕는 보조자입니다. "
                    + "현재 작성 중인 Q&A 또는 Entity row 의 한 필드 값을 1개만 제안하세요. "
                    + "절대 markdown 코드펜스/설명 없이 *값 자체* 만 응답하세요.\n\n";
        return base + switch (req.getField()) {
            case "question" -> "현재 row 의 answer 본문에서 사용자 의도를 1줄 한국어 자연어 질문으로 추출하세요.";
            case "answer"   -> "현재 row 의 question + domain + 연관 Entity 설명을 보고, "
                             + "Target DB (MSSQL) 에서 동작할 SELECT SQL 또는 가이드 텍스트 1개를 제안하세요. "
                             + "SQL 이라면 ```sql 펜스 없이 SELECT … 본문만.";
            case "paraphrases" -> "현재 row 의 question 을 의미 동일·표현 다른 변형 3개로 만드세요. "
                                + "응답은 JSON 배열 한 줄: [\"변형1\",\"변형2\",\"변형3\"]";
            case "relatedEntityIds" -> "현재 row 의 question/answer 키워드를 기존 ontology entity 들과 매칭해 "
                                     + "관련 entity id 5개를 JSON 배열로 응답하세요: [\"id1\",\"id2\",...]";
            case "domain"   -> "현재 row 의 question/answer 키워드를 보고 다음 중 1개 분류만 단어로 응답: "
                             + "BF / DP / MP / FP / IM / RP / SA / CM";
            default -> "값 1개만 응답하세요.";
        };
    }

    private String buildUserPrompt(SuggestRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("[현재 row]\n");
        Map<String, Object> row = req.getRow() == null ? Map.of() : req.getRow();
        for (var e : row.entrySet()) {
            if (e.getValue() == null) continue;
            sb.append("- ").append(e.getKey()).append(": ").append(e.getValue()).append("\n");
        }
        sb.append("\n[targetCd] ").append(req.getTargetCd() == null ? "(none)" : req.getTargetCd()).append("\n");
        sb.append("[field 요청] ").append(req.getField()).append("\n");
        return sb.toString();
    }

    private String extractText(MessagesResponse resp) {
        if (resp == null || resp.getContent() == null || resp.getContent().isEmpty()) return "";
        var c0 = resp.getContent().get(0);
        return c0.getText() == null ? "" : c0.getText();
    }

    @SuppressWarnings("unchecked")
    private Object postProcess(String field, String text) {
        // paraphrases / relatedEntityIds 만 JSON 배열로 파싱 시도. 실패 시 원문.
        if ("paraphrases".equals(field) || "relatedEntityIds".equals(field)) {
            try {
                // Claude 가 ```json 펜스 씌웠으면 벗기기
                String t = text.trim();
                if (t.startsWith("```")) {
                    int nl = t.indexOf('\n');
                    if (nl > 0) t = t.substring(nl + 1);
                    if (t.endsWith("```")) t = t.substring(0, t.length() - 3);
                }
                return objectMapper.readValue(t, List.class);
            } catch (Exception ignore) {
                // 콤마 split fallback
                return java.util.Arrays.stream(text.split("[,\\n]"))
                    .map(String::trim).filter(s -> !s.isEmpty()).toList();
            }
        }
        return text;
    }
}
```

- [ ] **Step 2: Controller 에 suggest endpoint 추가**

```java
    @org.springframework.web.bind.annotation.PostMapping("/suggest")
    public com.zionex.t3composer.domain.ontology.dto.SuggestResponse suggest(
            @org.springframework.web.bind.annotation.RequestBody
                com.zionex.t3composer.domain.ontology.dto.SuggestRequest req) {
        // composer-dev mock 사용자 — AnthropicApiKey 도 같은 키로 조회됨 (rules/50 §1.4)
        return suggestService.suggest("composer-dev", req);
    }
```

`OntologyController` 에 `private final OntologySuggestService suggestService;` 필드 추가 (Lombok `@RequiredArgsConstructor` 가 자동 주입).

- [ ] **Step 3: 빌드 + 검증**

Run:
```bash
docker compose exec -T composer-backend mvn -B -DskipTests compile && \
docker compose exec -T composer-backend bash -c 'date +%s > /app/target/classes/.devtools-restart-trigger'
sleep 8

curl -s -X POST "http://localhost:8090/composer/ontology/suggest" \
  -H 'Content-Type: application/json' \
  -d '{"field":"paraphrases","kind":"QA","targetCd":"T3SERIES","row":{"question":"수요예측 이용률은?","answer":"VW_BF_FORECAST_USAGE 의 평균 …","domain":"BF"}}'
```

Expected: `{"ok":true, "value":["변형1","변형2","변형3"], "modelName":"claude-sonnet-4-5"}` 형태.

AnthropicApiKey 미등록 시: 500 + "Anthropic API key 가 등록되어 있지 않습니다…" — 우상단 [API 키] 등록 후 재시도.

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/ontology/
git commit -m "feat(composer): POST /composer/ontology/suggest — Claude 1회 필드 제안"
```

---

## Task 10: Frontend — api.js extensions

**Files:**
- Modify: `frontend/src/view/util/t3composer/api.js`

- [ ] **Step 1: api.js 끝에 `/composer/ontology/*` 호출 함수 추가**

기존 `listOntologyEntity` (line 435 근방) 아래에 추가:

```javascript
// ──────────────── Ontology Tab (CRUD + suggest) ────────────────

export const fetchOntologyTree = (targetCd, q) =>
  zAxios.get('composer/ontology/tree', composerReq({
    params: { ...(targetCd ? { targetCd } : {}), ...(q ? { q } : {}) }
  }));

export const fetchQa = (id, targetCd) =>
  zAxios.get(`composer/ontology/qa/${encodeURIComponent(id)}`, composerReq({
    params: targetCd ? { targetCd } : {}
  }));

export const fetchQaBulk = (ids, targetCd) =>
  zAxios.get('composer/ontology/qa/bulk', composerReq({
    params: { ids: (ids || []).join(','), ...(targetCd ? { targetCd } : {}) }
  }));

export const createQa = (dto, targetCd) =>
  zAxios.post('composer/ontology/qa', dto, composerReq({
    params: targetCd ? { targetCd } : {},
    headers: { 'Content-Type': 'application/json' },
  }));

export const updateQa = (id, dto, modifyDttm, targetCd) =>
  zAxios.put(`composer/ontology/qa/${encodeURIComponent(id)}`, dto, composerReq({
    params: targetCd ? { targetCd } : {},
    headers: {
      'Content-Type': 'application/json',
      ...(modifyDttm ? { 'If-Match': modifyDttm } : {}),
    },
  }));

export const deleteQa = (id, targetCd) =>
  zAxios.delete(`composer/ontology/qa/${encodeURIComponent(id)}`, composerReq({
    params: targetCd ? { targetCd } : {},
  }));

export const fetchEntity = (id, targetCd) =>
  zAxios.get(`composer/ontology/entity/${encodeURIComponent(id)}`, composerReq({
    params: targetCd ? { targetCd } : {}
  }));

export const fetchEntityBulk = (ids, targetCd) =>
  zAxios.get('composer/ontology/entity/bulk', composerReq({
    params: { ids: (ids || []).join(','), ...(targetCd ? { targetCd } : {}) }
  }));

export const createEntity = (dto, targetCd) =>
  zAxios.post('composer/ontology/entity', dto, composerReq({
    params: targetCd ? { targetCd } : {},
    headers: { 'Content-Type': 'application/json' },
  }));

export const updateEntity = (id, dto, targetCd) =>
  zAxios.put(`composer/ontology/entity/${encodeURIComponent(id)}`, dto, composerReq({
    params: targetCd ? { targetCd } : {},
    headers: { 'Content-Type': 'application/json' },
  }));

export const deleteEntity = (id, targetCd) =>
  zAxios.delete(`composer/ontology/entity/${encodeURIComponent(id)}`, composerReq({
    params: targetCd ? { targetCd } : {},
  }));

export const fetchViewMeta = (menuCd, targetCd) =>
  zAxios.get(`composer/ontology/view/${encodeURIComponent(menuCd)}`, composerReq({
    params: targetCd ? { targetCd } : {}
  }));

export const fetchProcessMeta = (processCd, targetCd) =>
  zAxios.get(`composer/ontology/process/${encodeURIComponent(processCd)}`, composerReq({
    params: targetCd ? { targetCd } : {}
  }));

export const ontologySuggest = (req) =>
  zAxios.post('composer/ontology/suggest', req, composerReq({
    headers: { 'Content-Type': 'application/json' },
  }));
```

- [ ] **Step 2: webpack 재컴파일 — 컨테이너 자동 hot-reload (1초 polling)**

브라우저 콘솔에 syntax 오류 없는지 확인.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/view/util/t3composer/api.js
git commit -m "feat(composer): api.js — ontology CRUD + suggest 래퍼"
```

---

## Task 11: Frontend — OntologyPage skeleton + OntologyTree

**Files:**
- Create: `frontend/src/view/util/t3composer/ontology/OntologyPage.jsx`
- Create: `frontend/src/view/util/t3composer/ontology/OntologyTree.jsx`

- [ ] **Step 1: OntologyTree 작성**

```jsx
import React, { useMemo, useState } from 'react';
import {
  Box, TextField, InputAdornment, List, ListItemButton, ListItemText, Collapse, Typography, Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ChevronRight from '@mui/icons-material/ChevronRight';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const CAT_COLOR = {
  QA:      '#7CA7E0',
  ENTITY:  '#9D8FD4',
  VIEW:    '#8FC4D4',
  PROCESS: '#86C7A8',
};

/**
 * Ontology 좌 트리. 카테고리 → 도메인 → row.
 * props: tree (TreeNodeDto[]) · selectedKey · onSelect(node) · onSearch(q)
 */
function OntologyTree({ tree, selectedKey, onSelect, onSearch }) {
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState(() => new Set(['QA', 'ENTITY']));

  const toggle = (key) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleSearchKey = (e) => {
    if (e.key === 'Enter') onSearch?.(q.trim());
  };

  const roots = useMemo(() => tree || [], [tree]);

  return (
    <Box sx={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
               borderRight: '1px solid rgba(124,167,224,0.30)', minHeight: 0 }}>
      <Box sx={{ p: 1.5 }}>
        <TextField
          size="small" fullWidth placeholder="검색 (Enter)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={handleSearchKey}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
          }}
        />
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, px: 0.5 }}>
        <List dense disablePadding>
          {roots.map((cat) => {
            const isOpen = expanded.has(cat.key);
            return (
              <React.Fragment key={cat.key}>
                <ListItemButton onClick={() => toggle(cat.key)} sx={{ py: 0.5 }}>
                  {isOpen ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
                  <Box sx={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                              bgcolor: CAT_COLOR[cat.category] || '#7CA7E0', ml: 0.5, mr: 1 }} />
                  <ListItemText
                    primary={<>
                      <Typography component="span" sx={{ fontWeight: 700, fontSize: 13 }}>{cat.label}</Typography>
                      <Chip size="small" label={cat.count ?? 0} sx={{ ml: 1, height: 18, fontSize: 10 }} />
                      {cat.readOnly && <LockOutlinedIcon sx={{ ml: 0.5, fontSize: 12, color: '#6E7E96' }} />}
                    </>}
                  />
                </ListItemButton>
                <Collapse in={isOpen} unmountOnExit>
                  {(cat.children || []).map((dom) => {
                    const domOpen = expanded.has(dom.key);
                    return (
                      <React.Fragment key={dom.key}>
                        <ListItemButton onClick={() => toggle(dom.key)} sx={{ pl: 4, py: 0.25 }}>
                          {domOpen ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
                          <ListItemText
                            primary={<>
                              <Typography component="span" sx={{ fontSize: 12 }}>{dom.label}</Typography>
                              <Chip size="small" label={dom.count ?? 0} sx={{ ml: 1, height: 16, fontSize: 10 }} />
                            </>}
                          />
                        </ListItemButton>
                        <Collapse in={domOpen} unmountOnExit>
                          {(dom.children || []).map((leaf) => (
                            <ListItemButton
                              key={leaf.key} dense
                              selected={leaf.key === selectedKey}
                              onClick={() => onSelect?.(leaf)}
                              sx={{ pl: 7, py: 0.2 }}
                            >
                              <ListItemText
                                primary={<Typography component="span"
                                  sx={{ fontSize: 11, fontFamily: 'monospace' }}>
                                  {leaf.label}
                                </Typography>}
                              />
                            </ListItemButton>
                          ))}
                        </Collapse>
                      </React.Fragment>
                    );
                  })}
                </Collapse>
              </React.Fragment>
            );
          })}
        </List>
      </Box>
    </Box>
  );
}

export default OntologyTree;
```

- [ ] **Step 2: OntologyPage 작성 (tree 마운트 + 우 패널 placeholder)**

```jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { ContentInner } from '@wingui/common/imports';

import useTargetStore from '../targetStore';
import { fetchOntologyTree } from '../api';
import OntologyTree from './OntologyTree';

/**
 * Composer 상단 Tab [Ontology] 진입점.
 * 좌 트리 (240px) + 우 디테일. 우 디테일은 다음 task 에서 editors 가 채운다.
 */
function OntologyPage() {
  const targetCd = useTargetStore((s) => s.currentTargetCd);
  const [tree, setTree] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadTree = useCallback(async (q) => {
    if (!targetCd) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetchOntologyTree(targetCd, q);
      setTree(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '트리 조회 실패');
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, [targetCd]);

  useEffect(() => { loadTree(''); }, [loadTree]);

  return (
    <ContentInner>
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <OntologyTree
          tree={tree}
          selectedKey={selected?.key}
          onSelect={setSelected}
          onSearch={loadTree}
        />
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 2 }}>
          {!targetCd && (
            <Alert severity="warning">Target System 을 먼저 선택하세요.</Alert>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          {loading && <Typography>로딩…</Typography>}
          {!selected && targetCd && !loading && !error && (
            <Typography sx={{ color: '#6E7E96' }}>좌측에서 항목을 선택하세요.</Typography>
          )}
          {selected && (
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                {selected.category} · {selected.refId}
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#6E7E96', mt: 0.5 }}>
                key: {selected.key}
              </Typography>
              <Alert severity="info" sx={{ mt: 2 }}>편집 폼은 다음 task 에서 마운트됩니다.</Alert>
            </Box>
          )}
        </Box>
      </Box>
    </ContentInner>
  );
}

export default OntologyPage;
```

- [ ] **Step 3: webpack hot-reload + 브라우저 검증**

App.jsx 가 아직 OntologyPage 를 마운트 안 함 (Task 16 에서). 우선 단독 import 로 syntax 검증:

Run:
```bash
docker compose logs --tail 30 composer-frontend 2>&1 | grep -i "compiled\|error" | tail -10
```

Expected: 새 컴포넌트 import 가 webpack 에러 없이 통과.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/view/util/t3composer/ontology/OntologyPage.jsx \
        frontend/src/view/util/t3composer/ontology/OntologyTree.jsx
git commit -m "feat(composer): OntologyPage + OntologyTree skeleton"
```

---

## Task 12: Frontend — AiSuggestButton (✨ 공용 diff 모달)

**Files:**
- Create: `frontend/src/view/util/t3composer/ontology/AiSuggestButton.jsx`

- [ ] **Step 1: AiSuggestButton 작성**

```jsx
import React, { useState, useCallback } from 'react';
import {
  Box, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, CircularProgress, Stack,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { ontologySuggest } from '../api';

/**
 * 필드 옆 ✨ 버튼 — Claude 1회 호출 → diff 모달 → 사용자 수락 시 onAccept(value).
 * Props:
 *  - field     : 'question'|'answer'|'paraphrases'|'relatedEntityIds'|'domain'
 *  - kind      : 'QA' | 'ENTITY'
 *  - targetCd  : string
 *  - currentValue : 현재 필드 값 (diff 표시용)
 *  - row       : 현재 row 전체 (Claude 가 컨텍스트로 사용)
 *  - onAccept(value) : 수락 콜백
 */
function AiSuggestButton({ field, kind, targetCd, currentValue, row, onAccept, size = 'small' }) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [error, setError] = useState(null);

  const handleClick = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setSuggestion(null);
    try {
      const r = await ontologySuggest({ field, kind, targetCd, row });
      if (!r.data?.ok) throw new Error(r.data?.message || 'AI 제안 실패');
      setSuggestion(r.data.value);
      setOpen(true);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'AI 제안 실패');
      setOpen(true);
    } finally {
      setBusy(false);
    }
  }, [field, kind, targetCd, row, busy]);

  const handleAccept = () => {
    onAccept?.(suggestion);
    setOpen(false);
  };

  const renderValue = (v) => {
    if (v == null) return <Typography sx={{ color: '#6E7E96' }}>(빈 값)</Typography>;
    if (Array.isArray(v)) {
      return v.length === 0
        ? <Typography sx={{ color: '#6E7E96' }}>(빈 배열)</Typography>
        : <ul style={{ margin: 0, paddingLeft: 18 }}>{v.map((x, i) =>
            <li key={i} style={{ fontSize: 12 }}>{String(x)}</li>)}</ul>;
    }
    return <Box sx={{ whiteSpace: 'pre-wrap', fontSize: 12, fontFamily: 'monospace' }}>
      {String(v)}
    </Box>;
  };

  return (
    <>
      <Tooltip title={`✨ AI 제안 — ${field}`}>
        <span>
          <IconButton size={size} onClick={handleClick} disabled={busy}
            sx={{ color: '#9D8FD4', '&:hover': { bgcolor: 'rgba(157,143,212,0.12)' } }}>
            {busy ? <CircularProgress size={16} /> : <AutoAwesomeIcon fontSize="small" />}
          </IconButton>
        </span>
      </Tooltip>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>✨ AI 제안 — {field}</DialogTitle>
        <DialogContent dividers>
          {error && <Typography sx={{ color: '#E0989A', mb: 2 }}>오류: {error}</Typography>}
          {!error && (
            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1, p: 1.5, border: '1px solid rgba(124,167,224,0.30)', borderRadius: 1 }}>
                <Typography sx={{ fontSize: 11, color: '#6E7E96', mb: 1 }}>현재값</Typography>
                {renderValue(currentValue)}
              </Box>
              <Box sx={{ flex: 1, p: 1.5,
                          border: '1px solid rgba(157,143,212,0.40)', borderRadius: 1,
                          bgcolor: 'rgba(157,143,212,0.06)' }}>
                <Typography sx={{ fontSize: 11, color: '#9D8FD4', mb: 1, fontWeight: 700 }}>
                  제안값 (Claude)
                </Typography>
                {renderValue(suggestion)}
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>거부</Button>
          {!error && (
            <Button variant="contained" onClick={handleAccept}
              sx={{ bgcolor: '#9D8FD4', '&:hover': { bgcolor: '#8675c8' } }}>
              수락 — 필드에 적용
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AiSuggestButton;
```

- [ ] **Step 2: webpack syntax 확인**

브라우저 콘솔에 오류 없는지 확인.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/view/util/t3composer/ontology/AiSuggestButton.jsx
git commit -m "feat(composer): AiSuggestButton — ✨ + diff modal"
```

---

## Task 13: Frontend — QaEditor

**Files:**
- Create: `frontend/src/view/util/t3composer/ontology/editors/QaEditor.jsx`

- [ ] **Step 1: QaEditor 작성**

```jsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Stack, TextField, Button, MenuItem, Typography, Alert, Chip, Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

import { fetchQa, createQa, updateQa, deleteQa } from '../../api';
import AiSuggestButton from '../AiSuggestButton';

const DB_TYPES = ['mssql', 'oracle', 'postgresql'];

/**
 * Q&A 편집 폼. CRUD.
 * Props: id (null=신규) · targetCd · onSaved(dto) · onDeleted() · onCancelNew()
 */
function QaEditor({ id, targetCd, onSaved, onDeleted, onCancelNew }) {
  const isNew = id == null;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [dto, setDto] = useState({
    id: null, question: '', answer: '', dbType: 'mssql', domain: '',
    paraphrases: [], relatedEntityIds: [], notes: '', modifyDttm: null,
  });

  const reload = useCallback(async () => {
    if (isNew) {
      setDto({ id: null, question: '', answer: '', dbType: 'mssql', domain: '',
               paraphrases: [], relatedEntityIds: [], notes: '', modifyDttm: null });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetchQa(id, targetCd);
      setDto({ ...(r.data || {}),
        paraphrases: r.data?.paraphrases || [],
        relatedEntityIds: r.data?.relatedEntityIds || [] });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '조회 실패');
    } finally {
      setLoading(false);
    }
  }, [id, targetCd, isNew]);

  useEffect(() => { reload(); }, [reload]);

  const setField = (k) => (e) => setDto((d) => ({ ...d, [k]: e?.target ? e.target.value : e }));
  const setValue = (k, v) => setDto((d) => ({ ...d, [k]: v }));

  const validate = () => {
    if (!dto.question?.trim()) return 'Question 은 필수입니다.';
    if (!dto.answer?.trim())   return 'Answer 는 필수입니다.';
    return null;
  };

  const handleSave = async () => {
    const v = validate();
    if (v) { setError(v); return; }
    setSaving(true); setError(null); setInfo(null);
    try {
      const r = isNew
        ? await createQa(dto, targetCd)
        : await updateQa(id, dto, dto.modifyDttm, targetCd);
      setInfo(isNew ? '신규 저장 완료' : '저장 완료');
      onSaved?.(r.data);
    } catch (e) {
      if (e?.response?.status === 412) {
        setError('다른 사용자가 이미 수정했습니다. [다시 불러오기] 를 눌러주세요.');
      } else {
        setError(e?.response?.data?.message || e?.message || '저장 실패');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    if (!window.confirm('정말 삭제하시겠습니까? (soft delete — use_yn=N)')) return;
    setSaving(true);
    try {
      await deleteQa(id, targetCd);
      onDeleted?.();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '삭제 실패');
    } finally {
      setSaving(false);
    }
  };

  const addChip = (key) => () => {
    const text = window.prompt(`새 ${key} 항목`);
    if (text == null || !text.trim()) return;
    setDto((d) => ({ ...d, [key]: [...(d[key] || []), text.trim()] }));
  };

  const removeChip = (key, idx) =>
    setDto((d) => ({ ...d, [key]: (d[key] || []).filter((_, i) => i !== idx) }));

  if (loading) return <Typography>로딩…</Typography>;

  return (
    <Box>
      <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1 }}>
        {isNew ? '✚ 새 Q&A' : `Q&A · ${dto.id}`}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      {info && <Alert severity="success" sx={{ mb: 1 }}>{info}</Alert>}

      <Stack spacing={2}>
        <Stack direction="row" alignItems="flex-end" spacing={0.5}>
          <TextField label="Question" fullWidth size="small" required
            value={dto.question || ''} onChange={setField('question')} />
          <AiSuggestButton field="question" kind="QA" targetCd={targetCd}
            currentValue={dto.question} row={dto}
            onAccept={(v) => setValue('question', String(v))} />
        </Stack>

        <Stack direction="row" alignItems="flex-end" spacing={0.5}>
          <TextField label="Answer" fullWidth size="small" required multiline rows={6}
            value={dto.answer || ''} onChange={setField('answer')} />
          <AiSuggestButton field="answer" kind="QA" targetCd={targetCd}
            currentValue={dto.answer} row={dto}
            onAccept={(v) => setValue('answer', String(v))} />
        </Stack>

        <Stack direction="row" spacing={2}>
          <Stack direction="row" alignItems="flex-end" spacing={0.5} sx={{ flex: 1 }}>
            <TextField label="Domain" size="small" fullWidth
              value={dto.domain || ''} onChange={setField('domain')} />
            <AiSuggestButton field="domain" kind="QA" targetCd={targetCd}
              currentValue={dto.domain} row={dto}
              onAccept={(v) => setValue('domain', String(v))} />
          </Stack>
          <TextField select label="DB Type" size="small" sx={{ width: 160 }}
            value={dto.dbType || 'mssql'} onChange={setField('dbType')}>
            {DB_TYPES.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </TextField>
        </Stack>

        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>Paraphrases</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={addChip('paraphrases')}>추가</Button>
            <AiSuggestButton field="paraphrases" kind="QA" targetCd={targetCd}
              currentValue={dto.paraphrases} row={dto}
              onAccept={(v) => setValue('paraphrases', Array.isArray(v) ? v : [String(v)])} />
          </Stack>
          <Box sx={{ mt: 0.5 }}>
            {(dto.paraphrases || []).map((p, i) => (
              <Chip key={i} label={p} size="small" sx={{ mr: 0.5, mb: 0.5 }}
                onDelete={() => removeChip('paraphrases', i)} deleteIcon={<CloseIcon />} />
            ))}
            {(dto.paraphrases || []).length === 0 &&
              <Typography sx={{ fontSize: 11, color: '#6E7E96' }}>(없음)</Typography>}
          </Box>
        </Box>

        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>연관 Entity (id)</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={addChip('relatedEntityIds')}>추가</Button>
            <AiSuggestButton field="relatedEntityIds" kind="QA" targetCd={targetCd}
              currentValue={dto.relatedEntityIds} row={dto}
              onAccept={(v) => setValue('relatedEntityIds', Array.isArray(v) ? v : [String(v)])} />
          </Stack>
          <Box sx={{ mt: 0.5 }}>
            {(dto.relatedEntityIds || []).map((p, i) => (
              <Chip key={i} label={p} size="small" sx={{ mr: 0.5, mb: 0.5, fontFamily: 'monospace' }}
                onDelete={() => removeChip('relatedEntityIds', i)} deleteIcon={<CloseIcon />} />
            ))}
            {(dto.relatedEntityIds || []).length === 0 &&
              <Typography sx={{ fontSize: 11, color: '#6E7E96' }}>(없음)</Typography>}
          </Box>
        </Box>

        <Divider />

        <Stack direction="row" spacing={1}>
          <Button variant="contained" startIcon={<SaveIcon />} disabled={saving}
            onClick={handleSave} sx={{ bgcolor: '#86C7A8', '&:hover': { bgcolor: '#73b596' } }}>
            저장
          </Button>
          <Button variant="outlined" onClick={isNew ? onCancelNew : reload} disabled={saving}>
            {isNew ? '취소' : '다시 불러오기'}
          </Button>
          <Box sx={{ flex: 1 }} />
          {!isNew && (
            <Button variant="outlined" color="error" startIcon={<DeleteOutlineIcon />}
              disabled={saving} onClick={handleDelete}>삭제 (soft)</Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

export default QaEditor;
```

- [ ] **Step 2: OntologyPage 가 QaEditor 를 마운트하도록 수정**

기존 `OntologyPage.jsx` 의 placeholder Alert 부분을 교체:

```jsx
import QaEditor from './editors/QaEditor';

// ... 기존 imports 와 useState/useEffect 유지

// 우 패널 부분 — selected 가 있을 때 분기
{selected && (
  <>
    {selected.category === 'QA' && selected.refId && (
      <QaEditor id={selected.refId} targetCd={targetCd}
        onSaved={() => loadTree('')}
        onDeleted={() => { setSelected(null); loadTree(''); }} />
    )}
    {selected.category !== 'QA' && (
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
          {selected.category} · {selected.refId}
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          {selected.category} 편집은 다음 task 에서 추가됩니다.
        </Alert>
      </Box>
    )}
  </>
)}
```

상단 [+ 새 Q&A] 버튼도 OntologyPage 에 추가 (state `newKind`):

```jsx
const [newKind, setNewKind] = useState(null);  // 'QA' | 'ENTITY' | null

// ...

{/* 우 패널 진입 — selected 와 newKind 우선순위 */}
{newKind === 'QA' && (
  <QaEditor id={null} targetCd={targetCd}
    onSaved={() => { setNewKind(null); loadTree(''); }}
    onCancelNew={() => setNewKind(null)} />
)}

{/* 트리 옆 신규 버튼 — OntologyTree 아래에 둘 수도 있고 OntologyPage 헤더에 둘 수도 있음 */}
{/* 간단히: 좌 트리 하단에 fixed 영역으로 */}
```

좌 트리 하단 버튼은 `OntologyTree` 의 마지막에 추가:

```jsx
// OntologyTree.jsx — Box overflow 다음에
<Box sx={{ p: 1, borderTop: '1px solid rgba(124,167,224,0.20)' }}>
  <Button size="small" fullWidth startIcon={<AddIcon />}
    onClick={() => onNewClick?.('QA')}>새 Q&A</Button>
  <Button size="small" fullWidth startIcon={<AddIcon />}
    onClick={() => onNewClick?.('ENTITY')} sx={{ mt: 0.5 }}>새 Entity</Button>
</Box>
```

`OntologyTree` props 에 `onNewClick(kind)` 추가, `OntologyPage` 가 `setNewKind` 로 전달.

- [ ] **Step 3: 브라우저 검증 (App.jsx 마운트는 아직 안 했으므로 직접 import — 임시)**

브라우저 콘솔 webpack 오류 없는지 확인. 마운트는 Task 16 에서.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/view/util/t3composer/ontology/editors/QaEditor.jsx \
        frontend/src/view/util/t3composer/ontology/OntologyPage.jsx \
        frontend/src/view/util/t3composer/ontology/OntologyTree.jsx
git commit -m "feat(composer): QaEditor with AiSuggest + tree integration"
```

---

## Task 14: Frontend — EntityEditor + ViewReadOnly + ProcessReadOnly

**Files:**
- Create: `frontend/src/view/util/t3composer/ontology/editors/EntityEditor.jsx`
- Create: `frontend/src/view/util/t3composer/ontology/editors/ViewReadOnly.jsx`
- Create: `frontend/src/view/util/t3composer/ontology/editors/ProcessReadOnly.jsx`
- Modify: `frontend/src/view/util/t3composer/ontology/OntologyPage.jsx`

- [ ] **Step 1: EntityEditor 작성 (QaEditor 구조 재사용)**

```jsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Stack, TextField, Button, MenuItem, Typography, Alert, Chip, Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

import { fetchEntity, createEntity, updateEntity, deleteEntity } from '../../api';

const STATUSES = ['CANDIDATE', 'REVIEWING', 'CONFIRMED'];

function EntityEditor({ id, targetCd, onSaved, onDeleted, onCancelNew }) {
  const isNew = id == null;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [dto, setDto] = useState({
    id: null, version: '1.0', name: '', entityType: '', description: '',
    terms: [], status: 'CONFIRMED', importanceScore: 0.5,
    relatedTableNames: [], notes: '',
  });

  const reload = useCallback(async () => {
    if (isNew) {
      setDto({ id: null, version: '1.0', name: '', entityType: '', description: '',
               terms: [], status: 'CONFIRMED', importanceScore: 0.5,
               relatedTableNames: [], notes: '' });
      return;
    }
    setLoading(true); setError(null);
    try {
      const r = await fetchEntity(id, targetCd);
      setDto({ ...(r.data || {}),
        terms: r.data?.terms || [],
        relatedTableNames: r.data?.relatedTableNames || [] });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '조회 실패');
    } finally { setLoading(false); }
  }, [id, targetCd, isNew]);

  useEffect(() => { reload(); }, [reload]);

  const setField = (k) => (e) => setDto((d) => ({ ...d, [k]: e?.target ? e.target.value : e }));
  const setValue = (k, v) => setDto((d) => ({ ...d, [k]: v }));

  const validate = () => {
    if (!dto.name?.trim()) return 'Name 은 필수입니다.';
    if (!dto.entityType?.trim()) return 'Entity Type 은 필수입니다.';
    return null;
  };

  const handleSave = async () => {
    const v = validate();
    if (v) { setError(v); return; }
    setSaving(true); setError(null); setInfo(null);
    try {
      const r = isNew
        ? await createEntity(dto, targetCd)
        : await updateEntity(id, dto, targetCd);
      setInfo(isNew ? '신규 저장 완료' : '저장 완료');
      onSaved?.(r.data);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '저장 실패');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (isNew) return;
    if (!window.confirm('정말 삭제하시겠습니까? (soft delete)')) return;
    setSaving(true);
    try {
      await deleteEntity(id, targetCd);
      onDeleted?.();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '삭제 실패');
    } finally { setSaving(false); }
  };

  const addChip = (key) => () => {
    const text = window.prompt(`새 ${key} 항목`);
    if (text == null || !text.trim()) return;
    setDto((d) => ({ ...d, [key]: [...(d[key] || []), text.trim()] }));
  };
  const removeChip = (key, idx) =>
    setDto((d) => ({ ...d, [key]: (d[key] || []).filter((_, i) => i !== idx) }));

  if (loading) return <Typography>로딩…</Typography>;

  return (
    <Box>
      <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1 }}>
        {isNew ? '✚ 새 Entity' : `Entity · ${dto.name || dto.id}`}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      {info && <Alert severity="success" sx={{ mb: 1 }}>{info}</Alert>}

      <Stack spacing={2}>
        <Stack direction="row" spacing={2}>
          <TextField label="Name" size="small" required sx={{ flex: 1 }}
            value={dto.name || ''} onChange={setField('name')} />
          <TextField label="Entity Type" size="small" required sx={{ flex: 1 }}
            value={dto.entityType || ''} onChange={setField('entityType')} />
        </Stack>

        <TextField label="Description" size="small" multiline rows={3} fullWidth
          value={dto.description || ''} onChange={setField('description')} />

        <Stack direction="row" spacing={2}>
          <TextField select label="Status" size="small" sx={{ width: 180 }}
            value={dto.status || 'CONFIRMED'} onChange={setField('status')}>
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField label="Importance Score (0-1)" size="small" type="number"
            inputProps={{ min: 0, max: 1, step: 0.05 }}
            value={dto.importanceScore ?? ''}
            onChange={(e) => setValue('importanceScore',
              e.target.value === '' ? null : Number(e.target.value))} />
        </Stack>

        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>Terms (검색 별칭)</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={addChip('terms')}>추가</Button>
          </Stack>
          <Box sx={{ mt: 0.5 }}>
            {(dto.terms || []).map((p, i) => (
              <Chip key={i} label={p} size="small" sx={{ mr: 0.5, mb: 0.5 }}
                onDelete={() => removeChip('terms', i)} deleteIcon={<CloseIcon />} />
            ))}
          </Box>
        </Box>

        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>연관 Table</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={addChip('relatedTableNames')}>추가</Button>
          </Stack>
          <Box sx={{ mt: 0.5 }}>
            {(dto.relatedTableNames || []).map((p, i) => (
              <Chip key={i} label={p} size="small" sx={{ mr: 0.5, mb: 0.5, fontFamily: 'monospace' }}
                onDelete={() => removeChip('relatedTableNames', i)} deleteIcon={<CloseIcon />} />
            ))}
          </Box>
        </Box>

        <Divider />

        <Stack direction="row" spacing={1}>
          <Button variant="contained" startIcon={<SaveIcon />} disabled={saving}
            onClick={handleSave} sx={{ bgcolor: '#86C7A8', '&:hover': { bgcolor: '#73b596' } }}>
            저장
          </Button>
          <Button variant="outlined" onClick={isNew ? onCancelNew : reload} disabled={saving}>
            {isNew ? '취소' : '다시 불러오기'}
          </Button>
          <Box sx={{ flex: 1 }} />
          {!isNew && (
            <Button variant="outlined" color="error" startIcon={<DeleteOutlineIcon />}
              disabled={saving} onClick={handleDelete}>삭제 (soft)</Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

export default EntityEditor;
```

- [ ] **Step 2: ViewReadOnly 작성**

```jsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, Alert, Chip } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import { fetchViewMeta } from '../../api';

function ViewReadOnly({ menuCd, targetCd }) {
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!menuCd) return;
    fetchViewMeta(menuCd, targetCd)
      .then((r) => setMeta(r.data))
      .catch((e) => setError(e?.message || '조회 실패'));
  }, [menuCd, targetCd]);

  return (
    <Box>
      <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1 }}>
        <LockOutlinedIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
        View Manual · {menuCd}
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>읽기 전용. 편집은 v2 또는 wingui 별도 화면에서.</Alert>
      {error && <Alert severity="error">{error}</Alert>}
      {meta && (
        <Box sx={{ fontSize: 13 }}>
          <Typography>menuCd: <code>{meta.menuCd}</code></Typography>
          <Typography sx={{ mt: 0.5 }}>id: <code>{meta.id}</code></Typography>
          <Typography sx={{ mt: 0.5 }}>
            status: <Chip size="small" label={meta.status || '-'} />
          </Typography>
          <Typography sx={{ mt: 0.5 }}>
            published_version: {meta.publishedVersion || '(none)'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ViewReadOnly;
```

- [ ] **Step 3: ProcessReadOnly 작성**

```jsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, Alert, Chip } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import { fetchProcessMeta } from '../../api';

function ProcessReadOnly({ processCd, targetCd }) {
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!processCd) return;
    fetchProcessMeta(processCd, targetCd)
      .then((r) => setMeta(r.data))
      .catch((e) => setError(e?.message || '조회 실패'));
  }, [processCd, targetCd]);

  return (
    <Box>
      <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1 }}>
        <LockOutlinedIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
        Process · {processCd}
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>읽기 전용.</Alert>
      {error && <Alert severity="error">{error}</Alert>}
      {meta && (
        <Box sx={{ fontSize: 13 }}>
          <Typography sx={{ fontWeight: 700 }}>{meta.processName}</Typography>
          <Typography sx={{ mt: 0.5 }}>processCd: <code>{meta.processCd}</code></Typography>
          <Typography sx={{ mt: 0.5 }}>module: <Chip size="small" label={meta.module || '-'} /></Typography>
          <Typography sx={{ mt: 0.5 }}>status: <Chip size="small" label={meta.status || '-'} /></Typography>
          <Typography sx={{ mt: 0.5 }}>version: {meta.version || '(none)'}</Typography>
          <Typography sx={{ mt: 1 }}>{meta.processOverview}</Typography>
        </Box>
      )}
    </Box>
  );
}

export default ProcessReadOnly;
```

- [ ] **Step 4: OntologyPage 의 우 패널 분기 완성**

`OntologyPage.jsx` 의 imports 와 우 패널 swap 부분 갱신:

```jsx
import EntityEditor from './editors/EntityEditor';
import ViewReadOnly from './editors/ViewReadOnly';
import ProcessReadOnly from './editors/ProcessReadOnly';

// ... 우 패널 swap

{selected && (
  <>
    {selected.category === 'QA' && (
      <QaEditor id={selected.refId} targetCd={targetCd}
        onSaved={() => loadTree('')}
        onDeleted={() => { setSelected(null); loadTree(''); }} />
    )}
    {selected.category === 'ENTITY' && (
      <EntityEditor id={selected.refId} targetCd={targetCd}
        onSaved={() => loadTree('')}
        onDeleted={() => { setSelected(null); loadTree(''); }} />
    )}
    {selected.category === 'VIEW' && (
      <ViewReadOnly menuCd={selected.refId} targetCd={targetCd} />
    )}
    {selected.category === 'PROCESS' && (
      <ProcessReadOnly processCd={selected.refId} targetCd={targetCd} />
    )}
  </>
)}

{newKind === 'ENTITY' && (
  <EntityEditor id={null} targetCd={targetCd}
    onSaved={() => { setNewKind(null); loadTree(''); }}
    onCancelNew={() => setNewKind(null)} />
)}
```

NOTE: VIEW 의 `refId` 는 트리 빌더가 menu_cd 또는 view id 둘 중 무엇으로 채웠는지 — 위 backend `tree()` 빌더 호출에서 `idCol="id"` 를 사용했으므로 refId 가 view id. `ViewReadOnly` 의 endpoint 는 `menu_cd` 로 조회. 둘이 어긋남 → backend `buildCategory` 의 VIEW 호출만 별도 매개변수로 `menu_cd` 를 받도록 수정 필요.

수정: `OntologyService.tree()` 의 VIEW 행에서 `idCol` 인자를 `"menu_cd"` 로 변경:

```java
// 기존:
roots.add(buildCategory(t, "VIEW", q,
    "SELECT id, COALESCE(menu_cd,'?') AS dom FROM tb_is_vwbusnss_ontlgy WITH (NOLOCK)"
  + " ... ORDER BY menu_cd ASC", q,
    "id", "dom", true));
// 교체:
roots.add(buildCategory(t, "VIEW", q,
    "SELECT COALESCE(menu_cd,'?') AS id, COALESCE(menu_cd,'?') AS dom FROM tb_is_vwbusnss_ontlgy WITH (NOLOCK)"
  + " WHERE use_yn='Y'"
  + (q != null && !q.isBlank() ? " AND menu_cd LIKE :q" : "")
  + " ORDER BY menu_cd ASC", q,
    "id", "dom", true));
```

PROCESS 도 같은 이유로 `process_cd` 를 id 자리에:

```java
roots.add(buildCategory(t, "PROCESS", q,
    "SELECT COALESCE(process_cd,'?') AS id, COALESCE(module,'?') AS dom FROM tb_is_prcss_ontlgy WITH (NOLOCK)"
  + " WHERE ISNULL(use_yn,'Y')='Y'"
  + (q != null && !q.isBlank() ? " AND (process_cd LIKE :q OR process_name LIKE :q OR module LIKE :q)" : "")
  + " ORDER BY module ASC, process_cd ASC", q,
    "id", "dom", true));
```

- [ ] **Step 5: 빌드 + Commit**

```bash
docker compose exec -T composer-backend mvn -B -DskipTests compile && \
docker compose exec -T composer-backend bash -c 'date +%s > /app/target/classes/.devtools-restart-trigger'
sleep 6

git add backend/src/main/java/com/zionex/t3composer/domain/ontology/service/OntologyService.java \
        frontend/src/view/util/t3composer/ontology/editors/ \
        frontend/src/view/util/t3composer/ontology/OntologyPage.jsx
git commit -m "feat(composer): EntityEditor + View/Process readOnly viewers + tree refId fix"
```

---

## Task 15: Frontend — App.jsx MENU_ITEMS Ontology Tab 마운트

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: import + MENU_ITEMS 1줄 추가**

기존 line 15-18 근방 import 블록 끝에 추가:

```jsx
import OntologyPage from './view/util/t3composer/ontology/OntologyPage';
```

기존 line 33-39 의 `MENU_ITEMS` 배열에 1 항목 추가 (마지막 Gallery 다음):

```jsx
import SchemaIcon from '@mui/icons-material/Schema';   // 상단 import 와 함께 추가
// ...
const MENU_ITEMS = [
    { key: 'composer', label: 'Composer',      Icon: AutoAwesomeIcon,        hint: '...', Component: T3Composer },
    { key: 'history',  label: 'History',       Icon: HistoryIcon,            hint: '...', Component: T3ComposerHistory },
    { key: 'mockup',   label: 'SCM UI Mockup', Icon: DashboardCustomizeIcon, hint: '...', Component: T3Mockup },
    { key: 'patterns', label: 'UI Pattern',    Icon: ViewQuiltIcon,          hint: '...', Component: T3mesPatternCatalog },
    { key: 'dict',     label: 'Gallery',       Icon: WidgetsIcon,            hint: '...', Component: T3ComposerDict },
    { key: 'ontology', label: 'Ontology',      Icon: SchemaIcon,             hint: 'Ontology 관리 — Q&A · Entity · View · Process', Component: OntologyPage },
];
```

- [ ] **Step 2: 브라우저 새로고침 → 좌측 사이드바에 Ontology 메뉴 확인 → 클릭**

Expected: Tab 열림 → 좌 트리에 4 카테고리 (Q&A · Entity · View · Process) 표시 + 카운트.

Q&A 1개 클릭 → 우측 QaEditor 폼에 row 본문 채워짐.

저장 → 트리 refresh + 우측 폼 유지.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat(composer): App.jsx — Ontology Tab 메뉴 추가 (MENU_ITEMS)"
```

---

## Task 16: Frontend — ModeNewGeneral prompt 주입 본문 강화

**Files:**
- Modify: `frontend/src/view/util/t3composer/ModeNewGeneral.jsx` (line 576-598 근방)

- [ ] **Step 1: ModeNewGeneral.jsx 의 ONTOLOGY_QA 블록 교체**

기존 (`line 576-583`):
```jsx
const qas = byKind('ONTOLOGY_QA');
if (qas.length > 0) {
  systemContext += '[온톨로지 — Q&A]\n';
  qas.forEach((q) => {
    systemContext += `· ${q.label}`
      + (q.meta?.subtitle ? ` — ${q.meta.subtitle}` : '') + '\n';
  });
}
```

교체:
```jsx
const qas = byKind('ONTOLOGY_QA');
if (qas.length > 0) {
  systemContext += '[온톨로지 — Q&A · 권위 있는 지정]\n';
  // bulk fetch — Answer 본문 + Paraphrases + 연관 Entity desc 동봉
  try {
    const ids = qas.map((q) => q.key);
    const { fetchQaBulk, fetchEntityBulk } = await import('./api');
    const rb = await fetchQaBulk(ids, currentTargetCd);
    const fullList = Array.isArray(rb.data) ? rb.data : [];

    // 연관 Entity id 수집 → 1회 fetchEntityBulk → desc 동봉
    const entIds = Array.from(new Set(
      fullList.flatMap((qa) => qa.relatedEntityIds || []).filter(Boolean)
    ));
    let entById = {};
    if (entIds.length > 0) {
      try {
        const re = await fetchEntityBulk(entIds, currentTargetCd);
        (Array.isArray(re.data) ? re.data : []).forEach((e) => { entById[e.id] = e; });
      } catch { /* 무시 — desc 없어도 prompt 만들 수 있음 */ }
    }

    fullList.forEach((qa) => {
      systemContext += `── ${qa.id} ${qa.question || ''} ─────\n`;
      if (qa.question) systemContext += `Q: ${qa.question}\n`;
      if (qa.answer)   systemContext += `A: ${qa.answer}\n`;
      if ((qa.paraphrases || []).length > 0)
        systemContext += `Paraphrases: ${qa.paraphrases.join(' · ')}\n`;
      if (qa.domain || qa.dbType)
        systemContext += `Domain: ${qa.domain || '-'} · DB: ${qa.dbType || '-'}\n`;
      const relIds = qa.relatedEntityIds || [];
      if (relIds.length > 0) {
        systemContext += `연관 Entity:\n`;
        relIds.forEach((eid) => {
          const e = entById[eid];
          if (e) {
            systemContext += `  · ${e.name || eid}` + (e.description ? ` — ${e.description}` : '') + '\n';
          } else {
            systemContext += `  · ${eid}\n`;
          }
        });
      }
      systemContext += '────────────────────────\n';
    });
  } catch (err) {
    // bulk 실패 → 기존 shallow 형식 폴백
    console.warn('[ModeNewGeneral] ontology bulk fetch 실패, shallow 형식 사용:', err?.message);
    qas.forEach((q) => {
      systemContext += `· ${q.label}`
        + (q.meta?.subtitle ? ` — ${q.meta.subtitle}` : '') + '\n';
    });
  }
}
```

이 블록을 둘러싼 함수가 `async` 인지 확인. `assemblePrompt` (또는 그에 준하는 함수) 가 `await` 호출 가능해야 함.

만약 함수가 sync 라면, `await import` 자체가 promise 라서 동기 호출에서 깨짐 → 그 함수를 `async` 로 바꾸고 호출부 (`onSubmit` 등) 가 `await` 하도록 수정. 실제 코드 검색:

Run:
```bash
grep -n "byKind('ONTOLOGY_QA')\|function.*systemContext\|const.*assemble\|onSubmit" \
  "C:\vs_project\Composer\frontend\src\view\util\t3composer\ModeNewGeneral.jsx" | head -10
```

해당 함수에 `async` 키워드 추가 + 호출부 `await` 추가.

- [ ] **Step 2: ONTOLOGY_INTENT 블록도 본문 보강 (선택 — 시간 여유 있을 때)**

기존 INTENT 블록 (line 585-592):
```jsx
const intents = byKind('ONTOLOGY_INTENT');
if (intents.length > 0) {
  systemContext += '[온톨로지 — 화면 의도]\n';
  intents.forEach((it) => {
    systemContext += `· ${it.label}`
      + (it.meta?.subtitle ? ` (${it.meta.subtitle})` : '') + '\n';
  });
}
```

`fetchViewMeta` 가 published_version/status 만 주므로 추가 메타 적음. 일단 그대로 유지 (v2 에서 본문까지).

- [ ] **Step 3: 브라우저 검증 — NEW_NL → Data Source 선택 → Ontology 탭에서 Q&A 1건 바스켓 → 생성 시 systemContext 확인**

브라우저 콘솔 또는 backend log 에서 prompt 가 `── <id> <question> ───` 형식인지 확인.

backend log:
```bash
docker compose logs --tail 200 composer-backend 2>&1 | grep -A 3 "온톨로지" | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/view/util/t3composer/ModeNewGeneral.jsx
git commit -m "feat(composer): ModeNewGeneral — ontology Q&A bulk + 본문/Paraphrases/연관Entity 주입"
```

---

## Task 17: Frontend — Picker OntologyTab 우측 미리보기 패널

**Files:**
- Modify: `frontend/src/view/util/t3composer/OntologyTab.jsx`

- [ ] **Step 1: OntologyTab 에 우측 미리보기 신설**

기존 컴포넌트 return JSX 의 `<OntologyList ... />` 부분을 좌우 split 으로 교체:

```jsx
import { fetchQa, fetchEntity } from './api';
import { Box, Stack, Divider, CircularProgress, Typography } from '@mui/material';

// 컴포넌트 내부 — useState 추가
const [previewLoading, setPreviewLoading] = useState(false);
const [previewData, setPreviewData] = useState(null);
const [hoveredKey, setHoveredKey] = useState(null);

useEffect(() => {
  // tab 변경 시 미리보기 초기화
  setPreviewData(null);
  setHoveredKey(null);
}, [tab]);

const loadPreview = useCallback(async (item) => {
  if (!item) return;
  setHoveredKey(item.key);
  if (section.id === 'QA') {
    setPreviewLoading(true);
    try {
      const r = await fetchQa(item.key, targetCd);
      setPreviewData({ type: 'QA', dto: r.data });
    } catch { setPreviewData(null); }
    finally { setPreviewLoading(false); }
  } else if (section.id === 'INTENT') {
    setPreviewData({ type: 'INTENT', label: item.title, subtitle: item.subtitle });
  } else {
    setPreviewData({ type: 'SP', label: item.title, subtitle: item.subtitle });
  }
}, [section, targetCd]);

// return JSX — 좌측 (현재 OntologyList) + 우측 미리보기
return (
  <Box sx={{ flex: 1, minHeight: 0, display: 'flex', p: 1.5, gap: 1 }}>
    <Box sx={{ flex: '0 0 56%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* 기존 ToggleButtonGroup + 설명 + 검색 + OntologyList 그대로 — 단 items 에 onHover 추가 */}
      <ToggleButtonGroup /* 기존대로 */ />
      <Typography /* 기존 desc */>{section.desc}</Typography>
      <TextField /* 기존 search */ />
      <OntologyList
        dark items={filtered} totalCount={items.length}
        loading={!!loading[tab]} error={error[tab]}
        isSelected={(it) => isIn(section.basketKind, it.key)}
        onToggle={toggle}
        onHover={loadPreview}        // ★ 신규 prop — OntologyList 가 row hover 시 호출
        emptyText={section.emptyText}
      />
    </Box>
    <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(56,189,248,0.2)' }} />
    <Box sx={{ flex: 1, minWidth: 0, overflow: 'auto', p: 1 }}>
      <Typography sx={{ fontSize: 11, color: '#5b7a92', mb: 1 }}>우측 미리보기 (hover/click)</Typography>
      {previewLoading && <CircularProgress size={18} />}
      {!previewLoading && !previewData &&
        <Typography sx={{ fontSize: 12, color: '#5b7a92' }}>항목을 hover/클릭 하면 본문이 표시됩니다.</Typography>}
      {!previewLoading && previewData?.type === 'QA' && previewData.dto && (
        <Box sx={{ fontSize: 12, color: '#dffaff' }}>
          <Typography sx={{ fontWeight: 700, color: HOLO, mb: 0.5 }}>{previewData.dto.question}</Typography>
          <Box sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 11,
                      p: 1, bgcolor: 'rgba(9,20,38,0.7)', borderRadius: 1, mb: 1 }}>
            {previewData.dto.answer}
          </Box>
          {(previewData.dto.paraphrases || []).length > 0 && (
            <Typography sx={{ fontSize: 11 }}>
              Paraphrases: {previewData.dto.paraphrases.join(' · ')}
            </Typography>
          )}
          {(previewData.dto.relatedEntityIds || []).length > 0 && (
            <Typography sx={{ fontSize: 11, mt: 0.5 }}>
              연관 Entity: {previewData.dto.relatedEntityIds.join(' · ')}
            </Typography>
          )}
        </Box>
      )}
      {!previewLoading && (previewData?.type === 'INTENT' || previewData?.type === 'SP') && (
        <Box sx={{ fontSize: 12 }}>
          <Typography sx={{ fontWeight: 700, color: HOLO }}>{previewData.label}</Typography>
          <Typography sx={{ fontSize: 11, mt: 0.5 }}>{previewData.subtitle}</Typography>
        </Box>
      )}
    </Box>
  </Box>
);
```

- [ ] **Step 2: OntologyList 에 `onHover` prop 추가**

`OntologyList.jsx` 의 row render 부분에 `onMouseEnter={() => onHover?.(it)}` 추가.

- [ ] **Step 3: 브라우저 검증 — NEW_NL → Data Source → Ontology 탭에서 Q&A row hover → 우측에 Answer 본문 미리보기**

Expected: hover 1회 = fetchQa 1번 호출 (network tab 확인) · 본문이 우측에 표시.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/view/util/t3composer/OntologyTab.jsx \
        frontend/src/view/util/t3composer/OntologyList.jsx
git commit -m "feat(composer): Picker OntologyTab — 우측 미리보기 패널 + hover preview"
```

---

## Task 18: 수동 E2E 검증

**Files:** (변경 없음 — 통합 검증)

- [ ] **Step 1: 트리 진입 → Q&A 신규 생성 → 저장 → 트리에 표시**

브라우저:
1. Composer 좌측 사이드바 [Ontology] 클릭
2. 좌 트리 하단 [새 Q&A] 클릭
3. Question: "테스트 Q E2E", Answer: "SELECT 1", Domain: "BF", DB: mssql, Paraphrases: ["변형A","변형B"], 연관 Entity: ["TEST_E1"]
4. [저장] → "신규 저장 완료" 토스트
5. 좌 트리 refresh → BF 도메인 아래에 새 row 표시

- [ ] **Step 2: AI 제안 1회 (Answer 필드)**

같은 Q&A 의 Answer 필드 옆 ✨ 클릭 → 모달 → 현재값/제안값 표시 → [수락] → Answer 가 제안값으로 교체.

(AnthropicApiKey 미등록이면 500 오류 → 우상단 [API 키] 등록 후 재시도.)

- [ ] **Step 3: NEW_NL 흐름에서 새 Q&A 가 Picker 에 보이는지 + 본문 주입**

브라우저:
1. Composer [Composer] tab 으로 돌아가 [신규 생성 (자연어)] 클릭
2. [Data Source 선택] → [Ontology] 탭 → 좀 전에 생성한 "테스트 Q E2E" 검색
3. 클릭 → 바스켓 추가
4. 우측 미리보기에 Answer "SELECT 1" 표시 확인
5. NEW_NL 자연어 입력 "이 Q&A 처럼 새 화면 만들어줘" → [생성하기]

backend log:
```bash
docker compose logs --tail 500 composer-backend 2>&1 | grep -B 1 -A 8 "온톨로지 — Q&A"
```

Expected: `──` 형식 + `A: SELECT 1` + Paraphrases · 연관 Entity 모두 포함.

- [ ] **Step 4: Soft delete + 재진입 시 사라짐**

브라우저:
1. [Ontology] tab → 테스트 Q&A 선택 → [삭제 (soft)] → 확인
2. 좌 트리 refresh → 해당 row 사라짐
3. 같은 Picker 에서 검색해도 안 나옴

composer-db 확인 (선택):
```bash
docker compose exec -T composer-db psql -U composer -d T3SMARTSCM \
  -c "SELECT id, kind, ref_id, extension FROM dbo.tb_cmp_ontology_ext WHERE kind='QA' ORDER BY modify_dttm DESC LIMIT 5;"
```

Expected: extension JSON 에 paraphrases/relatedEntityIds 보존 (복원 시 재사용 가능).

- [ ] **Step 5: View / Process 카테고리 read-only 확인**

좌 트리 View / Process 카테고리 lock 아이콘 + 클릭 시 우측에 ViewReadOnly/ProcessReadOnly 표시. 편집 버튼 없음.

- [ ] **Step 6: Target DB 미연결 케이스**

Target DB connection 끊기 (예: `.env` 의 `TARGET_T3SERIES_DB_URL` 잘못된 값 → `docker compose up -d --force-recreate composer-backend`) → Ontology Tab 진입 시 모든 카테고리 count=0 + 우 패널 빈 상태. (throw 없음.)

복구 후 검증.

- [ ] **Step 7: Commit (검증 완료 마커)**

(추가 코드 변경이 없으면 commit 생략 OK. 단 README 나 worklog 에 검증 사실 기록할 거면 commit.)

---

## Self-Review

Spec 의 각 섹션 → Task 매핑:

- §3.1 모듈 구성 (frontend ontology/*, backend ontology/*) → Task 11, 12, 13, 14 (frontend) + Task 2-9 (backend) ✓
- §3.2 DB tb_cmp_ontology_ext → Task 1 (마이그레이션) + Task 2 (Entity/Repo) ✓
- §3.3 Endpoint 14개 → Task 4 (tree) + Task 5 (qa GET) + Task 6 (qa CUD) + Task 7 (entity CRUD) + Task 8 (view/process) + Task 9 (suggest) ✓
- §4.1 진입점 (App.jsx) → Task 15 ✓
- §4.2 페이지 레이아웃 → Task 11 ✓
- §4.3 QaEditor 필드 → Task 13 ✓
- §4.4 EntityEditor 필드 → Task 14 ✓
- §4.5 규약 (soft delete · 트리 refresh · 다국어 한글) → Task 6, 13 ✓
- §5.1 Tab 편집 흐름 → Task 5, 6 ✓
- §5.2 Picker 흐름 (bulk + 본문 주입) → Task 16 ✓
- §5.3 Picker 우측 미리보기 → Task 17 ✓
- §6 AI 제안 (필드별 prompt) → Task 9 + Task 12 (AiSuggestButton) ✓
- §7 에러 처리 (Target 미연결 · If-Match 412 · AI 실패 · 검증) → Task 4 폴백 · Task 6 412 · Task 12 모달 ✓
- §8 테스트 → 본 plan 은 backend test infra 부재로 manual curl + 브라우저 E2E 로 대체 (Task 5-9 의 step 3, Task 18). 정식 JUnit/Vitest 셋업은 v2.

Type 일관성 확인:
- `QaDto`, `EntityDto`, `TreeNodeDto` 모두 Task 3 에서 정의 → 후속 task 가 `com.zionex.t3composer.domain.ontology.dto.<Dto>` 로 참조 ✓
- 메서드명 `getQa()`, `createQa()`, `updateQa()`, `deleteQa()` Task 5-6 일관 ✓
- 프런트 api.js export 이름 (`fetchQa`, `createQa`, `updateQa`, `deleteQa`, `fetchQaBulk`, `fetchEntity*`, `ontologySuggest`) → Task 10 정의, Task 13-17 사용. 일치 ✓

Placeholder scan:
- 모든 task 에 실제 코드 있음. "구현 나중에" / "TODO" 없음. ✓
- Task 11 의 좌 트리 [+ 새 Q&A] 버튼은 inline 코드 제공 ✓

Scope:
- 18 task — 한 plan 으로 적절. v2 (View/Process CRUD, V2 wiki, status workflow 등) 는 spec §9 에 분리됨. ✓

# Ontology Tab — DB 단일 진실 + Filesystem Seed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **★ Commit 정책 (사용자 요청)**: 본 plan 의 task 들은 git commit 을 포함하지 않습니다. 모든 작업 완료 후 사용자가 직접 검토·테스트 후 일괄 커밋합니다. 각 task 의 마지막 단계는 "변경 확인 (no commit)" 입니다.

**Goal:** Ontology Tab 을 DB 단일 진실 저장소 모델로 구현하고, `.insight_code/ontology_v2/` JSON 파일을 Target DB 로 일괄 복사하는 **Import 기능**을 추가한다.

**Architecture:** `OntologyService` 는 Target DB 직접 SELECT/INSERT/UPDATE/DELETE. composer-db 의 `OntologyExtension` 은 Target DB schema 에 없는 확장 필드 (paraphrases/notes 등) 만 보관. 신규 `OntologyImportService` 가 `OntologyFilesystemReader` 로 JSON 을 읽고 skip-existing 정책으로 Target DB 에 batch INSERT. UI 에 [📥 파일에서 Import] 버튼 + 다이얼로그.

**Tech Stack:** Spring Boot 3 / JdbcTemplate / Jackson · React 18 / MUI · PostgreSQL (composer-db) · MSSQL (Target DB)

**Spec:** [docs/superpowers/specs/2026-06-08-ontology-db-primary-with-filesystem-seed-design.md](../specs/2026-06-08-ontology-db-primary-with-filesystem-seed-design.md)

---

## File Map

### Backend baseline (Phase 1)
| File | Action | Purpose |
|---|---|---|
| `backend/.../ontology/service/OntologyService.java` | **Rewrite** | DB-primary 패턴으로 작성 (jdbc + extRepo) |
| `backend/.../ontology/entity/OntologyExtension.java` | **Modify** | 확장 필드만 (extension jsonb) 보관하는 base schema 로 정리 |
| `backend/.../ontology/repository/OntologyExtensionRepository.java` | **Modify** | 미사용 메서드 정리 |
| `docker/db/init-pg/34_ontology_overlay_columns.sql` | **Delete** | 임시 실험 마이그레이션 정리 |
| `docker/db/init-pg/35_ontology_overlay_revert.sql` | **Create** | dev 환경 cleanup 마이그레이션 (실험 컬럼 DROP) |

### 신규 — Import 기능 (Phase 2-3)
| File | Action | Purpose |
|---|---|---|
| `backend/.../ontology/dto/OntologyImportResult.java` | **Create** | Import endpoint 응답 DTO |
| `backend/.../ontology/service/OntologyImportService.java` | **Create** | reader → Target DB batch INSERT (skip-existing) |
| `backend/.../ontology/controller/OntologyController.java` | **Modify** | `POST /import-from-fs` endpoint 추가 |
| `frontend/.../t3composer/api.js` | **Modify** | `importOntologyFromFs` API 함수 추가 |
| `frontend/.../t3composer/ontology/OntologyImportDialog.jsx` | **Create** | 미리보기 + 실행 다이얼로그 |
| `frontend/.../t3composer/ontology/OntologyPage.jsx` | **Modify** | 좌 트리 상단에 [📥 Import] 버튼 + 다이얼로그 wiring |

### 폴리시 (Phase 4)
| File | Action | Purpose |
|---|---|---|
| `.env.example` | **Modify** | `TARGET_<CD>_PROJECT_PATH` 주석을 Import 기능 용도로 명확화 |

### 유지 (변경 없음)
- `OntologyFilesystemReader.java` — Import 가 그대로 사용
- `docker-compose.yml` — `/project` 슬롯 이미 추가됨
- `33_ontology_extension.sql` — 원본 schema

---

# Phase 1 — Backend baseline (DB-primary)

## Task 1: OntologyService 작성 (DB-primary)

**Files:**
- Rewrite: `backend/src/main/java/com/zionex/t3composer/domain/ontology/service/OntologyService.java`

- [ ] **Step 1: 전체 파일을 다음 코드로 교체 (Write tool)**

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
 * Ontology Tab — Target DB 가 단일 진실 저장소.
 *
 * <p>모든 read/write 가 Target DB 의 4개 테이블 (TB_IS_QAPATTERN ·
 * tb_is_ontlgy_entity · tb_is_vwbusnss_ontlgy · tb_is_prcss_ontlgy) 로 직접 수행된다.
 * Target DB 라우팅은 {@link TargetDataSourceRegistry} 가 세션 targetCd 의 live JdbcTemplate
 * 을 반환. 미등록/연결 실패 시 정적 {@code targetJdbcTemplate} 폴백.
 *
 * <p>composer-db 의 {@link com.zionex.t3composer.domain.ontology.entity.OntologyExtension}
 * 은 Target DB schema 에 없는 확장 필드 (paraphrases / relatedEntityIds / notes) 만 보관 —
 * (target_cd, kind, ref_id) 키로 base row 와 1:1 JOIN.
 *
 * <p>새 프로젝트 deploy 시 Target DB 가 비어있다면 {@link OntologyImportService} 의 Import
 * endpoint 로 {@code .insight_code/ontology_v2/} JSON 파일을 1회 복사해 채울 수 있다.
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

    // ─────────────────────────── Tree ───────────────────────────

    /**
     * 좌 트리 — 카테고리별 카운트 + 도메인 그룹.
     * 검색어 q 가 있으면 모든 카테고리에서 필터링.
     */
    public List<TreeNodeDto> tree(String targetCd, String q) {
        JdbcTemplate t = jdbc(targetCd);
        List<TreeNodeDto> roots = new ArrayList<>();

        // 검색은 LOWER() 적용해 case-insensitive 보장 — MSSQL collation 이 CS 인 환경 대응.
        roots.add(buildCategory(t, "QA", q,
            "SELECT id, business_domain, question AS label_text FROM TB_IS_QAPATTERN WITH (NOLOCK)"
          + " WHERE use_yn='Y'"
          + (q != null && !q.isBlank() ? " AND (LOWER(question) LIKE :q OR LOWER(business_domain) LIKE :q)" : "")
          + " ORDER BY business_domain ASC, id ASC", q,
            "id", "business_domain", "label_text", false));

        roots.add(buildCategory(t, "ENTITY", q,
            "SELECT id, COALESCE(entity_type, '(none)') AS dom, COALESCE(name, id) AS label_text FROM tb_is_ontlgy_entity WITH (NOLOCK)"
          + " WHERE ISNULL(use_yn,'Y')='Y'"
          + (q != null && !q.isBlank() ? " AND (LOWER(name) LIKE :q OR LOWER(entity_type) LIKE :q OR LOWER(terms) LIKE :q)" : "")
          + " ORDER BY entity_type ASC, name ASC", q,
            "id", "dom", "label_text", false));

        roots.add(buildCategory(t, "VIEW", q,
            "SELECT COALESCE(menu_cd, '(none)') AS id, COALESCE(menu_cd, '(none)') AS dom, COALESCE(menu_cd, '(none)') AS label_text FROM tb_is_vwbusnss_ontlgy WITH (NOLOCK)"
          + " WHERE use_yn='Y'"
          + (q != null && !q.isBlank() ? " AND LOWER(menu_cd) LIKE :q" : "")
          + " ORDER BY menu_cd ASC", q,
            "id", "dom", "label_text", true));

        roots.add(buildCategory(t, "PROCESS", q,
            "SELECT COALESCE(process_cd, '(none)') AS id, COALESCE(module, '(none)') AS dom, COALESCE(process_name, process_cd) AS label_text FROM tb_is_prcss_ontlgy WITH (NOLOCK)"
          + " WHERE ISNULL(use_yn,'Y')='Y'"
          + (q != null && !q.isBlank() ? " AND (LOWER(process_cd) LIKE :q OR LOWER(process_name) LIKE :q OR LOWER(module) LIKE :q)" : "")
          + " ORDER BY module ASC, process_cd ASC", q,
            "id", "dom", "label_text", true));

        return roots;
    }

    private TreeNodeDto buildCategory(JdbcTemplate t, String cat, String q,
                                      String sql, String qParam,
                                      String idCol, String domCol, String labelCol, boolean readOnly) {
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
            List<Map<String, Object>> rows;
            if (qParam != null && !qParam.isBlank()) {
                String like = "%" + qParam.toLowerCase() + "%";
                int placeholders = 0;
                for (int i = 0; i < resolved.length(); i++) if (resolved.charAt(i) == '?') placeholders++;
                Object[] params = new Object[placeholders];
                java.util.Arrays.fill(params, like);
                rows = t.queryForList(resolved, params);
            } else {
                rows = t.queryForList(resolved);
            }

            java.util.Map<String, List<TreeNodeDto>> byDom = new java.util.LinkedHashMap<>();
            for (Map<String, Object> r : rows) {
                String dom = r.get(domCol) == null ? "?" : r.get(domCol).toString();
                String id = r.get(idCol) == null ? "" : r.get(idCol).toString();
                String rawLabel = r.get(labelCol) == null ? id : r.get(labelCol).toString();
                if (rawLabel == null || rawLabel.isBlank()) rawLabel = id;
                String leafLabel = rawLabel.length() > 80 ? rawLabel.substring(0, 80) + "…" : rawLabel;
                byDom.computeIfAbsent(dom, k -> new ArrayList<>())
                     .add(TreeNodeDto.builder()
                         .key(cat + ":" + dom + ":" + id)
                         .category(cat).refId(id).label(leafLabel)
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

    @org.springframework.transaction.annotation.Transactional
    public com.zionex.t3composer.domain.ontology.dto.QaDto createQa(
            String targetCd, com.zionex.t3composer.domain.ontology.dto.QaDto dto, String userId) {
        JdbcTemplate t = jdbc(targetCd);
        String id = java.util.UUID.randomUUID().toString().replace("-", "");
        // description 은 TB_IS_QAPATTERN 의 NOT NULL 컬럼이지만 Ontology Tab v1 에서는 노출하지 않음.
        // 빈 문자열 '' 로 채워 NOT NULL 만족. 사용자 메모는 composer-db side-table 의 notes 로 보관.
        t.update(
            "INSERT INTO TB_IS_QAPATTERN (id, question, answer, db_type, business_domain,"
          + " description, use_yn, create_by, create_dttm, modify_by, modify_dttm)"
          + " VALUES (?, ?, ?, ?, ?, '', 'Y', ?, GETDATE(), ?, GETDATE())",
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
            dto.getQuestion(), dto.getAnswer(), dto.getDbType(), dto.getDomain(),
            userId, id);
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
        // tb_is_ontlgy_entity 의 audit 컬럼은 created_at/updated_at/created_by/updated_by
        // (Q&A 의 create_dttm/modify_dttm/create_by/modify_by 와 다름).
        t.update(
            "INSERT INTO tb_is_ontlgy_entity (id, version, name, entity_type, description,"
          + " status, importance_score, terms, use_yn, created_by, created_at, updated_by, updated_at)"
          + " VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Y', ?, GETDATE(), ?, GETDATE())",
            id, version, dto.getName(), dto.getEntityType(), dto.getDescription(),
            dto.getStatus() == null ? "CONFIRMED" : dto.getStatus(),
            dto.getImportanceScore(), joinTerms(dto.getTerms()), userId, userId);
        upsertEntityExtTables(targetCd, id, dto.getRelatedTableNames(), userId);
        return getEntity(targetCd, id);
    }

    @org.springframework.transaction.annotation.Transactional
    public com.zionex.t3composer.domain.ontology.dto.EntityDto updateEntity(
            String targetCd, String id,
            com.zionex.t3composer.domain.ontology.dto.EntityDto dto, String userId) {
        JdbcTemplate t = jdbc(targetCd);
        // description 이 null 이면 기존 값 보존 (COALESCE).
        int n = t.update(
            "UPDATE tb_is_ontlgy_entity SET name=?, entity_type=?,"
          + " description=COALESCE(?, description),"
          + " status=?, importance_score=?, terms=?, updated_by=?, updated_at=GETDATE()"
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
            "UPDATE tb_is_ontlgy_entity SET use_yn='N', updated_by=?, updated_at=GETDATE() WHERE id=?",
            userId, id);
    }

    private void upsertEntityExtTables(String targetCd, String id, List<String> tables, String userId) {
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

    // ─────────────────────────── View / Process (read-only) ───────────────────────────

    public com.zionex.t3composer.domain.ontology.dto.ViewMetaDto getView(String targetCd, String menuCd) {
        JdbcTemplate t = jdbc(targetCd);
        // T3SERIES tb_is_vwbusnss_ontlgy 실제 컬럼: id, menu_cd, llm_infrrd, business_ontlgy, version,
        // use_yn + audit. status/published_version 컬럼 부재 — version 으로 대체.
        try {
            List<Map<String, Object>> rows = t.queryForList(
                "SELECT id, menu_cd, version"
              + " FROM tb_is_vwbusnss_ontlgy WITH (NOLOCK)"
              + " WHERE menu_cd = ? AND use_yn='Y'", menuCd);
            if (rows.isEmpty()) return null;
            Map<String, Object> r = rows.get(0);
            return com.zionex.t3composer.domain.ontology.dto.ViewMetaDto.builder()
                .id(asString(r.get("id"))).menuCd(asString(r.get("menu_cd")))
                .status(null)
                .publishedVersion(asString(r.get("version")))
                .build();
        } catch (Exception e) {
            log.warn("getView({}) 실패 (테이블 부재 가능): {}", menuCd, e.getMessage());
            return null;
        }
    }

    public com.zionex.t3composer.domain.ontology.dto.ProcessMetaDto getProcess(
            String targetCd, String processCd) {
        JdbcTemplate t = jdbc(targetCd);
        try {
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
        } catch (Exception e) {
            log.warn("getProcess({}) 실패 (테이블 부재 가능): {}", processCd, e.getMessage());
            return null;
        }
    }
}
```

- [ ] **Step 2: 변경 확인 (no commit)**

```bash
# 파일 라인 수 확인 (대략 360줄)
wc -l backend/src/main/java/com/zionex/t3composer/domain/ontology/service/OntologyService.java
```

기대: 350~370 줄. `import OntologyFilesystemReader` 가 없어야 함 (grep 으로 확인):
```bash
grep -n "OntologyFilesystemReader" backend/src/main/java/com/zionex/t3composer/domain/ontology/service/OntologyService.java
```
기대: no match (Service 에서 reader 분리됨).

---

## Task 2: OntologyExtension 정리 (확장 필드만 보관하는 base schema)

**Files:**
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/ontology/entity/OntologyExtension.java`

- [ ] **Step 1: payloadJson · isDeleted 임시 필드 블록 삭제**

Edit tool 로 다음 블록 전체를 빈 문자열로 교체 (정확히 이 텍스트):
```java
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload", nullable = false, columnDefinition = "jsonb")
    private String payloadJson;     // 전체 DTO override (빈 객체면 base 사용)

    @Column(name = "is_deleted", length = 1)
    private String isDeleted;       // 'Y' / 'N'

```

- [ ] **Step 2: 클래스 javadoc 을 base schema 의미로 정돈**

다음 블록을:
```java
/**
 * composer-db 의 dbo.tb_cmp_ontology_ext — Ontology Tab 의 overlay layer.
 *
 * Base 데이터(Q&A · Entity · View · Process)는 Target 의
 * <code>.insight_code/ontology_v2/</code> 폴더에서 읽고, 본 테이블은 사용자 수정·추가·삭제만 보관.
 *
 * <ul>
 *   <li><b>extensionJson</b> — paraphrases / relatedEntityIds / notes 추가 필드 overlay (기존 의미)</li>
 *   <li><b>payloadJson</b>   — base 전체 override (edit/create) DTO JSON. 빈 객체면 base 그대로.</li>
 *   <li><b>isDeleted</b>     — Y 면 filesystem base row 를 사용자가 tombstone — 트리/조회 제외.</li>
 * </ul>
 *
 * 키: (target_cd, kind, ref_id) UNIQUE — 동일 Target 의 동일 base 에 대한 overlay 는 1개.
 */
```
다음으로 교체:
```java
/**
 * composer-db 의 dbo.tb_cmp_ontology_ext — Target DB 의 tb_is_* 에 없는 확장 필드 보관.
 *
 * <p>Target DB schema (TB_IS_QAPATTERN / tb_is_ontlgy_entity) 에 정의되지 않은 사용자 정의
 * 필드 — paraphrases · relatedEntityIds · notes 등 — 만 보관한다. base 의 question/answer/name
 * 등은 Target DB 가 보유 — 본 테이블은 그 row 와 (target_cd, kind, ref_id) 키로 1:1 매칭.
 *
 * <p>extension JSON 구조:
 * {@code { paraphrases:[string], relatedEntityIds:[string], relatedTableNames:[string], notes:string }}
 */
```

- [ ] **Step 3: kind 컬럼 주석 정돈**

다음을:
```java
    private String kind;   // 'QA' | 'ENTITY' | 'VIEW' | 'PROCESS'
```
다음으로 교체:
```java
    private String kind;   // 'QA' | 'ENTITY'
```

- [ ] **Step 4: 변경 확인 (no commit)**

```bash
# payloadJson · isDeleted 가 grep 0건
grep -E "payloadJson|isDeleted" backend/src/main/java/com/zionex/t3composer/domain/ontology/entity/OntologyExtension.java
```
기대: no match.

---

## Task 3: OntologyExtensionRepository 미사용 메서드 정리

**Files:**
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/ontology/repository/OntologyExtensionRepository.java`

- [ ] **Step 1: 사용처 없는 findByTargetCdAndKind 메서드 제거**

Edit tool 로 다음 블록을:
```java
    /** Target + kind 의 모든 overlay row (tree/list 빌드 시 user-created/tombstone 한 번에 로드). */
    List<OntologyExtension> findByTargetCdAndKind(String targetCd, String kind);

    void deleteByTargetCdAndKindAndRefId(String targetCd, String kind, String refId);
```
다음으로 교체:
```java
    void deleteByTargetCdAndKindAndRefId(String targetCd, String kind, String refId);
```

- [ ] **Step 2: 변경 확인 (no commit)**

```bash
grep -E "findByTargetCdAndKind\b" backend/src/main/java/com/zionex/t3composer/domain/ontology/repository/OntologyExtensionRepository.java
```
기대: no match (정확한 단어 경계, `findByTargetCdAndKindAndRefId` 와 구분).

---

## Task 4: 임시 마이그레이션 파일 정리 + dev cleanup 마이그레이션 작성

**Files:**
- Delete: `docker/db/init-pg/34_ontology_overlay_columns.sql`
- Create: `docker/db/init-pg/35_ontology_overlay_revert.sql`

- [ ] **Step 1: 마이그레이션 34 파일 삭제**

```bash
rm c:/vs_project/Composer/docker/db/init-pg/34_ontology_overlay_columns.sql
ls c:/vs_project/Composer/docker/db/init-pg/3*.sql
```
기대: 34 가 목록에 없음.

- [ ] **Step 2: 마이그레이션 35 파일 생성 (Write tool)**

`docker/db/init-pg/35_ontology_overlay_revert.sql`:
```sql
-- 35_ontology_overlay_revert.sql
--
-- tb_cmp_ontology_ext 를 base schema (extension jsonb 만) 로 정돈하는 dev cleanup 마이그레이션.
-- 신규 deploy 환경에서는 두 컬럼이 애초에 존재하지 않아 IF EXISTS 가 no-op 으로 안전 처리.
-- 일부 dev 환경에 잔존하는 실험 컬럼만 제거 — 멱등.
--
-- dev 환경에 적용:
--   docker compose exec -T composer-db psql -U composer -d t3composer \
--       -v ON_ERROR_STOP=1 < docker/db/init-pg/35_ontology_overlay_revert.sql

ALTER TABLE dbo.tb_cmp_ontology_ext
    DROP COLUMN IF EXISTS payload,
    DROP COLUMN IF EXISTS is_deleted;
```

- [ ] **Step 3: 변경 확인 (no commit)**

```bash
ls c:/vs_project/Composer/docker/db/init-pg/34*.sql c:/vs_project/Composer/docker/db/init-pg/35*.sql 2>&1
```
기대:
- `34*.sql` → no such file (삭제됨)
- `35_ontology_overlay_revert.sql` → 존재

---

## Task 5: dev composer-db cleanup 마이그레이션 적용

**Files (수정 없음 — DB 작업)**

- [ ] **Step 1: 35 적용**

```bash
docker compose exec -T composer-db psql -U composer -d t3composer \
    -v ON_ERROR_STOP=1 < c:/vs_project/Composer/docker/db/init-pg/35_ontology_overlay_revert.sql
```
기대 출력: `ALTER TABLE`

- [ ] **Step 2: 스키마 확인**

```bash
docker compose exec -T composer-db psql -U composer -d t3composer -c "\d dbo.tb_cmp_ontology_ext"
```
기대 컬럼: `id · target_cd · kind · ref_id · extension · create_by · create_dttm · modify_by · modify_dttm`
기대 부재 컬럼: `payload`, `is_deleted` 없음.

---

## Task 6: 백엔드 재컴파일 + DB-primary baseline 동작 확인

**Files (코드 수정 없음)**

- [ ] **Step 1: mvn compile**

```bash
docker compose exec -T composer-backend bash -lc "cd /app && mvn -B -DskipTests compile 2>&1 | tail -10"
```
기대 출력 끝: `BUILD SUCCESS`.

- [ ] **Step 2: DevTools restart 트리거**

```bash
docker compose exec -T composer-backend bash -lc "date +%s > /app/target/classes/.devtools-restart-trigger"
```

- [ ] **Step 3: 백엔드 ready 대기 + tree endpoint 확인**

```bash
until curl -sS -f http://localhost:8090/actuator/health > /dev/null 2>&1; do sleep 2; done
curl -sS "http://localhost:8090/composer/ontology/tree?targetCd=T3SERIES" | head -c 400
```
기대: T3SERIES DB 의 Q&A 100건 + Entity ~1449 가 카테고리별로 도메인 그룹과 함께 응답. `"count":100` 또는 비슷한 값 확인.

- [ ] **Step 4: getQa endpoint smoke**

```bash
curl -sS "http://localhost:8090/composer/ontology/qa/0134cfa57377451b4259f5fb5b2d8b42?targetCd=T3SERIES" | head -c 300
```
기대: `{"id":"...","question":"이번 주 보충이 필요한 SKU 목록을 알려줘.","answer":"WITH LATEST_RP_VERSION ...","dbType":"mssql","domain":"Replenishment Planning",...}` 형태.

> ★ Phase 1 완료 — Backend baseline 동작 확인.

---

# Phase 2 — Import Backend

## Task 7: OntologyImportResult DTO 생성

**Files:**
- Create: `backend/src/main/java/com/zionex/t3composer/domain/ontology/dto/OntologyImportResult.java`

- [ ] **Step 1: DTO 작성 (Write tool)**

```java
package com.zionex.t3composer.domain.ontology.dto;

import java.util.LinkedHashMap;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * /composer/ontology/import-from-fs 응답.
 *
 * <p>카테고리별로 {@link CategoryCount} (added · skipped · available) 를 담는다.
 * 폴더 부재 시 {@code hasFolder=false} + 각 카운트는 0.
 * 카테고리별로 Target DB 테이블이 부재한 경우 (Invalid object name) 그 카테고리만
 * {@link CategoryCount#skippedReason} 에 'table absent' 가 설정되고 다른 카테고리는 계속.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OntologyImportResult {

    private String targetCd;
    private String ontologyRoot;          // resolved 절대 경로 또는 null
    private boolean hasFolder;
    private CategoryCount qa;
    private CategoryCount entity;
    private CategoryCount view;
    private CategoryCount process;

    /** 빈 응답 (폴더 부재 시). */
    public static OntologyImportResult empty(String targetCd, String ontologyRoot) {
        return OntologyImportResult.builder()
            .targetCd(targetCd).ontologyRoot(ontologyRoot).hasFolder(false)
            .qa(CategoryCount.zero())
            .entity(CategoryCount.zero())
            .view(CategoryCount.zero())
            .process(CategoryCount.zero())
            .build();
    }

    public Map<String, Object> toMap() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("targetCd", targetCd);
        m.put("ontologyRoot", ontologyRoot);
        m.put("hasFolder", hasFolder);
        m.put("qa", qa);
        m.put("entity", entity);
        m.put("view", view);
        m.put("process", process);
        return m;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryCount {
        private int added;
        private int skipped;
        private int available;
        private String skippedReason;   // 'table absent' / 'json parse error' 등 — 정상 시 null

        public static CategoryCount zero() {
            return CategoryCount.builder().added(0).skipped(0).available(0).build();
        }
    }
}
```

- [ ] **Step 2: 변경 확인 (no commit)**

```bash
ls -la c:/vs_project/Composer/backend/src/main/java/com/zionex/t3composer/domain/ontology/dto/OntologyImportResult.java
```
기대: 파일 존재.

---

## Task 8: OntologyImportService 작성

**Files:**
- Create: `backend/src/main/java/com/zionex/t3composer/domain/ontology/service/OntologyImportService.java`

- [ ] **Step 1: Service 작성 (Write tool)**

```java
package com.zionex.t3composer.domain.ontology.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.BadSqlGrammarException;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.zionex.t3composer.config.TargetDataSourceRegistry;
import com.zionex.t3composer.domain.ontology.dto.EntityDto;
import com.zionex.t3composer.domain.ontology.dto.OntologyImportResult;
import com.zionex.t3composer.domain.ontology.dto.OntologyImportResult.CategoryCount;
import com.zionex.t3composer.domain.ontology.dto.ProcessMetaDto;
import com.zionex.t3composer.domain.ontology.dto.QaDto;
import com.zionex.t3composer.domain.ontology.dto.ViewMetaDto;

import java.sql.PreparedStatement;
import java.sql.SQLException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Target 의 {@code .insight_code/ontology_v2/} JSON → Target DB 일괄 import.
 *
 * <p>{@link OntologyFilesystemReader} 가 미리 캐시한 base 데이터를 받아, Target DB 의 PK 를
 * 1000개 단위 IN 절로 조회해 existingIds 를 만든 뒤 신규 row 만 batchUpdate INSERT.
 * 충돌은 INSERT 단계에서 UNIQUE 위반으로도 한 번 더 방어 (race). 카테고리별 트랜잭션 분리.
 *
 * <p>정책: <b>skip-existing</b> — 이미 있는 id 는 update 하지 않고 skip.
 * 파일이 이전 스냅샷, DB 가 더 최신인 경우를 보호.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OntologyImportService {

    private static final int PK_CHUNK_SIZE     = 1000;   // MSSQL IN 절 파라미터 chunk
    private static final int INSERT_BATCH_SIZE = 500;
    private static final String IMPORT_USER = "composer-import";

    @Qualifier("targetJdbcTemplate")
    private final JdbcTemplate fallbackTarget;
    private final TargetDataSourceRegistry registry;
    private final OntologyFilesystemReader reader;

    /**
     * Import 실행. 폴더 없으면 hasFolder=false 응답.
     */
    public OntologyImportResult importFromFs(String targetCd) {
        String tc = safeTarget(targetCd);
        String root = reader.resolvedRootPath(tc);
        if (!reader.hasOntologyFolder(tc)) {
            log.info("Ontology import: target {} 폴더 부재 (root={}). 빈 응답.", tc, root);
            return OntologyImportResult.empty(tc, root);
        }

        JdbcTemplate t = jdbc(tc);

        CategoryCount qa      = importQa(t, tc);
        CategoryCount entity  = importEntity(t, tc);
        CategoryCount view    = importView(t, tc);
        CategoryCount process = importProcess(t, tc);

        OntologyImportResult result = OntologyImportResult.builder()
            .targetCd(tc).ontologyRoot(root).hasFolder(true)
            .qa(qa).entity(entity).view(view).process(process)
            .build();
        log.info("Ontology import 완료 — target={} qa(add={},skip={}) entity(add={},skip={}) "
               + "view(add={},skip={}) process(add={},skip={})",
            tc, qa.getAdded(), qa.getSkipped(),
            entity.getAdded(), entity.getSkipped(),
            view.getAdded(), view.getSkipped(),
            process.getAdded(), process.getSkipped());
        return result;
    }

    // ─────────────────────────── QA ───────────────────────────

    @Transactional
    protected CategoryCount importQa(JdbcTemplate t, String tc) {
        List<QaDto> all = reader.listAllQa(tc);
        int available = all.size();
        if (available == 0) return CategoryCount.builder().available(0).build();

        try {
            Set<String> existing = existingIds(t,
                "SELECT id FROM TB_IS_QAPATTERN WITH (NOLOCK) WHERE id IN ", "id",
                all.stream().map(QaDto::getId).toList());
            List<QaDto> fresh = all.stream().filter(d -> !existing.contains(d.getId())).toList();

            int added = batchInsert(t,
                "INSERT INTO TB_IS_QAPATTERN (id, question, answer, db_type, business_domain,"
              + " description, use_yn, create_by, create_dttm, modify_by, modify_dttm)"
              + " VALUES (?, ?, ?, ?, ?, '', 'Y', ?, GETDATE(), ?, GETDATE())",
                fresh, (ps, d) -> {
                    ps.setString(1, d.getId());
                    ps.setString(2, nz(d.getQuestion()));
                    ps.setString(3, nz(d.getAnswer()));
                    ps.setString(4, nz(d.getDbType()));
                    ps.setString(5, nz(d.getDomain()));
                    ps.setString(6, IMPORT_USER);
                    ps.setString(7, IMPORT_USER);
                });
            return CategoryCount.builder()
                .added(added).skipped(available - added).available(available).build();
        } catch (BadSqlGrammarException e) {
            return tableAbsent("QA", available, e);
        }
    }

    // ─────────────────────────── Entity ───────────────────────────

    @Transactional
    protected CategoryCount importEntity(JdbcTemplate t, String tc) {
        List<EntityDto> all = reader.listAllEntity(tc);
        int available = all.size();
        if (available == 0) return CategoryCount.builder().available(0).build();

        try {
            Set<String> existing = existingIds(t,
                "SELECT id FROM tb_is_ontlgy_entity WITH (NOLOCK) WHERE id IN ", "id",
                all.stream().map(EntityDto::getId).toList());
            List<EntityDto> fresh = all.stream().filter(d -> !existing.contains(d.getId())).toList();

            int added = batchInsert(t,
                "INSERT INTO tb_is_ontlgy_entity (id, version, name, entity_type, description,"
              + " status, importance_score, terms, use_yn, created_by, created_at, updated_by, updated_at)"
              + " VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Y', ?, GETDATE(), ?, GETDATE())",
                fresh, (ps, d) -> {
                    ps.setString(1, d.getId());
                    ps.setString(2, d.getVersion() == null ? "1.0" : d.getVersion());
                    ps.setString(3, nz(d.getName(), d.getId()));
                    ps.setString(4, nz(d.getEntityType()));
                    ps.setString(5, nz(d.getDescription()));
                    ps.setString(6, d.getStatus() == null ? "CONFIRMED" : d.getStatus());
                    if (d.getImportanceScore() == null) ps.setNull(7, java.sql.Types.DOUBLE);
                    else ps.setDouble(7, d.getImportanceScore());
                    ps.setString(8, joinTerms(d.getTerms()));
                    ps.setString(9, IMPORT_USER);
                    ps.setString(10, IMPORT_USER);
                });
            return CategoryCount.builder()
                .added(added).skipped(available - added).available(available).build();
        } catch (BadSqlGrammarException e) {
            return tableAbsent("ENTITY", available, e);
        }
    }

    // ─────────────────────────── View ───────────────────────────

    @Transactional
    protected CategoryCount importView(JdbcTemplate t, String tc) {
        List<ViewMetaDto> all = reader.listAllView(tc);
        int available = all.size();
        if (available == 0) return CategoryCount.builder().available(0).build();

        try {
            // T3SERIES tb_is_vwbusnss_ontlgy 실제 컬럼: id, menu_cd, version, use_yn + audit.
            // status / published_version 부재.
            Set<String> existing = existingIds(t,
                "SELECT menu_cd AS id FROM tb_is_vwbusnss_ontlgy WITH (NOLOCK) WHERE menu_cd IN ", "id",
                all.stream().map(ViewMetaDto::getMenuCd).toList());
            List<ViewMetaDto> fresh = all.stream().filter(d -> !existing.contains(d.getMenuCd())).toList();

            int added = batchInsert(t,
                "INSERT INTO tb_is_vwbusnss_ontlgy (id, menu_cd, version, use_yn,"
              + " create_by, create_dttm, modify_by, modify_dttm)"
              + " VALUES (?, ?, ?, 'Y', ?, GETDATE(), ?, GETDATE())",
                fresh, (ps, d) -> {
                    String id = d.getId() == null || d.getId().isBlank()
                        ? java.util.UUID.randomUUID().toString().replace("-", "")
                        : d.getId();
                    ps.setString(1, id);
                    ps.setString(2, d.getMenuCd());
                    ps.setString(3, d.getPublishedVersion() == null ? "1.0" : d.getPublishedVersion());
                    ps.setString(4, IMPORT_USER);
                    ps.setString(5, IMPORT_USER);
                });
            return CategoryCount.builder()
                .added(added).skipped(available - added).available(available).build();
        } catch (BadSqlGrammarException e) {
            return tableAbsent("VIEW", available, e);
        }
    }

    // ─────────────────────────── Process ───────────────────────────

    @Transactional
    protected CategoryCount importProcess(JdbcTemplate t, String tc) {
        List<ProcessMetaDto> all = reader.listAllProcess(tc);
        int available = all.size();
        if (available == 0) return CategoryCount.builder().available(0).build();

        try {
            Set<String> existing = existingIds(t,
                "SELECT process_cd AS id FROM tb_is_prcss_ontlgy WITH (NOLOCK) WHERE process_cd IN ", "id",
                all.stream().map(ProcessMetaDto::getProcessCd).toList());
            List<ProcessMetaDto> fresh = all.stream().filter(d -> !existing.contains(d.getProcessCd())).toList();

            int added = batchInsert(t,
                "INSERT INTO tb_is_prcss_ontlgy (id, process_cd, process_name, process_overview,"
              + " module, status, version, use_yn, create_by, create_dttm, modify_by, modify_dttm)"
              + " VALUES (?, ?, ?, ?, ?, ?, ?, 'Y', ?, GETDATE(), ?, GETDATE())",
                fresh, (ps, d) -> {
                    String id = d.getId() == null || d.getId().isBlank()
                        ? java.util.UUID.randomUUID().toString().replace("-", "")
                        : d.getId();
                    ps.setString(1, id);
                    ps.setString(2, d.getProcessCd());
                    ps.setString(3, nz(d.getProcessName(), d.getProcessCd()));
                    ps.setString(4, nz(d.getProcessOverview()));
                    ps.setString(5, nz(d.getModule()));
                    ps.setString(6, d.getStatus() == null ? "CONFIRMED" : d.getStatus());
                    ps.setString(7, d.getVersion() == null ? "1.0" : d.getVersion());
                    ps.setString(8, IMPORT_USER);
                    ps.setString(9, IMPORT_USER);
                });
            return CategoryCount.builder()
                .added(added).skipped(available - added).available(available).build();
        } catch (BadSqlGrammarException e) {
            return tableAbsent("PROCESS", available, e);
        }
    }

    // ─────────────────────────── helpers ───────────────────────────

    /** PK 를 PK_CHUNK_SIZE 단위로 IN 조회해 existing id set 빌드. */
    private Set<String> existingIds(JdbcTemplate t, String prefix, String pkCol, List<String> ids) {
        Set<String> result = new HashSet<>(ids.size() * 2);
        for (int i = 0; i < ids.size(); i += PK_CHUNK_SIZE) {
            List<String> chunk = ids.subList(i, Math.min(i + PK_CHUNK_SIZE, ids.size()));
            String placeholders = String.join(",", chunk.stream().map(s -> "?").toList());
            String sql = prefix + "(" + placeholders + ")";
            List<Map<String, Object>> rows = t.queryForList(sql, chunk.toArray());
            for (Map<String, Object> r : rows) {
                Object v = r.get(pkCol);
                if (v != null) result.add(v.toString());
            }
        }
        return result;
    }

    /** INSERT_BATCH_SIZE 단위로 batchUpdate. UNIQUE 위반은 row 별 skip (race 방어). */
    private <T> int batchInsert(JdbcTemplate t, String sql, List<T> rows, RowSetter<T> setter) {
        if (rows.isEmpty()) return 0;
        int added = 0;
        for (int i = 0; i < rows.size(); i += INSERT_BATCH_SIZE) {
            List<T> chunk = rows.subList(i, Math.min(i + INSERT_BATCH_SIZE, rows.size()));
            try {
                int[] affected = t.batchUpdate(sql, new BatchPreparedStatementSetter() {
                    @Override public void setValues(PreparedStatement ps, int idx) throws SQLException {
                        setter.setValues(ps, chunk.get(idx));
                    }
                    @Override public int getBatchSize() { return chunk.size(); }
                });
                for (int a : affected) if (a > 0) added++;
            } catch (DataAccessException e) {
                // batchUpdate 가 partial 실패 시 row-by-row 폴백 (race 또는 다른 제약 위반)
                log.warn("batch INSERT 부분 실패 — row-by-row 폴백: {}", e.getMessage());
                for (T row : chunk) {
                    try {
                        int n = t.update(sql, (PreparedStatement ps) -> setter.setValues(ps, row));
                        if (n > 0) added++;
                    } catch (DataAccessException single) {
                        log.debug("row skip: {}", single.getMessage());
                    }
                }
            }
        }
        return added;
    }

    @FunctionalInterface
    private interface RowSetter<T> {
        void setValues(PreparedStatement ps, T row) throws SQLException;
    }

    private CategoryCount tableAbsent(String kind, int available, BadSqlGrammarException e) {
        log.warn("Ontology import: {} 테이블 부재 — 카테고리 skip ({})", kind, e.getMessage());
        return CategoryCount.builder()
            .added(0).skipped(0).available(available).skippedReason("table absent").build();
    }

    private JdbcTemplate jdbc(String targetCd) {
        if (targetCd == null || targetCd.isBlank()) return fallbackTarget;
        try {
            JdbcTemplate live = registry.getJdbcTemplate(targetCd);
            return live != null ? live : fallbackTarget;
        } catch (Exception e) {
            log.warn("OntologyImportService: target {} 라우팅 실패, 폴백 사용: {}", targetCd, e.getMessage());
            return fallbackTarget;
        }
    }

    private static String safeTarget(String c) { return (c == null || c.isBlank()) ? "T3SERIES" : c; }
    private static String nz(String s) { return s == null ? "" : s; }
    private static String nz(String s, String fallback) { return (s == null || s.isBlank()) ? fallback : s; }
    private static String joinTerms(List<String> terms) {
        if (terms == null || terms.isEmpty()) return null;
        return String.join(",", terms);
    }

    // 사용 안 함 — import 시 미리 dry run 검사용 reserve
    @SuppressWarnings("unused")
    private List<String> sample(List<String> all) {
        return all.size() < 5 ? all : Arrays.asList(all.get(0), all.get(1), "...", all.get(all.size()-1));
    }
}
```

- [ ] **Step 2: 변경 확인 (no commit)**

```bash
wc -l c:/vs_project/Composer/backend/src/main/java/com/zionex/t3composer/domain/ontology/service/OntologyImportService.java
```
기대: 280~310 줄.

---

## Task 9: OntologyController 에 Import endpoint 추가

**Files:**
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/ontology/controller/OntologyController.java`

- [ ] **Step 1: importService 의존성 + 새 endpoint 추가**

Edit tool 로 다음 블록을:
```java
    private final OntologyService service;
    private final com.zionex.t3composer.domain.ontology.service.OntologySuggestService suggestService;
    private final AuthenticationProvider authenticationProvider;
```
다음으로 교체:
```java
    private final OntologyService service;
    private final com.zionex.t3composer.domain.ontology.service.OntologySuggestService suggestService;
    private final com.zionex.t3composer.domain.ontology.service.OntologyImportService importService;
    private final AuthenticationProvider authenticationProvider;
```

- [ ] **Step 2: refresh 위 — import endpoint 추가**

Edit tool 로 다음 블록을:
```java
    /**
     * Target 의 filesystem 캐시 폐기 + 재스캔.
     * <code>.insight_code/ontology_v2</code> JSON 파일을 수동으로 갱신했을 때 호출.
     * 응답에 카테고리별 row count 와 실제 사용된 ontology root path 포함.
     */
    @org.springframework.web.bind.annotation.PostMapping("/refresh")
    public java.util.Map<String, Object> refresh(
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        return service.refreshCache(targetCd);
    }
}
```
다음으로 교체:
```java
    /**
     * Target 의 filesystem 캐시 폐기 + 재스캔.
     * <code>.insight_code/ontology_v2</code> JSON 파일을 수동으로 갱신했을 때 호출.
     */
    @org.springframework.web.bind.annotation.PostMapping("/refresh")
    public java.util.Map<String, Object> refresh(
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        return service.refreshCache(targetCd);
    }

    // ─────────────────────────── Import from filesystem ───────────────────────────

    /**
     * {@code .insight_code/ontology_v2/} JSON 파일을 Target DB 로 1회 import.
     * skip-existing 정책 — DB 에 이미 있는 id 는 건드리지 않음.
     * 응답: 카테고리별 added/skipped/available 카운트.
     */
    @org.springframework.web.bind.annotation.PostMapping("/import-from-fs")
    public com.zionex.t3composer.domain.ontology.dto.OntologyImportResult importFromFs(
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        return importService.importFromFs(targetCd);
    }
}
```

- [ ] **Step 3: OntologyService.refreshCache 메서드는 새 Service 에 없으니 그대로 유지 확인**

Task 1 의 새 OntologyService 에는 `refreshCache` 가 없다. Refresh 는 reader 캐시 폐기용으로 여전히 필요하므로 reader 를 직접 노출하거나 OntologyService 에 simple delegate 메서드 추가.

다음 단계 (Step 4) 에서 OntologyService 에 메서드 추가:

- [ ] **Step 4: OntologyService 에 refreshCache delegate 추가**

`OntologyService.java` 를 Edit tool 로 수정 — 클래스 멤버에 reader 의존성 추가하고 메서드 추가.

다음을:
```java
    @Qualifier("targetJdbcTemplate")
    private final JdbcTemplate fallbackTarget;
    private final TargetDataSourceRegistry registry;
    private final OntologyExtensionRepository extRepo;
    private final ObjectMapper objectMapper = new ObjectMapper();
```
다음으로 교체:
```java
    @Qualifier("targetJdbcTemplate")
    private final JdbcTemplate fallbackTarget;
    private final TargetDataSourceRegistry registry;
    private final OntologyExtensionRepository extRepo;
    private final OntologyFilesystemReader reader;
    private final ObjectMapper objectMapper = new ObjectMapper();
```

다음을 (Tree 섹션 바로 위) :
```java
    // ─────────────────────────── Tree ───────────────────────────
```
다음으로 교체:
```java
    // ─────────────────────────── Filesystem cache (Import 용) ───────────────────────────

    /**
     * filesystem reader 의 Target 별 in-memory 캐시 폐기 + 즉시 워밍.
     * .insight_code/ontology_v2 폴더 갱신 또는 Import 직전에 호출하면 신선한 카운트가
     * 응답에 반영된다. 응답 shape: {@code { targetCd, ontologyRoot, qa, entity, view, process, hasFolder }}.
     */
    public java.util.Map<String, Object> refreshCache(String targetCd) {
        String tc = safeTarget(targetCd);
        reader.invalidate(tc);
        java.util.Map<String, Object> out = new java.util.LinkedHashMap<>();
        out.put("targetCd", tc);
        out.put("ontologyRoot", reader.resolvedRootPath(tc));
        out.put("hasFolder", reader.hasOntologyFolder(tc));
        out.put("qa", reader.listAllQa(tc).size());
        out.put("entity", reader.listAllEntity(tc).size());
        out.put("view", reader.listAllView(tc).size());
        out.put("process", reader.listAllProcess(tc).size());
        return out;
    }

    // ─────────────────────────── Tree ───────────────────────────
```

- [ ] **Step 5: 변경 확인 (no commit)**

```bash
grep -n "import-from-fs\|refreshCache\|OntologyImportService" \
    c:/vs_project/Composer/backend/src/main/java/com/zionex/t3composer/domain/ontology/controller/OntologyController.java \
    c:/vs_project/Composer/backend/src/main/java/com/zionex/t3composer/domain/ontology/service/OntologyService.java
```
기대: Controller 에 import-from-fs · OntologyImportService 필드 모두 등장. Service 에 refreshCache 메서드 정의 등장.

---

## Task 10: 백엔드 재컴파일 + Import endpoint smoke test

**Files (코드 수정 없음)**

- [ ] **Step 1: mvn compile + restart trigger**

```bash
docker compose exec -T composer-backend bash -lc "cd /app && mvn -B -DskipTests compile 2>&1 | tail -3 && date +%s > /app/target/classes/.devtools-restart-trigger"
```
기대: `BUILD SUCCESS`.

- [ ] **Step 2: 백엔드 ready 대기 + import-from-fs 호출 (폴더 없는 상태)**

```bash
until curl -sS -f http://localhost:8090/actuator/health > /dev/null 2>&1; do sleep 2; done
curl -sS -X POST "http://localhost:8090/composer/ontology/import-from-fs?targetCd=T3SERIES"
```

기대 (현재 TARGET_T3SERIES_PROJECT_PATH 미설정 상태):
```json
{"targetCd":"T3SERIES","ontologyRoot":null,"hasFolder":false,
 "qa":{"added":0,"skipped":0,"available":0,"skippedReason":null},
 "entity":{...},"view":{...},"process":{...}}
```

- [ ] **Step 3: 정상 동작 확인 — 기존 OntologyService 가 깨지지 않았는지**

```bash
curl -sS "http://localhost:8090/composer/ontology/tree?targetCd=T3SERIES" | head -c 200
```
기대: 100개 Q&A + 1449개 Entity 가 여전히 카테고리/도메인 그룹으로 응답.

> ★ Phase 2 완료. Phase 3 (frontend) 로.

---

# Phase 3 — Frontend (Import UI)

## Task 11: api.js 에 importOntologyFromFs 함수 추가

**Files:**
- Modify: `frontend/src/view/util/t3composer/api.js`

- [ ] **Step 1: composer/ontology/suggest 다음 줄에 추가**

Edit tool 로 다음 블록을:
```java
  zAxios.post('composer/ontology/suggest', req, composerReq({
```
찾을 때, 그 위 라인부터 패턴 매칭 후 그 라인의 함수 정의 끝에 다음을 **이어서** 추가.

다음 코드를 파일에서 찾기 (Read tool 로 정확한 위치 확인):
```js
export const fetchOntologySuggest = (req) =>
  zAxios.post('composer/ontology/suggest', req, composerReq({
```

해당 함수 정의 (괄호 + 헤더 포함 닫힘) 의 직후에 다음 함수 추가. 정확한 삽입 지점은 `fetchOntologySuggest` 정의가 끝나는 `}))` 직후.

추가할 코드:
```js

/**
 * .insight_code/ontology_v2/ JSON 파일을 Target DB 로 일괄 import.
 * skip-existing 정책 — 이미 있는 id 는 건드리지 않음.
 * 응답: { targetCd, ontologyRoot, hasFolder, qa, entity, view, process } —
 *   각 카테고리는 { added, skipped, available, skippedReason }.
 */
export const importOntologyFromFs = (targetCd) =>
  zAxios.post('composer/ontology/import-from-fs', null, composerReq({
    params: { targetCd },
  }));

/**
 * Target 의 filesystem reader 캐시 폐기 + 재스캔.
 * Import 다이얼로그 진입 시 호출해 최신 카운트 표시.
 */
export const refreshOntologyCache = (targetCd) =>
  zAxios.post('composer/ontology/refresh', null, composerReq({
    params: { targetCd },
  }));
```

- [ ] **Step 2: 변경 확인 (no commit)**

```bash
grep -n "importOntologyFromFs\|refreshOntologyCache" c:/vs_project/Composer/frontend/src/view/util/t3composer/api.js
```
기대: 두 함수 모두 export 로 정의됨.

---

## Task 12: OntologyImportDialog 컴포넌트 생성

**Files:**
- Create: `frontend/src/view/util/t3composer/ontology/OntologyImportDialog.jsx`

- [ ] **Step 1: 컴포넌트 작성 (Write tool)**

```jsx
import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, CircularProgress, Alert, Divider,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

import { importOntologyFromFs, refreshOntologyCache } from '../api';

/**
 * Ontology Tab — [📥 파일에서 Import] 다이얼로그.
 *
 * 진입 시 refresh 호출 → ontology_v2 폴더의 카운트 미리보기.
 * [Import 실행] 클릭 → import-from-fs endpoint 호출 → 결과 카운트 표시.
 *
 * Props:
 *  - open       : boolean — 다이얼로그 표시 여부
 *  - targetCd   : string  — 활성 Target System
 *  - onClose    : ()=>void — 다이얼로그 닫힘
 *  - onImported : (result)=>void — Import 성공 시 호출 (트리 reload 트리거용)
 */
function OntologyImportDialog({ open, targetCd, onClose, onImported }) {
  const [stage, setStage] = useState('idle');    // idle | preview | importing | done | error
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !targetCd) return;
    setStage('preview');
    setPreview(null);
    setResult(null);
    setError(null);
    refreshOntologyCache(targetCd)
      .then((r) => setPreview(r.data))
      .catch((e) => {
        setError(e?.response?.data?.message || e?.message || 'preview 로드 실패');
        setStage('error');
      });
  }, [open, targetCd]);

  const handleImport = () => {
    setStage('importing');
    setError(null);
    importOntologyFromFs(targetCd)
      .then((r) => {
        setResult(r.data);
        setStage('done');
        if (onImported) onImported(r.data);
      })
      .catch((e) => {
        setError(e?.response?.data?.message || e?.message || 'Import 실패');
        setStage('error');
      });
  };

  const renderCategoryRow = (label, key, source) => {
    const c = source ? source[key] : null;
    if (!c) return null;
    return (
      <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
        <Typography sx={{ fontSize: 13, color: '#3A4A63' }}>{label}</Typography>
        <Typography sx={{ fontSize: 13, fontFamily: 'monospace', color: '#3A4A63' }}>
          {stage === 'done'
            ? `신규 ${c.added} · skip ${c.skipped}${c.skippedReason ? ` (${c.skippedReason})` : ''}`
            : (typeof c === 'number' ? c.toLocaleString() : (c.available ?? 0).toLocaleString())}
        </Typography>
      </Box>
    );
  };

  const previewOrResult = stage === 'done' ? result : preview;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DownloadIcon fontSize="small" />
        파일에서 Ontology Import
      </DialogTitle>
      <DialogContent>
        {stage === 'preview' && !preview && !error && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {previewOrResult && !previewOrResult.hasFolder && stage !== 'done' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: 13 }}>
              ontology_v2 폴더가 마운트되어 있지 않습니다.<br />
              <code>.env</code> 의 <code>TARGET_{targetCd}_PROJECT_PATH</code> 를 프로젝트 루트로 설정하고
              backend 를 재기동 (<code>docker compose up -d --force-recreate composer-backend</code>) 하세요.
            </Typography>
          </Alert>
        )}

        {previewOrResult && (previewOrResult.hasFolder || stage === 'done') && (
          <Box>
            {previewOrResult.ontologyRoot && (
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 11, color: '#6E7E96' }}>폴더</Typography>
                <Typography sx={{ fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {previewOrResult.ontologyRoot}
                </Typography>
              </Box>
            )}
            <Divider sx={{ mb: 1 }} />
            <Typography sx={{ fontSize: 12, color: '#6E7E96', mb: 0.5 }}>
              {stage === 'done' ? 'Import 결과' : '발견된 데이터'}
            </Typography>
            {renderCategoryRow('Q&A',     'qa',      previewOrResult)}
            {renderCategoryRow('Entity',  'entity',  previewOrResult)}
            {renderCategoryRow('View',    'view',    previewOrResult)}
            {renderCategoryRow('Process', 'process', previewOrResult)}
            {stage !== 'done' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography sx={{ fontSize: 12 }}>
                  이미 DB 에 있는 id 는 skip 합니다 — 운영 데이터는 보호됩니다.
                </Typography>
              </Alert>
            )}
            {stage === 'done' && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography sx={{ fontSize: 12 }}>Import 완료. 좌측 트리가 곧 갱신됩니다.</Typography>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={stage === 'importing'}>
          {stage === 'done' ? '닫기' : '취소'}
        </Button>
        {stage !== 'done' && (
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={
              stage === 'importing'
              || !preview
              || !preview.hasFolder
              || (preview.qa + preview.entity + preview.view + preview.process === 0)
            }
            startIcon={stage === 'importing' ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon fontSize="small" />}
          >
            {stage === 'importing' ? 'Import 중…' : 'Import 실행'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default OntologyImportDialog;
```

- [ ] **Step 2: 변경 확인 (no commit)**

```bash
wc -l c:/vs_project/Composer/frontend/src/view/util/t3composer/ontology/OntologyImportDialog.jsx
```
기대: 140~170 줄.

---

## Task 13: OntologyPage 에 Import 버튼 + 다이얼로그 연결

**Files:**
- Modify: `frontend/src/view/util/t3composer/ontology/OntologyPage.jsx`

- [ ] **Step 1: import 문 추가**

Edit tool 로 다음을:
```jsx
import OntologyTree from './OntologyTree';
import QaEditor from './editors/QaEditor';
```
다음으로 교체:
```jsx
import OntologyTree from './OntologyTree';
import OntologyImportDialog from './OntologyImportDialog';
import QaEditor from './editors/QaEditor';
```

- [ ] **Step 2: importOpen state 추가**

다음을:
```jsx
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
```
다음으로 교체:
```jsx
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
```

- [ ] **Step 3: OntologyTree 에 onImportClick prop 추가 + 다이얼로그 mount**

다음을:
```jsx
        <OntologyTree
          width={treeWidth}
          tree={tree}
          selectedKey={selected?.key}
          onSelect={(node) => { setNewKind(null); setSelected(node); }}
          onSearch={loadTree}
          onNewClick={handleNewClick}
        />
```
다음으로 교체:
```jsx
        <OntologyTree
          width={treeWidth}
          tree={tree}
          selectedKey={selected?.key}
          onSelect={(node) => { setNewKind(null); setSelected(node); }}
          onSearch={loadTree}
          onNewClick={handleNewClick}
          onImportClick={() => setImportOpen(true)}
        />
        <OntologyImportDialog
          open={importOpen}
          targetCd={targetCd}
          onClose={() => setImportOpen(false)}
          onImported={() => { loadTree(''); }}
        />
```

- [ ] **Step 4: OntologyTree.jsx 에서 onImportClick prop 받아 버튼 렌더 — 별도 파일 확인 + 수정**

Read tool 로 [OntologyTree.jsx](frontend/src/view/util/t3composer/ontology/OntologyTree.jsx) 파일을 열고 헤더 영역 (검색바 + [+ Q&A] / [+ Entity] 추가 버튼들) 의 우측 끝에 다음 버튼 추가. 정확한 위치는 OntologyTree 의 헤더 toolbar 영역.

기존 `onNewClick` 이 받는 자리 근처에서 props destructure 에 `onImportClick` 추가:
```jsx
function OntologyTree({ width, tree, selectedKey, onSelect, onSearch, onNewClick, onImportClick }) {
```

헤더 toolbar 영역의 [+ Q&A] / [+ Entity] 버튼 옆 (또는 최상단 toolbar 의 우측) 에 다음 버튼 추가:
```jsx
{onImportClick && (
  <Tooltip title="파일에서 Import (.insight_code/ontology_v2)">
    <IconButton
      size="small"
      onClick={onImportClick}
      sx={{
        ml: 'auto',
        color: '#7CA7E0',
        '&:hover': { bgcolor: 'rgba(124,167,224,0.12)' },
      }}
    >
      <DownloadIcon fontSize="small" />
    </IconButton>
  </Tooltip>
)}
```

OntologyTree.jsx 의 import 문에 다음 추가 (이미 있는 항목은 중복하지 말 것):
```jsx
import DownloadIcon from '@mui/icons-material/Download';
import { Tooltip, IconButton } from '@mui/material';
```

> 만약 OntologyTree 의 toolbar 구조가 복잡해 버튼 추가 위치 결정이 모호하면, OntologyPage 의 splitContainerRef Box 직전 (좌 트리 column 의 위) 에 직접 작은 toolbar 를 두는 대안 가능. 본 plan 은 OntologyTree 헤더 통합을 선호 (응집도).

- [ ] **Step 5: 변경 확인 (no commit)**

```bash
grep -n "importOpen\|OntologyImportDialog\|onImportClick" \
    c:/vs_project/Composer/frontend/src/view/util/t3composer/ontology/OntologyPage.jsx \
    c:/vs_project/Composer/frontend/src/view/util/t3composer/ontology/OntologyTree.jsx
```
기대: 세 키워드 모두 양쪽 파일 (또는 적절한 한쪽) 에 등장.

---

## Task 14: Frontend 시각 확인 (수동 브라우저 테스트)

**Files (코드 수정 없음 — 브라우저 확인)**

- [ ] **Step 1: 브라우저에서 Composer 접속**

`http://localhost:5173/` → 상단 Tab [Ontology] 선택.

- [ ] **Step 2: 좌측 트리 헤더에 [📥] Download 아이콘 확인**

기대: 좌 트리 toolbar 우측 끝에 작은 download 아이콘 버튼. Hover 시 "파일에서 Import (.insight_code/ontology_v2)" tooltip.

- [ ] **Step 3: 아이콘 클릭 → 다이얼로그 열림 확인**

기대 (`TARGET_T3SERIES_PROJECT_PATH` 미설정 환경):
- 다이얼로그 타이틀 `[📥] 파일에서 Ontology Import`
- "ontology_v2 폴더가 마운트되어 있지 않습니다" 경고 alert
- [취소] · [Import 실행] (disabled)

- [ ] **Step 4: 트리 기본 동작 깨지지 않았는지 확인**

기대: 100 Q&A · ~1449 Entity 항목 트리에 그대로 표시. 항목 클릭 → 우측 에디터 정상 열림.

> ★ Phase 3 완료. 환경 설정 후 실데이터 검증은 Phase 4 에서.

---

# Phase 4 — Polish + End-to-End Manual Test

## Task 15: .env.example 의 PROJECT_PATH 주석 명확화

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Per-Target 프로젝트 루트 블록의 안내 문구 수정**

Edit tool 로 다음을:
```
# === Per-Target 프로젝트 루트 (Ontology Tab base 데이터용 — 2026-06-08 추가) ===
# .insight_code/ontology_v2 폴더가 있는 프로젝트 루트의 호스트 절대경로.
# Ontology Tab 의 Q&A · Entity · View · Process 의 base 데이터를 이 폴더의 JSON
# 파일에서 읽음. T3SERIES 처럼 wingui 가 nested (project_root/t3series-wingui/...)
# 인 경우 wingui 경로 한 단계 위 (project_root) 를 지정.
# 미설정 시 TARGET_<CD>_PATH 에 폴백 — wingui = project root 인 평탄 구조면 그대로 OK.
#
# T3SERIES 예: wingui 가 C:/vs_project/t3series_dev/t3series-wingui 이고
#              .insight_code/ontology_v2 가 C:/vs_project/t3series_dev/ 에 있다면:
#   TARGET_T3SERIES_PROJECT_PATH=C:/vs_project/t3series_dev
TARGET_T3SERIES_PROJECT_PATH=
TARGET_PLANNEL_PROJECT_PATH=
TARGET_LGES_NEXTSCM_PROJECT_PATH=
```
다음으로 교체:
```
# === Per-Target 프로젝트 루트 (Ontology Import 기능용 — 2026-06-08 추가) ===
# .insight_code/ontology_v2 폴더가 있는 프로젝트 루트의 호스트 절대경로.
#
# 용도: Ontology Tab 의 [📥 파일에서 Import] 가 이 폴더의 JSON 파일을 읽어
#       Target DB (TB_IS_QAPATTERN 등) 로 1회 복사. skip-existing 정책이라
#       이미 있는 id 는 건드리지 않음.
#
# 어디서 가져온 데이터냐: t3series-bfserver (GraphRAG 추출기) 가 DB → JSON 으로
# dump 한 결과. bfserver 가 운영되는 프로젝트는 DB 가 이미 채워져 있으므로
# 본 변수 미설정으로 무방. bfserver 없이 deploy 하는 경우만 본 변수로 폴더 위치를
# 지정해 Import 1회 클릭으로 DB 시드.
#
# T3SERIES 처럼 wingui 가 nested (project_root/t3series-wingui/...) 인 경우
# wingui 경로의 한 단계 위 (project_root) 를 지정. 미설정 시 TARGET_<CD>_PATH 에
# 폴백 — wingui = project root 인 평탄 구조 Target 호환.
#
# 예:
#   TARGET_T3SERIES_PROJECT_PATH=C:/vs_project/t3series_dev
TARGET_T3SERIES_PROJECT_PATH=
TARGET_PLANNEL_PROJECT_PATH=
TARGET_LGES_NEXTSCM_PROJECT_PATH=
```

- [ ] **Step 2: 변경 확인 (no commit)**

```bash
grep -A2 "Per-Target 프로젝트 루트" c:/vs_project/Composer/.env.example | head -5
```
기대: 새 문구 `(Ontology Import 기능용 — 2026-06-08 추가)` 출력.

---

## Task 16: End-to-End 수동 테스트 시나리오 (선택적 — 사용자 환경 의존)

**Files (코드 수정 없음)**

> 본 task 는 사용자가 `.env` 에 `TARGET_T3SERIES_PROJECT_PATH=C:/vs_project/t3series_dev` 를 설정하고 `docker compose up -d --force-recreate composer-backend composer-frontend` 를 실행한 뒤 진행. 실데이터 검증.

- [ ] **Step 1: 사용자가 `.env` 설정 + 재기동 (수동)**

```
# .env 편집
TARGET_T3SERIES_PROJECT_PATH=C:/vs_project/t3series_dev

# 재기동
docker compose up -d --force-recreate composer-backend composer-frontend
```

- [ ] **Step 2: refresh endpoint 로 폴더 발견 확인**

```bash
until curl -sS -f http://localhost:8090/actuator/health > /dev/null 2>&1; do sleep 2; done
curl -sS -X POST "http://localhost:8090/composer/ontology/refresh?targetCd=T3SERIES"
```

기대:
```json
{"targetCd":"T3SERIES",
 "ontologyRoot":"/workspace/targets/T3SERIES/project/.insight_code/ontology_v2",
 "hasFolder":true,
 "qa":101,"entity":6009,"view":3,"process":1193}
```
(엔티티는 ~6000 사이 범위면 OK)

- [ ] **Step 3: Import 실행**

```bash
curl -sS -X POST "http://localhost:8090/composer/ontology/import-from-fs?targetCd=T3SERIES"
```

기대 (이미 DB 에 100 Q&A 가 있는 상태):
```json
{"targetCd":"T3SERIES",
 "ontologyRoot":"...",
 "hasFolder":true,
 "qa":     {"added":1,"skipped":100,"available":101,"skippedReason":null},
 "entity": {"added":<some>,"skipped":<lots>,"available":6009,"skippedReason":null},
 "view":   {"added":3,"skipped":0,"available":3,"skippedReason":null},
 "process":{"added":1193,"skipped":0,"available":1193,"skippedReason":null}}
```

(현재 DB 가 entity 1449만 가지고 있어 added ≈ 4560, skipped ≈ 1449 예상. View/Process 는 0/0 가능성 높음 → 전량 added.)

- [ ] **Step 4: Import 후 tree 확인 (DB 증가 반영)**

```bash
curl -sS "http://localhost:8090/composer/ontology/tree?targetCd=T3SERIES" | head -c 200
```
기대: 카테고리별 카운트 증가 (Entity 1449 → ~6000, Process 0 → 1193 등). 새로 import 된 row 들이 트리에 등장.

- [ ] **Step 5: 브라우저 UI 확인**

`http://localhost:5173/` → [Ontology] Tab → [📥] Download 아이콘 클릭 → 다이얼로그:
- 폴더 경로 표시
- 카테고리별 카운트 표시
- [Import 실행] 활성화
- 이미 한 번 실행했으므로 두 번째 클릭 시 거의 전량 skip 응답

- [ ] **Step 6: 재실행 멱등 확인**

다이얼로그에서 [Import 실행] 한 번 더 → 기대: 모든 카테고리 added=0 (이미 import 됨). DB 운영 데이터 변화 없음.

- [ ] **Step 7: 신규 Q&A 추가 → 영속화 확인**

UI 좌측 트리에서 [+ Q&A] → 질문/답변 입력 → 저장 → tree reload 후 새 항목 등장 확인. DB 에서:
```bash
docker compose exec -T target-mssql /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "Composer!2026" -d T3SMARTSCM -C -Q \
    "SELECT TOP 5 id, question FROM TB_IS_QAPATTERN WHERE create_by != 'composer-import' ORDER BY create_dttm DESC"
```
기대: 방금 추가한 Q&A 가 결과에 포함.

> ★ Phase 4 완료. 전 기능 동작 확인.

---

## Verification Summary (사용자 최종 점검 — Commit 전)

- [ ] **Backend baseline 검증**
  - [ ] `OntologyService` 가 DB-primary 패턴으로 동작 (reader 는 refreshCache 용으로만 주입)
  - [ ] `OntologyExtension` 이 base schema (extension jsonb 만) — `payloadJson` / `isDeleted` 없음
  - [ ] `tb_cmp_ontology_ext` 스키마에 `payload` / `is_deleted` 컬럼 없음 (`\d dbo.tb_cmp_ontology_ext` 확인)
  - [ ] 마이그레이션 폴더에 `34_*` 없음 · `35_*` 존재

- [ ] **Import 기능 검증**
  - [ ] `POST /composer/ontology/import-from-fs?targetCd=T3SERIES` 응답 정상
  - [ ] 폴더 부재 시 `hasFolder:false` 응답 + UI 안내
  - [ ] 폴더 존재 시 카운트 응답 + UI 미리보기/실행
  - [ ] Skip-existing 정상 (재실행 시 added=0)

- [ ] **기존 동작 회귀 없음**
  - [ ] Tree · getQa · getEntity · createQa · updateQa · deleteQa 정상
  - [ ] UI 의 좌 트리 · 우 에디터 정상 렌더
  - [ ] 다국어 / Target 전환 정상

문제없으면 사용자가 `git add -A && git commit` 으로 일괄 커밋.

---

## Self-Review Notes (작성 후 체크)

**1. Spec coverage**:
- ✅ Backend baseline 4건 (OntologyService · OntologyExtension · Repository · migration) → Task 1-5
- ✅ Import endpoint → Task 7-9
- ✅ UI 다이얼로그 → Task 11-13
- ✅ 운영 절차 문서화 → Task 15
- ✅ 테스트 시나리오 → Task 6, 10, 14, 16

**2. Placeholder scan**: 모든 step 에 구체적 코드/명령. 없음.

**3. Type/method consistency**:
- `OntologyImportResult.CategoryCount.skippedReason` (Task 7) ↔ `tableAbsent` 가 그 필드 설정 (Task 8) — 일치
- `importOntologyFromFs` / `refreshOntologyCache` (Task 11) ↔ controller endpoint (Task 9) — 일치
- `onImportClick` prop (Task 13 OntologyPage) ↔ destructure (Task 13 OntologyTree) — 일치
- `refreshCache` (Task 9 OntologyService) ↔ controller `/refresh` (Task 9) — 일치

**4. Commit 정책**: 모든 task 의 마지막 step 이 "변경 확인 (no commit)" — 사용자 정책 반영.

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
    private final OntologyFilesystemReader reader;
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

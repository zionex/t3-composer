package com.zionex.t3composer.domain.ontology.service;

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
        } catch (DataAccessException e) {
            if (isTableAbsent(e)) return tableAbsent("QA", available, e);
            throw e;
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
        } catch (DataAccessException e) {
            if (isTableAbsent(e)) return tableAbsent("ENTITY", available, e);
            throw e;
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
        } catch (DataAccessException e) {
            if (isTableAbsent(e)) return tableAbsent("VIEW", available, e);
            throw e;
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
        } catch (DataAccessException e) {
            if (isTableAbsent(e)) return tableAbsent("PROCESS", available, e);
            throw e;
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

    private CategoryCount tableAbsent(String kind, int available, DataAccessException e) {
        log.warn("Ontology import: {} 테이블 부재 — 카테고리 skip ({})", kind, e.getMessage());
        return CategoryCount.builder()
            .added(0).skipped(0).available(available).skippedReason("table absent").build();
    }

    /**
     * MSSQL "Invalid object name" (error code 208 · SQLState S0002) 감지.
     *
     * <p>Spring 의 SQLExceptionTranslator 가 환경에 따라 BadSqlGrammarException 으로 매핑하기도 하고
     * UncategorizedSQLException 으로 폴백하기도 한다 (MSSQL JDBC 의 비표준 SQLState S0002 가 표준
     * 코드 사전에 없을 때). 어느 쪽이든 원인 chain 의 SQLException 에서 error code 208 또는
     * 메시지의 "invalid object name" 패턴으로 판별 — 견고하게 잡고 그 외 SQL 오류는 그대로 throw.
     */
    private boolean isTableAbsent(DataAccessException e) {
        if (e instanceof BadSqlGrammarException) return true;
        Throwable cur = e;
        while (cur != null) {
            if (cur instanceof SQLException sql) {
                if (sql.getErrorCode() == 208) return true;
                String msg = sql.getMessage();
                if (msg != null && msg.toLowerCase().contains("invalid object name")) return true;
            } else {
                String msg = cur.getMessage();
                if (msg != null && msg.toLowerCase().contains("invalid object name")) return true;
            }
            cur = cur.getCause();
        }
        return false;
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

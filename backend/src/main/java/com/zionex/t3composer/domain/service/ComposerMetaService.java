package com.zionex.t3composer.domain.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.extern.slf4j.Slf4j;

/**
 * Wizard 입력 보조용 메타데이터 조회 서비스.
 *
 *  - 메뉴 트리 (TB_AD_MENU)
 *  - DB 테이블 / 컬럼 (sys.tables, sys.columns)
 *  - 온톨로지 4 분류 (View · Q&A · Process · Entity)
 *
 * 모든 쿼리는 네이티브 SELECT — 읽기 전용.
 */
@Slf4j
@Service
public class ComposerMetaService {

    @PersistenceContext
    private EntityManager em;

    // ---- 메뉴 ----

    /**
     * 전체 메뉴 목록 (flat). 프런트에서 부모 기준으로 트리 재구성.
     * langCd 가 제공되면 TB_AD_LANG_PACK 조인으로 다국어 명칭(menuNm) 을 채움.
     */
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listMenus(String langCd) {
        String lang = (langCd == null || langCd.isBlank()) ? "ko" : langCd;
        List<Object[]> rows = em.createNativeQuery(
                "SELECT m.ID, m.PARENT_ID, m.MENU_CD, m.MENU_PATH, m.MENU_FILE_PATH, m.MENU_SEQ, m.USE_YN, "
              + "       lp.LANG_VALUE AS MENU_NM "
              + "  FROM TB_AD_MENU m "
              + "  LEFT JOIN TB_AD_LANG_PACK lp "
              + "         ON lp.LANG_KEY = m.MENU_CD AND lp.LANG_CD = :lang "
              + " WHERE m.USE_YN = 'Y' "
              + " ORDER BY m.MENU_SEQ ASC, m.MENU_CD ASC")
                .setParameter("lang", lang)
                .getResultList();

        List<Map<String, Object>> out = new ArrayList<>(rows.size());
        for (Object[] r : rows) {
            Map<String, Object> m = new HashMap<>();
            m.put("id",           r[0]);
            m.put("parentId",     r[1]);
            m.put("menuCd",       r[2]);
            m.put("menuPath",     r[3]);
            m.put("menuFilePath", r[4]);
            m.put("seq",          r[5] == null ? 0 : ((Number) r[5]).intValue());
            m.put("useYn",        r[6]);
            // 그룹 노드 판별: MENU_FILE_PATH 가 비어있으면 그룹
            String filePath = r[4] == null ? "" : r[4].toString();
            m.put("isGroup", filePath.isBlank());
            // 다국어 명칭 — LANG_PACK 매칭 결과, 없으면 MENU_PATH 의 마지막 segment 폴백
            String menuNm = r[7] == null ? null : r[7].toString();
            if (menuNm == null || menuNm.isBlank()) {
                menuNm = deriveLeafName(r[3] == null ? "" : r[3].toString(),
                                        r[2] == null ? "" : r[2].toString());
            }
            m.put("menuNm", menuNm);
            out.add(m);
        }
        return out;
    }

    /** 레거시 시그니처 — 기본 ko */
    public List<Map<String, Object>> listMenus() {
        return listMenus("ko");
    }

    /** MENU_PATH 의 마지막 구분자 이후 세그먼트를 반환. 실패 시 MENU_CD. */
    private String deriveLeafName(String menuPath, String menuCd) {
        if (menuPath == null) return menuCd;
        String p = menuPath.trim();
        for (String sep : new String[] { " > ", ">", "/" }) {
            int idx = p.lastIndexOf(sep);
            if (idx >= 0 && idx + sep.length() < p.length()) {
                return p.substring(idx + sep.length()).trim();
            }
        }
        return p.isEmpty() ? menuCd : p;
    }

    /**
     * 사용자 그룹 목록 — 메뉴 등록 시 권한 부여 대상 선택용.
     */
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listGroups() {
        List<Object[]> rows = em.createNativeQuery(
                "SELECT ID, GRP_CD, GRP_NM, GRP_DESCRIP "
              + "  FROM TB_AD_GROUP "
              + " ORDER BY GRP_CD ASC")
                .getResultList();

        List<Map<String, Object>> out = new ArrayList<>(rows.size());
        for (Object[] r : rows) {
            Map<String, Object> m = new HashMap<>();
            m.put("id",          r[0]);
            m.put("grpCd",       r[1]);
            m.put("grpNm",       r[2]);
            m.put("grpDescrip",  r[3]);
            out.add(m);
        }
        return out;
    }

    // ---- DB 테이블 ----

    /**
     * 테이블 목록 (sys.tables). q 로 이름 필터.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listTables(String q, int limit) {
        StringBuilder sql = new StringBuilder(
                "SELECT t.name AS table_name, "
              + "       SCHEMA_NAME(t.schema_id) AS schema_name, "
              + "       (SELECT COUNT(*) FROM sys.columns c WHERE c.object_id = t.object_id) AS column_count, "
              + "       CAST(ep.value AS NVARCHAR(500)) AS description "
              + "  FROM sys.tables t "
              + "  LEFT JOIN sys.extended_properties ep "
              + "       ON ep.major_id = t.object_id AND ep.minor_id = 0 AND ep.name = 'MS_Description' "
              + " WHERE t.is_ms_shipped = 0 "
        );
        if (q != null && !q.isBlank()) {
            sql.append(" AND t.name LIKE :q ");
        }
        sql.append(" ORDER BY t.name ASC ");

        var query = em.createNativeQuery(sql.toString());
        if (q != null && !q.isBlank()) {
            query.setParameter("q", "%" + q + "%");
        }
        if (limit > 0) {
            query.setMaxResults(limit);
        }

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();

        List<Map<String, Object>> out = new ArrayList<>(rows.size());
        for (Object[] r : rows) {
            Map<String, Object> m = new HashMap<>();
            m.put("tableName",   r[0]);
            m.put("schemaName",  r[1]);
            m.put("columnCount", r[2] == null ? 0 : ((Number) r[2]).intValue());
            m.put("description", r[3]);
            out.add(m);
        }
        return out;
    }

    /**
     * 특정 테이블의 컬럼 목록.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listColumns(String tableName) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(
                "SELECT c.name AS column_name, "
              + "       tp.name AS data_type, "
              + "       c.max_length, "
              + "       c.is_nullable, "
              + "       c.is_identity, "
              + "       CAST(ep.value AS NVARCHAR(500)) AS description "
              + "  FROM sys.columns c "
              + "  INNER JOIN sys.tables t ON c.object_id = t.object_id "
              + "  INNER JOIN sys.types  tp ON c.user_type_id = tp.user_type_id "
              + "  LEFT JOIN  sys.extended_properties ep "
              + "       ON ep.major_id = c.object_id AND ep.minor_id = c.column_id AND ep.name = 'MS_Description' "
              + " WHERE t.name = :name "
              + " ORDER BY c.column_id ASC")
                .setParameter("name", tableName)
                .getResultList();

        List<Map<String, Object>> out = new ArrayList<>(rows.size());
        for (Object[] r : rows) {
            Map<String, Object> m = new HashMap<>();
            m.put("columnName",  r[0]);
            m.put("dataType",    r[1]);
            m.put("maxLength",   r[2] == null ? 0 : ((Number) r[2]).intValue());
            m.put("isNullable",  r[3] != null && ((Boolean) r[3]));
            m.put("isIdentity",  r[4] != null && ((Boolean) r[4]));
            m.put("description", r[5]);
            out.add(m);
        }
        return out;
    }

    // ---- 온톨로지 ----

    /**
     * View 온톨로지 (menu_cd 단위) — tb_is_vwbusnss_ontlgy
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listOntologyViews(String q, int limit) {
        return ontologyList(
                "SELECT id, menu_cd, status, published_version, modify_dttm "
              + "  FROM tb_is_vwbusnss_ontlgy "
              + " WHERE use_yn = 'Y' "
              + (q == null || q.isBlank() ? "" : "   AND menu_cd LIKE :q ")
              + " ORDER BY menu_cd ASC ",
                q,
                limit,
                (r, m) -> {
                    m.put("key",       r[1]);                 // menu_cd
                    m.put("category",  "VIEW");
                    m.put("title",     r[1]);                 // menu_cd
                    m.put("subtitle",  "status: " + (r[2] == null ? "-" : r[2]));
                    m.put("id",        r[0]);
                    m.put("status",    r[2]);
                    m.put("version",   r[3]);
                    m.put("modifyDttm", r[4]);
                });
    }

    /**
     * Q&A 패턴 — TB_IS_QAPATTERN
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listOntologyQa(String q, int limit) {
        return ontologyList(
                "SELECT id, question, answer, db_type, business_domain, use_yn "
              + "  FROM TB_IS_QAPATTERN "
              + " WHERE use_yn = 'Y' "
              + (q == null || q.isBlank() ? "" : "   AND (question LIKE :q OR business_domain LIKE :q) ")
              + " ORDER BY business_domain ASC ",
                q,
                limit,
                (r, m) -> {
                    m.put("key",      r[0]);
                    m.put("category", "QA");
                    String qu = r[1] == null ? "" : r[1].toString();
                    m.put("title",    qu.length() > 80 ? qu.substring(0, 80) + "..." : qu);
                    m.put("subtitle", "domain: " + (r[4] == null ? "-" : r[4]) + " · " + (r[3] == null ? "" : r[3]));
                    m.put("id",       r[0]);
                    m.put("question", r[1]);
                    m.put("answer",   r[2]);
                    m.put("dbType",   r[3]);
                    m.put("domain",   r[4]);
                });
    }

    /**
     * Process 온톨로지 — tb_is_prcss_ontlgy
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listOntologyProcess(String q, int limit) {
        return ontologyList(
                "SELECT id, process_cd, process_name, process_overview, module, status, version "
              + "  FROM tb_is_prcss_ontlgy "
              + " WHERE ISNULL(use_yn, 'Y') = 'Y' "
              + (q == null || q.isBlank() ? "" :
                    "   AND (process_cd LIKE :q OR process_name LIKE :q OR module LIKE :q) ")
              + " ORDER BY module ASC, process_cd ASC ",
                q,
                limit,
                (r, m) -> {
                    m.put("key",        r[1]);                       // process_cd
                    m.put("category",   "PROCESS");
                    m.put("title",      r[2] == null ? r[1] : r[2]); // name or cd
                    m.put("subtitle",   "module: " + (r[4] == null ? "-" : r[4]) + " · " + r[1]);
                    m.put("id",         r[0]);
                    m.put("processCd",  r[1]);
                    m.put("processName", r[2]);
                    m.put("overview",   r[3]);
                    m.put("module",     r[4]);
                    m.put("status",     r[5]);
                });
    }

    /**
     * Entity 온톨로지 — tb_is_ontlgy_entity (status=CONFIRMED 우선)
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listOntologyEntity(String q, int limit) {
        return ontologyList(
                "SELECT TOP " + (limit > 0 ? limit : 500)
              + "     id, version, name, entity_type, description, status, importance_score "
              + "  FROM tb_is_ontlgy_entity "
              + " WHERE ISNULL(use_yn, 'Y') = 'Y' "
              + (q == null || q.isBlank() ? "" :
                    "   AND (id LIKE :q OR name LIKE :q OR entity_type LIKE :q OR terms LIKE :q) ")
              + " ORDER BY CASE status WHEN 'CONFIRMED' THEN 0 WHEN 'REVIEWING' THEN 1 ELSE 2 END, "
              + "          importance_score DESC, name ASC ",
                q,
                0,
                (r, m) -> {
                    m.put("key",        r[0]);                       // id
                    m.put("category",   "ENTITY");
                    m.put("title",      r[2] == null ? r[0] : r[2]); // name or id
                    m.put("subtitle",   "type: " + (r[3] == null ? "-" : r[3]) + " · " + (r[5] == null ? "" : r[5]));
                    m.put("id",         r[0]);
                    m.put("version",    r[1]);
                    m.put("entityType", r[3]);
                    m.put("description", r[4]);
                    m.put("status",     r[5]);
                    m.put("importanceScore", r[6]);
                });
    }

    // ---- helper ----

    @FunctionalInterface
    private interface RowMapper {
        void apply(Object[] row, Map<String, Object> target);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> ontologyList(String sql, String q, int limit, RowMapper mapper) {
        var query = em.createNativeQuery(sql);
        if (q != null && !q.isBlank()) {
            query.setParameter("q", "%" + q + "%");
        }
        if (limit > 0 && !sql.toUpperCase().contains(" TOP ")) {
            query.setMaxResults(limit);
        }
        try {
            List<Object[]> rows = query.getResultList();
            List<Map<String, Object>> out = new ArrayList<>(rows.size());
            for (Object[] r : rows) {
                Map<String, Object> m = new HashMap<>();
                mapper.apply(r, m);
                out.add(m);
            }
            return out;
        } catch (Exception e) {
            // 테이블이 아직 없는 경우 등 — 빈 리스트 반환
            log.warn("ontologyList failed: {}", e.getMessage());
            return List.of();
        }
    }
}

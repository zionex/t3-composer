package com.zionex.t3composer.domain.schema;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.zionex.t3composer.config.TargetDataSourceRegistry;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Stored Procedure 메타 조회 — Composer NEW_NL 모드가 사용자가 prompt 에 명시한 SP 가
 * 운영 DB(MSSQL Target) 에 이미 존재하는지, 시그니처가 어떻게 되는지를 LLM 에 전달한다.
 *
 * 정책: 사용자가 명시한 SP 가
 *   1) 존재 → 새 CREATE PROCEDURE 생성 금지. 기존 시그니처/본문으로 호출부만 작성.
 *   2) 미존재 → 새 SQL_DDL 아티팩트로 생성 가능 (NEW_NL/NEW_GENERAL 모드만).
 * 또한 사용자가 명시한 SP 외의 다른 동작(예: 삭제 SP) 은 LLM 이 임의로 추가 금지.
 *
 * DataSource: {@link TargetDataSourceRegistry} 로 targetCd 별 동적 라우팅. Composer 자체
 * 메타 DB(PG) 에는 SP 가 없으므로 반드시 Target Operational DB(MSSQL) 에 질의.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProcedureInspectionService {

    private final TargetDataSourceRegistry registry;

    /** SP 식별자 정규식 — 안전한 식별자만 허용 (SQL injection 방어) */
    private static final Pattern PROC_NAME_PATTERN = Pattern.compile("^[A-Za-z_][A-Za-z0-9_]*$");

    /** 자연어 prompt 에서 SP_* 형식 SP 명 추출용 — 대소문자 모두 허용 */
    private static final Pattern PROC_REF_PATTERN = Pattern.compile(
            "\\b(SP_[A-Z][A-Z0-9_]+|sp_[a-z][a-z0-9_]+)\\b");

    /** SP 본문이 너무 길면 prompt 첨부 시 잘라낼 길이 (한 SP 당). */
    private static final int BODY_TRUNCATE_LIMIT = 6000;

    // ──────────────────────────────────────────────────────────────────
    // 단일 SP lookup
    // ──────────────────────────────────────────────────────────────────

    public boolean procedureExists(String targetCd, String procName) {
        if (!isValidIdentifier(procName)) return false;
        JdbcTemplate jdbc = registry.getJdbcTemplate(targetCd);
        if (jdbc == null) return false;
        try {
            Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM sys.procedures WHERE LOWER(name) = LOWER(?)",
                Integer.class, procName);
            return count != null && count > 0;
        } catch (DataAccessException e) {
            log.warn("procedureExists 조회 실패 (target={}, proc={}): {}", targetCd, procName, e.getMessage());
            return false;
        }
    }

    /**
     * SP 메타데이터 — 존재 여부 + 파라미터 + 본문 + 수정일자 한 번에.
     * 미존재 또는 target DB 연결 불가 시 exists=false 인 객체 반환.
     */
    public ProcedureInfo getProcedureInfo(String targetCd, String procName) {
        ProcedureInfo.ProcedureInfoBuilder b = ProcedureInfo.builder()
                .procedureName(procName)
                .parameters(Collections.emptyList());

        if (!isValidIdentifier(procName)) {
            return b.exists(false).build();
        }
        JdbcTemplate jdbc = registry.getJdbcTemplate(targetCd);
        if (jdbc == null) {
            log.debug("target {} JdbcTemplate 미사용 — SP lookup 스킵", targetCd);
            return b.exists(false).build();
        }

        // 1) schema + modify_date + object_id 한 번에
        Map<String, Object> meta;
        try {
            meta = jdbc.queryForMap(
                "SELECT SCHEMA_NAME(p.schema_id) AS schema_name," +
                "       p.object_id              AS object_id," +
                "       CONVERT(VARCHAR(19), p.modify_date, 120) AS modify_date" +
                "  FROM sys.procedures p" +
                " WHERE LOWER(p.name) = LOWER(?)",
                procName);
        } catch (DataAccessException e) {
            // queryForMap 은 0행이면 EmptyResultDataAccessException — 미존재로 취급
            return b.exists(false).build();
        }
        Integer objectId = (Integer) meta.get("object_id");
        String schema = (String) meta.get("schema_name");
        String modifyDate = (String) meta.get("modify_date");
        b.procedureSchema(schema).exists(true).modifyDate(modifyDate);

        // 2) 파라미터
        List<ProcedureParameter> params = jdbc.query(
            "SELECT p.name           AS name," +
            "       t.name           AS type_name," +
            "       p.max_length     AS max_length," +
            "       p.precision      AS precision," +
            "       p.scale          AS scale," +
            "       p.is_output      AS is_output," +
            "       p.parameter_id   AS ordinal" +
            "  FROM sys.parameters p" +
            "  JOIN sys.types      t ON p.user_type_id = t.user_type_id" +
            " WHERE p.object_id = ?" +
            " ORDER BY p.parameter_id",
            (rs, rowNum) -> {
                ProcedureParameter pp = new ProcedureParameter();
                pp.setName(rs.getString("name"));
                pp.setDataType(rs.getString("type_name"));
                // MSSQL sys.parameters 의 max_length=smallint(Short), precision/scale=tinyint(Byte).
                // (Integer) 직접 캐스트는 ClassCastException — Number 로 받아서 intValue 추출.
                Integer maxLen = asInteger(rs.getObject("max_length"));
                // MSSQL: NVARCHAR 의 max_length 는 바이트 단위 (NCHAR = 2 byte). 보정.
                if (maxLen != null && pp.getDataType() != null
                        && (pp.getDataType().toLowerCase().startsWith("nvarchar")
                            || pp.getDataType().toLowerCase().startsWith("nchar"))) {
                    pp.setMaxLength(maxLen == -1 ? -1 : maxLen / 2);
                } else {
                    pp.setMaxLength(maxLen);
                }
                pp.setPrecision(asInteger(rs.getObject("precision")));
                pp.setScale(asInteger(rs.getObject("scale")));
                pp.setOutput(rs.getBoolean("is_output"));
                pp.setOrdinalPosition(asInteger(rs.getObject("ordinal")));
                return pp;
            },
            objectId);
        b.parameters(params);

        // 3) 본문 (OBJECT_DEFINITION 은 nvarchar(max) — 4000 자 잘림 없음)
        try {
            String body = jdbc.queryForObject(
                "SELECT OBJECT_DEFINITION(?) ",
                String.class, objectId);
            b.body(body);
        } catch (DataAccessException e) {
            log.debug("SP 본문 조회 실패 ({}): {}", procName, e.getMessage());
        }

        return b.build();
    }

    /**
     * JDBC ResultSet 의 numeric 컬럼을 Integer 로 안전 변환.
     * MSSQL sys.parameters 처럼 smallint/tinyint 컬럼은 JDBC 가 Short/Byte 로 돌려주므로
     * (Integer) 직접 캐스트는 ClassCastException — Number 경유로 처리.
     */
    private static Integer asInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.intValue();
        return null;
    }

    // ──────────────────────────────────────────────────────────────────
    // 배치 lookup
    // ──────────────────────────────────────────────────────────────────

    public Map<String, ProcedureInfo> getMultipleProcedures(String targetCd, List<String> procNames) {
        Map<String, ProcedureInfo> out = new LinkedHashMap<>();
        if (procNames == null) return out;
        for (String name : procNames) {
            if (name == null) continue;
            String trimmed = name.trim();
            if (trimmed.isEmpty()) continue;
            String key = trimmed.toUpperCase();
            if (out.containsKey(key)) continue;
            out.put(key, getProcedureInfo(targetCd, trimmed));
        }
        return out;
    }

    /** 자연어 prompt 에서 SP_* / sp_* 추출 후 lookup. */
    public Map<String, ProcedureInfo> lookupProceduresInText(String targetCd, String text) {
        return getMultipleProcedures(targetCd, extractProcedureNamesFromText(text));
    }

    public List<String> extractProcedureNamesFromText(String text) {
        if (text == null || text.isEmpty()) return Collections.emptyList();
        Matcher m = PROC_REF_PATTERN.matcher(text);
        Map<String, Boolean> seen = new HashMap<>();
        List<String> out = new ArrayList<>();
        while (m.find()) {
            String name = m.group(1);
            if (!seen.containsKey(name)) {
                seen.put(name, true);
                out.add(name);
            }
        }
        return out;
    }

    // ──────────────────────────────────────────────────────────────────
    // Prompt 직렬화 — LLM 이 SP 존재/시그니처/본문을 한눈에 보고 정책을 지키도록.
    // ──────────────────────────────────────────────────────────────────

    public String formatLookupResultForPrompt(Map<String, ProcedureInfo> lookup) {
        if (lookup == null || lookup.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        sb.append("=== 자동 Stored Procedure 존재 여부 확인 (Target Operational DB · sys.procedures 조회) ===\n");
        for (Map.Entry<String, ProcedureInfo> e : lookup.entrySet()) {
            ProcedureInfo info = e.getValue();
            if (info.isExists()) {
                sb.append("[✓ 존재] ")
                  .append(info.getProcedureSchema() == null ? "dbo" : info.getProcedureSchema())
                  .append('.').append(info.getProcedureName());
                if (info.getModifyDate() != null) {
                    sb.append("   (modified: ").append(info.getModifyDate()).append(')');
                }
                sb.append('\n');

                List<ProcedureParameter> params = info.getParameters();
                if (params != null && !params.isEmpty()) {
                    sb.append("    -- 파라미터 --\n");
                    for (ProcedureParameter p : params) {
                        sb.append("    ").append(p.getName()).append("  ").append(p.getDataType());
                        if (p.getMaxLength() != null) {
                            String lenStr = (p.getMaxLength() == -1) ? "MAX" : p.getMaxLength().toString();
                            if (p.getDataType() != null && (p.getDataType().toLowerCase().contains("char")
                                    || p.getDataType().toLowerCase().contains("binary"))) {
                                sb.append('(').append(lenStr).append(')');
                            }
                        } else if (p.getPrecision() != null) {
                            sb.append('(').append(p.getPrecision());
                            if (p.getScale() != null && p.getScale() > 0) sb.append(',').append(p.getScale());
                            sb.append(')');
                        }
                        if (p.isOutput()) sb.append("  OUTPUT");
                        sb.append('\n');
                    }
                }

                if (info.getBody() != null && !info.getBody().isBlank()) {
                    sb.append("    -- 본문 --\n");
                    String body = info.getBody().trim();
                    if (body.length() > BODY_TRUNCATE_LIMIT) {
                        sb.append(body, 0, BODY_TRUNCATE_LIMIT)
                          .append("\n    ... (본문이 ").append(body.length())
                          .append("자 — 위 ").append(BODY_TRUNCATE_LIMIT).append("자까지만 첨부)\n");
                    } else {
                        sb.append(body).append('\n');
                    }
                }
                sb.append("    → 이 SP 는 이미 존재. CREATE/ALTER 새로 만들지 말 것. 위 파라미터/반환 컬럼 그대로 사용해 호출부만 작성.\n");
            } else {
                sb.append("[✗ 미존재] ").append(info.getProcedureName())
                  .append("\n    → 새 SP 생성 가능 (NEW_NL/NEW_GENERAL 모드 한정) — SQL_DDL 아티팩트로 작성.\n");
            }
        }
        sb.append("⚠ 사용자가 명시한 SP 만 처리. 명시되지 않은 SP (예: 삭제 SP) 를 임의로 추가 생성 금지.\n");
        return sb.toString();
    }

    // ──────────────────────────────────────────────────────────────────
    // 유틸
    // ──────────────────────────────────────────────────────────────────

    private boolean isValidIdentifier(String name) {
        return name != null && !name.isEmpty() && PROC_NAME_PATTERN.matcher(name).matches();
    }
}

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
 * 테이블 메타 조회 — Composer NEW_NL 모드가 사용자가 prompt 에 명시한 TB_* 테이블이
 * 운영 DB(Target MSSQL) 에 이미 존재하는지, 컬럼/PK 가 어떻게 되는지를 LLM 에 전달한다.
 *
 * 정책:
 *   1) 존재 → 기존 Entity 재사용 (DDL 생성 금지)
 *   2) 미존재 → 새 SQL_DDL 아티팩트로 테이블 생성 (NEW_NL/NEW_GENERAL 모드만 허용)
 *
 * DataSource: {@link TargetDataSourceRegistry} 로 targetCd 별 동적 라우팅.
 * Composer 자체 메타 DB(PG) 에는 TB_* 운영 테이블이 없으므로 반드시 Target Operational DB(MSSQL) 에 질의.
 * (2026-05-13 수정 — 이전 버전은 unqualified JdbcTemplate 으로 composer-db PG 만 조회해서 "미존재" 오판 발생.)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SchemaInspectionService {

    private final TargetDataSourceRegistry registry;

    /** 테이블명 정규식 — 안전한 식별자만 허용 (SQL injection 방어) */
    private static final Pattern TABLE_NAME_PATTERN = Pattern.compile("^[A-Za-z_][A-Za-z0-9_]*$");

    /** 자연어 prompt 에서 TB_* 형식 테이블명 추출용 */
    private static final Pattern TABLE_REF_PATTERN = Pattern.compile(
            "\\b(TB_[A-Z][A-Z0-9_]+|tb_[a-z][a-z0-9_]+)\\b");

    // ──────────────────────────────────────────────────────────────────
    // 단일 테이블 lookup
    // ──────────────────────────────────────────────────────────────────

    /**
     * 테이블 존재 여부만 빠르게 확인.
     * @param targetCd  Target System 코드 (null/blank 이면 false 반환)
     * @param tableName 대소문자 무관
     */
    public boolean tableExists(String targetCd, String tableName) {
        if (!isValidIdentifier(tableName)) return false;
        JdbcTemplate jdbc = registry.getJdbcTemplate(targetCd);
        if (jdbc == null) return false;
        try {
            Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES" +
                " WHERE TABLE_TYPE IN ('BASE TABLE', 'VIEW') AND LOWER(TABLE_NAME) = LOWER(?)",
                Integer.class, tableName);
            return count != null && count > 0;
        } catch (DataAccessException e) {
            log.warn("tableExists 조회 실패 (target={}, table={}): {}", targetCd, tableName, e.getMessage());
            return false;
        }
    }

    /**
     * 테이블 메타데이터 (존재 여부 + 컬럼 + PK) 한 번에.
     * 행수 추정은 dialect 차이로 생략 — 필요 시 후속 보강.
     */
    public TableInfo getTableInfo(String targetCd, String tableName) {
        TableInfo.TableInfoBuilder b = TableInfo.builder()
                .tableName(tableName)
                .columns(Collections.emptyList())
                .primaryKeyColumns(Collections.emptyList());

        if (!isValidIdentifier(tableName)) {
            return b.exists(false).build();
        }
        JdbcTemplate jdbc = registry.getJdbcTemplate(targetCd);
        if (jdbc == null) {
            log.debug("target {} JdbcTemplate 미사용 — 테이블 lookup 스킵", targetCd);
            return b.exists(false).build();
        }

        // 1) 스키마 + 존재 여부
        List<String> schemas = jdbc.queryForList(
            "SELECT TABLE_SCHEMA FROM INFORMATION_SCHEMA.TABLES" +
            " WHERE LOWER(TABLE_NAME) = LOWER(?) AND TABLE_TYPE IN ('BASE TABLE', 'VIEW')",
            String.class, tableName);
        if (schemas.isEmpty()) {
            return b.exists(false).build();
        }
        String schema = schemas.get(0);
        b.tableSchema(schema).exists(true);

        // 2) 컬럼
        //   MSSQL INFORMATION_SCHEMA.COLUMNS 의 NUMERIC_PRECISION/SCALE 은 tinyint(Byte),
        //   CHARACTER_MAXIMUM_LENGTH 는 int 지만 일부 케이스 Short — (Integer) 직접 캐스트 ClassCastException.
        //   Number 경유로 안전 변환.
        List<ColumnInfo> columns = jdbc.query(
            "SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH," +
            "       NUMERIC_PRECISION, NUMERIC_SCALE, IS_NULLABLE," +
            "       COLUMN_DEFAULT, ORDINAL_POSITION" +
            "  FROM INFORMATION_SCHEMA.COLUMNS" +
            " WHERE LOWER(TABLE_SCHEMA) = LOWER(?) AND LOWER(TABLE_NAME) = LOWER(?)" +
            " ORDER BY ORDINAL_POSITION",
            (rs, rowNum) -> {
                ColumnInfo c = new ColumnInfo();
                c.setName(rs.getString("COLUMN_NAME"));
                c.setDataType(rs.getString("DATA_TYPE"));
                c.setCharacterMaximumLength(asInteger(rs.getObject("CHARACTER_MAXIMUM_LENGTH")));
                c.setNumericPrecision(asInteger(rs.getObject("NUMERIC_PRECISION")));
                c.setNumericScale(asInteger(rs.getObject("NUMERIC_SCALE")));
                c.setIsNullable(rs.getString("IS_NULLABLE"));
                c.setColumnDefault(rs.getString("COLUMN_DEFAULT"));
                c.setOrdinalPosition(asInteger(rs.getObject("ORDINAL_POSITION")));
                return c;
            },
            schema, tableName);

        // 3) PK 컬럼
        List<String> pkColumns = jdbc.queryForList(
            "SELECT kcu.COLUMN_NAME" +
            "  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc" +
            "  JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu" +
            "    ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME" +
            "   AND tc.TABLE_SCHEMA   = kcu.TABLE_SCHEMA" +
            "   AND tc.TABLE_NAME     = kcu.TABLE_NAME" +
            " WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'" +
            "   AND LOWER(tc.TABLE_SCHEMA) = LOWER(?) AND LOWER(tc.TABLE_NAME) = LOWER(?)" +
            " ORDER BY kcu.ORDINAL_POSITION",
            String.class, schema, tableName);

        // PK 플래그를 컬럼 리스트에 마킹
        for (ColumnInfo c : columns) {
            if (pkColumns.contains(c.getName())) c.setPrimaryKey(true);
        }
        b.columns(columns).primaryKeyColumns(pkColumns);

        return b.build();
    }

    // ──────────────────────────────────────────────────────────────────
    // 배치 lookup
    // ──────────────────────────────────────────────────────────────────

    public Map<String, TableInfo> getMultipleTables(String targetCd, List<String> tableNames) {
        Map<String, TableInfo> out = new LinkedHashMap<>();
        if (tableNames == null) return out;
        for (String name : tableNames) {
            if (name == null) continue;
            String trimmed = name.trim();
            if (trimmed.isEmpty()) continue;
            String key = trimmed.toUpperCase();
            if (out.containsKey(key)) continue;
            out.put(key, getTableInfo(targetCd, trimmed));
        }
        return out;
    }

    /**
     * 자연어 prompt 에서 TB_* / tb_* 패턴 테이블명을 grep 으로 추출 후 lookup.
     */
    public Map<String, TableInfo> lookupTablesInText(String targetCd, String text) {
        if (text == null || text.isEmpty()) return Collections.emptyMap();
        return getMultipleTables(targetCd, extractTableNamesFromText(text));
    }

    // ──────────────────────────────────────────────────────────────────
    // 유틸
    // ──────────────────────────────────────────────────────────────────

    /** SQL injection 방어 — 안전한 식별자만 허용 ([A-Za-z_][A-Za-z0-9_]*) */
    private boolean isValidIdentifier(String name) {
        return name != null && !name.isEmpty() && TABLE_NAME_PATTERN.matcher(name).matches();
    }

    /**
     * JDBC ResultSet 의 numeric 컬럼을 Integer 로 안전 변환.
     * MSSQL INFORMATION_SCHEMA 의 NUMERIC_PRECISION/SCALE 은 tinyint(Byte) 로 와서
     * (Integer) 직접 캐스트는 ClassCastException — Number 경유로 처리.
     */
    private static Integer asInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.intValue();
        return null;
    }

    /**
     * lookup 결과를 LLM prompt 컨텍스트용 사람 친화 텍스트 블록으로 직렬화.
     */
    public String formatLookupResultForPrompt(Map<String, TableInfo> lookup) {
        if (lookup == null || lookup.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        sb.append("=== 자동 테이블 존재 여부 확인 (Target Operational DB · INFORMATION_SCHEMA 조회) ===\n");
        for (Map.Entry<String, TableInfo> e : lookup.entrySet()) {
            TableInfo info = e.getValue();
            if (info.isExists()) {
                sb.append("[✓ 존재] ").append(info.getTableSchema()).append('.').append(info.getTableName());
                sb.append("\n");
                List<ColumnInfo> cols = info.getColumns();
                if (cols != null) {
                    for (ColumnInfo c : cols) {
                        sb.append("    ").append(c.getName())
                          .append("  ").append(c.getDataType());
                        if (c.getCharacterMaximumLength() != null) {
                            sb.append('(').append(c.getCharacterMaximumLength() == -1 ? "MAX"
                                                  : c.getCharacterMaximumLength()).append(')');
                        } else if (c.getNumericPrecision() != null) {
                            sb.append('(').append(c.getNumericPrecision());
                            if (c.getNumericScale() != null) sb.append(',').append(c.getNumericScale());
                            sb.append(')');
                        }
                        if ("NO".equals(c.getIsNullable())) sb.append(" NOT NULL");
                        if (c.isPrimaryKey()) sb.append("  [PK]");
                        if (c.getColumnDefault() != null) sb.append("  DEFAULT ").append(c.getColumnDefault());
                        sb.append('\n');
                    }
                }
                sb.append("    → 이 테이블은 이미 존재 — 새 DDL 생성 금지. 기존 컬럼으로 Entity 매핑.\n");
            } else {
                sb.append("[✗ 미존재] ").append(info.getTableName())
                  .append("\n    → 새 테이블 DDL 필요 (NEW_NL/NEW_GENERAL 모드만 허용) — SQL_DDL 아티팩트로 생성.\n");
            }
        }
        return sb.toString();
    }

    /**
     * 사용자 prompt 에서 테이블명 후보를 추출.
     */
    public List<String> extractTableNamesFromText(String text) {
        if (text == null || text.isEmpty()) return Collections.emptyList();
        Matcher m = TABLE_REF_PATTERN.matcher(text);
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
    // 하위 호환 — targetCd 없이 호출하던 옛 경로 (composer-db PG 에는 TB_* 없음 → 항상 미존재)
    // TODO: ArtifactApplyService.checkTableNameCollisions ·
    //       ComposerService.enrichUserContentWithTableLookup 에 sessionId→targetCd 매핑 추가 후 제거.
    // ──────────────────────────────────────────────────────────────────

    /** @deprecated targetCd 가 없으면 항상 false. {@link #tableExists(String, String)} 사용. */
    @Deprecated
    public boolean tableExists(String tableName) {
        return tableExists(null, tableName);
    }

    /** @deprecated targetCd 가 없으면 항상 exists=false. {@link #getTableInfo(String, String)} 사용. */
    @Deprecated
    public TableInfo getTableInfo(String tableName) {
        return getTableInfo(null, tableName);
    }

    /** @deprecated targetCd 가 없으면 빈 결과. {@link #getMultipleTables(String, List)} 사용. */
    @Deprecated
    public Map<String, TableInfo> getMultipleTables(List<String> tableNames) {
        return getMultipleTables(null, tableNames);
    }

    /** @deprecated targetCd 가 없으면 빈 결과. {@link #lookupTablesInText(String, String)} 사용. */
    @Deprecated
    public Map<String, TableInfo> lookupTablesInText(String text) {
        return lookupTablesInText(null, text);
    }
}

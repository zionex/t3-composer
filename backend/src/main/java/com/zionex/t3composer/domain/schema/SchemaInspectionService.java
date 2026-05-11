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

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * MSSQL INFORMATION_SCHEMA / sys.* 메타테이블을 조회해 Composer NEW_NL 모드가
 * 사용자가 입력한 테이블의 존재 여부 + 컬럼 메타데이터를 받을 수 있게 한다.
 *
 * 정책: 신규 화면 생성 시 사용자가 자연어 prompt 에 언급한 모든 TB_* 테이블에 대해
 *   1) 존재 → 기존 Entity 재사용 (DDL 생성 금지)
 *   2) 미존재 → 새 SQL_DDL 아티팩트로 테이블 생성 (NEW_NL/NEW_GENERAL 모드만 허용)
 *
 * DataSource 는 Spring Boot 가 application.yaml 의 메인 DB 접속 정보를 자동 인젝션 —
 * Composer 는 별도 접속 정보 관리 안 함 (T3SMARTSCM.dbo).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SchemaInspectionService {

    private final JdbcTemplate jdbcTemplate;

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
     * @param tableName 대소문자 무관 (MSSQL 의 기본 collation 은 대소문자 구분 X)
     * @return true = 존재
     */
    public boolean tableExists(String tableName) {
        if (!isValidIdentifier(tableName)) return false;
        try {
            // PG 호환: 식별자 비교를 case-insensitive 하게. PG 의 unquoted 식별자는 lowercase 로 저장됨.
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES" +
                " WHERE TABLE_TYPE IN ('BASE TABLE', 'VIEW') AND LOWER(TABLE_NAME) = LOWER(?)",
                Integer.class, tableName);
            return count != null && count > 0;
        } catch (DataAccessException e) {
            log.warn("tableExists 조회 실패 ({}): {}", tableName, e.getMessage());
            return false;
        }
    }

    /**
     * 테이블 메타데이터 (존재 여부 + 컬럼 + PK + 행 수 추정) 한 번에.
     */
    public TableInfo getTableInfo(String tableName) {
        TableInfo.TableInfoBuilder b = TableInfo.builder()
                .tableName(tableName)
                .columns(Collections.emptyList())
                .primaryKeyColumns(Collections.emptyList());

        if (!isValidIdentifier(tableName)) {
            return b.exists(false).build();
        }

        // 1) 스키마 + 존재 여부
        String schema;
        try {
            schema = jdbcTemplate.queryForObject(
                "SELECT TABLE_SCHEMA FROM INFORMATION_SCHEMA.TABLES" +
                " WHERE LOWER(TABLE_NAME) = LOWER(?) AND TABLE_TYPE IN ('BASE TABLE', 'VIEW')" +
                " LIMIT 1",
                String.class, tableName);
        } catch (DataAccessException e) {
            schema = null;
        }
        if (schema == null) {
            return b.exists(false).build();
        }
        b.tableSchema(schema).exists(true);

        // 2) 컬럼
        List<ColumnInfo> columns = jdbcTemplate.query(
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
                c.setCharacterMaximumLength((Integer) rs.getObject("CHARACTER_MAXIMUM_LENGTH"));
                c.setNumericPrecision((Integer) rs.getObject("NUMERIC_PRECISION"));
                c.setNumericScale((Integer) rs.getObject("NUMERIC_SCALE"));
                c.setIsNullable(rs.getString("IS_NULLABLE"));
                c.setColumnDefault(rs.getString("COLUMN_DEFAULT"));
                c.setOrdinalPosition((Integer) rs.getObject("ORDINAL_POSITION"));
                return c;
            },
            schema, tableName);

        // 3) PK 컬럼
        List<String> pkColumns = jdbcTemplate.queryForList(
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

        // 4) 행 수 추정 (PG: pg_class.reltuples — Composer 자체 DB(PG) 의 estimate)
        // 추후 Phase 4 에서 Target dialect 별 분기 — 지금은 PG 만.
        try {
            Long rowCount = jdbcTemplate.queryForObject(
                "SELECT COALESCE(c.reltuples::bigint, 0)" +
                "  FROM pg_class c" +
                "  JOIN pg_namespace n ON c.relnamespace = n.oid" +
                " WHERE LOWER(n.nspname) = LOWER(?)" +
                "   AND LOWER(c.relname) = LOWER(?)" +
                "   AND c.relkind IN ('r','p')",
                Long.class, schema, tableName);
            b.approximateRowCount(rowCount);
        } catch (DataAccessException e) {
            // VIEW 거나 권한 부족 — 무시
        }

        return b.build();
    }

    // ──────────────────────────────────────────────────────────────────
    // 배치 lookup — Composer 가 prompt 에서 추출한 여러 테이블을 한 번에
    // ──────────────────────────────────────────────────────────────────

    /**
     * 여러 테이블 동시 조회. 입력 순서 유지된 LinkedHashMap.
     */
    public Map<String, TableInfo> getMultipleTables(List<String> tableNames) {
        Map<String, TableInfo> out = new LinkedHashMap<>();
        if (tableNames == null) return out;
        for (String name : tableNames) {
            if (name == null) continue;
            String trimmed = name.trim();
            if (trimmed.isEmpty()) continue;
            // 중복 제거 (대문자 정규화)
            String key = trimmed.toUpperCase();
            if (out.containsKey(key)) continue;
            out.put(key, getTableInfo(trimmed));
        }
        return out;
    }

    /**
     * 자연어 prompt 에서 TB_* / tb_* 패턴 테이블명을 grep 으로 추출 후 lookup.
     * Composer NEW_NL 모드의 자동 분석 진입점.
     */
    public Map<String, TableInfo> lookupTablesInText(String text) {
        if (text == null || text.isEmpty()) return Collections.emptyMap();
        Matcher m = TABLE_REF_PATTERN.matcher(text);
        List<String> found = new ArrayList<>();
        while (m.find()) {
            String name = m.group(1);
            if (!found.contains(name)) found.add(name);
        }
        return getMultipleTables(found);
    }

    // ──────────────────────────────────────────────────────────────────
    // 유틸
    // ──────────────────────────────────────────────────────────────────

    /** SQL injection 방어 — 안전한 식별자만 허용 ([A-Za-z_][A-Za-z0-9_]*) */
    private boolean isValidIdentifier(String name) {
        return name != null && !name.isEmpty() && TABLE_NAME_PATTERN.matcher(name).matches();
    }

    /**
     * lookup 결과를 LLM prompt 컨텍스트용 사람 친화 텍스트 블록으로 직렬화.
     * 사용자 prompt 에 첨부되어 LLM 이 "어떤 테이블이 이미 존재하는지" 한눈에 파악.
     */
    public String formatLookupResultForPrompt(Map<String, TableInfo> lookup) {
        if (lookup == null || lookup.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        sb.append("=== 자동 테이블 존재 여부 확인 (T3SMARTSCM.dbo · INFORMATION_SCHEMA 조회) ===\n");
        for (Map.Entry<String, TableInfo> e : lookup.entrySet()) {
            TableInfo info = e.getValue();
            if (info.isExists()) {
                sb.append("[✓ 존재] ").append(info.getTableSchema()).append('.').append(info.getTableName());
                if (info.getApproximateRowCount() != null) {
                    sb.append(" (~").append(info.getApproximateRowCount()).append(" rows)");
                }
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
     * 사용자 prompt 에서 테이블명 후보를 추출. (자연어 분석 보조용 — 외부에서도 호출 가능)
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
}

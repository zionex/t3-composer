package com.zionex.t3composer.domain.ontology.service;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.sql.DataSource;

import org.springframework.stereotype.Service;

import com.zionex.t3composer.config.TargetDataSourceRegistry;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Ontology Q&A 의 Answer SQL 을 Target DB 에서 안전하게 실행해 결과를 미리보기.
 * SELECT/WITH 만 허용 · TOP 100 자동 주입(MSSQL) · query timeout 10초 · 결과 100행 cap.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OntologySqlPreviewService {

    private final TargetDataSourceRegistry targetRegistry;

    /** 백엔드 메모리/네트워크 폭발 방지 절대 상한 — 사용자 쿼리에 TOP/WHERE 가 없을 때만 발화. 일반 사용에서는 안 닿음. */
    private static final int MAX_ROWS = 5000;
    private static final int QUERY_TIMEOUT_SEC = 10;
    private static final int MAX_COLUMNS = 200;
    private static final int MAX_CELL_CHARS = 1024;

    public PreviewResult preview(String rawSql, String targetCd, String dbType, String userId) {
        // 1) 정적 검증
        GuardResult g = SqlGuard.check(rawSql);
        if (!g.ok) {
            throw new PreviewException("BLOCKED", g.message);
        }

        // 2) Target DataSource 획득 (폴백 없음 — TargetPathResolver/§13.7 원칙)
        DataSource ds = targetRegistry.getDataSource(targetCd);
        if (ds == null) {
            throw new PreviewException("TARGET_NOT_CONFIGURED",
                "선택된 Target(" + targetCd + ")의 DB 연결정보가 없거나 연결에 실패했습니다.");
        }

        // 3) SQL 변환 없음 — 사용자가 작성한 SQL 그대로 실행.
        //    행 제어는 사용자가 자기 쿼리에 TOP/WHERE 로 직접. 백엔드는 절대 상한(MAX_ROWS) 만 안전망.
        String sqlToRun = g.normalized;

        String shortSql = sqlToRun.length() > 200 ? sqlToRun.substring(0, 200) + "..." : sqlToRun;
        log.info("[OntologySqlPreview] target={} user={} dbType={} sql={}",
            targetCd, userId, dbType, shortSql.replaceAll("\\s+", " "));

        // 4) 실행
        long t0 = System.currentTimeMillis();
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sqlToRun,
                ResultSet.TYPE_FORWARD_ONLY, ResultSet.CONCUR_READ_ONLY)) {

            ps.setQueryTimeout(QUERY_TIMEOUT_SEC);
            ps.setFetchSize(MAX_ROWS + 1);

            try (ResultSet rs = ps.executeQuery()) {
                ResultSetMetaData md = rs.getMetaData();
                int colCount = md.getColumnCount();
                if (colCount > MAX_COLUMNS) {
                    throw new PreviewException("TOO_MANY_COLUMNS",
                        "컬럼 수 " + colCount + " 가 최대(" + MAX_COLUMNS + ")를 초과합니다.");
                }
                List<String> columns = new ArrayList<>(colCount);
                List<String> sqlTypes = new ArrayList<>(colCount);
                for (int i = 1; i <= colCount; i++) {
                    String label = md.getColumnLabel(i);
                    if (label == null || label.isEmpty()) label = md.getColumnName(i);
                    columns.add(label);
                    sqlTypes.add(md.getColumnTypeName(i));
                }

                List<Map<String, Object>> rows = new ArrayList<>();
                boolean truncated = false;
                int read = 0;
                while (rs.next()) {
                    if (read >= MAX_ROWS) {
                        truncated = true;
                        break;
                    }
                    Map<String, Object> row = new LinkedHashMap<>();
                    for (int i = 1; i <= colCount; i++) {
                        Object v = rs.getObject(i);
                        row.put(columns.get(i - 1), serializeCell(v));
                    }
                    rows.add(row);
                    read++;
                }

                long elapsed = System.currentTimeMillis() - t0;

                PreviewResult result = new PreviewResult();
                result.columns = columns;
                result.sqlTypes = sqlTypes;
                result.rows = rows;
                result.rowCount = rows.size();
                result.elapsedMs = elapsed;
                result.truncated = truncated;
                result.topInjected = false;
                result.executedSql = sqlToRun;
                return result;
            }
        } catch (PreviewException e) {
            throw e;
        } catch (SQLException e) {
            long elapsed = System.currentTimeMillis() - t0;
            String msg = e.getMessage() == null ? "" : e.getMessage();
            String code = "SQL_ERROR";
            // MSSQL JDBC timeout
            if (e.getSQLState() != null && (e.getSQLState().startsWith("HYT") || e.getSQLState().startsWith("57014"))) {
                code = "QUERY_TIMEOUT";
            } else if (msg.toLowerCase(Locale.ROOT).contains("timeout") || msg.toLowerCase(Locale.ROOT).contains("timed out")) {
                code = "QUERY_TIMEOUT";
            }
            log.warn("[OntologySqlPreview] SQL error ({}ms) target={} code={} sqlState={} msg={}",
                elapsed, targetCd, code, e.getSQLState(), msg);
            throw new PreviewException(code, msg.isBlank() ? "SQL 실행 오류" : msg, e.getSQLState());
        } catch (RuntimeException e) {
            throw new PreviewException("RUNTIME_ERROR",
                e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage());
        }
    }

    private static Object serializeCell(Object v) {
        if (v == null) return null;
        if (v instanceof byte[] b) return "(binary, " + b.length + " bytes)";
        if (v instanceof Timestamp ts) return ts.toLocalDateTime().toString();
        if (v instanceof java.sql.Date d) return d.toLocalDate().toString();
        if (v instanceof java.sql.Time t) return t.toLocalTime().toString();
        if (v instanceof LocalDateTime ldt) return ldt.toString();
        if (v instanceof LocalDate ld) return ld.toString();
        if (v instanceof Number || v instanceof Boolean) return v;
        String s = v.toString();
        if (s.length() > MAX_CELL_CHARS) {
            return s.substring(0, MAX_CELL_CHARS) + "...(" + s.length() + " chars)";
        }
        return s;
    }

    // ─────────────────────── SqlGuard ───────────────────────

    static final class GuardResult {
        boolean ok;
        String code;       // BLOCKED 사유 코드
        String message;
        String normalized; // 주석/끝 세미콜론 제거한 SQL

        static GuardResult fail(String code, String msg) {
            GuardResult r = new GuardResult();
            r.ok = false; r.code = code; r.message = msg;
            return r;
        }
        static GuardResult ok(String normalized) {
            GuardResult r = new GuardResult();
            r.ok = true; r.normalized = normalized;
            return r;
        }
    }

    static final class SqlGuard {
        // 첫 키워드 허용
        private static final Pattern FIRST_KEYWORD = Pattern.compile("^\\s*(SELECT|WITH)\\b", Pattern.CASE_INSENSITIVE);
        // 위험 키워드 (토큰 경계)
        private static final String[] BLOCKED_KEYWORDS = {
            "INSERT", "UPDATE", "DELETE", "MERGE", "TRUNCATE", "DROP", "ALTER", "CREATE",
            "GRANT", "REVOKE", "EXEC", "EXECUTE", "CALL", "XP_CMDSHELL", "OPENROWSET",
            "OPENQUERY", "BULK"
        };

        static GuardResult check(String rawSql) {
            if (rawSql == null || rawSql.isBlank()) {
                return GuardResult.fail("EMPTY", "SQL 이 비어있습니다.");
            }
            String stripped = stripCommentsAndStrings(rawSql);    // 검증용 (문자열·주석 제거)
            String trimmed = rawSql.trim();
            // 끝 세미콜론 1개 허용 — 그 외에는 multi-statement 로 간주
            String normalizedSrc = trimmed;
            if (normalizedSrc.endsWith(";")) {
                normalizedSrc = normalizedSrc.substring(0, normalizedSrc.length() - 1).trim();
            }
            // 검증용 stripped 에서도 같은 처리
            String strippedCore = stripped.trim();
            if (strippedCore.endsWith(";")) {
                strippedCore = strippedCore.substring(0, strippedCore.length() - 1).trim();
            }
            if (strippedCore.contains(";")) {
                return GuardResult.fail("MULTI_STATEMENT", "여러 문장(세미콜론 구분)은 허용되지 않습니다.");
            }

            // 첫 키워드 검사 — strippedCore 기준
            Matcher m = FIRST_KEYWORD.matcher(strippedCore);
            if (!m.find()) {
                return GuardResult.fail("NOT_SELECT", "SELECT 또는 WITH 로 시작하는 쿼리만 허용됩니다.");
            }

            // 위험 키워드 — 첫 키워드(WITH/SELECT) 자체 제외하고 검사
            String upper = " " + strippedCore.toUpperCase(Locale.ROOT) + " ";
            for (String kw : BLOCKED_KEYWORDS) {
                String pat = "\\b" + kw + "\\b";
                if (Pattern.compile(pat).matcher(upper).find()) {
                    return GuardResult.fail("BLOCKED_KEYWORD",
                        kw + " 키워드는 허용되지 않습니다.");
                }
            }
            // SELECT INTO 별도 차단 — 위 BLOCKED_KEYWORDS 의 INSERT 와 다른 유형
            if (Pattern.compile("\\bSELECT\\b[^;]*\\bINTO\\b", Pattern.CASE_INSENSITIVE).matcher(strippedCore).find()) {
                return GuardResult.fail("BLOCKED_INTO", "SELECT INTO 는 허용되지 않습니다.");
            }

            return GuardResult.ok(normalizedSrc);
        }

        /**
         * 문자열/주석 안의 키워드가 검증에 영향주지 않도록, 검증 단계에서만 단순 마스킹.
         * 문자열은 'X' 로, 주석은 공백으로 치환.
         */
        private static String stripCommentsAndStrings(String s) {
            StringBuilder out = new StringBuilder(s.length());
            int i = 0; int n = s.length();
            while (i < n) {
                char c = s.charAt(i);
                // 라인 주석
                if (c == '-' && i + 1 < n && s.charAt(i + 1) == '-') {
                    while (i < n && s.charAt(i) != '\n') { out.append(' '); i++; }
                    continue;
                }
                // 블록 주석
                if (c == '/' && i + 1 < n && s.charAt(i + 1) == '*') {
                    out.append("  ");
                    i += 2;
                    while (i + 1 < n && !(s.charAt(i) == '*' && s.charAt(i + 1) == '/')) {
                        out.append(' ');
                        i++;
                    }
                    if (i + 1 < n) { out.append("  "); i += 2; }
                    continue;
                }
                // 작은따옴표 문자열 — '' escape 처리
                if (c == '\'') {
                    out.append('\'');
                    i++;
                    while (i < n) {
                        char q = s.charAt(i);
                        if (q == '\'') {
                            if (i + 1 < n && s.charAt(i + 1) == '\'') { out.append("XX"); i += 2; continue; }
                            out.append('\''); i++;
                            break;
                        }
                        out.append('X'); i++;
                    }
                    continue;
                }
                // 큰따옴표 식별자 (MSSQL/PG identifier) — 그대로 유지하되 내부 키워드 영향 안 받게 'X' 치환
                if (c == '"') {
                    out.append('"'); i++;
                    while (i < n && s.charAt(i) != '"') { out.append('X'); i++; }
                    if (i < n) { out.append('"'); i++; }
                    continue;
                }
                // MSSQL [ident]
                if (c == '[') {
                    out.append('['); i++;
                    while (i < n && s.charAt(i) != ']') { out.append('X'); i++; }
                    if (i < n) { out.append(']'); i++; }
                    continue;
                }
                out.append(c);
                i++;
            }
            return out.toString();
        }

        /** outer SELECT 에 TOP N 자동 주입 (MSSQL). 이미 TOP/OFFSET 있으면 그대로. */
        static String injectTopMssql(String sql, int n) {
            // 이미 TOP 또는 OFFSET 보유?
            if (Pattern.compile("\\bTOP\\s*\\(?\\s*\\d", Pattern.CASE_INSENSITIVE).matcher(sql).find()) {
                return sql;
            }
            if (Pattern.compile("\\bOFFSET\\s+\\d+\\s+ROWS\\b", Pattern.CASE_INSENSITIVE).matcher(sql).find()) {
                return sql;
            }
            // WITH ... ) SELECT ... 형태 — 가장 마지막 SELECT 토큰 위치 찾기 (간단 휴리스틱)
            String upper = sql.toUpperCase(Locale.ROOT);
            int idx;
            if (upper.trim().startsWith("WITH")) {
                idx = findOuterSelect(sql, upper);
            } else {
                idx = firstSelectIdx(upper);
            }
            if (idx < 0) return sql; // fallback
            // 'SELECT' 토큰 다음에 ' TOP N ' 삽입
            return sql.substring(0, idx + "SELECT".length()) + " TOP " + n + sql.substring(idx + "SELECT".length());
        }

        private static int firstSelectIdx(String upper) {
            Matcher m = Pattern.compile("\\bSELECT\\b").matcher(upper);
            return m.find() ? m.start() : -1;
        }

        /** WITH ... ) SELECT ... — 괄호 depth 0 에서 등장하는 마지막 SELECT 위치. */
        private static int findOuterSelect(String sql, String upper) {
            int depth = 0;
            int lastTop = -1;
            int i = 0; int n = upper.length();
            while (i < n) {
                char c = upper.charAt(i);
                // skip strings/idents — stripCommentsAndStrings 에서 이미 mask 되었다는 가정 없이 보수적
                if (c == '\'' || c == '"' || c == '[') {
                    char end = (c == '[') ? ']' : c;
                    i++;
                    while (i < n && upper.charAt(i) != end) i++;
                    if (i < n) i++;
                    continue;
                }
                if (c == '(') { depth++; i++; continue; }
                if (c == ')') { depth = Math.max(0, depth - 1); i++; continue; }
                if (depth == 0 && c == 'S' && upper.regionMatches(i, "SELECT", 0, 6)
                        && (i + 6 >= n || !isIdentChar(upper.charAt(i + 6)))
                        && (i == 0 || !isIdentChar(upper.charAt(i - 1)))) {
                    lastTop = i;
                    i += 6; continue;
                }
                i++;
            }
            return lastTop;
        }
        private static boolean isIdentChar(char c) {
            return Character.isLetterOrDigit(c) || c == '_';
        }
    }

    // ─────────────────────── DTO / exception ───────────────────────

    public static class PreviewResult {
        public List<String> columns;
        public List<String> sqlTypes;
        public List<Map<String, Object>> rows;
        public int rowCount;
        public long elapsedMs;
        public boolean truncated;
        public boolean topInjected;
        public String executedSql;
    }

    public static class PreviewException extends RuntimeException {
        public final String code;
        public final String sqlState;
        public PreviewException(String code, String message) { this(code, message, null); }
        public PreviewException(String code, String message, String sqlState) {
            super(message);
            this.code = code;
            this.sqlState = sqlState;
        }
    }
}

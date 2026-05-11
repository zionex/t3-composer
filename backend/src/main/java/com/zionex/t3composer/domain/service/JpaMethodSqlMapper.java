package com.zionex.t3composer.domain.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Spring Data JPA Repository 의 method-name 으로부터 예상 SQL 추론.
 *
 * 지원:
 *   · finder / exists / count / delete prefix
 *   · And / Or 조합
 *   · Containing / StartingWith / EndingWith / Between / GreaterThan / LessThan / Not / In / IsNull / IsNotNull / Like / IgnoreCase
 *   · OrderBy ...
 *   · @Query("...") 어노테이션 — 그 안의 SQL/JPQL 그대로 추출
 *
 * 한계: JPQL ↔ 실제 SQL 100% 일치 보장 X (entity 매핑/Specification 미반영). 사용자가
 * "이런 형태의 쿼리가 발사된다" 는 참고용. 정확한 SQL 은 spring.jpa.show-sql 로 확인.
 */
@Slf4j
@Component
public class JpaMethodSqlMapper {

    /** Repository interface 의 method 선언 매칭 — 단순 한 줄 메서드만 (@Query 는 별도 처리) */
    private static final Pattern METHOD_LINE = Pattern.compile(
        "^\\s*(?:public\\s+|default\\s+)?" +                  // modifier (optional)
        "(?:<[^>]+>\\s+)?" +                                   // generic type (optional)
        "([A-Za-z<>\\[\\],?\\s\\.]+?)\\s+" +                   // return type (lazy)
        "([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\(([^)]*)\\)\\s*;",      // name(params);
        Pattern.MULTILINE);

    /** @Query("...") 어노테이션 매칭 — 그 다음 줄의 메서드명까지 함께 추출 */
    private static final Pattern QUERY_ANNOTATION = Pattern.compile(
        "@Query\\s*\\(\\s*(?:value\\s*=\\s*)?[\"]([^\"]+)[\"]" +
        "(?:\\s*,\\s*nativeQuery\\s*=\\s*(true|false))?" +
        "[^)]*\\)\\s*[\\r\\n]+" +
        "\\s*(?:public\\s+)?(?:<[^>]+>\\s+)?[A-Za-z<>\\[\\],?\\s\\.]+?\\s+" +
        "([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\(",
        Pattern.MULTILINE);

    /** @Table(name="...") 추출 */
    private static final Pattern TABLE_NAME = Pattern.compile(
        "@Table\\s*\\(\\s*(?:[^)]*?\\bname\\s*=\\s*)?\"([^\"]+)\"");

    /**
     * @Column(name="COL_NAME") private <Type> fieldName;  — 같은 line 또는 여러 line.
     * group 1 = column name, group 2 = field type (참고용), group 3 = field name.
     */
    private static final Pattern COLUMN_FIELD = Pattern.compile(
        "@Column\\s*\\([^)]*?\\bname\\s*=\\s*\"([^\"]+)\"[^)]*\\)" +
        "\\s*(?:@[\\w.]+(?:\\([^)]*\\))?\\s*)*" +                  // skip extra annotations
        "(?:private|public|protected)?\\s*(?:final\\s+)?" +
        "([A-Za-z][A-Za-z0-9_<>?,\\s]*)\\s+" +
        "([a-zA-Z_][a-zA-Z0-9_]*)\\s*[=;]");

    /**
     * Repository 소스 + 동반 Entity 소스를 받아 method → SQL 매핑 리스트 반환.
     *
     * 결과 entry:
     *   { methodName, returnType, parameters, inferredSql, conditions[], source: 'name'|'@Query'|'native' }
     */
    public List<Map<String, Object>> inferAll(String repositorySource, String entitySource) {
        List<Map<String, Object>> out = new ArrayList<>();
        if (repositorySource == null || repositorySource.isBlank()) return out;

        String tableName  = extractTableName(entitySource);
        Map<String, String> fieldToColumn = extractFieldColumnMap(entitySource);
        String idColumn   = fieldToColumn.getOrDefault("id", "ID");
        String columnList = String.join(", ", new java.util.LinkedHashSet<>(fieldToColumn.values()));
        if (columnList.isBlank()) columnList = "*";

        // 1) @Query 메서드 우선
        java.util.Set<String> handledNames = new java.util.HashSet<>();
        Matcher qm = QUERY_ANNOTATION.matcher(repositorySource);
        while (qm.find()) {
            String query  = qm.group(1).trim();
            String native_= qm.group(2);
            String mname  = qm.group(3);
            Map<String, Object> e = new LinkedHashMap<>();
            e.put("methodName",  mname);
            e.put("inferredSql", query);
            e.put("source",      "true".equalsIgnoreCase(native_) ? "@Query(nativeQuery=true)" : "@Query(JPQL)");
            out.add(e);
            handledNames.add(mname);
        }

        // 2) method-name 기반 finder 들 — Entity 의 실제 @Column(name=...) 매핑으로 정확한 컬럼명 사용
        Matcher mm = METHOD_LINE.matcher(repositorySource);
        while (mm.find()) {
            String returnType = mm.group(1).trim();
            String mname      = mm.group(2);
            String params     = mm.group(3).trim();
            if (handledNames.contains(mname)) continue;
            if (isObjectInherited(mname)) continue;

            String sql = inferFromMethodName(mname, params, tableName, fieldToColumn, columnList);
            if (sql == null) continue;

            Map<String, Object> e = new LinkedHashMap<>();
            e.put("methodName",  mname);
            e.put("returnType",  returnType);
            e.put("parameters",  params);
            e.put("inferredSql", sql);
            e.put("source",      "method-name");
            out.add(e);
        }

        // 3) JpaRepository 가 제공하는 기본 CRUD — 실제 컬럼 리스트로 출력
        if (out.stream().noneMatch((e) -> "findAll".equals(e.get("methodName")))
            && repositorySource.contains("JpaRepository")) {
            String tbl = tableNameOrFallback(tableName);
            out.add(stockMethod("findAll",   "List<T> findAll()",
                "SELECT " + columnList + " FROM " + tbl));
            out.add(stockMethod("findById",  "Optional<T> findById(ID id)",
                "SELECT " + columnList + " FROM " + tbl + " WHERE " + idColumn + " = ?"));
            // 저장 — INSERT 와 UPDATE 두 케이스 모두 보임
            String insertCols   = columnList;
            String placeholders = repeat("?", fieldToColumn.size(), ", ");
            String updateSets   = fieldToColumn.entrySet().stream()
                .filter((en) -> !"id".equals(en.getKey()))
                .map((en) -> en.getValue() + " = ?")
                .collect(java.util.stream.Collectors.joining(", "));
            out.add(stockMethod("save (INSERT)", "T save(T entity)  /* id 가 비어있거나 새 entity */",
                "INSERT INTO " + tbl + " (" + insertCols + ") VALUES (" + placeholders + ")"));
            out.add(stockMethod("save (UPDATE)", "T save(T entity)  /* id 존재 + 기존 row 있음 */",
                "UPDATE " + tbl + " SET " + (updateSets.isBlank() ? "<columns>" : updateSets) +
                " WHERE " + idColumn + " = ?"));
            out.add(stockMethod("deleteById","void deleteById(ID id)",
                "DELETE FROM " + tbl + " WHERE " + idColumn + " = ?"));
        }

        return out;
    }

    private static String repeat(String s, int n, String sep) {
        if (n <= 0) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            if (i > 0) sb.append(sep);
            sb.append(s);
        }
        return sb.toString();
    }

    /** Entity 소스에서 fieldName → COLUMN_NAME 매핑 추출 (@Column(name=...)). */
    static Map<String, String> extractFieldColumnMap(String entitySource) {
        Map<String, String> out = new LinkedHashMap<>();
        if (entitySource == null) return out;
        Matcher m = COLUMN_FIELD.matcher(entitySource);
        while (m.find()) {
            String column = m.group(1);
            String field  = m.group(3);
            if (field != null && column != null) out.put(field, column);
        }
        return out;
    }

    private Map<String, Object> stockMethod(String name, String sig, String sql) {
        Map<String, Object> e = new LinkedHashMap<>();
        e.put("methodName",  name);
        e.put("parameters",  sig);
        e.put("inferredSql", sql);
        e.put("source",      "JpaRepository-stock");
        return e;
    }

    private static String tableNameOrFallback(String t) {
        return (t == null || t.isBlank()) ? "<TABLE>" : t;
    }

    private static String extractTableName(String entitySource) {
        if (entitySource == null) return null;
        Matcher m = TABLE_NAME.matcher(entitySource);
        return m.find() ? m.group(1) : null;
    }

    /**
     * 메서드 이름에서 prefix + properties + conditions + orderBy 분리해 SQL 생성.
     * 예) findByDisplayNameContaining → SELECT * FROM ... WHERE display_name LIKE %?%
     *     existsByUsernameAndUseYn   → SELECT COUNT(*) > 0 FROM ... WHERE username=? AND use_yn=?
     *     deleteByCreatedDttmBefore  → DELETE FROM ... WHERE created_dttm < ?
     */
    static String inferFromMethodName(String methodName, String paramsStr, String tableName,
                                       Map<String, String> fieldToColumn, String columnList) {
        if (methodName == null) return null;
        String tbl = tableNameOrFallback(tableName);
        String cols = (columnList == null || columnList.isBlank()) ? "*" : columnList;

        Action action = detectAction(methodName);
        if (action == null) return null;

        String rest = methodName.substring(action.prefix.length());
        String[] split = rest.split("OrderBy", 2);
        String whereExpr = split[0];
        String orderBy   = split.length > 1 ? split[1] : "";

        List<String> conditions = parseConditions(whereExpr, fieldToColumn);
        String whereSql = conditions.isEmpty() ? "" : " WHERE " + String.join(" AND ", conditions);
        String orderSql = orderBy.isEmpty() ? "" : " ORDER BY " + parseOrderBy(orderBy, fieldToColumn);

        switch (action.kind) {
            case "find":
                return "SELECT " + cols + " FROM " + tbl + whereSql + orderSql;
            case "exists":
                return "SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM " + tbl + whereSql;
            case "count":
                return "SELECT COUNT(*) FROM " + tbl + whereSql;
            case "delete":
                return "DELETE FROM " + tbl + whereSql;
            default:
                return null;
        }
    }

    private static class Action {
        final String prefix; final String kind;
        Action(String prefix, String kind) { this.prefix = prefix; this.kind = kind; }
    }

    private static Action detectAction(String name) {
        if (name.startsWith("findBy"))     return new Action("findBy",     "find");
        if (name.startsWith("findAllBy"))  return new Action("findAllBy",  "find");
        if (name.startsWith("findFirstBy"))return new Action("findFirstBy","find");
        if (name.startsWith("findTopBy"))  return new Action("findTopBy",  "find");
        if (name.startsWith("readBy"))     return new Action("readBy",     "find");
        if (name.startsWith("getBy"))      return new Action("getBy",      "find");
        if (name.startsWith("queryBy"))    return new Action("queryBy",    "find");
        if (name.startsWith("searchBy"))   return new Action("searchBy",   "find");
        if (name.startsWith("streamBy"))   return new Action("streamBy",   "find");
        if (name.startsWith("existsBy"))   return new Action("existsBy",   "exists");
        if (name.startsWith("countBy"))    return new Action("countBy",    "count");
        if (name.startsWith("deleteBy"))   return new Action("deleteBy",   "delete");
        if (name.startsWith("removeBy"))   return new Action("removeBy",   "delete");
        return null;
    }

    /** "DisplayNameContainingAndUseYn" → ["DISPLAY_NAME LIKE %?%", "USE_YN = ?"] (entity @Column 매핑 적용) */
    private static List<String> parseConditions(String expr, Map<String, String> fieldToColumn) {
        List<String> out = new ArrayList<>();
        if (expr == null || expr.isBlank()) return out;
        String[] orParts = expr.split("Or(?=[A-Z])");
        List<String> orResults = new ArrayList<>();
        for (String orPart : orParts) {
            String[] andParts = orPart.split("And(?=[A-Z])");
            List<String> andResults = new ArrayList<>();
            for (String tok : andParts) andResults.add(parseSingleCondition(tok, fieldToColumn));
            orResults.add(String.join(" AND ", andResults));
        }
        if (orResults.size() == 1) {
            out.add(orResults.get(0));
        } else {
            // 여러 OR 그룹은 (a) OR (b) 형태
            for (int i = 0; i < orResults.size(); i++) {
                out.add((i == 0 ? "(" : " OR (") + orResults.get(i) + ")");
            }
            // 단일 line 으로 합쳐 반환
            out = List.of(String.join("", out));
        }
        return out;
    }

    /** "DisplayNameContaining" → "DISPLAY_NAME LIKE %?%" (entity @Column 매핑 우선) */
    private static String parseSingleCondition(String token, Map<String, String> fieldToColumn) {
        if (token == null || token.isBlank()) return "";
        String[] modifiers = {
            "IgnoreCase","Containing","StartingWith","EndingWith","Between",
            "GreaterThanEqual","GreaterThan","LessThanEqual","LessThan",
            "IsNotNull","IsNull","NotIn","NotLike","NotEquals","Not","In","Like","Equals","True","False"
        };
        String matchedMod = null;
        for (String mod : modifiers) {
            if (token.endsWith(mod)) {
                matchedMod = mod;
                token = token.substring(0, token.length() - mod.length());
                break;
            }
        }
        String column = resolveColumn(token, fieldToColumn);
        if (column.isEmpty()) return "";
        if (matchedMod == null)            return column + " = ?";
        switch (matchedMod) {
            case "IgnoreCase":  return "LOWER(" + column + ") = LOWER(?)";
            case "Containing":  return column + " LIKE %?%";
            case "StartingWith":return column + " LIKE ?%";
            case "EndingWith":  return column + " LIKE %?";
            case "Between":     return column + " BETWEEN ? AND ?";
            case "GreaterThan": return column + " > ?";
            case "GreaterThanEqual": return column + " >= ?";
            case "LessThan":    return column + " < ?";
            case "LessThanEqual":return column + " <= ?";
            case "IsNull":      return column + " IS NULL";
            case "IsNotNull":   return column + " IS NOT NULL";
            case "Not":         return column + " <> ?";
            case "NotIn":       return column + " NOT IN (?, ...)";
            case "In":          return column + " IN (?, ...)";
            case "NotLike":     return column + " NOT LIKE ?";
            case "Like":        return column + " LIKE ?";
            case "NotEquals":   return column + " <> ?";
            case "Equals":      return column + " = ?";
            case "True":        return column + " = TRUE";
            case "False":       return column + " = FALSE";
            default:            return column + " = ?";
        }
    }

    /** "PropertyAscOtherDesc" → "PROPERTY ASC, OTHER DESC" (entity @Column 매핑 적용) */
    private static String parseOrderBy(String expr, Map<String, String> fieldToColumn) {
        if (expr == null || expr.isBlank()) return "";
        String[] parts = expr.split("(?<=Asc|Desc)(?=[A-Z])");
        List<String> out = new ArrayList<>();
        for (String p : parts) {
            String dir = "ASC";
            String prop = p;
            if (p.endsWith("Asc"))      { prop = p.substring(0, p.length() - 3); dir = "ASC"; }
            else if (p.endsWith("Desc")) { prop = p.substring(0, p.length() - 4); dir = "DESC"; }
            out.add(resolveColumn(prop, fieldToColumn) + " " + dir);
        }
        return String.join(", ", out);
    }

    /**
     * Entity 의 fieldName → @Column(name=...) 매핑 우선 사용. 없으면 PascalCase → SNAKE_CASE 폴백.
     * 예) "DisplayName" → field 'displayName' 매핑 검색 → 'DISPLAY_NAME' (실제 @Column 값) 사용.
     */
    static String resolveColumn(String camelLikeProperty, Map<String, String> fieldToColumn) {
        if (camelLikeProperty == null || camelLikeProperty.isEmpty()) return "";
        // method-name 의 property 는 PascalCase ("DisplayName"). field 는 camelCase ("displayName").
        String fieldName = Character.toLowerCase(camelLikeProperty.charAt(0)) + camelLikeProperty.substring(1);
        if (fieldToColumn != null && fieldToColumn.containsKey(fieldName)) {
            return fieldToColumn.get(fieldName);
        }
        return toSnakeCase(camelLikeProperty).toUpperCase();
    }

    /** "DisplayName" → "DISPLAY_NAME", "UseYn" → "USE_YN" (대문자 권장 — MSSQL 관례) */
    static String toSnakeCase(String camel) {
        if (camel == null || camel.isEmpty()) return "";
        return camel.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase();
    }

    private static boolean isObjectInherited(String n) {
        return Arrays.asList("equals","hashCode","toString","getClass","wait","notify","notifyAll").contains(n);
    }
}

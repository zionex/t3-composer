package com.zionex.t3composer.domain.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3composer.config.TargetDataSourceRegistry;
import com.zionex.t3composer.domain.service.TargetPathResolver;
import com.zionex.t3composer.shared.data.ResponseMessage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Target DB (예: target-mssql T3SMARTSCM) 의 메뉴 트리를 조회.
 *
 * 사용처: Composer 의 "기존화면복사 (NEW_FROM_COPY)" 모드에서 원본 메뉴 선택용
 * MenuTreeBrowser 가 호출. 평탄 SELECT 후 PARENT_ID 기반 트리로 조립해 반환.
 *
 * NOTE: composer 자체 메타(PG) 가 아닌 target operational DB 를 본다 — qualifier 명시.
 */
@Slf4j
@RestController
@RequestMapping("/composer/target/menus")
@RequiredArgsConstructor
public class TargetMenuController {

    @Qualifier("targetJdbcTemplate")
    private final JdbcTemplate targetJdbcTemplate;

    private final TargetDataSourceRegistry dsRegistry;
    private final TargetPathResolver       pathResolver;

    /**
     * 활성 Target 의 운영 DB JdbcTemplate 반환. db_url 미설정/연결실패 시
     * synced 로컬 target-mssql JdbcTemplate 으로 폴백.
     */
    private JdbcTemplate pickJdbc(String targetCd) {
        if (targetCd != null && !targetCd.isBlank()) {
            JdbcTemplate live = dsRegistry.getJdbcTemplate(targetCd);
            if (live != null) return live;
            log.debug("Target {} 운영 DB 미연결 — 로컬 폴백 사용", targetCd);
        }
        return targetJdbcTemplate;
    }

    /**
     * TB_AD_MENU + TB_AD_LANG_PACK 조인. preview 임시 메뉴(__PV<sid8> 접미어) 제외.
     * BaseEntity audit 컬럼이 있을 수도 있어 명시 컬럼만 SELECT.
     */
    private static final String SQL =
        "SELECT m.ID, m.PARENT_ID, m.MENU_CD, m.MENU_PATH, m.MENU_SEQ, m.MENU_FILE_PATH, " +
        "       lp.LANG_VALUE AS DISPLAY_NAME " +
        "  FROM TB_AD_MENU m " +
        "  LEFT JOIN TB_AD_LANG_PACK lp " +
        "    ON lp.LANG_KEY = m.MENU_CD AND lp.LANG_CD = ? " +
        " WHERE m.USE_YN = 'Y' " +
        "   AND m.MENU_CD NOT LIKE '%\\_\\_PV%' ESCAPE '\\' " +
        " ORDER BY m.MENU_SEQ, m.MENU_CD";

    @GetMapping
    public ResponseEntity<?> tree(@RequestParam(defaultValue = "ko") String lang,
                                   @RequestParam(required = false) String target) {
        try {
            JdbcTemplate jdbc = pickJdbc(target);
            List<Map<String, Object>> flat = jdbc.queryForList(SQL, lang);
            Map<String, Object> tree = buildTree(flat);
            tree.put("source", (jdbc != targetJdbcTemplate) ? ("target:" + target) : "local");
            return ResponseEntity.ok(tree);
        } catch (Exception e) {
            log.error("Target menu tree 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ResponseMessage.error(e.getMessage()));
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> buildTree(List<Map<String, Object>> flat) {
        // 1) 평탄 → 노드 객체 변환
        Map<String, Map<String, Object>> byDbId = new HashMap<>();
        for (Map<String, Object> row : flat) {
            String dbId = stringOf(row.get("ID"));
            String menuCd = stringOf(row.get("MENU_CD"));
            String filePath = stringOf(row.get("MENU_FILE_PATH"));
            String dispRaw = stringOf(row.get("DISPLAY_NAME"));

            Map<String, Object> node = new LinkedHashMap<>();
            node.put("id",          menuCd);                            // ★ 식별자 = MENU_CD
            node.put("dbId",        dbId);
            node.put("parentDbId",  stringOf(row.get("PARENT_ID")));
            node.put("path",        stringOf(row.get("MENU_PATH")));
            node.put("filePath",    filePath);
            node.put("seq",         row.get("MENU_SEQ"));
            // displayName 우선순위: TB_AD_LANG_PACK → file-path basename → menuCd
            String displayName = (dispRaw != null && !dispRaw.isBlank())
                ? dispRaw
                : deriveFallbackName(menuCd, filePath);
            node.put("displayName", displayName);
            node.put("hasLangPack", dispRaw != null && !dispRaw.isBlank());
            node.put("items", new ArrayList<Map<String, Object>>());
            byDbId.put(dbId, node);
        }

        // 2) 부모-자식 연결
        List<Map<String, Object>> roots = new ArrayList<>();
        for (Map<String, Object> row : flat) {
            String dbId = stringOf(row.get("ID"));
            String parentDbId = stringOf(row.get("PARENT_ID"));
            Map<String, Object> node = byDbId.get(dbId);
            if (parentDbId == null || parentDbId.isEmpty() || !byDbId.containsKey(parentDbId)) {
                roots.add(node);
            } else {
                List<Map<String, Object>> children =
                    (List<Map<String, Object>>) byDbId.get(parentDbId).get("items");
                children.add(node);
            }
        }

        // 3) 두번째 패스 — root 그룹이 langpack 없고 filePath 도 빈 경우,
        //    자식의 첫 filePath 첫 segment 로 영문 그룹명 추정.
        //    예) MENU_09 children 의 filePath="/snop/..." → "SNOP"
        for (Map<String, Object> node : byDbId.values()) {
            backfillGroupNameFromChildren(node);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", roots);
        return result;
    }

    /** group 도 폴백 derivation 제거 — 다국어 없으면 MENU_CD 그대로 유지 */
    private void backfillGroupNameFromChildren(Map<String, Object> node) {
        // no-op: deriveFallbackName 이 이미 MENU_CD 반환하므로 추가 보강 불필요
    }

    private static String stringOf(Object v) {
        return v == null ? null : v.toString();
    }

    /**
     * displayName 폴백 — TB_AD_LANG_PACK 미등록 메뉴용.
     * wingui 동작과 동일하게 — 다국어가 없으면 메뉴 명칭으로 MENU_CD 자체 사용.
     * (transLangKey(key) 가 매핑 못 찾으면 key 그대로 반환하는 정책과 일치)
     */
    private static String deriveFallbackName(String menuCd, String filePath) {
        return menuCd == null ? "" : menuCd;
    }

    // ──────────────────────────────────────────────────────────────
    // wingui menus.js → TB_AD_MENU sync (idempotent)
    // ──────────────────────────────────────────────────────────────

    /** 부모 wingui repo 의 menus.js 후보 — Target 별 winguiRefPath 아래 */
    private List<String> menusJsCandidates(String targetCd) {
        String root = pathResolver.resolveWinguiPath(targetCd);
        return Arrays.asList(
            root + "/packages/wingui/src/data/menus.js",
            root + "/packages/node_modules/wingui/src/data/menus.js"
        );
    }

    /**
     * 부모 wingui 의 menus.js 를 파싱해 target-mssql 의 TB_AD_MENU 에 멱등 sync.
     *
     * - MENU_CD 가 이미 있으면 UPDATE, 없으면 INSERT
     * - PARENT_ID 는 parentId(MENU_CD) → 해당 row 의 UUID 로 lookup
     * - displayName 은 menus.js 에 없으므로 일단 NULL (langPack 별도 sync 필요)
     *
     * 응답: { inserted: n, updated: n, total: n, source: <path>, errors: [...] }
     */
    @PostMapping("/sync-from-wingui")
    public ResponseEntity<?> syncFromWingui(
            @RequestParam(value = "target", required = false) String targetCd) {
        // 1) menus.js 위치 탐색 — Target 별 wingui 폴더에서
        Path menusJs = null;
        for (String p : menusJsCandidates(targetCd)) {
            Path candidate = Path.of(p);
            if (Files.isRegularFile(candidate)) {
                menusJs = candidate;
                break;
            }
        }
        if (menusJs == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ResponseMessage.of(HttpStatus.NOT_FOUND,
                    "wingui menus.js 를 찾을 수 없습니다 (마운트 확인 — COMPOSER_WINGUI_REF_PATH)"));
        }

        // 2) 파일 읽기 + JS 변수 선언 제거 → JSON
        Map<String, Object> rootMenu;
        try {
            String raw = Files.readString(menusJs);
            String json = extractJsonObject(raw);
            ObjectMapper om = new ObjectMapper();
            om.configure(JsonParser.Feature.ALLOW_TRAILING_COMMA, true);
            om.configure(JsonParser.Feature.ALLOW_COMMENTS, true);
            @SuppressWarnings("unchecked")
            Map<String, Object> parsed = om.readValue(json, Map.class);
            rootMenu = parsed;
        } catch (IOException e) {
            log.error("menus.js 읽기 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ResponseMessage.error("menus.js 읽기 실패: " + e.getMessage()));
        } catch (Exception e) {
            log.error("menus.js 파싱 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ResponseMessage.error("menus.js 파싱 실패: " + e.getMessage()));
        }

        // 3) 평탄화 — BOOKMARK 노드는 사용자별 즐겨찾기라 제외
        List<Map<String, Object>> flat = new ArrayList<>();
        flatten(rootMenu, flat, /*skipBookmark*/ true);

        // 중복 MENU_CD 제거 (menus.js 에서 동일 코드가 BOOKMARK + 본 트리 양쪽에 있을 수 있음)
        Map<String, Map<String, Object>> dedup = new LinkedHashMap<>();
        for (Map<String, Object> n : flat) {
            String cd = stringOf(n.get("id"));
            if (cd == null || cd.isEmpty()) continue;
            dedup.putIfAbsent(cd, n);
        }
        List<Map<String, Object>> nodes = new ArrayList<>(dedup.values());

        // 4) 기존 TB_AD_MENU 의 MENU_CD → ID 매핑 획득
        Map<String, String> existingCdToId = new HashMap<>();
        List<Map<String, Object>> existing = targetJdbcTemplate.queryForList(
            "SELECT ID, MENU_CD FROM TB_AD_MENU");
        for (Map<String, Object> row : existing) {
            existingCdToId.put(stringOf(row.get("MENU_CD")), stringOf(row.get("ID")));
        }

        // 5) 모든 노드에 ID 부여 (기존 유지 / 신규 UUID)
        Map<String, String> cdToId = new HashMap<>();
        for (Map<String, Object> n : nodes) {
            String cd = stringOf(n.get("id"));
            cdToId.put(cd, existingCdToId.getOrDefault(cd, newId()));
        }

        // 6) Upsert
        int inserted = 0, updated = 0;
        List<String> errors = new ArrayList<>();
        for (Map<String, Object> n : nodes) {
            String cd = stringOf(n.get("id"));
            String parentCd = stringOf(n.get("parentId"));
            String path = stringOf(n.get("path"));
            String filePath = stringOf(n.get("filePath"));
            Integer seq = parseInt(n.get("seq"));
            Boolean usable = parseBool(n.get("usable"));
            String useYn = (usable == null || usable) ? "Y" : "N";

            String id = cdToId.get(cd);
            String parentId = (parentCd == null || parentCd.isEmpty()) ? null : cdToId.get(parentCd);

            try {
                if (existingCdToId.containsKey(cd)) {
                    targetJdbcTemplate.update(
                        "UPDATE TB_AD_MENU SET PARENT_ID=?, MENU_PATH=?, MENU_SEQ=?, MENU_FILE_PATH=?, " +
                        "USE_YN=?, MODIFY_BY='composer', MODIFY_DTTM=GETDATE() WHERE MENU_CD=?",
                        parentId, path, seq, filePath, useYn, cd);
                    updated++;
                } else {
                    targetJdbcTemplate.update(
                        "INSERT INTO TB_AD_MENU (ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, " +
                        "MENU_FILE_PATH, USE_YN, CREATE_BY, CREATE_DTTM) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, 'composer', GETDATE())",
                        id, parentId, cd, path, seq, filePath, useYn);
                    inserted++;
                }
            } catch (Exception ex) {
                errors.add(cd + ": " + ex.getMessage());
                log.warn("menu sync 오류 {} — {}", cd, ex.getMessage());
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("inserted", inserted);
        result.put("updated",  updated);
        result.put("total",    nodes.size());
        result.put("source",   menusJs.toString());
        result.put("errors",   errors);
        log.info("Target menu sync 완료 — inserted={}, updated={}, total={}", inserted, updated, nodes.size());
        return ResponseEntity.ok(result);
    }

    /** `const menuData = { ... };` 형식에서 중괄호 블록만 추출. */
    private static String extractJsonObject(String raw) {
        int first = raw.indexOf('{');
        int last  = raw.lastIndexOf('}');
        if (first < 0 || last < 0 || last < first) {
            throw new IllegalArgumentException("menus.js 에서 JSON object 를 찾지 못함");
        }
        return raw.substring(first, last + 1);
    }

    /** 재귀 평탄화. skipBookmark=true 면 id='BOOKMARK' 자체와 그 하위는 본 트리에서 가져오므로 별도 표시 안 함. */
    @SuppressWarnings("unchecked")
    private static void flatten(Map<String, Object> node, List<Map<String, Object>> out, boolean skipBookmark) {
        if (node == null) return;
        Set<String> excludedIds = new HashSet<>(Arrays.asList("BOOKMARK"));
        String id = stringOf(node.get("id"));
        // 본인이 root (id 비어있음) 인 경우 추가하지 않음
        if (id != null && !id.isEmpty() && !(skipBookmark && excludedIds.contains(id))) {
            out.add(node);
        }
        Object items = node.get("items");
        if (items instanceof List) {
            // BOOKMARK 하위는 무시 (즐겨찾기 — 본 트리에 중복 존재)
            if (skipBookmark && excludedIds.contains(id)) return;
            for (Object child : (List<Object>) items) {
                if (child instanceof Map) flatten((Map<String, Object>) child, out, skipBookmark);
            }
        }
    }

    private static String newId() {
        return UUID.randomUUID().toString().replace("-", "").toLowerCase();
    }

    private static Integer parseInt(Object v) {
        if (v == null) return null;
        if (v instanceof Number) return ((Number) v).intValue();
        try { return Integer.parseInt(v.toString()); } catch (NumberFormatException e) { return null; }
    }

    private static Boolean parseBool(Object v) {
        if (v == null) return null;
        if (v instanceof Boolean) return (Boolean) v;
        String s = v.toString().trim().toLowerCase();
        if ("y".equals(s) || "true".equals(s) || "1".equals(s)) return true;
        if ("n".equals(s) || "false".equals(s) || "0".equals(s)) return false;
        return null;
    }

    // ──────────────────────────────────────────────────────────────
    // wingui db_update_script.sql → TB_AD_LANG_PACK sync (idempotent)
    // ──────────────────────────────────────────────────────────────

    /** db upgrade 폴더 — Target 별 databaseRefPath 아래의 mssql/upgrade */
    private Path dbUpgradeRoot(String targetCd) {
        return Path.of(pathResolver.resolveDatabasePath(targetCd), "mssql", "upgrade");
    }

    /**
     * INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE) VALUES ('xx', 'KEY', N'value');
     * 매칭. N'...' 의 ' 이스케이프 '' 도 처리.
     */
    private static final Pattern LANG_INSERT_RE = Pattern.compile(
        "INSERT\\s+INTO\\s+TB_AD_LANG_PACK\\s*\\([^)]*\\)\\s*VALUES\\s*\\(\\s*" +
        "'([a-zA-Z]{2})'\\s*,\\s*" +
        "'([^']+)'\\s*,\\s*" +
        "N?'((?:''|[^'])*)'" +
        "\\s*\\)\\s*;",
        Pattern.CASE_INSENSITIVE);

    /**
     * 부모 db_update_script.sql 들을 스캔해 TB_AD_LANG_PACK 에 멱등 sync.
     * - TB_AD_MENU 의 MENU_CD 와 동일한 LANG_KEY 만 import (메뉴 라벨로 제한)
     * - 같은 (LANG_CD, LANG_KEY) 가 중복 등장하면 마지막 등장 값 사용 (최신 upgrade 가 진실)
     */
    @PostMapping("/langpack/sync-from-wingui")
    public ResponseEntity<?> syncLangpackFromWingui(
            @RequestParam(value = "target", required = false) String targetCd) {
        Path upgradeRoot = dbUpgradeRoot(targetCd);
        if (!Files.isDirectory(upgradeRoot)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ResponseMessage.of(HttpStatus.NOT_FOUND,
                    "DB upgrade 폴더를 찾을 수 없음: " + upgradeRoot));
        }

        // 1) TB_AD_MENU 의 MENU_CD 화이트리스트
        Set<String> menuCds = new HashSet<>();
        for (Map<String, Object> row : targetJdbcTemplate.queryForList("SELECT MENU_CD FROM TB_AD_MENU")) {
            String cd = stringOf(row.get("MENU_CD"));
            if (cd != null) menuCds.add(cd);
        }

        // 2) upgrade 폴더의 db_update_script.sql 전수 스캔 — (LANG_CD, LANG_KEY) → LANG_VALUE 누적
        //    파일은 폴더명 (vX.Y.Z-YYYYMMDD) 알파벳/숫자 순으로 적재돼 마지막 등장이 최신.
        Map<String, String> langMap = new LinkedHashMap<>();
        try (Stream<Path> walk = Files.walk(upgradeRoot)) {
            // upgrade 폴더의 모든 .sql 파일 (db_update_script.sql + 분리된 *.sql 포함)
            // 단 procedures/ 폴더 내부는 제외 — SP DDL 안의 동적 SQL 까지 매칭 위험
            List<Path> scripts = walk
                .filter(Files::isRegularFile)
                .filter(p -> p.toString().toLowerCase().endsWith(".sql"))
                .filter(p -> !p.toString().replace('\\', '/').contains("/procedures/"))
                .sorted()
                .toList();
            for (Path script : scripts) {
                try {
                    String content = Files.readString(script);
                    Matcher m = LANG_INSERT_RE.matcher(content);
                    while (m.find()) {
                        String langCd = m.group(1).toLowerCase();
                        String key    = m.group(2);
                        if (!menuCds.contains(key)) continue;
                        String value  = m.group(3).replace("''", "'");
                        langMap.put(langCd + "" + key, value);
                    }
                } catch (IOException e) {
                    log.warn("script read 실패 {} — {}", script, e.getMessage());
                }
            }
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ResponseMessage.error("upgrade 폴더 탐색 실패: " + e.getMessage()));
        }

        // 3) UPSERT into TB_AD_LANG_PACK
        int inserted = 0, updated = 0;
        List<String> errors = new ArrayList<>();
        for (Map.Entry<String, String> e : langMap.entrySet()) {
            String[] parts = e.getKey().split("", 2);
            String langCd = parts[0];
            String key    = parts[1];
            String value  = e.getValue();
            try {
                int rows = targetJdbcTemplate.update(
                    "UPDATE TB_AD_LANG_PACK SET LANG_VALUE=?, MODIFY_BY='composer', MODIFY_DTTM=GETDATE() " +
                    "WHERE LANG_CD=? AND LANG_KEY=?", value, langCd, key);
                if (rows > 0) {
                    updated++;
                } else {
                    targetJdbcTemplate.update(
                        "INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM) " +
                        "VALUES (?, ?, ?, 'composer', GETDATE())", langCd, key, value);
                    inserted++;
                }
            } catch (Exception ex) {
                errors.add(langCd + "/" + key + ": " + ex.getMessage());
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("inserted", inserted);
        result.put("updated",  updated);
        result.put("total",    langMap.size());
        result.put("scanned",  upgradeRoot.toString());
        result.put("errors",   errors);
        log.info("Target langpack sync 완료 — inserted={}, updated={}, total={}", inserted, updated, langMap.size());
        return ResponseEntity.ok(result);
    }
}

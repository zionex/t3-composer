package com.zionex.t3composer.domain.controller;

import java.sql.Connection;
import java.sql.DriverManager;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;

import com.zionex.t3composer.config.TargetDataSourceRegistry;
import com.zionex.t3composer.domain.entity.TargetSystem;
import com.zionex.t3composer.domain.repository.TargetSystemRepository;
import com.zionex.t3composer.domain.schema.SchemaMetaCache;
import com.zionex.t3composer.domain.service.ClaudeAssetImportService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Target System CRUD + Claude assets import.
 *  · GET  /composer/targets                                   — 활성 Target 목록
 *  · GET  /composer/targets/{cd}                              — 단건
 *  · POST /composer/targets/{cd}/import-claude   body: {claudeRoot: "..."}
 *    → .claude/rules/*.md + hooks/**.sh 를 DB 로 import (기본 경로: /workspace/wingui/.claude)
 */
@Slf4j
@RestController
@RequestMapping("/composer/targets")
@RequiredArgsConstructor
public class TargetSystemController {

    /** 공용 Claude assets — 모든 Target 에 먼저 import 후 target overlay 가 덮어쓴다. */
    private static final String COMMON_CLAUDE_ROOT = "/workspace/common-claude";

    /** Target 별 Claude assets overlay 마운트 경로 — docker-compose.yml 의 마운트와 매칭. */
    private static final Map<String, String> TARGET_CLAUDE_ROOTS = Map.of(
            "T3SERIES",     "/workspace/t3series-claude",
            "PLANNEL",      "/workspace/plannel-claude",
            "LGES_NEXTSCM", "/workspace/lges_nextscm-claude"
    );

    /** 미등록 Target 의 fallback (legacy 동작 보존 — 단일 폴더 import). */
    private static final String DEFAULT_CLAUDE_ROOT = "/workspace/t3series-claude";

    private final TargetSystemRepository    targetRepo;
    private final ClaudeAssetImportService  importService;
    private final TargetDataSourceRegistry  dsRegistry;
    private final SchemaMetaCache           schemaMetaCache;
    /** Primary (composer-db PG) — DB 정보 update 시 jsonb 변환 우회용 직접 SQL */
    @Qualifier("composerJdbcTemplate")
    private final JdbcTemplate              composerDbJdbc;

    @GetMapping
    public List<TargetSystem> list() {
        return targetRepo.findByIsActiveOrderBySortOrderAsc("Y");
    }

    @GetMapping("/{targetCd}")
    public TargetSystem get(@PathVariable String targetCd) {
        return targetRepo.findById(targetCd)
                .orElseThrow(() -> new IllegalArgumentException("Unknown target: " + targetCd));
    }

    /**
     * Target 의 Claude assets (rules + hooks) 를 DB 로 import.
     *
     * 기본 동작 — 2단 import: [공용, Target overlay] 순서.
     *  1) /workspace/common-claude        (모든 Target 공용 — Composer feature/Java/JSX 등)
     *  2) /workspace/&lt;target&gt;-claude   (Target 전용 overlay — 같은 ruleCode 면 덮어씀)
     *
     * Override:
     *  · body.claudeRoot         : 단일 폴더만 import (legacy 동작)
     *  · body.claudeRoots: [...] : 명시한 폴더 리스트 순서대로 import
     */
    @PostMapping("/{targetCd}/import-claude")
    @SuppressWarnings("unchecked")
    public Map<String, Object> importClaude(@PathVariable String targetCd,
                                            @RequestBody(required = false) Map<String, Object> body) {
        // 1) 명시적 단일 폴더 (legacy)
        if (body != null && body.get("claudeRoot") instanceof String s && !s.isBlank()) {
            log.info("import-claude (single, legacy): target={} root={}", targetCd, s);
            return importService.importFromClaudeFolder(targetCd, s);
        }
        // 2) 명시적 폴더 리스트
        if (body != null && body.get("claudeRoots") instanceof List<?> l && !l.isEmpty()) {
            List<String> roots = ((List<Object>) l).stream()
                    .filter(o -> o instanceof String)
                    .map(o -> (String) o)
                    .toList();
            log.info("import-claude (multi, explicit): target={} roots={}", targetCd, roots);
            return importService.importFromClaudeFolders(targetCd, roots);
        }
        // 3) 기본 — 공용 + Target overlay 2단
        String targetRoot = TARGET_CLAUDE_ROOTS.getOrDefault(targetCd, DEFAULT_CLAUDE_ROOT);
        List<String> defaults = List.of(COMMON_CLAUDE_ROOT, targetRoot);
        log.info("import-claude (multi, default): target={} roots={}", targetCd, defaults);
        return importService.importFromClaudeFolders(targetCd, defaults);
    }

    /**
     * Target 의 운영 DB 접속 정보 저장.
     * body: { dbUrl, dbUsername, dbPassword, dbDriverClass? }
     * dbPassword="" 또는 누락이면 기존 비밀번호 유지(미변경).
     */
    @PutMapping("/{targetCd}/db-connection")
    public TargetSystem updateDbConnection(@PathVariable String targetCd,
                                           @RequestBody Map<String, String> body) {
        if (!targetRepo.existsById(targetCd)) {
            throw new IllegalArgumentException("Unknown target: " + targetCd);
        }
        String pass = body.get("dbPassword");
        boolean updatePass = (pass != null && !pass.isEmpty());
        // JPA save() 가 jsonb 컬럼 (artifact_naming/module_codes/ref_paths) 을 char varying 으로
        // 보내려다 PG 에서 실패하는 이슈 회피 — 변경 컬럼만 직접 UPDATE.
        if (updatePass) {
            composerDbJdbc.update(
                "UPDATE dbo.tb_cmp_target_system SET db_url=?, db_username=?, db_password=?, db_driver_class=?, " +
                "db_last_error=NULL, modify_by='composer', modify_dttm=now() WHERE target_cd=?",
                body.get("dbUrl"), body.get("dbUsername"), pass, body.get("dbDriverClass"), targetCd);
        } else {
            composerDbJdbc.update(
                "UPDATE dbo.tb_cmp_target_system SET db_url=?, db_username=?, db_driver_class=?, " +
                "db_last_error=NULL, modify_by='composer', modify_dttm=now() WHERE target_cd=?",
                body.get("dbUrl"), body.get("dbUsername"), body.get("dbDriverClass"), targetCd);
        }
        dsRegistry.invalidate(targetCd);
        schemaMetaCache.evict(targetCd);
        return targetRepo.findById(targetCd).orElseThrow();
    }

    /**
     * Target 의 ref path (source / backend / database) 저장.
     * body: { sourceRefPath, backendRefPath?, databaseRefPath? }
     * 컨테이너 안 절대경로 입력 (예: /workspace/projects/saas-plannel/saas-web).
     * 빈 문자열 / null 도 허용 (마운트 convention fallback 으로 동작).
     *
     * 검증: 비어있지 않은 path 는 모두 /workspace/ 하위여야 함 (path traversal 차단).
     * 옛 필드명 winguiRefPath 도 한시적으로 수신 (frontend 캐시 호환) — 사라지면 제거.
     */
    @PutMapping("/{targetCd}/ref-paths")
    public TargetSystem updateRefPaths(@PathVariable String targetCd,
                                       @RequestBody Map<String, String> body) {
        if (!targetRepo.existsById(targetCd)) {
            throw new IllegalArgumentException("Unknown target: " + targetCd);
        }
        String src = body.get("sourceRefPath");
        if (src == null) src = body.get("winguiRefPath");   // 옛 키 호환

        String srcVal = sanitizeContainerPath(src, "sourceRefPath");
        String backVal = sanitizeContainerPath(body.get("backendRefPath"), "backendRefPath");
        String dbVal = sanitizeContainerPath(body.get("databaseRefPath"), "databaseRefPath");

        // jsonb 컬럼 회피 — 변경 컬럼만 직접 UPDATE.
        composerDbJdbc.update(
            "UPDATE dbo.tb_cmp_target_system SET source_ref_path=?, backend_ref_path=?, " +
            "database_ref_path=?, modify_by='composer', modify_dttm=now() WHERE target_cd=?",
            srcVal, backVal, dbVal, targetCd);
        return targetRepo.findById(targetCd).orElseThrow();
    }

    private static String nullIfBlank(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    /**
     * UI 가 보낸 path 가 컨테이너 안의 /workspace/ 하위인지 검증.
     * 빈 값은 null 반환 (clear), 그 외는 trim. 외부 path 는 IllegalArgumentException.
     */
    private static String sanitizeContainerPath(String raw, String fieldName) {
        if (raw == null || raw.isBlank()) return null;
        String trimmed = raw.trim();
        // /workspace/ 하위만 허용 — host 절대경로나 path traversal 차단
        if (!trimmed.startsWith("/workspace/")) {
            throw new IllegalArgumentException(
                fieldName + " 는 /workspace/ 하위 컨테이너 경로여야 합니다 (받은 값: " + trimmed + ")");
        }
        // path traversal (.. / .) 정규화 후 다시 확인
        java.nio.file.Path normalized = java.nio.file.Paths.get(trimmed).normalize();
        if (!normalized.toString().startsWith("/workspace/")) {
            throw new IllegalArgumentException(
                fieldName + " path traversal 시도 차단: " + trimmed);
        }
        return normalized.toString();
    }

    /**
     * Target 의 운영 DB 접속 테스트 — DriverManager.getConnection.
     * body 가 비어있으면 저장된 값으로 테스트, 있으면 그 값으로.
     * 성공 시 dbConnectedAt 갱신, 실패 시 dbLastError 저장.
     */
    /**
     * 빠른 연결 확인 (ping) — pool 에서 connection 빌려 SELECT 1 만 실행. UPDATE 없음.
     * 최초 호출 (pool warm-up) 만 다소 걸리고 이후 호출은 50ms 이하.
     * frontend 의 신규/수정 진입 시 사전 DB 체크용.
     */
    @GetMapping("/{targetCd}/db-connection/ping")
    public Map<String, Object> pingDbConnection(@PathVariable String targetCd) {
        Map<String, Object> result = new LinkedHashMap<>();
        long start = System.currentTimeMillis();
        try {
            JdbcTemplate live = dsRegistry.getJdbcTemplate(targetCd);
            if (live == null) {
                result.put("success", false);
                result.put("error",   "db connection not configured");
                return result;
            }
            // SELECT 1 — pool 에서 connection 빌려 빠르게 확인
            live.queryForObject("SELECT 1", Integer.class);
            result.put("success",    true);
            result.put("elapsedMs",  System.currentTimeMillis() - start);
        } catch (Exception e) {
            result.put("success", false);
            result.put("error",   e.getClass().getSimpleName());
            result.put("elapsedMs", System.currentTimeMillis() - start);
        }
        return result;
    }

    @PostMapping("/{targetCd}/db-connection/test")
    public Map<String, Object> testDbConnection(@PathVariable String targetCd,
                                                @RequestBody(required = false) Map<String, String> body) {
        TargetSystem t = targetRepo.findById(targetCd)
            .orElseThrow(() -> new IllegalArgumentException("Unknown target: " + targetCd));
        String url    = pick(body, "dbUrl",         t.getDbUrl());
        String user   = pick(body, "dbUsername",    t.getDbUsername());
        String pass   = pick(body, "dbPassword",    t.getDbPassword());
        String driver = pick(body, "dbDriverClass", t.getDbDriverClass());

        Map<String, Object> result = new LinkedHashMap<>();
        if (url == null || url.isBlank()) {
            result.put("success", false);
            result.put("error",   "dbUrl is required");
            return result;
        }
        long start = System.currentTimeMillis();
        try {
            if (driver != null && !driver.isBlank()) Class.forName(driver);
            try (Connection conn = DriverManager.getConnection(url, user, pass == null ? "" : pass)) {
                String product = conn.getMetaData().getDatabaseProductName();
                String version = conn.getMetaData().getDatabaseProductVersion();
                composerDbJdbc.update(
                    "UPDATE dbo.tb_cmp_target_system SET db_connected_at=now(), db_last_error=NULL WHERE target_cd=?",
                    targetCd);
                result.put("success",        true);
                result.put("databaseProduct", product);
                result.put("databaseVersion", version);
                result.put("elapsedMs",       System.currentTimeMillis() - start);
            }
        } catch (Exception e) {
            log.warn("Target DB 연결 실패 {} — {}", targetCd, e.getMessage());
            composerDbJdbc.update(
                "UPDATE dbo.tb_cmp_target_system SET db_last_error=? WHERE target_cd=?",
                e.getClass().getSimpleName() + ": " + e.getMessage(), targetCd);
            result.put("success", false);
            result.put("error",   e.getClass().getSimpleName() + ": " + e.getMessage());
        }
        return result;
    }

    private static String pick(Map<String, String> body, String key, String fallback) {
        if (body == null) return fallback;
        String v = body.get(key);
        return (v == null || v.isEmpty()) ? fallback : v;
    }
}

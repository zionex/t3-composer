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

    private static final String DEFAULT_CLAUDE_ROOT = "/workspace/t3series-claude";

    private final TargetSystemRepository    targetRepo;
    private final ClaudeAssetImportService  importService;
    private final TargetDataSourceRegistry  dsRegistry;
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

    @PostMapping("/{targetCd}/import-claude")
    public Map<String, Object> importClaude(@PathVariable String targetCd,
                                            @RequestBody(required = false) Map<String, String> body) {
        String claudeRoot = (body != null && body.get("claudeRoot") != null && !body.get("claudeRoot").isBlank())
                ? body.get("claudeRoot")
                : DEFAULT_CLAUDE_ROOT;
        log.info("import-claude 시작: target={} root={}", targetCd, claudeRoot);
        return importService.importFromClaudeFolder(targetCd, claudeRoot);
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
        return targetRepo.findById(targetCd).orElseThrow();
    }

    /**
     * Target 의 ref path (wingui / database) 저장.
     * body: { winguiRefPath, databaseRefPath }
     * 컨테이너 안 절대경로 입력 (예: /workspace/projects/t3series/t3series-wingui).
     * 빈 문자열 / null 도 허용 (글로벌 fallback 으로 동작).
     */
    @PutMapping("/{targetCd}/ref-paths")
    public TargetSystem updateRefPaths(@PathVariable String targetCd,
                                       @RequestBody Map<String, String> body) {
        if (!targetRepo.existsById(targetCd)) {
            throw new IllegalArgumentException("Unknown target: " + targetCd);
        }
        // jsonb 컬럼 회피 — 변경 컬럼만 직접 UPDATE.
        composerDbJdbc.update(
            "UPDATE dbo.tb_cmp_target_system SET wingui_ref_path=?, database_ref_path=?, " +
            "modify_by='composer', modify_dttm=now() WHERE target_cd=?",
            nullIfBlank(body.get("winguiRefPath")),
            nullIfBlank(body.get("databaseRefPath")),
            targetCd);
        return targetRepo.findById(targetCd).orElseThrow();
    }

    private static String nullIfBlank(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
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

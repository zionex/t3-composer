package com.zionex.t3composer.domain.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.sql.DataSource;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3composer.domain.entity.ComposerArtifact;
import com.zionex.t3composer.domain.entity.ComposerSession;
import com.zionex.t3composer.domain.entity.TargetSystem;
import com.zionex.t3composer.domain.repository.ComposerArtifactRepository;
import com.zionex.t3composer.domain.repository.ComposerSessionRepository;
import com.zionex.t3composer.domain.repository.TargetSystemRepository;

import lombok.extern.slf4j.Slf4j;

/**
 * Composer 가 생성한 MENU_SQL 아티팩트를 실제 DB 에 적용한다.
 *
 * 안전 장치:
 *  - SELECT/INSERT/UPDATE/DELETE 만 허용, DROP/TRUNCATE 등 파괴적 DDL 차단
 *  - TB_AD_MENU · TB_AD_LANG_PACK · TB_AD_MANUAL 만 허용 테이블
 *  - 멀티 스테이트먼트는 세미콜론으로 분리해 순차 실행 (오류 시 롤백)
 */
@Slf4j
@Service
public class MenuRegistrationService {

    private static final List<String> ALLOWED_TABLES = Arrays.asList(
            "TB_AD_MENU", "TB_AD_LANG_PACK", "TB_AD_MANUAL",
            "TB_AD_MENU_BADGE", "TB_AD_MENU_BOOKMARK",
            // 권한 동시 등록
            "TB_AD_PERMISSION", "TB_AD_PERMISSION_GROUP", "TB_AD_GROUP");

    private static final List<String> BANNED_KEYWORDS = Arrays.asList(
            "DROP ", "TRUNCATE ", "ALTER ", "EXEC ", "EXECUTE ", "CREATE PROCEDURE",
            "CREATE FUNCTION", "CREATE VIEW", "CREATE INDEX", "SHUTDOWN");

    /**
     * 테이블별 실제 컬럼 화이트리스트 — INSERT/UPDATE 의 컬럼명이 여기 없으면
     * LLM 허구 생성(hallucination). SQL 실행 전 차단하고 명확한 에러 메시지 반환.
     * (Entity 파일 기준 · BaseEntity 의 CREATE_BY/CREATE_DTTM/MODIFY_BY/MODIFY_DTTM 포함)
     */
    private static final Map<String, Set<String>> TABLE_COLUMNS = Map.ofEntries(
            Map.entry("TB_AD_MENU", Set.of(
                    "ID", "PARENT_ID", "MENU_CD", "MENU_PATH", "MENU_SEQ",
                    "MENU_FILE_PATH", "USE_YN",
                    "CREATE_BY", "CREATE_DTTM", "MODIFY_BY", "MODIFY_DTTM")),
            Map.entry("TB_AD_LANG_PACK", Set.of(
                    "ID", "LANG_CD", "LANG_KEY", "LANG_VALUE",
                    "CREATE_BY", "CREATE_DTTM", "MODIFY_BY", "MODIFY_DTTM")),
            Map.entry("TB_AD_PERMISSION", Set.of(
                    "ID", "USER_ID", "MENU_ID", "PERMISSION_TP", "USABILITY",
                    "CREATE_BY", "CREATE_DTTM", "MODIFY_BY", "MODIFY_DTTM")),
            Map.entry("TB_AD_PERMISSION_GROUP", Set.of(
                    "ID", "GRP_ID", "MENU_ID", "PERMISSION_TP", "USABILITY",
                    "CREATE_BY", "CREATE_DTTM", "MODIFY_BY", "MODIFY_DTTM")),
            Map.entry("TB_AD_GROUP", Set.of(
                    "ID", "GRP_CD", "GRP_NM", "GRP_DESCRIP",
                    "CREATE_BY", "CREATE_DTTM", "MODIFY_BY", "MODIFY_DTTM")),
            Map.entry("TB_AD_MENU_BADGE", Set.of(
                    "ID", "MENU_ID", "BADGE_TYPE", "BADGE_VALUE",
                    "CREATE_BY", "CREATE_DTTM", "MODIFY_BY", "MODIFY_DTTM")),
            Map.entry("TB_AD_MENU_BOOKMARK", Set.of(
                    "ID", "USER_ID", "MENU_ID", "BOOKMARK_SEQ",
                    "CREATE_BY", "CREATE_DTTM", "MODIFY_BY", "MODIFY_DTTM")),
            Map.entry("TB_AD_MANUAL", Set.of(
                    "ID", "MENU_ID", "LANG_CD", "CONTENT", "CONTENT_TYPE",
                    "CREATE_BY", "CREATE_DTTM", "MODIFY_BY", "MODIFY_DTTM"))
    );

    private static final Pattern INSERT_COLS_PATTERN = Pattern.compile(
            "INSERT\\s+INTO\\s+(?:\\[?dbo\\]?\\s*\\.\\s*)?\\[?(TB_AD_[A-Z_]+)\\]?\\s*\\(([^)]+)\\)",
            Pattern.CASE_INSENSITIVE);

    @PersistenceContext
    private EntityManager em;

    private final ComposerArtifactRepository artifactRepo;
    private final ComposerSessionRepository sessionRepo;

    /**
     * 각 SQL statement 를 독립 트랜잭션으로 실행하기 위한 template.
     * 외부 메서드를 @Transactional 로 묶으면 개별 statement 실패 시 rollback-only 로
     * 마킹되어 정상 catch 후 리턴해도 commit 시점에 UnexpectedRollbackException → 500.
     * REQUIRES_NEW 로 각 statement 를 분리해 실패한 건만 롤백, 성공 건은 유지.
     */
    private final TransactionTemplate perStatementTx;
    private final TransactionTemplate defaultTx;

    // PLANEL (menu_source='JS_FILE') 분기에 사용. setter injection — bean 없어도 기본 DB 경로 동작.
    private TargetSystemRepository targetRepo;
    private TargetPathResolver targetPathResolver;
    private JsMenuFileParser jsMenuParser;
    // 세션의 Target 운영 DB (MSSQL) 로 라우팅 — composer-db (PG) 가 아닌 실제 화면이 등록될 DB.
    private com.zionex.t3composer.config.TargetDataSourceRegistry dsRegistry;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public MenuRegistrationService(ComposerArtifactRepository artifactRepo,
                                   ComposerSessionRepository sessionRepo,
                                   PlatformTransactionManager txManager) {
        this.artifactRepo = artifactRepo;
        this.sessionRepo = sessionRepo;
        this.perStatementTx = new TransactionTemplate(txManager);
        this.perStatementTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.defaultTx = new TransactionTemplate(txManager);
    }

    @Autowired(required = false)
    public void setTargetRepository(TargetSystemRepository targetRepo) {
        this.targetRepo = targetRepo;
    }

    @Autowired(required = false)
    public void setTargetPathResolver(TargetPathResolver resolver) {
        this.targetPathResolver = resolver;
    }

    @Autowired(required = false)
    public void setJsMenuFileParser(JsMenuFileParser parser) {
        this.jsMenuParser = parser;
    }

    @Autowired(required = false)
    public void setTargetDataSourceRegistry(com.zionex.t3composer.config.TargetDataSourceRegistry registry) {
        this.dsRegistry = registry;
    }

    /**
     * 세션의 Target DB DataSource — MENU_SQL 은 화면이 등록될 운영 DB (MSSQL T3SERIES 등) 에서
     * 실행해야 NEWID()/GETDATE()/N'...' MSSQL 방언이 정상 동작.
     * Target 미설정·연결 불가 시 null 반환 → caller 가 명확한 에러로 처리 (PG 폴백 시 syntax 오류 발생).
     */
    private DataSource resolveTargetDataSource(String sessionId) {
        if (dsRegistry == null) return null;
        try {
            String targetCd = sessionRepo.findById(sessionId)
                    .map(ComposerSession::getTargetCd).orElse(null);
            if (targetCd == null || targetCd.isBlank()) return null;
            return dsRegistry.getDataSource(targetCd);
        } catch (Exception e) {
            log.warn("Target DataSource 해석 실패 session={} err={}", sessionId, rootMessage(e));
            return null;
        }
    }

    /**
     * sqlOverride 없이 세션의 MENU_SQL 아티팩트를 그대로 실행.
     */
    public Map<String, Object> executeSessionMenuSql(String sessionId) {
        return executeSessionMenuSql(sessionId, null);
    }

    /**
     * 세션 내 최신 MENU_SQL 아티팩트를 실행. sqlOverride 가 제공되면 그 SQL 을 사용
     * (트리 픽커로 부모 메뉴를 바꾼 뒤 실행하는 시나리오). 성공 시 아티팩트 content
     * 도 override 로 갱신하여 다음 조회 시 최신 상태를 보이게 한다.
     *
     * 이 메서드 자체는 @Transactional 이 아니다. 각 statement 는 per-statement
     * 트랜잭션으로 격리 실행되어, 한 구문이 실패해도 전체 500 으로 터지지 않는다.
     */
    public Map<String, Object> executeSessionMenuSql(String sessionId, String sqlOverride) {
        // PLANEL 류 (Target.menu_source='JS_FILE') 분기 — MENU_JS 아티팩트가 있으면 그쪽 처리.
        // sqlOverride 파라미터는 MENU_SQL/MENU_JS 둘 다 의미상 "content override" — PLANEL 에선
        // 트리 픽커로 groupKey 를 변경한 후의 갱신 JSON 이 들어온다.
        if (isJsFileMenuSource(sessionId)) {
            return executeSessionMenuJs(sessionId, sqlOverride);
        }

        List<ComposerArtifact> artifacts = artifactRepo
                .findBySessionIdAndArtifactTypeOrderByCreateDttmDesc(sessionId, ComposerArtifact.TYPE_MENU_SQL);

        // Supersede 된 이전 버전(DISCARDED) 제외 — 항상 최신만 실행
        artifacts = artifacts.stream()
                .filter(a -> !ComposerArtifact.STATUS_DISCARDED.equals(a.getStatus()))
                .collect(java.util.stream.Collectors.toList());

        if (artifacts.isEmpty()) {
            return resultOf(false, 0, 0, List.of("MENU_SQL 타입 아티팩트가 없습니다."));
        }

        // 최신 버전(첫 번째) 만 실행
        ComposerArtifact artifact = artifacts.get(0);
        String sql = (sqlOverride != null && !sqlOverride.isBlank())
                ? sqlOverride
                : artifact.getContent();
        if (sql == null || sql.isBlank()) {
            return resultOf(false, 0, 0, List.of("아티팩트 내용이 비어 있습니다."));
        }
        // override 가 제공되면 아티팩트 content 도 갱신 (별도 트랜잭션에서 뒤에 save 함)
        final boolean overrideProvided = sqlOverride != null && !sqlOverride.isBlank();
        final String finalOverride = sqlOverride;

        int executed = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();

        String[] statements = splitSqlStatements(sql);
        log.info("Executing {} menu SQL statements for session {}", statements.length, sessionId);

        // MSSQL 방언(NEWID()/GETDATE()/N'...') 산출물을 PG (composer-db) 에 실행하면 syntax 오류.
        // 세션 Target DB (실제 화면이 등록될 운영 DB) 의 JdbcTemplate 로 라우팅.
        DataSource targetDs = resolveTargetDataSource(sessionId);
        if (targetDs == null) {
            errors.add("세션의 Target DB 가 설정되지 않았거나 연결 불가합니다. "
                    + "TargetSystemSelector → [💾 Storage] 에서 운영 DB 연결을 확인하세요.");
            return resultOf(false, 0, 0, errors);
        }
        JdbcTemplate targetJdbc = new JdbcTemplate(targetDs);

        // ★ T-SQL 변수 (DECLARE @VAR ... · 후속 statement 가 @VAR 참조) 가 포함되면
        //   variable scope 는 batch 단위라 ';' 로 split 시 분실.
        //   해당 SQL 은 전체를 단일 batch 로 실행 — per-statement 검증/granular 트랜잭션 포기 대신 변수 보존.
        //   화이트리스트 검증은 split 결과로 유지 (모든 statement 가 통과해야 batch 실행).
        boolean usesTsqlVars = containsTsqlDeclareVar(sql);
        if (usesTsqlVars) {
            // 1단계: 화이트리스트·금지키워드·컬럼 검증 (per-statement)
            for (int i = 0; i < statements.length; i++) {
                String stmt = statements[i].trim();
                if (stmt.isEmpty() || stmt.startsWith("--")) continue;
                String upper = stmt.toUpperCase();
                for (String bannedKw : BANNED_KEYWORDS) {
                    if (upper.contains(bannedKw)) {
                        errors.add("차단된 구문: " + bannedKw.trim() + " (statement #" + (i + 1) + ")");
                        return resultOf(false, 0, 0, errors);
                    }
                }
                if (!onlyAllowedTables(upper)) {
                    errors.add("허용되지 않은 테이블 참조 (statement #" + (i + 1) + "): "
                            + stmt.substring(0, Math.min(120, stmt.length())));
                    return resultOf(false, 0, 0, errors);
                }
                String colViolation = validateInsertColumns(stmt);
                if (colViolation != null) {
                    errors.add("존재하지 않는 컬럼명 사용 (statement #" + (i + 1) + "): " + colViolation);
                    return resultOf(false, 0, 0, errors);
                }
            }
            // 2단계: 전체 SQL 을 단일 batch 로 실행
            try {
                targetJdbc.execute(sql);
                // batch 실행은 statement 수 추적 불가 — split 결과로 표시
                int approxExecuted = 0;
                for (String s : statements) {
                    String t = s.trim();
                    if (!t.isEmpty() && !t.startsWith("--")) approxExecuted++;
                }
                executed = approxExecuted;
            } catch (Exception e) {
                String causeMsg = rootMessage(e);
                errors.add("실행 실패 (T-SQL batch): " + causeMsg);
                log.error("Menu SQL batch execute failed sessionId={} error={}", sessionId, causeMsg, e);
                return resultOf(false, 0, skipped, errors);
            }
            // 아티팩트 FINAL 마킹은 아래 공통 로직으로 분기
            return finalizeAndReturn(artifact, finalOverride, overrideProvided, executed, skipped, errors, sessionId);
        }

        for (int i = 0; i < statements.length; i++) {
            String stmt = statements[i].trim();
            if (stmt.isEmpty() || stmt.startsWith("--")) {
                skipped++;
                continue;
            }
            String upper = stmt.toUpperCase();

            // 금지 키워드 차단
            boolean banned = false;
            for (String bannedKw : BANNED_KEYWORDS) {
                if (upper.contains(bannedKw)) {
                    errors.add("차단된 구문: " + bannedKw.trim() + " (statement #" + (i + 1) + ")");
                    banned = true;
                    break;
                }
            }
            if (banned) {
                return resultOf(false, executed, skipped, errors);
            }

            // 허용 테이블만 참조하는지 검증
            if (!onlyAllowedTables(upper)) {
                errors.add("허용되지 않은 테이블 참조 (statement #" + (i + 1) + "): "
                        + stmt.substring(0, Math.min(120, stmt.length())));
                return resultOf(false, executed, skipped, errors);
            }

            // INSERT 컬럼 화이트리스트 검증 — LLM 허구 컬럼 사전 차단
            String colViolation = validateInsertColumns(stmt);
            if (colViolation != null) {
                errors.add("존재하지 않는 컬럼명 사용 (statement #" + (i + 1) + "): " + colViolation);
                errors.add("SQL: " + (stmt.length() > 400 ? stmt.substring(0, 400) + " ..." : stmt));
                return resultOf(false, executed, skipped, errors);
            }

            final String stmtFinal = stmt;
            try {
                // Target DB (MSSQL) 의 JdbcTemplate 이 NEWID()/GETDATE()/N'...' 네이티브 처리.
                // 각 statement 가 자체 connection 으로 auto-commit — 개별 statement 실패에도
                // 이전 성공분은 보존 (composer-db PG 의 perStatementTx 와 동일 의도).
                targetJdbc.execute(stmtFinal);
                executed++;
            } catch (Exception e) {
                String causeMsg = rootMessage(e);
                String snippet = stmtFinal.length() > 400
                        ? stmtFinal.substring(0, 400) + " ..."
                        : stmtFinal;
                errors.add("실행 실패 (statement #" + (i + 1) + "): " + causeMsg);
                errors.add("SQL: " + snippet);
                log.error("Menu SQL execute failed statement=[{}] error={}", stmtFinal, causeMsg, e);
                return resultOf(false, executed, skipped, errors);
            }
        }

        return finalizeAndReturn(artifact, finalOverride, overrideProvided, executed, skipped, errors, sessionId);
    }

    // 'DECLARE @<NAME>' (T-SQL 스칼라 변수 선언) 패턴 감지 — variable scope 보존을 위한 단일 batch 실행 트리거.
    private static final Pattern TSQL_DECLARE_VAR_PATTERN = Pattern.compile(
            "(?i)\\bDECLARE\\s+@[A-Za-z_][A-Za-z0-9_]*\\b");

    private boolean containsTsqlDeclareVar(String sql) {
        if (sql == null || sql.isEmpty()) return false;
        return TSQL_DECLARE_VAR_PATTERN.matcher(sql).find();
    }

    // 아티팩트 FINAL 마킹 + COMPLETED 전이 — per-statement / batch 분기 공용 헬퍼.
    private Map<String, Object> finalizeAndReturn(ComposerArtifact artifact, String finalOverride,
                                                   boolean overrideProvided, int executed, int skipped,
                                                   List<String> errors, String sessionId) {
        try {
            defaultTx.executeWithoutResult(status -> {
                artifact.setStatus(ComposerArtifact.STATUS_FINAL);
                if (overrideProvided) {
                    artifact.setContent(finalOverride);
                }
                artifactRepo.save(artifact);
            });
        } catch (Exception e) {
            log.warn("Artifact FINAL 마킹 실패 (실행 자체는 성공): {}", rootMessage(e));
        }

        // 메뉴등록 + 아티팩트 적용이 모두 완료되면 세션 상태를 COMPLETED 로 전이
        markSessionCompletedIfReady(sessionId);

        return resultOf(true, executed, skipped, errors);
    }

    /**
     * PLANEL 류 Target (menu_source='JS_FILE') 의 메뉴 등록 — TabMenuList.js 에 entry append.
     * MENU_JS 아티팩트의 content (JSON) 에서 entries 배열을 읽어 한 건씩
     * {@link JsMenuFileParser#appendEntry} 호출 (멱등 — 동일 reduxKey 면 skip).
     *
     * @param contentOverride null 이 아니면 아티팩트 content 대신 그 JSON 을 사용
     *                        (트리 픽커로 groupKey 를 변경한 뒤 실행하는 시나리오).
     *                        성공 시 아티팩트 content 도 override 로 갱신.
     */
    public Map<String, Object> executeSessionMenuJs(String sessionId, String contentOverride) {
        if (jsMenuParser == null || targetPathResolver == null) {
            return resultOf(false, 0, 0, List.of(
                    "PLANEL 메뉴 등록에 필요한 빈이 누락: jsMenuParser/targetPathResolver"));
        }

        List<ComposerArtifact> artifacts = artifactRepo
                .findBySessionIdAndArtifactTypeOrderByCreateDttmDesc(
                        sessionId, ComposerArtifact.TYPE_MENU_JS)
                .stream()
                .filter(a -> !ComposerArtifact.STATUS_DISCARDED.equals(a.getStatus()))
                .collect(java.util.stream.Collectors.toList());

        if (artifacts.isEmpty()) {
            return resultOf(false, 0, 0, List.of(
                    "MENU_JS 타입 아티팩트가 없습니다. PLANEL Target 의 메뉴 등록은 "
                  + "src/pages/TabMenuList.entries.json 형식의 산출물이 필요합니다."));
        }

        ComposerArtifact artifact = artifacts.get(0);
        final boolean overrideProvided = contentOverride != null && !contentOverride.isBlank();
        String content = overrideProvided ? contentOverride : artifact.getContent();
        if (content == null || content.isBlank()) {
            return resultOf(false, 0, 0, List.of("MENU_JS 아티팩트 내용이 비어 있습니다."));
        }

        // 세션의 targetCd 로 PLANEL 소스 루트 → TabMenuList.js 후보 lookup
        String targetCd = sessionRepo.findById(sessionId)
                .map(ComposerSession::getTargetCd).orElse(null);
        Path tabMenuFile = locateTabMenuListJs(targetCd);
        if (tabMenuFile == null) {
            return resultOf(false, 0, 0, List.of(
                    "TabMenuList.js 파일을 찾지 못함. Target=" + targetCd
                  + " 의 source_ref_path / TARGET_<CD>_WINGUI_PATH (.env) 확인 필요."));
        }

        // content (JSON) 파싱 — `entries` 배열 또는 단일 entry 객체 모두 허용
        List<JsonNode> entryNodes = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(content);
            JsonNode entries = root.get("entries");
            if (entries != null && entries.isArray()) {
                entries.forEach(entryNodes::add);
            } else if (root.has("reduxKey")) {
                // 단일 entry 형태 — wrap
                entryNodes.add(root);
            } else {
                return resultOf(false, 0, 0, List.of(
                        "MENU_JS JSON 에 entries 배열이 없습니다. content 첫 줄: "
                        + content.substring(0, Math.min(120, content.length()))));
            }
        } catch (Exception e) {
            return resultOf(false, 0, 0, List.of(
                    "MENU_JS JSON 파싱 실패: " + rootMessage(e)));
        }

        int executed = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();
        List<Map<String, Object>> details = new ArrayList<>();

        for (int i = 0; i < entryNodes.size(); i++) {
            JsonNode e = entryNodes.get(i);
            JsMenuFileParser.AppendSpec spec;
            try {
                spec = buildAppendSpec(e);
            } catch (Exception ex) {
                errors.add("entry #" + (i + 1) + " spec 변환 실패: " + ex.getMessage());
                return resultOf(false, executed, skipped, errors);
            }

            try {
                JsMenuFileParser.AppendResult r = jsMenuParser.appendEntry(tabMenuFile, spec);
                Map<String, Object> d = new HashMap<>();
                d.put("reduxKey", spec.getReduxKey());
                d.put("added", r.isAdded());
                d.put("importAdded", r.isImportAdded());
                d.put("groupCreated", r.isGroupCreated());
                d.put("group", r.getResolvedGroupKey());
                d.put("message", r.getMessage());
                details.add(d);
                if (r.isAdded()) executed++;
                else skipped++;
            } catch (IOException | RuntimeException ex) {
                String msg = rootMessage(ex);
                errors.add("entry #" + (i + 1) + " (reduxKey=" + spec.getReduxKey() + ") append 실패: " + msg);
                log.error("TabMenuList.js append failed sessionId={} entry={}", sessionId, spec.getReduxKey(), ex);
                return resultOf(false, executed, skipped, errors);
            }
        }

        final String finalContent = content;
        try {
            defaultTx.executeWithoutResult(status -> {
                artifact.setStatus(ComposerArtifact.STATUS_FINAL);
                if (overrideProvided) {
                    artifact.setContent(finalContent);
                }
                artifactRepo.save(artifact);
            });
        } catch (Exception e) {
            log.warn("MENU_JS 아티팩트 FINAL 마킹 실패 (적용 자체는 성공): {}", rootMessage(e));
        }

        markSessionCompletedIfReady(sessionId);

        Map<String, Object> result = resultOf(true, executed, skipped, errors);
        result.put("details", details);
        result.put("file", tabMenuFile.toString());
        return result;
    }

    /** session.targetCd 의 menu_source 컬럼이 'JS_FILE' 인지 검사. */
    private boolean isJsFileMenuSource(String sessionId) {
        if (targetRepo == null) return false;
        try {
            String targetCd = sessionRepo.findById(sessionId)
                    .map(ComposerSession::getTargetCd).orElse(null);
            if (targetCd == null || targetCd.isBlank()) return false;
            String menuSource = targetRepo.findById(targetCd)
                    .map(TargetSystem::getMenuSource).orElse(null);
            return "JS_FILE".equalsIgnoreCase(menuSource);
        } catch (Exception e) {
            log.warn("menu_source 조회 실패 sessionId={}: {}", sessionId, rootMessage(e));
            return false;
        }
    }

    /** Target source 루트에서 TabMenuList.js 후보 파일 lookup. 없으면 null. */
    private Path locateTabMenuListJs(String targetCd) {
        String sourceRoot = targetPathResolver.resolveSourcePath(targetCd);
        if (sourceRoot == null || sourceRoot.isBlank()) return null;
        // TargetMenuController.loadJsFileMenus 의 후보 순서와 동일
        String[] candidates = {
                "src/pages/TabMenuList.js",
                "src/pages/TabMenuList.jsx",
                "src/TabMenuList.js",
        };
        for (String rel : candidates) {
            Path p = Paths.get(sourceRoot, rel);
            if (Files.exists(p) && Files.isRegularFile(p)) return p;
        }
        log.warn("TabMenuList.js 후보 모두 미존재 sourceRoot={}", sourceRoot);
        return null;
    }

    /** JsonNode → JsMenuFileParser.AppendSpec 변환. 필수 필드 누락 시 IllegalArgumentException. */
    private JsMenuFileParser.AppendSpec buildAppendSpec(JsonNode e) {
        String reduxKey = textOrNull(e, "reduxKey");
        String title = textOrNull(e, "title");
        String componentName = textOrNull(e, "componentName");
        if (reduxKey == null || reduxKey.isBlank())
            throw new IllegalArgumentException("reduxKey 필드가 비어 있습니다.");
        if (title == null || title.isBlank())
            throw new IllegalArgumentException("title 필드가 비어 있습니다.");
        if (componentName == null || componentName.isBlank())
            throw new IllegalArgumentException("componentName 필드가 비어 있습니다.");

        return JsMenuFileParser.AppendSpec.builder()
                .reduxKey(reduxKey)
                .title(title)
                .componentName(componentName)
                .componentPath(textOrNull(e, "componentPath"))
                .groupKey(textOrNull(e, "groupKey"))
                .iconName(textOrNull(e, "iconName"))
                .key(e.has("key") && e.get("key").isInt() ? e.get("key").asInt() : null)
                .build();
    }

    private static String textOrNull(JsonNode n, String field) {
        JsonNode v = n.get(field);
        return (v != null && !v.isNull()) ? v.asText() : null;
    }

    /**
     * 세션의 메뉴등록과 아티팩트 적용이 모두 완료되었는지 확인하고, 완료 상태이면
     * 세션을 {@link ComposerSession#STATUS_COMPLETED} 로 전이한다.
     *
     * 완료 조건: 메뉴등록 아티팩트(MENU_SQL 또는 MENU_JS) STATUS_FINAL + 그 외 타입 아티팩트
     *          STATUS_FINAL 이 각각 1건 이상 존재. (Target.menu_source 에 따라 MENU_SQL/MENU_JS)
     * 이미 COMPLETED 이거나 ARCHIVED 면 변경하지 않는다.
     */
    private void markSessionCompletedIfReady(String sessionId) {
        try {
            boolean menuSqlDone = artifactRepo.existsBySessionIdAndArtifactTypeAndStatus(
                    sessionId, ComposerArtifact.TYPE_MENU_SQL, ComposerArtifact.STATUS_FINAL);
            boolean menuJsDone = artifactRepo.existsBySessionIdAndArtifactTypeAndStatus(
                    sessionId, ComposerArtifact.TYPE_MENU_JS, ComposerArtifact.STATUS_FINAL);
            boolean menuDone = menuSqlDone || menuJsDone;
            // 그 외 아티팩트 = MENU_SQL 도 MENU_JS 도 아닌 것
            boolean artifactsApplied = artifactRepo.existsNonMenuArtifactFinal(
                    sessionId,
                    Arrays.asList(ComposerArtifact.TYPE_MENU_SQL, ComposerArtifact.TYPE_MENU_JS),
                    ComposerArtifact.STATUS_FINAL);
            if (!menuDone || !artifactsApplied) return;

            defaultTx.executeWithoutResult(s -> sessionRepo.findById(sessionId).ifPresent(session -> {
                if (ComposerSession.STATUS_ACTIVE.equals(session.getStatus())) {
                    session.setStatus(ComposerSession.STATUS_COMPLETED);
                    sessionRepo.save(session);
                    log.info("Composer session {} 상태 COMPLETED 로 전이 (menu+artifact 완료)", sessionId);
                }
            }));
        } catch (Exception e) {
            log.warn("Session COMPLETED 전이 실패 (실행 자체는 성공) sessionId={}: {}", sessionId, rootMessage(e));
        }
    }

    private String rootMessage(Throwable t) {
        Throwable cur = t;
        while (cur.getCause() != null && cur.getCause() != cur) {
            cur = cur.getCause();
        }
        String msg = cur.getMessage();
        return msg == null ? cur.getClass().getSimpleName() : msg;
    }

    /**
     * SQL 을 세미콜론 기준으로 분리.
     *  - 문자열 리터럴('...') 및 N'...' 내부의 세미콜론은 분리자로 취급하지 않음
     *  - 줄 단위 주석 `-- ...` 제거
     *  - 블록 주석 `/* ... *\/` 제거
     *  - T-SQL `GO` 배치 구분자 제거
     *  - 빈 statement · 공백만 있는 statement 제거
     *  - BOM / 개행 정규화
     */
    private String[] splitSqlStatements(String sql) {
        // BOM · CRLF 정규화
        String cleaned = sql.replace("﻿", "").replace("\r\n", "\n").replace('\r', '\n');
        // 블록 주석 제거
        cleaned = cleaned.replaceAll("(?s)/\\*.*?\\*/", "");
        // 줄 주석 제거 (하지만 '--' 가 문자열 안에 올 수도 있음 — 메뉴 SQL 에선 드문 편이지만 간단 처리)
        cleaned = cleaned.replaceAll("(?m)--[^\\n]*", "");
        // GO 배치 구분자 제거 (한 줄에 GO 만 있는 경우)
        cleaned = cleaned.replaceAll("(?im)^\\s*GO\\s*$", "");

        List<String> result = new ArrayList<>();
        StringBuilder buf = new StringBuilder();
        boolean inSingleQuote = false;
        int len = cleaned.length();
        for (int i = 0; i < len; i++) {
            char c = cleaned.charAt(i);
            if (inSingleQuote) {
                buf.append(c);
                if (c == '\'') {
                    // escaped '' — 다음 '도 리터럴 일부
                    if (i + 1 < len && cleaned.charAt(i + 1) == '\'') {
                        buf.append('\'');
                        i++;
                    } else {
                        inSingleQuote = false;
                    }
                }
            } else if (c == '\'') {
                buf.append(c);
                inSingleQuote = true;
            } else if (c == ';') {
                String stmt = buf.toString().trim();
                if (!stmt.isEmpty()) result.add(stmt);
                buf.setLength(0);
            } else {
                buf.append(c);
            }
        }
        String last = buf.toString().trim();
        if (!last.isEmpty()) result.add(last);
        return result.toArray(new String[0]);
    }

    private boolean onlyAllowedTables(String upperSql) {
        // 화이트리스트에 없는 TB_ 접두어 테이블이 발견되면 거부
        int idx = 0;
        while ((idx = upperSql.indexOf("TB_", idx)) >= 0) {
            int end = idx;
            while (end < upperSql.length()
                    && (Character.isLetterOrDigit(upperSql.charAt(end)) || upperSql.charAt(end) == '_')) {
                end++;
            }
            String tableName = upperSql.substring(idx, end);
            if (!ALLOWED_TABLES.contains(tableName)) {
                log.warn("Disallowed table reference: {}", tableName);
                return false;
            }
            idx = end;
        }
        return true;
    }

    /**
     * INSERT 문의 컬럼 리스트가 실제 테이블 스키마와 일치하는지 검증.
     * LLM 이 허구 컬럼명(MENU_NM · PARENT_MENU_CD · DEPTH 등)을 생성하는 경우를 차단.
     * 통과 = null 반환, 위반 = 사람이 읽을 수 있는 에러 문자열 반환.
     */
    private String validateInsertColumns(String stmt) {
        Matcher m = INSERT_COLS_PATTERN.matcher(stmt);
        while (m.find()) {
            String table = m.group(1).toUpperCase();
            Set<String> allowed = TABLE_COLUMNS.get(table);
            if (allowed == null) continue;   // 스키마 매핑 없는 테이블은 skip (TB_AD_MANUAL 등)
            String colList = m.group(2);
            for (String raw : colList.split(",")) {
                String col = raw.trim().replaceAll("[\\[\\]\"`]", "").toUpperCase();
                if (col.isEmpty()) continue;
                if (!allowed.contains(col)) {
                    String suggest = suggestFix(table, col);
                    return table + "." + col + " 는 존재하지 않는 컬럼입니다. "
                         + "허용 컬럼: " + String.join(", ", allowed)
                         + (suggest != null ? " · 힌트: " + suggest : "");
                }
            }
        }
        return null;
    }

    /** 자주 혼동되는 LLM 허구 컬럼 → 실제 컬럼 매핑 힌트 */
    private String suggestFix(String table, String col) {
        if ("TB_AD_MENU".equals(table)) {
            switch (col) {
                case "MENU_NM":         return "MENU_NM 은 TB_AD_LANG_PACK(LANG_KEY=MENU_CD) 로 분리 등록";
                case "PARENT_MENU_CD":  return "PARENT_ID 로 바꾸고 `(SELECT ID FROM TB_AD_MENU WHERE MENU_CD='...')` 서브쿼리 사용";
                case "URL":             return "URL 컬럼 없음. MENU_FILE_PATH 사용";
                case "DEPTH":           return "DEPTH 컬럼 없음 (자동 계산)";
                case "SORT_ORDER":      return "SORT_ORDER → MENU_SEQ";
                default: return null;
            }
        }
        return null;
    }

    private Map<String, Object> resultOf(boolean success, int executed, int skipped, List<String> errors) {
        Map<String, Object> r = new HashMap<>();
        r.put("success",  success);
        r.put("executed", executed);
        r.put("skipped",  skipped);
        r.put("errors",   errors);
        return r;
    }

    /**
     * 등록 전 검증 — 지정한 부모 메뉴가 실제로 존재하는지 확인 (UI 확인용)
     */
    @Transactional(readOnly = true)
    public boolean parentMenuExists(String menuCd) {
        if (menuCd == null || menuCd.isBlank()) return false;
        Object cnt = em.createNativeQuery(
                "SELECT COUNT(*) FROM TB_AD_MENU WHERE MENU_CD = :cd")
                .setParameter("cd", menuCd)
                .getSingleResult();
        return cnt != null && ((Number) cnt).intValue() > 0;
    }
}

package com.zionex.t3composer.domain.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.PathMatcher;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.sql.Connection;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.sql.DataSource;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import com.zionex.t3composer.config.ApplicationProperties;
import com.zionex.t3composer.domain.entity.ComposerArtifact;
import com.zionex.t3composer.domain.entity.ComposerSession;
import com.zionex.t3composer.domain.repository.ComposerArtifactRepository;
import com.zionex.t3composer.domain.repository.ComposerSessionRepository;

import lombok.extern.slf4j.Slf4j;

/**
 * Composer 세션의 아티팩트를 실제 프로젝트 경로에 **쓰기** 및 DB 에 **실행** 한다.
 *
 * 안전 가드:
 *  - app.composer.auto-apply-enabled=true 여야 동작 (프로덕션 기본 false)
 *  - app.composer.project-root 하위로만 쓰기 허용 (..・절대경로 탈출 차단)
 *  - allow-write-patterns 글롭과 일치하는 경로만 허용
 *  - DDL: `CREATE TABLE TB_*` 만 허용 (DROP/TRUNCATE/ALTER 금지)
 *  - SP:  `CREATE [OR ALTER] PROCEDURE SP_UI_*` 만 허용
 *  - 각 statement 는 per-statement 트랜잭션
 */
@Slf4j
@Service
public class ArtifactApplyService {

    private static final Pattern DDL_CREATE_TABLE =
            Pattern.compile("\\bCREATE\\s+TABLE\\s+(?:\\[?dbo\\]?\\s*\\.\\s*)?\\[?TB_[A-Z_]+",
                    Pattern.CASE_INSENSITIVE);
    private static final Pattern DDL_SAFE_ALTER =
            Pattern.compile("\\bALTER\\s+TABLE\\s+(?:\\[?dbo\\]?\\s*\\.\\s*)?\\[?TB_[A-Z_]+\\]?\\s+(ADD|ALTER\\s+COLUMN)\\s+",
                    Pattern.CASE_INSENSITIVE);
    // CREATE INDEX / VIEW — TB_* 또는 IDX_/IX_/VW_ 접두어. 보조 객체.
    private static final Pattern DDL_CREATE_INDEX =
            Pattern.compile("\\bCREATE\\s+(UNIQUE\\s+)?(CLUSTERED\\s+|NONCLUSTERED\\s+)?INDEX\\s+\\[?(IX_|IDX_)[A-Z0-9_]+",
                    Pattern.CASE_INSENSITIVE);
    private static final Pattern DDL_CREATE_VIEW =
            Pattern.compile("\\bCREATE\\s+(OR\\s+ALTER\\s+)?VIEW\\s+(?:\\[?dbo\\]?\\s*\\.\\s*)?\\[?VW_",
                    Pattern.CASE_INSENSITIVE);
    private static final Pattern DDL_DROP_TABLE_GUARD =
            Pattern.compile("\\bIF\\s+OBJECT_ID\\([^)]*\\)\\s+IS\\s+NOT\\s+NULL\\s+DROP\\s+TABLE\\s+(?:\\[?dbo\\]?\\s*\\.\\s*)?\\[?TB_",
                    Pattern.CASE_INSENSITIVE);
    private static final Pattern DDL_DROP_INDEX_GUARD =
            Pattern.compile("\\bIF\\s+EXISTS\\s*\\([^)]*\\)\\s+DROP\\s+INDEX|\\bDROP\\s+INDEX\\s+IF\\s+EXISTS",
                    Pattern.CASE_INSENSITIVE);
    // 스키마 접두어는 5가지 형식 모두 허용 (없음 / dbo. / [dbo]. / [dbo].[ / dbo.[ ).
    // SSMS / SQL Server Management Studio 가 자동 생성하는 [dbo].[SP_UI_*] 형식 호환.
    private static final Pattern SP_CREATE =
            Pattern.compile("^\\s*CREATE\\s+(OR\\s+ALTER\\s+)?(PROCEDURE|PROC|FUNCTION)" +
                            "\\s+(?:\\[?dbo\\]?\\s*\\.\\s*)?\\[?SP_UI_",
                    Pattern.CASE_INSENSITIVE);
    private static final Pattern SP_FN_CREATE =
            Pattern.compile("^\\s*CREATE\\s+(OR\\s+ALTER\\s+)?FUNCTION" +
                            "\\s+(?:\\[?dbo\\]?\\s*\\.\\s*)?\\[?FN_",
                    Pattern.CASE_INSENSITIVE);
    /**
     * DROP guard — Composer 가 자주 쓰는 idempotent 패턴:
     *   IF OBJECT_ID('dbo.SP_UI_*', 'P') IS NOT NULL DROP PROCEDURE dbo.SP_UI_*
     * CREATE OR ALTER 가 있으면 사실 불필요하지만 LLM 산출물에 자주 등장.
     * 이름이 SP_UI_* 또는 FN_* 인 경우만 허용 — 다른 객체 DROP 은 BANNED_INLINE 으로 차단.
     */
    private static final Pattern SP_DROP_GUARD =
            Pattern.compile("^\\s*IF\\s+OBJECT_ID\\s*\\(\\s*'(?:\\[?dbo\\]?\\.)?\\[?(SP_UI_|FN_)[A-Z0-9_]+\\]?'" +
                            "\\s*,\\s*'(?:P|FN|IF|TF)'\\s*\\)\\s*IS\\s+NOT\\s+NULL" +
                            "\\s+DROP\\s+(?:PROCEDURE|FUNCTION)\\s+(?:\\[?dbo\\]?\\.)?\\[?(SP_UI_|FN_)",
                    Pattern.CASE_INSENSITIVE);
    // 파괴적 구문 — DDL/SP 안에 포함되면 거부 (단, SP_UI_/FN_ 만 대상으로 한 DROP 은 SP_DROP_GUARD 에서 별도 허용)
    private static final List<String> BANNED_INLINE = List.of(
            "DROP TABLE ", "DROP DATABASE ", "TRUNCATE ", "SHUTDOWN",
            "xp_cmdshell", "BULK INSERT", "OPENROWSET"
    );

    @PersistenceContext
    private EntityManager em;

    private final ApplicationProperties props;
    private final ComposerArtifactRepository artifactRepo;
    private final ComposerSessionRepository sessionRepo;
    private final TransactionTemplate perStatementTx;
    private final DataSource dataSource;

    private final ArtifactNormalizer artifactNormalizer;
    private final SpScreenNoAllocator screenNoAllocator;
    private final com.zionex.t3composer.domain.schema.SchemaInspectionService schemaInspectionService;
    private final ComposerObjectsRegistry objectsRegistry;
    /** 세션 Target DB 로 SQL 실행을 라우팅 — 정적 targetDataSource 가 아닌, 세션이 지정한 운영 DB 에서 검증·적용. */
    private final com.zionex.t3composer.config.TargetDataSourceRegistry dsRegistry;

    public ArtifactApplyService(ApplicationProperties props,
                                ComposerArtifactRepository artifactRepo,
                                ComposerSessionRepository sessionRepo,
                                PlatformTransactionManager txManager,
                                @org.springframework.beans.factory.annotation.Qualifier("targetDataSource")
                                DataSource dataSource,
                                ArtifactNormalizer artifactNormalizer,
                                SpScreenNoAllocator screenNoAllocator,
                                com.zionex.t3composer.domain.schema.SchemaInspectionService schemaInspectionService,
                                ComposerObjectsRegistry objectsRegistry,
                                com.zionex.t3composer.config.TargetDataSourceRegistry dsRegistry) {
        this.props = props;
        this.artifactRepo = artifactRepo;
        this.sessionRepo = sessionRepo;
        this.perStatementTx = new TransactionTemplate(txManager);
        this.perStatementTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.dataSource = dataSource;
        this.artifactNormalizer = artifactNormalizer;
        this.screenNoAllocator = screenNoAllocator;
        this.schemaInspectionService = schemaInspectionService;
        this.objectsRegistry = objectsRegistry;
        this.dsRegistry = dsRegistry;
    }

    /**
     * 적용 직전 사전 검증 — 자주 발생하는 오류를 자동 보정해 DB 에 저장하고 결과 반환.
     * 보정된 아티팩트는 STATUS 그대로(DRAFT/FINAL) 유지하고 content 만 갱신.
     */
    public Map<String, Object> preflight(String sessionId) {
        List<ComposerArtifact> artifacts =
                artifactRepo.findBySessionIdAndStatusNotOrderByCreateDttmDesc(
                        sessionId, ComposerArtifact.STATUS_DISCARDED);

        Map<String, Object> out = new LinkedHashMap<>();
        if (artifacts.isEmpty()) {
            out.put("success", true);
            out.put("totalFixCount", 0);
            out.put("fileCount", 0);
            out.put("files", new ArrayList<>());
            out.put("note", "(아티팩트 없음 — 검증할 내용 없음)");
            return out;
        }

        ArtifactNormalizer.NormalizationResult result = artifactNormalizer.normalize(artifacts);
        // 변경된 아티팩트 persist — content 만 갱신
        if (result.totalFixCount > 0) {
            for (ArtifactNormalizer.FileNormalization fn : result.fileNormalizations) {
                artifactRepo.findById(fn.artifactId).ifPresent((a) -> {
                    a.setContent(fn.normalizedContent);
                    artifactRepo.save(a);
                });
            }
            log.info("Composer preflight 보정: sessionId={} totalFixes={} files={}",
                    sessionId, result.totalFixCount, result.fileNormalizations.size());
        }

        Map<String, Object> body = result.toResponseMap();
        out.put("success", true);
        out.putAll(body);
        return out;
    }

    /**
     * 세션의 선택된 아티팩트에 대해 파일 저장 / DDL 실행 / SP 실행을 수행.
     * opts: applyFiles · executeDdl · executeSp · overwrite
     */
    public Map<String, Object> apply(String sessionId, ApplyOptions opts) {
        // Server admin policy — auto-apply 기능 자체가 OFF 면 어떤 옵션이든 적용 차단
        if (!props.getComposer().isAutoApplyEnabled()) {
            return autoApplyDisabled(sessionId);
        }
        if (opts == null) opts = new ApplyOptions();
        // ★ 정책 변경 (2026-04): 파일 저장 / DDL / SP 실행은 autoApply 와 무관하게 항상 수행한다.
        //   autoApply 체크박스는 control-plane 작업 (npm run build · mvn compile = 재빌드/재컴파일)
        //   의 트리거 여부만 결정. 데이터 평면(file/DDL/SP) 은 admin policy 만 통과하면 항상 실행.
        String root = props.getComposer().getProjectRoot();
        if (root == null || root.isBlank()) {
            return failure("app.composer.project-root 가 설정되지 않았습니다.");
        }
        Path rootPath;
        try {
            rootPath = Paths.get(root).toAbsolutePath().normalize();
        } catch (Exception e) {
            return failure("project-root 경로 오류: " + e.getMessage());
        }
        if (!Files.isDirectory(rootPath)) {
            return failure("project-root 가 존재하지 않습니다: " + rootPath);
        }

        // Supersede 된 이전 버전(STATUS_DISCARDED) 은 apply 대상에서 제외 — 항상 최신만 적용
        List<ComposerArtifact> artifacts =
                artifactRepo.findBySessionIdAndStatusNotOrderByCreateDttmDesc(
                        sessionId, ComposerArtifact.STATUS_DISCARDED);
        if (artifacts.isEmpty()) {
            return failure("세션에 아티팩트가 없습니다.");
        }
        // 테이블명 충돌 검사를 세션의 Target DB(targetCd) 기준으로 수행 —
        // targetCd 누락 시 composer-db(PG) 만 조회돼 운영 테이블을 "미존재" 로 오판, 충돌 미검출.
        String targetCd = sessionRepo.findById(sessionId)
                .map((s) -> s.getTargetCd()).orElse(null);

        // 사전 검증 — 자주 발생하는 오류를 자동 보정 후 적용 (이중 안전망 — 사용자가 preflight
        // 를 명시적으로 호출하지 않아도 apply 시 자동 보정 + 변경분 persist).
        ArtifactNormalizer.NormalizationResult preflight = artifactNormalizer.normalize(artifacts);
        if (preflight.totalFixCount > 0) {
            for (ArtifactNormalizer.FileNormalization fn : preflight.fileNormalizations) {
                artifactRepo.findById(fn.artifactId).ifPresent((a) -> {
                    a.setContent(fn.normalizedContent);
                    artifactRepo.save(a);
                });
            }
            log.info("Composer apply 사전 보정: sessionId={} totalFixes={} files={}",
                    sessionId, preflight.totalFixCount, preflight.fileNormalizations.size());
        }

        // ──────────────────────────────────────────────────────────────
        // wingui 네이티브 규약 정책 검증 (신규 모드 한정)
        // Composer 신규 화면은 반드시 JPA + RestController 로 구성되어야 함.
        // SP/XML 아티팩트가 신규 모드에서 발견되면 경고만 남기고 진행하지 않는다.
        // 사용자가 명시적으로 엔진 경유를 요청한 경우 opts.overridePolicyCheck=true 로 우회.
        // ──────────────────────────────────────────────────────────────
        ComposerSession session = sessionRepo.findById(sessionId).orElse(null);
        List<String> policyViolations = checkWinguiNativePolicy(artifacts, session);
        if (!policyViolations.isEmpty() && !opts.overridePolicyCheck) {
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("success", false);
            out.put("policyBlocked", true);
            out.put("policyViolations", policyViolations);
            out.put("hint", "wingui 네이티브 규약 위반. 'ut/' 경로 위반 / SP·DDL 누락 / 엔진 XML 등이 있는지 확인하세요. " +
                    "Composer 채팅으로 'ut/ 경로를 util/ 로 정정해줘' 요청 또는 정책 우회가 명시적으로 필요하면 apply 요청에 overridePolicyCheck=true 포함. " +
                    "상세: .claude/rules/41-composer-generation.md · CLAUDE.md §1.-1 (path convention)");
            log.warn("Composer policy 위반 차단 sessionId={} violations={}", sessionId, policyViolations);
            return out;
        }

        // SP 이름 충돌 검증 — 다른 화면이 사용 중인 SP 를 덮어쓰는 사고 방지 (2026-04-29 사고 후 추가).
        // SP 가 이미 DB 에 존재하는데, 같은 세션에서 이전에 적용한 적이 없는 SP 면 외부 SP → 차단.
        if (opts.executeSp && !opts.overrideSpCollisionCheck) {
            List<String> spCollisions = checkSpNameCollisions(sessionId, artifacts);
            if (!spCollisions.isEmpty()) {
                Map<String, Object> out = new LinkedHashMap<>();
                out.put("success", false);
                out.put("spCollisionBlocked", true);
                out.put("spCollisions", spCollisions);
                out.put("hint", "SP 이름이 다른 화면이 사용 중인 기존 SP 와 충돌합니다. " +
                        "(a) Composer 채팅으로 'SP 이름을 SP_UI_<DOMAIN>_<더 큰 NN>_Q1 등으로 바꿔줘' 요청 → 새 NN 으로 재생성, " +
                        "또는 (b) 의도적으로 기존 SP 를 ALTER 하려면 apply 요청에 overrideSpCollisionCheck=true 를 포함하세요. " +
                        "권장 SCREEN_NO 는 system prompt 의 도메인별 표 참조.");
                log.warn("Composer SP 이름 충돌 차단 sessionId={} collisions={}", sessionId, spCollisions);
                return out;
            }
        }

        // 테이블 이름 충돌 검증 — DDL 의 CREATE TABLE TB_X 가 DB 에 이미 존재하면 차단 (2026-04-30 추가).
        // 정책: 존재하는 테이블은 기존 Entity 재사용 — 새 DDL 절대 금지.
        // ALTER TABLE 은 DDL_SAFE_ALTER 규칙으로 별도 허용되므로 여기서는 CREATE 만 검사.
        if (opts.executeDdl && !opts.overrideTableCollisionCheck) {
            List<String> tblCollisions = checkTableNameCollisions(artifacts, targetCd);
            if (!tblCollisions.isEmpty()) {
                Map<String, Object> out = new LinkedHashMap<>();
                out.put("success", false);
                out.put("tableCollisionBlocked", true);
                out.put("tableCollisions", tblCollisions);
                out.put("hint", "DDL 의 CREATE TABLE 이 DB 에 이미 존재하는 테이블과 충돌합니다. " +
                        "기존 테이블을 재사용해야 합니다. " +
                        "(a) Composer 채팅으로 '기존 테이블 <TB_NAME> 을 그대로 사용해줘' 요청 → 새 DDL 제거 + Entity 재사용, " +
                        "또는 (b) 의도적으로 기존 테이블을 ALTER 하려면 ALTER TABLE 구문으로 변경 후 재생성, " +
                        "또는 (c) apply 요청에 overrideTableCollisionCheck=true 포함 (위험 — 데이터 유실 가능).");
                log.warn("Composer 테이블 이름 충돌 차단 sessionId={} collisions={}", sessionId, tblCollisions);
                return out;
            }
        }

        List<Map<String, Object>> applied = new ArrayList<>();
        int fileOk = 0, fileFail = 0, ddlOk = 0, ddlFail = 0, spOk = 0, spFail = 0;

        for (ComposerArtifact a : artifacts) {
            String type = a.getArtifactType();
            String content = a.getContent();
            if (content == null || content.isBlank()) continue;

            boolean isFileType = isFileArtifactType(type);
            boolean isDdl      = ComposerArtifact.TYPE_SQL_DDL.equals(type);
            boolean isSp       = ComposerArtifact.TYPE_SQL_SP.equals(type);

            // 1) 파일 쓰기 (JSX / Java / menus.js / DDL / SP 모두)
            if (opts.applyFiles && (isFileType || isDdl || isSp)) {
                String targetPath = resolveTargetPath(a, rootPath);
                Map<String, Object> record = new LinkedHashMap<>();
                record.put("id",   a.getId());
                record.put("type", type);
                record.put("fileName", a.getFileName());
                record.put("originalFilePath", a.getFilePath());   // Claude 원본 경로
                record.put("filePath", targetPath);                // 실제 저장 경로
                if (targetPath != null && a.getFilePath() != null
                        && !targetPath.equals(a.getFilePath().replaceFirst("^/+", ""))) {
                    record.put("remapped", true);
                }
                try {
                    if (targetPath == null) {
                        throw new IllegalArgumentException(
                                "저장 경로를 확정할 수 없음 (fileName 으로 auto-route 실패): "
                                + a.getFilePath());
                    }
                    Path abs = rootPath.resolve(targetPath).normalize();
                    ensureUnderRoot(rootPath, abs);
                    ensureMatchesAllowList(rootPath, abs);
                    if (!opts.overwrite && Files.exists(abs)) {
                        record.put("fileOk", false);
                        record.put("fileErr", "이미 존재 (overwrite=false)");
                        fileFail++;
                    } else {
                        Files.createDirectories(abs.getParent());
                        Files.writeString(abs, content, StandardCharsets.UTF_8,
                                StandardOpenOption.CREATE,
                                StandardOpenOption.TRUNCATE_EXISTING,
                                StandardOpenOption.WRITE);
                        record.put("fileOk", true);
                        fileOk++;
                    }
                } catch (Exception e) {
                    record.put("fileOk", false);
                    record.put("fileErr", e.getMessage());
                    fileFail++;
                    log.warn("파일 쓰기 실패 type={} filePath={} err={}", type, a.getFilePath(), e.getMessage());
                }
                applied.add(record);
            }

            // 2) DDL 실행
            if (opts.executeDdl && isDdl) {
                Map<String, Object> rec = execSqlBatch(a, content, "DDL", ArtifactApplyService::validateDdl);
                applied.add(rec);
                if (Boolean.TRUE.equals(rec.get("execOk"))) ddlOk++; else ddlFail++;
            }

            // 3) SP 실행
            if (opts.executeSp && isSp) {
                Map<String, Object> rec = execSqlBatch(a, content, "SP", ArtifactApplyService::validateSp);
                applied.add(rec);
                if (Boolean.TRUE.equals(rec.get("execOk"))) spOk++; else spFail++;
            }
        }

        boolean success = fileFail == 0 && ddlFail == 0 && spFail == 0;
        boolean anyWork = fileOk > 0 || ddlOk > 0 || spOk > 0;

        // 성공 시 적용된(파일쓰기/DDL/SP) 아티팩트를 STATUS_FINAL 로 마킹하고,
        // 메뉴등록까지 완료된 세션은 COMPLETED 로 전이.
        if (success && anyWork) {
            markAppliedArtifactsFinal(artifacts, applied);
            markSessionCompletedIfReady(sessionId);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("success",  success);
        out.put("fileOk",   fileOk);
        out.put("fileFail", fileFail);
        out.put("ddlOk",    ddlOk);
        out.put("ddlFail",  ddlFail);
        out.put("spOk",     spOk);
        out.put("spFail",   spFail);
        out.put("items",    applied);
        // 사전 보정 결과 — 사용자에게 무엇을 자동 수정했는지 보여주기 위해 함께 반환
        if (preflight.totalFixCount > 0) {
            out.put("preflight", preflight.toResponseMap());
        }

        // Control-plane 트리거 — autoApply 가 ON 이고 apply 자체가 어느 정도 성공한 경우만.
        // (file/DDL/SP 가 모두 0 건이면 재빌드 의미 없음)
        if (anyWork) {
            out.put("controlPlane", triggerControlPlane(rootPath, opts.autoApply));
        }
        return out;
    }

    /**
     * 재빌드 / 재컴파일 트리거 — apply 자체와는 분리된 "control plane".
     *
     * autoApply=true:
     *   1) frontend: cd t3series-wingui/packages/wingui && npm run build  (백그라운드)
     *   2) backend : mvn -pl t3series-wingui compile -DskipTests          (백그라운드 — DevTools 사용 시 자동 reload)
     *   ※ JVM 자체 재시작은 OS 레벨이라 자동화 불가 — 사용자가 IDE/스크립트로 수행하거나 Spring DevTools 활용.
     *
     * autoApply=false: 트리거 안 함. 응답에 수동 수행 가이드 포함.
     */
    private Map<String, Object> triggerControlPlane(Path rootPath, boolean autoApply) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("autoApply", autoApply);
        if (!autoApply) {
            out.put("triggered", false);
            out.put("note", "자동적용 OFF — 재빌드/재기동 수동 수행 필요");
            out.put("manualSteps", List.of(
                "프런트 재빌드: cd t3series-wingui/packages/wingui && npm run build",
                "백엔드 재컴파일: mvn -pl t3series-wingui compile -DskipTests",
                "wingui 재시작: 현재 실행 중인 JVM 종료 후 재기동 (IDE 또는 mvn spring-boot:run)"
            ));
            return out;
        }

        List<Map<String, Object>> jobs = new ArrayList<>();
        boolean isWindows = System.getProperty("os.name", "").toLowerCase().contains("win");

        // 1) Frontend rebuild — npm run build
        Path winguiPkg = rootPath.resolve("t3series-wingui").resolve("packages").resolve("wingui");
        Path feLog = rootPath.resolve("composer-frontend-build.log");
        if (Files.isDirectory(winguiPkg)) {
            jobs.add(spawnBackgroundJob("frontend-build", winguiPkg, feLog,
                    isWindows
                        ? new String[]{"cmd", "/c", "npm", "run", "build"}
                        : new String[]{"npm", "run", "build"}));
        } else {
            jobs.add(jobFailed("frontend-build", "디렉터리 미존재: " + winguiPkg));
        }

        // 2) Backend recompile — mvn compile (DevTools 가 enabled 면 자동 reload)
        Path beLog = rootPath.resolve("composer-backend-compile.log");
        jobs.add(spawnBackgroundJob("backend-compile", rootPath, beLog,
                isWindows
                    ? new String[]{"cmd", "/c", "mvn", "-pl", "t3series-wingui", "compile", "-DskipTests", "-q"}
                    : new String[]{"mvn", "-pl", "t3series-wingui", "compile", "-DskipTests", "-q"}));

        out.put("triggered", true);
        out.put("jobs", jobs);
        out.put("note", "백그라운드 작업 시작. 진행 상황은 project-root 의 log 파일 확인. "
                + "JVM 자체 재시작은 자동화되지 않으므로 Spring DevTools 또는 수동 재기동 필요.");
        return out;
    }

    private Map<String, Object> spawnBackgroundJob(String name, Path workDir, Path logFile, String[] command) {
        Map<String, Object> rec = new LinkedHashMap<>();
        rec.put("name", name);
        rec.put("workDir", workDir.toString());
        rec.put("command", String.join(" ", command));
        rec.put("logFile", logFile.toString());
        try {
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.directory(workDir.toFile());
            pb.redirectErrorStream(true);
            pb.redirectOutput(logFile.toFile());
            Process proc = pb.start();
            rec.put("started", true);
            rec.put("pid", proc.pid());
            log.info("Composer control-plane spawned: {} pid={} cwd={} cmd={}",
                    name, proc.pid(), workDir, String.join(" ", command));
        } catch (Exception e) {
            rec.put("started", false);
            rec.put("error", e.getMessage());
            log.warn("Composer control-plane spawn failed: {} cwd={} err={}",
                    name, workDir, e.getMessage());
        }
        return rec;
    }

    private Map<String, Object> jobFailed(String name, String reason) {
        Map<String, Object> rec = new LinkedHashMap<>();
        rec.put("name", name);
        rec.put("started", false);
        rec.put("error", reason);
        return rec;
    }

    /**
     * apply() 가 성공적으로 처리한 아티팩트에 STATUS_FINAL 을 마킹.
     * MENU_SQL 은 MenuRegistrationService 가 별도로 마킹하므로 여기서는 제외.
     */
    private void markAppliedArtifactsFinal(List<ComposerArtifact> artifacts,
                                           List<Map<String, Object>> applied) {
        java.util.Set<String> successIds = new java.util.HashSet<>();
        for (Map<String, Object> rec : applied) {
            Object id = rec.get("id");
            if (!(id instanceof String sid)) continue;
            if (Boolean.TRUE.equals(rec.get("fileOk"))
                    || Boolean.TRUE.equals(rec.get("execOk"))) {
                successIds.add(sid);
            }
        }
        if (successIds.isEmpty()) return;
        try {
            perStatementTx.executeWithoutResult(s -> {
                for (ComposerArtifact a : artifacts) {
                    // 메뉴등록 아티팩트(MENU_SQL · MENU_JS) 는 MenuRegistrationService 가 별도로 마킹.
                    if (ComposerArtifact.TYPE_MENU_SQL.equals(a.getArtifactType())) continue;
                    if (ComposerArtifact.TYPE_MENU_JS.equals(a.getArtifactType())) continue;
                    if (!successIds.contains(a.getId())) continue;
                    if (!ComposerArtifact.STATUS_FINAL.equals(a.getStatus())) {
                        a.setStatus(ComposerArtifact.STATUS_FINAL);
                        artifactRepo.save(a);
                    }
                }
            });
        } catch (Exception e) {
            log.warn("Artifact STATUS_FINAL 마킹 실패 (apply 자체는 성공): {}", e.getMessage());
        }
    }

    /**
     * 메뉴등록(MENU_SQL 또는 MENU_JS STATUS_FINAL) + 아티팩트 적용(비 메뉴 STATUS_FINAL) 이
     * 모두 1건 이상 존재하면 세션을 STATUS_COMPLETED 로 전이.
     * (Target.menu_source 가 DB → MENU_SQL · JS_FILE → MENU_JS — 두 경로 모두 인정)
     */
    private void markSessionCompletedIfReady(String sessionId) {
        try {
            boolean menuSqlDone = artifactRepo.existsBySessionIdAndArtifactTypeAndStatus(
                    sessionId, ComposerArtifact.TYPE_MENU_SQL, ComposerArtifact.STATUS_FINAL);
            boolean menuJsDone = artifactRepo.existsBySessionIdAndArtifactTypeAndStatus(
                    sessionId, ComposerArtifact.TYPE_MENU_JS, ComposerArtifact.STATUS_FINAL);
            boolean menuDone = menuSqlDone || menuJsDone;
            boolean artifactsApplied = artifactRepo.existsNonMenuArtifactFinal(
                    sessionId,
                    java.util.Arrays.asList(
                            ComposerArtifact.TYPE_MENU_SQL, ComposerArtifact.TYPE_MENU_JS),
                    ComposerArtifact.STATUS_FINAL);
            if (!menuDone || !artifactsApplied) return;

            perStatementTx.executeWithoutResult(s -> sessionRepo.findById(sessionId).ifPresent(session -> {
                if (ComposerSession.STATUS_ACTIVE.equals(session.getStatus())) {
                    session.setStatus(ComposerSession.STATUS_COMPLETED);
                    sessionRepo.save(session);
                    log.info("Composer session {} 상태 COMPLETED 로 전이 (menu+artifact 완료)", sessionId);
                }
            }));
        } catch (Exception e) {
            log.warn("Session COMPLETED 전이 실패 (apply 자체는 성공) sessionId={}: {}", sessionId, e.getMessage());
        }
    }

    // --------------------------------------------------------
    // File helpers
    // --------------------------------------------------------

    private boolean isFileArtifactType(String type) {
        if (type == null) return false;
        return type.equals(ComposerArtifact.TYPE_SCREEN_JSX)
            || type.equals(ComposerArtifact.TYPE_JAVA_CONTROLLER)
            || type.equals(ComposerArtifact.TYPE_JAVA_SERVICE)
            || type.equals(ComposerArtifact.TYPE_JAVA_REPOSITORY)
            || type.equals(ComposerArtifact.TYPE_JAVA_ENTITY)
            || type.equals(ComposerArtifact.TYPE_MENUS_JS_PATCH);
    }

    /**
     * 아티팩트의 filePath 를 프로젝트 루트 기준 상대 경로로 정규화.
     * 경로 결정 우선순위:
     *  1) Claude 가 준 filePath 가 allow-write-patterns 화이트리스트에 맞으면 그대로 사용
     *  2) 맞지 않으면 **아티팩트 타입 + 파일명** 으로 올바른 경로 auto-remap
     *     (예: Claude 가 `/db/sp/SP_X.sql` 을 써도 `t3series-database/mssql/procedures/SP_X.sql` 로)
     *  3) filePath 가 아예 없으면 타입별 기본 경로 생성
     */
    private String resolveTargetPath(ComposerArtifact a, Path rootPath) {
        String fp = a.getFilePath();
        String type = a.getArtifactType();
        String name = (a.getFileName() == null || a.getFileName().isBlank())
                ? deriveFileName(fp, a.getId()) : cleanFileName(a.getFileName());

        // 1) 원본 filePath 사용 시도
        if (fp != null && !fp.isBlank() && !isAbsoluteLike(fp)) {
            String norm = fp.replace('\\', '/').replaceFirst("^/+", "");
            if (matchesAllowList(norm)) {
                return norm;
            }
        }
        // 2 & 3) 타입별 auto-remap
        return routeByType(type, name);
    }

    /** 파일명이 비어 있을 때 filePath 나 artifactId 에서 이름 추정 */
    private String deriveFileName(String fp, String id) {
        if (fp != null && !fp.isBlank()) {
            String norm = fp.replace('\\', '/').replaceAll("[^A-Za-z0-9_./-]", "_");
            int slash = norm.lastIndexOf('/');
            String last = slash >= 0 ? norm.substring(slash + 1) : norm;
            if (!last.isEmpty()) return last;
        }
        return "artifact-" + id;
    }

    /** 파일명 내 공백·한글 주석 등 제거 (예: "menus.js (패치 — 해당 위치에 추가)" → "menus.js") */
    private String cleanFileName(String raw) {
        if (raw == null) return "";
        // 공백 앞까지만 취급
        int sp = raw.indexOf(' ');
        String cut = sp > 0 ? raw.substring(0, sp) : raw;
        // 괄호 구간 제거 + 허용 문자만
        cut = cut.replaceAll("\\([^)]*\\)", "").trim();
        return cut;
    }

    /** 아티팩트 타입과 파일명만으로 프로젝트 내 표준 경로 계산 */
    private String routeByType(String type, String name) {
        if (type == null) return null;
        String upgradeVer = props.getComposer().getUpgradeVersion();
        String safeName = (name == null || name.isBlank()) ? "artifact.txt" : name;

        switch (type) {
            case "SQL_SP":
                return "t3series-database/mssql/procedures/" + ensureSqlExt(safeName);
            case "SQL_DDL":
                if (upgradeVer != null && !upgradeVer.isBlank()) {
                    return "t3series-database/mssql/upgrade/" + upgradeVer + "/tables/" + ensureSqlExt(safeName);
                }
                return null;
            case "SCREEN_JSX": {
                // UserInfoMgmt.jsx → t3series-wingui/packages/wingui/src/view/util/userinfomgmt/UserInfoMgmt.jsx
                // (Composer 생성물은 보통 UT 모듈; 실제로는 도메인 접두어가 fileName 에 들어가 있지 않아
                //  기본값으로 util/<lowercase-name>/ 아래 배치. 필요 시 사용자가 이동)
                String base = safeName.replaceAll("\\.jsx$|\\.tsx$", "");
                String module = guessModuleFromName(base); // 예: UserInfoMgmt → util
                String folder = base.toLowerCase();
                return "t3series-wingui/packages/wingui/src/view/" + module + "/" + folder + "/" + base + ".jsx";
            }
            case "MENUS_JS_PATCH":
                // ⚠️ 실제 menus.js 를 덮어쓰지 않음 — 패치 텍스트만 별도 파일로 저장,
                //    사용자가 수동으로 적절한 위치에 삽입해야 함.
                return "t3series-wingui/packages/wingui/src/data/menus.js.patch";
            case "JAVA_CONTROLLER":
            case "JAVA_SERVICE":
            case "JAVA_REPOSITORY":
            case "JAVA_ENTITY": {
                String base = safeName.replaceAll("\\.java$", "");
                String subdir = switch (type) {
                    case "JAVA_CONTROLLER" -> "controller";
                    case "JAVA_SERVICE"    -> "service";
                    case "JAVA_REPOSITORY" -> "repository";
                    default                -> "entity";
                };
                return "t3series-wingui/src/main/java/com/zionex/t3series/web/domain/generated/"
                     + subdir + "/" + base + ".java";
            }
            default:
                return null;
        }
    }

    /** 경로가 allow-write-patterns 에 매칭되는지 (실제 쓰기 시 ensureMatchesAllowList 재검증) */
    private boolean matchesAllowList(String relPath) {
        for (String pat : props.getComposer().getAllowWritePatterns()) {
            PathMatcher pm = FileSystems.getDefault().getPathMatcher("glob:" + pat);
            if (pm.matches(Paths.get(relPath))) return true;
        }
        return false;
    }

    /** 파일명에서 대략적 모듈 접두어 추측. 못 찾으면 'util' 로 귀속. */
    private String guessModuleFromName(String base) {
        if (base == null) return "util";
        String u = base.toUpperCase();
        if (u.startsWith("DP"))  return "demandplan";
        if (u.startsWith("MP"))  return "masterplan";
        if (u.startsWith("FP"))  return "factoryplan";
        if (u.startsWith("BF"))  return "baselineforecast";
        if (u.startsWith("IM"))  return "inventory";
        if (u.startsWith("RP"))  return "replenishmentplan";
        if (u.startsWith("SA"))  return "sales";
        if (u.startsWith("CM"))  return "system";
        if (u.startsWith("AD"))  return "system";
        if (u.startsWith("UT"))  return "util";
        return "util";
    }

    private String ensureSqlExt(String name) {
        return name.toLowerCase().endsWith(".sql") ? name : name + ".sql";
    }

    private boolean isAbsoluteLike(String fp) {
        if (fp == null) return false;
        if (fp.length() >= 2 && fp.charAt(1) == ':') return true;  // C:\...
        if (fp.startsWith("/") || fp.startsWith("\\")) return true;
        if (fp.contains("..")) return true;
        return false;
    }

    private void ensureUnderRoot(Path root, Path target) {
        if (!target.startsWith(root)) {
            throw new SecurityException("경로 탈출 시도: " + target);
        }
    }

    private void ensureMatchesAllowList(Path root, Path abs) {
        Path rel = root.relativize(abs);
        String relStr = rel.toString().replace('\\', '/');
        for (String pat : props.getComposer().getAllowWritePatterns()) {
            PathMatcher pm = FileSystems.getDefault().getPathMatcher("glob:" + pat);
            if (pm.matches(Paths.get(relStr))) return;
        }
        throw new SecurityException("허용되지 않은 경로 패턴: " + relStr
                + " (allow-write-patterns 확인)");
    }

    // --------------------------------------------------------
    // SQL 실행 (DDL / SP)
    // --------------------------------------------------------

    /**
     * Phase 2a — ArtifactPreviewService 가 호출하는 SQL 실행 위임.
     *
     * @param ddlMode TRUE=DDL 검증, FALSE=SP 검증, NULL=MENU 검증(파괴 키워드만 차단)
     */
    public Map<String, Object> executeAsBatchPublic(ComposerArtifact a, String content,
                                                    String kind, Boolean ddlMode) {
        StmtValidator v;
        if (ddlMode == null) {
            // MENU INSERT 등 — 파괴 키워드는 execSqlBatch 가 어차피 BANNED_INLINE 으로 차단
            v = upper -> null;
        } else if (ddlMode) {
            v = ArtifactApplyService::validateDdl;
        } else {
            v = ArtifactApplyService::validateSp;
        }
        return execSqlBatch(a, content, kind, v);
    }

    private interface StmtValidator {
        /** 통과하면 null, 거부하면 거부 사유 문자열 반환 */
        String reject(String upperStmt);
    }

    private Map<String, Object> execSqlBatch(ComposerArtifact a, String content,
                                             String kind, StmtValidator validator) {
        Map<String, Object> rec = new LinkedHashMap<>();
        rec.put("id",   a.getId());
        rec.put("type", a.getArtifactType());
        rec.put("fileName", a.getFileName());
        rec.put("kind", kind);

        List<String> errors = new ArrayList<>();
        int executed = 0;
        String[] stmts = splitSqlWithGoAsBatch(content);
        DataSource execDs = resolveExecDataSource(a);   // 세션 Target DB (미설정 시 정적 폴백)
        for (int i = 0; i < stmts.length; i++) {
            String s = stmts[i].trim();
            if (s.isEmpty()) continue;
            String upper = s.toUpperCase();
            String rejection = validator.reject(upper);
            if (rejection != null) {
                errors.add("#" + (i + 1) + " 거부: " + rejection);
                errors.add("SQL: " + shortSql(s));
                rec.put("execOk", false);
                rec.put("executed", executed);
                rec.put("errors", errors);
                return rec;
            }
            for (String banned : BANNED_INLINE) {
                if (upper.contains(banned.toUpperCase())) {
                    errors.add("#" + (i + 1) + " 거부: 금지 키워드 `" + banned.trim() + "`");
                    errors.add("SQL: " + shortSql(s));
                    rec.put("execOk", false);
                    rec.put("executed", executed);
                    rec.put("errors", errors);
                    return rec;
                }
            }
            final String stmt = s;
            // Composer-owned 객체 DROP — DDL 모드 + CREATE 인 stmt 만 적용.
            //   사용자가 같은 화면을 재실행할 때 자기가 만든 객체를 깨끗히 drop 후 create.
            //   외부 객체 (composer 가 한 번도 만들지 않은 것) 는 건드리지 않음.
            String sidShort = sidShortOf(a);
            List<Map<String, String>> createObjs = "DDL".equals(kind)
                ? extractCreateObjects(upper) : List.of();
            for (Map<String, String> obj : createObjs) {
                String name = obj.get("name");
                String type = obj.get("type");
                String parent = obj.get("parent");
                if (objectsRegistry.isOwned(name, type)) {
                    String dropSql = buildDropSql(name, type, parent);
                    if (dropSql != null) {
                        try {
                            executeRawDdl(dropSql, execDs);
                            log.info("Composer-owned {} dropped before re-create: {}", type, name);
                        } catch (Exception dropEx) {
                            log.warn("Composer-owned DROP failed (skip) {} {}: {}",
                                    type, name, rootMessage(dropEx));
                        }
                    }
                }
            }
            try {
                // raw JDBC Statement.execute() 로 실행 — Hibernate 의 T-SQL flow control
                // (IF/BEGIN/END) · "0 rows affected" 오인 · N 리터럴 전처리 문제를 회피.
                // DBeaver 등 툴과 동일한 실행 경로.
                executeRawDdl(stmt, execDs);
                executed++;
                // 성공 → registry 에 등록 (이후 재실행 시 owned 로 인식되어 자동 DROP)
                for (Map<String, String> obj : createObjs) {
                    objectsRegistry.register(obj.get("name"), obj.get("type"), sidShort);
                }
            } catch (Exception e) {
                String msg = rootMessage(e);
                // 멱등성 — "이미 존재" 에러는 재실행 시 skip 하고 다음 stmt 계속.
                // MSSQL 2714: "There is already an object named '<name>' in the database."
                if (isAlreadyExistsError(msg)) {
                    errors.add("#" + (i + 1) + " skip (이미 존재): " + shortSql(stmt));
                    log.info("{} already exists, skipping: {}", kind, shortSql(stmt));
                    continue;
                }
                errors.add("#" + (i + 1) + " 실행 실패: " + msg);
                errors.add("SQL: " + shortSql(stmt));
                // ★ "Invalid column name" 환각 차단 — 운영 DB 실제 컬럼 조회 후 hint 첨부.
                //   사용자가 ChatPanel 에 그대로 붙여 Claude 재생성 요청 가능.
                String hint = buildInvalidColumnHint(a, msg, stmt);
                if (hint != null) errors.add(hint);
                rec.put("execOk", false);
                rec.put("executed", executed);
                rec.put("errors", errors);
                log.error("{} execute failed sql=[{}]", kind, stmt, e);
                return rec;
            }
        }
        rec.put("execOk", true);
        rec.put("executed", executed);
        rec.put("errors", errors);
        return rec;
    }

    private static String validateDdl(String upper) {
        // IF NOT EXISTS / IF OBJECT_ID 등 safe guard 로 감싼 CREATE TABLE 도 허용.
        // 다만 인라인 BANNED_INLINE 키워드(DROP/TRUNCATE 등)는 별도에서 차단되므로 안전.
        if (DDL_CREATE_TABLE.matcher(upper).find()) return null;
        if (DDL_SAFE_ALTER.matcher(upper).find()) return null;
        // 보조 객체 — IX_/IDX_ INDEX, VW_ VIEW
        if (DDL_CREATE_INDEX.matcher(upper).find()) return null;
        if (DDL_CREATE_VIEW.matcher(upper).find()) return null;
        // IF OBJECT_ID(...) IS NOT NULL DROP TABLE TB_* — Composer-owned 재적용용 (BANNED_INLINE
        // 의 'DROP TABLE ' 와 충돌하지만 BANNED_INLINE check 보다 먼저 ownership 확인하므로 안전)
        if (DDL_DROP_TABLE_GUARD.matcher(upper).find()) return null;
        if (DDL_DROP_INDEX_GUARD.matcher(upper).find()) return null;
        // SET ANSI_NULLS / SET QUOTED_IDENTIFIER preamble 허용
        if (upper.trim().startsWith("SET ANSI_NULLS")) return null;
        if (upper.trim().startsWith("SET QUOTED_IDENTIFIER")) return null;
        return "DDL 은 `CREATE TABLE TB_*` · `ALTER TABLE TB_* ADD/ALTER COLUMN` · "
             + "`CREATE INDEX IX_/IDX_*` · `CREATE VIEW VW_*` · `IF OBJECT_ID(..) IS NOT NULL DROP TABLE TB_*` 만 허용";
    }

    private static String validateSp(String upper) {
        if (SP_CREATE.matcher(upper).find()) return null;
        if (SP_FN_CREATE.matcher(upper).find()) return null;
        // SP_UI_ / FN_ 만 대상으로 한 DROP guard (idempotent re-creation 패턴)
        if (SP_DROP_GUARD.matcher(upper).find()) return null;
        // SET ANSI_NULLS / SET QUOTED_IDENTIFIER 등 preamble 허용
        if (upper.startsWith("SET ANSI_NULLS")) return null;
        if (upper.startsWith("SET QUOTED_IDENTIFIER")) return null;
        return "SP 는 `CREATE [OR ALTER] PROCEDURE SP_UI_*` · `CREATE FUNCTION FN_*` · "
             + "`IF OBJECT_ID(...) IS NOT NULL DROP PROCEDURE SP_UI_*` 패턴만 허용";
    }

    /**
     * 'GO' 배치 구분자 및 세미콜론을 함께 처리. 주석·문자열 인식 간이 scanner.
     * CREATE PROCEDURE/FUNCTION 본문, IF … BEGIN … END 블록은 **한 문장**으로 유지.
     */
    private String[] splitSqlWithGoAsBatch(String sql) {
        String cleaned = sql.replace("\r\n", "\n").replace('\r', '\n');
        cleaned = cleaned.replaceAll("(?s)/\\*.*?\\*/", "");
        cleaned = cleaned.replaceAll("(?m)--[^\\n]*", "");

        // 'GO' 를 batch 구분자로 분할, 그 외에 세미콜론도 구분자로 허용
        List<String> result = new ArrayList<>();
        String[] goBatches = cleaned.split("(?im)^\\s*GO\\s*$");
        for (String batch : goBatches) {
            String t = batch.trim();
            if (t.isEmpty()) continue;
            String upper = t.toUpperCase();
            // 아래 패턴은 본문 내부에 세미콜론이 있어도 한 문장으로 유지:
            //  - CREATE [OR ALTER] PROCEDURE / PROC / FUNCTION
            //  - SET ANSI_NULLS / QUOTED_IDENTIFIER
            //  - IF NOT EXISTS (...) BEGIN ... END  / IF OBJECT_ID(...) IS NULL BEGIN ... END
            if (upper.matches("(?s)^\\s*(SET\\s+ANSI_NULLS|SET\\s+QUOTED_IDENTIFIER|CREATE\\s+(OR\\s+ALTER\\s+)?(PROCEDURE|PROC|FUNCTION))[\\s\\S]*")
                || isIfBeginEndWrapped(t)) {
                result.add(t);
            } else {
                // 일반 DDL/INSERT/UPDATE — 세미콜론 split
                List<String> ss = splitBySemicolonSafe(t);
                result.addAll(ss);
            }
        }
        return result.toArray(new String[0]);
    }

    /**
     * `IF ... BEGIN ... END` 전체를 감싼 블록인지 판단.
     * BEGIN 다음부터 매칭되는 END 까지를 전체 문장의 길이와 비교.
     */
    private boolean isIfBeginEndWrapped(String s) {
        String up = s.toUpperCase();
        if (!up.matches("(?s)^\\s*IF\\b[\\s\\S]*")) return false;
        int beginIdx = indexOfWord(up, "BEGIN", 0);
        if (beginIdx < 0) return false;
        // BEGIN 이후 END 매칭 (중첩 BEGIN/END 고려)
        int i = beginIdx + 5;
        int depth = 1;
        while (i < up.length() && depth > 0) {
            int b = indexOfWord(up, "BEGIN", i);
            int e = indexOfWord(up, "END", i);
            if (e < 0) return false;
            if (b >= 0 && b < e) { depth++; i = b + 5; }
            else { depth--; i = e + 3; }
        }
        // END 이후에는 공백/세미콜론만 허용
        String tail = up.substring(i).trim();
        return tail.isEmpty() || tail.equals(";");
    }

    private int indexOfWord(String hay, String word, int from) {
        Pattern p = Pattern.compile("\\b" + word + "\\b");
        Matcher m = p.matcher(hay);
        if (m.find(from)) return m.start();
        return -1;
    }

    private List<String> splitBySemicolonSafe(String s) {
        List<String> out = new ArrayList<>();
        StringBuilder buf = new StringBuilder();
        boolean inQuote = false;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (inQuote) {
                buf.append(c);
                if (c == '\'') {
                    if (i + 1 < s.length() && s.charAt(i + 1) == '\'') { buf.append('\''); i++; }
                    else inQuote = false;
                }
            } else if (c == '\'') {
                buf.append(c); inQuote = true;
            } else if (c == ';') {
                String t = buf.toString().trim();
                if (!t.isEmpty()) out.add(t);
                buf.setLength(0);
            } else {
                buf.append(c);
            }
        }
        String tail = buf.toString().trim();
        if (!tail.isEmpty()) out.add(tail);
        return out;
    }

    // --------------------------------------------------------

    /**
     * DDL/SP 를 raw JDBC Statement.execute() 로 실행.
     * - JPA em.createNativeQuery() 가 T-SQL IF/BEGIN/END · CREATE PROCEDURE 본문의
     *   PRINT/RAISERROR · N'...' DEFAULT 등을 자주 오인하는 문제를 회피.
     * - autoCommit 상태를 그대로 사용 (DDL 은 MSSQL 에서 implicit commit).
     * - 실패 시 SQLException 을 그대로 throw 해 상위에서 rootMessage 로 표시.
     */
    private void executeRawDdl(String sql, DataSource ds) throws Exception {
        try (Connection conn = ds.getConnection();
             Statement st = conn.createStatement()) {
            st.execute(sql);
        }
    }

    /**
     * 아티팩트가 속한 세션의 Target DB DataSource — SQL 실행/검증은 그 화면이 참조하는 운영 DB 에서.
     * Target 미설정·연결 불가 시 정적 targetDataSource 로 폴백.
     */
    private DataSource resolveExecDataSource(ComposerArtifact a) {
        try {
            String sid = (a == null) ? null : a.getSessionId();
            String targetCd = (sid == null) ? null
                    : sessionRepo.findById(sid).map(s -> s.getTargetCd()).orElse(null);
            if (targetCd != null && !targetCd.isBlank()) {
                DataSource ds = dsRegistry.getDataSource(targetCd);
                if (ds != null) return ds;
            }
        } catch (Exception e) {
            log.warn("Target DataSource 해석 실패 — 정적 targetDataSource 폴백: {}", rootMessage(e));
        }
        return dataSource;
    }

    private String shortSql(String s) {
        return s.length() > 400 ? s.substring(0, 400) + " ..." : s;
    }

    // SQL 실행 오류가 'Invalid column name' 류 환각이면 운영 DB 실제 컬럼을 조회해 hint 메시지로 가공.
    //   사용자가 ChatPanel 에 그대로 붙여 Claude 재생성 prompt 로 사용 가능.
    //   - INVALID_COLUMN_PATTERN: MSSQL 'Invalid column name 'X'.' / Postgres 'column "x" does not exist' 양쪽 처리
    //   - SQL_TABLE_PATTERN: SQL 본문에서 TB_* 참조 추출 (FROM/INTO/UPDATE/JOIN 어디든)
    //   - 각 테이블에 대해 SchemaInspectionService.getTableInfo 로 실제 컬럼 fetch.
    //   - 환각 컬럼명 + 실제 컬럼명 리스트를 한 줄짜리 한국어 안내로 반환.
    //   - 미매치/조회 실패 등은 null (호출자가 무시).
    private static final java.util.regex.Pattern INVALID_COLUMN_PATTERN = java.util.regex.Pattern.compile(
            "(?i)(?:invalid column name\\s+['\"]([^'\"]+)['\"]|column\\s+\"([^\"]+)\"\\s+does not exist)");
    private static final java.util.regex.Pattern SQL_TABLE_PATTERN = java.util.regex.Pattern.compile(
            "\\bTB_[A-Z][A-Z0-9_]*\\b");

    private String buildInvalidColumnHint(ComposerArtifact a, String errMsg, String stmt) {
        if (errMsg == null || stmt == null) return null;
        java.util.regex.Matcher em = INVALID_COLUMN_PATTERN.matcher(errMsg);
        if (!em.find()) return null;
        String badCol = em.group(1) != null ? em.group(1) : em.group(2);
        if (badCol == null) return null;

        // SQL 본문에서 참조된 TB_* 테이블 추출 (중복 제거)
        java.util.Set<String> tables = new java.util.LinkedHashSet<>();
        java.util.regex.Matcher tm = SQL_TABLE_PATTERN.matcher(stmt);
        while (tm.find()) tables.add(tm.group());
        if (tables.isEmpty()) return null;

        // 세션의 targetCd 해석
        String targetCd;
        try {
            targetCd = sessionRepo.findById(a.getSessionId())
                    .map(s -> s.getTargetCd()).orElse(null);
        } catch (Exception ignore) { targetCd = null; }
        if (targetCd == null || targetCd.isBlank()) return null;

        StringBuilder sb = new StringBuilder();
        sb.append("💡 환각 컬럼 '").append(badCol).append("' — 운영 DB 실제 컬럼:");
        for (String t : tables) {
            try {
                com.zionex.t3composer.domain.schema.TableInfo info =
                        schemaInspectionService.getTableInfo(targetCd, t);
                if (info == null || info.getColumns() == null || info.getColumns().isEmpty()) continue;
                String cols = info.getColumns().stream()
                        .map(c -> c.getName() + (c.isPrimaryKey() ? "(PK)" : ""))
                        .collect(java.util.stream.Collectors.joining(", "));
                sb.append("\n  • ").append(t).append(": ").append(cols);
            } catch (Exception e) {
                log.debug("schema lookup 실패 table={}: {}", t, e.getMessage());
            }
        }
        if (sb.length() < 20) return null;  // 조회 모두 실패
        return sb.toString();
    }

    private String rootMessage(Throwable t) {
        Throwable cur = t;
        while (cur.getCause() != null && cur.getCause() != cur) cur = cur.getCause();
        String m = cur.getMessage();
        return m == null ? cur.getClass().getSimpleName() : m;
    }

    /**
     * DDL/SP 재실행 시 "이미 존재" 에러 — 화면 실행(preview) 멱등성 보장용.
     * MSSQL: 2714 "There is already an object named ..."
     * PG: "already exists"
     */
    private static boolean isAlreadyExistsError(String msg) {
        if (msg == null) return false;
        String lower = msg.toLowerCase();
        return lower.contains("already an object named")
            || lower.contains("already exists");
    }

    // ──── Composer-owned DDL DROP+CREATE helpers ────

    /** ComposerArtifact 의 session_id 첫 8자. null/short 면 sessionId 자체. */
    private static String sidShortOf(ComposerArtifact a) {
        String sid = a != null ? a.getSessionId() : null;
        if (sid == null) return null;
        return sid.length() >= 8 ? sid.substring(0, 8) : sid;
    }

    private static final Pattern P_CREATE_TABLE_NAME = Pattern.compile(
            "\\bCREATE\\s+TABLE\\s+(?:\\[?DBO\\]?\\s*\\.\\s*)?\\[?(TB_[A-Z0-9_]+)\\]?",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern P_CREATE_INDEX_NAME = Pattern.compile(
            "\\bCREATE\\s+(?:UNIQUE\\s+)?(?:CLUSTERED\\s+|NONCLUSTERED\\s+)?INDEX\\s+\\[?(I[DX]X?_[A-Z0-9_]+|IX_[A-Z0-9_]+|IDX_[A-Z0-9_]+)\\]?\\s+ON\\s+(?:\\[?DBO\\]?\\s*\\.\\s*)?\\[?(TB_[A-Z0-9_]+)\\]?",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern P_CREATE_VIEW_NAME = Pattern.compile(
            "\\bCREATE\\s+(?:OR\\s+ALTER\\s+)?VIEW\\s+(?:\\[?DBO\\]?\\s*\\.\\s*)?\\[?(VW_[A-Z0-9_]+)\\]?",
            Pattern.CASE_INSENSITIVE);

    /**
     * upper-cased SQL stmt 에서 CREATE TABLE / INDEX / VIEW 객체명 추출.
     * 반환 element: { name, type:TABLE|INDEX|VIEW, parent(INDEX 만) }
     */
    static List<Map<String, String>> extractCreateObjects(String upper) {
        List<Map<String, String>> out = new ArrayList<>();
        if (upper == null) return out;
        Matcher m = P_CREATE_TABLE_NAME.matcher(upper);
        while (m.find()) {
            Map<String, String> o = new LinkedHashMap<>();
            o.put("name", m.group(1));
            o.put("type", "TABLE");
            out.add(o);
        }
        m = P_CREATE_INDEX_NAME.matcher(upper);
        while (m.find()) {
            Map<String, String> o = new LinkedHashMap<>();
            o.put("name",   m.group(1));
            o.put("type",   "INDEX");
            o.put("parent", m.group(2));
            out.add(o);
        }
        m = P_CREATE_VIEW_NAME.matcher(upper);
        while (m.find()) {
            Map<String, String> o = new LinkedHashMap<>();
            o.put("name", m.group(1));
            o.put("type", "VIEW");
            out.add(o);
        }
        return out;
    }

    /** owned 객체의 DROP SQL — MSSQL syntax. type 별 IF EXISTS guard 포함. */
    static String buildDropSql(String objName, String type, String parentTable) {
        if (objName == null || type == null) return null;
        switch (type) {
            case "TABLE":
                return "IF OBJECT_ID(N'dbo." + objName + "', N'U') IS NOT NULL DROP TABLE dbo." + objName;
            case "VIEW":
                return "IF OBJECT_ID(N'dbo." + objName + "', N'V') IS NOT NULL DROP VIEW dbo." + objName;
            case "INDEX":
                if (parentTable == null) return null;
                return "IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = '" + objName +
                       "' AND object_id = OBJECT_ID(N'dbo." + parentTable + "')) " +
                       "DROP INDEX " + objName + " ON dbo." + parentTable;
            default:
                return null;
        }
    }

    private Map<String, Object> failure(String msg) {
        Map<String, Object> out = new HashMap<>();
        out.put("success", false);
        out.put("error", msg);
        return out;
    }

    /**
     * auto-apply-enabled=false 케이스 — 오류가 아니라 운영 정책상 자동적용이 막힌 상태.
     * 프런트는 autoApplyDisabled=true 를 보고 안내성 Alert 로 렌더하고,
     * manualSteps 의 항목을 그대로 사용자에게 보여준다.
     */
    private Map<String, Object> autoApplyDisabled(String sessionId) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("success", false);
        out.put("autoApplyDisabled", true);
        out.put("info", "자동 적용이 비활성화되어 있어 서버가 직접 파일/DB 에 적용하지 않았습니다. "
                + "아래 작업을 수동으로 수행하면 됩니다.");

        List<String> steps = new ArrayList<>();
        steps.add("파일 저장: 미리보기의 JSX · Java · menus.js 코드를 복사해 표시된 경로에 직접 저장");
        steps.add("SQL_DDL: CREATE TABLE TB_* 스크립트를 DB 도구(SSMS 등) 로 실행");
        steps.add("SQL_SP: CREATE OR ALTER PROCEDURE SP_UI_* 스크립트를 DB 도구로 실행");
        out.put("manualSteps", steps);

        out.put("hint", "서버에서 자동으로 처리하길 원하면 관리자에게 "
                + "app.composer.auto-apply-enabled=true 활성화를 요청하세요.");
        log.info("Composer artifact apply skipped — auto-apply disabled. sessionId={}", sessionId);
        return out;
    }

    // (이전: userDeclinedAutoApply — 2026-04 정책 변경으로 제거.
    //  파일/DDL/SP 는 admin policy 만 통과하면 항상 적용. autoApply 는 control-plane(npm/mvn) 만 게이트.)

    // ---- 요청 옵션 ----

    public static class ApplyOptions {
        /**
         * 사용자 자동적용 opt-in. 기본 false — 다이얼로그 상단의 "자동적용" 체크박스 값을 그대로 받음.
         * false: 사전 검증만 수행하고 파일 저장/DDL/SP 실행은 하지 않음 (사용자에게 수동 적용 가이드 반환)
         * true : 실제로 파일 저장 / DDL · SP DB 실행 수행 (server admin policy 도 함께 ON 인 경우만)
         */
        public boolean autoApply  = false;
        public boolean applyFiles = true;
        public boolean executeDdl = false;
        public boolean executeSp  = false;
        public boolean overwrite  = false;

        /**
         * wingui 네이티브 규약 검증 우회 플래그.
         * 사용자가 명시적으로 엔진 경유가 필요하다고 요청한 경우에만 true 로 설정.
         * (기본 false — SP/엔진 XML 이 있으면 apply 를 차단)
         */
        public boolean overridePolicyCheck = false;

        /**
         * SP 이름 충돌 검증 우회 플래그.
         * 의도적으로 기존 SP 를 ALTER 하려는 경우(EXISTING_MODIFY 모드 등) true 로 설정.
         * 기본 false — DB 에 이미 존재하는 SP 이름이 발견되고 본 세션이 만들지 않은 경우 차단.
         * (2026-04-29 추가 — 다른 화면이 사용 중인 SP 를 덮어쓰는 사고 방지)
         */
        public boolean overrideSpCollisionCheck = false;

        /**
         * 테이블 이름 충돌 검증 우회 플래그.
         * 기본 false — CREATE TABLE TB_X 의 X 가 DB 에 이미 존재하면 차단.
         * 정책: 존재하는 테이블은 기존 Entity 재사용 — 데이터 유실 위험으로 덮어쓰기 절대 금지.
         * 의도적으로 우회할 때만 true (위험 작업 — 백업 후 사용 권장).
         * (2026-04-30 추가)
         */
        public boolean overrideTableCollisionCheck = false;
    }

    // --------------------------------------------------------
    // wingui 네이티브 규약 정책 검증
    // --------------------------------------------------------

    /** Composer 세션 산출물이 wingui 네이티브 규약을 만족하는지 검증. 위반 목록 반환. */
    private List<String> checkWinguiNativePolicy(List<ComposerArtifact> artifacts, ComposerSession session) {
        List<String> violations = new ArrayList<>();

        String mode = session != null ? session.getMode() : "";
        boolean isNewMode =
                ComposerSession.MODE_NEW_GENERAL.equals(mode)
             || ComposerSession.MODE_NEW_NL.equals(mode)
             || ComposerSession.MODE_NEW_STEP.equals(mode)
             || ComposerSession.MODE_NEW_FROM_DESIGN.equals(mode)
             || ComposerSession.MODE_NEW_FROM_COPY.equals(mode);

        // 수정 모드는 기존 파일 스타일 유지를 위해 정책 검증을 생략 (너무 제한적)
        if (!isNewMode) {
            return violations;
        }

        boolean hasScreenJsx = false;
        boolean hasJavaEntity = false;
        boolean hasJavaRepository = false;
        boolean hasJavaService = false;
        boolean hasJavaController = false;
        boolean hasSqlDdl = false;
        String offendingSp = null;
        String offendingXml = null;
        String offendingDdl = null;

        for (ComposerArtifact a : artifacts) {
            String type = a.getArtifactType();
            String path = a.getFilePath();

            if (ComposerArtifact.TYPE_SCREEN_JSX.equals(type))         hasScreenJsx = true;
            if (ComposerArtifact.TYPE_JAVA_ENTITY.equals(type))        hasJavaEntity = true;
            if (ComposerArtifact.TYPE_JAVA_REPOSITORY.equals(type))    hasJavaRepository = true;
            if (ComposerArtifact.TYPE_JAVA_SERVICE.equals(type))       hasJavaService = true;
            if (ComposerArtifact.TYPE_JAVA_CONTROLLER.equals(type))    hasJavaController = true;
            if (ComposerArtifact.TYPE_SQL_DDL.equals(type)) {
                hasSqlDdl = true;
                if (offendingDdl == null) offendingDdl = (path != null ? path : a.getFileName());
            }

            if (ComposerArtifact.TYPE_SQL_SP.equals(type)) {
                if (offendingSp == null) offendingSp = (path != null ? path : a.getFileName());
            }
            if (path != null && path.matches(".*(/|\\\\)(mp|dp|bf|fp)server(/|\\\\)config(/|\\\\).*_service\\.xml$")) {
                if (offendingXml == null) offendingXml = path;
            }
        }

        // ======================================================================
        // 차단 조건 (2026-04-27 정책 전환 — SP 기반 CRUD)
        //   (A) 신규 화면에 SP DDL(SP_UI_*.sql) 누락 — 모든 신규 화면은 SP 필수
        //   (B) 엔진 service XML 포함 (mp/dp/bf/fp server/config/*_service.xml) — wingui 단독 구동 위반
        //   (C) NL 이외 신규 모드(NEW_FROM_DESIGN/NEW_FROM_COPY/NEW_STEP) 에서
        //       새 테이블 DDL(SQL_DDL) 생성됨 — 기존 Table/View 재사용 원칙
        //
        // NL 모드(NEW_GENERAL/NEW_NL) 는 자유 도메인이므로 새 테이블 DDL 허용.
        // EXISTING_MODIFY 는 ALTER TABLE 등을 위해 DDL 허용.
        //
        // SP_UI_* 는 모든 신규 모드에서 필수 (Composer 가 새 SP 생성).
        // ======================================================================
        boolean hasSqlSp = false;
        for (ComposerArtifact a : artifacts) {
            if (ComposerArtifact.TYPE_SQL_SP.equals(a.getArtifactType())) {
                hasSqlSp = true;
                break;
            }
        }

        // (A) SP 누락 차단 — JSX 가 포함된 신규 세션은 SP 가 반드시 있어야 함
        //     단, NEW_FROM_COPY 는 "기계적 복제 + 치환" 모드로 기존 backend (SP/Service/Controller) 재사용이
        //     자연스러운 케이스 (예: 동일 endpoint 호출하는 UI 복제). JSX 만 복제하고 SP 가 누락돼도 허용.
        //     사용자가 새 SCREEN_NO 의 SP 를 원하면 후속 채팅에서 추가 요청 → 별도 적용.
        boolean isCopyMode = ComposerSession.MODE_NEW_FROM_COPY.equals(mode);
        if (hasScreenJsx && !hasSqlSp && !isCopyMode) {
            violations.add("신규 화면에 SP_UI_*.sql DDL 누락 — 모든 신규 화면은 SP 기반 CRUD 가 필수입니다. " +
                    "최소 1개의 SP_UI_<DOMAIN>_<NO>_Q1 (조회) 를 생성하세요. CUD 가 있으면 _S1/_D1 도 함께. " +
                    "(rules/41-composer-generation.md §1.1, rules/41b-composer-java.md §5.1, 2026-04-27 정책 전환)");
        }
        if (hasScreenJsx && !hasSqlSp && isCopyMode) {
            log.info("Composer NEW_FROM_COPY 정책 완화: JSX-only 복제 허용 (기존 backend 재사용 가정). " +
                    "새 SCREEN_NO 의 SP 가 필요하면 후속 채팅에서 추가 요청. sessionId={}",
                    session != null ? session.getId() : "-");
        }

        // (B) 엔진 service XML 차단 — wingui 단독 구동
        if (offendingXml != null) {
            violations.add("엔진 service XML 아티팩트 포함됨: " + offendingXml +
                    " — wingui 단독 구동을 위해 RestController 가 JdbcTemplate 으로 SP 직접 호출. " +
                    "callService 경유는 BF/DP/MP/FP 계산 화면 수정 전용 (rules/41b-composer-java.md §5.1)");
        }

        // (C) 새 테이블 DDL — NL 모드만 허용
        boolean isNlMode =
                ComposerSession.MODE_NEW_GENERAL.equals(mode)
             || ComposerSession.MODE_NEW_NL.equals(mode);
        if (hasSqlDdl && !isNlMode) {
            violations.add("[" + mode + "] 모드에서 새 테이블 DDL 아티팩트가 생성됨: " + offendingDdl +
                    " — 이 모드는 기존 Table/View 재사용이 원칙입니다. 새 도메인이 꼭 필요하면 자연어(NL) 모드로 다시 시작하세요 " +
                    "(rules/41-composer-generation.md §5).");
        }

        // Java 산출물 완결성 체크 — 경고 로그만 (차단 아님)
        if (hasScreenJsx) {
            List<String> missing = new ArrayList<>();
            if (!hasJavaEntity)     missing.add("Entity");
            if (!hasJavaService)    missing.add("Service");
            if (!hasJavaController) missing.add("Controller");
            if (!missing.isEmpty()) {
                log.warn("Composer 권장사항: 신규 화면(JSX)+SP 세션에 백엔드 {} 아티팩트가 누락됨. " +
                        "Service 는 JdbcTemplate.query(\"EXEC SP_UI_<...> ?, ?\", ...) 패턴으로 SP 호출. " +
                        "적용은 진행하되 후속 대화로 백엔드 세트를 완성하세요. sessionId={} mode={}",
                        missing, session != null ? session.getId() : "-", mode);
            }
            // Repository 사용 시 경고 — SP 기반 CRUD 정책상 불필요
            if (hasJavaRepository) {
                log.warn("Composer 권장사항: SP 기반 화면에 JpaRepository 가 포함됨. " +
                        "SP 호출이 정책이므로 Repository 없이 Service 가 JdbcTemplate 만 사용하는 것이 일반적. " +
                        "JPA 단순 CRUD 가 꼭 필요한 경우만 Repository 유지. sessionId={}",
                        session != null ? session.getId() : "-");
            }
        }

        // ─────────────────────────────────────────────────────────────
        // (D) Path Convention — 'ut/' 절대 금지 (2026-04-30 강화)
        //     Hook (path-convention.sh) 이 Write/Edit 시 차단하지만, ArtifactApplyService 가
        //     일괄 apply 할 때 hook 우회 가능 — 같은 룰을 정책 검증에 통합해 이중 안전망.
        //     CLAUDE.md §1.-1 · rules/41b §5.6.1 · rules/99 §0
        // ─────────────────────────────────────────────────────────────
        for (ComposerArtifact a : artifacts) {
            String pathViolation = checkUtPathConvention(a);
            if (pathViolation != null) violations.add(pathViolation);
        }

        return violations;
    }

    /**
     * 단일 아티팩트의 filePath + content 에서 'ut/' 잘못된 prefix 사용을 검사.
     * @return 위반 메시지 (없으면 null)
     */
    private static String checkUtPathConvention(ComposerArtifact a) {
        String fp      = a.getFilePath();
        String content = a.getContent();
        String idLabel = "[" + a.getArtifactType() + " " +
                         (fp != null ? fp : a.getFileName() != null ? a.getFileName() : a.getId()) + "]";

        // (D-1) filePath 자체가 view/ut/ 또는 web/domain/ut/
        if (fp != null) {
            String norm = fp.replace('\\', '/');
            if (norm.contains("/view/ut/")) {
                return idLabel + " JSX 디렉토리 'view/ut/...' 사용 금지 — 'view/util/...' 로 정정. " +
                       "(utility 도메인은 'util/' 단 하나뿐 — CLAUDE.md §1.-1)";
            }
            if (norm.contains("/web/domain/ut/")) {
                return idLabel + " Java 패키지 디렉토리 'web/domain/ut/...' 사용 금지 — 'web/domain/util/...' 로 정정. " +
                       "(rules/41b-composer-java.md §5.6.1)";
            }
        }

        if (content == null || content.isBlank()) return null;

        // (D-2) Java: package com.zionex.t3series.web.domain.ut.*
        if (Pattern.compile("(?m)^\\s*package\\s+com\\.zionex\\.t3series\\.web\\.domain\\.ut(\\.|;)")
                   .matcher(content).find()) {
            return idLabel + " Java 패키지 'com.zionex.t3series.web.domain.ut.*' 사용 금지 — " +
                   "'com.zionex.t3series.web.domain.util.*' 로 정정. (rules/99 PATH-1)";
        }
        // (D-3) Java: import com.zionex.t3series.web.domain.ut.*
        if (Pattern.compile("(?m)^\\s*import\\s+com\\.zionex\\.t3series\\.web\\.domain\\.ut\\.")
                   .matcher(content).find()) {
            return idLabel + " Java import 'com.zionex.t3series.web.domain.ut.*' 사용 금지 — " +
                   "'com.zionex.t3series.web.domain.util.*' 로 정정.";
        }
        // (D-4) @RequestMapping("/ut/...") — /util/ 은 통과
        if (Pattern.compile("@RequestMapping\\(\\s*(?:value\\s*=\\s*)?\"/ut(/|\")")
                   .matcher(content).find()) {
            return idLabel + " @RequestMapping URL prefix '/ut/...' 사용 금지 — '/util/...' 로 정정. " +
                   "(rules/99 PATH-2)";
        }
        // (D-5) zAxios.get('ut/...') · zAxios({url:'ut/...'})
        if (Pattern.compile("zAxios[^(]*\\(\\s*['\"]ut/")
                   .matcher(content).find()
         || Pattern.compile("\\burl\\s*:\\s*['\"]ut/")
                   .matcher(content).find()) {
            return idLabel + " zAxios 호출 URL 'ut/...' 사용 금지 — 'util/...' 로 정정. " +
                   "(예: zAxios.get('ut/X') → zAxios.get('util/X'))";
        }
        // (D-6) JSX prop url="ut/..." · optionsUrl: 'ut/...'
        if (Pattern.compile("\\burl=['\"]ut/")
                   .matcher(content).find()
         || Pattern.compile("\\boptionsUrl\\s*:\\s*['\"]ut/")
                   .matcher(content).find()) {
            return idLabel + " JSX prop url=\"ut/...\" 또는 fieldCascade optionsUrl: 'ut/...' 사용 금지 — " +
                   "'util/...' 로 정정.";
        }

        return null;
    }

    // --------------------------------------------------------
    // SP 이름 충돌 검증 (2026-04-29 추가)
    // --------------------------------------------------------

    /** SP DDL 파일 본문에서 CREATE [OR ALTER] PROCEDURE 의 SP 이름을 추출 */
    private static final Pattern SP_NAME_EXTRACT = Pattern.compile(
            "\\bCREATE\\s+(?:OR\\s+ALTER\\s+)?(?:PROCEDURE|PROC|FUNCTION)" +
            "\\s+(?:\\[?dbo\\]?\\s*\\.\\s*)?\\[?(SP_[A-Z][A-Z0-9_]+|FN_[A-Z][A-Z0-9_]+)\\]?",
            Pattern.CASE_INSENSITIVE);

    /**
     * project-root 경로 조회 — 다른 서비스(ComposerService.cleanupOrphanArtifacts) 가 디스크 파일
     * 삭제 시 동일한 root 기준점을 공유하기 위해 노출.
     * @return 설정된 project-root (미설정 시 null)
     */
    public String resolveProjectRoot() {
        return props.getComposer() == null ? null : props.getComposer().getProjectRoot();
    }

    /**
     * SP 아티팩트들의 SP 이름이 다른 화면이 쓰는 기존 SP 와 충돌하는지 검증.
     *
     * 충돌 정의: SP 이름이 INFORMATION_SCHEMA.ROUTINES 에 이미 존재하고,
     *   동일 sessionId 의 이전 적용된 (STATUS_FINAL) SP 아티팩트의 이름 집합에 포함되지 않음.
     *   = 해당 SP 는 본 세션이 만든 적이 없는 외부(다른 화면) 의 것.
     *
     * @return 충돌 메시지 목록 (빈 리스트 = 충돌 없음)
     */
    private List<String> checkSpNameCollisions(String sessionId, List<ComposerArtifact> artifacts) {
        if (screenNoAllocator == null) return List.of();

        // 1) 본 세션에서 이전에 적용된 SP 이름 수집 — 같은 SP 를 의도적으로 ALTER 하는 경우 통과
        java.util.Set<String> sessionAppliedSpNames = new java.util.HashSet<>();
        try {
            List<ComposerArtifact> finals = artifactRepo.findBySessionIdAndStatusOrderByCreateDttmDesc(
                    sessionId, ComposerArtifact.STATUS_FINAL);
            for (ComposerArtifact a : finals) {
                if (!ComposerArtifact.TYPE_SQL_SP.equals(a.getArtifactType())) continue;
                String n = extractSpName(a.getContent());
                if (n != null) sessionAppliedSpNames.add(n.toUpperCase());
            }
        } catch (Exception e) {
            log.warn("SP 충돌 검증 — 세션 적용 이력 조회 실패: {}", e.getMessage());
        }

        // 2) 현재 적용 대상 SP 들의 이름을 추출하고 DB 충돌 여부 확인
        List<String> collisions = new ArrayList<>();
        for (ComposerArtifact a : artifacts) {
            if (!ComposerArtifact.TYPE_SQL_SP.equals(a.getArtifactType())) continue;
            String spName = extractSpName(a.getContent());
            if (spName == null) continue;
            String upper = spName.toUpperCase();

            // 본 세션이 이미 적용한 SP 면 ALTER 의도 → 통과
            if (sessionAppliedSpNames.contains(upper)) continue;

            // DB 에 이미 존재하면 외부 SP — 차단
            if (screenNoAllocator.spNameExists(spName)) {
                collisions.add(spName + " (artifact id=" + a.getId() + " filePath=" + a.getFilePath() + ") " +
                        "— 이 SP 이름이 이미 DB 에 존재합니다. 다른 화면이 사용 중일 가능성이 높아 덮어쓰기를 차단했습니다.");
            }
        }
        return collisions;
    }

    /** SQL 본문에서 첫 번째 CREATE [OR ALTER] PROCEDURE/FUNCTION 의 식별자 추출. 없으면 null */
    private static String extractSpName(String sql) {
        if (sql == null || sql.isBlank()) return null;
        Matcher m = SP_NAME_EXTRACT.matcher(sql);
        if (!m.find()) return null;
        return m.group(1);
    }

    // --------------------------------------------------------
    // 테이블 이름 충돌 검증 (2026-04-30 추가)
    // --------------------------------------------------------

    /** DDL 본문에서 CREATE TABLE TB_X 의 테이블 이름 추출 (모든 등장 — 한 파일에 여러 테이블 가능) */
    private static final Pattern TABLE_NAME_EXTRACT = Pattern.compile(
            "\\bCREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?" +
            "(?:\\[?dbo\\]?\\s*\\.\\s*)?\\[?(TB_[A-Z][A-Z0-9_]+)\\]?",
            Pattern.CASE_INSENSITIVE);

    /**
     * SQL_DDL 아티팩트의 CREATE TABLE 이 DB 에 이미 존재하는 테이블과 충돌하는지 검증.
     *
     * 정책: 존재하는 테이블은 새 DDL 생성 절대 금지 (rules/41b §5.1 정책 C).
     * 충돌 발생 시 LLM 이 사용자 prompt 의 "[✓ 존재]" 블록을 무시한 케이스 — 차단으로 사고 방지.
     *
     * ALTER TABLE 은 검사 대상 아님 — DDL_SAFE_ALTER 가 별도 처리.
     *
     * @return 충돌 메시지 목록 (빈 리스트 = 충돌 없음)
     */
    private List<String> checkTableNameCollisions(List<ComposerArtifact> artifacts, String targetCd) {
        if (schemaInspectionService == null) return List.of();

        List<String> collisions = new ArrayList<>();
        for (ComposerArtifact a : artifacts) {
            if (!ComposerArtifact.TYPE_SQL_DDL.equals(a.getArtifactType())) continue;
            String content = a.getContent();
            if (content == null || content.isBlank()) continue;

            Matcher m = TABLE_NAME_EXTRACT.matcher(content);
            while (m.find()) {
                String tableName = m.group(1);
                if (tableName == null || tableName.isBlank()) continue;
                try {
                    if (schemaInspectionService.tableExists(targetCd, tableName)) {
                        collisions.add(tableName + " (artifact id=" + a.getId() +
                                " filePath=" + a.getFilePath() + ") " +
                                "— 이 테이블이 이미 DB 에 존재합니다. 새 DDL 로 덮어쓰면 기존 데이터 유실 위험.");
                    }
                } catch (Exception e) {
                    log.warn("테이블 존재여부 조회 실패 table={} err={}", tableName, e.getMessage());
                }
            }
        }
        return collisions;
    }
}

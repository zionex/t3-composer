package com.zionex.t3composer.domain.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.zionex.t3composer.config.ApplicationProperties;
import com.zionex.t3composer.domain.entity.ComposerArtifact;
import com.zionex.t3composer.domain.repository.ComposerArtifactRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Phase 2 (a/b) — JSX/SQL/MENU/Java 산출물을 docker 컨테이너 안에서 임시 위치 (preview) 에 적용해
 * 사용자가 메뉴 트리에서 클릭하여 화면을 직접 띄워볼 수 있도록 한다.
 *
 * apply (정식) 와 분리된 별도 흐름:
 *   - JSX  → frontend webpack-dev-server 가 watch 하는 `/workspace/preview/frontend/<sid8>/`
 *   - SQL DDL/SP → composer-db 에 정식 이름으로 실행 (CREATE OR ALTER 라 재실행 안전)
 *   - MENU_SQL   → MENU_CD/LANG_KEY 에 `__PV<sid8>` 접미사 + MENU_FILE_PATH 에 `/_preview/<sid8>` prefix
 *   - Java       → JavaArtifactRewriter 로 패키지 변환 후 `/app/src/main/java/com/zionex/t3composer/preview/s<sid8>/`
 *                   → mvn compile 트리거 → DevTools 자동 재기동
 *
 * confirm = 정식 apply() 호출 + cancel() 로 preview 흔적 제거
 * cancel  = preview 폴더 삭제 (jsx + java) + mvn compile 재실행 + composer-db PREVIEW row 삭제
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ArtifactPreviewService {

    private static final Pattern MENU_CD_PATTERN = Pattern.compile(
            "'(UI_(?:AD|BF|CM|DP|DPD|FO|FP|IM|MP|RP|SA|SALES|SO|UT)_[A-Z][A-Z0-9_]*)'");

    private static final Pattern MENU_FILE_PATH_PATTERN = Pattern.compile(
            "'(/(?:util|demandplan|masterplan|factoryplan|baselineforecast|inventory|"
          + "replenishmentplan|sales|system|snop|supplyorder)/[^']+)'");

    private final ApplicationProperties props;
    private final ComposerArtifactRepository artifactRepo;
    private final JdbcTemplate jdbcTemplate;
    private final ArtifactApplyService applyService;
    private final JavaArtifactRewriter javaRewriter;

    // -----------------------------------------------------------------
    // applyPreview
    // -----------------------------------------------------------------

    public Map<String, Object> applyPreview(String sessionId) {
        Map<String, Object> out = new LinkedHashMap<>();

        String previewRoot = props.getComposer().getPreviewFrontendRoot();
        if (previewRoot == null || previewRoot.isBlank()) {
            return failure("app.composer.preview-frontend-root 가 설정되지 않았습니다.");
        }
        Path previewBase = absDir(previewRoot);
        if (previewBase == null || !Files.isDirectory(previewBase)) {
            return failure("preview-frontend-root 디렉터리가 존재하지 않습니다: " + previewRoot
                    + " (docker-compose 의 `./frontend/src/view/_preview:/workspace/preview/frontend` 마운트 확인)");
        }

        String javaRoot = props.getComposer().getPreviewJavaRoot();
        Path javaBase = (javaRoot == null || javaRoot.isBlank()) ? null : Paths.get(javaRoot).toAbsolutePath().normalize();

        List<ComposerArtifact> artifacts = artifactRepo
                .findBySessionIdAndStatusNotOrderByCreateDttmDesc(sessionId, ComposerArtifact.STATUS_DISCARDED);
        if (artifacts.isEmpty()) {
            return failure("세션에 아티팩트가 없습니다.");
        }

        String sid8 = shortSid(sessionId);
        Path sessionPreview = previewBase.resolve(sid8);

        // 이전 preview 흔적 청소
        deleteRecursively(sessionPreview);
        Path sessionJavaPreview = (javaBase == null) ? null : javaBase.resolve("s" + sid8);
        if (sessionJavaPreview != null) deleteRecursively(sessionJavaPreview);

        try {
            Files.createDirectories(sessionPreview);
        } catch (IOException e) {
            return failure("preview 폴더 생성 실패: " + e.getMessage());
        }

        cleanupPreviewDbRows(sid8);

        List<Map<String, Object>> applied = new ArrayList<>();
        int jsxOk = 0, jsxFail = 0, ddlOk = 0, ddlFail = 0, spOk = 0, spFail = 0,
            menuOk = 0, menuFail = 0, javaOk = 0, javaFail = 0;
        List<String> unknownImports = new ArrayList<>();

        for (ComposerArtifact a : artifacts) {
            String type = a.getArtifactType();
            String content = a.getContent();
            if (content == null || content.isBlank()) continue;

            // Lite 모드 (2026-05 정책): [화면 실행] 은 JSX 만 처리하고 mock 으로 UI 만 보임.
            // Java/SP/DDL/MENU 적용은 [아티팩트 적용] 정식 단계에서 처리.
            // → mvn compile (수십 초) / DB 수정 / DevTools restart 모두 skip → 2~3초 안에 화면 노출.
            switch (type) {
                case ComposerArtifact.TYPE_SCREEN_JSX -> {
                    Map<String, Object> rec = writeJsxToPreview(a, sessionPreview, sid8);
                    applied.add(rec);
                    if (Boolean.TRUE.equals(rec.get("ok"))) jsxOk++; else jsxFail++;
                }
                case ComposerArtifact.TYPE_SQL_DDL, ComposerArtifact.TYPE_SQL_SP,
                     ComposerArtifact.TYPE_MENU_SQL,
                     ComposerArtifact.TYPE_JAVA_CONTROLLER, ComposerArtifact.TYPE_JAVA_SERVICE,
                     ComposerArtifact.TYPE_JAVA_REPOSITORY, ComposerArtifact.TYPE_JAVA_ENTITY -> {
                    Map<String, Object> rec = new LinkedHashMap<>();
                    rec.put("id", a.getId());
                    rec.put("type", type);
                    rec.put("ok", true);
                    rec.put("skipped", true);
                    rec.put("note", "lite preview — UI 만 표시, 실제 적용은 [아티팩트 적용]");
                    applied.add(rec);
                }
                default -> { /* MENUS_JS_PATCH 등은 preview 대상 외 */ }
            }
        }

        // Lite 모드 — mvn compile / DB 수정 모두 안 함.

        boolean success = jsxFail == 0 && ddlFail == 0 && spFail == 0 && menuFail == 0 && javaFail == 0;

        // 적용 성공한 JSX 들로부터 진입 가능한 preview URL 목록 생성 (frontend PreviewLoader 라우트용)
        List<Map<String, Object>> previewLinks = new ArrayList<>();
        for (Map<String, Object> rec : applied) {
            if (!ComposerArtifact.TYPE_SCREEN_JSX.equals(rec.get("type"))) continue;
            if (!Boolean.TRUE.equals(rec.get("ok"))) continue;
            Object viewSubObj = rec.get("viewSub");
            if (!(viewSubObj instanceof String viewSub) || viewSub.isBlank()) continue;
            String label = viewSub;
            int slash = label.lastIndexOf('/');
            if (slash >= 0) label = label.substring(slash + 1);
            label = label.replaceFirst("\\.jsx$", "");
            String urlPath = viewSub.replaceFirst("\\.jsx$", "");
            Map<String, Object> link = new LinkedHashMap<>();
            link.put("label", label);
            link.put("viewSub", viewSub);
            link.put("url", "/preview/" + sid8 + "/" + urlPath);
            previewLinks.add(link);
        }

        out.put("success",   success);
        out.put("sid8",      sid8);
        out.put("previewBase", sessionPreview.toString());
        out.put("previewLinks", previewLinks);
        out.put("javaPreviewBase", sessionJavaPreview == null ? null : sessionJavaPreview.toString());
        out.put("jsxOk", jsxOk);
        out.put("jsxFail", jsxFail);
        out.put("ddlOk", ddlOk);
        out.put("ddlFail", ddlFail);
        out.put("spOk", spOk);
        out.put("spFail", spFail);
        out.put("menuOk", menuOk);
        out.put("menuFail", menuFail);
        out.put("javaOk", javaOk);
        out.put("javaFail", javaFail);
        out.put("unknownImports", unknownImports);
        out.put("items", applied);
        out.put("note", "Lite preview — JSX 만 실행되고 Java/SP/MENU 는 mock 응답으로 동작. "
                + "실제 backend / DB 적용은 [아티팩트 적용] 으로 진행.");
        return out;
    }

    // -----------------------------------------------------------------
    // confirmPreview — 정식 apply 호출 후 preview 흔적 제거
    // -----------------------------------------------------------------

    @Transactional
    public Map<String, Object> confirmPreview(String sessionId, ArtifactApplyService.ApplyOptions opts) {
        if (opts == null) opts = new ArtifactApplyService.ApplyOptions();
        Map<String, Object> applyResult = applyService.apply(sessionId, opts);
        Map<String, Object> cleanup = cancelPreview(sessionId);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("success", Boolean.TRUE.equals(applyResult.get("success"))
                        && Boolean.TRUE.equals(cleanup.get("success")));
        out.put("apply", applyResult);
        out.put("cleanup", cleanup);
        return out;
    }

    // -----------------------------------------------------------------
    // cancelPreview — preview 폴더 + DB row 삭제
    // -----------------------------------------------------------------

    @Transactional
    public Map<String, Object> cancelPreview(String sessionId) {
        Map<String, Object> out = new LinkedHashMap<>();
        String previewRoot = props.getComposer().getPreviewFrontendRoot();
        String javaRoot = props.getComposer().getPreviewJavaRoot();
        String sid8 = shortSid(sessionId);

        boolean folderDeleted = true;
        if (previewRoot != null && !previewRoot.isBlank()) {
            folderDeleted &= deleteRecursively(Paths.get(previewRoot, sid8).toAbsolutePath().normalize());
        }
        boolean javaDeleted = true;
        boolean javaHadFiles = false;
        if (javaRoot != null && !javaRoot.isBlank()) {
            Path jp = Paths.get(javaRoot, "s" + sid8).toAbsolutePath().normalize();
            javaHadFiles = Files.isDirectory(jp);
            javaDeleted = deleteRecursively(jp);
            // 컴파일된 .class 도 함께 제거 — 안 그러면 spring context restart 시 stale class 가
            // 의존성 (이미 사라진 Service 등) 못 찾아 NoClassDefFoundError.
            String classesRoot = props.getComposer().getPreviewMvnWorkdir();
            if (classesRoot != null && !classesRoot.isBlank()) {
                // /app/target/classes/com/zionex/t3composer/preview/s<sid8>
                Path cp = Paths.get(classesRoot, "target", "classes", "com", "zionex", "t3composer",
                                    "preview", "s" + sid8).toAbsolutePath().normalize();
                deleteRecursively(cp);
            }
        }

        int deletedRows = cleanupPreviewDbRows(sid8);

        // Java 가 있었으면 mvn compile 다시 (preview 클래스 제거된 상태로) → DevTools restart
        Map<String, Object> mvn = null;
        if (javaHadFiles) {
            mvn = triggerMvnCompile();
        }

        out.put("success", folderDeleted && javaDeleted);
        out.put("sid8", sid8);
        out.put("folderDeleted", folderDeleted);
        out.put("javaDeleted", javaDeleted);
        out.put("dbRowsDeleted", deletedRows);
        if (mvn != null) out.put("mvn", mvn);
        return out;
    }

    // -----------------------------------------------------------------
    // helpers
    // -----------------------------------------------------------------

    private Map<String, Object> writeJsxToPreview(ComposerArtifact a, Path sessionPreview, String sid8) {
        Map<String, Object> rec = new LinkedHashMap<>();
        rec.put("id", a.getId());
        rec.put("type", a.getArtifactType());
        rec.put("fileName", a.getFileName());

        String fp = a.getFilePath();
        String viewSub = extractViewSubpath(fp, a.getFileName());
        if (viewSub == null) {
            rec.put("ok", false);
            rec.put("err", "JSX filePath 에서 view 하위 경로 추출 실패: " + fp);
            return rec;
        }
        Path target = sessionPreview.resolve(viewSub).normalize();
        if (!target.startsWith(sessionPreview)) {
            rec.put("ok", false);
            rec.put("err", "preview 경로 탈출 시도: " + viewSub);
            return rec;
        }
        try {
            Files.createDirectories(target.getParent());
            String content = rewriteJsxArtifact(a.getContent());
            Files.writeString(target, content, StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE,
                    StandardOpenOption.TRUNCATE_EXISTING,
                    StandardOpenOption.WRITE);
            rec.put("ok", true);
            rec.put("path", target.toString());
            rec.put("viewSub", viewSub);
        } catch (Exception e) {
            rec.put("ok", false);
            rec.put("err", e.getMessage());
            log.warn("preview JSX 쓰기 실패 sid={} fp={} err={}", sid8, fp, e.getMessage());
        }
        return rec;
    }

    /**
     * LLM 환각 자동 보정 — JSX 산출물에 가장 자주 나오는 잘못된 import 형태를 표준 형태로 치환.
     *
     * 케이스 1: `import { SearchIcon } from '@mui/icons-material/Search';` (named import)
     *           → `import SearchIcon from '@mui/icons-material/Search';` (default import)
     *
     *  서브경로 형태 (`@mui/icons-material/<Name>`) 는 default export 임. named 로 받으면
     *  런타임에 undefined → JSX 렌더 시 "Element type is invalid" 오류.
     */
    static String rewriteJsxArtifact(String content) {
        if (content == null || content.isEmpty()) return content;
        // 패턴: import { Foo } from '@mui/icons-material/Bar';
        //   주의: 여러 named (`{ A, B }`) 는 단일 default 로 자동 변환 불가능 — 첫 이름만 살리고 경고 로그.
        java.util.regex.Pattern p = java.util.regex.Pattern.compile(
            "import\\s*\\{\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*(,\\s*[^}]*)?\\}\\s*from\\s*(['\"])@mui/icons-material/([A-Za-z_][A-Za-z0-9_]*)\\3\\s*;");
        java.util.regex.Matcher m = p.matcher(content);
        StringBuilder sb = new StringBuilder();
        boolean rewrote = false;
        while (m.find()) {
            String name = m.group(1);
            String quote = m.group(3);
            String sub = m.group(4);
            m.appendReplacement(sb,
                java.util.regex.Matcher.quoteReplacement(
                    "import " + name + " from " + quote + "@mui/icons-material/" + sub + quote + ";"));
            rewrote = true;
        }
        m.appendTail(sb);
        if (rewrote) {
            log.info("JSX rewrite: @mui/icons-material/<Name> named import → default import");
        }
        return sb.toString();
    }

    private String extractViewSubpath(String filePath, String fileName) {
        if (filePath != null && !filePath.isBlank()) {
            String norm = filePath.replace('\\', '/');
            int idx = norm.indexOf("/view/");
            if (idx >= 0) return norm.substring(idx + "/view/".length());
            int srcView = norm.indexOf("src/view/");
            if (srcView >= 0) return norm.substring(srcView + "src/view/".length());
        }
        if (fileName != null && fileName.endsWith(".jsx")) {
            String base = fileName.substring(0, fileName.length() - 4);
            return "util/" + base.toLowerCase() + "/" + fileName;
        }
        return null;
    }

    /**
     * Java 산출물을 preview 경로에 변환된 형태로 쓴다.
     * 산출물 패키지 `com.zionex.t3series.web.domain.<module>.<feature>` 의 leaf 를 보존해
     * `com.zionex.t3composer.preview.s<sid8>.<leaf>` 로 변환.
     */
    private Map<String, Object> writeJavaToPreview(ComposerArtifact a, Path sessionJavaPreview, String sid8,
                                                   List<String> unknownImports) {
        Map<String, Object> rec = new LinkedHashMap<>();
        rec.put("id", a.getId());
        rec.put("type", a.getArtifactType());
        rec.put("fileName", a.getFileName());

        JavaArtifactRewriter.RewriteResult rw = javaRewriter.rewrite(a.getContent(), sid8);
        if (!rw.unknownImports.isEmpty()) {
            unknownImports.addAll(rw.unknownImports);
            rec.put("unknownImports", new ArrayList<>(rw.unknownImports));
        }
        if (!rw.changed) {
            rec.put("ok", false);
            rec.put("err", "package 선언이 com.zionex.t3series.web.domain.* 형태가 아니어서 변환 불가 (수동 수정 필요)");
            return rec;
        }

        // previewPackage = com.zionex.t3composer.preview.s<sid8>.<leaf>
        // 폴더 = sessionJavaPreview / <leaf>
        String previewPkg = rw.previewPackage;
        String prefix = "com.zionex.t3composer.preview.s" + sid8 + ".";
        String leafPath = previewPkg.startsWith(prefix) ? previewPkg.substring(prefix.length()) : "_root";
        Path target = sessionJavaPreview.resolve(leafPath.replace('.', '/'))
                .resolve(safeFileName(a.getFileName())).normalize();
        if (!target.startsWith(sessionJavaPreview)) {
            rec.put("ok", false);
            rec.put("err", "java preview 경로 탈출");
            return rec;
        }
        try {
            Files.createDirectories(target.getParent());
            Files.writeString(target, rw.content, StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE,
                    StandardOpenOption.TRUNCATE_EXISTING,
                    StandardOpenOption.WRITE);
            rec.put("ok", true);
            rec.put("path", target.toString());
            rec.put("previewPackage", previewPkg);
        } catch (Exception e) {
            rec.put("ok", false);
            rec.put("err", e.getMessage());
            log.warn("preview Java 쓰기 실패 sid={} fp={} err={}", sid8, a.getFilePath(), e.getMessage());
        }
        return rec;
    }

    private String safeFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) return "Artifact.java";
        if (!fileName.endsWith(".java")) return fileName + ".java";
        return fileName;
    }

    /**
     * 컨테이너 안에서 mvn compile 을 **별도 thread 비동기로** 시작.
     *
     * 응답은 즉시 반환 (HTTP 504 방지). mvn 이 끝까지 완료된 후에야 trigger-file 을 touch 해
     * DevTools 의 restart 를 단 한 번만 발화 — partial .class 상태에서 restart 가 일어나
     * NoClassDefFoundError 가 발생하던 문제 회피.
     *
     * application-dev.yaml 의 spring.devtools.restart.trigger-file 와 매칭되어야 한다.
     */
    private Map<String, Object> triggerMvnCompile() {
        Map<String, Object> rec = new LinkedHashMap<>();
        String workdir = props.getComposer().getPreviewMvnWorkdir();
        if (workdir == null || workdir.isBlank()) {
            rec.put("triggered", false);
            rec.put("err", "preview-mvn-workdir 미설정");
            return rec;
        }
        Path cwd = Paths.get(workdir).toAbsolutePath().normalize();
        if (!Files.isDirectory(cwd)) {
            rec.put("triggered", false);
            rec.put("err", "mvn workdir 미존재: " + cwd);
            return rec;
        }
        Path logFile = cwd.resolve("target").resolve("composer-preview-mvn.log");
        // ★ trigger-file 은 spring.devtools.restart.trigger-file 옵션의 동작에 맞춰
        //   **classpath root** (= target/classes) 안에 둬야 DevTools FileSystemWatcher 가 감지함.
        //   /app/.devtools-restart-trigger 는 classpath 가 아니라서 watch 대상 외.
        Path triggerFile = cwd.resolve("target").resolve("classes").resolve(".devtools-restart-trigger");
        try {
            Files.createDirectories(logFile.getParent());
        } catch (IOException ignored) {}

        Thread worker = new Thread(() -> {
            try {
                ProcessBuilder pb = new ProcessBuilder("mvn", "-B", "-DskipTests", "compile");
                pb.directory(cwd.toFile());
                pb.redirectErrorStream(true);
                pb.redirectOutput(logFile.toFile());
                Process p = pb.start();
                int code = p.waitFor();
                log.info("preview mvn compile finished exitCode={} log={}", code, logFile);
                if (code == 0) {
                    // trigger DevTools restart — 단 한 번의 atomic touch
                    Files.writeString(triggerFile, String.valueOf(System.currentTimeMillis()),
                            StandardCharsets.UTF_8,
                            StandardOpenOption.CREATE,
                            StandardOpenOption.TRUNCATE_EXISTING,
                            StandardOpenOption.WRITE);
                    log.info("preview mvn 성공 → DevTools trigger-file touched: {}", triggerFile);
                } else {
                    log.warn("preview mvn 실패 (exitCode={}) → backend restart 안 함. log={} 참조.",
                            code, logFile);
                }
            } catch (Exception e) {
                log.error("preview mvn compile worker 실패", e);
            }
        }, "preview-mvn-worker");
        worker.setDaemon(true);
        worker.start();

        rec.put("triggered", true);
        rec.put("async", true);
        rec.put("logFile", logFile.toString());
        rec.put("triggerFile", triggerFile.toString());
        rec.put("note", "mvn compile 별도 thread 시작 — 약 30~60초 후 mvn 완료 시 DevTools trigger-file 을 touch 해 "
                + "backend 가 한 번에 재기동됩니다 (partial restart 방지). "
                + "컴파일 실패 시 backend 는 그대로 유지되며 `tail -100 " + logFile + "` 로 원인 확인.");
        return rec;
    }

    private Map<String, Object> executeMenuSqlForPreview(ComposerArtifact a, String content, String sid8) {
        String suffix = "__PV" + sid8;
        String s1 = MENU_CD_PATTERN.matcher(content).replaceAll(m -> "'" + m.group(1) + suffix + "'");
        String s2 = MENU_FILE_PATH_PATTERN.matcher(s1)
                .replaceAll(m -> "'/_preview/" + sid8 + m.group(1) + "'");
        return applyService.executeAsBatchPublic(a, s2, "MENU", null);
    }

    private int cleanupPreviewDbRows(String sid8) {
        String pattern = "%__PV" + sid8;
        int total = 0;
        try {
            total += jdbcTemplate.update(
                "DELETE FROM TB_AD_PERMISSION_GROUP WHERE MENU_ID IN " +
                "(SELECT ID FROM TB_AD_MENU WHERE MENU_CD LIKE ?)", pattern);
        } catch (Exception ignored) {}
        try {
            total += jdbcTemplate.update(
                "DELETE FROM TB_AD_LANG_PACK WHERE LANG_KEY LIKE ?", pattern);
        } catch (Exception ignored) {}
        try {
            total += jdbcTemplate.update(
                "DELETE FROM TB_AD_MENU WHERE MENU_CD LIKE ?", pattern);
        } catch (Exception ignored) {}
        log.info("Preview DB rows cleaned up sid8={} pattern={} total={}", sid8, pattern, total);
        return total;
    }

    private boolean deleteRecursively(Path path) {
        if (!Files.exists(path)) return true;
        try (Stream<Path> walk = Files.walk(path)) {
            walk.sorted((a, b) -> b.getNameCount() - a.getNameCount())
                .forEach(p -> {
                    try { Files.deleteIfExists(p); } catch (IOException ignored) {}
                });
            return !Files.exists(path);
        } catch (IOException e) {
            log.warn("preview 폴더 삭제 실패 path={} err={}", path, e.getMessage());
            return false;
        }
    }

    private static String shortSid(String sessionId) {
        if (sessionId == null) return "00000000";
        String s = sessionId.replaceAll("[^A-Za-z0-9]", "");
        return s.substring(0, Math.min(8, s.length())).toLowerCase();
    }

    /**
     * preview JSX 파일의 raw 텍스트 반환. webpack dependency graph 와 격리된 상태에서
     * runtime fetch + Babel transform 으로 컴포넌트를 마운트할 때 사용.
     *
     * viewSub 는 `_preview/<sid8>/` 이하의 상대 경로 (예: `util/userinfomgmt/UserInfoMgmt.jsx`).
     * `..` 등으로 부모 폴더 탈출 시도하면 빈 결과.
     */
    public String readPreviewJsxSource(String sessionId, String viewSub) {
        if (sessionId == null || viewSub == null) return null;
        String previewRoot = props.getComposer().getPreviewFrontendRoot();
        if (previewRoot == null || previewRoot.isBlank()) return null;
        Path previewBase = absDir(previewRoot);
        if (previewBase == null || !Files.isDirectory(previewBase)) return null;

        String sid8 = shortSid(sessionId);
        Path sessionPreview = previewBase.resolve(sid8).normalize();
        String normalized = viewSub.replace('\\', '/');
        if (!normalized.endsWith(".jsx")) normalized = normalized + ".jsx";
        Path target = sessionPreview.resolve(normalized).normalize();
        if (!target.startsWith(sessionPreview)) {
            log.warn("preview source 경로 탈출 시도: sid={} viewSub={}", sid8, viewSub);
            return null;
        }
        if (!Files.isRegularFile(target)) return null;
        try {
            return Files.readString(target, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.warn("preview JSX 읽기 실패 sid={} viewSub={} err={}", sid8, viewSub, e.getMessage());
            return null;
        }
    }

    private Path absDir(String pathStr) {
        try {
            return Paths.get(pathStr).toAbsolutePath().normalize();
        } catch (Exception e) {
            return null;
        }
    }

    private Map<String, Object> failure(String msg) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("success", false);
        out.put("error", msg);
        return out;
    }
}

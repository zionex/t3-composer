package com.zionex.t3composer.domain.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.zionex.t3composer.config.TargetDataSourceRegistry;
import com.zionex.t3composer.domain.entity.TargetSystem;
import com.zionex.t3composer.domain.repository.TargetSystemRepository;
import com.zionex.t3composer.domain.service.JpaMethodSqlMapper;
import com.zionex.t3composer.domain.service.JsMenuFileParser;
import com.zionex.t3composer.domain.service.TargetPathResolver;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 부모 wingui 마운트 (Target source) 를 읽어 LLM 분석용 source bundle 을 만든다.
 *
 * 호출처: NEW_FROM_COPY (기존 화면 복사) / EXISTING_MODIFY (수정) 모드의
 * `collectSourceForLlm(menuCd)` (api.js → POST insight-apicall/screen-metadata/collect-source-for-llm).
 *
 * 동작:
 *   1) menuCd → Target DB 의 TB_AD_MENU 에서 MENU_FILE_PATH 조회
 *   2) MENU_FILE_PATH 를 contentStore.js 변환식대로 JSX 실제 경로로 풀어 화면 소스 read
 *   3) JSX 안에서 zAxios.* URL / callService(...) 서비스 ID / SP_UI_* 식별자 grep
 *   4) URL 로 매칭되는 Controller .java 위치 후 같은 디렉토리의 Service/Repository/Entity 동봉
 *
 * 부모 wingui repo 가 마운트되어 있어야 한다 (docker-compose 의 COMPOSER_WINGUI_REF_PATH).
 */
@Slf4j
@RestController
@RequestMapping("/insight-apicall/screen-metadata")
@RequiredArgsConstructor
public class InsightSourceController {

    @Qualifier("targetJdbcTemplate")
    private final JdbcTemplate targetJdbcTemplate;

    private final TargetDataSourceRegistry dsRegistry;
    private final JpaMethodSqlMapper       sqlMapper;
    private final TargetPathResolver       pathResolver;
    private final TargetSystemRepository   targetRepo;
    private final JsMenuFileParser         jsMenuFileParser;

    private JdbcTemplate pickJdbc(String targetCd) {
        if (targetCd != null && !targetCd.isBlank()) {
            JdbcTemplate live = dsRegistry.getJdbcTemplate(targetCd);
            if (live != null) return live;
        }
        return targetJdbcTemplate;
    }

    private Path jsxBase(String targetCd) {
        return Path.of(pathResolver.resolveWinguiPath(targetCd),
                "packages", "wingui", "src", "view");
    }
    /**
     * backend (Java) 소스 루트의 `src/main/java`.
     *
     *  - T3SERIES (monorepo): backendRefPath 비어있음 → resolveSourcePath 가 monorepo 루트 반환
     *    → 그 아래 `src/main/java` 가 Java 소스.
     *  - PLANNEL (분리형): backendRefPath = `/workspace/targets/PLANNEL/backend`
     *    (= host 의 `saas-application/`) → 그 아래 `src/main/java` 가 Java 소스.
     */
    private Path javaBase(String targetCd) {
        return Path.of(pathResolver.resolveBackendPath(targetCd),
                "src", "main", "java");
    }

    @PostMapping("/collect-source-for-llm")
    public ResponseEntity<?> collectSourceForLlm(@RequestBody Map<String, Object> req) {
        String menuCd = req == null ? null : stringOf(req.get("menuCd"));
        if (menuCd == null || menuCd.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("success", false, "error", "menuCd is required"));
        }
        String targetCd = req == null ? null : stringOf(req.get("targetCd"));

        // Target.menu_source == JS_FILE 이면 TB_AD_MENU 가 없으므로 별도 경로 (PLANNEL 등).
        //   TabMenuList.js 파싱 결과에서 menuCd(=reduxKey) 로 entry 를 찾아 그 파일을 본다.
        //   Java 백엔드는 없는 환경이므로 backend 섹션은 빈 배열로 반환.
        if (targetCd != null && !targetCd.isBlank()) {
            TargetSystem t = targetRepo.findById(targetCd).orElse(null);
            String menuSource = (t != null && t.getMenuSource() != null && !t.getMenuSource().isBlank())
                    ? t.getMenuSource() : "DB";
            if ("JS_FILE".equalsIgnoreCase(menuSource)) {
                return collectFromJsFileTarget(targetCd, menuCd);
            }
        }

        JdbcTemplate jdbc = pickJdbc(targetCd);

        // 1) MENU_FILE_PATH lookup (Target DB — live or fallback)
        List<Map<String, Object>> menuRows = jdbc.queryForList(
            "SELECT MENU_CD, MENU_FILE_PATH, MENU_PATH FROM TB_AD_MENU WHERE MENU_CD = ?", menuCd);
        if (menuRows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("success", false, "error", "메뉴를 Target DB 에서 찾을 수 없음: " + menuCd));
        }
        String menuFilePath = stringOf(menuRows.get(0).get("MENU_FILE_PATH"));
        if (menuFilePath == null || menuFilePath.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("success", false,
                    "error", "MENU_FILE_PATH 가 비어있어 화면 소스를 찾을 수 없습니다: " + menuCd));
        }

        // 2) JSX 경로 해석 + 본문 read
        String relPath = resolveJsxRelPath(menuFilePath);
        Path jsxFile = jsxBase(targetCd).resolve(relPath + ".jsx");
        if (!Files.isRegularFile(jsxFile)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("success", false,
                    "error", "JSX 파일을 부모 wingui 마운트에서 찾을 수 없음: " + jsxFile,
                    "menuFilePath", menuFilePath));
        }
        String jsxSource;
        try {
            jsxSource = Files.readString(jsxFile);
        } catch (IOException e) {
            log.error("JSX 읽기 실패: {}", jsxFile, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "error", "JSX 읽기 실패: " + e.getMessage()));
        }

        // 3) JSX 분석 — zAxios URL / callService id / SP_UI_*
        Set<String> urls       = extractZAxiosUrls(jsxSource);
        Set<String> serviceIds = extractCallServiceIds(jsxSource);
        Set<String> spNames    = extractSpNames(jsxSource);

        // 4) URL 로 Controller .java 위치 매칭 + 같은 디렉토리 peer 동봉
        List<Map<String, Object>> controllers   = new ArrayList<>();
        List<Map<String, Object>> services      = new ArrayList<>();
        List<Map<String, Object>> repositories  = new ArrayList<>();
        List<Map<String, Object>> entities      = new ArrayList<>();
        Set<String> visitedDirs   = new HashSet<>();
        Set<String> visitedFiles  = new HashSet<>();

        for (String url : urls) {
            List<Path> matches = findControllersByUrl(url, targetCd);
            for (Path ctrl : matches) {
                addJavaFile(controllers, ctrl, visitedFiles);
                Path dir = ctrl.getParent();
                if (dir != null && visitedDirs.add(dir.toString())) {
                    addPeerJavaFiles(dir, services, repositories, entities, visitedFiles);
                }
            }
        }

        // 5) response 조립 — wingui 의 raw bundle 형태와 동일한 핵심 키 유지
        Map<String, Object> screen = new LinkedHashMap<>();
        screen.put("path",   jsxFile.toString());
        screen.put("source", jsxSource);

        // Repository .java 각각에 대해 method-name → SQL 매핑 보강
        //   - 첫번째 entity 의 @Table(name=...) 을 테이블명으로 활용
        String entitySource = entities.isEmpty() ? null
            : stringOf(entities.get(0).get("source"));
        for (Map<String, Object> repo : repositories) {
            String repoSrc = stringOf(repo.get("source"));
            List<Map<String, Object>> queryMethods = sqlMapper.inferAll(repoSrc, entitySource);
            repo.put("queryMethods", queryMethods);
        }

        Map<String, Object> backend = new LinkedHashMap<>();
        backend.put("controllers",  controllers);
        backend.put("services",     services);
        backend.put("repositories", repositories);
        backend.put("entities",     entities);
        backend.put("procedures",   Collections.emptyList());   // SP DDL 경로 미마운트 — 미지원

        List<Map<String, Object>> apiCalls = new ArrayList<>();
        for (String u : urls) apiCalls.add(Map.of("url", u, "type", "zAxios"));
        for (String s : serviceIds) apiCalls.add(Map.of("url", s, "type", "callService"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success",       true);
        result.put("menuCd",        menuCd);
        result.put("menuFilePath",  menuFilePath);
        result.put("screen",        screen);
        result.put("frontendSources",    Collections.emptyList()); // (확장 여지)
        result.put("frontendProcedures", Collections.emptyMap());  // (확장 여지)
        result.put("backend",       backend);
        result.put("apiCalls",      apiCalls);
        result.put("apiCallCount",  apiCalls.size());
        result.put("proceduresUsed", new ArrayList<>(spNames));

        log.info("collect-source-for-llm — menuCd={} urls={} svcIds={} sps={} ctrls={} svcs={} repos={} ents={}",
            menuCd, urls.size(), serviceIds.size(), spNames.size(),
            controllers.size(), services.size(), repositories.size(), entities.size());

        return ResponseEntity.ok(result);
    }

    // ──────────────────────────────────────────────────────────────
    // 경로 변환 & 파일 매칭 헬퍼
    // ──────────────────────────────────────────────────────────────

    /**
     * contentStore.js 변환식과 동일:
     *   filepath = MENU_FILE_PATH.toLowerCase() + MENU_FILE_PATH.slice(lastIndexOf('/'))
     * 예) "/system/usermgmt/Users" → "system/usermgmt/users/Users"
     *     "/util/UserInfoMgmt"      → "util/userinfomgmt/UserInfoMgmt"
     */
    String resolveJsxRelPath(String menuFilePath) {
        if (menuFilePath == null) return "";
        String fp = menuFilePath.startsWith("/") ? menuFilePath.substring(1) : menuFilePath;
        int lastSlash = fp.lastIndexOf('/');
        if (lastSlash < 0) {
            // 단일 세그먼트 (예: "Dashboard") — view/dashboard/Dashboard.jsx
            return fp.toLowerCase() + "/" + fp;
        }
        String lowered  = fp.toLowerCase();
        String basename = fp.substring(lastSlash + 1);
        return lowered + "/" + basename;
    }

    private static final Pattern ZAXIOS_CALL_RE =
        Pattern.compile("zAxios\\.(?:get|post|put|delete|patch)\\s*\\(\\s*[\\'\"`]([^\\'\"`]+)[\\'\"`]");
    private static final Pattern URL_OBJECT_RE =
        Pattern.compile("url\\s*:\\s*[\\'\"`]([^\\'\"`]+)[\\'\"`]");
    /**
     * PLANNEL 류 — `<service>.{get,post,put,delete,patch}('/api/...')` 호출 매칭.
     * 첫 인자가 `/api/` 로 시작해야 — false positive (array.get(idx) 등) 차단.
     * `restApi.post('/api/users')` 와 `dashboardService.get('/api/dashboard-kpi')` 모두 매치.
     */
    private static final Pattern REST_API_CALL_RE =
        Pattern.compile("[A-Za-z_][\\w$]*\\.(?:get|post|put|delete|patch)\\s*\\(\\s*[\\'\"`](/api/[^\\'\"`]+)[\\'\"`]");
    private static final Pattern CALL_SERVICE_RE =
        Pattern.compile("callService\\s*\\(\\s*[\\'\"`]([A-Z][A-Z0-9_]+)[\\'\"`]");
    private static final Pattern SP_UI_RE =
        Pattern.compile("\\b(SP_UI_[A-Z][A-Z0-9_]+|SRV_(?:GET|SET)_SP_UI_[A-Z][A-Z0-9_]+)\\b");

    Set<String> extractZAxiosUrls(String source) {
        Set<String> out = new LinkedHashSet<>();
        Matcher m1 = ZAXIOS_CALL_RE.matcher(source);
        while (m1.find()) out.add(stripLeadingSlash(m1.group(1)));
        Matcher m2 = URL_OBJECT_RE.matcher(source);
        while (m2.find()) out.add(stripLeadingSlash(m2.group(1)));
        // PLANNEL 류 — restApi.{get,post,...}('/api/...') · dashboardService.get('/api/...')
        Matcher m3 = REST_API_CALL_RE.matcher(source);
        while (m3.find()) out.add(stripLeadingSlash(m3.group(1)));
        return out;
    }

    Set<String> extractCallServiceIds(String source) {
        Set<String> out = new LinkedHashSet<>();
        Matcher m = CALL_SERVICE_RE.matcher(source);
        while (m.find()) out.add(m.group(1));
        return out;
    }

    Set<String> extractSpNames(String source) {
        Set<String> out = new LinkedHashSet<>();
        Matcher m = SP_UI_RE.matcher(source);
        while (m.find()) out.add(m.group(1));
        return out;
    }

    /**
     * URL (예: "util/user-infos") 가 등장하는 @RequestMapping 의 Java 파일을 찾는다.
     * 보수적으로 시도:
     *   1) `"/util/user-infos"`  과 `"util/user-infos"`  대상으로 정확 grep
     *   2) Class-level @RequestMapping("/util") + method-level @GetMapping("/user-infos") 분할 케이스도 고려:
     *      → 첫 segment 까지로 grep 매칭 (false positive 위험은 있으나 same dir peer 가 정답 가능성↑)
     */
    List<Path> findControllersByUrl(String url, String targetCd) {
        if (url == null || url.isBlank()) return Collections.emptyList();
        String clean = stripLeadingSlash(url);
        String[] needles = {
            "\"/" + clean + "\"",
            "\"" + clean + "\"",
        };
        Path javaRoot = javaBase(targetCd);
        if (!Files.isDirectory(javaRoot)) return Collections.emptyList();

        List<Path> matches = new ArrayList<>();
        try (Stream<Path> walk = Files.walk(javaRoot)) {
            walk.filter(p -> p.toString().endsWith("Controller.java"))
                .forEach(p -> {
                    try {
                        String content = Files.readString(p);
                        if (!content.contains("@RestController") && !content.contains("@Controller")) return;
                        for (String needle : needles) {
                            if (content.contains(needle)) {
                                matches.add(p);
                                return;
                            }
                        }
                    } catch (IOException ignored) {}
                });
        } catch (IOException e) {
            log.warn("Java 디렉토리 탐색 실패: {}", e.getMessage());
        }

        // 정확한 grep 실패 시 — 첫 segment 만 prefix 매칭 (best-effort)
        if (matches.isEmpty()) {
            int slash = clean.indexOf('/');
            String prefix = slash > 0 ? clean.substring(0, slash) : clean;
            if (!prefix.isBlank()) {
                String prefixNeedle = "\"/" + prefix + "/";
                try (Stream<Path> walk = Files.walk(javaRoot)) {
                    walk.filter(p -> p.toString().endsWith("Controller.java"))
                        .forEach(p -> {
                            try {
                                String content = Files.readString(p);
                                if (!content.contains("@RestController") && !content.contains("@Controller")) return;
                                if (content.contains(prefixNeedle)) matches.add(p);
                            } catch (IOException ignored) {}
                        });
                } catch (IOException ignored) {}
            }
        }
        return matches;
    }

    private void addJavaFile(List<Map<String, Object>> bucket, Path file, Set<String> visitedFiles) {
        try {
            String key = file.toString();
            if (!visitedFiles.add(key)) return;
            String fileName  = file.getFileName().toString();
            // className = User.java → User. wizardState 의 extractEntityClassNamesFromBundle 가
            // className 우선, name 폴백으로 읽으므로 둘 다 채워 호환성 확보.
            String className = fileName.endsWith(".java") ? fileName.substring(0, fileName.length() - 5) : fileName;
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("path",      file.toString());
            entry.put("name",      fileName);
            entry.put("className", className);
            entry.put("source",    Files.readString(file));
            bucket.add(entry);
        } catch (IOException e) {
            log.warn("Java 파일 read 실패 {} — {}", file, e.getMessage());
        }
    }

    /**
     * Controller 가 속한 디렉토리의 동료 java 파일을 suffix 로 분류해 동봉.
     */
    private void addPeerJavaFiles(Path dir,
                                  List<Map<String, Object>> services,
                                  List<Map<String, Object>> repositories,
                                  List<Map<String, Object>> entities,
                                  Set<String> visitedFiles) {
        try (Stream<Path> list = Files.list(dir)) {
            list.filter(p -> p.toString().endsWith(".java"))
                // 같은 디렉토리에서 dir 이름과 동일한 className (= 정식 Entity) 가 먼저 오도록 정렬
                .sorted((a, b) -> javaSortKey(a, dir.getFileName().toString())
                                  - javaSortKey(b, dir.getFileName().toString()))
                .forEach(p -> {
                    String name = p.getFileName().toString();
                    if (name.endsWith("Controller.java")) return;       // Controller 는 이미 추가됨
                    if (name.endsWith("Service.java"))         addJavaFile(services,     p, visitedFiles);
                    else if (name.endsWith("Repository.java")) addJavaFile(repositories, p, visitedFiles);
                    // Entity bucket: Deserializer/Serializer/Util/Helper/Config/Constants/Builder 류는 제외
                    else if (!looksLikeNonEntity(name))         addJavaFile(entities,    p, visitedFiles);
                });
        } catch (IOException e) {
            log.warn("디렉토리 list 실패 {} — {}", dir, e.getMessage());
        }
    }

    /** Entity 후보 우선순위 — dir 이름과 className 이 정확히 일치하면 0 (가장 우선), 아니면 1 */
    private static int javaSortKey(Path p, String dirName) {
        String fn = p.getFileName().toString();
        String cls = fn.endsWith(".java") ? fn.substring(0, fn.length() - 5) : fn;
        // dir = 'user' / cls = 'User' → 일치 (case-insensitive)
        return cls.equalsIgnoreCase(dirName) ? 0 : 1;
    }

    private static boolean looksLikeNonEntity(String fileName) {
        String n = fileName == null ? "" : fileName;
        return n.endsWith("Deserializer.java")
            || n.endsWith("Serializer.java")
            || n.endsWith("Util.java")
            || n.endsWith("Utils.java")
            || n.endsWith("Helper.java")
            || n.endsWith("Config.java")
            || n.endsWith("Constants.java")
            || n.endsWith("Builder.java")
            || n.endsWith("Mapper.java")
            || n.endsWith("Converter.java");
    }

    private static String stripLeadingSlash(String s) {
        return (s != null && s.startsWith("/")) ? s.substring(1) : s;
    }
    private static String stringOf(Object v) { return v == null ? null : v.toString(); }

    // ───────────────────────────── JS_FILE mode (PlanNEL 등) ───────────────
    /**
     * Target.menu_source = JS_FILE 일 때의 source 수집.
     *   1) <sourceRoot>/src/pages/TabMenuList.js 파싱 → menuCd(=reduxKey/menuCd) 매칭 entry
     *   2) entry.filePath (예: "/system/Authentication") → src/pages 아래에서 .js/.jsx 검색
     *   3) 그 파일 본문을 screen.source 로. Java 백엔드 없으므로 backend.* 빈 배열.
     */
    private ResponseEntity<?> collectFromJsFileTarget(String targetCd, String menuCd) {
        String sourceRoot = pathResolver.resolveSourcePath(targetCd);
        Path[] menuFileCandidates = new Path[]{
            Path.of(sourceRoot, "src", "pages", "TabMenuList.js"),
            Path.of(sourceRoot, "src", "pages", "TabMenuList.jsx"),
            Path.of(sourceRoot, "src", "TabMenuList.js"),
        };
        Path menuFile = null;
        for (Path p : menuFileCandidates) {
            if (Files.isRegularFile(p)) { menuFile = p; break; }
        }
        if (menuFile == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "success", false,
                "error", "TabMenuList.js 파일을 찾지 못했습니다 (Target.sourceRefPath 확인). 후보: "
                       + java.util.Arrays.toString(menuFileCandidates)));
        }

        Map<String, Object> tree;
        try {
            tree = jsMenuFileParser.parse(menuFile);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false, "error", "TabMenuList.js 파싱 실패: " + e.getMessage()));
        }

        Map<String, Object> entry = findMenuEntry(tree, menuCd);
        if (entry == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "success", false,
                "error", "메뉴를 TabMenuList.js 에서 찾을 수 없음 (menuCd=reduxKey 기준): " + menuCd));
        }

        String relFilePath = stringOf(entry.get("filePath"));
        if (relFilePath == null || relFilePath.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "success", false,
                "error", "menuCd 에 대한 컴포넌트 import 경로를 찾을 수 없음: " + menuCd));
        }
        String rel = stripLeadingSlash(relFilePath);   // "data-management/HrchyConfig"

        Path pagesBase = Path.of(sourceRoot, "src", "pages");
        Path[] sourceCandidates = new Path[]{
            pagesBase.resolve(rel + ".js"),
            pagesBase.resolve(rel + ".jsx"),
            pagesBase.resolve(rel + "/index.js"),
            pagesBase.resolve(rel + "/index.jsx"),
        };
        Path sourceFile = null;
        for (Path p : sourceCandidates) {
            if (Files.isRegularFile(p)) { sourceFile = p; break; }
        }
        if (sourceFile == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "success", false,
                "error", "화면 소스 파일을 찾을 수 없음. 후보: " + java.util.Arrays.toString(sourceCandidates),
                "menuFilePath", relFilePath));
        }

        String source;
        try {
            source = Files.readString(sourceFile);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false, "error", "소스 파일 읽기 실패: " + e.getMessage()));
        }

        Map<String, Object> screen = new LinkedHashMap<>();
        screen.put("path",   sourceFile.toString());
        screen.put("source", source);

        // PLANNEL backend 분리 구조 지원 — saas-application 의 Controller/Service/Repository/Entity 를
        // JSX 의 API URL 매칭으로 찾는다. Target.backendRefPath 가 설정되어 있어야 동작
        // (없으면 javaBase 가 빈 위치라 검색 결과 0건).
        Set<String> urls = extractZAxiosUrls(source);
        List<Map<String, Object>> controllers   = new ArrayList<>();
        List<Map<String, Object>> services      = new ArrayList<>();
        List<Map<String, Object>> repositories  = new ArrayList<>();
        List<Map<String, Object>> entities      = new ArrayList<>();
        Set<String> visitedDirs   = new HashSet<>();
        Set<String> visitedFiles  = new HashSet<>();
        for (String url : urls) {
            List<Path> matches = findControllersByUrl(url, targetCd);
            for (Path ctrl : matches) {
                addJavaFile(controllers, ctrl, visitedFiles);
                Path dir = ctrl.getParent();
                if (dir != null && visitedDirs.add(dir.toString())) {
                    addPeerJavaFiles(dir, services, repositories, entities, visitedFiles);
                }
            }
        }
        // Repository .java 에 method-name → SQL 매핑 보강 (DB 모드와 동일)
        String entitySource = entities.isEmpty() ? null
            : stringOf(entities.get(0).get("source"));
        for (Map<String, Object> repo : repositories) {
            String repoSrc = stringOf(repo.get("source"));
            List<Map<String, Object>> queryMethods = sqlMapper.inferAll(repoSrc, entitySource);
            repo.put("queryMethods", queryMethods);
        }

        Map<String, Object> backend = new LinkedHashMap<>();
        backend.put("controllers",  controllers);
        backend.put("services",     services);
        backend.put("repositories", repositories);
        backend.put("entities",     entities);
        backend.put("procedures",   Collections.emptyList());

        List<Map<String, Object>> apiCalls = new ArrayList<>();
        for (String u : urls) apiCalls.add(Map.of("url", u, "type", "rest"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success",          true);
        result.put("menuCd",           menuCd);
        result.put("menuFilePath",     relFilePath);
        result.put("displayName",      entry.get("displayName"));
        result.put("i18nKey",          entry.get("i18nKey"));
        result.put("screen",           screen);
        result.put("frontendSources",  Collections.emptyList());
        result.put("frontendProcedures", Collections.emptyMap());
        result.put("backend",          backend);
        result.put("apiCalls",         apiCalls);
        result.put("apiCallCount",     apiCalls.size());
        result.put("proceduresUsed",   Collections.emptyList());
        result.put("menuSource",       "JS_FILE");

        log.info("collect-source-for-llm (JS_FILE) — target={} menuCd={} sourceFile={} backend(c{} s{} r{} e{}) apiCalls={}",
                targetCd, menuCd, sourceFile,
                controllers.size(), services.size(), repositories.size(), entities.size(),
                apiCalls.size());

        return ResponseEntity.ok(result);
    }

    /** menuTree (items[].items[]...) 에서 id 또는 dbId 가 menuCd 와 일치하는 leaf 검색. */
    @SuppressWarnings("unchecked")
    private Map<String, Object> findMenuEntry(Map<String, Object> tree, String menuCd) {
        List<Map<String, Object>> roots = (List<Map<String, Object>>) tree.get("items");
        if (roots == null) return null;
        java.util.ArrayDeque<Map<String, Object>> stack = new java.util.ArrayDeque<>(roots);
        while (!stack.isEmpty()) {
            Map<String, Object> node = stack.poll();
            if (menuCd.equals(node.get("id")) || menuCd.equals(node.get("dbId"))) return node;
            Object children = node.get("items");
            if (children instanceof List<?>) {
                for (Object c : (List<?>) children) {
                    if (c instanceof Map<?, ?>) stack.push((Map<String, Object>) c);
                }
            }
        }
        return null;
    }
}

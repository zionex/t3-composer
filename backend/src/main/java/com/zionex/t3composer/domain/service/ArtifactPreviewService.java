package com.zionex.t3composer.domain.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Stream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.zionex.t3composer.config.ApplicationProperties;
import com.zionex.t3composer.domain.entity.ComposerArtifact;
import com.zionex.t3composer.domain.repository.ComposerArtifactRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * [화면 실행] preview — target 무관, **frontend JSX/JS 만 _preview 폴더에 쓰고 끝**.
 *
 * 2026-05-18 단순화:
 *   - LLM 산출물 텍스트는 1바이트도 변환되지 않음 (artifact ↔ preview 파일 byte-identical)
 *   - DDL/SP/MENU 등 backend DB INSERT 없음
 *   - Java 산출물 컴파일/DevTools restart 없음 (T3SERIES/PLANNEL 둘 다)
 *   - 화면의 API 호출은 frontend `preview/runtime.js` 의 mock axios 가 sample 데이터로 응답
 *     → Grid/Chart 등이 mockup 데이터로 시각 렌더됨
 *
 * [화면 실행] = "산출물 파일을 webpack-dev-server 가 watch 하는 위치에 복사하고,
 *               frontend Babel sandbox runtime 이 mock 환경에서 컴포넌트를 마운트" — 그게 전부.
 *
 * confirm = 정식 apply() 호출 후 preview 흔적 (frontend 파일) 제거
 * cancel  = preview 폴더 삭제
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ArtifactPreviewService {

    private final ApplicationProperties props;
    private final ComposerArtifactRepository artifactRepo;
    private final ArtifactApplyService applyService;
    // [화면 실행 LIVE] 시 SCREEN_JSX 를 AI mockup 으로 변환 (캐시 hit 이면 즉시).
    // 실패 시 raw jsx fallback 으로 안전. setter injection — bean 미존재 환경에서도 동작.
    private com.zionex.t3composer.domain.repository.ComposerSessionRepository sessionRepo;
    private MockupTransformService mockupTransformService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    public void setSessionRepository(com.zionex.t3composer.domain.repository.ComposerSessionRepository sessionRepo) {
        this.sessionRepo = sessionRepo;
    }

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    public void setMockupTransformService(MockupTransformService svc) {
        this.mockupTransformService = svc;
    }

    // -----------------------------------------------------------------
    // applyPreview — frontend 파일만 쓰고 그 외 모두 skip
    // -----------------------------------------------------------------

    public Map<String, Object> applyPreview(String sessionId) {
        return applyPreview(sessionId, false);
    }

    /**
     * @param skipJava (deprecated, ignored) 2026-05-18 정책 단순화 후 모든 화면 실행은 항상 sample
     *                 모드로 동작 — backend 산출물 (Java/SQL/MENU) 일절 실행 안 함. 시그니처는
     *                 backward-compat 위해 유지 (controller `?skipJava=...` 쿼리 파라미터).
     */
    public Map<String, Object> applyPreview(String sessionId, boolean skipJava) {
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

        List<ComposerArtifact> artifacts = artifactRepo
                .findBySessionIdAndStatusNotOrderByCreateDttmDesc(sessionId, ComposerArtifact.STATUS_DISCARDED);
        if (artifacts.isEmpty()) {
            return failure("세션에 아티팩트가 없습니다.");
        }

        String sid8 = shortSid(sessionId);
        Path sessionPreview = previewBase.resolve(sid8);

        // 이전 preview 흔적 청소 — 현재 sid 폴더 + 다른 sid 폴더 모두 (디스크 절약 + stale 방지)
        deleteRecursively(sessionPreview);
        try (Stream<Path> s = Files.list(previewBase)) {
            s.filter(Files::isDirectory)
             .filter(p -> !p.getFileName().toString().equals(sid8))
             .forEach(this::deleteRecursively);
        } catch (IOException ignored) { /* no-op */ }

        try {
            Files.createDirectories(sessionPreview);
        } catch (IOException e) {
            return failure("preview 폴더 생성 실패: " + e.getMessage());
        }

        List<Map<String, Object>> applied = new ArrayList<>();
        int jsxOk = 0, jsxFail = 0, skipped = 0;

        // [화면 실행] = frontend-only — backend(Java/SQL/MENU) 는 일절 실행하지 않는다.
        // skipJava 파라미터는 backward-compat 위해 시그니처에 남아있으나, 사용자 정책 (2026-05-18)
        // "둘 다 화면 실행에서는 backend 구현 불필요" 에 따라 무시. SQL/MENU/Java 산출물 검증은
        // [정식 아티팩트 적용] 단계에서만 수행.
        //
        // JSX 만 골라 **병렬 변환** (Anthropic 호출이 화면당 5~10초 — 순차 처리하면 N개에서
        // N×시간 누적. 동시 호출로 전체 시간을 가장 긴 1건으로 수렴).
        List<ComposerArtifact> jsxArts = new ArrayList<>();
        for (ComposerArtifact a : artifacts) {
            String content = a.getContent();
            if (content == null || content.isBlank()) continue;
            if (ComposerArtifact.TYPE_SCREEN_JSX.equals(a.getArtifactType())) {
                jsxArts.add(a);
            } else {
                applied.add(skippedRec(a, a.getArtifactType()));
                skipped++;
            }
        }

        if (jsxArts.size() == 1) {
            // 단일 JSX — 병렬 풀 만들 가치 없음. 그대로 호출.
            Map<String, Object> rec = writeJsxToPreview(jsxArts.get(0), sessionPreview, sid8, sessionId);
            applied.add(rec);
            if (Boolean.TRUE.equals(rec.get("ok"))) jsxOk++; else jsxFail++;
        } else if (jsxArts.size() >= 2) {
            // 다중 JSX — 병렬 변환. 상한 8 (Anthropic rate-limit / 메모리 보호).
            int parallelism = Math.min(8, jsxArts.size());
            ExecutorService pool = Executors.newFixedThreadPool(parallelism);
            try {
                List<CompletableFuture<Map<String, Object>>> futures = new ArrayList<>();
                for (ComposerArtifact a : jsxArts) {
                    futures.add(CompletableFuture.supplyAsync(
                            () -> writeJsxToPreview(a, sessionPreview, sid8, sessionId), pool));
                }
                for (CompletableFuture<Map<String, Object>> f : futures) {
                    Map<String, Object> rec;
                    try {
                        rec = f.join();
                    } catch (Exception e) {
                        rec = new LinkedHashMap<>();
                        rec.put("ok", false);
                        rec.put("err", "병렬 변환 실패: " + e.getMessage());
                        rec.put("type", ComposerArtifact.TYPE_SCREEN_JSX);
                    }
                    applied.add(rec);
                    if (Boolean.TRUE.equals(rec.get("ok"))) jsxOk++; else jsxFail++;
                }
            } finally {
                pool.shutdown();
            }
        }

        boolean success = jsxFail == 0;

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
            // .jsx/.tsx/.js 확장자 제거 (PlanNEL 은 .js)
            label = label.replaceFirst("\\.(jsx|tsx|js)$", "");
            String urlPath = viewSub.replaceFirst("\\.(jsx|tsx|js)$", "");
            Map<String, Object> link = new LinkedHashMap<>();
            link.put("label", label);
            link.put("viewSub", viewSub);
            link.put("url", "/preview/" + sid8 + "/" + urlPath);
            previewLinks.add(link);
        }

        // 대시보드처럼 메인 1개 + widgets/ 폴더 안 sub 컴포넌트 N개 구조에서
        // 프런트가 previewLinks[0] 만 채택해 widget 1개가 단독 마운트되는 사고를 막는다.
        // widgets/ 폴더 안의 JSX 는 항상 후순위 — 동일 클래스 내 순서는 stable sort 로 보존.
        previewLinks.sort((a, b) -> {
            String va = String.valueOf(a.get("viewSub")).toLowerCase();
            String vb = String.valueOf(b.get("viewSub")).toLowerCase();
            boolean aw = va.contains("/widgets/") || va.startsWith("widgets/");
            boolean bw = vb.contains("/widgets/") || vb.startsWith("widgets/");
            if (aw != bw) return aw ? 1 : -1;
            return 0;
        });

        out.put("success",      success);
        out.put("sid8",         sid8);
        out.put("previewBase",  sessionPreview.toString());
        out.put("previewLinks", previewLinks);
        out.put("jsxOk",        jsxOk);
        out.put("jsxFail",      jsxFail);
        out.put("skipped",      skipped);
        out.put("items",        applied);

        if (!success) {
            List<String> failMsgs = new ArrayList<>();
            for (Map<String, Object> rec : applied) {
                if (Boolean.TRUE.equals(rec.get("ok"))) continue;
                Object e = rec.get("err");
                if (e != null) {
                    String label = String.valueOf(rec.get("type")) + " · " + String.valueOf(rec.get("fileName"));
                    failMsgs.add("[" + label + "] " + e);
                }
            }
            if (!failMsgs.isEmpty()) {
                out.put("error", String.join(" / ", failMsgs.subList(0, Math.min(3, failMsgs.size()))));
                out.put("failMessages", failMsgs);
            }
            log.warn("applyPreview failed sid8={} jsxFail={} firstErr={}",
                    sid8, jsxFail, failMsgs.isEmpty() ? "(no detail)" : failMsgs.get(0));
        }
        out.put("sampleMode", true);  // 항상 sample 모드 (backward-compat)
        out.put("note", "산출물 frontend 파일을 _preview/" + sid8 + "/ 에 복사. "
                + "API 호출은 mock 응답으로 처리되어 Grid/Chart 가 sample 데이터로 렌더됩니다. "
                + "Backend (Java/SQL/MENU) 는 [화면 실행] 시 반영되지 않습니다.");
        return out;
    }

    // -----------------------------------------------------------------
    // readPreviewJsxSource — PreviewEmbed runtime 의 fetch 백킹
    // -----------------------------------------------------------------

    /**
     * Preview 폴더에 적용된 frontend 파일의 raw 텍스트 반환.
     * frontend PreviewEmbed 가 webpack dependency graph 와 격리된 상태에서
     * runtime fetch + @babel/standalone 으로 컴포넌트를 마운트하기 위해 사용.
     *
     * @param sessionId 세션 ID (sid8 prefix 추출)
     * @param view      view 하위 경로. 확장자 (.jsx / .js / .tsx) 가 있으면 그대로 사용,
     *                  없으면 .jsx → .js → .tsx 순서로 탐색.
     * @return 파일 내용. 못 찾으면 null.
     */
    public String readPreviewJsxSource(String sessionId, String view) {
        String previewRoot = props.getComposer().getPreviewFrontendRoot();
        if (previewRoot == null || previewRoot.isBlank()) return null;
        String sid8 = shortSid(sessionId);
        String safeView = (view == null) ? "" : view.replaceAll("^/+", "").replace("\\", "/");
        // 경로 탈출 방어 — `..` segment 거부
        if (safeView.contains("..")) return null;
        Path base = Paths.get(previewRoot, sid8).toAbsolutePath().normalize();

        // 확장자 있으면 그대로, 없으면 후보 순회 (PlanNEL .js 호환)
        String lower = safeView.toLowerCase();
        String[] candidates;
        if (lower.endsWith(".jsx") || lower.endsWith(".js") || lower.endsWith(".tsx")) {
            candidates = new String[] { safeView };
        } else {
            candidates = new String[] { safeView + ".jsx", safeView + ".js", safeView + ".tsx" };
        }

        for (String c : candidates) {
            Path target = base.resolve(c).normalize();
            if (!target.startsWith(base)) continue;
            if (!Files.isRegularFile(target)) continue;
            try {
                return Files.readString(target, StandardCharsets.UTF_8);
            } catch (IOException e) {
                log.warn("preview 파일 읽기 실패 sid={} view={} err={}", sid8, c, e.getMessage());
            }
        }
        return null;
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
    // cancelPreview — preview 폴더 삭제 (단순)
    // -----------------------------------------------------------------

    @Transactional
    public Map<String, Object> cancelPreview(String sessionId) {
        Map<String, Object> out = new LinkedHashMap<>();
        String previewRoot = props.getComposer().getPreviewFrontendRoot();
        String sid8 = shortSid(sessionId);

        boolean folderDeleted = true;
        if (previewRoot != null && !previewRoot.isBlank()) {
            folderDeleted = deleteRecursively(Paths.get(previewRoot, sid8).toAbsolutePath().normalize());
        }

        out.put("success",       folderDeleted);
        out.put("sid8",          sid8);
        out.put("folderDeleted", folderDeleted);
        return out;
    }

    // -----------------------------------------------------------------
    // helpers
    // -----------------------------------------------------------------

    private static Map<String, Object> skippedRec(ComposerArtifact a, String type) {
        Map<String, Object> rec = new LinkedHashMap<>();
        rec.put("id", a.getId());
        rec.put("type", type);
        rec.put("fileName", a.getFileName());
        rec.put("ok", true);
        rec.put("skipped", true);
        rec.put("reason", "[화면 실행] 은 frontend 만 렌더 — " + type + " 은 정식 [아티팩트 적용] 에서 처리");
        return rec;
    }

    private Map<String, Object> writeJsxToPreview(ComposerArtifact a, Path sessionPreview, String sid8,
                                                   String sessionId) {
        Map<String, Object> rec = new LinkedHashMap<>();
        rec.put("id", a.getId());
        rec.put("type", a.getArtifactType());
        rec.put("fileName", a.getFileName());

        String fp = a.getFilePath();
        String viewSub = extractViewSubpath(fp, a.getFileName());
        if (viewSub == null) {
            rec.put("ok", false);
            rec.put("err", "frontend filePath 에서 view 하위 경로 추출 실패: " + fp);
            return rec;
        }
        Path target = sessionPreview.resolve(viewSub).normalize();
        if (!target.startsWith(sessionPreview)) {
            rec.put("ok", false);
            rec.put("err", "preview 경로 탈출 시도: " + viewSub);
            return rec;
        }

        // ── AI mockup 변환 (모든 Target) ──
        // SCREEN_JSX 원본을 그대로 sandbox 에서 실행하면 ambient/외부 의존성 사고가 끝없이 발생.
        // Anthropic 호출로 시각 mockup (의존성 minimal) 으로 변환 후 그것을 쓴다.
        // 캐시 hit 시 즉시. miss/실패/키없음 시 raw 원본 fallback (안전).
        String content = a.getContent();
        boolean mockupApplied = false;
        // ── AI mockup 변환은 EXISTING_MODIFY / NEW_FROM_COPY 에 적용 ──
        // EXISTING_MODIFY · NEW_FROM_COPY 둘 다 원본 wingui jsx 를 byte 단위에 가깝게
        // 복제하므로 복잡한 의존성 (AG-Grid · @plannel/services · ZDate 등) 그대로 들고옴
        // → preview shim 표면으로 자연 동작 불가 → mockup 변환 필수.
        // 그 외 신규 생성 (NEW_STEP / NEW_FROM_DESIGN / NEW_NL / NEW_GENERAL) 은 Composer
        // rules 따라 작성된 단순 산출물이라 shim 표면으로 잘 동작 — mockup 변환 생략 (토큰 절감).
        boolean needsMockup = mockupTransformService != null
            && (isExistingModify(sessionId) || isCopyFromOriginal(sessionId));
        if (needsMockup) {
            String targetCd = lookupTargetCd(sessionId);
            String sessionUserId = lookupUserId(sessionId);
            try {
                String mockup = mockupTransformService.transformOrCached(
                        content, targetCd, fp, sessionUserId, false);
                if (mockup != null && !mockup.isBlank()) {
                    content = mockup;
                    mockupApplied = true;
                }
            } catch (Exception e) {
                log.warn("mockup transform 실패 — raw jsx fallback sid={} fp={} err={}",
                        sid8, fp, e.getMessage());
            }
        }

        try {
            Files.createDirectories(target.getParent());
            Files.writeString(target, content, StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE,
                    StandardOpenOption.TRUNCATE_EXISTING,
                    StandardOpenOption.WRITE);
            rec.put("ok", true);
            rec.put("path", target.toString());
            rec.put("viewSub", viewSub);
            rec.put("mockupApplied", mockupApplied);
        } catch (Exception e) {
            rec.put("ok", false);
            rec.put("err", e.getMessage());
            log.warn("preview frontend 쓰기 실패 sid={} fp={} err={}", sid8, fp, e.getMessage());
        }
        return rec;
    }

    /** sessionId → session.targetCd. 못 찾으면 "UNKNOWN" 으로 prompt 분기에 영향 X. */
    private String lookupTargetCd(String sessionId) {
        if (sessionId == null || sessionRepo == null) return "UNKNOWN";
        try {
            return sessionRepo.findById(sessionId)
                    .map(com.zionex.t3composer.domain.entity.ComposerSession::getTargetCd)
                    .filter(s -> s != null && !s.isBlank())
                    .orElse("UNKNOWN");
        } catch (Exception e) {
            return "UNKNOWN";
        }
    }

    /** sessionId → session.userId. API key lookup 의 기준. 못 찾으면 "composer-dev" (fallback). */
    private String lookupUserId(String sessionId) {
        if (sessionId == null || sessionRepo == null) return "composer-dev";
        try {
            return sessionRepo.findById(sessionId)
                    .map(com.zionex.t3composer.domain.entity.ComposerSession::getUserId)
                    .filter(s -> s != null && !s.isBlank())
                    .orElse("composer-dev");
        } catch (Exception e) {
            return "composer-dev";
        }
    }

    /** session.mode 가 EXISTING_MODIFY 면 true. mockup transform 분기 조건. */
    private boolean isExistingModify(String sessionId) {
        if (sessionId == null || sessionRepo == null) return false;
        try {
            return sessionRepo.findById(sessionId)
                    .map(com.zionex.t3composer.domain.entity.ComposerSession::getMode)
                    .filter(com.zionex.t3composer.domain.entity.ComposerSession.MODE_EXISTING_MODIFY::equals)
                    .isPresent();
        } catch (Exception e) {
            return false;
        }
    }

    /** session.mode 가 NEW_FROM_COPY 면 true. NEW_FROM_COPY 도 원본 jsx 의 복잡한
     *  의존성 (AG-Grid · @plannel · ZDate 등) 을 byte 단위로 복제하므로 EXISTING_MODIFY
     *  와 동일하게 mockup 변환 필요. */
    private boolean isCopyFromOriginal(String sessionId) {
        if (sessionId == null || sessionRepo == null) return false;
        try {
            return sessionRepo.findById(sessionId)
                    .map(com.zionex.t3composer.domain.entity.ComposerSession::getMode)
                    .filter(com.zionex.t3composer.domain.entity.ComposerSession.MODE_NEW_FROM_COPY::equals)
                    .isPresent();
        } catch (Exception e) {
            return false;
        }
    }

    private String extractViewSubpath(String filePath, String fileName) {
        if (filePath != null && !filePath.isBlank()) {
            String norm = filePath.replace('\\', '/');
            // T3Series: packages/wingui/src/view/<...>/Name.jsx
            int idx = norm.indexOf("/view/");
            if (idx >= 0) return norm.substring(idx + "/view/".length());
            int srcView = norm.indexOf("src/view/");
            if (srcView >= 0) return norm.substring(srcView + "src/view/".length());
            // PlanNEL: saas-web/src/pages/<area>/Name.js
            int pages = norm.indexOf("/pages/");
            if (pages >= 0) return norm.substring(pages + "/pages/".length());
            int srcPages = norm.indexOf("src/pages/");
            if (srcPages >= 0) return norm.substring(srcPages + "src/pages/".length());
        }
        if (fileName != null) {
            // fallback — fileName 만 있을 때 임시 디렉토리 구조 생성
            String lower = fileName.toLowerCase();
            String base = fileName;
            if (lower.endsWith(".jsx"))      base = fileName.substring(0, fileName.length() - 4);
            else if (lower.endsWith(".tsx")) base = fileName.substring(0, fileName.length() - 4);
            else if (lower.endsWith(".js"))  base = fileName.substring(0, fileName.length() - 3);
            else return null;
            return "util/" + base.toLowerCase() + "/" + fileName;
        }
        return null;
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

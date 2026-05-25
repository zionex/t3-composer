package com.zionex.t3composer.domain.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.zionex.t3composer.domain.client.AnthropicApiException;
import com.zionex.t3composer.domain.dto.AnalyzeQueryRequest;
import com.zionex.t3composer.domain.dto.ApiKeyRequest;
import com.zionex.t3composer.domain.dto.AutoSuggestRequest;
import com.zionex.t3composer.domain.dto.PrefillFromDesignRequest;
import com.zionex.t3composer.domain.dto.PrefillFromSourceRequest;
import com.zionex.t3composer.domain.service.DesignDocAnalyzeService;
import com.zionex.t3composer.domain.service.DesignDocExportService;
import com.zionex.t3composer.domain.service.MenuRegistrationService;
import com.zionex.t3composer.domain.service.PrefillFromDesignService;
import com.zionex.t3composer.domain.service.PrefillFromSourceService;
import com.zionex.t3composer.domain.dto.ArtifactDto;
import com.zionex.t3composer.domain.dto.ChatRequest;
import com.zionex.t3composer.domain.dto.CreateSessionRequest;
import com.zionex.t3composer.domain.dto.MessageDto;
import com.zionex.t3composer.domain.dto.SessionDto;
import com.zionex.t3composer.domain.entity.ComposerSession;
import com.zionex.t3composer.domain.service.AnthropicApiKeyService;
import com.zionex.t3composer.domain.service.ArtifactApplyService;
import com.zionex.t3composer.domain.service.AutoSuggestService;
import com.zionex.t3composer.domain.service.ArtifactPreviewService;
import com.zionex.t3composer.domain.service.ComposerService;
import com.zionex.t3composer.domain.service.PreviewModuleResolver;
import com.zionex.t3composer.shared.auth.AuthenticationInfo;
import com.zionex.t3composer.shared.auth.AuthenticationProvider;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * T3Composer REST 엔드포인트.
 * - /composer/apikey          : Anthropic API 키 관리
 * - /composer/sessions        : 세션 CRUD
 * - /composer/sessions/{id}/messages · /chat · /artifacts
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/composer")
public class ComposerController {

    private final ComposerService composerService;
    private final AnthropicApiKeyService apiKeyService;
    private final AuthenticationProvider authenticationProvider;
    private final MenuRegistrationService menuRegistrationService;
    private final DesignDocExportService designDocExportService;
    private final DesignDocAnalyzeService designDocAnalyzeService;
    private final PrefillFromSourceService prefillFromSourceService;
    private final AutoSuggestService autoSuggestService;
    private final PrefillFromDesignService prefillFromDesignService;
    private final ArtifactApplyService artifactApplyService;
    private final ArtifactPreviewService artifactPreviewService;
    private final PreviewModuleResolver previewModuleResolver;

    // ---- API Key ----

    @GetMapping("/apikey/status")
    public Map<String, Object> apiKeyStatus() {
        String userId = currentUserId();
        return Map.of(
                "registered", apiKeyService.hasApiKey(userId),
                "provider",   AnthropicApiKeyService.PROVIDER
        );
    }

    @GetMapping("/apikey/diag")
    public Map<String, Object> apiKeyDiag() {
        return apiKeyService.diagApiKey(currentUserId());
    }

    @PostMapping("/apikey")
    public ResponseEntity<Map<String, String>> saveApiKey(@RequestBody ApiKeyRequest req) {
        if (req == null || req.getApiKey() == null || req.getApiKey().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "apiKey 가 비어 있습니다"));
        }
        String userId = currentUserId();
        apiKeyService.saveApiKey(userId, req.getApiKey().trim(), req.getDescription());
        return ResponseEntity.ok(Map.of("message", "Anthropic API 키가 저장되었습니다"));
    }

    @DeleteMapping("/apikey")
    public ResponseEntity<Map<String, String>> deleteApiKey() {
        String userId = currentUserId();
        apiKeyService.deleteApiKey(userId);
        return ResponseEntity.ok(Map.of("message", "Anthropic API 키가 삭제되었습니다"));
    }

    // ---- Preview (Phase 2a — JSX/SQL/MENU 만 docker 안에서 검증) ----

    /**
     * @param skipJava Sample 모드용 빠른 미리보기 — Java 산출물 적용·mvn compile·DevTools 재기동 생략.
     *                 frontend Sample shim 이 axios 응답을 가로채므로 backend 미동작 OK (10~20초 down 회피).
     */
    @PostMapping("/sessions/{sessionId}/preview/apply")
    public Map<String, Object> previewApply(@PathVariable String sessionId,
                                            @RequestParam(name = "skipJava", required = false, defaultValue = "false") boolean skipJava) {
        return artifactPreviewService.applyPreview(sessionId, skipJava);
    }

    @PostMapping("/sessions/{sessionId}/preview/confirm")
    public Map<String, Object> previewConfirm(@PathVariable String sessionId,
                                              @RequestBody(required = false) ArtifactApplyService.ApplyOptions opts) {
        return artifactPreviewService.confirmPreview(sessionId, opts);
    }

    @PostMapping("/sessions/{sessionId}/preview/cancel")
    public Map<String, Object> previewCancel(@PathVariable String sessionId) {
        return artifactPreviewService.cancelPreview(sessionId);
    }

    /**
     * preview JSX 파일의 raw 텍스트.
     *
     * frontend PreviewEmbed 가 webpack dependency graph 와 격리된 상태에서
     * runtime fetch + @babel/standalone 변환으로 컴포넌트를 마운트하기 위해 사용.
     *
     * 격리 효과: 산출물 JSX 에 syntax error / Module not found 가 있어도
     * main bundle 의 컴파일에는 영향이 없음. 에러는 fetch 응답이 200 OK
     * + 본문이지만 babel 변환에서 잡혀 PreviewEmbed 의 Alert 으로 표시됨.
     */
    @GetMapping(value = "/sessions/{sessionId}/preview/source-jsx",
                produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> previewSourceJsx(@PathVariable String sessionId,
                                                   @org.springframework.web.bind.annotation.RequestParam("view") String view) {
        String src = artifactPreviewService.readPreviewJsxSource(sessionId, view);
        if (src == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("// preview JSX 를 찾지 못했습니다: " + view);
        }
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("text/plain; charset=UTF-8"))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(src);
    }

    /**
     * preview runtime 의 부재 import 해결 — 원본 wingui 의 monorepo src 에서 raw text 반환.
     *
     * 매핑:
     *   @wingui/&lt;X&gt;                      → &lt;winguiRoot&gt;/packages/wingui/src/&lt;X&gt;
     *   @zionex/wingui-core[/&lt;X&gt;]         → &lt;winguiRoot&gt;/packages/wingui-core[/&lt;X&gt;]
     *   기타 (target wingui 안 임의 path)  → 절대경로 그대로 (단 winguiRoot prefix 안만 허용)
     *
     * 확장자 미지정 시 후보: .js → .jsx → /index.js → /index.jsx
     *
     * 격리: 산출물 JSX 가 부재 import 를 만나도 main bundle 영향 0.
     */
    /**
     * Target 의 wingui CSS 번들 — iframe 격리된 PreviewEmbed 에 inject 용.
     * realgrid 테마 + wingui grid 기본 + custom override 를 단일 텍스트로 반환.
     */
    /** realgrid UMD bundle — iframe 안 RealGrid 별도 instance 로드용. */
    @GetMapping(value = "/preview/realgrid-umd",
                produces = "application/javascript; charset=UTF-8")
    public ResponseEntity<String> previewRealgridUmd(
            @org.springframework.web.bind.annotation.RequestParam(value = "targetCd", required = false) String targetCd) {
        com.zionex.t3composer.domain.service.PreviewModuleResolver.Resolved r =
                previewModuleResolver.resolveRealgridUmd(targetCd);
        if (r == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.valueOf("application/javascript; charset=UTF-8"))
                    .body("// realgrid UMD bundle 을 찾지 못했습니다.");
        }
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("application/javascript; charset=UTF-8"))
                .header(HttpHeaders.CACHE_CONTROL, "max-age=300")
                .header("X-Preview-Resolved-Path", r.relativePath())
                .body(r.source());
    }

    @GetMapping(value = "/preview/css",
                produces = "text/css; charset=UTF-8")
    public ResponseEntity<String> previewCss(
            @org.springframework.web.bind.annotation.RequestParam(value = "targetCd", required = false) String targetCd) {
        String css = previewModuleResolver.bundleCss(targetCd);
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("text/css; charset=UTF-8"))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(css);
    }

    @GetMapping(value = "/preview/resolve-module",
                produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> resolveModule(
            @org.springframework.web.bind.annotation.RequestParam("spec") String spec,
            @org.springframework.web.bind.annotation.RequestParam(value = "targetCd", required = false) String targetCd) {
        if (spec == null || spec.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("// spec 파라미터 필요");
        }
        com.zionex.t3composer.domain.service.PreviewModuleResolver.Resolved resolved =
                previewModuleResolver.resolve(spec, targetCd);
        if (resolved == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("// 모듈을 찾지 못했습니다: " + spec);
        }
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("text/plain; charset=UTF-8"))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .header("X-Preview-Resolved-Path", resolved.relativePath())
                .body(resolved.source());
    }

    // ---- Sessions ----

    @PostMapping("/sessions")
    public SessionDto createSession(@RequestBody CreateSessionRequest req) {
        String userId = currentUserId();
        ComposerSession session = composerService.createSession(userId, req);
        return SessionDto.from(session);
    }

    @GetMapping("/sessions")
    public List<SessionDto> listSessions() {
        String userId = currentUserId();
        return composerService.listSessions(userId).stream()
                .map(SessionDto::from)
                .collect(Collectors.toList());
    }

    @GetMapping("/sessions/{sessionId}")
    public SessionDto getSession(@PathVariable String sessionId) {
        return SessionDto.from(composerService.getSession(sessionId));
    }

    @PostMapping("/sessions/{sessionId}/status/{status}")
    public SessionDto updateStatus(@PathVariable String sessionId, @PathVariable String status) {
        return SessionDto.from(composerService.updateStatus(sessionId, status));
    }

    /**
     * 세션의 AI 엔진(모델) 변경.
     * 아티팩트 생성 후 또는 History 이어하기 진입 후에도 사용자가 Opus / Sonnet 을 전환할 수 있다.
     * body: { "modelName": "claude-opus-4-7" | "claude-sonnet-4-6" | "" }
     */
    @PostMapping("/sessions/{sessionId}/model")
    public SessionDto updateSessionModel(
            @PathVariable String sessionId,
            @RequestBody Map<String, String> body) {
        String modelName = body == null ? null : body.get("modelName");
        return SessionDto.from(composerService.updateModel(sessionId, modelName));
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Map<String, String>> deleteSession(@PathVariable String sessionId) {
        composerService.deleteSession(sessionId);
        return ResponseEntity.ok(Map.of("message", "deleted"));
    }

    // ---- Messages / Chat ----

    @GetMapping("/sessions/{sessionId}/messages")
    public List<MessageDto> listMessages(@PathVariable String sessionId) {
        return composerService.listMessages(sessionId).stream()
                .map(MessageDto::from)
                .collect(Collectors.toList());
    }

    /**
     * 사용자 메시지 추가 + Claude 호출 (non-streaming).
     * 응답의 아티팩트는 자동 추출되어 /sessions/{id}/artifacts 로 조회 가능.
     */
    @PostMapping("/sessions/{sessionId}/chat")
    public Mono<MessageDto> chat(@PathVariable String sessionId, @RequestBody ChatRequest req) {
        String userId = currentUserId();

        if (req == null || req.getMessage() == null || req.getMessage().isBlank()) {
            return Mono.error(new IllegalArgumentException("message 가 비어 있습니다"));
        }

        // 사용자 메시지 저장
        composerService.appendUserMessage(sessionId, req.getMessage());

        // Claude 호출 → assistant 저장
        //   D&D 로 첨부된 binary (이미지/PDF) 는 마지막 user message 에 content block 으로 부착
        return composerService.chat(userId, sessionId, req.getAttachments())
                .map(MessageDto::from)
                .doOnError(e -> log.error("Composer chat error: {}", e.getMessage(), e));
    }

    /**
     * Phase 2D-3 — AI 추천 (FilterBar + Layer 관계).
     *
     * 현재 ComposerSpec 을 Claude 에 전송해 자주 필요할 검색조건/관계 추천 받기.
     * 응답: { filterFields: [{label, type}], relations: [{sourceLayerKey, sourceEvent, targetLayerKey, targetAction, mapping}] }
     */
    @PostMapping("/spec/auto-suggest")
    public Map<String, Object> autoSuggest(@RequestBody AutoSuggestRequest req) {
        String userId = currentUserId();
        Map<String, Object> spec = (req == null) ? null : req.getSpec();
        String instruction = (req == null) ? null : req.getInstruction();
        return autoSuggestService.suggest(userId, spec, instruction);
    }

    // ---- Artifacts ----

    /**
     * 세션 아티팩트 목록.
     * @param history (선택) true 면 supersede 된 이전 버전(STATUS_DISCARDED) 까지 포함. 기본 false (최신만).
     */
    @GetMapping("/sessions/{sessionId}/artifacts")
    public List<ArtifactDto> listArtifacts(
            @PathVariable String sessionId,
            @org.springframework.web.bind.annotation.RequestParam(value = "history", required = false, defaultValue = "false") boolean history) {
        return composerService.listArtifacts(sessionId, history).stream()
                .map(ArtifactDto::summary)
                .collect(Collectors.toList());
    }

    @GetMapping("/artifacts/{artifactId}")
    public ResponseEntity<ArtifactDto> getArtifact(@PathVariable String artifactId) {
        return composerService.getArtifact(artifactId)
                .map(a -> ResponseEntity.ok(ArtifactDto.full(a)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    /**
     * 세션 아티팩트 재추출 — assistant 응답 텍스트를 다시 파싱.
     * 추출기(ArtifactExtractor) 정규식 개선 후, 기존 세션의 빈/누락 아티팩트를
     * LLM 재호출 없이 원본 응답으로부터 복구한다.
     * @return { reExtracted: N }
     */
    @PostMapping("/sessions/{sessionId}/artifacts/re-extract")
    public ResponseEntity<Map<String, Object>> reExtractArtifacts(@PathVariable String sessionId) {
        int count = composerService.reExtractArtifacts(sessionId, currentUserId());
        Map<String, Object> out = new HashMap<>();
        out.put("reExtracted", count);
        return ResponseEntity.ok(out);
    }

    /**
     * EXISTING_MODIFY — 선택 메뉴의 소스 번들(collectSourceForLlm 응답)을 세션 아티팩트로 import.
     * 사용자가 현재 기준 baseline 을 아티팩트 트리에서 보고 필요한 파일만 수정하도록 한다.
     * body: collectSourceForLlm 응답 그대로. → { imported: N }
     */
    @PostMapping("/sessions/{sessionId}/import-source-artifacts")
    public ResponseEntity<Map<String, Object>> importSourceArtifacts(
            @PathVariable String sessionId,
            @RequestBody Map<String, Object> bundle) {
        int count = composerService.importSourceArtifacts(sessionId, currentUserId(), bundle);
        Map<String, Object> out = new HashMap<>();
        out.put("imported", count);
        return ResponseEntity.ok(out);
    }

    /**
     * Supersede 된 이전 버전(STATUS_DISCARDED) 아티팩트를 일괄 hard delete.
     * 사용자가 "이전 버전 정리" 액션을 명시 호출했을 때만 실행.
     * @return { deleted: N }
     */
    @PostMapping("/sessions/{sessionId}/artifacts/cleanup")
    public ResponseEntity<Map<String, Object>> cleanupSupersededArtifacts(@PathVariable String sessionId) {
        int deleted = composerService.cleanupSupersededArtifacts(sessionId);
        Map<String, Object> out = new HashMap<>();
        out.put("deleted", deleted);
        return ResponseEntity.ok(out);
    }

    /**
     * Orphan 아티팩트 정리 — DISCARDED DB 레코드 hard delete + (옵션) 디스크 파일 삭제.
     *
     * Orphan 발생 케이스:
     *  - SP 이름 변경 시 자동 supersede 로 DISCARDED 마킹된 이전 SP 아티팩트
     *  - 사용자가 명시적으로 폐기 처리한 아티팩트
     *
     * @param body { "deleteFiles": true|false } — true 면 디스크 파일도 삭제 (apply 된 적 있는 파일만 영향)
     * @return { deletedRecords, deletedFiles, skippedFiles, deletedPaths, skippedPaths }
     */
    @PostMapping("/sessions/{sessionId}/artifacts/cleanup-orphans")
    public ResponseEntity<Map<String, Object>> cleanupOrphanArtifacts(
            @PathVariable String sessionId,
            @org.springframework.web.bind.annotation.RequestBody(required = false) Map<String, Object> body) {
        boolean deleteFiles = body != null && Boolean.TRUE.equals(body.get("deleteFiles"));
        Map<String, Object> result = composerService.cleanupOrphanArtifacts(sessionId, deleteFiles);
        return ResponseEntity.ok(result);
    }

    // ---- Menu Registration (MENU_SQL 아티팩트 실행) ----

    /**
     * 세션 내 MENU_SQL 아티팩트를 실제 DB(TB_AD_MENU · TB_AD_LANG_PACK) 에 적용.
     * 허용 테이블 외 참조 시 차단, DROP/TRUNCATE 등 파괴적 구문 차단.
     * body.sqlOverride 가 제공되면 DB 에 저장된 아티팩트 대신 그 SQL 을 실행.
     * (트리 픽커로 부모 메뉴를 변경한 후 재실행하는 시나리오)
     */
    @PostMapping("/sessions/{sessionId}/execute-menu-sql")
    public ResponseEntity<Map<String, Object>> executeMenuSql(
            @PathVariable String sessionId,
            @org.springframework.web.bind.annotation.RequestBody(required = false) Map<String, Object> body) {
        try {
            String sqlOverride = body == null ? null : (String) body.get("sqlOverride");
            Map<String, Object> result = menuRegistrationService.executeSessionMenuSql(sessionId, sqlOverride);
            boolean success = Boolean.TRUE.equals(result.get("success"));
            return ResponseEntity.status(success ? HttpStatus.OK : HttpStatus.BAD_REQUEST).body(result);
        } catch (Exception e) {
            // 서비스 내부의 예상 경로는 실패 시에도 Map 반환. 여기까지 오는 건 정말
            // 예상외의 예외(UnexpectedRollback / DataAccess 등). 500 대신 400 포장 +
            // 사용자에게 원인 메시지 전달.
            log.error("Menu SQL execute unexpected failure session={}: {}", sessionId, e.getMessage(), e);
            Map<String, Object> body2 = new java.util.HashMap<>();
            body2.put("success", false);
            body2.put("executed", 0);
            body2.put("skipped", 0);
            body2.put("errors", java.util.List.of(
                    "서버 예외: " + (e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage())));
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body2);
        }
    }

    /**
     * 지정 MENU_CD 가 TB_AD_MENU 에 존재하는지 확인 (부모 메뉴 검증용).
     */
    @GetMapping("/menus/{menuCd}/exists")
    public Map<String, Boolean> menuExists(@PathVariable String menuCd) {
        return Map.of("exists", menuRegistrationService.parentMenuExists(menuCd));
    }

    /**
     * 아티팩트 자동 적용 — JSX/Java/menus.js 를 프로젝트 폴더에 저장하고,
     * DDL/SP 를 선택적으로 DB 에 직접 실행한다.
     * body: { applyFiles?: bool, executeDdl?: bool, executeSp?: bool, overwrite?: bool }
     */
    @PostMapping("/sessions/{sessionId}/apply-artifacts")
    public ResponseEntity<Map<String, Object>> applyArtifacts(
            @PathVariable String sessionId,
            @org.springframework.web.bind.annotation.RequestBody(required = false) Map<String, Object> body) {
        try {
            ArtifactApplyService.ApplyOptions opts = new ArtifactApplyService.ApplyOptions();
            if (body != null) {
                if (body.get("autoApply")  instanceof Boolean v)  opts.autoApply  = v;
                if (body.get("applyFiles") instanceof Boolean v)  opts.applyFiles = v;
                if (body.get("executeDdl") instanceof Boolean v)  opts.executeDdl = v;
                if (body.get("executeSp")  instanceof Boolean v)  opts.executeSp  = v;
                if (body.get("overwrite")  instanceof Boolean v)  opts.overwrite  = v;
            }
            Map<String, Object> result = artifactApplyService.apply(sessionId, opts);
            boolean ok = Boolean.TRUE.equals(result.get("success"));
            // autoApplyDisabled 는 admin policy 안내 — 200 OK (서버 오류 아님)
            boolean informational = Boolean.TRUE.equals(result.get("autoApplyDisabled"));
            return ResponseEntity.status(ok || informational ? HttpStatus.OK : HttpStatus.BAD_REQUEST).body(result);
        } catch (Exception e) {
            log.error("apply-artifacts unexpected failure session={}: {}", sessionId, e.getMessage(), e);
            Map<String, Object> err = new java.util.HashMap<>();
            err.put("success", false);
            err.put("error", "서버 예외: " + (e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage()));
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }
    }

    /**
     * 적용 직전 사전 검증 — 자주 발생하는 JSX/Java/SQL 오류 (textAlignment 'near', javax.*,
     * BaseGrid columns/afterCreate, TB_AD_LANG_PACK UPDATE_BY 등) 를 자동 보정해 DB 에 저장.
     * 응답에 보정된 항목 목록을 반환해 사용자가 무엇이 자동 수정되었는지 확인 가능.
     */
    @PostMapping("/sessions/{sessionId}/preflight")
    public ResponseEntity<Map<String, Object>> preflightArtifacts(@PathVariable String sessionId) {
        try {
            Map<String, Object> result = artifactApplyService.preflight(sessionId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("preflight unexpected failure session={}: {}", sessionId, e.getMessage(), e);
            Map<String, Object> err = new java.util.HashMap<>();
            err.put("success", false);
            err.put("error", "preflight 실패: " + (e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage()));
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }
    }

    // ---- Design Doc Export (Excel) ----

    /**
     * 세션 아티팩트로부터 화면설계서 Excel(.xlsx) 생성 후 다운로드.
     */
    @GetMapping("/sessions/{sessionId}/design-doc")
    public ResponseEntity<ByteArrayResource> exportDesignDoc(@PathVariable String sessionId) {
        try {
            byte[] xlsx = designDocExportService.export(sessionId);
            String fileName = "design-doc-" + sessionId + ".xlsx";
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + fileName + "\"")
                    .body(new ByteArrayResource(xlsx));
        } catch (Exception e) {
            log.error("Design doc export failed: {}", e.getMessage(), e);
            throw new RuntimeException("설계서 생성 실패: " + e.getMessage(), e);
        }
    }

    // ---- Design Doc — Query TAB AI 분석 ----

    /**
     * 설계서 Excel 의 Query 시트 텍스트를 Claude 에 보내 grid 별 CRUD SP 매핑을 추출.
     *
     * Request  body: AnalyzeQueryRequest (queryText + grids + orientation + instruction)
     * Response body: { mapping: { "1": { read, create, update, delete }, "2": {...} },
     *                  modelName: "claude-sonnet-4-5" }
     *
     * Q1/Q2 suffix 기반 유추 금지 / 공통코드 reference SP 제외 / 문맥으로만 판단.
     */
    @PostMapping("/design-doc/analyze-query")
    public ResponseEntity<Map<String, Object>> analyzeQuerySheet(@RequestBody AnalyzeQueryRequest req) {
        try {
            Map<String, Object> result = designDocAnalyzeService.analyzeQuerySheet(currentUserId(), req);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            // API key 미등록 등 사용자 조치 필요 → 400
            log.warn("analyze-query rejected: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "error",   "bad_request",
                    "message", e.getMessage()));
        }
    }

    /**
     * NEW_FROM_COPY — sourceBundle 을 LLM 한 번 호출로 분석해 9단계 spec JSON 을 반환.
     * 정규식 기반 frontend prefill 의 한계 (CUD SP/FilterBar 누락 등) 우회.
     * frontend 는 받은 spec 을 createInitialSpec 의 결과와 깊게 병합해 wizard 에 전달.
     */
    @PostMapping("/prefill-from-source")
    public ResponseEntity<Map<String, Object>> prefillFromSource(@RequestBody PrefillFromSourceRequest req) {
        try {
            Map<String, Object> result = prefillFromSourceService.prefill(currentUserId(), req);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            log.warn("prefill-from-source rejected: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "error",   "bad_request",
                    "message", e.getMessage()));
        } catch (Exception e) {
            log.error("prefill-from-source failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error",   "server_error",
                    "message", e.getMessage() != null ? e.getMessage() : "unknown"));
        }
    }

    /**
     * NEW_FROM_DESIGN — parsedDesign(Excel sheets) 을 LLM 한 번 호출로 분석해 9단계 spec JSON 을 반환.
     * 정규식 기반 frontend prefill 의 한계 (Step4 dataBinding · Step7 filter · Step8 cascade 누락) 우회.
     */
    @PostMapping("/prefill-from-design")
    public ResponseEntity<Map<String, Object>> prefillFromDesign(@RequestBody PrefillFromDesignRequest req) {
        try {
            Map<String, Object> result = prefillFromDesignService.prefill(currentUserId(), req);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            log.warn("prefill-from-design rejected: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "error",   "bad_request",
                    "message", e.getMessage()));
        } catch (Exception e) {
            log.error("prefill-from-design failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error",   "server_error",
                    "message", e.getMessage() != null ? e.getMessage() : "unknown"));
        }
    }

    // ---- Helpers ----

    private String currentUserId() {
        AuthenticationInfo info = authenticationProvider.getAuthenticationInfo();
        return info.getUserId();
    }

    // ---- Exception Handlers ----

    /**
     * Anthropic 이 돌려준 오류(401/429/5xx 등)를 이 서버의 HTTP 상태로 그대로 전달하면
     * 프런트엔드의 인증 인터셉터가 "세션 만료" 로 오인할 수 있다.
     * 따라서 항상 **502 Bad Gateway** 로 래핑하고 사용자 친화적 메시지를 반환한다.
     */
    @ExceptionHandler(AnthropicApiException.class)
    public ResponseEntity<Map<String, Object>> handleAnthropic(AnthropicApiException e) {
        log.warn("Anthropic error → BAD_GATEWAY: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(Map.of(
                        "error",           "anthropic_error",
                        "upstreamStatus",  e.getStatus().value(),
                        "message",         e.getUserMessage(),
                        "detail",          e.getBody() == null ? "" : e.getBody()
                ));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException e) {
        log.warn("Composer IllegalState: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "bad_request", "message", e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException e) {
        log.warn("Composer IllegalArgument: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "bad_request", "message", e.getMessage()));
    }
}

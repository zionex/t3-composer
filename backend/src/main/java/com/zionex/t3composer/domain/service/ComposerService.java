package com.zionex.t3composer.domain.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3composer.domain.client.LlmClient;
import com.zionex.t3composer.domain.client.AnthropicModels.CacheControl;
import com.zionex.t3composer.domain.client.AnthropicModels.Message;
import com.zionex.t3composer.domain.dto.Attachment;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesRequest;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;
import com.zionex.t3composer.domain.client.AnthropicModels.SystemBlock;
import com.zionex.t3composer.domain.dto.CreateSessionRequest;
import com.zionex.t3composer.domain.entity.ComposerArtifact;
import com.zionex.t3composer.domain.entity.ComposerMessage;
import com.zionex.t3composer.domain.entity.ComposerSession;
import com.zionex.t3composer.domain.repository.ComposerArtifactRepository;
import com.zionex.t3composer.domain.repository.ComposerMessageRepository;
import com.zionex.t3composer.domain.repository.ComposerSessionRepository;
import com.zionex.t3composer.domain.schema.SchemaInspectionService;
import com.zionex.t3composer.domain.schema.TableInfo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * T3Composer 도메인 서비스.
 *
 * - 세션/메시지/아티팩트 CRUD
 * - Claude 호출 (non-streaming) + 응답 저장 + 아티팩트 추출
 * - 스트리밍은 {@link ComposerStreamingService} 로 별도 분리 (SSE 처리)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ComposerService {

    /**
     * 기본 모델 — Opus 4.7 (최신·고품질). 신규생성·화면수정 등 모든 모드 공통 기본값
     * (2026-05-16 사용자 요청 — frontend ComposerWorkspace.DEFAULT_MODEL_ID 와 동일).
     * Opus 4.7 는 16K 출력 시 3~5분+ 소요되나, 단독 환경은
     *   spring.mvc.async.request-timeout=2700000(45분) + 세션 heartbeat 로 타임아웃 완화됨.
     * 빠른 반복이 필요하면 헤더 모델 픽커 / 세션 생성 시 model 명시로 Sonnet 전환.
     */
    public static final String DEFAULT_MODEL = "claude-opus-4-7";

    /**
     * 기본 max_tokens — 화면 + Java + SQL 번들 한 턴에 끝내기 위해 100K.
     * Sonnet 4.6 출력 속도 ~50 tok/s 기준 최대 약 33분 소요 가능.
     * 반드시 ApiLlmClient.responseTimeout / axios timeout 과 같이 올려야 함.
     */
    public static final int DEFAULT_MAX_TOKENS = 100_000;

    /**
     * 모델별 출력 토큰 한도 — Anthropic API 가 모델별로 max_tokens 상한을 강제한다.
     * Opus 계열은 100K+ 허용, Sonnet 계열은 64K, Haiku 는 더 작음.
     * DEFAULT_MAX_TOKENS 가 모델 한도보다 크면 400 invalid_request_error 발생 →
     * resolveMaxTokens(modelName) 으로 cap.
     */
    private static int resolveMaxTokens(String modelName) {
        if (modelName == null) return DEFAULT_MAX_TOKENS;
        String m = modelName.toLowerCase();
        if (m.contains("opus"))    return Math.min(DEFAULT_MAX_TOKENS, 100_000);
        if (m.contains("sonnet"))  return Math.min(DEFAULT_MAX_TOKENS, 64_000);
        if (m.contains("haiku"))   return Math.min(DEFAULT_MAX_TOKENS, 16_000);
        return Math.min(DEFAULT_MAX_TOKENS, 64_000);  // 알 수 없는 모델은 보수적
    }

    /**
     * max_tokens 도달(잘림) 시 서버가 자동으로 "계속" 프롬프트를 이어 붙여 재호출할
     * 최대 횟수. 한 요청 내에서 최대 (1 + MAX_AUTO_CONTINUATIONS) 회까지 Claude 호출.
     * 무한루프 방지 + 과금 폭주 예방.
     */
    public static final int MAX_AUTO_CONTINUATIONS = 5;

    /**
     * 자동 이어쓰기용 user prompt. 반복 생성 없이 중단 지점만 이어 받도록 지시.
     */
    private static final String CONTINUE_PROMPT = String.join("\n",
            "이전 응답이 max_tokens 한도에 도달해 중간에 잘렸습니다.",
            "중단된 바로 다음 지점부터 이어서 끝까지 작성해주세요.",
            "이미 출력한 내용은 절대 반복하지 말고, 끊어진 파일/코드/문장의 마지막 지점부터만 이어 출력합니다.",
            "모든 파일이 완성되면 끝에 실행 체크리스트를 추가합니다."
    );

    private final ComposerSessionRepository  sessionRepo;
    private final ComposerMessageRepository  messageRepo;
    private final ComposerArtifactRepository artifactRepo;

    private final LlmClient                 llmClient;
    private final AnthropicApiKeyService    apiKeyService;
    private final ComposerPromptBuilder     promptBuilder;
    private final ArtifactExtractor         artifactExtractor;
    // 별도 빈 — supersede + saveAll 트랜잭션 보장 (chat 흐름의 self-invocation 우회)
    private final ArtifactPersistService    artifactPersistService;
    // orphan cleanup 시 project-root 기준점 공유용 (cleanupOrphanArtifacts 에서만 사용)
    private final ArtifactApplyService      artifactApplyService;

    /** 2-B 룰 준수 채점기. setter 주입(required=false) — 빈 미존재 환경에서도 동작. */
    private JsxConformanceScorer jsxConformanceScorer;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    public void setJsxConformanceScorer(JsxConformanceScorer scorer) {
        this.jsxConformanceScorer = scorer;
    }
    // 사용자 메시지 진입 시 TB_* 자동 추출 + INFORMATION_SCHEMA 조회로 존재여부 prompt 주입
    private final SchemaInspectionService   schemaInspectionService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ---- Session ----

    @Transactional
    public ComposerSession createSession(String userId, CreateSessionRequest req) {
        validateMode(req.getMode());

        ComposerSession s = ComposerSession.builder()
                .userId(userId)
                .mode(req.getMode())
                .targetMenuCd(req.getTargetMenuCd())
                .targetCd(req.getTargetCd())
                .ruleScope(req.getRuleScope())
                .title(req.getTitle() != null ? req.getTitle() : defaultTitle(req))
                .modelName(req.getModelName() != null ? req.getModelName() : DEFAULT_MODEL)
                .status(ComposerSession.STATUS_ACTIVE)
                .totalInTokens(0)
                .totalOutTokens(0)
                .build();
        return sessionRepo.save(s);
    }

    @Transactional(readOnly = true)
    public List<ComposerSession> listSessions(String userId) {
        return sessionRepo.findByUserIdOrderByCreateDttmDesc(userId);
    }

    @Transactional(readOnly = true)
    public ComposerSession getSession(String sessionId) {
        return sessionRepo.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));
    }

    @Transactional
    public ComposerSession updateStatus(String sessionId, String status) {
        ComposerSession s = getSession(sessionId);
        s.setStatus(status);
        return sessionRepo.save(s);
    }

    /**
     * 세션의 AI 엔진(모델) 변경.
     * 다음 chat 호출부터 새 modelName 으로 Claude API 가 호출된다.
     * 빈 값 / null 이면 DEFAULT_MODEL (Opus 4.7) 으로 리셋.
     */
    @Transactional
    public ComposerSession updateModel(String sessionId, String modelName) {
        ComposerSession s = getSession(sessionId);
        String resolved = (modelName == null || modelName.isBlank()) ? DEFAULT_MODEL : modelName.trim();
        s.setModelName(resolved);
        return sessionRepo.save(s);
    }

    @Transactional
    public void deleteSession(String sessionId) {
        artifactRepo.deleteBySessionId(sessionId);
        messageRepo.deleteBySessionId(sessionId);
        sessionRepo.deleteById(sessionId);
    }

    // ---- Messages ----

    @Transactional(readOnly = true)
    public List<ComposerMessage> listMessages(String sessionId) {
        return messageRepo.findBySessionIdOrderByTurnSeqAsc(sessionId);
    }

    /**
     * 세션의 LLM 룰 준수 채점 (2-B). raw assistant 메시지(1a rewriter 적용 전)를 채점해
     * "LLM 이 룰을 따랐나"를 측정한다. setter 주입 — scorer 빈 없으면 빈 결과.
     */
    @Transactional(readOnly = true)
    public JsxConformanceScorer.SessionReport scoreConformance(String sessionId) {
        if (jsxConformanceScorer == null) return new JsxConformanceScorer.SessionReport();
        List<String> assistantContents = messageRepo.findBySessionIdOrderByTurnSeqAsc(sessionId).stream()
                .filter(m -> ComposerMessage.ROLE_ASSISTANT.equals(m.getRole()))
                .map(ComposerMessage::getContent)
                .collect(java.util.stream.Collectors.toList());
        return jsxConformanceScorer.scoreMessages(assistantContents);
    }

    @Transactional
    public ComposerMessage appendUserMessage(String sessionId, String content) {
        int nextSeq = nextTurnSeq(sessionId);
        // 자동 테이블 존재 여부 분석 — 사용자가 prompt 에 TB_* 형식 테이블명을 언급하면
        // 세션의 Target DB(targetCd) 의 INFORMATION_SCHEMA 를 조회해 [✓ 존재] / [✗ 미존재]
        // 블록을 prompt 앞에 prepend. ComposerPromptBuilder 의 INVARIANTS 가 이 블록을
        // 권위있는 결과로 해석. 정책: 존재 테이블은 새 DDL 금지, 미존재면 NEW_NL/NEW_GENERAL 만 DDL 허용.
        // ★ targetCd 를 넘기지 않으면 composer-db(PG) 만 조회돼 운영 TB_* 가 모두 "미존재" 로 오판된다
        //   — Composer 의 Target 지정을 그대로 따라 운영 DB(MSSQL) 에 질의해야 한다.
        String targetCd = sessionRepo.findById(sessionId)
                .map((s) -> s.getTargetCd()).orElse(null);
        String enriched = enrichUserContentWithTableLookup(content, targetCd);
        ComposerMessage m = ComposerMessage.builder()
                .sessionId(sessionId)
                .turnSeq(nextSeq)
                .role(ComposerMessage.ROLE_USER)
                .content(enriched)
                .createDttm(LocalDateTime.now())
                .build();
        return messageRepo.save(m);
    }

    /**
     * 사용자 prompt 에서 TB_* 테이블명을 추출 → 세션 Target DB 존재여부 조회 → 결과 블록을 prompt 앞에 prepend.
     * 추출되는 게 없거나 targetCd 가 비어 있으면 원본 그대로 반환 (불필요한 prompt 비용 방지).
     *
     * @param targetCd 세션의 Target System 코드 — 운영 DB(MSSQL) 라우팅 키. null 이면 빈 결과.
     */
    private String enrichUserContentWithTableLookup(String content, String targetCd) {
        if (content == null || content.isBlank()) return content;
        if (schemaInspectionService == null) return content;
        try {
            java.util.Map<String, TableInfo> lookup =
                    schemaInspectionService.lookupTablesInText(targetCd, content);
            if (lookup == null || lookup.isEmpty()) return content;
            String header = schemaInspectionService.formatLookupResultForPrompt(lookup);
            if (header == null || header.isBlank()) return content;
            // 사용자 원본 content 와 header 사이에 명확한 구분선 — LLM 파싱 용이
            return header
                    + "\n=== 사용자 요청 (위 테이블 분석을 권위있는 결과로 활용) ===\n"
                    + content;
        } catch (Exception e) {
            // 테이블 분석 실패해도 사용자 메시지는 살려야 함 — 원본 그대로 진행
            log.warn("Composer 테이블 자동 분석 실패 (영향 없음 — 원본 prompt 진행): {}", e.getMessage());
            return content;
        }
    }

    // ---- Non-streaming chat ----

    /**
     * Claude 호출 → assistant 메시지 저장 → 아티팩트 추출.
     * stop_reason=max_tokens 인 경우 자동으로 "계속" 프롬프트를 이어 붙여 재호출하는
     * auto-continuation 루프를 수행 (최대 MAX_AUTO_CONTINUATIONS 회).
     * 반환값은 **마지막** (잘리지 않은) assistant 메시지.
     */
    public Mono<ComposerMessage> chat(String userId, String sessionId, List<Attachment> attachments) {
        ComposerSession session = getSession(sessionId);
        String apiKey = apiKeyService.getApiKey(userId)
                .orElseThrow(() -> new IllegalStateException(
                        "Anthropic API 키가 등록되지 않았습니다. 먼저 /composer/apikey 에 저장하세요."));

        return chatWithAutoContinuation(session, userId, apiKey, MAX_AUTO_CONTINUATIONS, attachments);
    }

    /** 하위 호환 — attachments 없는 호출 */
    public Mono<ComposerMessage> chat(String userId, String sessionId) {
        return chat(userId, sessionId, null);
    }

    /**
     * stop_reason=max_tokens 발생 시 "계속" user 메시지를 append 한 후 재귀 호출.
     * 매 이터레이션마다 buildRequest 가 DB 에서 최신 히스토리를 다시 읽어 Claude 로 보냄.
     *
     * attachments 는 첫 호출에만 적용 — auto-continuation 시 "계속" user message 는 plain text.
     */
    private Mono<ComposerMessage> chatWithAutoContinuation(
            ComposerSession session, String userId, String apiKey, int remaining,
            List<Attachment> attachmentsForLastUserMsg) {
        MessagesRequest req = buildRequest(session, attachmentsForLastUserMsg);
        return llmClient.sendMessages(apiKey, req)
                .flatMap(resp -> Mono.fromCallable(
                                () -> persistAssistantResponse(session, userId, resp))
                        .flatMap(saved -> {
                            boolean truncated = "max_tokens".equals(resp.getStopReason());
                            if (!truncated) {
                                return Mono.just(saved);
                            }
                            if (remaining <= 0) {
                                log.warn("Composer auto-continuation cap reached session={} — response still truncated at stop_reason=max_tokens",
                                        session.getId());
                                return Mono.just(saved);
                            }
                            log.info("Composer auto-continuation: session={} remaining={} — appending CONTINUE_PROMPT and re-invoking Claude",
                                    session.getId(), remaining);
                            return Mono.fromCallable(
                                            () -> appendUserMessage(session.getId(), CONTINUE_PROMPT))
                                    .then(Mono.defer(() -> chatWithAutoContinuation(
                                            // continuation 의 "계속" 메시지는 attachments 없이 plain text
                                            session, userId, apiKey, remaining - 1, null)));
                        }));
    }

    @Transactional
    protected ComposerMessage persistAssistantResponse(ComposerSession session, String userId, MessagesResponse resp) {
        String text = extractText(resp);
        int inTok  = tokens(resp, true);
        int outTok = tokens(resp, false);

        // Prompt caching 적중률 로깅 — cache_read > 0 이면 캐시 적중 (90% 할인된 input tokens).
        if (resp != null && resp.getUsage() != null) {
            Integer cacheCreate = resp.getUsage().getCacheCreationInputTokens();
            Integer cacheRead   = resp.getUsage().getCacheReadInputTokens();
            if ((cacheCreate != null && cacheCreate > 0) || (cacheRead != null && cacheRead > 0)) {
                log.info("Anthropic prompt cache: session={} in={} out={} cache_create={} cache_read={}",
                        session.getId(), inTok, outTok,
                        cacheCreate != null ? cacheCreate : 0,
                        cacheRead   != null ? cacheRead   : 0);
            }
        }

        int nextSeq = nextTurnSeq(session.getId());
        ComposerMessage m = ComposerMessage.builder()
                .sessionId(session.getId())
                .turnSeq(nextSeq)
                .role(ComposerMessage.ROLE_ASSISTANT)
                .content(text)
                .stopReason(resp.getStopReason())
                .inputTokens(inTok)
                .outputTokens(outTok)
                .modelName(resp.getModel())
                .metadata(safeJson(resp))
                .createDttm(LocalDateTime.now())
                .build();
        ComposerMessage saved = messageRepo.save(m);

        // 아티팩트 추출
        List<ComposerArtifact> artifacts = artifactExtractor.extract(session.getId(), saved.getId(), userId, text);
        if (!artifacts.isEmpty()) {
            // 별도 빈에 위임 — chat 흐름이 Mono.fromCallable() self-invocation 으로 호출되어
            // 본 메서드의 @Transactional proxy 가 우회됨. ArtifactPersistService 는 외부 빈이라
            // proxy 정상 적용 → @Modifying UPDATE 쿼리(supersede) 가 트랜잭션 안에서 안전 실행.
            int totalSuperseded = artifactPersistService.saveWithSupersede(artifacts);
            log.info("Composer artifacts: session={} new={} superseded={} (이전 버전 → DISCARDED)",
                    session.getId(), artifacts.size(), totalSuperseded);

            // 세션의 targetMenuCd 가 비어있으면 MENU_SQL 산출물에서 자동 추출.
            //   NEW_STEP 등 신규 모드에서 사용자가 메뉴 코드를 명시 안 한 케이스 — Claude 가
            //   화면 의도에서 추론한 'UI_<DOMAIN>_<NAME>' 를 INSERT INTO TB_AD_MENU SQL 에
            //   적어두므로 정규식으로 추출 가능. History/메뉴등록 UI 에 즉시 노출.
            if (session.getTargetMenuCd() == null || session.getTargetMenuCd().isBlank()) {
                String extracted = extractMenuCdFromArtifacts(artifacts);
                if (extracted != null) {
                    session.setTargetMenuCd(extracted);
                    log.info("Composer session targetMenuCd auto-derived from MENU_SQL: session={} menuCd={}",
                            session.getId(), extracted);
                }
            }
        }

        // 세션 토큰 누적
        session.setTotalInTokens((session.getTotalInTokens() == null ? 0 : session.getTotalInTokens()) + inTok);
        session.setTotalOutTokens((session.getTotalOutTokens() == null ? 0 : session.getTotalOutTokens()) + outTok);
        if (session.getModelName() == null) session.setModelName(resp.getModel());
        sessionRepo.save(session);

        return saved;
    }

    // ---- Artifacts ----

    /**
     * 세션 아티팩트 조회.
     * 기본: status='DISCARDED' 제외 (= 최신 버전만). includeHistory=true 면 전체 이력 반환.
     */
    @Transactional(readOnly = true)
    public List<ComposerArtifact> listArtifacts(String sessionId, boolean includeHistory) {
        if (includeHistory) {
            return artifactRepo.findBySessionIdOrderByCreateDttmDesc(sessionId);
        }
        return artifactRepo.findBySessionIdAndStatusNotOrderByCreateDttmDesc(
                sessionId, ComposerArtifact.STATUS_DISCARDED);
    }

    /** 기존 시그니처 호환 — DISCARDED 제외 */
    @Transactional(readOnly = true)
    public List<ComposerArtifact> listArtifacts(String sessionId) {
        return listArtifacts(sessionId, false);
    }

    @Transactional(readOnly = true)
    public Optional<ComposerArtifact> getArtifact(String artifactId) {
        return artifactRepo.findById(artifactId);
    }

    /**
     * 세션의 모든 assistant 메시지를 다시 파싱해 아티팩트를 재추출한다.
     *
     * ArtifactExtractor 의 추출 정규식이 개선된 후, 기존 세션에서 본문이 비거나 누락된
     * 아티팩트를 원본 응답 텍스트로부터 복구하는 용도. (LLM 응답을 다시 호출하지 않음)
     * 재추출된 아티팩트는 saveWithSupersede 가 (sessionId, type, filePath) 기준으로
     * 기존 것을 STATUS_DISCARDED 처리하고 새 버전으로 저장.
     *
     * @return 재추출된 아티팩트 수
     */
    @Transactional
    public int reExtractArtifacts(String sessionId, String userId) {
        List<ComposerMessage> msgs = messageRepo.findBySessionIdOrderByTurnSeqAsc(sessionId);
        int total = 0;
        for (ComposerMessage msg : msgs) {
            if (!ComposerMessage.ROLE_ASSISTANT.equals(msg.getRole())) continue;
            List<ComposerArtifact> artifacts =
                    artifactExtractor.extract(sessionId, msg.getId(), userId, msg.getContent());
            if (!artifacts.isEmpty()) {
                artifactPersistService.saveWithSupersede(artifacts);
                total += artifacts.size();
            }
        }
        log.info("Composer 아티팩트 재추출: session={} 재추출={}", sessionId, total);
        return total;
    }

    /**
     * EXISTING_MODIFY — 선택한 메뉴의 현재 소스(collectSourceForLlm 번들)를 세션 아티팩트로 import.
     * 사용자가 "현재 기준" 의 모든 파일을 아티팩트 트리에서 보고, 필요한 파일만 수정하도록 한다.
     *
     * 각 파일은 DRAFT · messageId=null(=원본 baseline) 로 저장. 이후 Claude 가 같은 filePath 로
     * 수정본을 출력하면 saveWithSupersede 가 (sessionId,type,filePath) 기준으로 baseline 을 갱신한다.
     *
     * @param bundle collectSourceForLlm 응답 — { screen, backend:{controllers,services,...} } 또는 flat
     * @return import 된 아티팩트 수
     */
    @Transactional
    public int importSourceArtifacts(String sessionId, String userId, Map<String, Object> bundle) {
        if (bundle == null) return 0;
        List<ComposerArtifact> arts = new ArrayList<>();

        addBundleFile(arts, sessionId, userId, bundle.get("screen"), ComposerArtifact.TYPE_SCREEN_JSX);

        Object backendObj = bundle.get("backend");
        Map<String, Object> src = (backendObj instanceof Map) ? castMap(backendObj) : bundle;
        addBundleList(arts, sessionId, userId, src.get("components"),   ComposerArtifact.TYPE_SCREEN_JSX);
        addBundleList(arts, sessionId, userId, src.get("controllers"),  ComposerArtifact.TYPE_JAVA_CONTROLLER);
        addBundleList(arts, sessionId, userId, src.get("services"),     ComposerArtifact.TYPE_JAVA_SERVICE);
        addBundleList(arts, sessionId, userId, src.get("repositories"), ComposerArtifact.TYPE_JAVA_REPOSITORY);
        addBundleList(arts, sessionId, userId, src.get("entities"),     ComposerArtifact.TYPE_JAVA_ENTITY);
        addBundleList(arts, sessionId, userId, src.get("procedures"),   ComposerArtifact.TYPE_SQL_SP);

        if (arts.isEmpty()) return 0;
        artifactPersistService.saveWithSupersede(arts);
        log.info("Composer 소스 아티팩트 import: session={} files={}", sessionId, arts.size());
        return arts.size();
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> castMap(Object o) {
        return (o instanceof Map) ? (Map<String, Object>) o : null;
    }

    private void addBundleList(List<ComposerArtifact> out, String sessionId, String userId,
                               Object listObj, String type) {
        if (!(listObj instanceof List)) return;
        for (Object item : (List<?>) listObj) {
            addBundleFile(out, sessionId, userId, item, type);
        }
    }

    /** 번들의 파일 1개 — { path, source|content } — 를 아티팩트로 변환해 추가. */
    private void addBundleFile(List<ComposerArtifact> out, String sessionId, String userId,
                               Object fileObj, String type) {
        Map<String, Object> f = castMap(fileObj);
        if (f == null) return;
        String path = f.get("path") == null ? null : String.valueOf(f.get("path"));
        Object srcObj = f.get("source") != null ? f.get("source") : f.get("content");
        String content = srcObj == null ? null : String.valueOf(srcObj);
        if (path == null || path.isBlank() || content == null || content.isBlank()) return;

        int idx = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
        String fileName = idx >= 0 ? path.substring(idx + 1) : path;
        String lower = fileName.toLowerCase();
        String lang = lower.endsWith(".jsx") || lower.endsWith(".tsx") ? "jsx"
                    : lower.endsWith(".java") ? "java"
                    : lower.endsWith(".sql") ? "sql"
                    : lower.endsWith(".js") ? "javascript" : "text";

        out.add(ComposerArtifact.builder()
                .sessionId(sessionId)
                .artifactType(type)
                .filePath(path)
                .fileName(fileName)
                .language(lang)
                .content(content)
                .versionNo(1)
                .status(ComposerArtifact.STATUS_DRAFT)
                .createBy(userId)
                .createDttm(LocalDateTime.now())
                .build());
    }

    /**
     * DISCARDED (supersede 된 이전 버전) 아티팩트를 hard delete — 사용자 명시 cleanup.
     * @return 삭제된 행 수
     */
    @Transactional
    public int cleanupSupersededArtifacts(String sessionId) {
        int n = artifactRepo.deleteBySessionIdAndStatus(sessionId, ComposerArtifact.STATUS_DISCARDED);
        log.info("Composer cleanup: session={} deleted={} (DISCARDED hard delete)", sessionId, n);
        return n;
    }

    /**
     * Orphan 아티팩트 hard delete + 디스크 파일 삭제.
     *
     * Orphan 정의: 세션 내에서 DISCARDED 처리된 아티팩트.
     *  - 자동 supersede 가 만든 것 (예: SP 이름 변경 시 이전 SP)
     *  - 사용자가 명시적으로 폐기한 것
     *
     * 처리:
     *  1) DB 레코드 hard delete
     *  2) 만약 해당 아티팩트가 한때 STATUS_FINAL 이었다면 (디스크에 파일 작성됨) 디스크 파일도 제거
     *     · 단 같은 sessionId 내 다른 비-DISCARDED 아티팩트가 같은 filePath 를 갖고 있으면 보존
     *  3) 같은 filePath 의 DRAFT 아티팩트가 새로 들어와 있다면 그것은 살아있는 후속 버전이므로 보존
     *
     * @param sessionId    세션 ID
     * @param deleteFiles  true 면 디스크 파일도 삭제 시도. false 면 DB 레코드만.
     * @return 처리 결과 ({deletedRecords, deletedFiles, skippedFiles})
     */
    @Transactional
    public java.util.Map<String, Object> cleanupOrphanArtifacts(String sessionId, boolean deleteFiles) {
        java.util.Map<String, Object> out = new java.util.LinkedHashMap<>();

        List<ComposerArtifact> discarded = artifactRepo.findBySessionIdAndStatusOrderByCreateDttmDesc(
                sessionId, ComposerArtifact.STATUS_DISCARDED);

        int deletedFiles = 0;
        int skippedFiles = 0;
        java.util.List<String> deletedPaths = new java.util.ArrayList<>();
        java.util.List<String> skippedPaths = new java.util.ArrayList<>();

        if (deleteFiles) {
            // 살아있는 (= 비 DISCARDED) 아티팩트의 filePath 집합 — 살아있는 게 있으면 파일 삭제 안 함
            java.util.Set<String> alivePaths = new java.util.HashSet<>();
            List<ComposerArtifact> alive = artifactRepo
                    .findBySessionIdAndStatusNotOrderByCreateDttmDesc(
                            sessionId, ComposerArtifact.STATUS_DISCARDED);
            for (ComposerArtifact a : alive) {
                if (a.getFilePath() != null && !a.getFilePath().isBlank()) {
                    alivePaths.add(a.getFilePath());
                }
            }

            String projectRoot = artifactApplyService != null
                    ? artifactApplyService.resolveProjectRoot()
                    : null;
            for (ComposerArtifact d : discarded) {
                String fp = d.getFilePath();
                if (fp == null || fp.isBlank()) continue;
                if (alivePaths.contains(fp)) {
                    skippedFiles++;
                    skippedPaths.add(fp + " (살아있는 후속 버전 존재)");
                    continue;
                }
                if (projectRoot == null) {
                    skippedFiles++;
                    skippedPaths.add(fp + " (project-root 미설정 — 파일 삭제 불가)");
                    continue;
                }
                try {
                    java.nio.file.Path root = java.nio.file.Paths.get(projectRoot).toAbsolutePath().normalize();
                    String rel = fp.replace('\\', '/').replaceFirst("^/+", "");
                    java.nio.file.Path abs = root.resolve(rel).normalize();
                    if (!abs.startsWith(root)) {
                        skippedFiles++;
                        skippedPaths.add(fp + " (project-root 외부 — 안전상 보존)");
                        continue;
                    }
                    if (java.nio.file.Files.exists(abs) && java.nio.file.Files.isRegularFile(abs)) {
                        java.nio.file.Files.delete(abs);
                        deletedFiles++;
                        deletedPaths.add(fp);
                        log.info("Composer orphan 파일 삭제: session={} path={}", sessionId, fp);
                    } else {
                        skippedFiles++;
                        skippedPaths.add(fp + " (디스크에 없음 — apply 안 된 상태)");
                    }
                } catch (Exception e) {
                    skippedFiles++;
                    skippedPaths.add(fp + " (삭제 실패: " + e.getMessage() + ")");
                    log.warn("Composer orphan 파일 삭제 실패: session={} path={} err={}",
                            sessionId, fp, e.getMessage());
                }
            }
        }

        // DB 레코드 hard delete (DISCARDED 만)
        int deletedRecords = artifactRepo.deleteBySessionIdAndStatus(
                sessionId, ComposerArtifact.STATUS_DISCARDED);

        out.put("deletedRecords", deletedRecords);
        out.put("deletedFiles",   deletedFiles);
        out.put("skippedFiles",   skippedFiles);
        out.put("deletedPaths",   deletedPaths);
        out.put("skippedPaths",   skippedPaths);
        log.info("Composer orphan cleanup: session={} records={} files={} skipped={}",
                sessionId, deletedRecords, deletedFiles, skippedFiles);
        return out;
    }

    // ---- Helpers ----

    MessagesRequest buildRequest(ComposerSession session) {
        return buildRequest(session, null);
    }

    /**
     * @param attachmentsForLastUserMsg 마지막 user message 에 부착할 binary 첨부 — null/empty 면 plain text
     */
    MessagesRequest buildRequest(ComposerSession session, List<Attachment> attachmentsForLastUserMsg) {
        List<ComposerMessage> history = messageRepo.findBySessionIdOrderByTurnSeqAsc(session.getId());

        // 마지막 user message 의 index 찾기 — auto-continuation 시 "계속" 도 user 이므로 마지막 user 가 정답
        int lastUserIdx = -1;
        for (int i = history.size() - 1; i >= 0; i--) {
            if (ComposerMessage.ROLE_USER.equals(history.get(i).getRole())) { lastUserIdx = i; break; }
        }
        boolean hasAttach = attachmentsForLastUserMsg != null && !attachmentsForLastUserMsg.isEmpty();

        List<Message> messages = new ArrayList<>();
        for (int i = 0; i < history.size(); i++) {
            ComposerMessage m = history.get(i);
            // Claude API 는 user/assistant 만 수용. system 은 request 의 system 필드로 전달됨.
            if (!ComposerMessage.ROLE_USER.equals(m.getRole())
                    && !ComposerMessage.ROLE_ASSISTANT.equals(m.getRole())) {
                continue;
            }
            if (i == lastUserIdx && hasAttach) {
                // 마지막 user message → text + binary content blocks 배열
                Object content = buildMultimodalContent(
                        m.getContent() == null ? "" : m.getContent(), attachmentsForLastUserMsg);
                messages.add(Message.builder().role(m.getRole()).content(content).build());
            } else {
                messages.add(Message.builder()
                        .role(m.getRole())
                        .content(m.getContent() == null ? "" : m.getContent())
                        .build());
            }
        }

        // System prompt 를 정적/세션 두 블록으로 분리.
        // 정적 블록 (TB_CMP_TARGET_RULE + TB_CMP_TARGET_HOOK 의 content 합본) 에
        // cache_control 부착 → 같은 target 의 후속 호출은 5분 TTL 안에서 input token
        // 비용 90% 절감 (Anthropic Prompt Caching). targetCd 별로 캐시 키 자연 분리.
        String staticPart  = promptBuilder.buildStaticSystemPrompt(session.getTargetCd(), session.getRuleScope());
        String sessionPart = promptBuilder.buildSessionSystemPrompt(session);

        List<SystemBlock> systemBlocks = new ArrayList<>();
        systemBlocks.add(SystemBlock.builder()
                .type("text")
                .text(staticPart)
                .cacheControl(CacheControl.builder().type("ephemeral").build())
                .build());
        if (sessionPart != null && !sessionPart.isBlank()) {
            systemBlocks.add(SystemBlock.builder()
                    .type("text")
                    .text(sessionPart)
                    .build());
        }

        // 대화 prefix 캐싱 — 마지막 메시지에 cache_control breakpoint 부착.
        //   system 블록만 캐시되던 것을 → system + 이전 메시지 전체로 확장.
        //   후속 턴·auto-continuation 이 재전송하는 대화 prefix 를 90% 할인된 cache_read 로 받음.
        applyMessageCacheBreakpoint(messages);

        String effectiveModel = session.getModelName() != null ? session.getModelName() : DEFAULT_MODEL;

        // 진단 — system / messages 크기 로그 (Anthropic 200K context window 초과 추적)
        int staticChars  = staticPart != null ? staticPart.length() : 0;
        int sessionChars = sessionPart != null ? sessionPart.length() : 0;
        int messagesChars = messages.stream()
                .mapToInt(mm -> {
                    Object c = mm.getContent();
                    return c instanceof String ? ((String) c).length() : 0;
                })
                .sum();
        int totalChars = staticChars + sessionChars + messagesChars;
        // 토큰 추정: 한국어/영어 혼합 시 1 token ≈ 3 chars 보수적 추정.
        int estTokens = totalChars / 3;
        log.info("Composer buildRequest session={} model={} staticChars={} sessionChars={} "
                + "messagesChars={} totalChars={} estTokens≈{} max_tokens={}",
                session.getId(), effectiveModel,
                staticChars, sessionChars, messagesChars, totalChars, estTokens,
                resolveMaxTokens(effectiveModel));

        return MessagesRequest.builder()
                .model(effectiveModel)
                .max_tokens(resolveMaxTokens(effectiveModel))
                .system(systemBlocks)
                .messages(messages)
                .build();
    }

    /**
     * 마지막 user message 의 텍스트 + binary 첨부 → Anthropic content block 배열.
     *   image  → { type:"image",    source:{ type:"base64", media_type, data } }
     *   pdf    → { type:"document", source:{ type:"base64", media_type, data } }
     */
    private List<Object> buildMultimodalContent(String text, List<Attachment> attachments) {
        List<Object> blocks = new ArrayList<>();
        // text block 먼저 — 사용자 prompt
        Map<String, Object> textBlock = new LinkedHashMap<>();
        textBlock.put("type", "text");
        textBlock.put("text", text == null ? "" : text);
        blocks.add(textBlock);

        for (Attachment a : attachments) {
            if (a == null || a.getBase64() == null || a.getBase64().isEmpty()) continue;
            String mediaType = a.getMediaType() == null ? "application/octet-stream" : a.getMediaType();
            String blockType = inferBlockType(mediaType);

            Map<String, Object> source = new LinkedHashMap<>();
            source.put("type", "base64");
            source.put("media_type", mediaType);
            source.put("data", a.getBase64());

            Map<String, Object> block = new LinkedHashMap<>();
            block.put("type", blockType);
            block.put("source", source);
            blocks.add(block);
        }
        return blocks;
    }

    /**
     * 마지막 메시지의 마지막 content block 에 cache_control(ephemeral) breakpoint 부착 →
     * system + 이전 모든 메시지(첫 메시지의 systemContext 포함)가 캐시 prefix 가 된다.
     * 다음 호출(후속 턴·auto-continuation)은 재전송되는 대화 전체를 cache_read(90% 할인)로 받음.
     *
     * Anthropic 은 cache breakpoint 4개까지 허용 — 현재 system 1개 + 메시지 1개 = 2개.
     * 평문 String content 는 cache_control 부착 단일 text block 배열로 변환,
     * 멀티모달 content(List) 는 마지막 block 에 cache_control 만 추가.
     */
    @SuppressWarnings("unchecked")
    private void applyMessageCacheBreakpoint(List<Message> messages) {
        if (messages == null || messages.isEmpty()) return;
        Message last = messages.get(messages.size() - 1);
        Object content = last.getContent();
        Map<String, Object> cacheControl = Map.of("type", "ephemeral");

        if (content instanceof List) {
            List<Object> blocks = (List<Object>) content;
            if (blocks.isEmpty()) return;
            Object lastBlock = blocks.get(blocks.size() - 1);
            if (lastBlock instanceof Map) {
                ((Map<String, Object>) lastBlock).put("cache_control", cacheControl);
            }
        } else {
            Map<String, Object> block = new LinkedHashMap<>();
            block.put("type", "text");
            block.put("text", content == null ? "" : content.toString());
            block.put("cache_control", cacheControl);
            List<Object> blocks = new ArrayList<>();
            blocks.add(block);
            last.setContent(blocks);
        }
    }

    private static String inferBlockType(String mediaType) {
        String mt = mediaType.toLowerCase();
        if (mt.startsWith("image/")) return "image";
        if (mt.equals("application/pdf")) return "document";
        // 그 외 (xlsx/docx/etc) — document block 으로 시도 (Anthropic 가 거부할 수도 있음)
        return "document";
    }

    private int nextTurnSeq(String sessionId) {
        Integer max = messageRepo.findMaxTurnSeqBySessionId(sessionId);
        return (max == null ? 0 : max) + 1;
    }

    private void validateMode(String mode) {
        if (!ComposerSession.MODE_NEW_GENERAL.equals(mode)
                && !ComposerSession.MODE_NEW_FROM_DESIGN.equals(mode)
                && !ComposerSession.MODE_NEW_FROM_COPY.equals(mode)
                && !ComposerSession.MODE_NEW_STEP.equals(mode)
                && !ComposerSession.MODE_NEW_NL.equals(mode)
                && !ComposerSession.MODE_EXISTING_MODIFY.equals(mode)) {
            throw new IllegalArgumentException("Unknown mode: " + mode);
        }
    }

    private String defaultTitle(CreateSessionRequest req) {
        switch (req.getMode()) {
            case ComposerSession.MODE_NEW_GENERAL:     return "신규 화면 (일반 생성) - " + LocalDateTime.now();
            case ComposerSession.MODE_NEW_FROM_DESIGN: return "신규 화면 (설계서 기반) - " + LocalDateTime.now();
            case ComposerSession.MODE_NEW_FROM_COPY:
                return (req.getTargetMenuCd() != null ? req.getTargetMenuCd() : "복사 기반")
                        + " 신규 (복사) - " + LocalDateTime.now();
            case ComposerSession.MODE_NEW_STEP:        return "신규 화면 (단계별) - "   + LocalDateTime.now();
            case ComposerSession.MODE_NEW_NL:          return "신규 화면 (자연어) - "   + LocalDateTime.now();
            case ComposerSession.MODE_EXISTING_MODIFY:
                return (req.getTargetMenuCd() != null ? req.getTargetMenuCd() : "기존 화면")
                        + " 수정 - " + LocalDateTime.now();
            default: return "Composer Session";
        }
    }

    @SuppressWarnings("unchecked")
    private String extractText(MessagesResponse resp) {
        if (resp == null || resp.getContent() == null) return "";
        StringBuilder sb = new StringBuilder();
        for (var block : resp.getContent()) {
            Object type = block.get("type");
            if ("text".equals(type)) {
                Object t = block.get("text");
                if (t != null) sb.append(t);
            }
        }
        return sb.toString();
    }

    private int tokens(MessagesResponse resp, boolean input) {
        if (resp == null || resp.getUsage() == null) return 0;
        Integer v = input ? resp.getUsage().getInputTokens() : resp.getUsage().getOutputTokens();
        return v == null ? 0 : v;
    }

    private String safeJson(Object o) {
        try {
            return objectMapper.writeValueAsString(o);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    // MENU_SQL 산출물 본문에서 첫 'UI_<DOMAIN>_<NAME>' 코드를 찾아 반환. 없으면 null.
    // 'UI_(AD|BF|CM|COMM|DP|DPD|FO|FP|IM|MP|RP|SA|SALES|SO|UT)_<NAME>' 규약 (rules/41 §2.1).
    private static final Pattern MENU_CD_PATTERN = Pattern.compile(
            "\\b(UI_(?:AD|BF|CM|COMM|DP|DPD|FO|FP|IM|MP|RP|SA|SALES|SO|UT)_[A-Z][A-Z0-9_]*)\\b");

    private String extractMenuCdFromArtifacts(List<ComposerArtifact> artifacts) {
        if (artifacts == null) return null;
        for (ComposerArtifact a : artifacts) {
            if (!ComposerArtifact.TYPE_MENU_SQL.equals(a.getArtifactType())) continue;
            String body = a.getContent();
            if (body == null || body.isBlank()) continue;
            Matcher m = MENU_CD_PATTERN.matcher(body);
            if (m.find()) return m.group(1);
        }
        return null;
    }
}

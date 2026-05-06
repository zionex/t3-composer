package com.zionex.t3composer.domain.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3composer.domain.client.AnthropicClient;
import com.zionex.t3composer.domain.client.AnthropicModels.Message;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesRequest;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;
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
     * 기본 모델 — 화면 생성 기본값은 Sonnet 4.6 (속도·비용·품질 균형).
     * Opus 4.7 는 16K 출력 시 3~5분+ 소요되어 axios / WebClient 5분 타임아웃과
     * 겹쳐 "세션 만료" 오인 및 artifact DRAFT 중단이 빈발 → Sonnet 으로 변경.
     * 고난이도 건은 세션 생성 시점에 model 을 명시 override 할 것.
     */
    public static final String DEFAULT_MODEL = "claude-sonnet-4-6";

    /**
     * 기본 max_tokens — 화면 + Java + SQL 번들 한 턴에 끝내기 위해 100K.
     * Sonnet 4.6 출력 속도 ~50 tok/s 기준 최대 약 33분 소요 가능.
     * 반드시 AnthropicClient.responseTimeout / axios timeout 과 같이 올려야 함.
     */
    public static final int DEFAULT_MAX_TOKENS = 100_000;

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

    private final AnthropicClient           anthropicClient;
    private final AnthropicApiKeyService    apiKeyService;
    private final ComposerPromptBuilder     promptBuilder;
    private final ArtifactExtractor         artifactExtractor;
    // 별도 빈 — supersede + saveAll 트랜잭션 보장 (chat 흐름의 self-invocation 우회)
    private final ArtifactPersistService    artifactPersistService;
    // orphan cleanup 시 project-root 기준점 공유용 (cleanupOrphanArtifacts 에서만 사용)
    private final ArtifactApplyService      artifactApplyService;
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
     * 빈 값 / null 이면 DEFAULT_MODEL (Sonnet 4.6) 으로 리셋.
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

    @Transactional
    public ComposerMessage appendUserMessage(String sessionId, String content) {
        int nextSeq = nextTurnSeq(sessionId);
        // 자동 테이블 존재 여부 분석 — 사용자가 prompt 에 TB_* 형식 테이블명을 언급하면
        // INFORMATION_SCHEMA 를 조회해 [✓ 존재] / [✗ 미존재] 블록을 prompt 앞에 prepend.
        // ComposerPromptBuilder 의 INVARIANTS 가 이 블록을 권위있는 결과로 해석하도록 명시.
        // 정책: 존재하는 테이블은 새 DDL 생성 절대 금지, 미존재면 NEW_NL/NEW_GENERAL 모드만 DDL 허용.
        String enriched = enrichUserContentWithTableLookup(content);
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
     * 사용자 prompt 에서 TB_* 테이블명을 추출 → DB 존재여부 조회 → 결과 블록을 prompt 앞에 prepend.
     * 추출되는 게 없으면 원본 그대로 반환 (불필요한 prompt 비용 방지).
     */
    private String enrichUserContentWithTableLookup(String content) {
        if (content == null || content.isBlank()) return content;
        if (schemaInspectionService == null) return content;
        try {
            java.util.Map<String, TableInfo> lookup = schemaInspectionService.lookupTablesInText(content);
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
    public Mono<ComposerMessage> chat(String userId, String sessionId) {
        ComposerSession session = getSession(sessionId);
        String apiKey = apiKeyService.getApiKey(userId)
                .orElseThrow(() -> new IllegalStateException(
                        "Anthropic API 키가 등록되지 않았습니다. 먼저 /composer/apikey 에 저장하세요."));

        return chatWithAutoContinuation(session, userId, apiKey, MAX_AUTO_CONTINUATIONS);
    }

    /**
     * stop_reason=max_tokens 발생 시 "계속" user 메시지를 append 한 후 재귀 호출.
     * 매 이터레이션마다 buildRequest 가 DB 에서 최신 히스토리를 다시 읽어 Claude 로 보냄.
     */
    private Mono<ComposerMessage> chatWithAutoContinuation(
            ComposerSession session, String userId, String apiKey, int remaining) {
        MessagesRequest req = buildRequest(session);
        return anthropicClient.sendMessages(apiKey, req)
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
                                            session, userId, apiKey, remaining - 1)));
                        }));
    }

    @Transactional
    protected ComposerMessage persistAssistantResponse(ComposerSession session, String userId, MessagesResponse resp) {
        String text = extractText(resp);
        int inTok  = tokens(resp, true);
        int outTok = tokens(resp, false);

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
        List<ComposerMessage> history = messageRepo.findBySessionIdOrderByTurnSeqAsc(session.getId());

        List<Message> messages = new ArrayList<>();
        for (ComposerMessage m : history) {
            // Claude API 는 user/assistant 만 수용. system 은 request 의 system 필드로 전달됨.
            if (!ComposerMessage.ROLE_USER.equals(m.getRole())
                    && !ComposerMessage.ROLE_ASSISTANT.equals(m.getRole())) {
                continue;
            }
            messages.add(Message.builder()
                    .role(m.getRole())
                    .content(m.getContent() == null ? "" : m.getContent())
                    .build());
        }

        return MessagesRequest.builder()
                .model(session.getModelName() != null ? session.getModelName() : DEFAULT_MODEL)
                .max_tokens(DEFAULT_MAX_TOKENS)
                .system(promptBuilder.buildSystemPrompt(session))
                .messages(messages)
                .build();
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
}

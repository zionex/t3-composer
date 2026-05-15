# Target Rule / Hook DB 주입 — Design

**Date**: 2026-05-15
**Status**: Approved (사용자 승인 후 implementation plan 작성 예정)
**Author**: brainstorming session (eunjoo_hwang + Claude)
**Owner**: t3-composer backend

## Goal

Composer 가 LLM (Anthropic API) 을 호출할 때 system prompt 의 정적 블록을 **`ComposerPromptBuilder.INVARIANTS` (하드코딩 700+ 줄)** 가 아닌 **`tb_cmp_target_rule` + `tb_cmp_target_hook` 의 content 컬럼** 에서 동적으로 조립하도록 변경.

## Why

- **Target 별 분리**: 현재 INVARIANTS 는 T3SERIES 컨벤션 (RealGrid + SP_UI_*) 만 가정. PLANNEL (AG-Grid + JPA) / LGES_NEXTSCM target 으로 산출물 만들 때 wingui 컨벤션이 자동 주입되어 잘못된 산출물 생성됨.
- **운영 중 규약 변경**: 코드 deploy 없이 DB content 만 수정하면 LLM 동작 즉시 변경 가능.
- **이미 인프라 준비됨**: `TB_CMP_TARGET_RULE` / `TB_CMP_TARGET_HOOK` 스키마 + Entity (`TargetRule`, `TargetHook`) + `ClaudeAssetImportService` (`.claude/rules/*.md` → DB import) 이미 구현되어 있음. 미구현은 **DB content → system prompt 주입** 한 단계뿐.

## Non-Goals

- `.claude/rules/*.md` / `.claude-plannel/rules/*.md` 파일 자체의 변경 — 변경 없음
- Frontend 변경 — 없음 (세션 생성 시 이미 `targetCd` 전송 중)
- DB 스키마 변경 — 없음 (이미 존재)
- Hook script 의 **실제 bash 실행** — Phase 1 범위 외 (LLM 에 텍스트로만 노출)
- Mode 별 rule 필터링 (`applies_to` 컬럼 활용) — Phase 1 범위 외 (mode 분기는 rule content 자체에 작성됨, LLM 이 sessionPart 의 mode 정보 보고 활용)

## Architecture

### 변경 범위
**Backend Spring Boot (`backend/src/main/java/com/zionex/t3composer/`) 만 수정**.

### 핵심 컴포넌트 (3개 추가/변경)

```
┌─────────────────────────────────────────────────────────────┐
│ ComposerService.buildAnthropicRequest(session, ...)          │
│   ↓                                                          │
│   staticPart  = promptBuilder.buildStaticSystemPrompt(       │
│                     session.getTargetCd())  ← 변경            │
│                       │                                       │
│                       └─→ SystemPromptComposer.compose(tc)   │
│                             │                                 │
│                             ├─ TargetRuleRepository.findActive│
│                             └─ TargetHookRepository.findActive│
│                                                              │
│   sessionPart = promptBuilder.buildSessionSystemPrompt(      │
│                     session)  ← 유지 (mode 컨텍스트 등)        │
└─────────────────────────────────────────────────────────────┘
```

### 파일 변경 매트릭스

| 파일 | 변경 종류 |
|---|---|
| `SystemPromptComposer.java` | **신규** |
| `TargetRuleRepository.java` | finder 1개 추가 |
| `TargetHookRepository.java` | finder 1개 추가 |
| `ComposerPromptBuilder.java` | INVARIANTS / MODE_PREFIX / MODE_SUFFIX / `newStepGuide(...)` 등 모드별 가이드 메서드 **삭제**. `buildStaticSystemPrompt(targetCd)` 시그니처 변경 후 SystemPromptComposer 위임. `buildSessionSystemPrompt(session)` 그대로 유지 |
| `ComposerService.buildAnthropicRequest(...)` | 단 한 줄 변경 (`session.getMode()` → `session.getTargetCd()`) |

### Anthropic API system blocks 구성 (변경 후)

```json
[
  {
    "type": "text",
    "text": "<DB rules + hooks 합본>",
    "cache_control": { "type": "ephemeral" }
  },
  {
    "type": "text",
    "text": "<session 컨텍스트 — mode/targetMenuCd/SP_SCREEN_NO 등>"
  }
]
```

- 정적 블록 = DB content (target_cd + use_yn + priority 정렬). target_cd 별로 캐시 키 자연 분리됨.
- 동적 블록 = session.targetMenuCd / mode / SP 번호 등 그대로 유지.

## Components 상세

### `SystemPromptComposer.java` (신규)

```java
package com.zionex.t3composer.domain.service;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemPromptComposer {

    private final TargetRuleRepository ruleRepo;
    private final TargetHookRepository hookRepo;

    /**
     * targetCd 의 모든 active rule + hook 을 priority/sort_order 순으로 합쳐
     * Anthropic system prompt 의 정적 블록 텍스트를 만든다.
     *
     * @throws IllegalStateException targetCd 가 NULL 이거나 rule 이 0건일 때
     */
    public String compose(String targetCd) {
        if (targetCd == null || targetCd.isBlank()) {
            throw new IllegalStateException(
                "session.targetCd 가 NULL — Composer 세션 생성 시 target 을 명시해야 합니다.");
        }

        List<TargetRule> rules = ruleRepo
            .findByTargetCdAndUseYnOrderByPriorityAscRuleCodeAsc(targetCd, "Y");
        if (rules.isEmpty()) {
            throw new IllegalStateException(
                "tb_cmp_target_rule 에 target_cd='" + targetCd + "' AND use_yn='Y' 인 rule 이 0건. " +
                "ClaudeAssetImportService 로 .claude/rules/ 를 먼저 import 하세요.");
        }

        List<TargetHook> hooks = hookRepo
            .findByTargetCdAndEnabledOrderBySortOrderAscScriptNameAsc(targetCd, "Y");

        StringBuilder sb = new StringBuilder();

        // ── Rules ──────────────────────────────────────────────────
        sb.append("# ").append(targetCd).append(" — 규약 (Rules)\n\n");
        sb.append("아래는 ").append(targetCd)
          .append(" target 의 모든 활성 규약입니다. 산출물 생성 시 모두 준수하세요.\n\n");

        for (TargetRule r : rules) {
            sb.append("---\n\n");
            sb.append("## [Rule ").append(r.getRuleCode()).append("] ")
              .append(r.getTitle() != null ? r.getTitle() : r.getRuleCode())
              .append("\n\n");
            sb.append(r.getContent()).append("\n\n");
        }

        // ── Hooks (자동 검증 패턴) ─────────────────────────────────
        if (!hooks.isEmpty()) {
            sb.append("\n---\n\n");
            sb.append("# ").append(targetCd).append(" — 자동 검증 규칙 (Hooks)\n\n");
            sb.append("아래는 산출물 저장 시 실제로 차단되는 검증 스크립트입니다. ");
            sb.append("LLM 출력 직전 self-check 로 동일 패턴 적용하여 차단 회피하세요.\n\n");

            for (TargetHook h : hooks) {
                sb.append("---\n\n");
                sb.append("## [Hook ").append(h.getHookEvent()).append("/")
                  .append(h.getScriptName()).append("]");
                if (h.getMatcher() != null && !h.getMatcher().isBlank()) {
                    sb.append(" (matcher: ").append(h.getMatcher()).append(")");
                }
                sb.append("\n\n");
                sb.append("```").append(h.getLanguage() != null ? h.getLanguage() : "bash").append("\n");
                sb.append(h.getScriptContent()).append("\n");
                sb.append("```\n\n");
            }
        }

        String result = sb.toString();
        log.info("[SystemPromptComposer] target={}, rules={}, hooks={}, totalChars={}",
                 targetCd, rules.size(), hooks.size(), result.length());
        return result;
    }
}
```

### Repository 메서드

`TargetRuleRepository.java`:
```java
List<TargetRule> findByTargetCdAndUseYnOrderByPriorityAscRuleCodeAsc(String targetCd, String useYn);
```

`TargetHookRepository.java`:
```java
List<TargetHook> findByTargetCdAndEnabledOrderBySortOrderAscScriptNameAsc(String targetCd, String enabled);
```

### `ComposerPromptBuilder.java` 변경

| 삭제 | 유지 |
|---|---|
| `INVARIANTS` 상수 | `buildSessionSystemPrompt(session)` |
| `MODE_PREFIX`, `MODE_SUFFIX` | mode 별 SP 번호 hint / targetMenuCd / 자동 분석 결과 등 동적 블록 빌더 |
| `newStepGuide(StepGuideMode)` 등 모드별 가이드 메서드 | |
| 기존 `buildStaticSystemPrompt(mode)` 시그니처 | → `buildStaticSystemPrompt(targetCd)` 로 변경, `SystemPromptComposer.compose(targetCd)` 위임 |

`@Autowired SystemPromptComposer composer` 필드 추가.

### `ComposerService.buildAnthropicRequest(...)` 변경

단 한 줄 변경:
```java
// before
String staticPart = promptBuilder.buildStaticSystemPrompt(session.getMode());

// after
String staticPart = promptBuilder.buildStaticSystemPrompt(session.getTargetCd());
```

`session.getMode()` 는 sessionPart 안에서 계속 활용 (mode 별 SP 할당 hint 등은 동적 블록).

### 삭제 영향 검토 (사전 grep 필요)

```bash
grep -rE "INVARIANTS|newStepGuide|MODE_PREFIX|MODE_SUFFIX" \
     backend/src/main/java/
```

다른 service (예: `PrefillFromSourceService`) 가 ComposerPromptBuilder 의 메서드를 직접 import 하면 함께 변경.

## Data Flow

```
[Frontend] POST /composer/sessions/{sid}/chat
    │
    ▼
[ComposerController.chat]
    │
    ▼
[ComposerService.chat]
    │
    ├─ 세션 / 메시지 로드 (session.targetCd, session.mode 보유)
    │
    ├─ 사용자 메시지 저장 (ComposerMessage)
    │
    ├─ (신규 모드면) SchemaInspectionService 자동 분석 → systemContext 추가
    │
    ├─ buildAnthropicRequest(session, ...)
    │     │
    │     ├─ ★ staticPart = promptBuilder.buildStaticSystemPrompt(session.getTargetCd())
    │     │       │
    │     │       └─ SystemPromptComposer.compose(targetCd)
    │     │             │
    │     │             ├─ ruleRepo.findByTargetCdAndUseYnOrderByPriorityAsc...
    │     │             │     SELECT content, rule_code, title FROM tb_cmp_target_rule
    │     │             │      WHERE target_cd = :tc AND use_yn = 'Y'
    │     │             │      ORDER BY priority ASC, rule_code ASC
    │     │             │
    │     │             ├─ hookRepo.findByTargetCdAndEnabledOrderBySortOrderAsc...
    │     │             │     SELECT script_content, script_name, hook_event, matcher
    │     │             │      FROM tb_cmp_target_hook
    │     │             │      WHERE target_cd = :tc AND enabled = 'Y'
    │     │             │      ORDER BY sort_order ASC, script_name ASC
    │     │             │
    │     │             └─ StringBuilder 합치기 → 단일 String
    │     │
    │     ├─ sessionPart = promptBuilder.buildSessionSystemPrompt(session)
    │     │       (mode / targetMenuCd / SP_SCREEN_NO hint / 자동 분석 결과)
    │     │
    │     └─ MessagesRequest 구성:
    │            system: [
    │              { type:"text", text: staticPart, cache_control:{type:"ephemeral"} },
    │              { type:"text", text: sessionPart }     // 캐시 없음
    │            ]
    │
    ├─ AnthropicClient.sendMessages(apiKey, req)
    │
    ├─ Response 저장 (ComposerMessage with token usage)
    │
    └─ ArtifactExtractor → 산출물 자동 추출
```

## mode vs targetCd — 직교 관계

| 차원 | 어디에 들어가나 | 캐시 |
|---|---|---|
| **`targetCd`** (정적) | system prompt 의 정적 블록 → DB rule fetch 키. 같은 target 이면 동일 텍스트 → cache hit | ephemeral 적용 |
| **`mode`** (세션별) | system prompt 의 동적 블록 → "지금 NEW_FROM_COPY 모드, 원본은 X.jsx" 같은 컨텍스트 | 캐시 없음 |

조합 가능 매트릭스 (예):

| mode × targetCd | 의미 |
|---|---|
| `T3SERIES` + `NEW_GENERAL` | 자연어로 wingui 사용자관리 화면 생성 (BaseGrid + SP_UI_*) |
| `T3SERIES` + `NEW_FROM_COPY` | 기존 wingui 화면 복사 |
| `PLANNEL` + `NEW_GENERAL` | 자연어로 PlanNEL 거래처관리 생성 (AgGridReact + JPA) |
| `PLANNEL` + `NEW_FROM_DESIGN` | 설계서로 PlanNEL 화면 생성 |

mode 별 분기는 rule content 자체에 작성됨 — LLM 이 sessionPart 의 mode 정보를 보고 해당 섹션을 알아서 활용.

## Error Handling

| 케이스 | 처리 |
|---|---|
| `session.targetCd == null` | `IllegalStateException("session.targetCd 가 NULL — Composer 세션 생성 시 target 을 명시해야 합니다.")` → ComposerService 가 catch → ResponseMessage error 응답 (HTTP 400) |
| `target_cd` 에 해당하는 rule 0건 | `IllegalStateException("tb_cmp_target_rule 에 target_cd='X' AND use_yn='Y' 인 rule 이 0건. ClaudeAssetImportService 로 .claude/rules/ 를 먼저 import 하세요.")` → 같은 흐름 |
| `target_cd` 에 해당하는 hook 0건 | **에러 아님** — hooks 섹션 자체를 생략 (rule 만으로도 system prompt 구성 가능) |
| `tb_cmp_target_rule` 테이블 자체가 없음 (마이그레이션 미적용) | JPA `EntityNotFoundException` / SQLException → 동일 catch → ResponseMessage error (운영 오류) |
| Hook script_content 안에 LLM 을 혼란시킬 escape 문자 (백틱 등) | StringBuilder 가 그대로 직렬화 — Anthropic 이 markdown code block 안의 백틱은 잘 처리하므로 추가 escape 불필요 |
| Rule content 가 매우 큼 (전체 합산 200KB+) | 그대로 진행 — Anthropic max input token (200K) 미만이면 OK. 초과 시 Anthropic 이 4xx 응답 → ComposerService 가 그대로 사용자에게 전달 |

## Prompt Caching 효과

- 같은 `targetCd` 인 **모든 세션** 의 후속 호출은 정적 블록이 동일 → **5분 TTL ephemeral cache hit** → input token 90% 절감
- `sessionPart` 만 매번 다름 (sid, mode, targetMenuCd, ...) → 항상 fresh
- DB rule/hook 변경 시 → `staticPart` 텍스트가 바뀜 → 자연스럽게 캐시 무효화

## Logging

```java
log.info("[SystemPromptComposer] target={}, rules={}, hooks={}, totalChars={}",
         targetCd, rules.size(), hooks.size(), result.length());
```

매 chat 호출마다 1줄. 운영 모니터링 (특정 target 의 rule 갯수 변화 추적).

## Testing

### Unit Test — `SystemPromptComposerTest`

`backend/src/test/java/com/zionex/t3composer/domain/service/SystemPromptComposerTest.java` (신규).
`@DataJpaTest` + `@Import(SystemPromptComposer.class)` 로 in-memory H2 또는 testcontainers Postgres 활용.

| 케이스 | 검증 |
|---|---|
| `compose(null)` | `IllegalStateException` + 메시지에 "targetCd 가 NULL" 포함 |
| `compose("")` | 동일 |
| `compose("UNKNOWN_TARGET")` | rule 0건 → `IllegalStateException` + 메시지에 "rule 이 0건" + "ClaudeAssetImportService" 안내 |
| `compose("T3SERIES")` — rule 3건 + hook 2건 seed | 결과 String 에 모든 rule_code + 모든 script_name 포함 + priority 순서 정확 + hook 섹션 헤더 (`# T3SERIES — 자동 검증 규칙`) 존재 |
| `compose("T3SERIES")` — rule 3건 + hook 0건 | 결과에 hooks 섹션 자체 미포함 (rules 섹션만) |
| `use_yn='N'` rule 은 결과에서 제외 | seed 에 use_yn='Y' 2건 + 'N' 1건 → 결과에 'N' rule 의 content 부재 |
| `enabled='N'` hook 은 결과에서 제외 | 동일 패턴 |
| Priority 정렬 | priority 99 / 5 / 41 seed → 결과 String 안의 등장 순서가 5 → 41 → 99 |

### Repository Test

`TargetRuleRepository` / `TargetHookRepository` 의 신규 finder 메서드 1개씩:
- 입력 (target_cd, use_yn) 조합별 결과 갯수 검증
- ORDER BY 순서 검증

### Manual smoke test (마이그레이션 후 1회)

```bash
# 1. composer-backend 컨테이너 재기동 후
docker compose restart composer-backend

# 2. T3SERIES rule 갯수 확인
docker exec composer-db psql -U postgres -d T3SMARTSCM -c \
  "SELECT count(*) FROM tb_cmp_target_rule WHERE target_cd='T3SERIES' AND use_yn='Y'"

# 3. 기존 화면 생성 모드로 1회 chat
#    → ComposerSession.targetCd='T3SERIES' 로 시작
#    → backend log 에 "[SystemPromptComposer] target=T3SERIES, rules=N, hooks=M, totalChars=..." 1줄
#    → 산출물이 정상 생성되는지 확인 (이전 INVARIANTS 와 동등 동작)

# 4. PLANNEL 로 새 세션
#    → DB 에 PLANNEL rule 이 있어야 정상. 없으면 명시적 에러 응답 확인

# 5. (의도적 실패) 빈 target 으로 세션
curl -X POST .../composer/sessions -d '{"targetCd": null, ...}'
#    → 400 + "targetCd 가 NULL" 메시지
```

## Compatibility

- 기존 세션 (`target_cd` IS NULL) → 새 코드에서 명시적 에러. 마이그레이션 스크립트로 `UPDATE composer_session SET target_cd = 'T3SERIES' WHERE target_cd IS NULL` 권장
- Frontend → 변경 없음. 세션 생성 시 항상 `targetCd` 보내고 있음 (이미 구현됨)

## Open Questions / Future Work

- **Phase 2 (별도 spec)**: hook script 의 **실제 bash 실행** — `ArtifactPersistService` 가 산출물 저장 직전 hook 실행해서 exit 2 면 차단. 환경 의존성 (bash / 권한) 검토 필요.
- **Phase 2 (별도 spec)**: `applies_to` 컬럼 활용한 mode 별 rule 필터링 — 캐시 효율 vs 정확도 trade-off.
- 운영 중 rule content 수정 시 **5분 TTL cache 만료** 대기 또는 ephemeral cache 강제 무효화 방법 — Anthropic API 제약. (즉시 반영 필요하면 cache_control 제거 옵션)
- Token 비용 모니터링: rule + hook 합본 size 가 100K+ 까지 증가하면 prompt caching 없을 때 비용 부담 — DB 에 `total_size_bytes` 컬럼 추가해 sum 계산 추적 권장.

## Related Files

- `backend/src/main/java/com/zionex/t3composer/domain/entity/TargetRule.java`
- `backend/src/main/java/com/zionex/t3composer/domain/entity/TargetHook.java`
- `backend/src/main/java/com/zionex/t3composer/domain/repository/TargetRuleRepository.java`
- `backend/src/main/java/com/zionex/t3composer/domain/repository/TargetHookRepository.java`
- `backend/src/main/java/com/zionex/t3composer/domain/service/ClaudeAssetImportService.java` (.md/.sh → DB import, 이미 구현)
- `backend/src/main/java/com/zionex/t3composer/domain/service/ComposerPromptBuilder.java` (수정)
- `backend/src/main/java/com/zionex/t3composer/domain/service/ComposerService.java` (1줄 수정)
- `docker/db/init-pg/20_target_system_ddl.sql` (스키마, 변경 없음)

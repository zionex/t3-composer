# Target Rule/Hook DB 주입 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ComposerPromptBuilder 의 하드코딩된 INVARIANTS / 모드별 가이드를 제거하고, `tb_cmp_target_rule` + `tb_cmp_target_hook` 의 content 를 priority/sort_order 순으로 합쳐 LLM system prompt 정적 블록으로 주입.

**Architecture:** 신규 `SystemPromptComposer` 가 두 Repository 의 finder 를 호출해 String 으로 합치기 → `ComposerPromptBuilder.buildStaticSystemPrompt(targetCd)` 가 위임. `ComposerService.buildAnthropicRequest` 는 `session.getMode()` → `session.getTargetCd()` 한 줄만 변경. INVARIANTS / BASE_SYSTEM / 재확인 후미 / `newStepGuide` / `MODE_PREFIX` / `MODE_SUFFIX` / `existingModifyGuide` / `newGeneralGuide` 등 모드별 가이드 메서드 모두 삭제.

**Tech Stack:** Java 17 + Spring Boot 3 + Spring Data JPA. Test 인프라 (`spring-boot-starter-test`, H2) 가 backend 에 없으므로 unit test 대신 **컴파일 + manual smoke test** 로 검증.

**Spec:** `docs/superpowers/specs/2026-05-15-target-rule-hook-injection-design.md`

---

## File Structure

| 파일 | 변경 종류 | 책임 |
|---|---|---|
| `backend/src/main/java/com/zionex/t3composer/domain/service/SystemPromptComposer.java` | **신규** | targetCd 기반 rule + hook 을 fetch 해 단일 String 으로 조립. NULL/0건 시 IllegalStateException |
| `backend/src/main/java/com/zionex/t3composer/domain/service/ComposerPromptBuilder.java` | **대폭 축소** | INVARIANTS / BASE_SYSTEM / 모든 모드 가이드 메서드 / MODE_PREFIX/SUFFIX 제거. `buildStaticSystemPrompt(String)` 시그니처는 유지하되 SystemPromptComposer 위임. `buildSessionSystemPrompt(session)` + `buildSystemPrompt(session)` + `setScreenNoAllocator` 보존 |
| `backend/src/main/java/com/zionex/t3composer/domain/service/ComposerService.java:489` | **1줄 수정** | `session.getMode()` → `session.getTargetCd()` |
| `docker/db/init-pg/__migration_target_cd_backfill.sql` (선택) | 신규 | 기존 NULL targetCd 를 'T3SERIES' 로 backfill (수동 실행) |

**Repository finder**: 이미 `findByTargetCdAndUseYnOrderByPriorityAscRuleCodeAsc(targetCd, useYn)` (TargetRuleRepository:12) 와 `findByTargetCdAndEnabledOrderByHookEventAscSortOrderAsc(targetCd, enabled)` (TargetHookRepository:12) 존재 → **추가 작업 불필요**.

**Test 인프라**: `backend/src/test/` 디렉토리 자체가 없고 `spring-boot-starter-test` 도 pom.xml 에 없음 → unit test 추가 시 인프라 부터 셋업해야 함. 이 변경 하나 때문에 over-scope 이라 판단 → **manual smoke test 5단계 (spec §4.4) 로 검증**.

---

## Task 1: SystemPromptComposer 신규 작성

**Files:**
- Create: `backend/src/main/java/com/zionex/t3composer/domain/service/SystemPromptComposer.java`

- [ ] **Step 1: 새 파일 작성**

```java
package com.zionex.t3composer.domain.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.zionex.t3composer.domain.entity.TargetHook;
import com.zionex.t3composer.domain.entity.TargetRule;
import com.zionex.t3composer.domain.repository.TargetHookRepository;
import com.zionex.t3composer.domain.repository.TargetRuleRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * targetCd 의 모든 active rule + hook 을 priority / sort_order 순으로 합쳐
 * Anthropic system prompt 의 정적 블록 텍스트를 만든다.
 *
 * 호출 시점: ComposerPromptBuilder.buildStaticSystemPrompt(targetCd) 위임.
 *
 * - rule  = TB_CMP_TARGET_RULE (use_yn='Y', priority ASC, rule_code ASC)
 * - hook  = TB_CMP_TARGET_HOOK (enabled='Y', hook_event ASC, sort_order ASC)
 * - rule 0건이면 IllegalStateException — ClaudeAssetImportService 로 import 강제
 * - hook 0건은 OK — hooks 섹션 자체 생략
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SystemPromptComposer {

    private final TargetRuleRepository ruleRepo;
    private final TargetHookRepository hookRepo;

    /**
     * @throws IllegalStateException targetCd 가 NULL/blank 이거나 rule 이 0건일 때
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
                    "tb_cmp_target_rule 에 target_cd='" + targetCd + "' AND use_yn='Y' 인 rule 이 0건. "
                            + "ClaudeAssetImportService 로 .claude/rules/ 를 먼저 import 하세요.");
        }

        List<TargetHook> hooks = hookRepo
                .findByTargetCdAndEnabledOrderByHookEventAscSortOrderAsc(targetCd, "Y");

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

- [ ] **Step 2: 컴파일 확인**

```bash
docker exec composer-backend mvn -B -DskipTests compile -pl . -am 2>&1 | tail -20
```

Expected: `BUILD SUCCESS` (또는 호스트에서 `cd backend && mvn -B -DskipTests compile`)

- [ ] **Step 3: 커밋**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/service/SystemPromptComposer.java
git commit -m "feat(composer): add SystemPromptComposer — DB rule/hook → system prompt 조립

tb_cmp_target_rule (use_yn='Y', priority ASC, rule_code ASC) +
tb_cmp_target_hook (enabled='Y', hook_event ASC, sort_order ASC) 의
content/script_content 를 단일 String 으로 합치기.

NULL targetCd / rule 0건 시 IllegalStateException — 운영 사고 방지.
hook 0건은 hooks 섹션 자체 생략.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: ComposerPromptBuilder 축소

**Files:**
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/service/ComposerPromptBuilder.java`

**삭제 대상** (전체 파일의 약 90% 분량):
- `INVARIANTS` static 상수 (line 41~)
- `BASE_SYSTEM` static 상수 (참조하는 부분 모두)
- `MODE_PREFIX` / `MODE_SUFFIX` static 상수 (line 677, 680)
- `newGeneralGuide()` / `newStepGuide(StepGuideMode)` / `existingModifyGuide()` 등 모드별 가이드 메서드 (line ~700~920)
- `enum StepGuideMode`
- `buildStaticSystemPrompt(String mode)` 본체 (위임으로 대체)
- 재확인 후미 (line 626~638)
- 기타 mode-specific helper 메서드들 (kebab/screenIdHint 등 — sessionPart 안에서 안 쓰는 것)

**유지 대상**:
- `setScreenNoAllocator` setter (line 22)
- `buildSystemPrompt(session)` (line 585) — `buildStaticSystemPrompt(session.getTargetCd()) + buildSessionSystemPrompt(session)` 로 변경
- `buildSessionSystemPrompt(ComposerSession)` (line 646~674) — 그대로
- `screenNoAllocator` private 필드

- [ ] **Step 1: 사전 — 다른 service 가 ComposerPromptBuilder 의 어떤 public/static 멤버에 의존하는지 확인**

```bash
grep -rnE "ComposerPromptBuilder|INVARIANTS|newStepGuide|MODE_PREFIX|MODE_SUFFIX|newGeneralGuide|existingModifyGuide" \
     backend/src/main/java/ \
     | grep -v "ComposerPromptBuilder.java" | grep -v "SpScreenNoAllocator.java"
```

Expected: `ComposerService.java:489` 와 `:490` 만 매치 (`buildStaticSystemPrompt` / `buildSessionSystemPrompt` 호출).
다른 파일이 INVARIANTS / newStepGuide 등 직접 참조하면 → 그 파일도 함께 변경 필요 (Task 2.5 추가).
SpScreenNoAllocator.java 는 javadoc 주석에서 ComposerPromptBuilder 를 언급할 뿐 의존성 없음.

- [ ] **Step 2: ComposerPromptBuilder.java 를 다음 내용으로 완전 교체**

```java
package com.zionex.t3composer.domain.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.zionex.t3composer.domain.entity.ComposerSession;

/**
 * Claude 호출 시 사용할 system prompt 를 조립한다.
 *
 * 정적 블록 (Anthropic Prompt Caching 대상) — TB_CMP_TARGET_RULE / TB_CMP_TARGET_HOOK
 *   에서 동적 로드. SystemPromptComposer 에 위임.
 *
 * 동적 블록 — SP SCREEN_NO 자동 할당 hint + 현재 세션 컨텍스트 (mode/targetMenuCd/...).
 *
 * 변경 이력:
 *   2026-05-15: INVARIANTS / BASE_SYSTEM / 모드별 가이드 / 재확인 후미를 모두
 *               TB_CMP_TARGET_RULE 의 content 로 이전. ClaudeAssetImportService 로
 *               .claude/rules/*.md 를 import 한 뒤 SystemPromptComposer 가 재조립.
 */
@Component
public class ComposerPromptBuilder {

    private final SystemPromptComposer composer;

    /**
     * SP SCREEN_NO 자동 할당기 — DB 의 INFORMATION_SCHEMA.ROUTINES 를 조회해
     * 도메인별 max(NN)+1 을 반환. setter injection 으로 받아 (a) mock 용이성,
     * (b) 빈 미존재 환경 (예: 단순 prompt 빌드 호출) 에서도 동작.
     */
    private SpScreenNoAllocator screenNoAllocator;

    public ComposerPromptBuilder(SystemPromptComposer composer) {
        this.composer = composer;
    }

    @Autowired(required = false)
    public void setScreenNoAllocator(SpScreenNoAllocator allocator) {
        this.screenNoAllocator = allocator;
    }

    public String buildSystemPrompt(ComposerSession session) {
        return buildStaticSystemPrompt(session.getTargetCd()) + buildSessionSystemPrompt(session);
    }

    /**
     * targetCd 기반 정적 블록 — Anthropic Prompt Caching 키 단위로 사용.
     * 같은 target 의 모든 세션·모드는 동일 텍스트 → 5분 TTL 안에서 input token 90% 절감.
     *
     * @throws IllegalStateException targetCd 가 NULL 이거나 DB rule 이 0건일 때
     */
    public String buildStaticSystemPrompt(String targetCd) {
        return composer.compose(targetCd);
    }

    /**
     * 세션별로 달라지는 가변 부분 — SP SCREEN_NO 힌트 + 현재 세션 컨텍스트.
     * 캐시 대상에서 제외 (매 호출마다 다른 텍스트가 될 수 있음).
     */
    public String buildSessionSystemPrompt(ComposerSession session) {
        StringBuilder sb = new StringBuilder();

        // SP SCREEN_NO 자동 할당 — DB 의 현재 사용 중인 SP 를 조회해 도메인별 권장 NN 주입.
        // 신규 모드일 때만 의미 있으므로 EXISTING_MODIFY 는 생략.
        if (screenNoAllocator != null
                && session.getMode() != null
                && !ComposerSession.MODE_EXISTING_MODIFY.equals(session.getMode())) {
            try {
                String hint = screenNoAllocator.buildPromptHint();
                if (hint != null && !hint.isBlank()) {
                    sb.append("\n\n").append(hint);
                }
            } catch (Exception e) {
                // prompt 빌드 자체가 실패하면 안 됨 — hint 없이 진행
            }
        }

        sb.append("\n\n=== 현재 세션 컨텍스트 ===\n");
        sb.append("- 모드: ").append(session.getMode()).append("\n");
        if (session.getTargetMenuCd() != null && !session.getTargetMenuCd().isBlank()) {
            sb.append("- 대상 메뉴 코드(수정): ").append(session.getTargetMenuCd()).append("\n");
        }
        if (session.getDesignDocName() != null && !session.getDesignDocName().isBlank()) {
            sb.append("- 업로드 설계서: ").append(session.getDesignDocName()).append("\n");
        }

        return sb.toString();
    }
}
```

- [ ] **Step 3: 컴파일 확인**

```bash
docker exec composer-backend mvn -B -DskipTests compile 2>&1 | tail -20
```

Expected: `BUILD SUCCESS`. 만약 다른 service 에서 삭제된 메서드 호출하는 컴파일 에러 → Step 1 의 grep 결과를 다시 보고 그 파일들도 함께 수정.

- [ ] **Step 4: 커밋**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/service/ComposerPromptBuilder.java
git commit -m "refactor(composer): ComposerPromptBuilder 축소 — INVARIANTS / 모드 가이드 모두 삭제

INVARIANTS / BASE_SYSTEM / MODE_PREFIX / MODE_SUFFIX / newStepGuide /
newGeneralGuide / existingModifyGuide 등 하드코딩된 정적 가이드를 모두 삭제.
buildStaticSystemPrompt(String) 시그니처는 유지하되 의미를 변경:
인자가 mode 가 아닌 targetCd 이며, SystemPromptComposer.compose(targetCd) 위임.

buildSessionSystemPrompt(session) 는 그대로 — SP SCREEN_NO hint /
현재 세션 컨텍스트 (mode/targetMenuCd/designDocName).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: ComposerService 호출부 변경

**Files:**
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/service/ComposerService.java:489`

- [ ] **Step 1: line 486~490 의 주석 업데이트 + line 489 수정**

기존 (line 486~490):
```java
        // System prompt 를 정적/세션 두 블록으로 분리.
        // 정적 블록(INVARIANTS + BASE_SYSTEM + 모드별 가이드 + 재확인 후미) 에 cache_control 부착 →
        // 같은 모드의 후속 호출은 5분 TTL 안에서 input token 비용 90% 절감 (Anthropic Prompt Caching).
        String staticPart  = promptBuilder.buildStaticSystemPrompt(session.getMode());
        String sessionPart = promptBuilder.buildSessionSystemPrompt(session);
```

변경 후:
```java
        // System prompt 를 정적/세션 두 블록으로 분리.
        // 정적 블록 (TB_CMP_TARGET_RULE + TB_CMP_TARGET_HOOK 의 content 합본) 에
        // cache_control 부착 → 같은 target 의 후속 호출은 5분 TTL 안에서 input token
        // 비용 90% 절감 (Anthropic Prompt Caching). targetCd 별로 캐시 키 자연 분리.
        String staticPart  = promptBuilder.buildStaticSystemPrompt(session.getTargetCd());
        String sessionPart = promptBuilder.buildSessionSystemPrompt(session);
```

- [ ] **Step 2: 컴파일 확인**

```bash
docker exec composer-backend mvn -B -DskipTests compile 2>&1 | tail -10
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 3: 커밋**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/service/ComposerService.java
git commit -m "feat(composer): buildAnthropicRequest — staticPart 키를 mode → targetCd 로 변경

ComposerPromptBuilder.buildStaticSystemPrompt 의 인자가 session.getMode() 가
아닌 session.getTargetCd() 가 되어야 SystemPromptComposer 가 DB 에서 해당
target 의 rule/hook 을 fetch. mode 는 sessionPart 안에서 동적 컨텍스트로 계속 활용.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: 기존 세션 targetCd backfill (선택)

**Files:**
- Create: `docker/db/init-pg/__migration_target_cd_backfill.sql` (수동 실행용, init-pg 자동 실행 폴더에 두지만 idempotent)

**필요성**: 변경 후 `session.getTargetCd() == null` 인 기존 세션이 chat 호출 시 `IllegalStateException` 으로 실패. 운영 환경에서 기존 세션 보존 필요하면 backfill.

- [ ] **Step 1: 마이그레이션 SQL 작성**

```sql
-- __migration_target_cd_backfill.sql
-- 2026-05-15 변경 (Target Rule/Hook DB 주입) 후 기존 세션 호환용.
-- targetCd 가 NULL 인 ComposerSession 을 'T3SERIES' 로 backfill.
-- 멱등 — 이미 채워진 세션은 변경 안 함.

UPDATE tb_is_composer_session
   SET target_cd = 'T3SERIES',
       modify_by = 'migration',
       modify_dttm = NOW()
 WHERE target_cd IS NULL;

-- 확인
SELECT COUNT(*) AS remaining_null FROM tb_is_composer_session WHERE target_cd IS NULL;
-- → 0 이면 OK
```

(테이블명 `tb_is_composer_session` 인지 확인 필요 — agent 보고서 + entity `ComposerSession.java` 의 `@Table` 참조)

- [ ] **Step 2: 실제 테이블명 확인**

```bash
grep -E "@Table" backend/src/main/java/com/zionex/t3composer/domain/entity/ComposerSession.java | head -3
```

Expected: `@Table(name = "tb_is_composer_session")` 또는 유사. 다르면 SQL 의 테이블명 수정.

- [ ] **Step 3: 마이그레이션 실행 (운영 환경 적용 시점)**

```bash
docker exec composer-db psql -U postgres -d T3SMARTSCM \
  -f /docker-entrypoint-initdb.d/__migration_target_cd_backfill.sql
```

또는 직접:
```bash
cat docker/db/init-pg/__migration_target_cd_backfill.sql | \
  docker exec -i composer-db psql -U postgres -d T3SMARTSCM
```

- [ ] **Step 4: 커밋**

```bash
git add docker/db/init-pg/__migration_target_cd_backfill.sql
git commit -m "chore(db): targetCd backfill 마이그레이션 — 기존 세션 'T3SERIES' 로 변경

2026-05-15 Target Rule/Hook DB 주입 변경 후 NULL targetCd 세션이
IllegalStateException 으로 실패하는 것을 방지. 멱등.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: Manual Smoke Test (운영 검증)

**Files:** 없음 (검증만)

- [ ] **Step 1: composer-backend 컨테이너 재기동**

```bash
docker compose restart composer-backend
docker logs --tail 50 composer-backend 2>&1 | grep -E "Started|ERROR|Caused by"
```

Expected: `Started ComposerApplication in N seconds` (에러 없음).

- [ ] **Step 2: T3SERIES rule 갯수 확인**

```bash
docker exec composer-db psql -U postgres -d T3SMARTSCM -c \
  "SELECT count(*) FROM tb_cmp_target_rule WHERE target_cd='T3SERIES' AND use_yn='Y'"
```

Expected: ≥ 1. 0 이면 ClaudeAssetImportService 실행 필요 (`POST /composer/target-system/T3SERIES/import-claude` 또는 manage UI).

- [ ] **Step 3: T3SERIES 세션으로 1회 chat → log 확인**

UI 에서 T3SERIES target 으로 새 세션 생성 후 짧은 prompt (예: "안녕하세요") 보냄.

```bash
docker logs --tail 100 composer-backend 2>&1 | grep "SystemPromptComposer"
```

Expected: `[SystemPromptComposer] target=T3SERIES, rules=N, hooks=M, totalChars=X` 1줄.

- [ ] **Step 4: 의도적 실패 — targetCd NULL 인 세션 테스트**

기존 NULL 세션이 있다면 그걸로 chat. 없다면 직접 INSERT:

```bash
docker exec composer-db psql -U postgres -d T3SMARTSCM -c \
  "INSERT INTO tb_is_composer_session (id, user_id, mode, status, target_cd, create_by, create_dttm, total_in_tokens, total_out_tokens) \
   VALUES ('test-null-target', 'test', 'NEW_GENERAL', 'ACTIVE', NULL, 'test', NOW(), 0, 0)"
```

(컬럼명은 실제 ComposerSession 엔티티에 맞춰 조정 — `id`/`user_id`/`mode`/`status`/`target_cd` 등)

UI 에서 그 세션 선택 후 chat → ResponseMessage error 응답 확인.

```bash
docker logs --tail 50 composer-backend 2>&1 | grep -E "IllegalStateException|targetCd 가 NULL"
```

Expected: `IllegalStateException: session.targetCd 가 NULL` 1줄. UI 에는 사용자 친화적 에러 메시지.

cleanup:
```bash
docker exec composer-db psql -U postgres -d T3SMARTSCM -c \
  "DELETE FROM tb_is_composer_session WHERE id='test-null-target'"
```

- [ ] **Step 5: PLANNEL 세션 테스트 (rule 이 등록되어 있다면)**

PLANNEL rule 갯수 확인:
```bash
docker exec composer-db psql -U postgres -d T3SMARTSCM -c \
  "SELECT count(*) FROM tb_cmp_target_rule WHERE target_cd='PLANNEL' AND use_yn='Y'"
```

≥ 1 이면 PLANNEL 세션 생성 후 chat → log 에 `target=PLANNEL` 확인.
0 이면 import 후 동일 검증, 또는 의도적 실패 검증 (rule 0건 IllegalStateException).

- [ ] **Step 6: smoke 결과 commit (필요 시 plan 업데이트)**

검증 통과면 plan 의 모든 task 체크박스 ✅. 실패 발견되면 hot-fix.

---

## Self-Review 결과

✅ Spec coverage:
- spec §Architecture / §Components / §Data Flow → Task 1, 2, 3
- spec §Error Handling (NULL targetCd / rule 0건) → Task 1 의 SystemPromptComposer 본체에 구현
- spec §Compatibility (기존 NULL 세션) → Task 4 의 backfill SQL
- spec §Testing §4.4 manual smoke → Task 5
- spec §Testing §4.1 unit test → 의도적으로 미포함 (test 인프라 부재. 별도 spec 으로 분리 권장)

✅ Type consistency:
- `findByTargetCdAndUseYnOrderByPriorityAscRuleCodeAsc(targetCd, "Y")` — TargetRuleRepository:12 와 정확히 일치
- `findByTargetCdAndEnabledOrderByHookEventAscSortOrderAsc(targetCd, "Y")` — TargetHookRepository:12 와 정확히 일치 (spec 에서 `sort_order ASC, script_name ASC` 라 했으나 실제 finder 는 `hookEvent ASC, sortOrder ASC` — hook_event 별 그룹핑이 더 의미 있어 그대로 사용)
- `buildStaticSystemPrompt(String)` 시그니처 유지 — 인자 의미만 변경

✅ Placeholder scan: 없음. 모든 step 에 actual content 명시.

✅ Scope check: 단일 spec, 단일 plan 으로 충분. unit test 추가는 별도 spec 권장.

---

## 변경 사항 한눈 요약

| Task | 파일 | 변경 lines (대략) |
|---|---|---|
| 1 | SystemPromptComposer.java (신규) | +95 |
| 2 | ComposerPromptBuilder.java | -800, +75 (대폭 축소) |
| 3 | ComposerService.java | 1 line + 주석 |
| 4 | __migration_target_cd_backfill.sql (신규) | +12 |
| 5 | (manual smoke) | 0 |

총 5개 commit, 코드 ~ -700 lines.

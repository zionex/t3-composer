# 마지막 생성 단계 자동화 + 토큰 초과 해결 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 화면 생성 시 시스템 프롬프트를 필요한 rule 만 include + hook bash 본문 제거로 ~135K→~31~48K 토큰으로 줄여 자동 생성이 200K 한도 안에서 성공하게 하고, 마지막 ④ 단계 UI 를 자동생성+산출물 전면 / 채팅 기본 접힘으로 재배치한다.

**Architecture:** 백엔드 `SystemPromptComposer.compose(targetCd, ruleScope)` 가 ruleScope(코드 상수 include-set + spec 플래그) 로 rule 을 선별하고 hook 은 한 줄 요약만 붙인다. ruleScope 는 `GenerateStep` 이 spec 에서 산정해 `createSession` 으로 보내 `ComposerSession.ruleScope` 에 저장 → 세션 내 모든 Claude 호출이 동일 정적 블록(프롬프트 캐싱 유지). 프런트는 `ComposerWorkspace` 에 `chatCollapsed` prop 을 추가해 채팅을 접고 자동 생성 진행/실패 배너를 전면화한다.

**Tech Stack:** Spring Boot 3 (Java 17), React 18 + MUI 5, Postgres(init-pg 멱등 마이그레이션). 테스트 프레임워크 없음 → 백엔드는 `mvn compile` + 시스템 프롬프트 로그 검증, 프런트는 babel parse + webpack build + 수동 검증.

---

## 파일 구조

**Backend (`backend/src/main/java/com/zionex/t3composer/domain/`)**
- `service/SystemPromptComposer.java` (수정) — `compose(targetCd, ruleScope)` 오버로드 + include-set 헬퍼 + hook 요약화. 책임: 정적 프롬프트 조립.
- `dto/CreateSessionRequest.java` (수정) — `ruleScope` 필드.
- `entity/ComposerSession.java` (수정) — `RULE_SCOPE` 컬럼/필드/빌더.
- `service/ComposerPromptBuilder.java` (수정) — `buildStaticSystemPrompt(targetCd, ruleScope)` 오버로드.
- `service/ComposerService.java` (수정) — createSession 에 ruleScope 저장 + 프롬프트 조립부(line 632) 가 session.ruleScope 사용.

**DB (`docker/db/init-pg/`)**
- `04_composer_session_message_artifact.sql` (수정) — `RULE_SCOPE` 멱등 컬럼 추가.

**Frontend (`frontend/src/view/util/t3composer/`)**
- `api.js` (수정) — `createSession` 에 `ruleScope` 파라미터.
- `GenerateStep.jsx` (수정) — spec→ruleScope 산정 + createSession 전달 + `chatCollapsed` 전달.
- `ChatPanel.jsx` (수정) — `onGenStatus` 콜백(자동/수동 전송 sending·done·error 보고).
- `ComposerWorkspace.jsx` (수정) — `chatCollapsed` prop → 채팅 접기 토글 + gen-status 배너 + 재시도.

---

## Task 1: SystemPromptComposer — hook 요약 + ruleScope include-set

**Files:**
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/service/SystemPromptComposer.java`

- [ ] **Step 1: import 추가**

파일 상단 import 블록(현재 `java.util.List` 만)에 추가:

```java
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
```

- [ ] **Step 2: include-set 상수 + 헬퍼 추가**

`SystemPromptComposer` 클래스 안, 필드(`hookRepo`) 선언 바로 아래에 추가:

```java
    // ── 화면 생성용 rule include-set (rule_code 기준) ──────────────
    //   토큰 절감: 화면 생성에 필요한 rule 만 system prompt 에 주입.
    //   설계: docs/superpowers/specs/2026-05-28-composer-final-step-autogen-token-design.md §3.2
    private static final Set<String> CORE_RULES = Set.of(
            "41-composer-generation", "41a-composer-jsx", "20-screen-development",
            "99a-composer-anti-patterns", "32-sql-schema-verification");
    private static final Set<String> BACKEND_RULES = Set.of(
            "41b-composer-java", "30-database-schema", "31-stored-procedures");
    private static final Set<String> FILTER_RULES = Set.of(
            "41c-composer-widgets", "22-filter-bar");

    /**
     * ruleScope 문자열(예: "backend,filter") 로 포함할 rule_code 집합 계산.
     * core 는 항상 포함, backend/filter 토큰이 있으면 해당 set 추가.
     */
    static Set<String> screenGenRuleCodes(String ruleScope) {
        Set<String> codes = new HashSet<>(CORE_RULES);
        if (ruleScope != null) {
            if (ruleScope.contains("backend")) codes.addAll(BACKEND_RULES);
            if (ruleScope.contains("filter"))  codes.addAll(FILTER_RULES);
        }
        return codes;
    }
```

- [ ] **Step 3: compose 오버로드 + hook 요약화로 본문 교체**

기존 `public String compose(String targetCd) { ... }` 메서드 전체(line 37~94)를 아래로 교체:

```java
    /** 기존 시그니처 — ruleScope 없이 전체 rule (back-compat / 비 화면생성 경로). */
    public String compose(String targetCd) {
        return compose(targetCd, null);
    }

    /**
     * @param ruleScope null/blank 이면 전체 rule(폴백), 아니면 screenGenRuleCodes 로 선별.
     * @throws IllegalStateException targetCd 가 NULL/blank 이거나 rule 이 0건일 때
     */
    public String compose(String targetCd, String ruleScope) {
        if (targetCd == null || targetCd.isBlank()) {
            throw new IllegalStateException(
                    "session.targetCd 가 NULL — Composer 세션 생성 시 target 을 명시해야 합니다.");
        }

        List<TargetRule> allRules = ruleRepo
                .findByTargetCdAndUseYnOrderByPriorityAscRuleCodeAsc(targetCd, "Y");
        if (allRules.isEmpty()) {
            throw new IllegalStateException(
                    "tb_cmp_target_rule 에 target_cd='" + targetCd + "' AND use_yn='Y' 인 rule 이 0건. "
                            + "ClaudeAssetImportService 로 .claude/rules/ 를 먼저 import 하세요.");
        }

        // ruleScope 가 있으면 include-set 으로 선별. 선별 결과가 비면(코드 불일치) 안전하게 전체로 폴백.
        List<TargetRule> rules = allRules;
        if (ruleScope != null && !ruleScope.isBlank()) {
            Set<String> include = screenGenRuleCodes(ruleScope);
            List<TargetRule> filtered = allRules.stream()
                    .filter(r -> include.contains(r.getRuleCode()))
                    .collect(Collectors.toList());
            if (!filtered.isEmpty()) rules = filtered;
        }

        List<TargetHook> hooks = hookRepo
                .findByTargetCdAndEnabledOrderByHookEventAscSortOrderAsc(targetCd, "Y");

        StringBuilder sb = new StringBuilder();

        // ── Rules ──────────────────────────────────────────────────
        sb.append("# ").append(targetCd).append(" — 규약 (Rules)\n\n");
        sb.append("아래는 ").append(targetCd)
                .append(" target 의 활성 규약입니다. 산출물 생성 시 모두 준수하세요.\n\n");

        for (TargetRule r : rules) {
            sb.append("---\n\n");
            sb.append("## [Rule ").append(r.getRuleCode()).append("] ")
                    .append(r.getTitle() != null ? r.getTitle() : r.getRuleCode())
                    .append("\n\n");
            sb.append(r.getContent()).append("\n\n");
        }

        // ── Hooks (자동 검증 — 요약만, bash 본문 제외) ──────────────
        //   hook 은 서버 PreToolUse 로 실제 차단 실행되므로 LLM 엔 "어떤 검증이 차단되는지"
        //   신호만 충분. 전체 스크립트(~45K 토큰) 는 프롬프트에서 제거.
        if (!hooks.isEmpty()) {
            sb.append("\n---\n\n");
            sb.append("# ").append(targetCd).append(" — 자동 검증 규칙 (Hooks · 저장 시 차단)\n\n");
            sb.append("아래 검증이 산출물 저장 시 실제 차단됩니다. 출력 직전 self-check 로 회피하세요.\n\n");
            for (TargetHook h : hooks) {
                sb.append("- [").append(h.getHookEvent()).append("/").append(h.getScriptName()).append("]");
                if (h.getMatcher() != null && !h.getMatcher().isBlank()) {
                    sb.append(" (matcher: ").append(h.getMatcher()).append(")");
                }
                sb.append("\n");
            }
        }

        String result = sb.toString();
        String selectedCodes = rules.stream().map(TargetRule::getRuleCode).collect(Collectors.joining(","));
        log.info("[SystemPromptComposer] target={}, ruleScope={}, rules={}/{}, hooks={}, totalChars={}, rules=[{}]",
                targetCd, ruleScope, rules.size(), allRules.size(), hooks.size(), result.length(), selectedCodes);
        return result;
    }
```

- [ ] **Step 4: 컴파일 검증**

Run: `docker compose exec -T composer-backend mvn -q -DskipTests compile`
(fallback: `cd backend && mvn -q -DskipTests compile`)
Expected: exit 0, 컴파일 에러 0건.

- [ ] **Step 5: 커밋**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/service/SystemPromptComposer.java
git commit -m "feat(composer): SystemPromptComposer — ruleScope include-set + hook 요약화(토큰 절감)"
```

---

## Task 2: ruleScope 보존 — DTO + 엔티티 + DB 마이그레이션

**Files:**
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/dto/CreateSessionRequest.java`
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/entity/ComposerSession.java`
- Modify: `docker/db/init-pg/04_composer_session_message_artifact.sql`

- [ ] **Step 1: CreateSessionRequest 에 ruleScope 추가**

`private String targetCd;` 선언 아래에 추가:

```java

    /**
     * 화면 생성 시 system prompt rule 선별 scope — 활성 플래그를 콤마로 직렬화.
     * 예: "backend,filter" / "backend" / "" (core only). 미지정(null)이면 전체 rule.
     */
    private String ruleScope;
```

- [ ] **Step 2: ComposerSession 에 RULE_SCOPE 필드 추가**

`@Column(name = "TARGET_CD", length = 50)` + `private String targetCd;` 블록 아래에 추가:

```java

    @Column(name = "RULE_SCOPE", length = 40)
    private String ruleScope;
```

(`@Builder` 가 클래스에 이미 적용돼 있으므로 `.ruleScope(...)` 빌더 메서드가 자동 생성됨 — 별도 작업 불필요.)

- [ ] **Step 3: init-pg DDL 에 멱등 컬럼 추가**

`docker/db/init-pg/04_composer_session_message_artifact.sql` 에서 `TB_IS_COMPOSER_SESSION` 의
`CREATE TABLE` 문 바로 다음(또는 파일 끝 적절한 위치)에 멱등 ALTER 추가:

```sql
-- 화면 생성 rule 선별 scope (2026-05-28) — 기존 DB 에도 멱등 적용
ALTER TABLE dbo.TB_IS_COMPOSER_SESSION ADD COLUMN IF NOT EXISTS RULE_SCOPE varchar(40);
```

(스키마 prefix 가 파일 내 다른 문과 다르면 같은 prefix 사용 — 파일을 읽어 기존 `TB_IS_COMPOSER_SESSION` 참조 표기와 일치시킬 것.)

- [ ] **Step 4: 실행 중인 DB 에 마이그레이션 수동 적용**

init-pg 는 최초 생성 시에만 실행되므로(멱등 마커) 기존 볼륨엔 수동 적용 필요 (rules/50 §10):

Run:
```bash
docker compose exec -T composer-db psql -U composer -d t3composer -v ON_ERROR_STOP=1 \
  -c "ALTER TABLE dbo.TB_IS_COMPOSER_SESSION ADD COLUMN IF NOT EXISTS RULE_SCOPE varchar(40);"
```
Expected: `ALTER TABLE` (또는 이미 있으면 NOTICE — 멱등). 에러 없음.

- [ ] **Step 5: 컴파일 검증**

Run: `docker compose exec -T composer-backend mvn -q -DskipTests compile`
Expected: exit 0.

- [ ] **Step 6: 커밋**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/dto/CreateSessionRequest.java backend/src/main/java/com/zionex/t3composer/domain/entity/ComposerSession.java docker/db/init-pg/04_composer_session_message_artifact.sql
git commit -m "feat(composer): 세션 ruleScope 필드 + RULE_SCOPE 컬럼 (DTO/엔티티/DDL)"
```

---

## Task 3: 배선 — createSession 저장 + 프롬프트 조립이 ruleScope 사용

**Files:**
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/service/ComposerPromptBuilder.java`
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/service/ComposerService.java`

- [ ] **Step 1: ComposerPromptBuilder 오버로드 추가**

`buildStaticSystemPrompt(String targetCd)` 메서드(현재 `return composer.compose(targetCd);`) 를 아래로 교체:

```java
    public String buildStaticSystemPrompt(String targetCd) {
        return composer.compose(targetCd);
    }

    /** ruleScope 기반 정적 블록 — 화면 생성 시 필요한 rule 만 포함. */
    public String buildStaticSystemPrompt(String targetCd, String ruleScope) {
        return composer.compose(targetCd, ruleScope);
    }
```

- [ ] **Step 2: createSession 이 ruleScope 저장**

`ComposerService.createSession` 의 빌더(line 121~131)에서 `.targetCd(req.getTargetCd())` 다음 줄에 추가:

```java
                .ruleScope(req.getRuleScope())
```

(즉 빌더가 `.targetCd(...).ruleScope(req.getRuleScope()).title(...)` 순서가 되도록.)

- [ ] **Step 3: 프롬프트 조립이 session.ruleScope 사용**

`ComposerService` 의 프롬프트 조립부(line 632):

```java
        String staticPart  = promptBuilder.buildStaticSystemPrompt(session.getTargetCd());
```

를 아래로 교체:

```java
        String staticPart  = promptBuilder.buildStaticSystemPrompt(session.getTargetCd(), session.getRuleScope());
```

- [ ] **Step 4: 컴파일 검증**

Run: `docker compose exec -T composer-backend mvn -q -DskipTests compile`
Expected: exit 0.

- [ ] **Step 5: 커밋**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/service/ComposerPromptBuilder.java backend/src/main/java/com/zionex/t3composer/domain/service/ComposerService.java
git commit -m "feat(composer): createSession ruleScope 저장 + 프롬프트 조립이 세션 ruleScope 사용"
```

---

## Task 4: Frontend — api.createSession + GenerateStep ruleScope/chatCollapsed

**Files:**
- Modify: `frontend/src/view/util/t3composer/api.js`
- Modify: `frontend/src/view/util/t3composer/GenerateStep.jsx`

- [ ] **Step 1: api.createSession 에 ruleScope 추가**

`frontend/src/view/util/t3composer/api.js` 의 `createSession` 정의를 아래로 교체:

```js
export const createSession = ({ mode, targetMenuCd, title, modelName, targetCd, ruleScope }) =>
  zAxios.post('composer/sessions',
    { mode, targetMenuCd, title, modelName, targetCd, ruleScope }, composerReq());
```

- [ ] **Step 2: GenerateStep 에 ruleScope 산정 헬퍼 추가**

`frontend/src/view/util/t3composer/GenerateStep.jsx` 의 `import { createSession } from './api';` 아래,
`function GenerateStep(...)` 위에 추가:

```js
// spec → system prompt rule 선별 scope 문자열 ("backend,filter" 등).
//   backend: 신규 생성 모드이거나 layer 가 SP/ENTITY 데이터소스를 씀 → Java/SP/DB rule 필요.
//   filter:  filterBar 항목이 있거나 cascade 가 정의됨 → 위젯/필터 rule 필요.
function computeRuleScope(spec) {
  const layers = Array.isArray(spec?.layers) ? spec.layers : [];
  const mode = spec?.meta?.mode || 'NEW_STEP';
  const newModes = ['NEW_STEP', 'NEW_NL', 'NEW_GENERAL', 'NEW_FROM_DESIGN'];
  const hasBackend = newModes.includes(mode)
    || layers.some((l) => ['SP', 'ENTITY'].includes(l?.dataSource?.mode));
  const hasFilter = (spec?.filterBar?.items?.length > 0)
    || layers.some((l) => l?.cascade && Object.keys(l.cascade).length > 0);
  return [hasBackend && 'backend', hasFilter && 'filter'].filter(Boolean).join(',');
}
```

- [ ] **Step 3: createSession 호출에 ruleScope 전달**

`GenerateStep` 의 createSession 호출(현재 `mode, title, modelName, targetCd, targetMenuCd` 전달)을 아래처럼 `ruleScope` 포함하도록 수정. `const mode = spec?.meta?.mode || 'NEW_STEP';` 다음 줄에 추가:

```js
        const ruleScope = computeRuleScope(spec);
```

그리고 `createSession({ ... })` 객체에 `ruleScope,` 추가:

```js
        const res = await createSession({
          mode,
          title,
          modelName: 'claude-sonnet-4-5',
          targetCd,
          targetMenuCd: explicitMenuCd,
          ruleScope,
        });
```

- [ ] **Step 4: ComposerWorkspace 에 chatCollapsed 전달**

`GenerateStep` 의 `<ComposerWorkspace ... />` 에 `chatCollapsed` prop 추가:

```jsx
      <ComposerWorkspace
        session={session}
        initialPrompt={initialPrompt}
        chatCollapsed
        extraHeader={
```

(나머지 prop 은 그대로 유지.)

- [ ] **Step 5: 구문 검증**

Run (frontend 디렉토리에서):
```bash
node -e "const b=require('@babel/core');['src/view/util/t3composer/api.js','src/view/util/t3composer/GenerateStep.jsx'].forEach(f=>b.transformFileSync(f,{presets:[['@babel/preset-react']],babelrc:false,configFile:false}));console.log('SYNTAX_OK')"
```
Expected: `SYNTAX_OK`

- [ ] **Step 6: 커밋**

```bash
git add frontend/src/view/util/t3composer/api.js frontend/src/view/util/t3composer/GenerateStep.jsx
git commit -m "feat(composer): GenerateStep ruleScope 산정 + chatCollapsed 전달"
```

---

## Task 5: Frontend — ChatPanel onGenStatus 콜백

**Files:**
- Modify: `frontend/src/view/util/t3composer/ChatPanel.jsx`

- [ ] **Step 1: prop 시그니처에 onGenStatus 추가**

`forwardRef` 컴포넌트의 props 구조분해(line 35):

```js
  { sessionId, onNewAssistantMsg, placeholder, initialPrompt, initialAttachments }, ref) {
```

를 아래로 교체:

```js
  { sessionId, onNewAssistantMsg, placeholder, initialPrompt, initialAttachments, onGenStatus }, ref) {
```

- [ ] **Step 2: send 진입 시 'sending' 보고**

`send` 함수에서 `setSending(true);` 다음 줄에 추가:

```js
    if (onGenStatus) onGenStatus({ phase: 'sending' });
```

- [ ] **Step 3: 성공 시 'done' 보고**

`send` 함수의 성공 경로 `ok = true;` (정상 try 블록 끝, `await reload(); if (onNewAssistantMsg) onNewAssistantMsg(); ok = true;`) 직후에 추가:

```js
      if (onGenStatus) onGenStatus({ phase: 'done' });
```

- [ ] **Step 4: 실패 시 'error' 보고**

`send` 함수의 `catch` 블록에서 `setError(msg);` 호출 직후(같은 if(!ok) 블록 안)에 추가:

```js
        if (onGenStatus) onGenStatus({ phase: 'error', message: msg });
```

(401 이 실제로는 성공(`ok=true`)으로 판정된 경우엔 위 'error' 보고를 타지 않도록 — `if (!ok)` 블록 안에 두는 것이 핵심. 그리고 같은 catch 초입의 401-성공 분기에서 `ok=true` 가 된 경우 'done' 도 보고하려면, catch 끝의 `if (ok && onGenStatus) onGenStatus({ phase: 'done' });` 한 줄을 catch 블록 맨 끝에 추가.)

catch 블록 맨 끝(닫는 `}` 직전)에 추가:

```js
      if (ok && onGenStatus) onGenStatus({ phase: 'done' });
```

- [ ] **Step 5: 구문 검증**

Run (frontend 디렉토리에서):
```bash
node -e "require('@babel/core').transformFileSync('src/view/util/t3composer/ChatPanel.jsx',{presets:[['@babel/preset-react']],babelrc:false,configFile:false});console.log('SYNTAX_OK')"
```
Expected: `SYNTAX_OK`

- [ ] **Step 6: 커밋**

```bash
git add frontend/src/view/util/t3composer/ChatPanel.jsx
git commit -m "feat(composer): ChatPanel onGenStatus 콜백 (sending/done/error)"
```

---

## Task 6: Frontend — ComposerWorkspace chatCollapsed (채팅 접기 + 배너)

**Files:**
- Modify: `frontend/src/view/util/t3composer/ComposerWorkspace.jsx`

- [ ] **Step 1: import + prop + state 추가**

(a) 파일 상단 MUI import 에 `Collapse` 가 없으면 추가. `@mui/material` import 목록에 `Collapse,` 추가.
   아이콘 import 영역에 추가:
```js
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditNoteIcon from '@mui/icons-material/EditNote';
```

(b) 컴포넌트 시그니처(line 146)
```js
function ComposerWorkspace({ session, initialPrompt, initialAttachments, extraHeader }) {
```
를 아래로 교체:
```js
function ComposerWorkspace({ session, initialPrompt, initialAttachments, extraHeader, chatCollapsed = false }) {
```

(c) state 영역(다른 useState 들과 함께, 예: `chatRef` 선언 근처)에 추가:
```js
  const [chatExpanded, setChatExpanded] = React.useState(!chatCollapsed);
  const [genStatus, setGenStatus] = React.useState(null); // { phase:'sending'|'done'|'error', message }
```

- [ ] **Step 2: gen-status 배너 렌더 (본문 SplitPane 위)**

`{/* ───── 본문 — 좌측 ... ───── */}` 주석과 `<SplitPane direction="horizontal"` 사이에 배너 추가:

```jsx
      {chatCollapsed && genStatus && genStatus.phase !== 'done' && (
        <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider',
                   display: 'flex', alignItems: 'center', gap: 1,
                   bgcolor: genStatus.phase === 'error' ? '#fef2f2' : '#eff6ff' }}>
          {genStatus.phase === 'sending' && <CircularProgress size={16} />}
          <Typography variant="body2" sx={{ flex: 1, fontWeight: 600,
                     color: genStatus.phase === 'error' ? '#b91c1c' : '#1e40af',
                     whiteSpace: 'pre-wrap' }}>
            {genStatus.phase === 'sending' ? '🪄 화면 생성 중…' : `⚠ 생성 실패: ${genStatus.message || ''}`}
          </Typography>
          {genStatus.phase === 'error' && (
            <Button size="small" variant="outlined" color="error"
                    onClick={() => { setGenStatus({ phase: 'sending' }); chatRef.current?.sendMessage(initialPrompt); }}>
              재시도
            </Button>
          )}
        </Box>
      )}
```

(`CircularProgress`, `Typography`, `Button`, `Box` 는 이미 import 되어 있음 — 없으면 추가.)

- [ ] **Step 3: 좌측 하단 ChatPanel 을 접기 토글로 감싸기**

내부 vertical SplitPane 의 `second` (ChatPanel 을 담은 Box, line 748~757) 를 아래로 교체.
`chatCollapsed` 일 때는 토글 헤더 + `Collapse`(children 유지 마운트) 로 감싸고, 아니면 기존대로:

```jsx
            second={
              chatCollapsed ? (
                <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: '#fff', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <Box onClick={() => setChatExpanded((v) => !v)}
                       sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 1, cursor: 'pointer',
                             borderBottom: chatExpanded ? '1px solid rgba(0,0,0,0.06)' : 'none', flexShrink: 0,
                             '&:hover': { bgcolor: '#f8fafc' } }}>
                    <EditNoteIcon fontSize="small" sx={{ color: '#64748b' }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', flex: 1 }}>
                      수정 요청 {chatExpanded ? '' : '— 추가로 고칠 내용을 입력하려면 펼치기'}
                    </Typography>
                    <ExpandMoreIcon fontSize="small"
                      sx={{ color: '#94a3b8', transform: chatExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
                  </Box>
                  <Collapse in={chatExpanded} sx={{ flex: chatExpanded ? 1 : 'none', minHeight: 0, overflow: 'hidden' }}
                            timeout={150}>
                    <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                      <ChatPanel
                        ref={chatRef}
                        sessionId={session.id}
                        onNewAssistantMsg={triggerRefresh}
                        onGenStatus={setGenStatus}
                        initialPrompt={initialPrompt}
                        initialAttachments={initialAttachments}
                      />
                    </Box>
                  </Collapse>
                </Box>
              ) : (
                <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: '#fff', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <ChatPanel
                    ref={chatRef}
                    sessionId={session.id}
                    onNewAssistantMsg={triggerRefresh}
                    onGenStatus={setGenStatus}
                    initialPrompt={initialPrompt}
                    initialAttachments={initialAttachments}
                  />
                </Box>
              )
            }
```

> ⚠️ MUI `Collapse` 는 기본적으로 children 을 **언마운트하지 않음**(height 애니메이션만). 따라서 접힌 상태에서도 ChatPanel 이 마운트되어 `initialPrompt` 자동 전송이 정상 동작한다. `mountOnEnter`/`unmountOnExit` 를 절대 추가하지 말 것.

- [ ] **Step 4: 구문 검증**

Run (frontend 디렉토리에서):
```bash
node -e "require('@babel/core').transformFileSync('src/view/util/t3composer/ComposerWorkspace.jsx',{presets:[['@babel/preset-react']],babelrc:false,configFile:false});console.log('SYNTAX_OK')"
```
Expected: `SYNTAX_OK`

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/view/util/t3composer/ComposerWorkspace.jsx
git commit -m "feat(composer): ComposerWorkspace chatCollapsed — 채팅 접기 + 생성 진행/실패 배너"
```

---

## Task 7: 통합 검증 (빌드 + 재기동 + 수동)

**Files:** (없음 — 검증 전용)

- [ ] **Step 1: 백엔드 재컴파일 + DevTools restart**

Run:
```bash
docker compose exec -T composer-backend mvn -q -DskipTests compile
docker compose exec -T composer-backend sh -c 'echo $(date +%s) > /app/target/classes/.devtools-restart-trigger'
```
Expected: compile exit 0. 이후 restart (rules/50 §2).

- [ ] **Step 2: 프런트 webpack 빌드 (전체 모듈 그래프 검증)**

Run: `docker compose exec -T composer-frontend npm run build`
(또는 dev-server 로그로 `compiled` 확인: `docker compose logs --tail=20 composer-frontend`)
Expected: `compiled` 성공, 신규/수정 파일 `Module not found`·구문 오류 0건.

- [ ] **Step 3: 토큰 축소 확인 (백엔드 로그)**

화면 생성 단계까지 진행해 자동 생성을 1회 발생시킨 뒤:
Run: `docker compose logs --tail=80 composer-backend | grep SystemPromptComposer`
Expected: `ruleScope=...` + `totalChars=` 가 이전(~441K) 대비 대폭 감소(예: ~120K~200K chars),
`rules=[41-composer-generation,41a-composer-jsx,...]` 처럼 선별된 코드만 표시.

- [ ] **Step 4: 앱 수동 검증 (브라우저 http://localhost:5173)**

1. 단계별 화면 생성 → ④ 화면 생성 진입 → 상단 **"🪄 화면 생성 중…" 배너** 표시
2. 자동 생성이 **400 토큰 초과 없이 성공** → 산출물 ≥ 1 (좌측 산출물 트리에 파일 등장), 배너 사라짐
3. 좌측 하단 채팅이 **기본 접힘** ("수정 요청 — 펼치기" 헤더) → 클릭 시 입력창 펼쳐짐 → 후속 수정 메시지 전송 동작
4. (실패 유도/관찰 시) 오류 배너 + **[재시도]** 동작
5. 기존 경로 회귀 없음 — History 이어하기 등 `chatCollapsed` 미전달 화면은 채팅 펼친 현행 레이아웃 유지

- [ ] **Step 5: 결과 보고 (코드 변경 없음 — 커밋 불필요)**

수동 검증 1~5 통과 여부 보고. 실패 항목은 해당 Task 로 복귀해 수정.

---

## Self-Review (작성자 체크)

**Spec 커버리지:**
- §3.1 hook 본문 제거 → Task 1 Step 3 (요약만) ✓
- §3.2 rule include-set (core + 조건부 + 제외) → Task 1 Step 2 (CORE/BACKEND/FILTER_RULES) ✓
- §3.3 spec 플래그 + createSession 저장 + 캐싱 → Task 4 Step 2(computeRuleScope) · Task 2(저장) · Task 3(조립) ✓
- §3.4 토큰 로그 → Task 1 Step 3 (log.info rules=[...]) + Task 7 Step 3 ✓
- §4.1 chatCollapsed 채팅 접기 → Task 6 Step 3 ✓
- §4.2 진행/실패 배너 + 재시도 → Task 5(onGenStatus) + Task 6 Step 2 ✓
- §4.3 SHOW_PREVIEW_UI 범위 밖 → 손대지 않음 ✓
- §5 영향 파일 → Task 1~6 파일과 일치 ✓
- §6 리스크 완충(hook 서버 강제·99a/32 core 유지·폴백) → Task 1 Step 2/3 (core 에 99a·32 포함, 선별 빈 결과 시 전체 폴백) ✓
- §8 성공 기준 → Task 7 수동 검증 1~5 ✓

**Placeholder 스캔:** TBD/TODO/"적절히 처리" 없음. 모든 코드 step 에 실제 코드 포함. ✓

**타입 일관성:**
- `ruleScope`(String, 콤마 직렬화) — DTO(Task2) ↔ 엔티티 RULE_SCOPE(Task2) ↔ createSession 빌더(Task3) ↔ api/GenerateStep(Task4) ↔ compose(Task1) 전부 String 일관 ✓
- `compose(targetCd, ruleScope)` 시그니처 — Task1 정의 ↔ Task3 buildStaticSystemPrompt 호출 일치 ✓
- `onGenStatus({phase, message})` — Task5 ChatPanel 발신 ↔ Task6 setGenStatus 수신 ↔ 배너 phase 분기 일치 ✓
- `chatCollapsed` prop — Task4 GenerateStep 전달 ↔ Task6 Workspace 수신 일치 ✓
- include-set rule_code 값(`41-composer-generation` 등) — DB 실측 rule_code 와 1:1 (size 쿼리로 확인된 코드) ✓

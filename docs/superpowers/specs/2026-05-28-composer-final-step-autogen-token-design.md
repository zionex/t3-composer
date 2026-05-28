# 마지막 생성 단계 — 자동 생성 전면화 + 토큰 초과 해결 — 설계

- **날짜**: 2026-05-28
- **영역**: T3Composer Wizard ④ 화면 생성 단계 (frontend `view/util/t3composer/`) + 시스템 프롬프트 조립 (backend `domain/service/`)
- **상태**: 승인됨 (브레인스토밍 완료, 구현 계획 대기)

## 1. 배경 · 문제

4단계 Wizard 의 마지막 ④ 화면 생성 단계(`GenerateStep` → `ComposerWorkspace`)는 진입 시
세션을 만들고 `ChatPanel` 이 `specToInitialPrompt(spec)`(앞 단계의 자연어 의도 + 위저드 선택을
직렬화) 를 **자동 전송**해 화면을 생성한다 — 즉 "앞 입력으로 자동 생성"은 이미 동작한다.

그러나 두 가지 문제:
1. **토큰 초과** — 자동 전송이 Anthropic 400 `prompt is too long: 215,939 tokens > 200,000`
   으로 실패. 원인은 `SystemPromptComposer.compose(targetCd)` 가 매 호출마다 **모든 활성 rule
   16개(~293K자) + 모든 hook 의 bash 스크립트 전문 23개(~149K자)** 를 시스템 프롬프트로
   주입(~135K+ 토큰) 하기 때문. 생성에 무관한 rule(미리보기 인프라 등)·hook 소스까지 전부 보냄.
2. **UI 인지** — 실패 시 산출물이 0이고 화면이 채팅 콘솔처럼 보여, 사용자가 "여기서 또 입력해야
   하나?" 로 오인. 자동 생성 결과(화면/산출물)가 전면에 오지 않음.

실측 (composer-db, use_yn='Y'):

| 구성 | 건수 | chars | 대략 토큰 |
|---|---|---|---|
| Rules 전체 | 16 | 292,951 | ~90K+ |
| Hooks (bash 전문) | 23 | 148,638 | ~45K |

가장 큰 rule: `50-composer-standalone-runtime`(62K) · `20-screen-development`(36K) ·
`41-composer-generation`(24K) · `99a-composer-anti-patterns`(22K) · `21-components`(19K) ·
`41b-composer-java`(19K) · `41d-composer-wizard`(16K) · `41a-composer-jsx`(15K) ·
`99-anti-patterns`(14K) · `40-composer-patterns`(11K) · `41c-composer-widgets`(11K) ·
`30-database-schema`(10K) · `22-filter-bar`(8K) · `31-stored-procedures`(8K) ·
`32-sql-schema-verification`(7K) · `10-ontology-first`(6K).

## 2. 목표

- 화면 생성 시 시스템 프롬프트를 **필요한 rule 만 include** + **hook bash 본문 제거** 로
  ~135K → ~31~48K 토큰으로 축소 → 200K 한도에 메시지+출력 여유 확보, 자동 생성 성공.
- 마지막 단계를 **자동 생성 + 산출물 전면** 으로 재배치, 채팅 입력은 **기본 접힘**,
  수정 필요 시 입력창을 펼쳐 후속 수정.

## 3. 토큰 축소 (Backend)

### 3.1 Hook bash 본문 제거
`SystemPromptComposer.compose()` 의 hook 섹션에서 `h.getScriptContent()`(전체 bash) 를 더 이상
붙이지 않는다. 대신 hook 당 **한 줄 요약** 만 나열:
```
- [PreToolUse/composer-jsx.sh] (matcher: Write|Edit)
- [PreToolUse/sql-schema-whitelist.sh] (matcher: Write|Edit)
...
```
근거: hook 은 서버 PreToolUse 단계에서 **실제로 차단 실행**되므로 LLM 에 bash 소스 전체는
불필요. "이런 검증이 차단된다" 신호만 충분. (~45K 토큰 절감, 거의 무손실)

### 3.2 화면 생성용 rule include-set (필요한 것만)
"전부 넣고 일부 제외"가 아니라 **include-list** 로 전환. 화면 생성 경로에서만 적용
(다른 호출 경로는 기존대로 전체).

**항상 포함 (core — 없으면 생성 산출물이 깨짐)**
- `41-composer-generation` — 생성 계약 (메인)
- `41a-composer-jsx` — JSX 표준 (BaseGrid/store/zAxios)
- `20-screen-development` — 화면 골격·파일 배치·메뉴 등록
- `99a-composer-anti-patterns` — Composer 안티패턴 (hook-block 회피)
- `32-sql-schema-verification` — 테이블/컬럼 환각 방지 가드

**spec 조건부 포함**
- `hasBackend` (백엔드 Entity/Service/SP 산출 필요) → `41b-composer-java` + `30-database-schema` + `31-stored-procedures`
- `hasFilterOrWidgets` (filterBar.items 존재 또는 cascade/popup 사용) → `41c-composer-widgets` + `22-filter-bar`

**항상 제외 (화면 생성 무관·중복)**
- `50-composer-standalone-runtime` (62K, 미리보기 shim 내부 인프라)
- `40-composer-patterns` (11K, PatternPreview 렌더러)
- `10-ontology-first` (6K, 자연어 질의 5-step)
- `41d-composer-wizard` (16K, 9-step 위저드 내부 — 출력물 무관)
- `21-components` (19K, 컴포넌트 인벤토리 — 핵심 API 는 41a/41c 가 커버)
- `99-anti-patterns` (14K, 일반 안티패턴 — ut/ 금지 등 핵심은 41b §5.6.3·20·hook 가 커버)

결과: 시스템 프롬프트 정적 블록 ~135K → **최선 ~31K / 최악 ~48K 토큰**.

### 3.3 spec 플래그 산정 & 캐싱
- 플래그는 frontend(`GenerateStep`)가 spec 에서 산정:
  - `hasBackend` = mode 가 신규 생성 계열(NEW_STEP/NEW_NL/NEW_GENERAL/NEW_FROM_DESIGN) **또는**
    layer dataSource.mode 중 `SP`/`ENTITY` 가 있음. (NEW_FROM_COPY/EXISTING_MODIFY 는 기존
    backend 재사용이라 false 가능 — 단순화를 위해 신규 모드는 true.)
  - `hasFilterOrWidgets` = `spec.filterBar.items.length > 0` **또는** 어떤 layer 든
    `cascade` 객체가 비어있지 않음(키 ≥ 1).
- `createSession` 요청에 `ruleScope: { hasBackend, hasFilterOrWidgets }` 추가 → 세션 row 에 저장.
- `ComposerPromptBuilder.buildStaticSystemPrompt(targetCd, ruleScope)` 가 ruleScope 로 include-set
  결정. 세션 내 continuation 호출은 동일 ruleScope → **동일 정적 블록 → 프롬프트 캐싱 유지**.
- ruleScope 가 없으면(레거시/기타 경로) 안전하게 **전체 rule** 폴백.

### 3.4 가시성
조립 후 시스템 프롬프트의 chars/추정 토큰을 `log.info` 로 남겨 회귀 감지
(예: `system prompt: 184320 chars ≈ ~52K tokens, rules=[41,41a,20,99a,32,41b,30,31]`).

## 4. 마지막 단계 UI (Frontend)

### 4.1 ComposerWorkspace `chatCollapsed` prop
- 신규 prop `chatCollapsed` (기본 `false` — 기존 사용처 무영향). `GenerateStep` 이 `true` 전달.
- `chatCollapsed=true` 일 때:
  - 좌측 하단 `ChatPanel` 영역을 **기본 접힘** 상태로 — "✏️ 수정 요청" 토글 헤더만 표시.
    클릭 시 입력창(ChatPanel) 펼쳐 후속 수정 메시지 입력 가능.
  - 접힘이므로 좌측은 산출물 트리가 주로 차지, 우측(산출물 소스/추후 실행화면)이 전면.
- `chatCollapsed=false` (기존): 현행 레이아웃 그대로.

### 4.2 자동 생성 진행/실패 표시
- 자동 생성(최초 `initialPrompt` 전송)은 기존 `ChatPanel` auto-send 그대로 — 신규 트리거 없음.
- `ChatPanel` 이 생성 상태를 콜백으로 상위에 전달: `onGenStatus({ phase: 'sending'|'done'|'error', message })`.
- `GenerateStep`/`ComposerWorkspace` 가 이를 받아 상단 배너로:
  - `sending` + 산출물 0 → "🪄 화면 생성 중…" 진행 표시(전면).
  - `done` → 배너 숨김, 산출물 전면.
  - `error` → 오류 배너 + [재시도] 버튼(재시도 = initialPrompt 재전송). 토큰 오류 등이 채팅
    로그에 묻히지 않고 전면 노출.

### 4.3 SHOW_PREVIEW_UI 관계
현재 `SHOW_PREVIEW_UI=false` 라 우측은 "산출물 소스" 탭만 노출. 따라서 "보여지는 화면" =
산출물(트리+소스). 라이브 미리보기 재활성화는 **이번 범위 밖**(별도 토글 결정).

## 5. 영향 받는 파일

**Backend**
- `domain/service/SystemPromptComposer.java` — hook 본문 제거(요약화) + `compose(targetCd, ruleScope)` 오버로드(include-set 필터)
- `domain/service/ComposerPromptBuilder.java` — `buildStaticSystemPrompt(targetCd, ruleScope)` 시그니처 + 토큰 로그
- `domain/service/ComposerService.java` (또는 createSession 처리부) — 세션에 ruleScope 저장 + 빌더에 전달
- `domain/dto/CreateSessionRequest.java` — `ruleScope`(hasBackend·hasFilterOrWidgets) 필드 추가
- `ComposerSession` 엔티티 + `docker/db/init-pg/*.sql` — ruleScope 보존용 nullable 컬럼 추가
  (예: `RULE_SCOPE varchar(40)` — `"backend,filter"` 처럼 활성 플래그 직렬화). 멱등 마이그레이션.
  continuation(채팅 후속) 호출은 spec 을 갖지 않으므로 세션에 저장해 매 턴 동일 scope 사용.

**Frontend**
- `view/util/t3composer/GenerateStep.jsx` — spec→ruleScope 산정, `createSession` 에 전달, `chatCollapsed` 전달, 진행/오류 배너
- `view/util/t3composer/ComposerWorkspace.jsx` — `chatCollapsed` prop → ChatPanel 접힘 토글 + 진행/오류 배너 수신
- `view/util/t3composer/ChatPanel.jsx` — `onGenStatus` 콜백(자동 전송 sending/done/error 보고)
- `view/util/t3composer/api.js` — `createSession` 에 `ruleScope` 파라미터 추가

## 6. 리스크 · 완충

- **rule 대폭 축소 → 사소한 규약 누락/hook-block 가능성 ↑.** 완충:
  - (a) hook 은 서버 PreToolUse 로 **여전히 강제** (잘못된 산출물은 저장 단계에서 차단).
  - (b) `99a` 안티패턴 + `32` 스키마 가드는 core 로 유지 → 가장 치명적 실패(테이블 환각·BaseGrid prop·store swap·ut/ 경로) 방어.
  - (c) 기존 `rules/50 §14` AI 자동보완 루프가 apply/런타임 오류를 자동 수정.
  - (d) include-set 은 코드 상수 → 결과 보고 쉽게 튜닝.
- **`50` 제외로 §13.6/13.7 테이블 환각 방지 조항 빠짐** → `32` + 데이터소스 프롬프트 블록 +
  backend `ArtifactApplyService.checkTableNameCollisions` 가 동일 가드 중복 제공.
- **캐싱**: ruleScope 가 세션 내 고정이므로 continuation 캐싱 유지. 세션 간엔 정적 블록이 달라질
  수 있으나(서로 다른 화면) 정상.

## 7. 범위 경계 (YAGNI)

- rule 선택을 per-rule 세분 로직이 아니라 **2개 coarse 플래그**(hasBackend / hasFilterOrWidgets)로만.
- 라이브 미리보기(SHOW_PREVIEW_UI) 재활성화는 범위 밖.
- 세션 엔티티 스키마 변경은 최소화(가능하면 기존 메타 컬럼 재사용; 불가 시 단일 컬럼 추가).
- hook 을 프롬프트에서 완전 제거하지 않고 **한 줄 요약 유지**(차단 신호 보존, 비용 미미).

## 8. 성공 기준

- 화면 생성 단계 진입 → 자동 생성이 **400 토큰 초과 없이 성공**, 산출물 ≥ 1.
- 시스템 프롬프트 로그가 ~50K 토큰 이하(조건부 전체 포함 시).
- 마지막 단계에서 채팅 입력이 기본 접힘, "수정 요청" 펼침 시 후속 수정 동작.
- 자동 생성 실패 시 오류 배너 + 재시도가 전면 노출(채팅 로그에 묻히지 않음).
- 기존 사용처(History 이어하기 등 `chatCollapsed` 미전달)는 현행 동작 유지.

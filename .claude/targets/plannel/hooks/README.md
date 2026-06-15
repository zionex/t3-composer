# PlanNEL Hooks

> T3Composer 가 **PlanNEL target** 으로 산출물을 생성할 때 자동 검증하는 hook 모음.
> 각 hook 은 자체 가드 (`saas-plannel/saas-web/saas-application/...` 경로 매치) 를 가지므로 다른 target (T3Series wingui 등) 작업에는 영향 없음.

## 폴더 구조

```
hooks/
├── README.md                              ← 이 파일
├── _jq-fallback.sh                        jq locator (Windows winget/scoop 등)
├── pre-tool-use-validator.sh              ★ Write/Edit 직전 검증 dispatcher
├── post-tool-use-linter.sh                ★ Write/Edit 직후 lint (i18n / Liquibase 누락 안내)
├── session-start-briefing.sh              세션 시작 시 PlanNEL 컨벤션 요약 주입
├── user-prompt-context-injector.sh        prompt 키워드 → 관련 rule 자동 주입
├── stop-checklist-reminder.sh             세션 종료 시 후속 작업 체크리스트
└── validators/                            PreToolUse 검증 모듈 (8개)
    ├── _lib.sh                            block / warn 헬퍼
    ├── import-convention.sh               jakarta.* / @wingui/* 차단 + restApi 강제
    ├── package-convention.sh              com.zionex.t3series.* 차단 → t3series.saas.*
    ├── url-convention.sh                  /composer, /util 차단 → /api/<plural>
    ├── entity-conventions.sh              @Table TB_* 차단 + BaseEntity / @Convert / @JsonIgnore 누락 warn
    ├── controller-security.sh             @PreAuthorize 누락 + ROLE_ prefix 차단
    ├── aggrid-columns.sh                  RealGrid 키 (headerText / textAlignment / dataType / editor) 차단
    ├── jsx-page.sh                        viewName / withTranslation / DataState.initialize 검증
    └── sql-table-naming.sh                CREATE TABLE TB_* 차단 + audit 컬럼 누락 warn
```

## 동작 방식

### 1. PreToolUse 검증 (block 가능)

`pre-tool-use-validator.sh` 가 stdin 으로 받은 JSON (`tool_name`, `tool_input.file_path`, `tool_input.content`) 을 파싱한 뒤:

1. PlanNEL 영역 가드: 파일 경로가 `*saas-plannel/* | *saas-web/* | *saas-application/* | ...` 매치하지 않으면 즉시 `exit 0` (다른 target 작업 통과)
2. validators/ 안의 8개 모듈을 순차 source
3. 각 모듈 안의 `block "..."` 호출 시 → `exit 2` (Claude 에 에러 메시지 표시 + Tool 실행 중단)
4. `warn "..."` 는 stderr 로 안내만 + 계속 진행

**검증 매트릭스**:

| Validator | 차단 (block) | 경고 (warn) |
|---|---|---|
| `import-convention.sh` | `jakarta.*` Java import / `@wingui/*` JSX import / `<BaseGrid>` / `useViewStore` / `useFieldCascade` / `showMessage` / `setViewInfo` / `zAxios` / `Jwts.parserBuilder()` | 상대경로 import (`../../`) |
| `package-convention.sh` | `package com.zionex.t3series.*` 선언 / import / `web.util.audit.BaseEntity` 경로 | saas-application 의 root package 가 t3series.saas.* 가 아닌 경우 |
| `url-convention.sh` | `@RequestMapping("/composer/...")` / `"/util/..."` / `restApi.X("/composer/...")` | 클래스 레벨에 resource path 포함 |
| `entity-conventions.sh` | `@Table(name="TB_*")` / `SP_UI_*.sql` 파일 생성 | BaseEntity 미상속 / boolean 필드 `@Convert` 누락 / `@ManyToOne` `@JsonIgnore` 누락 / id 의 `@GeneratedValue` 누락 |
| `controller-security.sh` | `hasRole('ROLE_*')` (prefix 포함) / `WebSecurityConfig` 화이트리스트에 비즈니스 endpoint / `log.info(... password ...)` / JWT secret 하드코딩 | `@RestController` 에 `@PreAuthorize` 누락 / DTO 에 password 노출 |
| `aggrid-columns.sh` | `headerText:` / `textAlignment:` / `dataType:'text'` / `editor:{type:..}` / `dataProvider.fillJsonData` / `dataProvider.getAllStateRows` / `afterGridCreate` / `<Pop*>` / `<CommonCodeSelect groupCd=...>` | `useDropdown` / `lookupDisplay` |
| `jsx-page.sh` | (없음 — 모두 warn) | `withTranslation` HOC 누락 / `DataState.initialize` 누락 / `DefaultGridSetting` 누락 / `filterType` 누락 / 한글 라벨 하드코딩 / `viewName` prop 누락 / `react-hook-form` 사용 |
| `sql-table-naming.sh` | `CREATE TABLE TB_*` / 테이블명 대문자 / `public.z_*` 비즈니스 테이블 | 테이블명 z_* prefix 없음 / `BOOLEAN` 컬럼 / `SERIAL`/`BIGSERIAL` ID / audit 6컬럼 누락 |

### 2. PostToolUse 안내 (warn 만)

`post-tool-use-linter.sh` 가 Write/Edit 후 실행:

- saas-web 의 .js 파일에 새로 추가된 `t("KEY")` 가 `translation.ko-kr.js` 에 등록 안 되었으면 안내
- 새 `@Entity` 작성 시 대응 Liquibase changeset 미발견하면 안내
- 새 `@RestController` 작성 시 frontend service 작성 안내 + URL resource 추출

### 3. SessionStart 컨텍스트 주입

`session-start-briefing.sh` 가 세션 시작 시 stdout 으로 PlanNEL 핵심 컨벤션 요약 + 규칙 인덱스 + 표준 원본 파일 경로 + 현재 saas-plannel git branch / 최근 변경 파일을 출력 → Claude 의 system context 에 자동 주입.

### 4. UserPromptSubmit 키워드 매칭

`user-prompt-context-injector.sh` 가 사용자 prompt 안의 키워드 매칭:

| 키워드 | 주입 |
|---|---|
| "마스터 화면", "신규 화면", "AG-Grid" | `20-screen-development.md` + `21-components.md` + `10-overview.md` |
| "controller", "entity", "QueryDSL" | `30-data-access.md` + `40-database-schema.md` + `10-overview.md` |
| "tenant", "멀티테넌트" | `31-multi-tenancy.md` |
| "JWT", "@PreAuthorize", "권한" | `32-security.md` |
| "AI 챗", "시나리오 추천", "Bedrock", "예측" | `50-ai-modules.md` |
| "wingui", "SP_UI_", "TB_AD", "@wingui", "jakarta.persistence", "BaseGrid" | `99-anti-patterns.md` |

(키워드 매칭 전 `plannel | saas-web | saas-application | aggrid | ...` 등 PlanNEL 컨텍스트 키워드 1개 이상 있어야 작동 — 다른 target 작업 시 침묵)

### 5. Stop 체크리스트

`stop-checklist-reminder.sh` 가 세션 종료 시 git status 로 변경 파일 분석:

- 신규 화면 (.js in pages/) → TabMenuList.js entry / i18n 6언어 등록 안내
- 신규 Entity → Liquibase changeset / Repository / Service / Controller / DTO 동행 변경 확인
- 신규 Controller → frontend service 작성 안내 + `@PreAuthorize` 누락 안내

## t3-composer 의 settings.json 등록 방법 (선택)

t3-composer 가 PlanNEL target 으로 산출물을 만들 때 자동 호출되게 하려면 t3-composer 의 메인 `.claude/settings.json` 의 hooks 섹션에 추가:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/pre-tool-use-validator.sh",
            "timeout": 15000
          },
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude-plannel/hooks/pre-tool-use-validator.sh",
            "timeout": 15000
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/post-tool-use-linter.sh",
            "timeout": 30000
          },
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude-plannel/hooks/post-tool-use-linter.sh",
            "timeout": 30000
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/user-prompt-context-injector.sh",
            "timeout": 5000
          },
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude-plannel/hooks/user-prompt-context-injector.sh",
            "timeout": 5000
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/session-start-briefing.sh",
            "timeout": 5000
          },
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude-plannel/hooks/session-start-briefing.sh",
            "timeout": 5000
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/stop-checklist-reminder.sh",
            "timeout": 5000
          },
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude-plannel/hooks/stop-checklist-reminder.sh",
            "timeout": 5000
          }
        ]
      }
    ]
  }
}
```

각 PlanNEL hook 이 자체 가드로 PlanNEL 영역만 처리하므로 T3Series 작업과 충돌 없음.

## exit code

| Code | 의미 |
|---|---|
| 0 | 통과 (warn 도 통과) |
| 2 | 차단 (block — Claude stderr 에 메시지 + Tool 실행 중단) |
| 기타 | 에러 (hook 자체 오류) |

## 디버깅

```bash
# 단일 validator 테스트
echo '{"tool_name":"Write","tool_input":{"file_path":"/tmp/saas-application/Test.java","content":"package com.zionex.t3series.web.test; import jakarta.persistence.Entity;"}}' \
  | ./pre-tool-use-validator.sh
# → exit 2 + ❌ [PlanNEL Rule Violation] Java package 'com.zionex.t3series.*' 사용 금지 ...

# jq 미설치 시
JQ_DISABLE=1 ./pre-tool-use-validator.sh < /dev/null
# → "[plannel pre-validator] jq 미설치 — 검증 스킵" + exit 0
```

## 향후 추가 가능 hook

- `liquibase-validator.sh` — changeset YAML 의 column 정의가 BaseEntity 컬럼 중복 아닌지
- `i18n-coverage.sh` — 6언어 모두 등록 여부 강력 검증
- `tenant-context.sh` — `@Async` 메서드 안 DB 호출 시 `TenantAwareTaskDecorator` 등록 확인
- `mybatis-namespace.sh` — XML mapper 의 namespace 가 Java 인터페이스 fully qualified name 과 일치

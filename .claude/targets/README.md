# `.claude/targets/` — Target 별 Claude assets overlay

> 2026-06 재구조화. 이전엔 `.claude/rules/` 와 `.claude-plannel/rules/` 가 root 에 평탄하게
> 있어서 "T3SERIES 전용" 인지 "공용" 인지 의도가 안 드러났음. 이 폴더 구조가 Target 분리의
> **단일 진실 저장소**.

## 구조

```
.claude/
├── CLAUDE.md                         ← 프로젝트 헌법 (Composer 자체 개발 가이드)
├── rules/                            ← ★ 공용 — 모든 Target 에 적용
│   ├── 20-screen-development.md      (공용 골격)
│   ├── 21-components.md              (wingui-core 컴포넌트 — wingui 계열 Target 공용)
│   ├── 22-filter-bar.md              (FilterBar JSON schema)
│   ├── 40-composer-patterns.md       (Composer 패턴 카탈로그)
│   ├── 41-composer-generation.md     (Composer 생성 계약서)
│   ├── 41a-composer-jsx.md           (JSX 표준)
│   ├── 41b-composer-java.md          (Java 백엔드 표준 — wingui ResponseMessage 기준)
│   ├── 41c-composer-widgets.md       (위젯 · Cascade · Pop*)
│   ├── 41d-composer-wizard.md        (4-Step Wizard)
│   ├── 50-composer-standalone-runtime.md  (Composer 인프라 — Target 무관)
│   ├── 99-anti-patterns.md           (공용 안티패턴)
│   └── 99a-composer-anti-patterns.md
├── hooks/                            ← 공용 hooks (Composer dev + 모든 Target 산출물 검증)
└── targets/
    ├── t3series/
    │   ├── rules/                    ← T3SERIES 전용 overlay
    │   │   ├── 10-ontology-first.md         (T3 온톨로지 테이블 5종)
    │   │   ├── 30-database-schema.md        (MSSQL TB_AD_MENU · TB_AD_LANG_PACK …)
    │   │   ├── 31-stored-procedures.md      (SP_UI_<DOMAIN>_<NO> 정규식 · MSSQL/Oracle 듀얼)
    │   │   └── 32-sql-schema-verification.md (TB_AD_USER · TB_UT_USER_INFO 컬럼 검증)
    │   └── hooks/                    (T3SERIES 전용 hooks — 향후 분리)
    ├── plannel/
    │   ├── rules/                    ← PLANNEL 전용 overlay (13개)
    │   │   ├── 00-output-format-and-conversion.md
    │   │   ├── 10-overview.md
    │   │   ├── 20-screen-development.md   (PLANNEL 식)
    │   │   ├── 21-components.md           (AG-Grid)
    │   │   ├── 30-data-access.md          (PostgreSQL · Liquibase)
    │   │   ├── 31-multi-tenancy.md
    │   │   ├── 32-security.md
    │   │   ├── 40-database-schema.md      (PLANNEL 스키마)
    │   │   ├── 41-composer-generation.md  (PLANNEL 식)
    │   │   ├── 41b-composer-java.md       (t3series.saas.response.ResponseMessage 7-arg)
    │   │   ├── 50-ai-modules.md
    │   │   ├── 99-anti-patterns.md
    │   │   └── 99a-composer-anti-patterns.md
    │   ├── hooks/                    (PLANNEL 전용 hooks — aggrid-columns 등)
    │   └── README.md
    └── lges_nextscm/                 (향후 — 현재는 T3SERIES 메타 복제 상태)
```

## Docker mount

`docker-compose.yml` 의 `composer-backend.volumes`:

```yaml
- ./.claude:/workspace/common-claude:ro
- ${COMPOSER_T3SERIES_CLAUDE_PATH:-./.claude/targets/t3series}:/workspace/t3series-claude:ro
- ${COMPOSER_PLANNEL_CLAUDE_PATH:-./.claude/targets/plannel}:/workspace/plannel-claude:ro
```

부모 source repo (`/c/Project/t3series/.claude` 등) 를 직접 import 하고 싶으면 `.env` 의
`COMPOSER_<TARGET>_CLAUDE_PATH` 환경변수로 마운트 경로 override.

## 2단 import 메커니즘

`ClaudeAssetImportService.importFromClaudeFolders(targetCd, List<root>)` 가
폴더를 순서대로 import:

1. **`/workspace/common-claude`** (공용) — 12개 룰 + 공용 hooks 가 `(targetCd, ruleCode, v1)` 로 들어감
2. **`/workspace/<targetCd>-claude`** (Target overlay) — Target 전용 룰이 들어감.
   같은 `ruleCode` 가 있으면 `rule_version+1` + 이전은 `use_yn='N'` → **overlay 가 공용을 덮어쓰기**.

예: `41b-composer-java.md` 은
- 공용 (`.claude/rules/41b-composer-java.md`) 에 wingui ResponseMessage 기준 표준이 v1
- PLANNEL overlay (`.claude/targets/plannel/rules/41b-composer-java.md`) 에 `t3series.saas.response.ResponseMessage` 기준이 v2
- → PLANNEL 세션에는 PLANNEL 버전이, T3SERIES 세션에는 공용 버전이 prompt 로 들어감

## 호출

```bash
# 기본 — 공용 + Target overlay 자동 2단 import
curl -X POST http://localhost:8090/composer/targets/T3SERIES/import-claude
curl -X POST http://localhost:8090/composer/targets/PLANNEL/import-claude

# 명시적 폴더 리스트
curl -X POST http://localhost:8090/composer/targets/T3SERIES/import-claude \
  -H 'Content-Type: application/json' \
  -d '{"claudeRoots":["/workspace/common-claude","/workspace/t3series-claude"]}'

# 단일 폴더 (legacy)
curl -X POST http://localhost:8090/composer/targets/T3SERIES/import-claude \
  -H 'Content-Type: application/json' \
  -d '{"claudeRoot":"/workspace/t3series-claude"}'
```

## 새 Target 추가 절차

1. `targets/<cd>/{rules,hooks}/` 폴더 생성 + 필요한 룰 작성
2. `docker-compose.yml` 에 마운트 추가:
   ```yaml
   - ${COMPOSER_<CD>_CLAUDE_PATH:-./.claude/targets/<cd>}:/workspace/<cd>-claude:ro
   ```
3. `TargetSystemController.TARGET_CLAUDE_ROOTS` 에 매핑 추가
4. `TB_CMP_TARGET_SYSTEM` 에 row 추가 (docker/db/init-pg/ 에 seed SQL)
5. backend 재기동 → `POST /composer/targets/<CD>/import-claude` 호출

## 공용 vs Target 결정 가이드

| 케이스 | 결정 |
|---|---|
| 모든 Target 의 산출물 검증에 적용되는 룰 (Java import whitelist · jakarta.* · util/ path 등) | `.claude/rules/` 공용 |
| 특정 Target 의 DB 스키마 · 메뉴 형식 · 백엔드 클래스 | `targets/<cd>/rules/` overlay |
| 같은 rule_code 인데 Target 별 표준이 다른 경우 (예: ResponseMessage) | 공용에 가장 흔한 패턴, 다른 Target 은 overlay 로 override |
| Composer 본체 인프라 (preview · shim · 단독 환경) | `.claude/rules/` 공용 (Target 무관) |

## 주의

- ⛔ **git 으로 이 `targets/` 하위 디렉토리 구조가 바뀌면 (checkout·rebase·merge·pull) 반드시
  `docker compose up -d --force-recreate composer-backend` 로 bind-mount 를 재바인딩**할 것.
  macOS Docker 가 옛 inode 를 잡아 컨테이너가 빈 폴더로 인식하는 사고가 있었음 (2026-06-15).
  상세: `CLAUDE.md §2.0`.
- `.claude-project/` 는 UI 템플릿 추출 용도 (현재 마운트/import 안 됨) — **건드리지 말 것**.
- `.claude/` root 의 `CLAUDE.md` · `settings.json` 은 Claude Code CLI 자체 설정 — 옮기지 말 것.

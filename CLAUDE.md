# T3Composer (단독 레포) — Claude 컨텍스트

> 이 레포는 T3Series 의 Composer 모듈을 분리한 단독 워크스페이스입니다.
> 화면 생성 규약은 부모 `t3series` 프로젝트와 **동일한 `.claude/rules/*` 를 자체 보유**합니다 (이관 완료).

## 0. 작업 시 항상 참조할 규칙 (이 레포 내부)

다음 파일들이 권위 있는 단일 진실 저장소입니다 (부모와 동일한 내용 — 이관됨):

| 위치 | 다루는 영역 |
|---|---|
| `./CLAUDE.md` | 골든룰 (이 문서 — 단독 환경 추가 규칙) |
| `./.claude/rules/10-ontology-first.md` | 자연어 질의 5-Step |
| `./.claude/rules/20-screen-development.md` | 화면 골격·라우팅·메뉴 등록 |
| `./.claude/rules/21-components.md` | 공용 컴포넌트 인벤토리 |
| `./.claude/rules/22-filter-bar.md` | FilterBar JSON |
| `./.claude/rules/30-database-schema.md` | DB 접두어 사전 + 핵심 뷰 |
| `./.claude/rules/31-stored-procedures.md` | SP 네이밍 + ORDER BY |
| `./.claude/rules/32-sql-schema-verification.md` | SQL 스키마 사전 검증 |
| `./.claude/rules/40-composer-patterns.md` | 패턴/사전/PatternPreview |
| `./.claude/rules/41-composer-generation.md` | Composer 생성 메인 |
| `./.claude/rules/41a-composer-jsx.md` | JSX 표준 |
| `./.claude/rules/41b-composer-java.md` | Java 백엔드 표준 |
| `./.claude/rules/41c-composer-widgets.md` | 위젯 카탈로그 |
| `./.claude/rules/41d-composer-wizard.md` | 9-Step Wizard |
| `./.claude/rules/99-anti-patterns.md` | 안티패턴 |
| `./.claude/rules/99a-composer-anti-patterns.md` | Composer 안티패턴 카탈로그 |

## 0.1 추가 자료

| 위치 | 내용 |
|---|---|
| `./.claude/schemas/filter-bar.schema.json` | FilterBar JSON Schema (단일 권위) + `examples/` 샘플 |
| `./.claude/hooks/` | PreToolUse / PostToolUse / SessionStart / Stop hook 스크립트 (부모와 동일) |
| `./.claude/settings.json` | Hook 등록 + permission allow/deny + 환경변수 |
| `./docs/reference/` | 대용량 카탈로그 (테이블/뷰/SP/모듈별 상세) — grep 기반 조회 |
| `./docs/ui-patterns/` | UI 패턴 가이드 |

## 1. 이 레포 고유 규칙 (부모 규칙 위에 추가)

### 1.1 패키지 네임스페이스 (단독 ↔ wingui)

| 단독 (composer) | wingui |
|---|---|
| `com.zionex.t3composer.domain.*` | `com.zionex.t3series.web.domain.<module>.<feature>.*` |
| `com.zionex.t3composer.shared.audit.BaseEntity` | `com.zionex.t3series.web.util.audit.BaseEntity` |
| `com.zionex.t3composer.shared.data.ResponseMessage` | `com.zionex.t3series.web.util.data.ResponseMessage` |
| `com.zionex.t3composer.shared.auth.*` | `com.zionex.t3series.web.security.authentication.*` |
| `com.zionex.t3composer.shared.util.*` | `com.zionex.t3series.util.*` |
| `com.zionex.t3composer.shared.constant.ServiceConstants` | `com.zionex.t3series.web.constant.ServiceConstants` |
| `com.zionex.t3composer.config.ApplicationProperties` | `com.zionex.t3series.ApplicationProperties` |

`./sync/sync-files-to-wingui.ps1` 스크립트가 자동 rename 적용.

### 1.2 Docker 환경 가정

- **DB**: composer-db (자체 MSSQL 2022, port 11433, DB 이름 `T3SMARTSCM`)
- **백엔드**: composer-backend (Spring Boot 3.0.13, port 8090)
- **프론트**: composer-frontend (webpack-dev-server, port 5173)

### 1.3 ArtifactApply 모드

`COMPOSER_APPLY_MODE` 환경변수:
- `staging` (기본): `./staging/output/<session_id>/` 에 산출
- `direct`: `COMPOSER_WINGUI_REF_PATH` 폴더에 직접 쓰기

DB 등록(TB_AD_MENU 등)은 두 모드 모두 composer-db 에만 INSERT. wingui DB 적용은 sync 스크립트.

### 1.4 인증

dev 단독이라 SecurityConfig 가 모든 요청 permitAll. `AuthenticationProvider` 가 `composer-dev` 사용자를 mock 반환.

### 1.5 wingui 동기화 (`./sync/`)

**검증 통과 후에만** 실행:
1. `./sync/manifest-from-staging.ps1` — staging 변경분 + composer-db 의 새 SP/Table/INSERT 추출
2. `./sync/sync-files-to-wingui.ps1 [-DryRun]` — 코드 파일 복사 (패키지 rename 적용)
3. `./sync/sync-db-to-wingui.ps1 [-WhatIf]` — wingui DB 에 SQL 적용

상세는 `./sync/README.md`.

### 1.6 .env 와 secrets

**절대 git commit 금지**. `.gitignore` 에 `.env`/`*.key`/`secrets/` 등록됨. ANTHROPIC_API_KEY 와 MSSQL_SA_PASSWORD 는 `.env` 파일에만 보관.

## 2. 일반 작업 시

- 신규 화면 생성·수정 요청은 `.claude/rules/41-composer-generation.md` 그대로 따름
- DB 스키마 변경 시 `.claude/rules/32-sql-schema-verification.md §0 진실 우선순위` 절차 필수
- import 화이트리스트 (`.claude/rules/41b §5.5`) 준수 — `javax.*` 금지, `jakarta.*` 만 사용
- `ut/` 패키지/URL 절대 금지 (`.claude/rules/99-anti-patterns.md §0`)

## 3. 부모 폴더와의 관계 (sync 시점 외)

- 단독 dev 시에는 부모 `t3series` 폴더 의존 없이 동작 가능
- NEW_FROM_COPY 모드만 부모 wingui 의 jsx/java 파일 read-only 마운트 필요 (`COMPOSER_WINGUI_REF_PATH`)
- `.claude/rules/*` 가 부모 변경되면 다음 명령으로 갱신:
  ```bash
  cp -r /c/Project/t3series/.claude/rules/* ./.claude/rules/
  cp -r /c/Project/t3series/.claude/hooks/* ./.claude/hooks/
  cp -r /c/Project/t3series/.claude/schemas/* ./.claude/schemas/
  cp -r /c/Project/t3series/docs/reference/* ./docs/reference/
  ```
  (또는 `git submodule` 형태로 업그레이드 가능)

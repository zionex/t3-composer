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
| `./docs/UI-ANALYSIS-OVERVIEW.md` | Phase 1~4c — 운영 화면 956개 정적 분석 + 54개 mockup + 메뉴 매핑 |
| `./frontend/src/view/util/t3mockup/` | **T3Mockup 갤러리** — 54개 mockup (정규/도메인/Dashboard/ControlBoard/메타). `index.js` 의 `MOCKUP_ENTRIES` 가 단일 진실 저장소 |
| `./frontend/src/view/util/t3mockup/_data/t3smartscm-menu-mapping.json` | 운영 메뉴 263개 ↔ mockup 매핑 (Phase 4b). 검색·연결 lookup 용 |
| `./scripts/` | UI 분석 4종 (`ui-inventory` · `ui-patterns-gen` · `pattern-coverage` · `mockup-menu-mapping`) |
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
- (2026-05-28) `direct` 모드 폐기 — Per-Target source 경로 (`TARGET_<CD>_PATH`) 를 `TargetPathResolver` 가 자동 채택. 명시한 경우 staging fallback 으로 전환.

DB 등록(TB_AD_MENU 등)은 composer-db 에만 INSERT. Target DB 적용은 sync 스크립트.

### 1.4 인증

dev 단독이라 SecurityConfig 가 모든 요청 permitAll. `AuthenticationProvider` 가 `composer-dev` 사용자를 mock 반환.

### 1.5 wingui 동기화 (`./sync/`)

**검증 통과 후에만** 실행:
1. `./sync/manifest-from-staging.ps1` — staging 변경분 + composer-db 의 새 SP/Table/INSERT 추출
2. `./sync/sync-files-to-wingui.ps1 [-DryRun]` — 코드 파일 복사 (패키지 rename 적용)
3. `./sync/sync-db-to-wingui.ps1 [-WhatIf]` — wingui DB 에 SQL 적용

상세는 `./sync/README.md`.

### 1.6 LLM Backend 모드 (2026-06-02 추가)

`.env` 의 `LLM_BACKEND` 환경변수가 모든 LLM 호출 (9개 서비스) 의 백엔드를 결정:

- `api` (기본, 미설정 시): 기존 Anthropic HTTP API. `ANTHROPIC_API_KEY` 필요.
- `cli`: 컨테이너 안 `claude` CLI subprocess. 호스트 `~/.claude` OAuth 로그인 사용.

**CLI 모드 활성화 절차**:
1. 호스트에서 `claude /login` 1회 (개인 또는 회사 구독 계정)
2. `.env`: `LLM_BACKEND=cli`
3. `docker compose up -d --force-recreate composer-backend`
4. 로그에서 `LLM backend = cli (binary=/usr/bin/claude, ~/.claude mounted)` 확인

**전환은 양방향** — 언제든 `.env` 의 한 줄 + 재기동으로 API ↔ CLI 전환 가능.
구독 한도 초과 시 fail-hard (자동 API fallback 없음) — 사용자가 직접 호스트
재로그인 또는 5시간 window 종료 대기.

CLI 모드 전용 옵션:
- `LLM_CLI_BINARY` (기본 `/usr/bin/claude`)
- `LLM_CLI_TIMEOUT_MIN` (기본 40)
- `LLM_CLI_MAX_CONCURRENT` (기본 4, 구독 rate-limit 보호)

상세 설계: `docs/superpowers/specs/2026-06-02-llm-backend-cli-toggle-design.md`.

### 1.7 .env 와 secrets

**절대 git commit 금지**. `.gitignore` 에 `.env`/`*.key`/`secrets/` 등록됨. ANTHROPIC_API_KEY 와 MSSQL_SA_PASSWORD 는 `.env` 파일에만 보관.

## 2. 일반 작업 시

- 신규 화면 생성·수정 요청은 `.claude/rules/41-composer-generation.md` 그대로 따름
- DB 스키마 변경 시 `.claude/rules/32-sql-schema-verification.md §0 진실 우선순위` 절차 필수
- import 화이트리스트 (`.claude/rules/41b §5.5`) 준수 — `javax.*` 금지, `jakarta.*` 만 사용
- `ut/` 패키지/URL 절대 금지 (`.claude/rules/99-anti-patterns.md §0`)
- **단독 dev 환경 인프라** (Docker DevTools / 화면 실행 / RealGrid2 / shim 구조) — `.claude/rules/50-composer-standalone-runtime.md`

## 2.1 단독 환경 핵심 인프라 (2026-05 개편)

> **★ 제1원칙 — Target 런타임 환경 패리티** (`.claude/rules/50 §13.0`): 산출물 화면 실행
> 오류 예방의 근간. Composer 의 생성·미리보기 환경은 선택된 Target(wingui) 의 런타임 표면을
> **미러(superset)** 한다 — shim·registry·ambient·store 를 Target 표면의 상위집합으로 유지.
> 미리보기 런타임 오류는 **개별 오류를 하나씩 패치하지 말고**, 그 오류가 속한 표면 클래스
> (import 컴포넌트 / free variable / npm·MUI 서브모듈 / grid 객체 / store 멤버) **전체를
> 확장**해 클래스 단위로 닫는다. RT 카탈로그(`rules/50 §13.2`)는 증상 기록일 뿐이다.

### Backend hot-reload (Phase 1)
- backend 컨테이너가 `mvn spring-boot:run` 으로 기동 (jar 가 아님)
- host `./backend` 가 컨테이너의 `/app` 에 마운트 → src 변경 즉시 가시
- Maven 캐시는 named volume `composer-maven-repo`
- DevTools 의 `spring.devtools.restart.trigger-file=.devtools-restart-trigger` 활성 — `target/classes/.devtools-restart-trigger` 변경 시에만 self-restart (random class 변경에 자동 restart 안 함 → partial-state NoClassDefFoundError 회피)

### 화면 실행 (Phase 2)
- ComposerWorkspace 헤더 [화면 실행] 버튼 → `POST /composer/sessions/{sid}/preview/apply`
  - JSX → `frontend/src/view/_preview/<sid8>/...` (webpack lazy chunk)
  - Java → `backend/src/main/java/com/zionex/t3composer/preview/s<sid8>/...` (JavaArtifactRewriter 가 wingui 패키지 → t3composer 패키지 자동 변환)
  - SQL DDL/SP → composer-db 에 정식 이름 실행
  - MENU_SQL → composer-db TB_AD_MENU 에 `__PV<sid8>` suffix 로 임시 등록
- mvn compile 은 별도 daemon thread (요청 즉시 응답, 504 회피)
- mvn 완료 시 `target/classes/.devtools-restart-trigger` touch → DevTools 한 번만 restart
- 우측 [실행 화면 LIVE] 탭에 PreviewEmbed 가 `_preview/<sid8>/<viewSub>.jsx` 를 lazy import 해 inline 노출

### RealGrid2 / wingui 룩 (Phase 2c)
- `docker/frontend/entrypoint.sh` 가 컨테이너 시작 시 부모 t3series 의 `realgrid` 폴더를 `/app/node_modules/realgrid` 로 자동 복사
- `frontend/src/shim/wingui/common/BaseGrid.jsx` 가 RealGrid2 GridView + LocalDataProvider 직접 wrap (sky-blue 테마)
- `frontend/src/shim/wingui/common/realgrid-license.js` 가 부모 t3series 와 동일한 `realGrid2Lic` 키 + `RealGrid.setLicenseKey()` 등록
- SearchArea / SearchRow / InputField / CommonCodeSelect 도 wingui 의 wrapBox (좌측 라벨 + 우측 입력) 룩으로 흉내
- SearchArea 우측 끝에 [🔍 조회] 버튼 항상 노출 — click 시점에 `useViewStore.viewData[activeViewId].globalButtons[name=search].action` lookup
- 산출물 호환을 위해 `useViewStore` 에도 `activeViewId: 'composer-standalone'` 노출 (`useContentStore` 와 동일)

### webpack proxy generic
- `frontend/webpack.config.js` 의 proxy 가 `context: () => true` (모든 path) + `bypass` 로 SPA route (Accept: text/html GET) 만 `/index.html` fallback
- 산출물이 만드는 모든 모듈 endpoint (`/util /demandplan /masterplan /system ...`) 사전 등록 없이 자동 backend proxy

### 설계서 mock-up 이미지 (Phase 2d)
- `DesignDocExportService.buildLayoutSheet` 가 "레이아웃" 시트 하단에 화면 mock-up PNG 첨부
- `ScreenMockupRenderer` (Java2D BufferedImage) — 검색조건(라벨박스+입력박스+조회 버튼) + RealGrid2 풍 그리드(헤더+격자 8행) 를 spec 으로부터 자동 그리기
- backend 컨테이너에 `fonts-noto-cjk` + `fontconfig` 설치 + `cjkFont()` 로 한글 표시 가능 폰트 자동 매칭

### 3-Layer 좌측 layout
- 위 (55%): 아티팩트 트리 (`ArtifactTreeView`)
- 아래 (45%): 작업 내역 (`ChatPanel` — collapsed 메시지 목록, 클릭 시 펼침)
- 둘 사이 vertical SplitPane (드래그)
- 우측 (68%): Tab Container (실행 화면 / 아티팩트 소스), 좌우 사이 horizontal SplitPane

### Per-Target 운영 DB 직접 접근 (Phase 3 — 2026-05-11)
- `tb_cmp_target_system` 에 db_url/user/pass/driver_class 컬럼 추가 (`init-pg/23`, `24`)
- `TargetDataSourceRegistry` — target_cd → HikariDataSource on-demand 캐시
- `TargetDbConnectionEnvLoader` — `.env` 의 `TARGET_<CD>_DB_*` 환경변수 startup 시 적용 (T3SERIES 기본 채워짐)
- `PrimaryDataSourceConfig.composerJdbcTemplate` (★ Primary) — composer-db PG 전용 (jsonb UPDATE 우회용 직접 SQL)
- `GET /composer/target/menus?lang=ko&target=T3SERIES` — 활성 Target 의 운영 DB 메뉴 트리 (`source: "target:T3SERIES" | "local"` 응답으로 routing 확인)
- `POST /insight-apicall/screen-metadata/collect-source-for-llm` — JSX + Java(Controller/Service/Repository/Entity) + JPA 추론 SQL 한 번에 수집
- Frontend: `useTargetStore.currentTargetCd` 가 `MenuTreeBrowser` · `ModeNewFromCopy` · `ModeExistingModify` · `collectSourceForLlm()` 까지 자동 전파
- TargetSystemSelector dropdown 우측 [💾 Storage] 버튼 → `TargetDbConnectionDialog` (JDBC URL 입력 + 연결 테스트)

### JPA 추론 SQL & 공용 소스 분석 패널 (Phase 3)
- `JpaMethodSqlMapper` — Repository method-name → SQL 추론 (`@Column(name=...)` 매핑 우선)
  - `findByXxxContaining` / `existsByXxx` / `deleteByXxx` / `@Query("...")` / `findAll/save/deleteById` stock
- `InferredSqlPanel.jsx` — collapsible SQL preview + 클립보드 복사
- `SourceBundleSection.jsx` — `SourceBundleAnalysisPanel` (SP/URL/Entity 칩) + `SourceBundlePreview` (섹션 + Repository 추론 SQL) **NEW_FROM_COPY / EXISTING_MODIFY 공용**
- Step4 DataBinding 의 JPA_ENTITY 모드도 InferredSqlPanel 표시 (`sourceBundle` prop)

### 산출물 호환 인프라 (Phase 3)
- `JavaArtifactRewriter.injectTargetJdbcTemplateQualifier()` — 산출물 Service 의 `private final JdbcTemplate jdbcTemplate;` 에 `@Qualifier("targetJdbcTemplate")` 자동 주입
- `backend/lombok.config` — `lombok.copyableAnnotations += org.springframework.beans.factory.annotation.Qualifier` (Lombok 생성자 파라미터로 qualifier 복사)
- `ResponseMessage.ofSuccess()` / `ofFail(msg)` 별칭 — LLM 환각 패턴 자동 호환
- shim `GridSaveButton` / `GridDeleteRowButton` 이 `getAllStateRows()` 전 `g.commit(true)` 자동 호출 (RealGrid `Client is editing` 오류 회피)
- AI prefill SP 오분류 방어 — Backend prompt + Frontend `mergeAiSpecIntoBaseSpec` 사후 정합화 (`source='SP'` AND SP 필드 빈 + baseUrl/entity 있음 → JPA_ENTITY 강제 전환)

### T3Mockup 갤러리 (Phase 4a/b/c — 2026-05-15)
- **위치**: `frontend/src/view/util/t3mockup/`
- **접근**: 상단 메뉴 바 [SCM UI Mockup] Tab (App.jsx `MENU_ITEMS` 순서: T3Composer · History · **SCM UI Mockup** · UI Pattern · Gallery)
- **`index.js` 의 `MOCKUP_ENTRIES`** — 54개 mockup entry (단일 진실 저장소)
  - 그룹: `T3SMART_SCM_ENTRIES` (54) · `PLANEL_ENTRIES` (placeholder)
  - 자동 부여: `productLine` (T3SmartSCM/PlaNEL) · `menus[]` (운영 메뉴 매핑)
- **카테고리** (5종): `core` (12) · `domain` (13) · `dashboard` (16) · `controlboard` (4) · `meta` (9)
- **운영 메뉴 매핑**: `_data/t3smartscm-menu-mapping.json` — T3SERIES 운영 263개 메뉴 100% 매핑 (78% ui-inventory 분류기 결과 활용)
- **공통 sub**: `_shared/{MockShell,BoardWidgetTile,CbStepper,CbLogPane}.jsx` — 모든 mockup 이 `MockShell` 을 최상위 래퍼로 사용
- **검색·필터**: productLine → category → 검색바 (코드/라벨/설명/메뉴ID/메뉴명/경로) → 카드 클릭 시 mockup 본문 + `[사용 메뉴 N개]` 토글로 매핑 메뉴 테이블 펼침
- **브라우저 뒤로가기 ↔ active state 연동**: `history.pushState` + `popstate` 로 T3Mockup 안에서만 한 단계씩 이동 (Composer 의 다른 Tab/Route 로 빠지지 않음)
- **신규 mockup 추가 절차**:
  1. `frontend/src/view/util/t3mockup/<patternCode>/<File>Mockup.jsx` 작성 (MockShell 사용 필수)
  2. `index.js` 의 `T3SMART_SCM_ENTRIES` 또는 `PLANEL_ENTRIES` 배열에 entry 추가 (lazy import path)
  3. **`layers` 필드 선언** — `dashboard` 카테고리는 **필수**, 그 외는 선택. mockup 의 *구조* (위치·크기) 만 12-col 좌표로 옮긴다 (`{key, title, type:'CHART'|'GRID', subtype, position:{x,y,w,h}}`). **`title` 은 generic 라벨** (`'KPI 1'`/`'위젯 1'` 등) — mockup 의 구체 텍스트 (`'월 매출'`/`'GP 마진'`) 는 가져오지 말 것. Layout step 은 placeholder 만 보여주고, mockup 의 실제 디자인·의도는 `mockupContextText` 로 Claude 가 자연어 참조함. 미선언 시 `layoutCategory` 의 고정 템플릿 폴백 (mockup 실제 구조와 다를 수 있음 — `dash_executive` 참조). `specFromMockup` (wizardState.js) 가 `entry.layers` 우선 사용.
  4. 운영 메뉴 매핑 갱신: `node scripts/mockup-menu-mapping.cjs`
  5. hook 검증: `.claude/hooks/validators/t3mockup.sh` (M1~M5)

### T3MES UI Pattern 카탈로그 (2026-05-15)
- **위치**: `frontend/src/view/util/t3composerpatterns/T3mesPatternCatalog.jsx` · 접근: 상단 메뉴 [UI Pattern] Tab
- **원본 → 분리**: `frontend/public/t3mes/*.html` (T3MES 퍼블리싱 29개) → `scripts/split-t3mes-tabs.cjs` 가 TabPage 단위 분리
  - `frontend/public/t3mes-split/full/` (730개 독립 HTML — iframe 표시) · `lite/` (730개 경량 마크업 — AI 참조용)
  - `_data/t3mes-tabs.json` — 파일별 TabPage 메타. `ALL_ENTRIES` export (picker 재사용)
  - 신규/수정 시: `node scripts/split-t3mes-tabs.cjs` 재실행 (full/lite + json 일괄 재생성)
- **자연어 생성 연동**: `ModeNewGeneral` 선택사항 영역 — `SCM UI Mockup` / `UI Pattern` / `파일 D&D` 중 **1개 단독** 적용
  (`MockupPickerDialog` · `UiPatternPickerDialog` 미리보기 포함 · 하단 전용 D&D 영역)
- 상세: `.claude/rules/50-composer-standalone-runtime.md §12`

## 3. 부모 폴더와의 관계 (sync 시점 외)

- 단독 dev 시에는 부모 `t3series` 폴더 의존 없이 동작 가능
- NEW_FROM_COPY 모드만 Target source repo 의 jsx/java 파일 read-only 마운트 필요 (`TARGET_<CD>_PATH`)
- `.claude/rules/*` 가 부모 변경되면 다음 명령으로 갱신:
  ```bash
  cp -r /c/Project/t3series/.claude/rules/* ./.claude/rules/
  cp -r /c/Project/t3series/.claude/hooks/* ./.claude/hooks/
  cp -r /c/Project/t3series/.claude/schemas/* ./.claude/schemas/
  cp -r /c/Project/t3series/docs/reference/* ./docs/reference/
  ```
  (또는 `git submodule` 형태로 업그레이드 가능)

# 50. T3Composer 단독 환경 런타임 인프라

> 부모 t3series-wingui 와 분리된 t3-composer 의 docker 단독 환경에서 **산출물을 docker 안에서 실제 운영 형태로 검증**하기 위한 인프라 정의. 2026-05 Phase 1~3 통합 결과물.

> **Phase 3 (2026-05-11)** 추가: Per-Target 운영 DB 직접 접근 · 메뉴 트리 실시간 추출 · JPA 추론 SQL 미리보기 · NEW_FROM_COPY / EXISTING_MODIFY 공용 소스 분석 패널.

## 1. 컨테이너 구성

| 서비스 | 이미지 | 핵심 |
|---|---|---|
| `composer-db` | mssql/server:2022 | 자체 MSSQL, T3SMARTSCM, port 11433 |
| `composer-db-init` | mssql/server (one-shot) | `T3COMPOSER_INIT_DONE` 마커로 멱등 init |
| `composer-backend` | eclipse-temurin:17-jdk + maven | **mvn spring-boot:run** (jar 가 아님) — DevTools restart 가능 |
| `composer-frontend` | node:18-bullseye | webpack-dev-server. entrypoint 가 부모 t3series 의 realgrid 자동 복사 |

### Volume mount 핵심

```yaml
composer-backend:
  volumes:
    - ./backend:/app                                                 # src + target hot mount
    - composer-maven-repo:/root/.m2                                  # mvn cache (재기동 빠름)
    - ./staging:/workspace/staging                                   # 정식 apply 산출물
    - ./frontend/src/view/_preview:/workspace/preview/frontend       # JSX preview 출력
    - ${TARGET_T3SERIES_PATH}:/workspace/wingui:ro                   # T3SERIES source (NEW_FROM_COPY 참조)

composer-frontend:
  volumes:
    - ./frontend:/app
    - /app/node_modules                                              # 익명 volume (npm install 결과)
    - ${TARGET_T3SERIES_PATH}:/workspace/wingui:ro                   # entrypoint 가 realgrid 복사
```

## 2. Backend hot-reload (Phase 1)

### Dockerfile
```dockerfile
FROM eclipse-temurin:17-jdk
RUN apt-get install -y maven wget
COPY backend/pom.xml ./pom.xml
RUN mvn dependency:go-offline    # 캐시 워밍
ENTRYPOINT ["sh", "-c", "mvn -B -DskipTests spring-boot:run -Dspring-boot.run.jvmArguments=\"$JAVA_OPTS\""]
```

### DevTools 설정 (application-dev.yaml)

```yaml
spring:
  devtools:
    restart:
      enabled: true
      poll-interval: 2s
      quiet-period: 1s
      # ★ trigger-file — random .class 변경에는 restart 안 함.
      # mvn 완료 후 ArtifactPreviewService 가 명시적 touch 할 때만 restart 발화.
      # 부분 .class 갱신 시점에 restart 가 일어나 NoClassDefFoundError 가 나던 문제 회피.
      trigger-file: .devtools-restart-trigger
    livereload:
      enabled: false
```

`trigger-file` 은 **classpath root** 기준 상대 경로. 컨테이너 안 절대 경로는 `/app/target/classes/.devtools-restart-trigger`. ArtifactPreviewService 가 mvn worker thread 종료 후 그 위치에 timestamp 를 써넣음.

### MVC async timeout

```yaml
spring:
  mvc:
    async:
      request-timeout: 2700000   # 45분 — Anthropic + 화면 실행 + 컴파일 모두 커버
```

기본 30초로는 Anthropic 응답 대기 또는 mvn compile 진행 중 504 발생.

## 3. 화면 실행 (Phase 2 — JSX/SQL/MENU/Java preview)

### 흐름

```
[화면 실행] 클릭 (ComposerWorkspace 헤더)
   ↓
POST /composer/sessions/{sid}/preview/apply
   ↓
ArtifactPreviewService.applyPreview(sid)
   ├─ JSX → /workspace/preview/frontend/<sid8>/<viewSub>.jsx (host: ./frontend/src/view/_preview/...)
   ├─ Java → JavaArtifactRewriter 가 패키지/import 변환 후
   │         /app/src/main/java/com/zionex/t3composer/preview/s<sid8>/<feature>/...
   ├─ SQL_DDL/SQL_SP → ★ Sample 모드(화면 실행 기본)에서는 **실행하지 않고 skip** (§14.4·§17).
   │                    화면은 sample 데이터로 렌더되므로 SP 불필요. SP/DDL 검증·적용은
   │                    [아티팩트 실행](ArtifactApplyService) 단계에서 세션 Target DB 기준으로 수행.
   ├─ MENU_SQL → MENU_CD/LANG_KEY 에 `__PV<sid8>` suffix + MENU_FILE_PATH 에 `/_preview/<sid8>` prefix 변환 후 INSERT
   └─ Java 1건 이상 → mvn compile 별도 daemon thread (waitFor 후 trigger-file touch)
   ↓ (즉시 응답)
응답: { previewLinks:[{url:'/preview/<sid8>/<viewSub>'}], mvn:{async:true, logFile, ...} }
   ↓
ComposerWorkspace 가 health 폴링 (compiling → restarting → ready)
   ↓ (ready)
우측 [실행 화면 LIVE] 탭에 PreviewEmbed 가 lazy import 로 화면 inline 노출
```

### Java 패키지 변환 (`JavaArtifactRewriter`)

| wingui 산출물 | t3composer preview |
|---|---|
| `com.zionex.t3series.web.domain.<module>.<feature>` | `com.zionex.t3composer.preview.s<sid8>.<feature>` |
| `com.zionex.t3series.web.util.audit.BaseEntity` | `com.zionex.t3composer.shared.audit.BaseEntity` |
| `com.zionex.t3series.web.util.data.ResponseMessage` | `com.zionex.t3composer.shared.data.ResponseMessage` |
| `com.zionex.t3series.web.constant.ServiceConstants` | `com.zionex.t3composer.shared.constant.ServiceConstants` |
| `com.zionex.t3series.web.security.authentication.AuthenticationProvider` | `com.zionex.t3composer.shared.auth.AuthenticationProvider` |
| `com.zionex.t3series.util.SecurityUtils` | `com.zionex.t3composer.shared.util.SecurityUtils` |
| 자기 도메인 cross-import (Controller → Service) | 같은 sid8 prefix 로 자동 rewrite |

매핑 안 된 import 는 `unknownImports` 로 응답에 포함 → 컴파일 실패 시 사용자에게 안내.

### confirmPreview / cancelPreview

- **confirm**: 정식 `apply()` 호출 + cancel 호출 (preview 흔적 정리)
- **cancel**: preview 폴더 (frontend src + backend src + target/classes) + composer-db 의 PREVIEW MENU/LANG/PERMISSION row 삭제 + Java 가 있었으면 mvn compile 다시 (preview class 제거된 상태로) → DevTools restart

## 4. RealGrid2 + wingui 룩 (Phase 2c)

### entrypoint.sh (frontend)

```sh
#!/bin/sh
WINGUI_REF="/workspace/wingui"
if [ -d "${WINGUI_REF}/packages/node_modules/realgrid" ] \
   && [ ! -d "/app/node_modules/realgrid" ]; then
  cp -r "${WINGUI_REF}/packages/node_modules/realgrid" "/app/node_modules/realgrid"
fi
exec "$@"
```

### RealGrid2 license

`frontend/src/shim/wingui/common/realgrid-license.js` 가 부모 t3series 의 `realgrid-lic.js` 와 동일한 `LICENSE_KEY` 를 두 가지 방식으로 등록:
1. `window.realGrid2Lic = LICENSE_KEY` — RealGrid2 import 시 자동 검출
2. `RealGrid.setLicenseKey(LICENSE_KEY)` — 명시 호출 (일부 버전 호환)

`BaseGrid.jsx` 가 `realgrid` import 보다 **먼저** license side-effect import.

### shim 컴포넌트 (wingui-core 룩 흉내)

| shim 파일 | 부모 wingui 대응 | 핵심 |
|---|---|---|
| `BaseGrid.jsx` | wingui-core/component/grid/BaseGrid.jsx | RealGrid2 GridView + LocalDataProvider direct wrap. dataProvider.fillJsonData/getAllStateRows/getJsonRow 호환 |
| `imports.js` SearchArea | wingui-core/layout/SearchArea.jsx | border #E0E0E0 + bg #f4f6f8 + 우측 끝에 [🔍 조회] 버튼 자동 노출 (globalButtons.search action 또는 onSearch prop lookup) |
| `imports.js` SearchRow | wingui-core/layout/SearchRow.jsx | flex row + gap 6px |
| `imports.js` InputField | wingui-core/component/input/InputField.jsx | wrapBox (좌측 라벨 78px + 우측 입력 200px, height 32px, border-radius 4px, label fontWeight 600) |
| `view/common/CommonCodeSelect.jsx` | wingui PopCommonCode | wrapBox + Select. ⚠️ **shim 전용 — 산출물 코드에 import 금지** (wingui 본 환경에 없음). 산출물은 `<InputField type="select" options=[...]>` 사용 — rules/21 §3.3 / rules/99a CG-E2 |
| `view/common/PopDepartment.jsx` · `PopPosition.jsx` | (부재 — rules/41c §6.0.3) | stub Dialog (빈 결과 반환) |

### useViewStore.activeViewId (산출물 호환)

산출물 jsx 가 자주 쓰는 잘못된 패턴 `useViewStore(s => s.activeViewId)` (정확히는 `useContentStore` 소속) 도 동작하도록 단독 환경에서는 두 store 모두 `activeViewId: 'composer-standalone'` 노출. 다만 wingui 본 환경에서는 정확한 store 사용 필수 (`.claude/rules/41a §4.6` + `composer-jsx.sh` CG-STORE 차단).

### SearchArea 의 [🔍 조회] 버튼 (단독 환경 자동 노출)

shim `SearchArea` 가 wingui 의 SearchRow 끝 SearchButton 을 모방해 우측 끝에 항상 노출. click 시점에 다음 순서로 lookup:

1. `onSearch` prop (직접 전달된 경우)
2. `useViewStore.getState().viewData[activeViewId].globalButtons[name='search'].action`

둘 다 없으면 `[shim] SearchArea: globalButtons.search 가 등록되지 않았습니다` console.warn (산출물 jsx 의 setViewInfo 누락 진단).

### webpack proxy generic

`frontend/webpack.config.js` 의 proxy 는 `context: () => true` 로 모든 path 를 backend 로 forward. SPA route 만 분리:

```js
proxy: [{
  context: () => true,
  target: apiBase,
  changeOrigin: true,
  bypass: (req) => {
    const accept = req.headers.accept || '';
    if (req.method === 'GET' && accept.includes('text/html')) return '/index.html';
    if (req.url.startsWith('/sockjs-node') || req.url.includes('hot-update')
     || /\.(js|js\.map|css|css\.map)$/.test(req.url)) return req.url;
    return null;  // proxy 진행
  },
}]
```

산출물이 만드는 모든 새 모듈 endpoint (`/util /demandplan /masterplan /sales /inventory /system ...`) 가 사전 등록 없이 자동 backend proxy.

`bypass` 는 `/t3mes/` · `/t3mes-split/` 로 시작하는 요청을 `req.url` 그대로 반환 → SPA fallback / proxy 없이 webpack-dev-server static 으로 서빙 (T3MES UI Pattern 카탈로그 정적 자산).

### webpack devServer.static.watch — 정적 폴더 폴링 비활성 (2026-05-15)

`devServer.static.watch: false` **필수**.

- `public/t3mes-split/` 에 T3MES UI Pattern 분리본 **1460+ HTML** 이 있다. `static.watch` 를
  `{ usePolling: true, interval: 1000 }` 로 두면 dev-server 가 매초 1460+ 파일을 스캔 →
  Node 이벤트 루프 잠식 → webpack-dev-middleware 가 번들(60MB+)을 `200 + Content-Length`
  헤더만 보낸 뒤 본문을 **0바이트로 끊음** → 브라우저 화면 무한 대기 (2026-05-15 사고).
- 정적 카탈로그 HTML 은 라이브 리로드가 불필요하므로 `static: { watch: false }`.
- src 변경 감지는 `watchOptions.poll: 1000` 이 담당 (webpack 모듈 그래프만 폴링 — 가벼움).
- Hook: `build-config.sh` W1 이 `webpack.config.js` 의 `usePolling` 재등장 시 warn.

## 4.5 설계서 mock-up 이미지 (Phase 2d)

`DesignDocExportService.buildLayoutSheet` 가 "레이아웃" 시트 하단에 `6. 화면 미리보기 (Mock-up)` 섹션 + PNG image 첨부.

`ScreenMockupRenderer` (Java2D) 가 spec 으로부터 자동 그림:
- 상단: 화면 제목 (세션 title)
- 검색 영역: SearchArea 박스 (회색 #f4f6f8) + 각 검색조건이 wrapBox (라벨 78px + 입력 170px) + 우측 끝 [🔍 조회] 파란 버튼
- 그리드: 헤더 행 + 격자 8행 (alt 행 stripe)

### 한글 폰트 (Noto CJK)

backend 컨테이너 `Dockerfile`:
```dockerfile
RUN apt-get install -y fonts-noto-core fonts-noto-cjk fontconfig \
    && fc-cache -fv
```

`ScreenMockupRenderer.cjkFont(style, size)` — 후보 폰트 [Noto Sans CJK KR / Noto Sans KR / NanumGothic / Malgun Gothic / AppleGothic / Noto Sans CJK SC/JP/TC / Noto Sans / SANS_SERIF] 중 한글 '가' 표시 가능한 첫 폰트 자동 선택 + 1회 cache.

## 5. AnthropicApiKey 검증 (Phase 0)

`AnthropicApiKeyService.saveApiKey` 에 **80자 미만 거부** 추가 — 사용자가 키 일부만 복사하는 사고 (rules/99 안티패턴 추가 필요) 방지.

`/composer/apikey/diag` endpoint 추가 — 등록된 키의 length / prefix(12자) / suffix(4자) / SHA-256 prefix(8자) 만 반환 (전체 노출 X).

## 6. Per-Target 운영 DB 직접 접근 (Phase 3 — 2026-05-11)

### 6.1 목적
NEW_FROM_COPY / EXISTING_MODIFY 가 부모 운영 wingui DB 의 **실시간** 메뉴 트리 / LangPack / 소스 데이터를 사용하도록 함. composer-db (PG) 는 메타용으로만 유지, target-mssql 로컬 컨테이너는 백업/폴백.

### 6.2 DB 스키마 (`init-pg/23_target_system_db_connection.sql`)
```sql
ALTER TABLE dbo.TB_CMP_TARGET_SYSTEM
    ADD COLUMN IF NOT EXISTS db_url           varchar(500),
    ADD COLUMN IF NOT EXISTS db_username      varchar(100),
    ADD COLUMN IF NOT EXISTS db_password      varchar(500),    -- TODO Jasypt 암호화
    ADD COLUMN IF NOT EXISTS db_driver_class  varchar(200),
    ADD COLUMN IF NOT EXISTS db_connected_at  timestamp,
    ADD COLUMN IF NOT EXISTS db_last_error    text;
```

`init-pg/24_target_seed_db_connection.sql` — T3SERIES 의 기본값(target-mssql 컨테이너) 자동 시드.

### 6.3 빈 구조

| Bean | 역할 |
|---|---|
| `PrimaryDataSourceConfig.dataSource` | composer-db (PG) — JPA EntityManager 가 사용 |
| `PrimaryDataSourceConfig.composerJdbcTemplate` (★ Primary) | composer-db (PG) 전용 JdbcTemplate — 메타 update 용 |
| `TargetDataSourceConfig.targetDataSource` / `targetJdbcTemplate` | target-mssql 컨테이너 (로컬 폴백) |
| `TargetDataSourceRegistry` | target_cd → HikariDataSource on-demand 캐시 (db_url 등록된 Target 만) |

★ JdbcTemplate 을 무지정 인젝션하면 Spring 이 어느 DataSource 를 wire 할지 불확정 → 반드시 `@Qualifier("composerJdbcTemplate")` 또는 `@Qualifier("targetJdbcTemplate")` 명시.

### 6.4 endpoint

| Endpoint | 동작 |
|---|---|
| `PUT  /composer/targets/{cd}/db-connection` | dbUrl/user/pass/driverClass 저장. JPA save() 가 jsonb 컬럼(artifact_naming 등) 충돌 일으키므로 `composerJdbcTemplate.update(...)` 직접 SQL 사용. 저장 후 `registry.invalidate(cd)` 자동 호출 |
| `POST /composer/targets/{cd}/db-connection/test` | DriverManager.getConnection 실시간 시도 + 결과를 db_connected_at / db_last_error 에 기록 |
| `GET  /composer/target/menus?lang=ko&target=T3SERIES` | 활성 Target 의 운영 DB 에서 메뉴 트리 — `source: "target:T3SERIES"` 또는 `"local"` 응답 필드로 routing 결과 확인 |

### 6.5 환경변수 기반 시드 (`TargetDbConnectionEnvLoader`)

`.env` 의 `TARGET_<CD>_DB_*` 환경변수가 채워져 있으면 startup 시 자동 적용:
```bash
TARGET_T3SERIES_DB_URL=jdbc:sqlserver://<host>:1433;database=T3SMARTSCM;encrypt=true;trustServerCertificate=true
TARGET_T3SERIES_DB_USERNAME=sa
TARGET_T3SERIES_DB_PASSWORD=<pass>
TARGET_T3SERIES_DB_DRIVER_CLASS=com.microsoft.sqlserver.jdbc.SQLServerDriver
```

`ApplicationReadyEvent` 핸들러가 위 값을 composer-db 에 UPDATE + 캐시 invalidate. 비어있으면 DB 의 기존 값 유지 (개발자가 UI 로 직접 입력한 값 보호).

### 6.5.1 Target DB 정보 변경 워크플로 (운영 표준)

운영 wingui DB 호스트/계정이 바뀌었을 때 (예: 사내망 IP 변경, 교육용 계정 발급) 다음 순서로 적용:

```
1. .env 편집 — TARGET_<CD>_DB_URL / USERNAME / PASSWORD 3개 라인 수정
   ※ SSL 옵션 'encrypt=true;trustServerCertificate=true' 누락 시 MSSQL JDBC 12+ 가 연결 거부
   ※ .env 는 .gitignore 됨 — commit 금지
   ↓
2. composer-backend 컨테이너 재기동
   docker compose up -d --force-recreate composer-backend
   ↓
3. TargetDbConnectionEnvLoader 가 startup 시 자동:
   - .env 값을 composer-db.tb_cmp_target_system 의 해당 행에 UPDATE
   - TargetDataSourceRegistry.invalidate(cd) → HikariDataSource 캐시 폐기
   - 로그: "Target T3SERIES db_url 환경변수 적용: jdbc:sqlserver://..."
   ↓
4. 연결 검증
   curl -X POST http://localhost:8090/composer/targets/T3SERIES/db-connection/test
   → {"success":true,"databaseProduct":"Microsoft SQL Server","databaseVersion":"...","elapsedMs":...}
   ↓
5. NEW_FROM_COPY / EXISTING_MODIFY 가 이제 새 운영 DB 로 라우팅됨
```

**UI 대체 경로**: 일회성 변경이면 TargetSystemSelector dropdown 의 `[💾 Storage]` 버튼 → `TargetDbConnectionDialog` 에서 URL/계정 입력 + [연결 테스트]. 입력값은 composer-db 에 영구 저장되어 `docker compose down/up` 후에도 유지됨. 단 `.env` 의 `TARGET_<CD>_DB_*` 가 채워져 있으면 매 startup 마다 그 값으로 덮어쓰므로, 영구 변경은 **반드시 `.env` + 재기동** 경로 사용.

**Anti-patterns**:
- ❌ `.env` 만 수정하고 backend 재기동 안 함 → 메모리 상태 그대로라 변경 미반영
- ❌ DB 직접 UPDATE 후 registry invalidate API 호출 누락 → HikariDataSource 캐시가 옛 connection pool 유지
- ❌ SSL 옵션 누락 (`jdbc:sqlserver://host:port;database=X` 만) → MSSQL JDBC 12+ 의 encrypt 기본값 때문에 연결 실패. 기존 endpoint 의 옵션 패턴 그대로 복사 권장

### 6.6 Frontend 라우팅
- `useTargetStore` 가 currentTargetCd 보유 (localStorage 영속)
- `MenuTreeBrowser` 가 prop 으로 받아 `loadTargetMenuTree(lang, targetCd)` 호출
- `collectSourceForLlm(menuCd, targetCd)` 가 `{targetCd}` 를 body 에 추가 → backend 가 active target DB 사용
- `TargetSystemSelector` 의 dropdown 옆 [💾 Storage] 아이콘 → `TargetDbConnectionDialog`

## 7. 원본 소스 수집 & JPA 추론 SQL (Phase 3)

### 7.1 InsightSourceController (`/insight-apicall/screen-metadata/collect-source-for-llm`)

부모 wingui mount 에서 JSX + Java + Repository 메타 한 번에 수집:

```
menuCd 입력
  ↓ TB_AD_MENU.MENU_FILE_PATH lookup (active target DB)
  ↓ /workspace/wingui/packages/wingui/src/view/<lower>/<File>.jsx → screen.source
  ↓ JSX 의 zAxios URL / callService ID / SP_UI_* 패턴 추출
  ↓ /workspace/wingui/src/main/java/.../*.java 에서 @RequestMapping 매칭 Controller 찾기
  ↓ 같은 디렉토리 peer (Service/Repository/Entity) 동봉
  ↓ ★ 각 Repository 에 대해 JpaMethodSqlMapper 호출 → queryMethods 첨부
  ↓ response = { screen, backend: {controllers, services, repositories[queryMethods], entities[className]}, apiCalls, ... }
```

### 7.2 JpaMethodSqlMapper (`domain/service/JpaMethodSqlMapper.java`)

JPA finder 규약 → SQL 추론 (Hibernate 가 런타임에 발생시킬 쿼리 미리보기):

| 메서드 패턴 | 추론 SQL 예 |
|---|---|
| `findBy<Property>` | `SELECT <cols> FROM <table> WHERE <COL> = ?` |
| `findBy<P>Containing` | `... WHERE <COL> LIKE %?%` |
| `findBy<A>And<B>` | `... WHERE <A> = ? AND <B> = ?` |
| `existsBy<P>` | `SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM ...` |
| `deleteBy<P>` | `DELETE FROM <table> WHERE <COL> = ?` |
| `@Query("...")` | 어노테이션 값 그대로 추출 (JPQL/native 구분) |
| Stock (`findAll/findById/save/deleteById`) | 자동 추가 — INSERT/UPDATE 두 케이스 |

핵심: **Entity 의 `@Column(name="...")` 매핑 우선** — fieldName camelCase → 실제 컬럼명 (예: `displayName` → `DISPLAY_NAME`). 매핑 없으면 PascalCase → SNAKE_CASE 폴백.

### 7.3 InsightSourceController 의 entity 분류
- `addPeerJavaFiles` 가 sort key 로 dir-name 매칭 우선 (예: `/user/` 폴더의 `User.java` 가 entities 첫 element)
- `looksLikeNonEntity()` — `Deserializer/Serializer/Util/Helper/Config/Constants/Builder/Mapper/Converter.java` 제외
- 각 java entry 에 `className` 필드 (파일명에서 `.java` 제거) — frontend `entityClassNames[0]` 가 `User.java` 대신 `User` 로 인식

### 7.4 Frontend UI — 공용 패널

| 파일 | 역할 |
|---|---|
| `InferredSqlPanel.jsx` | queryMethods 배열 → collapsible SQL preview (monospace + 복사 버튼). `compact` mode 지원 |
| `SourceBundleSection.jsx` | `SourceBundleAnalysisPanel` (SP/URL/Entity 칩) + `SourceBundlePreview` (섹션별 파일 + Repository 추론 SQL 펼침) |
| `ModeNewFromCopy` / `ModeExistingModify` | 위 두 컴포넌트 공유 (이전엔 중복 정의) |
| `Step4DataBinding` | source='JPA_ENTITY' 일 때 `InferredSqlPanel` 표시 (sourceBundle prop 받음) |

`SourceBundlePreview` 는 응답 구조 차이 자동 해결: `bundle.<key>` (legacy wingui) 또는 `bundle.backend.<key>` (t3-composer).

## 8. JdbcTemplate qualifier 자동 주입 (산출물 호환)

### 8.1 JavaArtifactRewriter 보강
산출물 Service 가 `private final JdbcTemplate jdbcTemplate;` 만 선언하면 Spring 이 PG primary 를 인젝션 → MSSQL SP 호출 시 `'now' is not a recognized built-in function name` 등 오류.

`JavaArtifactRewriter.injectTargetJdbcTemplateQualifier()` 가 자동으로:
```java
@Qualifier("targetJdbcTemplate")
private final JdbcTemplate jdbcTemplate;
```
로 변환. `org.springframework.beans.factory.annotation.Qualifier` import 도 자동 추가.

### 8.2 Lombok `@RequiredArgsConstructor` 호환
필드의 `@Qualifier` 가 자동 생성된 생성자 파라미터로 복사되려면 `backend/lombok.config` 필요:
```
config.stopBubbling = true
lombok.copyableAnnotations += org.springframework.beans.factory.annotation.Qualifier
```
이 설정 없이는 생성자 파라미터가 `JdbcTemplate jdbcTemplate` 으로만 생성돼 qualifier 무효화됨.

### 8.3 ResponseMessage 호환 별칭 — ⚠️ 안전망일 뿐, 산출물 표준 아님

단독 환경 `ResponseMessage.java` 에는 `ok()` / `ok(String)` / `error(String)` / `of(HttpStatus[, String])`
+ `ofSuccess()` / `ofFail(String)` 정적 팩토리 별칭이 있다 — **[화면 실행] 미리보기 호환 안전망**:
```java
public static ResponseMessage ofSuccess()         { return ok(); }
public static ResponseMessage ofSuccess(String m) { return ok(m); }
public static ResponseMessage ofFail(String m)    { return error(m); }
```

❌ **그러나 산출물 표준은 이게 아니다.** wingui 본 환경 `ResponseMessage.java` 는
`(int status, String message)` **생성자 하나**만 가지며 정적 팩토리·builder 모두 없다.
LLM 산출물이 정적 팩토리를 쓰면 [화면 실행]은 동작해도 **wingui sync 후 컴파일 실패** →
전체 startup down → 모든 endpoint 500.

✅ **산출물 표준** (rules/41b §5.7 · 99 J8 · 99a §J CG-J3):
```java
new ResponseMessage(HttpStatus.OK.value(), "saved")
new ResponseMessage(HttpStatus.BAD_REQUEST.value(), "changes parameter is missing")
new ResponseMessage(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage())
```

Hook (`java-basic.sh §J11`) 이 산출물의 `ResponseMessage.{ok|error|of|ofSuccess|ofFail}(` 호출을
Write 시점에 차단. 단독 환경의 별칭은 **legacy 산출물 호환 + 미리보기 graceful-degradation**
목적으로만 유지.

### 8.4 RealGrid2 `getAllStateRows()` 전 `commit()` 호출
shim `GridSaveButton` / `GridDeleteRowButton` 이 호출 시점에 셀 편집 중이면 RealGrid 가 `Client is editing (call grid.commit() or grid.cancel() first)` 오류 throw. 핸들러 진입 직후 `g.commit(true)` 호출로 자동 flush.

## 9. AI prefill SP 오분류 방어

### 9.1 Backend prompt 강화 (`PrefillFromSourceService`)
- 규칙 4: `SP_UI_*` / `SRV_GET_SP_UI_*` / `callService(` / `JdbcTemplate.update(` / `@Query(nativeQuery=true)` / `EXEC ` 패턴이 **실제 코드에 등장할 때만** source='SP'
- 규칙 5: Java 에 SP 단어가 0건이면 100% JPA_ENTITY
- SP 필드 모두 빈 source='SP' 응답 절대 금지

### 9.2 Frontend 사후 정합화 (`mergeAiSpecIntoBaseSpec`)
merge 직후 step4 의 모든 area 를 재검사:
- `source==='SP'` AND `spName`/`crudSp`/`allSpNames`/`serviceIds` 모두 비어있음 AND `baseUrl` 또는 `entity` 존재 시
- → `source='JPA_ENTITY'` 로 강제 전환 + 빈 SP 필드 모두 제거

## 10. 운영 가이드

### 사용자 흐름
1. Composer 메인 → 자연어/설계서/복사 모드로 화면 생성
2. 헤더 [화면 실행] → 우측 Tab 의 [실행 화면 LIVE] 에 inline 노출 → 검증
3. 검증 OK → [메뉴 등록] (TB_AD_MENU INSERT) + [아티팩트 실행] (정식 staging output)
4. wingui sync (./sync/manifest-from-staging → sync-files-to-wingui → sync-db-to-wingui)

### 개발자 가이드
- backend 코드 변경 시 컨테이너 안에서 `mvn -B -DskipTests compile` → DevTools restart (단 trigger-file 은 명시 touch 해야 — `echo $(date +%s) > /app/target/classes/.devtools-restart-trigger`)
- frontend 코드 변경 시 webpack polling 자동 hot-reload (1초)
- 큰 의존성 변경 시 `docker compose down composer-backend && docker compose up -d composer-backend` (down + up)

### 소스 동기화(git pull/rebase) 후 절차 — 필수 점검 (2026-05-15)
git 동기화로 backend 코드가 바뀌면 다음 항목이 컨테이너에 자동 반영되지 **않으므로** 수동 조치:

1. **신규 npm 의존성** — `package.json` 에 새 의존성이 들어오면 컨테이너 `node_modules` 에 없다.
   `docker compose exec -T composer-frontend npm install --legacy-peer-deps` → frontend 재시작.
   (예: `@babel/standalone` 누락 → `Module not found` 컴파일 에러)
2. **신규 DB 마이그레이션** — Phase 분리 구조 (2026-06-18 — `composer-db-init` 재설계):
   - **Phase 1 baseline** (`docker/db/init-pg/00-99_*.sql`) — 멱등 마커 `t3composer_init_done` 로 보호.
     기존 볼륨엔 **자동 적용 안 됨** (`DROP TABLE`, PK rename 등 파괴적 SQL 포함). 새 baseline 파일은
     주로 fresh install 용. 기존 볼륨에 적용해야 하면 수동 psql.
   - **Phase 2 always/** (`docker/db/init-pg/always/*.sql`) — **마커 무관, 매 docker compose up 마다
     실행**. 멱등 ALTER/시드만 (DROP/rename 금지 — `always/README.md`). 새 컬럼·인덱스·시드 추가는
     여기에 두면 신규 install · 기존 볼륨 양쪽에서 자동 흡수.
   - 결론: 새 컬럼이 필요하면 `always/<NN>_<name>.sql` 추가만 하면 끝. 기존 사고 패턴 (마이그레이션
     수동 적용) 은 새 파일을 `always/` 에 두는 한 발생하지 않음.
3. **backend 재컴파일** — `mvn` 재컴파일 + DevTools restart 확인.

## 11. Anti-patterns (단독 환경 한정)

| ❌ | ✅ |
|---|---|
| 컨테이너 안 backend 가 자기 자신을 mvn 에서 동기 호출 | 별도 daemon thread + trigger-file 로 비동기 |
| `target/classes` 안 .class 파일을 watch 해 자동 restart | trigger-file 만 watch (random class 변경 무시) |
| 부모 wingui-core 통째 webpack alias 매핑 | shim 으로 핵심만 (BaseGrid + layout) — 의존성 도미노 회피 |
| RealGrid2 license 누락 → 콘솔 에러 | `window.realGrid2Lic` + `setLicenseKey()` 양쪽 등록 |
| 산출물 java 의 wingui 패키지를 그대로 컴파일 시도 | JavaArtifactRewriter 의 자동 패키지/import 변환 |
| MENU_CD 충돌 무시하고 정식 INSERT | preview 는 `__PV<sid8>` suffix 로 격리 INSERT |
| 산출물 Service 가 `private final JdbcTemplate jdbcTemplate;` (qualifier 없음) | JavaArtifactRewriter 자동으로 `@Qualifier("targetJdbcTemplate")` 주입 — Lombok config 의 `copyableAnnotations += @Qualifier` 필요 |
| `ResponseMessage.builder().message(...).build()` (Lombok @Builder 없음) · `ResponseMessage.ok()` / `error()` / `of()` / `ofSuccess()` / `ofFail()` 호출 (wingui 본 환경엔 정적 팩토리 없음 — sync 후 컴파일 실패) | `new ResponseMessage(HttpStatus.OK.value(), "saved")` · `new ResponseMessage(HttpStatus.BAD_REQUEST.value(), msg)` · `new ResponseMessage(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage())` — 직접 생성자 (Hook `java-basic.sh §J11` 차단) |
| `g.dataProvider.getAllStateRows()` 직전 commit 없음 → `Client is editing` 오류 | shim `GridSaveButton` / `GridDeleteRowButton` 진입 시 `g.commit(true)` 자동 호출 |
| target=T3SERIES 로 메뉴 조회했는데 응답이 `source: "local"` | tb_cmp_target_system 의 db_url 미설정 또는 연결 실패 — [Storage 다이얼로그 → 연결 테스트] 확인 |
| `JdbcTemplate` 무지정 인젝션 — Spring 이 어느 DataSource wire 할지 불확정 | `@Qualifier("composerJdbcTemplate")` (메타) 또는 `@Qualifier("targetJdbcTemplate")` (운영) 명시 |
| AI prefill 이 `source: "SP"` 라고 했지만 spName/crudSp 모두 비어있음 | `mergeAiSpecIntoBaseSpec` 사후 정합화 — baseUrl/entity 있으면 자동 JPA_ENTITY 전환 |
| `ModeNewFromCopy` / `ModeExistingModify` 각자 local `SourceBundlePreview` 정의 | `SourceBundleSection.jsx` 공용 컴포넌트 import |
| `.env` 의 `TARGET_<CD>_DB_*` 수정만 하고 backend 재기동 안 함 | `docker compose up -d --force-recreate composer-backend` 로 `TargetDbConnectionEnvLoader` 발화 (§6.5.1) |
| JDBC URL 에 SSL 옵션 `encrypt=true;trustServerCertificate=true` 누락 | MSSQL JDBC 12+ 의 default encrypt=true 때문에 연결 거부. 기존 endpoint 의 옵션 패턴 그대로 복사 |
| `composer-db` 의 `tb_cmp_target_system` 을 직접 UPDATE 하고 registry invalidate API 미호출 | `PUT /composer/targets/{cd}/db-connection` 사용 (저장 + invalidate 자동) 또는 backend 재기동 |
| webpack `devServer.static.watch` 를 `{ usePolling:true }` 로 둠 → public/t3mes-split 1460+ 파일 폴링 → 번들 0바이트 전송 끊김 | `static: { watch: false }` (src 변경은 watchOptions.poll 담당) — Hook `build-config.sh` W1 |
| 새 컬럼/시드 마이그레이션을 `docker/db/init-pg/<NN>_*.sql` 에 baseline 으로 추가 → 기존 볼륨 (마커 보유) 에 영원히 미적용 → `column "..." does not exist` | `docker/db/init-pg/always/<NN>_<name>.sql` 에 멱등 ALTER 로 추가 — Phase 2 가 매 up 마다 자동 적용. `always/README.md` 규약 (DROP/rename 금지 · `IF NOT EXISTS` · `ON CONFLICT`) §10 |
| 동기화 후 `package.json` 신규 의존성을 컨테이너에 미설치 → `Module not found` | `npm install --legacy-peer-deps` 후 frontend 재시작 §10 |
| 자동보완 카운터를 자동 재실행 경로에서도 리셋 → 오류 무한루프 | 카운터는 수동 [화면 실행] 시에만 리셋 · MAX_AUTOFIX(1) 상한 + 동일오류 중단 §14.2 |
| `handlePreview` 의 'ready' 자동닫기 setTimeout 이 'autofixing' 토스트를 무조건 제거 | 함수형 업데이트로 `phase==='ready'` 일 때만 닫기 §14.3 |
| flex column 자식이 스크롤돼야 하는데 조상 Box 에 `minHeight:0` 누락 → 스크롤 미발생·콘텐츠 잘림 | 스크롤 자식까지 이어지는 모든 flex 조상에 `minHeight:0` §14.5 |
| 다크 그라데이션 헤더/히어로 (`#0f172a`·`linear-gradient(#1e3a8a…)`) | theme.js 파스텔 글래스 — 반투명 그라데이션 + backdrop-blur + 흰 반투명 보더 §14.6 |
| 미리보기를 고정 scale 로 축소 → 패널보다 좁아 검은 여백 | ResizeObserver 로 패널 폭 측정 → 동적 배율 (`패널폭/원본폭`) §14.6 |
| Target source/database 경로 해석이 디렉토리 존재만 검사 → 빈 `./empty` placeholder 슬롯을 채택 → 실제 소스로 fallback 실패 (EXISTING_MODIFY "JSX 파일을 부모 wingui 마운트에서 찾을 수 없음") | `TargetPathResolver` 가 구조 마커(`packages/wingui/src` · `mssql`)까지 확인해 빈 슬롯 배제 — `looksLikeSourceRoot`/`looksLikeDatabaseRoot` (2026-05-18) |
| `docker/db/init-pg/08_composer_dictionary.sql` 에 KPI 일부 batch 만 포팅 → KPI 갤러리 56개만 노출 (정상 152개) | init-pg seed 는 S&OP 40 + SCM 기반 56 + SCM 확장 56 = 152 전체 포함. 기존 DB 볼륨은 §10 절차로 누락분 수동 적용 (2026-05-18) |
| T3MES split 파일명에 URL 이스케이프 문자 `%`·`#` 잔존 → iframe src 로딩 깨짐 (`10_%_비율_보정.html` 의 `%_비` 오해석 → 404) | `split-t3mes-tabs.cjs` 의 `sanitizeLabel` 이 `%`·`#` 를 공백 치환 후 underscore 정리 (OS 금지문자 + URL 위험문자) (2026-05-18) |

## 12. T3MES UI Pattern 카탈로그 + 자연어 생성 참조 picker (2026-05-15)

### 12.1 T3MES UI Pattern 카탈로그 ([UI Pattern] 메뉴)
- 원본: `frontend/public/t3mes/*.html` (T3MES 퍼블리싱 산출물 29개) — 파일당 다수 TabPage.
- 생성기: `scripts/split-t3mes-tabs.cjs` — 각 HTML 의 TabPage 를 물리적으로 분리:
  - `frontend/public/t3mes-split/full/<stem>/<NN>_<label>.html` — 독립 실행 HTML (iframe 표시용, 730개)
  - `frontend/public/t3mes-split/lite/<stem>/<NN>_<label>.html` — 경량 마크업 조각 (AI 참조용, 730개)
  - `frontend/src/view/util/t3composerpatterns/_data/t3mes-tabs.json` — 파일별 TabPage 메타
- 화면: `frontend/src/view/util/t3composerpatterns/T3mesPatternCatalog.jsx` — Section(SCM/MES)→Group→File→TabPage 트리.
  TabPage 클릭 → iframe 으로 `full` HTML 로드. `ALL_ENTRIES` export (picker 재사용).
- 분리본 full HTML 은 `</body>` 직전에 auto-activate 부트스트랩 주입 — 해당 TabPage 패널만 활성화.
  ★ 원본 `switchTab(i, btnEl)` 가 `btnEl.classList` 를 쓰므로, 부트스트랩은 실제 `.tab-btn[i]` 요소를 넘기고
  실패 시 `.panel`/`.tab-btn` active 클래스를 직접 토글하는 fallback 을 포함한다 (btnEl=null TypeError 회피).
  `switchTab(N,null)` 단독 호출은 항상 0번 패널만 표시되는 버그 — 금지.

### 12.2 자연어 신규 생성 — 참조 선택 + D&D (ModeNewGeneral)
자연어(NEW_NL) 입력 화면의 "선택사항" 영역:

| 기능 | POPUP | Claude 전달 | 배타성 |
|---|---|---|---|
| SCM UI Mockup 선택 | `MockupPickerDialog` (좌 목록 + 우 컴포넌트 미리보기) | mockup 메타·레이아웃 카테고리 | Mockup ↔ UI Pattern 상호 배타 |
| UI Pattern 선택 | `UiPatternPickerDialog` (좌 목록 + 우 iframe 미리보기) | 선택 패턴의 lite HTML 마크업 인라인 | Mockup ↔ UI Pattern 상호 배타 |
| 참조 파일 첨부 | 하단 전용 D&D 영역 (drop / 클릭 파일탐색) | 텍스트=prompt inline · binary=attachments | 독립 (병행 가능) |
| **Data Source 선택** | `DataSourcePickerDialog` 3탭 (DB Entity·Ontology·Query Inline — §15) | `=== 데이터 소스 ===` 블록 (실제 컬럼/SP/쿼리) | **독립 · 다중 선택** |

- Mockup ↔ UI Pattern 만 상호 배타 (하나 선택 시 다른 하나 자동 해제). 파일 첨부·Data Source 는 독립 — 함께 사용 가능.
- KPI/Chart 사전 선택 트리거는 선택한 Mockup/UI Pattern 이 Chart·Dashboard·Monitoring 류일 때만 노출.
- 미리보기: Mockup 은 lazy 컴포넌트를 가상화면(1400×900) scale 렌더, UI Pattern 은 `srcUrl` iframe.

## 13. 산출물 화면 실행 오류 재발 방지 — Target 환경 패리티 (2026-05-16)

> 화면 생성 후 [화면 실행] 시 반복 발생하는 런타임 오류를 **구조적으로 차단**한다.
> 핵심 원리: 단독 환경에서 산출물은 부모 wingui-core 가 아니라 **shim 으로 동작**하므로,
> Composer 환경이 **선택된 Target(wingui) 의 런타임 표면을 미러(superset)** 해야 한다.
> 개별 오류를 하나씩 패치하는 게 아니라 **환경 패리티**로 오류 클래스 전체를 닫는다 (§13.0).

### 13.0 ★★ 제1원칙 — Target 런타임 환경 패리티 (오류 예방의 근간)

> **2026-05-16 사용자 지침**: "오류가 발생할 때마다 하나씩 대응하면 끝이 없다. Target System
> 을 선택하면 Target 기준의 환경을 동일하게 세팅해서 동일한 오류가 반복되지 않도록 하는 것이
> 핵심이다." → Rule 을 이 기준으로 재정리.

**원칙**: Composer 의 생성·미리보기 환경은 선택된 **Target(wingui) 의 런타임 표면을
미러(mirror)** 한다. 산출물(신규생성·기존화면복사·기존화면수정 **모두**)은 Target 의 운영
화면과 동일한 코드 표면 — 동일 컴포넌트·스토어·그리드 API·전역 헬퍼·모듈 — 위에서 동작해야
한다. Target 화면이 동작하면 그 산출물(또는 복사본)도 동작해야 정상이다.

**오류 = 환경 불일치**: 미리보기 격리 mini-runtime 이 Target 런타임의 *부분집합*만 재현하면,
그 gap 을 건드리는 산출물이 크래시한다. 그래서 —

- **1차 전략 = 패리티 (환경 표면 확장)**. shim·registry·ambient·store 가 항상 Target
  표면의 **superset** 이 되도록 유지한다. 오류 한 건이 나면 그것이 속한 *표면 클래스 전체*를
  닫는다 — 같은 클래스의 다음 오류가 안 나오도록.
- **RT 카탈로그(§13.2)는 "증상 기록"이지 해법 목록이 아니다**. 오류 메시지 → 그것이 속한
  표면 클래스 식별 → 그 클래스의 패리티 메커니즘을 확장. **한 오류만 패치하고 끝내지 않는다.**
- graceful-degradation fallback (`SAFE_STUB`·no-op stub)은 **안전망**이지 정답이 아니다 —
  크래시는 막지만 동작이 inert 라 미리보기 정확도가 떨어진다. 자주 쓰이는 표면은 실제 구현으로
  패리티를 맞춘다.

**산출물이 Target 런타임에서 건드리는 5개 표면 × 패리티 메커니즘** (이 표가 §13 의 척추):

| # | 표면 | Target(wingui) 원본 | Composer 패리티 메커니즘 | 절 |
|---|---|---|---|---|
| 1 | import 컴포넌트/훅 | `@wingui/common/imports` | shim = 프롬프트 광고목록과 동기된 superset | §13.1 |
| 2 | import 누락 free variable | 번들/부트스트랩 전역 (`useIconStyles`·`transLangKey`·`$`…) | `with(__ambient__)` ambient scope | §13.8 |
| 3 | npm/MUI 서브모듈 | 전체 node_modules (`@mui/material/styles`…) | REGISTRY 실모듈 등록 + subpath 해석 + `SAFE_STUB` | §13.9 |
| 4 | 그리드 객체 (`grid.gridView`·`grid.dataProvider`) | RealGrid GridView/LocalDataProvider | `wrapGridApi` — 실제 메서드 superset + no-op | §13.10 |
| 5 | Zustand store 멤버 | `useViewStore`·`useContentStore` 멤버 | 두 store 동일 전체 멤버 union | §13.11 |

**패리티 유지 절차** (새 화면 생성·복사 작업 시 / 런타임 gap 발견 시 — 강제):
1. 산출물/원본이 쓰는 표면이 위 5개 중 어디에 속하는지 식별.
2. 그 표면의 패리티 메커니즘이 해당 심볼·모듈·메서드·멤버를 커버하는지 확인.
3. 미커버면 — **개별 오류가 아니라 그 표면 전체를 superset 으로 확장**:
   shim 에 `export` 추가 / REGISTRY 에 실모듈 등록 / `buildViewStoreState` 에 멤버 추가 /
   `wrapGridApi` 가 자동 흡수. 동시에 §13.1 의 프롬프트 광고목록과 동기.
4. 같은 클래스의 잠재 gap 을 함께 점검 (예: store 멤버 하나가 빠졌으면 형제 멤버도 점검).
5. RT 카탈로그(§13.2)에 *증상*을 한 줄 기록 — 단 해법 칸은 항상 "표면 클래스 확장"을 가리킨다.

**Hook 의 역할**: `composer-jsx.sh §CG-SHIM` 이 산출물 JSX 의 `@wingui/common/imports` import 를
shim 실제 export 와 대조 — 표면 #1 의 패리티를 Write/Edit 시점에 강제. 나머지 표면(#2~#5)은
런타임 graceful-degradation 으로 방어 + 이 절차로 사람이 패리티를 유지한다.

### 13.1 shim export ⇄ ComposerPromptBuilder 광고 목록 — 항상 동기 (강제)

단독 환경에서 산출물 JSX 의 `import { ... } from '@wingui/common/imports'` 는 webpack alias 로
**전부 `frontend/src/shim/wingui/common/imports.js`** 로 resolve 된다.
shim 이 export 하지 않는 이름을 import 하면 그 심볼은 `undefined` →
렌더 시 **`Element type is invalid: ... got: undefined`** 즉시 크래시.

- `ComposerPromptBuilder` 의 BASE_SYSTEM 이 "★ @wingui/common/imports 의 실제 export 목록" 으로
  광고하는 **모든** 컴포넌트는 shim 에 실제 `export` 가 존재해야 한다.
- **두 곳은 한 쪽만 고치지 말 것** — 프롬프트에 컴포넌트를 추가하면 shim 에도 즉시 추가.
- shim 현재 export 표면 (이 목록과 프롬프트 광고 목록이 일치해야 함):
  - Layout: `ContentInner · SearchArea · SearchRow · WorkArea · ResultArea · StatusArea ·
    ButtonArea · LeftButtonArea · RightButtonArea · VLayoutBox · HLayoutBox · SplitPanel ·
    TabContainer · Tab · PopupDialog · GroupBox · FormArea · FormRow · FormItem`
  - Input: `InputField · SearchMenuInput · Pagination`
  - Grid: `BaseGrid · TreeGrid · GridCnt · GridAddRowButton · GridDeleteRowButton ·
    GridSaveButton · GridExcelExportButton · GridExcelImportButton · LargeExcelDownload · LargeExcelUpload`
  - Button: `CommonButton · SaveButton · SearchButton · RefreshButton`
  - Store: `useViewStore · useContentStore · useUserStore · useMenuStore · useDashboardStore ·
    useInsightSystemStore · useSearchPositionStore · getViewStore · getContentStore · getUserStore ·
    storeApi · userStoreApi · getActiveViewId · useInputConstant · useIconStyles`
  - HTTP/기타: `zAxios · callService · showMessage · ShowMessageHost · useFieldCascade ·
    applyGridCascade · buildPopupFilterProps · loadRecentSimulationVersion · setHeaderColor`
- **Hook 자동 검증**: `.claude/hooks/validators/composer-jsx.sh §CG-SHIM` 이 JSX Write/Edit 시
  `@wingui/common/imports` named import 를 shim 의 실제 export 와 동적 대조 → 미보유 시 warn.

### 13.2 화면 실행 반복 오류 카탈로그 — 증상 기록 (Anti-patterns)

> 아래 RT1~RT9 는 **증상 기록**이지 해법 목록이 아니다. "차단 장치" 칸은 항상 §13.0 의
> **표면 클래스 확장**(패리티)을 가리킨다. 새 오류를 만나면 — 그 메시지가 속한 표면
> 클래스(§13.0 의 5개 표면)를 식별해 그 클래스 전체를 superset 으로 확장하라.
> **개별 오류 메시지 하나만 패치하고 끝내지 말 것** (그러면 오류는 끝이 없다).

| # | 증상 | 근본 원인 | 차단 장치 (= §13.0 표면 클래스 확장) |
|---|---|---|---|
| RT1 | `Element type is invalid: ... got: undefined` | 산출물이 import 한 컴포넌트를 shim 이 미보유 (예: `VLayoutBox`/`HLayoutBox` 누락 — 2026-05) | §13.1 shim 완전성 + Hook CG-SHIM |
| RT2 | `xxx.find/map/flatMap is not a function` | 리스트 state 가 배열이 아닌 값(객체/undefined)으로 set 됨 — API 빈 응답·sample interceptor 객체 응답 | §13.4 배열 가드 |
| RT3 | 산출물 0개 / 소스가 빈 0바이트 | LLM 이 `===FILE:` 마커를 자체 코드펜스(` ```sql ` 등) 안에 넣음 → `ArtifactExtractor` 정규식 미인식 (변형 A/B/C — §13.5) | §13.5 + extractor 정규식 보강 (펜스-열기 줄 0~N개 선택 소비) |
| RT4 | `[SQL_SP · SP_UI_*.sql] 실행 실패: Invalid column name '...'` | 자연어 생성이 기존 테이블(예: `TB_AD_USER`)의 SP 를 작성하며 실제 없는 컬럼명(`USER_ID`/`USER_NM`)을 추측 — 또는 기존 테이블에 CREATE TABLE 을 새로 생성 | §13.6 + ComposerPromptBuilder rule 15 + Hook `sql-schema-whitelist.sh` + §14.1 apply 오류 자동보완 |
| RT5 | 사용자가 고른 테이블 대신 다른 테이블 사용 (`TB_AD_USER` 선택 → `TB_UT_USER_INFO` 생성) | 테이블 검증이 세션 Target 이 아닌 composer-db 조회 → "미존재" 오판 → LLM 이 학습된 표준 테이블로 표류 | §13.7 + `enrichUserContentWithTableLookup` targetCd 수정 + ComposerPromptBuilder §②-2 + Hook CREATE TABLE 차단 |
| RT6 | `화면 렌더 오류: useIconStyles is not defined` (또는 `transLangKey`/`progressSpinner`/`$`/`clearErrors`/`exportGridtoExcel` 등이 `... is not defined`) | **원본 wingui 화면 자체**가 그 심볼을 `import` 없이 free variable 로 참조 (wingui 본 환경은 번들/부트스트랩으로 제공). 복사본은 원본과 **byte 동일** — LLM 결함 아님. 미리보기 격리 sandbox 는 그 ambient 를 미재현 | §13.8 + §13.9 — `runtime.js executeModule` 의 `with(__ambient__)` ambient scope (shim export + 비-shim 전역 stub) |
| RT7 | `화면 렌더 오류: Cannot read properties of undefined (reading 'type'/'palette'/...)` | 원본이 `import` 한 **실제 npm 서브모듈**(`@mui/material/styles` 등)이 미리보기 모듈 레지스트리에 미등록 → `useTheme()` 가 generic stub 의 no-op → `undefined` 반환 → 그 결과에 `.type` 접근 시 TypeError | §13.9 — REGISTRY 에 실모듈 등록 + `@mui/material/*` subpath 스마트 해석 + `SAFE_STUB`(undefined 대신 안전값) |
| RT8 | `화면 렌더 오류: Cannot read properties of undefined (reading 'setCheckBar'/'getCheckedRows'/'showToast'/...)` | 산출물이 `afterGridCreate` 의 grid 객체에서 `grid.gridView.xxx()` 호출 — 그러나 shim `BaseGrid` 의 grid 객체가 `gridView` 표면을 미보유 (`_view` 만 노출) → `grid.gridView` 가 undefined | §13.10 — shim BaseGrid grid 객체에 `gridView`(RealGrid GridView wrapper) + 완전한 `dataProvider` 표면 노출, 미존재 메서드는 no-op |
| RT9 | `화면 렌더 오류: getActiveViewId is not a function` (또는 `setViewInfo`/`getViewInfo` 등 store 멤버가 `is not a function`) | LLM 산출물이 store 멤버를 비표준으로 꺼냄 — 예: `const { setViewInfo, getActiveViewId } = useViewStore()` (no-selector destructure). `getActiveViewId` 는 `useViewStore` state 멤버가 아니어서 `undefined` → 호출 시 TypeError | §13.11 — `useViewStore`·`useContentStore` shim 이 **동일한 전체 멤버 union** 노출 (activeViewId·setViewInfo·getViewInfo·getActiveViewId 등) |
| RT10 | 신규화면의 그리드 컬럼이 **전부 동일하게 작게** 렌더 (헤더 명칭 잘림) | shim `BaseGrid` 가 `fitStyle: 'evenFill'` 사용 → RealGrid2 가 컬럼별 `width` 를 무시하고 모든 컬럼을 동일 너비(뷰포트÷컬럼수)로 강제. (+ 산출물이 `header:{text}`/`header:'str'` 형태면 shim 이 `headerText` 만 읽어 헤더가 컬럼 ID 영문으로 폴백) | §13.12 — shim BaseGrid `fitStyle:'none'` (컬럼 width 존중) + `headerTextOf` (3가지 header 형태 수용) |

### 13.3 산출물 디자인 규약 — Target System 룩 정확 반영 (강제)

산출물 화면은 **Target System(wingui) 의 표준 룩**을 그대로 따른다. LLM 이 임의 색 팔레트·여백을
지어내면 운영 화면과 이질적이 된다 (예: MP Dashboard 가 베이지색 `#FBFAF6/#DCD6C7` 자체 팔레트 사용).

- **표준 컴포넌트의 기본 룩에 의존** — `ContentInner · SearchArea · SearchRow · WorkArea ·
  BaseGrid · InputField · GroupBox` 는 shim 이 이미 wingui 파스텔 sky-blue 룩을 입혀 둠.
  산출물은 이 컴포넌트를 쓰기만 하면 룩이 자동 일치.
- **임의 색 하드코딩 금지** — 위젯·카드·차트 색은 MUI 테마 토큰 또는 파스텔 팔레트에서 선택:
  primary `#7CA7E0` · 정상/성공 `#86C7A8` · 주의 `#E6C079` · 위험 `#E0989A` · 정보 `#8FC4D4` ·
  강조/AI `#9D8FD4` · 본문 텍스트 `#3A4A63` · 보조 텍스트 `#6E7E96` · 보더 `rgba(124,167,224,0.28)`.
  베이지/세피아/다크 등 자체 테마 창작 금지.
- **여백(spacing) 은 8px 그리드** — MUI `sx` 의 spacing 단위(`p:1`=8px, `gap:1.5`=12px) 사용.
  카드/패널 내부 padding 은 `p: 1.5`~`2`, 위젯 간 gap 은 `gap: 2`, 행 간 gap 은 `gap: 1` 기준.
- **패널·카드는 `GroupBox` 또는 일관 보더** — `border: '1px solid rgba(124,167,224,0.30)'` +
  `borderRadius: 1` + 반투명 배경. 위젯마다 다른 보더 스타일 금지.
- **타이포** — 화면/패널 제목 `fontSize: 14~16, fontWeight: 700`, 본문/셀 `12~13`, 캡션 `11`.
  거대한 제목(`fontSize: 24+`) 금지.
- 대시보드 KPI/차트는 `VLayoutBox`/`HLayoutBox` + `Box`(`flex`) 격자로 균등 배치 — 위젯 간
  여백 일관, 폭이 화면을 넘으면 `WorkArea` 가 자동 스크롤.

### 13.4 배열 상태 가드 (RT2 차단)

목록 데이터를 받는 모든 state 는 **배열 보장**:
```jsx
const [kpis, setKpis] = useState([]);                 // 초기값 [] 필수
// API 응답 — 배열이 아니면 [] 로 폴백
zAxios.get('...').then(r => setKpis(Array.isArray(r.data) ? r.data : []));
// 렌더 — .map/.find/.flatMap 전 한 번 더 가드 (state 가 외부에서 오염될 수 있음)
{(Array.isArray(kpis) ? kpis : []).map(k => <KpiCard key={k.kpiCd} kpi={k} />)}
```
- sample interceptor 가 객체를 돌려줄 수 있는 URL(`/summary` `/dashboard` 등)도 위 가드로 안전.

### 13.5 ArtifactExtractor `===FILE:` 포맷

- 권장 정규형: `===FILE: <path>===` 한 줄 → 바로 다음 줄 ` ```lang ` 펜스 → 본문 → ` ``` `.
- `ArtifactExtractor.FILE_BLOCK` 정규식은 LLM 이 비결정적으로 쓰는 **3가지 변형**을 모두 인식
  (마커 줄 다음의 '펜스-열기 줄'을 **0~N개 선택 소비**):
  - (A) `===FILE:...===` → ` ```lang ` → 본문 → ` ``` ` (펜스-열기 1개)
  - (B) ` ``` ` → `===FILE:...===` → ` ``` ` → ` ```lang ` → 본문 → ` ``` ` (펜스-열기 2개)
  - (C) ` ```sql ` → `===FILE:...===` → 본문 → ` ``` ` (마커가 펜스 안쪽 — 펜스-열기 0개)
  ★ 2026-05-16 사고: (C) 를 정규식이 못 잡아 한 세션 **산출물 0개**. 0~N 매칭으로 수정.
- 기존 세션의 빈/누락 산출물 복구: `POST /composer/sessions/{id}/artifacts/re-extract` —
  assistant 응답을 LLM 재호출 없이 보강된 정규식으로 다시 파싱.

### 13.6 ★ 기존 테이블 사용 시 실제 컬럼 검증 — 필수 (RT4 차단, 2026-05-16)

> **사고 (2026-05-16)**: 자연어로 사용자 관리 화면을 생성하니 `SP_UI_AD_01_Q1/S1/D1` 이
> `TB_AD_USER` 에 대해 `USER_ID` · `USER_NM` 컬럼을 사용 → 화면 실행 시
> `Invalid column name 'USER_ID'` SP 실행 실패. `TB_AD_USER` 의 실제 컬럼은
> `ID · USERNAME · PASSWORD · DISPLAY_NAME · ENABLED` (USER_ID/USER_NM 아님).

**필수 규칙 (모든 생성 모드 — 특히 자연어 NEW_NL/NEW_GENERAL):**

1. **기존 테이블 = CREATE TABLE 금지.** 화면이 이미 존재하는 `TB_*` 테이블을 사용하면 그
   테이블에 대한 `CREATE TABLE` / `SQL_DDL` 아티팩트를 절대 새로 만들지 않는다 (apply 시
   `tableCollisionBlocked` 로 차단되며, 만들었다는 사실 자체가 컬럼 추측의 신호).
2. **컬럼 우선 검증 → SP 순차 생성.** SP 의 `SELECT/INSERT/UPDATE/DELETE/WHERE` 컬럼은 모두
   그 테이블의 **실제 컬럼명**만 사용. 추측·축약·임의 추가 금지.
   - 백엔드 `ComposerService.enrichUserContentWithTableLookup` 가 사용자 prompt 의 `TB_*`
     언급을 감지하면 **세션 Target DB(targetCd)** 의 `INFORMATION_SCHEMA` 조회 결과
     (`=== 자동 테이블 존재 여부 확인 ===`)를 prompt 앞에 주입 — 이 블록의 컬럼 명세가
     **권위 있는 진실**. (★ targetCd 누락 시 composer-db 만 조회돼 "미존재" 오판 — §13.7)
   - 자연어 요청이 테이블명을 명시하지 않으면 이 블록이 없다 → LLM 은 컬럼을 추측하지 말고
     `[가정]` 태그로 사용자에게 테이블/컬럼 확인을 요청.
3. **3곳 정합화.** 실제 컬럼명을 SP 결과 ↔ Entity `@Column(name=...)` ↔ JSX `gridItems`
   `name/fieldName` 세 곳에 일관 반영.
4. **흔한 함정 테이블** (추측 금지 — 실제 컬럼):
   - `TB_AD_USER` = `ID · USERNAME · PASSWORD · DISPLAY_NAME · ENABLED · JTI · SESSION_EXPIRED_DTTM`
     (❌ `USER_ID`/`USER_NM`/`USER_NAME` — 이는 `TB_UT_USER_INFO` 의 컬럼)
   - `TB_AD_MENU` = `ID · PARENT_ID · MENU_CD · MENU_PATH · MENU_SEQ · MENU_FILE_PATH · USE_YN`
   - `TB_UT_USER_INFO` = `USER_ID · USER_NM · USER_EMAIL · USER_TEL` (❌ `EMAIL`/`PHONE`)

**차단 장치:**
- `ComposerPromptBuilder` INVARIANTS **rule 15** — 위 절차를 LLM system prompt 에 강제.
- Hook `validators/sql-schema-whitelist.sh` — `.sql` 파일이 `TB_AD_USER` 참조 +
  `USER_ID`/`USER_NM`/`USER_NAME` 사용 시 block (`TB_AD_MENU`·`TB_UT_USER_INFO`·
  `TB_AD_LANG_PACK` 도 동일하게 허구 컬럼 차단).
- 런타임: 위반이 실제 화면 실행까지 가더라도 apply 단계 SP 실행 실패 →
  **§14.1 의 AI 자동보완**이 오류 메시지를 받아 산출물을 스스로 수정·재실행.

### 13.7 ★ 사용자가 선택/지정한 데이터 소스 절대 대체 금지 (RT5 차단, 2026-05-16)

> **사고 (2026-05-16)**: 사용자가 Data Source 별자리 맵에서 `TB_AD_USER` 를 직접 선택했는데
> 생성 결과가 `TB_UT_USER_INFO`(레거시 사용자 부가정보 테이블)를 사용 → 충돌. 원인 2가지:
> ① `enrichUserContentWithTableLookup` 이 세션 Target 이 아닌 composer-db(PG) 를 조회 →
>    `TB_AD_USER` 를 `[✗ 미존재]` 로 오판 → LLM 이 "없는 테이블" 로 보고 학습된 표준
>    예시(`TB_UT_USER_INFO` / `UserInfoMgmt`)로 표류.
> ② 데이터 소스 지정이 '소프트 힌트' 수준이라 rules 예시의 강한 prior 에 밀림.

**근본 수정 (적용 완료):**
- `ComposerService.enrichUserContentWithTableLookup` · `ArtifactApplyService.checkTableNameCollisions`
  → 세션의 `targetCd` 를 받아 운영 Target DB(MSSQL) 에 질의. (이전엔 targetCd 누락 →
  composer-db PG 조회 → 모든 `TB_*` 가 "미존재" 오판)
- `ModeNewGeneral` 의 자동 테이블 lookup 도 `currentTargetCd` 전달.

**필수 규칙 (모든 생성 모드):**
1. `=== 데이터 소스 (사용자가 DB 객체에서 직접 선택) ===` · `=== 자동 테이블 존재 여부 확인 ===`
   블록에 명시된 테이블/SP 는 사용자가 Target DB 를 직접 탐색해 고른 **확정 데이터 소스**.
   그 테이블/SP **만** 사용 — 이름이 비슷하거나 '더 표준적' 으로 보이는 다른 테이블로
   **대체·교체·승격 절대 금지**.
2. 특히 `TB_AD_USER ↔ TB_UT_USER_INFO` — '사용자 관리 화면' 표현만 보고 학습된 표준
   테이블을 끌어오지 말 것. 사용자가 명시한 그 테이블이 진실.
3. 명시 테이블의 도메인이 화면 MENU_CD 도메인과 달라도 그대로 사용
   (UI_AD_* 화면이 TB_AD_USER 를 쓰는 것이 정상 — 도메인 일치를 이유로 교체 금지).

**차단 장치:**
- `ComposerPromptBuilder` INVARIANTS **§②-2** — anti-substitution 규칙을 생성 prompt 에 강제.
- Hook `validators/sql-schema-whitelist.sh` — 운영 코어 테이블(TB_AD_USER 등)에
  `CREATE TABLE` 생성 시 block.
- `ArtifactApplyService.checkTableNameCollisions` — apply 시 (Target DB 기준으로)
  기존 테이블 재생성 차단 (`tableCollisionBlocked`).

### 13.8 ★ 미리보기 ambient scope — import 누락 wingui 표면 내성 (RT6 차단, 2026-05-16)

> **사고 (2026-05-16)**: 기존화면 복사 → 자연어 수정 후 [화면 실행] 시
> `화면 렌더 오류: useIconStyles is not defined`. 진단 결과 **복사 산출물(`Users.jsx`)은
> 원본 wingui `view/system/usermgmt/users/Users.jsx` 와 byte 단위로 동일** — Composer 복사
> 결함이 아니다. **원본 wingui 화면 자체**가 `const iconClasses = useIconStyles();` 처럼
> `useIconStyles`(그리고 `transLangKey`·`showMessage`·`progressSpinner`·`$`·`clearErrors`·
> `exportGridtoExcel`)를 **import 없이 free variable 로 참조**한다. wingui 본 환경은 이를
> 번들/부트스트랩 수준에서 제공하므로 동작하지만, babel 이 ES module → CJS 로 변환해
> `new Function` sandbox 에서 실행하는 미리보기는 그 ambient 를 미재현 → ReferenceError.

**근본 수정 (적용 완료):** `frontend/src/preview/runtime.js` 의 `executeModule` 이
변환된 CJS 코드를 `with (__ambient__) { ... }` 로 감싼다. `__ambient__` 는 `Object.create(null)`
기반 **평범한 객체**:
- `@wingui/common/imports` + `@wingui/common/fieldCascade` + `@zionex/wingui-core` shim 의
  모든 named export (`useIconStyles`·`transLangKey`·`showMessage`·`ContentInner` …).
- shim export 가 아닌 wingui 전역도 안전 stub 으로 보강 — `progressSpinner`(`''`) ·
  `exportGridtoExcel`/`clearErrors`(noop) · `$`/`jQuery`(`.each`/`.ajax`/`.extend` 갖춘 최소 stub).
- `with(plainObject)` — 그 객체가 가진 키만 그쪽으로 resolve, 나머지(`React`·`console`·`Math`)는
  정상 scope chain 으로 fall-through. 산출물이 정상 import 한 심볼은 babel 지역 binding 이
  ambient 를 가린다 → 충돌 없음. `Proxy(has:true)` 대신 평범한 객체 — 모든 free variable 을
  가로채지 않아 안전.

### 13.9 ★ 미리보기 모듈 레지스트리 완전성 + SAFE_STUB (RT7 차단 · 근본 진단, 2026-05-16)

> **사고 (2026-05-16)**: 기존화면 복사 → 자연어 수정 → [화면 실행] 시
> `Cannot read properties of undefined (reading 'type')`. 원본 `Users.jsx` 는 line 10
> `import { useTheme } from "@mui/material/styles";` · line 217 `theme.type === 'dark'`.
> `@mui/material/styles` 가 미리보기 모듈 레지스트리에 **미등록** → `previewRequire` 가
> generic Proxy stub 반환 → `useTheme()`(소문자=훅 취급) → no-op → `undefined` → `theme.type`
> 에서 TypeError.

**★ 근본 원인 (RT6·RT7 공통 — 진단 결론):** Composer 의 [화면 실행] 미리보기는 산출물 JSX 를
**격리 mini-runtime** (`@babel/standalone` 변환 + `new Function` sandbox + 수작업 큐레이트
모듈 레지스트리 + shim + ambient scope) 에서 실행한다 — wingui 의 전체 webpack 빌드가 아니다.
격리는 의도된 설계 (깨진 산출물이 main bundle 을 못 깨뜨리도록). 그러나 **원본 wingui 화면은
wingui 의 전체 런타임 표면**(① 모든 npm/`@mui`/`@wingui`/`@zionex` 모듈 그래프 ② 빌드·부트스트랩
수준 ambient 전역)에 의존한다. mini-runtime 이 그 표면의 *부분집합*만 커버하므로, 누락분을
건드리는 byte-동일 복사본은 크래시한다. 레지스트리가 수작업이라 실제 화면이 쓰는 표면을
뒤따라가지 못해 **오류가 하나씩 순차로 드러난다** (whack-a-mole).

**근본 수정 (적용 완료) — 3겹 내성:**
1. **레지스트리 완전성** — `@mui/material/styles` 실모듈을 REGISTRY 에 등록.
   `previewRequire` 가 `@mui/material/<sub>` (예: `@mui/material/Button`) 도 이미 로드된
   `@mui/material` 네임스페이스에서 스마트 해석.
2. **`SAFE_STUB`** — 미해결 모듈의 훅/유틸 stub 이 `undefined` 가 아닌 `SAFE_STUB` 반환.
   `SAFE_STUB` 은 `.prop` 체이닝 · 호출 · `new` · `for..of`/구조분해 · 문자열 coercion 어디에도
   throw 하지 않는 Proxy 값. → 레지스트리에 빠진 모듈이 있어도 `useXxx()` 결과에 속성 접근하는
   산출물이 크래시하지 않고 best-effort 렌더 (RT7 같은 미등록 모듈을 일반적으로 방어).
3. **ambient scope 보강** — §13.8 (import 누락 free variable).

**원칙:** mini-runtime 은 wingui 전체 런타임을 100% 미러할 수 없다 (구조적 한계). 따라서
전략은 **차단이 아니라 graceful degradation** — 미등록 모듈·미정의 전역을 만나도 *크래시 대신
inert stub* 으로 렌더한다. 새 wingui 표면이 자주 쓰이면 (a) shim 에 정식 추가 (rules/50 §13.1)
또는 (b) REGISTRY 에 실모듈 등록 — stub 에 영구히 기대지 말 것 (stub 은 동작이 inert 라 미리보기
정확도가 떨어짐).

### 13.10 ★ shim BaseGrid — grid 객체 표면 완전성 (RT8 차단, 2026-05-16)

> **사고 (2026-05-16)**: 기존화면 수정 → 자연어 수정 → [화면 실행] 시
> `Cannot read properties of undefined (reading 'setCheckBar')`. 원본 `Users.jsx` 의
> `function setOptions(){ userGrid.gridView.setCheckBar({visible:true}); ... }` —
> `afterGridCreate` 콜백의 grid 객체에서 `grid.gridView` 를 쓴다. 그러나 shim
> `BaseGrid.jsx` 의 grid 객체는 RealGrid GridView 를 `_view` 로만 노출하고 `gridView` 가
> 없었다 → `grid.gridView` 가 `undefined` → `.setCheckBar` 에서 TypeError.

**근본 원인:** RT6/RT7 과 동일 계열 — **shim 이 wingui 표면을 부분만 재현**. 여기서는
*모듈/전역* 이 아니라 **`afterGridCreate` 가 넘기는 grid 객체의 메서드 표면**. 실제 wingui
`BaseGrid` 의 grid 객체는 `gridView`(RealGrid GridView)·`dataProvider`(LocalDataProvider)
양쪽을 노출하고, 산출물은 `grid.gridView.setCheckBar/setStateBar/commit/getCheckedRows/
showToast/hideToast/id` 와 `grid.dataProvider.fillJsonData/getAllStateRows/getJsonRow/
getRowCount` 를 자유롭게 호출한다.

**근본 수정 (적용 완료) — `frontend/src/shim/wingui/common/BaseGrid.jsx`:**
- grid 객체에 **`gridView`** 추가 — RealGrid `GridView` 를 `wrapGridApi` Proxy 로 감쌈.
- **`wrapGridApi(raw, overrides)`** — raw 객체(GridView/LocalDataProvider)의 실제 메서드는
  그대로 bind 해 노출, **미존재 메서드는 no-op 함수**로 대체. RealGrid 버전 차이·wingui
  본 환경 전용 메서드를 산출물이 호출해도 `xxx is not a function` 크래시가 없다.
- `dataProvider` 도 `wrapGridApi` 로 — `fillJsonData`(sample 주입)·`getAllStateRows`·
  `getJsonRow` 만 override, `getRowCount` 등 나머지 LocalDataProvider 메서드는 전부 통과.
- grid-level 편의 메서드 `commit`/`cancel`/`refresh` 추가 (shim `GridSaveButton` 의
  `g.commit(true)` 호출 대응).
- `afterGridCreate(grid, gridView, dataProvider)` 의 2·3번째 인자도 wrapper 로 전달.

**원칙:** shim 컴포넌트가 콜백으로 넘기는 객체(grid·event 등)도 **wingui 의 표면과 1:1**
이어야 한다. 새 메서드 누락이 의심되면 `wrapGridApi` 의 no-op fallback 이 1차 방어 —
단 동작이 inert 라, 자주 쓰이는 메서드는 shim 에 실제 구현으로 추가할 것.

### 13.11 ★ shim Zustand store — 멤버 표면 완전성 (RT9 차단, 2026-05-16)

> **사고 (2026-05-16)**: 신규 화면생성 → 자연어 생성으로 만든 **가장 기본적인 화면**에서
> `화면 렌더 오류: getActiveViewId is not a function`. 원인: LLM 산출물이
> `const { setViewInfo, getActiveViewId } = useViewStore();` `const activeViewId =
> getActiveViewId();` 로 작성 — `getActiveViewId` 는 `useViewStore` 의 state 멤버가
> **아니라** 별도 top-level export 다. no-selector destructure 로 꺼내면 `undefined` →
> 호출 시 TypeError.

**★ 근본 원인 (RT6~RT9 공통 — 진단 결론 확장):** 미리보기 격리 mini-runtime 이 wingui 의
런타임 표면을 부분만 재현하는 구조적 한계 (§13.9). LLM 산출물은 store 접근을 **비결정적**으로
쓴다 — `useContentStore(s=>[s.activeViewId])`(표준) · `useViewStore(s=>s.activeViewId)`(swap) ·
`const {setViewInfo,getActiveViewId}=useViewStore()`(no-selector destructure) 등. shim 이
일부 패턴만 지원하면 나머지가 `undefined` → "xxx is not a function" 크래시. **오류를 하나씩
대응하면 끝이 없다 — 표면 자체를 완전하게 만들어야 한다.**

**근본 수정 (적용 완료) — `frontend/src/shim/wingui/common/imports.js`:**
- `buildViewStoreState(set, get)` 단일 팩토리 — `useViewStore` 와 `useContentStore` **두 store
  모두** 동일한 **전체 멤버 union** 으로 생성:
  `activeViewId · viewData · viewList · contentBodyRefs · setViewInfo · getViewInfo ·
  getGlobalButtons · getViewIsUpdated · getActiveViewId · getActiveViewID · setActiveViewId ·
  addView · removeView`.
- → 어느 store 에서 어떤 멤버를 꺼내든(selector / no-selector / 어느 store 든) 항상 실제
  동작하는 값/함수. store-member-undefined 크래시 클래스 전체 차단.

**미리보기 4겹 graceful-degradation 아키텍처 (RT6~RT9 종합):**
| 표면 | 방어 | 절 |
|---|---|---|
| import 누락 free variable (`useIconStyles`·`transLangKey`…) | `with(__ambient__)` ambient scope | §13.8 |
| 미등록 npm/서브모듈 (`@mui/material/styles`…) | REGISTRY 등록 + subpath 해석 + `SAFE_STUB` | §13.9 |
| grid 객체 메서드 (`grid.gridView.setCheckBar`…) | `wrapGridApi` — 실제+no-op | §13.10 |
| Zustand store 멤버 (`getActiveViewId`·`setViewInfo`…) | 두 store 전체 멤버 union | §13.11 |

**원칙:** shim 이 노출하는 store/객체 표면은 **wingui 표면의 상위집합(superset)** 이어야 한다.
일부만 지원하면 LLM 의 비결정적 산출 패턴 중 미지원분이 크래시한다. 새 store 멤버 패턴이
관찰되면 `buildViewStoreState` 에 추가 (rules/50 §13.1 의 shim↔prompt 동기화 원칙과 동일 계열).

### 13.12 ★ shim BaseGrid — 컬럼 렌더 표면 (fitStyle · header 형태) (RT10 차단, 2026-05-18)

> **사고 (2026-05-18)**: 신규화면 생성 후 [화면 실행] 시 그리드 컬럼이 **전부 동일하게 작게**
> 렌더되어 헤더 명칭이 잘림. 산출물 gridItems 에는 새 규칙대로 넉넉한 `width`(220·240·180…)가
> 들어있었으나, shim `BaseGrid.jsx` 가 `view.setDisplayOptions({ fitStyle: 'evenFill' })` 로
> 설정 → RealGrid2 의 `evenFill` 은 **컬럼별 `width` 를 완전히 무시**하고 모든 컬럼을 동일
> 너비(뷰포트÷컬럼수)로 강제한다. 컬럼이 많으면 전부 ~70px → 헤더 잘림.

**근본 원인 (RT8~RT9 와 동일 계열):** shim BaseGrid 가 산출물 컬럼 메타를 wingui 표면대로
재현하지 못함. 두 지점:
- **`displayOptions.fitStyle`** — 실제 wingui-core BaseGrid 는 `fitStyle` 을 지정하지 않아
  RealGrid 기본값 `'none'`(설정 너비 그대로)으로 동작하고, fill 동작이 필요한 화면만 개별적으로
  `evenFill`/`fill` 을 설정한다. shim 이 전 그리드에 `evenFill` 을 강제한 것이 wingui 와 어긋남.
- **컬럼 `header` 표기** — 산출물 헤더는 `headerText:'..'` · `header:'..'`(string) ·
  `header:{text:'..'}`(RealGrid 원형) 세 형태로 비결정적으로 나오는데, shim `buildColumns` 가
  `headerText` 만 읽어 나머지 두 형태는 `name`(영문 필드명)으로 폴백됐다.

**근본 수정 (적용 완료) — `frontend/src/shim/wingui/common/BaseGrid.jsx`:**
- `setDisplayOptions` 의 `fitStyle: 'evenFill'` → **`'none'`** — 각 컬럼이 산출물 `width` 그대로
  렌더 (총합이 뷰포트 초과 시 가로 스크롤). wingui-core BaseGrid 기본 동작과 일치.
- `buildColumns` 헤더 텍스트 해석을 **`headerTextOf(c)`** 헬퍼로 — `headerText` ·
  `header`(string) · `header.text`(object) 셋 다 수용, 없으면 `name` 폴백.

**연계 — 산출물 생성 측 (width 값):** 위는 *렌더* 측 수정. *생성* 측은 `ComposerPromptBuilder`
INVARIANTS ⑥ + `rules/41a §4.3` 의 컬럼 너비 규칙(`width ≈ 헤더글자수×16+48`, 역할별 최소 —
코드/날짜 110+ · 명칭 140+ · 일시 170+ · 설명 220+)이 담당. Hook `composer-jsx.sh CG-WIDTH`
가 width 미지정/과소(<100) 컬럼을 warn.

**원칙:** shim BaseGrid 가 노출/소비하는 표면(grid 객체 §13.10 · store 멤버 §13.11 ·
displayOptions·컬럼 메타 §13.12)은 모두 wingui 표면과 1:1 이어야 한다. shim 만의 비표준
값(`evenFill` 강제)이나 부분 지원(`headerText` 만)이면 산출물이 의도대로 렌더되지 않는다.

## 14. 화면 실행 AI 자동보완 + 산출물 UI 보강 (2026-05-16)

> [화면 실행] 후 런타임 오류가 나면 AI 가 산출물을 자동 수정·재실행한다.
> 사용자가 오류를 직접 분석할 필요 없이 화면이 자동으로 고쳐진다.

### 14.1 화면 실행 후 오류 → AI 자동보완 (apply 오류 + 런타임 오류 모두)

- ComposerWorkspace 헤더 [화면 실행] 옆 **[오류 시 자동보완] 체크박스** (기본 OFF — 2026-05-16 사용자 요청. 사용자가 켜면 그때만 자동보완 동작).
- 흐름: 오류 포착 → `ComposerWorkspace.handlePreviewError`
  → `ChatPanel.sendMessage(오류+스택)` (같은 세션 채팅) → AI 산출물 수정
  → `handlePreview` 재실행. 재실행 후 또 오류면 attempt+1 로 반복.
- **오류 포착 2계층** — 둘 다 자동보완 대상:
  1. **apply(산출물 적용) 단계 오류** — `applyPreview` 가 `success:false` 반환
     (JSX/SQL/MENU/Java 처리 실패. 특히 **SP 실행 실패 `Invalid column name`**, §13.6 RT4).
     → `handlePreview` 의 `!r.success` 분기가 `autoFixOnError` ON 이면 **차단 스낵바 없이**
     `handlePreviewError({type:'apply', message})` 호출 (오류 창을 띄우지 않고 곧장 보완).
  2. **preview(화면 렌더) 단계 오류** — `PreviewEmbed` 3경로:
     - load 오류 (transform/execute) — `loadPreviewComponent().catch`
     - render 오류 — `PreviewErrorBoundary` (iframe React 루트 안에서 산출물 Component 래핑)
     - runtime/promise 오류 — iframe window `error` / `unhandledrejection`
       (`ResizeObserver loop` · `Script error` 는 양성 → 무시)
     - **load 당 1회만** 보고 (`reportedRef` — 매 load 시작 시 리셋)
- **재진입 설계** — `handlePreviewError` 는 재실행(`handlePreview`) 호출 **전에**
  `autoFixingRef` lock 을 해제하고 재실행을 `await` 없이(fire-and-forget) 호출한다.
  apply 단계 오류는 `handlePreview` 안에서 **동기적**으로 다시 발생하므로, lock 을 재실행
  동안 잡고 있으면 재진입 가드(`if autoFixingRef.current return`)에 막혀 보완 루프가 끊긴다.
- `buildFixPrompt` 는 오류 메시지에 `Invalid column`/`column name` 패턴이 있으면 SQL 컬럼
  오류 전용 지침을 추가 — "기존 테이블 CREATE TABLE 금지, 실제 컬럼명만 사용, SP+Entity+
  gridItems 3곳 정합화".
- `ChatPanel` 은 `forwardRef` + `useImperativeHandle({ sendMessage })` 로
  프로그램적 채팅 전송 노출. `send` 는 성공/실패를 boolean 으로 반환.

### 14.2 무한루프 3중 차단 (필수)

| # | 차단 | 메커니즘 |
|---|---|---|
| 1 | 횟수 상한 | `autoFixAttemptRef >= MAX_AUTOFIX(1)` 이면 중단 — 2026-05-16 사용자 요청으로 **1회만** 자동보완(1회 보완 후에도 오류면 즉시 멈추고 사용자에게 위임). 카운터는 **수동 [화면 실행] 버튼**에서만 0 리셋, 자동 재실행 경로는 리셋 안 함 |
| 2 | 동일오류 감지 | `lastAutoFixErrorRef` — 보완 후에도 같은 오류 메시지 재발 시 남은 횟수 무관 즉시 중단 |
| 3 | 재진입 가드 | `autoFixingRef` — 보완 진행 중 중복 트리거 차단 |

### 14.3 자동보완 진행 가시화

- `previewStage` 에 `'autofixing'` 단계 추가 — 헤더 토스트 `🤖 AI 자동보완 (N/3)`.
- ⚠️ `handlePreview` 의 'ready' 자동닫기 `setTimeout` 은 **함수형 업데이트**로
  `phase === 'ready'` 일 때만 닫는다 — 그 사이 autofixing/failed 로 바뀌었으면 유지
  (안 그러면 자동보완 토스트가 1.5초 뒤 사라져 진행이 안 보임).
- `PreviewEmbed` 는 `autoFixing` prop true 면 phase 무관 **'AI 자동보완 중' 전용 화면** 표시
  (오류 화면 대신).

### 14.4 Sample 모드 항상 ON

- Sample 체크박스 UI 제거. `useSampleData = true` 상수 — 항상 ON
  (빈 응답 휴리스틱 sample 주입 + Java 적용·mvn·재기동 SKIP + **SQL_DDL/SQL_SP 실행 SKIP** — §17).

### 14.5 산출물 소스 패널 스크롤 — flex `minHeight:0` 체인

- flex column 자식이 `overflow:auto` 로 스크롤되려면 **스크롤 자식까지 이어지는
  모든 flex 조상에 `minHeight:0`** 이 있어야 한다 (없으면 콘텐츠 높이만큼 늘어나 스크롤 미발생).
- 사고: ComposerWorkspace 우측 Tab 컨테이너 Box 에 `minHeight:0` 누락 → 산출물 소스가
  길어도 스크롤 없이 잘림.

### 14.6 디자인 일관성 — 티얼 + 파스텔 글래스 (theme.js · 2026-06-26 A시안 적용)

> **2026-06-26**: 메인 컬러를 `#7CA7E0` (sky-blue 파스텔) → **`#2d8ba8` (티얼)** 로 전환.
> 사용자 디자인 A시안 (Composer 개선.dc.html) 적용. 두 가지 룩이 병행한다:

| 룩 | 적용 화면 | 표면 |
|---|---|---|
| **A. 흰 패널 (A시안)** | Composer landing (`T3Composer.jsx ModeSelector`) | 흰 배경 `#F6F7F9` + 흰 패널 `#fff` + 보더 `#ECEEF1` + 메인 컬러 `#2d8ba8` 강조. backdrop-filter 사용 안 함. eyebrow 는 JetBrains Mono 9.5px uppercase `#9AA3AF`. 추천 카드(hot) 는 티얼 보더 + 그림자. |
| **B. 파스텔 글래스** | History · UI Pattern · Gallery · picker 다이얼로그 · ComposerWorkspace | `theme.js` 의 `GLASS` 토큰 (`rgba(255,255,255,0.72)` + `backdrop-filter:blur(14px)` + 흰 반투명 보더). 강조는 티얼. |

- **공통 규칙**: **다크 그라데이션 헤더/히어로 금지** (이 규칙은 두 룩 모두 적용).
- **`theme.js PALETTE`**: primary `#2d8ba8` · primaryLight `#7FB9D0` · primaryDark `#1F6680` ·
  primarySoft `#E8F2F6` (활성 메뉴/뱃지 배경) · primaryBorder `#CFE3EB` · 성공 `#86C7A8` ·
  정보 `#8FC4D4` · 강조 `#9D8FD4` · textPrimary `#1A2330` · textSecondary `#6B7280` ·
  textMuted `#9AA3AF` (eyebrow/캡션) · panelBorder `#ECEEF1` · bgDefault `#F6F7F9`.
- **GLASS 그림자 토큰**: 티얼 RGB `45,139,168` 적용 (이전 sky `124,167,224` 폐기).
- **신규 화면 디자인 선택 기준**:
  - 정보 밀도가 높고 데이터 도구형 → **A. 흰 패널** (landing · 빠른 시작 · 통계 카드)
  - 부유감/유리감 강조 + 배경 컨텐츠와 어울림 필요 → **B. 파스텔 글래스** (다이얼로그 · 워크스페이스)
- `MockupPickerDialog` 미리보기 — **고정 scale 금지**. `ResizeObserver` 로 패널 폭 측정 →
  `배율 = 패널폭 / 원본폭(1400)` 동적 산정 → 우측 검은 여백 제거 + 세로 스크롤.
- 엔진 선택(`ModeNewGeneral`) — 선택 엔진은 **단색 채움 + 흰 글자 + 체크 아이콘 + 확인 칩**
  (미선택은 흰 바탕·흐린 회색) 으로 명확히 대비.

### 14.7 Anti-patterns

| ❌ | ✅ |
|---|---|
| 산출물 화면 진입 후 사용자가 [화면 실행]을 매번 수동 클릭해야 함 | mount·생성완료 시 JSX 산출물 시그니처 변화 감지해 `handlePreview` 자동 호출 (§14.8) |
| 자동 실행을 매 채팅·매 렌더마다 무조건 재호출 → `applyPreview` 낭비·화면 깜빡임 | `autoPreviewSigRef` 로 JSX id 시그니처 변화 시에만 1회 (§14.8) |
| 자동보완 카운터를 자동 재실행 경로에서도 리셋 → 무한루프 | 수동 버튼에서만 리셋 · MAX 3 + 동일오류 중단 (§14.2) |
| 'ready' 닫기 타이머가 autofixing 토스트 제거 | `setPreviewStage((s)=> s?.phase==='ready' ? null : s)` (§14.3) |
| 자동보완 도는데 PreviewEmbed 가 오류 화면만 표시 | `autoFixing` prop → 'AI 자동보완 중' 전용 화면 (§14.3) |
| 산출물 소스 스크롤 자식의 flex 조상에 `minHeight:0` 누락 | 조상 전체 `minHeight:0` 체인 (§14.5) |
| 미리보기 고정 scale → 검은 여백 | ResizeObserver 동적 배율 (§14.6) |
| 다크 그라데이션 헤더 | 파스텔 글래스 (§14.6) |
| apply(SP 실행) 오류 시 차단 스낵바만 띄우고 자동보완 미진입 | `autoFixOnError` ON 이면 `!r.success` 분기가 `handlePreviewError({type:'apply'})` 호출 — 오류 창 없이 보완 (§14.1) |
| `handlePreviewError` 가 `autoFixingRef` lock 을 재실행 `await` 동안 유지 → apply 동기 오류가 재진입 가드에 막힘 | lock 을 재실행 호출 **전** 해제 + 재실행 fire-and-forget (§14.1) |
| 기존 테이블에 CREATE TABLE 생성 / 추측 컬럼명으로 SP 작성 | 실제 컬럼 검증 후 SP 순차 생성 (§13.6) |

### 14.8 산출물 화면 자동 실행 (2026-05-16 사용자 요청)

산출물 화면으로 이동하면 [화면 실행]을 **수동 클릭 없이 자동 수행**하고 우측 [실행 화면 LIVE]
탭을 보여준다 — 신규개발·기존화면수정 **공통**.

- 구현: `ComposerWorkspace.jsx` 의 `useEffect([session?.id, refreshKey])` —
  `listArtifacts` 로 세션의 `SCREEN_JSX`(status≠DISCARDED) 산출물을 조회, **JSX 산출물
  id 시그니처**가 바뀌면 `handlePreview()` 1회 자동 호출 (생성 직후 서버 추출 대기 700ms).
- 발화 시점:
  - **mount 시** — 이어하기(History) · 기존화면수정(원본 소스 `importSourceArtifacts`
    직후) 등 이미 산출물이 있는 세션으로 이동 → 즉시 실행 화면 노출.
  - **생성·수정 완료 후** — `ChatPanel.onNewAssistantMsg` → `triggerRefresh` →
    `refreshKey` 증가 → 새 JSX id → 자동 재실행.
- 중복 방지: `autoPreviewSigRef` — 동일 JSX id 시그니처면 skip. 컴포넌트 재mount(다른
  산출물 화면으로 이동)면 ref 초기화 → 다시 실행. `handlePreview` 의 `previewBusy` 가드로
  동시 호출 안전.
- JSX 산출물이 없는 세션(생성 전 빈 신규 세션)은 자동 실행 안 함 — 무의미한 `applyPreview`
  호출 회피.

## 15. Data Source 선택 — 뉴럴 별자리 맵 (2026-05-16)

자연어 생성(`ModeNewGeneral`)의 **네 번째 참조 입력** — 화면이 읽고/쓰는 데이터(테이블·SP·
온톨로지·쿼리)를 사용자가 직접 지정해 프롬프트에 **실제 스키마**를 주입한다. Mockup/UI Pattern
과 달리 **독립 · 다중 선택**(상호 배타 아님 — §12.2). 컬럼 추측으로 인한 `Invalid column name`
오류(§13.6 RT4)와 테이블 표류(§13.7 RT5)를 사용자 지정으로 원천 차단.

### 15.1 UI — `DataSourcePickerDialog` (3탭 JARVIS 풀스크린)
- 파일 D&D **아래** [Data Source 선택] 버튼 → 풀스크린 팝업. 하단에 선택 **바스켓**(누적).
- 바스켓 item `{ kind, key, label, meta }` —
  `kind ∈ TABLE | SP | ONTOLOGY_QA | ONTOLOGY_INTENT | ONTOLOGY_SP | INLINE_QUERY`.
- **DB Entity 탭** — `DataConstellation` (Canvas 2D 별자리 맵): 도메인 접두어(TB_FP·SP_UI_CM…)
  = 빛나는 "은하", 테이블/SP = "별". 은하 클릭 → 도메인 전개(테이블/SP 별 + FK·SP사용 엣지),
  별 클릭 → 바스켓 토글. 휠 줌 0.12~9.0 (라벨 글자도 배율 비례 — 객체명 가독성).
  `목록 보기` 토글 = 빠른 검색 fallback. 우측 패널에 hover/선택 노드의 실제 컬럼/파라미터.
- **Ontology 탭** — `OntologyTab`: Q&A / 화면 의도(View 온톨로지) / UI 사용 SP 3섹션. `OntologyList` 공용.
- **Query Inline 탭** — `QueryInlineTab`: SQL 직접 입력 + `쿼리에서 테이블 추출`(존재·컬럼 검증).

### 15.2 Backend — 스키마 목록·그래프 endpoint
`SchemaInspectionController` (`/composer/schema`):
- `GET /tables?targetCd=` · `GET /procedures?targetCd=` — 전체 목록 (도메인 키 부여).
- `GET /graph?targetCd=&domain=` — 한 도메인의 노드 + intra-domain 엣지(FK·SP사용 best-effort).
- 모두 세션 Target DB(MSSQL)의 `INFORMATION_SCHEMA`/`sys.*` 조회 — `TargetDataSourceRegistry`
  라우팅. 미연결 시 `connected:false` + 빈 결과 (throw/500 금지).
- `SchemaMetaCache` — targetCd 별 10분 TTL 캐시. DB 연결정보 변경 시 `evict(targetCd)`.
- `SchemaNaming.domainOf()` — 도메인 키 단일 규칙: `TB_FP_*`→`FP` · `SP_UI_CM_*`→`CM` ·
  `SP_COMM_*`→`COMM` · `FN_G_*`→`G` · 접두어 규약 없으면 첫 토큰.

### 15.3 프롬프트 주입
`ModeNewGeneral` 의 `systemContext` 에 `=== 데이터 소스 (사용자가 DB 객체에서 직접 선택 —
권위 있는 지정) ===` 블록 추가 — TABLE 은 실제 컬럼(+PK), SP 는 파라미터, 온톨로지/쿼리는 원문.
**이 블록의 테이블/SP 는 절대 다른 테이블로 대체 금지** (§13.7 · `ComposerPromptBuilder`
INVARIANTS §②-2). 컬럼/파라미터는 토큰 절감 명목으로도 자르지 않음 (§16.2).

### 15.4 파일
- frontend (`view/util/t3composer/`): `DataSourcePickerDialog · DataConstellation · DbEntityTab ·
  OntologyTab · QueryInlineTab · OntologyList · dataSourceStore.js` · `ModeNewGeneral.jsx`(통합) ·
  `api.js`(`listSchemaTables`/`listSchemaProcedures`/`getSchemaGraph`)
- backend (`domain/schema/`): `SchemaInspectionController · SchemaInspectionService ·
  ProcedureInspectionService · SchemaMetaCache · SchemaNaming · TableSummary · ProcedureSummary ·
  SchemaGraph`

## 16. 토큰 절감 — 대화 prefix 프롬프트 캐싱 (2026-05-16)

Composer 의 Claude 호출 입력 토큰 절감. 출력 토큰(생성 코드 분량)은 줄일 수 없어 입력만 대상.

### 16.1 대화 prefix 캐싱 (★ 핵심)
- `ComposerService.buildRequest` → `applyMessageCacheBreakpoint(messages)`: **마지막 메시지의
  마지막 content block 에 `cache_control: ephemeral`** breakpoint 부착.
- 이전엔 system 블록 1개만 캐시 → messages(이전 응답 코드 15~30K + 첫 메시지 systemContext
  15~25K)는 후속 턴·auto-continuation 마다 풀가격 재전송. 이제 **system + 대화 전체**가 캐시
  prefix → 후속 호출이 90% 할인 `cache_read`.
- Anthropic cache breakpoint 4개 한도 — system 1 + 메시지 1 = 2개.
- 평문 String content 는 cache_control 부착 단일 text block 배열로, 멀티모달(첨부)은 마지막 block 에 추가.
- 검증: backend 로그 `Anthropic prompt cache: ... cache_read=` — 후속 호출 `cache_read` 가
  대화 분량까지 포함해 증가.

### 16.2 per-message 페이로드 상한 (ModeNewGeneral systemContext)
- UI Pattern lite HTML: 20K → **8K자** 상한 (실제 최대 ~7.2KB).
- D&D 텍스트 첨부: 파일당 **12K자** inline 상한 (초과분 생략 표기).
- 인라인 쿼리: 쿼리당 **4K자** 상한.
- ★ 테이블 컬럼·SP 파라미터는 **상한 없음** — 환각 방지(§13.7·§15.3)의 핵심 페이로드, 절대 자르지 않음.

### 16.3 system 프롬프트
- `ComposerPromptBuilder.buildStaticSystemPrompt` 의 INVARIANTS §①~⑩ "재확인" recap(순수 중복)
  삭제. INVARIANTS 전문은 BASE_SYSTEM 에 그대로 — 가드레일 본문 불변.
- system 프롬프트는 이미 캐시되므로 심층 구조 개편은 안 함 (절감 효과 제한적 + 가드레일 약화 위험).

### 16.4 Anti-patterns
| ❌ | ✅ |
|---|---|
| `buildRequest` 에서 마지막 메시지 cache_control 제거 | 유지 — 없으면 대화 prefix 캐시가 깨져 후속 호출 풀가격 |
| 테이블 컬럼/SP 파라미터를 토큰 절감 명목으로 잘라냄 | 컬럼/파라미터는 그대로 — 환각 방지 페이로드 (§13.7) |
| `max_tokens`(100K) 를 토큰 절감 목적으로 낮춤 | max_tokens 는 출력 상한일 뿐 과금 아님 — 손대지 않음 |

## 17. 화면 실행 SQL 미검증 + SQL 실행 Target DB 라우팅 (2026-05-16)

**화면 실행(preview)은 SQL 을 검증하지 않는다.** 화면 실행 = Sample 모드(§14.4) — 화면은
sample 데이터로 렌더되고 실제 SP 를 호출하지 않으므로, SP/DDL 이 존재·동작할 필요가 없다.

### 17.1 preview — SQL_DDL/SQL_SP 실행 skip
- `ArtifactPreviewService.applyPreview` 가 Sample 모드(`skipJava=true` — 화면 실행 기본)에서
  `TYPE_SQL_DDL`·`TYPE_SQL_SP` 를 **실행하지 않고 skip** (Java 와 동일). `skippedSqlRec` 기록.
- preview `success` = JSX 렌더(+MENU) 기준 — SP/DDL 실패가 화면 실행을 오류 처리하지 않는다.
- 이전 버그: SP 를 (정적 DB 에) 실행 → 환경 불일치로 실패 → `spFail>0` → `success:false` →
  화면은 정상인데 "오류로 인지" + 불필요한 AI 자동보완 트리거.
- SP/DDL 의 실제 검증·적용은 **[아티팩트 실행]** 단계에서 수행.

### 17.2 SQL 실행 — 세션 Target DB 라우팅
- `ArtifactApplyService.execSqlBatch`/`executeRawDdl` 가 정적 `targetDataSource` 가 아닌
  **세션 `targetCd` 의 Target DB**(`TargetDataSourceRegistry.getDataSource(targetCd)`)에서 실행
  (`resolveExecDataSource`). Target 미설정·연결 불가 시 정적 `targetDataSource` 폴백.
- 신규 화면 오류 여부(테이블 충돌·컬럼)도 Target DB 기준 — `checkTableNameCollisions(targetCd)`
  (§13.7) + SP 실행이 모두 세션 Target DB 에서 판정.

### 17.3 Anti-patterns
| ❌ | ✅ |
|---|---|
| 화면 실행(Sample) 에서 SP/DDL 을 실행해 실패 시 화면을 오류로 판정 | preview 는 JSX 렌더만 판정 — SQL 검증은 [아티팩트 실행] 단계 |
| SQL 을 정적 `targetDataSource` 에 실행해 세션 Target 과 불일치 | `resolveExecDataSource(a)` → 세션 targetCd 의 Target DB |

## 18. EXISTING_MODIFY — 메뉴 소스를 세션 아티팩트로 import (2026-05-16)

기존 화면 수정(자연어) 시작 시, 선택 메뉴의 **현재 소스 전체를 세션 아티팩트로 import** 한다 —
사용자가 아티팩트 트리에서 "현재 기준 baseline" 을 보고 필요한 파일만 수정하도록.

- `ModeExistingModify.handleStartNl` 가 `createSession` 후 `importSourceArtifacts(sid, sourceBundle)`
  호출. `POST /composer/sessions/{id}/import-source-artifacts` → `ComposerService.importSourceArtifacts`.
- `collectSourceForLlm` 번들(`screen` + `backend.{controllers,services,repositories,entities,procedures}`)
  의 각 파일을 `ComposerArtifact` 로 저장: type 매핑(SCREEN_JSX·JAVA_*·SQL_SP) · `status=DRAFT` ·
  `messageId=null`(=원본 baseline) · `filePath`=번들 경로 그대로.
- 프롬프트는 "===FILE: 경로를 원본 그대로 출력" 을 지시 — Claude 수정본이 같은 filePath 면
  `saveWithSupersede` 가 baseline 을 자동 갱신(이전 버전 DISCARDED). 미변경 파일은 baseline 유지.
- SP DDL 은 `collectSourceForLlm` 이 수집하지 못함(경로 미마운트) — JSX+Java 위주.
- 메뉴 트리 UI(`MenuTreeBrowser`)는 파스텔 글래스 테마로 개편 (표시명 1행 · MENU_CD+경로 2행).
- import 된 원본 화면은 `react-router-dom` 등 임의 npm 모듈을 쓸 수 있다 — 미리보기 런타임
  (`src/preview/runtime.js`)이 `react-router-dom`/`react-router` 를 격리용 stub 으로 제공하고
  (실제 라우터는 Router 컨텍스트 필요 → 훅·컴포넌트 stub), 그 외 미등록 npm 모듈도 하드 에러
  대신 Proxy stub 으로 대체해 best-effort 렌더한다 (블로킹 "모듈 실행 실패" 모달 제거).

## 관련 파일

### 백엔드 (Phase 1~2)
- `backend/src/main/java/com/zionex/t3composer/domain/service/{ArtifactPreviewService,JavaArtifactRewriter,ArtifactApplyService}.java`
- `backend/lombok.config` — `copyableAnnotations += @Qualifier`
- `backend/src/main/java/com/zionex/t3composer/shared/data/ResponseMessage.java` — `ofSuccess/ofFail` 별칭

### 백엔드 (Phase 3 — Target DB 직접 접근 + Source Bundle)
- `domain/controller/TargetSystemController.java` — `PUT /db-connection` · `POST /db-connection/test`
- `domain/controller/TargetMenuController.java` — `GET /target/menus?target=<cd>` + 2가지 sync endpoint
- `domain/controller/InsightSourceController.java` — `POST /insight-apicall/screen-metadata/collect-source-for-llm`
- `domain/service/JpaMethodSqlMapper.java` — JPA 메서드 → SQL 추론
- `domain/service/PrefillFromSourceService.java` — AI prefill prompt (SP 오분류 방어 강화)
- `config/PrimaryDataSourceConfig.java` — `composerJdbcTemplate` Primary bean
- `config/TargetDataSourceRegistry.java` — Target 별 on-demand DataSource 캐시
- `config/TargetDbConnectionEnvLoader.java` — startup env → DB UPDATE

### 프런트엔드 (Phase 1~2)
- `frontend/src/shim/wingui/common/{imports.js, BaseGrid.jsx, realgrid-license.js}`
- `frontend/src/view/util/t3composer/{ComposerWorkspace,PreviewEmbed,SplitPane,ArtifactPanel}.jsx`

### 프런트엔드 (Phase 3)
- `MenuTreeBrowser.jsx` — activeTargetCd prop · `loadTargetMenuTree(lang, targetCd)` · sync 버튼
- `TargetSystemSelector.jsx` — dropdown 의 [💾 Storage] 버튼
- `TargetDbConnectionDialog.jsx` — JDBC URL/계정 입력 + 연결 테스트
- `targetStore.js` — currentTargetCd 영속화 (localStorage)
- `SourceBundleSection.jsx` — `SourceBundleAnalysisPanel` + `SourceBundlePreview` 공용
- `InferredSqlPanel.jsx` — Repository queryMethods collapsible 표시
- `ModeNewFromCopy.jsx` / `ModeExistingModify.jsx` — 위 컴포넌트 import
- `steps/Step4DataBinding.jsx` — JPA_ENTITY 모드일 때 InferredSqlPanel 표시 (sourceBundle prop)
- `api.js` — `loadTargetMenuTree(lang, targetCd)` · `collectSourceForLlm(menuCd, targetCd)` · `updateTargetDbConnection` · `testTargetDbConnection`

### 인프라 / 설정
- `docker-compose.yml` — `TARGET_T3SERIES_DB_*` 환경변수 전달
- `docker/{backend,frontend}/{Dockerfile,entrypoint.sh}`
- `backend/src/main/resources/application{,-dev}.yaml` — `target.seed.t3series.*` 바인딩
- `.env.example` — Per-Target DB 변수 템플릿
- `docker/db/init-pg/23_target_system_db_connection.sql` — DB 컬럼 추가 migration
- `docker/db/init-pg/24_target_seed_db_connection.sql` — T3SERIES 기본값 seed

### 문제 해결
- `TROUBLESHOOTING.md §10~15`

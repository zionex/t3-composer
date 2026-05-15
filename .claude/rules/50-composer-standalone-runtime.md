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
    - ${COMPOSER_WINGUI_REF_PATH}:/workspace/wingui:ro               # 부모 wingui (NEW_FROM_COPY 참조)

composer-frontend:
  volumes:
    - ./frontend:/app
    - /app/node_modules                                              # 익명 volume (npm install 결과)
    - ${COMPOSER_WINGUI_REF_PATH}:/workspace/wingui:ro               # entrypoint 가 realgrid 복사
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
   ├─ SQL DDL/SP → composer-db 에 정식 이름 실행 (CREATE OR ALTER, SP_DROP_GUARD 화이트리스트)
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
| `view/common/CommonCodeSelect.jsx` | wingui PopCommonCode | wrapBox + Select |
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
| `POST /composer/target/menus/sync-from-wingui` | 부모 wingui 의 menus.js 를 target-mssql(폴백 DB) 의 TB_AD_MENU 에 동기화 (멱등) |
| `POST /composer/target/menus/langpack/sync-from-wingui` | upgrade SQL 파일들의 INSERT 추출 → target-mssql 의 TB_AD_LANG_PACK 에 sync |

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

### 8.3 ResponseMessage 별칭
LLM 산출물이 자주 환각하는 `ResponseMessage.ofSuccess()` / `ofFail(msg)` 호출을 컴파일 가능하게 alias 추가:
```java
public static ResponseMessage ofSuccess()      { return ok(); }
public static ResponseMessage ofSuccess(String m) { return ok(m); }
public static ResponseMessage ofFail(String m)    { return error(m); }
```

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
git 동기화로 backend 코드가 바뀌면 다음 3가지가 컨테이너에 자동 반영되지 **않으므로** 수동 조치:

1. **신규 npm 의존성** — `package.json` 에 새 의존성이 들어오면 컨테이너 `node_modules` 에 없다.
   `docker compose exec -T composer-frontend npm install --legacy-peer-deps` → frontend 재시작.
   (예: `@babel/standalone` 누락 → `Module not found` 컴파일 에러)
2. **신규 DB 마이그레이션** — `docker/db/init-pg/*.sql` 의 새 파일은 composer-db **최초 생성 시에만** 실행된다
   (`composer-db-init` 이 `T3COMPOSER_INIT_DONE` 마커로 멱등 skip). 기존 DB 볼륨에는 미적용 →
   backend Entity ≠ DB 테이블 → `column "..." does not exist` 로 해당 테이블 조회가 전부 500.
   조치: 누락 마이그레이션을 수동 적용 (모두 `IF NOT EXISTS`/조건부 — 멱등):
   `docker compose exec -T composer-db psql -U composer -d T3SMARTSCM -v ON_ERROR_STOP=1 < docker/db/init-pg/<NN>_*.sql`
   누락 여부는 `information_schema.columns` 로 Entity 기대 컬럼과 대조.
   (예: `25~28` 미적용 → `tb_cmp_target_system.database_ref_path/source_ref_path/menu_source` 누락 → Target 로딩 실패)
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
| `ResponseMessage.builder().message(...).build()` (Lombok @Builder 없음) | `ResponseMessage.ok()` / `ok(msg)` / `error(msg)` / `ofSuccess()` / `ofFail(msg)` 정적 팩토리 |
| `g.dataProvider.getAllStateRows()` 직전 commit 없음 → `Client is editing` 오류 | shim `GridSaveButton` / `GridDeleteRowButton` 진입 시 `g.commit(true)` 자동 호출 |
| target=T3SERIES 로 메뉴 조회했는데 응답이 `source: "local"` | tb_cmp_target_system 의 db_url 미설정 또는 연결 실패 — [Storage 다이얼로그 → 연결 테스트] 확인 |
| `JdbcTemplate` 무지정 인젝션 — Spring 이 어느 DataSource wire 할지 불확정 | `@Qualifier("composerJdbcTemplate")` (메타) 또는 `@Qualifier("targetJdbcTemplate")` (운영) 명시 |
| AI prefill 이 `source: "SP"` 라고 했지만 spName/crudSp 모두 비어있음 | `mergeAiSpecIntoBaseSpec` 사후 정합화 — baseUrl/entity 있으면 자동 JPA_ENTITY 전환 |
| `ModeNewFromCopy` / `ModeExistingModify` 각자 local `SourceBundlePreview` 정의 | `SourceBundleSection.jsx` 공용 컴포넌트 import |
| `.env` 의 `TARGET_<CD>_DB_*` 수정만 하고 backend 재기동 안 함 | `docker compose up -d --force-recreate composer-backend` 로 `TargetDbConnectionEnvLoader` 발화 (§6.5.1) |
| JDBC URL 에 SSL 옵션 `encrypt=true;trustServerCertificate=true` 누락 | MSSQL JDBC 12+ 의 default encrypt=true 때문에 연결 거부. 기존 endpoint 의 옵션 패턴 그대로 복사 |
| `composer-db` 의 `tb_cmp_target_system` 을 직접 UPDATE 하고 registry invalidate API 미호출 | `PUT /composer/targets/{cd}/db-connection` 사용 (저장 + invalidate 자동) 또는 backend 재기동 |
| webpack `devServer.static.watch` 를 `{ usePolling:true }` 로 둠 → public/t3mes-split 1460+ 파일 폴링 → 번들 0바이트 전송 끊김 | `static: { watch: false }` (src 변경은 watchOptions.poll 담당) — Hook `build-config.sh` W1 |
| 소스 동기화 후 `docker/db/init-pg/` 신규 마이그레이션을 기존 composer-db 에 미적용 → `column "..." does not exist` | 누락 마이그레이션 수동 적용 (`psql ... < init-pg/<NN>_*.sql` — 멱등) §10 |
| 동기화 후 `package.json` 신규 의존성을 컨테이너에 미설치 → `Module not found` | `npm install --legacy-peer-deps` 후 frontend 재시작 §10 |
| 자동보완 카운터를 자동 재실행 경로에서도 리셋 → 오류 무한루프 | 카운터는 수동 [화면 실행] 시에만 리셋 · MAX_AUTOFIX(3) 상한 + 동일오류 중단 §14.2 |
| `handlePreview` 의 'ready' 자동닫기 setTimeout 이 'autofixing' 토스트를 무조건 제거 | 함수형 업데이트로 `phase==='ready'` 일 때만 닫기 §14.3 |
| flex column 자식이 스크롤돼야 하는데 조상 Box 에 `minHeight:0` 누락 → 스크롤 미발생·콘텐츠 잘림 | 스크롤 자식까지 이어지는 모든 flex 조상에 `minHeight:0` §14.5 |
| 다크 그라데이션 헤더/히어로 (`#0f172a`·`linear-gradient(#1e3a8a…)`) | theme.js 파스텔 글래스 — 반투명 그라데이션 + backdrop-blur + 흰 반투명 보더 §14.6 |
| 미리보기를 고정 scale 로 축소 → 패널보다 좁아 검은 여백 | ResizeObserver 로 패널 폭 측정 → 동적 배율 (`패널폭/원본폭`) §14.6 |

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
자연어(NEW_NL) 입력 화면의 "선택사항" 영역 — 3개 기능 **단독(상호 배타) 적용**:

| 기능 | POPUP | Claude 전달 |
|---|---|---|
| SCM UI Mockup 선택 | `MockupPickerDialog` (좌 목록 + 우 컴포넌트 미리보기) | mockup 메타·레이아웃 카테고리 |
| UI Pattern 선택 | `UiPatternPickerDialog` (좌 목록 + 우 iframe 미리보기) | 선택 패턴의 lite HTML 마크업 인라인 |
| 참조 파일 첨부 | 하단 전용 D&D 영역 (drop / 클릭 파일탐색) | 텍스트=prompt inline · binary=attachments |

- 하나를 선택하면 나머지 둘은 자동 해제 — `selectedMockup` / `selectedUiPattern` / `attachments` 중 하나만 유효.
- KPI/Chart 사전 선택 트리거는 선택한 Mockup/UI Pattern 이 Chart·Dashboard·Monitoring 류일 때만 노출.
- 미리보기: Mockup 은 lazy 컴포넌트를 가상화면(1400×900) scale 렌더, UI Pattern 은 `srcUrl` iframe.

## 13. 산출물 화면 실행 오류 재발 방지 — shim 완전성 + 디자인 규약 (2026-05-16)

> 화면 생성 후 [화면 실행] 시 반복 발생하는 런타임 오류를 **구조적으로 차단**한다.
> 핵심 원리: 단독 환경에서 산출물은 부모 wingui-core 가 아니라 **shim 으로 동작**하므로,
> shim 이 산출물이 쓰는 표면을 100% 커버해야 한다.

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

### 13.2 화면 실행 반복 오류 카탈로그 (Anti-patterns)

| # | 증상 | 근본 원인 | 차단 장치 |
|---|---|---|---|
| RT1 | `Element type is invalid: ... got: undefined` | 산출물이 import 한 컴포넌트를 shim 이 미보유 (예: `VLayoutBox`/`HLayoutBox` 누락 — 2026-05) | §13.1 shim 완전성 + Hook CG-SHIM |
| RT2 | `xxx.find/map/flatMap is not a function` | 리스트 state 가 배열이 아닌 값(객체/undefined)으로 set 됨 — API 빈 응답·sample interceptor 객체 응답 | §13.4 배열 가드 |
| RT3 | 산출물 소스가 전부 빈 0바이트 | LLM 이 `===FILE:` 마커를 자체 코드펜스로 감쌈 → `ArtifactExtractor` 정규식 미인식 | §13.5 + extractor 정규식 보강 (마커-본문 사이 고립 ``` 허용) |

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
- LLM 이 마커를 자체 펜스로 감싼 변형(` ``` ` / `===FILE:...===` / ` ``` ` / ` ```lang `)도
  `ArtifactExtractor.FILE_BLOCK` 정규식이 인식 (마커-본문 사이 고립 ` ``` ` 줄 선택 허용).
- 기존 세션의 빈 산출물 복구: `POST /composer/sessions/{id}/artifacts/re-extract` —
  assistant 응답을 LLM 재호출 없이 다시 파싱.

## 14. 화면 실행 AI 자동보완 + 산출물 UI 보강 (2026-05-16)

> [화면 실행] 후 런타임 오류가 나면 AI 가 산출물을 자동 수정·재실행한다.
> 사용자가 오류를 직접 분석할 필요 없이 화면이 자동으로 고쳐진다.

### 14.1 화면 실행 후 런타임 오류 → AI 자동보완

- ComposerWorkspace 헤더 [화면 실행] 옆 **[오류 시 자동보완] 체크박스** (기본 ON).
- 흐름: `PreviewEmbed` 오류 포착 → `onError` → `ComposerWorkspace.handlePreviewError`
  → `ChatPanel.sendMessage(오류+스택)` (같은 세션 채팅) → AI 산출물 수정
  → `handlePreview` 재실행. 재실행 후 또 오류면 attempt+1 로 반복.
- **오류 포착 3경로** (`PreviewEmbed`):
  - load 오류 (transform/execute) — `loadPreviewComponent().catch`
  - render 오류 — `PreviewErrorBoundary` (iframe React 루트 안에서 산출물 Component 래핑)
  - runtime/promise 오류 — iframe window 의 `error` / `unhandledrejection` 리스너
    (`ResizeObserver loop` · `Script error` 는 양성 → 무시)
  - **load 당 1회만** 보고 (`reportedRef` — 매 load 시작 시 리셋)
- `ChatPanel` 은 `forwardRef` + `useImperativeHandle({ sendMessage })` 로
  프로그램적 채팅 전송 노출. `send` 는 성공/실패를 boolean 으로 반환.

### 14.2 무한루프 3중 차단 (필수)

| # | 차단 | 메커니즘 |
|---|---|---|
| 1 | 횟수 상한 | `autoFixAttemptRef >= MAX_AUTOFIX(3)` 이면 중단. 카운터는 **수동 [화면 실행] 버튼**에서만 0 리셋, 자동 재실행 경로(handlePreviewError→handlePreview)는 리셋 안 함. 보완 중 버튼 비활성(previewStage) → 사이클 중 리셋 불가 |
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
  (빈 응답 휴리스틱 sample 주입 + Java 적용·mvn·재기동 SKIP).

### 14.5 산출물 소스 패널 스크롤 — flex `minHeight:0` 체인

- flex column 자식이 `overflow:auto` 로 스크롤되려면 **스크롤 자식까지 이어지는
  모든 flex 조상에 `minHeight:0`** 이 있어야 한다 (없으면 콘텐츠 높이만큼 늘어나 스크롤 미발생).
- 사고: ComposerWorkspace 우측 Tab 컨테이너 Box 에 `minHeight:0` 누락 → 산출물 소스가
  길어도 스크롤 없이 잘림.

### 14.6 디자인 일관성 — 파스텔 글래스 (theme.js)

- **모든 화면** (Composer · History · UI Pattern · Gallery · picker 다이얼로그) 은
  `theme.js` 파스텔 글래스 룩 적용. **다크 그라데이션 헤더/히어로 금지**.
  - 히어로: 반투명 파스텔 그라데이션 (`rgba(169,199,238,…)` 계열) + `backdrop-filter:blur`
    + 흰 반투명 보더 + inset 하이라이트 + 깊이 그림자. 글자는 `#3A4A63` 파스텔 다크.
  - 팔레트: primary `#7CA7E0` · 성공 `#86C7A8` · 정보 `#8FC4D4` · 강조 `#9D8FD4`.
- `MockupPickerDialog` 미리보기 — **고정 scale 금지**. `ResizeObserver` 로 패널 폭 측정 →
  `배율 = 패널폭 / 원본폭(1400)` 동적 산정 → 우측 검은 여백 제거 + 세로 스크롤.
- 엔진 선택(`ModeNewGeneral`) — 선택 엔진은 **단색 채움 + 흰 글자 + 체크 아이콘 + 확인 칩**
  (미선택은 흰 바탕·흐린 회색) 으로 명확히 대비.

### 14.7 Anti-patterns

| ❌ | ✅ |
|---|---|
| 자동보완 카운터를 자동 재실행 경로에서도 리셋 → 무한루프 | 수동 버튼에서만 리셋 · MAX 3 + 동일오류 중단 (§14.2) |
| 'ready' 닫기 타이머가 autofixing 토스트 제거 | `setPreviewStage((s)=> s?.phase==='ready' ? null : s)` (§14.3) |
| 자동보완 도는데 PreviewEmbed 가 오류 화면만 표시 | `autoFixing` prop → 'AI 자동보완 중' 전용 화면 (§14.3) |
| 산출물 소스 스크롤 자식의 flex 조상에 `minHeight:0` 누락 | 조상 전체 `minHeight:0` 체인 (§14.5) |
| 미리보기 고정 scale → 검은 여백 | ResizeObserver 동적 배율 (§14.6) |
| 다크 그라데이션 헤더 | 파스텔 글래스 (§14.6) |

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
- `api.js` — `loadTargetMenuTree(lang, targetCd)` · `collectSourceForLlm(menuCd, targetCd)` · `updateTargetDbConnection` · `testTargetDbConnection` · `syncTargetMenusFromWingui` · `syncTargetLangpackFromWingui`

### 인프라 / 설정
- `docker-compose.yml` — `TARGET_T3SERIES_DB_*` 환경변수 전달
- `docker/{backend,frontend}/{Dockerfile,entrypoint.sh}`
- `backend/src/main/resources/application{,-dev}.yaml` — `target.seed.t3series.*` 바인딩
- `.env.example` — Per-Target DB 변수 템플릿
- `docker/db/init-pg/23_target_system_db_connection.sql` — DB 컬럼 추가 migration
- `docker/db/init-pg/24_target_seed_db_connection.sql` — T3SERIES 기본값 seed

### 문제 해결
- `TROUBLESHOOTING.md §10~15`

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

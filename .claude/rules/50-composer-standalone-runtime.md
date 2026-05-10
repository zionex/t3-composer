# 50. T3Composer 단독 환경 런타임 인프라

> 부모 t3series-wingui 와 분리된 t3-composer 의 docker 단독 환경에서 **산출물을 docker 안에서 실제 운영 형태로 검증**하기 위한 인프라 정의. 2026-05 Phase 1~2c 통합 결과물.

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

## 6. 운영 가이드

### 사용자 흐름
1. Composer 메인 → 자연어/설계서/복사 모드로 화면 생성
2. 헤더 [화면 실행] → 우측 Tab 의 [실행 화면 LIVE] 에 inline 노출 → 검증
3. 검증 OK → [메뉴 등록] (TB_AD_MENU INSERT) + [아티팩트 실행] (정식 staging output)
4. wingui sync (./sync/manifest-from-staging → sync-files-to-wingui → sync-db-to-wingui)

### 개발자 가이드
- backend 코드 변경 시 컨테이너 안에서 `mvn -B -DskipTests compile` → DevTools restart (단 trigger-file 은 명시 touch 해야 — `echo $(date +%s) > /app/target/classes/.devtools-restart-trigger`)
- frontend 코드 변경 시 webpack polling 자동 hot-reload (1초)
- 큰 의존성 변경 시 `docker compose down composer-backend && docker compose up -d composer-backend` (down + up)

## 7. Anti-patterns (단독 환경 한정)

| ❌ | ✅ |
|---|---|
| 컨테이너 안 backend 가 자기 자신을 mvn 에서 동기 호출 | 별도 daemon thread + trigger-file 로 비동기 |
| `target/classes` 안 .class 파일을 watch 해 자동 restart | trigger-file 만 watch (random class 변경 무시) |
| 부모 wingui-core 통째 webpack alias 매핑 | shim 으로 핵심만 (BaseGrid + layout) — 의존성 도미노 회피 |
| RealGrid2 license 누락 → 콘솔 에러 | `window.realGrid2Lic` + `setLicenseKey()` 양쪽 등록 |
| 산출물 java 의 wingui 패키지를 그대로 컴파일 시도 | JavaArtifactRewriter 의 자동 패키지/import 변환 |
| MENU_CD 충돌 무시하고 정식 INSERT | preview 는 `__PV<sid8>` suffix 로 격리 INSERT |

## 관련 파일

- 백엔드: `backend/src/main/java/com/zionex/t3composer/domain/service/{ArtifactPreviewService,JavaArtifactRewriter,ArtifactApplyService}.java`
- 프런트: `frontend/src/shim/wingui/common/{imports.js, BaseGrid.jsx, realgrid-license.js}` · `frontend/src/view/util/t3composer/{ComposerWorkspace,PreviewEmbed,SplitPane,ArtifactPanel}.jsx`
- 인프라: `docker-compose.yml` · `docker/{backend,frontend}/{Dockerfile,entrypoint.sh}` · `backend/src/main/resources/application{,-dev}.yaml`
- 문제 해결: `TROUBLESHOOTING.md §10~15`

# 트러블슈팅

자주 발생하는 문제들과 대처법.

## 1. composer-db 컨테이너가 healthy 상태가 안 됨

**증상**
```
docker compose ps
→ composer-db ... Status: Up (unhealthy)
```

**원인 + 대처**
- MSSQL_SA_PASSWORD 가 정책 미충족 (8자 이상, 대소문자+숫자+특수문자)
  - `.env` 의 `MSSQL_SA_PASSWORD` 확인. 기본 `Composer!2026` 은 정상.
- 메모리 부족 (MSSQL 은 최소 2GB 권장)
  - Docker Desktop 메모리 4GB 이상 할당
- 첫 부팅 시 SQL Server 가 metadata 작성 시간이 걸림 — `start_period: 30s` 외에도 1분 정도 더 기다려야 할 수 있음

```bash
docker logs composer-db --tail 100   # SQL Server 로그 확인
```

## 2. composer-db-init 가 SQL 적용 중 실패

**증상**
```
docker logs composer-db-init
[init]   /init/04_composer_session_message_artifact.sql
[init] FAILED at /init/04_composer_session_message_artifact.sql
```

**원인**
- 부모 SQL 안의 메뉴 등록 부분 (TB_AD_MENU INSERT) 이 PARENT lookup 실패. 03_wingui_seed_menus_users.sql 가 먼저 실행되어 MENU_UTIL/DP/MP/... 시드되어 있는지 확인.
- 실행 순서 잘못 (init 컨테이너 entrypoint 의 glob `/init/0[2-9]_*.sql /init/[1-9][0-9]_*.sql` 확인)

**대처**
```bash
# 마커 row 삭제 후 재시도
docker exec -it composer-db /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "Composer!2026" -C \
  -d T3SMARTSCM -Q "DROP TABLE IF EXISTS T3COMPOSER_INIT_DONE"

docker compose down composer-db-init
docker compose up composer-db-init
```

## 3. composer-backend 가 빌드 실패 (mvn compile 에러)

**증상**
```
docker compose build composer-backend
→ ERROR: cannot find symbol class XYZ
```

**원인 후보 + 대처**

(A) **부모에서 누락된 의존 클래스** — Composer 가 import 하는 wingui 클래스가 shared/ 에 미복사
```
[ERROR] /build/src/.../X.java:[12,30] cannot find symbol
  symbol:   class FooBar
  location: package com.zionex.t3composer.shared.foo
```
→ 부모 wingui 의 해당 클래스를 cp 후 sed 로 패키지 변경

(B) **string literal 안의 주석/검증 메시지** — `cannot find symbol class t3series` 같은 에러는 sed 가 일부 변환 못 한 케이스
→ `grep -rn "com\.zionex\.t3series\." backend/src/main/java/` 로 잔존 import 확인

(C) **AnthropicApiKeyService 의 TB_IS_EXTRNLAPIKEY 누락** — JPA 가 ddl-auto=none 인데 init SQL 누락
→ docker/db/init/12_extrnl_api_key.sql 가 적용됐는지 확인

(D) **backend/pom.xml 에 누락된 외부 의존성** (2026-05-07 사고) — shared/util 의 `SecurityUtils` / `UUIdV7Generator` 등이 외부 라이브러리에 의존하는데 backend/pom.xml 에는 미반영. 처음 띄울 때 자주 발생.

| 누락 클래스 | 필요 의존성 | groupId / artifactId / version |
|---|---|---|
| `org.jasypt.encryption.pbe.PBEStringEncryptor` 등 | Jasypt | `org.jasypt:jasypt:1.9.3` |
| `org.bouncycastle.jce.provider.BouncyCastleProvider` | BouncyCastle | `org.bouncycastle:bcprov-jdk15on:1.70` |
| `com.fasterxml.uuid.Generators` | java-uuid-generator | `com.fasterxml.uuid:java-uuid-generator:5.2.0` |

→ `backend/pom.xml` `<dependencies>` 에 추가. 부모 `t3series/pom.xml` 의 BOM 버전 그대로 쓰는 게 표준.

(E) **shared/util 의 same-package 호출 클래스 자체가 누락** — `UUIdV7Generator.java` 가 `SqlUtils.createUUID()` 호출하는데 SqlUtils.java 가 backend 에 없음. import 가 없으니 grep 으로는 안 잡히고 컴파일에서만 발견.
```
[ERROR] /build/src/main/java/com/zionex/t3composer/shared/util/UUIdV7Generator.java:[12,16] cannot find symbol
  symbol:   variable SqlUtils
```
→ 부모 `t3series-common/src/.../util/SqlUtils.java` 를 backend 의 동일 위치에 복사 후 패키지 라인만 `com.zionex.t3composer.shared.util` 로 변경.

**한 번에 미리 점검하는 grep**:
```bash
grep -rh "^import com.zionex" backend/src/main/java | sort -u
# 결과 import 들의 클래스 파일이 backend/src 에 모두 존재하는지 확인.
# (단, same-package 호출 — import 없이 사용하는 클래스 — 은 이 grep 으로 못 잡으므로 mvn compile 에 의존)
```

## 4. composer-frontend 가 빈 화면

브라우저 진입 시 흰 바탕만 나옴. **F12 → Console** 의 첫 빨간 에러로 케이스 분기.

(A) **`Module not found: @wingui/...`** — shim alias 가 webpack 에 매핑 안 됨
→ `frontend/webpack.config.js` 의 `resolve.alias` 부분 확인. `@wingui/*` 5개 + `@zionex/*` 3개 alias 모두 있어야 함.

(B) **`Module not found: ../../common/<X>`** (2026-05-07 사고) — frontend/src/view/common/ 에 `<X>.jsx` 미존재. 부모 wingui 에서 누락된 컴포넌트 (예: `LlmMarkdown`).
→ `cp C:/Project/t3series/t3series-wingui/packages/wingui/src/view/common/<X>.jsx frontend/src/view/common/<X>.jsx`. 새 디렉토리를 처음 만든 경우 webpack file watcher 가 못 잡으므로 `docker compose restart composer-frontend`.

**한 번에 점검**:
```bash
grep -rh "from ['\"]\(\.\.\/\)\+common/" frontend/src --include="*.jsx" --include="*.js" | sort -u
# 결과 컴포넌트들이 frontend/src/view/common/ 에 모두 존재하는지 ls 로 비교.
```

(C) **`Uncaught ReferenceError: process is not defined`** (2026-05-07 사고) — webpack 5 는 브라우저 번들에 `process` 전역을 자동 주입하지 않음. `index.jsx`/`App.jsx` 에서 `process.env.X` 직접 사용 시 런타임 throw.
→ `frontend/webpack.config.js` 에 `webpack.DefinePlugin` 추가:
```js
const webpack = require('webpack');
// plugins: 배열에
new webpack.DefinePlugin({
  'process.env.COMPOSER_API_BASE': JSON.stringify(apiBase),
  'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
}),
```
→ `docker compose restart composer-frontend` 후 브라우저 강제 새로고침 (Ctrl+F5).

(D) **devServer overlay 도 안 뜨고 그냥 흰 화면** — 보통 (C) 같은 첫 import 직후 throw 케이스. webpack 컴파일은 성공했지만 (`compiled successfully`) 런타임에서 죽음. `curl -s http://localhost:5173/` 로 index.html 정상이면 root div 비어있는 상태.
→ Console 첫 에러 메시지를 그대로 추적.

**Windows bind mount 추가 주의**: `cp` 로 새 파일을 만든 직후 컨테이너 안에서 못 보일 때가 있음. `MSYS_NO_PATHCONV=1 docker exec composer-frontend ls -la /app/src/view/common/` 로 확인 후 webpack restart.

## 5. RealGrid2/Kendo 미동작 (BaseGrid placeholder 표시)

**예상된 동작** — 단독 환경에선 RealGrid2 라이선스 의존성 회피 위해 BaseGrid 는 placeholder. 실제 그리드 동작은 wingui 환경에서만. Composer 메인 워크플로 (NL 모드 → wizard → ArtifactApply) 는 BaseGrid 없이도 동작.

## 6. Anthropic API 호출 실패 (401 / 403)

**원인**
- `.env` 의 `ANTHROPIC_API_KEY` 가 비어있거나 잘못됨
- DB 의 TB_IS_EXTRNLAPIKEY 에 키가 등록되어 있는데 SecurityUtils.encrypt() 의 키가 다름

**대처**
```bash
# DB 의 키 row 확인
docker exec composer-db /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "Composer!2026" -C -d T3SMARTSCM \
  -Q "SELECT user_id, provider, is_active FROM TB_IS_EXTRNLAPIKEY"

# 키 재등록 — Composer UI 의 ApiKeyDialog 에서
```

## 7. NEW_FROM_COPY 모드에서 sourceBundle 수집 실패

**원인**: Composer backend 가 Target source 폴더를 마운트 못함

**대처**: `docker-compose.yml` 의 `composer-backend.volumes` 에 `${TARGET_T3SERIES_PATH:-./empty}:/workspace/targets/T3SERIES/wingui:rw` 가 있는지, `.env` 의 `TARGET_T3SERIES_PATH` (다른 Target 이면 `TARGET_<CD>_PATH`) 가 절대경로(Windows: `C:/Project/t3series/t3series-wingui`) 인지 확인.

## 8. sync-files-to-wingui.ps1 가 잘못된 위치에 파일 복사

**원인**: `Get-WinguiTarget` 함수가 `RelPath` 의 카테고리를 잘못 분류

**대처**: manifest.json 의 `files[].category` 값 직접 확인. JSX 는 `view/` 포함, JAVA 는 `com/zionex/` 포함, SQL_DDL/SP/MENU_SQL 은 폴더명/접두 기반. dry-run (`-DryRun`) 으로 미리 검토.

## 9. wingui DB 와 composer DB 의 MENU_CD 충돌

**증상**: sync-db-to-wingui.ps1 적용 시 `Violation of UNIQUE constraint UQ_TB_AD_MENU_CD`

**원인**: composer 에서 만든 MENU_CD 가 wingui 에 이미 존재

**대처**: sync-db 스크립트가 `IF NOT EXISTS` 가드로 SKIP 하므로 정상. 이미 있는 메뉴를 강제 갱신하려면 별도 UPDATE SQL 작성.

---

## 10. 세션 확인 실패: Request failed with status code 404 (`/auth/validate`)

**증상**: ChatPanel 첫 메시지 전송 시 `세션 확인 실패: Request failed with status code 404`

**원인**: 프런트가 `GET /auth/validate` 로 세션 프리체크하는데 backend 에 endpoint 없음

**대처**: `backend/src/main/java/com/zionex/t3composer/shared/auth/AuthController.java` 가 단순 `true` 반환 endpoint 제공. dev mock provider 의 `isValidAuthentication()` 그대로 반환.

## 11. webpack proxy 로 SPA 라우트 `/composer` 가 404

**증상**: 브라우저 새로고침 시 `Failed to load resource: 404 /composer`

**원인**: webpack-dev-server 의 proxy 가 `/composer` prefix 를 무차별 forward → SPA 라우트도 backend 로 보냄

**대처**: `frontend/webpack.config.js` 의 proxy 에 `bypass` 추가 — `Accept: text/html` GET 은 `/index.html` 로 fallback, 그 외 (`Accept: application/json`) 만 backend proxy.

## 12. 화면 실행 시 504 Gateway Timeout

**증상**: [화면 실행] 클릭 후 ~30초 뒤 504

**원인 (3 단계 누적 사고)**:
1. `spring.mvc.async.request-timeout` 기본 30초가 Anthropic Mono controller 보다 짧음 → `application.yaml` 에 `2700000` (45분) 설정
2. ArtifactPreviewService 의 mvn compile 이 동기 실행 → DevTools 가 응답 보내기 전 self-restart → connection 끊김 → 별도 daemon thread 로 비동기화
3. mvn 이 부분적으로 .class 갱신 → DevTools partial-state restart → `NoClassDefFoundError` → DevTools 의 `trigger-file: .devtools-restart-trigger` 옵션으로 random class 변경에 자동 restart 안 하게 + mvn 완료 후 명시적 trigger-file touch

**대처**: 위 3 단계 모두 해소된 상태. 그래도 504 가 보이면 backend 로그의 `preview mvn compile finished exitCode=...` + `trigger-file touched` 라인 확인.

## 13. RealGrid2 `No license or invalid license. license: undefined`

**증상**: 콘솔에 RealGrid2 license 에러, grid 미렌더링

**원인**: composer-frontend 가 RealGrid2 의 license 키를 등록 안 함. 부모 wingui 는 `src/main/resources/profile/local/static/license/realgrid-lic.js` 가 `var realGrid2Lic = '...'` 로 global 등록

**대처**: `frontend/src/shim/wingui/common/realgrid-license.js` 가 부모와 동일한 키를 `window.realGrid2Lic` 등록 + `RealGrid.setLicenseKey()` 양쪽 호출. `BaseGrid.jsx` 가 `realgrid` import 보다 먼저 license side-effect import.

## 14. 산출물 jsx 의 `useViewStore(s => s.activeViewId)` → globalButtons 미등록

**증상**: 화면 실행 후 [조회] 버튼 click 시 `[shim] SearchArea: globalButtons.search 가 등록되지 않았습니다`

**원인**: 산출물 jsx 가 `const activeViewId = useViewStore(s => s.activeViewId)` 호출 → wingui 표준은 `activeViewId` 가 `useContentStore` 소속 (rules/41a §4.6 의 store swap 안티패턴) → undefined 반환 → useEffect 의 `if (!activeViewId) return` 로 setViewInfo 호출 안 됨

**대처**:
- LLM 측: `.claude/rules/41a-composer-jsx.md §4.6` + `.claude/hooks/validators/composer-jsx.sh` 의 CG-STORE 검증 (Write/Edit 시 차단). 그러나 산출물은 ArtifactExtractor 가 직접 DB 저장이라 hook 미적용.
- 단독 환경 보완: `frontend/src/shim/wingui/common/imports.js` 의 `useViewStore` state 에 `activeViewId: 'composer-standalone'` 도 노출 — 잘못된 store 사용 케이스도 동작.

## 15. 산출물의 부재 컴포넌트 import (PopDepartment / PopPosition / fieldCascade)

**증상**: webpack `Module not found: Can't resolve '@wingui/view/common/PopDepartment'`

**원인**: rules/41c §6.0.3 의 ❌ 미실재 컴포넌트를 LLM 산출물이 import

**대처**: shim 으로 stub 제공 — `frontend/src/shim/wingui/view/common/{PopDepartment,PopPosition,CommonCodeSelect}.jsx` + `frontend/src/shim/wingui/common/{CommonCodeSelect.jsx,fieldCascade.js}`. 빈 결과 반환 + 안내 텍스트.

## 16. 산출물 endpoint 호출 시 404 (`/util/...` 등)

**증상**: 화면 [조회] click → `GET http://localhost:5173/util/user-info-mgmts ... 404`

**원인**: `webpack.config.js` 의 proxy 가 화이트리스트 (`/composer /actuator /auth`) 만 forward — 산출물이 만든 `/util /demandplan /masterplan /system /sales /inventory ...` 등 신규 prefix 는 proxy 안 됨

**대처**: proxy `context: () => true` 로 모든 path 를 backend 로 넘기되 `bypass` 함수가 SPA route (Accept: text/html GET) 만 `/index.html` 로 fallback. webpack 자체 자산 (`/sockjs-node /hot-update *.js *.css *.map`) 은 webpack 직접 서빙. 산출물이 만들 모든 모듈 endpoint 자동 동작.

## 17. 설계서 mock-up 이미지의 한글/영문이 깨짐 (□□□)

**증상**: 설계서 .xlsx 의 "레이아웃" 시트 하단 mock-up image 의 모든 텍스트가 □ 박스로 표시

**원인**: backend 컨테이너 (eclipse-temurin) 에 한글 (CJK) 폰트 + fontconfig 미설치 → Java AWT 가 글리프 못 그림

**대처**:
- `docker/backend/Dockerfile` — `apt-get install fonts-noto-core fonts-noto-cjk fontconfig` + `fc-cache -fv`
- `ScreenMockupRenderer.cjkFont(style, size)` — 시스템 폰트 후보 (Noto Sans CJK KR / NanumGothic / Malgun Gothic 등) 중 한글 '가' 표시 가능한 첫 폰트 자동 선택 (1회 cache)
- backend 재빌드 (`docker compose down composer-backend && docker compose up -d --build composer-backend`)

## 18. 화면 [조회] 버튼 click 시점에 globalButtons.search 미등록 메시지

**증상**: `[shim] SearchArea: globalButtons.search 가 등록되지 않았습니다`

**원인**: 산출물 jsx 가 `useViewStore(s => s.activeViewId)` 잘못 사용 (`§14`) → useEffect 의 `if (!activeViewId) return` early-exit → setViewInfo 호출 자체 skip

**대처**:
- 단독 환경 보완: `frontend/src/shim/wingui/common/imports.js` 의 `useViewStore` state 에 `activeViewId: 'composer-standalone'` 추가 (useContentStore 와 동일 값)
- SearchArea 가 click 시점에 store 직접 lookup (subscribe 의 timing 무관)
- LLM 측: `composer-jsx.sh CG-STORE` 가 산출물 jsx 작성 시 차단

## 19. `.env` 수정했는데 변경이 반영 안 됨

**증상**: 편집기로 `.env` 의 `ANTHROPIC_API_KEY` 나 `TARGET_T3SERIES_PATH` 등을 바꿨는데 backend 가 여전히 옛 값으로 동작 (LLM 호출 401 · Target 경로 못 찾음 등).

**원인**: docker-compose 는 `.env` 를 컨테이너 기동 **전**에 한 번 읽어 `docker-compose.yml` 의 `${VAR}` 들을 치환합니다. **이미 기동된 컨테이너 안의 환경변수는 그 시점의 스냅샷** — `.env` 파일을 나중에 수정해도 컨테이너 안 env 는 변하지 않습니다.

**대처**: 영향 받는 컨테이너를 `--force-recreate` 로 재기동.
```bash
# .env 수정 후 backend 만 재기동 (보통 충분)
docker compose up -d --force-recreate composer-backend

# DB · MSSQL 비밀번호처럼 db 컨테이너 변수가 바뀌었으면 그쪽도:
docker compose up -d --force-recreate composer-db composer-backend
```
참고 — `restart` 만으로는 환경변수가 재적용되지 않습니다. 반드시 `--force-recreate` 사용.

## 20. ⚠️ `.env` 수정분이 실수로 push 됨 — git history 에 시크릿 노출

**증상**: `.env` 에 채워둔 `ANTHROPIC_API_KEY` 등이 `git push` 후 GitHub/원격 레포에 노출. (`.env` 는 placeholder 상태로 레포에 commit 되어 있어 tracked 파일 — `.gitignore` 가 보호 안 함.)

**예방** (이게 더 중요):
- 시크릿 채워둔 채로는 절대 `git add .` / `git commit -a` 금지.
- 커밋 전 항상 `git status` 로 `.env` 가 staged 됐는지 확인.
- 의도하지 않은 변경분 되돌리기:
  ```bash
  git restore .env             # placeholder 로 즉시 복원 (시크릿 사라짐 — 다시 채워야 함)
  ```
- 본인 머신 전용으로 시크릿을 보존하고 싶고 git status 에서 안 보이게 하려면:
  ```bash
  git update-index --skip-worktree .env    # 이 머신 한정 — git 이 .env 변경 추적 정지
  git update-index --no-skip-worktree .env # 해제 (다시 추적)
  ```

**유출됐다면**:
1. `.env` 의 노출된 키를 **즉시 무효화** (Anthropic console 에서 회수 → 새 키 발급)
2. git history 에서 제거 (`git filter-branch` / `bfg-repo-cleaner`) — 단 fork/clone 한 사람이 있으면 한계 있음
3. 그래도 안전한 가정: **공개된 키는 영구 노출**. 새 키 발급이 정답.

## 21. TB_UT_USER_INFO 등 마스터 테이블이 비어있어 조회 결과 0건

**증상**: 화면 정상 진입 + [조회] 정상 호출하지만 그리드 0건

**원인**: docker init 시드는 메뉴/권한/Composer 테이블만 INSERT. 마스터 테이블 (사용자정보 등) 은 빈 상태

**대처**: 검증용 sample 데이터를 직접 INSERT — 예:
```sql
INSERT INTO TB_UT_USER_INFO (USER_ID, USER_NM, USER_EMAIL, ...) VALUES
('admin', N'관리자', 'admin@example.com', ...),
('user001', N'홍길동', 'hong@example.com', ...);
```
또는 화면의 [+ 행 추가] [💾 저장] 으로 사용자가 직접 입력해 round-trip 검증.

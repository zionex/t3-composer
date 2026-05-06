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

**원인**: Composer backend 가 wingui 폴더를 read-only 마운트 못함

**대처**: `docker-compose.yml` 의 `composer-backend.volumes` 에 `${COMPOSER_WINGUI_REF_PATH}:/workspace/wingui:ro` 가 있는지, `.env` 의 `COMPOSER_WINGUI_REF_PATH` 가 절대경로(Windows: `C:/Project/t3series/t3series-wingui`) 인지 확인.

## 8. sync-files-to-wingui.ps1 가 잘못된 위치에 파일 복사

**원인**: `Get-WinguiTarget` 함수가 `RelPath` 의 카테고리를 잘못 분류

**대처**: manifest.json 의 `files[].category` 값 직접 확인. JSX 는 `view/` 포함, JAVA 는 `com/zionex/` 포함, SQL_DDL/SP/MENU_SQL 은 폴더명/접두 기반. dry-run (`-DryRun`) 으로 미리 검토.

## 9. wingui DB 와 composer DB 의 MENU_CD 충돌

**증상**: sync-db-to-wingui.ps1 적용 시 `Violation of UNIQUE constraint UQ_TB_AD_MENU_CD`

**원인**: composer 에서 만든 MENU_CD 가 wingui 에 이미 존재

**대처**: sync-db 스크립트가 `IF NOT EXISTS` 가드로 SKIP 하므로 정상. 이미 있는 메뉴를 강제 갱신하려면 별도 UPDATE SQL 작성.

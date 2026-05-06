# T3Composer (단독 분리판)

> T3Series 의 화면 생성기(Composer) 를 별도 레포로 분리해 Docker 한 번으로 단독 구동할 수 있는 워크스페이스. 화면을 만들고 검증한 뒤, sync 스크립트로 부모 `t3series-wingui` 에 적용합니다.

## 목적

- Composer 는 LLM(Anthropic Claude)으로 새 화면(JSX + Java + SP DDL + 메뉴 등록 SQL)을 생성하는 메타 도구입니다.
- 부모 `t3series-wingui` 모듈은 너무 무거워 (WAR + 16GB heap webpack) Composer 만의 빠른 사이클이 어렵습니다.
- 이 레포는 Docker 컨테이너 안에서 **자체 MSSQL + Spring Boot + React** 풀스택을 띄워 Composer 만 단독으로 돌립니다.
- 검증 통과 후 `sync/` 스크립트로 코드 + DB 변경분을 wingui 에 일괄 동기화합니다.

## 빠른 시작

```bash
# 1. .env 작성
cp .env.example .env
# 편집기로 .env 열어 ANTHROPIC_API_KEY 채우기 (없으면 LLM 호출 비활성화 — 부팅은 됨)

# 2. 모든 서비스 기동 (첫 실행은 5~10분 — Maven dep + npm install + MSSQL 이미지 풀)
docker compose up -d --build

# 3. 헬스 체크
docker compose ps
# composer-db (healthy) · composer-db-init (Exited 0) · composer-backend (healthy) · composer-frontend (Up)

# 4. 브라우저 진입
# http://localhost:5173/  →  /composer 로 자동 리디렉트
```

### 접속 주소

| 용도 | URL | 비고 |
|---|---|---|
| **Composer UI (메인)** | http://localhost:5173 | webpack-dev-server, `/composer` `/actuator` 는 backend 로 proxy |
| Backend REST | http://localhost:8090 | Spring Boot |
| Backend Health | http://localhost:8090/actuator/health | `{"status":"UP"}` 확인용 |
| MSSQL 직접 접속 | `localhost:11433` (sa / `.env` 의 `MSSQL_SA_PASSWORD`) | SSMS / Azure Data Studio |

### 첫 실행 시 자주 발생하는 이슈

부모 `t3series` 코드를 옮겨오는 과정에서 backend `pom.xml` 또는 frontend `view/common/` 에 일부 의존이 누락된 상태로 시작될 수 있습니다. 이 경우 빌드 시 또는 브라우저 console 에 명확한 에러가 보입니다:

| 증상 | 해결 위치 |
|---|---|
| `mvn compile` 시 `cannot find symbol class PBEStringEncryptor` 등 | TROUBLESHOOTING.md §3 (D)/(E) |
| 브라우저 흰 화면 + Console `process is not defined` | TROUBLESHOOTING.md §4 (C) |
| 브라우저 흰 화면 + Console `Module not found: ../../common/X` | TROUBLESHOOTING.md §4 (B) |

## 디렉토리 구조

```
t3-composer/
├── docker-compose.yml        # 3 서비스 정의
├── .env                      # 비밀값 (gitignored)
├── docker/                   # Dockerfile + DB init SQL
├── backend/                  # Spring Boot 단독 앱
├── frontend/                 # React 단독 앱
├── staging/                  # ArtifactApply 산출물 (gitignored)
└── sync/                     # wingui 동기화 PowerShell 스크립트
```

## 주요 결정 사항

| 항목 | 선택 |
|---|---|
| DB | Docker MSSQL 2022 (composer 전용 인스턴스 — wingui 와 격리) |
| 인증 | Dev 우회 (`SecurityConfig.permitAll()` + mock 사용자 `composer-dev`) |
| ArtifactApply 모드 | `COMPOSER_APPLY_MODE={staging\|direct}` 환경변수 토글 |
| 패키지 | `com.zionex.t3composer.*` (부모 `com.zionex.t3series.*` 와 분리) |

## 화면 생성 흐름

```
1. http://localhost:5173/composer 진입
2. 모드 선택 (NEW_NL / NEW_STEP / NEW_FROM_COPY / NEW_FROM_DESIGN / EXISTING_MODIFY)
3. 9-Step Wizard 진행
4. Step9 → Claude 로 생성
5. ArtifactApply
   - staging mode: ./staging/output/<session> 에 산출물 + composer-db 에 메뉴/SP 등록
   - direct mode : COMPOSER_WINGUI_REF_PATH 폴더에 직접 + composer-db 에도 등록
6. 검증
   - composer-frontend 에서 새 화면이 메뉴 트리에 노출
   - 클릭하여 진입·동작 확인
7. wingui 동기화 (검증 통과 후)
   ./sync/manifest-from-staging.ps1
   ./sync/sync-files-to-wingui.ps1 -DryRun   # 미리보기
   ./sync/sync-files-to-wingui.ps1           # 실 적용
   ./sync/sync-db-to-wingui.ps1 -WhatIf      # 미리보기
   ./sync/sync-db-to-wingui.ps1              # 실 적용
```

## 부모 프로젝트와의 관계

- 모든 화면 규약(MENU_CD · BaseGrid · zAxios · Pop\* · CommonCodeSelect · SP_UI_\* 네이밍 등)은 **부모 `t3series` 의 `.claude/rules/*` 를 그대로 따릅니다**. CLAUDE.md 참조.
- `COMPOSER_WINGUI_REF_PATH` 가 가리키는 `t3series-wingui` 폴더가 NEW_FROM_COPY 모드의 sourceBundle 수집 대상입니다.
- DB 스키마 (`TB_AD_MENU`/`TB_AD_LANG_PACK`/`TB_UT_USER_INFO` 등) 는 wingui 와 동일한 v26.0.0 최신 DDL 기준으로 시드됩니다.

## 라이선스

Internal — Zionex Inc.

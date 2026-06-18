# T3Composer (단독 분리판)

> T3Series 의 화면 생성기(Composer) 를 별도 레포로 분리해 Docker 한 번으로 단독 구동할 수 있는 워크스페이스. 화면을 만들고 검증한 뒤, sync 스크립트로 부모 `t3series-wingui` 에 적용합니다.

## 목적

- Composer 는 LLM(Anthropic Claude)으로 새 화면(JSX + Java + SP DDL + 메뉴 등록 SQL)을 생성하는 메타 도구입니다.
- 부모 `t3series-wingui` 모듈은 너무 무거워 (WAR + 16GB heap webpack) Composer 만의 빠른 사이클이 어렵습니다.
- 이 레포는 Docker 컨테이너 안에서 **자체 MSSQL + Spring Boot + React** 풀스택을 띄워 Composer 만 단독으로 돌립니다.
- 검증 통과 후 `sync/` 스크립트로 코드 + DB 변경분을 wingui 에 일괄 동기화합니다.

## 빠른 시작

```bash
# 1. 모든 서비스 기동 (첫 실행은 5~10분 — Maven dep + npm install + MSSQL 이미지 풀)
docker compose up -d --build

# 2. 편집기로 .env 열어 필수값 채우기 (안 채워도 부팅은 됨 — 해당 기능만 비활성)
#   · ANTHROPIC_API_KEY            — 자연어 화면 생성
#   · COMPOSER_SNAPSHOT_SECRET_KEY — 스냅샷 시크릿 암호화 마스터키 (임의 충분히 긴 문자열)
#   · TARGET_T3SERIES_PATH 등      — 산출물 적용 대상 wingui 트리 절대경로
# .env 수정 후 변경 반영:
docker compose up -d --force-recreate composer-backend

# 3. 헬스 체크
docker compose ps
# composer-db (healthy) · composer-db-init (Exited 0) · composer-backend (healthy) · composer-frontend (Up)

# 4. 브라우저 진입
# http://localhost:5173/  →  /composer 로 자동 리디렉트
```

### `.env` 라이프사이클 (★ 자주 헷갈리는 부분)

| 질문 | 답 |
|---|---|
| `.env` 는 어디 있나요? | **호스트(로컬) 레포 루트** (`<repo>/.env`). docker 안에는 없습니다. |
| 클론하면 바로 있나요? | ✅ 네. 레포에 placeholder 상태로 commit 되어 있어 신규 클론 시 바로 존재. (= `.env.example` 동일 내용 — 키 자리가 비어있을 뿐 docker compose 가 읽을 수 있음) |
| 처음엔 어떻게 채우나요? | 편집기로 `.env` 열어 `ANTHROPIC_API_KEY` · `COMPOSER_SNAPSHOT_SECRET_KEY` · `TARGET_<CD>_PATH` 등 빈 자리를 직접 입력. |
| ⚠️ commit/push 해도 되나요? | **❌ 절대 안 됨**. `.env` 는 tracked 파일이라 `git status` 에 modified 로 뜨는데, **실수로 commit + push 하면 git history 에 시크릿이 영구 노출됩니다**. 변경분은 로컬에만 두세요 (`git restore .env` 로 placeholder 로 되돌리거나, 본인만의 가짜 키로 채워둘 것). |
| `.env` 수정하면 즉시 반영? | **❌ 아니요**. docker-compose 가 `.env` 를 컨테이너 기동 **전에 한 번** 읽어 `${VAR}` 치환하므로, 값 변경 후엔 backend 재기동: `docker compose up -d --force-recreate composer-backend` |
| 비밀값 미입력 시 부팅? | 부팅은 됨. 단 `${VAR}` 가 빈 값으로 치환되어 LLM 호출 · Target DB 연결 등 비밀이 필요한 기능은 비활성. |

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
5. [화면 실행] (헤더 버튼) — 산출물을 docker 안에 임시 적용 + 우측 [실행 화면] Tab 에 inline 노출
   - JSX → frontend webpack hot-reload
   - Java → JavaArtifactRewriter 가 패키지 변환 후 mvn compile (별도 thread, trigger-file 로 1회 restart)
   - SQL → composer-db 에 정식 이름 실행 (CREATE OR ALTER)
   - MENU → composer-db 에 __PV<sid8> suffix 로 임시 등록
   → RealGrid2 (sky-blue) + wingui 룩 InputField/SearchArea — 부모 t3series 와 동일
6. 검증 OK 후 [메뉴 등록] + [아티팩트 실행]
   - staging mode: ./staging/output/<session> 에 산출물 + composer-db 에 메뉴/SP 등록
   - Per-Target 직접 적용: TARGET_<CD>_PATH 가 설정된 Target 은 자동으로 host 폴더에 직접 쓰기 + composer-db 에도 등록 (2026-05-28)
7. wingui 동기화 (검증 통과 후)
   ./sync/manifest-from-staging.ps1
   ./sync/sync-files-to-wingui.ps1 -DryRun   # 미리보기
   ./sync/sync-files-to-wingui.ps1           # 실 적용
   ./sync/sync-db-to-wingui.ps1 -WhatIf      # 미리보기
   ./sync/sync-db-to-wingui.ps1              # 실 적용
```

상세 인프라: `.claude/rules/50-composer-standalone-runtime.md` (Phase 1~2d — Docker DevTools / preview API / RealGrid2 / shim 구조 / mock-up 이미지)
문제 해결: `TROUBLESHOOTING.md §10~19` (504 / license / store swap / 부재 Pop\* / `/util` proxy / 한글 폰트 / 빈 마스터 등)

추가:
- 헤더 [📥 설계서] 다운로드 시 .xlsx 의 "레이아웃" 시트 하단에 화면 mock-up PNG 자동 첨부 (Java2D, 한글 Noto CJK 폰트)
- webpack proxy 가 `context: () => true` 로 산출물의 모든 모듈 endpoint (`/util` 등) 자동 forward
- 좌측 layout: 위 (55%) 아티팩트 트리 / 아래 (45%) 작업 내역, vertical SplitPane 드래그

## 부모 프로젝트와의 관계

- 모든 화면 규약(MENU_CD · BaseGrid · zAxios · Pop\* · CommonCodeSelect · SP_UI_\* 네이밍 등)은 **부모 `t3series` 의 `.claude/rules/*` 를 그대로 따릅니다**. CLAUDE.md 참조.
- `TARGET_T3SERIES_PATH` 가 가리키는 `t3series-wingui` 폴더가 NEW_FROM_COPY 모드의 sourceBundle 수집 대상입니다.
- DB 스키마 (`TB_AD_MENU`/`TB_AD_LANG_PACK`/`TB_UT_USER_INFO` 등) 는 wingui 와 동일한 v26.0.0 최신 DDL 기준으로 시드됩니다.

## 라이선스

Internal — Zionex Inc.

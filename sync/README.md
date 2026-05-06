# T3Composer → wingui 동기화 가이드

## 목적

Composer 단독 환경(`t3-composer`) 에서 만든 화면 산출물 (JSX / Java / SQL) 과 DB 변경분 (TB_AD_MENU INSERT / SP DDL / Table DDL) 을 부모 `t3series-wingui` 폴더 + wingui DB 에 일괄 반영합니다.

## 표준 흐름 (4단계)

```
1) Composer 에서 화면 생성·검증 완료
   ./staging/output/<sessionId>/  ← JSX / Java / SQL 파일 산출
   composer-db 의 TB_AD_MENU + SP DDL + INSERT 모두 적용

2) manifest 추출
   ./sync/manifest-from-staging.ps1 -SessionId <sid>
   → ./sync/manifest.json (변경 파일 + DB 변경 SQL dump 포함)

3) dry-run (반드시 먼저)
   ./sync/sync-files-to-wingui.ps1 -DryRun
   ./sync/sync-db-to-wingui.ps1 -WhatIf
   → 변경 미리보기. 사용자가 git diff 식으로 검토.

4) 실 적용
   ./sync/sync-files-to-wingui.ps1
   ./sync/sync-db-to-wingui.ps1
```

## 환경 변수 (.env 또는 직접 지정)

| 변수 | 용도 | 기본값 |
|---|---|---|
| `COMPOSER_WINGUI_REF_PATH` | t3series-wingui 절대경로 | `C:/Project/t3series/t3series-wingui` |
| `COMPOSER_DATABASE_REF_PATH` | t3series-database 절대경로 | `C:/Project/t3series/t3series-database` |
| `COMPOSER_UPGRADE_VERSION` | 업그레이드 폴더명 | `v26.0.0-20260507` |
| `WINGUI_DB_HOST` | wingui DB 호스트 | `localhost` |
| `WINGUI_DB_PORT` | wingui DB 포트 | `1433` |
| `WINGUI_DB_NAME` | wingui DB 이름 | `T3SMARTSCM` |
| `WINGUI_DB_USER` / `WINGUI_DB_PASSWORD` | wingui DB 자격 | (필수) |

## 패키지 rename 자동 처리

sync-files-to-wingui.ps1 가 Java 파일 복사 시 다음 변환을 적용:

| 단독 (composer) | wingui |
|---|---|
| `com.zionex.t3composer.domain` | `com.zionex.t3series.web.domain.<module>.<feature>` |
| `com.zionex.t3composer.shared.audit.BaseEntity` | `com.zionex.t3series.web.util.audit.BaseEntity` |
| `com.zionex.t3composer.shared.data.ResponseMessage` | `com.zionex.t3series.web.util.data.ResponseMessage` |
| `com.zionex.t3composer.shared.auth.*` | `com.zionex.t3series.web.security.authentication.*` |
| `com.zionex.t3composer.shared.util.*` | `com.zionex.t3series.util.*` |
| `com.zionex.t3composer.shared.constant.ServiceConstants` | `com.zionex.t3series.web.constant.ServiceConstants` |
| `com.zionex.t3composer.config.ApplicationProperties` | `com.zionex.t3series.ApplicationProperties` |

## 주의

- DB sync 시 **반드시 wingui DB 백업 후** 적용. dry-run 결과를 sql 파일로 저장하여 재실행 가능하도록 보관 권장.
- 동일 MENU_CD 가 wingui DB 에 이미 있으면 sync-db 스크립트가 SKIP 처리 (중복 INSERT 방지). 기존 row 수정이 필요하면 `-Force` 옵션.
- 산출물이 `staging/` 아닌 `direct` mode 로 wingui 폴더에 직접 들어간 경우 manifest 스크립트는 **사용 안 함** — Composer 내부 `TB_IS_COMPOSER_ARTIFACT` 의 STATUS=FINAL 행이 이미 wingui 에 적용된 것으로 간주.

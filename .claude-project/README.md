# KTNG Project Architecture Pack

> **`C:/vs_project/KTNG`** (t3series-parent **25.1.0**) 의 KTNG 커스터마이징 분기 전용 rule pack.
> Composer (`.claude/`) · PlanNEL (`.claude-plannel/`) 과는 **완전히 다른** 컨벤션 — Claude 가
> KTNG 소스를 분석·수정·신규 작성 시 KTNG 패턴이 정확히 적용되도록 분리.

## 폴더 구조

```
.claude-project/
├── README.md                  ← 이 파일
├── settings.json              ← Claude Code 진입점 (hooks · permissions · env · model)
├── rules/                     ← 8개 markdown rule
│   ├── 10-overview.md         KTNG ↔ Composer/wingui 본가 차이 + 기술 스택 + 도메인 코드
│   ├── 20-screen-development.md  신규 화면 절차 + JSX/Controller 표준 골격
│   ├── 21-components.md       공용 컴포넌트 인벤토리 (BaseGrid · InputField · 그리드 객체 API)
│   ├── 30-data-access.md      HTTP zAxios · QueryHandler · 저장 패턴 (JSON body changes)
│   ├── 30-database-schema.md  TB_AD_MENU 등 실제 컬럼 · 메뉴 SQL 표준
│   ├── 31-stored-procedures.md  SP_UI_<DOMAIN>_KTNG_<NN>_<ACTION> 네이밍 + MSSQL T-SQL
│   ├── 32-security.md         @ExecPermission · TB_AD_PERMISSION_GROUP
│   └── 99-anti-patterns.md    환각 패턴 카탈로그 (출력 직전 self-check)
└── hooks/                     ← 자동 검증
    ├── _jq-fallback.sh
    ├── session-start-briefing.sh        SessionStart — KTNG 컨벤션 1회 브리핑
    ├── pre-tool-use-validator.sh        PreToolUse  — Write/Edit 차단 디스패처
    ├── post-tool-use-linter.sh          PostToolUse — 가벼운 sanity check
    ├── user-prompt-context-injector.sh  UserPromptSubmit — 키워드로 rule 자동 주입
    ├── stop-checklist-reminder.sh       Stop        — 변경 파일별 체크리스트
    └── validators/                       PreToolUse 가 source 하는 모듈 8종
        ├── _lib.sh                       block / warn 헬퍼
        ├── jsx-basic.sh                  BaseGrid prop · grid API · showMessage · MUI icon
        ├── sql-sp.sh                     SP 네이밍 + MSSQL 방언 + ORDER BY
        ├── java-basic.sh                 System.out · @Autowired · ResponseMessage.builder · @Value
        ├── java-imports.sh               jakarta.* 강제 (javax.* 차단)
        ├── ktng-naming.sh                ★ MENU_CD · 패키지 · JSX 경로 · SP 네이밍
        ├── ktng-controller.sh            ★ Controller 패턴 (@ExecPermission · QueryHandler · @RequestBody List<Map>)
        ├── menu-sql.sh                   TB_AD_MENU INSERT 컬럼 화이트리스트
        └── sql-schema-whitelist.sh       TB_AD_LANG_PACK MODIFY_* 등 자주 틀리는 컬럼
```

## 작성 우선순위 (사용 흐름)

| 단계 | 파일 |
|---|---|
| 1. **전체 그림 파악** | `10-overview.md` (KTNG ↔ Composer 차이 표) |
| 2. **신규 화면 만들 때** | `20-screen-development.md` 부터 시작 → `21-components.md`, `30-data-access.md` 참조 |
| 3. **SP 작성** | `31-stored-procedures.md` (네이밍 + MERGE 패턴) |
| 4. **메뉴 등록 SQL** | `30-database-schema.md §5` (TB_AD_MENU + LANG_PACK + PERMISSION_GROUP) |
| 5. **권한 / 보안** | `32-security.md` (@ExecPermission 매트릭스) |
| 6. **체크리스트 / 함정** | `99-anti-patterns.md` (출력 직전 self-check 10가지) |

## 핵심 차이 요약 (vs Composer · vs PlanNEL)

| 영역 | KTNG | Composer/wingui 본가 | PlanNEL |
|---|---|---|---|
| Spring Boot | **3.x** (jakarta.*) | 3.x (jakarta.*) | 2.4 (javax.*) |
| 그리드 | **RealGrid 2** | RealGrid 2 | AG-Grid 30.2 |
| 상태관리 | Zustand 4.4 | Zustand 4.4 | Redux Toolkit |
| 폼 | react-hook-form 7.27 | react-hook-form | useState/useRef |
| MENU_CD | **UI_<DOMAIN>_KTNG_<NN>** | UI_<DOMAIN>_<NAME> | TabMenuList.js |
| DB | MSSQL | MSSQL | PostgreSQL |
| 백엔드 패키지 | **web.ktng.<도메인>** | web.domain.<도메인> | t3series.saas |
| URL | **/<m>/<cat>/<feature>/q1\|s1\|d1** | /<m>/<features> | /api/<plural> |
| SP 호출 | **QueryHandler.getList/save** | JdbcTemplate.query / JpaRepository | 사용 안 함 (JPA + QueryDSL) |
| 저장 RequestBody | **List<Map<String,Object>> changes** (JSON) | multipart "changes" | @RequestBody DTO |
| Entity | ❌ Map 만 | ✅ 4종 세트 | ✅ Instagram-style ID |
| 권한 | **@ExecPermission(menuCd, type)** | Spring Security session | JWT + @PreAuthorize |
| 화면 생성기 | ❌ 없음 (수동) | T3Composer 있음 | ❌ 없음 |

## Target repo

- **소스 경로**: `c:/vs_project/KTNG`
- **메인 모듈**:
  - `t3series-wingui/` (WAR · 메인 백엔드 + 프론트엔드)
  - `t3series-dpserver/` · `t3series-mpserver/` (엔진 서버)
  - `t3series-insight/` (Insight)
  - `t3series-mp/` (Swing MP 코어)
  - `t3series-database/` (SP/DDL)
- **KTNG 산출물 위치**:
  - Java: `t3series-wingui/src/main/java/com/zionex/t3series/web/ktng/`
  - JSX: `t3series-wingui/packages/wingui/src/view/ktng/`

## 표준 참조 원본

| 카테고리 | 파일 |
|---|---|
| 마스터 CRUD (Java) | `web/ktng/baselineforecast/master/BfKtng01Controller.java` |
| 마스터 CRUD (JSX) | `view/ktng/baselineforecast/master/bfktng01/BfKtng01.jsx` |
| 팝업 (JSX) | `view/ktng/baselineforecast/master/bfktng01/PopBfKtng01.jsx` |
| 리포트 (Java) | `web/ktng/baselineforecast/report/BfKtng03Controller.java` |
| 콘트리뷰션 마진 | `web/ktng/contributionmargin/CmKtng01Controller.java` |
| 리포트 | `web/ktng/report/monitoring/RptKtng15Controller.java` |

## Hooks 활성 흐름

```
사용자 프롬프트 입력
   ↓
UserPromptSubmit → user-prompt-context-injector.sh
                   (키워드 "신규 화면"/"SP"/"메뉴 등록" 등 감지 → rule 핵심 주입)
   ↓
Claude 가 Write/Edit/MultiEdit 호출
   ↓
PreToolUse → pre-tool-use-validator.sh (dispatcher)
              ├─ jsx-basic.sh           (BaseGrid prop, grid API, showMessage)
              ├─ sql-sp.sh              (SP 네이밍, MSSQL 방언)
              ├─ java-basic.sh          (System.out, ResponseMessage.builder, @Value)
              ├─ java-imports.sh        (jakarta.* 강제)
              ├─ ktng-naming.sh         (MENU_CD/패키지/JSX 경로/SP)
              ├─ ktng-controller.sh     (@ExecPermission, QueryHandler, JSON body)
              ├─ menu-sql.sh            (TB_AD_MENU 실제 컬럼)
              └─ sql-schema-whitelist.sh (TB_AD_LANG_PACK MODIFY_* 등)
   ↓
파일 저장
   ↓
PostToolUse → post-tool-use-linter.sh
              (괄호 balance · package 선언 · SQL 종결 sanity)
   ↓
응답 종료
   ↓
Stop → stop-checklist-reminder.sh
       (변경 파일 종류별 체크리스트 리마인드)
```

## 활성화 방법

1. 사용자 (또는 자동) 가 `.claude-project/settings.json` 을 Claude Code 가 인식하도록 활성화
   - `claude --settings .claude-project/settings.json` 같은 옵션 사용 또는
   - `.claude` 와 동일 위치에 두고 명시적 로드
2. SessionStart hook 이 KTNG 브리핑을 자동 표시
3. 신규 화면 작성 시 `user-prompt-context-injector` 가 키워드를 감지해 rule 핵심을 자동 주입

## 비고

- KTNG 의 **AD 도메인** (UI_AD_FILEUPLOAD, UI_AD_MANUAL_BATCH 등) 은 KTNG 접미 없이 일반 네이밍 — `ktng-naming.sh` 가 이를 예외 처리
- `@Autowired QueryHandler queryHandler;` 필드 주입은 KTNG 의 기존 패턴이므로 `java-basic.sh` 가 warn 만 (block 안 함)
- SP 작성 시 `t3series-database/procedures/<SP>.sql` 단일 폴더 사용 — Composer 의 `upgrade/vX.Y.Z-YYYYMMDD/` 구조는 KTNG 무관

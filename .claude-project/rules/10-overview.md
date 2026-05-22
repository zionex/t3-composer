# 10. KTNG 프로젝트 개요

> **Target repo**: `c:/vs_project/KTNG`
> **기준 버전**: t3series-parent **25.1.0** (T3SmartSCM 의 KTNG 커스터마이징 분기)
> **이 rule pack 의 목적**: KTNG 소스 분석·수정·신규 화면 작성 시 Composer/wingui 본가의 컨벤션을 잘못 적용하지 않도록 분리된 가드라인 제공.

## 0. KTNG ↔ Composer/wingui 본가 핵심 차이 요약

| 영역 | KTNG | Composer/wingui 본가 |
|---|---|---|
| MENU_CD 형식 | `UI_<DOMAIN>_KTNG_<NN>` (예: `UI_BF_KTNG_01`) | `UI_<DOMAIN>_<NAME>` (예: `UI_UT_USER_INFO_MGMT`) |
| Java 패키지 | `com.zionex.t3series.web.ktng.<도메인>.<카테고리>` | `com.zionex.t3series.web.domain.<도메인>.<feature>` |
| JSX 경로 | `view/ktng/<도메인>/<카테고리>/<feature>/<File>.jsx` | `view/<도메인>[/<카테고리>]/<feature>/<File>.jsx` |
| Controller 패턴 | `@ExecPermission` + `QueryHandler.getList/save` | `@RestController` + `JdbcTemplate.query` 또는 JpaRepository |
| 저장 RequestBody | `@RequestBody List<Map<String,Object>> changes` (JSON) | multipart/form-data 의 `getParameter("changes")` |
| Entity 사용 | ❌ Map<String,Object> 만 (JPA Entity 미사용) | ✅ @Entity + BaseEntity 4종 세트 |
| SP 호출 | `queryHandler.getList("SP_UI_BF_KTNG_01_Q1", params)` | `jdbcTemplate.query("EXEC SP_UI_...", new BeanPropertyRowMapper<>(...))` |
| 화면 생성기 | ❌ 없음 (수동 개발) | T3Composer (9-Step Wizard) 존재 |
| HTTP 메서드 | 거의 모두 `@PostMapping` | GET(조회) + POST(저장/삭제) 혼합 |
| URL prefix | `/<m>/<cat>/<feature>/q1` (소문자 concat) | `/<m>/<fs>` (kebab-case plural) |

## 1. 기술 스택

| 영역 | 버전·기술 |
|---|---|
| **Parent** | t3series-parent **25.1.0** |
| **Java** | 17 |
| **Spring Boot** | **3.x** (jakarta.* 사용 — javax.* 제거) |
| **Build** | Maven · wingui 는 WAR 패키징 |
| **DB** | MSSQL (T-SQL: `NEWID()`, `GETDATE()`, `DECLARE @var`) |
| **Frontend** | React 18 · Webpack · Zustand · RealGrid · react-hook-form · @mui · Kendo · Chart.js · d3 · react-router-dom 5.x |
| **검증** | Spring Security · `@ExecPermission` 커스텀 어노테이션 |

## 2. 모노레포 모듈 구조

```
c:/vs_project/KTNG/
├── t3series-wingui/          ← 메인 백엔드 + 프론트엔드 (WAR)
│   ├── src/main/java/com/zionex/t3series/web/
│   │   ├── domain/            ← 표준 도메인 (admin/bf/cm/dp/im/mp/snop/so/util/...)
│   │   └── ktng/              ← ★ KTNG 커스터마이징 (baselineforecast/contributionmargin/demandplan/...)
│   ├── packages/wingui/src/view/
│   │   ├── (표준 view 폴더들)
│   │   └── ktng/              ← ★ KTNG 커스터마이징 화면
│   └── pom.xml
├── t3series-dpserver/        ← DP 엔진 (Spring Boot Main)
├── t3series-mpserver/        ← MP 엔진 (Spring Boot Main)
├── t3series-mp/              ← MP 코어 라이브러리 (Swing)
├── t3series-insight/         ← Insight 모듈
└── t3series-database/        ← SP/DDL
    ├── db_update_script.sql  ← 누적 변경 스크립트
    └── procedures/           ← 245개 SP/Function (SP_UI_*.sql, SP_COMM_*.sql, FN_*.sql)
```

★ **`fp` (Factory Planning) 모듈 없음** — KTNG 는 FP 엔진 미사용.

## 3. KTNG 도메인 코드 인벤토리

분석된 KTNG 화면 (`@ExecPermission(menuCd=...)` 추출):

| 도메인 | MENU_CD 예 | 개수 |
|---|---|---|
| **BF** | UI_BF_KTNG_01 ~ 03 | 3 |
| **CM** | UI_CM_KTNG_01 ~ 11 | 11 (Contribution Margin) |
| **DP** | UI_DP_KTNG_01 ~ 20, UI_DP_KTNG_APV | 21 |
| **MP** | UI_MP_KTNG_00 ~ 09 | 10 |
| **RPT** | UI_RPT_KTNG_00 ~ 26 | 27 (Report) |
| AD | UI_AD_FILEUPLOAD, UI_AD_MANUAL_BATCH, UI_AD_SCHEDULER_JOB_CUSTOM | 3 (KTNG 접미 없음) |

**핵심 관찰**:
- KTNG 의 도메인 코드는 일반 T3Series 와 동일 (BF/CM/DP/IM/MP) + **RPT (리포트 전용)** 추가
- AD 도메인은 KTNG 접미 없이 일반 네이밍

## 4. 작업 시 우선 참조 순서

```
신규 화면 / 화면 수정 요청
   ↓
Step 1. 유사 KTNG 화면 (BfKtng01.jsx / CmKtng01.jsx) Read
Step 2. .claude-project/rules/20-screen-development.md 골격
Step 3. 필요 시 21-components.md (공용 위젯) / 30-data-access.md (HTTP/SP)
Step 4. SP 작성 시 31-stored-procedures.md / 30-database-schema.md
Step 5. 메뉴 등록 SQL 시 30-database-schema.md §5
Step 6. 출력 직전 99-anti-patterns.md self-check
```

## 5. KTNG 만의 함정 (이 rule pack 이 존재하는 이유)

1. **MENU_CD 환각** — `UI_BF_KTNG_01` 이 정답인데 LLM 이 `UI_BF_<DESCRIPTIVE_NAME>` 으로 만들면 KTNG 의 일관성 깨짐
2. **패키지 경로 환각** — KTNG 산출물을 `web/domain/<도메인>/` 에 만들면 충돌. 반드시 `web/ktng/<도메인>/`
3. **Composer 컨벤션 오적용** — wingui 본가의 4-tier (Entity+Service+Controller+SP) 를 KTNG 에 그대로 적용하면 KTNG 코드 베이스의 단순한 패턴 (Controller + SP 만) 과 어긋남
4. **multipart/form-data 환각** — Composer rule 의 `request.getParameter("changes")` 패턴을 KTNG 에 적용하면 안 됨. KTNG 는 `@RequestBody List<Map<String,Object>> changes`
5. **JdbcTemplate 환각** — KTNG 는 `QueryHandler` 만 사용 (Composer 의 새 패턴 적용 금지)
6. **Spring Boot 2/3 혼동** — KTNG 는 3.x 이지만 일부 옛 코드가 남아있을 수 있음. `jakarta.*` 일관 사용

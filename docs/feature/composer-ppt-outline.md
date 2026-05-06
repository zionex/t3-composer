# T3Composer — PPT 작성용 토픽 정리

> 이 문서는 T3Composer 발표 자료 작성을 위한 **슬라이드별 토픽 / 메시지 / Process Flow** 를 정리한 것입니다.
> 각 섹션이 슬라이드 1~2장에 대응하도록 구성되어 있으며, 핵심 메시지 → 본문 bullet → 다이어그램 설명 순으로 적혀있습니다.

---

## §1. 표지 / 개요

### Slide 1 — 표지
- **T3Composer** — AI 기반 화면 생성·수정 도구
- 부제: "자연어 / 설계서 / 기존 화면" 으로부터 React + Spring 화면 자동 생성
- 발표자 / 일자

### Slide 2 — Why T3Composer
- T3Series 화면 1개 만들려면: JSX + Controller + Service + Entity + SP + 메뉴 SQL + 다국어 = **6~8 종 산출물**
- 손으로 작성 시: 1.5~3 인일, 규약 위반 빈발 (BaseGrid props · MENU_CD 형식 · @Column 매핑 등)
- Composer 의 가치
  1. 9단계 위자드로 누구나 일관된 산출물 생성
  2. 기존 화면 복사 / 설계서 / 자연어 3가지 출발점 지원
  3. 3-Layer 정책 검증으로 wingui 규약 자동 준수
  4. AI prefill 로 사용자 입력 최소화

### Slide 3 — 한눈에 보는 Composer
```
┌─────────────────────────────────────────────────────────┐
│   사용자 입력                                             │
│    · 자연어 (NEW_NL)                                       │
│    · 기존 메뉴 선택 (NEW_FROM_COPY)                        │
│    · Excel 설계서 업로드 (NEW_FROM_DESIGN)                 │
│    · 단계별 직접 입력 (NEW_STEP)                           │
│    · 기존 화면 수정 (EXISTING_MODIFY)                      │
└────────────────────────────┬────────────────────────────┘
                             ▼
              ┌──────────────────────────────┐
              │   AI prefill (Sonnet 4.5/4.6) │
              │   · 9단계 spec JSON 자동 채움  │
              └──────────────┬───────────────┘
                             ▼
              ┌──────────────────────────────┐
              │     9-Step Wizard (UI)         │
              │   사용자 검토·수정·확정         │
              └──────────────┬───────────────┘
                             ▼
              ┌──────────────────────────────┐
              │   Step9 Generate (Claude)     │
              │   화면 + 백엔드 + SP + 메뉴   │
              │   아티팩트 6~8종 일괄 생성     │
              └──────────────┬───────────────┘
                             ▼
              ┌──────────────────────────────┐
              │   3-Layer 정책 검증            │
              │   (LLM / Hook / Apply)        │
              └──────────────┬───────────────┘
                             ▼
              ┌──────────────────────────────┐
              │   Apply (선택)                │
              │   · 파일 저장                  │
              │   · DDL/SP DB 실행             │
              │   · 메뉴 등록                  │
              └──────────────────────────────┘
```

---

## §2. 6가지 생성 모드

### Slide 4 — Mode Map (한 장 요약)

| Mode | 입력 | 새 테이블 DDL | 새 SP | 사용 시점 |
|---|---|---|---|---|
| `NEW_NL` | 자연어 | ✅ 허용 | ✅ 필수 | 새 도메인 / 새 테이블이 필요한 신규 |
| `NEW_GENERAL` | 자연어 (레거시) | ✅ | ✅ | NEW_NL 와 동일, 구버전 호환 |
| `NEW_STEP` | 빈 spec | ❌ 차단 | ✅ 필수 | 기존 테이블 + 사용자가 단계별 직접 입력 |
| `NEW_FROM_COPY` | 원본 메뉴 sourceBundle | ❌ 차단 | ✅ 필수 (재생성) | 기존 화면 복제 + 약간 변형 |
| `NEW_FROM_DESIGN` | Excel 설계서 | ❌ 차단 | ✅ 필수 | 설계서대로 화면 재현 |
| `EXISTING_MODIFY` | 기존 화면 수정 | ✅ ALTER 허용 | ✅ ALTER 허용 | 기능 보강 / 버그 수정 |

핵심 메시지:
- 모든 모드는 **wingui 단독 구동** 산출물만 허용 (외부 mpserver/dpserver 의존 X)
- 모든 모드는 **SP_UI_\*.sql 생성 필수** (2026-04-27 정책 전환)

### Slide 5 — 모드별 진입 화면
```
NEW_STEP        → 모듈 선택 → StepByStepWizard 진입 (빈 spec)
NEW_FROM_COPY   → 원본 메뉴 선택 + 신규 메뉴코드 → AI 분석 → Wizard 진입
NEW_FROM_DESIGN → Excel 업로드 → 시트 검토 + 레이아웃 정리 → Wizard 진입
NEW_NL          → 자연어 채팅창 → 즉시 LLM 호출
EXISTING_MODIFY → 메뉴 선택 → 채팅창 → 변경 지시 LLM 호출
```

---

## §3. 9-Step Wizard (가장 중요한 슬라이드 군)

### Slide 6 — 9단계 개요
> NEW_STEP / NEW_FROM_COPY / NEW_FROM_DESIGN 3개 모드가 **동일 9단계**를 공유. 차이는 prefill 출처뿐.

| # | Step Key | 화면 | 수집 데이터 |
|---|---|---|---|
| ① | layout | Step1Layout | patternCode + areas[] (12-grid 좌표) |
| ② | overview | Step2Overview | screenId, screenName, menuCd, parentMenuCd, menuFilePath, langKey |
| ③ | components | Step3Components | area 별 컴포넌트 + 버튼 |
| ④ | dataBinding | Step4DataBinding | source(JPA/SP/ONTOLOGY) + entity + baseUrl + spName |
| ⑤ | columns | Step5Columns | area 별 BaseGrid 컬럼 명세 |
| ⑥ | cascade | Step6Cascade | 그리드 내 주종관계 (item-itemLv 등) |
| ⑦ | filter | Step7FilterBar | 검색 영역 필드 정의 |
| ⑧ | filterCascade | Step8FilterCascade | 검색 필드 의존성 + 상호 검증 |
| ⑨ | generate | Step9Generate | 변경 요청 + Claude 호출 |

### Slide 7 — Step 1: Layout (화면 분할)
- 패턴 선택 (P02 검색+그리드 / P04 좌우 스플릿 / P03 탭 / P06 크로스탭 등 7종)
- 12-grid 시각 편집기로 영역 위치 / 크기 직접 조정
- areas[] 자동 생성 → 후속 단계의 키

```
[ Pattern 카탈로그 (255개) ]
  ↓
[ 시각 편집기 (드래그)   ]
  ↓
[ areas[] = [{id, x, y, w, h, kind, parent}, …] ]
```

### Slide 8 — Step 2: Overview (메뉴 메타)
- MENU_CD = `UI_<DOMAIN>_<NAME>` 형식 강제
- MENU_FILE_PATH = `/<module>[/<category>]/<PascalCase>` 형식 강제
- MENU_PATH = `LOWER(MENU_FILE_PATH)`
- 다국어 키 자동 = MENU_CD
- 부모 메뉴: MENU_UTIL · MENU_DP · MENU_MP · MENU_FP · MENU_BF · MENU_IM · MENU_RP · MENU_SA · MENU_AD

### Slide 9 — Step 3: Components (컴포넌트 + 버튼)
- area 별로 컴포넌트 선택 (BaseGrid / Form / Chart / Custom)
- 버튼 카탈로그: GridAddRowButton / GridDeleteRowButton / GridSaveButton / GridExcelExportButton 등
- 버튼은 객체 배열로 저장 (key/role/label) — Step9 가 JSX 으로 변환

### Slide 10 — Step 4: Data Binding (데이터 호출)
3가지 source 자동 추론:
- **`JPA_ENTITY`** — REST 마스터 CRUD (AD/UT/CM/IM 등) → zAxios + RestController + JdbcTemplate(SP) 패턴
- **`SP`** — BF/DP/MP/FP 계산 화면 → callService 엔진 경유
- **`ONTOLOGY`** — 자연어 질의 화면

자동 default:
- `defaultSourceFor(moduleCode)` 함수가 모듈코드로 자동 결정

### Slide 11 — Step 5: Columns (그리드 컬럼)
- 컬럼 속성: name / fieldName / dataType / displayType / width / editable / textAlignment / useDropdown / lookupDisplay / values / labels / datetimeFormat / numberFormat / validRules / editor
- AI prefill 시 원본/설계서에서 컬럼 자동 추출
- 사용자가 Step5 에서 추가 / 수정 / 삭제 가능

### Slide 12 — Step 6: Grid Cascade (그리드 주종관계)
- `applyGridCascade` 자동 wiring (`packages/wingui/src/common/fieldCascade.js` 레지스트리 기준)
- 예: `planScope → itemLvCd → itemCd` (자식이 부모 값에 의존)
- popup-only 마스터 (deptCd, positionCd) 도 동일 레지스트리

### Slide 13 — Step 7: FilterBar (검색 영역)
- `filter-bar.schema.json` 단일 권위 스키마
- DOMAIN_PLAN_SCOPE / DOMAIN_ITEM_MULTI / DOMAIN_DATE_RANGE 등 9종 도메인 타입
- 일반 타입: TEXT / NUMBER / DROPDOWN / DATE / DATE_RANGE / RADIO / CHECKBOX / POPUP / AUTOCOMPLETE
- 핵심 규칙: flatten / delimiter_for_sp / transform_when_all 자동 적용

### Slide 14 — Step 8: Filter Cascade (검색 의존성)
- 필드 간 의존: `value_changed` → `reload_options` / `clear_value` / `set_visibility`
- 상호 검증 (cross_field_rules): 날짜 from > to / 둘 다 있거나 없거나 / 기간 길이 경고
- expression 컨텍스트: `form.<var>`, `session.*`, `@now`, `days_between` 등

### Slide 15 — Step 9: Generate (Claude 호출)
- 사용자 자유 텍스트 변경 요청 입력
- `toLlmPayload(spec, module, pattern)` 으로 JSON 직렬화
- Claude Sonnet 4.6 max_tokens=100K (auto-continuation 5회 + 40분 timeout)
- 결과: 6~8 종 산출물 (SCREEN_JSX / JAVA_ENTITY / JAVA_SERVICE / JAVA_CONTROLLER / SQL_SP / MENU_SQL 등)

---

## §4. AI Prefill (사용자 입력 최소화)

### Slide 16 — Prefill 두 종류
| 모드 | 호출 | 모델 | 입력 |
|---|---|---|---|
| NEW_FROM_COPY | `PrefillFromSourceService` | Sonnet 4.5 (8K tokens) | sourceBundle (원본 JSX/Java/SP) |
| NEW_FROM_DESIGN | `DesignDocAnalyzeService` | Sonnet 4.5 (4K tokens) | parsedDesign (Excel 시트) |

공통:
- 9단계 spec JSON 한 번에 prefill
- 정규식 baseline (createInitialSpecFromSource/Design) 도 항상 실행 → AI 결과와 deep merge
- 알맹이 없는 AI 응답은 baseline 우선 (LLM 환각 방어)

### Slide 17 — SourceBundle 분석 (NEW_FROM_COPY)
```
원본 메뉴 선택
  ↓
ViewSourceBundleService.collectSourceBundle(menuCd)
  → JSX + 백엔드 (Controller/Service/Repository/Entity) + SP DDL 일괄 수집
  ↓
SourceBundleAnalysisPanel — wizard 진입 전 미리보기
  ↓
AI prefill (선택) + 정규식 baseline → mergeAiSpecIntoBaseSpec
  ↓
StepByStepWizard 진입 (prefilledSpec 주입)
```

특수 처리:
- `grepSpNamesFromBundle` — sourceBundle 모든 텍스트에서 SP 이름 grep
- `classifySpListByCrud` — `_Q1` → read · `_S1` → create · `_D1` → delete 자동 분류

---

## §5. Pattern / Dictionary 카탈로그

### Slide 18 — 화면 패턴 (255+)
```
LAYOUT_H2 (좌우 2분할)        → 11 좌우 2분할
LAYOUT_V2 (상하 2분할)        → 21 상하 2분할
LAYOUT_MIXED                  → 31 혼합·격자·특수
LAYOUT_CONTROLBOARD (31개)    → 91 ControlBoard (엔진 관제)
LAYOUT_PLANEDIT (20개)        → 92 PlanEdit (계획 보정)
LAYOUT_MONITORING (30개)      → 93 Monitoring (실시간 관제)
LAYOUT_ROUTELAYOUT (3개)      → 95 RouteLayout (공정 라우트)
```
- 각 패턴은 `PatternPreview.jsx` 의 4500줄 렌더러로 시각화
- 400×260 캔버스 + DC 다크 팔레트 일관 디자인

### Slide 19 — Dictionary (사전)
| 사전 | 테이블 | 항목 수 |
|---|---|---|
| Grid Type | TB_IS_COMPOSER_GRID_TYPE | RealGrid2 / TreeGrid / Pivot 등 |
| Chart Type | TB_IS_COMPOSER_CHART_TYPE | Chart.js 60+ 변형 |
| KPI Dict | TB_IS_COMPOSER_KPI_DICT | S&OP 40 + SCM 모듈별 112 = 152개 |

KPI 사용 흐름:
- Step3 컴포넌트로 KPI 위젯 선택 → CODE 매핑 → 차트 자동 렌더

---

## §6. 산출물 / Apply

### Slide 20 — 산출물 (Artifacts) 7종
| 타입 | 내용 | 적용 위치 |
|---|---|---|
| SCREEN_JSX | React 화면 컴포넌트 | `packages/wingui/src/view/<m>/<n>/...jsx` |
| JAVA_ENTITY | JPA Entity (`@Table` + `@Column`) | `web/domain/<m>/<feature>/<X>.java` |
| JAVA_SERVICE | JdbcTemplate 으로 SP 호출 | `<X>Service.java` |
| JAVA_CONTROLLER | RestController + zAxios endpoint | `<X>Controller.java` |
| JAVA_REPOSITORY | JpaRepository (선택) | `<X>Repository.java` |
| SQL_DDL | CREATE TABLE TB_* | `t3series-database/mssql/upgrade/vX.Y.Z-YYYYMMDD/tables/` |
| SQL_SP | CREATE OR ALTER PROCEDURE SP_UI_* | `.../procedures/SP_UI_*.sql` |
| MENU_SQL | TB_AD_MENU + LANG_PACK + PERMISSION_GROUP | DB INSERT |

상태:
- DRAFT (생성 직후) → FINAL (apply 성공) → DISCARDED (재생성으로 supersede)

### Slide 21 — Apply 흐름
```
세션의 FINAL 상태 아티팩트 목록
  ↓
[자동적용 ON]
   ↓
ArtifactApplyService.apply(sessionId, opts)
   ├─ 파일 저장 (project-root 하위, allow-write-patterns 매칭)
   ├─ SQL_DDL 실행 (CREATE TABLE TB_* 만 허용)
   ├─ SQL_SP 실행 (CREATE OR ALTER PROCEDURE SP_UI_* 만 허용)
   └─ 메뉴 등록 (별도 다이얼로그에서 처리)

[자동적용 OFF — 프로덕션 기본]
   → 정보성 안내 표시 + 수동 적용 가이드:
       · 미리보기 코드를 표시 경로에 직접 저장
       · DDL/SP 스크립트를 SSMS 등에서 실행
       · 관리자에게 auto-apply-enabled=true 활성화 요청
```

### Slide 22 — 메뉴 등록 (TB_AD_*)
```sql
TB_AD_MENU              -- 메뉴 트리 (PARENT_ID, MENU_CD, MENU_PATH, MENU_FILE_PATH, MENU_SEQ)
TB_AD_LANG_PACK         -- 다국어 (ko/en/ja/zh) — LANG_KEY = MENU_CD
TB_AD_PERMISSION_GROUP  -- 권한 (형제 메뉴에서 복사)
```

자동 생성:
- ID = `LOWER(REPLACE(NEWID(),'-',''))` (UUID)
- PARENT_ID = `(SELECT ID FROM TB_AD_MENU WHERE MENU_CD = '<parent>')`
- MENU_SEQ = 자동 부여
- 4개 언어 LANG_PACK 동시 INSERT

---

## §7. 3-Layer 정책 검증 (핵심 차별점)

### Slide 23 — Why 3-Layer
T3Series 의 wingui 규약 (BaseGrid props · MENU_CD 형식 · `jakarta.*` import 등) 은 **위반 시 컴파일/런타임 실패**가 빈발 → AI 가 만들어도 사람이 그대로 쓸 수 있도록 강제 검증.

| Layer | 시점 | 메커니즘 |
|---|---|---|
| **1. LLM** | 생성 직전 | `ComposerPromptBuilder.INVARIANTS` 가 모든 mode prompt 의 앞·뒤에 삽입 |
| **2. Hook** | 파일 저장 시 | `pre-tool-use-validator.sh` 가 Write/Edit 직전에 산출물 검증 (block / warn) |
| **3. Apply** | 아티팩트 적용 시 | `ArtifactApplyService.checkWinguiNativePolicy` 가 정책 위반 시 `policyBlocked:true` 로 차단 |

### Slide 24 — 검증 항목 (요약)
- ✅ MENU_CD 형식 (`UI_<DOMAIN>_<NAME>`)
- ✅ MENU_FILE_PATH 형식 (자동 추가 폴더 이중화 차단)
- ✅ BaseGrid API (`items` / `afterGridCreate` — `columns` / `afterCreate` 차단)
- ✅ jakarta.\* import (javax.\* 차단)
- ✅ TB_AD_MENU 허구 컬럼 차단 (`MENU_NM` / `PARENT_MENU_CD` / `URL` 등)
- ✅ Master 필드 자유 text 차단 (Pop\* 강제)
- ✅ 신규 화면에 SP_UI_\*.sql 누락 차단
- ✅ 엔진 service XML 신규 생성 차단
- ✅ NEW_FROM_DESIGN/COPY/STEP 에서 새 테이블 DDL 차단

---

## §8. Source Trace (디버깅 / 추적)

### Slide 25 — JSX → Controller → Service → SP → Table
```
JSX 의 zAxios.get('util/user-infos')
   ↓
Java 트리에서 @GetMapping("/util/user-infos") 가진 Controller 찾기
   ↓ (UserInfoController.java)
private final UserInfoService 필드 → 서비스 클래스 식별
   ↓
UserInfoService.java 본문에서 SP_UI_*, FN_*, TB_* 패턴 grep
   ↓ (SP_UI_UT_01_Q1, SP_UI_UT_01_S1, SP_UI_UT_01_D1)
t3series-database 트리에서 SP DDL 파일 매칭
   ↓
SP DDL 본문에서 TB_* 추가 추출 + 파라미터 추출
```

용도:
- **NEW_FROM_COPY** prefill — 원본 화면의 SP/Table 자동 인식
- **설계서 export** — Table/Query 시트 자동 채움

---

## §9. 설계서 Export / Import

### Slide 26 — Excel 설계서 8시트 구성
| 시트 | 내용 |
|---|---|
| 개정이력 | 작성일/버전/작성자 |
| 개요 | 화면명/ID/메뉴/주요 기능/사용 테이블/SP 개수/생성 산출물 |
| 레이아웃 | 분할 방향(좌우/상하/4분할) + BaseGrid 위치 + Tab 정의 + JSX 영역 트리 |
| 조회조건 | InputField + CommonCodeSelect + Pop\* + 도메인 컴포넌트 |
| 그리드 목록 | BaseGrid 요약 (id/위치/items 변수/컬럼 수/버튼) |
| `좌측그리드`/`grid-1` 등 | 각 그리드별 컬럼 상세 (다중 시트) |
| table | 사용 테이블 모두 + 출처 (DDL/Entity/SP/JSX/프로젝트 스캔) |
| query | SP DDL + JSX zAxios + Controller @\*Mapping + Service SP grep 통합 |

### Slide 27 — 양방향 활용
- **Export**: 세션 → 설계서 (사람이 검토 / 외부 공유 / 의사결정자 보고)
- **Import**: 설계서 → NEW_FROM_DESIGN 모드 진입 → 같은 화면 재생성
- 시트명 / 헤더 키워드가 양방향 호환되도록 설계 (`grid|그리드`, `좌측|우측`, `name|header|type|width|editable|format|align`)

---

## §10. 세션 라이프사이클

### Slide 28 — 상태 전이
```
ACTIVE (생성 직후)
  │
  ├─ [메뉴 등록 완료] AND [아티팩트 적용 완료]
  │      ↓ (서버 자동 전이)
  │   COMPLETED
  │      │
  │      └─ [수동 ACTIVE 복귀 → 재수정 가능]
  │
  └─ [사용자 명시적 ARCHIVE]
        ↓
     ARCHIVED
```

자동 전이 조건 (둘 다 충족):
- TB_IS_COMPOSER_ARTIFACT 에 ARTIFACT_TYPE='MENU_SQL' AND STATUS='FINAL' 1건 이상
- 동 세션에 ARTIFACT_TYPE<>'MENU_SQL' AND STATUS='FINAL' 1건 이상

---

## §11. 기술 스택 / 통합

### Slide 29 — Backend
- **Spring Boot 3.0.13** + Java 17
- **Anthropic Claude SDK** (Sonnet 4.6 기본, 4.5 prefill)
  - max_tokens 100K + auto-continuation 5회
  - responseTimeout 40분
- **JPA + JdbcTemplate** — Service 가 SP 직접 호출
- **POI 4.1.2** — Excel 설계서 export

### Slide 30 — Frontend
- **React 18.3.1** + Kendo React 5.8 + MUI 5.11
- Zustand store (`useViewStore` / `useContentStore`)
- RealGrid2 (BaseGrid)
- 9-Step Wizard 컴포넌트 (`StepByStepWizard.jsx`)

### Slide 31 — DB / 레퍼런스
- **TB_IS_COMPOSER_*** 4종 — Pattern / Grid Type / Chart Type / KPI Dict
- **TB_IS_COMPOSER_SESSION/MESSAGE/ARTIFACT** — 세션·메시지·산출물 영속화
- **TB_AD_MENU + LANG_PACK + PERMISSION_GROUP** — 메뉴 등록
- 프로젝트 스캔: `t3series-wingui/src/main/java` + `t3series-database`

---

## §12. 안전장치 / 운영

### Slide 32 — 운영 안전장치
- **자동적용 OFF** (프로덕션 기본): 서버가 파일/DB 직접 변경 안 함 → 정보성 안내만
- **project-root 제한**: 쓰기는 설정된 절대 경로 하위로만
- **allow-write-patterns**: glob 매칭하는 경로만 쓰기 허용
- **DDL 안전성**: `CREATE TABLE TB_*` / `ALTER TABLE TB_* ADD/ALTER` 만 허용. DROP/TRUNCATE/xp_cmdshell 등 차단
- **per-statement transaction**: SP/DDL 1건씩 개별 트랜잭션
- **세션 격리**: 한 사용자의 세션은 다른 사용자 산출물에 영향 없음

### Slide 33 — 정적 분석 / 빌드 게이트
- SpotBugs 4.7 + Find-Sec-Bugs `failOnError=true`
- PMD 3.19 `failOnViolation=true`
- Checkstyle 10.4 `failsOnError=true`
- DeepSource (Java/Python/JS/React)
- 모든 게이트 통과해야 빌드 성공 → AI 산출물도 동일 품질 기준

---

## §13. 도입 효과 / Roadmap

### Slide 34 — 정량 효과 (예시 수치 — 실측치로 대체 권장)
| 지표 | 손코딩 | Composer | 절감 |
|---|---|---|---|
| 화면 1개 산출물 작성 시간 | 1.5~3 인일 | 5~30분 | 90%+ |
| 규약 위반율 | 30~50% | <5% (3-Layer 검증) | 거의 0 |
| 다국어 누락 | 빈번 | 자동 (LANG_PACK 4언어 동시 INSERT) | 0 |
| SP 누락 | 빈번 | 자동 (모든 신규 화면 필수) | 0 |

### Slide 35 — 향후 계획
- 더 많은 도메인 패턴 추가 (BF/DP/MP 특화)
- Multi-modal 입력 (Figma export → JSX)
- A/B 테스트 모드 (한 화면 2가지 변형 동시 생성)
- Auto-test 생성 (Cypress 시나리오 같이 만들기)

### Slide 36 — Q&A / Demo
- 라이브 Demo: NEW_FROM_COPY → 9-Step → 생성 → 설계서 다운로드 (5분)
- 질의 응답

---

## 부록 — 다이어그램 / 시각자료 권장

### A1. Process Flow Diagram (전체)
**Slide 3** 의 텍스트 박스 그림을 PPT 의 SmartArt 또는 Visio 도형으로 옮기기.

### A2. 9-Step Wizard 트리
**Slide 6** 의 표를 가로 9칸 화살표 + 각 칸에 STEP icon + 핵심 데이터 키 배치.

### A3. Mode 비교 매트릭스
**Slide 4** 의 표를 색상 코드 (NEW = 파랑 / EXISTING_MODIFY = 주황) 로 강조.

### A4. 3-Layer 검증 다이어그램
**Slide 23** 을 3개의 동심원 또는 3 단 funnel 로 표현 — Layer 1(LLM) → Layer 2(Hook) → Layer 3(Apply).

### A5. Source Trace 흐름
**Slide 25** 를 6 단 stepper (JSX → Controller → Service → SP → Table) 로 시각화.

### A6. 설계서 8시트 thumbnail
**Slide 26** 을 Excel 시트 8개의 작은 미리보기 이미지로 (각 시트의 헤더 첫 행만 보이게).

---

## 발표 시 강조할 핵심 메시지 3가지

1. **"화면 1개를 5~30분에"** — 손코딩 대비 90%+ 시간 절감
2. **"3-Layer 정책으로 규약 100% 보장"** — AI 가 만들어도 빌드/런타임 실패 거의 없음
3. **"양방향 설계서"** — Export 한 설계서를 그대로 NEW_FROM_DESIGN 입력으로 재사용 가능

---

## 발표 흐름 권장 (45분 기준)

| 시간 | 슬라이드 | 비중 |
|---|---|---|
| 0-3분 | §1 표지/Why | 5% |
| 3-8분 | §2 Mode + §3 Wizard 개요 (Slide 6) | 15% |
| 8-20분 | §3 Wizard 상세 (Slide 7~15) | 30% |
| 20-25분 | §4 AI Prefill | 10% |
| 25-30분 | §5 Pattern/Dictionary | 10% |
| 30-37분 | §6 산출물 + §7 3-Layer | 15% |
| 37-42분 | §9 설계서 + §13 효과 | 10% |
| 42-45분 | Q&A | 5% |

---

**작성일**: 2026-04-28
**대상 모듈**: T3Composer (`packages/wingui/src/view/util/t3composer/` + `web/domain/insight/composer/`)

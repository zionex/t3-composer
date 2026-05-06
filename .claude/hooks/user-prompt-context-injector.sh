#!/usr/bin/env bash
# =====================================================================
# T3Series — UserPromptSubmit Context Injector
# =====================================================================
# 사용자가 프롬프트를 제출하는 시점에 실행.
# 프롬프트 내용을 분석하여 관련 rules/*.md 의 핵심 요약을 stdout 으로
# 출력하면, Claude Code 가 추가 context 로 인식한다.
#
# 정책: stdout 출력 = Claude 컨텍스트 · exit 0 정상 · exit 2 차단(드뭄)
#
# ─── 키워드 핸들러 인덱스 ─────────────────────────────────────────────
# §1.   온톨로지 (자연어 질의 / Insight / 채팅)
# §2.   신규 화면 / JSX 개발
# §3.   Stored Procedure (SP_UI_*)
# §4.   테이블·뷰·DB 스키마
# §4.5. SQL 쿼리 작성 (스키마 사전 검증)
# §4.5. FilterBar 조회 조건 JSON
# §5.   기술 스택 / 의존성
# §6.   보안 / 인증 / JWT
# §6.5. Composer 화면 생성/수정 (rules/41 — 통합 9단계 Wizard · 위젯 매트릭스/cascade/공통코드 등)
# §7.   배치/스케줄러/메시징
# =====================================================================

set -uo pipefail

. "$(dirname "${BASH_SOURCE[0]}")/_jq-fallback.sh"

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

INPUT="$(cat)"
PROMPT="$(echo "$INPUT" | jq -r '.prompt // empty')"

[ -z "$PROMPT" ] && exit 0

# 프롬프트를 소문자로 정규화 (키워드 매칭용)
PROMPT_LC="$(echo "$PROMPT" | tr '[:upper:]' '[:lower:]')"

INJECTED=""

# =====================================================================
# 1. 온톨로지 관련 키워드 감지
# =====================================================================
if echo "$PROMPT_LC" | grep -qE "자연어|natural language|nl query|nlquery|챗봇|chatbot|채팅|chat|insight|온톨로지|ontology|q&a|qapattern|entity|intent|querydsl"; then
  INJECTED="${INJECTED}
<project_rule_reminder source=\"rules/10-ontology-first.md\">
⚠️ 온톨로지 우선 원칙 적용 필요:
1. TB_IS_QAPATTERN (db_type 필터 필수) → 2. tb_is_vwbusnss_ontlgy (menu_cd, status='UPTODATE') → 3. tb_is_prcss_ontlgy → 4. tb_is_ontlgy_entity (status='CONFIRMED') → 5. tb_is_ontlgy_entity_relation (weight>=0.5)
- 테이블명/SP명에서 역추측 금지. 반드시 온톨로지 경유로 의미 해석.
- status='DRAFT' 값으로 답변 금지. UPTODATE + published_version 만 사용.
- LLM 추론본(llm_*)과 사용자 편집본 동시 병합 금지.
상세: .claude/rules/10-ontology-first.md
</project_rule_reminder>"
fi

# =====================================================================
# 2. 신규 화면 · JSX 개발 키워드 (2026-04-27 정책 전환 반영)
# =====================================================================
if echo "$PROMPT_LC" | grep -qE "신규 화면|new screen|new page|화면 개발|화면 만|화면 추가|jsx|react 화면|basegrid|contentinner|wingui/src/view"; then
  INJECTED="${INJECTED}
<project_rule_reminder source=\"rules/20-screen-development.md, 21-components.md, 41a-composer-jsx.md\">
✅ 화면 개발 필수 체크 (Hook 자동 차단되는 옛 API 회피):

[파일 배치]
- 경로: packages/wingui/src/view/<module>[/<category>]/<n>/<N>.jsx
- 표준 원본 복제: Users.jsx · IssueMgmt.jsx · UserInfoMgmt.jsx (마스터 CRUD)
- ⛔ utility 도메인은 'util/' 단 하나뿐 — 'ut/' 절대 금지

[JSX 표면]
- import 단일 경로: @wingui/common/imports (개별 store 경로 금지)
- 최상위: <ContentInner> 래퍼 필수
- gridItems: **컴포넌트 밖** 선언 + **모든 컬럼에 dataType 명시** (text/number/datetime/boolean/group)
  · key='name', 헤더='headerText', 정렬='textAlignment' (★ field/header/textAlign 금지)
  · enum 컬럼: useDropdown:true + lookupDisplay:true + values + labels (4개 모두)
- 그리드 획득: <BaseGrid id=\"<camelCase>Grid\" items={...} afterGridCreate={(grid,view,dp)=>...} />
  · ★ columns/afterCreate 옛 API 금지 — Hook block
  · grid.dataProvider.fillJsonData / getAllStateRows / getJsonRow (★ setData/getChanges 금지)
- Grid 버튼: grid=\"<string-id>\" (★ grid={ref객체} 금지)
- Store 매핑 (swap 금지): activeViewId ← useContentStore · setViewInfo ← useViewStore
- 글로벌 버튼: setViewInfo(activeViewId, 'globalButtons', [{ name, action, visible, disable }])
  · ★ {code, onClick} 옛 키 금지 — Hook block
- showMessage(title:string, message, callback?) — callback (ok:boolean)=>void
  · ★ showMessage('confirm', ...) 등 type 토큰 첫 인자 금지

[서버 통신 — 신규 화면 표준 (4-tier · 2026-04-27 정책)]
- zAxios.get('<m>/<features>', { params: getValues() }) → grid.dataProvider.fillJsonData(res.data)
- 저장: GridSaveButton onSave + multipart 'changes' (FormData)
- 삭제: zAxios POST '<m>/<features>/delete' + JSON body
- 백엔드: RestController + Service(JdbcTemplate.query(\"EXEC SP_UI_<...>_Q1 ?, ?\", ...))
- ❌ 신규 화면에서 callService(...) 사용 금지 — BF/DP/MP/FP 계산 화면 수정 전용

[Master / 공통코드 / Cascade]
- Master 필드(품목/거래처/거점/부서/직위 등) = 기본 POPUP — Pop* 재사용 (자유 text 금지)
  · 단, view/common/<X>.jsx 파일 실재 확인 후 import (PopDepartment/PopPosition 은 미실재)
- 공통코드(USE_YN/USER_TP/STATUS_CD 등) = <CommonCodeSelect groupCd=\"...\"> (hardcoded options 금지)
- Cascade 컬럼 사용 시 useFieldCascade(form) + applyGridCascade(grid) 호출
- 정렬: LEFT(기본) · CENTER(코드/날짜/boolean/enum) · 'far'(숫자)
- 날짜: 'yyyy-MM-dd' (단일) / 'yyyy-MM-dd HH:mm:ss' (일시)

[메뉴 등록 — TB_AD_MENU 실제 컬럼만]
- 컬럼: ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN + BaseEntity
- ❌ MENU_NM, PARENT_MENU_CD, URL, DEPTH, SORT_ORDER 컬럼 존재 안 함 (Hook block)
- MENU_CD 형식: UI_<DOMAIN>_<NAME> (★ UT_/MENU_/소문자/하이픈 금지)
- MENU_FILE_PATH: '/<module>[/<category>]/<PascalName>' (★ 마지막 직전 ≠ lowercase(마지막), 확장자 X)
- MENU_PATH = LOWER(MENU_FILE_PATH)
- parent: MENU_UTIL/MENU_DP/MENU_MP/MENU_FP/MENU_BF/MENU_IM/MENU_RP/MENU_SA/MENU_AD (★ MENU_UT 미존재)
- 다국어: TB_AD_LANG_PACK 4개 언어 (ko/en/ja/zh) — audit 컬럼 MODIFY_BY/MODIFY_DTTM (★ UPDATE_* 아님)
- 권한: TB_AD_PERMISSION_GROUP (★ TB_AD_PERMISSION 아님) — 형제 메뉴 복사
- MSSQL 구문만: GETDATE() / NEWID() (★ SYSDATE/SYS_GUID 금지)

[백엔드 4종 + SP_UI_*.sql DDL 필수]
- t3series-wingui/src/main/java/com/zionex/t3series/web/domain/<module>/<feature>/
  · <Feature>.java (@Entity, BaseEntity 상속) — 스키마 매핑용
  · <Feature>Service.java (@Service · JdbcTemplate 인젝션) — SP 호출 전담
  · <Feature>Controller.java (@RestController) — zAxios 엔드포인트
  · <Feature>Repository.java (선택) — 단순 JPA CRUD 필요 시만
- import 화이트리스트: jakarta.* (★ javax.* 금지) · com.zionex.t3series.web.util.audit.BaseEntity
- Controller 저장: HttpServletRequest + request.getParameter(ServiceConstants.PARAMETER_KEY_DATA)
- SP DDL: t3series-database/mssql/upgrade/vX.Y.Z-YYYYMMDD/procedures/SP_UI_<DOMAIN>_<NO>_Q1/S1/D1.sql
  · MSSQL 방언만 (Oracle 폴더 생성 금지) · 조회 SP 결정론적 ORDER BY 필수
- ❌ 엔진 service XML (mp/dp/bf/fp server/config/*_service.xml) 신규 생성 금지 — wingui 단독 구동

[다국어 / GridCnt]
- 한글 하드코딩 금지 — t('...') 또는 transLangKey('...')
- import { transLangKey } from '@zionex/wingui-core'
- GridCnt: format={\"{0} \" + transLangKey(\"CASES\") + \" \" + transLangKey(\"MSG_0010\")} 필수

[온톨로지 — 자연어 질의 대상이면]
- tb_is_vwbusnss_ontlgy.menu_cd 등록 + status='UPTODATE' 전이

[패턴 카탈로그]
- P01 위젯대시보드 / P02 검색+단일그리드 / P03 검색+탭 / P04 수평스플릿 M-D / P06 크로스탭 피벗
- 코드 스켈레톤: rules/20-screen-development.md §9

상세:
  · rules/20-screen-development.md (화면 골격 · 메뉴 등록)
  · rules/21-components.md (공용 컴포넌트 인벤토리)
  · rules/41a-composer-jsx.md (JSX 표면 단일 진실 저장소)
  · rules/41b-composer-java.md (Java 백엔드 단일 진실 저장소)
  · rules/41c-composer-widgets.md (위젯/Cascade/POPUP/CommonCode)
</project_rule_reminder>"
fi

# =====================================================================
# 3. Stored Procedure 키워드
# =====================================================================
if echo "$PROMPT_LC" | grep -qE "stored procedure|프로시저|sp_ui|sp 작성|sp 수정|mssql|oracle|plsql|t-sql"; then
  INJECTED="${INJECTED}
<project_rule_reminder source=\"rules/31-stored-procedures.md\">
✅ SP 작성 필수 체크:
- 네이밍: SP_UI_<DOMAIN>_<SCREEN_NO>_<ACTION>[번호]
  DOMAIN ∈ {AD,BF,CM,DP,DPD,FO,FP,IM,MP,RP,SA,SALES,SO,UT}
  ACTION ∈ {Q1..Qn, S1..Sn, D1..Dn, POP_Q1, CHART_Q1, BATCH}
- **MSSQL + Oracle 양쪽 작성** 필수 (t3series-database/{mssql,oracle}/procedures/)
- 에러 처리: SP_COMM_RAISE_ERR 사용
- 공통 검색: SP_COMM_SRH_* 재사용
- 버전 관리: FN_<DOMAIN>_NEW_VERSION + SP_<DOMAIN>_ADJ_VER_DATA_CREATE + KEEP_RESULT + HANDLING_RESULT
- DDL 변경: upgrade/vX.Y.Z-YYYYMMDD/tables/ 경유
- 시스템 SP 수정 금지: sp_helpdiagrams, sp_*diagram*, fn_diagramobjects
상세: .claude/rules/31-stored-procedures.md
</project_rule_reminder>"
fi

# =====================================================================
# 4. 테이블·뷰·DB 스키마 키워드
# =====================================================================
if echo "$PROMPT_LC" | grep -qE "테이블|table|db 스키마|schema|ddl|뷰|view|jpa|entity|repository|querydsl"; then
  INJECTED="${INJECTED}
<project_rule_reminder source=\"rules/30-database-schema.md\">
✅ DB 스키마 접근 주의:
- 총 674개 테이블. 전체 카탈로그: docs/reference/tables-catalog.md (grep 으로 조회)
- 주요 접두어: TB_FP(135 Factory) · TB_CM(106 Common) · TB_MP(58 MP) · TB_RT(34 Result) · TB_BF(31 BF) · TB_DP(29 DP) · TB_IM(17 IM)
- 온톨로지는 TB_IS_*(레거시) vs tb_is_*(신규 GraphRAG) **대소문자 혼용**
- 핵심 뷰 18개 중 재사용 1위: VW_LOCAT_ITEM_INFO (PlanScope × 위치 × 품목)
- MSSQL: WITH (NOLOCK) 기본. Oracle: SYS_GUID(), NVARCHAR2, T3SMARTSCM 스키마
- 멀티테넌트 분리 위해 PLAN_SCOPE 필터 누락 금지
- 다국어: TB_AD_LANG_PACK LEFT JOIN (lang_cd='ko')
상세: .claude/rules/30-database-schema.md | docs/reference/
</project_rule_reminder>"
fi

# =====================================================================
# 4.5. SQL 쿼리 작성 — 실제 스키마 사전 검증 강제 (rules/32)
# =====================================================================
if echo "$PROMPT_LC" | grep -qE "insert into|update .* set|select .* from|쿼리 작성|sql 작성|sql 생성|menu_sql|sql_ddl|sql_sp|tb_ad_|tb_cm_|tb_fp_|tb_mp_|tb_is_|tb_rt_|컬럼명|column name"; then
  INJECTED="${INJECTED}
<project_rule_reminder source=\"rules/32-sql-schema-verification.md\">
⚠️ SQL 스키마 사전 검증 (필수):
- 쿼리 작성 전 **반드시 Entity 파일 확인** — 프롬프트 예시·기억에 의존 금지
  · grep '@Column(name' t3series-wingui/src/main/java/**/<Entity>.java
  · 또는 docs/reference/tables-catalog.md grep
- 작성 후 모든 사용 컬럼 ↔ 스키마 대조 (자기 검증)

★ 자주 틀리는 TB_AD_MENU 실제 컬럼:
  ID · PARENT_ID · MENU_CD · MENU_PATH · MENU_SEQ · MENU_FILE_PATH · USE_YN + BaseEntity
  ❌ 금지(존재 안 함): MENU_NM · PARENT_MENU_CD · URL · DEPTH · SORT_ORDER
  - 표시명: TB_AD_LANG_PACK(LANG_KEY=MENU_CD, LANG_VALUE) 별도 등록
  - 부모 FK: PARENT_ID UUID → (SELECT ID FROM TB_AD_MENU WHERE MENU_CD='...')

★ TB_AD_LANG_PACK: LANG_CD/LANG_KEY/LANG_VALUE + MODIFY_BY/MODIFY_DTTM
  ❌ UPDATE_BY · UPDATE_DTTM 존재 안 함

★ TB_AD_PERMISSION_GROUP: ID/GRP_ID/MENU_ID/PERMISSION_TP(READ|UPDATE|DELETE)/USABILITY

한글 리터럴 N'...' · ID 는 LOWER(REPLACE(NEWID(),'-','')) · WHERE NOT EXISTS 중복 방지
상세·치트시트: .claude/rules/32-sql-schema-verification.md
Hook pre-tool-use-validator.sh 가 Write/Edit 시 허구 컬럼 자동 차단.
</project_rule_reminder>"
fi
# =====================================================================
# 4.5. FilterBar / 조회 조건 키워드
# =====================================================================
if echo "$PROMPT_LC" | grep -qE "filter[_ ]?bar|searcharea|조회 조건|검색 조건|검색 영역|조회 영역|필터|filter block|search block|조회조건"; then
  INJECTED="${INJECTED}
<project_rule_reminder source=\"rules/22-filter-bar.md\">
✅ FilterBar 생성 필수 체크:
- **단일 진실 저장소**: .claude/schemas/filter-bar.schema.json
- **샘플부터 복사**: .claude/schemas/examples/sample-{dp-monthly|common-code}.json
- 네이밍: block_id(snake_case) · field_id(UPPER_SNAKE) · output_variable.name(camelCase)
- SCM 도메인은 반드시 DOMAIN_* 타입 (DOMAIN_PLAN_SCOPE, DOMAIN_ITEM_MULTI 등)
- DATE_RANGE/PLAN_SCOPE 는 flatten 필수 (SP 는 스칼라 파라미터 받음)
- array 타입은 delimiter_for_sp: ',' (FN_SPLIT_NVARCHAR_TO_TABLE 호환)
- 전체 선택은 transform_when_all: 'send_null' (SP WHERE 절 호환)
- 다른 블록에서 @form.<form_id>.<output_variable.name> 으로 참조
- 계층 드롭다운은 dependencies 규칙 필수
- 상세: .claude/rules/22-filter-bar.md | 스키마: .claude/schemas/filter-bar.schema.json
</project_rule_reminder>"
fi


# =====================================================================
# 5. 의존성 · 기술스택 키워드
# =====================================================================
if echo "$PROMPT_LC" | grep -qE "의존성|dependency|pom\.xml|maven|라이브러리|library|업그레이드|upgrade|버전|version"; then
  INJECTED="${INJECTED}
<project_rule_reminder source=\"CLAUDE.md §2\">
✅ 기술 스택 고정값 (변경 금지):
- Java 17 · Spring Boot 3.0.13 · Hibernate 5.6.4.Final · QueryDSL 5.0.0 (jakarta)
- MapStruct 1.5.5.Final · Lombok 1.18.32
- React 18.3.1 · Kendo 5.8.0 · MUI 5.11.0 · Webpack 5 (16GB heap)
- POI 3.15 (전역) / 4.1.2 (wingui only) · JWT jjwt 0.12.6 (wingui)
- 의존성은 루트 pom.xml <dependencyManagement> 경유 필수. 모듈에 <version> 직접 명시 금지.
- dpserver: MSSQL+Oracle만 · wingui: EDB 미포함 · mp: Spring Boot Starter 없음(순수 Swing)
상세: docs/reference/tech-stack-overview.md
</project_rule_reminder>"
fi

# =====================================================================
# 6. 보안·인증 키워드
# =====================================================================
if echo "$PROMPT_LC" | grep -qE "jwt|spring security|인증|authentication|권한|authorization|로그인|login|비밀번호|password|암호화|encrypt"; then
  INJECTED="${INJECTED}
<project_rule_reminder source=\"CLAUDE.md, 99-anti-patterns.md\">
🔒 보안 규칙:
- Spring Security + JWT 는 **wingui 전용** (jjwt 0.12.6). 다른 모듈엔 없음.
- 비밀번호는 Jasypt ENC() 암호화 (application.yaml 평문 금지)
- JWT 시크릿은 .env 또는 환경변수 (소스 하드코딩 금지)
- API 엔드포인트에 @PreAuthorize 적용
- QueryDSL/PreparedStatement 사용 (문자열 연결 쿼리 금지 — SQL Injection)
- 로그에 개인정보·비밀번호 출력 금지
상세: .claude/rules/99-anti-patterns.md §6
</project_rule_reminder>"
fi

# =====================================================================
# 6.5 Composer 화면 생성 키워드 — JSX/MENU_SQL 런타임 규약
# =====================================================================
if echo "$PROMPT_LC" | grep -qE "composer|t3composer|컴포저|화면 생성|화면 자동|화면 수정|화면 복사|기존 화면|설계서|design doc|step.?wizard|단계별|9단계|9 단계|prefilled|sourcebundle|auto generat|neue screen|screen gen|menu_sql|menu sql|menu_file_path|tb_ad_menu"; then
  INJECTED="${INJECTED}
<project_rule_reminder source=\"rules/41-composer-generation.md\">
════════════════════════════════════════════════════════════
Composer **모든 모드** 불변 원칙:
신규 5종 (NEW_GENERAL/NEW_NL/NEW_STEP/NEW_FROM_COPY/NEW_FROM_DESIGN) + 수정 1종
※ 2026-04 통합: NEW_STEP/NEW_FROM_COPY/NEW_FROM_DESIGN 은 동일 9단계 Wizard.
  차이는 prefill 출처뿐 (빈 / sourceBundle / parsedDesign).
  → 모드별 LLM 호출이 따로 없음. Step9 가 통합 호출.
────────────────────────────────────────────────────────────
⓪ **유사 화면 참조 먼저 (Step 0, 생략 금지)**
   · 작업 시작 전 Read 로 유사 원본 2~3개 확인 필수:
     - CRUD: Users / IssueMgmt / UserInfoMgmt
     - 팝업: PopSelectItem (기준) · PopDepartment · PopPosition
     - 백엔드: admin/user/ · util/userinfo/
     - 검색+cascade: baselineforecast/master/actualsales/ActualSales.jsx
   · 출력 맨 앞에 '참조 원본: <파일1>, <파일2>' 명시
   · 원본과 동일한 구조·import·네이밍 사용 (자유 창작 금지)
① wingui 단독 구동으로 모든 화면이 동작해야 함 (외부 엔진 서버 기동 불필요)
② **기본 구현 = SP_UI_*.sql DDL + Entity + Service(JdbcTemplate SP 호출) + RestController** (2026-04-27 정책 전환)
   · web/domain/<module>/<feature>/ 아래 Entity/Service/Controller (Repository 는 선택)
   · t3series-database/mssql/upgrade/vX.Y.Z-YYYYMMDD/procedures/SP_UI_<DOMAIN>_<NO>_Q1/S1/D1.sql
   · Service 는 JpaRepository 대신 JdbcTemplate.query("EXEC SP_UI_<...> ?, ?", ...) 패턴
③ 신규 화면 SP 작성 규약 (필수):
   · 네이밍 SP_UI_<DOMAIN>_<NO>_<ACTION> · MSSQL 만 (memory: MSSQL only · Oracle 폴더 금지)
   · 조회 SP 결정론적 ORDER BY 필수 · CRUD 액션마다 1개 (read-only 면 _Q1 만)
   · ❌ 엔진 service XML (mp/dp/bf/fp server/config/*_service.xml) 신규 생성 금지 — wingui 단독 구동
   · ❌ 신규 화면에서 callService 사용 금지 — BF/DP/MP/FP 계산 화면 수정 전용
④ Composer 만의 새 관례/prefix/URL 생성 금지 — Users/IssueMgmt 와 동일
⑤ 수정 모드도 동일 원칙. 기능 추가는 SP 호출 메서드 추가 + 새 SP_UI_*.sql DDL
⑥ 9단계 Wizard 모드에서 백엔드 prompt builder 는 newStepGuide(StepGuideMode.{PLAIN,COPY,DESIGN}) 단일 진입점
   · NEW_FROM_COPY  → COPY prepend (원본 복제 STEP A~H)
   · NEW_FROM_DESIGN→ DESIGN prepend (설계서 충실 STEP A~G)
   · NEW_STEP       → prepend 없음 (Users.jsx 정답지 기반)
════════════════════════════════════════════════════════════

⚠️ Composer 화면 생성 필수 규약 (위반 시 NoContent 폴백 · 빈 그리드):

★ MENU_CD — **UI_<DOMAIN>_<SCREEN_NAME>** 형식 강제
  정규식: ^UI_(AD|BF|CM|DP|DPD|FO|FP|IM|MP|RP|SA|SALES|SO|UT)_[A-Z][A-Z0-9_]*$
  ✅ 'UI_UT_USER_INFO_MGMT' · 'UI_DP_MONTHLY_PLAN' · 'UI_MP_PLAN_RESULT'
  ❌ 'UT_USER_INFO_MGMT'    (UI_ 접두어 누락 · Composer 흔한 실수)
  ❌ 'USER_INFO_MGMT'       (DOMAIN 누락)
  ❌ 'MENU_UT_XXX'          (MENU_ 는 그룹 노드 전용)
  ❌ 'ui_ut_user_info_mgmt' (소문자)

★ MENU_FILE_PATH — '/<module>[/<category>]/<PascalComponentName>'
  ✅ '/util/UserInfoMgmt'                    → view/util/userinfomgmt/UserInfoMgmt.jsx
  ✅ '/snop/dashboard/ExecutiveDashboard'    → view/snop/dashboard/executivedashboard/ExecutiveDashboard.jsx
  ❌ '/util/userinfomgmt/UserInfoMgmt'  ← 마지막 직전 == lowercase(마지막) 이면 자동 추가 폴더 이중화
  ❌ '/util/UserInfoMgmt.jsx'           ← 확장자 포함 금지
  ❌ '/util/userinfomgmt'                ← 마지막 세그먼트는 PascalCase (JSX 파일명)
  변환 규칙: filepath.toLowerCase() + filepath.slice(lastIndexOf('/'))
  → 마지막 PascalCase 의 lowercase 폴더가 자동 추가됨 (수동 작성 금지)

★ MENU_PATH — URL hash, 권장: MENU_FILE_PATH.toLowerCase()
  ✅ FILE_PATH '/util/UserInfoMgmt'        → PATH '/util/userinfomgmt'
  ✅ FILE_PATH '/snop/dashboard/Executive' → PATH '/snop/dashboard/executive'
  ❌ MENU_PATH 에 PascalCase 대문자 사용 금지 (관례: 전부 lowercase)

★ parent MENU_CD (그룹 노드 · 실측):
  util=MENU_UTIL · demandplan=MENU_DP · masterplan=MENU_MP · factoryplan=MENU_FP
  baselineforecast=MENU_BF · inventory=MENU_IM · replenishmentplan=MENU_RP
  sales=MENU_SA · system=MENU_AD
  (❌ 'MENU_UT' 은 존재 안 함 · 그룹은 Composer 신규 생성 금지)

★ JSX 표면 API (실제 코드 기준 — rules/20 예시와 일부 다름):
  · import: '@wingui/common/imports' **단일 경로만**
  · BaseGrid: items={...} · afterGridCreate={(grid,view,dp)=>...} · id=\"<str>\"
    (❌ columns/afterCreate 금지)
  · 그리드 버튼: grid=\"<string-id>\"  (❌ grid={객체} 금지)
  · 데이터: grid.dataProvider.fillJsonData(data) / getAllStateRows() / getJsonRow(idx)
    (❌ grid.setData / getChangedData / getChanges 금지 — 존재 안 함)
  · 기본 (신규 화면): zAxios → RestController → JdbcTemplate → SP_UI_* (2026-04-27 정책)
    - zAxios.get('<module>/<features>', { params: getValues() })   ← Controller 가 JdbcTemplate.query(\"EXEC SP_UI_<...>_Q1 ?, ?\", ...)
    - <GridSaveButton url=\"<module>/<features>\" />                   ← Controller 가 JdbcTemplate.update(\"EXEC SP_UI_<...>_S1 ?, ?, ?\", ...)
    - zAxios({ method:'post', url:'<module>/<features>/delete', ... }) ← Controller 가 JdbcTemplate.update(\"EXEC SP_UI_<...>_D1 ?\", ...)
    - 파라미터·응답 key = Entity 필드(camelCase) 그대로 (BeanPropertyRowMapper 가 SP 결과 snake_case 자동 매핑)
    - wingui 단독 구동으로 동작 (외부 엔진 서버 불필요)

  · 예외 (BF/DP/MP/FP 계산 기반 기존 화면만):
    callService(serviceId, paramMap, target='mp') — 엔진 경유
    · target: mp/dp/bf/fp (PlatformService.Module enum)
    · 서비스 ID: mpserver 'SRV_UI_*', dpserver 'SRV_GET_SP_UI_*'/'SRV_SET_SP_UI_*'
    · 신규 화면은 이 경로를 쓰지 말 것
    ❌ util/system 도메인 신규 화면에서 callService 사용 금지
  · showMessage(title:string, message, callback?)  callback(answer: boolean)
    (❌ showMessage('confirm'|'error'|'info', ...) 금지 — 첫 인자는 제목)
  · globalButtons: [{ name, action, visible, disable }]  (❌ {code, onClick} 금지)

★ 런타임 메뉴 소스: 프로덕션은 DB(TB_AD_MENU) 경유.
  menus.js 는 develop 모드 전용 → **DB INSERT 필수**.
  권한은 형제 메뉴의 TB_AD_PERMISSION_GROUP 복사.

★ wingui Java 산출물 (신규 화면 필수 — 2026-04-27 SP 정책 전환):
  경로: t3series-wingui/src/main/java/com/zionex/t3series/web/domain/<module>/<feature>/
    · <Feature>.java           — @Entity(TB_<DOMAIN>_<NAME>) extends BaseEntity (SP 결과 매핑용)
    · <Feature>Service.java    — @Service @RequiredArgsConstructor · JdbcTemplate 인젝션
                                  jdbcTemplate.query(\"EXEC SP_UI_<DOMAIN>_<NO>_Q1 ?, ?\", new BeanPropertyRowMapper<>(Feature.class), p1, p2)
    · <Feature>Controller.java — @RestController
       GET  /<module>/<features>         (조회 — service.search() → SP _Q1)
       POST /<module>/<features>         (저장 — multipart 'changes' → service.saveAll() → SP _S1)
       POST /<module>/<features>/delete  (삭제 — JSON body → service.deleteAll() → SP _D1)
    · <Feature>Repository.java — (선택) JpaRepository — JPA 단순 CRUD 가 필요한 경우만
  · SP DDL: t3series-database/mssql/upgrade/vX.Y.Z-YYYYMMDD/procedures/SP_UI_<DOMAIN>_<NO>_Q1.sql 등 (필수)
  · ❌ Service 가 JpaRepository / Specification 만으로 CRUD = 정책 위반
  · ❌ 엔진 service XML (mp/dp/bf/fp server/config/*_service.xml) 신규 생성 금지
  참조 원본: UserController (admin/user), UserInfoController (util/userinfo)
  ⚠️ wingui 재시작 후 자동 반영 (외부 엔진 서버 기동 불필요)

★ SP DDL · 엔진 service XML 정책 (2026-04-27 전환):
  · ★ SP_UI_*.sql DDL 은 모든 신규 화면 **필수** (CRUD 액션마다 1개 · MSSQL 만)
  · ❌ 엔진 service XML (mp/dp/bf/fp server/config/*_service.xml) 신규 생성 금지 — wingui 단독 구동
  · 엔진 경유 (callService) 는 BF/DP/MP/FP 계산 기반 **기존 화면** 수정 시에만 사용

★ UI 위젯 매트릭스 (필드 의미에 맞춰 **반드시** 적용 · 자유 text 남발 금지):
  · 코드 PK          : text + center + 신규행만 editable (styleCallback)
  · 이름·자유 텍스트   : text (LEFT 기본)
  · 숫자             : number + textAlignment:'far' + numberFormat
  · Y/N boolean       : 그리드 dataType:'boolean'+center (CheckBox) + toBool/toYN 변환
                       검색: select(전체/Y/N) 또는 type='check'
  · 소량 enum         : select + lookupDisplay+values+labels + center
  · 단일 일자         : datetime + displayType:'date' + datetimeFormat:'yyyy-MM-dd'
                       + editor:{type:'date'} + center · 검색은 getDateInputProps() 헬퍼
  · 일시             : datetimeFormat:'yyyy-MM-dd HH:mm:ss' + center
  · 기간 FROM~TO    : InputField type='dateRange' displayType='date'
  · 부서/조직       : PopDepartment (검색 IconButton + 그리드 셀 더블클릭 팝업)
  · 직위            : PopPosition
  · 품목/거래처/거점 : PopSelectItem/PopItemMulti · PopSelectAccount/PopAccountMulti · PopLocatMst/PopLocatTpMulti
  · 자원/라우트      : PopResourceMulti · PopRouteMulti
  · 사용자/PlanScope : UserInputField · PlanScope
  ★ 공통코드 (TB_AD_COMN_CODE · USE_YN · USER_TP · STATUS 등) = **항상 CommonCodeSelect** (Dropdown 전용)
    · 50개 초과 대량 코드만 mode="popup" 명시적 전환 · 기본은 일관된 Dropdown UX
    · hardcoded options=[{value,label},...] 절대 금지 (CommonCodeSelect 가 캐시 + TB 기반 자동 로드)
  ★ Master 필드 (품목/거래처/거점/자원/부서/직위 등) = **기본 POPUP** · 자유 text 입력 금지
  ★ 신규 마스터 팝업: PopSelectItem 양식(SearchArea+WorkArea+ButtonArea+ResultArea) 그대로 복제
    · confirm 콜백은 **항상 배열** 반환 · 호출자는 firstOf() 로 단건 추출
    · setCheckBar({visible:true, exclusive:!multiple}) · onCellDblClicked=즉시 확정
  ★ 그리드 정렬: LEFT (텍스트 이름) · CENTER (코드/날짜/boolean/선택) · far (숫자)
  ★ 날짜 포맷 전역: yyyy-MM-dd (단일) · yyyy-MM-dd HH:mm:ss (일시)

★ 필드 주종관계 (Column-Name 기반 자동 Cascade):
  · 레지스트리: packages/wingui/src/common/fieldCascade.js (FIELD_CASCADE_REGISTRY)
  · 주종관계 엔트리: planScope→itemLvCd→itemCd · planScope→salesLvCd→accountCd
                   · mainVerCd→simulVerCd · locatTpCd→locatCd · resCd→processCd
  · popup-only 엔트리 (주종관계 없음 · 버튼만 자동 주입): deptCd · positionCd
  · ★ 주종관계 추가 전 반드시 도메인 확인. 독립 마스터(예: 직책)는 popup-only 로 등록
  · 검색 form: useFieldCascade({control,setValue,getValues}) + buildPopupFilterProps('<child>', getValues)
  · 그리드:    afterGridCreate 에서 applyGridCascade(gridObj, gridItems, { onCellPopupRequest })
               → 부모 변경 시 같은 row 자식 자동 clear + 셀 팝업에 부모값 자동 주입
               → popup 만 있는 엔트리(deptCd/positionCd 등)는 버튼만 주입 (clear 로직 없음)
  · 팝업 컴포넌트: 주종관계 엔트리면 props.<filterParam> 으로 필터 전달 · popup-only 면 전달 안 함
  · Controller: 주종관계 엔트리의 옵션 API 에만 @RequestParam filterParam 추가
  · 새 관계 추가 = fieldCascade.js 한 파일만 수정 → 전 화면에 즉시 전파

상세 (분리됨):
  · .claude/rules/41-composer-generation.md   — §0 참조원본 · §1~§3 · §10~§14
  · .claude/rules/41a-composer-jsx.md         — §4 JSX 표준 · §0.6 prop 명세
  · .claude/rules/41b-composer-java.md        — §5 Java 백엔드 · DDL/SP 정책
  · .claude/rules/41c-composer-widgets.md     — §6~§9 위젯/Cascade/POPUP/CommonCode
  · .claude/rules/41d-composer-wizard.md      — §15~§16 세션 전이 · 9-Step Wizard
Hook pre-tool-use-validator.sh 가 Write/Edit 시 위 규약 자동 검증.
</project_rule_reminder>"
fi

# =====================================================================
# 7. 배치 · 스케줄러 · 메시징
# =====================================================================
if echo "$PROMPT_LC" | grep -qE "batch|배치|quartz|스케줄|schedule|kafka|websocket|활성큐|activemq"; then
  INJECTED="${INJECTED}
<project_rule_reminder source=\"README.md §7.3\">
✅ 메시징/배치 스택:
- Spring Batch: **wingui 전용**
- Spring Kafka + WebSocket + STOMP: **wingui 전용**
- ActiveMQ 5.16.4: **fp 전용** (broker + client + kahadb-store)
- Quartz: common, fpserver, mpserver, dpserver, wingui (JDBC 스토어)
- 프런트: Socket.io-client, SockJS, react-stomp
상세: docs/reference/module-wingui.md, module-fp.md
</project_rule_reminder>"
fi

# =====================================================================
# 출력
# =====================================================================
if [ -n "$INJECTED" ]; then
  echo "$INJECTED"
fi

exit 0

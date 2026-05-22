#!/usr/bin/env bash
# =====================================================================
# KTNG — UserPromptSubmit Context Injector
# =====================================================================
# 사용자 프롬프트의 키워드를 감지해 관련 rule 핵심 요약을 stdout 으로
# 출력 → Claude Code 가 추가 context 로 인식.
# =====================================================================

set -uo pipefail

. "$(dirname "${BASH_SOURCE[0]}")/_jq-fallback.sh"

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

INPUT="$(cat)"
PROMPT="$(echo "$INPUT" | jq -r '.prompt // empty')"

[ -z "$PROMPT" ] && exit 0

PROMPT_LC="$(echo "$PROMPT" | tr '[:upper:]' '[:lower:]')"
INJECTED=""

# =====================================================================
# 1. 신규 KTNG 화면 / JSX 개발
# =====================================================================
if echo "$PROMPT_LC" | grep -qE "신규 화면|화면 개발|화면 만|화면 추가|새 화면|jsx|basegrid|ktng 화면|new screen"; then
  INJECTED="${INJECTED}
<project_rule_reminder source=\"rules/20-screen-development.md\">
✅ KTNG 신규 화면 체크리스트:

[파일 배치]
- JSX: packages/wingui/src/view/ktng/<도메인>/<카테고리>/<feature>/<File>.jsx
- 팝업: 같은 폴더에 Pop<File>.jsx
- Java: src/main/java/com/zionex/t3series/web/ktng/<도메인>/<카테고리>/<File>Controller.java
- 네이밍: <Prefix>Ktng<NN>.jsx · <Prefix>Ktng<NN>Controller.java (Bf/Cm/Dp/Im/Mp/Rpt + Ktng + 2자리 번호)

[MENU_CD]
- UI_<DOMAIN>_KTNG_<NN>  (예: UI_BF_KTNG_01)
- 도메인: BF/CM/DP/IM/MP/RPT
- AD 도메인은 KTNG 접미 없이 일반 (UI_AD_FILEUPLOAD)

[Controller 패턴]
- @RestController + @AllArgsConstructor
- 모든 엔드포인트에 @ExecPermission(menuCd, type)
- 모두 @PostMapping (GET 안 씀)
- URL: /<m>/<cat>/<feature>/q1|s1|d1|popq1|codeq1
- 저장: @RequestBody List<Map<String,Object>> changes  (★ multipart 아님)
- SP 호출: queryHandler.getList(\"SP_UI_BF_KTNG_01_Q1\", params)
- ★ JdbcTemplate 직접 사용 금지 (KTNG 는 QueryHandler 만)

[JSX 패턴]
- import: @wingui/common/imports 단일 경로
- 최상위 <ContentInner> 필수
- gridItems 는 컴포넌트 밖 선언, 모든 컬럼에 dataType 명시
- BaseGrid: items={...} afterGridCreate={...}  (★ columns/afterCreate 옛 API 금지)
- grid 객체: grid._dataProvider 또는 grid.dataProvider (KTNG 기존 코드는 _dataProvider)
- store: activeViewId ← useContentStore, setViewInfo ← useViewStore

상세: .claude-project/rules/20-screen-development.md
</project_rule_reminder>"
fi

# =====================================================================
# 2. Stored Procedure / SQL
# =====================================================================
if echo "$PROMPT_LC" | grep -qE "stored procedure|sp_|프로시저|procedure|sql 작성|sql 만|쿼리 작성|쿼리 만"; then
  INJECTED="${INJECTED}
<project_rule_reminder source=\"rules/30-database-schema.md, 31-stored-procedures.md\">
✅ KTNG SP/SQL 체크:

[네이밍]
- UI 화면 SP: SP_UI_<DOMAIN>_KTNG_<NN>_<ACTION>
  · ACTION ∈ Q1..Qn(조회) / S1..Sn(저장) / D1..Dn(삭제) / POP_Q1(팝업) / CHART_Q1(차트)
- 공통: SP_COMM_KTNG_COMBO_LIST (KTNG 전용 공통코드)
- 일반 SP: SP_<DOMAIN>_<FUNCTION> · SP_COMM_<FUNCTION>

[DB 방언]
- MSSQL only. NEWID() · GETDATE() · DECLARE @var · BEGIN TRY/CATCH
- ★ Oracle SYSDATE/SYS_GUID() 금지
- ★ PostgreSQL gen_random_uuid()/now()::timestamp 금지

[조회 SP]
- 결정론적 ORDER BY 필수 — SORT_ORDER → CODE → NAME → DATE → PK 순위

[저장/삭제 SP]
- 트랜잭션 또는 BEGIN TRY/CATCH 권장

[배치]
- t3series-database/procedures/<SP>.sql (단일 폴더)
- 또는 t3series-database/db_update_script.sql 에 인라인

상세: .claude-project/rules/31-stored-procedures.md
</project_rule_reminder>"
fi

# =====================================================================
# 3. TB_AD_MENU / 메뉴 등록
# =====================================================================
if echo "$PROMPT_LC" | grep -qE "tb_ad_menu|메뉴 등록|menu_cd|menu 등록"; then
  INJECTED="${INJECTED}
<project_rule_reminder source=\"rules/30-database-schema.md §5\">
✅ TB_AD_MENU 실제 컬럼만 사용:
- ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN, CREATE_BY, CREATE_DTTM
- ❌ MENU_NM (메뉴명은 TB_AD_LANG_PACK 에 별도 등록 — LANG_KEY=MENU_CD)
- ❌ PARENT_MENU_CD (UUID FK — (SELECT ID FROM TB_AD_MENU WHERE MENU_CD='...'))
- ❌ URL/DEPTH/SORT_ORDER (전부 미존재)

TB_AD_LANG_PACK audit:
- CREATE_BY/CREATE_DTTM/MODIFY_BY/MODIFY_DTTM (★ UPDATE_BY/UPDATE_DTTM 존재 안 함)

MSSQL only: NEWID(), GETDATE()
</project_rule_reminder>"
fi

# =====================================================================
# 4. 기술 스택
# =====================================================================
if echo "$PROMPT_LC" | grep -qE "spring boot|pom.xml|maven|의존성|dependency|jakarta|javax"; then
  INJECTED="${INJECTED}
<project_rule_reminder source=\"rules/10-overview.md\">
KTNG 기술 스택:
- Spring Boot 3.x → jakarta.persistence/servlet/validation.* (★ javax.* 차단)
- t3series-parent 25.1.0 / Java 17 / Maven
- 모듈: wingui(WAR) · dpserver · mpserver · insight · mp(Swing)
- DB: MSSQL (T-SQL)
- 프론트: React 18 · Zustand · RealGrid · react-hook-form · @mui · Kendo · Chart.js · d3
- Composer/T3Composer 없음 (수동 개발)
</project_rule_reminder>"
fi

# =====================================================================
# 5. 권한 / 인증
# =====================================================================
if echo "$PROMPT_LC" | grep -qE "권한|permission|@execpermission|authorization|보안|security|jwt"; then
  INJECTED="${INJECTED}
<project_rule_reminder source=\"rules/32-security.md\">
KTNG 권한 패턴:
- @ExecPermission(menuCd = \"UI_<DOMAIN>_KTNG_<NN>\", type = ServiceConstants.PERMISSION_TYPE_READ|UPDATE|DELETE)
- 모든 Controller 엔드포인트에 명시 필수
- 형제 메뉴의 권한 복사: TB_AD_PERMISSION_GROUP (MENU_ID/GRP_ID/PERMISSION_TP/USABILITY)
</project_rule_reminder>"
fi

# 출력
if [ -n "$INJECTED" ]; then
  echo "$INJECTED"
fi

exit 0

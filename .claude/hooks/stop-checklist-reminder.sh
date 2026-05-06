#!/usr/bin/env bash
# =====================================================================
# T3Series — Stop Hook (Checklist Reminder)
# =====================================================================
# Claude 응답 마감 시점 실행. 세션 변경 파일을 분석해 미완료 체크리스트 리마인드.
# 정책: stdout = Claude 컨텍스트 · exit 0 정상 · exit 2 = 종료 중단(미사용)
#
# ─── 리마인더 카테고리 ────────────────────────────────────────────────
# §1. 신규 JSX 화면 (TB_AD_MENU 등록 · 권한 · 다국어 · 온톨로지)
# §2. 신규 SP (MSSQL/Oracle 양쪽 · 네이밍 · 트랜잭션)
# §3. 온톨로지 변경 (status / weight / db_type)
# §4. pom.xml 변경 (BOM · 호환성)
# §5. DDL 변경 (upgrade/vX.Y.Z 폴더)
# §6. FilterBar JSON
# §7. Composer 산출물 (wingui 네이티브 4종 세트 완비 확인)
# =====================================================================

set -uo pipefail

. "$(dirname "${BASH_SOURCE[0]}")/_jq-fallback.sh"

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

INPUT="$(cat)"
STOP_HOOK_ACTIVE="$(echo "$INPUT" | jq -r '.stop_hook_active // false')"

# 이미 stop hook 이 한 번 실행되어 재호출된 상태면 그냥 종료 (무한루프 방지)
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  exit 0
fi

# T3_PROJECT_ROOT 이 '${PWD}' 같은 미전개 리터럴이어도 안전 처리
if [ -z "${T3_PROJECT_ROOT:-}" ] || [[ "${T3_PROJECT_ROOT}" == *'$'* ]]; then
  PROJECT_ROOT="$(pwd)"
else
  PROJECT_ROOT="$T3_PROJECT_ROOT"
fi

[ ! -d "$PROJECT_ROOT/.git" ] && exit 0

cd "$PROJECT_ROOT"

# 이번 세션에서 변경된 파일 (staged + unstaged)
CHANGED_FILES="$(git status --porcelain 2>/dev/null | awk '{print $2}' || true)"
[ -z "$CHANGED_FILES" ] && exit 0

REMINDERS=""

# =====================================================================
# 1. 신규 JSX 화면 생성 감지
# =====================================================================
NEW_JSX=$(echo "$CHANGED_FILES" | grep -E "view/[a-z][a-z0-9_-]*/([a-z][a-z0-9_-]*/)?[a-z][a-z0-9_-]*/[A-Z][A-Za-z0-9]*\.jsx$" | head -5 || true)

if [ -n "$NEW_JSX" ]; then
  REMINDERS="${REMINDERS}
📋 신규/수정된 화면이 감지되었습니다:
$(echo "$NEW_JSX" | sed 's/^/  - /')

⚠️  배포 전 반드시 확인:
  □ TB_AD_MENU 에 메뉴 등록했는가? (INSERT 문 실행)
  □ TB_AD_PERMISSION / TB_AD_PERMISSION_GROUP 권한 부여했는가?
  □ 자연어 질의 대상 화면이면 tb_is_vwbusnss_ontlgy 등록했는가?
  □ SP_UI_<DOMAIN>_<NO>_Q1/S1 프로시저 실제 작성했는가? (MSSQL + Oracle)
  □ 다국어 메시지는 t(...) 함수로 처리했는가? (ko/en/ja/zh)
  □ 개인화 지원 시 PopPersonalize 연결했는가?
  □ SP_CM_LOG 로 사용자 액션 로깅되는가?

상세 체크리스트: .claude/rules/20-screen-development.md §8
"
fi

# =====================================================================
# 2. 신규 SP 파일 생성 감지
# =====================================================================
NEW_SP=$(echo "$CHANGED_FILES" | grep -E "procedures/.*\.sql$" | head -10 || true)

if [ -n "$NEW_SP" ]; then
  REMINDERS="${REMINDERS}
📋 SP/Function 파일이 변경되었습니다:
$(echo "$NEW_SP" | sed 's/^/  - /')

⚠️  확인 필요:
"
  # MSSQL 만 있고 Oracle 이 없는 경우
  MISSING_ORACLE=""
  MISSING_MSSQL=""
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    if [[ "$f" == *mssql/procedures/* ]]; then
      ORA="${f/\/mssql\//\/oracle\/}"
      [ ! -f "$ORA" ] && MISSING_ORACLE="$MISSING_ORACLE\n  - $ORA"
    elif [[ "$f" == *oracle/procedures/* ]]; then
      MSS="${f/\/oracle\//\/mssql\/}"
      [ ! -f "$MSS" ] && MISSING_MSSQL="$MISSING_MSSQL\n  - $MSS"
    fi
  done <<< "$NEW_SP"

  if [ -n "$MISSING_ORACLE" ]; then
    REMINDERS="${REMINDERS}  □ Oracle 대응 파일 누락:${MISSING_ORACLE}
"
  fi
  if [ -n "$MISSING_MSSQL" ]; then
    REMINDERS="${REMINDERS}  □ MSSQL 대응 파일 누락:${MISSING_MSSQL}
"
  fi

  # SP_UI_* 신규 생성 감지 — wingui 네이티브 권장 리마인드
  NEW_UT_AD_SP=""
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    SP_BASE="$(basename "$f" .sql)"
    if [[ "$SP_BASE" =~ ^SP_UI_(UT|AD|COMM|SAMPLE|TEST)_ ]]; then
      NEW_UT_AD_SP="${NEW_UT_AD_SP}\n    - ${f}"
    fi
  done <<< "$NEW_SP"

  # 2026-04-27 정책 전환 — SP 는 이제 모든 신규 화면 필수. UT/AD 도메인 SP 도 환영.
  # (구식 검사: NEW_UT_AD_SP 경고는 무시)

  # Composer 세션 산출물이면 SP_UI_*.sql + Entity + Service + Controller 완비 여부 체크
  NEW_JSX_PATH=$(echo "$NEW_JSX" | head -1 | tr -d ' ')
  if [ -n "$NEW_JSX_PATH" ] && grep -q "@wingui/common/imports" "$NEW_JSX_PATH" 2>/dev/null; then
    # JSX 의 feature 이름 추출 (PascalCase)
    JSX_BASENAME="$(basename "$NEW_JSX_PATH" .jsx)"
    MODULE_DIR=$(echo "$NEW_JSX_PATH" | sed -E 's#.*/view/([^/]+)/.*#\1#')

    # 필수 Java 산출물 — Repository 는 선택이므로 제외
    MISSING_JAVA=""
    for kind in "" "Service" "Controller"; do
      CANDIDATE=$(find t3series-wingui/src/main/java -type f \
        -path "*web/domain/${MODULE_DIR}/*" \
        -name "${JSX_BASENAME}${kind}.java" 2>/dev/null | head -1)
      if [ -z "$CANDIDATE" ]; then
        MISSING_JAVA="${MISSING_JAVA}\n    - ${JSX_BASENAME}${kind}.java"
      fi
    done

    if [ -n "$MISSING_JAVA" ]; then
      REMINDERS="${REMINDERS}  □ ⚠️ Composer 신규 화면 Java 산출물 미완비:${MISSING_JAVA}
    → web/domain/${MODULE_DIR}/<feature>/ 아래에 Entity/Service/Controller 생성 (Repository 는 선택)
    → Service 는 JdbcTemplate.query(\"EXEC SP_UI_<...> ?, ?\", ...) 패턴으로 SP 호출
"
    fi

    # SP_UI_*.sql DDL 누락 체크 — 신규 화면은 SP 필수 (2026-04-27 정책)
    if [ -z "$NEW_SP" ]; then
      REMINDERS="${REMINDERS}  □ ⚠️ 신규 화면(${JSX_BASENAME})에 SP_UI_*.sql DDL 누락 (2026-04-27 SP 정책)
    → 모든 신규 화면은 SP 기반 CRUD 필수 — CRUD 액션마다 1개 SP (read-only 면 _Q1 만)
    → 경로: t3series-database/mssql/upgrade/vX.Y.Z-YYYYMMDD/procedures/SP_UI_<DOMAIN>_<NO>_Q1/S1/D1.sql
    → MSSQL 만 작성 (memory: MSSQL only · Oracle 폴더 생성 금지)
    → 조회 SP 결정론적 ORDER BY 필수 (rules/31 §9)
"
    fi
  fi

  REMINDERS="${REMINDERS}  □ 네이밍 SP_UI_<DOMAIN>_<NO>_<ACTION> 규약 준수?
  □ SP_COMM_RAISE_ERR 로 에러 처리?
  □ 트랜잭션 커밋/롤백 처리? (배치 SP)
  □ PLAN_SCOPE 필터 포함? (멀티테넌트 분리)
  □ 업그레이드 스크립트는 upgrade/vX.Y.Z-YYYYMMDD/ 경유?

상세: .claude/rules/31-stored-procedures.md
"
fi

# =====================================================================
# 3. 온톨로지 테이블 변경 감지
# =====================================================================
ONTLGY_CHANGE=$(echo "$CHANGED_FILES" | grep -iE "tb_is_(vwbusnss|prcss|ontlgy|qapattern)" | head -5 || true)

if [ -n "$ONTLGY_CHANGE" ]; then
  REMINDERS="${REMINDERS}
📋 온톨로지 관련 변경 감지:
$(echo "$ONTLGY_CHANGE" | sed 's/^/  - /')

⚠️  확인 필요:
  □ status='DRAFT' 로 두지 않았는가? (프로덕션 답변 사용 금지)
  □ published_version 설정했는가?
  □ 이력 테이블 (_hist) 에 change_type 기록했는가?
  □ Entity 라면 status='CONFIRMED' 설정?
  □ Entity Relation 이라면 weight 값 부여 (>=0.5 권장)?
  □ db_type 필드 적절히 설정 (mssql/oracle/postgresql)?

상세: .claude/rules/10-ontology-first.md §3,5
"
fi

# =====================================================================
# 4. pom.xml 변경 감지
# =====================================================================
POM_CHANGE=$(echo "$CHANGED_FILES" | grep -E "pom\.xml$" | head -5 || true)

if [ -n "$POM_CHANGE" ]; then
  REMINDERS="${REMINDERS}
📋 pom.xml 변경 감지:
$(echo "$POM_CHANGE" | sed 's/^/  - /')

⚠️  확인 필요:
  □ 버전은 루트 <dependencyManagement> 에서 관리 (모듈 직접 명시 금지)
  □ 새 라이브러리면 다른 모듈과의 호환성 매트릭스 확인 (README.md §7)
  □ Java 17, Spring Boot 3.0.13 고정 유지?
  □ wingui 전용 (Kafka, Security, JWT, Batch, POI 4.1.2) 을 다른 모듈에 추가하지 않았는가?
"
fi

# =====================================================================
# 5. 업그레이드 폴더 배치 확인
# =====================================================================
DDL_CHANGE=$(echo "$CHANGED_FILES" | grep -E "\.(sql)$" | grep -v "/upgrade/" | grep -v "/procedures/" | head -5 || true)

if [ -n "$DDL_CHANGE" ]; then
  REMINDERS="${REMINDERS}
⚠️  업그레이드 폴더 미경유 SQL 감지:
$(echo "$DDL_CHANGE" | sed 's/^/  - /')
  → DDL 변경이라면 t3series-database/{mssql,oracle}/upgrade/vX.Y.Z-YYYYMMDD/ 경로로 이동 권장
  → 순서 관리가 필요하므로 날짜 스탬프 필수
"
fi

# =====================================================================
# 6. FilterBar JSON 변경 감지
# =====================================================================
FB_CHANGE=$(echo "$CHANGED_FILES" | grep -iE "[^/]*filter[^/]*\.json$" | head -5 || true)

if [ -n "$FB_CHANGE" ]; then
  REMINDERS="${REMINDERS}
📋 FilterBar JSON 변경 감지:
$(echo "$FB_CHANGE" | sed 's/^/  - /')

⚠️  확인 필요:
  □ block_type = \"FILTER_BAR\" 로 설정했는가?
  □ block_id 는 snake_case (^[a-z][a-z0-9_]*$)?
  □ 모든 field_id 가 UPPER_SNAKE_CASE?
  □ 모든 output_variable.name 이 camelCase?
  □ SCM 도메인은 DOMAIN_* 타입 사용 (DOMAIN_PLAN_SCOPE, DOMAIN_ITEM_MULTI 등)?
  □ DATE_RANGE · DOMAIN_PLAN_SCOPE 에 flatten 명시?
  □ data_type: array 필드에 delimiter_for_sp: \",\" 명시?
  □ include_all.enabled: true → transform_when_all: \"send_null\" 설정?
  □ label_i18n_key 를 TB_AD_LANG_PACK 에 (ko/en/ja/zh) 등록?
  □ 참조 블록은 @form.<form_id>.<camelName> 로 바인딩?
  □ .claude/schemas/filter-bar.schema.json 으로 검증 통과? (Hook 자동 수행)

상세 체크리스트: .claude/rules/22-filter-bar.md §9
"
fi

# =====================================================================
# 7. Composer 화면 생성 (JSX + MENU_SQL + SP) 동반 체크
# =====================================================================
# 신규 JSX 가 있고 MENU_FILE_PATH 가 포함된 SQL 이 함께 있으면 Composer 산출물로 간주
COMPOSER_SQL=$(echo "$CHANGED_FILES" | grep -E "\.sql$" | xargs -I{} grep -l "MENU_FILE_PATH" {} 2>/dev/null || true)

if [ -n "$NEW_JSX" ] || [ -n "$COMPOSER_SQL" ]; then
  # JSX 에 @wingui/common/imports 를 사용하는 최신 규약 파일만 대상
  MODERN_JSX=""
  if [ -n "$NEW_JSX" ]; then
    while IFS= read -r f; do
      [ -z "$f" ] && continue
      if [ -f "$f" ] && grep -q "@wingui/common/imports" "$f" 2>/dev/null; then
        MODERN_JSX="$MODERN_JSX  - $f
"
      fi
    done <<< "$NEW_JSX"
  fi

  if [ -n "$MODERN_JSX" ] || [ -n "$COMPOSER_SQL" ]; then
    REMINDERS="${REMINDERS}
📋 Composer 화면 산출물 감지 — 런타임 동작 체크:
${MODERN_JSX}${COMPOSER_SQL:+$(echo "$COMPOSER_SQL" | sed 's/^/  - /')
}

🔄 진입 모드 (2026-04 통합 9단계 Wizard):
  · NEW_STEP        — 빈 spec (사용자 입력)
  · NEW_FROM_COPY   — 원본 메뉴 sourceBundle prefill (createInitialSpecFromSource)
  · NEW_FROM_DESIGN — 설계서 parsedDesign prefill (createInitialSpecFromDesign)
  세 모드 모두 StepByStepWizard 동일 흐름. Step9 가 통합 createSession + LLM 호출.

⚠️  DB 반영 직후 반드시 확인 (.claude/rules/41-composer-generation.md):

  [MENU_FILE_PATH 형식]
  □ '/<module>[/<category>]/<PascalComponentName>' 형식
  □ 마지막 세그먼트는 PascalCase (JSX 파일명)
  □ 마지막 직전 세그먼트 ≠ lowercase(마지막) — 자동 추가 폴더 이중화 금지
     ✅ '/util/UserInfoMgmt'  ✅ '/snop/dashboard/ExecutiveDashboard'
     ❌ '/util/userinfomgmt/UserInfoMgmt'  (마지막 직전 == lowercase('UserInfoMgmt'))
  □ '.jsx' 확장자 없음
  □ 실제 JSX 파일 packages/wingui/src/view{filePath.toLowerCase()}/{PascalCase}.jsx 존재

  [MENU_PATH]
  □ 모두 lowercase, '/' 로 시작
  □ 권장: MENU_FILE_PATH.toLowerCase() 와 정확히 동일
  SELECT MENU_CD, MENU_PATH, MENU_FILE_PATH FROM TB_AD_MENU WHERE MENU_CD='<NEW_MENU_CD>';
  -- 검증: SELECT 1 WHERE LOWER(<MENU_FILE_PATH>) = <MENU_PATH>;

  [PARENT_ID]
  □ parent lookup 이 실제 MENU_CD 사용 (util→MENU_UTIL · MENU_UT 아님)
  □ UUID 서브쿼리 (SELECT ID FROM TB_AD_MENU WHERE MENU_CD='MENU_UTIL') 형태

  [권한]
  □ TB_AD_PERMISSION_GROUP 에 형제 메뉴 권한 복사 완료
  □ 시스템 관리자 외에는 권한 없으면 사이드바에 표시 안 됨

  [다국어]
  □ TB_AD_LANG_PACK 에 ko/en/ja/zh 4개 언어 INSERT

  [JSX 런타임 API]
  □ @wingui/common/imports 단일 경로 import
  □ <BaseGrid items={...} afterGridCreate={...} id=\"<str>\" />
  □ 그리드 버튼 grid=\"<string-id>\"
  □ callService('SP_UI_...', paramMap) 2-인자
  □ showMessage('제목', '메시지', cb?) 제목은 문자열
  □ grid.dataProvider.fillJsonData / getAllStateRows / getJsonRow

  [DB 진단 쿼리]
  SELECT m.MENU_CD, m.MENU_PATH, m.MENU_FILE_PATH, m.USE_YN,
         (SELECT MENU_CD FROM TB_AD_MENU WHERE ID=m.PARENT_ID) AS PARENT_MENU_CD
    FROM TB_AD_MENU m WHERE m.MENU_CD='<NEW_MENU_CD>';
"
  fi
fi

# =====================================================================
# 출력 (리마인드가 있을 때만)
# =====================================================================
if [ -n "$REMINDERS" ]; then
  cat <<EOF
<session_wrap_up_reminders>
$REMINDERS

💡 이 리마인드는 세션 종료 시점에 자동 생성됩니다. 미완료 항목이 있다면
   위 체크리스트를 참고해 작업을 마무리하세요. 전체 규칙: CLAUDE.md + .claude/rules/
</session_wrap_up_reminders>
EOF
fi

exit 0

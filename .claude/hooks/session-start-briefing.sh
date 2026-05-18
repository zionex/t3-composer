#!/usr/bin/env bash
# =====================================================================
# T3Series — SessionStart Briefing
# =====================================================================
# 새 Claude Code 세션이 시작될 때 실행.
# 현재 프로젝트 상태(Git 브랜치, 최근 변경, DB 타입, 활성 모듈 등)를
# Claude 에게 브리핑한다.
# =====================================================================

set -uo pipefail

# T3_PROJECT_ROOT 이 '${PWD}' 같은 미전개 리터럴이어도 안전 처리
if [ -z "${T3_PROJECT_ROOT:-}" ] || [[ "${T3_PROJECT_ROOT}" == *'$'* ]]; then
  PROJECT_ROOT="$(pwd)"
else
  PROJECT_ROOT="$T3_PROJECT_ROOT"
fi
CURRENT_DB="${T3_CURRENT_DB:-mssql}"

# 너무 수다스럽지 않게, 핵심만.
cat <<EOF
<session_briefing>
🧭 T3Series 프로젝트 브리핑
EOF

# Git 상태
if command -v git >/dev/null 2>&1 && [ -d "$PROJECT_ROOT/.git" ]; then
  cd "$PROJECT_ROOT"
  BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
  LAST_COMMIT="$(git log -1 --pretty=format:'%h %s (%cr)' 2>/dev/null || echo 'unknown')"
  CHANGED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')

  echo "  • 브랜치: $BRANCH"
  echo "  • 최근 커밋: $LAST_COMMIT"
  echo "  • 변경 파일 수: $CHANGED"

  # 최근 5건 커밋 메시지 (Conventional Commits 위반 체크용)
  echo "  • 최근 5 커밋:"
  git log -5 --pretty=format:'    - %h %s' 2>/dev/null | head -5
  echo ""
fi

# 환경 변수
echo "  • 현재 DB 타입: $CURRENT_DB (T3_CURRENT_DB 환경변수)"
echo "  • 스키마: ${T3_DB_SCHEMA:-T3SMARTSCM.dbo}"

# 활성 모듈 감지 (pom.xml 이 있는지로 판단)
echo "  • 활성 Maven 모듈:"
if [ -f "$PROJECT_ROOT/pom.xml" ]; then
  # 루트 pom.xml 의 <modules> 추출
  grep -oE "<module>[^<]+</module>" "$PROJECT_ROOT/pom.xml" 2>/dev/null | \
    sed -E 's|<module>(.+)</module>|    - \1|' | head -10
fi

# 최근 변경된 주요 파일 (지난 7일)
echo ""
echo "  • 지난 7일간 주요 변경:"
if command -v git >/dev/null 2>&1 && [ -d "$PROJECT_ROOT/.git" ]; then
  cd "$PROJECT_ROOT"
  git log --since="7 days ago" --pretty=format:"    - %cd %h %s" --date=short 2>/dev/null | head -10
  echo ""
fi

# 중요 경고
cat <<EOF

⚠️  중요 원칙 (매 작업 적용):
  1. 자연어 질의·Insight·채팅 기능 → 온톨로지 5-Step 필수 (.claude/rules/10-ontology-first.md)
  2. SP 작성 → SP_UI_<DOMAIN>_<NO>_<ACTION> 네이밍 + MSSQL/Oracle 양쪽
  3. 화면 개발 → ContentInner + setViewInfo + gridItems(밖) + afterGridCreate
     · BaseGrid: items={...} / afterGridCreate={...} (❌ columns/afterCreate 아님)
     · grid.dataProvider.fillJsonData / getAllStateRows / getJsonRow
     · 신규 화면 = zAxios REST + RestController + JdbcTemplate SP 호출 (callService 금지 — 2026-04-27 정책)
     · showMessage('확인', msg, (ok)=>{...})  (★ 첫 인자는 제목 문자열)
  4. FilterBar(조회 조건) → .claude/schemas/filter-bar.schema.json 단일 권위 + DOMAIN_* 타입 필수 (.claude/rules/22-filter-bar.md)
  5. DB 변경 → upgrade/vX.Y.Z-YYYYMMDD/ 경유
  6. 의존성 추가 → 루트 pom.xml BOM 경유 (모듈에 version 직접 명시 금지)
  7. Composer 화면 생성/수정 → .claude/rules/41-composer-generation.md (메인) + sub 4개:
       · 41a-composer-jsx.md      — JSX 표준 (BaseGrid · grid id · zAxios · §0.6 prop 명세)
       · 41b-composer-java.md     — Java 백엔드 + DDL/SP 정책 + jakarta.* import
       · 41c-composer-widgets.md  — 위젯 카탈로그 + Cascade + POPUP + CommonCodeSelect
       · 41d-composer-wizard.md   — 세션 자동 전이 + 9-Step Wizard
       · 99a-composer-anti-patterns.md — 안티패턴 카탈로그 (CG-A~F)
     ★ 원칙: 기존 **t3series-wingui 모듈의 규약**과 완전히 동일하게 작성.
             Composer 만의 새 규약·새 서버·새 prefix 절대 생성 금지.

     · wingui 단독 구동으로 모든 화면이 동작해야 함 (외부 mpserver/dpserver 기동 불필요)

     · MENU_CD = 'UI_<DOMAIN>_<NAME>'  (UT_/MENU_/소문자 금지)
     · MENU_FILE_PATH = '/<module>[/<category>]/<PascalComponentName>'
     · MENU_PATH = LOWER(MENU_FILE_PATH)
     · parent: MENU_UTIL · MENU_DP · MENU_MP · MENU_FP · MENU_BF · MENU_IM · MENU_RP · MENU_SA · MENU_AD
     · DB TB_AD_MENU INSERT + TB_AD_PERMISSION_GROUP 형제 메뉴 복사

     · 백엔드 — SP_UI_*.sql + Entity + Service(JdbcTemplate SP 호출) + Controller (2026-04-27 정책 전환):
       [단독 환경] backend/src/main/java/com/zionex/t3composer/domain/<module>/<feature_dir>/
       [wingui sync] t3series-wingui/src/main/java/.../web/domain/<module>/<feature_dir>/
         Entity(@Entity extends BaseEntity) + Service(@Service · JdbcTemplate 인젝션) + Controller(@RestController)
         Repository(JpaRepository) 는 선택 — JPA 단순 CRUD 가 필요한 경우만
       ★ Java 클래스명 = MENU_FILE_PATH 마지막 PascalCase segment 그대로 (축약 절대 금지 — rules/41b §5.6.0):
         MENU_FILE_PATH '/util/UserInfoMgmt' → <Feature>='UserInfoMgmt', <feature_dir>='userinfomgmt'
         파일: UserInfoMgmt.java · UserInfoMgmtController.java · UserInfoMgmtService.java · UserInfoMgmtRepository.java
         ❌ 'UserInfo*.java' (축약) — Spring Bean 충돌 · wingui sync 시 덮어쓰기 (99a §L CG-L1)
       Service: @Qualifier(\"targetJdbcTemplate\") private final JdbcTemplate jdbcTemplate;
                jdbcTemplate.query(\"EXEC SP_UI_<DOMAIN>_<NO>_Q1 ?, ?\", new BeanPropertyRowMapper<>(Entity.class), ...)
       REST 엔드포인트: GET /<module>/<features> · POST / · POST /delete
       SP DDL: t3series-database/mssql/upgrade/vX.Y.Z-YYYYMMDD/procedures/SP_UI_<...>_Q1/S1/D1.sql (필수 · MSSQL 만)
     · 프런트 — zAxios REST: zAxios.get('<module>/<features>') · GridSaveButton url=\"...\" · onDelete 콜백
       [단독 환경] frontend/src/view/<module>/<lowercase>/<PascalName>.jsx
       [wingui sync] packages/wingui/src/view/<module>/<lowercase>/<PascalName>.jsx

     · ★ SP_UI_*.sql DDL 모든 신규 화면 필수 (CRUD 액션마다 1개) — 조회 SP 결정론적 ORDER BY 필수
     · ❌ 엔진 service XML (mp/dp/bf/fp server/config/*_service.xml) 신규 생성 금지 — wingui 단독 구동
     · ❌ 신규 화면에서 callService(...) 엔진 경유 호출 금지 — BF/DP/MP/FP 계산 화면 수정 전용

     ★ 9단계 Wizard 통합 (2026-04): 신규 화면 3종 동일 흐름. 차이는 prefill 출처뿐.
       NEW_STEP        → 빈 spec (사용자 입력)
       NEW_FROM_COPY   → createInitialSpecFromSource(원본 메뉴 sourceBundle)
       NEW_FROM_DESIGN → createInitialSpecFromDesign(parsedDesign)
       모두 StepByStepWizard 9단계 → Step9 Generate 통합 호출
       백엔드: ComposerPromptBuilder.newStepGuide(StepGuideMode.{PLAIN,COPY,DESIGN})

📚 규칙 위치:
  - CLAUDE.md (헌법, 자동 주입)
  - .claude/rules/ (맥락별 상세 규칙)
  - .claude/schemas/ (FilterBar 등 JSON 스키마 + examples/ 샘플)
  - docs/reference/ (대용량 카탈로그 — grep 으로 조회)

🔒 Hooks 활성:
  - PreToolUse  → 네이밍·구조 검증 (위반 시 차단)
  - PostToolUse → ESLint/Checkstyle/Prettier 자동 실행
  - UserPromptSubmit → 키워드 감지해 관련 규칙 주입
  - Stop → 신규 화면 체크리스트 리마인드
</session_briefing>
EOF

exit 0

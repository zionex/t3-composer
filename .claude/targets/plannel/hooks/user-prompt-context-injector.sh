#!/usr/bin/env bash
# =====================================================================
# PlanNEL — UserPromptSubmit Context Injector
# =====================================================================
# 사용자 prompt 에 PlanNEL 키워드가 포함되면 관련 rule 파일을 stdout 으로
# 출력 → Claude 에 컨텍스트 주입.
#
# 키워드 → 주입 매핑:
#   "마스터 화면" / "신규 화면" / "AG-Grid"  → 20-screen-development.md + 21-components.md
#   "controller" / "service" / "entity"      → 30-data-access.md + 40-database-schema.md
#   "tenant" / "멀티테넌트"                  → 31-multi-tenancy.md
#   "권한" / "PreAuthorize" / "JWT"          → 32-security.md
#   "AI" / "챗봇" / "시나리오"               → 50-ai-modules.md
#   wingui / SP_UI_ / TB_AD_ 등 환각 키워드   → 99-anti-patterns.md
#
# stdin: prompt JSON
# =====================================================================

set -euo pipefail

. "$(dirname "${BASH_SOURCE[0]}")/_jq-fallback.sh"

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

INPUT="$(cat)"
PROMPT="$(echo "$INPUT" | jq -r '.prompt // empty')"

[ -z "$PROMPT" ] && exit 0

# PROJECT_ROOT 해석
if [ -z "${PLANNEL_PROJECT_ROOT:-}" ] || [[ "${PLANNEL_PROJECT_ROOT}" == *'$'* ]]; then
  PROJECT_ROOT="$(pwd)"
else
  PROJECT_ROOT="$PLANNEL_PROJECT_ROOT"
fi

# .claude-plannel 위치 추정
RULES_DIR=""
for c in "$PROJECT_ROOT/.claude-plannel/rules" \
         "$PROJECT_ROOT/../.claude-plannel/rules" \
         "/Users/hej/work/projects/t3-composer/.claude-plannel/rules"; do
  if [ -d "$c" ]; then
    RULES_DIR="$c"
    break
  fi
done

[ -z "$RULES_DIR" ] && exit 0

# 소문자 prompt
P="$(echo "$PROMPT" | tr '[:upper:]' '[:lower:]')"

# PlanNEL 컨텍스트 키워드 (적어도 하나 매칭해야 작동)
if ! echo "$P" | grep -qE 'plannel|saas-web|saas-application|saas-mp|saas-rp|aggrid|ag-grid|reduxutil|tabmenulist|@plannel|customermaster|itemmaster|targetinventory'; then
  exit 0
fi

INJECTED=()
inject() {
  local file="$1"
  local label="$2"
  if [ -f "$RULES_DIR/$file" ]; then
    INJECTED+=("$label")
    echo ""
    echo "═══ [PlanNEL Rule] $file — $label ═══"
    cat "$RULES_DIR/$file"
    echo ""
  fi
}

# ─── 키워드 매칭 ──────────────────────────────────────────────────
NEED_OVERVIEW=0

# 신규 화면 / 컴포넌트
if echo "$P" | grep -qE '신규.{0,4}화면|신규.{0,4}페이지|새.{0,4}화면|마스터.{0,4}화면|화면.{0,4}만들|페이지.{0,4}추가|aggrid|ag-grid|columndefs|filtercontainer'; then
  inject "20-screen-development.md" "신규 화면 추가 절차"
  inject "21-components.md" "공용 컴포넌트 인벤토리"
  NEED_OVERVIEW=1
fi

# Backend (controller / service / entity)
if echo "$P" | grep -qE 'controller|service|entity|repository|querydsl|jpa|@preauthorize|@requestmapping|@table'; then
  inject "30-data-access.md" "REST + JPA + QueryDSL + MyBatis"
  inject "40-database-schema.md" "PostgreSQL z_* prefix"
  NEED_OVERVIEW=1
fi

# 멀티테넌트
if echo "$P" | grep -qE 'tenant|멀티테넌트|tenantcontext|x-tenant|schema.{0,4}라우팅'; then
  inject "31-multi-tenancy.md" "Multi-tenancy 아키텍처"
fi

# 권한 / 보안
if echo "$P" | grep -qE 'jwt|@preauthorize|권한|hasrole|hasanyrole|보안|jwttoken|websecurityconfig'; then
  inject "32-security.md" "JWT + Role 매트릭스"
fi

# AI 모듈
if echo "$P" | grep -qE 'ai.{0,4}챗|ai.{0,4}추천|시나리오.{0,4}추천|bedrock|claude|saas-ai|forecast|예측'; then
  inject "50-ai-modules.md" "saas-ai + saas-ai-agent"
fi

# 안티패턴 키워드
if echo "$P" | grep -qE 'wingui|sp_ui|tb_ad|@wingui|jakarta\.persistence|com\.zionex|basegrid|useviewstore|usefieldcascade|sp_comm'; then
  inject "99-anti-patterns.md" "환각 차단 매트릭스"
fi

# 기본 overview 가 필요하면 (다른 파일이 주입됐으면 포함)
if [ "$NEED_OVERVIEW" -eq 1 ]; then
  inject "10-overview.md" "기술 스택 + 모노레포 (참조)"
fi

# 주입한 게 있으면 헤더 출력
if [ "${#INJECTED[@]}" -gt 0 ]; then
  echo ""
  echo "ℹ️  [PlanNEL] 자동 컨텍스트 주입: ${INJECTED[*]}"
fi

exit 0

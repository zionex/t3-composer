#!/usr/bin/env bash
# =====================================================================
# PlanNEL — SessionStart Briefing
# =====================================================================
# 세션 시작 시 PlanNEL 작업 컨텍스트를 stdout 으로 출력 → Claude 에 주입.
# (현재 git branch / 최근 변경 파일 / 핵심 컨벤션 한 줄 요약)
#
# stdout 의 모든 텍스트가 사용자 prompt 의 system context 로 전달됨.
# =====================================================================

set -euo pipefail

# 작업 디렉토리 — PLANNEL_PROJECT_ROOT 또는 cwd
if [ -z "${PLANNEL_PROJECT_ROOT:-}" ] || [[ "${PLANNEL_PROJECT_ROOT}" == *'$'* ]]; then
  PROJECT_ROOT="$(pwd)"
else
  PROJECT_ROOT="$PLANNEL_PROJECT_ROOT"
fi

# saas-plannel 폴더가 보이는지 확인
SAAS_ROOT=""
for c in "$PROJECT_ROOT" "$PROJECT_ROOT/.." "/Users/hej/work/projects/saas-plannel"; do
  if [ -d "$c/saas-application" ] && [ -d "$c/saas-web" ]; then
    SAAS_ROOT="$(cd "$c" && pwd)"
    break
  fi
done

if [ -z "$SAAS_ROOT" ]; then
  # PlanNEL 작업 컨텍스트가 아니면 silent
  exit 0
fi

cat <<'BRIEF'
═══════════════════════════════════════════════════════════════════
🟦 PlanNEL Architecture Pack — 자동 컨텍스트 (.claude-plannel)
═══════════════════════════════════════════════════════════════════

핵심 차이 (vs T3Series wingui):
  • Frontend  : React 18 + AG-Grid 30 + Redux Toolkit + MUI 5 (★ wingui 컴포넌트 일체 없음)
  • Backend   : Spring Boot 2.4.13 + javax.persistence (★ jakarta 아님)
  • Package   : t3series.saas.* (★ com.zionex.t3series.* 아님)
  • DB        : PostgreSQL z_* prefix + 멀티테넌트 schema (★ TB_* 아님)
  • URL       : /api/<plural-resource> (★ /composer/, /util/ 아님)
  • Stored Procedure 사용 안 함 — JPA + QueryDSL + MyBatis
  • react-hook-form 미사용 — useState + useRef 패턴
  • 메뉴      : TabMenuList.js (DB INSERT 아님)
  • i18n      : 6언어 (en-US/ko-KR/ja-JP/zh-TW/zh-CN/vi-VN)

규칙 인덱스 (.claude-plannel/rules/):
  10-overview.md            기술 스택 + 모노레포 + 모듈
  20-screen-development.md  신규 화면 10단계
  21-components.md          AG-Grid / Filter / Modal / Action 인벤토리
  30-data-access.md         REST + axios + JPA + QueryDSL + MyBatis
  31-multi-tenancy.md       TenantContext + schema 라우팅
  32-security.md            JWT + @PreAuthorize role 매트릭스
  40-database-schema.md     z_* + Liquibase + Instagram-style ID
  50-ai-modules.md          saas-ai + saas-ai-agent
  99-anti-patterns.md       wingui/jakarta/Boot 2-3 환각

표준 원본:
  • saas-web/src/pages/data-management/CustomerMaster.js
  • saas-web/src/pages/data-management/ItemMaster.js
  • saas-application/src/main/java/t3series/saas/controller/WorkcenterController.java

═══════════════════════════════════════════════════════════════════
BRIEF

# git branch + 최근 변경 (선택)
if [ -d "$SAAS_ROOT/.git" ]; then
  CURRENT_BRANCH=$(cd "$SAAS_ROOT" && git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  if [ -n "$CURRENT_BRANCH" ]; then
    echo "📍 saas-plannel branch: $CURRENT_BRANCH"
    RECENT=$(cd "$SAAS_ROOT" && git diff --name-only HEAD~3..HEAD 2>/dev/null | head -5 || true)
    if [ -n "$RECENT" ]; then
      echo "📝 최근 변경 파일 (HEAD~3..HEAD, top 5):"
      echo "$RECENT" | sed 's/^/   • /'
    fi
    echo ""
  fi
fi

exit 0

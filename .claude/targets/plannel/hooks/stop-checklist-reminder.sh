#!/usr/bin/env bash
# =====================================================================
# PlanNEL — Stop Checklist Reminder
# =====================================================================
# 세션 종료 시 (Claude 가 응답 완료 직전) 변경된 PlanNEL 파일 분석 →
# 누락 가능성 있는 후속 작업 체크리스트 출력.
#
# 검사:
#   - 신규 화면 (.js in pages/) → TabMenuList.js entry / i18n key 등록 확인
#   - 신규 Entity → Liquibase changeset / Repository / Service / Controller 4종 확인
#   - 신규 @RestController → frontend service 작성 확인
#   - 신규 @PreAuthorize → role 이 DB seed 에 있는지 (수동 확인 안내)
# =====================================================================

set -euo pipefail

. "$(dirname "${BASH_SOURCE[0]}")/_jq-fallback.sh"

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

INPUT="$(cat)"

# PROJECT_ROOT 해석
if [ -z "${PLANNEL_PROJECT_ROOT:-}" ] || [[ "${PLANNEL_PROJECT_ROOT}" == *'$'* ]]; then
  PROJECT_ROOT="$(pwd)"
else
  PROJECT_ROOT="$PLANNEL_PROJECT_ROOT"
fi

# saas-plannel 위치 추정
SAAS_ROOT=""
for c in "$PROJECT_ROOT" "$PROJECT_ROOT/.." "/Users/hej/work/projects/saas-plannel"; do
  if [ -d "$c/saas-application" ] && [ -d "$c/saas-web" ]; then
    SAAS_ROOT="$(cd "$c" && pwd)"
    break
  fi
done

[ -z "$SAAS_ROOT" ] && exit 0

# git 미설치 또는 git repo 아니면 패스
if ! command -v git >/dev/null 2>&1; then exit 0; fi
if ! (cd "$SAAS_ROOT" && git rev-parse --is-inside-work-tree >/dev/null 2>&1); then exit 0; fi

# 최근 변경 파일 (working tree + staged)
CHANGED=$(cd "$SAAS_ROOT" && git status --porcelain 2>/dev/null \
          | awk '{print $NF}' | sort -u || true)

[ -z "$CHANGED" ] && exit 0

REMINDERS=()

# ─── 신규 화면 (.js in saas-web/src/pages/) ─────────────────────────
NEW_PAGES=$(echo "$CHANGED" | grep -E 'saas-web/src/pages/.*\.js$' | grep -v TabMenuList.js || true)
if [ -n "$NEW_PAGES" ]; then
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    fname=$(basename "$p" .js)
    # TabMenuList.js 가 변경됐는지
    if ! echo "$CHANGED" | grep -qE 'TabMenuList\.js'; then
      REMINDERS+=("📋 신규/수정 화면 '$fname' — TabMenuList.js 의 lv3MenuList 에 entry 추가/확인 필요")
    fi
    # i18n key 변경 (translation.<lang>.js) 됐는지
    if ! echo "$CHANGED" | grep -qE 'assets/data/l10n/translation\.'; then
      REMINDERS+=("🌐 신규/수정 화면 '$fname' — i18n key 6언어 (en-US/ko-KR/ja-JP/zh-TW/zh-CN/vi-VN) 등록 확인 필요")
    fi
  done <<< "$NEW_PAGES"
fi

# ─── 신규 Entity (saas-application/.../model/*.java) ──────────────
NEW_ENTITIES=$(echo "$CHANGED" | grep -E 'saas-application/src/main/java/t3series/saas/model/.*\.java$' || true)
if [ -n "$NEW_ENTITIES" ]; then
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    fname=$(basename "$p" .java)
    full_path="$SAAS_ROOT/$p"
    [ ! -f "$full_path" ] && continue

    # @Entity 가 들어있는지
    if grep -qE '^\s*@Entity\b' "$full_path" 2>/dev/null; then
      # Repository / Service / Controller 동행 변경 확인
      if ! echo "$CHANGED" | grep -qE "/${fname}Repository\.java"; then
        REMINDERS+=("📦 신규 Entity '$fname' — ${fname}Repository.java 작성 확인 필요")
      fi
      if ! echo "$CHANGED" | grep -qE "/${fname}Service\.java"; then
        REMINDERS+=("📦 신규 Entity '$fname' — ${fname}Service.java 작성 확인 필요")
      fi
      if ! echo "$CHANGED" | grep -qE "/${fname}Controller\.java"; then
        REMINDERS+=("📦 신규 Entity '$fname' — ${fname}Controller.java 작성 확인 필요")
      fi
      if ! echo "$CHANGED" | grep -qE "/${fname}Dto\.java"; then
        REMINDERS+=("📦 신규 Entity '$fname' — ${fname}Dto.java + DtoConvertable 확인 필요")
      fi
      # Liquibase changeset
      if ! echo "$CHANGED" | grep -qE 'db/changelog/'; then
        REMINDERS+=("🗄  신규 Entity '$fname' — Liquibase changeset (db/changelog/db.changelog-tenant-ddl-1.0.yaml) 추가 필요")
      fi
    fi
  done <<< "$NEW_ENTITIES"
fi

# ─── 신규 Controller → frontend service 동행 변경 확인 ─────────────
NEW_CONTROLLERS=$(echo "$CHANGED" | grep -E 'saas-application/src/main/java/t3series/saas/controller/.*\.java$' || true)
if [ -n "$NEW_CONTROLLERS" ]; then
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    fname=$(basename "$p" .java | sed 's/Controller$//')
    # frontend service kebab-case 추정
    kebab=$(echo "$fname" | sed -E 's/([a-z0-9])([A-Z])/\1-\2/g' | tr '[:upper:]' '[:lower:]')

    if ! echo "$CHANGED" | grep -qE "saas-web/src/services/.*${kebab}.*-service\.js"; then
      REMINDERS+=("🔌 신규 Controller '${fname}Controller' — saas-web/src/services/<area>/${kebab}-service.js 작성 확인 필요")
    fi
    full_path="$SAAS_ROOT/$p"
    [ ! -f "$full_path" ] && continue

    # @PreAuthorize 누락
    if ! grep -qE '@PreAuthorize' "$full_path" 2>/dev/null; then
      REMINDERS+=("🔒 신규 Controller '${fname}Controller' — @PreAuthorize 누락. 모듈 role (APP_DP/APP_IP/APP_RP/APP_MP) 또는 ADMIN 명시 필요")
    fi
  done <<< "$NEW_CONTROLLERS"
fi

# ─── 출력 ────────────────────────────────────────────────────────
if [ "${#REMINDERS[@]}" -gt 0 ]; then
  echo "" >&2
  echo "═══════════════════════════════════════════════════════════════════" >&2
  echo "🟦 PlanNEL — Stop Checklist (${#REMINDERS[@]} 개 후속 작업 가능)" >&2
  echo "═══════════════════════════════════════════════════════════════════" >&2
  for r in "${REMINDERS[@]}"; do
    echo "  $r" >&2
  done
  echo "" >&2
  echo "  참조: .claude-plannel/rules/20-screen-development.md (체크리스트)" >&2
  echo "═══════════════════════════════════════════════════════════════════" >&2
fi

exit 0

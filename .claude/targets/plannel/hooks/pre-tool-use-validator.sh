#!/usr/bin/env bash
# =====================================================================
# PlanNEL — PreToolUse Validator (Dispatcher)
# =====================================================================
# Claude Code 가 Write/Edit/MultiEdit 을 호출하기 **직전** 실행되어,
# PlanNEL 규약 위반 파일·내용이면 exit 2 로 차단.
# exit 0 = 허용 · exit 2 = 차단 (Claude stderr) · 기타 = 에러
# 입력: stdin JSON (tool_name, tool_input.file_path, tool_input.content)
#
# ─── 검증 모듈 (validators/ 디렉토리, 순서대로 source) ────────────────
# 1. import-convention.sh   — jakarta.* 차단 + @wingui/* 차단 + 상대경로 warn
# 2. package-convention.sh  — Java package t3series.saas.* 강제 (com.zionex 차단)
# 3. url-convention.sh      — /api/<plural-resource> 강제 (/composer, /util 차단)
# 4. entity-conventions.sh  — @Table z_* prefix + BaseEntity + BooleanToYN + JsonIgnore
# 5. controller-security.sh — @PreAuthorize 누락 warn + ROLE_ prefix 차단
# 6. aggrid-columns.sh      — RealGrid 키 (headerText/dataType/textAlignment) 차단
# 7. jsx-page.sh            — withTranslation + viewName + DataState.initialize 검증
# 8. sql-table-naming.sh    — z_* 강제 (TB_* / 대문자 / camelCase 차단)
#
# 참조: T3Series wingui 의 동등 hook (`/Users/hej/work/projects/t3-composer/.claude/hooks/`)
# =====================================================================

set -euo pipefail

# jq 가 PATH 에 없으면 winget 등 표준 위치 탐색
. "$(dirname "${BASH_SOURCE[0]}")/_jq-fallback.sh"

# fallback 후에도 jq 없으면 조용히 패스
if ! command -v jq >/dev/null 2>&1; then
  echo "[plannel pre-validator] jq 미설치 — 검증 스킵" >&2
  exit 0
fi

INPUT="$(cat)"
TOOL_NAME="$(echo "$INPUT" | jq -r '.tool_name // empty')"
FILE_PATH="$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')"
CONTENT="$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_str // .tool_input.file_text // empty')"

# PROJECT_ROOT 해석 — PLANNEL_PROJECT_ROOT 가 미전개 리터럴인 경우도 처리
if [ -z "${PLANNEL_PROJECT_ROOT:-}" ] || [[ "${PLANNEL_PROJECT_ROOT}" == *'$'* ]]; then
  PROJECT_ROOT="$(pwd)"
else
  PROJECT_ROOT="$PLANNEL_PROJECT_ROOT"
fi

# 파일 경로 없으면 패스
[ -z "$FILE_PATH" ] && exit 0

# ─── PlanNEL 영역 가드: saas-plannel 또는 saas-web/saas-application 안에서만 동작 ─
# (다른 프로젝트 파일은 PlanNEL 규약과 무관하므로 패스)
case "$FILE_PATH" in
  *saas-plannel/*|*saas-web/*|*saas-application/*|*saas-common/*|*saas-mp/*|*saas-rp/*|*saas-supplyserver/*|*saas-admin/*|*saas-ai/*|*saas-ai-agent/*) ;;
  *) exit 0 ;;
esac

# ─── validators/ 모듈 ────────────────────────────────────────────────
HOOKS_DIR="$(dirname "${BASH_SOURCE[0]}")"
VALIDATORS_DIR="$HOOKS_DIR/validators"

# shellcheck source=validators/_lib.sh
. "$VALIDATORS_DIR/_lib.sh"

# 순차 실행. 각 모듈은 자체 가드 (확장자/경로/TOOL_NAME) 로 비대상 호출 즉시 패스.
. "$VALIDATORS_DIR/import-convention.sh"
. "$VALIDATORS_DIR/package-convention.sh"
. "$VALIDATORS_DIR/url-convention.sh"
. "$VALIDATORS_DIR/entity-conventions.sh"
. "$VALIDATORS_DIR/controller-security.sh"
. "$VALIDATORS_DIR/aggrid-columns.sh"
. "$VALIDATORS_DIR/jsx-page.sh"
. "$VALIDATORS_DIR/sql-table-naming.sh"

exit 0

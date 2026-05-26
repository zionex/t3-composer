#!/usr/bin/env bash
# =====================================================================
# KTNG — PreToolUse Validator (Dispatcher)
# =====================================================================
# Claude Code 가 Write/Edit/MultiEdit 을 호출하기 **직전** 실행되어,
# KTNG 프로젝트 규약 위반 파일·내용이면 exit 2 로 차단.
# exit 0 = 허용 · exit 2 = 차단 (Claude stderr) · 기타 = 에러
# 입력: stdin JSON (tool_name, tool_input.file_path, tool_input.content)
#
# ─── 검증 모듈 (validators/ 디렉토리, 순서대로 source) ────────────────
# 1. jsx-basic.sh        — JSX 화면 구조 + 한글 i18n + BaseGrid prop
# 2. sql-sp.sh           — SP_UI_<DOMAIN>_KTNG_<NN>_<ACTION> 네이밍 · MSSQL only
# 3. java-basic.sh       — System.out / @Autowired · ResponseMessage · @Value default
# 4. java-imports.sh     — jakarta.* 강제 (Spring Boot 3.x)
# 5. ktng-naming.sh      — KTNG 전용 네이밍 (MENU_CD/Controller URL/SP/Java pkg/JSX path)
# 6. ktng-controller.sh  — Controller 패턴 (QueryHandler · @ExecPermission · @RequestBody List<Map>)
# 7. menu-sql.sh         — TB_AD_MENU INSERT 실제 컬럼 화이트리스트
# 8. sql-schema-whitelist.sh — 자주 틀리는 컬럼 (TB_AD_MENU/TB_AD_LANG_PACK 등)
# =====================================================================

set -euo pipefail

# jq 가 PATH 에 없으면 winget 등 표준 위치 탐색
. "$(dirname "${BASH_SOURCE[0]}")/_jq-fallback.sh"

if ! command -v jq >/dev/null 2>&1; then
  echo "[ktng-pre-validator] jq 미설치 — 검증 스킵" >&2
  exit 0
fi

INPUT="$(cat)"
TOOL_NAME="$(echo "$INPUT" | jq -r '.tool_name // empty')"
FILE_PATH="$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')"
CONTENT="$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_str // .tool_input.file_text // empty')"

if [ -z "${T3_PROJECT_ROOT:-}" ] || [[ "${T3_PROJECT_ROOT}" == *'$'* ]]; then
  PROJECT_ROOT="$(pwd)"
else
  PROJECT_ROOT="$T3_PROJECT_ROOT"
fi

[ -z "$FILE_PATH" ] && exit 0

HOOKS_DIR="$(dirname "${BASH_SOURCE[0]}")"
VALIDATORS_DIR="$HOOKS_DIR/validators"

# shellcheck source=validators/_lib.sh
. "$VALIDATORS_DIR/_lib.sh"

. "$VALIDATORS_DIR/jsx-basic.sh"
. "$VALIDATORS_DIR/sql-sp.sh"
. "$VALIDATORS_DIR/java-basic.sh"
. "$VALIDATORS_DIR/java-imports.sh"
. "$VALIDATORS_DIR/ktng-naming.sh"
. "$VALIDATORS_DIR/ktng-controller.sh"
. "$VALIDATORS_DIR/menu-sql.sh"
. "$VALIDATORS_DIR/sql-schema-whitelist.sh"

exit 0

#!/usr/bin/env bash
# =====================================================================
# KTNG — PostToolUse Linter (가벼운 점검)
# =====================================================================
# Claude Code 가 Write/Edit/MultiEdit 로 파일 저장한 **직후** 실행.
# KTNG 는 별도 빌드 환경이 없을 수 있으므로 외부 도구는 있을 때만 호출.
# =====================================================================

set -uo pipefail

. "$(dirname "${BASH_SOURCE[0]}")/_jq-fallback.sh"

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

INPUT="$(cat)"
TOOL_NAME="$(echo "$INPUT" | jq -r '.tool_name // empty')"
FILE_PATH="$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')"

[ -z "$FILE_PATH" ] && exit 0
[ ! -f "$FILE_PATH" ] && exit 0

# ─── 가벼운 sanity check 만 수행 ──────────────────────────────────────

# 1. JSX/JS — 단순 괄호 balance check
if [[ "$FILE_PATH" =~ \.(jsx|js|ts|tsx)$ ]]; then
  OPEN_CURLY=$(grep -o '{' "$FILE_PATH" | wc -l | awk '{print $1}')
  CLOSE_CURLY=$(grep -o '}' "$FILE_PATH" | wc -l | awk '{print $1}')
  if [ "$OPEN_CURLY" -ne "$CLOSE_CURLY" ]; then
    echo "⚠️  [post-linter] $FILE_PATH — { } 갯수 불일치 ($OPEN_CURLY vs $CLOSE_CURLY)" >&2
  fi
fi

# 2. Java — 단순 패키지·import 점검
if [[ "$FILE_PATH" =~ \.java$ ]]; then
  if ! grep -qE '^package\s+' "$FILE_PATH"; then
    echo "⚠️  [post-linter] $FILE_PATH — package 선언 누락" >&2
  fi
fi

# 3. SQL — GO 배치 또는 ; 종결 점검 (warn 만)
if [[ "$FILE_PATH" =~ \.sql$ ]]; then
  if ! tail -c 200 "$FILE_PATH" | grep -qE 'GO\s*$|;\s*$|END\s*$'; then
    echo "⚠️  [post-linter] $FILE_PATH — 끝에 GO/세미콜론/END 없음 (MSSQL 배치 구분)" >&2
  fi
fi

exit 0

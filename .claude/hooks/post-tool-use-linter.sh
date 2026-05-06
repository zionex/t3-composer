#!/usr/bin/env bash
# =====================================================================
# T3Series — PostToolUse Linter
# =====================================================================
# Claude Code 가 Write/Edit/MultiEdit 로 파일 저장한 **직후** 실행.
# 파일 타입별로 린터·포매터·정적분석을 백그라운드로 실행하고,
# 결과를 Claude 에게 피드백으로 전달한다.
#
# 정책:
#   - exit 0 = 통과 (Claude 가 계속 진행)
#   - exit 2 = 실패 (Claude 가 stderr 보고 수정 루프 진입 — 강력)
#   - 여기서는 심각한 경우에만 exit 2. 일반 경고는 stdout 으로만.
# =====================================================================

set -uo pipefail  # set -e 하면 린터 실패 시 스크립트 종료되므로 제외

. "$(dirname "${BASH_SOURCE[0]}")/_jq-fallback.sh"

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

INPUT="$(cat)"
TOOL_NAME="$(echo "$INPUT" | jq -r '.tool_name // empty')"
FILE_PATH="$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')"

[ -z "$FILE_PATH" ] && exit 0
[ ! -f "$FILE_PATH" ] && exit 0

# T3_PROJECT_ROOT 이 '${PWD}' 같은 미전개 리터럴이어도 안전 처리
if [ -z "${T3_PROJECT_ROOT:-}" ] || [[ "${T3_PROJECT_ROOT}" == *'$'* ]]; then
  PROJECT_ROOT="$(pwd)"
else
  PROJECT_ROOT="$T3_PROJECT_ROOT"
fi
LINT_LOG="/tmp/t3-lint-$(date +%s)-$$.log"

report_fix_needed() {
  local severity="$1"
  local msg="$2"
  if [ "$severity" = "error" ]; then
    echo "❌ [post-linter] $msg" >&2
    echo "   → 로그: $LINT_LOG" >&2
    # 치명적 에러는 exit 2 로 Claude 에 수정 요청
    exit 2
  else
    echo "⚠️  [post-linter] $msg" >&2
  fi
}

report_ok() {
  echo "✅ [post-linter] $1"
}

# =====================================================================
# 1. JSX / TSX / JS / TS — ESLint + Prettier
# =====================================================================
if [[ "$FILE_PATH" =~ \.(jsx|tsx|js|ts)$ ]]; then

  # wingui 하위만 린트 (다른 모듈은 Maven 이 담당)
  if [[ "$FILE_PATH" == *t3series-wingui/* ]] || [[ "$FILE_PATH" == *packages/wingui/* ]]; then

    WINGUI_DIR=""
    # packages/wingui 루트 찾기
    if [[ "$FILE_PATH" == */packages/wingui/* ]]; then
      WINGUI_DIR="${FILE_PATH%/packages/wingui/*}/packages/wingui"
    elif [[ "$FILE_PATH" == *t3series-wingui/* ]]; then
      WINGUI_DIR="${FILE_PATH%/t3series-wingui/*}/t3series-wingui"
    fi

    if [ -n "$WINGUI_DIR" ] && [ -d "$WINGUI_DIR/node_modules" ]; then
      # ESLint (있으면)
      if [ -x "$WINGUI_DIR/node_modules/.bin/eslint" ]; then
        cd "$WINGUI_DIR"
        if ./node_modules/.bin/eslint --no-eslintrc --config .eslintrc* "$FILE_PATH" > "$LINT_LOG" 2>&1 \
           || ./node_modules/.bin/eslint "$FILE_PATH" > "$LINT_LOG" 2>&1; then
          report_ok "ESLint 통과: $(basename "$FILE_PATH")"
        else
          ERR_COUNT=$(grep -cE "[0-9]+ error" "$LINT_LOG" 2>/dev/null || echo 0)
          if [ "$ERR_COUNT" -gt 0 ]; then
            report_fix_needed "error" "ESLint 에러 $ERR_COUNT 건. 수정 필요. 로그: $(head -30 "$LINT_LOG" | tail -20)"
          else
            report_fix_needed "warn" "ESLint 경고 있음. 로그: $LINT_LOG"
          fi
        fi
      fi

      # Prettier auto-fix (있으면, 파괴적이지 않은 포매팅만)
      if [ -x "$WINGUI_DIR/node_modules/.bin/prettier" ]; then
        cd "$WINGUI_DIR"
        ./node_modules/.bin/prettier --write "$FILE_PATH" >/dev/null 2>&1 && \
          report_ok "Prettier 포매팅 완료: $(basename "$FILE_PATH")"
      fi
    else
      # node_modules 없는 로컬 환경 — 스킵
      :
    fi
  fi
fi

# =====================================================================
# 2. Java — Checkstyle + PMD + SpotBugs (Maven 플러그인)
# =====================================================================
if [[ "$FILE_PATH" =~ \.java$ ]]; then

  # 모듈 루트 찾기 (pom.xml 이 있는 가장 가까운 상위)
  MODULE_DIR="$(dirname "$FILE_PATH")"
  while [ "$MODULE_DIR" != "/" ] && [ ! -f "$MODULE_DIR/pom.xml" ]; do
    MODULE_DIR="$(dirname "$MODULE_DIR")"
  done

  if [ -f "$MODULE_DIR/pom.xml" ]; then
    # 전체 모듈 Maven 호출은 무거우므로, 단일 파일 검증 경량화
    # Checkstyle CLI 가 있으면 우선 사용, 아니면 mvn 비동기 호출
    if command -v checkstyle >/dev/null 2>&1 && [ -f "$PROJECT_ROOT/checkstyle-google.xml" ]; then
      if checkstyle -c "$PROJECT_ROOT/checkstyle-google.xml" "$FILE_PATH" > "$LINT_LOG" 2>&1; then
        report_ok "Checkstyle 통과: $(basename "$FILE_PATH")"
      else
        report_fix_needed "warn" "Checkstyle 위반. 로그: $(head -20 "$LINT_LOG")"
      fi
    else
      # Maven 비동기 실행 (완료 대기하지 않음 — 백그라운드)
      if command -v mvn >/dev/null 2>&1 && [ "${T3_ENABLE_MVN_LINT:-false}" = "true" ]; then
        (cd "$MODULE_DIR" && nohup mvn -q checkstyle:check pmd:check spotbugs:check \
          > /tmp/t3-mvn-lint-$$.log 2>&1 &) &
        report_ok "Maven 린트 백그라운드 실행 중 (결과: /tmp/t3-mvn-lint-$$.log)"
      fi
    fi

    # 로컬 정적 패턴 체크 (Maven 없이도 동작)
    if grep -qE "System\.(out|err)\.println" "$FILE_PATH" 2>/dev/null; then
      report_fix_needed "error" "System.out/err.println 감지 — SLF4J Logger 사용 필수 (99-anti-patterns.md J2)"
    fi
  fi
fi

# =====================================================================
# 3. SQL — 구문 · 네이밍 · 온톨로지 패턴
# =====================================================================
if [[ "$FILE_PATH" =~ \.sql$ ]]; then

  # MSSQL/Oracle 파일 쌍 확인
  if [[ "$FILE_PATH" == */mssql/procedures/* ]]; then
    ORACLE_PATH="${FILE_PATH/\/mssql\//\/oracle\/}"
    if [ ! -f "$ORACLE_PATH" ]; then
      echo "📝 [post-linter] Oracle 대응 파일 생성 필요: $ORACLE_PATH" >&2
    fi
  elif [[ "$FILE_PATH" == */oracle/procedures/* ]]; then
    MSSQL_PATH="${FILE_PATH/\/oracle\//\/mssql\/}"
    if [ ! -f "$MSSQL_PATH" ]; then
      echo "📝 [post-linter] MSSQL 대응 파일 생성 필요: $MSSQL_PATH" >&2
    fi
  fi

  # sqlfluff 설치되어 있으면 실행
  if command -v sqlfluff >/dev/null 2>&1; then
    DIALECT="tsql"
    [[ "$FILE_PATH" == */oracle/* ]] && DIALECT="oracle"
    if sqlfluff lint --dialect "$DIALECT" "$FILE_PATH" > "$LINT_LOG" 2>&1; then
      report_ok "sqlfluff 통과: $(basename "$FILE_PATH")"
    else
      report_fix_needed "warn" "sqlfluff 경고. 로그: $(head -15 "$LINT_LOG")"
    fi
  fi
fi

# =====================================================================
# 4. Python (bfserver) — flake8 + black
# =====================================================================
if [[ "$FILE_PATH" =~ \.py$ ]] && [[ "$FILE_PATH" == *bfserver/* ]]; then

  if command -v flake8 >/dev/null 2>&1; then
    if flake8 --max-line-length=120 "$FILE_PATH" > "$LINT_LOG" 2>&1; then
      report_ok "flake8 통과: $(basename "$FILE_PATH")"
    else
      report_fix_needed "warn" "flake8 경고. 로그: $(cat "$LINT_LOG" | head -15)"
    fi
  fi

  if command -v black >/dev/null 2>&1; then
    black --quiet "$FILE_PATH" 2>/dev/null && \
      report_ok "black 포매팅 완료: $(basename "$FILE_PATH")"
  fi
fi

# =====================================================================
# 5. pom.xml — XML 구조 검증
# =====================================================================
if [[ "$(basename "$FILE_PATH")" == "pom.xml" ]]; then
  if command -v xmllint >/dev/null 2>&1; then
    if xmllint --noout "$FILE_PATH" 2>"$LINT_LOG"; then
      report_ok "pom.xml XML 구조 유효"
    else
      report_fix_needed "error" "pom.xml XML 구조 오류: $(cat "$LINT_LOG")"
    fi
  fi
fi

# =====================================================================
# 모든 검사 완료
# =====================================================================
rm -f "$LINT_LOG"
exit 0

#!/usr/bin/env bash
# =====================================================================
# T3Series — PreToolUse Validator (Dispatcher)
# =====================================================================
# Claude Code 가 Write/Edit/MultiEdit 을 호출하기 **직전** 실행되어,
# 프로젝트 규약 위반 파일·내용이면 exit 2 로 차단.
# exit 0 = 허용 · exit 2 = 차단 (Claude stderr) · 기타 = 에러
# 입력: stdin JSON (tool_name, tool_input.file_path, tool_input.content)
#
# ─── 검증 모듈 (validators/ 디렉토리, 순서대로 source) ────────────────
# 1. jsx-basic.sh        — R1~R9 화면 구조 + 한글 i18n
# 2. sql-sp.sh           — S1~S8 네이밍·MSSQL/Oracle·DDL upgrade · 온톨로지 O3/O4/O7
# 3. java-basic.sh       — J2 println · J5 @Autowired · SE1 평문 비번
# 4. build-config.sh     — §4 pom.xml (T1/J1) + §5 환경변수/시크릿
# 5. filter-bar.sh       — FilterBar JSON 스키마 (FB1~FB15)
# 6. composer-patterns.sh — T3Composer Pattern/Dictionary (CP1~CP11)
# 7. composer-policy.sh  — Composer 산출물 차단 (SP_UI_* / 엔진 service XML)
# 8. java-imports.sh     — Java import jakarta.* 강제 (Spring Boot 3.x)
# 9. composer-jsx.sh     — CG-A~E (BaseGrid/grid id/callService/Master/Cascade)
# 10. menu-sql.sh        — MENU_SQL: MENU_CD / MENU_FILE_PATH / 부모 코드
# 11. path-convention.sh — `ut/` 사용 금지 → `util/` 강제 (Java 패키지/URL/zAxios/JSX 경로)
# 12. sql-schema-whitelist.sh — .sql 파일 컬럼 화이트리스트 (TB_UT_USER_INFO/TB_AD_MENU/TB_AD_LANG_PACK)
# 13. composer-artifact-path.sh — 파일명 확장자 underscore 환각 차단 (`_sql`/`_jsx`/`_java`)
#
# 분리 전 단일 파일: pre-tool-use-validator.sh (937줄, 57KB)
# 분리 후: 디스패처(이 파일) + validators/*.sh 11개
# =====================================================================

set -euo pipefail

# jq 가 PATH 에 없으면 winget 등 표준 위치 탐색
. "$(dirname "${BASH_SOURCE[0]}")/_jq-fallback.sh"

# fallback 후에도 jq 없으면 조용히 패스 (개발자 로컬 환경 편의)
if ! command -v jq >/dev/null 2>&1; then
  echo "[pre-validator] jq 미설치 — 검증 스킵" >&2
  exit 0
fi

INPUT="$(cat)"
TOOL_NAME="$(echo "$INPUT" | jq -r '.tool_name // empty')"
FILE_PATH="$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')"
CONTENT="$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_str // .tool_input.file_text // empty')"

# PROJECT_ROOT — schema / rules 등 경로 해석용
#   T3_PROJECT_ROOT 가 '${PWD}' / '$PWD' 같은 미전개 리터럴인 경우도 안전하게 처리
if [ -z "${T3_PROJECT_ROOT:-}" ] || [[ "${T3_PROJECT_ROOT}" == *'$'* ]]; then
  PROJECT_ROOT="$(pwd)"
else
  PROJECT_ROOT="$T3_PROJECT_ROOT"
fi

# 파일 경로 없으면 패스 (MultiEdit 등은 별도 처리 필요하나 여기선 단순화)
[ -z "$FILE_PATH" ] && exit 0

# ─── validators/ 모듈 source 위치 ───────────────────────────────────
HOOKS_DIR="$(dirname "${BASH_SOURCE[0]}")"
VALIDATORS_DIR="$HOOKS_DIR/validators"

# 헬퍼 (block / warn) — 모든 validator 가 사용
# shellcheck source=validators/_lib.sh
. "$VALIDATORS_DIR/_lib.sh"

# 순차 실행. 각 모듈은 자체 가드(파일 확장자/경로/TOOL_NAME)로 비대상 호출 즉시 패스.
# 모듈 안에서 block() → exit 2 발동 시 디스패처도 종료됨 (set -e 와 별개로 정상).
. "$VALIDATORS_DIR/jsx-basic.sh"
. "$VALIDATORS_DIR/sql-sp.sh"
. "$VALIDATORS_DIR/java-basic.sh"
. "$VALIDATORS_DIR/build-config.sh"
. "$VALIDATORS_DIR/filter-bar.sh"
. "$VALIDATORS_DIR/composer-patterns.sh"
. "$VALIDATORS_DIR/composer-policy.sh"
. "$VALIDATORS_DIR/java-imports.sh"
. "$VALIDATORS_DIR/composer-jsx.sh"
. "$VALIDATORS_DIR/menu-sql.sh"
. "$VALIDATORS_DIR/path-convention.sh"
. "$VALIDATORS_DIR/sql-schema-whitelist.sh"
. "$VALIDATORS_DIR/composer-artifact-path.sh"

# =====================================================================
# 모든 검증 통과
# =====================================================================
exit 0

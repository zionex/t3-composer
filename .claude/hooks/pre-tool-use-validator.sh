#!/usr/bin/env bash
# =====================================================================
# T3Series — PreToolUse Validator (Dispatcher)
# =====================================================================
# Claude Code 가 Write/Edit/MultiEdit 을 호출하기 **직전** 실행되어,
# 프로젝트 규약 위반 파일·내용이면 exit 2 로 차단.
# exit 0 = 허용 · exit 2 = 차단 (Claude stderr) · 기타 = 에러
# 입력: stdin JSON (tool_name, tool_input.file_path, tool_input.content)
#
# ─── 검증 모듈 ────────────────────────────────────────────────────────
# 공용 (validators/, 모든 Target 에 적용 — 10개, _lib.sh 헬퍼 제외) :
#   1. java-basic.sh            — J2 println · J5 @Autowired · J9 @Value default
#                                  CG-J1 JdbcTemplate qualifier · SE1 평문 비번
#   2. java-imports.sh          — javax.* 금지 (jakarta) + @Value default (Spring Boot 3.x)
#   3. build-config.sh          — §4 pom.xml (T1/J1) + §5 환경변수/시크릿
#   4. filter-bar.sh            — FilterBar JSON 스키마 (FB1~FB15)
#   5. composer-patterns.sh     — T3Composer Pattern/Dictionary (CP1~CP11)
#   6. composer-policy.sh       — Composer 산출물 차단 (SP_UI_* / 엔진 service XML)
#   7. composer-jsx.sh          — CG-A~E (BaseGrid/grid id/callService/Master/Cascade)
#   8. composer-artifact-path.sh — 파일명 확장자 underscore 환각 차단
#   9. java-class-naming.sh     — CG-L1~L4 Java 클래스명 ↔ 디렉토리 1:1
#   10. t3mockup.sh             — M1~M4 t3mockup 규약 (Phase 4a/b/c)
#
# T3SERIES 전용 overlay (.claude/targets/t3series/hooks/validators/, 7개) :
#   sql-sp.sh                   — S1~S8 SP_UI_ 네이밍 (T3 MSSQL)
#   menu-sql.sh                 — MENU_SQL: MENU_CD / MENU_FILE_PATH / 부모 코드
#   sql-schema-whitelist.sh     — .sql 컬럼 화이트리스트 (TB_AD_USER · TB_AD_MENU 등)
#   path-convention.sh          — `ut/` 금지 → `util/` (com.zionex.t3series 패키지)
#   jsx-basic.sh                — R1~R9 wingui 화면 구조 + 한글 i18n
#   java-resp-msg.sh            — wingui ResponseMessage J8/J11 (@Builder·정적 팩토리 금지)
#   java-wingui-imports.sh      — wingui 패키지 환각 차단 (BaseEntity · Specification · Multipart)
#
# PLANNEL 전용 overlay (.claude/targets/plannel/hooks/validators/, 9개) :
#   aggrid-columns · controller-security · entity-conventions · import-convention
#   jsx-page · package-convention · sql-table-naming · url-convention 등
#
# Target overlay 는 Composer 백엔드가 DB import 로 가져와 실행. Claude Code CLI 세션에서는
# 공용 validators 만 발화 (T3 overlay 가 필요하면 아래 SOURCE 블록 주석 해제).
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
# ── 공용 validators (모든 Target 의 산출물에 적용 — Claude Code CLI 세션에서도 발화) ──
. "$VALIDATORS_DIR/java-basic.sh"            # J2/J5/J9/CG-J1/SE1
. "$VALIDATORS_DIR/java-imports.sh"          # javax.* + @Value default (Spring Boot 3.x)
. "$VALIDATORS_DIR/build-config.sh"
. "$VALIDATORS_DIR/filter-bar.sh"
. "$VALIDATORS_DIR/composer-patterns.sh"
. "$VALIDATORS_DIR/composer-policy.sh"
. "$VALIDATORS_DIR/composer-jsx.sh"          # (TODO: 추후 wingui 한정 검토 — 현재 공용)
. "$VALIDATORS_DIR/composer-artifact-path.sh"
. "$VALIDATORS_DIR/java-class-naming.sh"
. "$VALIDATORS_DIR/t3mockup.sh"

# ── T3SERIES 전용 validators (.claude/targets/t3series/hooks/validators/) ──
#   sql-sp.sh                 — S1~S8 SP_UI_ 네이밍 (T3 MSSQL)
#   menu-sql.sh               — TB_AD_MENU INSERT (T3 메뉴 형식)
#   sql-schema-whitelist.sh   — T3 테이블 컬럼 화이트리스트
#   path-convention.sh        — com.zionex.t3series.web.domain.util/ut 패키지 (T3 wingui)
#   jsx-basic.sh              — R1~R9 wingui 화면 구조 + 한글 i18n
#   java-resp-msg.sh          — wingui ResponseMessage J8/J11 (Lombok @Builder + 정적 팩토리 금지)
#   java-wingui-imports.sh    — wingui 패키지 환각 차단 (BaseEntity · SpecificationBuilder · Multipart 등)
# Composer 백엔드는 DB import (target_cd='T3SERIES' overlay) 로 이 hook 들을 사용.
# Claude Code CLI 세션 자체에는 자동 발화 안 함 (Composer 본체 dev 시 T3 산출물 파일 작성하는
# 경우만 아래 SOURCE 블록 주석 해제):
# T3_OVERLAY="$HOOKS_DIR/../targets/t3series/hooks/validators"
# . "$T3_OVERLAY/sql-sp.sh"
# . "$T3_OVERLAY/menu-sql.sh"
# . "$T3_OVERLAY/sql-schema-whitelist.sh"
# . "$T3_OVERLAY/path-convention.sh"
# . "$T3_OVERLAY/jsx-basic.sh"
# . "$T3_OVERLAY/java-resp-msg.sh"
# . "$T3_OVERLAY/java-wingui-imports.sh"

# =====================================================================
# 모든 검증 통과
# =====================================================================
exit 0

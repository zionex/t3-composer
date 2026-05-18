#!/usr/bin/env bash
# =====================================================================
# PlanNEL — PostToolUse Linter
# =====================================================================
# Write/Edit/MultiEdit 호출 후 실행되어, 저장된 파일에 대해 추가 lint.
# block 은 안 함 (이미 PreToolUse 에서 검증). warn 형태로 사용자에게 안내.
#
# 검사:
#   - frontend (.js / .jsx) — package.json 의 craco eslint 빠른 검증 (선택)
#   - Java — maven compile 까지는 비용 큰 작업이라 생략. import / 컴파일 오류는 IDE / CI 단계
#   - i18n key 누락 — 신규 t("KEY") 가 translation.<lang>.js 에 등록 안 된 경우
#   - Liquibase changelog 누락 — 신규 @Entity 에 대응 changeset 없는 경우
#
# exit 0 = 항상 (warn 만)
# =====================================================================

set -euo pipefail

. "$(dirname "${BASH_SOURCE[0]}")/_jq-fallback.sh"

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

INPUT="$(cat)"
TOOL_NAME="$(echo "$INPUT" | jq -r '.tool_name // empty')"
FILE_PATH="$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')"

[ -z "$FILE_PATH" ] && exit 0

# PlanNEL 영역 가드
case "$FILE_PATH" in
  *saas-plannel/*|*saas-web/*|*saas-application/*|*saas-common/*|*saas-mp/*|*saas-rp/*|*saas-supplyserver/*|*saas-admin/*|*saas-ai/*|*saas-ai-agent/*) ;;
  *) exit 0 ;;
esac

# ─── i18n key 누락 검사 (saas-web 의 .js 파일에 t("KEY") 신규 추가 시) ─
if [[ "$FILE_PATH" == *saas-web/src/pages/*.js ]] || [[ "$FILE_PATH" == *saas-web/src/components/*.js ]]; then
  if [ -f "$FILE_PATH" ]; then
    # 새로 추가된 t("KEY") 패턴 추출
    KEYS=$(grep -oE "\bt\(\s*['\"]([A-Za-z_][A-Za-z0-9_]*)['\"]\s*\)" "$FILE_PATH" 2>/dev/null \
          | sed -E "s/.*['\"]([A-Za-z_][A-Za-z0-9_]*)['\"].*/\1/" \
          | sort -u | head -20 || true)

    if [ -n "$KEYS" ]; then
      # translation.ko-kr.js 에서 검색
      L10N_DIR=""
      # 가능한 경로 후보
      for c in "$(dirname "$FILE_PATH")/../../assets/data/l10n" \
               "$(dirname "$FILE_PATH")/../assets/data/l10n" \
               "$(dirname "$FILE_PATH")/../../../assets/data/l10n"; do
        if [ -d "$c" ]; then
          L10N_DIR="$c"
          break
        fi
      done

      if [ -n "$L10N_DIR" ] && [ -f "$L10N_DIR/translation.ko-kr.js" ]; then
        MISSING=()
        while IFS= read -r key; do
          [ -z "$key" ] && continue
          # 6언어 모두에 있는지 한 줄로 확인 (ko-kr 만 빠르게)
          if ! grep -qE "\b${key}\s*:" "$L10N_DIR/translation.ko-kr.js" 2>/dev/null; then
            MISSING+=("$key")
          fi
        done <<< "$KEYS"

        if [ "${#MISSING[@]}" -gt 0 ]; then
          echo "⚠️  [PlanNEL] i18n key 누락 가능 (translation.ko-kr.js 미등록): ${MISSING[*]}" >&2
          echo "    6언어 (en-US/ko-KR/ja-JP/zh-TW/zh-CN/vi-VN) 모두에 추가 필요." >&2
          echo "    참조: rules/10-overview.md §5" >&2
        fi
      fi
    fi
  fi
fi

# ─── Liquibase changeset 누락 검사 (신규 @Entity 작성 시) ──────────
if [[ "$FILE_PATH" == *saas-application/src/main/java/t3series/saas/model/*.java ]]; then
  if [ -f "$FILE_PATH" ] && grep -qE '^\s*@Entity\b' "$FILE_PATH" 2>/dev/null; then
    # @Table(name = "z_xxx") 추출
    TABLE_NAME=$(grep -oE '@Table\s*\(\s*name\s*=\s*"[^"]+"' "$FILE_PATH" 2>/dev/null \
                 | head -1 | sed -E 's/.*name\s*=\s*"([^"]+)".*/\1/')

    if [ -n "$TABLE_NAME" ]; then
      # changelog 폴더에서 해당 tableName 검색
      CHANGELOG_DIR="$(dirname "$FILE_PATH" | sed 's|src/main/java.*|src/main/resources/db/changelog|')"
      if [ -d "$CHANGELOG_DIR" ]; then
        if ! grep -rqE "tableName\s*:\s*$TABLE_NAME\b" "$CHANGELOG_DIR" 2>/dev/null \
           && ! grep -rqiE "CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?(\w+\.)?$TABLE_NAME\b" "$CHANGELOG_DIR" 2>/dev/null; then
          echo "⚠️  [PlanNEL] @Entity '$TABLE_NAME' 에 대응하는 Liquibase changeset 미발견 — db/changelog/ 에 createTable changeset 추가 필요." >&2
          echo "    참조: rules/40-database-schema.md §7.1" >&2
        fi
      fi
    fi
  fi
fi

# ─── @RestController 작성 시 frontend service 누락 안내 ───────────
if [[ "$FILE_PATH" == *saas-application/src/main/java/t3series/saas/controller/*.java ]]; then
  if [ -f "$FILE_PATH" ] && grep -qE '@RestController' "$FILE_PATH" 2>/dev/null; then
    # @PostMapping("/<resource>") 안의 resource 추출
    RESOURCES=$(grep -oE '@(Post|Get|Delete|Put)Mapping\s*\(\s*"/([a-z0-9-]+)' "$FILE_PATH" 2>/dev/null \
                | sed -E 's|.*"/([a-z0-9-]+).*|\1|' | sort -u | head -3 || true)

    if [ -n "$RESOURCES" ]; then
      echo "ℹ️  [PlanNEL] @RestController 작성됨 — 대응 frontend service 작성 필요:" >&2
      while IFS= read -r r; do
        [ -z "$r" ] && continue
        echo "    saas-web/src/services/<area>/${r}-service.js — restApi.post(\"/api/${r}\", params)" >&2
      done <<< "$RESOURCES"
      echo "    참조: rules/30-data-access.md §1" >&2
    fi
  fi
fi

exit 0

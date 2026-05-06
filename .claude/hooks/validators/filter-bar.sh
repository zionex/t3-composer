# T3 Validator — FilterBar JSON schema (FB1~FB15 · rules/22-filter-bar.md)

# =====================================================================
# 4.5. FilterBar JSON 검증
# =====================================================================
if [[ "$FILE_PATH" == *filter*.json ]] || [[ "$FILE_PATH" == *Filter*.json ]]; then

  SCHEMA_PATH="$PROJECT_ROOT/.claude/schemas/filter-bar.schema.json"

  if [ -f "$SCHEMA_PATH" ] && [ -n "$CONTENT" ]; then

    # block_type: FILTER_BAR 인 JSON 인지 빠르게 확인
    IS_FILTER_BAR=$(echo "$CONTENT" | grep -c '"block_type"[[:space:]]*:[[:space:]]*"FILTER_BAR"' || echo 0)

    if [ "$IS_FILTER_BAR" -gt 0 ]; then

      # Python + jsonschema 로 검증 (설치되어 있을 때만)
      if command -v python3 >/dev/null 2>&1; then
        if python3 -c "import jsonschema" 2>/dev/null; then

          VALIDATION_RESULT=$(python3 <<PYEOF 2>&1
import json, sys
from jsonschema import Draft202012Validator

try:
    with open("$SCHEMA_PATH") as f:
        schema = json.load(f)
    data = json.loads('''$CONTENT''')

    errors = list(Draft202012Validator(schema).iter_errors(data))
    if errors:
        print("INVALID")
        for e in errors[:5]:
            path = " > ".join(str(p) for p in e.absolute_path) or "(root)"
            print(f"  [{path}] {e.message[:120]}")
        sys.exit(1)
    else:
        print("VALID")
        sys.exit(0)
except json.JSONDecodeError as e:
    print(f"JSON_PARSE_ERROR: {e}")
    sys.exit(2)
except Exception as e:
    print(f"VALIDATION_ERROR: {e}")
    sys.exit(3)
PYEOF
          )

          if echo "$VALIDATION_RESULT" | head -1 | grep -q "INVALID"; then
            block "FilterBar JSON 이 스키마를 위반합니다" "rules/22-filter-bar.md"
            echo "$VALIDATION_RESULT" | tail -n +2 >&2
            exit 2
          elif echo "$VALIDATION_RESULT" | head -1 | grep -q "JSON_PARSE_ERROR\|VALIDATION_ERROR"; then
            warn "FilterBar JSON 검증 중 오류: $VALIDATION_RESULT"
          else
            echo "✅ [pre-validator] FilterBar JSON 스키마 통과: $(basename "$FILE_PATH")"
          fi
        else
          # jsonschema 미설치 — 정적 체크만 수행
          # block_id 규약 체크
          if echo "$CONTENT" | grep -qE '"block_id"[[:space:]]*:[[:space:]]*"[^a-z]'; then
            warn "block_id 는 소문자로 시작해야 합니다 (snake_case). rules/22-filter-bar.md §1.3"
          fi
          # field_id 규약 체크 (기본만)
          if echo "$CONTENT" | grep -qE '"field_id"[[:space:]]*:[[:space:]]*"[a-z]'; then
            warn "field_id 는 대문자로 시작해야 합니다 (UPPER_SNAKE_CASE). rules/22-filter-bar.md §1.3"
          fi
        fi
      fi
    fi
  fi
fi


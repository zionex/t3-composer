# PlanNEL Validator — Common helpers (block / warn)
# Sourced by pre-tool-use-validator.sh

block() {
  echo "❌ [PlanNEL Rule Violation] $1" >&2
  echo "   File: $FILE_PATH" >&2
  [ -n "${2:-}" ] && echo "   규칙: $2" >&2
  exit 2
}

warn() {
  echo "⚠️  [PlanNEL Rule Warning] $1" >&2
  echo "   File: $FILE_PATH" >&2
  [ -n "${2:-}" ] && echo "   규칙: $2" >&2
}

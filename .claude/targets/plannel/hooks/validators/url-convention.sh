# PlanNEL Validator — URL 컨벤션
# Sourced by pre-tool-use-validator.sh
#
# 차단:
#   1. @RequestMapping("/composer/...") / "/util/..." (T3Series wingui 패턴)
#   2. @RequestMapping("/api/customer") (단수형) — /api/customers 권장
#   3. restApi.get("/composer/...") / "/util/..." literal
#
# 참조: rules/30-data-access.md §1.2 · rules/99-anti-patterns.md W19, W20

case "$FILE_PATH" in
  *.java|*.jsx|*.js|*.ts|*.tsx) ;;
  *) return 0 ;;
esac
[ -z "$CONTENT" ] && return 0

# ─── 1. Java @RequestMapping ────────────────────────────────────────
if [[ "$FILE_PATH" == *.java ]]; then
  # /composer/ 차단 (wingui 컨벤션)
  if grep -qE '@RequestMapping\(\s*(value\s*=\s*)?"/composer(/|")' <<<"$CONTENT"; then
    block "@RequestMapping URL prefix '/composer/...' 사용 금지 — PlanNEL 은 '/api/<plural-resource>' 사용." \
          "rules/30-data-access.md §1.2 · rules/99-anti-patterns.md W19"
  fi
  # /util/ 차단 (wingui 컨벤션)
  if grep -qE '@RequestMapping\(\s*(value\s*=\s*)?"/util(/|")' <<<"$CONTENT"; then
    block "@RequestMapping URL prefix '/util/...' 사용 금지 — PlanNEL 은 '/api/<plural-resource>' 사용." \
          "rules/30-data-access.md §1.2 · rules/99-anti-patterns.md W19"
  fi
  # 클래스 레벨에 /api/customer (단수형) — /api 만 권장
  if grep -qE '@RequestMapping\(\s*(value\s*=\s*)?"/api/[a-z]+(\s*\)|\s*,)' <<<"$CONTENT"; then
    # 클래스 레벨 @RequestMapping("/api") + 메서드 레벨 @PostMapping("/customers") 패턴 권장
    warn "클래스 레벨 @RequestMapping 에 resource path 포함 — PlanNEL 표준은 클래스에 '/api' 만, 메서드별 @PostMapping(\"/customers\") 권장." \
         "rules/30-data-access.md §3.1"
  fi
fi

# ─── 2. JSX/JS restApi 호출 URL literal ─────────────────────────────
case "$FILE_PATH" in
  *.jsx|*.js|*.ts|*.tsx)
    # restApi.get/post/delete/... 의 첫 인자가 /composer/ 또는 /util/ 시작
    if grep -qE "restApi[A-Z]?\.(get|post|put|delete|patch)\s*\(\s*['\"]/(composer|util)/" <<<"$CONTENT"; then
      block "restApi 호출 URL '/composer/...' 또는 '/util/...' 사용 금지 — PlanNEL 은 '/api/<plural-resource>' 사용." \
            "rules/30-data-access.md §1.2"
    fi
    # axios 직접 호출 (다른 hook 에서 axios import 자체 차단하지만 이중 안전망)
    if grep -qE "axios\.(get|post|put|delete|patch)\s*\(\s*['\"]/(composer|util)/" <<<"$CONTENT"; then
      block "axios 호출 URL '/composer/...' 또는 '/util/...' 사용 금지 — PlanNEL 은 '/api/<plural-resource>'." \
            "rules/30-data-access.md §1.2"
    fi

    # /api/ 단수형 (한 단어) — kebab-case 복수형 권장
    # /api/customer (X) → /api/customers (O)
    # /api/items / /api/new-items / /api/work-centers 정상
    # 단순 휴리스틱: /api/<word>(/|"|') 인데 word 가 's' 로 끝나지 않고 모음+자음 끝 + 대시 없음
    # → false positive 가 너무 많아 warn 도 생략. 사용자가 99-anti-patterns 보고 자체 점검.
    :
    ;;
esac

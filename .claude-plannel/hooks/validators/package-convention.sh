# PlanNEL Validator — Java 패키지 컨벤션
# Sourced by pre-tool-use-validator.sh
#
# 차단 대상:
#   1. com.zionex.t3series.* 패키지 선언 (T3Series wingui 컨벤션)
#   2. com.zionex.t3series.* import (PlanNEL 은 t3series.saas.*)
#   3. wingui audit BaseEntity (com.zionex.t3series.web.util.audit.BaseEntity) 사용
#
# 참조: rules/10-overview.md §3.2 · rules/99-anti-patterns.md W17

[[ "$FILE_PATH" != *.java ]] && return 0
[ -z "$CONTENT" ] && return 0

# ─── 1. package 선언 차단 ─────────────────────────────────────────
if grep -qE '^\s*package\s+com\.zionex\.t3series' <<<"$CONTENT"; then
  block "Java package 'com.zionex.t3series.*' 사용 금지 — PlanNEL 은 't3series.saas.*' 패키지 사용. (T3Series wingui 와 별개 코드베이스)" \
        "rules/10-overview.md §3.2 · rules/99-anti-patterns.md W16, W17"
fi

# ─── 2. import 차단 ───────────────────────────────────────────────
if grep -qE '^\s*import\s+com\.zionex\.t3series' <<<"$CONTENT"; then
  block "Java import 'com.zionex.t3series.*' 사용 금지 — PlanNEL 클래스는 't3series.saas.*' 에 위치. (T3Series wingui 의 BaseEntity / ResponseMessage 등은 PlanNEL 에 존재하지 않음)" \
        "rules/10-overview.md §3.2 · rules/99-anti-patterns.md W17"
fi

# ─── 3. 잘못된 BaseEntity 경로 ─────────────────────────────────────
# wingui 의 com.zionex.t3series.web.util.audit.BaseEntity → PlanNEL 의 t3series.saas.multi_tenancy.model.BaseEntity
if grep -qE 'web\.util\.audit\.BaseEntity' <<<"$CONTENT"; then
  block "BaseEntity 경로 오류 — PlanNEL 의 BaseEntity 는 't3series.saas.multi_tenancy.model.BaseEntity' 입니다." \
        "rules/30-data-access.md §4.2 · rules/99-anti-patterns.md W17"
fi

# ─── 4. PlanNEL 패키지 자체 검증 (생성된 파일이 t3series.saas.* 안인지) ─
# saas-application 안의 .java 파일이 다른 root package 에 있으면 경고
if [[ "$FILE_PATH" == *saas-application/src/main/java/* ]]; then
  if grep -qE '^\s*package\s+' <<<"$CONTENT"; then
    if ! grep -qE '^\s*package\s+t3series\.saas' <<<"$CONTENT"; then
      warn "saas-application 의 Java 파일은 't3series.saas.*' 패키지여야 합니다. 다른 root package 사용 중." \
           "rules/10-overview.md §3.2"
    fi
  fi
fi

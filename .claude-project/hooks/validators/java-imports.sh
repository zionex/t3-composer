# KTNG Validator — Java import 화이트리스트
# Spring Boot 3.x 사용 → jakarta.* 강제, javax.* 차단
# 차단 조건 (JI1~JI3)

case "$FILE_PATH" in
  *.java) ;;
  *) return 0 ;;
esac

[ -z "$CONTENT" ] && return 0

# ─── JI1. javax.persistence.* 차단 ────────────────────────────────────
if echo "$CONTENT" | grep -qE '^import\s+javax\.persistence\.'; then
  block "javax.persistence.* 금지 (Spring Boot 3.x). jakarta.persistence.* 사용" "JI1"
fi

# ─── JI2. javax.servlet.* 차단 ────────────────────────────────────────
if echo "$CONTENT" | grep -qE '^import\s+javax\.servlet\.'; then
  block "javax.servlet.* 금지 (Spring Boot 3.x). jakarta.servlet.* 사용" "JI2"
fi

# ─── JI3. javax.validation.* / javax.annotation.* / javax.transaction.* ──
if echo "$CONTENT" | grep -qE '^import\s+javax\.(validation|annotation|transaction)\.'; then
  block "javax.validation/annotation/transaction.* 금지 (Spring Boot 3.x). jakarta.* 또는 org.springframework.transaction.annotation.Transactional 사용" "JI3"
fi

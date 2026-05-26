# KTNG Validator — Java 기본 (System.out · @Autowired 필드주입 등)
# 차단/경고 조건 (JB1~JB5)

case "$FILE_PATH" in
  *.java) ;;
  *) return 0 ;;
esac

[ -z "$CONTENT" ] && return 0

# ─── JB1. System.out.println 차단 ─────────────────────────────────────
if echo "$CONTENT" | grep -qE '\bSystem\.out\.println\s*\('; then
  block "System.out.println 금지 — SLF4J 로거 사용 (private static final Logger log = ...)" "JB1"
fi

# ─── JB2. @Autowired 필드 주입 경고 ───────────────────────────────────
# KTNG 코드는 @Autowired 필드 주입을 종종 사용하나 (BfKtng01Controller), 신규 작성은 생성자 주입 권장.
# 차단은 안 함 (기존 패턴 유지).
if echo "$CONTENT" | grep -qE '@Autowired\s+(private|protected|public)?\s*\w+\s+\w+\s*;'; then
  warn "@Autowired 필드 주입 — 신규 작성은 @AllArgsConstructor + private final 생성자 주입 권장 (JB2)"
fi

# ─── JB3. ResponseMessage.builder() — 존재 안 함 ─────────────────────
if echo "$CONTENT" | grep -qE 'ResponseMessage\s*\.\s*builder\s*\('; then
  block "ResponseMessage 는 Lombok @Builder 없음 — ok()/ok(msg)/error(msg) 정적 팩토리 사용" "JB3"
fi

# ─── JB4. @Value default 누락 — placeholder 미해결 위험 ──────────────
# @Value("${app.x.y}") 에 default 없으면 YAML 의 빈 값 (`x.y:`) 에서 startup 실패.
# 단, 자동 키 (server.port 등) 는 예외.
if echo "$CONTENT" | grep -qE '@Value\(\s*"\$\{[a-zA-Z][a-zA-Z0-9._-]*\}"\s*\)'; then
  warn "@Value placeholder 에 default 누락 — \"\${app.x.y:}\" 형식 권장 (JB4)"
fi

# ─── JB5. 평문 비밀번호 하드코딩 의심 ───────────────────────────────
if echo "$CONTENT" | grep -qiE 'password\s*=\s*["'"'"'](?!\s*\$\{|placeholder)[^"'"'"'$]{3,}'; then
  warn "평문 password 하드코딩 가능성 — 환경변수 / Jasypt 권장 (JB5)"
fi

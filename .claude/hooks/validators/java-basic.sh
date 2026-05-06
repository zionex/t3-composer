# T3 Validator — Java basic (J2/J5/SE1)

# =====================================================================
# 3. Java 파일 검증
# =====================================================================
if [[ "$FILE_PATH" == *.java ]]; then

  if [ -n "$CONTENT" ]; then
    # J2. System.out.println 금지
    if grep -qE "System\.out\.println|System\.err\.println" <<<"$CONTENT"; then
      block "System.out.println 금지 — SLF4J Logger 사용" "rules/99-anti-patterns.md J2"
    fi

    # J5. @Autowired 필드 주입 경고 (생성자 주입 권장)
    if grep -qE "^[[:space:]]*@Autowired" <<<"$CONTENT"; then
      if ! grep -qE "@RequiredArgsConstructor|private final" <<<"$CONTENT"; then
        warn "@Autowired 필드 주입보다 @RequiredArgsConstructor + private final 권장 (rules/99-anti-patterns.md J5)"
      fi
    fi

    # SE1. application.yaml 평문 암호
    if [[ "$FILE_PATH" == *.yaml ]] || [[ "$FILE_PATH" == *.yml ]] || [[ "$FILE_PATH" == *.properties ]]; then
      if grep -qE "^[[:space:]]*password:[[:space:]]*[^$E]" <<<"$CONTENT" && ! grep -q "ENC(" <<<"$CONTENT"; then
        warn "평문 비밀번호 감지. Jasypt ENC() 암호화 필수 (rules/99-anti-patterns.md SE1)"
      fi
    fi
  fi
fi


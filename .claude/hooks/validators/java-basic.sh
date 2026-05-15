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

    # J8. ResponseMessage.builder() — Lombok @Builder 없음. 컴파일 실패 → 전체 startup down → 모든 endpoint 500
    if grep -qE "ResponseMessage\s*\.\s*builder\s*\(" <<<"$CONTENT"; then
      block "ResponseMessage.builder() 금지 — @Builder 미정의. ok()/ok(msg)/error(msg)/ofSuccess()/ofFail(msg) 정적 팩토리 사용 (rules/99-anti-patterns.md J8, 99a §J CG-J3)"
    fi

    # CG-J1. 산출물 Service 의 JdbcTemplate 인젝션에 qualifier 누락 (단독 환경 호환)
    if grep -qE "^\s*(private|public|protected)?\s*(final\s+)?JdbcTemplate\s+[a-zA-Z_]" <<<"$CONTENT"; then
      if ! grep -qE "@Qualifier\s*\(\s*\"(targetJdbcTemplate|composerJdbcTemplate)\"" <<<"$CONTENT"; then
        if [[ "$FILE_PATH" == */preview/* ]]; then
          block "JdbcTemplate 필드에 @Qualifier(\"targetJdbcTemplate\") 누락 — 단독 환경에서 PG/MSSQL 어느 쪽 wire 할지 불확정 (rules/41b §5.6.4, 99a §J CG-J1)"
        else
          warn "JdbcTemplate 필드에 @Qualifier(\"targetJdbcTemplate\") 권장 — 단독 환경 호환 (rules/41b §5.6.4, 99a §J CG-J1)"
        fi
      fi
    fi

    # J9. 사용자 정의 @Value("${app.x.y}") 에 default 누락 — Spring Boot 3.x PropertyPlaceholderHelper
    #     가 YAML 빈 값을 placeholder 미해결로 처리 → startup 실패 → 모든 endpoint 500
    #     자동 키 (server.*, spring.*, logging.*) 는 framework 가 default 제공해 예외
    if grep -nE '@Value\s*\(\s*"\$\{[^:}]+\}"' <<<"$CONTENT" | \
       grep -vE '\$\{(server|spring|logging|management|sentry|info)\.' >/dev/null 2>&1; then
      warn "@Value 에 default 누락 감지 — '\${app.x.y:}' 형식으로 빈 문자열 default 추가. 누락 시 startup 실패 (rules/99-anti-patterns.md J9)"
    fi
  fi
fi

# =====================================================================
# 4. 설정 파일 평문 암호 (SE1) — .java 블록 밖으로 분리 (이전 nested 버그 수정)
# =====================================================================
if [[ "$FILE_PATH" == *.yaml ]] || [[ "$FILE_PATH" == *.yml ]] || [[ "$FILE_PATH" == *.properties ]]; then
  if [ -n "$CONTENT" ]; then
    # password: 'xxxx' 형태 + ENC(...) 미사용 시 경고
    if grep -qE "^[[:space:]]*password:[[:space:]]*['\"]?[^'\"$\{[:space:]]" <<<"$CONTENT" && ! grep -q "ENC(" <<<"$CONTENT"; then
      warn "평문 비밀번호 감지. Jasypt ENC() 암호화 권장 (rules/99-anti-patterns.md SE1)"
    fi
  fi
fi


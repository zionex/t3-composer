# Common Validator — Java imports (Spring Boot 3.x 공용)
# T3SERIES 의 wingui 패키지 환각 차단은 targets/t3series/hooks/validators/java-wingui-imports.sh 로 분리.
# rules/41b-composer-java.md §5.5~§5.5.1

# =====================================================================
# Spring Boot 3.x 공용 Java import 검증
# =====================================================================

if [[ "$FILE_PATH" == *.java ]] && [ -n "$CONTENT" ]; then
  # (a) javax.persistence / servlet / validation / annotation / transaction 금지
  #     Spring Boot 3.x 는 jakarta.* 만 인식 → javax.* 사용 시 컴파일 실패
  if grep -qE "^[[:space:]]*import[[:space:]]+javax\.(persistence|servlet|validation|annotation|transaction)\." <<<"$CONTENT"; then
    OFFENDING_PKG="$(grep -oE "javax\.(persistence|servlet|validation|annotation|transaction)" <<<"$CONTENT" | head -1)"
    block "Java import 금지: ${OFFENDING_PKG}.* → Spring Boot 3.x 는 jakarta.* 로 전환됨. ${FILE_PATH} 의 해당 import 를 jakarta.${OFFENDING_PKG#javax.}.* 로 교체하세요. (rules/41b-composer-java.md §5.5~§5.5.1)"
  fi

  # (b) @Value("${user.defined.key}") default 누락 — Spring Boot 3.x 에서 yaml 의 빈 값 placeholder 미해결 처리
  # YAML 의 `key:` (값 없이 콜론) 는 Spring 6.x 의 PropertyPlaceholderHelper 가 IllegalArgumentException 발생.
  # → 전체 startup 실패 → 모든 endpoint 500.
  # 자동 설정 키 (server.port / spring.* / management.*) 는 default 불필요하므로 제외.
  while IFS= read -r line; do
    KEY="$(echo "$line" | grep -oE '@Value\("\$\{[^:}]+\}"' | sed -E 's/.*\$\{([^}]+)\}.*/\1/')"
    [ -z "$KEY" ] && continue
    case "$KEY" in
      server.port|server.address|management.*|spring.*|logging.*|info.*) ;;
      *)
        block "@Value(\"\${${KEY}}\") 에 default 값 누락 — Spring Boot 3.x 는 yaml 의 빈 값 (\`${KEY}:\`) 을 placeholder 미해결로 처리하여 startup IllegalArgumentException 발생 → 전체 기동 실패. \`@Value(\"\${${KEY}:}\")\` 처럼 default 빈 문자열 추가." \
              "rules/99-anti-patterns.md J9"
        ;;
    esac
  done < <(grep -E '@Value\("\$\{[^:}]+\}"' <<<"$CONTENT")
fi

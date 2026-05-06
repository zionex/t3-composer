# T3 Validator — pom.xml + secrets (T1, J1, SE2)

# =====================================================================
# 4. pom.xml 검증 (의존성 추가 시)
# =====================================================================
if [[ "$(basename "$FILE_PATH")" == "pom.xml" ]] && [ -n "$CONTENT" ]; then

  # T1. Java 17 외 버전
  if grep -qE "<java\.version>|<maven\.compiler\.source>" <<<"$CONTENT"; then
    if ! grep -qE "<(java\.version|maven\.compiler\.source|maven\.compiler\.target)>17</" <<<"$CONTENT"; then
      warn "Java 17 이외 버전 감지. 전 모듈 Java 17 고정 (rules/99-anti-patterns.md T1)"
    fi
  fi

  # J1. 버전 직접 명시 (BOM 우회)
  # <dependency> 블록 내에 <version> 이 있으면 경고 (BOM 관리가 원칙)
  if grep -A 3 "<dependency>" <<<"$CONTENT" | grep -q "<version>"; then
    warn "의존성에 <version> 직접 명시 감지. 루트 pom.xml 의 <dependencyManagement> 경유 권장 (rules/99-anti-patterns.md J1)"
  fi
fi


# =====================================================================
# 5. 환경 변수 · 시크릿 파일 접근 차단
# =====================================================================
case "$(basename "$FILE_PATH")" in
  .env|.env.*|application-prod.yaml|application-prod.yml)
    block "시크릿/프로덕션 설정 파일 수정 금지" "rules/99-anti-patterns.md SE1/SE2, .claude/settings.json permissions.deny"
    ;;
esac


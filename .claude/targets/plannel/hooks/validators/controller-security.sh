# PlanNEL Validator — Controller Security
# Sourced by pre-tool-use-validator.sh
#
# 검증:
#   1. @PreAuthorize 안 role 이름이 'ROLE_*' prefix 포함하면 차단 (Spring 자동 부착)
#   2. @RestController 인데 @PreAuthorize 누락 → warn (보안 위험)
#   3. permitAll() 화이트리스트에 비즈니스 endpoint 추가 차단
#   4. 응답 DTO 에 password 필드 노출 warn
#   5. log 에 token / password 출력 warn
#
# 참조: rules/32-security.md · rules/99-anti-patterns.md BE3, BE4

[[ "$FILE_PATH" != *.java ]] && return 0
[ -z "$CONTENT" ] && return 0

# ─── 1. @PreAuthorize 안 role 이 ROLE_ prefix 포함 차단 ────────────
# hasRole('ROLE_ADMIN') / hasAnyRole('ROLE_APP_DP', 'ROLE_APP_IP') 형태
if grep -qE "hasRole\s*\(\s*['\"]ROLE_" <<<"$CONTENT"; then
  block "@PreAuthorize 의 hasRole('ROLE_*') — 'ROLE_' prefix 제거하세요. Spring Security 가 자동 부착. 예: hasRole('ADMIN')." \
        "rules/32-security.md §5.3 · rules/99-anti-patterns.md BE4"
fi
if grep -qE "hasAnyRole\s*\(\s*['\"]ROLE_" <<<"$CONTENT"; then
  block "@PreAuthorize 의 hasAnyRole('ROLE_*') — 'ROLE_' prefix 제거하세요. 예: hasAnyRole('APP_DP', 'APP_IP')." \
        "rules/32-security.md §5.3 · rules/99-anti-patterns.md BE4"
fi

# ─── 2. @RestController 인데 @PreAuthorize 누락 warn ───────────────
if grep -qE '@RestController\b' <<<"$CONTENT"; then
  # 클래스 레벨이든 메서드 레벨이든 어딘가에 @PreAuthorize 가 있어야
  if ! grep -qE '@PreAuthorize' <<<"$CONTENT"; then
    # 예외: AuthController / SsoController / HealthController 등 시스템성
    case "$FILE_PATH" in
      *AuthController.java|*SignInController.java|*SsoController.java|*HealthController.java|*ActuatorController.java|*PingController.java) ;;
      *)
        warn "@RestController 에 @PreAuthorize 누락 — 인증된 모든 사용자가 접근 가능 (보안 위험). 모듈 role (예: hasAnyRole('APP_DP', 'APP_IP', 'APP_RP', 'APP_MP')) 또는 'ADMIN' 명시." \
             "rules/32-security.md §5.2 · rules/99-anti-patterns.md BE3"
        ;;
    esac
  fi
fi

# ─── 3. WebSecurityConfig 의 permitAll() 화이트리스트에 비즈니스 endpoint 차단 ─
if [[ "$FILE_PATH" == *WebSecurityConfig.java ]] || [[ "$FILE_PATH" == *SecurityConfig.java ]]; then
  # accessAllUrl 또는 antMatchers(...).permitAll() 안에 /api/customers 같은 비즈니스 path
  if grep -qE '"/api/(customers|items|locations|suppliers|workcenter|new-items|companies|orders|invoices)' <<<"$CONTENT"; then
    block "WebSecurityConfig 의 화이트리스트에 비즈니스 endpoint (/api/customers, /api/items 등) 추가 금지 — '/api/auth/**', '/swagger-ui/**', '/sso/**', '/actuator/**' 등 시스템 only." \
          "rules/32-security.md §2 · rules/99-anti-patterns.md MT5"
  fi
fi

# ─── 4. DTO 에 password / accessToken 필드 노출 warn ───────────────
if grep -qE '^\s*private\s+String\s+(password|accessToken|jwtToken|refreshToken)\s*;' <<<"$CONTENT"; then
  # 단, AuthResponseDto / SignInResponseDto 같은 인증 전용 DTO 는 예외
  case "$FILE_PATH" in
    *AuthResponseDto.java|*SignInResponseDto.java|*JwtResponse*.java|*LoginResponseDto.java|*UserCredentialDto.java) ;;
    *)
      warn "DTO 에 password / accessToken / jwtToken 필드 노출 — 인증 응답 DTO 가 아니라면 @JsonIgnore 또는 별도 DTO 권장." \
           "rules/32-security.md §11 · rules/99-anti-patterns.md BE16"
      ;;
  esac
fi

# ─── 5. log 에 password / token 출력 차단 ─────────────────────────
# log.info/error/warn/debug 안에 password / token 변수 사용
if grep -qE 'log\.(info|error|warn|debug)\s*\([^)]*\b(password|jwtToken|accessToken|refreshToken)\b' <<<"$CONTENT"; then
  block "로그에 password / token 변수 출력 금지 — 보안 위험. 비밀번호/토큰 값은 절대 로그에 남기지 마세요." \
        "rules/32-security.md §11 · rules/99-anti-patterns.md BE17"
fi

# ─── 6. JWT secret 하드코딩 차단 ──────────────────────────────────
# String jwtSecret = "..." 패턴 (단, @Value 어노테이션 있으면 OK)
if grep -qE '(jwtSecret|jwt_secret|JWT_SECRET)\s*=\s*"[a-zA-Z0-9_+/=-]{16,}"' <<<"$CONTENT"; then
  if ! grep -qE '@Value\s*\([^)]*jwt' <<<"$CONTENT"; then
    block "JWT secret 하드코딩 금지 — application.yml 의 'app.security.jwt-secretkey' + @Value 또는 환경변수 사용." \
          "rules/32-security.md §10 · rules/99-anti-patterns.md MT6"
  fi
fi

# 32. Security — JWT 인증 + @PreAuthorize 권한 (PlanNEL)

> JWT (jjwt 0.9.1, HS512) 기반 stateless 인증. 모든 `/api/**` endpoint 가 `@PreAuthorize("hasAnyRole(...)")` 로 모듈/사용자 권한 체크. **인증 없는 endpoint 노출 = 보안 사고**.

## 1. 핵심 컴포넌트

| 파일 | 위치 | 역할 |
|---|---|---|
| `WebSecurityConfig` | `t3series.saas.security.WebSecurityConfig` | Spring Security 메인 설정 (filter chain, CORS, CSRF, session policy) |
| `JwtUtils` | `t3series.saas.security.jwt.JwtUtils` | JWT 발급 / 파싱 / 검증 |
| `AuthTokenFilter` | `t3series.saas.security.jwt.AuthTokenFilter` | 모든 요청 진입 시 JWT 추출 → SecurityContext 주입 |
| `AuthEntryPointJwt` | `t3series.saas.security.jwt.AuthEntryPointJwt` | 인증 실패 시 401 응답 |
| `UserDetailsServiceImpl` | `t3series.saas.security.UserDetailsServiceImpl` | DB 의 user → Spring Security UserDetails 변환 (role 포함) |
| `accessLogFilter` | `t3series.saas.security.filter.AccessLogFilter` | 요청 로깅 (사용자 + URL + status) |

## 2. WebSecurityConfig

```java
package t3series.saas.security;

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)                       // ★ @PreAuthorize 활성화
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired UserDetailsServiceImpl userDetailsService;
    @Autowired private AuthEntryPointJwt unauthorizedHandler;

    private final String[] accessAllUrl = {
        "/", "/home",
        "/api/auth/**",                                                  // 로그인/회원가입
        "/static/**",
        "/swagger-ui/**", "/api-docs", "/api-docs/**",
        "/sso/**",
        "/actuator/**"
    };

    @Bean public AuthTokenFilter authenticationJwtFilter() {
        return new AuthTokenFilter();
    }

    @Bean public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Override
    public void configure(AuthenticationManagerBuilder auth) {
        auth.userDetailsService(userDetailsService).passwordEncoder(passwordEncoder());
    }

    @Override
    protected void configure(HttpSecurity http) {
        http.cors().and()
            .csrf().disable()                                             // REST API
            .exceptionHandling().authenticationEntryPoint(unauthorizedHandler).and()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS).and()
            .authorizeRequests()
            .antMatchers(accessAllUrl).permitAll()
            .anyRequest().authenticated();

        http.addFilterBefore(authenticationJwtFilter(),
                             UsernamePasswordAuthenticationFilter.class);
        http.addFilterAfter(accessLogFilter(),
                            BasicAuthenticationFilter.class);
    }
}
```

핵심:
- `STATELESS` session — JWT 만 유효, 서버 세션 미저장
- `csrf().disable()` — REST API
- `cors().and()` — `AppConfig.addCorsMappings()` 가 정의 (`http://localhost:8081` 허용 등)
- `BCryptPasswordEncoder` — 비밀번호 단방향 해시
- `permitAll()` 화이트리스트: `/`, `/home`, `/api/auth/**`, `/swagger-ui/**`, `/sso/**`, `/actuator/**`

## 3. JwtUtils — 발급 / 파싱

```java
@Slf4j
@Component
public class JwtUtils {

    @Value("${app.security.jwt-secretkey}")
    private String jwtSecretKey;

    @Value("${app.security.jwt-expiration-ms}")
    private int jwtExpirationMs;

    @Autowired UserQueryRepository userQueryRepository;
    @Autowired CompanyQueryRepository companyQueryRepository;

    private String base64SecretKey;

    @PostConstruct
    public void init() {
        base64SecretKey = Base64.getEncoder().encodeToString(jwtSecretKey.getBytes());
    }

    public String generateJwt(String username) {
        User user = userQueryRepository.findByUsername(username).orElseThrow();

        long jwtExpirationTime = jwtExpirationMs;
        Company company = companyQueryRepository.findCompany();
        if (company != null && company.getJwtExpireSec() != null) {
            jwtExpirationTime = Duration.ofSeconds(company.getJwtExpireSec()).toMillis();
        }
        if (user.getJwtExpireSec() != null && user.getJwtExpireSec() != 0) {
            jwtExpirationTime = Duration.ofSeconds(user.getJwtExpireSec()).toMillis();
        }

        return Jwts.builder()
            .setSubject(username)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationTime))
            .signWith(SignatureAlgorithm.HS512, base64SecretKey)
            .compact();
    }

    public String getUserNameFromJwt(String token) {
        return Jwts.parser()
            .setSigningKey(base64SecretKey)
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
    }

    public boolean validateJwtToken(String token) {
        try {
            Jwts.parser().setSigningKey(base64SecretKey).parseClaimsJws(token);
            return true;
        } catch (SignatureException | MalformedJwtException | ExpiredJwtException
                | UnsupportedJwtException | IllegalArgumentException e) {
            log.error("JWT validation error: {}", e.getMessage());
            return false;
        }
    }
}
```

특징:
- HS512 알고리즘 (HMAC + SHA-512)
- 만료 시간 우선순위: **사용자 설정 > 회사 설정 > application.yml 기본값** (`jwt-expiration-ms`)
- `jjwt 0.9.1` API (★ jjwt 0.11+ 의 `Jwts.parserBuilder()` 가 아님 — legacy API)
- secret key 는 application.yml 의 `app.security.jwt-secretkey` 환경변수로 관리

## 4. application.yml 보안 설정

```yaml
app:
  security:
    jwt-secretkey: ${JWT_SECRET_KEY:plannel-secret-default-change-me}
    jwt-expiration-ms: 3600000                       # 1시간 (기본값)
```

★ Production 배포 시 `JWT_SECRET_KEY` 환경변수 필수. 기본값 그대로 노출 금지.

## 5. 권한 체계

### 5.1 Role 종류

#### 5.1.1 모듈 권한 (`APP_*`)

해당 모듈의 라이선스/구독 보유 여부:

| Role | 의미 |
|---|---|
| `APP_DP` | Demand Plan |
| `APP_IP` | Inventory Plan |
| `APP_RP` | Replenishment Plan |
| `APP_MP` | Master Plan |
| `APP_BF` | Baseline Forecasting |

#### 5.1.2 사용자 역할 (`<MODULE>_MGR`, `<MODULE>_USER`, `ADMIN`, `GUEST`)

해당 모듈에서의 사용자 등급:

| Role | 의미 |
|---|---|
| `ADMIN` | 시스템 관리자 (전체 권한) |
| `DP_MGR` / `DP_USER` | DP 매니저 / 일반 사용자 |
| `IP_MGR` / `IP_USER` | IP |
| `RP_MGR` / `RP_USER` | RP |
| `MP_MGR` / `MP_USER` | MP |
| `BF_USER` | BF 분석 사용자 |
| `DI` | Data Integration (관리자 보조 — 데이터 import/export) |
| `GUEST` | 읽기 전용 |

### 5.2 @PreAuthorize 패턴

```java
// (1) 마스터 데이터 — 모든 모듈에서 접근 가능 (가장 흔한 패턴)
@PreAuthorize("hasAnyRole('APP_DP', 'APP_IP', 'APP_RP', 'APP_MP')")
@RestController @RequestMapping("/api")
public class CustomerController { ... }

// (2) 단일 모듈 전용
@PreAuthorize("hasAnyRole('APP_DP')")
public class DpVersionController { ... }

// (3) 관리자 전용 (메서드 레벨)
@PostMapping("/company")
@PreAuthorize("hasRole('ADMIN')")                                        // ★ 단수형 hasRole
public ResponseEntity<Void> updateCompany(...) { ... }

// (4) 관리자 또는 데이터 통합 담당
@PreAuthorize("hasAnyRole('ADMIN', 'DI')")
public class DataLoadController { ... }

// (5) 클래스 + 메서드 조합 — 메서드 가 더 엄격하면 메서드 우선
@PreAuthorize("hasAnyRole('APP_DP', 'APP_IP', 'APP_RP', 'APP_MP')")
@RestController @RequestMapping("/api")
public class ItemController {

    @PostMapping("/items")
    public ... getItems(...) { ... }                                     // 모든 모듈 OK

    @DeleteMapping("/items/{ids}")
    @PreAuthorize("hasAnyRole('ADMIN', 'IP_MGR', 'DP_MGR')")             // 관리자/매니저만
    public ... remove(...) { ... }
}
```

### 5.3 Role naming convention 주의

- `@PreAuthorize` 안의 role 은 **prefix 없이 작성** (`APP_DP`)
- 실제 DB 의 `user_role.role_name` 은 **`ROLE_APP_DP`** (Spring Security 가 prefix 자동 부착)
- TabMenuList.js 의 `appRoles` / `userRoles` 는 **`ROLE_` prefix 포함** (frontend 가 user.roles 와 직접 비교)

```java
// Backend: prefix 없이
@PreAuthorize("hasAnyRole('APP_DP', 'APP_IP')")

// DB: prefix 포함
INSERT INTO public.role (name) VALUES ('ROLE_APP_DP');

// Frontend (TabMenuList.js):
appRoles: ["ROLE_APP_DP", "ROLE_APP_IP"]
```

## 6. 로그인 / 토큰 흐름

```
1. POST /api/auth/signin { username, password }
   ↓
2. AuthController.authenticateUser()
   ├─ AuthenticationManager.authenticate(...)
   │   └─ UserDetailsServiceImpl.loadUserByUsername()
   │       └─ DB 의 user + role 조회 → UserDetails 생성
   ├─ jwtUtils.generateJwt(username) → JWT 생성
   └─ 응답:
      {
        "id": 12345,
        "username": "...",
        "type": "Bearer",
        "accessToken": "<JWT>",
        "tenantId": "tenant1",                       ← 멀티테넌트
        "roles": ["ROLE_ADMIN", "ROLE_APP_DP", ...]
      }
   ↓
3. Frontend localStorage 에 user 저장
   ↓
4. 후속 요청: Authorization: Bearer <JWT> + x-tenant-id: tenant1
   ↓
5. AuthTokenFilter:
   ├─ Authorization 헤더에서 JWT 추출
   ├─ jwtUtils.validateJwtToken(token)
   ├─ jwtUtils.getUserNameFromJwt(token) → username
   ├─ UserDetailsServiceImpl.loadUserByUsername(username) → UserDetails
   └─ SecurityContext 에 Authentication 주입
   ↓
6. @PreAuthorize 평가
   ↓
7. Controller 진입
```

## 7. 비밀번호 정책

- `BCryptPasswordEncoder` (단방향 해시, salt 포함)
- frontend `PasswordPolicyContainer` 가 강도 표시
- 비밀번호 변경 시 backend 가 동일한 BCrypt 인코딩 적용
- 비밀번호 만료 정책 (선택) — `user.password_expire_dt` 컬럼

## 8. SSO (Google OAuth)

`/sso/**` 경로는 SecurityConfig 의 화이트리스트:
- `frontend/src/components/GoogleSSOSignIn.js` — Google OAuth 버튼
- backend `t3series.saas.security.sso.*` — code → access token → 사용자 식별 → 자체 JWT 발급
- 신규 SSO 사용자는 자동 가입 또는 관리자 승인 (회사 정책에 따라)

## 9. 신규 화면 작성 시 보안 체크리스트

- [ ] Controller 클래스에 `@PreAuthorize` 명시?
- [ ] 메서드 레벨로 더 엄격한 권한이 필요한 곳 (예: 관리자 전용 삭제) 별도 `@PreAuthorize`?
- [ ] Role 작성에 `APP_` (모듈) 또는 `MODULE_USER/MGR` (사용자) 정확히 사용?
- [ ] `@PreAuthorize` 안의 role 은 **prefix 없이** (`APP_DP`)?
- [ ] DB 에 신규 role 등록이 필요하면 `ROLE_` prefix 포함?
- [ ] TabMenuList.js 의 `appRoles` / `userRoles` 는 `ROLE_` prefix 포함?
- [ ] 신규 endpoint 가 `permitAll()` 화이트리스트에 잘못 추가되지 않음?
- [ ] 비밀번호 / 토큰 등 민감 정보를 응답 DTO 에 절대 노출 안 함?
- [ ] 로그에 비밀번호 / JWT / 개인정보 출력 안 함?

## 10. AuthenticationFacade (현재 사용자 조회)

```java
@Component
public class AuthenticationFacade {
    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        UserDetails ud = (UserDetails) auth.getPrincipal();
        return userQueryRepository.findByUsername(ud.getUsername()).orElseThrow();
    }
}
```

Service 안에서 `createdBy` / `updatedBy` 채울 때 사용:
```java
@Service
@RequiredArgsConstructor
public class CustomerService {
    private final AuthenticationFacade auth;

    public void upsert(List<CustomerDto> rows) {
        long currentUserId = auth.getCurrentUser().getId();
        for (CustomerDto dto : rows) {
            Customer c = dto.toEntity();
            if (c.getId() == null) c.setCreatedBy(currentUserId);
            c.setUpdatedBy(currentUserId);
            repo.save(c);
        }
    }
}
```

(audit 필드는 `BaseEntity` 의 `@CreationTimestamp` / `@UpdateTimestamp` 가 timestamp 만 처리. user ID 는 Service 에서 명시 주입)

## 11. Anti-patterns

| ❌ | ✅ |
|---|---|
| 신규 controller 에 `@PreAuthorize` 누락 → 인증된 모든 사용자 접근 가능 | 항상 명시 (마스터: `hasAnyRole('APP_DP', 'APP_IP', 'APP_RP', 'APP_MP')`) |
| `@PreAuthorize("hasRole('ROLE_ADMIN')")` (prefix 포함) | `@PreAuthorize("hasRole('ADMIN')")` (prefix 없이) |
| `@PreAuthorize("hasAnyRole('admin')")` (소문자) | `@PreAuthorize("hasAnyRole('ADMIN')")` (대문자) |
| JWT secret 하드코딩 (`@Value` 없이 코드 안에) | `application.yml` 의 `app.security.jwt-secretkey` + 환경변수 |
| 비밀번호 평문 저장 | `BCryptPasswordEncoder.encode()` 항상 적용 |
| 로그에 JWT / 비밀번호 / 개인정보 출력 | log 에 절대 출력 안 함 (`log.info("user logged in")` 만, token 값 X) |
| `permitAll()` 화이트리스트에 비즈니스 endpoint 추가 | 화이트리스트는 `/api/auth/**`, `/swagger-ui/**` 등 시스템 only |
| 응답 DTO 에 `password` / `accessToken` 필드 노출 | DTO 에서 제외 또는 `@JsonIgnore` |
| 사용자 입력 그대로 SQL concat (SQL Injection) | JPA / QueryDSL / MyBatis prepared statement |
| Frontend 가 localStorage 의 token 만 검증하고 backend 호출 안 함 | `AuthVerify` HOC + 정기적 `/api/auth/refresh` 호출로 만료 검증 |
| 모든 사용자 role 을 frontend 에 노출 | 응답 `roles` 배열은 해당 사용자의 것만 |
| Cross-tenant 접근에 권한 체크 없음 (관리자 콘솔) | `saas-admin` endpoint 는 `@PreAuthorize("hasRole('ADMIN')")` + 추가 보안 검증 |

# T3 Validator — Java imports — jakarta.* enforcement (Spring Boot 3.x)
# rules/41b-composer-java.md §5.5~§5.5.1

# =====================================================================
# 6.6 Java import 검증 — Spring Boot 3.x 는 jakarta.* 사용 (rules/41 §5.5~5.6)
# =====================================================================
# LLM 이 구형 지식으로 `javax.*` / 허구 BaseEntity / 허구 SpecificationBuilder 등을
# import 해 서버 기동을 막는 사고를 차단. Java 파일 저장 직전에 검증.

if [[ "$FILE_PATH" == *.java ]] && [ -n "$CONTENT" ]; then
  # (a) javax.persistence / servlet / validation / annotation / transaction 금지
  if grep -qE "^[[:space:]]*import[[:space:]]+javax\.(persistence|servlet|validation|annotation|transaction)\." <<<"$CONTENT"; then
    OFFENDING_PKG="$(grep -oE "javax\.(persistence|servlet|validation|annotation|transaction)" <<<"$CONTENT" | head -1)"
    block "Java import 금지: ${OFFENDING_PKG}.* → Spring Boot 3.x 는 jakarta.* 로 전환됨. ${FILE_PATH} 의 해당 import 를 jakarta.${OFFENDING_PKG#javax.}.* 로 교체하세요. (rules/41b-composer-java.md §5.5~§5.5.1)"
  fi

  # (b) 허구 BaseEntity 경로
  if grep -qE "^[[:space:]]*import[[:space:]]+com\.zionex\.t3series\.web\.domain\.BaseEntity[[:space:]]*;" <<<"$CONTENT"; then
    block "Java import 금지: com.zionex.t3series.web.domain.BaseEntity 는 존재하지 않습니다. 실제 경로는 com.zionex.t3series.web.util.audit.BaseEntity 입니다. (rules/41 §5.5)"
  fi

  # (c) 허구 SpecificationBuilder / QueryDslBuilder 등
  if grep -qE "^[[:space:]]*import[[:space:]]+com\.zionex\.t3series\.web\.util\.query\.(SpecificationBuilder|QueryDslBuilder)[[:space:]]*;" <<<"$CONTENT"; then
    OFFENDING_CLASS="$(grep -oE "(SpecificationBuilder|QueryDslBuilder)" <<<"$CONTENT" | head -1)"
    block "Java import 금지: com.zionex.t3series.web.util.query.${OFFENDING_CLASS} 는 프로젝트에 존재하지 않습니다. Criteria API (cb.like / cb.equal) 로 직접 작성하세요. 참조 원본: web/domain/util/userinfo/UserInfoService.java (rules/41 §5.5 Service)"
  fi

  # (c2) ResponseMessage.builder() 패턴 차단 — 실제 API 는 of() / ok() / error() 정적 팩토리만
  # ResponseMessage 는 Lombok @Builder 가 없는 일반 클래스. .builder().message(...).build() 호출 시 컴파일 실패.
  if grep -qE "ResponseMessage\.builder\(\)" <<<"$CONTENT"; then
    block "ResponseMessage.builder() 메서드는 존재하지 않습니다 — 컴파일 실패로 wingui 전체가 기동 안 됩니다 (모든 endpoint 500). 실제 API: ResponseMessage.ok() / ResponseMessage.ok(String) / ResponseMessage.error(String) / ResponseMessage.of(HttpStatus[, String]). 정의: t3series-wingui/src/main/java/com/zionex/t3series/web/util/data/ResponseMessage.java" \
          "rules/41b-composer-java.md §5.6.3 Controller (ResponseMessage 정적 팩토리 사용)"
  fi

  # (c3) @Value("${user.defined.key}") default 누락 — Spring Boot 3.x 에서 yaml 의 빈 값 placeholder 미해결 처리
  # YAML 의 `key:` (값 없이 콜론) 는 Spring 6.x 의 PropertyPlaceholderHelper 가 IllegalArgumentException 발생.
  # → wingui 전체 기동 실패. 모든 endpoint 500.
  # 사용자 정의 prefix (app./server.servlet./screenmeta./engine./composer./insight./jasypt./jwt./kafka./scm.) 에 한정.
  # 자동 설정 키 (server.port / spring.* / management.*) 는 default 불필요하므로 제외.
  while IFS= read -r line; do
    # `@Value("${KEY}")` 에서 KEY 추출 (default `:` 없는 케이스만)
    KEY="$(echo "$line" | grep -oE '@Value\("\$\{[^:}]+\}"' | sed -E 's/.*\$\{([^}]+)\}.*/\1/')"
    [ -z "$KEY" ] && continue
    case "$KEY" in
      server.port|server.address|management.*|spring.*|logging.*|info.*) ;; # Spring 자동 키 — default 불필요
      *)
        block "@Value(\"\${${KEY}}\") 에 default 값 누락 — Spring Boot 3.x 는 yaml 의 빈 값 (\`${KEY}:\`) 을 placeholder 미해결로 처리하여 startup IllegalArgumentException 발생. wingui 전체 기동 실패 → 모든 endpoint 500. \`@Value(\"\${${KEY}:}\")\` 처럼 default 빈 문자열 추가 (이미 있는 코드의 if-empty fallback 과 호환)." \
              "ApplicationProperties.java Servlet class 사례 참조 (2026-04-29 사고)"
        ;;
    esac
  done < <(grep -E '@Value\("\$\{[^:}]+\}"' <<<"$CONTENT")

  # (d) Composer 신규 Controller 에서 MultipartHttpServletRequest — HttpServletRequest 로 통일 (warn)
  if [ "$IS_COMPOSER_ARTIFACT" = "1" ] \
      && [[ "$FILE_PATH" == *Controller.java ]] \
      && grep -qE "MultipartHttpServletRequest" <<<"$CONTENT"; then
    warn "MultipartHttpServletRequest 대신 HttpServletRequest + request.getParameter(ServiceConstants.PARAMETER_KEY_DATA) 패턴 사용 권장. (rules/41 §5.5 Controller)"
  fi

  # (e) JPA Entity 허구 컬럼 차단 — 기존 테이블 재사용 시 컬럼 구성이 원본 Entity 와 달라지면 런타임 에러
  # 대표적 재사용 테이블의 컬럼 화이트리스트:
  if grep -qE "@Table\(name\s*=\s*\"TB_UT_USER_INFO\"" <<<"$CONTENT"; then
    # TB_UT_USER_INFO 실제 컬럼 (원본 UserInfo.java 기준)
    while IFS= read -r col; do
      col="$(echo "$col" | tr -d ' \r')"
      [ -z "$col" ] && continue
      case "$col" in
        USER_ID|USER_NM|USER_EMAIL|USER_TEL|DEPT_CD|DEPT_NM|POSITION_CD|POSITION_NM|USER_TP|USE_YN|JOIN_DT|REMARK|CREATE_BY|CREATE_DTTM|MODIFY_BY|MODIFY_DTTM) ;;
        *)
          block "TB_UT_USER_INFO 에 존재하지 않는 컬럼 '${col}' 을 @Column 으로 선언했습니다. Hibernate 가 SELECT 시 'Invalid column name' 500 에러를 냅니다. 원본 Entity 는 web/domain/util/userinfo/UserInfo.java 입니다 — 통째로 복사하고 클래스명만 바꾸세요. (rules/41 §0 STEP 3 · rules/32-sql-schema-verification.md)" \
                "존재하지 않는 컬럼 = ${col}"
          ;;
      esac
    done < <(grep -oE "@Column\(name\s*=\s*\"[A-Z_0-9]+\"" <<<"$CONTENT" | sed -E 's/@Column\(name\s*=\s*"([A-Z_0-9]+)".*/\1/')
  fi
fi


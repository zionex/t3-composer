# T3SERIES Validator — wingui 패키지 import 환각 차단
# rules/41b-composer-java.md §5.5~§5.5.1
#
# LLM 산출물이 t3series-wingui 의 실제 패키지 구조와 다른 환각 import 를 만들어
# 컴파일 실패 → wingui 전체 startup down → 모든 endpoint 500 되는 사고 차단.

if [[ "$FILE_PATH" == *.java ]] && [ -n "$CONTENT" ]; then

  # (b) 허구 BaseEntity 경로 — 실제는 web.util.audit.BaseEntity
  if grep -qE "^[[:space:]]*import[[:space:]]+com\.zionex\.t3series\.web\.domain\.BaseEntity[[:space:]]*;" <<<"$CONTENT"; then
    block "Java import 금지: com.zionex.t3series.web.domain.BaseEntity 는 존재하지 않습니다. 실제 경로는 com.zionex.t3series.web.util.audit.BaseEntity 입니다. (rules/41b §5.5)"
  fi

  # (c) 허구 SpecificationBuilder / QueryDslBuilder — 프로젝트에 없음
  if grep -qE "^[[:space:]]*import[[:space:]]+com\.zionex\.t3series\.web\.util\.query\.(SpecificationBuilder|QueryDslBuilder)[[:space:]]*;" <<<"$CONTENT"; then
    OFFENDING_CLASS="$(grep -oE "(SpecificationBuilder|QueryDslBuilder)" <<<"$CONTENT" | head -1)"
    block "Java import 금지: com.zionex.t3series.web.util.query.${OFFENDING_CLASS} 는 프로젝트에 존재하지 않습니다. Criteria API (cb.like / cb.equal) 로 직접 작성하세요. 참조 원본: web/domain/util/userinfo/UserInfoService.java (rules/41b §5.5)"
  fi

  # (d) Composer 신규 Controller 에서 MultipartHttpServletRequest — HttpServletRequest 로 통일 (warn)
  if [ "$IS_COMPOSER_ARTIFACT" = "1" ] \
      && [[ "$FILE_PATH" == *Controller.java ]] \
      && grep -qE "MultipartHttpServletRequest" <<<"$CONTENT"; then
    warn "MultipartHttpServletRequest 대신 HttpServletRequest + request.getParameter(ServiceConstants.PARAMETER_KEY_DATA) 패턴 사용 권장. (rules/41b §5.5 Controller)"
  fi

  # (e) JPA Entity 허구 컬럼 차단 — TB_UT_USER_INFO 실제 컬럼만
  if grep -qE "@Table\(name\s*=\s*\"TB_UT_USER_INFO\"" <<<"$CONTENT"; then
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

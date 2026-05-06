# T3 Validator — Composer SP/XML policy (rules/41b-composer-java.md §5.1)
# (2026-04-27 정책 전환) 신규 화면 = SP 기반 CRUD 필수 + 엔진 service XML 차단
# Hook 의 단일 파일 단위 검증 한계상 SP 누락 차단은 ArtifactApplyService 가 담당.
# 이 hook 은 (1) SP 생성 허용 + 네이밍 검증, (2) 엔진 XML 차단, (3) Oracle 파일 차단 (memory MSSQL only)

IS_COMPOSER_ARTIFACT=0
if [ -n "${T3_COMPOSER_SESSION:-}" ]; then
  IS_COMPOSER_ARTIFACT=1
elif [ -n "$CONTENT" ] && grep -qE "(composer|Composer) (세션|session|generated)" <<<"$CONTENT" >/dev/null 2>&1; then
  IS_COMPOSER_ARTIFACT=1
fi

# (a) MSSQL SP_UI_*.sql — 허용 + 네이밍 / 결정론적 ORDER BY 검증
if [[ "$FILE_PATH" == *mssql/procedures/SP_UI_*.sql ]] && [ -n "$CONTENT" ]; then
  SP_NAME="$(basename "$FILE_PATH" .sql)"
  # 네이밍 정규식 검증 (rules/31 §1.4 + §2)
  if ! [[ "$SP_NAME" =~ ^SP_UI_(AD|BF|CM|COMM|DP|DPD|FO|FP|IM|MP|RP|SA|SALES|SO|UT|TEST|UI|SAMPLE)_ ]]; then
    block "SP 네이밍 위반: ${SP_NAME} — 'SP_UI_<DOMAIN>_<NO>_<ACTION>' 형식 필수 (rules/31 §1.4)"
  fi
  # 조회 SP (Q1/Q2/...) 는 ORDER BY 필수 (결정론적 정렬 — rules/31 §9)
  if [[ "$SP_NAME" =~ _Q[0-9]+$ ]]; then
    if ! grep -qiE "ORDER[[:space:]]+BY" <<<"$CONTENT"; then
      warn "${SP_NAME} 조회 SP 에 ORDER BY 누락. 결정론적 정렬 (SORT_ORDER/CODE/NAME/DATE/PK) 추가 필수 (rules/31 §9)"
    fi
  fi
fi

# (b) Oracle SP — memory 의 'MSSQL only' 규칙 — 차단
if [[ "$FILE_PATH" == *oracle/procedures/SP_UI_*.sql ]] && [ -n "$CONTENT" ]; then
  block "Oracle SP 파일 생성 금지 (memory: MSSQL only 규칙). MSSQL 만 작성: t3series-database/mssql/upgrade/vX.Y.Z-YYYYMMDD/procedures/${FILE_PATH##*/}"
fi

# (c) 엔진 service XML — 신규 화면용 생성 항상 차단 (wingui 단독 구동 강제)
if [[ "$FILE_PATH" == *server/config/*/UI_*_service.xml ]] && [ -n "$CONTENT" ]; then
  if [ "$IS_COMPOSER_ARTIFACT" = "1" ]; then
    block "엔진 service XML 신규 생성 금지 (${FILE_PATH}). wingui 단독 구동을 위해 RestController 가 JdbcTemplate 으로 SP 직접 호출. callService 경유는 BF/DP/MP/FP **계산 화면 수정** 전용. (rules/41b-composer-java.md §5.1, 2026-04-27 정책 전환)"
  else
    warn "엔진 service XML 수동 생성 감지. 신규 화면이면 wingui 네이티브 (RestController + JdbcTemplate + SP) 로 변경 권장. 기존 BF/DP/MP/FP 계산 화면 수정이면 OK. (rules/41-composer-generation.md §13)"
  fi
fi

# (d) Java Service 가 JpaRepository / Specification 으로 직접 CRUD 하는 경우 경고 — SP 호출이 정책
if [[ "$FILE_PATH" == */web/domain/*/*/*Service.java ]] && [ -n "$CONTENT" ]; then
  if grep -qE "import org\.springframework\.data\.jpa\.repository\.(JpaRepository|JpaSpecificationExecutor)" <<<"$CONTENT" \
     || grep -qE "import org\.springframework\.data\.jpa\.domain\.Specification" <<<"$CONTENT"; then
    if ! grep -qE "JdbcTemplate" <<<"$CONTENT"; then
      warn "Service 가 JdbcTemplate 없이 JpaRepository/Specification 만 사용 — 신규 화면은 SP 기반 CRUD 정책. JdbcTemplate.query(\"EXEC SP_UI_<...> ?, ?\", ...) 패턴으로 변경 (rules/41b-composer-java.md §5.5)"
    fi
  fi
fi


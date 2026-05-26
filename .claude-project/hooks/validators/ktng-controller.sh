# KTNG Validator — Controller 패턴 (QueryHandler · @ExecPermission · @RequestBody List<Map>)
# 차단 조건 (KC1~KC5)
#
# KTNG 표준 Controller (BfKtng01Controller 기반):
#   @ExecPermission(menuCd = "UI_BF_KTNG_01", type = ServiceConstants.PERMISSION_TYPE_READ|UPDATE)
#   @PostMapping("/<m>/<cat>/<feature>/q1|s1|d1|popq1|codeq1")
#   public List<Map<String, Object>> getData1(@RequestBody Map<String, Object> params, HttpServletRequest request)
#   queryHandler.getList("SP_UI_BF_KTNG_01_Q1", params)
#   queryHandler.save("SP_UI_BF_KTNG_01_S1", param)
#
# 저장:
#   @RequestBody List<Map<String, Object>> changes  (★ multipart/form-data 아님)
#
# Composer/wingui 본가의 패턴 (JpaRepository / Entity / JdbcTemplate / multipart "changes")
# 을 KTNG 산출물에 적용하면 안 됨.

# 대상 파일: KTNG Controller 만
case "$FILE_PATH" in
  *web/ktng/*Controller.java|*web\\ktng\\*Controller.java) ;;
  *) return 0 ;;
esac

[ -z "$CONTENT" ] && return 0

# ─── KC1. @ExecPermission 누락 경고 ───────────────────────────────────
# 모든 KTNG 엔드포인트는 @ExecPermission 으로 권한 체크.
if echo "$CONTENT" | grep -qE '@PostMapping|@GetMapping|@RequestMapping'; then
  if ! echo "$CONTENT" | grep -q '@ExecPermission'; then
    warn "KTNG Controller 의 모든 엔드포인트는 @ExecPermission(menuCd, type) 필수 (KC1)"
  fi
fi

# ─── KC2. @GetMapping 사용 시 경고 (KTNG 는 POST 일관) ────────────────
if echo "$CONTENT" | grep -qE '@GetMapping\s*\('; then
  warn "KTNG 표준은 모든 엔드포인트 @PostMapping. 조회·저장·삭제 모두 POST + @RequestBody (KC2)"
fi

# ─── KC3. JdbcTemplate 사용 차단 (KTNG 는 QueryHandler) ───────────────
if echo "$CONTENT" | grep -qE 'JdbcTemplate\s+\w+|private\s+final\s+JdbcTemplate'; then
  block "KTNG 표준은 QueryHandler.getList()/save() — JdbcTemplate 직접 사용 금지 (KC3)"
fi

# ─── KC4. multipart/form-data "changes" 패턴 차단 ────────────────────
# wingui 본가는 multipart 로 changes 받지만, KTNG 는 JSON body 의 @RequestBody List<Map>
if echo "$CONTENT" | grep -qE 'PARAMETER_KEY_DATA|getParameter\(\s*"changes"\)'; then
  block "KTNG 저장 패턴은 @RequestBody List<Map<String,Object>> changes (multipart 'changes' 아님) (KC4)"
fi

# ─── KC5. JpaRepository / Entity 사용 차단 (KTNG 는 SP 직접 호출) ────
if echo "$CONTENT" | grep -qE 'extends\s+JpaRepository\b|@Entity\b'; then
  warn "KTNG 표준은 Entity/Repository 없이 Map<String,Object> 직접 사용 (KC5 — 정말 필요한 경우 무시 가능)"
fi

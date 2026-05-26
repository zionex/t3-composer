# KTNG Validator — KTNG 전용 네이밍 (MENU_CD · 패키지 · JSX 경로 · SP)
# 차단 조건 (KN1~KN6)
#
# 진실 소스 (분석된 실제 KTNG 코드):
#   MENU_CD       = UI_<DOMAIN>_KTNG_<NN>  (예: UI_BF_KTNG_01, UI_RPT_KTNG_15)
#   Java 패키지   = com.zionex.t3series.web.ktng.<도메인>.<카테고리>
#   JSX 경로      = view/ktng/<도메인>/<카테고리>/<feature>/<File>.jsx
#   SP            = SP_UI_<DOMAIN>_KTNG_<NN>_<ACTION>
#                   ACTION ∈ {Q1..Qn, S1..Sn, D1..Dn, POP_Q1, CHART_Q1, CODEQ1}

# KTNG 도메인 후보
KTNG_DOMAINS_RE='AD|BF|CM|DP|IM|MP|RPT|SO'

# ─── KN1. Java — web/domain/ 밑에 'ktng' 패키지 만들지 말 것 ─────────
# KTNG 산출물은 반드시 web/ktng/ 아래에. web/domain/ktng/ 처럼 섞으면 충돌.
case "$FILE_PATH" in
  *web/domain/ktng/*|*web\\domain\\ktng\\*)
    block "KTNG Java 산출물은 web/ktng/ 패키지 (web/domain/ktng/ 금지)" "KN1"
    ;;
esac

# ─── KN2. JSX — view/<domain>/ktng/ 가 아니라 view/ktng/<domain>/ ────
case "$FILE_PATH" in
  *view/baselineforecast/ktng/*|*view/demandplan/ktng/*|*view/inventoryplan/ktng/*|*view/masterplan/ktng/*|*view/contributionmargin/ktng/*)
    block "JSX 경로는 view/ktng/<domain>/<category>/<feature>/ — view/<domain>/ktng/ 금지" "KN2"
    ;;
esac

# ─── KN3. Java 파일 — KTNG 산출물은 PascalCase + 숫자 (BfKtng01Controller) ──
case "$FILE_PATH" in
  *web/ktng/*Controller.java|*web\\ktng\\*Controller.java)
    base=$(basename "$FILE_PATH" .java)
    # 표준: <Prefix>Ktng<NN>Controller (예: BfKtng01Controller, RptKtng15Controller)
    # AD 도메인 등은 예외 — KTNG 접미 없이도 OK (SchedulerJobController 등)
    if echo "$base" | grep -qE '^[A-Z][a-z]+Ktng[0-9]+Controller$'; then
      :
    elif echo "$base" | grep -qE 'KtngController$|Ktng[A-Z]'; then
      warn "KTNG Controller 네이밍 권장: <Prefix>Ktng<NN>Controller (예: BfKtng01Controller)"
    fi
    ;;
esac

# ─── KN4. JSX 파일 — KTNG 화면은 <Prefix>Ktng<NN>.jsx (또는 Pop 접두) ────
case "$FILE_PATH" in
  *view/ktng/*/*.jsx|*view\\ktng\\*\\*.jsx)
    base=$(basename "$FILE_PATH" .jsx)
    # 정규 패턴 허용: BfKtng01, CmKtng07, RptKtng15, PopBfKtng01, BfKtng01.css 등
    if echo "$base" | grep -qE '^(Pop)?[A-Z][a-z]+Ktng[0-9]+$'; then
      :
    elif [ "$base" = "index" ]; then
      :
    else
      warn "KTNG JSX 네이밍 권장: <Prefix>Ktng<NN>.jsx (예: BfKtng01.jsx, PopBfKtng01.jsx)"
    fi
    ;;
esac

# ─── KN5. CONTENT 기반 — MENU_CD 환각 차단 ───────────────────────────
# UI_<DOMAIN>_KTNG_<NN> 외 형태 (소문자, UI_KTNG_*, MENU_KTNG_* 등) 사용 금지
if [ -n "$CONTENT" ]; then
  if echo "$CONTENT" | grep -qE 'menuCd\s*=\s*"UI_KTNG_'; then
    block "MENU_CD 형식은 UI_<DOMAIN>_KTNG_<NN> (★ UI_KTNG_* 는 도메인 누락)" "KN5"
  fi
  if echo "$CONTENT" | grep -qE 'menuCd\s*=\s*"MENU_KTNG_'; then
    block "MENU_<...> 는 그룹 노드 prefix. 화면용 코드는 UI_<DOMAIN>_KTNG_<NN>" "KN5"
  fi
  # 흔한 오탈: ui_dp_ktng_01 (소문자), UI-DP-KTNG-01 (하이픈)
  if echo "$CONTENT" | grep -qiE 'menuCd\s*=\s*"ui[-_][a-z]+[-_]ktng[-_]'; then
    block "MENU_CD 는 대문자 + UNDERSCORE — 'UI_<DOMAIN>_KTNG_<NN>'" "KN5"
  fi
fi

# ─── KN6. CONTENT — SP 네이밍 환각 차단 ───────────────────────────
# KTNG SP 는 SP_UI_<DOMAIN>_KTNG_<NN>_<ACTION> 형식.
# QueryHandler.getList("XXX") / .save("XXX") 의 인자 검증.
if [ -n "$CONTENT" ]; then
  # SP_KTNG_* (UI_ 누락 + 도메인 누락) 차단
  if echo "$CONTENT" | grep -qE 'queryHandler\.(getList|save)\s*\(\s*"SP_KTNG_'; then
    block "KTNG SP 는 SP_UI_<DOMAIN>_KTNG_<NN>_<ACTION>. SP_KTNG_* 는 형식 위반" "KN6"
  fi
  # SP_UI_KTNG_* (도메인 누락) 차단
  if echo "$CONTENT" | grep -qE 'queryHandler\.(getList|save)\s*\(\s*"SP_UI_KTNG_'; then
    block "KTNG SP 는 도메인 코드(BF/CM/DP/IM/MP/RPT) 포함 — SP_UI_KTNG_* 는 도메인 누락" "KN6"
  fi
fi

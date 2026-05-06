# T3 Validator — Path Convention (`util/` 표준, `ut/` 금지)
# Sourced by pre-tool-use-validator.sh
#
# ─────────────────────────────────────────────────────────────────────
# 배경 (why this validator exists):
#   2026-04 두 차례 `ut/` 사용으로 화면이 깨짐 — 사용자가 강력 차단 요청.
#   이 프로젝트의 utility 도메인 표준은 **`util/`** 단 하나뿐이다:
#     · Java 패키지     : com.zionex.t3series.web.domain.util.*
#     · URL prefix      : /util/...
#     · zAxios 호출     : zAxios.get('util/...')
#     · MENU_FILE_PATH  : /util/<PascalComponentName>
#     · JSX 디렉토리    : packages/wingui/src/view/util/<lowercase>/
#
#   `ut/` 는 어떤 맥락에서도 사용 금지:
#     · `web.domain.ut.*` 패키지 (X) — `web.domain.util.*` 만
#     · `@RequestMapping("/ut/...")` (X) — `/util/...` 만
#     · `zAxios.get('ut/...')` (X) — `'util/...'` 만
#     · `view/ut/` 또는 `view\ut\` JSX 경로 (X)
#
#   참고로 MENU_CD prefix 의 `UI_UT_*` (모듈 도메인 코드) 는 정상 — 이건 카테고리
#   "UTility" 의 약어로 별도 컨벤션. URL/패키지 path 의 `ut/` 만 금지.
# ─────────────────────────────────────────────────────────────────────

# 차단 대상은 텍스트 기반 파일 (Java/JSX/JS/TS) — 다른 파일은 즉시 패스
case "$FILE_PATH" in
  *.java|*.jsx|*.js|*.ts|*.tsx) ;;
  *) return 0 ;;
esac

# ─── 0. 파일 경로 자체 — view/ut/ 또는 src/main/java/.../domain/ut/ ─
# (CONTENT 비어있어도 무조건 검사 — Edit/Write/ArtifactApply 모두 적용)
case "$FILE_PATH" in
  */view/ut/*|*/view\\ut\\*)
    block "JSX 디렉토리 'view/ut/...' 사용 금지 — 'view/util/...' 로 변경하세요." \
          "rules/41-composer-generation.md §2.2 MENU_FILE_PATH"
    ;;
  */web/domain/ut/*|*/web\\domain\\ut\\*)
    block "Java 패키지 디렉토리 'web/domain/ut/...' 사용 금지 — 'web/domain/util/...' 로 변경하세요. (utility 도메인은 'util/' 단 하나뿐 — 2026-04-29 사고 강력 차단)" \
          "rules/41b-composer-java.md §5.6.1 패키지 구조 · CLAUDE.md §1.-1"
    ;;
esac

# Edit 도구는 stdin 에 content 가 없을 수 있음 — Write 만 강력 검사
[ -z "$CONTENT" ] && return 0

# ─── 1. Java: package com.zionex.t3series.web.domain.ut.* 차단 ──────
if grep -qE '^\s*package\s+com\.zionex\.t3series\.web\.domain\.ut(\.|;)' <<<"$CONTENT"; then
  block "Java 패키지 'com.zionex.t3series.web.domain.ut.*' 사용 금지 — utility 도메인의 표준 패키지는 'com.zionex.t3series.web.domain.util.*' 입니다. 두 차례 같은 실수로 화면이 깨진 적이 있어 강력 차단합니다." \
        "rules/41-composer-generation.md §1.1 wingui 단독 구동 + §2.2 MENU_FILE_PATH (utility 모듈 = util/) · 99-anti-patterns.md PATH-1"
fi

# ─── 2. Java: import com.zionex.t3series.web.domain.ut.* 차단 ──────
if grep -qE '^\s*import\s+com\.zionex\.t3series\.web\.domain\.ut\.' <<<"$CONTENT"; then
  block "Java import 'com.zionex.t3series.web.domain.ut.*' 사용 금지 — 'com.zionex.t3series.web.domain.util.*' 로 변경하세요." \
        "rules/41-composer-generation.md · 99-anti-patterns.md PATH-1"
fi

# ─── 3. Java: @RequestMapping("/ut/...") 차단 ──────────────────────
# 단어 경계 확인 — `/util/` 은 통과해야 함. `/ut/` 또는 `/ut"` 만 차단.
if grep -qE '@RequestMapping\(\s*(value\s*=\s*)?"/ut(/|")' <<<"$CONTENT"; then
  block "@RequestMapping URL prefix '/ut/...' 사용 금지 — utility 도메인의 표준 prefix 는 '/util/...' 입니다. 컨트롤러 경로를 '/util/...' 로 수정하세요." \
        "rules/41-composer-generation.md · 99-anti-patterns.md PATH-2"
fi

# ─── 4. JSX/JS: zAxios.get('ut/...') 등 차단 ─────────────────────────
# zAxios 호출 1차 인자가 'ut/'... 또는 "ut/"... 인 경우. (변수 X — literal 만)
if grep -qE "zAxios[^(]*\(\s*['\"]ut/" <<<"$CONTENT"; then
  block "zAxios 호출 URL 'ut/...' 사용 금지 — 'util/...' 로 변경하세요. (예: zAxios.get('ut/user-infos') → zAxios.get('util/user-infos'))" \
        "rules/41-composer-generation.md §0.2 트랙 C · 99-anti-patterns.md PATH-2"
fi
# zAxios({ url: 'ut/...' }) 객체 호출도 차단
if grep -qE "url:\s*['\"]ut/" <<<"$CONTENT"; then
  block "zAxios 호출 옵션의 url: 'ut/...' 사용 금지 — 'util/...' 로 변경하세요." \
        "rules/41-composer-generation.md · 99-anti-patterns.md PATH-2"
fi

# ─── 5. JSX/JS: GridSaveButton url="ut/..." 등 prop literal 차단 ───
if grep -qE "url=['\"]ut/" <<<"$CONTENT"; then
  block "JSX prop url=\"ut/...\" 사용 금지 — \"util/...\" 로 변경하세요. (Composer 가 자주 잘못 생성하는 패턴)" \
        "rules/41-composer-generation.md §0.2 트랙 C · 99-anti-patterns.md PATH-2"
fi

# ─── 6. fieldCascade.js / 일반 코드: optionsUrl: 'ut/...' 차단 ─────
if grep -qE "optionsUrl:\s*['\"]ut/" <<<"$CONTENT"; then
  block "fieldCascade.js 의 optionsUrl 에 'ut/...' 사용 금지 — 'util/...' 로 변경하세요." \
        "rules/41c-composer-widgets.md §7 · 99-anti-patterns.md PATH-2"
fi

# (디렉토리 경로 검사는 §0 (파일 상단) 에서 수행 — 중복 제거)

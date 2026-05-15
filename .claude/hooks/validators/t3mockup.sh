# T3Mockup — mockup jsx 파일 검증 (M1~M4)
# Phase 4a/4b/4c 의 mockup 갤러리 (frontend/src/view/util/t3mockup/) 의 규약 강제
#
# M1: mockup 파일은 MockShell 을 import + 사용 (헤더 일관성)
# M2: MockShell 의 patternCode prop 값이 디렉토리명과 1:1 일치
# M3: 자체 정의 ITEMS/ACCOUNTS/LOCATIONS 보다 _data/mockData.js 의 import 권장
# M4: index.js 의 MOCKUP_ENTRIES 신규 entry 누락 (lazy import path 가 실재 파일을 가리키지 않음)

# 비대상 즉시 패스
case "$FILE_PATH" in
  *frontend/src/view/util/t3mockup/*) : ;;
  *) return 0 ;;
esac
case "$TOOL_NAME" in
  Write|Edit|MultiEdit) : ;;
  *) return 0 ;;
esac
[ -z "$CONTENT" ] && return 0

# _shared, _data, T3Mockup.jsx, index.js 는 제외 (mockup 본체만 검증)
case "$FILE_PATH" in
  */t3mockup/_shared/*|*/t3mockup/_data/*|*/t3mockup/T3Mockup.jsx|*/t3mockup/index.js)
    return 0 ;;
esac

# .jsx 파일만 검증
case "$FILE_PATH" in
  *.jsx) : ;;
  *) return 0 ;;
esac

# 디렉토리명 추출 (예: dash_executive)
MOCKUP_DIR="$(basename "$(dirname "$FILE_PATH")")"

# ─────────────────────────────────────────
# M1 — MockShell import 검증
# ─────────────────────────────────────────
if ! echo "$CONTENT" | grep -qE "^import\s+MockShell\s+from\s+['\"]\.\./_shared/MockShell['\"];" 2>/dev/null \
   && ! echo "$CONTENT" | grep -qE "import\s+MockShell\s+from\s+['\"]\.\./_shared/MockShell['\"];" 2>/dev/null; then
  warn "[M1] t3mockup 의 .jsx 가 _shared/MockShell 을 import 하지 않음 — 갤러리 헤더 일관성을 위해 다음 패턴 사용 권장:
       import MockShell from '../_shared/MockShell';"
fi

# ─────────────────────────────────────────
# M2 — MockShell 의 patternCode prop ↔ 디렉토리명 일치
# ─────────────────────────────────────────
PROP_CODE="$(echo "$CONTENT" | grep -oE "patternCode=\"[^\"]+\"" | head -1 | sed -E "s/patternCode=\"([^\"]+)\"/\1/")"
if [ -n "$PROP_CODE" ] && [ -n "$MOCKUP_DIR" ] && [ "$PROP_CODE" != "$MOCKUP_DIR" ]; then
  block "[M2] MockShell patternCode prop ('$PROP_CODE') 가 디렉토리명 ('$MOCKUP_DIR') 와 일치하지 않음.
       MOCKUP_ENTRIES 의 patternCode 와 폴더명·파라미터는 항상 1:1 일치해야 함.
       (T3Mockup 의 카드 클릭 → lazy import 가 디렉토리 이름으로 모듈 검색)" \
       "docs/UI-ANALYSIS-OVERVIEW.md §Phase 4a"
fi

# ─────────────────────────────────────────
# M3 — 더미 데이터 자체 정의 시 mockData import 권장 (warn)
# ─────────────────────────────────────────
if echo "$CONTENT" | grep -qE "^const (ITEMS|ACCOUNTS|LOCATIONS|USERS|KPI_CARDS|FORECAST_TS|ACTUAL_TS|ALERTS)\s*=\s*\[" 2>/dev/null; then
  warn "[M3] mockup 안에서 ITEMS/ACCOUNTS/LOCATIONS 등의 도메인 더미 데이터를 자체 정의하지 말고
       '../_data/mockData' 에서 import 하여 도메인 일관성 유지 권장.
       (LED Module 60W, Samsung Display, KR-Suwon Plant 등 공통 어휘)"
fi

# ─────────────────────────────────────────
# M4 — MOCKUP_ENTRIES 등록 검사 (Write 시점만 — Edit 는 추적 어려움)
# ─────────────────────────────────────────
if [ "$TOOL_NAME" = "Write" ]; then
  # index.js 안에 같은 디렉토리 path 가 등장하는지
  INDEX_JS="$(dirname "$(dirname "$FILE_PATH")")/index.js"
  if [ -f "$INDEX_JS" ]; then
    if ! grep -qE "import\(['\"]\.\/$MOCKUP_DIR\/" "$INDEX_JS" 2>/dev/null; then
      warn "[M4] 신규 mockup '$MOCKUP_DIR' 가 index.js 의 MOCKUP_ENTRIES 에 등록되지 않음.
       T3SMART_SCM_ENTRIES 또는 PLANEL_ENTRIES 배열에 다음 entry 를 추가하세요:
       { patternCode: '$MOCKUP_DIR', patternLabel: '...', layoutCategory: '...', category: '...',
         usage: 0, description: '...',
         component: lazy(() => import('./$MOCKUP_DIR/$(basename "$FILE_PATH" .jsx)')) },"
    fi
  fi
fi

return 0

# PlanNEL Validator — JSX 화면 컴포넌트 검증
# Sourced by pre-tool-use-validator.sh
#
# 검증 (saas-web/src/pages/ 안의 화면 파일만):
#   1. withTranslation() HOC export 사용 권장
#   2. (props.t, viewName, title) 시그니처 권장
#   3. AgGridReact + onGridReady 안에 DataState.initialize(params.api) 호출 권장
#   4. 한글 라벨 하드코딩 → t() 또는 i18n key 사용 권장
#   5. axios 직접 import 차단 (이미 import-convention.sh 에서 처리하지만 이중 안전망)
#
# 참조: rules/20-screen-development.md §3 · rules/21-components.md · rules/99-anti-patterns.md FE1, FE2, FE7

# saas-web 의 .js 파일 (PlanNEL 은 .jsx 가 아닌 .js)
case "$FILE_PATH" in
  *saas-web/src/pages/*.js|*saas-web/src/pages/*.jsx) ;;
  *) return 0 ;;
esac
[ -z "$CONTENT" ] && return 0

# AgGridReact 또는 화면 컴포넌트로 보이는 파일만
# (단순 service / utility 파일은 패스)
if ! grep -qE '\b(AgGridReact|FilterContainer|withTranslation|export\s+default)\b' <<<"$CONTENT"; then
  return 0
fi

# ─── 1. withTranslation() HOC export 권장 ──────────────────────────
# `export default withTranslation()(ComponentName);` 가 표준
if grep -qE '\bexport\s+default\s+function\b' <<<"$CONTENT" \
   || grep -qE '\bexport\s+default\s+\(' <<<"$CONTENT"; then
  if ! grep -qE 'withTranslation\(\)' <<<"$CONTENT"; then
    # useTranslation 을 쓰면 OK
    if ! grep -qE 'useTranslation\s*\(' <<<"$CONTENT"; then
      warn "화면 컴포넌트의 export 패턴 — 'export default withTranslation()(ComponentName)' HOC 또는 useTranslation() 사용 권장." \
           "rules/10-overview.md §2.4 · rules/20-screen-development.md §3"
    fi
  fi
fi

# ─── 2. AgGridReact 가 있으면 onGridReady 안에 DataState.initialize 권장 ──
if grep -qE '\bAgGridReact\b' <<<"$CONTENT"; then
  if grep -qE '\bDataState\b' <<<"$CONTENT"; then
    # DataState 는 import 했는데 initialize 호출이 없으면 warn
    if ! grep -qE 'DataState\.initialize\s*\(' <<<"$CONTENT"; then
      warn "DataState import 했으나 'DataState.initialize(params.api)' 호출 없음 — onGridReady 안에서 호출 필요. 미호출 시 저장 시 'DataState.getStateData()' 가 undefined." \
           "rules/20-screen-development.md §3 (#9~10) · rules/99-anti-patterns.md FE2"
    fi
  else
    warn "AgGridReact 사용 중인데 DataState import 없음 — 행 변경 추적 (created/updated) 위해 'DataState' from '@plannel/components/aggrid/DataState' 권장." \
         "rules/21-components.md §3 · rules/99-anti-patterns.md FE2"
  fi

  # DefaultGridSetting 권장
  if ! grep -qE '\bDefaultGridSetting\b' <<<"$CONTENT"; then
    warn "AgGridReact 사용 중인데 DefaultGridSetting 미사용 — 'const defaultGridMemo = useMemo(() => DefaultGridSetting({title, viewName}), [])' 권장." \
         "rules/21-components.md §3 · rules/20-screen-development.md §3"
  fi
fi

# ─── 3. 컬럼 정의에 filterType 누락 검사 ────────────────────────────
# columnDefs 안의 객체에 field 가 있는데 filterType 이 전혀 없는 경우
if grep -qE '\bcolumnDefs\b' <<<"$CONTENT"; then
  FIELD_COUNT=$(grep -cE '^\s*\{\s*headerName' <<<"$CONTENT" || true)
  FILTER_TYPE_COUNT=$(grep -cE '\bfilterType\s*:' <<<"$CONTENT" || true)
  if [ "$FIELD_COUNT" -gt 0 ] && [ "$FILTER_TYPE_COUNT" -eq 0 ]; then
    warn "columnDefs 의 컬럼 정의에 'filterType' 전혀 없음 — AdvancedFilter 가 컬럼을 인식 못함. (string/number/boolean/timestamp)" \
         "rules/21-components.md §3.3 · rules/99-anti-patterns.md FE3"
  fi
fi

# ─── 4. 한글 라벨 하드코딩 (headerName / label 안에 한글) ────────────
# headerName: "거래처코드" 같은 패턴
if grep -qP "headerName\s*:\s*['\"][^'\"]*[\x{AC00}-\x{D7AF}]+" <<<"$CONTENT" 2>/dev/null; then
  warn "headerName 에 한글 라벨 하드코딩 — i18n key (예: headerName: 'customerCd') 사용 권장. AG-Grid + i18next 가 자동 번역." \
       "rules/10-overview.md §5 · rules/99-anti-patterns.md FE7, W22"
fi
# label="거래처" / placeholder="거래처" 도 검사
if grep -qP "(label|placeholder)\s*=\s*['\"][^'\"]*[\x{AC00}-\x{D7AF}]+" <<<"$CONTENT" 2>/dev/null; then
  if ! grep -qE '\bt\s*\(' <<<"$CONTENT"; then
    warn "한글 라벨 (label/placeholder) 하드코딩 — t('KEY') 또는 i18n key 사용 권장." \
         "rules/10-overview.md §5 · rules/99-anti-patterns.md FE7"
  fi
fi

# ─── 5. viewName prop 미사용 시 warn ───────────────────────────────
# 컴포넌트 시그니처가 ({ t, viewName, title }) 가 아니면 redux 영속 못함
if grep -qE 'reduxUtil\.getViewState' <<<"$CONTENT"; then
  if ! grep -qE '\bviewName\b' <<<"$CONTENT"; then
    warn "reduxUtil.getViewState 호출 중 'viewName' 변수 안 보임 — props.viewName 으로 받아야 함. TabMenuList.js 의 reduxKey 와 일치해야 함." \
         "rules/10-overview.md §2.5 · rules/99-anti-patterns.md FE1"
  fi
fi

# ─── 6. react-hook-form 사용 → warn (PlanNEL 미사용) ──────────────
if grep -qE "from\s+['\"]react-hook-form['\"]" <<<"$CONTENT"; then
  warn "react-hook-form 사용 — PlanNEL 표준은 useState + useRef 패턴. 신규 화면이면 기존 화면 (CustomerMaster.js) 패턴 따르기 권장." \
       "rules/10-overview.md §0 · rules/99-anti-patterns.md W23"
fi

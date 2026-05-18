# PlanNEL Validator — Import 컨벤션
# Sourced by pre-tool-use-validator.sh — uses $FILE_PATH $CONTENT
#
# 차단 대상:
#   1. Java 의 jakarta.* import (PlanNEL 은 Spring Boot 2.4 → javax.* 사용)
#   2. JSX/JS 의 @wingui/* import (PlanNEL 은 @plannel/* 사용)
#   3. 상대 경로 import (../../ 등 — alias 사용 권장)
#
# 참조: rules/10-overview.md §0 / rules/99-anti-patterns.md §1, §2

# 텍스트 기반 파일만
case "$FILE_PATH" in
  *.java|*.jsx|*.js|*.ts|*.tsx) ;;
  *) return 0 ;;
esac

[ -z "$CONTENT" ] && return 0

# ─── 1. Java: jakarta.* import 차단 ─────────────────────────────────
if [[ "$FILE_PATH" == *.java ]]; then
  if grep -qE '^\s*import\s+jakarta\.persistence' <<<"$CONTENT"; then
    block "Java import 'jakarta.persistence.*' 사용 금지 — PlanNEL 은 Spring Boot 2.4.13 사용 → 'javax.persistence.*' 로 변경하세요." \
          "rules/99-anti-patterns.md SB1~SB14 · rules/30-data-access.md §4.1"
  fi
  if grep -qE '^\s*import\s+jakarta\.validation' <<<"$CONTENT"; then
    block "Java import 'jakarta.validation.*' 사용 금지 — 'javax.validation.*' 로 변경하세요. (Spring Boot 2.4)" \
          "rules/99-anti-patterns.md SB15~SB16"
  fi
  if grep -qE '^\s*import\s+jakarta\.servlet' <<<"$CONTENT"; then
    block "Java import 'jakarta.servlet.*' 사용 금지 — 'javax.servlet.*' 로 변경하세요. (Spring Boot 2.4)" \
          "rules/99-anti-patterns.md SB17~SB18"
  fi
  if grep -qE '^\s*import\s+jakarta\.annotation' <<<"$CONTENT"; then
    block "Java import 'jakarta.annotation.*' 사용 금지 — 'javax.annotation.*' 로 변경하세요. (Spring Boot 2.4)" \
          "rules/99-anti-patterns.md §2"
  fi

  # jjwt 0.11+ API 차단 (PlanNEL 은 jjwt 0.9.1 — Jwts.parser() 만 사용)
  if grep -qE 'Jwts\.parserBuilder\(\)' <<<"$CONTENT"; then
    block "Jwts.parserBuilder() 사용 금지 — PlanNEL 의 jjwt 0.9.1 은 'Jwts.parser().setSigningKey(...).parseClaimsJws(...)' legacy API 사용." \
          "rules/99-anti-patterns.md SB20 · rules/32-security.md §3"
  fi

  # WebSecurityConfigurerAdapter 가 deprecated 가정 후 SecurityFilterChain bean 패턴 사용 차단
  # (Spring Boot 2.4 에서는 Adapter 정상)
  if grep -qE '@Bean\s+SecurityFilterChain' <<<"$CONTENT" && ! grep -qE 'WebSecurityConfigurerAdapter' <<<"$CONTENT"; then
    warn "SecurityFilterChain bean 패턴은 Spring Boot 2.7+ 부터 권장. PlanNEL 의 WebSecurityConfig 는 'extends WebSecurityConfigurerAdapter' 사용 중." \
         "rules/99-anti-patterns.md SB19 · rules/32-security.md §2"
  fi
fi

# ─── 2. JSX/JS/TS: @wingui/* import 차단 ────────────────────────────
case "$FILE_PATH" in
  *.jsx|*.js|*.ts|*.tsx)
    if grep -qE "from\s+['\"]@wingui/" <<<"$CONTENT"; then
      block "JSX import '@wingui/*' 사용 금지 — PlanNEL 은 '@plannel/components/*' alias 사용. (T3Series wingui 와 컴포넌트 시스템 별개)" \
            "rules/99-anti-patterns.md W1 · rules/21-components.md"
    fi
    if grep -qE "from\s+['\"]@zionex/wingui-core" <<<"$CONTENT"; then
      block "JSX import '@zionex/wingui-core/*' 사용 금지 — PlanNEL 은 wingui-core 미사용. AG-Grid + MUI + @plannel/components 조합 사용." \
            "rules/99-anti-patterns.md W1 · W2"
    fi

    # RealGrid2 / BaseGrid 환각 차단
    if grep -qE '\bBaseGrid\b' <<<"$CONTENT"; then
      block "<BaseGrid> 사용 금지 — PlanNEL 은 AG-Grid 사용. <AgGridReact columnDefs={...} rowData={...}> 로 변경하세요." \
            "rules/99-anti-patterns.md W2 · rules/21-components.md §3"
    fi
    if grep -qE "from\s+['\"]realgrid['\"]" <<<"$CONTENT"; then
      block "realgrid 라이브러리 import 금지 — PlanNEL 은 @ag-grid-community/react 사용." \
            "rules/99-anti-patterns.md W2 · rules/10-overview.md §0"
    fi

    # Zustand 환각 차단 (useViewStore / useContentStore — wingui 컨벤션)
    if grep -qE '\b(useViewStore|useContentStore)\b' <<<"$CONTENT"; then
      block "useViewStore / useContentStore 사용 금지 — PlanNEL 은 Redux Toolkit 사용. reduxUtil.getViewState(viewName) + useDispatch 패턴." \
            "rules/99-anti-patterns.md W5 · rules/21-components.md §7"
    fi

    # showMessage / setViewInfo / globalButtons (wingui 만의 패턴)
    if grep -qE '\bshowMessage\(' <<<"$CONTENT"; then
      block "showMessage() 사용 금지 — PlanNEL 은 <Dialog> + <Snackbar> 컴포넌트 사용." \
            "rules/99-anti-patterns.md W10 · rules/21-components.md §5"
    fi
    if grep -qE '\bsetViewInfo\(' <<<"$CONTENT"; then
      block "setViewInfo() 사용 금지 — PlanNEL 에는 globalButtons 개념 없음. <FilterContainer> 안에 <SaveButton> 등 직접 배치." \
            "rules/99-anti-patterns.md W9 · rules/21-components.md §4"
    fi

    # zAxios → service 레이어 강제
    if grep -qE '\bzAxios\b' <<<"$CONTENT"; then
      block "zAxios 사용 금지 — PlanNEL 은 service 레이어 (예: customerService.getAll(params)) 통해서 호출. axios 직접 호출도 금지 — restApi 인스턴스만 사용." \
            "rules/99-anti-patterns.md W11 · rules/30-data-access.md §1"
    fi

    # axios 직접 import 차단 (rest-api.js 의 restApi 만 사용)
    if grep -qE "from\s+['\"]axios['\"]" <<<"$CONTENT" \
       && [[ "$FILE_PATH" != *services/utils/rest-api.js ]] \
       && [[ "$FILE_PATH" != *axios-bigint* ]]; then
      block "axios 직접 import 금지 — 'restApi' from '@plannel/services/utils/rest-api' 사용. (axios 직접 호출은 JWT/tenant header 누락)" \
            "rules/30-data-access.md §2"
    fi

    # wingui 의 useFieldCascade (PlanNEL 미보유)
    if grep -qE '\b(useFieldCascade|applyGridCascade|buildPopupFilterProps)\b' <<<"$CONTENT"; then
      block "useFieldCascade / applyGridCascade / buildPopupFilterProps 사용 금지 — PlanNEL 에 동등 헬퍼 없음. cascade 는 화면별 useState + useEffect 로 직접 구현." \
            "rules/99-anti-patterns.md W6 · W29"
    fi

    # 상대 경로 import (../../) warn — @plannel alias 권장
    if grep -qE "from\s+['\"]\.\./\.\./" <<<"$CONTENT"; then
      warn "상대 경로 import (../../) 발견 — '@plannel/*' alias 사용 권장. (craco.config.js)" \
           "rules/10-overview.md §2.3 · rules/99-anti-patterns.md FE8"
    fi
    ;;
esac

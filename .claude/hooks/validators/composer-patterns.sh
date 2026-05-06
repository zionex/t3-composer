# T3 Validator — T3Composer Pattern / Dictionary / Preview (CP1~CP11)
# rules/40-composer-patterns.md

# =====================================================================
# 6. T3Composer — Pattern / Dictionary / Preview 검증 (rules/40-composer-patterns.md)
# =====================================================================

# 6.1 PatternPreview.jsx 작성 시 — 렌더러 네이밍 · fontSize · 컬러 규약
if [[ "$FILE_PATH" == *t3composer/PatternPreview.jsx ]] && [ -n "$CONTENT" ]; then

  # CP2. fontSize 13+ 금지 (400×260 캔버스 대비 과대)
  # 허용 예외: 이모지 아이콘 크기 (fontSize: 14~22) — 주석 "icon" / 이모지 문자 근처 라인은 제외
  OVERSIZED_LINES="$(grep -nE "fontSize:[[:space:]]*(1[3-9]|[2-9][0-9])" <<<"$CONTENT" \
    | grep -vE "/\*.*icon|icon.*\*/|// icon|📤|🎛|🏭|📁|✅|📈|📉|📊|🖥|🚨|🤖|⚙|🔴|🟡|⚠|⛔|➔|⏳|⏰|💡|✂|↔|🔄|📦|📋|📌|🔒|🔓|💾|⟳|⬇|▶|◀|■|✓|✗|★|✨|🎯|💧|☑|☐|🔸" \
    || true)"
  if [ -n "$OVERSIZED_LINES" ]; then
    # 이모지 감지가 완벽하지 않으므로 block 대신 warn
    warn "fontSize 13+ 감지됨. 이모지/아이콘이 아니면 5~12 범위로 낮춰주세요. (rules/99-anti-patterns.md CP2)"
  fi

  # CP3. 컬러 hex 직접 하드코딩 금지 — DC.* 팔레트만 사용
  # React.Fragment 내 SVG stroke/fill 에 문자열이 들어가는 정상 케이스는 backtick 템플릿 `${DC.xxx}` 로 작성되어 있어야 함
  # 새로 추가된 #rrggbb 직접 리터럴만 걸러냄 (이미 파일에 있던 `#0f1219` 등 DC 정의는 예외)
  if grep -qE "(bgcolor|color|stroke|fill):[[:space:]]*'#[0-9a-fA-F]{3,8}'" <<<"$CONTENT"; then
    # DC 객체 정의부(const DC = {...}) 는 허용. 그 외 위치 hex 만 경고.
    warn "컬러 hex 직접 하드코딩 감지. DC.* 팔레트 또는 템플릿 문자열 사용 권장 (rules/99-anti-patterns.md CP3)"
  fi

  # CP8. 렌더러 네이밍 접두어 검증 — Object.assign 블록 안의 키
  # cb_/pe_/mn_/rl_ 접두어 또는 일반 (search_grid 등) 만 허용
  INVALID_RENDERER=$(grep -nE "^[[:space:]]+(controlboard|planedit|monitoring|routelayout)[a-z0-9_]*:" <<<"$CONTENT" || true)
  if [ -n "$INVALID_RENDERER" ]; then
    block "PatternPreview 렌더러 네이밍 위반. 접두어는 cb_/pe_/mn_/rl_ 사용 (rules/99-anti-patterns.md CP8, rules/40-composer-patterns.md §3.6)"
  fi
fi

# 6.2 t3composerpatterns / T3ComposerPatterns.jsx — LAYOUT_* 라벨 숫자 prefix 검증
if [[ "$FILE_PATH" == *t3composerpatterns/*.jsx ]] && [ -n "$CONTENT" ]; then
  # CATEGORY_LABELS 안에 LAYOUT_xx 코드가 있으면 label 에 숫자 prefix 필수
  if grep -qE "LAYOUT_[A-Z0-9]+:[[:space:]]*\{" <<<"$CONTENT"; then
    # label: '11 좌우 2분할' 형식 체크
    MISSING_PREFIX=$(grep -nE "label:[[:space:]]*'[^0-9]" <<<"$CONTENT" || true)
    if [ -n "$MISSING_PREFIX" ]; then
      warn "CATEGORY_LABELS 라벨에 숫자 prefix(11/12/.../91 등) 누락 가능. (rules/99-anti-patterns.md CP4, rules/40-composer-patterns.md §2.1)"
    fi
  fi
fi

# 6.2.1 JSX — @wingui/common/store/* 는 shim 으로 동작하나 @wingui/common/imports 권장 (warn)
if [[ "$FILE_PATH" == *.jsx || "$FILE_PATH" == *.tsx ]] && [ -n "$CONTENT" ]; then
  if grep -qE "from\s+['\"]@wingui/common/store/" <<<"$CONTENT"; then
    warn "@wingui/common/store/* 는 shim 으로 동작하지만 가급적 @wingui/common/imports 에서 useViewStore·useContentStore 를 import 하세요. (packages/wingui/src/common/store/ 의 re-export 파일 기준)"
  fi
fi

# 6.3 LangPack UPDATE — UPDATE_BY / UPDATE_DTTM 금지 (MODIFY_BY/MODIFY_DTTM 사용)
if [[ "$FILE_PATH" == *.sql ]] && [ -n "$CONTENT" ]; then
  if grep -qi "TB_AD_LANG_PACK" <<<"$CONTENT" && grep -qiE "UPDATE_BY|UPDATE_DTTM" <<<"$CONTENT"; then
    block "TB_AD_LANG_PACK 에는 UPDATE_BY/UPDATE_DTTM 컬럼이 없습니다. MODIFY_BY / MODIFY_DTTM 사용 (rules/99-anti-patterns.md CP6)"
  fi
fi

# 6.3.1 TB_AD_MENU — 허구 컬럼명 차단 (rules/32-sql-schema-verification.md)
#   LLM 이 자주 만드는 hallucinated columns 를 INSERT 컬럼 리스트에서 발견하면 block.
#   실제 컬럼: ID · PARENT_ID · MENU_CD · MENU_PATH · MENU_SEQ · MENU_FILE_PATH · USE_YN + BaseEntity
if [[ "$FILE_PATH" == *.sql ]] && [ -n "$CONTENT" ]; then
  if grep -qiE "INTO[[:space:]]+\[?TB_AD_MENU\]?" <<<"$CONTENT"; then
    # INSERT INTO TB_AD_MENU (...) 블록 안에 금지 컬럼이 있는지 검사
    # (간단화: 전체 CONTENT 에서 TB_AD_MENU 가 있고 금지 컬럼 토큰이 등장하면 block)
    BAD_COL=""
    for col in "MENU_NM" "PARENT_MENU_CD" "DEPTH" "SORT_ORDER" "DISPLAY_ORDER"; do
      if grep -qwE "$col" <<<"$CONTENT"; then
        BAD_COL="$col"
        break
      fi
    done
    # URL 은 매우 흔한 토큰이라 INSERT 컬럼 리스트 내부에서만 매칭되도록 별도 체크
    if [ -z "$BAD_COL" ]; then
      # INSERT INTO TB_AD_MENU ( ... URL ... ) 패턴
      if grep -Piz '(?i)INSERT\s+INTO\s+\[?TB_AD_MENU\]?\s*\([^)]*\bURL\b' <<<"$CONTENT" >/dev/null 2>&1; then
        BAD_COL="URL"
      fi
    fi
    if [ -n "$BAD_COL" ]; then
      block "TB_AD_MENU 에 '$BAD_COL' 컬럼은 존재하지 않습니다. 실제 컬럼만 사용: ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN + BaseEntity(CREATE_BY/CREATE_DTTM/MODIFY_BY/MODIFY_DTTM). 메뉴 표시명은 TB_AD_LANG_PACK(LANG_KEY=MENU_CD) 에 별도 등록." \
            "rules/32-sql-schema-verification.md §3"
    fi
  fi
fi

# 6.3.2 SQL 작성 시 스키마 검증 원칙 안내 (WARN — INSERT/UPDATE 시 기본 상기)
if [[ "$FILE_PATH" == *.sql ]] && [ -n "$CONTENT" ]; then
  if grep -qiE "^[[:space:]]*(INSERT[[:space:]]+INTO|UPDATE)[[:space:]]+\[?TB_AD_" <<<"$CONTENT"; then
    # 실제 컬럼 확인 없이 쿼리 작성하지 않았는지 상기 (hard block 은 아님)
    if ! grep -qE "(@Column|INFORMATION_SCHEMA|tables-catalog)" <<<"$CONTENT"; then
      # 주석으로 스키마 확인 흔적이 남아있지 않으면 경고 (과도한 noise 방지 위해 조용히)
      :
    fi
  fi
fi

# 6.4 Composer Seed SQL — 재실행 안전성 (DELETE 선행 권장)
if [[ "$FILE_PATH" == *db_update_script_composer_dictionary_seed_* ]] && [ -n "$CONTENT" ]; then
  if grep -qiE "INSERT[[:space:]]+INTO[[:space:]]+TB_IS_COMPOSER_" <<<"$CONTENT"; then
    if ! grep -qiE "DELETE[[:space:]]+FROM[[:space:]]+TB_IS_COMPOSER_" <<<"$CONTENT"; then
      warn "Composer 사전 Seed SQL — 재실행 대비 DELETE FROM ... WHERE CODE IN (...) 선행 권장 (rules/40-composer-patterns.md §4.3)"
    fi
  fi
fi


# T3 Validator — MENU_SQL (TB_AD_MENU INSERT) — naming + columns
# rules/41-composer-generation.md §2, §3, §10

# 7.2 MENU_SQL 검증 — TB_AD_MENU INSERT 가 포함된 .sql
if [[ "$FILE_PATH" == *.sql ]] && [ -n "$CONTENT" ]; then
  if grep -qiE "INSERT[[:space:]]+INTO[[:space:]]+\[?TB_AD_MENU\]?" <<<"$CONTENT"; then

    # CG1. MENU_FILE_PATH — 자동 추가 폴더 이중화 검사
    # 정상: '/<module>/<Pascal>'       예: '/util/UserInfoMgmt'
    # 정상: '/<module>/<cat>/<Pascal>' 예: '/snop/dashboard/ExecutiveDashboard' (category 폴더 있음)
    # 금지: 마지막 직전 세그먼트 == lowercase(마지막 Pascal 세그먼트)
    #       예: '/util/userinfomgmt/UserInfoMgmt' → 런타임이 userinfomgmt 를 또 붙여 이중화
    # 방법: SQL 내 '/<...>/<Pascal>' 리터럴을 모두 추출해 shell loop 로 개별 검사
    while IFS= read -r FP_LITERAL; do
      [ -z "$FP_LITERAL" ] && continue
      # 따옴표 제거 후 경로 분석
      FP="${FP_LITERAL//\'/}"
      LAST_SEG="${FP##*/}"          # 마지막 세그먼트
      PARENT_PATH="${FP%/*}"        # 부모 경로
      LAST_INTER="${PARENT_PATH##*/}"  # 마지막 직전 세그먼트
      # 마지막 세그먼트가 PascalCase 가 아니면 건너뜀 (MENU_PATH 등의 lowercase URL 은 대상 아님)
      if ! [[ "$LAST_SEG" =~ ^[A-Z][A-Za-z0-9]*$ ]]; then
        continue
      fi
      # 중간 세그먼트가 없으면 (module 만 있음) OK
      if [ -z "$LAST_INTER" ]; then
        continue
      fi
      # 마지막 직전 세그먼트가 lowercase(마지막 PascalCase 세그먼트) 와 일치하면 이중화
      LAST_SEG_LC=$(echo "$LAST_SEG" | tr '[:upper:]' '[:lower:]')
      if [ "$LAST_INTER" = "$LAST_SEG_LC" ]; then
        block "MENU_FILE_PATH 의 '$FP' 는 자동 추가 폴더와 이중화됩니다. 런타임이 '/${LAST_INTER}' 를 자동으로 붙이므로 수동으로 쓰면 '/${LAST_INTER}/${LAST_INTER}/${LAST_SEG}' 로 이중화되어 import 실패 → NoContent. '$PARENT_PATH/$LAST_SEG' 에서 '$LAST_INTER/' 를 제거하세요." \
              "rules/41-composer-generation.md §2, rules/99-anti-patterns.md CG1"
      fi
    done < <(grep -oE "'/[a-z][a-z0-9/_-]*/[A-Z][A-Za-z0-9]*'" <<<"$CONTENT" | sort -u)

    # CG2. .jsx 확장자 포함 금지
    if grep -qE "'/[a-z][a-z0-9/_-]*/[A-Z][A-Za-z0-9]*\.jsx'" <<<"$CONTENT"; then
      block "MENU_FILE_PATH 에 '.jsx' 확장자 포함 금지 — React.lazy 가 자동 해석합니다." \
            "rules/41-composer-generation.md §2, rules/99-anti-patterns.md CG2"
    fi

    # CG1b. MENU_FILE_PATH 형식 검증 — 마지막 세그먼트는 반드시 PascalCase
    # INSERT 컬럼에 MENU_FILE_PATH 가 명시된 경우에만 간단히 점검.
    # VALUES/SELECT 의 6번째 필드가 filePath 인 관례적 순서는 LLM 별 편차가 있어,
    # 대신 '_FILE_PATH' 컬럼이 있으면 '/<...>/<첫글자 소문자>' 패턴을 찾아 block.
    if grep -qiE "\bMENU_FILE_PATH\b" <<<"$CONTENT"; then
      # '/<...>/<lowercase_word>' 같은 모두 소문자 path 가 filePath 로 쓰이면 PascalCase 규약 위반
      # 단, URL 용 MENU_PATH 도 같은 리터럴 형식이라 오탐 위험 → 경고만
      if grep -qE "MENU_FILE_PATH[^']*'/[a-z][a-z0-9/_-]*/[a-z][a-z0-9_-]*'" <<<"$CONTENT"; then
        warn "MENU_FILE_PATH 의 마지막 세그먼트는 PascalCase(JSX 파일명) 여야 합니다. 전체 소문자 감지 — rules/41-composer-generation.md §2"
      fi
    fi

    # CG1c. MENU_PATH 형식 — 권장: 모두 lowercase
    if grep -qE "MENU_PATH[^']*'/[A-Z]" <<<"$CONTENT"; then
      warn "MENU_PATH (URL hash) 는 관례상 lowercase 입니다. PascalCase 대소문자 포함 감지 — rules/41-composer-generation.md §2"
    fi

    # CG3. PARENT_MENU_CD — 존재하지 않는 MENU_UT (실제는 MENU_UTIL)
    # SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'MENU_UT' 패턴
    if grep -qiE "MENU_CD[[:space:]]*=[[:space:]]*'MENU_UT'" <<<"$CONTENT"; then
      block "parent MENU_CD 로 'MENU_UT' 사용 금지 — 실제 util 그룹은 'MENU_UTIL' 입니다." \
            "rules/41-composer-generation.md §3, rules/99-anti-patterns.md CG3"
    fi

    # CG13. MSSQL MENU_SQL 에 Oracle 구문 사용 금지
    if grep -qwE "SYSDATE|SYS_GUID" <<<"$CONTENT"; then
      block "MSSQL MENU_SQL 에 Oracle 구문(SYSDATE/SYS_GUID) 사용 금지. GETDATE() / NEWID() 사용." \
            "rules/41-composer-generation.md, rules/99-anti-patterns.md CG13"
    fi

    # CG15~17. MENU_CD 네이밍 규약 — leaf 메뉴는 'UI_<DOMAIN>_<NAME>' 강제
    # INSERT INTO TB_AD_MENU (...) ... VALUES ... 또는 ... SELECT ...
    # 의 컬럼 리스트에 MENU_CD 가 있고, MENU_PATH 컬럼도 있으면 (= leaf 메뉴) MENU_CD 값 검증.
    # 간단화: MENU_CD 를 포함한 모든 문자열 리터럴 중 'UI_' 로 시작하지 않는 것을 찾음.
    # 단, 'MENU_UTIL' 등 parent lookup 은 허용.
    #
    # 구현: INSERT INTO TB_AD_MENU 이후 등장하는 리터럴 중 (길이 4+ · 대문자+_+숫자 · _ 포함 · 'MENU_' 로 시작하지 않음 · 'UI_' 로 시작하지 않음)
    # 에 해당하는 첫번째 리터럴을 뽑아 block.
    #
    # 편의상 SELECT 구문 안의 VALUES 에서만 체크:  ',\n          '<LITERAL>',\n'  형태.

    # MENU_PATH 컬럼이 INSERT 컬럼 리스트에 포함되어야 leaf 메뉴 INSERT 로 간주
    if grep -qiE "\bMENU_PATH\b" <<<"$CONTENT"; then
      # 문자열 리터럴 중 (1) 대문자·숫자·언더스코어로만 구성 (2) 길이 4+ (3) 'UI_' 로 시작하지 않음
      #                   (4) 'MENU_' 로 시작하지 않음 (parent lookup 허용)
      #                   (5) 'composer' · 시스템 상수 등 제외
      #                   (6) '<.*>' 플레이스홀더(`'<NEW_MENU_CD>'`) 제외
      BAD_MENU_CD=$(grep -oE "'[A-Z][A-Z0-9_]{3,}'" <<<"$CONTENT" \
                    | sort -u \
                    | grep -vE "^'(UI_|MENU_)" \
                    | grep -vE "^'(Y|N|READ|UPDATE|DELETE|CREATE|UUID|ID|BOOKMARK|COMPOSER|SYSTEM|DRAFT|UPTODATE|STALE|CONFIRMED|CANDIDATE|MERGED|DEPRECATED|REVIEWING)'$" \
                    | head -1 || true)
      if [ -n "$BAD_MENU_CD" ]; then
        block "leaf 메뉴 MENU_CD 는 반드시 'UI_<DOMAIN>_<NAME>' 형식이어야 합니다. 감지: ${BAD_MENU_CD} → 'UI_${BAD_MENU_CD//\'/}' 로 수정. (DOMAIN: AD·BF·CM·DP·DPD·FO·FP·IM·MP·RP·SA·SALES·SO·UT)" \
              "rules/41-composer-generation.md §2, rules/99-anti-patterns.md CG15/CG16"
      fi
    fi

    # CG17. 소문자·하이픈 MENU_CD 금지
    if grep -qE "MENU_CD[[:space:]]*[,=]" <<<"$CONTENT"; then
      # VALUES/SELECT 에 등장하는 'ui_xxx' 소문자 패턴 또는 하이픈 포함
      if grep -qE "'[a-z][a-z0-9_-]*[a-z0-9]'" <<<"$CONTENT" \
         && grep -qE "INSERT[[:space:]]+INTO[[:space:]]+\[?TB_AD_MENU\]?" <<<"$CONTENT"; then
        # 단, MENU_PATH · MENU_FILE_PATH 의 소문자 리터럴(`/util/...`)은 슬래시로 시작하므로 다른 정규식
        # 대상: 슬래시/공백/경로 구분자 없는 pure 소문자 식별자 리터럴
        if grep -qE "'[a-z][a-z0-9_]{3,}'" <<<"$CONTENT" \
           && ! grep -qE "'\[?dbo\]?'" <<<"$CONTENT"; then
          # 경고만 (false positive 위험 — lang_cd 'ko'/'en'/'ja'/'zh' 는 길이 2 라 통과)
          warn "MENU_CD 는 UPPER_SNAKE_CASE 필수. 소문자 식별자 리터럴이 감지됨 — MENU_CD 값 확인 필요. (rules/99-anti-patterns.md CG17)"
        fi
      fi
    fi
  fi
fi


# KTNG Validator — TB_AD_MENU INSERT 실제 컬럼 화이트리스트
# 차단 조건 (M1~M3)
#
# 실제 컬럼 (KTNG 의 db_update_script.sql 분석 기준):
#   ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN,
#   CREATE_BY, CREATE_DTTM, MODIFY_BY, MODIFY_DTTM
# 존재 안 함: MENU_NM, PARENT_MENU_CD, URL, DEPTH, SORT_ORDER, DISPLAY_ORDER

case "$FILE_PATH" in
  *.sql) ;;
  *) return 0 ;;
esac

[ -z "$CONTENT" ] && return 0

# TB_AD_MENU 참조하는 경우만 검사
echo "$CONTENT" | grep -qiE '\bTB_AD_MENU\b' || return 0

# ─── M1. TB_AD_MENU 에 없는 컬럼 차단 ──────────────────────────────
for col in MENU_NM PARENT_MENU_CD URL DEPTH SORT_ORDER DISPLAY_ORDER; do
  # INSERT 컬럼 리스트 또는 UPDATE SET 절에서 등장하면 차단
  if echo "$CONTENT" | grep -qiE "TB_AD_MENU.*$col|$col\s*[,)=]" ; then
    # MENU_PATH 안의 '/url/...' 같은 경로는 컬럼명이 아니므로 제외
    if echo "$CONTENT" | grep -qiE "[,(]\s*$col\s*[,)]|SET\s+.*$col\s*=" ; then
      block "TB_AD_MENU 에 컬럼 '$col' 존재 안 함. 실제 컬럼: ID/PARENT_ID/MENU_CD/MENU_PATH/MENU_SEQ/MENU_FILE_PATH/USE_YN + BaseEntity (메뉴 표시명은 TB_AD_LANG_PACK 별도 등록)" "M1"
    fi
  fi
done

# ─── M2. PARENT_ID 자리에 MENU_CD 직접 INSERT 차단 ────────────────
# PARENT_ID 는 UUID FK — MENU_CD 문자열 직접 넣지 말 것
if echo "$CONTENT" | grep -qiE "INSERT\s+INTO\s+TB_AD_MENU.*PARENT_ID"; then
  if echo "$CONTENT" | grep -qiE "PARENT_ID.*'MENU_[A-Z_]+'"; then
    if ! echo "$CONTENT" | grep -qiE "SELECT\s+ID\s+FROM\s+TB_AD_MENU\s+WHERE\s+MENU_CD"; then
      warn "PARENT_ID 자리에 MENU_CD 문자열 직접 사용 의심 — (SELECT ID FROM TB_AD_MENU WHERE MENU_CD='...') 서브쿼리 권장 (M2)"
    fi
  fi
fi

# ─── M3. MSSQL only — Oracle NEWID 대응함수 차단 ───────────────────
if echo "$CONTENT" | grep -qiE '\bSYS_GUID\s*\(\)' && echo "$CONTENT" | grep -qiE '\bTB_AD_MENU\b'; then
  block "MSSQL 환경 — NEWID() 사용 (Oracle SYS_GUID() 금지)" "M3"
fi

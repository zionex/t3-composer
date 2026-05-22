# KTNG Validator — 자주 틀리는 컬럼 화이트리스트
# (TB_AD_LANG_PACK / TB_AD_USER / 등)

case "$FILE_PATH" in
  *.sql) ;;
  *) return 0 ;;
esac

[ -z "$CONTENT" ] && return 0

# ─── SW1. TB_AD_LANG_PACK 의 audit 컬럼 ──────────────────────────────
# 실제: MODIFY_BY/MODIFY_DTTM. 자주 틀림: UPDATE_BY/UPDATE_DTTM.
if echo "$CONTENT" | grep -qiE '\bTB_AD_LANG_PACK\b'; then
  if echo "$CONTENT" | grep -qiE '\bUPDATE_BY\b|\bUPDATE_DTTM\b'; then
    block "TB_AD_LANG_PACK 의 audit 컬럼은 MODIFY_BY/MODIFY_DTTM (★ UPDATE_BY/UPDATE_DTTM 존재 안 함)" "SW1"
  fi
fi

# ─── SW2. TB_AD_USER (운영 사용자) 컬럼 ──────────────────────────────
# 실제: ID/USERNAME/PASSWORD/DISPLAY_NAME/ENABLED.
# 흔한 환각: USER_ID/USER_NM (이는 TB_UT_USER_INFO 의 컬럼).
if echo "$CONTENT" | grep -qiE '\bTB_AD_USER\b'; then
  # 같은 파일이 TB_UT_USER_INFO 도 참조하면 그쪽 컬럼이라 제외
  if ! echo "$CONTENT" | grep -qiE '\bTB_UT_USER_INFO\b'; then
    if echo "$CONTENT" | grep -qiE 'TB_AD_USER[^_].*\b(USER_ID|USER_NM|USER_NAME)\b'; then
      warn "TB_AD_USER 의 컬럼은 ID/USERNAME/PASSWORD/DISPLAY_NAME/ENABLED — USER_ID/USER_NM 은 TB_UT_USER_INFO 의 컬럼 (SW2)"
    fi
  fi
fi

# ─── SW3. TB_UT_USER_INFO 컬럼 ──────────────────────────────────────
# 실제: USER_ID/USER_NM/USER_EMAIL/USER_TEL.
# 흔한 환각: EMAIL/PHONE.
if echo "$CONTENT" | grep -qiE '\bTB_UT_USER_INFO\b'; then
  if echo "$CONTENT" | grep -qiE 'TB_UT_USER_INFO[^_].*[,(\s]EMAIL\b'; then
    warn "TB_UT_USER_INFO 의 컬럼은 USER_EMAIL (★ EMAIL 아님) (SW3)"
  fi
  if echo "$CONTENT" | grep -qiE 'TB_UT_USER_INFO[^_].*[,(\s]PHONE\b'; then
    warn "TB_UT_USER_INFO 의 컬럼은 USER_TEL (★ PHONE 아님) (SW3)"
  fi
fi

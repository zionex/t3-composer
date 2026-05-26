# KTNG Validator — SQL · SP 네이밍 + 방언
# 차단 조건 (S1~S5)

case "$FILE_PATH" in
  *.sql) ;;
  *) return 0 ;;
esac

[ -z "$CONTENT" ] && return 0

base=$(basename "$FILE_PATH" .sql)

# ─── S1. KTNG SP 네이밍 정규식 ────────────────────────────────────────
# 정상: SP_UI_<DOMAIN>_KTNG_<NN>_<ACTION>  /  SP_COMM_KTNG_*  /  SP_<DOMAIN>_*
# 차단: SP_KTNG_<...>  (UI/COMM 누락) · SP_UI_KTNG_<...>  (도메인 누락)
if echo "$base" | grep -qE '^SP_'; then
  # KTNG SP 인데 도메인 누락
  if echo "$base" | grep -qE '^SP_UI_KTNG_'; then
    block "KTNG UI SP 는 SP_UI_<DOMAIN>_KTNG_<NN>_<ACTION> (도메인 코드 BF/CM/DP/IM/MP/RPT 필수)" "S1"
  fi
  if echo "$base" | grep -qE '^SP_KTNG_'; then
    block "KTNG SP 는 SP_UI_<DOMAIN>_KTNG_... 또는 SP_COMM_KTNG_... 형식 (UI/COMM prefix 누락)" "S1"
  fi
fi

# ─── S2. MSSQL 방언 강제 (SYSDATE/SYS_GUID Oracle 함수 차단) ──────────
if echo "$CONTENT" | grep -qiE '\bSYSDATE\b|\bSYS_GUID\s*\('; then
  block "KTNG DB 는 MSSQL — Oracle 함수 SYSDATE/SYS_GUID() 사용 금지. GETDATE()/NEWID() 사용" "S2"
fi

# ─── S3. PostgreSQL 함수 차단 (NOW()/CURRENT_TIMESTAMP 는 MSSQL 도 OK) ──
if echo "$CONTENT" | grep -qiE '\bgen_random_uuid\s*\(|\buuid_generate_v[14]\s*\('; then
  block "PostgreSQL UUID 함수 사용 금지. MSSQL 은 NEWID()" "S3"
fi

# ─── S4. 조회 SP — ORDER BY 권장 (warn 만) ───────────────────────────
if echo "$base" | grep -qE '^SP_UI_.+_Q[0-9]+$'; then
  if ! echo "$CONTENT" | grep -qiE '\bORDER\s+BY\b'; then
    warn "조회 SP 에 ORDER BY 누락 — 결정론적 정렬을 위해 PK/CODE/DATE 기반 정렬 권장 (S4)"
  fi
fi

# ─── S5. 저장 SP — TRY/CATCH 또는 트랜잭션 권장 (warn) ────────────────
if echo "$base" | grep -qE '^SP_UI_.+_(S|D)[0-9]+$'; then
  if ! echo "$CONTENT" | grep -qiE 'BEGIN\s+TRY|BEGIN\s+TRAN'; then
    warn "저장/삭제 SP 에 트랜잭션 또는 TRY/CATCH 누락 — 오류 시 부분 커밋 위험 (S5)"
  fi
fi

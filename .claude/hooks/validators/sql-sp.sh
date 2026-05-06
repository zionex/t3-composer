# T3 Validator — SQL / SP files (S1~S8 naming + ontology O3/O4/O7)

# =====================================================================
# 2. SQL / SP 파일 검증
# =====================================================================
if [[ "$FILE_PATH" == *.sql ]]; then

  FILENAME="$(basename "$FILE_PATH" .sql)"

  # S5. 시스템 SP 수정 금지
  case "$FILENAME" in
    sp_alterdiagram|sp_creatediagram|sp_dropdiagram|sp_helpdiagrams|sp_helpdiagramdefinition|sp_renamediagram|sp_upgraddiagrams|fn_diagramobjects)
      block "MSSQL 시스템 SP ($FILENAME) 수정 금지" "rules/99-anti-patterns.md S5"
      ;;
  esac

  # S1, S2. SP_UI_* 네이밍 정규식 (파일명 기준)
  if [[ "$FILENAME" == SP_UI_* ]] || [[ "$FILENAME" == sp_ui_* ]]; then
    # 대문자 SP_UI_ 만 허용
    if [[ "$FILENAME" != SP_UI_* ]]; then
      block "UI SP 는 대문자 'SP_UI_' 접두어 필수 (현재: $FILENAME)" "rules/31-stored-procedures.md §1"
    fi
    # DOMAIN_SCREENNO_ACTION 패턴
    if ! [[ "$FILENAME" =~ ^SP_UI_(AD|BF|CM|COMM|DP|DPD|FO|FP|IM|MP|RP|SA|SALES|SO|UT|TEST|UI|SAMPLE)_([0-9]{2,3}|[A-Z][A-Z0-9_]+)_(POP_|CHART_)?(Q[0-9]+|S[0-9]+|D[0-9]+|J[0-9]*|M[0-9]+|BATCH|COMBO|UPDATE|[A-Z][A-Z0-9_]+)$ ]]; then
      block "SP 네이밍 규약 위반: SP_UI_<DOMAIN>_<NO>_<ACTION> 형식 필요" "rules/31-stored-procedures.md §1, 정규식 §2"
    fi
  fi

  # S3. MSSQL 파일 작성 시 Oracle 대응 체크
  if [[ "$FILE_PATH" == */mssql/procedures/* ]]; then
    ORACLE_COUNTERPART="${FILE_PATH/\/mssql\//\/oracle\/}"
    if [ ! -f "$ORACLE_COUNTERPART" ]; then
      warn "Oracle 대응 파일 누락: $ORACLE_COUNTERPART (rules/99-anti-patterns.md S3)"
    fi
  fi

  # S8. DDL 은 upgrade/ 폴더 경유
  if [ -n "$CONTENT" ] && grep -qiE "CREATE[[:space:]]+TABLE|ALTER[[:space:]]+TABLE|DROP[[:space:]]+TABLE" <<<"$CONTENT"; then
    if [[ "$FILE_PATH" != *upgrade/v*-*/tables/* ]] && [[ "$FILE_PATH" != */ddl/* ]]; then
      warn "테이블 DDL 은 upgrade/vX.Y.Z-YYYYMMDD/tables/ 폴더 경유 권장 (rules/99-anti-patterns.md S8)"
    fi
  fi

  # O3. status='DRAFT' 안티패턴
  if [ -n "$CONTENT" ] && grep -qE "status[[:space:]]*=[[:space:]]*'DRAFT'" <<<"$CONTENT"; then
    # 온톨로지 쓰기 쿼리면 OK, 조회면 NG
    if grep -qiE "INSERT[[:space:]]+INTO|UPDATE[[:space:]]+" <<<"$CONTENT"; then
      : # 쓰기는 허용
    else
      block "status='DRAFT' 로 조회하지 말 것 — UPTODATE 만 답변 가능" "rules/99-anti-patterns.md O3, rules/10-ontology-first.md §3"
    fi
  fi

  # O4. TB_IS_QAPATTERN 사용 시 db_type 필터 필수
  if [ -n "$CONTENT" ] && grep -qi "TB_IS_QAPATTERN" <<<"$CONTENT"; then
    if ! grep -qiE "db_type[[:space:]]*=" <<<"$CONTENT"; then
      block "TB_IS_QAPATTERN 조회 시 db_type 필터 필수 (MSSQL/Oracle/PostgreSQL 답변 섞임 방지)" "rules/99-anti-patterns.md O4, rules/10-ontology-first.md §3"
    fi
  fi

  # O7. tb_is_ontlgy_entity_relation 사용 시 weight 필터 권장
  if [ -n "$CONTENT" ] && grep -q "tb_is_ontlgy_entity_relation" <<<"$CONTENT"; then
    if ! grep -qE "weight[[:space:]]*>=" <<<"$CONTENT"; then
      warn "entity_relation 조회 시 weight >= 0.5 필터 권장 (rules/99-anti-patterns.md O7)"
    fi
  fi
fi


# T3 Validator — SQL Schema Whitelist (재사용 테이블의 실제 컬럼 강제)
# Sourced by pre-tool-use-validator.sh
#
# ─────────────────────────────────────────────────────────────────────
# 배경 (why this validator exists):
#   2026-04 SP DDL 작성 시 LLM 이 오래된 테이블 DDL 만 보고 잘못된 컬럼명
#   (예: TB_UT_USER_INFO 의 EMAIL/PHONE — 실제 컬럼은 USER_EMAIL/USER_TEL)
#   을 사용한 SP 를 생성. 사용자 강력 차단 요청.
#
# 핵심 원칙 (rules/32-sql-schema-verification.md):
#   "SQL 작성 전 Entity / 카탈로그로 실제 컬럼 검증" — Java 만이 아니라 SQL
#   파일도 동일하게 검증되어야 한다.
#
# 검증 대상:
#   - .sql 파일 Write/Edit
#   - 잘 알려진 재사용 테이블 (TB_UT_USER_INFO 등) 을 참조하는 SP/뷰/스크립트
#   - 그 테이블의 실제 컬럼 화이트리스트와 비교
#
# 동작:
#   - 화이트리스트에 없고 black-list (오용 패턴) 에 있는 컬럼명 등장 시 block
# ─────────────────────────────────────────────────────────────────────

# .sql 파일이 아니면 패스
case "$FILE_PATH" in
  *.sql) ;;
  *) return 0 ;;
esac

# Edit 도구는 stdin 에 content 가 비어있을 수 있음
[ -z "$CONTENT" ] && return 0

# ─── TB_UT_USER_INFO — 실제 컬럼: USER_EMAIL · USER_TEL · JOIN_DT (PK USER_ID) ───
# 자주 잘못 사용되는 컬럼: EMAIL · PHONE · ID (UUID PK) · NO_SUCH_COL
if grep -qE '\bTB_UT_USER_INFO\b' <<<"$CONTENT"; then
  # 정답 컬럼명을 placeholder 로 치환 후 잔여 EMAIL/PHONE 검사
  # USER_EMAIL → __OK_USR_EMAIL__,  USER_TEL → __OK_USR_TEL__
  TEST_TEXT="$(echo "$CONTENT" \
      | sed 's/USER_EMAIL/__OK_USR_EMAIL__/g' \
      | sed 's/USER_TEL/__OK_USR_TEL__/g')"

  # bare EMAIL 사용 검사 (단어 경계 — 파라미터/별칭/식별자 모두 포함)
  if grep -qE '\bEMAIL\b' <<<"$TEST_TEXT"; then
    block "TB_UT_USER_INFO 에 'EMAIL' 컬럼은 존재하지 않습니다 — 실제 컬럼은 'USER_EMAIL' 입니다. SQL 작성 전 다음 두 가지를 반드시 확인하세요: (1) 대응 Entity 의 @Column(name=\"...\") (web/domain/util/userinfo/UserInfo.java) (2) 같은 SP 의 가장 최근 버전 (v1.0.0-20260427/procedures/SP_UI_UT_01_*.sql). 같은 테이블 DDL 이 여러 폴더에 있으면 가장 최신본 + Entity 가 진실 소스입니다." \
          "rules/32-sql-schema-verification.md §1, §2 + §1.7 (CLAUDE.md)"
  fi

  # bare PHONE 사용 검사
  if grep -qE '\bPHONE\b' <<<"$TEST_TEXT"; then
    block "TB_UT_USER_INFO 에 'PHONE' 컬럼은 존재하지 않습니다 — 실제 컬럼은 'USER_TEL' 입니다. SQL 작성 전 Entity (web/domain/util/userinfo/UserInfo.java) 또는 v1.0.0-20260427/procedures/SP_UI_UT_01_*.sql 의 컬럼명을 확인하세요." \
          "rules/32-sql-schema-verification.md §3 (TB_UT_USER_INFO 치트시트 추가)"
  fi

  # JOIN_DT 누락 — 데이터 입력 SP 에 INSERT 되어야 하는 정확한 이름
  # (실제로는 누락되어도 NULL 허용이므로 이것만으로는 block 안 함 — 화이트리스트 일관성 점검만)
fi

# ─── TB_AD_MENU — 실제 컬럼만 허용 (rules/30-database-schema.md §1.7) ───
# 자주 오용: MENU_NM · PARENT_MENU_CD · URL · DEPTH · SORT_ORDER · DISPLAY_ORDER · LINK
if grep -qE '\bTB_AD_MENU\b' <<<"$CONTENT"; then
  # 단, 이 테이블은 menu-sql.sh 가 더 상세히 검증하므로 핵심 케이스만
  if grep -qE '\b(MENU_NM|PARENT_MENU_CD)\b' <<<"$CONTENT"; then
    block "TB_AD_MENU 에 존재하지 않는 컬럼 사용 (MENU_NM 또는 PARENT_MENU_CD). 실제 컬럼: ID/PARENT_ID/MENU_CD/MENU_PATH/MENU_SEQ/MENU_FILE_PATH/USE_YN. 메뉴 표시명은 TB_AD_LANG_PACK 에 별도 등록." \
          "rules/30-database-schema.md §1.7 + rules/32-sql-schema-verification.md §3"
  fi
fi

# ─── TB_AD_LANG_PACK — UPDATE_BY/UPDATE_DTTM 컬럼 없음 (실제는 MODIFY_BY/MODIFY_DTTM) ───
if grep -qE '\bTB_AD_LANG_PACK\b' <<<"$CONTENT"; then
  if grep -qE '\b(UPDATE_BY|UPDATE_DTTM)\b' <<<"$CONTENT"; then
    block "TB_AD_LANG_PACK 에 'UPDATE_BY' 또는 'UPDATE_DTTM' 컬럼은 존재하지 않습니다 — 실제 컬럼은 'MODIFY_BY' / 'MODIFY_DTTM' 입니다." \
          "rules/32-sql-schema-verification.md §3 + 99-anti-patterns.md CP6"
  fi
fi

# ─── TB_AD_USER — 실제 컬럼: ID · USERNAME · PASSWORD · DISPLAY_NAME · ENABLED ───
#   자주 오용: USER_ID · USER_NM · USER_NAME (USER_ID/USER_NM 은 TB_UT_USER_INFO 컬럼 — 혼동)
#   2026-05 사고: 자연어 생성이 TB_AD_USER 화면 SP 를 USER_ID/USER_NM 으로 만들어
#                'Invalid column name USER_ID' 실행 실패. 기존 테이블은 실제 컬럼만 사용.
#   ※ TB_UT_USER_INFO 도 함께 참조하는 파일이면 USER_ID/USER_NM 이 정상이므로 제외.
if grep -qE '\bTB_AD_USER\b' <<<"$CONTENT" && ! grep -qE '\bTB_UT_USER_INFO\b' <<<"$CONTENT"; then
  if grep -qE '\b(USER_ID|USER_NM|USER_NAME)\b' <<<"$CONTENT"; then
    block "TB_AD_USER 에 'USER_ID' / 'USER_NM' / 'USER_NAME' 컬럼은 존재하지 않습니다 — 실제 컬럼은 ID · USERNAME · PASSWORD · DISPLAY_NAME · ENABLED 입니다. (USER_ID/USER_NM 은 TB_UT_USER_INFO 의 컬럼) 기존 테이블을 쓰는 화면은 CREATE TABLE 을 새로 만들지 말고, 실제 컬럼명만 확인 후 SP 를 작성하세요." \
          "rules/32-sql-schema-verification.md §3 + rules/30-database-schema.md §5"
  fi
fi

# ─── 운영 코어 재사용 테이블에 CREATE TABLE 금지 (2026-05-16 사고) ───
#   배경: 자동 테이블 검증(ComposerService.enrichUserContentWithTableLookup)이 세션 Target
#         이 아닌 잘못된 DB 를 조회해 "미존재" 오판 → LLM 이 이미 존재하는 코어 테이블에
#         CREATE TABLE 을 생성하거나, 비슷한 다른 테이블(TB_AD_USER → TB_UT_USER_INFO)로
#         대체. 이 테이블들은 운영 DB 의 영속 코어 — 새로 만들면 충돌·데이터 유실.
#   원칙: 코어 테이블은 항상 '기존 컬럼으로 매핑'. CREATE TABLE 절대 금지.
CORE_TABLES='TB_AD_USER|TB_UT_USER_INFO|TB_AD_MENU|TB_AD_LANG_PACK|TB_AD_PERMISSION_GROUP|TB_AD_COMN_CODE|TB_AD_COMN_GRP|TB_AD_AUTHORITY'
if grep -qiE "CREATE[[:space:]]+TABLE[[:space:]]+(\[?dbo\]?\.)?\[?(${CORE_TABLES})\b" <<<"$CONTENT"; then
  HITCORE="$(grep -oiE "(${CORE_TABLES})" <<<"$CONTENT" | head -1)"
  block "운영 코어 테이블에 CREATE TABLE 생성 금지 — '${HITCORE}'. 이 테이블들(TB_AD_USER · TB_UT_USER_INFO · TB_AD_MENU · TB_AD_LANG_PACK · TB_AD_PERMISSION_GROUP · TB_AD_COMN_CODE 등)은 운영 DB 에 이미 존재하는 영속 코어 테이블입니다. 새로 만들면 기존 데이터와 충돌·유실됩니다. 사용자가 이 테이블을 데이터 소스로 선택했다면 INFORMATION_SCHEMA / Entity 로 실제 컬럼을 확인해 기존 테이블 그대로 Entity·SP 를 작성하세요 (CREATE TABLE 금지)." \
        "rules/32-sql-schema-verification.md §0 + rules/50 §13.7"
fi

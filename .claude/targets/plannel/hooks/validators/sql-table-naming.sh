# PlanNEL Validator — SQL 테이블 네이밍 + Liquibase
# Sourced by pre-tool-use-validator.sh
#
# 검증:
#   1. CREATE TABLE TB_* 차단 (T3Series 컨벤션)
#   2. CREATE TABLE 의 테이블명이 z_ prefix 시작 + lowercase + snake_case 권장
#   3. boolean 컬럼이 BOOLEAN 타입 → CHAR(1) Y/N 권장
#   4. ID 컬럼이 SERIAL → BIGINT DEFAULT zionex.next_unique_id() 권장
#   5. Liquibase changelog 안 createTable 의 컬럼 누락 (audit 6컬럼) 검사
#
# 참조: rules/40-database-schema.md · rules/99-anti-patterns.md DB1~DB10

case "$FILE_PATH" in
  *.sql) ;;
  *.yaml|*.yml)
    # Liquibase changelog 일 때만 (path 에 changelog 또는 db.changelog 포함)
    case "$FILE_PATH" in
      *changelog*|*db.changelog*) ;;
      *) return 0 ;;
    esac
    ;;
  *) return 0 ;;
esac
[ -z "$CONTENT" ] && return 0

# ─── 1. CREATE TABLE TB_* 차단 ────────────────────────────────────
# T3Series 의 TB_<DOMAIN>_* 컨벤션 차단
if grep -qiE 'CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?(\w+\.)?TB_' <<<"$CONTENT"; then
  block "CREATE TABLE TB_* 사용 금지 — PlanNEL 의 비즈니스 테이블은 'z_<lowercase_snake>' prefix 사용. (예: z_customer, z_item, z_dp_version)" \
        "rules/40-database-schema.md §2.1 · rules/99-anti-patterns.md DB2"
fi

# Liquibase yaml 의 createTable - tableName: TB_*
if grep -qiE '^\s*tableName\s*:\s*TB_' <<<"$CONTENT"; then
  block "Liquibase changeset 의 tableName: TB_* 사용 금지 — 'z_<lowercase>' 사용." \
        "rules/40-database-schema.md §2.1 · rules/99-anti-patterns.md DB2"
fi

# ─── 2. 신규 z_* 테이블이면 컨벤션 검증 ──────────────────────────────
# 테이블명 추출
TABLE_NAMES=$(grep -oiE 'CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?(\w+\.)?[a-zA-Z_][a-zA-Z0-9_]*' <<<"$CONTENT" \
  | sed -E 's/.*TABLE\s+(IF\s+NOT\s+EXISTS\s+)?(\w+\.)?//I' \
  | tr '[:upper:]' '[:lower:]' || true)

if [ -n "$TABLE_NAMES" ]; then
  while IFS= read -r tname; do
    [ -z "$tname" ] && continue
    # public.tenant 등 시스템 테이블은 예외
    case "$tname" in
      tenant|role|qrtz_*|public.*) continue ;;
    esac
    # z_ 로 시작 안 하면 warn
    if [[ "$tname" != z_* ]]; then
      warn "테이블 '$tname' 은 'z_' prefix 권장 (PlanNEL 비즈니스 테이블 컨벤션). 시스템 테이블이면 public.* 명시." \
           "rules/40-database-schema.md §2.1"
    fi
    # 대문자 포함 시 차단
    if [[ "$tname" =~ [A-Z] ]]; then
      block "테이블명 '$tname' 에 대문자 포함 — PostgreSQL 권장 lowercase + snake_case." \
            "rules/40-database-schema.md §2.1 · rules/99-anti-patterns.md DB3"
    fi
  done <<< "$TABLE_NAMES"
fi

# ─── 3. boolean 컬럼이 BOOLEAN 타입 → CHAR(1) 권장 ──────────────────
# `<col_name> BOOLEAN` 패턴 발견 시 warn (BooleanToYNConverter 호환을 위해 CHAR(1) 권장)
if grep -qiE '\b[a-z_]+_flg\s+BOOLEAN\b' <<<"$CONTENT"; then
  warn "boolean 플래그 컬럼이 BOOLEAN 타입 — PlanNEL 은 CHAR(1) + Y/N 권장 (BooleanToYNConverter 호환)." \
       "rules/40-database-schema.md §3.1 · rules/99-anti-patterns.md DB4"
fi

# ─── 4. ID 컬럼이 SERIAL / BIGSERIAL → BIGINT DEFAULT next_unique_id() 권장 ─
if grep -qiE '\bid\s+(SERIAL|BIGSERIAL)\b' <<<"$CONTENT"; then
  warn "id 컬럼이 SERIAL/BIGSERIAL — PlanNEL 은 'BIGINT NOT NULL DEFAULT zionex.next_unique_id()' (Instagram-style ID) 사용." \
       "rules/40-database-schema.md §4 · rules/99-anti-patterns.md DB5"
fi

# ─── 5. CREATE TABLE 시 audit 컬럼 누락 검사 ────────────────────────
# CREATE TABLE z_* 발견하면 같은 statement 안에 created_ts / updated_ts 있는지 확인
# 간단 휴리스틱: 전체 파일에서 z_* CREATE 가 있으면 created_ts / updated_ts / ver_num 도 있어야
if grep -qiE 'CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?(\w+\.)?z_' <<<"$CONTENT"; then
  MISSING=()
  grep -qiE '\bcreated_ts\b' <<<"$CONTENT" || MISSING+=("created_ts")
  grep -qiE '\bcreated_by\b' <<<"$CONTENT" || MISSING+=("created_by")
  grep -qiE '\bupdated_ts\b' <<<"$CONTENT" || MISSING+=("updated_ts")
  grep -qiE '\bupdated_by\b' <<<"$CONTENT" || MISSING+=("updated_by")
  grep -qiE '\bver_num\b' <<<"$CONTENT" || MISSING+=("ver_num")

  if [ "${#MISSING[@]}" -gt 0 ]; then
    warn "z_* 테이블 CREATE 에 audit 컬럼 누락 가능: ${MISSING[*]} — BaseEntity 와 매핑 위해 6컬럼 (id/created_ts/created_by/updated_ts/updated_by/ver_num) 필수." \
         "rules/40-database-schema.md §3.2 · rules/99-anti-patterns.md DB6"
  fi
fi

# ─── 6. public.* 에 비즈니스 테이블 추가 차단 ───────────────────────
# CREATE TABLE public.z_* 또는 public.<business> (단, public.tenant / public.role / public.QRTZ_* 예외)
if grep -qiE 'CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?public\.z_' <<<"$CONTENT"; then
  block "public.z_* 테이블 생성 금지 — public schema 는 시스템 only (tenant, role, QRTZ_*). 비즈니스 테이블은 테넌트 schema." \
        "rules/40-database-schema.md §1 · rules/99-anti-patterns.md DB7"
fi

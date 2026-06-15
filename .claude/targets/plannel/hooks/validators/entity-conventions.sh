# PlanNEL Validator — Entity 컨벤션
# Sourced by pre-tool-use-validator.sh
#
# 검증:
#   1. @Table(name = "TB_*") 차단 (T3Series 컨벤션) — z_* 강제
#   2. @Entity 클래스가 BaseEntity 상속하는지 warn
#   3. boolean 필드에 @Convert(BooleanToYNConverter) 누락 warn
#   4. @ManyToOne 위에 @JsonIgnore 누락 warn
#   5. SP_UI_*.sql 파일 생성 차단 (PlanNEL 은 SP 사용 안 함)
#
# 참조: rules/30-data-access.md §4 · rules/40-database-schema.md · rules/99-anti-patterns.md BE1, BE2

# ─── A. SQL 파일: SP_UI_*.sql 파일명 차단 ──────────────────────────
case "$FILE_PATH" in
  */SP_UI_*.sql|*/sp_ui_*.sql)
    block "SP_UI_*.sql 파일 생성 금지 — PlanNEL 은 Stored Procedure 사용 안 함. JPA Repository / QueryDSL / MyBatis 사용." \
          "rules/99-anti-patterns.md W14, W15 · rules/30-data-access.md §5"
    ;;
esac

# ─── B. Java Entity 검증 ───────────────────────────────────────────
[[ "$FILE_PATH" != *.java ]] && return 0
[ -z "$CONTENT" ] && return 0

# @Entity 가 있는 파일만 대상
grep -qE '^\s*@Entity\b' <<<"$CONTENT" || return 0

# 1. @Table(name = "TB_...") 차단 — T3Series 컨벤션
if grep -qE '@Table\s*\(\s*name\s*=\s*"TB_' <<<"$CONTENT"; then
  block "@Table(name = \"TB_*\") 사용 금지 — PlanNEL 은 'z_<lowercase_snake>' prefix 사용." \
        "rules/40-database-schema.md §2.1 · rules/99-anti-patterns.md DB2"
fi

# 2. @Table name 이 z_ 로 시작하는지 (있다면)
if grep -qE '@Table\s*\(\s*name\s*=\s*"' <<<"$CONTENT"; then
  # @Table(name = "...") 매칭 후 따옴표 안의 값만 추출 (greedy 매칭 회피)
  TABLE_NAME=$(grep -oE '@Table\s*\(\s*name\s*=\s*"[^"]+"' <<<"$CONTENT" \
               | head -1 \
               | grep -oE '"[^"]+"' \
               | tr -d '"')
  if [ -n "$TABLE_NAME" ] && [[ "$TABLE_NAME" != z_* ]]; then
    warn "@Table(name = \"$TABLE_NAME\") — PlanNEL 의 비즈니스 테이블은 'z_' prefix 권장. (예외: public.* 시스템 테이블)" \
         "rules/40-database-schema.md §2.1 · rules/99-anti-patterns.md DB2"
  fi
fi

# 3. BaseEntity 상속 확인 (Entity 인데 extends BaseEntity 없으면 warn)
if ! grep -qE 'extends\s+BaseEntity\b' <<<"$CONTENT"; then
  warn "@Entity 가 BaseEntity 상속 없음 — audit 컬럼 (createdTs/createdBy/updatedTs/updatedBy/verNum) 누락 가능. 't3series.saas.multi_tenancy.model.BaseEntity' 상속 권장." \
       "rules/30-data-access.md §4.2 · rules/40-database-schema.md §3.2"
fi

# 4. boolean 필드에 @Convert(BooleanToYNConverter) 누락 warn
# `private boolean xxxFlg;` 패턴 발견하고 그 위 5줄 안에 @Convert 가 없는 경우
# (간단한 정규식으로는 정확한 위치 매칭 어려움 → 전체 파일에서 boolean 필드 수와 @Convert 수 비교)
BOOLEAN_FIELD_COUNT=$(grep -cE '^\s*private\s+boolean\s+[a-zA-Z][a-zA-Z0-9]*\s*;' <<<"$CONTENT" || true)
CONVERT_COUNT=$(grep -cE '@Convert\s*\(\s*converter\s*=\s*BooleanToYNConverter' <<<"$CONTENT" || true)
if [ "$BOOLEAN_FIELD_COUNT" -gt 0 ] && [ "$CONVERT_COUNT" -lt "$BOOLEAN_FIELD_COUNT" ]; then
  warn "Entity 의 boolean 필드 ($BOOLEAN_FIELD_COUNT 개) 중 일부가 @Convert(converter = BooleanToYNConverter.class) 누락 — DB 의 'Y/N' CHAR(1) 와 매핑 안 될 수 있음." \
       "rules/30-data-access.md §4.3 · rules/99-anti-patterns.md BE2"
fi

# 5. @ManyToOne 위에 @JsonIgnore 누락 warn
# @ManyToOne 출현 횟수 vs @JsonIgnore + @ManyToOne 인접 패턴
MANY_TO_ONE_COUNT=$(grep -cE '^\s*@ManyToOne\b' <<<"$CONTENT" || true)
if [ "$MANY_TO_ONE_COUNT" -gt 0 ]; then
  # @JsonIgnore 가 전혀 없는 경우 (대부분의 entity 에서 양방향 관계는 @JsonIgnore 필요)
  if ! grep -qE '@JsonIgnore' <<<"$CONTENT"; then
    warn "@ManyToOne 관계 ($MANY_TO_ONE_COUNT 개) 가 있는데 @JsonIgnore 가 전혀 없음 — JSON 직렬화 시 무한 순환 (StackOverflow) 위험. @ManyToOne 위에 @JsonIgnore 추가 권장." \
         "rules/30-data-access.md §4.1 · rules/99-anti-patterns.md BE1"
  fi
fi

# 6. id 필드에 @GeneratedValue(strategy = GenerationType.IDENTITY) 권장
if grep -qE '@Id\b' <<<"$CONTENT"; then
  if ! grep -qE 'GenerationType\.IDENTITY' <<<"$CONTENT"; then
    warn "@Id 필드에 @GeneratedValue(strategy = GenerationType.IDENTITY) 누락 — PlanNEL 은 PostgreSQL DEFAULT zionex.next_unique_id() 활용 (IDENTITY 전략)." \
         "rules/40-database-schema.md §4"
  fi
fi

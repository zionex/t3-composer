# awk script — T-SQL 의 `IF OBJECT_ID(...) IS NULL BEGIN CREATE TABLE ...; ...; END`
# 패턴을 PG 의 `CREATE TABLE IF NOT EXISTS ...; CREATE INDEX IF NOT EXISTS ...;` 로 변환.
#
# 부수: 모든 `CREATE TABLE <name>` → `CREATE TABLE IF NOT EXISTS <name>`
#       모든 `CREATE INDEX <name>` → `CREATE INDEX IF NOT EXISTS <name>`
#       단 이미 "IF NOT EXISTS" 가 있으면 중복 추가 금지.

BEGIN { skip_state = 0; in_addprop = 0 }

# DECLARE @VAR <type> = 'value';  — T-SQL 변수 → inline 치환
# 본문에 등장하는 @VAR 을 'value' 로 직접 교체. DECLARE 행 자체는 주석 처리.
/^[[:space:]]*DECLARE[[:space:]]+@/ {
    if (match($0, /@[A-Za-z_][A-Za-z0-9_]*/)) {
        var = substr($0, RSTART, RLENGTH)
        if (match($0, /=[[:space:]]*'[^']*'/)) {
            val = substr($0, RSTART, RLENGTH)
            sub(/^=[[:space:]]*/, "", val)
            var_value[var] = val
        }
    }
    print "-- " $0
    next
}

# EXEC sys.sp_addextendedproperty ... ; — 다음 ';' 까지 통째 주석 처리
# (PG 의 COMMENT ON COLUMN/TABLE 으로 변환할 수도 있으나 init 에 비필수)
/^[[:space:]]*EXEC[[:space:]]+sys\.sp_addextendedproperty/ {
    in_addprop = 1
    print "-- " $0
    next
}
in_addprop == 1 {
    print "-- " $0
    if ($0 ~ /;[[:space:]]*$/) in_addprop = 0
    next
}

# Step 1 — IF OBJECT_ID(...) IS NULL 줄 만나면 skip_state=1, 이 줄 자체 삭제
/^[[:space:]]*IF[[:space:]]+OBJECT_ID\(.*\)[[:space:]]+IS[[:space:]]+(NULL|NOT[[:space:]]+NULL)/ {
    if (match($0, /IS[[:space:]]+NOT[[:space:]]+NULL/)) {
        # IS NOT NULL — DROP TABLE/PROCEDURE 등 패턴. 단순화: 줄 제거 + 다음 BEGIN/END 도 제거.
        # 실제 코드 본문은 IF NOT EXISTS 보존이 안 되지만 init 단계 멱등성은 IF NOT EXISTS 로 충분.
        skip_state = 1
    } else {
        skip_state = 1
    }
    next
}

# Step 2 — skip_state=1 직후 BEGIN 만나면 skip_state=2, 줄 제거
skip_state == 1 && /^[[:space:]]*BEGIN[[:space:]]*$/ {
    skip_state = 2
    next
}

# Step 3 — skip_state=2 중 END 만나면 skip_state=0, 줄 제거
skip_state == 2 && /^[[:space:]]*END[[:space:]]*$/ {
    skip_state = 0
    next
}

# 본문 처리
{
    # 알려진 @VAR 을 inline 치환 (T-SQL DECLARE 처리)
    for (v in var_value) {
        gsub(v, var_value[v])
    }

    # CREATE TABLE <name> → CREATE TABLE IF NOT EXISTS <name>
    # (이미 IF NOT EXISTS 가 있으면 건너뜀)
    if ($0 ~ /^[[:space:]]*CREATE[[:space:]]+TABLE[[:space:]]/ && $0 !~ /IF[[:space:]]+NOT[[:space:]]+EXISTS/) {
        sub(/CREATE[[:space:]]+TABLE/, "CREATE TABLE IF NOT EXISTS")
    }
    # CREATE [UNIQUE] INDEX <name> → CREATE [UNIQUE] INDEX IF NOT EXISTS <name>
    if ($0 ~ /^[[:space:]]*CREATE[[:space:]]+(UNIQUE[[:space:]]+)?INDEX[[:space:]]/ && $0 !~ /IF[[:space:]]+NOT[[:space:]]+EXISTS/) {
        # UNIQUE 키워드 보존 위해 INDEX 단어만 치환
        sub(/INDEX[[:space:]]/, "INDEX IF NOT EXISTS ")
    }
    # DROP TABLE/INDEX/PROCEDURE/FUNCTION/VIEW → IF EXISTS 추가
    if ($0 ~ /^[[:space:]]*DROP[[:space:]]+(TABLE|INDEX|PROCEDURE|FUNCTION|VIEW)[[:space:]]/ && $0 !~ /IF[[:space:]]+EXISTS/) {
        sub(/DROP[[:space:]]+TABLE/, "DROP TABLE IF EXISTS")
        sub(/DROP[[:space:]]+INDEX/, "DROP INDEX IF EXISTS")
        sub(/DROP[[:space:]]+PROCEDURE/, "DROP PROCEDURE IF EXISTS")
        sub(/DROP[[:space:]]+FUNCTION/, "DROP FUNCTION IF EXISTS")
        sub(/DROP[[:space:]]+VIEW/, "DROP VIEW IF EXISTS")
    }
    print
}

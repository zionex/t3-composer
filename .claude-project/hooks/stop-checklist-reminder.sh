#!/usr/bin/env bash
# =====================================================================
# KTNG — Stop Checklist Reminder
# =====================================================================
# Claude 가 응답을 마치는 시점에 실행. 최근 변경된 KTNG 파일이 있으면
# 신규 화면 작업의 체크리스트를 리마인드.
# =====================================================================

set -uo pipefail

. "$(dirname "${BASH_SOURCE[0]}")/_jq-fallback.sh"

ROOT="${T3_TARGET_REPO:-c:/vs_project/KTNG}"
[ ! -d "$ROOT/.git" ] && exit 0

# 최근 staged + working tree 변경
CHANGED=$(git -C "$ROOT" status --porcelain 2>/dev/null | awk '{print $2}')
[ -z "$CHANGED" ] && exit 0

# KTNG 관련 변경 감지
HAS_JSX=$(echo "$CHANGED" | grep -E '\.jsx?$' | head -1)
HAS_JAVA=$(echo "$CHANGED" | grep -E '\.java$' | head -1)
HAS_SQL=$(echo "$CHANGED" | grep -E '\.sql$' | head -1)
HAS_KTNG=$(echo "$CHANGED" | grep -E 'ktng' | head -1)

if [ -z "$HAS_JSX" ] && [ -z "$HAS_JAVA" ] && [ -z "$HAS_SQL" ] && [ -z "$HAS_KTNG" ]; then
  exit 0
fi

cat >&2 <<EOF

📋 KTNG 변경 체크리스트 (참고)

작업 마감 전 다음 점검:
EOF

[ -n "$HAS_JSX" ] && cat >&2 <<EOF
[JSX]
  □ import 가 @wingui/common/imports 단일 경로?
  □ gridItems 가 컴포넌트 밖 선언 + 모든 컬럼에 dataType?
  □ BaseGrid items={...} afterGridCreate={...}?
  □ grid 버튼 prop 이 문자열 id?
EOF

[ -n "$HAS_JAVA" ] && cat >&2 <<EOF
[Java]
  □ jakarta.* import (javax.* 없음)?
  □ @ExecPermission(menuCd, type) 모든 엔드포인트에 명시?
  □ @PostMapping 일관 (GET 안 씀)?
  □ QueryHandler.getList/save (JdbcTemplate 직접 X)?
  □ @RequestBody List<Map<String,Object>> changes (multipart 아님)?
EOF

[ -n "$HAS_SQL" ] && cat >&2 <<EOF
[SQL]
  □ SP 네이밍 SP_UI_<DOMAIN>_KTNG_<NN>_<ACTION>?
  □ MSSQL 방언 (NEWID/GETDATE — Oracle/PG 함수 없음)?
  □ 조회 SP 에 결정론적 ORDER BY?
  □ TB_AD_MENU 실제 컬럼만 (MENU_NM/PARENT_MENU_CD/URL 없음)?
EOF

[ -n "$HAS_KTNG" ] && cat >&2 <<EOF
[KTNG 통합]
  □ MENU_CD = UI_<DOMAIN>_KTNG_<NN>?
  □ Java 패키지 com.zionex.t3series.web.ktng.<...>?
  □ JSX 경로 view/ktng/<도메인>/<카테고리>/<feature>/?
  □ TB_AD_MENU INSERT + TB_AD_LANG_PACK 4언어 + TB_AD_PERMISSION_GROUP?
EOF

exit 0

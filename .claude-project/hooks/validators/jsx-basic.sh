# KTNG Validator — JSX 기본 (BaseGrid prop · 한글 i18n · import 경로)
# 차단 조건 (JX1~JX6)

case "$FILE_PATH" in
  *.jsx) ;;
  *) return 0 ;;
esac

[ -z "$CONTENT" ] && return 0

# ─── JX1. BaseGrid prop — items / afterGridCreate (★ columns / afterCreate 아님) ──
if echo "$CONTENT" | grep -qE '<BaseGrid[^>]*\bcolumns\s*='; then
  block "BaseGrid prop 은 items={...} (★ columns 아님)" "JX1"
fi
if echo "$CONTENT" | grep -qE '<BaseGrid[^>]*\bafterCreate\s*='; then
  block "BaseGrid prop 은 afterGridCreate={...} (★ afterCreate 아님)" "JX1"
fi

# ─── JX2. grid API — setData/getChangedData/getChanges 차단 ────────────
if echo "$CONTENT" | grep -qE '\.setData\s*\(|\.getChangedData\s*\(|grid\.getChanges\s*\('; then
  block "grid API 는 grid.dataProvider.fillJsonData / getAllStateRows / getJsonRow (또는 KTNG 의 grid._dataProvider 호환)" "JX2"
fi

# ─── JX3. import 경로 — @wingui/common/imports 단일 ────────────────────
# @wingui/common/store/* 직접 import 차단
if echo "$CONTENT" | grep -qE "from\s+['\"]@wingui/common/store/"; then
  warn "store import 는 '@wingui/common/imports' 단일 경로 권장 (JX3)"
fi

# ─── JX4. showMessage 첫 인자가 type 토큰 ────────────────────────────
if echo "$CONTENT" | grep -qE "showMessage\s*\(\s*['\"](confirm|error|info|warn|alert)['\"]\s*,"; then
  block "showMessage 첫 인자는 제목 문자열 ('확인' 등). 'confirm'/'error' 등 토큰 아님" "JX4"
fi

# ─── JX5. Grid 버튼 grid prop = 문자열 id (객체 ref 금지) ──────────────
# <GridSaveButton grid={gridRef}> 같은 패턴 차단 — KTNG 도 동일 규약
if echo "$CONTENT" | grep -qE '<Grid(Save|Delete(Row)?|AddRow|Excel(Export|Import))Button[^>]*\bgrid=\{[^"'"'"']'; then
  warn "Grid 버튼 grid prop 은 문자열 id 권장 (예: grid=\"grid1\"). 객체 ref 사용 시 의도 확인 (JX5)"
fi

# ─── JX6. material-icons 텍스트 아이콘 차단 ──────────────────────────
if echo "$CONTENT" | grep -qE 'className=["'"'"']material-icons["'"'"']'; then
  block "Material Icons 폰트 텍스트 사용 금지 — '@mui/icons-material/...' import 사용" "JX6"
fi

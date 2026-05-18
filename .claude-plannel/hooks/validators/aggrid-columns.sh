# PlanNEL Validator — AG-Grid 컬럼 컨벤션
# Sourced by pre-tool-use-validator.sh
#
# 차단 (RealGrid2 환각):
#   - 컬럼 객체에 'headerText:' (RealGrid 키) — AG-Grid 는 'headerName:'
#   - 'dataType:' (RealGrid) — AG-Grid 는 'cellClass: stringType' 또는 type:["rightAligned"|"booleanColumn"|"nonEditableColumn"]
#   - 'textAlignment:' (RealGrid) — AG-Grid 는 type:["rightAligned"]
#   - 'editor: { type: ... }' (RealGrid) — AG-Grid 는 cellEditor:'agDateCellEditor' 등
#   - grid.dataProvider.fillJsonData / getAllStateRows (RealGrid) — AG-Grid 는 setRows + DataState.getStateData
#
# 참조: rules/21-components.md §3 · rules/99-anti-patterns.md W2~W4, W28

case "$FILE_PATH" in
  *.jsx|*.js|*.ts|*.tsx) ;;
  *) return 0 ;;
esac
[ -z "$CONTENT" ] && return 0

# ─── 1. AgGridReact 또는 columnDefs 가 등장하는 파일만 검사 ───────
# (검색조건 컴포넌트 등 그리드 없는 파일은 패스)
if ! grep -qE '\b(AgGridReact|columnDefs)\b' <<<"$CONTENT"; then
  return 0
fi

# ─── 2. RealGrid 컬럼 키 차단 ──────────────────────────────────────
# headerText: 'X' (RealGrid) → headerName: 'X' (AG-Grid)
if grep -qE '\bheaderText\s*:' <<<"$CONTENT"; then
  block "컬럼 객체에 'headerText:' 사용 금지 (RealGrid 컨벤션) — AG-Grid 는 'headerName:' 사용. 예: { headerName: 'customerCd', field: 'customerCd' }" \
        "rules/21-components.md §3.1 · rules/99-anti-patterns.md W28"
fi

# textAlignment: 'far' / 'center' / 'left' (RealGrid) → type:["rightAligned"] (AG-Grid)
if grep -qE '\btextAlignment\s*:' <<<"$CONTENT"; then
  block "컬럼 객체에 'textAlignment:' 사용 금지 (RealGrid 컨벤션) — AG-Grid 는 type:[\"rightAligned\"] 또는 cellStyle 사용." \
        "rules/21-components.md §3.2 · rules/99-anti-patterns.md W28"
fi

# dataType: 'text' / 'number' / 'boolean' / 'datetime' (RealGrid) — AG-Grid 는 filterType
if grep -qE "\bdataType\s*:\s*['\"](text|number|boolean|datetime|group)['\"]" <<<"$CONTENT"; then
  block "컬럼 객체에 'dataType: ...' 사용 금지 (RealGrid 컨벤션) — AG-Grid 는 'filterType:' (string/number/boolean/timestamp) + 'cellClass: stringType' 사용." \
        "rules/21-components.md §3.3 · rules/99-anti-patterns.md W28"
fi

# editor: { type: 'date' / 'number' } (RealGrid) → cellEditor (AG-Grid)
if grep -qE "\beditor\s*:\s*\{\s*type\s*:" <<<"$CONTENT"; then
  block "컬럼 객체에 'editor: { type: ... }' 사용 금지 (RealGrid 컨벤션) — AG-Grid 는 cellEditor:'agDateCellEditor' 또는 GridDatePicker / NumericEditor 사용." \
        "rules/21-components.md §3 · rules/99-anti-patterns.md W28"
fi

# useDropdown / lookupDisplay (RealGrid) — AG-Grid 는 cellEditor:'agSelectCellEditor'
if grep -qE '\b(useDropdown|lookupDisplay)\s*:' <<<"$CONTENT"; then
  warn "컬럼 객체에 'useDropdown' / 'lookupDisplay' 사용 (RealGrid 컨벤션) — AG-Grid 는 cellEditor:'agSelectCellEditor' + cellEditorParams: { values: [...] } 사용 권장." \
       "rules/21-components.md §3 · rules/99-anti-patterns.md W28"
fi

# ─── 3. RealGrid grid API 차단 ────────────────────────────────────
# grid.dataProvider.fillJsonData(rows) → setRows(rows)
if grep -qE '\.dataProvider\.fillJsonData\b' <<<"$CONTENT"; then
  block "grid.dataProvider.fillJsonData() 사용 금지 (RealGrid API) — AG-Grid 는 React state 변경 (setRows(rows)) 으로 자동 리렌더." \
        "rules/21-components.md §3.1 · rules/99-anti-patterns.md W3"
fi
# grid.dataProvider.getAllStateRows / getJsonRow
if grep -qE '\.dataProvider\.(getAllStateRows|getJsonRow)\b' <<<"$CONTENT"; then
  block "grid.dataProvider.getAllStateRows() / getJsonRow() 사용 금지 (RealGrid API) — AG-Grid 는 'DataState.getStateData(api, \"created\")' / 'getStateData(api, \"updated\")' 사용." \
        "rules/21-components.md §3.5 · rules/99-anti-patterns.md W4, W24"
fi

# RealGrid 의 afterGridCreate (PlanNEL 은 onGridReady)
if grep -qE '\bafterGridCreate\b' <<<"$CONTENT"; then
  block "afterGridCreate 사용 금지 (RealGrid 컨벤션) — AG-Grid 는 onGridReady={(params) => { DataState.initialize(params.api); ... }} 사용." \
        "rules/20-screen-development.md §3 · rules/99-anti-patterns.md W2"
fi

# ─── 4. wingui Pop* 컴포넌트 (이미 import 단계에서 막혔지만 이중 안전망) ─
if grep -qE '<Pop(SelectItem|SelectAccount|SelectLocation|Department|Position|ItemMulti|AccountMulti)' <<<"$CONTENT"; then
  block "<Pop*> 컴포넌트 사용 금지 (T3Series wingui 컨벤션) — PlanNEL 은 <ItemAutocomplete> / <CustomerAutocomplete> / <LocationFilter> 등 (@plannel/components/filter/...) 사용." \
        "rules/21-components.md §2 · rules/99-anti-patterns.md W7"
fi

# CommonCodeSelect (wingui)
if grep -qE '<CommonCodeSelect\s+groupCd' <<<"$CONTENT"; then
  block "<CommonCodeSelect groupCd=\"...\" /> 사용 금지 (T3Series wingui 컨벤션) — PlanNEL 은 MUI <Select> + <MenuItem> + 자체 lookup service (예: customerService.getLookup()) 사용." \
        "rules/21-components.md §9 · rules/99-anti-patterns.md W8"
fi

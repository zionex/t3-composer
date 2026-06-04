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

# ─── 5. gridValueL10N / setColumnDefs 오용 (AP-22, AP-23) ──────────
# GridUtils.gridValueL10N 의 실제 시그니처는 (value, options) — 커링 API 아님.
# gridValueL10N(t)(columnDefs) 호출 시 t 함수가 그대로 반환되어 t(columnDefs) 가 실행,
# i18next 내부에서 'key.indexOf is not a function' TypeError 발생.
if grep -qE '\bgridValueL10N\s*\(\s*t\s*\)\s*\(' <<<"$CONTENT"; then
  block "GridUtils.gridValueL10N(t)(columnDefs) 패턴 금지 — 존재하지 않는 커링 API. 헤더 i18n 은 setColumnDefs 내부 getColumnDefs() 가 자동 처리: GridUtils.setColumnDefs({ ...e, columnDefs, viewName, initState: true }). 실행 시 'key.indexOf is not a function' TypeError 발생." \
        "rules/21-components.md §1.4 · rules/99-anti-patterns.md FE17 · rules/21-components.md §13 AP-22"
fi

# setColumnDefs(api, columnDefs) 위치인자 사용 — 시그니처는 단일 객체 (params)
# 잘못된 형태: setColumnDefs(e.api, ...) / setColumnDefs(gridRef.current.api, ...)
if grep -qE '\bsetColumnDefs\s*\([^){]*\.api\s*,' <<<"$CONTENT"; then
  block "GridUtils.setColumnDefs(api, columnDefs) 위치인자 금지 — 시그니처는 단일 객체 (params). 사용: GridUtils.setColumnDefs({ ...e, columnDefs, viewName, gridId, initState: true })." \
        "rules/21-components.md §1.4 · rules/21-components.md §13 AP-23"
fi

# ─── 6. <AgGridReact> 의 columnDefs prop 누락 감지 (AP-24 / FE19) ───
# DefaultGridSetting 반환 객체에 columnDefs 가 포함되지 않으므로
# <AgGridReact ... {...defaultGridMemo} /> 만으로는 컬럼이 그려지지 않음.
# AgGridReact JSX 블록 ('<AgGridReact' ~ '/>') 안에 columnDefs={ 가 있는지 확인.
# 주의: macOS BSD awk 는 \b (word boundary) 미지원 → POSIX 호환 regex 사용.
if grep -qE '<AgGridReact' <<<"$CONTENT"; then
  # awk 로 <AgGridReact ~ /> 블록 추출 (가장 가까운 self-closing JSX)
  # 주의: macOS BSD awk 는 \b 미지원, $0 는 줄바꿈 미포함 → 단순 substring 매칭.
  AGGRID_BLOCK=$(awk '
    /<AgGridReact/     { capturing=1 }
    capturing          { buf = buf $0 "\n" }
    capturing && /\/>/ { print buf; buf=""; capturing=0 }
  ' <<<"$CONTENT")

  if [ -n "$AGGRID_BLOCK" ] && ! grep -qE 'columnDefs[[:space:]]*=[[:space:]]*\{' <<<"$AGGRID_BLOCK"; then
    block "<AgGridReact> JSX 에 'columnDefs={...}' prop 누락 — DefaultGridSetting 의 반환 객체에 columnDefs 가 포함되지 않으므로 {...defaultGridMemo} spread 만으로는 빈 그리드(헤더/데이터 모두 안 보임)가 표시됨. 정적 컬럼: <AgGridReact rowData={rowData} columnDefs={columnDefs} {...defaultGridMemo} ... />. 동적 컬럼: const columnDefs = useRef() + useEffect 에서 GridUtils.setColumnDefs({ ...gridRef.current, columnDefs: columnDefs.current, viewName, initState: true }) 패턴 (CustomerMaster.js / ItemMaster.js 참조)." \
          "rules/21-components.md §1.1 · rules/21-components.md §13 AP-24 · rules/99-anti-patterns.md FE19"
  fi
fi

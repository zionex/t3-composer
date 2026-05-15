# T3 Validator — Composer JSX runtime API (CG-A~E)
# rules/41a-composer-jsx.md + 41c-composer-widgets.md

# =====================================================================
# 7. Composer 화면 생성 검증 (rules/41-composer-generation.md)
# =====================================================================
# Composer 가 만든 JSX 또는 MENU_SQL 이 런타임에 동작하지 않는 흔한 실수를 차단.
# 기존 작성된 파일(레거시) 과의 충돌을 피하기 위해 "신규 화면" 특성을 가진 파일에만 적용:
#   - view/**/*.jsx 중 @wingui/common/imports 를 사용하는 파일 (= 신규 Composer 산출물 또는 최신 규약)
#   - MENU_SQL — TB_AD_MENU INSERT 가 포함된 .sql 파일

# 7.1 JSX 런타임 API 검증 (@wingui/common/imports 를 사용하는 파일만)
if [[ "$FILE_PATH" == *.jsx || "$FILE_PATH" == *.tsx ]] && [ -n "$CONTENT" ]; then
  USES_WINGUI_IMPORTS=$(grep -cE "from[[:space:]]+['\"]@wingui/common/imports['\"]" <<<"$CONTENT" || true)

  if [ "$USES_WINGUI_IMPORTS" -gt 0 ]; then

    # CG4. BaseGrid — columns= 금지 (실제 prop 은 items=)
    # BaseGrid 와 같은 줄/근처에 columns={ 가 있으면 차단
    if grep -qE "<BaseGrid\b" <<<"$CONTENT"; then
      if grep -qE "<BaseGrid[^>]*\bcolumns=" <<<"$CONTENT"; then
        block "<BaseGrid> 의 실제 prop 은 'items=' 입니다 (columns= 아님). 컬럼이 그리드에 전달되지 않아 빈 그리드가 렌더됩니다." \
              "rules/41a-composer-jsx.md §4.2, rules/99-anti-patterns.md CG4"
      fi
      # CG4. afterCreate= 금지 (실제 prop 은 afterGridCreate=)
      if grep -qE "<BaseGrid[^>]*\bafterCreate=" <<<"$CONTENT"; then
        block "<BaseGrid> 의 실제 prop 은 'afterGridCreate=' 입니다 (afterCreate= 아님). 그리드 초기화 콜백이 호출되지 않습니다." \
              "rules/41a-composer-jsx.md §4.2, rules/99-anti-patterns.md CG4"
      fi
    fi

    # CG-SPLIT. SplitPanel 허구 prop 차단 — initialSizes / minSizes / defaultSizes / panelSize
    #   (실제 API: sizes (배열) / minSize (단일 number) / direction / sx)
    #   NEW_FROM_COPY 가 원본에 없는 SplitPanel 을 도입하며 허구 prop 을 쓴 사고 재발 방지.
    if grep -qE "<SplitPanel\b[^>]*\b(initialSizes|minSizes|defaultSizes|panelSize)=" <<<"$CONTENT"; then
      block "<SplitPanel> 에 허구 prop (initialSizes/minSizes/defaultSizes/panelSize) 사용. 실제 API: sizes (배열) · minSize (단일 number) · direction · sx. 원본 화면에 SplitPanel 이 없었다면 추가하지 말고 원본 그대로 복제하세요." \
            "rules/41a-composer-jsx.md §4 · BASE_SYSTEM prop 명세 블록"
    fi

    # CG-TAB. TabContainer 허구 prop 차단 — tabs={[...]} 객체 배열 (실제: children <Tab>)
    if grep -qE "<TabContainer\b[^>]*\btabs=\{" <<<"$CONTENT"; then
      block "<TabContainer> 에 허구 prop 'tabs={...}' 사용. 실제 API 는 children 으로 <Tab> 요소를 배치합니다. value/onChange/indicatorColor 만 유효." \
            "BASE_SYSTEM prop 명세 [TabContainer]"
    fi

    # CG-POPUP. PopupDialog 허구 prop 차단 — sizeWidth / sizeHeight / fullWidth
    #   (실제: resizeWidth / resizeHeight · open/onClose/onSubmit/title/checks/type)
    if grep -qE "<PopupDialog\b[^>]*\b(sizeWidth|sizeHeight|fullWidth|maxWidth)=" <<<"$CONTENT"; then
      block "<PopupDialog> 에 허구 prop (sizeWidth/sizeHeight/fullWidth/maxWidth) 사용. 실제 API: resizeWidth · resizeHeight · open · onClose · onSubmit · title · checks · type('CONFIRM'|'NOBUTTONS')." \
            "BASE_SYSTEM prop 명세 [PopupDialog]"
    fi

    # CG-FAB1. 원본에 없는 컴포넌트 자의적 추가 — Composer 아티팩트가 단순 CRUD 인데
    # GroupBox/FormArea/FormRow/FormItem/HLayoutBox 를 import 하면 허구 구조 의심 → warn
    if [ "$IS_COMPOSER_ARTIFACT" = "1" ]; then
      if grep -qE "^\s*(GroupBox|FormArea|FormRow|FormItem|HLayoutBox)\s*,?\s*$" <<<"$CONTENT" \
         || grep -qE "from[[:space:]]+['\"]@wingui/common/imports['\"]" <<<"$CONTENT" \
            && grep -qE "\b(GroupBox|FormArea|FormRow|FormItem|HLayoutBox)\b" <<<"$CONTENT"; then
        warn "원본 화면에 없던 Wrapper (GroupBox/FormArea/FormRow/FormItem/HLayoutBox) 를 도입하지 않았는지 확인하세요. NEW_FROM_COPY 는 원본 import/구조를 그대로 유지하는 것이 원칙입니다. (rules/41 §0, newStepGuide(COPY) STEP B)"
      fi
    fi

    # CG-FAB2. 그리드 컬럼에 textAlign (실제 prop 은 textAlignment) 사용 차단
    if grep -qE "\btextAlign:\s*['\"](center|left|right|far|near)['\"]" <<<"$CONTENT"; then
      block "BaseGrid 컬럼의 정렬 prop 은 'textAlignment' 입니다 (textAlign 아님). RealGrid2 가 정렬을 인식하지 못합니다." \
            "rules/41-composer-generation.md §11.1"
    fi

    # CG-FAB3. gridItems 배열에서 fieldName 누락 — BaseGrid 가 undefined toUpperCase/toLowerCase 로 런타임 에러
    # { name: 'X', dataType: 'text' ... } 인데 fieldName 이 없는 객체가 있으면 의심 (정확 감지 어려움 → warn)
    # const \w*[Gg]ridItems (예: userInfoGridItems, gridItems) 패턴 모두 지원.
    if grep -qE "(const|let|var)\s+\w*[Gg]ridItems\s*=\s*\[" <<<"$CONTENT" \
       && grep -qE "\{\s*name:\s*['\"][a-zA-Z0-9_]+['\"]" <<<"$CONTENT" \
       && ! grep -qE "\bfieldName:\s*['\"][a-zA-Z0-9_]+['\"]" <<<"$CONTENT"; then
      warn "gridItems 에 'fieldName' 속성이 하나도 보이지 않습니다. 각 컬럼 객체에 'fieldName' 을 반드시 포함해야 런타임에 'toUpperCase/toLowerCase of undefined' 에러가 나지 않습니다. (rules/41 §4.3)"
    fi

    # CG-FAB3-DT. (2026-04-27) BaseGrid 컬럼에 dataType 누락 차단 — BaseGrid.jsx:1016 의
    # `item.dataType.toLowerCase() === 'group'` 호출에서 TypeError. dataType 은 모든 컬럼 필수.
    # 검출: 그리드 전용 속성 'headerText' 개수 > 'dataType' 개수 → block.
    # (name: 으로 비교하면 globalButtons 의 { name:'search' } 등이 false positive)
    if grep -qE "(const|let|var)\s+\w*[Gg]ridItems\s*=\s*\[" <<<"$CONTENT"; then
      # grep -c 는 0 매치 시 exit 1 + stdout "0" → || true 로 set -e 회피
      # headerText 는 RealGrid2 컬럼 전용 — globalButtons 등에서 안 쓰므로 안전
      HEADER_COUNT=$(grep -oE "[[:space:]{,]headerText:[[:space:]]*['\"]" <<<"$CONTENT" | wc -l || true)
      DATATYPE_COUNT=$(grep -oE "[[:space:]{,]dataType:[[:space:]]*['\"]" <<<"$CONTENT" | wc -l || true)
      HEADER_COUNT=${HEADER_COUNT:-0}
      DATATYPE_COUNT=${DATATYPE_COUNT:-0}
      if [ "$HEADER_COUNT" -gt "$DATATYPE_COUNT" ]; then
        block "BaseGrid 컬럼에 'dataType' 누락. BaseGrid.jsx 가 item.dataType.toLowerCase() 호출 시 TypeError 발생 (화면 진입 즉시 크래시). 모든 컬럼에 dataType: 'text'|'number'|'datetime'|'boolean'|'group' 중 하나 명시 필수. 현재 headerText:${HEADER_COUNT}개 vs dataType:${DATATYPE_COUNT}개." \
              "rules/41a-composer-jsx.md §4.3"
      fi
    fi

    # CG-STORE. Zustand store 매핑 swap 차단 (2026-04-27 사고 + 2026-05-11 t3-composer 단독 환경 재발)
    # activeViewId 는 useContentStore, setViewInfo 는 useViewStore — 헷갈려 swap 하면
    # selector 가 undefined 를 돌려주어 setViewInfo(...) 호출 시 TypeError.
    # ★ 단독 환경 (t3-composer) 에서는 useEffect 의 if (!activeViewId) return 으로 setViewInfo
    #    호출 자체가 skip 되어 globalButtons 미등록 → SearchArea 의 [조회] 버튼 click 무반응 사고 발생.
    if grep -qE "useViewStore\s*\(\s*\([^)]*\)\s*=>[^)]*\.activeViewId" <<<"$CONTENT"; then
      block "activeViewId 는 useContentStore 소속입니다 (useViewStore 아님). useViewStore selector 에서 .activeViewId 를 읽으면 undefined → useEffect 의 if(!activeViewId) return 로 setViewInfo 호출 자체가 skip → globalButtons 미등록 → SearchArea 의 [조회] 버튼 click 시 무반응. 정정: const [activeViewId] = useContentStore((s) => [s.activeViewId]);" \
            "rules/41a-composer-jsx.md §4.6 · TROUBLESHOOTING.md §14"
    fi
    if grep -qE "useContentStore\s*\(\s*\([^)]*\)\s*=>[^)]*\.setViewInfo" <<<"$CONTENT"; then
      block "setViewInfo 는 useViewStore 소속입니다 (useContentStore 아님). useContentStore selector 에서 .setViewInfo 를 읽으면 undefined → setViewInfo(...) 호출 시 'is not a function' TypeError. 정정: const [setViewInfo] = useViewStore((s) => [s.setViewInfo]);" \
            "rules/41a-composer-jsx.md §4.6"
    fi

    # CG-FAB4. gridItems 에 headerText 누락 — 컬럼 헤더가 빈 채로 렌더
    if grep -qE "const\s+gridItems\s*=\s*\[" <<<"$CONTENT" \
       && grep -qE "\{\s*name:\s*['\"][a-zA-Z0-9_]+['\"]" <<<"$CONTENT" \
       && ! grep -qE "\bheaderText:\s*['\"]" <<<"$CONTENT" \
       && ! grep -qE "\bheader:\s*['\"]" <<<"$CONTENT"; then
      warn "gridItems 에 'headerText' (또는 'header') 속성이 보이지 않습니다. 컬럼 헤더가 빈 값으로 렌더됩니다. 각 컬럼에 headerText 추가 권장. (rules/41 §4.3)"
    fi

    # CG-FAB5. <BaseGrid> 에 id 누락 — grid="..." prop 을 쓰는 다른 컴포넌트와 매칭 실패
    #   <BaseGrid items={...} /> 만 있고 id 가 없으면 GridAddRowButton/GridSaveButton 이 grid="..." 로 참조 불가
    if grep -qE "<BaseGrid\b[^>]*\bitems=" <<<"$CONTENT" \
       && ! grep -qE "<BaseGrid\b[^>]*\bid=" <<<"$CONTENT"; then
      warn "<BaseGrid> 에 'id' prop 이 누락되었습니다. Grid 버튼(<GridAddRowButton grid=\"...\">)이 이 그리드를 참조할 수 없습니다. id=\"<camelCase>Grid\" 추가 필수. (rules/41 §4.2)"
    fi

    # CG-FAB6. <InputField type="action" /> 자기닫힘 — children (아이콘) 없으면 빈 버튼
    # 정규식으로 자기닫힘(`/>`) 형태 + children 없는 경우 감지.
    # `<InputField ... type="action" ... />` 또는 type='action' 후 곧바로 `/>` 로 끝나면 경고.
    if grep -qE "<InputField\b[^>]*type=['\"]action['\"][^>]*/>" <<<"$CONTENT"; then
      block "<InputField type=\"action\" /> 자기닫힘 형태 감지. children 으로 아이콘(<SearchIcon/>) 을 배치해야 빈 버튼이 아닙니다. readonly={true}·onClick={...} 포함 + 블록 형태로 작성 필수." \
            "rules/41c-composer-widgets.md §6.2 · BASE_SYSTEM prop 명세 [InputField]"
    fi

    # CG-FAB6b. <span className="material-icons">search</span> 등 폰트 기반 아이콘 텍스트 금지
    # Material Icons 폰트가 로드 안 되면 "search" 가 그대로 텍스트로 보임.
    # 표준은 @mui/icons-material/<Name> 컴포넌트 사용 (예: <SearchIcon fontSize="small" />)
    if grep -qE "className=['\"]material-icons['\"]" <<<"$CONTENT"; then
      block "<span className=\"material-icons\">...</span> 사용 금지 — Material Icons 폰트 로드 안 되면 아이콘 대신 텍스트(예: 'search')가 그대로 표시됩니다. 표준은 @mui/icons-material/<Name> 컴포넌트 사용: import SearchIcon from '@mui/icons-material/Search'; 후 <SearchIcon fontSize=\"small\" />" \
            "rules/41c-composer-widgets.md §6.2 (검색조건 팝업 트리거)"
    fi

    # CG-FAB6d. @mui/icons-material/<Name> 의 named import 금지 — default export 임
    # `import { SearchIcon } from '@mui/icons-material/Search';` → 런타임 SearchIcon === undefined
    # → JSX 렌더 시 "Element type is invalid: ... got: undefined" 오류. 가장 잦은 LLM 환각.
    # 표준: `import SearchIcon from '@mui/icons-material/Search';`
    if grep -qE "^import\s*\{[^}]*\}\s*from\s*['\"]@mui/icons-material/" <<<"$CONTENT"; then
      OFFENDER=$(grep -nE "^import\s*\{[^}]*\}\s*from\s*['\"]@mui/icons-material/" <<<"$CONTENT" | head -1)
      block "@mui/icons-material/<Name> 의 named import 금지 — default export 입니다. 발견: $OFFENDER  → 런타임에 컴포넌트가 undefined 가 되어 'Element type is invalid' 오류. 표준: import SearchIcon from '@mui/icons-material/Search';" \
            "rules/41c-composer-widgets.md §6.2"
    fi

    # CG-FAB6c. <GridCnt> 에 format prop 누락 — 라벨 없이 숫자만 노출
    # GridCnt 는 props.format 없으면 단순 카운트 숫자 (예: "2") 만 출력 → 화면에 "2" 가 외로이 보임
    # 표준: format={"{0} " + transLangKey("CASES") + " " + transLangKey("MSG_0010")}
    if grep -qE "<GridCnt\b" <<<"$CONTENT"; then
      # GridCnt 태그를 멀티라인으로 추출하여 format prop 존재 확인
      # awk: `<GridCnt` 발견 후 `>` 까지 buffer 누적 → buffer 에 `format=` 있으면 OK 마킹
      HAS_FORMAT=$(awk '
        /<GridCnt[[:space:]>]/ { in_tag=1; buf="" }
        in_tag                  { buf = buf " " $0 }
        in_tag && />/ {
          if (buf ~ /format=/) { ok=1 }
          in_tag=0; buf=""
        }
        END { print (ok ? "1" : "0") }
      ' <<<"$CONTENT")
      if [ "$HAS_FORMAT" != "1" ]; then
        block "<GridCnt> 에 format prop 누락 — 라벨 없이 숫자만 노출되어 화면에 외로운 '2' 같은 텍스트가 보입니다. 표준: <GridCnt grid=\"<id>\" format={\"{0} \" + transLangKey(\"CASES\") + \" \" + transLangKey(\"MSG_0010\")} /> + 'import { transLangKey } from \"@zionex/wingui-core\"' 추가" \
              "rules/21-components.md §4 + rules/41a-composer-jsx.md (GridCnt 사용 표준)"
      fi
      # rowCount={...} 이라는 prop 은 GridCnt 에 정의 안 됨 (PropTypes 는 grid 만) — Composer 가 자주 추가
      if grep -qE "<GridCnt\b[^>]*\browCount=" <<<"$CONTENT"; then
        warn "<GridCnt> 의 rowCount prop 은 컴포넌트 정의에 없습니다 (PropTypes: grid만). GridCnt 가 자체 onRowCountChanged 로 카운트 추적하므로 외부에서 넘길 필요 없음. 제거 권장."
      fi
    fi

    # CG5. 그리드 컬럼 key — field: 금지 (실제 key 는 name:)
    # gridItems 배열 안에 `field: '...'` 가 있으면 차단
    if grep -qE "(let|const|var)[[:space:]]+gridItems\b" <<<"$CONTENT"; then
      if grep -qE "[[:space:]]field:[[:space:]]*['\"]" <<<"$CONTENT"; then
        block "RealGrid2 컬럼 key 는 'name:' 입니다 ('field:' 아님). rules/41a-composer-jsx.md §4.3 참조." \
              "rules/99-anti-patterns.md CG5"
      fi
      # type:'combo' + items:[] 패턴 — RealGrid 은 lookupDisplay/values/labels 사용
      if grep -qE "type:[[:space:]]*['\"]combo['\"]" <<<"$CONTENT" \
         && grep -qE "^[[:space:]]+items:[[:space:]]*\[" <<<"$CONTENT"; then
        block "RealGrid 콤보 컬럼은 'type:combo, items:[...]' 아닌 'lookupDisplay:true, values:[...], labels:[...]' 사용." \
              "rules/41a-composer-jsx.md §4.3, rules/99-anti-patterns.md CG5"
      fi

      # CG5b. Y/N · code · 날짜 필드인데 정렬 미지정 — 경고
      # 컬럼 블록 중 useYn/USE_YN 이면서 textAlignment 가 없으면
      if grep -qE "name:[[:space:]]*['\"](useYn|USE_YN|actvYn|ACTV_YN)['\"]" <<<"$CONTENT" \
         && ! grep -B1 -A3 -E "name:[[:space:]]*['\"](useYn|USE_YN|actvYn|ACTV_YN)['\"]" <<<"$CONTENT" | grep -q "textAlignment"; then
        warn "Y/N 컬럼에 textAlignment:'center' + dataType:'boolean' (CheckBox) 권장 (rules/41c-composer-widgets.md §6.1)"
      fi

      # CG5b-2. lookupDisplay:true + values 가 있는데 useDropdown:true 가 없으면 셀 편집 시 dropdown 안 뜸 (큰 실수)
      # editable:true 가 같은 컬럼에 있으면 더 명확한 누락 — block 아닌 강한 warn
      if grep -qE "lookupDisplay:[[:space:]]*true" <<<"$CONTENT" \
         && grep -qE "^[[:space:]]+values:[[:space:]]*\[" <<<"$CONTENT" \
         && ! grep -qE "useDropdown:[[:space:]]*true" <<<"$CONTENT"; then
        warn "그리드 컬럼에 lookupDisplay:true + values 가 있는데 'useDropdown:true' 누락. 셀 편집 시 dropdown 이 뜨지 않고 자유 text 가 됩니다. 같은 enum 을 검색조건이 select 로 쓰는데 그리드는 text 인 비일관성 — 가장 흔한 실수입니다. (rules/41-composer-generation.md §11.2)"
      fi
      # 날짜 컬럼에 datetimeFormat 누락 경고
      if grep -qE "dataType:[[:space:]]*['\"]datetime['\"]" <<<"$CONTENT" \
         && ! grep -qE "datetimeFormat:[[:space:]]*['\"]yyyy-MM-dd" <<<"$CONTENT"; then
        warn "datetime 컬럼에 datetimeFormat:'yyyy-MM-dd' (또는 'yyyy-MM-dd HH:mm:ss') 명시 권장 (rules/41-composer-generation.md §11.3)"
      fi
      # 부서/직위 필드를 자유 text 로 입력받는 경우
      if grep -qE "name:[[:space:]]*['\"](deptCd|DEPT_CD|positionCd|POSITION_CD)['\"]" <<<"$CONTENT" \
         && ! grep -q "PopDepartment\|PopPosition" <<<"$CONTENT"; then
        warn "부서/직위 필드는 PopDepartment / PopPosition POPUP 연결 권장 (rules/41c-composer-widgets.md §6.1)"
      fi

      # CG-SEARCH-TRIGGER. SearchArea 가 있는데 search 트리거 (globalButtons.search 또는 onSearch) 미등록
      # → [조회] 버튼 click 시 무반응. 2026-05-11 t3-composer 단독 환경 사고 후 추가.
      if grep -qE "<SearchArea\b" <<<"$CONTENT" \
         && ! grep -qE "name:\s*['\"]search['\"]" <<<"$CONTENT" \
         && ! grep -qE "onSearch=" <<<"$CONTENT"; then
        warn "SearchArea 가 있으나 search 트리거가 등록되지 않았습니다. " \
             "(a) setViewInfo(activeViewId, 'globalButtons', [{name:'search', action: handleSubmit(handleSearch), visible:true, disable:false}]) " \
             "또는 (b) <SearchArea onSearch={handleSubmit(handleSearch)}> 둘 중 하나 필수. " \
             "(rules/20-screen-development.md §3.3 · TROUBLESHOOTING.md §14)"
      fi

      # CG5g. 공통코드 성 필드 (USE_YN, USER_TP, STATUS_CD 등) 가 있는데 CommonCodeSelect 미사용
      # hardcoded options 로 된 select 가 있으면 warn
      COMMON_CODE_FIELDS=$(grep -oE "name:[[:space:]]*['\"](useYn|USE_YN|userTp|USER_TP|statusCd|STATUS_CD|actvYn|ACTV_YN|langCd|LANG_CD)['\"]" <<<"$CONTENT" | head -1 || true)
      if [ -n "$COMMON_CODE_FIELDS" ] \
         && grep -qE "type=['\"]select['\"]" <<<"$CONTENT" \
         && ! grep -q "CommonCodeSelect" <<<"$CONTENT"; then
        warn "공통코드 필드(${COMMON_CODE_FIELDS})에 hardcoded options 대신 <CommonCodeSelect groupCd=\"...\"> 사용 권장. 코드 추가 시 코드표만 업데이트하면 전 화면 반영 (rules/41c-composer-widgets.md §9)"
      fi

      # CG5f. Master 성 필드(itemCd/accountCd/locatCd/resCd/deptCd/positionCd)는 POPUP 이 기본.
      # 해당 필드가 있는데 대응 Pop* 컴포넌트 import 가 전혀 없으면 warn.
      MASTER_FIELD_WITHOUT_POP=""
      for pair in "itemCd:PopSelectItem\\|PopItemMulti" \
                  "accountCd:PopSelectAccount\\|PopAccountMulti" \
                  "locatCd:PopLocatMst\\|PopLocatTpMulti" \
                  "resCd:PopResourceMulti" \
                  "deptCd:PopDepartment" \
                  "positionCd:PopPosition"; do
        FIELD="${pair%%:*}"; POPS="${pair##*:}"
        if grep -qE "name:[[:space:]]*['\"]${FIELD}['\"]" <<<"$CONTENT" \
           && ! grep -qE "${POPS}" <<<"$CONTENT"; then
          MASTER_FIELD_WITHOUT_POP="${MASTER_FIELD_WITHOUT_POP} ${FIELD}"
        fi
      done
      if [ -n "$MASTER_FIELD_WITHOUT_POP" ]; then
        warn "Master 필드(${MASTER_FIELD_WITHOUT_POP}) 는 기본적으로 POPUP 으로 선택해야 합니다. 대응 Pop* 컴포넌트 import 및 type='action' 트리거 추가 (rules/41c-composer-widgets.md §6.1, §8)"
      fi

      # CG5d. InputField 검색 팝업 트리거에 InputProps.endAdornment 오용
      # InputField 는 InputProps 를 내부 Control 에 전달하지만 endAdornment 는 미동작.
      # 검색 팝업은 type="action" + onClick 으로 구현해야 함.
      if grep -qE "<InputField[^>]*InputProps=\{" <<<"$CONTENT" \
         && grep -qE "endAdornment" <<<"$CONTENT" \
         && grep -qE "IconButton|SearchIcon" <<<"$CONTENT"; then
        warn "<InputField> 에 InputProps.endAdornment 로 IconButton 을 달면 렌더되지 않습니다. type=\"action\" + onClick={openPopup} 로 변경 (rules/41c-composer-widgets.md §6.1)"
      fi

      # CG5d-2. type="action" 은 children 으로 아이콘 필수 (ActionInputControl 내부 IconButton)
      # 자기 닫힘 태그(<InputField type="action" .../>) 는 children 없음 → 빈 버튼.
      if grep -qE "<InputField[^>]*type=['\"]action['\"][^>]*\/>" <<<"$CONTENT"; then
        warn "<InputField type=\"action\" .../> 는 children 으로 아이콘이 없어 버튼이 빈 채로 렌더됩니다. <InputField type=\"action\" ...><SearchIcon fontSize=\"small\" /></InputField> 로 사용 (rules/41c-composer-widgets.md §6.1)"
      fi

      # CG5e. 그리드 컬럼에 수동 button:'action' / buttonVisibility 설정
      # applyGridCascade 가 자동 주입하므로 수동 설정은 중복/충돌
      if grep -qE "\bbuttonVisibility:[[:space:]]*['\"]always['\"]" <<<"$CONTENT" \
         && grep -q "applyGridCascade" <<<"$CONTENT"; then
        warn "applyGridCascade 가 레지스트리 기반으로 button/buttonVisibility 를 자동 설정합니다. 수동 지정 중복 가능 — 컬럼 정의에서 제거 권장 (rules/41c-composer-widgets.md §6.1)"
      fi

      # CG5c. Cascade 레지스트리의 **parent 있는** 컬럼(itemCd/accountCd/simulVerCd 등) 이 있는데
      # useFieldCascade / applyGridCascade 가 없으면 cascade 누락 경고.
      # deptCd/positionCd 처럼 popup-only 엔트리는 cascade clear 대상 아님 — 제외.
      CASCADE_COLUMNS_IN_CONTENT=$(grep -oE "name:[[:space:]]*['\"](itemCd|accountCd|simulVerCd|mainVerCd|itemLvCd|salesLvCd|locatCd|resCd|processCd)['\"]" <<<"$CONTENT" | head -1 || true)
      if [ -n "$CASCADE_COLUMNS_IN_CONTENT" ]; then
        HAS_USE_CASCADE=$(grep -cE "\buseFieldCascade\s*\(" <<<"$CONTENT" || echo 0)
        HAS_APPLY_CASCADE=$(grep -cE "\bapplyGridCascade\s*\(" <<<"$CONTENT" || echo 0)
        HAS_FORM=$(grep -cE "\buseForm\s*\(" <<<"$CONTENT" || echo 0)
        HAS_GRID=$(grep -cE "<BaseGrid\b" <<<"$CONTENT" || echo 0)
        if [ "$HAS_FORM" -gt 0 ] && [ "$HAS_USE_CASCADE" -eq 0 ]; then
          warn "주종관계 레지스트리 대상 컬럼(${CASCADE_COLUMNS_IN_CONTENT}) 사용 · useForm 있음 — useFieldCascade({control,setValue,getValues}) 누락 (rules/41c-composer-widgets.md §7.2)"
        fi
        if [ "$HAS_GRID" -gt 0 ] && [ "$HAS_APPLY_CASCADE" -eq 0 ]; then
          warn "그리드에 cascade 레지스트리 대상 컬럼 사용 — applyGridCascade(gridObj, gridItems, {...}) 누락 (rules/41c-composer-widgets.md §7.2)"
        fi
      fi
    fi

    # CG6. callService — 객체 인자 금지 (실제 시그니처: callService(id, paramMap, target))
    if grep -qE "callService\s*\(\s*\{" <<<"$CONTENT"; then
      block "callService 시그니처는 (serviceId:string, paramMap:object, target?:string) 입니다. 객체 인자 { url, params } 형태는 존재하지 않음." \
            "rules/41a-composer-jsx.md §4.5, rules/99-anti-patterns.md CG6"
    fi
    # URL 경로 오해 (/api/common/sp/...) 안티패턴
    if grep -qE "['\"]\/api\/common\/sp\/(query|execute)['\"]" <<<"$CONTENT"; then
      block "'/api/common/sp/query' · '/api/common/sp/execute' 엔드포인트는 존재하지 않습니다. callService('SP_UI_...', paramMap) 사용." \
            "rules/41a-composer-jsx.md §4.5, rules/99-anti-patterns.md CG6"
    fi

    # CG6b. callService target — 등록된 4개(mp/dp/bf/fp) 만 허용
    if grep -qE "callService\s*\([^)]*,[^)]*,\s*['\"](common|ut|cm|ad|im|rp|sa|sales|so|fo|dpd)['\"]" <<<"$CONTENT"; then
      block "callService 의 3번째 인자(target) 는 'mp'|'dp'|'bf'|'fp' 만 등록되어 있습니다 (PlatformService.Module enum). 'common'/'ut'/'cm' 등은 'cannot find destination' 오류. 도메인-서버 매핑 — CM/MP/IM/RP/SO/UT→'mp', BF/DP→'dp', FP→'fp'." \
            "rules/41a-composer-jsx.md §4.5, rules/99-anti-patterns.md CG6"
    fi

    # 직접 zAxios 로 engine/common/... URL 쓰는 것도 금지
    if grep -qE "['\"]engine\/(common|ut|cm|ad|im|rp|sa|sales|so|fo|dpd)\/" <<<"$CONTENT"; then
      block "엔진 URL 'engine/common/*' 등은 미등록 target. 'engine/mp/...' 또는 'engine/dp/...' 사용." \
            "rules/41a-composer-jsx.md §4.5"
    fi

    # CG6e. 서비스 ID 에 SP_ 접두어만 쓰면 안 됨 (SP 이름 ≠ 서비스 ID)
    if grep -qE "callService\s*\(\s*['\"]SP_UI_[A-Z]+_[A-Z0-9_]+_(Q|S|D|M|J|BATCH|POP|CHART)" <<<"$CONTENT"; then
      block "callService 첫 인자는 **서비스 ID** (XML의 <service id>) — 'SP_UI_...' 는 DB 프로시저 이름이고 서비스 ID 는 'SRV_UI_...' 또는 'SRV_GET_SP_UI_...' 입니다. wingui 네이티브 화면이라면 callService 대신 zAxios.get('<module>/<features>') REST 호출 권장." \
            "rules/41a-composer-jsx.md §4.5"
    fi

    # CG6f. (2026-04-27 정책 전환) 신규 화면은 zAxios → RestController → JdbcTemplate → SP_UI_*.
    # callService 는 BF/DP/MP/FP 계산 기반 **기존** 엔진 경유 화면 수정 전용.
    if [[ "$FILE_PATH" == */view/util/* || "$FILE_PATH" == */view/system/* ]]; then
      if grep -qE "\bcallService\s*\(" <<<"$CONTENT"; then
        warn "신규 화면에서 callService 사용 감지 — 정책상 신규 화면은 zAxios → RestController → JdbcTemplate → SP_UI_* 패턴. callService 는 BF/DP/MP/FP 계산 기반 기존 화면 수정 전용. (rules/41a-composer-jsx.md §4.5, rules/41-composer-generation.md §13)"
      fi
    fi

    # CG7. showMessage — 첫 인자에 타입 키워드(confirm/error/info/success/warning) 리터럴 금지
    if grep -qE "showMessage\s*\(\s*['\"](confirm|error|info|success|warning)['\"]" <<<"$CONTENT"; then
      block "showMessage 첫 인자는 **제목 문자열** 입니다. ('confirm'/'error'/'info' 같은 타입 토큰 아님). 예: showMessage('확인', msg, cb)." \
            "rules/41a-composer-jsx.md §4.6, rules/99-anti-patterns.md CG7"
    fi

    # CG8. grid.setData / grid.getChangedData — 존재하지 않는 메서드
    if grep -qE "\bgrid[A-Za-z0-9_]*\.setData\s*\(" <<<"$CONTENT"; then
      block "grid.setData(...) 는 존재하지 않습니다. grid.dataProvider.fillJsonData(data) 사용." \
            "rules/41a-composer-jsx.md §4.2, rules/99-anti-patterns.md CG8"
    fi
    if grep -qE "\bgrid[A-Za-z0-9_]*\.getChangedData\s*\(" <<<"$CONTENT"; then
      block "grid.getChangedData() 는 존재하지 않습니다. grid.dataProvider.getAllStateRows() 사용 → {created,updated,deleted}." \
            "rules/41a-composer-jsx.md §4.2, rules/99-anti-patterns.md CG8"
    fi
    if grep -qE "\bgrid[A-Za-z0-9_]*\.getChanges\s*\(" <<<"$CONTENT"; then
      block "grid.getChanges() 는 존재하지 않습니다. grid.dataProvider.getAllStateRows() 사용." \
            "rules/41a-composer-jsx.md §4.2, rules/99-anti-patterns.md CG8"
    fi

    # ───────────────────────────────────────────────────────────────────
    # CG-GRID-LIFECYCLE (2026-04-30 추가) — 부서관리 화면 + 버튼 무반응 사고 후 추가
    #
    # 사고 패턴:
    #   1) `useRef(null)` 로 grid 저장 + 자동조회 useEffect deps 가 `[]` (빈 배열)
    #      → mount 시 ref.current === null 이라 onSearch 한 번도 안 불림 → 그리드 영구히 비어있음
    #   2) <GridAddRowButton initRow={{...}} /> — `initRow` 는 GridButton.jsx 가 인식 안 하는 무효 prop
    #      (실제는 onGetData={() => ({...})} 함수형 prop)
    #   3) <GridSaveButton url="..." /> 만 있고 onSave 핸들러 없음 — 동작 안 함
    # ───────────────────────────────────────────────────────────────────

    # CG-GRID-LIFECYCLE-1: grid 저장에 useRef + 자동조회 useEffect deps=[] race condition
    #   조건: useRef(null) + ref.current 패턴 + useEffect(..., []) 안에 onSearch/handleSearch 호출
    HAS_GRID_REF=$(grep -cE "(grid|gridRef)\s*=\s*useRef\(\s*null\s*\)" <<<"$CONTENT" || true)
    if [ "$HAS_GRID_REF" -gt 0 ]; then
      # 자동조회 useEffect: dependency 배열이 빈 [] 인데 본문에 onSearch/handleSearch 호출이 있음
      if grep -qzE "useEffect\(\s*\(\s*\)\s*=>\s*\{[^}]*\b(onSearch|handleSearch|loadData|reload|search)\s*\(\s*\)[^}]*\},\s*\[\s*\]\s*\)" <<<"$CONTENT"; then
        warn "useRef 로 grid 를 저장하면서 자동조회 useEffect 의 deps 가 빈 배열 [] 입니다. mount 시 ref.current 가 null 이라 onSearch 가 한 번도 호출되지 않아 그리드가 영구히 빈 상태로 렌더됩니다. 표준: const [grid, setGrid] = useState(null); afterGridCreate=(g)=>setGrid(g); useEffect(()=>{ if(grid) onSearch(); }, [grid]) — 표준 원본 view/util/userinfo/UserInfo.jsx 패턴 참조. (rules/41a-composer-jsx.md §4.6 — CG-GRID-LIFECYCLE-1)"
      fi
    fi

    # CG-GRID-LIFECYCLE-2: <GridAddRowButton initRow={...} /> — 무효 prop
    if grep -qE "<GridAddRowButton[^>]*\binitRow=" <<<"$CONTENT"; then
      block "<GridAddRowButton> 의 'initRow' 는 컴포넌트가 인식하지 않는 prop 입니다 (GridButton.jsx 의 실제 props: grid, onBeforeAdd, onAfterAdd, onGetData). 새 행에 기본값을 넣으려면 onGetData={() => ({ field1: 'A', useYn: 'Y' })} 를 사용하세요. 단순 빈 행이면 prop 없이 <GridAddRowButton grid=\"...\" /> 로 충분합니다." \
            "rules/41a-composer-jsx.md §4.4, rules/99-anti-patterns.md CG-GRID-LIFECYCLE-2"
    fi
    # 같은 의도의 다른 오타 prop — addInfo (rules 표에 한때 있던 잘못된 표기)
    if grep -qE "<GridAddRowButton[^>]*\baddInfo=" <<<"$CONTENT"; then
      block "<GridAddRowButton> 의 'addInfo' 는 컴포넌트가 인식하지 않는 prop 입니다 (GridButton.jsx 의 실제 props: grid, onBeforeAdd, onAfterAdd, onGetData). onGetData={() => ({...})} 함수형 prop 으로 사용하세요." \
            "rules/41a-composer-jsx.md §4.4, rules/99-anti-patterns.md CG-GRID-LIFECYCLE-2"
    fi

    # CG-GRID-LIFECYCLE-3: <GridSaveButton ... /> 에 onSave 핸들러 누락
    #   GridSaveButton 은 onSave 콜백을 호출해 변경분(changeRowData) 을 받아 zAxios 로 전송하는 패턴.
    #   onSave 가 없으면 클릭해도 아무 일도 안 일어남 (url 단독은 컴포넌트가 자동 zAxios 호출 X).
    if grep -qE "<GridSaveButton\b" <<<"$CONTENT"; then
      # multiline 매칭 — `<GridSaveButton ... onSave=` 패턴 (속성이 여러 줄에 걸칠 수 있음).
      # `>` 또는 `/>` 가 닫힘이지만 props 안에 다른 < > 가 들어있지 않다고 가정 (JSX 관례).
      # grep -Pz 의 \K 로 lookbehind 우회 → `<GridSaveButton[^>]{0,1000}\bonSave\s*=` 패턴
      if ! grep -qPz "<GridSaveButton[^>]{0,2000}?\bonSave\s*=" <<<"$CONTENT" 2>/dev/null; then
        block "<GridSaveButton> 에 onSave 핸들러가 누락되었습니다. GridSaveButton 은 onSave 콜백 안에서 직접 zAxios 로 변경분을 전송하는 패턴입니다. 표준: const onSave = useCallback((_g, changeRowData) => { const fd = new FormData(); fd.append('changes', JSON.stringify(changeRowData)); return zAxios({ method:'post', url:'<m>/<fs>', headers:{'content-type':'multipart/form-data'}, data:fd }); }, []); 그 후 <GridSaveButton grid=\"...\" onSave={onSave} onAfterSave={onSearch} />" \
              "rules/41a-composer-jsx.md §4.5, rules/99-anti-patterns.md CG-GRID-LIFECYCLE-3"
      fi
    fi
    # ───────────────────────────────────────────────────────────────────

    # CG10. globalButtons — { code, onClick } 금지 (실제 key: name, action)
    if grep -qE "setViewInfo\s*\([^)]*globalButtons" <<<"$CONTENT"; then
      # onClick: 또는 code: 가 같은 블록에 등장하면 경고
      if grep -qE "^\s*code:\s*['\"]" <<<"$CONTENT" \
         && grep -qE "^\s*onClick:" <<<"$CONTENT"; then
        block "globalButtons 항목의 실제 key 는 'name' + 'action' 입니다 ('code' + 'onClick' 아님). 예: { name:'search', action: fn }" \
              "rules/41a-composer-jsx.md §4.7, rules/99-anti-patterns.md CG10"
      fi
    fi

    # ───────────────────────────────────────────────────────────────────
    # CG-URL-VSFX (2026-04-30 추가) — 부서관리 V2 사고 후 추가
    #
    # 사고 패턴 (2026-04-30 DeptMgmt V2):
    #   - 사용자가 기존 메뉴 'UI_UT_DEPT_MGMT' 와 코드만 다른 'UI_UT_DEPT_MGMT_V2' 메뉴를 추가
    #   - V2 는 **메뉴 코드 distinction 한정** — Controller/Service/Entity/Table/SP 모두 v2 없는 단일 자원 공유
    #   - 그러나 LLM 이 JSX 의 zAxios URL 에도 `-v2` 접미어를 환각으로 추가
    #     (예: util/dept-mgmt-v2)
    #   - 백엔드 @RequestMapping("/util/dept-mgmt") 와 불일치 → 모든 호출 404
    #
    # 핵심 원칙:
    #   - MENU_CD 의 _V2 / _V3 / _NEW 등 distinction 은 메뉴 코드 한정
    #   - JSX zAxios URL 은 **Controller 매핑** 과 일치해야 하며, 메뉴 코드 접미어를 따라가지 않는다
    #
    # 감지: 파일 경로(폴더/파일명) 에 'v2'/'v3' 가 없는데 zAxios URL 에 '-v2'/'-v3' 등 버전 접미어
    # ───────────────────────────────────────────────────────────────────
    PATH_HAS_VSUFFIX=0
    if [[ "$FILE_PATH" =~ [Vv][0-9]+\.jsx$ ]] \
       || [[ "$FILE_PATH" =~ /[a-z0-9_]*v[0-9]+/[A-Za-z0-9_]+\.jsx$ ]]; then
      PATH_HAS_VSUFFIX=1
    fi
    if [ "$PATH_HAS_VSUFFIX" = "0" ]; then
      # zAxios URL 들에서 segment 끝의 -v2/-v3/-v4 등 접미어 추출
      # 매칭 대상:
      #   zAxios.get('util/dept-mgmt-v2', ...)
      #   url: 'util/dept-mgmt-v2'
      #   url: 'util/dept-mgmt-v2/delete'
      #   url="util/dept-mgmt-v2"
      VSUFFIX_HITS=$(grep -nE "(zAxios\.(get|post|put|delete|patch)\s*\(\s*['\"]|\burl\s*[:=]\s*['\"])[a-zA-Z][a-zA-Z0-9_/-]*-v[0-9]+([/'\"]|\?)" <<<"$CONTENT" || true)
      if [ -n "$VSUFFIX_HITS" ]; then
        block "zAxios URL 에 버전 접미어(-v2/-v3 등) 감지. JSX 파일 경로(${FILE_PATH##*/})에는 v-접미어가 없습니다 — Controller @RequestMapping 도 v-접미어 없는 단일 자원이 일반적입니다.

MENU_CD 의 _V2 distinction 은 **메뉴 코드 한정** 이며 JSX URL · Controller URL · Service · Entity · Table · SP 어디에도 전파되지 않습니다 (V2 메뉴는 동일 백엔드 자원을 공유). zAxios URL 의 -v2/-v3 접미어는 100% 환각 가능성이 큽니다.

수정: zAxios URL 에서 버전 접미어를 제거해 Controller 매핑과 일치시키세요. 정말 별도 자원이 필요하다면 Controller 의 @RequestMapping 도 함께 -v2 로 변경해야 합니다.

발견 위치:
$VSUFFIX_HITS" \
              "rules/41a-composer-jsx.md §4.5 · rules/99a-composer-anti-patterns.md CG-URL-VSFX"
      fi
    fi

    # CG-SHIM. @wingui/common/imports 에서 단독 shim 미보유 심볼 import 감지 (warn)
    #   단독 t3-composer 환경에서 @wingui/common/imports 는 전부
    #   frontend/src/shim/wingui/common/imports.js 로 resolve 된다.
    #   shim 이 export 하지 않는 이름을 import 하면 undefined → 화면 실행 시
    #   'Element type is invalid: ... got: undefined' 런타임 크래시.
    #   (2026-05 VLayoutBox/HLayoutBox 누락 사고) shim 의 실제 export 를 동적으로
    #   읽어 대조하므로 shim 갱신 시 자동 추종. shim 파일을 못 찾으면 skip.
    _VDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)"
    _SHIM="${_VDIR}/../../../frontend/src/shim/wingui/common/imports.js"
    if [ -f "$_SHIM" ]; then
      _SHIM_EXPORTS=$(grep -oE 'export[[:space:]]+(const|function)[[:space:]]+[A-Za-z0-9_]+' "$_SHIM" \
                      | awk '{print $3}' | sort -u)
      _FLAT=$(tr '\n' ' ' <<<"$CONTENT")
      _IMP=$(grep -oE "import[[:space:]]*\{[^}]*\}[[:space:]]*from[[:space:]]*['\"]@wingui/common/imports['\"]" <<<"$_FLAT" | head -1)
      if [ -n "$_IMP" ]; then
        _NAMES=$(sed -E 's/.*\{([^}]*)\}.*/\1/' <<<"$_IMP" \
                 | tr ',' '\n' \
                 | sed -E 's/[[:space:]]+as[[:space:]]+[A-Za-z0-9_]+//; s/[[:space:]]//g' \
                 | grep -E '^[A-Za-z]' || true)
        _MISSING=""
        while IFS= read -r _n; do
          [ -z "$_n" ] && continue
          grep -qxF "$_n" <<<"$_SHIM_EXPORTS" || _MISSING="${_MISSING} ${_n}"
        done <<<"$_NAMES"
        if [ -n "$_MISSING" ]; then
          warn "@wingui/common/imports 에서 단독 shim 미보유 심볼 import:${_MISSING}
단독 환경에서 이 이름들은 undefined 로 평가되어 [화면 실행] 시 'Element type is invalid: ... got: undefined' 크래시를 일으킵니다.
조치 ① (권장) shim 에 export 추가 — frontend/src/shim/wingui/common/imports.js
조치 ② 산출물이 해당 import 를 쓰지 않도록 수정.
rules/50-composer-standalone-runtime.md §13"
        fi
      fi
    fi

    # CG-ARR. 리스트 state 배열 초기값 누락 감지 (warn)
    #   const [x, setX] = useState() / useState(null) / useState(undefined) 인데
    #   x 가 배열 메서드(.map/.find/.flatMap/...) 로 사용되면 API 빈/비배열 응답 시
    #   'x.map is not a function' 런타임 크래시 → [화면 실행] 오류.
    #   (2026-05 ForecastDashboard kpi.find 사고) rules/50 §13.4.
    _LIST_BAD=$(grep -oE 'const[[:space:]]*\[[^]]*\][[:space:]]*=[[:space:]]*useState\([[:space:]]*(null|undefined)?[[:space:]]*\)' <<<"$CONTENT" || true)
    if [ -n "$_LIST_BAD" ]; then
      _ARR_HITS=""
      while IFS= read -r _line; do
        [ -z "$_line" ] && continue
        _v=$(sed -E 's/.*\[[[:space:]]*([A-Za-z_][A-Za-z0-9_]*).*/\1/' <<<"$_line")
        [ -z "$_v" ] && continue
        if grep -qE "\b${_v}\.(map|find|flatMap|filter|forEach|reduce|some|every)\(" <<<"$CONTENT"; then
          _ARR_HITS="${_ARR_HITS} ${_v}"
        fi
      done <<<"$_LIST_BAD"
      if [ -n "$_ARR_HITS" ]; then
        warn "리스트 state 초기값 누락 — useState() / useState(null) 인데 배열 메서드로 사용됨:${_ARR_HITS}
API 가 빈/비배열 응답을 주면 '... is not a function' 런타임 크래시가 발생합니다.
조치: useState([]) 초기값 + set 시 setX(Array.isArray(res.data) ? res.data : []) 가드.
rules/50-composer-standalone-runtime.md §13.4"
      fi
    fi
    # ───────────────────────────────────────────────────────────────────
  fi
fi


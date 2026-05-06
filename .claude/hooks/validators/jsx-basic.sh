# T3 Validator — JSX basic structure (R1~R9)
# Sourced by pre-tool-use-validator.sh — uses $FILE_PATH $CONTENT

# =====================================================================
# 1. JSX 파일 검증
# =====================================================================
if [[ "$FILE_PATH" == *.jsx || "$FILE_PATH" == *.tsx ]]; then

  # R7. 파일 경로 규약
  if [[ "$FILE_PATH" == */view/* ]]; then
    # view/<module>/<category>/<n>/<N>.jsx 또는 view/<module>/<n>/<N>.jsx 허용
    if ! [[ "$FILE_PATH" =~ /view/[a-z][a-z0-9_-]*/([a-z][a-z0-9_-]*/)?[a-z][a-z0-9_-]*/[A-Z][A-Za-z0-9]*\.(jsx|tsx)$ ]]; then
      # widgets 경로는 예외
      if ! [[ "$FILE_PATH" =~ /view/[a-z][a-z0-9_-]*/widgets/[a-z][a-z0-9_-]*/[A-Z][A-Za-z0-9]*\.(jsx|tsx)$ ]]; then
        warn "파일 경로가 'view/<module>/<category>/<n>/<N>.jsx' 규약에 맞지 않을 수 있음. rules/20-screen-development.md §2 참조"
      fi
    fi
  fi

  # R6. sample 폴더 복사 방지
  if [[ "$FILE_PATH" == */sample/* ]] && [[ "$FILE_PATH" != */sample/*test* ]]; then
    warn "sample/ 폴더에 작성 중. 프로덕션 화면이면 경로 확인 필요. rules/99-anti-patterns.md R6"
  fi

  # 신규 작성 (CONTENT 존재) 시에만 검증
  if [ -n "$CONTENT" ]; then

    # CG0. 신규 view/<module>/<category>/<n>/<N>.jsx · 복합 화면 → 유사 원본 참조 기록 확인
    # Composer 가 생성한 신규 화면 파일의 경우 (@wingui/common/imports 를 쓰는) 최상단 주석에
    # "참조 원본" 또는 "Reference:" 가 있어야 함 (LLM prompt 상 필수). 없으면 warn.
    if [[ "$FILE_PATH" == */view/*/*/*/*.jsx ]] \
       && grep -qE "@wingui/common/imports|ContentInner" <<<"$CONTENT" \
       && ! grep -qE "참조 원본|Reference:|based on|복제" <<<"$CONTENT"; then
      # JSX 코드에 직접 주석이 없어도 Composer 가 채팅 메시지에 명시하면 되므로 block 아닌 warn
      :   # 현재는 검증 안 함 — 대화 주도라 코드 내부 주석 강제 시 실무 부담 큼.
          # 향후 필요하면 Composer artifact metadata 기반으로 검증 확장.
    fi

    # R1. ContentInner 필수
    # 예외 (sub-component · 화면 진입점 아님):
    #   · widgets/                                 — 위젯 (대시보드 셀 등)
    #   · view/common/Pop*.jsx                      — 공용 팝업 다이얼로그
    #   · view/util/t3composer/<PascalName>.jsx     — Composer sub-component
    #     (LayoutDesigner / MenuPickerDialog / MenuTreeBrowser / StepDataInspector /
    #      ModeNewFromCopy / ModeNewFromDesign / ComposerWorkspace 등 — Wizard/Mode 진입은
    #      이미 ContentInner 를 갖춘 화면 안에서 sub-component 로만 사용)
    SKIP_R1=0
    # Windows backslash 경로도 매칭하도록 forward slash 로 normalize
    NORM_PATH="${FILE_PATH//\\//}"
    if [[ "$NORM_PATH" == */widgets/* ]]; then SKIP_R1=1; fi
    if [[ "$NORM_PATH" =~ /view/common/Pop[A-Za-z0-9]*\.(jsx|tsx)$ ]]; then SKIP_R1=1; fi
    if [[ "$NORM_PATH" =~ /view/util/t3composer/[A-Z][A-Za-z0-9]*\.(jsx|tsx)$ ]]; then SKIP_R1=1; fi
    if [ "$SKIP_R1" -eq 0 ]; then
      if ! grep -q "ContentInner" <<<"$CONTENT"; then
        block "React 화면은 반드시 <ContentInner> 래퍼 사용" "rules/20-screen-development.md §3.1, 21-components.md §1"
      fi
    fi

    # R3. gridItems 를 컴포넌트 밖에 선언했는지 (BaseGrid 사용 시)
    #   FUNC_LINE 은 React 컴포넌트(PascalCase 함수) 첫 등장 라인.
    #   helper 함수 (camelCase const = ...) 는 무시 — 그것보다 늦게 gridItems 가 와도 OK.
    if grep -q "BaseGrid" <<<"$CONTENT"; then
      if grep -q "gridItems" <<<"$CONTENT"; then
        GRID_LINE=$(grep -n "^[[:space:]]*\(let\|const\|var\)[[:space:]]\+gridItems" <<<"$CONTENT" | head -1 | cut -d: -f1 || echo 0)
        # PascalCase 컴포넌트만 매칭: function Foo / export default function Foo / const Foo = (
        FUNC_LINE=$(grep -nE "^(function[[:space:]]+[A-Z][A-Za-z0-9_]*[[:space:]]*\(|export[[:space:]]+default[[:space:]]+function[[:space:]]+[A-Z][A-Za-z0-9_]*|(const|let|var)[[:space:]]+[A-Z][A-Za-z0-9_]*[[:space:]]*=)" <<<"$CONTENT" | head -1 | cut -d: -f1 || echo 999999)
        if [ "$GRID_LINE" != "0" ] && [ "$GRID_LINE" -gt "$FUNC_LINE" ]; then
          block "gridItems 는 컴포넌트 함수 밖에 선언해야 함 (리렌더 재생성 방지)" "rules/99-anti-patterns.md R3"
        fi
      fi
    fi

    # R2. 글로벌 버튼은 setViewInfo 로 등록 (handleSearch/handleSave 이 있는데 setViewInfo 가 없으면 경고)
    if grep -qE "handleSearch|handleSave" <<<"$CONTENT"; then
      if ! grep -q "setViewInfo" <<<"$CONTENT"; then
        warn "handleSearch/handleSave 가 있으나 setViewInfo 호출 없음. 글로벌 버튼 등록 누락 가능 (rules/99-anti-patterns.md R2)"
      fi
    fi

    # R9. 하드코딩된 한글 문자열 검사 (단, 주석은 제외)
    # JSX 텍스트 내 한글이 있으면 t() 함수 사용 권장
    if grep -Pq '[\x{AC00}-\x{D7AF}]' <<<"$CONTENT" 2>/dev/null; then
      if ! grep -qE "t\(['\"]" <<<"$CONTENT"; then
        warn "한글 문자열 있으나 t() 다국어 함수 미사용 가능. rules/99-anti-patterns.md R9"
      fi
    fi
  fi
fi


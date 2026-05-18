# T3 Validator — Java 클래스 네이밍 유니크 보장 (CG-L1~L4)
#
# rules/41b §5.6.0 + rules/99a §L 단일 기준:
#   <Feature>      = MENU_FILE_PATH 마지막 PascalCase segment (그대로)
#   <feature_dir>  = LOWER(<Feature>)         — 단일 lowercase concat (하이픈/언더스코어 금지)
#   파일 4종: <Feature>.java · <Feature>Controller.java · <Feature>Service.java · <Feature>Repository.java
#   package: com.zionex.t3series.web.domain.<module>.<feature_dir>
#
# 검증:
#   1. .java 파일이 web/domain/<module>/<feature_dir>/<ClassName>.java 패턴일 때
#      lowercase(stripSuffix(ClassName, [Controller|Service|Repository|Entity|Dto|Vo|Mapper])) == <feature_dir>
#      불일치 = LLM 축약 환각 → block (CG-L1, CG-L2)
#   2. <feature_dir> 에 하이픈/언더스코어/숫자 시작 → block (CG-L3)
#   3. CONTENT 안에 `@Service("...")` / `@Controller("...")` / `@Repository("...")` 명시 빈 이름 → warn (CG-L4)
#
# Composer preview (preview/s<sid8>/...) 와 정식 산출물 (web/domain/...) 모두 적용.

if [[ "$FILE_PATH" == *.java ]]; then

  # 1) 경로에서 feature_dir + ClassName 추출
  #    매칭: .../web/domain/<module>/<feature_dir>/<ClassName>.java
  #          OR .../preview/s<sid8>/<feature_dir>/<ClassName>.java
  feature_dir=""
  class_name=""
  module_seg=""

  if [[ "$FILE_PATH" =~ /web/domain/([a-z][a-z0-9]*)/([a-z][a-z0-9]*)/([A-Z][A-Za-z0-9]+)\.java$ ]]; then
    module_seg="${BASH_REMATCH[1]}"
    feature_dir="${BASH_REMATCH[2]}"
    class_name="${BASH_REMATCH[3]}"
  elif [[ "$FILE_PATH" =~ /web/domain/([a-z][a-z0-9]*)/([a-z][a-z0-9]*)/([a-z][a-z0-9]*)/([A-Z][A-Za-z0-9]+)\.java$ ]]; then
    # <module>/<category>/<feature_dir>/<ClassName>.java
    module_seg="${BASH_REMATCH[1]}"
    feature_dir="${BASH_REMATCH[3]}"
    class_name="${BASH_REMATCH[4]}"
  elif [[ "$FILE_PATH" =~ /preview/s[a-f0-9]+/([a-z][a-z0-9]*)/([A-Z][A-Za-z0-9]+)\.java$ ]]; then
    feature_dir="${BASH_REMATCH[1]}"
    class_name="${BASH_REMATCH[2]}"
  fi

  # 1-검증) 추출 성공 시 feature_dir ↔ class_name 일치 확인
  if [ -n "$feature_dir" ] && [ -n "$class_name" ]; then

    # 1-a) feature_dir 형식 검증 (CG-L3) — 하이픈/언더스코어/숫자시작 금지
    if [[ ! "$feature_dir" =~ ^[a-z][a-z0-9]*$ ]]; then
      block "Java <feature_dir> '$feature_dir' 형식 위반 — 단일 lowercase concat 만 허용 (하이픈/언더스코어 금지). LOWER(<Feature>) 그대로 사용 (rules/41b §5.6.0, 99a §L CG-L3)"
    fi

    # 1-b) ClassName 에서 표준 suffix 제거 후 lowercase
    stripped="$class_name"
    for suffix in Controller Service Repository Entity Dto Vo Mapper RowMapper; do
      if [[ "$stripped" == *"$suffix" ]] && [ "$stripped" != "$suffix" ]; then
        stripped="${stripped%$suffix}"
        break
      fi
    done
    stripped_lower="$(echo "$stripped" | tr '[:upper:]' '[:lower:]')"

    # 1-c) 일치 검증 (CG-L1, CG-L2)
    if [ "$stripped_lower" != "$feature_dir" ]; then
      block "Java 클래스 네이밍 불일치 — 디렉토리 '$feature_dir' 와 클래스명 '$class_name' (suffix 제외 후 lowercase = '$stripped_lower') 가 1:1 일치하지 않음. LLM 축약 환각 의심. <Feature> 는 MENU_FILE_PATH 마지막 segment 그대로 사용 (rules/41b §5.6.0, 99a §L CG-L1/L2)"
    fi
  fi

  # 2) 명시 빈 이름 (CG-L4) — content 가 있을 때만
  if [ -n "$CONTENT" ]; then
    if grep -qE '@(Service|Controller|RestController|Repository|Component)\s*\(\s*"[a-zA-Z]' <<<"$CONTENT"; then
      warn "Spring 빈 이름 명시 사용 감지 — 다른 산출물과 빈 이름 충돌 위험. 기본값(클래스 첫 글자 lowercase) 사용 권장 (rules/99a §L CG-L4)"
    fi
  fi
fi

# T3SERIES Validator — wingui ResponseMessage 안티패턴 (J8/J11)
# Sourced by pre-tool-use-validator.sh (T3 overlay 가 활성일 때만)
#
# wingui 본 환경 (T3SERIES) 의 com.zionex.t3series.web.util.data.ResponseMessage 는
#   - Lombok @Builder 없음 → ResponseMessage.builder() 호출 시 컴파일 실패
#   - 정적 팩토리 (ok/error/of/ofSuccess/ofFail) 없음 → 호출 시 컴파일 실패
#   - (int status, String message) 생성자가 유일한 공식 API
#
# 단독 환경 (t3-composer) 의 ResponseMessage.java 는 [화면 실행] 호환용 별칭이 있어 동작하지만,
# 산출물을 wingui 로 sync 하면 컴파일 실패 → wingui 전체 startup down → 모든 endpoint 500.
#
# 본 hook 은 T3SERIES Target 의 산출물(.java) 에만 적용. PLANNEL 은 t3series.saas.response.ResponseMessage
# 라는 별개 클래스 (7-arg 생성자) 를 쓰므로 PLANNEL overlay 에는 해당 hook 미존재.

if [[ "$FILE_PATH" == *.java ]] && [ -n "$CONTENT" ]; then

  # J8. ResponseMessage.builder() — Lombok @Builder 없음
  if grep -qE "ResponseMessage\s*\.\s*builder\s*\(" <<<"$CONTENT"; then
    block "ResponseMessage.builder() 금지 — @Builder 미정의. 'new ResponseMessage(HttpStatus.XXX.value(), \"msg\")' 직접 생성자 사용 (rules/99-anti-patterns.md J8, 99a §J CG-J3)"
  fi

  # J11. ResponseMessage 정적 팩토리 (ok/error/of/ofSuccess/ofFail) 금지
  if grep -qE "ResponseMessage\s*\.\s*(ok|error|of|ofSuccess|ofFail)\s*\(" <<<"$CONTENT"; then
    block "ResponseMessage 정적 팩토리 (ok/error/of/ofSuccess/ofFail) 금지 — wingui 본 환경엔 (int, String) 생성자만 존재. sync 후 컴파일 실패. 표준: 'new ResponseMessage(HttpStatus.OK.value(), \"saved\")' · 'new ResponseMessage(HttpStatus.BAD_REQUEST.value(), \"changes missing\")' · 'new ResponseMessage(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage())' (rules/99-anti-patterns.md J8, 99a §J CG-J3, 41b §5.7)"
  fi
fi

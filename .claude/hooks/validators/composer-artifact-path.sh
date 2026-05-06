# T3 Validator — Composer Artifact Path (확장자 underscore 환각 차단)
# Sourced by pre-tool-use-validator.sh
#
# ─────────────────────────────────────────────────────────────────────
# 배경 (why this validator exists):
#   2026-04-29 사고 — Composer 의 자연어 생성 응답에서 ===FILE: 헤더 path 가
#   `UI_UT_USER_INFO_MENU_sql` 처럼 **확장자를 underscore** 로 끝나게 작성됨.
#
#   결과:
#     · ArtifactExtractor.classifyArtifact 의 `lower.endsWith(".sql")` 검사
#       통과 못 함 → SQL 분기 미진입 → TYPE_OTHER 로 분류
#     · MenuRegistrationDialog 가 `artifactType === 'MENU_SQL'` 매치 안 되어
#       "MENU_SQL 아티팩트가 없습니다. Claude 응답에 메뉴 등록 SQL 이 포함되지
#       않았습니다." 에러 발생
#     · 사용자가 "메뉴 등록" 버튼을 눌러도 동작 안 함
#
#   Fix (2026-04-29):
#     1) ArtifactExtractor 에 `_sql` / `_jsx` / `_java` / `_tsx` underscore
#        fallback 분기 추가 (LLM 환각 보정)
#     2) 이 hook — file_path 가 underscore 환각 패턴이면 차단
#        (Composer 가 파일 시스템에 적용할 때 2차 방어)
#
# 차단 패턴:
#   *_sql · *_jsx · *_java · *_tsx · *_yaml · *_json · *_md
#   (정규 확장자는 dot — `.sql` `.jsx` `.java` `.tsx` `.yaml` `.json` `.md`)
#
# 예외: 파일 본문 안의 식별자 (SP_UI_UT_01_Q1.sql 안의 _sql) 는 무관 —
#       file_path 의 끝자리만 검사.
# ─────────────────────────────────────────────────────────────────────

# 경로 자체가 없거나 정규 확장자면 즉시 통과
[ -z "$FILE_PATH" ] && return 0

# Tool 이 Write/Edit 가 아니면 패스 (Read/Glob 등은 무관)
case "${TOOL_NAME:-}" in
  Write|Edit|MultiEdit|NotebookEdit) ;;
  *) return 0 ;;
esac

# file_path 의 마지막 세그먼트만 추출 (디렉토리 안의 underscore 무시)
LEAF_NAME="${FILE_PATH##*/}"
LEAF_NAME="${LEAF_NAME##*\\}"   # Windows path 호환

# ─── 환각 패턴 차단 ───────────────────────────────────────────────────
case "$LEAF_NAME" in
  *_sql)
    block "파일명 확장자 환각: '${LEAF_NAME}' — 끝이 '_sql' 입니다. 정규 확장자는 '.sql' (dot). LLM 이 ===FILE: 헤더에 underscore 로 쓰면 ArtifactExtractor 가 분류 실패해 'MENU_SQL 아티팩트가 없습니다' 에러 발생. 파일명을 '${LEAF_NAME%_sql}.sql' 로 변경하세요." \
          "rules/41-composer-generation.md §14 Anti-patterns · 99a-composer-anti-patterns.md CG-G1"
    ;;
  *_jsx)
    block "파일명 확장자 환각: '${LEAF_NAME}' — 끝이 '_jsx' 입니다. 정규 확장자는 '.jsx' (dot). 파일명을 '${LEAF_NAME%_jsx}.jsx' 로 변경하세요." \
          "rules/99a-composer-anti-patterns.md CG-G1"
    ;;
  *_tsx)
    block "파일명 확장자 환각: '${LEAF_NAME}' — 끝이 '_tsx' 입니다. 정규 확장자는 '.tsx' (dot). 파일명을 '${LEAF_NAME%_tsx}.tsx' 로 변경하세요." \
          "rules/99a-composer-anti-patterns.md CG-G1"
    ;;
  *_java)
    block "파일명 확장자 환각: '${LEAF_NAME}' — 끝이 '_java' 입니다. 정규 확장자는 '.java' (dot). 파일명을 '${LEAF_NAME%_java}.java' 로 변경하세요." \
          "rules/99a-composer-anti-patterns.md CG-G1"
    ;;
  *_yaml|*_yml)
    block "파일명 확장자 환각: '${LEAF_NAME}' — 끝이 '_yaml' / '_yml' 입니다. 정규 확장자는 '.yaml' / '.yml' (dot)." \
          "rules/99a-composer-anti-patterns.md CG-G1"
    ;;
  *_json)
    block "파일명 확장자 환각: '${LEAF_NAME}' — 끝이 '_json' 입니다. 정규 확장자는 '.json' (dot)." \
          "rules/99a-composer-anti-patterns.md CG-G1"
    ;;
  *_md)
    block "파일명 확장자 환각: '${LEAF_NAME}' — 끝이 '_md' 입니다. 정규 확장자는 '.md' (dot)." \
          "rules/99a-composer-anti-patterns.md CG-G1"
    ;;
esac

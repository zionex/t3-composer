#!/usr/bin/env bash
# SessionStart hook — KTNG 프로젝트 진입 시 1회 브리핑.
# stdout 으로 출력되는 텍스트가 Claude 의 첫 system 메시지에 주입된다.

set -u

ROOT="${T3_TARGET_REPO:-c:/vs_project/KTNG}"
DB="${T3_CURRENT_DB:-mssql}"
SCHEMA="${T3_DB_SCHEMA:-T3SMARTSCM.dbo}"

# 최근 git 정보 (KTNG 레포 기준)
BRANCH="(unknown)"
RECENT=""
CHANGED=0
if [ -d "$ROOT/.git" ]; then
  BRANCH=$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "(unknown)")
  RECENT=$(git -C "$ROOT" log --oneline -n 5 2>/dev/null | sed 's/^/    - /')
  CHANGED=$(git -C "$ROOT" status --porcelain 2>/dev/null | wc -l | awk '{print $1}')
fi

cat <<EOF
<session_briefing>
🧭 KTNG (T3Series 25.1.0) 프로젝트 브리핑
  • Target repo: ${ROOT}
  • 브랜치: ${BRANCH}
  • 변경 파일 수: ${CHANGED}
  • DB: ${DB} / 스키마: ${SCHEMA}
  • 최근 5 커밋:
${RECENT}

📌 KTNG 핵심 컨벤션 (Composer/wingui 와 다른 점):
  1. MENU_CD = UI_<DOMAIN>_KTNG_<NN>  (예: UI_BF_KTNG_01, UI_DP_KTNG_05, UI_RPT_KTNG_15)
     · KTNG 도메인: BF · CM · DP · IM · MP · RPT (Report)
     · AD 도메인은 KTNG 접미 없이 일반 네이밍 (UI_AD_FILEUPLOAD 등)
  2. Java 패키지: com.zionex.t3series.web.ktng.<도메인>.<카테고리>   (★ web.domain 이 아님)
  3. JSX 경로:     view/ktng/<도메인>/<카테고리>/<feature>/<File>.jsx
  4. Controller 패턴 (Composer/wingui 본가와 다름):
     · @ExecPermission(menuCd = "UI_BF_KTNG_01", type = ServiceConstants.PERMISSION_TYPE_READ|UPDATE)
     · @PostMapping("/<m>/<cat>/<feature>/q1|s1|d1|popq1|codeq1")
     · QueryHandler.getList("SP_UI_BF_KTNG_01_Q1", params)  ← SP 직접 호출 (JdbcTemplate 아님)
     · 저장: @RequestBody List<Map<String, Object>> changes   (multipart 아님 · JSON body)
     · 응답: Map<String, Object> / List<Map<String, Object>>  (Entity 미사용)
  5. SP naming:
     · SP_UI_<DOMAIN>_KTNG_<NN>_<ACTION>   (Q1/S1/D1/S2/POP_Q1/CHART_Q1)
     · 공통코드: SP_COMM_KTNG_COMBO_LIST   (KTNG 전용)
  6. DB 변경: t3series-database/db_update_script.sql 또는 procedures/<SP>.sql
     · MSSQL 방언만 (NEWID() · GETDATE() · DECLARE @var ...)
  7. wingui 기술 스택:
     · Spring Boot 3.x + jakarta.* (javax.* 금지) · WAR 패키징
     · React 18 + Zustand + RealGrid + react-hook-form + Chart.js + MUI + Kendo
     · import: @wingui/common/imports 단일 경로 (개별 store 경로 금지)
     · 그리드: BaseGrid items={...} afterGridCreate={...} (columns/afterCreate 아님)
     · grid 객체: grid._dataProvider 또는 grid.dataProvider 양쪽 호환 (KTNG 코드는 _dataProvider 사용)
  8. KTNG 에는 Composer (T3Composer 자동 생성기) **없음** — 화면은 손으로 작성

📚 규칙 위치:
  - .claude-project/rules/  (KTNG 전용 markdown rule 8종)
  - .claude-project/hooks/  (Pre/Post/UserPrompt/SessionStart/Stop + validators)

🔒 Hooks 활성:
  - PreToolUse  → 네이밍·구조·import 검증 (위반 시 차단)
  - PostToolUse → 가벼운 syntax 점검
  - UserPromptSubmit → 키워드 감지해 관련 rule 자동 주입
  - Stop → 신규 화면 체크리스트 리마인드
</session_briefing>
EOF

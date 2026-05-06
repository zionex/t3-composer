#!/usr/bin/env bash
# =====================================================================
# user-prompt-context-injector.sh — §2 (신규 화면 / JSX 개발) 패치
# =====================================================================
# 적용 방법:
#   기존 .claude/hooks/user-prompt-context-injector.sh 의 §2 블록 (대략 65~83줄)
#   "if echo \"$PROMPT_LC\" | grep -qE \"신규 화면|new screen|...\"; then" 부터
#   해당 if 블록의 "fi" 까지를 통째로 아래 내용으로 교체.
#
#   다른 §1, §3, §4, §4.5, §5, §6, §6.5, §7 블록은 그대로 유지.
# =====================================================================

# §2. 신규 화면 · JSX 개발 키워드 (수정본)
if echo "$PROMPT_LC" | grep -qE "신규 화면|new screen|new page|화면 개발|화면 만|화면 추가|jsx|react 화면|basegrid|contentinner|wingui/src/view"; then
  INJECTED="${INJECTED}
<project_rule_reminder source=\"rules/20-screen-development.md, 21-components.md, 41a-composer-jsx.md\">
✅ 화면 개발 필수 체크 (2026-04-27 정책 전환 반영):

[파일 배치]
- 경로: packages/wingui/src/view/<module>[/<category>]/<n>/<N>.jsx
- 표준 원본 복제: Users.jsx · IssueMgmt.jsx · UserInfoMgmt.jsx (마스터 CRUD)
- ⛔ utility 도메인은 'util/' 단 하나뿐 — 'ut/' 절대 금지 (한 자리도 줄이지 않음)

[JSX 표면 — Hook 자동 차단 대상]
- import 단일 경로: @wingui/common/imports (개별 store 경로 금지)
- 최상위: <ContentInner> 래퍼 필수
- gridItems: **컴포넌트 밖** 선언 + **모든 컬럼에 dataType 명시** (text/number/datetime/boolean/group)
  · key='name', 헤더='headerText', 정렬='textAlignment' (★ field/header/textAlign 금지)
  · enum 컬럼: useDropdown:true + lookupDisplay:true + values + labels (4개 모두)
- 그리드 획득: <BaseGrid id=\"<camelCase>Grid\" items={...} afterGridCreate={(grid,view,dp)=>...} />
  · ★ columns/afterCreate 옛 API 금지 — Hook block
  · grid.dataProvider.fillJsonData / getAllStateRows / getJsonRow (★ setData/getChanges 금지)
- Grid 버튼: grid=\"<string-id>\" (★ grid={ref객체} 금지)
- Store 매핑 (swap 금지): activeViewId ← useContentStore · setViewInfo ← useViewStore
- 글로벌 버튼: setViewInfo(activeViewId, 'globalButtons', [{ name, action, visible, disable }]) 등록
  · ★ {code, onClick} 옛 키 금지 — Hook block
- showMessage(title:string, message, callback?) — callback 시그니처 (ok:boolean)=>void
  · ★ showMessage('confirm', ...) 등 type 토큰 첫 인자 금지

[서버 통신 — 신규 화면 표준 (4-tier)]
- zAxios.get('<m>/<features>', { params: getValues() }) → grid.dataProvider.fillJsonData(res.data)
- 저장: GridSaveButton onSave + multipart 'changes' (FormData)
- 삭제: zAxios POST '<m>/<features>/delete' + JSON body
- 백엔드: RestController + Service(JdbcTemplate.query(\"EXEC SP_UI_<...>_Q1 ?, ?\", ...))
- ❌ 신규 화면에서 callService(...) 사용 금지 — BF/DP/MP/FP 계산 화면 수정 전용

[Master / 공통코드 / Cascade]
- Master 필드(품목/거래처/거점/부서/직위 등) = 기본 POPUP — Pop* 재사용 (자유 text 금지)
  · 단, view/common/<X>.jsx 파일 실재 확인 후 import (PopDepartment/PopPosition 은 미실재 — 함께 생성하거나 일반 input 대체)
- 공통코드(USE_YN/USER_TP/STATUS_CD 등) = <CommonCodeSelect groupCd=\"...\"> (hardcoded options 금지)
- Cascade 컬럼 사용 시 useFieldCascade(form) + applyGridCascade(grid) 호출
- 정렬: LEFT(기본) · CENTER(코드/날짜/boolean/enum) · 'far'(숫자)
- 날짜: 'yyyy-MM-dd' (단일) / 'yyyy-MM-dd HH:mm:ss' (일시)

[메뉴 등록 — TB_AD_MENU 실제 컬럼만 사용]
- 컬럼: ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN + BaseEntity
- ❌ MENU_NM, PARENT_MENU_CD, URL, DEPTH, SORT_ORDER 컬럼 존재 안 함 (Hook block)
- MENU_CD 형식: UI_<DOMAIN>_<NAME> (★ UT_/MENU_/소문자/하이픈 금지)
- MENU_FILE_PATH: '/<module>[/<category>]/<PascalName>' (★ 마지막 직전 ≠ lowercase(마지막), 확장자 없이)
- MENU_PATH = LOWER(MENU_FILE_PATH)
- parent: MENU_UTIL/MENU_DP/MENU_MP/MENU_FP/MENU_BF/MENU_IM/MENU_RP/MENU_SA/MENU_AD (★ MENU_UT 미존재)
- 다국어: TB_AD_LANG_PACK 4개 언어 (ko/en/ja/zh) — audit 컬럼 MODIFY_BY/MODIFY_DTTM (★ UPDATE_* 아님)
- 권한: TB_AD_PERMISSION_GROUP (★ TB_AD_PERMISSION 아님) — 형제 메뉴 복사
- MSSQL 구문만: GETDATE() / NEWID() (★ SYSDATE/SYS_GUID 금지)

[백엔드 4종 + SP_UI_*.sql DDL 필수]
- t3series-wingui/src/main/java/com/zionex/t3series/web/domain/<module>/<feature>/
  · <Feature>.java (@Entity, BaseEntity 상속) — 스키마 매핑용
  · <Feature>Service.java (@Service · JdbcTemplate 인젝션) — SP 호출 전담
  · <Feature>Controller.java (@RestController) — zAxios 엔드포인트
  · <Feature>Repository.java (선택) — 단순 JPA CRUD 필요 시만
- import 화이트리스트: jakarta.* (★ javax.* 금지) · com.zionex.t3series.web.util.audit.BaseEntity
- Controller 저장: HttpServletRequest + request.getParameter(ServiceConstants.PARAMETER_KEY_DATA)
- SP DDL: t3series-database/mssql/upgrade/vX.Y.Z-YYYYMMDD/procedures/SP_UI_<DOMAIN>_<NO>_Q1/S1/D1.sql
  · MSSQL 방언만 (Oracle 폴더 생성 금지)
  · 조회 SP 결정론적 ORDER BY 필수
- ❌ 엔진 service XML (mp/dp/bf/fp server/config/*_service.xml) 신규 생성 금지 — wingui 단독 구동

[다국어]
- 한글 하드코딩 금지 — t('...') 또는 transLangKey('...') 사용
- import { transLangKey } from '@zionex/wingui-core'
- GridCnt: format={\"{0} \" + transLangKey(\"CASES\") + \" \" + transLangKey(\"MSG_0010\")} 필수

[온톨로지 — 자연어 질의 대상이면]
- tb_is_vwbusnss_ontlgy.menu_cd 등록 + status='UPTODATE' 전이

[패턴 카탈로그]
- P01 위젯대시보드 / P02 검색+단일그리드 / P03 검색+탭 / P04 수평스플릿 M-D / P06 크로스탭 피벗
- 상세 코드 스켈레톤은 rules/20-screen-development.md §9 참조

상세:
  · rules/20-screen-development.md (화면 골격 · 메뉴 등록)
  · rules/21-components.md (공용 컴포넌트 인벤토리)
  · rules/41a-composer-jsx.md (JSX 표면 단일 진실 저장소)
  · rules/41b-composer-java.md (Java 백엔드 단일 진실 저장소)
  · rules/41c-composer-widgets.md (위젯/Cascade/POPUP/CommonCode)
</project_rule_reminder>"
fi

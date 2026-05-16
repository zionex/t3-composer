import { zAxios } from '@wingui/common/imports';

/**
 * T3Composer 백엔드 (/composer/**) 호출 래퍼.
 *
 * 모든 호출에 skip401Dialog:true 지정 — 전역 "세션 만료" 다이얼로그를 건너뛰고
 * 호출부(ChatPanel 등) 가 직접 401 을 처리하도록 한다.
 * 이유: Composer 는 장시간 Claude 호출 + continuation 루프가 돌기 때문에
 * 부수 GET 요청 1개가 spurious 401 을 받아도 작업 전체를 종료시키면 안 됨.
 */

// 공용 옵션 helper — 모든 composer 호출에 동일 플래그 주입
const COMPOSER_REQ = { waitOn: false, skip401Dialog: true };
const composerReq = (extra) => ({ ...COMPOSER_REQ, ...(extra || {}) });

// ---- Target System (다중 프로젝트 메타) ----

/**
 * Target DB 의 메뉴 트리 조회 — NEW_FROM_COPY 모드에서 원본 메뉴 선택용.
 * 응답: { items: [{ id(=MENU_CD), filePath, path, displayName, items: [...] }, ...] }
 */
export const loadTargetMenuTree = (lang, targetCd) =>
  zAxios.get('composer/target/menus', composerReq({
    params: { lang: lang || 'ko', ...(targetCd ? { target: targetCd } : {}) }
  }));

/**
 * 부모 wingui 의 menus.js 를 파싱해 target-mssql 의 TB_AD_MENU 에 멱등 sync.
 * 응답: { inserted, updated, total, source, errors }
 */
export const syncTargetMenusFromWingui = () =>
  zAxios.post('composer/target/menus/sync-from-wingui', null, composerReq());

/**
 * 부모 wingui 의 db_update_script.sql 들에서 TB_AD_LANG_PACK INSERT 를 추출해
 * target-mssql 에 멱등 sync. 메뉴 ID 와 매칭되는 LANG_KEY 만 import.
 */
export const syncTargetLangpackFromWingui = () =>
  zAxios.post('composer/target/menus/langpack/sync-from-wingui', null, composerReq());

/** 활성 Target 목록 조회 */
export const listTargets = () =>
  zAxios.get('composer/targets', composerReq());

/** 단건 Target 조회 (Phase 3 동적 PromptBuilder 에서 사용 예정) */
export const getTarget = (targetCd) =>
  zAxios.get('composer/targets/' + encodeURIComponent(targetCd), composerReq());

/** Target 의 .claude/rules+hooks 를 DB 로 재적재 */
export const importClaudeAssets = (targetCd, claudeRoot) =>
  zAxios.post(
    'composer/targets/' + encodeURIComponent(targetCd) + '/import-claude',
    { claudeRoot: claudeRoot || '' },
    composerReq()
  );

// ---- API Key ----

export const getApiKeyStatus = () =>
  zAxios.get('composer/apikey/status', composerReq());

export const saveApiKey = (apiKey, description) =>
  zAxios.post('composer/apikey', { apiKey, description }, composerReq());

export const deleteApiKey = () =>
  zAxios.delete('composer/apikey', composerReq());

// ---- Sessions ----

export const createSession = ({ mode, targetMenuCd, title, modelName, targetCd }) =>
  zAxios.post('composer/sessions', { mode, targetMenuCd, title, modelName, targetCd }, composerReq());

export const listSessions = () =>
  zAxios.get('composer/sessions', composerReq());

export const getSession = (sessionId) =>
  zAxios.get(`composer/sessions/${sessionId}`, composerReq());

export const updateSessionStatus = (sessionId, status) =>
  zAxios.post(`composer/sessions/${sessionId}/status/${status}`, null, composerReq());

/**
 * 세션의 AI 엔진(modelName) 변경.
 * - 산출물 생성 후 추가 채팅, History 이어하기 등 모든 단계에서 사용 가능.
 * - 다음 chat 호출부터 새 모델로 Claude API 가 호출된다.
 * - modelName 빈 값 → 서버에서 DEFAULT_MODEL (Sonnet 4.6) 로 리셋.
 */
export const updateSessionModel = (sessionId, modelName) =>
  zAxios.post(`composer/sessions/${sessionId}/model`, { modelName }, composerReq());

export const deleteSession = (sessionId) =>
  zAxios.delete(`composer/sessions/${sessionId}`, composerReq());

// ---- Messages / Chat ----

export const listMessages = (sessionId) =>
  zAxios.get(`composer/sessions/${sessionId}/messages`, composerReq());

export const sendChat = (sessionId, message, attachmentArtifactIds, attachments) =>
  zAxios.post(
    `composer/sessions/${sessionId}/chat`,
    // attachments: D&D 로 받은 binary 파일 [{name, mediaType, base64}, ...]
    //   backend 가 Anthropic vision/document content block 으로 변환
    { message, attachmentArtifactIds, attachments },
    // max_tokens=100K + 서버 auto-continuation(최대 5회) 까지 커버. 40분.
    // 서버 Mono 체인은 client 가 끊어도 계속 진행되어 최종 결과는 DB 에 저장됨.
    // 40분을 넘는 경우 사용자가 리로드하면 listMessages 로 최종 상태 조회 가능.
    composerReq({ timeout: 2400000 })
  );

// ---- Artifacts ----

/** 세션 산출물 목록.
 *  history=false (기본) — supersede 된 이전 버전(DISCARDED) 제외, 최신만
 *  history=true — 전체 이력 (DISCARDED 포함)
 */
export const listArtifacts = (sessionId, { history = false } = {}) =>
  zAxios.get(
    `composer/sessions/${sessionId}/artifacts${history ? '?history=true' : ''}`,
    composerReq()
  );

/** Supersede 된 이전 버전(DISCARDED) 산출물 일괄 hard delete. → { deleted: N } */
export const cleanupSupersededArtifacts = (sessionId) =>
  zAxios.post(
    `composer/sessions/${sessionId}/artifacts/cleanup`,
    {},
    composerReq()
  );

export const getArtifact = (artifactId) =>
  zAxios.get(`composer/artifacts/${artifactId}`, composerReq());

// ---- Existing screen source (기존 Insight 엔드포인트 재사용) ----

export const collectSourceForLlm = (menuCd, targetCd) =>
  zAxios.post(
    'insight-apicall/screen-metadata/collect-source-for-llm',
    { menuCd, ...(targetCd ? { targetCd } : {}) },
    composerReq()
  );

/**
 * EXISTING_MODIFY — collectSourceForLlm 로 받은 소스 번들을 세션 아티팩트(DRAFT 원본)로 import.
 * 사용자가 현재 기준의 모든 파일을 아티팩트 트리에서 보고 필요한 부분만 수정. → { imported: N }
 */
export const importSourceArtifacts = (sessionId, bundle) =>
  zAxios.post(`composer/sessions/${sessionId}/import-source-artifacts`, bundle || {}, composerReq());

/** Target System DB 연결 정보 저장 / 테스트 */
export const updateTargetDbConnection = (targetCd, payload) =>
  zAxios.put(`composer/targets/${encodeURIComponent(targetCd)}/db-connection`, payload, composerReq());

export const testTargetDbConnection = (targetCd, payload) =>
  zAxios.post(`composer/targets/${encodeURIComponent(targetCd)}/db-connection/test`, payload || {}, composerReq());

/** 빠른 연결 확인 (pool 기반 SELECT 1). 작업 진입 사전 체크용 — 첫 호출 후 50ms 이하. */
export const pingTargetDbConnection = (targetCd) =>
  zAxios.get(`composer/targets/${encodeURIComponent(targetCd)}/db-connection/ping`, composerReq());

/** Target System 별 source / database 소스 폴더 경로 저장 — payload: { sourceRefPath, databaseRefPath } */
export const updateTargetRefPaths = (targetCd, payload) =>
  zAxios.put(`composer/targets/${encodeURIComponent(targetCd)}/ref-paths`, payload, composerReq());

/**
 * NEW_FROM_COPY — sourceBundle 을 LLM 한 번 호출로 분석해 9단계 spec JSON 받기.
 * 응답: { spec: {...9단계 JSON...}, modelName: "..." }
 *
 * 정규식 기반 frontend prefill 의 누락(CUD SP/FilterBar 등)을 보완.
 * 호출 시간 ~5~15초 · 토큰 약 5K~15K.
 */
export const prefillFromSource = ({ sourceBundle, newMenuCd, newTitle, moduleCode, sourceMenuCd }) =>
  zAxios.post(
    'composer/prefill-from-source',
    { sourceBundle, newMenuCd, newTitle, moduleCode, sourceMenuCd },
    composerReq()
  );

/**
 * 산출물 적용 직전 사전 검증 — 자주 발생하는 오류를 자동 보정.
 * 응답: { success, totalFixCount, fileCount, files: [{ artifactType, filePath, fixes:[{rule,description}] }] }
 */
export const preflightArtifacts = (sessionId) =>
  zAxios.post(`composer/sessions/${sessionId}/preflight`, null, composerReq());

/**
 * NEW_FROM_DESIGN 모드 wizard 진입 직전 — Excel 설계서를 LLM 한 번 호출로 분석해
 * 9단계 spec JSON 을 prefill.
 *
 * 응답: { spec: {...9단계 JSON...}, modelName: "..." }
 *
 * 정규식 기반 baseline (createInitialSpecFromDesign) 만으로는 Step4 dataBinding /
 * Step7 filter / Step8 cascade 가 비어있는 문제를 보완.
 * 호출 시간 ~5~15초 · 토큰 약 5K~15K.
 */
export const prefillFromDesign = ({ parsedDesign, fileName, newMenuCd, newTitle, moduleCode }) =>
  zAxios.post(
    'composer/prefill-from-design',
    { parsedDesign, fileName, newMenuCd, newTitle, moduleCode },
    composerReq()
  );

// ---- Menu Registration ----

// sqlOverride: 트리 픽커 등으로 수정한 SQL. null 이면 서버가 저장된 산출물 그대로 실행.
export const executeMenuSql = (sessionId, sqlOverride = null) =>
  zAxios.post(
    `composer/sessions/${sessionId}/execute-menu-sql`,
    sqlOverride ? { sqlOverride } : {},
    composerReq()
  );

// 산출물 자동 적용 — 파일 저장 / DDL 실행 / SP 실행
// opts: { applyFiles, executeDdl, executeSp, overwrite }
export const applyArtifacts = (sessionId, opts = {}) =>
  zAxios.post(
    `composer/sessions/${sessionId}/apply-artifacts`,
    opts,
    composerReq({ timeout: 300000 })
  );

// Phase 2a — Preview (docker 컨테이너 안에서 검증 — JSX/SQL/MENU)
// options.skipJava=true → Sample 모드: Java 산출물 적용·mvn compile·재기동 생략 (10~20초 backend down 회피).
//                          frontend Sample shim 이 axios 응답 가로채므로 backend 미동작 OK.
export const applyPreview = (sessionId, options = {}) => {
  const qs = options.skipJava ? '?skipJava=true' : '';
  return zAxios.post(
    `composer/sessions/${sessionId}/preview/apply${qs}`,
    {},
    composerReq({ timeout: options.skipJava ? 30000 : 120000 }),
  );
};

export const confirmPreview = (sessionId, opts = {}) =>
  zAxios.post(
    `composer/sessions/${sessionId}/preview/confirm`,
    opts,
    composerReq({ timeout: 300000 })
  );

export const cancelPreview = (sessionId) =>
  zAxios.post(
    `composer/sessions/${sessionId}/preview/cancel`,
    {},
    composerReq({ timeout: 60000 })
  );

export const checkMenuExists = (menuCd) =>
  zAxios.get(`composer/menus/${menuCd}/exists`, composerReq());

// ---- 테이블 자동 lookup (NEW_NL 모드 — 사용자가 입력한 테이블명의 존재 여부 + 컬럼 자동 조회) ----
// targetCd 미지정 또는 연결 실패 시 backend 가 빈 결과 반환 — TB_* 운영 테이블은 Target Operational DB(MSSQL) 에만 존재.

/** 단일 테이블 존재 여부만 빠르게 — { tableName, exists } */
export const checkTableExists = (tableName, targetCd) =>
  zAxios.get(
    `composer/schema/tables/${encodeURIComponent(tableName)}/exists`
      + (targetCd ? `?targetCd=${encodeURIComponent(targetCd)}` : ''),
    composerReq(),
  );

/** 단일 테이블 메타 (컬럼 + PK) — TableInfo */
export const getTableInfo = (tableName, targetCd) =>
  zAxios.get(
    `composer/schema/tables/${encodeURIComponent(tableName)}`
      + (targetCd ? `?targetCd=${encodeURIComponent(targetCd)}` : ''),
    composerReq(),
  );

/** 배치 lookup — { results: {NAME: TableInfo, ...}, formattedForPrompt: "..." } */
export const lookupTables = (names, targetCd) =>
  zAxios.post(`composer/schema/tables/lookup`, { names, targetCd }, composerReq());

/** 자연어 prompt 에서 TB_* 패턴 자동 추출 + lookup */
export const extractAndLookupTables = (text, targetCd) =>
  zAxios.post(`composer/schema/tables/extract`, { text, targetCd }, composerReq());

/**
 * SP 명 배치 lookup — target Operational DB(MSSQL) 의 sys.procedures 조회.
 * { results: {SP_NAME: ProcedureInfo, ...}, formattedForPrompt: "..." }
 */
export const lookupProcedures = (names, targetCd) =>
  zAxios.post(`composer/schema/procedures/lookup`, { names, targetCd }, composerReq());

/**
 * 자연어 prompt 에서 SP_* 패턴 자동 추출 + lookup (target DB 기준).
 * targetCd 미지정/연결 실패 시 결과 비어있음 — 호출부가 폴백.
 */
export const extractAndLookupProcedures = (text, targetCd) =>
  zAxios.post(`composer/schema/procedures/extract`, { text, targetCd }, composerReq());

// ---- Data Source 별자리 맵 (전체 목록 + 도메인 그래프) ----
// Target Operational DB(MSSQL) 의 INFORMATION_SCHEMA / sys.objects 조회.
// 미연결 시 connected=false + 빈 배열.

/** 전체 테이블/뷰 목록 — { targetCd, connected, tables: [{tableName,tableSchema,tableType,domain}] } */
export const listSchemaTables = (targetCd) =>
  zAxios.get('composer/schema/tables', composerReq({ params: targetCd ? { targetCd } : {} }));

/** 전체 SP/Function 목록 — { targetCd, connected, procedures: [{procedureName,procedureSchema,objectType,domain}] } */
export const listSchemaProcedures = (targetCd) =>
  zAxios.get('composer/schema/procedures', composerReq({ params: targetCd ? { targetCd } : {} }));

/** 한 도메인의 서브 그래프 — { domain, connected, nodes, edges, dependencyGraphAvailable, truncated } */
export const getSchemaGraph = (targetCd, domain) =>
  zAxios.get('composer/schema/graph', composerReq({
    params: { ...(targetCd ? { targetCd } : {}), ...(domain ? { domain } : {}) },
  }));

// ---- Design Doc Excel ----

export const downloadDesignDoc = (sessionId) =>
  zAxios.get(`composer/sessions/${sessionId}/design-doc`, composerReq({
    responseType: 'blob',
    timeout: 60000,
  }));

// ---- Design Doc — Query TAB AI 분석 ----
//   · Excel 의 Query 시트 텍스트를 LLM 에 보내 grid 별 SP 매핑을 JSON 으로 받기
//   · 백엔드: composer/design-doc/analyze-query 엔드포인트 (서버 Claude 호출)
//   · 서버 엔드포인트가 미구현이면 404 반환 → 클라이언트는 heuristic fallback
export const analyzeQuerySheet = (payload) =>
  zAxios.post('composer/design-doc/analyze-query', payload, composerReq({
    timeout: 180000,
  }));

// ---- Meta (Wizard 입력 보조) ----

export const listAllMenus = (lang) => {
  // 현 사용자 언어 추론 — localStorage 또는 navigator.language 폴백
  const resolved = lang
    || localStorage.getItem('languageCode')
    || sessionStorage.getItem('languageCode')
    || (navigator.language || 'ko').slice(0, 2);
  return zAxios.get('composer/meta/menus', composerReq({ params: { lang: resolved } }));
};

export const listAllGroups = () =>
  zAxios.get('composer/meta/groups', composerReq());

export const listDbTables = (q, limit = 500) =>
  zAxios.get('composer/meta/tables', composerReq({ params: { q, limit } }));

export const listDbColumns = (tableName) =>
  zAxios.get(`composer/meta/tables/${tableName}/columns`, composerReq());

export const listOntologyView = (q, limit = 500) =>
  zAxios.get('composer/meta/ontology/view', composerReq({ params: { q, limit } }));

export const listOntologyQa = (q, limit = 500) =>
  zAxios.get('composer/meta/ontology/qa', composerReq({ params: { q, limit } }));

export const listOntologyProcess = (q, limit = 500) =>
  zAxios.get('composer/meta/ontology/process', composerReq({ params: { q, limit } }));

export const listOntologyEntity = (q, limit = 500) =>
  zAxios.get('composer/meta/ontology/entity', composerReq({ params: { q, limit } }));

// ---- Patterns (화면 구성 카탈로그) ----

export const listPatterns = (activeOnly = false) =>
  zAxios.get('composer/patterns', composerReq({ params: { activeOnly } }));

export const getPattern = (id) =>
  zAxios.get(`composer/patterns/${id}`, composerReq());

export const createPattern = (data) =>
  zAxios.post('composer/patterns', data, composerReq());

export const updatePattern = (id, data) =>
  zAxios.put(`composer/patterns/${id}`, data, composerReq());

export const togglePatternActive = (id) =>
  zAxios.post(`composer/patterns/${id}/toggle-active`, null, composerReq());

export const deletePattern = (id) =>
  zAxios.delete(`composer/patterns/${id}`, composerReq());

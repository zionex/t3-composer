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

// ---- API Key ----

export const getApiKeyStatus = () =>
  zAxios.get('composer/apikey/status', composerReq());

export const saveApiKey = (apiKey, description) =>
  zAxios.post('composer/apikey', { apiKey, description }, composerReq());

export const deleteApiKey = () =>
  zAxios.delete('composer/apikey', composerReq());

// ---- Sessions ----

export const createSession = ({ mode, targetMenuCd, title, modelName }) =>
  zAxios.post('composer/sessions', { mode, targetMenuCd, title, modelName }, composerReq());

export const listSessions = () =>
  zAxios.get('composer/sessions', composerReq());

export const getSession = (sessionId) =>
  zAxios.get(`composer/sessions/${sessionId}`, composerReq());

export const updateSessionStatus = (sessionId, status) =>
  zAxios.post(`composer/sessions/${sessionId}/status/${status}`, null, composerReq());

/**
 * 세션의 AI 엔진(modelName) 변경.
 * - 아티팩트 생성 후 추가 채팅, History 이어하기 등 모든 단계에서 사용 가능.
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

export const sendChat = (sessionId, message, attachmentArtifactIds) =>
  zAxios.post(
    `composer/sessions/${sessionId}/chat`,
    { message, attachmentArtifactIds },
    // max_tokens=100K + 서버 auto-continuation(최대 5회) 까지 커버. 40분.
    // 서버 Mono 체인은 client 가 끊어도 계속 진행되어 최종 결과는 DB 에 저장됨.
    // 40분을 넘는 경우 사용자가 리로드하면 listMessages 로 최종 상태 조회 가능.
    composerReq({ timeout: 2400000 })
  );

// ---- Artifacts ----

/** 세션 아티팩트 목록.
 *  history=false (기본) — supersede 된 이전 버전(DISCARDED) 제외, 최신만
 *  history=true — 전체 이력 (DISCARDED 포함)
 */
export const listArtifacts = (sessionId, { history = false } = {}) =>
  zAxios.get(
    `composer/sessions/${sessionId}/artifacts${history ? '?history=true' : ''}`,
    composerReq()
  );

/** Supersede 된 이전 버전(DISCARDED) 아티팩트 일괄 hard delete. → { deleted: N } */
export const cleanupSupersededArtifacts = (sessionId) =>
  zAxios.post(
    `composer/sessions/${sessionId}/artifacts/cleanup`,
    {},
    composerReq()
  );

export const getArtifact = (artifactId) =>
  zAxios.get(`composer/artifacts/${artifactId}`, composerReq());

// ---- Existing screen source (기존 Insight 엔드포인트 재사용) ----

export const collectSourceForLlm = (menuCd) =>
  zAxios.post(
    'insight-apicall/screen-metadata/collect-source-for-llm',
    { menuCd },
    composerReq()
  );

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
 * 아티팩트 적용 직전 사전 검증 — 자주 발생하는 오류를 자동 보정.
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

// sqlOverride: 트리 픽커 등으로 수정한 SQL. null 이면 서버가 저장된 아티팩트 그대로 실행.
export const executeMenuSql = (sessionId, sqlOverride = null) =>
  zAxios.post(
    `composer/sessions/${sessionId}/execute-menu-sql`,
    sqlOverride ? { sqlOverride } : {},
    composerReq()
  );

// 아티팩트 자동 적용 — 파일 저장 / DDL 실행 / SP 실행
// opts: { applyFiles, executeDdl, executeSp, overwrite }
export const applyArtifacts = (sessionId, opts = {}) =>
  zAxios.post(
    `composer/sessions/${sessionId}/apply-artifacts`,
    opts,
    composerReq({ timeout: 300000 })
  );

// Phase 2a — Preview (docker 컨테이너 안에서 검증 — JSX/SQL/MENU)
export const applyPreview = (sessionId) =>
  zAxios.post(
    `composer/sessions/${sessionId}/preview/apply`,
    {},
    composerReq({ timeout: 120000 })
  );

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

/** 단일 테이블 존재 여부만 빠르게 — { tableName, exists } */
export const checkTableExists = (tableName) =>
  zAxios.get(`composer/schema/tables/${encodeURIComponent(tableName)}/exists`, composerReq());

/** 단일 테이블 메타 (컬럼 + PK + 행수 추정) — TableInfo */
export const getTableInfo = (tableName) =>
  zAxios.get(`composer/schema/tables/${encodeURIComponent(tableName)}`, composerReq());

/** 배치 lookup — { results: {NAME: TableInfo, ...}, formattedForPrompt: "..." } */
export const lookupTables = (names) =>
  zAxios.post(`composer/schema/tables/lookup`, { names }, composerReq());

/** 자연어 prompt 에서 TB_* 패턴 자동 추출 + lookup */
export const extractAndLookupTables = (text) =>
  zAxios.post(`composer/schema/tables/extract`, { text }, composerReq());

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

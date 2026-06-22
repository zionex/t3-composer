import { zAxios } from '@wingui/common/imports';
import { getUiLanguage } from './useUiLanguage';

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

export const createSession = ({ mode, targetMenuCd, title, modelName, targetCd, ruleScope, lang }) =>
  zAxios.post('composer/sessions',
    // lang: Claude 응답 언어 ('ko'|'en'). 미지정 시 현재 UI 언어 자동 첨부.
    //   산출물 코드는 system prompt 강제로 한국어 라벨 유지 (운영 환경 한국어).
    { mode, targetMenuCd, title, modelName, targetCd, ruleScope, lang: lang || getUiLanguage() },
    composerReq());

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
    // lang: 현재 UI 언어 자동 첨부 — Claude 응답 언어 동기화 (산출물 코드는 한국어 유지)
    { message, attachmentArtifactIds, attachments, lang: getUiLanguage() },
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

/** Target System 별 source / backend / database 폴더 경로 저장 — payload: { sourceRefPath, backendRefPath, databaseRefPath } */
export const updateTargetRefPaths = (targetCd, payload) =>
  zAxios.put(`composer/targets/${encodeURIComponent(targetCd)}/ref-paths`, payload, composerReq());

/**
 * Workspace 폴더 한 단계 listing (UI 폴더 picker 용).
 * params: { path?: string } — 비우면 컨테이너 안의 /workspace/projects 시작.
 * 응답: { ok, path, parent, initial_cwd, is_root, items: [{name, type:'dir', child_count}], message? }
 */
export const browseFs = (path) =>
  zAxios.get('composer/fs/browse', composerReq({
    params: path ? { path } : {}
  }));

// ---- Target 거버넌스 설정 스냅샷 / 복원 ----
// 현재 디스크의 .claude/** · CLAUDE.md · README.md · TROUBLESHOOTING.md · .env · docs/**
// + TB_CMP_TARGET_SYSTEM 행을 시점 스냅샷으로 DB 에 저장 / 디스크로 복원.

const tgt = (cd) => `composer/targets/${encodeURIComponent(cd)}`;

/** 현재 디스크를 새 스냅샷으로 저장. body: { label?, kind? } (kind='SEED' 면 최초) */
export const captureTargetSnapshot = (targetCd, { label, kind } = {}) =>
  zAxios.post(`${tgt(targetCd)}/snapshots`, { label, kind }, composerReq({ timeout: 120000 }));

/** 스냅샷 목록 (헤더만) */
export const listTargetSnapshots = (targetCd) =>
  zAxios.get(`${tgt(targetCd)}/snapshots`, composerReq());

/** 스냅샷 상세 (헤더 + 파일 메타) */
export const getTargetSnapshot = (targetCd, snapshotId) =>
  zAxios.get(`${tgt(targetCd)}/snapshots/${encodeURIComponent(snapshotId)}`, composerReq());

/** 현재 디스크 vs is_current 스냅샷 diff — { hasSnapshot, inSync, missing, modified, extra, changeCount } */
export const getTargetSnapshotStatus = (targetCd) =>
  zAxios.get(`${tgt(targetCd)}/snapshot-status`, composerReq());

/** 특정 스냅샷 복원. dryRun=true 면 변경 없이 created/overwritten/deleted 목록만. */
export const restoreTargetSnapshot = (targetCd, snapshotId, { dryRun = false } = {}) =>
  zAxios.post(
    `${tgt(targetCd)}/snapshots/${encodeURIComponent(snapshotId)}/restore`,
    { dryRun },
    composerReq({ timeout: 120000 }),
  );

/** is_current 스냅샷 복원 — Target 전환 자동복원 단축 경로. */
export const restoreCurrentTargetSnapshot = (targetCd, { dryRun = false } = {}) =>
  zAxios.post(
    `${tgt(targetCd)}/snapshots/restore-current`,
    { dryRun },
    composerReq({ timeout: 120000 }),
  );

/** 스냅샷 삭제 (is_current 는 거부됨) */
export const deleteTargetSnapshot = (targetCd, snapshotId) =>
  zAxios.delete(`${tgt(targetCd)}/snapshots/${encodeURIComponent(snapshotId)}`, composerReq());

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

/**
 * AI 추천 — 자연어 + 압축 mockup 후보를 보내 상위 3개를 AI 재랭킹.
 * 응답: { items: [{ patternCode, relevance, reason }], mode: 'ai'|'fallback', model }
 *   mode==='fallback' (키 없음/호출 실패) → 호출부가 프런트 키워드 순서로 폴백.
 * textAttachments / binaryAttachments: AiRecommendPanel D&D 참조 파일 (선택)
 */
export const recommendMockups = ({ nl, candidates, textAttachments, binaryAttachments }) =>
  zAxios.post(
    'composer/recommend-mockups',
    { nl, candidates, textAttachments, binaryAttachments },
    composerReq()
  );

/**
 * AI 추천 — 선택한 mockup + 자연어로 4단계 Wizard 부분 prefill.
 * 응답: { spec: { meta?, filterBar? }, mode: 'ai'|'fallback', model }
 *   데이터바인딩(실제 테이블/SP)은 채우지 않음 — §13.7 환각 방지.
 */
export const prefillFromMockup = ({
  nl, mockupPatternCode, mockupMeta, moduleCode, targetCd,
  textAttachments, binaryAttachments,
}) =>
  zAxios.post(
    'composer/prefill-from-mockup',
    { nl, mockupPatternCode, mockupMeta, moduleCode, targetCd, textAttachments, binaryAttachments },
    composerReq()
  );

/**
 * AI 추천 — 재조합된 synthesized mockup + 자연어로 4단계 Wizard 부분 prefill.
 * 응답: { spec: { meta?, filterBar? }, mode: 'ai'|'fallback', model }
 *   prefillFromMockup 과 응답 shape 동일 — 호출부 mergeAiPrefillIntoSpec 재사용.
 */
export const prefillFromSynthesized = ({
  nl, synthesized, moduleCode, targetCd,
  textAttachments, binaryAttachments,
}) =>
  zAxios.post(
    'composer/prefill-from-synthesized',
    { nl, synthesized, moduleCode, targetCd, textAttachments, binaryAttachments },
    composerReq()
  );

/**
 * AI 추천 — 첨부 설계 이미지 → ComposerSpec 직접 추론 (Claude vision).
 * 응답: { spec: { meta?, layers?, filterBar? }, mode: 'ai'|'fallback', model }
 *   binaryAttachments 의 image/* 만 사용. 자연어/모듈코드/타겟은 보조.
 */
export const specFromImage = ({ nl, moduleCode, targetCd, binaryAttachments }) =>
  zAxios.post(
    'composer/spec-from-image',
    { nl, moduleCode, targetCd, binaryAttachments },
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
// timeout: AI mockup transform (JSX 1개당 5~10초, 캐시 miss 시) 을 충분히 커버.
//          캐시 hit 후엔 즉시 끝나므로 상한만 넉넉히. backend async timeout(45분) 보다는 짧게.
export const applyPreview = (sessionId, options = {}) => {
  const qs = options.skipJava ? '?skipJava=true' : '';
  return zAxios.post(
    `composer/sessions/${sessionId}/preview/apply${qs}`,
    {},
    composerReq({ timeout: 600000 }),
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

export const checkMenuExists = (menuCd, targetCd) =>
  zAxios.get(`composer/menus/${menuCd}/exists`,
    composerReq({ params: targetCd ? { target: targetCd } : undefined }));

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

// ──────────────── Ontology Tab (CRUD + suggest) ────────────────

export const fetchOntologyTree = (targetCd, q) =>
  zAxios.get('composer/ontology/tree', composerReq({
    params: { ...(targetCd ? { targetCd } : {}), ...(q ? { q } : {}) }
  }));

export const fetchQa = (id, targetCd) =>
  zAxios.get(`composer/ontology/qa/${encodeURIComponent(id)}`, composerReq({
    params: targetCd ? { targetCd } : {}
  }));

export const fetchQaBulk = (ids, targetCd) =>
  zAxios.get('composer/ontology/qa/bulk', composerReq({
    params: { ids: (ids || []).join(','), ...(targetCd ? { targetCd } : {}) }
  }));

export const createQa = (dto, targetCd) =>
  zAxios.post('composer/ontology/qa', dto, composerReq({
    params: targetCd ? { targetCd } : {},
    headers: { 'Content-Type': 'application/json' },
  }));

export const updateQa = (id, dto, modifyDttm, targetCd) =>
  zAxios.put(`composer/ontology/qa/${encodeURIComponent(id)}`, dto, composerReq({
    params: targetCd ? { targetCd } : {},
    headers: {
      'Content-Type': 'application/json',
      ...(modifyDttm ? { 'If-Match': modifyDttm } : {}),
    },
  }));

export const deleteQa = (id, targetCd) =>
  zAxios.delete(`composer/ontology/qa/${encodeURIComponent(id)}`, composerReq({
    params: targetCd ? { targetCd } : {},
  }));

export const fetchEntity = (id, targetCd) =>
  zAxios.get(`composer/ontology/entity/${encodeURIComponent(id)}`, composerReq({
    params: targetCd ? { targetCd } : {}
  }));

export const fetchEntityBulk = (ids, targetCd) =>
  zAxios.get('composer/ontology/entity/bulk', composerReq({
    params: { ids: (ids || []).join(','), ...(targetCd ? { targetCd } : {}) }
  }));

export const createEntity = (dto, targetCd) =>
  zAxios.post('composer/ontology/entity', dto, composerReq({
    params: targetCd ? { targetCd } : {},
    headers: { 'Content-Type': 'application/json' },
  }));

export const updateEntity = (id, dto, targetCd) =>
  zAxios.put(`composer/ontology/entity/${encodeURIComponent(id)}`, dto, composerReq({
    params: targetCd ? { targetCd } : {},
    headers: { 'Content-Type': 'application/json' },
  }));

export const deleteEntity = (id, targetCd) =>
  zAxios.delete(`composer/ontology/entity/${encodeURIComponent(id)}`, composerReq({
    params: targetCd ? { targetCd } : {},
  }));

export const fetchViewMeta = (menuCd, targetCd) =>
  zAxios.get(`composer/ontology/view/${encodeURIComponent(menuCd)}`, composerReq({
    params: targetCd ? { targetCd } : {}
  }));

export const fetchProcessMeta = (processCd, targetCd) =>
  zAxios.get(`composer/ontology/process/${encodeURIComponent(processCd)}`, composerReq({
    params: targetCd ? { targetCd } : {}
  }));

export const ontologySuggest = (req) =>
  zAxios.post('composer/ontology/suggest', req, composerReq({
    headers: { 'Content-Type': 'application/json' },
  }));

/**
 * .insight_code/ontology_v2/ JSON 파일을 Target DB 로 일괄 import.
 * skip-existing 정책 — 이미 있는 id 는 건드리지 않음.
 * 응답: { targetCd, ontologyRoot, hasFolder, qa, entity, view, process } —
 *   각 카테고리는 { added, skipped, available, skippedReason }.
 */
export const importOntologyFromFs = (targetCd) =>
  zAxios.post('composer/ontology/import-from-fs', null, composerReq({
    params: { targetCd },
  }));

/**
 * Target 의 filesystem reader 캐시 폐기 + 재스캔.
 * Import 다이얼로그 진입 시 호출해 최신 카운트 표시.
 */
export const refreshOntologyCache = (targetCd) =>
  zAxios.post('composer/ontology/refresh', null, composerReq({
    params: { targetCd },
  }));

/**
 * Q&A Answer SQL 미리보기 — Target DB 에서 SELECT 만 실행, TOP 100 자동, timeout 10초.
 * 성공: { columns, sqlTypes, rows, rowCount, elapsedMs, truncated, topInjected, executedSql }
 * 실패: { error: { code, message, sqlState? } } (HTTP 4xx/5xx)
 */
export const previewOntologySql = (sql, targetCd, dbType) =>
  zAxios.post('composer/ontology/sql/preview', { sql, targetCd, dbType }, composerReq({
    headers: { 'Content-Type': 'application/json' },
  }));

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

// Phase 2D-3 — AI 추천 (FilterBar fields + Layer relations).
//   현재 ComposerSpec 을 보내고 Claude 가 추천한 항목 받음.
//   instruction (선택): 사용자 추가 지시 (예: "기간 조건 추가"). null/blank 이면 spec 으로 자동 유추.
//   응답: { filterFields: [{label, type}], relations: [{sourceLayerKey, sourceEvent, targetLayerKey, targetAction, mapping}] }
export const autoSuggestSpec = (spec, instruction) =>
  zAxios.post('composer/spec/auto-suggest', { spec, instruction }, composerReq());

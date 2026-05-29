/**
 * AI 추천 진입(AiRecommendPanel) 전용 순수 유틸 — 의존성 없음(문자열/객체 연산만).
 *   - scoreMockupCandidates: 자연어와 MOCKUP_ENTRIES 키워드 매칭 점수
 *   - buildMockupCandidates: 백엔드 recommend-mockups 로 보낼 압축 후보(top N)
 *   - mergeAiPrefillIntoSpec: prefill-from-mockup 응답({meta,filterBar})을
 *     specFromMockup 베이스라인(createComposerSpec shape)에 병합
 *
 * spec: docs/superpowers/specs/2026-05-28-composer-ai-recommend-start-design.md
 */

// 자연어에서 검색 토큰 추출 — 한글/영문/숫자 2자 이상.
export function tokenizeNl(nl) {
  if (!nl || typeof nl !== 'string') return [];
  return nl
    .toLowerCase()
    .split(/[^가-힣a-z0-9]+/)
    .filter((t) => t.length >= 2);
}

// 한 entry 의 검색 대상 텍스트 (라벨 + 설명 + 카테고리). 메뉴명은 scoreMockupCandidates 에서
// matchedMenus 가중으로 별도 반영하므로 여기 포함하지 않음(이중 카운트 방지).
function entrySearchText(entry) {
  return `${entry.patternLabel || ''} ${entry.description || ''} ${entry.category || ''} ${entry.layoutCategory || ''}`.toLowerCase();
}

/**
 * 자연어 ↔ MOCKUP_ENTRIES 키워드 매칭 점수.
 * @returns [{ entry, score, matchedMenus }] — score 내림차순, score>0 만.
 *   menuNm 매칭은 +1 가중(운영 메뉴명 일치가 의도와 더 직접적).
 */
export function scoreMockupCandidates(nl, entries) {
  const tokens = tokenizeNl(nl);
  if (tokens.length === 0 || !Array.isArray(entries)) return [];
  const scored = [];
  for (const entry of entries) {
    const text = entrySearchText(entry);
    let score = 0;
    for (const tok of tokens) if (text.includes(tok)) score += 1;
    const matchedMenus = (entry.menus || []).filter((m) =>
      tokens.some((tok) => (m.menuNm || '').toLowerCase().includes(tok)));
    score += matchedMenus.length; // 메뉴명 매칭 = +1/건 (base 텍스트엔 메뉴 미포함)
    if (score > 0) scored.push({ entry, score, matchedMenus });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * 백엔드 recommend-mockups 로 보낼 압축 후보(top N) 생성.
 * component 참조는 빼고 텍스트 메타 + layer 구조만 (재조합 재료 — Task 4 의 합성 prompt 가 사용).
 */
export function buildMockupCandidates(nl, entries, limit = 12) { // limit=12: 백엔드 LLM 재랭킹 토큰 예산 상한
  return scoreMockupCandidates(nl, entries)
    .slice(0, limit)
    .map(({ entry }) => ({
      patternCode: entry.patternCode,
      label: entry.patternLabel || '',
      description: entry.description || '',
      category: entry.category || '',
      productLine: entry.productLine || '',
      menuNames: (entry.menus || []).map((m) => m.menuNm || '').filter(Boolean),
      // 신규: 재조합 재료 — layer 의 type/title/position 만 (component 는 미포함)
      layers: (entry.layers || []).map((l) => ({
        key: l.key,
        title: l.title,
        type: l.type,
        subtype: l.subtype || null,
        position: l.position,
      })),
    }));
}

/**
 * prefill-from-mockup 응답을 specFromMockup 베이스라인에 병합.
 *   baseSpec: createComposerSpec shape — { meta, filterBar:{items,affects}, layers, relations }
 *   aiSpec:   { meta?: {title,menuCd,parentMenuCd,menuFilePath}, filterBar?: { items: [{key,label,type}] } }
 *   - meta: 빈 값이 아닌 필드만 덮어씀
 *   - filterBar.items: AI 가 1개 이상 주면 교체(affects 는 유지)
 *   - layers/relations: 손대지 않음(데이터바인딩은 NL 힌트 그대로)
 */
export function mergeAiPrefillIntoSpec(baseSpec, aiSpec) {
  if (!baseSpec) return baseSpec;
  if (!aiSpec || typeof aiSpec !== 'object') return baseSpec;
  const out = { ...baseSpec };

  if (aiSpec.meta && typeof aiSpec.meta === 'object') {
    const mergedMeta = { ...(baseSpec.meta || {}) };
    for (const k of ['title', 'menuCd', 'parentMenuCd', 'menuFilePath']) {
      const v = aiSpec.meta[k];
      if (v != null && String(v).trim() !== '') mergedMeta[k] = v;
    }
    out.meta = mergedMeta;
  }

  if (aiSpec.filterBar && Array.isArray(aiSpec.filterBar.items) && aiSpec.filterBar.items.length > 0) {
    const items = aiSpec.filterBar.items
      .filter((it) => it && (it.key || it.label))
      .map((it) => ({
        key: it.key || it.label,
        label: it.label || it.key,
        type: it.type || 'TEXT',
      }));
    if (items.length > 0) {
      out.filterBar = {
        ...(baseSpec.filterBar || {}),
        items,
        affects: (baseSpec.filterBar && baseSpec.filterBar.affects) || {},
      };
    }
  }

  return out;
}

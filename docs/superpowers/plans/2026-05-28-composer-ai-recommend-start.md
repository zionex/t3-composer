# AI 추천으로 화면 시작 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 단계별 화면 생성(`ModeNewStep`)에 "AI 추천" 진입점을 추가 — 자연어로 SCM UI Mockup 상위 3개를 추천(AI 의미분석 + 키워드 폴백)하고, 선택 시 4단계 Wizard 를 AI 가 자동 prefill(Layout + 검색조건 + 메타) 한다.

**Architecture:** 프런트는 `MOCKUP_ENTRIES`(기존 mockup 카탈로그)에서 키워드로 후보를 압축해 백엔드 `recommend-mockups` 로 보내 AI 재랭킹받고, 선택 시 `prefill-from-mockup` 으로 `{meta, filterBar}` 부분 spec 을 받아 `specFromMockup` 베이스라인에 병합한 뒤 기존 `ComposerWizard` 로 진입한다. 데이터바인딩(실제 테이블/SP)은 AI 가 확정하지 않고 NL 힌트로 남겨 사용자가 Data Source 탐색에서 고른다(§13.7 환각 방지). API 키 없음/Anthropic 실패 시 두 경로 모두 키워드 폴백/`specFromMockup`-only 로 graceful degradation.

**Tech Stack:** React 18 + MUI 5 (frontend), Spring Boot 3 + Anthropic SDK 패턴(`AnthropicClient`), 기존 `PrefillFromSourceService` 호출 패턴 재사용. 테스트 인프라 없음 → 순수 함수는 `@babel/core` 컴파일 기반 node 단언 스크립트로 검증, UI/백엔드는 webpack build / `mvn compile` + 수동 검증.

---

## 파일 구조

**Frontend (`frontend/src/view/util/t3composer/`)**
- `mockupRecommend.js` (신규) — 순수 함수: `scoreMockupCandidates` · `buildMockupCandidates` · `mergeAiPrefillIntoSpec`. 의존성 없음(문자열/객체 연산만) → 단독 검증 가능.
- `api.js` (수정) — `recommendMockups` · `prefillFromMockup` 추가.
- `AiRecommendPanel.jsx` (신규) — B 레이아웃 화면. 좌 NL 입력 / 우 3카드 + 꾹눌러 확대. `mockupRecommend.js` + `api.js` + `MOCKUP_ENTRIES` 사용.
- `ModeNewStep.jsx` (수정) — 4번째 카드 "AI 추천" + stage `'AI_RECOMMEND'` 분기.

**Backend (`backend/src/main/java/com/zionex/t3composer/domain/`)**
- `dto/RecommendMockupRequest.java` (신규)
- `dto/PrefillFromMockupRequest.java` (신규)
- `service/RecommendMockupService.java` (신규) — Anthropic 재랭킹, 키 없음/실패 시 `mode:'fallback'`.
- `service/PrefillFromMockupService.java` (신규) — `{meta, filterBar}` 생성, 키 없음/실패 시 `{spec:{}, mode:'fallback'}`.
- `controller/ComposerController.java` (수정) — 2개 `@PostMapping` + 서비스 2개 주입.

---

## Task 1: 순수 유틸 — mockupRecommend.js (스코어러 + 후보 빌더 + 머지)

**Files:**
- Create: `frontend/src/view/util/t3composer/mockupRecommend.js`
- Check (temp, 비커밋): `frontend/_mockupRecommend.check.cjs`

- [ ] **Step 1: 유틸 파일 작성**

Create `frontend/src/view/util/t3composer/mockupRecommend.js`:

```js
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
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

// 한 entry 의 검색 대상 텍스트 (라벨 + 설명 + 카테고리 + 매칭 운영 메뉴명).
function entrySearchText(entry) {
  const menuText = (entry.menus || []).map((m) => m.menuNm || '').join(' ');
  return `${entry.patternLabel || ''} ${entry.description || ''} ${entry.category || ''} ${entry.layoutCategory || ''} ${menuText}`.toLowerCase();
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
    score += matchedMenus.length; // 메뉴명 매칭 가중
    if (score > 0) scored.push({ entry, score, matchedMenus });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * 백엔드 recommend-mockups 로 보낼 압축 후보(top N) 생성.
 * 본문(component/layers) 은 빼고 텍스트 메타만 — 토큰 절약.
 */
export function buildMockupCandidates(nl, entries, limit = 12) {
  return scoreMockupCandidates(nl, entries)
    .slice(0, limit)
    .map(({ entry }) => ({
      patternCode: entry.patternCode,
      label: entry.patternLabel || '',
      description: entry.description || '',
      category: entry.category || '',
      productLine: entry.productLine || '',
      menuNames: (entry.menus || []).map((m) => m.menuNm || '').filter(Boolean),
    }));
}

/**
 * prefill-from-mockup 응답을 specFromMockup 베이스라인에 병합.
 *   baseSpec: createComposerSpec shape — { meta, filterBar:{items,affects}, layers, relations }
 *   aiSpec:   { meta?: {title,menuCd,parentMenuCd}, filterBar?: { items: [{key,label,type}] } }
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
    out.filterBar = {
      ...(baseSpec.filterBar || {}),
      items,
      affects: (baseSpec.filterBar && baseSpec.filterBar.affects) || {},
    };
  }

  return out;
}
```

- [ ] **Step 2: 검증 스크립트 작성 (temp, 비커밋)**

Create `frontend/_mockupRecommend.check.cjs`:

```js
const babel = require('@babel/core');
const path = require('path');
const file = path.join('src/view/util/t3composer/mockupRecommend.js');
const { code } = babel.transformFileSync(file, {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
  babelrc: false, configFile: false,
});
const mod = { exports: {} };
new Function('module', 'exports', code)(mod, mod.exports);
const { scoreMockupCandidates, buildMockupCandidates, mergeAiPrefillIntoSpec } = mod.exports;

const ENTRIES = [
  { patternCode: 'oron_dp_entry', patternLabel: 'ORON — 판매계획 입력 (PSI 크로스탭)',
    description: '월별 판매계획 vs 실적 vs 재고계획', category: 'domain', productLine: 'ORON',
    menus: [{ menuNm: '판매계획 입력' }, { menuNm: '판매계획 관리' }] },
  { patternCode: 'oron_mp_master', patternLabel: 'ORON — MP 기준정보 마스터',
    description: '완제품 반제품 자재 자원', category: 'domain', productLine: 'ORON',
    menus: [{ menuNm: '완제품관리' }] },
];

let fail = 0;
function ok(name, cond) { if (cond) console.log('OK  ', name); else { fail++; console.log('FAIL', name); } }

// 1) 판매계획 의도 → dp_entry 가 1위
const scored = scoreMockupCandidates('수요계획 입력 화면. 월별로 판매계획을 입력하고 실적과 비교', ENTRIES);
ok('dp_entry ranked first', scored.length > 0 && scored[0].entry.patternCode === 'oron_dp_entry');
ok('matchedMenus captured', scored[0].matchedMenus.length >= 1);

// 2) 매칭 없으면 빈 배열
ok('no match → empty', scoreMockupCandidates('xyzzy zzz', ENTRIES).length === 0);

// 3) 후보 압축 — 본문 제외, 메타만
const cands = buildMockupCandidates('판매계획', ENTRIES, 12);
ok('candidate compact shape', cands[0].patternCode === 'oron_dp_entry'
   && Array.isArray(cands[0].menuNames) && cands[0].component === undefined);

// 4) 머지 — meta 빈값 무시 + filterBar items 교체 + layers 보존
const base = { meta: { title: '새 화면', menuCd: '', parentMenuCd: '' },
               filterBar: { items: [], affects: { mainGrid: [] } },
               layers: [{ key: 'mainGrid' }], relations: [] };
const merged = mergeAiPrefillIntoSpec(base, {
  meta: { title: '판매계획 입력', menuCd: 'UI_DP_95', parentMenuCd: '' },
  filterBar: { items: [{ key: 'planPeriod', label: '기간', type: 'DATE_RANGE' }] },
});
ok('meta title merged',  merged.meta.title === '판매계획 입력');
ok('meta menuCd merged',  merged.meta.menuCd === 'UI_DP_95');
ok('empty parent kept',   merged.meta.parentMenuCd === '');
ok('filterBar replaced',  merged.filterBar.items.length === 1 && merged.filterBar.items[0].type === 'DATE_RANGE');
ok('affects preserved',   merged.filterBar.affects.mainGrid !== undefined);
ok('layers untouched',    merged.layers[0].key === 'mainGrid');

// 5) aiSpec 없으면 base 그대로
ok('null aiSpec → base', mergeAiPrefillIntoSpec(base, null) === base);

console.log('\n total fail', fail);
process.exit(fail ? 1 : 0);
```

- [ ] **Step 3: 검증 실행**

Run: `cd frontend && node _mockupRecommend.check.cjs`
Expected: 모든 줄 `OK`, 마지막 `total fail 0`, exit 0

- [ ] **Step 4: temp 스크립트 삭제 + 커밋**

```bash
cd C:/vs_project/Composer
rm -f frontend/_mockupRecommend.check.cjs
git add frontend/src/view/util/t3composer/mockupRecommend.js
git commit -m "feat(composer): AI 추천 순수 유틸 (스코어러+후보빌더+prefill 머지)"
```

---

## Task 2: api.js — recommendMockups / prefillFromMockup 추가

**Files:**
- Modify: `frontend/src/view/util/t3composer/api.js` (prefillFromDesign 정의 바로 뒤, line ~243)

- [ ] **Step 1: 두 함수 추가**

`frontend/src/view/util/t3composer/api.js` 의 `prefillFromDesign` 정의 끝(line 243, `);` 다음 줄) 에 추가:

```js
/**
 * AI 추천 — 자연어 + 압축 mockup 후보를 보내 상위 3개를 AI 재랭킹.
 * 응답: { items: [{ patternCode, relevance, reason }], mode: 'ai'|'fallback', model }
 *   mode==='fallback' (키 없음/호출 실패) → 호출부가 프런트 키워드 순서로 폴백.
 */
export const recommendMockups = ({ nl, candidates }) =>
  zAxios.post('composer/recommend-mockups', { nl, candidates }, composerReq());

/**
 * AI 추천 — 선택한 mockup + 자연어로 4단계 Wizard 부분 prefill.
 * 응답: { spec: { meta?, filterBar? }, mode: 'ai'|'fallback', model }
 *   데이터바인딩(실제 테이블/SP)은 채우지 않음 — §13.7 환각 방지.
 */
export const prefillFromMockup = ({ nl, mockupPatternCode, mockupMeta, moduleCode, targetCd }) =>
  zAxios.post(
    'composer/prefill-from-mockup',
    { nl, mockupPatternCode, mockupMeta, moduleCode, targetCd },
    composerReq()
  );
```

- [ ] **Step 2: 구문 검증**

Run: `cd frontend && npx babel src/view/util/t3composer/api.js --presets @babel/preset-env > /dev/null && echo OK`
Expected: `OK` (구문 오류 없음)

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/view/util/t3composer/api.js
git commit -m "feat(composer): AI 추천 api 래퍼 (recommendMockups/prefillFromMockup)"
```

---

## Task 3: Backend DTO 2개

**Files:**
- Create: `backend/src/main/java/com/zionex/t3composer/domain/dto/RecommendMockupRequest.java`
- Create: `backend/src/main/java/com/zionex/t3composer/domain/dto/PrefillFromMockupRequest.java`

- [ ] **Step 1: RecommendMockupRequest 작성**

```java
package com.zionex.t3composer.domain.dto;

import java.util.List;
import java.util.Map;

import lombok.Data;

/**
 * AI 추천 — 자연어 + 프런트가 키워드로 압축한 mockup 후보 목록.
 *   nl         : 사용자 자연어 입력
 *   candidates : [{ patternCode, label, description, category, productLine, menuNames:[...] }]
 */
@Data
public class RecommendMockupRequest {
    private String nl;
    private List<Map<String, Object>> candidates;
}
```

- [ ] **Step 2: PrefillFromMockupRequest 작성**

```java
package com.zionex.t3composer.domain.dto;

import java.util.Map;

import lombok.Data;

/**
 * AI 추천 — 선택한 mockup + 자연어로 4단계 Wizard 부분 prefill.
 *   nl                : 사용자 자연어 입력
 *   mockupPatternCode : 선택한 mockup patternCode
 *   mockupMeta        : { patternLabel, description, layers, menus } (프런트 MOCKUP_ENTRIES 메타)
 *   moduleCode        : 모듈 코드(선택)
 *   targetCd          : 활성 Target(선택)
 */
@Data
public class PrefillFromMockupRequest {
    private String nl;
    private String mockupPatternCode;
    private Map<String, Object> mockupMeta;
    private String moduleCode;
    private String targetCd;
}
```

- [ ] **Step 3: 컴파일 확인은 Task 6 에서 일괄 (서비스/컨트롤러와 함께). 지금은 커밋만**

```bash
cd C:/vs_project/Composer
git add backend/src/main/java/com/zionex/t3composer/domain/dto/RecommendMockupRequest.java backend/src/main/java/com/zionex/t3composer/domain/dto/PrefillFromMockupRequest.java
git commit -m "feat(composer): AI 추천 백엔드 DTO 2개"
```

---

## Task 4: Backend RecommendMockupService

**Files:**
- Create: `backend/src/main/java/com/zionex/t3composer/domain/service/RecommendMockupService.java`

- [ ] **Step 1: 서비스 작성**

`PrefillFromSourceService` 의 Anthropic 호출/파싱 패턴을 그대로 따른다. 단 **키 없음/실패 시 throw 하지 않고** `mode:'fallback'` 반환(프런트가 키워드 폴백).

```java
package com.zionex.t3composer.domain.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3composer.domain.client.AnthropicClient;
import com.zionex.t3composer.domain.client.AnthropicModels.CacheControl;
import com.zionex.t3composer.domain.client.AnthropicModels.Message;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesRequest;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;
import com.zionex.t3composer.domain.client.AnthropicModels.SystemBlock;
import com.zionex.t3composer.domain.client.AnthropicModels.TextBlock;
import com.zionex.t3composer.domain.dto.RecommendMockupRequest;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * AI 추천 — 자연어 + 압축 mockup 후보를 LLM 으로 재랭킹해 상위 3개를 관련도·이유와 함께 반환.
 * 키 미등록 / Anthropic 실패 시 throw 하지 않고 mode='fallback' 반환 → 프런트가 키워드 순서로 폴백.
 * 참조: PrefillFromSourceService (동일 호출 패턴).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendMockupService {

    private static final String MODEL_NAME = "claude-sonnet-4-5";
    private static final int    MAX_TOKENS = 1024;
    private static final int    TOP_N      = 3;

    private final AnthropicClient anthropicClient;
    private final AnthropicApiKeyService apiKeyService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Object> recommend(String userId, RecommendMockupRequest req) {
        List<Map<String, Object>> candidates = req.getCandidates() != null
                ? req.getCandidates() : Collections.emptyList();

        Optional<String> apiKeyOpt = apiKeyService.getApiKey(userId);
        if (apiKeyOpt.isEmpty() || candidates.isEmpty()) {
            return fallback();
        }

        try {
            MessagesRequest mreq = MessagesRequest.builder()
                    .model(MODEL_NAME)
                    .max_tokens(MAX_TOKENS)
                    .temperature(0.0)
                    .system(List.of(SystemBlock.builder()
                            .type("text")
                            .text(buildSystemPrompt())
                            .cacheControl(CacheControl.builder().type("ephemeral").build())
                            .build()))
                    .messages(List.of(Message.builder().role("user")
                            .content(buildUserPrompt(req.getNl(), candidates)).build()))
                    .build();

            MessagesResponse resp = anthropicClient.sendMessages(apiKeyOpt.get(), mreq).block();
            List<Map<String, Object>> items = parseItems(extractText(resp), candidates);
            if (items.isEmpty()) return fallback();

            Map<String, Object> out = new HashMap<>();
            out.put("items", items);
            out.put("mode", "ai");
            out.put("model", resp != null ? resp.getModel() : MODEL_NAME);
            return out;
        } catch (Exception e) {
            log.warn("recommend-mockups Anthropic 호출 실패 — 폴백: {} {}",
                    e.getClass().getSimpleName(), e.getMessage());
            return fallback();
        }
    }

    private Map<String, Object> fallback() {
        Map<String, Object> out = new HashMap<>();
        out.put("items", Collections.emptyList());
        out.put("mode", "fallback");
        return out;
    }

    private String buildSystemPrompt() {
        return String.join("\n",
            "당신은 T3Series Composer 의 화면 추천 도우미입니다.",
            "사용자의 자연어 의도와 mockup 후보 목록(patternCode·label·description·category·menuNames)을 받아",
            "의도에 가장 잘 맞는 상위 " + TOP_N + "개를 고릅니다.",
            "",
            "★ 절대 규칙",
            "1. 출력은 순수 JSON 만. 마크다운/설명/코드 펜스 금지.",
            "2. patternCode 는 반드시 입력 후보 목록에 있는 값만 사용(새로 만들지 말 것).",
            "3. relevance 는 0~100 정수(관련도). reason 은 한 문장(왜 추천했는지).",
            "4. 최대 " + TOP_N + "개. 관련도 내림차순.",
            "",
            "★ 출력 JSON 구조",
            "{ \"items\": [ { \"patternCode\": \"...\", \"relevance\": 94, \"reason\": \"...\" } ] }");
    }

    private String buildUserPrompt(String nl, List<Map<String, Object>> candidates) {
        StringBuilder sb = new StringBuilder();
        sb.append("[사용자 의도]\n").append(nl == null ? "" : nl).append("\n\n");
        sb.append("[mockup 후보]\n");
        for (Map<String, Object> c : candidates) {
            sb.append("- patternCode=").append(c.get("patternCode"))
              .append(" | label=").append(c.get("label"))
              .append(" | category=").append(c.get("category"))
              .append(" | productLine=").append(c.get("productLine"))
              .append(" | desc=").append(c.get("description"))
              .append(" | menus=").append(c.get("menuNames"))
              .append("\n");
        }
        sb.append("\n상위 ").append(TOP_N).append("개를 JSON 으로 반환하세요. JSON 외 텍스트 금지.");
        return sb.toString();
    }

    /** AI 응답 items 를 파싱 + patternCode 가 후보에 있는 것만 통과(환각 방어). */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseItems(String raw, List<Map<String, Object>> candidates) {
        java.util.Set<String> validCodes = new java.util.HashSet<>();
        for (Map<String, Object> c : candidates) {
            Object pc = c.get("patternCode");
            if (pc != null) validCodes.add(pc.toString());
        }
        Map<String, Object> obj = parseJsonObject(raw);
        Object itemsObj = obj.get("items");
        if (!(itemsObj instanceof List<?>)) return Collections.emptyList();
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object o : (List<?>) itemsObj) {
            if (!(o instanceof Map<?, ?>)) continue;
            Map<?, ?> m = (Map<?, ?>) o;
            Object pc = m.get("patternCode");
            if (pc == null || !validCodes.contains(pc.toString())) continue;
            Map<String, Object> item = new HashMap<>();
            item.put("patternCode", pc.toString());
            item.put("relevance", m.get("relevance"));
            item.put("reason", m.get("reason"));
            out.add(item);
            if (out.size() >= TOP_N) break;
        }
        return out;
    }

    private String extractText(MessagesResponse resp) {
        if (resp == null || resp.getContent() == null) return "";
        StringBuilder sb = new StringBuilder();
        for (Object block : resp.getContent()) {
            if (block instanceof Map) {
                Object t = ((Map<?, ?>) block).get("type");
                if ("text".equals(t)) {
                    Object tx = ((Map<?, ?>) block).get("text");
                    if (tx != null) sb.append(tx);
                }
            } else if (block instanceof TextBlock) {
                sb.append(((TextBlock) block).getText());
            }
        }
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJsonObject(String raw) {
        if (raw == null || raw.isBlank()) return Collections.emptyMap();
        String text = raw.trim();
        Pattern fenced = Pattern.compile("```(?:json)?\\s*([\\s\\S]*?)```", Pattern.MULTILINE);
        Matcher fm = fenced.matcher(text);
        if (fm.find()) text = fm.group(1).trim();
        int start = text.indexOf('{');
        int end   = text.lastIndexOf('}');
        if (start >= 0 && end > start) text = text.substring(start, end + 1);
        try {
            return (Map<String, Object>) objectMapper.readValue(text, Map.class);
        } catch (Exception e) {
            log.warn("recommend-mockups JSON 파싱 실패: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }
}
```

- [ ] **Step 2: 컴파일은 Task 6 에서 일괄. 커밋**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/service/RecommendMockupService.java
git commit -m "feat(composer): RecommendMockupService — AI 재랭킹 + 키워드 폴백"
```

---

## Task 5: Backend PrefillFromMockupService

**Files:**
- Create: `backend/src/main/java/com/zionex/t3composer/domain/service/PrefillFromMockupService.java`

- [ ] **Step 1: 서비스 작성**

`{meta, filterBar}` 부분 spec 만 생성. 데이터바인딩 절대 생성 금지. 키 없음/실패 → `{spec:{}, mode:'fallback'}`.

```java
package com.zionex.t3composer.domain.service;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3composer.domain.client.AnthropicClient;
import com.zionex.t3composer.domain.client.AnthropicModels.CacheControl;
import com.zionex.t3composer.domain.client.AnthropicModels.Message;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesRequest;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;
import com.zionex.t3composer.domain.client.AnthropicModels.SystemBlock;
import com.zionex.t3composer.domain.client.AnthropicModels.TextBlock;
import com.zionex.t3composer.domain.dto.PrefillFromMockupRequest;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * AI 추천 — 선택한 mockup + 자연어로 4단계 Wizard 의 {meta, filterBar} 부분 spec 생성.
 * 데이터바인딩(실제 테이블/SP)은 생성하지 않는다(§13.7 환각 방지) — layer 는 NL 힌트 유지.
 * 키 미등록 / Anthropic 실패 시 throw 하지 않고 {spec:{}, mode:'fallback'} 반환.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PrefillFromMockupService {

    private static final String MODEL_NAME = "claude-sonnet-4-5";
    private static final int    MAX_TOKENS = 2048;
    private static final int    MAX_META_CHARS = 8000;

    private final AnthropicClient anthropicClient;
    private final AnthropicApiKeyService apiKeyService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Object> prefill(String userId, PrefillFromMockupRequest req) {
        Optional<String> apiKeyOpt = apiKeyService.getApiKey(userId);
        if (apiKeyOpt.isEmpty()) {
            return fallback();
        }
        try {
            MessagesRequest mreq = MessagesRequest.builder()
                    .model(MODEL_NAME)
                    .max_tokens(MAX_TOKENS)
                    .temperature(0.0)
                    .system(List.of(SystemBlock.builder()
                            .type("text")
                            .text(buildSystemPrompt())
                            .cacheControl(CacheControl.builder().type("ephemeral").build())
                            .build()))
                    .messages(List.of(Message.builder().role("user")
                            .content(buildUserPrompt(req)).build()))
                    .build();

            MessagesResponse resp = anthropicClient.sendMessages(apiKeyOpt.get(), mreq).block();
            Map<String, Object> spec = parseJsonObject(extractText(resp));

            Map<String, Object> out = new HashMap<>();
            out.put("spec", spec);
            out.put("mode", spec.isEmpty() ? "fallback" : "ai");
            out.put("model", resp != null ? resp.getModel() : MODEL_NAME);
            return out;
        } catch (Exception e) {
            log.warn("prefill-from-mockup Anthropic 호출 실패 — 폴백: {} {}",
                    e.getClass().getSimpleName(), e.getMessage());
            return fallback();
        }
    }

    private Map<String, Object> fallback() {
        Map<String, Object> out = new HashMap<>();
        out.put("spec", Collections.emptyMap());
        out.put("mode", "fallback");
        return out;
    }

    private String buildSystemPrompt() {
        return String.join("\n",
            "당신은 T3Series Composer 의 화면 설계 도우미입니다.",
            "사용자 자연어 의도 + 선택한 mockup 메타(layers/menus)를 보고 4단계 Wizard 의",
            "검색조건(filterBar)과 화면 메타(meta) 만 prefill 합니다.",
            "",
            "★ 절대 규칙",
            "1. 출력은 순수 JSON 만. 마크다운/설명/코드 펜스 금지.",
            "2. ★ 데이터바인딩(실제 테이블/SP/컬럼) 은 절대 생성하지 마세요. filterBar 와 meta 만.",
            "3. filterBar.items[].type 은 다음 값만 허용:",
            "   TEXT, NUMBER, DATE, DATETIME, DATE_RANGE, DROPDOWN, MULTISELECT, SELECT, RADIO,",
            "   CHECKBOX, POPUP, AUTOCOMPLETE, DOMAIN_PLAN_SCOPE, DOMAIN_ITEM_SINGLE,",
            "   DOMAIN_ITEM_MULTI, DOMAIN_ACCOUNT_SINGLE, DOMAIN_ACCOUNT_MULTI,",
            "   DOMAIN_LOCATION_MULTI, DOMAIN_RESOURCE_MULTI, DOMAIN_USER, DOMAIN_VERSION",
            "   (기간은 DATE_RANGE, 플랜스코프는 DOMAIN_PLAN_SCOPE 우선)",
            "4. filterBar.items[].key 는 camelCase, label 은 한글 표시명.",
            "5. meta.menuCd 형식 ^UI_(AD|BF|CM|DP|FO|FP|IM|MP|RP|SA|SO|UT)_[A-Z][A-Z0-9_]*$ (제안값).",
            "   meta.parentMenuCd 는 MENU_AD/MENU_DP/MENU_MP/MENU_FP/MENU_BF/MENU_IM/MENU_RP/MENU_SA/MENU_UTIL 중 하나.",
            "   확신 없으면 빈 문자열(사용자가 메타 단계에서 확정).",
            "",
            "★ 출력 JSON 구조 (정확히 이 키)",
            "{",
            "  \"meta\": { \"title\": \"\", \"menuCd\": \"\", \"parentMenuCd\": \"\" },",
            "  \"filterBar\": { \"items\": [ { \"key\": \"camelCase\", \"label\": \"한글\", \"type\": \"DATE_RANGE\" } ] }",
            "}");
    }

    private String buildUserPrompt(PrefillFromMockupRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("[사용자 의도]\n").append(nullSafe(req.getNl())).append("\n\n");
        sb.append("[선택 mockup]\n");
        sb.append("- patternCode : ").append(nullSafe(req.getMockupPatternCode())).append("\n");
        sb.append("- moduleCode  : ").append(nullSafe(req.getModuleCode())).append("\n");
        String metaJson;
        try {
            metaJson = objectMapper.writeValueAsString(
                    req.getMockupMeta() != null ? req.getMockupMeta() : Collections.emptyMap());
        } catch (Exception e) {
            metaJson = "{}";
        }
        if (metaJson.length() > MAX_META_CHARS) {
            metaJson = metaJson.substring(0, MAX_META_CHARS) + "...[truncated]";
        }
        sb.append("- mockupMeta  : ").append(metaJson).append("\n\n");
        sb.append("위 의도와 mockup 으로 filterBar.items 와 meta 만 JSON 으로 반환하세요.");
        sb.append(" 데이터바인딩은 생성 금지. JSON 외 텍스트 금지.");
        return sb.toString();
    }

    private String nullSafe(String s) { return s == null ? "" : s; }

    private String extractText(MessagesResponse resp) {
        if (resp == null || resp.getContent() == null) return "";
        StringBuilder sb = new StringBuilder();
        for (Object block : resp.getContent()) {
            if (block instanceof Map) {
                Object t = ((Map<?, ?>) block).get("type");
                if ("text".equals(t)) {
                    Object tx = ((Map<?, ?>) block).get("text");
                    if (tx != null) sb.append(tx);
                }
            } else if (block instanceof TextBlock) {
                sb.append(((TextBlock) block).getText());
            }
        }
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJsonObject(String raw) {
        if (raw == null || raw.isBlank()) return Collections.emptyMap();
        String text = raw.trim();
        Pattern fenced = Pattern.compile("```(?:json)?\\s*([\\s\\S]*?)```", Pattern.MULTILINE);
        Matcher fm = fenced.matcher(text);
        if (fm.find()) text = fm.group(1).trim();
        int start = text.indexOf('{');
        int end   = text.lastIndexOf('}');
        if (start >= 0 && end > start) text = text.substring(start, end + 1);
        try {
            return (Map<String, Object>) objectMapper.readValue(text, Map.class);
        } catch (Exception e) {
            log.warn("prefill-from-mockup JSON 파싱 실패: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }
}
```

- [ ] **Step 2: 커밋**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/service/PrefillFromMockupService.java
git commit -m "feat(composer): PrefillFromMockupService — filterBar+meta 부분 prefill (데이터바인딩 제외)"
```

---

## Task 6: Backend Controller — 2개 엔드포인트 + 컴파일 검증

**Files:**
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/controller/ComposerController.java`

- [ ] **Step 1: import 추가**

`import com.zionex.t3composer.domain.dto.PrefillFromSourceRequest;` (line 28) 아래에 추가:

```java
import com.zionex.t3composer.domain.dto.RecommendMockupRequest;
import com.zionex.t3composer.domain.dto.PrefillFromMockupRequest;
```

`import com.zionex.t3composer.domain.service.PrefillFromSourceService;` (line 33) 아래에 추가:

```java
import com.zionex.t3composer.domain.service.RecommendMockupService;
import com.zionex.t3composer.domain.service.PrefillFromMockupService;
```

- [ ] **Step 2: 서비스 주입 필드 추가**

`private final PrefillFromDesignService prefillFromDesignService;` (line 73) 아래에 추가:

```java
    private final RecommendMockupService recommendMockupService;
    private final PrefillFromMockupService prefillFromMockupService;
```

- [ ] **Step 3: 엔드포인트 2개 추가**

`prefillFromDesign` 메서드 끝(닫는 `}` 다음, line ~592) 에 추가:

```java
    /**
     * AI 추천 — 자연어 + 압축 mockup 후보 → 상위 3개 AI 재랭킹.
     * 키 없음/실패 시 mode='fallback' 반환(프런트가 키워드 폴백). 차단 오류 없음.
     */
    @PostMapping("/recommend-mockups")
    public ResponseEntity<Map<String, Object>> recommendMockups(@RequestBody RecommendMockupRequest req) {
        try {
            return ResponseEntity.ok(recommendMockupService.recommend(currentUserId(), req));
        } catch (Exception e) {
            log.error("recommend-mockups failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error",   "server_error",
                    "message", e.getMessage() != null ? e.getMessage() : "unknown"));
        }
    }

    /**
     * AI 추천 — 선택 mockup + 자연어 → {meta, filterBar} 부분 prefill.
     * 데이터바인딩은 생성하지 않음(§13.7). 키 없음/실패 시 mode='fallback'.
     */
    @PostMapping("/prefill-from-mockup")
    public ResponseEntity<Map<String, Object>> prefillFromMockup(@RequestBody PrefillFromMockupRequest req) {
        try {
            return ResponseEntity.ok(prefillFromMockupService.prefill(currentUserId(), req));
        } catch (Exception e) {
            log.error("prefill-from-mockup failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error",   "server_error",
                    "message", e.getMessage() != null ? e.getMessage() : "unknown"));
        }
    }
```

- [ ] **Step 4: 백엔드 컴파일 검증 (Task 3~6 일괄)**

도커 환경(rules/50) 기준:
Run: `docker compose exec -T composer-backend mvn -q -DskipTests compile`
Expected: `BUILD` 오류 없이 종료(exit 0). 컴파일 에러 0건.
(로컬 mvn 사용 시: `cd backend && mvn -q -DskipTests compile`)

- [ ] **Step 5: 커밋**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/controller/ComposerController.java
git commit -m "feat(composer): recommend-mockups / prefill-from-mockup 엔드포인트"
```

---

## Task 7: Frontend — AiRecommendPanel.jsx (B 레이아웃)

**Files:**
- Create: `frontend/src/view/util/t3composer/AiRecommendPanel.jsx`

- [ ] **Step 1: 컴포넌트 작성**

좌 NL 입력 / 우 가로 3카드. 썸네일은 mockup 컴포넌트를 `transform: scale()` 로 축소(=MockupPickerDialog 패턴). 꾹 누르면(onMouseDown) 확대 오버레이, 떼면 닫힘. "이 템플릿으로 시작 →" → prefill 호출 후 `onStart(mergedSpec)`.

```jsx
import React, { useState, useMemo, useRef, Suspense } from 'react';
import {
  Box, Typography, Button, Stack, TextField, Chip, CircularProgress,
} from '@mui/material';
import ArrowBackIcon    from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon  from '@mui/icons-material/AutoAwesome';

import { MOCKUP_ENTRIES } from '../t3mockup';
import { buildMockupCandidates, scoreMockupCandidates, mergeAiPrefillIntoSpec } from './mockupRecommend';
import { specFromMockup } from './wizardState';
import { recommendMockups, prefillFromMockup } from './api';

const ACCENT = '#7C3AED';
const THUMB_W = 1400;   // mockup 컴포넌트 가상 폭
const THUMB_H = 900;

const EXAMPLES = ['거래처별 단가 관리', '공급계획 시뮬레이션', '재고 현황 조회'];

/**
 * AI 추천 진입 화면 (B 레이아웃).
 * props:
 *   onBack()          패턴 선택 화면으로 복귀
 *   onStart(spec)     선택 + prefill 완료된 ComposerSpec 으로 Wizard 진입
 *   targetCd          활성 Target
 */
function AiRecommendPanel({ onBack, onStart, targetCd }) {
  const [nl, setNl] = useState('');
  const [loading, setLoading] = useState(false);      // 추천 검색 중
  const [prefilling, setPrefilling] = useState(false); // 선택 후 prefill 중
  const [results, setResults] = useState(null);        // [{ entry, relevance, reason }]
  const [mode, setMode] = useState(null);              // 'ai' | 'fallback'
  const [zoomEntry, setZoomEntry] = useState(null);

  const codeToEntry = useMemo(() => {
    const m = new Map();
    for (const e of MOCKUP_ENTRIES) m.set(e.patternCode, e);
    return m;
  }, []);

  const onSearch = async () => {
    if (!nl.trim() || loading) return;
    setLoading(true);
    setResults(null);
    // 1) 프런트 키워드 스코어 — 후보 압축 + 폴백 순서 확보
    const keywordTop = scoreMockupCandidates(nl, MOCKUP_ENTRIES);
    const candidates = buildMockupCandidates(nl, MOCKUP_ENTRIES, 12);
    try {
      const res = await recommendMockups({ nl, candidates });
      const data = res?.data || {};
      if (data.mode === 'ai' && Array.isArray(data.items) && data.items.length > 0) {
        const items = data.items
          .map((it) => ({ entry: codeToEntry.get(it.patternCode), relevance: it.relevance, reason: it.reason }))
          .filter((x) => x.entry);
        setResults(items.length > 0 ? items : keywordTop.slice(0, 3).map((s) => ({ entry: s.entry })));
        setMode(items.length > 0 ? 'ai' : 'fallback');
      } else {
        setResults(keywordTop.slice(0, 3).map((s) => ({ entry: s.entry })));
        setMode('fallback');
      }
    } catch {
      setResults(keywordTop.slice(0, 3).map((s) => ({ entry: s.entry })));
      setMode('fallback');
    } finally {
      setLoading(false);
    }
  };

  const onPick = async (entry) => {
    if (!entry || prefilling) return;
    setPrefilling(true);
    const base = specFromMockup(entry, { title: entry.patternLabel || '새 화면', menuCd: '' });
    try {
      const res = await prefillFromMockup({
        nl,
        mockupPatternCode: entry.patternCode,
        mockupMeta: {
          patternLabel: entry.patternLabel,
          description: entry.description,
          layers: entry.layers,
          menus: entry.menus,
        },
        moduleCode: '',
        targetCd,
      });
      const aiSpec = res?.data?.spec || null;
      onStart(mergeAiPrefillIntoSpec(base, aiSpec));
    } catch {
      onStart(base); // 폴백 — specFromMockup 만
    } finally {
      setPrefilling(false);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* 상단 바 */}
      <Stack direction="row" alignItems="center" spacing={1}
             sx={{ p: 1.2, borderBottom: '1px solid #e9d5ff',
                   background: 'linear-gradient(135deg,#f5f3ff,#faf5ff)', flexShrink: 0 }}>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ color: ACCENT }}>뒤로</Button>
        <Typography sx={{ fontWeight: 800, color: '#6d28d9' }}>✨ AI 추천으로 화면 시작</Typography>
        <Chip label="Beta" size="small" sx={{ height: 18, fontSize: 10, bgcolor: '#ede9fe', color: '#6d28d9' }} />
        <Box sx={{ flexGrow: 1 }} />
        {targetCd && <Typography variant="caption" sx={{ color: '#94a3b8' }}>Target: <b>{targetCd}</b></Typography>}
      </Stack>

      {/* 본문 */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', gap: 1.5, p: 1.5, bgcolor: '#f8fafc', overflow: 'auto' }}>
        {/* 좌측 입력 */}
        <Box sx={{ flex: '0 0 32%', display: 'flex', flexDirection: 'column', gap: 1.2,
                   bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: 2, p: 1.8 }}>
          <Typography sx={{ fontWeight: 700, color: ACCENT, fontSize: 13 }}>무엇을 만들까요?</Typography>
          <TextField
            multiline minRows={5} value={nl} onChange={(e) => setNl(e.target.value)}
            placeholder="예: 수요계획 입력 화면을 만들고 싶어. 월별로 판매계획을 입력하고 실적과 비교했으면 좋겠어."
            sx={{ '& textarea': { fontSize: 13 } }}
          />
          <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.5 }}>
            {EXAMPLES.map((ex) => (
              <Chip key={ex} label={ex} size="small" variant="outlined"
                    onClick={() => setNl(ex)} sx={{ fontSize: 11 }} />
            ))}
          </Stack>
          <Button variant="contained" onClick={onSearch} disabled={!nl.trim() || loading}
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
                  sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#6d28d9' }, fontWeight: 700 }}>
            {loading ? '추천 찾는 중…' : '추천 템플릿 찾기'}
          </Button>
          {results && (
            <Box sx={{ p: 1.2, bgcolor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 1.5,
                       fontSize: 11, color: '#6b21a8' }}>
              🔎 관련 mockup {results.length}개 추천
              {mode === 'fallback' && <Chip label="키워드 매칭" size="small"
                sx={{ ml: 0.6, height: 16, fontSize: 9, bgcolor: '#e2e8f0' }} />}
            </Box>
          )}
        </Box>

        {/* 우측 결과 */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {!results && (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <Typography variant="body2">자연어로 만들고 싶은 화면을 적고 "추천 템플릿 찾기" 를 누르세요.</Typography>
            </Box>
          )}
          {results && results.length === 0 && (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <Typography variant="body2">관련 템플릿을 찾지 못했습니다. 다른 표현으로 다시 시도하거나 패턴 선택에서 직접 고르세요.</Typography>
            </Box>
          )}
          {results && results.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1.2, flex: 1, minHeight: 0 }}>
              {results.map(({ entry, relevance, reason }, idx) => {
                const Thumb = entry.component;
                const top = idx === 0;
                return (
                  <Box key={entry.patternCode}
                       sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
                             bgcolor: '#fff', borderRadius: 2, overflow: 'hidden',
                             border: top ? `2px solid ${ACCENT}` : '1px solid #e2e8f0',
                             boxShadow: top ? '0 4px 14px rgba(124,58,237,0.15)' : 'none' }}>
                    {/* 큰 썸네일 — 꾹 누르면 확대 */}
                    <Box
                      onMouseDown={() => setZoomEntry(entry)}
                      onMouseUp={() => setZoomEntry(null)}
                      onMouseLeave={() => setZoomEntry(null)}
                      sx={{ position: 'relative', height: 220, overflow: 'hidden',
                            borderBottom: '1px solid #f1f5f9', cursor: 'zoom-in', bgcolor: '#fff' }}
                    >
                      <Box sx={{ width: THUMB_W, height: THUMB_H,
                                 transform: 'scale(0.30)', transformOrigin: 'top left', pointerEvents: 'none' }}>
                        <Suspense fallback={<Box sx={{ p: 4 }}><CircularProgress size={20} /></Box>}>
                          {Thumb ? <Thumb /> : null}
                        </Suspense>
                      </Box>
                    </Box>
                    {/* 카드 본문 */}
                    <Box sx={{ p: 1.2, display: 'flex', flexDirection: 'column', gap: 0.6, flex: 1 }}>
                      {relevance != null && (
                        <Chip label={`관련도 ${relevance}%`} size="small"
                          sx={{ alignSelf: 'flex-start', height: 18, fontSize: 10, fontWeight: 700,
                                bgcolor: top ? '#ede9fe' : '#f1f5f9', color: top ? '#6d28d9' : '#64748b' }} />
                      )}
                      <Typography sx={{ fontWeight: 700, fontSize: 12.5, lineHeight: 1.3 }}>{entry.patternLabel}</Typography>
                      <Typography sx={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{entry.description}</Typography>
                      {reason && <Typography sx={{ fontSize: 10.5, color: '#7c3aed', fontStyle: 'italic' }}>“{reason}”</Typography>}
                      {(entry.menus || []).length > 0 && (
                        <Typography sx={{ fontSize: 9.5, color: '#94a3b8' }}>
                          📋 {(entry.menus || []).slice(0, 2).map((m) => m.menuNm).join(' · ')}
                        </Typography>
                      )}
                      <Button variant={top ? 'contained' : 'outlined'} size="small" onClick={() => onPick(entry)}
                              disabled={prefilling}
                              sx={{ mt: 'auto', fontWeight: 700, fontSize: 11,
                                    ...(top ? { bgcolor: ACCENT, '&:hover': { bgcolor: '#6d28d9' } }
                                            : { color: ACCENT, borderColor: ACCENT }) }}>
                        {prefilling ? '분석 중…' : '이 템플릿으로 시작 →'}
                      </Button>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
          {results && results.length > 0 && (
            <Typography sx={{ fontSize: 10.5, color: '#94a3b8', textAlign: 'center' }}>
              선택 후 → ① Layout ② 데이터·검색조건 ③ 메타·메뉴 ④ 생성 <b style={{ color: ACCENT }}>(AI 자동 prefill)</b>
            </Typography>
          )}
        </Box>
      </Box>

      {/* 꾹눌러 확대 오버레이 */}
      {zoomEntry && zoomEntry.component && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(15,23,42,0.78)', zIndex: 1400,
                   display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
          <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 2, width: '78%', maxWidth: 1000, boxShadow: 24 }}>
            <Typography sx={{ fontWeight: 800, mb: 1 }}>{zoomEntry.patternLabel}</Typography>
            <Box sx={{ height: 480, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: 1 }}>
              <Box sx={{ width: THUMB_W, height: THUMB_H, transform: 'scale(0.66)', transformOrigin: 'top left', pointerEvents: 'none' }}>
                <Suspense fallback={<Box sx={{ p: 6 }}><CircularProgress /></Box>}>
                  {(() => { const Z = zoomEntry.component; return <Z />; })()}
                </Suspense>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default AiRecommendPanel;
```

- [ ] **Step 2: 구문 검증**

Run: `cd frontend && npx babel src/view/util/t3composer/AiRecommendPanel.jsx --presets @babel/preset-react > /dev/null && echo OK`
Expected: `OK`

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/view/util/t3composer/AiRecommendPanel.jsx
git commit -m "feat(composer): AiRecommendPanel — 자연어 추천 + 3카드 + 꾹눌러 확대"
```

---

## Task 8: Frontend — ModeNewStep.jsx 에 4번째 카드 + stage 연결

**Files:**
- Modify: `frontend/src/view/util/t3composer/ModeNewStep.jsx`

- [ ] **Step 1: import 추가**

`import EditOutlinedIcon       from '@mui/icons-material/EditOutlined';` (line 20) 아래에 추가:

```js
import AutoAwesomeIcon       from '@mui/icons-material/AutoAwesome';
```

`import UiPatternPickerDialog from './UiPatternPickerDialog';` (line 24) 아래에 추가:

```js
import AiRecommendPanel from './AiRecommendPanel';
```

- [ ] **Step 2: AI_RECOMMEND stage 분기 추가**

`if (stage === 'WIZARD' && spec) { ... }` 블록(line 41-49) **바로 위**에 추가:

```js
  if (stage === 'AI_RECOMMEND') {
    return (
      <AiRecommendPanel
        targetCd={currentTargetCd}
        onBack={() => setStage('PICK')}
        onStart={(s) => { setSpec(s); setStage('WIZARD'); }}
      />
    );
  }

```

- [ ] **Step 3: 4번째 카드 추가**

"빈 캔버스" `Paper`(line 100-114, `onClick={() => startWithPattern('P02')}` 인 Paper) **닫는 `</Paper>` 다음**, `</Stack>`(line 116) **앞**에 추가:

```jsx
        <Paper variant="outlined"
               sx={{ p: 2, cursor: 'pointer', '&:hover': { borderColor: '#7C3AED', bgcolor: '#faf5ff' } }}
               onClick={() => setStage('AI_RECOMMEND')}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AutoAwesomeIcon sx={{ fontSize: 32, color: '#7C3AED' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#6d28d9' }}>
                ✨ AI 추천
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                자연어로 의도를 적으면 관련 SCM UI Mockup 3개 추천 + 4단계 AI 자동 prefill
              </Typography>
            </Box>
          </Stack>
        </Paper>

```

- [ ] **Step 4: 구문 검증**

Run: `cd frontend && npx babel src/view/util/t3composer/ModeNewStep.jsx --presets @babel/preset-react > /dev/null && echo OK`
Expected: `OK`

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/view/util/t3composer/ModeNewStep.jsx
git commit -m "feat(composer): 단계별 화면 생성에 AI 추천 카드 + stage 연결"
```

---

## Task 9: 통합 빌드 + 수동 검증

**Files:** (없음 — 검증 전용)

- [ ] **Step 1: 프런트 webpack 빌드 (전체 모듈 그래프 검증)**

Run: `docker compose exec -T composer-frontend npm run build`
(로컬: `cd frontend && npm run build`)
Expected: webpack `compiled` 성공, `Module not found` / 구문 오류 0건.

- [ ] **Step 2: 백엔드 재컴파일 + DevTools restart**

Run: `docker compose exec -T composer-backend mvn -q -DskipTests compile`
Expected: exit 0. 이후 `target/classes/.devtools-restart-trigger` touch 로 자동 restart (rules/50 §2).

- [ ] **Step 3: 엔드포인트 동작 확인 (폴백 경로 — 키 없이도 200)**

```bash
curl -s -m 20 -X POST http://localhost:8090/composer/recommend-mockups \
  -H 'content-type: application/json' \
  -d '{"nl":"판매계획 입력","candidates":[{"patternCode":"oron_dp_entry","label":"ORON 판매계획 입력","description":"월별 판매계획","category":"domain","productLine":"ORON","menuNames":["판매계획 입력"]}]}'
```
Expected: `{"items":[...],"mode":"ai",...}` (키 등록 시) 또는 `{"items":[],"mode":"fallback"}` (키 없음). 어느 쪽이든 HTTP 200.

```bash
curl -s -m 20 -X POST http://localhost:8090/composer/prefill-from-mockup \
  -H 'content-type: application/json' \
  -d '{"nl":"판매계획 입력","mockupPatternCode":"oron_dp_entry","mockupMeta":{"patternLabel":"판매계획 입력"}}'
```
Expected: `{"spec":{...},"mode":"ai"}` 또는 `{"spec":{},"mode":"fallback"}`. HTTP 200.

- [ ] **Step 4: 앱 수동 검증 (브라우저 http://localhost:5173)**

다음을 순서대로 확인:
1. Composer → 단계별 화면 생성 진입 → 패턴 선택에 **"✨ AI 추천" 카드**가 4번째로 보임
2. 카드 클릭 → 보라 헤더의 AI 추천 화면 전환, 좌측 입력 / 우측 빈 영역
3. "수요계획 입력 화면을 만들고 싶어. 월별로 판매계획을 입력하고 실적과 비교" 입력 → "추천 템플릿 찾기"
4. 우측에 **카드 3개**(큰 썸네일 + 관련도 + 매칭메뉴 + 시작버튼) 표시. 1위 보라 강조
5. 썸네일 **꾹 누르면 확대 오버레이**, 떼면 닫힘
6. "이 템플릿으로 시작 →" → "분석 중…" 후 **ComposerWizard 진입**. ① Layout 에 mockup layer 구조, ② 데이터·검색조건에 FilterBar 필드(있으면), ③ 메타에 제목/메뉴코드(있으면) 채워짐
7. API 키 미등록 상태에서도 3~6 이 끊기지 않음(키워드 폴백 배지 표시)

- [ ] **Step 5: 검증 결과 기록 (커밋 불필요 — 코드 변경 없음)**

수동 검증 항목 1~7 통과 여부를 사용자에게 보고. 실패 항목이 있으면 해당 Task 로 돌아가 수정.

---

## Self-Review (작성자 체크)

**Spec 커버리지:**
- §3 화면(B안) → Task 7 (AiRecommendPanel) ✓
- §3 썸네일 높이↑ → Task 7 Step1 (썸네일 height 220 + scale 0.30, 하단 카드 본문은 flex) ✓
- §4 추천 엔진(AI+키워드 폴백) → Task 1(스코어러) + Task 4(AI) + Task 7(폴백 결합) ✓
- §5 prefill(filterBar+meta, 데이터 제외) → Task 5(서비스) + Task 1(머지) ✓
- §6 전용 엔드포인트 2개 → Task 3/4/5/6 ✓
- §1 진입 카드 4번째 → Task 8 ✓
- §8 폴백/에러 → Task 4/5(fallback) + Task 7(catch) ✓
- §10 성공 기준 → Task 9 수동 검증 1~7 ✓

**Placeholder 스캔:** TBD/TODO/"적절히 처리" 없음. 모든 코드 step 에 실제 코드 포함. ✓

**타입 일관성:**
- `scoreMockupCandidates`/`buildMockupCandidates`/`mergeAiPrefillIntoSpec` 이름이 Task 1 정의 ↔ Task 7 import 동일 ✓
- `recommendMockups`/`prefillFromMockup` 이름이 Task 2 정의 ↔ Task 7 import 동일 ✓
- 응답 키 `{items,mode}` (recommend) / `{spec,mode}` (prefill) 가 백엔드(Task 4/5) ↔ 프런트(Task 7) 일치 ✓
- `createComposerSpec` shape(`meta/filterBar.items/affects/layers`)가 머지(Task 1) ↔ specFromMockup 베이스라인 일치 ✓
- filterBar item `type` 값이 백엔드 프롬프트(Task 5) ↔ FilterFieldCard `FILTER_TYPES` 일치 ✓

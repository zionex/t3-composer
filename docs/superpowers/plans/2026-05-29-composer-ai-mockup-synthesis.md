# Composer AI Mockup Synthesis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `recommend-mockups` endpoint to return up to 2 AI-synthesized mockups (layer recombinations of existing mockups) alongside existing recommendations, and render them in a 2×3 grid (existing 4 + synthesized 2) on the AI Recommend Panel.

**Architecture:** Single Claude call returns `{ items: [...×4], synthesized: [...×2] }`. Backend validates synthesized layers against candidate `patternCode` set + 12-col position rules; invalid items dropped. Frontend renders synthesized cards with a wireframe preview (12-col grid of layer boxes with type chips and source-mockup labels). New `prefill-from-synthesized` endpoint mirrors `prefill-from-mockup` and injects per-layer source-mockup context into `spec.layers[i].dataSource.naturalText`.

**Tech Stack:** Spring Boot 3.0.13 (backend) · React 18 + MUI (frontend) · Anthropic SDK via `AnthropicClient` · Jackson `ObjectMapper` · Zustand (state). No automated test framework exists in the repo — verification is via the running dev environment (`docker compose up`) + manual smoke tests at the end of each task.

**Reference spec:** [2026-05-29-composer-ai-mockup-synthesis-design.md](../specs/2026-05-29-composer-ai-mockup-synthesis-design.md)

---

## File Plan

### New files

| Path | Responsibility |
|---|---|
| `backend/src/main/java/com/zionex/t3composer/domain/dto/PrefillFromSynthesizedRequest.java` | Request DTO for the new prefill endpoint |
| `backend/src/main/java/com/zionex/t3composer/domain/service/PrefillFromSynthesizedService.java` | Mirror of `PrefillFromMockupService` — calls Claude with synthesized-mockup-specific system prompt |
| `frontend/src/view/util/t3composer/SynthesizedMockupPreview.jsx` | 12-col wireframe renderer for synthesized layers |

### Modified files

| Path | Change |
|---|---|
| `backend/src/main/java/com/zionex/t3composer/domain/dto/RecommendMockupRequest.java` | Add `synthesize: Boolean` field |
| `backend/src/main/java/com/zionex/t3composer/domain/service/RecommendMockupService.java` | System prompt rule 4 (3→4 items) + new rule 6 (synthesis) + `parseSynthesized` validator + wire into `recommend()` |
| `backend/src/main/java/com/zionex/t3composer/domain/controller/ComposerController.java` | Add `@PostMapping("/prefill-from-synthesized")` |
| `frontend/src/view/util/t3composer/mockupRecommend.js` | `buildMockupCandidates` includes `layers` per candidate |
| `frontend/src/view/util/t3composer/wizardState.js` | Add `specFromSynthesized` + `synthesizedContextText` + lookup helper |
| `frontend/src/view/util/t3composer/api.js` | Add `prefillFromSynthesized` wrapper |
| `frontend/src/view/util/t3composer/AiRecommendPanel.jsx` | State shape · onSearch fill logic · 2×3 grid · synthesized/placeholder card branches · onPick branch |

---

## Task 1: Add `synthesize` field to RecommendMockupRequest

**Files:**
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/dto/RecommendMockupRequest.java`

- [ ] **Step 1: Edit the DTO**

Replace the entire body with:

```java
package com.zionex.t3composer.domain.dto;

import java.util.List;
import java.util.Map;
import lombok.Data;

@Data
public class RecommendMockupRequest {
    private String nl;
    private List<Map<String, Object>> candidates;
    /**
     * If true (or null — treat null as true), the service should also try to propose
     * synthesized mockups by recombining candidate layers. If false, the service
     * returns the existing-only response shape (synthesized: []). Used for rollback.
     */
    private Boolean synthesize;
}
```

- [ ] **Step 2: Verify backend compiles**

Run inside the backend container:
```bash
docker compose exec composer-backend mvn -q -DskipTests compile
```
Expected: `BUILD SUCCESS`. No errors mentioning `RecommendMockupRequest`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/dto/RecommendMockupRequest.java
git commit -m "feat(composer): add synthesize flag to RecommendMockupRequest DTO

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: Update RecommendMockupService response shape (synthesized: [])

This task only changes the response shape — synthesis logic comes in Task 4. After this task the panel still works (synthesized is always empty), and frontend can be developed in parallel.

**Files:**
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/service/RecommendMockupService.java`

- [ ] **Step 1: Replace the TOP_N constant and `fallback()`**

Change line `private static final int TOP_N = 3;` to:

```java
private static final int TOP_EXISTING = 4;
private static final int TOP_SYNTHESIZED = 2;
```

Then replace the `fallback()` method:

```java
private Map<String, Object> fallback() {
    Map<String, Object> result = new HashMap<>();
    result.put("items", List.of());
    result.put("synthesized", List.of());
    result.put("mode", "fallback");
    return result;
}
```

- [ ] **Step 2: Update `recommend()` to include `synthesized: []` and use TOP_EXISTING**

Replace the `recommend()` body's success path so that:
- `result.put("synthesized", List.of());` is added before `result.put("mode", "ai");`
- `items` slicing inside `parseItems` uses `TOP_EXISTING` (next step).

Patch in `recommend()` (success block), insert after `result.put("items", items);`:

```java
result.put("synthesized", List.of());
```

- [ ] **Step 3: Update `parseItems` to use TOP_EXISTING**

In `parseItems`, find `if (out.size() >= TOP_N) break;` and change to:

```java
if (out.size() >= TOP_EXISTING) break;
```

- [ ] **Step 4: Verify compile**

```bash
docker compose exec composer-backend mvn -q -DskipTests compile
```
Expected: `BUILD SUCCESS`.

- [ ] **Step 5: Smoke test the endpoint**

Trigger a DevTools restart and then curl the endpoint:

```bash
docker compose exec composer-backend sh -c 'date +%s > target/classes/.devtools-restart-trigger'
sleep 6
curl -s -X POST http://localhost:8090/composer/recommend-mockups \
  -H 'Content-Type: application/json' \
  -d '{"nl":"수요계획","candidates":[]}' | python3 -m json.tool
```

Expected: JSON with keys `items: []`, `synthesized: []`, `mode: "fallback"` (empty candidates → fallback path).

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/service/RecommendMockupService.java
git commit -m "feat(composer): recommend-mockups response shape — add synthesized array

Backend now returns { items: [...max 4], synthesized: [], mode } so the
frontend can develop the 2x3 grid before synthesis logic is wired up.
TOP_EXISTING=4 (was TOP_N=3). synthesis itself is added in next task.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: Frontend candidate payload carries layers

This change is independent of synthesis logic — adds `layers` to each candidate so the backend (next task) can use them as recombination raw material.

**Files:**
- Modify: `frontend/src/view/util/t3composer/mockupRecommend.js`

- [ ] **Step 1: Edit buildMockupCandidates**

Find the existing `buildMockupCandidates` function and replace the `.map(...)` body so the returned objects include a `layers` field:

```js
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
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:5173` → T3Composer → AI 추천 진입. Type any NL (e.g., "수요계획"). Click 추천 템플릿 찾기. In DevTools Network tab, find `recommend-mockups` request → Payload → confirm each `candidates[i]` now has a `layers` array.

Expected: Each candidate has `layers: [{key, title, type, subtype, position}, ...]`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/view/util/t3composer/mockupRecommend.js
git commit -m "feat(composer): include layers in recommend-mockups candidate payload

Layer info (key/title/type/subtype/position) ships with each candidate so the
backend can use them as raw material for AI synthesis. component reference is
omitted (renderers don't serialize). Adds ~600 tokens to top-12 payload.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: Add synthesis instructions to RecommendMockupService system prompt

Now the system prompt teaches the model to (a) return up to 4 existing and (b) optionally propose up to 2 synthesized mockups.

**Files:**
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/service/RecommendMockupService.java`

- [ ] **Step 1: Replace `buildSystemPrompt()` body**

```java
private String buildSystemPrompt() {
    return "You are a UI mockup recommendation assistant for T3SmartSCM, an enterprise SCM system.\n" +
           "Your task is to rank the provided mockup candidates by relevance to the user's natural language request,\n" +
           "and OPTIONALLY propose up to 2 synthesized mockups that combine layers from multiple candidates when\n" +
           "no single candidate covers the user's request well.\n\n" +
           "Rules:\n" +
           "1. Return ONLY a JSON object with keys \"items\" (array) and \"synthesized\" (array).\n" +
           "2. \"items\": rank candidates by relevance. Each item: { patternCode (string), relevance (integer 0-100), reason (string, Korean, max 30 chars) }.\n" +
           "   - Include only candidates from the provided list — do NOT invent new patternCode values.\n" +
           "   - Sort by relevance descending.\n" +
           "   - Return at most 4 items.\n" +
           "3. \"synthesized\": propose UP TO 2 synthesized mockups when combining layers from multiple candidates\n" +
           "   would serve the user's request better than any single candidate. Return [] if none beneficial.\n" +
           "   - Skip synthesis entirely if fewer than 3 candidates are provided.\n" +
           "   - The 2 synthesized must offer meaningfully different combinations (no near-duplicates).\n" +
           "   - Each synthesized item: { label (string, Korean), description (string, Korean), reason (string, Korean, max 60 chars), layers (array) }.\n" +
           "   - synthesized[].layers[]: { key (string, camelCase), title (string, Korean), type (string — copy from candidate layer type, e.g. 'GRID', 'CHART_LINE', 'KPI_CARD'), subtype (string or null), position ({x,y,w,h} integers), sourceMockupCode (string) }.\n" +
           "   - sourceMockupCode MUST reference a patternCode from the candidates list.\n" +
           "   - position uses a 12-column grid: x in [0,11], w in [1,12], x+w <= 12. y >= 0, h in [1,12].\n" +
           "   - Layers should not overlap and should fill the grid coherently.\n" +
           "4. If no candidates are relevant at all, return { \"items\": [], \"synthesized\": [] }.\n\n" +
           "Output format (JSON object only, no markdown fences, no extra text):\n" +
           "{\n" +
           "  \"items\": [ { \"patternCode\": \"...\", \"relevance\": 94, \"reason\": \"이유\" } ],\n" +
           "  \"synthesized\": [\n" +
           "    {\n" +
           "      \"label\": \"수요계획 입력 + 실적비교 대시보드\",\n" +
           "      \"description\": \"월별 입력 그리드 위에 전년 대비 KPI 와 실적 추이 차트\",\n" +
           "      \"reason\": \"단일 mockup 으로 입력+분석을 동시에 충족하는 것이 없음\",\n" +
           "      \"layers\": [\n" +
           "        { \"key\": \"kpiRow\",     \"title\": \"전년 대비 KPI\", \"type\": \"KPI_CARD\",   \"subtype\": null, \"position\": {\"x\":0,\"y\":0,\"w\":12,\"h\":2}, \"sourceMockupCode\": \"widget_dashboard\" },\n" +
           "        { \"key\": \"inputGrid\",  \"title\": \"월별 계획 입력\", \"type\": \"GRID\",       \"subtype\": null, \"position\": {\"x\":0,\"y\":2,\"w\":8,\"h\":6},  \"sourceMockupCode\": \"search_grid\" },\n" +
           "        { \"key\": \"trendChart\", \"title\": \"실적 추이\",      \"type\": \"CHART_LINE\", \"subtype\": null, \"position\": {\"x\":8,\"y\":2,\"w\":4,\"h\":6},  \"sourceMockupCode\": \"P09_chart_view\" }\n" +
           "      ]\n" +
           "    }\n" +
           "  ]\n" +
           "}";
}
```

- [ ] **Step 2: Add `synthesize: false` short-circuit in `recommend()`**

In the `recommend()` method, immediately after the candidates null/empty check, add:

```java
boolean synthesizeFlag = req.getSynthesize() == null || Boolean.TRUE.equals(req.getSynthesize());
```

(Used in Task 5 — keeps the variable in scope. For now no behavioral change.)

- [ ] **Step 3: Verify compile**

```bash
docker compose exec composer-backend mvn -q -DskipTests compile
```
Expected: `BUILD SUCCESS`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/service/RecommendMockupService.java
git commit -m "feat(composer): teach recommend-mockups system prompt to synthesize

Rule 4 updated to allow 4 items. New rule 3 instructs the model to propose
up to 2 synthesized mockups when combining layers beats any single candidate,
with sourceMockupCode pointing back to the candidate list. Output format
example included to lock the keys.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: Add parseSynthesized validator + wire into recommend()

**Files:**
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/service/RecommendMockupService.java`

- [ ] **Step 1: Add `parseSynthesized` method**

Add this method directly after `parseItems`:

```java
@SuppressWarnings("unchecked")
private List<Map<String, Object>> parseSynthesized(String rawText, Set<String> validCodes) {
    // Reuse fence-stripping logic from parseItems by re-extracting the JSON object
    String json = rawText;
    java.util.regex.Matcher fence = java.util.regex.Pattern
            .compile("```(?:json)?\\s*([\\s\\S]*?)```")
            .matcher(rawText);
    if (fence.find()) {
        json = fence.group(1).trim();
    }
    int start = json.indexOf('{');
    int end = json.lastIndexOf('}');
    if (start < 0 || end < 0 || end <= start) {
        return new ArrayList<>();
    }
    json = json.substring(start, end + 1);

    Map<String, Object> wrapper;
    try {
        wrapper = objectMapper.readValue(json, new TypeReference<>() {});
    } catch (Exception e) {
        return new ArrayList<>();
    }
    Object synthObj = wrapper.get("synthesized");
    if (synthObj == null) {
        return new ArrayList<>();
    }
    if (!(synthObj instanceof List)) {
        log.warn("[RecommendMockupService] 'synthesized' is not a list (got {}). Treating as empty.",
                 synthObj.getClass().getSimpleName());
        return new ArrayList<>();
    }
    List<Map<String, Object>> rawItems = (List<Map<String, Object>>) synthObj;
    List<Map<String, Object>> out = new ArrayList<>();
    for (Map<String, Object> item : rawItems) {
        Map<String, Object> validated = validateSynthesizedItem(item, validCodes);
        if (validated == null) continue;
        out.add(validated);
        if (out.size() >= TOP_SYNTHESIZED) break;
    }
    return out;
}

@SuppressWarnings("unchecked")
private Map<String, Object> validateSynthesizedItem(Map<String, Object> item, Set<String> validCodes) {
    if (item == null) return null;
    Object label = item.get("label");
    Object layersObj = item.get("layers");
    if (!(label instanceof String) || ((String) label).isBlank()) {
        log.warn("[RecommendMockupService] synthesized item missing label, dropped");
        return null;
    }
    if (!(layersObj instanceof List) || ((List<?>) layersObj).isEmpty()) {
        log.warn("[RecommendMockupService] synthesized item '{}' has no layers, dropped", label);
        return null;
    }
    List<Map<String, Object>> layers = (List<Map<String, Object>>) layersObj;
    List<Map<String, Object>> validatedLayers = new ArrayList<>();
    for (Map<String, Object> layer : layers) {
        if (!isValidLayer(layer, validCodes)) {
            log.warn("[RecommendMockupService] synthesized item '{}' dropped — invalid layer: {}", label, layer);
            return null;   // item-level conservatism: any invalid layer fails the whole item
        }
        // Normalize the layer to only the keys we promise downstream
        Map<String, Object> norm = new HashMap<>();
        norm.put("key",              layer.get("key"));
        norm.put("title",            layer.get("title"));
        norm.put("type",             layer.get("type"));
        norm.put("subtype",          layer.get("subtype"));
        norm.put("position",         layer.get("position"));
        norm.put("sourceMockupCode", layer.get("sourceMockupCode"));
        validatedLayers.add(norm);
    }
    Map<String, Object> out = new HashMap<>();
    out.put("label",       label);
    out.put("description", item.getOrDefault("description", ""));
    out.put("reason",      item.getOrDefault("reason", ""));
    out.put("layers",      validatedLayers);
    return out;
}

@SuppressWarnings("unchecked")
private boolean isValidLayer(Map<String, Object> layer, Set<String> validCodes) {
    if (layer == null) return false;
    Object key = layer.get("key");
    Object title = layer.get("title");
    Object type = layer.get("type");
    Object src = layer.get("sourceMockupCode");
    Object posObj = layer.get("position");

    if (!(key instanceof String) || ((String) key).isBlank()) return false;
    if (!(title instanceof String) || ((String) title).isBlank()) return false;
    if (!(type instanceof String) || ((String) type).isBlank()) return false;
    if (!(src instanceof String) || !validCodes.contains((String) src)) return false;
    if (!(posObj instanceof Map)) return false;

    Map<String, Object> pos = (Map<String, Object>) posObj;
    Integer x = asInt(pos.get("x"));
    Integer y = asInt(pos.get("y"));
    Integer w = asInt(pos.get("w"));
    Integer h = asInt(pos.get("h"));
    if (x == null || y == null || w == null || h == null) return false;
    if (x < 0 || y < 0) return false;
    if (w < 1 || h < 1) return false;
    if (x + w > 12) return false;
    return true;
}

private static Integer asInt(Object v) {
    if (v instanceof Integer i) return i;
    if (v instanceof Number n) return n.intValue();
    if (v instanceof String s) {
        try { return Integer.parseInt(s.trim()); } catch (Exception e) { return null; }
    }
    return null;
}
```

- [ ] **Step 2: Wire `parseSynthesized` into `recommend()`**

In `recommend()` after `List<Map<String, Object>> items = parseItems(rawText, candidates);`, add:

```java
Set<String> validCodes = candidates.stream()
        .map(c -> c.get("patternCode") instanceof String s ? s : null)
        .filter(s -> s != null)
        .collect(Collectors.toSet());
List<Map<String, Object>> synthesized = synthesizeFlag
        ? parseSynthesized(rawText, validCodes)
        : new ArrayList<>();
```

Then change the existing `result.put("synthesized", List.of());` (added in Task 2) to:

```java
result.put("synthesized", synthesized);
```

- [ ] **Step 3: Verify compile**

```bash
docker compose exec composer-backend mvn -q -DskipTests compile
```
Expected: `BUILD SUCCESS`.

- [ ] **Step 4: Smoke test via frontend**

Trigger DevTools restart:
```bash
docker compose exec composer-backend sh -c 'date +%s > target/classes/.devtools-restart-trigger'
```

In the browser, AI 추천 패널 → NL "수요계획 입력 + 실적 비교 대시보드" → 추천 템플릿 찾기. Open DevTools Network → `recommend-mockups` response. Confirm `synthesized` is an array (may be empty if AI didn't propose, may have 1~2 items).

Expected response shape:
```json
{
  "items": [{"patternCode":"...","relevance":90,"reason":"..."}, ...],
  "synthesized": [
    {"label":"...","description":"...","reason":"...",
     "layers":[{"key":"...","title":"...","type":"...","subtype":null,
                "position":{"x":0,"y":0,"w":12,"h":2},"sourceMockupCode":"..."}]}
  ],
  "mode": "ai"
}
```

Note: the existing panel still uses the old 3-card layout — it'll likely render only the first 3 items (synthesized ignored for now). That's fine; we wire the UI in Task 11+.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/service/RecommendMockupService.java
git commit -m "feat(composer): parse + validate synthesized mockups from Claude response

parseSynthesized strips code fences, extracts the synthesized array,
validates each item (label, layers non-empty, every layer has valid
sourceMockupCode in candidates set, position fits 12-col grid). Item-level
conservatism: any invalid layer fails the whole item but other items survive.
Wired into recommend() via TOP_SYNTHESIZED=2 cap and synthesize flag.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: Create PrefillFromSynthesizedRequest DTO

**Files:**
- Create: `backend/src/main/java/com/zionex/t3composer/domain/dto/PrefillFromSynthesizedRequest.java`

- [ ] **Step 1: Write the DTO**

```java
package com.zionex.t3composer.domain.dto;

import java.util.Map;
import lombok.Data;

@Data
public class PrefillFromSynthesizedRequest {
    private String nl;
    /**
     * The synthesized mockup object echoed from the recommend-mockups response:
     * { label, description, reason, layers: [{key, title, type, subtype, position, sourceMockupCode}] }
     */
    private Map<String, Object> synthesized;
    private String moduleCode;
    // 예약 — 향후 Target 별 컨텍스트 prompting 용. 현재 prefill 로직에선 미사용.
    private String targetCd;
}
```

- [ ] **Step 2: Verify compile**

```bash
docker compose exec composer-backend mvn -q -DskipTests compile
```
Expected: `BUILD SUCCESS`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/dto/PrefillFromSynthesizedRequest.java
git commit -m "feat(composer): add PrefillFromSynthesizedRequest DTO

Echoes the synthesized object from recommend-mockups response as input
to a Claude prefill call.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 7: Create PrefillFromSynthesizedService

**Files:**
- Create: `backend/src/main/java/com/zionex/t3composer/domain/service/PrefillFromSynthesizedService.java`

- [ ] **Step 1: Write the service (mirror of PrefillFromMockupService)**

```java
package com.zionex.t3composer.domain.service;

import com.zionex.t3composer.domain.dto.PrefillFromSynthesizedRequest;
import com.zionex.t3composer.domain.client.AnthropicClient;
import com.zionex.t3composer.domain.client.AnthropicModels.CacheControl;
import com.zionex.t3composer.domain.client.AnthropicModels.Message;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesRequest;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;
import com.zionex.t3composer.domain.client.AnthropicModels.SystemBlock;
import com.zionex.t3composer.domain.client.AnthropicModels.TextBlock;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PrefillFromSynthesizedService {

    private static final String MODEL_NAME = "claude-sonnet-4-5";
    private static final int MAX_TOKENS = 2048;
    private static final int MAX_META_CHARS = 8000;

    private final AnthropicClient anthropicClient;
    private final AnthropicApiKeyService apiKeyService;
    private final ObjectMapper objectMapper;

    public Map<String, Object> prefill(String userId, PrefillFromSynthesizedRequest req) {
        Optional<String> apiKeyOpt = apiKeyService.getApiKey(userId);
        if (apiKeyOpt.isEmpty()) {
            log.warn("[PrefillFromSynthesizedService] API key not found for user {}, returning fallback", userId);
            return fallback();
        }

        try {
            String apiKey = apiKeyOpt.get();
            String systemPrompt = buildSystemPrompt();
            String userPrompt = buildUserPrompt(req);

            MessagesRequest mreq = MessagesRequest.builder()
                    .model(MODEL_NAME)
                    .max_tokens(MAX_TOKENS)
                    .temperature(0.0)
                    .system(List.of(
                            SystemBlock.builder()
                                    .type("text")
                                    .text(systemPrompt)
                                    .cacheControl(CacheControl.builder().type("ephemeral").build())
                                    .build()
                    ))
                    .messages(List.of(
                            Message.builder().role("user").content(userPrompt).build()
                    ))
                    .build();

            MessagesResponse resp = anthropicClient.sendMessages(apiKey, mreq).block();
            String rawText = extractText(resp);
            Map<String, Object> spec = parseSpec(rawText);

            Map<String, Object> out = new HashMap<>();
            out.put("spec", spec);
            out.put("mode", spec.isEmpty() ? "fallback" : "ai");
            out.put("model", resp != null ? resp.getModel() : MODEL_NAME);
            return out;

        } catch (Exception e) {
            log.warn("[PrefillFromSynthesizedService] Anthropic call failed, returning fallback: {}", e.getMessage());
            return fallback();
        }
    }

    private String buildSystemPrompt() {
        return String.join("\n",
            "당신은 T3Series Composer 의 화면 설계 도우미입니다.",
            "이 화면은 여러 mockup 의 layer 를 조합한 가상(synthesized) 레이아웃입니다 —",
            "synthesized.layers[].sourceMockupCode 가 각 layer 의 원본 mockup 을 가리킵니다.",
            "사용자 자연어 의도 + 합성 mockup 메타를 보고 4단계 Wizard 의",
            "검색조건(filterBar)과 화면 메타(meta) 만 prefill 합니다.",
            "",
            "★ 절대 규칙",
            "1. 출력은 순수 JSON 만. 마크다운/설명/코드 펜스 금지.",
            "2. ★ 데이터바인딩(실제 테이블/SP/컬럼/dataBinding/columns/layout) 은 절대 생성하지 마세요. filterBar 와 meta 만.",
            "3. ★ 출력 키 이름을 정확히 지킬 것:",
            "   - meta 의 키는 title, menuCd, parentMenuCd 만 (screenName/module/domain/description 금지).",
            "   - filterBar 의 키는 items (fields 금지). items 의 각 원소는 key, label, type 3개 키만",
            "     (field_id/output_variable/varName/dataType 금지).",
            "4. filterBar.items[].type 은 다음 값만 허용:",
            "   TEXT, NUMBER, DATE, DATETIME, DATE_RANGE, DROPDOWN, MULTISELECT, SELECT, RADIO,",
            "   CHECKBOX, POPUP, AUTOCOMPLETE, DOMAIN_PLAN_SCOPE, DOMAIN_ITEM_SINGLE,",
            "   DOMAIN_ITEM_MULTI, DOMAIN_ACCOUNT_SINGLE, DOMAIN_ACCOUNT_MULTI,",
            "   DOMAIN_LOCATION_MULTI, DOMAIN_RESOURCE_MULTI, DOMAIN_USER, DOMAIN_VERSION",
            "   (기간은 DATE_RANGE, 플랜스코프는 DOMAIN_PLAN_SCOPE 우선)",
            "5. filterBar.items[].key 는 camelCase, label 은 한글 표시명.",
            "6. meta.menuCd 형식 ^UI_(AD|BF|CM|DP|FO|FP|IM|MP|RP|SA|SO|UT)_[A-Z][A-Z0-9_]*$ (제안값).",
            "   meta.parentMenuCd 는 MENU_AD/MENU_DP/MENU_MP/MENU_FP/MENU_BF/MENU_IM/MENU_RP/MENU_SA/MENU_UTIL 중 하나.",
            "   확신 없으면 빈 문자열(사용자가 메타 단계에서 확정).",
            "7. 재조합 의도를 살펴 — 가장 자주 등장하는 sourceMockupCode 의 도메인 / layer 들의 type 분포 / synthesized.reason 을 종합해 filterBar 를 구성.",
            "",
            "★ 출력 JSON 구조 (정확히 이 키 — 이 외 키 금지)",
            "{",
            "  \"meta\": { \"title\": \"\", \"menuCd\": \"\", \"parentMenuCd\": \"\" },",
            "  \"filterBar\": { \"items\": [ { \"key\": \"camelCase\", \"label\": \"한글\", \"type\": \"DATE_RANGE\" } ] }",
            "}");
    }

    private String buildUserPrompt(PrefillFromSynthesizedRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("Synthesized mockup (AI-recombined layout):\n");
        if (req.getSynthesized() != null && !req.getSynthesized().isEmpty()) {
            try {
                String json = objectMapper.writeValueAsString(req.getSynthesized());
                if (json.length() > MAX_META_CHARS) {
                    json = json.substring(0, MAX_META_CHARS) + "...(truncated)";
                }
                sb.append(json);
            } catch (Exception e) {
                sb.append(req.getSynthesized().toString());
            }
            sb.append("\n\n");
        } else {
            sb.append("(none)\n\n");
        }

        if (req.getModuleCode() != null && !req.getModuleCode().isBlank()) {
            sb.append("Module: ").append(req.getModuleCode()).append("\n\n");
        }

        sb.append("User's natural language description:\n");
        sb.append(req.getNl() != null ? req.getNl() : "(no description)");
        sb.append("\n\n위 정보를 바탕으로 filterBar.items 와 meta 만 JSON 으로 출력하세요.");
        return sb.toString();
    }

    private String extractText(MessagesResponse resp) {
        if (resp == null || resp.getContent() == null) return "";
        StringBuilder sb = new StringBuilder();
        for (Object block : resp.getContent()) {
            if (block instanceof TextBlock tb) {
                sb.append(tb.getText());
            } else if (block instanceof Map<?, ?> m) {
                Object type = m.get("type");
                Object text = m.get("text");
                if ("text".equals(type) && text instanceof String s) {
                    sb.append(s);
                }
            }
        }
        return sb.toString().trim();
    }

    private Map<String, Object> parseSpec(String rawText) {
        String json = rawText;
        java.util.regex.Matcher fence = java.util.regex.Pattern
                .compile("```(?:json)?\\s*([\\s\\S]*?)```")
                .matcher(rawText);
        if (fence.find()) {
            json = fence.group(1).trim();
        }
        int start = json.indexOf('{');
        int end = json.lastIndexOf('}');
        if (start < 0 || end < 0 || end <= start) {
            log.warn("[PrefillFromSynthesizedService] No JSON object found in response");
            return new HashMap<>();
        }
        json = json.substring(start, end + 1);
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("[PrefillFromSynthesizedService] Failed to parse AI response JSON: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    private Map<String, Object> fallback() {
        Map<String, Object> result = new HashMap<>();
        result.put("spec", new HashMap<>());
        result.put("mode", "fallback");
        return result;
    }
}
```

- [ ] **Step 2: Verify compile**

```bash
docker compose exec composer-backend mvn -q -DskipTests compile
```
Expected: `BUILD SUCCESS`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/service/PrefillFromSynthesizedService.java
git commit -m "feat(composer): add PrefillFromSynthesizedService

Mirror of PrefillFromMockupService. System prompt explicitly states the
mockup is a synthesized recombination (so the model uses sourceMockupCode
context per layer) and adds rule 7: blend layer types/source domains +
synthesized.reason to derive filterBar fields. Output schema identical
({meta, filterBar.items}) so frontend mergeAiPrefillIntoSpec keeps working.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 8: Add /composer/prefill-from-synthesized controller mapping

**Files:**
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/controller/ComposerController.java`

- [ ] **Step 1: Find the existing prefill-from-mockup endpoint**

Run:
```bash
grep -n "prefill-from-mockup\|prefillFromMockupService" backend/src/main/java/com/zionex/t3composer/domain/controller/ComposerController.java
```

- [ ] **Step 2: Add the new field injection**

Find the constructor-injected service fields (look for `private final PrefillFromMockupService prefillFromMockupService;`) and add directly below it:

```java
private final PrefillFromSynthesizedService prefillFromSynthesizedService;
```

Add the import near the existing service imports:

```java
import com.zionex.t3composer.domain.service.PrefillFromSynthesizedService;
import com.zionex.t3composer.domain.dto.PrefillFromSynthesizedRequest;
```

- [ ] **Step 3: Add the endpoint**

Directly after the existing `prefillFromMockup` method, add:

```java
@PostMapping("/prefill-from-synthesized")
public ResponseEntity<Map<String, Object>> prefillFromSynthesized(@RequestBody PrefillFromSynthesizedRequest req) {
    try {
        return ResponseEntity.ok(prefillFromSynthesizedService.prefill(currentUserId(), req));
    } catch (Exception e) {
        log.error("prefill-from-synthesized failed", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error",   "server_error",
                "message", e.getMessage() != null ? e.getMessage() : "unknown"));
    }
}
```

- [ ] **Step 4: Verify compile and DevTools restart**

```bash
docker compose exec composer-backend mvn -q -DskipTests compile
docker compose exec composer-backend sh -c 'date +%s > target/classes/.devtools-restart-trigger'
sleep 6
```
Expected: BUILD SUCCESS.

- [ ] **Step 5: Smoke-test the endpoint**

```bash
curl -s -X POST http://localhost:8090/composer/prefill-from-synthesized \
  -H 'Content-Type: application/json' \
  -d '{"nl":"수요계획","synthesized":{"label":"테스트","layers":[]},"moduleCode":""}' | python3 -m json.tool
```
Expected: JSON with `spec` (likely empty) and `mode: "fallback"` (no API key wired, or empty layers). Importantly, NOT a 404.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/controller/ComposerController.java
git commit -m "feat(composer): add /composer/prefill-from-synthesized endpoint

Constructor-injects PrefillFromSynthesizedService and exposes the POST
route. Error envelope matches sibling prefill endpoints.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 9: Add prefillFromSynthesized to frontend api.js

**Files:**
- Modify: `frontend/src/view/util/t3composer/api.js`

- [ ] **Step 1: Locate the existing prefillFromMockup export**

```bash
grep -n "prefillFromMockup\|recommendMockups" frontend/src/view/util/t3composer/api.js
```

`prefillFromMockup` is defined around line 259 with this shape:

```js
export const prefillFromMockup = ({ nl, mockupPatternCode, mockupMeta, moduleCode, targetCd }) =>
  zAxios.post(
    'composer/prefill-from-mockup',
    { nl, mockupPatternCode, mockupMeta, moduleCode, targetCd },
    composerReq()
  );
```

Note: ① URL has **no leading slash**. ② Third argument is `composerReq()` (shared timeout/headers helper). ③ The function uses **destructured-arg arrow style**, not a `function` declaration with a single body object.

- [ ] **Step 2: Add the new wrapper directly after prefillFromMockup**

```js
/**
 * AI 추천 — 재조합된 synthesized mockup + 자연어로 4단계 Wizard 부분 prefill.
 * 응답: { spec: { meta?, filterBar? }, mode: 'ai'|'fallback', model }
 *   prefillFromMockup 과 응답 shape 동일 — 호출부 mergeAiPrefillIntoSpec 재사용.
 */
export const prefillFromSynthesized = ({ nl, synthesized, moduleCode, targetCd }) =>
  zAxios.post(
    'composer/prefill-from-synthesized',
    { nl, synthesized, moduleCode, targetCd },
    composerReq()
  );
```

**Do not** invent a different shape (e.g. raw `zAxios({...})` object form, or `/composer/...` leading slash). Match prefillFromMockup exactly.

- [ ] **Step 3: Quick browser check (frontend hot-reloads)**

In the browser DevTools Console:
```js
import('/src/view/util/t3composer/api.js').then(m => console.log(typeof m.prefillFromSynthesized));
```
Expected: `function`.

Or simply confirm the dev server hot-rebuild emits no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/view/util/t3composer/api.js
git commit -m "feat(composer): add prefillFromSynthesized() api wrapper

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 10: Add specFromSynthesized to wizardState.js

**Files:**
- Modify: `frontend/src/view/util/t3composer/wizardState.js`

- [ ] **Step 1: Find specFromMockup**

```bash
grep -n "specFromMockup\|mockupContextText\|export function specFromMockup" frontend/src/view/util/t3composer/wizardState.js
```

The implementation lives around line 2973 with `mockupContextText` at ~2961. We add new functions directly after them.

- [ ] **Step 2: Add lookup helper and new functions**

After the closing brace of `specFromMockup` (and before the next existing export), insert:

```js
// MOCKUP_ENTRIES patternCode → entry lookup, memoized at module scope.
// We can't compute this at import time because it would create a circular dep
// (t3mockup/index.js imports MOCKUP_ENTRIES into its own consumers). Lazy init on first call.
let __MOCKUP_CODE_TO_ENTRY = null;
function getMockupCodeToEntry() {
  if (__MOCKUP_CODE_TO_ENTRY) return __MOCKUP_CODE_TO_ENTRY;
  // Lazy import — keeps module load order safe.
  // eslint-disable-next-line global-require
  const { MOCKUP_ENTRIES } = require('../t3mockup');
  const m = new Map();
  for (const e of MOCKUP_ENTRIES) m.set(e.patternCode, e);
  __MOCKUP_CODE_TO_ENTRY = m;
  return m;
}

/**
 * Per-layer natural-language context for a synthesized mockup — one block per layer
 * describing the synthesis intent (overall reason) + the layer's source mockup.
 * Claude uses this to align each layer's data binding with the original design.
 */
function synthesizedContextText(synth, layer, sourceEntry) {
  const lines = [
    `[참조 패턴] ${synth.label || '재조합'} (AI 재조합)`,
  ];
  if (synth.reason || synth.description) {
    lines.push(`[조합 의도] ${synth.reason || synth.description}`);
  }
  if (sourceEntry) {
    lines.push(`[이 layer 의 원본 mockup] ${sourceEntry.patternLabel || sourceEntry.patternCode}`);
    if (sourceEntry.description) lines.push(`[원본 설명] ${sourceEntry.description}`);
  } else if (layer.sourceMockupCode) {
    lines.push(`[이 layer 의 원본 mockup] ${layer.sourceMockupCode}`);
  }
  if (layer.title) lines.push(`[이 영역의 역할] ${layer.title}`);
  lines.push('');
  lines.push('이 영역에서 보여줄 데이터를 자유롭게 보완하세요 — 또는 Data Source 탐색에서 Table/SP 를 직접 참조 추가.');
  return lines.join('\n');
}

/**
 * Synthesized 카드 선택 시 Wizard 로 넘기는 베이스 spec 생성.
 * specFromMockup 과 동일한 shape 의 ComposerSpec 을 만들되:
 *   - pattern = 'SYNTHESIZED'
 *   - layers   = synth.layers (key/title/type/subtype/position 보존)
 *   - 각 layer.dataSource.naturalText 에 layer 별 출처 mockup 컨텍스트 주입
 */
export function specFromSynthesized(synth, baseMeta = {}) {
  if (!synth || !Array.isArray(synth.layers) || synth.layers.length === 0) {
    return createComposerSpec({ ...baseMeta, pattern: 'BLANK' });
  }
  const codeToEntry = getMockupCodeToEntry();
  const base = createComposerSpec({
    ...baseMeta,
    pattern: 'SYNTHESIZED',
    title: baseMeta.title || synth.label || '새 화면',
  });
  base.layers = synth.layers.map((d) => {
    const src = codeToEntry.get(d.sourceMockupCode);
    return {
      key: d.key,
      title: d.title,
      type: d.type,
      subtype: d.subtype || null,
      position: d.position,
      dataSource: {
        mode: 'NL',
        naturalText: synthesizedContextText(synth, d, src),
        references: [],
        sqlBlocks: [],
      },
      columns: [],
      cascade: {},
    };
  });
  base.filterBar.affects = Object.fromEntries(base.layers.map((l) => [l.key, []]));
  return base;
}
```

**Important:** `createComposerSpec` is the same helper `specFromMockup` already uses — keep importing it from the same place. Run:

```bash
grep -n "createComposerSpec" frontend/src/view/util/t3composer/wizardState.js | head -5
```

to confirm it's available in the module (it is — `specFromMockup` uses it).

- [ ] **Step 3: Browser quick check**

Webpack auto-reloads. In DevTools Console:
```js
import('/src/view/util/t3composer/wizardState.js').then(m => console.log(typeof m.specFromSynthesized));
```
Expected: `function`. No compile errors in the terminal running webpack.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/view/util/t3composer/wizardState.js
git commit -m "feat(composer): add specFromSynthesized + per-layer source context

specFromSynthesized builds a ComposerSpec from a synthesized mockup,
preserving layer position/type and injecting layer-specific naturalText
with the original mockup reference so Claude prefill can align data
binding to the source design intent. Lazy MOCKUP_ENTRIES lookup avoids
circular import.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 11: Create SynthesizedMockupPreview wireframe component

**Files:**
- Create: `frontend/src/view/util/t3composer/SynthesizedMockupPreview.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React, { useMemo } from 'react';
import { Box, Stack, Typography, Chip } from '@mui/material';
import { MOCKUP_ENTRIES } from '../t3mockup';

// Layer type → color group. Real MOCKUP_ENTRIES types observed:
//   CHART / CHART_BAR / CHART_DONUT / CHART_LINE / KPI_CARD / DIAGRAM_* / GRID / GRID_BASE /
//   GRID_CROSSTAB / GRID_PIVOT / GRID_TREE / STEPPER.
// AI may use any of these or invent close variants — match by prefix and fall back to OTHER.
function classifyType(t) {
  if (!t || typeof t !== 'string') return 'OTHER';
  const up = t.toUpperCase();
  if (up.startsWith('KPI'))     return 'KPI';
  if (up.startsWith('CHART'))   return 'CHART';
  if (up.startsWith('GRID'))    return 'GRID';
  if (up.startsWith('DIAGRAM')) return 'DIAGRAM';
  if (up.startsWith('FORM'))    return 'FORM';
  if (up.startsWith('STEPPER')) return 'STEPPER';
  return 'OTHER';
}

const TYPE_COLOR = {
  KPI:     { bg: '#dbeafe', border: '#60a5fa' },
  CHART:   { bg: '#fef3c7', border: '#f59e0b' },
  GRID:    { bg: '#d1fae5', border: '#10b981' },
  DIAGRAM: { bg: '#fce7f3', border: '#ec4899' },
  FORM:    { bg: '#ede9fe', border: '#8b5cf6' },
  STEPPER: { bg: '#e0f2fe', border: '#0ea5e9' },
  OTHER:   { bg: '#f1f5f9', border: '#94a3b8' },
};

/**
 * 12-column wireframe preview for a synthesized mockup.
 * Renders each layer as an absolutely-positioned box with a type chip,
 * the layer's title, and the source mockup's label.
 *
 * Props:
 *   layers — Array<{key, title, type, position:{x,y,w,h}, sourceMockupCode}>
 */
export default function SynthesizedMockupPreview({ layers }) {
  const codeToEntry = useMemo(() => {
    const m = new Map();
    for (const e of MOCKUP_ENTRIES) m.set(e.patternCode, e);
    return m;
  }, []);

  if (!Array.isArray(layers) || layers.length === 0) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex',
                 alignItems: 'center', justifyContent: 'center',
                 color: '#94a3b8', fontSize: 11 }}>
        (layer 정보 없음)
      </Box>
    );
  }

  const maxY = layers.reduce((acc, l) => {
    const y = (l.position?.y || 0) + (l.position?.h || 1);
    return Math.max(acc, y);
  }, 1);
  const rows = Math.max(8, maxY);
  const cellW = 100 / 12;
  const cellH = 100 / rows;

  return (
    <Box sx={{
      position: 'relative', width: '100%', height: '100%',
      bgcolor: '#fafafa', overflow: 'hidden',
      backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
      backgroundSize: `${cellW}% ${cellH}%`,
    }}>
      {layers.map((l, i) => {
        const pos = l.position || { x: 0, y: 0, w: 12, h: 1 };
        const src = codeToEntry.get(l.sourceMockupCode);
        const klass = classifyType(l.type);
        const color = TYPE_COLOR[klass];
        return (
          <Box key={l.key || `layer-${i}`} sx={{
            position: 'absolute',
            left:   `${(pos.x || 0) * cellW}%`,
            top:    `${(pos.y || 0) * cellH}%`,
            width:  `${(pos.w || 1) * cellW}%`,
            height: `${(pos.h || 1) * cellH}%`,
            bgcolor: color.bg,
            border: `1.5px dashed ${color.border}`,
            p: 0.5,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}>
            <Stack direction="row" spacing={0.4} alignItems="center" sx={{ minWidth: 0 }}>
              <Chip size="small" label={String(l.type || 'OTHER').replace(/_/g, ' ')}
                    sx={{ height: 14, fontSize: 8, fontWeight: 700,
                          bgcolor: color.border, color: '#fff', '& .MuiChip-label': { px: 0.5 } }} />
              <Typography noWrap sx={{ fontSize: 9, fontWeight: 700, color: '#334155', lineHeight: 1.1 }}>
                {l.title}
              </Typography>
            </Stack>
            {(src || l.sourceMockupCode) && (
              <Typography noWrap sx={{ fontSize: 7.5, color: '#64748b', fontStyle: 'italic' }}>
                from: {src ? (src.patternLabel || src.patternCode) : l.sourceMockupCode}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
```

- [ ] **Step 2: Browser quick check (no Panel wiring yet)**

Webpack rebuilds. Confirm dev server terminal shows no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/view/util/t3composer/SynthesizedMockupPreview.jsx
git commit -m "feat(composer): add SynthesizedMockupPreview wireframe renderer

12-col grid with absolutely-positioned layer boxes. classifyType maps real
MOCKUP_ENTRIES type values (CHART/CHART_LINE/GRID/GRID_PIVOT/KPI_CARD/
DIAGRAM_*/STEPPER) by prefix to color groups. Source mockup label resolved
via MOCKUP_ENTRIES lookup; falls back to raw code when unresolved.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 12: AiRecommendPanel — state shape + fill logic + grid layout

This is the biggest single edit but kept in one commit because the changes ripple across the same render tree.

**Files:**
- Modify: `frontend/src/view/util/t3composer/AiRecommendPanel.jsx`

- [ ] **Step 1: Add imports**

At the top of the file, add (next to existing imports):

```jsx
import { specFromSynthesized } from './wizardState';
import { recommendMockups, prefillFromMockup, prefillFromSynthesized } from './api';
import SynthesizedMockupPreview from './SynthesizedMockupPreview';
```

The existing `recommendMockups, prefillFromMockup` import line should be modified to include `prefillFromSynthesized`. The existing `specFromMockup` import already exists.

Replace `EXAMPLES` block by adding new accent colors right above it (for the synthesized purple branding):

```jsx
const SYNTH_ACCENT       = '#8b5cf6';  // purple-500
const SYNTH_ACCENT_DARK  = '#6d28d9';  // purple-700
const SYNTH_ACCENT_HOVER = '#7c3aed';  // purple-600
const SYNTH_ACCENT_BG    = '#f5f3ff';  // purple-50
const SYNTH_ACCENT_CHIP  = '#ede9fe';  // purple-100
const SYNTH_ACCENT_TEXT  = '#5b21b6';  // purple-800
```

- [ ] **Step 2: Replace `onSearch` to use the new fill logic**

Find the existing `const onSearch = async () => { ... };` block and replace it with:

```jsx
const onSearch = async () => {
  if (!nl.trim() || loading) return;
  setLoading(true);
  setResults(null);

  const TARGET_SLOTS       = 6;
  const TARGET_EXISTING    = 4;
  const TARGET_SYNTHESIZED = 2;

  // 1) Front-side keyword score as fallback ordering
  const keywordTop = scoreMockupCandidates(nl, MOCKUP_ENTRIES);
  const candidates = buildMockupCandidates(nl, MOCKUP_ENTRIES, 12);

  let cards = [];
  let resolvedMode = 'fallback';
  try {
    const res = await recommendMockups({ nl, candidates });
    const data = res?.data || {};
    if (data.mode === 'ai') {
      resolvedMode = 'ai';
      const existingAll = (data.items || [])
        .map((it) => ({
          kind: 'existing',
          entry: codeToEntry.get(it.patternCode),
          relevance: it.relevance,
          reason: it.reason,
        }))
        .filter((x) => x.entry);
      const synthAll = (Array.isArray(data.synthesized) ? data.synthesized : [])
        .map((s) => ({ kind: 'synthesized', synth: s }));

      const eUse = existingAll.slice(0, TARGET_EXISTING);
      const sUse = synthAll.slice(0, TARGET_SYNTHESIZED);
      cards = [...eUse, ...sUse];

      if (cards.length < TARGET_SLOTS) {
        const eExtra = existingAll.slice(TARGET_EXISTING);
        const sExtra = synthAll.slice(TARGET_SYNTHESIZED);
        for (const c of eExtra) { if (cards.length >= TARGET_SLOTS) break; cards.push(c); }
        for (const c of sExtra) { if (cards.length >= TARGET_SLOTS) break; cards.push(c); }
      }
    } else {
      cards = keywordTop.slice(0, TARGET_SLOTS).map((s) => ({ kind: 'existing', entry: s.entry }));
    }
  } catch {
    cards = keywordTop.slice(0, TARGET_SLOTS).map((s) => ({ kind: 'existing', entry: s.entry }));
  } finally {
    setLoading(false);
  }

  while (cards.length < TARGET_SLOTS) {
    cards.push({
      kind: 'placeholder',
      message: cards.length === 0
        ? '관련 템플릿을 찾지 못했습니다. 다른 표현으로 다시 시도해보세요.'
        : 'AI 가 적절한 추가 템플릿을 찾지 못했습니다.',
    });
  }

  setMode(resolvedMode);
  setResults(cards);
};
```

- [ ] **Step 3: Replace `onPick` to branch on card kind**

Find `const onPick = async (entry) => { ... };` and replace with:

```jsx
const onPick = async (item) => {
  if (!item || item.kind === 'placeholder' || prefilling) return;
  setPrefilling(true);

  if (item.kind === 'existing') {
    const entry = item.entry;
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
      onStart(base);
    } finally {
      setPrefilling(false);
    }
    return;
  }

  if (item.kind === 'synthesized') {
    const synth = item.synth;
    const base = specFromSynthesized(synth, { title: synth.label || '새 화면', menuCd: '' });
    try {
      const res = await prefillFromSynthesized({
        nl,
        synthesized: synth,
        moduleCode: '',
        targetCd,
      });
      const aiSpec = res?.data?.spec || null;
      onStart(mergeAiPrefillIntoSpec(base, aiSpec));
    } catch {
      onStart(base);
    } finally {
      setPrefilling(false);
    }
    return;
  }
};
```

- [ ] **Step 4: Replace the result panel render with the 2×3 grid**

Find the existing right-side block — the one that begins with `{!results && (...)}` and ends with the closing of the result list block (covers placeholders + the existing 3-column flex map). Replace from the `<Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', ... }}>` opener through its closing `</Box>` with:

```jsx
<Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
  {!results && (
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
      <Typography variant="body2">자연어로 만들고 싶은 화면을 적고 "추천 템플릿 찾기" 를 누르세요.</Typography>
    </Box>
  )}
  {results && (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'repeat(2, 1fr)',
      gap: 1.2,
      flex: 1,
      minHeight: 0,
    }}>
      {results.map((item, idx) => renderCard(item, idx))}
    </Box>
  )}
  {results && results.some((c) => c.kind !== 'placeholder') && (
    <Typography sx={{ fontSize: 10.5, color: '#94a3b8', textAlign: 'center' }}>
      선택 후 → ① Layout ② 데이터·검색조건 ③ 메타·메뉴 ④ 생성 <b style={{ color: ACCENT_DARK }}>(AI 자동 prefill)</b>
    </Typography>
  )}
</Box>
```

- [ ] **Step 5: Add the renderCard helper function**

Inside the `AiRecommendPanel` component body (above the `return` statement, after the existing `startZoom` helper), add:

```jsx
const renderCard = (item, idx) => {
  if (item.kind === 'placeholder') {
    return (
      <Box key={`ph-${idx}`} sx={{
        bgcolor: '#fff', borderRadius: 2,
        border: '1.5px dashed #cbd5e1',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        p: 2, color: '#94a3b8',
      }}>
        <Typography variant="body2" sx={{ textAlign: 'center', fontSize: 11 }}>
          {item.message}
        </Typography>
      </Box>
    );
  }

  if (item.kind === 'existing') {
    const entry = item.entry;
    const Thumb = entry.component;
    const top = idx === 0;
    return (
      <Box key={`ex-${entry.patternCode}`} sx={{
        display: 'flex', flexDirection: 'column', minWidth: 0,
        bgcolor: '#fff', borderRadius: 2, overflow: 'hidden',
        border: top ? `2px solid ${ACCENT}` : '1px solid #e2e8f0',
        boxShadow: top ? '0 4px 14px rgba(245,158,11,0.18)' : 'none',
      }}>
        <Box
          onMouseDown={(e) => { e.preventDefault(); startZoom(entry); }}
          sx={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden',
                borderBottom: '1px solid #f1f5f9', cursor: 'zoom-in', bgcolor: '#fff',
                userSelect: 'none' }}
        >
          <Box sx={{ width: THUMB_W, height: THUMB_H,
                     transform: 'scale(0.18)', transformOrigin: 'top left', pointerEvents: 'none' }}>
            <Suspense fallback={<Box sx={{ p: 4 }}><CircularProgress size={20} /></Box>}>
              {Thumb ? <Thumb /> : null}
            </Suspense>
          </Box>
        </Box>
        <Box sx={{ p: 1.2, display: 'flex', flexDirection: 'column', gap: 0.4, minHeight: 130 }}>
          {item.relevance != null && (
            <Chip label={`관련도 ${item.relevance}%`} size="small"
                  sx={{ alignSelf: 'flex-start', height: 18, fontSize: 10, fontWeight: 700,
                        bgcolor: top ? ACCENT_CHIP : '#f1f5f9', color: top ? ACCENT_DARK : '#64748b' }} />
          )}
          <Typography sx={{ fontWeight: 700, fontSize: 12.5, lineHeight: 1.3 }}>{entry.patternLabel}</Typography>
          <Typography sx={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{entry.description}</Typography>
          {item.reason && (
            <Typography sx={{ fontSize: 10.5, color: ACCENT_DARK, fontStyle: 'italic' }}>“{item.reason}”</Typography>
          )}
          {(entry.menus || []).length > 0 && (
            <Typography sx={{ fontSize: 9.5, color: '#94a3b8' }}>
              📋 {(entry.menus || []).slice(0, 2).map((m) => m.menuNm).join(' · ')}
            </Typography>
          )}
          <Button variant={top ? 'contained' : 'outlined'} size="small" onClick={() => onPick(item)}
                  disabled={prefilling}
                  sx={{ mt: 'auto', fontWeight: 700, fontSize: 11,
                        ...(top ? { bgcolor: ACCENT, '&:hover': { bgcolor: ACCENT_HOVER } }
                                : { color: ACCENT_DARK, borderColor: ACCENT }) }}>
            {prefilling ? '분석 중…' : '이 템플릿으로 시작 →'}
          </Button>
        </Box>
      </Box>
    );
  }

  if (item.kind === 'synthesized') {
    const synth = item.synth;
    const sourceCodes = Array.from(new Set(
      (synth.layers || []).map((l) => l.sourceMockupCode).filter(Boolean)
    ));
    return (
      <Box key={`syn-${idx}`} sx={{
        display: 'flex', flexDirection: 'column', minWidth: 0,
        bgcolor: '#fff', borderRadius: 2, overflow: 'hidden',
        border: `2px solid ${SYNTH_ACCENT}`,
        boxShadow: '0 4px 14px rgba(139,92,246,0.18)',
      }}>
        <Box sx={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden',
                   borderBottom: '1px solid #f1f5f9', bgcolor: '#fff' }}>
          <SynthesizedMockupPreview layers={synth.layers} />
        </Box>
        <Box sx={{ p: 1.2, display: 'flex', flexDirection: 'column', gap: 0.4, minHeight: 130 }}>
          <Chip label="🪄 AI 재조합" size="small"
                sx={{ alignSelf: 'flex-start', height: 18, fontSize: 10, fontWeight: 700,
                      bgcolor: SYNTH_ACCENT_CHIP, color: SYNTH_ACCENT_DARK }} />
          <Typography sx={{ fontWeight: 700, fontSize: 12.5, lineHeight: 1.3 }}>{synth.label}</Typography>
          {synth.description && (
            <Typography sx={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{synth.description}</Typography>
          )}
          {synth.reason && (
            <Typography sx={{ fontSize: 10.5, color: SYNTH_ACCENT_DARK, fontStyle: 'italic' }}>“{synth.reason}”</Typography>
          )}
          {sourceCodes.length > 0 && (
            <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.3 }}>
              {sourceCodes.slice(0, 3).map((code) => {
                const src = codeToEntry.get(code);
                return (
                  <Chip key={code} size="small" label={src ? (src.patternLabel || code) : code}
                        sx={{ height: 16, fontSize: 9, bgcolor: SYNTH_ACCENT_BG, color: SYNTH_ACCENT_TEXT,
                              border: `1px solid ${SYNTH_ACCENT_CHIP}` }} />
                );
              })}
            </Stack>
          )}
          <Button variant="contained" size="small" onClick={() => onPick(item)}
                  disabled={prefilling}
                  sx={{ mt: 'auto', fontWeight: 700, fontSize: 11,
                        bgcolor: SYNTH_ACCENT, '&:hover': { bgcolor: SYNTH_ACCENT_HOVER } }}>
            {prefilling ? '분석 중…' : '이 재조합으로 시작 →'}
          </Button>
        </Box>
      </Box>
    );
  }

  return null;
};
```

- [ ] **Step 6: Browser smoke test**

Webpack rebuilds. In the browser:
1. Refresh AI 추천 panel.
2. NL: `수요계획 입력 + 실적 대시보드` → 추천 템플릿 찾기.
3. Confirm 2 rows × 3 columns rendered with mixed cards. Expected card breakdown when AI cooperates: 4 existing (amber accent on first only) + 2 synthesized (purple accent, 🪄 chip, wireframe preview).
4. Hover/click a synthesized card → button shows "이 재조합으로 시작 →".
5. Click the synthesized card → Wizard Step1 loads with `pattern === 'SYNTHESIZED'` (visible in network panel — `POST /composer/sessions` body includes the spec).

If the network response has `synthesized: []` (AI didn't synthesize for this NL), all 6 cards should be existing. If candidates pool is tiny, you'll see placeholders fill remaining slots.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/view/util/t3composer/AiRecommendPanel.jsx
git commit -m "feat(composer): AI Recommend Panel — 2x3 grid with synthesized cards

State now holds Array<existing | synthesized | placeholder>. onSearch fills
4 existing + 2 synthesized when AI cooperates, falls back to extra existing
or placeholders. renderCard branches on kind: existing keeps amber accent
and component scale-thumbnail; synthesized uses purple accent, SynthesizedMockupPreview
wireframe, and 🪄 chip; placeholder is a gray dashed empty box.
onPick branches between prefillFromMockup and prefillFromSynthesized.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 13: End-to-end manual smoke test

This task has no code — it's the integration walkthrough that exercises every path. Do not skip.

- [ ] **Step 1: Confirm dev environment is healthy**

```bash
docker compose ps
```
Expected: `composer-db`, `composer-backend`, `composer-frontend` all `Up`.

If backend is restarting, tail the log: `docker compose logs --tail=200 composer-backend`. Wait until the "Started ... in N seconds" line.

- [ ] **Step 2: Synthesis happy path**

In browser at http://localhost:5173:
1. T3Composer → AI 추천 진입.
2. NL: `수요계획 입력 화면 + 실적 KPI 비교 대시보드 같이 보여줘`.
3. Click 추천 템플릿 찾기.

Expected:
- 2 rows × 3 cols rendered.
- 4 amber-bordered existing cards + 2 purple-bordered synthesized cards (each with 🪄 chip, wireframe layer boxes, source-mockup chips).
- The 2 synthesized cards have meaningfully different `label`/`description` — not near duplicates.

If both synthesized are absent or AI returned `synthesized: []` for the request: re-run with NL `엔지니어가 모르는 도메인 화면을 새로 디자인 + 다양한 차트 위젯 + 입력 그리드`. Should reliably trigger synthesis on diverse vocabulary.

- [ ] **Step 3: Existing card click**

Click one amber card. Expected: Wizard Step1 loads with that mockup's layers preserved. Behavior unchanged from before.

- [ ] **Step 4: Synthesized card click — Wizard 진입**

Hit Back (←) to return to AI 추천. Click a purple synthesized card. Expected:
- Button shows "분석 중…" briefly.
- Wizard Step1 loads with layers from `synth.layers` (same positions as the wireframe).
- `pattern === 'SYNTHESIZED'` (inspect via React DevTools or by Network → composer/sessions response).
- Step Data 단계 (Step3 or wherever data binding shows) — each layer's `dataSource.naturalText` contains:
  - `[참조 패턴] <label> (AI 재조합)`
  - `[조합 의도] ...`
  - `[이 layer 의 원본 mockup] ...` (resolved to source patternLabel)
  - `[이 영역의 역할] ...`

- [ ] **Step 5: Placeholder fallback**

Back to AI 추천. NL: `xyz qwerty foobar`. Click 추천.

Expected: at minimum 1 placeholder card (gray dashed) — exact count depends on how many keyword candidates the noise NL matches. Cards still total 6.

- [ ] **Step 6: Backend API key missing path (skip if key configured)**

If no API key is set for the current user, NL returns keyword-only results. Expected: 3~6 existing cards (no synthesized) + placeholders filling the rest. Panel doesn't crash.

- [ ] **Step 7: Network sanity check**

In DevTools Network tab during a successful synthesis:
1. Find `recommend-mockups` POST → Response payload structure matches spec §4.1: `{ items: [...≤4], synthesized: [...≤2], mode: "ai" }`.
2. Each `synthesized[i].layers[j]` has all required keys (key/title/type/subtype/position/sourceMockupCode).
3. Find `prefill-from-synthesized` POST (after clicking a synthesized card) → Response has `{ spec: { meta, filterBar }, mode }`.

- [ ] **Step 8: Commit the verification (no code; tag with empty commit)**

```bash
git commit --allow-empty -m "chore(composer): verify AI mockup synthesis end-to-end

Manual smoke test passed:
- 2x3 grid renders (4 existing + 2 synthesized)
- Synthesized cards show wireframe + source-mockup chips
- Wizard receives spec with per-layer source context
- Network responses match spec §4.1
- Placeholder fallback works for noise NL

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Self-Review Checklist (for the engineer before reporting done)

1. All commits land on `main` (or the working branch). No uncommitted changes.
2. `docker compose ps` shows all containers Up. No restart loops.
3. The 4 frontend files and 4 backend files listed in the File Plan all exist / are modified.
4. Synthesis happy-path manual test (Task 13 §2) produces 4+2 cards.
5. No console errors in the browser DevTools when interacting with the panel.
6. Backend log shows no stack traces around `recommend-mockups` or `prefill-from-synthesized`.

If any check fails, fix and re-commit before declaring done.

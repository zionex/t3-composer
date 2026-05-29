# Composer AI 추천 — Mockup 재조합(Synthesis) 추가

날짜: 2026-05-29
관련 spec: `2026-05-28-composer-ai-recommend-start-design.md`
대상 파일 기준 경로: `frontend/src/view/util/t3composer/` · `backend/src/main/java/com/zionex/t3composer/domain/`

## 1. 배경 · 동기

현재 AI 추천 진입 화면([AiRecommendPanel.jsx](frontend/src/view/util/t3composer/AiRecommendPanel.jsx))은 자연어 입력에 대해 **기존 mockup 카탈로그(`MOCKUP_ENTRIES`) 안에서만** Top-3 를 골라 보여준다. 백엔드 [RecommendMockupService.java](backend/src/main/java/com/zionex/t3composer/domain/service/RecommendMockupService.java) 의 system prompt 규칙 2 가 이를 명시적으로 강제한다:

> "Include only candidates from the provided list — do NOT invent new patternCode values."

→ 사용자 요구가 한 mockup 으로 충족되지 않을 때(예: "월별 입력 + KPI + 트렌드 차트") 가까운 mockup 한 개로 타협하게 된다.

본 작업은 **기존 추천을 유지한 채**, AI 가 여러 mockup 의 layer 를 조합해 만든 **재조합(synthesized) mockup 1건** 을 Top-3 카드의 마지막 자리에 같이 보여준다.

## 2. Scope

### In scope

- `recommend-mockups` endpoint 의 응답 스키마 확장 — `synthesized` 필드 추가
- AI 가 후보 mockup 의 `layers` 정보를 받아 재조합 mockup 1건 제안
- 프런트 결과 카드 = **기존 mockup 2 + 재조합 1 고정 mix**
- 재조합 mockup 의 미리보기 = **12컬럼 wireframe + 각 layer 박스 + 출처 mockup 라벨 칩**
- 사용자가 재조합본 선택 시: 새 endpoint `prefill-from-synthesized` 호출 → spec 의 layer 별 `naturalText` 에 **각 layer 의 출처 mockup 컨텍스트** 주입
- 합성 실패 시 graceful fallback (재조합 칸 placeholder)

### Out of scope

- 사용자가 layer 단위로 출처 mockup 을 수정하는 편집기 UI
- 재조합본을 mockup 갤러리(`MOCKUP_ENTRIES`)에 영구 저장하는 기능
- 위젯(KPI 카드·차트 종류) 단위까지 분해해 조합하는 fine-grained synthesis — layer 단위만
- D&D 로 layer 위치 조정 (Wizard Step1 에서 이미 가능)
- 추천 모드(existing 우선 / synthesis 우선) 토글 UI

## 3. 사용자 흐름

```
[AI 추천 진입]
   └─ NL 입력: "수요계획 입력 + 실적 비교 KPI 같이 보여줘"
   └─ [추천 템플릿 찾기] 클릭
        ↓ recommend-mockups (1회 LLM)
        ↓ 응답: { items:[existing×2], synthesized:{...} }
   ┌──────────────┬──────────────┬──────────────┐
   │ 기존 mockup A │ 기존 mockup B │ 🪄 AI 재조합 │  ← 카드 3열 (purple accent)
   │ (Top 관련도)  │              │              │
   └──────────────┴──────────────┴──────────────┘
        ↓ 사용자 카드 클릭
        ├─ existing → prefillFromMockup(기존)
        └─ synthesized → prefillFromSynthesized(신규)
              ↓ specFromSynthesized(synth, baseMeta)
              ↓ + AI prefill 병합
   [Wizard Step1 진입]
```

## 4. Architecture

### 4.1 백엔드 — 단일 endpoint 확장 (Approach A)

`RecommendMockupService.recommend()` 가 한 번의 Claude 호출로 **재랭킹 + 재조합** 양쪽 결과를 반환한다.

**왜 단일 호출인가**: ① system prompt 의 cache_control (ephemeral) 가 한 번에 적중 — 토큰 비용 최소. ② 후보 mockup 의 layer 풀(=재조합 재료) 정보를 한 프롬프트 컨텍스트에서 동시 활용 → 모델이 "어느 후보를 재료로 쓸지" 와 "그것을 어떻게 조합할지" 를 동시에 판단. ③ 백엔드 코드 단순 — 서비스 1개만 확장.

#### Request DTO 변경 ([RecommendMockupRequest.java](backend/src/main/java/com/zionex/t3composer/domain/dto/RecommendMockupRequest.java))

기존:
```java
String nl;
List<Map<String,Object>> candidates;
```

추가:
```java
Boolean synthesize;   // null/true = 재조합 시도, false = 기존 동작 유지 (롤백/A-B 테스트용)
```

#### Frontend candidates payload 확장 ([mockupRecommend.js](frontend/src/view/util/t3composer/mockupRecommend.js))

`buildMockupCandidates` 가 각 후보에 `layers` 정보를 추가:

```js
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
```

토큰 영향: layer 정보가 후보 하나당 평균 4~6 줄 추가 → top-12 후보 기준 약 +600 토큰 예상. system prompt 캐시는 그대로 유지(사용자 입력만 변함).

#### System prompt 변경 ([RecommendMockupService.java](backend/src/main/java/com/zionex/t3composer/domain/service/RecommendMockupService.java) `buildSystemPrompt`)

기존 규칙 1~5 유지하고 아래 규칙 추가:

```
6. Additionally, propose ONE synthesized mockup if combining layers from multiple candidates
   would serve the user's request better than any single candidate.
   - Output it in the top-level "synthesized" field (or set "synthesized": null if not beneficial).
   - synthesized.layers[].sourceMockupCode MUST reference a patternCode from the candidates list.
   - synthesized.layers[].position.{x,y,w,h} use a 12-column grid (x+w <= 12). Reasonable h is 2~8.
   - Cover the canvas — layers should not overlap and should fill the grid coherently.
   - reason (Korean, max 60 chars) explains why combination beats single-mockup choice.

Output format:
{
  "items": [{"patternCode": "...", "relevance": 94, "reason": "..."}, ...],
  "synthesized": {
    "label": "수요계획 입력 + 실적비교 대시보드",
    "description": "월별 입력 그리드 위에 전년 대비 KPI 와 실적 추이 차트",
    "reason": "단일 mockup 으로 입력+분석을 동시에 충족하는 것이 없음",
    "layers": [
      {"key": "kpiRow", "title": "전년 대비 KPI", "type": "CHART", "subtype": "kpi",
       "position": {"x": 0, "y": 0, "w": 12, "h": 2}, "sourceMockupCode": "dash_kpi_sales"},
      {"key": "inputGrid", "title": "월별 계획 입력", "type": "GRID", "subtype": "editable",
       "position": {"x": 0, "y": 2, "w": 8, "h": 6}, "sourceMockupCode": "grid_monthly_plan"},
      {"key": "trendChart", "title": "실적 추이", "type": "CHART", "subtype": "line",
       "position": {"x": 8, "y": 2, "w": 4, "h": 6}, "sourceMockupCode": "dash_trend"}
    ]
  } | null
}
```

#### Parser/validator 확장 ([RecommendMockupService.java](backend/src/main/java/com/zionex/t3composer/domain/service/RecommendMockupService.java) `parseItems` 확장)

새 메서드 `parseSynthesized(rawJson, validCodes)`:

1. JSON 의 `synthesized` 키 추출 — null 이면 그대로 null 반환
2. `layers` 가 비어있거나 배열 아니면 null 반환
3. 각 layer 검증:
   - `sourceMockupCode` 가 `validCodes` 셋(후보 patternCode) 에 있는지
   - `type` ∈ `{CHART, GRID, FORM, OTHER}` (mockup layer convention 과 일치 — 단, 이번 PR 에서는 검증만, 변환 없음)
   - `position.x + position.w <= 12`, `position.x >= 0`, `position.w >= 1`
   - `position.y >= 0`, `position.h >= 1`
4. 검증 실패 layer 가 1개라도 있으면 전체 synthesized = null (보수적). 로그 warn.
5. 검증 통과 시 `Map<String,Object>` 로 캡슐화해 결과의 `synthesized` 키에 넣어 반환.

`recommend()` 응답 구조 (변경 후):
```java
result.put("items", items);
result.put("synthesized", synthesized);   // 신규 — Map<String,Object> or null
result.put("mode", "ai");
result.put("model", ...);
```

#### `fallback()` 변경

`synthesized: null` 추가. 외부적으로 응답 스키마 일관성 유지.

### 4.2 백엔드 — 신규 endpoint `prefill-from-synthesized`

기존 `PrefillFromMockupService` 와 거의 동일한 패턴. 차이는 단일 mockup 메타 대신 **재조합 메타 + layer 별 출처 mockup 컨텍스트** 를 system prompt 에 주입.

#### Controller 추가 ([ComposerController.java](backend/src/main/java/com/zionex/t3composer/domain/controller/ComposerController.java))

```java
@PostMapping("/composer/prefill-from-synthesized")
public Map<String,Object> prefillFromSynthesized(
    @AuthenticationPrincipal ...,
    @RequestBody PrefillFromSynthesizedRequest req
) {
    return prefillFromSynthesizedService.prefill(userId, req);
}
```

#### Request DTO ([PrefillFromSynthesizedRequest.java](backend/src/main/java/com/zionex/t3composer/domain/dto/PrefillFromSynthesizedRequest.java) — 신규)

```java
String nl;
SynthesizedMockup synthesized;   // recommend 응답의 synthesized 그대로 echo
String moduleCode;
String targetCd;
```

`SynthesizedMockup` 은 별도 DTO 또는 `Map<String,Object>` (다른 DTO 의 관례에 맞춤). `recommend` 응답의 `synthesized` 객체와 동일한 shape.

#### Service ([PrefillFromSynthesizedService.java](backend/src/main/java/com/zionex/t3composer/domain/service/PrefillFromSynthesizedService.java) — 신규)

기존 `PrefillFromMockupService` 의 시스템 프롬프트를 base 로 하고 한 줄 추가:

> "This screen is a synthesized layout combining layers from multiple existing mockups. Treat synthesized.layers[].sourceMockupCode as the design intent reference for each layer."

호출 시:
- system prompt: cache_control ephemeral (동일 사용자 후속 호출 캐시 적중)
- user prompt: `nl`, `synthesized` JSON, `moduleCode`, `targetCd` 직렬화
- 응답 파싱: 기존 `prefill-from-mockup` 과 동일 — `{ spec: { meta, filterBar } }` 반환

토큰 절약: synthesized 의 layers 정보(이미 백엔드가 가지고 있는 데이터)만 전송. 출처 mockup 의 전체 컨텍스트(component HTML 등) 는 보내지 않음.

### 4.3 프런트 — 결과 카드 & 합성 mockup 미리보기

#### `AiRecommendPanel.jsx` 변경

**상태 구조 변경**:

기존 `results: [{ entry, relevance, reason }]` 를 다음으로 교체:

```js
results: Array<
  | { kind: 'existing', entry: MockupEntry, relevance: number, reason: string }
  | { kind: 'synthesized', synth: SynthesizedMockup }
  | { kind: 'placeholder', message: string }
>
```

**onSearch 의 응답 처리**:

```js
const items = (data.items || [])
  .map((it) => ({
    kind: 'existing',
    entry: codeToEntry.get(it.patternCode),
    relevance: it.relevance,
    reason: it.reason,
  }))
  .filter((x) => x.entry)
  .slice(0, 2);

const synthCard = data.synthesized
  ? { kind: 'synthesized', synth: data.synthesized }
  : { kind: 'placeholder', message: 'AI 가 적절한 재조합을 만들지 못했습니다 — 위 두 템플릿 중 선택하세요' };

setResults([...items, synthCard]);
```

존재 수 부족 시 (existing 이 1개 이하) — 남는 자리에 추가 placeholder. UI 는 항상 3열 유지.

**onPick 분기**:

```js
const onPick = async (item) => {
  if (item.kind === 'placeholder' || prefilling) return;
  setPrefilling(true);
  try {
    if (item.kind === 'existing') {
      // 기존 로직 그대로
      const base = specFromMockup(item.entry, { title: item.entry.patternLabel || '새 화면' });
      const res = await prefillFromMockup({...});
      onStart(mergeAiPrefillIntoSpec(base, res?.data?.spec));
    } else if (item.kind === 'synthesized') {
      const base = specFromSynthesized(item.synth, { title: item.synth.label || '새 화면' });
      const res = await prefillFromSynthesized({
        nl, synthesized: item.synth, moduleCode: '', targetCd,
      });
      onStart(mergeAiPrefillIntoSpec(base, res?.data?.spec));
    }
  } catch {
    // 기존 폴백 패턴 — base 만 사용
    if (item.kind === 'existing') {
      onStart(specFromMockup(item.entry, { title: item.entry.patternLabel || '새 화면' }));
    } else {
      onStart(specFromSynthesized(item.synth, { title: item.synth.label || '새 화면' }));
    }
  } finally {
    setPrefilling(false);
  }
};
```

**카드 렌더링**:

`existing` 카드는 기존 코드 그대로(amber accent 유지 — Top 카드만 강조).

`synthesized` 카드는 별도 컴포넌트로 분리해 가독성 확보:

```jsx
<SynthesizedCard
  synth={item.synth}
  onPick={() => onPick(item)}
  disabled={prefilling}
/>
```

내부 구조:
- accent 색 = purple `#8b5cf6` (existing 의 amber 와 시각 대비 → "AI 차별화" 신호)
- 상단 `Chip label="🪄 AI 재조합"` (purple background)
- 썸네일 자리에 `<SynthesizedMockupPreview layers={synth.layers} />` (자세히는 4.4)
- 본문 = `synth.label` (강조) · `synth.description` · `synth.reason` (italic)
- 출처 mockup 칩 row: `synth.layers` 의 `sourceMockupCode` 셋(중복 제거) → 각 mockup 의 `patternLabel` 칩
- [이 재조합으로 시작 →] 버튼 (purple solid)

`placeholder` 카드는 회색 점선 보더 + 중앙에 message 텍스트만. 클릭 불가.

#### 신규: `SynthesizedMockupPreview.jsx` (~80줄)

12컬럼 wireframe 렌더러. `layers` prop 받아서 각 layer 를 절대 좌표 박스로 그림.

```jsx
const TYPE_COLOR = {
  KPI:   '#dbeafe',  // sky-100
  CHART: '#fef3c7',  // amber-100
  GRID:  '#d1fae5',  // green-100
  FORM:  '#ede9fe',  // purple-100
  OTHER: '#f1f5f9',  // slate-100
};
const TYPE_BORDER = {
  KPI:   '#60a5fa',
  CHART: '#f59e0b',
  GRID:  '#10b981',
  FORM:  '#8b5cf6',
  OTHER: '#94a3b8',
};

function SynthesizedMockupPreview({ layers }) {
  const codeToEntry = useMemo(() => {
    const m = new Map();
    for (const e of MOCKUP_ENTRIES) m.set(e.patternCode, e);
    return m;
  }, []);
  // 12-col grid, layers 의 max y+h 가 row 수
  const rows = Math.max(8, ...layers.map((l) => l.position.y + l.position.h));
  const cellW = 100 / 12;     // %
  const cellH = 100 / rows;   // %
  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%',
               bgcolor: '#fafafa', overflow: 'hidden',
               backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
               backgroundSize: `${cellW}% ${cellH}%` }}>
      {layers.map((l, i) => {
        const src = codeToEntry.get(l.sourceMockupCode);
        const bg = TYPE_COLOR[l.type] || TYPE_COLOR.OTHER;
        const bd = TYPE_BORDER[l.type] || TYPE_BORDER.OTHER;
        return (
          <Box key={l.key || i}
               sx={{ position: 'absolute',
                     left: `${l.position.x * cellW}%`,
                     top:  `${l.position.y * cellH}%`,
                     width: `${l.position.w * cellW}%`,
                     height: `${l.position.h * cellH}%`,
                     bgcolor: bg, border: `1.5px dashed ${bd}`,
                     p: 0.5, display: 'flex', flexDirection: 'column',
                     justifyContent: 'space-between', overflow: 'hidden' }}>
            <Stack direction="row" spacing={0.4} alignItems="center">
              <Chip size="small" label={l.type}
                    sx={{ height: 14, fontSize: 8, fontWeight: 700, bgcolor: bd, color: '#fff' }} />
              <Typography sx={{ fontSize: 9, fontWeight: 700, color: '#334155', lineHeight: 1.1 }}>
                {l.title}
              </Typography>
            </Stack>
            {src && (
              <Typography sx={{ fontSize: 7.5, color: '#64748b', fontStyle: 'italic' }}>
                from: {src.patternLabel || l.sourceMockupCode}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
```

조건: 부모(`AiRecommendPanel` 의 카드 썸네일 자리) 가 고정 height 290px 를 제공 — 그대로 채움. 폭은 카드 폭(약 320px). aspect 비율은 자연스럽게 부모를 따라가도록 % 단위로만 좌표 계산.

### 4.4 프런트 — Wizard 진입 spec 만들기

#### 신규: `specFromSynthesized(synth, baseMeta)` ([wizardState.js](frontend/src/view/util/t3composer/wizardState.js))

기존 `specFromMockup` 과 1:1 대응. 차이는:
- `pattern` 값 = `'SYNTHESIZED'` (mockup 한 개를 가리키지 않는다는 신호)
- `layers` = `synth.layers` 그대로 (mockup 의 position·type 보존)
- 각 `layer.dataSource.naturalText` = **layer 별 출처 mockup 컨텍스트**:

```js
function synthesizedContextText(synth, layer, sourceEntry) {
  const lines = [
    `[참조 패턴] ${synth.label} (AI 재조합)`,
    `[조합 의도] ${synth.reason || synth.description || ''}`,
  ];
  if (sourceEntry) {
    lines.push(`[이 layer 의 원본 mockup] ${sourceEntry.patternLabel}`);
    if (sourceEntry.description) lines.push(`[원본 설명] ${sourceEntry.description}`);
  } else if (layer.sourceMockupCode) {
    lines.push(`[이 layer 의 원본 mockup] ${layer.sourceMockupCode}`);
  }
  lines.push(`[이 영역의 역할] ${layer.title}`);
  lines.push('');
  lines.push('이 영역에서 보여줄 데이터를 자유롭게 보완하세요 — 또는 Data Source 탐색에서 Table/SP 를 직접 참조 추가.');
  return lines.join('\n');
}

export function specFromSynthesized(synth, baseMeta = {}) {
  if (!synth || !Array.isArray(synth.layers) || synth.layers.length === 0) {
    return createComposerSpec({ ...baseMeta, pattern: 'BLANK' });
  }
  const codeToEntry = buildCodeToEntryMap();   // 모듈 상수로 1회만 빌드
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

`buildCodeToEntryMap` 는 `MOCKUP_ENTRIES` lookup helper — `wizardState.js` 안에 모듈 스코프 lazy memoize.

#### `mergeAiPrefillIntoSpec` 변경 ([mockupRecommend.js](frontend/src/view/util/t3composer/mockupRecommend.js))

기존 함수가 `meta` 와 `filterBar` 를 base spec 에 병합한다. `prefillFromSynthesized` 의 응답 shape 도 동일 (`{ meta, filterBar }`) 이므로 **변경 없음** — 그대로 재사용.

#### `api.js` 함수 추가

```js
export function prefillFromSynthesized(body) {
  return zAxios.post('/composer/prefill-from-synthesized', body);
}
```

## 5. Data flow / Error handling

### 5.1 정상 흐름

1. NL 입력 → `recommendMockups({ nl, candidates })`
   - 입력: candidates 12개 (layers 정보 포함) + nl
   - 출력: `{ items: [...×2~3], synthesized: {...}|null, mode: 'ai' }`
2. 결과 카드 3열 (existing 2 + synthesized 1)
3. 선택 → 분기:
   - existing → `prefillFromMockup` (기존)
   - synthesized → `prefillFromSynthesized` (신규)
4. `mergeAiPrefillIntoSpec(base, aiSpec)` 로 prefill 병합
5. `onStart(spec)` → Wizard 진입

### 5.2 Error / Edge cases

| 케이스 | 처리 |
|---|---|
| candidates < 3 (재조합 재료 부족) | 백엔드가 system prompt 마지막에 "Skip synthesis if fewer than 3 candidates" 지시. `synthesized: null` 반환 → 프런트 placeholder 카드 |
| AI 가 `synthesized: null` 반환 | placeholder 카드 ("AI 가 적절한 재조합을 만들지 못했습니다") |
| AI 가 invalid layer (sourceMockupCode 환각, position 범위 벗어남) 반환 | `parseSynthesized` 가 검증 실패 → null 처리 + 로그 warn |
| `prefillFromSynthesized` LLM 호출 실패 | catch 블록에서 `specFromSynthesized(synth, baseMeta)` 만으로 Wizard 진입 (prefill 없이) |
| `synth.layers` 0개 | `specFromSynthesized` 가 BLANK spec 으로 폴백 |
| `MOCKUP_ENTRIES` 에 없는 `sourceMockupCode` | preview 카드 출처 칩 미표시, naturalText 도 코드값 그대로 표기 (graceful) |
| recommend-mockups 전체 실패 | 기존 fallback 경로 (`keywordTop` 으로 existing 3건). `synthesized` 무시 |
| Anthropic API key 없음 | `fallback()` — items: [], synthesized: null. 프런트는 keyword 매칭 결과 3건 (기존 그대로) |

### 5.3 Hallucination guards (백엔드)

- `sourceMockupCode` 가 candidates 의 patternCode 셋 외부면 drop → drop 후 layer 부족하면 synthesized 전체 null
- `position.x+w > 12` 또는 음수 → null
- `position` 키 누락 → null
- `type` 이 `{KPI, CHART, GRID, FORM, OTHER}` 외 → null (보수적; 향후 확장 가능)
- 한 layer 라도 검증 실패면 전체 synthesized null — 부분 성공으로 사용자를 혼란시키지 않음

## 6. Testing

### 6.1 백엔드 단위 테스트

`RecommendMockupServiceTest` 에 케이스 추가:

- AI 응답에 valid `synthesized` 포함 → result["synthesized"] 가 비어있지 않은 Map
- `synthesized.layers[].sourceMockupCode` 가 candidates 외부 → null 반환
- `position.x+w > 12` → null
- `synthesized: null` 응답 → result["synthesized"] = null
- `synthesized` 키 누락 → result["synthesized"] = null
- `synthesize: false` Request → AI 호출 시 synthesis 규칙 비활성 (system prompt 분기) + 응답 null 그대로

`PrefillFromSynthesizedServiceTest`:

- 정상 응답 파싱 (`{spec:{meta,filterBar}}`)
- LLM 실패 → 빈 spec 반환 (기존 PrefillFromMockupService 패턴과 동일)

### 6.2 프런트 단위 테스트

`mockupRecommend.test.js`:

- `buildMockupCandidates` 가 `layers` 필드를 포함
- `mergeAiPrefillIntoSpec` 가 `specFromSynthesized` 결과(`pattern='SYNTHESIZED'`)에도 정상 병합

`wizardState.test.js`:

- `specFromSynthesized` 가 빈 synth 에 BLANK 반환
- 정상 synth → layers 의 position·type·title 보존
- naturalText 에 출처 mockup 정보 포함 (sourceMockupCode 가 MOCKUP_ENTRIES 에 있을 때 / 없을 때)

### 6.3 통합 시나리오 (수동)

1. `frontend npm run dev` + `backend mvn spring-boot:run` (단독 환경)
2. NL "수요계획 입력 + 실적 대시보드" 입력 → [추천 템플릿 찾기]
3. 카드 3열 확인: existing 2 + synthesized 1 (purple accent + 🪄 칩)
4. SynthesizedMockupPreview 가 12-col wireframe 으로 렌더, layer 박스에 type 칩 + title + "from: ..." 표시
5. 재조합 카드 [이 재조합으로 시작 →] 클릭 → prefilling 표시 → Wizard Step1 진입
6. Wizard Step1 에서 layers 가 synth.layers 와 동일한 position 으로 표시
7. Step3 데이터 단계로 이동 → 각 layer 의 naturalText 에 "[참조 패턴] ... (AI 재조합)" + "[이 layer 의 원본 mockup] ..." 포함 확인
8. AI 가 합성을 거부하는 NL (모호한 입력 "그냥 뭐 좀 만들어줘") → placeholder 카드 표시 확인

## 7. 신규 / 수정 파일 (예상 라인 수)

### 신규

| 파일 | 추정 LoC | 비고 |
|---|---|---|
| `frontend/src/view/util/t3composer/SynthesizedMockupPreview.jsx` | ~80 | 12-col wireframe 렌더러 |
| `backend/.../service/PrefillFromSynthesizedService.java` | ~150 | PrefillFromMockupService 패턴 복제 |
| `backend/.../dto/PrefillFromSynthesizedRequest.java` | ~15 | Lombok @Data |

### 수정

| 파일 | 변경 영역 |
|---|---|
| `frontend/src/view/util/t3composer/AiRecommendPanel.jsx` | results 상태 구조 · onSearch 응답 처리 · onPick 분기 · 카드 렌더 (synthesized/placeholder 분기) |
| `frontend/src/view/util/t3composer/mockupRecommend.js` | `buildMockupCandidates` 에 layers 필드 추가 |
| `frontend/src/view/util/t3composer/wizardState.js` | `specFromSynthesized` + `synthesizedContextText` 추가 (+ MOCKUP_ENTRIES lookup helper) |
| `frontend/src/view/util/t3composer/api.js` | `prefillFromSynthesized` 함수 추가 |
| `backend/.../service/RecommendMockupService.java` | system prompt 규칙 6 추가 · `parseSynthesized` 메서드 · result map 에 synthesized 키 |
| `backend/.../dto/RecommendMockupRequest.java` | `synthesize: Boolean` 필드 추가 |
| `backend/.../controller/ComposerController.java` | `/composer/prefill-from-synthesized` 매핑 |

## 8. Open questions (구현 중 확인)

1. **placeholder 카드의 시각 처리** — 회색 점선 보더만으로 충분한지, 아니면 "기존 추천 더 보기" CTA 를 넣을지. 일단 점선만 — 사용성 피드백 받고 보강.
2. **synth.layers 의 `type` enum 의 권위** — 본 spec 은 `{KPI, CHART, GRID, FORM, OTHER}` 가정. 실제 `MOCKUP_ENTRIES` 의 layer type 분포를 grep 으로 한 번 더 확인하고 prompt 와 validator 동기화.
3. **재조합 카드의 wireframe 줌인** — 기존 existing 카드는 mouseDown 으로 zoom overlay 가 뜨는데, synthesized 도 동일하게 줌인 가능하게 할지. v1 에서는 동일 UX 적용 — overlay 안에서도 `SynthesizedMockupPreview` 를 큰 사이즈로 렌더.

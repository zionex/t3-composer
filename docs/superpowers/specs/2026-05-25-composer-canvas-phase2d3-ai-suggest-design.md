# Composer Canvas Phase 2D-3 — AI 자동 추천 (FilterBar + Layer 관계) Design

**Goal:** ② 데이터·검색조건 단계의 FilterBar / Layer 관계를 사용자가 일일이 입력하는 대신 **Claude 가 현재 spec 을 보고 추천**하는 기능 추가. 미리보기 다이얼로그에서 항목별 체크 → 선택 항목 spec 에 append.

**Architecture:** Backend `POST /composer/spec/auto-suggest` 신규 endpoint. Claude 한 번 호출로 FilterBar fields + Layer relations 둘 다 반환. Frontend 두 패널 (FilterBar/Relations) header 의 `[🪄 AI 추천]` 버튼이 동일 `AutoSuggestDialog` 호출. 사용자가 적용 항목 체크 후 [선택 적용] → 기존 spec 에 append (덮어쓰지 않음).

**Tech Stack:** Spring Boot 3 + Anthropic Claude API. React 18 + MUI 5.

---

## 1. 데이터 흐름

```
사용자: ② 단계 우측 패널의 [🪄 AI 추천] 클릭
   ↓
Frontend: AutoSuggestDialog 열림 → 호출 시작
   POST /composer/spec/auto-suggest  body: { spec }
   ↓
Backend: AutoSuggestService.suggest(spec, userId)
   - layers · dataSource · meta 를 prompt 로 직렬화
   - Claude sonnet 호출 (system: "당신은 검색조건/관계 추천 어시스턴트. JSON 만 반환")
   - 응답 파싱 → { filterFields, relations }
   ↓
Frontend: dialog 에 결과 표시 (loading → 결과)
   - FilterBar 추천 fields 목록 (각각 체크박스 + label/type)
   - Relations 추천 목록 (각각 체크박스 + source→target 요약)
   - [전체 선택] / [전체 해제] 토글
   - [닫기] / [선택 적용]
   ↓
사용자: 체크 후 [선택 적용]
   ↓
Frontend: 선택된 항목만 spec 에 append
   - filterFields: spec.filterBar.items 끝에 push + 모든 layer affects 에 default 등록
   - relations: spec.relations 끝에 push (id 자동 부여)
   - onChange(nextSpec) 호출 → wizard 즉시 반영
   - 다이얼로그 닫기
```

## 2. 데이터 모델

### 2.1 요청 body
```json
{
  "spec": {
    "meta": { "menuCd": "UI_AD_USER", "title": "사용자 관리", "pattern": "P04" },
    "layers": [
      { "key": "masterGrid", "title": "사용자 목록", "type": "GRID",
        "dataSource": { "references": [{"kind":"TABLE","name":"TB_AD_USER"}], "naturalText": "..." } },
      { "key": "detailGrid", "title": "권한 상세",  "type": "GRID",
        "dataSource": { "references": [{"kind":"TABLE","name":"TB_AD_PERMISSION_GROUP"}] } }
    ]
  }
}
```

### 2.2 응답
```json
{
  "filterFields": [
    { "label": "사용자 ID", "type": "TEXT" },
    { "label": "사용여부", "type": "SELECT" },
    { "label": "가입일", "type": "DATE_RANGE" }
  ],
  "relations": [
    {
      "sourceLayerKey": "masterGrid",
      "sourceEvent":    "cellClick",
      "targetLayerKey": "detailGrid",
      "targetAction":   "refetch",
      "mapping": { "userId": "userId" }
    }
  ]
}
```

응답은 JSON only. label/type 은 frontend 의 FILTER_TYPES (TEXT/NUMBER/SELECT/DATE_RANGE/DOMAIN_*) 중 1개. event/action 도 frontend enum 과 일치.

## 3. Backend

### 3.1 AutoSuggestService (신규)

`backend/src/main/java/com/zionex/t3composer/domain/service/AutoSuggestService.java`

```java
@Service
public class AutoSuggestService {
    private final AnthropicClient anthropic;
    private final AnthropicApiKeyService apiKeyService;
    private final ObjectMapper objectMapper;

    public Map<String, Object> suggest(String userId, Map<String, Object> spec) {
        // 1. spec 의 layers/meta → 프롬프트 직렬화
        String userPrompt = buildUserPrompt(spec);

        // 2. system prompt — JSON only 강제
        String systemPrompt = "당신은 신규 화면의 검색조건(FilterBar)과 layer 관계를 추천하는 보조자입니다. "
                            + "주어진 layers / dataSource / meta 를 분석해 화면 사용성에 도움될 항목을 추천하세요. "
                            + "응답은 반드시 다음 JSON 형식만 반환하세요 (설명/markdown 금지):\n"
                            + "{\"filterFields\":[{\"label\":\"...\",\"type\":\"TEXT|NUMBER|SELECT|DATE_RANGE|DOMAIN_PLAN_SCOPE|...\"}], "
                            + "\"relations\":[{\"sourceLayerKey\":\"...\",\"sourceEvent\":\"cellClick|cellDblClick|selectionChange|valueChange|manual\","
                            + "\"targetLayerKey\":\"...\",\"targetAction\":\"refetch|filter|setValue\","
                            + "\"mapping\":{\"sourceField\":\"targetParam\"}}]}";

        // 3. Claude 호출 (sonnet, max_tokens=4000)
        // 4. 응답 본문에서 JSON 추출 → parse → 반환
    }

    private String buildUserPrompt(Map<String, Object> spec) {
        // meta + layers (key/title/type + dataSource refs/naturalText) 를 텍스트 블록으로
    }
}
```

### 3.2 Controller endpoint

`AutoSuggestController.java` (또는 `ComposerController.java` 에 메서드 추가):

```java
@PostMapping("/composer/spec/auto-suggest")
public ResponseEntity<?> autoSuggest(@RequestBody AutoSuggestRequest req) {
    String userId = SecurityUtils.getCurrentUserId();
    Map<String, Object> result = autoSuggestService.suggest(userId, req.getSpec());
    return ResponseEntity.ok(result);
}
```

`AutoSuggestRequest.java` DTO:
```java
public class AutoSuggestRequest {
    private Map<String, Object> spec;  // spec 통째 — 백엔드가 필요 필드 추출
    // getters/setters
}
```

## 4. Frontend

### 4.1 api.js

```js
export const autoSuggestSpec = (spec) =>
  zAxios.post('composer/spec/auto-suggest', { spec }, composerReq());
```

### 4.2 AutoSuggestDialog (신규)

`frontend/src/view/util/t3composer/AutoSuggestDialog.jsx`:

```jsx
function AutoSuggestDialog({ open, onClose, spec, onApply }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [result, setResult]   = useState(null);  // { filterFields, relations }
  const [selectedFields, setSelectedFields]       = useState(new Set());
  const [selectedRelations, setSelectedRelations] = useState(new Set());

  useEffect(() => {
    if (!open) return;
    setLoading(true); setError(null); setResult(null);
    autoSuggestSpec(spec)
      .then((res) => {
        const r = res.data || {};
        setResult({
          filterFields: r.filterFields || [],
          relations:    r.relations    || [],
        });
        setSelectedFields(new Set((r.filterFields || []).map((_, i) => i)));
        setSelectedRelations(new Set((r.relations || []).map((_, i) => i)));
      })
      .catch((e) => setError(e?.response?.data?.message || e?.message || 'AI 호출 실패'))
      .finally(() => setLoading(false));
  }, [open, spec]);

  const handleApply = () => {
    const fields = (result.filterFields || []).filter((_, i) => selectedFields.has(i));
    const rels   = (result.relations    || []).filter((_, i) => selectedRelations.has(i));
    onApply({ filterFields: fields, relations: rels });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>🪄 AI 추천 — 검색조건 + Layer 관계</DialogTitle>
      <DialogContent dividers>
        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        {result && (
          <>
            <Typography variant="caption">FilterBar 추천 ({result.filterFields.length})</Typography>
            <List>
              {result.filterFields.map((f, i) => (
                <ListItem key={i}>
                  <Checkbox checked={selectedFields.has(i)}
                            onChange={...} />
                  <ListItemText primary={f.label} secondary={f.type} />
                </ListItem>
              ))}
            </List>
            <Typography variant="caption">Layer 관계 추천 ({result.relations.length})</Typography>
            <List>
              {result.relations.map((r, i) => (
                <ListItem key={i}>
                  <Checkbox checked={selectedRelations.has(i)}
                            onChange={...} />
                  <ListItemText
                    primary={`${r.sourceLayerKey} (${r.sourceEvent}) → ${r.targetLayerKey} (${r.targetAction})`}
                    secondary={
                      Object.keys(r.mapping || {}).length > 0
                        ? Object.entries(r.mapping).map(([k,v]) => `${k}→${v}`).join(', ')
                        : 'mapping 없음'
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
        <Button variant="contained" onClick={handleApply} disabled={!result}>
          선택 적용
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

### 4.3 패널 통합

`FilterBarInlinePanel.jsx` header 에 `[🪄 AI 추천]` 버튼 추가:
- 클릭 시 `setAutoSuggestOpen(true)` (parent 가 state 관리)
- 또는 dialog 를 자기 자신이 mount

`LayerRelationsPanel.jsx` 도 동일 패턴.

두 패널이 같은 dialog 를 호출하는 게 자연스럽지만 — props drilling 피하려면 **`DataAndFilterStep` 가 dialog 보유**:
- DataAndFilterStep state: `autoSuggestOpen`
- FilterBarInlinePanel · LayerRelationsPanel 에 `onOpenAutoSuggest` prop 전달
- 두 패널의 [🪄 AI 추천] 버튼이 같은 콜백 호출
- AutoSuggestDialog 는 DataAndFilterStep 안에서 1번 mount

### 4.4 적용 로직 (DataAndFilterStep 안)

```js
const handleAutoSuggestApply = ({ filterFields, relations }) => {
  let next = spec;

  // 1. filterFields append
  filterFields.forEach((f) => {
    const newKey = `field_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,5)}`;
    const nextItems = [...(next.filterBar?.items || []), {
      key: newKey, label: f.label, type: f.type,
    }];
    // 모든 layer affects 에 default 등록 (f8d675f 정책 유지)
    const nextAffects = { ...(next.filterBar?.affects || {}) };
    (next.layers || []).forEach((l) => {
      nextAffects[l.key] = [...(nextAffects[l.key] || []), newKey];
    });
    next = { ...next, filterBar: { ...next.filterBar, items: nextItems, affects: nextAffects } };
  });

  // 2. relations append (addRelation helper 사용)
  relations.forEach((r) => {
    next = addRelation(next, {
      source: { layerKey: r.sourceLayerKey, event: r.sourceEvent },
      target: { layerKey: r.targetLayerKey, action: r.targetAction },
      mapping: r.mapping || {},
    });
  });

  onChange(next);
};
```

## 5. UX 정책

- 두 패널 모두 헤더에 [🪄 AI 추천] 버튼 — disabled 조건: layers 0개
- 다이얼로그 열리면 즉시 자동 호출 (사용자가 [추천 받기] 별도 클릭 X)
- 응답 도착 시 모든 항목 default 선택 (체크) — 사용자는 빼고 싶은 것만 해제
- [선택 적용] → append (덮어쓰기 X)
- 적용 후 다이얼로그 닫힘 + Snackbar (선택)

## 6. Claude prompt 설계

### system
```
당신은 화면 생성 도구 (T3Composer) 의 보조자입니다. 사용자가 신규 화면을 만들 때 자주 사용할
"검색조건(FilterBar)" 과 "layer 간 관계(master-detail 등)" 를 추천하세요.

응답은 반드시 다음 JSON 만 반환:
{
  "filterFields": [{"label": "<한국어 라벨>", "type": "<enum>"}, ...],
  "relations":    [{"sourceLayerKey":"<key>","sourceEvent":"<enum>","targetLayerKey":"<key>","targetAction":"<enum>","mapping":{<sourceField>:<targetParam>}}, ...]
}

- filterFields.type enum: TEXT, NUMBER, SELECT, DATE_RANGE,
  DOMAIN_PLAN_SCOPE, DOMAIN_ITEM_MULTI, DOMAIN_ACCOUNT_MULTI,
  DOMAIN_LOCATION_MULTI, DOMAIN_VERSION
- relations.sourceEvent enum: cellClick, cellDblClick, selectionChange, valueChange, manual
- relations.targetAction enum: refetch, filter, setValue
- relations.mapping: source 컬럼 → target param 매핑 (없으면 빈 {})
- 추천 개수는 3~7개 수준 (과다 X). 화면 의도에 명확히 도움될 것만.
- markdown / 설명 / 코드펜스 금지 — JSON 만.
```

### user (예시)
```
[화면 메타]
- title: 사용자 관리
- pattern: P04

[Layers (2)]
1. masterGrid · GRID · 사용자 목록
   참조: TB_AD_USER
   자연어: 사용자 마스터. ID, USERNAME, DISPLAY_NAME, ENABLED 컬럼.

2. detailGrid · GRID · 권한 상세
   참조: TB_AD_PERMISSION_GROUP
   자연어: 선택된 사용자의 그룹 권한 매핑.
```

## 7. Out of scope

- Claude 응답이 잘못된 enum 사용 시 자동 보정 — 단순 무시 (filterField/relation 제외)
- 추천 결과 캐싱 — spec 변경 시 매번 호출 (caching 은 향후)
- 다중 응답 비교 — 한 번 호출 후 사용자 체크
- Streaming 응답 — 작은 결과라 batch 호출

---

## 관련 파일

- `backend/src/main/java/com/zionex/t3composer/domain/service/AutoSuggestService.java` — **신규**
- `backend/src/main/java/com/zionex/t3composer/domain/controller/AutoSuggestController.java` — **신규**
- `backend/src/main/java/com/zionex/t3composer/domain/dto/AutoSuggestRequest.java` — **신규**
- `frontend/src/view/util/t3composer/api.js` — `autoSuggestSpec()` 추가
- `frontend/src/view/util/t3composer/AutoSuggestDialog.jsx` — **신규**
- `frontend/src/view/util/t3composer/DataAndFilterStep.jsx` — dialog 보유 + 적용 로직
- `frontend/src/view/util/t3composer/FilterBarInlinePanel.jsx` — `[🪄 AI 추천]` 버튼 + onOpenAutoSuggest prop
- `frontend/src/view/util/t3composer/LayerRelationsPanel.jsx` — 동일

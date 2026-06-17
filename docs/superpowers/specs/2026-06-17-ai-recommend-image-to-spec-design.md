# AI 추천 — 첨부 이미지를 layout 으로 직접 변환 (Design)

## 배경

방금 추가한 D&D 첨부 기능 (2026-06-17-ai-recommend-file-attachments-design.md)
은 첨부 이미지를 추천·prefill·생성 3단계 모두에 전달한다. 그러나 사용자가 구체적
인 dashboard 설계 이미지를 첨부해도, 추천 카드는 여전히 **카탈로그의 기존 mockup**
6개만 보여준다. 사용자 요구: "추천 템플릿 외에 AI 가 분석해서 그대로 그려줘야 하는
거 아닐까요" — 첨부 이미지의 layout 을 직접 재현하는 옵션이 필요.

## 사용자 흐름

1. AI 추천 진입 → 자연어 입력 + 설계 이미지 첨부
2. "추천 템플릿 찾기" 클릭 → 기존 6개 카드 (existing 4 + synthesized 2) 노출 (변경 없음)
3. **카드 grid 위에 새 별도 영역**: `✨ 내 설계 그대로 만들기` 강조 카드 1개
   (binaryAttachments 중 `image/*` 가 1개 이상 있을 때만 노출)
4. 사용자가 이 카드 클릭 → backend `/composer/spec-from-image` 호출
   (lazy — 카드 클릭 시에만)
5. Claude vision (Sonnet 4.5) 이 이미지를 분석해 ComposerSpec.layers 추론
   (RGL 12-col 좌표, layer type/subtype/title)
6. 받은 spec 으로 ComposerWizard 진입 → 4단계 진행 → GenerateStep 에서 이미지
   재전송 → Claude 가 JSX 생성 시 시각적으로도 정확히 매칭

## 데이터 흐름

```
AiRecommendPanel
  attachments (binary 이미지 1개 이상)
       │
       ├── 기존: recommendMockups + 6 카드 (변경 없음)
       │
       └── NEW: "내 설계 그대로 만들기" 카드 클릭
              ↓
           specFromImage(nl, binaryAttachments[0..])
              ↓
           POST /composer/spec-from-image
              ↓
           SpecFromImageService — Claude vision call
              ↓
           { spec: { meta?, layers: [...], filterBar? }, mode, model }
              ↓
           specFromImageDerived(spec, baseMeta) → ComposerSpec
              ↓
           onStart(spec, attachments) → ComposerWizard
```

## Backend 변경

### 신규 DTO `SpecFromImageRequest.java`
```java
public class SpecFromImageRequest {
    private String nl;                     // 자연어 입력 (optional, 컨텍스트)
    private String moduleCode;             // optional
    private String targetCd;
    private List<Attachment> binaryAttachments;  // 필수 — image/* 1개 이상
}
```

### 신규 service `SpecFromImageService.java`
- `prefill(userId, req)` → `Map<String, Object>` 반환 (기존 prefill service 패턴)
- system prompt: "Look at the attached design image(s). Extract the layout
  (KPI cards, charts, grids, filters) as ComposerSpec.layers JSON with:
  - `key`: unique kebab-case id
  - `type`: 'KPI' | 'CHART' | 'GRID' | 'CONTAINER' | 'FORM'
  - `subtype`: 'donut' | 'line' | 'bar' | 'numeric' | 'detail' 등
  - `title`: 한국어 라벨 (이미지에서 OCR)
  - `position`: { x:0-11, y:0+, w:1-12, h:1+ } — RGL 12-col grid
  Return ONLY valid JSON of shape `{ layers: [...], filterBar?: {...} }`. No markdown."
- temperature 0.0, max_tokens 4096
- 이전 service 들과 동일한 multimodal content blocks 패턴 (MultimodalContentBuilder)
- Vision 결과 parse 실패 시 fallback (`{ mode: 'fallback', spec: { layers: [] } }`)

### Controller endpoint
`POST /composer/spec-from-image` → SpecFromImageService.prefill 위임

## Frontend 변경

### `api.js` — 신규 함수
```js
export const specFromImage = ({ nl, moduleCode, targetCd, binaryAttachments }) =>
  zAxios.post('composer/spec-from-image',
    { nl, moduleCode, targetCd, binaryAttachments }, composerReq());
```

### `wizardState.js` — 신규 헬퍼
```js
export function specFromImageDerived(aiSpec, baseMeta) {
  // aiSpec.layers → ComposerSpec.layers 정규화 (key 보장, position fill)
  // meta 는 baseMeta 우선, filterBar 도 aiSpec.filterBar 가 있으면 채움
}
```

### `AiRecommendPanel.jsx`
- attachments 중 binary image 만 추출하는 헬퍼: `getImageAttachments(atts)`
- 결과 영역 (results) 상단에 image 가 1개 이상 있을 때 새 카드 1개 렌더:
  ```jsx
  {results && hasImage && (
    <Box sx={{ border: '2px solid', borderColor: HERO_ACCENT, borderRadius: 2, p: 1.5,
                mb: 1.2, bgcolor: HERO_BG, cursor: 'pointer', ... }}
         onClick={onPickImageDerived}>
      <Stack direction="row" spacing={1.5}>
        <PhotoFilterIcon sx={{ fontSize: 36, color: HERO_ACCENT }} />
        <Box>
          <Typography sx={{ fontWeight: 800 }}>✨ 내 설계 그대로 만들기</Typography>
          <Typography sx={{ fontSize: 11 }}>
            첨부한 이미지의 layout (KPI/차트/그리드/필터 위치) 을 Claude vision 이 분석해서 동일하게 재현
          </Typography>
        </Box>
        {/* "분석 중…" 진행 indicator */}
      </Stack>
    </Box>
  )}
  ```
- `onPickImageDerived` 핸들러:
  1. `specFromImage({ nl, binaryAttachments: imageAtts })` 호출 (lazy)
  2. 응답 spec → `specFromImageDerived(aiSpec, { title: nl.slice(0,40) || '내 설계', menuCd: '' })`
  3. `onStart(spec, attachments)` 호출
  4. 진행 중 `fillingIdx === 'image-derived'` 로 disable

## YAGNI

- 이미지 여러 장의 합성 추론 (다중 page 설계서) — 일단 첫 이미지만 분석. 향후 확장.
- 추론된 spec preview (썸네일) — 첫 버전은 즉시 Wizard 진입. 다음 iteration 에서.
- 추론 결과 cache — 같은 이미지 재첨부 시 재호출. 일단 그대로.

## 검증

1. Backend mvn compile 성공
2. Frontend webpack build 성공
3. 수동: 위 dashboard 이미지 (4 KPI + 2 donut + 1 line chart) 첨부 → "내 설계 그대로
   만들기" 클릭 → ComposerWizard 의 Layout step 에서 KPI 4개 (top row, w=3 each),
   chart 2개 + line 1개 (next row) 가 비슷한 위치에 layer 로 노출되는지 확인
4. 이미지 없으면 카드 미노출 (회귀 없음)

# AI 추천 흐름 — 참조 파일 첨부 (Design)

## 배경

`ModeNewGeneral` (자연어 생성) 에는 하단에 D&D 참조 파일 첨부 영역이 있어
SQL · 설계서 이미지 · 캡처 등을 최대 5개 (파일당 5MB) 첨부할 수 있다. 텍스트는
prompt 본문에 inline, 바이너리 (이미지/PDF) 는 Anthropic multimodal content blocks
로 변환되어 Claude 가 화면 생성 시 참조한다.

`AiRecommendPanel` (AI 추천으로 화면 시작) 에는 같은 기능이 없어, 말로 설명하기
어려운 설계서 이미지를 기반으로 AI 가 화면을 만들어주는 시나리오를 지원하지
못한다. 본 설계는 `AiRecommendPanel` 에 첨부 UI 를 추가하고, 첨부 파일이 흐름의
**모든 AI 호출 단계** (추천 · prefill · 최종 화면 생성) 에서 활용되도록 한다.

## 사용자 흐름

1. AI 추천 진입 → "무엇을 만들까요?" TextField 아래 새 D&D 영역 보임
2. 사용자가 설계서 이미지·SQL 파일을 끌어다 놓음 → chip 누적 표시 (최대 5개)
3. "추천 템플릿 찾기" 클릭 → `recommendMockups` 호출 시 첨부 동봉
   → AI 가 이미지 보고 더 정확한 mockup 6개 추천
4. 사용자가 추천 카드 1개 픽 → `prefillFromMockup` 또는 `prefillFromSynthesized`
   호출 시 첨부 동봉 → AI 가 spec.meta · filterBar 추정 시 이미지 참조
5. `onStart(spec, attachments)` → ComposerWizard → GenerateStep → ComposerWorkspace
   → Claude 가 JSX/SP/Java 작성 시 설계서 이미지 참조

## 데이터 흐름

```
[AiRecommendPanel]
  attachments: [{ kind:'text', name, lang, text, sizeKb }   // 텍스트 = inline
                 | { kind:'binary', name, mediaType, base64, sizeKb }]  // 이미지/PDF
       │
       ├── recommendMockups({ nl, candidates, textAttachments, binaryAttachments })
       ├── prefillFromMockup({ ..., textAttachments, binaryAttachments })
       └── prefillFromSynthesized({ ..., textAttachments, binaryAttachments })
       │
       └── onStart(spec, attachments)
              │
       [ModeNewStep] attachments state
              │
       [ComposerWizard] initialAttachments prop → GenerateStep 으로 패스스루
              │
       [GenerateStep]
         text  → specToInitialPrompt(spec) 결과 앞에 inline prepend
         binary → ComposerWorkspace.initialAttachments
```

## Frontend 변경 (5 파일)

### `AiRecommendPanel.jsx`
- D&D state: `attachments`, `dragOver`, `fileInputRef`
- 파일 처리 헬퍼: `TEXT_EXTS`, `isTextFile`, `readAsText`, `readAsBase64`,
  `handleFilesPicked`, `handleDrop`, `handleDragOver`, `handleDragLeave`,
  `removeAttachment` (ModeNewGeneral §407-489 와 동일 패턴 인라인 복제)
- UI: 좌측 입력 패널의 TextField 아래 D&D Paper 영역 추가 — ModeNewGeneral
  §1070-1137 와 같은 룩 (CloudUploadIcon · "참조 파일 첨부" 라벨 · 첨부 chip 행)
- API 호출 시 `{ textAttachments, binaryAttachments }` 동봉. 헬퍼 분리:
  ```js
  const buildAttachPayload = (atts) => ({
    textAttachments:   atts.filter(a => a.kind === 'text')
                          .map(({ name, lang, text, sizeKb }) => ({ name, lang, text, sizeKb })),
    binaryAttachments: atts.filter(a => a.kind === 'binary')
                          .map(({ name, mediaType, base64 }) => ({ name, mediaType, base64 })),
  });
  ```
- `onStart` 시그니처: 기존 `onStart(spec)` → `onStart(spec, attachments)`

### `ModeNewStep.jsx`
- `attachments` state 추가. `<AiRecommendPanel onStart={(s, atts) => {
  setSpec(s); setAttachments(atts); setStage('WIZARD'); }} />`
- `<ComposerWizard initialAttachments={attachments} ... />`

### `ComposerWizard.jsx`
- `initialAttachments` prop 추가 (default `[]`). GenerateStep 으로 패스스루.
  다른 step (LayoutStep/DataAndFilterStep/MetaStep) 은 첨부 미사용.

### `GenerateStep.jsx`
- `initialAttachments` prop 받음.
- 텍스트 첨부 inline (ModeNewGeneral §698-710 패턴):
  ```js
  const textAttachs   = (initialAttachments || []).filter(a => a?.kind === 'text');
  const binaryAttachs = (initialAttachments || []).filter(a => a?.kind === 'binary');
  let textInline = '';
  const ATTACH_INLINE_CAP = 12000;
  for (const t of textAttachs) {
    const body = (t.text || '').length > ATTACH_INLINE_CAP
      ? t.text.slice(0, ATTACH_INLINE_CAP) + `\n... (이하 생략 — 전체 ${t.text.length}자)`
      : (t.text || '');
    textInline += `\n\n=== 첨부 파일: ${t.name} ===\n\`\`\`${t.lang || ''}\n${body}\n\`\`\`\n`;
  }
  setInitialPrompt(promptText + textInline);
  ```
- `<ComposerWorkspace initialAttachments={binaryAttachs} ... />`

### `api.js`
- 3개 API 함수에 파라미터 추가:
  ```js
  recommendMockups({ nl, candidates, textAttachments, binaryAttachments })
  prefillFromMockup({ nl, mockupPatternCode, mockupMeta, moduleCode, targetCd,
                       textAttachments, binaryAttachments })
  prefillFromSynthesized({ nl, synthesized, moduleCode, targetCd,
                            textAttachments, binaryAttachments })
  ```

## Backend 변경 (3 DTO + 1 신규 DTO + 3 Service + 1 신규 util)

### 신규 `TextAttachmentDto.java`
```java
@Data
public class TextAttachmentDto {
    private String name;
    private String lang;
    private String text;
    private Integer sizeKb;
}
```

### 3개 Request DTO — 동일 패턴 필드 추가
```java
private List<TextAttachmentDto> textAttachments;
private List<Attachment> binaryAttachments;
```
적용 대상:
- `RecommendMockupRequest.java`
- `PrefillFromMockupRequest.java`
- `PrefillFromSynthesizedRequest.java`

### 신규 util `MultimodalContentBuilder.java`
`ComposerService.buildMultimodalContent` 의 private 로직을 public static 으로 추출.
3개 service + ComposerService 가 같이 사용 (DRY).

```java
public final class MultimodalContentBuilder {
    private MultimodalContentBuilder() {}

    /** 텍스트 + binary 첨부 → Anthropic content blocks. binary 없으면 text 만 1개 block. */
    public static List<Object> build(String text, List<Attachment> attachments) {
        // ComposerService 의 기존 로직 그대로 이전
    }

    private static String inferBlockType(String mediaType) {
        // image/* → "image", application/pdf → "document", else → "document"
    }
}
```
ComposerService 는 이 util 을 호출하도록 리팩터.

### 3개 Service — 동일 패턴 적용

각 service 의 `buildUserPrompt(req)` 끝에 텍스트 첨부 inline:
```java
String userPrompt = baseUserPrompt;
if (req.getTextAttachments() != null) {
    StringBuilder sb = new StringBuilder(userPrompt);
    int CAP = 12000;
    for (TextAttachmentDto t : req.getTextAttachments()) {
        String body = t.getText() == null ? "" : t.getText();
        if (body.length() > CAP) body = body.substring(0, CAP) + "\n... (이하 생략)";
        sb.append("\n\n=== 첨부 파일: ").append(t.getName()).append(" ===\n```")
          .append(t.getLang() == null ? "" : t.getLang()).append('\n')
          .append(body).append("\n```\n");
    }
    userPrompt = sb.toString();
}
```

binary 가 있으면 user `Message.content(Object)` 에 multimodal blocks:
```java
List<Attachment> bin = req.getBinaryAttachments();
Object userContent = (bin != null && !bin.isEmpty())
    ? MultimodalContentBuilder.build(userPrompt, bin)
    : userPrompt;
Message userMsg = Message.builder().role("user").content(userContent).build();
```

적용 service:
- `RecommendMockupService.java`
- `PrefillFromMockupService.java`
- `PrefillFromSynthesizedService.java`

## 토큰·성능 영향

- 이미지/PDF 가 추천·prefill·최종 생성 단계마다 재전송. 첨부 5개 × 평균 100KB ×
  3단계 = ~1.5MB 추가 페이로드. Anthropic prompt cache 는 system prompt 만
  캐시하고 user message 끝의 첨부는 매 호출 재인코딩 → 비용 ↑.
- 완화 안 함 — 사용자가 명시적으로 모든 단계 활용을 선택. ComposerWizard 진입
  후 후속 채팅 턴은 ComposerWorkspace 의 기존 cache breakpoint 가 흡수.

## YAGNI (안 하는 것)

- ModeNewGeneral 의 file-handling 코드를 공통 util/hook 으로 추출 — 별도 작업
- 첨부 영구 저장 (composer-db `tb_cmp_artifact_attachment`) — 세션 메모리만
- prefill 결과에 "이미지 근거" 표시 — UI 부담
- recommendMockups 의 candidates pre-score 에 이미지 활용 — frontend keyword
  score 는 그대로, AI 호출에서만 이미지 활용

## 검증 계획

1. Frontend build 성공 (webpack hot-reload)
2. Backend mvn compile 성공
3. 수동 테스트:
   - AI 추천 진입 → 이미지 1개 + .sql 1개 첨부 → 추천 검색 → 6개 카드 노출
   - 카드 픽 → prefill → ComposerWizard 4단계 진행 → 생성
   - 백엔드 로그에서 multimodal content blocks 가 Anthropic 으로 전송됨을 확인
   - 텍스트 첨부 inline 이 user prompt 에 포함됨을 확인
4. 첨부 없이도 기존 흐름 정상 동작 (회귀 없음)

## 관련 룰

- `rules/50-composer-standalone-runtime.md §16` — 토큰 절감 (cache breakpoint)
- `rules/50-composer-standalone-runtime.md §15` — Data Source 선택 (별개 첨부 채널)
- `rules/41d-composer-wizard.md §16.5` — NEW_FROM_COPY 의 AI prefill 패턴 참고

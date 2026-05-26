# ComposerWizard 전 모드 확장 — Design

**날짜**: 2026-05-26
**상태**: APPROVED (brainstorming 단계 완료, 사용자 합의)
**브랜치**: `feature/composer-wizard-rollout`

## 1. 배경

`NEW_STEP` 모드 (단계별 화면 생성) 에 도입된 신개념들 — `ComposerWizard` (4-step) ·
`ComposerCanvas` (시각 캔버스) · `FilterFieldCard` (type 19종 + options source 4종 +
defaultValue) · `LayerRelationsPanel` · `AutoSuggestService` · mockup `entry.layers`
prefill · `DataMiniDialog` — 가 한 모드에서만 동작 중. 나머지 4 모드는 옛
`StepByStepWizard` (9-step) 사용.

design doc `b942aa5` 에서 "9-Step Wizard 폐지" 방향 이미 결정. 본 spec 은 그 실행 계획.

## 2. 목표

1. 4 모드 모두 `ComposerWizard` 로 완전 이전
   — `NEW_FROM_COPY` · `EXISTING_MODIFY` · `NEW_FROM_DESIGN` · `NEW_NL/NEW_GENERAL`
2. 9-step Wizard (`StepByStepWizard` + `Step1Layout` ~ `Step9Generate`) 폐기
3. 각 모드의 진입 UI (메뉴 선택 · 설계서 업로드 · 자연어 입력) 는 그대로 유지 —
   Wizard 만 교체

## 3. Non-goals

- ComposerWizard 자체 기능 추가/변경 (별도 작업)
- 각 모드의 진입 UI 재설계 (현재 그대로)
- 백엔드 prompt builder (`newStepGuide`) 대규모 재작성 — 기존 `StepGuideMode`
  (COPY/DESIGN/PLAIN) 그대로 ComposerWizard 의 `specToInitialPrompt` 에서 활용

## 4. 공통 흐름

```
모드 진입 → 입력 (메뉴 / 설계서 / 자연어 등) → createInitialSpecFromX → spec9
        → convertSpec9ToCanvas → 4-step spec (canvasSpec)
        → <ComposerWizard initialSpec={canvasSpec} mode="<MODE>" targetCd=...>
        → 사용자가 4-step (Layout · Data·Filter · Meta·Menu · Generate) 진행
        → Generate step 의 specToInitialPrompt 가 mode-aware prompt 생성
        → createSession + LLM 호출
```

## 5. 영향 범위

### 변경 파일
- `frontend/src/view/util/t3composer/ModeNewFromCopy.jsx`
- `frontend/src/view/util/t3composer/ModeExistingModify.jsx`
- `frontend/src/view/util/t3composer/ModeNewFromDesign.jsx`
- `frontend/src/view/util/t3composer/ModeNewGeneral.jsx`
- `frontend/src/view/util/t3composer/ComposerWizard.jsx` — mode prop 인식 강화 필요
- `frontend/src/view/util/t3composer/wizardState.js` — `specToInitialPrompt` 에 mode 별
  prepend 가이드 추가 (rules/41d §16.4.1 의 `newStepGuide(COPY|DESIGN)` 와 동등)

### 재사용 (변경 없음)
- `createInitialSpecFromSource(sourceMenu, sourceBundle, ...)` — 9-step spec 생성
- `createInitialSpecFromDesign({ parsed, fileName, layoutSizes, ... })` — 9-step spec 생성
- `convertSpec9ToCanvas(spec9)` — 9-step spec → 4-step canvas spec 변환
- 백엔드 `ComposerPromptBuilder.newStepGuide(StepGuideMode)` — prompt 가이드

### 삭제 (Phase 5)
- `frontend/src/view/util/t3composer/StepByStepWizard.jsx`
- `frontend/src/view/util/t3composer/steps/Step1Layout.jsx` ~ `Step9Generate.jsx` (9 파일)
- `frontend/src/view/util/t3composer/steps/StepNavigation.jsx` 등 보조 파일
- import 끊긴 참조 일괄 정리
- `.claude/rules/41d-composer-wizard.md` — deprecated 마킹 또는 삭제

## 6. Phase 별 작업

각 Phase 는 별도 commit + push. 사용자가 검증한 뒤 다음 Phase 진행.

### Phase 1 — NEW_FROM_COPY (가장 단순)
- `ModeNewFromCopy.jsx` 의 `<StepByStepWizard mode='NEW_FROM_COPY' prefilledSpec={spec9}>`
  → `<ComposerWizard initialSpec={convertSpec9ToCanvas(spec9)} mode='NEW_FROM_COPY' targetCd={targetCd}>`
- `ComposerWizard` mode prop 가 'NEW_FROM_COPY' 일 때 `specToInitialPrompt` 가 COPY 모드용
  prepend 추가 (`newStepGuide(StepGuideMode.COPY)` 의 STEP A~H 복제 절차 그대로 inline 또는
  백엔드 prompt builder 와 동기)
- **검증**: 동일 원본 메뉴 (예: UI_UT_USER_INFO_MGMT) 로 COPY 진입 → 4-step Wizard 흐름 →
  Generate → 산출물이 동일 결과 (원본 import 복제 + 새 menuCd) 확인

### Phase 2 — EXISTING_MODIFY
- `ModeExistingModify.jsx` 동일 패턴 교체
- `importSourceArtifacts` 호출 시점 그대로. spec 안에 sourceBundle 메타 보존
- **검증**: 기존 메뉴 (예: UI_AD_USER) 수정 시나리오 — 4-step Wizard 진입 → 자연어 수정 요청
  → 산출물이 원본 import 기반 수정본 (deltadml 변경) 확인

### Phase 3 — NEW_FROM_DESIGN
- `ModeNewFromDesign.jsx` 동일 패턴 교체
- `parsedDesign` 메타 (layoutSizes, mainLayoutConfig) 가 4-step canvas spec 으로 변환 시
  보존 — `convertSpec9ToCanvas` 가 이미 spec.designDoc / parsedDesign 보존하는지 확인.
  미보존이면 보강.
- **검증**: 샘플 설계서 업로드 → 시트 검토 → 4-step Wizard 진입 → Generate → 산출물이
  설계서 요구사항 (화면 ID, 그리드 컬럼, FilterBar 등) 반영 확인

### Phase 4 — NEW_NL/NEW_GENERAL (가장 복잡)
- `ModeNewGeneral.jsx` 가 두 path 제공:
  - **1-shot 직접 생성** (현재 기본) — 자연어 + 참조 (Mockup/UI Pattern/D&D/DataSource/AI)
    바로 createSession + LLM 호출. **이 path 는 변경 없음**.
  - **단계별 정제 후 생성** — `StepByStepWizard` 호출 부분만 `ComposerWizard` 로 교체
- 자연어 + 참조 5종 입력 UI 자체는 보존
- spec 에 모드 보조 필드 (instruction, mockupRef, uiPatternRef, dataSourceRefs, attachments)
  를 4-step spec 으로 변환 시 보존
- **검증**: Mockup 선택 + 자연어 입력 → 단계별 path → 4-step Wizard → Generate →
  산출물이 mockup 구조 + 자연어 의도 반영 확인

### Phase 5 — 9-step 폐기
- StepByStepWizard.jsx 삭제
- steps/Step1Layout.jsx ~ steps/Step9Generate.jsx 삭제 (9 파일)
- 기타 보조 컴포넌트 (StepDataInspector 등) 삭제 또는 ComposerWizard 에서 재사용 여부 확인
- import 끊긴 참조 grep 으로 일괄 정리
- `.claude/rules/41d-composer-wizard.md` — 폐기 마킹 (역사 참조용 deprecated 또는 삭제)
- webpack build 통과 + 4 모드 sample 검증 통과 확인

## 7. ComposerWizard mode 인식 강화

현재 `ComposerWizard` 는 mode prop 받지만 NEW_STEP 만 가정. 4 모드 추가 지원:

### 7.1 `specToInitialPrompt` 의 mode 별 prepend
- `NEW_FROM_COPY` — STEP A~H 복제 절차 prepend
  (rules/41d §16.4.1 의 `newStepGuide(COPY)` 와 동등)
- `EXISTING_MODIFY` — "기존 메뉴 수정 — 원본 import 보존 + delta 만 변경" 지시
- `NEW_FROM_DESIGN` — STEP A~G 설계서 모드 절차 prepend
  (rules/41d §16.4.1 의 `newStepGuide(DESIGN)` 와 동등)
- `NEW_NL` / `NEW_GENERAL` — 자연어 + 참조 5종 종합 가이드
- `NEW_STEP` (기본) — 현재 그대로

### 7.2 spec 보조 필드 보존
- COPY: `spec.sourceMenu` · `spec.sourceBundle` (`createInitialSpecFromSource` 가 채움)
- DESIGN: `spec.designDoc` · `spec.parsedDesign` · `spec.layoutSizes`
- GENERAL: `spec.instruction` · `spec.mockupRef` · `spec.uiPatternRef` ·
  `spec.dataSourceRefs` · `spec.attachments`
- 4-step canvas spec 도 이 필드들을 보존 (spec.meta 또는 별도 섹션) →
  `specToInitialPrompt` 가 prompt 에 자연어 직렬화

## 8. 위험 / 미정

### 8.1 `convertSpec9ToCanvas` 의 손실 가능성
- 9-step 의 Step6 Cascade · Step8 FilterCascade 데이터가 4-step 의 `LayerRelations`
  (drop·setValue·filter 등) 로 충분히 매핑되는지 검증 필요
- 미매핑 항목 있으면 보강 후 진행

### 8.2 ModeNewGeneral 의 "단계별 path" 실제 사용량
- 현재 사용자가 단계별 path 를 얼마나 활용 중인지 모름
- 이전 후 UX 동선 검증 필요 (1-shot vs 단계별 비율)

### 8.3 백엔드 호환성
- `ComposerService.buildRequest` 가 받는 spec 모델은 그대로 (9-step JSON 그대로 받음
  또는 4-step canvas spec 둘 다 처리)
- `convertSpec9ToCanvas` 가 frontend 만 — 백엔드는 변경 없을 예상
- 만약 Generate 시 백엔드가 9-step JSON 필요하면 4-step → 9-step 역변환 helper 필요
  (별도 작업 — 본 spec 범위 외)

## 9. 검증 전략

각 Phase 별 검증 시나리오:
- 입력 데이터: 표준 메뉴/설계서/자연어 prompt (각 Phase 별 1~2개 케이스)
- 검증 포인트:
  - 4-step Wizard 진입 시 prefilledSpec 보존 (Layout step 의 layers, Data·Filter step
    의 dataSource/filterBar)
  - Generate step 의 prompt 직렬화가 옛 9-step 과 의미적으로 동등 (산출물 동일성)
  - 산출물 화면 실행 시 동작 확인 (사용자 직접)

## 10. 배포

- 각 Phase 완료 → commit + push origin feature/composer-wizard-rollout → main 머지
- main 머지 후 사용자 화면 새로고침 + sample 시나리오 검증
- Phase 5 완료 후 deprecated 룰 정리 + 최종 main 머지

## 11. 일정 추정

| Phase | 작업량 | 검증 |
|---|---|---|
| 1 — COPY | ~30분 (단순 교체) | 5분 |
| 2 — MODIFY | ~30분 | 5분 |
| 3 — DESIGN | ~45분 (parsedDesign 보존 검증) | 10분 |
| 4 — GENERAL | ~1시간 (단계별 path + 참조 5종 보존) | 15분 |
| 5 — 폐기 | ~30분 (파일 삭제 + 참조 정리) | 10분 |
| **합계** | ~3시간 30분 | ~45분 |

# ComposerWizard 전 모드 확장 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 4 모드 (COPY/MODIFY/DESIGN/GENERAL) 의 `StepByStepWizard` (9-step) 호출을 `ComposerWizard` (4-step) 로 교체 + 9-step 자산 폐기.

**Architecture:** 각 모드의 진입 UI 와 prefill 로직 (`createInitialSpecFromSource/Design`) 은 그대로 재사용. `convertSpec9ToCanvas` 로 4-step spec 변환 후 `ComposerWizard` 진입. `specToInitialPrompt` 가 mode 별 prepend 가이드 생성 (rules/41d §16.4.1 의 `newStepGuide` 와 동등).

**Tech Stack:** React (frontend hot reload via webpack-dev-server in docker), 4-step ComposerWizard (이미 NEW_STEP 에서 검증됨), wizardState.js 의 spec 모델 + helper 함수들.

**Spec:** `docs/superpowers/specs/2026-05-26-composer-wizard-rollout-design.md`

**검증 인프라:** 프로젝트에 JSX 단위 테스트 인프라 없음. 검증은 (1) webpack build 통과 (2) 사용자 manual 시나리오 (각 Phase 별 1 시나리오) 로 수행. 각 Phase 의 마지막 step 이 manual 검증 + commit + push.

---

## Phase 0: 사전 점검 (변경 없음, 정보 수집만)

ComposerWizard 와 convertSpec9ToCanvas 의 현재 상태 파악 — 4 모드 이전이 안전한지 사전 검증.

### Task 0.1: ComposerWizard mode prop 처리 현황 확인

**Files:**
- Read: `frontend/src/view/util/t3composer/ComposerWizard.jsx`
- Read: `frontend/src/view/util/t3composer/wizardState.js` (specToInitialPrompt 부분만)

- [ ] **Step 1: ComposerWizard 의 props 시그니처 확인**

```bash
grep -n "function ComposerWizard\|props\.\|initialSpec\|mode" frontend/src/view/util/t3composer/ComposerWizard.jsx | head -20
```

Expected: `initialSpec`, `targetCd`, `onBack` props. mode prop 이 이미 있는지 확인.

- [ ] **Step 2: specToInitialPrompt 가 mode 를 읽는지 확인**

```bash
grep -n "spec\.meta\.\|meta\.mode\|spec\.mode" frontend/src/view/util/t3composer/wizardState.js | head -10
```

Expected: spec.meta.pattern (예: 'MOCKUP_dash_executive') 만 사용 중일 가능성. mode 별 prepend 없음.

- [ ] **Step 3: 결과 메모**

이 단계는 코드 변경 없음. 다음 task 들의 가이드용. Step 2 결과로 다음 두 가지 분기:
- mode prop 이 이미 있음 → 각 Mode jsx 만 교체 (Phase 1~4 의 specToInitialPrompt 보강 skip 가능)
- mode prop 없음 → Phase 1 에서 ComposerWizard + specToInitialPrompt 보강 함께

### Task 0.2: convertSpec9ToCanvas 손실 항목 점검

**Files:**
- Read: `frontend/src/view/util/t3composer/wizardState.js` (convertSpec9ToCanvas 함수)

- [ ] **Step 1: convertSpec9ToCanvas 가 보존하는 필드 확인**

```bash
grep -n "convertSpec9ToCanvas\|step6_cascade\|step8_filterCascade\|spec\.sourceMenu\|spec\.designDoc" frontend/src/view/util/t3composer/wizardState.js | head -20
```

Expected: convertSpec9ToCanvas 본체 line 번호 확인. Step6 (Cascade) · Step8 (FilterCascade) 보존 여부 확인.

- [ ] **Step 2: 손실 항목 정리**

각 Mode 의 prefill 함수가 채우는 spec 필드 (sourceMenu, sourceBundle, designDoc, parsedDesign, layoutSizes, mainLayoutConfig) 가 convert 시점에 누락 없이 4-step spec 의 어디로 가는지 grep 으로 추적.

- [ ] **Step 3: 결과 메모**

미보존 항목 발견 시 Phase 1~4 중 해당 모드 task 에 "보존 보강" step 추가. 발견 없으면 그대로 진행.

---

## Phase 1: NEW_FROM_COPY 이전

### Task 1.1: ComposerWizard 의 mode 인식 보강 (Phase 0 결과 mode 미지원이면)

**Files:**
- Modify: `frontend/src/view/util/t3composer/ComposerWizard.jsx` (props + spec.meta.mode 저장)
- Modify: `frontend/src/view/util/t3composer/wizardState.js` (specToInitialPrompt 의 mode 별 prepend)

- [ ] **Step 1: ComposerWizard 가 mode prop 받으면 spec.meta.mode 에 저장**

ComposerWizard.jsx 의 initialSpec 처리 부분에서:
```jsx
function ComposerWizard({ initialSpec, mode = 'NEW_STEP', targetCd, onBack }) {
  const [spec, setSpec] = useState(() => {
    if (!initialSpec) return null;
    // mode 를 spec.meta 에 보존 → specToInitialPrompt 가 prepend 가이드 결정에 사용
    return {
      ...initialSpec,
      meta: { ...(initialSpec.meta || {}), mode },
    };
  });
  // ... 기존 코드
}
```

- [ ] **Step 2: specToInitialPrompt 에 mode 별 prepend 추가**

wizardState.js 의 `specToInitialPrompt(spec)` 시작 부분:
```js
export function specToInitialPrompt(spec) {
  if (!spec) return '';
  const lines = [];
  const meta = spec.meta || {};
  const mode = meta.mode || 'NEW_STEP';

  // mode 별 prepend — rules/41d §16.4.1 의 newStepGuide(StepGuideMode) 와 동등
  if (mode === 'NEW_FROM_COPY') {
    lines.push('[★ NEW_FROM_COPY — 원본 화면 복제 + 메뉴/import 변경분만 반영]');
    lines.push('1. 원본 import 리스트 그대로 유지 (허구 추가 금지)');
    lines.push('2. gridItems 원본 그대로 (컬럼 추측 추가 금지)');
    lines.push('3. cascade/Pop* 패턴 유지');
    lines.push('4. Entity @Column 1:1 복사');
    lines.push('5. 새 Java 4종 세트 생성 금지 (기존 endpoint 재사용)');
    lines.push('6. 변경: menuCd/menuFilePath/컴포넌트명만, 나머지는 byte 단위 동일');
    lines.push('');
  } else if (mode === 'EXISTING_MODIFY') {
    lines.push('[★ EXISTING_MODIFY — 기존 메뉴 수정 + delta 만 변경]');
    lines.push('1. 원본 import 보존 (변경 안 한 파일은 byte 동일)');
    lines.push('2. 사용자가 명시 요청한 부분만 수정');
    lines.push('3. 같은 filePath 산출 → saveWithSupersede 가 자동으로 이전 버전 DISCARDED');
    lines.push('');
  } else if (mode === 'NEW_FROM_DESIGN') {
    lines.push('[★ NEW_FROM_DESIGN — 설계서 spec 그대로 반영]');
    lines.push('1. 설계서의 화면 ID/명칭/메뉴 위치 그대로');
    lines.push('2. SplitPanel sizes / Tab 매핑 보존');
    lines.push('3. BaseGrid items 컬럼 수·순서 일치');
    lines.push('4. 새 테이블 DDL 생성 금지 (기존 테이블 재사용)');
    lines.push('');
  }
  // NEW_NL / NEW_GENERAL / NEW_STEP 은 기본 prompt 만 (별도 prepend 없음)

  lines.push('[Composer 신규 화면 생성 — 패턴 기반 시각 편집 모델 (NEW_STEP)]');
  // ... 기존 코드 그대로
}
```

- [ ] **Step 3: webpack 빌드 통과 확인**

```bash
sleep 3 && docker compose logs --tail=5 composer-frontend 2>&1 | grep -E "compiled|ERROR" | tail -3
```

Expected: `webpack 5.88.0 compiled with 1 warning`. ERROR 없으면 OK.

- [ ] **Step 4: 변경 commit (Phase 1 중간 commit — Phase 1 마지막 commit 과 함께 push)**

```bash
git add frontend/src/view/util/t3composer/ComposerWizard.jsx frontend/src/view/util/t3composer/wizardState.js
git commit -m "feat(composer): ComposerWizard — mode prop 인식 + specToInitialPrompt mode 별 prepend

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 1.2: ModeNewFromCopy 의 wizard 교체

**Files:**
- Modify: `frontend/src/view/util/t3composer/ModeNewFromCopy.jsx`

- [ ] **Step 1: 현재 StepByStepWizard 호출 위치 확인**

```bash
grep -n "StepByStepWizard\|prefilledSpec\|ComposerWizard\|convertSpec9ToCanvas" frontend/src/view/util/t3composer/ModeNewFromCopy.jsx | head -10
```

Expected: `<StepByStepWizard mode='NEW_FROM_COPY' prefilledSpec={spec9} ...>` 호출 1곳 (jsx return 부분).

- [ ] **Step 2: import 변경**

```jsx
// 제거
import StepByStepWizard from './StepByStepWizard';

// 추가
import ComposerWizard from './ComposerWizard';
import { convertSpec9ToCanvas } from './wizardState';
```

- [ ] **Step 3: wizard 호출 교체**

기존:
```jsx
<StepByStepWizard
  mode='NEW_FROM_COPY'
  prefilledSpec={spec9}
  targetCd={currentTargetCd}
  onBack={...}
/>
```

→ 새:
```jsx
<ComposerWizard
  initialSpec={convertSpec9ToCanvas(spec9)}
  mode='NEW_FROM_COPY'
  targetCd={currentTargetCd}
  onBack={...}
/>
```

- [ ] **Step 4: webpack 빌드 통과 확인**

```bash
sleep 3 && docker compose logs --tail=5 composer-frontend 2>&1 | grep -E "compiled|ERROR" | tail -3
```

Expected: ERROR 없음.

- [ ] **Step 5: manual 검증 시나리오 — 사용자 직접**

사용자가 화면에서:
1. T3Composer 메인 → [기존 화면 복사] 진입
2. 원본 메뉴 선택 (예: UI_UT_USER_INFO_MGMT)
3. 신규 menuCd 입력 (예: UI_UT_USER_INFO_MGMT_TEST)
4. "단계별 Wizard 시작" 클릭 → **4-step ComposerWizard** (Layout/Data·Filter/Meta·Menu/Generate) 진입 확인
5. Layout step 에서 원본 mockup-equivalent 의 layers 가 prefill 되어 있는지 확인
6. Generate step → 화면 생성 → 산출물이 원본 import 복제 + 새 menuCd 반영인지 확인

검증 결과를 사용자에게 보고. 문제 있으면 다음 step 보류, 사용자 피드백 반영.

- [ ] **Step 6: Phase 1 commit + push**

```bash
git add frontend/src/view/util/t3composer/ModeNewFromCopy.jsx
git commit -m "feat(composer): NEW_FROM_COPY — ComposerWizard 로 이전 (9-step 폐기 1/4)

Phase 1 / 5 of ComposerWizard 전 모드 확장
- ModeNewFromCopy 의 StepByStepWizard 호출을 ComposerWizard 로 교체
- prefill: createInitialSpecFromSource 결과를 convertSpec9ToCanvas 로 변환
- mode='NEW_FROM_COPY' prop 으로 specToInitialPrompt 가 COPY 가이드 prepend
- 검증: 원본 메뉴 (UI_UT_USER_INFO_MGMT) 복사 → 4-step Wizard → 산출물 동일 OK

Spec: docs/superpowers/specs/2026-05-26-composer-wizard-rollout-design.md
Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
git push origin feature/composer-wizard-rollout
```

---

## Phase 2: EXISTING_MODIFY 이전

### Task 2.1: ModeExistingModify 의 wizard 교체

**Files:**
- Modify: `frontend/src/view/util/t3composer/ModeExistingModify.jsx`

- [ ] **Step 1: 현재 StepByStepWizard 호출 위치 확인**

```bash
grep -n "StepByStepWizard\|prefilledSpec\|importSourceArtifacts" frontend/src/view/util/t3composer/ModeExistingModify.jsx | head -10
```

Expected: jsx return 부분의 `<StepByStepWizard mode='EXISTING_MODIFY' prefilledSpec={spec9} ...>` 1곳.

- [ ] **Step 2: import 변경 + wizard 교체**

Task 1.2 의 step 2~3 동일 패턴. mode 만 `'EXISTING_MODIFY'` 로.

```jsx
import ComposerWizard from './ComposerWizard';
import { convertSpec9ToCanvas } from './wizardState';

// 교체
<ComposerWizard
  initialSpec={convertSpec9ToCanvas(spec9)}
  mode='EXISTING_MODIFY'
  targetCd={currentTargetCd}
  onBack={...}
/>
```

- [ ] **Step 3: importSourceArtifacts 흐름 보존 확인**

ModeExistingModify 의 `handleStartNl` (또는 유사) 에서 `createSession` 후 `importSourceArtifacts(sid, sourceBundle)` 호출하는지 확인. Wizard 교체와 무관하게 그대로 동작해야 함.

```bash
grep -n "importSourceArtifacts" frontend/src/view/util/t3composer/ModeExistingModify.jsx
```

Expected: `importSourceArtifacts` 호출 1곳. 교체 후에도 동일 위치 유지.

- [ ] **Step 4: webpack 빌드 통과 확인**

Task 1.2 의 step 4 와 동일.

- [ ] **Step 5: manual 검증 시나리오**

사용자가:
1. T3Composer 메인 → [기존 화면 수정] 진입
2. 메뉴 선택 (예: UI_UT_USER_INFO_MGMT)
3. 자연어 수정 요청 입력 (예: "이메일 컬럼을 옆에 표시")
4. "단계별 Wizard 시작" → 4-step ComposerWizard 진입 확인
5. Layout step 에 import 된 원본 layer 구조 prefill 확인
6. Generate → 산출물이 원본 byte 동일 + 사용자 요청 delta 만 반영인지 확인

- [ ] **Step 6: Phase 2 commit + push**

```bash
git add frontend/src/view/util/t3composer/ModeExistingModify.jsx
git commit -m "feat(composer): EXISTING_MODIFY — ComposerWizard 로 이전 (9-step 폐기 2/4)

Phase 2 / 5
- ModeExistingModify 의 StepByStepWizard 호출을 ComposerWizard 로 교체
- importSourceArtifacts 흐름 그대로 유지 (createSession 후 호출)
- mode='EXISTING_MODIFY' prop 으로 specToInitialPrompt 가 MODIFY 가이드 prepend

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
git push origin feature/composer-wizard-rollout
```

---

## Phase 3: NEW_FROM_DESIGN 이전

### Task 3.1: parsedDesign 메타 보존 검증

**Files:**
- Read: `frontend/src/view/util/t3composer/wizardState.js` (createInitialSpecFromDesign + convertSpec9ToCanvas)

- [ ] **Step 1: parsedDesign / layoutSizes / mainLayoutConfig 보존 여부 확인**

```bash
grep -n "parsedDesign\|designDoc\|layoutSizes\|mainLayoutConfig" frontend/src/view/util/t3composer/wizardState.js | head -20
```

Expected: createInitialSpecFromDesign 이 spec.designDoc / parsedDesign / layoutSizes 채움. convertSpec9ToCanvas 가 spec.meta 또는 별도 필드로 보존하는지 확인.

- [ ] **Step 2: 미보존 시 convertSpec9ToCanvas 에 보존 추가**

만약 convertSpec9ToCanvas 가 designDoc 등을 누락한다면 return 부분에 추가:
```js
return {
  meta: {
    ...meta,
    // 모드별 prefill 메타 보존 — Generate step 의 specToInitialPrompt 가 활용
    ...(spec9.designDoc      ? { designDoc:      spec9.designDoc }      : {}),
    ...(spec9.parsedDesign   ? { parsedDesign:   spec9.parsedDesign }   : {}),
    ...(spec9.layoutSizes    ? { layoutSizes:    spec9.layoutSizes }    : {}),
    ...(spec9.mainLayoutConfig ? { mainLayoutConfig: spec9.mainLayoutConfig } : {}),
    ...(spec9.sourceMenu     ? { sourceMenu:     spec9.sourceMenu }     : {}),
    ...(spec9.sourceBundle   ? { sourceBundle:   spec9.sourceBundle }   : {}),
  },
  filterBar: { items, affects },
  layers,
  _originStep9: spec9,
};
```

이 step 은 Step 1 결과 보면서 결정 — 이미 보존되면 skip.

- [ ] **Step 3: specToInitialPrompt 가 보존된 메타를 prompt 에 활용하도록 보강 (선택)**

기존 specToInitialPrompt 가 spec.meta 의 designDoc/sourceBundle 등을 prompt 에 직렬화하는지 확인. 미사용이면 추가:

```js
if (meta.designDoc) {
  lines.push('');
  lines.push(`[설계서 참조] ${meta.designDoc.fileName}`);
  if (meta.designDoc.overview) lines.push(`개요: ${meta.designDoc.overview}`);
  // ... 등
}
if (meta.sourceBundle) {
  lines.push('');
  lines.push('[원본 소스 번들]');
  // formatSourceBundleForPrompt 또는 동등 직렬화
}
```

이는 Phase 0 결과에 따라 선택 — Generate step 의 prompt 가 이미 충분히 풍부하면 skip.

### Task 3.2: ModeNewFromDesign 의 wizard 교체

**Files:**
- Modify: `frontend/src/view/util/t3composer/ModeNewFromDesign.jsx`

- [ ] **Step 1: 현재 StepByStepWizard 호출 위치 확인 + 교체**

Task 1.2 의 step 1~3 동일 패턴. mode='NEW_FROM_DESIGN'.

```jsx
import ComposerWizard from './ComposerWizard';
import { convertSpec9ToCanvas } from './wizardState';

<ComposerWizard
  initialSpec={convertSpec9ToCanvas(spec9)}
  mode='NEW_FROM_DESIGN'
  targetCd={currentTargetCd}
  onBack={...}
/>
```

- [ ] **Step 2: webpack 빌드 통과 확인**

- [ ] **Step 3: manual 검증 시나리오**

사용자가:
1. T3Composer 메인 → [설계서 기반 신규] 진입
2. 샘플 설계서 (.xlsx) 업로드
3. 시트 검토 → "단계별 Wizard 시작"
4. 4-step Wizard 진입 → Layout step 에 설계서의 layer 구조 prefill 확인
5. Generate → 산출물이 설계서 요구사항 반영 확인

- [ ] **Step 4: Phase 3 commit + push**

```bash
git add frontend/src/view/util/t3composer/ModeNewFromDesign.jsx frontend/src/view/util/t3composer/wizardState.js
git commit -m "feat(composer): NEW_FROM_DESIGN — ComposerWizard 로 이전 (9-step 폐기 3/4)

Phase 3 / 5
- ModeNewFromDesign 의 StepByStepWizard 호출을 ComposerWizard 로 교체
- convertSpec9ToCanvas 가 designDoc/parsedDesign/layoutSizes 보존 (필요 시 보강)
- mode='NEW_FROM_DESIGN' prop 으로 specToInitialPrompt 가 DESIGN 가이드 prepend

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
git push origin feature/composer-wizard-rollout
```

---

## Phase 4: NEW_NL/NEW_GENERAL 이전

### Task 4.1: ModeNewGeneral 의 단계별 path 만 교체

**Files:**
- Modify: `frontend/src/view/util/t3composer/ModeNewGeneral.jsx`

- [ ] **Step 1: 두 path 위치 확인**

```bash
grep -n "StepByStepWizard\|createSession\|prefilledSpec" frontend/src/view/util/t3composer/ModeNewGeneral.jsx | head -20
```

Expected:
- "1-shot 직접 생성" path — `createSession({ ... })` 직접 호출 후 ChatPanel 진입 (이 path 는 변경 없음)
- "단계별 정제" path — `<StepByStepWizard mode='NEW_GENERAL' prefilledSpec={...}>` 호출

- [ ] **Step 2: 단계별 path 만 ComposerWizard 로 교체**

1-shot path 는 그대로. 단계별 path 만:

```jsx
import ComposerWizard from './ComposerWizard';
import { convertSpec9ToCanvas } from './wizardState';

// 단계별 path 호출 부분만 교체
<ComposerWizard
  initialSpec={convertSpec9ToCanvas(spec9)}
  mode='NEW_GENERAL'
  targetCd={currentTargetCd}
  onBack={...}
/>
```

- [ ] **Step 3: 자연어 + 참조 5종 메타 보존 확인**

ModeNewGeneral 의 spec9 가 채우는 필드 (instruction, mockupRef, uiPatternRef, dataSourceRefs, attachments) 가 convertSpec9ToCanvas → spec.meta 에 보존되는지 확인. 미보존 시 wizardState.js 의 convertSpec9ToCanvas 에 추가.

```bash
grep -n "instruction\|mockupRef\|uiPatternRef\|dataSourceRefs\|attachments" frontend/src/view/util/t3composer/wizardState.js | head -15
```

- [ ] **Step 4: webpack 빌드 통과 확인**

- [ ] **Step 5: manual 검증 시나리오**

사용자가:
1. T3Composer 메인 → [자연어 신규] 진입
2. Mockup 선택 (예: dash_executive) + 자연어 입력 (예: "분기별 매출 대시보드")
3. "단계별 정제" 클릭 → 4-step Wizard 진입 확인
4. Layout step 에 mockup 의 layers (KPI 4 + 본문 3) prefill 확인
5. Generate → 산출물이 mockup 구조 + 자연어 의도 반영 확인
6. 1-shot path 도 변경 없이 정상 동작 확인 (자연어 입력 → "바로 생성" → 기존 흐름)

- [ ] **Step 6: Phase 4 commit + push**

```bash
git add frontend/src/view/util/t3composer/ModeNewGeneral.jsx frontend/src/view/util/t3composer/wizardState.js
git commit -m "feat(composer): NEW_NL/NEW_GENERAL — 단계별 path ComposerWizard 로 이전 (9-step 폐기 4/4)

Phase 4 / 5
- ModeNewGeneral 의 단계별 path 만 StepByStepWizard → ComposerWizard 교체
- 1-shot path (자연어 직접 생성) 는 변경 없음
- 자연어+참조 5종 메타 (instruction/mockupRef/uiPatternRef/dataSourceRefs/attachments)
  convertSpec9ToCanvas 통해 spec.meta 로 보존

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
git push origin feature/composer-wizard-rollout
```

---

## Phase 5: 9-step 폐기 + cleanup

### Task 5.1: 남은 StepByStepWizard 참조 확인 (잘 정리됐는지)

**Files:**
- (검증만, 변경 없음)

- [ ] **Step 1: StepByStepWizard import 남은 곳 grep**

```bash
grep -rn "StepByStepWizard\|StepByStepWizard.jsx" frontend/src --include="*.jsx" --include="*.js" | head -10
```

Expected: `import StepByStepWizard from './StepByStepWizard'` 라인 0개. (Phase 1~4 가 모두 ComposerWizard 로 교체했으면 0)

만약 남아있는 곳 있으면 그곳도 ComposerWizard 로 교체 (이 task 안에서).

### Task 5.2: 옛 9-step 파일 삭제

**Files:**
- Delete: `frontend/src/view/util/t3composer/StepByStepWizard.jsx`
- Delete: `frontend/src/view/util/t3composer/steps/Step1Layout.jsx`
- Delete: `frontend/src/view/util/t3composer/steps/Step2Overview.jsx`
- Delete: `frontend/src/view/util/t3composer/steps/Step3Components.jsx`
- Delete: `frontend/src/view/util/t3composer/steps/Step4DataBinding.jsx`
- Delete: `frontend/src/view/util/t3composer/steps/Step5Columns.jsx`
- Delete: `frontend/src/view/util/t3composer/steps/Step6Cascade.jsx`
- Delete: `frontend/src/view/util/t3composer/steps/Step7FilterBar.jsx`
- Delete: `frontend/src/view/util/t3composer/steps/Step8FilterCascade.jsx`
- Delete: `frontend/src/view/util/t3composer/steps/Step9Generate.jsx`
- Delete: 기타 `steps/` 하위 보조 파일 (있다면)

- [ ] **Step 1: steps/ 디렉토리 안 파일 list**

```bash
ls frontend/src/view/util/t3composer/steps/
```

Expected: Step1Layout.jsx ~ Step9Generate.jsx + 보조 파일들. 어떤 파일이 ComposerWizard 도 사용 중인지 확인 (예: StepDataInspector.jsx).

- [ ] **Step 2: ComposerWizard 가 import 하는 steps 파일은 보존**

```bash
grep -n "from './steps/" frontend/src/view/util/t3composer/ComposerWizard.jsx
```

ComposerWizard 가 `steps/` 의 일부를 import 중이면 그건 보존. 나머지 삭제.

- [ ] **Step 3: 삭제 실행**

```bash
# Step1Layout ~ Step9Generate (10 파일)
rm frontend/src/view/util/t3composer/steps/Step{1Layout,2Overview,3Components,4DataBinding,5Columns,6Cascade,7FilterBar,8FilterCascade,9Generate}.jsx
# StepByStepWizard
rm frontend/src/view/util/t3composer/StepByStepWizard.jsx
# (Step 2 결과 보고 보조 파일도 추가 삭제)
```

- [ ] **Step 4: webpack 빌드 통과 확인 — import 끊긴 곳 발견**

```bash
sleep 3 && docker compose logs --tail=30 composer-frontend 2>&1 | grep -E "ERROR|Cannot find module|Module not found" | tail -10
```

Expected: 끊긴 import 0개. 발견 시 grep 으로 추적 후 정리.

만약 끊긴 곳 있으면:
```bash
grep -rn "from '\./steps/Step\|from '\./StepByStepWizard" frontend/src --include="*.jsx" --include="*.js"
```

→ 각 파일에서 dead import 제거.

### Task 5.3: rules/41d 폐기 마킹

**Files:**
- Modify: `.claude/rules/41d-composer-wizard.md`

- [ ] **Step 1: 룰 파일 첫 부분에 deprecated 헤더 추가**

`.claude/rules/41d-composer-wizard.md` 의 맨 위 (제목 다음 줄) 에:

```markdown
# 41d. Composer — 세션 전이 + 9-Step Wizard

> **⚠️ DEPRECATED (2026-05-26)**: 9-step Wizard (`StepByStepWizard`) 는 폐기되었습니다.
> 모든 4 모드 (NEW_FROM_COPY · EXISTING_MODIFY · NEW_FROM_DESIGN · NEW_NL/NEW_GENERAL)
> + NEW_STEP 이 `ComposerWizard` (4-step) 를 사용합니다.
> 본 문서는 역사 참조용으로 유지되며, mode 별 prompt 가이드는 `ComposerWizard` 의
> `specToInitialPrompt` mode prepend (wizardState.js) 로 이전되었습니다.
>
> 관련: `docs/superpowers/specs/2026-05-26-composer-wizard-rollout-design.md`
```

기존 §15 (세션 상태 전이) 부분은 그대로 유효 — 그 룰은 ComposerWizard 에서도 적용됨.

- [ ] **Step 2: §16 (9-Step Wizard) 섹션 시작에도 deprecated 표기**

`## §16. 통합 9-Step Wizard` 헤딩 다음에:
```markdown
> ⚠️ **이 섹션의 9-step Wizard 구조 (Step1Layout ~ Step9Generate) 는 폐기됨.**
> 새 화면 생성은 `ComposerWizard` (4-step: Layout / Data·Filter / Meta·Menu / Generate)
> 사용. mode 별 가이드는 `specToInitialPrompt` 의 mode prepend 로 이전.
```

### Task 5.4: Phase 5 commit + push + PR 생성 (선택)

- [ ] **Step 1: 변경 list 확인**

```bash
git status --short
```

Expected: 10+ files deleted, 41d-composer-wizard.md modified.

- [ ] **Step 2: commit**

```bash
git add -u  # 삭제 파일 모두 staging
git add .claude/rules/41d-composer-wizard.md
git commit -m "$(cat <<'EOF'
chore(composer): 9-step Wizard 폐기 + cleanup (Phase 5 / 5)

ComposerWizard 전 모드 확장 완료. 4 모드 (COPY/MODIFY/DESIGN/GENERAL) +
NEW_STEP 모두 4-step ComposerWizard 사용. 옛 9-step 자산 일괄 제거.

삭제:
- frontend/src/view/util/t3composer/StepByStepWizard.jsx
- frontend/src/view/util/t3composer/steps/Step1Layout.jsx ~ Step9Generate.jsx (9 파일)

문서:
- .claude/rules/41d-composer-wizard.md — DEPRECATED 헤더 + §16 deprecated 표기.
  본 문서는 역사 참조용. mode 별 prompt 가이드는 wizardState.js 의
  specToInitialPrompt mode prepend 로 이전.

Spec: docs/superpowers/specs/2026-05-26-composer-wizard-rollout-design.md
Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push origin feature/composer-wizard-rollout
```

- [ ] **Step 3: main merge + push (사용자 승인 후)**

5 Phase 모두 검증 완료 후:

```bash
git checkout main && git pull origin main
git merge feature/composer-wizard-rollout --no-ff -m "merge: ComposerWizard 전 모드 확장 (Phase 1~5 완료)"
git push origin main
```

---

## 최종 검증 체크리스트

Phase 5 commit + main merge 후:

- [ ] **A. 5 모드 모두 동작**

각 모드 진입 → 4-step Wizard 표시 → 산출물 생성 시나리오:
- NEW_STEP (기준)
- NEW_FROM_COPY
- EXISTING_MODIFY
- NEW_FROM_DESIGN
- NEW_NL / NEW_GENERAL (단계별 path + 1-shot path 둘 다)

- [ ] **B. 9-step 잔재 0**

```bash
grep -rn "StepByStepWizard\|StepByStepWizard.jsx" frontend/src --include="*.jsx" --include="*.js"
ls frontend/src/view/util/t3composer/steps/Step{1Layout,2Overview,3Components,4DataBinding,5Columns,6Cascade,7FilterBar,8FilterCascade,9Generate}.jsx 2>&1
```

Expected: 첫 명령 0개 결과, 두번째 모두 "No such file or directory".

- [ ] **C. webpack build 깨끗**

`docker compose logs --tail=20 composer-frontend | grep ERROR` 가 0건.

---

## Self-Review

**1. Spec coverage**:
- spec §6 의 Phase 1~5 모두 task 로 분해됨 ✓
- spec §7 (mode 인식 강화) → Task 1.1 ✓
- spec §8.1 (convertSpec9ToCanvas 손실) → Task 0.2 + Task 3.1 보강 ✓
- spec §9 (검증 전략) → 각 Phase 의 manual 검증 step ✓

**2. Placeholder scan**: 통과 — TBD/TODO 없음. 모든 코드 step 에 실제 코드 포함.

**3. Type consistency**: `convertSpec9ToCanvas(spec9)`, `mode='NEW_FROM_COPY'`, `ComposerWizard initialSpec=...` 등 시그니처 4 Phase 모두 일관.

**4. 불확실성 명시**: Task 0.1/0.2/3.1 이 "결과에 따라 분기" 형태 — 정보 수집 후 결정. 이는 spec §8.1 의 위험 사항을 plan 에 반영한 것 (TBD 가 아님).

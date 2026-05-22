# ComposerCanvas 4단계 Wizard 재설계 — Design

**Date**: 2026-05-22
**Status**: Draft (사용자 합의 후 spec 리뷰 대기)
**Author**: brainstorming session (eunjoo_hwang + Claude)
**Owner**: t3-composer frontend
**관련 spec**: `2026-05-22-pattern-driven-composer-redesign-design.md` (원본 — Phase 1.5/2C/2D-1 까지의 결정)

## Goal

Phase 1.5 + 2C + 2D-1 에서 `ComposerCanvas` 한 화면에 모든 결정 (Layer 골격 / 메타·메뉴 / 데이터·FilterBar / 생성) 을 뭉친 결과 사용자가 한꺼번에 너무 많은 선택을 마주하는 문제를 해결한다. **4단계 wizard 로 분리** + **FilterBar 를 dialog 가 아닌 inline panel** 로 변경. 단계 자유 이동 (강제 순서 없음).

## Why

### 사용자 피드백
1. **단계 부재** — "원래 9단계 뭐시기였잖아요. 다음 단계에서 메뉴 설정하는건 어떨까요" — 한 화면 결정 부담 과다.
2. **검색조건 dialog 불편** — "검색조건도 팝업으로 있으니 설정해서 보기가 어려운거같기도합니다" — FilterBar dialog 가 canvas 를 가려서 검색 ↔ body layer 관계가 한 화면에서 안 보임.

### 원본 spec 의 일부 결정 재평가
원본 spec (2026-05-22-pattern-driven-composer-redesign-design.md) 의 핵심 결정은 "9-Step Wizard 폐지 → 시각 직접 조작 + Mini Dialog". 그러나 brainstorming 당시 짚었던 "9단계 비합리" 의 본질은 **"패턴이 정한 것 (Step1 Layout / Step3 Components) 을 재입력"** 이었음. 메타 / 데이터 / Cascade / FilterBar 같은 step 자체는 본질적으로 유효했음 — 다만 ComposerCanvas 에 mini dialog 로 다 뭉친 게 과한 단순화.

### 새 균형점
- **시각 조작** (패턴 + Layer drag/resize/추가/삭제/Container nested) — Phase 1.5 그대로 유지
- **명시 단계** (① Layout · ② 데이터·검색조건 · ③ 메타·메뉴 · ④ 생성) — 9단계의 분리 장점 일부 복원
- **FilterBar inline** — dialog 사라지고 ② 단계의 우측 panel 로 항상 노출

## Non-Goals

- **9단계 wizard 코드 복원** — `StepByStepWizard` / `Step1Layout..Step9Generate` 는 그대로 제거 예정 (Phase 3). 새 4단계 wizard 는 별개 컴포넌트.
- **단계 간 강제 순서** — 사용자가 단계 클릭으로 자유 이동. 단계별 완료 검증/잠금 없음.
- **단계별 검증/에러 표시** — 메타 미설정이라도 ④ 진입 가능 (Claude 가 추론 fallback).
- **Backend 변경** — 0. 모든 변경은 frontend (`ComposerCanvas.jsx` 또는 신규 wrapper).
- **다른 모드 (NEW_NL / NEW_FROM_COPY / NEW_FROM_DESIGN) 영향** — 0. NEW_STEP 의 ComposerCanvas 만 wizard 로 wrap.

## Architecture

### 새 컴포넌트 계층

```
ModeNewStep (stage 관리)
  └─ stage === 'CANVAS'
     └─ ComposerWizard  (★ 신규 — 4단계 wrapper)
        ├─ <WizardStepper> (상단, 4개 step 클릭 가능)
        ├─ {currentStep === 'LAYOUT'}     → <ComposerCanvas> (Phase 1.5 그대로, FilterBar 노란 띠 제거)
        ├─ {currentStep === 'DATA'}       → <DataAndFilterStep>  (좌: layer 카드 + 클릭 mini dialog · 우: FilterBar inline panel)
        ├─ {currentStep === 'META'}       → <MetaStep>           (inline form, ScreenMetaDialog 의 내용)
        ├─ {currentStep === 'GENERATE'}   → <GenerateStep>       (createSession + ComposerWorkspace 임베드)
        └─ <WizardFooter>  (← 이전 / 다음 → 버튼, 좌/우 정렬)
```

### 단계별 책임

#### ① LAYOUT (초록)
- **목적**: 화면 골격 결정
- **컴포넌트**: 기존 `ComposerCanvas` 를 그대로 활용 — 다만 FilterBar 노란 띠 + [메뉴/메타] 버튼은 **숨김** (해당 단계가 따로 있음)
- **기능**: 패턴이 만든 layer 골격, [+ Layer] 추가, drag/resize, Container nested, 호버 X 삭제
- **사용자가 끝낸 후**: 다음 단계로 이동 (또는 stepper 클릭)

#### ② 데이터·검색조건 (노랑)
- **목적**: 각 layer 의 데이터 + 화면 검색조건 한 화면에서 동시 편집
- **레이아웃**: 좌측 ~70% · 우측 ~30% (FilterBar inline panel)
  - **좌측**: Body Layers 카드 목록 (drag/resize 비활성, 단순 stacked 또는 grid view)
    - 카드 클릭 → 기존 `DataMiniDialog` popup
    - 데이터 설정 여부 시각 표시
  - **우측**: `FilterBarInlinePanel` (신규) — 현재 `FilterBarMiniDialog` 의 내용을 panel 화
    - 필드 목록 (key/label/type)
    - [+ 필드 추가]
    - affects 매핑 grid
- **이점**: dialog 가 캔버스를 가리지 않아 검색조건 ↔ layer 관계 한 화면에서

#### ③ 메타·메뉴 (파랑)
- **목적**: 화면 제목 / 메뉴 코드 / 메뉴 파일 경로 / 부모 메뉴 입력
- **컴포넌트**: `ScreenMetaDialog` 의 내용을 inline form 으로 (`MetaStep` 신규)
- **기능**: 부모 메뉴는 `MenuPickerDialog` (targetCd 전달) popup 으로 선택
- **사용자가 끝낸 후**: 다음 단계 (생성)

#### ④ 화면 생성·미리보기 (보라)
- **목적**: Claude 호출 + 산출물 + 미리보기
- **컴포넌트**: 기존 `<ComposerWorkspace>` 임베드 (Phase 2C 와 동일)
- **진입 시점**: 사용자가 [화면 생성] 버튼 또는 stepper ④ 클릭
- **세션 생성**: 진입 시 1회 createSession + specToInitialPrompt

### Stepper UX

```jsx
<WizardStepper currentStep={step} onStepClick={setStep}>
  <Step id="LAYOUT"   label="① Layout"        color="#16a34a" />
  <Step id="DATA"     label="② 데이터·검색조건" color="#facc15" />
  <Step id="META"     label="③ 메타·메뉴"     color="#2563eb" />
  <Step id="GENERATE" label="④ 화면 생성"      color="#9D8FD4" />
</WizardStepper>
```

- 각 step 클릭으로 자유 이동
- 현재 step 은 진한 색 border + bg, 나머지는 회색
- 데이터 입력된 step 은 ✓ 표시 (optional)

### Footer

```jsx
<WizardFooter>
  <Button onClick={prevStep} disabled={isFirstStep}>← 이전</Button>
  <Button onClick={nextStep} disabled={isLastStep} variant="contained">다음 →</Button>
</WizardFooter>
```

### 컴포넌트 변경 매트릭스

| 파일 | 변경 종류 | 책임 |
|---|---|---|
| `frontend/src/view/util/t3composer/ComposerWizard.jsx` | **신규** | 4단계 wrapper. step state + Stepper + Footer + step 별 분기 렌더 |
| `frontend/src/view/util/t3composer/DataAndFilterStep.jsx` | **신규** | ② 단계. 좌측 Body Layers + 우측 FilterBar inline panel |
| `frontend/src/view/util/t3composer/MetaStep.jsx` | **신규** | ③ 단계. ScreenMetaDialog 의 inline form 버전 |
| `frontend/src/view/util/t3composer/GenerateStep.jsx` | **신규** | ④ 단계. createSession + ComposerWorkspace 임베드 (현재 ModeNewStep 의 WORKSPACE 분기 로직 이동) |
| `frontend/src/view/util/t3composer/FilterBarInlinePanel.jsx` | **신규** | FilterBarMiniDialog 의 panel 버전 (props 같은 spec/onApply) |
| `frontend/src/view/util/t3composer/ComposerCanvas.jsx` | **수정 (모드 prop 추가)** | `mode='layout'` 일 때 — FilterBar 노란 띠 + [메뉴/메타] 버튼 숨김 (LAYOUT 단계 전용). `mode='all'` (default) 일 때 — 기존 동작 (다른 곳에서 사용 시) |
| `frontend/src/view/util/t3composer/ModeNewStep.jsx` | **단순화** | stage === 'CANVAS' 분기를 `<ComposerWizard>` 호출로 교체. WORKSPACE 단계의 createSession + ComposerWorkspace 로직은 GenerateStep 으로 이전 |

### 데이터 흐름

`ComposerWizard` 가 `spec` state 의 단일 진실 저장소. 각 step 은 `onChange(nextSpec)` 콜백으로 갱신.

```
spec (state) ───┬→ LayoutStep   (ComposerCanvas)
                ├→ DataStep     (Body Layers + FilterBar)
                ├→ MetaStep     (form)
                └→ GenerateStep (createSession + ComposerWorkspace)
                                   ↑ session 생성 시 spec → specToInitialPrompt 직렬화
```

### 기존 기능 보존

- **DataMiniDialog / FilterBarMiniDialog** — 컴포넌트 자체는 유지. `FilterBarMiniDialog` 는 panel 모드 (inline) 도 지원하도록 약간 보강 (또는 별도 `FilterBarInlinePanel` 신규 — 디자인이 다르므로 후자 권장)
- **MenuPickerDialog / ScreenMetaDialog** — `MetaStep` 안에서 호출
- **specToInitialPrompt** — GenerateStep 진입 시 호출 (기존)
- **ComposerWorkspace** — GenerateStep 안에 임베드

## Migration Strategy

### Phase 2E-1: 골격 (이 spec 의 첫 plan)
1. `ComposerWizard.jsx` 신규 — Stepper + Footer + step state
2. `LayoutStep` = ComposerCanvas 그대로 (단순 wrap)
3. `MetaStep` = ScreenMetaDialog 의 본문을 form 으로 (popup 제거)
4. `GenerateStep` = ModeNewStep 의 WORKSPACE 로직 이전
5. `DataAndFilterStep` = 가장 단순한 버전 (좌: layer 목록 · 우: FilterBar 목록만 — 자세한 입력은 mini dialog)
6. ModeNewStep 의 CANVAS 분기를 `<ComposerWizard>` 로 교체

### Phase 2E-2: FilterBar inline 강화
1. `FilterBarInlinePanel` 신규 — `FilterBarMiniDialog` 의 모든 기능 (필드 추가/제거/타입 변경/affects 매핑) 을 inline 형태로
2. ② 단계의 우측 panel 로 교체
3. `FilterBarMiniDialog` 는 제거 (사용처가 panel 로 이전됐으므로)

### Phase 2E-3: ComposerCanvas mode prop
1. `mode='layout'` 일 때 FilterBar 노란 띠 + [메뉴/메타] 버튼 숨김
2. LAYOUT 단계에서 mode='layout' 사용

## Open Questions

다음 결정은 plan 단계에서:

1. **각 step 의 완료 표시 (✓)** — 데이터 입력 완료 / 메타 입력 완료 시 stepper 에 ✓ 표시 vs 안 함
2. **GenerateStep 진입 시 자동 createSession?** — stepper ④ 클릭 시 자동 호출 vs 별도 [화면 생성] 버튼 후 호출
3. **GenerateStep 의 spec 수정 후 재생성** — WORKSPACE 안에서 spec 변경 못 함. 이전 step 으로 돌아가서 수정 → 다시 ④ 진입 시 새 세션
4. **DataStep 좌측의 layer 카드 형태** — Phase 1.5 의 큰 카드 vs 더 작은 list 항목
5. **단계별 spec 검증** — 예: LAYOUT step 에 layer 0개일 때 DATA step 진입 막을지 (현재 spec: 강제 검증 없음 — 유연성 우선)

## Risk

- **기존 사용자 적응** — Phase 1.5/2C 의 한 화면 UX 에 익숙해진 사용자가 단계 분리로 인해 처음엔 클릭 수 증가 느낌. Stepper 의 자유 이동으로 완화.
- **state 동기화** — 4개 step 이 같은 spec 을 공유. ComposerWizard 가 single source of truth. step 간 이동 시 spec 손실 없음 (state 유지).
- **WORKSPACE 진입 후 spec 변경 불가** — 사용자가 메뉴 수정 원하면 ③ step 으로 돌아가야. 명확한 UX 라고 판단.
- **FilterBar inline panel 의 폭** — 좁은 화면에서는 좌측 layer 가 좁아질 수 있음. min-width 보호 + 반응형 분기 (1200px 미만에서 dialog fallback).

## References

- 원본 spec: `docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md`
- Phase 1.5 milestone: commit `cddb94f`
- Phase 2C milestone: commit `29611f3`
- Phase 2D-1 milestone: 진행 중 (Task 4 smoke 단계)
- 사용자 wireframe 참조: `.superpowers/brainstorm/42266-1779444679/content/wizard-flow-v2.html`
- 9단계 Wizard (참조 코드, 일부 영감 흡수): `frontend/src/view/util/t3composer/StepByStepWizard.jsx`

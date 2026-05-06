# 41d. Composer — 세션 전이 + 9-Step Wizard

> **상위 규칙**: `41-composer-generation.md` 의 §15 (세션 상태 전이) + §16 (통합 9-Step Wizard) 분리.
> NEW_STEP / NEW_FROM_COPY / NEW_FROM_DESIGN 3개 모드 공통 흐름의 단일 진실 저장소.

---

## §15. 세션 상태 전이 (메뉴등록 + 아티팩트 적용 → COMPLETED)

### §15.1 상태 값

`ComposerSession.STATUS`:
- `ACTIVE` (기본) — 대화·생성 진행 중
- `COMPLETED` — 메뉴등록 **AND** 아티팩트 적용이 모두 완료됨
- `ARCHIVED` — 사용자가 명시적으로 보관 처리

### §15.2 자동 전이 조건 (서버)

세션이 `ACTIVE` 일 때, 다음 두 조건이 **모두** 충족되면 서버가 자동으로 `COMPLETED` 로 전이한다:

1. **메뉴등록 완료** — `TB_IS_COMPOSER_ARTIFACT` 에 `SESSION_ID = <sid>` AND `ARTIFACT_TYPE = 'MENU_SQL'` AND `STATUS = 'FINAL'` 인 row 1건 이상
2. **아티팩트 적용 완료** — 동일 세션에 `ARTIFACT_TYPE <> 'MENU_SQL'` AND `STATUS = 'FINAL'` 인 row 1건 이상 (JSX / Java 4종 / DDL / SP 중 최소 1개가 실제 파일/DB 에 적용)

두 조건 충족 시점에 실행된 서비스(메뉴등록이 나중이면 `MenuRegistrationService`, 아티팩트 적용이 나중이면 `ArtifactApplyService`) 가 세션 `STATUS = COMPLETED` 로 업데이트. 이미 `COMPLETED` / `ARCHIVED` 인 세션은 그대로 유지.

### §15.3 구현 위치

| 위치 | 역할 |
|---|---|
| `MenuRegistrationService.markSessionCompletedIfReady(sessionId)` | `executeSessionMenuSql` 성공 경로 끝에서 호출 |
| `ArtifactApplyService.markSessionCompletedIfReady(sessionId)` | `apply` 가 success + anyWork 일 때 호출 |
| `ArtifactApplyService.markAppliedArtifactsFinal(...)` | apply 성공한 비 MENU_SQL 아티팩트에 `STATUS_FINAL` 마킹 (전이 조건 #2 의 전제) |
| `ComposerArtifactRepository.existsBySessionIdAndArtifactType(Not)AndStatus(...)` | 조건 체크 쿼리 |

두 서비스의 전이 로직은 별도 트랜잭션(`REQUIRES_NEW`)으로 격리되어, 실패해도 본래 작업(메뉴등록/아티팩트 적용) 결과에 영향 없음.

### §15.4 수동 전이 API

사용자가 명시적으로 상태를 변경할 때:
```
POST /composer/sessions/{sessionId}/status/{status}
```
- `status` ∈ `ACTIVE` · `COMPLETED` · `ARCHIVED`
- 예: 완료된 세션을 다시 수정하려면 `ACTIVE` 로 되돌림

### §15.5 Anti-patterns

| ❌ | ✅ |
|---|---|
| LLM/클라이언트가 세션 status 를 직접 `COMPLETED` 로 세팅 (조건 미충족 상태로) | 서버 자동 전이에 맡김. 명시 변경은 수동 전이 API 사용 |
| 아티팩트 apply 만 하고 메뉴등록 누락 → 사용자에게 "완료됐다" 로 안내 | 두 조건 모두 충족되어야 UI 에서도 COMPLETED 로 표시 |
| 아티팩트 생성(DRAFT) 만으로 COMPLETED 로 전이 | `STATUS_FINAL` (실제 파일/DB 적용) 이어야 전이 |

---

## §16. 통합 9-Step Wizard (NEW_STEP · NEW_FROM_COPY · NEW_FROM_DESIGN 공용)

> **2026-04 통합**: 신규 화면 생성 모드 3종 (`NEW_STEP` / `NEW_FROM_COPY` / `NEW_FROM_DESIGN`) 은 모두
> **동일한 9단계 Wizard** (`StepByStepWizard.jsx`) 흐름을 따른다.
> **차이는 prefill 출처뿐**:
> - `NEW_STEP`        → 빈 spec (사용자 직접 입력)
> - `NEW_FROM_COPY`   → `createInitialSpecFromSource(sourceBundle, ...)` — 원본 화면 추출
> - `NEW_FROM_DESIGN` → `createInitialSpecFromDesign(parsedDesign, ...)` — 설계서 파싱
>
> Wizard 진입 후 9단계 검토·수정·LLM 호출 경로는 모두 동일. Step9 의 "Claude 로 생성 시작" 버튼이
> 공통 `createSession` + `buildStepPrompt(spec, module, pattern, { isCopyMode, isDesignMode, sourceBundle })`
> 를 호출한다.

### §16.0 모드별 진입 화면 (Wizard 이전)

| 모드 | 진입 컴포넌트 | Wizard 진입 전 사용자 입력 |
|---|---|---|
| `NEW_STEP`        | `StepByStepWizard` 직접 | 모듈 선택 |
| `NEW_FROM_COPY`   | `ModeNewFromCopy` → `StepByStepWizard` | 원본 메뉴 선택 + 신규 메뉴코드 |
| `NEW_FROM_DESIGN` | `ModeNewFromDesign` → `StepByStepWizard` | 설계서 업로드 + 시트 검토 + Layout 정리 |

### §16.1 9단계 목록 (모든 모드 공통)

| # | key | 화면 컴포넌트 | 수집 데이터 키 | Users.jsx 대응 |
|---|---|---|---|---|
| ① | `layout`        | `Step1Layout.jsx`        | `step1_layout.patternCode` · `step1_layout.areas[]` | P02 패턴 · `mainSearch` + `mainGrid` |
| ② | `overview`      | `Step2Overview.jsx`      | `step2_overview.{screenId, screenName, menuCd, parentMenuCd, menuFilePath, langKey}` | `UI_AD_USERS` · `MENU_AD` · `/system/users` |
| ③ | `components`    | `Step3Components.jsx`    | `step3_components[areaId].{components, buttons}` | `SearchArea(InputField×3)` · `BaseGrid + add/delete/save` |
| ④ | `dataBinding`   | `Step4DataBinding.jsx`   | `step4_dataBinding[areaId].{source, entity, baseUrl, spName, ...}` | `JPA_ENTITY` · `User` · `system/users` |
| ⑤ | `columns`       | `Step5Columns.jsx`       | `step5_columns[areaId].columns[]` | 11개 컬럼 (username/displayName/...) |
| ⑥ | `cascade`       | `Step6Cascade.jsx`       | `step6_cascade[areaId].rules[]` | `{}` (단일 마스터) |
| ⑦ | `filter`        | `Step7FilterBar.jsx`     | `step7_filter.fields[]` | username/displayName/uniqueValue 3개 |
| ⑧ | `filterCascade` | `Step8FilterCascade.jsx` | `step8_filterCascade.{dependencies, crossFieldRules}` | `{}` |
| ⑨ | `generate`      | `Step9Generate.jsx`      | `toLlmPayload(spec)` 직렬화 → Claude 세션 + `changeReq` 자유 텍스트 입력 | 기존 `ComposerWorkspace` 흐름 재사용 |

### §16.2 데이터 모델 단일 진실 저장소

- **`packages/wingui/src/view/util/t3composer/wizardState.js`**
  - `createInitialSpec(moduleCode)` — 9단계 초기 구조 (빈 spec)
  - **`createInitialSpecFromSource({ sourceMenu, sourceBundle, newMenuCd, newTitle, ... })`** — NEW_FROM_COPY prefill (원본 JSX 에서 패턴/메뉴경로 추론)
  - **`createInitialSpecFromDesign({ parsed, fileName, layoutSizes, mainLayoutConfig })`** — NEW_FROM_DESIGN prefill (Excel 파싱 → Step1 Layout / Step2 Overview / Step5 Columns 자동 채움)
  - `inferLayoutFromJsx(jsx)` / `inferLayoutFromDesign(layout)` — 패턴 추론 헬퍼
  - `inferColumnsFromDesign(parsed, areas)` — Grid 시트 → step5_columns 자동 추출
  - `canProceedStep(idx, spec)` — 단계별 필수 완료 조건
  - `invalidateDownstream(spec, changedStep)` — 이전 단계 변경 시 하위 리셋 (예: Layout 변경 → Step3~6 전부 초기화)
  - `toLlmPayload(spec, module, pattern)` — LLM prompt 용 JSON 직렬화 (sourceMenu / designDoc 메타 포함)
  - `formatSourceBundleForPrompt(bundle)` / `formatDesignDocForPrompt({ ... })` — 원본/설계서 텍스트 블록 직렬화
  - `WIZARD_STEPS` — Stepper 메타데이터
  - `defaultAreasForPattern(patternCode)` — Pattern 선택 시 초기 areas 제안

### §16.2.1 spec 의 모드별 보조 필드

`createInitialSpec()` 으로 만든 spec 에는 모든 모드가 공유하는 보조 필드가 들어있다 — 모드별 prefill 함수가 채운다:

| 필드 | 의미 | 모드 |
|---|---|---|
| `spec.sourceMenu` | { menuCd, filePath, path } — 원본 메뉴 메타 | NEW_FROM_COPY |
| `spec.sourceBundle` | `collectSourceForLlm()` 응답 (JSX/Java/SP 텍스트) | NEW_FROM_COPY |
| `spec.designDoc` | { fileName, overview, layoutSummary, sheetNames } — 설계서 메타 | NEW_FROM_DESIGN |
| `spec.parsedDesign` | 설계서 파서 raw 결과 (sheets 포함) | NEW_FROM_DESIGN |
| `spec.layoutSizes` | 사용자 조정 layer 사이즈 비율 | NEW_FROM_DESIGN |
| `spec.mainLayoutConfig` | 설계서 검토 단계의 layoutConfig | NEW_FROM_DESIGN |
| `spec.changeReq` | Step9 자유 텍스트 변경 요청 | COPY · DESIGN 모두 |

### §16.3 각 단계 → 산출물 매핑 규칙 (LLM 가이드)

`ComposerPromptBuilder.newStepGuide(StepGuideMode mode)` 에 상세 매핑 존재. `mode` 는 `PLAIN` (NEW_STEP) / `COPY` (NEW_FROM_COPY) / `DESIGN` (NEW_FROM_DESIGN) 셋 중 하나. 본문(매핑 규칙)은 모든 모드 공통, prepend 만 모드별로 다름. 요약:

| 단계 | LLM 이 생성할 것 |
|---|---|
| Step1 `layoutAreas` | JSX 최상위 구조 — `parent='split-left/right'` → `<SplitPanel>` · `parent='tabs'` → `<TabContainer>` · 그 외 → `<ContentInner>` 내부 직접 |
| Step2 `screen` | `MENU_SQL` (TB_AD_MENU + LANG_PACK 4언어 + PERMISSION_GROUP) · JSX 파일 경로: `packages/wingui/src/view/<menuFilePath 추출>/<ComponentName>.jsx` |
| Step3 `areaComponents` | Area 별 JSX · buttons → ButtonArea 에 표준 `GridAddRowButton`/`Delete`/`Save`/`Excel` 배치 |
| Step4 `areaDataBinding` | source 별 호출 코드 (`JPA_ENTITY`=zAxios REST · `SP`=callService · `ONTOLOGY`/`DIRECT`=명시 URL) |
| Step5 `areaColumns` | `gridItems` 배열 — 각 컬럼에 `name`/`fieldName`/`dataType`/`headerText`/`width`/`editable`/`textAlignment`/`validRules` 필수 · `widget='Pop*'` 은 `applyGridCascade` 가 자동 주입 |
| Step6 `areaCascade` | `useFieldCascade({control,setValue,getValues})` + `applyGridCascade(gridObj, gridItems, {onCellPopupRequest})` + `<Pop* {...buildPopupFilterProps(...)}>` |
| Step7 `filterBar.fields` | `<SearchArea><SearchRow>` + 각 field type → `<InputField type>` 매핑 (DOMAIN_PLAN_SCOPE/ITEM_MULTI 등은 전용 컴포넌트) |
| Step8 `dependencies`/`crossFieldRules` | `watch` + `useEffect` 로 reload_options/clear_value/검증 구현 |

### §16.4 절대 규칙 (3개 모드 모두 예외 없이 적용 — 2026-04-27 정책 / 2026-04-29 NEW_FROM_COPY 완화)

1. **SP_UI_\*.sql 생성 필수** — `NEW_STEP` / `NEW_FROM_DESIGN` 은 신규 화면 시 `SP_UI_<DOMAIN>_<NO>_<ACTION>` DDL 함께 생성 필수 (CRUD 액션마다 1개 SP, read-only 면 `_Q1` 만 OK, MSSQL 방언만). 엔진 service XML (`*_service.xml`) 은 여전히 금지. **★ NEW_FROM_COPY 는 SP 누락 허용** — 기존 endpoint 재사용 케이스가 자연스러움 (`§16.4.1` 참조).
2. **Java Entity + Service + RestController 생성 필수** — `NEW_STEP` / `NEW_FROM_DESIGN` 은 필수. Service 는 JdbcTemplate 으로 SP 호출. Repository 는 선택. Entity 는 SP 결과 매핑용. **NEW_FROM_COPY 는 기존 backend 재사용 시 누락 허용** (WARN 로그만 남김).
3. **참조 원본 복제 우선** — 9단계 Spec 은 어디까지나 변경 "지시" 이고 골격은 원본
   - NEW_STEP        → `Users.jsx` (정답지)
   - NEW_FROM_COPY   → 사용자가 선택한 원본 메뉴의 JSX
   - NEW_FROM_DESIGN → `Users.jsx` 또는 패턴(P02/P03/P04/P06) 별 유사 화면
4. **허구 import / prop 금지** — `41a §0.6.1` prop 명세 + `41b §5.5` import 화이트리스트 외 사용 금지
5. **출력 맨 앞 4줄 선언 필수** — `참조 원본` · `원본 import 리스트` · `치환 매핑` · `원본에 없는 신규 추가: 없음` (메인 §0.1)

### §16.4.1 모드별 추가 절대 규칙

**NEW_FROM_COPY (`StepGuideMode.COPY`)** — `newStepGuide(COPY)` 가 prompt 에 prepend:
- STEP A~H 의 복제 절차 (출력 4줄 선언 → import 그대로 → gridItems 그대로 → cascade 패턴 유지 → Entity 1:1 복사 → Java 4종 재생성 금지 → Spec 변경분만 반영 → changeReq 추가 반영)
- 자기 대조: import 일치 / 원본 외 wrapper 없음 / Entity @Column 1:1 / 신규 Java 4종 없음 / SQL_DDL 없음

**NEW_FROM_DESIGN (`StepGuideMode.DESIGN`)** — `newStepGuide(DESIGN)` 가 prompt 에 prepend:
- STEP A~G 의 설계서 모드 절차 (출력 4줄 선언 → screen 객체 Spec 그대로 → SplitPanel/Tab 매핑 sizes 보존 → BaseGrid items 변환 → JPA_ENTITY/SP 분기 (신규 Entity·SP 금지) → SearchArea+InputField 매핑 → changeReq 추가 반영)
- 자기 대조: 화면 ID/명칭/메뉴 위치 일치 / Grid 컬럼 수·순서 일치 / SQL_DDL 제거 / 신규 SP 제거 / Layer 사이즈 정확

### §16.4.2 NEW_FROM_COPY 의 AI prefill (2026-04 추가)

NEW_FROM_COPY 진입 직전 sourceBundle 을 LLM 한 번 호출로 분석해 9단계 spec 을 정확히 prefill. 정규식 기반 파싱의 fragility 우회.

**흐름**:
```
원본 메뉴 선택 → collectSourceForLlm → sourceBundle 받음
   ↓
SourceBundleAnalysisPanel — 사용자가 wizard 진입 전에
                            발견된 SP/URL/Entity/GridId 미리 확인 (analyzeSourceBundle 호출)
   ↓
"AI 자동 분석" 토글 ON (기본) + "다음" 클릭
   ↓ ① 정규식 baseline (createInitialSpecFromSource) — 항상 실행 (안전망)
   ↓ ② AI prefill (POST /composer/prefill-from-source) — 토글 ON 시
   ↓ ③ mergeAiSpecIntoBaseSpec — AI 우선, 알맹이 없는 SP 등은 baseline 유지
   ↓
StepByStepWizard 진입 (mode=NEW_FROM_COPY · prefilledSpec 주입)
```

**백엔드 endpoint**: `POST /composer/prefill-from-source`
- `PrefillFromSourceService.prefill(userId, req)` — Anthropic Sonnet 4.5 호출
- 입력: `{ sourceBundle, newMenuCd, newTitle, moduleCode, sourceMenuCd }`
- 출력: `{ spec: {step1..step8 JSON}, modelName }`
- 시스템 프롬프트에 9단계 JSON 구조 + Step4 source 결정 규칙 + SP suffix → CRUD 매핑 표 명시

**SP 추출 — last-resort grep (`grepSpNamesFromBundle`)**:
sourceBundle 의 모든 텍스트에서 정규식 grep:
- `screen.source` · `frontendSources[].source` · `backend.{controllers,services,repositories,entities,procedures}[].source`
- 패턴: `\b(SP_UI_[A-Z][A-Z0-9_]+|SRV_(?:GET|SET)_SP_UI_[A-Z][A-Z0-9_]+|SP_(?:UI|COMM|UT)_[A-Z][A-Z0-9_]+)\b`
- callService 변수 경유, store/hook 의 const 정의, service XML, JdbcTemplate 등 다양한 경로 포착

**SP suffix → CRUD 자동 분류 (`classifySpListByCrud`)**:
- `_Q\d* / _SEARCH / _LIST / _GET / _FIND / SRV_GET_SP_UI_*` → **read**
- `_S\d* / _SAVE / _INSERT / _CREATE / _ADD / SRV_SET_SP_UI_*` → **create**
- `_U\d* / _UPDATE / _MODIFY / _EDIT` → **update**
- `_D\d* / _DELETE / _REMOVE / _DEL` → **delete**

**Step4 default source (도메인별 dynamic)**:
- BF / DP / MP / FP → `SP` 권장 (계산·결과 도메인)
- AD / UT / CM / IM / RP / SA / SO / SALES → `JPA_ENTITY` 권장 (CRUD/마스터)
- 헬퍼: `defaultSourceFor(moduleCode)` (Step4DataBinding.jsx)
- prefill spec 의 source 가 우선. default 는 새 area 추가 시에만 적용.

**mergeAiSpecIntoBaseSpec 의 step4 특수 처리**:
AI 가 `source='SP'` 라며 spName/crudSp/allSpNames 모두 비어있으면 baseline 우선. AI 의 LLM 환각 방어:
```js
const aiHasContent =
  (aiVal.source === 'SP' && (aiVal.spName || hasNonEmptyCrud(aiVal.crudSp)
                             || aiVal.allSpNames?.length > 0))
  || (aiVal.source === 'JPA_ENTITY' && (aiVal.baseUrl || aiVal.entity))
  || ...;
if (aiHasContent) merged[areaId] = { ...baseVal, ...aiVal };
else merged[areaId] = baseVal;  // baseline 유지
```

### §16.4.3 StepDataInspector — 9단계 모든 데이터 가시화 (2026-04)

각 Step 컴포넌트 상단에 부착되는 공용 collapsible JSON viewer (`packages/wingui/src/view/util/t3composer/StepDataInspector.jsx`).

UI 가 표시하지 않는 필드도 raw JSON 으로 펼쳐볼 수 있어 "AI 가 분석했지만 화면에 안 나오는 항목" 우려 해소:
- Step1 — layoutConfig (cols/rowHeight/layers/filterBar) 전체
- Step3 — components/buttons (객체 배열 형태 그대로)
- Step4 — source/spName/baseUrl/entity/**crudSp**/allSpNames/methods/target
- Step5 — 모든 컬럼 속성 (displayType/datetimeFormat/numberFormat/values+labels/groupCd/defaultValue 등)
- Step7 — fields 의 모든 속성 (defaultValue/groupCd/options_source/dependencies 등)
- Step9 — toLlmPayload 전체 (LLM 에 전송될 최종 spec)

### §16.5 Composer 3-Layer 방어

| 계층 | 매커니즘 |
|---|---|
| **LLM 생성 시** | `ComposerPromptBuilder.newStepGuide(StepGuideMode)` 가 9단계 JSON 구조 + 절대 규칙 + 모드별 prepend (COPY → 복제 STEP A~H · DESIGN → 설계서 STEP A~G) 를 prompt 에 주입 |
| **파일 저장 시** | `pre-tool-use-validator.sh` 가 허구 import/prop (javax.\*, `<SplitPanel initialSizes>`, `textAlign:`, 허구 컬럼) 를 block |
| **아티팩트 적용 시** | `ArtifactApplyService.checkWinguiNativePolicy` 가 정책 차단 3조건 (SP DDL · 엔진 XML · NL 이외 모드 DDL) 검증 |

### §16.6 Anti-patterns

| ❌ | ✅ |
|---|---|
| `invalidateDownstream` 생략 — Layout 바꿨는데 하위 단계 데이터 그대로 | `updateStep(idx, patch)` 자동 호출 (wizardState.js) |
| Step1 patternCode 없이 Step 2 이후 진입 | `canProceedStep(0, spec)` 이 `patternCode` 필수 |
| `menuFilePath` 마지막 직전 세그먼트가 lowercase(마지막) 과 중복 | `/util/UserInfoMgmt` 처럼 단일/카테고리 + PascalCase 한 번만 |
| Step4 `source='SP'` 에서 신규 SP 생성 | 사전 등록된 SP만 연결 · 없으면 NL 모드로 돌아가거나 관리자에게 SP 등록 요청 |
| Step5 컬럼 배열에 `fieldName` 누락 | 모든 컬럼에 `fieldName` 필수 — Hook 이 자동 warn |
| Step7 FilterBar 에서 SCM 도메인 필드를 일반 `DROPDOWN` 으로 | `DOMAIN_PLAN_SCOPE`/`DOMAIN_ITEM_MULTI` 등 도메인 타입 사용 (`rules/22-filter-bar.md`) |
| `ModeNewFromCopy` / `ModeNewFromDesign` 가 `createSession` 직접 호출 (단일 LLM 호출) | `prefilledSpec` + `mode` prop 으로 `StepByStepWizard` 위임 — Step9 가 통합 호출 |
| 모드별로 별도 prompt builder 사용 (newFromCopyGuide / newFromDesignGuide) | `newStepGuide(StepGuideMode.COPY \| DESIGN \| PLAIN)` 단일 진입점 |
| AI 가 `source='SP'` 라며 spName/crudSp 모두 빈 string 으로 응답 → 화면 빈 칸 | `mergeAiSpecIntoBaseSpec` 의 step4 특수 처리 — baseline 우선 (§16.4.2) |
| Step3 buttons 가 string 배열만 가정 (`buttons.includes('save')`) | `buttonsToKeySet` 로 객체 배열도 호환 (Step3Components.jsx) |
| Step4 default 가 모든 모듈에서 `JPA_ENTITY` | `defaultSourceFor(moduleCode)` — BF/DP/MP/FP→SP, 그 외→JPA_ENTITY |
| invalidateDownstream 의 `case 1` 이 stepIndex=1(Step2 Overview) 에 매칭 → Step2 진입만 해도 step3~6 리셋 | `case 0` 으로 정정 + areaId 가 사라진 키만 제거 (areaId 보존 로직) |
| BaseGrid id 추출 실패 시 layer.key='mainGrid' 와 step3/4 의 BaseGrid id 키 mismatch | `reconcileStep3WithAreas` / `reconcileStep4WithAreas` 로 강제 정합화 |
| sourceBundle 의 SP 추출이 callService 패턴만 의존 | `grepSpNamesFromBundle` 로 모든 텍스트(JSX/Java/XML) 에서 SP_UI_* 패턴 grep |

---

## 관련 파일

- `41-composer-generation.md` — 메인 (§0 참조 원본 / §14 Anti-patterns)
- `41a-composer-jsx.md` — JSX 표준 (§0.6.1 prop 명세)
- `41b-composer-java.md` — Java 백엔드 표준 (import 화이트리스트)
- `41c-composer-widgets.md` — 위젯 카탈로그 + Cascade
- `packages/wingui/src/view/util/t3composer/wizardState.js` — 9-Step Wizard 데이터 모델 + prefill 함수 + analyzeSourceBundle/grepSpNamesFromBundle/classifySpListByCrud/mergeAiSpecIntoBaseSpec
- `packages/wingui/src/view/util/t3composer/steps/Step{1..9}*.jsx` — 9-Step Wizard UI (각 Step 에 `StepDataInspector` 부착)
- `packages/wingui/src/view/util/t3composer/StepDataInspector.jsx` — 공용 collapsible JSON viewer (모든 prefill 데이터 가시화)
- `packages/wingui/src/view/util/t3composer/StepByStepWizard.jsx` — 9-Step 컨테이너
- `packages/wingui/src/view/util/t3composer/ModeNewFromCopy.jsx` · `ModeNewFromDesign.jsx`
- `packages/wingui/src/view/util/t3composer/api.js` — `prefillFromSource()` 호출 함수
- `src/main/java/com/zionex/t3series/web/domain/insight/composer/service/PrefillFromSourceService.java` — NEW_FROM_COPY AI prefill 백엔드
- `src/main/java/com/zionex/t3series/web/domain/insight/composer/dto/PrefillFromSourceRequest.java` — DTO
- `view/system/usermgmt/users/Users.jsx` — 9-Step 정답지

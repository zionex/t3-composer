# 41d. Composer — 세션 전이 + 4-Step Wizard

> **상위 규칙**: `41-composer-generation.md` 의 §15 (세션 상태 전이) + §16 (통합 4-Step Wizard) 분리.
> NEW_STEP / NEW_FROM_COPY / EXISTING_MODIFY 모드 공통 흐름의 단일 진실 저장소.
> 9-Step Wizard 는 2026-06-11 deprecated (소스 보존 · 진입점 폐기) — §16.7 참조.

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

## §16. 통합 4-Step Wizard (NEW_STEP · NEW_FROM_COPY · EXISTING_MODIFY 공용)

> **2026-06-11 정리**: 신규 화면 생성/수정의 활성 Wizard 는 **4단계** (`ComposerWizard.jsx`) 흐름.
> Layout · 데이터·검색조건 · 메타·메뉴 · 화면 생성 — 4개 단계. 모드별 차이는 prefill 출처뿐:
> - `NEW_STEP`        → `specFromPattern/Mockup/UiPattern()` — 패턴 picker · mockup picker · AI 추천
> - `NEW_FROM_COPY`   → 원본 메뉴 sourceBundle 추출 → spec prefill
> - `EXISTING_MODIFY` → 기존 화면 import → spec prefill
>
> 이전 9-Step Wizard (`StepByStepWizard.jsx` + `steps/Step1..9*.jsx`) 는 2026-06-11 진입점 폐기.
> 소스는 보존되어 있으나 어디서도 진입 안 됨. 상세 — §16.7 deprecated 섹션.

### §16.0 모드별 진입 화면 (Wizard 이전)

| 모드 | 진입 컴포넌트 | Wizard 진입 전 사용자 입력 |
|---|---|---|
| `NEW_STEP`        | `ModeNewStep` → `ComposerWizard` | 패턴 picker (Mockup · UI Pattern · AI 추천 · 빈 캔버스) |
| `NEW_FROM_COPY`   | `ModeNewFromCopy` → `ComposerWizard` | 원본 메뉴 선택 + 신규 메뉴코드 |
| `EXISTING_MODIFY` | `ModeExistingModify` → `ComposerWizard` | 기존 메뉴 선택 |

### §16.1 4단계 목록 (모든 모드 공통)

| # | step | 화면 컴포넌트 | 사용자 작업 |
|---|---|---|---|
| ① | `LAYOUT`   | `LayoutStep.jsx` → `ComposerCanvas.jsx` | Layer 배치 · 12-col grid drag/drop · SplitBar · FilterBar 토글 |
| ② | `DATA`     | `DataAndFilterStep.jsx` | Layer 별 dataSource (NL · Table · SP · ENTITY · SQL 모드) + 검색조건 fields |
| ③ | `META`     | `MetaStep.jsx` | 화면 제목 · MENU_CD · MENU_FILE_PATH · Parent Menu |
| ④ | `GENERATE` | `GenerateStep.jsx` → `createSession` + `ComposerWorkspace` 임베드 | Claude 세션 시작, 자유 채팅으로 추가 변경 |

### §16.2 데이터 모델 단일 진실 저장소

- **`packages/wingui/src/view/util/t3composer/wizardState.js`**
  - `createComposerSpec({ menuCd, title, parentMenuCd, menuFilePath, pattern })` — 빈 ComposerSpec
  - `createComposerLayer({ key, title, type, subtype, position, parentKey })` — Layer 1건 골격
  - **`specFromPattern(patternCode, baseMeta)`** — P02 / BLANK 같은 패턴 picker prefill
  - **`specFromMockup(entry, baseMeta)`** — SCM UI Mockup picker prefill (layers + layoutConfig 자동)
  - **`specFromSynthesized(synth, baseMeta)`** — AI 추천 의 합성 mockup prefill
  - **`specFromUiPattern(entry, baseMeta)`** — T3MES UI Pattern picker prefill
  - **`applyPrefillPatchToComposerSpec(spec, prefillResponse)`** — Ontology Prefill 결과를 spec 에 머지 (§17)
  - `mergeAiPrefillIntoSpec(base, aiSpec)` — AI 추천의 prefill spec 머지
  - `getTopLayers(spec)` / `getChildLayers(spec, parentKey)` — top-level / nested layer 조회

### §16.2.1 ComposerSpec 구조

```js
{
  meta: { menuCd, title, parentMenuCd, menuFilePath, pattern },
  layers: [
    { key, title, type: 'GRID'|'CHART'|'CONTAINER'|...,
      subtype, position: {x,y,w,h},
      dataSource: { mode: 'NL'|'TABLE'|'SP'|'ENTITY'|'SQL'|'MIXED',
                    naturalText, references:[{kind,name}], sqlBlocks:[] },
      columns: [], cascade: {},
      parentKey?  // Container 의 자식 layer
    },
  ],
  relations: [],   // Layer 간 master→detail 관계
  filterBar: { ... },
  _intentNl?,      // 진입 단계 NL (compact 모드 trigger)
  _prefillMeta?,   // ontology prefill confidence + sources
}
```

### §16.3 산출물 매핑 — LLM Prompt 생성

`specToInitialPrompt(spec)` (wizardState.js) 가 ComposerSpec → 자연어 prompt 변환 후
`createSession({ initialMessage })` 로 Claude 세션 첫 turn 에 주입:

- Layer 별 type · subtype · position · dataSource 의도 + references + columns
- FilterBar 의 fields · dependencies · cross-field rules
- Ontology 컨텍스트 인라인 (§17.2)
- 산출물 출력 포맷 (===FILE: 마커) 명시

### §16.4 절대 규칙 (모든 모드 공통)

1. **SP_UI_\*.sql 생성** — `NEW_STEP` 은 신규 화면 시 `SP_UI_<DOMAIN>_<NO>_<ACTION>` DDL 필요 (CRUD 액션마다 1개). read-only 면 `_Q1` 만. MSSQL 방언만. 엔진 service XML 금지. `NEW_FROM_COPY` 는 SP 누락 허용 (기존 endpoint 재사용 자연스러움).
2. **Java Entity + Service + RestController** — `NEW_STEP` 필수. Service 는 JdbcTemplate 으로 SP 호출. Repository 는 선택. `NEW_FROM_COPY` 는 기존 backend 재사용 시 누락 허용.
3. **참조 원본 복제 우선** — Spec 은 "지시" 이고 골격은 원본
   - NEW_STEP        → `Users.jsx` (정답지) · 패턴 (P02/P03/P04/P06) 별 유사 화면
   - NEW_FROM_COPY   → 사용자가 선택한 원본 메뉴의 JSX
4. **허구 import / prop 금지** — `41a §0.6.1` prop 명세 + `41b §5.5` import 화이트리스트 외 사용 금지
5. **출력 맨 앞 4줄 선언 필수** — `참조 원본` · `원본 import 리스트` · `치환 매핑` · `원본에 없는 신규 추가: 없음` (메인 §0.1)

### §16.5 NEW_FROM_COPY 의 AI prefill

NEW_FROM_COPY 진입 직전 sourceBundle 을 LLM 한 번 호출로 분석해 ComposerSpec 을 정확히 prefill.

**Target DB 라우팅**: NEW_FROM_COPY / EXISTING_MODIFY 둘 다 활성 Target 의 운영 DB 사용.
- `MenuTreeBrowser` 가 `useTargetStore.currentTargetCd` 를 `loadTargetMenuTree(lang, targetCd)` 로 전달
- 사용자가 메뉴 선택 시 `collectSourceForLlm(menuCd, targetCd)` 가 `targetCd` 를 body 에 포함
- Backend `TargetDataSourceRegistry.getJdbcTemplate(targetCd)` → 등록된 db_url 의 live DB JdbcTemplate
- 사용자 DB 변경: TargetSystemSelector dropdown → [💾 Storage] → TargetDbConnectionDialog 또는 `.env` 의 `TARGET_<CD>_DB_*` 

**흐름**:
```
원본 메뉴 선택 → collectSourceForLlm(menuCd, activeTargetCd) → sourceBundle
   ↓
SourceBundleAnalysisPanel — wizard 진입 전 SP/URL/Entity 미리보기
   ↓
"AI 자동 분석" 토글 ON (기본) + "다음"
   ↓ ① 정규식 baseline — 항상 (안전망)
   ↓ ② AI prefill (POST /composer/prefill-from-source) — 토글 ON 시
   ↓ ③ mergeAiPrefillIntoSpec — AI 우선, 빈 응답은 baseline 유지
   ↓
ComposerWizard 진입 (initialSpec 주입)
```

**SP 추출 — `grepSpNamesFromBundle`**: sourceBundle 의 모든 텍스트에서 정규식 grep.
패턴: `\b(SP_UI_[A-Z][A-Z0-9_]+|SRV_(?:GET|SET)_SP_UI_[A-Z][A-Z0-9_]+|SP_(?:UI|COMM|UT)_[A-Z][A-Z0-9_]+)\b`

**SP suffix → CRUD 자동 분류**:
- `_Q\d* / _SEARCH / _LIST / _GET / _FIND / SRV_GET_SP_UI_*` → **read**
- `_S\d* / _SAVE / _INSERT / _CREATE / _ADD / SRV_SET_SP_UI_*` → **create**
- `_U\d* / _UPDATE / _MODIFY / _EDIT` → **update**
- `_D\d* / _DELETE / _REMOVE / _DEL` → **delete**

### §16.6 Composer 3-Layer 방어

| 계층 | 매커니즘 |
|---|---|
| **LLM 생성 시** | `ComposerPromptBuilder` 가 ComposerSpec → prompt 변환 + 절대 규칙 + ontology context (§17) 를 system / user message 에 주입 |
| **파일 저장 시** | `pre-tool-use-validator.sh` 가 허구 import/prop (javax.\*, `<SplitPanel initialSizes>`, `textAlign:`, 허구 컬럼) 를 block |
| **아티팩트 적용 시** | `ArtifactApplyService.checkWinguiNativePolicy` 가 정책 차단 3조건 (SP DDL · 엔진 XML · NL 이외 모드 DDL) 검증 |

### §16.7 9-Step Wizard — Deprecated (2026-06-11)

> 이전 9-Step Wizard (`StepByStepWizard.jsx` + `steps/Step1Layout.jsx ~ Step9Generate.jsx` + `StepDataInspector.jsx`) 는
> 2026-06-11 진입점이 모두 제거되었다. **소스는 보존**되어 있으나 어디서도 진입 안 됨.

| 제거된 진입점 | 위치 |
|---|---|
| T3Composer landing 의 "설계서 기반" 카드 | `T3Composer.jsx` `NEW_MODE_OPTIONS` 배열 |
| ModeNewGeneral 의 "Step 별 선택 생성" 서브카드 | `ModeNewGeneral.jsx` `subMode === 'STEP'` 분기 |
| ModeNewFromDesign 의 9-Step 위임 | (소스는 그대로지만 landing 진입 X) |

**부활 방법** — landing 에서 카드 다시 노출하면 즉시 동작:
```js
// T3Composer.jsx NEW_MODE_OPTIONS 에 추가
{ key: MODE.NEW_FROM_DESIGN, step: 4, title: '설계서 기반', ... }
```

**관련 deprecated 파일** (삭제 금지 — 부활 시 필요):
- `frontend/src/view/util/t3composer/StepByStepWizard.jsx`
- `frontend/src/view/util/t3composer/StepDataInspector.jsx`
- `frontend/src/view/util/t3composer/steps/Step{1..9}*.jsx` (9개)
- `frontend/src/view/util/t3composer/ModeNewFromDesign.jsx`
- `backend/.../service/PrefillFromDesignService.java`
- `backend/.../service/PrefillFromSourceService.java` (NEW_FROM_COPY 의 9-step JSON 응답 — 4-Step ComposerSpec 으로 마이그레이션 시 정리 후보)

### §16.8 Anti-patterns

| ❌ | ✅ |
|---|---|
| 9-Step 잔재 표현 (StepByStepWizard / step1_layout / Step9Generate / 9단계) 을 신규 코드/문서에 사용 | 4-Step 표현으로 통일 — ComposerWizard / LayoutStep / DataAndFilterStep / MetaStep / GenerateStep |
| `ComposerSpec.layers[].dataSource.mode` 누락 | 'NL' / 'TABLE' / 'SP' / 'ENTITY' / 'SQL' / 'MIXED' 중 하나 명시 |
| Layer 의 position 누락 (RGL 12-col grid 깨짐) | `{x,y,w,h}` 4개 필드 모두 필수 — 0~11 좌표 + 1~12 크기 |
| Container layer 자식들이 `parentKey` 없이 top-level 에 노출 | `parentKey: <containerKey>` 명시 — `getChildLayers` 가 인식 |
| `_intentNl` / `_prefillMeta` 같은 보조 필드 임의 제거 | compact 모드 · ontology confidence 보더 동작에 필요 — 보존 |
| 신규 화면 `dataSource.mode='SP'` 에서 신규 SP 생성 | 사전 등록된 SP만 연결 · 없으면 NL 모드로 또는 관리자에게 등록 요청 |
| FilterBar 의 SCM 도메인 필드를 일반 `DROPDOWN` 으로 | `DOMAIN_PLAN_SCOPE`/`DOMAIN_ITEM_MULTI` 등 도메인 타입 (`rules/22-filter-bar.md`) |

---

## 관련 파일

### 활성 (4-Step Wizard)
- `41-composer-generation.md` — 메인 (§0 참조 원본 / §14 Anti-patterns)
- `41a-composer-jsx.md` — JSX 표준 (§0.6.1 prop 명세)
- `41b-composer-java.md` — Java 백엔드 표준 (import 화이트리스트)
- `41c-composer-widgets.md` — 위젯 카탈로그 + Cascade
- `frontend/src/view/util/t3composer/wizardState.js` — ComposerSpec 데이터 모델 + prefill 함수 (spec*FromPattern/Mockup/Synthesized/UiPattern · applyPrefillPatchToComposerSpec · specToInitialPrompt · grepSpNamesFromBundle · mergeAiPrefillIntoSpec)
- `frontend/src/view/util/t3composer/ComposerWizard.jsx` — 4-Step 컨테이너
- `frontend/src/view/util/t3composer/{Layout,DataAndFilter,Meta,Generate}Step.jsx` — 각 단계
- `frontend/src/view/util/t3composer/ComposerCanvas.jsx` — Layout 단계의 시각 편집기
- `frontend/src/view/util/t3composer/{ModeNewStep,ModeNewFromCopy,ModeExistingModify}.jsx` — 진입 화면
- `frontend/src/view/util/t3composer/api.js` — `prefillFromSource()` · `prefillSpecFromOntology()` 등
- `backend/.../service/PrefillFromSourceService.java` — NEW_FROM_COPY AI prefill 백엔드

### Deprecated (소스 보존 — §16.7)
- `frontend/src/view/util/t3composer/StepByStepWizard.jsx` — 9-Step 컨테이너 (진입점 없음)
- `frontend/src/view/util/t3composer/StepDataInspector.jsx` — 9-Step 의 collapsible JSON viewer
- `frontend/src/view/util/t3composer/steps/Step{1..9}*.jsx` — 9-Step UI
- `frontend/src/view/util/t3composer/ModeNewFromDesign.jsx` — 설계서 모드 (진입점 카드 숨김)
- `backend/.../service/PrefillFromDesignService.java` — 설계서 AI prefill

### 참조 원본
- `view/system/usermgmt/users/Users.jsx` — wingui 운영 화면 정답지 (모든 Wizard 모드의 참조)

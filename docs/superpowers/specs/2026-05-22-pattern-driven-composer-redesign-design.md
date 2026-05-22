# Pattern-Driven Composer Redesign — Design

**Date**: 2026-05-22
**Status**: Draft (브레인스토밍 합의 후 사용자 리뷰 대기)
**Author**: brainstorming session (eunjoo_hwang + Claude)
**Owner**: t3-composer frontend (+ 일부 backend prompt 보강)

## Goal

기존 **9-Step Wizard 중심** 의 신규 화면 생성 모델을 **패턴 → 자동 layer 구성 → 시각 직접 조작 + Mini Dialog** 모델로 전환한다. SCM Mockup (54) · UI Pattern (730) 등 이미 풍부하게 구축된 패턴 카탈로그가 layer 골격을 결정하고, 사용자는 시각 편집기에서 각 영역(layer / FilterBar) 을 클릭해 데이터(자연어 + Table·SP·Entity 참조) 만 채운다.

## Why

### 현재 문제
- **패턴과 9-Step 의 중복**: 사용자가 SCM Mockup 또는 UI Pattern 을 고르면 layout 과 컴포넌트가 이미 결정되는데, Step1 (Layout) · Step3 (Components) 에서 다시 입력하게 만들어 의미 중복 (브레인스토밍 turn 1).
- **Layer 모델의 깨짐**: `COMPONENT_CATALOG` 가 layer 자격이 없는 항목(`INPUT_TEXT`/`BTN_SINGLE`/`FEEDBACK_ALERT` 등)까지 layer 후보로 노출해 "텍스트박스 한 개가 layer" 같은 비현실적 선택 가능. 사용자 지적: "Layer 구성에 버튼이나 이런게 필요한건지" (turn 5).
- **FilterBar 와 Body Layer 의 모델 혼동**: LayoutDesigner 가 FilterBar 항목 칩과 body layer 들을 한 줄에 섞어 표시. 본질은 둘이 별개 모델 (FilterBar = 화면 1개, layer = 본문 N개) 인데 시각 표현이 동일.
- **Wizard 순서 강제의 비효율**: 데이터 소스(Step4·5·7) 가 핵심인데도 Layout(Step1) → Overview(Step2) → Components(Step3) 를 먼저 거쳐야 도달.
- **5개 NEW_* 모드 흐름 분기**: NEW_GENERAL / NEW_NL / NEW_STEP / NEW_FROM_DESIGN / NEW_FROM_COPY 가 각자 다른 진입 UX 와 prefill 로직을 유지 → 코드 분기 다수, 사용자 학습 부담.

### 새 모델의 이점
- 사용자는 **시각으로 즉시 결과 확인하며 데이터만 채움** — 모든 layer 가 한 화면에 보이는 상태로 클릭 → mini dialog 편집
- **Wizard 순서 강제 사라짐** — 사용자가 보이는 곳부터 자유롭게 채울 수 있음
- **5개 진입점은 유지** (사용자 친숙함 보존), 내부 흐름만 새 모델로 통일 → 마이그레이션 비용 최소화
- 기존 인프라 (`ArtifactPreviewService` 화면실행, AI mockup 변환, AI 자동보완, ChatPanel 자연어 보정) 그대로 재활용

## Non-Goals

- **5개 NEW_* 모드 진입점 통합/폐지** — 진입점은 그대로 유지 (사용자 결정, brainstorming turn 8). 내부 흐름만 새 모델로 통일.
- **`.claude/rules/41d-composer-wizard.md` 의 9-Step Wizard 규약 자체 삭제** — 새 모델 정착 후 별도 PR. Phase 1 에서는 rule 은 그대로 두되 코드만 새 모델로.
- **EXISTING_MODIFY 모드의 흐름 변경** — 기존 화면 자연어 수정은 본 디자인 범위 외. 단 mini dialog 일부 재사용 가능.
- **SCM Mockup / UI Pattern 카탈로그 자체의 보강** — 기존 54 + 730 항목 그대로 사용.
- **Backend SP/Java/Entity 산출물 형식 변경** — 변경 없음.

## Architecture

### 데이터 흐름 (5개 진입점 → 공통 spec → 시각 편집)

```
┌─────────────────────────────────────────────────────────────┐
│ ① 진입점 5개 (각자 source 만 다름)                            │
│   ┌────────────┬────────────┬──────────┬──────────┬────────┐│
│   │NEW_GENERAL │ NEW_NL     │ NEW_STEP │ FROM_DSGN│ FROM_CP││
│   │자연어+Mockup│자연어 단순 │ 패턴 only│ 설계서 업│원본복사 ││
│   │+UI Pattern │            │          │ 로드+파싱│         ││
│   └────────────┴────────────┴──────────┴──────────┴────────┘│
│              ↓ 각자 source → 공통 spec 변환                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ ② Layer 골격 자동 prefill — 공통 spec                        │
│   {                                                          │
│     filterBar: { items: [...] },                             │
│     layers:    [{key, type, position, dataSource, ...}],     │
│     pattern:   'P02' | 'MOCKUP_*' | 'UIPATTERN_*' | 'BLANK'  │
│   }                                                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ ③ ComposerCanvas (신규) — 시각 편집기                        │
│   ┌─────────────────────────────────────────────┐           │
│   │ 🔍 FilterBar (노란 띠)                       │ ← 클릭   │
│   │   [USERNAME] [ENABLED] [+필드]               │          │
│   ├─────────────────────────────────────────────┤           │
│   │ 📐 Body Layers (색 박스 + 타이틀)             │          │
│   │   ┌────────────────┐  ┌────────────────┐    │ ← 클릭   │
│   │   │ 메인 그리드     │  │ 차트            │    │          │
│   │   └────────────────┘  └────────────────┘    │          │
│   └─────────────────────────────────────────────┘           │
│                ↓ 클릭 시                                     │
│   ┌─────────────────────────────────────────────┐           │
│   │ ⚙ DataMiniDialog (신규)                      │           │
│   │   💬 자연어 입력                             │          │
│   │   🔗 Data 객체 참조 [TB_AD_USER ✕] [+Table]  │           │
│   │   ▶ AI 추론 결과 미리보기                    │          │
│   │   [적용] [취소] [🔍 Data Source 탐색]       │           │
│   └─────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ ④ 자동 화면 실행 + AI 자동보완 + ChatPanel 자연어 보정       │
│   (기존 인프라 그대로 재활용)                                │
└─────────────────────────────────────────────────────────────┘
```

### 컴포넌트 변경 매트릭스

| 파일 / 컴포넌트 | 변경 종류 | 비고 |
|---|---|---|
| `frontend/src/view/util/t3composer/ComposerCanvas.jsx` | **신규** | LayoutDesigner 의 후신. FilterBar 노란 띠 + body layers 시각 분리. 클릭 → mini dialog. 9-Step Wizard 대체 |
| `frontend/src/view/util/t3composer/DataMiniDialog.jsx` | **신규** | 자연어 + Data 참조 칩 (Table/SP/Entity) + AI 추론 미리보기. 풀스크린 탐색 진입 |
| `frontend/src/view/util/t3composer/FilterBarMiniDialog.jsx` | **신규** | FilterBar 전용 — 필드 추가/제거, cascade, 어느 layer 에 영향 매핑 |
| `frontend/src/view/util/t3composer/LayoutDesigner.jsx` | **단순화** | "위젯 셀렉터" 제거 (Layer 종류는 패턴이 결정). Layer 박스 시각 표현만 유지. 미세조정 모드(layer 추가/이동) 는 선택적 활성 |
| `frontend/src/view/util/t3composer/constants.js` (`COMPONENT_CATALOG`) | **축소** | 10그룹 80개 → 5그룹 41개. INPUT/INPUT_DOMAIN/ACTION/FEEDBACK/NAVIGATION/MODAL/DRAWER 제거 |
| `frontend/src/view/util/t3composer/StepByStepWizard.jsx` | **제거 또는 deprecated** | 9-Step Wizard. 새 모델로 대체. 단 NEW_STEP 모드는 진입 시 ComposerCanvas 로 라우팅 |
| `frontend/src/view/util/t3composer/steps/Step*.jsx` (9개) | **제거** | 9-Step 의 각 step 컴포넌트 |
| `frontend/src/view/util/t3composer/ModeNewGeneral.jsx` | **수정** | 자연어 입력 + Mockup/Pattern picker + 파일 첨부 + Data 참조 picker 유지. 결과를 ComposerCanvas 로 전달 |
| `frontend/src/view/util/t3composer/ModeNewFromCopy.jsx` | **수정** | 원본 메뉴 선택 → sourceBundle 분석 → ComposerCanvas prefill |
| `frontend/src/view/util/t3composer/ModeNewFromDesign.jsx` | **수정** | 설계서 업로드 → 파싱 → ComposerCanvas prefill |
| `frontend/src/view/util/t3composer/wizardState.js` | **수정** | `createInitialSpec` / `createInitialSpecFromSource` / `createInitialSpecFromDesign` 유지하되 9-Step 의 spec 구조 → 공통 spec 구조로 단순화 |
| `frontend/src/view/util/t3composer/DataSourcePickerDialog.jsx` | **유지** | 풀스크린 별자리 맵. mini dialog 의 `🔍 Data Source 탐색` 버튼에서 호출 |
| `backend/.../service/PrefillFromSourceService.java` | **유지·소폭 수정** | NEW_FROM_COPY 의 AI prefill. spec 구조 단순화에 따라 응답 형식 조정 |
| `backend/.../prompt/ComposerPromptBuilder.java` | **수정** | mode 별 `newStepGuide(...)` 의 9-Step JSON 구조 가이드 → 새 spec 구조 가이드 |

### 새 spec 구조 (단순화)

기존 9-Step 의 `step1_layout` / `step2_overview` / ... / `step8_filterCascade` 구조를 다음과 같이 단순화:

```typescript
type ComposerSpec = {
  meta: {
    title: string;           // 화면 제목
    menuCd: string;          // UI_<DOMAIN>_<NAME>
    menuFilePath: string;    // /<module>/<PascalName>
    parentMenuCd: string;    // MENU_<DOMAIN>
    pattern: string;         // 'P02' | 'MOCKUP_<code>' | 'UIPATTERN_<id>' | 'BLANK'
  };
  filterBar: {
    items: Array<{
      key: string;
      label: string;
      type: 'TEXT' | 'NUMBER' | 'SELECT' | 'DATE_RANGE'
          | 'DOMAIN_PLAN_SCOPE' | 'DOMAIN_ITEM_MULTI' | ...;
      cascade?: { parent: string; filterParam: string };
      // 각 필드는 22-filter-bar.md 의 FilterBar JSON 호환
    }>;
    affects: Record<string, string[]>;   // layerKey → 영향받는 filterBar item keys
  };
  layers: Array<{
    key: string;             // 'mainGrid', 'detailGrid', ...
    title: string;           // '메인 그리드', '상세 그리드', ...
    type: 'GRID' | 'CHART' | 'CONTAINER' | 'DOCUMENT' | 'AI';
    subtype?: string;        // 'GRID_BASE' | 'CHART_BAR' | 'CONTAINER_TAB' | ...
    position: { x, y, w, h };   // RGL grid position
    dataSource: {
      mode: 'NL' | 'TABLE' | 'SP' | 'ENTITY' | 'MIXED';
      naturalText?: string;        // 자연어 설명
      references: Array<{
        kind: 'TABLE' | 'SP' | 'ENTITY';
        name: string;              // 'TB_AD_USER' | 'SP_UI_AD_01_Q1' | 'User'
      }>;
    };
    columns?: Array<{ name, dataType, headerText, ... }>;   // grid layer 만
    cascade?: { ... };
  }>;
};
```

### Layer 카탈로그 정리 (`COMPONENT_CATALOG`)

기존 10그룹 → 5그룹으로 축소. 제거 그룹의 항목은 새 위치로 이주.

| 유지 그룹 (5개) | 항목 수 | 본문 layer 자격 |
|---|---|---|
| `CONTAINER` | 3 (TAB · CARD · DASHBOARD_PANEL) | ✓ (DRAWER · MODAL 은 제거) |
| `DATA_DISPLAY` | 12 | ✓ |
| `CHART` | 17 | ✓ |
| `DOCUMENT` | 5 | ✓ |
| `AI` | 4 | ✓ |
| **합계** | **41** | — |

| 제거 그룹 | 항목 | 이주 위치 |
|---|---|---|
| `INPUT` (14) | 텍스트/숫자/날짜/체크박스/라디오 등 | **FilterBar 필드 타입** 또는 Container 자식 (편집기에서 자동) |
| `INPUT_DOMAIN` (7) | PlanScope/품목/거래처/거점/자원/사용자/버전 | **FilterBar 도메인 필드 타입** |
| `ACTION` (5) | 단일/그룹/Area/GridCRUD/Global 버튼 | Grid 자동 제공 (`GridSaveButton` 등) · 글로벌은 `setViewInfo` |
| `FEEDBACK` (6) | 알림/스낵바/다이얼로그/진행/뱃지/툴팁 | framework 자동 (`showMessage` 등) |
| `NAVIGATION` (5) | 사이드바/브레드크럼/스텝퍼/마법사/드릴다운 | 화면 골격 또는 framework — 카탈로그에서 제거 |
| `CONTAINER` 일부 (2) | DRAWER · MODAL | 별도 화면 / 팝업이라 layer 가 아님 — 제거 |

### Mini Dialog 디자인 (DataMiniDialog · FilterBarMiniDialog)

**DataMiniDialog** (layer 클릭 시):
- 헤더: layer 타이틀 + 패턴/모듈 컨텍스트
- 💬 자연어 입력창 (메인) — textarea
- 🔗 Data 객체 참조 영역 — 현재 참조된 객체들이 칩으로 표시 + `+ Table` · `+ SP` · `+ JPA Entity` · `🔍 Data Source 탐색` 버튼
  - 일반 `+ Table` 클릭 → 간단한 dropdown autocomplete (이름 typing)
  - `🔍 Data Source 탐색` 클릭 → 기존 `DataSourcePickerDialog` 풀스크린 (별자리 맵 + Ontology + Query Inline 3탭)
- ▶ AI 추론 미리보기 — 자연어 + 참조를 LLM 한 번 호출로 분석, 결정된 컬럼/필드 수 표시
- [적용] / [취소] / [🔍 Data Source 탐색]

**FilterBarMiniDialog** (FilterBar 노란 띠 클릭 시):
- 현재 필드 목록 (chip 또는 list) + 각 필드 inline 편집 (label, type, cascade)
- `+ 필드 추가` 버튼 — 일반 input / DOMAIN_* 도메인 input 분류 표시
- "어느 layer 에 영향 주는지" 매핑 — checkbox 그리드 (필드 × layer)
- [적용] / [취소]

### FilterBar 시각 분리 (ComposerCanvas)

LayoutDesigner 의 현 구조 (FilterBar items 칩 + body layers 가 한 줄에 섞임) 를 다음과 같이 명시 분리:

```
┌─────────────────────────────────────────────┐
│ 🔍 검색조건 (FilterBar) · 화면 전체 공용     │ ← 노란 띠 (#fef3c7 bg, #f59e0b border)
│   [USERNAME] [ENABLED] [+ 필드]              │   클릭 → FilterBarMiniDialog
├─────────────────────────────────────────────┤
│ 📐 본문 (Body Layers)                       │ ← 파란 라벨
│   ┌──────────────────────┐                  │
│   │ 메인 그리드 (Layer)   │                  │ ← 각 layer 박스 클릭 → DataMiniDialog
│   └──────────────────────┘                  │
└─────────────────────────────────────────────┘
```

### 5개 NEW_* 모드의 진입점 동작 (정정)

| 모드 | 진입 UX | 결과 |
|---|---|---|
| `NEW_GENERAL` | 현재 ModeNewGeneral 그대로 (자연어 + Mockup/Pattern picker + 파일 첨부 + Data Source picker) | 입력 후 ComposerCanvas 진입, layer 자동 prefill |
| `NEW_NL` | 자연어 입력창만 (단순) | Claude 가 spec 추론 → ComposerCanvas 진입 |
| `NEW_STEP` | "패턴 picker" 화면 (SCM Mockup + UI Pattern + 빈 캔버스) | 선택한 패턴의 layer 구조 → ComposerCanvas 진입. 기존 9-Step Wizard 폐기 |
| `NEW_FROM_DESIGN` | 설계서 업로드 + 시트 검토 (현재 그대로) | 파싱 → ComposerCanvas 진입 |
| `NEW_FROM_COPY` | 원본 메뉴 선택 (Target 메뉴 트리, 현재 그대로) | sourceBundle 분석 → ComposerCanvas 진입 |

진입 후 흐름이 동일하다는 점이 핵심. 각 모드의 진입 단계는 source 차이만 있고, 결과는 모두 공통 `ComposerSpec` 으로 변환.

## 기존 인프라 재활용

- **ArtifactPreviewService** (화면 실행 / AI mockup 변환 / 캐시) — 그대로
- **AI 자동보완 (apply 오류 + 런타임 오류)** — 그대로 (`rules/50 §14.1`)
- **ChatPanel 자연어 보정** — 그대로
- **DataSourcePickerDialog** (별자리 맵 + Ontology + Query Inline) — mini dialog 의 풀스크린 탐색 진입점으로
- **TargetSystemSelector / Per-Target 운영 DB 접근** — 그대로
- **PrefillFromSourceService** (NEW_FROM_COPY 의 AI prefill) — 응답 형식만 새 spec 으로 조정
- **FilterBar JSON Schema (`.claude/schemas/filter-bar.schema.json`)** — 그대로 (FilterBarMiniDialog 가 호환 JSON 생성)

## Migration Strategy

Phase 단위 점진 마이그레이션 — 한 PR 에 다 묶지 않음.

### Phase 1 — 신규 컴포넌트 + 카탈로그 정리 (이 spec 의 핵심)
1. `COMPONENT_CATALOG` 5그룹으로 축소 (constants.js)
2. `ComposerSpec` 타입 정의 (wizardState.js 새 export)
3. `ComposerCanvas.jsx` 신규 작성
4. `DataMiniDialog.jsx` / `FilterBarMiniDialog.jsx` 신규 작성
5. `NEW_STEP` 모드 진입을 ComposerCanvas 로 라우팅 (9-Step Wizard 진입점 차단)
6. 기존 9-Step Wizard 코드는 남겨두되 진입 경로 차단 (즉시 삭제 X)

### Phase 2 — 나머지 NEW_* 모드 통합
1. `NEW_GENERAL` / `NEW_NL` / `NEW_FROM_DESIGN` / `NEW_FROM_COPY` 의 결과를 `ComposerSpec` 으로 통일
2. `PrefillFromSourceService` 응답 형식 조정
3. `ComposerPromptBuilder` 의 mode 별 가이드를 새 spec 구조로 갱신
4. 각 Mode 컴포넌트가 입력 받은 결과 → ComposerCanvas 로 prefill

### Phase 3 — 정리
1. 9-Step Wizard 관련 코드 제거 (StepByStepWizard / Step1Layout..Step9Generate 9개 파일)
2. `wizardState.js` 의 9-Step spec 호환 코드 제거
3. `.claude/rules/41d-composer-wizard.md` 의 9-Step 규약 → 새 모델 규약으로 재작성
4. 문서 갱신 (`CLAUDE.md` · `rules/20-screen-development.md` · `rules/41-composer-generation.md`)

각 Phase 별로 독립 PR. Phase 1 만 머지해도 새 모델이 NEW_STEP 모드에서 동작 (다른 4모드는 기존 흐름 유지).

## Open Questions

다음 결정은 implementation plan 단계에서 정리:

1. **ComposerSpec 의 `layers[].position` 형식** — react-grid-layout (RGL) 기반 `{x,y,w,h}` 그대로? 아니면 패턴 종속의 named position (`'left'`/`'right'`/`'tab1'`)?
2. **Mini Dialog 위치** — 우측 fixed panel (LayoutDesigner 우측) 인가, Popper 형태 (클릭한 layer 근처) 인가, 풀스크린 modal 인가?
3. **DataMiniDialog 의 AI 추론 trigger 시점** — 자연어 입력 후 사용자가 명시 [추론] 누를 때만? 또는 debounce 후 자동?
4. **FilterBarMiniDialog 의 cascade 표현** — 단순 dependency 만 다룰지, 22-filter-bar.md 의 dependencies + cross_field_rules 전체 다룰지?
5. **NEW_NL 의 진입 위치** — NEW_GENERAL 이 사실상 NEW_NL 의 상위 집합인데, NEW_NL 을 별도 유지? 아니면 NEW_GENERAL 통합?
6. **Layer 의 미세조정 모드** — ComposerCanvas 의 "패턴이 만든 layer 그대로" vs "사용자가 layer 추가/이동" 의 토글 UX 결정 필요.

## Risk

- **5개 진입점 유지** 결정으로 마이그레이션 부담은 줄지만 코드 분기 5곳은 계속 유지됨. Phase 2 의 spec 통일이 늦어지면 모드별 prefill 로직 중복 위험.
- **9-Step Wizard 사용자에게 친숙한 흐름이 갑자기 사라짐** — NEW_STEP 모드 사용자에게 큰 변화. Phase 1 머지 후 사용 피드백 필요.
- **Mini Dialog 의 AI 추론 비용** — 자연어 입력마다 LLM 호출 시 토큰 비용 증가. debounce / 명시 trigger 결정으로 완화.
- **`COMPONENT_CATALOG` 축소** — 기존 산출물에 제거된 컴포넌트 코드(`INPUT_TEXT` 등) 가 layer.componentType 으로 저장된 경우 마이그레이션 필요. 단 운영 데이터에서는 거의 발생하지 않음 (사용자가 INPUT_TEXT 를 layer 로 만들 동기 없음).

## References

- 본 디자인의 브레인스토밍 흐름: `.superpowers/brainstorm/6874-1779415023/content/*.html` (full-picture.html, before-after-flow.html, mini-dialog-input-v2.html, filterbar-separation.html, data-input-flow.html)
- 현재 9-Step Wizard 규약: `.claude/rules/41d-composer-wizard.md`
- 화면 개발 일반 규약: `.claude/rules/20-screen-development.md` · `.claude/rules/41-composer-generation.md`
- Layer 카탈로그 현재 소스: `frontend/src/view/util/t3composer/constants.js` (`COMPONENT_CATALOG`)
- 패턴 데이터:
  - SCM Mockup 54개: `frontend/src/view/util/t3mockup/index.js` (`MOCKUP_ENTRIES`)
  - UI Pattern 730개: `frontend/public/t3mes-split/{full,lite}/` + `frontend/src/view/util/t3composerpatterns/_data/t3mes-tabs.json`
- 기존 디자인 패턴 참조: `docs/superpowers/specs/2026-05-15-target-rule-hook-injection-design.md`

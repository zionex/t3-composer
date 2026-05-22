# Composer Canvas (Phase 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 9-Step Wizard 의 대체로 **패턴 선택 → 자동 layer prefill → 시각 직접 조작 + Mini Dialog** 모델의 첫 단위를 동작 가능한 형태로 도입한다. 기존 NEW_NL/COPY/DESIGN 모드는 손대지 않고, 새 진입점 `NEW_STEP` (패턴 picker) 에서만 ComposerCanvas 가 활성된다.

**Architecture:** 컴포넌트 4종 신규 (`ComposerCanvas` · `DataMiniDialog` · `FilterBarMiniDialog` · `ModeNewStep`) + `COMPONENT_CATALOG` 5그룹 41개로 축소 + `ComposerSpec` 팩토리 추가 + `T3Composer.jsx` ModeSelector 에 `NEW_STEP` 카드 추가. 기존 `LayoutDesigner` / `StepByStepWizard` / `Step1Layout..Step9Generate` 코드는 그대로 두고 진입 경로만 차단.

**Tech Stack:** React 18 + MUI 5 + react-hook-form + zustand + react-grid-layout. **테스트 인프라 없음 (Jest/Vitest/RTL 미설치)** — TDD 대신 **webpack 빌드 + dev server 시각 검증** 으로 각 task 검증.

**Spec:** `docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md`

**Dev 환경**: composer-frontend 컨테이너가 webpack-dev-server (port 5173) 로 자동 hot-reload. 로그 확인: `docker compose logs --tail=50 composer-frontend`. UI 접근: `http://localhost:5173`.

---

## File Structure

| 파일 | 변경 종류 | 책임 |
|---|---|---|
| `frontend/src/view/util/t3composer/constants.js` (`COMPONENT_CATALOG`) | **축소** | 10그룹 80개 → 5그룹 41개. `INPUT` · `INPUT_DOMAIN` · `ACTION` · `FEEDBACK` · `NAVIGATION` 그룹 전체 + `CONTAINER` 의 `CONTAINER_DRAWER` · `CONTAINER_MODAL` 제거. `MODE` 객체에 `NEW_STEP` 추가 |
| `frontend/src/view/util/t3composer/wizardState.js` | **export 추가** | `createComposerSpec({ menuCd, title, pattern })` 팩토리 + `LAYER_TYPES` 상수 export. 기존 9-Step 코드는 그대로 유지 |
| `frontend/src/view/util/t3composer/DataMiniDialog.jsx` | **신규** | Layer 클릭 시 뜨는 MUI Dialog. 자연어 textarea + 참조 칩 (`+ Table`/`+ SP`/`+ JPA Entity`) + AI 추론 미리보기 + `🔍 Data Source 탐색` (기존 DataSourcePickerDialog 호출) |
| `frontend/src/view/util/t3composer/FilterBarMiniDialog.jsx` | **신규** | FilterBar 노란 띠 클릭 시 뜨는 MUI Dialog. 필드 목록 inline 편집 + `+ 필드 추가` + layer 영향 매핑 grid |
| `frontend/src/view/util/t3composer/ComposerCanvas.jsx` | **신규** | 상단 노란 띠 (FilterBar 시각 zone, 클릭 → FilterBarMiniDialog) + 본문 layer 박스 grid (react-grid-layout 사용, 클릭 → DataMiniDialog). 미세조정 모드 토글 (layer 추가/이동) 은 Phase 1 에선 OFF 고정 |
| `frontend/src/view/util/t3composer/ModeNewStep.jsx` | **신규** | NEW_STEP 모드 진입 화면. 패턴 picker 3 옵션: SCM Mockup (기존 MockupPickerDialog 재활용) / UI Pattern (기존 UiPatternPickerDialog 재활용) / 빈 캔버스. 선택 후 ComposerSpec prefill → ComposerCanvas 진입 |
| `frontend/src/view/util/t3composer/T3Composer.jsx` | **2곳 수정** | (a) ModeSelector 에 `NEW_STEP` 카드 추가 (b) 라우팅 분기에 `mode === MODE.NEW_STEP && <ModeNewStep ... />` 추가 |

**기존 활용**:
- `MockupPickerDialog.jsx` / `UiPatternPickerDialog.jsx` — 그대로 재활용
- `DataSourcePickerDialog.jsx` — DataMiniDialog 에서 풀스크린 탐색 진입점으로 호출
- `COMPONENT_INDEX` (constants.js, COMPONENT_CATALOG 와 같이 export) — 축소된 카탈로그에서 자동 재생성

**테스트 인프라 부재**: `frontend/package.json` 에 Jest/Vitest/RTL 의존성 없음 + `*.test.*` 파일 0개. unit test 추가 시 인프라 셋업 부담이 Phase 1 스코프 초과. → **빌드 검증 (webpack 컴파일 에러 0) + 수동 smoke 시나리오 (Task 7) 로 대체**.

---

## Task 1: COMPONENT_CATALOG 축소 + MODE.NEW_STEP 추가

**Files:**
- Modify: `frontend/src/view/util/t3composer/constants.js`

- [ ] **Step 1: 현재 MODE 객체 위치 확인**

```bash
grep -n "^export const MODE\|^const MODE\|^export const COMPONENT_CATALOG" frontend/src/view/util/t3composer/constants.js
```

Expected: `MODE` 객체와 `COMPONENT_CATALOG` 라인 번호 두 개 노출.

- [ ] **Step 2: MODE 객체에 NEW_STEP 추가**

기존 MODE 객체 (예: `export const MODE = { NEW_NL: 'NEW_NL', NEW_FROM_COPY: 'NEW_FROM_COPY', NEW_FROM_DESIGN: 'NEW_FROM_DESIGN', EXISTING_MODIFY: 'EXISTING_MODIFY' };`) 의 마지막 항목 앞에 한 줄 추가:

```js
NEW_STEP: 'NEW_STEP',
```

- [ ] **Step 3: COMPONENT_CATALOG 5그룹 41개로 교체**

`COMPONENT_CATALOG` 의 `groups: [...]` 배열 전체를 다음으로 교체. 5그룹만 남기고 `INPUT` · `INPUT_DOMAIN` · `ACTION` · `FEEDBACK` · `NAVIGATION` 그룹 전체 + `CONTAINER` 의 `CONTAINER_DRAWER` · `CONTAINER_MODAL` 제거:

```js
groups: [
  {
    code: 'CONTAINER',
    label: '컨테이너',
    color: '#8b5cf6',
    items: [
      { code: 'CONTAINER_TAB',             label: '탭 컨테이너',      level: 'L1' },
      { code: 'CONTAINER_CARD',            label: '카드',             level: 'L1' },
      { code: 'CONTAINER_DASHBOARD_PANEL', label: '대시보드 패널',    level: 'L1' },
    ],
  },
  {
    code: 'DATA_DISPLAY',
    label: '데이터 표시',
    color: '#3b82f6',
    items: [
      { code: 'GRID_BASE',      label: '기본 그리드',     multi_instance: true,
        config: { multi_select: true, excel_export: true, inline_edit: true } },
      { code: 'GRID_TREE',      label: '트리 그리드',     multi_instance: true },
      { code: 'GRID_CROSSTAB',  label: '크로스탭 그리드', multi_instance: true,
        config: { iteration: { prefix: 'DATE_', delimiter: '-' } } },
      { code: 'GRID_PIVOT',     label: '피벗 테이블' },
      { code: 'TREE_VIEW',      label: '트리 뷰' },
      { code: 'FILE_TREE',      label: '파일 트리' },
      { code: 'CARD_LIST',      label: '카드 리스트' },
      { code: 'TIMELINE',       label: '타임라인' },
      { code: 'CALENDAR_MONTH', label: '월간 캘린더' },
      { code: 'CALENDAR_WEEK',  label: '주간 캘린더' },
      { code: 'SCHEDULER',      label: '스케줄러' },
      { code: 'KANBAN_BOARD',   label: '칸반 보드', status: 'NEW' },
    ],
  },
  {
    code: 'CHART',
    label: '차트·시각화',
    color: '#f59e0b',
    items: [
      { code: 'CHART_LINE',        label: '선 차트',       data_source: ['manual', 'sp', 'kpi_dictionary'] },
      { code: 'CHART_BAR',         label: '막대 차트',     data_source: ['manual', 'sp', 'kpi_dictionary'] },
      { code: 'CHART_STACKED_BAR', label: '누적 막대' },
      { code: 'CHART_PIE',         label: '파이 차트' },
      { code: 'CHART_DONUT',       label: '도넛 차트' },
      { code: 'CHART_AREA',        label: '영역 차트' },
      { code: 'CHART_SCATTER',     label: '산점도' },
      { code: 'CHART_BOXPLOT',     label: '박스플롯' },
      { code: 'CHART_HEATMAP',     label: '히트맵', status: 'NEW' },
      { code: 'CHART_GAUGE',       label: '게이지' },
      { code: 'CHART_COMBO',       label: '혼합 차트' },
      { code: 'CHART_GANTT',       label: '간트 차트' },
      { code: 'KPI_CARD',          label: 'KPI 카드',      data_source: ['kpi_dictionary'] },
      { code: 'DIAGRAM_FLO',       label: 'FLO 다이어그램' },
      { code: 'DIAGRAM_NETWORK',   label: '네트워크 그래프' },
      { code: 'MAP_GOOGLE',        label: '지도 (Google)' },
      { code: 'MAP_VECTOR',        label: '벡터 지도' },
    ],
  },
  {
    code: 'DOCUMENT',
    label: '문서·미디어',
    color: '#6366f1',
    items: [
      { code: 'DOC_PDF_VIEWER',      label: 'PDF 뷰어' },
      { code: 'DOC_MARKDOWN_VIEWER', label: '마크다운 뷰어' },
      { code: 'DOC_IMAGE_VIEWER',    label: '이미지 뷰어' },
      { code: 'DOC_DIFF_VIEWER',     label: '차이점 뷰어', status: 'NEW' },
      { code: 'DOC_FILE_DROPZONE',   label: '파일 드롭존' },
    ],
  },
  {
    code: 'AI',
    label: 'AI·Insight',
    color: '#d946ef',
    items: [
      { code: 'AI_CHAT_PANEL',       label: 'AI 채팅',         status: 'NEW' },
      { code: 'AI_INSIGHT_CARD',     label: '인사이트 카드',   status: 'NEW' },
      { code: 'AI_SIMULATION_PANEL', label: '시뮬레이션 AI' },
      { code: 'AI_ONTOLOGY_EDITOR',  label: '온톨로지 편집기' },
    ],
  },
],
```

- [ ] **Step 4: webpack 컴파일 에러 확인**

Run: `docker compose logs --tail=80 composer-frontend 2>&1 | grep -iE "error|fail" | head -20`
Expected: 컴파일 에러 0건. (LayoutDesigner.jsx 에서 `COMPONENT_CATALOG.groups.flatMap` 사용 중인데 group 수 줄어도 호환 — 에러 없음)

- [ ] **Step 5: dev server 시각 확인 — LayoutDesigner 의 위젯 셀렉터 드롭다운**

브라우저 `http://localhost:5173` → T3Composer → "기존 화면 복사" 또는 "설계서 기반" 진입 → 9단계 Wizard 의 Step1 Layout → 임의 layer 의 위젯 셀렉터 클릭 → 드롭다운에 5그룹만 표시되고 `텍스트 / 숫자 / 단일 선택 / 단일 버튼 / 알림 배너 / 사이드바` 등이 사라졌는지 확인.

- [ ] **Step 6: commit**

```bash
git add frontend/src/view/util/t3composer/constants.js
git commit -m "$(cat <<'EOF'
refactor(composer): COMPONENT_CATALOG 5그룹 41개로 축소 + MODE.NEW_STEP 추가

Layer 자격 없는 그룹 제거 — INPUT/INPUT_DOMAIN/ACTION/FEEDBACK/NAVIGATION
전체 + CONTAINER_DRAWER·CONTAINER_MODAL. "텍스트박스 한 개" 가 layer 가
될 수는 없다는 사용자 지적 반영.

남는 5그룹: CONTAINER(3) · DATA_DISPLAY(12) · CHART(17) · DOCUMENT(5) · AI(4)

Spec: docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md
EOF
)"
```

---

## Task 2: ComposerSpec 팩토리 추가 (wizardState.js)

**Files:**
- Modify: `frontend/src/view/util/t3composer/wizardState.js`

- [ ] **Step 1: 파일 끝(`export default ...` 또는 마지막 export 직전) 위치 확인**

```bash
tail -30 frontend/src/view/util/t3composer/wizardState.js
```

- [ ] **Step 2: 파일 끝에 ComposerSpec 팩토리 + LAYER_TYPES 추가**

다음을 wizardState.js 끝(기존 export 들 뒤)에 추가:

```js
// ============================================================================
// ComposerSpec — Phase 1 새 모델 (9-Step 의 대체).
//   spec: docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md
// ============================================================================

export const LAYER_TYPES = Object.freeze({
  GRID:      'GRID',       // DATA_DISPLAY 그룹의 layer (BaseGrid/TreeGrid/Pivot 등)
  CHART:     'CHART',      // CHART 그룹
  CONTAINER: 'CONTAINER',  // 탭/카드/대시보드 패널
  DOCUMENT:  'DOCUMENT',   // PDF/Markdown/이미지
  AI:        'AI',         // AI 채팅/인사이트
});

/**
 * 새 모델의 spec 객체를 빈 골격으로 생성.
 *   { menuCd, title, parentMenuCd, menuFilePath, pattern } 중 일부만 채워도 됨.
 * pattern: 'BLANK' | 'P02' | 'MOCKUP_<code>' | 'UIPATTERN_<id>' ...
 */
export function createComposerSpec({
  menuCd       = '',
  title        = '',
  parentMenuCd = '',
  menuFilePath = '',
  pattern      = 'BLANK',
} = {}) {
  return {
    meta: { menuCd, title, parentMenuCd, menuFilePath, pattern },
    filterBar: {
      items: [],   // [{ key, label, type, cascade? }]
      affects: {}, // layerKey -> [filterBar item keys]
    },
    layers: [
      // Phase 1 의 빈 스펙은 mainGrid 단일 layer 로 시작 (BLANK 패턴 기본)
      {
        key: 'mainGrid',
        title: '메인 그리드',
        type: LAYER_TYPES.GRID,
        subtype: 'GRID_BASE',
        position: { x: 0, y: 0, w: 12, h: 8 },  // RGL 12-col grid
        dataSource: {
          mode: 'NL',            // 'NL' | 'TABLE' | 'SP' | 'ENTITY' | 'MIXED'
          naturalText: '',
          references: [],        // [{ kind: 'TABLE'|'SP'|'ENTITY', name }]
        },
        columns: [],
        cascade: {},
      },
    ],
  };
}

/**
 * 새 layer 1건의 기본 골격 — ComposerCanvas 에서 layer 추가 시 사용.
 */
export function createComposerLayer({
  key,
  title = '',
  type = LAYER_TYPES.GRID,
  subtype = 'GRID_BASE',
  position = { x: 0, y: 0, w: 6, h: 6 },
} = {}) {
  if (!key) throw new Error('createComposerLayer: key required');
  return {
    key, title, type, subtype, position,
    dataSource: { mode: 'NL', naturalText: '', references: [] },
    columns: [],
    cascade: {},
  };
}

/**
 * Pattern 코드 → 초기 ComposerSpec 매핑. Phase 1 은 'BLANK' / 'P02' 둘만 지원.
 * 나머지 (MOCKUP_*, UIPATTERN_*) 는 Phase 2 에서 패턴 카탈로그 메타에서 가져옴.
 */
export function specFromPattern(patternCode, baseMeta = {}) {
  const base = createComposerSpec({ ...baseMeta, pattern: patternCode });
  if (patternCode === 'P02') {
    // 검색 + 단일 그리드 — FilterBar 자리 + 메인 그리드 1개
    base.filterBar.items = [];  // 사용자가 FilterBarMiniDialog 로 채움
    base.filterBar.affects = { mainGrid: [] };
    // layers 는 createComposerSpec 의 mainGrid 그대로
  }
  // 'BLANK' = createComposerSpec 의 기본 단일 layer 그대로
  return base;
}
```

- [ ] **Step 3: webpack 컴파일 확인**

Run: `docker compose logs --tail=50 composer-frontend 2>&1 | grep -iE "error|module not found" | head -10`
Expected: 0건.

- [ ] **Step 4: commit**

```bash
git add frontend/src/view/util/t3composer/wizardState.js
git commit -m "feat(composer): ComposerSpec 팩토리 + LAYER_TYPES (Phase 1 new model)

새 spec 구조 (9-Step 의 step1_layout..step8_filterCascade 대체).
{ meta, filterBar, layers[] } 단순화. 기존 9-Step state 와 공존.

API: createComposerSpec / createComposerLayer / specFromPattern / LAYER_TYPES"
```

---

## Task 3: DataMiniDialog 신규

**Files:**
- Create: `frontend/src/view/util/t3composer/DataMiniDialog.jsx`

- [ ] **Step 1: 신규 파일 작성**

`frontend/src/view/util/t3composer/DataMiniDialog.jsx`:

```jsx
/**
 * DataMiniDialog — ComposerCanvas 에서 layer 박스를 클릭했을 때 뜨는 MUI Dialog.
 *
 *   props:
 *     open      : boolean
 *     onClose   : () => void
 *     layer     : ComposerSpec.layers[i]  (편집 대상)
 *     onApply   : (nextLayer) => void     (수정된 layer 전달)
 *     onOpenDataSourcePicker?: () => void (풀스크린 별자리 탐색 진입, optional Phase 1)
 *
 *   디자인: docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md
 *           "Mini Dialog 디자인" 섹션
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Chip, Typography, IconButton, Stack, TextField as MuiTextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

const REF_KINDS = [
  { kind: 'TABLE',  label: 'Table',  color: '#3b82f6' },
  { kind: 'SP',     label: 'SP',     color: '#8b5cf6' },
  { kind: 'ENTITY', label: 'JPA Entity', color: '#10b981' },
];

function DataMiniDialog({ open, onClose, layer, onApply, onOpenDataSourcePicker }) {
  const [naturalText, setNaturalText] = useState('');
  const [references, setReferences]   = useState([]);  // [{kind, name}]
  const [addKind, setAddKind]         = useState(null); // 'TABLE'|'SP'|'ENTITY'
  const [addName, setAddName]         = useState('');

  // open 시 layer 의 현재 값으로 hydrate
  useEffect(() => {
    if (!open) return;
    setNaturalText(layer?.dataSource?.naturalText || '');
    setReferences(layer?.dataSource?.references || []);
    setAddKind(null);
    setAddName('');
  }, [open, layer]);

  const handleAddRef = () => {
    if (!addKind || !addName.trim()) return;
    setReferences([...references, { kind: addKind, name: addName.trim() }]);
    setAddKind(null);
    setAddName('');
  };
  const handleRemoveRef = (idx) => {
    setReferences(references.filter((_, i) => i !== idx));
  };

  const handleApply = () => {
    const inferredMode = references.length > 0
      ? (references.length === 1 ? references[0].kind : 'MIXED')
      : 'NL';
    onApply({
      ...layer,
      dataSource: {
        ...(layer?.dataSource || {}),
        mode: inferredMode,
        naturalText,
        references,
      },
    });
    onClose();
  };

  if (!layer) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ color: '#1e40af', fontWeight: 800 }}>
            📊 {layer.title || layer.key} · 데이터
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            type: {layer.type} {layer.subtype ? `· ${layer.subtype}` : ''}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* 자연어 입력 */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
          💬 화면 설명 (자연어)
        </Typography>
        <TextField
          value={naturalText}
          onChange={(e) => setNaturalText(e.target.value)}
          fullWidth multiline minRows={3} maxRows={8}
          placeholder='예: "사용자 마스터. ID·USERNAME·DISPLAY_NAME·ENABLED 컬럼."'
          sx={{ mt: 0.5, mb: 1.5,
                '& .MuiOutlinedInput-root': { fontSize: 13, bgcolor: '#f8fafc' } }}
        />

        {/* 참조 영역 */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
          🔗 데이터 객체 참조 (선택) — 정확한 Table/SP/Entity 명시
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mt: 0.7, mb: 1 }}>
          {references.map((ref, idx) => {
            const meta = REF_KINDS.find(k => k.kind === ref.kind);
            return (
              <Chip
                key={`${ref.kind}-${ref.name}-${idx}`}
                label={`${meta?.label || ref.kind}: ${ref.name}`}
                onDelete={() => handleRemoveRef(idx)}
                size="small"
                sx={{ bgcolor: `${meta?.color || '#64748b'}22`,
                      color: meta?.color || '#64748b', fontWeight: 700 }}
              />
            );
          })}
        </Box>

        {/* 참조 추가 */}
        {addKind === null && (
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {REF_KINDS.map(k => (
              <Button key={k.kind} size="small" variant="outlined"
                      onClick={() => setAddKind(k.kind)}
                      sx={{ fontSize: 11, py: 0.3, borderColor: k.color, color: k.color }}>
                + {k.label}
              </Button>
            ))}
            {onOpenDataSourcePicker && (
              <Button size="small" variant="outlined" startIcon={<SearchIcon fontSize="small" />}
                      onClick={onOpenDataSourcePicker}
                      sx={{ fontSize: 11, py: 0.3, borderColor: '#facc15', color: '#713f12' }}>
                Data Source 탐색
              </Button>
            )}
          </Stack>
        )}
        {addKind !== null && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" sx={{ fontWeight: 700,
                                                 color: REF_KINDS.find(k => k.kind === addKind)?.color }}>
              + {REF_KINDS.find(k => k.kind === addKind)?.label} 이름:
            </Typography>
            <MuiTextField
              value={addName} onChange={(e) => setAddName(e.target.value)}
              size="small" autoFocus
              placeholder={addKind === 'TABLE' ? 'TB_AD_USER' :
                           addKind === 'SP' ? 'SP_UI_AD_01_Q1' : 'User'}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddRef(); }}
              sx={{ flex: 1, '& .MuiOutlinedInput-input': { fontSize: 12, fontFamily: 'monospace' } }}
            />
            <Button size="small" variant="contained" onClick={handleAddRef}
                    disabled={!addName.trim()}>추가</Button>
            <Button size="small" onClick={() => { setAddKind(null); setAddName(''); }}>취소</Button>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1 }}>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleApply} variant="contained">적용</Button>
      </DialogActions>
    </Dialog>
  );
}

export default DataMiniDialog;
```

- [ ] **Step 2: webpack 컴파일 확인**

Run: `docker compose logs --tail=50 composer-frontend 2>&1 | grep -iE "error|module not found" | head -10`
Expected: 0건.

- [ ] **Step 3: commit (UI 검증은 Task 5 의 ComposerCanvas 통합 후 함께)**

```bash
git add frontend/src/view/util/t3composer/DataMiniDialog.jsx
git commit -m "feat(composer): DataMiniDialog — 자연어 + Data 객체 참조 칩

Phase 1 의 layer 클릭 데이터 입력 dialog. MUI Dialog 기반.
- 자연어 textarea (메인)
- 참조 칩 (Table/SP/JPA Entity) + 추가 / 제거
- 풀스크린 Data Source 탐색 진입점 (DataSourcePickerDialog, optional)

ComposerCanvas (Task 5) 에서 통합 검증."
```

---

## Task 4: FilterBarMiniDialog 신규

**Files:**
- Create: `frontend/src/view/util/t3composer/FilterBarMiniDialog.jsx`

- [ ] **Step 1: 신규 파일 작성**

`frontend/src/view/util/t3composer/FilterBarMiniDialog.jsx`:

```jsx
/**
 * FilterBarMiniDialog — ComposerCanvas 의 노란 띠 (FilterBar zone) 클릭 시 뜨는 Dialog.
 *
 *   props:
 *     open    : boolean
 *     onClose : () => void
 *     spec    : ComposerSpec  (filterBar.items / affects 편집)
 *     onApply : (nextSpec) => void
 *
 *   Phase 1 범위: 필드 추가/제거 + label/type 편집 + affects 매핑 (어느 layer 가
 *   이 필드를 사용하는지 체크박스). cascade / cross_field_rules 는 Phase 2.
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, IconButton, Typography, Stack, TextField,
  MenuItem, Select, FormControl, Table, TableHead, TableBody, TableRow, TableCell,
  Checkbox,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';

const FILTER_TYPES = [
  { value: 'TEXT',                label: 'TEXT' },
  { value: 'NUMBER',              label: 'NUMBER' },
  { value: 'SELECT',              label: 'SELECT' },
  { value: 'DATE_RANGE',          label: 'DATE_RANGE' },
  { value: 'DOMAIN_PLAN_SCOPE',   label: 'DOMAIN_PLAN_SCOPE' },
  { value: 'DOMAIN_ITEM_MULTI',   label: 'DOMAIN_ITEM_MULTI' },
  { value: 'DOMAIN_ACCOUNT_MULTI',label: 'DOMAIN_ACCOUNT_MULTI' },
  { value: 'DOMAIN_LOCATION_MULTI',label: 'DOMAIN_LOCATION_MULTI' },
  { value: 'DOMAIN_VERSION',      label: 'DOMAIN_VERSION' },
];

function FilterBarMiniDialog({ open, onClose, spec, onApply }) {
  const [items, setItems]     = useState([]);
  const [affects, setAffects] = useState({});   // { layerKey: [itemKey...] }

  useEffect(() => {
    if (!open) return;
    setItems(spec?.filterBar?.items || []);
    setAffects(spec?.filterBar?.affects || {});
  }, [open, spec]);

  const layers = spec?.layers || [];

  const handleAddItem = () => {
    const newKey = `field_${Date.now().toString(36)}`;
    setItems([...items, { key: newKey, label: '새 필드', type: 'TEXT' }]);
  };
  const handleRemoveItem = (idx) => {
    const removedKey = items[idx]?.key;
    setItems(items.filter((_, i) => i !== idx));
    // affects 에서도 정리
    if (removedKey) {
      const nextAffects = {};
      Object.entries(affects).forEach(([lk, fks]) => {
        nextAffects[lk] = fks.filter(k => k !== removedKey);
      });
      setAffects(nextAffects);
    }
  };
  const updateItem = (idx, patch) => {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const toggleAffect = (layerKey, itemKey) => {
    const cur = affects[layerKey] || [];
    const next = cur.includes(itemKey) ? cur.filter(k => k !== itemKey) : [...cur, itemKey];
    setAffects({ ...affects, [layerKey]: next });
  };

  const handleApply = () => {
    onApply({
      ...spec,
      filterBar: { ...(spec?.filterBar || {}), items, affects },
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ color: '#92400e', fontWeight: 800 }}>
          🔍 FilterBar (검색조건) 편집
        </Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
          필드 목록 — 화면 전체에 공용으로 노출
        </Typography>
        <Table size="small" sx={{ mt: 1, mb: 2 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#fef3c7' }}>
              <TableCell sx={{ fontWeight: 700, width: 180 }}>Key</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Label</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 200 }}>Type</TableCell>
              <TableCell sx={{ width: 40 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 && (
              <TableRow><TableCell colSpan={4} sx={{ color: '#94a3b8', textAlign: 'center' }}>
                필드가 없습니다. 아래 [+ 필드 추가] 로 생성하세요.
              </TableCell></TableRow>
            )}
            {items.map((it, idx) => (
              <TableRow key={it.key}>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{it.key}</TableCell>
                <TableCell>
                  <TextField value={it.label} onChange={(e) => updateItem(idx, { label: e.target.value })}
                             size="small" fullWidth variant="standard" />
                </TableCell>
                <TableCell>
                  <FormControl size="small" fullWidth variant="standard">
                    <Select value={it.type} onChange={(e) => updateItem(idx, { type: e.target.value })}>
                      {FILTER_TYPES.map(t => (
                        <MenuItem key={t.value} value={t.value} sx={{ fontSize: 12, fontFamily: 'monospace' }}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleRemoveItem(idx)}>
                    <DeleteIcon fontSize="small" sx={{ color: '#ef4444' }} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Button size="small" startIcon={<AddIcon />} onClick={handleAddItem} variant="outlined"
                sx={{ borderColor: '#f59e0b', color: '#92400e' }}>
          필드 추가
        </Button>

        {/* affects 매핑 */}
        {layers.length > 0 && items.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
              영향 매핑 — 각 필드가 어느 layer 에 영향을 주는지
            </Typography>
            <Table size="small" sx={{ mt: 1 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Layer</TableCell>
                  {items.map(it => (
                    <TableCell key={it.key} sx={{ fontWeight: 700, textAlign: 'center', fontSize: 11 }}>
                      {it.label || it.key}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {layers.map(l => (
                  <TableRow key={l.key}>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: '#1e40af' }}>
                      {l.title || l.key}
                    </TableCell>
                    {items.map(it => (
                      <TableCell key={it.key} sx={{ textAlign: 'center', p: 0 }}>
                        <Checkbox size="small"
                          checked={(affects[l.key] || []).includes(it.key)}
                          onChange={() => toggleAffect(l.key, it.key)} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1 }}>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleApply} variant="contained">적용</Button>
      </DialogActions>
    </Dialog>
  );
}

export default FilterBarMiniDialog;
```

- [ ] **Step 2: 컴파일 확인**

Run: `docker compose logs --tail=50 composer-frontend 2>&1 | grep -iE "error|module not found" | head -10`
Expected: 0건.

- [ ] **Step 3: commit**

```bash
git add frontend/src/view/util/t3composer/FilterBarMiniDialog.jsx
git commit -m "feat(composer): FilterBarMiniDialog — 필드 목록 + affects 매핑

Phase 1 의 FilterBar 영역 클릭 dialog. 필드 추가/제거 + label/type 편집
+ 어느 layer 에 영향 주는지 체크박스 매핑. Cascade 는 Phase 2.

ComposerCanvas (Task 5) 에서 통합 검증."
```

---

## Task 5: ComposerCanvas 신규 + 두 dialog 통합

**Files:**
- Create: `frontend/src/view/util/t3composer/ComposerCanvas.jsx`

- [ ] **Step 1: 신규 파일 작성**

`frontend/src/view/util/t3composer/ComposerCanvas.jsx`:

```jsx
/**
 * ComposerCanvas — 9-Step Wizard 의 대체. 시각 직접 조작 + Mini Dialog.
 *
 *   props:
 *     spec        : ComposerSpec
 *     onChange    : (nextSpec) => void
 *     readOnly?   : boolean
 *
 *   레이아웃:
 *     ┌─────────────────────────────────────────┐
 *     │ 🔍 FilterBar (노란 띠, 클릭 → FBMD)      │
 *     ├─────────────────────────────────────────┤
 *     │ 📐 Body Layers (RGL, 클릭 → DMD)         │
 *     └─────────────────────────────────────────┘
 *
 *   Phase 1: 미세조정(layer 추가/이동/삭제) OFF — 패턴이 만든 layer 그대로.
 *   Phase 3 에서 LayoutDesigner 의 미세조정 토글 흡수 예정.
 *
 *   디자인: docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md
 *           "FilterBar 시각 분리" + "Mini Dialog 디자인" 섹션
 */
import React, { useState, useMemo } from 'react';
import { Box, Typography, Chip, IconButton } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';

import DataMiniDialog from './DataMiniDialog';
import FilterBarMiniDialog from './FilterBarMiniDialog';

function ComposerCanvas({ spec, onChange, readOnly = false }) {
  const [editingLayerKey, setEditingLayerKey] = useState(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const filterItems = spec?.filterBar?.items || [];
  const layers      = spec?.layers || [];

  const editingLayer = useMemo(
    () => layers.find(l => l.key === editingLayerKey) || null,
    [layers, editingLayerKey]
  );

  const handleApplyLayer = (nextLayer) => {
    if (!nextLayer) return;
    onChange({
      ...spec,
      layers: layers.map(l => (l.key === nextLayer.key ? nextLayer : l)),
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%', minHeight: 0 }}>

      {/* ───── FilterBar 노란 띠 ───── */}
      <Box
        onClick={readOnly ? undefined : () => setFilterDialogOpen(true)}
        sx={{
          flexShrink: 0,
          border: '2px solid #f59e0b',
          borderRadius: 1.5,
          background: 'linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)',
          p: 1.2,
          cursor: readOnly ? 'default' : 'pointer',
          transition: 'box-shadow 0.15s ease',
          '&:hover': readOnly ? {} : { boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.25)' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <FilterListIcon sx={{ fontSize: 16, color: '#92400e' }} />
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400e' }}>
            🔍 검색조건 (FilterBar) · 화면 전체 공용 · 클릭하여 편집
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.7 }}>
          {filterItems.length === 0 && (
            <Typography variant="caption" sx={{ color: '#92400e', fontStyle: 'italic' }}>
              필드 없음 — 클릭하여 검색조건을 추가하세요
            </Typography>
          )}
          {filterItems.map(it => (
            <Chip key={it.key}
                  label={it.label || it.key}
                  size="small"
                  sx={{ bgcolor: '#fff', border: '1px solid #fbbf24',
                        color: '#92400e', fontWeight: 700, fontSize: 11 }} />
          ))}
        </Box>
      </Box>

      {/* ───── Body Layers 라벨 ───── */}
      <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.7 }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e40af' }}>
          📐 본문 (Body Layers)
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          — 각 layer 박스를 클릭하면 데이터 편집 다이얼로그가 열립니다.
        </Typography>
      </Box>

      {/* ───── Body Layers ─────
          Phase 1 은 RGL 미사용 (미세조정 OFF). 단순 flex grid 로 layer 들을 row 배치.
          Phase 3 에서 LayoutDesigner 의 RGL 흡수. */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto',
                 display: 'flex', flexDirection: 'column', gap: 1, p: 0.5 }}>
        {layers.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8' }}>
            Layer 가 없습니다. ComposerSpec.layers 가 비어있는지 확인하세요.
          </Box>
        )}
        {layers.map(l => {
          const hasData = !!(l.dataSource?.naturalText) || (l.dataSource?.references || []).length > 0;
          return (
            <Box
              key={l.key}
              onClick={readOnly ? undefined : () => setEditingLayerKey(l.key)}
              sx={{
                cursor: readOnly ? 'default' : 'pointer',
                border: '2px solid #2563eb',
                borderRadius: 1.5,
                bgcolor: '#3b82f6',
                color: '#fff',
                minHeight: 80,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 0.5,
                p: 2,
                transition: 'box-shadow 0.15s ease, transform 0.15s ease',
                '&:hover': readOnly ? {} : {
                  boxShadow: '0 0 0 3px rgba(59,130,246,0.35)', transform: 'translateY(-1px)',
                },
              }}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 700,
                                textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
                {l.title || l.key}
              </Typography>
              <Typography variant="caption" sx={{ color: '#dbeafe' }}>
                {l.type}{l.subtype ? ` · ${l.subtype}` : ''}
                {hasData ? ' · ✓ 데이터 설정됨' : ' · 클릭하여 데이터 입력'}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* ───── Dialogs ───── */}
      <DataMiniDialog
        open={!!editingLayer}
        layer={editingLayer}
        onClose={() => setEditingLayerKey(null)}
        onApply={handleApplyLayer}
        /* Phase 1 에서는 DataSourcePicker 진입 미연결 — Phase 2 에서 추가 */
        onOpenDataSourcePicker={null}
      />
      <FilterBarMiniDialog
        open={filterDialogOpen}
        spec={spec}
        onClose={() => setFilterDialogOpen(false)}
        onApply={(nextSpec) => onChange(nextSpec)}
      />
    </Box>
  );
}

export default ComposerCanvas;
```

- [ ] **Step 2: 컴파일 확인**

Run: `docker compose logs --tail=50 composer-frontend 2>&1 | grep -iE "error|module not found" | head -10`
Expected: 0건.

- [ ] **Step 3: commit**

```bash
git add frontend/src/view/util/t3composer/ComposerCanvas.jsx
git commit -m "feat(composer): ComposerCanvas — 시각 직접 조작 + Mini Dialog 통합

상단 노란 띠(FilterBar 시각 zone) + 본문 layer 박스 grid.
- 노란 띠 클릭 → FilterBarMiniDialog
- layer 박스 클릭 → DataMiniDialog

Phase 1: RGL 미사용 (단순 flex 배치), 미세조정(layer 추가/이동) OFF.
Phase 3 에서 LayoutDesigner 의 RGL 통합 예정."
```

---

## Task 6: ModeNewStep + T3Composer 라우팅

**Files:**
- Create: `frontend/src/view/util/t3composer/ModeNewStep.jsx`
- Modify: `frontend/src/view/util/t3composer/T3Composer.jsx`

- [ ] **Step 1: ModeNewStep.jsx 신규 작성**

`frontend/src/view/util/t3composer/ModeNewStep.jsx`:

```jsx
/**
 * ModeNewStep — NEW_STEP 모드 진입 화면. 패턴 picker 3 옵션.
 *   ① SCM Mockup (54개) — MockupPickerDialog 재활용
 *   ② UI Pattern (730개) — UiPatternPickerDialog 재활용
 *   ③ 빈 캔버스 (P02 / BLANK)
 *
 *   선택 후 ComposerSpec 을 specFromPattern() 으로 만들어 ComposerCanvas 진입.
 *
 *   Phase 1: 메뉴 등록 / 화면 실행 / 산출물 생성 흐름은 없음 (Canvas 편집만 검증).
 *   Phase 2 에서 ComposerWorkspace 통합.
 */
import React, { useState } from 'react';
import { Box, Typography, Button, Stack, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import ViewQuiltIcon          from '@mui/icons-material/ViewQuilt';
import EditNoteIcon           from '@mui/icons-material/EditNote';

import ComposerCanvas from './ComposerCanvas';
import { specFromPattern, createComposerSpec } from './wizardState';

// 기존 picker 재활용 — Phase 2 에서 실제 layer prefill 매핑 추가
// import MockupPickerDialog   from './MockupPickerDialog';
// import UiPatternPickerDialog from './UiPatternPickerDialog';

function ModeNewStep({ onBack }) {
  // 단계: 'PICK' (패턴 선택) | 'CANVAS' (편집)
  const [stage, setStage] = useState('PICK');
  const [spec, setSpec]   = useState(null);

  const startWithPattern = (patternCode) => {
    setSpec(specFromPattern(patternCode, { title: '새 화면', menuCd: '', pattern: patternCode }));
    setStage('CANVAS');
  };

  if (stage === 'CANVAS' && spec) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 1, borderBottom: '1px solid #e2e8f0' }}>
          <Button size="small" startIcon={<ArrowBackIcon />}
                  onClick={() => setStage('PICK')}>패턴 다시 선택</Button>
          <Typography variant="caption" sx={{ color: '#64748b', ml: 1 }}>
            pattern: <b>{spec.meta.pattern}</b> · 시각 편집 모드 (Phase 1 — 산출물 생성은 Phase 2)
          </Typography>
        </Stack>
        <Box sx={{ flex: 1, minHeight: 0, p: 1.5 }}>
          <ComposerCanvas spec={spec} onChange={setSpec} />
        </Box>
        {/* Phase 1 검증용 — 현재 spec JSON 미리보기 */}
        <Box sx={{ flexShrink: 0, maxHeight: 180, overflow: 'auto', borderTop: '1px solid #e2e8f0',
                   bgcolor: '#0f172a', color: '#e2e8f0', p: 1, fontSize: 11,
                   fontFamily: 'monospace' }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
            ▶ 현재 ComposerSpec (디버그용 — Phase 2 에서 제거 예정)
          </Typography>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(spec, null, 2)}
          </pre>
        </Box>
      </Box>
    );
  }

  // stage === 'PICK'
  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={onBack}>뒤로</Button>
        <Typography variant="h6" sx={{ color: '#1e40af', fontWeight: 800 }}>
          단계별 화면 생성 — 패턴 선택
        </Typography>
      </Stack>

      <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
        화면의 시작 골격을 선택하세요. 선택 후 시각 편집기에서 각 영역을 클릭해 데이터를 채웁니다.
      </Typography>

      <Stack spacing={2}>

        <Paper variant="outlined"
               sx={{ p: 2, cursor: 'pointer', '&:hover': { borderColor: '#3b82f6', bgcolor: '#f8fafc' } }}
               onClick={() => alert('SCM Mockup picker 통합은 Phase 2 — 지금은 BLANK 로 진입합니다.')
                            || startWithPattern('BLANK')}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <DashboardCustomizeIcon sx={{ fontSize: 32, color: '#3b82f6' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e40af' }}>
                SCM UI Mockup (54개)
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                T3SmartSCM 도메인 패턴 54개에서 선택 — Phase 2 에서 picker 통합
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper variant="outlined"
               sx={{ p: 2, cursor: 'pointer', '&:hover': { borderColor: '#10b981', bgcolor: '#f0fdf4' } }}
               onClick={() => alert('UI Pattern picker 통합은 Phase 2 — 지금은 BLANK 로 진입합니다.')
                            || startWithPattern('BLANK')}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ViewQuiltIcon sx={{ fontSize: 32, color: '#10b981' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#065f46' }}>
                T3MES UI Pattern (730개)
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                T3MES 퍼블리싱 패턴 730개에서 선택 — Phase 2 에서 picker 통합
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper variant="outlined"
               sx={{ p: 2, cursor: 'pointer', '&:hover': { borderColor: '#8b5cf6', bgcolor: '#faf5ff' } }}
               onClick={() => startWithPattern('P02')}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <EditNoteIcon sx={{ fontSize: 32, color: '#8b5cf6' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#5b21b6' }}>
                빈 캔버스 (P02 — 검색 + 단일 그리드)
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                가장 일반적인 마스터 CRUD 패턴으로 시작
              </Typography>
            </Box>
          </Stack>
        </Paper>

      </Stack>
    </Box>
  );
}

export default ModeNewStep;
```

- [ ] **Step 2: T3Composer.jsx 의 import 추가**

`/Users/hej/work/projects/t3-composer/frontend/src/view/util/t3composer/T3Composer.jsx` 에서:

기존 import 블록 (line ~34-36):
```jsx
import ModeNewGeneral    from './ModeNewGeneral';
import ModeNewFromDesign from './ModeNewFromDesign';
import ModeNewFromCopy   from './ModeNewFromCopy';
```

다음 한 줄 추가:
```jsx
import ModeNewStep       from './ModeNewStep';
```

- [ ] **Step 3: T3Composer.jsx 의 ModeSelector 카드 배열 (`MODES`/`STEPS`) 에 NEW_STEP 추가**

같은 파일 line 70~72 영역의 모드 카드 배열을 찾는다 (이름은 file 마다 다를 수 있음 — 기존 `MODE.NEW_NL` / `MODE.NEW_FROM_COPY` / `MODE.NEW_FROM_DESIGN` 가 들어있는 배열). 그 배열의 적절한 위치에 (예: NEW_NL 다음) 한 항목 추가:

```jsx
{ key: MODE.NEW_STEP, step: 1.5, title: '단계별 생성 (Beta)', sub: 'Pattern + Visual', icon: ViewQuiltIcon, color: '#9D8FD4', hint: '패턴을 고른 뒤 시각 편집으로 데이터를 채웁니다 (Phase 1)' },
```

⚠️ `ViewQuiltIcon` 이 T3Composer.jsx 에 import 되어 있지 않으면 파일 상단에 다음 추가:

```jsx
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
```

- [ ] **Step 4: T3Composer.jsx 의 라우팅 분기에 NEW_STEP 추가**

line 557-562 영역의 라우팅 분기에서, 기존 분기들 옆에 한 줄 추가 (위치는 NEW_NL 옆이 자연스러움):

```jsx
{mode === MODE.NEW_STEP        && <ModeNewStep        onBack={backToLanding} />}
```

추가 후 영역은 다음과 같아야 함:
```jsx
{mode === MODE.NEW_FROM_DESIGN && <ModeNewFromDesign  onBack={backToLanding} />}
{mode === MODE.NEW_FROM_COPY   && <ModeNewFromCopy    onBack={backToLanding} />}
{mode === MODE.NEW_NL          && <ModeNewGeneral     onBack={backToLanding} startWith="NL" />}
{mode === MODE.NEW_STEP        && <ModeNewStep        onBack={backToLanding} />}
{mode === MODE.EXISTING_MODIFY && (
  <ModeExistingModify onBack={backToLanding} startWith={modifyStartWith} />
)}
```

- [ ] **Step 5: 컴파일 확인 + 시각 검증**

Run: `docker compose logs --tail=80 composer-frontend 2>&1 | grep -iE "error|module not found" | head -10`
Expected: 0건.

브라우저 `http://localhost:5173` → T3Composer → ModeSelector 에 **"단계별 생성 (Beta)"** 카드가 추가됐는지 확인 → 클릭 → 패턴 picker 3개 표시 → "빈 캔버스 (P02)" 클릭 → ComposerCanvas 진입 → 노란 띠 + "메인 그리드" 파란 박스 + 하단 디버그 JSON 표시.

추가 확인:
1. 노란 띠 클릭 → FilterBarMiniDialog 가 열림 → "필드 추가" → label/type 변경 → "적용" → 노란 띠에 chip 추가됨 + 하단 JSON 의 filterBar.items 갱신
2. "메인 그리드" 박스 클릭 → DataMiniDialog 열림 → 자연어 입력 + `+ Table` → 이름 입력 → "추가" → chip 표시 → "적용" → 박스 라벨에 "✓ 데이터 설정됨" + 하단 JSON 의 layers[0].dataSource 갱신

- [ ] **Step 6: commit**

```bash
git add frontend/src/view/util/t3composer/ModeNewStep.jsx \
        frontend/src/view/util/t3composer/T3Composer.jsx
git commit -m "feat(composer): NEW_STEP 진입점 + ModeNewStep 패턴 picker

ModeSelector 에 '단계별 생성 (Beta)' 카드 추가. NEW_STEP 모드 라우팅 활성.
ModeNewStep: 패턴 picker 3 옵션 (SCM Mockup / UI Pattern / 빈 캔버스 P02)
→ ComposerCanvas 진입.

Phase 1: BLANK / P02 패턴만 지원. SCM Mockup / UI Pattern picker 의 실제
연결은 Phase 2. 산출물 생성·메뉴등록·화면실행은 Phase 2.

검증용 하단 JSON 디버그 패널 포함 (Phase 2 에서 제거)."
```

---

## Task 7: Phase 1 통합 smoke 검증 + Phase 1 종료 마커

**Files:** (변경 없음, 검증만)

- [ ] **Step 1: 전체 컴파일 healthcheck**

Run:
```bash
docker compose logs --tail=200 composer-frontend 2>&1 | grep -iE "error|warning|fail" | grep -v "deprecat" | head -30
```
Expected: 새 컴포넌트 관련 에러/경고 0건. (기존 deprecation warning 은 무시 가능)

- [ ] **Step 2: 5분 smoke 시나리오**

브라우저 `http://localhost:5173`:

1. ModeSelector 에서 **"단계별 생성 (Beta)"** 카드 보임 ✓
2. 클릭 → 패턴 picker 화면 (3개 옵션) ✓
3. "빈 캔버스 (P02)" 클릭 → ComposerCanvas 진입 ✓
4. 노란 띠 클릭 → FilterBarMiniDialog 열림 → 필드 2개 추가 (`USERNAME` text / `ENABLED` select) → affects 매핑에서 메인 그리드 양쪽 체크 → "적용" ✓
5. 노란 띠에 칩 2개 표시 ✓
6. "메인 그리드" 파란 박스 클릭 → DataMiniDialog 열림 → 자연어 "사용자 마스터" 입력 → `+ Table` → `TB_AD_USER` 추가 → "적용" ✓
7. 메인 그리드 라벨에 "✓ 데이터 설정됨" 표시 ✓
8. 하단 디버그 JSON 에 filterBar.items[2] + layers[0].dataSource 갱신 ✓
9. "패턴 다시 선택" 누르면 picker 로 복귀 ✓
10. 다른 모드 (NEW_FROM_COPY / NEW_FROM_DESIGN / NEW_NL) 진입해도 기존 동작 그대로 ✓
11. LayoutDesigner 의 위젯 셀렉터 드롭다운에 5그룹만 노출 (INPUT/ACTION/FEEDBACK/NAVIGATION/MODAL/DRAWER 사라짐) ✓

- [ ] **Step 3: Phase 1 종료 commit (empty commit, 명확한 마커)**

```bash
git commit --allow-empty -m "milestone(composer): Phase 1 complete — Composer Canvas + Mini Dialog 골격

새 모델 골격 도입:
- COMPONENT_CATALOG 5그룹 41개로 정리
- ComposerSpec 팩토리 + LAYER_TYPES
- DataMiniDialog (자연어 + Data 참조 칩)
- FilterBarMiniDialog (필드 + affects 매핑)
- ComposerCanvas (노란 띠 + Body Layers + dialog 통합)
- ModeNewStep + NEW_STEP 진입점 활성

기존 9-Step Wizard / LayoutDesigner / StepByStepWizard 코드는 그대로 유지.
NEW_NL / NEW_FROM_COPY / NEW_FROM_DESIGN / EXISTING_MODIFY 흐름 미변경.

Phase 2 (다음 plan): NEW_GENERAL/NEW_NL/NEW_FROM_COPY/NEW_FROM_DESIGN 의
결과를 ComposerSpec 으로 통일 + MockupPicker / UiPatternPicker 실제 연결 +
DataSourcePicker 풀스크린 진입 연결 + ComposerWorkspace 통합 (산출물 생성 / 메뉴등록 / 화면실행).

Spec: docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md"
```

---

## Self-Review

(Plan 작성자가 작성 후 fresh eyes 로 점검)

**1. Spec coverage:**

| Spec 항목 (Phase 1) | 구현 task |
|---|---|
| `ComposerCanvas.jsx` 신규 | Task 5 |
| `DataMiniDialog.jsx` 신규 | Task 3 |
| `FilterBarMiniDialog.jsx` 신규 | Task 4 |
| `LayoutDesigner` 단순화 (Phase 1 부분) | **Phase 1 미포함** — 기존 LayoutDesigner 는 NEW_FROM_COPY/DESIGN 이 아직 사용 중이라 그대로 유지. Phase 3 에서 제거 |
| `COMPONENT_CATALOG` 축소 | Task 1 |
| `StepByStepWizard` deprecated | **Phase 1 미포함** — 기존 모드들이 아직 사용 중. Phase 3 에서 제거 |
| `Step*.jsx` 9개 제거 | Phase 3 |
| `ModeNewGeneral/Copy/Design` 수정 | Phase 2 |
| `wizardState.js` 새 spec 구조 | Task 2 |
| `DataSourcePickerDialog` 진입점 연결 | DataMiniDialog 의 prop 으로만 정의, 실제 연결은 Phase 2 |
| `PrefillFromSourceService` 응답 형식 조정 | Phase 2 |
| `ComposerPromptBuilder` mode 가이드 갱신 | Phase 2 |

**2. Placeholder scan:** "TBD" / "implement later" / "fill in details" / "appropriate error handling" 패턴 검색 결과 0건. ✓

**3. Type consistency:**
- `createComposerSpec` 의 반환 객체와 `ComposerCanvas` 가 읽는 `spec.layers[i]` / `spec.filterBar.items` 일치 ✓
- `DataMiniDialog` 의 `onApply(nextLayer)` 콜백과 `ComposerCanvas.handleApplyLayer` 시그니처 일치 ✓
- `FilterBarMiniDialog` 의 `onApply(nextSpec)` 콜백과 `ComposerCanvas.onChange(nextSpec)` 시그니처 일치 ✓
- `LAYER_TYPES` 사용은 `wizardState.js` export, `DataMiniDialog` 의 `REF_KINDS` 와 별개 (의도) ✓

**4. Ambiguity:**
- "위젯 셀렉터에 5그룹만 표시" — 기존 `LayoutDesigner` 코드는 변경하지 않으므로 NEW_FROM_COPY/DESIGN 의 Step1 Layout 안에서 자동으로 5그룹만 나옴 ✓
- "RGL 미사용 (Phase 1)" — flex column 으로 단순 row 배치. layer 갯수가 많아도 세로로 쌓임. Phase 3 에서 RGL 통합 명시 ✓

---

## Execution Choice

**Plan complete and saved to `docs/superpowers/plans/2026-05-22-composer-canvas-phase1.md`.** 두 가지 실행 옵션:

**1. Subagent-Driven (recommended)** — 매 task 마다 fresh subagent dispatch, task 간 사용자 review, 빠른 반복

**2. Inline Execution** — 이 세션에서 직접 진행, batch 마다 checkpoint

어느 쪽으로 진행할까요?

# Composer Canvas (Phase 2C — ComposerWorkspace 통합 + 미리보기) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** NEW_STEP 모드의 **패턴 선택 → 시각 편집 → 산출물 생성 → 화면 미리보기** 전체 end-to-end 흐름을 backend 수정 없이 완성한다.

**Architecture:** ComposerCanvas 가 만든 `ComposerSpec` 을 **자연어 prompt 로 직렬화** (`specToInitialPrompt`) 해서 기존 `createSession` + `<ComposerWorkspace initialPrompt=...>` 의 ChatPanel 흐름에 그대로 태운다. ComposerWorkspace 가 이미 Claude 호출 / 산출물 / 화면 실행 / AI 자동보완 / 자연어 보정을 모두 갖추고 있으므로 backend 는 전혀 손대지 않는다. ModeNewStep 의 stage 에 `'WORKSPACE'` 추가.

**Tech Stack:** React 18 + 기존 `ComposerWorkspace` / `ChatPanel` / `ArtifactPanel` / `PreviewEmbed` / `ArtifactPreviewService` 인프라 전체 재활용. 테스트 환경 없음 — webpack 빌드 + dev server end-to-end 시각 검증.

**Spec:** `docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md`
**전제:** Phase 2B-1 (commit 8c35a0c) 머지 + composer-frontend 컨테이너 hot-reload + Anthropic API key 등록 + 활성 Target (예: T3SERIES) 설정.

**Dev 환경**: composer-frontend port 5173 · composer-backend port 8090. 로그: `docker compose logs --tail=80 composer-{frontend,backend}`.

---

## File Structure

| 파일 | 변경 종류 | 책임 |
|---|---|---|
| `frontend/src/view/util/t3composer/wizardState.js` | **함수 추가** | `specToInitialPrompt(spec)` — ComposerSpec 을 ChatPanel 의 initialPrompt 용 자연어 문자열로 직렬화. patternLabel/description + layers + filterBar + 지시사항 |
| `frontend/src/view/util/t3composer/ComposerCanvas.jsx` | **버튼 + prop 추가** | 헤더 우측에 `[✨ 화면 생성]` 버튼. `onCreate?` prop (없으면 버튼 숨김) |
| `frontend/src/view/util/t3composer/ModeNewStep.jsx` | **stage 확장** | `'PICK' / 'CANVAS' / 'WORKSPACE'` 3단계. CANVAS 의 onCreate → createSession + setSession + setStage('WORKSPACE'). WORKSPACE 단계는 `<ComposerWorkspace>` 임베드 + extraHeader 에 종료 버튼 |

**기존 재활용:**
- `createSession({ mode, title, modelName, targetCd })` — api.js (이미 있음)
- `<ComposerWorkspace session={...} initialPrompt={...} extraHeader={...}/>` (ComposerWorkspace.jsx:136)
- ComposerWorkspace 내부의 ChatPanel + ArtifactPanel + PreviewEmbed + handlePreview + AI 자동보완 — 전부 그대로
- `useTargetStore.currentTargetCd` — 이미 ModeNewStep 에서 chain
- 모델 선택 — 일단 hardcoded `'claude-sonnet-4-5'` (NEW_GENERAL 도 동일)

**Backend 수정**: **없음**. ComposerSpec 의 자연어 변환이 기존 NEW_NL 흐름과 동등.

**Phase 2C 범위 외**:
- Backend `ComposerPromptBuilder` 의 NEW_STEP 전용 가이드 갱신 — Phase 2B-3
- 자동 ComposerSpec ↔ 산출물 동기화 (Claude 응답 → spec 갱신) — Phase 3 또는 후속
- 메뉴 코드 자동 부여 (현재는 빈 string, Claude 가 추론하거나 사용자가 채움) — 후속

---

## Task 1: `specToInitialPrompt(spec)` 헬퍼

**Files:**
- Modify: `frontend/src/view/util/t3composer/wizardState.js` (기존 `specFromUiPattern` 함수 아래)

- [ ] **Step 1: 기존 함수 위치 확인**

```bash
grep -n "^export function specFromUiPattern" frontend/src/view/util/t3composer/wizardState.js
```

Expected: 한 라인 매칭.

- [ ] **Step 2: 파일 끝 (specFromUiPattern 함수의 닫는 `}` 아래) 에 신규 export 추가**

```js
// ============================================================================
// Phase 2C — ComposerSpec → ChatPanel initialPrompt 자연어 직렬화
//   spec: docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md
//   plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2c.md (Task 1)
// ============================================================================

/**
 * ComposerSpec 을 ChatPanel 의 initialPrompt 로 쓸 수 있는 자연어 문자열로 직렬화.
 *   ComposerWorkspace 가 이 문자열을 ChatPanel 첫 메시지로 Claude 에 전달 →
 *   .claude/rules/* + ComposerPromptBuilder 의 system prompt 와 합쳐져
 *   화면 생성 (JSX/Java/SP/MENU_SQL) 산출.
 *
 *   ⚠️ Backend ComposerPromptBuilder 의 NEW_STEP 가이드는 Phase 2B-3 에서 갱신 예정.
 *      현재는 NEW_NL 의 system prompt 가 적용되지만, 이 자연어 내용 자체가 충분히
 *      구조화되어 있어 Claude 가 화면 의도 파악 가능.
 */
export function specToInitialPrompt(spec) {
  if (!spec) return '';
  const lines = [];
  const meta = spec.meta || {};

  lines.push('[Composer 신규 화면 생성 — 패턴 기반 시각 편집 모델 (NEW_STEP)]');
  lines.push('');

  // ── 1) 패턴 ──
  if (meta.pattern) {
    lines.push(`[참조 패턴] ${meta.pattern}`);
  }
  if (meta.title) lines.push(`[화면 제목] ${meta.title}`);
  if (meta.menuCd)        lines.push(`[메뉴 코드] ${meta.menuCd}`);
  if (meta.parentMenuCd)  lines.push(`[부모 메뉴] ${meta.parentMenuCd}`);
  if (meta.menuFilePath)  lines.push(`[메뉴 경로] ${meta.menuFilePath}`);
  lines.push('');

  // ── 2) Body Layers ──
  const layers = Array.isArray(spec.layers) ? spec.layers : [];
  lines.push(`[Body Layers (${layers.length})]`);
  layers.forEach((l, idx) => {
    lines.push('');
    lines.push(`${idx + 1}. layer '${l.key}' — title:"${l.title || ''}"`);
    lines.push(`   type: ${l.type}${l.subtype ? ` · subtype: ${l.subtype}` : ''}`);
    if (l.position) {
      const { x, y, w, h } = l.position;
      lines.push(`   position: x=${x} y=${y} w=${w} h=${h}  (RGL 12-col grid)`);
    }
    const ds = l.dataSource || {};
    const nl = (ds.naturalText || '').trim();
    if (nl) {
      lines.push('   데이터 의도:');
      nl.split(/\r?\n/).forEach((row) => lines.push(`     ${row}`));
    }
    const refs = ds.references || [];
    if (refs.length > 0) {
      lines.push('   참조 데이터 객체:');
      refs.forEach((r) => lines.push(`     - ${r.kind}: ${r.name}`));
    }
    const sqls = ds.sqlBlocks || [];
    if (sqls.length > 0) {
      lines.push('   Inline SQL:');
      sqls.forEach((sql, i) => {
        lines.push(`     [SQL ${i + 1}]`);
        sql.split(/\r?\n/).forEach((row) => lines.push(`     ${row}`));
      });
    }
    if (Array.isArray(l.columns) && l.columns.length > 0) {
      lines.push(`   컬럼: ${l.columns.map((c) => c.name || c.field || JSON.stringify(c)).join(', ')}`);
    }
  });
  lines.push('');

  // ── 3) FilterBar ──
  const fb = spec.filterBar || {};
  const items = Array.isArray(fb.items) ? fb.items : [];
  const affects = fb.affects || {};
  lines.push(`[FilterBar 필드 (${items.length})]`);
  if (items.length === 0) {
    lines.push('  (필드 없음 — FilterBar 미사용)');
  } else {
    items.forEach((it, idx) => {
      lines.push(`${idx + 1}. ${it.key} (${it.type})${it.label ? ` — label: "${it.label}"` : ''}`);
    });
  }
  if (Object.keys(affects).length > 0) {
    lines.push('');
    lines.push('[FilterBar 영향 매핑]');
    Object.entries(affects).forEach(([layerKey, fieldKeys]) => {
      if (!Array.isArray(fieldKeys) || fieldKeys.length === 0) return;
      lines.push(`  - ${layerKey} ← ${fieldKeys.join(', ')}`);
    });
  }
  lines.push('');

  // ── 4) 지시사항 ──
  lines.push('[지시사항]');
  lines.push('위 spec 을 바탕으로 화면을 생성하세요.');
  lines.push('- JSX 화면 컴포넌트 (각 layer 의 type/subtype 에 맞는 wingui 컴포넌트)');
  lines.push('- 필요 시 Java Entity / Service / RestController');
  lines.push('- SP_UI_*.sql (CRUD 액션마다 1개 · MSSQL 방언)');
  lines.push('- MENU_SQL (TB_AD_MENU + TB_AD_LANG_PACK 4언어 + TB_AD_PERMISSION_GROUP)');
  lines.push('- `.claude/rules/41-composer-generation.md` 및 sub rules 의 규약 준수.');
  lines.push('- 위 layer 의 "데이터 의도" 와 "참조 데이터 객체" / "Inline SQL" 를 우선 활용.');
  lines.push('- FilterBar 필드는 화면 전체 검색조건 (SearchArea) 로 구현.');

  return lines.join('\n');
}
```

- [ ] **Step 3: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError" | head -5`
Expected: 0건.

- [ ] **Step 4: commit**

```bash
git add frontend/src/view/util/t3composer/wizardState.js
git commit -m "$(cat <<'EOF'
feat(composer): specToInitialPrompt — ComposerSpec → ChatPanel prompt 직렬화

Phase 2C 의 핵심 — ComposerCanvas 가 만든 spec 을 자연어 prompt 로 변환해
기존 createSession + ComposerWorkspace 의 ChatPanel 흐름에 그대로 태움.
Backend 수정 없이 NEW_STEP 모드 end-to-end 미리보기 가능.

prompt 구조:
- [참조 패턴] pattern
- [메타] title/menuCd/parentMenuCd/menuFilePath
- [Body Layers] 각 layer 의 key/title/type/subtype/position
  - 데이터 의도 (naturalText)
  - 참조 데이터 객체 (TABLE/SP/ENTITY)
  - Inline SQL
- [FilterBar 필드] + [영향 매핑]
- [지시사항] rules/41 규약 준수 + 자연어/참조 활용

Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2c.md (Task 1)
EOF
)"
```

---

## Task 2: ComposerCanvas — `[✨ 화면 생성]` 버튼 + `onCreate` prop

**Files:**
- Modify: `frontend/src/view/util/t3composer/ComposerCanvas.jsx`

**배경:** 현재 ComposerCanvas 는 spec 편집만 — 생성 트리거가 없음. 우상단에 [✨ 화면 생성] 버튼을 추가해 사용자가 명시적으로 생성 시작.

- [ ] **Step 1: 함수 시그니처에 `onCreate` 추가**

기존:
```jsx
function ComposerCanvas({ spec, onChange, readOnly = false, targetCd, onOpenDataSourcePicker }) {
```

→ 다음으로 교체:
```jsx
function ComposerCanvas({ spec, onChange, readOnly = false, targetCd, onOpenDataSourcePicker, onCreate }) {
```

- [ ] **Step 2: Button + AutoAwesome 아이콘 import 확인**

상단 import 블록에 `Button` 추가 (현재 Box/Typography/Chip 만):

```jsx
import { Box, Typography, Button } from '@mui/material';
```

(`AutoAwesomeIcon` 은 이미 import 되어 있음 — 카드 아이콘으로 사용 중.)

- [ ] **Step 3: 본문 최상단 (FilterBar 노란 띠 위) 에 헤더 줄 추가**

기존 코드의 FilterBar 노란 띠 박스 (`<Box onClick={...setFilterDialogOpen...}>`) **직전** 에 다음 헤더 영역 삽입:

```jsx
{/* ───── 액션 헤더 — [✨ 화면 생성] 버튼 ───── */}
{!readOnly && onCreate && (
  <Box sx={{
    flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1,
    pb: 0.5,
  }}>
    <Typography variant="caption" sx={{ color: '#64748b', mr: 'auto' }}>
      각 영역에 데이터를 채운 뒤 우측 [화면 생성] 버튼을 누르면 Claude 가 산출물을 만들어 미리보기 까지 진행합니다.
    </Typography>
    <Button
      variant="contained"
      size="small"
      startIcon={<AutoAwesomeIcon fontSize="small" />}
      onClick={() => onCreate(spec)}
      sx={{
        bgcolor: '#9D8FD4', color: '#fff', fontWeight: 700, letterSpacing: '0.02em',
        '&:hover': { bgcolor: '#8b7dca' },
        boxShadow: '0 2px 8px rgba(157,143,212,0.35)',
      }}
    >
      화면 생성
    </Button>
  </Box>
)}
```

- [ ] **Step 4: 컴파일 확인**

Run: `docker compose logs --tail=20 composer-frontend 2>&1 | grep -iE "ERROR in|SyntaxError" | head -5`
Expected: 0건.

- [ ] **Step 5: commit (UI 검증은 Task 3 통합 후 함께)**

```bash
git add frontend/src/view/util/t3composer/ComposerCanvas.jsx
git commit -m "feat(composer): ComposerCanvas — [✨ 화면 생성] 버튼 + onCreate prop

상단 헤더 우측에 보라색 [화면 생성] 버튼 추가. onCreate?(spec) 콜백 prop.
prop 미제공 시 버튼 숨김 (readOnly 거나 외부에서 트리거 안 받는 경우 대비).

좌측에는 안내 caption.

Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2c.md (Task 2)"
```

---

## Task 3: ModeNewStep — stage='WORKSPACE' 추가 + createSession + ComposerWorkspace 임베드

**Files:**
- Modify: `frontend/src/view/util/t3composer/ModeNewStep.jsx`

**배경:** 현재 ModeNewStep 의 stage 는 `'PICK' | 'CANVAS'` 두 단계. WORKSPACE 추가해 createSession 성공 시 `<ComposerWorkspace>` 임베드. extraHeader 에 "← 캔버스로" 종료 버튼 (setSession(null) + setStage('CANVAS')).

- [ ] **Step 1: import 추가**

기존 import 블록에 다음 추가:

```jsx
import ComposerWorkspace from './ComposerWorkspace';
import { specToInitialPrompt } from './wizardState';
import { createSession } from './api';
```

(`specFromMockup` / `specFromUiPattern` 와 묶어서 한 줄:)
```jsx
import { specFromPattern, specFromMockup, specFromUiPattern, specToInitialPrompt } from './wizardState';
```

- [ ] **Step 2: state 추가**

`function ModeNewStep({ onBack }) {` 안의 useState 블록에 다음 추가:

```jsx
const [session, setSession] = useState(null);
const [initialPrompt, setInitialPrompt] = useState('');
const [creating, setCreating] = useState(false);
const [createError, setCreateError] = useState(null);
```

- [ ] **Step 3: handleCreate 핸들러 추가**

기존 `startWithPattern` 함수 아래에 다음 추가:

```jsx
// ComposerCanvas 의 [화면 생성] 버튼 콜백 — spec → createSession → ComposerWorkspace.
const handleCreate = async (currentSpec) => {
  if (!currentSpec) return;
  setCreating(true);
  setCreateError(null);
  try {
    const promptText = specToInitialPrompt(currentSpec);
    const title = (currentSpec.meta?.title || '새 화면').slice(0, 80);
    const res = await createSession({
      mode: 'NEW_STEP',
      title,
      modelName: 'claude-sonnet-4-5',
      targetCd: currentTargetCd,
    });
    setSession(res.data);
    setInitialPrompt(promptText);
    setStage('WORKSPACE');
  } catch (e) {
    setCreateError(e?.response?.data?.message
               || e?.response?.data?.error
               || e?.message
               || '세션 생성 실패');
  } finally {
    setCreating(false);
  }
};
```

- [ ] **Step 4: WORKSPACE 단계 분기 추가**

기존 코드의 CANVAS 단계 분기 (`if (stage === 'CANVAS' && spec) { ... }`) **직전** 에 다음 추가:

```jsx
// WORKSPACE 단계 — Claude 호출 + 산출물 생성 + 화면 실행 흐름. 기존 ComposerWorkspace 재활용.
if (stage === 'WORKSPACE' && session) {
  return (
    <ComposerWorkspace
      session={session}
      initialPrompt={initialPrompt}
      extraHeader={
        <Button
          size="small"
          startIcon={<ArrowBackIcon fontSize="small" />}
          onClick={() => {
            setSession(null);
            setInitialPrompt('');
            setStage('CANVAS');
          }}
          sx={{ mr: 1 }}
        >
          캔버스로
        </Button>
      }
    />
  );
}
```

- [ ] **Step 5: CANVAS 단계의 ComposerCanvas 사용처에 `onCreate` prop 추가**

기존:
```jsx
<ComposerCanvas
  spec={spec}
  onChange={setSpec}
  targetCd={currentTargetCd}
  onOpenDataSourcePicker={(editingLayer) => {
    setDsPickerLayerKey(editingLayer?.key || null);
    setDsPickerOpen(true);
  }}
/>
```

→ 다음으로 교체 (`onCreate` + creating disabled 처리):
```jsx
<ComposerCanvas
  spec={spec}
  onChange={setSpec}
  targetCd={currentTargetCd}
  onOpenDataSourcePicker={(editingLayer) => {
    setDsPickerLayerKey(editingLayer?.key || null);
    setDsPickerOpen(true);
  }}
  onCreate={creating ? undefined : handleCreate}
/>
```

- [ ] **Step 6: createError 표시 — CANVAS 단계 헤더 Stack 아래에 한 줄**

기존:
```jsx
<Stack direction="row" alignItems="center" spacing={1} sx={{ p: 1, borderBottom: '1px solid #e2e8f0' }}>
  <Button size="small" startIcon={<ArrowBackIcon />}
          onClick={() => setStage('PICK')}>패턴 다시 선택</Button>
  <Typography variant="caption" sx={{ color: '#64748b', ml: 1 }}>
    pattern: <b>{spec.meta.pattern}</b> · 시각 편집 모드 (Phase 1 — 산출물 생성은 Phase 2)
  </Typography>
</Stack>
```

→ caption 문구 갱신 + creating 상태 표시 + error 알림 (Stack 직후):

```jsx
<Stack direction="row" alignItems="center" spacing={1} sx={{ p: 1, borderBottom: '1px solid #e2e8f0' }}>
  <Button size="small" startIcon={<ArrowBackIcon />}
          onClick={() => setStage('PICK')}>패턴 다시 선택</Button>
  <Typography variant="caption" sx={{ color: '#64748b', ml: 1 }}>
    pattern: <b>{spec.meta.pattern}</b> · 시각 편집 모드
    {creating ? ' · 세션 생성 중...' : ''}
  </Typography>
</Stack>
{createError && (
  <Box sx={{
    bgcolor: '#fee2e2', color: '#991b1b', borderBottom: '1px solid #fecaca',
    px: 1.5, py: 0.7, fontSize: 12, fontWeight: 600,
  }}>
    ⚠ {createError}
  </Box>
)}
```

- [ ] **Step 7: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError" | head -5`
Expected: 0건.

- [ ] **Step 8: end-to-end 시각 검증**

브라우저 `http://localhost:5173`:

1. ModeSelector → "단계별 생성 (Beta)" → "빈 캔버스 (P02)"
2. ComposerCanvas 진입 — 상단에 **[✨ 화면 생성] 버튼** (보라색) 보이는지 ✓
3. 메인 그리드 클릭 → DataMiniDialog → 자연어 입력 (예: "사용자 마스터. TB_AD_USER. ID/USERNAME/DISPLAY_NAME 컬럼") → `+ Table` `TB_AD_USER` 추가 → 적용
4. **[화면 생성] 클릭** → caption 에 "세션 생성 중..." 표시 → 잠시 후 WORKSPACE 진입
5. ComposerWorkspace 가 뜨고 ChatPanel 에 자동으로 specToInitialPrompt 결과가 첫 메시지로 들어가 Claude 호출 시작 ✓
6. 우측 ArtifactPanel 에 JSX/Java/SQL/MENU 산출물이 점점 채워짐 ✓
7. 헤더의 [화면 실행] 버튼 클릭 → AI mockup 변환 → 실행 화면 LIVE 탭에 mockup 표시 ✓
8. 좌상단 "← 캔버스로" 버튼 → CANVAS 단계로 복귀 (spec 그대로 유지)
9. CANVAS 에서 데이터 수정 → 다시 [화면 생성] → 새 세션 + 새 산출물

- [ ] **Step 9: commit**

```bash
git add frontend/src/view/util/t3composer/ModeNewStep.jsx
git commit -m "$(cat <<'EOF'
feat(composer): ModeNewStep — WORKSPACE 단계 + end-to-end 미리보기

stage 에 'WORKSPACE' 추가. ComposerCanvas 의 [✨ 화면 생성] 버튼 클릭 시:
- specToInitialPrompt(spec) 으로 자연어 직렬화
- createSession({mode:'NEW_STEP', title, modelName, targetCd})
- 성공 시 setSession + setStage('WORKSPACE')
- <ComposerWorkspace session={...} initialPrompt={...}> 임베드

ComposerWorkspace 의 extraHeader 에 "← 캔버스로" 버튼 — setSession(null) +
setStage('CANVAS') 로 spec 보존하며 복귀 가능.

[효과]
패턴 선택 → 시각 편집 → 데이터 입력 → 생성 → Claude 호출 → 산출물 → 미리보기
전체 end-to-end Backend 수정 없이 동작.

[유지]
ComposerWorkspace 의 ChatPanel/ArtifactPanel/PreviewEmbed/AI 자동보완/자연어 보정
인프라 그대로 재활용.

[알려진 한계]
- Backend ComposerPromptBuilder 의 NEW_STEP 전용 가이드 미적용 (Phase 2B-3 예정).
  현재는 NEW_NL 흐름 system prompt 사용. spec 의 구조화된 자연어가 충분히 명확해
  Claude 가 화면 의도 파악 가능.
- 메뉴 코드/경로 미정 시 Claude 가 추론하거나 사용자가 후속 채팅으로 보완.

Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2c.md (Task 3)
EOF
)"
```

---

## Task 4: Phase 2C 통합 smoke + 종료 마커

**Files:** (변경 없음, 검증만)

- [ ] **Step 1: 전체 컴파일 healthcheck**

Run: `docker compose logs --tail=100 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError|Failed to compile" | head -10`
Expected: 0건.

- [ ] **Step 2: end-to-end smoke 시나리오**

브라우저 `http://localhost:5173`:

**시나리오 A — 빈 캔버스 (P02) 부터 미리보기까지**:
1. ModeSelector → "단계별 생성 (Beta)" → "빈 캔버스 (P02)" ✓
2. ComposerCanvas — [✨ 화면 생성] 버튼 노출 ✓
3. 메인 그리드 클릭 → DataMiniDialog → 자연어 "TB_AD_USER 의 사용자 마스터 화면. ID/USERNAME/DISPLAY_NAME 컬럼" + `+ Table` `TB_AD_USER` → 적용 ✓
4. FilterBar 노란 띠 → FilterBarMiniDialog → 필드 `USERNAME` TEXT 추가 → 적용 ✓
5. [화면 생성] 클릭 → "세션 생성 중..." → WORKSPACE 진입 ✓
6. ChatPanel 에 초기 prompt 표시 + Claude 응답 시작 ✓
7. ArtifactPanel 에 JSX/Java/SQL/MENU 산출물 채워짐 ✓
8. 헤더 [화면 실행] → 잠시 후 [실행 화면 LIVE] 탭에 mockup 표시 ✓
9. 좌상단 "← 캔버스로" → CANVAS 복귀 → spec 유지 ✓
10. [✨ 화면 생성] 다시 → 새 세션 (이전 session 폐기, 새 산출물 트리)

**시나리오 B — SCM Mockup 패턴 (LAYOUT_DASHBOARD)**:
1. ModeNewStep → "SCM UI Mockup" → DASHBOARD 카테고리 mockup 선택 ✓
2. ComposerCanvas — KPI / 위젯 1~4 카드 (5개) 표시 ✓
3. 위젯 1 (CHART_BAR) 클릭 → DataMiniDialog → 자연어 "월별 판매 추세" → 적용 ✓
4. KPI 카드 클릭 → 자연어 "전월 대비 매출 KPI" → 적용 ✓
5. [화면 생성] → WORKSPACE → Claude 가 DASHBOARD 형 화면 생성 ✓

**시나리오 C — 회귀 검증**:
다른 모드 (NEW_NL / NEW_FROM_COPY / NEW_FROM_DESIGN / EXISTING_MODIFY) 진입 → 기존 동작 그대로 ✓

- [ ] **Step 3: Phase 2C 종료 commit**

```bash
git commit --allow-empty -m "$(cat <<'EOF'
milestone(composer): Phase 2C complete — ComposerWorkspace 통합 + end-to-end

NEW_STEP 모드의 패턴 선택 → 시각 편집 → 산출물 생성 → 화면 미리보기 전체
흐름 backend 수정 없이 완성.

[Commits]
- (Task 1) specToInitialPrompt 헬퍼
- (Task 2) ComposerCanvas [✨ 화면 생성] 버튼
- (Task 3) ModeNewStep WORKSPACE 단계 + ComposerWorkspace 임베드

[E2E 흐름]
ModeSelector → 단계별 생성 → 패턴 picker (Mockup/UiPattern/빈캔버스)
  → ComposerCanvas 시각 편집 (FilterBar + Layers 클릭 → mini dialog)
  → [화면 생성] → createSession + specToInitialPrompt → ComposerWorkspace
  → ChatPanel 이 Claude 호출 → ArtifactPanel 에 산출물 → [화면 실행] → 미리보기

[유지]
ChatPanel / ArtifactPanel / PreviewEmbed / ArtifactPreviewService /
AI mockup 변환 / AI 자동보완 / ChatPanel 자연어 보정 — 기존 인프라 그대로.

[다음 단계]
- Phase 2B-2 + 2B-3: 4모드 (NEW_GENERAL/NL/COPY/DESIGN) 결과 ComposerSpec 통일 +
                    Backend ComposerPromptBuilder NEW_STEP 가이드 갱신
- Phase 1.5 (나중): Layer 자유 추가/이동/삭제/분할 (RGL drag/resize)
- Phase 3: 9-Step Wizard 코드 제거 + rule 갱신

Spec: docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md
Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2c.md
EOF
)"
```

---

## Self-Review

**1. Spec coverage (Phase 2C 부분):**

| Spec 항목 | 구현 task |
|---|---|
| ComposerWorkspace 통합 (산출물 생성 / 화면실행) | Task 3 (WORKSPACE 단계) |
| Claude 호출을 위한 prompt 직렬화 | Task 1 (specToInitialPrompt) |
| ComposerCanvas 의 생성 트리거 | Task 2 ([화면 생성] 버튼) |
| AI 자동보완 / 자연어 보정 | 기존 ComposerWorkspace 가 보유 — 자동 활성 |
| Backend ComposerPromptBuilder NEW_STEP 가이드 갱신 | **Phase 2B-3** (별도 plan) — Phase 2C 는 NEW_NL system prompt + spec 자연어로 동작 |
| 4모드 (NEW_GENERAL/NL/COPY/DESIGN) 결과 통일 | **Phase 2B-2** |

**2. Placeholder scan:** "TBD" / "implement later" / "fill in details" 패턴 0건. ✓

**3. Type consistency:**
- `specToInitialPrompt(spec)` 의 입력 = ComposerSpec (createComposerSpec 의 반환값 구조와 일치 — meta/filterBar/layers) ✓
- `createSession({mode, title, modelName, targetCd})` — api.js:70 시그니처와 일치 ✓
- `<ComposerWorkspace session, initialPrompt, extraHeader>` — ComposerWorkspace.jsx:136 시그니처와 일치 ✓
- `onCreate(spec)` 콜백 시그니처 — ComposerCanvas (Task 2) 와 ModeNewStep.handleCreate (Task 3) 일치 ✓
- `setSession(null) + setStage('CANVAS')` 로 ComposerWorkspace 종료 — ModeNewGeneral 패턴과 동일 ✓

**4. Ambiguity:**
- "WORKSPACE 에서 돌아온 후 spec 보존" — 명시. `setSession(null)` 만 하고 `spec` state 는 그대로 → 다시 [화면 생성] 누르면 새 세션 + 같은 spec.
- "menuCd / menuFilePath 미정 시" — specToInitialPrompt 가 빈 값이면 prompt 에 표시 안 함. Claude 가 추론하거나 사용자가 후속 채팅으로 보완 (Phase 2C 범위 외).
- "ComposerSpec 변경이 산출물에 자동 반영되는가" — **아니오**. WORKSPACE 진입 후 spec 수정해도 산출물 재생성 안 함. 사용자가 명시적으로 "← 캔버스로" → 수정 → [화면 생성] 새로 누름. spec 의 양방향 동기화는 후속 (Phase 3).

---

## Execution Choice

**Plan complete and saved to `docs/superpowers/plans/2026-05-22-composer-canvas-phase2c.md`.** 두 가지 실행 옵션:

**1. Subagent-Driven** — 매 task fresh subagent
**2. Inline Execution (recommended)** — 이 세션에서 직접 (4 task, ComposerWorkspace 통합이 짝아서 빠름)

어느 쪽으로?

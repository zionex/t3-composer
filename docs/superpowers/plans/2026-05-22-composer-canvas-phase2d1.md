# Composer Canvas (Phase 2D-1 — 메뉴 등록) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자가 ComposerCanvas 에서 [메뉴/메타] 버튼으로 **활성 Target 의 메뉴 트리** (T3SERIES / PlanNEL / LGES_NEXTSCM 각자 구조 다름) 에서 부모 메뉴를 선택하고, 화면 제목 / 메뉴 코드 / 메뉴 경로를 입력해 `spec.meta` 에 저장. specToInitialPrompt 가 이 메타를 prompt 에 출력 → Claude 가 정확한 `MENU_SQL` 산출 (자동 추론 정확도 의존 종료).

**Architecture:** `MenuPickerDialog` 에 optional `targetCd` prop 추가 — 있으면 `loadTargetMenuTree(lang, targetCd)` (활성 Target DB 의 메뉴 트리), 없으면 기존 `listAllMenus()` (composer-db). nested 트리 응답을 flat 으로 변환해 기존 byParent map 로직 그대로 활용. 신규 `ScreenMetaDialog` 가 화면 제목·메뉴 코드·메뉴 경로·부모 메뉴 picker 통합 입력. ComposerCanvas 헤더에 [메뉴/메타] 버튼 + 현재 meta 의 짧은 chip.

**Tech Stack:** React 18 + MUI 5 + 기존 MenuPickerDialog · loadTargetMenuTree API. 테스트 환경 없음 — webpack 빌드 + dev server 시각 검증.

**Spec:** `docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md`
**전제:** Phase 1.5 (commit cddb94f) 머지 + `loadTargetMenuTree` API 활성 (이미 동작 확인됨, Phase 2A 의 NEW_FROM_COPY 에서 사용 중).

**Dev 환경**: composer-frontend port 5173. 로그: `docker compose logs --tail=50 composer-frontend`.

---

## File Structure

| 파일 | 변경 종류 | 책임 |
|---|---|---|
| `frontend/src/view/util/t3composer/MenuPickerDialog.jsx` | **prop 추가** | optional `targetCd` 받음. 있으면 `loadTargetMenuTree('ko', targetCd)` 호출 + nested→flat 변환. 기존 `listAllMenus` 호출처 (ScreenOverviewForm, MenuRegistrationDialog) 회귀 없음 |
| `frontend/src/view/util/t3composer/ScreenMetaDialog.jsx` | **신규** | 화면 제목 · 메뉴 코드 (`UI_<DOMAIN>_<NAME>`) · 메뉴 경로 (`/<module>[/<category>]/<PascalName>`) · 부모 메뉴 picker (MenuPickerDialog 호출). spec.meta 갱신용 |
| `frontend/src/view/util/t3composer/ComposerCanvas.jsx` | **헤더 보강** | 헤더에 [메뉴/메타] 버튼 추가 + 현재 meta 상태 chip 표시 ("UI_AD_USERS" · "MENU_AD" 등). 클릭 → ScreenMetaDialog open |

**기존 활용:**
- `loadTargetMenuTree(lang, targetCd)` (api.js:22) — Target DB 의 nested 메뉴 트리. 응답: `{ items: [{ id, filePath, path, displayName, items: [...] }] }`
- `MenuPickerDialog` — flat 형식 입력 + tree 재구성. `onSelect(menu)` 콜백 시그니처: `{ menuCd, menuPath, menuFilePath, isGroup, parentId }`
- `useTargetStore.currentTargetCd` (ModeNewStep 에서 chain 중)
- `ComposerSpec.meta` 4필드: `menuCd / title / parentMenuCd / menuFilePath` — 이미 정의됨

**기존 활용 확인 (변경 없음):**
- `specToInitialPrompt` (wizardState.js Task 1 of Phase 2C) — meta 모든 필드 출력 중. spec.meta 가 채워지면 자동으로 prompt 에 반영됨.

---

## Task 1: MenuPickerDialog — `targetCd` prop 지원

**Files:**
- Modify: `frontend/src/view/util/t3composer/MenuPickerDialog.jsx`

**배경:** 현재 `listAllMenus()` 만 호출 (composer-db 전체). 활성 Target (T3SERIES vs PlanNEL) 의 메뉴 트리는 별도 endpoint (`loadTargetMenuTree`). `targetCd` prop 있을 때만 새 endpoint, 없으면 기존 동작 — 기존 호출처 회귀 없음.

- [ ] **Step 1: import 추가**

기존 `import { listAllMenus } from './api';` 를 다음으로 교체:

```jsx
import { listAllMenus, loadTargetMenuTree } from './api';
```

- [ ] **Step 2: 함수 시그니처에 targetCd 추가 + nested→flat 변환 helper**

기존:
```jsx
function MenuPickerDialog({ open, onClose, onSelect, selectGroupOnly = true }) {
```

→ 다음으로 교체:
```jsx
/**
 * loadTargetMenuTree 의 nested 응답 → flat menus 배열 변환.
 *   nested 노드: { id, filePath, path, displayName, items: [...] }
 *   flat 노드:   { id, menuCd, menuNm, menuPath, menuFilePath, parentId, isGroup, seq }
 */
function flattenTargetMenuTree(nodes, parentId = null, seqRef = { v: 0 }) {
  const result = [];
  for (const n of (nodes || [])) {
    const children = Array.isArray(n.items) ? n.items : [];
    result.push({
      id: n.id,
      menuCd: n.id,
      menuNm: n.displayName || n.id,
      menuPath: n.path || '',
      menuFilePath: n.filePath || '',
      parentId,
      isGroup: children.length > 0,
      seq: seqRef.v += 1,
    });
    if (children.length > 0) {
      result.push(...flattenTargetMenuTree(children, n.id, seqRef));
    }
  }
  return result;
}

function MenuPickerDialog({ open, onClose, onSelect, selectGroupOnly = true, targetCd }) {
```

- [ ] **Step 3: `load` 함수에 targetCd 분기 추가**

기존:
```jsx
  const load = async () => {
    setLoading(true);
    try {
      const res = await listAllMenus();
      setMenus(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '메뉴 조회 실패');
    } finally {
      setLoading(false);
    }
  };
```

→ 다음으로 교체:
```jsx
  const load = async () => {
    setLoading(true);
    try {
      if (targetCd) {
        // Target DB 의 nested 메뉴 트리 → flat 변환
        const res = await loadTargetMenuTree('ko', targetCd);
        const items = res.data?.items || [];
        setMenus(flattenTargetMenuTree(items));
      } else {
        // composer-db 의 전체 메뉴 (기존 동작)
        const res = await listAllMenus();
        setMenus(Array.isArray(res.data) ? res.data : []);
      }
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '메뉴 조회 실패');
    } finally {
      setLoading(false);
    }
  };
```

- [ ] **Step 4: useEffect 의 dependency 에 targetCd 추가**

기존:
```jsx
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelected(null);
    setError(null);
    load();
  }, [open]);
```

→ 다음으로 교체 (targetCd 변경 시 재조회):
```jsx
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelected(null);
    setError(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, targetCd]);
```

- [ ] **Step 5: 컴파일 확인**

Run: `docker compose logs --tail=20 composer-frontend 2>&1 | grep -iE "ERROR in|SyntaxError" | head -5`
Expected: 0건.

- [ ] **Step 6: 회귀 검증 — 기존 호출처 (NEW_FROM_COPY 진입) 동작 확인**

브라우저 → ModeSelector → "기존 화면 복사" → MenuTreeBrowser 정상 노출 ✓
(MenuPickerDialog 가 ScreenOverviewForm / MenuRegistrationDialog 안에서 사용되는데, 거기는 targetCd 없이 호출 → 기존 listAllMenus 동작 유지)

- [ ] **Step 7: commit**

```bash
git add frontend/src/view/util/t3composer/MenuPickerDialog.jsx
git commit -m "$(cat <<'EOF'
feat(composer): MenuPickerDialog — targetCd prop 지원

active Target (T3SERIES/PlanNEL/LGES_NEXTSCM) 의 메뉴 트리 표시.

[변경]
- targetCd prop optional 추가
- targetCd 있으면 loadTargetMenuTree('ko', targetCd) 호출 → nested 응답
- nested → flat 변환 (flattenTargetMenuTree) → 기존 byParent map 로직 그대로
- targetCd 없으면 기존 listAllMenus() 동작 유지

[회귀 보호]
ScreenOverviewForm / MenuRegistrationDialog 에서 targetCd 미지정 → 기존 동작.

Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2d1.md (Task 1)
EOF
)"
```

---

## Task 2: ScreenMetaDialog 신규 — 화면 제목 / 메뉴 코드 / 부모 메뉴 picker

**Files:**
- Create: `frontend/src/view/util/t3composer/ScreenMetaDialog.jsx`

**배경:** ComposerSpec.meta 의 4필드 (title / menuCd / parentMenuCd / menuFilePath) 를 사용자가 입력. 부모 메뉴는 MenuPickerDialog 호출. 메뉴 코드/경로는 직접 입력 또는 자동 추론 (`UI_<DOMAIN>_<NAME>` / `/<module>/<PascalName>`).

- [ ] **Step 1: 신규 파일 작성**

`frontend/src/view/util/t3composer/ScreenMetaDialog.jsx`:

```jsx
/**
 * ScreenMetaDialog — ComposerSpec.meta 의 4필드 입력 모달.
 *
 *   props:
 *     open
 *     onClose()
 *     meta            ComposerSpec.meta { title, menuCd, parentMenuCd, menuFilePath, pattern }
 *     onApply(nextMeta)
 *     targetCd        활성 Target — 부모 메뉴 picker 가 이 Target 의 메뉴 트리 표시
 *
 *   디자인:
 *     - 화면 제목 — TextField
 *     - 메뉴 코드 (UI_<DOMAIN>_<NAME>) — TextField + 자동 추론 도움말
 *     - 메뉴 파일 경로 (/<module>/<PascalName>) — TextField
 *     - 부모 메뉴 — chip + [선택] 버튼 → MenuPickerDialog (targetCd 전달)
 *
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2d1.md (Task 2)
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, IconButton, Stack, Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

import MenuPickerDialog from './MenuPickerDialog';

function ScreenMetaDialog({ open, onClose, meta, onApply, targetCd }) {
  const [title, setTitle] = useState('');
  const [menuCd, setMenuCd] = useState('');
  const [parentMenuCd, setParentMenuCd] = useState('');
  const [parentMenuLabel, setParentMenuLabel] = useState('');  // 표시용
  const [menuFilePath, setMenuFilePath] = useState('');
  const [menuPickerOpen, setMenuPickerOpen] = useState(false);

  // open 시 hydrate
  useEffect(() => {
    if (!open) return;
    setTitle(meta?.title || '');
    setMenuCd(meta?.menuCd || '');
    setParentMenuCd(meta?.parentMenuCd || '');
    setParentMenuLabel(meta?.parentMenuCd || '');
    setMenuFilePath(meta?.menuFilePath || '');
  }, [open, meta]);

  const handleApply = () => {
    onApply({
      ...(meta || {}),
      title: title.trim(),
      menuCd: menuCd.trim(),
      parentMenuCd: parentMenuCd.trim(),
      menuFilePath: menuFilePath.trim(),
    });
    onClose();
  };

  const handleParentSelect = (selectedMenu) => {
    if (!selectedMenu) return;
    setParentMenuCd(selectedMenu.menuCd || selectedMenu.id || '');
    setParentMenuLabel(
      selectedMenu.menuNm
        ? `${selectedMenu.menuCd} (${selectedMenu.menuNm})`
        : (selectedMenu.menuCd || selectedMenu.id || '')
    );
    setMenuPickerOpen(false);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ color: '#1e40af', fontWeight: 800 }}>
            📋 화면 메타 — 메뉴 등록
          </Typography>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                화면 제목
              </Typography>
              <TextField
                value={title} onChange={(e) => setTitle(e.target.value)}
                fullWidth size="small"
                placeholder="예: 사용자정보 관리"
                sx={{ mt: 0.5 }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                메뉴 코드 (MENU_CD) — <code style={{ fontSize: 11 }}>UI_&lt;DOMAIN&gt;_&lt;NAME&gt;</code> 형식
              </Typography>
              <TextField
                value={menuCd} onChange={(e) => setMenuCd(e.target.value.toUpperCase())}
                fullWidth size="small"
                placeholder="UI_UT_USER_INFO_MGMT"
                helperText="비워두면 Claude 가 화면 의도에서 추론합니다."
                FormHelperTextProps={{ sx: { fontSize: 10 } }}
                sx={{ mt: 0.5, '& input': { fontFamily: 'monospace' } }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                메뉴 파일 경로 (MENU_FILE_PATH) — JSX 컴포넌트 경로
              </Typography>
              <TextField
                value={menuFilePath} onChange={(e) => setMenuFilePath(e.target.value)}
                fullWidth size="small"
                placeholder="/util/UserInfoMgmt"
                helperText="형식: /<module>[/<category>]/<PascalName> (확장자 없이). 비워두면 Claude 가 결정."
                FormHelperTextProps={{ sx: { fontSize: 10 } }}
                sx={{ mt: 0.5, '& input': { fontFamily: 'monospace' } }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                부모 메뉴 (그룹) — 활성 Target ({targetCd || '미선택'}) 의 메뉴 트리
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.7 }}>
                {parentMenuCd ? (
                  <Chip
                    label={parentMenuLabel || parentMenuCd}
                    onDelete={() => { setParentMenuCd(''); setParentMenuLabel(''); }}
                    sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 700, fontFamily: 'monospace' }}
                  />
                ) : (
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                    미선택 — Claude 가 화면 의도에서 추론
                  </Typography>
                )}
                <Button
                  size="small" variant="outlined"
                  startIcon={<AccountTreeIcon fontSize="small" />}
                  onClick={() => setMenuPickerOpen(true)}
                  disabled={!targetCd}
                >
                  메뉴 선택
                </Button>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 2, py: 1 }}>
          <Button onClick={onClose}>취소</Button>
          <Button onClick={handleApply} variant="contained">적용</Button>
        </DialogActions>
      </Dialog>

      <MenuPickerDialog
        open={menuPickerOpen}
        onClose={() => setMenuPickerOpen(false)}
        onSelect={handleParentSelect}
        selectGroupOnly={true}
        targetCd={targetCd}
      />
    </>
  );
}

export default ScreenMetaDialog;
```

- [ ] **Step 2: 컴파일 확인**

Run: `docker compose logs --tail=20 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError" | head -5`
Expected: 0건.

- [ ] **Step 3: commit (UI 통합은 Task 3 후)**

```bash
git add frontend/src/view/util/t3composer/ScreenMetaDialog.jsx
git commit -m "$(cat <<'EOF'
feat(composer): ScreenMetaDialog — 화면 메타 / 메뉴 등록 입력

ComposerSpec.meta 4필드 입력 모달.
- 화면 제목 (TextField)
- 메뉴 코드 (MENU_CD) — UPPER_SNAKE 자동 변환
- 메뉴 파일 경로 (MENU_FILE_PATH)
- 부모 메뉴 — chip + [선택] 버튼 → MenuPickerDialog (targetCd 전달, 활성 Target 메뉴 트리)

빈 값 허용 — Claude 가 화면 의도에서 추론. 정확한 등록이 필요하면 사용자가 명시.

Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2d1.md (Task 2)
EOF
)"
```

---

## Task 3: ComposerCanvas — 헤더에 [메뉴/메타] 버튼 + 메타 chip + ScreenMetaDialog 통합

**Files:**
- Modify: `frontend/src/view/util/t3composer/ComposerCanvas.jsx`

**배경:** 사용자가 [화면 생성] 누르기 전에 메타 입력. ComposerCanvas 헤더에 [메뉴/메타] 버튼 + 현재 meta 상태 chip ("UI_AD_USERS / MENU_AD" 같이) 표시.

- [ ] **Step 1: import 추가**

기존 ComposerCanvas.jsx 상단 import 블록에 다음 추가:

```jsx
import ScreenMetaDialog from './ScreenMetaDialog';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
```

⚠️ `EditNoteOutlined` 가 MUI 5.11 에 없을 수 있음 → fallback `SettingsOutlined` 또는 `MenuBookOutlined` 사용:

```jsx
import EditNoteOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
```

(둘 다 시도해서 컴파일 통과하는 쪽으로)

- [ ] **Step 2: state 추가**

`ComposerCanvas` 함수 안 useState 들 옆에:

```jsx
const [metaDialogOpen, setMetaDialogOpen] = useState(false);
```

- [ ] **Step 3: 헤더에 [메뉴/메타] 버튼 + chip 추가**

기존 헤더 (`{!readOnly && (...)}` 블록의 Typography 옆) — `[+ Layer]` 버튼 직전에 다음 추가:

```jsx
{spec?.meta && (
  <>
    <Chip
      label={
        spec.meta.menuCd
          ? `${spec.meta.menuCd}${spec.meta.parentMenuCd ? ` · ⊂ ${spec.meta.parentMenuCd}` : ''}`
          : '메뉴 미설정'
      }
      size="small"
      onClick={() => setMetaDialogOpen(true)}
      sx={{
        cursor: 'pointer',
        bgcolor: spec.meta.menuCd ? '#dbeafe' : '#fef3c7',
        color:   spec.meta.menuCd ? '#1e40af' : '#92400e',
        fontWeight: 700, fontFamily: 'monospace',
        '&:hover': { bgcolor: spec.meta.menuCd ? '#bfdbfe' : '#fde68a' },
      }}
    />
    <Button
      variant="outlined"
      size="small"
      startIcon={<EditNoteOutlinedIcon fontSize="small" />}
      onClick={() => setMetaDialogOpen(true)}
      sx={{
        color: '#475569', borderColor: '#cbd5e1', fontWeight: 600,
        '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
      }}
    >
      메뉴/메타
    </Button>
  </>
)}
```

배치 순서 (헤더 안): `Typography → [메타 chip] → [메뉴/메타 버튼] → [+ Layer] → [화면 생성]`

- [ ] **Step 4: 컴포넌트 끝의 Dialog 들 옆에 ScreenMetaDialog 추가**

기존 `<DataMiniDialog ...>` `<FilterBarMiniDialog ...>` 블록 옆에:

```jsx
<ScreenMetaDialog
  open={metaDialogOpen}
  onClose={() => setMetaDialogOpen(false)}
  meta={spec?.meta}
  targetCd={targetCd}
  onApply={(nextMeta) => {
    onChange({ ...spec, meta: nextMeta });
  }}
/>
```

- [ ] **Step 5: 컴파일 확인**

Run: `docker compose logs --tail=20 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError" | head -5`
Expected: 0건.

⚠️ 만약 `EditNoteOutlinedIcon` import 가 실패하면 Step 1 의 fallback (`MenuBookOutlined`) 으로 교체.

- [ ] **Step 6: end-to-end 시각 검증**

브라우저 `http://localhost:5173`:

1. ModeSelector → "단계별 생성" → "빈 캔버스 (P02)" ✓
2. ComposerCanvas 헤더에 **[메뉴/메타] 버튼** + "메뉴 미설정" chip (노란색) 보임 ✓
3. [메뉴/메타] 클릭 → ScreenMetaDialog 열림 ✓
4. 화면 제목 = "사용자정보 관리", 메뉴 코드 = "UI_UT_USER_INFO_MGMT", 메뉴 경로 = "/util/UserInfoMgmt" 입력 ✓
5. [메뉴 선택] 클릭 → MenuPickerDialog 열림 → **활성 Target 의 메뉴 트리** 표시 (T3SERIES 면 MENU_UTIL/MENU_DP 등, PlanNEL 이면 다른 구조) ✓
6. 그룹 메뉴 선택 (예: MENU_UTIL) → [선택] → ScreenMetaDialog 의 부모 메뉴 chip 에 표시 ✓
7. [적용] → ComposerCanvas 헤더의 chip 이 "UI_UT_USER_INFO_MGMT · ⊂ MENU_UTIL" (파란색) 으로 변함 ✓
8. [화면 생성] 클릭 → ComposerWorkspace 진입 → ChatPanel 의 initialPrompt 에 다음이 포함 ✓:
   ```
   [화면 제목] 사용자정보 관리
   [메뉴 코드] UI_UT_USER_INFO_MGMT
   [부모 메뉴] MENU_UTIL
   [메뉴 경로] /util/UserInfoMgmt
   ```
9. Claude 산출물의 MENU_SQL 이 이 메타를 그대로 사용 (TB_AD_MENU INSERT 의 MENU_CD = UI_UT_USER_INFO_MGMT, PARENT_ID = MENU_UTIL lookup 등) ✓
10. 회귀: 다른 모드 (NEW_NL / NEW_FROM_COPY / NEW_FROM_DESIGN) 진입 → 기존 동작 (MenuPickerDialog 가 listAllMenus 사용) ✓

- [ ] **Step 7: commit**

```bash
git add frontend/src/view/util/t3composer/ComposerCanvas.jsx
git commit -m "$(cat <<'EOF'
feat(composer): ComposerCanvas — [메뉴/메타] 버튼 + ScreenMetaDialog 통합

ComposerCanvas 헤더에 [메뉴/메타] 버튼 + 현재 메타 상태 chip 추가.

[헤더 chip]
- spec.meta.menuCd 있으면 'UI_AD_USERS · ⊂ MENU_AD' (파란색)
- 없으면 '메뉴 미설정' (노란색 — 경고)
- 클릭 → ScreenMetaDialog open

[ScreenMetaDialog 통합]
- meta prop = spec.meta · targetCd prop chain
- onApply(nextMeta) → spec.meta 갱신
- 부모 메뉴 picker 가 활성 Target 의 메뉴 트리 표시

[효과]
사용자가 [화면 생성] 전에 정확한 메뉴 등록 정보 입력 →
specToInitialPrompt 가 prompt 에 명시 → Claude 의 MENU_SQL 산출물이 정확.

Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2d1.md (Task 3)
EOF
)"
```

---

## Task 4: Phase 2D-1 통합 smoke + 종료 마커

**Files:** (변경 없음, 검증만)

- [ ] **Step 1: 전체 컴파일 healthcheck**

Run: `docker compose logs --tail=100 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError|Failed to compile" | head -10`
Expected: 0건.

- [ ] **Step 2: smoke 시나리오 — T3SERIES**

브라우저 — T3SERIES 활성:

1. 헤더 Target dropdown 에서 T3SERIES 선택
2. ModeNewStep → 빈 캔버스 → ComposerCanvas → [메뉴/메타]
3. MenuPickerDialog 의 트리에 `MENU_UTIL` / `MENU_DP` / `MENU_MP` 등 T3SERIES 그룹 노드들 표시 ✓
4. MENU_UTIL 선택 → 적용 → chip 표시 ✓
5. [화면 생성] → Claude 가 메타 활용한 MENU_SQL 생성 ✓

- [ ] **Step 3: smoke 시나리오 — PlanNEL**

브라우저 — PlanNEL 활성:

1. 헤더 Target dropdown 에서 PlanNEL 선택
2. ModeNewStep → 빈 캔버스 → [메뉴/메타] → 메뉴 선택
3. MenuPickerDialog 의 트리에 **PlanNEL 의 메뉴 구조** 표시 (T3SERIES 와 다름 — PlanNEL 의 운영 DB 메뉴) ✓
4. 그룹 노드 선택 → 적용 ✓

- [ ] **Step 4: 회귀 확인**

NEW_FROM_COPY / NEW_FROM_DESIGN / NEW_NL / EXISTING_MODIFY 모드 진입 → MenuTreeBrowser / MenuPickerDialog 가 기존대로 동작 (targetCd 없이 listAllMenus 호출) ✓

- [ ] **Step 5: Phase 2D-1 종료 commit**

```bash
git commit --allow-empty -m "$(cat <<'EOF'
milestone(composer): Phase 2D-1 complete — 메뉴 등록 (Target 별 트리)

활성 Target (T3SERIES / PlanNEL / LGES_NEXTSCM) 의 메뉴 트리에서 부모 메뉴 선택 +
화면 제목/코드/경로 입력 → spec.meta → Claude prompt → MENU_SQL.

[Commits]
- (Task 1) MenuPickerDialog targetCd prop 지원
- (Task 2) ScreenMetaDialog 신규
- (Task 3) ComposerCanvas 헤더 [메뉴/메타] 버튼 + 메타 chip + ScreenMetaDialog 통합

[효과]
- Target 별 메뉴 구조 차이 (T3SERIES vs PlanNEL) 사용자가 직접 확인하며 등록
- 정확한 MENU_SQL 산출 (자동 추론 정확도 의존 종료)
- 빈 값 허용 — 사용자가 명시 안 하면 Claude 가 의도에서 추론

[유지]
- 기존 NEW_FROM_COPY / NEW_FROM_DESIGN / NEW_NL / EXISTING_MODIFY 모드: targetCd 없이 listAllMenus
- ScreenOverviewForm / MenuRegistrationDialog 호출처: 회귀 없음

[다음 단계]
- Phase 2D-2: Layer 간 관계 설정 (master-detail / drill-down / onRowDoubleClick)
- Phase 2B-2 + 2B-3: 4모드 ComposerSpec 통일 + Backend prompt 갱신
- Phase 3: 9-Step Wizard 코드 제거

Spec: docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md
Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2d1.md
EOF
)"
```

---

## Self-Review

**1. Spec coverage (Phase 2D-1):**

| Spec 요구 | 구현 task |
|---|---|
| Target 별 메뉴 트리 (T3SERIES/PlanNEL/LGES_NEXTSCM 구조 다름) | Task 1 (MenuPickerDialog targetCd) |
| 부모 메뉴 picker UI | Task 2 (ScreenMetaDialog) + Task 3 통합 |
| 화면 제목 / 메뉴 코드 / 메뉴 경로 입력 | Task 2 |
| spec.meta 갱신 | Task 3 (onApply) |
| Claude prompt 에 메타 명시 | **이미 구현됨** (specToInitialPrompt Phase 2C Task 1) |
| 기존 모드 회귀 보호 | Task 1 (targetCd 미지정 시 기존 동작) |

**2. Placeholder scan:** "TBD" / "implement later" 0건. ✓

**3. Type consistency:**
- `MenuPickerDialog.onSelect(menu)` 시그니처 — `{ menuCd, menuPath, menuFilePath, isGroup, parentId }` (Task 1 의 flat 변환 결과와 일치) ✓
- `ScreenMetaDialog.onApply(nextMeta)` — ComposerSpec.meta 구조와 일치 (`title, menuCd, parentMenuCd, menuFilePath, pattern`) ✓
- `specToInitialPrompt` (이미 작성) 가 meta 의 모든 필드 출력 — Task 3 의 spec.meta 갱신 후 자동 반영 ✓
- `flattenTargetMenuTree` 의 반환 필드 (`{ id, menuCd, menuNm, menuPath, menuFilePath, parentId, isGroup, seq }`) — 기존 MenuPickerDialog 의 tree 빌드 로직 (line 70 byParent) 과 호환 (parentId 사용) ✓

**4. Ambiguity:**
- "메뉴 코드 자동 추론" — 사용자가 빈 값 두면 Claude 가 추론. 명시적 입력이 권장이지만 강제 아님. 의도된 유연성.
- `EditNoteOutlinedIcon` MUI 5.11 호환 — Task 3 Step 1 에 fallback 명시.

---

## Execution Choice

**Plan complete and saved to `docs/superpowers/plans/2026-05-22-composer-canvas-phase2d1.md`.** 두 가지 실행 옵션:

**1. Subagent-Driven** — 매 task fresh subagent
**2. Inline Execution (recommended)** — 이 세션에서 직접 (4 task, MenuPickerDialog 한 곳 + 신규 1개 + ComposerCanvas 한 곳)

어느 쪽으로?

# Composer 홈 버튼 (로고 클릭) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 좌측 사이드바 최상단 T3Composer 로고를 클릭하면 어디서든 Composer 의 모드 선택 화면(첫 화면)으로 돌아가게 한다. 작업 중이면 confirm 다이얼로그로 손실 방지. 세션은 보존 (History 에서 이어하기 가능).

**Architecture:**
- App.jsx 의 로고 박스 onClick → `t3composer:resetToHome` window event dispatch + `openTab('composer')` (기존 `t3composer:openTab` 이벤트 패턴과 동일).
- T3Composer.jsx 가 그 이벤트를 listen → `mode === null` 이면 no-op, 아니면 MUI Dialog 로 confirm → [돌아가기] 클릭 시 `setMode(null)`.
- ComposerWorkspace.jsx 는 변경 없음.

**Spec 과의 deviation (의도적 단순화)**:
- Spec §2.3 의 "작업 중 판단" = `messages user >= 1 OR artifacts >= 1` 정밀 판단은 **1단계 구현에서 `mode !== null` 로 단순화**. 이유: ComposerWorkspace 가 messages/artifacts state 를 자체 보유하지 않고 ChatPanel / ArtifactTreeView 가 분산 관리해, 정밀 판단을 위해서는 추가 prop drilling 또는 dirty 신호 패턴이 필요하기 때문. 향후 ComposerWorkspace 가 dirty flag 를 export 하면 정밀화 가능 (별도 plan).
- 결과: mode 진입 후 아무 입력 없이 로고 클릭해도 confirm 한 번 발화 — 사용자는 [돌아가기] 한 번 더 클릭. 빈도 낮고 안전 우선.

**Tech Stack:** React 18 · MUI v5 (Dialog) · 기존 window CustomEvent 패턴.

**Test Infrastructure:** Composer frontend 에 자동 테스트 인프라 없음 (`package.json` 에 jest/vitest 미설치). **Manual 검증 시나리오** 로 대체 — spec §5 의 10개 시나리오 중 핵심 항목을 Task 4 에서 확인.

---

## File Structure

| 파일 | 역할 | 변경 유형 |
|---|---|---|
| `frontend/src/App.jsx` | 좌측 사이드바 로고 박스에 `onClick` / `onKeyDown` / `cursor:pointer` / hover / role · tabIndex · aria-label 부착. Tooltip 문구 갱신. 접기 토글 IconButton 에 `stopPropagation` 추가. | Modify |
| `frontend/src/view/util/t3composer/T3Composer.jsx` | `confirmHomeOpen` state + `t3composer:resetToHome` window event listener + MUI Confirm Dialog (`Dialog`/`DialogTitle`/`DialogContent`/`DialogContentText`/`DialogActions`/`Button` import) | Modify |

새 파일 없음. 새 npm 의존성 없음 (MUI 는 이미 의존성).

---

## Task 1: T3Composer.jsx — Confirm Dialog + window event listener 추가

**Files:**
- Modify: `frontend/src/view/util/t3composer/T3Composer.jsx`

이 task 가 먼저 머지되어도 App.jsx 미적용 상태면 `t3composer:resetToHome` event 가 dispatch 되지 않아 no-op — 빌드/기동 깨지지 않음. 그래서 task 1 부터 시작.

- [ ] **Step 1: MUI Dialog import 추가**

`T3Composer.jsx` 의 상단 import 영역을 확인하고 (현재 어떤 MUI import 가 있는지) `@mui/material` 에서 Dialog 관련 컴포넌트를 import 한다.

먼저 현재 import 구조 확인:

```bash
grep -n "from '@mui/material'" frontend/src/view/util/t3composer/T3Composer.jsx
```

기존 `@mui/material` import 라인이 있으면 거기에 추가, 없으면 새 import 라인 추가.

예상 import 추가:

```jsx
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
```

이미 일부가 import 되어 있으면 누락된 것만 추가.

- [ ] **Step 2: `confirmHomeOpen` state 추가**

`T3Composer.jsx:342` 부근 (`const [mode, setMode] = useState(null);` 옆) 에 state 추가:

```jsx
const [confirmHomeOpen, setConfirmHomeOpen] = useState(false);
```

위치는 다른 dialog state (`apiKeyDialogOpen` 등) 근처가 자연스러움.

- [ ] **Step 3: `t3composer:resetToHome` listener useEffect 추가**

`T3Composer.jsx` 의 다른 useEffect 들 (예: popstate listener `:365-369`) 옆에 추가. `mode` 가 deps 에 들어가야 listener 가 최신 mode 값을 본다.

```jsx
// 좌측 로고 클릭으로 발화되는 home reset 신호 — mode !== null 이면 confirm, 아니면 no-op
useEffect(() => {
  const handler = () => {
    if (mode === null) return;        // 이미 모드 선택 화면 — 추가 동작 불필요
    setConfirmHomeOpen(true);
  };
  window.addEventListener('t3composer:resetToHome', handler);
  return () => window.removeEventListener('t3composer:resetToHome', handler);
}, [mode]);
```

- [ ] **Step 4: Confirm 핸들러 함수 추가**

useEffect 아래에 두 핸들러 추가:

```jsx
const handleHomeConfirm = useCallback(() => {
  setConfirmHomeOpen(false);
  setMode(null);
}, []);

const handleHomeCancel = useCallback(() => {
  setConfirmHomeOpen(false);
}, []);
```

- [ ] **Step 5: Confirm Dialog JSX 추가**

`T3Composer.jsx:570-574` 의 `<ApiKeyDialog ... />` 옆 (return 의 `</ContentInner>` 직전 또는 직후) 에 Dialog 추가:

```jsx
<Dialog open={confirmHomeOpen} onClose={handleHomeCancel} maxWidth="xs" fullWidth>
  <DialogTitle>모드 선택 화면으로 돌아가기</DialogTitle>
  <DialogContent>
    <DialogContentText>
      현재 입력한 내용은 사라집니다. (세션은 History 에서 이어할 수 있습니다.)
      <br />
      모드 선택 화면으로 돌아가시겠습니까?
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleHomeCancel}>취소</Button>
    <Button onClick={handleHomeConfirm} variant="contained" autoFocus>돌아가기</Button>
  </DialogActions>
</Dialog>
```

- [ ] **Step 6: webpack 빌드 확인 — 컴파일 에러 없음**

frontend 컨테이너의 webpack 이 변경 감지해 자동 재빌드. 다음 명령으로 컴파일 상태 확인:

```bash
docker compose logs --tail 50 composer-frontend | grep -i "error\|compiled"
```

Expected: `Compiled successfully` 또는 `Compiled with N warnings` (에러 없음).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/view/util/t3composer/T3Composer.jsx
git commit -m "feat(composer): T3Composer 에 t3composer:resetToHome listener + confirm dialog"
```

---

## Task 2: App.jsx — 로고 박스 onClick / 키보드 / cursor / Tooltip 변경

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: handleLogoClick 콜백 추가**

`App.jsx:46` 부근 `TabbedHome()` 함수 안, 기존 `openTab` 콜백 (`:53-56`) 옆에 추가:

```jsx
const handleLogoClick = useCallback(() => {
  // Composer Tab 활성화 — 닫혀 있으면 열고, 열려 있으면 active 만 전환
  openTab('composer');
  // T3Composer 에 reset 신호 전달 — listener 가 mode !== null 이면 confirm
  window.dispatchEvent(new CustomEvent('t3composer:resetToHome'));
}, [openTab]);
```

- [ ] **Step 2: 로고 박스 Tooltip + onClick + 접근성 prop 추가**

`App.jsx:97-129` 의 로고 박스 영역을 변경. 현재:

```jsx
<Box sx={{
    display: 'flex', alignItems: 'center', gap: 1,
    px: collapsed ? 0 : 1.5, py: 1.2, minHeight: 52,
    justifyContent: collapsed ? 'center' : 'flex-start',
    borderBottom: '1px solid', borderColor: 'divider',
}}>
    <Tooltip title="T3Composer v1.0 — AI 화면 생성 워크스페이스" placement="right">
        <Box sx={{ display: 'flex', cursor: 'default' }}>
            <Logo size={collapsed ? 30 : 28} />
        </Box>
    </Tooltip>
    {!collapsed && (
        <>
            <Typography ... >T3Composer<Box ...>v1.0</Box></Typography>
            <Tooltip title="메뉴 접기">
                <IconButton size="small" onClick={() => setCollapsed(true)}
                            sx={{ color: 'text.secondary' }}>
                    <KeyboardDoubleArrowLeftIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </>
    )}
</Box>
```

변경 후 — **외곽 Box** 자체를 clickable 로 만들고, 접기 IconButton 만 stopPropagation 처리:

```jsx
<Tooltip title="Composer 홈으로 — 모드 선택 화면" placement="right">
    <Box
        role="button"
        tabIndex={0}
        aria-label="Composer 홈으로"
        onClick={handleLogoClick}
        onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleLogoClick();
            }
        }}
        sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            px: collapsed ? 0 : 1.5, py: 1.2, minHeight: 52,
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderBottom: '1px solid', borderColor: 'divider',
            cursor: 'pointer',
            transition: 'background-color .15s ease',
            '&:hover': { bgcolor: 'rgba(124,167,224,0.10)' },
            '&:focus-visible': {
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: '-2px',
            },
        }}
    >
        <Box sx={{ display: 'flex' }}>
            <Logo size={collapsed ? 30 : 28} />
        </Box>
        {!collapsed && (
            <>
                <Typography component="div" sx={{
                    flex: 1, fontSize: '0.92rem', fontWeight: 800,
                    color: 'primary.dark', letterSpacing: '-0.3px', whiteSpace: 'nowrap',
                }}>
                    T3Composer
                    <Box component="span" sx={{
                        fontSize: '0.62rem', fontWeight: 600, color: 'text.secondary', ml: 0.5,
                    }}>
                        v1.0
                    </Box>
                </Typography>
                <Tooltip title="메뉴 접기">
                    <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); setCollapsed(true); }}
                        sx={{ color: 'text.secondary' }}
                    >
                        <KeyboardDoubleArrowLeftIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </>
        )}
    </Box>
</Tooltip>
```

주요 변경:
- **외곽 Box** 를 Tooltip 의 자식으로 옮김 (이전엔 내부 Logo Box 만 Tooltip)
- 외곽 Box 에 `role="button"` / `tabIndex={0}` / `aria-label` / `onClick={handleLogoClick}` / `onKeyDown` 추가
- 외곽 Box 의 sx 에 `cursor: 'pointer'` / hover `&:hover` / focus `&:focus-visible` 추가
- 내부 Logo Box 의 `cursor: 'default'` 제거 (외곽이 pointer)
- Tooltip 문구 변경: "T3Composer v1.0 — AI 화면 생성 워크스페이스" → "Composer 홈으로 — 모드 선택 화면"
- 접기 IconButton `onClick` 에 `e.stopPropagation()` 추가 (홈 reset 발화 방지)

- [ ] **Step 3: webpack 빌드 확인**

```bash
docker compose logs --tail 50 composer-frontend | grep -i "error\|compiled"
```

Expected: `Compiled successfully`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat(composer): 좌측 사이드바 T3Composer 로고를 홈 버튼으로 — 어디서든 Composer 첫 화면 복귀"
```

---

## Task 3: Manual 검증

**Files:** (변경 없음 — 동작 검증만)

Spec §5 의 10개 시나리오 중 핵심 6개를 브라우저에서 확인. 각 시나리오 후 결과를 plan 에 체크.

전제: 브라우저에서 `http://localhost:5173` (또는 환경의 frontend host) 접속.

- [ ] **Step 1: 시나리오 1 — 빈 세션 (mode=null) 에서 로고 클릭**

1. Composer Tab 진입 → 모드 선택 카드 화면 (`mode === null`) 인 상태
2. 좌측 사이드바의 T3Composer 로고 영역 클릭

Expected:
- Tooltip "Composer 홈으로 — 모드 선택 화면" 표시 (hover 시)
- 클릭해도 confirm 다이얼로그 안 뜸 (이미 첫 화면)
- 화면 그대로 — 모드 선택 카드 보임

- [ ] **Step 2: 시나리오 2 — NEW_NL 모드 진입 후 로고 클릭 → confirm → 돌아가기**

1. Composer 의 [✨ AI 추천으로 화면 시작] 카드 클릭 → ModeNewGeneral 진입 (`mode !== null`)
2. 자연어 입력란에 "재고 현황 조회" 같은 텍스트 입력 (선택 — confirm 은 mode !== null 만으로 발화)
3. 좌측 로고 클릭

Expected:
- Confirm Dialog 표시 — 제목 "모드 선택 화면으로 돌아가기" + 본문 "현재 입력한 내용은 사라집니다..."
- [돌아가기] 클릭 → Dialog 닫힘 + 모드 선택 카드 화면으로 복귀 (`mode === null`)

- [ ] **Step 3: 시나리오 3 — Confirm Dialog 에서 [취소]**

1. 다시 NEW_NL / NEW_STEP / NEW_FROM_COPY 등 모드 진입
2. 로고 클릭 → Confirm Dialog 표시
3. [취소] 클릭

Expected:
- Dialog 닫힘
- 현재 모드 화면 유지 (mode 그대로)

- [ ] **Step 4: 시나리오 4 — 다른 Tab (SCM UI Mockup) 에서 로고 클릭**

1. Composer 에서 NEW_NL 모드 진입 상태로 둠
2. 좌측 사이드바의 [SCM UI Mockup] 클릭 → SCM UI Mockup Tab active
3. 좌측 로고 클릭

Expected:
- Composer Tab 활성으로 자동 전환
- Composer 의 mode !== null 이라 Confirm Dialog 표시
- [돌아가기] → Composer 의 모드 선택 카드 화면

- [ ] **Step 5: 시나리오 6+7 — 접힘 상태 / 접기 토글 stopPropagation**

1. 좌측 사이드바 펼침 상태에서 접기 토글 IconButton (`KeyboardDoubleArrowLeftIcon`) 클릭

Expected:
- 사이드바 접힘 — 로고만 표시
- Confirm Dialog 발화 안 됨 (stopPropagation 동작)

2. 접힘 상태에서 로고 클릭

Expected:
- 동일하게 홈 reset 동작 (작업 중이면 Confirm)

- [ ] **Step 6: 시나리오 10 — Tab 키 + Enter 로 로고 클릭**

1. 페이지 어느 곳을 클릭해 포커스 잡고, Tab 키를 여러 번 눌러 로고 박스에 포커스가 갈 때까지 진행
2. 포커스 상태 시각 확인 — `focus-visible` outline (primary.main 색 2px) 보임
3. Enter 또는 Space 키 입력

Expected:
- 클릭과 동일한 동작 (Confirm 또는 즉시 home)

- [ ] **Step 7: 시나리오 결과 commit (별도 변경 없으면 skip)**

이 task 는 manual 검증 only — 코드 변경 없음. 검증 결과를 자유 형식으로 commit message 본문에 적고 빈 commit 또는 plan 문서 자체 갱신 (검증 ✅ 표시) commit 만 가능. 별도 commit 안 해도 무방.

검증 중 이슈 발견 시:
- Task 1 또는 Task 2 의 해당 step 으로 돌아가 수정 + 새 commit

---

## 자기 검증 (개발자가 직접 확인)

다음 항목이 모두 통과해야 plan 완료:

- [ ] Tooltip 문구 변경됨 ("Composer 홈으로 — 모드 선택 화면")
- [ ] 로고 박스 hover 시 옅은 파스텔 blue 배경 (`rgba(124,167,224,0.10)`)
- [ ] 로고 박스 클릭 시 cursor: pointer
- [ ] 접기 IconButton 클릭 시 reset 발화 안 됨 (Confirm Dialog 안 뜸)
- [ ] mode === null 일 때 로고 클릭 시 Confirm 없음, 즉시 no-op
- [ ] mode !== null 일 때 로고 클릭 시 Confirm 표시
- [ ] [돌아가기] 클릭 → 모드 선택 화면, [취소] → 현재 화면 유지
- [ ] 다른 Tab active 일 때 로고 클릭 시 Composer Tab 으로 자동 전환 (단, Composer 작업 중이면 Confirm 먼저)
- [ ] Tab 키로 포커스 + Enter/Space 키로 발화
- [ ] focus-visible outline 보임
- [ ] webpack `Compiled successfully` 메시지

---

## 향후 확장 (이번 plan 범위 밖)

1. **정밀 작업 중 판단** — ComposerWorkspace 가 messages/artifacts count 를 ref 또는 prop callback 으로 T3Composer 에 노출하면 spec §2.3 원본 의도 (`messages user >= 1 OR artifacts >= 1`) 구현 가능. 별도 plan.
2. **다른 Tab (History/Mockup/Pattern/Gallery)** 의 "첫 화면 리셋" — 각 Tab 의 깊이/use case 정의 후 별도 plan.
3. **세션 폐기 (ARCHIVE / 삭제)** 빠른 액션 — 로고 우클릭 contextmenu 등. 우선순위 낮음.

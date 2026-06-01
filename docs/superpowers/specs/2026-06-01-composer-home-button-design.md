# Composer [홈으로] 버튼 설계 — 좌측 로고 클릭

**작성일**: 2026-06-01
**대상**: T3Composer (`frontend/src/App.jsx` + `frontend/src/view/util/t3composer/T3Composer.jsx`)
**범위**: 1단계 — Composer Tab 만 홈 시멘틱. History / SCM UI Mockup / UI Pattern / Gallery 적용은 별도.

---

## 1. 배경

Composer 의 우측 작업 영역에서 사용자가 9단계 wizard, 자연어 입력, 산출물 검토 등 작업을 진행하던 중 **전부 중단하고 모드 선택 화면(Composer 첫 화면)으로 돌아가고 싶을 때** 가 있다. 현재 모드 선택으로 돌아가는 경로는 제한적이다:

- 브라우저 뒤로가기 (popstate → `setMode(null)`)
- ModeXxx 컴포넌트의 "← 뒤로" (NEW_GENERAL / EXISTING_MODIFY 진입 화면에서만 노출)
- 좌측 메뉴를 다른 Tab 으로 이동 후 다시 Composer Tab 클릭 (Tab 콘텐츠가 보존되므로 실효 X)

좌측 사이드바는 Tab 시스템이라 클릭해도 콘텐츠 mount 가 유지된다 ([App.jsx:46-77](../../../frontend/src/App.jsx#L46-L77)) — Tab 동작은 그대로 유지하면서, **좌측 사이드바 최상단의 T3Composer 로고 영역 자체를 "홈" 트리거** 로 만든다. 표준 웹 UX 패턴 (로고 = 홈) 과 일치하고 어떤 Tab/모드/상태에서든 일관되게 작동한다.

---

## 2. 동작

### 2.1 클릭 대상 영역

좌측 사이드바 최상단의 **로고 + "T3Composer v1.0" 텍스트 박스 전체** ([App.jsx:97-129](../../../frontend/src/App.jsx#L97-L129)).

- 사이드바 펼침 상태: 로고 + 프로그램명 + 버전 칩 → 전체가 한 clickable 영역
- 사이드바 접힘 상태: 로고만 → 동일하게 clickable
- 접기/펼치기 토글 IconButton 은 분리 — `onClick stopPropagation` 으로 홈 트리거와 겹치지 않게

시각적 affordance:
- `cursor: pointer` + 호버 시 옅은 hover background
- Tooltip: "Composer 홈으로 — 모드 선택 화면" (기존 "T3Composer v1.0 — AI 화면 생성 워크스페이스" 대체)

### 2.2 시멘틱 — Composer Tab 활성 + mode 리셋, 세션 보존

클릭 시 두 단계:

1. **Tab 활성화**:
   - Composer Tab 이 닫혀 있으면 `openTab('composer')` (Tab 추가 + active)
   - 열려 있으면 `activeKey = 'composer'` 로 전환만
2. **mode 리셋**: T3Composer 내부의 `setMode(null)` 발화 → 모드 선택 카드 화면

현재 세션 (`session.id`) 은 `STATUS=ACTIVE` 그대로 DB 에 보존. 사용자는 History Tab → [이어하기] 로 동일 세션 복귀 가능. ⚠ 단, 9단계 wizard 의 컴포넌트 state (입력 중이던 spec) 는 unmount 로 사라짐 — 이어하기 시엔 prefill 함수가 처음부터 다시 채움.

### 2.3 Confirm 다이얼로그

"작업 중" 일 때만 confirm. 그 외엔 바로 이동.

**"작업 중" 판단** (둘 중 하나라도 참이면 작업 중):
- 현재 세션의 사용자 메시지 ≥ 1건 (`messages.filter(m => m.role === 'user').length`)
- 또는 현재 세션의 산출물 ≥ 1건 (`artifacts.length`, status 무관 — DRAFT 포함)

판단은 T3Composer 가 이미 보유한 state 로 derive — 새 API 호출 / 추가 dirty flag 불필요.

**다이얼로그 문구**:
> "현재 입력한 내용은 사라집니다 (세션은 History 에서 이어할 수 있습니다).
> 모드 선택 화면으로 돌아가시겠습니까?"
>
> [취소]  [돌아가기]

**Edge case**:
- Composer Tab 이 active 가 아닌 상태 (예: SCM UI Mockup Tab 에서 로고 클릭) → Composer 의 작업 중 여부 판단을 위해 T3Composer 내부의 confirm 호출. 즉:
  - Composer 가 mount 상태가 아닐 일은 없음 (Tab 콘텐츠 보존). 작업 중 판단 가능.
  - confirm 발화 → 사용자 [돌아가기] 선택 시 active 전환 + mode 리셋, [취소] 선택 시 현재 Tab 그대로 유지.

---

## 3. 구현 포인트

### 3.1 변경 파일

| 파일 | 변경 |
|---|---|
| [App.jsx](../../../frontend/src/App.jsx) | 로고 박스 ([App.jsx:97-129](../../../frontend/src/App.jsx#L97-L129)) 의 `onClick` 핸들러 추가 → `t3composer:resetToHome` window event dispatch + (필요 시) `openTab('composer')`. Tooltip 문구 갱신. 접기 토글 버튼은 `stopPropagation`. cursor/hover 스타일. |
| [T3Composer.jsx](../../../frontend/src/view/util/t3composer/T3Composer.jsx) | `t3composer:resetToHome` window event listener 추가. 핸들러 내부:<br/>1. 작업 중 판단 (messages/artifacts 검사)<br/>2. confirm 분기<br/>3. `setMode(null)` 호출 |

새 파일 없음. 새 npm 의존성 없음.

### 3.2 Event-bus 패턴

기존 `window.dispatchEvent('t3composer:openTab', {detail: {key}})` ([App.jsx:59-66](../../../frontend/src/App.jsx#L59-L66)) 과 같은 패턴.

```js
// App.jsx 로고 onClick
const handleLogoClick = () => {
    // Composer Tab 이 닫혀 있으면 먼저 열고 active 전환
    if (!openTabs.includes('composer')) openTab('composer');
    else setActiveKey('composer');
    // T3Composer 내부에 reset 신호 전달 (T3Composer 가 confirm 처리 + setMode(null))
    window.dispatchEvent(new CustomEvent('t3composer:resetToHome'));
};

// T3Composer.jsx
useEffect(() => {
    const handler = () => {
        const userMsgCount = messages.filter(m => m.role === 'user').length;
        const artifactCount = artifacts.length;
        const hasWork = userMsgCount > 0 || artifactCount > 0;
        if (hasWork) {
            // confirm 다이얼로그 (state 로 open 제어)
            setConfirmHomeOpen(true);
        } else {
            setMode(null);
        }
    };
    window.addEventListener('t3composer:resetToHome', handler);
    return () => window.removeEventListener('t3composer:resetToHome', handler);
}, [messages, artifacts]);
```

### 3.3 Confirm UI

- MUI `Dialog` 사용 (기존 ComposerWorkspace 에서 사용 중인 패턴 follow)
- T3Composer.jsx 내부에 inline 으로 정의 (1회성 confirm, 별도 컴포넌트 분리 X)
- [돌아가기] → `setMode(null)` + dialog close
- [취소] → dialog close only

### 3.4 접근성

- 로고 박스에 `role="button"` + `tabIndex={0}` + `aria-label="Composer 홈으로"`
- Enter/Space 키 핸들러 추가 (`onKeyDown`) — 접기 토글과 동일 패턴

---

## 4. 범위 외 (이번엔 안 함)

- History / SCM UI Mockup / UI Pattern / Gallery Tab 의 "첫 화면 리셋" — 각 Tab 의 깊이/use case 가 달라 별도 디자인 필요. 로고 클릭은 **Composer 만** 영향.
- 좌측 사이드바 메뉴 항목 (Composer / History / ...) 클릭 동작 변경 — Tab 시스템 그대로 유지
- 세션 자동 ARCHIVE / 폐기 — "보존" 시멘틱만, 폐기는 별도 [세션 삭제] 메뉴와 분리
- wizard 입력 중인 spec 의 임시 저장 (auto-save draft) — 별건 (사용자 요구 없음)

---

## 5. 검증 시나리오

1. **빈 세션 (mode=null) 에서 로고 클릭** → confirm 없이 그대로 (이미 모드 선택 화면)
2. **NEW_NL 모드에서 메시지 1건 보낸 뒤 로고 클릭** → confirm → [돌아가기] → 모드 선택 화면
3. **확인 다이얼로그에서 [취소]** → 현재 화면 유지 (Tab 도 전환 안 됨)
4. **다른 Tab (SCM UI Mockup) 에서 로고 클릭, Composer 에 작업 중 세션 있음** → confirm → [돌아가기] → Composer Tab 활성 + 모드 선택 화면. [취소] → SCM UI Mockup Tab 유지.
5. **Composer Tab 안 닫고 다른 Tab 새로 열어 active 한 상태에서 로고 클릭, Composer 작업 없음** → confirm 없이 Composer Tab 활성 전환 + (이미 mode=null 이라 그 화면 그대로)
6. **사이드바 접힘 상태에서 로고만 표시될 때 로고 클릭** → 동일 동작
7. **사이드바 접기 토글 IconButton 클릭** → 토글만 동작, 홈 reset 발화 X (stopPropagation)
8. **돌아간 뒤 History Tab → 같은 세션 [이어하기]** → ACTIVE 상태로 다시 진입 (NEW_FROM_COPY 라면 prefill 재실행)
9. **9단계 wizard step 5 에서 로고 클릭** → confirm → [돌아가기] → 모드 선택. 이어하기 시엔 wizard step 1 부터.
10. **Tab 키로 로고 박스에 포커스 + Enter** → 클릭과 동일 동작

---

## 6. 향후 확장 (참고만)

- 다른 Tab 들에도 같은 "첫 화면 리셋" 패턴 적용 시: 각 Tab 의 "깊이" 정의 필요. 예: SCM UI Mockup 의 mockup 상세 → 갤러리 첫 페이지. UI Pattern 의 iframe → Section 트리. 이는 별도 spec.
- 로고 우측 클릭 (contextmenu) 으로 "현재 세션 폐기" 빠른 액션 — 우선순위 낮음, 별건.
- "wizard 입력 임시 저장" 이 필요하면 별도 디자인. 현재는 prefill 함수가 잘 동작하므로 우선순위 낮음.

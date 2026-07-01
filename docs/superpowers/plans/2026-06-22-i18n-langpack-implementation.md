# 다국어 (LangPack) 영어 우선 — 구현 plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** T3Composer 프론트엔드 메인 진입부 + Mode 진입 화면 + 4-Step Wizard + ChatPanel/Workspace UI 를 영어 지원하고 Claude 응답도 선택 언어로 받게 한다 (산출물 코드의 한국어 라벨은 유지).

**Architecture:** react-i18next + i18next-browser-languagedetector 도입 (namespace 3개: common/composer/wizard). LanguageSwitcher 가 localStorage 영속. Backend 는 `ComposerSession.ui_language` 컬럼 추가 + `ComposerPromptBuilder.buildStaticSystemPrompt(uiLanguage)` 가 응답 언어 지침 주입. Frontend api.js axios interceptor 가 `lang: i18n.language` 자동 첨부.

**Tech Stack:** React 18 / MUI 5 / Zustand / react-i18next 13 / i18next 23 / Spring Boot 3.0.13 / PostgreSQL (composer-db)

**Spec:** [docs/superpowers/specs/2026-06-22-i18n-langpack-design.md](../specs/2026-06-22-i18n-langpack-design.md)

---

## Phase 1 — 기반 인프라

### Task 1: 의존성 추가 + i18n 초기화 골격

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/src/i18n/index.js`
- Create: `frontend/src/i18n/locales/ko/common.json`
- Create: `frontend/src/i18n/locales/ko/composer.json`
- Create: `frontend/src/i18n/locales/ko/wizard.json`
- Create: `frontend/src/i18n/locales/en/common.json`
- Create: `frontend/src/i18n/locales/en/composer.json`
- Create: `frontend/src/i18n/locales/en/wizard.json`

- [ ] **Step 1: package.json 에 의존성 추가**

`frontend/package.json` 의 `dependencies` 에 다음 3개 추가 (axios 다음 자리):
```json
"i18next": "^23.7.0",
"i18next-browser-languagedetector": "^7.2.0",
"react-i18next": "^13.5.0",
```

- [ ] **Step 2: npm install (composer-frontend 컨테이너 안에서)**

Run: `docker compose exec -T composer-frontend npm install --legacy-peer-deps`
Expected: 의존성 3종 추가 완료, 0 vulnerabilities or harmless audit warnings

- [ ] **Step 3: i18n 초기화 모듈 작성**

`frontend/src/i18n/index.js`:
```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import koCommon   from './locales/ko/common.json';
import koComposer from './locales/ko/composer.json';
import koWizard   from './locales/ko/wizard.json';
import enCommon   from './locales/en/common.json';
import enComposer from './locales/en/composer.json';
import enWizard   from './locales/en/wizard.json';

i18n.use(LanguageDetector).use(initReactI18next).init({
  resources: {
    ko: { common: koCommon, composer: koComposer, wizard: koWizard },
    en: { common: enCommon, composer: enComposer, wizard: enWizard },
  },
  fallbackLng: 'ko',
  supportedLngs: ['ko', 'en'],
  ns: ['common', 'composer', 'wizard'],
  defaultNS: 'common',
  detection: {
    order: ['localStorage', 'navigator'],
    lookupLocalStorage: 'composer.lang',
    caches: ['localStorage'],
  },
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
  saveMissing: process.env.NODE_ENV === 'development',
  missingKeyHandler: (lng, ns, key) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(`[i18n] missing key: ${ns}:${key} (${lng})`);
    }
  },
});

export default i18n;
```

- [ ] **Step 4: 빈 사전 6개 작성**

각 파일은 단순히 `{}` 만 들어있는 빈 JSON:
```json
{}
```

총 6개 파일: `locales/{ko,en}/{common,composer,wizard}.json`

- [ ] **Step 5: 진입점 wiring**

`frontend/src/index.js` 상단 (React import 들 사이) 에 1줄 추가:
```js
import './i18n';
```

위치: `import { createRoot } from 'react-dom/client';` 다음 줄.

- [ ] **Step 6: 빌드 확인**

Run: `docker compose exec -T composer-frontend npx webpack --mode development --no-stats 2>&1 | tail -5`
Expected: 컴파일 성공, 에러 없음

- [ ] **Step 7: Commit**

```bash
git add frontend/package.json frontend/src/i18n/
git commit -m "feat(i18n): react-i18next 도입 + namespace 3개 골격

- i18next + react-i18next + browser-languagedetector 추가
- locales/{ko,en}/{common,composer,wizard}.json 6개 빈 사전
- index.js 진입점에서 1회 초기화
- fallbackLng=ko, localStorage 영속 (key: composer.lang)
- dev 환경 missingKey console.warn

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: LanguageSwitcher 컴포넌트

**Files:**
- Create: `frontend/src/view/util/t3composer/LanguageSwitcher.jsx`

- [ ] **Step 1: 컴포넌트 작성**

`frontend/src/view/util/t3composer/LanguageSwitcher.jsx`:
```jsx
import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language.startsWith('en') ? 'en' : 'ko';
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={current}
      onChange={(_, v) => v && i18n.changeLanguage(v)}
      sx={{ ml: 1, '& .MuiToggleButton-root': { px: 1.5, py: 0.25, fontSize: 12, fontWeight: 700 } }}
    >
      <ToggleButton value="ko">KO</ToggleButton>
      <ToggleButton value="en">EN</ToggleButton>
    </ToggleButtonGroup>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/view/util/t3composer/LanguageSwitcher.jsx
git commit -m "feat(i18n): LanguageSwitcher 토글 컴포넌트

- MUI ToggleButtonGroup KO/EN
- i18n.changeLanguage 호출 → LanguageDetector 가 localStorage 영속

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: useUiLanguage hook (Backend 전달용)

**Files:**
- Create: `frontend/src/view/util/t3composer/useUiLanguage.js`

- [ ] **Step 1: hook 작성**

`frontend/src/view/util/t3composer/useUiLanguage.js`:
```js
import { useTranslation } from 'react-i18next';

/**
 * 현재 UI 언어를 backend 전달용 형식 ('ko' | 'en') 으로 반환.
 * i18n.language 가 'en-US' 등 region 포함일 수 있어 정규화.
 */
export default function useUiLanguage() {
  const { i18n } = useTranslation();
  return i18n.language?.startsWith('en') ? 'en' : 'ko';
}

/** hook 없이 동기 호출이 필요한 곳 (axios interceptor 등) — i18next 인스턴스 직접 조회 */
export function getUiLanguage() {
  if (typeof window === 'undefined') return 'ko';
  try {
    const stored = window.localStorage.getItem('composer.lang');
    if (stored?.startsWith('en')) return 'en';
    if (stored?.startsWith('ko')) return 'ko';
  } catch (_) {}
  const nav = (typeof navigator !== 'undefined' ? navigator.language : '') || '';
  return nav.startsWith('en') ? 'en' : 'ko';
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/view/util/t3composer/useUiLanguage.js
git commit -m "feat(i18n): useUiLanguage hook + getUiLanguage 동기 헬퍼

- hook: useTranslation 기반 'ko'|'en' 정규화
- getUiLanguage(): axios interceptor 등 hook 밖에서 호출용. localStorage 우선

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: App.jsx 메뉴바에 LanguageSwitcher mount

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: import 추가**

`frontend/src/App.jsx` 상단 import 블록 끝에 추가:
```jsx
import LanguageSwitcher from './view/util/t3composer/LanguageSwitcher';
```

- [ ] **Step 2: 메뉴바 우측에 mount**

App.jsx 의 `MENU_ITEMS.map(...)` 가 렌더되는 상단 메뉴바 영역을 찾는다 (대략 line 180~200 부근). 메뉴 탭들 뒤에 우측 정렬용 `<Box sx={{ flex: 1 }} />` 가 이미 있을 것. 그 뒤에 LanguageSwitcher 삽입:

```jsx
{/* 우측 정렬용 spacer 다음 */}
<Box sx={{ flex: 1 }} />
<LanguageSwitcher />
```

만약 spacer 가 없으면 메뉴 탭 map() 의 닫는 괄호 뒤에 `<Box sx={{ flex: 1 }} /><LanguageSwitcher />` 추가.

- [ ] **Step 3: 브라우저에서 확인**

브라우저에서 `http://localhost:5173` 열고 메뉴바 우측에 KO/EN 토글이 보이는지 + 클릭 시 localStorage 의 `composer.lang` 값 변경되는지 DevTools 로 확인.

DevTools Console:
```js
localStorage.getItem('composer.lang')   // 토글 후 'ko' 또는 'en' 반환
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat(i18n): App.jsx 메뉴바 우측에 LanguageSwitcher 노출

- 메뉴 탭들 다음 우측 정렬로 KO/EN 토글 배치

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 2 — 메인 진입부 (~40 키)

### Task 5: App.jsx MENU_ITEMS 영어화

**Files:**
- Modify: `frontend/src/i18n/locales/ko/common.json`
- Modify: `frontend/src/i18n/locales/en/common.json`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: ko/common.json 에 키 추가**

```json
{
  "app": {
    "menu": {
      "composer":    "Composer",
      "history":     "History",
      "scmUiMockup": "SCM UI Mockup",
      "uiPattern":   "UI Pattern",
      "ontology":    "Ontology",
      "dashboard":   "Dashboard"
    },
    "menuHint": {
      "composer":    "AI 화면 생성 — 자연어·복사·설계서 기반 신규 / 기존 화면 수정",
      "history":     "작업 이력 — 진행·완료·보관 세션 조회 및 이어하기",
      "scmUiMockup": "SCM UI Mockup 패턴 갤러리 — 화면 목업 카탈로그",
      "uiPattern":   "T3MES UI 패턴 카탈로그 — MES/SCM 도메인별 화면 패턴",
      "ontology":    "Ontology 관리 — Q&A · Entity · View · Process",
      "dashboard":   "대시보드 빌더 — 위젯 기반 사용자 대시보드 조회 및 편집"
    }
  },
  "action": {
    "create":   "생성",
    "cancel":   "취소",
    "confirm":  "확인",
    "save":     "저장",
    "delete":   "삭제",
    "next":     "다음",
    "previous": "이전",
    "search":   "검색",
    "close":    "닫기",
    "back":     "뒤로",
    "apply":    "적용"
  },
  "status": {
    "loading": "불러오는 중...",
    "empty":   "결과 없음",
    "error":   "오류가 발생했습니다"
  }
}
```

- [ ] **Step 2: en/common.json 에 영어 번역**

```json
{
  "app": {
    "menu": {
      "composer":    "Composer",
      "history":     "History",
      "scmUiMockup": "SCM UI Mockup",
      "uiPattern":   "UI Pattern",
      "ontology":    "Ontology",
      "dashboard":   "Dashboard"
    },
    "menuHint": {
      "composer":    "AI screen generation — Natural language / Copy / Design-based new or modify existing screens",
      "history":     "Work history — Browse and resume active, completed, or archived sessions",
      "scmUiMockup": "SCM UI Mockup pattern gallery — Screen mockup catalog",
      "uiPattern":   "T3MES UI Pattern catalog — Screen patterns by MES/SCM domain",
      "ontology":    "Ontology management — Q&A, Entity, View, Process",
      "dashboard":   "Dashboard builder — Widget-based user dashboard browse and edit"
    }
  },
  "action": {
    "create":   "Create",
    "cancel":   "Cancel",
    "confirm":  "Confirm",
    "save":     "Save",
    "delete":   "Delete",
    "next":     "Next",
    "previous": "Previous",
    "search":   "Search",
    "close":    "Close",
    "back":     "Back",
    "apply":    "Apply"
  },
  "status": {
    "loading": "Loading...",
    "empty":   "No results",
    "error":   "An error occurred"
  }
}
```

- [ ] **Step 3: App.jsx MENU_ITEMS 치환**

`frontend/src/App.jsx` 의 `MENU_ITEMS` 배열에서 `label` / `hint` 를 key 만 남기고, 렌더 시점에 `t()` 호출:

```jsx
import { useTranslation } from 'react-i18next';

const MENU_ITEMS = [
    { key: 'composer', labelKey: 'app.menu.composer', hintKey: 'app.menuHint.composer', Icon: AutoAwesomeIcon,        Component: T3Composer },
    { key: 'history',  labelKey: 'app.menu.history',  hintKey: 'app.menuHint.history',  Icon: HistoryIcon,            Component: T3ComposerHistory },
    { key: 'mockup',   labelKey: 'app.menu.scmUiMockup', hintKey: 'app.menuHint.scmUiMockup', Icon: DashboardCustomizeIcon, Component: T3Mockup },
    { key: 'patterns', labelKey: 'app.menu.uiPattern', hintKey: 'app.menuHint.uiPattern', Icon: ViewQuiltIcon, Component: T3mesPatternCatalog },
    { key: 'ontology', labelKey: 'app.menu.ontology', hintKey: 'app.menuHint.ontology', Icon: SchemaIcon,             Component: OntologyPage },
    { key: 'dashboard', labelKey: 'app.menu.dashboard', hintKey: 'app.menuHint.dashboard', Icon: DashboardIcon,         Component: T3Dashboard },
];
```

렌더 함수 안 (App 컴포넌트 내부):
```jsx
const { t } = useTranslation();
```

기존 `m.label` 사용 부분을 `t(m.labelKey)` 로, `m.hint` 사용 부분을 `t(m.hintKey)` 로 치환. Tooltip 의 title 등 모두 적용.

- [ ] **Step 4: 브라우저에서 KO/EN 토글 검증**

브라우저에서 메뉴바 KO/EN 토글 → 메뉴 6개 라벨이 한국어 ↔ 영어 즉시 전환되는지 확인. Tooltip hover 도 영어로 변환되는지 확인.

DevTools Console 에 `missingKey` 경고가 없어야 함.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/i18n/locales/{ko,en}/common.json frontend/src/App.jsx
git commit -m "feat(i18n): App.jsx 메뉴바 영어 지원 (Phase 2-A)

- ko/en common.json 에 app.menu.* / app.menuHint.* / action.* / status.* 추가
- App.jsx MENU_ITEMS 가 labelKey/hintKey 로 t() 호출
- 메뉴 6종 라벨 + tooltip 즉시 KO/EN 토글

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: T3Composer.jsx landing + Mode 카드 영어화

**Files:**
- Modify: `frontend/src/i18n/locales/ko/composer.json`
- Modify: `frontend/src/i18n/locales/en/composer.json`
- Modify: `frontend/src/view/util/t3composer/T3Composer.jsx`

- [ ] **Step 1: ko/composer.json 작성**

```json
{
  "landing": {
    "title":    "T³Composer",
    "subtitle": "AI 기반 화면 자동 생성"
  },
  "category": {
    "newDev":         "신규 개발",
    "modifyExisting": "기존 화면 수정"
  },
  "mode": {
    "newNl": {
      "title": "자연어 생성",
      "sub":   "Natural Lang.",
      "hint":  "요구사항을 자연어로 설명하면 Claude 가 패턴·코드를 생성합니다"
    },
    "newStep": {
      "title": "단계별 생성",
      "sub":   "Pattern + Visual",
      "hint":  "패턴을 고른 뒤 시각 편집으로 데이터를 채웁니다"
    },
    "newFromCopy": {
      "title": "기존 화면 복사",
      "sub":   "Copy Existing",
      "hint":  "기존 화면을 복사해 단계별 마법사로 수정합니다"
    },
    "modifyNl": {
      "title": "자연어 수정",
      "sub":   "NL Modify",
      "hint":  "현재 화면 소스를 Claude 에 제공하고 자연어 대화로 수정 요청"
    },
    "modifyStep": {
      "title": "단계별 수정",
      "sub":   "Step Modify",
      "hint":  "기존 화면을 Spec 으로 분해해 수정할 부분만 변경"
    }
  }
}
```

- [ ] **Step 2: en/composer.json 작성**

```json
{
  "landing": {
    "title":    "T³Composer",
    "subtitle": "AI-powered Screen Generation"
  },
  "category": {
    "newDev":         "New Development",
    "modifyExisting": "Modify Existing Screen"
  },
  "mode": {
    "newNl": {
      "title": "Natural Language",
      "sub":   "Natural Lang.",
      "hint":  "Describe requirements in natural language; Claude generates patterns and code"
    },
    "newStep": {
      "title": "Step-by-Step",
      "sub":   "Pattern + Visual",
      "hint":  "Pick a pattern, then fill in data with visual editing"
    },
    "newFromCopy": {
      "title": "Copy Existing",
      "sub":   "Copy Existing",
      "hint":  "Copy an existing screen and modify with the step-by-step wizard"
    },
    "modifyNl": {
      "title": "NL Modify",
      "sub":   "NL Modify",
      "hint":  "Send current screen source to Claude and modify via natural-language conversation"
    },
    "modifyStep": {
      "title": "Step Modify",
      "sub":   "Step Modify",
      "hint":  "Decompose existing screen into a Spec and modify only what's needed"
    }
  }
}
```

- [ ] **Step 3: T3Composer.jsx 치환**

`NEW_MODE_OPTIONS` / `MODIFY_MODE_OPTIONS` 의 `title`/`sub`/`hint` 를 `titleKey`/`subKey`/`hintKey` 로 변경:

```jsx
const NEW_MODE_OPTIONS = [
  { key: MODE.NEW_NL,        step: 1, titleKey: 'mode.newNl.title',        subKey: 'mode.newNl.sub',        hintKey: 'mode.newNl.hint',        icon: ChatIcon,        color: '#8FC4D4' },
  { key: MODE.NEW_STEP,      step: 2, titleKey: 'mode.newStep.title',      subKey: 'mode.newStep.sub',      hintKey: 'mode.newStep.hint',      icon: ViewQuiltIcon,   color: '#9D8FD4' },
  { key: MODE.NEW_FROM_COPY, step: 3, titleKey: 'mode.newFromCopy.title',  subKey: 'mode.newFromCopy.sub',  hintKey: 'mode.newFromCopy.hint',  icon: ContentCopyIcon, color: '#86C7A8' },
];

const MODIFY_MODE_OPTIONS = [
  { key: 'NL',   step: 1, titleKey: 'mode.modifyNl.title',   subKey: 'mode.modifyNl.sub',   hintKey: 'mode.modifyNl.hint',   icon: ChatIcon,             color: '#8FC4D4' },
  { key: 'STEP', step: 2, titleKey: 'mode.modifyStep.title', subKey: 'mode.modifyStep.sub', hintKey: 'mode.modifyStep.hint', icon: PlaylistAddCheckIcon, color: '#86C7A8' },
];
```

컴포넌트 함수 상단에 추가:
```jsx
import { useTranslation } from 'react-i18next';
// ...
const { t } = useTranslation('composer');
```

랜더링에서 `opt.title` → `t(opt.titleKey)`, `opt.sub` → `t(opt.subKey)`, `opt.hint` → `t(opt.hintKey)` 로 치환.

Landing 제목 / 부제 / 카테고리 라벨도 t() 적용:
```jsx
<Typography>{t('landing.title')}</Typography>
<Typography>{t('landing.subtitle')}</Typography>
// 카테고리: t('category.newDev') / t('category.modifyExisting')
```

- [ ] **Step 4: 브라우저에서 KO/EN 토글 검증**

브라우저에서 Composer 메뉴 진입 → 토글 → landing 제목/부제 + 5개 Mode 카드 (title/sub/hint) 모두 즉시 변환 확인. console missingKey 0 건.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/i18n/locales/{ko,en}/composer.json frontend/src/view/util/t3composer/T3Composer.jsx
git commit -m "feat(i18n): T3Composer landing + Mode 카드 영어 지원 (Phase 2-B)

- ko/en composer.json 에 landing/category/mode.* 추가
- NEW_MODE_OPTIONS / MODIFY_MODE_OPTIONS 가 titleKey/subKey/hintKey
- 5개 Mode 카드 + 카테고리 라벨 즉시 KO/EN 토글

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 3 — Mode 진입 직후 화면 (~80 키)

### Task 7: ModeNewNl 영어화

**Files:**
- Modify: `frontend/src/i18n/locales/ko/composer.json`
- Modify: `frontend/src/i18n/locales/en/composer.json`
- Modify: `frontend/src/view/util/t3composer/ModeNewNl.jsx`

- [ ] **Step 1: ModeNewNl.jsx 한국어 문자열 추출**

Run: `grep -nE '"[^"]*[가-힣][^"]*"|>[가-힣][^<]*<' frontend/src/view/util/t3composer/ModeNewNl.jsx`

추출된 한국어 문자열을 키로 정리 (예시 — 실제 파일에서 추출한 결과로 교체):

ko/composer.json 에 `modeNewNl` 섹션 추가:
```json
"modeNewNl": {
  "title":       "자연어로 화면 생성",
  "placeholder": "예: 사용자 관리 화면을 만들어줘. 검색 + 그리드 + 등록/수정/삭제 기능 포함.",
  "submitButton":"생성 시작",
  "backButton":  "뒤로",
  "hintHeader":  "팁",
  "hintBody":    "구체적으로 작성할수록 결과가 정확합니다. 데이터 소스, 화면 구조, 동작을 포함하세요."
}
```

en/composer.json 에 대응 영어:
```json
"modeNewNl": {
  "title":       "Generate Screen from Natural Language",
  "placeholder": "e.g. Create a user management screen with search + grid + CRUD operations.",
  "submitButton":"Start Generation",
  "backButton":  "Back",
  "hintHeader":  "Tips",
  "hintBody":    "The more specific, the better. Include data sources, screen layout, and behavior."
}
```

- [ ] **Step 2: ModeNewNl.jsx 에 useTranslation 적용 + t() 치환**

```jsx
import { useTranslation } from 'react-i18next';
// 함수 상단
const { t } = useTranslation('composer');
// 렌더링 — 각 한국어 문자열을 t('modeNewNl.title') 식으로 치환
```

- [ ] **Step 3: 브라우저 검증**

Composer → 자연어 생성 카드 → ModeNewNl 진입 → KO/EN 토글 → 모든 텍스트 변환 확인.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/i18n/locales/{ko,en}/composer.json frontend/src/view/util/t3composer/ModeNewNl.jsx
git commit -m "feat(i18n): ModeNewNl 영어 지원

- composer.modeNewNl.* 키 추가
- 자연어 입력 화면 t() 치환

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 8: ModeNewStep 패턴 선택 화면 영어화

**Files:**
- Modify: `frontend/src/i18n/locales/ko/composer.json`
- Modify: `frontend/src/i18n/locales/en/composer.json`
- Modify: `frontend/src/view/util/t3composer/ModeNewStep.jsx`

스크린샷에 나온 화면 (✨ AI 추천 / SCM UI Mockup / T3MES UI Pattern / Dashboard / 빈 캔버스 카드).

- [ ] **Step 1: ko/composer.json 의 modeNewStep 섹션 추가**

```json
"modeNewStep": {
  "title":   "단계별 화면 생성 (Beta) — 패턴 선택",
  "hint":    "화면의 시작 골격을 선택하세요. 선택 후 4단계 Wizard 에서 Layout / 데이터·검색조건 / 메타·메뉴 / 화면 생성 순으로 진행합니다.",
  "back":    "뒤로",
  "pattern": {
    "aiSuggest": {
      "title": "✨ AI 추천",
      "desc":  "자연어로 의도를 적으면 관련 SCM UI Mockup 3개 추천 + 4단계 AI prefill"
    },
    "mockup": {
      "title": "SCM UI Mockup",
      "desc":  "Product Line · 카테고리 필터 — mockup 의 실제 layer 구조가 자동 prefill"
    },
    "uiPattern": {
      "title": "T3MES UI Pattern",
      "desc":  "T3MES 퍼블리싱 패턴 — 단일 layer + 패턴 식별자 보존"
    },
    "dashboard": {
      "title": "Dashboard",
      "desc":  "기존 대시보드 1개를 골라 위젯 레이아웃을 자동 prefill"
    },
    "blank": {
      "title": "빈 캔버스 (P02 — 검색 + 단일 그리드)",
      "desc":  "가장 일반적인 마스터 CRUD 패턴으로 시작"
    }
  }
}
```

- [ ] **Step 2: en/composer.json 영어 번역**

```json
"modeNewStep": {
  "title":   "Step-by-Step Generation (Beta) — Pattern Selection",
  "hint":    "Choose the starting skeleton. After selection, proceed through the 4-step Wizard: Layout → Data & Filter → Meta & Menu → Generate.",
  "back":    "Back",
  "pattern": {
    "aiSuggest": {
      "title": "✨ AI Suggested",
      "desc":  "Describe your intent in natural language; AI suggests 3 SCM UI Mockups + 4-step prefill"
    },
    "mockup": {
      "title": "SCM UI Mockup",
      "desc":  "Filter by Product Line · category — Mockup's actual layer structure is auto-prefilled"
    },
    "uiPattern": {
      "title": "T3MES UI Pattern",
      "desc":  "T3MES publishing patterns — single layer + pattern ID preserved"
    },
    "dashboard": {
      "title": "Dashboard",
      "desc":  "Pick an existing dashboard to auto-prefill widget layout"
    },
    "blank": {
      "title": "Blank Canvas (P02 — Search + Single Grid)",
      "desc":  "Start with the most common master CRUD pattern"
    }
  }
}
```

- [ ] **Step 3: ModeNewStep.jsx 에 useTranslation 적용**

`useTranslation('composer')` 추가 후 패턴 카드의 title/desc/headers 를 t() 호출로 치환.

- [ ] **Step 4: 브라우저 검증**

Composer → 단계별 생성 → 패턴 선택 화면 → KO/EN 토글 → 5개 카드 모두 변환 확인.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/i18n/locales/{ko,en}/composer.json frontend/src/view/util/t3composer/ModeNewStep.jsx
git commit -m "feat(i18n): ModeNewStep 패턴 선택 화면 영어 지원

- composer.modeNewStep.* + pattern.{aiSuggest,mockup,uiPattern,dashboard,blank} 5종
- 스크린샷의 화면 즉시 KO/EN 전환

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 9: ModeNewFromCopy 영어화

**Files:**
- Modify: `frontend/src/i18n/locales/ko/composer.json`
- Modify: `frontend/src/i18n/locales/en/composer.json`
- Modify: `frontend/src/view/util/t3composer/ModeNewFromCopy.jsx`

- [ ] **Step 1: 한국어 문자열 추출**

Run: `grep -nE '[가-힣]' frontend/src/view/util/t3composer/ModeNewFromCopy.jsx | head -30`

화면의 라벨/안내/버튼/플레이스홀더를 모두 키로 추출.

- [ ] **Step 2: ko/en composer.json 의 modeNewFromCopy 섹션 채우기**

ko 예시:
```json
"modeNewFromCopy": {
  "title":          "기존 화면 복사",
  "menuPickerHint": "복사할 원본 메뉴를 선택하세요. 선택 후 신규 MENU_CD 입력 → AI 자동 분석 → 4단계 Wizard.",
  "targetSelector": "Target System",
  "menuTreeTitle":  "메뉴 트리",
  "newMenuCdLabel": "신규 MENU_CD",
  "newMenuCdHint":  "복사본의 메뉴 코드 (UI_<DOMAIN>_<NAME>)",
  "aiToggleLabel":  "AI 자동 분석",
  "aiToggleHint":   "원본 소스를 AI 가 분석해 spec 을 prefill",
  "submitButton":   "Wizard 시작",
  "sourceBundleTitle": "원본 소스 분석"
}
```

en 대응 영어:
```json
"modeNewFromCopy": {
  "title":          "Copy Existing Screen",
  "menuPickerHint": "Select the source menu to copy. Then enter a new MENU_CD → AI auto-analysis → 4-step Wizard.",
  "targetSelector": "Target System",
  "menuTreeTitle":  "Menu Tree",
  "newMenuCdLabel": "New MENU_CD",
  "newMenuCdHint":  "Menu code for the copy (UI_<DOMAIN>_<NAME>)",
  "aiToggleLabel":  "AI Auto-analysis",
  "aiToggleHint":   "AI analyzes source and prefills the spec",
  "submitButton":   "Start Wizard",
  "sourceBundleTitle": "Source Bundle Analysis"
}
```

- [ ] **Step 3: ModeNewFromCopy.jsx 치환**

`useTranslation('composer')` + t() 치환. 동적 메시지는 interpolation 사용:
```jsx
t('modeNewFromCopy.menuCountInfo', { count: menus.length })
// → "메뉴 5개 매핑됨" / "5 menus mapped"
```

- [ ] **Step 4: 브라우저 검증**

- [ ] **Step 5: Commit**

```bash
git add frontend/src/i18n/locales/{ko,en}/composer.json frontend/src/view/util/t3composer/ModeNewFromCopy.jsx
git commit -m "feat(i18n): ModeNewFromCopy 영어 지원

- composer.modeNewFromCopy.* 키 추가
- 메뉴 선택 + AI 토글 + Wizard 진입 영어 라벨

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 10: ModeExistingModify 영어화

**Files:**
- Modify: `frontend/src/i18n/locales/ko/composer.json`
- Modify: `frontend/src/i18n/locales/en/composer.json`
- Modify: `frontend/src/view/util/t3composer/ModeExistingModify.jsx`

- [ ] **Step 1: 한국어 문자열 추출 → ko 키로**

`grep -nE '[가-힣]' frontend/src/view/util/t3composer/ModeExistingModify.jsx | head -30`

ko/composer.json 의 `modeExistingModify` 섹션 작성 (Task 9 패턴 따름).

- [ ] **Step 2: en/composer.json 영어 번역**

- [ ] **Step 3: ModeExistingModify.jsx t() 치환**

수정 방식 선택 (NL/STEP) 라벨도 영어:
- `t('modeExistingModify.modePicker.nl.title')` = "자연어 수정" / "NL Modify"
- `t('modeExistingModify.modePicker.step.title')` = "단계별 수정" / "Step Modify"

- [ ] **Step 4: 브라우저 검증**

- [ ] **Step 5: Commit**

```bash
git add frontend/src/i18n/locales/{ko,en}/composer.json frontend/src/view/util/t3composer/ModeExistingModify.jsx
git commit -m "feat(i18n): ModeExistingModify 영어 지원

- composer.modeExistingModify.* 키 추가
- 수정 모드 NL/STEP 선택 영어 라벨

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 11: ModeNewGeneral 영어화 (자연어 통합 화면)

**Files:**
- Modify: `frontend/src/i18n/locales/ko/composer.json`
- Modify: `frontend/src/i18n/locales/en/composer.json`
- Modify: `frontend/src/view/util/t3composer/ModeNewGeneral.jsx`

이 파일은 자연어 입력 + 선택사항 (Mockup/UI Pattern picker + D&D + Data Source) 통합으로 가장 큼.

- [ ] **Step 1: 한국어 문자열 추출**

`grep -nE '[가-힣]' frontend/src/view/util/t3composer/ModeNewGeneral.jsx`

대규모 추출 — 약 30~40개 키 예상.

- [ ] **Step 2: ko/composer.json 의 `modeNewGeneral` 섹션 작성**

주요 키:
```json
"modeNewGeneral": {
  "title":           "자연어 생성",
  "intentLabel":     "원하시는 화면 요구사항",
  "intentPlaceholder": "예: 매출 대시보드 — 월별 매출 추이 + Top 10 거래처 그리드",
  "optionsTitle":    "선택사항 (참조 자료)",
  "mockupButton":    "SCM UI Mockup 선택",
  "uiPatternButton": "UI Pattern 선택",
  "dataSourceButton":"Data Source 선택",
  "dropAreaLabel":   "참조 파일 끌어다 놓기 (텍스트는 prompt 인라인, 이미지/PDF 는 첨부)",
  "submitButton":    "생성 시작",
  "selectedMockup":  "선택된 Mockup",
  "selectedPattern": "선택된 Pattern",
  "selectedFiles":   "첨부 파일 {{n}}개",
  "selectedDataSource": "선택된 데이터 소스 {{n}}개"
}
```

- [ ] **Step 3: en/composer.json 영어 번역**

```json
"modeNewGeneral": {
  "title":           "Natural Language Generation",
  "intentLabel":     "Screen Requirements",
  "intentPlaceholder": "e.g. Sales dashboard — monthly sales trend + Top 10 customers grid",
  "optionsTitle":    "Options (Reference Materials)",
  "mockupButton":    "Select SCM UI Mockup",
  "uiPatternButton": "Select UI Pattern",
  "dataSourceButton":"Select Data Source",
  "dropAreaLabel":   "Drag & drop reference files (text inlines in prompt, image/PDF attaches)",
  "submitButton":    "Start Generation",
  "selectedMockup":  "Selected Mockup",
  "selectedPattern": "Selected Pattern",
  "selectedFiles":   "{{n}} file(s) attached",
  "selectedDataSource": "{{n}} data source(s) selected"
}
```

- [ ] **Step 4: ModeNewGeneral.jsx t() 치환**

`useTranslation('composer')` + 모든 한국어 문자열 t() 치환. interpolation 사용:
```jsx
t('modeNewGeneral.selectedFiles', { n: attachments.length })
```

- [ ] **Step 5: 브라우저 검증**

옵션 선택 → 미리보기 → 입력 → KO/EN 전환 모두 매끄러운지 확인.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/i18n/locales/{ko,en}/composer.json frontend/src/view/util/t3composer/ModeNewGeneral.jsx
git commit -m "feat(i18n): ModeNewGeneral 영어 지원

- composer.modeNewGeneral.* 키 추가
- 자연어 입력 + Mockup/UI Pattern/D&D/Data Source 옵션 영어 라벨

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 12: Picker 다이얼로그 3종 영어화 (UI 라벨만)

**Files:**
- Modify: `frontend/src/i18n/locales/ko/composer.json`
- Modify: `frontend/src/i18n/locales/en/composer.json`
- Modify: `frontend/src/view/util/t3composer/MockupPickerDialog.jsx`
- Modify: `frontend/src/view/util/t3composer/UiPatternPickerDialog.jsx`
- Modify: `frontend/src/view/util/t3composer/DataSourcePickerDialog.jsx`

3개 다이얼로그의 **UI 라벨만** (다이얼로그 제목/검색/필터/확인/취소). 다이얼로그 내부의 데이터 (mockup 라벨/패턴 라벨/테이블명 등) 는 영어화 제외.

- [ ] **Step 1: ko/en composer.json 의 picker 섹션 작성**

ko:
```json
"picker": {
  "mockup": {
    "title":         "SCM UI Mockup 선택",
    "searchPlaceholder": "코드/라벨/카테고리 검색",
    "productLineLabel":  "Product Line",
    "categoryLabel":     "카테고리",
    "previewLabel":      "미리보기"
  },
  "uiPattern": {
    "title":         "UI Pattern 선택",
    "searchPlaceholder": "그룹/파일/TabPage 검색",
    "previewLabel":      "미리보기"
  },
  "dataSource": {
    "title":      "데이터 소스 선택",
    "tab": {
      "dbEntity":    "DB Entity",
      "ontology":    "Ontology",
      "queryInline": "Query Inline"
    },
    "basket":     "선택된 항목 {{n}}개",
    "emptyHint":  "왼쪽 트리/리스트에서 항목을 선택하세요"
  }
}
```

en:
```json
"picker": {
  "mockup": {
    "title":         "Select SCM UI Mockup",
    "searchPlaceholder": "Search by code / label / category",
    "productLineLabel":  "Product Line",
    "categoryLabel":     "Category",
    "previewLabel":      "Preview"
  },
  "uiPattern": {
    "title":         "Select UI Pattern",
    "searchPlaceholder": "Search by group / file / TabPage",
    "previewLabel":      "Preview"
  },
  "dataSource": {
    "title":      "Select Data Source",
    "tab": {
      "dbEntity":    "DB Entity",
      "ontology":    "Ontology",
      "queryInline": "Query Inline"
    },
    "basket":     "{{n}} item(s) selected",
    "emptyHint":  "Pick items from the left tree/list"
  }
}
```

- [ ] **Step 2: 3개 다이얼로그 파일 t() 치환**

각 파일 상단:
```jsx
import { useTranslation } from 'react-i18next';
const { t } = useTranslation('composer');
```

다이얼로그 제목 + 검색 placeholder + 라벨 + 빈 상태 hint 만 치환. 데이터 부분은 그대로.

- [ ] **Step 3: 브라우저 검증**

각 picker 열고 KO/EN 전환 → UI 라벨이 영어로, 데이터 라벨은 한국어 유지 확인.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/i18n/locales/{ko,en}/composer.json frontend/src/view/util/t3composer/{Mockup,UiPattern,DataSource}PickerDialog.jsx
git commit -m "feat(i18n): Picker 다이얼로그 3종 UI 라벨 영어 지원

- composer.picker.{mockup,uiPattern,dataSource}.* 키 추가
- 다이얼로그 제목/검색/필터/탭 라벨 영어
- 다이얼로그 내부 데이터 (mockup 라벨/패턴 라벨/테이블명) 는 한국어 유지

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 4 — 4-Step Wizard (~100 키)

### Task 13: ComposerWizard stepper + 공통 버튼

**Files:**
- Modify: `frontend/src/i18n/locales/ko/wizard.json`
- Modify: `frontend/src/i18n/locales/en/wizard.json`
- Modify: `frontend/src/view/util/t3composer/ComposerWizard.jsx`

- [ ] **Step 1: ko/wizard.json 작성**

```json
{
  "stepper": {
    "layout":   "Layout",
    "data":     "데이터 · 검색조건",
    "meta":     "메타 · 메뉴",
    "generate": "화면 생성"
  },
  "buttons": {
    "previous": "이전 단계",
    "next":     "다음 단계",
    "finish":   "생성 시작",
    "cancel":   "취소"
  },
  "progressHint": "{{current}} / {{total}} 단계"
}
```

- [ ] **Step 2: en/wizard.json**

```json
{
  "stepper": {
    "layout":   "Layout",
    "data":     "Data & Filter",
    "meta":     "Meta & Menu",
    "generate": "Generate"
  },
  "buttons": {
    "previous": "Previous",
    "next":     "Next",
    "finish":   "Start Generation",
    "cancel":   "Cancel"
  },
  "progressHint": "Step {{current}} of {{total}}"
}
```

- [ ] **Step 3: ComposerWizard.jsx 치환**

```jsx
import { useTranslation } from 'react-i18next';
const { t } = useTranslation('wizard');
// stepper 라벨, 이전/다음/생성 버튼 모두 t() 호출
```

- [ ] **Step 4: 검증 + Commit**

```bash
git add frontend/src/i18n/locales/{ko,en}/wizard.json frontend/src/view/util/t3composer/ComposerWizard.jsx
git commit -m "feat(i18n): ComposerWizard stepper + 공통 버튼 영어

- wizard.stepper.* + buttons.* + progressHint 키
- 4단계 라벨 + 이전/다음/생성 버튼 영어

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 14: LayoutStep + ComposerCanvas

**Files:**
- Modify: `frontend/src/i18n/locales/ko/wizard.json`
- Modify: `frontend/src/i18n/locales/en/wizard.json`
- Modify: `frontend/src/view/util/t3composer/LayoutStep.jsx`
- Modify: `frontend/src/view/util/t3composer/ComposerCanvas.jsx`

- [ ] **Step 1: 한국어 문자열 추출**

Run:
```bash
grep -nE '[가-힣]' frontend/src/view/util/t3composer/LayoutStep.jsx frontend/src/view/util/t3composer/ComposerCanvas.jsx
```

- [ ] **Step 2: ko/wizard.json 의 `step.layout` 섹션 추가**

```json
"step": {
  "layout": {
    "title":          "화면 레이아웃 설계",
    "hint":           "12-col grid 에 Layer 를 배치하세요. Layer 클릭 → 우측 패널에서 속성 편집.",
    "addLayerButton": "Layer 추가",
    "removeLayer":    "Layer 삭제",
    "layerType": {
      "grid":       "그리드",
      "chart":      "차트",
      "container":  "컨테이너",
      "kpi":        "KPI",
      "form":       "폼"
    },
    "filterBarToggle": "FilterBar 사용",
    "splitBarToggle":  "SplitBar 사용",
    "positionLabel":   "위치 (x, y)",
    "sizeLabel":       "크기 (w, h)",
    "noLayersHint":    "Layer 가 없습니다. [Layer 추가] 버튼을 클릭하세요"
  }
}
```

- [ ] **Step 3: en/wizard.json 영어**

```json
"step": {
  "layout": {
    "title":          "Design Screen Layout",
    "hint":           "Arrange Layers on the 12-col grid. Click a Layer → edit properties in the right panel.",
    "addLayerButton": "Add Layer",
    "removeLayer":    "Remove Layer",
    "layerType": {
      "grid":       "Grid",
      "chart":      "Chart",
      "container":  "Container",
      "kpi":        "KPI",
      "form":       "Form"
    },
    "filterBarToggle": "Use FilterBar",
    "splitBarToggle":  "Use SplitBar",
    "positionLabel":   "Position (x, y)",
    "sizeLabel":       "Size (w, h)",
    "noLayersHint":    "No layers. Click [Add Layer] to start"
  }
}
```

- [ ] **Step 4: LayoutStep.jsx + ComposerCanvas.jsx t() 치환**

`useTranslation('wizard')` 추가 후 모든 한국어 라벨/툴팁/안내 t() 치환.

- [ ] **Step 5: 브라우저 검증**

Wizard 진입 → LayoutStep → Layer 추가/삭제/이동/속성 패널 KO/EN 모두 작동.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/i18n/locales/{ko,en}/wizard.json frontend/src/view/util/t3composer/{LayoutStep,ComposerCanvas}.jsx
git commit -m "feat(i18n): LayoutStep + ComposerCanvas 영어 지원

- wizard.step.layout.* 키 추가
- Layer 추가/삭제/타입/FilterBar/SplitBar 영어 라벨

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 15: DataAndFilterStep

**Files:**
- Modify: `frontend/src/i18n/locales/ko/wizard.json`
- Modify: `frontend/src/i18n/locales/en/wizard.json`
- Modify: `frontend/src/view/util/t3composer/DataAndFilterStep.jsx`

- [ ] **Step 1: 한국어 문자열 추출**

```bash
grep -nE '[가-힣]' frontend/src/view/util/t3composer/DataAndFilterStep.jsx
```

- [ ] **Step 2: ko/wizard.json 의 `step.data` 섹션**

```json
"step": {
  "data": {
    "title": "데이터 소스 · 검색조건",
    "hint":  "Layer 별 데이터 소스와 화면 상단 검색조건을 설정합니다.",
    "mode": {
      "nl":     "자연어",
      "table":  "테이블",
      "sp":     "Stored Procedure",
      "entity": "JPA Entity",
      "sql":    "SQL 직접 입력",
      "mixed":  "혼합"
    },
    "naturalText":       "데이터 자연어 설명",
    "tablePlaceholder":  "테이블명 (예: TB_AD_USER)",
    "spPlaceholder":     "SP 이름 (예: SP_UI_AD_01_Q1)",
    "entityPlaceholder": "Entity 클래스명 또는 baseUrl",
    "sqlPlaceholder":    "SELECT ... FROM ...",
    "filterFieldsTitle": "검색조건 필드",
    "addField":          "필드 추가",
    "removeField":       "필드 제거",
    "fieldName":         "필드명",
    "fieldType":         "타입",
    "fieldRequired":     "필수"
  }
}
```

- [ ] **Step 3: en/wizard.json**

```json
"step": {
  "data": {
    "title": "Data Source & Search Filter",
    "hint":  "Configure data sources per Layer and top-of-screen search filters.",
    "mode": {
      "nl":     "Natural Language",
      "table":  "Table",
      "sp":     "Stored Procedure",
      "entity": "JPA Entity",
      "sql":    "Raw SQL",
      "mixed":  "Mixed"
    },
    "naturalText":       "Natural-language data description",
    "tablePlaceholder":  "Table name (e.g. TB_AD_USER)",
    "spPlaceholder":     "SP name (e.g. SP_UI_AD_01_Q1)",
    "entityPlaceholder": "Entity class name or baseUrl",
    "sqlPlaceholder":    "SELECT ... FROM ...",
    "filterFieldsTitle": "Filter Fields",
    "addField":          "Add Field",
    "removeField":       "Remove Field",
    "fieldName":         "Field name",
    "fieldType":         "Type",
    "fieldRequired":     "Required"
  }
}
```

- [ ] **Step 4: DataAndFilterStep.jsx t() 치환**

- [ ] **Step 5: 브라우저 검증 + Commit**

```bash
git add frontend/src/i18n/locales/{ko,en}/wizard.json frontend/src/view/util/t3composer/DataAndFilterStep.jsx
git commit -m "feat(i18n): DataAndFilterStep 영어 지원

- wizard.step.data.* 키 추가
- dataSource 6개 모드 + 검색조건 필드 영어 라벨

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 16: MetaStep

**Files:**
- Modify: `frontend/src/i18n/locales/ko/wizard.json`
- Modify: `frontend/src/i18n/locales/en/wizard.json`
- Modify: `frontend/src/view/util/t3composer/MetaStep.jsx`

- [ ] **Step 1: 한국어 문자열 추출**

```bash
grep -nE '[가-힣]' frontend/src/view/util/t3composer/MetaStep.jsx
```

- [ ] **Step 2: ko/wizard.json 의 `step.meta` 섹션**

```json
"step": {
  "meta": {
    "title":           "화면 메타 · 메뉴 등록",
    "hint":            "화면 제목과 메뉴 등록 정보를 입력하세요.",
    "screenTitleLabel": "화면 제목",
    "screenTitleHint":  "사용자에게 표시되는 화면 이름",
    "menuCdLabel":     "메뉴 코드",
    "menuCdHint":      "UI_<DOMAIN>_<NAME> 형식. 예: UI_UT_USER_INFO_MGMT",
    "menuFilePathLabel": "메뉴 파일 경로",
    "menuFilePathHint":  "/<module>[/<category>]/<PascalCase> 형식",
    "parentMenuLabel": "상위 메뉴",
    "parentMenuHint":  "선택 안 함 = 도메인 그룹 메뉴",
    "validation": {
      "menuCdInvalid":     "메뉴 코드 형식이 올바르지 않습니다",
      "menuCdRequired":    "메뉴 코드는 필수입니다",
      "menuFilePathInvalid": "메뉴 파일 경로 형식이 올바르지 않습니다",
      "screenTitleRequired": "화면 제목은 필수입니다"
    }
  }
}
```

- [ ] **Step 3: en/wizard.json**

```json
"step": {
  "meta": {
    "title":           "Screen Meta & Menu Registration",
    "hint":            "Enter the screen title and menu registration details.",
    "screenTitleLabel": "Screen Title",
    "screenTitleHint":  "Name shown to users",
    "menuCdLabel":     "Menu Code",
    "menuCdHint":      "Format: UI_<DOMAIN>_<NAME>. e.g. UI_UT_USER_INFO_MGMT",
    "menuFilePathLabel": "Menu File Path",
    "menuFilePathHint":  "Format: /<module>[/<category>]/<PascalCase>",
    "parentMenuLabel": "Parent Menu",
    "parentMenuHint":  "Leave empty = Domain group menu",
    "validation": {
      "menuCdInvalid":     "Invalid menu code format",
      "menuCdRequired":    "Menu code is required",
      "menuFilePathInvalid": "Invalid menu file path format",
      "screenTitleRequired": "Screen title is required"
    }
  }
}
```

- [ ] **Step 4: MetaStep.jsx t() 치환**

검증 메시지도 t() 치환 — react-hook-form 의 validation 메시지에 t() 함수 전달.

- [ ] **Step 5: 검증 + Commit**

```bash
git add frontend/src/i18n/locales/{ko,en}/wizard.json frontend/src/view/util/t3composer/MetaStep.jsx
git commit -m "feat(i18n): MetaStep 영어 지원

- wizard.step.meta.* 키 추가
- 화면 제목/메뉴코드/파일경로/상위메뉴 + validation 메시지 영어

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 17: GenerateStep

**Files:**
- Modify: `frontend/src/i18n/locales/ko/wizard.json`
- Modify: `frontend/src/i18n/locales/en/wizard.json`
- Modify: `frontend/src/view/util/t3composer/GenerateStep.jsx`

- [ ] **Step 1: 한국어 문자열 추출 + 키 작성**

ko:
```json
"step": {
  "generate": {
    "title":         "화면 생성 시작",
    "hint":          "지금까지 설정한 spec 으로 화면을 생성합니다. 생성 후에도 채팅으로 추가 수정 가능.",
    "specSummary":   "Spec 요약",
    "submitButton":  "🚀 생성 시작",
    "estimatedTime": "예상 시간: 30초 ~ 2분"
  }
}
```

en:
```json
"step": {
  "generate": {
    "title":         "Start Screen Generation",
    "hint":          "Generate the screen with the spec configured so far. You can refine via chat after generation.",
    "specSummary":   "Spec Summary",
    "submitButton":  "🚀 Start Generation",
    "estimatedTime": "Estimated time: 30 seconds to 2 minutes"
  }
}
```

- [ ] **Step 2: GenerateStep.jsx t() 치환**

- [ ] **Step 3: 검증 + Commit**

```bash
git add frontend/src/i18n/locales/{ko,en}/wizard.json frontend/src/view/util/t3composer/GenerateStep.jsx
git commit -m "feat(i18n): GenerateStep 영어 지원

- wizard.step.generate.* 키 추가
- 생성 시작 버튼/안내 영어

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 5 — ChatPanel + ComposerWorkspace (~30 키)

### Task 18: ChatPanel UI 라벨

**Files:**
- Modify: `frontend/src/i18n/locales/ko/wizard.json`
- Modify: `frontend/src/i18n/locales/en/wizard.json`
- Modify: `frontend/src/view/util/t3composer/ChatPanel.jsx`

- [ ] **Step 1: 한국어 문자열 추출**

```bash
grep -nE '[가-힣]' frontend/src/view/util/t3composer/ChatPanel.jsx
```

- [ ] **Step 2: ko/wizard.json 의 `chat` 섹션**

```json
"chat": {
  "placeholder":    "수정 요청을 입력하세요...",
  "send":           "보내기",
  "generating":     "생성 중...",
  "waiting":        "응답 대기 중",
  "completed":      "완료",
  "failed":         "실패",
  "retryButton":    "재시도",
  "expandMessage":  "메시지 펼치기",
  "collapseMessage":"메시지 접기",
  "autoFix": {
    "toast":      "🤖 AI 자동보완 ({{n}}/{{max}})",
    "completed":  "자동보완 완료",
    "failed":     "자동보완 실패 — 수동 확인 필요"
  }
}
```

- [ ] **Step 3: en/wizard.json**

```json
"chat": {
  "placeholder":    "Enter your modification request...",
  "send":           "Send",
  "generating":     "Generating...",
  "waiting":        "Waiting for response",
  "completed":      "Completed",
  "failed":         "Failed",
  "retryButton":    "Retry",
  "expandMessage":  "Expand message",
  "collapseMessage":"Collapse message",
  "autoFix": {
    "toast":      "🤖 AI auto-fix ({{n}}/{{max}})",
    "completed":  "Auto-fix completed",
    "failed":     "Auto-fix failed — manual check needed"
  }
}
```

- [ ] **Step 4: ChatPanel.jsx t() 치환**

`useTranslation('wizard')` 추가 + 모든 UI 라벨 (placeholder/버튼/상태) t() 치환. Claude 응답 메시지 자체는 t() 적용 안 함 (Phase 6 에서 backend 가 영어로 돌려줌).

- [ ] **Step 5: 검증 + Commit**

```bash
git add frontend/src/i18n/locales/{ko,en}/wizard.json frontend/src/view/util/t3composer/ChatPanel.jsx
git commit -m "feat(i18n): ChatPanel UI 라벨 영어 지원

- wizard.chat.* + chat.autoFix.* 키
- placeholder/전송/상태/자동보완 토스트 영어 (Claude 메시지 본문은 backend 처리)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 19: ComposerWorkspace 헤더 + 액션 버튼

**Files:**
- Modify: `frontend/src/i18n/locales/ko/wizard.json`
- Modify: `frontend/src/i18n/locales/en/wizard.json`
- Modify: `frontend/src/view/util/t3composer/ComposerWorkspace.jsx`

- [ ] **Step 1: 한국어 문자열 추출**

```bash
grep -nE '[가-힣]' frontend/src/view/util/t3composer/ComposerWorkspace.jsx
```

- [ ] **Step 2: ko/wizard.json 의 `workspace` 섹션**

```json
"workspace": {
  "header": {
    "runPreview":      "화면 실행",
    "registerMenu":    "메뉴 등록",
    "applyArtifact":   "아티팩트 실행",
    "autoFixToggle":   "오류 시 자동보완",
    "designDoc":       "설계서 다운로드"
  },
  "tabs": {
    "previewLive":   "실행 화면 LIVE",
    "artifactSource":"아티팩트 소스"
  },
  "previewStage": {
    "applying":       "적용 중",
    "compiling":      "컴파일 중",
    "restarting":     "재기동 중",
    "ready":          "준비 완료",
    "autofixing":     "🤖 AI 자동보완 ({{n}}/{{max}})",
    "failed":         "실행 실패"
  },
  "previewError": {
    "title":     "화면 렌더 오류",
    "showStack": "스택 보기",
    "hideStack": "스택 숨김",
    "retry":     "재실행"
  }
}
```

- [ ] **Step 3: en/wizard.json**

```json
"workspace": {
  "header": {
    "runPreview":      "Run Preview",
    "registerMenu":    "Register Menu",
    "applyArtifact":   "Apply Artifact",
    "autoFixToggle":   "Auto-fix on Error",
    "designDoc":       "Download Design Doc"
  },
  "tabs": {
    "previewLive":   "LIVE Preview",
    "artifactSource":"Artifact Source"
  },
  "previewStage": {
    "applying":       "Applying",
    "compiling":      "Compiling",
    "restarting":     "Restarting",
    "ready":          "Ready",
    "autofixing":     "🤖 AI auto-fix ({{n}}/{{max}})",
    "failed":         "Execution failed"
  },
  "previewError": {
    "title":     "Render Error",
    "showStack": "Show stack",
    "hideStack": "Hide stack",
    "retry":     "Retry"
  }
}
```

- [ ] **Step 4: ComposerWorkspace.jsx t() 치환**

헤더 버튼 4개 + 자동보완 체크박스 + 탭 라벨 + 토스트/스낵바 메시지 모두 t() 치환.

- [ ] **Step 5: 검증 + Commit**

```bash
git add frontend/src/i18n/locales/{ko,en}/wizard.json frontend/src/view/util/t3composer/ComposerWorkspace.jsx
git commit -m "feat(i18n): ComposerWorkspace 헤더/탭/토스트 영어 지원

- wizard.workspace.{header,tabs,previewStage,previewError}.* 키
- 헤더 액션 4종 + 자동보완 토스트 + 실행 상태 영어

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 6 — Backend 챗봇 응답 언어

### Task 20: DB 마이그레이션 — ComposerSession.ui_language 컬럼

**Files:**
- Create: `docker/db/init-pg/always/02_session_ui_language.sql`

- [ ] **Step 1: 멱등 ALTER 마이그레이션 작성**

`docker/db/init-pg/always/02_session_ui_language.sql`:
```sql
-- composer 세션의 UI 언어 (Claude 응답 언어용)
-- 멱등 ALTER — 매 docker compose up 마다 실행 가능
ALTER TABLE dbo.TB_IS_COMPOSER_SESSION
    ADD COLUMN IF NOT EXISTS ui_language varchar(8) DEFAULT 'ko';

UPDATE dbo.TB_IS_COMPOSER_SESSION SET ui_language = 'ko' WHERE ui_language IS NULL;
```

- [ ] **Step 2: 적용 — backend 컨테이너 재기동 후 컬럼 존재 확인**

Run:
```bash
docker compose up -d --force-recreate composer-backend
sleep 8
docker compose exec -T composer-db psql -U sa -d T3SMARTSCM -c "\d dbo.TB_IS_COMPOSER_SESSION" | grep ui_language
```
Expected: `ui_language | character varying(8) | default 'ko'` 출력

- [ ] **Step 3: Commit**

```bash
git add docker/db/init-pg/always/02_session_ui_language.sql
git commit -m "feat(db): TB_IS_COMPOSER_SESSION.ui_language 컬럼 추가

- always/ phase 2 멱등 ALTER (varchar 8, default 'ko')
- 매 docker compose up 마다 실행되어 기존 볼륨에도 자동 적용

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 21: Backend ComposerSession Entity + DTO 수용

**Files:**
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/entity/ComposerSession.java`
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/controller/ComposerController.java` (DTO 가 같은 파일에 inner class 일 수 있음 — 또는 별도 DTO 클래스)
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/service/ComposerService.java`

- [ ] **Step 1: ComposerSession 에 uiLanguage 필드 추가**

`ComposerSession.java` 의 필드 선언부 (다른 `@Column` 들 사이):
```java
@Column(name = "ui_language", length = 8)
private String uiLanguage;
```

`@PrePersist` (있다면) 또는 빌더 default 에서 null 일 때 'ko' 로 셋:
```java
@PrePersist
public void prePersist() {
    if (this.uiLanguage == null || this.uiLanguage.isBlank()) {
        this.uiLanguage = "ko";
    }
    // 기존 prePersist 로직 보존
}
```

- [ ] **Step 2: createSession DTO 에 lang 필드 추가**

`ComposerController.java` 의 createSession 요청 DTO 또는 inner record/class 에 `lang` 필드 추가:
```java
public record CreateSessionRequest(
    String mode,
    String title,
    String targetCd,
    String menuCd,
    String initialMessage,
    String lang   // ★ 신규
) { }
```

서비스 호출 시 lang 전달:
```java
session.setUiLanguage("en".equalsIgnoreCase(req.lang()) ? "en" : "ko");
```

- [ ] **Step 3: ComposerService.createSession 시그니처 갱신**

`uiLanguage` 파라미터를 받아 session entity 에 셋팅. 기본값 'ko' 보장.

- [ ] **Step 4: backend 재컴파일 + smoke**

Run:
```bash
docker compose exec -T composer-backend bash -c "cd /app && mvn -B -DskipTests -o compile 2>&1 | tail -10"
```
Expected: BUILD SUCCESS

```bash
docker compose exec -T composer-backend bash -c "touch /app/target/classes/.devtools-restart-trigger"
sleep 5
curl -s http://localhost:8090/composer/health || echo "health endpoint not available"
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/{entity/ComposerSession.java,controller/ComposerController.java,service/ComposerService.java}
git commit -m "feat(backend): ComposerSession.uiLanguage 필드 + DTO 수용

- Entity 에 ui_language 컬럼 매핑 (default 'ko')
- createSession 요청 DTO 에 lang 필드 추가
- ComposerService 가 세션 생성 시 uiLanguage 셋팅 ('ko'|'en')

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 22: ComposerPromptBuilder — 응답 언어 지침 주입

**Files:**
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/service/ComposerPromptBuilder.java`
- Modify: `backend/src/main/java/com/zionex/t3composer/domain/service/ComposerService.java` (호출 부분)

- [ ] **Step 1: ComposerPromptBuilder.buildStaticSystemPrompt 시그니처 변경**

기존 `buildStaticSystemPrompt()` → `buildStaticSystemPrompt(String uiLanguage)`:

```java
public String buildStaticSystemPrompt(String uiLanguage) {
    String base = BASE_SYSTEM + INVARIANTS;
    String langInstruction = buildLanguageInstruction(uiLanguage);
    return base + "\n\n" + langInstruction;
}

private String buildLanguageInstruction(String uiLanguage) {
    boolean isEnglish = "en".equalsIgnoreCase(uiLanguage);
    if (isEnglish) {
        return """
            ## Response Language
            Respond to user messages in English. Tone: professional, concise.

            ## Code Artifact Language — CRITICAL
            All code artifacts (===FILE: blocks) MUST keep Korean labels, strings, comments, and
            UI text unchanged. The operational deployment environment is Korean — generating
            English code labels would break production usage.

            Specifically preserve in Korean:
            - JSX: `<Typography>저장</Typography>` · `<Chip label="신규" />` · `headerText: '사용자명'`
            - Java: `new ResponseMessage(HttpStatus.OK.value(), "저장 완료")`
            - showMessage('확인', '저장하시겠습니까?', ...)
            - MENU registration: TB_AD_LANG_PACK Korean translations
            - Validation messages, error toasts, button labels, grid headers

            Only the explanation/description text you write back to the user (outside ===FILE: blocks)
            should be in English. The code itself stays Korean.
            """;
    }
    return """
        ## 응답 언어
        사용자에게 한국어로 응답하세요. 톤은 전문적이고 간결하게.
        """;
}
```

- [ ] **Step 2: ComposerService 호출 부분 수정**

`buildStaticSystemPrompt()` 호출 모든 곳을 찾아 session.getUiLanguage() 전달:
```bash
grep -rn "buildStaticSystemPrompt" backend/src/main/java/
```

각 호출에 uiLanguage 인자 추가.

- [ ] **Step 3: sendMessage 요청에서도 lang override 옵션 (선택)**

세션 단위 고정이 원칙이지만, 안전망으로 sendMessage 요청에 lang 이 명시되면 세션 값을 override 하지는 않고 prompt builder 에만 사용 — 본 task 에서는 skip, session 값만 신뢰.

- [ ] **Step 4: 단위 테스트 — 언어별 prompt 끝부분 확인**

Create: `backend/src/test/java/com/zionex/t3composer/domain/service/ComposerPromptBuilderTest.java`
```java
package com.zionex.t3composer.domain.service;

import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

class ComposerPromptBuilderTest {

    @Test
    void englishLanguageInjectsEnglishInstruction() {
        ComposerPromptBuilder builder = new ComposerPromptBuilder();
        String prompt = builder.buildStaticSystemPrompt("en");
        assertTrue(prompt.contains("Respond to user messages in English"));
        assertTrue(prompt.contains("Code Artifact Language"));
        assertTrue(prompt.contains("keep Korean labels"));
    }

    @Test
    void koreanLanguageInjectsKoreanInstruction() {
        ComposerPromptBuilder builder = new ComposerPromptBuilder();
        String prompt = builder.buildStaticSystemPrompt("ko");
        assertTrue(prompt.contains("한국어로 응답"));
    }

    @Test
    void nullLanguageDefaultsToKorean() {
        ComposerPromptBuilder builder = new ComposerPromptBuilder();
        String prompt = builder.buildStaticSystemPrompt(null);
        assertTrue(prompt.contains("한국어로 응답"));
    }
}
```

Run:
```bash
docker compose exec -T composer-backend bash -c "cd /app && mvn -Dtest=ComposerPromptBuilderTest test 2>&1 | tail -10"
```
Expected: Tests run: 3, Failures: 0, Errors: 0

- [ ] **Step 5: backend 재컴파일 + DevTools restart trigger**

```bash
docker compose exec -T composer-backend bash -c "cd /app && mvn -B -DskipTests -o compile && touch target/classes/.devtools-restart-trigger"
sleep 8
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/zionex/t3composer/domain/service/ComposerPromptBuilder.java backend/src/main/java/com/zionex/t3composer/domain/service/ComposerService.java backend/src/test/java/com/zionex/t3composer/domain/service/ComposerPromptBuilderTest.java
git commit -m "feat(backend): ComposerPromptBuilder 응답 언어 지침 주입

- buildStaticSystemPrompt(uiLanguage) 시그니처 변경
- en: 'Respond in English' + Code artifacts MUST keep Korean labels
- ko: 한국어 응답 지침
- 단위 테스트 3종 (en/ko/null)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 23: Frontend api.js — axios interceptor 로 lang 자동 첨부

**Files:**
- Modify: `frontend/src/view/util/t3composer/api.js`

- [ ] **Step 1: api.js 에 interceptor 추가**

`frontend/src/view/util/t3composer/api.js` 의 axios 인스턴스 생성 직후 (`createSession` / `sendMessage` 호출 정의 전):

```js
import { getUiLanguage } from './useUiLanguage';

// axios 인스턴스가 zAxios 또는 별도 instance 라고 가정
// — 실제 패턴에 맞춰 zAxios.interceptors 또는 함수 단위 주입

// 옵션 A: composer endpoint 호출 함수 안에서 직접 첨부 (가장 안전)
export async function createSession({ mode, title, targetCd, menuCd, initialMessage }) {
  const lang = getUiLanguage();
  const { data } = await zAxios.post('composer/sessions', {
    mode, title, targetCd, menuCd, initialMessage, lang,
  });
  return data;
}

export async function sendMessage(sessionId, { message, attachments }) {
  const lang = getUiLanguage();
  const { data } = await zAxios.post(`composer/sessions/${sessionId}/messages`, {
    message, attachments, lang,
  });
  return data;
}
```

기존 코드의 createSession / sendMessage 호출에서 lang 파라미터만 추가하면 됨. 다른 endpoint 는 건드리지 않음.

- [ ] **Step 2: useUiLanguage.js 가 getUiLanguage 함수를 named export 하는지 확인**

Task 3 에서 이미 작성됨. import 만 제대로 매칭.

- [ ] **Step 3: 브라우저에서 end-to-end 검증**

브라우저에서:
1. EN 토글
2. Composer → 자연어 생성 → 신규 세션 시작
3. DevTools Network 탭에서 `POST /composer/sessions` payload 에 `"lang":"en"` 포함 확인
4. Claude 응답이 영어로 도착하는지 ChatPanel 에서 확인
5. 산출물 JSX 의 `<Typography>` / `headerText` 등은 여전히 한국어인지 확인 (산출물 미리보기 또는 [아티팩트 소스] 탭)

- [ ] **Step 4: KO 모드로도 같은 검증**

KO 토글 → 새 세션 → 한국어 응답 + 한국어 산출물.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/view/util/t3composer/api.js
git commit -m "feat(i18n): api.js 가 createSession/sendMessage 호출에 lang 자동 첨부

- getUiLanguage() 로 localStorage 값 조회
- Claude 응답 언어가 UI 언어와 일치
- 산출물 코드는 system prompt 강제로 한국어 보존

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 7 — 마무리

### Task 24: 통합 스모크 + 영어 검수

**Files:** (변경 없음 — 검증만)

- [ ] **Step 1: 7가지 스모크 시나리오 (KO/EN 양쪽)**

각 시나리오를 KO 와 EN 양쪽으로 1회씩 수행. 각 단계에서 텍스트가 의도된 언어로 표시되는지 확인.

| # | 시나리오 |
|---|---|
| 1 | App 진입 → 메뉴바 EN 토글 → 메뉴 6개 영어 확인 |
| 2 | Composer 카드 → landing 영어 확인 → 자연어 생성 클릭 → ModeNewNl 영어 |
| 3 | (뒤로 가서) 단계별 생성 → ModeNewStep 5개 패턴 카드 영어 |
| 4 | (뒤로 가서) 기존 화면 복사 → ModeNewFromCopy 메뉴 선택 영어 |
| 5 | ModeNewGeneral 의 Mockup/UI Pattern/Data Source picker 다이얼로그 영어 |
| 6 | Wizard 4단계 모두 진입 → 라벨/버튼/안내 영어 |
| 7 | ChatPanel 영어 placeholder → "Create a sales dashboard" 입력 → Claude 영어 응답 도착 + 산출물 한국어 보존 |

- [ ] **Step 2: missingKey 감사**

DevTools Console 에서 `missingKey` warn 0건 확인. 발견된 키는 ko/en JSON 에 추가.

- [ ] **Step 3: 영어 카피 자연어 검수**

`locales/en/{common,composer,wizard}.json` 3종 파일을 일독. 어색한 표현 / 도메인 용어 오역 / placeholder 미치환 확인. 필요 시 수정.

- [ ] **Step 4: 발견된 이슈 정리 + Commit (수정 있으면)**

```bash
git add frontend/src/i18n/locales/en/ frontend/src/view/util/t3composer/
git commit -m "fix(i18n): 통합 스모크 후 발견 미번역 키 보완

- missingKey N건 추가
- 영어 카피 어색한 표현 수정

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

수정 없으면 skip.

---

### Task 25: 개발자 가이드 문서

**Files:**
- Create: `docs/i18n-guide.md`

- [ ] **Step 1: 가이드 문서 작성**

`docs/i18n-guide.md`:
```markdown
# T3Composer 다국어 (i18n) 가이드

## 현재 지원 언어
- 한국어 (`ko`, 기본값)
- 영어 (`en`)

## 디렉토리 구조

\`\`\`
frontend/src/i18n/
├── index.js                              # i18next 초기화
└── locales/
    ├── ko/{common,composer,wizard}.json  # 한국어 사전
    └── en/{common,composer,wizard}.json  # 영어 사전
\`\`\`

## namespace 사용 기준
- `common`: 전역 메뉴/액션/상태 (App.jsx 등)
- `composer`: Landing + Mode 카드 + Mode 진입 화면 + Picker
- `wizard`: 4-Step Wizard + ChatPanel + ComposerWorkspace

## 새 키 추가 절차

1. ko/<ns>.json 에 키 + 한국어 값 추가
2. en/<ns>.json 에 동일 키 + 영어 값 추가
3. 컴포넌트에서 `const { t } = useTranslation('<ns>');` 후 `t('key.path')` 호출
4. KO/EN 토글로 양쪽 모두 확인
5. DevTools Console 에 `missingKey` 0건 확인

## 백엔드 응답 언어
- `ComposerSession.uiLanguage` 컬럼이 'ko' 또는 'en' 저장
- `ComposerPromptBuilder.buildStaticSystemPrompt(uiLanguage)` 가 Claude 응답 언어 지시
- 산출물 코드 (JSX `headerText`, Java `ResponseMessage`, MENU SQL) 는 **항상 한국어 유지** — system prompt 에 명시 강제

## 향후 확장 (별도 spec)
- ComposerWorkspace 좌측 패널 + PreviewEmbed
- History / Mockup 갤러리 / UI Pattern 카탈로그 화면
- 데이터 필드 (MOCKUP_ENTRIES.patternLabel 등)
- 일본어 / 중국어 추가
\`\`\`

- [ ] **Step 2: Commit**

```bash
git add docs/i18n-guide.md
git commit -m "docs(i18n): 다국어 가이드 — 사용법 + 신규 키 추가 절차 + 백엔드 응답 언어

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Self-Review 결과

### Spec coverage
- §2 범위 A/B/C/D/E 모두 task 매핑됨 — Task 5-6 (메인) / 7-12 (Mode 진입) / 13-17 (Wizard) / 18-19 (ChatPanel/Workspace) / 20-23 (Backend) / 24-25 (마무리)
- §3.6 backend 언어 전달 흐름 — Task 20-23
- §4 키 명명 규약 — 모든 task 의 키 예시가 spec 규약 (lowerCamel + dot, namespace) 준수
- §7 에러 처리 — Task 1 에 missingKeyHandler 구현 + Task 24 에서 missingKey 0건 확인
- §8 테스트 전략 — Task 22 단위 테스트 + Task 24 통합 스모크
- §11 위험 — Task 22 의 system prompt 에 "Code artifacts MUST keep Korean labels" 명시 강제 ✓

### Placeholder scan
- "TBD" / "TODO" / "fill in later" — 없음
- "implement appropriate" / "add validation" — 없음
- 모든 코드 step 에 실제 코드 블록 포함 ✓
- 일부 task (Task 7-19) 에서 "한국어 문자열 추출" 단계 — 실제 파일 내용은 grep 결과에 의존 (예시 키만 제시). 이는 의도적 — 실제 키 목록은 grep 출력에 따라 달라짐. 이 부분은 placeholder 가 아니라 "조회 → 적용" 명령

### Type consistency
- `useUiLanguage` hook (Task 3) → `useUiLanguage()` 와 `getUiLanguage()` 둘 다 named export (Task 23 에서 동일 이름으로 사용)
- `ComposerSession.uiLanguage` (Task 21) → `session.getUiLanguage()` (Task 22 에서 호출) — 일관
- `buildStaticSystemPrompt(uiLanguage)` 시그니처 (Task 22) → 호출부 일관
- `composer.lang` localStorage 키 (Task 1, 3) — 일관

이슈 없음. 계획 그대로 진행 가능.

---

## 실행 옵션 안내

**Plan complete and saved to `docs/superpowers/plans/2026-06-22-i18n-langpack-implementation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — 각 task 별로 fresh subagent 발사 + task 간 리뷰, 빠른 반복

**2. Inline Execution** — 현재 세션에서 batch 실행 + 중간 체크포인트

**Which approach?**

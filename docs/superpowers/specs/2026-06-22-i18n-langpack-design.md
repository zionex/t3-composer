# 다국어 (LangPack) 지원 — 영어 우선, 메인 + Mode 진입 + Wizard + 챗봇 UI MVP

**날짜**: 2026-06-22 (2026-06-22 1차 확장)
**범위**: T3Composer 프론트엔드 메인 진입부 + Mode 진입 직후 화면 + 4-Step Wizard + ChatPanel UI 라벨 + Backend 챗봇 응답 언어
**대상 언어**: 한국어 (기존), 영어 (신규 추가)
**디폴트 언어**: 한국어 (fallbackLng)
**언어 전환 UI**: 상단 메뉴바 우측 ToggleButtonGroup (KO/EN)

---

## 1. 배경 · 동기

본 솔루션 (T3Composer) 을 한국 외 지역 (일본·대만/중국·해외 영어권) 에 배포할 계획. 현재 프론트엔드는 i18n 라이브러리가 없고, 약 353개 JSX 파일에 한국어 약 9만 occurrence 가 하드코딩되어 있다.

본 작업은 **대외 프레젠테이션 시연 흐름 전체를 영어로 끝까지 수행 가능한 MVP**:
- 사용자가 영어 메뉴로 진입 → 영어 Landing → 영어 Mode 카드 클릭
- Mode 진입 직후 화면 (패턴 선택 / 자연어 입력 / 메뉴 선택) 도 영어
- 4-Step Wizard (Layout / Data / Meta / Generate) 의 UI 라벨/버튼/안내도 영어
- Claude 챗봇의 안내/설명/진행 메시지도 영어 (단 산출물 코드의 한국어 라벨은 유지 — 운영 환경이 한국어)

영어 키 구조 검증 후 추후 일본어/중국어 추가 + ComposerWorkspace 전체 + 데이터 필드로 점진 확장.

## 2. 범위 (Scope)

### 포함 (In Scope)

**A. 메인 진입부** (약 40 키)

| 파일 | 대상 |
|---|---|
| `frontend/src/App.jsx` | 상단 `MENU_ITEMS` 의 `label` + `hint` (6개 메뉴 × 2 필드 = 12 키) |
| `frontend/src/view/util/t3composer/T3Composer.jsx` | landing 제목 · 부제 · `NEW_MODE_OPTIONS` 3종 + `MODIFY_MODE_OPTIONS` 2종 카드 (title / sub / hint) · 카테고리 라벨 · 상태/공통 라벨 |

**B. Mode 진입 직후 화면** (약 80 키)

| 파일 | 대상 |
|---|---|
| `view/util/t3composer/ModeNewNl.jsx` | 자연어 입력 화면 — 헤더/placeholder/안내/버튼 |
| `view/util/t3composer/ModeNewStep.jsx` | 단계별 생성 패턴 선택 화면 — `[✨ AI 추천] [SCM UI Mockup] [T3MES UI Pattern] [Dashboard] [빈 캔버스]` 카드 (스크린샷의 화면) |
| `view/util/t3composer/ModeNewFromCopy.jsx` | 원본 메뉴 선택 화면 |
| `view/util/t3composer/ModeExistingModify.jsx` | 기존 메뉴 선택 + 수정 모드 (NL/STEP) 선택 |
| `view/util/t3composer/ModeNewGeneral.jsx` | 자연어 생성 통합 화면 (참조 picker + D&D + Data Source) |
| `MockupPickerDialog` · `UiPatternPickerDialog` · `DataSourcePickerDialog` | picker 다이얼로그 UI 라벨 (검색/필터/취소/확인) — 데이터 자체는 한국어 유지 |

**C. 4-Step Wizard** (약 100 키)

| 파일 | 대상 |
|---|---|
| `ComposerWizard.jsx` | 4단계 stepper 라벨 + 이전/다음/생성 버튼 |
| `LayoutStep.jsx` + `ComposerCanvas.jsx` | Layer 추가/삭제/타입 라벨 · 12-col grid 안내 |
| `DataAndFilterStep.jsx` | dataSource 모드 라벨 (NL/TABLE/SP/ENTITY/SQL/MIXED) + 검색조건 fields 추가 UI |
| `MetaStep.jsx` | 화면 제목/MENU_CD/MENU_FILE_PATH/Parent Menu 입력 라벨 + validation 메시지 |
| `GenerateStep.jsx` | 최종 생성 버튼 + 시작 안내 |

**D. ChatPanel UI 라벨** (약 30 키)

| 파일 | 대상 |
|---|---|
| `view/util/t3composer/ChatPanel.jsx` | 메시지 입력 placeholder · 전송 버튼 · 진행 상태 라벨 (대기/생성중/완료/실패) · 자동보완 토스트 |
| `view/util/t3composer/ComposerWorkspace.jsx` | 헤더 [화면 실행] [메뉴 등록] [아티팩트 실행] 버튼 + 자동보완 체크박스 + 토스트 메시지 |

**E. Backend 챗봇 응답 언어** (약 5~10개 prompt 변경)

| 파일 | 대상 |
|---|---|
| `backend/.../service/ComposerPromptBuilder.java` | `buildStaticSystemPrompt` 에 사용자 언어 파라미터 추가 + "Respond to user messages in {lang}" 지시 추가 |
| `backend/.../controller/ComposerController.java` | `createSession` / `sendMessage` 요청에 `lang` 필드 수용 → `ComposerSession.uiLanguage` 컬럼 저장 |
| `frontend/src/view/util/t3composer/api.js` | 위 호출에 현재 `i18n.language` 자동 전달 |
| `ComposerSession` 엔티티 | `ui_language` 컬럼 추가 (varchar(8), default 'ko') |

**예상 총 키 규모: 약 250개** (namespace 3개: `common` / `composer` / `wizard`)

### 제외 (Out of Scope)

- **산출물 코드의 한국어 텍스트** — JSX 의 `showMessage('확인', ...)` / `<Typography>저장</Typography>` / 그리드 `headerText: '사용자명'` 등은 한국어 그대로 (운영 환경이 한국어라 영어 산출물은 부적합)
- **ComposerWorkspace 의 좌측 패널 (아티팩트 트리)** 의 파일명 / 상태 — 시스템 상수
- **PreviewEmbed 의 실제 화면 미리보기** — 산출물 영역이라 한국어 유지
- **History 화면 / Mockup 갤러리 / UI Pattern 카탈로그** — 별도 spec
- **데이터 필드** (`MOCKUP_ENTRIES.patternLabel` 등) — 별도 spec (Future Work)
- **일본어 / 중국어** — 영어 안정화 후
- **운영 wingui (TB_AD_LANG_PACK)** — 본 작업과 별개

## 3. 아키텍처

### 3.1 라이브러리 선택

**react-i18next** + **i18next-browser-languagedetector** — 업계 표준, 안정적 React 통합, plural/interpolation 지원, JSON resource 로드. 번들 ~60KB.

### 3.2 파일 구조

```
frontend/src/
  i18n/
    index.js                    ← i18next 초기화
    locales/
      ko/
        common.json             ← 상단 메뉴 · 공통 라벨 · 액션 버튼
        composer.json           ← Composer landing · Mode 카드 · Mode 진입 화면
        wizard.json             ← 4-Step Wizard · ChatPanel · Workspace UI
      en/
        common.json
        composer.json
        wizard.json
  view/util/t3composer/
    LanguageSwitcher.jsx        ← 상단 메뉴바 우측 토글 (KO/EN)
    useUiLanguage.js            ← 현재 UI 언어 hook (i18n.language ↔ backend 'ko'|'en')
```

namespace 3개로 분리해 코드 split 및 후속 단계별 키 추가 용이.

### 3.3 i18next 초기화 설정

```js
// frontend/src/i18n/index.js
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
  interpolation: { escapeValue: false },   // React 자체 escape
  react: { useSuspense: false },           // 초기 빈 화면 방지
  saveMissing: process.env.NODE_ENV === 'development',
  missingKeyHandler: (lng, ns, key) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] missing key: ${ns}:${key} (${lng})`);
    }
  },
});

export default i18n;
```

### 3.4 진입점 wiring

`frontend/src/index.js` 에서 1회 import (가장 위, React import 들과 함께):
```js
import './i18n';
```

부수효과로 i18next 가 즉시 초기화되어 첫 렌더부터 t() 동작.

### 3.5 LanguageSwitcher 컴포넌트

```jsx
// frontend/src/view/util/t3composer/LanguageSwitcher.jsx
import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language.startsWith('en') ? 'en' : 'ko';
  return (
    <ToggleButtonGroup size="small" exclusive value={current}
      onChange={(_, v) => v && i18n.changeLanguage(v)}>
      <ToggleButton value="ko" sx={{ px: 1.5 }}>KO</ToggleButton>
      <ToggleButton value="en" sx={{ px: 1.5 }}>EN</ToggleButton>
    </ToggleButtonGroup>
  );
}
```

App.jsx 의 MENU_ITEMS 우측 영역 (`flex: 1` 뒤) 에 mount.

### 3.6 Backend 챗봇 언어 전달

Frontend ↔ Backend ↔ Claude 의 언어 전달 흐름:

```
사용자 KO/EN 토글 → i18n.language = 'en' → localStorage 영속
   ↓
ChatPanel.sendMessage / createSession 호출 시
   ↓
api.js 가 자동으로 { lang: 'en' } 추가 (axios interceptor)
   ↓
Backend ComposerController 가 받음 → ComposerSession.uiLanguage 저장 (한 번)
   ↓
ComposerService 가 ComposerPromptBuilder 에 session.uiLanguage 전달
   ↓
ComposerPromptBuilder.buildStaticSystemPrompt 가 system message 끝에 추가:
   "## Response Language
    Respond to the user in English. Tone: professional, concise.
    Code artifacts (===FILE: blocks) must keep all Korean labels, strings, and 
    comments unchanged — operational deployment is Korean."
```

핵심:
- 세션 단위로 언어 저장 (대화 도중 변경 안 함). 세션 첫 메시지 시점의 i18n.language 사용
- `BaseEntity` 의 일부로 추가 (`ALTER TABLE tb_is_composer_session ADD ui_language varchar(8) DEFAULT 'ko'`)
- 코드 산출물의 한국어는 명시적으로 보존 — system prompt 에 반복 강조 (자동보완 루프에서도 유지)

## 4. 키 명명 규약

200+ 키로 확장 대비 일관성 중요. lowerCamel + dot 구분. namespace 3개 (`common` / `composer` / `wizard`) 로 분리.

### namespace `common` (전역 공통)

| 섹션 | 예 키 | 예 값 (ko / en) |
|---|---|---|
| `app.menu.*` | `app.menu.composer` | `"Composer"` / `"Composer"` |
| `app.menu.*` | `app.menu.history` | `"History"` / `"History"` |
| `app.menu.*` | `app.menu.scmUiMockup` | `"SCM UI Mockup"` / `"SCM UI Mockup"` |
| `action.*` | `action.create` | `"생성"` / `"Create"` |
| `action.*` | `action.cancel` | `"취소"` / `"Cancel"` |
| `action.*` | `action.confirm` | `"확인"` / `"Confirm"` |
| `action.*` | `action.next` | `"다음"` / `"Next"` |
| `action.*` | `action.previous` | `"이전"` / `"Previous"` |
| `action.*` | `action.search` | `"검색"` / `"Search"` |
| `status.*` | `status.loading` | `"불러오는 중..."` / `"Loading..."` |
| `status.*` | `status.empty` | `"결과 없음"` / `"No results"` |

### namespace `composer` (Landing + Mode 카드 + Mode 진입 화면)

| 섹션 | 예 키 | 예 값 (ko / en) |
|---|---|---|
| `landing.*` | `landing.title` | `"T³Composer"` / `"T³Composer"` |
| `landing.*` | `landing.subtitle` | `"AI 기반 화면 자동 생성"` / `"AI-powered screen generation"` |
| `category.*` | `category.newDev` | `"신규 개발"` / `"New Development"` |
| `category.*` | `category.modifyExisting` | `"기존 화면 수정"` / `"Modify Existing Screen"` |
| `mode.<key>.*` | `mode.newNl.title` | `"자연어 생성"` / `"Natural Language"` |
| `mode.<key>.*` | `mode.newNl.sub` | `"Natural Lang."` / `"Natural Lang."` |
| `mode.<key>.*` | `mode.newNl.hint` | `"요구사항을 자연어로 설명..."` / `"Describe requirements..."` |
| `mode.newStep.pattern.*` | `mode.newStep.pattern.aiSuggest.title` | `"✨ AI 추천"` / `"✨ AI Suggested"` |
| `mode.newStep.pattern.*` | `mode.newStep.pattern.aiSuggest.desc` | `"자연어로 의도를 적으면 ..."` / `"Describe your intent ..."` |
| `mode.newStep.pattern.*` | `mode.newStep.pattern.mockup.title` | `"SCM UI Mockup"` / `"SCM UI Mockup"` |
| `mode.newStep.pattern.*` | `mode.newStep.pattern.dashboard.title` | `"Dashboard"` / `"Dashboard"` |
| `mode.newStep.pattern.*` | `mode.newStep.pattern.blank.title` | `"빈 캔버스 (P02 — 검색 + 단일 그리드)"` / `"Blank Canvas (P02 — Search + Single Grid)"` |
| `mode.newFromCopy.*` | `mode.newFromCopy.menuPickerTitle` | `"원본 메뉴 선택"` / `"Select Source Menu"` |
| `mode.existingModify.*` | `mode.existingModify.modePicker.title` | `"수정 방식 선택"` / `"Choose Modify Mode"` |
| `picker.mockup.*` | `picker.mockup.title` | `"SCM UI Mockup 선택"` / `"Select SCM UI Mockup"` |
| `picker.uiPattern.*` | `picker.uiPattern.title` | `"UI Pattern 선택"` / `"Select UI Pattern"` |
| `picker.dataSource.*` | `picker.dataSource.tab.dbEntity` | `"DB Entity"` / `"DB Entity"` |

### namespace `wizard` (4-Step Wizard + Workspace + ChatPanel)

| 섹션 | 예 키 | 예 값 (ko / en) |
|---|---|---|
| `stepper.*` | `stepper.layout` | `"Layout"` / `"Layout"` |
| `stepper.*` | `stepper.data` | `"데이터 · 검색조건"` / `"Data & Filter"` |
| `stepper.*` | `stepper.meta` | `"메타 · 메뉴"` / `"Meta & Menu"` |
| `stepper.*` | `stepper.generate` | `"화면 생성"` / `"Generate"` |
| `step.layout.*` | `step.layout.title` | `"화면 레이아웃 설계"` / `"Design Screen Layout"` |
| `step.layout.*` | `step.layout.layerTypeGrid` | `"그리드"` / `"Grid"` |
| `step.layout.*` | `step.layout.layerTypeChart` | `"차트"` / `"Chart"` |
| `step.data.*` | `step.data.modeNl` | `"자연어"` / `"Natural Language"` |
| `step.data.*` | `step.data.modeTable` | `"테이블"` / `"Table"` |
| `step.data.*` | `step.data.modeSp` | `"Stored Procedure"` / `"Stored Procedure"` |
| `step.meta.*` | `step.meta.menuCdLabel` | `"메뉴 코드"` / `"Menu Code"` |
| `step.meta.*` | `step.meta.menuCdHint` | `"UI_<DOMAIN>_<NAME> 형식"` / `"Format: UI_<DOMAIN>_<NAME>"` |
| `step.generate.*` | `step.generate.button` | `"화면 생성 시작"` / `"Start Generation"` |
| `chat.*` | `chat.placeholder` | `"수정 요청을 입력하세요..."` / `"Enter modification request..."` |
| `chat.*` | `chat.send` | `"보내기"` / `"Send"` |
| `chat.*` | `chat.generating` | `"생성 중..."` / `"Generating..."` |
| `chat.*` | `chat.autoFix.toast` | `"🤖 AI 자동보완 ({{n}}/{{max}})"` / `"🤖 AI auto-fix ({{n}}/{{max}})"` |
| `workspace.header.*` | `workspace.header.runPreview` | `"화면 실행"` / `"Run Preview"` |
| `workspace.header.*` | `workspace.header.registerMenu` | `"메뉴 등록"` / `"Register Menu"` |
| `workspace.header.*` | `workspace.header.applyArtifact` | `"아티팩트 실행"` / `"Apply Artifact"` |
| `workspace.header.*` | `workspace.header.autoFixToggle` | `"오류 시 자동보완"` / `"Auto-fix on Error"` |

동적 값은 `{{value}}` interpolation: `t('chat.autoFix.toast', { n: 1, max: 1 })`.

## 5. 마이그레이션 패턴

| Before | After |
|---|---|
| `<Typography>T³Composer</Typography>` | `<Typography>{t('composer.landing.title')}</Typography>` |
| `<Chip label="신규 화면" />` | `<Chip label={t('composer.mode.newGeneral.title')} />` |
| `<Button>생성</Button>` | `<Button>{t('common.action.create')}</Button>` |

번역 작성 순서:
1. 컴포넌트에서 한국어 문자열 식별
2. `<section>.<sub>.<element>` 형식으로 키 작성
3. `ko/common.json` 에 원본 한국어 등록
4. `en/common.json` 에 영어 번역 (LLM 초벌 + 검수)
5. 컴포넌트 코드를 `t(key)` 호출로 치환
6. 한 파일 단위로 commit → KO/EN 토글로 수동 검증

## 6. 데이터 흐름 (언어 변경)

```
사용자 LanguageSwitcher EN 클릭
   ↓
i18n.changeLanguage('en')
   ↓
LanguageDetector → localStorage['composer.lang'] = 'en' 영속화
   ↓
i18next 'languageChanged' 이벤트 발화
   ↓
react-i18next 의 useTranslation hook 구독 컴포넌트 자동 리렌더
   ↓
t('app.menu.composer') 가 새 언어 사전 lookup
```

## 7. 에러 처리

| 상황 | 동작 |
|---|---|
| 양쪽 언어에 키 미존재 | 키 문자열 자체 반환 ("foo.bar"). dev 에서 `missingKeyHandler` console.warn |
| 영어 사전에만 키 누락 | `fallbackLng: 'ko'` → 한국어 폴백. 화면 안 깨지지만 영어 모드에 한국어 노출 |
| localStorage 접근 차단 | LanguageDetector 가 navigator.language 폴백 → 그것도 실패 시 `fallbackLng: 'ko'` |
| i18n 초기화 전 t() 호출 (Suspense false) | i18next 가 key 반환 → 초기화 직후 자동 리렌더 |

## 8. 테스트 전략

약 250 키 규모는 수동 + 부분 자동화 조합.

- **수동 스모크 시나리오** (KO/EN 각 1회):
  1. App 진입 → 메뉴바 EN 토글 → 메뉴 5개 영어 확인
  2. Composer 카드 → landing 영어 확인 → 자연어 생성 클릭 → 진입 화면 영어
  3. ModeNewGeneral 의 옵션 영역 (Mockup/UI Pattern/Data Source picker) 영어
  4. ModeNewStep 진입 → 패턴 카드 5종 (AI 추천 / SCM UI Mockup / T3MES UI Pattern / Dashboard / 빈 캔버스) 영어
  5. Wizard 4단계 모두 진입 → 라벨/버튼/안내 영어
  6. ChatPanel 텍스트 입력 영어 placeholder → Claude 응답이 영어로 도착
  7. 새로고침 → 영어 유지
- **누락 키 점검**: dev console 의 `missingKey` warn 0건 확인 (전 시나리오)
- **자연어 검수**: en/*.json 3종 파일을 언어 담당자 1차 리뷰 (특히 SCM 도메인 용어)
- **Backend 통합 테스트**: `POST /composer/sessions` 에 `lang: 'en'` 보내고 → DB `ui_language` 저장 확인 + `ChatPanel` 에 영어 응답 도착 확인
- **자동화 (Phase 5에 추가)**: 미사용/미번역 키 grep script (전체 `t('key')` ↔ JSON keys diff)

## 9. 작업 단계 (구현 순서)

| Phase | 단계 | 산출물 |
|---|---|---|
| **1. 기반 인프라** ||
| 1.1 | 의존성 추가 | `package.json` 에 `i18next` / `react-i18next` / `i18next-browser-languagedetector` + `npm install` |
| 1.2 | i18n 초기화 골격 | `frontend/src/i18n/index.js` + 빈 `locales/{ko,en}/{common,composer,wizard}.json` 6개 |
| 1.3 | 진입점 wiring | `frontend/src/index.js` 에 `import './i18n'` 1회 |
| 1.4 | LanguageSwitcher mount | App.jsx 메뉴바 우측에 배치 — 동작 확인 (값 변경 시 localStorage 영속 + console 만 봐도 OK) |
| **2. 메인 진입부** (~40 키) ||
| 2.1 | App.jsx MENU_ITEMS 치환 | `label`/`hint` → `t('app.menu.*')` |
| 2.2 | T3Composer.jsx landing + 카드 | 제목/부제/카테고리/Mode 카드 → `t('composer.*')` |
| **3. Mode 진입 직후 화면** (~80 키) ||
| 3.1 | ModeNewNl / ModeNewStep / ModeNewFromCopy / ModeExistingModify | 진입 직후 라벨/버튼/안내 |
| 3.2 | ModeNewGeneral | 입력 영역 + 선택사항 (Mockup/UI Pattern/D&D/Data Source) 라벨 |
| 3.3 | Picker 다이얼로그 | MockupPicker / UiPatternPicker / DataSourcePicker UI 라벨 (데이터는 미번역) |
| **4. 4-Step Wizard** (~100 키) ||
| 4.1 | ComposerWizard stepper | 4단계 라벨 + 이전/다음/생성 버튼 |
| 4.2 | LayoutStep + ComposerCanvas | Layer 추가/삭제/타입 라벨 + 12-col 안내 |
| 4.3 | DataAndFilterStep | dataSource 모드 (NL/TABLE/SP/ENTITY/SQL/MIXED) + 검색조건 UI |
| 4.4 | MetaStep | 입력 라벨 + validation 메시지 |
| 4.5 | GenerateStep | 생성 버튼 + 시작 안내 |
| **5. ChatPanel + Workspace** (~30 키) ||
| 5.1 | ChatPanel UI | placeholder · 전송 · 진행 상태 · 자동보완 토스트 |
| 5.2 | ComposerWorkspace 헤더 | [화면 실행] [메뉴 등록] [아티팩트 실행] [자동보완] |
| **6. Backend 챗봇 언어** ||
| 6.1 | DB 마이그레이션 | `docker/db/init-pg/always/02_session_ui_language.sql` — `ALTER TABLE tb_is_composer_session ADD COLUMN IF NOT EXISTS ui_language varchar(8) DEFAULT 'ko'` |
| 6.2 | Backend Entity / DTO | `ComposerSession.uiLanguage` 필드 추가 + `createSession` / `sendMessage` 요청 DTO `lang` 수용 |
| 6.3 | ComposerPromptBuilder | `buildStaticSystemPrompt(uiLanguage)` 시그니처 변경 + 언어별 응답 지침 추가 |
| 6.4 | Frontend api.js | axios interceptor 로 `lang: i18n.language` 자동 첨부 (createSession/sendMessage 두 endpoint) |
| 6.5 | 수동 검증 | 영어 토글 → 새 세션 → "Create a sales dashboard" 영어 입력 → Claude 영어 응답 + 산출물 코드 한국어 라벨 유지 확인 |
| **7. 마무리** ||
| 7.1 | 통합 스모크 | §8 의 7가지 시나리오 KO/EN 양쪽 수행 |
| 7.2 | 영어 카피 검수 | en/*.json 3종 1차 리뷰 |
| 7.3 | 문서화 | `docs/` 에 "다국어 키 추가 절차" 가이드 1단락 |

## 10. 향후 확장 (Future Work)

본 MVP 이후 점진 확장 경로:

1. **ComposerWorkspace 좌측 패널 + PreviewEmbed 안내** — 아티팩트 트리 라벨 / 상태 칩 / preview 안내 메시지
2. **History / SCM UI Mockup / UI Pattern 카탈로그 화면** — 별도 spec
3. **데이터 필드 다국어화** — MOCKUP_ENTRIES 의 `patternLabel/description` 등 데이터 모델을 `{ ko, en }` 객체 또는 별도 i18n key reference 로 전환
4. **일본어 / 중국어 추가** — `locales/ja/*.json` · `locales/zh-CN/*.json`. 영어 키 구조 안정화 후 진행
5. **번역 키 lint CI** — 미사용 키 탐지, 미번역 키 (영어 사전 누락) 자동 검출
6. **산출물 코드의 자동 영어화 옵션** — 현재는 한국어 유지 강제. 향후 사용자 선택지로 "산출물도 영어로 생성" 토글 (운영 환경이 영어인 고객용)

## 11. 위험 · 가정

| 위험 | 완화 |
|---|---|
| 약 250 키 작업이 한 번에 끝나지 않아 부분 영어 상태로 머뭄 | Phase 단위 (§9) 로 commit + 마지막 phase 까지는 missingKey warn 일부 허용. 단 Phase 2~5 종료 시점에는 그 phase 의 키 missingKey 0건 |
| 영어 번역의 자연스러움 부족 (특히 SCM 도메인 용어) | en/*.json 단계별 commit → 언어 담당자 PR 리뷰. 도메인 용어집 별도 정리 |
| Backend 언어 변경 후 자동보완 루프 (rules/50 §14) 가 한국어 산출물 → 영어 prompt 받아 한국어 코드 못 고침 | 자동보완 prompt 도 동일한 uiLanguage 사용. 단 산출물 자체는 항상 한국어 유지 (system prompt 에 명시) |
| 산출물 컴파일/실행 시 Claude 가 "영어로 코드 생성" 으로 오해석 → 산출물의 `headerText: 'User Name'` 같이 영어 라벨 생성 | system prompt 에 강조: "Code artifacts must keep all Korean labels". 자동보완 루프 prompt 에도 반복 명시. CI 에서 신규 산출물의 영어 비율 sanity check |
| 챗봇 응답 언어 변경 도중 (세션 mid-conversation) → 일관성 깨짐 | 세션 단위로 언어 고정 (첫 메시지 시점) — 변경 불가. UI 에 "현재 세션 언어: EN" 표시 |
| react-i18next 도입이 기존 코드 (산출물 preview shim 등) 깨뜨림 | `transLangKey` shim (`shim/zionex/i18n-func.js`) 은 별도 — 산출물용. react-i18next 의 t() 와 무관 (네임스페이스 충돌 없음) |

## 12. 관련 파일

### 신규
- `frontend/src/i18n/index.js` — i18next 초기화
- `frontend/src/i18n/locales/{ko,en}/{common,composer,wizard}.json` — 6개 사전
- `frontend/src/view/util/t3composer/LanguageSwitcher.jsx`
- `frontend/src/view/util/t3composer/useUiLanguage.js` — backend 전달용 hook
- `docker/db/init-pg/always/02_session_ui_language.sql` — DB migration (멱등 ALTER)

### 수정 (Frontend)
- `frontend/package.json` — 의존성 3개 추가
- `frontend/src/index.js` — `import './i18n'` 1회
- `frontend/src/App.jsx` — MENU_ITEMS t() 치환 + LanguageSwitcher mount
- `frontend/src/view/util/t3composer/T3Composer.jsx` — landing + Mode 카드
- `frontend/src/view/util/t3composer/Mode{NewNl,NewStep,NewFromCopy,ExistingModify,NewGeneral}.jsx` — 진입 화면
- `frontend/src/view/util/t3composer/{Mockup,UiPattern,DataSource}PickerDialog.jsx` — picker UI
- `frontend/src/view/util/t3composer/ComposerWizard.jsx` + `{Layout,DataAndFilter,Meta,Generate}Step.jsx` + `ComposerCanvas.jsx`
- `frontend/src/view/util/t3composer/ChatPanel.jsx` · `ComposerWorkspace.jsx`
- `frontend/src/view/util/t3composer/api.js` — axios interceptor 로 `lang` 자동 첨부

### 수정 (Backend)
- `backend/.../service/ComposerPromptBuilder.java` — `buildStaticSystemPrompt(uiLanguage)` 시그니처 + 응답 언어 지침
- `backend/.../service/ComposerService.java` — session 의 uiLanguage 를 prompt builder 로 전달
- `backend/.../controller/ComposerController.java` — `createSession` / `sendMessage` 요청 DTO `lang` 수용
- `backend/.../entity/ComposerSession.java` — `uiLanguage` 컬럼 매핑

### 참조 (변경 없음 — 정합성 확인용)
- 기존 `frontend/src/shim/zionex/i18n-func.js` — `transLangKey` stub (산출물 preview shim 용. react-i18next 와 분리)
- `.claude/rules/50-composer-standalone-runtime.md §13.0` — Target 런타임 환경 패리티
- `.claude/rules/41a-composer-jsx.md §4.6` — showMessage / store 매핑 (산출물 한국어 보존 정합성)

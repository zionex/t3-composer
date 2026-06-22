# 다국어 (LangPack) 지원 — 영어 우선, 메인 진입부 MVP

**날짜**: 2026-06-22
**범위**: T3Composer 프론트엔드 메인 진입부 (App.jsx 상단 메뉴바 + T3Composer.jsx landing + Mode 선택 카드)
**대상 언어**: 한국어 (기존), 영어 (신규 추가)
**디폴트 언어**: 한국어 (fallbackLng)
**언어 전환 UI**: 상단 메뉴바 우측 ToggleButtonGroup (KO/EN)

---

## 1. 배경 · 동기

본 솔루션 (T3Composer) 을 한국 외 지역 (일본·대만/중국·해외 영어권) 에 배포할 계획. 현재 프론트엔드는 i18n 라이브러리가 없고, 약 353개 JSX 파일에 한국어 약 9만 occurrence 가 하드코딩되어 있다.

본 작업은 **대외 프레젠테이션용 메인 진입부에 한정한 1차 MVP** — 영어 사용자가 메인 메뉴/landing/모드 선택 카드까지 영어로 보고, Mode 클릭 후 내부 화면은 한국어로 진입한다. 영어 키 구조 검증 후 추후 일본어/중국어 추가 + 내부 화면으로 점진 확장.

## 2. 범위 (Scope)

### 포함 (In Scope)

| 파일 | 대상 |
|---|---|
| `frontend/src/App.jsx` | 상단 `MENU_ITEMS` 의 `label` + `hint` (6개 메뉴 × 2 필드 = 12 키): Composer / History / SCM UI Mockup / UI Pattern / Ontology / Dashboard |
| `frontend/src/view/util/t3composer/T3Composer.jsx` | landing 제목 · 부제 · `NEW_MODE_OPTIONS` 3종 카드 (title / sub / hint = 9 키) · `MODIFY_MODE_OPTIONS` 2종 카드 (title / sub / hint = 6 키) · 카테고리 라벨 (신규 개발 / 기존 화면 수정) · 상태/공통 라벨 |

예상 키 규모: 약 40개 (단일 `common` namespace).

### 제외 (Out of Scope)

- Mode 진입 후 화면 (ComposerWorkspace · 4-Step Wizard · ChatPanel · ArtifactPanel · PreviewEmbed) — 한국어 유지
- 데이터 필드 (`MOCKUP_ENTRIES.patternLabel` · `description` · `T3MES UI Pattern` 라벨 등) — 한국어 유지
- 일본어 (ja) · 중국어 (zh-CN) — 본 MVP 에서 영어 키 구조 안정화 후 후속 작업
- 백엔드 응답 (Claude 가 돌려주는 자연어 텍스트) — 사용자가 영어 prompt 작성하면 자연스럽게 영어 응답을 받는 별개 흐름

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
        common.json             ← 한국어 (현재 문자열을 키로 매핑)
      en/
        common.json             ← 영어 번역
  view/util/t3composer/
    LanguageSwitcher.jsx        ← 상단 메뉴바 우측 토글 (KO/EN)
```

### 3.3 i18next 초기화 설정

```js
// frontend/src/i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import koCommon from './locales/ko/common.json';
import enCommon from './locales/en/common.json';

i18n.use(LanguageDetector).use(initReactI18next).init({
  resources: {
    ko: { common: koCommon },
    en: { common: enCommon },
  },
  fallbackLng: 'ko',
  supportedLngs: ['ko', 'en'],
  ns: ['common'],
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

## 4. 키 명명 규약

200+ 키로 확장 대비 일관성 중요. lowerCamel + dot 구분.

| 섹션 | 예 키 | 예 값 (ko / en) |
|---|---|---|
| `app.menu.*` | `app.menu.composer` | `"T3Composer"` / `"T3Composer"` |
| `app.menu.*` | `app.menu.history` | `"History"` / `"History"` |
| `app.menu.*` | `app.menu.scmUiMockup` | `"SCM UI Mockup"` / `"SCM UI Mockup"` |
| `composer.landing.*` | `composer.landing.title` | `"T³Composer"` / `"T³Composer"` |
| `composer.landing.*` | `composer.landing.subtitle` | `"AI 기반 화면 자동 생성"` / `"AI-powered screen generation"` |
| `composer.mode.<key>.*` | `composer.mode.newNl.title` | `"자연어 생성"` / `"Natural Language"` |
| `composer.mode.<key>.*` | `composer.mode.newNl.sub` | `"Natural Lang."` / `"Natural Lang."` |
| `composer.mode.<key>.*` | `composer.mode.newNl.hint` | `"요구사항을 자연어로 설명하면 Claude 가 패턴·코드를 생성합니다"` / `"Describe requirements in natural language; Claude generates patterns and code"` |
| `composer.category.*` | `composer.category.newDev` | `"신규 개발"` / `"New Development"` |
| `composer.category.*` | `composer.category.modifyExisting` | `"기존 화면 수정"` / `"Modify Existing Screen"` |

동적 값은 `{{value}}` interpolation: `t('foo.count', { n: 5 })` → 한국어 `"5개"` / 영어 `"5 items"`.

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

A 범위 30~50 키 규모는 수동 검증으로 충분.

- **수동 스모크**: KO/EN 토글 → 메인 진입부 모든 텍스트 변환 육안 확인
- **누락 키 점검**: dev console 의 `missingKey` warn 0건 확인
- **영속성**: 새로고침 후 마지막 언어 유지 확인
- **자연어 검수**: 원어민/언어 담당자가 en/common.json 표현 적합성 1차 리뷰

자동화는 deferred — 향후 키가 200+ 로 늘면 미사용 키 / 미번역 키 lint script 추가.

## 9. 작업 단계 (구현 순서)

| # | 단계 | 산출물 |
|---|---|---|
| 1 | 의존성 추가 | `package.json` 에 `i18next` / `react-i18next` / `i18next-browser-languagedetector` + `npm install` |
| 2 | i18n 초기화 골격 | `frontend/src/i18n/index.js` + 빈 `locales/{ko,en}/common.json` |
| 3 | 진입점 wiring | `frontend/src/index.js` 에 `import './i18n'` 1회 |
| 4 | 키 추출 + 사전 채우기 | App.jsx · T3Composer.jsx 에서 한국어 추출 → ko/en JSON 채우기 (영어는 LLM 초벌) |
| 5 | 컴포넌트 치환 | `useTranslation()` + `t(key)` 로 하드코딩 교체 |
| 6 | LanguageSwitcher mount | App.jsx 메뉴바 우측에 배치 |
| 7 | 수동 검증 + 영어 카피 검수 | KO/EN 토글 → 모든 텍스트 자연스러운 영어인지 확인 |
| 8 | 사용자 가이드 문서 | README 또는 docs/ 에 "다국어 키 추가 절차" 짧은 가이드 1단락 |

## 10. 향후 확장 (Future Work)

본 MVP 이후 점진 확장 경로:

1. **내부 화면 확대** — Mode 진입 후 화면 (ModeNewGeneral / Wizard / Workspace) 으로 i18n 확장. 키 규모 200~500 예상
2. **데이터 필드 다국어화** — MOCKUP_ENTRIES 의 `patternLabel/description` 등 데이터 모델을 `{ ko, en }` 객체 또는 별도 i18n key reference 로 전환
3. **일본어 / 중국어 추가** — `locales/ja/common.json` · `locales/zh-CN/common.json` 추가. 영어 키 구조 안정화 후 진행
4. **백엔드 ↔ 프론트 LangPack 통합** — 부모 wingui 의 `TB_AD_LANG_PACK` 구조 활용 검토 (현재는 별도 운영). Composer 자체는 파일 기반으로 충분
5. **번역 키 lint** — 미사용 키 탐지, 미번역 키 (영어 사전 누락) CI 검증

## 11. 위험 · 가정

| 위험 | 완화 |
|---|---|
| 영어 모드에서 Mode 진입 시 갑자기 한국어 화면 → UX 단절 | MVP 의 의도된 한계 명시. 진입 시점에 "이후 화면은 한국어입니다" 안내 가능 |
| 영어 번역의 자연스러움 부족 | LLM 초벌 + 사용자/언어 담당자 검수 단계 의무화 |
| react-i18next 도입이 다른 영역 코드 깨뜨림 | A 범위 외 코드는 t() 미사용 → 영향 없음 |
| 후속 확장 시 키 명명 규약 불일치 | 본 spec 의 §4 명명 규약 준수 강제 (코드 리뷰) |

## 12. 관련 파일

### 신규
- `frontend/src/i18n/index.js`
- `frontend/src/i18n/locales/ko/common.json`
- `frontend/src/i18n/locales/en/common.json`
- `frontend/src/view/util/t3composer/LanguageSwitcher.jsx`

### 수정
- `frontend/package.json` — 의존성 3개 추가
- `frontend/src/index.js` — `import './i18n'` 1회
- `frontend/src/App.jsx` — MENU_ITEMS 라벨 5종 t() 치환 + LanguageSwitcher mount
- `frontend/src/view/util/t3composer/T3Composer.jsx` — landing 제목/부제 + NEW_MODE_OPTIONS 카드 t() 치환

### 참조
- 기존 `frontend/src/shim/zionex/i18n-func.js` — `transLangKey` stub (보존 — 산출물 호환용)
- `.claude/rules/50-composer-standalone-runtime.md §13.0` — Target 런타임 환경 패리티 (산출물 호환과 충돌 없는지 확인)

# T3Composer 다국어 (i18n) 가이드

## 현재 지원 언어
- 한국어 (ko, 기본값)
- 영어 (en)

## 디렉토리 구조

```
frontend/src/i18n/
├── index.js                              # i18next 초기화
└── locales/
    ├── ko/{common,composer,wizard}.json  # 한국어 사전
    └── en/{common,composer,wizard}.json  # 영어 사전
```

## namespace 사용 기준

| namespace | 다루는 영역 |
|---|---|
| `common` | 전역 메뉴/액션/상태 (App.jsx 등) |
| `composer` | Landing + Mode 카드 + Mode 진입 화면 + Picker 다이얼로그 |
| `wizard` | 4-Step Wizard + ChatPanel + ComposerWorkspace |

## 새 키 추가 절차

1. `ko/<ns>.json` 에 키 + 한국어 값 추가
2. `en/<ns>.json` 에 동일 키 + 영어 값 추가 (양쪽 parity 필수)
3. 컴포넌트에서 `const { t } = useTranslation('<ns>');` 후 `t('key.path')` 호출
4. KO/EN 토글로 양쪽 모두 확인
5. DevTools Console 의 `missingKey` warn 0건 확인

## 동적 값 (interpolation)

```jsx
t('chat.autoFix.toast', { n: 1, max: 3 })
// 키 값: "🤖 AI 자동보완 ({{n}}/{{max}})" / "🤖 AI auto-fix ({{n}}/{{max}})"
```

## 백엔드 응답 언어

- 세션 단위로 언어 고정 (createSession 시 lang 파라미터)
- `ComposerSession.uiLanguage` 컬럼이 'ko' 또는 'en' 저장
- `ComposerPromptBuilder.buildLanguageInstruction(uiLanguage)` 가 Claude 응답 언어 지시
- 산출물 코드 (JSX `headerText`, Java `ResponseMessage`, MENU SQL) 는 **항상 한국어 유지** — system prompt 에 명시 강제

## 언어 전환 UI

상단 메뉴바 우측의 `LanguageSwitcher` (KO/EN ToggleButtonGroup) — localStorage 에 `composer.lang` 영속.

## 향후 확장 (별도 spec)

- ComposerWorkspace 좌측 패널 + PreviewEmbed
- History / SCM UI Mockup / UI Pattern 카탈로그 화면
- 데이터 필드 (MOCKUP_ENTRIES.patternLabel 등)
- 일본어 / 중국어 추가

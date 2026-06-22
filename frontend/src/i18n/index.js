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
  // region 코드 (en-US, en-GB, ko-KR) 가 들어와도 언어 코드만 매칭
  load: 'languageOnly',
  nonExplicitSupportedLngs: true,
  ns: ['common', 'composer', 'wizard'],
  defaultNS: 'common',
  detection: {
    // 사용자가 토글한 적 있으면 localStorage 우선, 없으면 navigator.language 자동 감지
    order: ['localStorage', 'navigator', 'htmlTag'],
    lookupLocalStorage: 'composer.lang',
    caches: ['localStorage'],
    // 정책: 한국 (ko*) 만 ko, 그 외 모든 언어 (en-US, ja, zh-CN, fr 등) 는 en 디폴트
    convertDetectedLanguage: (lng) => ((lng || '').toLowerCase().startsWith('ko') ? 'ko' : 'en'),
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

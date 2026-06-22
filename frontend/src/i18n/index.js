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

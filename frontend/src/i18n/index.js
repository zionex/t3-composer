import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import koCommon   from './locales/ko/common.json';
import koComposer from './locales/ko/composer.json';
import koWizard   from './locales/ko/wizard.json';
import enCommon   from './locales/en/common.json';
import enComposer from './locales/en/composer.json';
import enWizard   from './locales/en/wizard.json';
import jaCommon   from './locales/ja/common.json';
import jaComposer from './locales/ja/composer.json';
import jaWizard   from './locales/ja/wizard.json';
import zhCNCommon   from './locales/zh-CN/common.json';
import zhCNComposer from './locales/zh-CN/composer.json';
import zhCNWizard   from './locales/zh-CN/wizard.json';
import zhTWCommon   from './locales/zh-TW/common.json';
import zhTWComposer from './locales/zh-TW/composer.json';
import zhTWWizard   from './locales/zh-TW/wizard.json';

i18n.use(LanguageDetector).use(initReactI18next).init({
  resources: {
    ko:      { common: koCommon,   composer: koComposer,   wizard: koWizard },
    en:      { common: enCommon,   composer: enComposer,   wizard: enWizard },
    ja:      { common: jaCommon,   composer: jaComposer,   wizard: jaWizard },
    'zh-CN': { common: zhCNCommon, composer: zhCNComposer, wizard: zhCNWizard },
    'zh-TW': { common: zhTWCommon, composer: zhTWComposer, wizard: zhTWWizard },
  },
  fallbackLng: 'en',
  supportedLngs: ['ko', 'en', 'ja', 'zh-CN', 'zh-TW'],
  // ★ 'zh-CN' / 'zh-TW' 는 region 토큰이 곧 언어 구분 (간체/번체) 이므로 normalize 금지.
  //   - load: 'currentOnly' → 'zh-CN' 을 'zh' 로 자동 잘라내지 않음
  //   - nonExplicitSupportedLngs 미지정 (default false) → 'zh-CN' 요청이 'zh' 로 fallback 시도 안 함
  //   (이전: load:'all' + nonExplicitSupportedLngs:true 조합이 'zh-CN' 을 'zh' 로 normalize 시도 →
  //    resources 에 'zh' 없어 fallback 'en' 으로 빠지는 버그)
  load: 'currentOnly',
  ns: ['common', 'composer', 'wizard'],
  defaultNS: 'common',
  detection: {
    // 사용자가 토글한 적 있으면 localStorage 우선, 없으면 navigator.language 자동 감지
    order: ['localStorage', 'navigator', 'htmlTag'],
    lookupLocalStorage: 'composer.lang',
    caches: ['localStorage'],
    // 5개 지원 locale 로 정규화. 기타 (fr, de 등) 는 en 디폴트.
    //   ko* → ko · ja* → ja · zh-TW/zh-HK/zh-Hant* → zh-TW · 기타 zh* → zh-CN · 그 외 → en
    convertDetectedLanguage: (lng) => {
      const l = (lng || '').toLowerCase();
      if (l.startsWith('ko')) return 'ko';
      if (l.startsWith('ja')) return 'ja';
      if (l.startsWith('zh')) {
        if (l.startsWith('zh-tw') || l.startsWith('zh-hk') || l.includes('hant')) return 'zh-TW';
        return 'zh-CN';
      }
      return 'en';
    },
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

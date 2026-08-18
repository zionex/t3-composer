import { useTranslation } from 'react-i18next';

import mockupLabelEn from './_data/mockup-label-en.json';

// 목업 patternLabel / description 다국어 처리 — 정적 사전 lookup.
// 규칙: 'ko' 로 시작하는 언어면 한국어 원본, 그 외(en/ja/zh-CN/zh-TW)는 영어 매핑.
// 매핑 미보유 라벨은 원본 그대로 반환. T3Mockup 와 T3Home 등 목업 라벨을 노출하는 모든 화면이 공유.

export function localizePatternLabel(label, isEn) {
    if (!isEn || !label) return label;
    return mockupLabelEn.patternLabel[label] || label;
}

export function localizeDescription(desc, isEn) {
    if (!isEn || !desc) return desc;
    return mockupLabelEn.description[desc] || desc;
}

// 현재 i18next 언어가 ko 이외인지. React 컴포넌트 안에서 useMockupLocalize 대신 직접 참조 가능.
export function useIsEnLocale() {
    const { i18n } = useTranslation();
    return !(i18n.language || '').toLowerCase().startsWith('ko');
}

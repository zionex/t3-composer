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

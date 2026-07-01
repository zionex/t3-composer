import { useTranslation } from 'react-i18next';

/**
 * 현재 UI 언어를 backend 전달용 형식으로 정규화.
 * 지원: 'ko' · 'en' · 'ja' · 'zh-CN' · 'zh-TW'. 기타 → 'en'.
 *
 *   - i18n.language 가 region 포함 ('en-US', 'ja-JP', 'zh-Hant-TW' 등) 일 수 있어 정규화.
 *   - 'zh-TW'/'zh-HK'/'zh-Hant*' → 'zh-TW' (번체)
 *   - 그 외 'zh*' → 'zh-CN' (간체)
 */
function normalize(raw) {
  const l = (raw || '').toLowerCase();
  if (l.startsWith('ko')) return 'ko';
  if (l.startsWith('ja')) return 'ja';
  if (l.startsWith('zh')) {
    if (l.startsWith('zh-tw') || l.startsWith('zh-hk') || l.includes('hant')) return 'zh-TW';
    return 'zh-CN';
  }
  if (l.startsWith('en')) return 'en';
  return 'en';
}

export default function useUiLanguage() {
  const { i18n } = useTranslation();
  return normalize(i18n.language);
}

/** hook 없이 동기 호출이 필요한 곳 (axios interceptor 등) — i18next 인스턴스 직접 조회 */
export function getUiLanguage() {
  if (typeof window === 'undefined') return 'ko';
  try {
    const stored = window.localStorage.getItem('composer.lang');
    if (stored) return normalize(stored);
  } catch (_) {}
  const nav = (typeof navigator !== 'undefined' ? navigator.language : '') || '';
  return normalize(nav);
}

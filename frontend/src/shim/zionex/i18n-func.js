// @zionex/wingui-core/lang/i18n-func — 직접 path import 도 호환
export const transLangKey = (key, fallback) => fallback || key || '';
export const t = transLangKey;
export default { transLangKey, t };

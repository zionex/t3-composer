// =============================================================================
// cssVariables — registerCssVariables()
//
// document.documentElement 에 다음 3개 CSS custom property dict 를 :root 에 주입한다:
//
//   1) atomicColors.variable — --color-aqua-{step}, --color-opacity-{step}
//      (Figma "Atomic - Aqua" 정본 네이밍)
//   2) paletteVariables      — --palette-primary, --palette-text-muted, ...
//      (Figma "palette-* semantic 토큰" 규칙)
//   3) typographyVariables   — --typography-title-1-size / -line-height / -letter-spacing / -font-weight, …
//      (Figma "Title-1 · Body-3 · Label-2 · Caption-1" 정본 네이밍 · size/lh/spacing/weight 축별 분해)
//
// 화면 CSS/sx 에서:
//   var(--color-aqua-60)                  — atomic 참조 (semantic 경유 권장)
//   var(--palette-primary)                — semantic 참조 (Figma 규칙 상 이 층 사용 권장)
//   var(--typography-title-1-size)        — 개별 축 참조 자유 조합
//
// 사용 (index.jsx 진입점에서 1회 호출):
//   import { registerCssVariables } from './style';
//   registerCssVariables();
//
// SSR-safe: document 가 없으면 no-op.
// =============================================================================

import { atomicColors } from './atomicColors';
import { paletteVariables } from './semanticTokens';
import { typographyVariables } from './typography';

export function registerCssVariables() {
  if (typeof document === 'undefined' || !document.documentElement) return;
  const rootStyle = document.documentElement.style;
  const all = {
    ...atomicColors.variable,
    ...paletteVariables,
    ...typographyVariables,
  };
  Object.keys(all).forEach((varName) => {
    rootStyle.setProperty(varName, String(all[varName]));
  });
}

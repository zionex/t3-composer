// =============================================================================
// atomicColors — Figma "T3Composer 디자인 가이드 v1.0" 원본 팔레트
//
// ⛔ 화면 코드에서 atomicColors.* 직접 참조 금지.
//    반드시 style/semanticTokens.js 의 PALETTE 또는 colorToken() 을 경유.
//    (Figma 규칙 명문: "palette-* semantic 토큰만 사용, atomic 직접 참조 금지.")
//
// wingui atomicColors.js 와 동일한 3-part 구조 (color / opacity / variable) 를 따른다:
//   color.<hue>.<step>  — 코드에서 반드시 semanticTokens 경유해 참조
//   opacity.<step>      — 알파값 상수
//   variable            — CSS custom property dict (registerCssVariables 로 :root 주입)
// =============================================================================

export const atomicColors = {
  color: {
    // aqua — 14단계 ladder. semantic 매핑(대표/hover/border 등)은 style/semanticTokens.js 참조.
    aqua: {
      99: '#FAFEFF',
      95: '#F2FCFD',
      93: '#EAF9FB',
      90: '#DDF6FA',
      85: '#C8EFF6',
      80: '#A5E3EF',
      70: '#6FD0E2',
      60: '#42BED6',
      50: '#0FA8CC',
      40: '#0C97B7',
      30: '#0A88A8',
      20: '#07697F',
      15: '#055362',
      10: '#043B49',
    },
  },
  opacity: {
    0: 0,
    4: 0.04,
    8: 0.08,
    12: 0.12,
    16: 0.16,
    20: 0.2,
    24: 0.24,
    32: 0.32,
    40: 0.4,
    48: 0.48,
    56: 0.56,
    64: 0.64,
    72: 0.72,
    80: 0.8,
    88: 0.88,
    100: 1,
  },
  variable: {
    // --color-aqua-<step>: registerCssVariables() 가 :root 에 세팅.
    // 화면에서는 var(--color-aqua-<step>) 로 참조 가능 (semantic 경유 권장).
    '--color-aqua-99': '#FAFEFF',
    '--color-aqua-95': '#F2FCFD',
    '--color-aqua-93': '#EAF9FB',
    '--color-aqua-90': '#DDF6FA',
    '--color-aqua-85': '#C8EFF6',
    '--color-aqua-80': '#A5E3EF',
    '--color-aqua-70': '#6FD0E2',
    '--color-aqua-60': '#42BED6',
    '--color-aqua-50': '#0FA8CC',
    '--color-aqua-40': '#0C97B7',
    '--color-aqua-30': '#0A88A8',
    '--color-aqua-20': '#07697F',
    '--color-aqua-15': '#055362',
    '--color-aqua-10': '#043B49',

    '--color-opacity-0': 0,
    '--color-opacity-4': 0.04,
    '--color-opacity-8': 0.08,
    '--color-opacity-12': 0.12,
    '--color-opacity-16': 0.16,
    '--color-opacity-20': 0.2,
    '--color-opacity-24': 0.24,
    '--color-opacity-32': 0.32,
    '--color-opacity-40': 0.4,
    '--color-opacity-48': 0.48,
    '--color-opacity-56': 0.56,
    '--color-opacity-64': 0.64,
    '--color-opacity-72': 0.72,
    '--color-opacity-80': 0.8,
    '--color-opacity-88': 0.88,
    '--color-opacity-100': 1,
  },
};

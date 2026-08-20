// =============================================================================
// T3Composer MUI Theme — createTheme + component overrides 만 (얇음).
//
// 색·타이포·글래스 토큰 정의는 style/ 폴더로 분리:
//   style/atomicColors.js   — Figma aqua ladder + opacity + CSS variable dict
//   style/semanticTokens.js — PALETTE + colorToken(cat,key)
//   style/typography.js     — TYPOGRAPHY + FONT_FAMILY
//   style/glass.js          — GLASS + AI_GRADIENT + glassPanel + InfoDot
//   style/cssVariables.js   — registerCssVariables (:root 주입)
//   style/index.js          — barrel
//
// 이 파일은:
//   1) style/ 토큰을 이용해 MUI theme (palette · typography · components) 구성
//   2) 하위 호환용 re-export — 화면들이 `import { PALETTE, TYPOGRAPHY } from '../../../theme'`
//      로 계속 동작하도록 (신규 화면은 `../../../style` 직접 권장)
//
// 대표 컬러: aqua ladder 기반 semantic 슬롯. 실제 hex 는 style/semanticTokens.js 를 진실 저장소로 참조.
//
// 텍스트 최소화 컨벤션: 1줄 초과 설명은 화면에서 빼고 <InfoDot title={...}/> 대체.
// =============================================================================

import { createTheme } from '@mui/material/styles';

import { PALETTE, colorToken } from './style/semanticTokens';
import { FONT_FAMILY, TYPOGRAPHY } from './style/typography';
import { GLASS, AI_GRADIENT, glassPanel, InfoDot } from './style/glass';
import { atomicColors } from './style/atomicColors';

// -----------------------------------------------------------------------------
// 하위 호환 re-export — 기존 화면들은 './theme' 에서 계속 import 가능.
// 신규 화면은 './style' 직접 사용 권장.
// -----------------------------------------------------------------------------
export {
  PALETTE, colorToken,
  FONT_FAMILY, TYPOGRAPHY,
  GLASS, AI_GRADIENT, glassPanel, InfoDot,
  atomicColors,
};

// ATOMIC 별칭 — 하위 호환.
export const ATOMIC = { aqua: atomicColors.color.aqua };

// -----------------------------------------------------------------------------
// MUI createTheme — palette / typography / components
// -----------------------------------------------------------------------------
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main:  colorToken('primary', 'main'),
      light: colorToken('primary', 'light'),
      dark:  colorToken('primary', 'dark'),
      contrastText: '#ffffff',
    },
    secondary: {
      main:  colorToken('secondary', 'main'),
      light: colorToken('secondary', 'light'),
      dark:  colorToken('secondary', 'dark'),
      contrastText: '#ffffff',
    },
    success: {
      main:  colorToken('success', 'main'),
      light: colorToken('success', 'light'),
      dark:  colorToken('success', 'dark'),
      contrastText: '#ffffff',
    },
    warning: {
      main:  colorToken('warning', 'main'),
      light: colorToken('warning', 'light'),
      dark:  colorToken('warning', 'dark'),
      contrastText: '#3A4A63',
    },
    error: {
      main:  colorToken('error', 'main'),
      light: colorToken('error', 'light'),
      dark:  colorToken('error', 'dark'),
      contrastText: '#ffffff',
    },
    info: {
      main:  colorToken('info', 'main'),
      light: colorToken('info', 'light'),
      dark:  colorToken('info', 'dark'),
      contrastText: '#ffffff',
    },
    background: {
      default: colorToken('bg', 'default'),
      paper:   GLASS.bg,
    },
    text: {
      primary:   colorToken('text', 'primary'),
      secondary: colorToken('text', 'secondary'),
      disabled:  colorToken('text', 'disabled'),
    },
    divider: 'rgba(10,136,168,0.22)', // aqua-30 tint
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    h4:        { fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.2 },
    h5:        { fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.25 },
    h6:        { fontSize: '1.0rem',  fontWeight: 700, lineHeight: 1.3 },
    subtitle1: { fontSize: '0.9rem',  fontWeight: 600 },
    subtitle2: { fontSize: '0.8rem',  fontWeight: 600 },
    body2:     { fontSize: '0.8rem' },
    caption:   { fontSize: '0.7rem' },
    button:    { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Pretendard JP Variable — self-hosted (frontend/public/fonts/). 한국어+일본어+라틴
        // superset 을 한 파일로 커버하므로 대표 폰트로 사용. weight range 45~920 로
        // Regular(400)/Medium(500)/SemiBold(600) 모두 한 파일. font-display:swap 으로
        // 폰트 로드 전에도 fallback 이 즉시 렌더 (FOUT 최소화).
        '@font-face': [
          {
            fontFamily: 'Pretendard JP',
            fontStyle: 'normal',
            fontWeight: '45 920',
            fontDisplay: 'swap',
            src: 'url("/fonts/PretendardJPVariable.woff2") format("woff2-variations")',
          },
        ],
        'html, body, #root': { height: '100%' },
        body: {
          margin: 0,
          background: 'linear-gradient(135deg, #F6F7F9 0%, #EEF3F5 50%, #F2F4F6 100%)',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: GLASS.bg,
          backgroundImage: 'none',          // MUI elevation overlay 제거
          backdropFilter: GLASS.blur,
          WebkitBackdropFilter: GLASS.blur,
          border: GLASS.border,
          boxShadow: GLASS.shadow,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: GLASS.bg,
          backgroundImage: 'none',
          backdropFilter: GLASS.blur,
          WebkitBackdropFilter: GLASS.blur,
          border: GLASS.border,
          boxShadow: GLASS.shadow,
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'transparent' },
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.60)',
          backgroundImage: 'none',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(10,136,168,0.22)', // aqua-30 tint
          boxShadow: '0 4px 16px -10px rgba(26,35,48,0.22)',
          color: PALETTE.textPrimary,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(255,255,255,0.85)',
          backgroundImage: 'none',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: GLASS.border,
          boxShadow: GLASS.shadowHover,
          borderRadius: 14,
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(58,74,99,0.32)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        },
        invisible: { backgroundColor: 'transparent', backdropFilter: 'none', WebkitBackdropFilter: 'none' },
      },
    },
    // 드롭다운/팝오버 표면 — 반투명이면 목록 가독성이 떨어지므로 불투명에 가깝게
    MuiMenu:    { styleOverrides: { paper: { backgroundColor: GLASS.bgStrong } } },
    MuiPopover: { styleOverrides: { paper: { backgroundColor: GLASS.bgStrong } } },
    MuiTabs: {
      styleOverrides: {
        root: { backgroundColor: 'transparent' },
        indicator: { height: 3, borderRadius: 3, backgroundColor: PALETTE.primary },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '0.78rem',
          fontWeight: 600,
          minHeight: 36,
          color: PALETTE.textSecondary,
          '&.Mui-selected': { color: PALETTE.primaryDark },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8 },
        contained: {
          boxShadow: '0 1px 0 rgba(255,255,255,0.45) inset, 0 4px 12px -4px rgba(58,74,99,0.30)',
          '&:hover': { filter: 'brightness(1.04)' },
        },
        outlined: {
          backgroundColor: 'rgba(255,255,255,0.50)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        },
      },
    },
    MuiChip:   { styleOverrides: { root: { borderRadius: 8 } } },
    MuiTooltip: {
      defaultProps: { arrow: true, enterDelay: 250, placement: 'top' },
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(58,74,99,0.94)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          fontSize: '0.72rem',
          lineHeight: 1.5,
          padding: '6px 10px',
          borderRadius: 8,
          maxWidth: 280,
          boxShadow: '0 6px 20px -6px rgba(58,74,99,0.5)',
        },
        arrow: { color: 'rgba(58,74,99,0.94)' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { backgroundColor: 'rgba(255,255,255,0.60)' } },
    },
  },
});

export default theme;

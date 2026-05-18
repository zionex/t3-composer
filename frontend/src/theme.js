// =============================================================================
// T3Composer 중앙 테마 — 파스텔 블루 글래스모피즘 (Round 1 · 2026-05-15)
//
// 옛 hex → 새 테마 토큰 매핑 (다음 Round 기계적 치환용):
//   blues/indigo/purple  #2563eb #3b82f6 #1d4ed8 #4338ca #7c3aed → primary
//   teals/green          #059669 #10b981 #2a9d8f #0d9488         → success
//   amber                #f59e0b #ffb100                         → warning
//   red                  #ef4444 #dc2626                         → error
//   cyan                 #06b6d4 #0ea5e9                         → info
//   slate text           #0f172a #1e293b #334155 #475569 #64748b → text.primary/secondary
//   slate divider/bg     #e2e8f0 #cbd5e1 → divider · #f1f5f9 #f8fafc #fafafa → background
//
// 텍스트 최소화 컨벤션: 1줄을 넘는 설명 텍스트는 화면에서 빼고, 가까운 요소의
//   <Tooltip> title 로 옮긴다. 짧은 라벨 옆에는 <InfoDot title={...}/> 를 둔다.
// =============================================================================
import React from 'react';
import { createTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// 평면 hex 맵 — 하드코딩 sx 색을 점진 치환할 때 import 해서 사용
export const PALETTE = {
  primary:       '#7CA7E0',
  primaryLight:  '#A9C7EE',
  primaryDark:   '#5683C0',
  secondary:     '#9DB4D4',
  success:       '#86C7A8',
  warning:       '#E6C079',
  error:         '#E0989A',
  info:          '#8FC4D4',
  textPrimary:   '#3A4A63',
  textSecondary: '#6E7E96',
  bgDefault:     '#EEF3FA',
};

// 글래스모피즘 토큰
export const GLASS = {
  bg:          'rgba(255,255,255,0.72)',
  bgStrong:    'rgba(255,255,255,0.90)',   // 드롭다운 등 가독성 필요한 표면
  border:      '1px solid rgba(255,255,255,0.55)',
  blur:        'blur(14px)',
  shadow:      '0 1px 0 rgba(255,255,255,0.85) inset, 0 -1px 0 rgba(124,167,224,0.10) inset, '
             + '0 6px 16px -6px rgba(58,74,99,0.14), 0 14px 36px -18px rgba(58,74,99,0.20)',
  shadowHover: '0 0 0 4px rgba(124,167,224,0.16), 0 18px 44px -14px rgba(124,167,224,0.45), '
             + '0 1px 0 rgba(255,255,255,0.9) inset',
};

/**
 * 글래스 패널 sx 생성 — accent 강조 + 3D 깊이 그림자.
 * 기존 화면의 embossedPaper() 대체용. hovered=true 시 강조 그림자.
 */
export function glassPanel(accent = PALETTE.primary, hovered = false) {
  return {
    borderRadius: 3,
    bgcolor: GLASS.bg,
    backdropFilter: GLASS.blur,
    WebkitBackdropFilter: GLASS.blur,
    border: GLASS.border,
    boxShadow: hovered
      ? `0 0 0 4px ${accent}24, ${GLASS.shadowHover}`
      : GLASS.shadow,
    transition: 'box-shadow .18s ease, transform .18s ease',
  };
}

/**
 * 짧은 라벨 옆에 두는 도움말 점 — 호버 시 Tooltip 으로 설명 노출.
 * 장문 설명 텍스트를 화면에서 빼고 이 컴포넌트로 대체한다.
 */
export function InfoDot({ title, sx }) {
  return (
    <Tooltip title={title}>
      <HelpOutlineIcon
        sx={{
          fontSize: 14,
          color: PALETTE.textSecondary,
          cursor: 'help',
          verticalAlign: 'middle',
          opacity: 0.7,
          '&:hover': { opacity: 1 },
          ...sx,
        }}
      />
    </Tooltip>
  );
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary:    { main: PALETTE.primary,   light: PALETTE.primaryLight, dark: PALETTE.primaryDark, contrastText: '#ffffff' },
    secondary:  { main: PALETTE.secondary, light: '#C4D2E6', dark: '#6F87AA', contrastText: '#ffffff' },
    success:    { main: PALETTE.success,   light: '#B5DEC8', dark: '#5E9E81', contrastText: '#ffffff' },
    warning:    { main: PALETTE.warning,   light: '#F0D6A4', dark: '#C49C53', contrastText: '#3A4A63' },
    error:      { main: PALETTE.error,     light: '#EDBEBF', dark: '#C0696B', contrastText: '#ffffff' },
    info:       { main: PALETTE.info,      light: '#BBDEE7', dark: '#6BA0B0', contrastText: '#ffffff' },
    background: { default: PALETTE.bgDefault, paper: GLASS.bg },
    text:       { primary: PALETTE.textPrimary, secondary: PALETTE.textSecondary, disabled: '#A6B2C4' },
    divider:    'rgba(124,167,224,0.28)',
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Noto Sans KR","Malgun Gothic","맑은 고딕",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
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
        'html, body, #root': { height: '100%' },
        body: {
          margin: 0,
          background: 'linear-gradient(135deg, #EEF3FA 0%, #E4ECF7 50%, #EAF0F8 100%)',
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
          borderBottom: '1px solid rgba(124,167,224,0.25)',
          boxShadow: '0 4px 16px -10px rgba(58,74,99,0.25)',
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

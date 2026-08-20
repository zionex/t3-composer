// =============================================================================
// semanticTokens — Figma "T3Composer 디자인 가이드 v1.0" semantic layer
//
// 원칙:
//   - atomicColors (Figma 원본 hex ladder) 는 여기를 통해서만 코드로 노출된다.
//   - 화면 코드는 반드시 PALETTE.* 또는 colorToken(cat,key) 로 참조.
//   - 새 semantic 슬롯 필요 시 atomicColors 신규 hue 추가 후 여기에 매핑.
//
// PALETTE 사용법:
//   import { PALETTE } from '../../../style';   // 또는 legacy: '../../../theme'
//   sx={{ color: PALETTE.textPrimary, borderColor: PALETTE.primaryBorder }}
//
// colorToken 사용법 (theme.js createTheme 팔레트 매핑용):
//   colorToken('primary', 'main')  →  PALETTE.primary
//   colorToken('text',    'muted') →  PALETTE.textMuted
// =============================================================================

import { atomicColors } from './atomicColors';

const A = atomicColors.color.aqua;

// PALETTE — semantic 토큰. 화면 코드에서 유일한 색 참조 원천.
export const PALETTE = {
  // Primary (aqua ladder)
  primary:       A[40], // #0C97B7 — 대표 (★)
  primaryLight:  A[60], // #42BED6 — hover-light (이전 primary 재활용)
  primaryDark:   A[20], // #07697F — hover/active · shadow tint 베이스
  primarySoft:   A[93], // #EAF9FB — 활성 메뉴/뱃지 배경
  primaryBorder: A[85], // #C8EFF6 — 뱃지/카드 보더

  // 부가 semantic (A시안 base — 향후 Figma 팔레트 확장 시 atomic 로 이동)
  secondary:     '#9DB4D4',
  success:       '#86C7A8',
  warning:       '#E6C079',
  error:         '#E0989A',
  info:          '#8FC4D4',

  // 텍스트 (A시안)
  textPrimary:   '#1A2330', // 본문
  textSecondary: '#6B7280', // 서브
  textMuted:     '#9AA3AF', // eyebrow / caption

  // 배경 · 보더 (A시안)
  bgDefault:     '#F6F7F9', // main 배경 (옅은 슬레이트)
  panelBorder:   '#E8E8E8', // 패널 보더

  // Sidebar — aqua teal 배경 + 흰 텍스트/아이콘. 비활성 row 는 opacity 0.8
  sidebarBg:           A[40],
  sidebarActive:       'rgba(255,255,255,0.24)',  // 흰 24% 오버레이 (aqua-40 위 밝은 청록)
  sidebarOnBg:         '#FFFFFF',
  sidebarHeaderBorder: A[50],

  // Tab Header — 회색 스트립 + 활성 탭 흰 배경
  headerBg:          '#F2F2F2',
  headerActiveTabBg: '#FFFFFF',
  headerTextActive:  '#222222',
  headerTextMuted:   '#999999',
  headerIconActive:  A[40],
  headerIconMuted:   '#444444',
  headerCloseIcon:   '#B2B2B2',
};

// -----------------------------------------------------------------------------
// colorToken — createTheme 팔레트 등록 시 wingui theme.js 와 동일한 매핑 형태 제공.
// 향후 다크모드/테마 스위처 도입 시 여기서 분기.
// -----------------------------------------------------------------------------
const TOKEN_MAP = {
  primary: {
    main:   PALETTE.primary,
    light:  PALETTE.primaryLight,
    dark:   PALETTE.primaryDark,
    soft:   PALETTE.primarySoft,
    border: PALETTE.primaryBorder,
  },
  secondary: {
    main:  PALETTE.secondary,
    light: '#C4D2E6',
    dark:  '#6F87AA',
  },
  success: { main: PALETTE.success, light: '#B5DEC8', dark: '#5E9E81' },
  warning: { main: PALETTE.warning, light: '#F0D6A4', dark: '#C49C53' },
  error:   { main: PALETTE.error,   light: '#EDBEBF', dark: '#C0696B' },
  info:    { main: PALETTE.info,    light: '#BBDEE7', dark: '#6BA0B0' },
  text: {
    primary:   PALETTE.textPrimary,
    secondary: PALETTE.textSecondary,
    muted:     PALETTE.textMuted,
    disabled:  '#A6B2C4',
  },
  bg: {
    default: PALETTE.bgDefault,
  },
  panel: {
    border: PALETTE.panelBorder,
  },
  sidebar: {
    bg:           PALETTE.sidebarBg,
    active:       PALETTE.sidebarActive,
    onBg:         PALETTE.sidebarOnBg,
    headerBorder: PALETTE.sidebarHeaderBorder,
  },
  header: {
    bg:          PALETTE.headerBg,
    activeTabBg: PALETTE.headerActiveTabBg,
    textActive:  PALETTE.headerTextActive,
    textMuted:   PALETTE.headerTextMuted,
    iconActive:  PALETTE.headerIconActive,
    iconMuted:   PALETTE.headerIconMuted,
    closeIcon:   PALETTE.headerCloseIcon,
  },
};

export function colorToken(category, key) {
  const bucket = TOKEN_MAP[category];
  return bucket ? bucket[key] : undefined;
}

// -----------------------------------------------------------------------------
// paletteVariables — Figma 정본 네이밍(`palette-*`) 의 CSS custom property dict.
// registerCssVariables() 가 :root 에 세팅한다.
// 화면에서 var(--palette-primary) · var(--palette-text-muted) 형태로 참조 가능.
// -----------------------------------------------------------------------------
export const paletteVariables = {
  '--palette-primary':        PALETTE.primary,
  '--palette-primary-light':  PALETTE.primaryLight,
  '--palette-primary-dark':   PALETTE.primaryDark,
  '--palette-primary-soft':   PALETTE.primarySoft,
  '--palette-primary-border': PALETTE.primaryBorder,
  '--palette-secondary':      PALETTE.secondary,
  '--palette-success':        PALETTE.success,
  '--palette-warning':        PALETTE.warning,
  '--palette-error':          PALETTE.error,
  '--palette-info':           PALETTE.info,
  '--palette-text-primary':   PALETTE.textPrimary,
  '--palette-text-secondary': PALETTE.textSecondary,
  '--palette-text-muted':     PALETTE.textMuted,
  '--palette-bg-default':     PALETTE.bgDefault,
  '--palette-panel-border':   PALETTE.panelBorder,

  // Sidebar
  '--palette-sidebar-bg':            PALETTE.sidebarBg,
  '--palette-sidebar-active':        PALETTE.sidebarActive,
  '--palette-sidebar-on-bg':         PALETTE.sidebarOnBg,
  '--palette-sidebar-header-border': PALETTE.sidebarHeaderBorder,

  // Tab Header
  '--palette-header-bg':             PALETTE.headerBg,
  '--palette-header-active-tab-bg':  PALETTE.headerActiveTabBg,
  '--palette-header-text-active':    PALETTE.headerTextActive,
  '--palette-header-text-muted':     PALETTE.headerTextMuted,
  '--palette-header-icon-active':    PALETTE.headerIconActive,
  '--palette-header-icon-muted':     PALETTE.headerIconMuted,
  '--palette-header-close-icon':     PALETTE.headerCloseIcon,
};

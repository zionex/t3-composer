// =============================================================================
// typography — Figma "T3Composer 디자인 가이드 v1.0" 정본 (Pretendard JP · 13단계 scale)
//
// - Pretendard JP Variable font 는 frontend/public/fonts/PretendardJPVariable.woff2 로
//   self-host. 한국어+일본어+라틴 superset 이라 이 하나로 weight 400/500/600 커버.
//   theme.js 의 MuiCssBaseline `@font-face` 에서 등록.
// - Pretendard JP 파일이 없어도 fallback chain(Pretendard/Noto Sans KR/…) 이 자동 대체.
// - MUI 기본 slot (h4/h5/body2 등) 은 회귀 방지 위해 theme.js 에서 그대로 유지.
//   신규 컴포넌트만 `sx={{ ...TYPOGRAPHY.title2 }}` 방식으로 점진 채용.
// - line-height 는 기본 120% (1.2). caption 만 100% (1.0) — tight.
// - letter-spacing 은 title 만 음수 (Figma 정본).
// =============================================================================

export const FONT_FAMILY =
  '"Pretendard JP","Pretendard","Noto Sans KR","Malgun Gothic","맑은 고딕",' +
  '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif';

export const TYPOGRAPHY = {
  fontFamily: FONT_FAMILY,
  // Title — 페이지·섹션·카드 제목 (Bold 600, negative letter-spacing)
  title1:   { fontFamily: FONT_FAMILY, fontSize: 24, lineHeight: 1.2, letterSpacing: '-0.48px', fontWeight: 600 },
  title2:   { fontFamily: FONT_FAMILY, fontSize: 20, lineHeight: 1.2, letterSpacing: '-0.4px',  fontWeight: 600 },
  title3:   { fontFamily: FONT_FAMILY, fontSize: 16, lineHeight: 1.2, letterSpacing: '-0.32px', fontWeight: 600 },
  // Body — 본문 (Regular 400)
  body1:    { fontFamily: FONT_FAMILY, fontSize: 18, lineHeight: 1.2, fontWeight: 400 },
  body2:    { fontFamily: FONT_FAMILY, fontSize: 16, lineHeight: 1.2, fontWeight: 400 },
  body3:    { fontFamily: FONT_FAMILY, fontSize: 14, lineHeight: 1.2, fontWeight: 400 },
  body4:    { fontFamily: FONT_FAMILY, fontSize: 13, lineHeight: 1.2, fontWeight: 400 },
  body5:    { fontFamily: FONT_FAMILY, fontSize: 12, lineHeight: 1.2, fontWeight: 400 },
  // Label — 버튼·필드 라벨 (Medium 500)
  label1:   { fontFamily: FONT_FAMILY, fontSize: 14, lineHeight: 1.2, fontWeight: 500 },
  label2:   { fontFamily: FONT_FAMILY, fontSize: 13, lineHeight: 1.2, fontWeight: 500 },
  label3:   { fontFamily: FONT_FAMILY, fontSize: 12, lineHeight: 1.2, fontWeight: 500 },
  // Caption — 캡션·메타 (line-height 100%, tight)
  caption1: { fontFamily: FONT_FAMILY, fontSize: 13, lineHeight: 1.0, fontWeight: 400 },
  caption2: { fontFamily: FONT_FAMILY, fontSize: 12, lineHeight: 1.0, fontWeight: 400 },
};

// -----------------------------------------------------------------------------
// typographyVariables — Figma 정본 네이밍(`Title-1` · `Body-3` · `Label-2` · `Caption-1`)
// 의 CSS custom property dict. registerCssVariables() 가 :root 에 세팅한다.
//
// 화면 CSS 에서 개별 축(size/line-height/letter-spacing/font-weight) 을 자유롭게 조합:
//   font-size: var(--typography-title-1-size);
//   line-height: var(--typography-title-1-line-height);
//   letter-spacing: var(--typography-title-1-letter-spacing);
//   font-weight: var(--typography-title-1-font-weight);
//
// 폰트 패밀리는 공용 --typography-font-family 하나 (Pretendard JP fallback chain).
// -----------------------------------------------------------------------------
export const typographyVariables = {
  '--typography-font-family': FONT_FAMILY,

  // Title
  '--typography-title-1-size':           '24px',
  '--typography-title-1-line-height':    '1.2',
  '--typography-title-1-letter-spacing': '-0.48px',
  '--typography-title-1-font-weight':    600,
  '--typography-title-2-size':           '20px',
  '--typography-title-2-line-height':    '1.2',
  '--typography-title-2-letter-spacing': '-0.4px',
  '--typography-title-2-font-weight':    600,
  '--typography-title-3-size':           '16px',
  '--typography-title-3-line-height':    '1.2',
  '--typography-title-3-letter-spacing': '-0.32px',
  '--typography-title-3-font-weight':    600,

  // Body
  '--typography-body-1-size':        '18px',
  '--typography-body-1-line-height': '1.2',
  '--typography-body-1-font-weight': 400,
  '--typography-body-2-size':        '16px',
  '--typography-body-2-line-height': '1.2',
  '--typography-body-2-font-weight': 400,
  '--typography-body-3-size':        '14px',
  '--typography-body-3-line-height': '1.2',
  '--typography-body-3-font-weight': 400,
  '--typography-body-4-size':        '13px',
  '--typography-body-4-line-height': '1.2',
  '--typography-body-4-font-weight': 400,
  '--typography-body-5-size':        '12px',
  '--typography-body-5-line-height': '1.2',
  '--typography-body-5-font-weight': 400,

  // Label
  '--typography-label-1-size':        '14px',
  '--typography-label-1-line-height': '1.2',
  '--typography-label-1-font-weight': 500,
  '--typography-label-2-size':        '13px',
  '--typography-label-2-line-height': '1.2',
  '--typography-label-2-font-weight': 500,
  '--typography-label-3-size':        '12px',
  '--typography-label-3-line-height': '1.2',
  '--typography-label-3-font-weight': 500,

  // Caption (line-height 100%)
  '--typography-caption-1-size':        '13px',
  '--typography-caption-1-line-height': '1.0',
  '--typography-caption-1-font-weight': 400,
  '--typography-caption-2-size':        '12px',
  '--typography-caption-2-line-height': '1.0',
  '--typography-caption-2-font-weight': 400,
};

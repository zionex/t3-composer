// =============================================================================
// PageHeader — 모든 메뉴(Composer · History · Mockup · UI Pattern · Ontology) 공통 .tb 헤더.
//
// Props:
//   title    string      좌측 큰 텍스트 (16px / 700)
//   icon     string|Comp title 좌측 아이콘 (옵션) · SVG URL(string) 또는 React 컴포넌트
//   badge    string      title 옆 작은 뱃지 라벨 (옵션, 예: 'AI')
//   caption  string      뱃지 또는 title 옆 짧은 설명 (12px · muted)
//   right    React       우측 영역 — chip 들 또는 actions
// =============================================================================
import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { PALETTE, TYPOGRAPHY } from '../../../theme';
import { FONT_FAMILY } from '../../../style/typography';
import SvgIcon from '../../../style/SvgIcon';

const TEAL          = PALETTE.primary;
const TEAL_SOFT     = PALETTE.primarySoft;
const TEAL_BORDER   = PALETTE.primaryBorder;
const TXT_MUTED     = PALETTE.textMuted;

export default function PageHeader({ title, icon, badge, caption, right }) {
  return (
    <Box sx={{
      flex: '0 0 auto',
      height: 48,
      px: '16px',
      bgcolor: '#FFFFFF',
      borderBottom: '1px solid #E8E8E8',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {icon && (typeof icon === 'string'
            ? <SvgIcon src={icon} size={22} color={PALETTE.headerIconActive} />
            : React.createElement(icon, { sx: { fontSize: 22, color: PALETTE.headerIconActive } })
          )}
          <Typography sx={{
            fontFamily: FONT_FAMILY,
            fontSize: 16, fontWeight: 700,
            lineHeight: 'normal',
            color: '#222',
          }}>
            {title}
          </Typography>
        </Box>
        {badge && (
          <Box sx={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
            color: TEAL, bgcolor: TEAL_SOFT,
            border: `1px solid ${TEAL_BORDER}`,
            px: 0.7, py: '2px', borderRadius: '5px',
            lineHeight: 1.2,
          }}>
            {badge}
          </Box>
        )}
        {caption && (
          <Typography sx={{
            ...TYPOGRAPHY.body5, color: TXT_MUTED, lineHeight: 'normal',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {caption}
          </Typography>
        )}
      </Stack>

      {right && (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
          {right}
        </Stack>
      )}
    </Box>
  );
}

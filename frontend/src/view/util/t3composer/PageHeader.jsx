// =============================================================================
// PageHeader — Composer/History/Mockup/UI Pattern/Ontology 메뉴 + 모든 sub-view 공통 헤더.
//
// Props:
//   title      string       좌측 큰 텍스트 (16px / 700). 옵션
//   icon       string|Comp  title 좌측 아이콘 (SVG URL string 또는 React 컴포넌트). 옵션
//   iconColor  string       아이콘 색 override (기본 PALETTE.headerIconActive)
//   badge      string       title 옆 작은 뱃지 라벨 (옵션, 예: 'AI')
//   caption    string       뱃지/title 옆 짧은 설명 (12px · muted)
//   onBack     () => void   있으면 좌측 아쿠아 IconButton 렌더 (sub-view 헤더용)
//   backLabel  string       뒤로가기 버튼 aria-label
//   children   React        title 그룹 뒤 자유 트레일링 슬롯 (breadcrumb chip / secondary text 등)
//   right      React        우측 영역 (chip / actions)
//   noBorder   boolean      border-bottom 을 렌더하지 않음. 부모가 Collapse 등으로 border 를 제어할 때 사용
// =============================================================================
import React from 'react';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { PALETTE, TYPOGRAPHY } from '../../../theme';
import { FONT_FAMILY } from '../../../style/typography';
import SvgIcon from '../../../style/SvgIcon';

const TEAL          = PALETTE.primary;
const TEAL_SOFT     = PALETTE.primarySoft;
const TEAL_BORDER   = PALETTE.primaryBorder;
const TXT_MUTED     = PALETTE.textMuted;

export default function PageHeader({
  title,
  icon,
  iconColor,
  badge,
  caption,
  onBack,
  backLabel,
  children,
  right,
  noBorder = false,
}) {
  const finalIconColor = iconColor || PALETTE.headerIconActive;
  const iconSize = onBack ? 20 : 22;
  return (
    <Box sx={{
      flex: '0 0 auto',
      height: 48,
      px: '16px',
      bgcolor: '#FFFFFF',
      borderBottom: noBorder ? 'none' : '1px solid #E8E8E8',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        {onBack && (
          <IconButton
            onClick={onBack}
            aria-label={backLabel}
            disableRipple
            sx={{
              p: 1,
              bgcolor: '#f2fcfd',
              borderRadius: '6px',
              '&:hover': { bgcolor: '#DDF6FA' },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 16, color: '#0a88ab' }} />
          </IconButton>
        )}
        <Stack direction="row" alignItems="center" spacing={0.75}>
          {icon && (typeof icon === 'string'
            ? <SvgIcon src={icon} size={iconSize} color={finalIconColor} />
            : React.createElement(icon, { sx: { fontSize: iconSize, color: finalIconColor } })
          )}
          {title && (
            <Typography sx={{
              fontFamily: FONT_FAMILY,
              fontSize: 16, fontWeight: 700,
              lineHeight: 'normal',
              color: '#222',
              whiteSpace: 'nowrap',
            }}>
              {title}
            </Typography>
          )}
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
          {children}
        </Stack>
      </Stack>

      {right && (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
          {right}
        </Stack>
      )}
    </Box>
  );
}

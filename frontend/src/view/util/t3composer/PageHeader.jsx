// =============================================================================
// PageHeader — 모든 메뉴(Composer · History · Mockup · UI Pattern · Ontology) 공통 .tb 헤더.
// A시안 디자인 (height 44 · bg #FFFFFF · borderBottom #ECEEF1 · px 18px).
//
// Props:
//   title    string  좌측 큰 텍스트 (15px / 700)
//   badge    string  title 옆 작은 모노 폰트 뱃지 라벨 (옵션, 예: 'AI')
//   caption  string  뱃지 또는 title 옆 짧은 설명 (12px · #9AA3AF)
//   right    React   우측 영역 — chip 들 또는 actions
// =============================================================================
import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { PALETTE } from '../../../theme';

const TEAL          = PALETTE.primary;
const TEAL_SOFT     = PALETTE.primarySoft;
const TEAL_BORDER   = PALETTE.primaryBorder;
const PANEL_BORDER  = PALETTE.panelBorder;
const TXT_PRIMARY   = PALETTE.textPrimary;
const TXT_MUTED     = PALETTE.textMuted;

export default function PageHeader({ title, badge, caption, right }) {
  return (
    <Box sx={{
      flex: '0 0 auto',
      height: 44,
      px: '18px',
      bgcolor: '#FFFFFF',
      borderBottom: `1px solid ${PANEL_BORDER}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography sx={{
          fontSize: 15, fontWeight: 700, color: TXT_PRIMARY,
          lineHeight: 1.2,
        }}>
          {title}
        </Typography>
        {badge && (
          <Box sx={{
            fontFamily: '"JetBrains Mono","Roboto Mono",monospace',
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
            fontSize: 12, color: TXT_MUTED,
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

import React from 'react';
import { Box, Chip, Typography, Stack } from '@mui/material';
import { ContentInner } from '@wingui/common/imports';

/**
 * T3Mockup 의 공통 헤더 + ContentInner 래퍼.
 *
 * 모든 목업 화면은 이 컴포넌트를 최상위로 사용한다.
 *
 * Props:
 *   patternCode    — 'search_grid' 등 분류기/DB 시드 코드
 *   patternLabel   — 인간 친화 라벨 (예: 'P02 검색 + 그리드')
 *   layoutCategory — 'LAYOUT_SINGLE' 등
 *   description    — 1줄 패턴 설명
 *   children       — 본 mockup body
 *
 * Notes:
 *   - static viewer (인터랙션 없음)
 *   - 더미 데이터만 표시
 *   - 'mock' 워터마크는 헤더의 'MOCKUP' Chip 으로 대체
 */
export default function MockShell({ patternCode, patternLabel, layoutCategory, description, children }) {
  const layoutColorMap = {
    LAYOUT_SINGLE:        'primary',
    LAYOUT_V2:            'info',
    LAYOUT_V3:            'info',
    LAYOUT_V4:            'info',
    LAYOUT_H2:            'success',
    LAYOUT_H3:            'success',
    LAYOUT_MIXED:         'warning',
    LAYOUT_DASHBOARD:     'info',
    LAYOUT_CONTROLBOARD:  'secondary',
    LAYOUT_PLANEDIT:      'success',
    LAYOUT_MONITORING:    'info',
    LAYOUT_ROUTELAYOUT:   'warning',
    POPUP:                'default',
    WIDGET:               'default',
    SUBCOMPONENT:         'default',
    BASE:                 'default',
  };
  const layoutColor = layoutColorMap[layoutCategory] || 'default';

  return (
    <ContentInner>
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.default' }}>
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
          <Chip label="MOCKUP" size="small" color="warning" sx={{ fontWeight: 700 }} />
          <Chip label={patternCode} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
          <Chip label={layoutCategory} size="small" color={layoutColor} variant="outlined" />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{patternLabel}</Typography>
        </Stack>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {description}
          </Typography>
        )}
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {children}
      </Box>
    </ContentInner>
  );
}

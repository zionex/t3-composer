import React from 'react';
import { Box, Chip } from '@mui/material';

import { ChartPreview, DEFAULT_PALETTE } from '../dashboardbuilder/dialogs/WidgetSettingsDialog';

export default function WidgetThumbnail({
  type,
  height = 88,
  scale = 1.9,
  marginBottom = 1,
  showTypeLabel = false,
}) {
  const normalized = type || 'widget';

  return (
    <Box
      sx={{
        height,
        borderRadius: '8px',
        border: '1px solid #e5eaf2',
        bgcolor: '#f8fafc',
        position: 'relative',
        mb: marginBottom,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ transform: `scale(${scale})`, transformOrigin: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ChartPreview type={normalized} colors={DEFAULT_PALETTE} />
      </Box>
      {showTypeLabel && (
        <Chip
          size="small"
          label={normalized}
          sx={{ position: 'absolute', right: 8, top: 8, height: 20, borderRadius: '6px', bgcolor: '#fff', color: '#2563eb', fontSize: 10, fontWeight: 800 }}
        />
      )}
    </Box>
  );
}

import React, { useMemo } from 'react';
import { Box, Stack, Typography, Chip } from '@mui/material';
import { MOCKUP_ENTRIES } from '../t3mockup';

// Layer type → color group. Real MOCKUP_ENTRIES types observed:
//   CHART / CHART_BAR / CHART_DONUT / CHART_LINE / KPI_CARD / DIAGRAM_* / GRID / GRID_BASE /
//   GRID_CROSSTAB / GRID_PIVOT / GRID_TREE / STEPPER.
// AI may use any of these or invent close variants — match by prefix and fall back to OTHER.
function classifyType(t) {
  if (!t || typeof t !== 'string') return 'OTHER';
  const up = t.toUpperCase();
  if (up.startsWith('KPI'))     return 'KPI';
  if (up.startsWith('CHART'))   return 'CHART';
  if (up.startsWith('GRID'))    return 'GRID';
  if (up.startsWith('DIAGRAM')) return 'DIAGRAM';
  if (up.startsWith('FORM'))    return 'FORM';
  if (up.startsWith('STEPPER')) return 'STEPPER';
  return 'OTHER';
}

const TYPE_COLOR = {
  KPI:     { bg: '#dbeafe', border: '#60a5fa' },
  CHART:   { bg: '#fef3c7', border: '#f59e0b' },
  GRID:    { bg: '#d1fae5', border: '#10b981' },
  DIAGRAM: { bg: '#fce7f3', border: '#ec4899' },
  FORM:    { bg: '#ede9fe', border: '#8b5cf6' },
  STEPPER: { bg: '#e0f2fe', border: '#0ea5e9' },
  OTHER:   { bg: '#f1f5f9', border: '#94a3b8' },
};

/**
 * 12-column wireframe preview for a synthesized mockup.
 * Renders each layer as an absolutely-positioned box with a type chip,
 * the layer's title, and the source mockup's label.
 *
 * Props:
 *   layers — Array<{key, title, type, position:{x,y,w,h}, sourceMockupCode}>
 */
export default function SynthesizedMockupPreview({ layers }) {
  const codeToEntry = useMemo(() => {
    const m = new Map();
    for (const e of MOCKUP_ENTRIES) m.set(e.patternCode, e);
    return m;
  }, []);

  if (!Array.isArray(layers) || layers.length === 0) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex',
                 alignItems: 'center', justifyContent: 'center',
                 color: '#94a3b8', fontSize: 11 }}>
        (layer 정보 없음)
      </Box>
    );
  }

  const maxY = layers.reduce((acc, l) => {
    const y = (l.position?.y || 0) + (l.position?.h || 1);
    return Math.max(acc, y);
  }, 1);
  const rows = Math.max(8, maxY);
  const cellW = 100 / 12;
  const cellH = 100 / rows;

  return (
    <Box sx={{
      position: 'relative', width: '100%', height: '100%',
      bgcolor: '#fafafa', overflow: 'hidden',
      backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
      backgroundSize: `${cellW}% ${cellH}%`,
    }}>
      {layers.map((l, i) => {
        const pos = l.position || { x: 0, y: 0, w: 12, h: 1 };
        const src = codeToEntry.get(l.sourceMockupCode);
        const klass = classifyType(l.type);
        const color = TYPE_COLOR[klass];
        return (
          <Box key={l.key || `layer-${i}`} sx={{
            position: 'absolute',
            left:   `${(pos.x || 0) * cellW}%`,
            top:    `${(pos.y || 0) * cellH}%`,
            width:  `${(pos.w || 1) * cellW}%`,
            height: `${(pos.h || 1) * cellH}%`,
            bgcolor: color.bg,
            border: `1.5px dashed ${color.border}`,
            p: 0.5,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}>
            <Stack direction="row" spacing={0.4} alignItems="center" sx={{ minWidth: 0 }}>
              <Chip size="small" label={String(l.type || 'OTHER').replace(/_/g, ' ')}
                    sx={{ height: 14, fontSize: 8, fontWeight: 700,
                          bgcolor: color.border, color: '#fff', '& .MuiChip-label': { px: 0.5 } }} />
              <Typography noWrap sx={{ fontSize: 9, fontWeight: 700, color: '#334155', lineHeight: 1.1 }}>
                {l.title}
              </Typography>
            </Stack>
            {(src || l.sourceMockupCode) && (
              <Typography noWrap sx={{ fontSize: 7.5, color: '#64748b', fontStyle: 'italic' }}>
                from: {src ? (src.patternLabel || src.patternCode) : l.sourceMockupCode}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

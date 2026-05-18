import React from 'react';
import { Box, Stack, Typography, Chip } from '@mui/material';

/**
 * ControlBoard 의 라이브 로그 패널.
 *
 * Props:
 *   lines  — [{ time, level: 'INFO'|'WARN'|'ERROR'|'DEBUG', message }]
 *   height — px (default 240)
 */
export default function CbLogPane({ lines = [], height = 240, title = '엔진 실행 로그' }) {
  return (
    <Box sx={{ bgcolor: '#0f1219', color: '#ebedf2', borderRadius: 1, overflow: 'hidden' }}>
      <Stack direction="row" alignItems="center" sx={{ px: 1.5, py: 0.75, borderBottom: '1px solid #2f374e', bgcolor: '#171b26' }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{title}</Typography>
        <Chip size="small" label="LIVE" color="error" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
      </Stack>
      <Box sx={{ height, overflow: 'auto', p: 1, fontFamily: 'monospace', fontSize: 11.5 }}>
        {lines.map((l, i) => {
          const color =
            l.level === 'ERROR' ? '#ef4444' :
            l.level === 'WARN'  ? '#f59e0b' :
            l.level === 'DEBUG' ? '#94a3b8' :
            '#10b981';
          return (
            <Stack key={i} direction="row" spacing={1} sx={{ mb: 0.25 }}>
              <Typography sx={{ color: '#626f8d', fontSize: 11, minWidth: 64 }}>{l.time}</Typography>
              <Typography sx={{ color, fontSize: 10, fontWeight: 700, minWidth: 44 }}>[{l.level}]</Typography>
              <Typography sx={{ color: '#ebedf2', fontSize: 11, flex: 1, whiteSpace: 'pre-wrap' }}>{l.message}</Typography>
            </Stack>
          );
        })}
      </Box>
    </Box>
  );
}

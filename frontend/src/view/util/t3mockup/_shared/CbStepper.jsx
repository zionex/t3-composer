import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RotateRightIcon from '@mui/icons-material/RotateRight';

/**
 * ControlBoard 의 단계 진행 표시기.
 *
 * Props:
 *   steps  — [{ label, status: 'done' | 'running' | 'pending' | 'failed' }]
 *   compact — 작은 폭에 들어갈 때 가로 간격 축소
 */
export default function CbStepper({ steps, compact = false }) {
  return (
    <Stack direction="row" alignItems="center" spacing={compact ? 0.5 : 1.5}>
      {steps.map((s, i) => {
        const isLast = i === steps.length - 1;
        const StatusIcon =
          s.status === 'done' ? CheckCircleIcon :
          s.status === 'running' ? RotateRightIcon :
          s.status === 'failed' ? CheckCircleIcon :
          RadioButtonUncheckedIcon;
        const color =
          s.status === 'done' ? 'success.main' :
          s.status === 'running' ? 'primary.main' :
          s.status === 'failed' ? 'error.main' :
          'text.disabled';
        return (
          <React.Fragment key={s.label + i}>
            <Stack alignItems="center" spacing={0.3} sx={{ minWidth: compact ? 60 : 80 }}>
              <StatusIcon
                sx={{
                  color,
                  fontSize: compact ? 22 : 28,
                  animation: s.status === 'running' ? 'spin 2s linear infinite' : 'none',
                  '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
                }}
              />
              <Typography variant="caption" sx={{ fontSize: compact ? 10 : 11, fontWeight: 500, textAlign: 'center', color: s.status === 'pending' ? 'text.disabled' : 'text.primary' }}>
                {s.label}
              </Typography>
              {s.detail && (
                <Typography variant="caption" sx={{ fontSize: 9, color: 'text.secondary' }}>{s.detail}</Typography>
              )}
            </Stack>
            {!isLast && (
              <Box
                sx={{
                  flex: 1, height: 2, borderRadius: 1,
                  bgcolor: s.status === 'done' ? 'success.main' : 'grey.200',
                  minWidth: compact ? 16 : 30, mb: compact ? 1.5 : 2,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </Stack>
  );
}

import React from 'react';
import { Box, Typography } from '@mui/material';

function fmtValue(value, format) {
  const n = Number(value);
  if (isNaN(n)) return String(value ?? '');
  if (format === 'compact') return (n / 1e8).toFixed(1) + '억';
  if (format === 'integer') return Math.round(n).toLocaleString();
  if (format === 'percent') return (n * 100).toFixed(1) + '%';
  if (format === 'currency') return '₩' + n.toLocaleString();
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function KpiRenderer({ data, config }) {
  const fields = new Set(Object.keys(data?.[0] ?? {}));
  if (!config?.valueField || !fields.has(config.valueField)) {
    return <Box sx={{ height: '100%' }} />;
  }

  const row = config.filterCategory
    ? (data.find((r) => r.CATEGORY1 === config.filterCategory) ?? data[0])
    : data[0];

  const value = row?.[config.valueField] ?? 0;
  const delta = config.deltaField != null && fields.has(config.deltaField) ? row?.[config.deltaField] : null;
  const accentMain = config.accentColor?.[0] ?? '#2196f3';
  const accentLight = config.accentColor?.[1] ?? '#e3f2fd';

  return (
    <Box
      sx={{
        height: '100%',
        px: 2,
        py: 1.5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 0.5,
        borderLeft: `4px solid ${accentMain}`,
        backgroundColor: accentLight,
        borderRadius: '6px',
      }}
    >
      {config.unit ? (
        <Typography sx={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{config.unit}</Typography>
      ) : null}
      <Typography sx={{ fontSize: 30, lineHeight: 1.1, fontWeight: 800, color: '#111827' }}>
        {fmtValue(value, config.format)}
      </Typography>
      {delta != null && (
        <Typography
          sx={{ fontSize: 13, fontWeight: 700, color: Number(delta) >= 0 ? '#059669' : '#dc2626' }}
        >
          {Number(delta) >= 0 ? '+' : ''}{fmtValue(delta, config.format)}
        </Typography>
      )}
    </Box>
  );
}

export default KpiRenderer;

import React from 'react';
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

const FIELD_SX = {
  '& .MuiInputBase-root': { fontSize: 12 },
  '& .MuiInputLabel-root': { fontSize: 12 },
};

const SOURCE_TYPE_LABELS = {
  TABLE: 'TABLE',
  VIEW: 'VIEW',
};

function normalizeSourceType(type) {
  if (type === 'TABLE') return 'TABLE';
  if (type === 'VIEW') return 'VIEW';
  return 'TABLE';
}

function sourceTypeLabel(type) {
  return SOURCE_TYPE_LABELS[type] ?? SOURCE_TYPE_LABELS[normalizeSourceType(type)] ?? 'TABLE';
}

function sourceTypeColor(type) {
  if (type === 'TABLE') return { bg: '#fef3c7', color: '#d97706' };
  if (type === 'VIEW') return { bg: '#dcfce7', color: '#059669' };
  return { bg: '#fef3c7', color: '#d97706' };
}

function Section({ icon, title, children, right }) {
  return (
    <Box sx={{ border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: '#fff', overflow: 'hidden' }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{ px: 1.5, py: 1, borderBottom: '1px solid #edf2f7', bgcolor: '#f8fafc' }}
      >
        <Stack direction="row" alignItems="center" spacing={0.75}>
          {icon}
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>{title}</Typography>
        </Stack>
        {right}
      </Stack>
      <Box sx={{ p: 1.5 }}>{children}</Box>
    </Box>
  );
}

function SourceTypeChip({ type }) {
  const color = sourceTypeColor(type);
  return (
    <Chip
      size="small"
      label={sourceTypeLabel(type)}
      sx={{
        height: 20,
        fontSize: 10,
        fontWeight: 800,
        borderRadius: '6px',
        bgcolor: color.bg,
        color: color.color,
      }}
    />
  );
}

function SmallCountChip({ label, color = '#2563eb' }) {
  return (
    <Chip
      size="small"
      label={label}
      sx={{
        height: 20,
        fontSize: 10,
        fontWeight: 800,
        borderRadius: '10px',
        bgcolor: `${color}18`,
        color,
      }}
    />
  );
}

function ColumnSelect({ label, value, columns, onChange, sx }) {
  return (
    <TextField
      select
      size="small"
      label={label}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
      sx={{ ...FIELD_SX, ...sx }}
    >
      <MenuItem value=""><em>선택</em></MenuItem>
      {columns.map((column) => (
        <MenuItem key={column} value={column} sx={{ fontSize: 12 }}>
          {column}
        </MenuItem>
      ))}
    </TextField>
  );
}

function MultiColumnSelect({ label, value = [], columns, onChange }) {
  return (
    <FormControl size="small" fullWidth>
      <InputLabel sx={{ fontSize: 12 }}>{label}</InputLabel>
      <Select
        multiple
        value={value}
        label={label}
        input={<OutlinedInput label={label} />}
        onChange={(event) => onChange(event.target.value)}
        renderValue={(selected) => (
          selected.length ? (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {selected.map((item) => <Chip key={item} label={item} size="small" sx={{ height: 20, fontSize: 10 }} />)}
            </Box>
          ) : (
            <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>컬럼 선택</Typography>
          )
        )}
        sx={{ fontSize: 12 }}
      >
        {columns.map((column) => (
          <MenuItem key={column} value={column} sx={{ fontSize: 12 }}>
            {column}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export { FIELD_SX, Section, SourceTypeChip, SmallCountChip, ColumnSelect, MultiColumnSelect };

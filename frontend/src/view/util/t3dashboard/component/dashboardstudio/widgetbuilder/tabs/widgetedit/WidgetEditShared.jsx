import React from 'react';
import {
  Box,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  ListItemText,
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
  const selectedSet = React.useMemo(() => new Set(value), [value]);
  return (
    <FormControl size="small" fullWidth>
      <InputLabel sx={{ fontSize: 12 }}>{label}</InputLabel>
      <Select
        multiple
        value={value}
        label={label}
        input={<OutlinedInput label={label} />}
        onChange={(event) => {
          // MUI Select(multiple) 의 onChange value 는 토글된 후 결과 배열.
          // 다만 콤마 구분 문자열로 들어오는 케이스(autofill 등) 안전 처리.
          const next = event.target.value;
          onChange(Array.isArray(next) ? next : String(next).split(','));
        }}
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
        MenuProps={{
          PaperProps: { sx: { maxHeight: 360 } },
          // multiple 모드에서 항목 클릭 시 메뉴 자동 닫힘 방지(연속 체크 가능)
          autoFocus: false,
        }}
      >
        {columns.map((column) => (
          <MenuItem key={column} value={column} sx={{ fontSize: 12, py: 0.25 }} dense>
            <Checkbox
              size="small"
              checked={selectedSet.has(column)}
              sx={{ p: 0.5, mr: 0.5 }}
            />
            <ListItemText
              primary={column}
              primaryTypographyProps={{ sx: { fontSize: 12 } }}
            />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export { FIELD_SX, Section, SourceTypeChip, SmallCountChip, ColumnSelect, MultiColumnSelect };

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControl, IconButton, InputLabel, MenuItem, OutlinedInput,
  Select, Stack, TextField, Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import {
  parseWidgetSpec,
  toWidgetDataConfig,
  toWidgetVisualConfig,
} from '../../generic/widgetSpecAdapter';
import { defaultVisualConfig, FORMAT_OPTIONS as FORMAT_CHOICES } from '../../widgetbuilder/tabs/direct/steps/wizardConstants';

const TXT = {
  widgetSettings: '\uc704\uc82f \uc124\uc815',
  widgetTitle: '\uc704\uc82f \uc81c\ubaa9',
  dataSource: '\ub370\uc774\ud130 \uc18c\uc2a4',
  params: '\ud30c\ub77c\ubbf8\ud130',
  add: '\ucd94\uac00',
  noParams: '\uc124\uc815\ub41c \ud30c\ub77c\ubbf8\ud130\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.',
  name: '\uc774\ub984',
  value: '\uac12',
  shape: '\ubaa8\uc591',
  color: '\uc0c9\uc0c1',
  cancel: '\ucde8\uc18c',
  apply: '\uc801\uc6a9',
  xAxis: 'X\ucd95',
  yAxis: 'Y\ucd95',
  series: '\uc2dc\ub9ac\uc988',
  labelColumn: '\ub77c\ubca8 \uceec\ub7fc',
  valueColumn: '\uac12 \uceec\ub7fc',
  displayColumns: '\ud45c\uc2dc \uceec\ub7fc',
  deltaColumn: '\uc99d\uac10 \uceec\ub7fc',
  unit: '\ub2e8\uc704',
  format: '\ud3ec\ub9f7',
};

export const DEFAULT_PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const PALETTE_OPTIONS = [
  { name: 'Blue', colors: ['#3b82f6', '#60a5fa', '#1d4ed8', '#93c5fd'] },
  { name: 'Green', colors: ['#10b981', '#34d399', '#047857', '#a7f3d0'] },
  { name: 'Amber', colors: ['#f59e0b', '#fbbf24', '#b45309', '#fde68a'] },
  { name: 'Rose', colors: ['#ef4444', '#fb7185', '#be123c', '#fecdd3'] },
  { name: 'Violet', colors: ['#8b5cf6', '#a78bfa', '#6d28d9', '#ddd6fe'] },
  { name: 'Slate', colors: ['#334155', '#64748b', '#0f172a', '#cbd5e1'] },
];

const CHART_TYPE_OPTIONS = [
  { value: 'line', label: '\uc120\ud615' },
  { value: 'bar', label: '\ub9c9\ub300' },
  { value: 'bar_stacked', label: '\ub204\uc801 \ub9c9\ub300' },
  { value: 'bar_h', label: '\uac00\ub85c \ub9c9\ub300' },
  { value: 'area', label: '\uba74\uc801' },
  { value: 'bar_line', label: '\ubcf5\ud569' },
  { value: 'pie', label: '\ud30c\uc774' },
  { value: 'doughnut', label: '\ub3c4\ub11b' },
  { value: 'table', label: '\ud14c\uc774\ube14' },
  { value: 'kpi', label: 'KPI' },
];

const FORMAT_VALUE_OPTIONS = FORMAT_CHOICES.map((option) => option.value).filter(Boolean);
const SINGLE_Y_CHART_TYPES = new Set(['bar', 'bar_h']);
const MULTI_Y_CHART_TYPES = new Set(['bar_stacked', 'line', 'area']);

export function isSingleYChartType(type) {
  return SINGLE_Y_CHART_TYPES.has(type);
}

export function isMultiYChartType(type) {
  return MULTI_Y_CHART_TYPES.has(type);
}

function hasNumericValue(rows = [], column) {
  if (!rows.length) return true;
  const values = rows
    .map((row) => row?.[column])
    .filter((value) => value !== null && value !== undefined && value !== '');
  return values.length > 0 && values.every((value) => !Number.isNaN(Number(value)));
}

export function getNumericColumns(columns = [], rows = []) {
  return columns.filter((column) => hasNumericValue(rows, column));
}

function singleYFields(yFields = [], labels = []) {
  const fieldList = Array.isArray(yFields) ? yFields : [yFields];
  const labelList = Array.isArray(labels) ? labels : [labels];
  const firstField = fieldList.find(Boolean);
  if (!firstField) return { yFields: [], labels: [] };
  return { yFields: [firstField], labels: [labelList[0] || firstField] };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function getColumns(dataConfig, visualConfig) {
  const sample = dataConfig.fallbackData?.[0] ?? {};
  return unique([
    ...Object.keys(sample),
    visualConfig.xField,
    visualConfig.labelField,
    visualConfig.valueField,
    visualConfig.deltaField,
    ...(visualConfig.yFields ?? []),
    ...(visualConfig.series ?? []).map((s) => s.field),
    ...(visualConfig.columns ?? []).map((c) => c.field),
  ]);
}

function paramsToRows(params) {
  if (!params) return [];
  if (Array.isArray(params)) {
    return params.map((p, index) => ({
      id: `${p.key || p.paramName || p.name || index}`,
      key: (p.key || p.paramName || p.name || '').replace(/^@/, ''),
      value: p.testValue ?? p.value ?? p.defaultValue ?? '',
    })).filter((p) => p.key);
  }
  return Object.entries(params).map(([key, value]) => ({ id: key, key, value: value ?? '' }));
}

function rowsToParams(rows) {
  return rows.reduce((acc, row) => {
    const key = row.key.trim().replace(/^@/, '');
    if (key) acc[key] = row.value ?? '';
    return acc;
  }, {});
}

export function ensureVisualShape(type, previous) {
  const base = defaultVisualConfig(type);
  const next = { ...base, ...previous, type };
  if (isSingleYChartType(type)) {
    return { ...next, ...singleYFields(next.yFields, next.labels) };
  }
  return next;
}

function previewBars(colors) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 38 }}>
      {[20, 30, 16, 34].map((h, i) => (
        <Box
          key={i}
          sx={{ width: 10, height: h, bgcolor: colors[i % colors.length], borderRadius: '2px 2px 0 0' }}
        />
      ))}
    </Box>
  );
}

function previewLines(colors, fill = false) {
  return (
    <Box sx={{ position: 'relative', height: 38, width: 70 }}>
      {fill && (
        <Box sx={{
          position: 'absolute',
          left: 4,
          right: 4,
          bottom: 4,
          height: 22,
          background: `linear-gradient(180deg, ${colors[0]}55, ${colors[0]}08)`,
          clipPath: 'polygon(0 70%, 25% 35%, 50% 55%, 75% 20%, 100% 45%, 100% 100%, 0 100%)',
        }}
        />
      )}
      <Box sx={{
        position: 'absolute',
        left: 4,
        right: 4,
        top: 8,
        height: 24,
        borderTop: `3px solid ${colors[0]}`,
        transform: 'skewY(-12deg)',
      }}
      />
      <Box sx={{ position: 'absolute', left: 28, top: 11, width: 8, height: 8, borderRadius: '50%', bgcolor: colors[1] }} />
      <Box sx={{ position: 'absolute', right: 8, top: 5, width: 8, height: 8, borderRadius: '50%', bgcolor: colors[0] }} />
    </Box>
  );
}

function previewPie(colors, doughnut = false) {
  return (
    <Box sx={{
      width: 38,
      height: 38,
      borderRadius: '50%',
      background: `conic-gradient(${colors[0]} 0 40%, ${colors[1]} 40% 68%, ${colors[2]} 68% 84%, ${colors[3]} 84% 100%)`,
      position: 'relative',
    }}
    >
      {doughnut && <Box sx={{ position: 'absolute', inset: 10, bgcolor: 'background.paper', borderRadius: '50%' }} />}
    </Box>
  );
}

export function ChartPreview({ type, colors }) {
  if (type === 'line') return previewLines(colors);
  if (type === 'area') return previewLines(colors, true);
  if (type === 'bar' || type === 'bar_stacked') return previewBars(colors);
  if (type === 'bar_h') {
    return (
      <Stack spacing={0.5} sx={{ width: 70 }}>
        {[48, 62, 38, 56].map((w, i) => (
          <Box key={i} sx={{ width: w, height: 8, bgcolor: colors[i % colors.length], borderRadius: 1 }} />
        ))}
      </Stack>
    );
  }
  if (type === 'bar_line') {
    return (
      <Box sx={{ position: 'relative', width: 70, height: 38, overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', left: 2, bottom: 0, transform: 'scale(0.86)', transformOrigin: 'left bottom' }}>
          {previewBars(colors)}
        </Box>
        <Box sx={{ position: 'absolute', left: 14, top: 0, transform: 'scale(0.82)', transformOrigin: 'left top' }}>
          {previewLines(colors)}
        </Box>
      </Box>
    );
  }
  if (type === 'pie') return previewPie(colors);
  if (type === 'doughnut') return previewPie(colors, true);
  if (type === 'table') {
    return (
      <Box sx={{ width: 70 }}>
        {[0, 1, 2].map((row) => (
          <Box key={row} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0.25, mb: 0.25 }}>
            {[0, 1, 2].map((col) => (
              <Box key={col} sx={{ height: 7, bgcolor: row === 0 ? colors[0] : '#e2e8f0' }} />
            ))}
          </Box>
        ))}
      </Box>
    );
  }
  return (
    <Box sx={{ px: 1.2, py: 0.6, borderLeft: `4px solid ${colors[0]}`, bgcolor: `${colors[0]}18`, fontWeight: 800 }}>
      KPI
    </Box>
  );
}

export function ChartTypePicker({ value, palette, onChange, compact = false }) {
  const colors = palette?.length ? palette : DEFAULT_PALETTE;
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: compact ? 'repeat(auto-fit, minmax(96px, 1fr))' : 'repeat(5, minmax(0, 1fr))',
      gap: compact ? 0.75 : 1,
    }}>
      {CHART_TYPE_OPTIONS.map((type) => {
        const selected = type.value === value;
        return (
          <Box
            key={type.value}
            onClick={() => onChange(type.value)}
            sx={{
              height: compact ? 64 : 86,
              border: '1px solid',
              borderColor: selected ? 'primary.main' : 'divider',
              borderRadius: 1,
              bgcolor: selected ? 'rgba(25,118,210,0.08)' : 'background.paper',
              boxShadow: selected ? '0 0 0 2px rgba(25,118,210,0.18)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: compact ? 0.35 : 0.75,
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.light', bgcolor: 'action.hover' },
            }}
            >
            <Box sx={compact ? { transform: 'scale(0.82)', height: 34, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' } : undefined}>
              <ChartPreview type={type.value} colors={colors} />
            </Box>
            <Typography variant="caption" fontWeight={selected ? 700 : 500} sx={{ lineHeight: 1.15 }}>
              {type.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

export function PalettePicker({ value, onChange, compact = false }) {
  const palette = value?.length ? value : DEFAULT_PALETTE;
  const setColor = (index, color) => {
    const next = [...palette];
    next[index] = color;
    onChange(next);
  };

  return (
    <Stack spacing={compact ? 0.75 : 1}>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: compact ? 'repeat(auto-fit, minmax(92px, 1fr))' : 'repeat(6, minmax(0, 1fr))',
        gap: compact ? 0.75 : 1,
      }}>
        {PALETTE_OPTIONS.map((option) => {
          const selected = JSON.stringify(option.colors) === JSON.stringify(palette);
          return (
            <Box
              key={option.name}
              onClick={() => onChange(option.colors)}
              sx={{
                border: '1px solid',
                borderColor: selected ? 'primary.main' : 'divider',
                borderRadius: 1,
                p: compact ? 0.5 : 0.75,
                cursor: 'pointer',
                bgcolor: selected ? 'rgba(25,118,210,0.08)' : 'background.paper',
              }}
            >
              <Box sx={{ display: 'flex', height: compact ? 18 : 24, overflow: 'hidden', borderRadius: 0.5 }}>
                {option.colors.map((color) => <Box key={color} sx={{ flex: 1, bgcolor: color }} />)}
              </Box>
              <Typography variant="caption" sx={{ lineHeight: 1.2 }}>{option.name}</Typography>
            </Box>
          );
        })}
      </Box>
      <Stack direction="row" spacing={compact ? 0.75 : 1} flexWrap="wrap" useFlexGap>
        {palette.slice(0, 4).map((color, index) => (
          <TextField
            key={index}
            size="small"
            label={`Color ${index + 1}`}
            type="color"
            value={color}
            onChange={(e) => setColor(index, e.target.value)}
            sx={{ width: compact ? 78 : 112 }}
            InputLabelProps={{ shrink: true }}
          />
        ))}
      </Stack>
    </Stack>
  );
}

function MultiSelect({ label, value, options, onChange }) {
  return (
    <FormControl size="small" fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={value ?? []}
        label={label}
        input={<OutlinedInput label={label} />}
        onChange={(e) => onChange(e.target.value)}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {selected.map((item) => <Chip key={item} label={item} size="small" />)}
          </Box>
        )}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option}>{option}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function SingleSelect({ label, value, options, onChange }) {
  return (
    <FormControl size="small" fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select value={value ?? ''} label={label} onChange={(e) => onChange(e.target.value)}>
        <MenuItem value=""><em>None</em></MenuItem>
        {options.map((option) => (
          <MenuItem key={option} value={option}>{option}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function VisualEditor({ visualConfig, columns, valueColumns = columns, onChange }) {
  const type = visualConfig.type;
  const palette = visualConfig.palette ?? DEFAULT_PALETTE;
  const set = (patch) => onChange({ ...visualConfig, ...patch });
  const setPalette = (nextPalette) => {
    set({ palette: nextPalette, accentColor: [nextPalette[0], `${nextPalette[0]}18`] });
  };

  return (
    <Stack spacing={1.5}>
      <ChartTypePicker
        value={type}
        palette={palette}
        onChange={(nextType) => onChange(ensureVisualShape(nextType, { ...visualConfig, palette }))}
      />

      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>{TXT.color}</Typography>
        <PalettePicker value={palette} onChange={setPalette} />
      </Box>

      {isSingleYChartType(type) && (
        <>
          <SingleSelect
            label={type === 'bar_h' ? TXT.yAxis : TXT.xAxis}
            value={visualConfig.xField}
            options={columns}
            onChange={(xField) => set({ xField })}
          />
          <SingleSelect
            label={type === 'bar_h' ? TXT.xAxis : TXT.yAxis}
            value={(visualConfig.yFields ?? [])[0]}
            options={valueColumns}
            onChange={(yField) => set({ yFields: yField ? [yField] : [], labels: yField ? [yField] : [] })}
          />
        </>
      )}

      {isMultiYChartType(type) && (
        <>
          <SingleSelect label={TXT.xAxis} value={visualConfig.xField} options={columns} onChange={(xField) => set({ xField })} />
          <MultiSelect
            label={TXT.yAxis}
            value={visualConfig.yFields ?? []}
            options={valueColumns}
            onChange={(yFields) => {
              const previousLabelsByField = new Map((visualConfig.yFields ?? []).map((field, i) => [field, visualConfig.labels?.[i] ?? field]));
              set({ yFields, labels: yFields.map((field) => previousLabelsByField.get(field) ?? field) });
            }}
          />
        </>
      )}

      {type === 'bar_line' && (
        <>
          <SingleSelect label={TXT.xAxis} value={visualConfig.xField} options={columns} onChange={(xField) => set({ xField })} />
          <MultiSelect
            label={TXT.series}
            value={(visualConfig.series ?? []).map((s) => s.field)}
            options={valueColumns}
            onChange={(fields) => set({
              series: fields.map((field, index) => ({
                field,
                label: field,
                chartType: index === 0 ? 'bar' : 'line',
              })),
            })}
          />
        </>
      )}

      {['pie', 'doughnut'].includes(type) && (
        <>
          <SingleSelect label={TXT.labelColumn} value={visualConfig.labelField} options={columns} onChange={(labelField) => set({ labelField })} />
          <SingleSelect label={TXT.valueColumn} value={visualConfig.valueField} options={columns} onChange={(valueField) => set({ valueField })} />
        </>
      )}

      {type === 'table' && (
        <MultiSelect
          label={TXT.displayColumns}
          value={(visualConfig.columns ?? []).map((c) => c.field)}
          options={columns}
          onChange={(fields) => set({ columns: fields.map((field) => ({ field, headerText: field })) })}
        />
      )}

      {type === 'kpi' && (
        <>
          <SingleSelect label={TXT.valueColumn} value={visualConfig.valueField} options={columns} onChange={(valueField) => set({ valueField })} />
          <SingleSelect label={TXT.deltaColumn} value={visualConfig.deltaField} options={columns} onChange={(deltaField) => set({ deltaField })} />
          <Stack direction="row" spacing={1}>
            <TextField size="small" fullWidth label={TXT.unit} value={visualConfig.unit ?? ''} onChange={(e) => set({ unit: e.target.value })} />
            <SingleSelect label={TXT.format} value={visualConfig.format} options={FORMAT_VALUE_OPTIONS} onChange={(format) => set({ format })} />
          </Stack>
        </>
      )}
    </Stack>
  );
}

export default function WidgetSettingsDialog({ open, item, onClose, onApply }) {
  const [title, setTitle] = useState('');
  const [paramRows, setParamRows] = useState([]);
  const [visualConfig, setVisualConfig] = useState({});

  const spec = useMemo(() => parseWidgetSpec(item?.spec_json), [item]);
  const dataConfig = useMemo(() => toWidgetDataConfig(spec), [spec]);
  const columns = useMemo(() => getColumns(dataConfig, visualConfig), [dataConfig, visualConfig]);
  const valueColumns = useMemo(
    () => getNumericColumns(columns, dataConfig.fallbackData ?? []),
    [columns, dataConfig.fallbackData],
  );

  useEffect(() => {
    if (!item) return;
    const nextSpec = parseWidgetSpec(item.spec_json);
    setTitle(item.title ?? '');
    setParamRows(paramsToRows(toWidgetDataConfig(nextSpec).params));
    const nextVisualConfig = {
      palette: DEFAULT_PALETTE,
      ...toWidgetVisualConfig(nextSpec, item.widget_type),
    };
    setVisualConfig(ensureVisualShape(nextVisualConfig.type ?? item.widget_type ?? 'kpi', nextVisualConfig));
  }, [item]);

  const handleAddParam = () => {
    setParamRows((rows) => [...rows, { id: `new_${Date.now()}`, key: '', value: '' }]);
  };

  const handleApply = () => {
    const normalizedVisualConfig = ensureVisualShape(visualConfig.type ?? item?.widget_type ?? 'kpi', visualConfig);
    const nextSpec = {
      ...spec,
      widgetTitle: title,
      widgetType: normalizedVisualConfig.type,
      dataConfig: {
        ...(spec.dataConfig ?? {}),
        sourceName: dataConfig.sourceName,
        sourceType: dataConfig.sourceType,
        schema: dataConfig.schema,
        tableConfig: dataConfig.tableConfig ?? {},
        params: rowsToParams(paramRows),
        fallbackData: dataConfig.fallbackData ?? [],
        timeout: dataConfig.timeout ?? 0,
      },
      visualConfig: normalizedVisualConfig,
    };
    onApply({
      title,
      widget_type: normalizedVisualConfig.type,
      spec_json: nextSpec,
    });
  };

  if (!item) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.25 }}>
        <Typography fontWeight={700}>{TXT.widgetSettings}</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField size="small" label={TXT.widgetTitle} value={title} onChange={(e) => setTitle(e.target.value)} />

          <Box>
            <Typography variant="caption" color="text.secondary">{TXT.dataSource}</Typography>
            <Typography variant="body2" fontFamily="monospace" fontWeight={700}>{dataConfig.sourceName || '-'}</Typography>
          </Box>

          <Divider />

          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={700}>{TXT.params}</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={handleAddParam}>{TXT.add}</Button>
            </Stack>
            <Stack spacing={1}>
              {paramRows.length === 0 && (
                <Typography variant="body2" color="text.secondary">{TXT.noParams}</Typography>
              )}
              {paramRows.map((row, index) => (
                <Stack key={row.id} direction="row" spacing={1} alignItems="center">
                  <TextField
                    size="small"
                    label={TXT.name}
                    value={row.key}
                    onChange={(e) => setParamRows((rows) => rows.map((r, i) => (i === index ? { ...r, key: e.target.value } : r)))}
                    sx={{ width: 180 }}
                  />
                  <TextField
                    size="small"
                    label={TXT.value}
                    value={row.value}
                    onChange={(e) => setParamRows((rows) => rows.map((r, i) => (i === index ? { ...r, value: e.target.value } : r)))}
                    sx={{ flex: 1 }}
                  />
                  <IconButton size="small" onClick={() => setParamRows((rows) => rows.filter((_, i) => i !== index))}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>{TXT.shape}</Typography>
            <VisualEditor visualConfig={visualConfig} columns={columns} valueColumns={valueColumns} onChange={setVisualConfig} />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25 }}>
        <Button onClick={onClose}>{TXT.cancel}</Button>
        <Button variant="contained" onClick={handleApply}>{TXT.apply}</Button>
      </DialogActions>
    </Dialog>
  );
}

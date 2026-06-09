import React, { useState } from 'react';
import {
  Box, Checkbox, Chip, FormControlLabel, MenuItem,
  OutlinedInput, Select, Stack, Tab, Tabs, TextField,
  ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TuneIcon from '@mui/icons-material/Tune';
import BarChartIcon from '@mui/icons-material/BarChart';
import PreviewIcon from '@mui/icons-material/Preview';
import {
  defaultVisualConfig,
  FIELD_SX,
  FORMAT_OPTIONS,
  getVisualTargets,
  getVisualTargetTitle,
  MERGED_DATA_SOURCE_ID,
} from './wizardConstants';
import {
  ChartTypePicker,
  DEFAULT_PALETTE,
  ensureVisualShape,
  getNumericColumns,
  isMultiYChartType,
  isSingleYChartType,
  PalettePicker,
} from '../../dashboardbuilder/dialogs/WidgetSettingsDialog';
import KpiRenderer from '../../generic/renderers/KpiRenderer';
import ChartRenderer from '../../generic/renderers/ChartRenderer';
import TableRenderer from '../../generic/renderers/TableRenderer';
import dashboardConfig from '../../dashboardConfig';

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

// ─── SectionCard ──────────────────────────────────────────────────────────────

function SectionCard({ icon, title, accent = '#64748b', children, sx, contentSx }) {
  return (
    <Box sx={{ border: '1px solid #e5eaf2', borderRadius: '8px', overflow: 'hidden', ...sx }}>
      <Stack direction="row" alignItems="center" spacing={0.75}
        sx={{ px: 1.5, py: 0.875, backgroundColor: '#f8fafc', borderBottom: '1px solid #e5eaf2' }}>
        <Box sx={{ width: 3, height: 14, borderRadius: '2px', backgroundColor: accent, flexShrink: 0 }} />
        {icon && React.cloneElement(icon, { sx: { width: 14, height: 14, color: accent } })}
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{title}</Typography>
      </Stack>
      <Box sx={{ p: 1.25, ...contentSx }}>
        {children}
      </Box>
    </Box>
  );
}

// ─── PreviewWidget ────────────────────────────────────────────────────────────

function PreviewWidget({ visualConfig, data }) {
  if (!data?.length) return null;
  const type = visualConfig?.type;
  if (type === 'kpi') return <KpiRenderer data={data} config={visualConfig} />;
  if (['bar', 'bar_stacked', 'bar_h', 'line', 'area', 'bar_line', 'pie', 'doughnut'].includes(type))
    return <ChartRenderer data={data} config={visualConfig} />;
  if (type === 'table') return <TableRenderer data={data} config={visualConfig} />;
  return <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>미지원 유형: {type}</Typography>;
}

// ─── 컬럼 드롭다운 ────────────────────────────────────────────────────────────

function ColSelect({ label, value, columns, onChange, required, helperText }) {
  return (
    <TextField
      select label={label + (required ? ' *' : '')}
      size="small" sx={FIELD_SX}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      helperText={helperText}
      FormHelperTextProps={{ sx: { fontSize: 10 } }}
    >
      {!required && <MenuItem value=""><em>선택 안 함</em></MenuItem>}
      {columns.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
    </TextField>
  );
}

function MultiColSelect({ label, value = [], columns, onChange }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 11, color: '#64748b', mb: 0.5 }}>{label}</Typography>
      <Select
        multiple size="small" displayEmpty value={value}
        onChange={(e) => onChange(e.target.value)}
        input={<OutlinedInput size="small" />}
        renderValue={(sel) =>
          sel.length ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {sel.map((v) => <Chip key={v} label={v} size="small" sx={{ height: 18, fontSize: 10 }} />)}
            </Box>
          ) : <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>컬럼 선택...</Typography>
        }
        sx={{ fontSize: 12, width: '100%', '& .MuiSelect-select': { py: '6px' } }}
      >
        {columns.map((c) => <MenuItem key={c} value={c} sx={{ fontSize: 12 }}>{c}</MenuItem>)}
      </Select>
    </Box>
  );
}

// ─── 유형별 컬럼 매핑 ─────────────────────────────────────────────────────────

function KpiMapping({ vc, columns, onChange }) {
  const set = (k, v) => onChange({ ...vc, [k]: v || undefined });
  return (
    <Stack spacing={1.5}>
      <ColSelect label="KPI 값 컬럼" value={vc.valueField} columns={columns} required
        onChange={(v) => onChange({ ...vc, valueField: v })} helperText="숫자 값으로 표시할 컬럼" />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
        <ColSelect label="Delta 컬럼" value={vc.deltaField} columns={columns}
          onChange={(v) => set('deltaField', v)} helperText="증감 표시용 (선택)" />
        <ColSelect label="카테고리 필터" value={vc.filterCategory} columns={columns}
          onChange={(v) => set('filterCategory', v)} helperText="CATEGORY1 필터용 (선택)" />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
        <TextField label="단위" size="small" sx={FIELD_SX} value={vc.unit ?? ''}
          onChange={(e) => set('unit', e.target.value)} FormHelperTextProps={{ sx: { fontSize: 10 } }} />
        <TextField select label="포맷" size="small" sx={FIELD_SX} value={vc.format ?? ''}
          onChange={(e) => set('format', e.target.value)}>
          {FORMAT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
      </Box>
    </Stack>
  );
}

function BarLineMapping({ vc, columns, valueColumns = columns, onChange }) {
  if (isSingleYChartType(vc.type)) {
    const selectedYField = (vc.yFields ?? [])[0] ?? '';
    return (
      <Stack spacing={1.5}>
        <ColSelect
          label={vc.type === 'bar_h' ? 'Y축 컬럼' : 'X축 컬럼'}
          value={vc.xField}
          columns={columns}
          required
          onChange={(v) => onChange({ ...vc, xField: v })}
          helperText={vc.type === 'bar_h' ? '세로축 기준 컬럼' : '가로축 기준 컬럼'}
        />
        <ColSelect label={vc.type === 'bar_h' ? 'X축 컬럼' : 'Y축 컬럼'} value={selectedYField} columns={valueColumns} required
          onChange={(v) => onChange({
            ...vc,
            yFields: v ? [v] : [],
            labels: v ? [v] : [],
          })} helperText="막대 값 컬럼" />
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5}>
      <ColSelect label="X축 컬럼" value={vc.xField} columns={columns} required
        onChange={(v) => onChange({ ...vc, xField: v })} helperText="가로축 (날짜, 카테고리)" />
      <MultiColSelect label="Y축 컬럼 (복수 선택 가능)" value={vc.yFields ?? []} columns={valueColumns}
        onChange={(vals) => {
          const previousLabelsByField = new Map((vc.yFields ?? []).map((field, i) => [field, vc.labels?.[i] ?? field]));
          onChange({ ...vc, yFields: vals, labels: vals.map((field) => previousLabelsByField.get(field) ?? field) });
        }} />
      {(vc.yFields ?? []).length > 0 && (
        <Stack spacing={1}>
          <Typography sx={{ fontSize: 11, color: '#64748b' }}>범례명</Typography>
          {(vc.yFields ?? []).map((field, i) => (
            <TextField key={field} label={field} size="small" sx={FIELD_SX}
              value={(vc.labels ?? [])[i] ?? field}
              onChange={(e) => {
                const labels = [...(vc.labels ?? vc.yFields ?? [])];
                labels[i] = e.target.value;
                onChange({ ...vc, labels });
              }} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function BarLineMixedMapping({ vc, columns, valueColumns = columns, onChange }) {
  const seriesList = vc.series ?? [];
  function handleFieldSelect(fields) {
    const newSeries = fields.map((f) => seriesList.find((s) => s.field === f) ?? { field: f, label: f, chartType: 'bar' });
    onChange({ ...vc, series: newSeries });
  }
  function updateSeries(field, patch) {
    onChange({ ...vc, series: seriesList.map((s) => s.field === field ? { ...s, ...patch } : s) });
  }
  return (
    <Stack spacing={1.5}>
      <ColSelect label="X축 컬럼" value={vc.xField} columns={columns} required
        onChange={(v) => onChange({ ...vc, xField: v })} helperText="가로축 (날짜, 카테고리)" />
      <MultiColSelect label="시리즈 컬럼 (복수 선택)" value={seriesList.map((s) => s.field)}
        columns={valueColumns} onChange={handleFieldSelect} />
      {seriesList.length > 0 && (
        <Stack spacing={1}>
          <Typography sx={{ fontSize: 11, color: '#64748b' }}>시리즈별 유형 및 이름</Typography>
          {seriesList.map((s) => (
            <Stack key={s.field} direction="row" alignItems="center" spacing={1}>
              <Typography sx={{ fontSize: 12, color: '#475569', minWidth: 80, wordBreak: 'break-all' }}>{s.field}</Typography>
              <ToggleButtonGroup value={s.chartType ?? 'bar'} exclusive size="small"
                onChange={(_, v) => { if (v) updateSeries(s.field, { chartType: v }); }}
                sx={{ '& .MuiToggleButton-root': { fontSize: 10, textTransform: 'none', py: 0.25, px: 0.75 } }}>
                <ToggleButton value="bar">막대</ToggleButton>
                <ToggleButton value="line">라인</ToggleButton>
              </ToggleButtonGroup>
              <TextField size="small" placeholder="시리즈명" sx={{ ...FIELD_SX, flex: 1 }}
                value={s.label ?? s.field}
                onChange={(e) => updateSeries(s.field, { label: e.target.value })} />
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function PieMapping({ vc, columns, onChange }) {
  return (
    <Stack spacing={1.5}>
      <ColSelect label="레이블 컬럼" value={vc.labelField} columns={columns} required
        onChange={(v) => onChange({ ...vc, labelField: v })} helperText="파이 조각 이름 컬럼" />
      <ColSelect label="값 컬럼" value={vc.valueField} columns={columns} required
        onChange={(v) => onChange({ ...vc, valueField: v })} helperText="파이 조각 크기 컬럼" />
    </Stack>
  );
}

function TableMapping({ vc, columns, onChange }) {
  const selectedFields = (vc.columns ?? []).map((c) => c.field);
  const selectedFieldSet = new Set(selectedFields);
  const selectableCount = columns.length;
  const selectedCount = columns.filter((col) => selectedFieldSet.has(col)).length;
  const allSelected = selectableCount > 0 && selectedCount === selectableCount;
  const partiallySelected = selectedCount > 0 && !allSelected;

  function createColumnDef(col) {
    return {
      field: col,
      headerText: col,
      align: dashboardConfig.defaultTableColumnAlign,
      width: dashboardConfig.defaultTableColumnWidth,
    };
  }

  function toggleAllColumns() {
    if (allSelected) {
      onChange({ ...vc, columns: [] });
      return;
    }

    const existingByField = new Map((vc.columns ?? []).map((col) => [col.field, col]));
    onChange({
      ...vc,
      columns: columns.map((col) => existingByField.get(col) ?? createColumnDef(col)),
    });
  }

  function toggleColumn(col) {
    if (selectedFieldSet.has(col)) {
      onChange({ ...vc, columns: vc.columns.filter((c) => c.field !== col) });
    } else {
      onChange({
        ...vc,
        columns: [
          ...(vc.columns ?? []),
          createColumnDef(col),
        ],
      });
    }
  }
  function changeHeader(col, headerText) {
    onChange({ ...vc, columns: (vc.columns ?? []).map((c) => c.field === col ? { ...c, headerText } : c) });
  }
  return (
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={allSelected}
              indeterminate={partiallySelected}
              onChange={toggleAllColumns}
              sx={{ p: 0.5 }}
            />
          }
          label={<Typography sx={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>전체 선택</Typography>}
          sx={{ mr: 0 }}
        />
        <Typography sx={{ fontSize: 11, color: '#64748b' }}>
          {selectedCount}/{selectableCount}
        </Typography>
      </Stack>
      {columns.map((col) => {
        const checked = selectedFieldSet.has(col);
        const colDef = (vc.columns ?? []).find((c) => c.field === col);
        return (
          <Stack key={col} direction="row" alignItems="center" spacing={1}>
            <FormControlLabel
              control={<Checkbox size="small" checked={checked} onChange={() => toggleColumn(col)} sx={{ p: 0.5 }} />}
              label={<Typography sx={{ fontSize: 12, minWidth: 120, wordBreak: 'break-all' }}>{col}</Typography>}
              sx={{ mr: 0 }}
            />
            {checked && (
              <TextField size="small" label="표시명" placeholder="헤더명" sx={{ ...FIELD_SX, flex: 1 }}
                value={colDef?.headerText ?? col}
                onChange={(e) => changeHeader(col, e.target.value)} />
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}

// ─── 시각화 옵션 ──────────────────────────────────────────────────────────────

function KpiVisualOptions({ vc, onChange }) {
  const [main, light] = vc.accentColor ?? ['#2196f3', '#e3f2fd'];
  const thresholds = vc.thresholds ?? [];
  function addThreshold() {
    onChange({ ...vc, thresholds: [...thresholds, { operator: '>=', value: '', status: 'GOOD' }] });
  }
  function removeThreshold(i) {
    onChange({ ...vc, thresholds: thresholds.filter((_, idx) => idx !== i) });
  }
  function patchThreshold(i, patch) {
    onChange({ ...vc, thresholds: thresholds.map((t, idx) => idx === i ? { ...t, ...patch } : t) });
  }
  return (
    <Stack spacing={1.5}>
      {/* 색상 — compact single row */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography sx={{ fontSize: 11, color: '#64748b', minWidth: 28, flexShrink: 0 }}>색상</Typography>
        <input type="color" value={main}
          onChange={(e) => onChange({ ...vc, accentColor: [e.target.value, light] })}
          style={{ width: 28, height: 24, border: '1px solid #e5eaf2', borderRadius: 4, cursor: 'pointer', padding: 2 }} />
        <Typography sx={{ fontSize: 10, color: '#94a3b8' }}>메인</Typography>
        <input type="color" value={light}
          onChange={(e) => onChange({ ...vc, accentColor: [main, e.target.value] })}
          style={{ width: 28, height: 24, border: '1px solid #e5eaf2', borderRadius: 4, cursor: 'pointer', padding: 2 }} />
        <Typography sx={{ fontSize: 10, color: '#94a3b8' }}>배경</Typography>
        <Box sx={{ flex: 1, height: 24, borderRadius: '4px', background: `linear-gradient(135deg, ${main}, ${light})`, border: '1px solid #e5eaf2' }} />
      </Stack>

      {/* 소수점 — compact row */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography sx={{ fontSize: 11, color: '#64748b', flexShrink: 0 }}>소수점</Typography>
        <TextField
          type="number" size="small"
          sx={{ ...FIELD_SX, width: 80 }}
          value={vc.decimalPlaces ?? ''}
          inputProps={{ min: 0, max: 6 }}
          onChange={(e) => onChange({ ...vc, decimalPlaces: e.target.value !== '' ? Number(e.target.value) : undefined })}
        />
        <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>자리</Typography>
      </Stack>

      {/* 임계값 */}
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
          <Typography sx={{ fontSize: 11, color: '#64748b' }}>임계값 설정</Typography>
          <Chip label="+ 추가" size="small" onClick={addThreshold}
            icon={<AddCircleOutlineIcon sx={{ width: 12, height: 12 }} />}
            sx={{ height: 20, fontSize: 10, cursor: 'pointer', backgroundColor: '#e0e7ff', color: '#4f46e5' }} />
        </Stack>
        {thresholds.map((t, i) => (
          <Stack key={i} direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
            <TextField select size="small" sx={{ ...FIELD_SX, width: 70 }}
              value={t.operator ?? '>='} onChange={(e) => patchThreshold(i, { operator: e.target.value })}>
              {['>=', '>', '<=', '<', '=='].map((op) => <MenuItem key={op} value={op} sx={{ fontSize: 11 }}>{op}</MenuItem>)}
            </TextField>
            <TextField size="small" type="number" placeholder="값" sx={{ ...FIELD_SX, flex: 1 }}
              value={t.value ?? ''} onChange={(e) => patchThreshold(i, { value: e.target.value })} />
            <TextField select size="small" sx={{ ...FIELD_SX, width: 90 }}
              value={t.status ?? 'GOOD'} onChange={(e) => patchThreshold(i, { status: e.target.value })}>
              {['GOOD', 'WARNING', 'DANGER', 'INFO'].map((s) => <MenuItem key={s} value={s} sx={{ fontSize: 11 }}>{s}</MenuItem>)}
            </TextField>
            <Chip label="×" size="small" onClick={() => removeThreshold(i)}
              sx={{ height: 18, fontSize: 10, cursor: 'pointer', backgroundColor: '#fef2f2', color: '#ef4444' }} />
          </Stack>
        ))}
      </Box>
    </Stack>
  );
}

function BarStackedToggle({ vc, onChange }) {
  return (
    <ToggleButtonGroup
      value={vc.stacked ? 'stacked' : 'grouped'} exclusive size="small"
      onChange={(_, v) => { if (v) onChange({ ...vc, stacked: v === 'stacked' }); }}
      sx={{ '& .MuiToggleButton-root': { fontSize: 11, textTransform: 'none', py: 0.5 } }}
    >
      <ToggleButton value="grouped">그룹형</ToggleButton>
      <ToggleButton value="stacked">누적형</ToggleButton>
    </ToggleButtonGroup>
  );
}

function TableVisualOptions({ vc, columns = [], onChange }) {
  const cols = (vc.columns ?? []).filter((col) => columns.includes(col.field));
  if (!cols.length) {
    return null;
  }
  return (
    <Stack spacing={1}>
      <Typography sx={{ fontSize: 11, color: '#64748b' }}>컬럼별 정렬 / 너비</Typography>
      {cols.map((col) => (
        <Stack key={col.field} direction="row" alignItems="center" spacing={1}>
          <Typography sx={{ fontSize: 12, flex: 1, wordBreak: 'break-all' }}>{col.headerText ?? col.field}</Typography>
          <TextField select size="small" sx={{ ...FIELD_SX, width: 90 }}
            value={col.align ?? 'left'}
            onChange={(e) => onChange({ ...vc, columns: cols.map((c) => c.field === col.field ? { ...c, align: e.target.value } : c) })}>
            {['left', 'center', 'right'].map((a) => <MenuItem key={a} value={a} sx={{ fontSize: 11 }}>{a}</MenuItem>)}
          </TextField>
          <TextField size="small" type="number" placeholder="너비(px)" sx={{ ...FIELD_SX, width: 80 }}
            value={col.width ?? ''} inputProps={{ min: 40 }}
            onChange={(e) => onChange({ ...vc, columns: cols.map((c) => c.field === col.field ? { ...c, width: e.target.value ? Number(e.target.value) : undefined } : c) })} />
        </Stack>
      ))}
    </Stack>
  );
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

function hasNonNullValue(rows, column) {
  if (!rows.length) return true;
  return rows.some((row) => row?.[column] !== null && row?.[column] !== undefined);
}

export default function Step4_VisualAndPreview({ draft, onDraftChange, testResults }) {
  const [activeIdx, setActiveIdx] = useState(0);

  const visualTargets = getVisualTargets(draft);

  const safeIdx = Math.min(activeIdx, Math.max(visualTargets.length - 1, 0));
  const activeTarget = visualTargets[safeIdx] ?? visualTargets[0];
  const hasMultiple = visualTargets.length > 1;

  const activeId = activeTarget?.id ?? null;
  const vc = (activeId && draft?.visualConfigs?.[activeId]) ?? defaultVisualConfig('kpi');
  const activeMergedResult = activeTarget?.kind === 'merged'
    ? (testResults[activeTarget.id] ?? testResults[MERGED_DATA_SOURCE_ID])
    : null;
  const columns = unique(activeTarget?.kind === 'merged'
    ? (activeMergedResult?.columns ?? [])
    : ((activeTarget?.dataSource && testResults[activeTarget.dataSource.id]?.columns) ?? []));
  const previewData = activeTarget?.kind === 'merged'
    ? (activeMergedResult?.rows ?? [])
    : ((activeTarget?.dataSource && testResults[activeTarget.dataSource.id]?.rows) ?? []);
  const mappingColumns = unique(columns.filter((col) => hasNonNullValue(previewData, col)));
  const valueColumns = getNumericColumns(mappingColumns, previewData);
  const hiddenNullColumnCount = Math.max(columns.length - mappingColumns.length, 0);
  const type = vc.type ?? 'kpi';
  const widgetTitle = activeTarget ? getVisualTargetTitle(activeTarget, draft?.visualConfigs ?? {}) : '';

  function setVc(updated) {
    if (!activeId) return;
    onDraftChange({ visualConfigs: { ...(draft.visualConfigs ?? {}), [activeId]: updated } });
  }

  function handleTypeChange(newType) {
    setVc(ensureVisualShape(newType, { ...vc, palette: vc.palette ?? DEFAULT_PALETTE }));
  }

  function handlePaletteChange(nextPalette) {
    setVc({
      ...vc,
      palette: nextPalette,
      accentColor: [nextPalette[0], `${nextPalette[0]}18`],
    });
  }

  const hasVisualOptions = type === 'kpi' || type === 'table' || type === 'bar' || type === 'line';

  return (
    <Stack spacing={1.5}>
      {/* 병합 모드 헤더 */}
      {/* {visualTargets.some((target) => target.kind === 'merged') && (
        <Box sx={{ border: '1px solid #c7d2fe', borderRadius: '8px', px: 1.5, py: 0.875, backgroundColor: '#eef2ff' }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Box sx={{ width: 3, height: 14, borderRadius: '2px', backgroundColor: '#4f46e5', flexShrink: 0 }} />
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#4f46e5' }}>병합 그룹 포함</Typography>
            {visualTargets
              .filter((target) => target.kind === 'merged')
              .every((target) => ((testResults[target.id] ?? testResults[MERGED_DATA_SOURCE_ID])?.rows ?? []).length === 0) && (
              <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>— 3단계에서 병합 미리보기를 실행하세요</Typography>
            )}
          </Stack>
        </Box>
      )} */}

      {/* 시각화 대상 탭 */}
      {hasMultiple && (
        <Box sx={{ border: '1px solid #e5eaf2', borderRadius: '8px', overflow: 'hidden' }}>
          <Tabs
            value={safeIdx}
            onChange={(_, i) => setActiveIdx(i)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 36,
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e5eaf2',
              '& .MuiTab-root': { fontSize: 11, minHeight: 36, textTransform: 'none', py: 0.5 },
            }}
          >
            {visualTargets.map((target) => {
              const targetVc = draft?.visualConfigs?.[target.id];
              const targetResult = target.kind === 'merged'
                ? (testResults[target.id] ?? testResults[MERGED_DATA_SOURCE_ID])
                : testResults[target.id];
              const hasCols = target.kind === 'merged'
                ? (targetResult?.columns ?? []).length > 0
                : (targetResult?.columns ?? []).length > 0;
              const targetTitle = getVisualTargetTitle(target, draft?.visualConfigs ?? {});
              return (
                <Tab
                  key={target.id}
                  label={
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <span>{targetTitle}</span>
                      {target.kind === 'merged' && (
                        <Chip label="병합" size="small"
                          sx={{ height: 14, fontSize: 8, backgroundColor: '#eef2ff', color: '#4f46e5' }} />
                      )}
                      {targetVc?.type && (
                        <Chip label={targetVc.type} size="small"
                          sx={{ height: 14, fontSize: 8, backgroundColor: '#e0e7ff', color: '#4f46e5' }} />
                      )}
                      {!hasCols && (
                        <ErrorOutlineIcon sx={{ width: 12, height: 12, color: '#f59e0b' }} />
                      )}
                    </Stack>
                  }
                />
              );
            })}
          </Tabs>
        </Box>
      )}

      <Box sx={{ border: '1px solid #e5eaf2', borderRadius: '8px', p: 1.25, bgcolor: '#fff' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(240px, 420px) minmax(0, 1fr)' }, gap: 1, alignItems: 'center' }}>
          <TextField
            label="위젯명"
            size="small"
            sx={FIELD_SX}
            value={widgetTitle}
            onChange={(e) => setVc({ ...vc, widgetTitle: e.target.value })}
          />
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ minWidth: 0 }}>
            {activeTarget?.kind === 'merged' ? (
              <>
                <Chip size="small" label="병합 그룹" sx={{ height: 22, fontSize: 10, bgcolor: '#eef2ff', color: '#4f46e5', fontWeight: 800 }} />
                {(activeTarget.dataSources ?? []).map((ds) => (
                  <Chip key={ds.id} size="small" label={ds.sourceName} title={ds.sourceName}
                    sx={{ maxWidth: 220, height: 22, fontSize: 10, bgcolor: '#f8fafc', color: '#475569' }} />
                ))}
              </>
            ) : (
              <>
                <Chip size="small" label="개별 데이터" sx={{ height: 22, fontSize: 10, bgcolor: '#f1f5f9', color: '#475569', fontWeight: 800 }} />
                <Typography sx={{ fontSize: 11, color: '#64748b' }} noWrap title={activeTarget?.dataSource?.sourceName}>
                  {activeTarget?.dataSource?.sourceName}
                </Typography>
              </>
            )}
          </Stack>
        </Box>
      </Box>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(380px, 42%)' },
        gap: 1.25,
        alignItems: 'start',
      }}>
        <Stack spacing={1.25} sx={{ minWidth: 0 }}>
          <SectionCard icon={<TuneIcon />} title="모양" accent="#4f46e5">
            <Stack spacing={1}>
              <ChartTypePicker
                value={type}
                palette={vc.palette ?? DEFAULT_PALETTE}
                onChange={handleTypeChange}
                compact
              />
              <Box>
                <Typography sx={{ fontSize: 11, color: '#64748b', mb: 0.5 }}>색상</Typography>
                <PalettePicker
                  value={vc.palette ?? DEFAULT_PALETTE}
                  onChange={handlePaletteChange}
                  compact
                />
              </Box>
            </Stack>
          </SectionCard>

          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', xl: hasVisualOptions ? 'minmax(0, 1fr) minmax(280px, 0.82fr)' : '1fr' },
            gap: 1.25,
            alignItems: 'start',
          }}>
            <SectionCard icon={<BarChartIcon />} title="컬럼 매핑" accent="#0284c7">
              {mappingColumns.length > 0 ? (
                <>
                  {hiddenNullColumnCount > 0 && (
                    <Chip
                      label={`전체 null 컬럼 ${hiddenNullColumnCount}개 제외`}
                      size="small"
                      sx={{ mb: 1, height: 22, fontSize: 10, bgcolor: '#f1f5f9', color: '#64748b' }}
                    />
                  )}
                  {type === 'kpi' && <KpiMapping vc={vc} columns={mappingColumns} onChange={setVc} />}
                  {(isSingleYChartType(type) || isMultiYChartType(type)) && (
                    <BarLineMapping vc={vc} columns={mappingColumns} valueColumns={valueColumns} onChange={setVc} />
                  )}
                  {type === 'bar_line' && <BarLineMixedMapping vc={vc} columns={mappingColumns} valueColumns={valueColumns} onChange={setVc} />}
                  {(type === 'pie' || type === 'doughnut') && <PieMapping vc={vc} columns={mappingColumns} onChange={setVc} />}
                  {type === 'table' && <TableMapping vc={vc} columns={mappingColumns} onChange={setVc} />}
                </>
              ) : (
                <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>
                  매핑 가능한 컬럼이 없습니다.
                </Typography>
              )}
            </SectionCard>

            {hasVisualOptions && (
              <SectionCard icon={<TuneIcon />} title="시각화 옵션" accent="#0891b2">
                {type === 'kpi' && <KpiVisualOptions vc={vc} onChange={setVc} />}
                {(type === 'bar' || type === 'line') && <BarStackedToggle vc={vc} onChange={setVc} />}
                {type === 'table' && <TableVisualOptions vc={vc} columns={mappingColumns} onChange={setVc} />}
              </SectionCard>
            )}
          </Box>
        </Stack>

        <SectionCard
          icon={<PreviewIcon />}
          title="미리보기"
          accent="#059669"
          sx={{ position: { lg: 'sticky' }, top: { lg: 8 } }}
          contentSx={{ p: 1 }}
        >
          <Box sx={{
            border: '1px solid #e5eaf2',
            borderRadius: '6px',
            overflow: 'hidden',
            backgroundColor: '#fafbfc',
            height: { xs: type === 'table' ? 260 : 220, lg: 'calc(100vh - 430px)' },
            minHeight: { xs: type === 'table' ? 240 : 200, lg: 360 },
            maxHeight: { lg: 520 },
          }}>
            {previewData?.length ? (
              <PreviewWidget visualConfig={vc} data={previewData} />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>미리볼 데이터가 없습니다.</Typography>
              </Box>
            )}
          </Box>
        </SectionCard>
      </Box>
    </Stack>
  );
}

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PreviewIcon from '@mui/icons-material/Preview';
import SchemaIcon from '@mui/icons-material/Schema';
import StorageIcon from '@mui/icons-material/Storage';
import TuneIcon from '@mui/icons-material/Tune';

import {
  normalizeParameterMappings,
  parseWidgetSpec,
} from '../../generic/widgetSpecAdapter';
import {
  ChartTypePicker,
  DEFAULT_PALETTE,
  ensureVisualShape,
  getNumericColumns,
  isMultiYChartType,
  isSingleYChartType,
  PalettePicker,
} from '../../dashboardbuilder/dialogs/WidgetSettingsDialog';
import {
  defaultVisualConfig,
  getVisualTargetTitle,
  MERGED_DATA_SOURCE_ID,
  MODULE_LIST,
  moduleColor,
} from '../../popup/steps/wizardConstants';
import { fetchTableColumns } from '../../popup/steps/spDataApi';
import { useMultiTestQuery } from '../../popup/steps/useMultiTestQuery';
import useDashboardSourceCatalog, { findCatalogEntry } from '../hooks/useDashboardSourceCatalog';
import dashboardConfig from '../../dashboardConfig';
import ChartRenderer from '../../generic/renderers/ChartRenderer';
import KpiRenderer from '../../generic/renderers/KpiRenderer';
import TableRenderer from '../../generic/renderers/TableRenderer';

const MERGE_TYPE_OPTIONS = [
  { value: 'LEFT_JOIN', label: 'LEFT JOIN', color: '#2563eb' },
  { value: 'INNER_JOIN', label: 'INNER JOIN', color: '#7c3aed' },
  { value: 'UNION', label: 'UNION', color: '#059669' },
];

const OPERATOR_OPTIONS = ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN'];
const DIRECTION_OPTIONS = ['ASC', 'DESC'];
const FORMAT_OPTIONS = [
  { value: '', label: '기본' },
  { value: 'compact', label: 'K/M 단위' },
  { value: 'integer', label: '정수' },
  { value: 'percent', label: '%' },
  { value: 'currency', label: '통화' },
];
const SOURCE_TYPE_LABELS = {
  STORED_PROCEDURE: 'SP',
  PROCEDURE: 'SP',
  SP: 'SP',
  TABLE: 'TABLE',
  VIEW: 'VIEW',
};

const FIELD_SX = {
  '& .MuiInputBase-root': { fontSize: 12 },
  '& .MuiInputLabel-root': { fontSize: 12 },
};

function normalizeSourceType(type) {
  if (type === 'TABLE') return 'TABLE';
  if (type === 'VIEW') return 'VIEW';
  return 'STORED_PROCEDURE';
}

function sourceTypeLabel(type) {
  return SOURCE_TYPE_LABELS[type] ?? SOURCE_TYPE_LABELS[normalizeSourceType(type)] ?? 'SP';
}

function sourceTypeColor(type) {
  if (type === 'TABLE') return { bg: '#fef3c7', color: '#d97706' };
  if (type === 'VIEW') return { bg: '#dcfce7', color: '#059669' };
  return { bg: '#dbeafe', color: '#2563eb' };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function getParamName(mapping, fallback = '') {
  return (mapping.key || mapping.paramName || mapping.name || fallback).replace(/^@/, '');
}

function getParamValue(mapping) {
  return mapping.testValue ?? mapping.value ?? mapping.defaultValue ?? '';
}

function getMappingSourceIds(mapping) {
  if (Array.isArray(mapping.sources)) return mapping.sources;
  if (Array.isArray(mapping.sourceIds)) return mapping.sourceIds;
  if (Array.isArray(mapping.dataSourceIds)) return mapping.dataSourceIds;
  if (mapping.dataSourceId) return [mapping.dataSourceId];
  return [];
}

function mappingBelongsToSource(mapping, sourceId, sourceCount) {
  const sourceIds = getMappingSourceIds(mapping);
  if (sourceIds.length > 0) {
    return sourceIds.some((id) => String(id) === String(sourceId));
  }
  return sourceCount === 1;
}

function getSourceColumnsFromMock(ds) {
  const rows = ds?.mockData ?? ds?.fallbackData ?? [];
  if (Array.isArray(rows) && rows.length > 0 && rows[0] && !Array.isArray(rows[0])) {
    return Object.keys(rows[0]);
  }
  return [];
}

function visualColumns(vc = {}) {
  return unique([
    vc.xField,
    vc.labelField,
    vc.valueField,
    vc.deltaField,
    ...(vc.yFields ?? []),
    ...(vc.series ?? []).map((s) => s.field),
    ...(vc.columns ?? []).map((c) => c.field ?? c),
  ]);
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

function normalizeTableConfig(ds) {
  return {
    columns: [],
    whereConditions: [],
    orderBy: [],
    topN: dashboardConfig.tableTopN,
    ...(ds.tableConfig ?? {}),
  };
}

function makeDataSources(spec, widget, sourceCatalog) {
  function enrichSource(ds) {
    const catalogEntry = findCatalogEntry(sourceCatalog, ds);
    return {
      ...(catalogEntry ?? {}),
      ...ds,
      id: ds.id ?? catalogEntry?.id ?? ds.sourceName ?? ds.name,
      sourceType: ds.sourceType ?? ds.type ?? catalogEntry?.sourceType ?? 'STORED_PROCEDURE',
      sourceName: ds.sourceName ?? ds.name ?? catalogEntry?.sourceName ?? '',
      module: ds.module ?? catalogEntry?.module ?? widget?.module ?? MODULE_LIST[0],
      schema: ds.schema ?? catalogEntry?.schema ?? 'dbo',
      params: Array.isArray(ds.params) && ds.params.length ? ds.params : (catalogEntry?.params ?? []),
      mockData: Array.isArray(ds.mockData) && ds.mockData.length ? ds.mockData : (catalogEntry?.mockData ?? []),
    };
  }

  const sources = spec.dataSources ?? [];
  if (sources.length > 0) return sources.map(enrichSource);

  if (spec.dataSource) {
    const dc = spec.dataConfig ?? {};
    const ds = spec.dataSource;
    return [enrichSource({
      id: ds.id ?? ds.sourceName ?? ds.name ?? 'ds_1',
      sourceType: dc.sourceType || ds.type || 'STORED_PROCEDURE',
      sourceName: dc.sourceName || dc.procedureName || ds.name || ds.sourceName || '',
      module: widget?.module || ds.module || MODULE_LIST[0],
      schema: dc.schema || ds.schema || 'dbo',
      tableConfig: dc.tableConfig ?? ds.tableConfig ?? {},
      params: ds.params ?? [],
      mockData: dc.fallbackData || ds.mockData || spec.mockData || [],
    })];
  }

  return [];
}

function getMergeSourceIds(mergeConfig, dataSources) {
  if (!mergeConfig?.enabled || mergeConfig.type === 'SEPARATE') return [];
  const known = new Set(dataSources.map((ds) => ds.id));
  const rawIds = Array.isArray(mergeConfig.sourceIds) && mergeConfig.sourceIds.length > 0
    ? mergeConfig.sourceIds
    : dataSources.map((ds) => ds.id);
  return rawIds.filter((id, index, arr) => known.has(id) && arr.indexOf(id) === index);
}

function getEditVisualTargets({ spec, dataSources, isMerged }) {
  if (isMerged) {
    const mergeConfig = spec.mergeConfig ?? {};
    const sourceIds = getMergeSourceIds(mergeConfig, dataSources);
    const sourceSet = new Set(sourceIds);
    return [{
      id: mergeConfig.id ?? MERGED_DATA_SOURCE_ID,
      kind: 'merged',
      label: mergeConfig.name ?? spec.widgetTitle ?? '병합 결과',
      defaultTitle: mergeConfig.name ?? spec.widgetTitle ?? '병합 결과',
      sourceIds,
      dataSources: dataSources.filter((ds) => sourceSet.has(ds.id)),
    }];
  }

  return dataSources.map((ds) => ({
    id: ds.id,
    kind: 'source',
    label: ds.sourceName,
    defaultTitle: ds.sourceName,
    sourceIds: [ds.id],
    dataSource: ds,
    dataSources: [ds],
  }));
}

function buildColumnMap(dataSources, tableColumnsById, visualConfigs, visualTargets) {
  const map = {};
  dataSources.forEach((ds) => {
    const fetched = tableColumnsById[ds.id] ?? [];
    const tableConfig = ds.tableConfig ?? {};
    map[ds.id] = unique([
      ...fetched,
      ...getSourceColumnsFromMock(ds),
      ...(tableConfig.columns ?? []),
      ...(tableConfig.whereConditions ?? []).map((c) => c.column),
      ...(tableConfig.orderBy ?? []).map((o) => o.column),
      ...visualColumns(visualConfigs[ds.id]),
    ]);
  });

  visualTargets.forEach((target) => {
    if (target.kind !== 'merged') return;
    map[target.id] = unique([
      ...(target.dataSources ?? []).flatMap((ds) => map[ds.id] ?? []),
      ...visualColumns(visualConfigs[target.id]),
    ]);
  });

  return map;
}

function getPreviewRowsFromSource(ds) {
  const candidates = [
    ds?.mockData,
    ds?.fallbackData,
    ds?.previewData,
  ];
  return candidates.find((rows) => Array.isArray(rows) && rows.length > 0) ?? [];
}

function mergePreviewRows(dataSources = []) {
  const rowsBySource = dataSources
    .map(getPreviewRowsFromSource)
    .filter((rows) => rows.length > 0);
  const maxLength = Math.max(0, ...rowsBySource.map((rows) => rows.length));

  return Array.from({ length: maxLength }, (_, rowIndex) => (
    Object.assign({}, ...rowsBySource.map((rows) => rows[rowIndex] ?? {}))
  )).filter((row) => Object.keys(row).length > 0);
}

function getTargetPreviewRows(target) {
  if (!target) return [];
  if (target.kind === 'merged') {
    return mergePreviewRows(target.dataSources ?? []);
  }
  return getPreviewRowsFromSource(target.dataSource);
}

function columnsFromRows(rows = []) {
  return unique(rows.flatMap((row) => row && typeof row === 'object' && !Array.isArray(row) ? Object.keys(row) : []));
}

function DataPreviewTable({ columns, rows }) {
  if (!rows.length) {
    return (
      <Box sx={{ minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #cbd5e1', borderRadius: '8px', bgcolor: '#fbfcfe' }}>
        <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>표시할 데이터가 없습니다.</Typography>
      </Box>
    );
  }

  const safeColumns = columns.length ? columns : columnsFromRows(rows);

  return (
    <Box sx={{ border: '1px solid #e5eaf2', borderRadius: '8px', overflow: 'auto', maxHeight: 320, bgcolor: '#fff' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc' }}>
            {safeColumns.map((column) => (
              <th key={column} style={{ position: 'sticky', top: 0, padding: '7px 9px', borderBottom: '1px solid #e5eaf2', textAlign: 'left', color: '#475569', fontWeight: 800, whiteSpace: 'nowrap', backgroundColor: '#f8fafc' }}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 50).map((row, rowIndex) => (
            <tr key={rowIndex} style={{ borderBottom: '1px solid #f1f5f9' }}>
              {safeColumns.map((column) => (
                <td key={column} style={{ padding: '6px 9px', color: '#334155', whiteSpace: 'nowrap', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {row?.[column] == null ? <span style={{ color: '#94a3b8' }}>null</span> : String(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

function PreviewWidget({ visualConfig, data }) {
  if (!data?.length) return null;
  const type = visualConfig?.type ?? 'kpi';

  if (type === 'kpi') return <KpiRenderer data={data} config={visualConfig} />;
  if (['bar', 'bar_stacked', 'bar_h', 'line', 'area', 'bar_line', 'pie', 'doughnut'].includes(type)) {
    return <ChartRenderer data={data} config={visualConfig} />;
  }
  if (type === 'table') return <TableRenderer data={data} config={visualConfig} />;
  return null;
}

function ParameterAccordion({ dataSources, parameterMappings, onChange }) {
  const [expandedIds, setExpandedIds] = useState(() => new Set([dataSources[0]?.id].filter(Boolean)));

  useEffect(() => {
    setExpandedIds((prev) => {
      const known = new Set(dataSources.map((ds) => ds.id));
      const next = new Set([...prev].filter((id) => known.has(id)));
      if (next.size === 0 && dataSources[0]?.id) next.add(dataSources[0].id);
      return next;
    });
  }, [dataSources]);

  function patchParam(index, value) {
    onChange(parameterMappings.map((mapping, idx) => (
      idx === index ? { ...mapping, testValue: value, value } : mapping
    )));
  }

  const sourceSections = dataSources
    .filter((ds) => ds.sourceType !== 'TABLE')
    .map((ds) => ({
      ds,
      params: parameterMappings
        .map((mapping, index) => ({ mapping, index }))
        .filter(({ mapping }) => mappingBelongsToSource(mapping, ds.id, dataSources.length)),
    }))
    .filter((section) => section.params.length > 0);

  const assignedIndexes = new Set(sourceSections.flatMap((section) => section.params.map((item) => item.index)));
  const extraParams = parameterMappings
    .map((mapping, index) => ({ mapping, index }))
    .filter((item) => !assignedIndexes.has(item.index));

  if (sourceSections.length === 0 && extraParams.length === 0) {
    return (
      <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>
        설정된 SP 파라미터가 없습니다.
      </Typography>
    );
  }

  function renderRows(params) {
    return (
      <Stack spacing={0.8}>
        {params.map(({ mapping, index }) => (
          <Box
            key={`${getParamName(mapping, `param-${index}`)}-${index}`}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '220px minmax(0, 1fr)' },
              gap: 1,
              alignItems: 'center',
              border: '1px solid #e5eaf2',
              borderRadius: '8px',
              p: 1,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 900, color: '#1e293b', wordBreak: 'break-all' }}>
                {getParamName(mapping, `param-${index + 1}`)}
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.35 }}>
                {mapping.required && <SmallCountChip label="필수" color="#ef4444" />}
                {mapping.dataType && <SmallCountChip label={mapping.dataType} color="#64748b" />}
              </Stack>
            </Box>
            <TextField
              size="small"
              label="기본값"
              value={getParamValue(mapping)}
              onChange={(event) => patchParam(index, event.target.value)}
              sx={FIELD_SX}
            />
          </Box>
        ))}
      </Stack>
    );
  }

  return (
    <Stack spacing={1}>
      {sourceSections.map(({ ds, params }, sectionIndex) => {
        const expanded = expandedIds.has(ds.id);
        return (
          <Accordion
            key={ds.id}
            disableGutters
            expanded={expanded}
            onChange={() => {
              setExpandedIds((prev) => {
                const next = new Set(prev);
                if (next.has(ds.id)) next.delete(ds.id);
                else next.add(ds.id);
                return next;
              });
            }}
            sx={{
              border: '1px solid #dbe7f5',
              borderRadius: '8px !important',
              boxShadow: 'none',
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
                <Typography
                  title={ds.sourceName}
                  sx={{ fontSize: 13, fontWeight: 900, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  #{sectionIndex + 1} {ds.sourceName}
                </Typography>
                <SmallCountChip label={`${params.length}개`} />
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              {renderRows(params)}
            </AccordionDetails>
          </Accordion>
        );
      })}

      {extraParams.length > 0 && (
        <Accordion disableGutters defaultExpanded sx={{ border: '1px solid #dbe7f5', borderRadius: '8px !important', boxShadow: 'none', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Typography sx={{ fontSize: 13, fontWeight: 900, color: '#1e293b' }}>기타 파라미터</Typography>
              <SmallCountChip label={`${extraParams.length}개`} />
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            {renderRows(extraParams)}
          </AccordionDetails>
        </Accordion>
      )}
    </Stack>
  );
}

function DataSourceList({ dataSources }) {
  if (!dataSources.length) {
    return <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>데이터 소스가 없습니다.</Typography>;
  }

  return (
    <Stack spacing={0.75}>
      {dataSources.map((ds, index) => (
        <Box
          key={ds.id}
          sx={{
            display: 'grid',
            gridTemplateColumns: '34px auto minmax(0, 1fr) auto',
            gap: 1,
            alignItems: 'center',
            border: '1px solid #e5eaf2',
            borderRadius: '8px',
            p: 1,
            bgcolor: '#fff',
          }}
        >
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>#{index + 1}</Typography>
          <SourceTypeChip type={ds.sourceType} />
          <Typography sx={{ minWidth: 0, fontSize: 13, fontWeight: 800, color: '#1e293b', overflowWrap: 'anywhere' }}>
            {ds.sourceName}
          </Typography>
          {ds.module && <SmallCountChip label={ds.module} color={moduleColor(ds.module)} />}
        </Box>
      ))}
    </Stack>
  );
}

function MergeSettings({ dataSources, mergeType, onMergeTypeChange, relationships, onRelationshipsChange, columnsBySource }) {
  function updateRelationship(index, patch) {
    onRelationshipsChange(relationships.map((rel, relIndex) => (
      relIndex === index ? { ...rel, ...patch } : rel
    )));
  }

  function columnsFor(sourceId) {
    return columnsBySource[sourceId] ?? [];
  }

  return (
    <Stack spacing={1.5}>
      <ToggleButtonGroup
        exclusive
        value={mergeType}
        onChange={(_, value) => { if (value) onMergeTypeChange(value); }}
        size="small"
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          '& .MuiToggleButton-root': { fontSize: 12, fontWeight: 900, py: 0.8 },
        }}
      >
        {MERGE_TYPE_OPTIONS.map((option) => (
          <ToggleButton key={option.value} value={option.value}>
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {mergeType === 'UNION' ? (
        <Box sx={{ border: '1px dashed #cbd5e1', borderRadius: '8px', px: 1.25, py: 1, bgcolor: '#f8fafc' }}>
          <Typography sx={{ fontSize: 12, color: '#64748b' }}>
            UNION은 조인 조건 없이 선택된 소스의 결과를 수직으로 합칩니다.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={0.8}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>조인 조건</Typography>
            <Button
              size="small"
              startIcon={<AddIcon sx={{ width: 14, height: 14 }} />}
              onClick={() => onRelationshipsChange([
                ...relationships,
                { leftDsId: dataSources[0]?.id ?? '', leftCol: '', rightDsId: dataSources[1]?.id ?? '', rightCol: '' },
              ])}
              sx={{ fontSize: 11, textTransform: 'none' }}
            >
              조건 추가
            </Button>
          </Stack>
          {relationships.length === 0 && (
            <Typography sx={{ fontSize: 12, color: '#f59e0b' }}>
              조인 조건이 아직 설정되지 않았습니다.
            </Typography>
          )}
          {relationships.map((rel, index) => (
            <Box
              key={index}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '180px minmax(0, 1fr) 16px 180px minmax(0, 1fr) 32px' },
                gap: 0.75,
                alignItems: 'center',
              }}
            >
              <TextField
                select
                size="small"
                label="왼쪽 소스"
                value={rel.leftDsId ?? ''}
                onChange={(event) => updateRelationship(index, { leftDsId: event.target.value, leftCol: '' })}
                sx={FIELD_SX}
              >
                {dataSources.map((ds) => (
                  <MenuItem key={ds.id} value={ds.id} sx={{ fontSize: 12 }}>{ds.sourceName}</MenuItem>
                ))}
              </TextField>
              <ColumnSelect
                label="왼쪽 컬럼"
                value={rel.leftCol}
                columns={columnsFor(rel.leftDsId)}
                onChange={(leftCol) => updateRelationship(index, { leftCol })}
              />
              <Typography sx={{ display: { xs: 'none', md: 'block' }, fontSize: 13, fontWeight: 900, color: '#94a3b8', textAlign: 'center' }}>=</Typography>
              <TextField
                select
                size="small"
                label="오른쪽 소스"
                value={rel.rightDsId ?? ''}
                onChange={(event) => updateRelationship(index, { rightDsId: event.target.value, rightCol: '' })}
                sx={FIELD_SX}
              >
                {dataSources.map((ds) => (
                  <MenuItem key={ds.id} value={ds.id} sx={{ fontSize: 12 }}>{ds.sourceName}</MenuItem>
                ))}
              </TextField>
              <ColumnSelect
                label="오른쪽 컬럼"
                value={rel.rightCol}
                columns={columnsFor(rel.rightDsId)}
                onChange={(rightCol) => updateRelationship(index, { rightCol })}
              />
              <IconButton size="small" onClick={() => onRelationshipsChange(relationships.filter((_, relIndex) => relIndex !== index))}>
                <DeleteIcon sx={{ width: 15, height: 15 }} />
              </IconButton>
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function TableConditionEditor({ ds, columns, loading, onPatch }) {
  const config = normalizeTableConfig(ds);

  function patch(nextConfig) {
    onPatch(ds.id, { tableConfig: { ...config, ...nextConfig } });
  }

  function updateWhere(index, patchRow) {
    const next = [...(config.whereConditions ?? [])];
    next[index] = { ...next[index], ...patchRow };
    patch({ whereConditions: next });
  }

  function updateOrder(index, patchRow) {
    const next = [...(config.orderBy ?? [])];
    next[index] = { ...next[index], ...patchRow };
    patch({ orderBy: next });
  }

  const selectedColumns = config.columns ?? [];

  return (
    <Stack spacing={1.5}>
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>조회 컬럼</Typography>
          <Stack direction="row" spacing={0.5}>
            {loading && <CircularProgress size={14} />}
            <Button size="small" onClick={() => patch({ columns })} disabled={!columns.length} sx={{ fontSize: 11 }}>전체</Button>
            <Button size="small" onClick={() => patch({ columns: [] })} disabled={!selectedColumns.length} sx={{ fontSize: 11 }}>해제</Button>
          </Stack>
        </Stack>
        <MultiColumnSelect
          label={selectedColumns.length ? `${selectedColumns.length}개 선택` : '미선택: SELECT *'}
          value={selectedColumns}
          columns={columns}
          onChange={(value) => patch({ columns: value })}
        />
      </Box>

      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>WHERE 조건</Typography>
          <Button
            size="small"
            startIcon={<AddIcon sx={{ width: 14, height: 14 }} />}
            onClick={() => patch({
              whereConditions: [
                ...(config.whereConditions ?? []),
                { id: `wc_${Date.now()}`, column: columns[0] ?? '', operator: '=', fixedValue: '', mappingType: 'FIXED_VALUE' },
              ],
            })}
            disabled={!columns.length}
            sx={{ fontSize: 11, textTransform: 'none' }}
          >
            조건 추가
          </Button>
        </Stack>
        <Stack spacing={0.75}>
          {(config.whereConditions ?? []).map((cond, index) => (
            <Box
              key={cond.id ?? index}
              sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 90px minmax(0, 1fr) 32px' }, gap: 0.75, alignItems: 'center' }}
            >
              <ColumnSelect
                label="컬럼"
                value={cond.column}
                columns={columns}
                onChange={(column) => updateWhere(index, { column })}
              />
              <TextField
                select
                size="small"
                label="조건"
                value={cond.operator ?? '='}
                onChange={(event) => updateWhere(index, { operator: event.target.value })}
                sx={FIELD_SX}
              >
                {OPERATOR_OPTIONS.map((operator) => (
                  <MenuItem key={operator} value={operator} sx={{ fontSize: 12 }}>{operator}</MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                label="값"
                value={cond.fixedValue ?? cond.value ?? ''}
                onChange={(event) => updateWhere(index, {
                  fixedValue: event.target.value,
                  mappingType: 'FIXED_VALUE',
                  paramName: '',
                })}
                sx={FIELD_SX}
              />
              <IconButton size="small" onClick={() => patch({ whereConditions: config.whereConditions.filter((_, rowIndex) => rowIndex !== index) })}>
                <DeleteIcon sx={{ width: 15, height: 15 }} />
              </IconButton>
            </Box>
          ))}
        </Stack>
      </Box>

      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>ORDER BY</Typography>
          <Button
            size="small"
            startIcon={<AddIcon sx={{ width: 14, height: 14 }} />}
            onClick={() => patch({ orderBy: [...(config.orderBy ?? []), { column: columns[0] ?? '', direction: 'ASC' }] })}
            disabled={!columns.length}
            sx={{ fontSize: 11, textTransform: 'none' }}
          >
            정렬 추가
          </Button>
        </Stack>
        <Stack spacing={0.75}>
          {(config.orderBy ?? []).map((order, index) => (
            <Box
              key={`${order.column}-${index}`}
              sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 110px 32px' }, gap: 0.75, alignItems: 'center' }}
            >
              <ColumnSelect
                label="정렬 컬럼"
                value={order.column}
                columns={columns}
                onChange={(column) => updateOrder(index, { column })}
              />
              <TextField
                select
                size="small"
                label="방향"
                value={order.direction ?? 'ASC'}
                onChange={(event) => updateOrder(index, { direction: event.target.value })}
                sx={FIELD_SX}
              >
                {DIRECTION_OPTIONS.map((direction) => (
                  <MenuItem key={direction} value={direction} sx={{ fontSize: 12 }}>{direction}</MenuItem>
                ))}
              </TextField>
              <IconButton size="small" onClick={() => patch({ orderBy: config.orderBy.filter((_, rowIndex) => rowIndex !== index) })}>
                <DeleteIcon sx={{ width: 15, height: 15 }} />
              </IconButton>
            </Box>
          ))}
        </Stack>
      </Box>

      <TextField
        size="small"
        type="number"
        label="TOP N"
        value={config.topN ?? dashboardConfig.tableTopN}
        onChange={(event) => patch({ topN: Math.max(1, parseInt(event.target.value, 10) || dashboardConfig.tableTopN) })}
        sx={{ ...FIELD_SX, width: 140 }}
        inputProps={{ min: 1, max: 100000 }}
      />
    </Stack>
  );
}

function TableConditionSection({ tableSources, columnsBySource, loadingBySource, onPatch }) {
  const [expandedIds, setExpandedIds] = useState(() => new Set([tableSources[0]?.id].filter(Boolean)));

  useEffect(() => {
    setExpandedIds((prev) => {
      const known = new Set(tableSources.map((ds) => ds.id));
      const next = new Set([...prev].filter((id) => known.has(id)));
      if (next.size === 0 && tableSources[0]?.id) next.add(tableSources[0].id);
      return next;
    });
  }, [tableSources]);

  if (!tableSources.length) {
    return <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>테이블 데이터 소스가 없습니다.</Typography>;
  }

  return (
    <Stack spacing={1}>
      {tableSources.map((ds, index) => (
        <Accordion
          key={ds.id}
          disableGutters
          expanded={expandedIds.has(ds.id)}
          onChange={() => setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(ds.id)) next.delete(ds.id);
            else next.add(ds.id);
            return next;
          })}
          sx={{
            border: '1px solid #dbe7f5',
            borderRadius: '8px !important',
            boxShadow: 'none',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
              <Typography title={ds.sourceName} sx={{ fontSize: 13, fontWeight: 900, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                #{index + 1} {ds.sourceName}
              </Typography>
              <SmallCountChip label={`${columnsBySource[ds.id]?.length ?? 0}컬럼`} color="#0891b2" />
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <TableConditionEditor
              ds={ds}
              columns={columnsBySource[ds.id] ?? []}
              loading={loadingBySource[ds.id]}
              onPatch={onPatch}
            />
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  );
}

function KpiMapping({ vc, columns, onChange }) {
  return (
    <Stack spacing={1.25}>
      <ColumnSelect label="값 컬럼" value={vc.valueField} columns={columns} onChange={(valueField) => onChange({ ...vc, valueField })} />
      <ColumnSelect label="증감 컬럼" value={vc.deltaField} columns={columns} onChange={(deltaField) => onChange({ ...vc, deltaField })} />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
        <TextField size="small" label="단위" value={vc.unit ?? ''} onChange={(event) => onChange({ ...vc, unit: event.target.value })} sx={FIELD_SX} />
        <TextField select size="small" label="포맷" value={vc.format ?? ''} onChange={(event) => onChange({ ...vc, format: event.target.value })} sx={FIELD_SX}>
          {FORMAT_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value} sx={{ fontSize: 12 }}>{option.label}</MenuItem>
          ))}
        </TextField>
      </Box>
    </Stack>
  );
}

function BasicSeriesMapping({ vc, columns, valueColumns = columns, onChange }) {
  if (isSingleYChartType(vc.type ?? 'bar')) {
    const selectedYField = (vc.yFields ?? [])[0] ?? '';
    return (
      <Stack spacing={1.25}>
        <ColumnSelect
          label={vc.type === 'bar_h' ? 'Y축 컬럼' : 'X축 컬럼'}
          value={vc.xField}
          columns={columns}
          onChange={(xField) => onChange({ ...vc, xField })}
        />
        <ColumnSelect
          label={vc.type === 'bar_h' ? 'X축 컬럼' : 'Y축 컬럼'}
          value={selectedYField}
          columns={valueColumns}
          onChange={(yField) => onChange({
            ...vc,
            yFields: yField ? [yField] : [],
            labels: yField ? [yField] : [],
          })}
        />
      </Stack>
    );
  }

  return (
    <Stack spacing={1.25}>
      <ColumnSelect label="X축 컬럼" value={vc.xField} columns={columns} onChange={(xField) => onChange({ ...vc, xField })} />
      <MultiColumnSelect
        label="Y축 컬럼"
        value={vc.yFields ?? []}
        columns={valueColumns}
        onChange={(yFields) => {
          const previousLabelsByField = new Map((vc.yFields ?? []).map((field, i) => [field, vc.labels?.[i] ?? field]));
          onChange({ ...vc, yFields, labels: yFields.map((field) => previousLabelsByField.get(field) ?? field) });
        }}
      />
    </Stack>
  );
}

function MixedSeriesMapping({ vc, columns, valueColumns = columns, onChange }) {
  const series = vc.series ?? [];
  return (
    <Stack spacing={1.25}>
      <ColumnSelect label="X축 컬럼" value={vc.xField} columns={columns} onChange={(xField) => onChange({ ...vc, xField })} />
      <MultiColumnSelect
        label="시리즈 컬럼"
        value={series.map((item) => item.field)}
        columns={valueColumns}
        onChange={(fields) => onChange({
          ...vc,
          series: fields.map((field, index) => (
            series.find((item) => item.field === field) ?? { field, label: field, chartType: index === 0 ? 'bar' : 'line' }
          )),
        })}
      />
      {series.map((item) => (
        <Box key={item.field} sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 150px minmax(0, 1fr)', gap: 1, alignItems: 'center' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#475569', wordBreak: 'break-all' }}>{item.field}</Typography>
          <TextField
            select
            size="small"
            label="표현"
            value={item.chartType ?? 'bar'}
            onChange={(event) => onChange({
              ...vc,
              series: series.map((seriesItem) => seriesItem.field === item.field ? { ...seriesItem, chartType: event.target.value } : seriesItem),
            })}
            sx={FIELD_SX}
          >
            <MenuItem value="bar" sx={{ fontSize: 12 }}>막대</MenuItem>
            <MenuItem value="line" sx={{ fontSize: 12 }}>선</MenuItem>
          </TextField>
          <TextField
            size="small"
            label="표시명"
            value={item.label ?? item.field}
            onChange={(event) => onChange({
              ...vc,
              series: series.map((seriesItem) => seriesItem.field === item.field ? { ...seriesItem, label: event.target.value } : seriesItem),
            })}
            sx={FIELD_SX}
          />
        </Box>
      ))}
    </Stack>
  );
}

function PieMapping({ vc, columns, onChange }) {
  return (
    <Stack spacing={1.25}>
      <ColumnSelect label="레이블 컬럼" value={vc.labelField} columns={columns} onChange={(labelField) => onChange({ ...vc, labelField })} />
      <ColumnSelect label="값 컬럼" value={vc.valueField} columns={columns} onChange={(valueField) => onChange({ ...vc, valueField })} />
    </Stack>
  );
}

function TableMapping({ vc, columns, onChange }) {
  const selected = (vc.columns ?? []).map((item) => item.field ?? item);
  const existingByField = new Map((vc.columns ?? []).map((item) => [item.field ?? item, item]));

  return (
    <Stack spacing={1.25}>
      <MultiColumnSelect
        label="표시 컬럼"
        value={selected}
        columns={columns}
        onChange={(fields) => onChange({
          ...vc,
          columns: fields.map((field) => {
            const prev = existingByField.get(field);
            return typeof prev === 'object'
              ? prev
              : { field, headerText: field, align: dashboardConfig.defaultTableColumnAlign, width: dashboardConfig.defaultTableColumnWidth };
          }),
        })}
      />
      {(vc.columns ?? []).map((column) => {
        const field = column.field ?? column;
        return (
          <Box key={field} sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 120px 120px', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              label={field}
              value={column.headerText ?? field}
              onChange={(event) => onChange({
                ...vc,
                columns: (vc.columns ?? []).map((item) => (item.field ?? item) === field ? { ...item, field, headerText: event.target.value } : item),
              })}
              sx={FIELD_SX}
            />
            <TextField
              select
              size="small"
              label="정렬"
              value={column.align ?? dashboardConfig.defaultTableColumnAlign}
              onChange={(event) => onChange({
                ...vc,
                columns: (vc.columns ?? []).map((item) => (item.field ?? item) === field ? { ...item, field, align: event.target.value } : item),
              })}
              sx={FIELD_SX}
            >
              {['left', 'center', 'right'].map((align) => <MenuItem key={align} value={align} sx={{ fontSize: 12 }}>{align}</MenuItem>)}
            </TextField>
            <TextField
              size="small"
              type="number"
              label="너비"
              value={column.width ?? dashboardConfig.defaultTableColumnWidth}
              onChange={(event) => onChange({
                ...vc,
                columns: (vc.columns ?? []).map((item) => (item.field ?? item) === field ? { ...item, field, width: Number(event.target.value) || dashboardConfig.defaultTableColumnWidth } : item),
              })}
              sx={FIELD_SX}
            />
          </Box>
        );
      })}
    </Stack>
  );
}

function VisualMapping({ vc, columns, valueColumns = columns, onChange }) {
  const type = vc.type ?? 'kpi';

  if (!columns.length) {
    return (
      <Box sx={{ border: '1px dashed #cbd5e1', borderRadius: '8px', p: 1.5, bgcolor: '#f8fafc' }}>
        <Typography sx={{ fontSize: 12, color: '#64748b' }}>
          선택 가능한 컬럼 정보가 없습니다. 저장된 미리보기 데이터나 테이블 컬럼 정보를 확인해 주세요.
        </Typography>
      </Box>
    );
  }

  if (type === 'kpi') return <KpiMapping vc={vc} columns={columns} onChange={onChange} />;
  if (isSingleYChartType(type) || isMultiYChartType(type)) return <BasicSeriesMapping vc={vc} columns={columns} valueColumns={valueColumns} onChange={onChange} />;
  if (type === 'bar_line') return <MixedSeriesMapping vc={vc} columns={columns} valueColumns={valueColumns} onChange={onChange} />;
  if (['pie', 'doughnut'].includes(type)) return <PieMapping vc={vc} columns={columns} onChange={onChange} />;
  if (type === 'table') return <TableMapping vc={vc} columns={columns} onChange={onChange} />;
  return null;
}

export default forwardRef(function (
  { widget, onSave, onCancel, saving, hideHeader = false },
  ref,
) {
  const { catalog } = useDashboardSourceCatalog();
  const spec = useMemo(() => parseWidgetSpec(widget?.spec_json), [widget]);
  const initialDataSources = useMemo(() => makeDataSources(spec, widget, catalog), [spec, widget, catalog]);
  const [activeTab, setActiveTab] = useState(0);
  const [visualTab, setVisualTab] = useState(0);
  const [title, setTitle] = useState(widget?.title ?? spec.widgetTitle ?? '');
  const [module, setModule] = useState(widget?.module ?? initialDataSources[0]?.module ?? MODULE_LIST[0]);
  const [dataSources, setDataSources] = useState(initialDataSources);
  const isMerged = !!(spec.mergeConfig?.enabled && spec.mergeConfig?.type !== 'SEPARATE');
  const [mergeType, setMergeType] = useState(spec.mergeConfig?.type ?? dashboardConfig.defaultMergeType ?? 'LEFT_JOIN');
  const [relationships, setRelationships] = useState(spec.mergeConfig?.relationships ?? []);
  const [parameterMappings, setParameterMappings] = useState(() =>
    normalizeParameterMappings(spec.parameterMappings ?? spec.paramBindings ?? [], initialDataSources)
  );
  const [tableColumnsById, setTableColumnsById] = useState({});
  const [tableLoadingById, setTableLoadingById] = useState({});
  const { results: previewResults, runTest, runMerged } = useMultiTestQuery();

  const visualTargets = useMemo(
    () => getEditVisualTargets({ spec, dataSources, isMerged }),
    [spec, dataSources, isMerged],
  );
  const primaryTargetId = visualTargets[0]?.id ?? dataSources[0]?.id ?? MERGED_DATA_SOURCE_ID;

  const [visualConfigs, setVisualConfigs] = useState(() => {
    const existing = spec.visualConfigs && Object.keys(spec.visualConfigs).length > 0
      ? spec.visualConfigs
      : {};
    const primaryVisual = spec.visualConfig ?? {};
    if (Object.keys(existing).length > 0) return existing;
    return { [primaryTargetId]: primaryVisual };
  });

  const tableSources = useMemo(
    () => dataSources.filter((ds) => normalizeSourceType(ds.sourceType) === 'TABLE'),
    [dataSources],
  );

  useEffect(() => {
    tableSources.forEach((ds) => {
      if (!ds.sourceName || tableColumnsById[ds.id]) return;
      setTableLoadingById((prev) => ({ ...prev, [ds.id]: true }));
      fetchTableColumns(ds.sourceName, ds.schema ?? 'dbo')
        .then((columns) => {
          setTableColumnsById((prev) => ({
            ...prev,
            [ds.id]: columns.map((column) => column.columnName).filter(Boolean),
          }));
        })
        .finally(() => {
          setTableLoadingById((prev) => ({ ...prev, [ds.id]: false }));
        });
    });
  }, [tableSources, tableColumnsById]);

  const columnsBySource = useMemo(
    () => buildColumnMap(dataSources, tableColumnsById, visualConfigs, visualTargets),
    [dataSources, tableColumnsById, visualConfigs, visualTargets],
  );

  const safeVisualTab = Math.min(visualTab, Math.max(visualTargets.length - 1, 0));
  const activeVisualTarget = visualTargets[safeVisualTab] ?? visualTargets[0];
  const activeVisualId = activeVisualTarget?.id ?? primaryTargetId;
  const activeVisualConfig = visualConfigs[activeVisualId] ?? spec.visualConfig ?? defaultVisualConfig(widget?.widget_type ?? 'kpi');
  const activeVisualColumns = columnsBySource[activeVisualId] ?? [];
  const activeVisualType = activeVisualConfig.type ?? widget?.widget_type ?? 'kpi';
  const activePreviewConfig = useMemo(
    () => ensureVisualShape(activeVisualType, {
      ...activeVisualConfig,
      palette: activeVisualConfig.palette ?? DEFAULT_PALETTE,
    }),
    [activeVisualConfig, activeVisualType],
  );
  const activePreviewResult = previewResults[activeVisualId];
  const activePreviewData = useMemo(() => (
    activePreviewResult?.executed
      ? (activePreviewResult.rows ?? [])
      : getTargetPreviewRows(activeVisualTarget)
  ), [activePreviewResult, activeVisualTarget]);
  const activePreviewColumns = useMemo(() => (
    activePreviewResult?.columns?.length
      ? activePreviewResult.columns
      : columnsFromRows(activePreviewData)
  ), [activePreviewResult, activePreviewData]);
  const activeValueColumns = useMemo(
    () => getNumericColumns(activeVisualColumns, activePreviewData),
    [activeVisualColumns, activePreviewData],
  );

  function patchDataSource(dsId, patch) {
    setDataSources((prev) => prev.map((ds) => ds.id === dsId ? { ...ds, ...patch } : ds));
  }

  function updateVisualConfig(targetId, nextConfig) {
    setVisualConfigs((prev) => ({ ...prev, [targetId]: nextConfig }));
  }

  function handleVisualTypeChange(nextType) {
    updateVisualConfig(activeVisualId, ensureVisualShape(nextType, {
      ...activeVisualConfig,
      palette: activeVisualConfig.palette ?? DEFAULT_PALETTE,
    }));
  }

  function handlePaletteChange(nextPalette) {
    updateVisualConfig(activeVisualId, {
      ...activeVisualConfig,
      palette: nextPalette,
      accentColor: [nextPalette[0], `${nextPalette[0]}18`],
    });
  }

  async function handleRunPreview(target = activeVisualTarget) {
    if (!target) return;
    const normalizedMappings = normalizeParameterMappings(parameterMappings, dataSources);

    if (target.kind === 'merged') {
      await runMerged(dataSources, normalizedMappings, {
        ...(spec.mergeConfig ?? {}),
        type: mergeType,
        sourceIds: target.sourceIds,
        relationships,
      }, target.id);
      return;
    }

    if (target.dataSource) {
      await runTest(target.dataSource, normalizedMappings);
    }
  }

  function handleSave() {
    const normalizedParameterMappings = normalizeParameterMappings(parameterMappings, dataSources);
    const normalizedVisualConfigs = Object.fromEntries(
      Object.entries(visualConfigs ?? {}).map(([targetId, config]) => [
        targetId,
        ensureVisualShape(config?.type ?? widget?.widget_type ?? 'kpi', config ?? {}),
      ]),
    );
    const primaryVc = normalizedVisualConfigs[primaryTargetId]
      ?? normalizedVisualConfigs[activeVisualId]
      ?? Object.values(normalizedVisualConfigs)[0]
      ?? {};
    const newMergeConfig = isMerged
      ? {
          ...(spec.mergeConfig ?? {}),
          enabled: true,
          type: mergeType,
          relationships,
          visualConfig: primaryVc,
        }
      : spec.mergeConfig;

    const newSpec = {
      ...spec,
      widgetTitle: title,
      widgetType: primaryVc.type ?? widget?.widget_type ?? '',
      dataSources,
      parameterMappings: normalizedParameterMappings,
      paramBindings: normalizedParameterMappings,
      mergeConfig: newMergeConfig,
      visualConfigs: normalizedVisualConfigs,
      visualConfig: primaryVc,
    };

    if (!isMerged && dataSources.length === 1) {
      const ds = dataSources[0];
      if (normalizeSourceType(ds.sourceType) === 'TABLE') {
        newSpec.dataConfig = {
          sourceType: 'TABLE',
          sourceName: ds.sourceName,
          schema: ds.schema ?? 'dbo',
          tableConfig: ds.tableConfig ?? {},
          params: [],
          fallbackData: spec.dataConfig?.fallbackData ?? [],
          timeout: spec.dataConfig?.timeout ?? 0,
        };
      } else {
        newSpec.dataConfig = {
          ...(spec.dataConfig ?? {}),
          sourceType: ds.sourceType,
          procedureName: ds.sourceName,
          sourceName: ds.sourceName,
          params: spec.dataConfig?.params ?? {},
        };
      }
      newSpec.dataSource = {
        ...(spec.dataSource ?? {}),
        id: ds.id,
        type: ds.sourceType,
        name: ds.sourceName,
        sourceName: ds.sourceName,
        module,
        mockData: ds.mockData ?? spec.dataSource?.mockData ?? [],
      };
    }

    onSave({
      title,
      module,
      widget_type: primaryVc.type ?? widget?.widget_type ?? '',
      spec_json: newSpec,
    });
  }

  useImperativeHandle(ref, () => ({ handleSave }));

  const tabOne = (
    <Stack spacing={1.5}>
      <Section
        icon={<EditIcon sx={{ width: 15, height: 15, color: '#ea580c' }} />}
        title="기본 정보"
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 180px' }, gap: 1.25 }}>
          <TextField
            label="위젯 제목"
            size="small"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            sx={FIELD_SX}
          />
          <TextField
            select
            label="모듈"
            size="small"
            value={module}
            onChange={(event) => setModule(event.target.value)}
            sx={FIELD_SX}
          >
            {MODULE_LIST.map((item) => (
              <MenuItem key={item} value={item} sx={{ fontSize: 12 }}>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: moduleColor(item), flexShrink: 0 }} />
                  <span>{item}</span>
                </Stack>
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Section>

      <Section
        icon={<StorageIcon sx={{ width: 15, height: 15, color: '#059669' }} />}
        title="데이터 소스"
        right={<SmallCountChip label={`${dataSources.length}개`} />}
      >
        <DataSourceList dataSources={dataSources} />
      </Section>

      <Section
        icon={<PreviewIcon sx={{ width: 15, height: 15, color: '#059669' }} />}
        title="데이터 미리보기"
        right={
          <Stack direction="row" spacing={0.75} alignItems="center">
            <SmallCountChip label={`${activePreviewData.length}행`} color="#059669" />
            <Button
              size="small"
              variant="outlined"
              startIcon={activePreviewResult?.loading ? <CircularProgress size={12} /> : <PlayArrowIcon sx={{ width: 14, height: 14 }} />}
              disabled={!activeVisualTarget || !!activePreviewResult?.loading}
              onClick={() => handleRunPreview(activeVisualTarget)}
              sx={{ height: 26, fontSize: 11, fontWeight: 800, textTransform: 'none', borderRadius: '6px' }}
            >
              {activePreviewResult?.loading ? '조회 중...' : '미리보기'}
            </Button>
          </Stack>
        }
      >
        <Stack spacing={1}>
          {visualTargets.length > 1 && (
            <Tabs
              value={safeVisualTab}
              onChange={(_, value) => setVisualTab(value)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 32,
                '& .MuiTab-root': { minHeight: 32, fontSize: 11, fontWeight: 800, textTransform: 'none' },
              }}
            >
              {visualTargets.map((target) => (
                <Tab key={target.id} label={getVisualTargetTitle(target, visualConfigs)} />
              ))}
            </Tabs>
          )}
          {activePreviewResult?.error && (
            <Box sx={{ border: '1px solid #fecaca', borderRadius: '8px', bgcolor: '#fef2f2', p: 1 }}>
              <Typography sx={{ fontSize: 12, color: '#dc2626' }}>{activePreviewResult.error}</Typography>
            </Box>
          )}
          <DataPreviewTable columns={activePreviewColumns} rows={activePreviewData} />
        </Stack>
      </Section>

      {isMerged && (
        <Section
          icon={<SchemaIcon sx={{ width: 15, height: 15, color: '#7c3aed' }} />}
          title="병합 설정"
        >
          <MergeSettings
            dataSources={dataSources}
            mergeType={mergeType}
            onMergeTypeChange={setMergeType}
            relationships={relationships}
            onRelationshipsChange={setRelationships}
            columnsBySource={columnsBySource}
          />
        </Section>
      )}

      <Section
        icon={<TuneIcon sx={{ width: 15, height: 15, color: '#475569' }} />}
        title="파라미터"
        right={<SmallCountChip label={`${parameterMappings.length}개`} />}
      >
        <ParameterAccordion
          dataSources={dataSources}
          parameterMappings={parameterMappings}
          onChange={setParameterMappings}
        />
      </Section>

      <Section
        icon={<FilterListIcon sx={{ width: 15, height: 15, color: '#0891b2' }} />}
        title="테이블 조건"
        right={<SmallCountChip label={`${tableSources.length}개`} color="#0891b2" />}
      >
        <TableConditionSection
          tableSources={tableSources}
          columnsBySource={columnsBySource}
          loadingBySource={tableLoadingById}
          onPatch={patchDataSource}
        />
      </Section>
    </Stack>
  );

  const tabTwo = (
    <Stack spacing={1.5}>
      {visualTargets.length > 1 && (
        <Box sx={{ border: '1px solid #e5eaf2', borderRadius: '8px', overflow: 'hidden', bgcolor: '#fff' }}>
          <Tabs
            value={safeVisualTab}
            onChange={(_, value) => setVisualTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 38,
              bgcolor: '#f8fafc',
              '& .MuiTab-root': { minHeight: 38, fontSize: 12, fontWeight: 800, textTransform: 'none' },
            }}
          >
            {visualTargets.map((target) => (
              <Tab key={target.id} label={getVisualTargetTitle(target, visualConfigs)} />
            ))}
          </Tabs>
        </Box>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(360px, 34%)' },
          gap: 1.5,
          alignItems: 'start',
        }}
      >
        <Stack spacing={1.5} sx={{ minWidth: 0 }}>
          <Section
            icon={<BarChartIcon sx={{ width: 15, height: 15, color: '#2563eb' }} />}
            title="시각화 설정"
          >
            <Stack spacing={1.5}>
              <TextField
                size="small"
                label="위젯명"
                value={getVisualTargetTitle(activeVisualTarget, visualConfigs)}
                onChange={(event) => updateVisualConfig(activeVisualId, { ...activeVisualConfig, widgetTitle: event.target.value })}
                sx={FIELD_SX}
              />

              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#475569', mb: 0.75 }}>모양</Typography>
                <ChartTypePicker
                  value={activeVisualType}
                  palette={activeVisualConfig.palette ?? DEFAULT_PALETTE}
                  onChange={handleVisualTypeChange}
                  compact
                />
              </Box>

              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#475569', mb: 0.75 }}>색상</Typography>
                <PalettePicker
                  value={activeVisualConfig.palette ?? DEFAULT_PALETTE}
                  onChange={handlePaletteChange}
                  compact
                />
              </Box>
            </Stack>
          </Section>

          <Section
            icon={<TuneIcon sx={{ width: 15, height: 15, color: '#0284c7' }} />}
            title="컬럼 매핑"
            right={<SmallCountChip label={`${activeVisualColumns.length}컬럼`} />}
          >
            <VisualMapping
              vc={activeVisualConfig}
              columns={activeVisualColumns}
              valueColumns={activeValueColumns}
              onChange={(nextConfig) => updateVisualConfig(activeVisualId, nextConfig)}
            />
          </Section>
        </Stack>

        <Box sx={{ position: { lg: 'sticky' }, top: { lg: 12 } }}>
          <Section
            icon={<PreviewIcon sx={{ width: 15, height: 15, color: '#059669' }} />}
            title="시각화 미리보기"
            right={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <SmallCountChip label={`${activePreviewData.length}행`} color="#059669" />
                <Button
                  size="small"
                  variant="contained"
                  startIcon={activePreviewResult?.loading ? <CircularProgress size={12} color="inherit" /> : <PlayArrowIcon sx={{ width: 14, height: 14 }} />}
                  disabled={!activeVisualTarget || !!activePreviewResult?.loading}
                  onClick={() => handleRunPreview(activeVisualTarget)}
                  sx={{ height: 26, fontSize: 11, fontWeight: 800, textTransform: 'none', borderRadius: '6px' }}
                >
                  {activePreviewResult?.loading ? '조회 중...' : '미리보기'}
                </Button>
              </Stack>
            }
          >
            {activePreviewResult?.error && (
              <Box sx={{ mb: 1, border: '1px solid #fecaca', borderRadius: '8px', bgcolor: '#fef2f2', p: 1 }}>
                <Typography sx={{ fontSize: 12, color: '#dc2626' }}>{activePreviewResult.error}</Typography>
              </Box>
            )}
            <Box
              sx={{
                height: { xs: activeVisualType === 'table' ? 280 : 240, lg: 'calc(100vh - 390px)' },
                minHeight: { xs: activeVisualType === 'table' ? 260 : 220, lg: 360 },
                maxHeight: { lg: 520 },
                border: '1px solid #e5eaf2',
                borderRadius: '8px',
                bgcolor: '#fbfcfe',
                overflow: 'hidden',
                p: 1,
              }}
            >
              {activePreviewData.length > 0 ? (
                <PreviewWidget visualConfig={activePreviewConfig} data={activePreviewData} />
              ) : (
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>미리보기 데이터가 없습니다.</Typography>
                </Box>
              )}
            </Box>
          </Section>
        </Box>
      </Box>
    </Stack>
  );

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        sx={{
          minHeight: 42,
          borderBottom: '1px solid #e5eaf2',
          bgcolor: '#fff',
          px: 2.5,
          '& .MuiTab-root': { minHeight: 42, fontSize: 13, fontWeight: 800, textTransform: 'none' },
        }}
      >
        <Tab label="기본/데이터 설정" />
        <Tab label="시각화 설정" />
      </Tabs>
      <Box sx={{ p: 2.5 }}>
        {activeTab === 0 ? tabOne : tabTwo}
      </Box>
    </Box>
  );

  if (hideHeader) {
    return content;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid #fed7aa', bgcolor: '#fff7ed', flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <EditIcon sx={{ fontSize: 16, color: '#ea580c' }} />
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#ea580c' }}>편집 모드</Typography>
            <Typography sx={{ fontSize: 12, color: '#9a3412' }}>- {widget?.title}</Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              onClick={onCancel}
              sx={{ fontSize: 11, height: 28, borderColor: '#fdba74', color: '#ea580c', '&:hover': { borderColor: '#ea580c' } }}
            >
              취소
            </Button>
            <Button
              size="small"
              variant="contained"
              disableElevation
              onClick={handleSave}
              disabled={saving}
              sx={{ fontSize: 11, height: 28, bgcolor: '#ea580c', '&:hover': { bgcolor: '#c2410c' } }}
            >
              {saving ? '저장 중...' : '위젯 업데이트'}
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>{content}</Box>
    </Box>
  );
});

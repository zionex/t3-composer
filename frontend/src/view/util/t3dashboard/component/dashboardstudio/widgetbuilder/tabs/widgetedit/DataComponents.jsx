import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { FIELD_SX, SourceTypeChip, SmallCountChip, ColumnSelect, MultiColumnSelect } from './WidgetEditShared';
import dashboardConfig from '../../../core/dashboardConfig';
import { moduleColor } from '../direct/steps/wizardConstants';

const MERGE_TYPE_OPTIONS = [
  { value: 'LEFT_JOIN', label: 'LEFT JOIN', color: '#2563eb' },
  { value: 'INNER_JOIN', label: 'INNER JOIN', color: '#7c3aed' },
  { value: 'UNION', label: 'UNION', color: '#059669' },
];

const OPERATOR_OPTIONS = ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN'];
const DIRECTION_OPTIONS = ['ASC', 'DESC'];

function normalizeSourceType(type) {
  if (type === 'TABLE') return 'TABLE';
  if (type === 'VIEW') return 'VIEW';
  return 'TABLE';
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

function normalizeTableConfig(ds) {
  return {
    columns: [],
    whereConditions: [],
    orderBy: [],
    topN: dashboardConfig.tableTopN,
    ...(ds.tableConfig ?? {}),
  };
}

function columnsFromRows(rows = []) {
  const unique = (values) => [...new Set(values.filter(Boolean))];
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
    .filter((ds) => !['TABLE', 'VIEW'].includes(normalizeSourceType(ds.sourceType)))
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
        설정된 조회 파라미터가 없습니다.
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
              <SmallCountChip label={extraParams.length + '개'} />
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
            UNION은 조인 조건 없이 선택한 소스의 결과를 수직으로 합칩니다.
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
          label={selectedColumns.length ? String(selectedColumns.length) + ' selected' : 'SELECT *'}
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
                { id: 'wc_' + Date.now(), column: columns[0] ?? '', operator: '=', fixedValue: '', mappingType: 'FIXED_VALUE' },
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
              key={(order.column || 'order') + '-' + index}
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
              <SmallCountChip label={(columnsBySource[ds.id]?.length ?? 0) + ' columns'} color="#0891b2" />
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

export { DataPreviewTable, ParameterAccordion, DataSourceList, MergeSettings, TableConditionEditor, TableConditionSection };

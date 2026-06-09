import React, { useEffect, useState } from 'react';
import {
  Accordion, AccordionDetails, AccordionSummary,
  Autocomplete, Box, Chip, CircularProgress, Stack, TextField, Typography,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TableChartIcon from '@mui/icons-material/TableChart';
import TuneIcon from '@mui/icons-material/Tune';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { FIELD_SX, SECTION_LABEL_SX } from './wizardConstants';
import { fetchDistinctValues, fetchDateRange } from './dataSourceApi';
import { normalizeParameterMappings } from '../../../../generic/widgetSpecAdapter';

const PARAM_GRID_SX = {
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    md: 'repeat(auto-fit, minmax(440px, 1fr))',
  },
  gap: 1,
};

const PARAM_CARD_SX = {
  border: '1px solid #e5eaf2',
  borderRadius: '8px',
  p: 1,
  bgcolor: '#fff',
  minWidth: 0,
  display: 'grid',
  gap: 1,
  alignItems: 'center',
};

const PARAM_CARD_2COL = {
  xs: '1fr',
  sm: 'minmax(130px, 0.7fr) minmax(260px, 1fr)',
};

function tableWhereToParams(tableConfig) {
  return (tableConfig?.whereConditions ?? [])
    .filter((c) => c.mappingType !== 'FIXED_VALUE' && c.mappingType !== 'UNUSED')
    .map((c) => ({
      paramName: c.paramName || c.column,
      dataType: 'STRING',
      required: false,
      description: `WHERE ${c.column} = ?`,
      _tableWhere: true,
      _condId: c.id,
    }));
}

function paramsForSource(ds) {
  if (['TABLE', 'VIEW'].includes(ds.sourceType)) return tableWhereToParams(ds.tableConfig);
  return ds.params ?? [];
}

function normalizeParamName(name) {
  return String(name ?? '').replace(/^@/, '');
}

function sourceIdsForMapping(pm) {
  if (Array.isArray(pm?.sources) && pm.sources.length > 0) {
    return pm.sources.map(String);
  }
  if (Array.isArray(pm?.sourceIds) && pm.sourceIds.length > 0) {
    return pm.sourceIds.map(String);
  }
  if (Array.isArray(pm?.dataSourceIds) && pm.dataSourceIds.length > 0) {
    return pm.dataSourceIds.map(String);
  }
  if (pm?.dataSourceId) return [String(pm.dataSourceId)];
  return [];
}

function paramMappingKey(pm) {
  const name = normalizeParamName(pm?.paramName);
  const sourceIds = sourceIdsForMapping(pm).sort().join(',');
  return `${pm?.scope ?? 'DATA_SOURCE'}:${name}:${sourceIds}`;
}

function sameParamMapping(a, b) {
  if (normalizeParamName(a?.paramName) !== normalizeParamName(b?.paramName)) return false;

  const aSources = sourceIdsForMapping(a);
  const bSources = sourceIdsForMapping(b);
  if (aSources.length > 0 && bSources.length > 0) {
    return aSources.some((id) => bSources.includes(id));
  }

  return (a?.scope ?? '') === (b?.scope ?? '');
}

function createParamMapping(param, sourceId) {
  return {
    paramName:     normalizeParamName(param.paramName),
    dataType:      param.dataType,
    required:      param.required,
    description:   param.description,
    defaultValue:  param.defaultValue ?? '',
    testValue:     param.defaultValue ?? '',
    lookup:        param.lookup,
    staticOptions: param.staticOptions,
    from:          'fixed',
    value:         param.defaultValue ?? '',
    sources:       [sourceId],
    scope:         'DATA_SOURCE',
    dataSourceId:  sourceId,
  };
}

function buildParams(dataSources) {
  return dataSources.flatMap((ds) =>
    paramsForSource(ds).map((param) =>
      createParamMapping(
        { ...param, paramName: normalizeParamName(param.paramName) },
        ds.id
      )
    )
  );
}

function ParamLabel({ pm }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap" sx={{ minWidth: 0 }}>
        <Typography sx={{ minWidth: 0, fontSize: 12, fontWeight: 800, color: '#1e293b' }} noWrap title={pm.paramName}>
          {pm.paramName}
        </Typography>
        {pm.required && (
          <Chip label="필수" size="small"
            sx={{ height: 16, fontSize: 9, backgroundColor: '#fef2f2', color: '#ef4444' }} />
        )}
        <Chip label={pm.dataType} size="small"
          sx={{ height: 16, fontSize: 9, backgroundColor: '#f1f5f9', color: '#64748b' }} />
      </Stack>
    </Box>
  );
}

// Test-mode input components

function SelectParamContent({ pm, onChange }) {
  const [options, setOptions] = useState(pm.staticOptions ?? []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pm.staticOptions || !pm.lookup) return;
    setLoading(true);
    fetchDistinctValues(pm.lookup)
      .then(setOptions)
      .finally(() => setLoading(false));
  }, [pm.lookup?.table, pm.lookup?.column]);

  return (
    <Autocomplete
      sx={{ minWidth: 0 }}
      size="small"
      freeSolo
      forcePopupIcon
      openOnFocus
      popupIcon={<ArrowDropDownIcon sx={{ color: '#64748b' }} />}
      options={options}
      value={pm.testValue ?? ''}
      loading={loading}
      onChange={(_, newVal) => onChange(pm.paramName, newVal ?? '')}
      onInputChange={(_, newVal, reason) => {
        if (reason === 'input') onChange(pm.paramName, newVal);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          sx={FIELD_SX}
          error={pm.required && !String(pm.testValue ?? '').trim()}
          placeholder={loading ? '옵션 불러오는 중...' : '선택 또는 입력'}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading && <CircularProgress size={12} sx={{ mr: 0.5 }} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

function DateParamContent({ pm, onChange }) {
  const [minDate, setMinDate] = useState(null);
  const [maxDate, setMaxDate] = useState(null);

  useEffect(() => {
    if (!pm.lookup) return;
    fetchDateRange(pm.lookup).then(({ min_val, max_val }) => {
      if (min_val) setMinDate(dayjs(min_val));
      if (max_val) setMaxDate(dayjs(max_val));
    });
  }, [pm.lookup?.table, pm.lookup?.column]);

  const dayjsValue = pm.testValue ? dayjs(pm.testValue) : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        value={dayjsValue}
        minDate={minDate ?? undefined}
        maxDate={maxDate ?? undefined}
        onChange={(val) => onChange(pm.paramName, val ? val.format('YYYY-MM-DD') : '')}
        slotProps={{
          textField: {
            size: 'small',
            error: pm.required && !String(pm.testValue ?? '').trim(),
            sx: { minWidth: 0, ...FIELD_SX },
          },
        }}
        format="YYYY-MM-DD"
      />
    </LocalizationProvider>
  );
}

function TextParamContent({ pm, onChange }) {
  const placeholder =
    pm.dataType === 'NUMBER' || pm.dataType === 'INTEGER'
      ? '예: 100'
      : pm.defaultValue
      ? `예: ${pm.defaultValue}`
      : `예: ${pm.paramName.replace(/^P_/, '').toLowerCase()}`;

  return (
    <TextField
      size="small"
      value={pm.testValue ?? ''}
      onChange={(e) => onChange(pm.paramName, e.target.value)}
      placeholder={placeholder}
      error={pm.required && !String(pm.testValue ?? '').trim()}
      type={pm.dataType === 'NUMBER' || pm.dataType === 'INTEGER' ? 'number' : 'text'}
      sx={{ minWidth: 0, ...FIELD_SX }}
    />
  );
}

function ParamInputContent({ pm, onChange }) {
  if (pm.dataType === 'DATE') return <DateParamContent pm={pm} onChange={onChange} />;
  if (pm.staticOptions || pm.lookup) return <SelectParamContent pm={pm} onChange={onChange} />;
  return <TextParamContent pm={pm} onChange={onChange} />;
}

// Mapping-mode input components

function MappingParamContent({ pm, onChange }) {
  const value = pm.value ?? pm.testValue ?? pm.defaultValue ?? '';

  return (
    <TextField
      size="small"
      value={value}
      onChange={(e) => onChange(pm.paramName, {
        from: 'fixed',
        value: e.target.value,
        testValue: e.target.value,
      })}
      placeholder={pm.defaultValue ? `예: ${pm.defaultValue}` : `예: ${pm.paramName.replace(/^P_/, '').toLowerCase()}`}
      sx={{ minWidth: 0, ...FIELD_SX }}
    />
  );
}

// ParamRow / ParamGrid

function ParamRow({ pm, onTestChange, onMappingChange, mode, compact = false }) {
  return (
    <Box
      sx={{
        ...PARAM_CARD_SX,
        ...(compact
          ? {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: 0.75,
              overflow: 'hidden',
              '& .MuiFormControl-root, & .MuiAutocomplete-root': {
                width: '100%',
                minWidth: 0,
              },
              '& .MuiInputBase-root': {
                width: '100%',
                minWidth: 0,
              },
            }
          : { gridTemplateColumns: PARAM_CARD_2COL }),
      }}
    >
      <ParamLabel pm={pm} />
      {mode === 'mapping'
        ? <MappingParamContent pm={pm} onChange={(_, patch) => onMappingChange(pm, patch)} />
        : <ParamInputContent pm={pm} onChange={(_, value) => onTestChange(pm, value)} />
      }
    </Box>
  );
}

function ParamGrid({ params, onTestChange, onMappingChange, mode, compact = false }) {
  return (
    <Box sx={compact ? { display: 'grid', gridTemplateColumns: '1fr', gap: 0.75 } : PARAM_GRID_SX}>
      {params.map((pm) => (
        <ParamRow key={paramMappingKey(pm)} pm={pm} onTestChange={onTestChange} onMappingChange={onMappingChange} mode={mode} compact={compact} />
      ))}
    </Box>
  );
}

function hasParamValue(pm) {
  const value = pm.testValue ?? pm.value;
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function countMissingRequired(params) {
  return params.filter((pm) => pm.required && !hasParamValue(pm)).length;
}

function ParamAccordionSection({
  id,
  label,
  title,
  params,
  expanded,
  onToggle,
  onTestChange,
  onMappingChange,
  mode,
  compact,
}) {
  const missingCount = countMissingRequired(params);

  return (
    <Accordion
      disableGutters
      elevation={0}
      expanded={expanded}
      onChange={() => onToggle(id)}
      sx={{
        border: '1px solid #dbe6f3',
        borderRadius: '8px',
        bgcolor: '#fff',
        overflow: 'hidden',
        '&:before': { display: 'none' },
        '&.Mui-expanded': { my: 0 },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ width: 18, height: 18, color: '#475569' }} />}
        sx={{
          minHeight: 42,
          px: 1.25,
          bgcolor: '#fff',
          '&.Mui-expanded': { minHeight: 42 },
          '& .MuiAccordionSummary-content': {
            my: 0.75,
            minWidth: 0,
            alignItems: 'center',
          },
          '& .MuiAccordionSummary-content.Mui-expanded': { my: 0.75 },
        }}
      >
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ width: '100%', minWidth: 0, pr: 1 }}>
          <Typography
            sx={{ fontSize: 12, fontWeight: 900, color: '#1e293b', minWidth: 0, flex: 1 }}
            noWrap
            title={title}
          >
            {label}
          </Typography>
          <Chip
            size="small"
            label={`${params.length}개`}
            sx={{ height: 20, fontSize: 10, bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 800 }}
          />
          {missingCount > 0 && (
            <Chip
              size="small"
              label={`미입력 ${missingCount}`}
              sx={{ height: 20, fontSize: 10, bgcolor: '#fef2f2', color: '#ef4444', fontWeight: 800 }}
            />
          )}
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 1, pt: 0, bgcolor: '#fbfcfe' }}>
        <ParamGrid
          params={params}
          onTestChange={onTestChange}
          onMappingChange={onMappingChange}
          mode={mode}
          compact={compact}
        />
      </AccordionDetails>
    </Accordion>
  );
}

function EmptyStateCard({
  icon,
  chipLabel,
  chipColor = '#64748b',
  title,
  description,
  compact = false,
}) {
  if (compact) {
    return (
      <Box
        sx={{
          border: '1px solid #e5eaf2',
          borderRadius: '8px',
          backgroundColor: '#fff',
          p: 1.5,
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="flex-start">
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${chipColor}14`,
              color: chipColor,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            {chipLabel && (
              <Chip
                label={chipLabel}
                size="small"
                sx={{
                  height: 20,
                  mb: 0.75,
                  borderRadius: '5px',
                  backgroundColor: `${chipColor}18`,
                  color: chipColor,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />
            )}
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1e293b', mb: 0.35 }}>
              {title}
            </Typography>
            {description && (
              <Typography sx={{ fontSize: 11, lineHeight: 1.6, color: '#64748b' }}>
                {description}
              </Typography>
            )}
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: 360,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          width: 420,
          maxWidth: '100%',
          border: '1px solid #e5eaf2',
          borderRadius: '8px',
          backgroundColor: '#fff',
          p: 3,
          textAlign: 'center',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            mx: 'auto',
            mb: 1.25,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${chipColor}14`,
            color: chipColor,
          }}
        >
          {icon}
        </Box>
        {chipLabel && (
          <Chip
            label={chipLabel}
            size="small"
            sx={{
              height: 22,
              mb: 1,
              borderRadius: '5px',
              backgroundColor: `${chipColor}18`,
              color: chipColor,
              fontSize: 11,
              fontWeight: 700,
            }}
          />
        )}
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1e293b', mb: 0.75 }}>
          {title}
        </Typography>
        {description && (
          <Typography sx={{ fontSize: 12, lineHeight: 1.7, color: '#64748b' }}>
            {description}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// Main export
// mode='test'    : testValue input for test execution
// mode='mapping' : fixed parameter mapping for dashboard data sources
export default function Step2_ParamMapping({ draft, onDraftChange, compact = false, hideEmpty = false, mode = 'test' }) {
  const dataSources = draft?.dataSources ?? [];
  const parameterMappings = normalizeParameterMappings(draft?.parameterMappings ?? [], dataSources);
  const [expandedSourceIds, setExpandedSourceIds] = useState([]);
  const sourceParamSections = dataSources
    .map((ds, index) => ({
      ds,
      index,
      params: parameterMappings.filter(
        (pm) => pm.scope === 'DATA_SOURCE' && pm.dataSourceId === ds.id
      ),
    }))
    .filter((section) => section.params.length > 0);
  const accordionShapeKey = [
    mode,
    sourceParamSections.map((section) => `${section.ds.id}:${section.params.length}`).join('|'),
  ].join(':');

  useEffect(() => {
    if (dataSources.length === 0) return;
    const initial = buildParams(dataSources);
    const existingMappings = normalizeParameterMappings(draft?.parameterMappings ?? [], dataSources);
    const merged = initial.map((ip) => {
      const initialKey = paramMappingKey(ip);
      const existing =
        existingMappings.find((ep) => paramMappingKey(ep) === initialKey) ??
        existingMappings.find((ep) => sameParamMapping(ep, ip));
      if (!existing) return ip;
      return {
        ...ip,
        testValue: existing.testValue,
        from:      'fixed',
        value:     existing.value    ?? ip.value,
      };
    });
    onDraftChange({ parameterMappings: merged });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSources.map((d) =>
    ['TABLE', 'VIEW'].includes(d.sourceType)
      ? `${d.id}:tbl:${(d.tableConfig?.whereConditions ?? []).length}`
      : `${d.id}:${d.params?.length ?? 0}`
  ).join(',')]);

  // mode='test': update testValue and keep value in sync for fixed mappings.
  useEffect(() => {
    if (mode !== 'test' || dataSources.length <= 1) return;

    const validIds = [
      ...sourceParamSections.map((section) => section.ds.id),
    ];
    const firstSourceId = sourceParamSections[0]?.ds.id;
    const defaultIds = [
      ...(firstSourceId ? [firstSourceId] : []),
    ];

    setExpandedSourceIds((prev) => {
      const retained = prev.filter((id) => validIds.includes(id));
      const next = retained.length > 0 ? [...retained] : [];

      if (next.length === 0) {
        defaultIds.forEach((id) => {
          if (!next.includes(id)) next.push(id);
        });
      }

      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accordionShapeKey]);

  function updateTestValue(target, value) {
    onDraftChange({
      parameterMappings: parameterMappings.map((pm) => {
        if (!sameParamMapping(pm, target)) return pm;
        return { ...pm, from: 'fixed', testValue: value, value };
      }),
    });
  }

  // mode='mapping': update fixed value.
  function updateMapping(target, patch) {
    onDraftChange({
      parameterMappings: parameterMappings.map((pm) =>
        sameParamMapping(pm, target) ? { ...pm, ...patch } : pm
      ),
    });
  }

  function toggleParamSection(id) {
    setExpandedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((expandedId) => expandedId !== id) : [...prev, id]
    );
  }

  if (dataSources.length === 0) {
    if (hideEmpty) return null;
    return (
      <EmptyStateCard
        icon={<InfoOutlinedIcon sx={{ width: 24, height: 24 }} />}
        chipLabel="데이터 소스"
        title="선택된 데이터 소스가 없습니다"
      />
    );
  }

  if (parameterMappings.length === 0) {
    if (hideEmpty) return null;
    const allQuerySource = dataSources.every((ds) => ['TABLE', 'VIEW'].includes(ds.sourceType));
    const hasQuerySource = dataSources.some((ds) => ['TABLE', 'VIEW'].includes(ds.sourceType));
    return (
      <EmptyStateCard
        icon={
          allQuerySource
            ? <TableChartIcon sx={{ width: 24, height: 24 }} />
            : <TuneIcon sx={{ width: 24, height: 24 }} />
        }
        chipLabel={allQuerySource ? 'QUERY' : hasQuerySource ? 'QUERY 포함' : 'VIEW'}
        chipColor={allQuerySource ? '#f59e0b' : '#3b82f6'}
        title={allQuerySource ? '매핑할 파라미터가 없습니다' : '입력값 없이 조회되는 소스입니다'}
        compact={compact}
      />
    );
  }

  if (dataSources.length === 1) {
    return (
      <ParamGrid
        params={parameterMappings}
        onTestChange={updateTestValue}
        onMappingChange={updateMapping}
        mode={mode}
        compact={compact}
      />
    );
  }

  // Multiple sources: render each parameter under its owning source.
  if (mode !== 'test') {
    return (
      <Stack spacing={2}>
        {sourceParamSections.map(({ ds, params }) => (
          <Box key={ds.id}>
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.75 }}>
              <Typography component="span" sx={SECTION_LABEL_SX}>{ds.sourceName}</Typography>
            </Stack>
            <ParamGrid
              params={params}
              onTestChange={updateTestValue}
              onMappingChange={updateMapping}
              mode={mode}
              compact={compact}
            />
          </Box>
        ))}
      </Stack>
    );
  }

  if (mode === 'test') {
    return (
      <Stack spacing={1}>
        {sourceParamSections.map(({ ds, index, params }) => (
          <ParamAccordionSection
            key={ds.id}
            id={ds.id}
            label={`#${index + 1} ${ds.sourceName}`}
            title={ds.sourceName}
            params={params}
            expanded={expandedSourceIds.includes(ds.id)}
            onToggle={toggleParamSection}
            onTestChange={updateTestValue}
            onMappingChange={updateMapping}
            mode={mode}
            compact={compact}
          />
        ))}
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {dataSources.map((ds) => {
        const dsParams = parameterMappings.filter(
          (pm) => pm.scope === 'DATA_SOURCE' && pm.dataSourceId === ds.id
        );
        if (dsParams.length === 0) return null;
        return (
          <Box key={ds.id}>
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.75 }}>
              <Typography component="span" sx={SECTION_LABEL_SX}>{ds.sourceName}</Typography>
            </Stack>
            <ParamGrid
              params={dsParams}
              onTestChange={updateTestValue}
              onMappingChange={updateMapping}
              mode={mode}
              compact={compact}
            />
          </Box>
        );
      })}
    </Stack>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import {
  Accordion, AccordionDetails, AccordionSummary,
  Box, Button, Chip, MenuItem, Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { SourceTypeChip, ModuleChip } from '../DirectSourcePanel';
import TableQueryConfig from './TableQueryConfig';
import {
  FIELD_SX,
} from './wizardConstants';
import dashboardConfig from '../../../../core/dashboardConfig';

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
  const sourceIds = sourceIdsForMapping(pm).sort().join(',');
  return `${pm?.scope ?? 'DATA_SOURCE'}:${normalizeParamName(pm?.paramName)}:${sourceIds}`;
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

function mappingAppliesToSource(pm, sourceId) {
  const sourceIds = sourceIdsForMapping(pm);
  if (sourceIds.length > 0) return sourceIds.includes(String(sourceId));
  return String(pm?.dataSourceId ?? '') === String(sourceId);
}

const MERGE_TYPES = [
  { value: 'LEFT_JOIN',   label: 'LEFT JOIN' },
  { value: 'INNER_JOIN',  label: 'INNER JOIN' },
  { value: 'UNION',       label: 'UNION' },
];

// Simple preview table

function SampleTable({ columns, rows }) {
  if (!columns || !columns.length) return null;
  return (
    <Box sx={{ overflow: 'auto', border: '1px solid #e5eaf2', borderRadius: '6px', bgcolor: '#fff', maxHeight: 320 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 11 }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc' }}>
            {columns.map((col) => (
              <th key={col} style={{ position: 'sticky', top: 0, zIndex: 1, padding: '5px 8px', borderBottom: '1px solid #e5eaf2', textAlign: 'left', color: '#475569', fontWeight: 700, whiteSpace: 'nowrap', backgroundColor: '#f8fafc' }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(rows ?? []).slice(0, 50).map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
              {columns.map((col) => (
                <td key={col} style={{ padding: '4px 8px', color: '#334155', whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {row[col] == null ? <span style={{ color: '#94a3b8' }}>null</span> : String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

function PreviewTabContent({ result, onRun, runLabel = '테스트 실행' }) {
  return (
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          데이터 미리보기
        </Typography>
        <Button
          size="small"
          variant="contained"
          startIcon={result?.loading ? null : <PlayArrowIcon sx={{ width: 14, height: 14 }} />}
          disabled={!!result?.loading}
          onClick={onRun}
          sx={{ fontSize: 10, fontWeight: 800, textTransform: 'none', borderRadius: '6px', py: 0.3, px: 1 }}
        >
          {result?.loading ? '실행 중...' : runLabel}
        </Button>
      </Stack>

      {result?.error && (
        <Box sx={{ border: '1px solid #fca5a5', borderRadius: '6px', p: 1.25, bgcolor: '#fef2f2' }}>
          <Typography sx={{ fontSize: 11, color: '#dc2626' }}>{result.error}</Typography>
        </Box>
      )}

      {result?.executed && !result?.error && (
        <Stack spacing={0.75}>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Chip size="small" label={`${(result.rows ?? []).length}행`}
              sx={{ height: 18, fontSize: 10, bgcolor: '#ecfdf5', color: '#059669', fontWeight: 800 }} />
            <Chip size="small" label={`${(result.columns ?? []).length}컬럼`}
              sx={{ height: 18, fontSize: 10, bgcolor: '#eff6ff', color: '#2563eb' }} />
          </Stack>
          {(result.rows ?? []).length > 0
            ? <SampleTable columns={result.columns ?? []} rows={result.rows ?? []} />
            : (
              <Box sx={{ border: '1px dashed #cbd5e1', borderRadius: '8px', p: 1.5, bgcolor: '#fafbfc' }}>
                <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>조회 결과가 없습니다.</Typography>
              </Box>
            )
          }
        </Stack>
      )}

      {!result?.executed && !result?.loading && (
        <Box sx={{ border: '1px dashed #cbd5e1', borderRadius: '8px', p: 1.5, bgcolor: '#fafbfc' }}>
          <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>
            버튼을 눌러 현재 파라미터 설정으로 데이터를 미리 확인할 수 있습니다.
          </Typography>
        </Box>
      )}
    </Stack>
  );
}

// Param mapping row

function MappingParamContent({ pm, onChange }) {
  const value = pm.value ?? pm.testValue ?? pm.defaultValue ?? '';

  return (
    <TextField
      size="small"
      value={value}
      onChange={(e) => onChange({
        from: 'fixed',
        value: e.target.value,
        testValue: e.target.value,
      })}
      placeholder={pm.defaultValue ? String(pm.defaultValue) : ''}
      sx={FIELD_SX}
    />
  );
}

function ParamRow({ pm, onParamChange }) {
  return (
    <Box sx={{ border: '1px solid #e5eaf2', borderRadius: '8px', p: 1.25, bgcolor: '#fff' }}>
      <Stack direction="row" alignItems="flex-start" spacing={1.5}>
        <Box sx={{ width: 160, flexShrink: 0 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#1e293b', mb: 0.5 }}>
            {pm.paramName}
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {pm.required && (
              <Chip size="small" label="필수"
                sx={{ height: 17, fontSize: 9, bgcolor: '#fef2f2', color: '#dc2626', fontWeight: 700 }} />
            )}
            {pm.dataType && (
              <Chip size="small" label={pm.dataType}
                sx={{ height: 17, fontSize: 9, bgcolor: '#f8fafc', color: '#64748b' }} />
            )}
          </Stack>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <MappingParamContent pm={pm} onChange={(patch) => onParamChange(pm, patch)} />
        </Box>
      </Stack>
    </Box>
  );
}

function hasParamValue(pm) {
  const value = pm.value ?? pm.testValue ?? pm.defaultValue;
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function ParamSection({
  title,
  params,
  parameterMappings,
  onDraftChange,
  defaultExpanded = true,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!params.length) return null;

  function handleParamChange(target, patch) {
    const next = parameterMappings.map((pm) =>
      sameParamMapping(pm, target) && params.some((p) => sameParamMapping(p, target))
        ? { ...pm, ...patch }
        : pm
    );
    onDraftChange({ parameterMappings: next });
  }

  const missingCount = params.filter((pm) => pm.required && !hasParamValue(pm)).length;

  return (
    <Accordion
      disableGutters
      elevation={0}
      expanded={expanded}
      onChange={() => setExpanded((prev) => !prev)}
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
            {title ?? '파라미터'}
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
        <Stack spacing={0.75}>
          {params.map((pm) => (
            <ParamRow key={paramMappingKey(pm)} pm={pm} onParamChange={handleParamChange} />
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

// Source target panel: table settings, parameters, and data preview

function SourceTargetPanel({ target, draft, onDraftChange, testResults, onRunTest }) {
  const ds = target.dataSources[0];
  const params = useMemo(() => {
    if (!ds) return [];
    return draft.parameterMappings.filter(
      (pm) => mappingAppliesToSource(pm, ds.id)
    );
  }, [draft.parameterMappings, ds?.id]);
  const hasParams = params.length > 0;
  const isQuerySource = ['TABLE', 'VIEW'].includes(ds?.sourceType);
  const defaultTab = isQuerySource ? 'table' : hasParams ? 'params' : 'preview';
  const [activeTab, setActiveTab] = useState(defaultTab);
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab, ds?.id]);

  if (!ds) return null;

  const result = testResults?.[ds.id];
  const previewRowCount = (result?.rows ?? []).length;

  function patchSource(patch) {
    onDraftChange({
      dataSources: draft.dataSources.map((item) =>
        item.id === ds.id ? { ...item, ...patch } : item
      ),
    });
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Source header */}
      <Box sx={{ px: 1.5, pt: 1.25, pb: 1, borderBottom: '1px solid #eef2f7', bgcolor: '#fff', flexShrink: 0 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
          <SourceTypeChip value={ds.sourceType} />
          {ds.module && <ModuleChip value={ds.module} />}
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }} noWrap title={ds.sourceName}>
            {ds.sourceName}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography sx={{ fontSize: 10, color: '#64748b' }}>데이터 구성</Typography>
          <Chip size="small" label="개별 위젯"
            sx={{ height: 18, fontSize: 10, bgcolor: '#f0fdf4', color: '#16a34a', fontWeight: 700 }} />
        </Stack>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{
          minHeight: 36, flexShrink: 0,
          borderBottom: '1px solid #eef2f7', bgcolor: '#fff',
          '& .MuiTab-root': { minHeight: 36, fontSize: 12, textTransform: 'none', py: 0, fontWeight: 700 },
          '& .MuiTabs-indicator': { height: 2 },
        }}
      >
        {isQuerySource && (
          <Tab value="table" label="조회 설정" />
        )}
        {hasParams && (
          <Tab value="params" label={`파라미터 (${params.length})`} />
        )}
        <Tab value="preview" label={result?.executed ? `데이터 미리보기 (${previewRowCount}행)` : '데이터 미리보기'} />
      </Tabs>

      {/* Tab content */}
      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {activeTab === 'table' && isQuerySource && (
          <Box sx={{ p: 1.5 }}>
            <TableQueryConfig ds={ds} onPatch={patchSource} />
          </Box>
        )}

        {activeTab === 'params' && (
          <Box sx={{ p: 1.5 }}>
            {params.length > 0 ? (
              <ParamSection
                title="파라미터 매핑"
                params={params}
                parameterMappings={draft.parameterMappings}
                onDraftChange={onDraftChange}
              />
            ) : (
              <Box sx={{ border: '1px dashed #cbd5e1', borderRadius: '8px', p: 1.5, bgcolor: '#fafbfc' }}>
                <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>이 소스에는 파라미터가 없습니다.</Typography>
              </Box>
            )}
          </Box>
        )}

        {activeTab === 'preview' && (
          <Box sx={{ p: 1.5 }}>
            <PreviewTabContent
              result={result}
              onRun={() => onRunTest?.(ds)}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}

// Merged target panel: merge settings, parameters, and data preview

function MergedTargetPanel({ target, draft, onDraftChange, testResults, onRunTest, onRunMerged }) {
  const [activeTab, setActiveTab] = useState('settings');
  const mc = draft.mergeConfig ?? {};
  const mergeGroups = mc.mergeGroups ?? [];
  const group = mergeGroups.find((g) => g.id === target.id);
  const dataSourceById = useMemo(
    () => Object.fromEntries(draft.dataSources.map((ds) => [ds.id, ds])),
    [draft.dataSources]
  );

  if (!group) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>병합 그룹 정보를 찾을 수 없습니다.</Typography>
      </Box>
    );
  }

  const groupSources = group.sourceIds.map((id) => dataSourceById[id]).filter(Boolean);
  const tableSources = groupSources.filter((ds) => ['TABLE', 'VIEW'].includes(ds.sourceType));
  const visibleActiveTab = activeTab === 'table' && tableSources.length === 0 ? 'settings' : activeTab;
  const mergeType = group.type ?? dashboardConfig.defaultMergeType;
  const relationships = group.relationships ?? [];
  const mergeResult = testResults?.[group.id];
  const mergePreviewRowCount = (mergeResult?.rows ?? []).length;

  function columnsFor(sourceId) {
    return testResults?.[sourceId]?.columns ?? [];
  }

  function patchGroup(patch) {
    const nextGroups = mergeGroups.map((g) =>
      g.id === group.id ? { ...g, ...patch } : g
    );
    onDraftChange({ mergeConfig: { ...mc, mergeGroups: nextGroups } });
  }

  function patchSource(sourceId, patch) {
    onDraftChange({
      dataSources: draft.dataSources.map((item) =>
        item.id === sourceId ? { ...item, ...patch } : item
      ),
    });
  }

  function patchRel(index, patch) {
    patchGroup({
      relationships: relationships.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    });
  }

  function addRel() {
    const seed = {
      leftDsId: group.baseSourceId ?? group.sourceIds[0] ?? '',
      leftCol: '',
      rightDsId: group.sourceIds.find((id) => id !== (group.baseSourceId ?? group.sourceIds[0])) ?? '',
      rightCol: '',
    };
    patchGroup({ relationships: [...relationships, seed] });
  }

  function removeRel(index) {
    patchGroup({ relationships: relationships.filter((_, i) => i !== index) });
  }

  async function handleRunMergedTest() {
    if (mergeType === 'UNION') {
      await Promise.all(groupSources.map((ds) => onRunTest?.(ds)));
    }
    onRunMerged?.({
      type: mergeType,
      sourceIds: group.sourceIds,
      relationships: group.relationships ?? [],
    }, group.id);
  }

  const allDsParams = groupSources.flatMap((ds) =>
    draft.parameterMappings.filter((pm) => mappingAppliesToSource(pm, ds.id))
  );
  const totalParams = allDsParams.length;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* Group header */}
      <Box sx={{ px: 1.5, pt: 1.25, pb: 1, borderBottom: '1px solid #eef2f7', bgcolor: '#fff', flexShrink: 0 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
          <MergeTypeIcon sx={{ width: 16, height: 16, color: '#1976d2' }} />
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>
            {group.name ?? target.label}
          </Typography>
        </Stack>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {groupSources.map((ds, index) => (
            <React.Fragment key={ds.id}>
              {index > 0 && (
                <Typography sx={{ fontSize: 13, color: '#94a3b8', fontWeight: 800, lineHeight: '24px' }}>+</Typography>
              )}
              <Chip
                label={ds.sourceName} size="small"
                sx={{ borderRadius: '6px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700 }}
              />
            </React.Fragment>
          ))}
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={visibleActiveTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{
          minHeight: 36,
          flexShrink: 0,
          borderBottom: '1px solid #eef2f7',
          bgcolor: '#fff',
          '& .MuiTab-root': { minHeight: 36, fontSize: 12, textTransform: 'none', py: 0, fontWeight: 700 },
          '& .MuiTabs-indicator': { height: 2 },
        }}
      >
        <Tab value="settings" label="병합 설정" />
        {tableSources.length > 0 && (
          <Tab value="table" label={tableSources.length > 1 ? `테이블 설정 (${tableSources.length})` : '테이블 설정'} />
        )}
        <Tab value="params" label={totalParams > 0 ? `파라미터 (${totalParams})` : '파라미터'} />
        <Tab value="preview" label={mergeResult?.executed ? `데이터 미리보기 (${mergePreviewRowCount}행)` : '데이터 미리보기'} />
      </Tabs>

      {/* Tab content */}
      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>

        {/* Merge settings */}
        {visibleActiveTab === 'settings' && (
          <Stack spacing={1.25} sx={{ p: 1.5 }}>

            {/* Merge type segmented control */}
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                병합 방식
              </Typography>
              <Box sx={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                {MERGE_TYPES.map((type, idx) => (
                  <Button
                    key={type.value}
                    onClick={() => patchGroup({
                      type: type.value,
                      relationships: type.value === 'UNION'
                        ? []
                        : (relationships.length ? relationships : [{ leftDsId: group.sourceIds[0], leftCol: '', rightDsId: group.sourceIds[1] ?? '', rightCol: '' }]),
                    })}
                    sx={{
                      flex: 1, minWidth: 0, height: 30, borderRadius: 0,
                      borderRight: idx < MERGE_TYPES.length - 1 ? '1px solid #e2e8f0' : 'none',
                      fontSize: 11, fontWeight: mergeType === type.value ? 900 : 700,
                      textTransform: 'none',
                      color: mergeType === type.value ? '#fff' : '#475569',
                      bgcolor: mergeType === type.value ? '#1976d2' : 'transparent',
                      '&:hover': { bgcolor: mergeType === type.value ? '#1565c0' : '#f1f5f9' },
                    }}
                  >
                    {type.label}
                  </Button>
                ))}
              </Box>
            </Box>

            {/* Base source and join conditions */}
            {mergeType !== 'UNION' && (
              <>
                <TextField
                  select label="기준 소스" size="small"
                  sx={{ ...FIELD_SX, width: '100%' }}
                  value={group.baseSourceId ?? group.sourceIds[0] ?? ''}
                  onChange={(e) => patchGroup({ baseSourceId: e.target.value })}
                >
                  {groupSources.map((ds) => (
                    <MenuItem key={ds.id} value={ds.id} sx={{ fontSize: 11 }}>{ds.sourceName}</MenuItem>
                  ))}
                </TextField>

                <Box>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      연결 조건
                    </Typography>
                    <Button size="small" variant="outlined" onClick={addRel}
                      sx={{ fontSize: 10, textTransform: 'none', borderRadius: '6px', py: 0.2, px: 1 }}>
                      + 조건 추가
                    </Button>
                  </Stack>
                  <Stack spacing={0.75}>
                    {relationships.length === 0 && (
                      <Box sx={{ border: '1px dashed #cbd5e1', borderRadius: '6px', p: 1.25, bgcolor: '#fafbfc' }}>
                        <Typography sx={{ fontSize: 11, color: '#64748b' }}>
                          조건을 추가해야 병합 결과를 확인할 수 있습니다.
                        </Typography>
                      </Box>
                    )}
                    {relationships.map((rel, i) => (
                      <Box key={i} sx={{ border: '1px solid #e5eaf2', borderRadius: '8px', p: 1, bgcolor: '#fff' }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 20px minmax(0,1fr)', gap: 0.5, alignItems: 'center', mb: 0.75 }}>
                          <TextField select size="small" label="왼쪽" sx={FIELD_SX}
                            value={rel.leftDsId ?? ''}
                            onChange={(e) => patchRel(i, { leftDsId: e.target.value, leftCol: '' })}>
                            {groupSources.map((ds) => (
                              <MenuItem key={ds.id} value={ds.id} sx={{ fontSize: 11 }}>{ds.sourceName}</MenuItem>
                            ))}
                          </TextField>
                          <Typography sx={{ fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>to</Typography>
                          <TextField select size="small" label="오른쪽" sx={FIELD_SX}
                            value={rel.rightDsId ?? ''}
                            onChange={(e) => patchRel(i, { rightDsId: e.target.value, rightCol: '' })}>
                            {groupSources.map((ds) => (
                              <MenuItem key={ds.id} value={ds.id} sx={{ fontSize: 11 }}>{ds.sourceName}</MenuItem>
                            ))}
                          </TextField>
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 20px minmax(0,1fr) 40px', gap: 0.5, alignItems: 'center' }}>
                          <TextField select size="small" label="컬럼" sx={FIELD_SX}
                            value={rel.leftCol ?? ''}
                            onChange={(e) => patchRel(i, { leftCol: e.target.value })}>
                            {columnsFor(rel.leftDsId).map((c) => (
                              <MenuItem key={c} value={c} sx={{ fontSize: 11 }}>{c}</MenuItem>
                            ))}
                          </TextField>
                          <Typography sx={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>=</Typography>
                          <TextField select size="small" label="컬럼" sx={FIELD_SX}
                            value={rel.rightCol ?? ''}
                            onChange={(e) => patchRel(i, { rightCol: e.target.value })}>
                            {columnsFor(rel.rightDsId).map((c) => (
                              <MenuItem key={c} value={c} sx={{ fontSize: 11 }}>{c}</MenuItem>
                            ))}
                          </TextField>
                          <Button variant="text" size="small" color="error" onClick={() => removeRel(i)}
                            sx={{ minWidth: 0, fontSize: 10, textTransform: 'none', p: 0.25 }}>
                            삭제
                          </Button>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </>
            )}

            {mergeType === 'UNION' && (
              <Box sx={{ border: '1px dashed #cbd5e1', borderRadius: '6px', p: 1.25, bgcolor: '#fafbfc' }}>
                <Typography sx={{ fontSize: 11, color: '#64748b' }}>
                  UNION은 연결 조건 없이 결과를 세로로 합칩니다.
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        {/* Table settings */}
        {visibleActiveTab === 'table' && (
          <Stack spacing={1} sx={{ p: 1.5 }}>
            {tableSources.map((ds, index) => (
              <Accordion
                key={ds.id}
                defaultExpanded={index === 0}
                disableGutters
                elevation={0}
                sx={{
                  border: '1px solid #dbeafe',
                  borderRadius: '8px',
                  bgcolor: '#fff',
                  overflow: 'hidden',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ width: 18, height: 18 }} />}
                  sx={{
                    minHeight: 38,
                    px: 1.25,
                    bgcolor: '#f8fbff',
                    '& .MuiAccordionSummary-content': { my: 0.75, minWidth: 0 },
                  }}
                >
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                    <SourceTypeChip value={ds.sourceType} />
                    {ds.module && <ModuleChip value={ds.module} />}
                    <Typography sx={{ fontSize: 12, fontWeight: 900, color: '#1e293b' }} noWrap title={ds.sourceName}>
                      {ds.sourceName}
                    </Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 1.5, pt: 0 }}>
                  <TableQueryConfig ds={ds} onPatch={(patch) => patchSource(ds.id, patch)} />
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        )}

        {/* Parameters */}
        {visibleActiveTab === 'params' && (
          <Stack spacing={1.5} sx={{ p: 1.5 }}>
            {groupSources.map((ds, index) => {
              const dsParams = draft.parameterMappings.filter((pm) => mappingAppliesToSource(pm, ds.id));
              if (!dsParams.length) return null;
              return (
                <ParamSection
                  key={ds.id}
                  title={`${ds.sourceName} 파라미터`}
                  params={dsParams}
                  parameterMappings={draft.parameterMappings}
                  onDraftChange={onDraftChange}
                  defaultExpanded={index === 0}
                />
              );
            })}

            {totalParams === 0 && (
              <Box sx={{ border: '1px dashed #cbd5e1', borderRadius: '8px', p: 1.5, bgcolor: '#fafbfc' }}>
                <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>이 병합 그룹에는 파라미터가 없습니다.</Typography>
              </Box>
            )}
          </Stack>
        )}

        {/* Data preview */}
        {visibleActiveTab === 'preview' && (
          <Box sx={{ p: 1.5 }}>
            <PreviewTabContent
              result={mergeResult}
              onRun={handleRunMergedTest}
              runLabel="병합 테스트 실행"
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}

// New merge group creation panel

function NewGroupPanel({ dataSources, onConfirm, onCancel }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const selectedSet = new Set(selectedIds);

  function toggle(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <Box sx={{ border: '1px solid #93c5fd', borderRadius: '8px', p: 1.25, bgcolor: '#f8fbff' }}>
      <Typography sx={{ fontSize: 12, fontWeight: 900, color: '#334155', mb: 0.75 }}>
        병합 그룹 생성
      </Typography>
      <Typography sx={{ fontSize: 11, color: '#64748b', mb: 1 }}>
        병합할 소스 2개 이상을 선택하세요.
      </Typography>
      <Stack spacing={0.5} sx={{ mb: 1 }}>
        {dataSources.map((ds) => (
          <Box
            key={ds.id}
            role="button"
            tabIndex={0}
            onClick={() => toggle(ds.id)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle(ds.id)}
            sx={{
              px: 1, py: 0.75,
              border: selectedSet.has(ds.id) ? '1px solid #93c5fd' : '1px solid #e5eaf2',
              borderRadius: '6px',
              bgcolor: selectedSet.has(ds.id) ? '#f0f9ff' : '#fff',
              cursor: 'pointer',
              outline: 'none',
              '&:hover': { bgcolor: '#f8fbff' },
              '&:focus-visible': { boxShadow: 'inset 0 0 0 2px rgba(25,118,210,0.35)' },
            }}
          >
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box sx={{
                width: 8, height: 8, borderRadius: '50%',
                bgcolor: selectedSet.has(ds.id) ? '#1976d2' : '#cbd5e1',
                flexShrink: 0,
              }} />
              <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{ds.sourceName}</Typography>
            </Stack>
          </Box>
        ))}
      </Stack>
      <Stack direction="row" spacing={0.75}>
        <Button
          size="small" variant="contained"
          disabled={selectedIds.length < 2}
          onClick={() => onConfirm(selectedIds)}
          sx={{ fontSize: 11, textTransform: 'none', borderRadius: '6px' }}
        >
          그룹 생성
        </Button>
        <Button
          size="small" variant="text"
          onClick={onCancel}
          sx={{ fontSize: 11, textTransform: 'none' }}
        >
          취소
        </Button>
      </Stack>
    </Box>
  );
}

// Left panel section header

function NewIndividualWidgetPanel({ dataSources, existingIds, onConfirm, onCancel }) {
  const availableSources = dataSources.filter((ds) => !existingIds.has(ds.id));

  return (
    <Box sx={{ border: '1px solid #93c5fd', borderRadius: '8px', p: 1.25, bgcolor: '#f8fbff' }}>
      <Typography sx={{ fontSize: 12, fontWeight: 900, color: '#334155', mb: 0.75 }}>
        개별 위젯 추가
      </Typography>
      <Typography sx={{ fontSize: 11, color: '#64748b', mb: 1 }}>
        위젯으로 구성할 데이터 소스를 선택하세요.
      </Typography>
      {availableSources.length > 0 ? (
        <Stack spacing={0.5}>
          {availableSources.map((ds) => (
            <Box
              key={ds.id}
              role="button"
              tabIndex={0}
              onClick={() => onConfirm(ds.id)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onConfirm(ds.id)}
              sx={{
                px: 1,
                py: 0.75,
                border: '1px solid #dbeafe',
                borderRadius: '6px',
                bgcolor: '#fff',
                cursor: 'pointer',
                outline: 'none',
                '&:hover': { bgcolor: '#eff6ff' },
                '&:focus-visible': { boxShadow: 'inset 0 0 0 2px rgba(25,118,210,0.35)' },
              }}
            >
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                <SourceTypeChip value={ds.sourceType} />
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#1e293b' }} noWrap title={ds.sourceName}>
                  {ds.sourceName}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : (
        <Typography sx={{ fontSize: 11, color: '#94a3b8', mb: 1 }}>
          추가 가능한 데이터 소스가 없습니다.
        </Typography>
      )}
      <Button
        size="small"
        variant="text"
        onClick={onCancel}
        sx={{ mt: 0.75, fontSize: 11, textTransform: 'none' }}
      >
        취소
      </Button>
    </Box>
  );
}

function SectionHeader({ label, count, tone = 'source' }) {
  const isWidget = tone === 'widget';
  return (
    <Stack
      direction="row" alignItems="center" justifyContent="space-between"
      sx={{
        px: 1.25,
        py: 0.75,
        bgcolor: isWidget ? '#eff6ff' : '#f8fafc',
        borderTop: isWidget ? '1px solid #bfdbfe' : 'none',
        borderBottom: isWidget ? '1px solid #bfdbfe' : '1px solid #eef2f7',
      }}
    >
      <Typography sx={{ fontSize: 11, fontWeight: 900, color: isWidget ? '#1d4ed8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </Typography>
      <Chip
        size="small"
        label={`${count}개`}
        sx={{ height: 16, fontSize: 9, bgcolor: isWidget ? '#dbeafe' : '#eef2ff', color: isWidget ? '#1d4ed8' : '#4f46e5', fontWeight: 800 }}
      />
    </Stack>
  );
}

export default function StepMapping({ draft, onDraftChange, testResults, onRunTest, onRunMerged }) {
  const mergeGroups = draft.mergeConfig?.mergeGroups ?? [];
  const [activeTargetId, setActiveTargetId] = useState(null);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showNewIndividual, setShowNewIndividual] = useState(false);

  const dataSources = draft.dataSources ?? [];
  const canAddGroup = dataSources.length >= 2;
  const knownIds = useMemo(() => new Set(dataSources.map((ds) => ds.id)), [dataSources]);
  const individualSourceIds = useMemo(() => {
    if (!Array.isArray(draft.mergeConfig?.individualSourceIds)) return [];
    return draft.mergeConfig.individualSourceIds.filter(
      (id, index, arr) => knownIds.has(id) && arr.indexOf(id) === index
    );
  }, [draft.mergeConfig?.individualSourceIds, knownIds]);
  const individualSet = useMemo(() => new Set(individualSourceIds), [individualSourceIds]);

  // Initialize to the first widget and recover invalid active ids.
  useEffect(() => {
    const firstWidgetId = individualSourceIds[0] ?? mergeGroups[0]?.id ?? null;
    if (!activeTargetId) {
      if (firstWidgetId) setActiveTargetId(firstWidgetId);
      return;
    }
    if (activeTargetId) {
      const stillValid =
        individualSet.has(activeTargetId) ||
        mergeGroups.some((g) => g.id === activeTargetId);
      if (!stillValid) setActiveTargetId(firstWidgetId);
    }
  }, [individualSourceIds, individualSet, mergeGroups, activeTargetId]);

  function countParamsForDs(dsId) {
    const all = draft.parameterMappings.filter(
      (pm) => mappingAppliesToSource(pm, dsId)
    );
    const done = all.filter((pm) => Boolean(pm.value ?? pm.testValue));
    return { done: done.length, total: all.length };
  }

  function countParamsForGroup(group) {
    const all = draft.parameterMappings.filter(
      (pm) => group.sourceIds.some((sourceId) => mappingAppliesToSource(pm, sourceId))
    );
    const done = all.filter((pm) => Boolean(pm.value ?? pm.testValue));
    return { done: done.length, total: all.length };
  }

  function handleCreateGroup(selectedIds) {
    const mc = draft.mergeConfig ?? {};
    const existingGroups = mc.mergeGroups ?? [];
    const index = existingGroups.length + 1;
    const newGroup = {
      id: `merge_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      name: `병합 그룹 ${index}`,
      sourceIds: selectedIds,
      type: dashboardConfig.defaultMergeType,
      baseSourceId: selectedIds[0],
      relationships: [{ leftDsId: selectedIds[0], leftCol: '', rightDsId: selectedIds[1], rightCol: '' }],
    };
    const nextGroups = [...existingGroups, newGroup];
    onDraftChange({
      mergeConfig: {
        ...mc,
        enabled: true,
        mergeGroups: nextGroups,
        individualSourceIds,
        activeGroupId: newGroup.id,
      },
    });
    setActiveTargetId(newGroup.id);
    setShowNewGroup(false);
  }

  function removeVisualConfig(targetId) {
    const nextVisualConfigs = { ...(draft.visualConfigs ?? {}) };
    delete nextVisualConfigs[targetId];
    return nextVisualConfigs;
  }

  function handleAddIndividual(sourceId) {
    if (!knownIds.has(sourceId) || individualSet.has(sourceId)) return;
    const mc = draft.mergeConfig ?? {};
    const nextIndividualIds = [...individualSourceIds, sourceId];
    onDraftChange({
      mergeConfig: {
        ...mc,
        individualSourceIds: nextIndividualIds,
      },
    });
    setActiveTargetId(sourceId);
    setShowNewIndividual(false);
  }

  function handleDeleteIndividual(sourceId) {
    const mc = draft.mergeConfig ?? {};
    const nextIndividualIds = individualSourceIds.filter((id) => id !== sourceId);
    const nextActiveId = activeTargetId === sourceId
      ? nextIndividualIds[0] ?? mergeGroups[0]?.id ?? null
      : activeTargetId;
    onDraftChange({
      mergeConfig: {
        ...mc,
        individualSourceIds: nextIndividualIds,
      },
      visualConfigs: removeVisualConfig(sourceId),
    });
    setActiveTargetId(nextActiveId);
  }

  function handleDeleteGroup(groupId) {
    const mc = draft.mergeConfig ?? {};
    const nextGroups = mergeGroups.filter((group) => group.id !== groupId);
    const nextActiveId = activeTargetId === groupId
      ? individualSourceIds[0] ?? nextGroups[0]?.id ?? null
      : activeTargetId;
    onDraftChange({
      mergeConfig: {
        ...mc,
        enabled: nextGroups.length > 0,
        mergeGroups: nextGroups,
        activeGroupId: nextGroups.some((group) => group.id === mc.activeGroupId) ? mc.activeGroupId : nextGroups[0]?.id ?? null,
      },
      visualConfigs: removeVisualConfig(groupId),
    });
    setActiveTargetId(nextActiveId);
  }

  // No sources configured yet
  if (dataSources.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ border: '1px dashed #cbd5e1', borderRadius: '8px', p: 2 }}>
          <Typography sx={{ fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
            소스 & 기본 정보 단계에서 데이터 소스를 먼저 선택하세요.
          </Typography>
        </Box>
      </Box>
    );
  }

  // Right panel: branch by ds.id or group.id.
  const activeDs = dataSources.find((ds) => ds.id === activeTargetId && individualSet.has(ds.id));
  const activeGroup = mergeGroups.find((g) => g.id === activeTargetId);

  const detailPanel = activeDs ? (
    <SourceTargetPanel
      target={{ dataSources: [activeDs], sourceIds: [activeDs.id] }}
      draft={draft}
      onDraftChange={onDraftChange}
      testResults={testResults}
      onRunTest={onRunTest}
    />
  ) : activeGroup ? (
    <MergedTargetPanel
      target={{
        id: activeGroup.id,
        label: activeGroup.name,
        sourceIds: activeGroup.sourceIds,
        dataSources: dataSources.filter((ds) => activeGroup.sourceIds.includes(ds.id)),
      }}
      draft={draft}
      onDraftChange={onDraftChange}
      testResults={testResults}
      onRunTest={onRunTest}
      onRunMerged={onRunMerged}
    />
  ) : null;

  // Use the selected source or merge group as the widget target.
  const widgetCount = individualSourceIds.length + mergeGroups.length;

  return (
    <Box sx={{
      height: '100%',
      minHeight: 0,
      display: 'grid',
      gridTemplateColumns: '260px minmax(0, 1fr)',
      gap: 1,
    }}>
      {/* Left: 2-section panel */}
      <Box sx={{
        border: '1px solid #e5eaf2',
        borderRadius: '8px',
        bgcolor: '#fff',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Stack sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {/* Data source section */}
          <SectionHeader label="데이터 소스" count={dataSources.length} />
          {dataSources.map((ds) => (
            <Box key={ds.id} sx={{ px: 1.25, py: 0.75, borderBottom: '1px solid #f1f5f9' }}>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#94a3b8', flexShrink: 0, ml: '1px' }} />
                <Typography sx={{ fontSize: 11, color: '#475569', fontWeight: 600 }} noWrap title={ds.sourceName}>
                  {ds.sourceName}
                </Typography>
              </Stack>
            </Box>
          ))}

          {/* Widget configuration section */}
          <SectionHeader label="위젯 구성" count={widgetCount} tone="widget" />

          {widgetCount === 0 && !showNewIndividual && !showNewGroup && (
            <Box sx={{ m: 1, p: 1.25, border: '1px dashed #bfdbfe', borderRadius: '8px', bgcolor: '#f8fbff' }}>
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#1d4ed8', mb: 0.25 }}>
                아직 구성된 위젯이 없습니다.
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#64748b' }}>
                아래 버튼으로 개별 위젯이나 병합 그룹을 추가하세요.
              </Typography>
            </Box>
          )}

          {individualSourceIds.map((sourceId) => {
            const ds = dataSources.find((item) => item.id === sourceId);
            if (!ds) return null;
            const active = activeTargetId === ds.id;
            const { done, total } = countParamsForDs(ds.id);
            return (
              <Box
                key={ds.id}
                role="button"
                tabIndex={0}
                onClick={() => { setActiveTargetId(ds.id); setShowNewGroup(false); setShowNewIndividual(false); }}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTargetId(ds.id)}
                sx={{
                  px: 1.25, py: 0.9,
                  borderBottom: '1px solid #eef2f7',
                  borderLeft: active ? '3px solid #1976d2' : '3px solid transparent',
                  bgcolor: active ? '#eff6ff' : '#fff',
                  cursor: 'pointer',
                  outline: 'none',
                  '&:hover': { bgcolor: active ? '#eff6ff' : '#f8fbff' },
                  '&:focus-visible': { boxShadow: 'inset 0 0 0 2px rgba(25,118,210,0.35)' },
                }}
              >
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.3, minWidth: 0 }}>
                  <Box sx={{
                    width: 8, height: 8, borderRadius: '50%',
                    bgcolor: active ? '#1976d2' : '#cbd5e1',
                    flexShrink: 0, ml: '3px',
                  }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#1e293b', flex: 1 }} noWrap title={ds.sourceName}>
                    {ds.sourceName}
                  </Typography>
                  <Button
                    size="small"
                    color="error"
                    onClick={(event) => { event.stopPropagation(); handleDeleteIndividual(ds.id); }}
                    sx={{ minWidth: 0, px: 0.5, fontSize: 10, textTransform: 'none' }}
                  >
                    삭제
                  </Button>
                </Stack>
                <Typography sx={{ fontSize: 10, color: total > 0 && done === total ? '#16a34a' : '#94a3b8', pl: '19px' }}>
                  {total === 0 ? '파라미터 없음' : `파라미터 ${done}/${total} 설정`}
                </Typography>
              </Box>
            );
          })}

          {mergeGroups.map((group) => {
            const active = activeTargetId === group.id;
            const { done, total } = countParamsForGroup(group);
            const groupSources = dataSources.filter((ds) => group.sourceIds.includes(ds.id));
            return (
              <Box
                key={group.id}
                role="button"
                tabIndex={0}
                onClick={() => { setActiveTargetId(group.id); setShowNewGroup(false); setShowNewIndividual(false); }}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTargetId(group.id)}
                sx={{
                  px: 1.25, py: 0.9,
                  borderBottom: '1px solid #eef2f7',
                  borderLeft: active ? '3px solid #1976d2' : '3px solid transparent',
                  bgcolor: active ? '#f8fbff' : '#fff',
                  cursor: 'pointer',
                  outline: 'none',
                  '&:hover': { bgcolor: active ? '#f8fbff' : '#fafbfc' },
                  '&:focus-visible': { boxShadow: 'inset 0 0 0 2px rgba(25,118,210,0.35)' },
                }}
              >
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.3, minWidth: 0 }}>
                  <MergeTypeIcon sx={{ width: 14, height: 14, color: active ? '#1976d2' : '#94a3b8', flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#1e293b', flex: 1 }} noWrap title={group.name}>
                    {group.name}
                  </Typography>
                  <Button
                    size="small"
                    color="error"
                    onClick={(event) => { event.stopPropagation(); handleDeleteGroup(group.id); }}
                    sx={{ minWidth: 0, px: 0.5, fontSize: 10, textTransform: 'none' }}
                  >
                    삭제
                  </Button>
                </Stack>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4, pl: '19px', mb: 0.3 }}>
                  {groupSources.slice(0, 3).map((ds) => (
                    <Chip
                      key={ds.id} label={ds.sourceName} size="small"
                      sx={{ maxWidth: 90, height: 16, fontSize: 9, borderRadius: '4px', bgcolor: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}
                    />
                  ))}
                  {groupSources.length > 3 && (
                    <Chip label={`+${groupSources.length - 3}`} size="small"
                      sx={{ height: 16, fontSize: 9, borderRadius: '4px', bgcolor: '#eef2ff', color: '#4f46e5' }} />
                  )}
                </Box>
                <Typography sx={{ fontSize: 10, color: total > 0 && done === total ? '#16a34a' : '#94a3b8', pl: '19px' }}>
                  {total === 0 ? '파라미터 없음' : `파라미터 ${done}/${total} 설정`}
                </Typography>
              </Box>
            );
          })}

          {showNewIndividual && (
            <Box sx={{ p: 1, borderTop: '1px solid #eef2f7' }}>
              <NewIndividualWidgetPanel
                dataSources={dataSources}
                existingIds={individualSet}
                onConfirm={handleAddIndividual}
                onCancel={() => setShowNewIndividual(false)}
              />
            </Box>
          )}

          {showNewGroup && (
            <Box sx={{ p: 1, borderTop: '1px solid #eef2f7' }}>
              <NewGroupPanel
                dataSources={dataSources}
                onConfirm={handleCreateGroup}
                onCancel={() => setShowNewGroup(false)}
              />
            </Box>
          )}
        </Stack>

        {!showNewGroup && !showNewIndividual && (
          <Stack spacing={0.75} sx={{ p: 1, borderTop: '1px solid #eef2f7' }}>
            <Button
              fullWidth size="small" variant="outlined"
              onClick={() => { setShowNewIndividual(true); setShowNewGroup(false); }}
              disabled={individualSourceIds.length >= dataSources.length}
              sx={{ fontSize: 11, textTransform: 'none', borderRadius: '6px' }}
            >
              + 개별 위젯 추가
            </Button>
            <Button
              fullWidth size="small" variant="outlined"
              onClick={() => { setShowNewGroup(true); setShowNewIndividual(false); }}
              disabled={!canAddGroup}
              sx={{ fontSize: 11, textTransform: 'none', borderRadius: '6px' }}
            >
              + 병합 그룹 추가
            </Button>
          </Stack>
        )}
      </Box>

      {/* Right: widget detail */}
      <Box sx={{
        border: '1px solid #e5eaf2',
        borderRadius: '8px',
        bgcolor: '#fafbfc',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        {detailPanel ?? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            <Box sx={{ maxWidth: 360, textAlign: 'center' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 900, color: '#334155', mb: 0.5 }}>
                구성할 위젯을 추가하세요.
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.7 }}>
                왼쪽 위젯 구성에서 개별 위젯 또는 병합 그룹을 추가하면 설정 화면이 열립니다.
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

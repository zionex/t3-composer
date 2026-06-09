import React from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress,
  MenuItem, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import { FIELD_SX, MERGED_DATA_SOURCE_ID } from './wizardConstants';
import { SourceTypeChip, ModuleChip } from '../DirectSourcePanel';
import dashboardConfig from '../../../../core/dashboardConfig';

function SampleTable({ columns, rows, maxRows = dashboardConfig.previewRowLimit, fill = false }) {
  if (!columns.length) return null;
  return (
    <Box
      sx={{
        height: fill ? '100%' : 'auto',
        minHeight: 0,
        overflow: fill ? 'auto' : 'auto hidden',
        border: '1px solid #e5eaf2',
        borderRadius: '6px',
        bgcolor: '#fff',
      }}
    >
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 11 }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc' }}>
            {columns.map((col) => (
              <th key={col} style={{ position: fill ? 'sticky' : 'static', top: 0, zIndex: 1, padding: '5px 8px', borderBottom: '1px solid #e5eaf2', textAlign: 'left', color: '#475569', fontWeight: 700, whiteSpace: 'nowrap', backgroundColor: '#f8fafc' }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, maxRows).map((row, i) => (
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

function resultStatus(result) {
  if (result?.loading) return { label: '실행 중', color: '#2563eb', bg: '#eff6ff' };
  if (result?.error) return { label: '오류', color: '#dc2626', bg: '#fef2f2' };
  if (result?.executed || result?.empty || (result?.rows ?? []).length > 0) {
    return { label: '완료', color: '#059669', bg: '#ecfdf5' };
  }
  return { label: '대기', color: '#64748b', bg: '#f1f5f9' };
}

function sourceSummaryTitle(ds, result) {
  const columns = result?.columns ?? [];
  const rows = result?.rows ?? [];
  const status = resultStatus(result);
  const meta = [
    ds.sourceType,
    ds.module,
    `${rows.length}행`,
    `${columns.length}컬럼`,
  ].filter(Boolean).join(' · ');
  const columnList = columns.length ? `\n컬럼: ${columns.join(', ')}` : '';
  const error = result?.error ? `\n오류: ${result.error}` : '';
  return `${ds.sourceName}\n${status.label}${meta ? ` · ${meta}` : ''}${columnList}${error}`;
}

function TestExecutionPanel({ dataSources, testResults, onRunTest, onRunAll }) {
  const [activeId, setActiveId] = React.useState(dataSources[0]?.id ?? null);
  const activeSource = dataSources.find((ds) => ds.id === activeId) ?? dataSources[0];
  const activeResult = activeSource ? (testResults[activeSource.id] ?? {}) : {};
  const activeStatus = resultStatus(activeResult);
  const activeColumns = activeResult.columns ?? [];
  const activeRows = activeResult.rows ?? [];
  const testedCount = dataSources.filter((ds) => {
    const result = testResults[ds.id];
    return !result?.loading && (result?.executed || (result?.rows ?? []).length > 0 || result?.error);
  }).length;

  React.useEffect(() => {
    if (!dataSources.length) {
      setActiveId(null);
      return;
    }
    if (!dataSources.some((ds) => ds.id === activeId)) {
      setActiveId(dataSources[0].id);
    }
  }, [activeId, dataSources]);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '360px minmax(0, 1fr)' },
        gap: 1,
        minHeight: 0,
        minWidth: 0,
      }}
    >
      <Box sx={{ border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: '#fff', overflow: 'hidden', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 1.25, py: 1, borderBottom: '1px solid #e5eaf2', bgcolor: '#f8fafc' }}
        >
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>
              테스트 항목
            </Typography>
            <Chip
              size="small"
              label={`${testedCount}/${dataSources.length}`}
              sx={{ height: 20, fontSize: 10, bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}
            />
          </Stack>
          {dataSources.length > 1 && (
            <Button
              size="small"
              variant="outlined"
              onClick={onRunAll}
              sx={{ fontSize: 11, textTransform: 'none', borderRadius: '6px', py: 0.25, flexShrink: 0 }}
            >
              전체 테스트
            </Button>
          )}
        </Stack>

        <Stack spacing={0} sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {dataSources.map((ds, index) => {
            const result = testResults[ds.id] ?? {};
            const status = resultStatus(result);
            const selected = ds.id === activeSource?.id;

            return (
              <Tooltip key={ds.id} title={<span style={{ whiteSpace: 'pre-line' }}>{sourceSummaryTitle(ds, result)}</span>} placement="right" arrow enterDelay={300}>
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveId(ds.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') setActiveId(ds.id);
                  }}
                  sx={{
                    px: 1.25,
                    py: 0.9,
                    borderBottom: index === dataSources.length - 1 ? 0 : '1px solid #eef2f7',
                    borderLeft: selected ? '3px solid #1976d2' : '3px solid transparent',
                    bgcolor: selected ? '#f8fbff' : '#fff',
                    cursor: 'pointer',
                    minWidth: 0,
                    outline: 'none',
                    '&:hover': { bgcolor: selected ? '#f8fbff' : '#fafbfc' },
                    '&:focus-visible': { boxShadow: 'inset 0 0 0 2px rgba(25, 118, 210, 0.35)' },
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                        <Box
                          component="span"
                          title={status.label}
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: status.color,
                            boxShadow: `0 0 0 3px ${status.bg}`,
                            flexShrink: 0,
                          }}
                        />
                        <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }} noWrap title={ds.sourceName}>
                          {ds.sourceName}
                        </Typography>
                      </Stack>
                      <Typography sx={{ mt: 0.25, pl: '15px', fontSize: 10, color: '#64748b' }} noWrap>
                        {[ds.sourceType, ds.module].filter(Boolean).join(' · ') || '데이터 소스'}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={result.loading ? <CircularProgress size={12} color="inherit" /> : <PlayArrowIcon sx={{ width: 14, height: 14 }} />}
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveId(ds.id);
                        onRunTest(ds);
                      }}
                      disabled={result.loading}
                      sx={{ flexShrink: 0, fontSize: 11, textTransform: 'none', borderRadius: '6px', py: 0.25 }}
                    >
                      테스트
                    </Button>
                  </Stack>
                </Box>
              </Tooltip>
            );
          })}
        </Stack>
      </Box>

      <Box
        sx={{
          border: '1px solid #e5eaf2',
          borderRadius: '8px',
          bgcolor: '#fff',
          overflow: 'hidden',
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ px: 1.25, py: 1, borderBottom: '1px solid #e5eaf2', bgcolor: '#f8fafc' }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#334155' }} noWrap title={activeSource?.sourceName}>
              {activeSource?.sourceName ?? '테스트 결과'}
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.35 }}>
              <Chip
                size="small"
                label={activeStatus.label}
                sx={{ height: 18, fontSize: 9, bgcolor: activeStatus.bg, color: activeStatus.color, fontWeight: 700 }}
              />
              <Typography sx={{ fontSize: 10, color: '#64748b' }}>
                {activeRows.length}행 · {activeColumns.length}컬럼
              </Typography>
            </Stack>
          </Box>
        </Stack>

        <Box sx={{ flex: 1, minHeight: 0, p: 1.25, minWidth: 0, overflow: 'hidden' }}>
          {activeResult.error && <Alert severity="error" sx={{ fontSize: 11, py: 0.25, mb: 1 }}>{activeResult.error}</Alert>}
          {activeResult.loading && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: '#64748b', fontSize: 12 }}>
              <CircularProgress size={16} />
              <Typography sx={{ fontSize: 12 }}>실행 중...</Typography>
            </Stack>
          )}
          {!activeResult.loading && activeColumns.length > 0 && (
            <SampleTable columns={activeColumns} rows={activeRows} fill maxRows={200} />
          )}
          {!activeResult.loading && !activeResult.error && activeColumns.length === 0 && (
            <Box sx={{ height: '100%', minHeight: 180, border: '1px dashed #dbe3ef', borderRadius: '6px' }} />
          )}
        </Box>
      </Box>
    </Box>
  );
}

const MERGE_TYPES = [
  { value: 'LEFT_JOIN', label: 'LEFT JOIN' },
  { value: 'INNER_JOIN', label: 'INNER JOIN' },
  { value: 'UNION', label: 'UNION' },
];

function makeMergeGroupId() {
  return `merge_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function normalizeIds(ids = [], knownIds = new Set()) {
  return ids.filter((id, index, arr) => knownIds.has(id) && arr.indexOf(id) === index);
}

function buildRuntimeMergeConfig(baseConfig, group, mergeGroups, individualSourceIds) {
  return {
    ...(baseConfig ?? {}),
    enabled: true,
    type: group.type,
    sourceIds: group.sourceIds,
    baseSourceId: group.baseSourceId,
    relationships: group.type === 'UNION' ? [] : (group.relationships ?? []),
    activeGroupId: group.id,
    mergeGroups,
    individualSourceIds,
  };
}

function MergeConfig({ mergeConfig, dataSources, testResults, onChange, onRunMerged }) {
  const mc = mergeConfig ?? {};
  const knownIds = React.useMemo(() => new Set(dataSources.map((ds) => ds.id)), [dataSources]);
  const dataSourceById = React.useMemo(
    () => Object.fromEntries(dataSources.map((ds) => [ds.id, ds])),
    [dataSources]
  );

  const mergeGroups = React.useMemo(() => {
    const rawGroups = Array.isArray(mc.mergeGroups) ? mc.mergeGroups : [];
    if (rawGroups.length) {
      return rawGroups
        .map((group, index) => {
          const sourceIds = normalizeIds(group.sourceIds ?? [], knownIds);
          return {
            id: group.id ?? `merge_group_${index + 1}`,
            name: group.name ?? `병합 그룹 ${index + 1}`,
            sourceIds,
            type: group.type && group.type !== 'SEPARATE' ? group.type : dashboardConfig.defaultMergeType,
            baseSourceId: sourceIds.includes(group.baseSourceId) ? group.baseSourceId : sourceIds[0],
            relationships: group.relationships ?? [],
          };
        })
        .filter((group) => group.sourceIds.length >= 2);
    }

    const legacyIds = normalizeIds(mc.sourceIds ?? [], knownIds);
    if (legacyIds.length < 2 || mc.type === 'SEPARATE') return [];
    return [{
      id: mc.activeGroupId ?? MERGED_DATA_SOURCE_ID,
      name: '병합 그룹 1',
      sourceIds: legacyIds,
      type: mc.type ?? dashboardConfig.defaultMergeType,
      baseSourceId: legacyIds.includes(mc.baseSourceId) ? mc.baseSourceId : legacyIds[0],
      relationships: mc.relationships ?? [],
    }];
  }, [mc, knownIds]);

  const individualSourceIds = React.useMemo(() => {
    if (Array.isArray(mc.individualSourceIds)) {
      return normalizeIds(mc.individualSourceIds, knownIds);
    }
    return dataSources.map((ds) => ds.id);
  }, [mc.individualSourceIds, dataSources, knownIds]);

  const [selectedIds, setSelectedIds] = React.useState([]);
  const [activeGroupId, setActiveGroupId] = React.useState(mc.activeGroupId ?? mergeGroups[0]?.id ?? null);
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);
  const individualSet = React.useMemo(() => new Set(individualSourceIds), [individualSourceIds]);
  const activeGroup = mergeGroups.find((group) => group.id === activeGroupId) ?? mergeGroups[0] ?? null;
  const activeResult = activeGroup ? (testResults[activeGroup.id] ?? testResults[MERGED_DATA_SOURCE_ID]) : null;

  React.useEffect(() => {
    setSelectedIds((prev) => normalizeIds(prev, knownIds));
  }, [knownIds]);

  React.useEffect(() => {
    if (!mergeGroups.length) {
      if (activeGroupId) setActiveGroupId(null);
      return;
    }
    if (!activeGroupId || !mergeGroups.some((group) => group.id === activeGroupId)) {
      setActiveGroupId(mergeGroups[0].id);
    }
  }, [activeGroupId, mergeGroups]);

  function patchConfig(nextGroups, nextIndividualIds = individualSourceIds, nextActiveGroupId = activeGroupId) {
    const nextActiveGroup = nextGroups.find((group) => group.id === nextActiveGroupId) ?? nextGroups[0] ?? null;
    const nextConfig = {
      ...mc,
      enabled: Boolean(nextActiveGroup),
      type: nextActiveGroup?.type ?? 'SEPARATE',
      sourceIds: nextActiveGroup?.sourceIds ?? [],
      baseSourceId: nextActiveGroup?.baseSourceId,
      relationships: nextActiveGroup?.relationships ?? [],
      activeGroupId: nextActiveGroup?.id ?? null,
      mergeGroups: nextGroups,
      individualSourceIds: nextIndividualIds,
    };
    onChange(nextConfig);
    setActiveGroupId(nextActiveGroup?.id ?? null);
  }

  function toggleSelectedSource(sourceId) {
    setSelectedIds((prev) =>
      prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId]
    );
  }

  function toggleIndividualSource(sourceId) {
    const nextIds = individualSet.has(sourceId)
      ? individualSourceIds.filter((id) => id !== sourceId)
      : [...individualSourceIds, sourceId];
    patchConfig(mergeGroups, nextIds);
  }

  function createGroupFromSelection() {
    const sourceIds = normalizeIds(selectedIds, knownIds);
    if (sourceIds.length < 2) return;
    const index = mergeGroups.length + 1;
    const group = {
      id: makeMergeGroupId(),
      name: `병합 그룹 ${index}`,
      sourceIds,
      type: dashboardConfig.defaultMergeType,
      baseSourceId: sourceIds[0],
      relationships: [{ leftDsId: sourceIds[0], leftCol: '', rightDsId: sourceIds[1], rightCol: '' }],
    };
    patchConfig([...mergeGroups, group], individualSourceIds, group.id);
    setSelectedIds([]);
  }

  function removeGroup(groupId) {
    const nextGroups = mergeGroups.filter((group) => group.id !== groupId);
    patchConfig(nextGroups, individualSourceIds, activeGroupId === groupId ? nextGroups[0]?.id ?? null : activeGroupId);
  }

  function patchGroup(groupId, patch) {
    const nextGroups = mergeGroups.map((group) => {
      if (group.id !== groupId) return group;
      const next = { ...group, ...patch };
      next.sourceIds = normalizeIds(next.sourceIds, knownIds);
      next.baseSourceId = next.sourceIds.includes(next.baseSourceId) ? next.baseSourceId : next.sourceIds[0];
      return next;
    });
    patchConfig(nextGroups, individualSourceIds, groupId);
  }

  function relationshipSeed(group = activeGroup) {
    const sourceIds = group?.sourceIds ?? [];
    return { leftDsId: group?.baseSourceId ?? sourceIds[0] ?? '', leftCol: '', rightDsId: sourceIds.find((id) => id !== (group?.baseSourceId ?? sourceIds[0])) ?? sourceIds[1] ?? '', rightCol: '' };
  }

  function patchRel(index, patch) {
    if (!activeGroup) return;
    patchGroup(activeGroup.id, {
      relationships: (activeGroup.relationships ?? []).map((rel, relIndex) => relIndex === index ? { ...rel, ...patch } : rel),
    });
  }

  function addRel() {
    if (!activeGroup) return;
    patchGroup(activeGroup.id, { relationships: [...(activeGroup.relationships ?? []), relationshipSeed(activeGroup)] });
  }

  function removeRel(index) {
    if (!activeGroup) return;
    patchGroup(activeGroup.id, { relationships: (activeGroup.relationships ?? []).filter((_, relIndex) => relIndex !== index) });
  }

  function columnsFor(sourceId) {
    return testResults[sourceId]?.columns ?? [];
  }

  const canPreview = activeGroup && (
    activeGroup.type === 'UNION' ||
    (activeGroup.relationships ?? []).some((rel) => rel.leftDsId && rel.rightDsId && rel.leftCol && rel.rightCol)
  );

  return (
    <Box sx={{ height: '100%', minHeight: 440, display: 'grid', gridTemplateColumns: { xs: '1fr', xl: activeGroup ? '300px minmax(420px, 1fr) 420px' : '320px minmax(420px, 1fr)' }, gap: 1, minWidth: 0 }}>
      <Box sx={{ border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: '#fff', overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1.25, py: 1, borderBottom: '1px solid #e5eaf2', bgcolor: '#f8fafc' }}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 900, color: '#334155' }}>데이터 소스</Typography>
            <Typography sx={{ fontSize: 10, color: '#64748b' }}>{selectedIds.length}개 선택 · {dataSources.length}개 전체</Typography>
          </Box>
          <Stack direction="row" spacing={0.5}>
            <Button size="small" onClick={() => setSelectedIds(dataSources.map((ds) => ds.id))} sx={{ fontSize: 10, minWidth: 0 }}>전체</Button>
            <Button size="small" onClick={() => setSelectedIds([])} sx={{ fontSize: 10, minWidth: 0 }}>해제</Button>
          </Stack>
        </Stack>
        <Stack sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {dataSources.map((ds) => {
            const selected = selectedSet.has(ds.id);
            const inGroups = mergeGroups.filter((group) => group.sourceIds.includes(ds.id));
            const individual = individualSet.has(ds.id);
            return (
              <Box
                key={ds.id}
                role="button"
                tabIndex={0}
                onClick={() => toggleSelectedSource(ds.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') toggleSelectedSource(ds.id);
                }}
                sx={{
                  px: 1.25,
                  py: 1,
                  borderBottom: '1px solid #eef2f7',
                  borderLeft: selected ? '3px solid #1976d2' : '3px solid transparent',
                  bgcolor: selected ? '#f8fbff' : '#fff',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#f8fbff' },
                }}
              >
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: selected ? '#1976d2' : '#cbd5e1', flexShrink: 0 }} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 900, color: '#1e293b' }} noWrap title={ds.sourceName}>{ds.sourceName}</Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.45, flexWrap: 'wrap' }}>
                      <SourceTypeChip value={ds.sourceType} />
                      {ds.module && <ModuleChip value={ds.module} />}
                      {individual && <Chip size="small" label="개별" sx={{ height: 18, fontSize: 9, bgcolor: '#ecfdf5', color: '#059669', fontWeight: 800 }} />}
                      {inGroups.map((group) => (
                        <Chip key={group.id} size="small" label={group.name.replace('병합 ', '')} sx={{ height: 18, fontSize: 9, bgcolor: '#eef2ff', color: '#4f46e5', fontWeight: 800 }} />
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </Box>

      <Box sx={{ border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: '#fff', overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1.25, py: 1, borderBottom: '1px solid #e5eaf2', bgcolor: '#f8fafc' }}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 900, color: '#334155' }}>병합 구성</Typography>
            <Typography sx={{ fontSize: 10, color: '#64748b' }}>병합 그룹 {mergeGroups.length}개 · 개별 위젯 {individualSourceIds.length}개</Typography>
          </Box>
          <Button variant="contained" size="small" disabled={selectedIds.length < 2} onClick={createGroupFromSelection} sx={{ fontSize: 11, borderRadius: '6px', textTransform: 'none' }}>
            그룹 생성
          </Button>
        </Stack>

        <Stack spacing={1.1} sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 1.25 }}>
          {mergeGroups.length === 0 ? (
            <Box sx={{ border: '1px dashed #cbd5e1', borderRadius: '8px', p: 1.5, bgcolor: '#fafbfc' }}>
              <Typography sx={{ fontSize: 12, fontWeight: 900, color: '#334155' }}>병합할 소스 2개 이상을 선택하세요.</Typography>
              <Typography sx={{ mt: 0.5, fontSize: 11, color: '#64748b' }}>선택하지 않아도 개별 위젯은 유지됩니다.</Typography>
            </Box>
          ) : mergeGroups.map((group) => {
            const active = activeGroup?.id === group.id;
            return (
              <Box
                key={group.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setActiveGroupId(group.id);
                  patchConfig(mergeGroups, individualSourceIds, group.id);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') setActiveGroupId(group.id);
                }}
                sx={{
                  border: active ? '1px solid #93c5fd' : '1px solid #dbe3ef',
                  borderRadius: '8px',
                  bgcolor: active ? '#f8fbff' : '#fff',
                  p: 1.25,
                  cursor: 'pointer',
                  boxShadow: active ? '0 0 0 2px rgba(25, 118, 210, 0.08)' : 'none',
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <MergeTypeIcon sx={{ width: 16, height: 16, color: '#1976d2' }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 900, color: '#1e293b' }}>{group.name}</Typography>
                    <Chip size="small" label={group.type} sx={{ height: 18, fontSize: 9, bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 800 }} />
                  </Stack>
                  <Button size="small" color="error" onClick={(event) => { event.stopPropagation(); removeGroup(group.id); }} sx={{ minWidth: 0, fontSize: 10 }}>해제</Button>
                </Stack>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.65 }}>
                  {group.sourceIds.map((sourceId, index) => {
                    const ds = dataSourceById[sourceId];
                    if (!ds) return null;
                    return (
                      <React.Fragment key={sourceId}>
                        {index > 0 && <Typography sx={{ fontSize: 13, color: '#94a3b8', fontWeight: 900 }}>+</Typography>}
                        <Chip label={ds.sourceName} title={ds.sourceName} sx={{ maxWidth: 220, borderRadius: '6px', bgcolor: '#f8fafc', border: '1px solid #dbe3ef', color: '#334155', fontSize: 11, fontWeight: 800 }} />
                      </React.Fragment>
                    );
                  })}
                </Box>
              </Box>
            );
          })}

          <Box sx={{ border: '1px solid #e5eaf2', borderRadius: '8px', overflow: 'hidden' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1, py: 0.8, bgcolor: '#f8fafc', borderBottom: '1px solid #e5eaf2' }}>
              <Typography sx={{ fontSize: 11, fontWeight: 900, color: '#334155' }}>개별 위젯</Typography>
              <Chip size="small" label={`${individualSourceIds.length}개`} sx={{ height: 18, fontSize: 9, bgcolor: '#ecfdf5', color: '#059669', fontWeight: 800 }} />
            </Stack>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, p: 1 }}>
              {dataSources.map((ds) => {
                const active = individualSet.has(ds.id);
                return (
                  <Chip
                    key={ds.id}
                    label={ds.sourceName}
                    title={active ? '개별 위젯 생성 대상' : '개별 위젯 제외'}
                    onClick={() => toggleIndividualSource(ds.id)}
                    sx={{
                      maxWidth: 260,
                      borderRadius: '6px',
                      bgcolor: active ? '#ecfdf5' : '#fff',
                      border: active ? '1px solid #86efac' : '1px solid #e2e8f0',
                      color: active ? '#047857' : '#64748b',
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        </Stack>
      </Box>

      {activeGroup && (
        <Box sx={{ border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: '#fff', overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Stack sx={{ px: 1.25, py: 1, borderBottom: '1px solid #e5eaf2', bgcolor: '#f8fafc' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 900, color: '#334155' }}>{activeGroup.name} 설정</Typography>
            <Typography sx={{ fontSize: 10, color: '#64748b' }}>병합 방식과 연결 기준을 설정합니다.</Typography>
          </Stack>
          <Stack spacing={1.25} sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 1.25 }}>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 900, color: '#334155', mb: 0.75 }}>병합 방식</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 0.6 }}>
                {MERGE_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    variant={activeGroup.type === type.value ? 'contained' : 'outlined'}
                    onClick={() => patchGroup(activeGroup.id, { type: type.value, relationships: type.value === 'UNION' ? [] : (activeGroup.relationships?.length ? activeGroup.relationships : [relationshipSeed(activeGroup)]) })}
                    sx={{ minWidth: 0, height: 34, borderRadius: '6px', fontSize: 10, fontWeight: 900, textTransform: 'none', px: 0.5 }}
                  >
                    {type.label}
                  </Button>
                ))}
              </Box>
            </Box>

            {activeGroup.type !== 'UNION' && (
              <>
                <TextField select label="기준 소스" size="small" sx={FIELD_SX}
                  value={activeGroup.baseSourceId ?? activeGroup.sourceIds[0] ?? ''}
                  onChange={(event) => patchGroup(activeGroup.id, { baseSourceId: event.target.value })}>
                  {activeGroup.sourceIds.map((sourceId) => (
                    <MenuItem key={sourceId} value={sourceId} sx={{ fontSize: 11 }}>{dataSourceById[sourceId]?.sourceName ?? sourceId}</MenuItem>
                  ))}
                </TextField>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontSize: 11, fontWeight: 900, color: '#334155' }}>연결 조건</Typography>
                  <Button size="small" variant="outlined" onClick={addRel} sx={{ fontSize: 10, borderRadius: '6px', py: 0.2 }}>+ 조건 추가</Button>
                </Stack>
                {(activeGroup.relationships ?? []).map((rel, index) => (
                  <Box key={index} sx={{ border: '1px solid #e5eaf2', borderRadius: '6px', p: 0.75 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 0.75, mb: 0.75 }}>
                      <TextField select size="small" label="왼쪽 소스" sx={FIELD_SX} value={rel.leftDsId ?? activeGroup.sourceIds[0] ?? ''} onChange={(event) => patchRel(index, { leftDsId: event.target.value, leftCol: '' })}>
                        {activeGroup.sourceIds.map((sourceId) => <MenuItem key={sourceId} value={sourceId} sx={{ fontSize: 11 }}>{dataSourceById[sourceId]?.sourceName ?? sourceId}</MenuItem>)}
                      </TextField>
                      <TextField select size="small" label="오른쪽 소스" sx={FIELD_SX} value={rel.rightDsId ?? activeGroup.sourceIds[1] ?? ''} onChange={(event) => patchRel(index, { rightDsId: event.target.value, rightCol: '' })}>
                        {activeGroup.sourceIds.map((sourceId) => <MenuItem key={sourceId} value={sourceId} sx={{ fontSize: 11 }}>{dataSourceById[sourceId]?.sourceName ?? sourceId}</MenuItem>)}
                      </TextField>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 18px minmax(0, 1fr) 48px', gap: 0.5, alignItems: 'center' }}>
                      <TextField select size="small" label="컬럼" sx={FIELD_SX} value={rel.leftCol ?? ''} onChange={(event) => patchRel(index, { leftCol: event.target.value })}>
                        {columnsFor(rel.leftDsId).map((col) => <MenuItem key={col} value={col} sx={{ fontSize: 11 }}>{col}</MenuItem>)}
                      </TextField>
                      <Typography sx={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>=</Typography>
                      <TextField select size="small" label="컬럼" sx={FIELD_SX} value={rel.rightCol ?? ''} onChange={(event) => patchRel(index, { rightCol: event.target.value })}>
                        {columnsFor(rel.rightDsId).map((col) => <MenuItem key={col} value={col} sx={{ fontSize: 11 }}>{col}</MenuItem>)}
                      </TextField>
                      <Button variant="text" size="small" color="error" onClick={() => removeRel(index)} sx={{ minWidth: 0, fontSize: 10 }}>삭제</Button>
                    </Box>
                  </Box>
                ))}
              </>
            )}

            <Box sx={{ borderTop: '1px solid #eef2f7', pt: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={activeResult?.loading ? <CircularProgress size={12} color="inherit" /> : <MergeTypeIcon sx={{ width: 14, height: 14 }} />}
                  disabled={!canPreview || activeResult?.loading}
                  onClick={() => onRunMerged?.(
                    buildRuntimeMergeConfig(mc, activeGroup, mergeGroups, individualSourceIds),
                    activeGroup.id
                  )}
                  sx={{ fontSize: 11, textTransform: 'none', borderRadius: '6px', py: 0.35 }}
                >
                  {activeResult?.loading ? '병합 중...' : '병합 미리보기'}
                </Button>
                {(activeResult?.rows ?? []).length > 0 && (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <CheckCircleOutlineIcon sx={{ width: 13, height: 13, color: '#10b981' }} />
                    <Typography sx={{ fontSize: 10, color: '#10b981' }}>{activeResult.rows.length}행 · {activeResult.columns.length}컬럼</Typography>
                  </Stack>
                )}
              </Stack>
              {activeResult?.error && <Alert severity="error" sx={{ fontSize: 11, py: 0.25, mt: 1 }}>{activeResult.error}</Alert>}
              {(activeResult?.rows ?? []).length > 0 && !activeResult?.loading && (
                <Box sx={{ mt: 1, maxHeight: 220, overflow: 'hidden' }}>
                  <SampleTable columns={activeResult.columns} rows={activeResult.rows} fill maxRows={50} />
                </Box>
              )}
            </Box>
          </Stack>
        </Box>
      )}
    </Box>
  );
}

export default function Step3_TestAndMapping({
  draft,
  onDraftChange,
  testResults,
  onRunTest,
  onRunAll,
  onRunMerged,
  compact = false,
  section = 'all',
}) {
  const dataSources = draft?.dataSources ?? [];
  const mergeConfig = draft?.mergeConfig ?? { enabled: false, type: dashboardConfig.defaultMergeType, conditions: [] };
  const showTest = section === 'all' || section === 'test';
  const showMerge = (section === 'all' || section === 'merge') && dataSources.length > 1;

  return (
    <Stack spacing={compact ? 1 : 2} sx={{ height: section === 'test' || section === 'merge' ? '100%' : 'auto', minHeight: 0 }}>
      {showTest && (
        <TestExecutionPanel
          dataSources={dataSources}
          testResults={testResults}
          onRunTest={onRunTest}
          onRunAll={onRunAll}
        />
      )}

      {showMerge && (
        <MergeConfig
          mergeConfig={mergeConfig}
          dataSources={dataSources}
          testResults={testResults}
          onChange={(mc) => onDraftChange({ mergeConfig: mc })}
          onRunMerged={onRunMerged}
        />
      )}
    </Stack>
  );
}

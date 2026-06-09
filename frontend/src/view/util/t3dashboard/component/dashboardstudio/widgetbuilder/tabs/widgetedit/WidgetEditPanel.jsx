import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import {
  Box,
  Button,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

import {
  normalizeParameterMappings,
  parseWidgetSpec,
} from '../../../generic/widgetSpecAdapter';
import {
  DEFAULT_PALETTE,
  ensureVisualShape,
  getNumericColumns,
} from '../../../dashboardbuilder/dialogs/WidgetSettingsDialog';
import {
  defaultVisualConfig,
  getVisualTargetTitle,
  MERGED_DATA_SOURCE_ID,
  MODULE_LIST,
  moduleColor,
} from '../direct/steps/wizardConstants';
import { fetchTableColumns } from '../direct/steps/dataSourceApi';
import { useMultiTestQuery } from '../direct/steps/useMultiTestQuery';
import useDashboardSourceCatalog, { findCatalogEntry } from '../../hooks/useDashboardSourceCatalog';
import dashboardConfig from '../../../core/dashboardConfig';

import DataSettingsTab from './DataSettingsTab';
import VisualSettingsTab from './VisualSettingsTab';

function normalizeSourceType(type) {
  if (type === 'TABLE') return 'TABLE';
  if (type === 'VIEW') return 'VIEW';
  return 'TABLE';
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
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

function makeDataSources(spec, widget, sourceCatalog) {
  function enrichSource(ds) {
    const catalogEntry = findCatalogEntry(sourceCatalog, ds);
    return {
      ...(catalogEntry ?? {}),
      ...ds,
      id: ds.id ?? catalogEntry?.id ?? ds.sourceName ?? ds.name,
      sourceType: normalizeSourceType(ds.sourceType ?? ds.type ?? catalogEntry?.sourceType),
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
      sourceType: normalizeSourceType(dc.sourceType || ds.type),
      sourceName: dc.sourceName || ds.name || ds.sourceName || '',
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

export default forwardRef(function WidgetEditPanel(
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
      accentColor: [nextPalette[0], String(nextPalette[0]) + '18'],
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
      if (['TABLE', 'VIEW'].includes(normalizeSourceType(ds.sourceType))) {
        newSpec.dataConfig = {
          sourceType: normalizeSourceType(ds.sourceType),
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
        {activeTab === 0 ? (
          <DataSettingsTab
            title={title}
            setTitle={setTitle}
            module={module}
            setModule={setModule}
            dataSources={dataSources}
            parameterMappings={parameterMappings}
            setParameterMappings={setParameterMappings}
            mergeType={mergeType}
            setMergeType={setMergeType}
            relationships={relationships}
            setRelationships={setRelationships}
            tableSources={tableSources}
            tableColumnsById={tableColumnsById}
            tableLoadingById={tableLoadingById}
            columnsBySource={columnsBySource}
            isMerged={isMerged}
            visualTargets={visualTargets}
            safeVisualTab={safeVisualTab}
            setVisualTab={setVisualTab}
            visualConfigs={visualConfigs}
            activePreviewData={activePreviewData}
            activePreviewColumns={activePreviewColumns}
            activePreviewResult={activePreviewResult}
            activeVisualTarget={activeVisualTarget}
            handleRunPreview={handleRunPreview}
            patchDataSource={patchDataSource}
          />
        ) : (
          <VisualSettingsTab
            visualTargets={visualTargets}
            safeVisualTab={safeVisualTab}
            setVisualTab={setVisualTab}
            visualConfigs={visualConfigs}
            activeVisualTarget={activeVisualTarget}
            activeVisualId={activeVisualId}
            activeVisualConfig={activeVisualConfig}
            activeVisualType={activeVisualType}
            activeVisualColumns={activeVisualColumns}
            activeValueColumns={activeValueColumns}
            activePreviewConfig={activePreviewConfig}
            activePreviewData={activePreviewData}
            activePreviewResult={activePreviewResult}
            handleRunPreview={handleRunPreview}
            handleVisualTypeChange={handleVisualTypeChange}
            handlePaletteChange={handlePaletteChange}
            updateVisualConfig={updateVisualConfig}
          />
        )}
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

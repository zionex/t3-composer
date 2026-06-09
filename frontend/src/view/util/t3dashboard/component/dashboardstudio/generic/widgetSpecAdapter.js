export function parseWidgetSpec(specJson) {
  if (!specJson) return {};
  if (typeof specJson === 'string') {
    try {
      return JSON.parse(specJson);
    } catch (_) {
      return {};
    }
  }
  return specJson;
}

function normalizeParamName(name) {
  return String(name ?? '').replace(/^@/, '');
}

function mappingSourceIds(mapping) {
  if (Array.isArray(mapping?.sources) && mapping.sources.length > 0) return mapping.sources;
  if (Array.isArray(mapping?.sourceIds) && mapping.sourceIds.length > 0) return mapping.sourceIds;
  if (Array.isArray(mapping?.dataSourceIds) && mapping.dataSourceIds.length > 0) return mapping.dataSourceIds;
  if (mapping?.dataSourceId) return [mapping.dataSourceId];
  return [];
}

function sourceHasParam(dataSource, paramName) {
  const normalizedName = normalizeParamName(paramName);
  if (!normalizedName) return false;

  if ((dataSource?.params ?? []).some((param) =>
    normalizeParamName(param?.paramName || param?.key || param?.name) === normalizedName
  )) {
    return true;
  }

  return (dataSource?.tableConfig?.whereConditions ?? []).some((condition) =>
    normalizeParamName(condition?.paramName || condition?.column) === normalizedName
  );
}

function inferMappingSourceIds(mapping, dataSources = []) {
  const explicitIds = mappingSourceIds(mapping);
  if (explicitIds.length > 0) return explicitIds;
  if (!dataSources.length) return [];

  const matchingSources = dataSources
    .filter((dataSource) => sourceHasParam(dataSource, mapping?.paramName || mapping?.key || mapping?.name))
    .map((dataSource) => dataSource.id);
  if (matchingSources.length > 0) return matchingSources;

  const nonTableSources = dataSources
    .filter((dataSource) => dataSource.sourceType !== 'TABLE')
    .map((dataSource) => dataSource.id);
  return nonTableSources.length > 0 ? nonTableSources : dataSources.map((dataSource) => dataSource.id);
}

function toDataSourceMapping(mapping, dataSourceId) {
  const rest = { ...mapping };
  delete rest.sources;
  delete rest.sourceIds;
  delete rest.dataSourceIds;

  return {
    ...rest,
    paramName: normalizeParamName(mapping?.paramName || mapping?.key || mapping?.name),
    scope: 'DATA_SOURCE',
    dataSourceId,
    sources: [dataSourceId],
  };
}

export function normalizeParameterMappings(mappings = [], dataSources = []) {
  if (!Array.isArray(mappings)) return [];

  const knownIds = new Set((dataSources ?? []).map((dataSource) => String(dataSource.id)));
  const byKey = new Map();

  mappings.forEach((mapping) => {
    const targetIds = inferMappingSourceIds(mapping, dataSources)
      .map(String)
      .filter((id, index, arr) =>
        id && arr.indexOf(id) === index && (knownIds.size === 0 || knownIds.has(id))
      );

    targetIds.forEach((targetId) => {
      const next = toDataSourceMapping(mapping, targetId);
      const key = `${targetId}:${normalizeParamName(next.paramName)}`;
      const existing = byKey.get(key);
      const existingWasShared = existing?.scopeWasShared;
      const nextWasShared = mapping?.scope === 'SHARED';

      if (!existing || existingWasShared || !nextWasShared) {
        byKey.set(key, { ...next, scopeWasShared: nextWasShared });
      }
    });
  });

  return Array.from(byKey.values()).map(({ scopeWasShared, ...mapping }) => mapping);
}

function mappingAppliesToSource(mapping, dataSourceId) {
  if (!dataSourceId) return mappingSourceIds(mapping).length === 0 && mapping?.scope !== 'SHARED';
  const sourceIds = mappingSourceIds(mapping);

  if (Array.isArray(sourceIds) && sourceIds.length > 0) {
    return sourceIds.some((sourceId) => String(sourceId) === String(dataSourceId));
  }

  return String(mapping.dataSourceId ?? '') === String(dataSourceId);
}

export function filterMappingsForSource(mappings = [], dataSourceId = null) {
  if (!Array.isArray(mappings)) return [];
  return mappings.filter((mapping) => mappingAppliesToSource(mapping, dataSourceId));
}

export function paramsObjectFromMappings(mappings = [], dataSourceId = null) {
  if (!Array.isArray(mappings)) return mappings ?? {};

  return filterMappingsForSource(mappings, dataSourceId).reduce((acc, mapping) => {
    const key = mapping.key || mapping.paramName || mapping.name;
    if (!key) return acc;
    const value = mapping.testValue ?? mapping.value ?? mapping.defaultValue ?? '';
    acc[key.replace(/^@/, '')] = value == null ? '' : value;
    return acc;
  }, {});
}

function buildMergeSource(dataSource, paramMappings) {
  if (dataSource.sourceType === 'TABLE') {
    const cfg = dataSource.tableConfig ?? {};
    return {
      type: 'TABLE',
      tableName: dataSource.sourceName,
      schema: dataSource.schema ?? 'dbo',
      columns: cfg.columns ?? [],
      whereConditions: (cfg.whereConditions ?? [])
        .filter((condition) => condition.mappingType !== 'UNUSED')
        .map((condition) => ({
          column: condition.column,
          operator: condition.operator ?? '=',
          value: condition.fixedValue ?? '',
        }))
        .filter((condition) => condition.value !== ''),
      orderBy: cfg.orderBy ?? [],
      topN: cfg.topN ?? undefined,
    };
  }

  if (dataSource.sourceType === 'VIEW') {
    return {
      type: 'VIEW',
      name: dataSource.sourceName,
      params: {},
    };
  }

  return {
    type: 'SP',
    name: dataSource.sourceName,
    params: paramsObjectFromMappings(paramMappings, dataSource.id),
  };
}

export function toWidgetDataConfig(specJson) {
  const spec = parseWidgetSpec(specJson);

  const mergeConfig = spec.mergeConfig;
  if (mergeConfig?.enabled && mergeConfig.type !== 'SEPARATE') {
    const dataSources = spec.dataSources ?? [];
    const selectedIds = Array.isArray(mergeConfig.sourceIds)
      ? mergeConfig.sourceIds
      : dataSources.map((dataSource) => dataSource.id);
    const selectedIdSet = new Set(selectedIds);
    const mergeSources = dataSources.filter((dataSource) => selectedIdSet.has(dataSource.id));
    const paramMappings = normalizeParameterMappings(spec.parameterMappings ?? [], dataSources);

    return {
      sourceType: 'MERGED',
      sources: mergeSources.map((dataSource) => buildMergeSource(dataSource, paramMappings)),
      mergeConfig: { type: mergeConfig.type, relationships: mergeConfig.relationships ?? [] },
      fallbackData: [],
    };
  }

  const dataConfig = spec.dataConfig ?? {};
  const source = spec.dataSource ?? {};
  const sourceType = dataConfig.sourceType || source.type || 'STORED_PROCEDURE';
  const procedureName = dataConfig.procedureName || source.name || source.sourceName || '';

  if (sourceType === 'VIEW') {
    return {
      sourceType,
      procedureName,
      params: {},
      fieldMapping: dataConfig.fieldMapping || spec.fieldMapping || spec.columnMappings,
      fallbackData: dataConfig.fallbackData || source.mockData || spec.mockData || [],
      timeout: dataConfig.timeout ?? 0,
    };
  }

  if (sourceType === 'TABLE') {
    return {
      sourceType,
      sourceName: dataConfig.sourceName || source.name || source.sourceName || procedureName,
      schema: dataConfig.schema || source.schema || 'dbo',
      tableConfig: dataConfig.tableConfig ?? {},
      params: dataConfig.params ?? {},
      fallbackData: dataConfig.fallbackData || source.mockData || spec.mockData || [],
      timeout: dataConfig.timeout ?? 0,
    };
  }

  if (Array.isArray(dataConfig.params)) {
    return {
      sourceType,
      procedureName,
      viewName: dataConfig.viewName ?? '',
      params: dataConfig.params,
      fieldMapping: dataConfig.fieldMapping || spec.fieldMapping || spec.columnMappings,
      fallbackData: dataConfig.fallbackData || source.mockData || spec.mockData || [],
      timeout: dataConfig.timeout ?? 0,
    };
  }

  const matchedSource = (spec.dataSources ?? []).find((dataSource) =>
    dataSource.id === source.id ||
    dataSource.sourceName === procedureName ||
    dataSource.name === procedureName
  );
  const sourceId = source.id || source.dataSourceId || spec.primaryDataSourceId || matchedSource?.id;
  const scopedBindings = normalizeParameterMappings(
    spec.paramBindings ?? spec.parameterMappings ?? [],
    spec.dataSources ?? (matchedSource ? [matchedSource] : [])
  );
  const hasScopedBindings = Array.isArray(scopedBindings) && scopedBindings.some((mapping) => mapping.scope || mapping.dataSourceId);
  const params = hasScopedBindings
    ? paramsObjectFromMappings(scopedBindings, sourceId)
    : (dataConfig.params ?? paramsObjectFromMappings(scopedBindings, sourceId));
  return {
    sourceType,
    procedureName,
    viewName: dataConfig.viewName || source.viewName || '',
    params,
    fieldMapping: dataConfig.fieldMapping || spec.fieldMapping || spec.columnMappings,
    fallbackData: dataConfig.fallbackData || source.mockData || spec.mockData || [],
    timeout: dataConfig.timeout ?? 0,
  };
}

export function toWidgetVisualConfig(specJson, widgetType) {
  const spec = parseWidgetSpec(specJson);
  const mergeConfig = spec.mergeConfig;
  if (mergeConfig?.enabled && mergeConfig.type !== 'SEPARATE' && mergeConfig.visualConfig) {
    return { type: mergeConfig.visualConfig.type || widgetType || spec.widgetType, ...mergeConfig.visualConfig };
  }
  return {
    type: spec.visualConfig?.type || widgetType || spec.widgetType,
    ...(spec.visualConfig || {}),
  };
}

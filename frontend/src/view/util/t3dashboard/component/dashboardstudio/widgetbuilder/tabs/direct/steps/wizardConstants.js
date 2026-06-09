export const MERGED_DATA_SOURCE_ID = '__merged__';
export const MERGED_GROUP_LABEL = '병합 그룹 1';

export const FORMAT_OPTIONS = [
  { value: '',         label: '기본' },
  { value: 'compact',  label: '억 단위' },
  { value: 'integer',  label: '정수' },
  { value: 'percent',  label: '%' },
  { value: 'currency', label: '통화' },
];

export const MODULE_LIST = ['SA', 'DP', 'BF', 'MP', 'IM', 'RP', 'SO', 'CM', 'FP', 'FO', 'SNOP'];

export const MODULE_COLORS = {
  'SA':   '#ec4899',
  'DP':   '#3b82f6',
  'BF':   '#10b981',
  'MP':   '#f59e0b',
  'IM':   '#06b6d4',
  'RP':   '#84cc16',
  'SO':   '#f97316',
  'CM':   '#94a3b8',
  'FP':   '#8b5cf6',
  'FO':   '#a78bfa',
  'SNOP': '#6366f1',
};

export const SOURCE_TYPES = [
  { value: 'VIEW',  label: 'Database View', short: 'VIEW',  color: '#10b981' },
  { value: 'TABLE', label: 'Table',         short: 'Table', color: '#f59e0b' },
];

export const RETURN_TYPES = [
  { value: 'SINGLE_KPI',  label: '단일 KPI' },
  { value: 'LIST_DATA',   label: '목록 데이터' },
  { value: 'TIME_SERIES', label: '시계열 데이터' },
  { value: 'MIXED',       label: '복합 (P_VIEW 전환형)' },
];

export const FIELD_SX = {
  '& .MuiInputBase-root': { fontSize: 12 },
  '& .MuiInputLabel-root': { fontSize: 12 },
};

export const SECTION_LABEL_SX = {
  fontSize: 10,
  fontWeight: 700,
  color: '#94a3b8',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  display: 'block',
  mb: 1,
};

export function moduleColor(mod) {
  return MODULE_COLORS[mod] ?? '#94a3b8';
}

export function defaultVisualConfig(type) {
  switch (type) {
    case 'kpi':         return { type, valueField: '', unit: '', format: '' };
    case 'bar':
    case 'bar_stacked':
    case 'bar_h':
    case 'line':
    case 'area':        return { type, xField: '', yFields: [], labels: [] };
    case 'bar_line':    return { type, xField: '', series: [] };
    case 'pie':
    case 'doughnut':    return { type, labelField: '', valueField: '' };
    case 'table':       return { type, columns: [] };
    default:            return { type };
  }
}

export function getMergeSourceIds(mergeConfig, dataSources = []) {
  if (!mergeConfig?.enabled || mergeConfig?.type === 'SEPARATE') return [];
  const sourceIds = dataSources.map((ds) => ds.id);
  const known = new Set(sourceIds);
  const raw = Array.isArray(mergeConfig.sourceIds) ? mergeConfig.sourceIds : sourceIds;
  const selected = raw.filter((id, index, arr) => known.has(id) && arr.indexOf(id) === index);
  return selected.length >= 2 ? selected : [];
}

export function getVisualTargets(draft = {}) {
  const dataSources = draft?.dataSources ?? [];
  const knownIds = new Set(dataSources.map((ds) => ds.id));
  const groups = Array.isArray(draft?.mergeConfig?.mergeGroups)
    ? draft.mergeConfig.mergeGroups
        .map((group, index) => {
          const sourceIds = (group.sourceIds ?? [])
            .filter((id, idx, arr) => knownIds.has(id) && arr.indexOf(id) === idx);
          return {
            id: group.id ?? `${MERGED_DATA_SOURCE_ID}_${index + 1}`,
            name: group.name ?? `병합 그룹 ${index + 1}`,
            sourceIds,
          };
        })
        .filter((group) => group.sourceIds.length >= 2)
    : [];
  const targets = [];

  if (groups.length > 0) {
    groups.forEach((group) => {
      const mergedSources = dataSources.filter((ds) => group.sourceIds.includes(ds.id));
      targets.push({
        id: group.id,
        kind: 'merged',
        label: group.name,
        defaultTitle: group.name,
        sourceIds: group.sourceIds,
        dataSources: mergedSources,
      });
    });
  } else {
    const mergeSourceIds = getMergeSourceIds(draft?.mergeConfig, dataSources);
    if (mergeSourceIds.length >= 2) {
      const mergeSourceSet = new Set(mergeSourceIds);
      targets.push({
        id: MERGED_DATA_SOURCE_ID,
        kind: 'merged',
        label: MERGED_GROUP_LABEL,
        defaultTitle: MERGED_GROUP_LABEL,
        sourceIds: mergeSourceIds,
        dataSources: dataSources.filter((ds) => mergeSourceSet.has(ds.id)),
      });
    }
  }

  const individualIds = Array.isArray(draft?.mergeConfig?.individualSourceIds)
    ? draft.mergeConfig.individualSourceIds.filter((id, index, arr) => knownIds.has(id) && arr.indexOf(id) === index)
    : dataSources.map((ds) => ds.id);
  const individualSet = new Set(individualIds);

  dataSources
    .filter((ds) => individualSet.has(ds.id))
    .forEach((ds) => {
      targets.push({
        id: ds.id,
        kind: 'source',
        label: ds.sourceName,
        defaultTitle: ds.sourceName,
        sourceIds: [ds.id],
        dataSource: ds,
        dataSources: [ds],
      });
    });

  return targets;
}

export function getVisualTargetTitle(target, visualConfigs = {}) {
  const explicit = visualConfigs?.[target?.id]?.widgetTitle?.trim();
  return explicit || target?.defaultTitle || target?.label || '새 위젯';
}

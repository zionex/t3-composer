import { parseWidgetSpec } from '../../../../generic/widgetSpecAdapter';
import { getSpecSourceDisplayName } from '../../../dialogs/WidgetInfoDialog';

const TITLE_MAX_LEN = 24;

export function summarizeDescription(desc, fallback) {
  const raw = String(desc ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return fallback;
  if (raw.length <= TITLE_MAX_LEN) return raw;
  return `${raw.slice(0, TITLE_MAX_LEN - 1)}…`;
}

export function formatLabel(item) {
  return item?.displayName || item?.comment || item?.name || '';
}

export function pickVisibleSuggestions(suggestions, seed, limit) {
  if (suggestions.length <= limit) return suggestions;
  const pageCount = Math.ceil(suggestions.length / limit);
  const page = seed % pageCount;
  const start = page * limit;
  const pageItems = suggestions.slice(start, start + limit);
  if (pageItems.length === limit) return pageItems;
  return [...pageItems, ...suggestions.slice(0, limit - pageItems.length)];
}

export function getSelectedDimensionItems(allDimDisplayItems, selectedDimensions) {
  const selectedDimDisplayItems = allDimDisplayItems.filter(
    (item) => selectedDimensions.has(item.name) || (item.isMerged && selectedDimensions.has(item.pairedName)),
  );
  const seenKeys = new Set();
  return selectedDimDisplayItems.filter((item) => {
    if (seenKeys.has(item.name)) return false;
    seenKeys.add(item.name);
    return true;
  });
}

export function quoteSqlIdentifier(value) {
  return `[${String(value ?? '').replace(/]/g, ']]')}]`;
}

export function buildTableWidgetSql(candidate, tableConfig = {}) {
  const schema = candidate?.schema || candidate?.table_schema || 'dbo';
  const tableName = candidate?.table_name || candidate?.name;
  if (!tableName) return '';

  const columns = Array.isArray(tableConfig.columns) ? tableConfig.columns.filter(Boolean) : [];
  const selectClause = columns.length > 0
    ? columns.map((column) => `    ${quoteSqlIdentifier(column)}`).join(',\n')
    : '    *';
  const lines = [
    'SELECT',
    selectClause,
    `FROM ${quoteSqlIdentifier(schema)}.${quoteSqlIdentifier(tableName)}`,
  ];

  const whereConditions = (tableConfig.whereConditions ?? [])
    .filter((condition) => condition && condition.mappingType !== 'UNUSED' && condition.column)
    .map((condition) => {
      const value = condition.fixedValue ?? condition.value;
      const renderedValue = value === undefined || value === null || value === ''
        ? '?'
        : `'${String(value).replace(/'/g, "''")}'`;
      return `    ${quoteSqlIdentifier(condition.column)} ${condition.operator || '='} ${renderedValue}`;
    });
  if (whereConditions.length > 0) {
    lines.push('WHERE');
    lines.push(whereConditions.join('\n  AND '));
  }

  const orderBy = (tableConfig.orderBy ?? []).filter((order) => order?.column);
  if (orderBy.length > 0) {
    lines.push(`ORDER BY ${orderBy.map((order) => `${quoteSqlIdentifier(order.column)} ${order.direction || 'ASC'}`).join(', ')}`);
  }

  if (tableConfig.topN) {
    lines.push(`LIMIT ${Number(tableConfig.topN)}`);
  }

  return lines.join('\n');
}

export function buildPrefillFields(chart, columnMeta = [], selectedSets = {}) {
  const measures = columnMeta.filter((c) => c.role === 'measure');
  const times    = columnMeta.filter((c) => c.role === 'time');
  const dims     = columnMeta.filter((c) => c.role === 'dimension');
  const ids      = columnMeta.filter((c) => c.role === 'id');
  // role이 비었거나 위 분류 외인 컬럼 — 백엔드 role 분류 미흡 대비 fallback. measure는 절대 제외.
  const measureNames = new Set(measures.map((c) => c.name));
  const others = columnMeta.filter(
    (c) => !measureNames.has(c.name) && !['time', 'dimension', 'id', 'measure', 'no_use'].includes(c.role),
  );

  const metricSet = selectedSets.metrics;
  const dimSet = selectedSets.dimensions;
  const filterSet = selectedSets.filters;

  // measure: 사용자 선택 우선
  const orderedMeasures = [
    ...measures.filter((c) => metricSet?.has(c.name)),
    ...measures.filter((c) => !metricSet?.has(c.name)),
  ];

  // 축 후보: time > dimension > id > 기타(role 미상). measure는 명시적으로 제외(안전망).
  const axisCandidatesRaw = [...times, ...dims, ...ids, ...others]
    .filter((c) => !measureNames.has(c.name));
  const orderedAxis = [
    ...axisCandidatesRaw.filter((c) => dimSet?.has(c.name) || filterSet?.has(c.name)),
    ...axisCandidatesRaw.filter((c) => !(dimSet?.has(c.name) || filterSet?.has(c.name))),
  ];

  const firstMetric = orderedMeasures[0]?.name || '';
  const firstAxis = orderedAxis[0]?.name || '';

  switch (chart) {
    case 'bar':
    case 'bar_stacked':
    case 'bar_h':
    case 'line':
    case 'area':
      return { xField: firstAxis, yFields: firstMetric ? [firstMetric] : [] };
    case 'bar_line':
      return { xField: firstAxis, series: firstMetric ? [{ field: firstMetric, type: 'bar' }] : [] };
    case 'pie':
    case 'doughnut':
      return { labelField: firstAxis, valueField: firstMetric };
    case 'kpi':
      return { valueField: firstMetric };
    case 'table': {
      const dimNames = orderedAxis.map((c) => c.name);
      const measNames = orderedMeasures.map((c) => c.name);
      return { columns: [...dimNames, ...measNames] };
    }
    default:
      return {};
  }
}

export function normalizeText(value) {
  return String(value ?? '').trim().toUpperCase();
}

export function tableNameVariants(name) {
  const normalized = normalizeText(name);
  if (!normalized) return [];
  const bareName = normalized.split('.').pop();
  return [...new Set([normalized, bareName].filter(Boolean))];
}

// ── Step 2 utility functions ────────────────────────────────────────────────

export function deriveVirtualMeasures(allColumns) {
  const result = [];
  const names = new Set();

  result.push({ name: '__virt_count__', comment: '전체 건수', formula: 'COUNT(*)', isVirtual: true });
  names.add('__virt_count__');

  const idCol = allColumns.find((c) => c.name === 'ID' || c.name.endsWith('_ID'));
  if (idCol) {
    const vname = `__virt_uid_${idCol.name}__`;
    if (!names.has(vname)) {
      result.push({ name: vname, comment: '고유 건수', formula: `COUNT(${idCol.name})`, isVirtual: true });
      names.add(vname);
    }
  }

  allColumns.filter((c) => c.name.endsWith('_YN')).slice(0, 3).forEach((col) => {
    const vname = `__virt_yn_${col.name}__`;
    if (!names.has(vname)) {
      result.push({ name: vname, comment: `${col.comment || col.name} 건수`, formula: `COUNT WHERE ${col.name}='Y'`, isVirtual: true });
      names.add(vname);
    }
  });

  const dateCol = allColumns.find(
    (c) => c.type?.startsWith('DATE') || c.name.endsWith('_DTTM') || c.name.endsWith('_DT'),
  );
  if (dateCol) {
    const vname = `__virt_dt_${dateCol.name}__`;
    if (!names.has(vname)) {
      result.push({ name: vname, comment: '생성 건수', formula: `COUNT(${dateCol.name})`, isVirtual: true });
      names.add(vname);
    }
  }

  return result;
}

export function groupMeasures(measures) {
  const GROUPS = [
    { groupLabel: '수량 지표', cols: [], cmtKw: ['수량', '량', '건수', '수', '개'], nameKw: ['QTY', 'CNT', 'COUNT', 'AMT'] },
    { groupLabel: '시간 지표', cols: [], cmtKw: ['시간', '기간', '분'],            nameKw: ['TIME', 'TM', 'DUR', 'HOUR'] },
    { groupLabel: '비율 지표', cols: [], cmtKw: ['율', '비율', '%'],               nameKw: ['RATE', 'RATIO', 'PCT'] },
    { groupLabel: '순위/번호', cols: [], cmtKw: ['순위', '번호'],                  nameKw: ['RANK', 'SEQ'] },
    { groupLabel: '기타',      cols: [] },
  ];

  measures.forEach((col) => {
    const cmt = col.comment || '';
    const nm = col.name.toUpperCase();
    let placed = false;
    for (const grp of GROUPS.slice(0, -1)) {
      if (grp.cmtKw.some((k) => cmt.includes(k)) || grp.nameKw.some((k) => nm.includes(k))) {
        grp.cols.push(col);
        placed = true;
        break;
      }
    }
    if (!placed) GROUPS[GROUPS.length - 1].cols.push(col);
  });

  return GROUPS.filter((g) => g.cols.length > 0);
}

export function groupDimensions(dimensions) {
  const time = [], status = [], item = [], advanced = [];

  dimensions.forEach((col) => {
    if (col.role === 'time') {
      time.push(col);
    } else if (col.role === 'id') {
      advanced.push(col);
    } else if (col.name.endsWith('_YN') || (col.comment || '').includes('여부') || (col.comment || '').includes('상태')) {
      status.push(col);
    } else {
      item.push(col);
    }
  });

  const result = [];
  if (time.length > 0)     result.push({ groupLabel: '시간 기준',     cols: time });
  if (status.length > 0)   result.push({ groupLabel: '상태 기준',     cols: status });
  if (item.length > 0)     result.push({ groupLabel: '항목/코드 기준', cols: item });
  if (advanced.length > 0) result.push({ groupLabel: '고급 기준',     cols: advanced, isAdvanced: true });
  return result;
}

export function mergeCodeNamePairs(cols) {
  const byName = new Map(cols.map((c) => [c.name, c]));
  const consumed = new Set();
  const result = [];

  cols.forEach((col) => {
    if (consumed.has(col.name)) return;
    if (col.name.endsWith('_CD')) {
      const nmName = col.name.replace(/_CD$/, '_NM');
      const nmCol = byName.get(nmName);
      if (nmCol) {
        result.push({ ...col, displayName: nmCol.comment || nmCol.name, pairedName: nmName, isMerged: true });
        consumed.add(col.name);
        consumed.add(nmName);
        return;
      }
    }
    consumed.add(col.name);
    result.push(col);
  });

  return result;
}

export function collectWidgetSearchText(widget) {
  const spec = parseWidgetSpec(widget.spec_json);
  const dataSource = spec.dataSource ?? {};
  const dataConfig = spec.dataConfig ?? {};
  const dataSources = Array.isArray(spec.dataSources) ? spec.dataSources : [];
  return [
    widget.title, widget.description, widget.module, widget.widget_type,
    dataSource.name, dataSource.sourceName, dataSource.tableName,
    dataConfig.sourceName, dataConfig.tableName,
    getSpecSourceDisplayName(spec),
    ...dataSources.flatMap((s) => [s.name, s.sourceName, s.tableName]),
    JSON.stringify(spec.dataSource ?? {}),
    JSON.stringify(spec.dataConfig ?? {}),
    JSON.stringify(spec.dataSources ?? []),
  ].filter(Boolean).map(normalizeText).join(' ');
}

export function relatedTableMatchScore(widget, relatedTables) {
  const haystack = collectWidgetSearchText(widget);
  return relatedTables.reduce((score, table) => {
    const matched = tableNameVariants(table.name).some((n) => haystack.includes(n));
    return matched ? score + 1 : score;
  }, 0);
}

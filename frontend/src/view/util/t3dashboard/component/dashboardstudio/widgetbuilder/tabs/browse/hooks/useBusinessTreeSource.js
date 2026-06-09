import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { getBizCategories, getBusinessTree, getBusinessTreeModules } from '../../../../../../restapi/widgetBuilder';

function prettifyCategoryCode(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (raw === '_uncategorized') return '미분류';
  return raw
    .replace(/^_+|_+$/g, '')
    .replace(/summarys$/i, 'summary')
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function resolveCategoryName(entry, categoryNameMap) {
  const candidates = [
    entry?.category_name,
    categoryNameMap[entry?.keyword],
    categoryNameMap[entry?.category],
    entry?.display_name,
    entry?.keyword_name,
    entry?.business_name,
  ].map((value) => String(value ?? '').trim()).filter(Boolean);

  const rawValues = new Set([entry?.keyword, entry?.category].map((value) => String(value ?? '').trim()).filter(Boolean));
  const friendlyName = candidates.find((value) => !rawValues.has(value));
  return friendlyName || prettifyCategoryCode(entry?.keyword);
}

export function useBusinessTreeSource() {
  const [entriesByModule, setEntriesByModule] = useState({});   // { [module]: [{ module, keyword, tables }] }
  const [activeModule, setActiveModule] = useState(null);
  const [loadingModule, setLoadingModule] = useState(null);
  const [availableModules, setAvailableModules] = useState([]);
  const [categoryNameMap, setCategoryNameMap] = useState({});
  const [error, setError] = useState(null);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    getBusinessTreeModules()
      .then((modules) => {
        if (Array.isArray(modules)) setAvailableModules(modules);
      })
      .catch(() => {});

    getBizCategories()
      .then((categories) => {
        if (!Array.isArray(categories)) return;
        const nextMap = {};
        categories.forEach((category) => {
          const code = String(category?.category ?? '').trim();
          const name = String(category?.category_name ?? '').trim();
          if (code && name) nextMap[code] = name;
        });
        setCategoryNameMap(nextMap);
      })
      .catch(() => {});
  }, []);

  const loadModule = useCallback(async (module) => {
    setActiveModule(module);
    setError(null);

    if (entriesByModule[module]) return;

    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;
    setLoadingModule(module);

    try {
      const data = await getBusinessTree(module);
      setEntriesByModule((prev) => ({
        ...prev,
        [module]: Array.isArray(data) ? data : [],
      }));
    } catch (e) {
      if (requestSeqRef.current === requestSeq) {
        setError(e?.message || '데이터 로드 실패');
      }
    } finally {
      if (requestSeqRef.current === requestSeq) {
        setLoadingModule(null);
      }
    }
  }, [entriesByModule]);

  const entries = useMemo(
    () => (activeModule ? entriesByModule[activeModule] || [] : []),
    [activeModule, entriesByModule],
  );
  const loading = loadingModule === activeModule && !entriesByModule[activeModule];

  const primaryKeywords = useMemo(() => {
    const set = new Set();
    entries.forEach((e) => { if (e.is_primary) set.add(e.keyword); });
    return set;
  }, [entries]);

  const keywords = useMemo(() => {
    const unique = [...new Set(entries.map((e) => e.keyword))];
    return unique.sort((a, b) => {
      const ap = primaryKeywords.has(a) ? 0 : 1;
      const bp = primaryKeywords.has(b) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return a.localeCompare(b);
    });
  }, [entries, primaryKeywords]);

  const keywordNames = useMemo(() => {
    const names = {};
    entries.forEach((e) => {
      if (e.keyword) names[e.keyword] = resolveCategoryName(e, categoryNameMap);
    });
    return names;
  }, [entries, categoryNameMap]);

  const keywordDescriptions = useMemo(() => {
    const descriptions = {};
    keywords.forEach((kw) => {
      const tableMap = new Map();
      entries
        .filter((e) => e.keyword === kw)
        .flatMap((e) => e.tables)
        .forEach((t) => { if (!tableMap.has(t.name)) tableMap.set(t.name, t); });
      const descs = [...tableMap.values()]
        .filter((t) => t.description)
        .slice(0, 2)
        .map((t) => t.description);
      descriptions[kw] = descs.join(' · ');
    });
    return descriptions;
  }, [entries, keywords]);

  const tablesForKeyword = useCallback((keyword) => {
    const tableMap = new Map();
    entries
      .filter((e) => e.keyword === keyword)
      .flatMap((e) => e.tables)
      .forEach((t) => {
        if (!tableMap.has(t.name)) {
          tableMap.set(t.name, { ...t, columns: filterBusinessColumns(t.columns) });
        }
      });
    return [...tableMap.values()];
  }, [entries]);

  const columnsForKeyword = useCallback((keyword) => {
    const seen = new Map();
    entries
      .filter((e) => e.keyword === keyword)
      .flatMap((e) => e.tables)
      .forEach((table) => {
        filterBusinessColumns(table.columns).forEach((col) => {
          if (!seen.has(col.name)) {
            seen.set(col.name, { ...col, _tables: [table.name] });
          } else {
            seen.get(col.name)._tables.push(table.name);
          }
        });
      });
    return [...seen.values()];
  }, [entries]);

  return { loading, error, availableModules, loadModule, keywords, primaryKeywords, keywordNames, keywordDescriptions, tablesForKeyword, columnsForKeyword };
}

export function normalizeRole(column) {
  return String(column?.role || column?.col_role || column?.semantic_role || '').toLowerCase();
}

export function isNoUseColumn(column) {
  return normalizeRole(column) === 'no_use';
}

export function filterBusinessColumns(columns) {
  return Array.isArray(columns) ? columns.filter((column) => column?.name && !isNoUseColumn(column) && column?.has_data !== false) : [];
}

function normalizeType(column) {
  return String(column?.type || column?.col_type || '').toUpperCase();
}

function isNumericColumn(column) {
  const type = normalizeType(column);
  return ['DECIMAL', 'FLOAT', 'DOUBLE', 'INT', 'BIGINT', 'NUMERIC', 'NUMBER'].some((prefix) => type.startsWith(prefix));
}

function isNonMeasureName(column) {
  const name = String(column?.name || '').toUpperCase();
  return /(^ID$|_ID$|_KEY$|_SEQ$|_NO$|_IDX$|_LV$|_LEVEL$|SEQ$|^PRIORITY$|_PRIORITY$|^DISPLAY_SEQ$|_DISPLAY_SEQ$|(^|_)SORT($|_)|(^|_)ORDER($|_)|(^|_)RANK($|_)|^ROWNUM$)/.test(name);
}

function isMeasureColumn(column) {
  const role = normalizeRole(column);
  if (role) return role === 'measure';
  return isNumericColumn(column) && !isNonMeasureName(column);
}

function isTimeColumn(column) {
  return normalizeRole(column) === 'time';
}

function isAxisColumn(column) {
  return ['dimension', 'time', 'id'].includes(normalizeRole(column));
}

function labelOf(column) {
  return column?.comment || column?.description || column?.name || '';
}

function columnsOf(table) {
  return filterBusinessColumns(table?.columns);
}

function tableColumnConfig(columns) {
  return columns.map((column) => ({
    field: column.name,
    headerText: labelOf(column),
    width: isMeasureColumn(column) ? 120 : 150,
    align: isMeasureColumn(column) ? 'right' : 'left',
  }));
}

function orderedAxisColumns(columns) {
  const time = columns.filter(isTimeColumn);
  const dimensions = columns.filter((column) => normalizeRole(column) === 'dimension');
  const ids = columns.filter((column) => normalizeRole(column) === 'id');
  const fallback = columns.filter((column) => !isMeasureColumn(column) && !isAxisColumn(column));
  return [...time, ...dimensions, ...ids, ...fallback];
}

export function deriveWidgetSuggestions(keyword, tables) {
  if (!tables || tables.length === 0) return [];

  const suggestions = [];
  const seen = new Set();
  const seenColKeys = new Set();
  const tableOrder = new Map(tables.map((table, index) => [table.name, index]));
  const typeOrder = {
    line: 10,
    bar: 20,
    doughnut: 30,
    kpi: 40,
    table: 50,
    area: 60,
    bar_h: 70,
    bar_stacked: 80,
    pie: 90,
    bar_line: 100,
  };

  function addSuggestion(suggestion) {
    if (!suggestion?.tableName || !suggestion?.type) return;
    const key = `${suggestion.type}:${suggestion.tableName}:${(suggestion.columns ?? []).join('|')}`;
    if (seen.has(key)) return;
    if (suggestion.type !== 'kpi' && suggestion.type !== 'table') {
      const colKey = `${suggestion.tableName}:${[...(suggestion.columns ?? [])].sort().join('|')}`;
      if (seenColKeys.has(colKey)) return;
      seenColKeys.add(colKey);
    }
    seen.add(key);
    suggestions.push(suggestion);
  }

  tables.forEach((table) => {
    const tableColumns = columnsOf(table);
    if (tableColumns.length === 0) return;

    const measures = tableColumns.filter(isMeasureColumn);
    const effectiveMeasures = measures.length > 0
      ? measures
      : [{ name: '__virt_count__', comment: '전체 건수', isVirtual: true }];
    const axisColumns = orderedAxisColumns(tableColumns);
    const timeAxis = axisColumns.find(isTimeColumn);
    const primaryAxis = timeAxis || axisColumns[0];
    const categoryAxis = axisColumns.find((column) => normalizeRole(column) === 'dimension') || primaryAxis;
    const ratioAxis = axisColumns.find((column) => normalizeRole(column) === 'dimension') || timeAxis || categoryAxis;
    const primaryMeasure = effectiveMeasures[0];
    const secondaryMeasure = effectiveMeasures[1];

    if (timeAxis && primaryMeasure) {
      addSuggestion({
        id: `line_${table.name}_${timeAxis.name}_${primaryMeasure.name}`,
        name: `${labelOf(timeAxis)}별 ${labelOf(primaryMeasure)} 추세`,
        type: 'line',
        tableName: table.name,
        columns: [timeAxis.name, primaryMeasure.name],
        visualConfig: { type: 'line', xField: timeAxis.name, yFields: [primaryMeasure.name], labels: [labelOf(primaryMeasure)], aggregation: 'sum' },
      });
      addSuggestion({
        id: `area_${table.name}_${timeAxis.name}_${primaryMeasure.name}`,
        name: `${labelOf(timeAxis)}별 ${labelOf(primaryMeasure)} 누적 추세`,
        type: 'area',
        tableName: table.name,
        columns: [timeAxis.name, primaryMeasure.name],
        visualConfig: { type: 'area', xField: timeAxis.name, yFields: [primaryMeasure.name], labels: [labelOf(primaryMeasure)], aggregation: 'sum' },
      });
    }

    if (categoryAxis && primaryMeasure) {
      addSuggestion({
        id: `bar_${table.name}_${categoryAxis.name}_${primaryMeasure.name}`,
        name: `${labelOf(categoryAxis)}별 ${labelOf(primaryMeasure)}`,
        type: 'bar',
        tableName: table.name,
        columns: [categoryAxis.name, primaryMeasure.name],
        visualConfig: { type: 'bar', xField: categoryAxis.name, yFields: [primaryMeasure.name], labels: [labelOf(primaryMeasure)], aggregation: 'sum' },
      });
      addSuggestion({
        id: `bar_h_${table.name}_${categoryAxis.name}_${primaryMeasure.name}`,
        name: `${labelOf(categoryAxis)}별 ${labelOf(primaryMeasure)} 비교`,
        type: 'bar_h',
        tableName: table.name,
        columns: [categoryAxis.name, primaryMeasure.name],
        visualConfig: { type: 'bar_h', xField: categoryAxis.name, yFields: [primaryMeasure.name], labels: [labelOf(primaryMeasure)], aggregation: 'sum' },
      });
      addSuggestion({
        id: `bar_stacked_${table.name}_${categoryAxis.name}_${primaryMeasure.name}`,
        name: `${labelOf(categoryAxis)}별 ${labelOf(primaryMeasure)} 누적`,
        type: 'bar_stacked',
        tableName: table.name,
        columns: [categoryAxis.name, primaryMeasure.name],
        visualConfig: { type: 'bar_stacked', xField: categoryAxis.name, yFields: [primaryMeasure.name], labels: [labelOf(primaryMeasure)], aggregation: 'sum' },
      });
      addSuggestion({
        id: `doughnut_${table.name}_${ratioAxis.name}_${primaryMeasure.name}`,
        name: `${labelOf(categoryAxis)}별 ${labelOf(primaryMeasure)} 비율`,
        type: 'doughnut',
        tableName: table.name,
        columns: [ratioAxis.name, primaryMeasure.name],
        visualConfig: { type: 'doughnut', labelField: ratioAxis.name, valueField: primaryMeasure.name, aggregation: 'sum', maxSlices: 12 },
      });
      addSuggestion({
        id: `pie_${table.name}_${ratioAxis.name}_${primaryMeasure.name}`,
        name: `${labelOf(categoryAxis)}별 ${labelOf(primaryMeasure)} 구성`,
        type: 'pie',
        tableName: table.name,
        columns: [ratioAxis.name, primaryMeasure.name],
        visualConfig: { type: 'pie', labelField: ratioAxis.name, valueField: primaryMeasure.name, aggregation: 'sum', maxSlices: 12 },
      });
    }

    if (primaryAxis && primaryMeasure && secondaryMeasure) {
      addSuggestion({
        id: `bar_line_${table.name}_${primaryAxis.name}_${primaryMeasure.name}_${secondaryMeasure.name}`,
        name: `${labelOf(primaryAxis)}별 ${labelOf(primaryMeasure)} / ${labelOf(secondaryMeasure)}`,
        type: 'bar_line',
        tableName: table.name,
        columns: [primaryAxis.name, primaryMeasure.name, secondaryMeasure.name],
        visualConfig: {
          type: 'bar_line',
          xField: primaryAxis.name,
          series: [
            { field: primaryMeasure.name, label: labelOf(primaryMeasure), chartType: 'bar' },
            { field: secondaryMeasure.name, label: labelOf(secondaryMeasure), chartType: 'line' },
          ],
          aggregation: 'sum',
        },
      });
    }

    effectiveMeasures.slice(0, 2).forEach((measure) => {
      addSuggestion({
        id: `kpi_${table.name}_${measure.name}`,
        name: `${labelOf(measure)} KPI`,
        type: 'kpi',
        tableName: table.name,
        columns: [measure.name],
        visualConfig: { type: 'kpi', valueField: measure.name, aggregation: measure.isVirtual ? 'count' : 'sum', unit: '', format: '' },
      });
    });

    const roleColumns = [
      ...axisColumns.slice(0, 4).map((column) => column.name),
      ...measures.slice(0, 4).map((column) => column.name),
    ];
    const fallbackColumns = tableColumns.slice(0, 8).map((column) => column.name);
    const displayColumns = roleColumns.length > 0 ? roleColumns : fallbackColumns;
    addSuggestion({
      id: `table_${table.name}`,
      name: `${keyword} 전체 목록`,
      type: 'table',
      tableName: table.name,
      columns: displayColumns,
      visualConfig: {
        type: 'table',
        columns: tableColumnConfig(tableColumns.filter((column) => displayColumns.includes(column.name))),
      },
    });
  });

  return suggestions.sort((a, b) => {
    const tableDiff = (tableOrder.get(a.tableName) ?? 0) - (tableOrder.get(b.tableName) ?? 0);
    if (tableDiff !== 0) return tableDiff;
    const typeDiff = (typeOrder[a.type] ?? 1000) - (typeOrder[b.type] ?? 1000);
    if (typeDiff !== 0) return typeDiff;
    return String(a.id ?? '').localeCompare(String(b.id ?? ''));
  });
}

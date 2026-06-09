import { useState } from 'react';
import { apiConfig } from '../../../../../../restapi/apiconfig';
import { executeTableQuery } from './dataSourceApi';
import dashboardConfig from '../../../../core/dashboardConfig';
import { MERGED_DATA_SOURCE_ID } from './wizardConstants';
import { paramsObjectFromMappings } from '../../../../generic/widgetSpecAdapter';

function isQueryableSource(ds) {
  return ds?.sourceType === 'TABLE' || ds?.sourceType === 'VIEW';
}

function resultRowsFromTableResult(result) {
  const cols = result.columns ?? [];
  const rows = (result.rows ?? []).map((row) =>
    Object.fromEntries(cols.map((col, index) => [col, row[index]]))
  );
  return { rows, columns: cols };
}

function buildQueryPayload(ds, paramMappings = []) {
  const cfg = ds.tableConfig ?? {};
  const tableParams = paramsObjectFromMappings(paramMappings, ds.id);
  const resolvedWhere = (cfg.whereConditions ?? [])
    .filter((condition) => condition.mappingType !== 'UNUSED')
    .map((condition) => ({
      column: condition.column,
      operator: condition.operator ?? '=',
      value: condition.mappingType === 'FIXED_VALUE'
        ? (condition.fixedValue ?? '')
        : (tableParams[(condition.paramName || condition.column || '').replace(/^@/, '')] ?? ''),
    }))
    .filter((condition) => condition.value !== '');

  return {
    tableName: ds.sourceName,
    schema: ds.schema ?? 'dbo',
    columns: cfg.columns ?? [],
    whereConditions: resolvedWhere,
    orderBy: cfg.orderBy ?? [],
    topN: cfg.topN ? Number(cfg.topN) : undefined,
  };
}

export function useMultiTestQuery() {
  const [results, setResults] = useState({});

  function setResult(dsId, patch) {
    setResults((prev) => ({ ...prev, [dsId]: { ...(prev[dsId] ?? {}), ...patch } }));
  }

  function completeResult(rows = [], columns = []) {
    return {
      loading: false,
      rows,
      columns,
      error: null,
      empty: rows.length === 0,
      executed: true,
    };
  }

  function errorResult(err, fallback) {
    const rawDetail = err?.response?.data?.detail || err?.message || err;
    const detail = typeof rawDetail === 'string'
      ? rawDetail
      : (rawDetail ? JSON.stringify(rawDetail) : '');
    return {
      loading: false,
      rows: [],
      columns: [],
      error: detail || fallback,
      empty: false,
      executed: true,
    };
  }

  async function runTest(ds, paramMappings = []) {
    const dsId = ds.id;
    setResult(dsId, { loading: true, error: null, rows: [], columns: [], empty: false, executed: false });

    if (!isQueryableSource(ds)) {
      const unsupported = errorResult(null, '지원하지 않는 데이터 소스 유형입니다.');
      setResult(dsId, unsupported);
      return unsupported;
    }

    try {
      const result = await executeTableQuery(buildQueryPayload(ds, paramMappings));
      const { rows, columns } = resultRowsFromTableResult(result);
      const completed = completeResult(rows, columns);
      setResult(dsId, completed);
      return completed;
    } catch (err) {
      const failed = errorResult(err, '데이터 조회 실패');
      setResult(dsId, failed);
      return failed;
    }
  }

  async function runAll(dataSources, paramMappings) {
    await Promise.all(dataSources.map((ds) => runTest(ds, paramMappings)));
  }

  async function runMerged(dataSources, paramMappings, mergeConfig, resultId = MERGED_DATA_SOURCE_ID) {
    const type = mergeConfig?.type ?? dashboardConfig.defaultMergeType;
    const selectedIds = Array.isArray(mergeConfig?.sourceIds)
      ? mergeConfig.sourceIds
      : dataSources.map((ds) => ds.id);
    const selectedIdSet = new Set(selectedIds);
    const mergeSources = dataSources.filter((ds) => selectedIdSet.has(ds.id));

    if (type === 'UNION') {
      setResult(resultId, { loading: true, error: null, rows: [], columns: [], empty: false, executed: false });
      const sourceResults = await Promise.all(mergeSources.map((ds) =>
        results[ds.id]?.executed ? results[ds.id] : runTest(ds, paramMappings)
      ));
      const all = sourceResults.flatMap((result) => result?.rows ?? []);
      const cols = sourceResults.find((result) => (result?.columns ?? []).length > 0)?.columns ?? [];
      setResult(resultId, completeResult(all, cols));
      return;
    }

    setResult(resultId, { loading: true, error: null, rows: [], columns: [], empty: false, executed: false });
    try {
      const sources = mergeSources.map((ds) => ({
        type: ds.sourceType,
        ...buildQueryPayload(ds, paramMappings),
      }));

      const res = await apiConfig.makeRequest('POST', '/common/merge-query', {
        sources,
        mergeConfig: {
          type,
          relationships: (mergeConfig?.relationships ?? []).map((rel) => ({
            leftCol: rel.leftCol,
            rightCol: rel.rightCol,
          })),
        },
      }, { errorMessage: false });

      if (res.status === 200) {
        const { columns, rows } = res.data;
        setResult(resultId, completeResult(rows ?? [], columns ?? []));
      } else {
        setResult(resultId, errorResult(null, '병합 조회 실패'));
      }
    } catch (err) {
      setResult(resultId, errorResult(err, '병합 조회 실패'));
    }
  }

  return { results, runTest, runAll, runMerged };
}

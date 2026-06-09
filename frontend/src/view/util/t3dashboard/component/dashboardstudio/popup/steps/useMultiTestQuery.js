import { useState } from 'react';
import { apiConfig } from '../../../../restapi/apiconfig';
import { executeTableQuery } from './spDataApi';
import dashboardConfig from '../../dashboardConfig';
import { MERGED_DATA_SOURCE_ID } from './wizardConstants';
import { paramsObjectFromMappings } from '../../generic/widgetSpecAdapter';

function isViewSource(ds) {
  return ds?.sourceType === 'VIEW';
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

  function paramsObjectForSource(ds, paramMappings = []) {
    const baseParams = (ds.params ?? []).reduce((acc, param) => {
      const key = param.paramName || param.key || param.name;
      if (key) acc[key.replace(/^@/, '')] = param.defaultValue ?? '';
      return acc;
    }, {});

    return {
      ...baseParams,
      ...paramsObjectFromMappings(paramMappings, ds.id),
    };
  }

  async function runTest(ds, paramMappings = []) {
    const dsId = ds.id;
    setResult(dsId, { loading: true, error: null, rows: [], columns: [], empty: false, executed: false });

    if (ds.sourceType === 'TABLE') {
      const cfg = ds.tableConfig ?? {};
      const tableParams = paramsObjectFromMappings(paramMappings, ds.id);
      const resolvedWhere = (cfg.whereConditions ?? [])
        .filter((c) => c.mappingType !== 'UNUSED')
        .map((c) => ({
          column: c.column,
          operator: c.operator ?? '=',
          value: c.mappingType === 'FIXED_VALUE'
            ? (c.fixedValue ?? '')
            : (tableParams[(c.paramName || c.column || '').replace(/^@/, '')] ?? ''),
        }))
        .filter((c) => c.value !== '');

      try {
        const result = await executeTableQuery({
          tableName: ds.sourceName,
          schema: ds.schema ?? 'dbo',
          columns: cfg.columns ?? [],
          whereConditions: resolvedWhere,
          orderBy: cfg.orderBy ?? [],
          topN: cfg.topN ?? dashboardConfig.tableTopN,
        });
        const cols = result.columns ?? [];
        const rows = (result.rows ?? []).map((row) =>
          Object.fromEntries(cols.map((col, i) => [col, row[i]]))
        );
        const completed = completeResult(rows, cols);
        setResult(dsId, completed);
        return completed;
      } catch (err) {
        const failed = errorResult(err, 'TABLE 조회 실패');
        setResult(dsId, failed);
        return failed;
      }
    }

    // P_VIEW* 를 포함한 모든 파라미터를 동일하게 처리한다.
    // 파라미터 배열에 P_VIEW1 항목이 있으면 그 값이 그대로 사용되고,
    // 없으면 해당 키 자체가 요청 body에 포함되지 않는다.
    const body = {
      PROCEDURE_NAME: ds.sourceName,
      timeout: 0,
    };

    if (!isViewSource(ds)) {
      Object.assign(body, paramsObjectForSource(ds, paramMappings));
    }

    try {
      const res = await apiConfig.makeRequest('POST', '/common/data', body, { errorMessage: false });
      if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
        const data = res.data;
        const completed = completeResult(data, Object.keys(data[0]));
        setResult(dsId, completed);
        return completed;
      }
      if (res.status === 200) {
        const completed = completeResult([], []);
        setResult(dsId, completed);
        return completed;
      }
      const failed = errorResult(null, isViewSource(ds) ? 'VIEW 조회 실패' : 'SP 실행 실패');
      setResult(dsId, failed);
      return failed;
    } catch (err) {
      const failed = errorResult(err, isViewSource(ds) ? 'VIEW 조회 실패' : 'SP 실행 실패');
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

    // UNION: concat client-side, no backend call needed
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
      const sources = mergeSources.map((ds) => {
        if (ds.sourceType === 'TABLE') {
          const cfg = ds.tableConfig ?? {};
          const tableParams = paramsObjectFromMappings(paramMappings, ds.id);
            return {
              type: 'TABLE',
              tableName: ds.sourceName,
              schema: ds.schema ?? 'dbo',
              columns: cfg.columns ?? [],
              whereConditions: (cfg.whereConditions ?? [])
              .filter((c) => c.mappingType !== 'UNUSED')
              .map((c) => ({
                column: c.column,
                operator: c.operator ?? '=',
                value: c.mappingType === 'FIXED_VALUE'
                  ? (c.fixedValue ?? '')
                  : (tableParams[(c.paramName || c.column || '').replace(/^@/, '')] ?? ''),
                }))
                .filter((c) => c.value !== ''),
              orderBy: cfg.orderBy ?? [],
              topN: cfg.topN ?? dashboardConfig.tableTopN,
            };
          }
        if (isViewSource(ds)) {
          return { type: 'VIEW', name: ds.sourceName, params: {} };
        }
        const params = paramsObjectForSource(ds, paramMappings);
        return { type: 'SP', name: ds.sourceName, params };
      });

      const res = await apiConfig.makeRequest('POST', '/common/merge-query', {
        sources,
        mergeConfig: {
          type,
          relationships: (mergeConfig?.relationships ?? []).map((r) => ({ leftCol: r.leftCol, rightCol: r.rightCol })),
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

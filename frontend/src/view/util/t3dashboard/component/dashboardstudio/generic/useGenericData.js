import { useEffect, useMemo, useState } from 'react';
import { apiConfig } from '../../../restapi/apiconfig';

const DEFAULT_TABLE_TOP_N = 200;

function resolveParams(params, filter, context = {}) {
  if (!params) return {};
  if (!Array.isArray(params)) {
    return Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key.replace(/^@/, ''), value == null ? '' : value])
    );
  }

  const result = {};
  params.forEach((param) => {
    const key = (param.key || param.paramName || param.name || '').replace(/^@/, '');
    if (!key) return;

    let value;
    switch (param.from) {
      case 'filter':
        value = filter[param.filterId] ?? '';
        break;
      case 'context':
        value = context[param.contextKey] ?? '';
        break;
      default:
        value = param.testValue ?? param.value ?? param.defaultValue ?? '';
        break;
    }
    result[key] = value == null ? '' : value;
  });
  return result;
}

function getRowsFromResponse(response) {
  const payload = response?.data?.data !== undefined ? response.data.data : response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}

function getPayloadFromResponse(response) {
  return response?.data?.data !== undefined ? response.data.data : response?.data;
}

function normalizeTableRows(result) {
  const columns = Array.isArray(result?.columns) ? result.columns : [];
  const rows = Array.isArray(result?.rows) ? result.rows : [];

  return rows.map((row) => {
    if (!Array.isArray(row)) return row;
    return Object.fromEntries(columns.map((column, index) => [column, row[index]]));
  });
}

function friendlyDataError(error, fallback = '데이터 조회 실패') {
  const detail = error?.response?.data?.detail || error?.response?.data?.error || error?.message || String(error || '');
  if (/String or binary data would be truncated/i.test(detail)) {
    return 'SP 파라미터 값이 허용 길이를 초과했습니다.';
  }
  if (/Procedure or function .* expects parameter/i.test(detail)) {
    return 'SP 실행에 필요한 파라미터가 전달되지 않았습니다.';
  }
  if (/too many arguments|too many parameters/i.test(detail)) {
    return 'SP에 정의되지 않은 파라미터가 전달되었습니다.';
  }
  return detail || fallback;
}

function isViewSource(dataConfig) {
  return dataConfig?.sourceType === 'VIEW';
}

function mapFields(rows, fieldMapping) {
  if (!fieldMapping || !rows.length) return rows;
  return rows.map((row) => {
    const mapped = { ...row };
    Object.entries(fieldMapping).forEach(([src, std]) => {
      if (src in row) mapped[std] = row[src];
    });
    return mapped;
  });
}

export function useGenericData(dataConfig) {
  const filter = {};
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const resolved = useMemo(
    () => resolveParams(dataConfig?.params, filter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(dataConfig?.params)]
  );

  const resolvedKey = JSON.stringify(resolved);
  const fallbackData = Array.isArray(dataConfig?.fallbackData) ? dataConfig.fallbackData : [];

  useEffect(() => {
    function useFallback() {
      if (!fallbackData.length) return false;
      setData(fallbackData);
      setError(null);
      return true;
    }

    if (dataConfig?.sourceType === 'MERGED') {
      setLoading(true);
      setError(null);
      apiConfig.makeRequest('POST', '/common/merge-query', {
        sources: dataConfig.sources || [],
        mergeConfig: dataConfig.mergeConfig || {},
      }, { errorMessage: false, waitOn: false })
        .then((response) => {
          if (response.status === 200) {
            setData(getRowsFromResponse(response));
            setError(null);
          } else if (!useFallback()) {
            setError('병합 조회 실패');
          }
        })
        .catch((requestError) => {
          if (!useFallback()) setError(friendlyDataError(requestError, '병합 조회 실패'));
        })
        .finally(() => setLoading(false));
      return;
    }

    if (dataConfig?.sourceType === 'TABLE') {
      const config = dataConfig.tableConfig || {};
      setLoading(true);
      setError(null);
      apiConfig.makeRequest('POST', '/common/table-query', {
        tableName: dataConfig.sourceName,
        schema: dataConfig.schema || 'dbo',
        columns: config.columns || [],
        whereConditions: (config.whereConditions || [])
          .filter(condition => condition.mappingType !== 'UNUSED')
          .map(condition => ({
            column: condition.column,
            operator: condition.operator || '=',
            value: condition.fixedValue ?? '',
          }))
          .filter(condition => condition.value !== ''),
        orderBy: config.orderBy || [],
        topN: config.topN || DEFAULT_TABLE_TOP_N,
      }, { errorMessage: false, waitOn: false })
        .then((response) => {
          if (response.status === 200) {
            setData(normalizeTableRows(getPayloadFromResponse(response)));
            setError(null);
          } else if (!useFallback()) {
            setError('TABLE 조회 실패');
          }
        })
        .catch((requestError) => {
          if (!useFallback()) setError(friendlyDataError(requestError, 'TABLE 조회 실패'));
        })
        .finally(() => setLoading(false));
      return;
    }

    if (!dataConfig?.procedureName) {
      useFallback();
      return;
    }

    setLoading(true);
    setError(null);

    const body = isViewSource(dataConfig) ? {
      PROCEDURE_NAME: dataConfig.procedureName,
      timeout: dataConfig.timeout ?? 0,
    } : {
      PROCEDURE_NAME: dataConfig.procedureName,
      ...(dataConfig.viewName && !resolved.P_VIEW1 ? { P_VIEW1: dataConfig.viewName } : {}),
      timeout: dataConfig.timeout ?? 0,
      ...resolved,
    };

    apiConfig.makeRequest('POST', '/common/data', body, { errorMessage: false, waitOn: false })
      .then((response) => {
        if (response.status === 200) {
          setData(mapFields(getRowsFromResponse(response), dataConfig.fieldMapping));
        } else if (!useFallback()) {
          setError('API 오류');
        }
      })
      .catch((requestError) => {
        if (!useFallback()) setError(friendlyDataError(requestError));
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dataConfig?.sourceType,
    dataConfig?.procedureName,
    dataConfig?.viewName,
    resolvedKey,
    JSON.stringify(fallbackData),
    JSON.stringify(dataConfig?.mergeConfig),
    JSON.stringify(dataConfig?.tableConfig),
  ]);

  return { data, loading, error };
}

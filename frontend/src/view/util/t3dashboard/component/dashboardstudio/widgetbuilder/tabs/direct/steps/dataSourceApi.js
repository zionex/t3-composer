import { apiConfig } from '../../../../../../restapi/apiconfig';

function unwrapData(response) {
  return response?.data ?? response;
}

export async function fetchDistinctValues({ table, column, schema = 'dbo' }) {
  try {
    const response = await apiConfig.makeRequest(
      'GET',
      '/common/distinct-values',
      { table, column, schema, limit: 50 },
      { waitOn: false }
    );
    const data = unwrapData(response);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchDateRange({ table, column, schema = 'dbo' }) {
  try {
    const response = await apiConfig.makeRequest(
      'GET',
      '/common/date-range',
      { table, column, schema },
      { waitOn: false }
    );
    const data = unwrapData(response);
    return { min_val: data?.min_val ?? null, max_val: data?.max_val ?? null };
  } catch {
    return { min_val: null, max_val: null };
  }
}

export async function fetchTableColumns(tableName, schema = 'dbo') {
  try {
    const response = await apiConfig.makeRequest(
      'GET',
      '/common/table-columns',
      { table: tableName, schema },
      { waitOn: false }
    );
    const data = unwrapData(response);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function executeTableQuery(config) {
  try {
    const response = await apiConfig.makeRequest(
      'POST',
      '/common/table-query',
      config,
      { waitOn: false }
    );
    return unwrapData(response) ?? { columns: [], rows: [] };
  } catch {
    return { columns: [], rows: [] };
  }
}

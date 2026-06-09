import { apiConfig } from '../../../../restapi/apiconfig';
import { COMMON_PARAMS } from '../../types/spParamTypes';

// ── SQL 타입 → JS 타입 변환 맵
const _SQL_TYPE_MAP = {
  date: 'DATE', datetime: 'DATE', datetime2: 'DATE', smalldatetime: 'DATE',
  int: 'NUMBER', bigint: 'NUMBER', smallint: 'NUMBER', tinyint: 'NUMBER',
  decimal: 'NUMBER', numeric: 'NUMBER', float: 'NUMBER', real: 'NUMBER',
  char: 'STRING', nchar: 'STRING', varchar: 'STRING', nvarchar: 'STRING',
  bit: 'BOOLEAN',
};

// COMMON_PARAMS를 paramName 키로 역인덱스
const _COMMON_BY_NAME = Object.fromEntries(
  Object.values(COMMON_PARAMS).map((p) => [p.paramName, p])
);

function _enrichParams(rawRows) {
  return rawRows
    .filter((r) => (r.PARAMETER_MODE ?? 'IN').toUpperCase() !== 'OUT')
    .map((r) => {
      const paramName = (r.PARAMETER_NAME ?? '').replace(/^@/, '');
      const sqlType   = (r.DATA_TYPE ?? '').toLowerCase();
      const maxLen    = r.CHARACTER_MAXIMUM_LENGTH;
      const common    = _COMMON_BY_NAME[paramName] ?? {};
      // CHAR(1) or CHAR(2) without explicit staticOptions → Y/N
      const isYN = sqlType === 'char' && (maxLen === 1 || maxLen === 2);
      return {
        paramName,
        dataType:      common.dataType      ?? (_SQL_TYPE_MAP[sqlType] ?? 'STRING'),
        required:      common.required      ?? true,
        description:   common.description   ?? '',
        defaultValue:  common.defaultValue  ?? '',
        staticOptions: common.staticOptions ?? (isYN ? ['Y', 'N'] : null),
        lookup:        common.lookup        ?? null,
      };
    });
}

function unwrapRows(response) {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function unwrapData(response) {
  return response?.data ?? response;
}

export async function fetchStoredProcedureParams(spName) {
  const endpoints = [
    '/insight/ai-dashboard/sp-catalog/params',
    '/common/sp-params',
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await apiConfig.makeRequest(
        'GET',
        endpoint,
        { sp_name: spName },
        { waitOn: false }
      );
      const rows = unwrapRows(response);
      if (rows.length > 0) return _enrichParams(rows);
    } catch (_) {
      // Try the next compatible endpoint.
    }
  }

  return [];
}

/**
 * STRING 파라미터용 DISTINCT 값 목록 조회.
 * @param {{ table: string, column: string, schema?: string }} lookup
 * @returns {Promise<string[]>}
 */
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

/**
 * DATE 파라미터용 MIN/MAX 조회.
 * @param {{ table: string, column: string, schema?: string }} lookup
 * @returns {Promise<{ min_val: string|null, max_val: string|null }>}
 */
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

/**
 * 테이블 컬럼 목록 조회.
 * @param {string} tableName
 * @param {string} [schema='dbo']
 * @returns {Promise<Array<{columnName:string, dataType:string, isNullable:boolean}>>}
 */
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

/**
 * 테이블 쿼리 실행.
 * @param {{
 *   tableName: string,
 *   schema?: string,
 *   columns?: string[],
 *   whereConditions?: Array<{column:string, operator:string, value:any}>,
 *   orderBy?: Array<{column:string, direction:'ASC'|'DESC'}>,
 *   topN?: number
 * }} config
 * @returns {Promise<{columns:string[], rows:any[][]}>}
 */
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

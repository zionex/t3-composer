import { MODULE_LIST } from '../direct/steps/wizardConstants';
import { getSourceMetadata } from '../../../../../restapi/widgetBuilder';

let cachedMetadata = null;
let inflightMetadata = null;

export async function loadMetadata(force = false) {
  if (!force && cachedMetadata) return cachedMetadata;
  if (!force && inflightMetadata) return inflightMetadata;

  inflightMetadata = getSourceMetadata()
    .then((data) => {
      cachedMetadata = {
        tables: Array.isArray(data?.tables) ? data.tables : [],
      };
      return cachedMetadata;
    })
    .finally(() => {
      inflightMetadata = null;
    });

  return inflightMetadata;
}

export function getCachedMetadata() {
  return cachedMetadata;
}

export function descriptionOf(row) {
  return row?.description || row?.comment || '';
}

const DOMAIN_MODULE_MAP = {
  sales: 'SA',
  sales_analysis: 'SA',
  demand_planning: 'DP',
  demand_plan: 'DP',
  business_forecast: 'BF',
  forecast: 'BF',
  master_planning: 'MP',
  inventory_management: 'IM',
  inventory: 'IM',
  replenishment: 'RP',
  sales_operations: 'SO',
  constraint_management: 'CM',
  factory_planning: 'FP',
  factory_plan: 'FP',
  factory_operation: 'FO',
  snop: 'SNOP',
};

function normalizeModule(value) {
  const module = String(value || '').trim().toUpperCase();
  return MODULE_LIST.includes(module) ? module : '';
}

export function moduleOf(row) {
  const direct = normalizeModule(row?.module || row?.module_cd || row?.moduleCode);
  if (direct) return direct;

  const name = String(row?.name || '').toUpperCase();
  const matched = name.match(/^(?:TB|VIEW|VW)_([A-Z]{2,4})(?:_|$)/);
  const inferred = normalizeModule(matched?.[1]);
  if (inferred) return inferred;

  const domain = String(row?.business_domain || row?.domain || '').trim().toLowerCase();
  return DOMAIN_MODULE_MAP[domain] || '';
}

export function filterRows(rows, search, moduleFilter) {
  const keyword = search.trim().toLowerCase();
  return rows.filter((row) => {
    if (moduleFilter && moduleOf(row) !== moduleFilter) return false;
    if (!keyword) return true;
    const haystack = [
      row?.name,
      descriptionOf(row),
      moduleOf(row),
      row?.business_domain,
      row?.category,
      row?.sub_category,
      row?.table_type,
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(keyword);
  });
}

export function compareValues(a, b) {
  const av = a == null ? '' : a;
  const bv = b == null ? '' : b;
  if (typeof av === 'number' && typeof bv === 'number') return av - bv;
  if (typeof av === 'boolean' || typeof bv === 'boolean') return Number(Boolean(av)) - Number(Boolean(bv));
  return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
}

export function getSortValue(row, column) {
  if (typeof column.sortValue === 'function') return column.sortValue(row);
  if (column.key.startsWith('_')) return '';
  return row?.[column.key];
}

export function compactColumnType(value) {
  return String(value || '-').replace(/\s+COLLATE\b.*$/i, '').trim() || '-';
}

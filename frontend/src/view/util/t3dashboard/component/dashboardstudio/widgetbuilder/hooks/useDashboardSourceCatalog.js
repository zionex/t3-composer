import { useCallback, useEffect, useState } from 'react';
import { getSourceCatalog } from '../../../../restapi/widgetBuilder';

let cachedCatalog = null;
let inflightCatalog = null;

function normalizeCatalogEntry(entry) {
  const sourceName = entry?.sourceName || entry?.name || '';
  return {
    id: entry?.id || sourceName,
    sourceType: entry?.sourceType || entry?.type || 'STORED_PROCEDURE',
    module: entry?.module || 'UNKNOWN',
    sourceName,
    description: entry?.description || '',
    returnType: entry?.returnType || 'MIXED',
    schema: entry?.schema || 'dbo',
    params: Array.isArray(entry?.params) ? entry.params : [],
    mockData: Array.isArray(entry?.mockData) ? entry.mockData : [],
    origin: entry?.origin || 'db_metadata',
    output_columns: entry?.output_columns ?? null,
  };
}

async function loadCatalog(force = false) {
  if (!force && Array.isArray(cachedCatalog)) return cachedCatalog;
  if (!force && inflightCatalog) return inflightCatalog;
  inflightCatalog = getSourceCatalog()
    .then((rows) => {
      cachedCatalog = Array.isArray(rows) ? rows.map(normalizeCatalogEntry) : [];
      return cachedCatalog;
    })
    .finally(() => { inflightCatalog = null; });
  return inflightCatalog;
}

export function findCatalogEntry(catalog, source) {
  const sourceName = source?.sourceName || source?.name || source;
  const id = source?.id || sourceName;
  if (!sourceName && !id) return null;
  return (catalog ?? []).find((entry) =>
    entry.id === id || entry.sourceName === sourceName || entry.sourceName === source?.name
  ) ?? null;
}

export function enrichSourceFromCatalog(source, catalog, fallback = {}) {
  const catalogEntry = findCatalogEntry(catalog, source);
  return {
    ...(catalogEntry ?? {}),
    ...(fallback ?? {}),
    ...(source ?? {}),
    id: source?.id ?? catalogEntry?.id ?? source?.sourceName ?? source?.name,
    sourceType: source?.sourceType ?? source?.type ?? catalogEntry?.sourceType ?? 'STORED_PROCEDURE',
    sourceName: source?.sourceName ?? source?.name ?? catalogEntry?.sourceName ?? '',
    module: source?.module ?? catalogEntry?.module ?? fallback?.module ?? 'UNKNOWN',
    schema: source?.schema ?? catalogEntry?.schema ?? 'dbo',
    params: Array.isArray(source?.params) && source.params.length ? source.params : (catalogEntry?.params ?? []),
    mockData: Array.isArray(source?.mockData) && source.mockData.length ? source.mockData : (catalogEntry?.mockData ?? []),
  };
}

export default function useDashboardSourceCatalog({ enabled = true } = {}) {
  const [catalog, setCatalog] = useState(() => cachedCatalog ?? []);
  const [loading, setLoading] = useState(enabled && !cachedCatalog);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await loadCatalog(true);
      setCatalog(rows);
      return rows;
    } catch (err) {
      setError(err);
      setCatalog([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    setLoading(!cachedCatalog);
    setError(null);
    loadCatalog(false)
      .then((rows) => { if (!cancelled) setCatalog(rows); })
      .catch((err) => { if (!cancelled) { setError(err); setCatalog([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [enabled]);

  return { catalog, loading, error, refresh };
}

import { useMemo } from 'react';
import useDashboardSourceCatalog from '../../widgetbuilder/hooks/useDashboardSourceCatalog';

const MODULE_NAMES = {
  SA: '판매분석', DP: '수요계획', BF: '기저예측', MP: '생산계획',
  IM: '재고관리', RP: '보충계획', SO: '판매주문', CM: '채널관리',
  SNOP: 'S&OP', TABLE: '테이블',
};

const RETURN_TYPE_LABELS = {
  SINGLE_KPI: 'KPI 지표', LIST_DATA: '목록 조회',
  TIME_SERIES: '시계열 추이', MIXED: '복합',
};

export function useDbMetadataSource() {
  const { catalog, loading, error } = useDashboardSourceCatalog();

  const sources = useMemo(() => catalog.map(entry => ({
    id: entry.id,
    name: entry.sourceName,
    sourceType: entry.sourceType,
    table_type: entry.sourceType,
    comment: entry.description,
    description: entry.description,
    module: entry.module,
    business_domain: MODULE_NAMES[entry.module] || entry.module,
    category: RETURN_TYPE_LABELS[entry.returnType] || entry.returnType || '일반',
    columns: [],
    grain: null,
    keywords: null,
  })), [catalog]);

  const domains = useMemo(
    () => [...new Set(sources.map(s => s.business_domain))].sort(),
    [sources]
  );

  const categoriesForDomain = (domain) =>
    [...new Set(sources.filter(s => s.business_domain === domain).map(s => s.category))].sort();

  const sourcesForCategory = (domain, category) =>
    sources.filter(s => s.business_domain === domain && s.category === category);

  return { loading, error: error?.message || error || null, sources, domains, categoriesForDomain, sourcesForCategory };
}

import { findCatalogEntry } from './hooks/useDashboardSourceCatalog';
import { defaultVisualConfig } from '../popup/steps/wizardConstants';

/**
 * suggestWidget 응답을 saveWidgetToLibrary 페이로드로 변환한다.
 * @param {object} suggestResult - suggestWidget API 응답의 widget_spec
 * @param {string} prompt - 사용자 입력 프롬프트 (widgetTitle 폴백용)
 * @param {Array}  catalog - useDashboardSourceCatalog의 catalog 배열
 * @param {string} userId  - 현재 사용자 ID
 * @returns {object} saveWidgetToLibrary에 전달할 페이로드
 */
export function buildWidgetSpecFromSuggest(suggestResult, prompt, catalog, userId) {
  const widgetType = suggestResult?.widgetType || 'kpi';
  const rawSource = suggestResult?.dataSource || suggestResult?.dataSources?.[0];
  const catalogEntry = findCatalogEntry(catalog, rawSource);

  const dsId = catalogEntry?.id || rawSource?.id || `ds_${Date.now()}`;
  const sourceName = catalogEntry?.sourceName || rawSource?.name || '';
  const dsModule = catalogEntry?.module || rawSource?.module || 'SA';
  const sourceType = catalogEntry?.sourceType || rawSource?.sourceType || 'STORED_PROCEDURE';

  const aiVisualConfig = suggestResult?.visualConfig;
  const visualConfig =
    aiVisualConfig && Object.keys(aiVisualConfig).length > 0
      ? { type: widgetType, ...aiVisualConfig }
      : defaultVisualConfig(widgetType);

  const title = suggestResult?.widgetTitle || prompt;

  return {
    title,
    description: suggestResult?.suggestReason || '',
    module: dsModule,
    widget_type: widgetType,
    spec_json: {
      widgetTitle: title,
      widgetType,
      dataConfig: {
        procedureName: sourceName,
        viewName: '',
        params: suggestResult?.paramBindings || {},
        fallbackData: [],
        timeout: 0,
      },
      dataSource: {
        id: dsId,
        type: sourceType,
        name: sourceName,
        module: dsModule,
        mockData: catalogEntry?.mockData || [],
      },
      paramBindings: suggestResult?.paramBindings || {},
      visualConfig,
    },
    created_by: userId,
  };
}

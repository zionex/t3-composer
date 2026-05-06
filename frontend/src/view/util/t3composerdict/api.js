import { zAxios } from '@wingui/common/imports';

/**
 * Composer 갤러리 백엔드 (/composer/dictionary/**) 호출.
 * URL path 는 기존 /dictionary/ 유지 (API 호환).
 */

// ---- Grid Types ----
export const listGridTypes  = (activeOnly = false) => zAxios.get('composer/dictionary/grid-types',   { params: { activeOnly } });
export const saveGridType   = (payload)            => zAxios.post('composer/dictionary/grid-types',  payload);
export const deleteGridType = (id)                 => zAxios.delete(`composer/dictionary/grid-types/${id}`);

// ---- Chart Types ----
export const listChartTypes  = (activeOnly = false) => zAxios.get('composer/dictionary/chart-types',  { params: { activeOnly } });
export const saveChartType   = (payload)            => zAxios.post('composer/dictionary/chart-types', payload);
export const deleteChartType = (id)                 => zAxios.delete(`composer/dictionary/chart-types/${id}`);

// ---- KPIs ----
export const listKpis        = (activeOnly = false) => zAxios.get('composer/dictionary/kpis',         { params: { activeOnly } });
export const saveKpi         = (payload)            => zAxios.post('composer/dictionary/kpis',        payload);
export const deleteKpi       = (id)                 => zAxios.delete(`composer/dictionary/kpis/${id}`);

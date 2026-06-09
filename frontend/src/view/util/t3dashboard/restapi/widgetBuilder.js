import { apiConfig } from './apiconfig';
import { stripResponse } from './util';

export const suggestWidget = async (data, options = {}) => {
  const response = await apiConfig.makeRequest('POST', '/insight/widget-builder/suggest', data, options);
  return stripResponse(response);
};

export const getSourceCatalog = async (options = {}) => {
  const response = await apiConfig.makeRequest('GET', '/insight/widget-builder/source-catalog', null, { waitOn: false, ...options });
  return stripResponse(response);
};

export const getSourceMetadata = async (options = {}) => {
  const response = await apiConfig.makeRequest('GET', '/insight/widget-builder/source-metadata', null, { waitOn: false, ...options });
  return stripResponse(response);
};

export const exportBusinesstree = async (options = {}) => {
  const response = await apiConfig.makeRequest('POST', '/insight/widget-builder/export-businesstree', null, options);
  return stripResponse(response);
};

export const getWidgetLibrary = async (createdBy = null, options = {}) => {
  const params = createdBy ? { created_by: createdBy } : {};
  const response = await apiConfig.makeRequest('GET', '/insight/widget-builder/library', params, options);
  return stripResponse(response);
};

export const saveWidgetToLibrary = async (data, options = {}) => {
  const response = await apiConfig.makeRequest('POST', '/insight/widget-builder/library', data, options);
  return stripResponse(response);
};

export const deleteWidgetFromLibrary = async (widgetId, options = {}) => {
  const response = await apiConfig.makeRequest('DELETE', `/insight/widget-builder/library/${widgetId}`, null, options);
  return stripResponse(response);
};

export const updateWidgetInLibrary = async (widgetId, data, options = {}) => {
  const response = await apiConfig.makeRequest('PUT', `/insight/widget-builder/library/${widgetId}`, data, options);
  return stripResponse(response);
};

export const saveDashboard = async (data, options = {}) => {
  const response = await apiConfig.makeRequest('POST', '/insight/dashboard-builder/save', data, options);
  return stripResponse(response);
};

export const listDashboards = async (createdBy = null, groupId = null, options = {}) => {
  const params = {};
  if (createdBy) params.created_by = createdBy;
  if (groupId) params.group_id = groupId;
  const response = await apiConfig.makeRequest('GET', '/insight/dashboard-builder/list', params, options);
  return stripResponse(response);
};

export const getDashboard = async (dashboardId, options = {}) => {
  const response = await apiConfig.makeRequest('GET', `/insight/dashboard-builder/${dashboardId}`, null, options);
  return stripResponse(response);
};

export const deleteDashboard = async (dashboardId, options = {}) => {
  const response = await apiConfig.makeRequest('DELETE', `/insight/dashboard-builder/${dashboardId}`, null, options);
  return stripResponse(response);
};

export const getBusinessTreeModules = async (options = {}) => {
  const response = await apiConfig.makeRequest('GET', '/insight/widget-builder/business-tree/modules', null, { waitOn: false, ...options });
  return stripResponse(response);
};

export const getBusinessTree = async (module = null, options = {}) => {
  const params = module ? { module } : {};
  const response = await apiConfig.makeRequest('GET', '/insight/widget-builder/business-tree', params, { waitOn: false, ...options });
  return stripResponse(response);
};

export const updateDashboardAccess = async (dashboardId, data, options = {}) => {
  const response = await apiConfig.makeRequest('PUT', `/insight/dashboard-builder/${dashboardId}/access`, data, options);
  return stripResponse(response);
};

export const getBusinessTreeCandidates = async (data, options = {}) => {
  const response = await apiConfig.makeRequest('POST', '/insight/widget-builder/business-tree/candidates', data, { waitOn: false, ...options });
  return stripResponse(response);
};

export const getBizTables = async (module = null, options = {}) => {
  const params = module ? { module } : {};
  const response = await apiConfig.makeRequest('GET', '/insight/widget-builder/business-tree/biz/tables', params, { waitOn: false, ...options });
  return stripResponse(response);
};

export const getBizColumns = async (tableId = null, options = {}) => {
  const params = tableId ? { table_id: tableId } : {};
  const response = await apiConfig.makeRequest('GET', '/insight/widget-builder/business-tree/biz/columns', params, { waitOn: false, ...options });
  return stripResponse(response);
};

export const getBizKeywords = async (tableId = null, options = {}) => {
  const params = tableId ? { table_id: tableId } : {};
  const response = await apiConfig.makeRequest('GET', '/insight/widget-builder/business-tree/biz/keywords', params, { waitOn: false, ...options });
  return stripResponse(response);
};

export const getBizJoins = async (tableId = null, options = {}) => {
  const params = tableId ? { table_id: tableId } : {};
  const response = await apiConfig.makeRequest('GET', '/insight/widget-builder/business-tree/biz/joins', params, { waitOn: false, ...options });
  return stripResponse(response);
};

export const getBizCategories = async (options = {}) => {
  const response = await apiConfig.makeRequest('GET', '/insight/widget-builder/business-tree/biz/categories', null, { waitOn: false, ...options });
  return stripResponse(response);
};

export const patchBizCategory = async (category, data, options = {}) => {
  const response = await apiConfig.makeRequest('PATCH', `/insight/widget-builder/business-tree/biz/categories/${encodeURIComponent(category)}`, data, options);
  return stripResponse(response);
};

export const patchBizKeyword = async (tableId, module, keyword, data, options = {}) => {
  const response = await apiConfig.makeRequest('PATCH', '/insight/widget-builder/business-tree/biz/keywords', data, { ...options, params: { table_id: tableId, module, keyword } });
  return stripResponse(response);
};

export const patchBizColumn = async (colId, data, options = {}) => {
  const response = await apiConfig.makeRequest('PATCH', `/insight/widget-builder/business-tree/biz/columns/${colId}`, data, options);
  return stripResponse(response);
};

export const addBizJoin = async (data, options = {}) => {
  const response = await apiConfig.makeRequest('POST', '/insight/widget-builder/business-tree/biz/joins', data, options);
  return stripResponse(response);
};

export const deleteBizJoin = async (params, options = {}) => {
  const response = await apiConfig.makeRequest('DELETE', '/insight/widget-builder/business-tree/biz/joins', params, options);
  return stripResponse(response);
};

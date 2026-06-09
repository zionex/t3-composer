import {
  DASHBOARD_GRID_COLS,
  DASHBOARD_GRID_DEFAULT_H,
  DASHBOARD_GRID_DEFAULT_W,
} from '../core/dashboardGridRules';

// SalesBoard 전용 표준 레이아웃 — 사용자가 KPI 위젯을 임의 크기로 저장했더라도
// 도메인 표준 비율로 강제 정규화한다. (도메인 특화 분기지만 추후 별도 모듈로 분리 가능)
export const SALESBOARD_LAYOUT_BY_WIDGET_ID = {
  WI_DP_YEAR_TARGET_SALES: { x: 0, y: 0, w: 4, h: 18 },
  WI_DP_YEAR_ACTUAL_SALES: { x: 4, y: 0, w: 4, h: 18 },
  WI_DP_TOP_SALES_ITEM:    { x: 8, y: 0, w: 4, h: 18 },
  WI_DP_PLAN_STATUS_Y:     { x: 0, y: 18, w: 6, h: 41 },
  WI_DP_TOP_SALES_ITEMGRP: { x: 6, y: 18, w: 6, h: 41 },
  WI_DP_TOP_SALES_ACCOUNT: { x: 0, y: 59, w: 12, h: 41 },
};

export const SALESBOARD_WIDGET_IDS = Object.keys(SALESBOARD_LAYOUT_BY_WIDGET_ID);

export function getWidgetId(wconfig) {
  return wconfig?.widgetId || wconfig?.widget_id || wconfig?.id;
}

export function getWidgetGrid(wconfig) {
  return wconfig?.['data-grid'] || wconfig?.data_grid || {};
}

export function toFiniteGridNumber(value, fallback) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function shouldNormalizeSalesBoardLayout(widgetConfigs) {
  if (!Array.isArray(widgetConfigs)) return false;

  const widgetById = new Map(widgetConfigs.map(wconfig => [getWidgetId(wconfig), wconfig]));
  if (!SALESBOARD_WIDGET_IDS.every(widgetId => widgetById.has(widgetId))) return false;

  const kpiWidgets = [
    widgetById.get('WI_DP_YEAR_TARGET_SALES'),
    widgetById.get('WI_DP_YEAR_ACTUAL_SALES'),
    widgetById.get('WI_DP_TOP_SALES_ITEM'),
  ];
  const accountWidget = widgetById.get('WI_DP_TOP_SALES_ACCOUNT');

  return (
    kpiWidgets.every(wconfig => wconfig?.['data-grid']?.w === 2 && Number(wconfig?.['data-grid']?.h) < 10) &&
    accountWidget?.['data-grid']?.w === 6 &&
    accountWidget?.['data-grid']?.x === 6 &&
    Number(accountWidget?.['data-grid']?.h) < 20
  );
}

export function normalizeSalesBoardLayout(widgetConfigs) {
  if (!shouldNormalizeSalesBoardLayout(widgetConfigs)) return widgetConfigs;

  return widgetConfigs.map((wconfig) => {
    const normalizedLayout = SALESBOARD_LAYOUT_BY_WIDGET_ID[getWidgetId(wconfig)];
    if (!normalizedLayout) return wconfig;

    return {
      ...wconfig,
      'data-grid': {
        ...wconfig['data-grid'],
        ...normalizedLayout,
        i: wconfig.key,
      },
    };
  });
}

export function normalizeDashboardWidgets(widgetConfigs) {
  if (!Array.isArray(widgetConfigs)) return [];

  return normalizeSalesBoardLayout(widgetConfigs).map((wconfig, index) => ({
    ...wconfig,
    key: wconfig.key || String(index + 1),
    'data-grid': {
      ...(wconfig['data-grid'] || {}),
      i: wconfig.key || String(index + 1),
    },
  }));
}

export function getDashboardMaxRow(widgetConfigs) {
  if (!Array.isArray(widgetConfigs) || widgetConfigs.length === 0) return 0;

  return widgetConfigs.reduce((maxRow, wconfig, index) => {
    const grid = getWidgetGrid(wconfig);
    const y = toFiniteGridNumber(grid.y, index * 2);
    const h = toFiniteGridNumber(grid.h, DASHBOARD_GRID_DEFAULT_H);
    return Math.max(maxRow, y + h);
  }, 0);
}

export function toReadOnlyLayoutItem(wconfig, index = 0) {
  const grid = getWidgetGrid(wconfig);
  const minW = toFiniteGridNumber(grid.minW, 2);
  const minH = toFiniteGridNumber(grid.minH, 3);
  const rawX = toFiniteGridNumber(grid.x, 0);
  const rawY = toFiniteGridNumber(grid.y, index * 2);
  const rawW = toFiniteGridNumber(grid.w, DASHBOARD_GRID_DEFAULT_W);
  const rawH = toFiniteGridNumber(grid.h, DASHBOARD_GRID_DEFAULT_H);
  let x = Math.max(0, Math.min(rawX, DASHBOARD_GRID_COLS - 1));
  let w = Math.min(DASHBOARD_GRID_COLS - x, Math.max(minW, rawW));

  if (w < minW) {
    w = minW;
    x = Math.max(0, DASHBOARD_GRID_COLS - w);
  }

  return {
    ...grid,
    i: grid.i || wconfig.key || String(index + 1),
    x,
    y: Math.max(0, rawY),
    w,
    h: Math.max(minH, rawH),
    minW,
    minH,
    static: true,
    isDraggable: false,
    isResizable: false,
  };
}

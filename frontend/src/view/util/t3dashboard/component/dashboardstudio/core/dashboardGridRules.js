export const DASHBOARD_GRID_COLS = 12;
export const DASHBOARD_GRID_MIN_ROWS = 12;
export const DASHBOARD_GRID_FALLBACK_ROW_HEIGHT = 40;
export const DASHBOARD_GRID_MIN_ROW_HEIGHT = 34;
export const DASHBOARD_GRID_DEFAULT_W = 6;
export const DASHBOARD_GRID_DEFAULT_H = 8;
export const DASHBOARD_BUILDER_MAX_ROWS = DASHBOARD_GRID_MIN_ROWS;
export const DASHBOARD_BUILDER_DEFAULT_H = 5;
export const DASHBOARD_GRID_MARGIN = [8, 8];
export const DASHBOARD_GRID_PADDING = [4, 4];
export const DASHBOARD_RESIZE_HANDLES = ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'];
export const DASHBOARD_MAX_GRID_ROWS = 1000;
export const DASHBOARD_BUILDER_SLACK_ROWS = 4;

export function calculateDashboardRowHeight(containerHeight, rows = DASHBOARD_GRID_MIN_ROWS) {
  if (!containerHeight) return DASHBOARD_GRID_FALLBACK_ROW_HEIGHT;

  const verticalGaps = DASHBOARD_GRID_MARGIN[1] * (rows - 1);
  const verticalPadding = DASHBOARD_GRID_PADDING[1] * 2;
  const availableHeight = containerHeight - verticalGaps - verticalPadding;
  return Math.max(
    DASHBOARD_GRID_MIN_ROW_HEIGHT,
    Math.floor(availableHeight / rows),
  );
}

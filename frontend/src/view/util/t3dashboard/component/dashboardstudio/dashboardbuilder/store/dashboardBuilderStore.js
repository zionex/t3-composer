import { create } from 'zustand';
import {
  DASHBOARD_GRID_COLS,
  DASHBOARD_BUILDER_DEFAULT_H,
  DASHBOARD_MAX_GRID_ROWS,
  DASHBOARD_GRID_MIN_ROWS,
  DASHBOARD_BUILDER_SLACK_ROWS,
  DASHBOARD_GRID_DEFAULT_W,
  DASHBOARD_RESIZE_HANDLES,
} from '../../core/dashboardGridRules';

function normalizeLayout(layout = {}, fallback = {}) {
  const minW = layout.minW ?? fallback.minW ?? 2;
  const minH = layout.minH ?? fallback.minH ?? 3;
  const rawW = Number.isFinite(layout.w) ? layout.w : fallback.w ?? DASHBOARD_GRID_DEFAULT_W;
  const rawH = Number.isFinite(layout.h) ? layout.h : fallback.h ?? DASHBOARD_BUILDER_DEFAULT_H;
  let x = Math.max(0, Math.min(Number.isFinite(layout.x) ? layout.x : fallback.x ?? 0, DASHBOARD_GRID_COLS - 1));
  let w = Math.min(DASHBOARD_GRID_COLS - x, Math.max(minW, rawW));
  const h = Math.min(DASHBOARD_MAX_GRID_ROWS, Math.max(minH, rawH));
  const y = Math.max(0, Math.min(
    Number.isFinite(layout.y) ? layout.y : fallback.y ?? 0,
    DASHBOARD_MAX_GRID_ROWS - h
  ));

  if (w < minW) {
    w = minW;
    x = Math.max(0, DASHBOARD_GRID_COLS - w);
  }

  return {
    ...layout,
    i: layout.i ?? fallback.i,
    x,
    y,
    w,
    h,
    minW,
    minH,
    maxW: DASHBOARD_GRID_COLS,
    maxH: Math.max(minH, DASHBOARD_MAX_GRID_ROWS - y),
    isDraggable: layout.isDraggable !== false,
    isResizable: layout.isResizable !== false,
    isBounded: true,
    resizeHandles: DASHBOARD_RESIZE_HANDLES,
  };
}

function collides(a, b) {
  if (a.i === b.i) return false;
  if (a.x + a.w <= b.x) return false;
  if (a.x >= b.x + b.w) return false;
  if (a.y + a.h <= b.y) return false;
  if (a.y >= b.y + b.h) return false;
  return true;
}

function getMaxOccupiedRow(canvasWidgets) {
  if (!canvasWidgets.length) return 0;
  return canvasWidgets.reduce((max, w) => {
    const layout = w.layout || {};
    const y = Number.isFinite(layout.y) ? layout.y : 0;
    const h = Number.isFinite(layout.h) ? layout.h : DASHBOARD_BUILDER_DEFAULT_H;
    return Math.max(max, y + h);
  }, 0);
}

function isInsideVisibleGrid(item, maxRows) {
  return item.x >= 0 &&
    item.y >= 0 &&
    item.x + item.w <= DASHBOARD_GRID_COLS &&
    item.y + item.h <= maxRows;
}

function widgetDefaultLayout(widget, key) {
  return normalizeLayout({
    i: key,
    x: 0,
    y: 0,
    w: widget.widget_type === 'kpi' ? 3 : 6,
    h: widget.widget_type === 'kpi' ? 4 : DASHBOARD_BUILDER_DEFAULT_H,
    minW: widget.widget_type === 'kpi' ? 2 : 3,
    minH: 3,
  });
}

function findVisibleSlotAtSize(item, occupied, w, h, maxRows) {
  for (let y = 0; y <= maxRows - h; y += 1) {
    for (let x = 0; x <= DASHBOARD_GRID_COLS - w; x += 1) {
      const candidate = normalizeLayout({ ...item, x, y, w, h });
      if (!occupied.some((other) => collides(candidate, other))) return candidate;
    }
  }

  return null;
}

function compareVisibleSlotCandidate(candidate, currentBest, baseItem) {
  if (!currentBest) return -1;

  const candidateArea = candidate.w * candidate.h;
  const currentArea = currentBest.w * currentBest.h;
  if (candidateArea !== currentArea) return currentArea - candidateArea;

  const candidateDelta = (baseItem.w - candidate.w) + (baseItem.h - candidate.h);
  const currentDelta = (baseItem.w - currentBest.w) + (baseItem.h - currentBest.h);
  if (candidateDelta !== currentDelta) return candidateDelta - currentDelta;

  if (candidate.y !== currentBest.y) return candidate.y - currentBest.y;
  return candidate.x - currentBest.x;
}

function findVisibleSlot(item, occupiedLayouts, maxRows) {
  const baseItem = normalizeLayout(item);
  const occupied = occupiedLayouts
    .map((layout) => normalizeLayout(layout))
    .filter((layout) => isInsideVisibleGrid(layout, maxRows));

  if (baseItem.w > DASHBOARD_GRID_COLS || baseItem.h > maxRows) return null;

  const defaultSlot = findVisibleSlotAtSize(baseItem, occupied, baseItem.w, baseItem.h, maxRows);
  if (defaultSlot) return defaultSlot;

  let bestSlot = null;
  for (let h = baseItem.h; h >= baseItem.minH; h -= 1) {
    for (let w = baseItem.w; w >= baseItem.minW; w -= 1) {
      if (w === baseItem.w && h === baseItem.h) continue;

      const candidate = findVisibleSlotAtSize(baseItem, occupied, w, h, maxRows);
      if (candidate && compareVisibleSlotCandidate(candidate, bestSlot, baseItem) < 0) {
        bestSlot = candidate;
      }
    }
  }

  return bestSlot;
}

function resolveLayoutOverlaps(layouts) {
  const resolved = [];
  [...layouts]
    .sort((a, b) => (a.y - b.y) || (a.x - b.x))
    .forEach((item) => {
      resolved.push(findAvailableSlot(normalizeLayout(item), resolved));
    });
  return resolved;
}

function findAvailableSlot(item, resolved) {
  if (!resolved.some((other) => collides(item, other))) return item;

  for (let h = item.h; h >= item.minH; h -= 1) {
    for (let w = item.w; w >= item.minW; w -= 1) {
      for (let y = 0; y <= DASHBOARD_MAX_GRID_ROWS - h; y += 1) {
        for (let x = 0; x <= DASHBOARD_GRID_COLS - w; x += 1) {
          const candidate = normalizeLayout({ ...item, x, y, w, h });
          if (!resolved.some((other) => collides(candidate, other))) return candidate;
        }
      }
    }
  }

  return item;
}

function applyResolvedLayouts(widgets) {
  const layouts = resolveLayoutOverlaps(
    widgets.map((widget) => normalizeLayout(widget.layout, { i: widget.key }))
  );
  return widgets.map((widget) => {
    const found = layouts.find((layout) => layout.i === widget.key);
    return found ? { ...widget, layout: found } : widget;
  });
}

function sameLayout(a = {}, b = {}) {
  return a.x === b.x &&
    a.y === b.y &&
    a.w === b.w &&
    a.h === b.h &&
    a.minW === b.minW &&
    a.minH === b.minH &&
    a.maxW === b.maxW &&
    a.maxH === b.maxH;
}

export const useDashboardBuilderStore = create((set, get) => ({
  // 대시보드 메타 정보
  dashboardId: null,
  title: '',
  type: 'public',            // 'public' | 'group' | 'private'
  selectedGroupIds: [],
  availableGroups: [],

  setDashboardId: (id) => set({ dashboardId: id }),
  setTitle: (title) => set({ title }),
  setType: (type) => set({ type, ...(type !== 'group' ? { selectedGroupIds: [] } : {}) }),
  setSelectedGroupIds: (ids) => set({ selectedGroupIds: ids }),
  setAvailableGroups: (groups) => set({ availableGroups: groups }),

  // 캔버스 위젯 목록 (배치 + spec 포함)
  // item: { key, title, widget_type, spec_json, layout: {x,y,w,h,i} }
  canvasWidgets: [],
  setCanvasWidgets: (widgets) => set({ canvasWidgets: applyResolvedLayouts(widgets) }),
  selectedWidgetKey: null,
  setSelectedWidgetKey: (key) => {
    const selectedWidgetKey = key ?? null;
    if (get().selectedWidgetKey === selectedWidgetKey) return;
    set({ selectedWidgetKey });
  },
  canAddWidget: (widget) => {
    const { canvasWidgets } = get();
    const candidate = widgetDefaultLayout(widget, '__candidate__');
    const maxRows = Math.max(DASHBOARD_GRID_MIN_ROWS, getMaxOccupiedRow(canvasWidgets) + DASHBOARD_BUILDER_SLACK_ROWS);
    return Boolean(findVisibleSlot(candidate, canvasWidgets.map((w) => normalizeLayout(w.layout, { i: w.key })), maxRows));
  },

  addWidget: (widget) => {
    const { canvasWidgets } = get();
    const key = `w_${Date.now()}`;
    const maxRows = Math.max(DASHBOARD_GRID_MIN_ROWS, getMaxOccupiedRow(canvasWidgets) + DASHBOARD_BUILDER_SLACK_ROWS);
    const layout = findVisibleSlot(
      widgetDefaultLayout(widget, key),
      canvasWidgets.map((w) => normalizeLayout(w.layout, { i: w.key })),
      maxRows
    );
    if (!layout) return false;

    const nextWidgets = [
        ...canvasWidgets,
        {
          ...widget,
          key,
          layout,
        },
      ];
    set({ canvasWidgets: applyResolvedLayouts(nextWidgets), selectedWidgetKey: key });
    return true;
  },

  removeWidget: (key) => {
    const { canvasWidgets, selectedWidgetKey } = get();
    set({
      canvasWidgets: canvasWidgets.filter(w => w.key !== key),
      selectedWidgetKey: selectedWidgetKey === key ? null : selectedWidgetKey,
    });
  },

  updateWidget: (key, patch) => {
    const { canvasWidgets } = get();
    set({
      canvasWidgets: canvasWidgets.map(w =>
        w.key === key ? { ...w, ...patch, layout: normalizeLayout(patch.layout ?? w.layout, w.layout) } : w
      ),
    });
  },

  updateLayout: (layouts) => {
    const { canvasWidgets } = get();
    const incomingLayouts = layouts.map((layout) => normalizeLayout(layout));
    let changed = false;
    const nextWidgets = canvasWidgets.map(w => {
        const found = incomingLayouts.find(l => l.i === w.key);
        if (!found) return w;
        const nextLayout = normalizeLayout(found, w.layout);
        if (sameLayout(w.layout, nextLayout)) return w;
        changed = true;
        return { ...w, layout: nextLayout };
      });
    if (!changed) return;
    set({ canvasWidgets: nextWidgets });
  },

  // 저장 상태
  saving: false,
  saveResult: null,
  setSaving: (v) => set({ saving: v }),
  setSaveResult: (r) => set({ saveResult: r }),

  reset: () => set({
    dashboardId: null,
    title: '',
    type: 'public',
    selectedGroupIds: [],
    canvasWidgets: [],
    selectedWidgetKey: null,
    saving: false,
    saveResult: null,
  }),
}));

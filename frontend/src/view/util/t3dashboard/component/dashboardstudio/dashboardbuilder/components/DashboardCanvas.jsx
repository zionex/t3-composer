import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GridLayout, useContainerWidth, noCompactor } from '../../core/GridLayoutCompat';
import { Box, Typography, IconButton, Paper, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import GenericWidget from '../../generic/GenericWidget';
import { toWidgetDataConfig, toWidgetVisualConfig } from '../../generic/widgetSpecAdapter';
import { useDashboardBuilderStore } from '../store/dashboardBuilderStore';
import {
  DASHBOARD_GRID_COLS,
  DASHBOARD_BUILDER_DEFAULT_H,
  DASHBOARD_GRID_MIN_ROWS,
  DASHBOARD_MAX_GRID_ROWS,
  DASHBOARD_BUILDER_SLACK_ROWS,
  DASHBOARD_GRID_DEFAULT_W,
  DASHBOARD_GRID_MARGIN,
  DASHBOARD_GRID_PADDING,
  DASHBOARD_RESIZE_HANDLES,
  calculateDashboardRowHeight,
} from '../../core/dashboardGridRules';

const FIXED_GRID_COMPACTOR = { ...noCompactor, preventCollision: true };
function normalizeLayoutItem(item, fallbackIndex = 0, maxRows = DASHBOARD_MAX_GRID_ROWS) {
  const minW = item?.minW ?? 2;
  const minH = item?.minH ?? 3;
  const rawW = Number.isFinite(item?.w) ? item.w : DASHBOARD_GRID_DEFAULT_W;
  const rawH = Number.isFinite(item?.h) ? item.h : DASHBOARD_BUILDER_DEFAULT_H;
  let x = Math.max(0, Math.min(Number.isFinite(item?.x) ? item.x : 0, DASHBOARD_GRID_COLS - 1));
  let w = Math.min(DASHBOARD_GRID_COLS - x, Math.max(minW, rawW));
  const h = Math.min(maxRows, Math.max(minH, rawH));
  const y = Math.max(0, Math.min(
    Number.isFinite(item?.y) ? item.y : fallbackIndex * 2,
    maxRows - h
  ));

  if (w < minW) {
    w = minW;
    x = Math.max(0, DASHBOARD_GRID_COLS - w);
  }

  return {
    ...item,
    x,
    y,
    w,
    h,
    minW,
    minH,
    maxW: DASHBOARD_GRID_COLS,
    maxH: Math.max(minH, maxRows - y),
    isDraggable: item?.isDraggable !== false,
    isResizable: item?.isResizable !== false,
    isBounded: true,
    resizeHandles: DASHBOARD_RESIZE_HANDLES,
  };
}

function renderResizeHandle(axis, ref) {
  return (
    <span
      ref={ref}
      className={`react-resizable-handle dashboard-resize-handle dashboard-resize-handle-${axis}`}
      data-resize-axis={axis}
    />
  );
}

const CanvasWidget = React.memo(function CanvasWidget({ item, selected, onRemove, onSelect }) {
  const dataConfig = useMemo(() => toWidgetDataConfig(item.spec_json), [item.spec_json]);
  const visualConfig = useMemo(
    () => toWidgetVisualConfig(item.spec_json, item.widget_type),
    [item.spec_json, item.widget_type]
  );

  return (
    <Paper
      variant="outlined"
      onMouseDown={onSelect}
      onClick={onSelect}
      sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? '#2563eb' : 'divider',
        bgcolor: selected ? '#f8fbff' : 'background.paper',
        boxShadow: selected ? '0 0 0 3px rgba(37, 99, 235, 0.14)' : 'none',
        transition: 'border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease',
        '&::before': selected ? {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: '#2563eb',
          zIndex: 1,
        } : undefined,
      }}>
      <Box
        className="drag-handle"
        sx={{
          minHeight: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1,
          py: 0.5,
          borderBottom: 1,
          borderColor: selected ? '#bfdbfe' : 'divider',
          bgcolor: selected ? '#eff6ff' : 'background.paper',
          cursor: 'move',
        }}>
        <Typography
          variant="caption"
          noWrap
          sx={{ flex: 1, pl: selected ? 0.5 : 0, fontWeight: selected ? 700 : 500, color: selected ? '#1e3a8a' : 'text.primary' }}
        >
          {item.title}
        </Typography>
        <Tooltip title="삭제">
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onRemove(item.key);
            }}
            sx={{ p: 0.25 }}
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', p: 0.5 }}>
        <GenericWidget dataConfig={dataConfig} visualConfig={visualConfig} />
      </Box>
    </Paper>
  );
}, (prev, next) =>
  prev.item === next.item &&
  prev.selected === next.selected
);

export default function DashboardCanvas() {
  const { canvasWidgets, selectedWidgetKey, setSelectedWidgetKey, updateLayout, removeWidget } = useDashboardBuilderStore();
  const { containerRef, width, mounted, measureWidth } = useContainerWidth({
    initialWidth: 1200,
    measureBeforeMount: true,
  });
  const [containerHeight, setContainerHeight] = useState(0);
  const maxUsedRow = useMemo(
    () => canvasWidgets.reduce((max, w) => {
      const y = w.layout?.y ?? 0;
      const h = w.layout?.h ?? DASHBOARD_BUILDER_DEFAULT_H;
      return Math.max(max, y + h);
    }, 0),
    [canvasWidgets]
  );
  const displayRows = useMemo(
    () => Math.max(DASHBOARD_GRID_MIN_ROWS, maxUsedRow + DASHBOARD_BUILDER_SLACK_ROWS),
    [maxUsedRow]
  );

  const layout = useMemo(() => canvasWidgets.map((w, index) => normalizeLayoutItem({
    ...w.layout,
    i: w.key,
  }, index, displayRows)), [canvasWidgets, displayRows]);

  const handleLayoutChange = useCallback((nextLayout) => {
    updateLayout(nextLayout.map((item, index) => normalizeLayoutItem(item, index, displayRows)));
  }, [updateLayout, displayRows]);

  const selectGridItem = useCallback((layoutItem) => {
    if (layoutItem?.i && layoutItem.i !== selectedWidgetKey) setSelectedWidgetKey(layoutItem.i);
  }, [selectedWidgetKey, setSelectedWidgetKey]);

  useEffect(() => {
    const rafId = requestAnimationFrame(measureWidth);
    const timerId = setTimeout(measureWidth, 150);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
    };
  }, [measureWidth, canvasWidgets.length]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return undefined;

    const updateSize = () => {
      const nextHeight = element.clientHeight || 0;
      setContainerHeight(nextHeight);
      measureWidth();
    };
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    updateSize();
    return () => observer.disconnect();
  }, [containerRef, measureWidth]);

  const rowHeight = useMemo(
    () => calculateDashboardRowHeight(containerHeight, DASHBOARD_GRID_MIN_ROWS),
    [containerHeight]
  );

  const gridPixelHeight = useMemo(() => {
    const marginY = DASHBOARD_GRID_MARGIN[1];
    const paddingY = DASHBOARD_GRID_PADDING[1];
    return displayRows * rowHeight + Math.max(0, displayRows - 1) * marginY + paddingY * 2;
  }, [displayRows, rowHeight]);

  const scrollContentHeight = useMemo(() => {
    if (!containerHeight) return gridPixelHeight;
    return Math.max(gridPixelHeight, containerHeight + 48);
  }, [containerHeight, gridPixelHeight]);

  if (canvasWidgets.length === 0) {
    return (
      <Box sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px dashed',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'action.hover',
      }} />
    );
  }

  return (
    <Box
      ref={containerRef}
      onMouseDown={(event) => {
        if (!event.target.closest?.('.react-grid-item') && selectedWidgetKey !== null) setSelectedWidgetKey(null);
      }}
      sx={{
      position: 'relative',
      height: '100%',
      width: '100%',
      minHeight: 0,
      minWidth: 0,
      overflow: 'hidden',
      '& .react-grid-layout': {
        minHeight: '100%',
        overflow: 'hidden',
      },
      '& .react-grid-item': {
        overflow: 'hidden',
      },
      '& .react-grid-item > .react-resizable-handle': {
        zIndex: 30,
        pointerEvents: 'auto',
        background: 'none !important',
        backgroundImage: 'none !important',
        borderRadius: 1,
        boxSizing: 'border-box',
        margin: 0,
        opacity: 1,
        padding: 0,
        touchAction: 'none',
        userSelect: 'none',
      },
      '& .react-grid-item > .dashboard-resize-handle': {
        position: 'absolute',
        display: 'block',
        background: 'transparent !important',
        border: 0,
        opacity: 0,
      },
      '& .react-grid-item > .react-resizable-handle::after': {
        display: 'none',
      },
      '& .react-grid-item > .dashboard-resize-handle-n': {
        top: 0,
        left: 14,
        right: 14,
        width: 'auto',
        height: 12,
        transform: 'none',
        cursor: 'ns-resize',
      },
      '& .react-grid-item > .dashboard-resize-handle-e': {
        top: 0,
        right: 0,
        width: 12,
        height: '100%',
        transform: 'none',
        cursor: 'ew-resize',
      },
      '& .react-grid-item > .dashboard-resize-handle-s': {
        left: 14,
        right: 14,
        bottom: 0,
        width: 'auto',
        height: 12,
        transform: 'none',
        cursor: 'ns-resize',
      },
      '& .react-grid-item > .dashboard-resize-handle-w': {
        top: 0,
        left: 0,
        width: 12,
        height: '100%',
        transform: 'none',
        cursor: 'ew-resize',
      },
      '& .react-grid-item > .dashboard-resize-handle-ne': {
        top: 0,
        right: 0,
        width: 20,
        height: 20,
        transform: 'none',
        cursor: 'nesw-resize',
        zIndex: 31,
      },
      '& .react-grid-item > .dashboard-resize-handle-nw': {
        top: 0,
        left: 0,
        width: 20,
        height: 20,
        transform: 'none',
        cursor: 'nwse-resize',
        zIndex: 31,
      },
      '& .react-grid-item > .dashboard-resize-handle-se': {
        right: 0,
        bottom: 0,
        width: 20,
        height: 20,
        transform: 'none',
        cursor: 'se-resize',
        zIndex: 31,
      },
      '& .react-grid-item > .dashboard-resize-handle-sw': {
        left: 0,
        bottom: 0,
        width: 20,
        height: 20,
        transform: 'none',
        cursor: 'nesw-resize',
        zIndex: 31,
      },
    }}>
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        overflowY: 'scroll',
        overflowX: 'hidden',
        scrollbarGutter: 'stable',
      }}>
        {mounted && (
          <GridLayout
            className="layout"
            layout={layout}
            width={Math.max(320, width)}
            gridConfig={{
              cols: DASHBOARD_GRID_COLS,
              maxRows: displayRows,
              rowHeight,
              margin: DASHBOARD_GRID_MARGIN,
              containerPadding: DASHBOARD_GRID_PADDING,
            }}
            dragConfig={{
              enabled: true,
              bounded: true,
              handle: '.drag-handle',
              cancel: '.react-resizable-handle,button',
            }}
            resizeConfig={{
              enabled: true,
              handles: DASHBOARD_RESIZE_HANDLES,
              handleComponent: renderResizeHandle,
            }}
            compactor={FIXED_GRID_COMPACTOR}
            autoSize={false}
            style={{ height: scrollContentHeight, minHeight: '100%', overflow: 'hidden', paddingBottom: 48 }}
            onLayoutChange={handleLayoutChange}
            onDragStart={(...args) => selectGridItem(args[1])}
            onResizeStart={(...args) => selectGridItem(args[1])}
            onResize={handleLayoutChange}
            onResizeStop={handleLayoutChange}
            onDragStop={handleLayoutChange}>
            {canvasWidgets.map((item, index) => {
              const dataGrid = normalizeLayoutItem({ ...item.layout, i: item.key }, index, displayRows);
              return (
                <div key={item.key} data-grid={dataGrid}>
                  <CanvasWidget
                    item={item}
                    selected={item.key === selectedWidgetKey}
                    onRemove={removeWidget}
                    onSelect={() => {
                      if (selectedWidgetKey !== item.key) setSelectedWidgetKey(item.key);
                    }}
                  />
                </div>
              );
            })}
          </GridLayout>
        )}
      </div>
    </Box>
  );
}

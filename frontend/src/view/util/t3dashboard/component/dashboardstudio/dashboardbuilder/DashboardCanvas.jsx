import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GridLayout, useContainerWidth, noCompactor } from 'react-grid-layout';
import { Box, Typography, IconButton, Paper, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import GenericWidget from '../generic/GenericWidget';
import { toWidgetDataConfig, toWidgetVisualConfig } from '../generic/widgetSpecAdapter';
import { useDashboardBuilderStore } from './store/dashboardBuilderStore';
import {
  DASHBOARD_GRID_COLS,
  DASHBOARD_GRID_DEFAULT_H,
  DASHBOARD_GRID_DEFAULT_W,
  DASHBOARD_GRID_MARGIN,
  DASHBOARD_GRID_MIN_ROWS,
  DASHBOARD_GRID_PADDING,
  DASHBOARD_RESIZE_HANDLES,
  calculateDashboardRowHeight,
} from '../dashboardGridRules';

const FIXED_GRID_COMPACTOR = { ...noCompactor, preventCollision: true };
const VISIBLE_GRID_CONSTRAINT = {
  name: 'visible-dashboard-canvas',
  constrainPosition(item, x, y) {
    return {
      x: Math.max(0, Math.min(x, DASHBOARD_GRID_COLS - item.w)),
      y: Math.max(0, Math.min(y, DASHBOARD_GRID_MIN_ROWS - item.h)),
    };
  },
  constrainSize(item, w, h) {
    return {
      w: Math.max(item.minW ?? 1, Math.min(w, DASHBOARD_GRID_COLS - item.x)),
      h: Math.max(item.minH ?? 1, Math.min(h, DASHBOARD_GRID_MIN_ROWS - item.y)),
    };
  },
};

function normalizeLayoutItem(item, fallbackIndex = 0) {
  const minW = item?.minW ?? 2;
  const minH = item?.minH ?? 3;
  const rawW = Number.isFinite(item?.w) ? item.w : DASHBOARD_GRID_DEFAULT_W;
  const rawH = Number.isFinite(item?.h) ? item.h : DASHBOARD_GRID_DEFAULT_H;
  let x = Math.max(0, Math.min(Number.isFinite(item?.x) ? item.x : 0, DASHBOARD_GRID_COLS - 1));
  let w = Math.min(DASHBOARD_GRID_COLS - x, Math.max(minW, rawW));
  const h = Math.min(DASHBOARD_GRID_MIN_ROWS, Math.max(minH, rawH));
  const y = Math.max(0, Math.min(
    Number.isFinite(item?.y) ? item.y : fallbackIndex * 2,
    DASHBOARD_GRID_MIN_ROWS - h
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
    maxH: Math.max(minH, DASHBOARD_GRID_MIN_ROWS - y),
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

function CanvasWidget({ item, selected, onRemove, onSelect }) {
  const dataConfig = toWidgetDataConfig(item.spec_json);
  const visualConfig = toWidgetVisualConfig(item.spec_json, item.widget_type);

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
        <Tooltip title="??젣">
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
}

export default function DashboardCanvas() {
  const { canvasWidgets, selectedWidgetKey, setSelectedWidgetKey, updateLayout, removeWidget } = useDashboardBuilderStore();
  const { containerRef, width, mounted, measureWidth } = useContainerWidth({
    initialWidth: 1200,
    measureBeforeMount: true,
  });
  const [containerHeight, setContainerHeight] = useState(0);
  const layout = useMemo(() => canvasWidgets.map((w, index) => normalizeLayoutItem({
    ...w.layout,
    i: w.key,
  }, index)), [canvasWidgets]);

  const handleLayoutChange = useCallback((nextLayout) => {
    updateLayout(nextLayout.map((item, index) => normalizeLayoutItem(item, index)));
  }, [updateLayout]);

  const selectGridItem = useCallback((layoutItem) => {
    if (layoutItem?.i) setSelectedWidgetKey(layoutItem.i);
  }, [setSelectedWidgetKey]);

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

  const rowHeight = useMemo(() => calculateDashboardRowHeight(containerHeight), [containerHeight]);

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
        if (!event.target.closest?.('.react-grid-item')) setSelectedWidgetKey(null);
      }}
      sx={{
      height: '100%',
      width: '100%',
      minWidth: 0,
      overflow: 'hidden',
      '& .react-grid-layout': {
        minHeight: '100%',
        overflow: 'hidden',
      },
      '& .react-grid-item': {
        overflow: 'visible',
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
      },
      '& .react-grid-item > .react-resizable-handle::after': {
        display: 'none',
      },
      '& .react-grid-item > .dashboard-resize-handle-e': {
        top: 0,
        right: 0,
        width: 14,
        height: '100%',
        transform: 'none',
        cursor: 'ew-resize',
        borderRight: '2px solid transparent',
        '&:hover': {
          borderRightColor: '#60a5fa',
          bgcolor: 'rgba(96, 165, 250, 0.08)',
        },
      },
      '& .react-grid-item > .dashboard-resize-handle-s': {
        left: 0,
        bottom: 0,
        width: '100%',
        height: 14,
        transform: 'none',
        cursor: 'ns-resize',
        borderBottom: '2px solid transparent',
        '&:hover': {
          borderBottomColor: '#60a5fa',
          bgcolor: 'rgba(96, 165, 250, 0.08)',
        },
      },
      '& .react-grid-item > .dashboard-resize-handle-se': {
        right: 0,
        bottom: 0,
        width: 24,
        height: 24,
        transform: 'none',
        cursor: 'se-resize',
        borderRight: '2px solid #94a3b8',
        borderBottom: '2px solid #94a3b8',
        borderBottomRightRadius: 2,
        bgcolor: 'rgba(255, 255, 255, 0.72)',
        '&::before': {
          content: '""',
          position: 'absolute',
          right: 5,
          bottom: 5,
          width: 8,
          height: 8,
          borderRight: '2px solid #64748b',
          borderBottom: '2px solid #64748b',
        },
        '&:hover': {
          borderRightColor: '#2563eb',
          borderBottomColor: '#2563eb',
          bgcolor: 'rgba(219, 234, 254, 0.85)',
          '&::before': {
            borderRightColor: '#2563eb',
            borderBottomColor: '#2563eb',
          },
        },
      },
    }}>
      {mounted && (
        <GridLayout
          className="layout"
          layout={layout}
          width={Math.max(320, width)}
          gridConfig={{
            cols: DASHBOARD_GRID_COLS,
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
          constraints={[VISIBLE_GRID_CONSTRAINT]}
          compactor={FIXED_GRID_COMPACTOR}
          autoSize
          style={{ minHeight: '100%', overflow: 'hidden' }}
          onLayoutChange={handleLayoutChange}
          onDragStart={(...args) => selectGridItem(args[1])}
          onResizeStart={(...args) => selectGridItem(args[1])}
          onResize={handleLayoutChange}
          onResizeStop={handleLayoutChange}
          onDragStop={handleLayoutChange}>
          {canvasWidgets.map((item, index) => {
            const dataGrid = normalizeLayoutItem({ ...item.layout, i: item.key }, index);
            return (
              <div key={item.key} data-grid={dataGrid}>
                <CanvasWidget
                  item={item}
                  selected={item.key === selectedWidgetKey}
                  onRemove={removeWidget}
                  onSelect={() => setSelectedWidgetKey(item.key)}
                />
              </div>
            );
          })}
        </GridLayout>
      )}
    </Box>
  );
}

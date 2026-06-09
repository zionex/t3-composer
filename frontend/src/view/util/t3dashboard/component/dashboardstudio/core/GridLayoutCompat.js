import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactGridLayout from 'react-grid-layout';

export const noCompactor = {
  compactType: null,
  preventCollision: true,
};

export function useContainerWidth({ initialWidth = 1200, measureBeforeMount = false } = {}) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(initialWidth);
  const [mounted, setMounted] = useState(!measureBeforeMount);

  const measureWidth = useCallback(() => {
    const element = containerRef.current;
    const nextWidth = element?.clientWidth || element?.getBoundingClientRect?.().width || initialWidth;
    setWidth(Math.max(1, Math.floor(nextWidth)));
    setMounted(true);
  }, [initialWidth]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    measureWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measureWidth);
      observer.observe(element);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', measureWidth);
    return () => window.removeEventListener('resize', measureWidth);
  }, [measureWidth]);

  return { containerRef, width, mounted, measureWidth };
}

export function GridLayout({
  gridConfig = {},
  dragConfig = {},
  resizeConfig = {},
  compactor = {},
  children,
  ...props
}) {
  const resizeHandle = resizeConfig.handleComponent
    ? (axis, ref) => resizeConfig.handleComponent(axis, ref)
    : props.resizeHandle;

  return (
    <ReactGridLayout
      {...props}
      cols={gridConfig.cols ?? props.cols}
      maxRows={gridConfig.maxRows ?? props.maxRows}
      rowHeight={gridConfig.rowHeight ?? props.rowHeight}
      margin={gridConfig.margin ?? props.margin}
      containerPadding={gridConfig.containerPadding ?? props.containerPadding}
      isDraggable={dragConfig.enabled ?? props.isDraggable}
      isResizable={resizeConfig.enabled ?? props.isResizable}
      isBounded={dragConfig.bounded ?? props.isBounded}
      draggableHandle={dragConfig.handle ?? props.draggableHandle}
      draggableCancel={dragConfig.cancel ?? props.draggableCancel}
      resizeHandles={resizeConfig.handles ?? props.resizeHandles}
      resizeHandle={resizeHandle}
      compactType={compactor.compactType ?? props.compactType ?? null}
      preventCollision={compactor.preventCollision ?? props.preventCollision}
    >
      {children}
    </ReactGridLayout>
  );
}

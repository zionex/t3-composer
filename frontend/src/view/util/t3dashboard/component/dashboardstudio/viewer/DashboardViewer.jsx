import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';

import GenericWidget from '../generic/GenericWidget';
import { toWidgetDataConfig, toWidgetVisualConfig } from '../generic/widgetSpecAdapter';
import { GridLayout, useContainerWidth, noCompactor } from '../core/GridLayoutCompat';
import {
  DASHBOARD_GRID_COLS,
  DASHBOARD_GRID_MIN_ROWS,
  DASHBOARD_GRID_MARGIN,
  DASHBOARD_GRID_PADDING,
  calculateDashboardRowHeight,
} from '../core/dashboardGridRules';
import {
  getDashboardMaxRow,
  toReadOnlyLayoutItem,
} from './widgetNormalize';

function ViewerWidget({ item, embeddedInPanel = false, maximized = false, onMaximize, onRestore }) {
  const dataConfig = useMemo(() => toWidgetDataConfig(item.spec_json), [item.spec_json]);
  const visualConfig = useMemo(() => toWidgetVisualConfig(item.spec_json, item.widget_type), [item.spec_json, item.widget_type]);

  const handleMaximize = () => {
    if (maximized) {
      onRestore?.();
    } else {
      onMaximize?.(item);
    }
  };

  if (embeddedInPanel) {
    return (
      <Box sx={{ height: '100%', minHeight: 0, overflow: 'hidden', p: 1.25, bgcolor: '#fbfcfe' }}>
        <GenericWidget dataConfig={dataConfig} visualConfig={visualConfig} />
      </Box>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        height: '100%',
        width: '100%',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderColor: '#e5eaf2',
        borderRadius: '8px',
        bgcolor: '#fff',
        boxShadow: '0 10px 28px rgba(15, 23, 42, 0.05)',
      }}
    >
      <Box
        sx={{
          minHeight: 36,
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.25,
          py: 0.75,
          borderBottom: '1px solid #edf2f7',
          bgcolor: '#fff',
        }}
      >
        <Box sx={{ width: 3, height: 15, borderRadius: 1, bgcolor: '#3b82f6', flexShrink: 0 }} />
        <Typography sx={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 800, color: '#1e293b' }} noWrap>
          {item.title}
        </Typography>
        <Tooltip title={maximized ? 'Restore' : 'Maximize'}>
          <IconButton size="small" onClick={handleMaximize} sx={{ width: 22, height: 22, p: 0.25 }}>
            {maximized ? <CloseFullscreenIcon sx={{ fontSize: 15 }} /> : <OpenInFullIcon sx={{ fontSize: 15 }} />}
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, width: '100%', overflow: 'hidden', p: 1.25, bgcolor: '#fbfcfe' }}>
        <GenericWidget dataConfig={dataConfig} visualConfig={visualConfig} />
      </Box>
    </Paper>
  );
}

export { ViewerWidget };

/**
 * 읽기 전용 대시보드 viewer 컴포넌트.
 *
 * - 위젯 배열을 받아 react-grid-layout 기반 읽기 전용 그리드 렌더링
 * - isDraggable=false, isResizable=false 고정 (모드와 무관하게 항상 읽기 전용)
 * - 컨테이너 크기 ResizeObserver 측정 → rowHeight 동적 계산 → 필요 시 세로 스크롤
 * - 최대화 콜백 (onMaximize) 만 받음. 최대화 오버레이 렌더링은 부모 책임.
 *
 * Props:
 *   widgets               : (Array)  정규화된 위젯 배열 (normalizeDashboardWidgets 적용 완료 상태)
 *   onMaximize            : (widget) => void   위젯 최대화 요청 콜백. 없으면 최대화 아이콘 비활성.
 *   maximizedWidget       : (Object|null)  현재 최대화된 위젯 — v1 에서는 사용하지 않음 (확장 여지).
 *   onRestoreMaximize     : () => void  최대화 복원 콜백 — v1 에서는 사용하지 않음.
 */
export default function DashboardViewer({
  widgets,
  onMaximize,
  // 아래 두 prop 은 인터페이스 안정성을 위해 받지만 v1 에서는 사용하지 않는다.
  // 일반 사용자 화면이 자체 최대화 오버레이를 그릴 때 의미를 갖는다.
  // eslint-disable-next-line no-unused-vars
  maximizedWidget,
  // eslint-disable-next-line no-unused-vars
  onRestoreMaximize,
}) {
  const { containerRef, width, mounted, measureWidth } = useContainerWidth({
    initialWidth: 1200,
    measureBeforeMount: true,
  });
  const [containerHeight, setContainerHeight] = useState(0);
  const layout = useMemo(
    () => widgets.map((widget, index) => toReadOnlyLayoutItem(widget, index)),
    [widgets]
  );

  const maxUsedRow = useMemo(() => getDashboardMaxRow(widgets), [widgets]);
  const displayRows = Math.max(DASHBOARD_GRID_MIN_ROWS, maxUsedRow);

  useEffect(() => {
    const rafId = requestAnimationFrame(measureWidth);
    const timerId = setTimeout(measureWidth, 150);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
    };
  }, [measureWidth, widgets.length]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return undefined;

    // containerRef 는 inner div (overflowY 가 발화하는 그 자체) 를 가리킨다.
    // clientWidth/Height 가 스크롤바 폭과 자체 패딩을 자동 반영하므로 보정값 불필요.
    const updateSize = () => {
      setContainerHeight(Math.max(0, element.clientHeight || 0));
      measureWidth();
    };
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    updateSize();
    return () => observer.disconnect();
  }, [containerRef, measureWidth]);

  const rowHeight = useMemo(() => calculateDashboardRowHeight(containerHeight, displayRows), [containerHeight, displayRows]);

  const gridPixelHeight = useMemo(() => {
    const marginY = DASHBOARD_GRID_MARGIN[1];
    const paddingY = DASHBOARD_GRID_PADDING[1];
    return displayRows * rowHeight + Math.max(0, displayRows - 1) * marginY + paddingY * 2;
  }, [displayRows, rowHeight]);

  const needsScroll = containerHeight > 0 && gridPixelHeight > containerHeight;

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        p: 1,
        bgcolor: '#f8fafc',
        boxSizing: 'border-box',
        '& .react-grid-layout': {
          minHeight: '100%',
          overflow: 'hidden',
        },
        '& .react-grid-item': {
          overflow: 'hidden',
        },
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 8, left: 8, right: 8, bottom: 8,
          overflowY: needsScroll ? 'auto' : 'hidden',
          overflowX: 'hidden',
        }}
      >
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
            dragConfig={{ enabled: false }}
            resizeConfig={{ enabled: false }}
            compactor={noCompactor}
            autoSize={false}
            style={{ height: needsScroll ? gridPixelHeight : '100%', minHeight: '100%', overflow: 'hidden' }}
          >
            {widgets.map((item, index) => (
              <div key={item.key} data-grid={toReadOnlyLayoutItem(item, index)}>
                <ViewerWidget item={item} onMaximize={onMaximize} />
              </div>
            ))}
          </GridLayout>
        )}
      </div>
    </Box>
  );
}

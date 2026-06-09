// =============================================================================
// @zionex/wingui-core — 단독 환경용 shim
// =============================================================================

import React from 'react';
import { Box, Tabs, Tab as MuiTab } from '@mui/material';
import { create } from 'zustand';

// ----- i18n: passthrough -----
export const transLangKey = (key, fallback) => fallback || key || '';
export const t = transLangKey;

// ----- Layout -----
export const SplitPanel = ({ direction = 'horizontal', sizes = [50, 50], minSize, sx, children }) => {
    const dir = direction === 'vertical' ? 'column' : 'row';
    const arr = React.Children.toArray(children);
    return (
        <Box sx={{ display: 'flex', flexDirection: dir, width: '100%', height: '100%', ...sx }}>
            {arr.map((child, i) => (
                <Box key={i} sx={{ flex: sizes[i] || 1, minWidth: minSize, minHeight: minSize, overflow: 'hidden' }}>
                    {child}
                </Box>
            ))}
        </Box>
    );
};

export const VLayoutBox = ({ children, sx }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', ...sx }}>{children}</Box>
);
export const HLayoutBox = ({ children, sx }) => (
    <Box sx={{ display: 'flex', flexDirection: 'row', ...sx }}>{children}</Box>
);

// ----- Tabs -----
export const TabContainer = ({ value, onChange, children, sx }) => {
    const items = React.Children.toArray(children).filter(Boolean);
    const handle = (_e, v) => { if (typeof onChange === 'function') onChange(v); };
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', ...sx }}>
            <Tabs value={value} onChange={handle} variant="scrollable" sx={{ borderBottom: '1px solid rgba(0,0,0,0.08)', minHeight: 36 }}>
                {items.map((c) => (
                    <MuiTab key={c.props.value} value={c.props.value} label={c.props.label} sx={{ minHeight: 36, py: 0.5 }} />
                ))}
            </Tabs>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                {items.find((c) => c.props.value === value)?.props?.children}
            </Box>
        </Box>
    );
};

export const Tab = ({ children }) => <>{children}</>;

// ----- 기타 placeholders -----
export const PopupDialog = ({ open, onClose, title, children, onSubmit, resizeWidth = 600, resizeHeight = 400 }) => {
    if (!open) return null;
    return (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, bg: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <Box sx={{ bg: '#fff', width: resizeWidth, height: resizeHeight, p: 2, borderRadius: 1 }}>
                <h3>{title}</h3>
                {children}
                <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    {onSubmit && <button onClick={onSubmit}>OK</button>}
                    <button onClick={onClose}>Close</button>
                </Box>
            </Box>
        </Box>
    );
};

export const ZEditor = ({ value, onChange }) => (
    <textarea style={{ width: '100%', height: '100%' }} value={value || ''} onChange={(e) => onChange?.(e.target.value)} />
);

// useMenuStore — store stub
const _menuStore = create(() => ({
    menuList: [],
    currentMenu: null,
    setMenuList: () => {},
}));
export const useMenuStore = _menuStore;

export default {
    transLangKey, t,
    SplitPanel, VLayoutBox, HLayoutBox,
    TabContainer, Tab,
    PopupDialog, ZEditor, useMenuStore,
};

// =============================================================================
// DashboardPanel — @zionex/wingui-core/component/dashboard/DashboardPanel
// 원본: 1000줄+ 클래스형 컴포넌트 (저장/로드/WebSocket 포함)
// shim: PGM 모드(읽기 전용)만 구현 — react-grid-layout 기반
// =============================================================================
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

/**
 * DashboardPanel lightweight shim.
 *
 * Props (UserDashboardPage에서 사용하는 것만):
 *   id           {string}   대시보드 ID (key로 사용)
 *   widgets      {Array}    위젯 배열 — 각 항목에 'data-grid' (x,y,w,h,i), key 포함
 *   OnGetWidgets {Function} widgets 배열을 받아 onGetWidget 콜백을 추가한 배열 반환
 *   isDraggable  {boolean}  false (읽기 전용)
 *   isResizable  {boolean}  false (읽기 전용)
 *   fitHeight    {boolean}  컨테이너 높이에 맞춤
 *   option       {object}   { store: 'PGM', ... } — 현재 미사용 (PGM 고정)
 */
export function DashboardPanel({
  id,
  widgets = [],
  OnGetWidgets,
  isDraggable = false,
  isResizable = false,
  fitHeight = false,
  option = {},
  actionBar,
  autoSize,
  menuCd,
  ...rest
}) {
  const containerRef = React.useRef(null);
  const [containerWidth, setContainerWidth] = React.useState(1200);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width || 1200);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const resolvedWidgets = React.useMemo(
    () => (OnGetWidgets ? OnGetWidgets(widgets) : widgets),
    [widgets, OnGetWidgets]
  );

  const layout = resolvedWidgets
    .filter(w => w['data-grid'])
    .map(w => ({ ...w['data-grid'], i: String(w.key ?? w.id ?? w['data-grid'].i) }));

  return (
    <Box
      ref={containerRef}
      sx={{ width: '100%', height: fitHeight ? '100%' : 'auto', overflow: 'auto' }}
    >
      <GridLayout
        layout={layout}
        cols={12}
        rowHeight={60}
        width={containerWidth}
        isDraggable={isDraggable}
        isResizable={isResizable}
        compactType={null}
        margin={[8, 8]}
      >
        {resolvedWidgets.map(w => {
          const key = String(w.key ?? w.id ?? w['data-grid']?.i ?? Math.random());
          return (
            <div key={key}>
              {w.onGetWidget ? w.onGetWidget(w) : null}
            </div>
          );
        })}
      </GridLayout>
    </Box>
  );
}

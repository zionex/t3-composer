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

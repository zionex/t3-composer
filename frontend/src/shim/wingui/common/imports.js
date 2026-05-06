// =============================================================================
// @wingui/common/imports — 단독 환경용 shim
// =============================================================================
// 부모 wingui 의 packages/wingui/src/common/imports.js 표면을 최소 재현.
// Composer 가 사용하는 것: ContentInner / WorkArea / zAxios.
// 그 외 SearchArea/SearchRow/InputField/BaseGrid/showMessage 등도 placeholder 로 export.
// =============================================================================

import React from 'react';
import axios from 'axios';
import { Box, Button, TextField } from '@mui/material';
import { create } from 'zustand';

// ----- 레이아웃 래퍼 (단순 div) -----
export const ContentInner = ({ children, sx }) => (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', ...sx }}>
        {children}
    </Box>
);

export const SearchArea = ({ children, onSearch, sx }) => (
    <Box sx={{ p: 1, borderBottom: '1px solid rgba(0,0,0,0.08)', flex: '0 0 auto', ...sx }}>
        {children}
    </Box>
);

export const SearchRow = ({ children, sx }) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', ...sx }}>
        {children}
    </Box>
);

export const WorkArea = ({ children, sx }) => (
    <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', ...sx }}>
        {children}
    </Box>
);

export const ResultArea = WorkArea;
export const StatusArea = ({ children, sx }) => <Box sx={{ p: 1, borderTop: '1px solid rgba(0,0,0,0.08)', ...sx }}>{children}</Box>;
export const ButtonArea = ({ children, sx }) => <Box sx={{ display: 'flex', alignItems: 'center', p: 1, gap: 1, ...sx }}>{children}</Box>;
export const LeftButtonArea = ({ children }) => <Box sx={{ display: 'flex', gap: 1, mr: 'auto' }}>{children}</Box>;
export const RightButtonArea = ({ children }) => <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>{children}</Box>;

// ----- 단독 환경에서는 BaseGrid 가 RealGrid2 라이선스 의존 — placeholder -----
export const BaseGrid = ({ id, items = [], afterGridCreate }) => (
    <Box sx={{ p: 2, border: '1px dashed #999', m: 1, color: '#666', fontFamily: 'monospace', fontSize: 12 }}>
        BaseGrid placeholder (id={id}, columns={items.length})<br />
        실제 RealGrid2 그리드는 wingui 환경에서만 동작. 단독 환경에선 미리보기만 가능.
    </Box>
);
export const TreeGrid = BaseGrid;
export const GridCnt = () => null;
export const GridAddRowButton = () => null;
export const GridDeleteRowButton = () => null;
export const GridSaveButton = () => null;
export const GridExcelExportButton = () => null;
export const GridExcelImportButton = () => null;
export const LargeExcelDownload = () => null;

// ----- InputField : 단순 TextField 매핑 -----
export const InputField = ({ control, type, name, label, value, onChange, onClick, children, readonly, ...rest }) => {
    if (type === 'action') {
        return (
            <Button variant="outlined" size="small" onClick={onClick} sx={{ minWidth: 36, ...(rest.sx || {}) }}>
                {label || ''} {children}
            </Button>
        );
    }
    return (
        <TextField
            size="small"
            label={label}
            type={type === 'number' ? 'number' : (type === 'datetime' ? 'date' : 'text')}
            value={value || ''}
            onChange={onChange || (() => {})}
            InputProps={{ readOnly: !!readonly }}
            sx={{ minWidth: 160, ...(rest.sx || {}) }}
        />
    );
};

// ----- showMessage : window.confirm/alert 매핑 -----
export const showMessage = (title, message, callback) => {
    const text = `[${title}]\n${message}`;
    if (typeof callback === 'function') {
        const ok = window.confirm(text);
        callback(ok);
    } else {
        window.alert(text);
    }
};

// ----- zAxios : axios 인스턴스 -----
const apiBase = (typeof window !== 'undefined' && window.__COMPOSER_API_BASE__) || '';
export const zAxios = axios.create({
    baseURL: apiBase || '/',           // dev 서버는 webpack proxy 로 /composer 를 백엔드로 전달
    timeout: 2_400_000,                // 40분 (Anthropic 긴 응답 대비)
    headers: { 'Content-Type': 'application/json' },
});

// ----- callService : 단독 환경에선 사용 안 함 (BF/DP/MP/FP 엔진 경유 호출 stub) -----
export const callService = (serviceId, params, target) => {
    console.warn('[shim] callService is not supported in standalone mode', { serviceId, target });
    return Promise.reject(new Error('callService unsupported in standalone'));
};

// ----- Zustand store stubs -----
const buildStore = (init) => create((set, get) => init(set, get));

export const useViewStore = buildStore((set, get) => ({
    viewData: {},
    setViewInfo: (viewId, key, value) => set((state) => {
        const view = state.viewData[viewId] || {};
        return { viewData: { ...state.viewData, [viewId]: { ...view, [key]: value } } };
    }),
    getViewInfo: (viewId, key) => (get().viewData[viewId] || {})[key],
}));

export const useContentStore = buildStore(() => ({
    activeViewId: 'composer-standalone',
    viewList: [],
    addView: () => {},
    removeView: () => {},
}));

export const useUserStore = buildStore(() => ({
    userInfo: { userId: 'composer-dev', userName: 'Composer Dev' },
    setUserInfo: () => {},
}));

export const useMenuStore = buildStore(() => ({
    menuList: [],
    currentMenu: null,
}));

export const useDashboardStore = buildStore(() => ({}));
export const useInsightSystemStore = buildStore(() => ({ setProvider: () => {} }));

// ----- cascade helpers (Composer 안에서는 안 쓰지만 안전하게 export) -----
export const useFieldCascade = () => {};
export const applyGridCascade = () => {};
export const buildPopupFilterProps = () => ({});

// ----- 기타 -----
export const loadRecentSimulationVersion = () => Promise.resolve(null);
export const setHeaderColor = () => {};

// 기본 export (default import 호환)
export default {
    ContentInner, WorkArea, SearchArea, SearchRow, ResultArea, StatusArea,
    ButtonArea, LeftButtonArea, RightButtonArea,
    BaseGrid, TreeGrid, GridCnt, GridAddRowButton, GridDeleteRowButton,
    GridSaveButton, GridExcelExportButton, GridExcelImportButton, LargeExcelDownload,
    InputField, showMessage, zAxios, callService,
    useViewStore, useContentStore, useUserStore, useMenuStore,
    useDashboardStore, useInsightSystemStore,
    useFieldCascade, applyGridCascade, buildPopupFilterProps,
    loadRecentSimulationVersion, setHeaderColor,
};

// =============================================================================
// @wingui/common/imports — 단독 환경용 shim (Phase 2c — 데이터 흐름 동작화)
// =============================================================================
// 부모 wingui 의 packages/wingui/src/common/imports.js 표면을 최소 재현하되,
// 미리보기 시 데이터 fetch / save / delete round-trip 까지 동작하도록 MUI 기반 구현.
//
// BaseGrid       — MUI Table wrap. dataProvider.fillJsonData / getAllStateRows / getJsonRow 제공.
// InputField     — react-hook-form Controller 로 control + name 바인딩.
// GridSaveButton 등 — registry 에서 grid id 로 lookup 해 onSave/onDelete 콜백 호출.
// showMessage    — MUI Dialog (window.confirm/alert 보다 깔끔).
// =============================================================================

import React, { useEffect, useMemo, useRef, useState, useCallback, createContext, useContext } from 'react';
import axios from 'axios';
import {
    Box, Button, TextField, Checkbox, MenuItem, IconButton, Stack, Tooltip,
    Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Typography,
    Select, FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { Controller } from 'react-hook-form';
import { create } from 'zustand';

// ★ RealGrid2 기반 BaseGrid (부모 wingui-core BaseGrid 와 동일 룩 + dataProvider API)
import BaseGridImpl, { lookupGrid as lookupGridImpl } from './BaseGrid';

// ----- Layout wrappers — 부모 wingui-core SearchArea/SearchRow/ContentInner 룩 흉내 -----
//   (AppCommonStyle.jsx 의 useSearchAreaStyles + AppInputStyle.jsx 의 INPUT_* 상수 기반)
export const ContentInner = ({ children, sx }) => (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
               overflow: 'hidden', bgcolor: '#fafafa', ...sx }}>
        {children}
    </Box>
);
// SearchArea — 항상 우측 끝에 [🔍 조회] 버튼 노출.
// 클릭 시점에 (1) onSearch prop, (2) useViewStore.globalButtons[name=search].action
// 순서로 lookup 후 호출. 둘 다 없으면 console.warn.
export const SearchArea = ({ children, onSearch, sx }) => {
    const viewStoreApi = useViewStore;        // store API 직접 접근 (구독 없이 click 시점 lookup)
    const contentStoreApi = useContentStore;

    const handleSearch = () => {
        if (typeof onSearch === 'function') {
            try { onSearch(); } catch (e) { console.error('[shim] onSearch failed', e); }
            return;
        }
        try {
            const viewData = viewStoreApi.getState().viewData || {};
            const activeViewId = contentStoreApi.getState().activeViewId;
            const buttons = (viewData[activeViewId] && viewData[activeViewId].globalButtons) || [];
            const searchBtn = buttons.find((b) => b && b.name === 'search');
            if (searchBtn && typeof searchBtn.action === 'function') {
                searchBtn.action();
                return;
            }
            console.warn('[shim] SearchArea: globalButtons.search 가 등록되지 않았습니다. ' +
                         '산출물 jsx 의 setViewInfo(activeViewId, "globalButtons", ...) 호출을 확인하세요.');
        } catch (e) { console.error('[shim] SearchArea click failed', e); }
    };

    return (
        <Box sx={{
            // wingui SearchArea — flex row layout + 우측 끝 [조회] 버튼.
            // wingui 본 환경의 정확한 룩 (AppCommonStyle.useSearchAreaStyles 기반).
            display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '4px',
            width: '100%',
            border: '1px solid #E0E0E0',
            bgcolor: '#FAFAFA',
            padding: '6px 4px 4px 4px',
            flex: '0 0 auto',
            ...sx,
        }}>
            {/* SearchRow 들 — flex 1 로 본문 확장. SearchRow 가 자체 layout 결정 */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                {children}
            </Box>
            {/* 우측 고정 [조회] 버튼 — 항상 노출. height 가 InputField 와 동일 (45) */}
            <Button
                variant="contained"
                size="small"
                startIcon={<SearchIcon fontSize="small" />}
                onClick={handleSearch}
                sx={{
                    height: 45,
                    minWidth: 88,
                    bgcolor: '#3b82f6',
                    fontSize: 13, fontWeight: 700,
                    boxShadow: 'none',
                    flexShrink: 0,
                    '&:hover': { bgcolor: '#2563eb', boxShadow: 'none' },
                }}
            >
                조회
            </Button>
        </Box>
    );
};
export const SearchRow = ({ children, sx }) => (
    <Box sx={{
        // wingui SearchRow — 한 줄. wingui 의 FormArea 는 flex row + wrap + alignItems center.
        display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: '4px',
        width: '100%',
        ...sx,
    }}>
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
export const ButtonArea = ({ children, sx }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
               px: 1.5, py: 0.8, gap: 1, bgcolor: '#fff',
               borderBottom: '1px solid rgba(0,0,0,0.06)', ...sx }}>
        {children}
    </Box>
);
export const LeftButtonArea = ({ children }) => <Box sx={{ display: 'flex', gap: 0.8 }}>{children}</Box>;
export const RightButtonArea = ({ children }) => <Box sx={{ display: 'flex', gap: 0.8 }}>{children}</Box>;

// ----- Grid registry — BaseGrid (RealGrid2) 의 registry 를 그대로 사용 -----
const lookupGrid = lookupGridImpl;

// ----- BaseGrid — RealGrid2 wrapper (부모 wingui-core 와 동일 룩 + dataProvider API) -----
export const BaseGrid = BaseGridImpl;
export const TreeGrid = BaseGridImpl;

// ----- Grid count badge -----
export const GridCnt = ({ grid, format }) => {
    const [_, force] = useState(0);   // 강제 리렌더 — registry 갱신 감지용
    useEffect(() => {
        const id = setInterval(() => force((n) => n + 1), 1000);
        return () => clearInterval(id);
    }, []);
    const g = lookupGrid(grid);
    const count = g ? (g.dataProvider?.getJsonRow ? (() => {
        let n = 0;
        while (g.dataProvider.getJsonRow(n)) n++;
        return n;
    })() : 0) : 0;
    const text = format ? String(format).replace('{0}', String(count)) : `${count} 건`;
    return (
        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500, mr: 0.5 }}>
            {text}
        </Typography>
    );
};

// ----- Grid 버튼 (registry 의 grid object 를 직접 조작 + onSave 콜백) -----
export const GridAddRowButton = ({ grid, addInfo, onGetData, onAfterAdd }) => (
    <Button
        size="small"
        variant="outlined"
        color="success"
        startIcon={<AddIcon fontSize="small" />}
        onClick={() => {
            const g = lookupGrid(grid);
            if (!g) return;
            const seed = (typeof onGetData === 'function') ? (onGetData(g) || {}) : (addInfo || {});
            g.addRow(seed);
            if (onAfterAdd) onAfterAdd(g);
        }}
    >행 추가</Button>
);
export const GridDeleteRowButton = ({ grid, onDelete, onAfterDelete }) => (
    <Button
        size="small"
        variant="outlined"
        color="error"
        startIcon={<DeleteIcon fontSize="small" />}
        onClick={async () => {
            const g = lookupGrid(grid);
            if (!g) return;
            // RealGrid2 — 셀 편집 중이면 getAllStateRows 가 거부하므로 commit 먼저
            try { if (typeof g.commit === 'function') g.commit(true); } catch (_) {}
            const states = g.dataProvider.getAllStateRows();
            const candidates = [...(states.deleted || [])];
            // 현재 화면에서는 "선택 행 삭제" — 단순화: 마지막 행 삭제 또는 사용자 onDelete 의 처리
            if (candidates.length === 0) {
                // 단순 fallback: 모든 row 중 첫 번째 row 후보로 onDelete
                const first = g.dataProvider.getJsonRow(0);
                if (first) candidates.push(first);
            }
            if (typeof onDelete === 'function') {
                try { await onDelete(g, candidates); } catch (_) { /* no-op */ }
            }
            if (onAfterDelete) onAfterDelete(g);
        }}
    >삭제</Button>
);
export const GridSaveButton = ({ grid, onSave, onAfterSave }) => (
    <Button
        size="small"
        variant="contained"
        color="primary"
        startIcon={<SaveIcon fontSize="small" />}
        onClick={async () => {
            const g = lookupGrid(grid);
            if (!g) return;
            // RealGrid2 — 셀 편집 중이면 getAllStateRows 가 거부하므로 commit 먼저
            try { if (typeof g.commit === 'function') g.commit(true); } catch (_) {}
            const states = g.dataProvider.getAllStateRows();
            const changes = [
                ...(states.created || []),
                ...(states.updated || []),
            ];
            if (typeof onSave === 'function') {
                try { await onSave(g, changes); } catch (e) { console.error('[shim] onSave failed', e); }
            }
            if (onAfterSave) onAfterSave(g);
        }}
    >저장</Button>
);
export const GridExcelExportButton = ({ grid, fileName }) => (
    <Button size="small" variant="outlined" startIcon={<FileDownloadIcon fontSize="small" />}
            onClick={() => {
                const g = lookupGrid(grid);
                if (!g) return;
                const rows = [];
                let i = 0;
                let r;
                while ((r = g.dataProvider.getJsonRow(i++))) rows.push(r);
                const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = (fileName || 'export') + '.json';
                a.click();
                URL.revokeObjectURL(url);
            }}>Excel</Button>
);
export const GridExcelImportButton = ({ grid }) => (
    <Button size="small" variant="outlined" startIcon={<FileUploadIcon fontSize="small" />}
            onClick={() => alert('단독 환경에서는 Excel 업로드 미지원')}>업로드</Button>
);
export const LargeExcelDownload = GridExcelExportButton;

// ----- InputField — wingui 본 환경의 outlined TextField + floating label 룩 -----
//   라벨이 input 의 top-left 에 floating (별도 라벨 박스 없음). 둥근 corner, 회색 light border, white bg.
//   wingui 의 AppInputStyle constants 와 동일: INPUT_HEIGHT=45, INPUT_WIDTH=200, BORDER_RADIUS=6.
const WG_INPUT_HEIGHT = 45;
const WG_INPUT_WIDTH  = 200;
const WG_BORDER       = '#cfd6e0';

const wgFieldSx = {
    width: WG_INPUT_WIDTH,
    '& .MuiOutlinedInput-root': {
        height: WG_INPUT_HEIGHT,
        borderRadius: '6px',
        bgcolor: '#fff',
        fontSize: 13,
    },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: WG_BORDER },
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94a3b8' },
    '& .MuiInputLabel-root': { fontSize: 13, color: '#64748b' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
};

export const InputField = ({
    control, type, name, label, value, onChange, onClick, children, readonly,
    onKeyDown, ...rest
}) => {
    const muiType = type === 'number' ? 'number'
                  : type === 'datetime' ? 'date'
                  : type === 'time' ? 'time'
                  : 'text';

    // action 타입 — 버튼처럼 동작하는 input (예: 팝업 트리거)
    if (type === 'action') {
        return (
            <TextField
                size="small"
                label={label}
                value={value || ''}
                onClick={onClick}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                    readOnly: true,
                    endAdornment: (
                        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', pl: 0.5 }}>
                            {children || <SearchIcon fontSize="small" sx={{ color: '#64748b' }} />}
                        </Box>
                    ),
                }}
                sx={{ ...wgFieldSx, cursor: 'pointer', ...(rest.sx || {}) }}
            />
        );
    }
    if (type === 'check') {
        if (control && name) {
            return (
                <Controller
                    control={control} name={name} defaultValue={false}
                    render={({ field }) => (
                        <FormControlLabel
                            control={<Checkbox {...field} size="small" checked={!!field.value} />}
                            label={label || name}
                            sx={{ '& .MuiFormControlLabel-label': { fontSize: 13 } }}
                        />
                    )}
                />
            );
        }
        return (
            <FormControlLabel
                control={<Checkbox size="small" checked={!!value} onChange={onChange} />}
                label={label || name}
                sx={{ '& .MuiFormControlLabel-label': { fontSize: 13 } }}
            />
        );
    }

    // 일반 input — MUI outlined TextField + floating label (wingui 본 환경 룩)
    const commonProps = {
        size: 'small',
        label: label,
        type: muiType,
        // date/time 은 항상 label shrink (placeholder 가 항상 위)
        InputLabelProps: (muiType === 'date' || muiType === 'time') ? { shrink: true } : undefined,
        InputProps: { readOnly: !!readonly },
        onKeyDown: onKeyDown,
        sx: { ...wgFieldSx, ...(rest.sx || {}) },
    };

    if (control && name) {
        return (
            <Controller
                control={control} name={name} defaultValue=""
                render={({ field }) => (
                    <TextField {...commonProps} {...field} value={field.value ?? ''} />
                )}
            />
        );
    }
    return (
        <TextField
            {...commonProps}
            value={value || ''}
            onChange={onChange || (() => {})}
        />
    );
};

// ----- showMessage : MUI Dialog -----
let _msgQueueResolve = null;
const _msgListeners = new Set();
function _emitMsg(payload) {
    _msgListeners.forEach((l) => { try { l(payload); } catch (_) {} });
}
function _registerMsgListener(l) { _msgListeners.add(l); return () => _msgListeners.delete(l); }

export const showMessage = (title, message, callback) => {
    _emitMsg({ title, message, callback });
};

export function ShowMessageHost() {
    const [state, setState] = useState({ open: false });
    useEffect(() => _registerMsgListener((p) => setState({ ...p, open: true })), []);
    const close = (ok) => {
        setState((s) => ({ ...s, open: false }));
        if (typeof state.callback === 'function') state.callback(!!ok);
    };
    const isConfirm = typeof state.callback === 'function';
    return (
        <Dialog open={!!state.open} onClose={() => close(false)} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>{state.title || '알림'}</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>
                    {state.message || ''}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                {isConfirm && <Button onClick={() => close(false)}>취소</Button>}
                <Button variant="contained" onClick={() => close(true)} autoFocus>확인</Button>
            </DialogActions>
        </Dialog>
    );
}

// ----- zAxios -----
// PreviewEmbed iframe 안에서는 window.__PREVIEW_MOCK__ = true 가 설정되어
// 모든 호출이 mock 응답을 즉시 반환 (실제 backend 안 침). Composer 자체 화면에서는
// flag 가 없으므로 zAxios 가 정상적으로 backend 로 forward.
const apiBase = (typeof window !== 'undefined' && window.__COMPOSER_API_BASE__) || '';
const realAxios = axios.create({
    baseURL: apiBase || '/',
    timeout: 2_400_000,
    headers: { 'Content-Type': 'application/json' },
});

function isMockMode() {
    return typeof window !== 'undefined' && window.__PREVIEW_MOCK__ === true;
}

function mockResponse(method, url, payload) {
    const m = (method || 'GET').toUpperCase();
    // GET → mock list (빈 배열). grid 가 mock data 를 자체 채울 수 있도록 빈 응답.
    if (m === 'GET') {
        return Promise.resolve({
            status: 200, statusText: 'OK (mock)',
            data: [], headers: {}, config: { url, method: m, mock: true },
        });
    }
    // POST/PUT/DELETE → success
    return Promise.resolve({
        status: 200, statusText: 'OK (mock)',
        data: { success: true, message: 'mock saved', code: 200 },
        headers: {}, config: { url, method: m, mock: true },
    });
}

// zAxios — function 형태 (axios(config)) 와 method shortcut 모두 지원.
function zAxiosFn(config) {
    if (isMockMode()) {
        const url = (config && config.url) || '';
        return mockResponse(config && config.method, url, config && config.data);
    }
    return realAxios(config);
}
zAxiosFn.get = (url, config) => isMockMode()
    ? mockResponse('GET', url, null)
    : realAxios.get(url, config);
zAxiosFn.post = (url, data, config) => isMockMode()
    ? mockResponse('POST', url, data)
    : realAxios.post(url, data, config);
zAxiosFn.put = (url, data, config) => isMockMode()
    ? mockResponse('PUT', url, data)
    : realAxios.put(url, data, config);
zAxiosFn.delete = (url, config) => isMockMode()
    ? mockResponse('DELETE', url, null)
    : realAxios.delete(url, config);
zAxiosFn.patch = (url, data, config) => isMockMode()
    ? mockResponse('PATCH', url, data)
    : realAxios.patch(url, data, config);
zAxiosFn.create = (cfg) => realAxios.create(cfg);
zAxiosFn.defaults = realAxios.defaults;
zAxiosFn.interceptors = realAxios.interceptors;

export const zAxios = zAxiosFn;

// ----- callService : 단독 환경 미지원 -----
export const callService = (serviceId, params, target) => {
    console.warn('[shim] callService is not supported in standalone mode', { serviceId, target });
    return Promise.reject(new Error('callService unsupported in standalone'));
};

// ----- Zustand stores -----
const buildStore = (init) => create((set, get) => init(set, get));

// 단독 환경에서는 모든 화면이 같은 'composer-standalone' viewId 를 사용.
// wingui 의 정확한 분리 (activeViewId ← useContentStore, setViewInfo ← useViewStore) 와 다르게
// 산출물 jsx 가 useViewStore(s => s.activeViewId) 같이 잘못 사용해도 동작하도록
// 두 store 모두에 activeViewId 를 노출.
const STANDALONE_VIEW_ID = 'composer-standalone';

export const useViewStore = buildStore((set, get) => ({
    activeViewId: STANDALONE_VIEW_ID,            // 산출물의 잘못된 store 사용 케이스 호환
    viewData: {},
    setViewInfo: (viewId, key, value) => set((state) => {
        const view = state.viewData[viewId] || {};
        return { viewData: { ...state.viewData, [viewId]: { ...view, [key]: value } } };
    }),
    getViewInfo: (viewId, key) => (get().viewData[viewId] || {})[key],
    getGlobalButtons: (viewId) => (get().viewData[viewId] || {}).globalButtons || [],
    getViewIsUpdated: () => false,
}));
export const useContentStore = buildStore(() => ({
    activeViewId: STANDALONE_VIEW_ID,
    viewList: [],
    contentBodyRefs: {},                          // 산출물 일부가 참조 (예: useContentStore(s=>s.contentBodyRefs))
    addView: () => {},
    removeView: () => {},
}));
export const useUserStore = buildStore(() => ({
    userInfo: { userId: 'composer-dev', userName: 'Composer Dev' },
    setUserInfo: () => {},
}));
export const useMenuStore = buildStore(() => ({ menuList: [], currentMenu: null }));
export const useDashboardStore = buildStore(() => ({}));
export const useInsightSystemStore = buildStore(() => ({ setProvider: () => {} }));

// ----- cascade helpers (단독 환경 no-op) -----
export const useFieldCascade = () => {};
export const applyGridCascade = () => {};
export const buildPopupFilterProps = () => ({});

// ----- 기타 -----
export const loadRecentSimulationVersion = () => Promise.resolve(null);
export const setHeaderColor = () => {};

export default {
    ContentInner, WorkArea, SearchArea, SearchRow, ResultArea, StatusArea,
    ButtonArea, LeftButtonArea, RightButtonArea,
    BaseGrid, TreeGrid, GridCnt, GridAddRowButton, GridDeleteRowButton,
    GridSaveButton, GridExcelExportButton, GridExcelImportButton, LargeExcelDownload,
    InputField, showMessage, ShowMessageHost, zAxios, callService,
    useViewStore, useContentStore, useUserStore, useMenuStore,
    useDashboardStore, useInsightSystemStore,
    useFieldCascade, applyGridCascade, buildPopupFilterProps,
    loadRecentSimulationVersion, setHeaderColor,
};

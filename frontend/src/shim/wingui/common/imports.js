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
    Select, FormControlLabel, Divider,
    Tabs as MuiTabs, Tab as MuiTab, Pagination as MuiPagination,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
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
    // overflow:auto — 콘텐츠가 영역을 넘어가면 스크롤바 노출, 맞으면 노출 안 함
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
               overflow: 'auto', bgcolor: 'transparent', ...sx }}>
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

    // Sample 모드 ON 시 — 화면 mount 후 globalButtons.search 가 등록될 때까지 폴링하다가
    // 등록되는 즉시 자동 search 트리거 (사용자가 [조회] 누르지 않아도 데이터 표시).
    useEffect(() => {
        if (!isSampleModeEnabled()) return undefined;
        let attempts = 0;
        const timer = setInterval(() => {
            attempts++;
            try {
                if (typeof onSearch === 'function') {
                    onSearch();
                    clearInterval(timer);
                    return;
                }
                const viewData = viewStoreApi.getState().viewData || {};
                const activeViewId = contentStoreApi.getState().activeViewId;
                const buttons = (viewData[activeViewId] && viewData[activeViewId].globalButtons) || [];
                const searchBtn = buttons.find((b) => b && b.name === 'search');
                if (searchBtn && typeof searchBtn.action === 'function') {
                    searchBtn.action();
                    clearInterval(timer);
                    return;
                }
            } catch (_) { /* no-op */ }
            if (attempts > 20) clearInterval(timer);   // 최대 4초 (200ms × 20) 대기
        }, 200);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Box sx={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px',
            width: '100%',
            border: '1px solid rgba(124,167,224,0.30)',
            bgcolor: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: '8px',
            padding: '6px 8px',
            flex: '0 0 auto',
            ...sx,
        }}>
            {/* SearchRow 들 — 본문. 100% 폭이라 줄바꿈됨 */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                {children}
            </Box>
            {/* 우측 고정 [조회] 버튼 — 항상 노출 */}
            <Button
                variant="contained"
                size="small"
                startIcon={<SearchIcon fontSize="small" />}
                onClick={handleSearch}
                sx={{
                    height: 32,
                    minWidth: 76,
                    bgcolor: '#7CA7E0',
                    fontSize: 12, fontWeight: 700,
                    boxShadow: 'none',
                    flexShrink: 0,
                    alignSelf: 'flex-start',
                    '&:hover': { bgcolor: '#5683C0', boxShadow: 'none' },
                }}
            >
                조회
            </Button>
        </Box>
    );
};
export const SearchRow = ({ children, sx }) => (
    <Box sx={{
        // wingui SearchRow — flex row, gap 6px
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px',
        width: '100%',
        ...sx,
    }}>
        {children}
    </Box>
);
export const WorkArea = ({ children, sx }) => (
    // overflow:auto — 본문이 영역을 넘어가면 스크롤바 노출 (그리드는 내부 스크롤이라 평소엔 미노출)
    <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', ...sx }}>
        {children}
    </Box>
);
export const ResultArea = WorkArea;
export const StatusArea = ({ children, sx }) => <Box sx={{ p: 1, borderTop: '1px solid rgba(124,167,224,0.20)', ...sx }}>{children}</Box>;
export const ButtonArea = ({ children, sx }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
               px: 1.5, py: 0.8, gap: 1, bgcolor: 'rgba(255,255,255,0.60)',
               borderBottom: '1px solid rgba(124,167,224,0.20)', ...sx }}>
        {children}
    </Box>
);
export const LeftButtonArea = ({ children }) => <Box sx={{ display: 'flex', gap: 0.8 }}>{children}</Box>;
export const RightButtonArea = ({ children }) => <Box sx={{ display: 'flex', gap: 0.8 }}>{children}</Box>;

// ----- VLayoutBox / HLayoutBox — wingui-core 의 수직/수평 flex 박스 -----
//   산출물이 대시보드 등에서 위젯 격자 레이아웃에 사용. sx · children 만 받음.
export const VLayoutBox = ({ children, sx }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, ...sx }}>{children}</Box>
);
export const HLayoutBox = ({ children, sx }) => (
    <Box sx={{ display: 'flex', flexDirection: 'row', minWidth: 0, ...sx }}>{children}</Box>
);

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
        <Typography variant="caption" sx={{ color: '#6E7E96', fontWeight: 500, mr: 0.5 }}>
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

// ----- InputField — wingui 의 wrapBox (좌측 라벨 + 우측 input) inline-flex 형태 -----
//   상수 (부모 AppInputStyle.jsx):
//     INPUT_HEIGHT=45, INPUT_WIDTH=200, INPUT_BORDER_RADIUS=6,
//     LEFT_LABEL_WIDTH=70, label fontWeight=600~800, fontSize 14
const WG_INPUT_HEIGHT = 32;       // wingui 실측 (small 변형)
const WG_INPUT_WIDTH  = 200;
const WG_LABEL_WIDTH  = 78;
const WG_LABEL_BG     = 'rgba(124,167,224,0.14)';
const WG_BORDER       = 'rgba(124,167,224,0.34)';

const wgWrapBoxSx = {
    display: 'inline-flex',
    alignItems: 'stretch',
    height: WG_INPUT_HEIGHT,
    border: `1px solid ${WG_BORDER}`,
    borderRadius: '6px',
    bgcolor: 'rgba(255,255,255,0.65)',
    overflow: 'hidden',
};
const wgLabelBoxSx = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minWidth: WG_LABEL_WIDTH, px: 1,
    bgcolor: WG_LABEL_BG, color: '#3A4A63',
    fontSize: 12, fontWeight: 600,
    borderRight: `1px solid ${WG_BORDER}`,
};
const wgInputBaseSx = {
    width: WG_INPUT_WIDTH,
    '& .MuiOutlinedInput-root': { height: WG_INPUT_HEIGHT, fontSize: 12, borderRadius: 0 },
    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
    '& input': { py: 0.4, px: 0.8 },
    '& .MuiSelect-select': { py: 0.6, px: 0.8 },
};

export const InputField = ({
    control, type, name, label, value, onChange, onClick, children, readonly,
    onKeyDown, ...rest
}) => {
    const muiType = type === 'number' ? 'number'
                  : type === 'datetime' ? 'date'
                  : type === 'time' ? 'time'
                  : 'text';

    if (type === 'action') {
        return (
            <Box sx={{ ...wgWrapBoxSx, ...(rest.sx || {}) }} onClick={onClick}>
                {label && <Box sx={wgLabelBoxSx}>{label}</Box>}
                <Box sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 36, cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(124,167,224,0.10)' },
                }}>
                    {children || '…'}
                </Box>
            </Box>
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
                            sx={{ '& .MuiFormControlLabel-label': { fontSize: 12 } }}
                        />
                    )}
                />
            );
        }
        return (
            <FormControlLabel
                control={<Checkbox size="small" checked={!!value} onChange={onChange} />}
                label={label || name}
                sx={{ '& .MuiFormControlLabel-label': { fontSize: 12 } }}
            />
        );
    }

    // Sample 모드 ON + 빈 control 필드면 mount 시점에 dummy 값 자동 주입
    //   (사용자가 [조회] 클릭 시 required validation 통과하도록)
    const sampleDummyFor = (t, nm) => {
        const lname = String(nm || '').toLowerCase();
        if (t === 'number') return 1;
        if (t === 'datetime' || t === 'date') return new Date().toISOString().slice(0, 10);
        if (/ver|version/.test(lname)) return 'V01';
        if (/cd|code|id$/.test(lname)) return 'SAMPLE-001';
        if (/nm|name/.test(lname)) return '샘플';
        return 'SAMPLE';
    };

    const inputEl = control && name
        ? (
            <Controller
                control={control} name={name} defaultValue=""
                render={({ field }) => {
                    useEffect(() => {
                        if (!isSampleModeEnabled()) return;
                        const cur = field.value;
                        if (cur === undefined || cur === null || cur === '') {
                            field.onChange(sampleDummyFor(type, name));
                        }
                        // eslint-disable-next-line react-hooks/exhaustive-deps
                    }, []);
                    return (
                        <TextField
                            size="small"
                            type={muiType}
                            InputLabelProps={muiType === 'date' ? { shrink: true } : undefined}
                            InputProps={{ readOnly: !!readonly }}
                            onKeyDown={onKeyDown}
                            sx={wgInputBaseSx}
                            {...field}
                            value={field.value ?? ''}
                        />
                    );
                }}
            />
        )
        : (
            <TextField
                size="small"
                type={muiType}
                value={value || ''}
                onChange={onChange || (() => {})}
                InputProps={{ readOnly: !!readonly }}
                onKeyDown={onKeyDown}
                sx={wgInputBaseSx}
            />
        );

    return (
        <Box sx={{ ...wgWrapBoxSx, ...(rest.sx || {}) }}>
            {label && <Box sx={wgLabelBoxSx}>{label}</Box>}
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                {inputEl}
            </Box>
        </Box>
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
const apiBase = (typeof window !== 'undefined' && window.__COMPOSER_API_BASE__) || '';
export const zAxios = axios.create({
    baseURL: apiBase || '/',
    timeout: 2_400_000,
    headers: { 'Content-Type': 'application/json' },
});

// [Sample 데이터] 응답 interceptor —
//   화면 실행 + CheckBox ON 상태에서 산출물의 zAxios 호출이 빈 응답을 받으면
//   휴리스틱 sample 로 채워서 차트/KPI 카드가 실제 운영처럼 보이도록 함.
//   composer 자체 API (/composer/*, /auth/*, /actuator/*) 는 절대 건드리지 않음.
import { isSampleModeEnabled, generateSampleArrayFromUrl, generateSampleKpiObject } from './sampleData';

const SAMPLE_SKIP_PREFIXES = ['/composer/', 'composer/', '/auth/', 'auth/',
                              '/actuator/', 'actuator/', '/insight-', 'insight-'];

function urlIsSkippable(url) {
    if (!url) return true;
    return SAMPLE_SKIP_PREFIXES.some((p) => url.startsWith(p));
}

// 요청 interceptor — Sample 모드 ON + composer 외 URL 이면 timeout 을 짧게(4초) 줄여
// backend endpoint 부재 시 webpack proxy 의 60초 504 대신 axios 가 먼저 abort 하도록.
zAxios.interceptors.request.use((config) => {
    try {
        if (isSampleModeEnabled() && !urlIsSkippable(config?.url || '')) {
            config.timeout = 4000;
        }
    } catch (_) { /* no-op */ }
    return config;
});

// 응답이 비었을 때 (정상 200) sample 주입
zAxios.interceptors.response.use((response) => {
    try {
        if (!isSampleModeEnabled()) return response;
        const reqUrl = response?.config?.url || '';
        if (urlIsSkippable(reqUrl)) return response;
        const data = response.data;
        // 빈 배열 → 차트/리스트용 sample 배열
        if (Array.isArray(data) && data.length === 0) {
            response.data = generateSampleArrayFromUrl(reqUrl, 12);
            return response;
        }
        // 빈 객체 / null → KPI 카드용 sample
        if (data === null || data === undefined
            || (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 0)) {
            response.data = generateSampleKpiObject();
            return response;
        }
    } catch (_e) { /* no-op */ }
    return response;
}, (error) => {
    // 응답 자체가 4xx/5xx 또는 network error — backend endpoint 가 없거나 죽은 경우
    // Sample 모드 ON 이고 composer 자체 API 가 아니면, 가짜 정상 응답으로 변환
    try {
        if (!isSampleModeEnabled()) return Promise.reject(error);
        const reqUrl = error?.config?.url || '';
        if (urlIsSkippable(reqUrl)) return Promise.reject(error);

        // URL 패턴에 따라 array vs object 추정.
        //   ★ 객체를 array 기대 코드에 주면 .find/.map 이 즉시 크래시하지만,
        //     array 를 객체 기대 코드에 주면 단지 빈 값(undefined) 으로 degrade 한다.
        //     → 모호하면 array. 'kpi' 는 보통 kpi 행 목록(list) 이므로 array 로 본다.
        //     object 는 명백한 단일 요약 endpoint (summary/overview/stat/total) 만.
        const u = String(reqUrl).toLowerCase();
        const isObjectShape = /summary|overview|stat|total|dashboard\/?$/.test(u);
        const fakeData = isObjectShape
            ? generateSampleKpiObject()
            : generateSampleArrayFromUrl(reqUrl, 12);

        return Promise.resolve({
            data: fakeData,
            status: 200,
            statusText: 'OK (sample)',
            headers: {},
            config: error.config || {},
            request: error.request,
        });
    } catch (_e) {
        return Promise.reject(error);
    }
});

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

// ----- 산출물 환각 호환 헬퍼 -----
// 산출물 jsx 가 `getActiveViewId()` 또는 `getActiveViewID()` 함수를 import 하는 케이스.
// 표준은 `useContentStore((s) => s.activeViewId)` 인데 LLM 이 헬퍼 함수로 환각.
export const getActiveViewId = () => useContentStore.getState().activeViewId;
export const getActiveViewID = getActiveViewId;

// =============================================================================
// ★ 산출물 호환 — ComposerPromptBuilder 가 @wingui/common/imports export 로
//   광고하는 컴포넌트 전체를 shim 에서도 제공 (누락 시 'Element type is invalid:
//   undefined' 런타임 크래시). 프롬프트 export 목록과 이 파일 export 는 항상 동기.
//   상세: .claude/rules/50-composer-standalone-runtime.md §13
// =============================================================================

// ----- SplitPanel — 수평/수직 분할 (단독 환경은 정적 분할, 드래그 리사이저 없음) -----
export const SplitPanel = ({ direction = 'horizontal', sizes, minSize, sx, children }) => {
    const kids = React.Children.toArray(children).filter(Boolean);
    const col  = direction === 'vertical';
    return (
        <Box sx={{ display: 'flex', flexDirection: col ? 'column' : 'row',
                   flex: 1, minHeight: 0, minWidth: 0, gap: '8px', ...sx }}>
            {kids.map((kid, i) => (
                <Box key={i} sx={{
                    flex: `${(sizes && sizes[i]) || (100 / Math.max(1, kids.length))} 1 0`,
                    minWidth:  col ? 0 : (minSize || 0),
                    minHeight: col ? (minSize || 0) : 0,
                    display: 'flex', flexDirection: 'column', overflow: 'auto',
                }}>{kid}</Box>
            ))}
        </Box>
    );
};

// ----- TabContainer / Tab — children <Tab value label> 기반 -----
export const Tab = ({ children }) => <>{children}</>;
export const TabContainer = ({ value, onChange, indicatorColor = 'primary', children, sx }) => {
    const tabs = React.Children.toArray(children).filter(Boolean);
    const [internal, setInternal] = useState(value ?? tabs[0]?.props?.value);
    const active = value !== undefined ? value : internal;
    const handle = (_e, v) => { setInternal(v); if (onChange) onChange(v); };
    const activeTab = tabs.find((t) => t.props.value === active) || tabs[0];
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, ...sx }}>
            <MuiTabs value={active} onChange={handle} indicatorColor={indicatorColor}
                     variant="scrollable" sx={{ minHeight: 36,
                            borderBottom: '1px solid rgba(124,167,224,0.20)' }}>
                {tabs.map((t) => (
                    <MuiTab key={t.props.value} value={t.props.value} label={t.props.label}
                            sx={{ minHeight: 36, fontSize: 12, textTransform: 'none' }} />
                ))}
            </MuiTabs>
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 1 }}>{activeTab}</Box>
        </Box>
    );
};

// ----- PopupDialog — MUI Dialog wrapper -----
export const PopupDialog = ({ open, onClose, onSubmit, title, resizeWidth = 600,
                              resizeHeight, type, checks, children, sx }) => (
    <Dialog open={!!open} onClose={onClose}
            PaperProps={{ sx: { width: resizeWidth, maxWidth: '96vw',
                                ...(resizeHeight ? { height: resizeHeight } : {}) } }}>
        {title && <DialogTitle sx={{ fontSize: 14, fontWeight: 700, py: 1.2 }}>{title}</DialogTitle>}
        <DialogContent dividers sx={{ p: 1.5, ...sx }}>{children}</DialogContent>
        {type !== 'NOBUTTONS' && (
            <DialogActions sx={{ px: 2, py: 1 }}>
                <Button size="small" onClick={onClose}>취소</Button>
                <Button size="small" variant="contained" onClick={onSubmit}>확인</Button>
            </DialogActions>
        )}
    </Dialog>
);

// ----- GroupBox / FormArea / FormRow / FormItem — 폼 레이아웃 -----
export const GroupBox = ({ title, children, sx }) => (
    <Box sx={{ border: '1px solid rgba(124,167,224,0.30)', borderRadius: 1,
               p: 1.5, bgcolor: 'rgba(255,255,255,0.55)', ...sx }}>
        {title && (
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#5683C0', mb: 1 }}>
                {title}
            </Typography>
        )}
        {children}
    </Box>
);
export const FormArea = ({ children, sx }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1, ...sx }}>{children}</Box>
);
export const FormRow = ({ children, sx }) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, ...sx }}>{children}</Box>
);
export const FormItem = ({ label, children, sx }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ...sx }}>
        {label && (
            <Typography sx={{ fontSize: 12, minWidth: 78, color: '#3A4A63', fontWeight: 600 }}>
                {label}
            </Typography>
        )}
        {children}
    </Box>
);

// ----- 버튼 — wingui CommonButton / SaveButton / SearchButton / RefreshButton -----
export const CommonButton = ({ title, onClick, disabled, children, sx }) => (
    <Button size="small" variant="outlined" onClick={onClick} disabled={disabled}
            startIcon={children || undefined} sx={{ ...sx }}>{title}</Button>
);
export const SaveButton = ({ onClick, disabled, sx }) => (
    <Button size="small" variant="contained" startIcon={<SaveIcon fontSize="small" />}
            onClick={onClick} disabled={disabled} sx={{ ...sx }}>저장</Button>
);
export const SearchButton = ({ onClick, disabled, sx }) => (
    <Button size="small" variant="contained" startIcon={<SearchIcon fontSize="small" />}
            onClick={onClick} disabled={disabled} sx={{ ...sx }}>조회</Button>
);
export const RefreshButton = ({ onClick, disabled, sx }) => (
    <Button size="small" variant="outlined" startIcon={<RefreshIcon fontSize="small" />}
            onClick={onClick} disabled={disabled} sx={{ ...sx }}>새로고침</Button>
);

// ----- SearchMenuInput / Pagination -----
export const SearchMenuInput = ({ value, onChange, placeholder, sx }) => (
    <TextField size="small" value={value ?? ''} placeholder={placeholder}
               onChange={(e) => onChange && onChange(e.target.value)}
               sx={{ '& .MuiInputBase-root': { fontSize: 12 }, ...sx }}
               InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, mr: 0.5, color: '#8aa0c0' }} /> }} />
);
export const Pagination = ({ count = 1, page = 1, onChange, sx }) => (
    <MuiPagination count={count} page={page} size="small" sx={{ ...sx }}
                   onChange={(_e, p) => onChange && onChange(p)} />
);

// ----- 엑셀 업로드 alias -----
export const LargeExcelUpload = GridExcelImportButton;

// ----- store helper — 산출물이 import 하는 보조 식별자 (no-op / 안전 반환) -----
export const getViewStore    = () => useViewStore;
export const getContentStore = () => useContentStore;
export const getUserStore    = () => useUserStore;
export const storeApi        = useViewStore;
export const userStoreApi    = useUserStore;
export const useSearchPositionStore = buildStore(() => ({ position: {}, setPosition: () => {} }));
export const useInputConstant = () => ({});
export const useIconStyles    = () => ({});

// ----- 기타 -----
export const loadRecentSimulationVersion = () => Promise.resolve(null);
export const setHeaderColor = () => {};

export default {
    ContentInner, WorkArea, SearchArea, SearchRow, ResultArea, StatusArea,
    ButtonArea, LeftButtonArea, RightButtonArea, VLayoutBox, HLayoutBox,
    SplitPanel, TabContainer, Tab, PopupDialog,
    GroupBox, FormArea, FormRow, FormItem,
    CommonButton, SaveButton, SearchButton, RefreshButton,
    SearchMenuInput, Pagination,
    BaseGrid, TreeGrid, GridCnt, GridAddRowButton, GridDeleteRowButton,
    GridSaveButton, GridExcelExportButton, GridExcelImportButton,
    LargeExcelDownload, LargeExcelUpload,
    InputField, showMessage, ShowMessageHost, zAxios, callService,
    useViewStore, useContentStore, useUserStore, useMenuStore,
    useDashboardStore, useInsightSystemStore, useSearchPositionStore,
    getViewStore, getContentStore, getUserStore, storeApi, userStoreApi,
    useInputConstant, useIconStyles,
    useFieldCascade, applyGridCascade, buildPopupFilterProps,
    loadRecentSimulationVersion, setHeaderColor,
    getActiveViewId, getActiveViewID,
};

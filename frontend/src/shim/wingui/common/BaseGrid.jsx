// =============================================================================
// BaseGrid — 부모 wingui-core BaseGrid 의 mini-version (RealGrid2 wrap).
// =============================================================================
// ★ 중요: main bundle 에서 realgrid module 을 직접 import 하지 않음.
//   - main window 에 RealGrid 의 global pointer handler 가 등록되면 iframe 안
//     element 와 cross-document 비교 시 깨짐 (TypeError: r.indexOf is not a function).
//   - 대신 mount 시점에 element.ownerDocument.defaultView.RealGrid 를 사용 —
//     PreviewEmbed 가 iframe head 에 RealGrid UMD bundle 을 inject 해서 iframe window 에만
//     RealGrid 가 set 되어 있음. Composer 자체 화면에서는 BaseGrid 자체를 안 쓰니 무방.
//
// 지원 props: id, items (column 정의 배열), afterGridCreate(grid, gridView, dataProvider), height
// 지원 dataProvider API:
//   - fillJsonData(rows)
//   - getAllStateRows() → { created, updated, deleted, createAndDeleted }
//   - getJsonRow(idx)
// 추가:
//   - addRow(seed)
//   - removeRow(idx)
//
// Mock 모드 (window.__PREVIEW_MOCK__===true): mount 시점에 column 기반 sample row 5개 자동 채움.
// =============================================================================

import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

// 컨테이너 안의 grid registry (GridSaveButton 등이 string id 로 lookup)
const REGISTRY = {};
export function lookupGrid(idOrObj) {
    if (!idOrObj) return null;
    if (typeof idOrObj === 'object') return idOrObj;
    return REGISTRY[idOrObj] || null;
}
export function listGrids() {
    return REGISTRY;
}

function dataTypeOf(dt) {
    if (!dt) return 'text';
    const t = String(dt).toLowerCase();
    if (t === 'number') return 'number';
    if (t === 'datetime') return 'datetime';
    if (t === 'boolean') return 'boolean';
    return 'text';
}

function buildFields(items) {
    return items
        .filter((c) => c && c.dataType !== 'group')
        .map((c) => ({ fieldName: c.fieldName || c.name, dataType: dataTypeOf(c.dataType) }));
}

function buildColumns(items) {
    return items
        .filter((c) => c && c.dataType !== 'group')
        .map((c) => {
            const col = {
                name: c.name,
                fieldName: c.fieldName || c.name,
                header: { text: c.headerText || c.name, showTooltip: true },
                width: c.width || 100,
                editable: !!c.editable,
                styleName: c.styleName,
                styles: { textAlignment: c.textAlignment || 'near' },
            };
            if (c.useDropdown && Array.isArray(c.values) && Array.isArray(c.labels)) {
                col.editor = { type: 'dropdown', values: c.values, labels: c.labels };
                col.lookupDisplay = !!c.lookupDisplay;
                col.values = c.values;
                col.labels = c.labels;
            }
            if (c.datetimeFormat) {
                col.datetimeFormat = c.datetimeFormat;
            }
            if (dataTypeOf(c.dataType) === 'number') {
                col.numberFormat = c.numberFormat || '#,##0.##';
            }
            // boolean 컬럼 — RealGrid 의 default 가 text("true"/"false") 라 checkbox renderer + editor 명시.
            if (dataTypeOf(c.dataType) === 'boolean') {
                col.renderer = { type: 'check', editable: !!c.editable };
                col.editor = { type: 'check' };
                if (!col.styles) col.styles = {};
                col.styles.textAlignment = 'center';
            }
            if (Array.isArray(c.validRules)) {
                const required = c.validRules.find((r) => r && r.criteria === 'required');
                if (required) col.required = true;
            }
            return col;
        });
}

// column 기반 sample row 생성. mock 모드에서 자동으로 grid 에 5개 채움.
function generateSampleRows(items, count = 5) {
    const cols = items.filter((c) => c && c.dataType !== 'group');
    const rows = [];
    for (let i = 0; i < count; i++) {
        const row = {};
        for (const c of cols) {
            const key = c.fieldName || c.name;
            const dt = dataTypeOf(c.dataType);
            // dropdown 이면 values 첫번째 또는 round-robin
            if (Array.isArray(c.values) && c.values.length > 0) {
                row[key] = c.values[i % c.values.length];
                continue;
            }
            switch (dt) {
                case 'number':
                    row[key] = (i + 1) * 100;
                    break;
                case 'datetime': {
                    const d = new Date(2026, 0, i + 1);
                    row[key] = d.toISOString().slice(0, 10);
                    break;
                }
                case 'boolean':
                    row[key] = (i % 2) === 0;
                    break;
                default: {
                    const label = (c.headerText || c.name || key);
                    row[key] = label + ' ' + (i + 1);
                }
            }
        }
        rows.push(row);
    }
    return rows;
}

function isMockPreviewMode() {
    return typeof window !== 'undefined' && window.__PREVIEW_MOCK__ === true;
}

function BaseGrid({ id, items = [], afterGridCreate, height }) {
    const containerRef = useRef(null);
    const gridRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return undefined;

        const el = containerRef.current;
        // iframe 안 RealGrid 사용 — owner document 의 defaultView 에서 lookup.
        // Composer 자체에선 BaseGrid 가 쓰이지 않으므로 main window 에 RealGrid 없어도 OK.
        const ownerWin = el.ownerDocument && el.ownerDocument.defaultView;
        const RG = ownerWin && ownerWin.RealGrid;
        if (!RG || !RG.GridView || !RG.LocalDataProvider) {
            // RealGrid UMD 가 아직 inject 안 됐거나 실패 — placeholder 표시
            const msg = document.createElement('div');
            msg.style.cssText = 'padding:24px;text-align:center;color:#94a3b8;font-size:13px;';
            msg.textContent = 'RealGrid loading...';
            el.innerHTML = '';
            el.appendChild(msg);
            return undefined;
        }

        const dp = new RG.LocalDataProvider(true);
        dp.setFields(buildFields(items));

        const view = new RG.GridView(el);
        view.setDataSource(dp);
        view.setColumns(buildColumns(items));

        // wingui 표준 동작
        try { view.setStateBar({ visible: true }); } catch (_e) { /* no-op */ }
        try { view.setFooters({ visible: false }); } catch (_e) { /* no-op */ }
        try { view.setEditOptions({ insertable: true, appendable: true, deletable: true }); } catch (_e) { /* no-op */ }
        try { view.setRowIndicator({ visible: false }); } catch (_e) { /* no-op */ }
        try { view.setDisplayOptions({ rowHeight: 26, fitStyle: 'evenFill' }); } catch (_e) { /* no-op */ }
        try { view.setHeader({ height: 30 }); } catch (_e) { /* no-op */ }

        const grid = {
            id,
            items,
            dataProvider: {
                fillJsonData: (data) => {
                    let arr = Array.isArray(data) ? data : [];
                    // Mock 모드 — 산출물 JSX 가 빈 array 로 fill 하면 (mock GET 응답이 [])
                    // sample 5개로 fallback. 화면 진입 즉시 데이터가 보이도록.
                    if (isMockPreviewMode() && arr.length === 0) {
                        arr = generateSampleRows(items, 5);
                    }
                    dp.fillJsonData(arr);
                },
                getAllStateRows: () => {
                    const states = dp.getAllStateRows ? dp.getAllStateRows() : null;
                    if (states) return states;
                    return {
                        created: dp.getStateRows ? dp.getStateRows('created') : [],
                        updated: dp.getStateRows ? dp.getStateRows('updated') : [],
                        deleted: dp.getStateRows ? dp.getStateRows('deleted') : [],
                        createAndDeleted: dp.getStateRows ? dp.getStateRows('createAndDeleted') : [],
                    };
                },
                getJsonRow: (idx) => {
                    try { return dp.getJsonRow(idx); } catch { return null; }
                },
            },
            addRow: (seed = {}) => {
                try {
                    dp.addRow(seed);
                    view.commit && view.commit();
                } catch (e) { /* no-op */ }
            },
            removeRow: (idx) => {
                try { dp.removeRow(idx); } catch { /* no-op */ }
            },
            commit: (force) => {
                try { return view.commit && view.commit(force); } catch (_e) { return undefined; }
            },
            _view: view,
            _dataProvider: dp,
        };

        gridRef.current = grid;
        REGISTRY[id] = grid;

        // Mock 모드 — column 기반 sample row 5개 자동 채움
        if (isMockPreviewMode()) {
            try {
                dp.fillJsonData(generateSampleRows(items, 5));
            } catch (_e) { /* no-op */ }
        }

        if (typeof afterGridCreate === 'function') {
            try { afterGridCreate(grid, view, grid.dataProvider); } catch (_e) { /* no-op */ }
        }

        return () => {
            delete REGISTRY[id];
            try { view.destroy && view.destroy(); } catch (_e) { /* no-op */ }
            try { dp.destroy && dp.destroy(); } catch (_e) { /* no-op */ }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    return (
        <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <Box
                ref={containerRef}
                sx={{
                    position: 'absolute',
                    inset: 0,
                    height: height || '100%',
                }}
            />
        </Box>
    );
}

export default BaseGrid;

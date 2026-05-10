// =============================================================================
// BaseGrid — 부모 wingui-core BaseGrid 의 mini-version (RealGrid2 직접 wrap).
// =============================================================================
// 부모 t3series 의 realgrid 패키지를 entrypoint 가 /app/node_modules/realgrid 로
// 복사한 뒤, 여기서 직접 import 해 RealGrid2 GridView 를 생성/표시한다.
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
// items 의 column field:
//   name, headerText, width, dataType ('text'|'number'|'datetime'|'boolean'|'group'),
//   editable, textAlignment ('center'|'far'|'near'),
//   useDropdown + lookupDisplay + values + labels (enum dropdown),
//   datetimeFormat, displayType, validRules
// =============================================================================

import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

// ★ RealGrid2 license — import 보다 반드시 먼저 (window.realGrid2Lic 등록 + setLicenseKey)
import './realgrid-license';

// realgrid CSS — 부모 t3series 와 동일한 sky-blue 테마
import 'realgrid/realgrid-style.css';
import 'realgrid/realgrid-sky-blue.css';

import { GridView, LocalDataProvider } from 'realgrid';

// 컨테이너 안의 grid registry (GridSaveButton 등이 string id 로 lookup)
const REGISTRY = {};
export function lookupGrid(idOrObj) {
    if (!idOrObj) return null;
    if (typeof idOrObj === 'object') return idOrObj;
    return REGISTRY[idOrObj] || null;
}
export function listRegistry() {
    return REGISTRY;
}

function mapDataType(dt) {
    if (!dt) return 'text';
    const t = String(dt).toLowerCase();
    if (t === 'number') return 'number';
    if (t === 'datetime') return 'datetime';
    if (t === 'boolean') return 'boolean';
    return 'text';
}

function buildFields(items) {
    return items
        .filter((c) => !c.iteration)
        .map((c) => ({
            fieldName: c.name,
            dataType:  mapDataType(c.dataType),
            ...(c.datetimeFormat ? { datetimeFormat: c.datetimeFormat } : {}),
        }));
}

function buildColumns(items) {
    return items
        .filter((c) => !c.iteration)
        .map((c) => {
            const align = c.textAlignment === 'far' ? 'far'
                        : c.textAlignment === 'center' ? 'center' : 'near';
            const col = {
                name: c.name,
                fieldName: c.name,
                header: { text: c.headerText || c.name, styleName: 'rg-header' },
                width: c.width || 100,
                styleName: align,
                editable: !!c.editable,
            };
            if (c.useDropdown && Array.isArray(c.values)) {
                col.values = c.values;
                col.labels = c.labels || c.values;
                col.lookupDisplay = !!c.lookupDisplay;
                col.editor = { type: 'dropdown', list: c.labels || c.values };
            }
            if (c.dataType === 'datetime') {
                col.editor = c.editor || { type: 'date', datetimeFormat: c.datetimeFormat || 'yyyy-MM-dd' };
                if (c.datetimeFormat) col.datetimeFormat = c.datetimeFormat;
            }
            if (c.dataType === 'number') {
                col.numberFormat = c.numberFormat || '#,##0.##';
            }
            if (Array.isArray(c.validRules)) {
                const required = c.validRules.find((r) => r && r.criteria === 'required');
                if (required) col.required = true;
            }
            return col;
        });
}

function BaseGrid({ id, items = [], afterGridCreate, height }) {
    const containerRef = useRef(null);
    const gridRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return undefined;

        const dp = new LocalDataProvider(true);
        dp.setFields(buildFields(items));

        const view = new GridView(containerRef.current);
        view.setDataSource(dp);
        view.setColumns(buildColumns(items));

        // wingui 표준 동작
        view.setStateBar({ visible: true });
        view.setFooters({ visible: false });
        view.setEditOptions({ insertable: true, appendable: true, deletable: true });
        view.setRowIndicator({ visible: false });
        view.setDisplayOptions({ rowHeight: 26, fitStyle: 'evenFill' });
        view.setHeader({ height: 30 });

        const grid = {
            id,
            items,
            // 부모 wingui BaseGrid 와 호환되는 dataProvider 표면
            dataProvider: {
                fillJsonData: (data) => {
                    const arr = Array.isArray(data) ? data : [];
                    dp.fillJsonData(arr);
                },
                getAllStateRows: () => {
                    const states = dp.getAllStateRows ? dp.getAllStateRows() : null;
                    if (states) return states;
                    // 일부 RealGrid 버전 호환 fallback
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
            // RealGrid2 raw 객체도 노출 — 사용자가 원하면 직접 호출 가능
            _view: view,
            _dataProvider: dp,
        };

        gridRef.current = grid;
        REGISTRY[id] = grid;

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

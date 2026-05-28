// =============================================================================
// BaseGrid — 부모 wingui-core BaseGrid 의 mini-version (RealGrid2 직접 wrap).
// =============================================================================
// 부모 t3series 의 realgrid 패키지를 entrypoint 가 /app/node_modules/realgrid 로
// 복사한 뒤, 여기서 직접 import 해 RealGrid2 GridView 를 생성/표시한다.
//
// 지원 props: id, items (column 정의 배열), afterGridCreate(grid, gridView, dataProvider), height
// afterGridCreate 의 grid 객체 표면 (wingui BaseGrid 호환):
//   - grid.gridView      → RealGrid GridView wrapper (setCheckBar/setStateBar/commit/
//                          getCheckedRows/showToast/hideToast/id … · 미존재 메서드는 no-op)
//   - grid.dataProvider  → fillJsonData(rows) · getAllStateRows() · getJsonRow(idx) ·
//                          getRowCount … (RealGrid LocalDataProvider 메서드 전부 통과)
//   - grid.commit/cancel/refresh/addRow/removeRow
//   - grid._view / grid._dataProvider → RealGrid2 raw 객체
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

import { generateSampleRowsFromItems, isSampleModeEnabled } from './sampleData';

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

// 컬럼 헤더 텍스트 — 생성 산출물이 쓰는 3가지 형태를 모두 수용:
//   headerText:'..'  ·  header:'..'(string)  ·  header:{text:'..'}(RealGrid 원형)
//   셋 다 없으면 name 으로 폴백.
function headerTextOf(c) {
    if (c.headerText) return c.headerText;
    if (typeof c.header === 'string') return c.header;
    if (c.header && typeof c.header === 'object' && c.header.text) return c.header.text;
    return c.name;
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
                header: { text: headerTextOf(c), styleName: 'rg-header' },
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

// RealGrid2 의 raw GridView / LocalDataProvider 를 감싸 wingui 호환 표면을 만든다.
//   · 실제 메서드 → 그대로 bind 해 노출 (setCheckBar · commit · getCheckedRows · getRowCount …)
//   · 미존재 메서드 → no-op 함수 — RealGrid 버전 차이로 일부 API 가 없어도, 또는 wingui
//     본 환경에만 있는 메서드를 산출물이 호출해도 "xxx is not a function" 크래시 방지
//   · overrides → 특정 메서드(fillJsonData 등)를 커스텀 구현으로 덮어씀
// 산출물이 grid.gridView.xxx() / grid.dataProvider.xxx() 로 무엇을 호출하든
// "undefined 의 xxx 읽기" 류 크래시가 나지 않는다 (graceful degradation — rules/50 §13.9).
function wrapGridApi(raw, overrides) {
    const ov = overrides || {};
    return new Proxy(raw || {}, {
        get(target, prop) {
            if (Object.prototype.hasOwnProperty.call(ov, prop)) return ov[prop];
            const v = target ? target[prop] : undefined;
            if (typeof v === 'function') return v.bind(target);
            if (v !== undefined) return v;
            if (typeof prop === 'symbol') return undefined;
            if (prop === 'then') return undefined;          // thenable 오인 방지
            return () => undefined;                          // 미존재 메서드 — 안전 no-op
        },
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
        // fitStyle: 'none' — 각 컬럼의 width 를 그대로 존중 (총합이 뷰포트 초과 시 가로 스크롤).
        //   ❌ 'evenFill' 은 컬럼별 width 를 무시하고 모든 컬럼을 동일 너비(뷰포트÷컬럼수)로
        //      강제 → 컬럼이 많으면 헤더 명칭이 잘린다. wingui-core BaseGrid 도 fitStyle 을
        //      지정하지 않아 RealGrid 기본값 'none' 으로 동작하므로 그에 맞춘다.
        view.setDisplayOptions({ rowHeight: 26, fitStyle: 'none' });
        view.setHeader({ height: 30 });

        // 부모 wingui BaseGrid 와 호환되는 dataProvider 표면 — fillJsonData(sample 주입)·
        //   getAllStateRows(버전 fallback)·getJsonRow(try/catch) 만 override, 그 외 RealGrid
        //   LocalDataProvider 메서드(getRowCount·addRow·removeRow·clearRows …)는 그대로 통과.
        const dataProviderApi = wrapGridApi(dp, {
            fillJsonData: (data) => {
                let arr = Array.isArray(data) ? data : [];
                // [Sample 데이터] sample 모드 + 응답이 빈 경우 — 컬럼 메타로 자동 주입
                if (arr.length === 0 && isSampleModeEnabled()) {
                    arr = generateSampleRowsFromItems(items, 10);
                }
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
        });
        // gridView — RealGrid GridView. `id` 는 grid 의 string id 로 노출
        //   (산출물이 grid.gridView.id 로 자기 식별하는 wingui 패턴 지원).
        const gridViewApi = wrapGridApi(view, { id });

        const grid = {
            id,
            items,
            gridView: gridViewApi,        // ★ wingui 호환 — setCheckBar/setStateBar/commit/getCheckedRows 등
            dataProvider: dataProviderApi,
            // grid-level 편의 — wingui 산출물·shim 의 GridSaveButton/GridDeleteRowButton 이 직접 호출
            commit: (force) => { try { return view.commit(force !== false); } catch (_e) { return undefined; } },
            cancel: () => { try { return view.cancel && view.cancel(); } catch (_e) { return undefined; } },
            refresh: () => { try { return view.refresh && view.refresh(); } catch (_e) { return undefined; } },
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
            // 2·3번째 인자도 wingui 호환 wrapper 로 — afterGridCreate(grid, gridView, dataProvider)
            try { afterGridCreate(grid, gridViewApi, dataProviderApi); } catch (_e) { /* no-op */ }
        }

        return () => {
            delete REGISTRY[id];
            try { view.destroy && view.destroy(); } catch (_e) { /* no-op */ }
            try { dp.destroy && dp.destroy(); } catch (_e) { /* no-op */ }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    return (
        // outer Box: flex container 부모면 flex:1 으로, 일반 block 부모면 height:100% 으로 양쪽 호환.
        //   (2026-05-28) 산출물의 wrapper `<div style={{flex:1,minHeight:0}}>` 가 flex container 가
        //   아닐 때 flex:1 만으로는 outer Box height=0 → grid body 0px collapse. height:100% 추가로
        //   부모가 block-level 일 때도 정상 expand. 부모가 flex container 면 flex:1 가 우선 적용됨.
        <Box sx={{ flex: 1, minHeight: 0, height: '100%', position: 'relative' }}>
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

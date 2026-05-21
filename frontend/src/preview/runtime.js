// =============================================================================
// preview/runtime.js — _preview JSX 격리 로더 + Mock 데이터 환경
// =============================================================================
// 목적: 산출물 JSX/JS 를 webpack dependency graph 와 완전 격리한 채 로드.
//
// 메커니즘:
//   1. fetch('/composer/sessions/<sid>/preview/source-jsx?view=<viewSub>') 로 raw 텍스트.
//   2. @babel/standalone 으로 JSX → CommonJS 변환.
//   3. new Function 으로 sandbox 실행 + custom require 가 module registry 에서 lookup.
//   4. module.exports.default 반환.
//
// 격리 효과: 산출물 JSX 가 syntax error / Module not found 라도 main bundle 컴파일에
// 영향이 0 — webpack 이 _preview 폴더를 dependency graph 에 포함시키지 않기 때문 (PreviewEmbed
// 에서 dynamic import 를 제거함). 에러는 이 모듈 안에서 catch 되어 호출자가 받음.
//
// 2026-05-18 — Mock 환경 추가:
//   · axios / zAxios / callService 등 HTTP 호출 모듈을 mock 으로 교체
//   · 산출물 코드는 1바이트도 변경되지 않음 (real axios 대신 mock 이 REGISTRY 에 등록될 뿐)
//   · GET → makeSampleRows(8) 반환 → Grid/Chart 가 sample 데이터로 채워짐
//   · POST/PUT/DELETE → { ok:true } ack 반환
//   · @plannel/services/<name> → Proxy 로 모든 method 가 mock 응답
// =============================================================================

import * as Babel from '@babel/standalone';

// ----- main bundle 의 모듈들을 미리 import 해서 registry 에 등록 -----
// 산출물 JSX 가 import 할 가능성이 있는 모든 표면을 여기서 한 번만 모음.
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactHookForm from 'react-hook-form';

import * as MuiMaterial from '@mui/material';
import * as MuiMaterialStyles from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import LaunchIcon from '@mui/icons-material/Launch';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import * as WinguiImports from '@wingui/common/imports';
import * as WinguiFieldCascade from '@wingui/common/fieldCascade';
import * as ZionexWinguiCore from '@zionex/wingui-core';
import { generateSampleRowsFromItems, isSampleModeEnabled } from '../shim/wingui/common/sampleData';
import CommonCodeSelect from '@wingui/view/common/CommonCodeSelect';
import LlmMarkdown from '@wingui/view/common/LlmMarkdown';
import PopDepartment from '@wingui/view/common/PopDepartment';
import PopPosition from '@wingui/view/common/PopPosition';

// axios 는 mock 으로 교체 (아래 createMockAxios) — real axios 를 등록하지 않음.
import * as Zustand from 'zustand';
import * as Immer from 'immer';
import * as DateFns from 'date-fns';

// ============================================================================
// Mock 환경 — 화면 실행 시 API 호출이 sample 데이터를 받도록
// ============================================================================
// 산출물 코드는 그대로 두고 (artifact 무변경) runtime 의 customRequire 가
// 'axios', '@wingui/common/zAxios', '@plannel/services/*' 등을 mock 객체로
// resolve 한다. Grid/Chart 가 빈 화면 대신 sample row 8개로 채워짐.

function makeSampleRows(n) {
    return Array.from({ length: n }, (_, i) => {
        const idx = i + 1;
        const ymd = '2026-05-' + String(10 + i).padStart(2, '0');
        return {
            // identifiers
            id: idx, seq: idx, no: idx, rowKey: 'R-' + idx,
            itemId: idx, itemCd: 'IT-' + String(idx).padStart(3, '0'),
            itemNm: '샘플품목 ' + idx, itemName: '샘플품목 ' + idx, itemCode: 'IT-' + String(idx).padStart(3, '0'),
            accountCd: 'AC-' + String(idx).padStart(3, '0'), accountNm: '샘플거래처 ' + idx,
            locatCd: 'LC-' + String(idx).padStart(3, '0'), locatNm: '샘플거점 ' + idx,
            userId: 'user' + String(idx).padStart(3, '0'), userNm: '사용자 ' + idx,
            username: 'user' + String(idx).padStart(3, '0'),
            displayName: '사용자 ' + idx,
            deptCd: 'D' + String(idx).padStart(2, '0'), deptNm: '영업' + (idx % 4 + 1) + '팀',
            positionCd: 'P' + String(idx).padStart(2, '0'), positionNm: ['사원','대리','과장','차장','부장'][idx % 5],
            // generic
            name: 'Sample ' + idx, title: '제목 ' + idx, code: 'C-' + idx,
            description: '샘플 설명 ' + idx, remark: '비고 ' + idx,
            // numbers
            qty: 100 + idx * 20, amount: idx * 10000, price: idx * 1000,
            value: idx * 50, sum: idx * 75, ratio: (idx * 7.5) % 100,
            // status / boolean
            useYn: idx % 2 === 0 ? 'N' : 'Y',
            useYnBool: idx % 2 !== 0,
            status: ['ACTIVE', 'PENDING', 'DONE', 'CANCELED'][idx % 4],
            statusCd: ['A', 'P', 'D', 'C'][idx % 4],
            type: 'TYPE_' + (idx % 3 + 1),
            itemTypeCd: ['RAW', 'SUB', 'SEMI', 'FG'][idx % 4],
            // dates
            createDt: ymd, planDate: ymd, modifyDt: '2026-05-' + String(15 + i).padStart(2, '0'),
            createDttm: ymd + ' 09:30:00', modifyDttm: ymd + ' 14:20:00',
            joinDt: '2026-0' + (idx % 3 + 1) + '-15',
            // audit
            createBy: 'composer', modifyBy: 'composer',
            // multi-tenant
            tenantId: 'tenant_a',
        };
    });
}

function makeSampleChartData() {
    return {
        labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
        datasets: [
            { label: '계획', data: [120, 150, 180, 200, 220, 250],
              backgroundColor: 'rgba(59,130,246,0.4)', borderColor: '#3b82f6' },
            { label: '실적', data: [100, 145, 175, 195, 210, 245],
              backgroundColor: 'rgba(16,185,129,0.4)', borderColor: '#10b981' },
        ],
    };
}

function mockResponse(url, method) {
    const m = String(method || 'get').toLowerCase();
    const u = String(url || '');
    // chart 데이터 형태 추론
    if (/chart|graph|trend|series/i.test(u)) {
        return Promise.resolve({ data: makeSampleChartData(), status: 200 });
    }
    // 저장/삭제 계열 — ack
    if (m === 'post' || m === 'put' || m === 'delete' || m === 'patch'
        || /save|create|insert|update|delete|remove/i.test(u)) {
        if (m === 'get') return Promise.resolve({ data: makeSampleRows(8), status: 200 });
        return Promise.resolve({ data: { ok: true, message: 'preview mock — ' + m + ' ' + u }, status: 200 });
    }
    // 단건 조회 패턴
    if (/\/(get|detail|info|find)(\b|\/)/i.test(u)) {
        return Promise.resolve({ data: makeSampleRows(1)[0], status: 200 });
    }
    // 옵션/콤보 — 짧은 리스트
    if (/option|combo|dropdown|select|tree|code/i.test(u)) {
        return Promise.resolve({ data: makeSampleRows(5).map(r => ({
            value: r.code, label: r.name, code: r.code, name: r.name,
        })), status: 200 });
    }
    // 기본 — 빈 배열. BaseGrid shim 이 gridItems 컬럼 메타를 보고
    //   generateSampleRowsFromItems() 로 컬럼 일치 sample 을 채워준다 (sampleData.js).
    //   여기서 하드코딩 makeSampleRows(8) 를 반환하면 산출물의 실제 컬럼명(itemTp/uomCd/
    //   stdPrice/leadTime 등)과 매칭되지 않는 row 가 그리드에 들어가서 대부분 셀이 비게
    //   된다 ("빈 mockup" 증상). 빈 배열을 반환해 BaseGrid 의 컬럼 기반 sample 경로로 위임.
    return Promise.resolve({ data: [], status: 200 });
}

function createMockAxios() {
    // axios 의 호출 형태: axios(config), axios.get(url, config), axios.post(url, data, config), ...
    const fn = (cfg) => mockResponse(cfg && cfg.url, cfg && cfg.method);
    fn.get    = (url) => mockResponse(url, 'get');
    fn.post   = (url) => mockResponse(url, 'post');
    fn.put    = (url) => mockResponse(url, 'put');
    fn.delete = (url) => mockResponse(url, 'delete');
    fn.patch  = (url) => mockResponse(url, 'patch');
    fn.head   = (url) => mockResponse(url, 'head');
    fn.options = (url) => mockResponse(url, 'options');
    fn.request = (cfg) => mockResponse(cfg && cfg.url, cfg && cfg.method);
    fn.create = () => fn;
    fn.defaults = { headers: { common: {} } };
    fn.interceptors = { request: { use: () => 0, eject: () => {} }, response: { use: () => 0, eject: () => {} } };
    fn.isAxiosError = () => false;
    fn.CancelToken = { source: () => ({ token: null, cancel: () => {} }) };
    return fn;
}

const mockAxios = createMockAxios();
const mockCallService = (serviceId, params) => mockResponse(serviceId, 'post');
const mockShowMessage = (titleOrType, msg, cb) => {
    // 두 가지 시그니처 호환:
    //   showMessage(title, message, callback)
    //   showMessage('confirm'/'error', message, callback)
    if (typeof cb === 'function') cb(true);
    console.log('[preview mock] showMessage:', titleOrType, msg);
};

// PlanNEL 의 @plannel/services/<name> 같은 service 객체 — 어떤 method 호출이든 mock 응답
function makeMockService(serviceName) {
    return new Proxy({ __serviceName: serviceName }, {
        get(target, prop) {
            if (typeof prop !== 'string') return target[prop];
            if (prop === 'default' || prop === '__esModule') return target[prop];
            // 모든 method 호출을 mock response 로
            return (...args) => mockResponse(serviceName + '/' + prop, /save|create|update|delete|remove/i.test(prop) ? 'post' : 'get');
        },
    });
}

// AG-Grid (PlanNEL) 의 최소 stub — props 받아 간단한 HTML table 로 렌더
function makeAgGridStub() {
    const AgGridReact = (props) => {
        const propsRowData    = props && Array.isArray(props.rowData)    ? props.rowData    : null;
        const propsColumnDefs = props && Array.isArray(props.columnDefs) ? props.columnDefs : null;
        const columnDefs = propsColumnDefs
            || (propsRowData && propsRowData[0]
                ? Object.keys(propsRowData[0]).slice(0, 7).map(k => ({ field: k, headerName: k }))
                : []);
        // [Sample 데이터] rowData 가 비어있거나 미전달 + sample 모드 ON + columnDefs 있음 →
        //   columnDefs.field 를 BaseGrid items 형식으로 변환해 column-aware sample 생성.
        //   `[] || x` 는 `[]` 가 truthy 라 fallback 발화 안 함 → 명시적 length 체크 필수.
        let rowData;
        if (propsRowData && propsRowData.length > 0) {
            rowData = propsRowData;
        } else if (isSampleModeEnabled() && columnDefs.length > 0) {
            const items = columnDefs.map(c => ({
                name: c.field,
                dataType: c.cellDataType
                    || (c.type === 'numericColumn' || c.valueFormatter ? 'number' : 'text'),
                // useDropdown 메타가 있으면 그대로 전달 (sampleData.js valueGeneratorFor 가 활용)
                useDropdown: !!(c.cellEditor === 'agSelectCellEditor' && c.cellEditorParams),
                values: c.cellEditorParams && c.cellEditorParams.values,
                labels: c.cellEditorParams && c.cellEditorParams.values,
                lookupDisplay: true,
            }));
            rowData = generateSampleRowsFromItems(items, 10);
        } else {
            rowData = [];
        }
        const trStyle = { borderBottom: '1px solid #e5e7eb' };
        const thStyle = { textAlign: 'left', padding: '6px 8px', background: '#f3f4f6',
                          borderBottom: '2px solid #d1d5db', fontSize: 12, fontWeight: 600 };
        const tdStyle = { padding: '6px 8px', fontSize: 12 };
        return React.createElement('div', {
            style: { border: '1px solid #d1d5db', borderRadius: 4, overflow: 'auto', maxHeight: 480 },
        }, React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse' } },
            React.createElement('thead', null,
                React.createElement('tr', null,
                    columnDefs.map((c, i) => React.createElement('th', { key: i, style: thStyle },
                        c.headerName || c.field)))),
            React.createElement('tbody', null,
                rowData.map((row, i) => React.createElement('tr', { key: i, style: trStyle },
                    columnDefs.map((c, j) => React.createElement('td', { key: j, style: tdStyle },
                        row && c.field ? String(row[c.field] ?? '') : '')))))
        ));
    };
    AgGridReact.displayName = 'PreviewMockAgGrid';
    return AgGridReact;
}

// ----- 모듈 registry -----
// 키: import path. 값: 모듈 객체 (default + named exports).
// CommonJS 변환된 코드는 require(path) 로 lookup 하므로 default 가 필요한 경우엔
// `{ default: X, __esModule: true }` 형태가 가장 호환성 좋음.
function esModule(mod) {
    // 이미 __esModule 마킹이 있으면 그대로. 없으면 default 도 함께 노출.
    if (mod && mod.__esModule) return mod;
    if (mod && typeof mod === 'object') {
        // namespace import 결과는 default 가 들어있을 수도 있고 없을 수도 있음.
        return { __esModule: true, ...mod, default: mod.default ?? mod };
    }
    return { __esModule: true, default: mod };
}
function defaultModule(value) {
    return { __esModule: true, default: value };
}

// ----- react-router-dom shim -----
// 미리보기는 Router 컨텍스트 없는 격리 렌더 — 실제 react-router-dom 의 훅은 <Router> 밖에서
// 호출되면 throw 한다. EXISTING_MODIFY 가 import 한 원본 화면이 라우터를 써도 안전히 렌더되도록 stub.
// (generic Proxy stub 으로는 useNavigate() → undefined 크래시 · <Route> children 미렌더 → 불가)
function buildReactRouterShim() {
    const passthrough = (name) => {
        const C = (props) => React.createElement(React.Fragment, null, props && props.children);
        C.displayName = 'PreviewRouterStub(' + name + ')';
        return C;
    };
    const RouteStub = (props) => {
        if (props && props.element) return props.element;          // v6
        if (props && props.children) return React.createElement(React.Fragment, null, props.children);
        if (props && props.component) return React.createElement(props.component, {});  // v5
        if (props && typeof props.render === 'function') return props.render({});       // v5
        return null;
    };
    RouteStub.displayName = 'PreviewRouterStub(Route)';
    const LinkStub = (props) => {
        const rest = { ...(props || {}) };
        ['to', 'replace', 'component', 'end', 'caseSensitive', 'relative', 'reloadDocument',
         'state', 'preventScrollReset'].forEach((k) => delete rest[k]);
        const children = rest.children; delete rest.children;
        return React.createElement('a', {
            ...rest, href: '#', onClick: (e) => { if (e) e.preventDefault(); },
        }, children);
    };
    LinkStub.displayName = 'PreviewRouterStub(Link)';
    const stubHistory = {
        push: () => {}, replace: () => {}, go: () => {}, goBack: () => {}, goForward: () => {},
        listen: () => (() => {}), block: () => (() => {}),
        location: { pathname: '/', search: '', hash: '', state: null }, length: 1, action: 'POP',
    };
    const stubLocation = { pathname: '/', search: '', hash: '', state: null, key: 'preview' };
    return {
        __esModule: true,
        BrowserRouter: passthrough('BrowserRouter'), HashRouter: passthrough('HashRouter'),
        MemoryRouter: passthrough('MemoryRouter'), Router: passthrough('Router'),
        Routes: passthrough('Routes'), Switch: passthrough('Switch'), Outlet: passthrough('Outlet'),
        Route: RouteStub, Link: LinkStub, NavLink: LinkStub,
        Redirect: () => null, Navigate: () => null, Prompt: () => null,
        useHistory: () => stubHistory, useNavigate: () => (() => {}),
        useLocation: () => stubLocation, useParams: () => ({}),
        useRouteMatch: () => ({ path: '/', url: '/', params: {}, isExact: true }),
        useMatch: () => null, useSearchParams: () => [new URLSearchParams(), () => {}],
        useResolvedPath: (to) => ({ pathname: String(to == null ? '/' : to), search: '', hash: '' }),
        useOutletContext: () => undefined, useNavigationType: () => 'POP',
        matchPath: () => null, generatePath: (p) => p, withRouter: (Comp) => Comp,
    };
}

const REGISTRY = {
    // React core
    'react': esModule(React),
    'react-dom': esModule(ReactDOM),
    'react-hook-form': esModule(ReactHookForm),

    // MUI
    '@mui/material': esModule(MuiMaterial),
    // @mui/material/styles — useTheme · styled · alpha · ThemeProvider 등. 미등록 시
    //   useTheme() 가 stub no-op → undefined → `theme.xxx` 접근에서 크래시.
    '@mui/material/styles': esModule(MuiMaterialStyles),
    '@mui/icons-material/Search': defaultModule(SearchIcon),
    '@mui/icons-material/Add': defaultModule(AddIcon),
    '@mui/icons-material/Delete': defaultModule(DeleteIcon),
    '@mui/icons-material/Save': defaultModule(SaveIcon),
    '@mui/icons-material/FileDownload': defaultModule(FileDownloadIcon),
    '@mui/icons-material/FileUpload': defaultModule(FileUploadIcon),
    '@mui/icons-material/Edit': defaultModule(EditIcon),
    '@mui/icons-material/Refresh': defaultModule(RefreshIcon),
    '@mui/icons-material/Close': defaultModule(CloseIcon),
    '@mui/icons-material/Check': defaultModule(CheckIcon),
    '@mui/icons-material/Warning': defaultModule(WarningIcon),
    '@mui/icons-material/Info': defaultModule(InfoIcon),
    '@mui/icons-material/Launch': defaultModule(LaunchIcon),
    '@mui/icons-material/ArrowDropDown': defaultModule(ArrowDropDownIcon),
    '@mui/icons-material/ArrowDropUp': defaultModule(ArrowDropUpIcon),
    '@mui/icons-material/ExpandMore': defaultModule(ExpandMoreIcon),
    '@mui/icons-material/ChevronRight': defaultModule(ChevronRightIcon),
    '@mui/icons-material/MoreVert': defaultModule(MoreVertIcon),

    // wingui shim — zAxios/callService/showMessage 는 mock 으로 override
    // (mock 객체로 import 가 들어가야 화면이 API 호출 없이 sample 데이터 렌더)
    '@wingui/common/imports': esModule({
        ...WinguiImports,
        zAxios: mockAxios,
        callService: mockCallService,
        showMessage: mockShowMessage,
    }),
    '@wingui/common/zAxios': defaultModule(mockAxios),
    // cascade — 산출물이 '@wingui/common/imports' 가 아닌 별도 경로로 import 하는 경우 대비.
    //   (useFieldCascade / applyGridCascade / buildPopupFilterProps 가 여기 모두 들어있음)
    '@wingui/common/fieldCascade': esModule(WinguiFieldCascade),
    '@wingui/common/gridCascade': esModule(WinguiFieldCascade),
    '@wingui/common/useFieldCascade': esModule(WinguiFieldCascade),
    '@zionex/wingui-core': esModule(ZionexWinguiCore),
    '@wingui/view/common/CommonCodeSelect': defaultModule(CommonCodeSelect),
    '@wingui/view/common/LlmMarkdown': defaultModule(LlmMarkdown),
    '@wingui/view/common/PopDepartment': defaultModule(PopDepartment),
    '@wingui/view/common/PopPosition': defaultModule(PopPosition),

    // HTTP — mock 으로 교체. API 호출 시 makeSampleRows(8) 가 응답.
    'axios': defaultModule(mockAxios),

    // 기타
    'zustand': esModule(Zustand),
    'immer': esModule(Immer),
    'date-fns': esModule(DateFns),

    // react-router-dom — 격리 미리보기용 stub (실제 라우터는 Router 컨텍스트 필요).
    //   EXISTING_MODIFY 가 import 한 원본 화면이 라우터를 써도 미리보기가 렌더되도록.
    'react-router-dom': buildReactRouterShim(),
    'react-router': buildReactRouterShim(),

    // react-i18next — withTranslation HOC 가 t prop 을 inject 해야 함.
    //   SAFE_STUB 의 identity-HOC 휴리스틱은 PascalCase 컴포넌트를 그대로 돌려주는데,
    //   그러면 `t` prop 이 비어 산출물 컴포넌트의 `t("...")` 호출이 TypeError.
    //   여기서는 key-passthrough 로 t 를 inject 하는 진짜 HOC 를 제공.
    'react-i18next': esModule({
        withTranslation: () => (Comp) => {
            const Wrapped = (props) => React.createElement(Comp, {
                ...(props || {}),
                t: (k) => (k == null ? '' : String(k)),
                i18n: { language: 'ko', changeLanguage: () => Promise.resolve() },
                tReady: true,
            });
            Wrapped.displayName = 'PreviewI18nHOC(' + (Comp && (Comp.displayName || Comp.name) || 'Anonymous') + ')';
            return Wrapped;
        },
        useTranslation: () => ({
            t: (k) => (k == null ? '' : String(k)),
            i18n: { language: 'ko', changeLanguage: () => Promise.resolve() },
            ready: true,
        }),
        Trans: ({ i18nKey, children }) => React.createElement(React.Fragment, null, children || i18nKey || ''),
        I18nextProvider: ({ children }) => React.createElement(React.Fragment, null, children),
        Translation: ({ children }) => (typeof children === 'function' ? children((k) => k, { language: 'ko' }, true) : null),
        initReactI18next: { type: '3rdParty', init: () => {} },
    }),

    // react-redux — useDispatch/useSelector/connect 가 SAFE_STUB 로 처리되면
    //   selector 결과가 SAFE_STUB Proxy 라 `state.foo.length` 같은 access 는 안전하나
    //   `{ foo, bar } = useSelector(...)` 구조분해 + 산출물 변수 = SAFE_STUB 의 동작이 일관되지 않음.
    //   안전한 default 값을 명시 제공.
    'react-redux': esModule({
        useDispatch: () => (() => {}),
        useSelector: () => undefined,
        useStore: () => ({ getState: () => ({}), dispatch: () => {}, subscribe: () => (() => {}) }),
        connect: () => (Comp) => Comp,
        Provider: ({ children }) => React.createElement(React.Fragment, null, children),
        shallowEqual: (a, b) => a === b,
        batch: (fn) => { if (typeof fn === 'function') fn(); },
    }),

    // PlanNEL (AG-Grid) — stub. 실제 AG-Grid 가 깔리지 않아도 sample 데이터 table 로 렌더.
    '@ag-grid-community/react': esModule({ AgGridReact: makeAgGridStub() }),
    '@ag-grid-community/core': esModule({}),

    // ── PlanNEL components — 의미별 shim ──────────────────────────────────────
    // 기본 fallback (makeFallbackComponent) 은 노란 점선 [stub] placeholder 라서
    //   wrapper 컴포넌트가 stub 으로 뜨면 자식 (검색조건 필드들) 이 가려진다.
    //   주요 wrapper 는 passthrough · 보이지 않아도 되는 것은 null · 입력은 실제 input 으로.
    //   ─ PlanNEL 실제 컴포넌트가 환경에 깔리면 그쪽이 우선. 미설치 시 본 stub.
    '@plannel/components/layout/FilterContainer': defaultModule((function () {
        // 검색조건 박스 — wingui SearchArea 룩 (#f4f6f8 + border) + 자식 가로 배치.
        const C = ({ children }) => React.createElement('div', {
            style: {
                display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8,
                padding: '10px 12px', marginBottom: 8,
                background: '#f4f6f8', border: '1px solid #E0E0E0', borderRadius: 4,
            },
        }, children);
        C.displayName = 'PreviewPlannel(FilterContainer)';
        return C;
    })()),
    '@plannel/components/PaginationContainer': defaultModule(() => null),
    '@plannel/components/Dialog':              defaultModule(() => null),
    '@plannel/components/Snackbar':            defaultModule(() => null),
    '@plannel/components/filter/AdvancedFilter': defaultModule((function () {
        // 검색조건 내부 그룹 — 자식 그대로 가로 배치.
        const C = ({ children }) => React.createElement('span', {
            style: { display: 'inline-flex', alignItems: 'center', gap: 6 },
        }, children);
        C.displayName = 'PreviewPlannel(AdvancedFilter)';
        return C;
    })()),
    '@plannel/components/filter/ItemAutocomplete': defaultModule((function () {
        const C = ({ value, onChange, placeholder, label }) => React.createElement('label', {
            style: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#475569' },
        }, label ? React.createElement('span', null, label) : null,
           React.createElement('input', {
               type: 'text', value: value || '',
               placeholder: placeholder || '품목 선택',
               onChange: (e) => onChange && onChange(e.target.value),
               style: {
                   padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 4,
                   fontSize: 12, width: 180, background: 'white',
               },
           }));
        C.displayName = 'PreviewPlannel(ItemAutocomplete)';
        return C;
    })()),
    '@plannel/components/ActionIconButton': esModule((function () {
        const mkBtn = (label, color) => {
            const Btn = ({ onClick, disabled, title }) => React.createElement('button', {
                onClick: disabled ? undefined : onClick, disabled,
                title: title || label,
                style: {
                    margin: '0 2px', padding: '4px 10px', fontSize: 12, fontWeight: 600,
                    border: '1px solid ' + color, borderRadius: 4,
                    background: 'white', color: color,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                },
            }, label);
            Btn.displayName = 'PreviewPlannel(' + label + 'Button)';
            return Btn;
        };
        return {
            AddButton:    mkBtn('추가', '#3b82f6'),
            RemoveButton: mkBtn('삭제', '#ef4444'),
            SaveButton:   mkBtn('저장', '#10b981'),
            FilterButton: mkBtn('검색', '#0ea5e9'),
        };
    })()),
    '@plannel/components/ExcelExportButton': defaultModule((function () {
        const Btn = ({ onClick, disabled }) => React.createElement('button', {
            onClick: disabled ? undefined : onClick, disabled, title: 'Excel 다운로드',
            style: {
                margin: '0 2px', padding: '4px 10px', fontSize: 12, fontWeight: 600,
                border: '1px solid #16a34a', borderRadius: 4,
                background: 'white', color: '#16a34a',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
            },
        }, 'Excel');
        Btn.displayName = 'PreviewPlannel(ExcelExportButton)';
        return Btn;
    })()),
};

// ----- 만능 안전값 (SAFE_STUB) -----
// 미해결 모듈의 훅/유틸 stub 이 raw `undefined` 를 돌려주면, 그 결과에 `.prop` 접근이나
// 배열 구조분해를 하는 산출물 코드가 곧바로 크래시한다
//   (예: 미등록 `@mui/material/styles` → `useTheme()` → undefined → `theme.type` TypeError).
// SAFE_STUB 은 어떤 접근(`.prop` 체이닝 · 호출 · `new` · `for..of`/구조분해 · 문자열 coercion)
// 에도 throw 하지 않는 값 — 미등록 모듈을 만나도 화면이 "best-effort" 로 렌더된다.
const SAFE_STUB = (function buildSafeStub() {
    const fn = function () { return SAFE_STUB; };
    return new Proxy(fn, {
        get(_t, prop) {
            if (prop === Symbol.iterator)    return function* () {};   // const [a,b]=x → 안전
            if (prop === Symbol.toPrimitive) return () => '';          // `''+x` · 템플릿 리터럴
            if (prop === Symbol.toStringTag) return 'PreviewSafeStub';
            // thenable 오인 방지 — await SAFE_STUB 가 영원히 pending 되지 않도록
            if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined;
            if (prop === '__esModule') return false;
            if (prop === 'length') return 0;
            if (typeof prop === 'symbol') return undefined;
            // React 가 컴포넌트 정적 검증에 lookup 하는 필드는 undefined 로.
            //   withTranslation()(C) 같은 HOC stub 결과가 SAFE_STUB 이 되어 컴포넌트로
            //   쓰일 때, React 가 SAFE_STUB.propTypes / contextTypes 를 lookup → 그것도
            //   SAFE_STUB(=함수)이라 PropTypes 가 "type checker 가 함수 반환" 으로 오해해
            //   `__reactInternalMemoizedMergedChildContext`/`updater`/`_reactInternals`
            //   등 instance internal 필드마다 warning 폭주. 정적 검증 우회로 차단.
            if (prop === 'propTypes' || prop === 'contextTypes'
                || prop === 'childContextTypes' || prop === 'defaultProps'
                || prop === 'displayName' || prop === 'getDerivedStateFromProps'
                || prop === 'getDerivedStateFromError'
                // React.createElement validation 의 misspelling 체크 (`PropTypes` 대문자)
                // + 옛 deprecated API (`getDefaultProps`) 도 truthy 면 warning 발사
                || prop === 'PropTypes' || prop === 'getDefaultProps') return undefined;
            // ★ React 클래스 컴포넌트 판별 우회 — Component.prototype.isReactComponent
            //   으로 React 가 클래스/함수 컴포넌트를 구분. SAFE_STUB.prototype 이
            //   SAFE_STUB (truthy) 이면 React 가 클래스로 오인해 instantiate 후 checkClassInstance
            //   를 돌려 contextType / shouldComponentUpdate / componentDidUnmount(typo) /
            //   componentDidReceiveProps(typo) / super(props) / getSnapshotBeforeUpdate static
            //   등 10+개 sanity check warning 폭주. prototype 을 undefined 로 두면 React 의
            //   class check 가 false → function component 경로로 진입해 checkClassInstance skip.
            if (prop === 'prototype') return undefined;
            return SAFE_STUB;          // 깊은 체이닝 (a.b.c) 도 안전
        },
        apply(_t, _thisArg, args) {
            // ★ HOC 패턴 — `withTranslation()(C)` · `withRouter(C)` · `connect(...)(C)` 등.
            //   단일 function 인자 + 그 함수가 **PascalCase 이름** 일 때만 identity HOC 로
            //   인식해 component 를 그대로 반환. → PreviewEmbed 가 실제 컴포넌트를 받아 렌더.
            //   PascalCase 체크는 `connect(mapStateToProps)(Component)` 처럼 callback
            //   (camelCase) 을 첫 인자로 받는 케이스에서 잘못 identity 처리되는 것 방지.
            //   (이 휴리스틱이 없으면 SAFE_STUB 이 컴포넌트로 렌더되어 React 가 "Functions
            //    are not valid as a React child" warning 발사 + 화면 안 뜸.)
            if (args && args.length === 1 && typeof args[0] === 'function') {
                const fn = args[0];
                const name = fn.displayName || fn.name || '';
                if (/^[A-Z]/.test(name)) return fn;
            }
            return SAFE_STUB;
        },
        construct() { return SAFE_STUB; },
    });
})();

// ----- 부재 import 에 대한 generic stub -----
// `@mui/icons-material/<Unknown>` 같은 미등록 import 가 들어와도 화면이 깨지지 않게
// fallback. icon 은 placeholder 'X' span 으로, 그 외는 명확한 에러.
function makeFallbackIcon(spec) {
    const Comp = (props) => React.createElement('span', {
        ...props,
        title: '[stub] ' + spec,
        style: { display: 'inline-block', width: 16, height: 16, ...(props && props.style) },
    });
    Comp.displayName = 'PreviewStubIcon(' + spec + ')';
    return defaultModule(Comp);
}
function makeFallbackComponent(spec) {
    const Comp = (props) => React.createElement('div', {
        style: {
            display: 'inline-flex', alignItems: 'center', padding: '4px 8px',
            border: '1px dashed #f59e0b', borderRadius: 4,
            background: '#fef3c7', color: '#92400e', fontSize: 12,
        },
        title: '[stub] ' + spec,
    }, '[stub] ' + (spec.split('/').pop() || spec));
    Comp.displayName = 'PreviewStubComponent(' + spec + ')';
    return defaultModule(Comp);
}

/**
 * 미해결 모듈에 대한 Proxy 스텁 모듈.
 *
 * `makeFallbackComponent` 는 default export 하나만 가진 stub — 산출물이 그 모듈에서
 * named export (예: `import { useFieldCascade } from '...'`) 를 꺼내 쓰면 `undefined`
 * 가 되어 `useFieldCascade is not a function` 으로 화면이 크래시한다.
 *
 * Proxy 로 **어떤 이름을 꺼내든** 안전한 값을 돌려준다:
 *   - 대문자 시작 (`BaseGrid` 등) → stub 컴포넌트 (대시 박스)
 *   - 그 외 (`useXxx` 훅 · 유틸 함수) → 호출 시 SAFE_STUB 반환 (호출·`.prop`·구조분해 안전)
 * → 미해결 모듈이 있어도 화면 렌더가 멈추지 않는다 (자동보완이 소스를 고칠 시간을 번다).
 *   ★ noop 이 `undefined` 가 아닌 SAFE_STUB 을 돌려주는 게 핵심 — 훅 반환값에 `.prop`
 *     접근하는 산출물(예: `useTheme().palette`)이 미등록 모듈에서도 크래시하지 않음.
 */
function makeFallbackModule(spec) {
    const lastSeg = String(spec).split('/').pop() || String(spec);
    const stubComp = makeFallbackComponent(spec).default;
    // default export 결정:
    //   - PascalCase (Box, BaseGrid, MaterialMaster …) → stubComp (가시적 placeholder)
    //   - lowercase/kebab (redux-util, material-service, useDispatch …) → SAFE_STUB
    //     (Proxy 함수 — `util.method()` · `useXxx()` · `service.foo.bar()` 모두 안전)
    //   이전엔 lowercase 도 stubComp 이 default 라 `reduxUtil.getViewState` 가
    //   `stubComp.getViewState` (undefined) → TypeError. SAFE_STUB 으로 통일.
    const baseDefault = /^[A-Z]/.test(lastSeg) ? stubComp : SAFE_STUB;
    const target = { __esModule: true, default: baseDefault };
    return new Proxy(target, {
        get(t, prop) {
            if (prop in t) return t[prop];
            if (typeof prop !== 'string') return undefined;
            // 대문자 시작 → 컴포넌트 stub · 그 외 → SAFE_STUB (호출·체이닝·HOC 모두 호환)
            const v = /^[A-Z]/.test(prop) ? stubComp : SAFE_STUB;
            t[prop] = v;   // 동일 export 가 매번 같은 참조이도록 캐시
            return v;
        },
        has() { return true; },
    });
}

function previewRequire(spec) {
    if (REGISTRY[spec]) return REGISTRY[spec];

    // CSS / SCSS / 이미지 — 빈 모듈. 미리보기는 시각 mockup 만 필요해 스타일 미적용 OK.
    if (/\.(css|scss|sass|less|svg|png|jpe?g|gif|webp)$/i.test(spec)) {
        const mod = esModule({ default: {} });
        REGISTRY[spec] = mod;
        return mod;
    }

    // 상대 import (`./PopX`, `../utils/foo`) — preview 가 산출물 한 파일만 받기 때문에
    //   같은 디렉토리 형제 파일은 없음. 컴포넌트로 가정해 노란 [stub] 박스로 표시.
    //   (PopupDialog 류는 trigger 전엔 invisible 이라 보통 visual mockup 에 영향 없음)
    if (spec.startsWith('./') || spec.startsWith('../')) {
        const stub = makeFallbackModule(spec);
        REGISTRY[spec] = stub;
        return stub;
    }

    // @mui/material/<sub> — `styles` 는 REGISTRY 에 명시 등록. 그 외 컴포넌트 subpath
    //   (`@mui/material/Button` 등) 는 이미 로드된 @mui/material 네임스페이스에서 꺼낸다.
    if (spec.startsWith('@mui/material/')) {
        const seg = spec.slice('@mui/material/'.length);
        if (MuiMaterial[seg]) {
            const mod = esModule({ ...MuiMaterial, default: MuiMaterial[seg] });
            REGISTRY[spec] = mod;
            return mod;
        }
    }

    // ★ wingui-core / @wingui subpath 라우팅 — backend 에서 실모듈 fetch 안 함.
    //   미리보기 정책: "시각 mockup 우선". wingui 본 환경은 webpack ProvidePlugin/번들
    //   부트스트랩으로 module 간 free var 를 inject 하지만, 미리보기는 단독 module 로
    //   execute 해 free var 사고 (useTabContainerStyles 등) 가 끝없이 발생. 그래서
    //   wingui-core / @wingui 의 subpath import 는 **이미 메인 번들이 로드한 namespace
    //   에서 동일 이름 export 를 꺼내 사용**한다 (shim 의 mockup 표면 활용).
    //
    // 예: `import { TabContainer } from '@zionex/wingui-core/component/TabContainer'`
    //   → ZionexWinguiCore.TabContainer (shim 의 mockup 컴포넌트) 사용
    //   → wingui-core 의 실제 TabContainer 가 호출하던 useTabContainerStyles 사고 사라짐
    if (spec.startsWith('@zionex/wingui-core')) {
        const lastSeg = spec.split('/').pop() || '';
        // PascalCase subpath ("TabContainer", "SvgIcon" 등) — 동명 named export 우선
        if (/^[A-Z]/.test(lastSeg) && ZionexWinguiCore[lastSeg]) {
            const mod = esModule({ ...ZionexWinguiCore, default: ZionexWinguiCore[lastSeg] });
            REGISTRY[spec] = mod;
            return mod;
        }
        // 그 외 (utils/lang/store/component 통합) — 통째로 노출. 임의 named import
        // (transLangKey · onErrorInput · themeStoreApi 등) 가 namespace 에 있으면 작동.
        const mod = esModule({ ...ZionexWinguiCore });
        REGISTRY[spec] = mod;
        return mod;
    }

    if (spec.startsWith('@wingui/common/imports')) {
        // 동일 — 통합 import 그대로
        const mod = esModule({ ...WinguiImports });
        REGISTRY[spec] = mod;
        return mod;
    }

    if (spec.startsWith('@wingui/view/common/')) {
        // CommonCodeSelect / PopDepartment / PopPosition / LlmMarkdown 등 — REGISTRY 사전 등록.
        // 미등록 Pop* / SelectCommon 등은 fallback component 로 [stub] 박스.
        const stub = makeFallbackModule(spec);
        REGISTRY[spec] = stub;
        return stub;
    }

    if (spec.startsWith('@wingui')) {
        // 통합 imports.js 외의 wingui 경로 — fallback
        const stub = makeFallbackModule(spec);
        REGISTRY[spec] = stub;
        return stub;
    }

    // @mui/icons-material/<Name> — 부재 시 placeholder
    if (spec.startsWith('@mui/icons-material/')) {
        const stub = makeFallbackIcon(spec);
        REGISTRY[spec] = stub;
        return stub;
    }

    // PlanNEL 의 @plannel/services/<name> — Proxy mock service
    // 어떤 method 호출이든 makeSampleRows 응답 반환.
    if (spec.startsWith('@plannel/services/')) {
        const svc = makeMockService(spec);
        const mod = { __esModule: true, default: svc, ...Object.fromEntries(
            // namespace import 도 대응 — 흔히 쓰이는 method 이름들을 상위에도 노출
            ['getList', 'getDetail', 'getOne', 'save', 'create', 'update', 'delete', 'remove', 'search']
                .map(n => [n, svc[n]])
        ) };
        REGISTRY[spec] = mod;
        return mod;
    }

    // PlanNEL utils — `reduxUtil.getViewState()` 같은 method 호출 호환 위해 SAFE_STUB 사용.
    //   이전엔 `default: {}` 빈 객체였는데 산출물이 `reduxUtil.getViewState(...)` 호출 시
    //   `{}.getViewState` 가 undefined → TypeError. SAFE_STUB 은 어떤 prop 접근에도
    //   호출 가능한 함수를 돌려주므로 method chaining 안전.
    if (spec.startsWith('@plannel/utils/')) {
        const stub = makeFallbackModule(spec);
        REGISTRY[spec] = stub;
        return stub;
    }

    // @wingui/* · @zionex/* · @plannel/* — 사전 fetch (preloadDependencies) 도 실패한 경우
    //   Proxy 스텁으로 대체 → named/default export 무엇을 꺼내도 크래시 없음.
    if (spec.startsWith('@wingui/') || spec.startsWith('@zionex/') || spec.startsWith('@plannel/')) {
        const stub = makeFallbackModule(spec);
        REGISTRY[spec] = stub;
        console.warn('[preview] missing module — substituted proxy stub:', spec);
        return stub;
    }

    // 그 외 미등록 npm 모듈 (react-i18next / redux / lodash / etc) — 하드 에러 대신 Proxy 스텁.
    //   EXISTING_MODIFY 가 import 한 원본 화면이 임의 npm 라이브러리를 써도 미리보기가
    //   "모듈 실행 실패" 로 멈추지 않고 best-effort 렌더되도록 (@wingui/* 와 동일 처리).
    const stub = makeFallbackModule(spec);
    REGISTRY[spec] = stub;
    console.warn('[preview] missing module — substituted proxy stub:', spec);
    return stub;
}

// ----- 사전 모듈 해결 (recursive) -----
// JSX raw 텍스트에서 import 문 추출 → registry 에 없는 spec 들을 backend resolver 로 fetch
// → babel transform + 실행 후 REGISTRY 에 등록 → 그 모듈의 import 도 재귀 처리.
// 결과적으로 main JSX 실행 직전에 모든 dependency 가 registry 에 들어가 있게 됨.
const IMPORT_RE = /(?:^|;|\s)import\s+(?:[\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
const REQUIRE_RE = /(?:^|;|\s)require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const IMPORT_BARE_RE = /(?:^|;|\s)import\s+['"]([^'"]+)['"]/g;

function extractSpecs(source) {
    if (!source) return [];
    const specs = new Set();
    let m;
    IMPORT_RE.lastIndex = 0;
    while ((m = IMPORT_RE.exec(source)) !== null) specs.add(m[1]);
    REQUIRE_RE.lastIndex = 0;
    while ((m = REQUIRE_RE.exec(source)) !== null) specs.add(m[1]);
    IMPORT_BARE_RE.lastIndex = 0;
    while ((m = IMPORT_BARE_RE.exec(source)) !== null) specs.add(m[1]);
    return [...specs];
}

function isResolvable(_spec) {
    // ★ 미리보기 정책 — "시각 mockup 우선": wingui-core / @wingui subpath 를 backend 에서
    //   실모듈로 fetch 하면 그 안의 free var (useTabContainerStyles 등) 가 module scope 에
    //   없어 ReferenceError 가 끊임없이 발생. 그래서 backend fetch 는 더 이상 시도하지 않고,
    //   previewRequire 가 REGISTRY 의 shim namespace (WinguiImports/ZionexWinguiCore) 에서
    //   matching export 를 꺼낸다. fetch 호출 0건 = 사고 클래스 전체 차단.
    return false;
}

async function fetchModuleSource({ spec, targetCd }) {
    // same-origin relative URL — webpack-dev-server proxy 가 backend 로 forward.
    // (apiBase 가 docker internal host 'http://composer-backend:8090' 이면 브라우저가
    //  resolve 못 해서 "Failed to fetch" — 반드시 relative 사용)
    const url = '/composer/preview/resolve-module?spec=' + encodeURIComponent(spec)
              + (targetCd ? '&targetCd=' + encodeURIComponent(targetCd) : '');
    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (!res.ok) {
        const err = new Error('resolve 실패 (HTTP ' + res.status + '): ' + spec);
        err.spec = spec;
        throw err;
    }
    return res.text();
}

/**
 * source 안 미해결 spec 들을 재귀적으로 fetch + register.
 * - 등록되지 않은 spec 만 fetch
 * - cyclic dep 방어: 진행 중 spec 은 set 에 미리 placeholder 등록
 */
async function preloadDependencies({ source, targetCd, inflight }) {
    const specs = extractSpecs(source).filter(isResolvable);
    for (const spec of specs) {
        if (REGISTRY[spec]) continue;
        if (inflight.has(spec)) continue;
        inflight.add(spec);

        let depSource;
        try {
            depSource = await fetchModuleSource({ spec, targetCd });
        } catch (e) {
            console.warn('[preview] resolve-module 실패 — proxy stub 으로 대체:', spec, e.message);
            REGISTRY[spec] = makeFallbackModule(spec);
            continue;
        }
        // 재귀 — 이 dep 의 import 들도 사전 해결
        await preloadDependencies({ source: depSource, targetCd, inflight });
        // 변환 + 실행 + 등록
        try {
            const code = transformJsx(depSource);
            const exp = executeModule(code);
            // ES module 호환을 위해 __esModule 마킹 추가
            const normalized = (exp && typeof exp === 'object')
                ? (exp.__esModule ? exp : { __esModule: true, ...exp, default: exp.default ?? exp })
                : { __esModule: true, default: exp };
            REGISTRY[spec] = normalized;
        } catch (e) {
            console.warn('[preview] dep 변환/실행 실패 — proxy stub 으로 대체:', spec, e.message);
            REGISTRY[spec] = makeFallbackModule(spec);
        }
    }
}

// ----- Babel transform -----
// `transform-modules-commonjs` 가 ES module 의 import/export 를 require/exports 로 변환.
// React preset 으로 JSX 변환.
function transformJsx(source) {
    const out = Babel.transform(source, {
        filename: 'preview.jsx',
        presets: [
            ['env', { modules: 'commonjs', targets: { esmodules: true } }],
            'react',
        ],
        // 변환 helper 는 inline (별도 module 의존 X) — 격리 보장.
        sourceType: 'module',
    });
    return out && out.code;
}

// ----- ambient scope -----
// 산출물 JSX 가 wingui 표면(useIconStyles · transLangKey · useInputConstant 등)을 import
// 없이 참조해도 미리보기가 렌더되도록, wingui/zionex shim 의 export 를 ambient 식별자로 노출.
// (LLM 산출물이 import 목록에서 useIconStyles 같은 훅을 누락하는 사고가 잦음 — 자동보완이
//  소스를 고칠 때까지 화면이 "useIconStyles is not defined" 로 멈추지 않게 함)
//
// `with (plainObject)` 사용 — plainObject 가 가진 키만 그쪽으로 resolve 되고, 나머지
// (React · console · Math 등)는 정상 scope chain 으로 fall-through. Object.create(null)
// 기반이라 toString/valueOf 같은 Object.prototype 상속 이름이 with 에 끼지 않는다.
// Proxy(has:true) 와 달리 모든 free variable 을 가로채지 않아 안전.
let _ambientScope = null;
function buildAmbientScope() {
    if (_ambientScope) return _ambientScope;
    const scope = Object.create(null);
    const merge = (mod) => {
        if (!mod || typeof mod !== 'object') return;
        Object.keys(mod).forEach((k) => {
            if (k === '__esModule' || k === 'default') return;
            if (!/^[A-Za-z_$][\w$]*$/.test(k)) return;       // 유효 식별자만
            if (scope[k] === undefined && mod[k] !== undefined) scope[k] = mod[k];
        });
    };
    // wingui 화면이 쓰는 전 표면 — imports 단일 경로 + cascade + zionex core.
    merge(REGISTRY['@wingui/common/imports']);
    merge(REGISTRY['@wingui/common/fieldCascade']);
    merge(REGISTRY['@zionex/wingui-core']);
    // React 전역 — 산출물이 `import { useState } from "react"` 만 하고 default React 를
    //   import 누락하면, babel `react` preset (classic JSX transform) 이 변환한
    //   `React.createElement(...)` 가 free var `React` 를 찾지 못해 `ReferenceError: React
    //   is not defined`. `new Function` factory 의 outer scope 는 global 이라 module-scope 의
    //   React 가 보이지 않음. ambient 에 노출해 with-binding 으로 resolve.
    if (scope.React === undefined) scope.React = React;
    // wingui 화면이 import 없이 참조하는 비-shim 전역 — wingui-core/component/grid/grid.js
    //   의 export(progressSpinner·exportGridtoExcel) · react-hook-form clearErrors ·
    //   jQuery($). wingui 본 환경은 번들/부트스트랩으로 제공, 미리보기는 안전 stub 으로 보강.
    if (scope.progressSpinner   === undefined) scope.progressSpinner   = '';
    if (scope.exportGridtoExcel === undefined) scope.exportGridtoExcel = () => {};
    if (scope.clearErrors       === undefined) scope.clearErrors       = () => {};
    // wingui-core 내부 module 들이 styles hook 을 import 없이 free var 로 참조하는
    // 패턴 — wingui 본 환경은 번들 부트스트랩으로 제공. 미리보기는 단독 fetched 모듈로
    // 실행되어 ReferenceError. classes.x → SAFE_STUB (chaining 안전) 반환하는 함수 stub.
    if (scope.useTabContainerStyles === undefined) scope.useTabContainerStyles = () => SAFE_STUB;
    if (scope.useStyles             === undefined) scope.useStyles             = () => SAFE_STUB;
    if (scope.useGridStyles         === undefined) scope.useGridStyles         = () => SAFE_STUB;
    if (scope.useFormStyles         === undefined) scope.useFormStyles         = () => SAFE_STUB;
    if (scope.useDialogStyles       === undefined) scope.useDialogStyles       = () => SAFE_STUB;
    if (scope.$ === undefined) {
        const jq = function () { return jq; };
        jq.each   = (obj, fn) => { if (obj) Object.keys(obj).forEach((k) => fn(k, obj[k])); return jq; };
        jq.extend = Object.assign;
        jq.ajax   = () => SAFE_STUB;
        jq.fn = {};
        scope.$ = jq;
        scope.jQuery = jq;
    }

    // PLANNEL ambient globals — PLANEL 의 `src/index.js` 가 `import './utils/zdate'` 로
    // 부트스트랩하면서 `globalThis.ZDate = ZDate` 를 등록. 미리보기 sandbox 는 화면 jsx
    // 만 격리 실행해 부트스트랩이 안 도니까 ZDate 가 미등록 → ReferenceError.
    // §13.0 패리티 원칙 — PLANEL globals 표면 전체를 ambient 로 노출.
    //   ZDate 는 Date 를 확장한 클래스인데 preview 에선 native Date alias 로 충분 (대부분
    //   사용처가 `new ZDate()` · `new ZDate(value)` — Date 와 호환).
    if (scope.ZDate === undefined) scope.ZDate = Date;

    _ambientScope = scope;
    return scope;
}

// ----- 모듈 실행 -----
function executeModule(transformedCode) {
    const moduleObj = { exports: {} };
    const ambient = buildAmbientScope();
    // with(__ambient__) 로 감싸 import 누락된 wingui 표면도 resolve.
    //   transformedCode 선두의 "use strict" directive 는 with 블록 안이라 inert —
    //   factory 함수 본문이 with 로 시작하므로 strict 가 아니어서 with 가 합법.
    const wrapped = 'with (__ambient__) {\n' + transformedCode + '\n}';
    // eslint-disable-next-line no-new-func
    const factory = new Function('require', 'module', 'exports', '__ambient__', wrapped);
    factory(previewRequire, moduleObj, moduleObj.exports, ambient);
    return moduleObj.exports;
}

// ----- 외부 API -----
// 결과: 산출물의 default export (React component) 반환.
// 어떤 단계에서 실패해도 throw — 호출자가 catch 해서 UI 표시.
export async function loadPreviewComponent({ sessionId, viewSub, targetCd }) {
    if (!sessionId || !viewSub) throw new Error('sessionId, viewSub 필수');
    // same-origin relative URL — webpack-dev-server proxy 가 backend 로 forward.
    // 확장자 (.jsx/.js/.tsx) 를 떼고 bare name 전송 → backend 가 후보 순회로 매칭.
    const cleaned = viewSub.replace(/\.(jsx|js|tsx)$/, '');
    const url = '/composer/sessions/' + encodeURIComponent(sessionId)
              + '/preview/source-jsx?view=' + encodeURIComponent(cleaned);

    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error('preview 소스 조회 실패 (HTTP ' + res.status + '): ' + body);
    }
    const source = await res.text();

    // 부재 import 사전 해결 (재귀 deps 포함). 실패한 spec 은 stub 으로 fallback.
    try {
        await preloadDependencies({ source, targetCd, inflight: new Set() });
    } catch (e) {
        // preload 자체 실패는 main JSX 실행을 막지 않음 — 개별 spec 은 require 시 stub 대체.
        console.warn('[preview] preloadDependencies 부분 실패:', e && e.message);
    }

    let code;
    try {
        code = transformJsx(source);
    } catch (e) {
        const wrapped = new Error('JSX 변환 실패: ' + (e && e.message ? e.message : String(e)));
        wrapped.phase = 'transform';
        wrapped.cause = e;
        throw wrapped;
    }

    let moduleExports;
    try {
        moduleExports = executeModule(code);
    } catch (e) {
        const wrapped = new Error('모듈 실행 실패: ' + (e && e.message ? e.message : String(e)));
        wrapped.phase = 'execute';
        wrapped.cause = e;
        throw wrapped;
    }

    const Comp = (moduleExports && moduleExports.default) || moduleExports;
    if (typeof Comp !== 'function') {
        throw new Error('default export 가 React 컴포넌트가 아닙니다 (typeof=' + typeof Comp + ')');
    }
    return Comp;
}

// 외부 노출 — 디버깅용으로 registry 도 export.
export const __previewRegistry = REGISTRY;

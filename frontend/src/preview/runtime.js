// =============================================================================
// preview/runtime.js — _preview JSX 격리 로더
// =============================================================================
// 목적: 산출물 JSX 를 webpack dependency graph 와 완전 격리한 채 로드.
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
import CommonCodeSelect from '@wingui/view/common/CommonCodeSelect';
import LlmMarkdown from '@wingui/view/common/LlmMarkdown';
import PopDepartment from '@wingui/view/common/PopDepartment';
import PopPosition from '@wingui/view/common/PopPosition';

import axios from 'axios';
import * as Zustand from 'zustand';
import * as Immer from 'immer';
import * as DateFns from 'date-fns';

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

    // wingui shim
    '@wingui/common/imports': esModule(WinguiImports),
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

    // 기타
    'axios': defaultModule(axios),
    'zustand': esModule(Zustand),
    'immer': esModule(Immer),
    'date-fns': esModule(DateFns),

    // react-router-dom — 격리 미리보기용 stub (실제 라우터는 Router 컨텍스트 필요).
    //   EXISTING_MODIFY 가 import 한 원본 화면이 라우터를 써도 미리보기가 렌더되도록.
    'react-router-dom': buildReactRouterShim(),
    'react-router': buildReactRouterShim(),
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
            return SAFE_STUB;          // 깊은 체이닝 (a.b.c) 도 안전
        },
        apply()     { return SAFE_STUB; },
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
    const noop = () => SAFE_STUB;
    // 경로 자체가 훅 (`.../useXxx`) 이면 default import 도 함수여야 함
    const baseDefault = /^use[A-Z]/.test(lastSeg) ? noop : stubComp;
    const target = { __esModule: true, default: baseDefault };
    return new Proxy(target, {
        get(t, prop) {
            if (prop in t) return t[prop];
            if (typeof prop !== 'string') return undefined;
            // 대문자 시작 → 컴포넌트 stub · 그 외 → no-op 함수 (훅/유틸 호출 안전)
            const v = /^[A-Z]/.test(prop) ? stubComp : noop;
            t[prop] = v;   // 동일 export 가 매번 같은 참조이도록 캐시
            return v;
        },
        has() { return true; },
    });
}

function previewRequire(spec) {
    if (REGISTRY[spec]) return REGISTRY[spec];

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

    // @mui/icons-material/<Name> — 부재 시 placeholder
    if (spec.startsWith('@mui/icons-material/')) {
        const stub = makeFallbackIcon(spec);
        REGISTRY[spec] = stub;
        return stub;
    }

    // @wingui/* · @zionex/* — 사전 fetch (preloadDependencies) 도 실패한 경우
    //   Proxy 스텁으로 대체 → named/​default export 무엇을 꺼내도 크래시 없음.
    if (spec.startsWith('@wingui/') || spec.startsWith('@zionex/')) {
        const stub = makeFallbackModule(spec);
        REGISTRY[spec] = stub;
        console.warn('[preview] missing module — substituted proxy stub:', spec);
        return stub;
    }

    // 그 외 미등록 npm 모듈 — 하드 에러(블로킹 모달) 대신 Proxy 스텁으로 대체.
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

function isResolvable(spec) {
    // backend resolver 가 처리 가능한 spec 만 fetch — npm 패키지 명 (react, @mui/...) 제외
    if (!spec) return false;
    if (REGISTRY[spec]) return false;                   // 이미 등록됨
    if (spec.startsWith('@mui/icons-material/')) return false;   // generic stub 으로
    // 원본 wingui src 에서 가져올 후보:
    if (spec.startsWith('@wingui/')) return true;
    if (spec.startsWith('@zionex/wingui-core')) return true;
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
    // wingui 화면이 import 없이 참조하는 비-shim 전역 — wingui-core/component/grid/grid.js
    //   의 export(progressSpinner·exportGridtoExcel) · react-hook-form clearErrors ·
    //   jQuery($). wingui 본 환경은 번들/부트스트랩으로 제공, 미리보기는 안전 stub 으로 보강.
    if (scope.progressSpinner   === undefined) scope.progressSpinner   = '';
    if (scope.exportGridtoExcel === undefined) scope.exportGridtoExcel = () => {};
    if (scope.clearErrors       === undefined) scope.clearErrors       = () => {};
    if (scope.$ === undefined) {
        const jq = function () { return jq; };
        jq.each   = (obj, fn) => { if (obj) Object.keys(obj).forEach((k) => fn(k, obj[k])); return jq; };
        jq.extend = Object.assign;
        jq.ajax   = () => SAFE_STUB;
        jq.fn = {};
        scope.$ = jq;
        scope.jQuery = jq;
    }
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
    const cleaned = viewSub.replace(/\.jsx$/, '');
    const url = '/composer/sessions/' + encodeURIComponent(sessionId)
              + '/preview/source-jsx?view=' + encodeURIComponent(cleaned + '.jsx');

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

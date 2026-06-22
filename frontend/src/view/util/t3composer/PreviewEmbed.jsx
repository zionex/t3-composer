import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import {
    Box, Stack, Typography, CircularProgress, Alert, AlertTitle, Chip,
    Button,
} from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';
import RefreshIcon from '@mui/icons-material/Refresh';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { loadPreviewComponent } from '../../../preview/runtime';
import { useTargetStore } from './targetStore';

// RealGrid license key — main bundle 에 RealGrid module 자체는 끌어오지 않음.
// (cross-document global handler 회피 — BaseGrid shim 도 top-level import 제거).
// 키 값만 import 해서 iframe window 에 직접 set + setLicenseKey 호출.
import REALGRID_LICENSE_KEY from '../../../shim/wingui/common/realgrid-license';

/**
 * 산출물 렌더 오류 포착용 ErrorBoundary — iframe React 루트 안에서 Component 를 감싼다.
 * 'Element type is invalid' · 'xxx is not a function' 등 렌더 중 throw 를 잡아
 * onError 콜백으로 보고 (자동보완 트리거) + iframe 안에 간단 메시지 표시.
 */
class PreviewErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, msg: '' };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, msg: (error && error.message) || String(error) };
    }
    componentDidCatch(error, info) {
        if (this.props.onError) {
            this.props.onError({
                type: 'render',
                message: (error && error.message) || String(error),
                stack: (error && error.stack) || '',
                componentStack: (info && info.componentStack) || '',
            });
        }
    }
    render() {
        if (this.state.hasError) {
            return React.createElement('div', {
                style: {
                    padding: 16, fontFamily: '"Noto Sans KR",system-ui,sans-serif',
                    fontSize: 13, color: '#b91c1c', lineHeight: 1.6,
                },
            }, '화면 렌더 오류: ' + this.state.msg);
        }
        return this.props.children;
    }
}

/**
 * 실행 화면 — 산출물 jsx 를 정식 화면처럼 inline 으로 띄움.
 *
 * 격리 (옵션 A + iframe): webpack dynamic import 제거 + iframe srcdoc 안에서 React 마운트.
 *   - main bundle 의 컴파일 영향 0 (runtime fetch + @babel/standalone)
 *   - main app 의 CSS / MUI theme 충돌 0 (iframe 안 별도 document)
 *   - emotion cache 를 iframe head 로 redirect → MUI 스타일도 격리
 *   - wingui 의 정적 CSS (realgrid 테마, grid 기본, custom override) 를 iframe head 에 inject
 *
 * props:
 *   sessionId : ComposerSession.id (backend raw-source 조회용)
 *   sid8      : 격리 prefix 8자 (표시용)
 *   viewSub   : view 하위 경로
 */
function PreviewEmbed({ sessionId, sid8, viewSub, onError, reloadNonce, autoFixing, autoFixLabel }) {
    const { t } = useTranslation('wizard');
    const [phase, setPhase] = useState('idle');   // 'idle' | 'loading' | 'ready' | 'error'
    const [Comp, setComp] = useState(null);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    const targetCd = useTargetStore((s) => s.currentTargetCd);

    // 오류 보고 — load(transform/execute) · render · runtime 모두 onError 로 전달.
    // load 1회당 첫 오류만 보고 (자동보완 루프가 중복 트리거되지 않도록).
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;
    const reportedRef = useRef(false);
    const reportError = useCallback((info) => {
        if (reportedRef.current) return;
        reportedRef.current = true;
        try { if (onErrorRef.current) onErrorRef.current(info); } catch (_) { /* no-op */ }
    }, []);

    useEffect(() => {
        if (!sessionId || !viewSub) {
            setPhase('idle');
            setComp(null);
            setError(null);
            return undefined;
        }
        let cancelled = false;
        reportedRef.current = false;   // 새 load — 오류 보고 1회 카운터 리셋
        setPhase('loading');
        setError(null);
        setComp(null);
        loadPreviewComponent({ sessionId, viewSub, targetCd })
            .then((loaded) => {
                if (cancelled) return;
                setComp(() => loaded);
                setPhase('ready');
            })
            .catch((e) => {
                if (cancelled) return;
                setError(e);
                setPhase('error');
                reportError({
                    type: 'load',
                    phase: e?.phase,
                    message: e?.message || String(e),
                    stack: e?.cause?.stack || e?.stack || '',
                });
            });
        return () => { cancelled = true; };
    }, [sessionId, viewSub, targetCd, reloadKey, reloadNonce, reportError]);

    // 자동보완 진행 중 — phase 무관 최우선. 오류 화면 대신 진행 상태를 명확히 표시.
    if (autoFixing) {
        return (
            <Box sx={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 2, p: 4, bgcolor: '#fffaf0',
            }}>
                <CircularProgress sx={{ color: '#d97706' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#92400e' }}>
                    🤖 {autoFixLabel || t('previewEmbed.autoFix.label')}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ lineHeight: 1.8 }}>
                    <span dangerouslySetInnerHTML={{ __html: t('previewEmbed.autoFix.body') }} />
                </Typography>
                <Typography variant="caption" sx={{ color: '#a16207' }}>
                    <span dangerouslySetInnerHTML={{ __html: t('previewEmbed.autoFix.chatHint') }} />
                </Typography>
            </Box>
        );
    }

    if (phase === 'idle') {
        return (
            <Box sx={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 2, p: 4, bgcolor: '#f8fafc',
            }}>
                <LaunchIcon sx={{ fontSize: 56, color: '#cbd5e1' }} />
                <Typography variant="body2" color="text.secondary" align="center">
                    <span dangerouslySetInnerHTML={{ __html: t('previewEmbed.idle.hint') }} />
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip label="JSX" size="small" variant="outlined" />
                    <Chip label="SQL" size="small" variant="outlined" />
                    <Chip label="Java Controller / Service" size="small" variant="outlined" />
                </Stack>
            </Box>
        );
    }

    if (phase === 'loading') {
        return (
            <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', gap: 1 }}>
                <CircularProgress />
                <Typography variant="caption" color="text.secondary">{t('previewEmbed.loading')}</Typography>
            </Stack>
        );
    }

    if (phase === 'error') {
        const phaseLabel = error?.phase === 'transform' ? t('previewEmbed.errorPhase.transform')
                         : error?.phase === 'execute' ? t('previewEmbed.errorPhase.execute')
                         : t('previewEmbed.errorPhase.load');
        const causeMsg = error?.cause?.message;
        return (
            <Box sx={{ p: 3, overflow: 'auto', height: '100%' }}>
                <Alert
                    severity="error"
                    action={
                        <Button
                            size="small"
                            color="inherit"
                            startIcon={<RefreshIcon fontSize="small" />}
                            onClick={() => setReloadKey((k) => k + 1)}
                        >
                            {t('previewEmbed.retry')}
                        </Button>
                    }
                >
                    <AlertTitle>{t('previewEmbed.errorTitle', { phase: phaseLabel })}</AlertTitle>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                        {t('previewEmbed.errorPath')} <code>{viewSub}</code>{sid8 ? <> · sid <code>{sid8}</code></> : null}
                    </Typography>
                    <Typography variant="caption" component="pre" sx={{
                        display: 'block', mt: 1, p: 1.2,
                        bgcolor: 'rgba(239,68,68,0.08)', borderRadius: 1,
                        fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                        {error?.message || String(error)}
                        {causeMsg && causeMsg !== error?.message ? t('previewEmbed.errorCause', { cause: causeMsg }) : ''}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                        <span dangerouslySetInnerHTML={{ __html: t('previewEmbed.errorTip') }} />
                    </Typography>
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
            <PreviewIframe Component={Comp} targetCd={targetCd} onReport={reportError} />
        </Box>
    );
}

/**
 * iframe 안에 산출물 React 컴포넌트를 마운트.
 * - emotion CacheProvider 로 MUI 스타일을 iframe head 로 라우팅 (main document 오염 0)
 * - wingui CSS bundle 을 iframe head 에 <style> 로 inject
 */
// wingui 의 theme.js 는 axios / wingui-core/store 등 거대한 dependency chain 을 가져 그대로 가져오기 불가.
// 대신 wingui-core 의 일반적인 createTheme 호출에서 추출한 minimal palette / spacing / typography 로
// MUI Theme 을 만들어 산출물의 styled 컴포넌트들이 wingui 와 유사한 룩으로 그려지도록 한다.
const PREVIEW_THEME = createTheme({
    palette: {
        primary:   { main: '#3b82f6', light: '#60a5fa', dark: '#1d4ed8' },
        secondary: { main: '#475569' },
        success:   { main: '#10b981' },
        warning:   { main: '#f59e0b' },
        error:     { main: '#ef4444' },
        info:      { main: '#06b6d4' },
        background: { default: '#fafafa', paper: '#ffffff' },
        text: { primary: '#334155', secondary: '#64748b', disabled: '#94a3b8' },
        divider: '#e2e8f0',
    },
    typography: {
        fontFamily: '"Noto Sans KR","Malgun Gothic","맑은 고딕",AppleSDGothicNeo-Light,system-ui,sans-serif',
        fontSize: 12,
        button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 4 },
    components: {
        MuiButton: { defaultProps: { disableElevation: true } },
        MuiButtonBase: { defaultProps: { disableRipple: false } },
    },
});

function PreviewIframe({ Component, targetCd, onReport }) {
    const iframeRef = useRef(null);
    const reactRootRef = useRef(null);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe || !Component) return undefined;

        let cancelled = false;
        let cssCleanup = null;

        const setup = async () => {
            const doc = iframe.contentDocument;
            const win = iframe.contentWindow;
            if (!doc || !win) return;

            // about:blank 의 fresh document 로 시작 — srcDoc/sandbox 의 일부 브라우저 제약 회피.
            doc.open();
            doc.write('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>');
            doc.close();

            // 일부 library (RealGrid 등) 가 element.ownerDocument.defaultView 의 API 를 호출.
            // 브라우저/sandbox 조합에 따라 iframe window 의 일부 globals 가 누락될 수 있어
            // main window 의 함수를 polyfill 로 주입.
            const fnPolyfills = [
                'requestAnimationFrame', 'cancelAnimationFrame',
                'requestIdleCallback', 'cancelIdleCallback',
                'getComputedStyle',
                'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
                'matchMedia',
            ];
            fnPolyfills.forEach((k) => {
                if (typeof win[k] !== 'function' && typeof window[k] === 'function') {
                    try { win[k] = window[k].bind(window); } catch (_) {}
                }
            });
            // class / 객체 globals
            ['ResizeObserver', 'MutationObserver', 'IntersectionObserver', 'performance',
             'navigator', 'devicePixelRatio'].forEach((k) => {
                if ((typeof win[k] === 'undefined' || win[k] === null) && typeof window[k] !== 'undefined') {
                    try { win[k] = window[k]; } catch (_) {}
                }
            });
            // RealGrid license — main window 에 import 시 set 되는 window.realGrid2Lic 을
            // iframe window 에도 동일하게 노출. RealGrid 가 license check 시 자동 검출.
            if (window.realGrid2Lic && !win.realGrid2Lic) {
                try { win.realGrid2Lic = window.realGrid2Lic; } catch (_) {}
            }

            // Lite preview 모드 — iframe 안의 zAxios 호출이 mock 응답으로 즉시 처리되게.
            // main app (Composer 자체) 의 zAxios 는 영향 없음 (이 flag 는 iframe window 한정).
            // shim/wingui/common/imports.js 의 zAxios 가 이 flag 를 검사.
            try { win.__PREVIEW_MOCK__ = true; } catch (_) {}
            // [Sample 데이터] — iframe window 에도 sample mode 활성. ComposerWorkspace 는
            //   부모 window 에만 set 하므로 iframe 안의 isSampleModeEnabled() 가 false 가 되어
            //   shim BaseGrid 의 빈 응답 sample 주입·zAxios response interceptor 의 sample 변환
            //   둘 다 OFF → grid 가 빈 row 만 표시되는 사고 회피 (2026-06-11).
            try { win.__composerSampleData = true; } catch (_) {}
            try { win.localStorage && win.localStorage.setItem('composer.sampleData', '1'); } catch (_) {}
            // main window 에도 flag 가 새는지 확인 — runtime registry 의 zAxios 는 main bundle 의
            // 객체이므로 main window 가 보는 flag 가 결과를 결정. 따라서 main window 에도 set.
            // PreviewEmbed unmount 시 cleanup 으로 false 처리.
            window.__PREVIEW_MOCK__ = true;

            // 산출물 런타임 오류 감지 — iframe window 의 error / unhandledrejection.
            //   (ResizeObserver loop · cross-origin Script error 는 양성 → 무시)
            //   ErrorBoundary 가 못 잡는 이벤트핸들러/비동기 throw 를 보완.
            const onWinError = (ev) => {
                const m = (ev && (ev.message || (ev.error && ev.error.message))) || '';
                if (/ResizeObserver loop|Script error/i.test(m)) return;
                if (onReport) onReport({ type: 'runtime', message: m || '런타임 오류',
                                         stack: (ev && ev.error && ev.error.stack) || '' });
            };
            const onWinRejection = (ev) => {
                const r = ev && ev.reason;
                if (onReport) onReport({ type: 'promise',
                    message: (r && (r.message || String(r))) || 'unhandled rejection',
                    stack: (r && r.stack) || '' });
            };
            try {
                win.addEventListener('error', onWinError);
                win.addEventListener('unhandledrejection', onWinRejection);
            } catch (_) { /* no-op */ }

            // body 기본 스타일 reset
            doc.documentElement.style.height = '100%';
            doc.body.style.cssText = 'margin:0;padding:0;height:100%;font-family:"Noto Sans KR",system-ui,sans-serif;';

            // wingui CSS bundle inject — <link rel="stylesheet"> 사용.
            // 이전엔 fetch 후 textContent 로 set 했는데 대용량 텍스트 (>250KB) 의 4개 파일 concat
            // 을 단일 <style> 태그에 넣으면 브라우저 CSS parser 가 첫 파일 끝에서 잘리는 케이스 발생.
            // <link> 는 브라우저 native loader 가 처리해 잘림 / parsing 이슈 0.
            //
            // ★ (2026-05-28) link onload 까지 await — 그렇지 않으면 RealGrid 가 CSS 없이
            //   mount 되어 .rg-root / 체크박스 아이콘 / zebra 등 테마 미적용 사고.
            //   CSS 가 늦게 도착해도 RealGrid 는 자체 측정값을 재계산하지 않아 unstyled 그대로.
            if (!targetCd) {
                // eslint-disable-next-line no-console
                console.warn('[PreviewEmbed] targetCd 없음 — useTargetStore.currentTargetCd 가 null. '
                          + 'CSS bundle 이 빈 응답 → realgrid 테마 미적용. '
                          + '상단 TargetSystemSelector 에서 Target 선택 필요.');
            }
            // 진단 로그 — Network 탭의 link 요청이 안 보이는 경우 setup 도달 여부 확인용 (2026-05-28)
            // eslint-disable-next-line no-console
            console.info('[PreviewEmbed] iframe setup 진입 · targetCd=' + (targetCd || '(없음)')
                       + ' · CSS link inject 시작');
            let cssOutcome = 'unknown';
            try {
                const url = '/composer/preview/css' + (targetCd ? '?targetCd=' + encodeURIComponent(targetCd) : '');
                const linkEl = doc.createElement('link');
                linkEl.setAttribute('data-preview-bundle', 'true');
                linkEl.rel = 'stylesheet';
                linkEl.type = 'text/css';
                linkEl.href = url;
                const cssStart = performance.now();
                const cssLoaded = new Promise((resolve) => {
                    linkEl.onload  = () => resolve('loaded');
                    linkEl.onerror = () => resolve('error');
                    setTimeout(() => resolve('timeout'), 3000);
                });
                doc.head.appendChild(linkEl);
                cssOutcome = await cssLoaded;
                // CSS link 가 loaded 되었어도 sheet 적용 자체가 실패하면 rules.length=0
                let rulesCount = -1;
                try {
                    rulesCount = linkEl.sheet ? (linkEl.sheet.cssRules ? linkEl.sheet.cssRules.length : -2) : -3;
                } catch (e) { rulesCount = -4; /* CORS 등 */ }
                // .rg-root / .rg-header / .realgrid 선택자가 stylesheet 안에 있는지 확인
                let rgRootRule = false, rgHeaderRule = false, realgridRule = false;
                try {
                    if (linkEl.sheet && linkEl.sheet.cssRules) {
                        for (let i = 0; i < linkEl.sheet.cssRules.length; i++) {
                            const sel = linkEl.sheet.cssRules[i].selectorText || '';
                            if (sel.includes('.rg-root'))    rgRootRule = true;
                            if (sel.includes('.rg-header'))  rgHeaderRule = true;
                            if (sel === '.realgrid' || sel.startsWith('.realgrid '))
                                                             realgridRule = true;
                            if (rgRootRule && rgHeaderRule && realgridRule) break;
                        }
                    }
                } catch (_) {}
                // eslint-disable-next-line no-console
                console.info('[PreviewEmbed] CSS link result=' + cssOutcome
                           + ' · elapsed=' + Math.round(performance.now() - cssStart) + 'ms'
                           + ' · rules=' + rulesCount
                           + ' · has(.rg-root)=' + rgRootRule
                           + ' · has(.rg-header)=' + rgHeaderRule
                           + ' · has(.realgrid)=' + realgridRule
                           + ' · href=' + linkEl.href);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('[PreviewEmbed] CSS link inject 실패', e);
            }

            if (cancelled) return;

            // RealGrid UMD bundle inject — iframe window 에 RealGrid global 등록.
            // ★ 순서가 중요: UMD inline <script> 는 append 즉시 동기 실행되며 그 시점에
            //   license check 발동. window.realGrid2Lic 가 먼저 set 되어 있어야 통과.
            try {
                const umdUrl = '/composer/preview/realgrid-umd'
                             + (targetCd ? '?targetCd=' + encodeURIComponent(targetCd) : '');
                const umdStart = performance.now();
                const umdRes = await fetch(umdUrl, { cache: 'force-cache' });
                if (cancelled) return;
                // eslint-disable-next-line no-console
                console.info('[PreviewEmbed] RealGrid UMD fetch status=' + umdRes.status
                           + ' · elapsed=' + Math.round(performance.now() - umdStart) + 'ms');
                if (umdRes.ok) {
                    const umdSrc = await umdRes.text();
                    try { win.realGrid2Lic = REALGRID_LICENSE_KEY; } catch (_) {}
                    const scriptEl = doc.createElement('script');
                    scriptEl.setAttribute('data-preview-realgrid', 'true');
                    scriptEl.textContent = umdSrc;
                    doc.head.appendChild(scriptEl);
                    try {
                        if (win.RealGrid && typeof win.RealGrid.setLicenseKey === 'function') {
                            win.RealGrid.setLicenseKey(REALGRID_LICENSE_KEY);
                        }
                    } catch (_) {}
                    // eslint-disable-next-line no-console
                    console.info('[PreviewEmbed] RealGrid UMD inject 완료'
                               + ' · win.RealGrid=' + (typeof win.RealGrid)
                               + ' · GridView=' + (typeof (win.RealGrid && win.RealGrid.GridView)));
                } else {
                    // eslint-disable-next-line no-console
                    console.warn('[PreviewEmbed] RealGrid UMD 응답 비정상 — grid 가 unstyled 일 수 있음');
                }
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('[PreviewEmbed] RealGrid UMD inject 실패', e);
            }

            if (cancelled) return;

            // mount root container
            const container = doc.body.querySelector('#preview-root') || (() => {
                const d = doc.createElement('div');
                d.id = 'preview-root';
                d.style.cssText = 'width:100%;height:100%;';
                doc.body.appendChild(d);
                return d;
            })();

            // emotion cache — iframe head 로 redirect.
            // ★ prepend: true — emotion 이 head 의 **시작** 부분에 style 들을 inject.
            //   그러면 우리가 setup 시점에 append 한 link[data-preview-bundle] 가 head 의
            //   더 뒤에 위치 → CSS cascade 우선 적용.
            //   prepend: false 였을 때 — emotion 의 188개 style 태그가 link 뒤에 와서
            //   같은 specificity 의 .rg-header / .rg-root 룰을 emotion 이 override (
            //   MUI 자체 룰이 직접 .rg-* 를 건드리진 않지만 reset 류 룰이 background:
            //   transparent 등을 부수적으로 적용). 결과적으로 grid 헤더가 unstyled 회색.
            const cache = createCache({
                key: 'preview-css',
                container: doc.head,
                prepend: true,
            });

            // unmount 이전 root (재 mount 시)
            if (reactRootRef.current) {
                try { reactRootRef.current.unmount(); } catch (_) {}
                reactRootRef.current = null;
            }

            const root = ReactDOM.createRoot(container);
            reactRootRef.current = root;
            root.render(
                React.createElement(CacheProvider, { value: cache },
                    React.createElement(ThemeProvider, { theme: PREVIEW_THEME },
                        React.createElement(PreviewErrorBoundary, { onError: onReport },
                            React.createElement(Component)
                        )
                    )
                )
            );

            // mount 직후 DOM 검증 — RealGrid 가 .rg-root / .rg-header div 를 만들었는지
            // + .realgrid wrapper className 이 붙었는지 + computed style 의 background.
            // RealGrid 가 비동기로 그리기 때문에 1초 wait.
            setTimeout(() => {
                try {
                    const realgridDivs = doc.querySelectorAll('.realgrid');
                    const rgRoots = doc.querySelectorAll('.rg-root');
                    const rgHeaders = doc.querySelectorAll('.rg-header');
                    let bgColor = '';
                    if (rgHeaders.length > 0) {
                        bgColor = win.getComputedStyle(rgHeaders[0]).backgroundColor;
                    }
                    // head 의 link/style 카운트
                    const links = doc.head.querySelectorAll('link[data-preview-bundle]');
                    const styles = doc.head.querySelectorAll('style');
                    // eslint-disable-next-line no-console
                    console.info('[PreviewEmbed] mount 1s 검증 ·'
                               + ' .realgrid count=' + realgridDivs.length
                               + ' · .rg-root count=' + rgRoots.length
                               + ' · .rg-header count=' + rgHeaders.length
                               + ' · rg-header bg=' + (bgColor || 'N/A')
                               + ' · head link[preview-bundle] count=' + links.length
                               + ' · head style count=' + styles.length);
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.warn('[PreviewEmbed] mount 검증 실패', e);
                }
            }, 1000);

            cssCleanup = () => {
                // React 18 — useEffect cleanup 은 commit phase 에서 동기 실행되므로
                // root.unmount() 를 직접 부르면 "synchronously unmount a root while
                // React was already rendering" warning + race condition 위험.
                // ref 는 즉시 비우고 unmount 만 microtask 로 deferred — 진행 중 render
                // 가 commit 끝낸 뒤 다음 tick 에서 안전하게 unmount.
                const oldRoot = reactRootRef.current;
                reactRootRef.current = null;
                try { win.removeEventListener('error', onWinError); } catch (_) {}
                try { win.removeEventListener('unhandledrejection', onWinRejection); } catch (_) {}
                // mock flag 복구 — Composer 자체 화면의 zAxios 호출에 영향 안 가도록.
                try { window.__PREVIEW_MOCK__ = false; } catch (_) {}
                if (oldRoot) {
                    queueMicrotask(() => {
                        try { oldRoot.unmount(); } catch (_) {}
                    });
                }
            };
        };

        // about:blank 시 contentDocument 는 즉시 available — onload 대기 불필요.
        setup();

        return () => {
            cancelled = true;
            if (cssCleanup) cssCleanup();
        };
    }, [Component, targetCd]);

    return (
        <iframe
            ref={iframeRef}
            title="preview"
            style={{ flex: 1, width: '100%', height: '100%', border: 0, display: 'block' }}
        />
    );
}

export default PreviewEmbed;

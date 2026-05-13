import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
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
function PreviewEmbed({ sessionId, sid8, viewSub }) {
    const [phase, setPhase] = useState('idle');   // 'idle' | 'loading' | 'ready' | 'error'
    const [Comp, setComp] = useState(null);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    const targetCd = useTargetStore((s) => s.currentTargetCd);

    useEffect(() => {
        if (!sessionId || !viewSub) {
            setPhase('idle');
            setComp(null);
            setError(null);
            return undefined;
        }
        let cancelled = false;
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
            });
        return () => { cancelled = true; };
    }, [sessionId, viewSub, targetCd, reloadKey]);

    if (phase === 'idle') {
        return (
            <Box sx={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 2, p: 4, bgcolor: '#f8fafc',
            }}>
                <LaunchIcon sx={{ fontSize: 56, color: '#cbd5e1' }} />
                <Typography variant="body2" color="text.secondary" align="center">
                    헤더의 <b>[화면 실행]</b> 버튼을 누르면<br />
                    이 자리에 실제 운영되는 형태의 화면이 표시됩니다.
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
                <Typography variant="caption" color="text.secondary">화면 로드 중...</Typography>
            </Stack>
        );
    }

    if (phase === 'error') {
        const phaseLabel = error?.phase === 'transform' ? 'JSX 변환'
                         : error?.phase === 'execute' ? '모듈 실행'
                         : '화면 로드';
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
                            다시 시도
                        </Button>
                    }
                >
                    <AlertTitle>{phaseLabel} 실패</AlertTitle>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                        경로: <code>{viewSub}</code>{sid8 ? <> · sid <code>{sid8}</code></> : null}
                    </Typography>
                    <Typography variant="caption" component="pre" sx={{
                        display: 'block', mt: 1, p: 1.2,
                        bgcolor: 'rgba(239,68,68,0.08)', borderRadius: 1,
                        fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                        {error?.message || String(error)}
                        {causeMsg && causeMsg !== error?.message ? '\n\n원인: ' + causeMsg : ''}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                        💡 산출물 소스는 우측의 <b>[아티팩트 소스]</b> 탭에서 그대로 검토할 수 있습니다.
                        격리되어 있어 이 에러가 다른 화면에는 영향을 주지 않습니다.
                    </Typography>
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
            <PreviewIframe Component={Comp} targetCd={targetCd} />
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

function PreviewIframe({ Component, targetCd }) {
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
            // main window 에도 flag 가 새는지 확인 — runtime registry 의 zAxios 는 main bundle 의
            // 객체이므로 main window 가 보는 flag 가 결과를 결정. 따라서 main window 에도 set.
            // PreviewEmbed unmount 시 cleanup 으로 false 처리.
            window.__PREVIEW_MOCK__ = true;

            // body 기본 스타일 reset
            doc.documentElement.style.height = '100%';
            doc.body.style.cssText = 'margin:0;padding:0;height:100%;font-family:"Noto Sans KR",system-ui,sans-serif;';

            // wingui CSS bundle inject — <link rel="stylesheet"> 사용.
            // 이전엔 fetch 후 textContent 로 set 했는데 대용량 텍스트 (>250KB) 의 4개 파일 concat
            // 을 단일 <style> 태그에 넣으면 브라우저 CSS parser 가 첫 파일 끝에서 잘리는 케이스 발생.
            // <link> 는 브라우저 native loader 가 처리해 잘림 / parsing 이슈 0.
            try {
                const url = '/composer/preview/css' + (targetCd ? '?targetCd=' + encodeURIComponent(targetCd) : '');
                const linkEl = doc.createElement('link');
                linkEl.setAttribute('data-preview-bundle', 'true');
                linkEl.rel = 'stylesheet';
                linkEl.type = 'text/css';
                linkEl.href = url;
                doc.head.appendChild(linkEl);
            } catch (_) { /* CSS 실패는 무시 — 화면 자체는 떠야 함 */ }

            if (cancelled) return;

            // RealGrid UMD bundle inject — iframe window 에 RealGrid global 등록.
            // ★ 순서가 중요: UMD inline <script> 는 append 즉시 동기 실행되며 그 시점에
            //   license check 발동. window.realGrid2Lic 가 먼저 set 되어 있어야 통과.
            try {
                const umdUrl = '/composer/preview/realgrid-umd'
                             + (targetCd ? '?targetCd=' + encodeURIComponent(targetCd) : '');
                const umdRes = await fetch(umdUrl, { cache: 'force-cache' });
                if (cancelled) return;
                if (umdRes.ok) {
                    const umdSrc = await umdRes.text();
                    // (1) license 를 UMD 실행 전 iframe window 에 미리 set
                    try { win.realGrid2Lic = REALGRID_LICENSE_KEY; } catch (_) {}
                    // (2) UMD inline script — append 즉시 동기 실행. 이 시점에 license auto-detect.
                    const scriptEl = doc.createElement('script');
                    scriptEl.setAttribute('data-preview-realgrid', 'true');
                    scriptEl.textContent = umdSrc;
                    doc.head.appendChild(scriptEl);
                    // (3) 추가 안전망 — RealGrid.setLicenseKey 명시 호출
                    try {
                        if (win.RealGrid && typeof win.RealGrid.setLicenseKey === 'function') {
                            win.RealGrid.setLicenseKey(REALGRID_LICENSE_KEY);
                        }
                    } catch (_) { /* no-op */ }
                }
            } catch (_) { /* RealGrid 실패는 BaseGrid 가 placeholder 표시 */ }

            if (cancelled) return;

            // mount root container
            const container = doc.body.querySelector('#preview-root') || (() => {
                const d = doc.createElement('div');
                d.id = 'preview-root';
                d.style.cssText = 'width:100%;height:100%;';
                doc.body.appendChild(d);
                return d;
            })();

            // emotion cache — iframe head 로 redirect
            const cache = createCache({
                key: 'preview-css',
                container: doc.head,
                prepend: false,
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
                        React.createElement(Component)
                    )
                )
            );

            cssCleanup = () => {
                try {
                    if (reactRootRef.current) {
                        reactRootRef.current.unmount();
                        reactRootRef.current = null;
                    }
                } catch (_) {}
                // mock flag 복구 — Composer 자체 화면의 zAxios 호출에 영향 안 가도록.
                try { window.__PREVIEW_MOCK__ = false; } catch (_) {}
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

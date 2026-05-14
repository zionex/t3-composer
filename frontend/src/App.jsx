import React, { useState, useCallback, useEffect } from 'react';
import { Switch, Route } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Button, Tabs, Tab, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import T3Composer from './view/util/t3composer/T3Composer';
import T3ComposerPatterns from './view/util/t3composerpatterns/T3ComposerPatterns';
import T3ComposerDict from './view/util/t3composerdict/T3ComposerDict';
import T3ComposerHistory from './view/util/t3composerhistory/T3ComposerHistory';
import PreviewLoader from './view/util/preview/PreviewLoader';
import { ShowMessageHost } from '@wingui/common/imports';

/**
 * T3Composer 단독 환경 라우팅.
 *
 * 메뉴 (AppBar) 클릭 → Tab Container 안에 새 Tab 으로 화면 추가.
 *   - 이미 열린 Tab 이면 활성화만, 없으면 새 Tab 추가
 *   - Tab 헤더의 × 버튼으로 닫기 (마지막 Tab 은 닫을 수 없음)
 *   - 메인은 초기 진입 시 1개 자동 오픈
 *   - 한 번 열린 Tab 은 닫기 전까지 mount 유지 (display 토글) — 세션 상태 보존
 *
 * `/preview/...` URL 은 별도 라우트 — 산출물 화면 lazy load (PreviewLoader 사용)
 */
const MENU_ITEMS = [
    { key: 'composer', label: 'T3Composer', Component: T3Composer },
    { key: 'history',  label: '이력',       Component: T3ComposerHistory },
    { key: 'patterns', label: '패턴',       Component: T3ComposerPatterns },
    { key: 'dict',     label: '갤러리',     Component: T3ComposerDict },
];

function findMenu(key) { return MENU_ITEMS.find((m) => m.key === key); }

function TabbedHome() {
    // 초기 — 메인 Tab 만 열려 있음
    const [openTabs, setOpenTabs] = useState([MENU_ITEMS[0].key]);
    const [activeKey, setActiveKey] = useState(MENU_ITEMS[0].key);

    const openTab = useCallback((key) => {
        setOpenTabs((prev) => (prev.includes(key) ? prev : [...prev, key]));
        setActiveKey(key);
    }, []);

    // 외부에서 Tab 활성화 요청 — 이력의 [이어하기] 등이 dispatch
    useEffect(() => {
        const h = (e) => {
            const key = e?.detail?.key;
            if (key && findMenu(key)) openTab(key);
        };
        window.addEventListener('t3composer:openTab', h);
        return () => window.removeEventListener('t3composer:openTab', h);
    }, [openTab]);

    const closeTab = useCallback((key) => {
        setOpenTabs((prev) => {
            if (prev.length <= 1) return prev;   // 마지막 Tab 은 닫지 않음
            const idx = prev.indexOf(key);
            if (idx < 0) return prev;
            const next = prev.filter((k) => k !== key);
            // 닫는 Tab 이 활성이면 인접 Tab 으로 활성 이동
            setActiveKey((cur) => (cur === key ? (next[idx] || next[idx - 1] || next[0]) : cur));
            return next;
        });
    }, []);

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* 상단 메뉴 바 */}
            <AppBar position="static" color="default" elevation={1} sx={{ flex: '0 0 auto' }}>
                <Toolbar variant="dense" sx={{ minHeight: 40 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 4 }}>
                        T3Composer (Standalone)
                    </Typography>
                    {MENU_ITEMS.map((m) => (
                        <Button
                            key={m.key}
                            size="small"
                            color="inherit"
                            onClick={() => openTab(m.key)}
                            sx={{ fontWeight: 600 }}
                        >
                            {m.label}
                        </Button>
                    ))}
                </Toolbar>
            </AppBar>

            {/* Tab 헤더 */}
            <Box sx={{ flex: '0 0 auto', bgcolor: '#fff', borderBottom: '1px solid #e0e0e0' }}>
                <Tabs
                    value={activeKey}
                    onChange={(_e, v) => setActiveKey(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        minHeight: 36,
                        '& .MuiTab-root': {
                            minHeight: 36, py: 0, px: 1.5,
                            fontSize: 13, textTransform: 'none', fontWeight: 500,
                        },
                    }}
                >
                    {openTabs.map((key) => {
                        const m = findMenu(key);
                        if (!m) return null;
                        const isLast = openTabs.length === 1;
                        return (
                            <Tab
                                key={key}
                                value={key}
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <span>{m.label}</span>
                                        <IconButton
                                            component="div"
                                            role="button"
                                            tabIndex={0}
                                            size="small"
                                            disabled={isLast}
                                            onClick={(e) => { e.stopPropagation(); closeTab(key); }}
                                            sx={{
                                                p: 0.2, ml: 0.5,
                                                visibility: isLast ? 'hidden' : 'visible',
                                                '&:hover': { bgcolor: 'rgba(0,0,0,0.08)' },
                                            }}
                                        >
                                            <CloseIcon sx={{ fontSize: 14 }} />
                                        </IconButton>
                                    </Box>
                                }
                            />
                        );
                    })}
                </Tabs>
            </Box>

            {/* Tab Content — 열린 Tab 들은 항상 mount, display 만 토글 (상태 보존) */}
            <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {openTabs.map((key) => {
                    const m = findMenu(key);
                    if (!m) return null;
                    const C = m.Component;
                    return (
                        <Box
                            key={key}
                            sx={{
                                position: 'absolute', inset: 0,
                                display: activeKey === key ? 'flex' : 'none',
                                flexDirection: 'column', overflow: 'hidden',
                            }}
                        >
                            <C />
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}

export default function App() {
    return (
        <Box sx={{ height: '100%' }}>
            <Switch>
                <Route path="/preview/" component={PreviewLoader} />
                <Route path="/" component={TabbedHome} />
            </Switch>
            <ShowMessageHost />
        </Box>
    );
}

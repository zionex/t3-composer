import React, { useState, useCallback, useEffect } from 'react';
import { Switch, Route } from 'react-router-dom';
import { Box, Typography, Tabs, Tab, IconButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HistoryIcon from '@mui/icons-material/History';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import WidgetsIcon from '@mui/icons-material/Widgets';

import Logo from './Logo';
import T3Composer from './view/util/t3composer/T3Composer';
import T3mesPatternCatalog from './view/util/t3composerpatterns/T3mesPatternCatalog';
import T3ComposerDict from './view/util/t3composerdict/T3ComposerDict';
import T3ComposerHistory from './view/util/t3composerhistory/T3ComposerHistory';
import T3Mockup from './view/util/t3mockup/T3Mockup';
import PreviewLoader from './view/util/preview/PreviewLoader';
import { ShowMessageHost } from '@wingui/common/imports';

/**
 * T3Composer 단독 환경 라우팅.
 *
 * 좌측 Layer (접이식 사이드바) — 로고 + 프로그램명 + 리본 메뉴(아이콘+라벨).
 *   - 메뉴 클릭 → 우측 Tab Container 안에 새 Tab 추가 (이미 열려 있으면 활성화만)
 *   - 사이드바 접기 토글 → 아이콘만 남는 얇은 리본으로 축소 (이름은 Tooltip)
 *   - Tab 헤더의 × 버튼으로 닫기 (마지막 Tab 은 닫을 수 없음)
 *   - 한 번 열린 Tab 은 닫기 전까지 mount 유지 (display 토글) — 세션 상태 보존
 *
 * /preview/<sessionId>/<viewSub> 라우트 — 산출물 화면 새 창에서 단독 표시 (PreviewLoader).
 */
const MENU_ITEMS = [
    { key: 'composer', label: 'Composer',      Icon: AutoAwesomeIcon,        hint: 'AI 화면 생성 — 자연어·복사·설계서 기반 신규 / 기존 화면 수정', Component: T3Composer },
    { key: 'history',  label: 'History',       Icon: HistoryIcon,            hint: '작업 이력 — 진행·완료·보관 세션 조회 및 이어하기',           Component: T3ComposerHistory },
    { key: 'mockup',   label: 'SCM UI Mockup', Icon: DashboardCustomizeIcon, hint: 'SCM UI Mockup 패턴 갤러리 — 화면 목업 카탈로그',             Component: T3Mockup },
    { key: 'patterns', label: 'UI Pattern',    Icon: ViewQuiltIcon,          hint: 'T3MES UI 패턴 카탈로그 — MES/SCM 도메인별 화면 패턴',         Component: T3mesPatternCatalog },
    { key: 'dict',     label: 'Gallery',       Icon: WidgetsIcon,            hint: 'Composer 갤러리 — Grid·Chart·KPI 사전',                      Component: T3ComposerDict },
];

const SIDEBAR_W           = 212;
const SIDEBAR_W_COLLAPSED = 56;

function findMenu(key) { return MENU_ITEMS.find((m) => m.key === key); }

function TabbedHome() {
    // 초기 — 메인 Tab 만 열려 있음
    const [openTabs, setOpenTabs] = useState([MENU_ITEMS[0].key]);
    const [activeKey, setActiveKey] = useState(MENU_ITEMS[0].key);
    // 좌측 사이드바 접힘 상태
    const [collapsed, setCollapsed] = useState(false);

    const openTab = useCallback((key) => {
        setOpenTabs((prev) => (prev.includes(key) ? prev : [...prev, key]));
        setActiveKey(key);
    }, []);

    const handleLogoClick = useCallback(() => {
        // Composer Tab 활성화 — 닫혀 있으면 열고, 열려 있으면 active 만 전환
        openTab('composer');
        // T3Composer 에 reset 신호 전달 — listener 가 mode !== null 이면 confirm
        window.dispatchEvent(new CustomEvent('t3composer:resetToHome'));
    }, [openTab]);

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
            setActiveKey((cur) => (cur === key ? (next[idx] || next[idx - 1] || next[0]) : cur));
            return next;
        });
    }, []);

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'row' }}>
            {/* ===== 좌측 Layer — 로고 + 리본 메뉴 (접이식 사이드바) ===== */}
            <Box
                component="nav"
                sx={{
                    width: collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W,
                    flexShrink: 0,
                    display: 'flex', flexDirection: 'column',
                    bgcolor: 'rgba(255,255,255,0.62)',
                    backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                    borderRight: '1px solid', borderColor: 'divider',
                    boxShadow: '4px 0 16px -12px rgba(58,74,99,0.30)',
                    transition: 'width 0.2s ease',
                    overflow: 'hidden',
                }}
            >
                {/* 로고 + 프로그램명 + 접기 토글 */}
                <Tooltip title="Composer 홈으로 — 모드 선택 화면" placement="right">
                    <Box
                        role="button"
                        tabIndex={0}
                        aria-label="Composer 홈으로"
                        onClick={handleLogoClick}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleLogoClick();
                            }
                        }}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 1,
                            px: collapsed ? 0 : 1.5, py: 1.2, minHeight: 52,
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            borderBottom: '1px solid', borderColor: 'divider',
                            cursor: 'pointer',
                            transition: 'background-color .15s ease',
                            '&:hover': { bgcolor: 'rgba(124,167,224,0.10)' },
                            '&:focus-visible': {
                                outline: '2px solid',
                                outlineColor: 'primary.main',
                                outlineOffset: '-2px',
                            },
                        }}
                    >
                        <Box sx={{ display: 'flex' }}>
                            <Logo size={collapsed ? 30 : 28} />
                        </Box>
                        {!collapsed && (
                            <>
                                <Typography component="div" sx={{
                                    flex: 1, fontSize: '0.92rem', fontWeight: 800,
                                    color: 'primary.dark', letterSpacing: '-0.3px', whiteSpace: 'nowrap',
                                }}>
                                    T3Composer
                                    <Box component="span" sx={{
                                        fontSize: '0.62rem', fontWeight: 600, color: 'text.secondary', ml: 0.5,
                                    }}>
                                        v1.0
                                    </Box>
                                </Typography>
                                <Tooltip title="메뉴 접기">
                                    <IconButton
                                        size="small"
                                        onClick={(e) => { e.stopPropagation(); setCollapsed(true); }}
                                        sx={{ color: 'text.secondary' }}
                                    >
                                        <KeyboardDoubleArrowLeftIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </>
                        )}
                    </Box>
                </Tooltip>
                {collapsed && (
                    <Box sx={{
                        display: 'flex', justifyContent: 'center', py: 0.4,
                        borderBottom: '1px solid', borderColor: 'divider',
                    }}>
                        <Tooltip title="메뉴 펼치기" placement="right">
                            <IconButton size="small" onClick={() => setCollapsed(false)}
                                        sx={{ color: 'text.secondary' }}>
                                <KeyboardDoubleArrowRightIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}

                {/* 리본 메뉴 — 아이콘 + 라벨 */}
                <Box sx={{
                    flex: 1, overflowY: 'auto', overflowX: 'hidden',
                    py: 1, px: collapsed ? 0.6 : 1,
                    display: 'flex', flexDirection: 'column', gap: 0.4,
                }}>
                    {MENU_ITEMS.map((m) => {
                        const isActive = activeKey === m.key && openTabs.includes(m.key);
                        const Icon = m.Icon;
                        return (
                            <Tooltip
                                key={m.key}
                                title={collapsed ? `${m.label} — ${m.hint}` : m.hint}
                                placement="right"
                            >
                                <Box
                                    onClick={() => openTab(m.key)}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 1.2,
                                        px: collapsed ? 0 : 1.2, py: 0.9,
                                        justifyContent: collapsed ? 'center' : 'flex-start',
                                        borderRadius: 2, cursor: 'pointer',
                                        color: isActive ? 'primary.dark' : 'text.secondary',
                                        bgcolor: isActive ? 'rgba(124,167,224,0.20)' : 'transparent',
                                        fontWeight: isActive ? 700 : 500,
                                        transition: 'background-color .15s ease, color .15s ease',
                                        '&:hover': {
                                            bgcolor: isActive ? 'rgba(124,167,224,0.26)' : 'rgba(124,167,224,0.10)',
                                            color: 'primary.dark',
                                        },
                                    }}
                                >
                                    <Icon fontSize="small" />
                                    {!collapsed && (
                                        <Typography sx={{
                                            fontSize: '0.8rem', fontWeight: 'inherit',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>
                                            {m.label}
                                        </Typography>
                                    )}
                                </Box>
                            </Tooltip>
                        );
                    })}
                </Box>
            </Box>

            {/* ===== 우측 — Tab 헤더 + 콘텐츠 ===== */}
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                {/* Tab 헤더 — 글래스 보드 + 입체 탭 칩 */}
                <Box sx={{
                    flex: '0 0 auto',
                    px: 1, pt: 0.9,
                    bgcolor: 'rgba(255,255,255,0.52)',
                    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                    borderBottom: '1px solid', borderColor: 'divider',
                    boxShadow: '0 6px 16px -10px rgba(58,74,99,0.30), '
                             + '0 1px 0 rgba(255,255,255,0.75) inset',
                }}>
                    <Tabs
                        value={activeKey}
                        onChange={(_e, v) => setActiveKey(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            minHeight: 38,
                            // 입체 탭이라 하단 인디케이터 라인은 숨김
                            '& .MuiTabs-indicator': { display: 'none' },
                            '& .MuiTab-root': {
                                minHeight: 34, py: 0, px: 1.8, mr: 0.6,
                                borderRadius: '9px 9px 0 0',
                                border: '1px solid rgba(124,167,224,0.30)',
                                borderBottom: 'none',
                                bgcolor: 'rgba(255,255,255,0.42)',
                                boxShadow: '0 -1px 0 rgba(255,255,255,0.5) inset',
                                transition: 'all .15s ease',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.68)' },
                            },
                            // 활성 탭 — 보드 위로 솟은 입체감
                            '& .MuiTab-root.Mui-selected': {
                                color: 'primary.dark',
                                bgcolor: 'rgba(255,255,255,0.94)',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 -4px 12px -3px rgba(58,74,99,0.22), '
                                         + '0 1px 0 rgba(255,255,255,0.95) inset',
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
                                                    '&:hover': { bgcolor: 'rgba(124,167,224,0.18)' },
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

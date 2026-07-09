import React, { useState, useCallback, useEffect } from 'react';
import { Switch, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Tabs, Tab, IconButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined';
import SchemaOutlinedIcon from '@mui/icons-material/SchemaOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';

import Logo from './Logo';
import t3ComposerWordmark from './assets/T3Composer_logo_b.png';
import LanguageSwitcher from './view/util/t3composer/LanguageSwitcher';
import { PALETTE, TYPOGRAPHY } from './theme';
import T3Composer from './view/util/t3composer/T3Composer';
import T3mesPatternCatalog from './view/util/t3composerpatterns/T3mesPatternCatalog';
import T3ComposerDict from './view/util/t3composerdict/T3ComposerDict';
import T3ComposerHistory from './view/util/t3composerhistory/T3ComposerHistory';
import T3Dashboard from './view/util/t3dashboard/T3Dashboard';
import T3Mockup from './view/util/t3mockup/T3Mockup';
import OntologyPage from './view/util/t3composer/ontology/OntologyPage';
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

// INSIGHT_ENABLED — false 시 Dashboard 메뉴 숨김
const INSIGHT_ENABLED = process.env.INSIGHT_ENABLED === 'true';

const MENU_ITEMS = [
    { key: 'composer', labelKey: 'app.menu.composer',    hintKey: 'app.menuHint.composer',    Icon: AutoAwesomeOutlinedIcon,  Component: T3Composer },
    { key: 'history',  labelKey: 'app.menu.history',     hintKey: 'app.menuHint.history',     Icon: HistoryOutlinedIcon,      Component: T3ComposerHistory },
    { key: 'mockup',   labelKey: 'app.menu.scmUiMockup', hintKey: 'app.menuHint.scmUiMockup', Icon: GridViewOutlinedIcon,     Component: T3Mockup },
    { key: 'patterns', labelKey: 'app.menu.uiPattern',   hintKey: 'app.menuHint.uiPattern',   Icon: DashboardOutlinedIcon,    Component: T3mesPatternCatalog },
    // { key: 'dict',     labelKey: 'app.menu.gallery',     hintKey: 'app.menuHint.gallery',     Icon: WidgetsOutlinedIcon,    Component: T3ComposerDict },
    { key: 'ontology', labelKey: 'app.menu.ontology',    hintKey: 'app.menuHint.ontology',    Icon: SchemaOutlinedIcon,       Component: OntologyPage },
    ...(INSIGHT_ENABLED ? [
    { key: 'dashboard', labelKey: 'app.menu.dashboard',  hintKey: 'app.menuHint.dashboard',   Icon: InsertChartOutlinedIcon,  Component: T3Dashboard },
    ] : []),
];

const SIDEBAR_W           = 212;
const SIDEBAR_W_COLLAPSED = 56;

function findMenu(key) { return MENU_ITEMS.find((m) => m.key === key); }

function TabbedHome() {
    const { t } = useTranslation();
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
            {/* ===== 좌측 Layer — 로고 + 리본 메뉴 (접이식 사이드바) — A시안 흰 톤 ===== */}
            <Box
                component="nav"
                sx={{
                    width: collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W,
                    flexShrink: 0,
                    display: 'flex', flexDirection: 'column',
                    bgcolor: '#FFFFFF',
                    borderRight: `1px solid ${PALETTE.panelBorder}`,
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
                            borderBottom: `1px solid ${PALETTE.panelBorder}`,
                            cursor: 'pointer',
                            transition: 'background-color .15s ease',
                            '&:hover': { bgcolor: PALETTE.primarySoft },
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
                                <Box
                                    component="img"
                                    src={t3ComposerWordmark}
                                    alt="T³Composer"
                                    sx={{ flex: 1, height: 17, width: 'auto', objectFit: 'contain', objectPosition: 'left center', display: 'block' }}
                                />
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
                        borderBottom: `1px solid ${PALETTE.panelBorder}`,
                    }}>
                        <Tooltip title="메뉴 펼치기" placement="right">
                            <IconButton size="small" onClick={() => setCollapsed(false)}
                                        sx={{ color: 'text.secondary' }}>
                                <KeyboardDoubleArrowRightIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}

                {/* 리본 메뉴 — A시안: MENU eyebrow + 활성 PALETTE.primarySoft + PALETTE.primary (aqua-60) */}
                <Box sx={{
                    flex: 1, overflowY: 'auto', overflowX: 'hidden',
                    py: 1, px: collapsed ? 0.6 : 1,
                    display: 'flex', flexDirection: 'column', gap: 0.2,
                }}>
                    {!collapsed && (
                        <Typography sx={{
                            fontSize: 10, fontWeight: 600,
                            letterSpacing: '0.12em', color: PALETTE.textMuted,
                            px: 1.2, pt: 1, pb: 0.6,
                        }}>
                            MENU
                        </Typography>
                    )}
                    {MENU_ITEMS.map((m) => {
                        const isActive = activeKey === m.key && openTabs.includes(m.key);
                        const Icon = m.Icon;
                        const label = t(m.labelKey);
                        const hint  = t(m.hintKey);
                        return (
                            <Tooltip
                                key={m.key}
                                title={collapsed ? `${label} — ${hint}` : hint}
                                placement="right"
                            >
                                <Box
                                    onClick={() => openTab(m.key)}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 1.2,
                                        px: collapsed ? 0 : 1.2,
                                        height: 37,
                                        justifyContent: collapsed ? 'center' : 'flex-start',
                                        borderRadius: '9px', cursor: 'pointer',
                                        color: isActive ? PALETTE.primary : '#5B6573',
                                        bgcolor: isActive ? PALETTE.primarySoft : 'transparent',
                                        fontWeight: isActive ? 600 : 500,
                                        transition: 'background-color .15s ease, color .15s ease',
                                        '&:hover': {
                                            bgcolor: isActive ? PALETTE.primarySoft : 'rgba(10,136,168,0.06)',
                                            color: PALETTE.primary,
                                        },
                                    }}
                                >
                                    <Icon sx={{ fontSize: 20 }} />
                                    {!collapsed && (
                                        <Typography sx={{
                                            ...TYPOGRAPHY.body4, fontWeight: 'inherit',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>
                                            {label}
                                        </Typography>
                                    )}
                                </Box>
                            </Tooltip>
                        );
                    })}
                </Box>

                {/* 사이드바 하단 — 사용자 가이드 (T3Composer-User-Guide.html 새 창 열기) */}
                <Box sx={{
                    flexShrink: 0,
                    borderTop: `1px solid ${PALETTE.panelBorder}`,
                    py: 1, px: collapsed ? 0.6 : 1,
                }}>
                    <Tooltip title={collapsed ? t('app.menu.userGuide', '사용자 가이드') : ''} placement="right">
                        <Box
                            component="a"
                            href="/T3Composer-User-Guide.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 1.2,
                                px: collapsed ? 0 : 1.2,
                                height: 37,
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                borderRadius: '9px', cursor: 'pointer',
                                color: '#5B6573', textDecoration: 'none',
                                fontWeight: 500,
                                transition: 'background-color .15s ease, color .15s ease',
                                '&:hover': {
                                    bgcolor: 'rgba(10,136,168,0.06)',
                                    color: PALETTE.primary,
                                },
                            }}
                        >
                            <MenuBookOutlinedIcon sx={{ fontSize: 20 }} />
                            {!collapsed && (
                                <Typography sx={{
                                    ...TYPOGRAPHY.body4, fontWeight: 'inherit',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>
                                    {t('app.menu.userGuide', '사용자 가이드')}
                                </Typography>
                            )}
                        </Box>
                    </Tooltip>
                </Box>
            </Box>

            {/* ===== 우측 — Tab 헤더 + 콘텐츠 ===== */}
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                {/* Tab 헤더 — A시안: 회색 베이스 + 흰 활성 탭 + 상단 티얼 인디케이터 */}
                <Box sx={{
                    flex: '0 0 auto',
                    px: 1, pt: '4px',
                    bgcolor: '#EEF0F3',
                    display: 'flex', alignItems: 'flex-end',
                }}>
                    <Tabs
                        value={activeKey}
                        onChange={(_e, v) => setActiveKey(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            flex: 1, minWidth: 0,
                            minHeight: 33,
                            '& .MuiTabs-indicator': { display: 'none' },
                            '& .MuiTab-root': {
                                minHeight: 33, py: 0, px: 1.8, mr: 0.4,
                                borderRadius: '9px 9px 0 0',
                                border: 'none',
                                bgcolor: 'transparent',
                                color: PALETTE.textSecondary,
                                ...TYPOGRAPHY.body5, fontWeight: 500,
                                transition: 'background-color .15s ease, color .15s ease',
                                '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.55)',
                                    color: PALETTE.textPrimary,
                                },
                            },
                            // 활성 탭 — A시안: 흰 배경 + 상단 2px 티얼 인디케이터
                            '& .MuiTab-root.Mui-selected': {
                                color: PALETTE.textPrimary,
                                bgcolor: '#FFFFFF',
                                fontWeight: 600,
                                boxShadow: `inset 0 2px 0 ${PALETTE.primary}`,
                            },
                        }}
                    >
                        {openTabs.map((key) => {
                            const m = findMenu(key);
                            if (!m) return null;
                            const isLast   = openTabs.length === 1;
                            const isActive = activeKey === key;
                            const TabIcon  = m.Icon;
                            // A시안: 활성 탭은 X 숨김 (마지막 탭도 X 숨김), 비활성 탭은 X 표시
                            const showClose = !isActive && !isLast;
                            return (
                                <Tab
                                    key={key}
                                    value={key}
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <TabIcon sx={{
                                                fontSize: 16,
                                                color: isActive ? PALETTE.primary : '#A6AEB8',
                                            }} />
                                            <span>{t(m.labelKey)}</span>
                                            {showClose && (
                                                <IconButton
                                                    component="div"
                                                    role="button"
                                                    tabIndex={0}
                                                    size="small"
                                                    onClick={(e) => { e.stopPropagation(); closeTab(key); }}
                                                    sx={{
                                                        p: 0.2, ml: 0.3,
                                                        color: PALETTE.textMuted,
                                                        '&:hover': {
                                                            bgcolor: 'rgba(10,136,168,0.12)',
                                                            color: PALETTE.primary,
                                                        },
                                                    }}
                                                >
                                                    <CloseIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            )}
                                        </Box>
                                    }
                                />
                            );
                        })}
                    </Tabs>
                    <Box sx={{ flex: '0 0 auto', pl: 2.5, pr: 2, alignSelf: 'center' }}>
                        <LanguageSwitcher variant="chip" />
                    </Box>
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

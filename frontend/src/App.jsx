import React, { useState, useCallback, useEffect } from 'react';
import { Switch, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Tabs, Tab, IconButton, Tooltip } from '@mui/material';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';

import Logo from './Logo';
import t3ComposerWordmark from './assets/T3Composer_logo_w.svg';
import iconHomeLine       from './assets/icons/home-line.svg';
import iconHomeFill       from './assets/icons/home-fill.svg';
import iconAiStar          from './assets/icons/ai-star.svg';
import iconAiStarFill      from './assets/icons/ai-star-fill.svg';
import iconHistory         from './assets/icons/history.svg';
import iconTemplate        from './assets/icons/template.svg';
import iconStacksFill      from './assets/icons/stacks-fill.svg';
import iconSitemap         from './assets/icons/sitemap.svg';
import iconFileDefault     from './assets/icons/file-default.svg';
import iconArrowLeft       from './assets/icons/double-arrow-left.svg';
import iconArrowRight      from './assets/icons/double-arrow-right.svg';
import iconDeleteS         from './assets/icons/Delete-S.svg';
import LanguageSwitcher from './view/util/t3composer/LanguageSwitcher';
import { PALETTE, TYPOGRAPHY } from './theme';
import { FONT_FAMILY } from './style/typography';
import SvgIcon from './style/SvgIcon';
import T3Home from './view/util/t3home/T3Home';
import T3Composer from './view/util/t3composer/T3Composer';
import T3mesPatternCatalog from './view/util/t3composerpatterns/T3mesPatternCatalog';
import T3ComposerDict from './view/util/t3composerdict/T3ComposerDict';
import T3ComposerHistory from './view/util/t3composerhistory/T3ComposerHistory';
import T3Dashboard from './view/util/t3dashboard/T3Dashboard';
import T3Mockup from './view/util/t3mockup/T3Mockup';
import OntologyPage from './view/util/t3composer/ontology/OntologyPage';
import PreviewLoader from './view/util/preview/PreviewLoader';
import Login from './view/util/login/Login';
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

// SHOW_LOGIN_PAGE — true 시 최초 진입에 로그인 화면 노출.
// TODO: 특정 환경에서만 true 가 되도록 로직 삽입.
const SHOW_LOGIN_PAGE = false;

const MENU_ITEMS = [
    { key: 'home',     labelKey: 'app.menu.home',        hintKey: 'app.menuHint.home',        iconLine: iconHomeLine,   iconFill: iconHomeFill,   Component: T3Home },
    { key: 'composer', labelKey: 'app.menu.composer',    hintKey: 'app.menuHint.composer',    iconLine: iconAiStar,     iconFill: iconAiStarFill, Component: T3Composer },
    { key: 'history',  labelKey: 'app.menu.history',     hintKey: 'app.menuHint.history',     iconLine: iconHistory,    Component: T3ComposerHistory },
    { key: 'mockup',   labelKey: 'app.menu.scmUiMockup', hintKey: 'app.menuHint.scmUiMockup', iconLine: iconTemplate,   Component: T3Mockup },
    { key: 'patterns', labelKey: 'app.menu.uiPattern',   hintKey: 'app.menuHint.uiPattern',   iconLine: iconStacksFill, Component: T3mesPatternCatalog },
    // { key: 'dict',     labelKey: 'app.menu.gallery',     hintKey: 'app.menuHint.gallery',     Icon: WidgetsOutlinedIcon,    Component: T3ComposerDict },
    { key: 'ontology', labelKey: 'app.menu.ontology',    hintKey: 'app.menuHint.ontology',    iconLine: iconSitemap,    Component: OntologyPage },
    ...(INSIGHT_ENABLED ? [
    { key: 'dashboard', labelKey: 'app.menu.dashboard',  hintKey: 'app.menuHint.dashboard',   iconLine: InsertChartOutlinedIcon, Component: T3Dashboard },
    ] : []),
];

// iconLine/iconFill 이 문자열이면 SVG URL, 아니면 MUI 컴포넌트로 취급.
function MenuIcon({ item, isActive, size = 20, color }) {
    const src = (isActive && item.iconFill) ? item.iconFill : item.iconLine;
    if (typeof src === 'string') {
        return <SvgIcon src={src} size={size} color={color} />;
    }
    const IconComp = src;
    return <IconComp sx={{ fontSize: size, color: color || 'inherit' }} />;
}

const SIDEBAR_W           = 220;
const SIDEBAR_W_COLLAPSED = 52;

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
                    bgcolor: PALETTE.sidebarBg,
                    transition: 'width 0.2s ease',
                    overflow: 'hidden',
                }}
            >
                {/* 로고 헤더 */}
                <Box sx={{
                    height: 48, flexShrink: 0,
                    borderBottom: `1px solid ${PALETTE.sidebarHeaderBorder}`,
                    display: 'flex', alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    px: collapsed ? 0 : '12px',
                }}>
                    {collapsed ? (
                        // Hover 시 로고 → 화살표 스왑
                        <Tooltip title={t('app.menu.expand', '메뉴 펼치기')} placement="right">
                            <Box
                                role="button"
                                tabIndex={0}
                                aria-label={t('app.menu.expand', '메뉴 펼치기')}
                                onClick={() => setCollapsed(false)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setCollapsed(false);
                                    }
                                }}
                                sx={{
                                    width: 36, height: 36,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: '6px', cursor: 'pointer',
                                    bgcolor: 'transparent',
                                    transition: 'background-color .15s ease',
                                    '& .collapsed-logo-hover': { display: 'none' },
                                    '&:hover, &:focus-visible': {
                                        bgcolor: 'rgba(255,255,255,0.16)',
                                        '& .collapsed-logo-default': { display: 'none' },
                                        '& .collapsed-logo-hover':   { display: 'flex' },
                                    },
                                    '&:focus-visible': {
                                        outline: '2px solid',
                                        outlineColor: PALETTE.sidebarOnBg,
                                        outlineOffset: '2px',
                                    },
                                }}
                            >
                                <Box className="collapsed-logo-default" sx={{ display: 'flex' }}>
                                    <Logo size={28} />
                                </Box>
                                <Box className="collapsed-logo-hover">
                                    <SvgIcon src={iconArrowRight} size={16} color={PALETTE.sidebarOnBg} />
                                </Box>
                            </Box>
                        </Tooltip>
                    ) : (
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                <Logo size={28} />
                                <Box
                                    component="img"
                                    src={t3ComposerWordmark}
                                    alt="T³Composer"
                                    sx={{
                                        height: 14, width: 'auto', display: 'block',
                                        objectFit: 'contain', objectPosition: 'left center',
                                        flexShrink: 0,
                                    }}
                                />
                            </Box>
                            <Tooltip title="메뉴 접기">
                                <IconButton
                                    onClick={() => setCollapsed(true)}
                                    sx={{
                                        width: 26, height: 26, p: '5px',
                                        borderRadius: '6px',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' },
                                    }}
                                >
                                    <SvgIcon src={iconArrowLeft} size={16} color={PALETTE.sidebarOnBg} />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                </Box>

                {/* 메뉴 컨테이너 */}
                <Box sx={{
                    flex: 1, overflowY: 'auto', overflowX: 'hidden',
                    p: '8px',
                    display: 'flex', flexDirection: 'column', gap: '3px',
                }}>
                    {MENU_ITEMS.map((m) => {
                        const isActive = activeKey === m.key && openTabs.includes(m.key);
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
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        p: '8px',
                                        width: collapsed ? 'auto' : '100%',
                                        justifyContent: collapsed ? 'center' : 'flex-start',
                                        borderRadius: '6px', cursor: 'pointer',
                                        color: PALETTE.sidebarOnBg,
                                        bgcolor: isActive ? PALETTE.sidebarActive : 'transparent',
                                        opacity: isActive ? 1 : 0.8,
                                        transition: 'background-color .15s ease, opacity .15s ease',
                                        '&:hover': {
                                            bgcolor: isActive ? PALETTE.sidebarActive : 'rgba(255,255,255,0.12)',
                                            opacity: 1,
                                        },
                                    }}
                                >
                                    <MenuIcon item={m} isActive={isActive} size={20} color={PALETTE.sidebarOnBg} />
                                    {!collapsed && (
                                        <Typography sx={{
                                            fontFamily: FONT_FAMILY,
                                            fontSize: 13, fontWeight: 700,
                                            letterSpacing: '-0.36px',
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
                    py: '16px',
                    px: collapsed ? 0 : '20px',
                    display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start',
                }}>
                    <Tooltip title={collapsed ? t('app.menu.userGuide', '사용자 가이드') : ''} placement="right">
                        <Box
                            component="a"
                            href="/T3Composer-User-Guide.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                cursor: 'pointer', textDecoration: 'none',
                                color: PALETTE.sidebarOnBg,
                                transition: 'opacity .15s ease',
                                '&:hover': { opacity: 0.8 },
                            }}
                        >
                            <SvgIcon src={iconFileDefault} size={18} color={PALETTE.sidebarOnBg} />
                            {!collapsed && (
                                <Typography sx={{
                                    fontFamily: FONT_FAMILY,
                                    fontSize: 13, fontWeight: 700,
                                    letterSpacing: '-0.36px',
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
                {/* Tab 헤더 */}
                <Box sx={{
                    flex: '0 0 auto',
                    pl: 0, pr: 0, height: 32,
                    bgcolor: PALETTE.headerBg,
                    display: 'flex', alignItems: 'stretch',
                }}>
                    <Tabs
                        value={activeKey}
                        onChange={(_e, v) => setActiveKey(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        TabIndicatorProps={{ sx: { top: 0, bottom: 'auto' } }}
                        sx={{
                            flex: 1, minWidth: 0,
                            minHeight: 32,
                            '& .MuiTabs-indicator': {
                                height: 3,
                                bgcolor: PALETTE.headerIconActive,
                            },
                            '& .MuiTab-root': {
                                minHeight: 32, py: 0, px: '12px',
                                border: 'none',
                                bgcolor: 'transparent',
                                color: PALETTE.headerTextMuted,
                                fontSize: 13, fontWeight: 500,
                                fontFamily: FONT_FAMILY,
                                letterSpacing: '-0.36px',
                                lineHeight: 'normal',
                                textTransform: 'none',
                                transition: 'background-color .15s ease, color .15s ease',
                                '&:hover': {
                                    color: PALETTE.headerTextActive,
                                },
                            },
                            '& .MuiTab-root.Mui-selected': {
                                color: PALETTE.headerTextActive,
                                bgcolor: PALETTE.headerActiveTabBg,
                                fontWeight: 700,
                            },
                        }}
                    >
                        {openTabs.map((key) => {
                            const m = findMenu(key);
                            if (!m) return null;
                            const isLast   = openTabs.length === 1;
                            const isActive = activeKey === key;
                            // 마지막 하나 남은 탭만 X 숨김
                            const showClose = !isLast;
                            return (
                                <Tab
                                    key={key}
                                    value={key}
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <MenuIcon
                                                item={m}
                                                isActive={isActive}
                                                size={14}
                                                color={PALETTE.headerIconMuted}
                                            />
                                            <span>{t(m.labelKey)}</span>
                                            {showClose && (
                                                // SvgIcon 은 mask mode 에서 display:inline-block 을 inline style 로 붙여
                                                // CSS :hover 로 override 불가 → 각각 Box wrapper 로 감싸 display 스왑.
                                                <Box
                                                    role="button"
                                                    tabIndex={0}
                                                    aria-label="탭 닫기"
                                                    onClick={(e) => { e.stopPropagation(); closeTab(key); }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            closeTab(key);
                                                        }
                                                    }}
                                                    sx={{
                                                        width: 12, height: 12, position: 'relative',
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        '&:focus-visible': {
                                                            outline: '2px solid',
                                                            outlineColor: PALETTE.headerIconActive,
                                                            outlineOffset: '2px',
                                                        },
                                                        '& .close-hover':          { display: 'none' },
                                                        '&:hover .close-default':  { display: 'none' },
                                                        '&:hover .close-hover':    { display: 'inline-flex' },
                                                    }}
                                                >
                                                    <Box className="close-default" sx={{ display: 'inline-flex' }}>
                                                        <SvgIcon src={iconDeleteS} size={12} color={PALETTE.headerCloseIcon} />
                                                    </Box>
                                                    <Box className="close-hover">
                                                        <SvgIcon src={iconDeleteS} size={12} color={PALETTE.headerIconActive} />
                                                    </Box>
                                                </Box>
                                            )}
                                        </Box>
                                    }
                                />
                            );
                        })}
                    </Tabs>
                    <Box sx={{ flex: '0 0 auto', alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>
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

// Root — 게이트 상수가 true 면 로그인 화면을 먼저 보여준 뒤 통과 시 TabbedHome.
function Root() {
    // TODO: passed 초기값 — 유효한 통과 키가 있으면 true 로 시작.
    //   현재는 매 새로고침마다 SHOW_LOGIN_PAGE 만 보고 재판정 (지속성 없음). -> 추후 sessionStorage에서 통과 키 확인 후 기억 필요.
    const [passed, setPassed] = useState(!SHOW_LOGIN_PAGE);
    if (!passed) {
        // TODO: onPass(key, { remember }) — remember=true 이면 통과 키를 저장소에 보관해
        //   다음 진입 시 위 passed 초기값 복원에 사용. 현재는 통과만 처리.
        return <Login onPass={() => setPassed(true)} />;
    }
    return <TabbedHome />;
}

export default function App() {
    return (
        <Box sx={{ height: '100%' }}>
            <Switch>
                <Route path="/preview/" component={PreviewLoader} />
                <Route path="/" component={Root} />
            </Switch>
            <ShowMessageHost />
        </Box>
    );
}

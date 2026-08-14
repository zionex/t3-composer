import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { listSessions } from '../t3composer/api';
import { EXAMPLES_BY_LNG } from '../t3composer/AiRecommendPanel';
import useUiLanguage from '../t3composer/useUiLanguage';
import { findMockup } from '../t3mockup';

import iconHomeFill from '../../../assets/icons/home-fill.svg';
import iconRedo from '../../../assets/icons/redo.svg';
import iconAiStarFill from '../../../assets/icons/ai-star-fill.svg';
import iconGridTable from '../../../assets/icons/grid-table.svg';
import iconBarChart1 from '../../../assets/icons/bar-chart-1.svg';
import iconMenuHid from '../../../assets/icons/menu-hid.svg';
import iconChatLine from '../../../assets/icons/chat-line.svg';
import iconGrid from '../../../assets/icons/grid.svg';
import iconCopyRight from '../../../assets/icons/copy-right.svg';
import iconStacksFill from '../../../assets/icons/stacks-fill.svg';
import iconAlertCheck from '../../../assets/icons/alert-check.svg';
import iconEdit from '../../../assets/icons/edit.svg';
import SvgIcon from '../../../style/SvgIcon';
import { PALETTE, TYPOGRAPHY } from '../../../theme';

// -----------------------------------------------------------------------------
// 로컬 토큰
// -----------------------------------------------------------------------------
const AQUA_40 = '#0C97B7';

const CARD_ELEVATION = {
    border: '1px solid var(--color-aqua-95, #F2FCFD)',
    boxShadow: '0 2px 8px 0 rgba(16,24,40,0.005)',
};

const CARD_SX = {
    bgcolor: '#FFFFFF',
    ...CARD_ELEVATION,
    borderRadius: '14px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
};

// =============================================================================
// 재사용 컴포넌트
// =============================================================================

function CardHead({ icon, title, action, size = 'sm' }) {
    const spec = size === 'md'
        ? { py: '14px', px: '20px', fontSize: 14, height: '54px', lineHeight: '21px', borderColor: '#F2F4F7' }
        : { py: '12px', px: '18px', fontSize: 13, height: '45px', lineHeight: '19.5px', borderColor: '#E8E8E8' };
    return (
        <Box sx={{
            px: spec.px, py: spec.py, height: spec.height,
            borderBottom: `1px solid ${spec.borderColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                {icon}
                <Typography sx={{
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontSize: spec.fontSize, fontWeight: 800,
                    color: '#000000', lineHeight: spec.lineHeight,
                    whiteSpace: 'nowrap',
                }}>
                    {title}
                </Typography>
            </Box>
            {action}
        </Box>
    );
}

function LinkAction({ children, onClick }) {
    return (
        <Box
            role="button"
            onClick={onClick}
            sx={{
                display: 'inline-flex', alignItems: 'center', gap: '4px', height: '16px',
                fontSize: 13, fontWeight: 500, color: AQUA_40,
                fontFamily: TYPOGRAPHY.fontFamily, cursor: 'pointer',
                lineHeight: '100%',
                '&:hover': { textDecoration: 'underline' },
            }}
        >
            {children}
            <SvgIcon src={iconRedo} size={14} color={AQUA_40} />
        </Box>
    );
}

function Pill({ variant, children }) {
    const map = {
        done: { bg: '#E8F7FB', fg: AQUA_40   },
        new:  { bg: '#F0EBFF', fg: '#7C5CFC' },
    };
    const c = map[variant] || map.new;
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center',
            fontFamily: TYPOGRAPHY.fontFamily,
            fontSize: 12, fontWeight: 700, lineHeight: 'normal',
            px: '5px', py: '2px', borderRadius: '99px',
            bgcolor: c.bg, color: c.fg,
            whiteSpace: 'nowrap',
        }}>
            {children}
        </Box>
    );
}

// =============================================================================
// Row 1 — Hero
// =============================================================================

function HeroCard() {
    return (
        <Box sx={{
            position: 'relative', overflow: 'hidden',
            borderRadius: '16px',
            ...CARD_ELEVATION,
            background: `linear-gradient(101.43deg, #FFFFFF 0%, #F3FBFD 100%)`,
            p: '24px',
            display: 'flex', flexDirection: 'column', gap: '24px',
        }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Typography component="h2" sx={{
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontSize: 20, fontWeight: 700,
                    color: '#000000',
                    letterSpacing: '-0.66px',
                    lineHeight: '100%',
                }}>
                    안녕하세요 👋
                </Typography>
                <Typography sx={{
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontSize: 13, fontWeight: 400,
                    color: '#666666',
                    lineHeight: '100%',
                }}>
                    AI Composer로 더 빠르고 정확하게 화면을 만들어보세요.
                </Typography>
            </Box>

            <Button
                component="a"
                href="/T3Composer-User-Guide.html"
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                endIcon={<SvgIcon src={iconRedo} size={14} color={AQUA_40} />}
                sx={{
                    alignSelf: 'flex-start',
                    height: 28,
                    borderColor: AQUA_40,
                    color: AQUA_40,
                    bgcolor: 'transparent',
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontSize: 12, fontWeight: 700,
                    px: '10px', py: '6px', borderRadius: '8px',
                    textDecoration: 'none',
                    '& .MuiButton-endIcon': { ml: '4px', mr: 0 },
                    '&:hover': {
                        bgcolor: 'rgba(12,151,183,0.06)',
                        borderColor: AQUA_40,
                        textDecoration: 'none',
                    },
                }}
            >
                가이드 더보기
            </Button>

            {/* TODO: 가이드 카드 — 내용 미정 */}
            {/* <Box sx={{
                height: '60%',
                bgcolor: '#FFFFFF',
                border: '1px solid #E8E8E8',
                borderRadius: '12px',
                p: '16px',
                display: 'flex', flexDirection: 'column', gap: '8px',
            }} /> */}
        </Box>
    );
}

// =============================================================================
// Row 1 — Templates
// =============================================================================

const PREVIEW_W = 1400;
const PREVIEW_H = 900;
const HEADER_SKIP = 100;

function TemplatePreview({ entry }) {
    const ref = useRef(null);
    const [scale, setScale] = useState(0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const update = () => {
            const { width, height } = el.getBoundingClientRect();
            if (width <= 0 || height <= 0) return;
            const s = Math.max(width / PREVIEW_W, height / PREVIEW_H);
            setScale((prev) => (Math.abs(prev - s) < 0.002 ? prev : s));
        };
        update();
        const ro = new ResizeObserver(() => requestAnimationFrame(update));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const Comp = entry?.component || null;

    return (
        <Box ref={ref} sx={{
            width: '100%', height: '100%',
            position: 'relative',
            overflow: 'hidden',
            bgcolor: '#fff',
        }}>
            {Comp && scale > 0 && (
                <Box sx={{
                    position: 'absolute', top: -HEADER_SKIP * scale, left: 0,
                    width: PREVIEW_W, height: PREVIEW_H,
                    transform: `scale(${scale})`, transformOrigin: 'top left',
                    pointerEvents: 'none',
                    contain: 'paint',
                }}>
                    <Suspense fallback={
                        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CircularProgress size={48} />
                        </Box>
                    }>
                        <Comp />
                    </Suspense>
                </Box>
            )}
        </Box>
    );
}

function TemplateCard({ iconSrc, title, badge, badgeVariant, mockup, desc, onUse }) {
    return (
        <Box sx={{
            p: '16px', display: 'flex', flexDirection: 'column', gap: '10px',
            borderRight: '1px solid #E8E8E8',
            '&:last-child': { borderRight: 'none' },
        }}>
            <Box sx={{
                bgcolor: '#F7F8FA', border: '1px solid #EDF1F5', borderRadius: '8px',
                height: 154, p: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0,
            }}>
                {mockup}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Box sx={{
                        bgcolor: '#F3F3F3', borderRadius: '6px',
                        p: '4px', display: 'inline-flex', flexShrink: 0,
                    }}>
                        <SvgIcon src={iconSrc} size={13} />
                    </Box>
                    <Typography sx={{
                        fontSize: 14, fontWeight: 800, color: '#000000',
                        fontFamily: TYPOGRAPHY.fontFamily,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                        {title}
                    </Typography>
                    {badge && (
                        <Box sx={{ ml: 'auto' }}>
                            <Pill variant={badgeVariant}>{badge}</Pill>
                        </Box>
                    )}
                </Box>
                <Typography sx={{
                    pt: '4px',
                    fontSize: 13, fontWeight: 400, color: '#666666',
                    lineHeight: '16px',
                    fontFamily: TYPOGRAPHY.fontFamily,
                }}>
                    {desc}
                </Typography>
            </Box>

            <Box sx={{ flex: 1, minHeight: 67, display: 'flex', alignItems: 'flex-end' }}>
                <Box
                    role="button"
                    onClick={onUse}
                    sx={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        fontFamily: TYPOGRAPHY.fontFamily,
                        fontSize: 12, fontWeight: 700, color: AQUA_40,
                        lineHeight: 'normal', cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' },
                    }}
                >
                    이 템플릿 사용하기
                    <SvgIcon src={iconRedo} size={10} color={AQUA_40} />
                </Box>
            </Box>
        </Box>
    );
}

// T3SmartSCM 표준 기준 mockup 매핑 top 3개만 노출 (domain 2개, dashboard 1개)
// 순서 = 카드 슬롯 순서. iconSrc / badge / badgeVariant 는 슬롯별 고정 · 이름·설명·미리보기는 entry 에서.
const TEMPLATE_SLOTS = [
    { patternCode: 'search_grid',  iconSrc: iconGridTable, badge: '가장 많이 사용', badgeVariant: 'done' },
    { patternCode: 'dash_overview', iconSrc: iconBarChart1, badge: '인기',           badgeVariant: 'new'  },
    { patternCode: 'v2_dual_grid', iconSrc: iconMenuHid,   badge: null,             badgeVariant: null   },
];

function TemplatesCard() {
    const slots = useMemo(
        () => TEMPLATE_SLOTS.map((s) => ({ ...s, entry: findMockup(s.patternCode) })).filter((s) => s.entry),
        []
    );
    // "전체 템플릿 보기" — SCM UI Mockup 탭으로 이동
    const openMockupTab = () => {
        window.dispatchEvent(new CustomEvent('t3composer:openTab', { detail: { key: 'mockup' } }));
    };
    // 카드 [이 템플릿 사용하기] — Composer NEW_STEP 진입 + 선택 mockup 자동 적용 → Wizard 로 직행.
    const useTemplate = (patternCode) => {
        goToComposerMode('NEW', 'NEW_STEP', { mockupCode: patternCode });
    };
    return (
        <Box sx={CARD_SX}>
            <CardHead
                icon={<SvgIcon src={iconAiStarFill} size={16} color={AQUA_40} />}
                title="템플릿 사용 예시"
                action={<LinkAction onClick={openMockupTab}>전체 템플릿 보기</LinkAction>}
            />
            <Box sx={{
                flex: 1, minHeight: 0,
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: '1fr',
            }}>
                {slots.map((s) => (
                    <TemplateCard
                        key={s.patternCode}
                        iconSrc={s.iconSrc}
                        title={s.entry.patternLabel}
                        badge={s.badge}
                        badgeVariant={s.badgeVariant}
                        mockup={<TemplatePreview entry={s.entry} />}
                        desc={s.entry.description}
                        onUse={() => useTemplate(s.patternCode)}
                    />
                ))}
            </Box>
        </Box>
    );
}

// =============================================================================
// Row 2 — Quick Start (5 cards)
// =============================================================================

function QsCard({ iconSrc, title, desc, onClick }) {
    return (
        <Box
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); }
            }}
            sx={{
                border: '1px solid #E8E8E8',
                borderRadius: '12px',
                p: '14px', bgcolor: '#FFFFFF',
                display: 'flex', flexDirection: 'column', gap: '16px',
                cursor: 'pointer', transition: 'background-color .15s, border-color .15s',
                '&:hover': {
                    bgcolor: '#FAFEFF',
                    borderColor: '#DDF6FA',
                },
                '&:focus-visible': {
                    outline: `2px solid ${PALETTE.primary}`, outlineOffset: '2px',
                },
            }}
        >
            <Box sx={{
                width: 32, height: 32, borderRadius: '10px',
                bgcolor: PALETTE.primarySoft,
                display: 'grid', placeItems: 'center', flexShrink: 0,
            }}>
                <SvgIcon src={iconSrc} size={18} color={AQUA_40} />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Typography sx={{
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontSize: 13, fontWeight: 700, color: '#000000',
                    lineHeight: 'normal',
                }}>
                    {title}
                </Typography>
                <Typography sx={{
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontSize: 11, fontWeight: 500, color: '#666666',
                    lineHeight: '16.5px',
                }}>
                    {desc}
                </Typography>
            </Box>
        </Box>
    );
}

// Composer Tab 활성화 후 특정 모드로 직진.
// - openTab 이 최초 mount 를 trigger 하는 경우도 있어 pickMode 는 50ms 뒤 dispatch.
// - extras (subStage / initialNl) 는 T3Composer 가 pending ref 로 stash 해 ModeNewStep 에 prop 으로 전달.
function goToComposerMode(catKey, optKey, extras) {
    window.dispatchEvent(new CustomEvent('t3composer:openTab', { detail: { key: 'composer' } }));
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('t3composer:pickMode', {
            detail: { catKey, optKey, ...(extras || {}) },
        }));
    }, 50);
}

function QuickStartCard() {
    const { t } = useTranslation();
    const lng = useUiLanguage();
    // AiRecommendPanel 의 자연어 예시 (locale 별 3개) 를 그대로 노출 — 클릭 시 그 nl 로 AI 추천 화면 진입.
    const chips = EXAMPLES_BY_LNG[lng] || EXAMPLES_BY_LNG.en || EXAMPLES_BY_LNG.ko;
    return (
        <Box sx={{
            bgcolor: '#FFFFFF',
            ...CARD_ELEVATION,
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
        }}>
            {/* Section 1 — Header */}
            <Box sx={{
                px: '20px', py: '16px',
                borderBottom: '1px solid #E8E8E8',
            }}>
                <Typography sx={{
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontSize: 14, fontWeight: 800,
                    color: '#000000', lineHeight: '21px',
                }}>
                    빠른 시작
                </Typography>
            </Box>

            {/* Section 2 — 5 cards */}
            <Box sx={{
                p: '16px',
                display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px',
            }}>
                <QsCard iconSrc={iconChatLine}   title="자연어로 생성" desc="요구사항을 설명하면 AI가 생성"
                        onClick={() => goToComposerMode('NEW', 'NEW_NL')} />
                <QsCard iconSrc={iconGrid}       title="패턴으로 시작" desc="검증된 UI 패턴 선택"
                        onClick={() => goToComposerMode('NEW', 'NEW_STEP')} />
                <QsCard iconSrc={iconCopyRight}  title={t('composer:mode.newFromCopy.title')} desc="화면을 복사해 빠르게 시작"
                        onClick={() => goToComposerMode('NEW', 'NEW_FROM_COPY')} />
                <QsCard iconSrc={iconCopyRight}  title="자연어로 수정" desc="수정 내용을 설명하면 AI가 반영"
                        onClick={() => goToComposerMode('MODIFY', 'NL')} />
                <QsCard iconSrc={iconStacksFill} title={t('composer:mode.modifyStep.title')}   desc="스펙 확인 후 필요한 부분만 변경"
                        onClick={() => goToComposerMode('MODIFY', 'STEP')} />
            </Box>

            {/* Section 3 — Quick Question label + prompt chips */}
            <Box sx={{
                p: '20px',
                borderTop: '1px solid #E8E8E8',
                boxShadow: '0 6px 18px rgba(16,24,40,0.04)',
                display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '14px',
                alignItems: 'center',
            }}>
                <Typography sx={{
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontSize: 13.3, fontWeight: 700,
                    color: '#222222', lineHeight: 'normal',
                    whiteSpace: 'nowrap',
                }}>
                    Quick Question
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {chips.map((c) => (
                        <Box
                            key={c}
                            role="button"
                            tabIndex={0}
                            onClick={() => goToComposerMode('NEW', 'NEW_STEP', { subStage: 'AI_RECOMMEND', initialNl: c })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    goToComposerMode('NEW', 'NEW_STEP', { subStage: 'AI_RECOMMEND', initialNl: c });
                                }
                            }}
                            sx={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                minHeight: 36, px: '20px', pt: '10px', pb: '11px',
                                borderRadius: '10px',
                                border: '1px solid #E8E8E8',
                                bgcolor: '#F8F8F8', color: '#222222',
                                fontFamily: TYPOGRAPHY.fontFamily,
                                fontSize: 13.3, fontWeight: 700, lineHeight: 'normal',
                                cursor: 'pointer', transition: 'all .15s',
                                '&:hover': {
                                    borderColor: PALETTE.primaryBorder,
                                    bgcolor: '#E8F7FB',
                                    color: AQUA_40,
                                },
                                '&:focus-visible': {
                                    outline: `2px solid ${PALETTE.primary}`, outlineOffset: '2px',
                                },
                            }}
                        >
                            {c}
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>
    );
}

// =============================================================================
// Row 3 — Continue
// =============================================================================

function ContinueItem({ title, step, code, time, iconSrc, onClick }) {
    return (
        <Box
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick}
            onKeyDown={(e) => {
                if (!onClick) return;
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
            }}
            sx={{
                display: 'flex', alignItems: 'center', gap: '12px',
                px: '12px', py: '11px', borderRadius: '10px',
                cursor: 'pointer', transition: 'all .15s',
                '&:hover': { bgcolor: '#FAFBFC' },
            }}
        >
            <Box sx={{
                width: 36, height: 36, borderRadius: '8px',
                bgcolor: PALETTE.primarySoft,
                display: 'grid', placeItems: 'center', flexShrink: 0,
            }}>
                <SvgIcon src={iconSrc || iconGrid} size={15} color={AQUA_40} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontSize: 14, fontWeight: 700, color: '#000000',
                    lineHeight: 'normal',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {title}
                </Typography>
                <Box sx={{
                    pt: '2px',
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontSize: 13, lineHeight: 'normal',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    <Box component="span" sx={{ color: AQUA_40, fontWeight: 600 }}>{step}</Box>
                    <Box component="span" sx={{ color: '#999999' }}>{` · ${code}`}</Box>
                </Box>
            </Box>
            <Box sx={{
                fontFamily: TYPOGRAPHY.fontFamily,
                fontSize: 13, fontWeight: 500, color: '#999999',
                flexShrink: 0,
            }}>
                {time}
            </Box>
        </Box>
    );
}

function formatRelativeTime(dttm) {
    if (!dttm) return '';
    const then = new Date(dttm).getTime();
    if (Number.isNaN(then)) return '';
    const diffMin = Math.floor((Date.now() - then) / 60000);
    if (diffMin < 1)      return '방금 전';
    if (diffMin < 60)     return `${diffMin}분 전`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24)       return `${diffH}시간 전`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1)      return '어제';
    if (diffD < 7)        return `${diffD}일 전`;
    if (diffD < 30)       return `${Math.floor(diffD / 7)}주 전`;
    return `${Math.floor(diffD / 30)}달 전`;
}

function resumeSession(sessionId) {
    window.dispatchEvent(new CustomEvent('t3composer:openTab', { detail: { key: 'composer' } }));
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('t3composer:resume', { detail: { sessionId } }));
    }, 50);
}

function openHistoryTab() {
    window.dispatchEvent(new CustomEvent('t3composer:openTab', { detail: { key: 'history' } }));
}

function ContinueCard() {
    const { t } = useTranslation();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const modeLabel = useMemo(() => ({
        NEW_NL:          t('composer:mode.newNl.title'),
        NEW_STEP:        t('composer:mode.newStep.title'),
        NEW_FROM_COPY:   t('composer:mode.newFromCopy.title'),
        NEW_FROM_DESIGN: '설계서 기반',
        EXISTING_MODIFY: t('composer:main.modifyExisting'),
    }), [t]);

    // 빠른 시작 위젯의 아이콘과 매핑 (QsCard 참조)
    const modeIconSrc = {
        NEW_NL:          iconChatLine,
        NEW_STEP:        iconGrid,
        NEW_FROM_COPY:   iconCopyRight,
        NEW_FROM_DESIGN: iconGrid,
        EXISTING_MODIFY: iconEdit,
    };

    useEffect(() => {
        let alive = true;
        listSessions()
            .then((res) => {
                if (!alive) return;
                const list = (Array.isArray(res.data) ? res.data : [])
                    .filter((s) => (s.status || 'ACTIVE') === 'ACTIVE')
                    .sort((a, b) => (b.createDttm || '').localeCompare(a.createDttm || ''))
                    .slice(0, 10);
                setItems(list);
            })
            .catch(() => { if (alive) setItems([]); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, []);

    return (
        <Box sx={{ ...CARD_SX, minHeight: 0 }}>
            <CardHead
                size="md"
                title="이어서 작업하기"
                action={
                    <Typography
                        role="button"
                        onClick={openHistoryTab}
                        sx={{
                            fontFamily: TYPOGRAPHY.fontFamily,
                            fontSize: 13, fontWeight: 500, color: '#999999',
                            lineHeight: 'normal', cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' },
                        }}
                    >
                        전체 보기
                    </Typography>
                }
            />
            <Box sx={{
                flex: 1, minHeight: 0, overflow: 'auto',
                p: '12px', display: 'flex', flexDirection: 'column', gap: '4px',
            }}>
                {!loading && items.length === 0 && (
                    <Box sx={{
                        py: '32px', textAlign: 'center',
                        fontSize: 12, color: PALETTE.textMuted,
                        fontFamily: TYPOGRAPHY.fontFamily,
                    }}>
                        진행 중인 작업이 없습니다.
                    </Box>
                )}
                {items.map((s) => (
                    <ContinueItem
                        key={s.id}
                        iconSrc={modeIconSrc[s.mode] || iconGrid}
                        title={s.title || '제목 없음'}
                        step={modeLabel[s.mode] || s.mode || '-'}
                        code={s.targetMenuCd || s.targetCd || '-'}
                        time={formatRelativeTime(s.createDttm)}
                        onClick={() => resumeSession(s.id)}
                    />
                ))}
            </Box>
        </Box>
    );
}

// =============================================================================
// Row 3 — Activity
// =============================================================================

function FilterChip({ on, onClick, children }) {
    return (
        <Box
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); }
            }}
            sx={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                px: '9px', py: '4px', borderRadius: '999px',
                bgcolor: on ? AQUA_40 : 'transparent',
                color: on ? '#FFFFFF' : '#999999',
                fontFamily: TYPOGRAPHY.fontFamily,
                fontSize: 11, fontWeight: 700, lineHeight: '17.5px',
                whiteSpace: 'nowrap',
                cursor: 'pointer', transition: 'color .15s',
                '&:hover': on ? {} : { color: PALETTE.textSecondary },
                '&:focus-visible': { outline: `2px solid ${PALETTE.primary}`, outlineOffset: '2px' },
            }}
        >
            {children}
        </Box>
    );
}

const STATUS_BADGE = {
    ACTIVE:    { label: '진행중', bg: PALETTE.primarySoft, fg: AQUA_40   },
    COMPLETED: { label: '완료',   bg: '#F3FBF0', fg: '#10B981' },
    ARCHIVED:  { label: '보관',   bg: '#F2F2F2', fg: '#666666' },
};

function FeedItem({ kind, title, meta, time, status, onClick }) {
    const kindMap = {
        create: { bg: PALETTE.primarySoft, fg: AQUA_40,   iconSrc: iconAlertCheck },
        modify: { bg: '#F2F2F2', fg: '#666666', iconSrc: iconEdit       },
    };
    const k = kindMap[kind] || kindMap.create;
    const badge = status ? STATUS_BADGE[status] : null;
    return (
        <Box
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick}
            onKeyDown={(e) => {
                if (!onClick) return;
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
            }}
            sx={{
                display: 'flex', alignItems: 'center', gap: '12px',
                px: '12px', py: '10px', borderRadius: '10px',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'background-color .15s',
                '&:hover': onClick ? { bgcolor: '#F8FAFC' } : {},
                '&:focus-visible': onClick
                    ? { outline: `2px solid ${PALETTE.primary}`, outlineOffset: '-2px' }
                    : {},
            }}
        >
            <Box sx={{
                width: 36, height: 36, borderRadius: '8px',
                bgcolor: k.bg, color: k.fg,
                display: 'grid', placeItems: 'center', flexShrink: 0,
            }}>
                <SvgIcon src={k.iconSrc} size={18} color={k.fg} />
            </Box>
            <Box sx={{
                flex: 1, minWidth: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px',
            }}>
                <Box component="p" sx={{
                    m: 0,
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontSize: 14, fontWeight: 700, color: '#000000',
                    lineHeight: 'normal',
                    maxWidth: '100%',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {title}
                </Box>
                <Box component="p" sx={{
                    m: 0,
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontSize: 13, fontWeight: 500, color: '#999999',
                    lineHeight: 'normal',
                    maxWidth: '100%',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {meta}
                </Box>
            </Box>
            {badge && (
                <Box sx={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    px: '8px', py: '2px', borderRadius: '999px',
                    bgcolor: badge.bg, color: badge.fg,
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontSize: 10, fontWeight: 700, lineHeight: '14px',
                    whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                    {badge.label}
                </Box>
            )}
            <Box component="p" sx={{
                m: 0,
                fontFamily: TYPOGRAPHY.fontFamily,
                fontSize: 13, fontWeight: 500, color: '#999999',
                lineHeight: 'normal', flexShrink: 0,
            }}>
                {time}
            </Box>
        </Box>
    );
}

const ACTIVITY_FILTERS = [
    { key: 'ALL',    label: '전체' },
    { key: 'CREATE', label: '생성' },  // mode ∈ NEW_*
    { key: 'MODIFY', label: '수정' },  // mode = EXISTING_MODIFY
];

function sessionKind(mode) {
    return mode === 'EXISTING_MODIFY' ? 'modify' : 'create';
}

function ActivityCard() {
    const { t } = useTranslation();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    const modeLabel = useMemo(() => ({
        NEW_NL:          t('composer:mode.newNl.title'),
        NEW_STEP:        t('composer:mode.newStep.title'),
        NEW_FROM_COPY:   t('composer:mode.newFromCopy.title'),
        NEW_FROM_DESIGN: '설계서 기반',
        EXISTING_MODIFY: t('composer:main.modifyExisting'),
    }), [t]);

    useEffect(() => {
        let alive = true;
        listSessions()
            .then((res) => {
                if (!alive) return;
                const list = (Array.isArray(res.data) ? res.data : [])
                    .sort((a, b) => (b.createDttm || '').localeCompare(a.createDttm || ''));
                setItems(list);
            })
            .catch(() => { if (alive) setItems([]); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, []);

    const filtered = useMemo(() => {
        const matched = items.filter((s) => {
            if (filter === 'ALL') return true;
            const isModify = s.mode === 'EXISTING_MODIFY';
            return filter === 'MODIFY' ? isModify : !isModify;
        });
        return matched.slice(0, 10);
    }, [items, filter]);

    return (
        <Box sx={{ ...CARD_SX, minHeight: 0 }}>
            <CardHead
                size="md"
                title="최근 활동"
                action={
                    <Box sx={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                        {ACTIVITY_FILTERS.map((f) => (
                            <FilterChip
                                key={f.key}
                                on={filter === f.key}
                                onClick={() => setFilter(f.key)}
                            >
                                {f.label}
                            </FilterChip>
                        ))}
                    </Box>
                }
            />
            <Box sx={{
                flex: 1, minHeight: 0, overflow: 'auto', p: '12px',
                display: 'flex', flexDirection: 'column', gap: '2px',
            }}>
                {!loading && filtered.length === 0 && (
                    <Box sx={{
                        py: '32px', textAlign: 'center',
                        fontSize: 12, color: PALETTE.textMuted,
                        fontFamily: TYPOGRAPHY.fontFamily,
                    }}>
                        {filter === 'ALL' ? '최근 활동이 없습니다.' : '해당 조건의 활동이 없습니다.'}
                    </Box>
                )}
                {filtered.map((s) => (
                    <FeedItem
                        key={s.id}
                        kind={sessionKind(s.mode)}
                        title={s.title || '제목 없음'}
                        meta={`${modeLabel[s.mode] || s.mode || '-'} · ${s.targetMenuCd || s.targetCd || '-'}`}
                        time={formatRelativeTime(s.createDttm)}
                        status={s.status || 'ACTIVE'}
                        onClick={() => resumeSession(s.id)}
                    />
                ))}
            </Box>
        </Box>
    );
}

// =============================================================================
// 페이지
// =============================================================================

export default function T3Home() {
    const { t } = useTranslation();
    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#FFFFFF' }}>
            {/* 화면 헤더 */}
            <Box
                component="header"
                sx={{
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center',
                    px: '16px', py: '10px',
                    bgcolor: '#FFFFFF',
                    borderBottom: '1px solid #E8E8E8',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <SvgIcon src={iconHomeFill} size={22} color={PALETTE.primary} />
                    <Typography component="h1" sx={{
                        ...TYPOGRAPHY.title3, fontWeight: 700, color: '#222222',
                    }}>
                        {t('app.menu.home')}
                    </Typography>
                </Box>
            </Box>

            {/* 스테이지 */}
            <Box sx={{
                flex: 1, minHeight: 0, overflow: 'hidden',
                display: 'flex', bgcolor: '#F5F6FA',
            }}>
                <Box sx={{
                    width: '100%', height: '100%', minHeight: 0, p: '16px',
                    display: 'flex', flexDirection: 'column', gap: '14px',
                }}>
                    {/* Row 1 — Hero + Templates */}
                    <Box sx={{
                        flexShrink: 0,
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', lg: '1fr 1.5fr' },
                        gridTemplateRows: '1fr',
                        gap: '14px', alignItems: 'stretch',
                    }}>
                        <HeroCard />
                        <TemplatesCard />
                    </Box>

                    {/* Row 2 — Quick Start (헤더 + 5카드 + 프롬프트 칩 3구획 통합 카드) */}
                    <Box sx={{ flexShrink: 0 }}>
                        <QuickStartCard />
                    </Box>

                    {/* Row 3 — 이어서 + 활동 */}
                    <Box sx={{
                        flex: 1, minHeight: 0,
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                        gap: '14px',
                    }}>
                        <ContinueCard />
                        <ActivityCard />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

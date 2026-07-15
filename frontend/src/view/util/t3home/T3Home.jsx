import React from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';

import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import iconHomeFill from '../../../assets/icons/home-fill.svg';
import SvgIcon from '../../../style/SvgIcon';
import { PALETTE, TYPOGRAPHY } from '../../../theme';

// -----------------------------------------------------------------------------
// 로컬 토큰 — home-redesign.html 의 상태 pill 색상 (soft bg + darker fg 조합).
// PALETTE.success/warning/error/info 는 밝은 accent 색이라 pill 배경/글자 대비가
// 부족해 별도 정의. 필요 시 향후 semanticTokens 로 이관.
// -----------------------------------------------------------------------------
const STATUS = {
    successBg: '#E8F5EE', successFg: '#3F9469',
    warningBg: '#FBF1DE', warningFg: '#A87516',
    errorBg:   '#FBE9EA', errorFg:   '#B84B4E',
    infoBg:    '#E6F2F7', infoFg:    '#1F6E88',
    purpleBg:  '#EEEBF6', purpleFg:  '#6B5AB0',
};

const CARD_SX = {
    bgcolor: '#FFFFFF',
    border: `1px solid ${PALETTE.panelBorder}`,
    borderRadius: '12px',
    p: '20px 22px',
};

// =============================================================================
// 재사용 컴포넌트
// =============================================================================

function CardHead({ title, count, action }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: '14px' }}>
            <Typography sx={{ ...TYPOGRAPHY.title3, color: PALETTE.textPrimary }}>
                {title}
                {count != null && (
                    <Box component="span" sx={{ ml: '6px', ...TYPOGRAPHY.body5, color: PALETTE.textMuted, fontWeight: 500 }}>
                        {count}
                    </Box>
                )}
            </Typography>
            {action && (
                <Box
                    role="button"
                    sx={{
                        ...TYPOGRAPHY.caption2, color: PALETTE.textSecondary,
                        px: '10px', py: '4px', cursor: 'pointer',
                        border: `1px solid ${PALETTE.panelBorder}`, borderRadius: '6px',
                        bgcolor: '#FFFFFF',
                        '&:hover': { bgcolor: '#F9FAFB' },
                    }}
                >
                    {action}
                </Box>
            )}
        </Box>
    );
}

function Pill({ variant, children }) {
    const map = {
        done: { bg: STATUS.successBg, fg: STATUS.successFg },
        fail: { bg: STATUS.errorBg,   fg: STATUS.errorFg   },
        new:  { bg: STATUS.infoBg,    fg: STATUS.infoFg    },
        edit: { bg: STATUS.warningBg, fg: STATUS.warningFg },
    };
    const c = map[variant] || map.new;
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            fontSize: 10.5, fontWeight: 600,
            fontFamily: TYPOGRAPHY.fontFamily,
            px: '8px', py: '2px', borderRadius: '999px',
            bgcolor: c.bg, color: c.fg,
        }}>
            <Box component="span" sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'currentColor' }} />
            {children}
        </Box>
    );
}

function ProgressRing({ value, max, tone = PALETTE.primary }) {
    const R = 16;
    const CIRC = 2 * Math.PI * R;
    const offset = CIRC * (1 - value / max);
    return (
        <Box sx={{ position: 'relative', width: 40, height: 40, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <svg width={40} height={40} viewBox="0 0 40 40">
                <circle cx={20} cy={20} r={R} fill="none" stroke="#F1F3F5" strokeWidth={3} />
                <circle
                    cx={20} cy={20} r={R} fill="none" stroke={tone} strokeWidth={3}
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={offset}
                    transform="rotate(-90 20 20)"
                />
            </svg>
            <Box sx={{
                position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
                fontSize: 11, fontWeight: 700, color: tone,
                fontVariantNumeric: 'tabular-nums',
                fontFamily: TYPOGRAPHY.fontFamily,
            }}>
                {value}/{max}
            </Box>
        </Box>
    );
}

// =============================================================================
// Row 1 — Hero (인사말 + 오늘의 팁 캐러셀)
// =============================================================================

function HeroCard() {
    return (
        <Box sx={{
            position: 'relative', overflow: 'hidden',
            borderRadius: '12px',
            border: `1px solid ${PALETTE.primaryBorder}`,
            background: `linear-gradient(135deg, ${PALETTE.primarySoft} 0%, #FFFFFF 65%)`,
            p: '24px 24px 22px',
            display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
            {/* 데코 원 */}
            <Box sx={{
                position: 'absolute', right: -40, top: -40,
                width: 160, height: 160, borderRadius: '50%',
                background: `radial-gradient(circle, ${PALETTE.primaryLight} 0%, transparent 70%)`,
                opacity: 0.30,
                pointerEvents: 'none',
            }} />
            <Box sx={{
                position: 'absolute', right: 20, bottom: -60,
                width: 100, height: 100, borderRadius: '50%',
                background: `radial-gradient(circle, ${PALETTE.primary} 0%, transparent 65%)`,
                opacity: 0.16,
                pointerEvents: 'none',
            }} />

            <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                <Typography component="h2" sx={{
                    ...TYPOGRAPHY.title1, fontWeight: 700,
                    color: PALETTE.textPrimary,
                    lineHeight: 1.25, mt: '24px'
                }}>
                    안녕하세요 👋
                </Typography>

                <Typography sx={{
                    ...TYPOGRAPHY.body4, color: PALETTE.textSecondary,
                    lineHeight: 1.55,
                }}>
                    T³Composer로 더 빠르고 정확하게 화면을 만들어보세요.
                </Typography>

                <Box sx={{ display: 'flex', gap: '8px' }}>
                    <Button
                        variant="outlined"
                        sx={{
                            borderColor: PALETTE.primaryBorder,
                            color: PALETTE.primaryDark,
                            bgcolor: 'transparent',
                            ...TYPOGRAPHY.label2, fontWeight: 600,
                            px: '14px', py: '9px', borderRadius: '8px',
                            textTransform: 'none', mt: '30px',
                            '&:hover': {
                                bgcolor: '#FFFFFF',
                                borderColor: PALETTE.primaryBorder,
                            },
                        }}
                    >
                        가이드 보기
                    </Button>
                </Box>

                {/* 오늘의 팁 카드 */}
                <Box sx={{
                    mt: 'auto',
                    bgcolor: 'rgba(255,255,255,0.60)',
                    border: '1px solid rgba(200,239,246,0.5)',
                    borderRadius: '10px',
                    p: '14px 16px',
                    display: 'flex', flexDirection: 'column', gap: '10px',
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            fontSize: 10.5, fontWeight: 700,
                            color: PALETTE.primaryDark,
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                            fontFamily: TYPOGRAPHY.fontFamily,
                        }}>
                            <ChatBubbleOutlineIcon sx={{ fontSize: 12 }} />
                            오늘의 팁
                        </Box>
                        <Box sx={{
                            fontSize: 11, color: PALETTE.textMuted,
                            fontVariantNumeric: 'tabular-nums',
                            fontFamily: TYPOGRAPHY.fontFamily,
                        }}>
                            3 <Box component="span" sx={{ opacity: 0.55 }}>/ 12</Box>
                        </Box>
                    </Box>
                    <Typography sx={{
                        fontSize: 12.5, color: PALETTE.textPrimary, lineHeight: 1.55,
                        fontFamily: TYPOGRAPHY.fontFamily,
                    }}>
                        유사한 원본 화면을 <b style={{ color: PALETTE.primaryDark, fontWeight: 700 }}>복사해서 시작</b>하면 첫 시도 성공률이 <b style={{ color: PALETTE.primaryDark, fontWeight: 700 }}>15%</b> 더 높습니다.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            {[0, 1, 2, 3, 4].map((i) => (
                                <Box
                                    key={i}
                                    sx={{
                                        width: i === 2 ? 16 : 5,
                                        height: 5,
                                        borderRadius: i === 2 ? '3px' : '50%',
                                        bgcolor: i === 2 ? PALETTE.primary : '#F1F3F5',
                                        transition: 'all .2s',
                                    }}
                                />
                            ))}
                        </Box>
                        <Box sx={{ display: 'flex', gap: '4px' }}>
                            <IconButton
                                size="small"
                                aria-label="이전 팁"
                                sx={{
                                    width: 24, height: 24, borderRadius: '6px',
                                    border: `1px solid ${PALETTE.panelBorder}`,
                                    bgcolor: '#FFFFFF', color: PALETTE.textSecondary,
                                    '&:hover': {
                                        borderColor: PALETTE.primaryBorder,
                                        color: PALETTE.primaryDark,
                                        bgcolor: PALETTE.primarySoft,
                                    },
                                }}
                            >
                                <ChevronLeftIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                            <IconButton
                                size="small"
                                aria-label="다음 팁"
                                sx={{
                                    width: 24, height: 24, borderRadius: '6px',
                                    border: `1px solid ${PALETTE.panelBorder}`,
                                    bgcolor: '#FFFFFF', color: PALETTE.textSecondary,
                                    '&:hover': {
                                        borderColor: PALETTE.primaryBorder,
                                        color: PALETTE.primaryDark,
                                        bgcolor: PALETTE.primarySoft,
                                    },
                                }}
                            >
                                <ChevronRightIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

// =============================================================================
// Row 1 — Insight (KPI 4 + 요일별 생성 수 + 자주 쓴 패턴)
// =============================================================================

function Metric({ label, value, unit, extra }) {
    return (
        <Box sx={{
            bgcolor: PALETTE.bgDefault, borderRadius: '10px',
            p: '14px 16px', minHeight: 100,
            display: 'flex', flexDirection: 'column', gap: '5px', justifyContent: 'space-between',
        }}>
            <Typography sx={{
                fontSize: 11, color: PALETTE.textMuted,
                fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase',
                fontFamily: TYPOGRAPHY.fontFamily,
            }}>
                {label}
            </Typography>
            <Box sx={{
                display: 'flex', alignItems: 'baseline', gap: '3px',
                fontSize: 24, fontWeight: 700, color: PALETTE.textPrimary,
                letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
                fontFamily: TYPOGRAPHY.fontFamily,
            }}>
                {value}
                {unit && (
                    <Box component="span" sx={{ fontSize: 12, color: PALETTE.textMuted, fontWeight: 500 }}>
                        {unit}
                    </Box>
                )}
            </Box>
            {extra}
        </Box>
    );
}

function Delta({ dir, children }) {
    const isUp = dir === 'up';
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            fontSize: 11.5, fontWeight: 600,
            color: isUp ? STATUS.successFg : STATUS.errorFg,
            fontFamily: TYPOGRAPHY.fontFamily,
        }}>
            {isUp ? <ArrowUpwardIcon sx={{ fontSize: 11 }} /> : <ArrowDownwardIcon sx={{ fontSize: 11 }} />}
            {children}
        </Box>
    );
}

function InsightCard() {
    // 요일별 생성 수 (mock)
    const weekBars = [
        { day: '월', h: 38 }, { day: '화', h: 62 }, { day: '수', h: 48 },
        { day: '목', h: 78 }, { day: '금', h: 55 }, { day: '토', h: 90 },
        { day: '일', h: 68, today: true },
    ];
    const topPatterns = [
        { rank: 1, name: 'CRUD Grid',     count: 18 },
        { rank: 2, name: 'Dashboard',     count: 12 },
        { rank: 3, name: 'Master Detail', count: 9  },
    ];

    return (
        <Box sx={{ ...CARD_SX, display: 'flex', flexDirection: 'column' }}>
            <CardHead title="이번 주 인사이트" action="7일 · 30일" />

            {/* KPI 4 */}
            <Box sx={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px',
            }}>
                <Metric
                    label="오늘 생성" value="12" unit="건"
                    extra={
                        <svg width="100%" height="22" viewBox="0 0 100 22" preserveAspectRatio="none">
                            <path
                                d="M0,17 L14,14 L28,16 L42,10 L56,12 L70,6 L84,8 L100,3"
                                fill="none" stroke={PALETTE.primary} strokeWidth={1.8} strokeLinecap="round"
                            />
                            <circle cx="100" cy="3" r="2.2" fill={PALETTE.primary} />
                        </svg>
                    }
                />
                <Metric
                    label="이번 달 사용량" value="23" unit="%"
                    extra={
                        <>
                            <Box sx={{ height: 4, bgcolor: '#F1F3F5', borderRadius: '2px', overflow: 'hidden' }}>
                                <Box sx={{ width: '23%', height: '100%', bgcolor: PALETTE.primary }} />
                            </Box>
                            <Typography sx={{
                                fontSize: 10.5, color: PALETTE.textMuted,
                                fontVariantNumeric: 'tabular-nums',
                                fontFamily: TYPOGRAPHY.fontFamily, mt: '1px',
                            }}>
                                230,000 / 1,000,000
                            </Typography>
                        </>
                    }
                />
                <Metric label="생성 성공률" value="92" unit="%" extra={<Delta dir="up">지난주 +4%p</Delta>} />
                <Metric label="평균 응답"   value="18" unit="초" extra={<Delta dir="down">지난주 -3s</Delta>} />
            </Box>

            {/* 하단 상세 — 요일 바 차트 + Top 3 패턴 */}
            <Box sx={{
                display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px',
                mt: '14px', flex: 1,
            }}>
                <Box sx={{ bgcolor: PALETTE.bgDefault, borderRadius: '10px', p: '14px 16px' }}>
                    <Box sx={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                        mb: '10px',
                    }}>
                        <Typography sx={{
                            fontSize: 11, color: PALETTE.textMuted, fontWeight: 600,
                            letterSpacing: '0.02em', textTransform: 'uppercase',
                            fontFamily: TYPOGRAPHY.fontFamily,
                        }}>
                            요일별 생성 수
                        </Typography>
                        <Typography sx={{
                            fontSize: 12, fontWeight: 600, color: PALETTE.textPrimary,
                            fontFamily: TYPOGRAPHY.fontFamily,
                        }}>
                            총 47건
                        </Typography>
                    </Box>
                    <Box sx={{
                        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px',
                        alignItems: 'end', height: 56,
                    }}>
                        {weekBars.map((b) => (
                            <Box
                                key={b.day}
                                sx={{
                                    height: `${b.h}%`,
                                    borderRadius: '3px 3px 0 0',
                                    bgcolor: b.today ? PALETTE.primaryDark : PALETTE.primary,
                                    opacity: b.today ? 1 : 0.85,
                                }}
                            />
                        ))}
                    </Box>
                    <Box sx={{
                        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px',
                        mt: '6px',
                    }}>
                        {weekBars.map((b) => (
                            <Box
                                key={b.day}
                                sx={{
                                    fontSize: 10.5, textAlign: 'center',
                                    color: b.today ? PALETTE.textPrimary : PALETTE.textMuted,
                                    fontWeight: b.today ? 600 : 400,
                                    fontFamily: TYPOGRAPHY.fontFamily,
                                }}
                            >
                                {b.day}
                            </Box>
                        ))}
                    </Box>
                </Box>

                <Box sx={{ bgcolor: PALETTE.bgDefault, borderRadius: '10px', p: '14px 16px' }}>
                    <Box sx={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: '10px',
                    }}>
                        <Typography sx={{
                            fontSize: 11, color: PALETTE.textMuted, fontWeight: 600,
                            letterSpacing: '0.02em', textTransform: 'uppercase',
                            fontFamily: TYPOGRAPHY.fontFamily,
                        }}>
                            자주 쓴 패턴
                        </Typography>
                        <Typography sx={{
                            fontSize: 12, fontWeight: 600, color: PALETTE.textPrimary,
                            fontFamily: TYPOGRAPHY.fontFamily,
                        }}>
                            Top 3
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {topPatterns.map((p) => (
                            <Box key={p.rank} sx={{
                                display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '10px',
                                alignItems: 'center', fontSize: 12.5,
                                fontFamily: TYPOGRAPHY.fontFamily,
                            }}>
                                <Box sx={{
                                    width: 18, height: 18, borderRadius: '5px',
                                    bgcolor: PALETTE.primarySoft, color: PALETTE.primaryDark,
                                    fontSize: 10.5, fontWeight: 700,
                                    display: 'grid', placeItems: 'center',
                                }}>
                                    {p.rank}
                                </Box>
                                <Box sx={{ color: PALETTE.textPrimary }}>{p.name}</Box>
                                <Box sx={{
                                    fontSize: 11.5, color: PALETTE.textMuted,
                                    fontVariantNumeric: 'tabular-nums',
                                }}>
                                    {p.count}회
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

// =============================================================================
// Row 2 — Quick Start (신규 3 + 기존 수정 2)
// =============================================================================

function QsSectionLabel({ children }) {
    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: 11.5, fontWeight: 700, color: PALETTE.primaryDark,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            fontFamily: TYPOGRAPHY.fontFamily,
            mb: '10px',
        }}>
            <Box sx={{ width: 14, height: 2, bgcolor: PALETTE.primary, borderRadius: '2px' }} />
            {children}
        </Box>
    );
}

function QsCard({ Icon, title, desc }) {
    return (
        <Box sx={{
            border: `1px solid ${PALETTE.panelBorder}`, borderRadius: '10px',
            p: '14px', bgcolor: '#FFFFFF',
            display: 'flex', gap: '12px', alignItems: 'flex-start',
            cursor: 'pointer', transition: 'all .15s',
            '&:hover': {
                borderColor: PALETTE.primaryBorder,
                bgcolor: PALETTE.primarySoft,
                transform: 'translateY(-1px)',
            },
        }}>
            <Box sx={{
                width: 36, height: 36, borderRadius: '8px', flexShrink: 0,
                bgcolor: PALETTE.primarySoft, color: PALETTE.primaryDark,
                display: 'grid', placeItems: 'center',
            }}>
                <Icon sx={{ fontSize: 18 }} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{
                    fontSize: 13.5, fontWeight: 600, color: PALETTE.textPrimary,
                    mb: '3px', fontFamily: TYPOGRAPHY.fontFamily,
                }}>
                    {title}
                </Typography>
                <Typography sx={{
                    fontSize: 11.5, color: PALETTE.textSecondary,
                    lineHeight: 1.4, fontFamily: TYPOGRAPHY.fontFamily,
                }}>
                    {desc}
                </Typography>
            </Box>
        </Box>
    );
}

function QuickStartCard() {
    return (
        <Box sx={CARD_SX}>
            <CardHead title="빠른 시작" />
            <Typography sx={{
                fontSize: 12.5, color: PALETTE.textSecondary, mt: '-8px', mb: '14px',
                fontFamily: TYPOGRAPHY.fontFamily,
            }}>
                원하는 방식으로 화면을 시작해보세요.
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: '22px' }}>
                <Box>
                    <QsSectionLabel>새 화면 만들기</QsSectionLabel>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        <QsCard Icon={ChatBubbleOutlineIcon} title="자연어로 생성" desc="요구사항을 설명하면 AI가 생성합니다." />
                        <QsCard Icon={ViewModuleIcon}        title="패턴으로 시작" desc="검증된 UI 패턴에서 시작합니다."     />
                        <QsCard Icon={ContentCopyIcon}       title="기존 화면 복사" desc="기존 화면을 복사해 시작합니다."     />
                    </Box>
                </Box>
                <Box>
                    <QsSectionLabel>기존 화면 수정</QsSectionLabel>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        <QsCard Icon={EditOutlinedIcon}        title="자연어로 수정"  desc="바꿀 내용을 설명하면 반영합니다."     />
                        <QsCard Icon={FormatListBulletedIcon}  title="단계별 수정"    desc="Spec을 확인하며 부분 변경합니다."    />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

// =============================================================================
// Row 3 — 이어서 작업하기
// =============================================================================

function ContinueItem({ done, total, tone, title, meta }) {
    return (
        <Box sx={{
            display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '14px',
            alignItems: 'center', p: '12px',
            border: `1px solid ${PALETTE.panelBorder}`, borderRadius: '10px',
            cursor: 'pointer', transition: 'all .15s',
            '&:hover': {
                borderColor: PALETTE.primaryBorder, bgcolor: PALETTE.primarySoft,
                '& .cont-btn': {
                    bgcolor: PALETTE.primary, color: '#fff',
                    borderColor: PALETTE.primary,
                },
            },
        }}>
            <ProgressRing value={done} max={total} tone={tone || PALETTE.primary} />
            <Box sx={{ minWidth: 0 }}>
                <Typography sx={{
                    fontSize: 13.5, fontWeight: 600, color: PALETTE.textPrimary, mb: '3px',
                    fontFamily: TYPOGRAPHY.fontFamily,
                }}>
                    {title}
                </Typography>
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
                    fontSize: 11.5, color: PALETTE.textMuted,
                    fontFamily: TYPOGRAPHY.fontFamily,
                }}>
                    {meta.map((m, i) => (
                        <React.Fragment key={i}>
                            {i > 0 && <Box component="span">·</Box>}
                            <Box component="span">{m.code || m.text}</Box>
                        </React.Fragment>
                    ))}
                </Box>
            </Box>
            <Box
                className="cont-btn"
                sx={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    px: '12px', py: '6px', borderRadius: '8px',
                    bgcolor: '#FFFFFF', border: `1px solid ${PALETTE.panelBorder}`,
                    fontSize: 12, color: PALETTE.textPrimary,
                    fontFamily: TYPOGRAPHY.fontFamily,
                    transition: 'all .15s',
                }}
            >
                이어서 <ArrowForwardIcon sx={{ fontSize: 12 }} />
            </Box>
        </Box>
    );
}

function ContinueCard() {
    const items = [
        { done: 3, total: 4, title: '재고 이동 관리 화면', meta: [
            { text: 'Step 3 · 데이터 바인딩' }, { code: '/inventory/StockMoveMgmt' }, { text: '20분 전' },
        ] },
        { done: 1, total: 4, title: 'PO 승인 대시보드', meta: [
            { text: 'Step 1 · 레이아웃' }, { code: 'draft' }, { text: '어제' },
        ] },
        { done: 7, total: 8, tone: STATUS.warningFg, title: '품목 마스터 리팩터', meta: [
            { text: '검토 대기' }, { code: '/util/ItemMaster' }, { text: '2일 전' },
        ] },
    ];

    return (
        <Box sx={{ ...CARD_SX, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <CardHead title="이어서 작업하기" count={items.length} action="모두 보기" />
            <Typography sx={{
                fontSize: 12.5, color: PALETTE.textSecondary, mt: '-8px', mb: '14px',
                fontFamily: TYPOGRAPHY.fontFamily,
            }}>
                진행 중이거나 저장만 된 세션입니다.
            </Typography>
            <Box sx={{
                flex: 1, minHeight: 0, overflow: 'auto',
                display: 'flex', flexDirection: 'column', gap: '8px',
                pr: '4px', // 스크롤바 여유
            }}>
                {items.map((it, i) => <ContinueItem key={i} {...it} />)}
            </Box>
        </Box>
    );
}

// =============================================================================
// Row 3 — 최근 활동
// =============================================================================

function FilterChip({ on, count, children }) {
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            px: '12px', py: '5px', borderRadius: '999px',
            border: on ? `1px solid ${PALETTE.primary}` : `1px solid ${PALETTE.panelBorder}`,
            bgcolor: on ? PALETTE.primary : '#FFFFFF',
            color: on ? '#FFFFFF' : PALETTE.textSecondary,
            fontSize: 12, fontWeight: on ? 600 : 400,
            fontFamily: TYPOGRAPHY.fontFamily,
            cursor: 'pointer',
        }}>
            {children}
            <Box component="span" sx={{
                fontSize: 10.5, px: '6px', py: '1px', borderRadius: '999px',
                bgcolor: on ? 'rgba(255,255,255,0.22)' : PALETTE.bgDefault,
                color: on ? '#FFFFFF' : PALETTE.textSecondary,
            }}>
                {count}
            </Box>
        </Box>
    );
}

function FeedItem({ kind, title, pill, meta, time }) {
    const kindMap = {
        ai:   { bg: STATUS.purpleBg, fg: STATUS.purpleFg, Icon: AutoAwesomeIcon },
        edit: { bg: STATUS.infoBg,   fg: STATUS.infoFg,   Icon: EditOutlinedIcon },
    };
    const k = kindMap[kind] || kindMap.ai;
    const KIcon = k.Icon;
    return (
        <Box sx={{
            display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: '12px',
            alignItems: 'center', py: '11px',
            borderBottom: `1px solid #F1F3F5`,
            '&:last-child': { borderBottom: 'none' },
        }}>
            <Box sx={{
                width: 32, height: 32, borderRadius: '8px',
                bgcolor: k.bg, color: k.fg,
                display: 'grid', placeItems: 'center', flexShrink: 0,
            }}>
                <KIcon sx={{ fontSize: 16 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography sx={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: 13.5, fontWeight: 500, color: PALETTE.textPrimary,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    fontFamily: TYPOGRAPHY.fontFamily,
                }}>
                    {title}
                </Typography>
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: '8px', mt: '3px',
                    fontSize: 11.5, color: PALETTE.textMuted,
                    fontFamily: TYPOGRAPHY.fontFamily,
                }}>
                    <Pill variant={pill}>{pill === 'done' ? '완료' : pill === 'fail' ? '실패' : pill === 'edit' ? '수정' : '신규'}</Pill>
                    <span>{meta}</span>
                </Box>
            </Box>
            <Box sx={{
                fontSize: 12, color: PALETTE.textMuted,
                fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                fontFamily: TYPOGRAPHY.fontFamily,
            }}>
                {time}
            </Box>
        </Box>
    );
}

function ActivityCard() {
    const feed = [
        { kind: 'ai',   title: 'BOM Detail 생성 완료',      pill: 'done', meta: 'AI 생성 · /util/BOMDetail',    time: '5분 전'  },
        { kind: 'edit', title: 'BOM Detail 수정',          pill: 'edit', meta: '컬럼 3개 추가 · 정렬 변경',    time: '7분 전'  },
        { kind: 'ai',   title: 'Inventory Dashboard 완료', pill: 'done', meta: 'AI 생성 · 위젯 4개',          time: '1시간 전' },
        { kind: 'ai',   title: 'Item Master',              pill: 'new',  meta: 'AI 생성 · 오후 4:12',         time: '어제'    },
        { kind: 'edit', title: 'Supplier 등록 화면 수정',   pill: 'edit', meta: 'Validation 규칙 추가',        time: '어제'    },
        { kind: 'ai',   title: 'Workflow 승인 화면 실패',   pill: 'fail', meta: 'SP 컬럼 오류 · 재시도 필요',  time: '2일 전'  },
    ];
    return (
        <Box sx={{ ...CARD_SX, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <CardHead title="최근 활동" count={13} action="전체 보기" />
            <Box sx={{ display: 'flex', gap: '6px', mb: '12px', flexWrap: 'wrap', flexShrink: 0 }}>
                <FilterChip on count={13}>전체</FilterChip>
                <FilterChip count={7}>AI 생성</FilterChip>
                <FilterChip count={5}>수정</FilterChip>
                <FilterChip count={1}>실패</FilterChip>
            </Box>
            <Box sx={{
                flex: 1, minHeight: 0, overflow: 'auto',
                display: 'flex', flexDirection: 'column',
                pr: '4px',
            }}>
                {feed.map((f, i) => <FeedItem key={i} {...f} />)}
            </Box>
        </Box>
    );
}

// =============================================================================
// 페이지 — 헤더 + 3-Row 스테이지
// =============================================================================

export default function T3Home() {
    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#FFFFFF' }}>
            {/* 화면 헤더 (Figma 54:2612) */}
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
                        ...TYPOGRAPHY.title3, fontWeight: 700,
                        color: '#222222',
                    }}>
                        Home
                    </Typography>
                </Box>
            </Box>

            {/* 스테이지 — 세로 스크롤 없음. 남는 공간은 Row 3 이 채우고 내부 목록만 스크롤 */}
            <Box sx={{
                flex: 1, minHeight: 0, overflow: 'hidden',
                display: 'flex',
            }}>
                <Box sx={{
                    width: '100%',
                    height: '100%', minHeight: 0,
                    p: '24px',
                    display: 'flex', flexDirection: 'column', gap: '16px',
                }}>
                    {/* Row 1 — Hero + Insight (auto 높이) */}
                    <Box sx={{
                        flexShrink: 0,
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', lg: '1fr 1.65fr' },
                        gap: '16px', alignItems: 'stretch',
                    }}>
                        <HeroCard />
                        <InsightCard />
                    </Box>

                    {/* Row 2 — Quick Start (auto 높이) */}
                    <Box sx={{ flexShrink: 0 }}>
                        <QuickStartCard />
                    </Box>

                    {/* Row 3 — 이어서 + 활동 (남은 공간 채움, 내부 목록만 스크롤) */}
                    <Box sx={{
                        flex: 1, minHeight: 0,
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                        gap: '16px',
                    }}>
                        <ContinueCard />
                        <ActivityCard />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

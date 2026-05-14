import React, { useEffect, useState } from 'react';

import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Avatar,
} from '@mui/material';
import AutoAwesomeIcon       from '@mui/icons-material/AutoAwesome';
import DescriptionIcon       from '@mui/icons-material/Description';
import ContentCopyIcon       from '@mui/icons-material/ContentCopy';
import ChatIcon              from '@mui/icons-material/Chat';
import BorderColorIcon       from '@mui/icons-material/BorderColor';
import AddCircleOutlineIcon  from '@mui/icons-material/AddCircleOutline';
import SettingsIcon          from '@mui/icons-material/Settings';
import CheckCircleIcon       from '@mui/icons-material/CheckCircle';
import WarningAmberIcon      from '@mui/icons-material/WarningAmber';
import ArrowForwardIcon      from '@mui/icons-material/ArrowForward';
import ArrowBackIcon         from '@mui/icons-material/ArrowBack';
import HistoryIcon           from '@mui/icons-material/History';

import { useLocation, useHistory } from 'react-router-dom';

import { ContentInner, WorkArea } from '@wingui/common/imports';

import { getApiKeyStatus, getSession } from './api';
import ApiKeyDialog from './ApiKeyDialog';
import ModeNewGeneral    from './ModeNewGeneral';
import ModeNewFromDesign from './ModeNewFromDesign';
import ModeNewFromCopy   from './ModeNewFromCopy';
import ModeExistingModify from './ModeExistingModify';
import ComposerWorkspace from './ComposerWorkspace';
import TargetSystemSelector from './TargetSystemSelector';

const MODE = {
  NEW_FROM_DESIGN: 'NEW_FROM_DESIGN',
  NEW_FROM_COPY:   'NEW_FROM_COPY',
  NEW_NL:          'NEW_NL',
  EXISTING_MODIFY: 'EXISTING_MODIFY',
};

// ===== 상위 2 카테고리 =====
const CATEGORY_NEW = {
  key: 'NEW',
  title: '신규 개발',
  subtitle: 'New Development',
  icon: AddCircleOutlineIcon,
  gradient: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 50%, #7e22ce 100%)',
  accent: '#4338ca',
};
const CATEGORY_MODIFY = {
  key: MODE.EXISTING_MODIFY,
  title: '기존 화면 수정',
  subtitle: 'Modify Existing',
  icon: BorderColorIcon,
  gradient: 'linear-gradient(135deg, #9a3412 0%, #ea580c 50%, #f59e0b 100%)',
  accent: '#ea580c',
};

// ===== 신규 개발 하위 3종 =====
// (단계별 생성은 설계서 기반·기존 화면 복사 안에서 자동 진행되므로 메뉴에서 제외)
// 표시 순서: 자연어 생성(가장 자유로움) → 기존 화면 복사 → 설계서 기반
const NEW_MODE_OPTIONS = [
  { key: MODE.NEW_NL,          step: 1, title: '자연어 생성',         sub: 'Natural Lang.', icon: ChatIcon,        color: '#0d9488' },
  { key: MODE.NEW_FROM_COPY,   step: 2, title: '기존 화면 복사',     sub: 'Copy Existing', icon: ContentCopyIcon, color: '#059669' },
  { key: MODE.NEW_FROM_DESIGN, step: 3, title: '설계서 기반',       sub: 'From Design',   icon: DescriptionIcon, color: '#2563eb' },
];

/**
 * 입체 보더 스타일 (재사용).
 * 다층 box-shadow + inset 하이라이트로 embossed 효과.
 */
function embossedPaper(accent, hovered = false) {
  return {
    position: 'relative',
    borderRadius: 3,
    bgcolor: '#fff',
    border: '1px solid rgba(15,23,42,0.08)',
    boxShadow: hovered
      ? [
          `0 0 0 4px ${accent}18`,
          `0 18px 48px -12px ${accent}55`,
          `0 1px 0 rgba(255,255,255,0.9) inset`,
          `0 -1px 0 rgba(15,23,42,0.06) inset`,
        ].join(', ')
      : [
          `0 1px 0 rgba(255,255,255,0.9) inset`,
          `0 -1px 0 rgba(15,23,42,0.04) inset`,
          `0 6px 16px -6px rgba(15,23,42,0.12)`,
          `0 14px 36px -16px rgba(15,23,42,0.18)`,
        ].join(', '),
    transition: 'all 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
  };
}

// =====================================================================
// 대분류 선택 (1단계 Landing)
// =====================================================================
function LandingSelector({ onPickNew, onPickModify, onOpenSettings, apiKeyRegistered }) {
  const [hovered, setHovered] = useState(null);
  const history = useHistory();

  return (
    <Box sx={{
      flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
      bgcolor: '#f1f5f9',
      backgroundImage: 'radial-gradient(circle at 20% 0%, rgba(79,70,229,0.08), transparent 50%), radial-gradient(circle at 80% 100%, rgba(234,88,12,0.08), transparent 50%)',
      p: 2, gap: 2, overflow: 'auto',
    }}>
      {/* ===== Compact Hero ===== */}
      <Paper
        elevation={0}
        sx={{
          ...embossedPaper('#4338ca'),
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #4338ca 100%)',
          color: '#fff',
          px: 3, py: 2,
          border: 'none',
        }}
      >
        {/* Decoration */}
        <Box sx={{ position: 'absolute', top: -30, right: -10, width: 140, height: 140,
                   borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Box sx={{ position: 'absolute', bottom: -40, left: 140, width: 120, height: 120,
                   borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />

        <Stack direction="row" alignItems="center" spacing={2} sx={{ position: 'relative' }}>
          <Avatar sx={{
            bgcolor: 'rgba(255,255,255,0.22)', color: '#fff',
            width: 54, height: 54, border: '2px solid rgba(255,255,255,0.28)',
            boxShadow: '0 0 20px rgba(255,255,255,0.15)',
          }}>
            <AutoAwesomeIcon sx={{ fontSize: 30 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.1,
                                              letterSpacing: -0.5,
                                              textShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
                T3Composer
              </Typography>
              <Chip label="AI" size="small" sx={{
                height: 20, fontSize: 11, fontWeight: 800,
                bgcolor: 'rgba(255,255,255,0.22)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
              }} />
            </Stack>
            <Typography variant="body2" sx={{ opacity: 0.88, mt: 0.3 }}>
              AI 화면 생성기 · 개발 방식을 선택하세요
            </Typography>
          </Box>

          {/* Target System Selector — 다중 프로젝트 전환 */}
          <TargetSystemSelector darkMode />

          {/* API Key pill */}
          <Tooltip title={apiKeyRegistered ? 'API 키 등록됨 — 모든 모드 사용 가능' : 'API 키 미등록 — 클릭하여 등록'}>
            <Box
              onClick={onOpenSettings}
              sx={{
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.6,
                px: 1.5, py: 0.7, borderRadius: 5,
                bgcolor: apiKeyRegistered ? 'rgba(16,185,129,0.22)' : 'rgba(245,158,11,0.28)',
                border: `1px solid ${apiKeyRegistered ? 'rgba(16,185,129,0.5)' : 'rgba(245,158,11,0.6)'}`,
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
                '&:hover': { transform: 'scale(1.03)' },
              }}
            >
              {apiKeyRegistered
                ? <CheckCircleIcon sx={{ fontSize: 16, color: '#6ee7b7' }} />
                : <WarningAmberIcon sx={{ fontSize: 16, color: '#fcd34d' }} />}
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#fff' }}>
                {apiKeyRegistered ? 'API Key 등록' : 'API Key 필요'}
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip title="작업 이력 — 진행중·완료·보관 세션 관리">
            <IconButton size="small" onClick={() => history.push('/history')} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="설정">
            <IconButton size="small" onClick={onOpenSettings} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {/* ===== 2 Big Category Cards ===== */}
      <Box sx={{
        flex: 1, display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 3, alignItems: 'stretch',
        minHeight: 360,
      }}>
        {[CATEGORY_NEW, CATEGORY_MODIFY].map((cat) => {
          const Icon = cat.icon;
          const isHover = hovered === cat.key;
          return (
            <Paper
              key={cat.key}
              elevation={0}
              onClick={() => cat.key === 'NEW' ? onPickNew() : onPickModify()}
              onMouseEnter={() => setHovered(cat.key)}
              onMouseLeave={() => setHovered(null)}
              sx={{
                ...embossedPaper(cat.accent, isHover),
                cursor: 'pointer', overflow: 'hidden',
                transform: isHover ? 'translateY(-4px)' : 'translateY(0)',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Gradient header band */}
              <Box sx={{
                height: 130, background: cat.gradient,
                position: 'relative', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderBottom: '1px solid rgba(0,0,0,0.08)',
                boxShadow: 'inset 0 -8px 20px rgba(0,0,0,0.15)',
              }}>
                <Box sx={{ position: 'absolute', top: -40, right: -20, width: 200, height: 200,
                           borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
                <Box sx={{ position: 'absolute', bottom: -50, left: -20, width: 150, height: 150,
                           borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.1)' }} />
                <Avatar sx={{
                  width: 80, height: 80,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  border: '3px solid rgba(255,255,255,0.35)',
                  color: '#fff', zIndex: 1,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.25), 0 0 0 8px rgba(255,255,255,0.08)',
                }}>
                  <Icon sx={{ fontSize: 44 }} />
                </Avatar>
              </Box>

              {/* Body */}
              <Box sx={{
                flex: 1, p: 3,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', textAlign: 'center',
                gap: 0.4,
              }}>
                <Typography variant="caption" sx={{
                  color: cat.accent, fontWeight: 800, letterSpacing: 2,
                  textTransform: 'uppercase', fontSize: 11,
                }}>
                  {cat.subtitle}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: -0.3 }}>
                  {cat.title}
                </Typography>

                <Box sx={{ flex: 1 }} />

                <Button
                  variant="contained"
                  disableElevation
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    mt: 1.5, px: 4, py: 1.2,
                    bgcolor: cat.accent,
                    fontWeight: 700, fontSize: 14,
                    borderRadius: 2,
                    boxShadow: `0 4px 14px ${cat.accent}55, 0 1px 0 rgba(255,255,255,0.5) inset`,
                    '&:hover': {
                      bgcolor: cat.accent,
                      filter: 'brightness(1.1)',
                      boxShadow: `0 6px 20px ${cat.accent}88, 0 1px 0 rgba(255,255,255,0.5) inset`,
                    },
                  }}
                >
                  선택
                </Button>
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}

// =====================================================================
// 신규 개발 — 4종 선택 (2단계)
// =====================================================================
function NewModeSelector({ onSelect, onBack }) {
  const [hovered, setHovered] = useState(null);

  return (
    <Box sx={{
      flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
      bgcolor: '#f1f5f9',
      backgroundImage: 'radial-gradient(circle at 20% 0%, rgba(79,70,229,0.08), transparent 50%)',
      p: 2, gap: 2, overflow: 'auto',
    }}>
      {/* Sub header */}
      <Paper elevation={0} sx={{
        ...embossedPaper('#4338ca'),
        px: 2.5, py: 1.5,
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton onClick={onBack} size="small"
                      sx={{ bgcolor: '#f1f5f9', border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 2px rgba(15,23,42,0.08), 0 1px 0 rgba(255,255,255,0.8) inset' }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Avatar sx={{
            width: 38, height: 38,
            bgcolor: '#4338ca22', color: '#4338ca',
            border: '1px solid #4338ca55',
            boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset',
          }}>
            <AddCircleOutlineIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
              신규 개발
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              3가지 방식 중 하나를 선택하세요
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* 3 cards */}
      <Box sx={{
        flex: 1, display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
        gap: 2, alignItems: 'stretch',
        minHeight: 280,
      }}>
        {NEW_MODE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isHover = hovered === opt.key;
          return (
            <Paper
              key={opt.key}
              elevation={0}
              onClick={() => onSelect(opt.key)}
              onMouseEnter={() => setHovered(opt.key)}
              onMouseLeave={() => setHovered(null)}
              sx={{
                ...embossedPaper(opt.color, isHover),
                cursor: 'pointer', overflow: 'hidden',
                transform: isHover ? 'translateY(-6px)' : 'translateY(0)',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Top number band */}
              <Box sx={{
                height: 8,
                background: `linear-gradient(90deg, ${opt.color} 0%, ${opt.color}aa 100%)`,
                boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.1)',
              }} />

              <Box sx={{
                flex: 1, p: 2.5,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', textAlign: 'center',
                gap: 0.6,
                position: 'relative',
              }}>
                {/* Step number watermark */}
                <Box sx={{
                  position: 'absolute', top: 4, right: 10,
                  fontFamily: 'monospace', fontWeight: 900, fontSize: 52,
                  color: `${opt.color}14`, lineHeight: 1,
                  userSelect: 'none',
                }}>
                  {opt.step}
                </Box>

                {/* Icon circle */}
                <Avatar sx={{
                  width: 64, height: 64, mt: 1,
                  bgcolor: `${opt.color}14`, color: opt.color,
                  border: `2px solid ${opt.color}33`,
                  boxShadow: `
                    0 0 0 6px ${opt.color}08,
                    0 6px 16px -4px ${opt.color}55,
                    0 1px 0 rgba(255,255,255,0.9) inset
                  `,
                }}>
                  <Icon sx={{ fontSize: 32 }} />
                </Avatar>

                <Typography variant="caption" sx={{
                  color: opt.color, fontWeight: 800, letterSpacing: 1.5,
                  textTransform: 'uppercase', fontSize: 10, mt: 1,
                }}>
                  {opt.sub}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.25 }}>
                  {opt.title}
                </Typography>

                <Box sx={{ flex: 1 }} />

                <Button
                  variant="outlined"
                  size="small"
                  endIcon={<ArrowForwardIcon fontSize="small" />}
                  sx={{
                    mt: 1, px: 2, py: 0.6,
                    borderColor: `${opt.color}55`,
                    color: opt.color,
                    fontWeight: 700,
                    borderRadius: 1.5,
                    bgcolor: '#fff',
                    boxShadow: `0 1px 2px rgba(15,23,42,0.08), 0 1px 0 rgba(255,255,255,0.8) inset`,
                    '&:hover': {
                      borderColor: opt.color,
                      bgcolor: `${opt.color}08`,
                      boxShadow: `0 2px 6px ${opt.color}44, 0 1px 0 rgba(255,255,255,0.8) inset`,
                    },
                  }}
                >
                  시작
                </Button>
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}

// =====================================================================
// Main
// =====================================================================
function T3Composer() {
  const [step, setStep] = useState('landing');             // 'landing' | 'new'
  const [mode, setMode] = useState(null);                   // 선택된 실행 모드
  const [apiKeyRegistered, setApiKeyReg]    = useState(null);
  const [apiKeyDialogOpen, setApiKeyDialog] = useState(false);

  // 히스토리 화면의 "이어하기" 로 진입 시 state 로 세션을 넘겨받아 ComposerWorkspace 를 바로 렌더
  const location = useLocation();
  const history  = useHistory();
  const [resumeSession, setResumeSession] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError]     = useState(null);

  const checkApiKey = async () => {
    try {
      const res = await getApiKeyStatus();
      setApiKeyReg(!!res?.data?.registered);
    } catch {
      setApiKeyReg(false);
    }
  };

  useEffect(() => { checkApiKey(); }, []);

  // location.state.resumeSessionId 감지 → 세션 객체 로드 후 ComposerWorkspace 렌더
  useEffect(() => {
    const rid = location?.state?.resumeSessionId;
    if (!rid) return;
    (async () => {
      setResumeLoading(true);
      setResumeError(null);
      try {
        const res = await getSession(rid);
        setResumeSession(res?.data || null);
      } catch (e) {
        setResumeError(e?.response?.data?.message || e?.message || '세션 로드 실패');
      } finally {
        setResumeLoading(false);
      }
    })();
  }, [location?.state?.resumeSessionId]);

  // Tab Container 방식 — 이력 [이어하기] 가 window event 로 resume 요청
  useEffect(() => {
    const h = async (e) => {
      const rid = e?.detail?.sessionId;
      if (!rid) return;
      setResumeLoading(true);
      setResumeError(null);
      try {
        const res = await getSession(rid);
        setResumeSession(res?.data || null);
      } catch (err) {
        setResumeError(err?.response?.data?.message || err?.message || '세션 로드 실패');
      } finally {
        setResumeLoading(false);
      }
    };
    window.addEventListener('t3composer:resume', h);
    return () => window.removeEventListener('t3composer:resume', h);
  }, []);

  // ComposerWorkspace 에서 "종료" 누르면 resume 상태 해제 + URL state 청소
  const backFromResume = () => {
    setResumeSession(null);
    setResumeError(null);
    // location.state 의 resumeSessionId 를 제거한 상태로 같은 경로 재방문
    if (history && location) {
      history.replace({ pathname: location.pathname, search: location.search, state: {} });
    }
  };

  const requireKeyThen = (fn) => {
    if (!apiKeyRegistered) { setApiKeyDialog(true); return; }
    fn();
  };

  const handleApiKeySaved = async () => {
    setApiKeyDialog(false);
    await checkApiKey();
  };

  // 로딩
  if (apiKeyRegistered === null || resumeLoading) {
    return (
      <ContentInner>
        <WorkArea>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                     flexDirection: 'column', gap: 1.5, bgcolor: '#f1f5f9' }}>
            <CircularProgress sx={{ color: '#4338ca' }} />
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              {resumeLoading ? '이어하기 세션 로드 중...' : 'T3Composer 로딩 중...'}
            </Typography>
          </Box>
        </WorkArea>
      </ContentInner>
    );
  }

  // 히스토리에서 "이어하기" 로 들어온 경우 — 모드 선택 스킵하고 Workspace 직접 노출
  if (resumeSession) {
    return (
      <ContentInner>
        <WorkArea>
          <ComposerWorkspace
            session={resumeSession}
            initialPrompt={null}
            extraHeader={
              <Button size="small"
                      startIcon={<ArrowBackIcon fontSize="small" />}
                      onClick={backFromResume}
                      sx={{ mr: 1 }}>
                종료
              </Button>
            }
          />
        </WorkArea>
      </ContentInner>
    );
  }

  if (resumeError) {
    return (
      <ContentInner>
        <WorkArea>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                     flexDirection: 'column', gap: 1.5, bgcolor: '#f1f5f9' }}>
            <Typography variant="body2" color="error">이어하기 세션 로드 실패</Typography>
            <Typography variant="caption" color="text.secondary">{resumeError}</Typography>
            <Button size="small" onClick={backFromResume} startIcon={<ArrowBackIcon />}>
              모드 선택으로 돌아가기
            </Button>
          </Box>
        </WorkArea>
      </ContentInner>
    );
  }

  const backToLanding = () => { setMode(null); setStep('landing'); };

  return (
    <ContentInner>
      <WorkArea>
        {mode === null && step === 'landing' && (
          <LandingSelector
            onPickNew={() => requireKeyThen(() => setStep('new'))}
            onPickModify={() => requireKeyThen(() => setMode(MODE.EXISTING_MODIFY))}
            onOpenSettings={() => setApiKeyDialog(true)}
            apiKeyRegistered={apiKeyRegistered}
          />
        )}

        {mode === null && step === 'new' && (
          <NewModeSelector
            onSelect={(m) => requireKeyThen(() => setMode(m))}
            onBack={() => setStep('landing')}
          />
        )}

        {mode === MODE.NEW_FROM_DESIGN && <ModeNewFromDesign  onBack={backToLanding} />}
        {mode === MODE.NEW_FROM_COPY   && <ModeNewFromCopy    onBack={backToLanding} />}
        {mode === MODE.NEW_NL          && <ModeNewGeneral     onBack={backToLanding} startWith="NL" />}
        {mode === MODE.EXISTING_MODIFY && <ModeExistingModify onBack={backToLanding} />}
      </WorkArea>

      <ApiKeyDialog
        open={apiKeyDialogOpen}
        onClose={() => setApiKeyDialog(false)}
        onSaved={handleApiKeySaved}
      />
    </ContentInner>
  );
}

export default T3Composer;

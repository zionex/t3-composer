import React, { useEffect, useState, useRef, useCallback } from 'react';

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
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
import PlaylistAddCheckIcon  from '@mui/icons-material/PlaylistAddCheck';
import ViewQuiltIcon         from '@mui/icons-material/ViewQuilt';

import { useLocation, useHistory } from 'react-router-dom';

import { ContentInner, WorkArea, showMessage } from '@wingui/common/imports';

import { getApiKeyStatus, getSession, pingTargetDbConnection } from './api';
import ApiKeyDialog from './ApiKeyDialog';
import ModeNewGeneral    from './ModeNewGeneral';
import ModeNewFromDesign from './ModeNewFromDesign';
import ModeNewFromCopy   from './ModeNewFromCopy';
import ModeNewStep       from './ModeNewStep';
import ModeExistingModify from './ModeExistingModify';
import ComposerWorkspace from './ComposerWorkspace';
import TargetSystemSelector from './TargetSystemSelector';
import { useTargetStore } from './targetStore';
import { glassPanel } from '../../../theme';

const MODE = {
  NEW_FROM_DESIGN: 'NEW_FROM_DESIGN',
  NEW_FROM_COPY:   'NEW_FROM_COPY',
  NEW_NL:          'NEW_NL',
  NEW_STEP:        'NEW_STEP',  // 2026-05-22: 단계별 생성 (Beta) — 패턴 picker → ComposerCanvas
  EXISTING_MODIFY: 'EXISTING_MODIFY',
};

// ===== 상위 2 카테고리 =====
const CATEGORY_NEW = {
  key: 'NEW',
  title: '신규 개발',
  subtitle: 'New Development',
  icon: AddCircleOutlineIcon,
  accent: '#7CA7E0',
  hint: '자연어 · 기존 화면 복사 · 설계서 기반으로 새 화면을 생성합니다',
};
const CATEGORY_MODIFY = {
  key: 'MODIFY',
  title: '기존 화면 수정',
  subtitle: 'Modify Existing',
  icon: BorderColorIcon,
  accent: '#E6C079',
  hint: '기존 화면의 소스를 불러와 자연어 또는 단계별로 수정합니다',
};

// ===== 신규 개발 하위 3종 ===== (key = 진입 MODE)
const NEW_MODE_OPTIONS = [
  { key: MODE.NEW_NL,          step: 1, title: '자연어 생성',     sub: 'Natural Lang.', icon: ChatIcon,        color: '#8FC4D4', hint: '요구사항을 자연어로 설명하면 Claude 가 패턴·코드를 생성합니다' },
  { key: MODE.NEW_STEP,        step: 2, title: '단계별 생성 (Beta)', sub: 'Pattern + Visual', icon: ViewQuiltIcon, color: '#9D8FD4', hint: '패턴을 고른 뒤 시각 편집으로 데이터를 채웁니다 (Phase 1)' },
  { key: MODE.NEW_FROM_COPY,   step: 3, title: '기존 화면 복사', sub: 'Copy Existing', icon: ContentCopyIcon, color: '#86C7A8', hint: '기존 화면을 복사해 9단계 마법사로 수정합니다' },
  { key: MODE.NEW_FROM_DESIGN, step: 4, title: '설계서 기반',   sub: 'From Design',   icon: DescriptionIcon, color: '#7CA7E0', hint: '설계서(Excel)를 업로드해 화면을 생성합니다' },
];

// ===== 기존 화면 수정 하위 2종 ===== (key = ModeExistingModify 의 startWith)
const MODIFY_MODE_OPTIONS = [
  { key: 'NL',   step: 1, title: '자연어 수정', sub: 'NL Modify',   icon: ChatIcon,             color: '#8FC4D4', hint: '현재 화면 소스를 Claude 에 제공하고 자연어 대화로 수정 요청' },
  { key: 'STEP', step: 2, title: '단계별 수정', sub: 'Step Modify', icon: PlaylistAddCheckIcon, color: '#86C7A8', hint: '기존 화면을 9단계 Spec 으로 분해해 수정할 부분만 변경' },
];

/**
 * 입체 보더 스타일 (재사용).
 * theme 의 glassPanel(파스텔 글래스모피즘) 재사용.
 */
function embossedPaper(accent, hovered = false) {
  return { position: 'relative', ...glassPanel(accent, hovered) };
}

// =====================================================================
// 모드 선택 — 통합 단일 화면
//   상위 2 카테고리(신규 개발 / 기존 화면 수정) 를 클릭하면
//   하위 모드 카드가 펼쳐지고, 하위 카드를 누르면 해당 모드로 진입.
// =====================================================================
function ModeSelector({ onPickMode, onOpenSettings, apiKeyRegistered }) {
  const [hovered, setHovered] = useState(null);

  return (
    <Box sx={{
      flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
      bgcolor: 'transparent',
      backgroundImage: 'radial-gradient(circle at 20% 0%, rgba(124,167,224,0.14), transparent 55%), radial-gradient(circle at 80% 100%, rgba(230,192,121,0.12), transparent 55%)',
      p: 2, gap: 2, overflow: 'auto',
    }}>
      {/* ===== Hero ===== */}
      <Paper
        elevation={0}
        sx={{
          ...embossedPaper('#7CA7E0'),
          flexShrink: 0,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(169,199,238,0.55) 0%, rgba(157,180,212,0.50) 55%, rgba(183,174,221,0.50) 100%)',
          color: '#3A4A63',
          px: 3, py: 2,
        }}
      >
        <Box sx={{ position: 'absolute', top: -30, right: -10, width: 140, height: 140,
                   borderRadius: '50%', bgcolor: 'rgba(124,167,224,0.18)' }} />
        <Box sx={{ position: 'absolute', bottom: -40, left: 140, width: 120, height: 120,
                   borderRadius: '50%', bgcolor: 'rgba(124,167,224,0.12)' }} />

        <Stack direction="row" alignItems="center" spacing={2} sx={{ position: 'relative' }}>
          <Avatar sx={{
            bgcolor: 'rgba(255,255,255,0.60)', color: '#5683C0',
            width: 50, height: 50, border: '2px solid rgba(255,255,255,0.75)',
            boxShadow: '0 4px 14px -4px rgba(58,74,99,0.25)',
          }}>
            <AutoAwesomeIcon sx={{ fontSize: 26 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Tooltip title="AI 화면 생성기 — 신규 개발 또는 기존 화면 수정을 선택하세요">
                <Typography variant="h4" sx={{ lineHeight: 1.1, letterSpacing: -0.5, cursor: 'default' }}>
                  Composer
                </Typography>
              </Tooltip>
              <Chip label="AI" size="small" sx={{
                height: 19, fontSize: 10, fontWeight: 800,
                bgcolor: 'rgba(124,167,224,0.30)', color: '#5683C0',
                border: '1px solid rgba(124,167,224,0.45)',
              }} />
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.2, display: 'block' }}>
              AI 화면 생성기
            </Typography>
          </Box>

          <TargetSystemSelector />

          <Tooltip title={apiKeyRegistered ? 'API 키 등록됨 — 모든 모드 사용 가능' : 'API 키 미등록 — 클릭하여 등록'}>
            <Box
              onClick={onOpenSettings}
              sx={{
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.6,
                px: 1.5, py: 0.7, borderRadius: 5,
                bgcolor: apiKeyRegistered ? 'rgba(134,199,168,0.30)' : 'rgba(230,192,121,0.32)',
                border: `1px solid ${apiKeyRegistered ? 'rgba(134,199,168,0.6)' : 'rgba(230,192,121,0.65)'}`,
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
                '&:hover': { transform: 'scale(1.03)' },
              }}
            >
              {apiKeyRegistered
                ? <CheckCircleIcon sx={{ fontSize: 16, color: '#5E9E81' }} />
                : <WarningAmberIcon sx={{ fontSize: 16, color: '#C49C53' }} />}
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {apiKeyRegistered ? 'API Key 등록' : 'API Key 필요'}
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip title="설정">
            <IconButton size="small" onClick={onOpenSettings}
                        sx={{ color: 'primary.dark', bgcolor: 'rgba(124,167,224,0.16)',
                              '&:hover': { bgcolor: 'rgba(124,167,224,0.30)' } }}>
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {/* ===== 좌(신규 개발 6) : 우(기존 화면 수정 4) Layer Board — 화면을 가득 채움 ===== */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', gap: 2 }}>
        {[
          { cat: CATEGORY_NEW,    options: NEW_MODE_OPTIONS,    grow: 5 },
          { cat: CATEGORY_MODIFY, options: MODIFY_MODE_OPTIONS, grow: 5 },
        ].map(({ cat, options, grow }) => {
          const CatIcon = cat.icon;
          return (
            <Paper
              key={cat.key}
              elevation={0}
              sx={{
                ...embossedPaper(cat.accent),
                flex: grow, minWidth: 0,
                display: 'flex', flexDirection: 'column',
                p: 1.6, gap: 1.2,
                borderTop: `3px solid ${cat.accent}`,
              }}
            >
              {/* 보드 헤더 */}
              <Stack direction="row" alignItems="center" spacing={1.2} sx={{ flexShrink: 0 }}>
                <Avatar sx={{
                  width: 38, height: 38,
                  bgcolor: `${cat.accent}26`, color: cat.accent,
                  border: `1px solid ${cat.accent}66`,
                }}>
                  <CatIcon sx={{ fontSize: 20 }} />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" sx={{ color: 'text.primary', lineHeight: 1.15 }}>
                    {cat.title}
                  </Typography>
                  <Typography variant="caption" sx={{
                    color: cat.accent, fontWeight: 800, letterSpacing: 1.2,
                    textTransform: 'uppercase', fontSize: 9.5,
                  }}>
                    {cat.subtitle}
                  </Typography>
                </Box>
              </Stack>

              {/* 하위 모드 카드 — 보드를 세로로 가득 채움 */}
              <Stack spacing={1.2} sx={{ flex: 1, minHeight: 0 }}>
                {options.map((opt) => {
                  const Icon = opt.icon;
                  const isHover = hovered === `${cat.key}-${opt.key}`;
                  return (
                    <Tooltip key={opt.key} title={opt.hint} placement="top">
                      <Paper
                        elevation={0}
                        onClick={() => onPickMode(cat.key, opt.key)}
                        onMouseEnter={() => setHovered(`${cat.key}-${opt.key}`)}
                        onMouseLeave={() => setHovered(null)}
                        sx={{
                          ...embossedPaper(opt.color, isHover),
                          cursor: 'pointer', overflow: 'hidden',
                          flex: 1, minHeight: 92,
                          display: 'flex', alignItems: 'stretch',
                          transform: isHover ? 'translateX(3px)' : 'none',
                        }}
                      >
                        {/* 좌측 컬러 바 */}
                        <Box sx={{
                          width: 7, flexShrink: 0,
                          background: `linear-gradient(180deg, ${opt.color} 0%, ${opt.color}aa 100%)`,
                        }} />
                        {/* 카드 본문 — 가로 배치 */}
                        <Box sx={{
                          flex: 1, minWidth: 0,
                          display: 'flex', alignItems: 'center', gap: 1.8,
                          px: 2, py: 1.2,
                        }}>
                          <Avatar sx={{
                            width: 48, height: 48, flexShrink: 0,
                            bgcolor: `${opt.color}14`, color: opt.color,
                            border: `2px solid ${opt.color}33`,
                            boxShadow: `0 5px 14px -4px ${opt.color}55, 0 1px 0 rgba(255,255,255,0.9) inset`,
                          }}>
                            <Icon sx={{ fontSize: 26 }} />
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="caption" sx={{
                              color: opt.color, fontWeight: 800, letterSpacing: 1.2,
                              textTransform: 'uppercase', fontSize: 9.5,
                            }}>
                              {opt.sub}
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'text.primary', lineHeight: 1.2 }}>
                              {opt.title}
                            </Typography>
                            <Typography variant="caption" sx={{
                              color: 'text.secondary', mt: 0.2,
                              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              {opt.hint}
                            </Typography>
                          </Box>
                          <Stack direction="row" alignItems="center" spacing={0.4} sx={{
                            flexShrink: 0, color: opt.color, fontWeight: 700, fontSize: 13,
                          }}>
                            시작
                            <ArrowForwardIcon fontSize="small" />
                          </Stack>
                        </Box>
                      </Paper>
                    </Tooltip>
                  );
                })}
                {/* 부족한 단 — 기존 화면 수정 보드 3단 빈 영역에 ScreenSpec 개념도 삽입 */}
                {Array.from({ length: Math.max(0, 3 - options.length) }).map((_, i) => (
                  <Box key={`spacer-${i}`} sx={{ flex: 1, minHeight: 92, display: 'flex' }}>
                    {cat.key === CATEGORY_MODIFY.key && (
                      <Box sx={{
                        flex: 1, minWidth: 0, minHeight: 0,
                        display: 'flex', flexDirection: 'column', gap: 0.6,
                        p: 1.4, borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.6)',
                        border: `1px solid ${cat.accent}3a`,
                        boxShadow: '0 1px 0 rgba(255,255,255,0.85) inset, '
                                 + '0 6px 16px -12px rgba(58,74,99,0.30)',
                      }}>
                        <Box sx={{
                          flex: 1, minHeight: 0, width: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Box
                            component="img"
                            src="/t3composer-concept.png"
                            alt="T3Composer — ScreenSpec 개념도"
                            sx={{ maxWidth: '100%', maxHeight: '100%',
                                  objectFit: 'contain', display: 'block',
                                  opacity: 0.4 }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{
                          flexShrink: 0, textAlign: 'center',
                          color: 'text.secondary', fontSize: 9.5, letterSpacing: 0.2,
                        }}>
                          다양한 입력 → ScreenSpec → 화면 산출물
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Stack>
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
  const [mode, setMode] = useState(null);                   // 선택된 실행 모드
  const [modifyStartWith, setModifyStartWith] = useState(null);  // 기존 화면 수정 서브모드 ('NL'|'STEP')
  const [apiKeyRegistered, setApiKeyReg]    = useState(null);
  const [apiKeyDialogOpen, setApiKeyDialog] = useState(false);
  const [confirmHomeOpen, setConfirmHomeOpen] = useState(false);

  // ─────────────────────────────────────────
  // Browser history ↔ 내부 mode 연동
  //   forward (모드 진입) 시 history.pushState
  //   브라우저 뒤로가기 또는 onBack 클릭 시 모드 선택 화면으로 rollback
  // ─────────────────────────────────────────
  const navigate = useCallback((updater) => {
    window.history.pushState({ t3ComposerNav: Date.now() }, '', '');
    updater();
  }, []);

  const goBackOneStep = useCallback(() => {
    if (window.history.state && window.history.state.t3ComposerNav) {
      window.history.back();
    } else {
      setMode(null);
    }
  }, []);

  useEffect(() => {
    const onPop = () => setMode(null);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // ── resume-related state — 아래 home reset useEffect / handleHomeConfirm 의 deps 가
  //    eagerly 평가되므로 그 useEffect/useCallback 보다 먼저 선언돼야 함 (TDZ 회피).
  const location = useLocation();
  const history  = useHistory();
  const [resumeSession, setResumeSession] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError]     = useState(null);

  // 좌측 로고 클릭으로 발화되는 home reset 신호 — workspace 진입 상태면 confirm, 아니면 no-op.
  // workspace 는 두 경로로 진입 가능:
  //   ① mode-driven : mode !== null (ModeNewStep / ModeNewGeneral / ... 진입)
  //   ② resume      : History [이어하기] → resumeSession 세팅 (mode 는 null 유지)
  // 두 경로 모두 home 복귀 대상 — mode 만 보면 ②에서 silent no-op (홈 안감 사고).
  useEffect(() => {
    const handler = () => {
      if (mode === null && !resumeSession) return;   // 이미 mode 선택 화면 — 추가 동작 불필요
      setConfirmHomeOpen(true);
    };
    window.addEventListener('t3composer:resetToHome', handler);
    return () => window.removeEventListener('t3composer:resetToHome', handler);
  }, [mode, resumeSession]);

  const handleHomeConfirm = useCallback(() => {
    setConfirmHomeOpen(false);
    setMode(null);
    // resume 경로도 함께 해제 — 그렇지 않으면 line 534 (if (resumeSession)) 분기가
    // 우선해 워크스페이스가 계속 렌더됨. URL state 도 청소해 다시 들어와도 자동
    // resume 되지 않게 함 (backFromResume 와 동일 처리).
    setResumeSession(null);
    setResumeError(null);
    if (history && location) {
      history.replace({ pathname: location.pathname, search: location.search, state: {} });
    }
  }, [history, location]);

  const handleHomeCancel = useCallback(() => {
    setConfirmHomeOpen(false);
  }, []);

  // Home reset confirm dialog — loading/resume/error/main 어느 분기에서든 mount 되어야 함.
  // (이전 사고: main 분기 안에만 두어, resume 진입 상태(line 546 early return)에서는
  //  setConfirmHomeOpen(true) 가 호출돼도 다이얼로그가 트리에 존재하지 않아 화면에 안 떴음.)
  const confirmHomeDialog = (
    <Dialog open={confirmHomeOpen} onClose={handleHomeCancel} maxWidth="xs" fullWidth>
      <DialogTitle>모드 선택 화면으로 돌아가기</DialogTitle>
      <DialogContent>
        <DialogContentText>
          현재 입력한 내용은 사라집니다. (세션은 History 에서 이어할 수 있습니다.)
          <br />
          모드 선택 화면으로 돌아가시겠습니까?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleHomeCancel}>취소</Button>
        <Button onClick={handleHomeConfirm} variant="contained" autoFocus>돌아가기</Button>
      </DialogActions>
    </Dialog>
  );

  // 히스토리 화면의 "이어하기" 로 진입 시 state 로 세션을 넘겨받아 ComposerWorkspace 를 바로 렌더
  // (location/history/resumeSession state 선언은 위로 이동 — home reset useEffect deps TDZ 회피)

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
    if (history && location) {
      history.replace({ pathname: location.pathname, search: location.search, state: {} });
    }
  };

  // API 키 + 활성 Target 의 DB 연결 둘 다 확인 후 진행.
  // - DB 연결 실패 / 확인 불가 / Target 미등록 시: "계속하시겠습니까?" confirm.
  // - 정상 연결 시: 즉시 fn 호출. (pool 기반 ping endpoint + 60초 캐싱)
  const DB_PING_CACHE_TTL_MS = 60_000;
  const dbPingCacheRef = useRef({ targetCd: null, ok: false, timestamp: 0 });

  const requireKeyAndDbThen = async (fn) => {
    if (!apiKeyRegistered) { setApiKeyDialog(true); return; }
    const targetCd = useTargetStore.getState().currentTargetCd;
    const confirmContinue = () => {
      const label = targetCd ? `Target [${targetCd}] 의 ` : '';
      showMessage(
        '확인',
        `${label}데이터베이스 접속이 안된 상태입니다.\n\n계속하시겠습니까?`,
        (proceed) => { if (proceed) fn(); }
      );
    };
    if (!targetCd) { confirmContinue(); return; }

    const cached = dbPingCacheRef.current;
    if (cached.targetCd === targetCd && cached.ok &&
        Date.now() - cached.timestamp < DB_PING_CACHE_TTL_MS) {
      fn();
      return;
    }

    try {
      const res = await pingTargetDbConnection(targetCd);
      const ok = res?.data?.success === true;
      dbPingCacheRef.current = { targetCd, ok, timestamp: Date.now() };
      if (ok) { fn(); return; }
      confirmContinue();
    } catch (_) {
      dbPingCacheRef.current = { targetCd, ok: false, timestamp: Date.now() };
      confirmContinue();
    }
  };

  const handleApiKeySaved = async () => {
    setApiKeyDialog(false);
    await checkApiKey();
  };

  // 하위 모드 카드 클릭 — 카테고리별로 진입 모드 결정
  const onPickMode = (catKey, optKey) => {
    requireKeyAndDbThen(() => navigate(() => {
      if (catKey === 'NEW') {
        setMode(optKey);                       // NEW_NL / NEW_FROM_COPY / NEW_FROM_DESIGN
      } else {
        setModifyStartWith(optKey);            // 'NL' | 'STEP'
        setMode(MODE.EXISTING_MODIFY);
      }
    }));
  };

  // 로딩
  if (apiKeyRegistered === null || resumeLoading) {
    return (
      <ContentInner>
        <WorkArea>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                     flexDirection: 'column', gap: 1.5, bgcolor: 'transparent' }}>
            <CircularProgress sx={{ color: 'primary.main' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {resumeLoading ? '이어하기 세션 로드 중...' : 'Composer 로딩 중...'}
            </Typography>
          </Box>
        </WorkArea>
      </ContentInner>
    );
  }

  // 히스토리에서 "이어하기" 로 들어온 경우 — 모드 선택 스킵하고 Workspace 직접 노출
  if (resumeSession) {
    return (
      <>
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
        {confirmHomeDialog}
      </>
    );
  }

  if (resumeError) {
    return (
      <ContentInner>
        <WorkArea>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                     flexDirection: 'column', gap: 1.5, bgcolor: 'transparent' }}>
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

  // backToLanding = ModeXxx 의 "← 뒤로" — 모드 선택 화면으로 (history.back 발화)
  const backToLanding = goBackOneStep;

  return (
    <ContentInner>
      <WorkArea>
        {mode === null && (
          <ModeSelector
            onPickMode={onPickMode}
            onOpenSettings={() => setApiKeyDialog(true)}
            apiKeyRegistered={apiKeyRegistered}
          />
        )}

        {mode === MODE.NEW_FROM_DESIGN && <ModeNewFromDesign  onBack={backToLanding} />}
        {mode === MODE.NEW_FROM_COPY   && <ModeNewFromCopy    onBack={backToLanding} />}
        {mode === MODE.NEW_NL          && <ModeNewGeneral     onBack={backToLanding} startWith="NL" />}
        {mode === MODE.NEW_STEP        && <ModeNewStep        onBack={backToLanding} />}
        {mode === MODE.EXISTING_MODIFY && (
          <ModeExistingModify onBack={backToLanding} startWith={modifyStartWith} />
        )}
      </WorkArea>

      <ApiKeyDialog
        open={apiKeyDialogOpen}
        onClose={() => setApiKeyDialog(false)}
        onSaved={handleApiKeySaved}
      />

      {confirmHomeDialog}
    </ContentInner>
  );
}

export default T3Composer;

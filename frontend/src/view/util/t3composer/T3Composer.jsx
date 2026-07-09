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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import ContentCopyIcon       from '@mui/icons-material/ContentCopy';
import ChatIcon              from '@mui/icons-material/Chat';
import BorderColorIcon       from '@mui/icons-material/BorderColor';
import AddCircleOutlineIcon  from '@mui/icons-material/AddCircleOutline';
import VpnKeyIcon            from '@mui/icons-material/VpnKey';
import WarningAmberIcon      from '@mui/icons-material/WarningAmber';
import ArrowForwardIcon      from '@mui/icons-material/ArrowForward';
import ArrowBackIcon         from '@mui/icons-material/ArrowBack';
import PlaylistAddCheckIcon  from '@mui/icons-material/PlaylistAddCheck';
import ViewQuiltIcon         from '@mui/icons-material/ViewQuilt';
import CloudOutlinedIcon     from '@mui/icons-material/CloudOutlined';
import TerminalIcon          from '@mui/icons-material/Terminal';

import { useLocation, useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
import PageHeader from './PageHeader';
import { useTargetStore } from './targetStore';
import { PALETTE, TYPOGRAPHY } from '../../../theme';

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
  titleKey: 'category.newDev',
  subtitle: 'New Development',
  icon: AddCircleOutlineIcon,
  isAccent: true,    // A시안: 신규 개발 카테고리 헤더는 티얼 강조
};
const CATEGORY_MODIFY = {
  key: 'MODIFY',
  titleKey: 'category.modifyExisting',
  subtitle: 'Modify Existing',
  icon: BorderColorIcon,
  isAccent: false,
};

// ===== 신규 개발 하위 카드 ===== (key = 진입 MODE)
//
// 색상 토큰은 통합(티얼) — 모든 카드 동일 default + hover 시 티얼 강조.
const NEW_MODE_OPTIONS = [
  { key: MODE.NEW_NL,        titleKey: 'mode.newNl.title',       subKey: 'mode.newNl.sub',       hintKey: 'mode.newNl.hint',       icon: ChatIcon },
  { key: MODE.NEW_STEP,      titleKey: 'mode.newStep.title',     subKey: 'mode.newStep.sub',     hintKey: 'mode.newStep.hint',     icon: ViewQuiltIcon },
  { key: MODE.NEW_FROM_COPY, titleKey: 'mode.newFromCopy.title', subKey: 'mode.newFromCopy.sub', hintKey: 'mode.newFromCopy.hint', icon: ContentCopyIcon },
];

// ===== 기존 화면 수정 하위 2종 ===== (key = ModeExistingModify 의 startWith)
const MODIFY_MODE_OPTIONS = [
  { key: 'NL',   titleKey: 'mode.modifyNl.title',   subKey: 'mode.modifyNl.sub',   hintKey: 'mode.modifyNl.hint',   icon: ChatIcon },
  { key: 'STEP', titleKey: 'mode.modifyStep.title', subKey: 'mode.modifyStep.sub', hintKey: 'mode.modifyStep.hint', icon: PlaylistAddCheckIcon },
];

// =====================================================================
// 모드 선택 — A시안 (정돈된 2분할)
//   상단 hero: 큰 타이틀 + 우측 chip 들 (Target / API Key / LLM / Settings)
//   본문 2-grid: 좌(신규 개발 3개) / 우(기존 화면 수정 2개 + PIPELINE)
//   - 흰 패널 + #ECEEF1 보더, 첫 카드(hot=true)는 #42BED6 강조
// =====================================================================
// TEAL/TEAL_* alias 는 Figma aqua 팔레트 전환 후에도 legacy 변수명 그대로 유지 (참조 호환)
const TEAL          = PALETTE.primary;        // #42BED6 (aqua-60)
const TEAL_SOFT     = PALETTE.primarySoft;    // #EAF9FB (aqua-93)
const TEAL_BORDER   = PALETTE.primaryBorder;  // #C8EFF6 (aqua-85)
const PANEL_BORDER  = PALETTE.panelBorder;    // #ECEEF1
const TXT_PRIMARY   = PALETTE.textPrimary;    // #1A2330
const TXT_SECONDARY = PALETTE.textSecondary;  // #6B7280
const TXT_MUTED     = PALETTE.textMuted;      // #9AA3AF

// 패널 (흰 카드) — A시안의 .panel { border-radius: 12px; padding: 18px }
function flatPanel(extra = {}) {
  return {
    bgcolor: '#ffffff',
    border: `1px solid ${PANEL_BORDER}`,
    borderRadius: '12px',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    boxShadow: '0 1px 3px rgba(16,24,40,.04)',
    ...extra,
  };
}

// Eyebrow (작은 대문자 라벨)
const eyebrowSx = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.09em',
  color: TXT_MUTED,
  textTransform: 'uppercase',
  lineHeight: 1.2,
};

function ModeSelector({ onPickMode, onOpenSettings, apiKeyRegistered, llmBackend }) {
  const { t } = useTranslation('composer');
  const [hovered, setHovered] = useState(null);

  // 신규 개발 / 기존 화면 수정 카드 렌더 — A시안 .act { padding:13px; gap:14px; border-radius:11px }
  // hover 시에만 티얼 강조 (시안의 초록 보더는 hover 상태)
  const renderCard = (cat, opt) => {
    const Icon = opt.icon;
    const key  = `${cat.key}-${opt.key}`;
    const isHover = hovered === key;
    return (
      <Paper
        key={opt.key}
        elevation={0}
        onClick={() => onPickMode(cat.key, opt.key)}
        onMouseEnter={() => setHovered(key)}
        onMouseLeave={() => setHovered(null)}
        sx={{
          bgcolor: '#ffffff',
          border: `1px solid ${isHover ? TEAL : PANEL_BORDER}`,
          borderRadius: '11px',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          boxShadow: isHover
            ? `0 0 0 1px ${TEAL}, 0 6px 16px rgba(10,136,168,.13)`
            : '0 1px 2px rgba(16,24,40,.03)',
          cursor: 'pointer',
          transition: 'box-shadow .18s ease, border-color .18s ease',
          p: '20px',
          display: 'flex', alignItems: 'center', gap: '16px',
          flex: 1, minHeight: 112,
        }}
      >
        <Box sx={{
          width: 38, height: 38, flexShrink: 0,
          borderRadius: '10px',
          bgcolor: TEAL_SOFT, color: TEAL,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon sx={{ fontSize: 21 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={eyebrowSx}>{t(opt.subKey)}</Typography>
          <Typography sx={{ ...TYPOGRAPHY.title3, color: TXT_PRIMARY, mt: 0.3 }}>
            {t(opt.titleKey)}
          </Typography>
          <Typography sx={{
            ...TYPOGRAPHY.body5, color: TXT_SECONDARY, mt: 0.3, lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {t(opt.hintKey)}
          </Typography>
        </Box>
      </Paper>
    );
  };

  // A시안 .chip 룩 — 흰 배경 + 회색 보더 + radius 9px
  const chipBase = {
    display: 'inline-flex', alignItems: 'center', gap: 0.7,
    height: 32, px: 1.4, borderRadius: '9px',
    bgcolor: '#FFFFFF',
    border: `1px solid ${PANEL_BORDER}`,
    color: '#4B5563',
    ...TYPOGRAPHY.label3,
    transition: 'background-color .15s, border-color .15s, color .15s',
  };

  return (
    <Box sx={{
      flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
      bgcolor: PALETTE.bgDefault,          // A시안 main 배경
      overflow: 'auto',
    }}>
      {/* ===== 공통 PageHeader — title + AI 뱃지 + 캡션 / 우측 chip 들 ===== */}
      <PageHeader
        title="Composer"
        badge="AI"
        caption={t('landing.subtitle')}
        right={
          <>
            <TargetSystemSelector />

            <Tooltip title={apiKeyRegistered ? t('header.apiKey.registeredTooltip') : t('header.apiKey.unregisteredTooltip')}>
              <Box
                onClick={onOpenSettings}
                sx={{
                  ...chipBase,
                  cursor: 'pointer',
                  bgcolor: apiKeyRegistered ? '#F0F9F3' : '#FDF2E0',
                  border: `1px solid ${apiKeyRegistered ? '#BFE3CD' : '#F4D9A3'}`,
                  color:   apiKeyRegistered ? '#157347' : '#B76E00',
                  fontWeight: 600,
                  '&:hover': { filter: 'brightness(0.98)' },
                }}
              >
                {apiKeyRegistered
                  ? <VpnKeyIcon sx={{ fontSize: 15 }} />
                  : <WarningAmberIcon sx={{ fontSize: 16 }} />}
                {apiKeyRegistered ? t('header.apiKey.registeredLabel') : t('header.apiKey.unregisteredLabel')}
              </Box>
            </Tooltip>

            <Tooltip title={
              llmBackend === 'cli'
                ? t('header.llmBackend.cliTooltip')
                : t('header.llmBackend.apiTooltip')
            }>
              <Box sx={{
                ...chipBase,
                bgcolor: llmBackend === 'cli' ? '#F3EEFB' : TEAL_SOFT,
                border: `1px solid ${llmBackend === 'cli' ? '#DCC9F2' : TEAL_BORDER}`,
                color:   llmBackend === 'cli' ? '#7B5BD6' : TEAL,
                fontWeight: 600,
              }}>
                {llmBackend === 'cli'
                  ? <TerminalIcon sx={{ fontSize: 16 }} />
                  : <CloudOutlinedIcon sx={{ fontSize: 16 }} />}
                {llmBackend === 'cli' ? 'CLI' : 'API'}
              </Box>
            </Tooltip>
          </>
        }
      />

      {/* ===== main 영역 — A시안 padding 24px + gap 20px ===== */}
      <Box sx={{
        flex: 1, minHeight: 0,
        display: 'flex', flexDirection: 'column',
        p: 3, gap: 2.5,
      }}>
      {/* ===== 무엇을 만드시겠어요? ===== */}
      <Box sx={{ flexShrink: 0 }}>
        <Typography sx={{ ...TYPOGRAPHY.title1, color: TXT_PRIMARY }}>
          {t('landing.heroTitle')}
        </Typography>
        <Typography sx={{
          ...TYPOGRAPHY.body4, color: TXT_SECONDARY, lineHeight: 1.5, mt: 0.5,
        }}>
          {t('landing.heroDesc')}
        </Typography>
      </Box>

      {/* ===== 2-grid: 신규 개발 / 기존 화면 수정 — 남은 세로 공간을 꽉 채움 ===== */}
      <Box sx={{
        flex: 1, minHeight: 0,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5,
      }}>
        {[
          { cat: CATEGORY_NEW,    options: NEW_MODE_OPTIONS,    withPipeline: false },
          { cat: CATEGORY_MODIFY, options: MODIFY_MODE_OPTIONS, withPipeline: true  },
        ].map(({ cat, options, withPipeline }) => {
          const CatIcon = cat.icon;
          return (
            <Paper
              key={cat.key}
              elevation={0}
              sx={flatPanel({
                p: '22px', display: 'flex', flexDirection: 'column', gap: '22px',
                minHeight: 0,
              })}
            >
              {/* 보드 헤더 — A시안 .colhead { gap:11px } */}
              <Stack direction="row" alignItems="center" spacing="11px" sx={{ flexShrink: 0 }}>
                <Box sx={{
                  width: 38, height: 38, borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: cat.isAccent ? TEAL_SOFT : '#EEF0F3',
                  color:   cat.isAccent ? TEAL      : '#7A828D',
                }}>
                  <CatIcon sx={{ fontSize: 21 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={eyebrowSx}>{cat.subtitle}</Typography>
                  <Typography sx={{
                    ...TYPOGRAPHY.title3, color: TXT_PRIMARY, mt: 0.2,
                  }}>
                    {t(cat.titleKey)}
                  </Typography>
                </Box>
              </Stack>

              {/* 카드 적층 — 남은 세로 공간 채우기 (각 카드 flex:1 균등 분배) */}
              <Stack spacing="14px" sx={{ flex: 1, minHeight: 0 }}>
                {options.map((opt) => renderCard(cat, opt))}

                {/* 기존 화면 수정 패널 — 하단 PIPELINE 다이어그램 (카드들과 동일 높이로 stretch) */}
                {withPipeline && (
                  <Box sx={{
                    flex: 1, minHeight: 0,
                    display: 'flex', flexDirection: 'column',
                  }}>
                    <Typography sx={{ ...eyebrowSx, mb: '8px', flexShrink: 0 }}>
                      {t('landing.pipeline.eyebrow')}
                    </Typography>
                    <Box sx={{
                      flex: 1, minHeight: 0,
                      display: 'flex', alignItems: 'stretch', gap: '12px',
                      bgcolor: '#F7F9FB',
                      border: `1px dashed ${TEAL_BORDER}`,
                      borderRadius: '10px',
                      p: '16px',
                    }}>
                      <Box sx={{
                        ...TYPOGRAPHY.label2, flex: 1, fontWeight: 600,
                        color: TXT_SECONDARY,
                        bgcolor: '#ffffff', border: `1px solid ${PANEL_BORDER}`,
                        borderRadius: '9px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{t('landing.pipeline.input')}</Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ArrowForwardIcon sx={{ fontSize: 22, color: '#B6BFC7' }} />
                      </Box>
                      <Box sx={{
                        ...TYPOGRAPHY.label2, flex: 1, fontWeight: 700,
                        color: TEAL,
                        bgcolor: TEAL_SOFT, border: `1px solid ${TEAL_BORDER}`,
                        borderRadius: '9px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{t('landing.pipeline.mid')}</Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ArrowForwardIcon sx={{ fontSize: 22, color: '#B6BFC7' }} />
                      </Box>
                      <Box sx={{
                        ...TYPOGRAPHY.label2, flex: 1, fontWeight: 600,
                        color: TXT_SECONDARY,
                        bgcolor: '#ffffff', border: `1px solid ${PANEL_BORDER}`,
                        borderRadius: '9px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{t('landing.pipeline.output')}</Box>
                    </Box>
                  </Box>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Box>
      </Box>
    </Box>
  );
}

// =====================================================================
// Main
// =====================================================================
function T3Composer() {
  const { t } = useTranslation('composer');
  const [mode, setMode] = useState(null);                   // 선택된 실행 모드
  const [modifyStartWith, setModifyStartWith] = useState(null);  // 기존 화면 수정 서브모드 ('NL'|'STEP')
  const [apiKeyRegistered, setApiKeyReg]    = useState(null);
  const [llmBackend, setLlmBackend]         = useState('api');
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
      setLlmBackend(res?.data?.llmBackend === 'cli' ? 'cli' : 'api');
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
                  {t('workspace.exit')}
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
            llmBackend={llmBackend}
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

import React, { useState, useEffect } from 'react';

import { Box, IconButton, Tooltip, Stack, Typography, Chip, Button, Menu, MenuItem, ListItemIcon, ListItemText, CircularProgress, Snackbar, Alert, AlertTitle, Tabs, Tab } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import DownloadIcon from '@mui/icons-material/Download';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LaunchIcon from '@mui/icons-material/Launch';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import BoltIcon from '@mui/icons-material/Bolt';
import DiamondIcon from '@mui/icons-material/Diamond';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import { zAxios } from '@wingui/common/imports';

import ChatPanel from './ChatPanel';
import { ArtifactTreeView, ArtifactCodeView } from './ArtifactPanel';
import MenuRegistrationDialog from './MenuRegistrationDialog';
import ArtifactApplyDialog from './ArtifactApplyDialog';
import SplitPane from './SplitPane';
import PreviewEmbed from './PreviewEmbed';
import { downloadDesignDoc, updateSessionModel, applyPreview, cancelPreview } from './api';

/**
 * AI 엔진(모델) 선택지 — Anthropic Claude.
 * 아티팩트 생성 후 추가 채팅이나 History 이어하기 시점에도 동일한 픽커로 전환 가능.
 * (ModeNewGeneral 의 MODEL_OPTIONS 와 동기화 — 신규 생성 시점과 동일한 두 모델 노출)
 */
const MODEL_OPTIONS = [
  {
    id:    'claude-sonnet-4-6',
    label: 'Sonnet',
    sub:   'Sonnet 4.6 — 기본값',
    desc:  '속도·비용·품질 균형. 일반 화면 생성·수정에 권장.',
    Icon:  BoltIcon,
    color: '#2563eb',
  },
  {
    id:    'claude-opus-4-7',
    label: 'Opus',
    sub:   'Opus 4.7 — 고품질 (느림)',
    desc:  '복잡 로직·고난이도 화면. 16K+ 출력 시 3~5분+ 소요 가능.',
    Icon:  DiamondIcon,
    color: '#7c3aed',
  },
];

const DEFAULT_MODEL_ID = 'claude-sonnet-4-6';

function modelMeta(id) {
  return MODEL_OPTIONS.find((m) => m.id === id)
      || { id, label: id, sub: id, desc: '', Icon: BoltIcon, color: '#64748b' };
}

/**
 * 세션 생성 이후 공통 작업 영역.
 * 좌: ChatPanel  |  우: ArtifactPanel  (리사이저 없이 고정 비율, 토글 가능)
 *
 * 헤더 버튼 (2026-04-27 정책 분리):
 *  - 레이아웃 토글 (chat-only / split / artifact-only)
 *  - 설계서 다운로드 (.xlsx)
 *  - 메뉴 등록  (MENU_SQL 만 실행 — TB_AD_MENU + TB_AD_LANG_PACK + TB_AD_PERMISSION_GROUP)
 *  - 아티팩트 실행 (그 외 — JSX/Java 파일 저장 + SQL_DDL/SQL_SP DB 실행)
 */
function ComposerWorkspace({ session, initialPrompt, extraHeader }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [menuDialogOpen, setMenuDialogOpen]   = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  // 아티팩트 선택 상태 — Tree(좌) ↔ CodeView(우 Tab) 동기화
  const [selectedArtifactId, setSelectedArtifactId] = useState(null);
  // 우측 Tab — 0: 미리보기, 1: 아티팩트 소스. 초기값 0 (미리보기)
  const [rightTab, setRightTab] = useState(0);
  // 미리보기 메타 (PreviewEmbed 가 이걸 보고 lazy import)
  const [previewMeta, setPreviewMeta] = useState(null);  // { sid8, viewSub }
  // Preview 진행 상태 (헤더 [미리보기] 버튼 흐름용)
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewStage, setPreviewStage] = useState(null);  // { phase, message, elapsedMs, targetUrl }
  const previewAbortRef = React.useRef(false);
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'success', title: '', message: '' });

  // AI 엔진(모델) 전환 — 세션 생성 후/이어하기 진입 후에도 변경 가능
  const [currentModel, setCurrentModel] = useState(session?.modelName || DEFAULT_MODEL_ID);
  const [modelMenuAnchor, setModelMenuAnchor] = useState(null);
  const [modelSwitching, setModelSwitching] = useState(false);

  // session prop 이 갱신될 때 현재 모델 동기화 (이어하기 케이스)
  useEffect(() => {
    if (session?.modelName) setCurrentModel(session.modelName);
  }, [session?.modelName]);

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  const handlePickModel = async (modelId) => {
    setModelMenuAnchor(null);
    if (!session?.id || modelId === currentModel) return;
    setModelSwitching(true);
    try {
      const res = await updateSessionModel(session.id, modelId);
      setCurrentModel(res?.data?.modelName || modelId);
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert('AI 엔진 전환 실패: ' + (e?.response?.data?.message || e?.message || ''));
    } finally {
      setModelSwitching(false);
    }
  };

  // 세션 heartbeat — Composer 작업은 Claude 호출 대기 중 idle 시간이 길어
  // 서버의 sessionExpiredDttm (기본 2시간) 이 끊길 수 있다.
  // 5분 주기로 /auth/validate 를 호출해 JwtAuthenticationFilter 가
  // sessionExpiredDttm 을 연장하도록 한다. (에러는 무시 — focus listener 가 처리)
  useEffect(() => {
    if (!session) return undefined;
    const HEARTBEAT_MS = 5 * 60 * 1000;  // 5분
    const tick = () => {
      // skip401Dialog 로 전역 "세션 만료" 다이얼로그 차단. 401 이어도 silent.
      // 실제 세션 상실은 사용자가 명시적으로 무언가 조작할 때 자연스럽게 감지됨.
      zAxios.get('auth/validate', {
        waitOn: false,
        errorMessage: false,
        skip401Dialog: true,
      }).catch(() => { /* no-op */ });
    };
    const id = window.setInterval(tick, HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, [session?.id]);

  // ───────────────────────────────────────────────────────────────────
  // Preview — 헤더 [미리보기] 버튼: applyPreview → 진행 단계 → 자동 진입
  // ───────────────────────────────────────────────────────────────────
  const handlePreview = async () => {
    if (!session?.id || previewBusy) return;
    setPreviewBusy(true);
    previewAbortRef.current = false;
    setPreviewStage({ phase: 'applying', message: '산출물 적용 중...', elapsedMs: 0 });
    try {
      const res = await applyPreview(session.id);
      const r = res?.data || {};
      if (!r.success) {
        setPreviewStage(null);
        setSnackbar({ open: true, severity: 'error', title: '화면 실행 준비 실패',
                      message: r.error || 'JSX/SQL/MENU 처리 오류' });
        return;
      }
      setSnackbar({ open: true, severity: 'success', title: '화면 실행 준비 완료',
                    message: `JSX ${r.jsxOk} · DDL ${r.ddlOk} · SP ${r.spOk} · MENU ${r.menuOk} · Java ${r.javaOk || 0}` });

      // 첫 미리보기 링크 + 메타 (Tab embed 용) 저장
      const link = r.previewLinks?.[0];
      const targetUrl = link?.url;
      if (link?.viewSub && r.sid8) {
        setPreviewMeta({ sid8: r.sid8, viewSub: link.viewSub });
        setRightTab(0);  // [실행 화면] 탭 자동 활성
      }
      if (!targetUrl) {
        setPreviewStage(null);
        return;
      }
      const hasJava = (r.javaOk || 0) > 0;
      if (!hasJava) {
        // Java 없음 — 즉시 화면 노출 (Tab 0 에 자동 embed)
        setPreviewStage({ phase: 'ready', message: '실행 준비 완료', elapsedMs: 0, targetUrl });
        // 짧은 시간 후 토스트 자동 사라짐
        setTimeout(() => { if (!previewAbortRef.current) setPreviewStage(null); }, 1500);
        return;
      }
      // Java 있으면 health 폴링 → backend restart 감지 후 자동으로 ready
      const start = Date.now();
      let sawDown = false;
      setPreviewStage({ phase: 'compiling', message: '백엔드 컴파일 진행 중...', elapsedMs: 0, targetUrl });
      while (!previewAbortRef.current && (Date.now() - start) < 120000) {
        await new Promise((res2) => setTimeout(res2, 2500));
        if (previewAbortRef.current) return;
        const elapsed = Date.now() - start;
        try {
          const ctrl = new AbortController();
          const tmr = setTimeout(() => ctrl.abort(), 2000);
          const h = await fetch('/actuator/health', { method: 'GET', signal: ctrl.signal });
          clearTimeout(tmr);
          if (h.ok && sawDown) {
            // 회복 완료 — 자동으로 화면 노출 (우측 Tab 0 에 이미 embed 됨)
            setPreviewStage({ phase: 'ready', message: '준비 완료 — 우측 [실행 화면] 탭에서 확인', elapsedMs: elapsed, targetUrl });
            setTimeout(() => { if (!previewAbortRef.current) setPreviewStage(null); }, 2000);
            return;
          }
          if (h.ok) {
            setPreviewStage({ phase: 'compiling', message: '백엔드 컴파일 진행 중...', elapsedMs: elapsed, targetUrl });
          } else {
            sawDown = true;
            setPreviewStage({ phase: 'restarting', message: '백엔드 재기동 중...', elapsedMs: elapsed, targetUrl });
          }
        } catch {
          sawDown = true;
          setPreviewStage({ phase: 'restarting', message: '백엔드 재기동 중...', elapsedMs: Date.now() - start, targetUrl });
        }
      }
      if (!previewAbortRef.current) {
        setPreviewStage({ phase: 'failed', message: '대기 시간 초과(120초)', elapsedMs: Date.now() - start, targetUrl });
      }
    } catch (e) {
      const data = e?.response?.data || {};
      setPreviewStage(null);
      setSnackbar({ open: true, severity: 'error', title: '미리보기 통신 오류',
                    message: data.message || data.error || e?.message || '네트워크 오류' });
    } finally {
      setPreviewBusy(false);
    }
  };

  const handlePreviewCancel = async () => {
    previewAbortRef.current = true;
    setPreviewStage(null);
    setPreviewMeta(null);
    if (!session?.id) return;
    try {
      await cancelPreview(session.id);
      setSnackbar({ open: true, severity: 'info', title: '실행 화면 정리', message: '실행 산출물 + DB row 정리됨' });
    } catch (e) {
      setSnackbar({ open: true, severity: 'error', title: '정리 실패',
                    message: e?.response?.data?.message || e?.message });
    }
  };

  const handleDownloadDesignDoc = async () => {
    setDownloading(true);
    try {
      const res = await downloadDesignDoc(session.id);
      const blob = res.data instanceof Blob
        ? res.data
        : new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `design-doc-${(session.title || session.id).replace(/[^a-zA-Z0-9가-힣_-]/g, '_')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert('설계서 다운로드 실패: ' + (e?.message || ''));
    } finally {
      setDownloading(false);
    }
  };

  if (!session) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{
          px: 2,
          py: 0.8,
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          bgcolor: 'grey.50',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}
               sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <Typography variant="body2" noWrap title={session.title}
                      sx={{ fontWeight: 500, flex: 1, minWidth: 0,
                            overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {session.title}
          </Typography>
          <Chip label={session.mode} size="small" variant="outlined"
                sx={{ height: 20, fontSize: 10, flexShrink: 0 }} />
          {session.targetMenuCd && (
            <Chip label={session.targetMenuCd} size="small"
                  sx={{ height: 20, fontSize: 10, flexShrink: 0,
                        maxWidth: 200,
                        '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }} />
          )}
          {/* AI 엔진(모델) 선택 — 클릭 시 Sonnet ↔ Opus 전환 메뉴 노출 */}
          {(() => {
            const meta = modelMeta(currentModel);
            const ModelIcon = meta.Icon;
            return (
              <Tooltip title={`AI 엔진: ${meta.sub} — 클릭하여 변경`}>
                <Chip
                  size="small"
                  variant="outlined"
                  clickable
                  disabled={modelSwitching}
                  onClick={(e) => setModelMenuAnchor(e.currentTarget)}
                  icon={modelSwitching
                    ? <CircularProgress size={12} sx={{ ml: 0.6 }} />
                    : <ModelIcon sx={{ fontSize: 14, color: meta.color + '!important' }} />}
                  label={meta.label}
                  deleteIcon={<ExpandMoreIcon sx={{ fontSize: 14 }} />}
                  onDelete={(e) => setModelMenuAnchor(e.currentTarget)}
                  sx={{
                    height: 22,
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                    display: { xs: 'none', md: 'inline-flex' },
                    borderColor: `${meta.color}55`,
                    color: meta.color,
                    bgcolor: `${meta.color}08`,
                    '& .MuiChip-deleteIcon': { color: meta.color, mr: 0.3 },
                    '&:hover': { bgcolor: `${meta.color}14`, borderColor: meta.color },
                  }}
                />
              </Tooltip>
            );
          })()}
          <Menu
            anchorEl={modelMenuAnchor}
            open={Boolean(modelMenuAnchor)}
            onClose={() => setModelMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{ sx: { minWidth: 280, mt: 0.5 } }}
          >
            <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 1 }}>
                AI 엔진 선택
              </Typography>
            </Box>
            {MODEL_OPTIONS.map((m) => {
              const ModelIcon = m.Icon;
              const active = m.id === currentModel;
              return (
                <MenuItem
                  key={m.id}
                  onClick={() => handlePickModel(m.id)}
                  selected={active}
                  sx={{ alignItems: 'flex-start', py: 1 }}
                >
                  <ListItemIcon sx={{ minWidth: 32, mt: 0.3 }}>
                    <ModelIcon sx={{ color: m.color, fontSize: 22 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={0.8}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: m.color }}>
                          {m.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {m.sub}
                        </Typography>
                        {active && <CheckIcon sx={{ fontSize: 16, color: m.color, ml: 0.5 }} />}
                      </Stack>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.3 }}>
                        {m.desc}
                      </Typography>
                    }
                  />
                </MenuItem>
              );
            })}
          </Menu>
        </Stack>
        {/* 우측 액션 영역 — 항상 고정 너비로 노출 (긴 title 에 의해 클리핑되지 않도록 flexShrink:0) */}
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
          {extraHeader}

          {/* 기능 버튼 */}
          <Tooltip title="화면설계서 Excel 다운로드">
            <span>
              <Button
                size="small"
                startIcon={<DownloadIcon fontSize="small" />}
                onClick={handleDownloadDesignDoc}
                disabled={downloading}
                variant="outlined"
                sx={{ mr: 0.5 }}
              >
                {downloading ? '생성 중...' : '설계서'}
              </Button>
            </span>
          </Tooltip>
          {/* [화면 실행] — 산출물을 docker 안에 적용해 우측 Tab 에서 실제 운영 화면처럼 노출 */}
          <Tooltip title="산출물을 적용해 우측 [실행 화면] 탭에서 실제 운영 형태로 띄우기. JSX/SQL/Java 모두 실제 동작 (CRUD round-trip).">
            <span>
              <Button
                size="small"
                startIcon={previewBusy
                  ? <CircularProgress size={14} color="inherit" />
                  : <LaunchIcon fontSize="small" />}
                onClick={handlePreview}
                disabled={previewBusy || !!previewStage}
                variant="contained"
                color="info"
                sx={{ mr: 0.5 }}
              >
                {previewBusy ? '실행 중...' : '화면 실행'}
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="① 메뉴 등록 — MENU_SQL 만 실제 DB 에 적용 (TB_AD_MENU + TB_AD_LANG_PACK + TB_AD_PERMISSION_GROUP)">
            <span>
              <Button
                size="small"
                startIcon={<AppRegistrationIcon fontSize="small" />}
                onClick={() => setMenuDialogOpen(true)}
                variant="outlined"
                color="warning"
                sx={{ mr: 0.5 }}
              >
                메뉴 등록
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="② 아티팩트 실행 — JSX/Java 파일 저장 + SQL_DDL/SQL_SP DB 실행 (메뉴 등록 후 권장)">
            <span>
              <Button
                size="small"
                startIcon={<RocketLaunchIcon fontSize="small" />}
                onClick={() => setApplyDialogOpen(true)}
                variant="outlined"
                color="secondary"
                sx={{ mr: 1 }}
              >
                아티팩트 실행
              </Button>
            </span>
          </Tooltip>

        </Stack>
      </Stack>

      {/* Preview 진행 단계 토스트 — 화면 상단 sticky */}
      {previewStage && (
        <Box sx={{
          px: 2, py: 1,
          borderBottom: '1px solid',
          borderColor: previewStage.phase === 'ready' ? 'success.light'
                      : previewStage.phase === 'failed' ? 'error.light'
                      : 'warning.light',
          bgcolor: previewStage.phase === 'ready' ? 'rgba(16,185,129,0.08)'
                  : previewStage.phase === 'failed' ? 'rgba(239,68,68,0.08)'
                  : 'rgba(245,158,11,0.08)',
        }}>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            {previewStage.phase === 'ready' ? (
              <CheckIcon fontSize="small" color="success" />
            ) : previewStage.phase === 'failed' ? (
              <RestartAltIcon fontSize="small" color="error" />
            ) : (
              <>
                <HourglassTopIcon fontSize="small" color="warning" sx={{
                  animation: 'composerHourglassRotate 1.5s linear infinite',
                  '@keyframes composerHourglassRotate': {
                    '0%':   { transform: 'rotate(0deg)' },
                    '50%':  { transform: 'rotate(180deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }} />
                <CircularProgress size={14} thickness={6} />
              </>
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#0f172a' }}>
                {previewStage.phase === 'applying'   && '⏳ 산출물 적용'}
                {previewStage.phase === 'compiling'  && '⏳ 백엔드 컴파일'}
                {previewStage.phase === 'restarting' && '🔄 백엔드 재기동'}
                {previewStage.phase === 'ready'      && '✅ 실행 준비 완료'}
                {previewStage.phase === 'failed'     && '⚠ 실행 준비 실패'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                {previewStage.message}
                {previewStage.elapsedMs > 0 && (
                  <Box component="span" sx={{ ml: 1, fontFamily: 'monospace' }}>
                    ({Math.round(previewStage.elapsedMs / 1000)}s)
                  </Box>
                )}
              </Typography>
            </Box>
            {previewStage.phase === 'failed' && previewStage.targetUrl && (
              <Button size="small" variant="outlined" color="info"
                      href={previewStage.targetUrl} target="_blank" rel="noopener noreferrer">
                새 창에서 열기
              </Button>
            )}
            <Button size="small" color="inherit" onClick={handlePreviewCancel}>
              닫기
            </Button>
          </Stack>
        </Box>
      )}

      {/* ───── 본문 — 좌측 (작업내역 ↔ 아티팩트 트리) | 우측 (Tab: 미리보기 / 소스) ───── */}
      <SplitPane
        direction="horizontal"
        initial={32}  /* 좌측 32%, 우측 68% (요청대로 우측이 큰 영역) */
        min={20} max={55}
        first={
          <SplitPane
            direction="vertical"
            initial={55}  /* 위 (아티팩트 트리) 55%, 아래 (작업내역) 45% */
            min={20} max={75}
            first={
              <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: '#fcfcfd' }}>
                <ArtifactTreeView
                  sessionId={session.id}
                  refreshKey={refreshKey}
                  selectedId={selectedArtifactId}
                  onSelect={(id) => {
                    setSelectedArtifactId(id);
                    setRightTab(1);  /* 아티팩트 클릭 시 자동으로 소스 탭 이동 */
                  }}
                />
              </Box>
            }
            second={
              <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: '#fff', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <ChatPanel
                  sessionId={session.id}
                  onNewAssistantMsg={triggerRefresh}
                  initialPrompt={initialPrompt}
                />
              </Box>
            }
          />
        }
        second={
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', bgcolor: '#fff', borderLeft: '1px solid rgba(0,0,0,0.06)' }}>
            <Box sx={{ borderBottom: '1px solid rgba(0,0,0,0.08)', bgcolor: '#fff' }}>
              <Tabs
                value={rightTab}
                onChange={(_, v) => setRightTab(v)}
                variant="standard"
                sx={{
                  minHeight: 36,
                  '& .MuiTab-root': { minHeight: 36, py: 0.5, textTransform: 'none', fontWeight: 600 },
                }}
              >
                <Tab
                  icon={<LaunchIcon fontSize="small" />}
                  iconPosition="start"
                  label={
                    <Stack direction="row" alignItems="center" spacing={0.6}>
                      <span>실행 화면</span>
                      {previewMeta && (
                        <Chip size="small" color="success" label="LIVE"
                              sx={{ height: 16, fontSize: 9, fontWeight: 700 }} />
                      )}
                    </Stack>
                  }
                />
                <Tab
                  icon={<CodeIcon fontSize="small" />}
                  iconPosition="start"
                  label="아티팩트 소스"
                />
              </Tabs>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, display: rightTab === 0 ? 'flex' : 'none', flexDirection: 'column' }}>
              <PreviewEmbed sid8={previewMeta?.sid8} viewSub={previewMeta?.viewSub} />
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, display: rightTab === 1 ? 'flex' : 'none', flexDirection: 'column' }}>
              <ArtifactCodeView selectedId={selectedArtifactId} />
            </Box>
          </Box>
        }
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'success' ? 5000 : null}
        onClose={(_, reason) => {
          if (reason === 'clickaway' && snackbar.severity !== 'success') return;
          setSnackbar((s) => ({ ...s, open: false }));
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled"
               onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
               sx={{ minWidth: 380 }}>
          {snackbar.title && <AlertTitle sx={{ fontWeight: 700 }}>{snackbar.title}</AlertTitle>}
          {snackbar.message}
        </Alert>
      </Snackbar>

      <MenuRegistrationDialog
        open={menuDialogOpen}
        sessionId={session.id}
        onClose={() => setMenuDialogOpen(false)}
      />
      <ArtifactApplyDialog
        open={applyDialogOpen}
        sessionId={session.id}
        onClose={() => setApplyDialogOpen(false)}
      />
    </Box>
  );
}

export default ComposerWorkspace;

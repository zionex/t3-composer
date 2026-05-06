import React, { useState, useEffect } from 'react';

import { Box, IconButton, Tooltip, Stack, Typography, Chip, Button, Menu, MenuItem, ListItemIcon, ListItemText, CircularProgress } from '@mui/material';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import DownloadIcon from '@mui/icons-material/Download';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import BoltIcon from '@mui/icons-material/Bolt';
import DiamondIcon from '@mui/icons-material/Diamond';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';

import { zAxios } from '@wingui/common/imports';

import ChatPanel from './ChatPanel';
import ArtifactPanel from './ArtifactPanel';
import MenuRegistrationDialog from './MenuRegistrationDialog';
import ArtifactApplyDialog from './ArtifactApplyDialog';
import { downloadDesignDoc, updateSessionModel } from './api';

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
  const [layout, setLayout] = useState('split');  // split | chat | artifact
  const [refreshKey, setRefreshKey] = useState(0);
  const [menuDialogOpen, setMenuDialogOpen]   = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

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

          {/* 레이아웃 토글 */}
          <Tooltip title="채팅만 보기">
            <IconButton
              size="small"
              color={layout === 'chat' ? 'primary' : 'default'}
              onClick={() => setLayout('chat')}
            >
              <ViewAgendaIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="분할 보기">
            <IconButton
              size="small"
              color={layout === 'split' ? 'primary' : 'default'}
              onClick={() => setLayout('split')}
            >
              <ViewColumnIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="아티팩트만 보기">
            <IconButton
              size="small"
              color={layout === 'artifact' ? 'primary' : 'default'}
              onClick={() => setLayout('artifact')}
            >
              <ViewColumnIcon fontSize="small" sx={{ transform: 'scaleX(-1)' }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Chat */}
        {(layout === 'split' || layout === 'chat') && (
          <Box
            sx={{
              flex: layout === 'chat' ? 1 : '0 0 45%',
              borderRight: layout === 'split' ? '1px solid rgba(0,0,0,0.08)' : 'none',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <ChatPanel
              sessionId={session.id}
              onNewAssistantMsg={triggerRefresh}
              initialPrompt={initialPrompt}
            />
          </Box>
        )}

        {/* Artifacts */}
        {(layout === 'split' || layout === 'artifact') && (
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex' }}>
            <ArtifactPanel sessionId={session.id} refreshKey={refreshKey} />
          </Box>
        )}
      </Box>

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

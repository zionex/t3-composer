// =============================================================================
// AppHeaderChips — 앱 최상위 헤더(Tab strip 우측)에 노출되는 공용 chip 세트.
//   · TargetSystemSelector — 활성 Target 전환 dropdown
//   · API Key chip         — 등록 여부 (클릭 시 ApiKeyDialog)
//   · LLM Backend chip     — 현재 백엔드 (api|cli)
//
// 이전엔 T3Composer.jsx 의 PageHeader `right` slot 에만 있었지만, 모든 화면에서
// 접근 가능하도록 App.jsx 헤더로 승격 (LanguageSwitcher 앞 배치).
// 상태는 apiKeyStore (zustand) 로 앱 전역 공유 — 여러 화면에서 동일한 등록 상태 참조.
// =============================================================================
import React, { useEffect, useState } from 'react';
import { Box, Tooltip } from '@mui/material';
import VpnKeyIcon        from '@mui/icons-material/VpnKey';
import WarningAmberIcon  from '@mui/icons-material/WarningAmber';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import TerminalIcon      from '@mui/icons-material/Terminal';
import { useTranslation } from 'react-i18next';

import TargetSystemSelector from './TargetSystemSelector';
import ApiKeyDialog          from './ApiKeyDialog';
import { useApiKeyStore }    from './apiKeyStore';
import { PALETTE, TYPOGRAPHY } from '../../theme';

// T3Composer.jsx 의 ModeSelector 안에 있던 chip 룩과 동일 (A시안 .chip 룩)
//   흰 배경 + panelBorder + 진회색 텍스트 · height 26 · radius 9px
//   (App 헤더 32px 행에 배치되므로 26 로 낮춰 상하 breathing room 확보)
const chipBase = {
  display: 'inline-flex', alignItems: 'center', gap: 0.7,
  height: 26, px: 1.2, borderRadius: '9px',
  bgcolor: '#FFFFFF',
  border: `1px solid ${PALETTE.panelBorder}`,
  color: '#4B5563',
  ...TYPOGRAPHY.label3,
  transition: 'background-color .15s, border-color .15s, color .15s',
};

export default function AppHeaderChips() {
  const { t } = useTranslation('composer');

  const apiKeyRegistered = useApiKeyStore((s) => s.apiKeyRegistered);
  const llmBackend       = useApiKeyStore((s) => s.llmBackend);
  const refresh          = useApiKeyStore((s) => s.refresh);

  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);

  // 앱 mount 시 1회 등록 여부 조회 (store 가 loading 가드 → 중복 호출 안전)
  useEffect(() => { refresh(); }, [refresh]);

  // 다른 화면 (T3Composer 의 requireKeyAndDbThen 등) 이 API Key 다이얼로그 열기 요청 시.
  useEffect(() => {
    const h = () => setApiKeyDialogOpen(true);
    window.addEventListener('apikey:openDialog', h);
    return () => window.removeEventListener('apikey:openDialog', h);
  }, []);

  const handleApiKeySaved = async () => {
    setApiKeyDialogOpen(false);
    await refresh();
  };

  // 초기 미확인 (apiKeyRegistered === null) 상태는 chip 이 flicker 되지 않도록
  // 미등록 상태와 동일한 amber 표기 대신 중립 회색으로 잠깐 표시
  const registered = apiKeyRegistered === true;
  const unresolved = apiKeyRegistered === null;

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      <TargetSystemSelector />

      <Tooltip title={
        unresolved ? ''
          : registered
            ? t('header.apiKey.registeredTooltip')
            : t('header.apiKey.unregisteredTooltip')
      }>
        <Box
          onClick={() => setApiKeyDialogOpen(true)}
          sx={{
            ...chipBase,
            cursor: 'pointer',
            bgcolor: unresolved ? '#F5F5F5' : (registered ? '#F0F9F3' : '#FDF2E0'),
            border: `1px solid ${unresolved ? PALETTE.panelBorder : (registered ? '#BFE3CD' : '#F4D9A3')}`,
            color:   unresolved ? '#6B7280' : (registered ? '#157347' : '#B76E00'),
            fontWeight: 600,
            '&:hover': { filter: 'brightness(0.98)' },
          }}
        >
          {registered
            ? <VpnKeyIcon sx={{ fontSize: 15 }} />
            : <WarningAmberIcon sx={{ fontSize: 16 }} />}
          {unresolved
            ? '...'
            : (registered
                ? t('header.apiKey.registeredLabel')
                : t('header.apiKey.unregisteredLabel'))}
        </Box>
      </Tooltip>

      <Tooltip title={
        llmBackend === 'cli'
          ? t('header.llmBackend.cliTooltip')
          : t('header.llmBackend.apiTooltip')
      }>
        <Box sx={{
          ...chipBase,
          bgcolor: llmBackend === 'cli' ? '#F3EEFB' : PALETTE.primarySoft,
          border: `1px solid ${llmBackend === 'cli' ? '#DCC9F2' : PALETTE.primaryBorder}`,
          color:   llmBackend === 'cli' ? '#7B5BD6' : PALETTE.primary,
          fontWeight: 600,
        }}>
          {llmBackend === 'cli'
            ? <TerminalIcon sx={{ fontSize: 16 }} />
            : <CloudOutlinedIcon sx={{ fontSize: 16 }} />}
          {llmBackend === 'cli' ? 'CLI' : 'API'}
        </Box>
      </Tooltip>

      <ApiKeyDialog
        open={apiKeyDialogOpen}
        onClose={() => setApiKeyDialogOpen(false)}
        onSaved={handleApiKeySaved}
      />
    </Box>
  );
}

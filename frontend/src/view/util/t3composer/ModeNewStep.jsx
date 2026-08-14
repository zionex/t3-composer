/**
 * ModeNewStep — NEW_STEP 모드 진입 화면. 패턴 picker 3 옵션.
 *   ① SCM UI Mockup       — MockupPickerDialog (Product Line · 카테고리 필터)
 *   ② T3MES UI Pattern    — UiPatternPickerDialog
 *   ③ 빈 캔버스 (P02 / BLANK)
 *
 *   선택 후 ComposerSpec 을 specFromPattern/Mockup/UiPattern() 으로 만들어
 *   ComposerWizard (Phase 2E-1) 진입 — 4단계 Wizard 가 Canvas/Data/Meta/Generate 분기 책임.
 *
 *   Phase 2E-1: stage 단순화 — 'PICK' / 'WIZARD' 만.
 *   WORKSPACE 분기는 GenerateStep 으로 이전됐으므로 여기서는 제거.
 *
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e1.md (Task 7)
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Button, Stack, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import ViewQuiltIcon          from '@mui/icons-material/ViewQuilt';
import EditOutlinedIcon       from '@mui/icons-material/EditOutlined';
import AutoAwesomeIcon       from '@mui/icons-material/AutoAwesome';
import DashboardIcon         from '@mui/icons-material/Dashboard';

import ComposerWizard from './ComposerWizard';
import T3Dashboard from '../../util/t3dashboard/T3Dashboard';
import MockupPickerDialog from './MockupPickerDialog';
import UiPatternPickerDialog from './UiPatternPickerDialog';
import AiRecommendPanel from './AiRecommendPanel';
import { specFromPattern, specFromMockup, specFromUiPattern, specFromDashboard } from './wizardState';
import { useTargetStore } from './targetStore';
import { findMockup } from '../t3mockup';

// INSIGHT_ENABLED — false 시 [Dashboard] 패턴 카드 숨김
const INSIGHT_ENABLED = process.env.INSIGHT_ENABLED === 'true';

function ModeNewStep({ onBack, initialStage, initialNl = '', initialMockupCode = null }) {
  const { t } = useTranslation('composer');
  const bootstrappedEntry = initialMockupCode ? findMockup(initialMockupCode) : null;
  // 단계: 'PICK' (패턴 선택) | 'WIZARD' (4단계 Wizard)
  const [stage, setStage] = useState(bootstrappedEntry ? 'WIZARD' : (initialStage || 'PICK'));
  const [spec, setSpec]   = useState(
    bootstrappedEntry
      ? specFromMockup(bootstrappedEntry, { title: t('modeNewStep.newScreenDefault'), menuCd: '' })
      : null
  );
  // AI 추천에서 받은 참조 파일 첨부 — GenerateStep 까지 흘려보내 Claude 가 참조.
  const [attachments, setAttachments] = useState([]);
  const [mockupPickerOpen, setMockupPickerOpen] = useState(false);
  const [uiPatternPickerOpen, setUiPatternPickerOpen] = useState(false);
  const currentTargetCd = useTargetStore((s) => s.currentTargetCd);

  const startWithPattern = (patternCode) => {
    setSpec(specFromPattern(patternCode, { title: t('modeNewStep.newScreenDefault'), menuCd: '', pattern: patternCode }));
    setStage('WIZARD');
  };

  if (stage === 'AI_RECOMMEND') {
    return (
      <AiRecommendPanel
        targetCd={currentTargetCd}
        initialNl={initialNl}
        onBack={() => setStage('PICK')}
        onStart={(s, atts) => { setSpec(s); setAttachments(atts || []); setStage('WIZARD'); }}
      />
    );
  }

  if (stage === 'DASHBOARD') {
    return (
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => setStage('PICK')}>{t('modeNewStep.back')}</Button>
          <Typography variant="h6" sx={{ color: '#1e40af', fontWeight: 800 }}>
            {t('modeNewStep.dashboardTitle')}
          </Typography>
        </Stack>
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <T3Dashboard
            onUseAsScreen={(dashboard) => {
              if (!dashboard) return;
              setSpec(specFromDashboard(dashboard, { title: dashboard.name || dashboard.title || t('modeNewStep.newScreenDefault'), menuCd: '' }));
              setStage('WIZARD');
            }}
          />
        </Box>
      </Box>
    );
  }

  if (stage === 'WIZARD' && spec) {
    return (
      <ComposerWizard
        initialSpec={spec}
        initialAttachments={attachments}
        targetCd={currentTargetCd}
        onBack={() => { setSpec(null); setAttachments([]); setStage('PICK'); }}
      />
    );
  }

  // stage === 'PICK'
  return (
    <>
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={onBack}>{t('modeNewStep.back')}</Button>
        <Typography variant="h6" sx={{ color: '#1e40af', fontWeight: 800 }}>
          {t('modeNewStep.title')}
        </Typography>
      </Stack>

      <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
        {t('modeNewStep.hint')}
      </Typography>

      <Stack spacing={2}>

        <Paper variant="outlined"
               sx={{ p: 2, cursor: 'pointer', borderColor: '#fcd34d',
                     '&:hover': { borderColor: '#f59e0b', bgcolor: '#fffbeb' } }}
               onClick={() => setStage('AI_RECOMMEND')}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AutoAwesomeIcon sx={{ fontSize: 32, color: '#f59e0b' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#b45309' }}>
                {t('modeNewStep.pattern.aiSuggest.title')}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {t('modeNewStep.pattern.aiSuggest.desc')}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper variant="outlined"
               sx={{ p: 2, cursor: 'pointer', '&:hover': { borderColor: '#3b82f6', bgcolor: '#f8fafc' } }}
               onClick={() => setMockupPickerOpen(true)}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <DashboardCustomizeIcon sx={{ fontSize: 32, color: '#3b82f6' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e40af' }}>
                {t('modeNewStep.pattern.mockup.title')}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {t('modeNewStep.pattern.mockup.desc')}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper variant="outlined"
               sx={{ p: 2, cursor: 'pointer', '&:hover': { borderColor: '#10b981', bgcolor: '#f0fdf4' } }}
               onClick={() => setUiPatternPickerOpen(true)}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ViewQuiltIcon sx={{ fontSize: 32, color: '#10b981' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#065f46' }}>
                {t('modeNewStep.pattern.uiPattern.title')}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {t('modeNewStep.pattern.uiPattern.desc')}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* [Dashboard] 패턴 카드 — INSIGHT_ENABLED=false 면 숨김. */}
        {INSIGHT_ENABLED && (
        <Paper variant="outlined"
               sx={{ p: 2, cursor: 'pointer', '&:hover': { borderColor: '#0ea5e9', bgcolor: '#f0f9ff' } }}
               onClick={() => setStage('DASHBOARD')}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <DashboardIcon sx={{ fontSize: 32, color: '#0ea5e9' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#075985' }}>
                {t('modeNewStep.pattern.dashboard.title')}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {t('modeNewStep.pattern.dashboard.desc')}
              </Typography>
            </Box>
          </Stack>
        </Paper>
        )}

        <Paper variant="outlined"
               sx={{ p: 2, cursor: 'pointer', '&:hover': { borderColor: '#8b5cf6', bgcolor: '#faf5ff' } }}
               onClick={() => startWithPattern('P02')}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <EditOutlinedIcon sx={{ fontSize: 32, color: '#8b5cf6' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#5b21b6' }}>
                {t('modeNewStep.pattern.blank.title')}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {t('modeNewStep.pattern.blank.desc')}
              </Typography>
            </Box>
          </Stack>
        </Paper>

      </Stack>
    </Box>

    <MockupPickerDialog
      open={mockupPickerOpen}
      onClose={() => setMockupPickerOpen(false)}
      currentValue={null}
      onConfirm={(entry) => {
        setMockupPickerOpen(false);
        if (!entry) return;  // 사용자가 '해제' 한 경우
        setSpec(specFromMockup(entry, { title: t('modeNewStep.newScreenDefault'), menuCd: '' }));
        setStage('WIZARD');
      }}
    />
    <UiPatternPickerDialog
      open={uiPatternPickerOpen}
      onClose={() => setUiPatternPickerOpen(false)}
      currentValue={null}
      onConfirm={(entry) => {
        setUiPatternPickerOpen(false);
        if (!entry) return;
        setSpec(specFromUiPattern(entry, { title: t('modeNewStep.newScreenDefault'), menuCd: '' }));
        setStage('WIZARD');
      }}
    />
    </>
  );
}

export default ModeNewStep;

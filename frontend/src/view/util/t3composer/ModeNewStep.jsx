/**
 * ModeNewStep — NEW_STEP 모드 진입 화면. 패턴 picker 3 옵션.
 *   ① SCM Mockup (54개) — MockupPickerDialog
 *   ② UI Pattern (730개) — UiPatternPickerDialog
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
import { Box, Typography, Button, Stack, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import ViewQuiltIcon          from '@mui/icons-material/ViewQuilt';
import EditOutlinedIcon       from '@mui/icons-material/EditOutlined';

import ComposerWizard from './ComposerWizard';
import MockupPickerDialog from './MockupPickerDialog';
import UiPatternPickerDialog from './UiPatternPickerDialog';
import { specFromPattern, specFromMockup, specFromUiPattern } from './wizardState';
import { useTargetStore } from './targetStore';

function ModeNewStep({ onBack }) {
  // 단계: 'PICK' (패턴 선택) | 'WIZARD' (4단계 Wizard)
  const [stage, setStage] = useState('PICK');
  const [spec, setSpec]   = useState(null);
  const [mockupPickerOpen, setMockupPickerOpen] = useState(false);
  const [uiPatternPickerOpen, setUiPatternPickerOpen] = useState(false);
  const currentTargetCd = useTargetStore((s) => s.currentTargetCd);

  const startWithPattern = (patternCode) => {
    setSpec(specFromPattern(patternCode, { title: '새 화면', menuCd: '', pattern: patternCode }));
    setStage('WIZARD');
  };

  if (stage === 'WIZARD' && spec) {
    return (
      <ComposerWizard
        initialSpec={spec}
        targetCd={currentTargetCd}
        onBack={() => { setSpec(null); setStage('PICK'); }}
      />
    );
  }

  // stage === 'PICK'
  return (
    <>
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={onBack}>뒤로</Button>
        <Typography variant="h6" sx={{ color: '#1e40af', fontWeight: 800 }}>
          단계별 화면 생성 (Beta) — 패턴 선택
        </Typography>
      </Stack>

      <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
        화면의 시작 골격을 선택하세요. 선택 후 4단계 Wizard 에서 Layout / 데이터·검색조건 / 메타·메뉴 / 화면 생성 순으로 진행합니다.
      </Typography>

      <Stack spacing={2}>

        <Paper variant="outlined"
               sx={{ p: 2, cursor: 'pointer', '&:hover': { borderColor: '#3b82f6', bgcolor: '#f8fafc' } }}
               onClick={() => setMockupPickerOpen(true)}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <DashboardCustomizeIcon sx={{ fontSize: 32, color: '#3b82f6' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e40af' }}>
                SCM UI Mockup (54개)
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                T3SmartSCM 도메인 패턴 54개에서 선택 — layoutCategory 별 layer 자동 prefill
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
                T3MES UI Pattern (730개)
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                T3MES 퍼블리싱 패턴 730개에서 선택 — 단일 layer + 패턴 식별자 보존
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper variant="outlined"
               sx={{ p: 2, cursor: 'pointer', '&:hover': { borderColor: '#8b5cf6', bgcolor: '#faf5ff' } }}
               onClick={() => startWithPattern('P02')}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <EditOutlinedIcon sx={{ fontSize: 32, color: '#8b5cf6' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#5b21b6' }}>
                빈 캔버스 (P02 — 검색 + 단일 그리드)
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                가장 일반적인 마스터 CRUD 패턴으로 시작
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
        setSpec(specFromMockup(entry, { title: '새 화면', menuCd: '' }));
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
        setSpec(specFromUiPattern(entry, { title: '새 화면', menuCd: '' }));
        setStage('WIZARD');
      }}
    />
    </>
  );
}

export default ModeNewStep;

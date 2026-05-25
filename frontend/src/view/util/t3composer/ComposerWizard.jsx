/**
 * ComposerWizard — ComposerCanvas 4단계 wrapper.
 *
 *   props:
 *     initialSpec    ComposerSpec (mockup/uipattern picker 또는 빈 spec 으로 진입)
 *     targetCd       활성 Target — Step 들이 prop chain 으로 받음
 *     onBack         "← 뒤로" — picker 단계로 돌아갈 콜백 (ModeNewStep 가 PICK 단계 복귀)
 *
 *   stage:
 *     ① 'LAYOUT'   — 패턴 + Layer 자유 편집
 *     ② 'DATA'     — 데이터 + FilterBar
 *     ③ 'META'     — 화면 제목 / 메뉴 코드 / 부모 메뉴
 *     ④ 'GENERATE' — Claude 호출 + ComposerWorkspace 임베드
 *
 *   spec: docs/superpowers/specs/2026-05-22-composer-canvas-wizard-redesign-design.md
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e1.md (Task 2)
 */
import React, { useState } from 'react';
import { Box, Button, Stack, Typography, Snackbar, Alert } from '@mui/material';
import ArrowBackIcon    from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import LayoutStep        from './LayoutStep';
import DataAndFilterStep from './DataAndFilterStep';
import MetaStep          from './MetaStep';
import GenerateStep      from './GenerateStep';

const STEPS = [
  { id: 'LAYOUT',   label: '① Layout',         color: '#16a34a', bg: '#f0fdf4', border: '#16a34a' },
  { id: 'DATA',     label: '② 데이터·검색조건', color: '#713f12', bg: '#fef9c3', border: '#facc15' },
  { id: 'META',     label: '③ 메타·메뉴',      color: '#1e40af', bg: '#eff6ff', border: '#2563eb' },
  { id: 'GENERATE', label: '④ 화면 생성',      color: '#5b21b6', bg: '#f5f3ff', border: '#9D8FD4' },
];

function ComposerWizard({ initialSpec, targetCd, onBack }) {
  const [spec, setSpec] = useState(initialSpec);
  const [step, setStep] = useState('LAYOUT');
  const [validationError, setValidationError] = useState(null);

  const curIdx = STEPS.findIndex((s) => s.id === step);
  const isFirst = curIdx === 0;
  const isLast  = curIdx === STEPS.length - 1;

  // 단계 진행 전 검증 — null 반환 시 통과, 문자열 반환 시 차단 + 토스트.
  const validateStep = (stepId) => {
    if (stepId === 'DATA') {
      const items = spec?.filterBar?.items || [];
      const blanks = items.filter((it) => !(it.label || '').trim());
      if (blanks.length > 0) {
        return `FilterBar 필드 ${blanks.length}개에 라벨이 비어있습니다. 입력 후 다음으로 진행하세요.`;
      }
      // Phase 2D-2a — Layer 관계의 orphan 검사 (존재하지 않는 layer 참조 차단)
      const layerKeys = new Set((spec?.layers || []).map((l) => l.key));
      const relations = spec?.relations || [];
      const orphans = relations.filter((r) =>
        !layerKeys.has(r.source?.layerKey) || !layerKeys.has(r.target?.layerKey)
      );
      if (orphans.length > 0) {
        return `Layer 관계 ${orphans.length}개의 source/target layer 가 존재하지 않습니다. 정리 후 다음으로 진행.`;
      }
    }
    if (stepId === 'META') {
      // 부모 메뉴 필수 — 메뉴 등록 시 PARENT_ID lookup 필요. 누락 시 Claude 가 추론하면
      // 실제 운영 메뉴에 없는 코드를 만들어 backend apply 실패.
      if (!(spec?.meta?.parentMenuCd || '').trim()) {
        return '부모 메뉴를 선택하세요. [메뉴 선택] 으로 등록 위치를 지정해야 합니다.';
      }
    }
    return null;
  };

  const goPrev = () => { if (!isFirst) setStep(STEPS[curIdx - 1].id); };
  const goNext = () => {
    if (isLast) return;
    const err = validateStep(step);
    if (err) { setValidationError(err); return; }
    setStep(STEPS[curIdx + 1].id);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* ── 상단 헤더 (뒤로 + 현재 spec 메타 hint) ── */}
      <Stack direction="row" alignItems="center" spacing={1}
             sx={{ p: 1, borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={onBack}>
          패턴 다시 선택
        </Button>
        <Typography variant="caption" sx={{ color: '#64748b', ml: 1 }}>
          pattern: <b>{spec?.meta?.pattern || 'BLANK'}</b>
          {spec?.meta?.menuCd && (
            <> · menu: <b>{spec.meta.menuCd}</b></>
          )}
        </Typography>
      </Stack>

      {/* ── Stepper ── */}
      <Box sx={{ p: 1.2, borderBottom: '1px solid #e2e8f0', flexShrink: 0,
                 display: 'flex', gap: 1, alignItems: 'center', bgcolor: '#fafafa' }}>
        {STEPS.map((s, i) => {
          const active = s.id === step;
          return (
            <React.Fragment key={s.id}>
              <Box
                onClick={() => setStep(s.id)}
                sx={{
                  flex: 1, py: 1, px: 1.5, borderRadius: 1.5,
                  cursor: 'pointer',
                  bgcolor: active ? s.bg : '#fff',
                  border: active ? `2px solid ${s.border}` : '1px solid #cbd5e1',
                  color: active ? s.color : '#64748b',
                  fontWeight: active ? 800 : 600,
                  fontSize: 12, textAlign: 'center',
                  transition: 'all 0.15s ease',
                  '&:hover': active ? {} : { bgcolor: '#f1f5f9', borderColor: '#94a3b8' },
                }}
              >
                {s.label}
              </Box>
              {i < STEPS.length - 1 && (
                <Box sx={{ color: '#cbd5e1', flexShrink: 0 }}>›</Box>
              )}
            </React.Fragment>
          );
        })}
      </Box>

      {/* ── Step 본문 ──
           GENERATE 단계는 ComposerWorkspace 가 자체 split-pane/chat/preview 를 height:100% 로
           채우므로 padding/overflow 없이 그대로 mount (overflow:auto 가 있으면 내부 flex 가 깨짐). */}
      <Box sx={{
        flex: 1, minHeight: 0,
        ...(step === 'GENERATE'
          ? { display: 'flex', flexDirection: 'column' }
          : { overflow: 'auto', p: 1.5 }),
      }}>
        {step === 'LAYOUT'   && <LayoutStep        spec={spec} onChange={setSpec} targetCd={targetCd} />}
        {step === 'DATA'     && <DataAndFilterStep spec={spec} onChange={setSpec} targetCd={targetCd} />}
        {step === 'META'     && <MetaStep          spec={spec} onChange={setSpec} targetCd={targetCd} />}
        {step === 'GENERATE' && <GenerateStep      spec={spec}                     targetCd={targetCd} onBackToWizard={() => setStep('META')} />}
      </Box>

      {/* ── 단계 검증 토스트 (FilterBar 라벨 미입력 등) ── */}
      <Snackbar
        open={!!validationError}
        autoHideDuration={5000}
        onClose={() => setValidationError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="warning"
          onClose={() => setValidationError(null)}
          sx={{ fontWeight: 600 }}
        >
          {validationError}
        </Alert>
      </Snackbar>

      {/* ── Footer (← 이전 / 다음 →) — GENERATE 단계에서는 숨김 ── */}
      {step !== 'GENERATE' && (
        <Stack direction="row" spacing={1} sx={{
          p: 1, borderTop: '1px solid #e2e8f0', flexShrink: 0,
          bgcolor: '#fafafa', justifyContent: 'space-between',
        }}>
          <Button
            size="small" variant="outlined"
            startIcon={<ArrowBackIcon fontSize="small" />}
            onClick={goPrev} disabled={isFirst}
          >
            이전
          </Button>
          <Button
            size="small" variant="contained"
            endIcon={<ArrowForwardIcon fontSize="small" />}
            onClick={goNext}
            sx={{
              bgcolor: STEPS[curIdx + 1]?.border || '#2563eb',
              '&:hover': { bgcolor: STEPS[curIdx + 1]?.border || '#1d4ed8', opacity: 0.85 },
              fontWeight: 700,
            }}
          >
            다음: {STEPS[curIdx + 1]?.label.replace(/^[①②③④]\s*/, '') || '끝'}
          </Button>
        </Stack>
      )}
    </Box>
  );
}

export default ComposerWizard;

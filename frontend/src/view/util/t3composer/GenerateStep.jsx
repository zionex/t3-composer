/**
 * GenerateStep — ④ 화면 생성·미리보기 단계.
 *   진입 시 자동 createSession (mode='NEW_STEP') → ComposerWorkspace 임베드.
 *   "← 이전 단계로" 버튼 (extraHeader) — 메타 단계 (③) 로 복귀.
 *
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e1.md (Task 6)
 */
import React, { useEffect, useState, useRef } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import ComposerWorkspace from './ComposerWorkspace';
import { specToInitialPrompt } from './wizardState';
import { createSession } from './api';

function GenerateStep({ spec, targetCd, onBackToWizard }) {
  const [session, setSession] = useState(null);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const triedRef = useRef(false);  // mount 시 1회만 createSession

  useEffect(() => {
    if (triedRef.current) return;
    triedRef.current = true;
    let alive = true;
    (async () => {
      setCreating(true);
      setError(null);
      try {
        const promptText = specToInitialPrompt(spec);
        const title = (spec?.meta?.title || '새 화면').slice(0, 80);
        // 사용자가 MetaStep 에서 명시 입력한 menuCd 가 있으면 세션 row 에 즉시 기록.
        // 빈 경우는 Claude 가 MENU_SQL 산출 후 backend 가 추출해 채움.
        const explicitMenuCd = (spec?.meta?.menuCd || '').trim() || null;
        // ★ mode 는 spec.meta.mode 우선 (Task 1.1 에서 ComposerWizard 가 prop 으로
        //    받아 spec.meta.mode 에 저장). 5 모드 (NEW_STEP/NEW_FROM_COPY/
        //    EXISTING_MODIFY/NEW_FROM_DESIGN/NEW_NL/NEW_GENERAL) backend 가 mode 별
        //    정책 (예: NEW_FROM_COPY 의 SP 누락 허용 — rules/41 §1.1.1) 적용.
        const mode = spec?.meta?.mode || 'NEW_STEP';
        // 진단 — createSession 의 mode 가 NEW_STEP 으로 오면 spec.meta.mode 누락.
        // 그 경우 ComposerWizard 의 mode prop 또는 initialSpec.meta.mode 추적 필요.
        console.info('[Composer GenerateStep] createSession mode=', mode,
          '· spec.meta.mode=', spec?.meta?.mode, '· spec.meta keys=', Object.keys(spec?.meta || {}));
        const res = await createSession({
          mode,
          title,
          modelName: 'claude-sonnet-4-5',
          targetCd,
          targetMenuCd: explicitMenuCd,
        });
        if (!alive) return;
        setSession(res.data);
        setInitialPrompt(promptText);
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message
              || e?.response?.data?.error
              || e?.message
              || '세션 생성 실패');
      } finally {
        if (alive) setCreating(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (creating) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', height: '100%', gap: 2 }}>
        <CircularProgress size={32} />
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          세션 생성 중 — Claude 호출 준비
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body2" sx={{
          color: '#991b1b', bgcolor: '#fee2e2', border: '1px solid #fecaca',
          p: 2, borderRadius: 1, fontWeight: 600,
        }}>
          ⚠ {error}
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBackToWizard}
          sx={{ mt: 2 }}
        >
          이전 단계로
        </Button>
      </Box>
    );
  }

  if (!session) return null;

  // 부모 (ComposerWizard) 가 GENERATE 단계에서는 padding/overflow 없이 flex column 으로 mount.
  // ComposerWorkspace 가 self-contained 로 height:100% 채움.
  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <ComposerWorkspace
        session={session}
        initialPrompt={initialPrompt}
        extraHeader={
          <Button
            size="small"
            startIcon={<ArrowBackIcon fontSize="small" />}
            onClick={onBackToWizard}
            sx={{ mr: 1 }}
          >
            이전 단계
          </Button>
        }
      />
    </Box>
  );
}

export default GenerateStep;

/**
 * MetaStep — ③ 메타·메뉴 단계.
 *   spec.meta 직접 갱신 (Phase 2E-1 에서 ScreenMetaDialog popup 의 본문을 inline form 으로 추출,
 *   Phase 2E-3 에서 ScreenMetaDialog 파일 자체 삭제).
 *
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e1.md (Task 5)
 */
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import {
  Box, TextField, Typography, Stack, Chip, Button, Alert,
} from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

import MenuPickerDialog from './MenuPickerDialog';
import { checkMenuExists } from './api';

function MetaStep({ spec, onChange, targetCd }) {
  const { t } = useTranslation('wizard');
  const meta = spec?.meta || {};
  const [menuPickerOpen, setMenuPickerOpen] = useState(false);
  const [parentMenuLabel, setParentMenuLabel] = useState(meta.parentMenuCd || '');
  // 부모 메뉴 default 검증 상태:
  //   null  — 검사 안 됨 (초기)
  //   'ok'  — 운영 DB 에 존재 확인됨
  //   'gone' — default 값이 운영 DB 에 없어 clear 됨 (사용자에게 안내)
  const [parentValidation, setParentValidation] = useState(null);
  const [clearedParent, setClearedParent] = useState('');   // clear 된 부모 코드 (안내문 표시용)
  const lastValidatedRef = useRef('');

  const update = (patch) => {
    onChange({ ...spec, meta: { ...meta, ...patch } });
  };

  // 부모 메뉴 default 검증 — Composer 가 도메인 prefix 기반으로 자동 채워 넣은 값이
  // 실제 운영 DB 에 없는 경우 (예: 'MENU_AD' · 'MENU_UTIL') 가 흔하다. 그대로 두면
  // 메뉴 등록 시점에 PARENT_ID = NULL 로 빠지는 사고 → 진입 시점에 한 번 검증해 없으면 clear.
  //   - sourceMenu.parentMenuCd 로 자연 채워진 값 (NEW_FROM_COPY) 은 통상 존재.
  //   - parentMenuCdFor(moduleCode) 로 추측한 값 (NEW_NL/NEW_GENERAL/empty spec) 은 부재 가능.
  useEffect(() => {
    const cd = (meta.parentMenuCd || '').trim();
    if (!cd || !targetCd) {
      setParentValidation(null);
      return;
    }
    if (lastValidatedRef.current === `${cd}|${targetCd}`) return;
    lastValidatedRef.current = `${cd}|${targetCd}`;

    let cancelled = false;
    checkMenuExists(cd, targetCd)
      .then((res) => {
        if (cancelled) return;
        const ok = !!res?.data?.exists;
        if (ok) {
          setParentValidation('ok');
          setClearedParent('');
        } else {
          // 운영 DB 에 없는 값 — 자동 clear + 사용자에게 [메뉴 선택] 으로 정정 안내
          setClearedParent(cd);
          setParentValidation('gone');
          setParentMenuLabel('');
          update({ parentMenuCd: '' });
        }
      })
      .catch(() => {
        // 검증 실패 (네트워크 등) — 검증 안 함, 값 유지
        if (cancelled) return;
        setParentValidation(null);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.parentMenuCd, targetCd]);

  const handleParentSelect = (selectedMenu) => {
    if (!selectedMenu) return;
    const cd = selectedMenu.menuCd || selectedMenu.id || '';
    // ★ 사용자가 트리(loadTargetMenuTree 결과)에서 직접 선택한 값 — 트리가 곧 운영 진실(JS_FILE 또는 DB).
    //   이후 trigger 되는 검증 useEffect 가 backend `checkMenuExists` (TB_AD_MENU 만 봄) 로
    //   PLANNEL JS_FILE 그룹을 부정해서 자동 clear 하는 사고 차단 (2026-05-28).
    //   lastValidatedRef 를 미리 같은 키로 세팅하면 useEffect 가 "이미 검증함" 으로 판단해 skip.
    lastValidatedRef.current = `${cd}|${targetCd || ''}`;
    update({ parentMenuCd: cd });
    setParentMenuLabel(selectedMenu.menuNm
      ? `${cd} (${selectedMenu.menuNm})`
      : cd);
    setMenuPickerOpen(false);
    setParentValidation('ok');
    setClearedParent('');
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Typography variant="h6" sx={{ color: '#1e40af', fontWeight: 800, mb: 0.5 }}>
        {t('step.meta.title')}
      </Typography>
      <Typography variant="caption" sx={{ color: '#64748b', mb: 2, display: 'block' }}>
        {t('step.meta.hint')}
      </Typography>

      <Stack spacing={2}>
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
            {t('step.meta.screenTitleLabel')}
          </Typography>
          <TextField
            value={meta.title || ''}
            onChange={(e) => update({ title: e.target.value })}
            fullWidth size="small"
            placeholder={t('step.meta.screenTitlePlaceholder')}
            sx={{ mt: 0.5 }}
          />
        </Box>

        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
            {t('step.meta.menuCdLabel')} <code style={{ fontSize: 11 }}>{t('step.meta.menuCdFormat')}</code>
          </Typography>
          <TextField
            value={meta.menuCd || ''}
            onChange={(e) => update({ menuCd: e.target.value.toUpperCase() })}
            fullWidth size="small"
            placeholder={t('step.meta.menuCdPlaceholder')}
            helperText={t('step.meta.menuCdHelper')}
            FormHelperTextProps={{ sx: { fontSize: 10 } }}
            sx={{ mt: 0.5, '& input': { fontFamily: 'monospace' } }}
          />
        </Box>

        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
            {t('step.meta.menuFilePathLabel')}
          </Typography>
          <TextField
            value={meta.menuFilePath || ''}
            onChange={(e) => update({ menuFilePath: e.target.value })}
            fullWidth size="small"
            placeholder={t('step.meta.menuFilePathPlaceholder')}
            helperText={t('step.meta.menuFilePathHelper')}
            FormHelperTextProps={{ sx: { fontSize: 10 } }}
            sx={{ mt: 0.5, '& input': { fontFamily: 'monospace' } }}
          />
        </Box>

        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
            {t('step.meta.parentMenuLabel')}
            <Typography component="span" sx={{ color: '#E0989A', fontWeight: 700, ml: 0.3 }}>*</Typography>
            <Typography component="span" sx={{ color: '#94a3b8', fontWeight: 400, fontSize: 11, ml: 0.5 }}>
              {t('step.meta.parentMenuRequired')}
            </Typography>
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.7 }}>
            {meta.parentMenuCd ? (
              <>
                <Chip
                  label={parentMenuLabel || meta.parentMenuCd}
                  onDelete={() => { update({ parentMenuCd: '' }); setParentMenuLabel(''); }}
                  sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 700,
                         fontFamily: 'monospace' }}
                />
                {parentValidation === 'ok' && (
                  <Chip label={t('step.meta.parentMenuOk')} size="small" color="success" variant="outlined"
                        sx={{ fontSize: 10 }} />
                )}
              </>
            ) : (
              <Typography variant="caption" sx={{ color: '#E0989A', fontStyle: 'italic' }}>
                {t('step.meta.parentMenuMissing')}
              </Typography>
            )}
            <Button
              size="small" variant="outlined"
              startIcon={<AccountTreeIcon fontSize="small" />}
              onClick={() => setMenuPickerOpen(true)}
              disabled={!targetCd}
            >
              {t('step.meta.selectMenu')}
            </Button>
          </Stack>
          {/* default 가 운영 DB 에 없어 clear 된 경우 — 사용자에게 명시적으로 안내 */}
          {parentValidation === 'gone' && clearedParent && (
            <Alert severity="warning" sx={{ mt: 0.8, py: 0.3,
                   '& .MuiAlert-message': { fontSize: 11.5 } }}>
              <Trans
                i18nKey="step.meta.parentMenuGone"
                ns="wizard"
                values={{ cd: clearedParent, targetCd }}
                components={{ b: <b style={{ fontFamily: 'monospace' }} /> }}
              />
            </Alert>
          )}
        </Box>
      </Stack>

      <MenuPickerDialog
        open={menuPickerOpen}
        onClose={() => setMenuPickerOpen(false)}
        onSelect={handleParentSelect}
        selectGroupOnly={true}
        targetCd={targetCd}
      />
    </Box>
  );
}

export default MetaStep;

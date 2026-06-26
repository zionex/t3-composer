// =============================================================================
// TargetSystemSelector — Composer Landing 헤더에 노출되는 Target 전환 dropdown.
// 사용자가 선택한 Target 은 localStorage 영속화 + zustand store 에 반영되어
// Phase 3 의 chat / wizard 호출에 자동 전달된다.
//
// Target 전환 시 그 Target 의 거버넌스 스냅샷과 현재 디스크가 다르면
// 확인 다이얼로그를 거쳐 복원한다 (targetStore.switchTarget).
// =============================================================================
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Box, Chip, CircularProgress, Menu, MenuItem,
  Tooltip, Typography, Stack, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert,
} from '@mui/material';
import LanguageIcon       from '@mui/icons-material/Language';
import ExpandMoreIcon     from '@mui/icons-material/ExpandMore';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import StorageIcon        from '@mui/icons-material/Storage';
import CameraAltIcon      from '@mui/icons-material/CameraAlt';

import { useTargetStore, getCurrentTarget } from './targetStore';
import { getTargetSnapshotStatus } from './api';
import TargetDbConnectionDialog from './TargetDbConnectionDialog';
import TargetSnapshotDialog from './TargetSnapshotDialog';

export default function TargetSystemSelector({ darkMode = true }) {
  const { t } = useTranslation('composer');
  const targets         = useTargetStore((s) => s.targets);
  const loading         = useTargetStore((s) => s.loading);
  const loaded          = useTargetStore((s) => s.loaded);
  const currentTargetCd = useTargetStore((s) => s.currentTargetCd);
  const loadTargets     = useTargetStore((s) => s.loadTargets);
  const switchTarget    = useTargetStore((s) => s.switchTarget);
  const pendingRestore  = useTargetStore((s) => s.pendingRestore);
  const restoreBusy     = useTargetStore((s) => s.restoreBusy);
  const confirmRestore  = useTargetStore((s) => s.confirmPendingRestore);
  const dismissRestore  = useTargetStore((s) => s.dismissPendingRestore);

  const [anchorEl, setAnchorEl]             = React.useState(null);
  const [dbDialogTarget, setDbDialogTarget] = React.useState(null);
  const [snapDialogTarget, setSnapDialogTarget] = React.useState(null);
  const [statuses, setStatuses]             = React.useState({});   // targetCd → status
  const [restoreResult, setRestoreResult]   = React.useState(null); // { ok, summary, error }

  useEffect(() => {
    if (!loaded && !loading) loadTargets();
  }, [loaded, loading, loadTargets]);

  // 메뉴 열릴 때 각 Target 의 스냅샷 상태를 가볍게 조회
  const loadStatuses = React.useCallback(async (list) => {
    const entries = await Promise.all((list || []).map(async (t) => {
      try {
        const res = await getTargetSnapshotStatus(t.targetCd);
        return [t.targetCd, res?.data || null];
      } catch { return [t.targetCd, null]; }
    }));
    setStatuses(Object.fromEntries(entries));
  }, []);

  const openMenu = (e) => {
    setAnchorEl(e.currentTarget);
    loadStatuses(targets);
  };

  const current = getCurrentTarget();
  const label   = current?.targetName || (loading ? t('targetSystem.loading') : t('targetSystem.pickTarget'));

  // A시안 .chip 룩 — 흰 배경 + #ECEEF1 보더 + #4B5563 텍스트. darkMode prop 은 deprecated.
  const bg     = '#FFFFFF';
  const border = '#ECEEF1';
  const color  = '#4B5563';
  const hover  = '#F7FAFB';

  const snapChip = (st) => {
    if (!st) return null;
    if (!st.hasSnapshot) {
      return <Chip size="small" label={t('targetSystem.snapshot.none')}
                   sx={{ height: 17, fontSize: 9.5, bgcolor: '#e2e8f0', color: '#475569' }} />;
    }
    if (st.inSync) {
      return <Chip size="small" label={t('targetSystem.snapshot.inSync')}
                   sx={{ height: 17, fontSize: 9.5, bgcolor: '#dcfce7', color: '#15803d' }} />;
    }
    return <Chip size="small" label={t('targetSystem.snapshot.changeCount', { n: st.changeCount ?? '?' })}
                 sx={{ height: 17, fontSize: 9.5, bgcolor: '#fef3c7', color: '#b45309' }} />;
  };

  const handleConfirmRestore = async () => {
    const r = await confirmRestore();
    setRestoreResult(r || { ok: false });
  };

  const pr = pendingRestore;
  const prStatus = pr?.status || {};

  return (
    <>
      <Tooltip title={current
        ? t('targetSystem.tooltipCurrent', { name: current.targetName, dbType: current.dbType, grid: current.gridLibrary })
        : t('targetSystem.tooltipEmpty')}>
        <Chip
          size="small"
          clickable
          disabled={loading || targets.length === 0}
          onClick={openMenu}
          icon={loading
            ? <CircularProgress size={14} sx={{ ml: 0.7, color: color + '!important' }} />
            : <StorageIcon sx={{ fontSize: 16, color: color + '!important' }} />}
          label={label}
          deleteIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}
          onDelete={openMenu}
          sx={{
            height: 32,
            borderRadius: '12px',
            fontSize: 12.5,
            fontWeight: 500,
            bgcolor: bg,
            border: `1px solid ${border}`,
            color,
            px: 0.4,
            '& .MuiChip-icon':       { ml: 0.6, mr: -0.2 },
            '& .MuiChip-label':      { px: 0.9 },
            '& .MuiChip-deleteIcon': { color: color + '!important', mr: 0.4 },
            '&:hover':               { bgcolor: hover, borderColor: '#CFE3EB' },
          }}
        />
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { minWidth: 320, mt: 0.5 } }}
      >
        <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 1 }}>
            TARGET SYSTEM
          </Typography>
        </Box>
        {targets.map((tgt) => {
          const active = tgt.targetCd === currentTargetCd;
          const dbConfigured = !!tgt.dbUrl;
          return (
            <MenuItem
              key={tgt.targetCd}
              onClick={() => { switchTarget(tgt.targetCd); setAnchorEl(null); }}
              selected={active}
              sx={{ alignItems: 'flex-start', py: 1 }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={0.7}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {tgt.targetName}
                    </Typography>
                    {active && <CheckCircleIcon sx={{ fontSize: 14, color: '#10b981' }} />}
                    {dbConfigured && (
                      <Tooltip title={t('targetSystem.dbConnectedTooltip', { url: tgt.dbUrl })}>
                        <StorageIcon sx={{ fontSize: 12, color: '#0ea5e9' }} />
                      </Tooltip>
                    )}
                    {snapChip(statuses[tgt.targetCd])}
                  </Stack>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {tgt.dbType} · {tgt.gridLibrary} · {tgt.frontendStack}
                    {tgt.cssFramework ? ` · ${tgt.cssFramework}` : ''}
                  </Typography>
                </Box>
                <Tooltip title={t('targetSystem.governanceSnapshotTooltip')}>
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); setSnapDialogTarget(tgt.targetCd); setAnchorEl(null); }}
                  >
                    <CameraAltIcon fontSize="small" sx={{ color: '#9d8fd4' }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('targetSystem.dbConnectionTooltip')}>
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); setDbDialogTarget(tgt.targetCd); setAnchorEl(null); }}
                  >
                    <StorageIcon fontSize="small" sx={{ color: dbConfigured ? '#0ea5e9' : '#94a3b8' }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </MenuItem>
          );
        })}
        {targets.length === 0 && !loading && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              {t('targetSystem.noTargets')}
            </Typography>
          </Box>
        )}
      </Menu>

      <TargetDbConnectionDialog
        open={!!dbDialogTarget}
        targetCd={dbDialogTarget}
        onClose={() => setDbDialogTarget(null)}
        onSaved={() => loadTargets()}
      />

      <TargetSnapshotDialog
        open={!!snapDialogTarget}
        targetCd={snapDialogTarget}
        onClose={() => setSnapDialogTarget(null)}
        onChanged={() => loadStatuses(targets)}
      />

      {/* Target 전환 시 스냅샷 불일치 → 복원 확인 */}
      <Dialog
        open={!!pr}
        onClose={restoreBusy ? undefined : () => { dismissRestore({}); setRestoreResult(null); }}
        maxWidth="sm" fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t('targetSystem.restoreDialog.title', { targetCd: pr?.targetCd })}
        </DialogTitle>
        <DialogContent dividers>
          {!restoreResult && (
            <>
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                <b>{pr?.targetCd}</b> {t('targetSystem.restoreDialog.mismatch')}
              </Typography>
              <Alert severity="info" sx={{ mb: 1.5 }}>
                {t('targetSystem.restoreDialog.preview', {
                  missing: prStatus.missing?.length ?? 0,
                  modified: prStatus.modified?.length ?? 0,
                  extra: prStatus.extra?.length ?? 0,
                })}
              </Alert>
            </>
          )}
          {restoreResult && (
            <Alert severity={restoreResult.ok === false ? 'error' : 'success'}>
              {restoreResult.ok === false
                ? (restoreResult.error || t('targetSystem.restoreDialog.failed'))
                : t('targetSystem.restoreDialog.completed', { summary: restoreResult.summary || '' })}
            </Alert>
          )}
          {restoreBusy && (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.5 }}>
              <CircularProgress size={16} />
              <Typography variant="caption">{t('targetSystem.restoreDialog.busy')}</Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {!restoreResult && (
            <>
              <Button onClick={() => dismissRestore({})} disabled={restoreBusy}>
                {t('targetSystem.restoreDialog.cancel')}
              </Button>
              <Button onClick={() => dismissRestore({ switchAnyway: true })} disabled={restoreBusy}>
                {t('targetSystem.restoreDialog.switchWithout')}
              </Button>
              <Button variant="contained" onClick={handleConfirmRestore} disabled={restoreBusy}>
                {t('targetSystem.restoreDialog.restoreAndSwitch')}
              </Button>
            </>
          )}
          {restoreResult && (
            <Button variant="contained" onClick={() => { dismissRestore({}); setRestoreResult(null); }}>
              {t('targetSystem.restoreDialog.close')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

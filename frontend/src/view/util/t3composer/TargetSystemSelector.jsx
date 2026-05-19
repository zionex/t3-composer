// =============================================================================
// TargetSystemSelector — Composer Landing 헤더에 노출되는 Target 전환 dropdown.
// 사용자가 선택한 Target 은 localStorage 영속화 + zustand store 에 반영되어
// Phase 3 의 chat / wizard 호출에 자동 전달된다.
//
// Target 전환 시 그 Target 의 거버넌스 스냅샷과 현재 디스크가 다르면
// 확인 다이얼로그를 거쳐 복원한다 (targetStore.switchTarget).
// =============================================================================
import React, { useEffect } from 'react';

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
  const label   = current?.targetName || (loading ? '로딩중...' : 'Target 선택');

  const onDark = darkMode;
  const bg     = onDark ? 'rgba(255,255,255,0.18)' : 'rgba(67,56,202,0.08)';
  const border = onDark ? 'rgba(255,255,255,0.32)' : 'rgba(67,56,202,0.32)';
  const color  = onDark ? '#fff' : '#4338ca';
  const hover  = onDark ? 'rgba(255,255,255,0.28)' : 'rgba(67,56,202,0.14)';

  const snapChip = (st) => {
    if (!st) return null;
    if (!st.hasSnapshot) {
      return <Chip size="small" label="스냅샷 없음"
                   sx={{ height: 17, fontSize: 9.5, bgcolor: '#e2e8f0', color: '#475569' }} />;
    }
    if (st.inSync) {
      return <Chip size="small" label="동기화됨"
                   sx={{ height: 17, fontSize: 9.5, bgcolor: '#dcfce7', color: '#15803d' }} />;
    }
    return <Chip size="small" label={`${st.changeCount ?? '?'}건 변경`}
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
        ? `Target: ${current.targetName} (${current.dbType} · ${current.gridLibrary})`
        : 'Target System 선택'}>
        <Chip
          size="small"
          clickable
          disabled={loading || targets.length === 0}
          onClick={openMenu}
          icon={loading
            ? <CircularProgress size={12} sx={{ ml: 0.6, color: color + '!important' }} />
            : <LanguageIcon sx={{ fontSize: 14, color: color + '!important' }} />}
          label={label}
          deleteIcon={<ExpandMoreIcon sx={{ fontSize: 14 }} />}
          onDelete={openMenu}
          sx={{
            height: 24,
            fontSize: 11.5,
            fontWeight: 700,
            bgcolor: bg,
            border: `1px solid ${border}`,
            color,
            backdropFilter: 'blur(8px)',
            '& .MuiChip-deleteIcon': { color: color + '!important', mr: 0.3 },
            '&:hover': { bgcolor: hover },
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
        {targets.map((t) => {
          const active = t.targetCd === currentTargetCd;
          const dbConfigured = !!t.dbUrl;
          return (
            <MenuItem
              key={t.targetCd}
              onClick={() => { switchTarget(t.targetCd); setAnchorEl(null); }}
              selected={active}
              sx={{ alignItems: 'flex-start', py: 1 }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={0.7}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {t.targetName}
                    </Typography>
                    {active && <CheckCircleIcon sx={{ fontSize: 14, color: '#10b981' }} />}
                    {dbConfigured && (
                      <Tooltip title={`운영 DB 연결됨: ${t.dbUrl}`}>
                        <StorageIcon sx={{ fontSize: 12, color: '#0ea5e9' }} />
                      </Tooltip>
                    )}
                    {snapChip(statuses[t.targetCd])}
                  </Stack>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {t.dbType} · {t.gridLibrary} · {t.frontendStack}
                    {t.cssFramework ? ` · ${t.cssFramework}` : ''}
                  </Typography>
                </Box>
                <Tooltip title="거버넌스 설정 스냅샷 / 복원">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); setSnapDialogTarget(t.targetCd); setAnchorEl(null); }}
                  >
                    <CameraAltIcon fontSize="small" sx={{ color: '#9d8fd4' }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="운영 DB 접속 정보 설정">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); setDbDialogTarget(t.targetCd); setAnchorEl(null); }}
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
              등록된 Target 이 없습니다
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
          {pr?.targetCd} — 거버넌스 설정 복원
        </DialogTitle>
        <DialogContent dividers>
          {!restoreResult && (
            <>
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                <b>{pr?.targetCd}</b> 의 저장된 스냅샷과 현재 디스크가 다릅니다.
                이 Target 으로 전환하려면 스냅샷을 디스크로 복원해야 합니다.
              </Typography>
              <Alert severity="info" sx={{ mb: 1.5 }}>
                복원하면 누락 {prStatus.missing?.length ?? 0}개 재생성 ·
                변경 {prStatus.modified?.length ?? 0}개 원복 ·
                추가 {prStatus.extra?.length ?? 0}개 삭제됩니다.
                복원 직전 현재 상태는 자동 백업됩니다.
              </Alert>
            </>
          )}
          {restoreResult && (
            <Alert severity={restoreResult.ok === false ? 'error' : 'success'}>
              {restoreResult.ok === false
                ? (restoreResult.error || '복원 실패')
                : ('복원 완료 — ' + (restoreResult.summary || ''))}
            </Alert>
          )}
          {restoreBusy && (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.5 }}>
              <CircularProgress size={16} />
              <Typography variant="caption">복원 중...</Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {!restoreResult && (
            <>
              <Button onClick={() => dismissRestore({})} disabled={restoreBusy}>
                취소
              </Button>
              <Button onClick={() => dismissRestore({ switchAnyway: true })} disabled={restoreBusy}>
                복원 없이 전환
              </Button>
              <Button variant="contained" onClick={handleConfirmRestore} disabled={restoreBusy}>
                복원하고 전환
              </Button>
            </>
          )}
          {restoreResult && (
            <Button variant="contained" onClick={() => { dismissRestore({}); setRestoreResult(null); }}>
              닫기
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

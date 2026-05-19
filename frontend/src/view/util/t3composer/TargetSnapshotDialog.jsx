// =============================================================================
// TargetSnapshotDialog — Target 거버넌스 설정 스냅샷 관리.
//   · 현재 디스크 ↔ 스냅샷 diff 표시
//   · [현재 상태 스냅샷 저장]
//   · 스냅샷 목록 — 행별 [복원] / [삭제]
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';

import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, IconButton, Stack, Tooltip, Typography,
} from '@mui/material';
import CameraAltIcon     from '@mui/icons-material/CameraAlt';
import RestoreIcon       from '@mui/icons-material/Restore';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import RefreshIcon       from '@mui/icons-material/Refresh';

import {
  getTargetSnapshotStatus, listTargetSnapshots, captureTargetSnapshot,
  restoreTargetSnapshot, deleteTargetSnapshot,
} from './api';

const KIND_LABEL = { MANUAL: '수동', AUTO_BACKUP: '자동백업', SEED: '최초' };

const fmtDttm = (v) => {
  if (!v) return '';
  try { return new Date(v).toLocaleString('ko-KR', { hour12: false }); }
  catch { return String(v); }
};

export default function TargetSnapshotDialog({ open, targetCd, onClose, onChanged }) {
  const [loading, setLoading]     = useState(false);
  const [busy, setBusy]           = useState(false);
  const [status, setStatus]       = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [msg, setMsg]             = useState(null);   // { type, text }

  const refresh = useCallback(async () => {
    if (!targetCd) return;
    setLoading(true);
    try {
      const [st, ls] = await Promise.all([
        getTargetSnapshotStatus(targetCd),
        listTargetSnapshots(targetCd),
      ]);
      setStatus(st?.data || null);
      setSnapshots(Array.isArray(ls?.data) ? ls.data : []);
    } catch (e) {
      setMsg({ type: 'error', text: e?.response?.data?.error || e?.message || '조회 실패' });
    } finally {
      setLoading(false);
    }
  }, [targetCd]);

  useEffect(() => { if (open) { setMsg(null); refresh(); } }, [open, refresh]);

  const doCapture = async () => {
    setBusy(true); setMsg(null);
    try {
      const res = await captureTargetSnapshot(targetCd, {});
      const d = res?.data || {};
      if (d.ok === false) {
        setMsg({ type: 'error', text: d.error || '스냅샷 저장 실패' });
      } else {
        const fc = d.snapshot?.fileCount;
        setMsg({ type: 'success', text: `현재 상태를 스냅샷으로 저장했습니다 (파일 ${fc ?? '-'}개).` });
        await refresh();
        onChanged?.();
      }
    } catch (e) {
      setMsg({ type: 'error', text: e?.response?.data?.error || e?.message || '스냅샷 저장 실패' });
    } finally { setBusy(false); }
  };

  const doRestore = async (snap) => {
    if (!window.confirm(
        `스냅샷 #${snap.snapshotNo} (${snap.label || ''}) 을 디스크로 복원합니다.\n`
      + `스냅샷에 없는 파일은 삭제되고, 복원 직전 현재 상태는 자동 백업됩니다.\n계속할까요?`)) return;
    setBusy(true); setMsg(null);
    try {
      const res = await restoreTargetSnapshot(targetCd, snap.id, {});
      const d = res?.data || {};
      if (d.ok === false) {
        setMsg({ type: 'error', text: d.error || '복원 실패' });
      } else {
        setMsg({ type: 'success', text: '복원 완료 — ' + (d.summary || '') });
        await refresh();
        onChanged?.();
      }
    } catch (e) {
      setMsg({ type: 'error', text: e?.response?.data?.error || e?.message || '복원 실패' });
    } finally { setBusy(false); }
  };

  const doDelete = async (snap) => {
    if (!window.confirm(`스냅샷 #${snap.snapshotNo} 을 삭제할까요?`)) return;
    setBusy(true); setMsg(null);
    try {
      const res = await deleteTargetSnapshot(targetCd, snap.id);
      const d = res?.data || {};
      if (d.ok === false) setMsg({ type: 'error', text: d.error || '삭제 실패' });
      else { await refresh(); onChanged?.(); }
    } catch (e) {
      setMsg({ type: 'error', text: e?.response?.data?.error || e?.message || '삭제 실패' });
    } finally { setBusy(false); }
  };

  const renderStatus = () => {
    if (!status) return null;
    if (!status.hasSnapshot) {
      return <Chip size="small" label="스냅샷 없음" sx={{ bgcolor: '#e2e8f0', color: '#475569' }} />;
    }
    if (status.inSync) {
      return <Chip size="small" icon={<CheckCircleIcon />} label="디스크와 동기화됨"
                   sx={{ bgcolor: '#dcfce7', color: '#15803d' }} />;
    }
    const parts = [];
    if (status.missing?.length)  parts.push(`누락 ${status.missing.length}`);
    if (status.modified?.length) parts.push(`변경 ${status.modified.length}`);
    if (status.extra?.length)    parts.push(`추가 ${status.extra.length}`);
    if (status.targetRowChanged) parts.push('DB정보 변경');
    return <Chip size="small" label={`불일치 — ${parts.join(' · ')}`}
                 sx={{ bgcolor: '#fef3c7', color: '#b45309' }} />;
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
            거버넌스 설정 스냅샷 — {targetCd}
          </Typography>
          <Tooltip title="새로고침">
            <span>
              <IconButton size="small" onClick={refresh} disabled={loading || busy}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          .claude/** · CLAUDE.md · README · TROUBLESHOOTING · .env · docs/** + Target DB 접속정보
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {msg && (
          <Alert severity={msg.type} sx={{ mb: 1.5 }} onClose={() => setMsg(null)}>
            {msg.text}
          </Alert>
        )}

        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
          {loading ? <CircularProgress size={16} /> : renderStatus()}
          <Box sx={{ flex: 1 }} />
          <Button
            size="small" variant="contained" startIcon={<CameraAltIcon />}
            onClick={doCapture} disabled={busy || loading}
          >
            현재 상태 스냅샷 저장
          </Button>
        </Stack>

        <Divider sx={{ mb: 1 }} />
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 0.5 }}>
          스냅샷 목록 ({snapshots.length})
        </Typography>

        <Box sx={{ mt: 0.5 }}>
          {snapshots.length === 0 && !loading && (
            <Typography variant="body2" sx={{ color: '#94a3b8', py: 2, textAlign: 'center' }}>
              저장된 스냅샷이 없습니다. [현재 상태 스냅샷 저장] 으로 첫 스냅샷을 만드세요.
            </Typography>
          )}
          {snapshots.map((s) => (
            <Stack
              key={s.id} direction="row" alignItems="center" spacing={1}
              sx={{
                py: 0.9, px: 1, borderBottom: '1px solid #eef2f7',
                bgcolor: s.isCurrent ? '#f0f9ff' : 'transparent', borderRadius: 0.5,
              }}
            >
              <Typography sx={{ fontWeight: 700, width: 38 }}>#{s.snapshotNo}</Typography>
              <Chip size="small" label={KIND_LABEL[s.snapshotKind] || s.snapshotKind}
                    sx={{ height: 18, fontSize: 10 }} />
              {s.isCurrent && (
                <Chip size="small" icon={<CheckCircleIcon />} label="현재"
                      sx={{ height: 18, fontSize: 10, bgcolor: '#dcfce7', color: '#15803d' }} />
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                  {s.label || '(라벨 없음)'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  {fmtDttm(s.createDttm)} · 파일 {s.fileCount ?? '-'}개
                </Typography>
              </Box>
              <Tooltip title="이 스냅샷으로 디스크 복원">
                <span>
                  <IconButton size="small" onClick={() => doRestore(s)} disabled={busy}>
                    <RestoreIcon fontSize="small" sx={{ color: '#0ea5e9' }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={s.isCurrent ? '현재 스냅샷은 삭제 불가' : '스냅샷 삭제'}>
                <span>
                  <IconButton size="small" onClick={() => doDelete(s)} disabled={busy || s.isCurrent}>
                    <DeleteOutlineIcon fontSize="small" sx={{ color: s.isCurrent ? '#cbd5e1' : '#ef4444' }} />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          ))}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={busy}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
}

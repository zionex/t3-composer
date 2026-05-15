import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';

import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import RefreshIcon       from '@mui/icons-material/Refresh';
import PlayArrowIcon     from '@mui/icons-material/PlayArrow';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import ArchiveIcon       from '@mui/icons-material/Archive';
import RestoreIcon       from '@mui/icons-material/Restore';
import DeleteIcon        from '@mui/icons-material/Delete';
import HistoryIcon       from '@mui/icons-material/History';
import SearchIcon        from '@mui/icons-material/Search';

import { ContentInner, WorkArea } from '@wingui/common/imports';

import {
  listSessions,
  updateSessionStatus,
  deleteSession,
} from '../t3composer/api';

const STATUS_FILTERS = [
  { value: 'ALL',       label: '전체',     color: 'default' },
  { value: 'ACTIVE',    label: '진행중',   color: 'primary' },
  { value: 'COMPLETED', label: '완료',     color: 'success' },
  { value: 'ARCHIVED',  label: '보관',     color: 'default' },
];

const STATUS_CHIP = {
  ACTIVE:    { label: '진행중', color: 'primary' },
  COMPLETED: { label: '완료',   color: 'success' },
  ARCHIVED:  { label: '보관',   color: 'default' },
};

function fmtDt(s) {
  if (!s) return '-';
  // SessionDto.createDttm 은 LocalDateTime → ISO 문자열
  try {
    const d = new Date(s);
    return d.toLocaleString('ko-KR', { hour12: false });
  } catch { return String(s); }
}

function T3ComposerHistory() {
  const history = useHistory();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [filter, setFilter]     = useState('ALL');
  const [keyword, setKeyword]   = useState('');
  const [busyId, setBusyId]     = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'info', message: '' });

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listSessions();
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '세션 목록 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return sessions.filter((s) => {
      if (filter !== 'ALL' && (s.status || 'ACTIVE') !== filter) return false;
      if (k) {
        const hay = [s.title, s.mode, s.targetMenuCd, s.modelName].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(k)) return false;
      }
      return true;
    });
  }, [sessions, filter, keyword]);

  const counts = useMemo(() => {
    const c = { ALL: sessions.length, ACTIVE: 0, COMPLETED: 0, ARCHIVED: 0 };
    sessions.forEach((s) => {
      const st = s.status || 'ACTIVE';
      if (c[st] !== undefined) c[st]++;
    });
    return c;
  }, [sessions]);

  const handleResume = (s) => {
    // Tab Container 방식 — react-router push 가 아니라 window event 로
    //   ① 메인 (T3Composer) Tab 활성화 (이미 열려 있으면 그대로, 없으면 open)
    //   ② T3Composer 가 listen 하는 resume event 발화 — ComposerWorkspace 로 직진
    window.dispatchEvent(new CustomEvent('t3composer:openTab', { detail: { key: 'composer' } }));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('t3composer:resume', { detail: { sessionId: s.id } }));
    }, 50);
  };

  const handleStatus = async (s, status) => {
    setBusyId(s.id);
    try {
      await updateSessionStatus(s.id, status);
      setSnackbar({ open: true, severity: 'success', message: `${s.title || s.id} → ${status}` });
      await reload();
    } catch (e) {
      setSnackbar({
        open: true, severity: 'error',
        message: '상태 변경 실패: ' + (e?.response?.data?.message || e?.message || ''),
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    const s = confirmDel;
    setConfirmDel(null);
    setBusyId(s.id);
    try {
      await deleteSession(s.id);
      setSnackbar({ open: true, severity: 'success', message: `삭제됨: ${s.title || s.id}` });
      await reload();
    } catch (e) {
      setSnackbar({
        open: true, severity: 'error',
        message: '삭제 실패: ' + (e?.response?.data?.message || e?.message || ''),
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ContentInner>
      <WorkArea>
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Header */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <HistoryIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Composer 작업 이력
              </Typography>
              <Box sx={{ flex: 1 }} />
              <TextField
                size="small"
                placeholder="제목 / 메뉴코드 / 모드 검색"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} /> }}
                sx={{ width: 280 }}
              />
              <Tooltip title="새로고침">
                <IconButton size="small" onClick={reload} disabled={loading}>
                  {loading ? <CircularProgress size={18} /> : <RefreshIcon />}
                </IconButton>
              </Tooltip>
            </Stack>
            <Stack direction="row" spacing={0} sx={{ mt: 1.2 }}>
              <ToggleButtonGroup
                exclusive size="small"
                value={filter}
                onChange={(_, v) => { if (v) setFilter(v); }}
              >
                {STATUS_FILTERS.map((f) => (
                  <ToggleButton key={f.value} value={f.value} sx={{ textTransform: 'none', px: 1.5 }}>
                    {f.label}
                    <Chip
                      size="small" variant="outlined"
                      label={counts[f.value] ?? 0}
                      sx={{ ml: 0.8, height: 18, fontSize: 10 }}
                    />
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
          </Paper>

          {error && <Alert severity="error">{error}</Alert>}

          {/* Table */}
          <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer sx={{ height: '100%' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 90 }}>모드</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>제목</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 180 }}>메뉴코드</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 130 }}>모델</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 90 }}>상태</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 100, textAlign: 'right' }}>토큰</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 160 }}>생성일시</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 280, textAlign: 'center' }}>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        {sessions.length === 0 ? '이력 없음 — Composer 메인에서 세션을 시작하세요.' : '조건에 맞는 세션 없음'}
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((s) => {
                    const status = s.status || 'ACTIVE';
                    const chip = STATUS_CHIP[status] || STATUS_CHIP.ACTIVE;
                    const isBusy = busyId === s.id;
                    const tokens = (s.totalInTokens || 0) + (s.totalOutTokens || 0);
                    return (
                      <TableRow key={s.id} hover sx={{ '& td': { py: 0.7 } }}>
                        <TableCell>
                          <Chip size="small" label={s.mode || '-'} variant="outlined" sx={{ height: 20, fontSize: 10 }} />
                        </TableCell>
                        <TableCell sx={{ wordBreak: 'break-word' }}>
                          {s.title || <Box component="span" sx={{ color: 'text.secondary' }}>(제목 없음)</Box>}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}>
                          {s.targetMenuCd || '-'}
                        </TableCell>
                        <TableCell sx={{ fontSize: 12 }}>
                          {s.modelName || <Box component="span" sx={{ color: 'text.secondary' }}>default</Box>}
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={chip.label} color={chip.color} sx={{ height: 22, fontWeight: 600 }} />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12 }}>
                          {tokens ? tokens.toLocaleString() : '-'}
                        </TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{fmtDt(s.createDttm)}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="이어하기">
                              <span>
                                <IconButton size="small" color="primary" onClick={() => handleResume(s)} disabled={isBusy}>
                                  <PlayArrowIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            {status !== 'ACTIVE' && (
                              <Tooltip title="진행중으로 전환">
                                <span>
                                  <IconButton size="small" onClick={() => handleStatus(s, 'ACTIVE')} disabled={isBusy}>
                                    <RestoreIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                            {status !== 'COMPLETED' && (
                              <Tooltip title="완료">
                                <span>
                                  <IconButton size="small" color="success" onClick={() => handleStatus(s, 'COMPLETED')} disabled={isBusy}>
                                    <CheckCircleIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                            {status !== 'ARCHIVED' && (
                              <Tooltip title="보관">
                                <span>
                                  <IconButton size="small" onClick={() => handleStatus(s, 'ARCHIVED')} disabled={isBusy}>
                                    <ArchiveIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                            <Tooltip title="삭제">
                              <span>
                                <IconButton size="small" color="error" onClick={() => setConfirmDel(s)} disabled={isBusy}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            {isBusy && <CircularProgress size={18} sx={{ ml: 0.5 }} />}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </WorkArea>

      <Dialog open={!!confirmDel} onClose={() => setConfirmDel(null)}>
        <DialogTitle>세션 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            "{confirmDel?.title || confirmDel?.id}" 세션을 영구 삭제합니다. 메시지·산출물도 함께 제거됩니다.
            계속 진행하시겠습니까?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDel(null)}>취소</Button>
          <Button onClick={handleDelete} color="error" variant="contained">삭제</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ minWidth: 320 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ContentInner>
  );
}

export default T3ComposerHistory;

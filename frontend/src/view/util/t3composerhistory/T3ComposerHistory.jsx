import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  Box,
  Paper,
  Stack,
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
import SearchIcon        from '@mui/icons-material/Search';

import { ContentInner, WorkArea } from '@wingui/common/imports';
import PageHeader from '../t3composer/PageHeader';

import {
  listSessions,
  updateSessionStatus,
  deleteSession,
} from '../t3composer/api';

const STATUS_FILTERS = [
  { value: 'ALL',       labelKey: 'history.filter.all',       color: 'default' },
  { value: 'ACTIVE',    labelKey: 'history.filter.active',    color: 'primary' },
  { value: 'COMPLETED', labelKey: 'history.filter.completed', color: 'success' },
  { value: 'ARCHIVED',  labelKey: 'history.filter.archived',  color: 'default' },
];

// 상태 배지 — 옅은 톤 배경 + 진한 텍스트 (border 없는 soft chip)
const STATUS_CHIP = {
  ACTIVE:    { labelKey: 'history.status.active',    sx: { bgcolor: '#dbeafe', color: '#1e40af' } },
  COMPLETED: { labelKey: 'history.status.completed', sx: { bgcolor: '#dcfce7', color: '#15803d' } },
  ARCHIVED:  { labelKey: 'history.status.archived',  sx: { bgcolor: '#f1f5f9', color: '#475569' } },
};

// Target System 별 색상 — 한눈에 어느 시스템 작업인지 구분
const TARGET_CHIP_SX = {
  T3SERIES:     { bgcolor: '#dbeafe', color: '#1e3a8a', borderColor: '#3b82f6' },
  PLANNEL:      { bgcolor: '#dcfce7', color: '#14532d', borderColor: '#10b981' },
  LGES_NEXTSCM: { bgcolor: '#fef3c7', color: '#78350f', borderColor: '#f59e0b' },
};
function targetChipSx(cd) {
  return TARGET_CHIP_SX[cd] || { bgcolor: '#f1f5f9', color: '#475569', borderColor: '#94a3b8' };
}

// 모델명 추출 — 'claude-opus-4-7' → 'Opus', 'claude-sonnet-4-6' → 'Sonnet' 등
function modelLabel(name) {
  if (!name) return null;
  const s = String(name).toLowerCase();
  if (s.includes('opus'))   return 'Opus';
  if (s.includes('sonnet')) return 'Sonnet';
  if (s.includes('haiku'))  return 'Haiku';
  if (s.includes('fable'))  return 'Fable';
  return name;
}
const MODEL_CHIP_SX = {
  Opus:   { bgcolor: '#f3e8ff', color: '#6b21a8' },
  Sonnet: { bgcolor: '#cffafe', color: '#0e7490' },
  Haiku:  { bgcolor: '#fce7f3', color: '#9d174d' },
  Fable:  { bgcolor: '#fef3c7', color: '#92400e' },
};
function modelChipSx(label) {
  return MODEL_CHIP_SX[label] || { bgcolor: '#f1f5f9', color: '#475569' };
}

// 컴팩트 ISO 포맷 — yyyy-MM-dd HH:mm:ss (한 줄 표시, locale 무관 고정 폭)
function fmtDt(s) {
  if (!s) return '-';
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return String(s);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch { return String(s); }
}

function T3ComposerHistory() {
  const { t } = useTranslation('composer');
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
      setError(e?.response?.data?.message || e?.message || t('history.errors.loadList'));
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
        const hay = [s.title, s.mode, s.targetCd, s.targetMenuCd, s.modelName].filter(Boolean).join(' ').toLowerCase();
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
        message: t('history.errors.statusChange', { message: e?.response?.data?.message || e?.message || '' }),
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
      setSnackbar({ open: true, severity: 'success', message: t('history.deleted', { name: s.title || s.id }) });
      await reload();
    } catch (e) {
      setSnackbar({
        open: true, severity: 'error',
        message: t('history.errors.deleteFailed', { message: e?.response?.data?.message || e?.message || '' }),
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ContentInner>
      <PageHeader
        title={t('common:app.menu.history')}
        caption={t('common:app.menuHint.history')}
        right={(
          <>
            <ToggleButtonGroup
              exclusive size="small"
              value={filter}
              onChange={(_, v) => { if (v) setFilter(v); }}
              sx={{
                '& .MuiToggleButton-root': {
                  height: 28, textTransform: 'none', px: 1.2, fontSize: 12,
                  border: '1px solid #ECEEF1',
                  color: '#6B7280',
                  '&.Mui-selected': {
                    bgcolor: '#E8F2F6', color: '#1F6680',
                    borderColor: '#CFE3EB',
                    '&:hover': { bgcolor: '#E8F2F6' },
                  },
                },
              }}
            >
              {STATUS_FILTERS.map((f) => (
                <ToggleButton key={f.value} value={f.value}>
                  {t(f.labelKey)}
                  <Box component="span" sx={{ ml: 0.6, fontSize: 10.5, color: '#9AA3AF', fontWeight: 600 }}>
                    {counts[f.value] ?? 0}
                  </Box>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <TextField
              size="small"
              placeholder={t('history.searchPlaceholder')}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: '#9AA3AF' }} />,
                sx: { height: 28, fontSize: 12, bgcolor: '#FFFFFF' },
              }}
              sx={{
                width: 240,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ECEEF1' },
              }}
            />
            <Tooltip title={t('history.refresh')}>
              <IconButton size="small" onClick={reload} disabled={loading}>
                {loading ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </>
        )}
      />
      <WorkArea>
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {error && <Alert severity="error" sx={{ borderRadius: 1 }}>{error}</Alert>}
          {/* 단일 카드 — 그림자 없는 깔끔한 outline */}
          <Paper
            elevation={0}
            sx={{
              flex: 1, minHeight: 0,
              borderRadius: '12px',
              border: '1px solid #ECEEF1',
              boxShadow: '0 1px 3px rgba(16,24,40,.04)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <TableContainer sx={{ flex: 1, minHeight: 0 }}>
              <Table
                stickyHeader size="small"
                sx={{
                  // 양쪽 여백 — 첫/마지막 셀에 24px, 중간은 12px
                  '& thead th, & tbody td': { px: '12px' },
                  '& thead th:first-of-type, & tbody td:first-of-type': { pl: '24px' },
                  '& thead th:last-of-type,  & tbody td:last-of-type':  { pr: '24px' },
                  // 행 보더 옅게
                  '& tbody td':  { borderBottom: '1px solid #F0F1F4' },
                  '& tbody tr:last-of-type td': { borderBottom: 'none' },
                  // hover — 매우 옅은 회색
                  '& tbody tr:hover': { bgcolor: '#F7F9FB' },
                  // sticky 헤더 흰 배경 + 시안 톤
                  '& thead th': {
                    bgcolor: '#FFFFFF',
                    color: '#9AA3AF',
                    fontSize: 10.5, fontWeight: 600,
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    borderBottom: '1px solid #F0F1F4',
                    py: 1.3,
                  },
                  // 본문 셀
                  '& tbody td': {
                    color: '#1A2330',
                    fontSize: 13,
                    py: 1.4,
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 110, whiteSpace: 'nowrap' }}>{t('history.col.target')}</TableCell>
                    <TableCell sx={{ width: 90,  whiteSpace: 'nowrap' }}>{t('history.col.mode')}</TableCell>
                    <TableCell sx={{ minWidth: 240 }}>{t('history.col.title')}</TableCell>
                    <TableCell sx={{ width: 180, whiteSpace: 'nowrap' }}>{t('history.col.menuCd')}</TableCell>
                    <TableCell sx={{ width: 130, whiteSpace: 'nowrap' }}>{t('history.col.model')}</TableCell>
                    <TableCell sx={{ width: 90,  whiteSpace: 'nowrap' }}>{t('history.col.status')}</TableCell>
                    <TableCell sx={{ width: 100, whiteSpace: 'nowrap', textAlign: 'right !important' }}>{t('history.col.tokens')}</TableCell>
                    <TableCell sx={{ width: 170, whiteSpace: 'nowrap' }}>{t('history.col.createdAt')}</TableCell>
                    <TableCell sx={{ width: 280, whiteSpace: 'nowrap', textAlign: 'center !important' }}>{t('history.col.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        {sessions.length === 0 ? t('history.emptyAll') : t('history.emptyFiltered')}
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((s) => {
                    const status = s.status || 'ACTIVE';
                    const chip = STATUS_CHIP[status] || STATUS_CHIP.ACTIVE;
                    const isBusy = busyId === s.id;
                    const tokens = (s.totalInTokens || 0) + (s.totalOutTokens || 0);
                    const tgtSx = targetChipSx(s.targetCd);
                    return (
                      <TableRow key={s.id} hover sx={{ '& td': { py: 0.7 } }}>
                        <TableCell>
                          <Chip
                            size="small"
                            label={s.targetCd || '—'}
                            variant="outlined"
                            sx={{
                              height: 22, fontSize: 10.5, fontWeight: 700,
                              bgcolor: tgtSx.bgcolor,
                              color: tgtSx.color,
                              borderColor: tgtSx.borderColor,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={s.mode || '-'} variant="outlined" sx={{ height: 20, fontSize: 10 }} />
                        </TableCell>
                        <TableCell
                          title={s.title || ''}
                          sx={{
                            // table-layout 안에서 다른 명시-폭 컬럼이 우선 잡힌 뒤 남은 폭을 사용.
                            // maxWidth:0 + nowrap + ellipsis 가 MUI Table 표준 truncate 패턴.
                            maxWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {s.title || <Box component="span" sx={{ color: 'text.secondary' }}>{t('history.untitled')}</Box>}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}>
                          {s.targetMenuCd || '-'}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const ml = modelLabel(s.modelName);
                            if (!ml) return <Box component="span" sx={{ color: 'text.secondary', fontSize: 12 }}>default</Box>;
                            return (
                              <Chip
                                size="small"
                                label={ml}
                                sx={{ height: 22, fontWeight: 600, ...modelChipSx(ml) }}
                              />
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={t(chip.labelKey)}
                            sx={{ height: 22, fontWeight: 600, ...chip.sx }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12 }}>
                          {tokens ? tokens.toLocaleString() : '-'}
                        </TableCell>
                        <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{fmtDt(s.createDttm)}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title={t('history.action.resume')}>
                              <span>
                                <IconButton size="small" color="primary" onClick={() => handleResume(s)} disabled={isBusy}>
                                  <PlayArrowIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            {status !== 'ACTIVE' && (
                              <Tooltip title={t('history.action.markActive')}>
                                <span>
                                  <IconButton size="small" onClick={() => handleStatus(s, 'ACTIVE')} disabled={isBusy}>
                                    <RestoreIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                            {status !== 'COMPLETED' && (
                              <Tooltip title={t('history.action.markCompleted')}>
                                <span>
                                  <IconButton size="small" color="success" onClick={() => handleStatus(s, 'COMPLETED')} disabled={isBusy}>
                                    <CheckCircleIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                            {status !== 'ARCHIVED' && (
                              <Tooltip title={t('history.action.markArchived')}>
                                <span>
                                  <IconButton size="small" onClick={() => handleStatus(s, 'ARCHIVED')} disabled={isBusy}>
                                    <ArchiveIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                            <Tooltip title={t('history.action.delete')}>
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
        <DialogTitle>{t('history.deleteDialog.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('history.deleteDialog.body', { name: confirmDel?.title || confirmDel?.id })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDel(null)}>{t('history.deleteDialog.cancel')}</Button>
          <Button onClick={handleDelete} color="error" variant="contained">{t('history.deleteDialog.confirm')}</Button>
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

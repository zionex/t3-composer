import React, { useEffect, useMemo, useState } from 'react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Checkbox,
  Chip,
  Alert,
  CircularProgress,
  Box,
  Divider,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StorageIcon from '@mui/icons-material/Storage';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';

import { listDbTables, listDbColumns } from './api';

/**
 * DB 테이블 선택 팝업 (sys.tables 조회).
 *
 * props:
 *   open
 *   onClose
 *   onSelect(names[])  — 선택된 테이블명 배열
 *   initialSelected    — 기본 선택된 테이블명 배열
 */
function TablePickerDialog({ open, onClose, onSelect, initialSelected = [] }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(new Set(initialSelected));
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelected(new Set(initialSelected));
    setPreview(null);
    setError(null);
    load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const load = async (q) => {
    setLoading(true);
    try {
      const res = await listDbTables(q || null, 500);
      setTables(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '테이블 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  // 로컬 필터 (500건 미만이면 실시간)
  const filtered = useMemo(() => {
    if (!query.trim()) return tables;
    const q = query.toLowerCase();
    return tables.filter(
      (t) =>
        (t.tableName || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
    );
  }, [tables, query]);

  const toggleOne = (name) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const showPreview = async (tableName) => {
    setPreviewLoading(true);
    try {
      const res = await listDbColumns(tableName);
      setPreview({ tableName, columns: Array.isArray(res.data) ? res.data : [] });
    } catch {
      setPreview({ tableName, columns: [], error: '컬럼 조회 실패' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirm = () => {
    onSelect(Array.from(selected));
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <StorageIcon color="primary" />
        DB 테이블 선택
        {selected.size > 0 && (
          <Chip label={`${selected.size}개 선택됨`} size="small" color="primary" sx={{ ml: 1 }} />
        )}
      </DialogTitle>
      <DialogContent>
        <Stack direction="row" spacing={2} sx={{ height: 520 }}>
          {/* 좌측: 테이블 목록 */}
          <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0, display: 'flex' }}>
            <TextField
              size="small"
              placeholder="테이블명·설명 검색 (예: TB_CM_ITEM)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Typography variant="caption" color="text.secondary">
              sys.tables — 사용자 테이블 전체 {tables.length}개 중 {filtered.length}개 표시
            </Typography>

            {loading && (
              <Box sx={{ py: 2, textAlign: 'center' }}>
                <CircularProgress size={20} />
              </Box>
            )}
            {error && <Alert severity="error">{error}</Alert>}

            <Box sx={{ flex: 1, overflowY: 'auto', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 1, minHeight: 0 }}>
              <List dense disablePadding>
                {filtered.map((t) => {
                  const name = t.tableName;
                  const isSel = selected.has(name);
                  return (
                    <ListItemButton
                      key={name}
                      dense
                      onClick={() => toggleOne(name)}
                      sx={{ py: 0.3 }}
                    >
                      <Checkbox
                        edge="start"
                        checked={isSel}
                        tabIndex={-1}
                        disableRipple
                        size="small"
                        sx={{ p: 0.5, mr: 1 }}
                      />
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontSize: 12, fontFamily: 'monospace' }}>
                            {name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }} noWrap>
                            {t.description ? t.description : `${t.columnCount ?? '?'} columns`}
                          </Typography>
                        }
                      />
                      <Tooltip title="컬럼 미리보기">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); showPreview(name); }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ListItemButton>
                  );
                })}
                {filtered.length === 0 && !loading && (
                  <Box sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      검색 결과가 없습니다.
                    </Typography>
                  </Box>
                )}
              </List>
            </Box>
          </Stack>

          {/* 우측: 컬럼 미리보기 / 선택 목록 */}
          <Stack spacing={1.5} sx={{ width: 340, minWidth: 0 }}>
            <Paper variant="outlined" sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {preview ? preview.tableName : '컬럼 미리보기'}
                </Typography>
                {preview && (
                  <IconButton size="small" onClick={() => setPreview(null)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
              <Divider sx={{ my: 0.5 }} />
              {previewLoading ? (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress size={18} />
                </Box>
              ) : preview ? (
                preview.error ? (
                  <Typography variant="caption" color="error">{preview.error}</Typography>
                ) : (
                  <Box sx={{ flex: 1, overflowY: 'auto' }}>
                    {preview.columns.map((c, i) => (
                      <Stack key={i} direction="row" spacing={0.5} alignItems="baseline" sx={{ py: 0.3 }}>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600, minWidth: 0 }} noWrap>
                          {c.columnName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          {c.dataType}{c.maxLength > 0 ? `(${c.maxLength})` : ''}
                        </Typography>
                        {!c.isNullable && <Chip label="NN" size="small" sx={{ height: 14, fontSize: 9 }} />}
                      </Stack>
                    ))}
                    {preview.columns.length === 0 && (
                      <Typography variant="caption" color="text.secondary">
                        컬럼 정보 없음
                      </Typography>
                    )}
                  </Box>
                )
              ) : (
                <Typography variant="caption" color="text.secondary">
                  목록에서 👁 아이콘 클릭 시 컬럼을 미리볼 수 있습니다.
                </Typography>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5, maxHeight: 180, overflow: 'auto' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                선택됨 ({selected.size})
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {Array.from(selected).map((n) => (
                  <Chip
                    key={n}
                    label={n}
                    size="small"
                    onDelete={() => toggleOne(n)}
                    sx={{ fontSize: 10, fontFamily: 'monospace' }}
                  />
                ))}
                {selected.size === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    선택된 테이블 없음
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={selected.size === 0}>
          {selected.size}개 선택
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TablePickerDialog;

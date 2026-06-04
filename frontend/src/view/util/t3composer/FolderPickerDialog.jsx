/**
 * FolderPickerDialog — composer-backend 의 컨테이너 안 디렉토리를 한 단계씩 탐색하며
 * 폴더를 선택하는 모달.
 *
 * 사용처: Target source/backend 경로 등록 입력 보조.
 *
 * Props:
 *   - open         : boolean
 *   - initialPath  : 처음 표시할 절대경로 (없으면 /workspace/projects 시작)
 *   - onClose      : () => void
 *   - onSelect     : (absPath: string) => void
 *   - title        : DialogTitle 텍스트 (기본 '폴더 선택')
 *
 * 백엔드 contract — GET /composer/fs/browse?path=<container_abs>
 *   응답: { ok, path, parent, initial_cwd, is_root, items: [{name, type:'dir', child_count}], message? }
 *
 * Insight-Neo 의 FolderPickerDialog (component/common) 와 동일 흐름이되 Git URL /
 * 신규 폴더 생성 옵션 등 t3-composer 에서 불필요한 부분 제거.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import RefreshIcon from '@mui/icons-material/Refresh';

import { browseFs } from './api';


export default function FolderPickerDialog({
  open,
  initialPath = '',
  onClose,
  onSelect,
  title = '폴더 선택',
}) {
  const [path, setPath] = useState('');
  const [parent, setParent] = useState(null);
  const [initialCwd, setInitialCwd] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualPath, setManualPath] = useState('');

  const load = useCallback(async (targetPath) => {
    setLoading(true);
    setError(null);
    try {
      const r = await browseFs(targetPath || '');
      const d = r?.data || {};
      setPath(d.path || '');
      setParent(d.parent ?? null);
      setInitialCwd(d.initial_cwd || '');
      setItems(d.items || []);
      setManualPath(d.path || '');
      if (!d.ok && d.message) setError(d.message);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || String(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      load(initialPath || '');
    }
  }, [open, initialPath, load]);

  const handleEnter = (name) => {
    if (!path) return;
    const sep = path.includes('\\') ? '\\' : '/';
    const next = path.endsWith(sep) ? `${path}${name}` : `${path}${sep}${name}`;
    load(next);
  };

  const handleUp = () => { if (parent) load(parent); };
  const handleHome = () => { if (initialCwd) load(initialCwd); };

  const handleManualGo = () => {
    const p = (manualPath || '').trim();
    if (p) load(p);
  };

  // breadcrumb 조각들
  const crumbs = (() => {
    if (!path) return [];
    const sep = path.includes('\\') ? '\\' : '/';
    const parts = path.split(sep).filter((p, idx) => p || idx === 0);
    const result = [];
    let acc = '';
    parts.forEach((p, i) => {
      if (i === 0) {
        acc = p.endsWith(':') ? `${p}${sep}` : (p === '' ? sep : p);
      } else {
        acc = acc.endsWith(sep) ? `${acc}${p}` : `${acc}${sep}${p}`;
      }
      result.push({ label: p || sep, abs: acc });
    });
    return result;
  })();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>{title}</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: 500 }}>
        {/* Toolbar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <Tooltip title="상위 폴더">
            <span>
              <IconButton size="small" onClick={handleUp} disabled={!parent || loading}>
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={`workspace root (${initialCwd || '/workspace/projects'})`}>
            <span>
              <IconButton size="small" onClick={handleHome} disabled={!initialCwd || loading}>
                <HomeIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="새로고침">
            <span>
              <IconButton size="small" onClick={() => load(path)} disabled={loading}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <TextField
            size="small"
            fullWidth
            value={manualPath}
            onChange={(e) => setManualPath(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleManualGo(); }}
            placeholder="컨테이너 안 절대경로 직접 입력 후 Enter"
            InputProps={{ sx: { fontFamily: 'monospace', fontSize: 12 } }}
          />
          <Button size="small" variant="outlined" onClick={handleManualGo} disabled={loading}>
            이동
          </Button>
        </Box>

        {/* Breadcrumb */}
        <Box sx={{ px: 0.5, flexShrink: 0, overflow: 'auto', whiteSpace: 'nowrap' }}>
          <Breadcrumbs separator="›" sx={{ '& ol': { flexWrap: 'nowrap' } }}>
            {crumbs.map((c, i) => (
              i === crumbs.length - 1 ? (
                <Typography key={i} variant="body2" sx={{ fontWeight: 600 }}>{c.label}</Typography>
              ) : (
                <Link
                  key={i}
                  component="button"
                  underline="hover"
                  variant="body2"
                  onClick={() => load(c.abs)}
                  sx={{ textAlign: 'left' }}
                >
                  {c.label}
                </Link>
              )
            ))}
          </Breadcrumbs>
        </Box>

        {error && <Alert severity="warning" onClose={() => setError(null)}>{error}</Alert>}

        {/* Folder list */}
        <Box sx={{
          flex: 1, minHeight: 0, overflow: 'auto',
          border: 1, borderColor: 'divider', borderRadius: 1,
          backgroundColor: 'background.default',
        }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          {!loading && items.length === 0 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                하위 폴더가 없습니다. 현재 위치를 선택하려면 우측 하단 "이 폴더 선택" 클릭.
              </Typography>
            </Box>
          )}
          {!loading && items.length > 0 && (
            <List dense disablePadding>
              {items.map((it) => (
                <ListItemButton
                  key={it.name}
                  onClick={() => handleEnter(it.name)}
                  sx={{ py: 0.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <FolderIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={it.name}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                  {it.child_count >= 0 && (
                    <Chip
                      label={it.child_count}
                      size="small"
                      sx={{ height: 18, fontSize: '0.7rem' }}
                    />
                  )}
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose}>취소</Button>
        <Button
          variant="contained"
          disabled={!path}
          onClick={() => {
            onSelect?.(path);
            onClose?.();
          }}
        >
          이 폴더 선택
        </Button>
      </DialogActions>
    </Dialog>
  );
}

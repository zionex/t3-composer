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
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Chip,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FolderIcon from '@mui/icons-material/Folder';
import ArticleIcon from '@mui/icons-material/Article';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { listAllMenus, loadTargetMenuTree } from './api';

/**
 * loadTargetMenuTree 의 nested 응답 → flat menus 배열 변환.
 *   nested 노드: { id, filePath, path, displayName, items: [...] }
 *   flat 노드:   { id, menuCd, menuNm, menuPath, menuFilePath, parentId, isGroup, seq }
 */
function flattenTargetMenuTree(nodes, parentId = null, seqRef = { v: 0 }) {
  const result = [];
  for (const n of (nodes || [])) {
    const children = Array.isArray(n.items) ? n.items : [];
    result.push({
      id: n.id,
      menuCd: n.id,
      menuNm: n.displayName || n.id,
      menuPath: n.path || '',
      menuFilePath: n.filePath || '',
      parentId,
      isGroup: children.length > 0,
      seq: seqRef.v += 1,
    });
    if (children.length > 0) {
      result.push(...flattenTargetMenuTree(children, n.id, seqRef));
    }
  }
  return result;
}

/**
 * 메뉴 선택 팝업 — 부모 메뉴 선택용 (그룹 노드 우선).
 *
 * props:
 *   open
 *   onClose
 *   onSelect(menu)  — 선택된 메뉴 객체 전달 { menuCd, menuPath, menuFilePath, isGroup, parentId }
 *   selectGroupOnly — true 면 그룹(리프 아님) 만 선택 가능
 *   targetCd        — optional, 활성 Target 의 메뉴 트리 (loadTargetMenuTree). 없으면 listAllMenus.
 */
function MenuPickerDialog({ open, onClose, onSelect, selectGroupOnly = true, targetCd }) {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState({});
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelected(null);
    setError(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, targetCd]);

  const load = async () => {
    setLoading(true);
    try {
      if (targetCd) {
        // Target DB 의 nested 메뉴 트리 → flat 변환
        const res = await loadTargetMenuTree('ko', targetCd);
        const items = res.data?.items || [];
        setMenus(flattenTargetMenuTree(items));
      } else {
        // composer-db 의 전체 메뉴 (기존 동작)
        const res = await listAllMenus();
        setMenus(Array.isArray(res.data) ? res.data : []);
      }
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '메뉴 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  // flat → tree 재구성. 빌드 중에 각 노드에 **ancestorPath** (root→해당노드 명칭들의 " > " 결합) 를 주입.
  const tree = useMemo(() => {
    const byParent = new Map();
    for (const m of menus) {
      const p = m.parentId || '__ROOT__';
      if (!byParent.has(p)) byParent.set(p, []);
      byParent.get(p).push(m);
    }
    const sortFn = (a, b) => (a.seq ?? 0) - (b.seq ?? 0);
    const build = (parentId, parentPath) => {
      const children = (byParent.get(parentId) || []).slice().sort(sortFn);
      return children.map((c) => {
        const name = c.menuNm || c.menuCd;
        const ancestorPath = parentPath ? `${parentPath} > ${name}` : name;
        return { ...c, ancestorPath, children: build(c.id, ancestorPath) };
      });
    };
    return build('__ROOT__', '');
  }, [menus]);

  // 검색 필터 (자식 매치 시 상위 유지) — menuNm(다국어) 포함 검색
  const filtered = useMemo(() => {
    if (!query.trim()) return tree;
    const q = query.toLowerCase();
    const filter = (nodes) => {
      const out = [];
      for (const n of nodes) {
        const childMatched = filter(n.children || []);
        const selfMatched =
          (n.menuCd || '').toLowerCase().includes(q) ||
          (n.menuNm || '').toLowerCase().includes(q) ||
          (n.menuPath || '').toLowerCase().includes(q);
        if (selfMatched || childMatched.length > 0) {
          out.push({ ...n, children: childMatched });
        }
      }
      return out;
    };
    return filter(tree);
  }, [tree, query]);

  // 검색 시 자동 확장
  useEffect(() => {
    if (!query.trim()) return;
    const ex = {};
    const expand = (nodes) => {
      for (const n of nodes) {
        if (n.children && n.children.length > 0) {
          ex[n.id] = true;
          expand(n.children);
        }
      }
    };
    expand(filtered);
    setExpanded(ex);
  }, [query, filtered]);

  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const handlePick = (m) => {
    if (selectGroupOnly && !m.isGroup) return;
    setSelected(m);
  };

  const handleConfirm = () => {
    if (!selected) return;
    onSelect(selected);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FolderIcon color="warning" />
        {selectGroupOnly ? '부모 메뉴 선택' : '메뉴 선택'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ height: 500, display: 'flex', flexDirection: 'column' }}>
          <TextField
            size="small"
            placeholder="메뉴 코드·경로 검색..."
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
          {selectGroupOnly && (
            <Typography variant="caption" color="text.secondary">
              그룹(폴더) 메뉴만 선택 가능합니다. 화면(리프) 노드는 비활성입니다.
            </Typography>
          )}

          {loading && (
            <Stack alignItems="center" sx={{ py: 4 }}>
              <CircularProgress size={24} />
            </Stack>
          )}
          {error && <Alert severity="error">{error}</Alert>}

          {!loading && !error && (
            <Box sx={{ flex: 1, overflowY: 'auto', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 1 }}>
              <MenuTreeList
                nodes={filtered}
                level={0}
                expanded={expanded}
                onToggle={toggle}
                onPick={handlePick}
                selectedId={selected?.id}
                selectGroupOnly={selectGroupOnly}
              />
            </Box>
          )}

          {selected && (
            <Alert severity="info" icon={<FolderIcon fontSize="small" />}>
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selected.menuNm || selected.menuCd}
                  </Typography>
                  <Chip label={selected.menuCd} size="small" variant="outlined"
                        sx={{ fontFamily: 'monospace', fontSize: 10 }} />
                  <Chip
                    label={selected.isGroup ? '그룹' : '화면'}
                    size="small"
                    color={selected.isGroup ? 'warning' : 'default'}
                  />
                </Stack>
                {selected.ancestorPath && (
                  <Typography variant="caption" sx={{ color: '#475569' }}>
                    전체 경로: <b>{selected.ancestorPath}</b>
                  </Typography>
                )}
              </Stack>
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={!selected}>
          선택
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function MenuTreeList({ nodes, level, expanded, onToggle, onPick, selectedId, selectGroupOnly }) {
  if (!nodes || nodes.length === 0) return null;
  return (
    <List dense disablePadding>
      {nodes.map((node) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = !!expanded[node.id];
        const isSelected = selectedId === node.id;
        const disabled = selectGroupOnly && !node.isGroup;

        return (
          <React.Fragment key={node.id}>
            <ListItemButton
              onClick={() => {
                if (hasChildren) onToggle(node.id);
                if (!disabled) onPick(node);
              }}
              selected={isSelected}
              disabled={disabled}
              sx={{ pl: 1.5 + level * 1.5, py: 0.4 }}
            >
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ width: '100%' }}>
                {hasChildren ? (
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
                    sx={{ p: 0 }}
                  >
                    {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                  </IconButton>
                ) : (
                  <Box sx={{ width: 20 }} />
                )}
                {node.isGroup ? (
                  <FolderIcon fontSize="small" sx={{ color: '#ffb100' }} />
                ) : (
                  <ArticleIcon fontSize="small" sx={{ color: '#5281b3' }} />
                )}
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: 12,
                        fontWeight: node.isGroup ? 600 : 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {node.menuNm || node.menuCd}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: 10,
                        color: 'text.secondary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block',
                        fontFamily: 'monospace',
                      }}
                    >
                      {node.menuCd}
                    </Typography>
                  }
                />
              </Stack>
            </ListItemButton>
            {hasChildren && (
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <MenuTreeList
                  nodes={node.children}
                  level={level + 1}
                  expanded={expanded}
                  onToggle={onToggle}
                  onPick={onPick}
                  selectedId={selectedId}
                  selectGroupOnly={selectGroupOnly}
                />
              </Collapse>
            )}
          </React.Fragment>
        );
      })}
    </List>
  );
}

export default MenuPickerDialog;

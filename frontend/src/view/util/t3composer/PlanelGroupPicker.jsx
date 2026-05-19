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

import { loadTargetMenuTree } from './api';

/**
 * PLANEL TabMenuList.js 의 lv3MenuList 그룹 키 선택 팝업.
 *
 * 표시: 그룹 노드(예: DATA_MGMT · DASHBOARD · DP · IP · RP · MP) + 펼쳤을 때 그 안의 leaf 화면.
 * 선택은 그룹 노드만 가능 (leaf 는 disabled — 정보 표시용).
 *
 * props:
 *   open
 *   onClose
 *   onSelect(group)   — { groupKey, displayName, leafCount }
 *   targetCd          — 활성 Target (보통 'PLANNEL')
 *   currentGroupKey   — 현재 선택된 groupKey (있으면 강조)
 */
function PlanelGroupPicker({ open, onClose, onSelect, targetCd, currentGroupKey }) {
  const [items, setItems] = useState([]);   // 트리 응답의 items 배열 (group 노드 목록)
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
      const lang = localStorage.getItem('languageCode')
        || sessionStorage.getItem('languageCode')
        || (navigator.language || 'ko').slice(0, 2);
      const res = await loadTargetMenuTree(lang, targetCd);
      const arr = Array.isArray(res?.data?.items) ? res.data.items
                : Array.isArray(res?.data) ? res.data
                : [];
      setItems(arr);
      // 검색 시 자동 확장. 처음엔 닫힘 상태.
      setExpanded({});
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'PLANEL 메뉴 트리 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  // 검색 필터 — groupKey · displayName · leaf displayName 어디든 매치
  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    const out = [];
    for (const g of items) {
      const gk = (g.id || '').toLowerCase();
      const gn = (g.displayName || '').toLowerCase();
      const groupMatched = gk.includes(q) || gn.includes(q);
      const leafs = Array.isArray(g.items) ? g.items : [];
      const matchingLeafs = leafs.filter((l) => {
        const lk = (l.id || '').toLowerCase();
        const ln = (l.displayName || '').toLowerCase();
        return lk.includes(q) || ln.includes(q);
      });
      if (groupMatched || matchingLeafs.length > 0) {
        out.push({ ...g, items: groupMatched ? leafs : matchingLeafs });
      }
    }
    return out;
  }, [items, query]);

  // 검색 시 매칭된 그룹 자동 펼침
  useEffect(() => {
    if (!query.trim()) return;
    const ex = {};
    for (const g of filtered) ex[g.id] = true;
    setExpanded(ex);
  }, [query, filtered]);

  const toggle = (id) =>
    setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const handleConfirm = () => {
    if (!selected) return;
    onSelect({
      groupKey: selected.id,
      displayName: selected.displayName || selected.id,
      leafCount: Array.isArray(selected.items) ? selected.items.length : 0,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FolderIcon color="warning" />
        부모 메뉴 그룹 선택 — PLANEL TabMenuList.js
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ height: 500, display: 'flex', flexDirection: 'column' }}>
          <TextField
            size="small"
            placeholder="그룹 키 · 화면 명칭 검색..."
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
            lv3MenuList 의 그룹 키(예: <code>DATA_MGMT</code>, <code>DP</code>) 만 선택 가능.
            leaf 화면은 정보 표시용 — 같은 그룹에 어떤 화면이 이미 있는지 확인하세요.
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <Box sx={{ flex: 1, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1 }}>
            {loading && (
              <Stack alignItems="center" sx={{ py: 4 }}>
                <CircularProgress size={28} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                  PLANEL 트리 로드 중...
                </Typography>
              </Stack>
            )}

            {!loading && filtered.length === 0 && !error && (
              <Stack alignItems="center" sx={{ py: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  {query.trim() ? '검색 결과 없음' : 'PLANEL 메뉴 트리가 비어 있습니다.'}
                </Typography>
              </Stack>
            )}

            {!loading && filtered.length > 0 && (
              <List dense disablePadding>
                {filtered.map((g) => {
                  const isExpanded = !!expanded[g.id];
                  const leafs = Array.isArray(g.items) ? g.items : [];
                  const isCurrent = g.id === currentGroupKey;
                  const isSelected = selected && selected.id === g.id;
                  return (
                    <React.Fragment key={g.id}>
                      <ListItemButton
                        onClick={() => setSelected(g)}
                        selected={isSelected}
                        sx={{
                          pl: 1,
                          bgcolor: isSelected ? 'rgba(124,167,224,0.18)' : undefined,
                        }}
                      >
                        <Box
                          onClick={(e) => { e.stopPropagation(); toggle(g.id); }}
                          sx={{
                            width: 24, display: 'flex', alignItems: 'center', cursor: 'pointer',
                          }}
                        >
                          {leafs.length > 0
                            ? (isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />)
                            : <Box sx={{ width: 20 }} />}
                        </Box>
                        <FolderIcon
                          fontSize="small"
                          sx={{ color: isCurrent ? '#0f766e' : '#f59e0b', mr: 1 }}
                        />
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography
                                variant="body2"
                                sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                              >
                                {g.id}
                              </Typography>
                              {g.displayName && g.displayName !== g.id && (
                                <Typography variant="caption" color="text.secondary">
                                  ({g.displayName})
                                </Typography>
                              )}
                              <Chip
                                label={`${leafs.length} 화면`}
                                size="small"
                                variant="outlined"
                                sx={{ height: 18, fontSize: 10 }}
                              />
                              {isCurrent && (
                                <Chip
                                  label="현재 선택"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{ height: 18, fontSize: 10 }}
                                />
                              )}
                            </Stack>
                          }
                        />
                      </ListItemButton>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <List dense disablePadding>
                          {leafs.map((leaf) => (
                            <ListItemButton
                              key={leaf.id}
                              disabled
                              sx={{ pl: 6 }}
                            >
                              <ArticleIcon
                                fontSize="small"
                                sx={{ color: '#94a3b8', mr: 1 }}
                              />
                              <ListItemText
                                primary={
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography
                                      variant="caption"
                                      sx={{ fontFamily: 'monospace' }}
                                    >
                                      {leaf.id}
                                    </Typography>
                                    {leaf.displayName && leaf.displayName !== leaf.id && (
                                      <Typography variant="caption" color="text.secondary">
                                        · {leaf.displayName}
                                      </Typography>
                                    )}
                                  </Stack>
                                }
                              />
                            </ListItemButton>
                          ))}
                        </List>
                      </Collapse>
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </Box>

          {selected && (
            <Alert severity="info" sx={{ py: 0.5 }}>
              <Typography variant="caption">
                선택: <b style={{ fontFamily: 'monospace' }}>{selected.id}</b>
                {' · '}현재 {Array.isArray(selected.items) ? selected.items.length : 0} 화면 포함
              </Typography>
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>닫기</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={!selected}>
          선택
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PlanelGroupPicker;

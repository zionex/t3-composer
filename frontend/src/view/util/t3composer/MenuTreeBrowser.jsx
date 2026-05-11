import React, { useEffect, useMemo, useState } from 'react';

import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FolderIcon from '@mui/icons-material/Folder';
import ArticleIcon from '@mui/icons-material/Article';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudSyncIcon from '@mui/icons-material/CloudSync';

import { transLangKey } from '@zionex/wingui-core/lang/i18n-func';
import { loadTargetMenuTree, syncTargetMenusFromWingui, syncTargetLangpackFromWingui } from './api';

/**
 * 메뉴 트리 브라우저 — EXISTING_MODIFY / NEW_FROM_COPY 모드에서 대상 화면 선택용.
 *
 * Target DB (예: target-mssql TB_AD_MENU + TB_AD_LANG_PACK) 에서 트리를 받아 표시.
 * 리프(화면 — filePath 있음)만 선택 가능.
 */
function MenuTreeBrowser({ onSelect, selectedMenuCd, activeTargetCd }) {
  const [menus, setMenus]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery]     = useState('');
  const [expanded, setExpanded] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      // 1) menus.js → TB_AD_MENU
      const menuRes = await syncTargetMenusFromWingui();
      const m = menuRes?.data || {};
      // 2) db_update_script.sql → TB_AD_LANG_PACK (메뉴 라벨)
      const langRes = await syncTargetLangpackFromWingui();
      const lp = langRes?.data || {};
      const allErr = [...(m.errors || []), ...(lp.errors || [])];
      setSyncMsg({
        kind: allErr.length > 0 ? 'warning' : 'success',
        text: `wingui sync — 메뉴 ${m.inserted || 0}/${m.updated || 0}/${m.total || 0}, ` +
              `라벨 ${lp.inserted || 0}/${lp.updated || 0}/${lp.total || 0}` +
              (allErr.length > 0 ? ` (오류 ${allErr.length}건)` : ''),
      });
      setReloadKey((k) => k + 1);
    } catch (e) {
      setSyncMsg({
        kind: 'error',
        text: 'wingui sync 실패: ' + (e?.response?.data?.message || e?.message || ''),
      });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadTargetMenuTree('ko', activeTargetCd)
      .then((res) => { if (!cancelled) setMenus(res.data); })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.response?.data?.message || e?.message || 'Target 메뉴 트리 조회 실패');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey, activeTargetCd]);

  const rootItems = menus?.items || [];

  const filteredTree = useMemo(() => {
    if (!query.trim()) return rootItems;
    const q = query.toLowerCase();

    // 재귀 필터 — 자식 중 하나라도 매치되면 유지
    const filter = (nodes) => {
      if (!nodes) return [];
      const result = [];
      for (const n of nodes) {
        const childMatched = filter(n.items);
        // displayName(LangPack) + 번역된 메뉴명도 검색 대상에 포함
        const displayName = (n.displayName || '').toString().toLowerCase();
        const translatedName = (transLangKey(n.id) || '').toString().toLowerCase();
        const selfMatched = (n.id || '').toLowerCase().includes(q) ||
                           (n.path || '').toLowerCase().includes(q) ||
                           (n.filePath || '').toLowerCase().includes(q) ||
                           displayName.includes(q) ||
                           translatedName.includes(q);
        if (selfMatched || childMatched.length > 0) {
          result.push({ ...n, items: childMatched });
        }
      }
      return result;
    };
    return filter(rootItems);
  }, [rootItems, query]);

  // 검색 시 자동 확장
  React.useEffect(() => {
    if (query.trim()) {
      const newExpanded = {};
      const expand = (nodes) => {
        if (!nodes) return;
        for (const n of nodes) {
          if (n.items && n.items.length > 0) {
            newExpanded[n.id] = true;
            expand(n.items);
          }
        }
      };
      expand(filteredTree);
      setExpanded(newExpanded);
    }
  }, [query, filteredTree]);

  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box sx={{ p: 1.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            메뉴 트리 (Target DB)
          </Typography>
          <Stack direction="row" spacing={0.5}>
            <Button
              size="small"
              startIcon={syncing ? <CircularProgress size={12} /> : <CloudSyncIcon fontSize="small" />}
              onClick={handleSync}
              disabled={loading || syncing}
              sx={{ minWidth: 0, py: 0.2 }}
              title="부모 wingui 의 menus.js 를 Target DB 의 TB_AD_MENU 에 동기화"
            >
              wingui sync
            </Button>
            <Button
              size="small"
              startIcon={<RefreshIcon fontSize="small" />}
              onClick={() => setReloadKey((k) => k + 1)}
              disabled={loading || syncing}
              sx={{ minWidth: 0, py: 0.2 }}
            >
              새로고침
            </Button>
          </Stack>
        </Stack>
        {syncMsg && (
          <Alert severity={syncMsg.kind} sx={{ mb: 1, py: 0.3, fontSize: 11 }} onClose={() => setSyncMsg(null)}>
            {syncMsg.text}
          </Alert>
        )}
        <TextField
          fullWidth
          size="small"
          placeholder="메뉴 코드·명칭·경로 검색..."
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
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={20} />
            <Typography variant="caption" sx={{ ml: 1, color: '#64748b' }}>
              Target DB 메뉴 트리 로딩...
            </Typography>
          </Box>
        )}
        {error && !loading && (
          <Box sx={{ p: 1.5 }}>
            <Alert severity="error" sx={{ fontSize: 12 }}>{error}</Alert>
          </Box>
        )}
        {!loading && !error && rootItems.length === 0 && (
          <Box sx={{ p: 1.5 }}>
            <Alert severity="info" sx={{ fontSize: 12 }}>
              Target DB 의 TB_AD_MENU 에 등록된 메뉴가 없습니다.
            </Alert>
          </Box>
        )}
        {!loading && !error && rootItems.length > 0 && (
          <TreeList
            nodes={filteredTree}
            level={0}
            expanded={expanded}
            onToggle={toggle}
            onSelect={onSelect}
            selectedMenuCd={selectedMenuCd}
          />
        )}
      </Box>
    </Box>
  );
}

function TreeList({ nodes, level, expanded, onToggle, onSelect, selectedMenuCd }) {
  if (!nodes || nodes.length === 0) return null;
  return (
    <List dense disablePadding>
      {nodes.map((node) => {
        const hasChildren = node.items && node.items.length > 0;
        const isExpanded = !!expanded[node.id];
        const isSelected = selectedMenuCd === node.id;

        return (
          <React.Fragment key={node.id}>
            <ListItemButton
              onClick={() => {
                if (hasChildren) {
                  onToggle(node.id);
                } else if (node.filePath) {
                  // 리프(화면)만 선택 가능
                  onSelect(node);
                }
              }}
              selected={isSelected}
              sx={{ pl: 1.5 + level * 1.5, py: 0.5 }}
            >
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ width: '100%' }}>
                {hasChildren ? (
                  isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />
                ) : (
                  <Box sx={{ width: 20 }} />
                )}
                {hasChildren ? (
                  <FolderIcon fontSize="small" sx={{ color: '#ffb100' }} />
                ) : (
                  <ArticleIcon fontSize="small" sx={{ color: '#5281b3' }} />
                )}
                <ListItemText
                  disableTypography
                  primary={
                    <Box sx={{
                      display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flexWrap: 'wrap',
                    }}>
                      {/* MENU_CD chip — ID 표시 */}
                      <Typography
                        component="span"
                        sx={{
                          fontSize: 10,
                          fontFamily: 'monospace',
                          color: isSelected ? '#1d4ed8' : '#475569',
                          bgcolor: isSelected ? '#dbeafe' : '#f1f5f9',
                          border: `1px solid ${isSelected ? '#93c5fd' : '#e2e8f0'}`,
                          borderRadius: 0.5,
                          px: 0.5, py: 0,
                          fontWeight: 700,
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {node.id}
                      </Typography>
                      {/* 표시명 — TB_AD_LANG_PACK 값 또는 file-path basename 폴백 */}
                      <Typography
                        component="span"
                        sx={{
                          fontSize: 12,
                          fontWeight: hasChildren ? 600 : 500,
                          fontStyle: node.hasLangPack ? 'normal' : 'italic',  // 폴백이면 이탤릭
                          color: node.hasLangPack ? '#0f172a' : '#64748b',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          flexShrink: 1, minWidth: 0,
                        }}
                        title={node.hasLangPack ? node.id : `${node.id} — LangPack 미등록 (file-path 기반 표시)`}
                      >
                        {node.displayName || transLangKey(node.id) || node.id}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    !hasChildren && node.filePath ? (
                      <Typography
                        component="span"
                        sx={{
                          fontSize: 9,
                          fontFamily: 'monospace',
                          color: '#94a3b8',
                          display: 'block',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          mt: 0.1,
                        }}
                      >
                        {node.filePath}
                      </Typography>
                    ) : null
                  }
                />
              </Stack>
            </ListItemButton>
            {hasChildren && (
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <TreeList
                  nodes={node.items}
                  level={level + 1}
                  expanded={expanded}
                  onToggle={onToggle}
                  onSelect={onSelect}
                  selectedMenuCd={selectedMenuCd}
                />
              </Collapse>
            )}
          </React.Fragment>
        );
      })}
    </List>
  );
}

export default MenuTreeBrowser;

import React, { useEffect, useMemo, useState } from 'react';

import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  Collapse,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

import { transLangKey } from '@zionex/wingui-core/lang/i18n-func';
import { useTranslation } from 'react-i18next';
import { loadTargetMenuTree } from './api';

/**
 * 메뉴 트리 브라우저 — EXISTING_MODIFY / NEW_FROM_COPY 모드에서 대상 화면 선택용.
 *
 * Target DB (예: target-mssql TB_AD_MENU + TB_AD_LANG_PACK) 에서 트리를 받아 표시.
 * 리프(화면 — filePath 있음)만 선택 가능.
 *
 * 디자인: 파스텔 글래스 테마 (theme.js — primary #7CA7E0). 2026-05-16 시각 개편.
 */

// 파스텔 팔레트 (theme.js 와 일치)
const C = {
  primary:    '#7CA7E0',
  primaryDk:  '#5683C0',
  amber:      '#C99A3F',
  text:       '#3A4A63',
  textLeaf:   '#46566F',
  textSub:    '#8A9AB3',
  textMuted:  '#A6B2C4',
  chevron:    '#9DB4D4',
  selBg:      'rgba(124,167,224,0.20)',
  selBgHover: 'rgba(124,167,224,0.26)',
  hoverBg:    'rgba(124,167,224,0.085)',
  border:     'rgba(124,167,224,0.30)',
};

function MenuTreeBrowser({ onSelect, selectedMenuCd, activeTargetCd }) {
  const { t, i18n } = useTranslation('composer');
  // wingui LangPack lookup 용 — TB_AD_LANG_PACK.LANG_CD 는 4종 ko/en/ja/zh standard.
  //   'zh-CN' / 'zh-TW' 는 base 'zh' 로 변환해 전달 (LangPack 미보유 시 backend 가 자동 fallback).
  const cur = (i18n.language || '').toLowerCase();
  const lang = cur.startsWith('ja') ? 'ja'
             : cur.startsWith('zh') ? 'zh'
             : cur.startsWith('en') ? 'en'
             : 'ko';
  const [menus, setMenus]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery]     = useState('');
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadTargetMenuTree(lang, activeTargetCd)
      .then((res) => { if (!cancelled) setMenus(res.data); })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.response?.data?.message || e?.message || t('menuTree.loadError'));
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey, activeTargetCd, lang]);

  const rootItems = menus?.items || [];

  // 리프(화면) 개수 — 헤더 표시용
  const screenCount = useMemo(() => {
    let n = 0;
    const walk = (nodes) => {
      for (const node of (nodes || [])) {
        if (node.items && node.items.length > 0) walk(node.items);
        else if (node.filePath) n += 1;
      }
    };
    walk(rootItems);
    return n;
  }, [rootItems]);

  const filteredTree = useMemo(() => {
    if (!query.trim()) return rootItems;
    const q = query.toLowerCase();
    const filter = (nodes) => {
      if (!nodes) return [];
      const result = [];
      for (const n of nodes) {
        const childMatched = filter(n.items);
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
               bgcolor: 'rgba(238,243,250,0.55)' }}>
      {/* ── 헤더 ── */}
      <Box sx={{
        p: 1.25, flexShrink: 0,
        borderBottom: `1px solid ${C.border}`,
        background: 'linear-gradient(180deg, rgba(124,167,224,0.13), rgba(124,167,224,0.02))',
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Stack direction="row" spacing={0.8} alignItems="center" sx={{ minWidth: 0 }}>
            <AccountTreeIcon sx={{ fontSize: 18, color: C.primaryDk }} />
            <Typography sx={{ fontWeight: 800, fontSize: 13, color: C.text, letterSpacing: 0.2 }}>
              {t('menuTree.title')}
            </Typography>
            {activeTargetCd && (
              <Chip
                label={activeTargetCd}
                size="small"
                sx={{ height: 18, fontSize: 9.5, fontWeight: 700,
                      bgcolor: 'rgba(124,167,224,0.18)', color: C.primaryDk,
                      border: `1px solid ${C.border}` }}
              />
            )}
            {screenCount > 0 && (
              <Typography sx={{ fontSize: 10.5, color: C.textSub, whiteSpace: 'nowrap' }}>
                {t('menuTree.screenCount', { n: screenCount })}
              </Typography>
            )}
          </Stack>
          <Stack direction="row" spacing={0.2}>
            <Tooltip title={t('menuTree.refreshTooltip')}>
              <span>
                <IconButton
                  size="small" onClick={() => setReloadKey((k) => k + 1)} disabled={loading}
                  sx={{ color: C.textSub, '&:hover': { color: C.primaryDk,
                        bgcolor: 'rgba(124,167,224,0.14)' } }}
                >
                  <RefreshIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        <TextField
          fullWidth
          size="small"
          placeholder={t('menuTree.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 17, color: '#9DB4D4' }} />
              </InputAdornment>
            ),
            sx: { borderRadius: 2, bgcolor: '#fff', fontSize: 12.5 },
          }}
          sx={{
            '& .MuiOutlinedInput-notchedOutline': { borderColor: C.border },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: `${C.primary} !important` },
            '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: `${C.primaryDk} !important` },
          }}
        />
      </Box>

      {/* ── 트리 본문 ── */}
      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, py: 0.5 }}>
        {loading && (
          <Stack alignItems="center" spacing={1} sx={{ py: 5 }}>
            <CircularProgress size={22} sx={{ color: C.primary }} />
            <Typography variant="caption" sx={{ color: C.textSub }}>
              {t('menuTree.loading')}
            </Typography>
          </Stack>
        )}
        {error && !loading && (
          <Box sx={{ p: 1.5 }}>
            <Alert severity="error" sx={{ fontSize: 12, borderRadius: 1.5 }}>{error}</Alert>
          </Box>
        )}
        {!loading && !error && rootItems.length === 0 && (
          <Box sx={{ p: 1.5 }}>
            <Alert severity="info" sx={{ fontSize: 12, borderRadius: 1.5 }}>
              {t('menuTree.emptyMenu')}
            </Alert>
          </Box>
        )}
        {!loading && !error && rootItems.length > 0 && filteredTree.length === 0 && (
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center',
                      color: C.textSub, py: 4 }}>
            {t('menuTree.noResults')}
          </Typography>
        )}
        {!loading && !error && filteredTree.length > 0 && (
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

function TreeList({ nodes, level, expanded, onToggle, onSelect, selectedMenuCd, parentMenuCd = '' }) {
  const { t } = useTranslation('composer');
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
                if (hasChildren) onToggle(node.id);
                // 화면(leaf) 선택 시 — 부모 그룹 MENU_CD 를 같이 전달.
                //   NEW_FROM_COPY 의 신규 화면 default parent 를 원본의 실제 부모로 맞추기 위해
                //   selectedMenu.parentMenuCd 로 호출자에게 노출 (재귀로 전달받은 parentMenuCd 사용).
                else if (node.filePath) onSelect({ ...node, parentMenuCd });
              }}
              selected={isSelected}
              sx={{
                pl: `${8 + level * 15}px`, pr: 1, py: 0.6,
                mx: 0.6, my: '2px', borderRadius: 1.5,
                transition: 'background-color .13s ease',
                bgcolor: isSelected ? C.selBg : 'transparent',
                boxShadow: isSelected ? `inset 3px 0 0 0 ${C.primaryDk}` : 'none',
                '&:hover': { bgcolor: isSelected ? C.selBgHover : C.hoverBg },
                '&.Mui-selected':       { bgcolor: C.selBg },
                '&.Mui-selected:hover': { bgcolor: C.selBgHover },
              }}
            >
              <Stack direction="row" spacing={0.6} alignItems="center" sx={{ width: '100%', minWidth: 0 }}>
                {/* 펼침 화살표 */}
                {hasChildren ? (
                  isExpanded
                    ? <ExpandMoreIcon sx={{ fontSize: 17, color: C.chevron, flexShrink: 0 }} />
                    : <ChevronRightIcon sx={{ fontSize: 17, color: C.chevron, flexShrink: 0 }} />
                ) : (
                  <Box sx={{ width: 17, flexShrink: 0 }} />
                )}

                {/* 아이콘 타일 */}
                <Box sx={{
                  width: 22, height: 22, flexShrink: 0, borderRadius: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: hasChildren ? 'rgba(230,192,121,0.20)' : 'rgba(124,167,224,0.16)',
                }}>
                  {hasChildren
                    ? <FolderRoundedIcon sx={{ fontSize: 15, color: C.amber }} />
                    : <DescriptionRoundedIcon sx={{ fontSize: 14, color: C.primaryDk }} />}
                </Box>

                {/* 텍스트 — 1행: 표시명 · 2행: MENU_CD + 파일경로 */}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    component="div"
                    title={node.hasLangPack ? undefined : t('menuTree.langPackMissing', { id: node.id })}
                    sx={{
                      fontSize: 12.5,
                      fontWeight: hasChildren ? 700 : 600,
                      color: hasChildren ? C.text : C.textLeaf,
                      fontStyle: node.hasLangPack ? 'normal' : 'italic',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      lineHeight: 1.35,
                    }}
                  >
                    {node.displayName || transLangKey(node.id) || node.id}
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center"
                         sx={{ minWidth: 0, mt: '1px' }}>
                    <Box component="span" sx={{
                      fontSize: 9, fontFamily: 'monospace', fontWeight: 700,
                      color: isSelected ? C.primaryDk : C.textSub,
                      bgcolor: isSelected ? 'rgba(124,167,224,0.24)' : 'rgba(124,167,224,0.11)',
                      borderRadius: 0.7, px: 0.55, py: '1px',
                      flexShrink: 0, whiteSpace: 'nowrap',
                    }}>
                      {node.id}
                    </Box>
                    {!hasChildren && node.filePath && (
                      <Typography component="span" sx={{
                        fontSize: 9.5, fontFamily: 'monospace', color: C.textMuted,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        minWidth: 0,
                      }}>
                        {node.filePath}
                      </Typography>
                    )}
                  </Stack>
                </Box>
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
                  parentMenuCd={node.id}
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

import React, { useMemo, useState } from 'react';

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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FolderIcon from '@mui/icons-material/Folder';
import ArticleIcon from '@mui/icons-material/Article';

import { useMenuStore } from '@zionex/wingui-core/store/contentStore';
import { transLangKey } from '@zionex/wingui-core/lang/i18n-func';

/**
 * 메뉴 트리 브라우저 — EXISTING_MODIFY 모드에서 대상 화면 선택용.
 * menus 스토어의 트리를 그대로 표시, 리프(화면) 만 선택 가능.
 */
function MenuTreeBrowser({ onSelect, selectedMenuCd }) {
  const menus = useMenuStore((s) => s.menus);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState({});

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
        // 번역된 메뉴명도 검색 대상에 포함
        const translatedName = (transLangKey(n.id) || '').toString().toLowerCase();
        const selfMatched = (n.id || '').toLowerCase().includes(q) ||
                           (n.path || '').toLowerCase().includes(q) ||
                           (n.filePath || '').toLowerCase().includes(q) ||
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
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          메뉴 트리
        </Typography>
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
        <TreeList
          nodes={filteredTree}
          level={0}
          expanded={expanded}
          onToggle={toggle}
          onSelect={onSelect}
          selectedMenuCd={selectedMenuCd}
        />
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
                      display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0,
                    }}>
                      {/* 번역된 메뉴 이름 (현재 선택된 언어) */}
                      <Typography
                        component="span"
                        sx={{
                          fontSize: 12,
                          fontWeight: hasChildren ? 600 : 500,
                          color: '#0f172a',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          flexShrink: 1, minWidth: 0,
                        }}
                      >
                        {transLangKey(node.id) || node.id}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.1 }}>
                      {/* 메뉴 코드 — 항상 표시 */}
                      <Typography
                        component="span"
                        sx={{
                          fontSize: 10,
                          fontFamily: 'monospace',
                          color: isSelected ? '#1d4ed8' : '#64748b',
                          bgcolor: isSelected ? '#dbeafe' : '#f1f5f9',
                          border: `1px solid ${isSelected ? '#93c5fd' : '#e2e8f0'}`,
                          borderRadius: 0.5,
                          px: 0.4, py: 0,
                          fontWeight: 600,
                          display: 'inline-block',
                          maxWidth: '100%',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >
                        {node.id}
                      </Typography>
                      {/* 리프 노드: 파일 경로 */}
                      {!hasChildren && node.filePath && (
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
                      )}
                    </Box>
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

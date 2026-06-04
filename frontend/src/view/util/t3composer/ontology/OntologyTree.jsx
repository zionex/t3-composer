import React, { useMemo, useState } from 'react';
import {
  Box, TextField, InputAdornment, List, ListItemButton, ListItemText, Collapse, Typography, Chip, Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ChevronRight from '@mui/icons-material/ChevronRight';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AddIcon from '@mui/icons-material/Add';

const CAT_COLOR = {
  QA:      '#7CA7E0',
  ENTITY:  '#9D8FD4',
  VIEW:    '#8FC4D4',
  PROCESS: '#86C7A8',
};

/**
 * Ontology 좌 트리. 카테고리 → 도메인 → row.
 * props:
 *  - tree (TreeNodeDto[])
 *  - selectedKey
 *  - onSelect(node)
 *  - onSearch(q)
 *  - onNewClick(kind)  // 'QA' | 'ENTITY'
 */
function OntologyTree({ tree, selectedKey, onSelect, onSearch, onNewClick }) {
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState(() => new Set(['QA', 'ENTITY']));

  const toggle = (key) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleSearchKey = (e) => {
    if (e.key === 'Enter') onSearch?.(q.trim());
  };

  const roots = useMemo(() => tree || [], [tree]);

  return (
    <Box sx={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
               borderRight: '1px solid rgba(124,167,224,0.30)', minHeight: 0 }}>
      <Box sx={{ p: 1.5 }}>
        <TextField
          size="small" fullWidth placeholder="검색 (Enter)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={handleSearchKey}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
          }}
        />
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, px: 0.5 }}>
        <List dense disablePadding>
          {roots.map((cat) => {
            const isOpen = expanded.has(cat.key);
            return (
              <React.Fragment key={cat.key}>
                <ListItemButton onClick={() => toggle(cat.key)} sx={{ py: 0.5 }}>
                  {isOpen ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
                  <Box sx={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                              bgcolor: CAT_COLOR[cat.category] || '#7CA7E0', ml: 0.5, mr: 1 }} />
                  <ListItemText
                    primary={<>
                      <Typography component="span" sx={{ fontWeight: 700, fontSize: 13 }}>{cat.label}</Typography>
                      <Chip size="small" label={cat.count ?? 0} sx={{ ml: 1, height: 18, fontSize: 10 }} />
                      {cat.readOnly && <LockOutlinedIcon sx={{ ml: 0.5, fontSize: 12, color: '#6E7E96' }} />}
                    </>}
                  />
                </ListItemButton>
                <Collapse in={isOpen} unmountOnExit>
                  {(cat.children || []).map((dom) => {
                    const domOpen = expanded.has(dom.key);
                    return (
                      <React.Fragment key={dom.key}>
                        <ListItemButton onClick={() => toggle(dom.key)} sx={{ pl: 4, py: 0.25 }}>
                          {domOpen ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
                          <ListItemText
                            primary={<>
                              <Typography component="span" sx={{ fontSize: 12 }}>{dom.label}</Typography>
                              <Chip size="small" label={dom.count ?? 0} sx={{ ml: 1, height: 16, fontSize: 10 }} />
                            </>}
                          />
                        </ListItemButton>
                        <Collapse in={domOpen} unmountOnExit>
                          {(dom.children || []).map((leaf) => (
                            <ListItemButton
                              key={leaf.key} dense
                              selected={leaf.key === selectedKey}
                              onClick={() => onSelect?.(leaf)}
                              sx={{ pl: 7, py: 0.2 }}
                              title={leaf.refId ? `${leaf.label}\nid: ${leaf.refId}` : leaf.label}
                            >
                              <ListItemText
                                primary={<Typography component="span"
                                  sx={{
                                    fontSize: 11,
                                    display: 'block',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}>
                                  {leaf.label}
                                </Typography>}
                              />
                            </ListItemButton>
                          ))}
                        </Collapse>
                      </React.Fragment>
                    );
                  })}
                </Collapse>
              </React.Fragment>
            );
          })}
        </List>
      </Box>
      <Box sx={{ p: 1, borderTop: '1px solid rgba(124,167,224,0.20)' }}>
        <Button size="small" fullWidth startIcon={<AddIcon />}
          onClick={() => onNewClick?.('QA')}>새 Q&A</Button>
        <Button size="small" fullWidth startIcon={<AddIcon />}
          onClick={() => onNewClick?.('ENTITY')} sx={{ mt: 0.5 }}>새 Entity</Button>
      </Box>
    </Box>
  );
}

export default OntologyTree;

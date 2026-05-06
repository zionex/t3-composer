import React, { useEffect, useMemo, useState } from 'react';

import {
  Box,
  Paper,
  Stack,
  Chip,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
  Avatar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import TableChartIcon from '@mui/icons-material/TableChart';

import { listGridTypes, deleteGridType } from './api';

const CAT_THEME = {
  BASIC:    { label: '기본',     color: '#4d9fff', icon: '📋' },
  ADVANCED: { label: '고급',     color: '#00d68f', icon: '⚡' },
  EDIT:     { label: '편집',     color: '#ffb347', icon: '✏️' },
  TREE:     { label: '트리',     color: '#9d72ff', icon: '🌲' },
  PIVOT:    { label: '피벗',     color: '#00e5ff', icon: '🔄' },
  SPECIAL:  { label: '특수',     color: '#ff4d6d', icon: '✨' },
};

function parseJson(s) {
  try { return s ? JSON.parse(s) : null; } catch { return null; }
}

/** 그리드 썸네일 (카드 내부 작은 프리뷰) */
function GridThumb({ item, maxRows = 3 }) {
  const cols = parseJson(item.sampleColumns) || [];
  const rows = parseJson(item.sampleRows) || [];

  return (
    <Box sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 1, overflow: 'hidden',
               bgcolor: '#fff', fontSize: 9 }}>
      <Box sx={{ display: 'flex', bgcolor: '#f1f5f9', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        {cols.slice(0, 5).map((c, i) => (
          <Box key={i} sx={{ flex: 1, px: 0.5, py: 0.3, fontWeight: 700, color: '#64748b',
                             fontSize: 9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                             borderRight: i < Math.min(cols.length - 1, 4) ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
            {c.header || c.name || ''}
          </Box>
        ))}
      </Box>
      {rows.slice(0, maxRows).map((r, ri) => (
        <Box key={ri} sx={{ display: 'flex',
                             borderBottom: ri < Math.min(rows.length, maxRows) - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                             bgcolor: ri % 2 ? '#fafbfc' : 'transparent' }}>
          {(Array.isArray(r) ? r : Object.values(r)).slice(0, 5).map((v, ci) => (
            <Box key={ci} sx={{ flex: 1, px: 0.5, py: 0.25, fontSize: 9, color: '#334155',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {v === true ? '✓' : v === false ? '' : String(v ?? '')}
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}

/** 상세 영역의 Full-size 그리드 프리뷰 */
function GridFullPreview({ item }) {
  const cols = parseJson(item.sampleColumns) || [];
  const rows = parseJson(item.sampleRows)    || [];
  const props = parseJson(item.properties)   || {};

  return (
    <Box sx={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: 2, overflow: 'hidden',
               bgcolor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 0.5, p: 1, bgcolor: '#f8fafc',
                 borderBottom: '1px solid rgba(0,0,0,0.06)', alignItems: 'center' }}>
        {props.checkable    && <Chip size="small" label="☑ 체크"    variant="outlined" />}
        {props.editable     && <Chip size="small" label="✎ 편집"    variant="outlined" color="warning" />}
        {props.hierarchical && <Chip size="small" label="▼ 트리"    variant="outlined" color="secondary" />}
        {props.paging       && <Chip size="small" label="📄 페이징" variant="outlined" />}
        {props.footer       && <Chip size="small" label="Σ 합계행"  variant="outlined" color="success" />}
        {props.excelExport  && <Chip size="small" label="⬇ Excel"  variant="outlined" color="info" />}
        {props.excelImport  && <Chip size="small" label="⬆ 업로드"  variant="outlined" color="info" />}
        {props.rowDrag      && <Chip size="small" label="☰ Drag"    variant="outlined" color="secondary" />}
        {props.filterRow    && <Chip size="small" label="🔍 필터행"  variant="outlined" />}
        {props.cellMerge    && <Chip size="small" label="⛶ 병합"    variant="outlined" />}
        {props.rowNumber    && <Chip size="small" label="# No"      variant="outlined" />}
      </Box>

      {/* Header */}
      <Box sx={{ display: 'flex', bgcolor: '#f1f5f9',
                 borderBottom: '2px solid rgba(0,0,0,0.08)' }}>
        {cols.map((c, i) => (
          <Box key={i} sx={{
            flex: c.width ? `0 0 ${Math.min(c.width, 200)}px` : 1,
            fontSize: 12, fontWeight: 700, color: '#475569',
            px: 1, py: 0.8,
            borderRight: i < cols.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {c.header || c.name}
          </Box>
        ))}
      </Box>

      {/* Rows */}
      {rows.map((r, ri) => {
        const isTotal = Array.isArray(r) && String(r[0] || '').includes('합계');
        return (
          <Box key={ri} sx={{
            display: 'flex',
            borderBottom: ri < rows.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
            bgcolor: isTotal ? '#dbeafe' : (ri % 2 ? '#fafbfc' : 'transparent'),
            fontWeight: isTotal ? 700 : 400,
            '&:hover': { bgcolor: isTotal ? '#bfdbfe' : '#f1f5f9' },
          }}>
            {(Array.isArray(r) ? r : Object.values(r)).map((v, ci) => {
              const col = cols[ci] || {};
              const isNum = col.dataType === 'number';
              const val = v === true ? '✓' : v === false ? '' : String(v ?? '');
              if (col.render === 'progress' && typeof v === 'number') {
                return (
                  <Box key={ci} sx={{ flex: col.width ? `0 0 ${Math.min(col.width, 200)}px` : 1,
                                      px: 1, py: 0.6, display: 'flex', alignItems: 'center', gap: 0.7 }}>
                    <Box sx={{ flex: 1, height: 8, bgcolor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                      <Box sx={{ width: `${v}%`, height: '100%',
                                  background: v >= 100 ? 'linear-gradient(90deg, #10b981, #34d399)'
                                                       : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                                  borderRadius: 4, transition: 'width 0.4s' }} />
                    </Box>
                    <Box sx={{ fontSize: 11, minWidth: 35, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>
                      {v}%
                    </Box>
                  </Box>
                );
              }
              return (
                <Box key={ci} sx={{
                  flex: col.width ? `0 0 ${Math.min(col.width, 200)}px` : 1,
                  fontSize: 12,
                  color: '#334155',
                  textAlign: isNum ? 'right' : 'left',
                  fontFamily: isNum ? 'monospace' : 'inherit',
                  px: 1, py: 0.6,
                  borderRight: ci < cols.length - 1 ? '1px solid rgba(0,0,0,0.03)' : 'none',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {isNum && typeof v === 'number' ? v.toLocaleString() : val}
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}

function GridTypeTab() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCat]   = useState('ALL');
  const [query, setQuery]     = useState('');
  const [selected, setSelected] = useState(null);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await listGridTypes(false);
      const list = Array.isArray(res.data) ? res.data : [];
      setItems(list);
      if (list.length > 0 && !selected) setSelected(list[0]);
    } finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => items.filter(p => {
    if (catFilter !== 'ALL' && p.category !== catFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      const hay = `${p.code} ${p.name} ${p.nameEn || ''} ${p.description || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [items, catFilter, query]);

  const catCounts = useMemo(() => {
    const m = { ALL: items.length };
    items.forEach(i => {
      const c = i.category || 'etc';
      m[c] = (m[c] || 0) + 1;
    });
    return m;
  }, [items]);

  const catList = useMemo(() => {
    const cs = Object.keys(CAT_THEME).filter(c => catCounts[c]);
    return ['ALL', ...cs];
  }, [catCounts]);

  const handleDelete = async (id) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('해당 Grid Type 을 삭제하시겠습니까?')) return;
    await deleteGridType(id);
    if (selected?.id === id) setSelected(null);
    reload();
  };

  const theme = selected ? (CAT_THEME[selected.category] || { color: '#64748b', icon: '📋', label: '-' }) : null;

  return (
    <Box sx={{ display: 'flex', flex: 1, minHeight: 0, gap: 1.5, bgcolor: '#f5f7fb', p: 1, borderRadius: 1 }}>

      {/* ============ LEFT: Gallery ============ */}
      <Paper variant="outlined" sx={{
        width: 440, display: 'flex', flexDirection: 'column', minHeight: 0,
        borderRadius: 2, borderColor: 'rgba(0,0,0,0.06)', bgcolor: '#fff',
      }}>
        <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider',
                   background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                   color: '#fff', borderRadius: '8px 8px 0 0' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <TableChartIcon />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Grid 갤러리</Typography>
            <Chip label={`${filtered.length}/${items.length}`} size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: '#fff', height: 20, fontSize: 10, fontWeight: 700 }} />
            <IconButton size="small" onClick={reload} disabled={loading}
                        sx={{ ml: 'auto !important', color: '#fff' }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Stack>
          <TextField size="small" placeholder="Grid 이름·설명 검색"
                     value={query} onChange={(e) => setQuery(e.target.value)}
                     sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.95)', borderRadius: 1,
                           '& .MuiOutlinedInput-notchedOutline': { border: 0 } }}
                     fullWidth
                     InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small"/></InputAdornment> }} />
        </Box>

        {/* Category Pills */}
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: '#fafbff' }}>
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {catList.map(c => {
              const t = c === 'ALL'
                ? { label: '전체', color: '#64748b', icon: '🌐' }
                : CAT_THEME[c];
              const active = catFilter === c;
              return (
                <Box key={c} onClick={() => setCat(c)}
                     sx={{ cursor: 'pointer', px: 0.8, py: 0.3, borderRadius: 1.5,
                           display: 'flex', alignItems: 'center', gap: 0.3,
                           fontSize: 11, fontWeight: 700,
                           bgcolor: active ? t.color : `${t.color}15`,
                           color: active ? '#fff' : t.color,
                           border: `1px solid ${active ? t.color : `${t.color}44`}`,
                           transition: 'all 0.15s',
                           '&:hover': { bgcolor: active ? t.color : `${t.color}25` } }}>
                  <Box sx={{ fontSize: 12 }}>{t.icon}</Box>
                  <span>{t.label}</span>
                  <Box sx={{ fontSize: 9,
                             bgcolor: active ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.06)',
                             color: active ? '#fff' : t.color,
                             px: 0.4, borderRadius: 0.6, fontWeight: 800 }}>
                    {catCounts[c] || 0}
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Box>

        {/* Gallery Grid */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {loading && <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={24} /></Box>}
          {!loading && filtered.map((it) => {
            const t = CAT_THEME[it.category] || { color: '#64748b', icon: '📋' };
            const isSel = selected?.id === it.id;
            return (
              <Paper key={it.id} onClick={() => setSelected(it)}
                     variant="outlined"
                     sx={{ flexShrink: 0,                                  // ⭐ prevent squashing
                           cursor: 'pointer', borderRadius: 2,
                           borderColor: isSel ? t.color : 'rgba(0,0,0,0.1)',
                           borderWidth: isSel ? 2 : 1,
                           boxShadow: isSel ? `0 4px 12px ${t.color}33` : '0 1px 3px rgba(0,0,0,0.05)',
                           transition: 'all 0.15s', bgcolor: '#fff',
                           '&:hover': { transform: 'translateX(2px)',
                                        boxShadow: `0 6px 16px ${t.color}22`, borderColor: t.color } }}>
                {/* Flat layout — no nested flex that can shrink the name */}
                <Box sx={{ display: 'flex', flexDirection: 'column', p: 1.3, gap: 0.7 }}>
                  {/* Row 1 : Avatar + Code chip + Category chip */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                    <Avatar sx={{ bgcolor: `${t.color}22`, color: t.color,
                                  width: 32, height: 32, fontSize: 16, flexShrink: 0 }}>
                      {t.icon}
                    </Avatar>
                    <Chip label={it.code} size="small"
                          sx={{ fontFamily: 'monospace', height: 22, fontSize: 12,
                                fontWeight: 800, bgcolor: `${t.color}22`, color: t.color,
                                '& .MuiChip-label': { px: 0.9 } }} />
                    <Chip label={t.label} size="small"
                          sx={{ height: 22, fontSize: 12, fontWeight: 700,
                                bgcolor: t.color, color: '#fff',
                                '& .MuiChip-label': { px: 0.9 } }} />
                  </Box>
                  {/* Row 2 : Name (full width, never squashed) */}
                  <Box sx={{ fontSize: 15, fontWeight: 700, color: '#1e293b',
                             lineHeight: 1.3, whiteSpace: 'nowrap',
                             overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {it.name}
                  </Box>
                  {/* Row 3 : Thumbnail */}
                  <GridThumb item={it} />
                  {/* Row 4 : Component stack */}
                  <Box sx={{ fontSize: 11, color: '#64748b', fontWeight: 500,
                             overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    📦 {it.componentStack}
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Box>
      </Paper>

      {/* ============ RIGHT: Detail ============ */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {!selected && (
          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', alignItems: 'center',
                                           justifyContent: 'center', color: 'text.secondary',
                                           borderRadius: 2, borderColor: 'rgba(0,0,0,0.06)' }}>
            ← 좌측에서 Grid 를 선택하세요
          </Paper>
        )}
        {selected && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'auto' }}>

            {/* Hero */}
            <Paper elevation={0} sx={{
              p: 2, mb: 1.5, borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.color} 0%, ${theme.color}cc 100%)`,
              color: '#fff', position: 'relative', overflow: 'hidden',
            }}>
              <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120,
                         borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: '#fff',
                              width: 48, height: 48, fontSize: 24,
                              border: '2px solid rgba(255,255,255,0.3)' }}>
                  {theme.icon}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={0.7} alignItems="center" sx={{ mb: 0.3 }}>
                    <Chip label={selected.code} size="small"
                          sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: '#fff',
                                fontFamily: 'monospace', fontWeight: 800, height: 20 }} />
                    <Chip label={theme.label} size="small"
                          sx={{ bgcolor: 'rgba(0,0,0,0.18)', color: '#fff', height: 20, fontWeight: 700 }} />
                  </Stack>
                  <Typography variant="h5" sx={{ fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
                    {selected.name}
                  </Typography>
                  {selected.nameEn && (
                    <Typography variant="caption" sx={{ opacity: 0.85, fontStyle: 'italic' }}>
                      {selected.nameEn}
                    </Typography>
                  )}
                </Box>
                <Tooltip title="삭제">
                  <IconButton size="small" onClick={() => handleDelete(selected.id)}
                              sx={{ color: 'rgba(255,255,255,0.75)' }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>

            {/* Description */}
            <Paper variant="outlined" sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.7 }}>
                {selected.description}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {selected.componentStack && (
                  <Chip label={`Stack: ${selected.componentStack}`} size="small" variant="outlined" />
                )}
                {selected.recommendedFor && (
                  <Chip label={`추천: ${selected.recommendedFor}`} size="small" variant="outlined" color="info" />
                )}
                {selected.layoutKey && (
                  <Chip label={selected.layoutKey} size="small" variant="outlined"
                        sx={{ fontFamily: 'monospace' }} />
                )}
              </Stack>
            </Paper>

            {/* Full Preview */}
            <Paper variant="outlined" sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={0.7} sx={{ mb: 1 }}>
                <Box sx={{ width: 6, height: 18, borderRadius: 1, bgcolor: theme.color }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Live Preview
                </Typography>
              </Stack>
              <GridFullPreview item={selected} />
            </Paper>

            {/* JSON */}
            {selected.properties && (
              <Paper variant="outlined" sx={{ p: 2, mb: 1, borderRadius: 2,
                                               background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#e2e8f0' }}>
                  ⚙️ PROPERTIES
                </Typography>
                <Box component="pre" sx={{ fontSize: 11, color: '#a6da95',
                                            p: 1, mt: 0.5, overflow: 'auto',
                                            fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1.6 }}>
                  {JSON.stringify(parseJson(selected.properties), null, 2)}
                </Box>
              </Paper>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default GridTypeTab;

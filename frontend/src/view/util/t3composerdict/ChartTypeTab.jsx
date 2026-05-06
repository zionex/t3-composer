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
import BarChartIcon from '@mui/icons-material/BarChart';

import { Chart as ChartJS, registerables } from 'chart.js';
import { Chart as ChartComp } from 'react-chartjs-2';

import { listChartTypes, deleteChartType } from './api';

ChartJS.register(...registerables);

const CAT_THEME = {
  BAR:     { label: '막대',     color: '#4d9fff', icon: '📊' },
  LINE:    { label: '꺾은선',   color: '#00d68f', icon: '📈' },
  AREA:    { label: '영역',     color: '#ffb347', icon: '🏔️' },
  PIE:     { label: '파이/도넛', color: '#ff4d6d', icon: '🥧' },
  RADAR:   { label: '방사형',   color: '#9d72ff', icon: '🎯' },
  SCATTER: { label: '산점/버블', color: '#00e5ff', icon: '⭕' },
  COMBO:   { label: '복합',     color: '#f59e0b', icon: '🎨' },
  SCALE:   { label: '축/스케일', color: '#64748b', icon: '📏' },
};

function parseJson(s) {
  try { return s ? JSON.parse(s) : null; } catch { return null; }
}

/**
 * Chart thumbnail — 작은 크기로 렌더링 (absolute 로 부모 크기 강제)
 */
function ChartThumb({ item, height = 90 }) {
  const data = parseJson(item.sampleData);
  const opts = parseJson(item.optionsJson) || {};
  if (!data) return null;

  const thinOpts = {
    responsive: true, maintainAspectRatio: false, animation: false,
    layout: { padding: 4 },
    scales: {
      x: { display: false },
      y: { display: false },
      ...((opts.scales?.y1 || opts.scales?.r) ? opts.scales : {}),
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    ...opts,
  };

  // Axis-less charts 는 scales 제거
  if (['pie', 'doughnut', 'polarArea', 'radar'].includes(item.chartType)) {
    delete thinOpts.scales;
  }

  return (
    <Box sx={{ height, width: '100%', minWidth: 0, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', inset: 0 }}>
        <ChartComp type={item.chartType} data={data} options={thinOpts} />
      </Box>
    </Box>
  );
}

/**
 * Full chart preview — 상세 영역
 */
function ChartFullPreview({ item }) {
  const data = parseJson(item.sampleData);
  const opts = parseJson(item.optionsJson) || {};
  if (!data) return <Box sx={{ p: 4, textAlign: 'center' }}>샘플 데이터 없음</Box>;

  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, padding: 10, usePointStyle: true } },
      tooltip: { backgroundColor: 'rgba(0,0,0,0.85)' },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11 } } },
    },
    ...opts,
  };
  if (['pie', 'doughnut', 'polarArea', 'radar'].includes(item.chartType)) {
    delete options.scales;
  }

  return (
    <Box sx={{ height: 320, width: '100%' }}>
      <ChartComp type={item.chartType} data={data} options={options} />
    </Box>
  );
}

function ChartTypeTab() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [catFilter, setCat]     = useState('ALL');
  const [query, setQuery]       = useState('');
  const [selected, setSelected] = useState(null);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await listChartTypes(false);
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
    if (!window.confirm('해당 Chart Type 을 삭제하시겠습니까?')) return;
    await deleteChartType(id);
    if (selected?.id === id) setSelected(null);
    reload();
  };

  const theme = selected ? (CAT_THEME[selected.category] || { color: '#64748b', icon: '📊', label: '-' }) : null;

  return (
    <Box sx={{ display: 'flex', flex: 1, minHeight: 0, gap: 1.5, bgcolor: '#f5f7fb', p: 1, borderRadius: 1 }}>

      {/* ============ LEFT: Category + Gallery ============ */}
      <Paper variant="outlined" sx={{
        width: 440, display: 'flex', flexDirection: 'column', minHeight: 0,
        borderRadius: 2, borderColor: 'rgba(0,0,0,0.06)', bgcolor: '#fff',
      }}>
        <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider',
                   background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                   color: '#fff', borderRadius: '8px 8px 0 0' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <BarChartIcon />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Chart 갤러리</Typography>
            <Chip label={`${filtered.length}/${items.length}`} size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: '#fff', height: 20, fontSize: 10, fontWeight: 700 }} />
            <IconButton size="small" onClick={reload} disabled={loading}
                        sx={{ ml: 'auto !important', color: '#fff' }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Stack>
          <TextField size="small" placeholder="차트 이름·설명 검색"
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
        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', p: 1, display: 'grid',
                   gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',   // ⭐ prevent column expansion
                   gridAutoRows: 'max-content',
                   gap: 1, alignContent: 'start' }}>
          {loading && <Box sx={{ gridColumn: '1/-1', textAlign: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>}
          {!loading && filtered.map((it) => {
            const t = CAT_THEME[it.category] || { color: '#64748b', icon: '📊' };
            const isSel = selected?.id === it.id;
            return (
              <Paper key={it.id} onClick={() => setSelected(it)}
                     variant="outlined"
                     sx={{ cursor: 'pointer', borderRadius: 2,
                           display: 'flex', flexDirection: 'column',
                           minWidth: 0, overflow: 'hidden',                 // ⭐ prevent child overflow
                           borderColor: isSel ? t.color : 'rgba(0,0,0,0.1)',
                           borderWidth: isSel ? 2 : 1,
                           boxShadow: isSel ? `0 4px 12px ${t.color}33` : '0 1px 3px rgba(0,0,0,0.05)',
                           transition: 'all 0.15s', bgcolor: '#fff',
                           '&:hover': { transform: 'translateY(-2px)',
                                        boxShadow: `0 6px 16px ${t.color}22`,
                                        borderColor: t.color } }}>
                {/* Thumbnail */}
                <Box sx={{ bgcolor: '#fcfdff',
                           borderBottom: '1px solid rgba(0,0,0,0.06)',
                           p: 0.5, position: 'relative',
                           borderRadius: '8px 8px 0 0', overflow: 'hidden',
                           flexShrink: 0, minWidth: 0 }}>
                  <ChartThumb item={it} height={90} />
                  <Chip label={it.code} size="small"
                        sx={{ position: 'absolute', top: 4, left: 4,
                              fontFamily: 'monospace', height: 20, fontSize: 11, fontWeight: 800,
                              bgcolor: `${t.color}ee`, color: '#fff',
                              '& .MuiChip-label': { px: 0.8 } }} />
                </Box>
                {/* Meta — explicit column layout */}
                <Box sx={{ display: 'flex', flexDirection: 'column',
                           p: 1, gap: 0.3, flexShrink: 0 }}>
                  {/* Row 1 : icon + category + chartType */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ fontSize: 14 }}>{t.icon}</Box>
                    <Box sx={{ fontSize: 12, fontWeight: 700, color: t.color }}>
                      {t.label}
                    </Box>
                    <Chip label={it.chartType?.toUpperCase()} size="small"
                          sx={{ ml: 'auto !important', height: 18, fontSize: 10,
                                fontFamily: 'monospace', bgcolor: '#f1f5f9', color: '#475569',
                                fontWeight: 700,
                                '& .MuiChip-label': { px: 0.6 } }} />
                  </Box>
                  {/* Row 2 : name */}
                  <Box sx={{ fontSize: 14, fontWeight: 700, color: '#1e293b',
                             lineHeight: 1.3, whiteSpace: 'nowrap',
                             overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {it.name}
                  </Box>
                  {/* Row 3 : english name */}
                  <Box sx={{ fontSize: 11, color: '#64748b', fontStyle: 'italic',
                             overflow: 'hidden', textOverflow: 'ellipsis',
                             whiteSpace: 'nowrap' }}>
                    {it.nameEn}
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
            ← 좌측에서 Chart 를 선택하세요
          </Paper>
        )}
        {selected && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'auto' }}>

            {/* Hero Header */}
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
                    <Chip label={selected.chartType?.toUpperCase()} size="small"
                          sx={{ bgcolor: 'rgba(0,0,0,0.18)', color: '#fff',
                                fontFamily: 'monospace', fontWeight: 700, height: 20 }} />
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
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {selected.description}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {selected.componentStack && (
                  <Chip label={`Stack: ${selected.componentStack}`} size="small" variant="outlined" />
                )}
                {selected.recommendedFor && (
                  <Chip label={`추천: ${selected.recommendedFor}`} size="small" variant="outlined" color="info" />
                )}
              </Stack>
            </Paper>

            {/* Live Preview */}
            <Paper variant="outlined" sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={0.7} sx={{ mb: 1 }}>
                <Box sx={{ width: 6, height: 18, borderRadius: 1, bgcolor: theme.color }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Live Preview (Chart.js)
                </Typography>
              </Stack>
              <ChartFullPreview item={selected} />
            </Paper>

            {/* JSON Blocks */}
            {selected.optionsJson && selected.optionsJson !== '{}' && (
              <Paper variant="outlined" sx={{ p: 2, mb: 1, borderRadius: 2,
                                               background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#e2e8f0' }}>
                  ⚙️ OPTIONS (Chart.js)
                </Typography>
                <Box component="pre" sx={{ fontSize: 11, color: '#c0caf5',
                                            p: 1, mt: 0.5, overflow: 'auto',
                                            fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1.6 }}>
                  {JSON.stringify(parseJson(selected.optionsJson), null, 2)}
                </Box>
              </Paper>
            )}
            {selected.sampleData && (
              <Paper variant="outlined" sx={{ p: 2, mb: 1, borderRadius: 2,
                                               background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#e2e8f0' }}>
                  📋 SAMPLE DATA
                </Typography>
                <Box component="pre" sx={{ fontSize: 11, color: '#a6da95',
                                            p: 1, mt: 0.5, overflow: 'auto', maxHeight: 180,
                                            fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1.6 }}>
                  {JSON.stringify(parseJson(selected.sampleData), null, 2)}
                </Box>
              </Paper>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default ChartTypeTab;

// T3Composer 화면 패턴 관리 화면
import React, { useEffect, useMemo, useState } from 'react';

import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Tooltip,
  Chip,
  Switch,
  Rating,
  Alert,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Avatar,
} from '@mui/material';
import SearchIcon       from '@mui/icons-material/Search';
import AddIcon          from '@mui/icons-material/Add';
import EditIcon         from '@mui/icons-material/Edit';
import DeleteIcon       from '@mui/icons-material/Delete';
import RefreshIcon      from '@mui/icons-material/Refresh';
import DashboardIcon    from '@mui/icons-material/Dashboard';
import ViewModuleIcon   from '@mui/icons-material/ViewModule';
import ViewListIcon     from '@mui/icons-material/ViewList';
import ClearIcon        from '@mui/icons-material/Clear';
import InventoryIcon    from '@mui/icons-material/Inventory2Outlined';
import CheckCircleIcon  from '@mui/icons-material/CheckCircleOutline';
import CategoryIcon     from '@mui/icons-material/CategoryOutlined';
import PlaceIcon        from '@mui/icons-material/PlaceOutlined';

import { ContentInner, WorkArea } from '@wingui/common/imports';

import {
  listPatterns,
  togglePatternActive,
  deletePattern,
} from '../t3composer/api';
import PatternPreview from '../t3composer/PatternPreview';
import PatternFormDialog from './PatternFormDialog';

const CATEGORY_LABELS = {
  LAYOUT_SINGLE:       { label: '01 미분할 (단일)',  color: '#0ea5e9' },
  LAYOUT_V2:           { label: '11 상하 2분할',    color: '#5281b3' },
  LAYOUT_V3:           { label: '12 상하 3분할',    color: '#3e6088' },
  LAYOUT_V4:           { label: '13 상하 4분할',    color: '#2a3d5c' },
  LAYOUT_V5:           { label: '14 상하 5+분할',   color: '#1a2438' },
  LAYOUT_H2:           { label: '21 좌우 2분할',    color: '#2a9d8f' },
  LAYOUT_H3:           { label: '22 좌우 3분할',    color: '#1f7a70' },
  LAYOUT_H4:           { label: '23 좌우 4분할',    color: '#145850' },
  LAYOUT_H5:           { label: '24 좌우 5+분할',   color: '#0a3a34' },
  LAYOUT_MIXED:        { label: '31 혼합·격자·특수', color: '#fa7d5b' },
  LAYOUT_CONTROLBOARD: { label: '91 ControlBoard',  color: '#8b5cf6' },
  LAYOUT_PLANEDIT:     { label: '92 PlanEdit',      color: '#00d68f' },
  LAYOUT_MONITORING:   { label: '93 Monitoring',    color: '#00e5ff' },
  LAYOUT_ROUTELAYOUT:  { label: '95 RouteLayout',   color: '#ffb347' },
};

function categorySortKey(cat) {
  const label = CATEGORY_LABELS[cat]?.label || cat;
  const m = /^(\d+)/.exec(label);
  return m ? parseInt(m[1], 10) : 9999;
}

function T3ComposerPatterns() {
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // 초기 렌더 부담을 줄이기 위해 '11 상하 2분할(LAYOUT_V2 — 48행 최다)' + 리스트 뷰로 시작.
  //   LAYOUT_SINGLE 은 신설 카테고리라 현재 0행 — 사용자가 패턴을 직접 이동/등록한 후 사용.
  //   (2026-04-30 카테고리 재분류 후 SINGLE 빈 채로 두고 V2 부터 시작 — 진입 즉시 데이터 노출)
  const [query, setQuery]           = useState('');
  const [catFilter, setCatFilter]   = useState('LAYOUT_V2');
  const [activeOnly, setActiveOnly] = useState(false);
  const [viewMode, setViewMode]     = useState('list');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  // Tooltip 미리보기 확대용 viewport 추적
  const [viewportW, setViewportW] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1920
  );
  useEffect(() => {
    const h = () => setViewportW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await listPatterns(false);
      setPatterns(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '조회 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const stats = useMemo(() => {
    const m = { total: patterns.length, active: 0, inactive: 0, byCategory: {} };
    for (const p of patterns) {
      if (p.useYn === 'Y') m.active++; else m.inactive++;
      const c = p.category || 'UNCATEGORIZED';
      m.byCategory[c] = (m.byCategory[c] || 0) + 1;
    }
    return m;
  }, [patterns]);

  // CATEGORY_LABELS 에 정의된 모든 카테고리를 토글에 노출 (빈 카테고리 포함) — 사용자가
  // 신설 LAYOUT_SINGLE 등에 패턴을 등록·이동할 수 있도록. patterns 에서 발견된 신규 카테고리도
  // 추가 (CATEGORY_LABELS 에 없는 미등록 카테고리 대응).
  const categories = useMemo(() => {
    const set = new Set(Object.keys(CATEGORY_LABELS));
    for (const p of patterns) if (p.category) set.add(p.category);
    const sorted = Array.from(set).sort((a, b) => {
      const ka = categorySortKey(a);
      const kb = categorySortKey(b);
      return ka === kb ? a.localeCompare(b) : ka - kb;
    });
    return ['ALL', ...sorted];
  }, [patterns]);

  const filtered = useMemo(() => {
    return patterns.filter((p) => {
      if (catFilter !== 'ALL' && p.category !== catFilter) return false;
      if (activeOnly && p.useYn !== 'Y') return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const hay = `${p.code} ${p.name} ${p.nameEn} ${p.description} ${p.layout} ${p.recommendedFor || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      const ka = categorySortKey(a.category || '');
      const kb = categorySortKey(b.category || '');
      if (ka !== kb) return ka - kb;
      return (a.code || '').localeCompare(b.code || '');
    });
  }, [patterns, catFilter, activeOnly, query]);

  const handleAdd    = () => { setEditTarget(null); setDialogOpen(true); };
  const handleEdit   = (p) => { setEditTarget(p); setDialogOpen(true); };
  const handleSaved  = () => { setDialogOpen(false); reload(); };

  const handleToggle = async (p) => {
    try { await togglePatternActive(p.id); reload(); }
    catch (e) { alert('상태 변경 실패: ' + (e?.message || '')); }  // eslint-disable-line no-alert
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`패턴 [${p.code}] ${p.name} 을(를) 삭제하시겠습니까?`)) return;  // eslint-disable-line no-alert
    try { await deletePattern(p.id); reload(); }
    catch (e) { alert('삭제 실패: ' + (e?.response?.data?.message || e?.message || ''));  }  // eslint-disable-line no-alert
  };

  const clearAllFilters = () => { setQuery(''); setCatFilter('ALL'); setActiveOnly(false); };
  const hasFilter = query.trim() || catFilter !== 'ALL' || activeOnly;

  // ===== 공용 미리보기 Tooltip (화면의 50% 폭, 내부 텍스트도 비율 확대) =====
  // PatternPreview 는 400×260 로직컬 캔버스 + fontSize 7~9 고정값으로 그려지므로,
  // 컨테이너만 키워도 글자는 작게 남음. → transform: scale() 로 전체를 비율 확대.
  const renderPreviewTooltipContent = (p, meta) => {
    const targetW = Math.floor(Math.min(viewportW * 0.5, 1200));
    const targetH = Math.floor(targetW * (2.6 / 4));
    const scale   = targetW / 400;
    return (
      <Box sx={{ p: 0.8 }}>
        <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 0.8 }}>
          <Chip label={p.code} size="small" sx={{
            height: 22, fontSize: 11, fontFamily: 'monospace',
            fontWeight: 700, bgcolor: '#0f172a', color: '#fff',
          }} />
          <Chip label={meta.label} size="small" sx={{
            height: 22, fontSize: 11, fontWeight: 600,
            bgcolor: `${meta.color}22`, color: meta.color,
          }} />
          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
            {p.name}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748b' }}>
            {p.layout}
          </Typography>
        </Stack>

        {/* 외부 박스: 실제 차지할 크기로 고정 */}
        <Box sx={{
          width:  targetW,
          height: targetH,
          bgcolor: '#f1f5f9',
          borderRadius: 1.2,
          border: `2px solid ${meta.color}`,
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* 내부 박스: 400×260 자리에 그려놓고 scale() 로 확대 */}
          <Box sx={{
            width: 400,
            height: 260,
            position: 'absolute',
            top: 0,
            left: 0,
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
          }}>
            <PatternPreview layout={p.layout} width={400} height={260} />
          </Box>
        </Box>

        {p.description && (
          <Typography variant="caption" sx={{
            display: 'block', mt: 0.8, color: '#475569',
            lineHeight: 1.5, fontSize: 13,
          }}>
            {p.description}
          </Typography>
        )}
      </Box>
    );
  };

  const previewTooltipProps = {
    // right 기본, 공간 부족 시 좌/상/하로 자동 flip — 화면 밖 잘림 방지
    placement: 'right',
    arrow: true,
    enterDelay: 150,
    leaveDelay: 80,
    PopperProps: {
      modifiers: [
        {
          name: 'flip',
          enabled: true,
          options: {
            fallbackPlacements: ['left', 'top', 'bottom'],
            padding: 8,
          },
        },
        {
          name: 'preventOverflow',
          enabled: true,
          options: {
            boundary: 'clippingParents',
            rootBoundary: 'viewport',
            padding: 8,
            altAxis: true,
          },
        },
        {
          name: 'offset',
          enabled: true,
          options: { offset: [0, 8] },
        },
      ],
    },
    componentsProps: {
      tooltip: { sx: {
        bgcolor: '#ffffff', color: '#0f172a',
        maxWidth: 'none', p: 0.6,
        border: '1px solid rgba(15,23,42,0.14)',
        boxShadow: '0 10px 40px rgba(15,23,42,0.25)',
        borderRadius: 1.5,
      }},
      arrow: { sx: { color: '#ffffff' } },
    },
  };

  // ===== 통계 카드 =====
  const summaryCards = [
    { label: '전체 패턴',   val: stats.total,                              icon: <InventoryIcon   sx={{ fontSize: 18 }} /> },
    { label: '활성',        val: stats.active,                             icon: <CheckCircleIcon sx={{ fontSize: 18 }} /> },
    { label: '카테고리',    val: Object.keys(stats.byCategory).length,     icon: <CategoryIcon    sx={{ fontSize: 18 }} /> },
    { label: '필터 결과',   val: filtered.length,                          icon: <PlaceIcon       sx={{ fontSize: 18 }} /> },
  ];

  return (
    <ContentInner>
      <WorkArea>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
                   bgcolor: '#eef2f7', p: 1.2, gap: 1.2 }}>

          {/* ===== Hero ===== */}
          <Paper elevation={0} sx={{
            p: 2, borderRadius: 2.5, flexShrink: 0,
            background: 'linear-gradient(135deg, #0c4a6e 0%, #1e3a8a 55%, #581c87 100%)',
            color: '#fff', position: 'relative', overflow: 'hidden',
          }}>
            <Box sx={{ position: 'absolute', top: -40, right: -20, width: 200, height: 200,
                       borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
            <Box sx={{ position: 'absolute', top: 30, right: 140, width: 100, height: 100,
                       borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
            <Box sx={{ position: 'absolute', bottom: -50, left: 100, width: 180, height: 180,
                       borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />

            <Stack direction="row" alignItems="center" spacing={2} sx={{ position: 'relative' }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: '#fff',
                            width: 56, height: 56, border: '2px solid rgba(255,255,255,0.3)' }}>
                <DashboardIcon sx={{ fontSize: 30 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1,
                                               textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  화면 패턴 관리
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.3 }}>
                  Composer 화면 생성기가 참조할 <b>레이아웃 패턴</b>을 관리합니다.
                  좌우·상하·혼합 레이아웃부터 ControlBoard·PlanEdit·Monitoring 특수 패턴까지.
                </Typography>
              </Box>

              {/* Quick stat chips */}
              <Stack direction="row" spacing={1}>
                {summaryCards.map((s, i) => (
                  <Box key={i} sx={{
                    minWidth: 96, textAlign: 'center',
                    bgcolor: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: 2, px: 1.2, py: 0.8,
                  }}>
                    <Stack direction="row" alignItems="center" spacing={0.6} justifyContent="center">
                      {s.icon}
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{s.label}</Typography>
                    </Stack>
                    <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2, mt: 0.2 }}>
                      {s.val}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Paper>

          {/* ===== Category Pills ===== */}
          <Paper elevation={0} sx={{ p: 1, borderRadius: 2, flexShrink: 0, bgcolor: '#fff' }}>
            <Stack direction="row" spacing={0.7} sx={{ overflowX: 'auto',
                    '::-webkit-scrollbar': { height: 6 },
                    '::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: 3 } }}>
              {categories.map((c) => {
                const meta = c === 'ALL'
                  ? { label: '전체',  color: '#334155' }
                  : (CATEGORY_LABELS[c] || { label: c, color: '#888' });
                const count = c === 'ALL' ? stats.total : (stats.byCategory[c] || 0);
                const selected = catFilter === c;
                return (
                  <Chip
                    key={c}
                    label={`${meta.label} · ${count}`}
                    onClick={() => setCatFilter(c)}
                    sx={{
                      height: 30, flexShrink: 0,
                      fontWeight: 600, fontSize: 12,
                      bgcolor: selected ? meta.color : `${meta.color}18`,
                      color:   selected ? '#fff'       : meta.color,
                      border:  `1px solid ${selected ? meta.color : `${meta.color}55`}`,
                      '&:hover': {
                        bgcolor: selected ? meta.color : `${meta.color}2e`,
                      },
                    }}
                  />
                );
              })}
            </Stack>
          </Paper>

          {/* ===== Toolbar ===== */}
          <Paper elevation={0} sx={{ p: 1.2, borderRadius: 2, flexShrink: 0, bgcolor: '#fff' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }}>
              <TextField
                size="small"
                placeholder="코드 · 이름 · 설명 · Layout 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                sx={{ flex: 1, minWidth: 220 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: query ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setQuery('')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />

              <Stack direction="row" alignItems="center" sx={{
                border: '1px solid #e2e8f0', borderRadius: 1.5,
                px: 1, py: 0.3, bgcolor: '#f8fafc',
              }}>
                <Switch size="small" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
                <Typography variant="body2" sx={{ pl: 0.3, pr: 0.5, color: '#475569', fontWeight: 500 }}>
                  활성만
                </Typography>
              </Stack>

              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, v) => v && setViewMode(v)}
                size="small"
                sx={{ '& .MuiToggleButton-root': { px: 1.2, py: 0.5 } }}
              >
                <ToggleButton value="gallery">
                  <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>갤러리</Typography>
                </ToggleButton>
                <ToggleButton value="list">
                  <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>리스트</Typography>
                </ToggleButton>
              </ToggleButtonGroup>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.3 }} />

              {hasFilter && (
                <Button size="small" variant="text" startIcon={<ClearIcon fontSize="small" />} onClick={clearAllFilters}>
                  필터 초기화
                </Button>
              )}
              <Tooltip title="새로고침">
                <span>
                  <IconButton onClick={reload} disabled={loading} size="small">
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAdd}
                      sx={{ fontWeight: 600 }}>
                신규 패턴
              </Button>
            </Stack>
          </Paper>

          {/* ===== Body ===== */}
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            {loading && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <CircularProgress size={32} />
              </Box>
            )}
            {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

            {!loading && !error && filtered.length === 0 && (
              <Paper elevation={0} sx={{ p: 6, textAlign: 'center', bgcolor: '#fff', borderRadius: 2 }}>
                <InventoryIcon sx={{ fontSize: 52, color: '#cbd5e1' }} />
                <Typography variant="body1" sx={{ mt: 1, color: '#64748b' }}>
                  조건에 해당하는 패턴이 없습니다.
                </Typography>
                {hasFilter && (
                  <Button size="small" sx={{ mt: 1 }} onClick={clearAllFilters}>
                    필터 초기화
                  </Button>
                )}
              </Paper>
            )}

            {/* ----- Gallery view ----- */}
            {!loading && !error && filtered.length > 0 && viewMode === 'gallery' && (
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: 1.2,
              }}>
                {filtered.map((p) => {
                  const meta = CATEGORY_LABELS[p.category] || { label: p.category || '-', color: '#888' };
                  const active = p.useYn === 'Y';
                  return (
                    <Paper key={p.id} elevation={0}
                      sx={{
                        borderRadius: 2, overflow: 'hidden',
                        border: `1px solid ${active ? '#e2e8f0' : '#e5e7eb'}`,
                        bgcolor: '#fff',
                        opacity: active ? 1 : 0.7,
                        transition: 'all 0.2s ease',
                        display: 'flex', flexDirection: 'column',
                        '&:hover': {
                          boxShadow: '0 6px 20px rgba(15,23,42,0.08)',
                          transform: 'translateY(-2px)',
                          borderColor: meta.color,
                        },
                      }}>
                      {/* Preview area (hover -> 75% tooltip) */}
                      <Tooltip
                        title={renderPreviewTooltipContent(p, meta)}
                        {...previewTooltipProps}
                      >
                        <Box sx={{
                          p: 0.8,
                          bgcolor: '#f1f5f9',
                          borderBottom: `2px solid ${meta.color}`,
                          minHeight: 150,
                          cursor: 'zoom-in',
                          transition: 'background-color 0.18s ease',
                          '&:hover': { bgcolor: '#e2e8f0' },
                        }}>
                          <PatternPreview layout={p.layout} />
                        </Box>
                      </Tooltip>

                      {/* Meta */}
                      <Box sx={{ p: 1.2, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Stack direction="row" alignItems="center" spacing={0.6}>
                          <Chip label={p.code} size="small" sx={{
                            height: 20, fontSize: 10, fontFamily: 'monospace',
                            fontWeight: 700, bgcolor: '#0f172a', color: '#fff',
                          }} />
                          <Chip label={meta.label} size="small" sx={{
                            height: 20, fontSize: 10, fontWeight: 500,
                            bgcolor: `${meta.color}22`, color: meta.color,
                          }} />
                          <Box sx={{ flex: 1 }} />
                          <Rating value={p.frequency ?? 1} readOnly max={3} size="small"
                                  sx={{ fontSize: 12 }} />
                        </Stack>

                        <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3, color: '#0f172a' }}
                                    title={p.name}>
                          {p.name}
                        </Typography>

                        {p.description && (
                          <Typography variant="caption" sx={{
                            color: '#64748b',
                            display: '-webkit-box',
                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                            overflow: 'hidden', lineHeight: 1.4,
                          }}>
                            {p.description}
                          </Typography>
                        )}

                        <Typography variant="caption" sx={{
                          fontFamily: 'monospace', color: '#94a3b8', fontSize: 10,
                        }} noWrap title={p.layout}>
                          {p.layout}
                        </Typography>

                        <Box sx={{ flex: 1 }} />
                        <Divider sx={{ my: 0.4 }} />
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center">
                            <Switch size="small" checked={active} onChange={() => handleToggle(p)} />
                            <Typography variant="caption" sx={{
                              color: active ? 'success.main' : 'text.disabled', fontWeight: 600,
                            }}>
                              {active ? '활성' : '비활성'}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.3}>
                            <Tooltip title="편집">
                              <IconButton size="small" onClick={() => handleEdit(p)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="삭제">
                              <IconButton size="small" color="error" onClick={() => handleDelete(p)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            )}

            {/* ----- List view ----- */}
            {!loading && !error && filtered.length > 0 && viewMode === 'list' && (
              <TableContainer component={Paper} elevation={0}
                              sx={{ borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700 } }}>
                      <TableCell sx={{ width: 240 }}>미리보기</TableCell>
                      <TableCell sx={{ width: 90 }}>코드</TableCell>
                      <TableCell sx={{ width: 140 }}>카테고리</TableCell>
                      <TableCell>이름 · 설명</TableCell>
                      <TableCell sx={{ width: 170 }}>Layout</TableCell>
                      <TableCell sx={{ width: 80 }} align="center">빈도</TableCell>
                      <TableCell sx={{ width: 60 }} align="center">순서</TableCell>
                      <TableCell sx={{ width: 80 }} align="center">활성</TableCell>
                      <TableCell sx={{ width: 90 }} align="center">액션</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((p) => {
                      const meta = CATEGORY_LABELS[p.category] || { label: p.category || '-', color: '#888' };
                      return (
                        <TableRow key={p.id} hover
                          sx={{ opacity: p.useYn === 'Y' ? 1 : 0.6 }}>
                          <TableCell sx={{ py: 0.6 }}>
                            <Tooltip
                              title={renderPreviewTooltipContent(p, meta)}
                              {...previewTooltipProps}
                            >
                              <Box sx={{
                                width: 220, p: 0.4,
                                bgcolor: '#f1f5f9',
                                border: `1px solid ${meta.color}55`,
                                borderRadius: 1,
                                cursor: 'zoom-in',
                                transition: 'all 0.18s ease',
                                '&:hover': {
                                  borderColor: meta.color,
                                  boxShadow: `0 0 0 3px ${meta.color}22`,
                                },
                              }}>
                                <PatternPreview layout={p.layout} />
                              </Box>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Chip label={p.code} size="small" sx={{
                              fontFamily: 'monospace', fontWeight: 700,
                              bgcolor: '#0f172a', color: '#fff',
                            }} />
                          </TableCell>
                          <TableCell>
                            <Chip label={meta.label} size="small" sx={{
                              height: 20, fontSize: 10, fontWeight: 500,
                              bgcolor: `${meta.color}22`, color: meta.color,
                            }} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }} noWrap>
                              {p.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748b' }}>
                              {p.layout}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Rating value={p.frequency ?? 1} readOnly max={3} size="small" sx={{ fontSize: 14 }} />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{p.sortOrder ?? 0}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Switch size="small" checked={p.useYn === 'Y'} onChange={() => handleToggle(p)} />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="편집">
                              <IconButton size="small" onClick={() => handleEdit(p)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="삭제">
                              <IconButton size="small" color="error" onClick={() => handleDelete(p)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Box>

        <PatternFormDialog
          open={dialogOpen}
          pattern={editTarget}
          onClose={() => setDialogOpen(false)}
          onSaved={handleSaved}
        />
      </WorkArea>
    </ContentInner>
  );
}

export default T3ComposerPatterns;

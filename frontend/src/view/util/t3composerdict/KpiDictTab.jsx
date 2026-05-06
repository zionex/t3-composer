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
  Divider,
  Avatar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import BusinessIcon from '@mui/icons-material/Business';
import ScheduleIcon from '@mui/icons-material/Schedule';
import FlagIcon from '@mui/icons-material/Flag';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import StarIcon from '@mui/icons-material/Star';
import FunctionsIcon from '@mui/icons-material/Functions';
import ArticleIcon from '@mui/icons-material/Article';

import { Chart as ChartJS, registerables } from 'chart.js';
import { Chart as ChartComp } from 'react-chartjs-2';

import { listKpis, deleteKpi } from './api';

ChartJS.register(...registerables);

const CAT_THEME = {
  // --- 일반 S&OP 카테고리 ---
  SALES:  { label: '영업/수요',     short: '영업', color: '#4d9fff', icon: '💼' },
  PROD:   { label: '생산/운영',     short: '생산', color: '#00d68f', icon: '🏭' },
  INV:    { label: '재고/자재',     short: '재고', color: '#ffb347', icon: '📦' },
  PUR:    { label: '구매/조달',     short: '구매', color: '#9d72ff', icon: '🛒' },
  FIN:    { label: '전사/재무',     short: '재무', color: '#ff4d6d', icon: '💰' },
  // --- T3Series SCM 모듈별 ---
  BF:     { label: 'BF. 기준 예측',   short: 'BF',  color: '#8b5cf6', icon: '🔮' },
  DP:     { label: 'DP. 수요 계획',   short: 'DP',  color: '#3b82f6', icon: '📊' },
  MP:     { label: 'MP. 주생산 계획', short: 'MP',  color: '#06b6d4', icon: '⚙️' },
  FP:     { label: 'FP. 공장 계획',    short: 'FP',  color: '#10b981', icon: '🏗️' },
  IM_SCM: { label: 'IM. 재고 관리',    short: 'IM',  color: '#f59e0b', icon: '📋' },
  RP:     { label: 'RP. 보충/발주',    short: 'RP',  color: '#ff8c42', icon: '🔄' },
  SA_SCM: { label: 'SA. 판매 분석',    short: 'SA',  color: '#00c9a7', icon: '📈' },
};

function parseJson(s) {
  try { return s ? JSON.parse(s) : null; } catch { return null; }
}

// 차트 데이터 정규화 + 적절한 차트 옵션 생성
function buildChartConfig(type, data, label, color, unit) {
  if (!type || !data) return null;
  const arr = parseJson(data) || [];
  const labelArr = parseJson(label);

  let chartType = type;
  let labels = ['1월', '2월', '3월', '4월', '5월', '6월'];
  let datasets = [];

  const mixPalette = [color, '#10b98188', '#f59e0b88', '#ef444488', '#8b5cf688', '#06b6d488'];

  if (type === 'bar_stack') {
    chartType = 'bar';
    labels = Array.isArray(labelArr) ? labelArr : arr.map((_, i) => `항목${i + 1}`);
    datasets = [{
      data: arr,
      backgroundColor: mixPalette.slice(0, arr.length),
      borderRadius: 6,
      borderWidth: 0,
    }];
    return {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 } } },
        },
        plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(0,0,0,0.85)' } },
      }
    };
  }

  if (type === 'bar_comp') {
    chartType = 'bar';
    labels = Array.isArray(labelArr) ? labelArr : ['실적', '목표'];
    datasets = [{
      data: arr,
      backgroundColor: [color, '#cbd5e1'],
      borderRadius: 8,
      borderWidth: 0,
      barThickness: 30,
    }];
    return {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 } } },
          y: { grid: { display: false }, ticks: { font: { size: 11, weight: 600 } } },
        },
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: 'rgba(0,0,0,0.85)', callbacks: { label: (ctx) => `${ctx.parsed.x}${unit || ''}` } },
        },
      }
    };
  }

  if (type === 'polar') chartType = 'polarArea';

  if (['pie', 'doughnut', 'polarArea'].includes(chartType)) {
    labels = Array.isArray(labelArr) ? labelArr : arr.map((_, i) => `항목${i + 1}`);
    datasets = [{
      data: arr,
      backgroundColor: mixPalette.slice(0, arr.length).map(c => c.length === 9 ? c.slice(0,7) : c),
      borderWidth: 2,
      borderColor: '#fff',
      hoverOffset: 8,
    }];
    return {
      type: chartType,
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: chartType === 'doughnut' ? '65%' : undefined,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 10 }, padding: 8, usePointStyle: true } },
          tooltip: { backgroundColor: 'rgba(0,0,0,0.85)' },
        },
      }
    };
  }

  if (chartType === 'radar') {
    labels = Array.isArray(labelArr) ? labelArr : arr.map((_, i) => `지표${i + 1}`);
    datasets = [{
      data: arr,
      label: '값',
      borderColor: color,
      backgroundColor: `${color}33`,
      borderWidth: 2,
      pointBackgroundColor: color,
      pointRadius: 4,
    }];
    return {
      type: 'radar',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          r: { suggestedMin: 0, suggestedMax: 100, ticks: { display: false }, pointLabels: { font: { size: 10 } } },
        },
        plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(0,0,0,0.85)' } },
      }
    };
  }

  // line / bar (기본)
  const isLine = chartType === 'line';
  datasets = [{
    data: arr,
    label: label || '값',
    borderColor: color,
    backgroundColor: isLine ? `${color}22` : color,
    fill: isLine,
    tension: 0.35,
    pointBackgroundColor: color,
    pointRadius: isLine ? 4 : 0,
    pointHoverRadius: 6,
    borderWidth: isLine ? 3 : 0,
    borderRadius: isLine ? 0 : 6,
  }];

  return {
    type: chartType,
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 } } },
      },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: 'rgba(0,0,0,0.85)', callbacks: { label: (ctx) => `${ctx.parsed.y}${unit || ''}` } },
      },
    }
  };
}

function KpiChart({ type, data, label, color, unit }) {
  const cfg = buildChartConfig(type, data, label, color, unit);
  if (!cfg) return <Box sx={{ color: 'text.disabled', textAlign: 'center', py: 3, fontSize: 12 }}>-</Box>;
  return (
    <Box sx={{ flex: 1, minHeight: 160, position: 'relative' }}>
      <ChartComp {...cfg} />
    </Box>
  );
}

// 최신 값·목표·트렌드 추출
function deriveQuickInfo(kpi) {
  const arr1 = parseJson(kpi.chart1Data) || [];
  const arr2 = parseJson(kpi.chart2Data) || [];
  const latest = arr1.length ? arr1[arr1.length - 1] : null;
  const prev   = arr1.length > 1 ? arr1[arr1.length - 2] : null;
  const first  = arr1.length ? arr1[0] : null;

  let trendDir = 'flat';
  if (latest != null && prev != null) {
    if (Math.abs(latest - prev) < 1e-6) trendDir = 'flat';
    else trendDir = latest > prev ? 'up' : 'down';
  }

  // bar_comp 의 경우 첫 값 = 실적, 둘째 = 목표
  const target = (kpi.chart2Type === 'bar_comp' && arr2.length >= 2) ? arr2[1] : null;
  const actual = (kpi.chart2Type === 'bar_comp' && arr2.length >= 1) ? arr2[0] : latest;

  let status = null;
  if (target != null && actual != null) {
    const isReverse = kpi.isReverseGap === 'Y';
    const ok = isReverse ? actual <= target : actual >= target;
    status = ok ? 'good' : 'bad';
  }

  // Change vs first
  let delta = null;
  if (latest != null && first != null && first !== 0) {
    delta = ((latest - first) / Math.abs(first)) * 100;
  }

  return { latest, prev, first, trendDir, target, actual, status, delta };
}

const fmtNum = (v, unit) => {
  if (v == null) return '-';
  if (typeof v === 'number') {
    if (Math.abs(v) >= 1000) return `${v.toLocaleString()}${unit || ''}`;
    return `${v}${unit || ''}`;
  }
  return String(v);
};

function KpiDictTab() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [catFilter, setCat]     = useState('ALL');
  const [query, setQuery]       = useState('');
  const [selected, setSelected] = useState(null);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await listKpis(false);
      const list = Array.isArray(res.data) ? res.data : [];
      setItems(list);
      if (list.length > 0 && !selected) setSelected(list[0]);
    } finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => items.filter(p => {
    if (catFilter !== 'ALL' && p.categoryCd !== catFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      const hay = `${p.code} ${p.name} ${p.nameEn || ''} ${p.description || ''} ${p.department || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [items, catFilter, query]);

  // 카테고리별 카운트
  const catCounts = useMemo(() => {
    const m = { ALL: items.length };
    items.forEach(i => {
      const c = i.categoryCd || 'etc';
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
    if (!window.confirm('해당 KPI 를 삭제하시겠습니까?')) return;
    await deleteKpi(id);
    if (selected?.id === id) setSelected(null);
    reload();
  };

  const theme = selected ? (CAT_THEME[selected.categoryCd] || { color: '#64748b', icon: '📊', label: '-' }) : null;
  const qi    = selected ? deriveQuickInfo(selected) : null;

  return (
    <Box sx={{ display: 'flex', flex: 1, minHeight: 0, gap: 1.5, bgcolor: '#f5f7fb', p: 1, borderRadius: 1 }}>

      {/* ============ LEFT: Category Sidebar + KPI List ============ */}
      <Paper variant="outlined" sx={{
        width: 300, display: 'flex', flexDirection: 'column', minHeight: 0,
        borderRadius: 2, borderColor: 'rgba(0,0,0,0.06)', bgcolor: '#fff',
      }}>
        {/* Header */}
        <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider',
                   background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                   color: '#fff', borderRadius: '8px 8px 0 0' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <AutoGraphIcon />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>KPI 갤러리</Typography>
            <Chip label={`${filtered.length}/${items.length}`} size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: '#fff',
                        height: 20, fontSize: 10, fontWeight: 700 }} />
            <IconButton size="small" onClick={reload} disabled={loading}
                        sx={{ ml: 'auto !important', color: '#fff' }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Stack>
          <TextField size="small" placeholder="지표·부서·설명 검색"
                     value={query} onChange={(e) => setQuery(e.target.value)}
                     sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.95)', borderRadius: 1,
                           '& .MuiOutlinedInput-notchedOutline': { border: 0 } }}
                     fullWidth
                     InputProps={{
                       startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                     }} />
        </Box>

        {/* Category Pills */}
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: '#fafbff' }}>
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {catList.map(c => {
              const t = c === 'ALL'
                ? { label: '전체', short: 'ALL', color: '#64748b', icon: '🌐' }
                : CAT_THEME[c];
              const active = catFilter === c;
              return (
                <Box key={c}
                     onClick={() => setCat(c)}
                     sx={{
                       cursor: 'pointer',
                       px: 0.8, py: 0.3, borderRadius: 1.5,
                       display: 'flex', alignItems: 'center', gap: 0.3,
                       fontSize: 11, fontWeight: 700,
                       bgcolor: active ? t.color : `${t.color}15`,
                       color: active ? '#fff' : t.color,
                       border: `1px solid ${active ? t.color : `${t.color}44`}`,
                       transition: 'all 0.15s',
                       '&:hover': { bgcolor: active ? t.color : `${t.color}25` },
                     }}>
                  <Box sx={{ fontSize: 12 }}>{t.icon}</Box>
                  <span>{t.short}</span>
                  <Box sx={{ fontSize: 9, opacity: 0.8,
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

        {/* KPI List */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {loading && <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={24} /></Box>}
          {!loading && filtered.map((it) => {
            const t = CAT_THEME[it.categoryCd] || { color: '#64748b', icon: '📊' };
            const isSel = selected?.id === it.id;
            const qi2 = deriveQuickInfo(it);
            const trendColor = qi2.trendDir === 'up' ? '#10b981'
                             : qi2.trendDir === 'down' ? '#ef4444' : '#94a3b8';
            const trendIcon  = qi2.trendDir === 'up' ? '▲'
                             : qi2.trendDir === 'down' ? '▼' : '→';
            return (
              <Box key={it.id}
                   onClick={() => setSelected(it)}
                   sx={{
                     position: 'relative',
                     px: 1.2, py: 1,
                     borderBottom: '1px solid rgba(0,0,0,0.05)',
                     cursor: 'pointer',
                     bgcolor: isSel ? `${t.color}12` : 'transparent',
                     borderLeft: 3,
                     borderLeftColor: isSel ? t.color : 'transparent',
                     transition: 'all 0.12s',
                     '&:hover': { bgcolor: isSel ? `${t.color}18` : 'rgba(0,0,0,0.02)' },
                   }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar sx={{ bgcolor: `${t.color}22`, color: t.color, width: 28, height: 28, fontSize: 14 }}>
                    {t.icon}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: t.color }}>
                        {it.code}
                      </Typography>
                      {it.isMain === 'Y' && (
                        <StarIcon sx={{ fontSize: 12, color: '#f59e0b' }} />
                      )}
                    </Stack>
                    <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3,
                                                      overflow: 'hidden', textOverflow: 'ellipsis',
                                                      whiteSpace: 'nowrap' }}>
                      {it.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10 }}>
                      {it.department} · {it.frequency}
                    </Typography>
                  </Box>
                  {qi2.latest != null && (
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Box sx={{ fontSize: 13, fontWeight: 800, fontFamily: 'monospace', color: '#1e293b' }}>
                        {fmtNum(qi2.latest, '')}
                      </Box>
                      <Box sx={{ fontSize: 9, color: trendColor, fontWeight: 700 }}>
                        {trendIcon} {qi2.delta != null ? `${qi2.delta.toFixed(1)}%` : '-'}
                      </Box>
                    </Box>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* ============ RIGHT: KPI Detail Panel ============ */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

        {!selected && (
          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', alignItems: 'center',
                                           justifyContent: 'center', color: 'text.secondary',
                                           borderRadius: 2, borderColor: 'rgba(0,0,0,0.06)' }}>
            ← 좌측에서 KPI 를 선택하세요
          </Paper>
        )}

        {selected && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, gap: 1.2 }}>

            {/* HERO HEADER — Category gradient */}
            <Paper elevation={0} sx={{
              p: 2.5, borderRadius: 2, flexShrink: 0,
              background: `linear-gradient(135deg, ${theme.color} 0%, ${theme.color}dd 60%, ${theme.color}aa 100%)`,
              color: '#fff', position: 'relative', overflow: 'hidden',
            }}>
              {/* Decorative circles */}
              <Box sx={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160,
                         borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
              <Box sx={{ position: 'absolute', top: 40, right: 80, width: 80, height: 80,
                         borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />

              <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ position: 'relative' }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: '#fff',
                              width: 56, height: 56, fontSize: 28,
                              border: '2px solid rgba(255,255,255,0.35)' }}>
                  {theme.icon}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={0.7} alignItems="center" sx={{ mb: 0.5 }}>
                    <Chip label={selected.code} size="small"
                          sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: '#fff',
                                fontFamily: 'monospace', fontWeight: 800, height: 22 }} />
                    <Chip label={theme.label} size="small"
                          sx={{ bgcolor: 'rgba(0,0,0,0.2)', color: '#fff', height: 22, fontWeight: 700 }} />
                    {selected.isMain === 'Y' && (
                      <Chip icon={<StarIcon sx={{ fontSize: 14 }} />} label="Main KPI" size="small"
                            sx={{ bgcolor: '#fbbf24', color: '#78350f', height: 22, fontWeight: 800,
                                  '& .MuiChip-icon': { color: '#78350f' } }} />
                    )}
                  </Stack>
                  <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1, mb: 0.3,
                                                  textShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
                    {selected.name}
                  </Typography>
                  {selected.nameEn && (
                    <Typography variant="body2" sx={{ opacity: 0.85, fontStyle: 'italic' }}>
                      {selected.nameEn}
                    </Typography>
                  )}
                </Box>

                {/* Big current value */}
                {qi.latest != null && (
                  <Box sx={{ textAlign: 'right', flexShrink: 0,
                             bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)',
                             borderRadius: 2, p: 1.2, border: '1px solid rgba(255,255,255,0.25)', minWidth: 130 }}>
                    <Typography variant="caption" sx={{ opacity: 0.85, display: 'block', fontWeight: 600 }}>
                      최신값
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1, fontFamily: 'monospace',
                                                    textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      {typeof qi.latest === 'number' ? qi.latest.toLocaleString() : qi.latest}
                      <Box component="span" sx={{ fontSize: 14, opacity: 0.9, ml: 0.3 }}>
                        {selected.chart2Unit || ''}
                      </Box>
                    </Typography>
                    {qi.delta != null && (
                      <Stack direction="row" alignItems="center" spacing={0.3} justifyContent="flex-end" sx={{ mt: 0.3 }}>
                        {qi.trendDir === 'up'
                          ? <TrendingUpIcon sx={{ fontSize: 14 }} />
                          : qi.trendDir === 'down'
                          ? <TrendingDownIcon sx={{ fontSize: 14 }} />
                          : <TrendingFlatIcon sx={{ fontSize: 14 }} />
                        }
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {qi.delta > 0 ? '+' : ''}{qi.delta.toFixed(1)}%
                        </Typography>
                      </Stack>
                    )}
                  </Box>
                )}

                <Tooltip title="삭제">
                  <IconButton size="small" onClick={() => handleDelete(selected.id)}
                              sx={{ color: 'rgba(255,255,255,0.75)',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>

              {/* Meta chips */}
              <Stack direction="row" spacing={1} sx={{ mt: 1.5, position: 'relative' }}>
                <InfoChipLight icon={<BusinessIcon sx={{ fontSize: 13 }} />} label={selected.department || '-'} />
                <InfoChipLight icon={<ScheduleIcon sx={{ fontSize: 13 }} />} label={selected.frequency || '-'} />
                {selected.targetValue && (
                  <InfoChipLight icon={<FlagIcon sx={{ fontSize: 13 }} />} label={`목표: ${selected.targetValue}`} />
                )}
                {selected.isReverseGap === 'Y' && (
                  <InfoChipLight icon={<TrendingDownIcon sx={{ fontSize: 13 }} />} label="낮을수록 우수" />
                )}
              </Stack>
            </Paper>

            {/* Quick Stats Row */}
            <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0 }}>
              <StatCard
                label="최신값"
                value={qi.latest != null ? fmtNum(qi.latest, '') : '-'}
                sub={selected.chart2Unit || ''}
                color={theme.color}
                icon={theme.icon} />
              <StatCard
                label={qi.target != null ? '목표' : '기간 시작값'}
                value={qi.target != null ? fmtNum(qi.target, '') : fmtNum(qi.first, '')}
                sub={selected.chart2Unit || ''}
                color="#64748b"
                icon="🎯" />
              <StatCard
                label="기간 대비 변동"
                value={qi.delta != null ? `${qi.delta > 0 ? '+' : ''}${qi.delta.toFixed(1)}%` : '-'}
                color={qi.trendDir === 'up' ? '#10b981' : qi.trendDir === 'down' ? '#ef4444' : '#94a3b8'}
                icon={qi.trendDir === 'up' ? '📈' : qi.trendDir === 'down' ? '📉' : '➡️'} />
              <StatCard
                label="상태"
                value={qi.status === 'good' ? '✓ 달성' : qi.status === 'bad' ? '⚠ 미달' : '모니터링'}
                color={qi.status === 'good' ? '#10b981' : qi.status === 'bad' ? '#ef4444' : '#64748b'}
                icon="⚡" />
            </Stack>

            {/* Description Card */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flexShrink: 0,
                                             borderColor: 'rgba(0,0,0,0.06)' }}>
              <Stack direction="row" alignItems="center" spacing={0.7} sx={{ mb: 1 }}>
                <ArticleIcon sx={{ fontSize: 18, color: theme.color }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>KPI 개요 (Overview)</Typography>
              </Stack>
              <Typography variant="body2" sx={{ lineHeight: 1.75, color: 'text.secondary' }}>
                {selected.description}
              </Typography>
            </Paper>

            {/* Formula Card */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flexShrink: 0,
                                             borderColor: 'rgba(0,0,0,0.06)',
                                             background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
              <Stack direction="row" alignItems="center" spacing={0.7} sx={{ mb: 1 }}>
                <FunctionsIcon sx={{ fontSize: 18, color: theme.color }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#e2e8f0' }}>
                  산출 공식 (Formula)
                </Typography>
              </Stack>
              <Box sx={{
                fontFamily: 'IBM Plex Mono, Consolas, monospace',
                fontSize: 14, fontWeight: 500,
                color: theme.color, lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
              }}>
                {selected.formula}
              </Box>
            </Paper>

            {/* Two Charts — flex:1 to fill remaining space */}
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5}
                   sx={{ flex: 1, minHeight: 0 }}>
              <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 2,
                                               borderColor: 'rgba(0,0,0,0.06)',
                                               display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, flexShrink: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={0.7}>
                    <Box sx={{ width: 6, height: 18, borderRadius: 1, bgcolor: theme.color }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      📈 추이 ({selected.chart1Label || '시계열'})
                    </Typography>
                  </Stack>
                  <Chip label={selected.chart1Type?.toUpperCase()} size="small" variant="outlined"
                        sx={{ height: 18, fontSize: 9, fontFamily: 'monospace', borderColor: `${theme.color}55` }} />
                </Stack>
                <KpiChart
                  type={selected.chart1Type}
                  data={selected.chart1Data}
                  label={selected.chart1Label}
                  color={theme.color}
                  unit={selected.chart2Unit} />
              </Paper>

              <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 2,
                                               borderColor: 'rgba(0,0,0,0.06)',
                                               display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, flexShrink: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={0.7}>
                    <Box sx={{ width: 6, height: 18, borderRadius: 1, bgcolor: theme.color }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      🎯 구성/비교 ({selected.chart2Label ? '분해' : '구성'})
                    </Typography>
                  </Stack>
                  <Chip label={selected.chart2Type?.toUpperCase()} size="small" variant="outlined"
                        sx={{ height: 18, fontSize: 9, fontFamily: 'monospace', borderColor: `${theme.color}55` }} />
                </Stack>
                <KpiChart
                  type={selected.chart2Type}
                  data={selected.chart2Data}
                  label={selected.chart2Label}
                  color={theme.color}
                  unit={selected.chart2Unit} />
              </Paper>
            </Stack>
          </Box>
        )}
      </Box>
    </Box>
  );
}

/** Hero meta chip (반투명 흰색 배경) */
function InfoChipLight({ icon, label }) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.4}
           sx={{ px: 1, py: 0.3, borderRadius: 1,
                 bgcolor: 'rgba(255,255,255,0.18)',
                 border: '1px solid rgba(255,255,255,0.25)',
                 backdropFilter: 'blur(4px)',
                 color: '#fff', fontSize: 11, fontWeight: 600 }}>
      {icon}
      <span>{label}</span>
    </Stack>
  );
}

/** Stat summary card (대시보드 미니 KPI) — 가운데 정렬 */
function StatCard({ label, value, sub, color, icon }) {
  return (
    <Paper variant="outlined" sx={{ flex: 1, pt: 1.2, pb: 1.2, px: 1, borderRadius: 2,
                                     borderColor: 'rgba(0,0,0,0.06)',
                                     background: '#fff', position: 'relative', overflow: 'hidden',
                                     textAlign: 'center' }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', bgcolor: color }} />
      <Stack direction="row" alignItems="center" spacing={0.5}
             justifyContent="center" sx={{ mb: 0.4 }}>
        <Box sx={{ fontSize: 15, lineHeight: 1 }}>{icon}</Box>
        <Typography variant="caption" color="text.secondary"
                    sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.3 }}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="h5"
                  sx={{ fontWeight: 800, fontFamily: 'monospace', color,
                        lineHeight: 1.1, whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        textAlign: 'center' }}>
        {value}
        {sub && <Box component="span" sx={{ fontSize: 11, ml: 0.3, color: 'text.secondary' }}>{sub}</Box>}
      </Typography>
    </Paper>
  );
}

export default KpiDictTab;

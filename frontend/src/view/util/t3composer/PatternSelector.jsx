import React, { useEffect, useMemo, useState } from 'react';

import {
  Box,
  Card,
  CardActionArea,
  Typography,
  Stack,
  Chip,
  Rating,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';

import { listPatterns } from './api';
import { PATTERNS as FALLBACK_PATTERNS } from './constants';
import PatternPreview from './PatternPreview';

const CATEGORY_LABELS = {
  ALL:                 { label: '전체',                color: '#888' },
  // 본문 layer 1개 (FilterBar 제외) — 기본 화면. 2026-04-30 신설.
  LAYOUT_SINGLE:       { label: '01 미분할 (단일)',     color: '#0ea5e9' },
  // 상하 (수직) — 본문 N분할. FilterBar 는 layer 카운트에서 제외.
  LAYOUT_V2:           { label: '11 상하 2분할',       color: '#5281b3' },
  LAYOUT_V3:           { label: '12 상하 3분할',       color: '#3e6088' },
  LAYOUT_V4:           { label: '13 상하 4분할',       color: '#2a3d5c' },
  LAYOUT_V5:           { label: '14 상하 5+분할',      color: '#1a2438' },
  // 좌우 (수평) — 본문 N분할.
  LAYOUT_H2:           { label: '21 좌우 2분할',       color: '#2a9d8f' },
  LAYOUT_H3:           { label: '22 좌우 3분할',       color: '#1f7a70' },
  LAYOUT_H4:           { label: '23 좌우 4분할',       color: '#145850' },
  LAYOUT_H5:           { label: '24 좌우 5+분할',      color: '#0a3a34' },
  // 도메인 특화 — prefix 유지 (31/91/92/93/95).
  LAYOUT_MIXED:        { label: '31 혼합·격자·특수',  color: '#fa7d5b' },
  LAYOUT_CONTROLBOARD: { label: '91 ControlBoard',    color: '#8b5cf6' },
  LAYOUT_PLANEDIT:     { label: '92 PlanEdit',        color: '#00d68f' },
  LAYOUT_MONITORING:   { label: '93 Monitoring',      color: '#00e5ff' },
  LAYOUT_ROUTELAYOUT:  { label: '95 RouteLayout',     color: '#ffb347' },
};

// 라벨 앞 숫자 prefix 추출 → 정렬 기준
function categorySortKey(cat) {
  const label = CATEGORY_LABELS[cat]?.label || cat;
  const m = /^(\d+)/.exec(label);
  return m ? parseInt(m[1], 10) : 9999;
}

/**
 * 화면 구성 패턴 선택 — DB 기반 (TB_IS_COMPOSER_PATTERN).
 * API 실패 시 constants.js 폴백.
 *
 * props:
 *   value               선택된 패턴 code (예: 'P02')
 *   onChange(code)
 *   recommendedCodes    모듈별 추천 코드 배열
 */
function PatternSelector({ value, onChange, recommendedCodes = [] }) {
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading]   = useState(true);
  // 초기 카테고리 — 'ALL' (전체) 로 진입해 첫 화면이 빈 채로 보이는 일을 원천 차단.
  // (LAYOUT_SINGLE 은 향후 등록 예정이지만 현재 패턴이 0 개이며,
  //  자동 전환 로직 race-condition 우려를 피해 default 를 ALL 로 못박음)
  const [category, setCategory] = useState('ALL');
  const [query, setQuery]       = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listPatterns(true);
      const list = Array.isArray(res.data) ? res.data : [];
      const finalList = list.length === 0 ? mapFallback() : list;
      setPatterns(finalList);
      // 초기 카테고리에 패턴이 0 개면 첫 진입 시 빈 화면이 됨.
      // load 후 데이터 있는 카테고리 중 라벨 prefix 가 가장 작은 것으로 자동 전환.
      // 단 'ALL' 은 전체 보기 special case 라 자동 전환 안 함.
      const hasInCurrent = category === 'ALL'
        ? true
        : finalList.some((p) => (p.category || '').toUpperCase() === category);
      if (!hasInCurrent && finalList.length > 0) {
        const cats = Array.from(new Set(
          finalList.map((p) => (p.category || '').toUpperCase()).filter(Boolean)
        ));
        cats.sort((a, b) => {
          const ka = categorySortKey(a);
          const kb = categorySortKey(b);
          return ka === kb ? a.localeCompare(b) : ka - kb;
        });
        if (cats[0]) setCategory(cats[0]);
      }
    } catch {
      setPatterns(mapFallback());
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 + 검색 필터 + 추천 우선 정렬
  const filtered = useMemo(() => {
    let list = patterns;
    if (category !== 'ALL') {
      list = list.filter((p) => (p.category || '').toUpperCase() === category);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.nameEn || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.code || '').toLowerCase().includes(q) ||
          (p.layout || '').toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const ar = recommendedCodes.includes(a.code) ? 1 : 0;
      const br = recommendedCodes.includes(b.code) ? 1 : 0;
      if (ar !== br) return br - ar;
      if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      return (a.code || '').localeCompare(b.code || '');
    });
  }, [patterns, category, query, recommendedCodes]);

  // 사용 가능한 카테고리 — 라벨 prefix 숫자 기준 정렬
  const categories = useMemo(() => {
    const set = new Set();
    for (const p of patterns) if (p.category) set.add(p.category.toUpperCase());
    const sorted = Array.from(set).sort((a, b) => {
      const ka = categorySortKey(a);
      const kb = categorySortKey(b);
      return ka === kb ? a.localeCompare(b) : ka - kb;
    });
    return ['ALL', ...sorted];
  }, [patterns]);

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box>
      {/* 필터 바 */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems="stretch">
        <TextField
          size="small"
          placeholder="패턴 이름·설명·코드 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ minWidth: 260, flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <ToggleButtonGroup
          value={category}
          exclusive
          onChange={(_, v) => v && setCategory(v)}
          size="small"
          sx={{ flexWrap: 'wrap' }}
        >
          {categories.map((c) => {
            const label = CATEGORY_LABELS[c] || { label: c, color: '#888' };
            return (
              <ToggleButton key={c} value={c} sx={{ textTransform: 'none', fontSize: 12, px: 1.5 }}>
                {label.label}
              </ToggleButton>
            );
          })}
        </ToggleButtonGroup>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        총 {patterns.length}개 중 {filtered.length}개 표시
        {recommendedCodes.length > 0 && ` · 모듈 추천 ${recommendedCodes.length}개 상단 배치`}
      </Typography>

      {filtered.length === 0 && (
        <Alert severity="info">검색 결과가 없습니다. 필터를 조정하세요.</Alert>
      )}

      {/* 카드 그리드 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 2,
        }}
      >
        {filtered.map((p) => (
          <PatternCard
            key={p.code}
            pattern={p}
            selected={value === p.code}
            recommended={recommendedCodes.includes(p.code)}
            onSelect={() => onChange(p.code)}
          />
        ))}
      </Box>
    </Box>
  );
}

function PatternCard({ pattern, selected, recommended, onSelect }) {
  const catMeta = CATEGORY_LABELS[(pattern.category || '').toUpperCase()] || { label: '-', color: '#888' };
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        borderColor: selected ? 'primary.main' : 'rgba(0,0,0,0.1)',
        borderWidth: selected ? 2 : 1,
        bgcolor: selected ? 'rgba(40,135,215,0.03)' : 'white',
        position: 'relative',
        transition: 'all 0.15s',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 4px 12px -6px rgba(40,135,215,0.4)',
        },
      }}
    >
      {recommended && (
        <Chip
          icon={<StarIcon sx={{ fontSize: 12 }} />}
          label="추천"
          size="small"
          color="warning"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            height: 18,
            fontSize: 10,
            zIndex: 1,
          }}
        />
      )}
      <CardActionArea onClick={onSelect} sx={{ height: '100%', p: 1.8 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
          <Chip
            label={pattern.code}
            size="small"
            color="primary"
            sx={{ height: 20, fontSize: 11, fontWeight: 600 }}
          />
          <Chip
            label={catMeta.label}
            size="small"
            sx={{ height: 18, fontSize: 9, bgcolor: `${catMeta.color}22`, color: catMeta.color, fontWeight: 500 }}
          />
        </Stack>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, lineHeight: 1.2 }}>
          {pattern.name}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.4,
            mb: 1,
            minHeight: 32,
          }}
        >
          {pattern.description}
        </Typography>

        {/* HTML 미리보기 */}
        <Box sx={{ mb: 1 }}>
          <PatternPreview layout={pattern.layout} />
        </Box>

        <Stack direction="row" spacing={0.5} justifyContent="space-between" alignItems="center">
          <Rating
            value={pattern.frequency ?? 1}
            readOnly
            max={3}
            size="small"
            sx={{ fontSize: 12 }}
          />
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 9 }} noWrap>
            {(pattern.recommendedFor || '').split(',').slice(0, 2).join(' · ')}
          </Typography>
        </Stack>
      </CardActionArea>
    </Card>
  );
}

/**
 * 폴백 — API 응답이 없을 때 constants.js 의 배열로 표시.
 */
function mapFallback() {
  return FALLBACK_PATTERNS.map((p) => ({
    code: p.code,
    layout: p.layout,
    category: p.category || 'LAYOUT_V2',
    name: p.name,
    nameEn: p.nameEn,
    description: p.description,
    visual: p.visual,
    exampleFile: p.example,
    frequency: p.frequency,
    recommendedFor: (p.recommendedFor || []).join(','),
    sortOrder: 0,
    useYn: 'Y',
  }));
}

export default PatternSelector;

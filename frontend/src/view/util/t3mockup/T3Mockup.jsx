import React, { Suspense, useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box, Card, CardActionArea, CardContent, Typography, Chip, Stack, TextField, MenuItem,
  ToggleButton, ToggleButtonGroup, Grid, CircularProgress, Button, Tooltip,
  Collapse, IconButton, Table, TableHead, TableBody, TableRow, TableCell,
  InputAdornment,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SearchIcon from '@mui/icons-material/Search';

import { ContentInner } from '@wingui/common/imports';
import { MOCKUP_ENTRIES, CATEGORY_LABEL, PRODUCT_LINE_LABEL, MOCK_STATS } from './index';

// 카테고리 → hover 색상 (border 강조용)
function catColor(cat) {
  switch (cat) {
    case 'core':         return '#1976d2';
    case 'domain':       return '#9c27b0';
    case 'dashboard':    return '#0288d1';
    case 'controlboard': return '#ed6c02';
    case 'meta':         return '#64748b';
    default:             return '#94a3b8';
  }
}

/**
 * T3Mockup — 모든 패턴 목업의 인덱스 갤러리.
 *
 * - 카드 클릭 → 해당 패턴 목업 화면을 동일 ContentInner 안에서 lazy 로 렌더
 * - 좌상단 '← 목록' 버튼으로 인덱스 복귀
 *
 * Phase 5 의 T3UIGallery 가 추후 확장 (모듈 ↔ 패턴 cross 필터, markdown viewer 등).
 * 여기는 가벼운 인덱스만.
 */
export default function T3Mockup() {
  const [active, setActiveState] = useState(null); // 선택된 patternCode
  const [filter, setFilter] = useState({ productLine: 'ALL', category: 'ALL', layout: 'ALL', q: '' });
  const [view, setView] = useState('list');

  // 카드 클릭 — active 설정 + history entry push (브라우저 뒤로가기 지원)
  const openMockup = useCallback((code) => {
    if (!code) return;
    window.history.pushState({ t3MockupActive: code }, '', '');
    setActiveState(code);
  }, []);

  // ← 목록 버튼 — history.back() 호출하여 popstate 자연 발화
  const closeMockup = useCallback(() => {
    if (window.history.state && window.history.state.t3MockupActive) {
      window.history.back();
    } else {
      setActiveState(null);
    }
  }, []);

  // 브라우저 뒤로가기 popstate — active 가 있으면 목록으로 복귀 (Composer 의 다른 화면으로 빠지지 않게)
  useEffect(() => {
    const onPop = () => setActiveState(null);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const ActiveComp = useMemo(() => {
    if (!active) return null;
    const e = MOCKUP_ENTRIES.find((x) => x.patternCode === active);
    return e?.component || null;
  }, [active]);

  const filtered = useMemo(() => {
    return MOCKUP_ENTRIES.filter((e) => {
      if (filter.productLine !== 'ALL' && e.productLine !== filter.productLine) return false;
      if (filter.category !== 'ALL' && e.category !== filter.category) return false;
      if (filter.layout !== 'ALL'   && e.layoutCategory !== filter.layout) return false;
      if (filter.q) {
        const q = filter.q.toLowerCase();
        const hits =
          e.patternCode.toLowerCase().includes(q) ||
          e.patternLabel.toLowerCase().includes(q) ||
          (e.description || '').toLowerCase().includes(q) ||
          (e.menus || []).some((m) =>
            (m.menuId || '').toLowerCase().includes(q) ||
            (m.menuNm || '').toLowerCase().includes(q) ||
            (m.filePath || '').toLowerCase().includes(q)
          );
        if (!hits) return false;
      }
      return true;
    });
  }, [filter]);

  // 현재 productLine 에 속한 entries 기준으로 보조 통계 (category 카운트가 product 별로 표시되도록)
  const visibleCategoryCount = useMemo(() => {
    const scoped = filter.productLine === 'ALL'
      ? MOCKUP_ENTRIES
      : MOCKUP_ENTRIES.filter((e) => e.productLine === filter.productLine);
    return scoped.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + 1; return acc; }, {});
  }, [filter.productLine]);

  const layoutCategories = useMemo(() => [...new Set(MOCKUP_ENTRIES.map((e) => e.layoutCategory))].sort(), []);

  // 목업 컴포넌트 렌더 시 (active 있을 때) — 매핑된 운영 메뉴 목록 표시
  if (active && ActiveComp) {
    return (
      <ActiveView
        active={active}
        ActiveComp={ActiveComp}
        closeMockup={closeMockup}
      />
    );
  }

  // 인덱스 화면
  return (
    <ContentInner>
      {/* 헤더 */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.default' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>T3Mockup — UI 패턴 목업 갤러리</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          T3Series 의 {MOCK_STATS.totalMockups}개 UI 패턴 목업. Composer LLM 학습 + 디자인 시스템 문서화 + 신규 화면 참조용.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" rowGap={0.5}>
          {Object.entries(PRODUCT_LINE_LABEL).map(([k, v]) => {
            const count = MOCK_STATS.byProductLine[k] || 0;
            if (count === 0) return null;
            return (
              <Chip key={k} size="small" label={`${v}: ${count}`} color="primary" sx={{ fontWeight: 700 }} />
            );
          })}
          <Box sx={{ width: 8 }} />
          {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
            <Chip key={k} size="small" label={`${v}: ${MOCK_STATS.byCategory[k] || 0}`}
                  color={k === 'core' ? 'primary' : (k === 'domain' ? 'secondary' : 'default')}
                  variant="outlined" />
          ))}
        </Stack>
      </Box>

      {/* 필터바 */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        {/* L1 — Product Line (최상위) */}
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1, mb: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', minWidth: 80 }}>
            Product Line
          </Typography>
          <ToggleButtonGroup size="small" exclusive value={filter.productLine}
                              onChange={(_, v) => v && setFilter((f) => ({ ...f, productLine: v, category: 'ALL', layout: 'ALL' }))}>
            <ToggleButton value="ALL">전체 ({MOCKUP_ENTRIES.length})</ToggleButton>
            {Object.entries(PRODUCT_LINE_LABEL).map(([k, v]) => {
              const count = MOCK_STATS.byProductLine[k] || 0;
              return (
                <ToggleButton key={k} value={k} disabled={count === 0} sx={{ fontWeight: 600 }}>
                  {v} ({count})
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        </Stack>

        {/* L2 — Category + Layout + 검색 + View Mode */}
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', minWidth: 80 }}>
            Category
          </Typography>
          <ToggleButtonGroup size="small" exclusive value={filter.category}
                              onChange={(_, v) => v && setFilter((f) => ({ ...f, category: v }))}>
            <ToggleButton value="ALL">전체</ToggleButton>
            <ToggleButton value="core"         sx={{ color: 'primary.main' }}>정규 ({visibleCategoryCount.core || 0})</ToggleButton>
            <ToggleButton value="domain"       sx={{ color: 'secondary.main' }}>도메인 ({visibleCategoryCount.domain || 0})</ToggleButton>
            <ToggleButton value="dashboard"    sx={{ color: 'info.main' }}>Dashboard ({visibleCategoryCount.dashboard || 0})</ToggleButton>
            <ToggleButton value="controlboard" sx={{ color: 'warning.main' }}>ControlBoard ({visibleCategoryCount.controlboard || 0})</ToggleButton>
            <ToggleButton value="meta">메타 ({visibleCategoryCount.meta || 0})</ToggleButton>
          </ToggleButtonGroup>
          <TextField size="small" select label="Layout 카테고리" value={filter.layout}
                      onChange={(e) => setFilter((f) => ({ ...f, layout: e.target.value }))}
                      sx={{ width: 220 }}>
            <MenuItem value="ALL">전체</MenuItem>
            {layoutCategories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <TextField size="small" placeholder="검색 — 코드/라벨/설명/메뉴ID/메뉴명"
                      value={filter.q} onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
                      sx={{ width: 320 }} />
          <Box sx={{ flex: 1 }} />
          <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)}>
            <ToggleButton value="grid"><GridViewIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="list"><ViewListIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
          <Typography variant="caption" color="text.secondary">{filtered.length}개 표시</Typography>
        </Stack>
      </Box>

      {/* 카드 그리드 / 리스트 */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {view === 'grid' ? (
          <Grid container spacing={1.5}>
            {filtered.map((e) => {
              const accent = catColor(e.category);
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={e.patternCode}>
                  <Card variant="outlined" sx={{
                    height: '100%', display: 'flex', flexDirection: 'column',
                    transition: 'all .18s ease',
                    borderTop: `3px solid ${accent}`,
                    '&:hover': {
                      borderColor: accent,
                      boxShadow: `0 6px 20px ${accent}33`,
                      transform: 'translateY(-2px)',
                    },
                  }}>
                    <CardActionArea onClick={() => openMockup(e.patternCode)} sx={{ flex: 1 }}>
                      <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                          <Chip size="small" label={e.patternCode} sx={{ fontFamily: 'monospace', maxWidth: '60%', fontSize: 11 }} />
                          <Stack direction="row" spacing={0.5}>
                            {(e.menus?.length || 0) > 0 && (
                              <Tooltip title={`매핑된 운영 메뉴 ${e.menus.length}개`}>
                                <Chip size="small" label={`📋 ${e.menus.length}`} color="info" variant="outlined" />
                              </Tooltip>
                            )}
                            <Tooltip title={`Phase 1 에서 ${e.usage}개 화면이 이 패턴으로 분류됨`}>
                              <Chip size="small" label={`×${e.usage}`} variant="outlined" />
                            </Tooltip>
                          </Stack>
                        </Stack>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>{e.patternLabel}</Typography>
                        <Chip size="small" label={e.layoutCategory} variant="outlined"
                              color={e.category === 'core' ? 'primary' : (e.category === 'domain' ? 'secondary' : (e.category === 'dashboard' ? 'info' : (e.category === 'controlboard' ? 'warning' : 'default')))}
                              sx={{ mb: 1 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {e.description}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
            {filtered.length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ p: 4, textAlign: 'center', color: 'text.disabled' }}>조회된 목업이 없습니다.</Box>
              </Grid>
            )}
          </Grid>
        ) : (
          <Stack spacing={0.5}>
            {filtered.map((e) => {
              const accent = catColor(e.category);
              return (
                <Card key={e.patternCode} variant="outlined" sx={{
                  transition: 'all .15s ease',
                  borderLeft: `4px solid ${accent}`,
                  '&:hover': { borderColor: accent, boxShadow: `0 2px 8px ${accent}22` },
                }}>
                  <CardActionArea onClick={() => openMockup(e.patternCode)}>
                    <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Chip size="small" label={e.patternCode} sx={{ fontFamily: 'monospace', minWidth: 220, justifyContent: 'flex-start' }} />
                      <Typography sx={{ flex: 1, fontWeight: 600 }}>{e.patternLabel}</Typography>
                      <Chip size="small" label={e.layoutCategory} variant="outlined"
                            color={e.category === 'core' ? 'primary' : (e.category === 'domain' ? 'secondary' : (e.category === 'dashboard' ? 'info' : (e.category === 'controlboard' ? 'warning' : 'default')))} />
                      <Typography sx={{ width: 60, fontFamily: 'monospace', textAlign: 'right', color: 'text.secondary' }}>×{e.usage}</Typography>
                      {(e.menus?.length || 0) > 0 && (
                        <Tooltip title={`매핑된 운영 메뉴 ${e.menus.length}개`}>
                          <Chip size="small" label={`📋 ${e.menus.length}`} color="info" variant="outlined" sx={{ minWidth: 50 }} />
                        </Tooltip>
                      )}
                      <Typography sx={{ width: 300, fontSize: 12, color: 'text.secondary' }} noWrap>{e.description}</Typography>
                    </Box>
                  </CardActionArea>
                </Card>
              );
            })}
          </Stack>
        )}
      </Box>
    </ContentInner>
  );
}

// =====================================================================
// ActiveView — mockup 본문 + 매핑된 운영 메뉴 collapsible 목록
// =====================================================================
function ActiveView({ active, ActiveComp, closeMockup }) {
  const activeEntry = MOCKUP_ENTRIES.find((x) => x.patternCode === active);
  const mappedMenus = activeEntry?.menus || [];
  const [menusOpen, setMenusOpen] = useState(false);
  const [menuQuery, setMenuQuery] = useState('');

  const filteredMenus = useMemo(() => {
    if (!menuQuery.trim()) return mappedMenus;
    const q = menuQuery.toLowerCase();
    return mappedMenus.filter((m) =>
      (m.menuId   || '').toLowerCase().includes(q) ||
      (m.menuNm   || '').toLowerCase().includes(q) ||
      (m.filePath || '').toLowerCase().includes(q)
    );
  }, [mappedMenus, menuQuery]);

  return (
    <ContentInner>
      {/* 헤더 (상단 한 줄) */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.default' }}>
        <Stack direction="row" alignItems="center" sx={{ p: 0.75, gap: 1 }}>
          <Button size="small" startIcon={<ArrowBackIcon />} onClick={closeMockup}>
            전체 목업 목록으로
          </Button>
          <Chip size="small" label={activeEntry?.patternCode} sx={{ fontFamily: 'monospace' }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            {activeEntry?.patternLabel}
          </Typography>
          <Box sx={{ flex: 1 }} />
          {mappedMenus.length > 0 && (
            <Button
              size="small"
              startIcon={<ListAltIcon fontSize="small" />}
              endIcon={menusOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setMenusOpen((v) => !v)}
              color="info"
              variant={menusOpen ? 'contained' : 'outlined'}
              disableElevation
            >
              사용 메뉴 {mappedMenus.length}개
            </Button>
          )}
        </Stack>

        {/* Collapsible 메뉴 목록 */}
        {mappedMenus.length > 0 && (
          <Collapse in={menusOpen} timeout="auto">
            <Box sx={{ px: 1.5, pb: 1.5, pt: 0.5, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" sx={{ mb: 1, gap: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  이 mockup 으로 매핑된 T3SmartSCM 운영 메뉴 — 총 {mappedMenus.length}개
                  {menuQuery && ` · ${filteredMenus.length}개 일치`}
                </Typography>
                <Box sx={{ flex: 1 }} />
                <TextField
                  size="small"
                  placeholder="메뉴ID / 메뉴명 / 경로 검색"
                  value={menuQuery}
                  onChange={(e) => setMenuQuery(e.target.value)}
                  sx={{ width: 280, bgcolor: 'white' }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>
              <Box sx={{ maxHeight: 280, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'white' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, width: 50 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 220 }}>메뉴ID</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 240 }}>메뉴명</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>경로 (filePath)</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 220 }}>매핑 근거</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMenus.map((m, i) => (
                      <TableRow key={m.menuId} hover>
                        <TableCell sx={{ color: 'text.secondary' }}>{i + 1}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{m.menuId}</TableCell>
                        <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{m.menuNm || <em style={{ color: '#999' }}>(이름없음)</em>}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', color: 'text.secondary' }}>{m.filePath}</TableCell>
                        <TableCell sx={{ fontSize: 11, color: 'text.secondary' }}>{m.reason}</TableCell>
                      </TableRow>
                    ))}
                    {filteredMenus.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: 'center', color: 'text.disabled', py: 3 }}>
                          {menuQuery ? `"${menuQuery}" 와 일치하는 메뉴 없음` : '매핑된 메뉴 없음'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          </Collapse>
        )}
      </Box>

      {/* mockup 본문 */}
      <Suspense fallback={
        <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      }>
        <ActiveComp />
      </Suspense>
    </ContentInner>
  );
}

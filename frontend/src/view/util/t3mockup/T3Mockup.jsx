import React, { Suspense, useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Card, CardContent, Typography, Chip, Stack, TextField, MenuItem,
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
import MockupPressPreview from './MockupPressPreview';

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

// patternLabel 에 productLine prefix ("PlanNEL — ", "KTNG — " 등) 가 박혀 있는 경우 제거
// — entry 의 productLine code/display label 양쪽 모두 시도
function stripProductLinePrefix(label, productLine) {
  if (!label) return label;
  const code = productLine;
  const display = PRODUCT_LINE_LABEL[productLine];
  for (const p of [display, code]) {
    if (!p) continue;
    const sep = ` ${'—'} `;            // 정상 공백 — em-dash — 공백
    if (label.startsWith(p + sep)) return label.slice(p.length + sep.length);
    if (label.startsWith(p + '—')) return label.slice(p.length + 1).trim();
  }
  return label;
}

// productLine 별 chip 색 — 색상 단조롭게 통일 (border + 텍스트만 강조)
function productLineColor(pl) {
  switch (pl) {
    case 'T3SmartSCM': return '#1976d2';
    case 'PlaNEL':     return '#2a9d8f';
    case 'KTNG':       return '#8b5cf6';
    case 'ORON':       return '#ed6c02';
    case 'CJBO':       return '#ef4444';
    default:           return '#64748b';
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
  const { t } = useTranslation('composer');
  const [active, setActiveState] = useState(null); // 선택된 patternCode
  const [filter, setFilter] = useState({ productLine: 'ALL', category: 'ALL', layout: 'ALL', q: '' });
  const [view, setView] = useState('grid');

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
      {/* 헤더 — 제목 + 부제 (간결) */}
      <Box sx={{ px: 2, pt: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.default' }}>
        <Stack direction="row" alignItems="baseline" spacing={1.5} flexWrap="wrap" rowGap={0.5}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>SCM UI Mockup</Typography>
          <Typography variant="body2" color="text.secondary">{t('mockup.subtitle')}</Typography>
        </Stack>
      </Box>

      {/* 필터바 — 단일 줄 sticky (Product Line · Category · Layout · 검색 · view 모드 · 카운트) */}
      <Box sx={{
        px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider',
        backgroundColor: 'background.paper',
        position: 'sticky', top: 0, zIndex: 2,
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {/* 줄 1 — 프로젝트 구분 (Product Line) */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <ToggleButtonGroup size="small" exclusive value={filter.productLine}
                                onChange={(_, v) => v && setFilter((f) => ({ ...f, productLine: v, category: 'ALL', layout: 'ALL' }))}>
              <ToggleButton value="ALL" sx={{ px: 1.5 }}>{t('mockup.filter.all', { n: MOCKUP_ENTRIES.length })}</ToggleButton>
              {Object.entries(PRODUCT_LINE_LABEL).map(([k, v]) => {
                const count = MOCK_STATS.byProductLine[k] || 0;
                return (
                  <ToggleButton key={k} value={k} disabled={count === 0} sx={{ px: 1.5, fontWeight: 600 }}>
                    {v} {count}
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
          </Box>

          {/* 줄 2 — 타입 구분 (Category) + Layout + 검색 + view 모드 */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <ToggleButtonGroup size="small" exclusive value={filter.category}
                                onChange={(_, v) => v && setFilter((f) => ({ ...f, category: v }))}>
              <ToggleButton value="ALL" sx={{ px: 1.5 }}>{t('mockup.category.all')}</ToggleButton>
              <ToggleButton value="core"         sx={{ px: 1.5, color: 'primary.main' }}>{t('mockup.category.core', { n: visibleCategoryCount.core || 0 })}</ToggleButton>
              <ToggleButton value="domain"       sx={{ px: 1.5, color: 'secondary.main' }}>{t('mockup.category.domain', { n: visibleCategoryCount.domain || 0 })}</ToggleButton>
              <ToggleButton value="dashboard"    sx={{ px: 1.5, color: 'info.main' }}>{t('mockup.category.dashboard', { n: visibleCategoryCount.dashboard || 0 })}</ToggleButton>
              <ToggleButton value="controlboard" sx={{ px: 1.5, color: 'warning.main' }}>{t('mockup.category.controlboard', { n: visibleCategoryCount.controlboard || 0 })}</ToggleButton>
              <ToggleButton value="meta" sx={{ px: 1.5 }}>{t('mockup.category.meta', { n: visibleCategoryCount.meta || 0 })}</ToggleButton>
            </ToggleButtonGroup>

            <TextField size="small" select value={filter.layout}
                        onChange={(e) => setFilter((f) => ({ ...f, layout: e.target.value }))}
                        sx={{ width: 180, '& .MuiSelect-select': { py: 0.75 } }}>
              <MenuItem value="ALL">{t('mockup.layout.all')}</MenuItem>
              {layoutCategories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>

            <TextField size="small" placeholder={t('mockup.searchPlaceholder')}
                        value={filter.q} onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
                        sx={{ width: 260, '& .MuiInputBase-input': { py: 0.75 } }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }} />

            <Box sx={{ flex: 1 }} />

            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {t('mockup.countDisplay', { n: filtered.length })}
            </Typography>
            <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)}>
              <ToggleButton value="grid" sx={{ px: 1 }}><GridViewIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="list" sx={{ px: 1 }}><ViewListIcon fontSize="small" /></ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Box>

      {/* 카드 그리드 / 리스트 */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {view === 'grid' ? (
          <Grid container spacing={2}>
            {filtered.map((e) => {
              const accent = catColor(e.category);
              const menuCount = e.menus?.length || 0;
              const plColor = productLineColor(e.productLine);
              const plLabel = PRODUCT_LINE_LABEL[e.productLine] || e.productLine;
              const cleanLabel = stripProductLinePrefix(e.patternLabel, e.productLine);
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={e.patternCode}>
                  <Card variant="outlined" sx={{
                    height: '100%', display: 'flex', flexDirection: 'column',
                    transition: 'border-color .15s ease, box-shadow .15s ease',
                    borderTop: `3px solid ${accent}`,
                    '&:hover': {
                      borderColor: accent,
                      boxShadow: `0 2px 12px ${accent}22`,
                    },
                  }}>
                    <MockupPressPreview
                      entry={e}
                      onClick={() => openMockup(e.patternCode)}
                      sx={{ flex: 1, cursor: 'pointer', userSelect: 'none' }}
                    >
                      <CardContent sx={{ '&:last-child': { pb: 1.75 } }}>
                        {/* 1행 — productLine + patternCode + 매핑 메뉴 수 */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                            <Chip
                              size="small"
                              label={plLabel}
                              sx={{
                                height: 22, fontSize: 11, fontWeight: 700, flexShrink: 0,
                                color: plColor, borderColor: `${plColor}66`, bgcolor: `${plColor}10`,
                                border: '1px solid',
                              }}
                            />
                            <Chip size="small" label={e.patternCode}
                                  sx={{ fontFamily: 'monospace', fontSize: 11, height: 22, minWidth: 0,
                                        '& .MuiChip-label': { px: 0.75, overflow: 'hidden', textOverflow: 'ellipsis' } }} />
                          </Stack>
                          {menuCount > 0 && (
                            <Tooltip title={t('mockup.mappedMenusTooltip', { n: menuCount })}>
                              <Chip size="small" label={`📋 ${menuCount}`} variant="outlined"
                                    sx={{ height: 22, fontSize: 11, flexShrink: 0 }} />
                            </Tooltip>
                          )}
                        </Stack>

                        {/* 2행 — 라벨 (시인성 메인) */}
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75, lineHeight: 1.35 }}>
                          {cleanLabel}
                        </Typography>

                        {/* 3행 — meta 한 줄 (layoutCategory) */}
                        <Typography variant="caption" sx={{ display: 'block', color: accent, fontWeight: 600, mb: 0.5 }}>
                          {e.layoutCategory}
                        </Typography>

                        {/* 4행 — 설명 */}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {e.description}
                        </Typography>
                      </CardContent>
                    </MockupPressPreview>
                  </Card>
                </Grid>
              );
            })}
            {filtered.length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ p: 4, textAlign: 'center', color: 'text.disabled' }}>{t('mockup.empty')}</Box>
              </Grid>
            )}
          </Grid>
        ) : (
          <Stack spacing={0.75}>
            {filtered.map((e) => {
              const accent = catColor(e.category);
              const menuCount = e.menus?.length || 0;
              const plColor = productLineColor(e.productLine);
              const plLabel = PRODUCT_LINE_LABEL[e.productLine] || e.productLine;
              const cleanLabel = stripProductLinePrefix(e.patternLabel, e.productLine);
              return (
                <Card key={e.patternCode} variant="outlined" sx={{
                  transition: 'border-color .15s ease, box-shadow .15s ease',
                  borderLeft: `4px solid ${accent}`,
                  '&:hover': { borderColor: accent, boxShadow: `0 2px 8px ${accent}22` },
                }}>
                  <MockupPressPreview
                    entry={e}
                    onClick={() => openMockup(e.patternCode)}
                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    <Box sx={{ p: 1.25, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography sx={{ fontFamily: 'monospace', fontSize: 12, width: 240, color: 'text.secondary', flexShrink: 0 }} noWrap>
                        {e.patternCode}
                      </Typography>
                      <Chip
                        size="small"
                        label={plLabel}
                        sx={{
                          height: 22, fontSize: 11, fontWeight: 700, flexShrink: 0,
                          color: plColor, borderColor: `${plColor}66`, bgcolor: `${plColor}10`,
                          border: '1px solid',
                        }}
                      />
                      <Typography sx={{ flex: 1, fontWeight: 600, fontSize: 14 }} noWrap>
                        {cleanLabel}
                      </Typography>
                      <Typography sx={{ width: 140, fontSize: 11, color: accent, fontWeight: 600, textAlign: 'left', flexShrink: 0 }} noWrap>
                        {e.layoutCategory}
                      </Typography>
                      <Typography sx={{ width: 56, fontFamily: 'monospace', fontSize: 12, textAlign: 'right', color: menuCount > 0 ? 'text.primary' : 'text.disabled', flexShrink: 0 }}>
                        📋 {menuCount}
                      </Typography>
                      <Typography sx={{ flex: 1.5, fontSize: 12, color: 'text.secondary', minWidth: 0 }} noWrap>
                        {e.description}
                      </Typography>
                    </Box>
                  </MockupPressPreview>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center', color: 'text.disabled' }}>조회된 목업이 없습니다.</Box>
            )}
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
  const { t } = useTranslation('composer');
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
            {t('mockup.backToList')}
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
              {t('mockup.usedMenus', { n: mappedMenus.length })}
            </Button>
          )}
        </Stack>

        {/* Collapsible 메뉴 목록 */}
        {mappedMenus.length > 0 && (
          <Collapse in={menusOpen} timeout="auto">
            <Box sx={{ px: 1.5, pb: 1.5, pt: 0.5, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" sx={{ mb: 1, gap: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  {t('mockup.menuListSummary', { total: mappedMenus.length })}
                  {menuQuery && ` · ${t('mockup.menuListMatched', { n: filteredMenus.length })}`}
                </Typography>
                <Box sx={{ flex: 1 }} />
                <TextField
                  size="small"
                  placeholder={t('mockup.menuSearchPlaceholder')}
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
                      <TableCell sx={{ fontWeight: 700, width: 220 }}>{t('mockup.menuTable.id')}</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 240 }}>{t('mockup.menuTable.name')}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t('mockup.menuTable.path')}</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 220 }}>{t('mockup.menuTable.reason')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMenus.map((m, i) => (
                      <TableRow key={m.menuId} hover>
                        <TableCell sx={{ color: 'text.secondary' }}>{i + 1}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{m.menuId}</TableCell>
                        <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{m.menuNm || <em style={{ color: '#999' }}>{t('mockup.menuTable.noName')}</em>}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', color: 'text.secondary' }}>{m.filePath}</TableCell>
                        <TableCell sx={{ fontSize: 11, color: 'text.secondary' }}>{m.reason}</TableCell>
                      </TableRow>
                    ))}
                    {filteredMenus.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: 'center', color: 'text.disabled', py: 3 }}>
                          {menuQuery ? t('mockup.menuTable.noMatch', { query: menuQuery }) : t('mockup.menuTable.noMapped')}
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

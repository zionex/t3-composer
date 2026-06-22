import React, { useMemo, useState, useEffect, useRef, Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, IconButton, Box, Typography, Stack, Chip,
  TextField, InputAdornment, CircularProgress,
} from '@mui/material';
import CloseIcon  from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';

import { MOCKUP_ENTRIES, CATEGORY_LABEL, PRODUCT_LINE_LABEL } from '../t3mockup';

// 미리보기 — 목업 컴포넌트를 가상 화면(1400×900)에 그린 뒤 축소해 전체 레이아웃을 한눈에 노출.
// DialogContent 높이(560)에 맞춰 세로가 잘리지 않도록 scale 산정 (900 × 0.62 ≈ 558).
const PREVIEW_W = 1400;
const PREVIEW_H = 900;
const PREVIEW_SCALE = 0.62;

/**
 * 자연어(NEW_NL) 모드에서 사용자가 선택적으로 SCM UI Mockup 을 고르는 POPUP.
 *
 * - 메뉴 [SCM UI Mockup] 에서 관리되는 MOCKUP_ENTRIES 를 그대로 재사용.
 * - 좌측 목록에서 항목을 고르면 우측에 실제 mockup 화면 미리보기가 렌더됨.
 * - 선택은 선택사항. 고른 mockup 의 레이아웃 골격 메타가 Claude systemContext 에 첨부됨.
 *
 * props:
 *   open                boolean
 *   onClose()           취소 (변경 없음)
 *   currentValue        이미 선택된 mockup patternCode 또는 null
 *   onConfirm(entry)    entry = MOCKUP_ENTRIES 항목 또는 null (해제)
 */
function MockupPickerDialog({ open, onClose, currentValue, onConfirm }) {
  const { t } = useTranslation('composer');
  const [selected, setSelected]                 = useState(currentValue || null);
  const [query, setQuery]                       = useState('');
  const [productLineFilter, setProductLineFilter] = useState('ALL');
  const [catFilter, setCatFilter]               = useState('ALL');

  useEffect(() => {
    if (open) {
      setSelected(currentValue || null);
      setQuery('');
      setProductLineFilter('ALL');
      setCatFilter('ALL');
    }
  }, [open, currentValue]);

  // Product Line 별 mockup 개수 (라벨 옆 카운트 표시용)
  const productLineCounts = useMemo(() => {
    const m = new Map();
    for (const e of MOCKUP_ENTRIES) m.set(e.productLine, (m.get(e.productLine) || 0) + 1);
    return m;
  }, []);
  const productLines = useMemo(() => Array.from(productLineCounts.keys()), [productLineCounts]);

  // 카테고리 chip 은 *현재 Product Line 필터 적용 결과* 안에서 등장하는 것만 노출
  // → KTNG 만 보고있을 때 dashboard 카테고리가 비어있어도 의미없는 chip 안 뜸
  const categories = useMemo(() => {
    const out = [];
    const pool = productLineFilter === 'ALL'
      ? MOCKUP_ENTRIES
      : MOCKUP_ENTRIES.filter((e) => e.productLine === productLineFilter);
    for (const e of pool) if (!out.includes(e.category)) out.push(e.category);
    return out;
  }, [productLineFilter]);

  // catFilter 가 현재 Product Line 에 없으면 ALL 로 리셋
  useEffect(() => {
    if (catFilter !== 'ALL' && !categories.includes(catFilter)) {
      setCatFilter('ALL');
    }
  }, [categories, catFilter]);

  const filtered = useMemo(() => {
    let arr = MOCKUP_ENTRIES;
    if (productLineFilter !== 'ALL') arr = arr.filter((e) => e.productLine === productLineFilter);
    if (catFilter !== 'ALL') arr = arr.filter((e) => e.category === catFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter((e) =>
        `${e.patternCode} ${e.patternLabel} ${e.description || ''} ${e.layoutCategory}`
          .toLowerCase().includes(q));
    }
    return arr;
  }, [query, productLineFilter, catFilter]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const e of filtered) {
      if (!map.has(e.category)) map.set(e.category, []);
      map.get(e.category).push(e);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const selectedEntry = useMemo(
    () => MOCKUP_ENTRIES.find((e) => e.patternCode === selected) || null,
    [selected],
  );
  const PreviewComp = selectedEntry?.component || null;

  // 우측 미리보기 — 패널 실제 폭을 측정해 mockup(1400px)을 꽉 차게 scale.
  //   고정 배율(0.62)이면 패널보다 좁아 우측에 검은 여백이 생김 → 동적 배율로 제거.
  // ResizeObserver loop 차단 (Mockup3DGallery 와 동일 패턴):
  //   Math.round + requestAnimationFrame + 같은 값 skip
  const previewPaneRef = useRef(null);
  const [paneW, setPaneW] = useState(0);
  useEffect(() => {
    const el = previewPaneRef.current;
    if (!open || !el) return undefined;
    let rafId = null;
    const upd = () => {
      const w = Math.round(el.clientWidth);
      setPaneW((prev) => (prev === w ? prev : w));
      rafId = null;
    };
    const onResize = () => {
      if (rafId != null) return;
      rafId = requestAnimationFrame(upd);
    };
    upd();
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [open]);
  const previewScale = paneW > 0 ? paneW / PREVIEW_W : PREVIEW_SCALE;

  const confirm = () => onConfirm(selectedEntry || null);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
        <DashboardCustomizeIcon fontSize="small" sx={{ color: '#2563eb' }} />
        {t('picker.mockup.title')}
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          {t('picker.mockup.caption')}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', height: 560 }}>
          {/* ── 좌측 — 검색·필터·목록 ── */}
          <Box sx={{
            width: 400, flexShrink: 0, display: 'flex', flexDirection: 'column',
            borderRight: '1px solid', borderColor: 'divider',
          }}>
            <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <TextField
                fullWidth size="small"
                placeholder={t('picker.mockup.searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                  ),
                }}
                sx={{ mb: 1 }}
              />
              {/* Product Line — 전체 + 등록된 productLine 별 */}
              <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5, mb: 0.6 }}>
                <Typography variant="caption" sx={{ alignSelf: 'center', mr: 0.5, color: '#94a3b8', fontWeight: 600 }}>
                  {t('picker.mockup.productLineLabel')}
                </Typography>
                <Chip
                  size="small" label={t('picker.mockup.allWithCount', { n: MOCKUP_ENTRIES.length })}
                  onClick={() => setProductLineFilter('ALL')}
                  color={productLineFilter === 'ALL' ? 'secondary' : 'default'}
                  variant={productLineFilter === 'ALL' ? 'filled' : 'outlined'}
                />
                {productLines.map((pl) => (
                  <Chip
                    key={pl} size="small"
                    label={`${PRODUCT_LINE_LABEL[pl] || pl} · ${productLineCounts.get(pl) || 0}`}
                    onClick={() => setProductLineFilter(pl)}
                    color={productLineFilter === pl ? 'secondary' : 'default'}
                    variant={productLineFilter === pl ? 'filled' : 'outlined'}
                  />
                ))}
              </Stack>

              {/* 카테고리 — 현재 Product Line 안에서 등장하는 것만 */}
              <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                <Typography variant="caption" sx={{ alignSelf: 'center', mr: 0.5, color: '#94a3b8', fontWeight: 600 }}>
                  {t('picker.mockup.categoryLabel')}
                </Typography>
                <Chip
                  size="small" label={t('picker.mockup.all')}
                  onClick={() => setCatFilter('ALL')}
                  color={catFilter === 'ALL' ? 'primary' : 'default'}
                  variant={catFilter === 'ALL' ? 'filled' : 'outlined'}
                />
                {categories.map((c) => (
                  <Chip
                    key={c} size="small" label={c}
                    onClick={() => setCatFilter(c)}
                    color={catFilter === c ? 'primary' : 'default'}
                    variant={catFilter === c ? 'filled' : 'outlined'}
                  />
                ))}
              </Stack>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
              {grouped.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
                  {t('picker.mockup.emptyHint')}
                </Typography>
              )}
              {grouped.map(([cat, entries]) => (
                <Box key={cat} sx={{ mb: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                    {CATEGORY_LABEL[cat] || cat} · {entries.length}
                  </Typography>
                  <Stack spacing={0.6} sx={{ mt: 0.6 }}>
                    {entries.map((e) => {
                      const isSel = selected === e.patternCode;
                      return (
                        <Box
                          key={e.patternCode}
                          onClick={() => setSelected(e.patternCode)}
                          sx={{
                            p: 1, borderRadius: 1, cursor: 'pointer',
                            border: '1px solid',
                            borderColor: isSel ? '#2563eb' : 'rgba(0,0,0,0.1)',
                            bgcolor: isSel ? 'rgba(37,99,235,0.07)' : '#fff',
                            '&:hover': { borderColor: '#2563eb', bgcolor: 'rgba(37,99,235,0.04)' },
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={0.8} flexWrap="wrap">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {e.patternLabel}
                            </Typography>
                            <Chip size="small" label={e.patternCode}
                              sx={{ height: 17, fontSize: 9.5, fontFamily: 'monospace' }} />
                            <Chip size="small" label={e.layoutCategory}
                              sx={{ height: 17, fontSize: 9.5, bgcolor: '#eef2ff', color: '#4338ca' }} />
                          </Stack>
                          {e.description && (
                            <Typography variant="caption" color="text.secondary" noWrap
                              sx={{ display: 'block' }}>
                              {e.description}
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              ))}
            </Box>
          </Box>

          {/* ── 우측 — 실제 mockup 미리보기 (패널 폭에 맞춰 꽉 차게 · 흰색 배경) ── */}
          {/* scrollbarGutter:'stable' — scrollbar 등장/소실로 인한 clientWidth 진동 차단 */}
          <Box
            ref={previewPaneRef}
            sx={{
              flex: 1, minWidth: 0, position: 'relative',
              overflowX: 'hidden', overflowY: 'auto',
              scrollbarGutter: 'stable',
              bgcolor: '#fff',
            }}
          >
            {!selectedEntry && (
              <Box sx={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#64748b',
              }}>
                <Typography variant="body2">{t('picker.mockup.previewEmpty')}</Typography>
              </Box>
            )}
            {selectedEntry && PreviewComp && (
              // 외곽 wrapper — scale 적용된 실제 크기를 차지 (폭=패널폭 → 우측 여백 0, 세로는 스크롤).
              <Box sx={{ width: PREVIEW_W * previewScale, height: PREVIEW_H * previewScale }}>
                <Box sx={{
                  width: PREVIEW_W, height: PREVIEW_H,
                  transform: `scale(${previewScale})`, transformOrigin: 'top left',
                  bgcolor: '#fff',
                }}>
                  <Suspense fallback={
                    <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
                  }>
                    <PreviewComp />
                  </Suspense>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        {currentValue && (
          <Button color="inherit" onClick={() => { setSelected(null); onConfirm(null); }}>
            {t('picker.mockup.clearSelection')}
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>{t('picker.mockup.cancel')}</Button>
        <Button variant="contained" onClick={confirm} disabled={!selectedEntry}>
          {t('picker.mockup.apply')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default MockupPickerDialog;

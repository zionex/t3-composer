import React, { useMemo, useState, useEffect, Suspense } from 'react';

import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, IconButton, Box, Typography, Stack, Chip,
  TextField, InputAdornment, CircularProgress,
} from '@mui/material';
import CloseIcon  from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';

import { MOCKUP_ENTRIES, CATEGORY_LABEL } from '../t3mockup';

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
  const [selected, setSelected]   = useState(currentValue || null);
  const [query, setQuery]         = useState('');
  const [catFilter, setCatFilter] = useState('ALL');

  useEffect(() => {
    if (open) { setSelected(currentValue || null); setQuery(''); setCatFilter('ALL'); }
  }, [open, currentValue]);

  const categories = useMemo(() => {
    const out = [];
    for (const e of MOCKUP_ENTRIES) if (!out.includes(e.category)) out.push(e.category);
    return out;
  }, []);

  const filtered = useMemo(() => {
    let arr = MOCKUP_ENTRIES;
    if (catFilter !== 'ALL') arr = arr.filter((e) => e.category === catFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter((e) =>
        `${e.patternCode} ${e.patternLabel} ${e.description || ''} ${e.layoutCategory}`
          .toLowerCase().includes(q));
    }
    return arr;
  }, [query, catFilter]);

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

  const confirm = () => onConfirm(selectedEntry || null);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
        <DashboardCustomizeIcon fontSize="small" sx={{ color: '#2563eb' }} />
        SCM UI Mockup 선택
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          (선택사항 — 고른 mockup 의 레이아웃 골격을 Claude 가 참조 · 미리보기 우측 표시)
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
                placeholder="코드 · 라벨 · 설명 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                  ),
                }}
                sx={{ mb: 1 }}
              />
              <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                <Chip
                  size="small" label="전체"
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
                  검색 결과가 없습니다.
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

          {/* ── 우측 — 실제 mockup 미리보기 ── */}
          <Box sx={{ flex: 1, minWidth: 0, bgcolor: '#0f1117', position: 'relative', overflow: 'hidden' }}>
            {!selectedEntry && (
              <Box sx={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#64748b',
              }}>
                <Typography variant="body2">왼쪽 목록에서 mockup 을 선택하면 미리보기가 표시됩니다.</Typography>
              </Box>
            )}
            {selectedEntry && PreviewComp && (
              <Box sx={{
                position: 'absolute', top: 0, left: 0,
                width: PREVIEW_W, height: PREVIEW_H,
                transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left',
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
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        {currentValue && (
          <Button color="inherit" onClick={() => { setSelected(null); onConfirm(null); }}>
            선택 해제
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={confirm} disabled={!selectedEntry}>
          이 Mockup 적용
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default MockupPickerDialog;

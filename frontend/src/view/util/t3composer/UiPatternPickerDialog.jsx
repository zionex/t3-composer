import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, IconButton, Box, Typography, Stack, Chip,
  TextField, InputAdornment, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import CloseIcon    from '@mui/icons-material/Close';
import SearchIcon   from '@mui/icons-material/Search';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';

import { ALL_ENTRIES } from '../t3composerpatterns/T3mesPatternCatalog';

const entryKey = (e) => `${e.file}#${e.tabIndex ?? '-'}`;

/**
 * 자연어(NEW_NL) 모드에서 사용자가 선택적으로 UI Pattern 을 고르는 POPUP.
 *
 * - 메뉴 [UI Pattern] 의 T3MES 패턴 카탈로그 entry (ALL_ENTRIES) 를 그대로 재사용.
 * - 좌측 목록에서 항목을 고르면 우측 iframe 에 실제 패턴 화면이 미리보기로 렌더됨.
 * - 선택은 선택사항. 고른 패턴의 경량 마크업(lite HTML) 을 Claude 가 레이아웃 참조로 사용.
 *
 * props:
 *   open               boolean
 *   onClose()          취소 (변경 없음)
 *   currentValue       이미 선택된 entry 의 `${file}#${tabIndex}` 키 또는 null
 *   onConfirm(entry)   entry = ALL_ENTRIES 항목 또는 null (해제)
 */
function UiPatternPickerDialog({ open, onClose, currentValue, onConfirm }) {
  const { t } = useTranslation('composer');
  const [selected, setSelected]           = useState(currentValue || null);
  const [query, setQuery]                 = useState('');
  const [sectionFilter, setSectionFilter] = useState('ALL');  // ALL | MES | SCM

  useEffect(() => {
    if (open) { setSelected(currentValue || null); setQuery(''); setSectionFilter('ALL'); }
  }, [open, currentValue]);

  const filtered = useMemo(() => {
    let arr = ALL_ENTRIES;
    if (sectionFilter !== 'ALL') arr = arr.filter((e) => e.section === sectionFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter((e) =>
        `${e.section} ${e.group} ${e.fileLabel} ${e.file} ${e.tabLabel || ''}`
          .toLowerCase().includes(q));
    }
    return arr;
  }, [query, sectionFilter]);

  // section → group → file → entries 트리
  const tree = useMemo(() => {
    const secMap = new Map();
    for (const e of filtered) {
      if (!secMap.has(e.section)) secMap.set(e.section, new Map());
      const grpMap = secMap.get(e.section);
      if (!grpMap.has(e.group)) grpMap.set(e.group, new Map());
      const fileMap = grpMap.get(e.group);
      if (!fileMap.has(e.file)) fileMap.set(e.file, { fileLabel: e.fileLabel, entries: [] });
      fileMap.get(e.file).entries.push(e);
    }
    return secMap;
  }, [filtered]);

  const selectedEntry = useMemo(
    () => ALL_ENTRIES.find((e) => entryKey(e) === selected) || null,
    [selected],
  );

  const confirm = () => onConfirm(selectedEntry || null);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
        <ViewQuiltIcon fontSize="small" sx={{ color: '#7c3aed' }} />
        {t('picker.uiPattern.title')}
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          {t('picker.uiPattern.caption')}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', height: 560 }}>
          {/* ── 좌측 — 섹션 필터·검색·목록 ── */}
          <Box sx={{
            width: 420, flexShrink: 0, display: 'flex', flexDirection: 'column',
            borderRight: '1px solid', borderColor: 'divider',
          }}>
            <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <ToggleButtonGroup
                  value={sectionFilter} exclusive size="small"
                  onChange={(_, v) => { if (v) setSectionFilter(v); }}
                >
                  <ToggleButton value="ALL" sx={{ px: 1.2, py: 0.3 }}>{t('picker.uiPattern.filterAll')}</ToggleButton>
                  <ToggleButton value="SCM" sx={{ px: 1.2, py: 0.3 }}>SCM</ToggleButton>
                  <ToggleButton value="MES" sx={{ px: 1.2, py: 0.3 }}>MES</ToggleButton>
                </ToggleButtonGroup>
                <Chip size="small" variant="outlined" label={t('picker.uiPattern.countChip', { n: filtered.length })} />
              </Stack>
              <TextField
                fullWidth size="small"
                placeholder={t('picker.uiPattern.searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
              {filtered.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
                  {t('picker.uiPattern.emptyHint')}
                </Typography>
              )}
              {Array.from(tree.entries()).map(([section, grpMap]) => (
                <Box key={section} sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#7c3aed', mb: 0.5 }}>
                    {section === 'MES' ? '🏭 MES' : '🌐 SCM'}
                  </Typography>
                  {Array.from(grpMap.entries()).map(([group, fileMap]) => (
                    <Box key={group} sx={{ mb: 1, pl: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>
                        ◆ {group}
                      </Typography>
                      {Array.from(fileMap.entries()).map(([file, fileObj]) => (
                        <Box key={file} sx={{ pl: 1, mt: 0.4 }}>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {fileObj.fileLabel}
                          </Typography>
                          <Stack spacing={0.4} sx={{ mt: 0.3 }}>
                            {fileObj.entries.map((e) => {
                              const k = entryKey(e);
                              const isSel = selected === k;
                              const layerCount = Array.isArray(e.layers) ? e.layers.length : 0;
                              return (
                                <Box
                                  key={k}
                                  onClick={() => setSelected(k)}
                                  sx={{
                                    display: 'flex', alignItems: 'center', gap: 0.6,
                                    p: 0.7, borderRadius: 1, cursor: 'pointer',
                                    border: '1px solid',
                                    borderColor: isSel ? '#7c3aed' : 'rgba(0,0,0,0.1)',
                                    bgcolor: isSel ? 'rgba(124,58,237,0.08)' : '#fff',
                                    '&:hover': { borderColor: '#7c3aed', bgcolor: 'rgba(124,58,237,0.04)' },
                                  }}
                                >
                                  {e.tabIndex != null && (
                                    <Chip size="small" label={e.tabIndex + 1}
                                      sx={{ height: 18, minWidth: 26, fontSize: 10, fontFamily: 'monospace',
                                            bgcolor: '#7c3aed', color: '#fff', '& .MuiChip-label': { px: 0.6 } }} />
                                  )}
                                  <Typography variant="caption" noWrap
                                    sx={{ fontWeight: 600, flex: 1, minWidth: 0 }}
                                    title={e.tabLabel || e.fileLabel}>
                                    {e.tabLabel || e.fileLabel}
                                  </Typography>
                                  {layerCount > 0 && (
                                    <Chip size="small" label={`${layerCount}L`}
                                      title={t('picker.uiPattern.layerChipTitle', { n: layerCount })}
                                      sx={{ height: 16, fontSize: 9, fontWeight: 700,
                                            bgcolor: 'rgba(124,58,237,0.12)', color: '#7c3aed',
                                            border: '1px solid rgba(124,58,237,0.25)',
                                            '& .MuiChip-label': { px: 0.5 } }} />
                                  )}
                                </Box>
                              );
                            })}
                          </Stack>
                        </Box>
                      ))}
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>

          {/* ── 우측 — 실제 UI Pattern 화면 미리보기 (iframe) ── */}
          <Box sx={{ flex: 1, minWidth: 0, bgcolor: '#f6f7f9', position: 'relative' }}>
            {!selectedEntry && (
              <Box sx={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#64748b',
              }}>
                <Typography variant="body2">{t('picker.uiPattern.previewEmpty')}</Typography>
              </Box>
            )}
            {selectedEntry && (
              <iframe
                key={selectedEntry.srcUrl}
                title={selectedEntry.tabLabel || selectedEntry.fileLabel}
                src={selectedEntry.srcUrl}
                style={{ width: '100%', height: '100%', border: 'none', display: 'block', backgroundColor: '#f6f7f9' }}
              />
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        {currentValue && (
          <Button color="inherit" onClick={() => { setSelected(null); onConfirm(null); }}>
            {t('picker.uiPattern.clearSelection')}
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>{t('picker.uiPattern.cancel')}</Button>
        <Button variant="contained" color="secondary" onClick={confirm} disabled={!selectedEntry}>
          {t('picker.uiPattern.apply')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default UiPatternPickerDialog;

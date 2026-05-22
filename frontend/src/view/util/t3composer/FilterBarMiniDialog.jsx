/**
 * FilterBarMiniDialog — ComposerCanvas 의 노란 띠 (FilterBar zone) 클릭 시 뜨는 Dialog.
 *
 *   props:
 *     open    : boolean
 *     onClose : () => void
 *     spec    : ComposerSpec  (filterBar.items / affects 편집)
 *     onApply : (nextSpec) => void
 *
 *   Phase 1 범위: 필드 추가/제거 + label/type 편집 + affects 매핑 (어느 layer 가
 *   이 필드를 사용하는지 체크박스). cascade / cross_field_rules 는 Phase 2.
 *
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase1.md (Task 4)
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, IconButton, Typography, TextField,
  MenuItem, Select, FormControl, Table, TableHead, TableBody, TableRow, TableCell,
  Checkbox,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';

const FILTER_TYPES = [
  { value: 'TEXT',                 label: 'TEXT' },
  { value: 'NUMBER',               label: 'NUMBER' },
  { value: 'SELECT',               label: 'SELECT' },
  { value: 'DATE_RANGE',           label: 'DATE_RANGE' },
  { value: 'DOMAIN_PLAN_SCOPE',    label: 'DOMAIN_PLAN_SCOPE' },
  { value: 'DOMAIN_ITEM_MULTI',    label: 'DOMAIN_ITEM_MULTI' },
  { value: 'DOMAIN_ACCOUNT_MULTI', label: 'DOMAIN_ACCOUNT_MULTI' },
  { value: 'DOMAIN_LOCATION_MULTI',label: 'DOMAIN_LOCATION_MULTI' },
  { value: 'DOMAIN_VERSION',       label: 'DOMAIN_VERSION' },
];

function FilterBarMiniDialog({ open, onClose, spec, onApply }) {
  const [items, setItems]     = useState([]);
  const [affects, setAffects] = useState({});   // { layerKey: [itemKey...] }

  useEffect(() => {
    if (!open) return;
    setItems(spec?.filterBar?.items || []);
    setAffects(spec?.filterBar?.affects || {});
  }, [open, spec]);

  const layers = spec?.layers || [];

  const handleAddItem = () => {
    const newKey = `field_${Date.now().toString(36)}`;
    setItems([...items, { key: newKey, label: '새 필드', type: 'TEXT' }]);
  };
  const handleRemoveItem = (idx) => {
    const removedKey = items[idx]?.key;
    setItems(items.filter((_, i) => i !== idx));
    if (removedKey) {
      const nextAffects = {};
      Object.entries(affects).forEach(([lk, fks]) => {
        nextAffects[lk] = fks.filter(k => k !== removedKey);
      });
      setAffects(nextAffects);
    }
  };
  const updateItem = (idx, patch) => {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const toggleAffect = (layerKey, itemKey) => {
    const cur = affects[layerKey] || [];
    const next = cur.includes(itemKey) ? cur.filter(k => k !== itemKey) : [...cur, itemKey];
    setAffects({ ...affects, [layerKey]: next });
  };

  const handleApply = () => {
    onApply({
      ...spec,
      filterBar: { ...(spec?.filterBar || {}), items, affects },
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ color: '#92400e', fontWeight: 800 }}>
          🔍 FilterBar (검색조건) 편집
        </Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
          필드 목록 — 화면 전체에 공용으로 노출
        </Typography>
        <Table size="small" sx={{ mt: 1, mb: 2 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#fef3c7' }}>
              <TableCell sx={{ fontWeight: 700, width: 180 }}>Key</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Label</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 200 }}>Type</TableCell>
              <TableCell sx={{ width: 40 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 && (
              <TableRow><TableCell colSpan={4} sx={{ color: '#94a3b8', textAlign: 'center' }}>
                필드가 없습니다. 아래 [+ 필드 추가] 로 생성하세요.
              </TableCell></TableRow>
            )}
            {items.map((it, idx) => (
              <TableRow key={it.key}>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{it.key}</TableCell>
                <TableCell>
                  <TextField value={it.label} onChange={(e) => updateItem(idx, { label: e.target.value })}
                             size="small" fullWidth variant="standard" />
                </TableCell>
                <TableCell>
                  <FormControl size="small" fullWidth variant="standard">
                    <Select value={it.type} onChange={(e) => updateItem(idx, { type: e.target.value })}>
                      {FILTER_TYPES.map(t => (
                        <MenuItem key={t.value} value={t.value} sx={{ fontSize: 12, fontFamily: 'monospace' }}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleRemoveItem(idx)}>
                    <DeleteIcon fontSize="small" sx={{ color: '#ef4444' }} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Button size="small" startIcon={<AddIcon />} onClick={handleAddItem} variant="outlined"
                sx={{ borderColor: '#f59e0b', color: '#92400e' }}>
          필드 추가
        </Button>

        {/* affects 매핑 */}
        {layers.length > 0 && items.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
              영향 매핑 — 각 필드가 어느 layer 에 영향을 주는지
            </Typography>
            <Table size="small" sx={{ mt: 1 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Layer</TableCell>
                  {items.map(it => (
                    <TableCell key={it.key} sx={{ fontWeight: 700, textAlign: 'center', fontSize: 11 }}>
                      {it.label || it.key}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {layers.map(l => (
                  <TableRow key={l.key}>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: '#1e40af' }}>
                      {l.title || l.key}
                    </TableCell>
                    {items.map(it => (
                      <TableCell key={it.key} sx={{ textAlign: 'center', p: 0 }}>
                        <Checkbox size="small"
                          checked={(affects[l.key] || []).includes(it.key)}
                          onChange={() => toggleAffect(l.key, it.key)} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1 }}>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleApply} variant="contained">적용</Button>
      </DialogActions>
    </Dialog>
  );
}

export default FilterBarMiniDialog;

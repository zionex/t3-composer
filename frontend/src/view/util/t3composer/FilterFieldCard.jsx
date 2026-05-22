/**
 * FilterFieldCard — FilterBar 의 개별 필드 카드 (inline 편집).
 *   상위 FilterBarInlinePanel 이 controlled props 로 호출.
 *
 *   props:
 *     field           {key, label, type}  spec.filterBar.items[i]
 *     layers          spec.layers (chip 노출용)
 *     affectsForField { [layerKey]: boolean }  이 필드가 영향 주는 layer 매핑
 *     onUpdate(patch) field 의 label/type 변경
 *     onRemove()      이 필드 삭제
 *     onToggleAffect(layerKey)  영향 토글
 *
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e2.md (Task 1)
 *   Spec: docs/superpowers/specs/2026-05-22-composer-canvas-phase2e2-filterbar-inline-design.md
 */
import React from 'react';
import {
  Box, TextField, Select, MenuItem, FormControl, IconButton,
  Chip, Stack, Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutline';

export const FILTER_TYPES = [
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

function FilterFieldCard({ field, layers, affectsForField, onUpdate, onRemove, onToggleAffect }) {
  return (
    <Box sx={{
      bgcolor: '#fff', border: '1px solid #fbbf24', borderRadius: 1,
      p: 1, display: 'flex', flexDirection: 'column', gap: 0.7,
    }}>
      {/* 1행: label + 삭제 */}
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <TextField
          value={field.label || ''}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="라벨"
          size="small" variant="standard" fullWidth
          inputProps={{ style: { fontSize: 12, fontWeight: 700, color: '#92400e' } }}
        />
        <IconButton size="small" onClick={onRemove} sx={{ p: 0.3 }}>
          <DeleteIcon fontSize="small" sx={{ color: '#ef4444' }} />
        </IconButton>
      </Stack>

      {/* 2행: type */}
      <FormControl size="small" variant="standard" fullWidth>
        <Select
          value={field.type || 'TEXT'}
          onChange={(e) => onUpdate({ type: e.target.value })}
          sx={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}
        >
          {FILTER_TYPES.map((t) => (
            <MenuItem key={t.value} value={t.value} sx={{ fontSize: 11, fontFamily: 'monospace' }}>
              {t.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* 3행: 영향 chip 들 */}
      {layers.length > 0 && (
        <Box sx={{ mt: 0.3 }}>
          <Typography variant="caption" sx={{ fontSize: 10, color: '#92400e', mr: 0.5 }}>
            영향:
          </Typography>
          <Stack direction="row" spacing={0.3} flexWrap="wrap" useFlexGap sx={{ mt: 0.3 }}>
            {layers.map((l) => {
              const checked = !!affectsForField[l.key];
              return (
                <Chip
                  key={l.key}
                  label={l.title || l.key}
                  size="small"
                  onClick={() => onToggleAffect(l.key)}
                  sx={{
                    fontSize: 10, height: 18, cursor: 'pointer',
                    bgcolor: checked ? '#92400e' : '#fef3c7',
                    color: checked ? '#fff' : '#92400e',
                    border: checked ? 'none' : '1px dashed #fbbf24',
                    fontWeight: 700,
                    '&:hover': {
                      bgcolor: checked ? '#78350f' : '#fde68a',
                    },
                  }}
                />
              );
            })}
          </Stack>
        </Box>
      )}
    </Box>
  );
}

export default FilterFieldCard;

/**
 * FilterBarInlinePanel — DataAndFilterStep 의 우측 FilterBar 패널 (inline 편집).
 *   FilterBarMiniDialog popup 대체.
 *
 *   props:
 *     spec     ComposerSpec
 *     onChange(nextSpec)  spec 갱신
 *
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e2.md (Task 2)
 *   Spec: docs/superpowers/specs/2026-05-22-composer-canvas-phase2e2-filterbar-inline-design.md
 */
import React from 'react';
import { Box, Stack, Typography, Button } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';

import FilterFieldCard from './FilterFieldCard';

function FilterBarInlinePanel({ spec, onChange }) {
  const items   = spec?.filterBar?.items   || [];
  const affects = spec?.filterBar?.affects || {};
  const layers  = spec?.layers || [];

  const updateFilterBar = (patch) => {
    onChange({
      ...spec,
      filterBar: { ...(spec?.filterBar || {}), ...patch },
    });
  };

  const handleAddField = () => {
    const newKey = `field_${Date.now().toString(36)}`;
    const nextItems = [...items, { key: newKey, label: '새 필드', type: 'TEXT' }];
    // default 로 모든 layer 영향 매핑 체크 (f8d675f 정책 유지)
    const nextAffects = { ...affects };
    layers.forEach((l) => {
      const cur = nextAffects[l.key] || [];
      if (!cur.includes(newKey)) nextAffects[l.key] = [...cur, newKey];
    });
    updateFilterBar({ items: nextItems, affects: nextAffects });
  };

  const handleRemoveField = (idx) => {
    const removedKey = items[idx]?.key;
    const nextItems = items.filter((_, i) => i !== idx);
    const nextAffects = {};
    Object.entries(affects).forEach(([lk, fks]) => {
      nextAffects[lk] = (fks || []).filter((k) => k !== removedKey);
    });
    updateFilterBar({ items: nextItems, affects: nextAffects });
  };

  const handleUpdateField = (idx, patch) => {
    const nextItems = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    updateFilterBar({ items: nextItems });
  };

  const handleToggleAffect = (layerKey, fieldKey) => {
    const cur = affects[layerKey] || [];
    const next = cur.includes(fieldKey)
      ? cur.filter((k) => k !== fieldKey)
      : [...cur, fieldKey];
    updateFilterBar({ affects: { ...affects, [layerKey]: next } });
  };

  return (
    <Box sx={{
      flexShrink: 0, width: 280,
      display: 'flex', flexDirection: 'column', gap: 1,
      bgcolor: '#fef9c3', border: '2px solid #f59e0b', borderRadius: 1.5,
      p: 1.5, overflow: 'auto',
    }}>
      {/* header */}
      <Stack direction="row" alignItems="center" spacing={0.8}>
        <FilterListIcon sx={{ fontSize: 18, color: '#92400e' }} />
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400e', flex: 1 }}>
          🔍 FilterBar (검색조건)
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon fontSize="small" />}
          onClick={handleAddField}
          sx={{ fontSize: 11, color: '#92400e' }}
        >
          필드 추가
        </Button>
      </Stack>

      {/* 빈 상태 */}
      {items.length === 0 && (
        <Typography variant="caption" sx={{
          color: '#92400e', fontStyle: 'italic', textAlign: 'center', py: 2,
        }}>
          필드 없음 — [+ 필드 추가] 클릭
        </Typography>
      )}

      {/* field 카드 list */}
      {items.map((field, idx) => {
        const affectsForField = {};
        layers.forEach((l) => {
          affectsForField[l.key] = (affects[l.key] || []).includes(field.key);
        });
        return (
          <FilterFieldCard
            key={field.key}
            field={field}
            layers={layers}
            affectsForField={affectsForField}
            onUpdate={(patch) => handleUpdateField(idx, patch)}
            onRemove={() => handleRemoveField(idx)}
            onToggleAffect={(layerKey) => handleToggleAffect(layerKey, field.key)}
          />
        );
      })}
    </Box>
  );
}

export default FilterBarInlinePanel;

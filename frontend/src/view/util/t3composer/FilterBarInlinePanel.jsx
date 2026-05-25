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
import { Box, Stack, Typography, Button, Tooltip } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

import FilterFieldCard from './FilterFieldCard';

function FilterBarInlinePanel({ spec, onChange, onOpenAutoSuggest }) {
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
    // label 은 빈 문자열 — 카드의 TextField placeholder('라벨') 가 가이드.
    // ② → ③ 진행 시 ComposerWizard 가 빈 라벨 검증 후 차단.
    const nextItems = [...items, { key: newKey, label: '', type: 'TEXT' }];
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
      bgcolor: '#fff', border: '1px solid rgba(143, 196, 212, 0.4)', borderRadius: 1.5,
      p: 1.5, overflow: 'auto',
    }}>
      {/* header */}
      <Stack direction="row" alignItems="center" spacing={0.3}>
        <FilterListIcon sx={{ fontSize: 18, color: '#8FC4D4' }} />
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#3A4A63', flex: 1 }}>
          FilterBar (검색조건)
        </Typography>
        {onOpenAutoSuggest && (
          <Tooltip title="AI 추천 (검색조건 + 관계)">
            <Button
              size="small"
              onClick={onOpenAutoSuggest}
              sx={{ fontSize: 11, color: '#9D8FD4', minWidth: 0, px: 0.5 }}
            >
              <AutoFixHighIcon fontSize="small" />
            </Button>
          </Tooltip>
        )}
        <Button
          size="small"
          startIcon={<AddIcon fontSize="small" />}
          onClick={handleAddField}
          sx={{ fontSize: 11, color: '#4A90A4' }}
        >
          필드 추가
        </Button>
      </Stack>

      {/* 빈 상태 */}
      {items.length === 0 && (
        <Typography variant="caption" sx={{
          color: '#6E7E96', fontStyle: 'italic', textAlign: 'center', py: 2,
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

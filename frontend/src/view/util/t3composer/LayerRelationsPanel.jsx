/**
 * LayerRelationsPanel — DataAndFilterStep 우측 영역의 'Layer 관계' 섹션.
 *   FilterBarInlinePanel 아래 같은 폭 (280px) 보라 패널.
 *
 *   props:
 *     spec     ComposerSpec
 *     onChange(nextSpec)
 *
 *   Plan: docs/superpowers/plans/2026-05-25-composer-canvas-phase2d2a.md (Task 3)
 */
import React from 'react';
import { Box, Stack, Typography, Button } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import AddIcon from '@mui/icons-material/Add';

import LayerRelationCard from './LayerRelationCard';
import { addRelation, removeRelation, updateRelation } from './wizardState';

function LayerRelationsPanel({ spec, onChange }) {
  const relations = spec?.relations || [];
  const layers    = spec?.layers    || [];

  const handleAdd = () => onChange(addRelation(spec));
  const handleRemove = (id) => onChange(removeRelation(spec, id));
  const handleUpdate = (id, patch) => onChange(updateRelation(spec, id, patch));

  const canAdd = layers.length >= 1;

  return (
    <Box sx={{
      flexShrink: 0, width: 280,
      display: 'flex', flexDirection: 'column', gap: 1,
      bgcolor: '#f3e8ff', border: '2px solid #a855f7', borderRadius: 1.5,
      p: 1.5, overflow: 'auto',
    }}>
      <Stack direction="row" alignItems="center" spacing={0.8}>
        <LinkIcon sx={{ fontSize: 18, color: '#6b21a8' }} />
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#6b21a8', flex: 1 }}>
          🔗 Layer 관계
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon fontSize="small" />}
          onClick={handleAdd}
          disabled={!canAdd}
          sx={{ fontSize: 11, color: '#6b21a8' }}
        >
          관계 추가
        </Button>
      </Stack>

      {!canAdd && (
        <Typography variant="caption" sx={{
          color: '#6b21a8', fontStyle: 'italic', textAlign: 'center', py: 1, fontSize: 11,
        }}>
          layer 1개 이상 필요
        </Typography>
      )}

      {canAdd && relations.length === 0 && (
        <Typography variant="caption" sx={{
          color: '#6b21a8', fontStyle: 'italic', textAlign: 'center', py: 2, fontSize: 11,
        }}>
          관계 없음 — [+ 관계 추가] 클릭<br/>
          (예: master grid 클릭 → detail grid 재조회)
        </Typography>
      )}

      {relations.map((r) => (
        <LayerRelationCard
          key={r.id}
          relation={r}
          layers={layers}
          onUpdate={(patch) => handleUpdate(r.id, patch)}
          onRemove={() => handleRemove(r.id)}
        />
      ))}
    </Box>
  );
}

export default LayerRelationsPanel;

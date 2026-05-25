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
import { Box, Stack, Typography, Button, Tooltip } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import AddIcon from '@mui/icons-material/Add';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

import LayerRelationCard from './LayerRelationCard';
import { addRelation, removeRelation, updateRelation } from './wizardState';

function LayerRelationsPanel({ spec, onChange, onOpenAutoSuggest }) {
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
      bgcolor: '#fff', border: '1px solid rgba(157, 143, 212, 0.4)', borderRadius: 1.5,
      p: 1.5, overflow: 'auto',
    }}>
      <Stack direction="row" alignItems="center" spacing={0.3}>
        <LinkIcon sx={{ fontSize: 18, color: '#9D8FD4' }} />
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#3A4A63', flex: 1 }}>
          Layer 관계
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
          onClick={handleAdd}
          disabled={!canAdd}
          sx={{ fontSize: 11, color: '#6D5FA8' }}
        >
          관계 추가
        </Button>
      </Stack>

      {!canAdd && (
        <Typography variant="caption" sx={{
          color: '#6E7E96', fontStyle: 'italic', textAlign: 'center', py: 1, fontSize: 11,
        }}>
          layer 1개 이상 필요
        </Typography>
      )}

      {canAdd && relations.length === 0 && (
        <Typography variant="caption" sx={{
          color: '#6E7E96', fontStyle: 'italic', textAlign: 'center', py: 2, fontSize: 11,
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

/**
 * DataAndFilterStep — ② 데이터·검색조건 단계.
 *   Phase 2E-1: 단순 버전 — 좌측 layer 카드 list + 우측 FilterBar 카드 list. 자세한 입력은 mini dialog.
 *   Phase 2E-2: 우측 FilterBar 를 inline panel 로 강화 (popup 없이 직접 편집).
 *
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e1.md (Task 4)
 */
import React, { useState } from 'react';
import { Box, Typography, Stack, Chip } from '@mui/material';

import DataMiniDialog from './DataMiniDialog';
import FilterBarInlinePanel from './FilterBarInlinePanel';

function DataAndFilterStep({ spec, onChange, targetCd }) {
  const [editingLayerKey, setEditingLayerKey] = useState(null);

  const layers = spec?.layers || [];
  const editingLayer = layers.find((l) => l.key === editingLayerKey) || null;

  const handleApplyLayer = (nextLayer) => {
    if (!nextLayer) return;
    onChange({
      ...spec,
      layers: layers.map((l) => (l.key === nextLayer.key ? nextLayer : l)),
    });
  };

  return (
    <Box sx={{ display: 'flex', gap: 1.5, height: '100%', minHeight: 0 }}>

      {/* ── 좌측 70% : Body Layers ── */}
      <Box sx={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column',
                  gap: 1, overflow: 'auto' }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e40af',
                                              flexShrink: 0 }}>
          📐 Body Layers — 클릭하여 데이터 편집
        </Typography>
        {layers.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8' }}>
            Layer 가 없습니다. ① Layout 단계에서 추가하세요.
          </Box>
        )}
        {layers.map((l) => {
          const hasData = !!(l.dataSource?.naturalText) || (l.dataSource?.references || []).length > 0;
          return (
            <Box
              key={l.key}
              onClick={() => setEditingLayerKey(l.key)}
              sx={{
                cursor: 'pointer', p: 1.5,
                bgcolor: '#fff', border: '1px solid #cbd5e1', borderRadius: 1.5,
                borderLeft: '4px solid #7CA7E0',
                transition: 'box-shadow 0.15s ease',
                '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>
                    {l.title || l.key}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: '#64748b' }}>
                    {l.type}{l.subtype ? ` · ${l.subtype}` : ''}
                    {l.parentKey ? ` · (자식: ⊂ ${l.parentKey})` : ''}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={hasData ? '✓ 설정됨' : '미설정'}
                  sx={{
                    bgcolor: hasData ? '#dcfce7' : '#fef3c7',
                    color:   hasData ? '#166534' : '#92400e',
                    fontWeight: 700,
                  }}
                />
              </Stack>
            </Box>
          );
        })}
      </Box>

      {/* ── 우측 ~280px : FilterBar inline editor (Phase 2E-2) ── */}
      <FilterBarInlinePanel spec={spec} onChange={onChange} />

      {/* ── Dialogs ── */}
      <DataMiniDialog
        open={!!editingLayer}
        layer={editingLayer}
        targetCd={targetCd}
        onClose={() => setEditingLayerKey(null)}
        onApply={handleApplyLayer}
      />
    </Box>
  );
}

export default DataAndFilterStep;

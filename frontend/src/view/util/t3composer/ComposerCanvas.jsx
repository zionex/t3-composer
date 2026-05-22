/**
 * ComposerCanvas — 9-Step Wizard 의 대체. 시각 직접 조작 + Mini Dialog.
 *
 *   props:
 *     spec        : ComposerSpec
 *     onChange    : (nextSpec) => void
 *     readOnly?   : boolean
 *
 *   레이아웃:
 *     ┌─────────────────────────────────────────┐
 *     │ 🔍 FilterBar (노란 띠, 클릭 → FBMD)      │
 *     ├─────────────────────────────────────────┤
 *     │ 📐 Body Layers (단순 flex, 클릭 → DMD)   │
 *     └─────────────────────────────────────────┘
 *
 *   Phase 1: 미세조정(layer 추가/이동/삭제) OFF — 패턴이 만든 layer 그대로.
 *   Phase 3 에서 LayoutDesigner 의 RGL 미세조정 토글 흡수 예정.
 *
 *   디자인: docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md
 *           "FilterBar 시각 분리" + "Mini Dialog 디자인" 섹션
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase1.md (Task 5)
 */
import React, { useState, useMemo } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';

import DataMiniDialog from './DataMiniDialog';
import FilterBarMiniDialog from './FilterBarMiniDialog';

function ComposerCanvas({ spec, onChange, readOnly = false, targetCd, onOpenDataSourcePicker }) {
  const [editingLayerKey, setEditingLayerKey] = useState(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const filterItems = spec?.filterBar?.items || [];
  const layers      = spec?.layers || [];

  const editingLayer = useMemo(
    () => layers.find(l => l.key === editingLayerKey) || null,
    [layers, editingLayerKey]
  );

  const handleApplyLayer = (nextLayer) => {
    if (!nextLayer) return;
    onChange({
      ...spec,
      layers: layers.map(l => (l.key === nextLayer.key ? nextLayer : l)),
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%', minHeight: 0 }}>

      {/* ───── FilterBar 노란 띠 ───── */}
      <Box
        onClick={readOnly ? undefined : () => setFilterDialogOpen(true)}
        sx={{
          flexShrink: 0,
          border: '2px solid #f59e0b',
          borderRadius: 1.5,
          background: 'linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)',
          p: 1.2,
          cursor: readOnly ? 'default' : 'pointer',
          transition: 'box-shadow 0.15s ease',
          '&:hover': readOnly ? {} : { boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.25)' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <FilterListIcon sx={{ fontSize: 16, color: '#92400e' }} />
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400e' }}>
            🔍 검색조건 (FilterBar) · 화면 전체 공용 · 클릭하여 편집
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.7 }}>
          {filterItems.length === 0 && (
            <Typography variant="caption" sx={{ color: '#92400e', fontStyle: 'italic' }}>
              필드 없음 — 클릭하여 검색조건을 추가하세요
            </Typography>
          )}
          {filterItems.map(it => (
            <Chip key={it.key}
                  label={it.label || it.key}
                  size="small"
                  sx={{ bgcolor: '#fff', border: '1px solid #fbbf24',
                        color: '#92400e', fontWeight: 700, fontSize: 11 }} />
          ))}
        </Box>
      </Box>

      {/* ───── Body Layers 라벨 ───── */}
      <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.7 }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e40af' }}>
          📐 본문 (Body Layers)
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          — 각 layer 박스를 클릭하면 데이터 편집 다이얼로그가 열립니다.
        </Typography>
      </Box>

      {/* ───── Body Layers ─────
          Phase 1 은 RGL 미사용 (미세조정 OFF). 단순 flex column 으로 layer 들을 row 배치.
          Phase 3 에서 LayoutDesigner 의 RGL 흡수. */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto',
                 display: 'flex', flexDirection: 'column', gap: 1, p: 0.5 }}>
        {layers.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8' }}>
            Layer 가 없습니다. ComposerSpec.layers 가 비어있는지 확인하세요.
          </Box>
        )}
        {layers.map(l => {
          const hasData = !!(l.dataSource?.naturalText) || (l.dataSource?.references || []).length > 0;
          return (
            <Box
              key={l.key}
              onClick={readOnly ? undefined : () => setEditingLayerKey(l.key)}
              sx={{
                cursor: readOnly ? 'default' : 'pointer',
                border: '2px solid #2563eb',
                borderRadius: 1.5,
                bgcolor: '#3b82f6',
                color: '#fff',
                minHeight: 80,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 0.5,
                p: 2,
                transition: 'box-shadow 0.15s ease, transform 0.15s ease',
                '&:hover': readOnly ? {} : {
                  boxShadow: '0 0 0 3px rgba(59,130,246,0.35)', transform: 'translateY(-1px)',
                },
              }}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 700,
                                textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
                {l.title || l.key}
              </Typography>
              <Typography variant="caption" sx={{ color: '#dbeafe' }}>
                {l.type}{l.subtype ? ` · ${l.subtype}` : ''}
                {hasData ? ' · ✓ 데이터 설정됨' : ' · 클릭하여 데이터 입력'}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* ───── Dialogs ───── */}
      <DataMiniDialog
        open={!!editingLayer}
        layer={editingLayer}
        targetCd={targetCd}
        onClose={() => setEditingLayerKey(null)}
        onApply={handleApplyLayer}
        /* Phase 2A: 외부에서 받은 콜백 그대로 전달. editingLayer 정보 함께. */
        onOpenDataSourcePicker={
          onOpenDataSourcePicker
            ? () => onOpenDataSourcePicker(editingLayer)
            : null
        }
      />
      <FilterBarMiniDialog
        open={filterDialogOpen}
        spec={spec}
        onClose={() => setFilterDialogOpen(false)}
        onApply={(nextSpec) => onChange(nextSpec)}
      />
    </Box>
  );
}

export default ComposerCanvas;

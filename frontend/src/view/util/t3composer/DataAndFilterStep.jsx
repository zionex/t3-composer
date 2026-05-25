/**
 * DataAndFilterStep — ② 데이터·검색조건 단계.
 *   Phase 2E-4: 좌측 layer = 컴팩트 list (height 36px) + 클릭 시 inline accordion.
 *                popup (DataMiniDialog) 미사용 — 우측 inline 패널과 일관된 UX.
 *   우측 column: FilterBarInlinePanel (위) + LayerRelationsPanel (아래).
 *
 *   Plan: docs/superpowers/plans/2026-05-25-composer-canvas-phase2e4.md
 *   Spec: docs/superpowers/specs/2026-05-25-composer-canvas-phase2e4-data-accordion-design.md
 */
import React, { useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import DataInlineEditor from './DataInlineEditor';
import FilterBarInlinePanel from './FilterBarInlinePanel';
import LayerRelationsPanel from './LayerRelationsPanel';
import AutoSuggestDialog from './AutoSuggestDialog';
import { addRelation } from './wizardState';

function DataAndFilterStep({ spec, onChange, targetCd }) {
  const [expandedLayerKey, setExpandedLayerKey] = useState(null);
  const [autoSuggestOpen, setAutoSuggestOpen]   = useState(false);

  const layers = spec?.layers || [];

  const handleUpdateDataSource = (layerKey, nextDs) => {
    onChange({
      ...spec,
      layers: layers.map((l) => (l.key === layerKey ? { ...l, dataSource: nextDs } : l)),
    });
  };

  // Phase 2D-3 — AI 추천 적용: append, 덮어쓰기 X.
  const handleAutoSuggestApply = ({ filterFields, relations }) => {
    let next = spec;

    // 1. filterFields append + 모든 layer affects 에 default 등록 (f8d675f 정책)
    (filterFields || []).forEach((f) => {
      const newKey = `field_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
      const curItems   = next.filterBar?.items   || [];
      const curAffects = { ...(next.filterBar?.affects || {}) };
      (next.layers || []).forEach((l) => {
        curAffects[l.key] = [...(curAffects[l.key] || []), newKey];
      });
      next = {
        ...next,
        filterBar: {
          ...(next.filterBar || {}),
          items:   [...curItems, { key: newKey, label: f.label, type: f.type }],
          affects: curAffects,
        },
      };
    });

    // 2. relations append (addRelation helper)
    (relations || []).forEach((r) => {
      next = addRelation(next, {
        source:  { layerKey: r.sourceLayerKey, event: r.sourceEvent },
        target:  { layerKey: r.targetLayerKey, action: r.targetAction },
        mapping: r.mapping || {},
      });
    });

    onChange(next);
  };

  return (
    <Box sx={{ display: 'flex', gap: 1.5, height: '100%', minHeight: 0 }}>

      {/* ── 좌측 : Body Layers (컴팩트 list + accordion) ── */}
      <Box sx={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column',
                  gap: 0.5, overflow: 'auto' }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e40af',
                                              flexShrink: 0, mb: 0.5 }}>
          📐 Body Layers — 클릭하여 펼치고 데이터 편집
        </Typography>
        {layers.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8' }}>
            Layer 가 없습니다. ① Layout 단계에서 추가하세요.
          </Box>
        )}
        {layers.map((l) => {
          const hasData = !!(l.dataSource?.naturalText) || (l.dataSource?.references || []).length > 0
                      || (l.dataSource?.sqlBlocks || []).length > 0;
          const expanded = l.key === expandedLayerKey;
          return (
            <Box key={l.key}>
              {/* 컴팩트 layer-row (height 36px) */}
              <Box
                onClick={() => setExpandedLayerKey(expanded ? null : l.key)}
                sx={{
                  height: 36, display: 'flex', alignItems: 'center', px: 1, gap: 1,
                  bgcolor: expanded ? '#eff6ff' : '#fff',
                  border: '1px solid #cbd5e1',
                  borderLeft: '4px solid #7CA7E0',
                  borderRadius: expanded ? '4px 4px 0 0' : 1,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: expanded ? '#dbeafe' : '#f8fafc' },
                }}
              >
                <ExpandMoreIcon sx={{ fontSize: 16, color: '#64748b',
                                       transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                                       transition: 'transform 0.15s ease' }} />
                <Typography sx={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#1e293b',
                                   overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {l.title || l.key}
                  {l.parentKey && (
                    <Typography component="span" sx={{ fontSize: 10, color: '#94a3b8', ml: 0.5 }}>
                      ⊂ {l.parentKey}
                    </Typography>
                  )}
                </Typography>
                <Chip
                  size="small"
                  label={hasData ? '✓' : '미설정'}
                  sx={{
                    height: 18, fontSize: 10,
                    bgcolor: hasData ? '#dcfce7' : '#fef3c7',
                    color:   hasData ? '#166534' : '#92400e',
                    fontWeight: 700,
                  }}
                />
                <Typography sx={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
                  {l.type}
                </Typography>
              </Box>

              {/* 펼친 상태: 인라인 편집기 */}
              {expanded && (
                <Box sx={{
                  p: 1.5,
                  border: '1px solid #cbd5e1', borderTop: 'none',
                  borderRadius: '0 0 4px 4px',
                  bgcolor: '#f8fafc',
                }}>
                  <DataInlineEditor
                    dataSource={l.dataSource}
                    onChange={(nextDs) => handleUpdateDataSource(l.key, nextDs)}
                    targetCd={targetCd}
                  />
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {/* ── 우측 ~280px column : FilterBar (상) + LayerRelations (하) 세로 배치.
            wrapper 가 단일 스크롤 — 두 패널이 자연 높이로 쌓이고 넘치면 wrapper 가 스크롤. ── */}
      <Box sx={{
        flexShrink: 0, width: 280,
        display: 'flex', flexDirection: 'column', gap: 1.5,
        minHeight: 0, overflow: 'auto',
      }}>
        <FilterBarInlinePanel
          spec={spec}
          onChange={onChange}
          onOpenAutoSuggest={() => setAutoSuggestOpen(true)}
        />
        <LayerRelationsPanel
          spec={spec}
          onChange={onChange}
          onOpenAutoSuggest={() => setAutoSuggestOpen(true)}
        />
      </Box>

      {/* AI 추천 다이얼로그 — 두 패널이 공유 */}
      <AutoSuggestDialog
        open={autoSuggestOpen}
        onClose={() => setAutoSuggestOpen(false)}
        spec={spec}
        onApply={handleAutoSuggestApply}
      />
    </Box>
  );
}

export default DataAndFilterStep;

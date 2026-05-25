/**
 * DataAndFilterStep — ② 데이터·검색조건 단계.
 *   Phase 2E-4: 좌측 layer = 컴팩트 list (height 36px) + 클릭 시 inline accordion.
 *   Phase 2D-3 (재설계): 우측 상단 [🪄 AI 자동완성] 단일 버튼 — 1-click 으로 검색조건 +
 *                        Layer 관계 둘 다 즉시 채움 (다이얼로그·체크 단계 폐기).
 *
 *   Plan: docs/superpowers/plans/2026-05-25-composer-canvas-phase2d3-v2-oneclick.md
 *   Spec: docs/superpowers/specs/2026-05-25-composer-canvas-phase2d3-ai-suggest-design.md
 */
import React, { useState } from 'react';
import { Box, Typography, Chip, Button, Stack, Snackbar, Alert, CircularProgress } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

import DataInlineEditor from './DataInlineEditor';
import FilterBarInlinePanel from './FilterBarInlinePanel';
import LayerRelationsPanel from './LayerRelationsPanel';
import { addRelation } from './wizardState';
import { autoSuggestSpec } from './api';

function DataAndFilterStep({ spec, onChange, targetCd }) {
  const [expandedLayerKey, setExpandedLayerKey] = useState(null);
  const [suggesting, setSuggesting] = useState(false);
  const [snackbar, setSnackbar] = useState(null);  // { severity, message }

  const layers = spec?.layers || [];

  const handleUpdateDataSource = (layerKey, nextDs) => {
    onChange({
      ...spec,
      layers: layers.map((l) => (l.key === layerKey ? { ...l, dataSource: nextDs } : l)),
    });
  };

  // Phase 2D-3 (재설계) — 1-click 자동완성: 호출 → 결과 통째 append → Snackbar.
  // 다이얼로그/체크 없음 — 사용자는 적용 후 inline 으로 직접 수정/제거.
  const handleAutoSuggest = async () => {
    if (suggesting) return;
    setSuggesting(true);
    setSnackbar(null);
    try {
      const res = await autoSuggestSpec(spec);
      const r = res?.data || {};
      const filterFields = Array.isArray(r.filterFields) ? r.filterFields : [];
      const relations    = Array.isArray(r.relations)    ? r.relations    : [];

      if (filterFields.length === 0 && relations.length === 0) {
        setSnackbar({ severity: 'info', message: 'AI 가 추천할 항목을 찾지 못했습니다. layer / dataSource 를 더 채워보세요.' });
        return;
      }

      let next = spec;

      // 1. filterFields append + 모든 layer affects 에 default 등록 (f8d675f 정책 유지)
      filterFields.forEach((f) => {
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

      // 2. relations append (addRelation helper — id 자동)
      relations.forEach((r2) => {
        next = addRelation(next, {
          source:  { layerKey: r2.sourceLayerKey, event: r2.sourceEvent },
          target:  { layerKey: r2.targetLayerKey, action: r2.targetAction },
          mapping: r2.mapping || {},
        });
      });

      onChange(next);
      setSnackbar({
        severity: 'success',
        message: `검색조건 ${filterFields.length}개 · 관계 ${relations.length}개 추가됨.`,
      });
    } catch (e) {
      setSnackbar({
        severity: 'error',
        message: 'AI 호출 실패: ' + (e?.response?.data?.message
                                     || e?.response?.data?.error
                                     || e?.message
                                     || 'unknown'),
      });
    } finally {
      setSuggesting(false);
    }
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

      {/* ── 우측 ~280px column ── */}
      <Box sx={{
        flexShrink: 0, width: 280,
        display: 'flex', flexDirection: 'column', gap: 1.5,
        minHeight: 0, overflow: 'auto',
      }}>
        {/* AI 자동완성 — 1-click 통합 버튼 (FilterBar + 관계 둘 다 즉시 채움) */}
        <Button
          variant="contained"
          fullWidth
          disabled={suggesting || layers.length === 0}
          onClick={handleAutoSuggest}
          startIcon={suggesting
            ? <CircularProgress size={14} sx={{ color: '#fff' }} />
            : <AutoFixHighIcon fontSize="small" />}
          sx={{
            bgcolor: '#9D8FD4', color: '#fff', fontWeight: 700,
            fontSize: 12, letterSpacing: '0.02em',
            boxShadow: '0 2px 8px rgba(157,143,212,0.25)',
            '&:hover': { bgcolor: '#8B7DCA' },
            '&.Mui-disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' },
          }}
        >
          {suggesting ? 'AI 분석 중...' : 'AI 자동완성 — 검색조건 + 관계'}
        </Button>

        <FilterBarInlinePanel spec={spec} onChange={onChange} />
        <LayerRelationsPanel spec={spec} onChange={onChange} />
      </Box>

      {/* 자동완성 결과 Snackbar */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snackbar ? (
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar(null)}
            sx={{ fontWeight: 600 }}
          >
            {snackbar.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}

export default DataAndFilterStep;

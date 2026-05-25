/**
 * AutoSuggestDialog — Phase 2D-3.
 *   현재 ComposerSpec 을 backend AI 에 보내 FilterBar/Layer 관계 추천 받기.
 *   사용자가 항목별 체크 → [선택 적용] → onApply 호출 (append, 덮어쓰기 X).
 *
 *   props:
 *     open
 *     onClose
 *     spec               ComposerSpec (전체 — backend 가 필요 필드 추출)
 *     onApply({ filterFields, relations })  사용자가 선택한 항목만 전달
 *
 *   Plan: docs/superpowers/plans/2026-05-25-composer-canvas-phase2d3.md
 *   Spec: docs/superpowers/specs/2026-05-25-composer-canvas-phase2d3-ai-suggest-design.md
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, IconButton, List, ListItem, ListItemText,
  Checkbox, CircularProgress, Alert, Stack, Chip, Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import LinkIcon from '@mui/icons-material/Link';
import FilterListIcon from '@mui/icons-material/FilterList';

import { autoSuggestSpec } from './api';

function AutoSuggestDialog({ open, onClose, spec, onApply }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [result, setResult]   = useState(null);  // { filterFields, relations }
  const [selectedFields, setSelectedFields]       = useState(new Set());
  const [selectedRelations, setSelectedRelations] = useState(new Set());

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedFields(new Set());
    setSelectedRelations(new Set());

    autoSuggestSpec(spec)
      .then((res) => {
        const r = res.data || {};
        const ff = Array.isArray(r.filterFields) ? r.filterFields : [];
        const rr = Array.isArray(r.relations)    ? r.relations    : [];
        setResult({ filterFields: ff, relations: rr });
        // 기본은 모두 선택
        setSelectedFields(new Set(ff.map((_, i) => i)));
        setSelectedRelations(new Set(rr.map((_, i) => i)));
      })
      .catch((e) => {
        setError(e?.response?.data?.message
              || e?.response?.data?.error
              || e?.message
              || 'AI 호출 실패');
      })
      .finally(() => setLoading(false));
  }, [open, spec]);

  const toggleField = (idx) => {
    const next = new Set(selectedFields);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    setSelectedFields(next);
  };
  const toggleRelation = (idx) => {
    const next = new Set(selectedRelations);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    setSelectedRelations(next);
  };

  const toggleAllFields = () => {
    if (!result) return;
    if (selectedFields.size === result.filterFields.length) {
      setSelectedFields(new Set());
    } else {
      setSelectedFields(new Set(result.filterFields.map((_, i) => i)));
    }
  };
  const toggleAllRelations = () => {
    if (!result) return;
    if (selectedRelations.size === result.relations.length) {
      setSelectedRelations(new Set());
    } else {
      setSelectedRelations(new Set(result.relations.map((_, i) => i)));
    }
  };

  const handleApply = () => {
    if (!result) return;
    const fields = result.filterFields.filter((_, i) => selectedFields.has(i));
    const rels   = result.relations.filter((_, i) => selectedRelations.has(i));
    onApply({ filterFields: fields, relations: rels });
    onClose();
  };

  const hasNothing = result
    && (result.filterFields.length === 0)
    && (result.relations.length === 0);
  const selectedTotal = selectedFields.size + selectedRelations.size;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoFixHighIcon sx={{ color: '#9D8FD4' }} />
          <Typography variant="h6" sx={{ color: '#3A4A63', fontWeight: 800 }}>
            AI 추천 — 검색조건 + Layer 관계
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Stack alignItems="center" spacing={1.5} sx={{ py: 4 }}>
            <CircularProgress size={32} sx={{ color: '#9D8FD4' }} />
            <Typography variant="caption" sx={{ color: '#6E7E96' }}>
              Claude 분석 중 — 잠시 기다려 주세요...
            </Typography>
          </Stack>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {result && hasNothing && (
          <Alert severity="info">
            추천할 항목이 없습니다. layers / dataSource 를 더 채운 뒤 다시 시도해 주세요.
          </Alert>
        )}

        {result && !hasNothing && (
          <Stack spacing={2}>
            {/* FilterBar 추천 */}
            {result.filterFields.length > 0 && (
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <FilterListIcon sx={{ fontSize: 18, color: '#8FC4D4' }} />
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#3A4A63', flex: 1 }}>
                    FilterBar 추천 ({result.filterFields.length})
                  </Typography>
                  <Button size="small" onClick={toggleAllFields} sx={{ fontSize: 11, color: '#6E7E96' }}>
                    {selectedFields.size === result.filterFields.length ? '전체 해제' : '전체 선택'}
                  </Button>
                </Stack>
                <List dense sx={{ border: '1px solid #e2e8f0', borderRadius: 1 }}>
                  {result.filterFields.map((f, i) => (
                    <ListItem key={i} dense button onClick={() => toggleField(i)} sx={{ py: 0.5 }}>
                      <Checkbox edge="start" checked={selectedFields.has(i)} tabIndex={-1} disableRipple
                                sx={{ color: '#8FC4D4', '&.Mui-checked': { color: '#8FC4D4' }, p: 0.5 }} />
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={0.7}>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#3A4A63' }}>
                              {f.label}
                            </Typography>
                            <Chip size="small" label={f.type}
                                  sx={{ height: 16, fontSize: 10, fontFamily: 'monospace',
                                         bgcolor: '#f1f5f9', color: '#6E7E96' }} />
                          </Stack>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {result.filterFields.length > 0 && result.relations.length > 0 && <Divider />}

            {/* 관계 추천 */}
            {result.relations.length > 0 && (
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <LinkIcon sx={{ fontSize: 18, color: '#9D8FD4' }} />
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#3A4A63', flex: 1 }}>
                    Layer 관계 추천 ({result.relations.length})
                  </Typography>
                  <Button size="small" onClick={toggleAllRelations} sx={{ fontSize: 11, color: '#6E7E96' }}>
                    {selectedRelations.size === result.relations.length ? '전체 해제' : '전체 선택'}
                  </Button>
                </Stack>
                <List dense sx={{ border: '1px solid #e2e8f0', borderRadius: 1 }}>
                  {result.relations.map((r, i) => {
                    const mapStr = r.mapping && Object.keys(r.mapping).length > 0
                      ? Object.entries(r.mapping).map(([k, v]) => `${k}→${v}`).join(', ')
                      : 'mapping 없음';
                    return (
                      <ListItem key={i} dense button onClick={() => toggleRelation(i)} sx={{ py: 0.5 }}>
                        <Checkbox edge="start" checked={selectedRelations.has(i)} tabIndex={-1} disableRipple
                                  sx={{ color: '#9D8FD4', '&.Mui-checked': { color: '#9D8FD4' }, p: 0.5 }} />
                        <ListItemText
                          primary={
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#3A4A63' }}>
                              {r.sourceLayerKey}
                              <Typography component="span" sx={{ fontSize: 11, color: '#6E7E96', mx: 0.5, fontFamily: 'monospace' }}>
                                ({r.sourceEvent})
                              </Typography>
                              <Typography component="span" sx={{ fontSize: 13, color: '#9D8FD4', mx: 0.5 }}>
                                →
                              </Typography>
                              {r.targetLayerKey}
                              <Typography component="span" sx={{ fontSize: 11, color: '#6E7E96', mx: 0.5, fontFamily: 'monospace' }}>
                                ({r.targetAction})
                              </Typography>
                            </Typography>
                          }
                          secondary={
                            <Typography sx={{ fontSize: 11, color: '#6E7E96', fontFamily: 'monospace' }}>
                              {mapStr}
                            </Typography>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1 }}>
        <Button onClick={onClose}>닫기</Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={!result || hasNothing || selectedTotal === 0}
          sx={{ bgcolor: '#9D8FD4', '&:hover': { bgcolor: '#8B7DCA' } }}
        >
          선택 적용 {selectedTotal > 0 && `(${selectedTotal})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AutoSuggestDialog;

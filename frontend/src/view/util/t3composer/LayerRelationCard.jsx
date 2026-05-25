/**
 * LayerRelationCard — 개별 layer 관계 카드 (inline 편집).
 *   상위 LayerRelationsPanel 이 controlled props 로 호출.
 *
 *   props:
 *     relation    {id, source, target, mapping}
 *     layers      spec.layers (dropdown 옵션)
 *     onUpdate(patch)  source/target/mapping 변경
 *     onRemove()       관계 삭제
 *
 *   Plan: docs/superpowers/plans/2026-05-25-composer-canvas-phase2d2a.md (Task 2)
 */
import React from 'react';
import {
  Box, Stack, Typography, Select, MenuItem, FormControl, TextField, IconButton, Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export const SOURCE_EVENTS = [
  { value: 'cellClick',       label: 'cellClick (셀 클릭)' },
  { value: 'cellDblClick',    label: 'cellDblClick (셀 더블클릭)' },
  { value: 'selectionChange', label: 'selectionChange (행 선택)' },
  { value: 'valueChange',     label: 'valueChange (form/chart 값 변경)' },
  { value: 'manual',          label: 'manual (사용자 버튼)' },
];

export const TARGET_ACTIONS = [
  { value: 'refetch',  label: 'refetch (재조회)' },
  { value: 'filter',   label: 'filter (로컬 필터)' },
  { value: 'setValue', label: 'setValue (값만 갱신)' },
];

function LayerRelationCard({ relation, layers, onUpdate, onRemove }) {
  const mapping = relation.mapping || {};
  const mappingEntries = Object.entries(mapping);

  const updateSource = (key, value) => {
    onUpdate({ source: { ...relation.source, [key]: value } });
  };
  const updateTarget = (key, value) => {
    onUpdate({ target: { ...relation.target, [key]: value } });
  };
  const addMappingPair = () => {
    const newKey = `field_${mappingEntries.length + 1}`;
    onUpdate({ mapping: { ...mapping, [newKey]: '' } });
  };
  const updateMappingPair = (oldKey, newKey, newVal) => {
    const next = { ...mapping };
    delete next[oldKey];
    next[newKey] = newVal;
    onUpdate({ mapping: next });
  };
  const removeMappingPair = (key) => {
    const next = { ...mapping };
    delete next[key];
    onUpdate({ mapping: next });
  };

  const selfRel = relation.source?.layerKey
    && relation.source.layerKey === relation.target?.layerKey;

  return (
    <Box sx={{
      bgcolor: '#fff', border: `1px solid ${selfRel ? '#E0989A' : '#e2e8f0'}`,
      borderRadius: 1, p: 1, display: 'flex', flexDirection: 'column', gap: 0.7,
    }}>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#3A4A63', flex: 1 }}>
          관계 {selfRel && (
            <Typography component="span" sx={{ fontSize: 10, color: '#E0989A', ml: 0.5 }}>
              ⚠ self-loop
            </Typography>
          )}
        </Typography>
        <IconButton size="small" onClick={onRemove} sx={{ p: 0.3 }}>
          <DeleteIcon fontSize="small" sx={{ color: '#E0989A' }} />
        </IconButton>
      </Stack>

      <Box>
        <Typography sx={{ fontSize: 10, color: '#6E7E96', fontWeight: 700 }}>Source</Typography>
        <FormControl size="small" variant="standard" fullWidth>
          <Select
            value={relation.source?.layerKey || ''}
            onChange={(e) => updateSource('layerKey', e.target.value)}
            displayEmpty
            sx={{ fontSize: 11, color: '#3A4A63' }}
          >
            <MenuItem value="" sx={{ fontSize: 11, fontStyle: 'italic', color: '#94a3b8' }}>(layer 선택)</MenuItem>
            {layers.map((l) => (
              <MenuItem key={l.key} value={l.key} sx={{ fontSize: 11 }}>
                {l.title || l.key} <span style={{ color: '#94a3b8', marginLeft: 4 }}>({l.key})</span>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" variant="standard" fullWidth sx={{ mt: 0.3 }}>
          <Select
            value={relation.source?.event || 'cellClick'}
            onChange={(e) => updateSource('event', e.target.value)}
            sx={{ fontSize: 11, color: '#6E7E96' }}
          >
            {SOURCE_EVENTS.map((ev) => (
              <MenuItem key={ev.value} value={ev.value} sx={{ fontSize: 11 }}>
                {ev.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', color: '#9D8FD4' }}>
        <ArrowForwardIcon fontSize="small" />
      </Box>

      <Box>
        <Typography sx={{ fontSize: 10, color: '#6E7E96', fontWeight: 700 }}>Target</Typography>
        <FormControl size="small" variant="standard" fullWidth>
          <Select
            value={relation.target?.layerKey || ''}
            onChange={(e) => updateTarget('layerKey', e.target.value)}
            displayEmpty
            sx={{ fontSize: 11, color: '#3A4A63' }}
          >
            <MenuItem value="" sx={{ fontSize: 11, fontStyle: 'italic', color: '#94a3b8' }}>(layer 선택)</MenuItem>
            {layers.map((l) => (
              <MenuItem key={l.key} value={l.key} sx={{ fontSize: 11 }}>
                {l.title || l.key} <span style={{ color: '#94a3b8', marginLeft: 4 }}>({l.key})</span>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" variant="standard" fullWidth sx={{ mt: 0.3 }}>
          <Select
            value={relation.target?.action || 'refetch'}
            onChange={(e) => updateTarget('action', e.target.value)}
            sx={{ fontSize: 11, color: '#6E7E96' }}
          >
            {TARGET_ACTIONS.map((a) => (
              <MenuItem key={a.value} value={a.value} sx={{ fontSize: 11 }}>
                {a.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mt: 0.3 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography sx={{ fontSize: 10, color: '#6E7E96', fontWeight: 700, flex: 1 }}>
            Mapping (source 필드 → target param)
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon fontSize="small" />}
            onClick={addMappingPair}
            sx={{ fontSize: 10, color: '#6D5FA8', minWidth: 0, p: 0.2 }}
          >
            추가
          </Button>
        </Stack>
        {mappingEntries.length === 0 && (
          <Typography sx={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}>
            mapping 없음 — source row 전체가 전달됨
          </Typography>
        )}
        {mappingEntries.map(([k, v]) => (
          <Stack key={k} direction="row" alignItems="center" spacing={0.3} sx={{ mt: 0.2 }}>
            <TextField
              value={k}
              onChange={(e) => updateMappingPair(k, e.target.value, v)}
              placeholder="source 필드"
              size="small" variant="standard"
              sx={{ flex: 1, '& input': { fontSize: 10, fontFamily: 'monospace' } }}
            />
            <Typography sx={{ fontSize: 11, color: '#9D8FD4' }}>→</Typography>
            <TextField
              value={v}
              onChange={(e) => updateMappingPair(k, k, e.target.value)}
              placeholder="target param"
              size="small" variant="standard"
              sx={{ flex: 1, '& input': { fontSize: 10, fontFamily: 'monospace' } }}
            />
            <IconButton size="small" onClick={() => removeMappingPair(k)} sx={{ p: 0.2 }}>
              <DeleteIcon fontSize="small" sx={{ color: '#E0989A', fontSize: 14 }} />
            </IconButton>
          </Stack>
        ))}
      </Box>
    </Box>
  );
}

export default LayerRelationCard;

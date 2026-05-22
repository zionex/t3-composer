/**
 * DataMiniDialog — ComposerCanvas 에서 layer 박스를 클릭했을 때 뜨는 MUI Dialog.
 *
 *   props:
 *     open      : boolean
 *     onClose   : () => void
 *     layer     : ComposerSpec.layers[i]  (편집 대상)
 *     onApply   : (nextLayer) => void     (수정된 layer 전달)
 *     onOpenDataSourcePicker?: () => void (풀스크린 별자리 탐색 진입, optional Phase 1)
 *
 *   디자인: docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md
 *           "Mini Dialog 디자인" 섹션
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase1.md (Task 3)
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Chip, Typography, IconButton, Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

const REF_KINDS = [
  { kind: 'TABLE',  label: 'Table',  color: '#3b82f6' },
  { kind: 'SP',     label: 'SP',     color: '#8b5cf6' },
  { kind: 'ENTITY', label: 'JPA Entity', color: '#10b981' },
];

function DataMiniDialog({ open, onClose, layer, onApply, onOpenDataSourcePicker }) {
  const [naturalText, setNaturalText] = useState('');
  const [references, setReferences]   = useState([]);  // [{kind, name}]
  const [addKind, setAddKind]         = useState(null); // 'TABLE'|'SP'|'ENTITY'
  const [addName, setAddName]         = useState('');

  // open 시 layer 의 현재 값으로 hydrate
  useEffect(() => {
    if (!open) return;
    setNaturalText(layer?.dataSource?.naturalText || '');
    setReferences(layer?.dataSource?.references || []);
    setAddKind(null);
    setAddName('');
  }, [open, layer]);

  const handleAddRef = () => {
    if (!addKind || !addName.trim()) return;
    setReferences([...references, { kind: addKind, name: addName.trim() }]);
    setAddKind(null);
    setAddName('');
  };
  const handleRemoveRef = (idx) => {
    setReferences(references.filter((_, i) => i !== idx));
  };

  const handleApply = () => {
    const inferredMode = references.length > 0
      ? (references.length === 1 ? references[0].kind : 'MIXED')
      : 'NL';
    onApply({
      ...layer,
      dataSource: {
        ...(layer?.dataSource || {}),
        mode: inferredMode,
        naturalText,
        references,
      },
    });
    onClose();
  };

  if (!layer) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ color: '#1e40af', fontWeight: 800 }}>
            📊 {layer.title || layer.key} · 데이터
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            type: {layer.type} {layer.subtype ? `· ${layer.subtype}` : ''}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* 자연어 입력 */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
          💬 화면 설명 (자연어)
        </Typography>
        <TextField
          value={naturalText}
          onChange={(e) => setNaturalText(e.target.value)}
          fullWidth multiline minRows={3} maxRows={8}
          placeholder='예: "사용자 마스터. ID·USERNAME·DISPLAY_NAME·ENABLED 컬럼."'
          sx={{ mt: 0.5, mb: 1.5,
                '& .MuiOutlinedInput-root': { fontSize: 13, bgcolor: '#f8fafc' } }}
        />

        {/* 참조 영역 */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
          🔗 데이터 객체 참조 (선택) — 정확한 Table/SP/Entity 명시
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mt: 0.7, mb: 1 }}>
          {references.map((ref, idx) => {
            const meta = REF_KINDS.find(k => k.kind === ref.kind);
            return (
              <Chip
                key={`${ref.kind}-${ref.name}-${idx}`}
                label={`${meta?.label || ref.kind}: ${ref.name}`}
                onDelete={() => handleRemoveRef(idx)}
                size="small"
                sx={{ bgcolor: `${meta?.color || '#64748b'}22`,
                      color: meta?.color || '#64748b', fontWeight: 700 }}
              />
            );
          })}
        </Box>

        {/* 참조 추가 */}
        {addKind === null && (
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {REF_KINDS.map(k => (
              <Button key={k.kind} size="small" variant="outlined"
                      onClick={() => setAddKind(k.kind)}
                      sx={{ fontSize: 11, py: 0.3, borderColor: k.color, color: k.color }}>
                + {k.label}
              </Button>
            ))}
            {onOpenDataSourcePicker && (
              <Button size="small" variant="outlined" startIcon={<SearchIcon fontSize="small" />}
                      onClick={onOpenDataSourcePicker}
                      sx={{ fontSize: 11, py: 0.3, borderColor: '#facc15', color: '#713f12' }}>
                Data Source 탐색
              </Button>
            )}
          </Stack>
        )}
        {addKind !== null && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" sx={{ fontWeight: 700,
                                                 color: REF_KINDS.find(k => k.kind === addKind)?.color }}>
              + {REF_KINDS.find(k => k.kind === addKind)?.label} 이름:
            </Typography>
            <TextField
              value={addName} onChange={(e) => setAddName(e.target.value)}
              size="small" autoFocus
              placeholder={addKind === 'TABLE' ? 'TB_AD_USER' :
                           addKind === 'SP' ? 'SP_UI_AD_01_Q1' : 'User'}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddRef(); }}
              sx={{ flex: 1, '& .MuiOutlinedInput-input': { fontSize: 12, fontFamily: 'monospace' } }}
            />
            <Button size="small" variant="contained" onClick={handleAddRef}
                    disabled={!addName.trim()}>추가</Button>
            <Button size="small" onClick={() => { setAddKind(null); setAddName(''); }}>취소</Button>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1 }}>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleApply} variant="contained">적용</Button>
      </DialogActions>
    </Dialog>
  );
}

export default DataMiniDialog;

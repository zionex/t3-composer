/**
 * DataMiniDialog — layer 의 dataSource 편집 popup (ComposerCanvas 의 layer 클릭 시 사용).
 *
 *   Phase 2E-4 이후: 본문은 DataInlineEditor (controlled) 로 위임. 본 Dialog 는 local
 *   buffer 유지 — [적용] 버튼 클릭 시 onApply 호출. DataAndFilterStep accordion 은
 *   DataInlineEditor 를 직접 사용 (popup 미경유).
 *
 *   props:
 *     open      : boolean
 *     onClose   : () => void
 *     layer     : ComposerSpec.layers[i]
 *     onApply   : (nextLayer) => void
 *     targetCd? : string
 *     onOpenDataSourcePicker?: () => void
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import DataInlineEditor from './DataInlineEditor';

function DataMiniDialog({ open, onClose, layer, onApply, targetCd, onOpenDataSourcePicker }) {
  const [bufferDs, setBufferDs] = useState(null);

  useEffect(() => {
    if (!open) return;
    setBufferDs(layer?.dataSource || { mode: 'NL', naturalText: '', references: [], sqlBlocks: [] });
  }, [open, layer]);

  const handleApply = () => {
    onApply({ ...layer, dataSource: bufferDs });
    onClose();
  };

  if (!layer) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
        <DataInlineEditor
          dataSource={bufferDs}
          onChange={setBufferDs}
          targetCd={targetCd}
          onOpenDataSourcePicker={onOpenDataSourcePicker}
        />
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1 }}>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleApply} variant="contained">적용</Button>
      </DialogActions>
    </Dialog>
  );
}

export default DataMiniDialog;

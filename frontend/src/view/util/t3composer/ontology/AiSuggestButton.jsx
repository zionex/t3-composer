import React, { useState, useCallback } from 'react';
import {
  Box, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, CircularProgress, Stack,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { ontologySuggest } from '../api';

/**
 * 필드 옆 ✨ 버튼 — Claude 1회 호출 → diff 모달 → 사용자 수락 시 onAccept(value).
 * Props:
 *  - field     : 'question'|'answer'|'paraphrases'|'relatedEntityIds'|'domain'
 *  - kind      : 'QA' | 'ENTITY'
 *  - targetCd  : string
 *  - currentValue : 현재 필드 값 (diff 표시용)
 *  - row       : 현재 row 전체 (Claude 가 컨텍스트로 사용)
 *  - onAccept(value) : 수락 콜백
 */
function AiSuggestButton({ field, kind, targetCd, currentValue, row, onAccept, size = 'small' }) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [error, setError] = useState(null);

  const handleClick = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setSuggestion(null);
    try {
      const r = await ontologySuggest({ field, kind, targetCd, row });
      if (!r.data?.ok) throw new Error(r.data?.message || 'AI 제안 실패');
      setSuggestion(r.data.value);
      setOpen(true);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'AI 제안 실패');
      setOpen(true);
    } finally {
      setBusy(false);
    }
  }, [field, kind, targetCd, row, busy]);

  const handleAccept = () => {
    onAccept?.(suggestion);
    setOpen(false);
  };

  const renderValue = (v) => {
    if (v == null) return <Typography sx={{ color: '#6E7E96' }}>(빈 값)</Typography>;
    if (Array.isArray(v)) {
      return v.length === 0
        ? <Typography sx={{ color: '#6E7E96' }}>(빈 배열)</Typography>
        : <ul style={{ margin: 0, paddingLeft: 18 }}>{v.map((x, i) =>
            <li key={i} style={{ fontSize: 12 }}>{String(x)}</li>)}</ul>;
    }
    return <Box sx={{ whiteSpace: 'pre-wrap', fontSize: 12, fontFamily: 'monospace' }}>
      {String(v)}
    </Box>;
  };

  return (
    <>
      <Tooltip title={`✨ AI 제안 — ${field}`}>
        <span>
          <IconButton size={size} onClick={handleClick} disabled={busy}
            sx={{ color: '#9D8FD4', '&:hover': { bgcolor: 'rgba(157,143,212,0.12)' } }}>
            {busy ? <CircularProgress size={16} /> : <AutoAwesomeIcon fontSize="small" />}
          </IconButton>
        </span>
      </Tooltip>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>✨ AI 제안 — {field}</DialogTitle>
        <DialogContent dividers>
          {error && <Typography sx={{ color: '#E0989A', mb: 2 }}>오류: {error}</Typography>}
          {!error && (
            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1, p: 1.5, border: '1px solid rgba(124,167,224,0.30)', borderRadius: 1 }}>
                <Typography sx={{ fontSize: 11, color: '#6E7E96', mb: 1 }}>현재값</Typography>
                {renderValue(currentValue)}
              </Box>
              <Box sx={{ flex: 1, p: 1.5,
                          border: '1px solid rgba(157,143,212,0.40)', borderRadius: 1,
                          bgcolor: 'rgba(157,143,212,0.06)' }}>
                <Typography sx={{ fontSize: 11, color: '#9D8FD4', mb: 1, fontWeight: 700 }}>
                  제안값 (Claude)
                </Typography>
                {renderValue(suggestion)}
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>거부</Button>
          {!error && (
            <Button variant="contained" onClick={handleAccept}
              sx={{ bgcolor: '#9D8FD4', '&:hover': { bgcolor: '#8675c8' } }}>
              수락 — 필드에 적용
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AiSuggestButton;

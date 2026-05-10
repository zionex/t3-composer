import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Alert } from '@mui/material';

/**
 * Stub — t3composer 단독 환경에 부재한 직위 선택 팝업.
 */
function PopPosition({ open, onClose, confirm, multiple, ...rest }) {
  return (
    <Dialog open={!!open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>직위 선택</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          직위 마스터 조회 — 데이터가 없습니다.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
        <Button
          variant="contained"
          onClick={() => {
            if (confirm) confirm([]);
            if (onClose) onClose();
          }}
        >확인</Button>
      </DialogActions>
    </Dialog>
  );
}

export default PopPosition;

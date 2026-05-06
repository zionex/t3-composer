import React from 'react';

import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, IconButton, Box, Typography, Stack, Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import PatternSelector from './PatternSelector';

/**
 * 자연어(NEW_NL) 모드에서 사용자가 선택적으로 UI 패턴을 고를 수 있는 POPUP.
 *
 * - 기존 PatternSelector(단일 선택, 카테고리 필터, 검색, 미리보기) 를 그대로 재사용.
 * - 선택은 선택사항. 선택 안 해도 자연어만으로 진행 가능.
 * - "선택 해제" 버튼으로 이미 고른 패턴을 비울 수 있음.
 *
 * props:
 *   open                 boolean
 *   onClose()            취소 (선택 변경 없음)
 *   currentValue         이미 선택된 패턴 code 또는 null
 *   recommendedCodes     모듈별 추천 코드 배열
 *   onConfirm(pattern)   확인 — pattern 은 { code, name, layout, category, description } 또는 null (해제)
 *   patternsCache        (선택) 부모가 이미 로드한 패턴 목록 — onConfirm 시 객체 lookup 용
 */
function PatternPickerDialog({
  open, onClose, currentValue, recommendedCodes = [], onConfirm,
  patternsCache = [],
}) {
  const [selected, setSelected] = React.useState(currentValue || null);

  React.useEffect(() => {
    if (open) setSelected(currentValue || null);
  }, [open, currentValue]);

  const confirm = () => {
    if (!selected) {
      onConfirm(null);
      return;
    }
    const obj = patternsCache.find((p) => p.code === selected) || { code: selected };
    onConfirm(obj);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: '85vh', borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pr: 6 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>UI 패턴 선택 (선택사항)</Typography>
          {selected && (
            <Chip label={`현재: ${selected}`} size="small" color="primary"
                  onDelete={() => setSelected(null)} />
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          선택하면 Claude 가 해당 패턴을 우선 적용해 화면을 구성합니다. 선택을 비워도 자연어로 진행 가능.
        </Typography>
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2, overflow: 'auto' }}>
        <PatternSelector
          value={selected}
          onChange={setSelected}
          recommendedCodes={recommendedCodes}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Box sx={{ flex: 1 }}>
          {selected
            ? <Typography variant="caption" color="text.secondary">
                선택된 패턴 코드: <b>{selected}</b>
              </Typography>
            : <Typography variant="caption" color="text.disabled">
                패턴 미선택 — Claude 가 자연어로부터 추론합니다
              </Typography>}
        </Box>
        <Button onClick={() => setSelected(null)} disabled={!selected} color="inherit" size="small">
          선택 해제
        </Button>
        <Button onClick={onClose} color="inherit">취소</Button>
        <Button onClick={confirm} variant="contained">확인</Button>
      </DialogActions>
    </Dialog>
  );
}

export default PatternPickerDialog;
